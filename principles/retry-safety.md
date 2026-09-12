# Retry Safety, Idempotency, and the Exactly-Once Illusion

**A retry is only safe if repeating the operation produces the same outcome once.**

## The principle

"Exactly-once" message delivery does not exist on real networks. What exists is
*effectively-once processing*: at-least-once delivery combined with idempotency or
deduplication on the consumer side (DDIA ch.12, ~pp.528–537). Every retry mechanism —
client retry, queue redelivery, workflow replay, dispatcher poll — must be paired with an
explicit reason the second execution is harmless.

Retries without that pairing are worse than no retry: they turn one failure into duplicate
charges, double writes, or amplifying storms.

## What to check in code

- Is the operation idempotent — naturally (idempotent write, UPSERT, set-value) or made so
  (idempotency key, dedup table, unique constraint, compare-and-set)?
- Where does the idempotency key come from? It must be stable across retries of the *same
  logical operation* and distinct across different operations. A freshly generated UUID per
  attempt is not an idempotency key.
- What is the dedup window? A key checked against a cache that expires in 5 minutes does not
  make a 1-hour retry safe.
- Does dedup happen *inside the same transaction* as the effect, or as a separate check-then-
  act? Check-then-act races: two concurrent deliveries can both pass the check.
- Backoff: exponential with jitter, capped. Constant-interval retries synchronize clients
  into retry storms that keep a recovering system saturated (DDIA ch.2, ~p.38, and ch.9).
- Retry budgets / max attempts: unbounded retries are unbounded load. Decide what happens at
  exhaustion — dead-letter, alert, park, surface to user.
- Poison messages: a message that always crashes the consumer will be redelivered forever.
  Is there a give-up path?

## Diagnostic questions

- If this request is delivered twice, what is the user-visible difference? If none — why?
  Point at the mechanism.
- If the retry happens after the original actually succeeded, what breaks?
- What amplifies when 10,000 clients retry simultaneously?
- Is there a transactional outbox between "commit state" and "publish work"? If the publish
  can be lost after commit, the downstream never learns the work exists (see
  `source-of-truth.md`).

## The durable-execution note

Workflow engines (Temporal, durable execution frameworks generally) achieve
effectively-once *workflow* semantics by journaling completed steps and replaying to recover
(DDIA 2e, durable execution ~pp.187–191). That protects orchestration state; it does not make
the *activities themselves* idempotent. An activity that charges a card or sends an email
still needs its own idempotency key — the engine will re-run it after a crash.

## When weaker is fine

- Pure reads: retry freely (bounded).
- Metrics/logging where duplicates are tolerable.
- Cases where the downstream effect is itself deduplicated by a unique constraint you
  control — then the constraint IS the idempotency mechanism; name it as such.

## Bottom line

For every retried operation, write down: what makes attempt N safe after attempts 1..N-1 may
have partially run. "It probably won't happen twice" is not a mechanism.
