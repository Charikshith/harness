# Four-Way Gap Analysis: Harness-Creator v3 ↔ Ponytail ↔ Karpathy CLAUDE.md ↔ ECC

**Date:** 2025-07-17
**Scope:** Structural, behavioral, and scale comparison across four systems for AI coding agent reliability.
**Systems analyzed:**
- **Harness-Creator v3** (v0.3.0) — Agent harness framework with embedded behavioral policies, 6-dimension scoring
- **Ponytail** v0.1.0 — Code minimalism policy (6-rung ladder, intensity levels, debt tracking)
- **Karpathy CLAUDE.md** — Behavioral principles (think first, edit surgically, test-first, surface ambiguity)
- **ECC** v2.0.0 — Everything Claude Code — 67 agents, 278 skills, 94 commands, hooks, rules, enterprise governance

**Perspective:** Senior Engineer / Architect. Every claim: is it actually needed, how does it add value, what are the tradeoffs.

---

## Executive Summary

These four systems are **four strategies for the same problem**: how to make an AI coding agent reliable. But they solve it at completely different layers of the stack, using completely different mechanisms. They don't compete. A project using all four is strictly more reliable than any subset.

```
┌──────────────────────────────────────────────────────────────────┐
│                         ECC                                      │
│      Agent orchestration at scale — 67 specialists,              │
│      278 skills, 94 commands, hooks, rules, enterprise           │
│                                                                  │
│  ┌──────────────────────────────────────────────────────────┐    │
│  │              HARNESS-CREATOR v3                           │    │
│  │       Structural container — session continuity,          │    │
│  │       state tracking, verification gates, scoring         │    │
│  │                                                           │    │
│  │  ┌───────────────────────────────────────────────────┐    │    │
│  │  │                 AGENTS.md / CLAUDE.md             │    │    │
│  │  │                                                   │    │    │
│  │  │  ┌──────────────────────────────────────────┐     │    │    │
│  │  │  │            PONYTAIL                       │    │    │    │
│  │  │  │  Code policy — ladder, intensities,       │    │    │    │
│  │  │  │  debt tracking, review/audit              │    │    │    │
│  │  │  │                                           │    │    │    │
│  │  │  │  ┌──────────────────────────────────┐     │    │    │    │
│  │  │  │  │     KARPATHY CLAUDE.md           │     │    │    │    │
│  │  │  │  │  Process — think first,          │     │    │    │    │
│  │  │  │  │  edit surgically, test-first     │     │    │    │    │
│  │  │  │  │  surface ambiguity               │     │    │    │    │
│  │  │  │  └──────────────────────────────────┘     │    │    │    │
│  │  │  └──────────────────────────────────────────┘    │    │    │
│  │  └───────────────────────────────────────────────────┘    │    │
│  │                                                           │    │
│  │  Artifacts: feature_list.json, progress.md,               │    │
│  │  init.sh, session-handoff.md                              │    │
│  └──────────────────────────────────────────────────────────┘    │
│                                                                  │
│  Supporting: 7 reference patterns, 15 evals,                    │
│  6-dimension scoring, enrichment scripts                        │
└──────────────────────────────────────────────────────────────────┘
```

| System | Strategy | Layer | Mechanism | Scale |
|---|---|---|---|---|
| **ECC** | Agent-first orchestration | Scaling / dispatch | 67 specialists + 278 skills + hooks | Massive |
| **Harness-Creator v3** | Structural reliability | Container / state | 6-subsystem model + verification gates | ~40 files |
| **Ponytail** | Code minimalism | Content policy | 6-rung ladder + intensity levels + debt | ~30 lines |
| **Karpathy CLAUDE.md** | Process rigor | Behavioral firmware | 4 principles + assumption surfacing | 1 file |

---

## 1. The Four Strategies

### 1.1 ECC — Scale Strategy ("Throw specialists at it")

**Premise:** One generalist agent is unreliable. Instead, route every task to a domain specialist — a planner, a reviewer, a security auditor, a build resolver — each with its own prompt, tools, and model.

