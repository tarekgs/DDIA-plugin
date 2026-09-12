---
name: create-ddia-project-profile
description: Generate a compact project-specific architecture profile — materialized memory of sources of truth, data flows, capability status, obligations, risks, and invariants — so future agents don't re-derive the architecture each session. Run once per repository, then keep it honest with maintain-ddia-project-profile.
---

# Create a DDIA Project Profile

Produces `docs/engineering/ddia/` in the target repository — a compact, evidence-based map
of the architecture as it exists. This is **materialized memory**: a compression of current
source, never a substitute for it.

## Authority rules (print these in every generated file)

- **Current source code > project profile.** The profile is a map, not the territory.
- **Deliberate decisions/invariants are not rewritten because code contradicts them** —
  a contradiction is surfaced as an issue, not edited away.
- Every material claim carries a path or symbol as evidence, or is marked UNKNOWN.

## When to use

- First run of this plugin against a repository.
- Regenerating a profile that is missing, or that `maintain-ddia-project-profile` reported
  as fundamentally stale.

## Procedure

### Phase 1 — Repo reconnaissance (evidence before judgment)

1. Read the repo's own authority docs first: AGENTS.md / CLAUDE.md, README, architecture
   docs, ADRs/decision registers, CONTRIBUTING, onboarding. These declare the *intended*
   architecture and existing invariants.
2. Inventory the top-level structure: packages, services, extensions, infra, schema dirs,
   CI. Note languages, package managers, deployment tooling.
3. Find the stateful surfaces: search for schema definitions (ORM models, migrations,
   `CREATE TABLE`, protobufs), persistence clients, file/blob storage access, message
   producers/consumers, sync machinery, caches, background jobs, workflow engines.
4. Find the boundaries: servers/routes, IPC, network calls, sync protocols, authz checks.
5. Identify the actor classes: human users, AI agents, background jobs, migrations,
   replicas — anything that mutates shared state.

### Phase 2 — Trace the load-bearing flows

For each major domain (start with the 3–6 that matter most — don't be exhaustive):

**source of truth → mutation path → derived representations → consumers → recovery**

and, where relevant:

**component → owned data → dependencies → communication style → deploy/runtime deps**

Follow actual code: read the route handler, the mutator, the transaction, the propagation
step. Do not infer from filenames. If you can't verify a claim in code within a reasonable
look, mark it UNKNOWN — do not guess.

### Phase 3 — Classify findings and capabilities

Capabilities (what the system does/can do): IMPLEMENTED / PARTIAL / PLANNED / ABSENT /
UNKNOWN. ABSENT is not a defect. PLANNED-but-unbuilt means design obligations are owed.

Findings (things worth an agent's attention):

- **A — Current defect/risk**: implemented today; creates a concrete correctness,
  reliability, scalability, latency, operability, evolvability, or maintainability problem.
- **B — Improvement opportunity**: reasonable today; could materially improve.
- **C — Pre-launch architectural requirement**: not (fully) implemented; must be
  explicitly designed before the capability ships. Record as *obligations*, not defects.
- **D — Future scaling consideration**: legitimate but wrong to solve now — record the
  observable trigger that reopens it.

### Phase 4 — Write the profile

Create `docs/engineering/ddia/` with:

```
docs/engineering/ddia/
├── README.md                    # index, authority rules, generated-at + SHA, update contract
├── architecture-map.md          # components, boundaries, owned data, comm styles
├── state-and-dataflows.md       # per-domain SoT→mutation→derived→consumers→recovery
├── capability-status.md         # IMPLEMENTED/PARTIAL/PLANNED/ABSENT/UNKNOWN + evidence
├── prelaunch-obligations.md     # C findings: design owed before capability ships
├── risk-register.md             # A and B findings with evidence
└── decisions-and-invariants.md  # deliberate decisions, invariants, ADR pointers
```

Content requirements:

- **README.md**: one-line index of each file; the authority rules; `Generated:` date +
  repository commit SHA + the plugin version used; a short "how to update" pointing to
  `maintain-ddia-project-profile`.
- **architecture-map.md**: component table (name, responsibility, owns-data, depends-on,
  comms style, deploys-as) + a brief runtime/topology sketch. Compact — a map, not a novel.
- **state-and-dataflows.md**: per domain, the five-node narrative with file evidence.
- **capability-status.md**: the classification table; each entry has a one-line evidence
  pointer and (for PLANNED/PARTIAL) the doc/decision that defines the obligation.
- **prelaunch-obligations.md**: C findings — each is a checklist of design questions owed
  before the capability ships (authoritative state, concurrency semantics, evolution,
  failure story, validation).
- **risk-register.md**: A findings first (severity, evidence, failure scenario, smallest
  sufficient action), then B findings. Each A must name a concrete failure scenario, not
  an abstract worry.
- **decisions-and-invariants.md**: deliberate decisions already recorded (cite existing
  ADRs/decision registers — don't duplicate their text, summarize + link), invariants the
  codebase assumes, and candidates worth an ADR.

### Phase 5 — Keep it honest at birth

- Record the commit SHA and date prominently. A profile without a baseline is guesswork.
- Keep total profile size under ~1500 lines for a large repo; under ~600 for a small one.
  If it's longer, you documented code, not architecture.
- Never modify production code, migrations, or infra to "complete" the profile. Docs only.

## Anti-patterns

- Documenting every file — profile the *decisions and flows*, not the directory listing.
- Inferring behavior from naming ("sync" in the path ≠ sync engine).
- Turning ABSENT capabilities into defect findings.
- Copying book content into the profile — the profile is about THIS repo.
- Authoring a profile so detailed it rots in a month — compress.

## Output

The `docs/engineering/ddia/` tree plus a summary to the user: capability counts by class,
top A findings, top C obligations, and anything UNKNOWN that needs a human.
