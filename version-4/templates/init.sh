---
type: template
title: "init.sh Verification Template"
description: "Standard startup and verification entrypoint: detects project type, installs dependencies, runs type checks, lint, tests, and build"
artifact: "init.sh"
tags: [verification, init, bootstrap, startup, ci]
---

#!/bin/bash
# Why this structure: This template instantiates patterns from:
# - Lifecycle & Bootstrap (../references/lifecycle-bootstrap-pattern.md) — standard startup entrypoint, fail-fast, clean-state checks
# - Tool Registry & Safety (../references/tool-registry-pattern.md) — verification as a safety gate before claiming done
# - Context Engineering (../references/context-engineering-pattern.md) — progressive disclosure via project type detection
# See templates/index.md for all available templates.
set -e

echo "=== Harness Initialization ==="

# Environment contract runs before anything else and reports separately from test output:
# a missing tool is not a failing test, and conflating the two sends the next session
# debugging code that was never broken. The eval sits inside an `if` so `set -e` does not
# abort on the first unmet requirement — reporting all of them at once beats surfacing
# them one re-run at a time.
# Path is harness/environment.md, not environment.md: init.sh stays at the project root
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

if [ -f package.json ]; then
  if [ -f pnpm-lock.yaml ]; then
    PM="pnpm"
  elif [ -f yarn.lock ]; then
    PM="yarn"
  elif [ -f bun.lock ] || [ -f bun.lockb ]; then
    PM="bun"
  else
    PM="npm"
  fi

  echo "=== Installing dependencies with $PM ==="
  if [ "$PM" = "npm" ]; then
    npm install
  else
    "$PM" install
  fi

  if node -e "const s=require('./package.json').scripts||{}; process.exit(s.check||s.typecheck||s['type-check']?0:1)"; then
    if node -e "const s=require('./package.json').scripts||{}; process.exit(s.check?0:1)"; then
      "$PM" run check
    elif node -e "const s=require('./package.json').scripts||{}; process.exit(s.typecheck?0:1)"; then
      "$PM" run typecheck
    else
      "$PM" run type-check
    fi
  fi

  if node -e "const s=require('./package.json').scripts||{}; process.exit(s.lint?0:1)"; then
    "$PM" run lint
  fi

  if node -e "const s=require('./package.json').scripts||{}; process.exit(s.test?0:1)"; then
    if [ "$PM" = "npm" ]; then npm test; else "$PM" test; fi
  fi

  if node -e "const s=require('./package.json').scripts||{}; process.exit(s.build?0:1)"; then
    "$PM" run build
  fi
elif [ -f pyproject.toml ] || [ -f requirements.txt ]; then
  echo "=== Running Python verification ==="
  PY="$(command -v python3 || command -v python)"
  # pytest exits 5 when no tests are collected — not a failure for a fresh project.
  "$PY" -m pytest || [ $? -eq 5 ]
  # -x skips virtualenvs/build dirs so the syntax check doesn't compile dependencies.
  "$PY" -m compileall -q -x '(^|/)(\.?venv|env|node_modules|build|dist|__pycache__)(/|$)' .
elif [ -f go.mod ]; then
  echo "=== Running Go verification ==="
  go test ./...
elif [ -f Cargo.toml ]; then
  echo "=== Running Rust verification ==="
  cargo test
elif [ -f pom.xml ]; then
  echo "=== Running Maven verification ==="
  mvn test
elif [ -f build.gradle ] || [ -f build.gradle.kts ]; then
  echo "=== Running Gradle verification ==="
  ./gradlew test
elif ls *.csproj *.sln >/dev/null 2>&1; then
  echo "=== Running .NET verification ==="
  dotnet test
else
  echo "No recognized package manifest detected."
  echo "Replace this section with the project's verification commands."
fi

echo "=== Verification Complete ==="
echo ""
echo "Next steps:"
echo "1. Read harness/feature_list.json to see current feature state"
echo "2. Pick ONE unfinished feature to work on"
echo "3. Implement only that feature"
echo "4. Re-run verification before claiming done"