**Delivery:**
- 67 specialized sub-agents (planner, architect, code-reviewer, tdd-guide, security-reviewer, 62 more)
- 278 skills (coding-standards, react-patterns, tdd-workflow, api-design, security-review, ...)
- 94 commands (slash-entry compatibility shims)
- 22 language rule matrices (5-7 concern files per language: coding-style, patterns, security, testing, hooks)
- Hooks system (PreToolUse, PostToolUse, SessionStart, PreCompact, Stop) with matcher-based JSON registration
- Memory persistence lifecycle (session-start, observer, pre-compact, session-end)
- Enterprise governance controls
- Install profiles (lite/full/enterprise)
- Team config sync
- Plugin marketplace surface
- MCP server configurations
- Cross-harness surface (Claude Code, Cursor, Codex, Windsurf, Gemini, OpenCode, Kimi, Qwen, Trae, Zed, CodeBuddy)

**When it shines:** Complex multi-domain projects. Refactoring that spans frameworks. Brownfield codebases where no one agent knows the whole stack. Enterprise teams with governance requirements.

**When it's overkill:** Simple single-language projects. One-person repos. Tasks that fit in one session with one agent.

### 1.2 Harness-Creator v3 — Structure Strategy ("Give the agent a home")

**Premise:** Agents fail because they lose state between sessions, don't verify before claiming done, and have no structural guardrails. Fix this with files, not prompts.

**Delivery:**
- AGENTS.md template (~130 lines) with startup workflow, working rules, coding policy, editing discipline, safety, verification, escalation
- feature_list.json — feature state tracker (source of truth)
- progress.md — session continuity log
- init.sh — runnable verification entrypoint
- session-handoff.md — structured handoff between sessions
- 7 reference patterns (lifecycle, memory, tools, context, multi-agent, skill-runtime, gotchas)
- 6-dimension validation scoring (Instructions, State, Verification, Scope, Lifecycle, Behavioral)
- Enrichment script for gap remediation
- 15 evals with expectations
- HTML assessment reports

**When it shines:** Any project that needs multi-session development. Single-agent workflows. Small-to-medium teams. Any agent that forgets between sessions.

**When it's overkill:** One-off scripts. Tasks that finish in one session without state.

### 1.3 Ponytail — Content Policy Strategy ("Write less code")

**Premise:** Agents over-engineer. They reach for dependencies, write abstractions, and produce 400 lines where 4 would do. Fix this with a reflex: a ladder that stops at the first sufficient rung.

**Delivery:**
- 6-rung ladder: YAGNI → stdlib → native → dep → one-liner → minimum
- Intensity levels: lite / full / ultra (user-adjustable risk dial)
- `ponytail:` comment convention for deliberate shortcuts with ceiling + upgrade path
- Safety carve-outs (validation, data-loss prevention, security, hardware realism)
- Debt tracking skill (`/ponytail-debt`)
- Review skill (diff audit for over-engineering)
- Audit skill (whole-repo bloat detection)
- 14 agent platform adapters
- MCP server for external agent integration
- Pi extension for pi coding agent

**When it shines:** Any project where code volume is the pain point. Teams tired of npm install cascades. Legacy codebases that need aggressive simplification.

**When it's overkill:** Projects that already have strict code review. Research/exploratory code where volume is expected. When the agent already writes minimal code.

### 1.4 Karpathy CLAUDE.md — Process Strategy ("Work correctly, not just efficiently")

**Premise:** Agents write code that's clean but wrong — they silently assume the wrong interpretation, pad diffs with unrelated changes, and claim done without verifying. Fix this with process: think first, edit surgically, verify before claiming.

**Delivery:**
- §1 Think Before Coding — state understanding, surface ambiguity
- §2 Simplicity / YAGNI — lightweight version of Ponytail's ladder
- §3 Surgical Changes — touch only required lines, match existing style
- §4 Test-First Execution — bugs: reproduce first; features: write check first
- Multi-step planning gate with one-line success criterion
- 200→50 rewrite trigger for complexity

**When it shines:** Any agent that pads diffs, makes assumptions without checking, or claims "done" prematurely. The surgical editing rule alone is worth the whole file.

**When it's overkill:** When the agent already works with process rigor. One-character fixes.

---

## 2. Structural Comparison — Harness 6-Dimension Model

Evaluated against the Harness-Creator v3 scoring model (6 dimensions, 1-5 scale, 30 max):

