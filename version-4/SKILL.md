---
name: harness
version: "0.4.1"
description: >-
  Build, audit, and improve harnesses that make AI coding agents reliable: AGENTS.md/CLAUDE.md
  instruction files, feature/state tracking, verification gates, scope boundaries,
  progress-log continuity (session handoff), memory persistence, context budgets, tool-permission safety, and multi-agent
  coordination. Now includes embedded behavioral policies: Ponytail ladder (simplicity-first
  coding), surgical editing discipline, test-first verification, proactive assumption
  surfacing, and safety carve-outs. Use this whenever a coding agent is unreliable across
  sessions — forgets context, drifts out of scope, claims "done" before tests pass, pads diffs
  with unrelated changes, over-builds features, or starts each session inconsistently —
  or when creating or assessing AGENTS.md, CLAUDE.md, init.sh, harness/feature_list.json, or harness/progress.md.
  Reach for it even if the user never says the word "harness."
license: MIT
---

# Harness

Use this skill to make a repository easier for coding agents to start, stay in scope, verify work, and resume across sessions. Keep the harness small enough that agents actually follow it.

**Since v0.3.0:** Embedded behavioral policies. The generated AGENTS.md now includes a
Coding Policy (the Ponytail ladder), Coding Standards, Editing Discipline (surgical
changes), test-first Definition of Done, proactive assumption surfacing, and safety
carve-outs. Validation scores these behavioral subsystems alongside the five structural
subsystems. See [CHANGELOG.md](CHANGELOG.md) for the full list.

Not for model selection, prompt tuning in isolation, chat UI design, or general app architecture.

## Core Model

Every useful coding-agent harness has five structural subsystems, a memory layer, and behavioral policies:

| Subsystem | Minimal artifact | Purpose |
|---|---|---|
| Instructions | `AGENTS.md` or `CLAUDE.md` | Startup path, working rules, definition of done |
| State | `harness/feature_list.json`, `harness/progress.md` | Current feature, status, evidence, next step |
| Verification | `init.sh` or documented commands | Tests/checks the agent must run before claiming done |
| Scope | Feature dependencies and done criteria | Prevents overreach and half-finished work |
| Lifecycle | `harness/progress.md` restart markers, end-of-session routine | Makes the next session restartable |
| **Memory** | `harness/memory/index.md`, `harness/dream-queue.md` | What was *learned*, and how it stays curated |
| **Behavioral** | Embedded in AGENTS.md | Coding policy, surgical editing, test-first, safety |

**Memory is not state.** `harness/progress.md` and `harness/feature_list.json` record *where the work
stopped* — a bookmark. Memory records *what is now known that wasn't before* — a lesson.
A harness can track state perfectly and never learn anything. That distinction is the
whole reason memory is its own subsystem.

## First Move

1. Inspect what already exists: instruction files, feature/state files, verification commands, docs, package manifests.
2. Ask only for missing context that cannot be inferred safely: target agent, desired file name, tolerance for structure, and whether overwriting is allowed.
3. Prefer a minimal harness first. Add memory, tool safety, multi-agent, or benchmark details only when the user's problem calls for them.

## Common Tasks

### Create a harness

Use the bundled script when working on a local repository:

```bash
node skills/harness/scripts/create-harness.mjs --target /path/to/project
```

Options:

- `--agent-file CLAUDE.md` for Claude-oriented projects.
- `--package-manager npm|pnpm|yarn|bun` when detection is wrong.
- `--commands "cmd one,cmd two"` for custom verification.
- `--force` only after confirming overwrites are acceptable.

Then report what was created and how the user should replace placeholder feature entries.

**Do not run validation automatically.** A freshly scaffolded harness scores by
construction, so auditing it unprompted only adds output the user did not ask for.
Stop after scaffolding and ask whether they want an audit next — run
`validate-harness.mjs` only if they say yes.

The generated AGENTS.md includes embedded behavioral policies (coding ladder, surgical
editing, test-first verification, safety carve-outs) — no external skill dependency required.
For advanced features (intensity levels, debt tracking, review/audit), install the Ponytail skill separately.

