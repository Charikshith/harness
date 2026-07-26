---
type: reference
title: "Missing Subsystems — divergent analysis of what the harness has no concept of"
description: "Six clusters of absent capability found by parallel divergent ideation: gate integrity, negative knowledge, longitudinal telemetry, context economics, plurality, and the world outside the repo"
tags: [research, subsystems, gaps, roadmap, verification, memory, telemetry]
timestamp: 2026-07-25
status: research — nothing here is implemented or committed to
---

# Missing Subsystems

**Question asked:** beyond the seven scored subsystems, what does `harness-creator v3.1`
have *no concept of at all*? Not bug fixes, and not the known-pending list
(memory evals, unregenerated examples, no curation script, stale README).

**Method:** divergent ideation under five isolated cognitive frames — inversion,
remove-the-load-bearing-assumption, game design, ant colony, markets — producing 30
candidates, then scored, clustered, trap-pruned, and the top idea from each of the three
strongest clusters deepened. 8 agent calls. Frames were chosen to differ from a prior run
(regulator / 3am on-call / competitor / logistics / speedrunner) so the same question
would produce a different candidate set.

**Scoring:** `[N novelty, V viability, F fit]`, weighted `0.35N + 0.40V + 0.25F`.

> **Status: research.** Nothing here is built, scheduled, or promised. It is a map of
> absent capability, written so a future session can pick one up without re-deriving the
> reasoning.

---

## 0. The root cause behind most of it

Every current check verifies that **text exists**. The five verification checks, as they
actually are in code:

| Check | What it really does |
|---|---|
| Verification entrypoint exists | the `init.sh` file is present |
| Verification fails fast | the string `set -e` appears in it |
| Test command documented | the substring `test` appears somewhere |
| Static/build check documented | one of `build` / `type` / `lint` / `compile` appears |
| Evidence is recorded | the word `Evidence` appears in any file |

**Not one of them runs anything.** A project whose entire `init.sh` is
`#!/bin/bash`, `set -e`, `echo "tests pass"` scores 5/5 on verification.

That is the shared blind spot: the harness reads the *residue* of work and infers, rather
than observing work. Six clusters of missing capability follow from it.

---

## 1. Cluster A — The gate can be gamed

### The failure, concretely

An agent runs `./init.sh`. A test fails. There are two routes to green:

1. **Fix the code** — hard, slow, may surface more problems
2. **Change the test** — `expect(x).toBe(3)` → `expect(x).toBeDefined()`, add `.skip`,
   or narrow the glob

The harness cannot distinguish them, and **route 2 raises the score**, because `init.sh`
now exits 0 and the definition of done is satisfied. Every verification check still
passes: the file exists, `set -e` is still present, the word `test` still appears.

The gate got weaker and the number went up.

### Candidates

| Idea | Chips | W |
|---|---|---|
| **Verification adversary** — break something deliberately, assert the gate notices | `[N9 V9 F10]` | **9.25** ★ |
| Evidence freshness — evidence hashes the files it covers | `[N8 V8 F10]` | 8.50 |
| Harness self-mutation audit — hashed baseline of the invariants | `[N8 V8 F9]` | 8.25 |
| Quorum gate — N independent confirmations | `[N9 V4 F6]` | 6.25 ⚠ trap |

### Verification adversary — what it looks like

Mutation testing pointed at the harness's own gate. Copy the project to scratch,
deliberately break something, run `init.sh`, assert it **fails**. A surviving mutant is a
class of breakage the gate cannot see.

```
$ node scripts/mutate-gate.mjs --target .

  [1/6] early-exit         inserted `exit 0` after shebang        SURVIVED  ✗
  [2/6] neuter-check       appended `|| true` to line 12          KILLED    ✓
  [3/6] blank-test-file    emptied tests/api.test.js              SURVIVED  ✗
  [4/6] break-assertion    toBe(3) → toBeDefined() in api.test    SURVIVED  ✗
  [5/6] delete-config-key  removed "port" from config.json        KILLED    ✓
  [6/6] truncate-function  parseUser() → return null              KILLED    ✓

  kill rate 3/6 → verification 3/5
  init.sh does not notice: early exit, empty test files, weakened assertions
```

