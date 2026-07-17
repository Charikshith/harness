---
type: template
title: "AGENTS.md / CLAUDE.md Template"
description: "Startup workflow, coding policy (Ponytail ladder), coding standards, editing discipline (surgical changes), working rules, definition of done (test-first), multi-step planning, end-of-session procedure, safety carve-outs, verification commands, and escalation"
artifact: "AGENTS.md or CLAUDE.md"
tags: [instructions, startup, workflow, done-definition, scope, coding-policy, simplicity, surgical-editing, safety, behavioral]
---

# {{AGENT_FILE_NAME}}

{{PROJECT_PURPOSE}}

> **Why this structure**: This template instantiates patterns from:
> - [Lifecycle & Bootstrap](../references/lifecycle-bootstrap-pattern.md) — startup workflow, end-of-session routine, trust gates
> - [Memory Persistence](../references/memory-persistence-pattern.md) — progress.md as a session continuity artifact, two-step updates
> - [Tool Registry & Safety](../references/tool-registry-pattern.md) — verification commands as a safety gate before claiming done
> - [Context Engineering](../references/context-engineering-pattern.md) — progressive disclosure of project docs before code editing
>
> Behavioral policies are embedded directly (no external dependency required):
> - **Coding Policy** — the Ponytail ladder: YAGNI → stdlib → native → dep → one-liner → minimum. Install the full Ponytail skill for intensity levels (lite/full/ultra) and debt tracking (`/ponytail-debt`).
> - **Editing Discipline** — surgical changes (Karpathy §3): touch only what the feature requires, match existing style, don't "improve" adjacent code.
> - **Definition of Done** — test-first ordering (Karpathy §4): for bugs, reproduce first; for features, write the check first.
>
> See [templates/index.md](index.md) for all available templates.

## Startup Workflow

Before writing code:

1. **Confirm working directory** with `pwd`
2. **Read this file** completely
3. **Read project docs if present** (`docs/ARCHITECTURE.md`, `docs/PRODUCT.md`, README, or equivalent)
4. **Run `./init.sh`** to verify environment is healthy
5. **Read `feature_list.json`** to see current feature state
6. **Review recent commits** with `git log --oneline -5`
7. **State your understanding**: In one line, what the task requires.
   If multiple interpretations exist, name them. If the ambiguity is structural
   (architecture, data model, security boundary, multi-module interaction),
   **stop and ask** — the cost of the wrong answer exceeds the round-trip.
   If the ambiguity is cosmetic or the safe default is clear, proceed and name
   your assumption.

If baseline verification is failing, repair that first before adding new scope.

## Coding Policy

Before writing any code, stop at the first rung that holds:

1. **Does this need to exist at all?** Speculative need = skip it. (YAGNI)
2. **Does the standard library already do this?** Use it.
3. **Does a native platform feature cover it?** `<input type="date">` over a
   picker lib, CSS over JS, DB constraint over app code.
4. **Does an already-installed dependency solve it?** Use it. Never add a new
   dependency for what a few lines can do.
5. **Can this be one line?** Make it one line.
6. **Only then:** write the minimum code that works.

The ladder is a reflex, not a research project. Two rungs work → take the
higher one and move on. The first lazy solution that works is the right one.

## Coding Standards

- Write the **minimum code** that solves the problem. Nothing speculative.
- No abstractions that weren't requested. No interface with one implementation.
  No factory for one product. No config for a value that never changes.
- No unrequested "flexibility" or "configurability." No scaffolding "for later" —
  later can scaffold for itself.
- No error handling for scenarios the code structure makes **impossible**
  (a dict key you just set 3 lines up doesn't need a KeyError handler).
- Deletion over addition. Boring over clever. Fewest files possible.
- Two stdlib options, same size? Pick the one that's correct on edge cases.
- Mark deliberate simplifications: `// ponytail: O(n²) scan, upgrade to index if >10k rows`
- Non-trivial logic leaves ONE runnable check (assert-based demo or small test).
  Trivial one-liners need no test. No frameworks, no fixtures.

## Editing Discipline

- **Touch only what the feature requires.** Do not "improve" or reformat adjacent
  code, comments, or whitespace — even when they could be better.
- **Match the existing style.** Consistency beats your preference.
- **Don't refactor things that aren't broken.** The diff's best outcome is getting shorter.
- **If you notice unrelated dead code or issues**, mention them in `progress.md` —
  don't fix them in this diff.
- **Remove only the imports, variables, or functions that YOUR changes made unused.**
  Do NOT remove pre-existing dead code unless asked.
- **The test:** Every changed line should trace directly to the feature in
  `feature_list.json`.

## Working Rules

- **One feature at a time**: Pick exactly one unfinished feature from `feature_list.json`
- **Verification required**: Don't claim done without running verification commands
- **Update artifacts**: Before ending session, update `progress.md` and `feature_list.json`
- **Stay in scope**: Don't modify files unrelated to the current feature
- **Leave clean state**: Next session must be able to run `./init.sh` immediately

## Required Artifacts

- `feature_list.json` — Feature state tracker (source of truth)
- `progress.md` — Session continuity log
- `init.sh` — Standard startup and verification path
- `session-handoff.md` — Optional, for larger sessions

## Before Multi-Step Work

State a **one-line success criterion**. If the task spans more than 2 files or
3 logical steps, add a numbered plan with a verify check per step:

```
1. [Step] → verify: [specific check]
2. [Step] → verify: [specific check]
3. [Step] → verify: [specific check]
```

For bugs: write a reproduction test FIRST, then make it pass.
For features: write the verification check FIRST, then implement.

One-liners and trivial changes skip this — the task itself is the criterion.

## Definition of Done

A feature is done only when ALL of the following are true:

- [ ] Target behavior is implemented
- [ ] For bugs: a reproduction test was written FIRST, then made to pass
- [ ] For features: a verification check was written FIRST, then the code
- [ ] Required verification actually ran and passed (tests / lint / type-check)
- [ ] Evidence recorded in `feature_list.json` or `progress.md`
- [ ] Repository remains restartable from standard startup path

## End of Session

Before ending a session:

1. Update `progress.md` with current state
2. Update `feature_list.json` with new feature status
3. Record any unresolved risks or blockers
4. Commit with descriptive message once work is in safe state
5. Leave repo clean enough for next session to run `./init.sh` immediately

## Safety (Never Simplify Away)

- Input validation at trust boundaries
- Error handling that prevents data loss
- Security measures
- Accessibility basics
- Hardware calibration (a real clock drifts, a sensor reads off — the platform is
  never the spec ideal)
- Anything the user explicitly asked to keep

## Verification Commands

```bash
# Full verification (recommended)
{{PRIMARY_VERIFICATION_COMMAND}}
```

Required checks:
{{VERIFICATION_COMMANDS}}

## Escalation

If you encounter:
- **Architecture decisions**: Consult project architecture docs if present, otherwise ask user
- **Unclear or over-specified requirements**: Check product/requirements docs if present,
  otherwise ask user. Question whether the spec itself is over-specified.
- **Repeated test failures**: Update progress, flag for human review
- **Scope ambiguity**: Re-read `feature_list.json` for definition of done
