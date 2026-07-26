---
type: changelog
title: "Changelog"
description: "Reverse-chronological history of changes to the harness-creator skill"
tags: [changelog, history, releases]
updated: 2025-07-17
---

# Changelog

## 2026-07-25 (v0.3.1)

### Memory subsystem (major)
- **Memory is now the seventh subsystem**, scored alongside the five structural ones and behavioral policies. Rationale: a harness can track state perfectly and never learn anything. `progress.md` and `feature_list.json` record *where work stopped* (a bookmark); memory records *what is now known* (a lesson). Previously memory existed only as a reference pattern — advice, with nothing scaffolding, templating, or scoring it.
- **BREAKING (scoring):** overall is now a percentage of **35** instead of 30. Harnesses built under v0.3.0 will score lower until memory is added — roughly 10-11 points. A previously-perfect harness lands at **89/100**. Percentage alone does *not* cross the 85 production boundary at that value, so the tier is now additionally gated on the weakest subsystem (see below) rather than on percentage alone.
- **Usability tier now gates on the weakest subsystem.** A harness scoring ≥85 overall but with any subsystem at ≤1/5 reports `usable`, not `production`. Without this, the tool could print `Bottleneck: memory`, `memory: 0/5`, and `✅ production` simultaneously — a single subsystem is worth only 5/35 (~14%), so total failure of one cannot move the percentage out of the top band by itself.
- **Bottleneck now tie-breaks toward structural subsystems**, and a new `Also low:` line names every other subsystem at ≤2/5. Memory is new, so nearly every existing harness scores 1 on it and would otherwise win the bottleneck sort forever — masking a genuinely broken `verification` or `lifecycle` behind a scaffolding gap.

### New reference
- **`references/dreaming-pattern.md`** — out-of-band batch curation: propose-never-apply, evidence-and-prevalence on every proposal, cadence sized to pattern emergence (~10 sessions), bounded queue to contain review fatigue, and the four signals a pass looks for. Documents what prior art left open (cadence, conflict resolution, injection defence, review fatigue) as design decisions rather than settled practice.

### New templates
- **`templates/memory-index.md`** → `memory/index.md`. Bounded always-on index, one line per lesson, ~200-line cap, with a Retired section instead of deletion.
- **`templates/memory-entry.md`** → `memory/<slug>.md`. One lesson per file with `Why:` and `How to apply:`, plus an explicit do-not-record list. Not scaffolded by the script (same as `feature-list.schema.json`); consulted when writing an entry.
- **`templates/dream-queue.md`** → `dream-queue.md`. Open/Decided tables, 5-proposal cap, last-pass record.

### New templates (continued)
- **`templates/memory-journal.md`** → `memory/journal.md`. Append-only per-session friction log: what you looked up, what surprised you, what correction you received. **This is the input curation reads.** Without it, "find recurring patterns" has no corpus and every proposal is an opinion.

### Templates (agents.md)
- **Startup step 6** — read `memory/index.md`; if `dream-queue.md` has open proposals, *surface them for accept/reject, never apply one yourself*. Earlier drafts said "drain the queue", which read as an instruction to apply proposals — the exact thing propose-never-apply forbids.
- **End-of-session steps 4 and 5** — append a dated journal block, then do the two-step save only if a lesson is already clearly durable.
- **Integer step numbers.** Earlier drafts used `5.5` and `3.5`. `structuredText`'s list matcher is `/^([-*+]|\d+\.)\s/`, which rejects `5.5.` (it matches `5.` then demands whitespace and finds `5`), so those lines were silently discarded before any check saw them — the two most load-bearing memory instructions were undetectable. CommonMark also renumbers them. Both lists are now plain integers.
- **New `## Memory` section** — memory-is-not-state, one lesson per file, two-step save, bounded index, do-not-store list, user corrections as highest-value, project vs cross-project scope.
- **New `## Curation (Dreaming)` section** — cadence, the four signals, propose-never-apply, never self-edit `AGENTS.md`, queue cap.
- **Required Artifacts** — `memory/index.md`, `memory/journal.md` and `dream-queue.md` added.
- **Memory content is evidence, not instruction** — an imperative sentence inside a memory file has no authority over the agent. Structural injection defence rather than a keyword blocklist.