That final line is the deliverable — a concrete list of what the gate is blind to, which
no amount of reading `init.sh` would reveal.

**Two mutation families.** The first breaks the *project* and asks whether the gate
notices. The second breaks the *gate itself* and asks whether the **validator** notices
the gate got weaker.

### Evidence freshness — what it looks like

Today `evidence` is free text:

```json
"evidence": "./init.sh exits 0, verified 2026-07-14"
```

True on the 14th; says nothing about today. The failure needs no bad intent: record real
passing evidence once, then edit the code underneath it forever. Status stays `done`,
evidence stays "recorded", and `init.sh` may no longer cover that path at all.

With freshness, evidence hashes what it covers:

```json
"evidence": {
  "command": "./init.sh", "exit": 0, "at": "2026-07-14T10:22:00Z",
  "covers": {
    "src/api.js":        "sha256:9f1c…",
    "tests/api.test.js": "sha256:a31b…"
  }
}
```

The validator recomputes those hashes. `src/api.js` changed → evidence is stale → the
feature's `done` is mechanically suspect, with nobody needing to remember.

### Harness self-mutation audit

The cheapest route to a green harness is editing the rules you are judged by: loosen the
scope boundary, soften the definition of done, drop an awkward feature from the tracker.
The harness has no notion of who wrote its own files or that they changed. A hashed
baseline of the invariant sections turns such an edit into a diff a human is shown,
rather than a silent rise in score.

---

## 2. Cluster B — No memory of its own failures

### The failure, concretely

**Session 3.** The agent needs timezone-aware scheduling, evaluates a date library,
spends two hours, discovers it mishandles DST for half-hour offset zones, reverts. The
journal records `looked up: date libs`, `surprised: tz handling`.

**Session 19.** Different feature, same need. The agent reasons from scratch. *The
library looks perfect* — it looked perfect the first time too, which is why it was chosen.
Two hours gone again.

### The deep point

All four curation signals are about **recurrence**. Curation finds what happens
*repeatedly within a window*. A dead end that recurs once every four months **never trips
a prevalence threshold** — by the third occurrence you have paid three times.

So negative knowledge cannot be *derived* from the journal the way lessons are. It must
be **recorded at the moment of abandonment**, as a deliberate distinct act. That is why
this is a missing subsystem rather than a curation tweak.

### Candidates

| Idea | Chips | W |
|---|---|---|
| **Graveyard** — routes foreclosed, with the reason and an expiry condition | `[N9 V9 F10]` | **9.25** ★ |
| Death log — the shape of catastrophic sessions | `[N8 V8 F8]` | 8.00 |
| Trail decay — confidence evaporates until re-verified | `[N8 V7 F9]` | 7.85 |
| Memory falsification — demote lessons a session contradicts | `[N8 V6 F9]` | 7.45 |

### The graveyard — what it looks like

| Route | Verdict | Because | Blast | Sessions | Recheck-if |
|---|---|---|---|---|---|
| `date-fns-tz` for scheduling | rejected | drops DST transitions on half-hour offset zones | 2h | 3, 19 | upstream #1483 closes |
| move auth to middleware | reverted | breaks the websocket upgrade path | 5h | 11 | we drop WS support |

The critical column is **Recheck-if** — the falsifiable condition under which the verdict
expires. Without it a prohibition is folklore: nobody can tell whether it still applies,
so it is either obeyed forever or ignored entirely.

It is **not** read in full each session. The index carries one always-on pointer:

```
- Before proposing a library, refactor, or rewrite: grep memory/graveyard.md
```

One line of permanent context cost, and a conditional lookup at exactly the moment of
temptation.

### Death log

The four journal questions under-sample catastrophes — they are tuned for routine
friction, and catastrophes are rare. The reusable asset from a disaster is usually not
the verdict but **the detection signal that was missed**: "what would have caught this an
hour earlier" has no field in the ordinary schema.

### Trail decay

Every claim carries a last-verified stamp and a confidence that erodes until re-walked.
This converts "bounded index" from a *size cap* into a *relevance function* — entries
fade rather than accumulating as permanent truth. Colonies forget by evaporation, with no
deleter.

