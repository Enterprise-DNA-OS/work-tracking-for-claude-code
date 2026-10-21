---
description: Record a decision needed
---
# Record a decision needed

Read the affected record first. Use only values supplied by the operator. Run --dry-run when checking a proposed change.

Example syntax (replace the sample values):

```bash
node scripts/work.mjs add-decision "Decision title" --project="Project name" --owner="Owner name" --due=2027-01-31 --actor="Operator name" --json
```

Read back the result and show the changed record. Do not send messages or publish anything. Errors leave no partial writes. The actor is an audit label, not authentication.
