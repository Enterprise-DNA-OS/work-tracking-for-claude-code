CREATE TABLE people (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), name text NOT NULL UNIQUE CHECK (btrim(name)<>''),
 weekly_hours numeric(8,2) NOT NULL DEFAULT 35 CHECK(weekly_hours>=0), active boolean NOT NULL DEFAULT true,
 created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE projects (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), name text NOT NULL UNIQUE CHECK (btrim(name)<>''),
 owner_id uuid REFERENCES people, status text NOT NULL DEFAULT 'active' CHECK(status IN ('active','closed')),
 access_review_on date, retention_review_on date, closed_on date,
 created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now(),
 CHECK((status='closed')=(closed_on IS NOT NULL))
);
CREATE TABLE tasks (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), project_id uuid NOT NULL REFERENCES projects,
 source_key text, name text NOT NULL CHECK(btrim(name)<>''), owner_id uuid REFERENCES people,
 status text NOT NULL DEFAULT 'todo' CHECK(status IN ('todo','doing','blocked','done','cancelled')),
 due_on date, remaining_hours numeric(10,2) NOT NULL DEFAULT 0 CHECK(remaining_hours>=0),
 priority text NOT NULL DEFAULT 'normal' CHECK(priority IN ('low','normal','high')),
 last_update_on date NOT NULL DEFAULT CURRENT_DATE, completed_on date,
 source_data jsonb NOT NULL DEFAULT '{}',
 created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now(),
 UNIQUE(project_id,source_key), CHECK((status='done')=(completed_on IS NOT NULL))
);
CREATE TABLE dependencies (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), task_id uuid NOT NULL REFERENCES tasks,
 predecessor_id uuid NOT NULL REFERENCES tasks, UNIQUE(task_id,predecessor_id), CHECK(task_id<>predecessor_id),
 created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE notes (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), task_id uuid NOT NULL REFERENCES tasks,
 body text NOT NULL CHECK(btrim(body)<>''), actor text NOT NULL,
 created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE decisions (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), project_id uuid NOT NULL REFERENCES projects,
 name text NOT NULL CHECK(btrim(name)<>''), owner_id uuid REFERENCES people, due_on date NOT NULL,
 status text NOT NULL DEFAULT 'open' CHECK(status IN ('open','decided')), outcome text,
 created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now(),
 CHECK(status='open' OR nullif(btrim(outcome),'') IS NOT NULL)
);
CREATE TABLE activity (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), actor text NOT NULL, action text NOT NULL,
 entity_id uuid, detail jsonb NOT NULL DEFAULT '{}', created_at timestamptz NOT NULL DEFAULT now(),
 updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE FUNCTION touch_updated_at() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at=now(); RETURN NEW; END $$;
DO $$ DECLARE n text; BEGIN
 FOREACH n IN ARRAY ARRAY['people','projects','tasks','dependencies','notes','decisions','activity'] LOOP
  EXECUTE format('CREATE TRIGGER touch_updated BEFORE UPDATE ON %I FOR EACH ROW EXECUTE FUNCTION touch_updated_at()',n);
  EXECUTE format('ALTER TABLE %I ENABLE ROW LEVEL SECURITY',n);
  EXECUTE format('REVOKE ALL ON %I FROM public',n);
 END LOOP;
END $$;
CREATE INDEX tasks_owner_idx ON tasks(owner_id);
CREATE INDEX tasks_project_idx ON tasks(project_id);
CREATE INDEX deps_predecessor_idx ON dependencies(predecessor_id);
CREATE VIEW v_task_board AS
SELECT t.id,t.project_id,p.name AS project,t.name AS task,coalesce(o.name,'Unassigned') AS owner,t.status,t.priority,
 t.due_on,t.remaining_hours,t.last_update_on,
 (SELECT count(*)::int FROM dependencies d JOIN tasks b ON b.id=d.predecessor_id WHERE d.task_id=t.id AND b.status<>'done') AS blockers,
 CASE WHEN t.status NOT IN ('done','cancelled') AND t.due_on<CURRENT_DATE THEN CURRENT_DATE-t.due_on ELSE 0 END AS days_overdue
