---
description: What needs attention
---
# What needs attention

Find overdue work, missing owners, missing dates and tasks without an update for over seven days.

Run `node scripts/work.mjs attention --json`. Present the records in plain language with dates and owners. Never infer missing facts. An ambiguous match prints candidates and exits 1. Resolve it with the operator before continuing. Do not send messages.
