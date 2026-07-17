---
type: changelog
title: "Changelog"
description: "Reverse-chronological history of changes to the harness-creator skill"
tags: [changelog, history, releases]
updated: 2026-07-18
---

# Changelog

## 2026-07-18 (v0.3.0)
- Added **Coding Policy — The Ladder** section to `templates/agents.md` (6-rung YAGNI algorithm standardized across Ponytail and Karpathy CLAUDE.md conventions)
- Added **Editing Discipline** section to `templates/agents.md` (surgical editing rules: touch-only-what's-needed, match-existing-style, mention-don't-fix out-of-scope issues)
- Added **Startup Workflow steps 7-8**: proactive assumption surfacing with complexity gate (structural vs cosmetic ambiguity) and Ponytail mode check
- Added **Before Multi-Step Work** section to `templates/agents.md` (success criteria + numbered plan with per-step verification)
- Added **Safety Carve-outs** to `templates/agents.md` (input validation, data-loss error handling, security, accessibility, hardware calibration)
- Added **Intensity Levels** table to `templates/agents.md` (lite/full/ultra — aligns with Ponytail's intensity model)
- Added **Deliberate Shortcuts** convention to `templates/agents.md` (`ponytail:` comment format with ceiling + upgrade trigger)
- Added **Trivial one-liner exemption** to Definition of Done
- Added **test-first ordering** to Definition of Done (reproduction test for bugs, verification check for features)
- Added **Unrelated Issues Noticed** section to `templates/progress.md` (out-of-scope issues noted for future sessions)
- Updated What's Next in `templates/progress.md` to use per-step verification format
- Updated SKILL.md description and First Move to reference Ponytail + Karpathy composition
- Updated Escalation:  over-specified requirements trigger added (ladder takes priority over feature description)
- Bumped version to `0.3.0`
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
