# Gap Analysis: `harness-creator` skill vs. Google OKF (Open Knowledge Format v0.1)

**Date:** 2026-07-15 (re-run against pulled commit `e72508d` — "OKF-aligned harness overhaul v0.2.0")
**Scope:** The knowledge files of the `harness-creator` skill (`skills/harness-creator/`) measured against Google Cloud's Open Knowledge Format **v0.1** (`GoogleCloudPlatform/knowledge-catalog`, published 12 June 2026). Format/conformance only — RAG and retrieval architecture are out of scope.

> **VERDICT CHANGE:** After the `v0.2.0` overhaul the bundle now **PASSES OKF v0.1 conformance** (was FAIL). All three mandatory conformance criteria are met. Only optional/quality items remain.

---

## 0. What OKF v0.1 requires (baseline)

| OKF term | Definition |
|---|---|
| Knowledge Bundle | Self-contained, hierarchical collection of knowledge docs; the unit of distribution |
| Concept | One markdown document = one unit of knowledge |
| Concept ID | The file's path within the bundle, minus `.md` (e.g. `tables/users.md` → `tables/users`) |
| Frontmatter | YAML block delimited by `---`; **`type` is the only required field**; optional: `title`, `description`, `resource`, `tags`, `timestamp`; unknown keys allowed |
| Links | Ordinary markdown links between concepts → a graph; bundle-relative absolute (`/…`) recommended, relative allowed |
| `index.md` | Reserved file: progressive-disclosure listing (§6) |
| `log.md` | Reserved file: chronological change history (§7) |
| Conformance | (1) every non-reserved `.md` has parseable YAML frontmatter; (2) every frontmatter has a non-empty `type`; (3) reserved files follow their structure |

---

## 1. Which skill files are in scope

| File(s) | OKF role | In the bundle? |
|---|---|---|
| `references/*.md` (7 files) | **Concepts** — the curated knowledge | ✅ Yes — this *is* the bundle |
| `SKILL.md` | Skill loader entry point (frontmatter uses `name`/`license`, not `type`) | ❌ No — not a concept |
| `README.md` | Human-facing docs | ❌ No |
| `templates/*.md` | Scaffold artifacts (emitted into other repos) | ❌ No — output, not knowledge |
| `evals/`, `scripts/`, `agents/openai.yaml` | Tests / tooling / UI metadata | ❌ No |

**The OKF-relevant bundle = the 7 files in `references/`.**

---

## 2. Conformance scorecard (bundle = `references/`) — post-`v0.2.0`

| # | OKF v0.1 requirement | Was (v0.1.x) | Now (v0.2.0) | Meets? | Severity |
|---|---|---|---|---|---|
| 1 | Every non-reserved `.md` has parseable YAML frontmatter | 0 of 7 | **7 of 7** + `index.md` | ✅ **Fixed** | — |
| 2 | Every frontmatter has non-empty `type` | none | **all** (`pattern` ×6, `reference` ×1, `index` ×1) | ✅ **Fixed** | — |
| 3 | Concept ID = path minus `.md` | ✅ | ✅ clean kebab-case | ✅ | — |
| 4 | Concepts cross-link → graph | 6 of 7, `skill-runtime` isolated | **7 of 7 connected** — `skill-runtime` now links to context/lifecycle/gotchas; `gotchas` gained an inbound | ✅ **Fixed** | — |
| 5 | Links resolvable | ✅ | ✅ all resolve | ✅ | — |
| 6 | Bundle-relative absolute links (`/references/…`) recommended | bare relative | **still bare relative** (`memory-persistence-pattern.md`) | ⚠️ Allowed, not preferred | Low |
| 7 | `index.md` reserved listing | absent | **present** (`type: index`, full ToC table) | ✅ **Fixed** | — |
| 8 | `log.md` reserved history (optional) | absent | still absent (git covers it) | ⚠️ Optional | Low |
| 9 | Optional `title`/`description`/`tags`/`timestamp` | none | `title`+`description`+`tags`+**`timestamp`** on all (renamed from non-standard `updated`) | ✅ **Fixed** | — |
| 10 | Git-versioned, diffable, human-owned | ✅ | ✅ | ✅ | — |

**Conformance result: PASS.** All three mandatory criteria met — (1) every non-reserved `.md` has parseable frontmatter, (2) every block has a non-empty `type`, (3) the reserved `index.md` follows §6. Remaining rows (4, 6, 8, 9) are all **optional/quality**, not conformance blockers (OKF consumers MUST tolerate isolated/broken links and missing `log.md`).

---

## 3. Per-file state (post-`v0.2.0`)

