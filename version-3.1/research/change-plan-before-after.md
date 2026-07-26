---
type: reference
title: "Change Plan — before/after for every edit site"
description: "Site-by-site before/after for the six missing-subsystem clusters: exact file, exact current code, exact replacement, measured score impact, and build order with verification gates"
tags: [research, roadmap, implementation, diff, before-after, scoring]
timestamp: 2026-07-26
status: plan — every BEFORE block is verbatim from the current tree; every AFTER block is proposed
---

# Change Plan — before / after

Third document in the set:

| Doc | Answers |
|---|---|
| [`missing-subsystems.md`](missing-subsystems.md) | **Why** — six clusters of absent capability |
| [`implementation-plan.md`](implementation-plan.md) | **What & when** — phases, effort, sequencing |
| **this file** | **Where exactly** — the edit sites, with before/after and measured score impact |

Every `BEFORE` block below is copied verbatim from the current tree at the line numbers
given. Every `AFTER` block is proposed and not yet applied. Nothing in this document has
been written to `scripts/`, `templates/`, or `examples/`.

---

## 0. Read this part first — three measured findings that change the plan

I ran the current validator before writing any of this. Three things came back that the
`implementation-plan.md` did not account for.

### 0.1 Cluster B's "provably inert" Phase 0 is not inert — it breaks a passing check

`implementation-plan.md` §2 Phase 0 claims `validate-harness.mjs` score is **unchanged**
after adding `memory/graveyard.md`, because nothing reads it yet. That is wrong, and it is
measurable. Reproduced against a copy of `examples/react-harness`:

```
Overall: 94/100                                 (was 97)
memory: 3/5 (4/6)                               (was 4/5, 5/6)
  FAIL Memory links intact (no dangling or orphaned entries) — orphaned: graveyard.md
```

**Cause.** `harness-utils.mjs:237-239` treats every `.md` file under `memory/` that isn't
`index.md` or `journal.md` as a *lesson topic file*:

```js
const memoryTopics = files.filter((file) =>
  file.path.startsWith('memory/') &&
  !['memory/index.md', 'memory/journal.md'].includes(file.path));
```

`memoryLinksIntact()` then requires every topic file to be linked from the index. The
graveyard is not a lesson and is not linked, so it reports as orphaned. The graveyard has
to be added to that exclusion list **in the same commit that scaffolds it** — not in
Phase 1. See §4.2 for the exact edit.

This is the same class of error as the `allText` contamination during the memory rollout:
a new artifact landing inside a directory that an existing check already scans.

### 0.2 Both bundled examples fail a memory check for a different reason than recorded

`CHANGELOG.md:67` states 4/5 is the ceiling for a fresh harness because "the fifth point
requires a non-empty index, i.e. real recorded lessons." That is not what is failing:

```
FAIL Two-step save invariant documented        ← the actual failing check
```

Neither example's `AGENTS.md` contains `## Memory` or `## Curation (Dreaming)` at all —
verified by grep, 0 occurrences of `two-step save` in both, against 1 in
`templates/agents.md`. The examples got the memory *files* copied in but never had their
`AGENTS.md` regenerated from the updated template.

Consequences worth knowing before building on top:
- The gap is a **stale artifact**, not a scoring ceiling. It is auto-fixable today —
  `enrich-harness.mjs` already has a `GAP_FIXES` entry keyed on this exact message.
- The CHANGELOG statement should be corrected; it currently sends a reader looking for a
  nonexistent design limit.
- `memoryIndexUsable()` is therefore **not yet proven against a real harness**. It passes
  on the templates' `_No lessons recorded yet._` marker and has never been exercised
  against a populated index.

Fix this before any cluster work — §2 below. It is a 5-minute prerequisite.

### 0.3 The denominator stays 35, but scores still move

No new subsystem is proposed, so `SUBSYSTEMS.length * 5` stays 35 and the percentage scale
is untouched. But four clusters add checks *inside* existing subsystems, and the per-subsystem
score is `Math.max(1, Math.round((passed / total) * 5))` — so changing `total` moves the score
even when `passed` doesn't.

This is a milder version of what the memory rollout got wrong. The difference that makes it
acceptable: each drop below points at a **genuinely absent capability**, not at a
redefinition. A harness losing a point on `verification` because its gate cannot catch a
disabled test is being told something true.

---

## 1. Measured before → projected after

Baseline is real output from `node scripts/validate-harness.mjs`. Projections apply the
scoring formula by hand.

### 1.1 Both examples, today

| Subsystem | Checks | Score |
|---|---|---|
| instructions | 5/5 | 5/5 |
| state | 5/5 | 5/5 |
| verification | 5/5 | 5/5 |
| scope | 5/5 | 5/5 |
| lifecycle | 5/5 | 5/5 |
| memory | 5/6 | 4/5 |
| behavioral | 8/8 | 5/5 |
| **Overall** | | **97/100**, bottleneck `memory`, tier `production` |

