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
