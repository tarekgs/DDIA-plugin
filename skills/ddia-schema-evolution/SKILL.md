---
name: ddia-schema-evolution
description: Design or review changes to persisted schemas, wire formats, API contracts, event schemas, or run migrations. Use whenever a change must coexist with older/newer code or previously written data.
---

# Schema and Protocol Evolution

DDIA ch.5 (encoding & evolution, ~pp.161–196) and ch.12 (event schema evolution). Hard
Parts ch.13 (contracts).

## When to use

- DB schema changes, especially during rolling deploys or on live data.
- API/wire/message format changes with mixed-version participants.
- Event/log schema changes where old events remain readable.
- Migrations with destructive steps (drop, rename, tighten).

## When NOT to use

Greenfield tables with no readers yet; internal function signatures; types that never cross
a boundary.

## Procedure

### 1. Map the compatibility surface

- Who writes this shape? Who reads it? Enumerate ALL readers/writers — app code, other
  services, sync engines, consumers, batch jobs, exports, backups, tests, fixtures.
- What is the oldest version that can still touch it (old clients, queued messages,
  replicas, snapshots, lagging restores)? What is the newest?
- What survives a rollback mid-deploy?

### 2. Choose the change pattern

- **Expand/contract** (the default for DBs): add new shape → dual-write or backfill →
  migrate readers → contract (drop old) only after nothing reads it. Never rename/drop in
  place while old code can still run.
- **Additive-with-defaults** (for wire/message/API): new optional fields with defaults;
  new enum values handled by tolerant readers; remove only after a deprecation window.
- **Versioned schema** (for events/artifacts): embed a schema version; keep readers for all
  live versions; upcast on read or migrate lazily.
- **Dual-path with a trigger** (last resort): if two shapes must coexist, the temporary
  path needs an owner, a removal condition, and a deadline — otherwise it's a permanent
  second architecture.

### 3. Check the specific hazards

- **Renaming columns/fields**: breaks every old reader mid-rollout. Do add-new + copy +
  switch-reads + drop-old instead.
- **Changing field semantics** (same name, new meaning): worse than renaming — silent
  corruption. New field name + explicit migration.
- **New required field**: every old writer produces invalid rows. Add as nullable or
  backfill-then-constrain in two steps.
- **Default values**: a new NOT NULL column needs a default that is correct for existing
  rows, not just present.
- **Backfills**: bounded batches, resumable, idempotent, observably complete; a backfill
  that silently skips rows is worse than none.
- **Enum/lookup additions**: old code must tolerate unknown values (map to a safe default
  or a known "unknown" branch), or the addition is itself a breaking change.
- **Foreign key/constraint additions on live tables**: validation cost, lock duration,
  ordering vs. writers. Check the repo's migration-safety conventions and follow them.

### 4. Event and stream schemas

- Events outlive deploys. An event emitted by v1 must be consumable by v3 consumers next
  quarter — version the schema, keep old readers, or migrate the log.
- Internal vs external schemas: the outbox pattern decouples them — internal schema can
  evolve while the published event shape stays stable (DDIA ch.12 ~p.505).
- Consumer-driven contract checks (schema-compat tests in CI) for load-bearing boundaries —
  see `../ddia-architecture-decisions/` for fitness functions.

### 5. The rollout sequence

Write it explicitly: which version writes which shape, in which order, and what each
intermediate state tolerates. A change with no valid intermediate state cannot ship by
rolling deploy.

## Failure modes to hunt

- Deploy order bugs: new code reading a column before the migration applied, or migration
  dropping a column old code still reads.
- Sync/replication planes lagging schema: a replica serving a shape the mutator no longer
  produces.
- Snapshot/backup restore to a schema version newer than the code.
- A fixture/test asserting an old wire shape after the contract changed.
- "Temporary" compatibility shims with no owner — they become the architecture.

## Validation

- Compat test: old-shape fixture read by new code, and (if forward compat claimed)
  new-shape data read by old code.
- Migration test against a production-shaped dataset, not an empty table.
- Rollback rehearsal for anything destructive.
- Where the repo has a migration-safety check or marker convention — run it, don't bypass.

## Output

The compat surface map, the expand/contract sequence with the order of operations, the
rollback story, the removal trigger for any temporary path, and validation evidence.
