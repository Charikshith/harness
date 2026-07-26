---
type: changelog
title: "Changelog"
description: "Reverse-chronological history of changes to the harness-creator skill"
tags: [changelog, history, releases]
updated: 2026-07-26
---

# Changelog

## 2026-07-26 (v0.4.0)

### Enricher: snippets no longer land inside the anchored section
`enrich-harness.mjs` spliced a new section in on the line right after the anchor heading,
pushing that section's own content below it. On a real AGENTS.md the Memory section anchored
on `## Working Rules` left all six Working Rules bullets under `## Memory`, reading as its
content. Nothing failed; the file just said something other than what it meant.

The inline loop is now `insertAtAnchor()` in `harness-utils.mjs`, fixing four bugs that
shared that root: insertion point, inserting once instead of after every anchor match,
fence-awareness (a `#` shell comment in a bash block is not an h1), and reading the
in-progress buffer so Curation can anchor on the `## Memory` heading the previous fix just
added. Single-line snippets insert flush, since those add a bullet to a list or a flag under
a shebang.

`scripts/insert-anchor.test.mjs` covers it — 7 assert-based checks, wired into `init.sh`.
Every case is a bug that shipped. Regression-probed: reverting the insertion-point fix fails
three checks and exits 1.

### One version scheme
The skill was carrying two, and they disagreed. Folder and title said `v3`/`v3.1`, the
`memory` pill said `v3.1`, `SKILL.md` said `0.3.1`, and this file said `v0.4.0`.

Collapsed onto the scheme this file already used:
- `version-3.1/` → **`version-4/`**. `SKILL.md` name → `harness-creator-v4`, titles →
  `Harness Creator v4` / `harness-creator v4`. `version-3/` is untouched frozen history.
- Labels that answer *"when did this land"* became semver, not `v4`. "New in v3" is now
  "Since v0.3.0"; the memory pills are `v0.3.1`. Relabelling those `v4` would have claimed
  behavioral policies and the memory subsystem shipped in this release, which is false.
- `README.md`'s install and usage commands pointed at `version-3/scripts/...` — the
  *previous* generation — while documenting current behaviour. Now `version-4/`.
- Authoritative version lives in exactly two places: the `SKILL.md` semver and these
  headings. `README.md` says so, so the folder name cannot drift back into being a claim.

`harness-components.html` was a stale v0.3.1 snapshot and its "Still open" list had gone
false on all three counts: evals now cover memory and curation (19 evals, coverage 100/100),
both examples score 100/100 with `memory: 5/5`, and `scripts/curate-memory.mjs` ships.
Replaced with what is *currently* open, each item verified rather than assumed.

**Breaking: install layout.** A scaffold used to drop eleven entries in the project root.
Now it drops three, and everything else lives under `harness/`.

```
AGENTS.md    CLAUDE.md    init.sh    harness/
```

### Why those three stay at the root
Not a style choice, and not negotiable per-project:
- **`AGENTS.md`** is the cross-tool convention. Codex, Cursor, Copilot, Zed and Aider all
  read it from the repo root. Moving it breaks every agent except Claude Code.
- **`CLAUDE.md`** points at `AGENTS.md`, and Claude Code only looks in the root.
- **`init.sh`** is invoked as `./init.sh` by docs, humans and CI.

Everything else is read only by this harness, so nothing outside cares where it sits.
`ROOT_FILES` in `scripts/lib/harness-utils.mjs` is the single definition; `harnessPath()`
is the only way to spell the layout.

### Path convention
**Every path in the harness is relative to the project root**, in every file, including
files that already live inside `harness/`. One rule, no depth arithmetic — the alternative
(each file relative to itself) was rejected because `AGENTS.md` and `harness/progress.md`
would then spell the same target two different ways, which is exactly the kind of thing
that reads as correct and resolves to nothing.

The single exception is the link targets inside `harness/memory/index.md`, which stay
sibling-relative so the file remains readable standalone. `memoryIndexLinks()` now strips a
`harness/memory/` prefix too, so both spellings resolve and neither reports as orphaned.

### Backward compatibility
A harness on the flat layout keeps working and keeps its score. Both were measured at
100/100 before and after.
- `loadHarnessFiles()` probes `harnessPath(name)` then the bare root name, and keys results
  on the canonical bare name either way — so `scoreHarness()` never learns the layout and
  needed no change at all.
