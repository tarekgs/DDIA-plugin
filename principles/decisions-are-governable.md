# Decisions Are Governable: ADRs and Fitness Functions

**A consequential decision you can't find later will be re-litigated badly. An invariant you
can't check will be violated silently.**

## The principle

Hard Parts (ch.15, and the broader evolutionary-architecture method) gives two tools that
scale beyond memory:

- **Architecture Decision Records (ADRs)** — short, durable records of consequential
  choices: context, alternatives considered, decision, rationale, consequences, and the
  conditions that would reopen it.
- **Architecture fitness functions** — executable checks that verify the system still obeys
  an important structural property: dependency rules, layering, contract compat, naming,
  resource bounds, SLOs.

They serve different purposes and are easily confused:

| Question | Tool |
| --- | --- |
| "Why did we choose X over Y?" | ADR |
| "Does the code still obey property P?" | Fitness function |
| "Does our documentation still describe reality?" | Profile maintenance (drift check) |

A fitness function failing means the *system* drifted from its intent — that's an
architectural issue requiring human review, not a doc bug. Profile drift means the *docs*
stopped matching code — that's a docs update.

## When to write an ADR

Write one when the decision is **consequential and hard to reverse**:

- A durable boundary: new service, new store, new sync plane, new coordination mechanism.
- A consistency/correctness commitment (e.g. "turns are exactly-once via outbox+dedup").
- An explicit trade-off accepted knowingly (e.g. "we accept 5s replication lag for X").
- A refused option that will keep getting proposed (record *why not*).
- A deferred decision with a named trigger.

Do not write ADRs for library picks, file layout, or anything cheap to change.

## ADR shape (keep it under a page)

```
# ADR-NNNN: <decision>
Status: accepted | superseded by ADR-M | revisited
Date / commit:
## Context     — what forced this decision; requirements and constraints
## Alternatives — real candidates with their honest costs
## Decision     — what we chose
## Consequences — what this makes easier, harder, forbidden, required
## Revisit when — observable triggers that reopen this
```

## When to build a fitness function

Only when the invariant is **important, objective, cheap to check, and stable**:

- Forbidden dependencies ("workflows never import provider SDKs"; "browser packages never
  import node-only modules") — cheap lint/architecture test.
- Layering and namespace rules ("plugin X may not read package Y's internals").
- Contract compatibility (OpenAPI diff, consumer-driven contract tests, replay gates for
  durable execution histories).
- Data-ownership rules ("only the gateway writes table T").
- Budgets (payload caps, workflow history size, API response shape invariants).

Do not build: governance for its own sake, checks for properties that change weekly, or a
rule so fuzzy only a human can judge it (those stay as review checklist items).

## Diagnostic questions

- If this decision were reversed by a future contributor, what would break — would they
  know before merging?
- Which invariants in this change are checkable today by a script, and which are
  judgment-only? Put the checkable ones in CI or a runnable check; put the judgment-only
  ones in an ADR or review checklist.
- Is there a documented decision the code now contradicts? Surface it; never silently edit
  the record to match the code.

## Bottom line

Write down what was decided and why, check mechanically what can be checked, and let the
rest be reviewable judgment. Governance is a few enforced invariants plus honest records —
not a process.
