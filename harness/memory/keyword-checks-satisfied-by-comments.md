# A keyword check is satisfied by a comment mentioning the keyword

**Scope:** `scoreHarness()` checks in `version-4/scripts/lib/harness-utils.mjs` that use
`textHas` / `structuredHas` against `init.sh` or `AGENTS.md`.

**Source:** the mutation gate. `drop-fail-fast` survived — it removes the real `set -e` line
from `init.sh`, but a comment in the same file explaining the flag still contained the literal
string, so `textHas(init, ['set -e'])` kept passing and the verification score never dropped.

**The rule:** when a check greps a file for a literal, any occurrence counts — including
comments and prose. Do not write the literal a check greps for into a comment in the same file.

**Why:** the check silently stops measuring the thing it names. Nothing fails; the gate just
becomes decorative for that property. This was invisible until an adversary deleted the real
line and asked whether anything noticed.

**How to apply:** in `init.sh`, refer to the behaviour by name ("fail-fast") rather than the
flag. More generally, prefer a check that inspects structure over one that greps for
vocabulary — `entrypointExecutesSomething()` reads which lines are commands, and cannot be
satisfied by prose. The keyword checks that remain are documented as vocabulary-sensitive in
the components deck, which is honest but not a fix.

**Related:** [[async-check-cannot-fail]] — same family. Both are checks that report green
while measuring nothing, and both were only found by breaking the thing on purpose.
