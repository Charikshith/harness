---
type: template
title: "AGENTS.md / CLAUDE.md Template"
description: "Startup workflow, working rules, definition of done, end-of-session procedure, and verification commands for a coding-agent harness — with composable behavioral policy sections for Ponytail (code minimalism) and Karpathy CLAUDE.md (surgical editing, proactive surfacing)"
artifact: "AGENTS.md or CLAUDE.md"
tags: [instructions, startup, workflow, done-definition, scope, ponytail, karpathy, editing-discipline, code-minimalism]
---

# {{AGENT_FILE_NAME}}

{{PROJECT_PURPOSE}}

> **Why this structure**: This template instantiates patterns from:
> - [Lifecycle & Bootstrap](../references/lifecycle-bootstrap-pattern.md) — startup workflow, end-of-session routine, trust gates
> - [Memory Persistence](../references/memory-persistence-pattern.md) — progress.md as a session continuity artifact, two-step updates
> - [Tool Registry & Safety](../references/tool-registry-pattern.md) — verification commands as a safety gate before claiming done
> - [Context Engineering](../references/context-engineering-pattern.md) — progressive disclosure of project docs before code editing
>
> The **Coding Policy** and **Editing Discipline** sections compose with two optional behavioral policies:
> - **Ponytail** (code minimalism: the 6-rung ladder, intensities, debt tracking)
> - **Karpathy CLAUDE.md** (surgical editing, proactive assumption surfacing, test-first verification)
>
> These are inline defaults. If Ponytail is installed, its skill rules take precedence. If CLAUDE.md follows Karpathy's style, the Editing Discipline section is authoritative rather than advisory.
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
7. **State your understanding** of what you're being asked to do — in one line. If multiple interpretations exist, name them. If the ambiguity is structural (architecture, data model, security boundary, multi-module interaction), stop and ask before acting. If cosmetic (naming, formatting, equivalent approaches), default to the laziest option and proceed.
8. **If Ponytail is installed**, confirm current mode with `/ponytail status`. Default is `full` — the ladder is enforced.

If baseline verification is failing, repair that first before adding new scope.

## Coding Policy — The Ladder

For every feature or change, climb down before writing code:

1. **Does this need to exist?** (YAGNI) — If speculative need, skip it.
2. **Stdlib already does it?** — Use the standard library.
3. **Native platform feature covers it?** — HTML element, CSS property, OS API, browser API first.
4. **Installed dependency has it?** — Use what's already in the project.
5. **One line?** — If the implementation is a one-liner, write that.
6. **Minimum code that works.** — Write the shortest implementation that satisfies the requirement.

No speculative features. No abstractions for single-use code. No configurability for values that never change. No error handling for impossible scenarios.

**Safety carve-outs** — never simplify away:
- Input validation at trust boundaries
- Error handling that prevents data loss
- Security measures, authentication, authorization
- Accessibility
- Hardware calibration (real sensors drift, real clocks skew)
- Anything the user explicitly asked to keep

### Intensity Levels (Ponytail)

If Ponytail is installed, the user selects intensity. If not, default to `full`:

| Mode | Behavior |
|---|---|
| `lite` | Build what's asked. Name alternatives in one line. No debates. |
| `full` (default) | Apply the ladder. Question over-engineered specs. Ship the lazy version, question in the same response. |
| `ultra` | Full rules + aggressively challenge any requirement that looks over-built. Propose deletion over addition. |

### Deliberate Shortcuts

Mark deliberate shortcuts with a `ponytail:` comment:

```
// ponytail: <ceiling>, <upgrade trigger>
```

Example: `// ponytail: 100 users, when auth module is added`

## Editing Discipline

- **Touch only what the feature requires.** Don't improve adjacent code, comments, or formatting — even if they're wrong.
- **Match existing style**, even if you'd do it differently. Don't refactor things that aren't broken.
- **Mention unrelated issues** — don't fix them here. If you notice dead code, an unhandled edge case, or a refactoring opportunity outside scope, note it in `progress.md` under "Notes for Next Session."
- **Remove only what YOUR changes made unused** — imports, variables, functions. Don't delete unrelated dead code.

## Working Rules

- **One feature at a time**: Pick exactly one unfinished feature from `feature_list.json`
- **Verification required**: Don't claim done without running verification commands
- **Update artifacts**: Before ending session, update `progress.md` and `feature_list.json`
- **Stay in scope**: Don't modify files unrelated to the current feature. _Mentioning_ out-of-scope issues is allowed and encouraged; _modifying_ out-of-scope code is prohibited.
- **Leave clean state**: Next session must be able to run `./init.sh` immediately

## Required Artifacts

- `feature_list.json` — Feature state tracker (source of truth)
- `progress.md` — Session continuity log
- `init.sh` — Standard startup and verification path
- `session-handoff.md` — Optional, for larger sessions

## Before Multi-Step Work

If the task spans more than 2 files or 3 distinct steps, state a one-line success criterion and add a numbered plan with per-step verification:

```
1. [Step description] → verify: [specific check]
2. [Step description] → verify: [specific check]
```

Strong success criteria let you loop independently — you know when to stop without asking.

## Definition of Done

A feature is done only when ALL of the following are true:

- [ ] Target behavior is implemented
- [ ] For bugs: a reproduction test was written FIRST and now passes
- [ ] For non-trivial features: at least one verification check exists and was run
- [ ] Required verification actually ran (tests / lint / type-check)
- [ ] Evidence recorded in `feature_list.json` or `progress.md`
- [ ] Repository remains restartable from standard startup path

**Trivial one-liner exemption**: Single-line changes with no control flow (e.g., `const x = arr.filter(Boolean)`) need no dedicated test. Use judgment: if the change could silently break something, it's not trivial.

## End of Session

Before ending a session:

1. Update `progress.md` with current state
2. Update `feature_list.json` with new feature status
3. Record any unresolved risks or blockers
4. Commit with descriptive message once work is in safe state
5. Leave repo clean enough for next session to run `./init.sh` immediately

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
- **Unclear or over-specified requirements**: Check product/requirements docs if present. If the spec demands more code than the problem needs, question it — the Coding Policy ladder takes priority over feature description.
- **Repeated test failures**: Update progress, flag for human review
- **Scope ambiguity**: Re-read `feature_list.json` for definition of done
