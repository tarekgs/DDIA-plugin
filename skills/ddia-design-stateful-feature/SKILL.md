---
name: ddia-design-stateful-feature
description: Design a new feature that persists, moves, or derives state. Use when building anything that writes to a store, crosses a service/network boundary, involves concurrent actors, or adds async/event-driven work. Produces a small design record with explicit invariants and named trade-offs.
---

# Design a Stateful Feature

Distilled from DDIA (chs. 1–2, 5, 8–10, 12–13) and Hard Parts (chs. 2–7, 9, 11–12).

## When to use

- A new feature writes to a DB/file/blob, emits events, or syncs state.
- A new flow crosses process boundaries (client→server, service→service, job→worker).
- The feature will be touched by more than one actor class (human, agent, job, replica).

## When NOT to use

Pure rendering, local refactors, or changes with no new state, boundary, or concurrency.
If in doubt, the test is: "could two runs of this produce a different result depending on
ordering?" If no — proceed without this skill.

## Procedure

### 1. State inventory (write it down)

- List every piece of state the feature creates or mutates.
- For each: **source of truth** (authoritative store) vs **derived** (cache, replica,
  projection, index). Derived state needs a declared source and a rebuild path.
  See `../../principles/source-of-truth.md`.
- For each: durability requirement — what is lost if the process dies right now?
- Classify each as: durable user data / durable system state / ephemeral / derived.

### 2. Mutation path

- Trace the write: actor → API → validation → authoritative commit → propagation →
  consumers. Identify the single commit that makes the change real.
- If the mutation writes to >1 store, name the point of no return and the compensation
  for the second write failing. Prefer an outbox (commit + event in one transaction) over
  dual writes — DDIA ch.12 ~p.505.
- Enumerate the actor classes that can perform this mutation (incl. agents and jobs) —
  `../../principles/agents-are-writers.md`.

### 3. Consistency and concurrency requirements

- Name the invariants in words ("a project has ≤1 live head", "a turn belongs to its
  thread", "a revoked member sees nothing"). Each needs a mechanism: constraint,
  transaction isolation, single-writer, or accepted-tolerance window.
- For each read the feature depends on: how stale can it be? Read-your-own-writes needed?
  See `../../principles/consistency-tradeoffs.md`.
- Ordering: does anything depend on events arriving in order or exactly once? Name the
  mechanism — `../../principles/ordering-causality-clocks.md`.

### 4. Failure and retry surface

- For every cross-boundary call: the four outcomes (not sent / rejected / done-but-lost /
  still-running) and the retry story for each — `../../principles/partial-failure.md`,
  `../../principles/retry-safety.md`.
- Where can this operation be interrupted mid-way (crash, cancel, agent stop)? What is the
  resume/compensate path?

### 5. Boundary and granularity check

- Is this feature inside the right component, or does it pull for a new boundary? Score the
  integrators vs disintegrators — `../../principles/coupling-ownership-boundaries.md`.
- Sync or async communication? If async, which parts tolerate eventual consistency?

### 6. Evolution and scale honesty

- What changes shape on rollout (schema, wire format, contract)? Compat story —
  `../../principles/evolution-compatibility.md`.
- Load model: expected rps, fan-out, hot entity candidates, first saturation point,
  overload response — `../../principles/scale-honestly.md`. Don't build for scale you
  can't name.

### 7. Produce the design record

Keep it to ~1 page in the PR description or the project's decision folder:

- **State map**: state → authority → derived copies → rebuild path
- **Mutation path** with the commit boundary marked
- **Invariants** and the mechanism protecting each
- **Failure matrix** for cross-boundary calls
- **Actor table**: who can write what, with what authz
- **Decisions**: alternatives + chosen + why; flag anything needing an ADR
  (`ddia-architecture-decisions`)
- **Defer list**: concerns deliberately postponed, each with an observable trigger

## Assumptions to challenge

- "The DB will just have it" — does it, or does a replica/cache serve the read?
- "The client sent the final state" — or a stale snapshot that must be validated?
- "This event fires once" — delivery is at-least-once unless dedup says otherwise.
- "The agent's write is safe because it's server-side" — no; agents are concurrent writers.
- "We need event sourcing / a queue / a service split" — apply
  `../../principles/simplicity-bias.md` first.

## Validation to pair with implementation

- Concurrency: a test that interleaves the two most dangerous writers.
- Failure: kill/timeout the dependency at the commit boundary; assert the recovery path.
- Evolution: old-version client against new server (or a compat fixture test).
- The narrowest test that would catch the worst failure mode — not a harness, a check.

## Common outcomes

- Feature stays inside the existing component; no new boundary.
- One extra table + an outbox row instead of a second store write.
- Idempotency key + unique constraint instead of a distributed lock.
- "Defer the async pipeline; poll the derived table until latency SLO says otherwise."
