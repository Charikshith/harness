# AGENTS.md

Project harness for reliable agent-assisted development in a TypeScript + React codebase.

> Behavioral policies are embedded: coding ladder, surgical editing, test-first verification, safety carve-outs.
> For advanced Ponytail features (intensity levels, debt tracking, review/audit), install the Ponytail skill separately.

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
   **stop and ask**. Otherwise default and proceed, naming your assumption.

8. **Write a scope boundary** (one line each):
   - **In scope:** the single feature/behavior the request names.
   - **Out of scope:** anything not named — extra modes, flags, commands, config,
     abstractions, or "while I'm here" improvements. If a change crosses this
     line, stop and ask before building it.
9. **Check Ponytail mode**: If the Ponytail skill is installed, confirm the
   current intensity level (`lite`, `full`, `ultra`). Default to `full` if unset.
   The level governs how aggressively the ladder is applied (see Coding Policy).

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

### Intensity Levels

If the Ponytail skill is installed, switch modes with `/ponytail lite|full|ultra`.
When the skill is not installed, default to **full**.

| Level | What changes |
|-------|-------------|
| **lite** | Build what's asked, but name the lazier alternative in one line. User picks. |
| **full** | The ladder enforced. Stdlib and native first. Shortest diff, shortest explanation. Default. |
| **ultra** | YAGNI extremist. Deletion before addition. Ship the one-liner and challenge the rest of the requirement in the same breath. |

## Coding Standards

- Write the **minimum code** that solves the problem. Nothing speculative.
- No abstractions that weren't requested. No interface with one implementation.
- No unrequested "flexibility" or "configurability." No scaffolding "for later."
- No error handling for scenarios the code structure makes impossible.
- Deletion over addition. Boring over clever. Fewest files possible.
- Mark deliberate simplifications: `// ponytail: O(n²) scan, upgrade to index if >10k rows`
- Non-trivial logic leaves ONE runnable check. Trivial one-liners need no test.

## Editing Discipline

- **Touch only what the feature requires.** Do not "improve" adjacent code.
- **Match the existing style.** Consistency beats your preference.
- **Don't refactor things that aren't broken.**
- **If you notice unrelated issues**, mention them in `progress.md` — don't fix them here.
- **Remove only the imports/variables/functions YOUR changes made unused.**
- **The test:** Every changed line must trace to the feature in `feature_list.json`.

## Working Rules

- **One feature at a time**: Pick exactly one unfinished feature from `feature_list.json`
- **Verification required**: Don't claim done without running verification commands
- **Update artifacts**: Before ending session, update `progress.md` and `feature_list.json`
- **Stay in scope**: Don't modify files unrelated to the current feature
- **No bonus surface**: Build only what the request names. Do NOT add new CLI flags,
  commands, modes, config keys, or abstractions beyond the stated feature. If a
  useful extra occurs to you, name it in one line and ask — don't build it.
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
```

For bugs: write a reproduction test FIRST, then make it pass.
For features: write the verification check FIRST, then implement.

## Definition of Done

A feature is done only when ALL of the following are true:

- [ ] Target behavior is implemented
- [ ] For bugs: a reproduction test was written FIRST, then made to pass
- [ ] For features: a verification check was written FIRST, then the code
- [ ] Required verification actually ran and passed (tests / lint / type-check)
- [ ] Evidence recorded in `feature_list.json` or `progress.md`
- [ ] **Scope trace passed**: every changed line maps to the named feature; no
      bonus flags / commands / modes / abstractions were added (see Working Rules)
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
- Anything the user explicitly asked to keep

## Verification Commands

```bash
# Full verification (recommended)
./init.sh
```

Required checks:
- `npm install`
- `npm run typecheck`
- `npm run lint`
- `npm test`
- `npm run build`

## Escalation

If you encounter:
- **Architecture decisions**: Consult `docs/ARCHITECTURE.md` if present, otherwise ask user
- **Unclear or over-specified requirements**: Check product/requirements docs if present,
  otherwise ask user. Question whether the spec itself is over-specified.
- **Repeated test failures**: Update progress, flag for human review
- **Scope ambiguity**: Re-read `feature_list.json` for definition of done