FROM tasks t JOIN projects p ON p.id=t.project_id LEFT JOIN people o ON o.id=t.owner_id;
CREATE VIEW v_attention AS
SELECT id,project,task,owner,status,due_on,days_overdue,blockers,
 concat_ws('; ',CASE WHEN days_overdue>0 THEN 'Overdue' END,
 CASE WHEN blockers>0 THEN 'Predecessor unfinished' END,CASE WHEN status='blocked' THEN 'Manually blocked' END,
 CASE WHEN owner='Unassigned' THEN 'No owner' END,CASE WHEN due_on IS NULL THEN 'No due date' END,
 CASE WHEN last_update_on<CURRENT_DATE-7 THEN 'No update for over 7 days' END) AS reason
FROM v_task_board WHERE status NOT IN ('done','cancelled') AND
 (days_overdue>0 OR blockers>0 OR status='blocked' OR owner='Unassigned' OR due_on IS NULL OR last_update_on<CURRENT_DATE-7);
CREATE VIEW v_owner_load AS
SELECT o.id,o.name AS owner,o.active,o.weekly_hours,
 count(t.id)::int AS open_tasks,
 coalesce(sum(t.remaining_hours) FILTER(WHERE t.due_on<=CURRENT_DATE+7),0) AS due_week_hours,
 count(t.id) FILTER(WHERE t.due_on IS NULL)::int AS undated_tasks,
 greatest(coalesce(sum(t.remaining_hours) FILTER(WHERE t.due_on<=CURRENT_DATE+7),0)-o.weekly_hours,0) AS over_capacity_hours
FROM people o LEFT JOIN tasks t ON t.owner_id=o.id AND t.status NOT IN ('done','cancelled') GROUP BY o.id;
CREATE VIEW v_project_health AS
SELECT p.id,p.name AS project,p.status,coalesce(o.name,'Unassigned') AS owner,
 count(t.id)::int AS tasks,
 count(t.id) FILTER(WHERE t.status='done')::int AS done,
 count(t.id) FILTER(WHERE t.status NOT IN ('done','cancelled'))::int AS open,
 count(t.id) FILTER(WHERE t.days_overdue>0)::int AS overdue,
 count(t.id) FILTER(WHERE t.blockers>0 AND t.status NOT IN ('done','cancelled'))::int AS blocked
FROM projects p LEFT JOIN people o ON p.owner_id=o.id LEFT JOIN v_task_board t ON p.id=t.project_id GROUP BY p.id,o.name;
CREATE VIEW v_compliance AS
SELECT p.id,p.name AS record,'Access review evidence due'::text AS finding,'NZ-IPP5'::text AS rule,
 'https://www.privacy.org.nz/privacy-principles/5/'::text AS source
FROM projects p WHERE p.access_review_on IS NULL OR p.access_review_on<CURRENT_DATE
UNION ALL SELECT p.id,p.name,'Retention review due','NZ-IPP9','https://www.privacy.org.nz/privacy-principles/9/'
FROM projects p WHERE p.status='closed' AND (p.retention_review_on IS NULL OR p.retention_review_on<CURRENT_DATE)
UNION ALL SELECT t.id,t.name,'Task needs active owner','HOUSE-OWNER','docs/compliance.md'
FROM tasks t LEFT JOIN people o ON o.id=t.owner_id WHERE t.status NOT IN ('done','cancelled') AND (o.id IS NULL OR NOT o.active)
UNION ALL SELECT t.id,t.name,'Open task needs due date','HOUSE-DATE','docs/compliance.md'
FROM tasks t WHERE t.status NOT IN ('done','cancelled') AND t.due_on IS NULL;
REVOKE ALL ON v_task_board,v_attention,v_owner_load,v_project_health,v_compliance FROM public;
