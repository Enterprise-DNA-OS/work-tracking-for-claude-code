# Replace a Smartsheet task register

The bridge is a complete, flat task sheet exported to Excel, then saved as CSV UTF-8. The vendor documents [Excel export](https://help.smartsheet.com/articles/770623-exporting-sheets-reports-from-smartsheet). Smartsheet does not promise that formulas, Gantt layouts, comments and attachments survive as working features in an Excel export. Keep the original export and attachments separately.

## Prepare the source

1. Add or include a stable unique Task ID column in the source sheet before exporting. Do not use changing row numbers as task IDs. Include Task Name, Assigned To, Status, Due Date, Remaining Hours, Priority and Predecessors where used.
2. Export the entire flat task sheet through File, Export, Export to Microsoft Excel. Save the task worksheet as CSV UTF-8. Export each project separately. Do not use a filtered report when retaining predecessor row references. Exclude summary rows only if you also remove or remap every predecessor reference.
3. Create the project and its people in the new register. Assigned To must match one existing active person's name, not an email or a list. Map a multi-assignee field to an explicitly selected primary owner before import. Keep the original in a separate source column if needed.
4. Run the import below with --dry-run. Check the proposed counts and records against the source before repeating without --dry-run.

```bash
npm run work -- add-person "Aroha Chen" --hours=32 --actor="Operator"
npm run work -- add-project "Supplier onboarding" --owner="Aroha Chen" --actor="Operator"
npm run work -- import smartsheet /path/to/tasks.csv --project="Supplier onboarding" --actor="Operator" --dry-run
```

On the demo, the fixture is `fixtures/smartsheet.csv`. Its headings are a documented mapping example, not a claim that every Smartsheet account uses those headings. Every imported row is retained in source_data, including additional columns. There are no credentials or API calls.

## Mapping

| Source column by default | Destination |
|---|---|
| Task ID | Unique source key within the selected project. Required. |
| Task Name | Task name. Required. |
| Assigned To | One existing active person matched by exact name, ignoring case. Blank means unassigned. |
| Status | Not Started to todo, In Progress to doing, Blocked to blocked, Complete or Completed to done, Cancelled to cancelled. Native statuses also accepted. Missing means todo. |
| Due Date | ISO YYYY-MM-DD. Use --date-format=DMY for DD/MM/YYYY source dates. Blank means undated. |
| Remaining Hours | Nonnegative decimal estimate, at most two decimals. Missing means zero. Not the elapsed duration column. |
| Priority | Low, Normal or High. Missing means normal. |
| Predecessors | Source sheet row positions, comma separated, bare row numbers or FS with zero lag. Other relationship types and lags are rejected. |

For different headings, use `--map=your-map.json`:

```json
{"columns":{"key":"Work Ref","name":"Description","due":"Finish"},"statuses":{"Waiting for input":"blocked"}}
```

Always inspect defaults before import. Omitted optional columns are reset to the defaults above on a reimport. If the Predecessors column is absent, existing links are kept. If present, links into every imported task are replaced by that column. Blank predecessor cells clear those links. Rows absent from an import are kept. Imports can overwrite local changes to included task fields, so export a backup first.

Stable IDs make repeat imports update the same tasks. Unknown owners, duplicate keys, malformed dates, unsupported statuses, non-FS predecessors, out-of-range row references, cycles and completed tasks with unfinished predecessors reject the whole import. Row order must match the original complete sheet. The importer cannot infer whether a user reordered a CSV before supplying it.

## What stays for the custom build

This imports task records and supported prerequisite links. It does not import permissions, forms, automation rules, attachments, discussion threads, dashboards, hierarchy or formulas. It does not preserve historical completion dates absent from the mapped export: a completed task first imported today receives today's completion date. Raw source columns remain available for a separately agreed migration. It does not run a Gantt scheduler.

Enterprise DNA maps the rest of the required records and builds the screens and connections agreed for your version. Compare row counts, owners, due dates, open tasks and each prerequisite before retiring the old workflow. There is no requirement to cancel a subscription before checking the migration.
