<!-- Paste this section into the project's CLAUDE.md -->

## Session docs

This project uses the maintaining-session-docs convention (skill: `maintaining-session-docs`):

- **HANDOVER.md** — current state; read at session start; fully rewritten at session close
- **DECISIONS.md** — append-only decision ledger; statuses OPEN/DECIDED/BUILT/VERIFIED/SUPERSEDED; the session that ships a decision flips its status
- **SESSION_LOG.md** — append-only history, newest first; the only session-numbering authority

At session close, run the skill's five-step sweep (SESSION_LOG entry → DECISIONS status sweep → HANDOVER rewrite → banner check → CLAUDE.md only if a convention changed). This file never holds state, task lists, or session history.
