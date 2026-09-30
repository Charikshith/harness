# Spec-Driven Development vs. Our Harness

**Date:** 2026-09-30
**Status:** Proposal. Not built yet. No change to `AGENTS.md`, `feature_list.json`, or the validator.
**Scope:** How spec-driven development (SDD) compares to this harness, and a light way to combine them.

---

## 1. The difference

| | Spec-driven development | Our harness |
|---|---|---|
| Answers | **What** to build | **How** the agent works |
| Lifetime | One feature, then done | Every session, always |
| Shape | A line: spec → plan → tasks → code | A loop: read memory → work → write memory |
| Main artifact | A spec document per feature | `AGENTS.md`, `harness/feature_list.json`, `harness/progress.md`, `harness/memory/` |

Easy picture: the spec is the recipe for one cake. The harness is the kitchen rules.
A good recipe does not help if the cook forgets things. Good kitchen rules do not say which cake to make.

```
   SPEC-DRIVEN DEVELOPMENT             OUR HARNESS
   (one feature, then done)            (every session, forever)
   ========================            ========================

   Idea / request                      New session starts
        |                                   |
        v                                   v
   Write the SPEC                      Read AGENTS.md, run ./init.sh
   (what + why, rules,                 (repo healthy? fix first)
    acceptance tests)                       |
        |                                   v
        v                              Read memory: feature_list.json,
   Human reviews spec                  memory/index.md, git log -5
        |                                   |
        v                                   v
   Technical PLAN                      Pick ONE feature
        |                              1 line: meaning, in / out scope
        v                                   |
   Break into TASKS                         v
        |                              Short PLAN + flow, human says OK
        v                                   |
   Agent writes code                        v
        |                              Test FIRST, code (Ponytail)
        v                                   |
   Check code vs spec                       v
        |                              Definition of Done gate
        v                              (tests ran, scope trace, hook)
   DONE (spec stays as doc)                 |
                                            v
                                       Save progress.md, feature_list.json,
                                       lessons -> memory/, commit
                                            |
                                            +----> next session (back to top)
```

---

## 2. The gap

The harness already has half of SDD: the plan step, the scope lines, and test-first.
Two parts are missing:

1. **No step before a feature exists.** Features just appear in `feature_list.json`.
   The talk that made them happens in chat, and then it is lost.
2. **"Done" is written after the work.** The `evidence` field is filled at the end.
   Nothing says what "done" means before the work starts.

---

## 3. Design choice

| Option | What it adds | Good | Bad |
|---|---|---|---|
| **A. Light spec (picked)** | An `acceptance` list on each feature in `feature_list.json`, written before code. A Shape step before a feature is created. | No new files. Small diff. Low reading cost each session. | Not enough alone for a very big feature. |
| B. Full spec file | `harness/specs/feat-XXX.md` per feature (requirements, design, tasks) and a spec gate before the plan. | Strong for big or risky features. | More files and reading. Repeats the plan block in `AGENTS.md`. |

**Pick: A.** It fixes the real gap. Add B later, and only if a big feature fails because A was not enough.

---

## 4. How an idea becomes a feature

```
  IDEAS COME FROM: you, a bug, open-work.md, gaps/ findings
        |
        v
  1. CAPTURE   one line in harness/open-work.md. No talk yet.
        |
        v
  2. SHAPE     you + the agent answer 5 questions:
               a. Problem: who hurts, and what proof?
               b. Must it exist? (Ponytail rung 1) Does something already do it?
               c. Smallest fix that works?
               d. Done means: 2-4 testable checks  -> "acceptance"
               e. Out of scope: what we will NOT build
        |
        v
  3. DECIDE    only the human decides
        |
     +--+-----------+-------------+
     |              |             |
    GO           NOT NOW          NO
     |              |             |
  feature_list   stays in      harness/memory/graveyard.md
  .json: new     open-work.md  (one line: why no, so it is
  feat-XXX +                    not suggested again)
  acceptance
     |
     v
  Normal harness loop
```

- Most bad ideas die at question **a** or **b**. That costs nothing.
- The agent can suggest a feature. It never adds one by itself. This is the same rule `harness/dream-queue.md` uses.

---

## 5. Before and after

`[NEW]` marks new steps. All other steps stay the same.

```
        BEFORE (now)                        AFTER (combined)
        ============                        ================

                                     [NEW] Idea -> 1 line in open-work.md
                                                    |
                                                    v
                                     [NEW] Shape: 5 questions (a-e)
                                                    |
                                                    v
                                     [NEW] You decide
                                       GO / NOT NOW / NO (graveyard)
                                                    | GO
Feature just appears in                             v
feature_list.json                    Feature in feature_list.json
(talk is lost in chat)               [NEW] with "acceptance" list
               |                                    |
               v                                    v
Session starts                       Session starts
AGENTS.md -> ./init.sh               AGENTS.md -> ./init.sh
read memory, git log                 read memory, git log
               |                                    |
               v                                    v
Pick ONE feature                     Pick ONE feature
1 line: meaning, scope               1 line: meaning, scope
               |                                    |
               v                                    v
Plan -> you say OK                   Plan + acceptance list -> you say OK
               |                                    |
               v                                    v
Test FIRST -> code                   Test FIRST [NEW] 1 test per
                                     acceptance item -> code
               |                                    |
               v                                    v
Done gate                            Done gate
tests ran, scope trace               tests ran, scope trace
evidence written AFTER               [NEW] evidence answers each
                                     acceptance item
               |                                    |
               v                                    v
Save progress, memory                Save progress, memory
commit -> next session               commit -> next session
```

- **Before:** "done" is decided at the end. The feature talk is lost.
- **After:** "done" is decided at the start. The talk goes into the acceptance list. Each "no" is kept in `graveyard.md`.

---

## 6. What would change if built

- `AGENTS.md`: a Shape step for new features, one line in the plan section, one line in Definition of Done.
- `harness/feature_list.json`: a new `acceptance` field.
- `validate-harness.mjs`: one check. A feature that is not done must have an `acceptance` list.
- `version-4/`: the same changes, so new projects get them.

Other skills (for example an ideation skill) should be **linked** from the Shape step
("if skill X is installed, use it"), not copied in. This is the same pattern `AGENTS.md` uses for Ponytail.