| Dimension | ECC | Harness v3 | Ponytail | Karpathy | What it measures |
|---|---|---|---|---|---|
| **Instructions** | 4/5 | 5/5 | 3/5 | 2/5 | Does the agent know what to read, in what order, before acting? |
| **State** | 2/5 | 5/5 | 1/5 | 1/5 | Is feature state tracked across sessions? Is there a continuity log? |
| **Verification** | 4/5 | 5/5 | 1/5 | 3/5 | Is there a runnable verification gate? Does the agent verify before claiming done? |
| **Scope** | 3/5 | 5/5 | 2/5 | 2/5 | Is scope containment explicit? One feature at a time? |
| **Lifecycle** | 4/5 | 5/5 | 1/5 | 2/5 | Is there a startup routine? An end-of-session procedure? Cross-session handoff? |
| **Behavioral** | 3/5 | 5/5 | 4/5 | 4/5 | Coding minimalism, surgical editing, test-first DoD, safety carve-outs, assumption surfacing |
| **Overall** | **67%** | **100%** | **40%** | **47%** | Higher = more structural reliability |

### How to read these scores

- **ECC**: Strong on instructions (5 instruction files), verification (TDD workflow + hooks), and lifecycle (hooks-based session management). Weak on state (no feature_list.json, no progress.md). Agents forget between sessions but are very skilled *within* a session.
- **Harness v3**: Max score by design — it's the reference implementation. All 6 dimensions at 5/5.
- **Ponytail**: Strong on behavioral (the ladder is the gold standard for code minimalism). Zero state tracking, zero lifecycle — it's a policy file, not a harness. It assumes another system provides the container.
- **Karpathy**: Strong on behavioral (surgical editing, test-first). Zero state, minimal structure — it's a process cheat sheet. Brilliant but incomplete alone.

**Critical caveat:** These scores measure *structural reliability for a single agent*. They do not measure agent specialization quality, which is ECC's entire value proposition. ECC's 67% doesn't mean it's "worse" — it means it solves a different problem.

---

## 3. Behavioral Comparison — The 8 Checks

Evaluated against the Harness v3 behavioral scoring model (8 checks):

| Behavioral Check | ECC | Harness v3 | Ponytail | Karpathy |
|---|---|---|---|---|
| **Coding Policy** (YAGNI/stdlib/native/dep ladder) | Partial (KISS/YAGNI/DRY in coding-standards skill) | Full (6-rung ladder embedded) | Full (the canonical ladder) | Partial (§2 simplicity rule) |
| **Coding Standards** (no abstractions, no speculation) | Partial (immutability, file sizes, naming) | Full (no abstractions, no speculative code) | Full (deletion over addition, boring over clever) | None |
| **Editing Discipline** (surgical changes) | None | Full (touch only required, match style, ponytail: comments) | None | Full (§3 surgical changes — the canonical source) |
| **Test-First DoD** (reproduce first, verify check first) | Partial (TDD skill, but agent-first — relies on tdd-guide delegation) | Full (embedded in DoD section) | Minimal (one runnable check, no test framework) | Full (§4 — the canonical source) |
| **Multi-Step Planning** (success criterion, per-step verify) | Partial (planner agent, feature-dev command) | Full (Before Multi-Step Work section) | None | Full (multi-step gate, one-line criterion) |
| **Assumption Surfacing** (state understanding, ambiguity gate) | None | Full (startup step 7 — structural vs cosmetic ambiguity) | Partial (ultra mode challenges requirements) | Full (§1 think before coding) |
| **Safety Carve-Outs** (validation, data loss, security, hardware) | Partial (security-review agent, security rules per language) | Full (never-simplify-away section) | Full (not lazy about 6 things) | None |
| **Escalation** (architecture, over-spec, repeated failures) | Partial (agent orchestration IS the escalation path) | Full (4 escalation triggers) | None | None |
| **Score** | **3/8** | **8/8** | **5/8** | **5/8** |

### Key takeaway

