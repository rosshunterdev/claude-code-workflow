---
name: new-project-setup
description: Use when starting a new project, opening a repo that has no CLAUDE.md, or when asked to "set up Claude" for a project. Also when a project is missing session docs or a .claude/settings.local.json.
---

# New Project Setup

## Overview

Every project gets the same small starting kit so sessions don't start cold and
permissions don't drift. **Ask for facts; never guess the stack, commands or purpose.**

## Steps

1. Check what already exists: `CLAUDE.md`, `HANDOVER.md`, `DECISIONS.md`,
   `SESSION_LOG.md`, `.claude/settings.local.json`. Never overwrite an existing file;
   only fill gaps. Report what you found.
2. Read `package.json` / `requirements.txt` / `pubspec.yaml` etc. to pre-fill what's
   knowable. Then ask, in ONE message, only what you couldn't read:
   - one-line purpose, and whether it's client, study or personal work
   - dev server command and port; build and test commands
   - screenshot/verification tool, if any
3. Create the project `CLAUDE.md` from the answers:

   ```markdown
   # <Project name>
   <one-line purpose> (<client | study | personal>)

   ## Stack
   ## Commands
   - Dev: `<cmd>` (port <n>). Ask before starting; one may already be running.
   - Build: `<cmd>`   Test: `<cmd>`
   ## Verification
   <screenshot tool or build command used to verify work>
   ## Project rules
   <only rules that differ from the global CLAUDE.md>
   ```

   For client work, add: "Client facts: use the `client-copy` skill."
4. Create session docs from the templates in
   `~/.claude/skills/maintaining-session-docs/templates/`. **REQUIRED:** follow
   maintaining-session-docs for their format.
5. Create `.claude/settings.local.json` only if it doesn't exist:

   ```json
   { "permissions": { "allow": [] } }
   ```

   Add only exact commands the project needs (`Bash(npm run build)`), never
   interpreters or wildcards (`Bash(node *)`, `Bash(python *)`, `Read(//c//**)`).
6. If the folder is a git repo, ask before committing these files.

## Common Mistakes

- Copying global rules into the project CLAUDE.md. It only holds what's different.
- Inventing a purpose or client details to fill the template. Leave the line and ask.
- Adding broad allow rules "to save prompts". Use the fewer-permission-prompts skill
  later instead; it allowlists read-only commands only.
