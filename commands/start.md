---
description: Orient in the project and report back before making changes
allowed-tools: Read, Grep, Glob, Bash(git log:*), Bash(git status:*), Bash(git branch:*), Bash(tail:*), Bash(head:*)
---

Get oriented cheaply. Read only what's listed; don't read other docs unless step 4 says so.

1. `git branch --show-current`, `git status --short`, `git log --oneline -8`.
2. Read CLAUDE.md (or claude.md). If it names a "read first" doc (e.g. a handbook), read
   that too.
3. HANDOVER.md: read only the newest "current state" / "latest session" block (stop at
   the next dated heading). SESSION_LOG.md: the newest entry only. Logs differ in order
   (most are newest first, some oldest first), so grep `^## ` with line numbers, pick the
   heading with the latest date (highest session number if two share a date), and read
   from it to the next `## ` heading. DECISIONS.md: don't read it now; grep it later
   when a "why" question comes up.
4. List the other root markdown files by name only. Open one only if HANDOVER says the
   current task depends on it.

Summarise in this order, one or two lines each:
1. What this project is
2. Branch + uncommitted work (flag it if on main with changes)
3. Where we left off
4. Blockers / waiting on someone
5. Suggested first task, with a time estimate

Then stop and wait for my instructions. Do not start making changes.
