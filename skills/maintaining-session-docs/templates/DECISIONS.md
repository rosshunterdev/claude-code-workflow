# DECISIONS — <project>

Append-only, newest first. One entry per decision: the what, the why, what was ruled out.

Statuses are a closed set: `OPEN → DECIDED → BUILT → VERIFIED`, plus `SUPERSEDED by D-NNN`.
Exact tokens only — qualifiers go after a dash, never inside the token.
**The session that ships a decision flips its status in the same session.**

- OPEN — parked, needs a call
- DECIDED — agreed direction, not yet built
- BUILT — implemented and build-verified, not yet verified in the running product
- VERIFIED — confirmed working in the running product (browser/device/user)
- SUPERSEDED by D-NNN — replaced; kept for history

---

### D-001 — <title>
**Decision.** <what was chosen, concretely>
**Why.** <the reasoning, including what was ruled out and why>
**Status:** DECIDED (Session N, YYYY-MM-DD)
