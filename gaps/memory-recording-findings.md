# Improving the harness memory system — findings & action plan

Captured 2026-08-01. Standalone notes (intentionally **not** filed under
`harness/` yet) from a gap surfaced while wiring the USA scrapers: the harness
memory files sat empty even though the session produced lessons, a convention,
and a dead end all worth recording. This document is written to be **actionable**
— each finding is paired with a concrete change you can make to the harness.

---

## 1. The gap, concretely

During the USA scraper work the session produced at least three memory-worthy
artifacts, none of which were recorded until explicitly prompted:

| Artifact | Type | Belongs in | Recorded? |
|---|---|---|---|
| "Dedup scraper output before save" | convention / lesson | `harness/memory/index.md` + topic file | only after "remember this" |
| "DevTools MCP can't repro a headless-only bug" | dead end | `harness/memory/graveyard.md` | only after "record that one" |
| "Never force-kill a running scraper (leaks the license seat)" | correction | lesson **and** already in global memory | split across two stores |

The common thread: the memory system is **pull, not push**. It waited for the
user to notice and ask. That is the exact failure mode the system exists to
prevent.

---

## 2. Root cause (why it didn't self-record)

Three independent causes stacked up:

1. **The store didn't exist as a live target until mid-session.** `harness/` was
   untracked (not in git) until commit `eeb8e99`. Until then the memory files
   were template placeholders — writing to them would have been writing to
   throwaway scaffolding.
2. **The only defined write-trigger is "End of Session," which never fired.**
   `AGENTS.md` places journal/graveyard/memory writes in an End-of-Session
   routine. This was one long continuous session; that boundary never arrived,
   so the routine never ran. There is **no mid-session trigger** for "you just
   hit a dead end — record it now."
3. **Recording depends entirely on agent discipline.** Nothing in the loop
   *forces* or even *reminds* the agent to write. When the agent is deep in a
   task (getting scrapers green), the bookkeeping silently drops.

None of these is a bug in the templates. They are gaps in **when** and **how
reliably** the templates get filled.

---

## 3. Two memory systems, and why the split hurts

There are two stores with overlapping purpose and no reconciliation policy:

| | Global auto-memory | `harness/memory/` |
|---|---|---|
| Path | `~/.claude/projects/<slug>/memory/` | `harness/memory/` in the repo |
| Governed by | the agent's system prompt | `AGENTS.md` / harness skill |
| In git? | No — personal, this machine only | Yes |
| Audience | only this user's sessions | any agent/teammate on the repo |
| Loaded | **automatically every session** (recall) | only if `AGENTS.md` startup step 6 is followed |
| Trigger word | "remember" | none — routine-driven |

The friction: "remember" routes to the store that is **auto-loaded but private**;
the store that is **shared but not auto-loaded** has no trigger word. So a
shareable convention lands where teammates can't see it, and a repo lesson only
surfaces if the startup routine is actually run. We already hit this — the
dedup convention had to be manually relocated from global → harness.

**Fix direction:** pick a single source-of-truth rule and make the other store a
thin pointer (see §5.4).

---

## 4. What "effective" looks like (success criteria)

Before prescribing changes, define what a working memory system does:

- **Push, not pull:** entries get written when the triggering event happens,
  without the user asking.
- **Cheap to write:** a lesson/graveyard row costs seconds, or it won't happen
  under task pressure.
- **Read at the right moment:** graveyard consulted *before* proposing a
  library/refactor/rewrite; index read at startup; both actually influence
  behavior.
- **Self-auditing:** the system reports when it's being ignored (e.g. a
  graveyard row's "Sessions" counter rising means nobody read it).
- **Single source of truth per fact:** no fact lives in two stores with drift.

---

## 5. Concrete improvements (in priority order)

### 5.1 Add a Stop / SessionEnd hook — the highest-leverage change

A memory system that only works when the agent remembers to use it is unreliable
by construction. Wire a hook so the agent cannot end a session with unrecorded
memory. Two variants:

**(a) Reminder (non-blocking, safe default).** On `Stop`, print a checklist to
the transcript so the agent is nudged:

```jsonc
// .claude/settings.json
{
  "hooks": {
    "Stop": [
      {
        "matcher": "",
        "hooks": [
          {
            "type": "command",
            "command": "echo 'MEMORY CHECK: did this turn produce a lesson (index.md), a dead end (graveyard.md), or friction (journal.md)? Record it before ending.' 1>&2"
          }
        ]
      }
    ]
  }
}
```

**(b) Enforcing (blocking).** A `Stop` hook can *prevent* the agent from
stopping by emitting `{"decision":"block","reason":"..."}`, forcing it to run the
memory pass first. Guard against loops with the `stop_hook_active` field the hook
receives on stdin, so it only blocks once per turn. Use a small script:

