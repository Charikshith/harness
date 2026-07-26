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

> **Why this template**: instantiates the precondition half of the
> [Tool Registry & Safety](../references/tool-registry-pattern.md) pattern. A verification
> gate that assumes its tools exist reports a code failure when a tool is missing, and the
> next session debugs code that was never broken.

| Requirement | Check |
|---|---|
| node >= 20 | `node --version` |
| ffmpeg on PATH | `command -v ffmpeg` |
| DATABASE_URL set | `test -n "$DATABASE_URL"` |

One row per precondition. The Check cell must be a shell command whose **exit code is the
verdict** — no output parsing. Keep it in backticks.

This file is optional. Create it only when the project needs more than the generic
package-manager detection `init.sh` already does. Delete the example rows above; they are
illustrative, not a starting set.
