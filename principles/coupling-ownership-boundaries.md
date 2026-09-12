# Coupling, Ownership, and Boundaries

**Split things that change for different reasons; keep together what must be consistent together.**

## The principle

Architecture is the art of placing boundaries. Every boundary you draw creates a coordination
cost; every boundary you *don't* draw creates a change-propagation cost. Hard Parts frames
this as coupling analysis (ch.2–5) and the granularity decision (ch.7): **integrators** are
forces that pull components together (shared transactions, shared data, workflow intimacy,
consistency needs); **disintegrators** push them apart (scale, fault isolation, independent
change cadence, team boundaries, different SLAs). Neither wins by default — you weigh them
per boundary.

## Coupling taxonomy (Hard Parts ch.2, ~pp.25–44)

- **Static coupling** — compile/deploy-time dependencies: imports, shared libraries, shared
  schema, shared contracts. A change to the shared thing ripples to every dependent.
- **Dynamic coupling** — runtime dependencies: synchronous calls, distributed transactions,
  shared writes, coordinated protocol. A *failure or slowdown* of the shared thing ripples
  to every dependent. Dynamic coupling is what turns "service A slow" into "everything
  down".

## What to check in code

- Who owns each data domain? One writer per domain is the default; a table written by three
  components has three owners, i.e. none (data ownership, Hard Parts ch.9, ~pp.249–282).
- Do the components share a transaction boundary today (one DB, one commit)? Splitting them
  across services converts a local transaction into a saga — name the compensating actions
  before you split (see `../skills/ddia-distributed-workflows/`).
- Is this call synchronous or asynchronous, and was that chosen or inherited? Sync = simple
  + temporally coupled + failure-amplifying. Async = resilient + eventually consistent +
  harder to trace (Hard Parts ch.11; DDIA ch.12).
- Does a "shared" library/contract hide a boundary violation — a domain type, query, or
  business rule that two components both depend on and both pretend to own?
- Change impact: pick a plausible change; count how many components must deploy together.
  That count is the real coupling number.

## The granularity decision checklist (Hard Parts ch.7, ~pp.185–218)

Integrators — reasons to KEEP TOGETHER:
- shared database transactions / strong consistency requirements
- workflow intimacy (chattiness: many calls per operation)
- shared code/logic that changes together
- low-latency requirement across the pair

Disintegrators — reasons to SPLIT:
- different scale requirements
- fault tolerance needs (one must survive the other's death)
- security boundaries
- independent deployability / team ownership
- different architecture characteristics (one needs high consistency, the other high
  availability)

Score the two lists against THIS boundary. A split with all integrators and no
disintegrators is distribution for fashion.

## Diagnostic questions

- If these two things disagree (one updated, the other not yet), who is harmed and for how
  long?
- What is the failure blast radius if the dependency is down?
- If we merge them: what coordination cost disappears? If we split them: what independence
  do we actually buy?
- Is there a middle option — same service, separate modules; same DB, separate schema —
  that gets 80% of the benefit at 20% of the distributed cost?

## Bottom line

Boundaries are bought with consistency and latency and sold for independence and scale.
Quote the price on both sides before drawing the line.
