# Claude Code workflow

The Claude Code setup I use for client, study and personal projects: global instructions, slash commands, skills and safety hooks. This repo is the source of truth. `install.mjs` copies it into `~/.claude`.

## What's here

```
CLAUDE.md            global instructions (personal details are imported from a private file)
commands/            slash commands
skills/              skills, some with helper scripts
hooks/               Node hooks that run before shell commands and when a turn ends
settings/            permission rules, hook wiring and plugin list (reference copy)
tests/               node:test suites and the real cases they're built from
install.mjs          copies the setup into ~/.claude
```

## How a session runs

1. `/start` reads the branch, recent commits, `CLAUDE.md` and the newest handover notes, then stops and reports before changing anything.
2. Work happens. Skills load when the task matches them (debugging, screenshots, client copy, prompt changes).
3. `/handover` (fast) or `/close` (full checks) writes the session docs so the next session doesn't start cold.

Each project keeps three session docs, kept consistent by the `maintaining-session-docs` skill:

| File | Answers |
|---|---|
| `HANDOVER.md` | Where are we now and what's next? Rewritten each session. |
| `DECISIONS.md` | What did we choose and why? Append only. |
| `SESSION_LOG.md` | What happened each session? Dated entries. |

## Commands

| Command | What it does |
|---|---|
| `/start` | Orients in the project cheaply and reports back. Makes no changes. |
| `/handover` | Writes session docs from what's already in context, without re-reading files or running git, to keep it cheap. |
| `/close` | End-of-session checks: uncommitted changes, new TODOs, session docs. Ends with SAFE TO CLOSE or NOT SAFE TO CLOSE. |
| `/next` | One next action, a time estimate, and what "done" looks like. Nothing else. |
| `/stuck` | Stops trying fixes, lists the assumptions so far, names the one most likely wrong, and asks one diagnostic question. |
| `/bro` | Re-explains the confusing part of the last answer in plain language. |
| `/quiz` | Quizzes me on concepts from the session, one question at a time. |
| `/grill` | Interrogates an idea through six lenses and saves a brief with a BUILD, PARK or KILL verdict. |
| `/ship` | Checks the branch, stages explicit paths, writes a conventional commit, then stops and asks before pushing and opening a PR. |
| `/client-update` | Drafts a plain-language update for a client from recent commits and logs it as unsent. Never sends anything. |

## Skills

| Skill | What it does |
|---|---|
| `maintaining-session-docs` | Keeps the three session docs in a fixed format, with a closed set of decision states: `OPEN → DECIDED → BUILT → VERIFIED`. |
| `new-project-setup` | Gives every project the same starter kit (CLAUDE.md, session docs, a narrow permissions file). Asks for facts instead of guessing them. |
| `permission-audit` | Scans settings files for broad allow rules that quietly undo the deny list. Reports only; never edits settings. |
| `screenshot-verify` | Screenshots changed pages at desktop and mobile widths and reports console errors and failed requests before work is called done. |
| `prompt-regression` | For apps that call an LLM: snapshot real outputs before and after a prompt, schema or model change, because mocked unit tests don't check output quality. |
| `client-copy` | Stops Claude writing facts about a client's business (services, pricing, credentials) that the client didn't supply. |

## Safety layers

Rules in `CLAUDE.md` are instructions Claude is asked to follow. Everything else in this table is enforced by Claude Code itself, whether or not Claude remembers the rule.

