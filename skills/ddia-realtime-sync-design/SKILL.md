---
name: ddia-realtime-sync-design
description: Design or review realtime collaboration, sync engines, optimistic local state, presence, offline/reconnect, or multiplayer features. Use whenever humans and/or agents edit shared artifacts concurrently — including when the capability is PLANNED and the task is to produce design obligations.
---

# Realtime Collaboration and Sync Design

DDIA ch.6 (replication, concurrent writes, sync engines/local-first ~pp.220–232), ch.9
(network reality), ch.10 (consistency/causality), ch.12 (streams). Hard Parts ch.11
(workflows) for the coordination layer.

## When to use

- Designing or reviewing live co-editing, presence, sync between client and server.
- Optimistic local state that must reconcile with a server authority.
- Reconnect/catch-up/offline behavior.
- Evaluating a sync engine, collab framework (CRDT/OT/Yjs/tldraw/Hocuspocus), or a bespoke
  protocol.
- When the capability is PLANNED — produce design obligations, not a fake audit.

## When NOT to use

Pure server-side flows with no live client state; one-shot request/response with no
optimistic or shared mutable state.

## The decision framework — answer each explicitly

### 1. Authority model (decide first — everything follows)

- **What is authoritative?** Server commit, per-field, per-operation, or distributed merge?
  For co-editing, pick the unit of authority: whole artifact / region / operation stream.
- **What is optimistic?** Local edits shown before server ack must be marked provisional
  and reconciled. The failure mode is silently treating provisional state as committed.
- **Where do conflicts resolve?** Server arbitration, deterministic merge, or explicit
  conflict surfaces. "Both sides win silently" is data corruption.

### 2. Synchronization model

| Model | What it is | When it wins | Costs |
| --- | --- | --- | --- |
| **Op-based (OT)** | Transform concurrent ops against each other | Fine-grained collab, intent preservation | Hard transform correctness; server needed for order |
| **CRDT (state or op)** | Merge is associative/commutative/idempotent | Arbitrary connectivity, offline, multi-writer | Tombstone growth, merge overhead, type constraints |
| **Centralized serialization** | One sequencer orders all ops | Simplest correct; great when always-online | Offline impossible; sequencer is a hot spot |
| **Last-write-wins / field merge** | Latest or per-field latest wins | Coarse state (presence, settings) | Loses concurrent writes — wrong for document bodies |
| **Lock/lease per region** | Only one writer at a time | Binary/simple artifacts | Latency, lock starvation, dead-owner cleanup |

Do NOT preselect. Compare against actual product requirements: offline needed? human+agent
concurrency? undo semantics? artifact size? editor type?

### 3. The concurrency matrix — all pairs

- human ↔ human on the same artifact
- human ↔ agent (agent editing while human types)
- agent ↔ agent (two turns on the same artifact)
- any ↔ reconnecting client replaying a backlog
- any ↔ the save/checkpoint/durable path

For each pair: who arbitrates, what does the loser observe, what survives?

### 4. Delivery and ordering semantics

- Duplicate delivery: must ops be idempotent? (Yes — at-least-once is the honest default.)
- Reordered delivery: sequence numbers, causal deps, or commutative merge?
- Delayed delivery: what's the staleness bound before the UI must say so?
- Missed delivery: catch-up = snapshot + deltas, replay from a durable log, or refetch?
- Acknowledgement: what does "sent" vs "accepted" vs "visible to others" mean?

### 5. Session lifecycle

- **Disconnect**: what remains editable? What is queued? What is shown as offline?
- **Reconnect**: catch-up mechanism (resume token, snapshot+delta, full refetch), and how
  queued local ops rebase against concurrent remote changes.
- **Presence**: ephemeral (NATS-style fanout), not durable. Heartbeat + expiry, never a
  stored boolean someone forgot to unset.
- **Undo/redo**: whose ops does Ctrl-Z undo — only mine? Cross-actor undo is a deep design
  problem; decide the scope explicitly.

### 6. Agents as sync actors

`../../principles/agents-are-writers.md` plus:
- Does the agent write through the same sync protocol as humans, or a privileged path?
- Provenance per edit (which turn/agent produced which ops) for audit and undo.
- Agent edit bursts are hot-path candidates — batching/quotas on fan-out.
- A cancelled agent mid-edit must leave the artifact in a defined state.

### 7. Scale and protocol evolution

- Hot artifacts: fan-out per keystroke × collaborators × observers — measure before
  choosing infrastructure (see `../ddia-scale-and-load/`).
- Large artifacts: snapshot+incremental sync, chunking, lazy load.
- Protocol evolution: old clients during rollout; version negotiation; what does a client
  do with an op it doesn't understand? — `../../principles/evolution-compatibility.md`.
- Durability: which ops are durable immediately vs flushed on intervals; what does a server
  crash lose?

## Failure modes to hunt

- Two clients both "the latest" after a partition — split brain on document state.
- Reconnect replay applying ops against a wrong base state.
- Tombstone/memory growth in CRDT state unbounded.
- Presence leaking (ghost users) after crashed clients.
- Optimistic insert + server reject = content the user saw vanishing without explanation.
- The "save" button semantics conflicting with sync semantics (which is truth?).

## Design obligations output (for PLANNED capability)

Produce an obligations doc listing each of §1–§7 with: requirement, options, open
questions, and what must be decided before implementation. That IS the deliverable when
the capability isn't built yet — don't fabricate an audit of unwritten code.

## Validation

- Interleaved edit tests for each actor pair.
- Kill/reconnect mid-op; assert convergence and no loss beyond the designed bound.
- A deterministic sync test harness (fixed op schedules) beats manual clicking.
- Latency budget: keystroke→visible-to-peer p99 target, then measure it.
