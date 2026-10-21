---
description: Commit, push and open a PR safely: branch check, conventional commit, ask before push
---

Ship the current work. $ARGUMENTS is an optional short description of the change.

1. Run `git branch --show-current` and `git status --short`.
   - Nothing to commit and no unpushed commits: say so and stop.
   - On `main` or `master`: create a branch first (`feature/<slug>` or `fix/<slug>`,
     slug from $ARGUMENTS or the changes). Never commit on main.
2. Stage explicit paths only (never `git add -A` or `git add .`). Skip anything that
   looks like a secret, build output, or an unrelated change; list what you skipped.
3. Commit with a conventional message (feat, fix, chore, docs, refactor, style).
4. Show me, then STOP and ask "Push?":
   - branch name
   - `git log --oneline origin/<base>..HEAD` (or the new commit if no upstream)
   - `git diff --stat` of what's being pushed
5. Only after I say yes:
   - `git push -u origin <branch>` as its own command
   - then, as a separate command, `gh pr create --fill` (add `--base main` only if
     needed). Never chain push and `gh pr create` with `&&`; the git-safety hook
     blocks any push command that mentions "main".
6. Report: the git lines used, one short line on why, and the PR URL.

Never force-push, merge, or close PRs from this command.
