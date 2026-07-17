# harness-creator v3

A compact skill for building and auditing harnesses around AI coding agents.

It helps a repository provide everything agents need: instructions, state, verification, scope boundaries, lifecycle handoff, **and now embedded behavioral policies** — coding minimalism, surgical editing discipline, test-first verification, and safety carve-outs.

**New in v3:** The generated AGENTS.md includes behavioral policies directly. No external skill dependency required. The Ponytail ladder (YAGNI → stdlib → native → dep → one-liner → minimum), surgical editing rules (Karpathy §3), test-first verification gates, proactive assumption surfacing, and safety carve-outs are all embedded in the template.

## Install

```bash
npx skills add Charikshith/harness --skill harness-creator-v3
```

Or copy `version-3/` into your skill path.

## Use

```bash
node version-3/scripts/create-harness.mjs --target /path/to/project
node version-3/scripts/validate-harness.mjs --target /path/to/project
node version-3/scripts/run-benchmark.mjs --target /path/to/project --html /path/to/report.html
```

The scripts use only Node.js built-in modules. They can be run after copying the skill directory into another repository.

## What It Creates

- `AGENTS.md` — Full instruction file with embedded behavioral policies
- `CLAUDE.md` — Reference to AGENTS.md
- `feature_list.json` — Feature state tracker with dependencies
- `progress.md` — Session continuity log with per-step verification
- `init.sh` — Standard startup and verification entrypoint
- `session-handoff.md` — Optional multi-session handoff

`create-harness.mjs` detects common project types and package managers. It supports Node/npm/pnpm/yarn/bun, Python, Go, Rust, Maven, Gradle, and .NET at a basic verification-command level.

## What It Checks

`validate-harness.mjs` scores six dimensions:

| Dimension | Type | What it validates |
|---|---|---|
| Instructions | Structural | AGENTS.md exists, startup workflow, definition of done, verification commands, state routing |
| State | Structural | feature_list.json, progress.md, handoff structure, restart support |
| Verification | Structural | init.sh, fail-fast, test/static commands, evidence recording |
| Scope | Structural | One-feature-at-a-time, dependencies, status fields, scope boundaries |
| Lifecycle | Structural | Startup script, end-of-session, handoff, restart markers |
| **Behavioral** | **v3 new** | Coding ladder, coding standards, surgical editing, test-first gates, assumption surfacing, safety carve-outs |

The score is structural + behavioral. It tells you whether the harness is present and coherent; it does not replace real before/after agent-session testing.

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
- [x] **Embedded behavioral policies** — coding ladder, surgical editing, test-first, safety (v3)

## Files

```text
harness-creator/
├── SKILL.md
├── README.md
├── CHANGELOG.md
├── types.md
├── agents/openai.yaml
├── scripts/
│   ├── create-harness.mjs
│   ├── validate-harness.mjs
│   ├── enrich-harness.mjs
│   ├── render-assessment-html.mjs
│   ├── run-benchmark.mjs
│   ├── index.md
│   └── lib/harness-utils.mjs
├── templates/
│   ├── agents.md          ← v3: embedded behavioral policies
│   ├── progress.md        ← v3: per-step verification + ponytail debt
│   ├── feature-list.json
│   ├── feature-list.schema.json
│   ├── init.sh
│   ├── session-handoff.md
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

| Version | Folder | Key additions |
|---|---|---|
| v3 | `version-3/` | Embedded behavioral policies (Ponytail ladder, surgical editing, test-first, safety), 6-dimension scoring |
| v2 | `version-2/` | OKF knowledge layer, enrich-harness.mjs, tiered CI, worked examples |
| v1 | `version-1/` | Step-by-step instructions, state/progress files, per-subsystem docs |

## Boundaries

This skill is for harness engineering, not model selection, prompt tuning alone, or app architecture. Keep project-specific facts in the target repository.

## Credit

Based on [learn-harness-engineering](https://github.com/walkinglabs/learn-harness-engineering) by walkinglabs.

## License

MIT
