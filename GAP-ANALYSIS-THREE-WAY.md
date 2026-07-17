# Three-Way Gap Analysis: Ponytail ↔ Harness-Creator v2 ↔ Karpathy CLAUDE.md

**Date:** 2025-07-17
**Scope:** Structural and behavioral comparison across three systems for AI coding agent reliability.
**Systems analyzed:**
- **Ponytail** v0.1.0 — Lazy senior dev skill ecosystem (6 skills, pi extension, MCP server, 14 agent adapters)
- **Harness-Creator** v2 (v0.2.0) — Agent harness framework (5-subsystem model, 7 patterns, scripts, templates, evals)
- **Karpathy CLAUDE.md** — Behavioral guidelines (4 principles: Think Before Coding, Simplicity First, Surgical Changes, Goal-Driven Execution)

**Perspective:** Senior Engineer / Architect. Every claim: is it actually needed, how does it add value, what are the tradeoffs.

---

## Executive Summary

These three systems form a **nested architecture**. They do not compete. Each operates at a different layer of the agent reliability stack, and each fills real gaps in the others:

```
┌──────────────────────────────────────────────────────────────────┐
│                    HARNESS-CREATOR v2                            │
│         Structural container — session continuity,               │
│         state tracking, verification gates, audit tooling        │
│                                                                  │
│  ┌──────────────────────────────────────────────────────────┐    │
│  │              GENERATED AGENTS.md / CLAUDE.md             │    │
│  │                                                          │    │
│  │  ┌──────────────────────────────────────────────────┐    │    │
│  │  │              PONYTAIL                            │    │    │
│  │  │    Code production policy — the ladder,          │    │    │
│  │  │    intensities, debt tracking, review/audit      │    │    │
│  │  │                                                  │    │    │
│  │  │  ┌──────────────────────────────────────────┐    │    │    │
│  │  │  │        KARPATHY CLAUDE.md                │    │    │    │
│  │  │  │  Behavioral guidelines — think first,    │    │    │    │
│  │  │  │  edit surgically, verify before claiming │    │    │    │
│  │  │  └──────────────────────────────────────────┘    │    │    │
│  │  └──────────────────────────────────────────────────┘    │    │
│  └──────────────────────────────────────────────────────────┘    │
│                                                                  │
│  Supporting artifacts: feature_list.json, progress.md,           │
│  init.sh, session-handoff.md                                     │
│                                                                  │
│  Advanced patterns: memory, context, tools, multi-agent,         │
│  lifecycle, skill-runtime, gotchas (15 failure modes)            │
└──────────────────────────────────────────────────────────────────┘
```

- **Harness-Creator** is the **container** — it creates the files, tracks state, gates verification, enables session continuity. It's the operating system.
- **Ponytail** is the **code production policy** — it governs *what* code gets written (or skipped) via the ladder, intensity levels, and debt tracking. It's the compiler optimizer.
- **Karpathy CLAUDE.md** is the **behavioral firmware** — it governs *how* the agent approaches work: surfacing ambiguity, editing surgically, verifying before claiming done. It's the process scheduler.

**None covers what the others do.** A project with all three is strictly more reliable than any subset. The integration gap between them is ~30 lines of content across harness templates.

---

## 1. Layer Model: Where Each Sits

### 1.1 Layer Stack

| Layer | System | Primary concern | Key mechanism | What happens without it |
|---|---|---|---|---|
| **Container** | Harness-Creator | Session continuity, state, verification | 5-subsystem framework + scripts | Agent forgets between sessions, can't track progress, no verification gate |
| **Policy** | Ponytail | Code minimalism, platform-native, YAGNI | 6-rung ladder + intensity levels | Agent over-builds, adds dependencies, writes 400 lines for `<input type="date">` |
| **Firmware** | Karpathy | Process rigor, surgical editing, goal verification | 4 behavioral principles | Agent pads diffs, silently assumes wrong interpretation, claims done without checking |

### 1.2 Responsibility Boundaries