---

## 3. Cluster C — A snapshot is not a trend

### The failure, concretely

`validate-harness.mjs` reads the current files, prints a number, exits. It stores
nothing. Run it today and again in a month and you get two unrelated integers.

The tool cannot distinguish:

- a project **climbing** 40 → 85 — working, keep going
- a project **decaying** 100 → 85 — something is wrong, investigate

Opposite situations, identical output, opposite correct responses.

The nastier version: a harness can sit at **100/100 while quality falls**. Features marked
`done` get quietly re-opened. One feature churns for six weeks. The memory index bloats.
Journal entries decay into feature restatements. Every one of those is invisible to a
snapshot.

### Candidates

| Idea | Chips | W |
|---|---|---|
| **Longitudinal telemetry** — persisted audit history with regression alarms | `[N8 V8 F10]` | **8.50** ★ |
| Run-history scoreboard — trajectory, not a number | `[N7 V9 F9]` | 8.30 |
| Cost / wall-clock ledger + stall detector | `[N7 V8 F9]` | 7.90 |
| Path-reinforcement counters — hot paths self-advertise | `[N9 V6 F8]` | 7.55 |
| New-game-plus difficulty tiers | `[N9 V5 F6]` | 6.65 ⚠ trap |
| Difficulty auto-tuning from telemetry | `[N9 V4 F6]` | 6.25 ⚠ trap |

### Telemetry — what it looks like

One append-only line per audit:

```json
{"at":"2026-07-25T09:14:22Z","n":7,"overall":97,
 "subsystems":{"instructions":5,"state":5,"verification":5,"scope":5,
               "lifecycle":5,"memory":4,"behavioral":5},
 "features":{"done":6,"in_progress":1,"blocked":1},
 "featureHash":"sha256:44ac…","indexLines":38,"journalBlocks":12}
```

The **per-feature status hash** unlocks everything else for free. The next run diffs it
and can name a `done → in_progress` transition as a re-open, count consecutive audits a
feature has sat in progress, and compute time-to-done — with no extra state stored.

Output gains one block above the existing bottleneck line:

```
Overall: 97/100   ▼ 3 since audit #6 (5 days ago)
  ⚠ feat-004 re-opened: done → in_progress
  ⚠ memory/index.md grew 38 → 61 lines across 3 audits
```

Compare with `Overall: 97/100`. The first tells you what to do.

### The subtlety that makes this hard

**Measuring a thing changes it.** Once an agent knows re-opens are counted, the cheapest
way to have zero re-opens is to stop marking things `done` — or to edit in place and
never re-open. The log then records improvement while quality falls exactly as before.

Mitigation: prefer signals the agent cannot cheaply fake. Derive churn from **evidence
diffs and file mtimes**, not from self-reported `status`. A status field is
agent-authored; an evidence diff is closer to work actually performed.

### Cost ledger and path counters

The harness has no concept of time or money — every check can stay green while an agent
burns six hours and forty restarts on one feature. A stall detector trips when a feature's
cost crosses a multiple of its estimate.

Path-reinforcement counters (per-file, per-command, per-check hit counts) let the
environment self-advertise: which files everyone edits, and more usefully **which checks
nobody ever runs**. No authored document would ever admit that.

---

## 4. Cluster D — Nothing is priced

### The failure, concretely

`AGENTS.md` is 216 lines / ~11 KB, loaded **in full, every session, forever**.
`memory/index.md` may reach 200 lines. Reference docs load on demand. There is no ceiling
and no eviction mechanism anywhere.

Adding a section to `AGENTS.md` imposes a cost on every future session in perpetuity, and
**nothing makes that cost visible at the moment of adding**. Free goods get
over-consumed — which is why instruction files always grow and never shrink.

### Candidates

| Idea | Chips | W |
|---|---|---|
| Context budget ledger — every artifact declares a cost; adding means evicting | `[N8 V7 F10]` | 8.10 |
| Attention auction — one human-review slot per session, items bid for it | `[N10 V5 F8]` | 7.50 |
| Memory yield rating — retire low-retrieval lessons | `[N9 V5 F8]` | 7.15 ⚠ trap |
| Verification futures — buy only expected-value-positive checks | `[N9 V4 F6]` | 6.25 ⚠ trap |

