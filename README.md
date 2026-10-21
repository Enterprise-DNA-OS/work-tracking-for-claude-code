<h1 align="center">Work Tracking for Claude Code</h1>

<p align="center">
  <strong>The open-source work tracker that is just a database and Claude Code.</strong>
</p>

<p align="center">
  Created by <a href="https://www.enterprisedna.co"><strong>Enterprise DNA</strong></a>. MIT licensed. Works with Claude Code, Codex, OpenCode or Cursor.
</p>

<!-- three-doors -->
<table align="center">
  <tr>
    <td align="center"><strong>Do it yourself</strong><br/>Clone it, run it, own it. Free, MIT.<br/><a href="#quick-start">Quick start</a></td>
    <td align="center"><strong>We customise it</strong><br/>Your fields, your rules, your Smartsheet data brought across.<br/><a href="https://enterprisedna.co/omni/book/?utm_source=github&utm_medium=readme&utm_campaign=smartsheet">Book a call</a></td>
    <td align="center"><strong>We run it for you</strong><br/>Installed, connected and operated inside Omni. Setup fee, then a retainer.<br/><a href="https://enterprisedna.co/omni/instead-of/smartsheet?utm_source=github&utm_medium=readme&utm_campaign=smartsheet">How it works</a></td>
  </tr>
</table>

<p align="center">
  <a href="#what-is-this">What is this</a> &bull;
  <a href="#why-no-front-end">Why no front end</a> &bull;
  <a href="#quick-start">Quick start</a> &bull;
  <a href="#the-commands">Commands</a> &bull;
  <a href="#instead-of-smartsheet">Instead of Smartsheet</a> &bull;
  <a href="#want-it-installed-and-run-for-you">Installed for you</a> &bull;
  <a href="#license">License</a>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Node-20+-339933?style=flat-square" alt="Node 20+" />
  <img src="https://img.shields.io/badge/PostgreSQL-any-336791?style=flat-square" alt="PostgreSQL" />
  <img src="https://img.shields.io/badge/PGlite-embedded-3ecf8e?style=flat-square" alt="PGlite" />
  <img src="https://img.shields.io/badge/License-MIT-yellow?style=flat-square" alt="MIT License" />
</p>

---

## What is this

Work Tracking for Claude Code is a weekly work desk for an operations lead: tasks, owners, dates, prerequisites, decisions and project review evidence. Ask the coding agent to show late work, record a decision or draft the Monday review. The database keeps the records and the CLI does the work.

