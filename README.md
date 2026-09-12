# DDIA Plugin

Durable data-systems and architecture reasoning for AI coding agents — distilled from
*Designing Data-Intensive Applications, 2nd ed.* (Kleppmann & Riccomini) and
*Software Architecture: The Hard Parts* (Ford, Richards, Sadalage, Dehghani), packaged as
portable Agent Skills that install into Claude Code, OpenAI Codex, Cursor, and Devin.

The plugin does not ship textbook content. It ships the *reasoning procedures* — what to
check, what to ask, what trade-off to name — so an agent working on a real codebase
consistently asks the right questions about state, ownership, concurrency, failure,
consistency, and scale before it writes or changes code.

## What it is

- **15 skills** — one front-door router (`ddia-engineer`) plus specialized workflows.
  Skills are organized by *decision surface*, not book chapter: you route to the question
  the agent is actually answering (what's the source of truth? what happens on retry?
  should this be a service?), and the skill brings whichever book's framework fits.
- **12 principles** — short, durable engineering principles (`principles/*.md`), each the
  kind of thing that outlives any one codebase: source-of-truth, partial failure,
  retry safety, ordering, agents-as-writers, honest scale, simplicity bias.
- **2 references** — `references/book-map.md` (topic → book/chapter/page, for going deeper)
  and `references/failure-modes.md` (a consolidated radar of named failure modes).
- **1 memory skill** — `create-ddia-project-profile` generates a compact, project-specific
  architecture profile (`docs/engineering/ddia/`); `maintain-ddia-project-profile` keeps it
  from going stale. The profile is the durable artifact the transient skills feed.
- **Sanity evals** — `evals/scenarios.md` (9 scenario checks, including one where the
  right answer is "keep it simple") and `evals/check-plugin.mjs` (structural integrity).

## What it is not

- Not a codebase. No application code, no infrastructure, no vendor SDK.
- Not a summary of the books. The books are cited, not reproduced.
- Not an opinion that microservices are good or bad. It carries the *trade-off* machinery
  so the agent reaches the defensible answer for the system in front of it — which is
  often "keep it together" or "defer with a trigger."

## Layout

```
plugin.json                    # root manifest — Agent Plugins 1.0.0 (Cursor native, Codex canonical, Devin fallback)
.claude-plugin/plugin.json     # Claude Code manifest — also read by Devin and Codex as fallback
.claude-plugin/marketplace.json# self-referencing catalog — enables `plugin marketplace add` (Claude + Codex)
.cursor-plugin/plugin.json     # Cursor plugin manifest (richer component set)
.devin-plugin/plugin.json      # Devin manifest (highest Devin precedence)
skills/<name>/SKILL.md         # 15 skills, all in one shared canonical tree
principles/*.md                # 12 shared durable principles
references/*.md                # book map + failure-mode index
evals/                         # sanity scenarios + structural check
```

`skills/<name>/SKILL.md` at plugin root **auto-discovers in all four ecosystems with zero
manifest fields** — the manifests exist for naming, install, and vendor policy, not to find
the skills. One canonical skill tree, four thin manifests around it. There is no
duplicated skill per agent.

## The skills

| Skill | Answers | Primary source |
| --- | --- | --- |
| `ddia-engineer` | *Which skill should handle this?* — the router | both |
| `ddia-design-stateful-feature` | What's the state, who owns it, what are the invariants? | both |
| `ddia-review-architecture-change` | Is this change safe? What's the trade-off? | both |
| `ddia-concurrency-and-transactions` | What can race, what isolation is actually needed? | DDIA ch.8–10 |
| `ddia-failure-retries-idempotency` | What happens on timeout/retry/partial failure? | DDIA ch.9,12 |
| `ddia-realtime-sync-design` | Live co-editing: authority, conflicts, agents-as-writers | DDIA ch.6,9,12 |
| `ddia-schema-evolution` | How do old and new clients coexist through a change? | DDIA ch.5; HP ch.13 |
| `ddia-scale-and-load` | Is this path hot? What's the cheapest sufficient fix? | DDIA ch.2,7; HP ch.3 |
| `ddia-derived-state-and-caching` | System of record vs derived; invalidation, rebuild | DDIA ch.1,11–13 |
| `ddia-events-and-messaging` | Sync vs async; delivery/ordering semantics; outbox | DDIA ch.12; HP ch.2,11 |
| `ddia-service-boundaries` | Should this split? Coupling, granularity, data ownership | HP ch.2–9 |
| `ddia-distributed-workflows` | Orchestration vs choreography; which saga shape? | HP ch.11–12; DDIA ch.9,12 |
| `ddia-architecture-decisions` | ADRs, fitness functions, governance | HP ch.1,15 |
| `create-ddia-project-profile` | Build the project's compact architecture memory | both |
| `maintain-ddia-project-profile` | Keep the profile from going stale | both |

