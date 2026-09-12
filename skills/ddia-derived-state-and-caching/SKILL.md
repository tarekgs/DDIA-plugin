---
name: ddia-derived-state-and-caching
description: Design or review caches, materialized views, indexes, projections, search indexes, denormalized state, and other derived data. Use when adding any representation of state whose authority lives elsewhere.
---

# Derived State and Caching

DDIA ch.1 (systems of record vs derived data ~pp.10–12), ch.3 (denormalization trade-offs),
ch.12 (materialized views, CDC ~pp.503–520), ch.13 (dataflow correctness). Hard Parts ch.6
(operational data decomposition — join/summary/materialized-view patterns ~pp.131–184).

## When to use

- Adding a cache, read replica, materialized view, search index, denormalized column, or
  projection of authoritative state.
- Reviewing code that maintains two representations of one fact.
- Deciding whether to denormalize for read performance.

## When NOT to use

The authoritative store itself; purely transient per-request state with no persistence.

## Procedure

### 1. Declare the authority

- Which store is the source of truth? The derived representation is disposable — can it be
  fully rebuilt from the source? If no, it is secretly authoritative; redesign or admit it.
- `../../principles/source-of-truth.md` first, always.

### 2. Choose the derivation mechanism

| Mechanism | Staleness | Complexity | When it wins |
| --- | --- | --- | --- |
| Same-transaction write (denormalized column, counter) | none | low | invariant-adjacent derived data; cheap |
| Change feed / CDC → projection | ms–s | medium | indexes, materialized views, sync replicas |
| Event-driven update | ms–s | medium | decoupled consumers, audit trail |
| Periodic rebuild (batch recompute) | minutes–hours | low | heavy derivations, backfills, analytics |
| Read-through cache | TTL/stampede bounded | low | hot reads where stale is acceptable |

Pick by required freshness and rebuild cost — not by fashion.

### 3. The invalidation story

- How does the derived copy learn about changes — event, poll, trigger, manual?
- What is the staleness bound, and does the product tolerate it? Name the number.
- Stale-derived-read → write-to-authority is a lost-update shape: check
  `../../principles/consistency-tradeoffs.md`.
- Missing update propagation: a missed event leaves the derived copy wrong *silently*.
  Detect via reconciliation, version/cursor gaps, or periodic full-compare.

### 4. Rebuild and repair

- How is the derived store rebuilt — backfill job, replay from log, reindex? Is the path
  tested, or theoretical?
- Can the derivation be versioned so a v2 projection can build while v1 serves?
- Who notices divergence between source and derived? (Integrity check, drift alarm, or
  user complaint — pick deliberately.)

### 5. Cache-specific hazards

- Stampede on miss (many readers recomputing the same miss) — request coalescing or
  early-recompute.
- TTL as the only invalidation — acceptable staleness must be a stated number, not a
  shrug.
- Cache-as-source bugs: code writing to cache that never reaches the authority.
- Key versioning across deploys: a cached shape incompatible with new code.

## Failure modes to hunt

- Derived copy treated as authoritative ("read from the index, write to the index").
- Update path with no ordering: events applied out of order leaving a wrong final state.
- Partial rebuild leaving mixed-version state.
- Denormalized counter drifting from truth with no reconciliation.
- A second sync plane added beside an existing one ("just for this feature") — two derived
  copies diverging.

## Validation

- Divergence test: write to source, assert derived catches up within the bound.
- Rebuild test: nuke the derived store, rebuild, assert equivalence.
- Kill the propagation path mid-update; assert recovery, not silent staleness.

## Output

Authority declaration, derivation mechanism + staleness bound, invalidation path, rebuild
procedure, divergence detection, and any invariant the derived copy must still obey.
