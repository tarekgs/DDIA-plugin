---
name: ddia-engineer
description: Front door for data-intensive and distributed-systems engineering judgment. Use when a task touches persisted state, concurrency, sync, retries, schema evolution, service boundaries, events, scale, or architecture decisions — or when you're unsure whether it does. Routes to the right specialized reasoning skill.
---

# DDIA Engineer — Router

This skill is the entry point to the DDIA engineering plugin. It does one job: look at the
task, detect which data/distributed/architecture concerns are live, and hand you to the
right specialized skill(s). It contains no checklists of its own — the specialized skills
own the substance.

Sources: *Designing Data-Intensive Applications* 2e (Kleppmann & Riccomini) and
*Software Architecture: The Hard Parts* (Ford, Richards, Sadalage, Dehghani).

## Step 1 — Does the task touch any of these surfaces?

If yes to any, this plugin is relevant:

- writes or changes **persisted state** (DB rows, files, blobs, documents, caches)
- crosses a **process/network boundary** (API, queue, stream, sync, replication, RPC)
- involves **concurrent actors** (users, agents, jobs, replicas) or ordering assumptions
- changes a **schema, protocol, or contract** that multiple code versions must survive
- adds **retries, timeouts, caching, fan-out, background work**, or a new **component/service**
- claims something about **consistency, exactly-once, ordering, or "the latest" state**
- proposes **splitting or merging** components, services, or data domains
- touches **realtime/multiplayer/offline** behavior
- decides something **expensive to reverse**

If the task is pure UI styling, local refactoring, or content work with none of the above:
stop here. Don't manufacture distributed-systems ceremony for a local change.

## Step 2 — Route by decision surface

| Your situation | Go to |
| --- | --- |
| Designing a new feature that persists or moves state | `ddia-design-stateful-feature` |
| Reviewing a diff/PR/design for correctness, races, compat, failure modes | `ddia-review-architecture-change` |
| Reasoning about transactions, isolation, invariants, concurrent writes, conflicts | `ddia-concurrency-and-transactions` |
| Adding/handling timeouts, retries, dedup, cancellation, partial failure | `ddia-failure-retries-idempotency` |
| Realtime collab, sync engines, optimistic state, multiplayer, reconnect/offline | `ddia-realtime-sync-design` |
| Changing a persisted schema, wire format, API contract, or running a migration | `ddia-schema-evolution` |
| Load, hot spots, tail latency, backpressure, "will this scale", when to shard | `ddia-scale-and-load` |
| Adding a cache, materialized view, index, projection, or derived store | `ddia-derived-state-and-caching` |
| Introducing events, queues, streams, CDC, outbox, async processing | `ddia-events-and-messaging` |
| Splitting/merging components or services; data ownership; sync vs async comms | `ddia-service-boundaries` |
| Multi-step operations spanning components; sagas; orchestration; durable execution | `ddia-distributed-workflows` |
| Recording or reviewing an architectural decision; adding a fitness check | `ddia-architecture-decisions` |
| Generating this repo's architecture profile | `create-ddia-project-profile` |
| Refreshing a stale profile, detecting drift or invariant violations | `maintain-ddia-project-profile` |

Multiple skills can apply. Pick the primary one by **the decision being made**, not by
which file is being edited. Example: "add retries around the artifact save call" is
primarily `ddia-failure-retries-idempotency`, with `ddia-concurrency-and-transactions` if
the retry could produce a second mutation that races another writer.

## Step 3 — Two global rules that always apply

1. **Name the source of truth.** Before any design or review, state which store is
   authoritative for the data involved and which are derived. If you can't, that's the
   first finding. See `principles/source-of-truth.md`.
2. **Classify before judging.** For anything you inspect, decide whether it's IMPLEMENTED,
   PARTIAL, PLANNED, ABSENT, or UNKNOWN. Absent is not a defect; planned-but-unbuilt is an
   obligation, not an implementation bug. Don't audit a design that was never claimed to
   exist.

## Shared references (load only when the routed skill points you there)

- `principles/` — one file per cross-cutting principle (source of truth, partial failure,
  retry safety, consistency trade-offs, ordering/causality/clocks, evolution, scale,
  coupling/ownership, simplicity bias, agents-as-writers, decisions/fitness, reliability
  engineering).
- `references/book-map.md` — where each topic lives in the two books, for when you need to
  read deeper or cite a chapter.
- `references/failure-modes.md` — the consolidated failure-mode index across skills.

## Tone of the plugin

Every skill ends in a decision, not a summary. "Keep the current design", "keep these
together", and "defer with a named trigger" are first-class outcomes. The books are
frameworks for trade-off reasoning, not catalogs of machinery to adopt.