### 1.2 After all clusters ship, examples *not* regenerated

| Subsystem | Checks | Score | Δ | Driver |
|---|---|---|---|---|
| instructions | 5/5 | 5/5 | — | untouched |
| state | 5/5 | 5/5 | — | untouched |
| verification | 6/7 | **4/5** | ▼1 | A adds `mutationKillRate` → **fails** (gate can't catch breakage); F adds env check → passes vacuously |
| scope | 5/6 | **4/5** | ▼1 | E adds `open-work.md` presence → **fails** (file absent) |
| lifecycle | 5/5 | 5/5 | — | untouched |
| memory | 6/7 | 4/5 | — | B adds graveyard check → passes vacuously; rounding absorbs it |
| behavioral | 8/8 | 5/5 | — | untouched |
| **Overall** | | **91/100** | ▼6 | tier stays `production` (weakest is 4, not ≤1) |

### 1.3 After all clusters ship, examples regenerated + remediated

| Subsystem | Checks | Score | Note |
|---|---|---|---|
| verification | 6/7 | **4/5** | `mutationKillRate` still fails — the examples are stubs with no real test suite. **This is correct behaviour.** |
| scope | 6/6 | 5/5 | `open-work.md` scaffolded |
| memory | 7/7 | 5/5 | §2's `AGENTS.md` refresh fixes two-step save |
| **Overall** | | **97/100** | |

**The honest ceiling for a stub example becomes 97, not 100.** Only a project with a test
suite that actually fails when code breaks can reach 100. That is the single most valuable
property of this whole plan: 100/100 stops being reachable by paperwork.

---

## 2. Prerequisite P0 — fix the stale examples (~15 min, do first)

Not a cluster. A pre-existing defect found while measuring, blocking clean before/after
readings for everything else.

**Site:** `examples/react-harness/AGENTS.md`, `examples/python-api-harness/AGENTS.md`

**BEFORE** — neither file contains a `## Memory` section. Grep result:
```
examples/react-harness/AGENTS.md:0        ← occurrences of "two-step save"
examples/python-api-harness/AGENTS.md:0
templates/agents.md:1
```

**AFTER** — run the tool that already exists for this:
```bash
node scripts/enrich-harness.mjs --target examples/react-harness --apply
node scripts/enrich-harness.mjs --target examples/python-api-harness --apply
```
`GAP_FIXES['Two-step save invariant documented']` inserts the `## Memory` section;
`GAP_FIXES['Curation cadence and human gate documented']` inserts `## Curation (Dreaming)`.

**Also correct** `CHANGELOG.md:67`:

| | Text |
|---|---|
| BEFORE | `4/5 is the honest ceiling for a fresh harness — the fifth point requires a non-empty index, i.e. real recorded lessons.` |
| AFTER | `Both examples sit at 4/5 because their AGENTS.md predates the Memory section, so "Two-step save invariant documented" fails. Regenerating or enriching them reaches 5/5 — a fresh scaffold from the current template scores 5/5 on memory immediately.` |

**Gate:** both examples report `memory: 5/5` and `Overall: 100/100`, and
`memoryIndexUsable()` has now been exercised against a harness whose index is not the
verbatim template.

---

## 3. Cluster F — Environment contract (build first)

Cheapest, zero dependencies, and the pattern is already proven in this project's own
`init.sh` (the Video repo resolves `ffmpeg`/`yt-dlp` off a non-default PATH).

### 3.1 New file — `templates/environment.md`

No before; new optional template, **not** added to `create-harness.mjs`. Same
"not scaffolded, consulted when needed" status as `feature-list.schema.json` and
`memory-entry.md`.

```markdown
---
type: template
title: "Environment Contract Template"
description: "Declared external preconditions — tools, versions, env vars — checked by init.sh separately from the project's own tests"
artifact: "environment.md"
tags: [verification, environment, preconditions, tools, contract]
---

# Environment Contract

What must be true of the machine before this project's own verification means anything.
`init.sh` runs each Check and reports pass/fail **separately** from test output, so
"the world changed" is never mistaken for "the code broke".

| Requirement | Check |
|---|---|
| node >= 20 | `node --version` |
| ffmpeg on PATH | `command -v ffmpeg` |
| DATABASE_URL set | `test -n "$DATABASE_URL"` |

One row per precondition. The Check cell must be a shell command whose exit code is the
verdict — no output parsing.
```

### 3.2 `templates/init.sh` — insert the contract loop

**BEFORE** (lines 15-19):
```bash
set -e

echo "=== Harness Initialization ==="

if [ -f package.json ]; then
```

**AFTER**:
```bash
set -e

echo "=== Harness Initialization ==="

# Environment contract runs before anything else and reports separately from test
# output: a missing tool is not a failing test, and conflating the two sends the next
# session debugging code that was never broken.
if [ -f environment.md ]; then
  echo "=== Environment contract ==="
  ENV_FAILED=0
  # Parse rows of "| Requirement | `check command` |", skipping header and separator.
  while IFS='|' read -r _ requirement check _; do
    requirement="$(echo "$requirement" | sed 's/^ *//;s/ *$//')"
    check="$(echo "$check" | sed 's/^ *//;s/ *$//;s/^`//;s/`$//')"
    case "$requirement" in ''|Requirement|---*) continue ;; esac
    [ -z "$check" ] && continue
    if eval "$check" >/dev/null 2>&1; then
      echo "  PASS  $requirement"
    else
      echo "  FAIL  $requirement   (check: $check)"
      ENV_FAILED=$((ENV_FAILED + 1))
    fi
  done < environment.md
  if [ "$ENV_FAILED" -gt 0 ]; then
    echo "Environment contract failed ($ENV_FAILED unmet). This is the machine, not the code."
    exit 1
  fi
