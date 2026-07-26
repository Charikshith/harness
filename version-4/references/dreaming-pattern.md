---
type: pattern
title: "Dreaming (Out-of-Band Memory Curation) Pattern"
description: "Batch curation of the memory store between sessions: threshold-gated proposals with evidence, propose-never-apply, bounded review queue, and cadence sized to pattern emergence"
tags: [memory, dreaming, curation, staleness, review, out-of-band, session-continuity]
timestamp: 2026-07-26
---

# Dreaming (Out-of-Band Memory Curation) Pattern

## Problem

An agent writing memory *while* working has two structural limits that no amount of
better in-session instruction fixes:

1. **Split focus.** The agent is asked to finish a task and simultaneously invest in
   memory curation that only helps a future run. How much capacity should it spend
   helping later versions of itself? It is an unresolvable optimisation mid-task.
2. **Single-session visibility.** An agent sees only its own session. It cannot know
   that the same correction has now been made four times, because each session starts
   with a fresh context window.

The result is a memory store that grows but does not improve: duplicates that
disagree, lessons nobody used, and entries that were true in session three and
misleading by session forty.

## Golden Rules

### Curation runs out of band, with its own budget

Dreaming is a **second-order process**: it operates on memory, not on the task. It runs
between sessions, in batch, so it never competes with task work for attention or budget.

### Propose, never apply

A curation pass produces **proposals**, not edits. The store is changed only by a human
accepting a proposal. This is the single most important rule — an unattended process with
write access to the instruction layer can silently move the bar it is judged against.

### Every proposal carries evidence and prevalence

A proposal without a citation is an opinion. Each one names:

- the **claim** (what should change)
- the **evidence** (which sessions or files show it)
- the **prevalence** (how many times it occurred)

Prevalence is what separates a real pattern from a single bad session.

### Cadence is sized to pattern emergence, not to the clock

A pattern needs enough sessions to *become* a pattern. Running curation after every
session produces noise and trains the reviewer to rubber-stamp. **Every ~10 sessions, or
weekly**, is the honest starting point.

### The queue is bounded, or review collapses

Review fatigue is the dominant failure mode. An unbounded proposal queue becomes a thing
the human clears reflexively, at which point the human gate is nominal and the design has
bought unattended writes with a rubber stamp attached. Cap the queue; make volume the
proposer's problem.

### Never touch the instruction layer

Dreaming curates the **agent-written** layer (`memory/`). It may *suggest* an edit to
`AGENTS.md`, but it never writes there. The human-curated instruction layer stays
human-curated.

## The five things a curation pass looks for

| Signal | What it means | Proposal |
|---|---|---|
| The same correction recurs across sessions | A lesson is missing | Add it |
| Two lessons disagree | Two live authorities on one question | Demote or supersede one |
| A lesson nothing has referenced | Dead stock | Delete it |
| A lesson contradicted by current reality | Stale — confidently wrong | Correct or retire it |
| A graveyard route resurfaces in the journal | **Reconsidered** — the prohibition isn't being read, or its `Recheck-if` has quietly come true | Raise the row's `Sessions` count, or retire the verdict if the condition now holds |

The fifth signal is the only one that reads `memory/graveyard.md` rather than the lesson
store. It catches two different failures with one observation: a rejection nobody consults
(so the cost gets paid again), and a rejection that expired without anyone noticing (so a
now-viable route stays closed). A rising `Sessions` count with no `Recheck-if` change is
the first case; a `Recheck-if` condition that now holds is the second.

## When To Use

- The memory store has grown past what a person will read in one sitting
- The same correction keeps recurring despite memory being "on"
- Entries have started to contradict each other
- Sessions are numerous enough for cross-session patterns to exist (roughly 10+)

**Do not** add dreaming before there is a memory store worth curating. Accumulate first,
deliberately let it get messy, and let the mess tell you which rules you actually need.

## Tradeoffs

| Decision | Benefit | Cost |
|---|---|---|
| Out-of-band batch | No latency or budget contention with task work | Improvements land next cycle, not next session |
| Propose-never-apply | Human keeps authority; bad proposals are cheap | Requires sustained review attention |
| Threshold-gated proposals | Short queue; only real patterns surface | Slow-burning issues below threshold stay invisible |
| Bounded queue | Review fatigue bounded by construction | Proposer must self-triage and may drop something good |
| Manual pass before automation | Learn which rules matter before encoding them | No leverage until it is automated |

## Implementation Patterns

1. **Start manual.** Open a session and ask it to read recent progress entries plus the
   whole memory store and report what repeats, contradicts, and went unused. That pass
   *is* dreaming. Automate only after seeing what it finds.
2. **Write proposals to a queue file** (`dream-queue.md`) with an explicit disposition
   column, so an un-actioned proposal is visibly un-actioned.
3. **Drain the queue at session start**, before new feature work. The session boundary is
   a natural batch boundary and needs no scheduler.
4. **Prefer a threshold to a judgement** once automated: propose only when a signal
   crosses a bar (recurred N times). A counter cannot be argued into a proposal, which
   also removes the injection surface a model-authored pass would have.
5. **Record rejections durably.** Without them the same proposal returns every cycle and
   the reviewer has no record of having already said no.
6. **Keep the diff small.** A pass proposing thirty changes will not be reviewed.

## Gotchas

1. **Rubber-stamping is invisible.** A drained queue and a considered queue look
   identical afterwards. Prefer a short queue over an enforcement mechanism.
2. **Cadence too fast produces noise** — and noise trains the reviewer to skim.
3. **Prevalence measures reporting, not reality.** If sessions under-report problems,
   prevalence quietly measures reporting discipline instead of memory quality.
4. **A merged proposal can smuggle.** "Merge to fit the cap" can become stapling
   unrelated asks into one file that is technically within budget and practically
   unreviewable. Cap review *length*, not file count.
5. **Deleting a wrong memory destroys the evidence.** Retire with a reason instead; the
   wrong entry is the primary record of how far it propagated.
6. **Curating too early wastes the pass.** With five lessons there is nothing to find.

## Related Patterns

- [Memory Persistence](memory-persistence-pattern.md) — the store this pattern curates:
  layers, two-step save, bounded index
- [Context Engineering](context-engineering-pattern.md) — why the index stays bounded
- [Lifecycle & Bootstrap](lifecycle-bootstrap-pattern.md) — draining the queue at startup
- [Multi-Agent Coordination](multi-agent-pattern.md) — fanning a curation pass across
  many transcripts once volume justifies it

## Evidence

The in-band limits described here (split focus, single-session visibility) and the
out-of-band batch response are drawn from production agent memory systems, where a
curation pass is given its own token budget, reviews session transcripts *including
tool-call metadata*, and returns human-gated proposals carrying example transcripts and
prevalence statistics. Deliberately left open in that prior art, and therefore treated as
design decisions here rather than settled practice: batch cadence, conflict resolution
when a proposal contradicts a human-authored memory, defence against injected content
beyond scope permissions, and review fatigue as proposal volume grows.
