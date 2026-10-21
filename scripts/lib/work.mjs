import fs from 'node:fs';
import path from 'node:path';
import {parseCsv,pick} from './csv.mjs';
import {REPO_ROOT} from './db.mjs';
export const queries={
 people:'SELECT id,name,weekly_hours,active FROM people ORDER BY name',
 projects:'SELECT * FROM v_project_health ORDER BY project',
 tasks:'SELECT * FROM v_task_board ORDER BY project,due_on NULLS LAST,task',
 attention:'SELECT * FROM v_attention ORDER BY days_overdue DESC,project,task',
 'due-this-week':"SELECT * FROM v_task_board WHERE status NOT IN ('done','cancelled') AND due_on<=CURRENT_DATE+7 ORDER BY due_on,task",
 'blocked-work':"SELECT * FROM v_task_board WHERE status NOT IN ('done','cancelled') AND (blockers>0 OR status='blocked') ORDER BY project,task",
 'owner-load':'SELECT * FROM v_owner_load ORDER BY over_capacity_hours DESC,owner',
 'stale-work':"SELECT * FROM v_task_board WHERE status NOT IN ('done','cancelled') AND last_update_on<CURRENT_DATE-7 ORDER BY last_update_on,task",
 decisions:'SELECT d.id,p.name AS project,d.name,d.status,o.name AS owner,d.due_on,d.outcome FROM decisions d JOIN projects p ON p.id=d.project_id LEFT JOIN people o ON o.id=d.owner_id ORDER BY d.due_on,d.name',
 dependencies:'SELECT d.id,t.name AS task,p.name AS predecessor,p.status AS predecessor_status FROM dependencies d JOIN tasks t ON t.id=d.task_id JOIN tasks p ON p.id=d.predecessor_id ORDER BY t.name,p.name',
 compliance:'SELECT * FROM v_compliance ORDER BY rule,record',
 activity:'SELECT actor,action,entity_id,detail,created_at FROM activity ORDER BY created_at DESC,id LIMIT 50'
};
export const insightQueries=[
 ['Which overdue tasks also block another task?',`SELECT b.project,b.task,b.owner,b.days_overdue,count(d.id)::int AS downstream_tasks FROM v_task_board b JOIN dependencies d ON d.predecessor_id=b.id JOIN tasks child ON child.id=d.task_id WHERE b.days_overdue>0 AND child.status NOT IN ('done','cancelled') GROUP BY b.project,b.task,b.owner,b.days_overdue ORDER BY downstream_tasks DESC,b.task`],
 ['Who has more work due this week than available hours?',`SELECT owner,due_week_hours,weekly_hours,over_capacity_hours FROM v_owner_load WHERE over_capacity_hours>0 ORDER BY owner`],
 ['Which projects have no task owner for work still open?',`SELECT project,count(*)::int AS unassigned FROM v_task_board WHERE owner='Unassigned' AND status NOT IN ('done','cancelled') GROUP BY project ORDER BY project`],
 ['Which overdue tasks have gone quiet?',`SELECT project,task,owner,last_update_on FROM v_task_board WHERE days_overdue>0 AND last_update_on<CURRENT_DATE-7 ORDER BY task`],
 ['Which decisions are late and who owes the answer?',`SELECT p.name AS project,d.name AS decision,o.name AS owner,CURRENT_DATE-d.due_on AS days_late FROM decisions d JOIN projects p ON p.id=d.project_id LEFT JOIN people o ON o.id=d.owner_id WHERE d.status='open' AND d.due_on<CURRENT_DATE ORDER BY d.due_on`],
 ['Which high-priority tasks lack a clear route to completion?',`SELECT project,task,owner,blockers FROM v_task_board WHERE priority='high' AND status NOT IN ('done','cancelled') AND (blockers>0 OR status='blocked' OR owner='Unassigned') ORDER BY task`],
 ['Which closed projects need a retention decision?',`SELECT name,retention_review_on FROM projects WHERE status='closed' AND (retention_review_on IS NULL OR retention_review_on<CURRENT_DATE) ORDER BY name`],
 ['Which owners carry unfinished work across several projects?',`SELECT owner,count(DISTINCT project)::int AS projects,count(*)::int AS open_tasks FROM v_task_board WHERE status NOT IN ('done','cancelled') AND owner<>'Unassigned' GROUP BY owner HAVING count(DISTINCT project)>1 ORDER BY owner`],
 ['Which projects have access reviews missing or overdue?',`SELECT p.name,o.name AS owner,p.access_review_on FROM projects p LEFT JOIN people o ON o.id=p.owner_id WHERE p.access_review_on IS NULL OR p.access_review_on<CURRENT_DATE ORDER BY p.name`],
 ['Which unfinished tasks have no due date and how much work is hidden?',`SELECT project,task,owner,remaining_hours FROM v_task_board WHERE due_on IS NULL AND status NOT IN ('done','cancelled') ORDER BY project,task`]
];
export const writeCommands=['add-person','add-project','add-task','assign','set-status','set-due','set-hours','log','depend','undepend','add-decision','decide','review-access','review-retention','close-project','set-capacity','import'];
export function required(v,label){if(v===undefined||v===null||!String(v).trim())throw Error(`${label} is required`);return String(v).trim();}
export function date(v){v=required(v,'date');if(!/^\d{4}-\d{2}-\d{2}$/.test(v)||!Number.isFinite(Date.parse(v+'T00:00:00Z'))||new Date(v+'T00:00:00Z').toISOString().slice(0,10)!==v)throw Error(`Invalid ISO date: ${v}`);return v;}
export function hours(v){if(!/^(?:0|[1-9]\d*)(?:\.\d{1,2})?$/.test(String(v)))throw Error('Hours must be a nonnegative number with at most two decimals');return Number(v);}
export function choice(v,values,label){if(!values.includes(v))throw Error(`Invalid ${label}: use ${values.join(', ')}`);return v;}
export async function resolve(db,kind,q){
 if(!['tasks','projects','people','decisions'].includes(kind))throw Error('Invalid record type');required(q,kind);
 const rows=await db.query(`SELECT id,name FROM ${kind} ORDER BY name`);
 const exact=rows.filter(r=>r.id===q||r.name.toLowerCase()===q.toLowerCase());
 const found=exact.length?exact:rows.filter(r=>r.id.startsWith(q)||r.name.toLowerCase().includes(q.toLowerCase()));
 if(found.length!==1){const e=Error(found.length?`Ambiguous ${kind}: ${q}`:`No ${kind} match: ${q}`);e.candidates=found;throw e;}return found[0].id;
}
async function audit(db,actor,action,id,detail){await db.query('INSERT INTO activity(actor,action,entity_id,detail) VALUES($1,$2,$3,$4)',[actor,action,id,JSON.stringify(detail)]);}
async function activeProject(db,id){const [p]=await db.query('SELECT status FROM projects WHERE id=$1',[id]);if(p.status!=='active')throw Error('Project is closed');}
async function activeOwner(db,id){const [o]=await db.query('SELECT active FROM people WHERE id=$1',[id]);if(!o.active)throw Error('Owner is inactive');}
export async function assertGraph(db){
 const rows=await db.query('SELECT task_id,predecessor_id FROM dependencies');const edges=new Map();
 for(const r of rows){if(!edges.has(r.task_id))edges.set(r.task_id,[]);edges.get(r.task_id).push(r.predecessor_id);}
 const visited=new Set(),stack=new Set();
 function visit(id){if(stack.has(id))throw Error('Dependency cycle rejected');if(visited.has(id))return;stack.add(id);for(const n of edges.get(id)||[])visit(n);stack.delete(id);visited.add(id);}
 for(const id of edges.keys())visit(id);
 const bad=await db.query("SELECT t.name FROM dependencies d JOIN tasks t ON t.id=d.task_id JOIN tasks p ON p.id=d.predecessor_id WHERE t.status='done' AND p.status<>'done'");
 if(bad.length)throw Error(`Completed task has unfinished predecessor: ${bad[0].name}`);
}
export async function run(db,command,args=[],opts={}){
 if(queries[command])return db.query(queries[command]);
 if(command==='insights'){const out=[];for(const [question,sql] of insightQueries)out.push({question,rows:await db.query(sql)});return out;}
 if(command==='task'){
  const id=await resolve(db,'tasks',args[0]);return {task:(await db.query('SELECT * FROM v_task_board WHERE id=$1',[id]))[0],notes:await db.query('SELECT actor,body,created_at FROM notes WHERE task_id=$1 ORDER BY created_at',[id]),dependencies:await db.query('SELECT p.id,p.name,p.status FROM dependencies d JOIN tasks p ON p.id=d.predecessor_id WHERE d.task_id=$1',[id])};
 }
 if(command==='project'){
  const id=await resolve(db,'projects',args[0]);return {project:(await db.query('SELECT * FROM v_project_health WHERE id=$1',[id]))[0],tasks:await db.query('SELECT * FROM v_task_board WHERE project_id=$1 ORDER BY due_on NULLS LAST,task',[id]),decisions:await db.query('SELECT name,status,due_on,outcome FROM decisions WHERE project_id=$1 ORDER BY due_on',[id])};
 }
 if(command==='export'){
  const data={format:'work-tracking-v1',exported_at:new Date().toISOString(),records:{}};
  for(const n of ['people','projects','tasks','dependencies','notes','decisions','activity'])data.records[n]=await db.query(`SELECT * FROM ${n} ORDER BY id`);
  const file=path.resolve(process.env.OUTPUT_DIR||REPO_ROOT,opts.out||'exports/work.json');fs.mkdirSync(path.dirname(file),{recursive:true,mode:0o700});fs.writeFileSync(file,JSON.stringify(data,null,2)+'\n',{mode:0o600});return {file,counts:Object.fromEntries(Object.entries(data.records).map(([k,v])=>[k,v.length]))};
 }
 if(['weekly-review','draft-handover'].includes(command)){
  const data=command==='weekly-review'?{attention:await run(db,'attention'),load:await run(db,'owner-load'),compliance:await run(db,'compliance')}:await run(db,'project',args);
  const file=path.resolve(process.env.OUTPUT_DIR||REPO_ROOT,'drafts',command+'-'+Date.now()+'.md');fs.mkdirSync(path.dirname(file),{recursive:true,mode:0o700});fs.writeFileSync(file,`# ${command==='weekly-review'?'Weekly work review':'Project handover'}\n\nDraft for operator review. No messages sent.\n\n\`\`\`json\n${JSON.stringify(data,null,2)}\n\`\`\`\n`,{mode:0o600});return {file};
 }
 if(!writeCommands.includes(command))throw Error(`Unknown command: ${command}`);
 const actor=required(opts.actor,'--actor');await db.exec('BEGIN');
 try {
  let id=null,result;
  if(command==='import'){result=await importSheet(db,args,opts);}
  else if(command==='add-person'){id=(await db.query('INSERT INTO people(name,weekly_hours) VALUES($1,$2) RETURNING id',[required(args[0],'name'),hours(opts.hours??35)]))[0].id;}
  else if(command==='add-project'){const owner=await resolve(db,'people',opts.owner);await activeOwner(db,owner);id=(await db.query('INSERT INTO projects(name,owner_id) VALUES($1,$2) RETURNING id',[required(args[0],'name'),owner]))[0].id;}
  else if(command==='add-task'){
   const project=await resolve(db,'projects',opts.project);await activeProject(db,project);
   const owner=opts.owner?await resolve(db,'people',opts.owner):null;if(owner)await activeOwner(db,owner);
   id=(await db.query('INSERT INTO tasks(project_id,name,owner_id,due_on,remaining_hours,priority) VALUES($1,$2,$3,$4,$5,$6) RETURNING id',[project,required(args[0],'name'),owner,opts.due?date(opts.due):null,hours(opts.hours??0),choice(opts.priority||'normal',['low','normal','high'],'priority')]))[0].id;
  } else if(command==='set-capacity'){id=await resolve(db,'people',args[0]);await db.query('UPDATE people SET weekly_hours=$1 WHERE id=$2',[hours(opts.hours),id]);}
  else if(['review-access','review-retention','close-project'].includes(command)){
   id=await resolve(db,'projects',args[0]);
   if(command==='close-project'){
    const open=await db.query("SELECT id FROM tasks WHERE project_id=$1 AND status NOT IN ('done','cancelled') UNION ALL SELECT id FROM decisions WHERE project_id=$1 AND status='open'",[id]);if(open.length)throw Error('Close open tasks and decisions before closing the project');
    const next=date(opts.next);const [clock]=await db.query('SELECT CURRENT_DATE::text AS today');if(next<=clock.today)throw Error('Next review must be in the future');
    await db.query("UPDATE projects SET status='closed',closed_on=CURRENT_DATE,retention_review_on=$1 WHERE id=$2",[next,id]);
   } else {
    const evidence=required(opts.evidence,'--evidence');const next=date(opts.next);const [clock]=await db.query('SELECT CURRENT_DATE::text AS today');if(next<=clock.today)throw Error('Next review must be in the future');
    await db.query(`UPDATE projects SET ${command==='review-access'?'access_review_on':'retention_review_on'}=$1 WHERE id=$2`,[next,id]);result={id,evidence,next};
   }
  } else if(command==='add-decision'){
   const project=await resolve(db,'projects',opts.project);await activeProject(db,project);const owner=await resolve(db,'people',opts.owner);await activeOwner(db,owner);
   id=(await db.query('INSERT INTO decisions(project_id,name,owner_id,due_on) VALUES($1,$2,$3,$4) RETURNING id',[project,required(args[0],'name'),owner,date(opts.due)]))[0].id;
  } else if(command==='decide'){id=await resolve(db,'decisions',args[0]);await db.query("UPDATE decisions SET status='decided',outcome=$1 WHERE id=$2",[required(opts.outcome,'--outcome'),id]);}
  else {
   id=await resolve(db,'tasks',args[0]);const [t]=await db.query('SELECT * FROM tasks WHERE id=$1',[id]);await activeProject(db,t.project_id);
   if(command==='assign'){const owner=await resolve(db,'people',opts.owner);await activeOwner(db,owner);await db.query('UPDATE tasks SET owner_id=$1,last_update_on=CURRENT_DATE WHERE id=$2',[owner,id]);}
   if(command==='set-status'){const status=choice(required(opts.status,'--status'),['todo','doing','blocked','done','cancelled'],'status');await db.query("UPDATE tasks SET status=$1,completed_on=CASE WHEN $1='done' THEN CURRENT_DATE ELSE NULL END,last_update_on=CURRENT_DATE WHERE id=$2",[status,id]);}
   if(command==='set-due')await db.query('UPDATE tasks SET due_on=$1,last_update_on=CURRENT_DATE WHERE id=$2',[date(opts.due),id]);
   if(command==='set-hours')await db.query('UPDATE tasks SET remaining_hours=$1,last_update_on=CURRENT_DATE WHERE id=$2',[hours(opts.hours),id]);
   if(command==='log'){await db.query('INSERT INTO notes(task_id,body,actor) VALUES($1,$2,$3)',[id,required(opts.text,'--text'),actor]);await db.query('UPDATE tasks SET last_update_on=CURRENT_DATE WHERE id=$1',[id]);}
   if(['depend','undepend'].includes(command)){
    const predecessor=await resolve(db,'tasks',opts.on);
    if(command==='depend')await db.query('INSERT INTO dependencies(task_id,predecessor_id) VALUES($1,$2) ON CONFLICT DO NOTHING',[id,predecessor]);
    else await db.query('DELETE FROM dependencies WHERE task_id=$1 AND predecessor_id=$2',[id,predecessor]);
   }
  }
  await assertGraph(db);await audit(db,actor,command,id,{args,opts,result});
  await db.exec(opts['dry-run']?'ROLLBACK':'COMMIT');return {...(result||{id}),dry_run:!!opts['dry-run']};
 } catch(e){await db.exec('ROLLBACK');throw e;}
}