Smartsheet lists Business at NZ$32 per member per month billed annually. A calculated 50-member example is NZ$19,200 a year, before add-ons or implementation. This is a public-rate calculation, not an observed customer bill. [Vendor pricing](https://www.smartsheet.com/pricing), checked 21 October 2026.

The free base covers the task-register workflow. Enterprise DNA builds the additional screens, connections and fields agreed for your business. The full Smartsheet platform has a wider scope.

## Five weekly rituals

1. Set the week's commitments with `/due-this-week`.
2. Unblock successors with `/blocked-work` and `/dependencies`.
3. Balance owners with `/owner-load`.
4. Chase missing updates with `/stale-work` and record decisions with `/decide`.
5. Prepare the owner review with `/weekly-review` and `/documents`.

## Quick start

Node 20 or newer. The local demo needs no database account.

```bash
git clone https://github.com/Enterprise-DNA-OS/work-tracking-for-claude-code.git
cd work-tracking-for-claude-code
npm install
npm run demo
npm run work -- attention
npm run work -- insights --json
npm run view
npm run docs
```

Open the folder in Claude Code, Codex, OpenCode or Cursor. Start with `/attention`. AGENTS.md points each runtime at the same operating instructions.

The seed is fictional and idempotent. Dates move relative to the day it is first seeded. Never seed a live register. For an empty real register, use a fresh DATA_DIR and run `npm run migrate`, then add your people and projects. For Postgres or Supabase, set DATABASE_URL in a private .env file and migrate. Connect as the dedicated database owner. Ordinary and anonymous roles have no grants.

## The commands

| Command | Job |
|---|---|
| `/people` | List each owner and their agreed weekly hours. |
| `/projects` | List open, overdue and blocked work per project. |
| `/project` | Read the project, its tasks and decisions. Supply its name or ID. |
| `/tasks` | Read the complete task board with owners, dates and blockers. |
| `/task` | Read the task, its notes and unfinished predecessors. Supply its name or ID. |
| `/attention` | Find overdue work, missing owners, missing dates and tasks without an update for over seven days. |
| `/due-this-week` | List unfinished tasks due within seven calendar days, including overdue work. |
| `/blocked-work` | List manual blocks and unfinished predecessors. Read the predecessor before proposing a next step. |
| `/owner-load` | Compare remaining hours due within seven days, including overdue work, with each owner's weekly capacity. Undated tasks are shown separately. |
| `/stale-work` | List unfinished work without an update for more than seven days. Draft a follow-up only when asked. |
| `/decisions` | List decision owners, deadlines and recorded outcomes. |
| `/dependencies` | List each predecessor and its current status. |
| `/compliance` | Check access and retention review dates plus the house rules for task owners and dates. Cite docs/compliance.md. A finding is a records prompt, not a legal conclusion. |
| `/activity` | Read the latest 50 changes. Actor labels identify what was entered, not an authenticated identity. |
| `/insights` | Answer the ten questions from the recorded tasks, decisions, owners and review dates. Empty results mean no matching records. |
| `/add-person` | Add a person. |
| `/add-project` | Open a project. |
| `/add-task` | Add work. |
| `/assign` | Assign the owner. |
| `/set-status` | Record progress. |
| `/set-due` | Change a due date. |
| `/set-hours` | Update remaining effort. |
| `/log` | Record an update. |
| `/depend` | Record a predecessor. |
| `/undepend` | Remove a predecessor link. |
| `/add-decision` | Record a decision needed. |
| `/decide` | Record the decision. |
| `/review-access` | Record an access review. |
| `/review-retention` | Record a retention review. |
| `/close-project` | Close a project. |
| `/set-capacity` | Change weekly capacity. |
| `/import` | Bring in a Smartsheet task sheet. |
| `/export` | Export the register. |
| `/weekly-review` | Monday work review. |
| `/draft-handover` | Draft a handover. |
| `/view` | Read-only dashboards. |
| `/documents` | Project paperwork. |
| `/customise` | Make the work tracker yours. |
| `/new-view` | Add a read-only report. |

[Full CLI syntax](docs/cli.md). Reads support --json. Every mutation needs --actor and accepts --dry-run. Names and partial IDs resolve only when unique. Writes and imports are transactional. There is no email sender, publisher or background scheduler.

## Ten questions for the Monday review

`/insights` answers these from your actual register. These are supplied cross-record queries, not a claim that no configured Smartsheet report can answer them.

1. Which overdue tasks also block another task?
2. Who has more work due this week than available hours?
3. Which projects have no task owner for work still open?
4. Which overdue tasks have gone quiet?
5. Which decisions are late and who owes the answer?
6. Which high-priority tasks lack a clear route to completion?
7. Which closed projects need a retention decision?
8. Which owners carry unfinished work across several projects?
9. Which projects have access reviews missing or overdue?
10. Which unfinished tasks have no due date and how much work is hidden?

## Documents and views

`npm run docs` renders a project status report and a handover record for each project. `npm run view` renders the week, project health and review evidence. Change the business name, logo and colours in brand.json. All record values are HTML-escaped. These local snapshots stay private until the operator chooses to share them.

## Compliance evidence

`/compliance` flags missing access reviews, closed projects needing a retention review, tasks without active owners and missing due dates. NZ Privacy Act principles 5 and 9 are cited in [docs/compliance.md](docs/compliance.md). Review intervals and task rules are operator policy. This is a records check, not a legal compliance certification or an inspection of actual access controls.

## Your first hour: ten things to ask for

1. Put our business name and colours on the reports.
2. Add our owners and the hours they have available each week.
3. Create our active projects.
4. Import this Smartsheet task export as a dry run.
5. Show the overdue tasks that hold up other work.
6. Show who has too much due this week.
7. Record the decision we made about supplier sign-off.
8. Draft the handover for this project.
9. Add a field for our cost centre through `/customise`.
10. Add a read-only view of high-priority work through `/new-view`.

## Instead of Smartsheet

Export a complete flat task sheet to Excel and save the task worksheet as CSV UTF-8. Use stable Task IDs, add your people and project, then run `import smartsheet`. Column and status mappings are explicit. The importer supports zero-lag finish-to-start predecessor links only and never guesses the rest. [The replacement guide](docs/replace-smartsheet.md) explains defaults, repeat imports and records outside its scope.

## Why no front end

The operator asks for work and the CLI makes the change. Read-only reports provide the views. There is no mobile app, public portal, live collaboration or scheduling engine in this base. [The design and its limits](docs/why-no-front-end.md) explain when a custom screen is needed.

## Architecture and checks

Plain Postgres migration, PGlite local adapter, one CLI, command recipes and branded HTML renderers. No front end or third-party account is needed for the demo. `npm test` uses a temporary database to exercise every CLI operation, import rollback, duplicate imports, cycles, ambiguity, dates, drafts, exports and escaped reports. GitHub Actions runs the suite on Windows and Linux. TEST_DATABASE_URL optionally runs the same suite against an empty disposable Postgres database.

The activity log records entered actor labels and change details. It is not an authenticated or tamper-proof audit system. Protect the machine, database connection and private output folders. Shared use requires a separate access design. Coding-agent and database operating costs are separate from the MIT software licence.

## Want it installed and run for you?

Omni by Enterprise DNA brings your records across, builds your fields and rules, connects your other systems and runs the result. We can add a web front end or use a different stack. One setup fee, then a retainer.

[Book a call](https://enterprisedna.co/omni/book?offer=replace-software&utm_source=github&utm_medium=readme&utm_campaign=smartsheet).

## License

MIT. Copyright (c) 2026 Enterprise DNA. Smartsheet is a trademark of its owner. This project is independent and is not affiliated with or endorsed by Smartsheet.
