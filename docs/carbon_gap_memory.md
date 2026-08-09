# Gap Analysis: "The Agent Memory Stack" (video notes) vs. `version-4` implementation

**Date:** 2026-08-09
**Basis:** `The_Agent_Memory_Stack_Notes.md` (structured notes from the YouTube talk) mapped 1:1 against the shipped memory machinery in `version-4/` — `SKILL.md`, `scripts/` (`validate-harness.mjs`, `curate-memory.mjs`, `enrich-harness.mjs`), `references/` patterns, `templates/`, and `evals/`.

> **Method:** For each concept the notes define (four memory types, context-builder architecture, conflict handling, forgetting), I searched the implementation for the corresponding artifact — pattern doc, template, script, check, or eval — and recorded whether it is **implemented**, **documented-only**, or **absent**, with the file evidence. The report then prioritizes the gaps by leverage (what would change real agent behavior).

---

## 0. TL;DR

| # | Notes concept | version-4 status | Verdict |
|---|---|---|---|
| 1 | Working memory = active context (the desk) | `references/context-engineering-pattern.md`; `validate-harness.mjs --budget` | ✅ Covered (mostly) |
| 2 | Episodic memory = time-stamped "what happened" | `memory/journal.md` (friction log) + `progress.md`/`session-handoff.md` (state) | 🟡 Partial |
| 3 | Semantic memory = standing facts ("what is true") | `memory/index.md` + `memory/<slug>.md` lessons; `AGENTS.md` as instruction memory | 🟡 Partial |
| 4 | Procedural memory = "how to act" | Skills (`SKILL.md` + `references/`), orchestration (`curate-memory.mjs`, `enrich-harness.mjs`) | ✅ Strong |
| 5 | Context builder (retrieve → rank → resolve → assemble) | Only **documented** in `context-engineering-pattern.md`; no runtime component | 🔴 **Gap** |
| 6 | Durable stores = filing cabinet | `memory/` store + `resolveMemoryDir` + `loadMemoryFiles` | ✅ Implemented |
| 7 | Session search / retrieval across past sessions | `journal.md` (append-only) but **no search tool or ranked retrieval** | 🔴 **Gap** |
| 8 | Conflict handling (then vs. now; state problem) | **Absent** — only 1 of 5 curation signals touches staleness; no temporal knowledge | 🔴 **Gap** |
| 9 | Forgetting: temporal decay, compression, contradiction resolution, manual curation | Decay/compression/contradiction **absent**; manual curation = `dream-queue.md` + `curate-memory.mjs` (propose-never-apply) | 🟡 Partial |
| 10 | Large-context-window caveat ("bigger room") | `--budget` flag warns about always-on context cost | ✅ Covered |
| 11 | Five-questions self-assessment | `validate-harness.mjs` scores 7 subsystems but no question-based audit | 🟡 Partial |

**Overall:** version-4 implements the **storage and curation half** of the notes' architecture very well (durable stores, two-step save, bounded index, out-of-band curation with human gate). The **retrieval and assembly half** — the context builder, session search, ranking, conflict resolution, and temporal decay — is either documented-only or absent. This is consistent with the notes' own framing: *"storing is the easy part."*

---

## 1. Four memory types — mapping table

### 1.1 Working Memory — ✅ Covered (documented + budgeted)

| Notes claim | version-4 evidence |
|---|---|
| Working memory = what sits in the context window (messages, files, tool results) | `references/context-engineering-pattern.md` — "Context is not a dump. It's a budget" |
| It runs on a budget | Same pattern: SELECT/WRITE/COMPRESS/ISOLATE + hard caps per block; `validate-harness.mjs --budget` prints always-on context lines + estimated tokens |
| Bigger window ≠ better memory | `--budget` advisory warns it's a warning not a gate; the pattern's tradeoffs table says "hard caps per block" cost is "may truncate useful context" |
| Two failure modes: ends / fills up | Both described in the pattern ("session startup slow", "model gets lost in details"); no runtime enforcement |

