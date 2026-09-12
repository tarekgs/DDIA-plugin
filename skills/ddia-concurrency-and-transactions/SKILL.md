---
name: ddia-concurrency-and-transactions
description: Reason about races, transaction isolation, invariants spanning multiple rows, concurrent writes, and conflict semantics. Use when designing or reviewing anything where two actors (humans, agents, jobs, replicas) can touch the same state, or where correctness depends on an invariant.
---

# Concurrency and Transactions

Primarily DDIA ch.8 (transactions/isolation) and ch.10 (consistency), with conflict-handling
from ch.6. Hard Parts ch.9 for ownership/transaction boundaries.

## When to use

- Designing a mutation that depends on data read earlier (read-modify-write).
- Reviewing code where two writers can interleave on the same datum.
- Choosing an isolation level, lock, CAS, or conflict-resolution rule.
- Any feature where "the invariant" is enforced by convention rather than mechanism.

## When NOT to use

Single-writer append-only flows, pure reads with no invariant, state owned by one actor
with no interleaving. Simple CRUD with no cross-row invariant rarely needs this depth.

## The procedure

### 1. Name the invariant

Write it as a sentence over the data: "a project has at most one active head", "stock never
goes negative", "a member sees only their threads plus promoted ones". If you can't name
it, you can't protect it.

### 2. Find the anomaly shape

Match the access pattern to the failure it permits (DDIA ch.8):

| Pattern | Anomaly | Cheapest sufficient protection |
| --- | --- | --- |
| Read row → modify → write back | **Lost update** (ch.8 ~pp.299–303) | Atomic UPDATE, CAS on version, explicit lock, or SI with conflict detection |
| Read predicate → write based on result | **Write skew / phantom** (~pp.303–309) | Serializable, or lock the premise rows; if the premise is "no row exists", materialize a conflict row or use serializable |
| Two writes to different stores | **Split commit** (~pp.323–324) | Outbox + same-transaction commit, or make the second write idempotent + reconciled |
| Read stale replica → write authority | Lost update via stale premise | Read-your-writes (read from leader / consistent snapshot) before the decision |
| Counter/aggregate in code | Lost update | Atomic increment, or keep the delta log and derive |

Key fact agents get wrong: **snapshot isolation does not prevent write skew**, and most
databases' default isolation is below serializable. "It's transactional" is not an answer —
name the level and what it prevents (Table 8-1, ~p.335).

### 3. Choose the mechanism

In order of preference:

1. **Declare it** — unique index, FK, CHECK, NOT NULL. Database-enforced invariants can't
   be forgotten.
2. **Single-writer / serialization** — route the entity's mutations through one writer, one
   partition, one queue. The cheapest strong guarantee.
3. **Conditional write** — CAS on version/revision, `UPDATE ... WHERE version = N`. Turns
   races into retryable conflicts.
4. **Explicit lock** — `SELECT ... FOR UPDATE` on the premise rows. Right when the conflict
   is real but rare.
5. **Serializable isolation** — when invariants are genuinely multi-row and contention is
   low enough that abort-retry is cheap (optimistic CC collapses under high contention —
   ~pp.318–319).
6. **Merge/CRDT** — only when concurrent writes must both survive by design (collaboration
   semantics), not as a correctness shortcut.

### 4. Concurrent-actor matrix

List actor classes that touch this state: human A, human B, agent turn, background job,
migration, sync engine. For each pair: what interleaving is possible, and which mechanism
arbitrates? Agents get no special treatment — `../../principles/agents-are-writers.md`.

### 5. Conflict resolution semantics (when concurrency is allowed)

If the design permits concurrent writes that can't be prevented, define:

- Who observes a conflict — server, client, the loser?
- What's the resolution — LWW, merge function, surface-to-user, queue, reject?
- What does the loser see/experience? "Silent clobber" is a decision, not an accident.
- Can resolved state be inspected later (conflict log, audit)?

## Failure modes to actively hunt

- Optimistic UI treated as committed state (the replica is not the authority).
- Version/clock fields updated by two paths that don't check each other.
- A uniqueness invariant enforced only in application code (two concurrent inserts pass).
- Retry of an aborted transaction that double-applies a non-transactional side effect.
- Locks held across network calls or user think-time — keep transactions short
  (~pp.310, 315–316).
- Distributed locks without fencing — a paused holder can corrupt shared state
  (ch.9 ~pp.373–377).

## Validation

- A deterministic test that interleaves the two writers that must not race.
- If the invariant is cross-row, a test that violates it under concurrent load.
- For optimistic paths: a test proving stale-premise writes are rejected.

## Output

The invariant(s), the anomaly each mechanism prevents, the chosen mechanism per boundary,
the conflict semantics where races are allowed, and anything deferred with a trigger.