- `MEMORY_DIR_CANDIDATES` gained `harness/memory` at the front, ahead of the existing
  `memory`, `.agents/memory` and `.claude/memory`.
- New **`detectHarnessLayout()`** + **`locateHarnessFile()`**: an existing file is found
  where it actually is, and a *missing* one is created into the layout the project is
  already using. This was a real bug first, not a precaution — `enrich-harness.mjs --apply`
  on a flat harness with `progress.md` deleted created `harness/progress.md`, leaving ten
  files at the root and one a level down. A split layout is worse than either layout,
  and no individual check catches it because every file is still findable on its own.
  `create-harness.mjs` routes through the same resolver, so re-running it over a flat
  harness skips instead of duplicating.

### Moved
- `feature_list.json`, `progress.md`, `session-handoff.md`, `dream-queue.md`,
  `open-work.md`, `memory/`, `environment.md` → under `harness/`.
- Generated reports too: `harness-benchmark.json`, `harness-assessment.html` and
  `memory/audit-log.jsonl`. The audit log follows `resolveMemoryDir()`, so it lands beside
  whichever store the project already has rather than starting a second one.
- **`environment.md` is the one moved path inside a shell script.** `init.sh` stays at the
  root but now reads `harness/environment.md` via an `ENV_CONTRACT` variable. Changed in
  *both* `templates/init.sh` and `initScriptFromCommands()` — the same trap v0.3.2 recorded
  for this block, since `create-harness.mjs` generates `init.sh` and never copies the
  template. Verified by running a real scaffold with a passing and a failing contract.
- Both bundled examples were `git mv`'d rather than regenerated, preserving their curated
  memory content. Still 100/100 each.

### Not moved
`references/*.md` describe layout-agnostic *patterns*; their generic `memory/` and
`dream-queue.md` prose is deliberately unprefixed. Only the lines stating facts about this
scaffolder were corrected. The directory tree in `README.md` is the skill's own source
layout, not scaffolded output, and is unchanged.

### Also
- `SKILL.md` had been left at `version: "0.3.1"` while the changelog already recorded
  v0.3.2. Bumped to `0.4.0` rather than backfilling a version nobody shipped under.
- Pre-existing, unfixed: both examples' `init.sh` predate the environment-contract block
  and don't contain it. Harmless today (the check is vacuously true without the file), but
  they are no longer byte-identical to a fresh scaffold.

## 2026-07-26 (v0.3.2)

Five clusters from `research/missing-subsystems.md`, built in the dependency order set out
in `research/implementation-plan.md`. **No new subsystem and no denominator change** — the
scale stays a percentage of 35. Four of the six clusters extend an existing subsystem or
ship unscored, applying the lesson v0.3.1 paid for when adding `memory` moved the
denominator from 30 to 35.

### Prerequisite fix (P0)
- **Both bundled examples had a stale `AGENTS.md`.** They received the v0.3.1 memory *files*
  but were never regenerated, so neither contained a `## Memory` section and both failed
  `Two-step save invariant documented`. Fixed via the `GAP_FIXES` entry that already existed
  for that message. 97 → **100** each.
- **`CHANGELOG.md` recorded the wrong cause for it** — "the fifth point requires a non-empty
  index" described a design ceiling that does not exist. Corrected in place, so the wrong
  claim stays visible rather than being quietly rewritten.

### Cluster F — Environment contract (`verification` 5 → 6 checks)
- New optional **`templates/environment.md`**: preconditions as table rows whose Check cell
  is a shell command. Exit code is the verdict; no output parsing.
- `init.sh` runs the contract **first, under its own heading**, and exits 1 with an explicit
  "this is the machine, not the code" message. The loop sits inside an `if` so `set -e`
  doesn't abort on the first unmet requirement — four surfaced together beat four re-runs.
- New check `Declared environment preconditions are checked by the entrypoint`, vacuously
  true when the file is absent. Absence isn't a defect; declaring preconditions and never
  checking them is, because the file reads as a guarantee.
- **The block lives in both `templates/init.sh` and `initScriptFromCommands()`.**
  `create-harness.mjs` generates `init.sh` and never copies that template, so editing only
  the template would have made the check unsatisfiable by construction for every scaffolded
  project. Found by testing a real scaffold rather than the template.

### Cluster B — Graveyard (`memory` 6 → 7 checks)
- New **`templates/memory-graveyard.md`** → `memory/graveyard.md`. Rows carry `Because`
  (observed failure), `Blast` (what abandoning it cost), `Sessions`, and **`Recheck-if`**.