## Install

The skills are a single canonical `skills/` tree that every ecosystem auto-discovers. Pick
the install path that fits — plugin-manager install where available, or the manual
clone+symlink fallback that works everywhere.

### Claude Code

```
# Remote install as a marketplace plugin (uses .claude-plugin/marketplace.json)
/plugin marketplace add tarekgs/DDIA-plugin
/plugin install ddia-engineering@ddia-engineering

# Local: run a clone as a session plugin
claude --plugin-dir /path/to/DDIA-plugin

# Zero-install: drop the repo under a skills dir Claude already scans — it loads
# as ddia-engineering@skills-dir (needs .claude-plugin/plugin.json, which we ship)
ln -s /path/to/DDIA-plugin ~/.claude/skills/ddia-engineering      # user scope
ln -s /path/to/DDIA-plugin <repo>/.claude/skills/ddia-engineering # project scope
```

`skills/` auto-discovers at plugin root; `.claude-plugin/plugin.json` names the plugin.
**Cloud**: repo-committed `.claude/skills/` loads in cloud sessions, plugins declared in
`.claude/settings.json` `enabledPlugins` install at session start, and account-synced
plugins load as `@synced`. Local-only: `--plugin-dir`, user installs, `~/.claude/skills`.

### OpenAI Codex

Root `plugin.json` (Agent Plugins 1.0.0) is Codex's canonical plugin format; the
`.claude-plugin/` files are explicitly accepted as a compat path.

```
# Remote install as a marketplace plugin (Codex accepts .claude-plugin/marketplace.json)
codex plugin marketplace add tarekgs/DDIA-plugin

# User-scope skills — documented path is ~/.agents/skills (NOT ~/.codex/skills)
mkdir -p ~/.agents/skills
ln -s /path/to/DDIA-plugin/skills/* ~/.agents/skills/

# Repo-scope: commit or symlink into the project's shared skill dir
ln -s /path/to/DDIA-plugin/skills <repo>/.agents/skills/ddia-engineering
```

Invoke with `/skills` or `$skill-name` in CLI/IDE. **Cloud**: workspace admins import the
marketplace from GitHub (Admin → Plugins → Import, daily sync); repo `.agents/skills`
travels with the checkout. Plugins are unavailable in the IDE extension; MCP-bearing
plugins are desktop-only (this plugin ships no MCP, so it is unaffected).

### Cursor

Cursor loads both formats we ship — root `plugin.json` (Agent Plugins spec) and
`.cursor-plugin/plugin.json` (richer Cursor format).

```
# Local development — symlink the clone into the local plugins dir, then reload window
ln -s /path/to/DDIA-plugin ~/.cursor/plugins/local/ddia-engineering

# Loose project skills (no plugin install) — Cursor reads .agents/skills and .cursor/skills
ln -s /path/to/DDIA-plugin/skills <repo>/.agents/skills/ddia-engineering
```

Official distribution is via the Cursor Marketplace (publish at cursor.com/marketplace)
or a team marketplace imported from the repo (Dashboard → Plugins → Import from Repo).
**Cloud Agents**: project skills in the repo are available; synced `~/.cursor/skills`
reaches Cloud Agents when "Sync Skills for Cloud Agents" is enabled. `~/.agents/skills`
and unsynced local skills do **not** reach Cloud Agents.