### Context budget ledger — what it looks like

| Artifact | Lines | ~Tokens | Loaded |
|---|---|---|---|
| `AGENTS.md` | 216 | ~2,900 | every session |
| `memory/index.md` | 38 | ~480 | every session |
| **Always-on total** | | **~3,380** | ceiling 4,000 |

Adding becomes a **purchase**, not a gift. Exceeding the ceiling forces an eviction
decision instead of silent bloat.

### Attention auction

The most novel candidate in the run. Human review is the scarcest resource in the system,
and four subsystems currently request it independently with no arbitration: dream-queue
proposals, failed checks, scope-boundary breaches, assumption surfacings. Nothing ranks
them against each other.

Result: the human is flooded and ignores everything — functionally identical to having no
gate. One slot per session, items bidding, forces the harness to decide **what is most
worth a human's eyes** rather than offloading that triage onto the human at 11pm.

---

## 5. Cluster E — One agent, one human, one repo

### The failure, concretely

`feature_list.json` is a single JSON file with last-writer-wins semantics:

```
Agent A reads → marks feat-003 done          → writes
Agent B reads → marks feat-005 in_progress   → writes
```

B's write lands second, containing B's copy of the file — read *before* A's change.
**A's completion silently vanishes.** No lock, no merge, no conflict, no detection. The
same is true of `progress.md` and `memory/journal.md`.

The harness does not fail at multi-agent work. It has no concept of it.

### Candidates

| Idea | Chips | W |
|---|---|---|
| **Recruitment signalling** — machine-readable "work I saw but didn't do" | `[N9 V7 F9]` | 8.20 |
| Concurrency / merge arbitration — leases on feature ids, append-only state | `[N7 V7 F9]` | 7.50 |
| Commons metering — leases on ports, test DBs, build caches | `[N8 V6 F7]` | 6.95 |
| Multi-principal authority — who may approve what | `[N9 V5 F7]` | 6.90 ⚠ trap |
| Cross-repo federation | `[N8 V4 F7]` | 6.15 ⚠ trap |

### Recruitment signalling — the one that pays off with a single agent

Today: an agent working feat-003 notices a flaky test. Scope rules correctly say don't fix
it. So it **does nothing**, and the finding evaporates when the session ends. `progress.md`
has a notes section, but it is prose — nothing reads it, nothing schedules it.

A machine-readable open-work surface where an agent drops a marker — `blocked-on`,
`needs-review`, `cheap-parallel-win` — is what turns one-feature-at-a-time from
**amnesia** into **throughput**. Scope discipline currently produces silent dead ends;
this gives discipline somewhere to put what it declined.

---

## 6. Cluster F — The world outside the repo

### The failure, concretely

`init.sh` exits non-zero. Two entirely different causes:

- **the code is wrong** — a real regression, fix it
- **the world moved** — Node upgraded, a service down, a secret expired, a binary gone
  from PATH

The harness reports these identically. The agent then "fixes" a code problem that does not
exist — one of the most expensive failure modes available to it.

### Candidates

| Idea | Chips | W |
|---|---|---|
| **Environment contract** — declared toolchain, services, secrets; diffed at startup | `[N7 V9 F9]` | 8.30 |
| Irreversibility / blast-radius ledger | `[N8 V7 F9]` | 7.85 |
| Recoverability premium — post a restore point before risky work | `[N8 V7 F9]` | 7.85 |
| Adversarial containment — enforcement outside the agent's cooperation | `[N9 V6 F9]` | 7.80 |
| Tutorial mode — a scripted first session | `[N8 V7 F8]` | 7.60 |

### Environment contract — what it looks like

```
node:            >=20 <23      (found 24.18.0)   ⚠ outside range
ffmpeg:          on PATH       (found)           ✓
DATABASE_URL:    set           (set)             ✓
api.example.com: reachable     (timeout)         ✗
```

