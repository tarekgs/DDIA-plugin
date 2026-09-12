---
name: ddia-review-architecture-change
description: Review a diff, PR, or design for data/distributed correctness — races, hidden exactly-once assumptions, schema compat, failure modes, boundary violations. Use on any non-trivial change touching state, boundaries, concurrency, or deployment shape.
---

# Review an Architecture Change

Distilled from DDIA (chs. 1–2, 5–13) and Hard Parts (chs. 2–3, 6–13, 15).

## When to use

- Reviewing a PR/diff that touches persistence, APIs, sync, events, workflows, caching,
  concurrency, or deployment topology.
- Evaluating a proposed design before it's built.

## When NOT to use

Mechanical or purely local changes. Don't manufacture distributed review for a style fix.

## Procedure

### 0. Scope and classify

- What does this diff actually change? List the surfaces: schema, API/wire, state machine,
  transaction boundary, retry policy, component topology, contract.
- For each touched capability, classify IMPLEMENTED / PARTIAL / PLANNED / ABSENT. Review
  implemented code against real behavior; review plans against obligations, not fake bugs.

### 1. State and source of truth

- Did any datum gain a second authority, or a write path that bypasses the declared one?
- New derived state: does it have a rebuild path and a declared staleness bound?
- Dual writes introduced? Two stores changed without an atomic commit or outbox?
  `../../principles/source-of-truth.md`.

### 2. Concurrency pass

- Map concurrent actors onto the changed state: human-human, human-agent, agent-agent,
  human/agent-job — `../../principles/agents-are-writers.md`.
- Find read-modify-write and check-then-act patterns outside a protecting transaction:
  lost-update and write-skew candidates — `../../principles/consistency-tradeoffs.md`.
- Ordering assumptions: anything depending on arrival order, "latest" by timestamp, or
  exactly-once delivery — `../../principles/ordering-causality-clocks.md`.

### 3. Failure pass

- For each new/changed boundary call: the four outcomes and the retry semantics. Is the
  retry safe? Is there a budget and a give-up path? — `../../principles/retry-safety.md`.
- New partial-failure mode: what happens if step 2 of N never runs? Is there an orphaned
  state, an unreclaimed lease, an unpublishable row?
- Timeouts: present? bounded? shorter than the caller's budget?
- Cancellation/interruption: does mid-flight cancel leave clean state?

### 4. Evolution pass

- Persisted/wire shape changes: compatible with the oldest live reader/writer? Expand/
  contract respected? Old clients during rollout? — `../../principles/evolution-compatibility.md`.
- New required fields, removed enum values, changed semantics on an existing field.
- Migration safety: destructive steps present without the repo's required markers/reasoning?

### 5. Boundary and granularity pass

- New dependencies between components — static (shared lib/schema/contract) and dynamic
  (sync calls, distributed txns, coordinated deploys). Justified or accidental?
- Does the change split something that transacts together, or fuse things with different
  scale/failure/ownership needs? — `../../principles/coupling-ownership-boundaries.md`.
- New distributed machinery — does it pass `../../principles/simplicity-bias.md`'s
  justification bar?

### 6. Scale and reliability pass (only if the change touches a hot or fanned path)

- New fan-out, hot-key candidates, unbounded queues, unbounded retries.
- Tail latency: does a slow dependency now sit on a user-visible path?
- `../../principles/scale-honestly.md`, `../../principles/reliability-engineering.md`.

### 7. Governance pass

- Is a consequential, hard-to-reverse decision being made implicitly? → require an ADR
  (`ddia-architecture-decisions`).
- Is a documented invariant being contradicted? → surface it; never let the diff silently
  reverse a deliberate decision.
- Is a checkable invariant being introduced? → suggest the smallest fitness check.

## Output format

Findings ordered by severity, each with:

- **Claim**: what will go wrong, concretely (failure scenario, not abstract risk).
- **Evidence**: file:line / doc reference.
- **Category**: correctness | reliability | compatibility | evolvability | operability.
- **Confidence**: verified-in-code / strongly-suspected / needs-investigation.
- **Recommendation**: smallest sufficient fix; include "accept and document" when honest.
- **Book grounding**: chapter refs when they sharpen the point.

End with: blockers vs non-blockers, and any decision that should become an ADR.

## Anti-patterns in review

- Flagging ABSENT capabilities as defects.
- Recommending more machinery than the measured problem needs.
- "Consider adding X" without the failure mode X prevents.
- Re-litigating documented decisions instead of citing them.
