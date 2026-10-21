---
description: Dependency register
---
# Dependency register

List each predecessor and its current status.

Run `node scripts/work.mjs dependencies --json`. Present the records in plain language with dates and owners. Never infer missing facts. An ambiguous match prints candidates and exits 1. Resolve it with the operator before continuing. Do not send messages.
