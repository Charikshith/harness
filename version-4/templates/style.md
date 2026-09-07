---
type: template
title: "Output Style Template"
description: "Talk rules for how the agent replies in this project — tone, format, structure. Read at startup and followed for every reply, so the behavior works even outside runtimes with a native output-style setting"
artifact: "harness/style.md"
tags: [style, communication, tone, format]
---

# Output Style

Rules for how the agent talks in this project. Edit or delete this file to change the rules.

> **Why this template**: some agent runtimes have a built-in output-style setting; most do
> not. This file makes the same behavior portable — any agent that reads `AGENTS.md` picks
> up these rules too, not just runtimes with native support.

## Rules

- Keep it simple. Use plain words and short sentences.
- One idea per sentence. One instruction per step.
- If a hard word is needed, explain it right after.
- Only say what is necessary. Skip filler.
- Report results plainly: what was done, did it work, what to do next.
- If a decision is needed: give 2 options max, the reason to pick fast, and a pick.
- Keep paths and commands exact — never paraphrase them.