### Devin

```
# Direct git install (recorded in your Devin manifest, syncs to all machines + cloud)
devin plugins install tarekgs/DDIA-plugin

# Local-only (live-linked; edits apply next session)
devin plugins install --local /path/to/DDIA-plugin
devin plugins list   # verify
```

Devin reads `.devin-plugin/plugin.json` first (highest precedence), then
`.claude-plugin/plugin.json`, then root `plugin.json` — we ship all three. Skills surface
as `/ddia-engineering:<skill>` slash commands. **Cloud**: plugins from personal/org/
enterprise manifests and repo `.devin/config.json` `requiredPlugins` reach cloud sessions;
plugin subagents and hooks are local-only (this plugin uses neither).

### Manual fallback — works in all four

If no plugin manager is available, clone and symlink each `skills/<name>/` into the
consumer's skill dir:

- **`.agents/skills/`** covers Codex, Cursor, and Devin (project); `~/.agents/skills/`
  for user scope.
- **`.claude/skills/`** for Claude (project); `~/.claude/skills/` for user scope.

`.agents/skills/` is the common denominator — everything but Claude reads it. To cover all
four from a repo, ship skills in both `.agents/skills/` and `.claude/skills/` (symlink one
to the other).

## Verify

```
node evals/check-plugin.mjs   # structural check — manifests, frontmatter, cross-links, router coverage
```

Exit 0 = coherent package. Run `evals/scenarios.md` by hand against an agent with the
plugin installed to sanity-check routing and reasoning.

## Portability notes (honest limits)

- **Skills are portable; manifests are per-vendor.** `skills/<name>/SKILL.md` at plugin
  root auto-discovers in all four with zero manifest fields — the five manifests exist for
  naming, install mechanics, and vendor policy, not to locate the skills.
- **Skill frontmatter is the common denominator.** This plugin's skills use only spec
  fields (`name` matching the folder, `description` ≤1024 chars, triggers front-loaded) —
  the maximum-portability subset. Vendor-tuned frontmatter (`when_to_use`, `paths`,
  `allowed-tools`, `subagent`, `triggers`) is deliberately absent: `allowed-tools` is a
  string in spec/Claude but a list in Devin, and non-spec fields hard-fail claude.ai/Skills
  API packaging. If a skill ever needs vendor fields, fork it into a vendor-specific folder.
- **`.agents/skills/` is the project-skill common denominator** — Codex, Cursor, and Devin
  all read it natively. Claude Code does not; it needs `.claude/skills/`. Ship both (or a
  symlink) for repo-committed coverage.
- **Cloud coverage differs per vendor.** Verified paths: Claude — repo `.claude/skills/`,
  `enabledPlugins` in `.claude/settings.json`, account `@synced`; Codex — workspace
  marketplace import (GitHub, daily sync) + repo `.agents/skills/`; Cursor — project
  skills in the repo + synced `~/.cursor/skills/` (opt-in); Devin — personal/org/enterprise
  manifests + repo `.devin/config.json`. Local-only surfaces exist on each — the per-tool
  sections above name them.
- **Plugin components beyond skills are ecosystem-specific** and intentionally absent —
  hooks (different event names and file locations per vendor), subagents (local-only in
  Devin, not in Codex IDE), MCP servers (different config files: `mcp.json` vs `.mcp.json`).
  This plugin ships skills + principles + references only — the portable core.
- **Unverified**: which manifest Cursor prefers when both root `plugin.json` and
  `.cursor-plugin/plugin.json` exist (harmless here — both point at the same `skills/`);
  explicit Codex-cloud loading of repo `.agents/skills` (implied by repo checkout).

## Provenance

Distilled by hand and subagent from the two books (see `references/book-map.md` for the
topic→location index). The books are not included and must not be committed. Citations in
skills use `(DDIA ch.N, ~pp.X–Y)` / `(HP ch.N, ~pp.X–Y)` — printed-page references,
paraphrased ideas, never reproduced text.
