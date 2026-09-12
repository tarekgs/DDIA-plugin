# Consistency Is a Requirements Decision

**Choose the weakest consistency model that preserves the invariant the product actually needs.**

## The principle

Consistency is not a property a system "has" — it is a menu of guarantees, each with a price
in latency, availability, and coordination (DDIA ch.8 on transactions, ch.10 on consistency).
The engineering task is to name the invariant first, then pick the cheapest mechanism that
protects it. Stronger than needed wastes latency and availability. Weaker than needed
corrupts state silently.

## The anomaly menu (know what each level actually prevents)

- **Read committed** — no dirty reads/writes. Does NOT prevent: stale reads, lost updates,
  non-repeatable reads.
- **Snapshot isolation / repeatable read** — each transaction sees a consistent snapshot.
  Does NOT prevent: **write skew** (two transactions read overlapping state, write
  disjoint rows, and jointly violate an invariant — e.g. two doctors both un-assign
  themselves from call because each saw "someone is on call"; DDIA ch.8, ~pp.303–309).
- **Serializable** — as if executed one at a time. Prevents write skew and phantoms. Costs:
  aborts/retries (optimistic) or lock contention (pessimistic).
- **Linearizability** — the strongest single-object guarantee: a read sees the latest write
  (ch.10, ~pp.402–411). Needed when a value must be *the* current truth (leader election,
  uniqueness, lock acquisition). It costs coordination and a round trip; most reads do not
  need it.

## What to check in code

- Which invariant does this transaction protect? Write it down. If the answer is "none, it's
  just two updates" — is that actually true, or is there an unstated "X implies Y" business
  rule spanning the rows?
- Read-modify-write on data read outside the transaction → lost update candidate (DDIA ch.8,
  ~pp.299–303). Fixes, cheapest first: atomic single-statement update, explicit row lock
  (`SELECT ... FOR UPDATE`), compare-and-set on version, or snapshot isolation with
  conflict detection.
- Constraints over multiple rows ("at most one active head per artifact", "balance >= 0
  across the ledger") are write-skew candidates under snapshot isolation. They need
  serialization of the *decision*, a materialized conflict row to lock, or serializable
  isolation.
- Optimistic client state (sync engines, local replicas): the server remains authoritative;
  optimistic values must be marked as provisional and reconciled, not treated as committed.
- Eventual consistency is only acceptable where the product tolerates stale reads — name
  the tolerance window and who notices when it's violated.

## Diagnostic questions

- What is the worst observable outcome if a reader sees data 5 seconds stale? 5 minutes?
- If two users (or a user and an agent) perform this action simultaneously, which of them
  should win, and what guarantees that?
- Does the code assume "I just wrote it, so the next read sees it"? Read-your-own-writes is
  a guarantee you have to buy (read from leader/primary, quorum, or session stickiness —
  DDIA ch.6, ~pp.215–219).
- Are we paying for serializable where a unique index or conditional update would do?

## Bottom line

Invariant first, mechanism second. Most correctness bugs are unprotected anomalies; most
performance bugs are unneeded coordination. Name both before choosing.