- **Harness v3 embeds all 8** — it's the only system where behavioral policies live in the same file as structural rules. No delegation required.
- **Ponytail + Karpathy combined** would score 7/8 — missing only escalation (which the harness provides). Even combined, they have no state tracking.
- **ECC scores 3/8** on these specific behavioral checks, but that's because it delegates behavioral concerns to specialist agents (code-reviewer, security-reviewer, tdd-guide) rather than embedding them in the root instruction file. Whether delegation is better than embedding is the core philosophical fork between ECC and Harness.

---

## 4. What Each System Has That the Others Don't

### 4.1 Unique to ECC

| Capability | Why it matters |
|---|---|
| **67 specialized sub-agents** | One generalist can't know 22 languages, security, performance, and architecture simultaneously. ECC routes to the right specialist. |
| **278 reusable skill modules** | Workflow knowledge is packaged, versioned, and shared across agents. Not written from scratch each time. |
| **Hooks automation system** | PreToolUse validation, PostToolUse feedback, Stop-time quality gates, SessionStart context loading — automated, not prompted. |
| **Per-language rule matrices** | 22 languages × 5-7 concern files (coding-style, patterns, security, testing, hooks) = ~130 curated rule files. No generalist AGENTS.md can match this depth. |
| **Continuous learning hooks** | Observer records tool-use patterns. Session persistence captures state. Learning accumulates across sessions. |
| **Enterprise governance** | Install profiles, team config sync, audit allowlists, approval expectations, controlled rollout. |
| **Plugin marketplace surface** | `.claude-plugin/`, `.codex-plugin/`, `.codebuddy/`, `.openclaw/` — installed, not copied. |
| **Multi-harness ports** | Claude Code, Cursor, Codex, Windsurf, Gemini, OpenCode, Kimi, Qwen, Trae, Zed, CodeBuddy — same skill catalog, different host. |
| **MCP server config** | 14 MCP server configurations packaged and managed. |

### 4.2 Unique to Harness-Creator v3

| Capability | Why it matters |
|---|---|
| **feature_list.json** | Single source of truth for "what are we building?" No agent reinvention of the feature backlog per session. |
| **progress.md** | Session continuity log. What was done, what's in progress, what's blocked. Agents don't start from zero. |
| **init.sh as verification gate** | Runnnable. Not a prompt asking the agent to check. A script that either passes or fails. |
| **session-handoff.md** | Structured handoff between sessions or agents. Not ad-hoc memory. |
| **6-dimension scoring** | Quantified harness quality. Tells you *exactly* what to fix first. |
| **HTML assessment reports** | Visual harness health. Shareable, auditable. |
| **Enrichment script** | Given a score, suggests concrete file changes to close gaps. |
| **Zero dependencies** | Node.js built-ins only. No npm install. No plugin marketplace. Works anywhere Node runs. |
| **Embedded behavioral policies** | Ponytail ladder + Karpathy process live in the AGENTS.md template directly. No external skill install needed. |

### 4.3 Unique to Ponytail

| Capability | Why it matters |
|---|---|
| **6-rung ladder as a reflex** | "Stop at the first rung that holds" — not a checklist, a habit. Two rungs work → take the higher one and move on. |
| **Intensity levels** | lite / full / ultra. User-adjustable risk dial. Different projects need different strictness. |
| **`ponytail:` comment convention** | Deliberate shortcuts are marked with ceiling + upgrade path. Debt is visible, searchable, auditable. |
| **Dedicated debt tracking skill** | `/ponytail-debt` scans for `ponytail:` comments and shows the debt ledger. |
| **Whole-repo audit skill** | `/ponytail-audit` finds everything that can be deleted, simplified, or replaced with stdlib. |
| **Diff review skill** | `/ponytail-review` audits a diff for over-engineering specific to the change. |
| **14 agent platform adapters** | Same policy, different agent hosts. |
| **MCP server** | External agents can query Ponytail policy without installing the skill. |

### 4.4 Unique to Karpathy CLAUDE.md

| Capability | Why it matters |
|---|---|
| **Surgical editing rule** | The single most impactful behavioral rule in any system. "Don't touch adjacent code" prevents the #1 agent failure mode. ECC has no equivalent. |
| **Concrete test-first ordering** | "Bugs: reproduce first. Features: write check first." Clearer and more direct than any other system's DoD. |
| **Proactive assumption surfacing** | "State your understanding in one line. If multiple interpretations exist, name them." Prevents silent wrong assumptions. |
| **Brevity** | One short file. No install. No configuration. You read it, you follow it. |
| **Conceptual clarity** | Four principles, each one sentence. The whole thing fits in working memory. |

