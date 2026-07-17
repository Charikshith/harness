#!/bin/bash
set -e

echo "=== Harness Initialization ==="

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
echo "1. Read feature_list.json to see current feature state"
echo "2. Pick ONE unfinished feature to work on"
echo "3. Implement only that feature"
echo "4. Re-run verification before claiming done"
