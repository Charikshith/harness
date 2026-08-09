# Session Progress Log

## Current State

**Last Updated:** 2026-08-09
**Active Feature:** feat-012 Episodic session search (not-started; P1 of the memory-retrieval plan in harness/open-work.md)

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


---

## 2026-08-09 - Video analysis session (not a harness feature)

**Task:** Analyze https://youtu.be/PxuMqeIqCEo ("The Agent Memory Stack") from both its
transcript (transcript/raw1.txt) and frame captures; produce structured notes.

**Deliverable:** The_Agent_Memory_Stack_Notes.md at the repo root.

**Work done:**
- Downloaded 720p video to video/video.mp4 (yt-dlp; installed as python -m yt_dlp)
- Extracted 328 frames at 5 s intervals to frames/f_00001..00328.jpg (ffmpeg -vf fps=1/5;
  note: in cmd.exe a single %05d is needed, %%05d is not expanded). Re-extracted at full
  1280x720 later when reviewing clarity (initial pass was 640px)
- Built 14 contact sheets (5x5 tile grids) at frames/sheets/ via ffmpeg tile filter
- OCR'd every frame with Tesseract (frames/ocr_all.csv); probed +/-1-2 s around transitions
  to pin exact slide boundaries and capture clean slide text
- Ran clarity analysis on all 328 frames (frames/clarity_analysis.csv): Laplacian variance
  (0 blurry) + neighbor diff (20 static frames, all verified as stable slide repeats by OCR)
- Notes contain: slide timeline table (13 slides with time ranges + frames), the four memory
  types, the durable-stores -> context-builder -> model architecture map, memory failures /
  forgetting strategies, and the five-question checklist

**Lessons from this session (candidates for memory):**
- Windows cmd.exe: ffmpeg output template needs single %05d, not %%05d
- ffmpeg drawtext breaks on colons inside option values (e.g. timestamps); the tile filter
  is simpler for contact sheets
- Tesseract on Windows emits non-UTF8 bytes on stdout; capture bytes and decode with
  errors=replace instead of text=True
- This model's context omitted attached images; vision analysis was done via OCR of slides
  instead, which works for a text-heavy slide deck

**Unresolved:** none. Video, frames, sheets, OCR CSV, and slides folder kept for reference.

## 2026-08-09 - Memory-retrieval gap: design decision + feat-012 registered

**Task:** Plan (no code) for closing the retrieval gaps in docs/carbon_gap_memory.md; write the plan and register the first feature.

**Work done:**
- Reviewed carbon_gap_memory.md; confirmed curation signal shape in curate-memory.mjs (dated-block parser, backticked tokens, recurring-unrecorded/reconsidered signals, 5-proposal cap)
- Chose hybrid-runtime-leverage strategy (build search + conflict signal; delegate context assembly to runtime; document decay as debt)
- Wrote the phased plan (P0-P4) into harness/open-work.md under a Design decision section
- Added feat-012 Episodic session search (status not-started, depends feat-005) to harness/feature_list.json; rebuilt from git HEAD to undo a malformed first attempt, validated JSON
- ./init.sh passes after edits

**Not done (deliberately):** no code. P1 starts in a future session per open-work.md.

**Note:** the read tool returned stale content for harness/open-work.md and feature_list.json during this session (shown as clean — nothing to commit); verified ground truth via shell instead.
