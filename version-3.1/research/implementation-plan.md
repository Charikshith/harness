---
type: reference
title: "Implementation Plan — the six missing-subsystem clusters"
description: "Phased build plan for every cluster in missing-subsystems.md: what ships in what order, which files change, how it's scored (or deliberately isn't), effort, dependencies, and definition of done"
tags: [research, roadmap, implementation, plan, scoring]
timestamp: 2026-07-26
status: plan — proposed sequencing, nothing here is scheduled or committed
---

# Implementation Plan

Companion to [`missing-subsystems.md`](missing-subsystems.md). That document is the *why*
— six clusters of absent capability, found by divergent ideation, each with a scored
shortlist and three deepened branches. This document is the *how*: for every cluster,
what actually gets built, in what order, touching which files, at what cost, and how you
know each phase is done.

Nothing here is scheduled. It is a plan to pick up from, not a commitment already made.

---

## 0. Ground rules before touching anything

Four decisions apply across all six clusters. Get these wrong and every phase below
inherits the mistake — this is exactly the shape of error the memory-subsystem work
earlier in this project made and then had to unwind.

### 0.1 Most of this should NOT become a new scored subsystem

The harness already paid for this lesson once. Adding `memory` as subsystem 7 changed the
denominator from 30 to 35, dropped every existing harness's score by ~11 points, and
required retrofitting tier-gating and bottleneck tie-breaking after the fact just to stop
the tool from lying (`✅ production` next to `memory: 0/5`).

**Default posture: extend an existing subsystem's checks, or ship as an unscored tool.**
Only propose a new subsystem when the capability is checking something structurally
unlike anything the seven already check. By that bar:

| Cluster | Recommended treatment | Why |
|---|---|---|
| A. Verification adversary | **Extend `verification`** | It's a better verification check, not a new question |
| B. Graveyard | **Extend `memory`** | It's a fifth memory artifact, not a new question |
| C. Telemetry | **Unscored tool** (own script + log) | Measures *trend*, which none of the 7 subsystems do or should — see 0.2 |
| D. Context economics | **Unscored tool** (advisory only) | A budget warning, not a pass/fail gate |
| E. Recruitment signalling | **Extend `scope`** | It's what scope discipline does with what it declines |
| F. Environment contract | **Extend `verification`** (new check) or `init.sh` template | Fits the existing "entrypoint checks the world" job exactly |

Zero of the six need subsystem 8. If a future finding genuinely doesn't fit any existing
subsystem, apply the same discipline used for memory: build it, prove it discriminates on
real drift, *then* decide if it earns a denominator change — never the reverse.

### 0.2 Telemetry is deliberately never a gate

This is worth stating as a hard rule, not a preference. A trend can tell you "this got
worse" — it cannot tell you "this is acceptable," because acceptable is contextual
(a prototype decaying is fine; a production repo decaying is not). Wiring a trend into
`process.exitCode` invites exactly the gaming failure documented in Cluster C: the fastest
way to stop a bad trend from failing CI is to stop measuring honestly. Telemetry reports.
It never fails a build.

### 0.3 Build order is dependency-driven, not score-driven

Three of the six clusters produce artifacts the others want to consume:

```
F (environment contract)  ──┐
                             ├──▶  C (telemetry)  consumes both as extra fields
A (verification adversary) ──┘         │
                                        ▼
                              B (graveyard) — independent, but its
                              curation signal is sharper once C exists
                                        │
                                        ▼
                              E (recruitment signalling) — benefits from
                              a place to land ("cheap-parallel-win" markers
                              are more useful once telemetry shows churn)
                                        │
                                        ▼
                              D (context economics) — last, because it's
                              advisory-only and cheapest to retrofit later
```

Build F and A first — both are small, standalone, and each hands C a field for free.
Building C third means it launches with two real signals instead of zero.

### 0.4 Every phase 0 must be provably inert before phase 1 starts

