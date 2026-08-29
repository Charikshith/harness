---
type: index
title: "Templates Index"
description: "Table of contents for templates/ — copyable artifacts that are instantiated into target projects"
tags: [index, templates]
updated: 2026-07-26
---

# Templates Index

Start here. Match artifact name to find the right template.

| Document | Type | Artifact | Tags | Summary |
|---|---|---|---|---|
| [agents.md](agents.md) | template | AGENTS.md or CLAUDE.md | instructions, startup, workflow, done-definition, scope | Startup workflow, working rules, definition of done, end-of-session procedure |
| [feature-list.json](feature-list.json) | template | harness/feature_list.json | state, features, tracking, dependencies | Feature state tracker with id, name, description, status, and evidence fields |
| [feature-list.schema.json](feature-list.schema.json) | template | harness/feature_list.schema.json | state, schema, validation, features | JSON Schema for validating feature_list.json structure |
| [init.sh](init.sh) | template | init.sh | verification, init, bootstrap, startup, ci | Auto-detecting verification entrypoint for Node/Python/Go/Rust/Java/.NET |
| [progress.md](progress.md) | template | harness/progress.md | state, progress, continuity, session, tracking, handoff | Session log: current state, done/in-progress/next, blockers, decisions, files changed, recommended next step |
| [memory-index.md](memory-index.md) | template | harness/memory/index.md | memory, index, progressive-disclosure, learning | Bounded always-on index of agent-written lessons; one line per topic file |
| [memory-journal.md](memory-journal.md) | template | harness/memory/journal.md | memory, journal, append-only, curation, evidence | Append-only per-session friction log; the raw corpus curation reads |
| [memory-entry.md](memory-entry.md) | template | harness/memory/&lt;slug&gt;.md | memory, learning, lesson, entry | Shape of a single lesson: scope, source, the rule, Why, How to apply |
| [memory-graveyard.md](memory-graveyard.md) | memory | harness/memory/graveyard.md | memory, graveyard, negative-knowledge, recheck | Routes tried and rejected, each with a mandatory expiry condition. Not a lesson store, not index-linked |
| [dream-queue.md](dream-queue.md) | template | harness/dream-queue.md | memory, dreaming, curation, review, human-gate | Bounded queue of curation proposals with evidence and prevalence, awaiting human decision |
| [environment.md](environment.md) | template | harness/environment.md | verification, environment, preconditions, tools, contract | Declared external preconditions checked by init.sh separately from the project's own tests. Optional; not auto-scaffolded |
| [open-work.md](open-work.md) | template | harness/open-work.md | scope, recruitment, backlog, multi-agent | Work seen but declined under scope discipline, with reason codes; recruitable by a later session |
