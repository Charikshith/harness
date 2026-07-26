# Session Progress Log

## Current State

**Last Updated:** 2026-07-27
**Active Feature:** feat-011 - Close the two remaining known defects

## Status

### What's Done

- [x] **feat-001..010** — all verified implemented, evidence recorded in `harness/feature_list.json`
- [x] `harness/` install layout: three files at the project root, all state under `harness/`
- [x] Backward compatibility for the pre-`harness/` flat layout, including `detectHarnessLayout()`
      so a missing file is created into the layout a project already uses
- [x] Version scheme collapsed onto one: `version-4/`, `harness-creator-v4`, semver `0.4.0`
- [x] This repo migrated onto its own harness: 83/100 → 100/100, 3/3 mutants killed
- [x] `init.sh` replaced: was a placeholder echo that verified nothing, now syntax-checks all
      scripts, runs the unit checks, and requires both examples to score 100
- [x] Enricher heading-insertion bug fixed, plus three more in the same code path
- [x] Feature audit: 18/18 capabilities exercised and passing

### What's In Progress

- [ ] Nothing active. feat-011 is the next unstarted item.

### What's Next (with verification per step)

1. Add the environment-contract block to both examples' `init.sh` → verify: `grep -c environment.md version-4/examples/*/init.sh` returns 1 each, and both still score 100
2. Decide `templates/feature-list.schema.json` — either strip the YAML frontmatter so it parses as JSON, or rename it `.md` to stop implying it is JSON → verify: `node -e "JSON.parse(...)"` succeeds, or the file no longer claims a `.json` extension

## Blockers / Risks

- None blocking.
- Risk: frontmatter `timestamp`/`updated` dates are hand-maintained and drift silently. Fixed
  twice this session. A git-based check was considered and rejected — a directory rename touches
  every file without changing content, so the honest version costs more than the drift. Noted in
  `scripts/index-coverage.test.mjs`.

## Decisions Made

- **Three files stay at the project root.** `AGENTS.md` is the cross-tool convention other agent
  tools read from the root, `CLAUDE.md` points at it, `init.sh` is invoked as `./init.sh`.
  Everything else is read only by this harness.
- **All harness paths are written relative to the project root**, in every file, including files
  inside `harness/`. One rule, no depth arithmetic. Sole exception: link targets in
  `harness/memory/index.md` stay sibling-relative, and that file says so.
- **"When did this land" labels use semver, not v4.** Relabelling them v4 would claim behavioral
  policies and the memory subsystem shipped in this release. They did not.
- **`--min-score 100` for the bundled examples, not `--fail-fast`.** Measured: `--fail-fast`
  passes anything ≥85, so a whole subsystem could regress unnoticed.

## Files Modified This Session

- `version-4/` — renamed from `version-3.1/`, 66 files
- `version-4/scripts/lib/harness-utils.mjs` — layout primitives, `insertAtAnchor()`
- `version-4/scripts/*.mjs` — all routed through the layout resolvers
- `version-4/templates/*` — harness/ destinations and paths
- `version-4/scripts/{insert-anchor,index-coverage}.test.mjs` — new self-checks
- `AGENTS.md`, `init.sh`, `README.md`, `GUIDE.md`, `harness/*` — this repo's own harness

## Evidence of Completion

- [x] Gate passes: `./init.sh` → exit 0
- [x] Harness score: `node version-4/scripts/validate-harness.mjs --target . --no-fail --mutate`
      → 100/100, 3/3 mutants killed
- [x] Both examples: 100/100 at `--min-score 100`
- [x] Unit checks: 7 + 9 passing, both wired into `./init.sh`
- [x] Regression-probed: reverting the insertion fix, removing an index row, breaking a script,
      regressing an example, and an unmet environment contract each exit non-zero

## Notes for Next Session

Start with feat-011 — both items are small and neither fails a check today, which is exactly
why they are tracked rather than trusted to memory.

Two audit scripts used this session live in the scratchpad, not the repo: a documented-flag
audit and a claims audit. The reusable parts became `scripts/index-coverage.test.mjs`. If you
want the flag audit permanently, note it has one known false positive — `mutate-gate.mjs`
mentions `validate-harness.mjs --mutate` in its help as a cross-reference, not its own flag.