- **`Recheck-if` is mandatory.** A row without one is folklore — obeyed forever or ignored
  entirely, with no way to tell which from the file.
- New check `Graveyard entries carry a cause and an expiry condition`; optional file, so
  absence passes and only malformed rows fail.
- **Ships with the regression fix it requires.** `memoryLinksIntact` treats every `.md`
  under `memory/` that isn't `index.md` or `journal.md` as a lesson needing an index link.
  The graveyard is neither, so scaffolding it without excluding it reported it as orphaned —
  measured at `memory` 4/5 → 3/5, overall 97 → 94. The exclusion is in the same commit, not
  a follow-up. Any future non-lesson artifact under `memory/` needs the same entry.
- Fifth curation signal **"reconsidered"** documented: a graveyard route resurfacing means
  either the prohibition went unread or its `Recheck-if` quietly came true.
- Fifth journal question: *"What did I try and abandon, and why?"*

### Cluster A — Verification adversary (`verification` 6 → 7 checks, opt-in)
- New **`scripts/mutate-gate.mjs`**. Two probes: `runtime` mutates the project and runs
  `init.sh`; `validator` mutates `init.sh` and re-scores.
- New check `Gate demonstrably catches known breakage`, fed by `--mutate` on
  `validate-harness.mjs`. **Vacuously true when unmeasured**, so every existing invocation
  scores identically.
- `scoreHarness` gains an optional second argument rather than becoming async — measuring
  the rate copies the project and runs its gate, which shouldn't sit behind every `--json`.
- **Phase 0 found the premise true and worse than assumed.** An `init.sh` reduced to
  `set -e; exit 0`, running zero checks, scored `verification: 5/5` and `Overall: 100/100`.
  Root cause: two verification checks read `init + agents`, so `AGENTS.md` prose satisfies
  "Test command documented" whatever `init.sh` contains.
- **Two design errors corrected by running it**, both recorded rather than quietly fixed:
  1. Mutating `init.sh` then running `init.sh` is unkillable by construction — you cannot
     catch a deleted gate by running the gate you deleted. Phase 0's `early-exit` reported
     SURVIVED on every input, which is not a signal. Replaced by a positive control:
     `inject-failing-test` writes an always-failing test in the project's own discovery
     convention, so a gate that runs tests must go red.
  2. `hollow-gate` and `strip-all-commands` survive on a well-tested project too. Counting
     them would cap every project at 50%, under the 80% threshold, so the check could never
     pass — and a check that cannot pass is not a signal. They now print under **Scorer
     blindness** and are excluded from the rate: they measure this skill, not any project.
- Kill rate is therefore scored over **runtime probes only**. A project with no test suite
  reports "no applicable mutations" and passes — nothing to verify cannot be verified badly.

### Cluster C — Longitudinal telemetry (unscored, permanently)
- New `appendAuditEntry()` and `--log`: one JSON line per audit to
  `memory/audit-log.jsonl` — timestamp, overall, bottleneck, per-subsystem scores.
- **Never a gate.** A trend can say "this got worse"; it cannot say "this is unacceptable",
  because acceptable is contextual. Wire it to an exit code and the cheapest way to go green
  becomes "stop measuring honestly".
- Append-only via `appendFile`, never read-modify-write, so a corrupted tail costs one line.
- `.jsonl` not `.md` on purpose: `loadMemoryFiles` filters on `.md`, so the log is invisible
  to the memory checks and cannot be reported as an orphaned lesson.

### Cluster E — Recruitment signalling (`scope` 5 → 6 checks)
- New **`templates/open-work.md`**: one line per declined item with a reason code
  (`blocked-on`, `needs-review`, `cheap-parallel-win`, `flaky`) and the feature it was seen in.
- The `AGENTS.md` change is a **redirect, not an addition** — the existing "mention them in
  `progress.md`" line now names a structured file something can read.
- Startup step 5 **extended, not renumbered**: inserting a step would renumber 6–8, and
  renumbering is what produced the `5.5` workaround that `structuredText`'s list matcher
  silently discarded in v0.3.1.

### Cluster D — Context economics (unscored, advisory)
- `--budget` reports always-on context in lines and estimated tokens. `chars / 4` on
  purpose: budget awareness, not accounting, and a real tokeniser would be a dependency.
- A `console.log`, not a check. A budget is a warning and there is no defensible universal
  ceiling.

