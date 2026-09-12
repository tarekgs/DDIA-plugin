# Book Map — Where to Read Deeper

Topic → location index for *Designing Data-Intensive Applications, 2nd ed.* (Kleppmann &
Riccomini, O'Reilly 2026; "DDIA") and *Software Architecture: The Hard Parts* (Ford,
Richards, Sadalage, Dehghani, O'Reilly; "HP"). Page numbers are printed-book pages.

Use this when a skill's reasoning needs primary-source depth, or when citing the basis for
a recommendation. Skills summarize the *how to decide*; the books carry the *why and the
details*.

## DDIA 2e chapter index

| Ch | Title | Pages | Primary themes |
| --- | --- | --- | --- |
| 1 | Trade-Offs in Data Systems Architecture | 1–25 | systems of record vs derived data; cloud-native; when to distribute (8 reasons); microservices cost |
| 2 | Defining Nonfunctional Requirements | 33–56 | load parameters; percentiles/tail latency; metastable failure & retry storms (~38); fault tolerance; maintainability |
| 3 | Data Models and Query Languages | 65–108 | relational vs document vs graph; normalization; access-pattern-driven modeling |
| 4 | Storage and Retrieval | 115–150 | storage engines, indexes — architecturally: read/write amplification trade-offs |
| 5 | Encoding and Evolution | 161–192 | backward/forward compat; rolling upgrades; schema evolution; RPC failure semantics; durable execution (~187) |
| 6 | Replication | 197–243 | leaders/followers; replication lag; read-your-writes; concurrent writes; sync engines & local-first (~220); geo |
| 7 | Sharding | 251–272 | partitioning schemes; skew/hot spots; rebalancing; routing |
| 8 | Transactions | 277–344 | ACID reality; isolation levels & anomalies (Table 8-1 ~335); lost update ~299; write skew ~303; serializable costs; 2PC ~329 |
| 9 | The Trouble with Distributed Systems | 345–400 | partial failure; timeouts; process pauses; clocks; ordering/causality; leases & fencing (~373); deterministic testing |
| 10 | Consistency and Consensus | 401–450 | linearizability (~402) & its cost; causal consistency; logical clocks; consensus — when required vs overkill; coordination |
| 11 | Batch Processing | 451–486 | immutability; deterministic recompute; rebuildable derived state |
| 12 | Stream Processing | 487–538 | messaging semantics; idempotency; CDC (~503); outbox (~505); event sourcing; ordering; exactly-once reality (~528) |
| 13 | A Philosophy of Streaming Systems | 539–584 | end-to-end correctness; dataflow integrity; transactions vs streams as correctness tools; materialized state |
| 14 | Doing the Right Thing | 585–602 | correctness/integrity/auditability obligations |

## Hard Parts chapter index

| Ch | Title | Pages | Primary themes |
| --- | --- | --- | --- |
| 1 | No "Best Practices" | 1–24 | trade-off analysis method; ADRs (~5); fitness functions (~7); quantum concept |
| 2 | Discerning Coupling | 25–44 | static vs dynamic coupling; 3 forces (comm/consistency/coordination); saga name matrix (Table 2-1 ~41); architecture quantum (~28) |
| 3 | Architectural Modularity | 45–62 | modularity drivers; agility = maintainability+testability+deployability; modularity ≠ distribution |
| 4 | Architectural Decomposition | 63–80 | when/how to decompose; quantum counting |
| 5 | Component-Based Decomposition | 81–130 | component identification patterns |
| 6 | Pulling Apart Operational Data | 131–184 | data decomposition; join/materialized-view/shared-schema patterns; when NOT to split data |
| 7 | Service Granularity | 185–216 | **the core checklist** — integrators (keep together) vs disintegrators (split) |
| 8 | Reuse Patterns | 219–247 | shared libraries/components — when reuse helps vs hurts |
| 9 | Data Ownership & Distributed Transactions | 249–282 | single vs common ownership; ownership boundary placement; distributed txn cost |
| 10 | Distributed Data Access | 283–298 | how services read data they don't own |
| 11 | Managing Distributed Workflows | 299–321 | orchestration vs choreography trade-offs |
| 12 | Transactional Sagas | 323–364 | the 8 named sagas; compensating transactions; state management |
| 13 | Contracts | 365–380 | strict vs loose; stamp coupling; contract versioning |
| 14 | Managing Analytical Data | 381–397 | analytical data ownership (skim-level relevance) |
| 15 | Build Your Own Trade-Off Analysis | 399–416 | analysis methodology; fitness-function practice; governance |

## Topic cross-index (use this when routing a question)

- **Source of truth / derived data**: DDIA 1 (~10), 12–13
- **Retries / idempotency / exactly-once**: DDIA 9, 12 (~528); skill `ddia-failure-retries-idempotency`
- **Ordering / causality / clocks**: DDIA 9 (~363), 10 (~413)
- **Concurrent writes / conflicts**: DDIA 6 (~226), 8; sync engines DDIA 6 (~220)
- **Transactions / isolation / invariants**: DDIA 8 (Table 8-1 ~335)
- **Consistency models**: DDIA 10 (~401)
- **Replication / sync / offline**: DDIA 6 (~197, ~220)
- **Sharding / hot spots / skew**: DDIA 7 (~251)
- **Load / tail latency / overload / backpressure**: DDIA 2 (~33–52)
- **Schema evolution / compat**: DDIA 5; contracts HP 13 (~365)
- **Messaging / CDC / outbox / event sourcing**: DDIA 12 (~487); sync vs async HP 2 (~38)
- **Durable execution / workflows**: DDIA 5 (~187); HP 11 (~299), 12 (~323)
- **Coupling / decomposition / granularity**: HP 2–7; quantum HP 2 (~28)
- **Data ownership / distributed transactions**: HP 9–10
- **Orchestration vs choreography**: HP 11 (~299); saga shapes HP 2 (~41), 12
- **ADRs / fitness functions / governance**: HP 1 (~5–12), 15
- **Trade-off analysis method**: HP 1, 15; DDIA 1

## How to cite

In plugin content: `(DDIA ch.8, ~pp.299–303)` / `(HP ch.7, ~pp.185–218)`. Page numbers are
printed-page references; `~` acknowledges edition/format drift. Never reproduce book text
beyond a phrase — paraphrase the idea, cite the location.
