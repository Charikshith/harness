# harness

Build and audit harnesses that make AI coding agents reliable.

## Install

```bash
# Latest (v4 — structural + memory + behavioral, recommended)
npx skills add Charikshith/harness --skill harness-creator-v4
```

### Install a specific version

Each release is a self-contained folder — install and pin the one you want:

```bash
# v4 — harness/ install layout, memory subsystem (folder: version-4/)
npx skills add Charikshith/harness --skill harness-creator-v4

# v3 — OKF-aligned with behavioral policies (folder: version-3/)
npx skills add Charikshith/harness --skill harness-creator-v3

# v2 — OKF knowledge layer (folder: legacy/version-2/)
npx skills add Charikshith/harness --skill harness-creator-v2

# v1 — Original, pre-OKF (folder: legacy/version-1/)
npx skills add Charikshith/harness --skill harness-creator-v1
```

The folder is the coarse product line. The precise version is the semver in that folder's
`SKILL.md` and the headings in its `CHANGELOG.md` — those two are the only authoritative ones.

| Version | Folder | Skill name | Notes |
|---|---|---|---|
| **v4** (0.4.0) | `version-4/` | `harness-creator-v4` | v3 + memory subsystem and curation, environment contract, verification adversary, and the `harness/` install layout — three files at the project root, all harness state under `harness/` |
| v3 (0.3.0) | `version-3/` | `harness-creator-v3` | v2 + behavioral policies: Ponytail ladder, surgical editing, test-first DoD, safety carve-outs |
| v2 | `legacy/version-2/` | `harness-creator-v2` | OKF layer, `enrich-harness.mjs`, tiered CI, worked examples |
| v1 | `legacy/version-1/` | `harness-creator-v1` | Original — state/progress files, per-subsystem docs |

## Use

```bash
# Create a harness for a project
node version-4/scripts/create-harness.mjs --target /path/to/project

# Validate an existing harness
node version-4/scripts/validate-harness.mjs --target /path/to/project

# Generate a benchmark report
node version-4/scripts/run-benchmark.mjs --target /path/to/project --html /path/to/report.html
```

## What It Creates

Three files at the project root; all harness state under `harness/`.

- `AGENTS.md` — startup workflow, coding policy (6-rung ladder), editing discipline, safety carve-outs
- `CLAUDE.md` — reference to AGENTS.md
- `init.sh` — standard startup and verification path
- `harness/feature_list.json` — feature state tracker
- `harness/progress.md` — session continuity log w/ per-step verification
- `harness/session-handoff.md` — optional, for larger sessions
- `harness/memory/{index,journal,graveyard}.md` — what was *learned*, not where work stopped
- `harness/dream-queue.md` — curation proposals awaiting a human decision
- `harness/open-work.md` — work seen but declined under scope discipline

`AGENTS.md`, `CLAUDE.md` and `init.sh` stay at the root because they are read from there:
`AGENTS.md` is the cross-tool convention, `CLAUDE.md` points at it, and `init.sh` is invoked
as `./init.sh`. A harness on the older flat layout keeps working and keeps its score.

## What It Checks (v4)

**Structural** (5 subsystems):
1. **Instructions** — Startup path, working rules, definition of done
2. **State** — Current feature, status, evidence, next step
3. **Verification** — Tests/checks the agent must run before claiming done
4. **Scope** — Prevents overreach and half-finished work
5. **Lifecycle** — Makes the next session restartable

**Memory** (1 subsystem):
6. **Memory** — Bounded index, link integrity, curation input, two-step save, curation cadence and human gate, graveyard rows carrying a cause and an expiry condition

**Behavioral** (1 subsystem):
7. **Behavioral** — Coding ladder, surgical editing, test-first verification, assumption surfacing, safety carve-outs

Seven subsystems, scored as a percentage of 35.

## Credit

Based on [learn-harness-engineering](https://github.com/walkinglabs/learn-harness-engineering) by walkinglabs.

## License

MIT
