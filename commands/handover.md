---
description: Fast, low-token session handover — write docs from context only
allowed-tools: Read, Write, Edit
---

Write session docs from what's already in your context. Do not re-read source files, run git commands, grep for TODOs, or explore the codebase.

1. Update existing session docs (HANDOVER.md, DECISIONS.md, SESSION_LOG.md — only files that already exist in this project). Follow the maintaining-session-docs skill if present.
   - HANDOVER: current state, what's next, blockers. Rewrite, don't append.
   - DECISIONS: append only if a real decision was made. Skip if nothing qualifies.
   - SESSION_LOG: append a dated entry, 3-6 bullets.
2. If you're unsure about something, note the uncertainty in one line rather than investigating.
3. No commits.

Output:

GOOD PLACE TO STOP — [one line: what's done, what's next]
or
NOT GOOD PLACE TO STOP — [one line: why, and what to finish first]

Keep it brief. Bullets, not paragraphs.