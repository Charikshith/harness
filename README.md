# harness

Build and audit harnesses that make AI coding agents reliable.

## Install

```bash
npx skills add Charikshith/harness --skill harness-creator
```

## Use

```bash
# Create a harness for a project
node skills/harness-creator/scripts/create-harness.mjs --target /path/to/project

# Validate an existing harness
node skills/harness-creator/scripts/validate-harness.mjs --target /path/to/project

# Generate a benchmark report
node skills/harness-creator/scripts/run-benchmark.mjs --target /path/to/project --html /path/to/report.html
```

## What It Creates

- `AGENTS.md` or `CLAUDE.md`
- `feature_list.json`
- `progress.md`
- `init.sh`
- `session-handoff.md`

## What It Checks

1. **Instructions** — Startup path, working rules, definition of done
2. **State** — Current feature, status, evidence, next step
3. **Verification** — Tests/checks the agent must run before claiming done
4. **Scope** — Prevents overreach and half-finished work
5. **Lifecycle** — Makes the next session restartable

## License

MIT
