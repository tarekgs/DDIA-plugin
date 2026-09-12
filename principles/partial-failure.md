# Partial Failure

**A distributed system is one where the part you didn't know existed can break your program.**

## The principle

On a single machine, a call either works or the process crashes. Across a network there is a
third outcome: *the call may have worked, but you stopped waiting*. You cannot distinguish
"the request never arrived" from "the request was processed and the response was lost" from
"the remote is still working, slowly" (DDIA ch.9, ~pp.345–360). Every cross-boundary call
must be designed against that ambiguity.

This is the single most violated assumption in application code. Code that treats a timeout
as "the operation did not happen" will corrupt state under exactly the conditions it was
meant to survive.

## What to check in code

- Every network call has a timeout. Infinite waits turn a slow dependency into a cascading
  outage (DDIA ch.9, timeouts ~pp.353–357).
- After a timeout, what does the code assume? If it assumes failure, the retry path must be
  safe (see `retry-safety.md`).
- When a remote call succeeds but acknowledgement is lost, does a second attempt create a
  duplicate effect?
- Are there "fire and forget" writes where losing the message silently loses data?
- Process pauses: GC pauses, VM suspensions, disk stalls, thread starvation can freeze a
  process for seconds to minutes. A node can be "dead" to its peers and "alive" to itself
  (DDIA ch.9, ~pp.357–363). Any lease or leadership claim must carry a fencing token or an
  expiry the *resource* enforces — the lock holder's own clock is not evidence (fencing,
  ~pp.373–377).
- Clocks: wall-clock timestamps are not ordering evidence across machines. Monotonic clocks
  measure durations only (DDIA ch.9, ~pp.363–372).

## Diagnostic questions

- What is the set of distinct failure outcomes for this call? (never sent / sent, rejected /
  processed, response lost / processed, still running)
- For each outcome, what does the caller do, and is that safe?
- If the remote finishes the work 30 seconds after my timeout fired, is the system still
  correct?
- Which failures are worth surfacing to the user vs retrying vs queueing?

## Rules of thumb

- Prefer *at-least-once delivery + idempotent consumer* over pretending exactly-once delivery
  exists (see `retry-safety.md`; DDIA ch.12 ~pp.528–537 on the exactly-once illusion).
- Fail fast on overload; queue depth is a latency and reliability decision (load shedding,
  DDIA ch.2 ~p.38).
- Timeouts need a budget story: a chain of N services each with timeout T can take ~N·T.
- A lock or lease only means anything if the guarded resource can reject stale holders
  (fencing tokens, version checks, conditional writes).
- Design recovery paths: a crash between step 3 and step 4 of a multi-step operation must
  leave a resumable or clean-up-able state, not a corpse.

## Bottom line

Write the failure matrix for the call, then write the code. If you cannot enumerate what the
remote might have done, you cannot safely decide what to do next.
