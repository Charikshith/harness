# harness v4

A compact skill for building and auditing harnesses around AI coding agents.

It helps a repository provide everything agents need: instructions, state, verification, scope boundaries, lifecycle handoff, **and now embedded behavioral policies** — coding minimalism, surgical editing discipline, test-first verification, and safety carve-outs.

**Since v0.3.0:** The generated AGENTS.md includes behavioral policies directly. No external skill dependency required. The Ponytail ladder (YAGNI → stdlib → native → dep → one-liner → minimum), surgical editing rules (Karpathy §3), test-first verification gates, proactive assumption surfacing, and safety carve-outs are all embedded in the template.

## Install

```bash
npx skills add Charikshith/harness --skill harness
```

Or copy `version-4/` into your skill path.

## Use

```bash
node version-4/scripts/create-harness.mjs --target /path/to/project
node version-4/scripts/validate-harness.mjs --target /path/to/project
node version-4/scripts/run-benchmark.mjs --target /path/to/project --html /path/to/report.html
```

The scripts use only Node.js built-in modules. They can be run after copying the skill directory into another repository.

## What It Creates

Three files land in the project root; all harness state goes under `harness/`, so
scaffolding adds three visible entries to a repo root instead of eleven.

```
AGENTS.md          ← the cross-tool convention: every other agent tool reads this from root
CLAUDE.md          ← points at AGENTS.md; Claude Code only looks in the root
init.sh            ← stays runnable as ./init.sh from the project root
harness/           ← everything else; read only by this harness
```

Paths inside the harness are written relative to the **project root**, not to the file
they appear in — one rule, no depth arithmetic. The single exception is the link targets
in `harness/memory/index.md`, which stay sibling-relative.

- `AGENTS.md` — Full instruction file with embedded behavioral policies
- `CLAUDE.md` — Reference to AGENTS.md
- `harness/feature_list.json` — Feature state tracker with dependencies
- `harness/progress.md` — Session continuity log with per-step verification; also carries the
  end-of-session handoff (blockers, decisions, files changed, recommended next step)
- `init.sh` — Standard startup and verification entrypoint
- `harness/memory/index.md` — Bounded, always-on index of agent-written lessons
- `harness/memory/journal.md` — Append-only session friction log; the input to curation
- `harness/memory/graveyard.md` — Routes tried and rejected, each with an expiry condition
- `harness/dream-queue.md` — Out-of-band curation proposals awaiting a human decision
- `harness/open-work.md` — Work seen but declined under scope discipline; recruitable

Two further templates exist but are **not** scaffolded — created only when a project needs
them: `harness/environment.md` (declared external preconditions) and `memory-entry.md` (the shape
of a single lesson).

`create-harness.mjs` detects common project types and package managers. It supports Node/npm/pnpm/yarn/bun, Python, Go, Rust, Maven, Gradle, and .NET at a basic verification-command level.

## What It Checks

`validate-harness.mjs` scores seven dimensions:

| Dimension | Type | What it validates |
|---|---|---|
| Instructions | Structural | AGENTS.md exists, startup workflow, definition of done, verification commands, state routing |
| State | Structural | harness/feature_list.json, harness/progress.md (blockers, files, next-session notes), restart support |
| Verification | Structural | init.sh, fail-fast, test/static commands, evidence recording, that the entrypoint actually runs a command, declared environment preconditions, and — with `--mutate` — whether the gate demonstrably catches breakage |
| Scope | Structural | One-feature-at-a-time, dependencies, status fields, scope boundaries, recruitable open-work surface |
| Lifecycle | Structural | Startup script, end-of-session, restart markers |
| **Memory** | **v0.3.1** | Index exists, is initialised and within its cap; links intact (no dangling/orphaned lessons); curation input present; two-step save and curation cadence documented; graveyard rows carry a cause and an expiry |
| **Behavioral** | **v0.3.0** | Coding ladder, coding standards, surgical editing, test-first gates, assumption surfacing, safety carve-outs |

The score is structural + memory + behavioral, as a percentage of 35. It tells you whether the harness is present and coherent; it does not replace real before/after agent-session testing.

Two notes on how the verdict is computed:

- **The tier gates on the weakest subsystem.** A harness at ≥85 overall with any subsystem at ≤1/5 reports `usable`, not `production` — one subsystem is worth only ~14%, so total failure of one cannot drop the percentage out of the top band by itself.
- **Bottleneck tie-breaks toward structural dimensions**, and an `Also low:` line names anything else at ≤2/5. Memory is new, so most existing harnesses score 1 on it and would otherwise mask a genuinely broken verification or lifecycle.

### Three things that report but never gate

Deliberate, and not a staging decision — these stay unscored:

