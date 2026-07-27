#!/bin/bash
set -e

echo "=== Harness Initialization ==="

# Environment contract runs before anything else and reports separately from test output:
# a missing tool is not a failing test, and conflating the two sends the next session
# debugging code that was never broken.
#
# Path is harness/environment.md, not environment.md: init.sh stays at the project
# root because it is invoked as ./init.sh, but the contract it reads is harness state.
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

PY="$(command -v python3 || command -v python)"

if [ -f pyproject.toml ] || [ -f requirements.txt ]; then
  echo "=== Installing dependencies ==="
  if [ -f pyproject.toml ]; then
    "$PY" -m pip install -e ".[dev]"
  elif [ -f requirements.txt ]; then
    "$PY" -m pip install -r requirements.txt
  fi

  echo "=== Running tests ==="
  # pytest exits 5 when no tests are collected — not a failure for a fresh project.
  "$PY" -m pytest || [ $? -eq 5 ]

  echo "=== Syntax check ==="
  # -x skips virtualenvs/build dirs so the syntax check doesn't compile dependencies.
  "$PY" -m compileall -q -x '(^|/)(\.?venv|env|node_modules|build|dist|__pycache__)(/|$)' .

  echo "=== Type checking ==="
  if "$PY" -c "import mypy" 2>/dev/null; then
    "$PY" -m mypy src/ --ignore-missing-imports
  else
    echo "mypy not installed — skipping type check"
  fi
else
  echo "No Python manifest detected."
  echo "Replace this section with the project's verification commands."
fi

echo "=== Verification Complete ==="
echo ""
echo "Next steps:"
echo "1. Read harness/feature_list.json to see current feature state"
echo "2. Pick ONE unfinished feature to work on"
echo "3. Implement only that feature"
echo "4. Re-run verification before claiming done"