---

## 5. The Dependency Chain (Extended)

From the [sequential integration guide](SEQUENTIAL-INTEGRATION.md):

```
Harness → Karpathy → Ponytail   (the single-agent stack)
```

With ECC added:

```
Harness → Karpathy → Ponytail   (per-agent policy)
    │
    └──→ ECC                     (across-agent orchestration)
```

Or, more precisely:

| Layer | System | Depends on | What breaks without it |
|---|---|---|---|
| **Ponytail** | Karpathy + Harness | Minimal code is hidden inside bloated diffs without surgical editing. Minimal code can't resume next session without harness. |
| **Karpathy** | Harness | Test-first without state tracking is a guideline. With harness, it's gated and auditable. |
| **Harness** | Nothing | It's the OS. |
| **ECC** | Nothing at the infrastructure layer | ECC's skills, agents, and hooks don't depend on harness artifacts. But without harness, ECC agents still forget between sessions. |

### The integration question

ECC and Harness solve orthogonal problems, so they don't depend on each other structurally. But they **benefit** from each other:

| Scenario | Without Harness | With Harness |
|---|---|---|
| **ECC agent works on a 3-day feature** | Session 2: agent reloads all files from scratch, no progress.md, no feature_list.json. Re-discovers what's done. | Session 2: agent reads progress.md, feature_list.json. Knows exactly what's done, what's next, what's blocked. |
| **ECC code-reviewer agent finds a pattern** | Reports it. No persistent record outside the diff comment. | Records pattern in progress.md "Notes for Next Session." The next agent benefits. |
| **ECC tdd-guide finishes testing** | Tests pass. No verification gate that runs on the next session. | init.sh gates verification. Next session can't proceed until tests pass. |

---

## 6. The Architectural Fork: Embedding vs. Delegation

This is the fundamental philosophical divide between Harness and ECC:

| | Harness-Creator v3 | ECC |
|---|---|---|
| **Model** | One agent, deeply reliable | Many agents, each specialized |
| **Behavioral policy** | Embedded in AGENTS.md | Delegated to specialist agents (code-reviewer, security-reviewer, tdd-guide) |
| **State tracking** | File-based (feature_list.json, progress.md) | Hook-based (observer, session persistence) |
| **Verification** | Runnable script (init.sh) | Delegated to build-error-resolver, e2e-runner, test-coverage command |
| **Scale assumption** | 1 agent, 1 session at a time | N agents, parallel or sequential |
| **Complexity ceiling** | The agent's context window | The orchestration logic |
| **Failure mode** | Agent ignores the rules (behavioral failure) | Wrong specialist invoked, or specialist misses cross-cutting concern |
| **Winner when** | Predictable, single-language, single-agent workflows | Unpredictable, multi-domain, multi-agent workflows |

**Neither is wrong.** They optimize for different failure modes:

- Harness assumes the failure is **state loss and lack of process** → fixes it with files and embedded rules.
- ECC assumes the failure is **lack of domain expertise** → fixes it with specialists and skill modules.
- Harness sees a generalist who forgets. ECC sees a generalist who doesn't know enough.

A mature project eventually needs both: structural reliability for session continuity + specialized agents for domain depth.

---

## 7. The Unified Stack — What Full Integration Looks Like

If all four systems were fully integrated into a single reliability stack:

```
ECC (orchestration layer)
 ├─ Route to specialist agents (planner → tdd-guide → code-reviewer → build-resolver)
 ├─ Hook automation (PreToolUse validation, Stop quality gates, SessionStart context loading)
 ├─ Per-language rules (22 × 5-7 concern files)
 └─ Continuous learning (observer hooks, session persistence)

HARNESS-CREATOR v3 (structural layer)
 ├─ feature_list.json (single source of truth for feature state)
 ├─ progress.md (session continuity log — what's done, what's next)
 ├─ init.sh (verification gate — runnable, not prompted)
 ├─ session-handoff.md (structured handoff between sessions or agents)
 └─ 6-dimension scoring (quantified harness health with HTML reports)

AGENTS.md / CLAUDE.md (instruction layer)
 ├─ Ponytail Coding Policy (6-rung ladder, intensities, ponytail: comments)
 ├─ Ponytail Coding Standards (no abstractions, boring over clever, deletion over addition)
 ├─ Karpathy Editing Discipline (touch only required lines, match style, no drive-by refactors)
 ├─ Karpathy Test-First DoD (bugs: reproduce first; features: write check first)
 ├─ Karpathy Multi-Step Planning (one-line criterion, per-step verify)
 ├─ Karpathy Assumption Surfacing (startup step 7 — state understanding before acting)
 ├─ Ponytail Safety Carve-Outs (validation, data-loss, security, hardware realism)
 └─ Harness Escalation (architecture, over-spec, repeated failures)
```

### The integration gap (~60 lines total)

| Change | Lines | File |
|---|---|---|
| Add feature_list.json + progress.md references to ECC's AGENTS.md | ~5 | ECC `AGENTS.md` |
| Add Ponytail ladder to ECC's coding-standards skill (or as a standalone ponytail-policy skill) | ~15 | ECC `skills/ponytail-policy/SKILL.md` |
| Add surgical editing rule to ECC's rules/common/ | ~8 | ECC `rules/common/coding-style.md` |
| Add init.sh verification gate to ECC's feature-development command | ~3 | ECC `.claude/commands/feature-development.md` |
| Wire Harness 6-dimension scoring as an ECC skill/command | ~30 | ECC `skills/harness-audit/SKILL.md` or `commands/harness-audit.md` |
| Add session-handoff.md as a stop hook artifact | ~5 | ECC `hooks/memory-persistence/README.md` |

---

## 8. Critical Gaps (By System)

### 8.1 ECC's Gaps

| Gap | Severity | Why it matters | Fix |
|---|---|---|---|
| **No feature state tracking** | CRITICAL | 67 agents, 278 skills, zero files that say "we're working on X, Y is done, Z is blocked." Every agent rediscoveres state per session. | Add `feature_list.json` + `progress.md` as recommended artifacts in AGENTS.md. Wire into `feature-dev` and `save-session` commands. |
| **No runnable verification gate** | HIGH | TDD skill exists, but nothing ensures the agent actually runs tests before claiming done. The Stop hook does format/typecheck but no test-run equivalent. | Add `init.sh` pattern. Wire as pre-commit hook. |
| **No surgical editing policy** | HIGH | The coding-standards skill has immutability, naming, KISS/DRY/YAGNI — but nothing says "don't reformat adjacent code." The single most impactful behavioral rule is missing. | Add to `rules/common/coding-style.md` or as standalone `rules/common/editing-discipline.md`. |
| **Behavioral policies are delegated, not embedded** | MEDIUM | Generalist agent doesn't see code-reviewer rules unless it spawns the reviewer. But it makes edits *before* spawning the reviewer. By then, the bloated diff and over-engineering already happened. | Embed minimal behavioral policies (ladder, surgical editing, test-first) in AGENTS.md directly. Keep full policies in specialist skills. |
| **No assumption surfacing at startup** | MEDIUM | ECC agents plan before executing, but they don't proactively state "here's what I think you're asking" before acting. Silent wrong assumptions waste sessions. | Add startup step to AGENTS.md: "State your understanding in one line. If ambiguous, name the interpretations." |
| **Overlapping skill surface** | LOW | 278 skills, many with overlapping concerns. ECC is aware (working context mentions consolidation). Not a gap, but maintenance debt. | Ongoing cleanup already in progress per WORKING-CONTEXT.md. |

### 8.2 Harness-Creator v3's Gaps

| Gap | Severity | Why it matters | Fix |
|---|---|---|---|
| **No agent specialization** | HIGH | The harness makes one agent reliable but doesn't give it domain depth. A harnessed agent reviewing C++ code is still a generalist reviewing C++ code. | Add an ECC-style skill catalog as an optional install. Or document how to pair harness + ECC. |
| **No hooks automation** | MEDIUM | Everything is prompted. PreToolUse validation, Stop quality gates, SessionStart context loading — all require the agent to remember, not the system to enforce. | Port ECC's hook model as an optional harness extension. |
| **No continuous learning** | MEDIUM | progress.md records what happened, but patterns across sessions aren't captured. If the agent makes the same mistake 5 times, nothing surfaces it. | Add an observer pattern to harness scripts. |
| **No enterprise governance** | LOW | No team config sync, no audit allowlists, no approval expectations. Harness is single-project, not team-scale. | Document ECC's enterprise controls as the team-scale layer. |
| **Single-agent assumption** | LOW | Designed for one agent per project. Multi-agent coordination is a reference pattern but not a first-class operation. | ECC's agent orchestration is the complement here. |