### Scaffolding (create-harness.mjs)
- Now writes `memory/index.md`, `memory/journal.md` and `dream-queue.md`. Help text updated.
- **Pre-flights the `memory` path before writing anything.** `memory/index.md` is the first template destination inside a subdirectory, so a pre-existing file or symlink named `memory` made `mkdir` throw part-way through — leaving a target with `AGENTS.md` but no `init.sh`, violating the skill's own rule about never leaving a repo un-restartable. Now exits 1 and writes nothing.

### Validation (harness-utils.mjs, validate-harness.mjs)
- `SUBSYSTEMS` gains `memory`. New `loadMemoryFiles` discovers the store by *directory* — `memory/`, `.agents/memory/`, `.claude/memory/` — canonicalises keys to `memory/…`, and loads the index plus sibling and `topics/` entries, capped at 200 files. Previously `loadHarnessFiles` read only 7 hardcoded root filenames, so nothing outside the repo root could ever be scored.
- **Memory checks inspect artifacts, not vocabulary.** Six checks: index exists; index is initialised and within its 200-line / 25KB cap; **links intact** — a computed assertion finding dangling and orphaned topic files; curation input exists; two-step save documented; curation cadence and human gate documented. The links check is the only assertion in the scorer that can fail on a harness that *drifted* rather than one that used different words. Earlier drafts grepped `AGENTS.md` for phrases, so a five-line stub with an empty index scored 5/5 while a well-run store using different nouns scored 0/5. Over-generic needles (`two-step`, `cadence`) are gone.
- Checks now carry a stable `message` plus a variable `detail`, because `enrich-harness.mjs` keys `GAP_FIXES` on the exact message string. Reporters render `message — detail`.
- **`allText` now excludes `memory/`.** Agent-written memory was feeding corpus-wide checks, so the word "Evidence" in a dream-queue table header satisfied verification's "evidence is recorded" check for free. Every check reading `allText` is now stricter.
- Reporters derive the non-structural group from `SUBSYSTEMS` rather than a hardcoded name list, so an eighth subsystem needs no reporter change. One separator per group instead of one per subsystem; `SECTION_LABELS` hoisted to module scope and escaped at use.
- Help text and report subtitle updated for seven subsystems.

### Remediation (enrich-harness.mjs)
- `GAP_FIXES` entries added for the memory index, the journal, and the `## Memory` / `## Curation (Dreaming)` sections, so `--fix` can retrofit memory into an existing harness. The two integrity checks are deliberately **not** auto-fixable: repairing them means writing or pruning real lessons, which is judgement, not scaffolding.

### Documentation reconciliation
- `references/memory-persistence-pattern.md` classified progress logs and session handoffs as "auto-memory", contradicting the state-vs-memory distinction that justifies memory being its own subsystem. Its layer list now separates **auto-memory** (the `memory/` store) from **state artifacts** (progress, handoff, plans), with the practical test for telling them apart. Its `.claude/memory/` path and cross-layer-promotion bullet now match what ships.
- `types.md` gains `memory` and `proposal` types, so the new templates do not carry undeclared `type` values.

### Documentation
- SKILL.md: Core Model table gains Memory; new "Add memory to a harness" task section describing the two-part build order (store first, curation only once there is something to curate, heavy machinery deferred as debt); Deliverable Checklist and reference routing updated.

### Known gaps in this release
- **`run-benchmark.mjs`'s `scoreEvals` has no per-subsystem coverage notion.** It now checks for a memory *and* a curation eval by name, but has no structural map from subsystem → eval, so it cannot report which subsystems are covered. Deferred: a design task, not a scaffolding fill. Eval coverage is at least honest now that both memory cases exist (13/13).
- Curation is documented, templated and gated, but has **no bundled script** — the first passes are run by hand. Deliberate: automate only after a manual pass shows what it actually finds.