**Gap (minor):** the notes' "desk" mental model (durable stores → context builder → model) is documented but there is **no code path that assembles a working context** — the harness *instructs* the agent to read files at startup (AGENTS.md step 6), it does not *build* a prompt. For a file-and-instruction harness that is the honest design; flagging it as a gap only if a runtime assembler is in scope.

### 1.2 Episodic Memory — 🟡 Partial

| Notes claim | version-4 evidence |
|---|---|
| "What happened" with a **when** | `memory/journal.md` — append-only dated blocks per session. **This is the closest artifact.** Also `progress.md` ("Last Updated") and `session-handoff.md` |
| Search past sessions for issue history / focused slice | ❌ **No session search.** `journal.md` is read by `curate-memory.mjs` only as a *corpus* for counting recurring tokens; there is no tool for the agent to query past sessions by keyword, date, or outcome |
| Storage: markdown / SQLite+FTS / vector / temporal graph | Markdown only. **No FTS, no vector index, no temporal knowledge graph** — verified: `sqlite`, `full-text`, `vector`, `temporal knowledge`, `session-search` all return zero hits in `version-4/` |
| "Tricky question: can't tell old from new" | `journal.md` entries are dated, so *human* readers can; the **agent** has no retrieval path to exploit the dates |

**Gap (significant):** episodic memory is *captured* (journal) but not *retrievable* by the agent mid-session. The notes' example — "search for `issue #9` and `@codex implement`" — has no implementation counterpart. `curate-memory.mjs` does a token-count search but that is curation, not agent recall.

### 1.3 Semantic Memory — 🟡 Partial

| Notes claim | version-4 evidence |
|---|---|
| Standing facts / rules: repo layout, assignee mapping, approval gate | Two layers: `AGENTS.md` (instruction memory, human-curated) + `memory/index.md`/`memory/<slug>.md` (auto-memory lessons). This maps cleanly |
| Facts get old; conflicts between old and current | **No fact-update mechanism.** `memory` entries are append-only lessons; nothing tracks *when a fact became true* or supersedes it. The notes' own repo (this harness) exercises this daily — see `harness/memory/` for lessons |
| Preferences can fight the current request | `memory-entry.md` explicitly says cross-project preferences belong in user-level memory; but no scoping/priority logic beyond "local wins" documented in `memory-persistence-pattern.md` |
| Storage: KV or markdown | Markdown files only |

**Gap (moderate):** semantic memory is *stored* but has **no update/retirement path except manual curation**. The notes' point — "semantic memory creates maintenance work: what to save, update, retire" — is half-answered: curation can *propose* retirement (via `dream-queue.md`), but no contradiction detection exists (see §4).

### 1.4 Procedural Memory — ✅ Strong

| Notes claim | version-4 evidence |
|---|---|
| "How-to layer": runbooks, checklists, skills | `SKILL.md` + `references/*.md` + `templates/*.md` — textbook skill packaging with progressive disclosure |
| Lives in tool schemas / skill files / orchestration code | All three: `curate-memory.mjs` (orchestration), skill files, and the agent's own tool schema. The notes' "the agent loads the procedure when the task matches" maps to the skill-runtime pattern |
| Can go stale (procedure no longer true) | `references/gotchas.md`; curation's contradiction signal would catch it, but see §4 (not implemented for procedures either) |

**Best-covered quadrant.** version-4's procedural memory is genuinely strong — reusable, versioned, load-on-demand.

---

## 2. The architecture map (durable stores → context builder → model)

### 2.1 Durable stores — ✅ Implemented

- `memory/` discovery: `resolveMemoryDir()` / `loadMemoryFiles()` in `harness-utils.mjs` (supports `harness/memory/`, `memory/`, `.agents/memory/`, `.claude/memory/`; 200-file cap)
- Bounded index: 200-line / 25KB cap enforced in `memoryIndexUsable()`
- Two-step save documented + validated (`structuredHas` needles)
- Append-only journal, graveyard with `Recheck-if`, audit log `.jsonl`

