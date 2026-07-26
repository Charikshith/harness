---
type: template
title: "Memory Entry Template"
description: "Shape of a single agent-written lesson: one lesson per file, with a reason and an application rule"
artifact: "memory/<slug>.md"
tags: [memory, learning, lesson, entry, feedback]
---

# {{LESSON_TITLE}}

<!-- One lesson per file. Copy this shape. Keep it short — if it needs scrolling, it is
     probably two lessons. Remember to append a pointer line to memory/index.md; the
     write is not complete until the index knows about it. -->

**Scope:** project | preference | reference
**Learned:** YYYY-MM-DD
**Source:** what happened — a user correction, a failed run, a discovered constraint

## The lesson

One or two sentences, stated as a rule the next session can act on.

**Why:** the reason it is true. A lesson without a reason gets deleted by the next
curation pass, because nobody can tell whether it still applies.

**How to apply:** what to actually do differently next time.

## Not this

<!-- Optional but valuable: the wrong thing that was done before, so the next session
     recognises the mistake rather than re-deriving it. -->

---

<!-- Do NOT record here:
     - anything re-derivable from the codebase (architecture, call graphs, file layout)
     - anything true only for the current conversation
     - status or progress — that belongs in progress.md
     - a preference that applies across all projects — that belongs in the
       user-level memory of your agent runtime, not in this repo -->