### Add memory to a harness

Memory has two halves, and they fail differently. Build them in order.

**Part 1 — the store (do this first).** Scaffold `harness/memory/index.md` and add the Memory
section to `AGENTS.md`: read the index at startup, append lessons at session end, one
lesson per file with a `Why:`, two-step save, bounded index. Then *use it and let it get
messy* for a few weeks. The mess is what tells you which curation rules are actually
needed.

**Part 2 — curation (only once the store is worth curating).** Add `harness/dream-queue.md` and
the Curation section. Run the first passes **by hand**: ask a session to read recent
progress entries plus all of `harness/memory/` and report what recurs, contradicts, or went
unused. That manual pass *is* dreaming. Automate only after seeing what it finds —
otherwise you encode rules for problems you don't have.

Do not lead with the heavy machinery (content hashing, compare-and-swap, signed
promotion, byte ceilings). Those solve contention between many concurrent writers and
hundreds of sessions. For a single operator they are premature; note them as debt with an
explicit upgrade trigger. See [Dreaming](references/dreaming-pattern.md) for the failure
modes worth designing against, and [Memory Persistence](references/memory-persistence-pattern.md)
for the store's layering rules.

### Audit an existing harness

Run:

```bash
node skills/harness/scripts/validate-harness.mjs --target /path/to/project
```

Report the five structural subsystem scores, the memory score, the behavioral policy score, the lowest-scoring area (plus anything on the `Also low:` line), and the first 2-3 changes that would improve reliability. Treat the lowest score as a candidate bottleneck; confirm with failures, logs, or task outcomes before claiming causality.

**Scoring, since v0.3.0:** In addition to structural scores (instructions, state, verification, scope, lifecycle), validation now checks for behavioral policy presence: coding minimalism (Ponytail ladder), surgical editing discipline, test-first verification gates, assumption surfacing, and safety carve-outs.

**Scoring, since v0.3.1:** A seventh subsystem, **memory**, is now scored: memory index present, memory routed from the instruction file, entry shape documented, two-step save invariant documented, and a curation cadence documented. The overall percentage is therefore out of 35 rather than 30 — **existing harnesses will score lower than they did before v0.3.1 until memory is added.** That drop is the finding, not a regression.

### Produce a report

Use when the user wants a shareable assessment:

```bash
node skills/harness/scripts/render-assessment-html.mjs --target /path/to/project
node skills/harness/scripts/run-benchmark.mjs --target /path/to/project --html /path/to/report.html
```

Be clear that this is a structural benchmark. The benchmark first runs a self-check — it scaffolds a throwaway harness and validates it, proving the bundled scripts work end-to-end — then scores the target and eval coverage. Real effectiveness still needs before/after agent sessions on representative tasks.

## When to Read References

Start with [references/index.md](references/index.md) for a discoverable table of contents.
Each entry includes type, tags, and a one-line summary so you can route without opening every file.

Load only the reference needed for the user's problem:

- Memory across sessions: [Memory Persistence](references/memory-persistence-pattern.md)
- Curating memory between sessions: [Dreaming](references/dreaming-pattern.md)
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

Only `AGENTS.md`, `CLAUDE.md` and `init.sh` belong in the project root — the first is the
convention other agent tools read from root, the second points at it, the third is invoked
as `./init.sh`. Everything else goes under `harness/`. Write every path relative to the
project root, in every file, including files that already live inside `harness/`.

- [ ] `AGENTS.md` or `CLAUDE.md` (includes behavioral policies + memory rules)
- [ ] `harness/feature_list.json`
- [ ] `harness/progress.md` (carries the end-of-session handoff: blockers, decisions, files, recommended next step)
- [ ] `harness/memory/index.md` (bounded index; empty is fine, absent is not)
- [ ] `harness/dream-queue.md`
- [ ] `init.sh`
- [ ] Documented verification evidence or next action

If you cannot create files, provide exact file contents and commands instead.
