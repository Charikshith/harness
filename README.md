# harness

Build and audit harnesses that make AI coding agents reliable.

## Install

```bash
# Latest (v3 — structural + behavioral, recommended)
npx skills add Charikshith/harness --skill harness-creator-v3
```

### Install a specific version

Each release is a self-contained folder — install and pin the one you want:

```bash
# v3 — OKF-aligned with behavioral policies (folder: version-3/)
npx skills add Charikshith/harness --skill harness-creator-v3

# v2 — OKF knowledge layer (folder: legacy/version-2/)
npx skills add Charikshith/harness --skill harness-creator-v2

# v1 — Original, pre-OKF (folder: legacy/version-1/)
npx skills add Charikshith/harness --skill harness-creator-v1
```

| Version | Folder | Skill name | Notes |
|---|---|---|---|
| **v3** | `version-3/` | `harness-creator-v3` | v2 + behavioral policies: Ponytail ladder, surgical editing, test-first DoD, safety carve-outs |
| v2 | `legacy/version-2/` | `harness-creator-v2` | OKF layer, `enrich-harness.mjs`, tiered CI, worked examples |
| v1 | `legacy/version-1/` | `harness-creator-v1` | Original — state/progress files, per-subsystem docs |

## Use

```bash
# Create a harness for a project
node version-3/scripts/create-harness.mjs --target /path/to/project

# Validate an existing harness
node version-3/scripts/validate-harness.mjs --target /path/to/project

# Generate a benchmark report
node version-3/scripts/run-benchmark.mjs --target /path/to/project --html /path/to/report.html
```

## What It Creates

- `AGENTS.md` or `CLAUDE.md` — startup workflow, coding policy (6-rung ladder), editing discipline, safety carve-outs
- `feature_list.json` — feature state tracker
- `progress.md` — session continuity log w/ per-step verification
- `init.sh` — standard startup and verification path
- `session-handoff.md` — optional, for larger sessions

## What It Checks (v3)

**Structural** (5 subsystems):
1. **Instructions** — Startup path, working rules, definition of done
2. **State** — Current feature, status, evidence, next step
3. **Verification** — Tests/checks the agent must run before claiming done
4. **Scope** — Prevents overreach and half-finished work
5. **Lifecycle** — Makes the next session restartable

**Behavioral** (1 subsystem):
6. **Behavioral** — Coding ladder, surgical editing, test-first verification, assumption surfacing, safety carve-outs

## Credit

Based on [learn-harness-engineering](https://github.com/walkinglabs/learn-harness-engineering) by walkinglabs.

## License

MIT