### Deliberately not built
- **Attention auction** — needs several competing request sources arriving often enough that
  arbitration matters. With `dream-queue.md` and `open-work.md` only just created, it would
  be a market with one seller. Revisit when both are in real use and a human reports feeling
  flooded in one session.
- **Cluster C phase 1** (delta, feature-status hash, dual-clock, "no trend yet" guard) —
  should be designed against a log with real entries, not a guessed one.
- The eight traps in `research/missing-subsystems.md` §7 remain unbuilt, each with a
  documented revisit trigger.

### Eval coverage (gap closed after the cluster work)
- **Three eval cases added** — #17 Negative Knowledge (Graveyard of Abandoned Routes),
  #18 Environment Contract for External Preconditions, #19 Verification Adversary
  (Mutation-Testing the Gate). 16 → **19 cases**.
- **Three coverage checks added to `scoreEvals`.** Cases alone would have been invisible:
  the score is computed over named-coverage checks, so without new checks the same 13/13
  would have printed and the additions would not have registered anywhere.
- **The old 100/100 was measuring 13 things and silent about 3.** Re-running the previous
  16 cases against the new check set scores **13/16 (81/100)** — that gap is what the
  earlier number concealed. With all 19 cases: 16/16, 100/100.
- Expectations are written from what the build actually established, not from the feature
  descriptions, so each case would catch a regression. #19 requires that unkillable-by-
  construction probes are rejected and that mutants surviving on every project are excluded
  from the rate; #18 requires the check to reach generated entrypoints and not only the
  template; #17 requires that adding the file does not trip the memory link-integrity check.
  All three encode failure modes hit while building the clusters.

### Both remaining gaps closed

**1. The `init + agents` concatenation no longer lets a hollow gate score 5/5.**
- New verification check `Entrypoint actually runs a command` (7 → **8 checks**). Parses
  `init.sh` for at least one line that isn't a comment, blank, shebang, `set -*`, `echo`,
  `exit`, or a bare shell control keyword. `exit` is excluded deliberately: exiting is not
  verifying.
- **The two existing checks were left alone.** They ask whether a test command is
  *documented*, and documenting it in `AGENTS.md` is legitimate — narrowing them to `init`
  would fail every harness that keeps its command list in prose. "Does the entrypoint run
  anything" is a different question, so it got its own check rather than a redefinition of
  theirs.
- An `init.sh` of `set -e; exit 0` now scores `verification: 4/5`, `Overall: 97` **without
  `--mutate`**. Previously 5/5 and 100.
- **Consequence: `hollow-gate` and `strip-all-commands` became killable**, so their
  exclusion from the kill rate is obsolete and has been removed. Both probe types are now
  scored. `mutate-gate.mjs` still distinguishes them in output, because a surviving
  *validator* mutant means fix a check while a surviving *runtime* mutant means fix the repo.

**2. Curation has a script.** New **`scripts/curate-memory.mjs`**.
- Reads `memory/journal.md`, `memory/index.md`, topic files and `memory/graveyard.md`;
  writes to `dream-queue.md` and nothing else, and only with `--apply`.
- **Two of the five signals are countable, three are not**, and the split is stated rather
  than hidden. Countable: recurring-but-unrecorded (a backticked token in ≥2 dated journal
  blocks with no lesson in the store) and reconsidered (a graveyard route resurfacing).
  Judgement: contradiction, dead stock, staleness. The script prints those three as a
  checklist on every run, because a pass reporting only what it counted reads as a pass that
  found everything there was.
- Only dated `## YYYY-MM-DD` blocks are mined, which excludes the template's own
  instructional prose without needing a stoplist. HTML comments are stripped first — every
  one of these templates documents its row format inside a comment, and matching there mines
  the instructions for evidence, the same trap `memoryIndexLinks` had to avoid.
- Respects the 5-proposal cap and reports what it withheld. Deduped against Open **and
  Decided**, so a rejected proposal does not return next cycle — the loop the Decided table
  exists to break.
- **Two bugs found by testing and fixed before commit:** without queue dedupe, every pass
  re-proposed the same tokens; and the insertion-point scan found the last table row *inside
  the trailing HTML comment* and wrote proposals in there, where no later read would ever
  see them. Insertion is now confined to the Open section and to the region before any
  comment.
- Verified by checksum that `memory/` and `AGENTS.md` are byte-identical across `--apply`.
  That boundary is structural: the script opens nothing else for writing.

