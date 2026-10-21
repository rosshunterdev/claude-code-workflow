---
name: maintaining-session-docs
description: Use when a project keeps HANDOVER.md, DECISIONS.md, or SESSION_LOG.md at its root — at session start, at session close, when recording a decision, when shipping something previously decided, or when adding session docs to a new project. Symptoms it fixes: stale "AWAITING X" banners, DECIDED entries for work that already shipped, session blocks labelled inconsistently, HANDOVER files that grow forever.
---

# Maintaining Session Docs

## Overview

Four files, one job each. Drift happens at session close, when doc updates compete with finishing the work — so this skill is close-of-session mechanics, not formatting preference.

**Core principle: every fact lives in exactly one file; the other files point at it.**

| File | Job | Discipline |
|---|---|---|
| CLAUDE.md | How to work here (stack, rules, commands) | Edit only when a convention changes. Never holds state, task lists, or session history. |
| HANDOVER.md | Where things stand *now*, what's next | Fully rewritten at session close. Bounded. Never appended to. |
| DECISIONS.md | What was decided and why | Append-only ledger; every entry carries a status from the closed set. |
| SESSION_LOG.md | What happened, session by session | Append-only, newest first. The single session-numbering authority. |

Templates for all four are in `templates/`.

## Write triggers

| Event | Action |
|---|---|
| Session starts | Read HANDOVER. Check its banner's removal condition and its "As of Session N" against SESSION_LOG's top entry before trusting either. |
| A decision is agreed with the user | New DECISIONS entry, status DECIDED |
| A question is parked | New DECISIONS entry, status OPEN |
| A DECIDED thing ships | Flip that entry to BUILT **in the same session** |
| The shipped thing is verified in the running product | Flip to VERIFIED |
| A decision is replaced | New entry; edit the old entry to `SUPERSEDED by D-NNN` — never record the supersession only in the new entry |
| A convention or hard rule changes | CLAUDE.md |
| Session ends | The close-of-session sweep below |
| Anything else | Leave the files alone: no mid-session HANDOVER edits, no narrative prose in DECISIONS, no state in CLAUDE.md. |

## The rules that prevent drift

### 1. Banners expire by contract
A banner is valid only with all three parts:

> ⚠ MESSAGE (added YYYY-MM-DD — remove when OBSERVABLE CONDITION)

Maximum one banner per file, always at the top. At every session close, evaluate each banner in every doc — including status headers on spec/plan files — against its condition: condition met → delete the banner; condition can't be evaluated → move it into HANDOVER's "Blockers / waiting on" as a normal item; still live → keep. A banner that survives two consecutive closes gets raised with the user, not silently kept.

### 2. Statuses are a closed set, flipped by the shipping session
`OPEN → DECIDED → BUILT → VERIFIED`, plus `SUPERSEDED by D-NNN`. Exact tokens. Variants like "DECIDED (design)" are how drift starts: a variant reads as "close enough" forever and hides from a grep for `DECIDED`. Qualifiers go after a dash, never inside the token: `**Status:** BUILT — browser pass pending (Session 9, 2026-07-18)`.

The session that ships a decision flips its status. Not the next session, not "when the branch merges".

### 3. Session labels come from one authority
The heading format is fixed everywhere: `## Session N — YYYY-MM-DD — short title`. N = the topmost SESSION_LOG entry's N + 1, read from the file at close, never from memory. HANDOVER and DECISIONS refer to sessions only as "Session N" — they never invent their own numbering, era names, or date-only labels.

Append-only applies to entry *content*: a past entry's text is history and is never rewritten. A past entry's *heading* is metadata — when you find one that doesn't match the format, normalize it.

### 4. HANDOVER is rewritten, not grown
At close, rewrite the whole file from the template. Target ≤120 lines. A "Previous session" heading inside HANDOVER is the tell that you are appending — that content belongs in SESSION_LOG. For history that feels too load-bearing to drop: put the conclusion where it permanently lives (a DECISIONS entry, a CLAUDE.md rule, a gotcha in the project docs) and drop the narrative.

### 5. Fix contradictions at the source
When you learn a doc is wrong ("the old site is Ghost, not WordPress"), correct the wrong doc in the same session, and mark superseded entries SUPERSEDED. A correction recorded only in the newest file leaves the wrong version standing exactly where the next reader will find it.

### 6. No parallel state docs
Findings go into HANDOVER (current state), DECISIONS (choices), or SESSION_LOG (history) — not into new AUDIT.md / PROGRESS.md / HEALTH-CHECK.md files that become extra places for state to rot. A one-off doc is allowed only as a plan or spec artifact under `docs/`, and any status header it carries follows the banner contract in rule 1.

## Close-of-session sweep — do all five, in order

1. **SESSION_LOG** — append the entry using the template fields: Did / Decided (D-ids) / Broke or found / Verified. "Verified" states concrete evidence (command + result, screenshot filename, test count) or the words "not verified".
2. **DECISIONS** — grep the file for `DECIDED` and `OPEN`; for each hit, ask "did this session build it?" Flip what shipped. Check entries this session contradicted and mark them SUPERSEDED.
3. **HANDOVER** — full rewrite from the template. Next steps ordered; unverified work named as unverified; git state stated (what's committed, what's local-only).
4. **Banners** — evaluate every banner and spec-status header against its removal condition (rule 1).
5. **CLAUDE.md** — touch only if a convention changed this session.

If the session is ending abruptly, run the same order and stop where you must: a SESSION_LOG entry alone beats a half-rewritten HANDOVER, because append-only history is cheap to fix later and a half-truthful "current state" is not.

## Red flags — stop and fix before ending the session

- Writing a "Previous session" heading inside HANDOVER
- Writing a status token that isn't in the closed set
- Writing a banner without a removal condition
- Numbering a session from memory or from HANDOVER instead of SESSION_LOG
- Recording "X was wrong" in a new file while X still says the wrong thing
- "I'll update DECISIONS next session"

| Excuse | Reality |
|---|---|
| "The banner is still sort of relevant" | If its condition can't be evaluated, it's noise wearing an alarm's clothes. Demote it to Blockers. |
| "DECIDED (built now, really)" | The entry is the record. If it shipped, it says BUILT. Thirty seconds. |
| "I'll keep the old HANDOVER sections for context" | That context is SESSION_LOG's job. Duplicated context rots into two competing truths. |
| "This session was too small to log" | Small sessions are exactly the ones nobody can reconstruct later. Three lines suffice. |
| "The code is the real truth anyway" | These files exist because the next session cannot re-derive intent, verification state, or the user's calls from code. Drifted docs are worse than none — they are confidently wrong. |
| "No time for the sweep" | The sweep is five minutes. Reconstructing state next session from drifted docs cost more than that today. |

## New project setup

Copy the four files from `templates/` into the repo root, fill in the CLAUDE.md project section (or paste `templates/CLAUDE-section.md` into an existing CLAUDE.md), and start SESSION_LOG at Session 1. Do not create any other state document.
