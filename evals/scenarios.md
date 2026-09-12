# Plugin Sanity Scenarios

A lightweight check that the plugin routes correctly and reasons usefully — not a
benchmark. For each scenario, run an agent equipped with the plugin against the prompt and
check the output against **what good looks like**. The point is to catch three failure
classes: (1) the router doesn't surface the right skill, (2) the skill recommends machinery
the problem doesn't need, (3) current vs future architecture is confused.

Run by hand: paste the scenario into an agent session with the plugin installed, or into a
scratch repo context. One pass is enough — these are sanity checks, not a research loop.

---

## S1. Adding a retry around a backend operation

**Prompt**: "The gateway call to publish a turn event occasionally times out. Add a retry
so it doesn't fail."

**Expected**: routes to `ddia-failure-retries-idempotency`. Output should include the
failure matrix (the publish may have succeeded before the timeout), a dedup/idempotency
mechanism (e.g. event ID + unique constraint, not just a retry loop), bounded backoff with
jitter, a give-up path, and a check that the retry doesn't double-apply a visible effect.
**Red flag**: a bare `retry()` wrapper with no dedup story.

## S2. Designing multiplayer co-editing

**Prompt**: "Design live co-editing for Axon docs — humans and the agent editing the same
document."

**Expected**: routes to `ddia-realtime-sync-design`. Output forces explicit answers on
authority model (what's the unit of authority), sync model comparison WITHOUT preselecting
CRDT/OT (compares op-based vs CRDT vs centralized-serialization vs field-merge against
Axon's actual requirements), the full concurrency matrix (human↔human, human↔agent,
agent↔agent, reconnect), delivery semantics (dup/reorder/gap handling), presence as
ephemeral, undo scope, and hot-artifact scaling. Should flag B12-class obligations
(offline? old clients during rollout?).
**Red flag**: jumps to "use Yjs" or "use OT" without the requirements analysis; treats
agent edits as special-cased rather than a writer class.

## S3. Changing a persisted schema

**Prompt**: "Rename `turns.status` to `turns.state` and add a required `priority` column."

**Expected**: routes to `ddia-schema-evolution`. Output gives an expand/contract sequence
(add `state` + backfill/dual-write → migrate readers → drop `status`; add `priority`
nullable or with a correct default → constrain later), names the compat window (old code
during rollout, existing rows), and the removal trigger. Checks the repo's
migration-safety conventions.
**Red flag**: a single in-place `ALTER ... RENAME` with no rollout story.

## S4. Adding a cache

**Prompt**: "The project sidebar reads are slow. Add a cache."

**Expected**: routes to `ddia-derived-state-and-caching`. Output declares the authority,
names the staleness bound, specifies the invalidation path (not just TTL-and-hope), the
rebuild path, and divergence detection. Asks whether the slowness is a read-load problem
at all before reaching for a cache.
**Red flag**: cache-as-second-source-of-truth with no rebuild or invalidation story.

## S5. Introducing async background processing

**Prompt**: "Artifact indexing should happen asynchronously — put it on a queue."

**Expected**: routes to `ddia-events-and-messaging` (and/or `ddia-distributed-workflows`).
Output justifies async (what does decoupling buy), picks delivery semantics (at-least-once
+ idempotent consumer), specifies ordering needs (per-artifact vs global), dead-letter
story, and considers the outbox if the index trigger must not be lost on commit.
**Red flag**: "add Kafka" without the delivery-semantics and ordering analysis; treating
broker "exactly-once" as end-to-end.

## S6. Splitting a service

**Prompt**: "Should we split artifact indexing out of the gateway into its own service?"

**Expected**: routes to `ddia-service-boundaries`. Output runs the integrator/
disintegrator analysis on this specific boundary (does indexing share transactions with
artifact writes? does it scale differently? fail independently?), considers middle options
(same service, separate module; same process, async lane), names what the split would cost
(distributed workflow, contract, deploy), and is willing to conclude KEEP TOGETHER.
**Red flag**: reflexive "yes, microservice" or reflexive "no, monolith" — the point is
the scored analysis.

## S7. Splitting a data domain — KEEP SIMPLE

**Prompt**: "Should threads and turns live in separate databases so they can scale
independently?"

**Expected**: routes to `ddia-service-boundaries` / `ddia-scale-and-load`. The correct
conclusion is almost certainly **no**: threads and turns transact together (a turn belongs
to a thread; the outbox dispatch reads them together), the scale driver doesn't demand it,
and the cost is distributed transactions across the hottest path in the system. Good
output says KEEP TOGETHER, names the trigger that would reopen (measured per-tenant skew
that pinning can't fix), and cites the data-ownership and shared-transaction integrators.
**Red flag**: any answer that splits without a measured need.

## S8. Hot artifact / fan-out

**Prompt**: "A single artifact has 500 concurrent viewers and edits cause visible lag.
What do we do?"

**Expected**: routes to `ddia-scale-and-load` + `ddia-realtime-sync-design`. Output builds
the load model (fan-out per op × observers × op rate), identifies where the lag lives
(fan-out work, replication ceiling, client render), proposes the cheapest sufficient fix
(batching/coalescing, read-side fan-out, per-artifact shedding), and separates the
now-fix from the architecture-change-later.
**Red flag**: jumping to sharding or a new subsystem before the load model.

## S9. Reviewing a diff that adds a distributed lock

**Prompt**: "Review this PR: it adds a Redis-based distributed lock around artifact saves
to prevent concurrent modification."

**Expected**: routes to `ddia-review-architecture-change` +
`ddia-concurrency-and-transactions`. Output asks whether the lock has a fencing mechanism
(resource-side version check), whether the invariant needs a lock at all vs. CAS/
conditional write/serializable read, what happens on lease expiry under a paused holder,
and whether the lock is solving for a race that should be prevented by design.
**Red flag**: "looks good" without fencing/lease-expiry analysis; or reflexive
"distributed locks are bad" without checking what the invariant needed.

---

## Scoring

For each scenario, pass if:

1. The router (or skill descriptions) surface the right skill(s).
2. The output asks the right questions before recommending.
3. The recommendation matches the problem's actual weight — including "keep it simple"
   and "defer with a trigger" as first-class outcomes.
4. Current vs future/PLANNED architecture is handled honestly.

This is a smell test, not a gate. If a scenario reliably produces the red-flag behavior,
the skill that produced it is the bug — fix the skill, not the eval.
