#!/usr/bin/env node
import {getDb} from './lib/db.mjs';
import {run,queries,writeCommands,choice} from './lib/work.mjs';
import {table} from './lib/format.mjs';
const displayColumns={attention:['project','task','owner','due_on','reason'],'owner-load':['owner','weekly_hours','due_week_hours','over_capacity_hours','undated_tasks'],'blocked-work':['project','task','owner','due_on','blockers']};
export const commands=[...Object.keys(queries),'task','project','insights',...writeCommands,'export','weekly-review','draft-handover'];
const argv=process.argv.slice(2),opts={},args=[];
const allowed={
 'add-person':['hours'],'add-project':['owner'],'add-task':['project','owner','due','hours','priority'],
 assign:['owner'],'set-status':['status'],'set-due':['due'],'set-hours':['hours'],log:['text'],depend:['on'],undepend:['on'],
 'add-decision':['project','owner','due'],decide:['outcome'],'review-access':['next','evidence'],'review-retention':['next','evidence'],
 'close-project':['next'],'set-capacity':['hours'],import:['project','map','date-format'],'export':['out']
};
try{
 for(let i=0;i<argv.length;i++){
  const a=argv[i];if(!a.startsWith('--')){args.push(a);continue;}
  const [k,...rest]=a.slice(2).split('=');if(Object.hasOwn(opts,k))throw Error(`Duplicate flag: --${k}`);
  if(['json','help','dry-run'].includes(k)){if(rest.length)throw Error(`--${k} takes no value`);opts[k]=true;}
  else {const value=rest.length?rest.join('='):argv[++i];if(value===undefined||value.startsWith('--'))throw Error(`--${k} requires a value`);opts[k]=value;}
 }
 const command=args.shift();
 if(opts.help||!command){console.log('Work Tracking for Claude Code\nCommands: '+commands.join(', ')+'\nUsage and flags: docs/cli.md\nReads: --json. Writes: --actor "Your name" [--dry-run].');}
 else {
  if(!commands.includes(command))throw Error(`Unknown command: ${command}`);
  const isWrite=writeCommands.includes(command);const flags=['json',...(allowed[command]||[]),...(isWrite?['actor','dry-run']:[])];
  for(const k of Object.keys(opts))if(!flags.includes(k))throw Error(`Unsupported flag --${k} for ${command}`);
  const expected=command==='import'?2:(['task','project','draft-handover',...writeCommands.filter(c=>c!=='import')].includes(command)?1:0);
  if(args.length!==expected)throw Error(`${command} expects ${expected} positional argument(s); quote names containing spaces`);
  if(opts['date-format'])choice(opts['date-format'],['ISO','DMY'],'date format');
  const db=await getDb();try{const result=await run(db,command,args,opts);
   if(opts.json)console.log(JSON.stringify(result,null,2));
   else if(Array.isArray(result)&&command!=='insights')console.log(table(result,(displayColumns[command]||Object.keys(result[0]||{})).map(key=>({key,label:key,width:key==='id'?8:60,format:v=>v==null?'':typeof v==='object'?JSON.stringify(v):v}))));
   else console.log(JSON.stringify(result,null,2));
  }finally{await db.close();}
 }
}catch(e){console.error(JSON.stringify({error:e.message,...(e.candidates?{candidates:e.candidates}:{})}));process.exitCode=1;}
