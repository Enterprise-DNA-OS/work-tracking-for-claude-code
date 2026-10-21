---
description: Record a retention review
---
# Record a retention review

Read the affected record first. Use only values supplied by the operator. Run --dry-run when checking a proposed change. Ask for review evidence if none was provided. Never invent that a check happened.

Example syntax (replace the sample values):

```bash
node scripts/work.mjs review-retention "Project" --next=2027-01-31 --evidence="Purpose for keeping the records and review evidence" --actor="Operator name" --json
```

Read back the result and show the changed record. Do not send messages or publish anything. Errors leave no partial writes. The actor is an audit label, not authentication.