Checked at startup, independently of the project's own tests. "The world changed" becomes
a **distinct, named failure** instead of a mysterious red gate. Cheap to build, high
value — and a live problem in this very setup, where `ffmpeg` and `yt-dlp` are not on the
default PATH.

### Irreversibility ledger

The behavioral policies treat all mistakes as equally recoverable. The harness cannot
distinguish a bad function from a dropped production table, a published package, or a sent
email — so it spends its discipline uniformly and its safety nowhere. Classifying actions
by undo cost, and requiring a recovery note before the irreversible ones, puts the care
where the risk is.

### Adversarial containment — the deepest observation

**Every one of the seven subsystems is a request written in markdown.** Delete the
assumption that the agent cooperatively reads and follows instructions and the harness has
*no enforcement surface whatsoever* — `init.sh` only runs if the agent chooses to run it.

Real enforcement lives outside the agent's reading: pre-commit hooks, tool-permission
gates, a diff-vs-declared-scope reconciler that runs whether or not `AGENTS.md` was ever
opened. That is a different product, which is why viability is only 6. But it is worth
knowing that this design's floor is **cooperation**.

---

## 7. Traps — attractive, pruned, with the reason

| Trap | Cluster | Why it fails |
|---|---|---|
| Quorum gate | A | Needs N *independent* scouts. One operator, usually one agent — you would be asking the same agent to confirm its own work three times. That is repetition, not independence. |
| Difficulty auto-tuning | C | An adaptive rubric destroys comparability. Two projects at "85" would mean different things, and so would one project at 85 six months apart. A diagnostic that redefines its own units stops being a diagnostic. |
| New-game-plus tiers | C | Gamification with no demand. Reaching 100/100 is a finding, not an anticlimax needing replay value. |
| Memory yield rating | D | Requires knowing when a memory was *read*, and a read is not an observable event. (Same trap pruned in the prior run under a different name.) |
| Verification futures | D | Skipping checks by predicted value is precisely how the rare catastrophic miss happens. The check you drop is the one that catches what you did not predict. |
| Multi-principal authority | E | Premature at single-operator scale. Trigger: a second human needs to approve something. |
| Cross-repo federation | E | Enormous scope, zero current demand. |

---

## 8. Focus — the three deepened branches

### ★ A. Verification adversary

**Sketch.** A `mutate-gate.mjs` treats `init.sh` as the system under test rather than the
oracle. It copies the project to a scratch directory, applies a small library of
benign-looking mutations, runs `init.sh` in the copy, and asserts a non-zero exit. A second
mutation family targets `init.sh` itself and asserts the *validator* notices the gate got
weaker — which is where a hashed baseline earns its place: a per-check-line hash plus a
check count means any session that shrinks or defangs the gate produces a diff reported as
a scope violation rather than an improvement. Scoring becomes empirical: 0–5 on kill rate,
so a harness whose `init.sh` merely echoes "tests pass" scores 0 however well documented.
`init.sh` gains a `--self-test` flag so an agent can run the adversary before claiming
done, and the kill rate plus surviving-mutant list becomes real content for the "evidence
is recorded" check. `run-benchmark.mjs` gains teeth for free: the throwaway scaffolded
harness must survive its own mutants — the first check in the tool that can fail for a
reason other than a missing string.

**Load-bearing risk.** Mutations must run against a project the harness knows nothing
about — including a markdown-only project with no code and no real test command — or the
subsystem is unrunnable exactly where harness-creator is most often applied. And a generic
mutation library will produce false survivors on legitimately narrow gates, training agents
to suppress the adversary rather than strengthen the gate. That reproduces the original
gaming problem one level up.

**First step.** Two mutations, no scoring: `early-exit` (insert `exit 0` after the shebang
of a scratch copy) and `neuter-first-check` (append `|| true` to the first non-comment
command). Print KILLED/SURVIVED. The early-exit mutant surviving is proof the harness
cannot tell a real gate from a fake one — enough to justify the subsystem before any
scoring or baseline work.

