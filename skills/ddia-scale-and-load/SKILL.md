---
name: ddia-scale-and-load
description: Model load, find hot spots, reason about tail latency, backpressure, and overload. Use when asked "will this scale", when adding fan-out or a hot path, when choosing sharding/partitioning, or when deciding whether a scale concern is now or later.
---

# Scale, Load, and Hot Spots

DDIA ch.2 (nonfunctional requirements, load, percentiles, overload ~pp.33–64) and ch.7
(sharding, skew, rebalancing ~pp.251–276). Hard Parts granularity material for the
"split for scale" question.

## When to use

- "Will this scale?" questions — turn them into a load model, not a vibe.
- Adding a hot path: per-keystroke sync, per-cell writes, fan-out to N consumers.
- Choosing partitioning/sharding, or fighting a measured hot spot.
- Deciding if a scale concern is a now-problem or a deferred one (with a named trigger).

## When NOT to use

Cold paths with bounded load; changes with no measurable throughput/latency surface.
Do not use this skill to justify pre-scaling — see `../../principles/simplicity-bias.md`.

## Procedure

### 1. Write the load model

Numbers, not adjectives:

- request/event rate, read:write ratio, payload sizes
- fan-out per action (one write → how many replicas/clients/queues?)
- load shape: uniform, skewed by tenant/artifact/time-of-day?
- growth driver and the doubling horizon
- first resource to saturate, and the observable signal of approaching it

### 2. Latency honesty

- Percentiles, not averages — p50/p95/p99 of the user-visible path (DDIA ch.2 ~pp.40–43).
- Tail amplification: a request that fans to N dependencies has p99 ≈ the slowest
  dependency's tail. Fan-out is a tail multiplier.
- Queueing delay vs. service time: under load, queueing dominates; that's where overload
  latency comes from.

### 3. Hot spots

- Which entity could plausibly be 100× hotter than average — a viral artifact, a whale
  tenant, a hot key/partition, a busy thread?
- Skew defeats capacity planning: a hot partition can't be fixed by adding replicas to
  cold ones.
- Mitigations in order: key design → hot-key splitting → per-tenant/key shedding →
  rebalancing → repartitioning. Each is a different cost (ch.7 ~pp.254–274).

### 4. Overload response — decide before the spike

- Bounded queues + backpressure: propagate pressure backward instead of buffering forever
  (backpressure ~p.38).
- Load shedding: shed *what* — cheap requests first, or expensive ones? Per-tenant fair
  shedding vs global?
- Degradation: which features degrade (fresher data → stale, sync → async) under pressure?
  Degradation is a designed behavior, not an accident.
- Retry amplification: retries on an overloaded dependency are the overload. Budgets and
  jitter — `../../principles/retry-safety.md`.

### 5. Scaling axis choice

- Scale reads (replicas, caches, derived stores) or writes (partitioning) or the path
  (simplify the hot op)? Each buys different relief.
- Shared-nothing partitioning is the write-scaling answer and the operational-price answer:
  resharding, cross-partition queries, hot partitions — only when the load model demands it.
- For the "split a service for scale" question, run
  `../ddia-service-boundaries/` — scale is one disintegrator, not a free pass.

### 6. Now or later — the defer discipline

A deferred scale concern must carry an **observable trigger**: "revisit when X metric
crosses Y" with the metric actually measurable. Otherwise the deferral is just forgetting.

## Failure modes to hunt

- Unbounded queue growth hiding an overload until latency is unbounded.
- Fan-out multiplication nobody priced (write → N clients → each client writes → N²).
- Averages looking fine while p99 burns.
- A "temporary" single-node assumption baked into a place that can't be sharded later
  (global sequence, cross-partition invariant).
- Scaling work justified by a scenario the product can't reach this year.

## Validation

- A load test or a back-of-envelope model with real numbers — both beat adjectives.
- Measure the tail under load, not the average.
- Overload test: exceed capacity; verify the designed response (shed/degrade/backpressure)
  actually happens.

## Output

The load model (numbers), the first-saturation claim with evidence, the overload response,
any hot-spot candidates, and deferred concerns each with a named trigger.
