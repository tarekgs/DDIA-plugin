---
name: ddia-architecture-decisions
description: Record or review architectural decisions (ADRs) and design objective architecture checks (fitness functions). Use when a consequential, hard-to-reverse choice is made, when documenting why an option was rejected, or when an invariant should be enforced automatically.
---

# Architecture Decisions and Governance

Hard Parts ch.15 (trade-off analysis) and the evolutionary-architecture method; DDIA ch.1
for the trade-off posture. The durable statement of this principle lives in
`../../principles/decisions-are-governable.md`.

## When to use

- A decision is consequential and expensive to reverse (new store, new boundary, new
  consistency commitment, a rejected option that will recur).
- An architectural invariant should become mechanically checkable.
- Reviewing whether a proposed decision deserves an ADR.
- Periodic governance: are decisions still honored?

## When NOT to use

Implementation details, library picks, anything cheap to change, or the nth micro-decision
in a day — ADRs are for durable constraints.

## Procedure A — writing/reviewing an ADR

### 1. Is it an architectural decision?

Expensive to reverse + constrains future choices = yes. "Which ORM" is a detail; "Zero is
the sync plane for structural state" is a decision. When in doubt: would a future
contributor need to know *why* to avoid re-breaking it?

### 2. The record (≤1 page)

```markdown
# ADR-NNNN: <title>
Status: proposed | accepted | superseded by ADR-M | revisited YYYY-MM-DD
Date: / Commit:

## Context
What forced this: requirements, constraints, evidence. Include numbers where they exist.

## Alternatives considered
Real candidates with honest costs — including "do nothing" / "keep current".

## Decision
What we chose, stated as a rule a future reader can check code against.

## Consequences
What this makes easier / harder / required / forbidden.

## Revisit when
Observable triggers that reopen this. (A decision without triggers is dogma.)
```

### 3. ADR review checklist

- Alternatives are real (not strawmen) and include keep-as-is.
- Consequences are honest about cost, not a sales pitch.
- Revisit triggers are observable, not vibes.
- The decision statement is checkable — "X is the authority for Y" not "X is preferred".

## Procedure B — fitness functions (objective architecture checks)

### 1. Is the invariant checkable?

Worth automating only if: important + objective + cheap + stable. Fuzzy rules stay as
review checklist items — don't mechanize judgment.

### 2. Candidate shapes

- **Dependency rules**: forbidden imports between modules/packages ("workflows never import
  provider SDKs"; "browser-safe package never imports node-only"). Cheap static check.
- **Ownership rules**: only component X writes table T — a lint over the codebase.
- **Layering**: no upward dependencies; domain purity at declared boundaries.
- **Contract checks**: OpenAPI/schema compatibility diffs, consumer-driven contract tests.
- **Replay gates**: durable-execution histories replay before deploy.
- **Budgets**: payload caps, history size, API shape invariants — measurable thresholds.
- **Docs-vs-code drift**: generated inventory compared to a committed manifest.

### 3. Placement

- Put the check at the cheapest layer that catches it: lint > unit test > CI lane > runtime
  assertion > audit job.
- Every check names the invariant it protects and what failure means — a failing check
  that nobody understands gets deleted.

### 4. Distinguish three failure meanings

| Check fires | Meaning | Response |
| --- | --- | --- |
| Fitness function red | The SYSTEM drifted from intent | Human architectural review — the code may be right or the invariant may need amending |
| Profile/docs drift check red | The DOCS stopped matching code | Update the docs (code is authoritative for behavior) |
| ADR contradicts code | A deliberate decision is being silently reversed | Surface for explicit re-decision — never silently edit the record |

## Procedure C — periodic governance

Cheap governance that actually runs:

- When reviewing any change: does it violate a recorded ADR/invariant? If yes — require
  explicit re-decision, not silent override.
- When a new invariant lands: is it checkable? If yes and cheap → fitness function; if
  judgment-only → add to the review checklist.
- Revisit triggers that fired → re-open the ADR, update status, link forward.

## Output

ADR file(s) in the project's decision location (or a PR note for review), any new fitness
check with its invariant named, and the list of decisions-deferred with triggers.
