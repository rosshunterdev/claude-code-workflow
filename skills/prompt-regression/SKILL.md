---
name: prompt-regression
description: Use when changing a system prompt, tool schema, model ID or token limit in an app that calls an LLM API, when upgrading to a newer Claude model, or when someone asks "did that prompt change make it better or worse?". Applies to any project whose unit tests mock the API.
---

# Prompt Regression

## Overview

Unit tests that mock the API prove the plumbing, not the output quality. Before
changing anything that shapes the model's output, snapshot real outputs, change one
thing, snapshot again, and diff. **Real runs cost credits: always ask first and say
how many calls.**

## Steps

1. **Look for an existing harness** (`evals/`, CLAUDE.md "Evals" section). If one
   exists, use it. Reference implementation: `itp-reviewer/evals/`.
2. **If none exists, propose one** (ask before creating files):
   - `evals/cases.json`: 2-5 representative real inputs (gitignored if client data)
   - `run_eval.py --label X [--dry-run]`: one call per case, saves a JSON snapshot
     with model, prompt hash and outputs to a gitignored `evals/runs/`
   - `checks.py`: offline lint for rules the prompt states (phrasing, enums,
     required fields, near-duplicates), unit-tested
   - `compare.py`: per case, kept / lost / new outputs plus lint problems
3. **Run order:** `--dry-run` first → ask → `before` run → change ONE thing → `after`
   run → compare.
4. **Report** lost items first (regressions), then new items, then lint problems.
   Give a verdict: keep, revert, or needs a second run (outputs vary run to run, so a
   single lost item on one run is weak evidence).

## Common Mistakes

- Changing the prompt and the model in the same step. You can't tell which helped.
- Treating unit tests passing as "the prompt still works".
- Committing snapshots that contain client documents.
- Judging on one run when differences are small. Re-run the case that changed.
