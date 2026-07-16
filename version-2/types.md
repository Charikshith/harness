---
type: reference
title: "Document Type Taxonomy"
description: "Valid types for harness-creator documents and what they mean"
tags: [types, taxonomy, metadata]
updated: 2026-07-15
---

# Document Types

Every file in this skill carries a `type` field in its YAML frontmatter. When an agent needs to find content, it reads the index first, checks the type and tags, then opens only the relevant files.

| Type | Icon | Meaning | Example |
|---|---|---|---|
| `pattern` | 📐 | A design pattern: problem → rules → tradeoffs → implementation → gotchas | `memory-persistence-pattern.md` |
| `template` | 📋 | Copyable artifact: instantiated with replacements into a target project | `agents.md` |
| `script` | ⚙️ | Executable helper: documented CLI, pure Node.js built-ins | `create-harness.mjs` |
| `eval` | ✅ | Test case: prompt + expected output + assertions | `evals.json` |
| `instruction` | 📖 | Agent-facing procedural doc: the "how to use this skill" entry point | `SKILL.md` |
| `reference` | 📚 | Supplementary factual material | `gotchas.md` |
| `index` | 🗂️ | Table of contents for a directory | `references/index.md` |
| `changelog` | 📝 | Reverse-chronological change history | `CHANGELOG.md` |

## Rules

- The `type` field is the **only required field** in frontmatter.
- Recommended fields: `title`, `description`, `tags`, `updated`.
- Custom keys are tolerated — consumers must preserve unknown fields.
- An agent should read the index first, match type + tags, then open only the relevant files.
