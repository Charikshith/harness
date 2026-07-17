---
type: changelog
title: "Changelog"
description: "Reverse-chronological history of changes to the harness-creator skill"
tags: [changelog, history, releases]
updated: 2025-07-17
---

# Changelog

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
