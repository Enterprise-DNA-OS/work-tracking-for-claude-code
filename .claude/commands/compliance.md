---
description: Review evidence
---
# Review evidence

Check access and retention review dates plus the house rules for task owners and dates. Cite docs/compliance.md. A finding is a records prompt, not a legal conclusion.

Run `node scripts/work.mjs compliance --json`. Present the records in plain language with dates and owners. Never infer missing facts. An ambiguous match prints candidates and exits 1. Resolve it with the operator before continuing. Do not send messages.
