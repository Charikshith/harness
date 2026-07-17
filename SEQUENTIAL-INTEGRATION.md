# Sequential Integration Guide: Harness → Karpathy → Ponytail

The v3 harness **embeds all three systems** into one template (~50 lines of integration cost). But if you prefer to layer them separately — installing each as its own session, its own skill, or its own step — here's the order, the rationale, and what each session delivers.

## The Order

```
Session 1: HARNESS           Session 2: KARPATHY           Session 3: PONYTAIL
─────────────────────        ─────────────────────         ─────────────────────
Container (OS)               Process (scheduler)            Policy (optimizer)

AGENTS.md (skeleton)    →    + Startup step 7         →    + Coding Policy ladder
feature_list.json             + Surgical editing            + Coding Standards
progress.md                   + Test-first DoD              + Intensity levels
init.sh                       + Multi-step planning         + ponytail: comments
session-handoff.md            + Safety carve-outs           + Debt tracking
```

## Why This Order

### 1. Harness — Infrastructure (must come first)

> **You can't layer process or policy onto nothing.**

The agent needs a home before you teach it manners. Without the harness:
- No memory between sessions (Karpathy and Ponytail are single-session)
- No state tracking (feature_list.json, progress.md)
- No verification gate (init.sh)
- No artifact routing (agent doesn't know what to read before starting)

The harness is the **operating system**. The other two are applications. Install the OS first.

### 2. Karpathy — Process (second)

> **Once the agent has a home, teach it how to work.**

Karpathy's principles are behavioral upgrades that make the agent reliable **within** the harness structure:

| Karpathy principle | What it fixes |
|---|---|
| §1 Think Before Coding | Agent jumps to implementation without understanding the task |
| §2 Simplicity / YAGNI | Agent over-engineers (lightweight version, Ponytail's ladder is stricter) |
| **§3 Surgical Changes** | **Agent pads diffs with unrelated changes — the #1 failure mode** |
| §4 Test-First Verification | Agent claims "done" without verifying |

The harness tracks "are we done?" — Karpathy ensures we don't claim done prematurely or make a mess along the way.

### 3. Ponytail — Content Policy (third)

> **Once the agent works well, make it work minimally.**

Ponytail governs **what code** gets written or skipped. It's the most specialized layer:

- **The 6-rung ladder**: YAGNI → stdlib → native → dep → one-liner → minimum
- **Intensity levels**: lite / full / ultra (user-adjustable risk dial)
- **Debt tracking**: `ponytail:` comment convention + debt ledger
- **Review/audit**: Systematic over-engineering detection

This matters once the agent already has good infrastructure and good habits. If you apply Ponytail first, the agent writes minimal *wrong* code, forgets everything between sessions, and pads diffs with unrelated changes. Minimal wrong code is still wrong.

## Dependency Chain

| Layer | Depends on | What breaks without the dependency |
|---|---|---|
| **Ponytail** | Karpathy + Harness | Surgical editing without the ladder is still clean. Ladder without surgical editing = minimal code with bloated diffs. Ladder without harness = minimal code that can't be resumed next session |
| **Karpathy** | Harness | Test-first without state tracking is a guideline. With harness, it's gated and auditable. Session handoff without harness = no file to put the handoff in |
| **Harness** | Nothing | It's the OS. It runs on bare metal |

## What Each Session Delivers

### Session 1: Harness Install

```
Files created:
  AGENTS.md          — Skeleton with startup workflow, working rules, verification, escalation
  CLAUDE.md          — Pointer to AGENTS.md
  feature_list.json  — Feature state tracker
  progress.md        — Session continuity log
  session-handoff.md — Multi-session handoff
  init.sh            — Verification entrypoint

Agent gains:
  ✅ Cross-session memory (reads progress.md + feature_list.json on restart)
  ✅ Verification gate (can't claim done without init.sh passing)
  ✅ One-feature-at-a-time discipline
  ✅ Structured handoff between sessions
```

### Session 2: Karpathy Process Layer

```
Files modified:
  AGENTS.md  — Adds:
    Startup Workflow step 7: "State your understanding"
      → structural ambiguity → stop and ask
      → cosmetic ambiguity → default and proceed
    Editing Discipline: touch only required lines, match style, no refactors
    Definition of Done: bugs → reproduce first; features → write check first
    Before Multi-Step Work: one-line success criterion + per-step verify plan
    Safety: validation, data-loss prevention, security, accessibility, hardware

Agent gains:
  ✅ Proactive assumption surfacing (catches ambiguity before it wastes a session)
  ✅ Surgical editing (diffs touch only the feature, no drive-by refactors)
  ✅ Test-first verification (stronger than test-after)
  ✅ Multi-step planning gate (no more jumping into complex work blind)
```

### Session 3: Ponytail Policy Layer

```
Files modified:
  AGENTS.md  — Adds:
    Coding Policy: the 6-rung ladder (YAGNI → stdlib → native → dep → one-liner → minimum)
    Coding Standards: no abstractions, no speculative code, ponytail: comment convention
    Intensity: lite/full/ultra mode toggle

  progress.md  — Adds:
    Ponytail Debt section: tracks deliberate shortcuts with ceiling + upgrade path

Agent gains:
  ✅ The ladder reflex: stops at the first rung that holds, never reaches for a dep first
  ✅ Shortcut accountability: ponytail: comments carry debt forward
  ✅ User-adjustable risk: /ponytail lite|full|ultra
  ✅ Over-engineering review: /ponytail-review (diff audit)
  ✅ Whole-repo audit: /ponytail-audit (finds everything that can be deleted)
```

## Why Not a Different Order?

### Harness last?
Agent works one session, forgets everything. Every session is Session 1. Karpathy's handoff rules have no file to write to. Ponytail's debt ledger resets. The agent is a goldfish.

### Ponytail first?
Agent writes one-liners in a 50-line-diff wrapper. The ladder says "minimum code" but the diff includes reformatting, renamed variables, and a drive-by refactoring of an unrelated module. Without surgical editing, minimal code is hidden inside a maximal diff.

### Karpathy + Ponytail without Harness?
Best single-session agent you'll ever have. Next session: blank slate, no state, no memory, no continuity. Fine for a one-off script. Disastrous for a multi-day feature.

## The v3 Shortcut

The v3 harness template inlines all three because the integration cost is trivial (~50 lines across 4 files) and the combined behavior is greater than the sum:

```
Harness (structure) + Karpathy (process) + Ponytail (policy) → Agent reliability stack
```

But if you're layering sequentially — teaching an existing project, onboarding a team, or building understanding step by step — the order is **Harness → Karpathy → Ponytail**. Infrastructure before behavior before optimization. OS before scheduler before compiler optimizer.

---

## Adding ECC (Everything Claude Code)

ECC is the **scale layer** — 67 specialized agents, 278 skills, 94 commands, hooks automation, per-language rule matrices. It's orthogonal to the other three: it doesn't replace them, it wraps them.

ECC can go **first** or **last** depending on your starting point. Harness can never go last.

### The Decision Tree

```
Starting from scratch?
│
├─ Multi-language? Multi-developer? Enterprise? Already using Claude Code plugins?
│   → ECC → Harness → Karpathy → Ponytail
│   (ECC is your platform. Harness gives it state. Karpathy + Ponytail give it discipline.)
│
└─ Single language? Solo developer? One project? No plugin runtime yet?
    → Harness → Karpathy → Ponytail → (optional: ECC later if you scale)
    (Harness makes your existing agent reliable. Add ECC only when one agent isn't enough.)
```

### Path A: ECC-First ("ECC is my agent platform")

Use this when ECC is the runtime you're already on — the Claude Code plugin is installed, the skill catalog is your starting point. ECC provides the agent surface, hooks, and specialist catalog. You're building reliability *on top of* scale.

```
Session 1: ECC              Session 2: HARNESS          Session 3: KARPATHY        Session 4: PONYTAIL
─────────────────           ─────────────────           ────────────────           ────────────────
Platform (runtime)          Container (state)           Process (behavior)         Policy (content)

67 agents, 278 skills   →   feature_list.json      →   Surgical editing       →   6-rung ladder
94 commands, hooks           progress.md                 Test-first DoD              Intensity levels
Per-language rules           init.sh                     Assumption surfacing        ponytail: comments
Session persistence          session-handoff.md          Multi-step planning         Debt tracking
Enterprise controls          6-dimension scoring         Safety carve-outs           Review/audit
```

**Why ECC first:** ECC is the runtime — the plugin you install that provides the agent surface, hooks, commands, and skill catalog. You build on top of it. Harness adds shared state to ECC's agents. Karpathy and Ponytail add behavioral discipline to ECC's agents.

**Why not ECC last in this scenario:** ECC is your foundation. You can't retrofit the platform after building on a different one — ECC's hooks, commands, agent routing, and install surface are structural, not just content. It's like installing the OS after the applications.

#### Session 1: ECC Platform Install

```
Install:
  npm / plugin marketplace install
  Full profile: agents (67), skills (278), commands (94), hooks, rules (22 languages)

Agent gains:
  ✅ 67 specialized sub-agents (planner, architect, code-reviewer, tdd-guide, security-reviewer...)
  ✅ 278 reusable skill modules (coding-standards, react-patterns, tdd-workflow, api-design...)
  ✅ 94 slash commands (/tdd, /plan, /code-review, /build-fix, /feature-dev...)
  ✅ Hook automation (PreToolUse validation, Stop quality gates, SessionStart context loading)
  ✅ Per-language rules (22 languages × 5-7 concern files each)
  ✅ Continuous learning (observer hooks, session persistence)
  ✅ Enterprise controls (install profiles, team config sync, audit allowlists)

ECC gap at this stage:
  ❌ No shared feature state — 67 agents, zero files that say "we're working on X, Y is done"
  ❌ No runnable verification gate — TDD skill exists but nothing forces test execution
  ❌ No surgical editing policy — coding-standards has KISS/DRY/YAGNI but nothing about diff hygiene
  ❌ No assumption surfacing — agents plan but don't proactively state their interpretation
```

#### Session 2: Harness Layer (added to ECC)

```
Files created:
  feature_list.json  — Shared feature state tracker (every ECC agent reads this)
  progress.md        — Session continuity log (what's done, what's next, what's blocked)
  init.sh            — Runnable verification entrypoint (gates all ECC agents)
  session-handoff.md — Structured handoff between ECC agents across sessions

Files modified:
  AGENTS.md  — Adds: startup workflow (read these files in this order)
  .claude/commands/feature-dev.md  — Wired to feature_list.json + progress.md + init.sh

Agent gains:
  ✅ Every ECC agent now knows which feature is active and what's done
  ✅ Verification gate — agent can't delegate "done" claim to a specialist without init.sh passing
  ✅ Session continuity — observer hooks capture patterns; progress.md captures state
  ✅ Agent handoff — when code-reviewer finishes, the next agent knows what was found
```

#### Session 3: Karpathy Process Layer

```
Files modified:
  AGENTS.md  — Adds:
    Startup step 7: State your understanding → structural → stop and ask; cosmetic → proceed
    Editing Discipline: touch only required lines, match style, no drive-by refactors
    Definition of Done: bugs → reproduce first; features → write check first
    Before Multi-Step Work: one-line success criterion + per-step verify plan

  rules/common/coding-style.md  — Adds:
    Surgical editing rule (the single most impactful behavioral rule ECC is missing)

Agent gains:
  ✅ ECC agents now edit surgically — the code-reviewer reports quality, but the editor
    (often the generalist) now doesn't pad diffs in the first place
  ✅ Proactive assumption surfacing — before delegating to planner, the generalist
    states its understanding. Wrong interpretation caught before 3 agents waste time
  ✅ Test-first ordering — tdd-guide already does TDD, but now DoD gates all agents
  ✅ Multi-step planning — planner gets a one-line criterion before producing a plan
```

#### Session 4: Ponytail Policy Layer

```
Files modified:
  AGENTS.md  — Adds:
    Coding Policy: 6-rung ladder
    Coding Standards: no abstractions, ponytail: comments

  rules/common/coding-style.md  — Adds:
    ponytail: comment convention

  progress.md  — Adds:
    Ponytail Debt section

Files created:
  skills/ponytail-policy/SKILL.md  — ECC skill wrapper for the ladder (installable, versioned)

Agent gains:
  ✅ Every ECC agent operates on the ladder — planner doesn't plan a dependency cascade,
    code-reviewer flags reach-for-a-dep-first as a review finding
  ✅ Shortcut accountability — ponytail: comments survive across sessions via progress.md
  ✅ User-adjustable risk — /ponytail lite|full|ultra
  ✅ Whole-repo and diff audit via ECC commands
```

### Path B: Harness-First ("I'm building a single-agent project, ECC is the optional upgrade")

Use this when you're starting simple — one language, one developer, one project. You don't need 67 agents and 22 language rule matrices. Get the single agent reliable first, then scale.

```
Session 1: HARNESS           Session 2: KARPATHY         Session 3: PONYTAIL        Session 4: ECC
─────────────────           ─────────────────           ────────────────           ──────────────
Container (state)           Process (behavior)          Policy (content)           Scale (specialists)

feature_list.json       →   Surgical editing       →   6-rung ladder          →   67 specialists
progress.md                 Test-first DoD              Intensity levels           278 skills
init.sh                     Assumption surfacing        ponytail: comments         Per-language rules
session-handoff.md          Multi-step planning         Debt tracking              Hook automation
```

**Why ECC last:** ECC is overkill for one language, one developer. You don't need 67 agents and 22 language rule matrices until you hit multi-language, multi-developer complexity. Get the single agent reliable first, then scale. When you do add ECC:
- ECC's 67 agents read the harness files (feature_list.json, progress.md) for shared state
- ECC's rules layer adds per-language depth on top of the behavioral policies
- ECC's hooks automate verification (init.sh wired as a pre-commit hook)
- ECC's skill catalog makes Ponytail and Karpathy policies installable, not just embedded

### Why ECC Can Go First OR Last (But Harness Can Never Go Last)

ECC is **orthogonal** to the other three — it doesn't replace them, it wraps them. It provides a runtime with specialists, hooks, and skills. Harness provides shared state for whoever is running. So:

| ECC first | ECC last |
|---|---|
| ECC is the platform. Harness is the state layer you add to it. | Harness is the base. ECC is the scale layer you add to it. |
| You're already using Claude Code with plugins. | You're starting from zero. |
| 67 agents need shared state → Harness gives it. | One agent is reliable → ECC multiplies it. |

Harness, by contrast, must always come **before** Karpathy and Ponytail — because both need state tracking to survive across sessions. Karpathy without Harness = great single-session behavior, blank slate next session. Ponytail without Harness = debt ledger resets every session.

### Extended Dependency Chain

```
Ponytail  ──depends on──→  Karpathy  ──depends on──→  Harness
  (ladder)                   (surgical editing)          (state/files)

ECC  ──benefits from──→  Harness
  (agents still forget        (gives ECC agents
   between sessions            shared state)
   without it)
```

| Layer | Depends on | What breaks without the dependency |
|---|---|---|
| **Ponytail** | Karpathy + Harness | Ladder without surgical editing = minimal code with bloated diffs. Ladder without harness = debt resets every session. |
| **Karpathy** | Harness | Test-first without state tracking is a guideline. With harness, it's gated and auditable. |
| **Harness** | Nothing | It's the OS. Runs on bare metal. |
| **ECC** | Nothing (structurally) | ECC's agents, skills, and hooks don't *depend* on harness files. But **without Harness, ECC agents still forget between sessions** — 67 agents with no shared feature state is chaos. ECC *benefits* from Harness even though it doesn't require it. |

### The Full Stack (All Four)

```
ECC (orchestration)
 ├─ Route to specialists (planner → tdd-guide → code-reviewer → build-resolver)
 ├─ Hook automation (PreToolUse validation, Stop quality gates, SessionStart context)
 ├─ Per-language rules (22 × 5-7 concern files)
 └─ Continuous learning (observer hooks, session persistence)

HARNESS (state + verification)
 ├─ feature_list.json (shared truth for all ECC agents)
 ├─ progress.md (continuity log)
 ├─ init.sh (verification gate)
 └─ session-handoff.md (agent-to-agent handoff)

AGENTS.md (behavioral policies)
 ├─ Ponytail: Coding Policy ladder, Coding Standards, Safety Carve-Outs
 ├─ Karpathy: Editing Discipline, Test-First DoD, Multi-Step Planning, Assumption Surfacing
 └─ Harness: Startup Workflow, Working Rules, Escalation
```

| Scenario | Without Harness | With Harness |
|---|---|---|
| **ECC agent works on a 3-day feature** | Session 2: agent reloads all files from scratch. Re-discovers what's done. | Session 2: agent reads progress.md, feature_list.json. Knows exactly what's done and what's next. |
| **ECC code-reviewer finds a pattern** | Reports it. No persistent record outside the diff comment. | Records pattern in progress.md "Notes for Next Session." The next agent benefits. |
| **ECC tdd-guide finishes testing** | Tests pass. No gate on the next session. | init.sh gates verification. Next session can't proceed until tests pass. |
| **Generalist agent with Ponytail ladder** | Writes minimal code but forgets shortcuts from last session. | progress.md Ponytail Debt section carries shortcuts forward with ceiling + upgrade path. |
