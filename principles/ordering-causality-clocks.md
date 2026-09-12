# Ordering, Causality, and Clocks

**"Later" is only meaningful where someone serialized the events.**

## The principle

Within one thread of execution, ordering is obvious. Across processes and machines it is a
claim that must be earned: messages can be reordered in flight, delays are unbounded, and
wall clocks on different machines disagree by enough to misorder events (DDIA ch.9,
~pp.363–372). Any logic that depends on "A happened before B" across a boundary needs an
explicit mechanism — sequence numbers, vector clocks/logical clocks, causality tokens, or a
single serializer — and an explicit answer for ties and gaps.

## What to check in code

- Any use of wall-clock timestamps (`Date.now()`, `created_at`) as an ordering key for
  correctness — on synced clients, unsynced servers, or retries. Fine for display; dangerous
  for conflict resolution or dedup. Last-write-wins by timestamp silently loses writes when
  clocks skew (DDIA ch.6, concurrent writes ~pp.226–232; ch.9 clocks).
- Does a consumer assume events arrive in emission order? Across a queue partition,
  reconnect, or relay hop, that assumption needs a sequence number and gap handling.
- Causality: "B is a response to A" must be carried as data (parent ID, version vector,
  causal token), not inferred from arrival order (DDIA ch.10, causal consistency
  ~pp.413–419).
- Distributed locks/leases: the holder must present a fencing token that the resource
  checks. A lease in the holder's own memory protects nothing after a GC pause (fencing,
  ~pp.373–377).
- Merge/conflict resolution: what does the system do with two concurrent writes it cannot
  order? LWW, merge function, explicit conflict record, or last-writer coordination — pick
  deliberately per data type.
- Sequence gaps: after reconnect or consumer restart, how are missed events detected and
  backfilled (catch-up read, replay from durable log, snapshot + deltas)?

## Diagnostic questions

- Where does ordering come from in this flow — a single sequencer, a sequence column, a
  leader, or nothing?
- If event 2 arrives before event 1, or arrives twice, or never arrives, what does the
  consumer do?
- Who is allowed to observe intermediate states, and can they act on them?
- Is there a "happens-before" chain for the operations that must be ordered, or are we
  relying on the network being kind?

## Rules of thumb

- One serializer per ordering domain: a single writer, a per-entity sequence, or a
  partitioned log. Ordering claims spanning multiple independent serializers are illusions.
- Lamport/logical clocks order causally related events across nodes cheaply; they do not
  give you real-time ordering.
- Total order across the system requires consensus or a single leader — pay for it only
  where an invariant genuinely needs global ordering (DDIA ch.10, ~pp.419–433).
- Idempotent, order-tolerant consumers are the cheapest robustness you can buy downstream.

## Bottom line

Find every place the code assumes "first/after/latest". For each: what assigns that order,
what happens when two events tie, and what happens when they arrive inverted.