| Layer | Where | What it covers |
|---|---|---|
| Instructions | `CLAUDE.md` | Ask before every push, stage explicit paths, no destructive git without instruction |
| Deny rules | `settings/settings.json` | Reading `.env`, secrets and `~/.ssh`; `rm -rf`; and in both Bash and PowerShell: force-push, `reset --hard`, deleting branches and network commands |
| Ask rules | `settings/settings.json` | An approval prompt for every `git push` and `gh pr merge`, in both shells |
| `block-network.js` | `hooks/` | Denies `curl`, `wget`, `iwr`, `irm`, `Invoke-WebRequest` and `Invoke-RestMethod`. Matches whole words only, so "Confirm" doesn't trip it. |
| `git-ask.js` | `hooks/` | Asks before `commit`, `merge` or `rebase` on `main` or `master`. Follows a leading `cd` so it checks the right repo. |
| `secret-guard.js` | `hooks/` | Blocks reading secret files (`.env`, keys, credentials) and printing secret variables; asks before deleting, copying or moving one. Parses each command instead of searching its text. Covers Bash, PowerShell, Read, Edit, Write and Grep. |
| Plugins | [karanb192/claude-code-hooks](https://github.com/karanb192/claude-code-hooks) | `block-dangerous-commands` |

`notify.js` isn't a safety layer: it shows a Windows toast when Claude finishes a turn or is waiting on a permission prompt.

## Install

Needs Node 18 or later. `notify.js` is Windows only; the other hooks work anywhere Node does.

```
git clone https://github.com/rosshunterdev/claude-code-workflow.git
cd claude-code-workflow
node install.mjs --dry-run
node install.mjs
```

- `CLAUDE.md` imports `~/.claude/CLAUDE.personal.md` for personal details. Create that file (it can be empty) before installing; the script skips `CLAUDE.md` until it exists.
- The script never deletes anything. Any file it overwrites is backed up to `~/.claude/workflow-backups/<timestamp>/` first.
- It never writes `settings.json`, because Claude Code edits that file itself. Copy the keys from `settings/settings.json` across by hand.

## Keeping it in sync

Edit files in this repo, not in `~/.claude`, then run `node install.mjs`.

`node install.mjs --check` lists anything in `~/.claude` that has drifted from the repo, including the settings keys, and exits with code 1 if something has.

## Tests

```
node --test
```

`secret-guard.js` replaced the protect-secrets plugin. Its tests start from 40 real commands the plugin blocked in my sessions between September and October 2026, with paths and names removed and each one labelled by me: 5 read a secret, 2 deleted or copied one, and 33 only mentioned `.env`. On those 40 the plugin got 5 right; secret-guard gets all 40. Run over every tool call in my saved session history (about 8,100), it stops 5, and each of those reads a real `.env` file.

The tests also run the plugin's own test cases (adapted, MIT). secret-guard passes them except where my rules deliberately differ: it asks instead of blocking before a secret file is deleted, copied or moved, and it blocks `base64` of a secret file.

## How this repo is built

I work on this repo with Claude Code, and the split is deliberate:

- **I decide** the scope, what goes public and what stays private, and whether a change ships.
- **Claude suggests and drafts.** When it suggests an approach, it brings it to me to consider before acting on it. It writes code and docs, and runs the tests and checks.
- **Since the first commit, every change goes through a pull request** that I review and merge myself. The PR template records who did what, which suggestions I took, and how the change was verified.
- **Commits Claude wrote carry a `Co-Authored-By: Claude` line**, so the history shows where AI was involved.
- **Guardrails back this up:** the ask rules and hooks in this repo make Claude ask me before any push, and before committing to `main`.

## Third-party tools I use alongside this

Not included in this repo. Credit to their authors.

| Tool | Used for |
|---|---|
| [obra/superpowers](https://github.com/obra/superpowers) | Process skills: brainstorming, writing and executing plans, test-driven development, systematic debugging, code review, git worktrees |
| [karanb192/claude-code-hooks](https://github.com/karanb192/claude-code-hooks) | `block-dangerous-commands` plugin. secret-guard's coverage tests are adapted from its protect-secrets suite. |
| Claude plugins official marketplace | `frontend-design` and `context7` plugins |
| ui-ux-pro-max | Design reference skill |
| llm-council | Runs a decision past several advisor personas, based on Andrej Karpathy's LLM Council |

## License

MIT
