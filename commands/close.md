Perform full end-of-session checks before closing.

1. Run `git status`. List uncommitted changes file by file.
2. Check for unresolved TODOs or FIXMEs added or touched this session (search diff/changed files, not the whole repo).
3. Update existing session docs (HANDOVER.md, DECISIONS.md, SESSION_LOG.md, or similar — only files that already exist). Follow the maintaining-session-docs skill if present.
   - HANDOVER: rewrite with current state, next steps, blockers.
   - DECISIONS: append only if a real decision was made.
   - SESSION_LOG: append a dated entry.
4. Note any concerns (fragile code, undertested areas, rushed decisions) in HANDOVER under a "Concerns" section.
5. No commits.

Output a verdict at the top:

SAFE TO CLOSE — no uncommitted changes, no unresolved TODOs, docs updated.
or
NOT SAFE TO CLOSE — [specific reason(s)]

Then: GOOD PLACE TO STOP or NOT GOOD PLACE TO STOP — [one line why].

Keep everything brief. No summary padding.