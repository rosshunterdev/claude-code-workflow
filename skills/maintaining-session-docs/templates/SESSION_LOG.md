# SESSION_LOG — <project>

Append-only, newest first. One entry per working session.
Heading format is fixed: `## Session N — YYYY-MM-DD — short title`
N = the topmost entry's N + 1, read from this file. **This file is the only
session-numbering authority** — no other doc assigns or reuses session numbers.

---

## Session 1 — YYYY-MM-DD — <short title>
**Did:** <what shipped, file-level>
**Decided:** D-001, D-002 <ids only — detail lives in DECISIONS.md>
**Broke / found:** <gotchas, traps, dead ends worth not repeating>
**Verified:** <concrete evidence: command + result, test count, screenshot filename — or "not verified">
