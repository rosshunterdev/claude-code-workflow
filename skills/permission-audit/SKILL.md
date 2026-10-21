---
name: permission-audit
description: Use when reviewing Claude Code permissions across projects, after a session approved many "always allow" prompts, during a monthly config check, or when a deny rule (curl, .env, network) seems to have been bypassed. Covers settings.json and settings.local.json allow lists.
---

# Permission Audit

## Overview

Allow rules accumulate silently every time "always allow" is clicked. One broad rule
(`Bash(node *)`, `Read(//c//**)`) undoes the global deny list for that project.
**This skill reports; it never edits settings files.**

## Steps

1. Run `node ~/.claude/skills/permission-audit/scripts/audit.js`
   (pass folder paths as arguments to scan somewhere other than ~/Documents and ~/.claude).
2. Report findings grouped by project, HIGH first. For each HIGH rule, suggest the
   narrow replacement (e.g. `Bash(node *)` → `Bash(node scripts/build.js)`).
3. Summarise LOW `stale-one-off` rules as a count per file, not one by one.
4. End with one next action. Do not edit any settings file. Auto mode blocks it
   anyway, and the user should decide each removal.

## Severity

| Level | Meaning | Examples |
|---|---|---|
| HIGH | Bypasses deny rules or hooks | `Bash(*)`, `Bash(node *)`, `Bash(python -c:*)`, `Read(//c//**)`, `Bash(curl ...)` |
| MED | Can fetch and run code | `npm exec`, `Bash(npm *)`, `pnpm dlx` |
| LOW | Clutter | Hard-coded paths, old plugin versions |

## Common Mistakes

- Forgetting the `PowerShell(...)` rules. Bash hooks and `Bash(...)` denies don't cover them.
- Treating `npm run build` as risky. Specific script names are fine; wildcards are the problem.
- A HIGH rule in the global `~/.claude/settings.json` affects every project, so list it first.
