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

  echo "=== Type checking ==="
  node -e "const s=require('./package.json').scripts||{}; process.exit(s.typecheck||s['type-check']?0:1)" && {
    if node -e "const s=require('./package.json').scripts||{}; process.exit(s.typecheck?0:1)"; then
      [ "$PM" = "npm" ] && npm run typecheck || "$PM" run typecheck
    else
      [ "$PM" = "npm" ] && npm run type-check || "$PM" run type-check
    fi
  }

  echo "=== Linting ==="
  node -e "const s=require('./package.json').scripts||{}; process.exit(s.lint?0:1)" && {
    [ "$PM" = "npm" ] && npm run lint || "$PM" run lint
  }

  echo "=== Running tests ==="
  node -e "const s=require('./package.json').scripts||{}; process.exit(s.test?0:1)" && {
    [ "$PM" = "npm" ] && npm test || "$PM" test
  }

  echo "=== Building ==="
  node -e "const s=require('./package.json').scripts||{}; process.exit(s.build?0:1)" && {
    [ "$PM" = "npm" ] && npm run build || "$PM" run build
  }
else
  echo "No package.json found. Skipping Node.js verification."
fi

echo "=== Verification Complete ==="
echo ""
echo "Next steps:"
echo "1. Read harness/feature_list.json to see current feature state"
echo "2. Pick ONE unfinished feature to work on"
echo "3. Implement only that feature"
echo "4. Re-run verification before claiming done"
