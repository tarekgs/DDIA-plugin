---
name: ddia-distributed-workflows
description: Design or review multi-step operations that span components — sagas, compensating actions, orchestration vs choreography, durable execution. Use when a business operation can't be one transaction, or when reviewing Temporal/workflow-engine usage.
---

# Distributed Workflows and Sagas

Hard Parts ch.11 (workflows ~pp.299–322) and ch.12 (sagas ~pp.323–364). DDIA ch.5 (durable
execution ~pp.187–191), ch.8 (distributed transactions), ch.12.

## When to use

- A user-facing operation spans multiple components/stores and can't be one transaction.
- Designing or reviewing saga/workflow/durable-execution usage.
- Choosing orchestration vs choreography.
- Adding compensation/rollback to a multi-step operation.

## When NOT to use

Single-transaction operations (use `ddia-concurrency-and-transactions`); simple async
fire-and-forget (use `ddia-events-and-messaging`).

## Procedure

### 1. Is a distributed workflow actually needed?

- Can the operation be one transaction? If the state lives in one DB and the invariant is
  atomicity — keep it local. A saga is the price of a boundary already chosen, not a
  feature.
- If it must span boundaries, is it **saga-shaped** (reversible steps with compensation)
  or **read-model-shaped** (a pipeline of derivations)? Pipelines belong to
  `ddia-events-and-messaging`.

### 2. Define the workflow's units

- Enumerate the steps, each step's atomicity (all-or-nothing?), each step's compensability.
- The **transactional boundary** list: which steps must succeed together? Those pairs are
  the pressure points — can they be merged into one local transaction instead?
- The **irreversible step**: at least one exists (email sent, charge posted, external
  effect). Put it as late as possible; everything before it must be reversible or
  compensable.

### 3. Orchestration vs choreography (Hard Parts ch.11)

| | Orchestration (a coordinator drives steps) | Choreography (each step triggers the next via events) |
| --- | --- | --- |
| Visibility | one place to see the workflow | distributed — reconstruct from event flow |
| Coupling | coordinator knows all steps | participants know only their contract |
| Error handling | centralized, compensable | each participant self-compensates |
| Blast radius | coordinator is a dependency | no single dependency; harder to reason |
| Best when | complex flows, need observability/control | simple flows, loose coupling priority |

Hybrid is legitimate: choreograph inside a domain, orchestrate across domains.

### 4. Choose the saga pattern (Hard Parts Table 2-1 ~p.41; ch.12)

The eight named sagas are combinations of three forces — **communication** (sync/async),
**consistency** (atomic/eventual), **coordination** (orchestrated/choreographed) — ranked by
coupling, tightest to loosest:

| Saga | Comm | Consistency | Coordination | Coupling |
| --- | --- | --- | --- | --- |
| **Epic** | sync | atomic | orchestrated | very high |
| **Phone Tag** | sync | atomic | choreographed | high |
| **Fairy Tale** | sync | eventual | orchestrated | high |
| **Time Travel** | sync | eventual | choreographed | medium |
| **Fantasy Fiction** | async | atomic | orchestrated | high |
| **Horror Story** | async | atomic | choreographed | medium |
| **Parallel** | async | eventual | orchestrated | low |
| **Anthology** | async | eventual | choreographed | very low |

Reading the table: synchronous communication forces the caller to wait (temporal
coupling); atomic consistency forces compensating actions to restore invariants;
orchestration concentrates control. The loosest sagas (Parallel, Anthology) buy
decoupling by accepting eventual consistency — the tightest (Epic, Phone Tag) buy
atomicity by accepting coupling. Choose the loosest shape that still meets the
consistency requirement. **Horror Story** — async + atomic + choreographed — is the
named anti-pattern: atomic semantics scattered across event-driven participants, where
the compensation graph becomes unreasoning-able. If your draft looks like that,
re-bound the problem.

### 5. State and resumability

- Where does workflow state live — durable execution journal (Temporal-style), a state
  table, message-carried context? Durable-execution frameworks give effectively-once
  workflow semantics by journaling completed steps and replaying — the engine handles
  resumption; YOU still own activity idempotency (DDIA ch.5 ~pp.187–191;
  `../../principles/retry-safety.md`).
- What happens if the coordinator dies mid-step — who notices and who resumes?
- Workflow versioning: history is a compat boundary — a changed workflow must replay old
  in-flight histories (replay gate) or you break running instances.

### 6. Consistency of the result

- What do observers see between step k and k+1? Partial results are visible states —
  decide which are acceptable and which need a pending/hidden marker.
- Compensation correctness: does undoing step k restore invariants, or just make them
  different? A compensating action is itself a business decision.
- Who resolves a wedged saga — automatic retry budget, parked state, human runbook?

## Failure modes to hunt

- A step that can't be compensated placed before steps that can fail.
- Compensation that itself fails — what's the double-failure path?
- Workflow history growth unbounded (payloads in history, no caps).
- Versioning break: deploy that makes old in-flight workflows unreplayable.
- Timeout-free step that can park the saga forever.

## Validation

- Kill the coordinator at each step boundary; assert resumption to the same end state.
- Force each step's failure; assert compensation restores invariants.
- Replay real histories against the new workflow version before deploy (replay gate).

## Output

Step list with atomicity/compensability, orchestration-vs-choreography choice + why, saga
shape, state/resumption story, versioning/replay plan, and the wedge-resolution path.