### Known gaps in this release
- **`scoreEvals` still has no structural subsystem → eval map.** It scores named coverage,
  so a topic nobody adds a check for stays invisible. Cases now exist for all seven
  subsystems and for both unscored tools' underlying ideas, but the mechanism remains a
  checklist rather than a derivation.
- **Curation's judgement signals remain manual**, by design. Automating "these two lessons
  contradict" needs a model call, which breaks the zero-dependency rule the whole skill is
  built on.

## 2026-07-25 (v0.3.1)

### Memory subsystem (major)
- **Memory is now the seventh subsystem**, scored alongside the five structural ones and behavioral policies. Rationale: a harness can track state perfectly and never learn anything. `progress.md` and `feature_list.json` record *where work stopped* (a bookmark); memory records *what is now known* (a lesson). Previously memory existed only as a reference pattern — advice, with nothing scaffolding, templating, or scoring it.
- **BREAKING (scoring):** overall is now a percentage of **35** instead of 30. Harnesses built under v0.3.0 will score lower until memory is added — roughly 10-11 points. A previously-perfect harness lands at **89/100**. Percentage alone does *not* cross the 85 production boundary at that value, so the tier is now additionally gated on the weakest subsystem (see below) rather than on percentage alone.
- **Usability tier now gates on the weakest subsystem.** A harness scoring ≥85 overall but with any subsystem at ≤1/5 reports `usable`, not `production`. Without this, the tool could print `Bottleneck: memory`, `memory: 0/5`, and `✅ production` simultaneously — a single subsystem is worth only 5/35 (~14%), so total failure of one cannot move the percentage out of the top band by itself.
- **Bottleneck now tie-breaks toward structural subsystems**, and a new `Also low:` line names every other subsystem at ≤2/5. Memory is new, so nearly every existing harness scores 1 on it and would otherwise win the bottleneck sort forever — masking a genuinely broken `verification` or `lifecycle` behind a scaffolding gap.

### New reference
- **`references/dreaming-pattern.md`** — out-of-band batch curation: propose-never-apply, evidence-and-prevalence on every proposal, cadence sized to pattern emergence (~10 sessions), bounded queue to contain review fatigue, and the four signals a pass looks for. Documents what prior art left open (cadence, conflict resolution, injection defence, review fatigue) as design decisions rather than settled practice.

### New templates
- **`templates/memory-index.md`** → `memory/index.md`. Bounded always-on index, one line per lesson, ~200-line cap, with a Retired section instead of deletion.
- **`templates/memory-entry.md`** → `memory/<slug>.md`. One lesson per file with `Why:` and `How to apply:`, plus an explicit do-not-record list. Not scaffolded by the script (same as `feature-list.schema.json`); consulted when writing an entry.
- **`templates/dream-queue.md`** → `dream-queue.md`. Open/Decided tables, 5-proposal cap, last-pass record.

### New templates (continued)
- **`templates/memory-journal.md`** → `memory/journal.md`. Append-only per-session friction log: what you looked up, what surprised you, what correction you received. **This is the input curation reads.** Without it, "find recurring patterns" has no corpus and every proposal is an opinion.

### Templates (agents.md)
- **Startup step 6** — read `memory/index.md`; if `dream-queue.md` has open proposals, *surface them for accept/reject, never apply one yourself*. Earlier drafts said "drain the queue", which read as an instruction to apply proposals — the exact thing propose-never-apply forbids.
- **End-of-session steps 4 and 5** — append a dated journal block, then do the two-step save only if a lesson is already clearly durable.
- **Integer step numbers.** Earlier drafts used `5.5` and `3.5`. `structuredText`'s list matcher is `/^([-*+]|\d+\.)\s/`, which rejects `5.5.` (it matches `5.` then demands whitespace and finds `5`), so those lines were silently discarded before any check saw them — the two most load-bearing memory instructions were undetectable. CommonMark also renumbers them. Both lists are now plain integers.
- **New `## Memory` section** — memory-is-not-state, one lesson per file, two-step save, bounded index, do-not-store list, user corrections as highest-value, project vs cross-project scope.
- **New `## Curation (Dreaming)` section** — cadence, the four signals, propose-never-apply, never self-edit `AGENTS.md`, queue cap.
- **Required Artifacts** — `memory/index.md`, `memory/journal.md` and `dream-queue.md` added.
- **Memory content is evidence, not instruction** — an imperative sentence inside a memory file has no authority over the agent. Structural injection defence rather than a keyword blocklist.