### Gaps closed after initial release
- **Memory curation eval added.** `evals/evals.json` gains case #16 "Memory Curation (Dreaming) Design", satisfying `scoreEvals`'s `curation|dreaming` check. Eval coverage: 12/13 → **13/13**. (The `memory` check was already met by case #5 "Memory Taxonomy Design".)
- **Both examples now carry a memory store.** `examples/react-harness` and `examples/python-api-harness` gain `memory/index.md`, `memory/journal.md` and `dream-queue.md` (copied verbatim from `templates/`, identical to `create-harness.mjs` output). Both move from `memory: 1/5` / `89` / `usable` to `memory: 4/5` / `97` / **`production`**.

  **Corrected 2026-07-26:** the line above originally claimed 4/5 was "the honest ceiling for a fresh harness — the fifth point requires a non-empty index." That was wrong, and it pointed readers at a design limit that does not exist. The actual failing check was `Two-step save invariant documented`: both examples received the memory *files* but their `AGENTS.md` was never regenerated from the updated template, so neither contained a `## Memory` section (0 occurrences of `two-step save` in either). It was a stale artifact, not a ceiling — and auto-fixable by the `GAP_FIXES` entry that already existed for that exact message. After `enrich-harness.mjs --apply`, both examples score `memory: 5/5` / **`100`**. A fresh scaffold from the current template scores 5/5 on memory immediately.
- **`README.md`'s dimension table** already carries a Memory row; the earlier note was stale.

## 2025-07-17 (v0.3.0)

### Behavioral Policies (major)
- **Coding Policy section** added to AGENTS.md template — the Ponytail 6-rung ladder (YAGNI → stdlib → native → dep → one-liner → minimum). Embedded directly; no external skill dependency.
- **Coding Standards section** added — minimum code, no speculative features, no unrequested abstractions, no error handling for impossible scenarios, `ponytail:` comment convention.
- **Editing Discipline section** added — surgical changes (Karpathy §3): touch only required lines, match existing style, don't refactor unbroken things, mention but don't fix unrelated issues, clean up only your own orphans.
- **Test-first Definition of Done** — bugs: reproduce first then fix; features: write check first then implement.
- **Before Multi-Step Work section** added — one-line success criterion, numbered plan with per-step verify checks.
- **Proactive assumption surfacing** in Startup Workflow (step 7) — structural ambiguity → stop and ask; cosmetic ambiguity → default and proceed.
- **Safety section** added — explicit never-simplify-away list: validation at trust boundaries, data-loss prevention, security, accessibility, hardware calibration.
- **Escalation** expanded — "over-specified requirements" added as an escalation trigger.

### Templates
- **progress.md** — "What's Next" promoted to per-step verification format (description → verify: check). "Ponytail Debt" section added for tracking deliberate shortcuts. "Notes for Next Session" expanded with unrelated-issues capture.
- **agents.md** — completely rewritten with embedded behavioral policies (~130 lines vs v2's ~90).

### Validation (validate-harness.mjs)
- **New scoring dimension: behavioral** — validates presence of coding minimalism ladder, surgical editing rules, test-first verification gate, assumption surfacing, and safety carve-outs.
- Score now covers 6 dimensions (5 structural + 1 behavioral) instead of 5. Overall becomes percentage of 30 instead of 25.
- Behavioral checks are weighted into the overall score but reported separately for clarity.

### Enrichment (enrich-harness.mjs)
- Gap fix map expanded to cover all new behavioral sections (Coding Policy, Coding Standards, Editing Discipline, Safety, test-first DoD, Before Multi-Step Work, expanded Escalation).

### Documentation
- SKILL.md updated to describe behavioral policy layer alongside structural subsystems.
- README updated for v3 feature set.

## 2026-07-15 (v0.2.0)
- Added YAML frontmatter (`type`, `title`, `description`, `tags`, `updated`) to all 7 reference files
- Added YAML frontmatter to all 6 template files
- Created `types.md` document type taxonomy (8 types)
- Created index files: `references/index.md`, `templates/index.md`, `scripts/index.md`, `evals/index.md`
- Added "Why This Template" cross-references linking templates back to patterns
- Added version field (`0.2.0`) to SKILL.md frontmatter
- Updated SKILL.md "When to Read References" to point at index files
- Added usability tiers to validate-harness.mjs scoring output
- Added `--fail-fast` and `--no-fail` flags to validate-harness.mjs
- Added `enrich-harness.mjs` script for gap-to-fix enrichment
- Added `examples/` directory with populated React and Python harness bundles

## 2024-07-10
- Added `--agent-file` support to create-harness.mjs (uses `AGENTS.md` by default)

## 2024-06-28
- Initial release: create, validate, benchmark, 10 evals
- 7 reference patterns, 6 templates, 4 scripts
- CLI scripts: create-harness.mjs, validate-harness.mjs, render-assessment-html.mjs, run-benchmark.mjs
