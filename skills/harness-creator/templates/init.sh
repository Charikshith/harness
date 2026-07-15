#!/bin/bash
set -e

echo "=== Harness Initialization ==="

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
echo "1. Read feature_list.json to see current feature state"
echo "2. Pick ONE unfinished feature to work on"
echo "3. Implement only that feature"
echo "4. Re-run verification before claiming done"