**This half is the strongest part of version-4's memory story.**

### 2.2 Context builder (retrieve → rank → resolve → assemble) — 🔴 **Gap**

| Notes role | version-4 status |
|---|---|
| **Retrieve** the right material | ❌ No retrieval component. Startup instructions say "read memory/index.md" (progressive disclosure is *manual*) |
| **Rank** what outranks what | ❌ No ranking. `memory-persistence-pattern.md` documents "local wins" priority as a *rule for humans*, not a mechanism |
| **Resolve** conflicts | ❌ No conflict resolution logic (see §4) |
| **Assemble** the prompt | ❌ No prompt assembly code; the model receives whatever the agent runtime loads |

**This is the notes' central thesis — "memory is context assembly over time" — and version-4 does not implement a context builder.** It implements the *store* and *instructions for the agent to read the store*, deliberately: the skill's design rule is "keep the root instruction file short: routing and invariants, not a full manual." The gap is real but it is a **scope decision**, not an omission. The notes say "the model only ever works at the desk" — version-4 trusts the agent to build its own desk.

### 2.3 Product-name mapping (Hermes: session search, memory files, skills)

- **Memory files** → ✅ `memory/` store
- **Skills** → ✅ `SKILL.md` + `references/`
- **Session search** → ❌ absent (see 1.2)

---

## 3. Conflict handling — 🔴 **Gap**

The notes' most distinctive claim: *"weak memory treats conflicts as a retrieval problem; strong memory treats them as a state problem — when was this true, what is true now."*

| Notes requirement | version-4 status |
|---|---|
| Detect old-vs-new state (e.g., issue "not approved" → now `@codex implement` present) | ❌ Nothing models *when a fact was true*. Journal entries are dated but no component compares dates or supersedes |
| Vector DB can't tell "then from now" | version-4 has **no vector DB at all** — so it doesn't have the vector-DB failure, but it also has no replacement |
| "The architecture has to model those differences" | ❌ Not modeled. The closest is `memory/graveyard.md` `Recheck-if` (expiry conditions) and curation's "lesson contradicted by reality" signal — both are **manual** and neither handles the fact-vs-fact conflict in the notes' example |

**Concrete failure mode the notes describe that version-4 would exhibit:** an agent reading a stale lesson ("issue #9 not approved") and acting on it, because nothing records that a later event superseded it. `journal.md` would contain both facts; nothing links them.

---

## 4. Forgetting — 🟡 Partial (3 of 4 strategies missing)

| Notes strategy | version-4 status |
|---|---|
| **Temporal decay** — old memories lose priority unless pinned/recent/durable | ❌ Absent. No priority, no pinning, no recency weighting |
| **Contradiction handling** — update current state, preserve old as history | ❌ Absent (see §3). Curation's "contradiction" signal is manual-only and uncounted |
| **Compression** — sessions → summaries → facts → procedures | ❌ Absent as a mechanism. The notes' "detailed sessions become summaries" has no counterpart; journal entries stay raw forever |
| **Manual curation** — propose-never-apply, bounded queue, cadence | ✅ Strongly implemented: `curate-memory.mjs` + `dream-queue.md` (5-proposal cap, prevalence gating, `Recheck-if` expiry) |

**Verdict:** version-4 implements exactly the *last* strategy (manual curation) and it does it well. The three *automatic* strategies the notes list are all absent — which is defensible (the SKILL.md explicitly defers "heavy machinery" for single-operator use) but is a genuine gap against the notes' full model.

---

## 5. Large context windows — ✅ Covered

- `validate-harness.mjs --budget` prints always-on context lines and estimated tokens, matching the notes' "bigger window without curation just moves the mess into a bigger room."
- `context-engineering-pattern.md` hard caps and truncation recovery pointers match the notes' "filing cabinet vs. desk" and "relevant line gets buried."

---

## 6. Five questions — 🟡 Partial (validated, not asked)