| Flag | Reports | Why never a check |
|---|---|---|
| `--mutate` | Kill rate over runtime mutations; separately, scorer blindness | The rate *is* scored. The blindness list is not: those mutants survive on every project, so counting them would cap everyone below the threshold and the check could never pass |
| `--log` | Appends the audit to `harness/memory/audit-log.jsonl` | A trend can say "this got worse", never "this is unacceptable" — acceptable is contextual. Gate it and the cheapest way to go green is to stop measuring honestly |
| `--budget` | Always-on context in lines and estimated tokens | A budget is a warning; there is no defensible universal ceiling |

### Curation

```bash
node version-4/scripts/curate-memory.mjs --target /path/to/project          # dry run
node version-4/scripts/curate-memory.mjs --target /path/to/project --apply  # write proposals
```

Reads the journal, lesson store and graveyard; writes proposals to `harness/dream-queue.md` and
nothing else. Two of the five curation signals are countable (a token recurring in the
journal with no lesson; a graveyard route resurfacing) and three need a person
(contradiction, dead stock, staleness) — the script prints those three as a checklist every
run rather than implying it found everything. It never edits `harness/memory/` or `AGENTS.md`.

### Behavioral Policy Details

The behavioral checks validate that the AGENTS.md contains:

1. **Coding Policy** — The Ponytail 6-rung ladder (YAGNI → stdlib → native → dep → one-liner → minimum)
2. **Coding Standards** — Minimum code, no speculative features, no unrequested abstractions, `ponytail:` comment convention
3. **Editing Discipline** — Surgical changes (Karpathy §3): touch only required lines, match style, don't refactor unbroken things
4. **Test-First Verification** — Bugs: reproduce first. Features: write check first. One-line success criterion.
5. **Multi-Step Planning** — Numbered plan with per-step verify checks (for >2 files or >3 steps)
6. **Assumption Surfacing** — Startup step 7: state understanding, stop and ask for structural ambiguity
7. **Safety Carve-Outs** — Input validation, data-loss prevention, security, accessibility, hardware calibration
8. **Escalation** — Over-specified requirements trigger added

## Status

- [x] Minimal harness scaffolding (v1)
- [x] Five-subsystem validation (v1)
- [x] HTML assessment report (v1)
- [x] Structural benchmark report (v1)
- [x] 10 eval cases (v1)
- [x] Generic verification detection (v1)
- [x] OKF knowledge layer, tiered CI, enrich script, worked examples (v2)
- [x] **Embedded behavioral policies** — coding ladder, surgical editing, test-first, safety (v0.3.0)

## Files

```text
harness/
├── SKILL.md
├── README.md
├── CHANGELOG.md
├── types.md
├── agents/openai.yaml
├── scripts/
│   ├── create-harness.mjs
│   ├── validate-harness.mjs
│   ├── mutate-gate.mjs
│   ├── curate-memory.mjs
│   ├── enrich-harness.mjs
│   ├── render-assessment-html.mjs
│   ├── run-benchmark.mjs
│   ├── index.md
│   └── lib/harness-utils.mjs
├── templates/
│   ├── agents.md          ← v0.3.0: embedded behavioral policies
│   ├── progress.md        ← v0.3.0: per-step verification + ponytail debt; carries the end-of-session handoff
│   ├── feature-list.json
│   ├── feature-list.schema.json
│   ├── init.sh
│   └── index.md
├── references/
│   ├── index.md
│   ├── context-engineering-pattern.md
│   ├── gotchas.md
│   ├── lifecycle-bootstrap-pattern.md
│   ├── memory-persistence-pattern.md
│   ├── multi-agent-pattern.md
│   ├── skill-runtime-pattern.md
│   └── tool-registry-pattern.md
├── evals/
│   ├── evals.json
│   └── index.md
└── examples/
    ├── index.md
    ├── python-api-harness/
    └── react-harness/
```

## Version History

Folder generations are the coarse product line; the precise version is the semver in
`SKILL.md` and the headings in [CHANGELOG.md](CHANGELOG.md). Those are the only two places
a version is authoritative.

| Version | Folder | Key additions |
|---|---|---|
| v4 (current, 0.4.0) | `version-4/` | `harness/` install layout — three files at the project root, all harness state under `harness/`; layout-aware resolvers with backward compatibility for the flat layout |
| v3 (0.3.0–0.3.2) | `version-3/`, then `version-4/` | Embedded behavioral policies (Ponytail ladder, surgical editing, test-first, safety), 6-dimension scoring; memory subsystem and curation in 0.3.1; environment contract and verification adversary in 0.3.2 |
| v2 | `version-2/` | OKF knowledge layer, enrich-harness.mjs, tiered CI, worked examples |
| v1 | `version-1/` | Step-by-step instructions, state/progress files, per-subsystem docs |

## Boundaries

This skill is for harness engineering, not model selection, prompt tuning alone, or app architecture. Keep project-specific facts in the target repository.

## Credit

Based on [learn-harness-engineering](https://github.com/walkinglabs/learn-harness-engineering) by walkinglabs.

## License

MIT