```jsonc
{
  "hooks": {
    "Stop": [
      { "matcher": "", "hooks": [
        { "type": "command",
          "command": "node harness/scripts/memory-gate.mjs" } ] }
    ]
  }
}
```

where `memory-gate.mjs` reads the transcript path from stdin, checks whether the
last session touched `harness/memory/`, and blocks with a reason if it produced
edits but no memory write. **Recommendation: start with (a)**, upgrade to (b)
only if the reminder proves insufficient — an over-eager blocking hook is
annoying and gets disabled, which is worse than a reminder.

> Note: hook behavior and the exact `Stop`-hook JSON contract should be verified
> against the current Claude Code docs before committing — treat the snippets
> above as the shape, not gospel.

### 5.2 Define mid-session write-triggers, not just "End of Session"

Rewrite the `AGENTS.md` memory section so recording is event-driven. Replace
"append entries at end of session" with an explicit trigger table:

| When this happens… | …write here | Cost |
|---|---|---|
| You get a correction from the user | `index.md` + topic file | 1 topic file |
| You try something and abandon it | `graveyard.md` row (with Recheck-if) | 1 table row |
| You look something up that wasn't documented | `journal.md` line | 1 line |
| You spot a recurring pattern worth a convention | `dream-queue.md` proposal | 1 line |

The key change: **the trigger is the event, not the clock.** "You just abandoned
an approach" is a concrete, recognizable moment; "end of session" is not.

### 5.3 Lower the write cost (templates + a one-liner helper)

Under task pressure, anything that takes more than a few seconds gets skipped.
Reduce friction:

- Keep a **filled example** at the top of each memory file (the templates already
  do this — keep it, don't delete the example when adding real rows).
- Optionally add `harness/scripts/mem.sh` helpers: `mem lesson "<title>"`,
  `mem grave "<route>"`, `mem journal "<line>"` that append a correctly-shaped
  stub the agent then fills. Turns "recall the format" into "fill the blanks."

### 5.4 Reconcile the two stores with one rule

Pick a source-of-truth policy and document it in both `AGENTS.md` and the global
`MEMORY.md`:

> **Rule:** repo/project conventions and dead ends live in `harness/memory/`
> (shared, in git). Personal working preferences and cross-repo facts live in the
> global store. When a fact is repo-specific, the global store holds at most a
> **thin pointer** ("see `harness/memory/` for scraper conventions"), never a
> copy.

This keeps the auto-loaded global store as an *index into* the shared store,
getting both properties: auto-surfaced **and** shared.

### 5.5 Make curation real (the dream-queue)

`harness/dream-queue.md` and `journal.md` only pay off if something periodically
reads them. Add a lightweight cadence:

- Every N sessions (or on demand), run a pass that reads recent `journal.md`
  blocks + all of `harness/memory/`, and reports what recurs, contradicts, or
  went unused → propose merges/promotions into `dream-queue.md`.
- **Never auto-apply** a curation proposal; surface it for accept/reject
  (the harness already states this). The first few passes should be run by hand
  to learn what the corpus actually contains before automating.

### 5.6 Close the audit loop

Use the signals the templates already define:

- A graveyard row's **Sessions** counter rising = the prohibition isn't being
  read → the graveyard isn't being consulted before proposals. That's a process
  failure to fix, not just a number to increment.
- An `index.md` approaching the ~200-line cap = time to merge/retire, not raise
  the cap.
- `dream-queue.md` items that sit for many sessions = either not actually cheap,
  or nobody reads the file.

---

## 6. Suggested rollout order

1. **Now (cheap, high value):** add the §5.1(a) reminder `Stop` hook and the
   §5.2 trigger table in `AGENTS.md`. Together these convert memory from
   pull to push.
2. **Next:** apply the §5.4 two-store reconciliation rule and add the thin
   pointer in the global `MEMORY.md`.
3. **Then:** the §5.3 low-friction helpers, if the reminder alone still leaves
   entries unwritten.
4. **Later / if needed:** upgrade to the §5.1(b) blocking hook, and stand up the
   §5.5 curation cadence once there's enough journal corpus to be worth reading.

---

## 7. Status

- Real entries already recorded this session (proof the store works when used):
  `harness/memory/scraper-dedup-before-save.md` (lesson), the DevTools-MCP row in
  `harness/memory/graveyard.md` (dead end), and a `journal.md` block.
- **Not yet done:** the `Stop` hook (§5.1), the `AGENTS.md` trigger-table rewrite
  (§5.2), the two-store rule (§5.4), and any curation cadence (§5.5).
- This file is standalone under `docs/` by request — not promoted into `harness/`
  and not committed.
