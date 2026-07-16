# harness

Build and audit harnesses that make AI coding agents reliable.

## Install

```bash
# Latest (currently v2 — OKF-aligned)
npx skills add Charikshith/harness --skill harness-creator
```

### Install a specific version

The repo keeps each release as a self-contained folder so you can pin a version:

```bash
# Version 1 — pre-OKF (folder: version-1/)
npx skills add Charikshith/harness --skill harness-creator-v1

# Version 2 — OKF-aligned overhaul (folder: version-2/)
npx skills add Charikshith/harness --skill harness-creator-v2
```

| Version | Folder | Skill name | Notes |
|---|---|---|---|
| Latest | `skills/harness-creator/` | `harness-creator` | Tracks the newest release |
| v1 | `version-1/` | `harness-creator-v1` | Step-by-step instructions, state/progress files, per-subsystem docs |
| v2 | `version-2/` | `harness-creator-v2` | v1 + OKF knowledge layer, `enrich-harness.mjs`, tiered CI validation, worked examples |

## Use

```bash
# Create a harness for a project
node skills/harness-creator/scripts/create-harness.mjs --target /path/to/project

# Validate an existing harness
node skills/harness-creator/scripts/validate-harness.mjs --target /path/to/project

# Generate a benchmark report
node skills/harness-creator/scripts/run-benchmark.mjs --target /path/to/project --html /path/to/report.html
```

## What It Creates

- `AGENTS.md` or `CLAUDE.md`
- `feature_list.json`
- `progress.md`
- `init.sh`
- `session-handoff.md`

## What It Checks

1. **Instructions** — Startup path, working rules, definition of done
2. **State** — Current feature, status, evidence, next step
3. **Verification** — Tests/checks the agent must run before claiming done
4. **Scope** — Prevents overreach and half-finished work
5. **Lifecycle** — Makes the next session restartable

## Credit

Based on [learn-harness-engineering](https://github.com/walkinglabs/learn-harness-engineering) by walkinglabs.

## License

MIT
