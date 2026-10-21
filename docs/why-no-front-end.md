# Why there is no front end

A weekly operations review needs records, a few checks and a clear next action. Work Tracking keeps that in a database and gives the operator commands for the work. The coding agent translates the operator's request, runs the command and reports the evidence.

Read-only HTML reports show the week, project health and missing review evidence. They do not change records. The CLI is where work is assigned, dates change and decisions are recorded.

Smartsheet provides shared screens, visual scheduling, forms, notifications and mobile access. This free base does not provide those experiences, background synchronisation, offline mobile editing or drag-and-drop planning. It does not recalculate a critical path. It is useful for the operator who wants a weekly work register and owns the migration scope. A team needing those screens can have Enterprise DNA build them into its version.

The database is portable Postgres. PGlite runs the same migration locally for the demo. Database hosting, coding-agent subscriptions, backups and support remain separate operating costs. No claim of a zero-cost production deployment is made.
