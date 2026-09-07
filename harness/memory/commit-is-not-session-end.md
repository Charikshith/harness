---
type: memory
title: "Committing a feature is not the same as ending the session"
scope: this repo (harness)
source: 2026-09-07 session, feat-015 + feat-016
---

# Committing a feature is not the same as ending the session

The rule: after `git commit`, immediately update `harness/progress.md` and append a
dated block to `harness/memory/journal.md` — before moving to the next task, not at
some later "end of session" checkpoint.

**Why:** feat-015 and feat-016 were both committed in the same session, but
`progress.md` and `journal.md` were left showing 2026-08-29 (feat-014) as the latest
state. Nobody caught it until the user asked "what else do we need" afterward. The
commit felt like a natural stopping point, so the End of Session checklist in
`AGENTS.md` got silently skipped twice in a row.

**How to apply:** treat every `git commit` as a trigger for the End of Session
checklist's two writes (progress.md, journal.md), not just the last commit of a
session. A session that ships three small features needs three progress.md updates
and three journal entries, not one summary written at the very end.
