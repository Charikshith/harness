---
type: index
title: "References Index"
description: "Table of contents for references/ — patterns and reference material for harness engineering"
tags: [index, references, patterns]
timestamp: 2026-07-15
---

# References Index

Start here. Match type and tags to find the right document without opening every file.

| Document | Type | Tags | Summary |
|---|---|---|---|
| [memory-persistence-pattern.md](memory-persistence-pattern.md) | pattern | memory, persistence, state, handoff, session-continuity | Layered memory architecture with two-step saves, local-override priority, and index/topic separation |
| [context-engineering-pattern.md](context-engineering-pattern.md) | pattern | context, budget, tokens, progressive-disclosure, compression, isolation | SELECT/WRITE/COMPRESS/ISOLATE operations, progressive disclosure, memoized context builders |
| [tool-registry-pattern.md](tool-registry-pattern.md) | pattern | tools, safety, permissions, concurrency, registry, audit | Fail-closed registry with per-call concurrency classification and multi-source permission pipeline |
| [multi-agent-pattern.md](multi-agent-pattern.md) | pattern | multi-agent, delegation, coordination, fork, swarm, parallelism | Coordinator/fork/swarm delegation patterns, context inheritance rules, recursive fork prevention |
| [lifecycle-bootstrap-pattern.md](lifecycle-bootstrap-pattern.md) | pattern | lifecycle, bootstrap, hooks, startup, trust, initialization | Dependency-ordered init with trust gates, hook dispatch, two-phase eviction for long-running tasks |
| [skill-runtime-pattern.md](skill-runtime-pattern.md) | pattern | skills, packaging, reuse, runtime, progressive-disclosure | What belongs in a skill vs what stays in the project; skill shape and design rules |
| [gotchas.md](gotchas.md) | reference | gotchas, failure-modes, debugging, anti-patterns, troubleshooting | 15 non-obvious failure modes with symptoms, causes, and fixes |
