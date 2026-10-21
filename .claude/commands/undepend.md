---
description: Remove a predecessor link
---
# Remove a predecessor link

Read the affected record first. Use only values supplied by the operator. Run --dry-run when checking a proposed change. Removing a dependency requires the operator to request that specific removal.

Example syntax (replace the sample values):

```bash
node scripts/work.mjs undepend "Task" --on="Predecessor task" --actor="Operator name" --json
```

Read back the result and show the changed record. Do not send messages or publish anything. Errors leave no partial writes. The actor is an audit label, not authentication.
