---
type: index
title: "Evals Index"
description: "Table of contents for evals/ — test cases for measuring agent behavior against harness patterns"
tags: [index, evals, tests]
updated: 2026-07-27
---

# Evals Index

Start here. Each eval case has a prompt, expected output, and 3+ expectation checks.

| # | Name | Tags | Summary |
|---|---|---|---|
| 1 | Minimal Harness Creation | creation, minimal | TypeScript+React project: create AGENTS.md and init.sh at the root, harness/feature_list.json |
| 2 | Session Continuity Setup | session, continuity, handoff | harness/progress.md (end-of-session handoff), harness/memory/ setup |
| 3 | Harness Assessment | assessment, scoring | Five-subsystem assessment with bottleneck identification |
| 4 | Verification Workflow Design | verification, done-definition | Verification commands, Definition of Done, evidence recording |
| 5 | Memory Taxonomy Design | memory, taxonomy | Instruction memory, auto-memory, type taxonomy, save conventions |
| 6 | Tool Safety Design | tools, safety, permissions | Tool registry, concurrency classification, audit trail |
| 7 | Context Budget Plan | context, budget, tokens | Progressive disclosure, SELECT/WRITE/COMPRESS/ISOLATE, hard caps |
| 8 | Multi-Agent Coordination | multi-agent, delegation | Coordinator/fork/swarm, ownership boundaries, integration gates |
| 9 | Lifecycle Bootstrap | lifecycle, bootstrap, hooks | init.sh, clean-state checks, handoff reads, hook trust boundaries |
| 10 | Scripted Harness Validation | scripts, validation, benchmark | create-harness.mjs, validate-harness.mjs, render-assessment-html.mjs |
| 11 | Behavioral Policy — Coding Minimalism | behavioral, ponytail, yagni | The 6-rung ladder: YAGNI → stdlib → native → dep → one-liner → minimum |
| 12 | Behavioral Policy — Surgical Editing | behavioral, editing, diff | Touch only what the feature requires; match existing style; don't refactor the unbroken |
| 13 | Behavioral Policy — Safety Carve-Outs | behavioral, safety | What minimalism must never remove: validation, data-loss prevention, security, a11y |
| 14 | Behavioral Policy — Multi-Step Planning | behavioral, planning, verify | One-line success criterion, numbered plan with a verify check per step |
| 15 | Full v4 Harness with Behavioral Layer | creation, behavioral, full | Complete harness: all structural sections plus every behavioral policy |
| 16 | Memory Curation (Dreaming) Design | memory, curation, dreaming | Out-of-band curation: propose-never-apply, bounded queue, cadence, human gate |
| 17 | Negative Knowledge — Graveyard of Abandoned Routes | memory, graveyard, negative-knowledge | Rejected routes with observed cause, cost, and a mandatory expiry condition |
| 18 | Environment Contract for External Preconditions | verification, environment, preconditions | Preconditions checked before tests, so a broken machine reads differently from broken code |
| 19 | Verification Adversary — Mutation-Testing the Gate | verification, adversary, mutation | Prove the gate catches real breakage; reject unkillable probes and unpassable thresholds |

## Coverage

`run-benchmark.mjs`'s `scoreEvals` scores **named coverage**, not per-subsystem structure:
it asks whether a case name matches each expected topic. Two consequences worth knowing
before trusting the number:

- **Adding a case changes nothing on its own.** A topic with no corresponding check is
  invisible to the score. Cases 17–19 each needed a matching check added, or coverage would
  have kept printing the same figure.
- **The score is silent about topics nobody thought to check.** It reports 100/100 when
  every check it happens to contain passes — which is not the same as covering everything
  the skill now does. Before v0.3.2 it read 13/13 while three shipped features had no case
  at all; re-scored against the current check set, that same eval file is 13/16.
