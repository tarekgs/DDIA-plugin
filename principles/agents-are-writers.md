# Agents Are Writers: Concurrent Actors on Shared State

**An AI agent with write access is a concurrent writer. Treat it like one.**

## The principle

In an AI-native product, the mutating actors are not just humans at keyboards. They are:
interactive humans, background jobs, and AI agents — possibly several of each, possibly on
the same state at the same time. An agent is not "the system", and running server-side does
not grant it special consistency guarantees. It observes through reads that can be stale,
decides over seconds or minutes while the world changes, and writes mutations that must be
validated like anyone else's.

## What to check in code / design

- **Authorization symmetry**: does the agent's write path pass the same authz and validation
  as a human's? A separate privileged mutation path is a boundary to justify, not a
  convenience.
- **Provenance**: can you tell which actor (which human, which agent, which background job)
  produced each mutation? Provenance is required for audit, for undo, for privacy scoping,
  and for debugging "why is the state like this".
- **Concurrent intent**: if a human is editing a document while an agent edits it, what is
  the merge story? A human typing into a section an agent is rewriting needs a conflict
  semantic, not luck.
- **Stale-read acting**: an agent reads state, thinks for 30 seconds, then writes. That is a
  read-modify-write with a 30-second window — the classic lost-update shape
  (`consistency-tradeoffs.md`). The write must be conditional on the read being current
  (version check, CAS, or a mutation API that validates preconditions server-side).
- **Interruption and cancellation**: a user (or another agent, or a shutdown) can cancel an
  agent mid-operation. What does "half-applied agent work" look like, and who cleans it up?
  Multi-step agent mutations need the same saga/rollback thinking as any distributed
  workflow (`../skills/ddia-distributed-workflows/`).
- **Retry and duplication**: agent turns get retried, replayed, and resumed. The dedup and
  idempotency story applies to agent-issued mutations exactly as to client-issued ones
  (`retry-safety.md`).
- **Agent-agent concurrency**: two turns (or two agents in different threads) mutating the
  same artifact/project concurrently — is there ordering, queueing, or merge semantics?
- **Human override**: a human edit landing between an agent's read and write must not be
  silently clobbered; conversely, agent work must not block human edits indefinitely.

## Diagnostic questions

- Enumerate every writer class that can touch this state: human (which roles), agent (which
  lanes), background job, migration, sync engine. For each pair, what is the interleaving
  story?
- Which mutations must be attributed, and is attribution recorded at write time or
  reconstructable later?
- What happens to in-flight agent work when its authorization is revoked mid-operation?
- Does an agent ever write to a derived representation directly, bypassing the authority?
  (See `source-of-truth.md`.)

## Design defaults that usually hold

- One mutation API for all writers; identity and capabilities differ, the integrity checks
  don't.
- Server-side precondition validation on every mutation (the server is where concurrency
  is arbitrated; the client's snapshot is a hint).
- Attribution as a first-class column/dimension, not a log line.
- Cancellation as a state transition, not a kill — partial work is parked or compensated,
  never silently half-written.

## Bottom line

List the writer classes for every shared datum, and for each pair answer "what if both
write now". An agent is a fast, patient, forgetful concurrent writer — design for it, not
around it.
