---
type: index
title: "Scripts Index"
description: "Table of contents for scripts/ — executable helpers for harness creation, validation, and benchmarking"
tags: [index, scripts]
updated: 2026-07-27
---

# Scripts Index

Start here. All scripts use Node.js built-in modules only — zero dependencies.

| Document | Type | Tags | Summary |
|---|---|---|---|
| [create-harness.mjs](create-harness.mjs) | script | scaffold, create, harness, bootstrap | Scaffolds AGENTS.md, CLAUDE.md and init.sh at the project root; feature_list.json, progress.md, memory/, dream-queue.md and open-work.md under harness/ |
| [validate-harness.mjs](validate-harness.mjs) | script | validate, audit, score, assessment | Scores seven subsystems (instructions, state, verification, scope, lifecycle, memory, behavioral). `--mutate` additionally measures whether the gate catches breakage |
| [mutate-gate.mjs](mutate-gate.mjs) | script | mutation, adversary, verification, gate | Breaks the project or init.sh in known ways and reports what went unnoticed. Both probe types scored |
| [enrich-harness.mjs](enrich-harness.mjs) | script | enrich, retrofit, gaps, fixes | Retrofits a harness that already exists: creates missing files from templates and splices missing sections into the right place in files already present. `--apply` writes; default is a dry run |
| [curate-memory.mjs](curate-memory.mjs) | script | memory, curation, dreaming, proposals | Out-of-band curation pass: counts the two countable signals, prints the three that need judgement, writes proposals to harness/dream-queue.md only |
| [render-assessment-html.mjs](render-assessment-html.mjs) | script | render, html, report, assessment | Renders harness assessment as a standalone HTML file |
| [run-benchmark.mjs](run-benchmark.mjs) | script | benchmark, self-check, eval, report | Full benchmark: self-check → harness score → eval coverage → recommendation |
| [insert-anchor.test.mjs](insert-anchor.test.mjs) | test | test, self-check, insertion, markdown | Self-check for `insertAtAnchor()` — 7 assert-based cases, no framework. Every case is a bug that shipped. Run by `./init.sh` |
| [index-coverage.test.mjs](index-coverage.test.mjs) | test | test, self-check, index, drift | Self-check that every `index.md` lists every file beside it, links nothing missing, matches `evals.json`, and that the documented score denominator matches `SUBSYSTEMS`. Run by `./init.sh` |
| [lib/harness-utils.mjs](lib/harness-utils.mjs) | script | library, utilities, shared, scoring | Shared utilities: layout resolution, harness scoring, markdown-aware insertion, file ops, HTML rendering, arg parsing |