### 8.3 Ponytail's Gaps

| Gap | Severity | Why it matters | Fix |
|---|---|---|---|
| **No container — assumes something else provides state** | CRITICAL | The ladder is brilliant, but without a harness, the agent forgets which shortcuts it took and why. Debt ledger resets per session. | Install with Harness-Creator v3. The `ponytail:` comments carry debt through progress.md. |
| **No editing discipline** | HIGH | Minimal code is hidden inside bloated diffs. Ladder says "write less" but doesn't say "don't pad the diff with unrelated changes." | Pair with Karpathy §3 or embed surgical editing in the Ponytail skill directly. |
| **No process rigor** | MEDIUM | The ladder is a reflex, but there's no test-first ordering, no assumption surfacing, no multi-step planning gate. Ponytail governs *what* code, not *how* to work. | Pair with Karpathy. |

### 8.4 Karpathy CLAUDE.md's Gaps

| Gap | Severity | Why it matters | Fix |
|---|---|---|---|
| **No container** | CRITICAL | Brilliant behavioral guidance with zero infrastructure. No state tracking, no verification gate, no session continuity. | Install with Harness-Creator v3. |
| **Code minimalism is light** | MEDIUM | §2 says "prefer simple solutions" but doesn't provide the ladder, intensities, debt tracking, or ponytail: convention. Good enough for a generalist; not strict enough for code that matters. | Pair with Ponytail. |
| **No safety carve-outs** | MEDIUM | No explicit list of things not to simplify away. Ponytail has this; Karpathy assumes the agent won't cut corners on security. | Embed Ponytail's safety section. |
| **Informal format** | LOW | It's a personal CLAUDE.md, not a framework. Not versioned, not installable, not scored. But that's the point — it's a cheat sheet. | The content is what matters. Format is secondary. |

---

## 9. Recommendations

### For a single-agent project (1 developer, 1 language)
```
Harness-Creator v3 + Ponytail + Karpathy (all embedded in v3 templates)
```
You get all three out of the box. Run `create-harness.mjs`, run `validate-harness.mjs` to confirm 100/100.

### For a multi-language or multi-agent project (team, complex stack)
```
Harness-Creator v3 (structural) + ECC (specialization) + Ponytail (policy) + Karpathy (process)
```
- Harness provides the container: feature_list.json, progress.md, init.sh, session-handoff.md
- ECC provides the specialists: per-language rules, dedicated reviewers, build resolvers, security auditors
- Ponytail provides code minimalism policy (embedded in AGENTS.md or as ECC skill)
- Karpathy provides process rigor (surgical editing, test-first, assumption surfacing — embedded in AGENTS.md)

### For an ECC user who wants structural reliability
1. Add `feature_list.json` and `progress.md` as first-class artifacts
2. Add surgical editing rule to `rules/common/coding-style.md`
3. Add assumption surfacing to AGENTS.md startup workflow
4. Add an `init.sh` pattern to the `feature-dev` command
5. Optionally: create an ECC skill that wraps Harness-Creator's `validate-harness.mjs` as `/harness-audit`

### For a Harness-Creator user who wants ECC's depth
1. Install ECC for the language rule matrices and specialist agents
2. Reference ECC's coding-standards, tdd-workflow, and security-review skills from AGENTS.md
3. Wire ECC's hooks (PreToolUse validation, Stop quality gates) alongside init.sh
4. Use ECC's planner + tdd-guide for complex features; use harness state tracking to maintain continuity between them

---

## 10. Summary Table