### Scaffolding (create-harness.mjs)
- Now writes `memory/index.md`, `memory/journal.md` and `dream-queue.md`. Help text updated.
- **Pre-flights the `memory` path before writing anything.** `memory/index.md` is the first template destination inside a subdirectory, so a pre-existing file or symlink named `memory` made `mkdir` throw part-way through — leaving a target with `AGENTS.md` but no `init.sh`, violating the skill's own rule about never leaving a repo un-restartable. Now exits 1 and writes nothing.

### Validation (harness-utils.mjs, validate-harness.mjs)
- `SUBSYSTEMS` gains `memory`. New `loadMemoryFiles` discovers the store by *directory* — `memory/`, `.agents/memory/`, `.claude/memory/` — canonicalises keys to `memory/…`, and loads the index plus sibling and `topics/` entries, capped at 200 files. Previously `loadHarnessFiles` read only 7 hardcoded root filenames, so nothing outside the repo root could ever be scored.
- **Memory checks inspect artifacts, not vocabulary.** Six checks: index exists; index is initialised and within its 200-line / 25KB cap; **links intact** — a computed assertion finding dangling and orphaned topic files; curation input exists; two-step save documented; curation cadence and human gate documented. The links check is the only assertion in the scorer that can fail on a harness that *drifted* rather than one that used different words. Earlier drafts grepped `AGENTS.md` for phrases, so a five-line stub with an empty index scored 5/5 while a well-run store using different nouns scored 0/5. Over-generic needles (`two-step`, `cadence`) are gone.
- Checks now carry a stable `message` plus a variable `detail`, because `enrich-harness.mjs` keys `GAP_FIXES` on the exact message string. Reporters render `message — detail`.
- **`allText` now excludes `memory/`.** Agent-written memory was feeding corpus-wide checks, so the word "Evidence" in a dream-queue table header satisfied verification's "evidence is recorded" check for free. Every check reading `allText` is now stricter.
- Reporters derive the non-structural group from `SUBSYSTEMS` rather than a hardcoded name list, so an eighth subsystem needs no reporter change. One separator per group instead of one per subsystem; `SECTION_LABELS` hoisted to module scope and escaped at use.
- Help text and report subtitle updated for seven subsystems.

### Remediation (enrich-harness.mjs)
- `GAP_FIXES` entries added for the memory index, the journal, and the `## Memory` / `## Curation (Dreaming)` sections, so `--fix` can retrofit memory into an existing harness. The two integrity checks are deliberately **not** auto-fixable: repairing them means writing or pruning real lessons, which is judgement, not scaffolding.

### Documentation reconciliation
- `references/memory-persistence-pattern.md` classified progress logs and session handoffs as "auto-memory", contradicting the state-vs-memory distinction that justifies memory being its own subsystem. Its layer list now separates **auto-memory** (the `memory/` store) from **state artifacts** (progress, handoff, plans), with the practical test for telling them apart. Its `.claude/memory/` path and cross-layer-promotion bullet now match what ships.
- `types.md` gains `memory` and `proposal` types, so the new templates do not carry undeclared `type` values.

### Documentation
- SKILL.md: Core Model table gains Memory; new "Add memory to a harness" task section describing the two-part build order (store first, curation only once there is something to curate, heavy machinery deferred as debt); Deliverable Checklist and reference routing updated.

### Known gaps in this release
- **`run-benchmark.mjs`'s `scoreEvals` has no per-subsystem coverage notion.** It now checks for a memory *and* a curation eval by name, but has no structural map from subsystem → eval, so it cannot report which subsystems are covered. Deferred: a design task, not a scaffolding fill. Eval coverage is at least honest now that both memory cases exist (13/13).
- Curation is documented, templated and gated, but has **no bundled script** — the first passes are run by hand. Deliberate: automate only after a manual pass shows what it actually finds.