The pattern already established for the memory checks (`obs()` fail-open, `mkdir` guard
before any write) repeats for a reason: a new mechanism that can corrupt the one thing
that currently works (`init.sh`'s exit code) is a worse outcome than not building it. Every
cluster below has a phase 0 whose only job is proving the new machinery cannot break
existing scoring, before it's given anything real to check.

---

## 1. Cluster A — Verification adversary

**Scoring treatment:** extend `verification`. Add one computed check
(`Gate demonstrably catches known breakage`) alongside the existing five text checks.

### Phase 0 — prove it's inert (½ day)

Write `scripts/mutate-gate.mjs` with exactly two mutations and **no scoring hookup**:

```js
// scripts/mutate-gate.mjs (phase 0 — standalone, not called by validate-harness.mjs yet)
const MUTATIONS = [
  { id: 'early-exit', apply: (initSh) => initSh.replace(/^(#!.*\n)/, '$1exit 0\n') },
  { id: 'neuter-first-check', apply: (initSh) => {
      const lines = initSh.split('\n');
      const i = lines.findIndex(l => l.trim() && !l.trim().startsWith('#') && !l.startsWith('#!'));
      if (i >= 0) lines[i] += ' || true';
      return lines.join('\n');
  }}
];
// copy target to a scratch dir, apply one mutation to init.sh, run it, report exit code
```

Run it against the harness's own scaffolded output. **Expected result: `early-exit`
SURVIVES** — proving the gate cannot currently tell a real check from a disabled one.
That single result is the justification for the rest of this cluster; if it doesn't
survive, stop and re-examine the assumption before building further.

- [ ] `node scripts/mutate-gate.mjs --target <scratch-scaffold>` prints KILLED/SURVIVED
      for both mutations
- [ ] Confirmed `early-exit` survives against an unmodified scaffold
- [ ] Script has zero effect on `validate-harness.mjs` — it isn't imported anywhere yet

### Phase 1 — minimal working version (1–2 days)

1. Expand mutation library to 6 (the two above plus: blank-test-file,
   break-first-assertion, delete-required-config-key, truncate-a-function) —
   **tiered by project substance**, per the child idea from the deepening: tier-0
   (no code detected) gets only document mutations against `AGENTS.md` / `feature_list.json`
   / `progress.md`; tier-1 (code detected) adds source/test mutations. Reuse
   `detectProject()` from `harness-utils.mjs` to pick the tier — it already exists and
   already classifies stack.
2. Add the second mutation family: mutate `init.sh` itself (`|| true`, early exit,
   narrowed test glob) and assert *the validator* — not just `init.sh` — notices the gate
   weakened. This is the harness self-mutation-audit idea folded in as a special case
   rather than built as a separate subsystem.
3. Wire into scoring as **one new check** in the `verification` block:
   ```js
   verification: [
     ...existing 5 checks,
     await mutationKillRate(root)   // { pass: rate >= 0.8, message: 'Gate demonstrably catches known breakage', detail: `${killed}/${total} mutants killed` }
   ]
   ```
   Six checks now instead of five; `Math.round((passed/6)*5)` — scoring math needs no
   other change since it already divides by `subsystemChecks.length`.
4. Add `--self-test` flag to the template `init.sh` so an agent can run the adversary
   before claiming a feature done, and have it write kill-rate + surviving-mutant list
   into the evidence it produces — giving the existing "evidence is recorded" check real
   content instead of a sentence.

### Phase 2 — hardening (as time allows)

- Ratchet mode: persist kill rate (this becomes the first real consumer of Cluster C's
  audit log — sequencing reason for building F/A before C) and fail if it drops between
  audits, so a session that adds code without adding coverage is caught by a falling
  number.
- `enrich-harness.mjs` entry: when mutants survive, write each as a concrete
  `dream-queue.md` proposal ("`init.sh` does not notice when tests are skipped — add a
  test-count assertion") rather than just a number.
- `--drill` mode for `run-benchmark.mjs`'s self-check: mutate silently, hand the benchmark
  a red gate, and check whether the *fix* touches the project or the gate.

**Files touched:** new `scripts/mutate-gate.mjs`; edits to `scripts/lib/harness-utils.mjs`
(one new check function), `templates/init.sh` (`--self-test` flag), `scripts/index.md`
(new row), `SKILL.md` (one new bullet in verification's row of the Core Model table),
`CHANGELOG.md`.

**Depends on:** nothing. Can start immediately.

**Definition of done:** `mutationKillRate()` returns a real fraction (not a boolean stub);
running it twice on an unmodified scaffold gives the same number; `early-exit` is
provably caught after Phase 1 where it survived in Phase 0 — that flip is the evidence
the feature works.

---

## 2. Cluster B — Graveyard (negative knowledge)

**Scoring treatment:** extend `memory`. One new check, following the exact pattern the
memory subsystem already uses for `links intact` — a computed assertion over a real
artifact, not a keyword grep.

### Phase 0 — schema only, no scoring, no curation (½ day)

Per the deepening's own first-step recommendation: ship the template and the pointer row
with **nothing that reads it yet**.

1. `templates/memory-graveyard.md` — new template:
   ```markdown
   ---
   type: memory
   title: "Memory Graveyard Template"
   description: "Verdicts on abandoned routes: what was tried, why it failed, and the condition under which the verdict expires"
   artifact: "memory/graveyard.md"
   tags: [memory, graveyard, negative-knowledge, abandoned, recheck]
   ---
   # Graveyard

   Routes tried and rejected. Not a lesson store — a **prohibition list with an expiry**.

   | Route | Verdict | Because | Blast | Sessions | Recheck-if |
   |---|---|---|---|---|---|
   | _example: date-fns-tz for scheduling_ | rejected | drops DST on half-hour offset zones | 2h | 3 | upstream #1483 closes |

   **Recheck-if is mandatory.** A row without one is folklore — nobody can tell whether it
   still applies, so it is either obeyed forever or ignored entirely.
   ```
2. One pointer row added to `templates/memory-index.md`'s seed content:
   `- Before proposing a library, refactor, or rewrite: grep memory/graveyard.md`
3. Fifth journal question added to `templates/memory-journal.md`: *"What did I try and
   abandon, and why?"*

- [ ] `create-harness.mjs` scaffolds `memory/graveyard.md` with the worked example row
- [ ] Index pointer row present in a fresh scaffold
- [ ] `validate-harness.mjs` score is **unchanged** — nothing reads the graveyard yet

### Phase 1 — the check that makes it real (1 day)

```js
memory: [
  ...existing 6 checks,
  graveyardWellFormed(memoryFiles, 'Graveyard entries have a cause and an expiry condition')
]
```

`graveyardWellFormed()` parses `memory/graveyard.md`'s table rows and asserts every row
has non-empty `Because` and `Recheck-if` — mechanical, stdlib-only, same shape as the
existing `memoryLinksIntact()`. **Absence of the file is not penalised** (it's optional,
unlike `index.md`/`journal.md`) — only malformed rows are. This mirrors the "vacuously
true with zero entries" pattern already used for the entry-shape check.

### Phase 2 — the curation signal (after Cluster C exists, or manually first)

- Fifth curation signal, "reconsidered": a route in the graveyard reappearing in journal
  entries or dream-queue proposals. Document this in `AGENTS.md`'s Curation section and
  `references/dreaming-pattern.md` — this is a documentation change, not code, since
  curation itself is still a manual pass per the existing v0.3.1 design.
- **Recheck-if as an executable tripwire** (the strongest child idea): allow an optional
  shell predicate in the Recheck-if cell, and have `init.sh` evaluate it at startup,
  printing only rows whose condition now holds. This converts write-mostly-read-never
  into a push. Ship this only after Phase 1's static check is stable — it's the piece with
  the most edge cases (predicate syntax, failure-to-evaluate handling).
- Counterfactual pairing: an `Instead:` column pointing at the lesson actually adopted, so
  a rejection isn't purely prohibitive.

**Files touched:** new `templates/memory-graveyard.md`; edits to `templates/memory-index.md`,
`templates/memory-journal.md`, `scripts/create-harness.mjs` (one more `copyTemplate` call),
`scripts/lib/harness-utils.mjs` (one check function + include graveyard in `loadMemoryFiles`'s
existing directory scan — it already walks `memory/*.md`, so this may need zero loader
changes, only the new check), `templates/agents.md` (fifth journal question, pointer
mention), `references/dreaming-pattern.md`, `references/memory-persistence-pattern.md`,
`CHANGELOG.md`.

**Depends on:** nothing structurally, though the curation-signal half (Phase 2) reads
better once telemetry (Cluster C) exists to show *how often* a route resurfaces.

**Definition of done:** a hand-written graveyard row missing `Recheck-if` fails the new
check; the same row with it passes; a fresh scaffold with only the worked example passes.
This is the same three-way proof already run for `memoryLinksIntact()` (orphaned →
dangling → intact) — repeat that discipline here before calling it done.

---

## 3. Cluster C — Longitudinal telemetry

**Scoring treatment:** **unscored tool.** This is the one cluster where "should this be a
subsystem" has a firm no — see §0.2. It ships as a script plus a log file plus one
additional block of *output*, never as points on the 0–35 scale.

### Phase 0 — the logger, and nothing else (½ day)

Per the deepening's own first step: ~40 lines, append-only, no thresholds, no alarms.

```js
// scripts/lib/harness-utils.mjs — new export
export async function appendAuditEntry(root, result) {
  const line = JSON.stringify({
    at: new Date().toISOString(),   // NOTE: real script, not this planning doc — Date.now() is fine here
    overall: result.overall,
    subsystems: Object.fromEntries(
      Object.entries(result.subsystems).map(([k, v]) => [k, v.score])
    ),
    // feature census + status hash come from feature_list.json if present — optional,
    // degrades gracefully on a project with no features yet
  }) + '\n';
  await appendFile(path.join(root, 'memory', 'audit-log.jsonl'), line);
}
```

Call it once, at the end of `validate-harness.mjs`, behind a flag so it's opt-in at first:
`--log`. Read only the last line for a bare "logged" confirmation — no delta yet.

- [ ] Running `validate-harness.mjs --log` twice produces two JSONL lines, second
      strictly append (`fs.appendFile`, never read-modify-write)
- [ ] A malformed or missing log file does not break `validate-harness.mjs` when `--log`
      is omitted — the flag is fully optional
- [ ] `memory/audit-log.jsonl` is documented in `AGENTS.md` as append-only,
      read-but-never-parsed-as-instruction (same evidence-not-instruction framing as the
      rest of memory)

### Phase 1 — the delta, and the feature-status hash (2–3 days)

1. Compute a stable hash over `feature_list.json`'s `{id, status}` pairs each run; store
   it in the log line. This is the single field that unlocks re-open detection, churn
   counts, and time-to-done — all as *reads* over consecutive log lines, no new state.
2. Print one block above the existing bottleneck line, only when ≥2 prior entries exist:
   ```
   Overall: 97/100   ▼ 3 since audit #6 (5 days ago)
     ⚠ feat-004 re-opened: done → in_progress
   ```
3. With fewer than 3 entries: print `no trend yet` and nothing else. Do not invent a
   baseline from one or two points — the deepening flagged this explicitly as the
   difference between honest and misleading telemetry.
4. **Dual-clock fields** (the strongest child idea, folded into Phase 1 rather than
   deferred): store both the ISO timestamp and a monotonic audit counter, plus
   `days_since_last`. This is one extra field and it's the direct mitigation for the
   load-bearing risk (audits aren't evenly spaced) — cheap enough to not defer.

### Phase 2 — resist the gaming failure mode (ongoing discipline, not a feature)

The deepening's central warning: *"any signal derived from a field the agent can freely
rewrite is a metric it optimises rather than reports."* Concretely:

- Prefer deriving churn from **evidence-string diffs and file mtimes**, not from
  self-reported `status` alone. If `status` says `done` but the `evidence` field is
  byte-identical to three audits ago while the underlying files changed, that's a signal
  worth surfacing even though `status` never flipped.
- Silence detection: flag a subsystem score that hasn't moved across many audits despite
  other activity — the 100/100-while-rotting failure mode is usually a signal that
  *stopped varying*, which only the log can perceive.
- `trend.md` rendering (optional, low priority): a plain-text sparkline linked from
  `session-handoff.md`, so the trend enters context at session start rather than only
  when someone manually runs the auditor. Build only if `--log` sees real adoption —
  otherwise it's decoration on a feature nobody uses yet.

**Files touched:** edits to `scripts/lib/harness-utils.mjs` (`appendAuditEntry`, delta
formatting), `scripts/validate-harness.mjs` (`--log` flag, call the delta formatter),
`templates/agents.md` (append-only note in Required Artifacts), `references/index.md`
(no new pattern doc needed yet — fold into `memory-persistence-pattern.md`'s existing
"Implementation Patterns" list as one more bullet), `CHANGELOG.md`.

**Depends on:** nothing to start Phase 0. Phases 1–2 are more useful with Clusters A and F
already shipped, since kill-rate and environment-drift become extra fields on the same
log line "for free" per §0.3 — but telemetry doesn't structurally require them.

**Definition of done:** two consecutive `--log` runs on a project with one feature
transitioned from `in_progress` to `done` between them produce a correct delta line with
no re-open false-positive; three or more runs produce `no trend yet` correctly suppressed
on the third; the log survives a corrupted or hand-edited last line without crashing the
reader (parse defensively, skip unparseable lines).

---

## 4. Cluster D — Context economics

**Scoring treatment:** **unscored, advisory only.** Neither idea in this cluster is a
pass/fail question — a budget is a warning, not a gate, and an auction needs a queue of
competing requests that doesn't structurally exist yet (see Cluster E, which is the
actual queue).

### Phase 0 — the ledger, read-only (1 day)

A `--budget` flag on `validate-harness.mjs` that reports, not enforces:

```
Always-on context (loaded every session):
  AGENTS.md          216 lines   ~2,900 tokens
  memory/index.md     38 lines     ~480 tokens
  ─────────────────────────────────────────────
  total                            ~3,380 tokens
```

Token estimate can be a crude `chars / 4` — this is a budget *awareness* tool, not a
precise accountant. No ceiling, no failure, no scoring interaction.

- [ ] `--budget` prints the table above for a fresh scaffold and for an enriched one with
      a bloated `AGENTS.md`, showing the number visibly grow
- [ ] Flag has zero effect on `overall`, `bottleneck`, or exit code

### Phase 1 — the ceiling, still advisory (later, only if Phase 0 gets used)

Add a configurable ceiling (default unset = no warning) and print a soft warning, never a
failing check, when always-on context exceeds it. This stays a `console.log`, not a
`checks.push(...)` — crossing back into §0.1's rule.

### Attention auction — do not build yet

This is the most novel idea in the whole research doc, and also the one with the least
existing surface to attach to: it needs multiple competing request *sources*
(dream-queue proposals, scope breaches, failed checks) arriving with enough regularity
that arbitration matters. Building it before Cluster E (recruitment signalling) exists
would mean building a market with one seller. **Trigger to revisit:** once dream-queue
proposals and recruitment markers are both real and a human reports actually feeling
flooded by them in the same session.

**Files touched (Phase 0 only):** edit `scripts/validate-harness.mjs` (`--budget` flag),
`scripts/lib/harness-utils.mjs` (token-estimate helper), `CHANGELOG.md`.

**Depends on:** nothing for Phase 0. Attention auction depends on Cluster E existing
first, per above.

**Definition of done (Phase 0 only):** the printed total visibly changes between a lean
and a bloated `AGENTS.md` on the same machine, proving the estimate is sensitive to
what's actually being measured rather than a constant.

---

## 5. Cluster E — Recruitment signalling

**Scoring treatment:** extend `scope`. This is what "one feature at a time" *does* with
what it declines — a natural fifth or sixth check in an existing subsystem, not new
territory.

### Phase 0 — the artifact (½ day)

`templates/open-work.md` — a flat, append-only list distinct from `dream-queue.md`
(which is curation output) and from `progress.md`'s free-text notes (which nothing reads):

```markdown
---
type: template
title: "Open Work Template"
description: "Markers for work seen but declined under scope discipline — recruitable by a later or concurrent session"
artifact: "open-work.md"
tags: [scope, recruitment, backlog, multi-agent]
---
# Open Work

Things noticed but not done, because they were out of scope for the active feature.
One line each: `- [reason-code] <one-line description> (seen in feat-XXX)`

Reason codes: `blocked-on` · `needs-review` · `cheap-parallel-win` · `flaky`

_No open items yet._
```

Add one line to `AGENTS.md`'s Editing Discipline section (which *already* says "if you
notice unrelated dead code or issues, mention them in `progress.md`") — redirect that
existing instruction from `progress.md` prose to this structured file instead. This is a
one-line edit to existing guidance, not new guidance.

### Phase 1 — the scope check (1 day)

```js
scope: [
  ...existing 5 checks,
  hasFile(byPath, ['open-work.md'], 'Recruitable open-work surface exists')
]
```

Presence-only at first, matching how lightly `dream-queue.md` was treated in its own
first phase. A structural well-formedness check (reason code is one of the four
enumerated values) can follow the same pattern as the graveyard's row-shape check once
there's real usage to validate against.

### Phase 2 — recruitment in practice

- `AGENTS.md` startup workflow gains a step: after reading `feature_list.json`, scan
  `open-work.md` for a `cheap-parallel-win` that fits before picking a fresh feature.
- Curation (Cluster B/telemetry adjacent): an item sitting in `open-work.md` unaddressed
  across many audits (Cluster C's log makes this checkable) is itself a dream-queue
  candidate — "this keeps getting seen and never picked up, promote to a real feature."

**Files touched:** new `templates/open-work.md`; edits to `scripts/create-harness.mjs`
(one more `copyTemplate`), `scripts/lib/harness-utils.mjs` (one check), `templates/agents.md`
(redirect the existing "mention in progress.md" line, add the startup scan step),
`templates/index.md`, `CHANGELOG.md`.

**Depends on:** nothing to start. Phase 2's telemetry tie-in depends on Cluster C.

**Definition of done:** a scaffolded project has `open-work.md` present and the scope
check passes; a project missing it fails that one check without affecting others;
`AGENTS.md`'s existing "mention unrelated issues" instruction now names a real file
instead of unstructured prose in `progress.md`.

---

## 6. Cluster F — Environment contract

**Scoring treatment:** extend `verification` — but primarily as a **template addition to
`init.sh`**, not new scoring logic. This is the cheapest cluster in the whole plan and the
only one with a live example already in this project (the Video repo's own `init.sh`
resolves `ffmpeg`/`yt-dlp` off a non-default PATH — that pattern generalises).

### Phase 0 — the declaration (½ day)

A new, optional file, `environment.md` (plain markdown, not JSON — matches the
markdown-first house style):

```markdown
# Environment Contract

| Requirement | Check |
|---|---|
| node >=20 | `node --version` |
| ffmpeg on PATH | `command -v ffmpeg` |
| DATABASE_URL set | `test -n "$DATABASE_URL"` |
```

Not scaffolded by default — created only when a project's `init.sh` needs more than the
generic package-manager detection already handles. Same "not scaffolded, consulted"
status as `feature-list.schema.json` and `memory-entry.md`.

### Phase 1 — the init.sh integration (1 day)

Extend `templates/init.sh` (which already does tool-detection style checks in this
project's own harness) with a generic loop: if `environment.md` exists, parse its table
and run each check, reporting PASS/FAIL distinctly from the project's own test/build
output — so "the world changed" is visually distinguishable from "the code broke":

```bash
if [ -f environment.md ]; then
  echo "=== Environment contract ==="
  # parse | Requirement | Check | rows, run each, report separately from test/build output
fi
```

One new verification check, presence-optional (same pattern as memory's graveyard — file
absence isn't penalised, malformed content is):

```js
verification: [
  ...existing checks,
  environmentContractHonoured(init, environmentMd)  // vacuously true if environment.md absent
]
```

**Files touched:** new `templates/environment.md` (optional, not auto-scaffolded);
edits to `templates/init.sh` (the parse-and-check loop), `scripts/lib/harness-utils.mjs`
(one check), `references/tool-registry-pattern.md` (this is squarely that pattern's
territory — add a section rather than a new reference doc), `CHANGELOG.md`.

**Depends on:** nothing. Cheapest, most standalone cluster — good candidate to build
first or in parallel with Cluster A.

**Definition of done:** a project with a deliberately wrong `environment.md` entry (e.g.
a Node version range that excludes the actual runtime) fails visibly and distinctly from
a test failure in the same `init.sh` run; a project with no `environment.md` scores
exactly as it did before this cluster shipped.

---

## 7. Traps — explicitly not now, with the trigger to revisit

Carried forward from `missing-subsystems.md` §7, restated here as **decisions**, not
just observations, since a plan needs to say what it excludes and why:

| Trap | Decision | Revisit when |
|---|---|---|
| Quorum gate | Not building | A second independent agent (not the same agent re-run) becomes available to genuinely confirm work |
| Difficulty auto-tuning | Not building | Never, without a strong new argument — it destroys score comparability, which is the scorer's entire value |
| New-game-plus tiers | Not building | Never — no demand signal, gamification the harness doesn't need |
| Memory yield rating | Not building | A read-instrumentation mechanism exists elsewhere in the toolchain (unlikely to be worth building solely for this) |
| Verification futures | Not building | Never — the check you'd skip by predicted value is the one that catches what you didn't predict |
| Multi-principal authority | Not building | A second human is actually approving harness decisions |
| Cross-repo federation | Not building | A feature's evidence genuinely needs to span more than one repository |
| Attention auction (Cluster D) | Deferred, not rejected | Cluster E ships and a human reports feeling flooded by concurrent proposal sources |

---

## 8. Recommended sequencing

Combining §0.3's dependency graph with effort estimates:

| Order | Cluster | Phase | Effort | Rationale |
|---|---|---|---|---|
| 1 | F — Environment contract | 0–1 | ~1.5 days | Cheapest, zero dependencies, fixes a problem visible in this project today |
| 2 | A — Verification adversary | 0 | ~½ day | Prove `early-exit` survives — the single most important finding to confirm before investing further |
| 3 | A — Verification adversary | 1 | ~1–2 days | Minimal working version, feeds Cluster C a field |
| 4 | C — Telemetry | 0 | ~½ day | Logger only, inert, start accumulating history immediately |
| 5 | B — Graveyard | 0 | ~½ day | Schema + pointer, no consumers yet, safe to ship early and let it sit |
| 6 | C — Telemetry | 1 | ~2–3 days | Delta + status hash — now has kill-rate (A) as a real extra field |
| 7 | B — Graveyard | 1 | ~1 day | The well-formedness check |
| 8 | E — Recruitment signalling | 0–1 | ~1.5 days | Benefits from telemetry existing to later show churn on ignored items |
| 9 | A, B — Phase 2 hardening | — | ongoing | Ratchet mode, curation signal, executable Recheck-if |
| 10 | D — Context economics | 0 | ~1 day | Lowest priority; cheapest to retrofit whenever |
| — | D — Attention auction | — | not now | Explicitly deferred per §7 |

Total to reach "all six clusters have a real Phase 0/1" — roughly **10–12 working days**,
sequenced so that nothing is scored until it has independently proven it discriminates
(the same bar the memory subsystem's `links intact` check had to clear), and nothing
touches the 0–35 scale except the two clusters (A, B) that are genuine extensions of
existing questions rather than new ones.

## 9. What "done" means for this whole plan

Not "all six clusters fully built." Given the Ponytail minimalism ladder this harness
enforces on every other project, the honest finish line is:

- [ ] Every Phase 0 above shipped and provably inert (existing scores unchanged where
      claimed unchanged)
- [ ] Clusters A and F have real Phase 1s, are scored, and have each caught at least one
      genuine gap in this harness's own bundled examples as evidence they discriminate
- [ ] Cluster C has been running for long enough on a real project to produce a `no trend
      yet` → real-delta transition, proving the "under 3 entries" guard actually matters
- [ ] Everything in §7 remains unbuilt, and stays documented as *why*, not just *not yet*