| Concern | Whose job is it? | Who else touches it? |
|---|---|---|
| What to work on next | Harness (feature_list.json) | — |
| Is the environment healthy? | Harness (init.sh) | — |
| What did we finish last session? | Harness (progress.md) | Ponytail (ponytail: comments carry debt forward) |
| Should this feature exist at all? | Ponytail (ladder rung 1: YAGNI) | Karpathy (think before coding: surface tradeoffs) |
| Should I use a library or native? | Ponytail (ladder rungs 2-4) | — |
| How much code should this take? | Ponytail (ladder rung 5 + rules) | Karpathy (simplicity first: 200→50 rewrite trigger) |
| Am I touching the right files? | Harness (scope: feature file set) | Karpathy (surgical changes: don't touch adjacent lines) |
| Am I padding the diff? | Karpathy (surgical changes) | — |
| Did I verify before claiming done? | Harness (DoD: verification ran) | Karpathy (test-first ordering) |
| Did I surface ambiguity? | Karpathy (think before coding) | Ponytail (ultra mode challenges requirements) |
| Is this code too complex? | Ponytail (review/audit skills) | — |
| Are we tracking our shortcuts? | Ponytail (ponytail: comments + debt ledger) | Harness (progress.md can carry notes) |
| Can the next session resume? | Harness (session-handoff.md) | — |

---

## 2. Full Section-by-Section Analysis

### 2.1 Startup: What happens when an agent session begins?

| Aspect | Ponytail | Harness | Karpathy |
|---|---|---|---|
| Environment check | ❌ | ✅ init.sh | ❌ |
| Read project docs | ❌ | ✅ Step 3 of startup workflow | ❌ |
| Know what feature to work on | ❌ | ✅ feature_list.json | ❌ |
| Review recent changes | ❌ | ✅ git log --oneline -5 | ❌ |
| State assumptions before acting | ❌ | ❌ | ✅ Think Before Coding §1 |
| Surface ambiguity proactively | ❌ (ultra mode challenges, but doesn't pause) | ❌ (reactive escalation only) | ✅ §1 |
| Intensity/mode selection | ✅ /ponytail lite/full/ultra | ❌ | ❌ |
| Persist mode across sessions | ✅ hooks + config | ❌ | ❌ |

**Gap:** Neither Ponytail nor Karpathy has any concept of session startup ritual. The harness's 6-step startup workflow is unique and essential — it grounds the agent in project reality before it writes anything. Ponytail's auto-activation at session start is a close cousin but a different concern (policy activation vs. context loading).

**Value:** The harness startup workflow + Ponytail activation should be combined. The harness tells the agent *what's happening in the project*; Ponytail tells the agent *how to code*. Both are needed at session start.

**Recommendation:** Harness `AGENTS.md` template's startup workflow should include a step for activating behavioral policies:

```markdown
7. If Ponytail is installed, confirm current mode with `/ponytail status`.
   Default is full — the ladder is enforced.
```

---

### 2.2 Code Production: What code gets written?

| Aspect | Ponytail | Harness | Karpathy |
|---|---|---|---|
| YAGNI / does this need to exist? | ✅ Ladder rung 1 | ❌ | ❌ (implicit in "nothing speculative") |
| Stdlib over custom code | ✅ Ladder rung 2 | ❌ | ❌ |
| Native platform over dependencies | ✅ Ladder rung 3 | ❌ | ❌ |
| Installed dep over new dep | ✅ Ladder rung 4 | ❌ | ❌ |
| One-liner if possible | ✅ Ladder rung 5 | ❌ | ❌ |
| Minimum code that works | ✅ Ladder rung 6 | ❌ | ✅ "minimum code that solves the problem" |
| No speculative features | ✅ "speculative need = skip it" | ❌ | ✅ "nothing speculative" |
| No unrequested abstractions | ✅ "no interface with one implementation" | ❌ | ✅ "no abstractions for single-use code" |
| No unrequested flexibility/config | ✅ "no config for value that never changes" | ❌ | ✅ "no flexibility or configurability unrequested" |
| Intensity levels (lite/full/ultra) | ✅ Unique to Ponytail | ❌ | ❌ |
| `ponytail:` shortcut markers | ✅ Unique to Ponytail | ❌ | ❌ |
| Over-engineering review | ✅ /ponytail-review skill | ❌ | ❌ |
| Whole-repo over-engineering audit | ✅ /ponytail-audit skill | ❌ | ❌ |
| Debt ledger for shortcuts | ✅ /ponytail-debt skill | ❌ | ❌ |

#### Analysis

**Ponytail dominates this layer.** The ladder alone covers Karpathy's "simplicity first" principle in more detail, plus adds rungs Karpathy never mentions (stdlib, native, installed dep). Karpathy and Ponytail agree on "no speculative features / no unrequested abstractions / no unrequested flexibility." Ponytail goes further with:

1. **Intensity levels**: Lite/full/ultra give the user a dial. Karpathy has one fixed setting.
2. **The `ponytail:` comment convention**: Tracks deliberate shortcuts with ceiling and upgrade path. Karpathy has no mechanism for this.
3. **Review and audit skills**: Systematic over-engineering detection with a structured taxonomy (delete/stdlib/native/yagni/shrink). Karpathy says "be simple" but offers no detection mechanism.

**The harness is code-production-agnostic.** It tracks *what* to build (feature_list.json) and *whether* it's done (verification), but has zero opinion on *how much* code it should take. This is by design — the harness is a framework, not a style guide. But it means the harness alone provides no defense against the most common agent failure: over-building the right feature in the right files.

#### Harness relevance to code production

The harness's indirect contributions:

- **One feature at a time**: Limits blast radius of over-building. Agent can only bloat one feature per session.
- **Verification gate**: Quick feedback loop discourages complexity (harder to verify). But a 400-line solution can pass the same tests as a 4-line one. Weak force.
- **Definition of Done**: Requires evidence and verification. But doesn't evaluate code *quality*, only functional correctness.

#### Karpathy's unique code-production contribution

One thing Karpathy says that Ponytail doesn't explicitly cover:

> "No error handling for impossible scenarios."

Ponytail says "never simplify away: error handling that prevents data loss" — a hard safety boundary. Karpathy adds the flip side: don't handle errors that can't happen. Ponytail's safety boundary is correct but one-directional; Karpathy guards the other direction. Combined, you get: *handle possible errors that matter; skip impossible ones.*

#### Value judgment

Ponytail is the strongest code-production policy by a wide margin. Karpathy's "simplicity first" is a subset of Ponytail's ladder. The harness provides zero code-production guidance. **Ponytail should be the canonical code-production layer; Karpathy §2 adds only the "no error handling for impossible scenarios" nuance worth incorporating.**

---

### 2.3 Editing Discipline: How does the agent touch existing code?

| Aspect | Ponytail | Harness | Karpathy |
|---|---|---|---|
| Don't touch adjacent code | ❌ | ❌ | ✅ "Don't improve adjacent code, comments, formatting" |
| Don't refactor unbroken things | ❌ | ❌ (file-level scope only) | ✅ "Don't refactor things that aren't broken" |
| Match existing style | ❌ | ❌ | ✅ "Match existing style, even if you'd do it differently" |
| Don't delete unrelated dead code | ❌ | ❌ | ✅ "Mention it — don't delete it" |
| Clean up YOUR orphans only | ❌ | ❌ | ✅ "Remove only what YOUR changes made unused" |
| File-level scope | ✅ "fewest files possible" | ✅ "Stay in scope: feature file set" | ❌ (line-level is finer-grained) |
| Shortest diff wins | ✅ "shortest working diff wins" | ❌ | ✅ Implicit in surgical changes |

#### Analysis

**This is the single largest gap in both Ponytail and the harness.** Karpathy's "Surgical Changes" principle has no equivalent in either system:

- **Ponytail** governs *what you build*, not *how you edit*. Its "fewest files possible" and "shortest working diff" are output-level goals, not editing-discipline rules. An agent following Ponytail will write minimal code but might still reformat 50 adjacent lines, "fix" comments, and refactor unbroken functions — all while satisfying the ladder.
- **The harness** has file-level scope ("Don't modify files unrelated to the current feature") but zero line-level discipline. An agent can satisfy harness rules while:
  - Reformatting every file it touches
  - "Improving" adjacent functions it noticed
  - Deleting dead code it stumbled across
  - Adding comments to unrelated code
  - Refactoring a helper "while I'm here"

This gap is **critical** because it undermines both systems' core metrics:

| System | Metric undermined | How |
|---|---|---|
| Ponytail | "Shortest working diff" | Diff padded with unrelated changes |
| Ponytail | "~54% less code" | Savings lost to drive-by reformatting |
| Ponytail | Review efficiency | /ponytail-review scores code the agent didn't intend to write |
| Harness | Scope compliance | Feature diff contains non-feature changes |
| Harness | Session continuity | Next session's agent wastes time on unintended changes from last session |
| Harness | Verification reliability | Adjacent-code changes break unrelated tests |

#### Why this gap exists (design intent)

- **Ponytail** is intentionally output-focused. It trusts the agent to apply minimalism to *new code* but doesn't govern *editing*. Its "fewest files possible" is about not creating new files, not about touch-discipline in existing files.
- **The harness** draws scope boundaries at the feature level because that's what a state machine can track. A JSON file can check "did you touch payment.ts while working on auth feature?" but cannot check "did you reformat 50 unrelated lines in auth.ts while adding the new auth method?"

Karpathy's surgical editing rules fill a gap neither system was designed to address.

#### Value judgment

**Critical gap. Must close.** This is the single most impactful missing piece across both systems. It requires ~5 lines to fix.

---

### 2.4 Verification: How does the agent prove work is done?

| Aspect | Ponytail | Harness | Karpathy |
|---|---|---|---|
| Verification gating (must run checks) | ❌ | ✅ Definition of Done + init.sh | ✅ "Loop until verified" |
| Test-first ordering | ❌ | ❌ | ✅ "Write a test that reproduces it, then make it pass" |
| Verification commands as artifact | ❌ | ✅ init.sh (runnable, committable) | ❌ |
| Minimum verification (non-trivial logic) | ✅ "ONE runnable check: assert demo or small test" | ❌ | ❌ |
| Trivial one-liner exemption | ✅ "trivial one-liners need no test" | ❌ | ❌ |
| Evidence recording | ❌ | ✅ feature_list.json evidence field | ❌ |
| Cross-session verification continuity | ❌ | ✅ progress.md tracks what was verified | ❌ |
| Per-step verification criteria | ❌ | ❌ (free-form plan) | ✅ "Step → verify: check" |
| Environment validation | ❌ | ✅ init.sh runs before work | ❌ |
| Success criteria definition | ❌ | ❌ (feature description is the spec) | ✅ "Define success criteria explicitly" |

#### Analysis

**Harness + Karpathy cover verification well; Ponytail covers the minimum.** This layer has the richest overlap and the least conflict:

| Ponytail's contribution | Unique value |
|---|---|
| "ONE runnable check" for non-trivial logic | Sets a floor — prevents zero-verification, but doesn't over-prescribe |
| Trivial one-liner exemption | Prevents over-verification (YAGNI applied to tests) |
| No frameworks, no fixtures | Prevents test infrastructure bloat |

| Harness's contribution | Unique value |
|---|---|
| init.sh as a runnable artifact | Committable, CI-friendly, agent-agnostic. A script beats a remembered guideline. |
| Definition of Done checklist | Structured, auditable, machine-readable |
| Evidence recording | Makes verification traceable across sessions |
| Cross-session continuity | progress.md ensures verification state survives session boundaries |
| Environment validation | Catches broken environment before work begins |

| Karpathy's contribution | Unique value |
|---|---|
| Test-first ordering | "Write a reproduction test FIRST" — stronger than test-after |
| Explicit success criteria | Prevents the agent from defining "done" as "I wrote some code" |
| Per-step verification plan | Numbered plan with verify-checks per step |
| Autonomous loop capability | "Strong success criteria let you loop independently" |

#### The verification stack (how they compose)

```
Ponytail sets the MINIMUM FLOOR:
  "Non-trivial logic leaves ONE runnable check. Trivial one-liners = no test."

Karpathy adds PROCESS RIGOR:
  "For bugs: reproduce first, then fix. For features: write check first, then code.
   Define success criteria. Multi-step work = numbered plan with verify per step."

Harness provides INFRASTRUCTURE:
  "Here's the verification script. Here's where you record evidence.
   Here's the state that carries forward to next session."
```

None of these conflict. The Ponytail floor is the minimum; Karpathy's test-first is the gold standard; the harness makes it all runnable and persistent.

#### Gap

**Harness + Karpathy don't mention Ponytail's "trivial one-liner exemption."** Without it, an agent following Karpathy's test-first would write a formal test for `const x = arr.filter(Boolean)` — over-verification. Ponytail's exemption is a necessary efficiency guard.

**Ponytail doesn't mention test-first.** Its "one check" is a post-hoc safety net, not a design driver. For non-trivial features, test-after is weaker than test-first.

**Value judgment:** Add Karpathy's test-first ordering to the harness Definition of Done (for bugs and features explicitly). Add Ponytail's trivial-exemption to prevent over-verification. The harness infrastructure stays as-is.

---

### 2.5 Session Continuity: What happens between sessions?

| Aspect | Ponytail | Harness | Karpathy |
|---|---|---|---|
| Feature state tracking | ❌ | ✅ feature_list.json | ❌ |
| Progress log | ❌ | ✅ progress.md | ❌ |
| Session handoff document | ❌ | ✅ session-handoff.md | ❌ |
| Startup path (standardized) | ❌ | ✅ init.sh | ❌ |
| Deliberate shortcut tracking | ✅ ponytail: comments + debt ledger | ❌ (progress.md is general) | ❌ |
| Mode persistence | ✅ hooks + config | ❌ | ❌ |
| Decision recording | ❌ | ✅ progress.md "Decisions Made" | ❌ |
| Blocker/risk tracking | ❌ | ✅ progress.md + feature_list.json blocked status | ❌ |
| Orphaned shortcut detection | ✅ /ponytail-debt flags no-trigger | ❌ | ❌ |

#### Analysis

**Harness dominates this layer; Ponytail adds a specialized sub-tracker.** Karpathy's CLAUDE.md is single-session — it has zero cross-session infrastructure.

**Harness is the canonical session-continuity system:**
- Structured state machine (not-started → in-progress → blocked → done)
- Evidence-gated completion
- Blocked/risk tracking
- Decision recording with context and alternatives
- Standardized startup path so any agent can resume

**Ponytail adds a specialized debt tracker:**
- The `ponytail:` comment convention marks deliberate shortcuts
- `/ponytail-debt` harvests them into a ledger with ceiling + upgrade path
- Flags shortcuts with no upgrade path (no-trigger tag — silent rot risk)

These compose cleanly: harness tracks *what we're building and whether it's done*; Ponytail tracks *what we deliberately deferred and when to revisit it*. A shortcut marked with `ponytail:` could be carried forward in `progress.md`'s "Notes for Next Session" or the Ponytail debt ledger.

**Ponytail's mode persistence is a different axis:** It ensures the behavioral policy (lite/full/ultra) survives across sessions via config file + env var + hooks. The harness doesn't govern behavioral policy at all. This is Ponytail-specific infrastructure that the harness doesn't need to replicate.

#### Gap

**Harness doesn't integrate Ponytail debt into progress tracking.** The `ponytail:` comment convention and the harness's `progress.md` are parallel systems with no bridge. A team could have a growing Ponytail debt ledger and a harness that shows all features "done" — hiding the accumulating shortcuts. The harness's "Blockers / Risks" section could carry Ponytail debt items, but doesn't by default.

**Value judgment:** Low priority, but worth a note in the harness template. When Ponytail is installed, the harness's `progress.md` "Notes for Next Session" should reference the Ponytail debt ledger.

---

### 2.6 Communication: How does the agent interact with the user?

| Aspect | Ponytail | Harness | Karpathy |
|---|---|---|---|
| Proactive ambiguity surfacing | ❌ (ultra challenges, but ships first) | ❌ (reactive escalation only) | ✅ Think Before Coding: "If unclear, stop. Ask." |
| Surface tradeoffs | ✅ "Ship lazy version, question in same response" | ❌ | ✅ "If multiple interpretations exist, present them" |
| Terse output | ✅ "Code first. Then at most three short lines." | ❌ | ❌ |
| Escalation protocol | ❌ | ✅ Structured escalation paths (4 triggers) | ❌ |
| When to ask vs. when to default | ✅ Implicit: "Never stall on an answer you can default" | ❌ | ✅ Explicit: "If uncertain, ask" |
| User insists → build it | ✅ "User insists on full version → build it, no re-arguing" | ❌ | ❌ |

#### Analysis

**A clear tension exists between Ponytail and Karpathy on communication posture:**

- **Ponytail**: "Never stall on an answer you can default." Ship the lazy version and question it in the same response. Action-first.
- **Karpathy**: "If something is unclear, stop. Name what's confusing. Ask." Clarification-first.

This is the only genuine conflict between the systems. Both positions are correct at different task scales:

| Task type | Right posture | Why |
|---|---|---|
| Cosmetic/naming ambiguity | Ponytail: default and proceed | Cost of wrong answer < cost of round-trip |
| Structural ambiguity (architecture, data model, security) | Karpathy: stop and ask | Cost of wrong answer >> cost of round-trip |
| Trivial one-liner | Ponytail: just ship it | Ambiguity is the feature, not a bug |
| Multi-day feature design | Karpathy: surface everything | Misalignment costs days, not minutes |

Neither system provides the **gating logic** for choosing which posture to adopt. Ponytail defaults to "ship first" and Karpathy defaults to "ask first." A combined system needs the gate.

**The harness's escalation protocol** offers a partial framework: it defines 4 triggers for when to escalate (architecture decisions, unclear requirements, repeated test failures, scope ambiguity). But it's reactive — the agent escalates after hitting the wall, not before.

#### Resolution

The combined system should add a **task-complexity gate** that selects posture:

```
If the ambiguity is structural (architecture, data model, security boundary,
multi-module interaction), stop and ask first — wrong answer costs too much.

If the ambiguity is cosmetic (naming, formatting, which of two equivalent
approaches), default to the laziest option and proceed. Name the assumption
in one line.

If uncertain? The cost of the wrong answer vs. the round-trip to ask 
determines the posture. Err toward asking when in doubt.
```

This is ~7 lines and resolves the entire tension. Ponytail's ultra mode already leans toward "challenge the requirement"; full mode leans toward "ship first, question after"; lite mode leans toward "build what's asked, name alternatives." The gate formalizes what's already implicit in the intensity spectrum.

---

### 2.7 Audit, Review, and Continuous Improvement

| Aspect | Ponytail | Harness | Karpathy |
|---|---|---|---|
| Diff review for over-engineering | ✅ /ponytail-review | ❌ | ❌ |
| Whole-repo over-engineering audit | ✅ /ponytail-audit | ❌ | ❌ |
| Structured review taxonomy | ✅ 5 tags: delete/stdlib/native/yagni/shrink | ❌ | ❌ |
| Harness quality scoring | ❌ | ✅ validate-harness.mjs (5 subsystems, 0-100) | ❌ |
| Harness benchmarking | ❌ | ✅ run-benchmark.mjs | ❌ |
| Harness HTML assessment | ❌ | ✅ render-assessment-html.mjs | ❌ |
| CI integration | ❌ | ✅ --fail-fast flag | ❌ |
| Behavioral benchmark | ✅ benchmarks/ (promptfoo, agentic) | ❌ | ❌ |
| Scoreboard display | ✅ /ponytail-gain | ❌ | ❌ |

#### Analysis

**Each system audits a different thing — all complementary:**

- **Ponytail audits code quality** (over-engineering, complexity, unnecessary deps). Its review/audit skills are the only mechanism in any of the three systems for systematically detecting and categorizing over-engineering. The 5-tag taxonomy (delete/stdlib/native/yagni/shrink) is unique and valuable.
- **Harness audits harness quality** (are the 5 subsystems working? is the agent reliable?). Its validate-harness.mjs scores each subsystem and assigns usability tiers (production/usable/degraded/insufficient). This is meta-auditing — it audits the container, not the code inside.
- **Karpathy has no auditing at all.** It's a static guideline with no detection mechanism.

**The combination is powerful:**
1. Harness validates that the agent has a reliable working environment (container health).
2. Ponytail reviews the agent's actual output for over-engineering (content health).
3. Both can run in CI: harness with `--fail-fast`, Ponytail review as a manual gate.

No conflict. No overlap. Two audit domains, two audit systems.

#### Gap

**The harness's validate-harness.mjs doesn't check for behavioral policy content.** It scores whether `AGENTS.md` exists and contains startup/workflow/done sections, but doesn't evaluate whether those sections contain effective behavioral rules. A harness with an `AGENTS.md` that says "just code bro" scores the same as one with full Ponytail + Karpathy rules. The harness audit is structural, not semantic.

**Value judgment:** This is a known design limitation, not a bug. Semantic evaluation of instruction quality is hard to automate. But the harness could add a lightweight check: "does the AGENTS.md mention over-engineering prevention?" — flag absence as a warning, not a score penalty.

---

## 3. Ponytail-Only Strengths (No Equivalent in Either)

| Feature | Value | Why neither Harness nor Karpathy has it |
|---|---|---|
| **The 6-rung ladder** | Critical | The most concrete, actionable simplicity algorithm across all three systems. Harness is code-production-agnostic. Karpathy says "be simple" without the algorithm. |
| **Intensity levels** (lite/full/ultra) | High | User-adjustable risk tolerance. Neither other system has a dial. |
| **`ponytail:` comment convention + debt ledger** | High | Tracks deliberate shortcuts with ceiling + upgrade path. Unique mechanism for making "later" accountable. |
| **Review/Audit skills** (diff + repo-wide) | High | Systematic over-engineering detection. Harness audits harness structure; Karpathy has no detection. |
| **Safety carve-outs** (validation, security, accessibility, hardware calibration) | High | Explicit "never simplify away" list. Karpathy's simplicity has no safety boundary; a literal reading could cut validation. |
| **Multi-agent delivery** (14 adapters, MCP, hooks, pi extension) | Infrastructure | Distribution, not ruleset. Neither other system ships agents. |
| **Benchmarked efficacy** (54% less LOC, 20% cheaper) | Credibility | Measured, not claimed. Neither other system has published benchmarks. |
| **Output format enforcement** ("Code first. Three lines max.") | Medium | Prevents prose-bloat. Karpathy has no output constraint. Harness's progress.md is structured but doesn't govern agent responses. |
| **Hardware realism** ("a real clock drifts, a sensor reads off") | Medium | Unique domain knowledge. Neither other system addresses physical-world calibration. |

---

## 4. Harness-Only Strengths (No Equivalent in Either)

| Feature | Value | Why neither Ponytail nor Karpathy has it |
|---|---|---|
| **Cross-session state machine** (feature_list.json) | Critical | Ponytail and Karpathy are single-session. The harness is the only system that survives agent restarts. |
| **Verification gate as artifact** (init.sh) | Critical | Runnable, committable, CI-friendly. Ponytail's "one check" is a guideline; Karpathy's verification is a behavior. Neither produces an artifact. |
| **Evidence-gated completion** (DoD + evidence field) | High | Makes "done" auditable. Ponytail cares about code quality, not completion tracking. Karpathy says "verify" but doesn't record evidence. |
| **Dependency-ordered features** | High | Hard constraint preventing out-of-order work. Neither other system has dependency management. |
| **Harness self-audit** (validate-harness.mjs, 5 subsystems, 4 tiers) | High | Scores the container itself. Ponytail audits code; the harness audits the harness. |
| **Environment validation at startup** | High | Catches broken environments before work. Neither other system checks prerequisites. |
| **Decision recording** (context + alternatives) | Medium | Structured decision log. Ponytail's `ponytail:` comments capture shortcuts but not general decisions. |
| **Structured escalation protocol** (4 triggers) | Medium | Gives the agent a clear "when to stop and ask human" path. |
| **7 advanced patterns library** (memory, context, tools, multi-agent, lifecycle, skill-runtime, gotchas) | Medium | Agent runtime engineering — a different domain from behavioral guidelines. |
| **Document type taxonomy** (8 types, YAML frontmatter) | Low | Meta-infrastructure for skill authors. |
| **Scaffolding scripts** (create-harness.mjs, enrich-harness.mjs) | Infrastructure | Makes the harness reproducible. |

---

## 5. Karpathy-Only Strengths (No Equivalent in Either)

| Feature | Value | Why neither Ponytail nor Harness has it |
|---|---|---|
| **Surgical editing discipline** (line-level) | Critical | The single biggest gap. Ponytail governs what code you write; harness governs which files you touch. Neither governs adjacent-line discipline. |
| **Proactive assumption surfacing** ("State your assumptions. If unclear, stop.") | High | Ponytail ships first and questions after; harness escalation is reactive. Karpathy is the only one that pauses before acting. |
| **Test-first ordering** ("Write a reproduction test, then make it pass") | High | Ponytail's "one check" is post-hoc; harness's DoD is order-agnostic. Only Karpathy specifies test-first. |
| **Explicit success criteria definition** | Medium | "Define success criteria. Strong criteria let you loop independently." Neither other system emphasizes criteria *quality*. |
| **Per-step verification plan** (numbered + verify check) | Medium | Harness's progress.md has free-form "What's Next"; no per-step verification. |
| **"No error handling for impossible scenarios"** | Low | Ponytail's safety boundary is hard in one direction ("never cut error handling"); Karpathy softens the other direction ("but don't handle impossible paths"). |
| **"If 200 lines could be 50, rewrite it"** | Low | Explicit rewrite trigger. Ponytail's ladder prevents the 200-line version from being written in the first place, so this is less needed. |

---

## 6. Conflicts and Tensions Matrix

### 6.1 "Ship First, Question After" (Ponytail) vs. "Stop and Ask" (Karpathy)

**Severity:** Genuine tension, resolvable.

**The positions:**
- Ponytail: "Never stall on an answer you can default. Ship the lazy version and question it in the same response."
- Karpathy: "If something is unclear, stop. Name what's confusing. Ask."

**Resolution:** Task-complexity gate (see §2.6). Structural ambiguity → ask first. Cosmetic ambiguity → default and proceed. The cost-of-wrong-answer vs. cost-of-round-trip heuristic selects the posture.

**The harness's role:** Neither Ponytail nor Karpathy nor the harness provides this gating logic natively. It must be added. The harness's escalation protocol provides a partial scaffold but needs the pre-action gate.

---

### 6.2 "One Feature at a Time" (Harness) vs. "Deletion Over Addition" (Ponytail)

**Severity:** Not a conflict — a complement.

- Harness: "Pick exactly one unfinished feature." → Prevents parallel feature sprawl.
- Ponytail: "Deletion over addition." → Within that one feature, prioritize deletion.

The harness limits *breadth* of work; Ponytail limits *depth* within that breadth.

---

### 6.3 "Minimum Code" (Ponytail) vs. "Target Behavior Implemented" (Harness DoD)

**Severity:** Minor tension.

If a `feature_list.json` description is over-specified, the agent has two conflicting directives:
1. Ponytail: Write minimum code. Question over-specified requirements.
2. Harness: Implement target behavior. The feature description IS the spec.

**Resolution:** The harness escalation protocol already covers "Scope ambiguity: Re-read feature_list.json for definition of done." Add "over-specified requirements" as an explicit escalation trigger, allowing the agent to question the spec (Ponytail posture) while staying within the harness protocol.

---

### 6.4 "Stay in Scope" (Harness) vs. "Mention Dead Code You Notice" (Karpathy)

**Severity:** Not a conflict — a clarification needed.

- Harness: "Don't modify files unrelated to the current feature."
- Karpathy: "If you notice unrelated dead code, mention it — don't delete it."

An agent might interpret "stay in scope" as "don't even mention out-of-scope things." The harness should clarify: *mentioning* is allowed and encouraged; *modifying* is prohibited.

---

### 6.5 "One Runnable Check" (Ponytail) vs. "Test-First" (Karpathy)

**Severity:** Minor tension, easily tiered.

- Ponytail: Minimum one assert/demo. Trivial one-liners exempt. No frameworks.
- Karpathy: Write the test first, then make it pass.

Ponytail sets the floor; Karpathy sets the gold standard. They don't conflict — they address different verification rigor levels.

**Resolution:** Tier by task type. Trivial one-liner → no test (Ponytail exemption). Non-trivial logic → one check (Ponytail floor). Bug fix → reproduce first (Karpathy). Multi-step feature → test-first + per-step plan (Karpathy).

---

### 6.6 Ponytail's "Fewest Files Possible" vs. Harness's "Required Artifacts"

**Severity:** Non-conflict.

Ponytail's "fewest files possible" refers to *code* files. The harness's artifacts (feature_list.json, progress.md, init.sh, session-handoff.md) are *meta* files — state infrastructure, not application code. An agent should not delete the harness to satisfy "fewest files possible."

**Resolution:** Ponytail's "fewest files" applies to the project's source code, not to harness artifacts. This is implicit but should be explicit in a combined ruleset.

---

## 7. Criticality Map

This ranks every gap by impact on agent reliability — how much worse does the agent perform without it?

| Rank | Gap | Missing In | Impact | Lines to fix |
|---|---|---|---|---|
| 1 | **Surgical editing discipline** | Ponytail + Harness | Agents pad diffs with unrelated changes. Undermines Ponytail's "shorter diff" and Harness's "stay in scope." Most common failure mode. | 5 |
| 2 | **Cross-session state machine** | Ponytail + Karpathy | Without harness, agent forgets everything between sessions. Ponytail and Karpathy are single-session. | N/A — use harness |
| 3 | **Code minimalism policy** (the ladder) | Harness + Karpathy | Without Ponytail, harness tracks over-built features just as faithfully as minimal ones. Karpathy says "be simple" without the algorithm. | N/A — use Ponytail |
| 4 | **Verification as infrastructure** (init.sh) | Ponytail + Karpathy | Without harness, verification is a guideline, not an artifact. No CI integration. No environment check. | N/A — use harness |
| 5 | **Proactive assumption surfacing** | Ponytail + Harness | Agent silently assumes wrong interpretation, wastes session. Ponytail ships first; harness escalates reactively. | 3-5 |
| 6 | **Test-first ordering** | Ponytail + Harness | Test-after is weaker: test rubber-stamps code, doesn't catch gaps. | 2 |
| 7 | **Feature dependency ordering** | Ponytail + Karpathy | Agent can work on features out of order, building on unstable foundations. | N/A — use harness |
| 8 | **Debt tracking** (ponytail: comments) | Harness + Karpathy | Deliberate shortcuts rot into permanent debt. No mechanism to track "deferred until X." | N/A — use Ponytail |
| 9 | **Intensity levels** | Harness + Karpathy | No user-adjustable risk dial. One-size-fits-all simplicity policy. | N/A — use Ponytail |
| 10 | **Over-engineering review/audit** | Harness + Karpathy | No systematic mechanism to detect over-engineering after the fact. | N/A — use Ponytail |
| 11 | **Per-step verification plan** | Ponytail + Harness | Multi-step work lacks structured verification at each step. | 3 |
| 12 | **"No error handling for impossible scenarios"** | Ponytail + Harness | Ponytail's safety boundary may encourage over-handling. | 2 |
| 13 | **Terse output enforcement** | Harness + Karpathy | Agents pad responses with prose. Ponytail's "code first, three lines max" is the only output constraint. | N/A — use Ponytail |
| 14 | **Harness self-audit** | Ponytail + Karpathy | No way to measure whether the agent's working environment is healthy. | N/A — use harness |

---

## 8. Unified Architecture: What Full Integration Looks Like

### 8.1 File Map

```
project/
├── AGENTS.md                    ← Harness template + Ponytail rules + Karpathy rules
├── CLAUDE.md                    ← "See AGENTS.md"
├── feature_list.json            ← Harness state machine
├── progress.md                  ← Harness continuity log
├── init.sh                      ← Harness verification gate
├── session-handoff.md           ← Harness lifecycle artifact
├── .pi/
│   └── skills/
│       └── ponytail/            ← Ponytail policy engine
└── .claude/
    └── CLAUDE.md                ← Per-agent copy (if different agent)
```

### 8.2 Unified AGENTS.md Content Map

```markdown
# AGENTS.md

## Startup Workflow                                    [Harness]
  1. Confirm working directory
  2. Read this file completely
  3. Read project docs
  4. Run ./init.sh
  5. Read feature_list.json
  6. Review recent commits (git log --oneline -5)
  7. State your understanding in one line           [Karpathy §1]
     If multiple interpretations, name them.
     If structurally unclear, stop and ask.
  8. Confirm Ponytail mode (/ponytail status)        [Ponytail]

## Coding Policy                                       [Ponytail — the ladder]
  1. Does this need to exist? (YAGNI)
  2. Stdlib does it?
  3. Native platform feature?
  4. Installed dependency?
  5. One line?
  6. Minimum code that works.

## Coding Standards                                    [Ponytail + Karpathy §2]
  - No speculative features. No unrequested abstractions.
  - No unrequested "flexibility" or configurability.
  - No error handling for impossible scenarios.       [Karpathy unique]
  - Mark deliberate shortcuts with ponytail:          [Ponytail unique]
    "ponytail: <ceiling>, <upgrade trigger>"

## Editing Discipline                                  [Karpathy §3 — CRITICAL]
  - Touch only what the feature requires.
  - Don't "improve" adjacent code, comments, formatting.
  - Match existing style. Don't refactor unbroken things.
  - Mention unrelated issues; don't fix them here.
  - Remove only the imports/variables/functions YOUR changes made unused.

## Working Rules                                       [Harness + Ponytail]
  - One feature at a time (feature_list.json)
  - Stay in scope (feature file set)
  - Verification required before claiming done
  - Update artifacts (progress.md, feature_list.json)
  - Leave clean state (next session runs ./init.sh)

## Required Artifacts                                  [Harness]
  - feature_list.json, progress.md, init.sh, session-handoff.md

## Definition of Done                                  [Harness + Karpathy §4]
  - Target behavior implemented
  - For bugs: reproduction test written FIRST          [Karpathy]
  - For features: verification check written FIRST     [Karpathy]
  - Required verification ran and passed
  - Evidence recorded in feature_list.json or progress.md
  - Repository restartable from ./init.sh

## Before Multi-Step Work                              [Karpathy §4]
  State a one-line success criterion.
  If >2 files or >3 steps, add a numbered plan:
    1. [Step] → verify: [check]
    2. [Step] → verify: [check]

## End of Session                                      [Harness]
  1. Update progress.md
  2. Update feature_list.json
  3. Record blockers/risks
  4. Commit in safe state
  5. Leave clean (./init.sh must pass)

## Escalation                                          [Harness + Ponytail]
  - Architecture decisions: consult docs or ask
  - Unclear / over-specified requirements: ask        [Ponytail: question specs]
  - Repeated test failures: update progress, flag
  - Scope ambiguity: re-read feature_list.json

## Safety (Never Simplify Away)                        [Ponytail]
  - Input validation at trust boundaries
  - Error handling that prevents data loss
  - Security measures, accessibility
  - Hardware calibration (platform ≠ spec ideal)
  - Anything the user explicitly asked to keep

## Verification Commands                               [Harness]
  ./init.sh
  - npm test
  - npm run lint
```

### 8.3 Integration Cost

| File | Change | Lines |
|---|---|---|
| Harness `templates/agents.md` | Add Coding Policy (ladder), Coding Standards, Editing Discipline, Before Multi-Step Work, Safety | ~30 |
| Harness `templates/agents.md` | Modify Startup Workflow (add steps 7-8), Definition of Done (add test-first), Escalation (add over-specified) | ~8 |
| Harness `templates/progress.md` | Add per-step verification to "What's Next" | ~3 |
| Ponytail `skills/ponytail/SKILL.md` | Add clarity: "fewest files" = source code, not harness artifacts | 1 |
| New: `GATE.md` or inline | Add task-complexity gate for Ponytail-vs-Karpathy posture | ~7 |

**Total: ~50 lines across 4 files. No architectural changes. No new dependencies. No conflicts.**

---

## 9. What NOT to Change

These features are correct as-is and should not be modified:

| System | Feature | Why keep unchanged |
|---|---|---|
| Ponytail | The 6-rung ladder | Core IP, benchmarked, correct |
| Ponytail | Intensity levels (lite/full/ultra) | User-tested, solves real risk-tolerance needs |
| Ponytail | `ponytail:` comment convention | Unique mechanism, proven via debt ledger |
| Ponytail | Review/Audit skills | Only systematic over-engineering detection in any system |
| Ponytail | Safety carve-outs | Critical guardrails — do not weaken |
| Ponytail | Output format ("code first, 3 lines max") | Proven to reduce prose bloat |
| Ponytail | Multi-agent delivery infrastructure | Distribution value, not ruleset content |
| Harness | 5-subsystem model | Correct abstraction, tested |
| Harness | feature_list.json + progress.md | Right artifact granularity for cross-session state |
| Harness | init.sh as runnable verification | Artifact beats guideline every time |
| Harness | validate-harness.mjs | Only self-audit tool in any system |
| Harness | 7 patterns library | Properly progressive-disclosed, loaded on demand |
| Harness | Document type taxonomy | Makes the skill itself agent-friendly |
| Harness | Startup workflow (steps 1-6) | Correct grounding ritual |
| Karpathy | Surgical Changes principle | Fills the largest gap in both other systems |
| Karpathy | Test-first ordering for bugs | Stronger than test-after |
| Karpathy | Per-step verification plan format | Concrete, actionable, scannable |

---

## 10. Conclusion

**These three systems form a complete agent reliability stack.** Each addresses a layer the others don't:

- **Without the harness:** Ponytail and Karpathy produce well-crafted, surgically-edited, minimally-verified code — but the agent has amnesia between sessions, no state tracking, no environment validation, and no audit trail. The code is good; the workflow is fragile.

- **Without Ponytail:** The harness and Karpathy produce well-tracked, surgically-edited, properly-verified code — but the agent over-builds, adds unnecessary dependencies, and writes 400 lines when `<input type="date">` would do. The workflow is robust; the code is bloated.

- **Without Karpathy:** The harness and Ponytail produce well-tracked, minimal, properly-verified code — but the agent pads every diff with adjacent-code reformatting, silently assumes the wrong interpretation, and claims "done" before tests pass. The workflow is robust; the code is minimal; the process is sloppy.

**All three together:**
- The harness provides the container (state, verification, continuity).
- Ponytail provides the code production policy (ladder, intensities, debt tracking).
- Karpathy provides the behavioral firmware (surgical editing, proactive surfacing, test-first verification).

The integration cost is ~50 lines across 4 files. No rewrite. No conflict. Pure composition.

---

## Appendix A: Quick Reference — Who Covers What

| Concern | Ponytail | Harness | Karpathy | Best Combined |
|---|---|---|---|---|
| Code minimalism | ✅✅✅ | ❌ | ✅ | Ponytail |
| Native/platform-first | ✅✅✅ | ❌ | ❌ | Ponytail |
| Dependency discipline | ✅✅ | ❌ | ❌ | Ponytail |
| Surgical editing | ❌ | ❌ | ✅✅✅ | Karpathy |
| Session continuity | ❌ | ✅✅✅ | ❌ | Harness |
| Feature state tracking | ❌ | ✅✅✅ | ❌ | Harness |
| Verification gate | ✅ | ✅✅✅ | ✅ | Harness (artifact) + Karpathy (process) |
| Environment validation | ❌ | ✅✅✅ | ❌ | Harness |
| Proactive assumption surfacing | ❌ | ❌ | ✅✅✅ | Karpathy |
| Test-first ordering | ❌ | ❌ | ✅✅ | Karpathy |
| Over-engineering detection | ✅✅✅ | ❌ | ❌ | Ponytail |
| Debt tracking | ✅✅✅ | ❌ | ❌ | Ponytail |
| Intensity/user control | ✅✅✅ | ❌ | ❌ | Ponytail |
| Safety boundaries | ✅✅✅ | ❌ | ❌ | Ponytail |
| Output terseness | ✅✅ | ❌ | ❌ | Ponytail |
| Escalation protocol | ❌ | ✅✅ | ❌ | Harness |
| Decision recording | ❌ | ✅✅ | ❌ | Harness |
| Harness self-audit | ❌ | ✅✅✅ | ❌ | Harness |

## Appendix B: Quick Reference — Lines to Add Per File

| File | Section | Lines | Source |
|---|---|---|---|
| `templates/agents.md` | Startup Workflow step 7 | 3 | Karpathy §1 |
| `templates/agents.md` | Startup Workflow step 8 | 1 | Ponytail |
| `templates/agents.md` | Coding Policy (ladder) | 8 | Ponytail |
| `templates/agents.md` | Coding Standards | 6 | Ponytail + Karpathy §2 |
| `templates/agents.md` | Editing Discipline | 6 | Karpathy §3 |
| `templates/agents.md` | Definition of Done (test-first) | 2 | Karpathy §4 |
| `templates/agents.md` | Before Multi-Step Work | 5 | Karpathy §4 |
| `templates/agents.md` | Safety | 7 | Ponytail |
| `templates/agents.md` | Escalation (over-specified) | 1 | Ponytail |
| `templates/progress.md` | What's Next (per-step verify) | 3 | Karpathy §4 |
| `skills/ponytail/SKILL.md` | Clarify "fewest files" scope | 1 | Harness awareness |
| New: complexity gate | Inline or separate | 7 | Synthesis |
| **Total** | | **~50** | |
