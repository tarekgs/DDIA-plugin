# Evolution and Compatibility

**Every persisted byte and wire message outlives the code that wrote it.**

## The principle

Data at rest and messages in flight must be readable by older and newer code during any
rollout, rollback, or long-lived session. Backward compatibility (new code reads old data)
and forward compatibility (old code reads new data) are the constraints; the compatibility
window is as long as the slowest thing that can still touch the data — an old client tab, a
queued message, a snapshot, a backup, a lagging replica (DDIA ch.5, ~pp.161–165).

## What to check in code

- **Persisted schema changes**: is the migration expand/contract? Old code must keep working
  while new columns appear; destructive steps (drop, rename-in-place) only land after no
  deployed code can read the old shape. Renaming a column in place breaks every old reader
  during the rollout.
- **Wire/API changes**: can a v1 client talk to a v2 server and vice versa? New required
  fields, removed enum values, and changed field semantics break the side that doesn't
  know them. Additive-with-defaults is the safe direction.
- **Rollout shape**: are old and new versions ever simultaneously live (rolling deploy,
  reconnecting clients, queued events)? If yes, every change must pass through a compatible
  intermediate state — you cannot atomically flip a distributed system.
- **Defaults and unknown fields**: does old code drop, preserve, or crash on unknown fields?
  "Preserve unknowns" (round-tripping) is what makes forward compat possible.
- **Event/log schemas**: events outlive deploys by definition. An event written last month
  must still be consumable — version the schema, keep old readers working, or migrate the
  log.
- **Protocol version negotiation**: where is the version boundary, and what does each side
  do when it meets a version it doesn't know?

## Diagnostic questions

- What is the oldest code that can still touch this data, and the newest? Is the overlap
  compatible?
- If we roll back mid-deploy, what does old code do with rows/events written by new code?
- Does any path bypass the compat contract — a raw SQL writer, a hand-built payload, a
  batch job that reads "whatever's there"?
- When does the compatibility obligation end, and who removes the shim? Temporary dual
  paths need an owner and a removal trigger.

## The contract view (Hard Parts ch.13)

Contracts between components are either **strict** (schema-verified, reject unknowns) or
**loose** (tolerant readers). Strict contracts catch drift early but amplify breaking
changes; loose contracts tolerate drift but can silently drop data. Choose per boundary:
strict where corruption is worse than rejection (payments, identity), loose where forward
motion matters more (telemetry, optional metadata). Contract fitness tests — consumer-driven
contract checks — belong in CI where the boundary is load-bearing (~pp.365–380).

## Bottom line

Before changing any schema or message shape, write down: who writes it, who reads it, the
oldest and newest versions in flight, and the expand/contract sequence that keeps every
combination working.