| Notes question | version-4 counterpart |
|---|---|
| Q1 What's in working memory right now? | `--budget` prints always-on files (AGENTS.md, memory/index.md, open-work.md) — **partial**: doesn't list tool results or session history |
| Q2 Which past session matters? | ❌ No session search |
| Q3 Which facts are current? | ❌ No fact-currency tracking |
| Q4 Which workflow applies? | ✅ Skills + orchestration scripts |
| Q5 What should be forgotten? | 🟡 Curation covers *some* (decay/compression/contradiction absent) |

`validate-harness.mjs` scores 7 subsystems including memory — a structural audit, but not the notes' five-question behavioral audit. The closest is the memory scorecard (index exists, links intact, journal exists, two-step save, curation gate).

---

## 7. Eval coverage of the gaps

`evals/evals.json` has 19 cases; exactly **2** are memory-related (case #5 Memory Taxonomy, case #16 Memory Curation). Both cover the *storage/curation* half. **No eval exercises**: session search/retrieval, context-builder assembly, conflict resolution, temporal decay, or compression. `run-benchmark.mjs`'s `scoreEvals` only checks case *names* match `memory` and `curation|dreaming` — so the gaps are structurally invisible to the benchmark (the evals/index.md itself warns about exactly this: "the score is silent about topics nobody thought to check").

---

## 8. Prioritized recommendation list

Ordered by leverage (what would most change real agent behavior per unit of work), with a ponytail lens — the smallest thing that actually closes each gap:

| Pri | Gap | Smallest honest fix | Notes-relevant |
|---|---|---|---|
| 1 | **No session search** (episodic recall) | Add a `scripts/search-journal.mjs` that takes keywords and returns dated journal blocks with context — a 50-line grep+rank over `journal.md`, no vector DB. Wire it as a documented tool the agent may call | §1.2, §2.2 |
| 2 | **No context-builder** | Don't build one. **Document the design decision** in `memory-persistence-pattern.md`: v4 is a *store-and-instruct* harness; the runtime (Claude Code, Codex, etc.) assembles context. Name it as an explicit non-goal with an upgrade trigger (multi-agent / large-store) | §2.2 |
| 3 | **No conflict/currency handling** | Add a second curation signal to `curate-memory.mjs`: journal blocks referencing the *same* backticked token with *different* states → propose a "supersede or reconcile" proposal. That is countable, in the spirit of the existing two signals, and directly implements the notes' "then vs. now" | §3, §4 |
| 4 | **No decay/compression** | Document as debt in `open-work.md` with an explicit trigger (index hitting 80% cap), not a build. The 200-line cap is the decay pressure valve; compression is only worth building when it actually fills | §4 |
| 5 | **Eval blind spots** | Add eval cases for retrieval and conflict handling *if* #1 and #3 ship; otherwise leave — an eval for a feature that doesn't exist is scaffolding | §7 |

**Ponytail verdict:** 4 of the 5 recommendations are either "document the non-goal" or "add a ~50-line script." The only genuinely new mechanism worth building is the conflict-detection curation signal (#3), and it slots into an existing script with the existing proposal shape.

---

## 9. Honest framing

Two cautions, so this report isn't over-read:

1. **version-4 is a harness for a *host agent runtime* (Claude Code, Codex, etc.).** Its memory is *files + instructions* by design. The notes describe *runtime* memory architecture (the context window, tool results, prompt assembly) — a layer version-4 intentionally does not own. Several "gaps" (§2.2, some of §1.1) are therefore **scope boundaries, not defects**. The report marks them as gaps because the user asked for a comparison, but they should be read as "deliberately delegated to the runtime."
2. **The storage/curation half is genuinely excellent.** Two-step save, bounded index with dangling/orphan detection, propose-never-apply with a capped queue, prevalence-gated proposals, `Recheck-if` expiry, and a mutation-tested validator — this is more rigorous than most "agent memory" implementations. The gaps are in the *retrieval* half, which the notes themselves call the hard part.

---

*Report generated from direct file inspection of `version-4/` (scripts, references, templates, evals) against the concepts in `The_Agent_Memory_Stack_Notes.md`.*
