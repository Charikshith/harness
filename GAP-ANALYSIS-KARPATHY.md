# Gap Analysis: Karpathy's CLAUDE.md vs. Harness-Creator Ecosystem

**Date:** 2025-07-17
**Scope:** Detailed structural and behavioral comparison between Karpathy's `CLAUDE.md` behavioral guidelines and the Harness-Creator skill ecosystem (v2, OKF-aligned).
**Perspective:** Senior Engineer / Architect — evaluating actual utility, not feature-checklist presence.

---

## Executive Summary

Karpathy's `CLAUDE.md` and the Harness-Creator ecosystem operate at **different architectural layers** and address **different failure modes**. They are complementary in the truest sense: neither replaces the other, and both are weaker without the other.

- **Karpathy's CLAUDE.md** is a set of **behavioral guidelines** — rules for how an agent should *think, act, and communicate* during a task. It is content that goes *inside* an instruction file.
- **Harness-Creator** is a **structural framework** — a system of files, scripts, state trackers, and verification gates that creates a *reliable container* for agent work across sessions. It produces the instruction file and the scaffolding around it.

The harness outputs an `AGENTS.md` file. Karpathy's rules are candidate *content for that file*. The harness's own generated `AGENTS.md` is thin on behavioral rules — it covers startup workflow, working rules (one feature at a time, stay in scope, verification), and end-of-session — but has nothing about how the agent should reason, when to ask questions, or how to edit existing code surgically. Karpathy fills precisely those gaps.

This is not a "who wins" comparison. It is a "what does each bring to the combined system" analysis.

---

## 1. Layer Model: Where Each Sits

```
┌─────────────────────────────────────────────────────────────┐
│                    HARNESS-CREATOR                          │
│  (Structural framework — creates the container)             │
│                                                             │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  GENERATED AGENTS.md / CLAUDE.md                     │   │
│  │  ┌──────────────────────────────────────────────┐    │   │
│  │  │  KARPATHY CLAUDE.md                          │    │   │
│  │  │  (Behavioral guidelines — fills the content) │    │   │
│  │  │                                              │    │   │
│  │  │  §1 Think Before Coding                      │    │   │
│  │  │  §2 Simplicity First                         │    │   │
│  │  │  §3 Surgical Changes                         │    │   │
│  │  │  §4 Goal-Driven Execution                    │    │   │
│  │  └──────────────────────────────────────────────┘    │   │
│  └──────────────────────────────────────────────────────┘   │
│                                                             │
│  Supporting artifacts:                                      │
│  ┌──────────────┐ ┌──────────────┐ ┌──────────────┐         │
│  │feature_list  │ │ progress.md  │ │  init.sh     │         │
│  │   .json      │ │              │ │              │         │
│  │ (state)      │ │ (continuity) │ │(verification)│         │
│  └──────────────┘ └──────────────┘ └──────────────┘         │
│  ┌───────────────┐                                          │
│  │session-handoff│                                          │
│  │    .md        │                                          │
│  │ (lifecycle)   │                                          │
│  └───────────────┘                                          │
│                                                             │
│  Advanced patterns (optional):                              │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐        │
│  │ Memory   │ │ Context  │ │ Tool     │ │ Multi-   │        │
│  │ Persist. │ │ Eng.     │ │ Registry │ │ Agent    │        │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘        │
└─────────────────────────────────────────────────────────────┘
```

The harness is the **container** and the **operating system** for agent work. Karpathy is the **behavioral policy** running inside it. Both are useless without content in the instruction file; the harness generates structure but leaves behavior thinly specified. Karpathy specifies behavior but has no container to enforce it across sessions.

---

## 2. Section-by-Section Gap Analysis

### 2.1 Karpathy §1: "Think Before Coding"

> Don't assume. Don't hide confusion. Surface tradeoffs. State assumptions. Present multiple interpretations. If something is unclear, stop and ask.

#### Harness coverage