| | ECC | Harness v3 | Ponytail | Karpathy |
|---|---|---|---|---|
| **Strategy** | Scale (agents) | Structure (state) | Policy (content) | Process (behavior) |
| **Files** | 1,000+ | ~40 | ~30 | 1 |
| **Dependencies** | npm (1,600 packages) | None | None | None |
| **Agent count** | 67 specialists | 1 generalist | 0 (policy layer) | 0 (cheat sheet) |
| **State tracking** | Hook-based observer | File-based (feature_list.json + progress.md) | None | None |
| **Verification** | TDD skill + build resolvers | init.sh + Definition of Done | One runnable check | Test-first ordering |
| **Behavioral policy** | Distributed across skills + rules | Embedded in AGENTS.md | Embedded in AGENTS.md | The source document |
| **Scoring model** | No structural scoring | 6-dimension (1-30) | No scoring | No scoring |
| **Install** | npm / plugin marketplace | `npx skills add` | Copy AGENTS.md | Copy paste |
| **Best for** | Multi-domain teams, enterprise | Single-agent reliability, multi-session projects | Code minimalism, legacy cleanup | Process discipline, diff hygiene |
| **Worst for** | Simple projects (overkill) | One-off scripts (overkill) | Without harness (forgets debt) | Without harness (no state) |
| **Combines with** | Harness (state) + Ponytail (policy) | ECC (specialization) + Ponytail (policy) | Harness (state) + Karpathy (process) | Harness (state) + Ponytail (ladder) |

---

## Appendix: Score Justifications

### ECC: 67% (20/30)

| Dimension | Score | Reason |
|---|---|---|
| Instructions | 4/5 | 5 instruction files (AGENTS.md, CLAUDE.md, SOUL.md, RULES.md, agent.yaml) with clear agent routing. Missing: startup sequence that surfaces ambiguity before acting. |
| State | 2/5 | Session observer hooks capture tool patterns, but no structured feature state file. No progress.md. No feature_list.json. Agents derive state from git history and file system. |
| Verification | 4/5 | TDD workflow skill is thorough. Stop hooks do format/typecheck. Missing: a single runnable verification gate (init.sh equivalent) that gates all steps. |
| Scope | 3/5 | Agent-first model means the generalist delegates, which inherently scopes work. But no explicit one-feature-at-a-time containment. |
| Lifecycle | 4/5 | Memory persistence hooks (session-start, observer, pre-compact, session-end) are comprehensive. Missing: structured session-handoff.md between agents. |
| Behavioral | 3/5 | KISS/YAGNI/DRY in coding-standards skill. Immutability, file sizes, naming. TDD via delegation. Missing: surgical editing, assumption surfacing, explicit safety carve-outs, coding minimalism ladder. |

### Ponytail: 40% (12/30)

| Dimension | Score | Reason |
|---|---|---|
| Instructions | 3/5 | The ladder is clear and actionable. Rules are explicit. Missing: startup workflow, reading order, what artifacts to consult. |
| State | 1/5 | `ponytail:` comments carry debt forward within files they modify. Zero cross-session state tracking. |
| Verification | 1/5 | "One runnable check" per non-trivial logic. No verification gate, no test framework, no init equivalent. |
| Scope | 2/5 | The ladder inherently scopes code volume. No feature-level scope containment. |
| Lifecycle | 1/5 | No startup routine. No end-of-session procedure. No handoff. |
| Behavioral | 4/5 | The ladder is the gold standard for coding policy. Safety carve-outs are explicit. Missing: editing discipline, test-first DoD ordering, assumption surfacing. |

### Karpathy: 47% (14/30)

| Dimension | Score | Reason |
|---|---|---|
| Instructions | 2/5 | Four principles, each clear and actionable. But no startup workflow, no artifact routing, no "read this, then that" sequence. |
| State | 1/5 | Zero state tracking. Behavioral guidance only. |
| Verification | 3/5 | Test-first ordering is strong (bugs: reproduce; features: check). Missing: runnable verification gate. |
| Scope | 2/5 | Surgical editing inherently scopes diffs. No feature-level scope. |
| Lifecycle | 2/5 | Multi-step planning gate. No startup/end-of-session procedures. |
| Behavioral | 4/5 | Surgical editing is the gold standard. Test-first is strong. Assumption surfacing is strong. Missing: coding minimalism ladder, safety carve-outs, escalation triggers. |
