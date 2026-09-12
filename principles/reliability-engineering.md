# Reliability Engineering: Faults, Humans, and Testing for Reality

**Fault tolerance means the system keeps working when things go wrong — and things keep
going wrong.**

## The principle

Reliability is a designed property, not an outcome (DDIA ch.2, ~pp.43–49). The three fault
sources are hardware, software bugs, and humans — and at scale, humans are the largest
contributor. The design questions are: which faults must be tolerated, what is the blast
radius when they occur, and how is correct behavior under fault actually verified.

## What to check in code / design

- **Fault inventory**: for each dependency — what happens to the user when it's slow, down,
  or returns wrong data? Is there a designed degraded mode, or an accidental one?
- **Human error paths**: can an operator or developer cause an outage with a routine action?
  Design for easy mistakes to be cheap: config validation, fast rollback, sandboxed
  rehearsal, small blast radius, auditable changes.
- **Recovery design**: every persistent operation has a recovery story — what state is left
  if we crash between steps, and how is it resumed or cleaned up?
- **Detection before users**: health checks, SLO alerts, and invariants that trip before a
  human notices (see `scale-honestly.md` on tail latency and saturation signals).
- **Data integrity end-to-end**: correctness is a property of the whole dataflow, not of
  each component. A bug-free pipeline stage can still drop, duplicate, or corrupt data at
  the seams (DDIA ch.13 — integrity across dataflows, end-to-end arguments).

## Testing for reality (DDIA ch.9–10)

- **Randomized/property testing**: explore input orderings and failure interleavings you
  didn't think of; invariant checks over random operation sequences catch classes of bugs
  unit tests never touch.
- **Deterministic simulation**: record all nondeterminism (network, clock, randomness)
  behind interfaces so the whole system can be replayed deterministically — the
  FoundationDB/Antithesis approach DDIA discusses (~ch.9–10). It turns rare Heisenbugs into
  reproducible tests.
- **Fault injection**: deliberately kill nodes, drop messages, delay packets in staging;
  the system either tolerates it or you learned something cheap.
- **Replay gates for durable execution**: workflow/state-machine changes must be replayed
  against real histories before deploy — unit tests do not prove replay safety.

## Diagnostic questions

- Which single failure produces user-visible data loss or corruption? Which produces only
  delay?
- What is our detection time for a silent corruption — would we find it in the metrics, or
  in a support ticket?
- If the worst dependency failed for an hour right now, what recovers on its own and what
  needs a human runbook?
- Do our tests exercise ordering/failure interleavings, or only happy-path sequences?

## Bottom line

List the faults, design the blast radius, make mistakes cheap, and test interleavings —
not just outcomes. Reliability is a product feature the user only notices in its absence.
