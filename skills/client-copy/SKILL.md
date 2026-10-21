---
name: client-copy
description: Use when writing or reviewing text that describes a real client's business, services, credentials, process, pricing, location or availability, and the client has not supplied those words - including marketing sites, landing pages, portfolios and profiles where the design needs copy before the client has written any.
---

# Client-Facing Copy

## Overview

On a client project, every visible string is either **the client's**, **true of the artifact itself**, or **a question addressed to the client**. There is no fourth kind. Writing plausible prose about someone else's practice is the failure this skill exists to stop, and it does not feel like a failure while you are doing it: it feels like finishing the page.

**The rule:** never assert a fact about the client that the client has not stated. Not softened, not hedged, not labelled.

## The Three Buckets

Classify every string before it ships.

| Bucket | Test | Example |
|---|---|---|
| **Client's** | Traceable to a specific line in the correspondence, brief or transcript. Pin it to the quote. | "I offer Creative Wellbeing Sessions" |
| **Artifact-true** | Describes the thing on the screen, not the client. Could not be wrong about their work. | "Send your message" on a submit button |
| **Slot** | A question, asserting nothing, asking the client for the missing copy. | "What is a first session actually like?" |

Anything that fits none of them comes off the page.

Borderline test: **could the client read this and find it wrong about their work?** If yes, it is not artifact-true, however factual it feels. "Sessions run about an hour" is a claim. "A sentence or two is plenty" describes the field it sits under.

## Labelling Is Not Exemption

The tempting middle path is to write the confident sentence and mark it as provisional. It does not work:

- A visitor reads the sentence first and the disclaimer second, if at all.
- The client reads their own site being wrong about them, in public, with an apology attached.
- Plausible invented copy survives review precisely because it reads well. Nobody catches it, because there is nothing to catch — only provenance distinguishes it.

Delete the sentence. Leave the slot.

## Slot Recipe

A slot has three parts, in this order, and nothing else:

1. **A label** naming what goes there and how much: `Your words / 2 sentences`, `Optional / 1 paragraph`.
2. **One question**, under fifteen words, in second person.
3. **Nothing.** No apology, no explanation of why the slot exists, no description of your process.

```
Your words / 1 to 2 sentences
What happens after someone messages you?
```

The client needs to know what to write. They do not need to know that you removed a paragraph, why the previous draft was unsafe, or how the placeholder system works. Write for someone skimming their own site, not reading your notes.

## Where Copy Hides

Check these — they carry claims and evade review:

- **`<head>`**: `<title>`, meta description, OG tags. The client will never see these in a preview, and a search result shows them. Cannot be slotted, so every clause must be traceable.
- **Attributes**: `alt`, `aria-label`, `placeholder`, `title`.
- **Success and error states**: rendered only after submission, so they are never on screen during review.
- **Empty states and image placeholders.**
- **Form hints and helper text.**

## Keep One Source of Truth

Keep the raw correspondence in the repo (`docs/client/convo.md` or similar), verbatim, dated, unedited. Then:

- Every client-bucket string is pinned to a quote in that file.
- Re-check the quotes still exist. Clients revise; a page quoting a superseded email is worse than one quoting nothing.
- Record out-of-band facts explicitly — a phone call, a meeting — with who confirmed it and when. Otherwise the next audit against the written record flags a correct fact as invented, and someone "fixes" it.

## Automate It

Judgment does not survive six sessions; a script does. Write a guard that extracts every visible string from the built output and classifies it against explicit manifests, failing on anything unaccounted for. Detect slots structurally (by class), so their wording stays free.

Reference implementation: `scripts/check_copy_provenance.py` in the Mind's Eye repo.

The guard's real value is the **third bucket it forces you to keep**: ours-with-a-slot-beside-it. That list is the debt, it is countable, and it should only ever shrink.

## Rationalizations

| Excuse | Reality |
|---|---|
| "The design needs text to be reviewable" | Slots are text. The layout works; the claims are what's missing. |
| "It's obviously a placeholder" | It is obvious to you. It reads as finished prose to everyone else. |
| "I labelled it, so it's honest" | The label is read second. See above. |
| "It's a safe, generic claim" | Generic claims about a specific practice are still claims, and clients notice the ones that are subtly wrong. |
| "They said 'use your judgement on the copy'" | That is licence to shape and arrange, not to invent facts about their work. Ask. |
| "I'll flag it in the email instead" | The email is read once; the page is read by everyone, forever. |
| "It's just the meta description" | That is the worst case, not the mildest: unreviewable and public. |
| "Removing it leaves the section empty" | An empty section asks a question. A full one tells a lie. |

## Red Flags

Stop if you catch yourself writing about the client:

- A duration, price, distance, travel radius or reply time
- "No experience needed", "All welcome", "Whether you're X or Y"
- What happens at a first session or after an enquiry
- Who the service is for
- Anything that begins "Martha will…" / "We'll…" about their process
- Credentials, registrations or titles in any wording but theirs

All of these mean: delete the sentence, write the question.

## Client Handover

When you send the link, say how many slots there are and what they are. Nineteen unexplained italic notes read as an unfinished site; the same nineteen, introduced, read as a short questionnaire the client can answer in one reply. Consider a copy deck (one row per slot) as the channel copy actually arrives by — labels on a page tell the client what to write, but cannot be typed into.
