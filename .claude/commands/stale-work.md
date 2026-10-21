---
description: Chase missing updates
---
# Chase missing updates

List unfinished work without an update for more than seven days. Draft a follow-up only when asked.

Run `node scripts/work.mjs stale-work --json`. Present the records in plain language with dates and owners. Never infer missing facts. An ambiguous match prints candidates and exits 1. Resolve it with the operator before continuing. Do not send messages.
