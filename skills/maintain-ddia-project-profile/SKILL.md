---
name: maintain-ddia-project-profile
description: Keep an existing DDIA project profile honest as the codebase evolves — detect drift between docs and code, reclassify capabilities that changed state, update stale descriptions, and surface (never silently fix) apparent invariant violations. Outcome is clean / changed / blocked.
---

# Maintain a DDIA Project Profile

Reads `docs/engineering/ddia/` in the target repository and reconciles it against current
source. The profile is materialized memory — this skill keeps the map from rotting.

## Authority rules (non-negotiable)

- For descriptions of current behavior: **CURRENT CODE > PROFILE**. Update the profile to
  match reality.
- For recorded decisions/invariants: **DO NOT silently rewrite the invariant because code
  violates it.** Surface the contradiction as a blocked item requiring human judgment.
- This skill never modifies production code, migrations, or infra. It only edits
  `docs/engineering/ddia/` files (and reports).

## When to use

- Before major work that relies on the profile's accuracy.
- Periodically, or after landing an architecture-affecting change.
- When a profile exists but its recorded SHA is meaningfully behind HEAD.

## Procedure

### 1. Load and baseline

- Read `docs/engineering/ddia/README.md` — note `Generated:`/`Updated:` date and commit SHA.
- `git log` the range SHA..HEAD filtered to the architecture-relevant paths the profile
  covers — the diff since baseline is your suspect list, not the whole repo.
- Read all profile files so you know what claims need checking.

### 2. Drift detection

For each material claim in the profile, check current source:

- **State/dataflow claims**: does the named store still own that state? Did the mutation
  path gain a step, a bypass, or a new writer? Do derived copies still rebuild from the
  declared source?
- **Component claims**: new components/services? Deleted ones? Changed comms style
  (sync→async, REST→events)? New dependencies between components?
- **Schema claims**: new tables/columns materially changing a domain's model? Removed ones?
- **Capability transitions**: did a PLANNED or ABSENT capability become PARTIAL or
  IMPLEMENTED? Did an IMPLEMENTED one get deleted or degraded to dormant? Update the class
  and cite the new evidence.
- **Risk-register entries**: still real? Fixed? New A/B findings introduced by the diff?

### 3. Invariant and decision checks

- Re-check each recorded invariant in `decisions-and-invariants.md` against the code.
  Two outcomes only:
  - Still honored → note verified.
  - Apparently violated → **BLOCKED item**: report the invariant, the violating code path,
    and the evidence. Do not edit the invariant to match the code — the code may be the
    bug. A human decides whether to fix the code or amend the decision.
- New consequential decisions landed since baseline without a record → flag as needing an
  ADR (see `ddia-architecture-decisions`).

### 4. Reconcile and write

- Update stale descriptive content (component tables, flow narratives, capability classes,
  risk entries). Keep changes tight — this is reconciliation, not re-authoring.
- Update `Generated:`/`Updated:` + the new baseline SHA in README.md.
- Add genuinely new architecture (new component, new plane, new store) with the same
  compactness bar as the original profile.
- Remove dead entries (deleted components, resolved risks) — archive by deletion, the git
  history keeps the record.

### 5. Report outcome — exactly one of

- **clean** — profile still matches reality; only baseline metadata bumped.
- **changed** — stale material reconciled; list what changed and why.
- **blocked** — ambiguity or apparent invariant violations require human judgment. List
  each blocked item: the invariant, the contradicting evidence, and the question a human
  must answer. Partial profile updates may still be committed; the blocked items are the
  report.

A single run can both change descriptive content AND end blocked on an invariant —
report `blocked` with the changes listed.

## Anti-patterns

- Rewriting invariants/decisions to match code (that's laundering a violation into the
  record).
- Regenerating the whole profile when the existing one is 90% right — reconcile, don't
  re-derive.
- Verifying against names/comments instead of behavior.
- Expanding the profile with every run — compression is the feature.
- Editing production code to "fix" a discrepancy you found (never — report it).

## Output

- Outcome: `clean` | `changed` | `blocked`
- Diff summary of profile edits.
- For `blocked`: the numbered list of items needing human judgment, each with evidence and
  the decision question.
- New baseline SHA/date recorded in the profile README.
