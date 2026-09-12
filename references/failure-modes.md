# Failure-Mode Index

The consolidated list of named failure modes the plugin teaches agents to hunt, grouped by
where they live. Each entry: the mechanism in one line, and where to read more
(DDIA ch.N / HP ch.N). This is a *radar*, not a checklist — use it to notice a mode in the
code in front of you, then open the matching skill/principle.

## Boundary and network (DDIA ch.9)

- **Ambiguous timeout** — caller can't distinguish "never arrived" from "done, response
  lost" from "still running". Every cross-boundary call has this shape.
- **Unbounded delay** — queues, GC pauses, network stalls can delay arbitrarily; a timeout
  is a guess, not a fact.
- **Process pause split-brain** — a paused node looks dead to peers but wakes up believing
  it still holds a lease/leadership. Requires fencing the resource, not trusting the holder.
- **Clock skew** — wall clocks disagree across machines; timestamp-ordered "latest write"
  can be wrong. Monotonic clocks measure durations only.
- **Partial failure cascade** — a dependency's failure becomes your failure when you're
  synchronously coupled to it.

## Concurrency and consistency (DDIA ch.8, ch.10)

- **Lost update** — two read-modify-write cycles interleave; the later write clobbers the
  earlier. Not prevented by read-committed; patchable with atomic ops, CAS, or locking.
- **Write skew** — two transactions each preserve an invariant alone and jointly violate it
  (both read the premise, write disjoint objects). Snapshot isolation does NOT prevent it.
- **Phantom** — the set of rows matching a predicate changes mid-decision; the write skew
  variant where there's no row to lock.
- **Dirty read/write** — observing or overwriting uncommitted state.
- **Stale-premise write** — acting on a read that was true when read but isn't anymore;
  the agent-reads-then-writes shape.
- **Read-your-writes violation** — client writes, then reads a lagging replica and sees its
  own write missing.

## Delivery and retries (DDIA ch.9, ch.12)

- **Duplicate delivery** — at-least-once delivers twice; non-idempotent consumer applies
  twice.
- **Lost delivery after commit** — dual write: DB commits, publish never happens (no
  outbox).
- **Retry storm** — retries amplify load on an already-overloaded dependency; unbounded
  retries are unbounded load.
- **Poison message** — a message that always crashes the consumer is redelivered forever.
- **Metastable overload** — overload → retries → more overload → stays broken after load
  drops. Broken by backoff+jitter, budgets, load shedding (DDIA ch.2 ~38).

## Ordering and propagation (DDIA ch.9, ch.12)

- **Reorder across boundary** — events arrive out of emission order; consumer assumed
  in-order.
- **Gap after reconnect** — missed events between disconnect and catch-up; no gap detection.
- **Causality loss** — "B is a reply to A" inferred from arrival order instead of carried
  as data.
- **Derived-state divergence** — a missed update leaves a projection silently wrong; no
  reconciliation path.
- **Exactly-once illusion** — a flag on a broker is not end-to-end exactly-once; only
  dedup-in-transaction or journaling gets you effectively-once.

## Data and schema (DDIA ch.5; HP ch.6, 9)

- **Incompatible rollout** — new code writes a shape old code can't read (or vice versa)
  mid-deploy.
- **In-place rename/drop** — old readers break during the deploy window; expand/contract
  instead.
- **Semantic drift** — same field name, new meaning; worst kind: silently parses, silently
  wrong.
- **Shared-schema coupling** — schema is a de-facto unversioned API; one team's change is
  everyone's outage.
- **Backfill incompleteness** — a migration that silently skips rows is worse than none.

## Boundaries and structure (HP chs. 2–7, 9–12)

- **Distributed monolith** — split the deployment, kept the coupling; the worst of both.
- **Chatty sync chains** — a synchronous call chain multiplies tail latency and failure
  blast radius.
- **Unowned data** — three writers to one table = zero owners; ownership is a boundary.
- **Distributed transaction creep** — a boundary split converts a local transaction into a
  saga; the compensation graph is the hidden cost.
- **Leaky shared library** — "shared code" carrying domain rules two components both
  pretend to own.
- **Horror Story saga** — async+atomic+choreographed: atomic semantics scattered across
  event-driven participants until the compensation graph is unreasoning-able.

## Reliability and scale (DDIA ch.2, ch.7)

- **Hot spot/skew** — one entity/partition 100× hotter than average defeats total capacity.
- **Tail-latency amplification** — a request fanning to N deps is as slow as the slowest;
  percentiles, not averages, are what users feel.
- **Head-of-line blocking** — a few slow requests stall many queued fast ones; invisible
  server-side, measure at the client.
- **Correlated faults** — same bug/firmware/config on every replica defeats redundancy.
- **Human error** — config and ops mistakes are the top outage source; design so mistakes
  are cheap to make and cheap to fix.
