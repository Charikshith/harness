---
type: template
title: "Progress Log Template"
description: "Session progress log for agent continuity: current state, done/in-progress/next, blockers, decisions, files modified, evidence"
artifact: "progress.md"
tags: [state, progress, continuity, session, tracking]
---

# Session Progress Log

> **Why this structure**: This template instantiates patterns from:
> - [Memory Persistence](../references/memory-persistence-pattern.md) — appendix/update style, two-step save invariant, bounded index with on-demand topics
> - [Lifecycle & Bootstrap](../references/lifecycle-bootstrap-pattern.md) — end-of-session routine, evidence recording, restart markers
>
> See [templates/index.md](index.md) for all available templates.

## Current State

**Last Updated:** YYYY-MM-DD HH:MM
**Session ID:** [optional]
**Active Feature:** [feat-XXX - Feature Name]

## Status

### What's Done

- [x] [Completed item 1]
- [x] [Completed item 2]

### What's In Progress

- [ ] [Current work item]
  - Details: [specific task]
  - Blockers: [if any]

### What's Next

1. [Next action item]
2. [Following action item]

## Blockers / Risks

- [ ] [Blocker 1]: [description, impact]
- [ ] [Risk 1]: [description, mitigation]

## Decisions Made

- **[Decision 1]**: [description]
  - Context: [why this decision was made]
  - Alternatives considered: [what else was discussed]

## Files Modified This Session

- `path/to/file1.ts` - [brief description of change]
- `path/to/file2.ts` - [brief description of change]

## Evidence of Completion

- [ ] Tests pass: `[command and output]`
- [ ] Type check clean: `[command and output]`
- [ ] Manual verification: `[what was tested]`

## Notes for Next Session

[Free-form notes that will help the next session pick up context]
