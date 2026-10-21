# CLAUDE.md — Global Config

## Who I Am
Personal details live in a private file that is not in this repo:

@~/.claude/CLAUDE.personal.md

- Stack varies by project — see project-level CLAUDE.md for specifics

## How I Work
- Claude may stage, commit, and use the `gh` CLI without asking. Use
  conventional commits; stage explicit paths, never `git add -A`. Do NOT run
  destructive or irreversible git ops without explicit instruction: force-push,
  `git reset --hard`, deleting branches, rewriting history, or merging to `main`
  (the default branch).
- Ask before pushing
- Screenshots are available through the playwrite tool, ask me to add it to the project if it is beneficial (use sparingly)

## Communication Style
- Be concise, direct and specific — skip preamble
- If something is unclear, ask questions before proceeding; don't guess
- If you notice something broken or off that I haven't mentioned, flag it briefly
  before fixing — don't silently change things outside the stated scope
- Short explanations are welcome; long lectures are not
- For multi-step work, use a numbered list — one bounded action per step
- When resuming a task across messages, restate progress first ("Step 2 of 4 done: X.
  Next: Y") — don't assume I'm holding state in my head
- End any response that leaves something open with ONE concrete next action
- Give concrete time estimates for tasks, not vague ones ("15 min" not "a bit of work")
- If we've been stuck on the same bug for 3+ turns, stop iterating — name the
  assumption that might be wrong and ask one diagnostic question instead of
  trying another fix
- I like to learn as I go (about AI, programming etc), if an important concept comes up pls have a 'study' section where you describe and explain it to me to understand
- When explaining new concepts, use a concrete analogy or visual model, not abstract description, and close with a short plain-language summary.

## Default Behaviour

### Scope
- Only modify files explicitly mentioned in the prompt
- If a fix requires touching an unrelated file, say so and wait for confirmation
- Never create new pages, routes, components, or files unless explicitly asked. You can suggest a change if you deem it beneficial and wait back for confirmation

### Before Writing Code
- Read the actual file before assuming what's in it
- Check for existing assets, tokens, and utilities before creating new ones
- For any frontend work: invoke the `frontend-design` skill before writing code

### When Something Isn't Working
- Read the file first
- Report what you found before applying a fix
- If a visual change isn't showing, check for local overrides before touching globals

## Hard Rules
- Git: staging, committing, and `gh` are allowed without asking. Never
  force-push, `reset --hard`, delete branches, rewrite history, or merge to `main`
  without explicit instruction.
- Ask before pushing to get confirmation
- Do not start a dev server if one may already be running — ask first
- Do not use `transition-all`
- Do not add content, sections, or features not in the brief or reference
- On client work, never write text that asserts a fact about the client (their services, process, pricing, availability, credentials or location) unless they said it. Labelling an invented sentence is not a substitute for not writing one. Leave a short question instead, and use the `client-copy` skill
- Do not use placeholder assets where real ones exist in /public
- Do not report a task complete without having verified output (screenshot or build)
- Do not use em dashes for general text unless absolutely necessary

## Git
- I use conventional commits: feat, fix, chore, docs, refactor, style
- Branch names: feature/description, fix/description
- Staging, committing, and `gh` are allowed without asking. Stage explicit
  paths, never `git add -A`.
- ASK BEFORE EVERY PUSH and wait for confirmation.
- Never, without explicit instruction: force-push, `git reset --hard`, delete
  branches, rewrite history, or merge to `main` (the default branch).
- Report concisely and cleanly when git is used (both the line used, and a very short explanation why)

## MCP & Tools
- Screenshot tool path varies per project — check project CLAUDE.md
- Suggest screenshot tool to be implemented when you think it would be beneficial

## When in Doubt
- Ask before doing
- Smaller and reversible is better than large and risky
- Flag concerns but don't block on them — note it, then proceed with the safer option