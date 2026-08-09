---
type: template
title: "Open Work Template"
description: "Markers for work seen but declined under scope discipline — recruitable by a later or concurrent session"
artifact: "harness/open-work.md"
tags: [scope, recruitment, backlog, multi-agent]
---

# Open Work

Things noticed but not done, because they were out of scope for the active feature.

One line each: `- [reason-code] <one-line description> (seen in feat-XXX)`

Reason codes:

- `blocked-on` — cannot proceed until something else lands
- `needs-review` — done but wants a second pair of eyes
- `cheap-parallel-win` — small, independent, safe to pick up alongside other work
- `flaky` — intermittent, not reliably reproducible yet

> **Why this template**: scope discipline tells a session to decline unrelated work. It
> never said where the observation should go, so it went into `harness/progress.md` prose that
> nothing reads. The information was produced and then discarded. This file is the landing
> place, in a shape another session can act on.

## Not a backlog

An item earns a line here only because a session **actually saw it** and declined it under
scope discipline. This is not a wishlist, not a roadmap, and not a place for ideas nobody
has encountered in the code. Features belong in `harness/feature_list.json`; curation proposals
belong in `harness/dream-queue.md`.

Remove a line when the work is done or promoted to a real feature. A line that has sat
here across many sessions is itself a signal — either it is not actually cheap, or nobody
is reading this file.

## Items

_No open items yet._

## Design decision (2026-08-09): close the memory retrieval gaps

Source: `docs/carbon_gap_memory.md` — gap analysis of "The Agent Memory Stack" notes
against version-4. version-4 implements the storage/curation half well; the
retrieval/assembly half (session search, context builder, conflict/currency,
decay/compression) is documented-only or absent.

**Decision: hybrid-runtime-leverage, built in phases.** Build the two pieces that
are genuinely the harness's job (queryable journal, mechanical conflict detection);
delegate context assembly to the host runtime; document decay/compression as debt.
Do NOT build a vector DB, FTS index, runtime context builder, compression pipeline,
or `facts.md` store — each is runtime-owned or heavy machinery the skill defers.

### Phased plan

- **P0 — Scope.** One feature at a time. `feat-012` (below) is the first; a future
  session starts there. Re-read `harness/dream-queue.md` and this file first.
- **P1 — Session search** (closes episodic-recall gap). Add `scripts/search-journal.mjs`
  to version-4: parse dated journal blocks (reuse `journalBlocks` from
  `curate-memory.mjs`), score by keyword hits, print top blocks with dates and
  context. Options: `<keywords> [--since DATE] [--count N]`. Verification first:
  write the eval case / `.test.mjs` fixture (two blocks match, recency wins), then
  the script, then wire into `init.sh` and the eval suite like the other tests.
  Add `--budget`-style one-line documentation in `scripts/index.md`.
- **P2 — Conflict signal** (closes then-vs-now gap). In `curate-memory.mjs`, promote
  the manual "two lessons contradict" signal to countable: same backticked token in
  >=2 dated journal blocks or >=2 lessons -> proposal
  `signal: 'suspect-conflict'`, claim "reconcile or supersede", same proposal shape,
  same dedupe against the Decided table, same 5-proposal cap. Human resolves by
  editing a lesson or graveyarding with `Recheck-if`.
- **P3 — Context assembly instructions** (closes context-builder gap honestly).
  In `references/context-engineering-pattern.md`: name context building as an
  explicit non-goal (the host runtime assembles context); add an always-on vs.
  on-demand read order to the startup workflow. Zero scripts.
- **P4 — Decay + debt** (closes forgetting gap). Add recency weighting to the P1
  script (old blocks rank lower, remain findable). Document compression as debt
  with trigger: "when memory/index.md hits 80% of its 200-line cap."

### Trigger to revisit

Multi-agent or large-store operation. Single-operator text harness: build no
heavier than P1 + P2.