**Partial.** The harness-generated `AGENTS.md` has an "Escalation" section that covers two triggers:

- Architecture decisions → consult docs, otherwise ask user
- Unclear requirements → check docs, otherwise ask user
- Repeated test failures → update progress, flag for review
- Scope ambiguity → re-read feature_list.json

This is a **reactive** escalation path — the agent escalates when it *hits a wall*. Karpathy's model is **proactive** — the agent surfaces ambiguity *before* it becomes a problem. The harness says "if you encounter a problem, ask." Karpathy says "before you start, state your assumptions and surface tradeoffs."

#### Gap

The harness has no mechanism for the agent to externalize its reasoning before acting. The `progress.md` template has a "Decisions Made" section with "Context" and "Alternatives considered" fields, but this is a **post-hoc** record — you fill it in after the decision. Karpathy wants the agent to externalize *before* it commits.

This matters because:
- An agent that silently assumes the wrong interpretation wastes the entire session
- `feature_list.json` tracks what feature is active, not what interpretation the agent is using
- The escalation section only covers well-defined problem types (architecture, requirements, test failures, scope)

#### What's not covered by either

Neither Karpathy nor the Harness defines a structured format for surfacing assumptions. Karpathy says "state your assumptions explicitly" but doesn't say how. The harness's `progress.md` has a "Decisions Made" template but uses it for post-hoc recording, not pre-action surfacing.

#### Value judgment

**High value, low integration cost.** Adding a "Before You Start" step to the harness template that explicitly asks the agent to state assumptions and surface ambiguities would cost ~3 lines and directly improve session reliability. This is Karpathy §1 injected into the harness's Startup Workflow.

**Recommendation:** Add to the harness `AGENTS.md` template's Startup Workflow (after step 3):

```markdown
4. **State your understanding**: In one line, what you think the task requires.
   If multiple interpretations exist, name them. If unclear, stop and ask.
```

And renumber the remaining steps. This makes assumption-surfacing a startup ritual, not an afterthought.

---

### 2.2 Karpathy §2: "Simplicity First"

> Minimum code that solves the problem. Nothing speculative. No features beyond what was asked. No abstractions for single-use code. No "flexibility" or "configurability" unrequested. No error handling for impossible scenarios. If 200 lines could be 50, rewrite it.

#### Harness coverage

**Near zero.** The harness-generated `AGENTS.md` has "Stay in scope: Don't modify files unrelated to the current feature" — but this is about file scope, not code complexity. There is nothing in the harness about:

- Minimum code that solves the problem
- No speculative features
- No unrequested abstractions
- No error handling for impossible scenarios
- Rewriting bloated output

The harness's `feature_list.json` defines *what* to build but says nothing about *how much* to build. A feature with description "Add a date picker" could result in a 400-line flatpickr wrapper (agent without behavioral guidance) or `<input type="date">` (agent with Karpathy/Ponytail guidance). The harness will track both equally — it only cares whether verification passed.

#### Gap analysis

This is the second-largest gap. The harness provides structure but is complexity-agnostic. It prevents scope drift (wrong files) but not complexity drift (too much code in the right files). Karpathy §2 is the primary defense against the most common agent failure mode: over-building.

**Why the harness doesn't cover this:** By design. The harness is a framework, not a style guide. It deliberately separates "what to track" from "how to build." But this means a harness without behavioral content is an empty container — it will faithfully track an agent building bloated code just as well as minimal code.

#### What the harness does provide (indirect relevance)

- **Verification gates** (init.sh, Definition of Done): If verification is fast and precise, the agent gets quick feedback on whether its solution works. This *indirectly* discourages over-building because complex solutions are harder to verify. But this is a weak force — a 400-line solution can pass the same tests as a 4-line one.
- **One-feature-at-a-time rule**: Limits the blast radius of over-building to one feature. But doesn't prevent the feature itself from being over-built.

#### Value judgment

