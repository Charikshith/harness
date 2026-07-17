---
name: harness-creator-v3
version: "0.3.0"
description: >-
  Build, audit, and improve harnesses that make AI coding agents reliable: AGENTS.md/CLAUDE.md
  instruction files, feature/state tracking, verification gates, scope boundaries, session
  handoff, memory persistence, context budgets, tool-permission safety, and multi-agent
  coordination. Now includes embedded behavioral policies: Ponytail ladder (simplicity-first
  coding), surgical editing discipline, test-first verification, proactive assumption
  surfacing, and safety carve-outs. Use this whenever a coding agent is unreliable across
  sessions — forgets context, drifts out of scope, claims "done" before tests pass, pads diffs
  with unrelated changes, over-builds features, or starts each session inconsistently —
  or when creating or assessing AGENTS.md, CLAUDE.md, feature_list.json, init.sh, progress.md,
  or session-handoff files. Reach for it even if the user never says the word "harness."
license: MIT
---

# Harness Creator v3

Use this skill to make a repository easier for coding agents to start, stay in scope, verify work, and resume across sessions. Keep the harness small enough that agents actually follow it.

**New in v3:** Embedded behavioral policies. The generated AGENTS.md now includes a
Coding Policy (the Ponytail ladder), Coding Standards, Editing Discipline (surgical
changes), test-first Definition of Done, proactive assumption surfacing, and safety
carve-outs. Validation scores these behavioral subsystems alongside the five structural
subsystems. See [CHANGELOG.md](CHANGELOG.md) for the full list.

Not for model selection, prompt tuning in isolation, chat UI design, or general app architecture.

## Core Model

Every useful coding-agent harness has five structural subsystems plus behavioral policies:

| Subsystem | Minimal artifact | Purpose |
|---|---|---|
| Instructions | `AGENTS.md` or `CLAUDE.md` | Startup path, working rules, definition of done |
| State | `feature_list.json`, `progress.md` | Current feature, status, evidence, next step |
| Verification | `init.sh` or documented commands | Tests/checks the agent must run before claiming done |
| Scope | Feature dependencies and done criteria | Prevents overreach and half-finished work |
| Lifecycle | `session-handoff.md`, end-of-session routine | Makes the next session restartable |
| **Behavioral** | Embedded in AGENTS.md | Coding policy, surgical editing, test-first, safety |

## First Move

1. Inspect what already exists: instruction files, feature/state files, verification commands, docs, package manifests.
2. Ask only for missing context that cannot be inferred safely: target agent, desired file name, tolerance for structure, and whether overwriting is allowed.
3. Prefer a minimal harness first. Add memory, tool safety, multi-agent, or benchmark details only when the user's problem calls for them.

## Common Tasks

### Create a harness

Use the bundled script when working on a local repository:

```bash
node version-3/scripts/create-harness.mjs --target /path/to/project
```

Options:

- `--agent-file CLAUDE.md` for Claude-oriented projects.
- `--package-manager npm|pnpm|yarn|bun` when detection is wrong.
- `--commands "cmd one,cmd two"` for custom verification.
- `--force` only after confirming overwrites are acceptable.

Then explain what was created and how the user should replace placeholder feature entries.
The generated AGENTS.md includes embedded behavioral policies (coding ladder, surgical
editing, test-first verification, safety carve-outs) — no external skill dependency required.
For advanced features (intensity levels, debt tracking, review/audit), install the Ponytail skill separately.

### Audit an existing harness

Run:

```bash
node version-3/scripts/validate-harness.mjs --target /path/to/project
```

Report the five structural subsystem scores, the behavioral policy score, the lowest-scoring area, and the first 2-3 changes that would improve reliability. Treat the lowest score as a candidate bottleneck; confirm with failures, logs, or task outcomes before claiming causality.

**v3 scoring:** In addition to structural scores (instructions, state, verification, scope, lifecycle), validation now checks for behavioral policy presence: coding minimalism (Ponytail ladder), surgical editing discipline, test-first verification gates, assumption surfacing, and safety carve-outs.

### Produce a report

Use when the user wants a shareable assessment:

```bash
node version-3/scripts/render-assessment-html.mjs --target /path/to/project
node version-3/scripts/run-benchmark.mjs --target /path/to/project --html /path/to/report.html
```

Be clear that this is a structural benchmark. The benchmark first runs a self-check — it scaffolds a throwaway harness and validates it, proving the bundled scripts work end-to-end — then scores the target and eval coverage. Real effectiveness still needs before/after agent sessions on representative tasks.

## When to Read References

Start with [references/index.md](references/index.md) for a discoverable table of contents.
Each entry includes type, tags, and a one-line summary so you can route without opening every file.

Load only the reference needed for the user's problem:

- Memory across sessions: [Memory Persistence](references/memory-persistence-pattern.md)
- Reusable workflows as skills: [Skill Runtime](references/skill-runtime-pattern.md)
- Permissions, tools, concurrency: [Tool Registry & Safety](references/tool-registry-pattern.md)
- Context budget and progressive disclosure: [Context Engineering](references/context-engineering-pattern.md)
- Delegation and parallel agents: [Multi-Agent Coordination](references/multi-agent-pattern.md)
- Hooks, startup, long-running work: [Lifecycle & Bootstrap](references/lifecycle-bootstrap-pattern.md)
- Non-obvious failure modes: [Gotchas](references/gotchas.md)

See also: [types.md](types.md) for the document type taxonomy, [templates/index.md](templates/index.md) for available templates, [scripts/index.md](scripts/index.md) for script documentation.

## Design Rules

- Keep the root instruction file short: routing and invariants, not a full manual.
- **Embed behavioral policies directly** — coding ladder, surgical editing, test-first, safety.
  The agent should follow them without needing external skills installed.
- Put project facts in project docs, not in the skill.
- Make verification commands explicit and runnable.
- Require evidence before marking a feature done.
- Use one active feature unless the harness has explicit multi-agent ownership boundaries.
- Prefer append/update state files over relying on chat history.
- Never hide destructive behavior in scripts; overwrites require explicit user approval.

## Deliverable Checklist

For a usable minimal harness, leave the target project with:

- [ ] `AGENTS.md` or `CLAUDE.md` (includes behavioral policies)
- [ ] `feature_list.json`
- [ ] `progress.md`
- [ ] `init.sh`
- [ ] Optional `session-handoff.md` for multi-session work
- [ ] Documented verification evidence or next action

If you cannot create files, provide exact file contents and commands instead.
