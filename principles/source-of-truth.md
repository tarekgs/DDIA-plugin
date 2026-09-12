# Source of Truth and Derived State

**Every piece of state has exactly one authority — or it will eventually disagree with itself.**

## The principle

For any datum in the system, you must be able to answer: which store, when written, is the
one that decides the truth? Everything else that holds that datum is *derived* — a cache, a
replica, a materialized view, a search index, a denormalized column, a client-side snapshot.

Derived state is legitimate and necessary. What is not legitimate is derived state with no
declared authority or no reconstruction path.

DDIA frames this as *systems of record* vs *derived data* (ch.1, ~pp.10–12). The system of
record is the authoritative version; derived data may be duplicated, denormalized, or cached,
but if it is lost you can regenerate it from the system of record. Most correctness bugs in
data systems come from treating a derived representation as authoritative, or from writing to
two stores without declaring which one wins.

## What to check in code

- For each store touched by a change: is it authoritative or derived? Say so explicitly.
- Does the mutation path write to >1 store? If yes — which commit is the "point of no
  return"? What happens if the second write fails after the first succeeds?
- Can the derived representation be rebuilt from the source of truth (backfill, replay,
  reindex)? If not, it is secretly authoritative.
- Do readers ever read from a derived source and write back to the source of truth based on
  that read? (Read-modify-write on stale derived state → lost update; see
  `consistency-tradeoffs.md`.)
- Is there any state whose authority is ambiguous — e.g. a value that exists in Postgres and
  in a client replica and both can be written? One must be declared to win.

## Diagnostic questions

- If this cache/index/replica is deleted tonight, what breaks permanently?
- If two writers write to different representations of the same fact concurrently, which
  write is observed, and is that choice an accident or a decision?
- Where is the atomic commit boundary — the single write that makes the change real?

## When it's subtle

- **Bidirectional sync** (local-first, offline clients): there is deliberately more than one
  write authority, so you need an explicit conflict-resolution rule and a merge story. This
  is a designed-for exception, not an accident — see `../skills/ddia-realtime-sync-design/`.
- **The outbox pattern** is the standard fix for "I must write to the DB *and* publish an
  event": write the event to an outbox table in the same transaction as the state change,
  then relay asynchronously (DDIA ch.12, outbox discussion ~p.505). This makes the DB row the
  single point of commitment.
- **Event sourcing** makes the event log the source of truth and all state derived. Powerful,
  but it inverts the debugging model — adopt it because the audit/replay requirement demands
  it, not because events are fashionable.

## Bottom line

Name the authority. Give every derived representation a declared source and a rebuild path.
If you can't point at the commit that makes a change real, you don't understand your own
mutation path yet.