**Critical gap. Must be filled.** The harness without simplicity rules is a car without a speed limit — it will faithfully track and verify your agent as it builds a monolith. Karpathy §2 (or Ponytail's ladder, which covers the same ground more aggressively) is essential content for any harness-generated `AGENTS.md`.

**Recommendation:** The harness template should include a "Coding Standards" or "Simplicity Rules" section between "Working Rules" and "Required Artifacts." Either embed Karpathy §2 directly, or include a pointer to the Ponytail skill if it's installed. The harness is the right *place* for these rules; Karpathy provides the right *content*.

```markdown
## Coding Standards

- Write the minimum code that solves the problem. Nothing speculative.
- No abstractions for single-use code. No unrequested "flexibility."
- No error handling for scenarios the code structure makes impossible.
- If your solution feels overcomplicated, it is. Rewrite it shorter.
```

---

### 2.3 Karpathy §3: "Surgical Changes"

> Touch only what you must. Don't "improve" adjacent code, comments, or formatting. Don't refactor things that aren't broken. Match existing style. If you notice unrelated dead code, mention it — don't delete it. Remove only imports/variables/functions YOUR changes made unused.

#### Harness coverage

**Partial, at the wrong granularity.** The harness says:

- "Stay in scope: Don't modify files unrelated to the current feature"
- "One feature at a time: Pick exactly one unfinished feature from feature_list.json"

This is **file-level** scope discipline. Karpathy's surgical changes is **line-level** scope discipline. The difference is critical:

| Harness says | Karpathy says |
|---|---|
| Don't touch `auth.ts` when working on `payment.ts` | Don't "improve" the formatting in `payment.ts` while adding the new payment method |
| Stay within the feature's file set | Match the existing style in those files, even if you'd do it differently |
| One feature at a time | Don't delete dead code you notice in those files — mention it |

The harness prevents cross-feature contamination. Karpathy prevents same-file contamination. An agent can fully satisfy the harness rules (all changes in `feature_list.json` scope) while still padding every diff with drive-by refactors, reformatting, and "while I'm here" cleanups.

#### Gap analysis

This is the **single largest gap**. The harness's scope boundary is at the feature/file level. Karpathy's scope boundary is at the line level. These are not the same thing.

Real agent behavior bears this out: agents that respect feature boundaries still inflate diffs with adjacent-code "improvements." A harness audit would show 100% scope compliance (correct files, correct feature) while the diff contains 40% unrelated formatting changes.

#### What the harness provides that helps

- `git log --oneline -5` in startup workflow: gives context on recent changes, reducing the agent's urge to "clean up" what it thinks is messy
- "Leave clean state" at end of session: discourages half-finished refactors, but only at session-end granularity

But these are weak forces compared to an explicit surgical-editing rule.

#### Value judgment

**Critical gap. Must be filled.** This is not a philosophical preference — it's a behavioral constraint that directly affects diff quality, review friction, and the harness's own reliability metrics. A harness that doesn't enforce line-level surgical discipline will suffer from:

- Inflated verification times (tests break because adjacent code was "improved")
- Unreviewable diffs
- Scope violations that pass `feature_list.json` checks but corrupt adjacent features

**Recommendation:** Add to the harness `AGENTS.md` template's Working Rules section:

```markdown
- **Surgical changes only**: Touch only what the feature requires. Do not
  improve or reformat adjacent code, comments, or whitespace. Match the
  existing style. If you notice unrelated issues, mention them — don't fix
  them in this diff. Remove only the imports, variables, or functions that
  YOUR changes made unused.
```

This is 5 lines. It closes the largest gap in the harness's behavioral coverage.

---

### 2.4 Karpathy §4: "Goal-Driven Execution"

> Define success criteria. Loop until verified. Transform tasks into verifiable goals. For multi-step tasks, state a brief plan with verify steps. Strong success criteria let you loop independently.

#### Harness coverage

**Strong partial coverage.** The harness has the richest overlap with Karpathy §4 of any section. Specifically:

| Karpathy concept | Harness equivalent | Coverage quality |
|---|---|---|
| Define success criteria | `feature_list.json` description + Definition of Done checklist | **Good** — structured, machine-readable, per-feature |
| Loop until verified | Verification commands (init.sh), "Required verification actually ran" | **Good** — explicit, runnable, checkable |
| Transform tasks into verifiable goals | Feature list with status states (not-started/in-progress/blocked/done) + evidence field | **Good** — state machine with evidence requirements |
| Multi-step plan with verify per step | Feature dependencies in feature_list.json | **Weak** — dependency graph exists but no per-step verification plan |
| Loop independently | Progress tracking + handoff | **Good** — next session can pick up where last left off |

#### Where the harness goes further

The harness adds infrastructure that Karpathy doesn't address at all:

1. **Persistent state across sessions**: Karpathy's loop assumes a single continuous session. The harness's `progress.md` + `session-handoff.md` + `feature_list.json` make the loop restartable across sessions. This is a critical addition for real-world use where sessions end (timeouts, context limits, human interruptions).

2. **Verification as a startup gate**: The harness's `./init.sh` runs *before* any work begins, catching environment rot immediately. Karpathy's verification is work-product validation, not environment validation.

3. **Structured evidence recording**: Karpathy says "loop until verified." The harness says "record evidence in feature_list.json or progress.md." The harness makes verification auditable.

4. **Explicit dependency ordering**: `feature_list.json` has a `dependencies` array that prevents the agent from working on feat-003 before feat-001 is done. Karpathy's plan is sequential but doesn't encode hard prerequisites.

#### Where Karpathy goes further

1. **Test-first (reproduce → fix → verify)**: Karpathy explicitly says "Write a test that reproduces the bug, then make it pass." The harness defines verification commands but doesn't specify test-first ordering. An agent could satisfy the harness by implementing first and verifying second — which is weaker.

2. **Explicit multi-step plan with verify check per step**: Karpathy's template:
   ```
   1. [Step] → verify: [check]
   2. [Step] → verify: [check]
   ```
   The harness's `feature_list.json` has dependencies but doesn't have per-step verification criteria. `progress.md` has "What's Next" but it's a free-form list, not a structured plan with checks.

3. **"Strong success criteria let you loop independently"**: This meta-insight — that the quality of criteria determines autonomous capability — is absent from the harness. The harness assumes criteria exist; Karpathy emphasizes that weak criteria cause failure.

#### Gap analysis

The harness and Karpathy §4 are largely aligned but miss each other at the edges:

| Aspect | Harness | Karpathy | Combined |
|---|---|---|---|
| Feature state tracking | ✅ Structured JSON | ❌ | ✅ |
| Verification gate | ✅ init.sh, commands | ✅ Test-first explicitly | ✅ |
| Cross-session continuity | ✅ progress.md, handoff | ❌ | ✅ |
| Environment validation | ✅ init.sh at startup | ❌ | ✅ |
| Test-first ordering | ❌ (order unspecified) | ✅ Explicit | ✅ |
| Per-step verification | ❌ (free-form plan) | ✅ Numbered + check | ✅ |
| Criteria quality awareness | ❌ | ✅ Meta-level | ✅ |
| Evidence recording | ✅ Structured | ❌ | ✅ |

The combination is strictly better: the harness provides the container and the state machine; Karpathy provides the process rigor inside each iteration.

#### Value judgment

**High value for process rigor.** The harness already does 60% of Karpathy §4. Adding the test-first ordering and per-step verification criteria would make the loop tighter.

**Recommendation:** Enhance the harness's "Definition of Done" section:

```markdown
## Definition of Done

A feature is done only when ALL of the following are true:

- [ ] Target behavior is implemented
- [ ] When fixing a bug: a test that reproduces it was written FIRST, then made to pass
- [ ] When adding a feature: a test or verification check was written FIRST, then the code
- [ ] Required verification actually ran and passed (tests / lint / type-check)
- [ ] Evidence recorded in `feature_list.json` or `progress.md`
- [ ] Repository remains restartable from standard startup path
```

And add to `progress.md`'s "What's Next" template a structured plan format:

```markdown
### What's Next (with verification per step)

1. [Step description] → verify: [specific check]
2. [Step description] → verify: [specific check]
```

---

## 3. Harness-Only Strengths (No Karpathy Equivalent)

These are capabilities the harness brings that Karpathy's CLAUDE.md doesn't address — not as a gap in Karpathy, but as unique structural value:

### 3.1 Cross-Session State Machine

Karpathy assumes a single continuous session. The harness is explicitly designed for the reality that agents have sessions that end — due to context limits, token budgets, timeouts, or human pauses. The state machine (`feature_list.json` + `progress.md` + `session-handoff.md`) ensures the next session picks up where the last left off without replaying context.

**Value:** Critical for any real multi-session project. Karpathy's guidelines work inside one session; the harness makes multiple sessions coherent.

### 3.2 Verification as Infrastructure (not just process)

The harness's `init.sh` is a runnable artifact, not a guideline. It can be committed to CI, run by pre-commit hooks, and executed identically by any agent or human. Karpathy's verification is a *behavior*; the harness's is an *artifact*. The artifact is more reliable because it doesn't depend on the agent remembering to run it.

**Value:** High. A runnable script beats a remembered guideline every time.

### 3.3 Dependency-Ordered Features

`feature_list.json`'s `dependencies` array creates a hard constraint: feat-002 cannot start before feat-001 is done. Karpathy has no mechanism for this — a plan can list steps in order, but nothing prevents the agent from jumping ahead.

**Value:** High for complex projects. Prevents the agent from building on unstable foundations.

### 3.4 Audit and Assessment Tooling

The harness includes `validate-harness.mjs` (scores the harness itself across 5 subsystems), `run-benchmark.mjs` (benchmarks agent performance on the harness), and `render-assessment-html.mjs` (visual reports). Karpathy has no tooling at all — it's a plain text file.

**Value:** Medium-high. Self-auditing infrastructure is valuable for teams scaling agent use. But the tooling is harness-specific (scores the container, not the behavior inside it).

### 3.5 Advanced Patterns Library

The harness's `references/` directory contains 7 patterns (memory persistence, context engineering, tool registry, multi-agent coordination, skill runtime, lifecycle/bootstrap, gotchas) that address deep agent engineering problems. Karpathy covers none of these. These are not "gaps" in Karpathy — they're a completely different domain (agent runtime engineering vs. agent behavior guidelines).

**Value:** High for teams building agent infrastructure. Zero for teams just using agents. The harness deliberately progressive-discloses these: minimal harness first, add patterns only when needed.

### 3.6 Document Type Taxonomy

The harness's `types.md` defines 8 document types with YAML frontmatter conventions, enabling agents to navigate the skill's own content without reading everything. This is meta-infrastructure — it makes the skill itself agent-friendly.

**Value:** Medium. Clever and useful for skill authors. Irrelevant for end users.

---

## 4. Karpathy-Only Strengths (No Harness Equivalent)

### 4.1 Surgical Editing Line Discipline

Covered in §2.3. The harness has file-level scope but no line-level discipline. **Critical gap.**

### 4.2 Simplicity/Complexity Rules

Covered in §2.2. The harness tracks *what* to build, not *how much* to build. **Critical gap.**

### 4.3 Proactive Assumption Surfacing

Covered in §2.1. The harness's escalation path is reactive; Karpathy's is proactive. **High-value gap.**

### 4.4 Test-First Ordering

Covered in §2.4. The harness defines verification but doesn't specify ordering. **Medium-value gap.**

### 4.5 "No Error Handling for Impossible Scenarios"

A nuanced rule neither fully covers. Karpathy explicitly calls out that you shouldn't handle errors that can't happen. The harness's Definition of Done requires verification to pass but doesn't distinguish necessary from unnecessary error handling. **Low-value but sharpens edge cases.**

### 4.6 "If 200 lines could be 50, rewrite it"

An explicit rewrite trigger. The harness has no mechanism for detecting or triggering simplification of already-written code. The harness audit scores structure, not code complexity. **Low-value** — more useful as a behavioral nudge than a missing structural feature.

---

## 5. Conflicts and Tensions

### 5.1 "One Feature at a Time" vs. "If You Notice Unrelated Dead Code, Mention It"

- **Harness:** "Stay in scope. Don't modify files unrelated to the current feature."
- **Karpathy:** "If you notice unrelated dead code, mention it — don't delete it."

**Not a conflict, but a subtle tension.** The agent sees dead code while working on a feature. The harness's "stay in scope" rule might discourage even mentioning it. Karpathy explicitly encourages mentioning it. The harness should clarify that *mentioning* out-of-scope findings is allowed and valuable; only *modifying* is prohibited.

**Resolution:** Add to the harness's Working Rules: "If you notice unrelated issues while working, mention them — don't fix them in this session. Add them to `progress.md` under 'Notes for Next Session.'"

### 5.2 Minimum Code vs. Feature Completeness

- **Harness:** Definition of Done requires "target behavior is implemented." The `feature_list.json` description defines what "target behavior" means.
- **Karpathy:** "Write the minimum code that solves the problem."

**Not a conflict, but an ambiguity.** What if the feature description in `feature_list.json` is over-specified? The agent is bound to implement it fully (harness rule) but is also told to write minimum code (Karpathy rule). The resolution depends on whether the agent interprets "minimum" as "minimum to satisfy the spec" or "minimum to satisfy the spirit of the request."

**Resolution:** This is a Ponytail-ladder scenario — the agent should question whether the spec itself is over-specified. The harness's escalation path covers this: "Architecture decisions: consult project architecture docs if present, otherwise ask user." But it should explicitly include "over-specified requirements" as an escalation trigger.

### 5.3 Verification Requires Work vs. Test-First

- **Harness:** "Verification actually ran (tests / lint / type-check)" — ordering unspecified.
- **Karpathy:** "Write a test that reproduces it, then make it pass."

**Minor tension.** The harness accepts test-after; Karpathy demands test-first. For new features, test-first is superior (the test is the spec). For exploratory work, test-after may be more practical.

**Resolution:** Covered in §2.4 recommendation — add test-first to Definition of Done for bugs and features, not for exploratory work.

---

## 6. What the Harness's Generated AGENTS.md Is Missing

The current harness `AGENTS.md` template covers:

| Section | Coverage |
|---|---|
| Startup Workflow (6 steps) | ✅ Good |
| Working Rules (5 rules) | ✅ Good, but missing surgical editing + simplicity |
| Required Artifacts (4 files) | ✅ Good |
| Definition of Done (4 criteria) | ✅ Good, but missing test-first |
| End of Session (5 steps) | ✅ Good |
| Verification Commands | ✅ Good (template-driven) |
| Escalation (4 triggers) | ✅ Good |

What it's missing — all from Karpathy:

| Missing | Priority | Lines to add |
|---|---|---|
| Think before coding (state assumptions, surface ambiguity) | High | 2-3 |
| Simplicity rules (minimum code, no speculative features, no unrequested abstractions) | Critical | 4-5 |
| Surgical changes (line-level discipline, don't "improve" adjacent code) | Critical | 4-5 |
| Test-first ordering (reproduce → fix, or write check → implement) | Medium | 2-3 |
| "No error handling for impossible scenarios" | Low | 1 |
| Rewrite trigger (200→50) | Low | 1 |

**Total: ~16 new lines in the template.** The harness's structure stays; the behavioral content gets filled in.

---

## 7. What Karpathy's CLAUDE.md Is Missing from the Harness

Karpathy is a plain markdown file with no supporting infrastructure. It's missing:

| Missing | Why it matters |
|---|---|
| **State tracking** (feature_list.json) | No way to track what's done/not-done across sessions |
| **Progress continuity** (progress.md) | Agent forgets context between sessions |
| **Verification gate** (init.sh) | No forced verification; agent can claim done without running checks |
| **Session handoff** (session-handoff.md) | Next session starts blind |
| **Dependency ordering** | Agent can work on features out of order |
| **Evidence recording** | No proof that verification actually ran |
| **Escalation protocol** | No structured path for when the agent is stuck |
| **Environment validation** | No check that the environment is healthy before work begins |
| **Tooling** (create, validate, benchmark, assess) | No way to audit the instruction quality or measure agent reliability |

A project with only Karpathy's CLAUDE.md and no harness will have well-behaved agents within a single session, but will suffer from session-amnesia, unverified completion claims, and no ability to track feature state. Karpathy's rules help the agent *during* the work; the harness helps the agent *between* work sessions.

---

## 8. The Combined Ideal: What a Harness + Karpathy AGENTS.md Looks Like

Here's the merged template — harness structure + Karpathy content:

```markdown
# AGENTS.md

Project harness for reliable agent-assisted development.

## Startup Workflow

Before writing code:

1. Confirm working directory with `pwd`
2. Read this file completely
3. Read project docs if present (docs/ARCHITECTURE.md, docs/PRODUCT.md, README)
4. Run `./init.sh` to verify environment is healthy
5. Read `feature_list.json` to see current feature state
6. Review recent commits with `git log --oneline -5`
7. State your understanding: in one line, what the task requires.
   If multiple interpretations exist, name them. If unclear, stop and ask.

If baseline verification is failing, repair that first before adding new scope.

## Working Rules

- One feature at a time: Pick exactly one unfinished feature from feature_list.json
- Verification required: Don't claim done without running verification commands
- Update artifacts: Before ending session, update progress.md and feature_list.json
- Stay in scope: Don't modify files unrelated to the current feature
- Surgical changes only: Touch only what the feature requires. Do not improve or
  reformat adjacent code, comments, or whitespace. Match the existing style. If
  you notice unrelated issues, mention them in progress.md — don't fix them here.
  Remove only the imports, variables, or functions that YOUR changes made unused.
- Leave clean state: Next session must be able to run `./init.sh` immediately

## Coding Standards

- Write the minimum code that solves the problem. Nothing speculative.
- No abstractions for single-use code. No unrequested "flexibility."
- No error handling for scenarios the code structure makes impossible.
- If your solution feels overcomplicated, it is. Rewrite it shorter.

## Required Artifacts

- feature_list.json — Feature state tracker (source of truth)
- progress.md — Session continuity log
- init.sh — Standard startup and verification path
- session-handoff.md — Optional, for larger sessions

## Definition of Done

A feature is done only when ALL of the following are true:

- [ ] Target behavior is implemented
- [ ] For bugs: a reproduction test was written FIRST, then made to pass
- [ ] For features: a verification check was written FIRST, then the code
- [ ] Required verification actually ran and passed (tests / lint / type-check)
- [ ] Evidence recorded in feature_list.json or progress.md
- [ ] Repository remains restartable from standard startup path

## End of Session

Before ending a session:

1. Update progress.md with current state
2. Update feature_list.json with new feature status
3. Record any unresolved risks or blockers
4. Commit with descriptive message once work is in safe state
5. Leave repo clean enough for next session to run `./init.sh` immediately

## Verification Commands

```bash
# Full verification (recommended)
./init.sh
```

Required checks:
- `npm test`
- `npm run lint`

## Escalation

If you encounter:
- Architecture decisions: Consult project architecture docs if present, otherwise ask user
- Unclear or over-specified requirements: Check product/requirements docs if present, otherwise ask user
- Repeated test failures: Update progress, flag for human review
- Scope ambiguity: Re-read feature_list.json for definition of done
```

The net addition is ~18 lines. The harness structure is preserved. The Karpathy behavioral content is embedded. Nothing conflicts.

---

## 9. Implementation Recommendations

### For the Harness Template (`templates/agents.md`)

| Change | Priority | Effort |
|---|---|---|
| Add "State your understanding" to Startup Workflow (step 7) | High | 2 lines, renumber |
| Add "Surgical changes only" bullet to Working Rules | Critical | 3 lines |
| Add "Coding Standards" section between Working Rules and Required Artifacts | Critical | 5 lines |
| Add test-first to Definition of Done | High | 2 lines |
| Add "No error handling for impossible scenarios" to Coding Standards | Low | 1 line |
| Add "over-specified requirements" to Escalation triggers | Low | 1 line |
| Add "mention unrelated issues in progress.md" to Surgical Changes | Medium | Already covered |

### For the Harness State Templates

| Change | Priority | Effort |
|---|---|---|
| Add per-step verification to `progress.md` "What's Next" template | Medium | 3 lines |

### For the Harness SKILL.md

No changes needed. The SKILL.md is about *how to create/audit harnesses*, not about the behavioral content inside them. The behavioral improvements go in the *template*, not the skill body.

### For Karpathy's CLAUDE.md (if used standalone)

Consider adding the harness's structural artifacts:

```markdown
## Session Continuity

At end of session, record:
- Current feature and status
- What was completed
- What's next
- Any blockers or decisions
```

But honestly, if you're going that far, just use the harness. Karpathy + harness is better than Karpathy alone.

---

## 10. Conclusion

Karpathy's `CLAUDE.md` and the Harness-Creator ecosystem are **complementary at different architectural layers**. The harness is the container; Karpathy is the behavioral policy inside it.

**The harness without Karpathy** produces well-structured but behaviorally empty instruction files. It will faithfully track and verify an agent that over-builds, over-reaches, and pads diffs — as long as the agent stays within the feature's file set. It's a reliable car with no driver training.

**Karpathy without the harness** produces well-behaved agents within a single session, but loses all state, verification evidence, and continuity between sessions. It's a well-trained driver with no car.

**Together**, they cover the full stack:
- Harness: session continuity, state tracking, verification gates, dependency ordering, environment validation, audit tooling
- Karpathy: assumption surfacing, simplicity enforcement, surgical editing, test-first verification, per-step planning

The integration is straightforward: add ~18 lines to the harness `AGENTS.md` template. No architectural changes. No conflicts. No new dependencies. Pure content addition.

---

## Appendix: Quick Reference Matrix

| Concern | Harness | Karpathy | Combined |
|---|---|---|---|
| Agent knows what to work on | ✅ feature_list.json | ❌ | ✅ |
| Agent verifies before claiming done | ✅ init.sh, DoD | ✅ Test-first | ✅✅ |
| Agent doesn't over-build | ❌ | ✅ Simplicity First | ✅ |
| Agent doesn't pad diffs | ❌ (file-level only) | ✅ Surgical Changes | ✅ |
| Agent surfaces ambiguity | ❌ (reactive escalation) | ✅ Think Before Coding | ✅ |
| Agent plans multi-step work | ❌ (free-form) | ✅ Goal-Driven | ✅ |
| Agent records evidence | ✅ Structured | ❌ | ✅ |
| Agent resumes across sessions | ✅ State + Handoff | ❌ | ✅ |
| Environment validated at startup | ✅ init.sh | ❌ | ✅ |
| Harness quality measurable | ✅ validate-harness.mjs | ❌ | ✅ |
| Agent runtime patterns | ✅ 7 patterns | ❌ | ✅ |