fi

if [ -f package.json ]; then
```

Note the interaction with `set -e`: the `eval` sits inside an `if`, so a failing check does
not abort the loop — it is counted and reported. That is deliberate; reporting all four
unmet preconditions at once beats surfacing them one re-run at a time.

### 3.3 `harness-utils.mjs` — load the file, add one check

**BEFORE** (lines 463-473):
```js
export async function loadHarnessFiles(root) {
  const candidates = [
    'AGENTS.md',
    'CLAUDE.md',
    'feature_list.json',
    'feature-list.json',
    'progress.md',
    'session-handoff.md',
    'init.sh',
    'dream-queue.md'
  ];
```

**AFTER**:
```js
export async function loadHarnessFiles(root) {
  const candidates = [
    'AGENTS.md',
    'CLAUDE.md',
    'feature_list.json',
    'feature-list.json',
    'progress.md',
    'session-handoff.md',
    'init.sh',
    'dream-queue.md',
    'environment.md',
    'open-work.md'
  ];
```

> **This edit is load-bearing for two clusters.** `hasFile()` reads `byPath`, which is built
> only from files `loadHarnessFiles` returned. Add the `scope` check in Cluster E without
> adding `open-work.md` here and the check fails 100% of the time regardless of whether the
> file exists. Same for `environment.md`.

**BEFORE** (lines 232-236) — add the binding alongside the existing ones:
```js
  const init = byPath.get('init.sh') || '';
  const handoff = byPath.get('session-handoff.md') || '';
```

**AFTER**:
```js
  const init = byPath.get('init.sh') || '';
  const handoff = byPath.get('session-handoff.md') || '';
  const environment = byPath.get('environment.md') || '';
```

**BEFORE** (lines 256-262) — the `verification` block:
```js
    verification: [
      hasFile(byPath, ['init.sh'], 'Verification entrypoint exists'),
      textHas(init, ['set -e'], 'Verification fails fast'),
      textHas(init + agents, ['test', 'pytest', 'vitest', 'cargo test', 'go test', 'dotnet test'], 'Test command documented'),
      textHas(init + agents, ['build', 'type', 'lint', 'compile'], 'Static/build check documented'),
      textHas(allText, ['Evidence', 'Verification Evidence', 'command and output'], 'Verification evidence is recorded')
    ],
```

**AFTER**:
```js
    verification: [
      hasFile(byPath, ['init.sh'], 'Verification entrypoint exists'),
      textHas(init, ['set -e'], 'Verification fails fast'),
      textHas(init + agents, ['test', 'pytest', 'vitest', 'cargo test', 'go test', 'dotnet test'], 'Test command documented'),
      textHas(init + agents, ['build', 'type', 'lint', 'compile'], 'Static/build check documented'),
      textHas(allText, ['Evidence', 'Verification Evidence', 'command and output'], 'Verification evidence is recorded'),
      environmentContractHonoured(environment, init, 'Declared environment preconditions are checked by the entrypoint')
    ],
```

New function, placed beside the other artifact checks (after `memoryLinksIntact`, ~line 446):
```js
// Vacuously true when environment.md is absent — the file is optional, so its absence is
// not a defect. Only a declared-but-unchecked contract is. Mirrors the "absence is not
// penalised" posture used for optional memory artifacts.
function environmentContractHonoured(environmentText, initText, message) {
  if (!environmentText.trim()) {
    return { pass: true, message, detail: 'no environment.md declared' };
  }
  const rows = environmentText.split(/\r?\n/).filter((line) => {
    const cells = line.split('|').map((cell) => cell.trim());
    return cells.length >= 4 && cells[1] && cells[2]
      && cells[1] !== 'Requirement' && !/^-+$/.test(cells[1]);
  });
  if (!rows.length) {
    return { pass: false, message, detail: 'environment.md has no parseable requirement rows' };
  }
  if (!initText.includes('environment.md')) {
    return { pass: false, message, detail: `${rows.length} requirements declared but init.sh never reads environment.md` };
  }
  return { pass: true, message, detail: `${rows.length} requirements checked by init.sh` };
}
```

**Definition of done:** a project with `environment.md` declaring `node >= 99` fails
`./init.sh` with `FAIL  node >= 99` on its own line, visually distinct from any test output,
and exit 1; a project with no `environment.md` scores exactly as it did before this cluster.

---

## 4. Cluster B — Graveyard (build second — it contains the §0.1 fix)

Sequenced ahead of Cluster A specifically because §0.1 found a live regression here.

### 4.1 New file — `templates/memory-graveyard.md`

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
| `date-fns-tz` for scheduling | rejected | drops DST on half-hour offset zones | 2h | 3 | upstream #1483 closes |

**Recheck-if is mandatory.** A row without one is folklore — nobody can tell whether it
still applies, so it is either obeyed forever or ignored entirely.

This file is **not** linked from `memory/index.md` and is not a lesson topic file. It is
consulted directly, before proposing a library, refactor, or rewrite.
```

### 4.2 `harness-utils.mjs` — the §0.1 fix, shipped in the same commit

**BEFORE** (lines 237-239):
```js
  const memoryTopics = files.filter((file) =>
    file.path.startsWith('memory/') &&
    !['memory/index.md', 'memory/journal.md'].includes(file.path));
```

**AFTER**:
```js
  // graveyard.md is not a lesson and is deliberately not linked from the index, so it
  // must be excluded here or memoryLinksIntact reports it as orphaned. Measured: adding
  // graveyard.md without this line drops memory 4/5 → 3/5 and overall 97 → 94.
  const memoryTopics = files.filter((file) =>
    file.path.startsWith('memory/') &&
    !['memory/index.md', 'memory/journal.md', 'memory/graveyard.md'].includes(file.path));
```

Add the binding alongside the other memory bindings (**BEFORE**, lines 234-236):
```js
  const memoryIndex = byPath.get('memory/index.md') || '';
  const memoryJournal = byPath.get('memory/journal.md') || '';
  const dreamQueue = byPath.get('dream-queue.md') || '';
```
**AFTER**:
```js
  const memoryIndex = byPath.get('memory/index.md') || '';
  const memoryJournal = byPath.get('memory/journal.md') || '';
  const memoryGraveyard = byPath.get('memory/graveyard.md') || '';
  const dreamQueue = byPath.get('dream-queue.md') || '';
```

`loadMemoryFiles` needs **no change** — it already walks every `.md` under `memory/`, so
`graveyard.md` arrives in the file list automatically. That is precisely why the exclusion
above is required.

### 4.3 `harness-utils.mjs` — the memory check

**BEFORE** (lines 281-296) — 6 checks, ending:
```js
      structuredHas(
        agents + '\n' + dreamQueue,
        ['curation cadence', 'every ~10 sessions', 'propose, never apply'],
        'Curation cadence and human gate documented'
      )
    ],
```

**AFTER** — 7 checks:
```js
      structuredHas(
        agents + '\n' + dreamQueue,
        ['curation cadence', 'every ~10 sessions', 'propose, never apply'],
        'Curation cadence and human gate documented'
      ),
      graveyardWellFormed(memoryGraveyard, 'Graveyard entries carry a cause and an expiry condition')
    ],
```

New function:
```js
// Optional artifact: absence is not penalised, only malformed rows are. A row without a
// Recheck-if is unfalsifiable folklore — it will be obeyed forever or ignored entirely,
// and there is no way to tell which from the file.
function graveyardWellFormed(graveyardText, message) {
  if (!graveyardText.trim()) {
    return { pass: true, message, detail: 'no graveyard (optional)' };
  }
  const rows = graveyardText.split(/\r?\n/)
    .map((line) => line.split('|').map((cell) => cell.trim()))
    .filter((cells) => cells.length >= 8 && cells[1] && !/^-+$/.test(cells[1])
      && cells[1].toLowerCase() !== 'route');
  if (!rows.length) {
    return { pass: false, message, detail: 'graveyard exists but has no parseable rows' };
  }
  const bad = rows.filter((cells) => !cells[3] || !cells[6]);
  if (bad.length) {
    return {
      pass: false, message,
      detail: `${bad.length}/${rows.length} rows missing Because or Recheck-if: ${bad.slice(0, 3).map((cells) => cells[1]).join(', ')}`
    };
  }
  return { pass: true, message, detail: `${rows.length} rows, all with cause and expiry` };
}
```

### 4.4 `create-harness.mjs` — scaffold it

**BEFORE** (lines 70-72):
```js
results.push(await copyTemplate('memory-index.md', path.join(target, 'memory', 'index.md'), {}, { force }));
results.push(await copyTemplate('memory-journal.md', path.join(target, 'memory', 'journal.md'), {}, { force }));
results.push(await copyTemplate('dream-queue.md', path.join(target, 'dream-queue.md'), {}, { force }));
```

**AFTER**:
```js
results.push(await copyTemplate('memory-index.md', path.join(target, 'memory', 'index.md'), {}, { force }));
results.push(await copyTemplate('memory-journal.md', path.join(target, 'memory', 'journal.md'), {}, { force }));
results.push(await copyTemplate('memory-graveyard.md', path.join(target, 'memory', 'graveyard.md'), {}, { force }));
results.push(await copyTemplate('dream-queue.md', path.join(target, 'dream-queue.md'), {}, { force }));
```

The existing `memory/` pre-flight guard at lines 49-54 already covers this path — no
additional guard needed.

Also update the help text, **BEFORE** (lines 27-29):
```
  memory/index.md (bounded index of agent-written lessons)
  memory/journal.md (append-only friction log; the input to curation)
  dream-queue.md (out-of-band curation proposals, human-gated)
```
**AFTER**:
```
  memory/index.md (bounded index of agent-written lessons)
  memory/journal.md (append-only friction log; the input to curation)
  memory/graveyard.md (rejected routes with expiry conditions)
  dream-queue.md (out-of-band curation proposals, human-gated)
```

### 4.5 `templates/memory-journal.md` — fifth question

**BEFORE** (lines 28-31):
```markdown
- What did you have to look up?
- What surprised you?
- What correction did you receive?
- What would you do differently?
```

**AFTER**:
```markdown
- What did you have to look up?
- What surprised you?
- What correction did you receive?
- What did you try and abandon, and why? (→ candidate `memory/graveyard.md` row)
- What would you do differently?
```

### 4.6 `templates/agents.md` — one bullet in the Memory section

**BEFORE** (lines 132-134):
```markdown
- **`memory/journal.md` is not a lesson store.** It is the raw append-only log of
  session friction — the corpus curation reads to find patterns. Lessons are the
  distilled output; the journal is the evidence they came from.
```

**AFTER** — append one bullet after it:
```markdown
- **`memory/journal.md` is not a lesson store.** It is the raw append-only log of
  session friction — the corpus curation reads to find patterns. Lessons are the
  distilled output; the journal is the evidence they came from.
- **Before proposing a library, refactor, or rewrite, read `memory/graveyard.md`.** It
  records routes already tried and rejected. Every row carries a `Recheck-if` condition;
  if that condition now holds, the verdict is stale and the route is open again.
```

**Definition of done — the three-way proof used for `memoryLinksIntact`:**
a hand-written row missing `Recheck-if` **fails**; the same row with it **passes**; a fresh
scaffold carrying only the worked example **passes**; and — the §0.1 regression check —
`memory` stays at its pre-change score on both examples.

---

## 5. Cluster A — Verification adversary (build third)

The one cluster with a genuine go/no-go gate before Phase 1.

### 5.1 Phase 0 — new file `scripts/mutate-gate.mjs`, wired to nothing

```js
#!/usr/bin/env node
// Phase 0: standalone. Imported by nothing. Proves whether init.sh can tell a real check
// from a disabled one. If `early-exit` is KILLED here, this cluster's premise is wrong —
// stop and re-examine before building Phase 1.
import { cp, mkdtemp, readFile, writeFile } from 'node:fs/promises';
import { spawnSync } from 'node:child_process';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { parseArgs } from './lib/harness-utils.mjs';

const MUTATIONS = [
  { id: 'early-exit', apply: (sh) => sh.replace(/^(#!.*\n)/, '$1exit 0\n') },
  { id: 'neuter-first-check', apply: (sh) => {
      const lines = sh.split('\n');
      const i = lines.findIndex((l) => l.trim() && !l.trim().startsWith('#') && !l.startsWith('#!'));
      if (i >= 0) lines[i] += ' || true';
      return lines.join('\n');
    } }
];

const args = parseArgs(process.argv.slice(2));
const target = path.resolve(args.target || process.cwd());

for (const mutation of MUTATIONS) {
  const scratch = await mkdtemp(path.join(tmpdir(), 'mutate-gate-'));
  await cp(target, scratch, { recursive: true });
  const initPath = path.join(scratch, 'init.sh');
  await writeFile(initPath, mutation.apply(await readFile(initPath, 'utf8')), { mode: 0o755 });
  const run = spawnSync('bash', ['init.sh'], { cwd: scratch, encoding: 'utf8' });
  // A mutant is KILLED when the gate notices it — i.e. exits non-zero.
  console.log(`${run.status === 0 ? 'SURVIVED' : 'KILLED  '} ${mutation.id}`);
}
```

**Phase 0 gate — and it is a real decision point, not a formality:**
- `early-exit` must print **SURVIVED** against an unmodified scaffold. That single line is
  the entire justification for the rest of the cluster.
- If it prints KILLED, **stop.** The premise is wrong and Phase 1 should not be built.
- `git diff --stat` must show zero changes to `harness-utils.mjs` — nothing imports this yet.

### 5.2 Phase 1 — wire one check into `verification`

Extends the same block already edited in §3.3, to 7 checks:
```js
    verification: [
      ...,
      textHas(allText, ['Evidence', ...], 'Verification evidence is recorded'),
      environmentContractHonoured(environment, init, 'Declared environment preconditions are checked by the entrypoint'),
      await mutationKillRate(root, 'Gate demonstrably catches known breakage')
    ],
```

**This is the one signature change in the plan.** `scoreHarness(files)` is currently pure
and synchronous; `mutationKillRate` has to execute `init.sh` in a scratch copy. Two options:

| Option | Cost |
|---|---|
| Make `scoreHarness` async | Touches every caller: `validate-harness.mjs:39`, `enrich-harness.mjs`, `run-benchmark.mjs`. Small but wide. |
| **Recommended:** compute kill rate *outside* `scoreHarness` and pass it in as an optional argument | `scoreHarness(files, { killRate })`; check is vacuously true when `killRate` is undefined. Keeps the scorer pure and keeps `--json` fast by default. |

Take the second. It also means the expensive mutation run stays behind a flag rather than
firing on every routine `validate-harness.mjs` call:

```js
export function scoreHarness(files, { killRate } = {}) { ... }

function gateCatchesBreakage(killRate, message) {
  if (killRate === undefined) {
    return { pass: true, message, detail: 'not measured (run with --mutate)' };
  }
  return {
    pass: killRate.rate >= 0.8,
    message,
    detail: `${killRate.killed}/${killRate.total} mutants killed`
  };
}
```

Vacuously-true-when-unmeasured keeps every existing invocation's score identical, so the
`--mutate` flag is opt-in exactly like `--log` in Cluster C.

Mutation library grows to 6, **tiered via the existing `detectProject()`** (already at
`harness-utils.mjs:82` and already classifies stack — no new detection code):

| Tier | Condition | Mutations |
|---|---|---|
| 0 | `stack === 'generic'` | `early-exit`, `neuter-first-check`, plus document mutations (blank a `feature_list.json` evidence field) |
| 1 | any real stack | tier 0 + `blank-test-file`, `break-first-assertion`, `delete-required-config-key`, `truncate-a-function` |

### 5.3 `templates/init.sh` — `--self-test`

**BEFORE** (lines 85-91):
```bash
echo "=== Verification Complete ==="
echo ""
echo "Next steps:"
```
**AFTER**:
```bash
if [ "$1" = "--self-test" ]; then
  echo "=== Gate self-test (mutation) ==="
  node scripts/mutate-gate.mjs --target . || true
fi

echo "=== Verification Complete ==="
echo ""
echo "Next steps:"
```
`|| true` is deliberate: the self-test **reports**, it does not gate. A gate that fails
because its own self-test tooling is missing is worse than no self-test.

---

## 6. Cluster E — Recruitment signalling (build fourth)

### 6.1 New file — `templates/open-work.md`

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

This is not a backlog and not a wishlist. An item earns a line here only because a session
actually saw it and declined it under scope discipline.

_No open items yet._
```

### 6.2 `harness-utils.mjs` — one `scope` check

**BEFORE** (lines 263-269):
```js
    scope: [
      structuredHas(agents, ['One feature at a time', 'one-feature-at-a-time'], 'One-feature-at-a-time rule exists'),
      textHas(featureList, ['dependencies'], 'Feature dependencies are tracked'),
      textHas(agents + featureList, ['status'], 'Feature status is explicit'),
      structuredHas(agents, ['Stay in scope', 'scope'], 'Scope boundary documented'),
      structuredHas(agents, ['Definition of Done'], 'Completion gate limits scope closure')
    ],
```
**AFTER**:
```js
    scope: [
      structuredHas(agents, ['One feature at a time', 'one-feature-at-a-time'], 'One-feature-at-a-time rule exists'),
      textHas(featureList, ['dependencies'], 'Feature dependencies are tracked'),
      textHas(agents + featureList, ['status'], 'Feature status is explicit'),
      structuredHas(agents, ['Stay in scope', 'scope'], 'Scope boundary documented'),
      structuredHas(agents, ['Definition of Done'], 'Completion gate limits scope closure'),
      hasFile(byPath, ['open-work.md'], 'Recruitable open-work surface exists')
    ],
```
Depends on the `loadHarnessFiles` candidate added in §3.3 — without it this check can never
pass. Presence-only for now, matching how lightly `dream-queue.md` was treated in its first
phase.

### 6.3 `templates/agents.md` — redirect existing guidance, don't add new

**BEFORE** (lines 86-87):
```markdown
- **If you notice unrelated dead code or issues**, mention them in `progress.md` —
  don't fix them in this diff.
```
**AFTER**:
```markdown
- **If you notice unrelated dead code or issues**, add one line to `open-work.md` with a
  reason code — don't fix them in this diff. `progress.md` is status; this is recruitable
  work someone else can pick up.
```

Add to Required Artifacts, **BEFORE** (line 108-109):
```markdown
- `dream-queue.md` — Out-of-band curation proposals awaiting human decision
- `session-handoff.md` — Optional, for larger sessions
```
**AFTER**:
```markdown
- `dream-queue.md` — Out-of-band curation proposals awaiting human decision
- `open-work.md` — Work seen but declined under scope discipline
- `session-handoff.md` — Optional, for larger sessions
```

### 6.4 Startup workflow — extend step 5, do NOT insert a step

**BEFORE** (line 34):
```markdown
5. **Read `feature_list.json`** to see current feature state
```
**AFTER**:
```markdown
5. **Read `feature_list.json`** to see current feature state. Also scan `open-work.md`
   for a `cheap-parallel-win` that fits the current task before starting a fresh feature.
```

> **Why extend rather than insert.** Inserting a new step 6 renumbers steps 6-8. Renumbering
> is what produced the `5.5` workaround that silently broke `structuredText()` — its list
> matcher `/^([-*+]|\d+\.)\s/` rejects `5.5.`, so the two most load-bearing memory
> instructions were invisible to every check. Extending an existing step avoids the hazard
> entirely. If a step must genuinely be inserted, renumber fully to integers and re-run the
> validator to confirm nothing dropped out of `structuredText`.

---

## 7. Cluster C — Telemetry (build fifth; unscored)

No scoring edits anywhere. `SUBSYSTEMS` untouched, no check added, `overall` unaffected.

### 7.1 `harness-utils.mjs` — the logger

New export, ~15 lines, appended near the other file helpers:
```js
// Append-only. Never read-modify-write: a corrupted tail must cost one line, not the
// whole history. Deliberately NOT wired into any check — see implementation-plan.md §0.2.
// A trend can say "this got worse"; it cannot say "this is unacceptable", and wiring it
// to an exit code makes "stop measuring honestly" the cheapest way to go green.
export async function appendAuditEntry(root, result) {
  const line = JSON.stringify({
    at: new Date().toISOString(),
    overall: result.overall,
    bottleneck: result.bottleneck,
    subsystems: Object.fromEntries(
      Object.entries(result.subsystems).map(([name, item]) => [name, item.score])
    )
  }) + '\n';
  const logPath = path.join(root, 'memory', 'audit-log.jsonl');
  await mkdir(path.dirname(logPath), { recursive: true });
  await appendFile(logPath, line, 'utf8');
  return logPath;
}
```
Requires adding `appendFile` to the existing import at line 2:

| | Line 2 |
|---|---|
| BEFORE | `import { access, chmod, copyFile, mkdir, readFile, readdir, stat, writeFile } from 'node:fs/promises';` |
| AFTER | `import { access, appendFile, chmod, copyFile, mkdir, readFile, readdir, stat, writeFile } from 'node:fs/promises';` |

**`.jsonl` is not `.md`**, so `loadMemoryFiles` (which filters `entry.name.endsWith('.md')`
at line 514) ignores it automatically. No §0.1-style interaction — verified by reading the
filter, and worth re-confirming with one validator run after the first `--log`.

### 7.2 `validate-harness.mjs` — the flag

**BEFORE** (lines 34-39):
```js
const target = path.resolve(args.target || args._[0] || process.cwd());
const failFast = Boolean(args.failFast);
const noFail = Boolean(args.noFail);
const minScore = Number(args.minScore || (failFast ? 85 : 60));
const files = await loadHarnessFiles(target);
const result = scoreHarness(files);
```
**AFTER**:
```js
const target = path.resolve(args.target || args._[0] || process.cwd());
const failFast = Boolean(args.failFast);
const noFail = Boolean(args.noFail);
const minScore = Number(args.minScore || (failFast ? 85 : 60));
const files = await loadHarnessFiles(target);
const result = scoreHarness(files);

if (args.log) {
  console.log(`Audit appended to ${await appendAuditEntry(target, result)}`);
}
```
Plus one line in the help text's Flags block and `appendAuditEntry` in the import at
lines 3-11.

**Phase 0 gate:** two `--log` runs produce exactly two lines; omitting `--log` leaves the
log untouched; a hand-corrupted last line does not affect anything (nothing reads it yet).

Phase 1 (delta, feature-status hash, dual-clock, `no trend yet` under 3 entries) is
specified in `implementation-plan.md` §3 and deliberately not diffed here — it should be
designed against a log that already has real entries in it, not against a guess.

---

## 8. Cluster D — Context economics (build last; unscored)

Single edit site, advisory output only.

**`validate-harness.mjs`** — after the report block:
```js
if (args.budget) {
  const alwaysOn = ['AGENTS.md', 'CLAUDE.md', 'memory/index.md', 'open-work.md'];
  console.log('\nAlways-on context (loaded every session):');
  let total = 0;
  for (const name of alwaysOn) {
    const file = files.find((item) => item.path === name);
    if (!file) continue;
    const tokens = Math.round(file.content.length / 4);   // crude by design
    total += tokens;
    console.log(`  ${name.padEnd(20)} ${String(file.content.split('\n').length).padStart(4)} lines  ~${tokens} tokens`);
  }
  console.log(`  ${''.padEnd(20)} ${''.padStart(4)}         ~${total} tokens total`);
}
```
`chars / 4` is a deliberate approximation — this is budget *awareness*, not accounting.

**Gate:** zero effect on `overall`, `bottleneck`, or exit code; the printed total visibly
grows between a lean and a bloated `AGENTS.md`.

**Attention auction: not built.** Needs multiple competing request sources arriving often
enough that arbitration matters. Revisit only once `dream-queue.md` and `open-work.md` are
both in real use and someone reports feeling flooded in a single session.

---

## 9. Complete file inventory

Every file this plan touches, once.

| File | Change | Clusters |
|---|---|---|
| `scripts/lib/harness-utils.mjs` | 2 candidates; 2 bindings; graveyard exclusion; 3 new check fns; `scoreHarness` optional arg; `appendAuditEntry`; 1 import | F, B, A, E, C |
| `scripts/validate-harness.mjs` | `--log`, `--mutate`, `--budget` flags; help text; imports | C, A, D |
| `scripts/create-harness.mjs` | 1 `copyTemplate`; help text | B |
| `scripts/mutate-gate.mjs` | **new** | A |
| `templates/init.sh` | env-contract loop; `--self-test` | F, A |
| `templates/agents.md` | graveyard bullet; open-work redirect; step 5; Required Artifacts | B, E |
| `templates/memory-journal.md` | 5th question | B |
| `templates/memory-graveyard.md` | **new** | B |
| `templates/environment.md` | **new** (not scaffolded) | F |
| `templates/open-work.md` | **new** | E |
| `templates/index.md` | 3 rows | B, F, E |
| `scripts/index.md` | 1 row; fix stale "five subsystems" in the validate row | A + P0 |
| `references/tool-registry-pattern.md` | env-contract section | F |
| `references/dreaming-pattern.md` | 5th signal, "reconsidered" | B |
| `examples/*` (×2) | enrich; add `open-work.md`, `memory/graveyard.md` | P0, B, E |
| `CHANGELOG.md` | v0.3.2 entry + correct the §0.2 claim | all |
| `evals/evals.json` | cases for graveyard + env contract | B, F |

**Not touched, deliberately:** `SUBSYSTEMS` / `STRUCTURAL_SUBSYSTEMS` (no new subsystem, no
denominator change), `usabilityTier` / `usabilityTierLabel` (thresholds stay), `formatScoreReport`
/ `htmlReport` (already derive groups from `SUBSYSTEMS`, so new checks render with no edit).

---

## 10. Build order with gates

| # | Step | Gate before moving on |
|---|---|---|
| 0 | **P0** — enrich examples, fix CHANGELOG claim | Both examples `100/100`, `memory: 5/5` |
| 1 | **F** — env contract | `node >= 99` fails `init.sh` distinctly from a test failure; no-`environment.md` project scores identically |
| 2 | **B** — graveyard, incl. §0.1 exclusion fix | `memory` unchanged on both examples after scaffolding graveyard; missing-`Recheck-if` row fails, fixed row passes |
| 3 | **A phase 0** — `mutate-gate.mjs` | `early-exit` SURVIVED. **If KILLED, stop the cluster.** Zero diff to `harness-utils.mjs` |
| 4 | **A phase 1** — `--mutate` + check | Runs without `--mutate` score identically to step 3; `early-exit` now KILLED |
| 5 | **C phase 0** — `--log` | Two runs → two lines; no `--log` → no file; validator score unaffected |
| 6 | **E** — open-work | Scaffolded project passes the scope check; project without the file fails that one check only |
| 7 | **D** — `--budget` | Total grows with a bloated `AGENTS.md`; exit code untouched |

After each step: `node scripts/validate-harness.mjs --target examples/react-harness --no-fail`
and diff against the table in §1. An unexplained movement is a §0.1-class interaction and
should be chased before continuing — that is exactly how the graveyard regression surfaced.

**Rollback:** every cluster is additive. Reverting means deleting the new check line and its
function; no data migration, since the new artifacts are all optional or vacuously-true when
absent. The single exception is §4.2's `memoryTopics` exclusion — that must survive any
rollback of Cluster B, or a leftover `memory/graveyard.md` in a consuming project silently
costs it a memory point.

---

## 11. What this plan does not do

- **No new subsystem, no denominator change.** Stays at 35. Deliberate, per
  `implementation-plan.md` §0.1.
- **Telemetry and context economics never gate.** They print. Permanent, not "for now."
- **No curation automation.** Still a manual pass, per the v0.3.1 decision.
- **Nothing in `missing-subsystems.md` §7 gets built** — quorum gate, difficulty
  auto-tuning, new-game-plus, memory yield rating, verification futures, multi-principal
  authority, cross-repo federation. Each stays documented as *why not*, with a revisit
  trigger.
- **Cluster C Phase 1 is not diffed here.** It should be designed against a real log, not
  a guessed one.