async function importSheet(db,args,opts){
 if(args[0]!=='smartsheet')throw Error('Use import smartsheet <sheet.csv>');
 const rows=parseCsv(fs.readFileSync(required(args[1],'CSV path'),'utf8'));if(!rows.length)throw Error('CSV has no data rows');
 const project=await resolve(db,'projects',opts.project);await activeProject(db,project);
 const mapping=opts.map?JSON.parse(fs.readFileSync(opts.map,'utf8')):{};
 const columns={key:'Task ID',name:'Task Name',owner:'Assigned To',status:'Status',due:'Due Date',hours:'Remaining Hours',priority:'Priority',predecessors:'Predecessors',...mapping.columns};
 const statusMap={'Not Started':'todo','In Progress':'doing','Blocked':'blocked','Complete':'done','Completed':'done','Cancelled':'cancelled',...mapping.statuses};
 const people=await db.query('SELECT id,name,active FROM people');const keys=new Set(),ids=[],depRefs=[];
 let inserted=0,updated=0;
 for(let index=0;index<rows.length;index++){
  const row=rows[index],get=k=>pick(row,columns[k]);const key=required(get('key'),`Row ${index+2}: stable ${columns.key}`);if(keys.has(key))throw Error(`Duplicate Task ID: ${key}`);keys.add(key);
  const name=required(get('name'),`Row ${index+2}: ${columns.name}`);
  const statusRaw=get('status');const status=statusRaw?(statusMap[statusRaw]||statusRaw):'todo';choice(status,['todo','doing','blocked','done','cancelled'],'import status');
  const ownerText=get('owner').trim();const owners=people.filter(p=>p.name.toLowerCase()===ownerText.toLowerCase()&&p.active);if(ownerText&&owners.length!==1)throw Error(`Unknown or ambiguous active owner: ${ownerText}. Add the person first.`);
  let due=get('due').trim();if(due&&opts['date-format']==='DMY'){const m=due.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);if(!m)throw Error(`Expected DMY date: ${due}`);due=`${m[3]}-${m[2].padStart(2,'0')}-${m[1].padStart(2,'0')}`;}
  if(due)date(due);const effort=hours(get('hours')||0);const priority=choice((get('priority')||'normal').toLowerCase(),['low','normal','high'],'priority');
  const [existing]=await db.query('SELECT id FROM tasks WHERE project_id=$1 AND source_key=$2',[project,key]);if(existing)updated++;else inserted++;
  const [task]=await db.query(`INSERT INTO tasks(project_id,source_key,name,owner_id,status,due_on,remaining_hours,priority,source_data,completed_on)
   VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,CASE WHEN $5='done' THEN CURRENT_DATE ELSE NULL END)
   ON CONFLICT(project_id,source_key) DO UPDATE SET name=excluded.name,owner_id=excluded.owner_id,status=excluded.status,due_on=excluded.due_on,remaining_hours=excluded.remaining_hours,priority=excluded.priority,source_data=excluded.source_data,completed_on=CASE WHEN excluded.status='done' THEN coalesce(tasks.completed_on,CURRENT_DATE) ELSE NULL END,last_update_on=CURRENT_DATE RETURNING id`,
   [project,key,name,owners[0]?.id||null,status,due||null,effort,priority,JSON.stringify(row)]);
  ids.push(task.id);
  // Smartsheet predecessors use sheet row numbers. Only complete, unfiltered flat sheets
  // with finish-to-start links and zero lag are accepted; never guess other link semantics.
  const refs=get('predecessors').trim();const parsed=refs?refs.split(',').map(s=>{const m=s.trim().match(/^(\d+)(?:FS)?$/i);if(!m)throw Error(`Unsupported predecessor: ${s}. Only row numbers or zero-lag FS links are supported.`);const n=Number(m[1]);if(n<1||n>rows.length)throw Error(`Predecessor row out of range: ${n}`);return n-1;}):[];depRefs.push(parsed);
 }
 const hasPredecessors=Object.keys(rows[0]).some(k=>k.toLowerCase()===columns.predecessors.toLowerCase());
 if(hasPredecessors){for(const id of ids)await db.query('DELETE FROM dependencies WHERE task_id=$1',[id]);for(let i=0;i<ids.length;i++)for(const n of depRefs[i])await db.query('INSERT INTO dependencies(task_id,predecessor_id) VALUES($1,$2) ON CONFLICT DO NOTHING',[ids[i],ids[n]]);}
 return {inserted,updated,rows:rows.length,dependencies_replaced:hasPredecessors,source:path.basename(args[1])};
}
