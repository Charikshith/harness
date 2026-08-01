# Findings — gaps, gotchas & non-obvious limitations

Non-obvious findings gathered while building the USA scrapers and working the
harness. Each is a place where a design assumes something that doesn't reliably
hold, or a real snag we hit. Status legend:

- **recorded** — already captured in `harness/memory/` or `CLAUDE.md`
- **caught** — hit and handled this session, but the *finding* isn't stored yet
- **open** — a real limitation with no fix yet

_Last updated: 2026-08-01._

---

## A. Agent / harness lifecycle gaps

### A1. Session-end isn't reliably detectable — _open_
There's no event that tells the agent "the session is over," so the
`AGENTS.md` End-of-Session routine is **best-effort**, not guaranteed. If the
user closes the terminal or walks away, the agent never gets a turn to run it.
**Why it matters:** progress/journal/handoff updates can be missed.
**Mitigation:** flush durable state at natural milestones (not only at the end);
treat every safe stopping point as if it might be the last. A `SessionEnd`/`Stop`
hook would make it deterministic.

### A2. Repo harness memory isn't auto-loaded — _open_
Unlike the personal `~/.claude` auto-memory (always injected as recall),
`harness/memory/` only surfaces if a session actually follows `AGENTS.md`
startup step 6. A convention relocated into the repo is invisible to any session
that skips startup.
**Why it matters:** shareability (teammates, CI, other machines) is gained, but
always-on recall is lost. **Mitigation:** keep the repo copy as source of truth;
optionally leave a thin pointer in the global store so it still auto-surfaces.

### A3. Template placeholders look like real data — _caught_
The shipped `graveyard.md` / `journal.md` came with fake rows (e.g.
`date-fns-tz`) that read like genuine findings.
**Why it matters:** placeholder content can be mistaken for a real verdict, or
left in indefinitely. **Mitigation:** replace or delete placeholder rows on
first real use (done for both files).

---

## B. Operational gotchas we actually hit

### B1. Force-killing a running scraper leaks the Micromedex license seat — _recorded_
`micromedex-license-concurrent-user-cap`. The seat is held until a ~15-min
idle timeout, during which every run lands on the "maximum number of users"
page and returns 0 rows. **Rule:** never force-kill a USA scraper — let it reach
its own session-scoped logout.

### B2. State/memory files are a secret-leak vector — _caught_
`harness/progress.md` literally contained live credentials (`ACCINF`/`AI@2022`);
only a pre-commit `grep` stopped them entering git.
**Why it matters:** secret-scanning must cover state/docs/memory, not just code.
**Mitigation:** scan the staged diff for known secret tokens before every commit.

### B3. Don't trust compressed tool output for integrity checks — _caught_
Proxy-compressed `git log` surfaced a commit in a way that looked unfamiliar and
made history hard to read; a raw re-run was needed to verify.
**Why it matters:** integrity-sensitive checks (history, diffs, staged content)
need the raw command. **Mitigation:** re-run raw when anything about state looks
off.

### B4. Chrome DevTools MCP drives headed Chrome only — _recorded_
In `graveyard.md`. It cannot reproduce a headless-specific failure; an
instrumented headless Playwright probe (screenshot + DOM dump) is the right tool.

### B5. PowerShell 5.1 traps — _caught_
- A `Where-Object` / `Stop-Process` filter can match its **own** command line and
  kill its own shell (exit 255).
- `Invoke-RestMethod` has no `-Form`; use `curl.exe` for multipart uploads.
- Foreground `sleep`/chained sleeps are blocked; use a Bash until-loop to wait.

---

## C. Latent repo gaps (from CLAUDE.md + code)

### C1. Single-instance dispatcher assumption — _open_
The dispatcher runs in-process, so multiple uvicorn workers/instances would each
run a dispatcher and race on the shared DB. Documented in `CLAUDE.md`.

### C2. Transient `failed` status — _open_
The reconciler can mark a healthy in-flight task `failed`; it self-heals to
`completed` when the worker persists at the end (no data loss). Root cause
unresolved (`_phantom_failure_detail` is a partial mitigation).

### C3. PRICE_ID-as-integer gotcha may be documentation drift — _open, needs check_
`CLAUDE.md` / feat-005 list "PRICE_ID persisted as integer" as open, but
`api.py:123` already reads the persist file with `dtype=str`, and the input read
at `api.py:433` also uses `dtype=str`. **Action:** verify end-to-end whether a
non-USA country still loses leading zeros, then either close feat-005 or correct
the doc. Related convention: `harness/memory/scraper-string-columns.md`.

---

## Related conventions already recorded

- `harness/memory/scraper-dedup-before-save.md` — dedup output before save.
- `harness/memory/scraper-string-columns.md` — all output columns as strings.
- `harness/memory/micromedex-license-concurrent-user-cap.md` (personal store) —
  license seat handling.

## Suggested next actions

- Capture the _caught_-but-unstored findings (A1, A2, B2, B3, B5) into
  `harness/memory/` so they travel with the repo.
- Verify **C3** to settle whether feat-005 is real or stale.
- Consider a `SessionEnd`/`Stop` hook to make the End-of-Session routine
  deterministic (fixes A1).
