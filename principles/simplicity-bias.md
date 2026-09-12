# Simplicity Bias: Complexity Must Pay Rent

**"Keep the current design" is a valid conclusion. So is "do not solve this yet."**

## The principle

Every distributed mechanism — replication, sharding, queues, caches, sagas, extra services —
introduces its own failure modes, operational surface, and reasoning cost. DDIA's first
chapter is explicit that distributed systems are a *cost*, paid for problems a single node
can't solve (ch.1, ~pp.19–24). Hard Parts' first chapter is equally explicit that there are
no best practices, only trade-offs (ch.1).

Therefore: any added complexity must name the concrete problem it solves, the evidence the
problem exists, and the cheaper alternatives considered. A mechanism recommended by a book
is still unjustified if the failure mode it addresses cannot occur at your scale or your
requirements.

## The justification bar

For each proposed mechanism, answer:

1. What concrete problem does this solve? Name the failure mode, invariant, workload, or
   requirement — not the pattern's name.
2. What is the evidence that problem exists NOW, or will exist at a defined trigger?
3. What simpler alternatives were considered (including "do nothing", "keep together",
   "handle it in the application", "accept the limitation")?
4. What new complexity does it add — new stores, new failure modes, new operational duties,
   new reasoning surface?
5. Why is that cost justified by the evidence?
6. What is the trigger that would make the deferred version necessary, and would we see the
   trigger in time to act?

A design that cannot fill in #1, #2, and #5 is fashion, not engineering.

## What earns complexity

- A measured hot path, not a hypothetical one.
- A correctness invariant that genuinely cannot be met at a weaker level.
- A failure mode that has actually happened or is one unlucky Tuesday away.
- An independence requirement with a named beneficiary (team, deployment, fault domain).
- A compliance/security boundary that must hold unconditionally.

## What doesn't earn it

- "It scales better" for a workload that fits on one node.
- "It's cleaner architecturally" when the price is distributed transactions.
- "Best practice" — there are none, only trade-offs (Hard Parts ch.1).
- Fear of a future migration: pre-complexity is usually more expensive than the migration
  it was avoiding, because you pay the complexity for the entire interim.

## The pre-launch corollary

For a system still being built, distinguish three states honestly:

- **Designed obligation** — the requirement is real and locked (e.g. "live co-editing ships
  at launch"); the design work is owed, and deferring the *thinking* is the risk.
- **Deferred mechanism** — legitimate concern, wrong time; record the observable trigger
  that reopens it.
- **Absent, not a defect** — the capability isn't planned; its absence proves nothing.

Do not convert "not built yet" into "broken now", and do not convert "locked requirement"
into "already handled".

## Bottom line

The cheapest correct architecture wins. When two designs both meet the requirements, pick
the one with fewer moving parts — and write down the trigger that would reopen the decision.
