---
name: ddia-service-boundaries
description: Decide or review component/service boundaries, data ownership, granularity, and sync-vs-async communication. Use when splitting or merging components, assigning data ownership, choosing module structure, or questioning whether something should be a service.
---

# Service Boundaries and Data Ownership

Primarily Hard Parts (chs. 2–10) with DDIA ch.1 (distributed vs single-node ~pp.19–24) and
ch.12 for the sync/async choice.

## When to use

- "Should this be a separate service/module/component?"
- "Who should own this data?"
- "Sync call or event here?"
- Reviewing a boundary that grew organically and may be wrong.
- A change that crosses existing boundaries more than it should.

## When NOT to use

Intra-module refactors, single-component changes, clear cases where the boundary is already
load-bearing and unchallenged.

## Procedure

### 1. What exists today

- Map the current boundary: components, their owned data, their communication styles, their
  deploy/failure domains. Evidence over diagram — read the imports, the queries, the calls.
- Name the coupling: static (shared lib/schema/contract — change ripples) vs dynamic
  (sync calls, shared transactions, coordinated deploys — failure ripples). See
  `../../principles/coupling-ownership-boundaries.md`.

### 2. The granularity score

Integrators (keep together) vs disintegrators (split) — Hard Parts ch.7 ~pp.185–218:

**Integrators**
- shared transactions / invariants spanning the data
- workflow intimacy (many calls per user action — chattiness)
- shared logic that changes together
- tight consistency/latency requirements across the pair
- same team, same deploy cadence, same scale profile

**Disintegrators**
- genuinely different scale requirements
- fault isolation (one must survive the other's failure)
- different architecture characteristics (one needs strong consistency, one needs
  availability)
- security/compliance boundary
- independent change/deploy cadence with a real driver (not aspiration)
- data ownership clarity that the merger actively hurts

Score both lists against THIS boundary. All integrators + no disintegrators = keep together.
All disintegrators + no integrators = split. Mixed = the trade-off you must name.

### 3. The data ownership question

- One writer per data domain — the default. A table written by three components has no
  owner (Hard Parts ch.9 ~pp.249–282).
- Common ownership (shared schema/DB) couples components at the strongest level — it means
  "these are the same thing wearing two hats". That's fine when the integrators win;
  it's a trap when they don't.
- If data must be shared across a boundary, choose the access pattern deliberately: API
  call (temporal coupling), read replica (consistency lag), event-driven replication
  (eventual), data service (ownership boundary at the data layer) — Hard Parts ch.10.

### 4. Sync vs async

- Sync: simple, immediate consistency, but temporally coupled — the callee's latency and
  availability become the caller's. Failure propagates.
- Async: decoupled in time, but eventual consistency, delivery semantics, and harder
  debugging. Choose per interaction, not per system — `../ddia-events-and-messaging/`.
- A synchronous chain deeper than ~3 services is a reliability smell — each link multiplies
  the tail.

### 5. The distributed-transaction consequence

Splitting data across components converts local transactions into sagas — compensating
actions, partial-failure choreography, inconsistent intermediate states. If the invariant
needs atomicity, the split is fighting your requirements —
`../ddia-distributed-workflows/`.

### 6. Middle options first

- Same service, separate modules with enforced ownership.
- Same DB, separate schemas with per-writer ownership.
- Same boundary, async where sync isn't needed.
- Split later with a named trigger. "Modular monolith" is a legitimate architecture, not a
  consolation prize.

## Failure modes to hunt

- Distributed monolith: split boundaries with the coupling still there (shared schema,
  chatty sync calls, deploy-together requirement) — worst of both worlds.
- Service-per-table decomposition: a boundary per data type with the transaction need
  still spanning all of them.
- Shared "common" library carrying domain logic both sides secretly own.
- A boundary drawn by org chart or by tech preference, not by the integrator/
  disintegrator analysis.

## Validation

- Change-impact test: pick three plausible changes; count components that must change
  together under each candidate structure.
- Failure-impact test: kill each component; list what user-visible function dies.

## Output

The boundary map (current + proposed), the integrator/disintegrator score, the ownership
assignment per data domain, sync/async per interaction, and the defer triggers for any
split you're not making now.
