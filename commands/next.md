---
description: Tell me the ONE next action and how long it takes, nothing else
allowed-tools: Read, Glob, Bash(git status:*), Bash(git log:*)
---

Give me exactly one next action.

1. If this conversation already has a clear next step, use it. Don't read anything.
2. Otherwise read HANDOVER.md (or the "next" section of the newest session doc).
   If none exists, run `git status --short` and `git log --oneline -3`.
3. Pick the single smallest action that moves the work forward. If it would take
   more than 30 minutes, pick its first bounded piece instead.

Output exactly this, nothing more:

**Next:** <one action, starting with a verb, naming the file or command>
**Time:** <concrete estimate, e.g. "15 min">
**Done when:** <one observable result>

If you genuinely can't tell what's next, output one question instead.
