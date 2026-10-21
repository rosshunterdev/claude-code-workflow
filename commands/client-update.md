---
description: Draft a plain-language update for the client from recent changes, log it as unsent
---

Draft an update message to the client about recent work. $ARGUMENTS can say what to
focus on, the date range, or "short".

1. **Find the client log.** Look for a client file named in CLAUDE.md, or a root
   markdown file with a communication log (e.g. `<CLIENTNAME>.md`). If none exists,
   ask me where to log it before writing anything.
2. **Find what changed since the last message.** Read the newest entry in the client
   log for its date, then `git log --oneline --since=<that date>`. Use HANDOVER.md for
   context. Don't read source files.
3. **Pick what the client cares about.** Visible changes, things that need their
   input, anything that changes how they use the site or app. Leave out refactors,
   docs, tooling and tiny tweaks unless they asked about them.
4. **Draft the message:**
   - Plain language, no jargon, no file names, no commit messages.
   - Lead with what they can see, then anything that needs them to act, as a short
     list with exactly what to send or decide.
   - Short. Friendly, in my voice (casual NZ English, no em dashes).
   - **Use the `client-copy` skill:** never state a fact about the client's business
     that they didn't supply. If something needs confirming, ask it as a question.
5. **Log it** at the top of the client log, as a dated entry:
   `### <YYYY-MM-DD>: Update drafted, NOT sent`, then the draft, then one line on
   anything deliberately left out and why.
6. Show me the draft and the log entry location. Don't send anything and don't commit.
