# Harness Engineering Masterclass — 10 primitives vs. version-4

Captured 2026-08-06. Comparison between the 10-primitive harness framework in
`C:\Users\CharikshithPolimera\Downloads\PI_NEW\system-design\HARNESS_ENGINEERING_NOTES.md`
(notes on an external talk) and this repo's `version-4/` harness, scoped to
`version-4/` only (no root `AGENTS.md`, no `version-3`).

---

## Coverage table

| Video primitive | version-4 equivalent | Coverage |
|---|---|---|
| 1. Instructions | `templates/agents.md` (Ponytail ladder + Karpathy §3/§4 inlined) | Strong |
| 2. Context Delivery | Startup Workflow (steps 3–7: docs, `init.sh`, `feature_list.json`, `open-work.md`) | Strong |
| 3. Context Management | `references/context-engineering-pattern.md` — `memory/index.md` capped at 200 lines, topic files on demand | Strong |
| 4. Tool Interface | `references/tool-registry-pattern.md` — schema, per-call concurrency classification, permission pipeline | Strong |
| 5. Execution Environment | — | **Gap.** No pattern covers sandboxing, containers, credential scoping, or network isolation — *where* a tool call runs, not just whether it's permitted. |
| 6. Durable State | `memory-persistence-pattern.md`, `feature_list.json`, `progress.md`, plus new `memory/graveyard.md` (negative knowledge, `Recheck-if` expiry) | Strongest layer, and it grew since v3 |
| 7. Orchestration | `references/lifecycle-bootstrap-pattern.md` | Strong |
| 8. Sub-agents | `references/multi-agent-pattern.md` | Covered conceptually; `research/missing-subsystems.md` (Cluster E) flags that `feature_list.json`/`progress.md` use last-writer-wins — concurrent agents silently clobber each other. Pattern exists, state files don't enforce it. |
| 9. Skills & Procedures | `references/skill-runtime-pattern.md` | Covered — this is the product |
| 10. Verification & Observability | `init.sh`, Definition of Done, plus new `scripts/mutate-gate.mjs` (verification adversary) | Verification upgraded; Observability did not (see below) |

## What's new in v4 that answers the video's own critiques

- **Ratchet Loop is now a real pattern, not prose.** `references/dreaming-pattern.md`
  formalizes "recorded failure → structural fix" into five curation signals
  (recurring-but-unrecorded, contradiction, dead stock, staleness,
  reconsidered-graveyard-route), propose-never-apply, bounded queue.
- **`mutate-gate.mjs` goes further than the video's own verification primitive.**
  The talk stops at "run tests, don't trust a confident sentence." v4's
  `research/missing-subsystems.md` identifies that every current check only
  verifies *text exists* (`init.sh` is present, `set -e` appears, the word
  `test` appears) — none of it runs anything or can tell a real gate from
  `echo "tests pass"`. The verification adversary mutates the gate and asserts
  it notices.

## What's still missing (in v4's own words)

`research/missing-subsystems.md` §9 proposes an eighth subsystem — a
session/tool-call trace recorder — as the substrate under telemetry, the
graveyard, and verification evidence alike. That's the "Observability" half of
primitive 10 (traces, tool-call args/results, cost, latency) the video
describes, and the doc says outright: *"it is the one artifact this harness
has consistently thrown away."*

Execution Environment (primitive 5) has no such internal acknowledgment — it
isn't listed in `missing-subsystems.md` at all. It's a gap the harness hasn't
yet noticed about itself, not just one it's deferred.

## Status

- **Open, no fix proposed yet:** primitive 5 (Execution Environment pattern doc).
- **Open, already tracked internally:** primitive 8 concurrency (Cluster E,
  `missing-subsystems.md`), primitive 10 observability (§9, same doc).
- Nothing in this file has been applied to `version-4/` — comparison only.
