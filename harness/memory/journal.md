---
type: template
title: "Memory Journal Template"
description: "Append-only per-session friction log; the raw corpus that out-of-band curation reads to find patterns"
artifact: "harness/memory/journal.md"
tags: [memory, journal, append-only, curation, evidence, session-end]
---

# Session Journal

Append-only. One dated block per session, written at the end of it. **Never rewrite an
earlier block** — this file is evidence, and curation counts how often things recur.

This is **not** a lesson store and **not** a progress log:

- `harness/progress.md` = where the work stopped (status)
- `harness/memory/index.md` + topic files = distilled, durable lessons
- **this file** = raw friction, unfiltered, so curation has something to count

> **Why this template**: out-of-band curation needs a corpus. Without it, "find recurring
> patterns" has nothing to read and every proposal is an opinion. See
> [Dreaming](../references/dreaming-pattern.md).

## How to write a block

3-5 lines, no prose, no feature restatement. Answer only:

- What did you have to look up?
- What surprised you?
- What correction did you receive?
- What did you try and abandon, and why? (→ candidate `harness/memory/graveyard.md` row)
- What would you do differently?

If a session produced nothing worth any of those lines, write the date and `nothing`.
That is a real signal, not a gap.

<!-- Format:

## YYYY-MM-DD — feat-00X

- looked up: `<command or path>` — wasn't documented anywhere
- surprised: <the thing that behaved unexpectedly>
- corrected: <what the user told you>
- differently: <what you'd change>

Keep commands, paths and symbols in backticks. Curation looks for backticked tokens
that recur across sessions — a journal with no backticks is a journal of feature
restatements and will yield no proposals.
-->

## Entries

## 2026-09-13 — feat-016 wording drift (no feat id, maintenance fix)

- looked up: the guard check for this wording (`templates/agents.md Before Multi-Step
  Work waits for a go-ahead`) already existed since feat-016 — it just only ever read
  `templates/agents.md`, never the examples, so it couldn't have caught this
- surprised: the fix and the regression guard were the same shape as the
  Required/Optional-groups check already sitting in this file (`AGENT_FILES` array) —
  reused it instead of writing a second list of the same three paths
- differently: widened the existing check in place rather than adding a parallel
  examples-only check; two checks asserting the same string in different files is the
  kind of duplication that itself drifts

## 2026-09-13 — stale-examples gap (no feat id, maintenance fix)

- looked up: `create-harness.mjs` skips any file that already exists unless `--force` —
  running it plain against a stale example is safe, adds only what's missing, and can't
  clobber the example's hand-curated `AGENTS.md`/`feature_list.json`/`progress.md`
- surprised: both bundled examples were missing `scratchpad/` and `CLAUDE.md` too, not just
  `style.md` — three features (feat-013, feat-014, feat-015) had shipped without either
  example ever being regenerated to pick them up
- surprised: `init.sh` is the one artifact `--force`-free regeneration can't touch once it
  exists, so the feat-018 hook wiring had to be hand-copied into both examples' `init.sh`
  separately — same reason `templates/init.sh` itself has to be hand-kept in sync
- differently: found (but deliberately left alone) that both examples' plan-before-code
  wording is *also* stale against feat-016 — no ASCII diagram, no wait-for-"go" language.
  Scoped this session to the files the user actually named; flagged the wording drift as
  separate, not silently fixed in the same pass

## 2026-09-13 — feat-018

- looked up: `init.sh` is never copied to a scaffolded project — `create-harness.mjs`
  generates it from `initScriptFromCommands()` in `lib/harness-utils.mjs`. A hook-activation
  line added only to `templates/init.sh` would be invisible to every real scaffold, same
  trap the `ENV_CONTRACT_BLOCK` comment already warns about
- surprised: `core.hooksPath` is local `git config`, not a tracked file — it doesn't survive
  a fresh clone, so `init.sh` has to re-set it (idempotently) on every run rather than once
- surprised: this repo's own instance and the generic shipped template needed different
  trigger conditions on purpose — `version-4/` here vs. "anything outside `harness/`" in
  general — genuine customization, not drift, since this repo dogfoods the tool on itself
- differently: built the repo-local `.githooks/pre-commit` first and tested it live before
  generalizing into a template — cheaper to find the guard logic's edge cases (empty diff,
  non-git dir under `set -e`) against one real hook than to design the generic version blind
- corrected: mid-verification, `git reset --hard HEAD~1` (undoing a throwaway test commit)
  silently discarded an uncommitted `init.sh` edit sitting in the working tree at the time —
  `--hard` resets the tree, not just HEAD; caught via the stale-file-on-disk warning and
  reapplied. Reset harder than the commit it was meant to undo

## 2026-08-29 — feat-013

- looked up: `python3` — not on this machine (Windows); inline `node - <<'EOF'` works for small file-mangling probes
- surprised: `edit` is atomic per call — one non-matching `edits[].oldText` silently reverts the sibling edits in the same call; verify the whole call landed
- differently: `version-4/templates/*` are CRLF. Probe/replace strings with `\n` fail silently (string not found). Read the exact bytes (or `indexOf`) before crafting edits against shipped templates
- surprised: a new check referencing a `const` declared later in the same block is a TDZ runtime error, not a lint-visible problem — `node --check` does not catch it; the unit run does

## 2026-09-07 — feat-015, feat-016

- looked up: root `harness/feature_list.json` tracks version-4's own development (the tool
  that scaffolds OTHER projects), not this repo as a scaffolded target — easy to miss on a
  first read
- surprised: `index-coverage.test.mjs` only requires a new "Optional" artifact to stay out of
  the scorer's `hasFile()` set — a new optional artifact (`style.md`) needed zero scorer
  changes, just the doc bullet in the right group
- differently: committed both features without the End-of-Session `progress.md`/`journal.md`
  update; only caught it a session later when asked "what else do we need" — see
  `harness/memory/commit-is-not-session-end.md`

## 2026-09-08 — feat-017 (docs/workaround, script not started)

- looked up: neither `create-harness.mjs --force` nor `enrich-harness.mjs --apply` updates
  an already-scaffolded project's instruction text — the first overwrites everything, the
  second only fixes checks that are currently failing
- surprised: `enrich-harness.mjs` carries its own separate, hardcoded copy of the
  `Before Multi-Step Work` snippet (for splicing it into a harness missing the section
  entirely) — it is now stale against `templates/agents.md` after feat-016
- differently: applied `harness/memory/commit-is-not-session-end.md` for real this time —
  updated `progress.md` and this file in the same commit as the feature, not after

