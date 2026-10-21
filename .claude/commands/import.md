---
description: Bring in a Smartsheet task sheet
---
# Bring in a Smartsheet task sheet

Read docs/replace-smartsheet.md first. Check the complete export and the mapping. Run the dry run, inspect counts, then run the same command without --dry-run when the requested import is authorised.

Example syntax (replace the sample values):

```bash
node scripts/work.mjs import smartsheet /path/to/tasks.csv --project="Project" --dry-run --actor="Operator name" --json
```

Read back the result and show the changed record. Do not send messages or publish anything. Errors leave no partial writes. The actor is an audit label, not authentication.
