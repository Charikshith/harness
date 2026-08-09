# Memory Gap Implementation Plan

**Date:** 2026-08-09
**Source:** `docs/carbon_gap_memory.md` — gap analysis of "The Agent Memory Stack" notes against version-4.
**Companion:** condensed decision + phase summary saved in `harness/open-work.md` (`## Design decision (2026-08-09)`).

This is the full analysis behind the plan: the framing, every candidate approach with pros/cons, the strategy comparison, the chosen strategy and why, the phased plan, and the explicit non-goals.

---

## 0. Frame the problem correctly first

"The gap" is really **four independent gaps** with different owners:

| Gap | What it is | Who should own it |
|---|---|---|
| 1. Session search | Episodic recall across `journal.md` | **Harness** (nothing can query journal.md today — genuine defect) |
| 2. Context builder | retrieve→rank→resolve→assemble | **Runtime** (host runtime already assembles context from AGENTS.md) |
| 3. Conflict/currency | "then vs. now" state problem | **Harness** (detection) + **human** (resolution, per design) |
| 4. Forgetting | decay/compression | **Harness** (as ranking) + **documented debt** (as deletion) |

The decisive constraint: version-4 is a *file-and-instruction* harness for a host runtime. Building a context builder inside it means building a worse copy of what Claude Code / Codex / jcode already do natively. So the plan's first question per gap is "does this belong in the harness or the runtime?" — not "how do I build it."

---

## 1. Per-gap candidate approaches

### Gap 1 — Session search (the only true defect)

| Approach | Pros | Cons |
|---|---|---|
| **A. 50-line `search-journal.mjs`** (grep + date-block rank + recency bonus) | No deps, fits existing script pattern, testable via `./init.sh`, portable across runtimes | Literal matching only; single-file corpus |
| B. SQLite FTS index | Real BM25 ranking, scales | Build step + index drift vs. append-only markdown; binary file in a text-first repo |
| C. Vector embeddings | Semantic recall ("which session was *about* X") | Embedding model + runtime dep; exactly the "heavy machinery" SKILL.md defers; overkill for single-operator |
| D. Delegate to runtime session search (jcode `session_search`, Claude `/sessions`) | Zero build, semantic, already exists | Not portable; harness can't *guarantee* it |

**Pick: A now, D as documented fallback.** The gap is that *nothing can query the harness's own journal*. A 50-line script closes that. Semantic recall across the runtime's session store is a documented tool call, not a build. C is the classic trap — it's the notes' "weak memory" failure mode for recall.

### Gap 2 — Context builder

| Approach | Pros | Cons |
|---|---|---|
| A. Document as explicit non-goal | Zero cost, honest | Doesn't help agents whose runtime builds context poorly |
| B. **Instruction-level assembly**: a "context assembly" checklist in AGENTS.md — what's always-on, what's on-demand, read order | Matches store-and-instruct design, costs a few lines, improves every session | Still agent-discipline-dependent |
| C. `build-context.mjs` that concatenates AGENTS.md + index + open-work → prompt file | Deterministic, testable | Duplicates what runtimes do natively; output is concatenation, not ranking; brittle |
| D. Full retrieve+rank+assemble engine | The notes' complete vision | Months of maintenance, violates the harness's own no-heavy-machinery rule |

**Pick: B, with A as the boundary statement.** The `--budget` flag already prints the always-on set; B just turns that into a defined assembly order. The gap here is *documentation and instruction*, not machinery.

### Gap 3 — Conflict/currency (the interesting one)

| Approach | Pros | Cons |
|---|---|---|
| A. **Upgrade one judgement signal to countable**: same backticked token in two lessons (or two journal blocks with different state) → emit "supersede or reconcile" proposal | Reuses the exact proposal shape (`signal`/`claim`/`evidence`/`prevalence`), dedupes against the Decided table, slots into the 5-cap queue, testable | Heuristic (shared token ≠ same fact); still human-gated (which is the design) |
| B. `facts.md` table with "as-of" dates + superseded flags | Models *when true* directly — the notes' "state problem" answer | New store + write discipline + new validation checks; agents will forget to update it |
| C. Runtime resolution in a context builder | Automatic | Requires machinery that doesn't exist (gap 2 = non-goal) |
| D. Document-only | Zero cost | Leaves the specific stale-lesson failure mode open |

**Pick: A.** Crucially, this isn't greenfield — `curate-memory.mjs` line 15 already lists "two lessons contradict" as a *manual* judgement signal. Making it semi-countable (shared-token suspect pairs) is the smallest honest upgrade, and the human gate is not a limitation to lift; the script's own comment says silently rewriting rules is worse than not proposing.

### Gap 4 — Forgetting

| Approach | Pros | Cons |
|---|---|---|
| A. **Recency weighting in search** (decay as ranking, not deletion) | Costs ~5 lines inside Gap 1's script, gives the decay *effect*, old stuff still findable | Doesn't shrink storage |
| B. Document compression as debt with trigger (index at 80% cap) | Zero cost now, honest | Not real forgetting |
| C. Rolling compress journal→summaries→facts pipeline | The notes' full model | Lossy, high effort, low payoff for single-operator |
| D. Temporal decay with pinned/durable flags | Explicit | New metadata discipline on every entry |

