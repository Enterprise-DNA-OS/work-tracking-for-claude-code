---
description: Owner workload
---
# Owner workload

Compare remaining hours due within seven days, including overdue work, with each owner's weekly capacity. Undated tasks are shown separately.

Run `node scripts/work.mjs owner-load --json`. Present the records in plain language with dates and owners. Never infer missing facts. An ambiguous match prints candidates and exits 1. Resolve it with the operator before continuing. Do not send messages.
