---
type: index
title: "Scripts Index"
description: "Table of contents for scripts/ — executable helpers for harness creation, validation, and benchmarking"
tags: [index, scripts]
updated: 2026-07-15
---

# Scripts Index

Start here. All scripts use Node.js built-in modules only — zero dependencies.

| Document | Type | Tags | Summary |
|---|---|---|---|
| [create-harness.mjs](create-harness.mjs) | script | scaffold, create, harness, bootstrap | Scaffolds AGENTS.md, feature_list.json, progress.md, init.sh, session-handoff.md, memory/, dream-queue.md |
| [validate-harness.mjs](validate-harness.mjs) | script | validate, audit, score, assessment | Scores seven subsystems (instructions, state, verification, scope, lifecycle, memory, behavioral). `--mutate` additionally measures whether the gate catches breakage |
| [mutate-gate.mjs](mutate-gate.mjs) | script | mutation, adversary, verification, gate | Breaks the project or init.sh in known ways and reports what went unnoticed. Both probe types scored |
| [curate-memory.mjs](curate-memory.mjs) | script | memory, curation, dreaming, proposals | Out-of-band curation pass: counts the two countable signals, prints the three that need judgement, writes proposals to dream-queue.md only |
| [render-assessment-html.mjs](render-assessment-html.mjs) | script | render, html, report, assessment | Renders harness assessment as a standalone HTML file |
| [run-benchmark.mjs](run-benchmark.mjs) | script | benchmark, self-check, eval, report | Full benchmark: self-check → harness score → eval coverage → recommendation |
| [lib/harness-utils.mjs](lib/harness-utils.mjs) | script | library, utilities, shared, scoring | Shared utilities: harness scoring, file ops, HTML rendering, arg parsing |