**Pick: A + B.** The 200-line/25KB index cap is already the pressure valve. Decay as *ranking* is the ponytail answer — you get the behavioral effect without the deletion machinery.

### Gap 5 — Eval coverage

Add one eval case each when gaps 1 and 3 ship; nothing now. An eval for a feature that doesn't exist is scaffolding. `scoreEvals` already matches names containing `memory`, so a `memory-session-search` case gets scored for free.

---

## 2. The three overall strategies

| Strategy | What it is | Pros | Cons |
|---|---|---|---|
| **1. Minimal-native** (report's original rec) | 1 search script + 1 signal upgrade + docs; rest documented as non-goal/debt | Cheapest, purest, matches harness philosophy, all testable | Ends with "good enough" memory, not the notes' full vision |
| **2. Hybrid-runtime-leverage** | The two builds above **plus** explicit delegation: runtime session search for semantic recall, instruction-level context assembly, documented runtime-owned layers | Best capability-per-unit-of-work; the notes place retrieval/assembly in the runtime layer, so delegating is *architecturally correct*, not a cop-out | Ties some behavior to runtime capabilities; portability across runtimes is instruction-level, not enforced |
| **3. Full-stack build** | Vector store, FTS, context builder, conflict resolver, compression pipeline | The complete "Agent Memory Stack" | Violates the harness's own design rules (no heavy machinery, single-operator, propose-never-apply), duplicates runtime features, months of maintenance, and the gap analysis already showed the layer mismatch |

## 3. Best: **Strategy 2 (hybrid), built in phases**

Why it wins:

1. **It closes the two gaps that are genuinely the harness's job** (queryable journal, mechanical conflict detection) — the only parts that change real agent behavior in a file-and-instruction harness.
2. **It doesn't fight the architecture.** The notes' own framing puts retrieval and assembly in the runtime layer. For a store-and-instruct harness, "delegate to runtime" isn't skipping the hard part — it's placing it where it belongs. Strategy 3 would build a worse, unmaintained copy of what jcode already does in `session_search`.
3. **It respects every guardrail this repo ships**: one feature at a time, verification-first, no bonus surface, propose-never-apply, ponytail. Every phase has a testable artifact and an eval case.
4. **It's reversible.** Each phase is independent; stopping after P1 still leaves a strictly better harness.

---

## 4. The phased plan

```mermaid
flowchart LR
    P0[P0 Scope decision<br/>feature_list.json] --> P1[P1 search-journal.mjs<br/>+ eval case]
    P1 --> P2[P2 conflict signal<br/>+ eval case]
    P2 --> P3[P3 context-assembly<br/>instructions + non-goal]
    P3 --> P4[P4 recency weighting<br/>+ decay debt doc]
```

- **P0 — Decide scope.** Add one feature to `harness/feature_list.json` (e.g., `feat-012 "Episodic retrieval and conflict detection"`), split into its own rows or separate features. Re-read `open-work.md`/`dream-queue.md` for surfaced proposals before starting — the harness requires surfacing, not applying. *(Done: `feat-012 "Episodic session search"` registered as `not-started`, depends `feat-005`.)*
- **P1 — Session search** (closes gap 1, part of 4). `scripts/search-journal.mjs <keywords> [--since DATE] [--count N]`: parse dated blocks (reuse `journalBlocks` from `curate-memory.mjs`), score by keyword hits, print top blocks with dates and context. **Verification first**: write the test/eval case (a fixture journal where two blocks match, one is recency-weighted above the other), then make it pass. Wire into `init.sh` like the other `.test.mjs` files. Add a `--budget`-style one-line doc entry in `scripts/index.md`.
- **P2 — Conflict signal** (closes gap 3). In `curate-memory.mjs`, add a third countable signal: same backticked token in ≥2 dated journal blocks **or** ≥2 lessons → `signal: 'suspect-conflict'`, claim "reconcile or supersede: token X appears in A (date, state) and B (date, state)". Same proposal shape, same dedupe against the Decided table, same 5-cap. Human resolves by editing a lesson or graveyarding with `Recheck-if`.
- **P3 — Context assembly instructions** (closes gap 2, honestly). In `references/context-engineering-pattern.md`: name the non-goal explicitly (runtime assembles context), and add the always-on vs. on-demand read order to AGENTS.md's startup workflow. Zero scripts.
- **P4 — Decay + debt** (rest of gap 4). Add recency weighting to the P1 script (old blocks rank lower but remain findable). Document compression as debt in `open-work.md` with the trigger: "when `memory/index.md` hits 80% of its 200-line cap." Zero new machinery.
- **Every phase**: run `./init.sh`, update `harness/progress.md` and `harness/feature_list.json` with evidence, commit with a descriptive message. The repo must stay restartable.

**What I'd explicitly not build:** vector DB, FTS index, runtime context builder, compression pipeline, a `facts.md` store. Each is either the runtime's job, heavy machinery the skill defers, or a maintenance tax on a single-operator text harness.

---

*Plan written 2026-08-09. Mirrors the analysis given in chat; the on-disk canonical summary is `harness/open-work.md`.*