| Concept file | `type` | Frontmatter | Cross-links (concept graph) |
|---|---|---|---|
| `context-engineering-pattern.md` | `pattern` | ✅ | ✅ → memory, multi-agent |
| `memory-persistence-pattern.md` | `pattern` | ✅ | ✅ → context, lifecycle |
| `lifecycle-bootstrap-pattern.md` | `pattern` | ✅ | ✅ → tool-registry, memory |
| `multi-agent-pattern.md` | `pattern` | ✅ | ✅ → context, lifecycle |
| `tool-registry-pattern.md` | `pattern` | ✅ | ⚠️ → lifecycle only (thin, out-degree 1) |
| `skill-runtime-pattern.md` | `pattern` | ✅ | ✅ **now connected** → context, lifecycle, gotchas |
| `gotchas.md` | `reference` | ✅ | ✅ hub → all 5 patterns; now has inbound from `skill-runtime` |
| `index.md` (reserved) | `index` | ✅ | lists all 7 concepts |

### Graph observations (after A)
| Observation | Detail | Conformance impact |
|---|---|---|
| Fully connected | Every concept now has ≥1 concept link; `skill-runtime` de-isolated | ✅ resolved |
| Thin node | `tool-registry-pattern.md` links out to only 1 concept | None — quality only, acceptable |
| `gotchas` inbound | Was out-only; now linked from `skill-runtime` | ✅ resolved |

---

## 4. Recommendation status (from the pre-overhaul analysis)

| # | Original recommendation | Status in `v0.2.0` |
|---|---|---|
| 1 | Add `type` + frontmatter to all 7 `references/*.md` | ✅ **Done** (`type`, `title`, `description`, `tags` on all) |
| 2 | Add `references/index.md` reserved listing | ✅ **Done** (`type: index`, full ToC table) |
| 3 | Fix `skill-runtime-pattern.md` isolation; reciprocal `gotchas` links | ✅ **Done** — `skill-runtime` now links to context/lifecycle/gotchas; graph fully connected |
| 4 | Convert links to bundle-relative absolute (`/references/…`) | ❌ **Declined** — would break GitHub/editor rendering & contradict `SKILL.md`; no benefit for a flat bundle (see §5) |
| 5 | (Optional) Add `references/log.md` | ⏸️ **Open** — optional; git covers it |

**Net:** conformance blockers (#1, #2) done; graph (#3) and canonical `timestamp` (#9) now closed too. Only the optional `log.md` remains, plus the deliberately-declined absolute-link change.

## 5. Remaining work — status

| # | Action | Closes | Status |
|---|---|---|---|
| A | `## Related Patterns` in `skill-runtime-pattern.md` (→ context-engineering, lifecycle, gotchas) | Row 4 / isolation | ✅ **Done** — bundle graph now fully connected |
| C | Use OKF-canonical `timestamp` field (renamed from non-standard `updated`) on all 8 files | Row 9 | ✅ **Done** |
| B | Convert links to bundle-relative absolute (`/references/…`) | Row 6 | ❌ **Declined** — see below |
| D | (Optional) Add `references/log.md` change history | Row 8 | ⏸️ **Open** — optional; git already covers it |

### Why B was declined
Bundle-relative absolute links (`/references/foo.md`) would **break rendering** on GitHub and in editors (which resolve `/` against the repo root, not the OKF bundle root), and would be **inconsistent with `SKILL.md`**, which itself uses relative links. Because `references/` is a *flat* bundle (all concepts are siblings), the OKF "survives document moves within a subdirectory" benefit does not apply here. Relative links are explicitly OKF-valid, so converting would be a net regression. Recommend leaving links relative.

### Do NOT
| Anti-recommendation | Why |
|---|---|
| Add `type` to `SKILL.md` | Skill loader entry point, not an OKF concept — `name`/`license` frontmatter is correct |
| Force artificial links to "fix" `skill-runtime` isolation | Add only genuinely meaningful links; OKF tolerates isolated nodes and `index.md` keeps it discoverable |

---

## Sources
- [OKF v0.1 Specification — `GoogleCloudPlatform/knowledge-catalog` (`okf/SPEC.md`)](https://github.com/GoogleCloudPlatform/knowledge-catalog/blob/main/okf/SPEC.md)
- [How the Open Knowledge Format can improve data sharing — Google Cloud Blog](https://cloud.google.com/blog/products/data-analytics/how-the-open-knowledge-format-can-improve-data-sharing/)
- [Google Cloud Introduces Open Knowledge Format (OKF) — MarkTechPost](https://www.marktechpost.com/2026/06/16/google-cloud-introduces-open-knowledge-format-okf-a-vendor-neutral-markdown-spec-for-giving-ai-agents-curated-context/)