### Gaps closed after initial release
- **Memory curation eval added.** `evals/evals.json` gains case #16 "Memory Curation (Dreaming) Design", satisfying `scoreEvals`'s `curation|dreaming` check. Eval coverage: 12/13 → **13/13**. (The `memory` check was already met by case #5 "Memory Taxonomy Design".)
- **Both examples now carry a memory store.** `examples/react-harness` and `examples/python-api-harness` gain `memory/index.md`, `memory/journal.md` and `dream-queue.md` (copied verbatim from `templates/`, identical to `create-harness.mjs` output). Both move from `memory: 1/5` / `89` / `usable` to `memory: 4/5` / `97` / **`production`**.

  **Corrected 2026-07-26:** the line above originally claimed 4/5 was "the honest ceiling for a fresh harness — the fifth point requires a non-empty index." That was wrong, and it pointed readers at a design limit that does not exist. The actual failing check was `Two-step save invariant documented`: both examples received the memory *files* but their `AGENTS.md` was never regenerated from the updated template, so neither contained a `## Memory` section (0 occurrences of `two-step save` in either). It was a stale artifact, not a ceiling — and auto-fixable by the `GAP_FIXES` entry that already existed for that exact message. After `enrich-harness.mjs --apply`, both examples score `memory: 5/5` / **`100`**. A fresh scaffold from the current template scores 5/5 on memory immediately.
- **`README.md`'s dimension table** already carries a Memory row; the earlier note was stale.

## 2025-07-17 (v0.3.0)

### Behavioral Policies (major)
- **Coding Policy section** added to AGENTS.md template — the Ponytail 6-rung ladder (YAGNI → stdlib → native → dep → one-liner → minimum). Embedded directly; no external skill dependency.
- **Coding Standards section** added — minimum code, no speculative features, no unrequested abstractions, no error handling for impossible scenarios, `ponytail:` comment convention.
- **Editing Discipline section** added — surgical changes (Karpathy §3): touch only required lines, match existing style, don't refactor unbroken things, mention but don't fix unrelated issues, clean up only your own orphans.
- **Test-first Definition of Done** — bugs: reproduce first then fix; features: write check first then implement.
- **Before Multi-Step Work section** added — one-line success criterion, numbered plan with per-step verify checks.
- **Proactive assumption surfacing** in Startup Workflow (step 7) — structural ambiguity → stop and ask; cosmetic ambiguity → default and proceed.
- **Safety section** added — explicit never-simplify-away list: validation at trust boundaries, data-loss prevention, security, accessibility, hardware calibration.
- **Escalation** expanded — "over-specified requirements" added as an escalation trigger.

### Templates
- **progress.md** — "What's Next" promoted to per-step verification format (description → verify: check). "Ponytail Debt" section added for tracking deliberate shortcuts. "Notes for Next Session" expanded with unrelated-issues capture.
- **agents.md** — completely rewritten with embedded behavioral policies (~130 lines vs v2's ~90).

### Validation (validate-harness.mjs)
- **New scoring dimension: behavioral** — validates presence of coding minimalism ladder, surgical editing rules, test-first verification gate, assumption surfacing, and safety carve-outs.
- Score now covers 6 dimensions (5 structural + 1 behavioral) instead of 5. Overall becomes percentage of 30 instead of 25.
- Behavioral checks are weighted into the overall score but reported separately for clarity.

### Enrichment (enrich-harness.mjs)
- Gap fix map expanded to cover all new behavioral sections (Coding Policy, Coding Standards, Editing Discipline, Safety, test-first DoD, Before Multi-Step Work, expanded Escalation).

### Documentation
- SKILL.md updated to describe behavioral policy layer alongside structural subsystems.
- README updated for v3 feature set.

## 2026-07-15 (v0.2.0)
- Added YAML frontmatter (`type`, `title`, `description`, `tags`, `updated`) to all 7 reference files
- Added YAML frontmatter to all 6 template files
- Created `types.md` document type taxonomy (8 types)
- Created index files: `references/index.md`, `templates/index.md`, `scripts/index.md`, `evals/index.md`
- Added "Why This Template" cross-references linking templates back to patterns
- Added version field (`0.2.0`) to SKILL.md frontmatter
- Updated SKILL.md "When to Read References" to point at index files
- Added usability tiers to validate-harness.mjs scoring output
- Added `--fail-fast` and `--no-fail` flags to validate-harness.mjs
- Added `enrich-harness.mjs` script for gap-to-fix enrichment
- Added `examples/` directory with populated React and Python harness bundles

## 2024-07-10
- Added `--agent-file` support to create-harness.mjs (uses `AGENTS.md` by default)

## 2024-06-28
- Initial release: create, validate, benchmark, 10 evals
- 7 reference patterns, 6 templates, 4 scripts
- CLI scripts: create-harness.mjs, validate-harness.mjs, render-assessment-html.mjs, run-benchmark.mjs
