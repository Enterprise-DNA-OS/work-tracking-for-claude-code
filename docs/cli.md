# CLI reference

Run `npm run work -- <command>`. Reads print human tables by default and accept `--json`. Writes also require `--actor="Name"` and accept `--dry-run`, which rolls back the whole transaction, including the activity entry. Flags accept `--name=value` or `--name value`. Quote multiword values. Unknown commands, unknown flags, duplicate flags, ambiguous names and invalid records exit 1.

Task, person, decision and project references accept an exact UUID, a unique UUID prefix, or a case-insensitive name. If a name matches several records, the error lists their IDs.

## Read commands

- `people`: List each owner and their agreed weekly hours.
- `projects`: List open, overdue and blocked work per project.
- `project` `"Record"`: Read the project, its tasks and decisions. Supply its name or ID.
- `tasks`: Read the complete task board with owners, dates and blockers.
- `task` `"Record"`: Read the task, its notes and unfinished predecessors. Supply its name or ID.
- `attention`: Find overdue work, missing owners, missing dates and tasks without an update for over seven days.
- `due-this-week`: List unfinished tasks due within seven calendar days, including overdue work.
- `blocked-work`: List manual blocks and unfinished predecessors. Read the predecessor before proposing a next step.
- `owner-load`: Compare remaining hours due within seven days, including overdue work, with each owner's weekly capacity. Undated tasks are shown separately.
- `stale-work`: List unfinished work without an update for more than seven days. Draft a follow-up only when asked.
- `decisions`: List decision owners, deadlines and recorded outcomes.
- `dependencies`: List each predecessor and its current status.
- `compliance`: Check access and retention review dates plus the house rules for task owners and dates. Cite docs/compliance.md. A finding is a records prompt, not a legal conclusion.
- `activity`: Read the latest 50 changes. Actor labels identify what was entered, not an authenticated identity.
- `insights`: Answer the ten questions from the recorded tasks, decisions, owners and review dates. Empty results mean no matching records.

## Write commands

Examples use future sample dates. Replace them with the operator's dates. Every command below also needs `--actor="Name"`.

- `add-person "Name" --hours=32`: Add a person.
- `add-project "Project name" --owner="Owner name"`: Open a project.
- `add-task "Task name" --project="Project name" --owner="Owner name" --due=2027-01-31 --hours=4 --priority=normal`: Add work.
- `assign "Task" --owner="Owner name"`: Assign the owner.
- `set-status "Task" --status=doing`: Record progress.
- `set-due "Task" --due=2027-01-31`: Change a due date.
- `set-hours "Task" --hours=3.5`: Update remaining effort.
- `log "Task" --text="The operator's exact update"`: Record an update.
- `depend "Task" --on="Predecessor task"`: Record a predecessor.
- `undepend "Task" --on="Predecessor task"`: Remove a predecessor link.
- `add-decision "Decision title" --project="Project name" --owner="Owner name" --due=2027-01-31`: Record a decision needed.
- `decide "Decision" --outcome="The agreed outcome"`: Record the decision.
- `review-access "Project" --next=2027-01-31 --evidence="What was checked and where the evidence lives"`: Record an access review.
- `review-retention "Project" --next=2027-01-31 --evidence="Purpose for keeping the records and review evidence"`: Record a retention review.
- `close-project "Project" --next=2027-01-31`: Close a project.
- `set-capacity "Owner" --hours=28`: Change weekly capacity.
- `import smartsheet /path/to/tasks.csv --project="Project" --dry-run`: Bring in a Smartsheet task sheet.

Statuses: todo, doing, blocked, done, cancelled. Priorities: low, normal, high. Hours are nonnegative with up to two decimals. Review dates must be future dates. Review evidence is required for review-access and review-retention. The access review checks what the operator records; it cannot inspect actual permissions.

`close-project` requires all tasks to be done or cancelled and all decisions decided. `depend` adds a finish-to-start prerequisite with no lag. Dependency cycles and completed tasks with unfinished prerequisites are rejected. Dependencies do not move dates. `undepend` removes only the named edge.

`import smartsheet <file.csv>` also accepts `--map=<mapping.json>` and `--date-format=ISO|DMY`. It is an all-or-nothing update. Read the replacement guide before importing.

## Files

- `export --out=exports/work.json`: a complete JSON archive of all seven domain tables.
- `weekly-review`: writes a review evidence draft from attention, owner-load and compliance.
- `draft-handover "Project"`: writes a task and decision draft.
- `npm run view`: renders three branded read-only reports.
- `npm run docs`: renders a status report and handover record per project.

Output files are snapshots, not sign-offs or sent messages. Export is an archive; no restore command is promised.
