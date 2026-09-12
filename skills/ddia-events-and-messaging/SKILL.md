---
name: ddia-events-and-messaging
description: Design or review event-driven, message-based, or stream-processing flows — queues, pub/sub, CDC, outbox, event sourcing decisions. Use when introducing asynchronous boundaries, event schemas, or durable logs, or when reviewing their correctness.
---

# Events and Messaging

DDIA ch.11–13 (batch, streams, streaming philosophy), ch.5 (schema evolution), ch.12
(delivery semantics ~pp.520–537). Hard Parts ch.11 (workflow coordination choices).

## When to use

- Introducing a queue, pub/sub topic, stream, or event-driven communication.
- Designing event schemas, consumer contracts, ordering semantics.
- Evaluating CDC, outbox, or event-sourcing approaches.
- Reviewing whether async is actually justified for a boundary.

## When NOT to use

Simple request/response where sync is fine and the latency/failure semantics are already
right. Async is not free resilience — it's eventual consistency plus delivery semantics.

## Procedure

### 1. Justify async

What does async buy here that sync doesn't? Valid answers: temporal decoupling (producer
runs without consumer), load leveling, fan-out to N consumers, durable work hand-off,
independent scaling. Invalid: "it's more decoupled" (sync call to a queue is still
coupling), "it's more reliable" (it trades call failure for delivery semantics),
"it's the architecture" (fashion). See `../../principles/simplicity-bias.md` and
`../../principles/coupling-ownership-boundaries.md`.

### 2. Delivery semantics — the honest menu

- **At-most-once**: fire and forget; loss acceptable (metrics, presence pings).
- **At-least-once**: redelivery until ack; the default for anything that matters —
  REQUIRES idempotent consumers or dedup (see `../ddia-failure-retries-idempotency/`).
- **Exactly-once**: does not exist as delivery; exists as *processing* via dedup +
  same-transaction effects, or via a durable-execution framework that journals
  (DDIA ch.12 ~pp.528–537, durable execution ch.5 ~pp.187–191).

State the semantics per channel, per consumer.

### 3. Ordering semantics

- Per-partition/per-entity ordering vs global ordering — global is expensive and rarely
  needed; per-entity is usually the right scope (route by entity key).
- What does a consumer do on: duplicate event, reordered event, missing predecessor, very
  old event? — `../../principles/ordering-causality-clocks.md`.
- A consumer that assumes in-order, once-only delivery is a correctness bug waiting.

### 4. Event schema and contract

- Version events; keep old-schema readers alive; additive evolution where possible —
  `../ddia-schema-evolution/`.
- What does a consumer do with an event it can't handle — skip, dead-letter, poison-pill
  loop? Dead-letter needs an owner and a drain process.
- Internal vs published schema: consider an outbox-shaped boundary if internal schema
  churn must not leak (DDIA ch.12 ~p.505).

### 5. The durable-log decision

- **Queue semantics** (message consumed once, then gone) vs **log semantics** (retained,
  replayable, multi-consumer offsets). Log buys: replay, new consumers joining later,
  auditability, rebuildable derived state. Costs: retention, compaction, consumer lag ops.
- **Event sourcing** (the log IS the state): only when audit/replay/time-travel is a
  product requirement, not an architecture preference. It changes every debugging and
  migration story.

### 6. CDC and outbox

- CDC (read the DB's own change feed) turns the DB into a source of truth that emits a
  stream — the clean way to keep derived stores honest (DDIA ch.12 ~pp.503–520).
- Outbox table = write intent + state in one transaction; dispatcher publishes. Prefer it
  over dual writes everywhere.

## Failure modes to hunt

- Dual write: commit DB then publish — crash between loses the event silently.
- Consumer lag unmonitored — "real-time" pipeline that's actually hours behind.
- Poison message redelivered forever, blocking the partition.
- "Exactly-once" claimed because the broker has a feature flag.
- Event replay producing different effects than the original run (nondeterministic
  consumers; non-idempotent effects).

## Validation

- Redeliver the same event twice → single effect.
- Reorder events → defined behavior (reorder buffer, reject, or tolerate).
- Stop the consumer for a while → catch-up path works and lag is observable.
- Poison event → dead-letters without wedging the stream.

## Output

Justification for async, delivery+ordering semantics per channel, schema/versioning plan,
dead-letter story, lag observability, and whether a durable log or plain queue suffices.
