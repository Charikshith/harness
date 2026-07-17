# Harness V3 — User Guide

A harness is what makes an AI coding agent reliable across sessions. Without one, the agent forgets what it was doing, drifts out of scope, claims "done" without verification, pads diffs with unrelated changes, and over-builds features nobody asked for. With one, it starts clean, stays in scope, verifies its work, and hands off cleanly to the next session.

This guide covers the V3 harness — structural scaffolding plus embedded behavioral policies. No external dependencies. No configuration files. You're up in 2 minutes.

---

## Table of Contents

1. [Quick Start](#quick-start)
2. [What Gets Created](#what-gets-created)
3. [Understanding the Score](#understanding-the-score)
4. [The AGENTS.md — Line by Line](#the-agentsmd--line-by-line)
5. [Customizing for Your Project](#customizing-for-your-project)
6. [Working with Ponytail (Optional)](#working-with-ponytail-optional)
7. [Common Workflows](#common-workflows)
8. [Troubleshooting](#troubleshooting)
9. [Architecture: The Three Layers](#architecture-the-three-layers)

---

## Quick Start

### 1. Install the skill

```bash
npx skills add Charikshith/harness --skill harness-creator-v3
```

This makes the harness-creator available to your coding agent. The agent now knows how to build and audit harnesses.

### 2. Generate a harness for your project

Ask your agent:

> "Create a harness for this project."

Or run the script directly:

```bash
node version-3/scripts/create-harness.mjs --target .
```

Options:

| Flag | Purpose |
|---|---|
| `--target <path>` | Path to the project (default: `.`) |
| `--agent-file CLAUDE.md` | Use `CLAUDE.md` instead of `AGENTS.md` (Claude-oriented projects) |
| `--package-manager npm\|pnpm\|yarn\|bun` | Override auto-detected package manager |
| `--commands "check1,check2"` | Custom verification commands |
| `--force` | Overwrite existing files |

### 3. Fill in the placeholders

`feature_list.json` is created with a placeholder entry. Replace it with your actual features. This is the source of truth the agent reads at startup — garbage in, garbage out.

### 4. Verify it works

```bash
./init.sh
```

If `init.sh` passes, your harness is operational. The agent can now start, verify, and hand off reliably.

---

## What Gets Created

| File | Purpose | Agent reads it... |
|---|---|---|
| `AGENTS.md` | Startup workflow, coding policy, editing rules, safety, verification commands | At the beginning of every session |
| `CLAUDE.md` | One-line pointer to AGENTS.md | If present, Claude reads this first |
| `feature_list.json` | Feature state tracker — what's in progress, done, blocked | At startup (step 5) |
| `progress.md` | Session continuity log — what was done, what's next, what's blocked | At startup and end of session |
| `init.sh` | Verification entrypoint — runs tests, lint, build | At startup (step 4) and before claiming "done" |
| `session-handoff.md` | Optional structured handoff for multi-session features | End of large sessions |

### What AGENTS.md contains

```
AGENTS.md
├── Startup Workflow (8 steps)        ← Agent follows this order every session
├── Coding Policy (6-rung ladder)     ← Ponytail: YAGNI → stdlib → native → dep → one-liner → minimum
│   └── Intensity Levels (lite/full/ultra)
├── Coding Standards (8 rules)        ← No abstractions, no speculation, ponytail: comments
├── Editing Discipline (6 rules)      ← Surgical changes, match style, don't refactor unbroken things
├── Working Rules (5 rules)           ← One feature at a time, verify before claiming done
├── Required Artifacts                ← The files the agent must maintain
├── Before Multi-Step Work            ← Success criterion + per-step verification plan
├── Definition of Done (6 checkboxes) ← For bugs: reproduce first. For features: write check first.
├── End of Session (5 steps)          ← Update state, commit, leave repo clean
├── Safety (6 carve-outs)             ← Never simplify away: validation, data loss, security
├── Verification Commands             ← Project-specific test/lint/build commands
└── Escalation (4 triggers)           ← When to stop and ask the human
```

---

## Understanding the Score

Run validation any time:

```bash
node version-3/scripts/validate-harness.mjs --target .
```

### The six dimensions

| Dimension | Max | What it checks |
|---|---|---|
| **instructions** | 5/5 | AGENTS.md exists, startup steps, DoD, verification commands routed, state artifacts referenced |
| **state** | 5/5 | feature_list.json valid, progress.md supports restart, handoff captures blockers |
| **verification** | 5/5 | init.sh exists, fails fast, test/lint commands documented, evidence recorded |
| **scope** | 5/5 | One-feature-at-a-time, dependencies tracked, status explicit, completion gate |
| **lifecycle** | 5/5 | Startup script, end-of-session procedure, handoff template, restart markers |
| **behavioral** | 5/5 | Coding ladder, coding standards, surgical editing, test-first, safety, escalation |

Each dimension is worth 5 points. Total: 30 points across 6 subsystems. The overall score is the average — so 30/30 = 100/100.

### Score interpretation

| Score | Tier | Meaning |
|---|---|---|
| 100 | Production | Full structural + behavioral coverage. The agent has everything it needs. |
| 80-95 | Good | Structure is solid, behavioral policies may be partial. Agent is reliable but might over-engineer or pad diffs. |
| 60-75 | Usable | Fundamentals exist. Agent can start and track work, but gaps create friction. |
| <60 | Needs work | Missing critical artifacts. Agent will struggle with scope, memory, or verification. |

### The bottleneck rule

The lowest-scoring dimension is your bottleneck. An agent can have perfect instructions but fail on state tracking — it will read AGENTS.md perfectly, complete the feature, then forget everything by next session. Fix the bottleneck first.

```bash
# Auto-fix structural gaps
node version-3/scripts/enrich-harness.mjs --target .
```

`enrich-harness.mjs` patches missing sections without overwriting what's already correct. It won't touch files that are already at full score.

---

## The AGENTS.md — Line by Line

### Startup Workflow (8 steps)

The agent follows these in order, every session:

1. **Confirm working directory** — `pwd`. Prevents working in the wrong repo.
2. **Read this file completely** — AGENTS.md is the constitution.
3. **Read project docs** — Architecture, product docs, README. Progressive disclosure.
4. **Run init.sh** — Verify the environment is healthy before touching anything.
5. **Read feature_list.json** — Know what's in progress, what's done.
6. **Review recent commits** — `git log --oneline -5`. Don't redo work or break context.
7. **State your understanding** — One line. If the task is ambiguous in a structural way (architecture, data model, security boundary), **stop and ask**. If cosmetic, name your assumption and proceed.
8. **Check Ponytail mode** — lite, full, or ultra. Defaults to full. Governs how aggressively the ladder is applied.

If init.sh is failing, the agent repairs that first — before any new work.

### Coding Policy (The 6-Rung Ladder)

This is the Ponytail ladder. It's a reflex, not a research project:

1. **Does this need to exist at all?** — Speculative need = skip it. (YAGNI)
2. **Does the standard library already do this?** — Use it.
3. **Does a native platform feature cover it?** — `<input type="date">` over a picker lib. CSS over JS.
4. **Does an already-installed dependency solve it?** — Use it. Never add a new dep for what a few lines can do.
5. **Can this be one line?** — Make it one line.
6. **Only then:** write the minimum code that works.

Two rungs work → take the higher one and move on. The first lazy solution that works is the right one.

#### Intensity Levels

| Level | What changes |
|---|---|
| **lite** | Build what's asked, but name the lazier alternative in one line. User picks. |
| **full** | The ladder enforced. Stdlib and native first. Shortest diff, shortest explanation. **Default.** |
| **ultra** | YAGNI extremist. Deletion before addition. Ship the one-liner and challenge the rest of the requirement. |

### Coding Standards (8 Rules)

These follow from the ladder:

- Minimum code. Nothing speculative.
- No abstractions that weren't requested. No interface with one implementation.
- No "flexibility" or "configurability." No scaffolding "for later."
- No error handling for impossible scenarios.
- Deletion over addition. Boring over clever. Fewest files.
- Two stdlib options, same size → pick the correct one on edge cases.
- Mark deliberate simplifications: `// ponytail: O(n²) scan, upgrade to index if >10k rows`
- Non-trivial logic leaves ONE runnable check. Trivial one-liners need no test.

### Editing Discipline (6 Rules)

The single most impactful behavioral rule: **touch only what the feature requires.**

- Don't "improve" adjacent code, comments, or formatting.
- Match existing style. Consistency beats your preference.
- Don't refactor things that aren't broken.
- If you notice unrelated dead code, mention it in progress.md — don't delete it.
- Remove only the imports/variables YOUR changes made unused.
- Every changed line must trace to the feature in feature_list.json.

### Before Multi-Step Work

If the task spans more than 2 files or 3 logical steps:

1. State a **one-line success criterion**.
2. Write a numbered plan with a verify check per step:

```
1. [Step] → verify: [specific check]
2. [Step] → verify: [specific check]
3. [Step] → verify: [specific check]
```

For bugs: write a reproduction test FIRST, then make it pass.
For features: write the verification check FIRST, then implement.

One-liners and trivial changes skip this.

### Definition of Done

A feature is done only when ALL are true:

- [ ] Target behavior implemented
- [ ] Bug: reproduction test written first, then passed. Feature: verification check written first.
- [ ] Verification commands actually ran and passed
- [ ] Evidence recorded in feature_list.json or progress.md
- [ ] Repository restartable from standard path

### Safety (6 Carve-Outs)

Never simplify away:

- Input validation at trust boundaries
- Error handling that prevents data loss
- Security measures
- Accessibility basics
- Hardware calibration (real clocks drift, sensors read off)
- Anything explicitly requested

---

## Customizing for Your Project

### Changing the verification commands

Edit the `## Verification Commands` section in AGENTS.md. The template produces:

```bash
# Full verification (recommended)
./init.sh
```

Replace with your actual commands:

```bash
# Full verification (recommended)
cargo test && cargo clippy && cargo fmt --check
```

Also update `init.sh` to run the same commands.

### Adding project-specific rules

Append to AGENTS.md, never replace the behavioral sections. Example:

```markdown
## Project-Specific Rules

- Database migrations require a rollback plan before applying.
- API changes must update the OpenAPI spec in `docs/api.yaml`.
- Never commit `.env` files — use `.env.example` with placeholder values.
```

### Working with a monorepo

Each package/subproject gets its own harness:

```
packages/
├── api/
│   ├── AGENTS.md
│   ├── feature_list.json
│   └── ...
└── web/
    ├── AGENTS.md
    ├── feature_list.json
    └── ...
```

Run `create-harness.mjs --target packages/api` and `--target packages/web` separately. Each has its own state, verification, and scope.

### Removing behavioral policies

If you don't want the Ponytail ladder (e.g., you're on a security-critical project that needs exhaustive validation, not minimalism), remove these sections from AGENTS.md:

- `## Coding Policy` (the ladder)
- `### Intensity Levels`
- The "ponytail:" comment rule from `## Coding Standards`

The harness still works structurally. The behavioral score will drop, but that's intentional — you're choosing a different policy.

---

## Working with Ponytail (Optional)

The V3 harness has the ladder and intensity table embedded. For the full Ponytail experience (debt tracking, review, audit), install it separately:

```bash
npx skills add Charikshith/ponytail --skill ponytail
```

### With Ponytail installed, you get:

| Feature | Without Ponytail | With Ponytail |
|---|---|---|
| 6-rung ladder | ✅ Embedded in AGENTS.md | ✅ Ponytail skill enforces it per-response |
| Intensity toggle | ✅ Table in AGENTS.md (agent reads it) | ✅ `/ponytail lite\|full\|ultra` switches mid-session |
| Debt tracking | ❌ ponytail: comments (no ledger) | ✅ `/ponytail-debt` — hash-tracked shortcuts with ceilings |
| Lazy-code review | ❌ None | ✅ `/ponytail-review` — diff audit for over-engineering |
| Whole-repo audit | ❌ None | ✅ `/ponytail-audit` — scores the codebase for deletable code |
| Ponytail Debt in progress.md | ✅ Section exists | ✅ Populated and tracked across sessions |

### Do I need both?

For most projects, the embedded ladder is enough. The agent will naturally write minimal, surgical code.

Install the full Ponytail skill when:
- You're shipping production code and want debt tracked systematically
- Your team has a history of over-engineering
- You want `/ponytail-audit` to periodically score the codebase
- You need intensity switched mid-session (e.g., "go ultra on this hotfix")

---

## Common Workflows

### Workflow 1: New project, from scratch

```bash
# 1. Generate harness
node version-3/scripts/create-harness.mjs --target .

# 2. Fill in feature_list.json with your first feature
# Edit feature_list.json → replace placeholder

# 3. Run init.sh to confirm everything works
./init.sh

# 4. Validate
node version-3/scripts/validate-harness.mjs --target .
```

### Workflow 2: Audit an existing project

```bash
# 1. Run validation
node version-3/scripts/validate-harness.mjs --target .

# 2. Read the bottleneck score
# Fix the lowest-scoring dimension first

# 3. Auto-fix what can be auto-fixed
node version-3/scripts/enrich-harness.mjs --target .

# 4. Re-validate
node version-3/scripts/validate-harness.mjs --target .
```

### Workflow 3: Onboard a new team member

```bash
# 1. They clone the repo
# 2. They run init.sh
./init.sh

# 3. The agent reads AGENTS.md → feature_list.json → progress.md
# 4. The agent knows exactly what's in progress and what's next
# No handoff meeting needed
```

### Workflow 4: Before/after benchmarking

```bash
# 1. Generate benchmark report
node version-3/scripts/run-benchmark.mjs --target . --html report.html

# 2. Run a representative agent session (fix a bug, add a feature)
# 3. Re-run benchmark
node version-3/scripts/run-benchmark.mjs --target . --html report-after.html

# Compare scores. The benchmark is structural — real effectiveness
# needs agent-session evidence.
```

### Workflow 5: Continuous integration

Add to your CI pipeline:

```yaml
# GitHub Actions example
- name: Validate harness
  run: node version-3/scripts/validate-harness.mjs --target .
```

If the score drops below a threshold (e.g., 80), fail the build. This catches drift — someone removed a section from AGENTS.md, feature_list.json is corrupt, init.sh was deleted.

---

## Troubleshooting

### Agent ignores AGENTS.md

**Symptom:** Agent skips the startup workflow, doesn't read feature_list.json, over-builds.

**Check:**
- Is AGENTS.md in the repo root?
- Does init.sh exist and run cleanly?
- Is the agent configured to read AGENTS.md? (Most agents read AGENTS.md or CLAUDE.md by default, but some need configuration.)

### Agent over-engineers despite the ladder

**Symptom:** AGENTS.md has the 6-rung ladder, but the agent still writes a factory for one product.

**Fix:**
- Verify the behavioral score is 5/5. If not, the ladder text may be malformed.
- Install the full Ponytail skill — it enforces the ladder per-response, which is stricter than a static document.
- Add explicit examples to AGENTS.md: "Example: for a single API call, `fetch()` not an `ApiClient` class."

### Agent pads diffs despite editing discipline

**Symptom:** A 3-line feature change comes with 50 lines of reformatting.

**Fix:**
- Verify the Editing Discipline section exists and has all 6 rules.
- Add a project-specific rule: "All diffs are reviewed for scope. If a diff contains lines unrelated to the feature, the session is not done."
- Consider a pre-commit hook that rejects diffs exceeding a line threshold.

### init.sh fails but the project is fine

**Symptom:** init.sh exits non-zero, but the project actually builds.

**Fix:**
- init.sh is a script you own. Edit it to match your actual verification flow.
- The template detects package managers and generates reasonable defaults, but it can't know your exact setup.
- Make init.sh delegate to your real test runner: `npm test && npm run lint`

### Feature_list.json is out of date

**Symptom:** Agent works on features that aren't listed, or skips features that are.

**Fix:**
- This is the agent's fault — the End of Session rules say "update feature_list.json." If the agent isn't doing this, the harness isn't being followed.
- Run `validate-harness.mjs` — it checks that feature_list.json has valid status fields.
- Consider making feature_list.json updates part of the Definition of Done gate.

---

## Architecture: The Three Layers

The V3 harness is three layers composed into one AGENTS.md:

```
HARNESS (Container)          KARPATHY (Process)          PONYTAIL (Policy)
───────────────────          ──────────────────          ─────────────────
Startup workflow             §1 Think Before Coding      Coding Policy ladder
Required artifacts           §2 Simplicity First         Coding Standards
Working rules                §3 Surgical Changes         Intensity levels
Verification commands        §4 Goal-Driven Execution    ponytail: comments
End of session                                              Safety carve-outs
Escalation
```

| Layer | Answers the question | Origin |
|---|---|---|
| **Harness** | "Where am I, what's the state, how do I verify?" | This skill |
| **Karpathy** | "How should any agent behave in any codebase?" | [Karpathy CLAUDE.md](https://github.com/karpathy/CLAUDE.md) |
| **Ponytail** | "Which solution do I pick, and how minimal is minimal enough?" | [Ponytail](https://github.com/Charikshith/ponytail) |

For the full architecture rationale, see [SEQUENTIAL-INTEGRATION.md](SEQUENTIAL-INTEGRATION.md).

---

## Summary

1. **Install**: `npx skills add Charikshith/harness --skill harness-creator-v3`
2. **Create**: `node version-3/scripts/create-harness.mjs --target .`
3. **Fill**: Replace placeholder feature entries in feature_list.json
4. **Verify**: `./init.sh` then `node version-3/scripts/validate-harness.mjs --target .`
5. **Work**: The agent now starts clean, stays in scope, verifies, and hands off.
6. **Optional**: Install Ponytail for debt tracking, review, and audit.
