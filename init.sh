#!/bin/bash
set -e

echo "=== Harness Initialization ==="

# Environment contract runs before anything else and reports separately from test output:
# a missing tool is not a failing test, and conflating the two sends the next session
# debugging code that was never broken. The eval sits inside an `if` so fail-fast does
# not abort on the first unmet requirement — reporting all of them at once beats surfacing
# them one re-run at a time.
#
# Do not write the fail-fast flag literally in these comments: the validator greps init.sh
# for it, so a mention in a comment keeps that check passing after the real line is gone.
#
# Path is harness/environment.md, not environment.md: this script stays at the project root
# because it is invoked as ./init.sh, but the contract it reads is harness state.
ENV_CONTRACT="harness/environment.md"
if [ -f "$ENV_CONTRACT" ]; then
  echo "=== Environment contract ==="
  ENV_FAILED=0
  while IFS='|' read -r _ requirement check _; do
    requirement="$(echo "$requirement" | sed 's/^ *//;s/ *$//')"
    check="$(echo "$check" | sed 's/^ *//;s/ *$//;s/^`//;s/`$//')"
    case "$requirement" in ''|Requirement|---*) continue ;; esac
    [ -z "$check" ] && continue
    if eval "$check" >/dev/null 2>&1; then
      echo "  PASS  $requirement"
    else
      echo "  FAIL  $requirement   (check: $check)"
      ENV_FAILED=$((ENV_FAILED + 1))
    fi
  done < "$ENV_CONTRACT"
  if [ "$ENV_FAILED" -gt 0 ]; then
    echo "Environment contract failed ($ENV_FAILED unmet). This is the machine, not the code."
    exit 1
  fi
fi

# This repo has no package manifest — it ships a skill, not an application. So the gate is
# the two things that can actually regress: the scripts must parse, and the bundled examples
# must still score 100. Both are real: breaking either fails here.
echo "=== node --check (all skill scripts) ==="
for script in version-3.1/scripts/*.mjs version-3.1/scripts/lib/*.mjs; do
  node --check "$script"
  echo "  ok $script"
done

echo "=== bundled examples still score 100 ==="
for example in version-3.1/examples/*/; do
  node version-3.1/scripts/validate-harness.mjs --target "$example" --min-score 100 >/dev/null
  echo "  ok $example"
done

echo "=== Verification Complete ==="
echo ""
echo "Next steps:"
echo "1. Read harness/feature_list.json to see current feature state"
echo "2. Pick ONE unfinished feature to work on"
echo "3. Implement only that feature"
echo "4. Re-run verification before claiming done"