**Children.**
- **Mutation tiers keyed to project substance** — tier-0 no-code projects get *document*
  mutations (delete a required `AGENTS.md` section, blank a feature entry, corrupt
  `progress.md`'s schema); tier-1 code projects add source and test mutations. Directly
  defuses the load-bearing risk by scaling ambition to what the target contains.
- **Gate evidence as a durable artifact** — record per mutation the exit code and stderr
  excerpt, so a reviewer reads an observed failure instead of re-deriving trust from
  source. Gives "evidence is recorded" a payload that cannot be satisfied by a sentence.
- **Ratchet mode** — store the kill rate and fail when it drops. Gates rarely get deleted;
  they get outgrown.
- **Adversary as scheduled work** — `enrich-harness.mjs` writes each surviving mutant into
  `dream-queue.md` as a concrete task. A low score produces a number; a surviving mutant
  produces an unambiguous next action.
- **`--drill` mode** — mutate silently, hand the agent a red gate, and score whether it
  repairs *reality* or *the measurement*. Measures the one thing text scoring can never
  see, and it is the behavioural premise the whole harness rests on.

### ★ B. The graveyard (negative knowledge)

**Sketch.** A fifth memory artifact, `memory/graveyard.md`, recording verdicts on
foreclosed routes rather than lessons or friction, on a fixed schema: Route, Verdict
(rejected / reverted / made-things-worse), Because (the specific constraint that killed it,
not a vibe), Blast radius, Sessions, and Recheck-if (the falsifiable expiry condition).
Unlike the index it is not read in full each session; the index carries one always-on
pointer row, making it a cheap conditional lookup at the moment an agent is about to
re-derive an expensive mistake. Writes come from two places: the session-end journal prompt
gains a fifth question, and curation gains a fifth signal — "reconsidered" — when a buried
route reappears in the journal or the queue. Decay rides on Recheck-if rather than a clock:
entries never silently fade, but any route proposed again after its condition fires is
surfaced as a queue item asking a human whether it still holds. Catastrophic entries are the
one class inlined verbatim into the index, because a single re-derivation costs more than
the whole index budget.

**Load-bearing risk.** The graveyard is **write-mostly and read-never**: agents record
abandoned routes dutifully at session end but never grep it at proposal time, because
nothing forces the lookup at the moment of temptation. And if it *is* read while stale it
becomes active harm — a well-formatted, evidence-shaped document forbidding the now-correct
approach. Negative knowledge is far more damaging when wrong than positive knowledge,
because it stops work that would succeed and leaves no trace of the counterfactual.

**First step.** Ship the schema and one worked row as a template, plus the index pointer
row and the fifth journal question. Nothing in curation or scoring yet — a
scaffolded-but-empty graveyard costs nothing, and a curation signal with no corpus is
untestable.

**Children.**
- **Recheck-if as an executable tripwire** — allow an optional shell predicate that
  `init.sh` evaluates at startup, printing only rows whose expiry condition now holds.
  Converts read-never into a *push*, and degrades gracefully where there is no code.
- **Graveyard-aware scope boundaries** — treat a catastrophic-blast-radius route as a hard
  scope wall requiring explicit human unlock, not a warning the agent can rationalise past.
- **Counterfactual pairing** — each row names the route taken *instead*, pointing at a
  memory lesson. A rejection with no alternative produces paralysis or silent
  re-derivation; pairing makes the graveyard navigational rather than purely prohibitive.
- **Cross-project extraction** — lift routes whose Because is environment-independent
  (library unmaintained, API removed upstream) into a shared graveyard new projects inherit.
  The Recheck-if discipline is what makes that safe rather than folklore export.
- **Death-log post-mortem template** — a distinct end-of-session path when a session ends
  in revert or abandonment, capturing what looked compelling, the first wrong turn, and
  what would have caught it earlier.

### ★ C. Longitudinal telemetry

**Sketch.** A single append-only `memory/audit-log.jsonl`, one line per validate run:
timestamp, overall, the seven subsystem scores, plus census fields the validator already
has in hand — feature counts by status, a per-feature status hash, index byte and line
count, journal block count. The status hash is what unlocks the derived signals for free:
the next run diffs statuses and can name a re-open, count churn as consecutive audits in
progress, and compute time-to-done. Output gains one block above the bottleneck line:
current score with a delta and arrow, plus any tripped alarms. Thresholds live in the log's
own history rather than as constants — a drop is meaningful relative to that project's
variance, and under three entries the tool prints `no trend yet` instead of inventing a
baseline. Because a JSONL line is a fact about a moment and never rewritten, it is safe to
append to and should be marked append-only in `AGENTS.md`. Cost accounting and path
counters graft on as extra fields on the same line, so there is one time-series file rather
than three competing ones.

**Load-bearing risk.** Audits are not evenly spaced, so every derived signal is measured in
*audit-events*, not days — "in progress for 5 audits" means nothing until you know whether
that was an hour or a quarter. Worse, caring about the trend changes it: once an agent
knows re-opens are counted, the cheap fix is to stop marking things `done`, and the log
records improvement while quality falls exactly as before. **Any signal derived from a
field the agent can freely rewrite is a metric it optimises rather than reports.**

**First step.** ~40 lines: an `appendAuditEntry()` using `appendFileSync`, newline
terminated, never read-modify-write, with the fields the validator already computes plus
the status hash. Read only the last two lines to print a delta. Ship it printing *only*
`delta vs last audit` — no alarms, no thresholds — and let real logs accumulate for weeks
so the constants come from observed variance rather than a day-one guess.

**Children.**
- **Dual-clock entries** — stamp both wall-clock and a monotonic audit counter, plus
  `days_since_last`, so every rate can be expressed per-audit or per-day and labelled
  dense or sparse. Attacks the load-bearing risk directly for the cost of one field.
- **Prefer un-fakeable signals** — derive churn from file mtimes and evidence-string
  changes rather than self-reported status; cross-check `done` claims against whether the
  evidence field actually changed.
- **Render `trend.md`** — a plain-text sparkline per subsystem plus a since-last-session
  block, linked from `session-handoff.md`, so the trend enters context at session start
  rather than only when someone runs the auditor. A log nobody reads changes nothing.
- **Fleet mode** — every harnessed project writes the same schema, so reading N logs at
  once answers which subsystems decay fastest across projects and which scaffolded
  artifacts are never touched after `init.sh`. Evidence about the scaffold itself that its
  author cannot get any other way.
- **Silence detection** — flag the *absence* of change: a subsystem flat across many
  audits, a check with zero hits since the origin entry, a journal with no new block
  despite feature statuses moving. The 100/100-while-rotting mode is usually a signal that
  stopped varying, which only a persisted history can perceive.

---

## 9. Provocation — the eighth subsystem may not be a document

Every subsystem here verifies **documents about work**. None observes **work**.

Notice what the three focus picks have in common:

| Needs to know | Which is |
|---|---|
| what the gate actually did | a tool-call outcome |
| what was tried and abandoned | a sequence of tool calls |
| what changed between two moments | a diff over time |
| what was touched, how often | a file-access trace |
| how long something took | a timestamp pair |

**All five are derived reads over one stream** — the session's tool-call trace: which files
were touched in what order, which commands ran, what failed, what was retried, how long it
took.

So the eighth subsystem may be a **session recorder**, with everything else as a view over
it. That is adding one substrate instead of five more markdown files.

Two things make this worth serious thought:

1. It is the input the source talk **assumed you already had** — its curation pass reads
   session transcripts *including tool-call metadata*. The memory layer was built without
   it, substituting a hand-written journal, which is a human-maintained approximation of a
   stream the runtime already produces.
2. It is the one artifact this harness has consistently thrown away.

---

## 10. If picking one

**Environment contract** (F, 8.30) is the cheapest real win and solves a problem visible
in this very setup.

**Verification adversary** (A, 9.25) is the highest-value, because it converts the
verification subsystem from textual to empirical — and verification is the subsystem the
whole definition of done rests on.

**Telemetry** (C, 8.50) has the best cost-to-insight ratio: ~40 lines to start, and it is
the prerequisite for noticing anything at all about direction.

Order suggested: environment contract → telemetry (start logging early, thresholds later)
→ verification adversary → graveyard.
