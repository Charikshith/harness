# harness

Build and audit harnesses that make AI coding agents reliable.

## Prerequisites

- **Node.js 18+** — runs the `.mjs` scripts. They use only built-in `node:` modules, so there is no `npm install` step.
- **npm / npx** — for the `npx skills add …` install path.
- **Git** — the harness startup workflow runs `git log`.
- **Bash** — `init.sh` runs under bash. On Windows use Git Bash or WSL.

## Install

```bash
# Latest (v4 — structural + memory + behavioral, recommended)
npx skills add Charikshith/harness --skill harness
```

## Update

```bash
npx skills update harness
```

### Install a specific version

Each release is a self-contained folder — install and pin the one you want:

```bash
# v4 — harness/ install layout, memory subsystem (folder: version-4/)
npx skills add Charikshith/harness --skill harness
```

This repo ships one product line: `harness` (semver in `version-4/SKILL.md`, history in
`version-4/CHANGELOG.md` — those two are the only authoritative versions). Pre-v4 lines
(v1, v2, v3) are frozen in git history; they are not in the working tree.

| Version | Folder | Skill name | Notes |
|---|---|---|---|
| **v4** (0.4.0) | `version-4/` | `harness` | Behavioral policies, memory subsystem and curation, environment contract, verification adversary, and the `harness/` install layout — three files at the project root, all harness state under `harness/` |

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
- `harness/progress.md` — session continuity log; carries the end-of-session handoff
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
