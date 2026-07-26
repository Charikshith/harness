# A synchronous test runner silently passes every async check

**Scope:** any hand-rolled `check(name, fn)` helper in this repo's `*.test.mjs` files.

**Source:** probing `scripts/index-coverage.test.mjs` with a deliberately wrong value, which
it reported as `ok`.

**The rule:** if a runner calls `fn()` without awaiting, an `async` check body turns a failed
assertion into an unhandled rejection. The `try/catch` sees nothing, so the case prints `ok`
regardless of the assertion. The check cannot fail.

**Why:** a check that cannot fail is worse than no check. It reports green forever and it is
counted in the "N checks passed" line, so the coverage looks better than it is.

**How to apply:** keep check bodies synchronous. `check()` in
`version-4/scripts/index-coverage.test.mjs` now throws if `fn()` returns a thenable, so the
mistake fails loudly instead of passing quietly. Copy that guard into any new runner.

**The general lesson, worth more than the specific bug:** after writing a check, break the
thing it watches and confirm the check goes red. Every check added this session was
regression-probed that way, and this is the one that turned out to be decorative. Writing the
check and running the check are different activities.
