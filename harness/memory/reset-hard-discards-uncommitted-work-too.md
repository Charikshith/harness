---
type: memory
title: "git reset --hard discards uncommitted work, not just the target commit"
scope: this repo (harness)
source: 2026-09-13 session, feat-018
---

# `git reset --hard` discards uncommitted work, not just the target commit

The rule: before `git reset --hard <ref>`, check `git status` for uncommitted changes
unrelated to what you're undoing. `--hard` resets HEAD *and* the working tree *and* the
index to `<ref>` — anything sitting uncommitted in the working tree at that moment is
gone, whether or not it has anything to do with the commit(s) being reset away.

**Why:** mid-verification of the feat-018 pre-commit hook, a throwaway test commit was
undone with `git reset --hard HEAD~1`. An unrelated, legitimate edit to `init.sh` — staged
nowhere, just sitting in the working tree — was wiped out along with the test commit. It
was only caught because the harness's own stale-file-on-disk warning fired on the next
read.

**How to apply:** `git status` first. If there's anything uncommitted that isn't part of
what you're intentionally discarding, stash it (`git stash -u`) or commit it before running
`--hard`. If the only thing to undo is a commit and the working tree is otherwise clean,
`--hard` is fine — the risk is specifically uncommitted state colocated with a reset target.
