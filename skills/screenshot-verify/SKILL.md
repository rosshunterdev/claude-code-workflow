---
name: screenshot-verify
description: Use when about to claim a visual or frontend change is done, fixed or "looks right" in a web project, when a project rule requires screenshot verification, or when checking a page for console errors, broken images or 404s at desktop and mobile widths.
---

# Screenshot Verify

## Overview

"The code looks right" is not verification. Screenshot every changed page at desktop
and mobile width, look at the images, and check the error report.

## Steps

1. **Find a server; never start a second one.** Check the project CLAUDE.md for the
   dev port. Test it: `Test-NetConnection localhost -Port <port> -InformationLevel Quiet`
   (PowerShell). Port busy → use it. Port free → ask before starting anything, or
   use the project's preview command if CLAUDE.md allows it, and stop it when done.
2. **Shoot the changed pages** from the project root:

   ```
   node ~/.claude/skills/screenshot-verify/scripts/shoot.mjs --base http://localhost:<port> / /about
   ```

   Defaults: widths `1440,390`, viewport-height shots into `screenshots/`.
   `--full` for full-page, `--label before` / `--label after` for comparisons,
   `--widths 1440,768,390` if the project rules say so.
3. **Look at every image** with the Read tool. Describe what you see against what
   was asked. A screenshot you didn't look at isn't verification.
4. **Report errors.** Exit code 1 means console errors, page errors or 4xx/5xx
   responses. List them; don't call the work done until they're explained.

## Quick Reference

| Need | Flag |
|---|---|
| Before/after comparison | `--label before`, change, `--label after` |
| Whole page, not just viewport | `--full` |
| Different server | `--base http://localhost:3000` |
| Output folder | `--out path` (default `screenshots/`) |
| Shot looks dim or half-faded | `--wait 2500` (default 1200ms lets loaders finish) |

## Common Mistakes

- Only shooting the homepage. Shoot every page the change touched.
- Skipping 390px. Mobile breaks are the most common miss.
- Committing screenshots. Make sure `screenshots/` is in `.gitignore`; if not, say so.
- Missing puppeteer/playwright: the script says so. Ask before installing.
