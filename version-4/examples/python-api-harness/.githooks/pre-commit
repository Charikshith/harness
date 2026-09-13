#!/bin/sh
# Enforces harness/memory/commit-is-not-session-end.md: a commit that changes anything
# outside harness/ must also update harness/progress.md and harness/memory/journal.md in
# the same commit, not afterward. See templates/index.md for what installs this.

staged=$(git diff --cached --name-only --diff-filter=ACMR)

echo "$staged" | grep -qv '^harness/' || exit 0

missing=""
echo "$staged" | grep -q '^harness/progress\.md$' || missing="$missing harness/progress.md"
echo "$staged" | grep -q '^harness/memory/journal\.md$' || missing="$missing harness/memory/journal.md"

if [ -n "$missing" ]; then
  echo "pre-commit: this commit changes project files but is missing:$missing" >&2
  echo "  See harness/memory/commit-is-not-session-end.md" >&2
  echo "  Bypass for non-feature changes: git commit --no-verify" >&2
  exit 1
fi
