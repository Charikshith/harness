# Session Progress Log

## Current State

**Last Updated:** 2026-07-27
**Active Feature:** none — all 11 features done

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
- [x] **feat-011** — environment contract added to both examples; the schema template parses
      as JSON and was used to validate all four feature lists; a third defect found on the way
      (`templates/init.sh` named the fail-fast flag in a comment, defeating that check)

### What's In Progress

- [ ] Nothing active. All 11 features are done.

### What's Next (with verification per step)

No open features. Candidates, none urgent:

1. `enrich-harness.mjs` has no `GAP_FIXES` entry for `dream-queue.md`, so a harness missing it
   is not repaired by `--apply` → verify: delete `harness/dream-queue.md`, run `--apply`, the
   file returns and the curation check still passes
2. Keyword-based checks remain vocabulary-sensitive by design and are documented as such. If
   that ever misleads someone, replace one with a structural check the way
   `entrypointExecutesSomething()` reads command lines instead of grepping prose → verify: the
   mutation gate kills a mutant the keyword version let survive

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
- [x] Unit checks: 7 + 12 passing, both wired into `./init.sh`
- [x] Regression-probed: reverting the insertion fix, removing an index row, breaking a script,
      regressing an example, and an unmet environment contract each exit non-zero

## Notes for Next Session

All 11 features are done. The two candidates listed above are optional; neither fails a check.

The lesson that keeps paying: every check added this session was probed by breaking the thing
it watches. Two of them were decorative until that probe — see harness/memory/index.md.

Two audit scripts used this session live in the scratchpad, not the repo: a documented-flag
audit and a claims audit. The reusable parts became `scripts/index-coverage.test.mjs`. If you
want the flag audit permanently, note it has one known false positive — `mutate-gate.mjs`
mentions `validate-harness.mjs --mutate` in its help as a cross-reference, not its own flag.
