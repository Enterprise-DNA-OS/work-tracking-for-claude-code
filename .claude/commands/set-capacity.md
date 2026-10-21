---
description: Change weekly capacity
---
# Change weekly capacity

Read the affected record first. Use only values supplied by the operator. Run --dry-run when checking a proposed change.

Example syntax (replace the sample values):

```bash
node scripts/work.mjs set-capacity "Owner" --hours=28 --actor="Operator name" --json
```

Read back the result and show the changed record. Do not send messages or publish anything. Errors leave no partial writes. The actor is an audit label, not authentication.
