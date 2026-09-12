---
name: ddia-failure-retries-idempotency
description: Design or review timeouts, retries, idempotency, dedup, cancellation, and partial-failure handling at any network/process boundary. Use when adding resilience to a call, hardening an operation against crashes, or auditing failure semantics.
---

# Failure, Retries, and Idempotency

Primarily DDIA ch.9 (the trouble with distributed systems) and ch.12 (exactly-once reality),
with overload material from ch.2 and durable-execution framing from ch.5.

## When to use

- Adding a timeout, retry, circuit breaker, queue, or fallback to an existing call.
- Reviewing failure semantics of any cross-boundary operation.
- Designing an operation that must survive crashes mid-flight.
- "Make this reliable" / "handle failures" / "add retry" tasks.

## When NOT to use

Pure in-process calls, code paths where failure has no external effect, idempotent reads
with bounded timeouts already in place.

## Procedure

### 1. The failure matrix

For each boundary call, enumerate:

| Outcome | What caller knows | Safe response |
| --- | --- | --- |
| Request never sent/arrived | timeout or immediate error | retry (idempotent or dedup'd) |
| Request processed, response lost | timeout, remote done | retry must be deduplicated |
| Remote still running | timeout fired early | retry must be deduplicated; result arrives later |
| Remote rejected deterministically | error response | do NOT retry (fix input or surface) |
| Local crash before/after call | nothing | recovery path must find the truth |

If you can't fill this in, you don't understand the operation's failure semantics yet —
`../../principles/partial-failure.md`.

### 2. Retry policy — the checklist

- **Is retry safe?** Requires idempotency (natural or via key), dedup, or provable
  harmlessness — `../../principles/retry-safety.md`. If the operation isn't retryable,
  say so and design for manual/compensating recovery instead of auto-retry.
- **Backoff**: exponential with jitter; cap the max delay; cap the attempts.
- **Retry budget**: bound total retry load on a dependency (client-side rate limit on
  retries, or server-side budget). Uncapped retries on an overloaded dependency are the
  retry-storm mechanism (DDIA ch.2 ~p.38).
- **Distinguish errors**: retry transient (timeout, overload, failover); never retry
  deterministic failures (validation, authz, constraint violation).
- **Where does "give up" go?** Dead-letter, parked state, user-visible error, alert —
  pick one; "loop forever" is not a state.

### 3. Idempotency — the checklist

- Key source: stable across retries of the same logical operation (client-generated op ID,
  natural key), unique across different operations.
- Scope: dedup happens inside the same transaction as the effect, or via a unique
  constraint — not as a non-atomic check-then-act.
- Window: the dedup record must live at least as long as the longest plausible retry gap.
- Response replay: an idempotent endpoint should return the original result to a retried
  caller, not a fresh error.

### 4. The outbox/inbox pattern

When an operation must both commit state and trigger downstream work:

- **Outbox**: write the intent to an outbox table in the SAME transaction as the state
  change; a dispatcher publishes asynchronously with retries (DDIA ch.12 ~p.505).
- **Inbox**: the consumer records the message ID in the same transaction as its effects,
  so redelivery is a no-op. This is what "exactly-once processing" actually means.
- Check the dispatcher: lease/fencing for who may dispatch, ordering guarantees, what
  happens to undeliverable rows.

### 5. Cancellation and interruption

- Can the operation be cancelled mid-flight (user stop, agent kill, shutdown)? What is the
  durable "cancelled" state, and who observes it?
- Partial work: parked with resume info, compensated, or abandoned-with-trace?
- A cancelled operation that still commits its effect needs either prevention (check before
  commit) or compensation (undo step).

### 6. Leases, locks, fencing

- Any lock/lease must be enforced by the resource: fencing tokens, version checks,
  conditional writes (DDIA ch.9 ~pp.373–377).
- A lease held in process memory is a promise, not a protection.
- Lease expiry vs. work completion: an expiring lease under a long GC pause produces two
  "owners". The guarded resource must reject the stale one.

## Failure modes to hunt

- Timeout with no bound (`await` on a promise that can never settle).
- Retry without dedup on a non-idempotent endpoint.
- Client retry + server retry + queue redelivery multiplying into N³ attempts.
- "Exactly-once" claimed from a queue's delivery guarantee alone.
- Dual write: DB commit then `publish()` — crash between them loses the event.
- A cleanup path that assumes the resource still exists / the caller still has authz.

## Validation

- Fault-injection test: kill the dependency at each commit boundary; assert end-state.
- A duplicated-delivery test: deliver the same message twice; assert single effect.
- A slow-dependency test: timeout fires while remote completes; assert the late result is
  handled.

## Output

The failure matrix, the retry/dedup policy per boundary, the give-up path, the cancellation
story, and anything needing an ADR or follow-up.
