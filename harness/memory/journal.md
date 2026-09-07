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

