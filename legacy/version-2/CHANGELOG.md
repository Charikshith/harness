---
type: changelog
title: "Changelog"
description: "Reverse-chronological history of changes to the harness-creator skill"
tags: [changelog, history, releases]
updated: 2026-07-15
---

# Changelog

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
