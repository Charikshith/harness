#!/usr/bin/env node
import path from 'node:path';
import { mkdir } from 'node:fs/promises';
import {
  loadHarnessFiles,
  parseArgs,
  scoreHarness,
  usabilityTierLabel,
  writeText
} from './lib/harness-utils.mjs';

// Gap-to-fix mapping table — maps validation check messages to canonical fixes.
const GAP_FIXES = {
  // === Structural: Instructions ===
  'Agent instruction file exists': {
    template: 'agents.md',
    defaultPath: 'AGENTS.md',
    sectionName: 'AGENTS.md',
    replacements: {
      AGENT_FILE_NAME: 'AGENTS.md',
      PROJECT_PURPOSE: 'Project harness for reliable agent-assisted development.',
      VERIFICATION_COMMANDS: '- `echo "Replace with your project verification command."`',
      PRIMARY_VERIFICATION_COMMAND: './init.sh'
    }
  },
  'Startup workflow documented': {
    targetFile: 'AGENTS.md',
    insertAfter: '# AGENTS.md',
    sectionName: 'Startup Workflow',
    snippet: `

## Startup Workflow

Before writing code:

1. **Confirm working directory** with \`pwd\`
2. **Read this file** completely
3. **Read project docs if present** (\`docs/ARCHITECTURE.md\`, \`docs/PRODUCT.md\`, README, or equivalent)
4. **Run \`./init.sh\`** to verify environment is healthy
5. **Read \`feature_list.json\`** to see current feature state
6. **Review recent commits** with \`git log --oneline -5\`
7. **State your understanding**: In one line, what the task requires.
   If multiple interpretations exist, name them. If the ambiguity is structural
   (architecture, data model, security boundary, multi-module interaction),
   **stop and ask**. Otherwise default and proceed, naming your assumption.

If baseline verification is failing, repair that first before adding new scope.
`
  },
  'Definition of done documented': {
    targetFile: 'AGENTS.md',
    insertAfter: '## Working Rules',
    sectionName: 'Definition of Done',
    snippet: `

## Definition of Done

A feature is done only when ALL of the following are true:

- [ ] Target behavior is implemented
- [ ] For bugs: a reproduction test was written FIRST, then made to pass
- [ ] For features: a verification check was written FIRST, then the code
- [ ] Required verification actually ran and passed (tests / lint / type-check)
- [ ] Evidence recorded in \`feature_list.json\` or \`progress.md\`
- [ ] Repository remains restartable from standard startup path
- [ ] **Scope trace passed**: every changed line maps to the named feature; no
      bonus flags / commands / modes / abstractions were added (see Working Rules)
`
  },
  'Verification commands discoverable': {
    targetFile: 'AGENTS.md',
    insertAfter: '## Definition of Done',
    sectionName: 'Verification Commands',
    snippet: `

## Verification Commands

\`\`\`bash
# Full verification (recommended)
./init.sh
\`\`\`

Required checks:
- \`echo "Replace with your project verification command."\`
`
  },
  'State artifacts routed from instructions': {
    targetFile: 'AGENTS.md',
    insertAfter: '## Working Rules',
    sectionName: 'Required Artifacts',
    snippet: `

## Required Artifacts

- \`feature_list.json\` — Feature state tracker (source of truth)
- \`progress.md\` — Session continuity log
- \`init.sh\` — Standard startup and verification path
- \`session-handoff.md\` — Optional, for larger sessions
`
  },

  // === Structural: State ===
  'Feature tracker exists': {
    template: 'feature-list.json',
    defaultPath: 'feature_list.json',
    sectionName: 'feature_list.json'
  },
  'Feature tracker is valid and has feature fields': {},
  'Progress log exists': {
    template: 'progress.md',
    defaultPath: 'progress.md',
    sectionName: 'progress.md'
  },
  'Progress log supports restart': {
    targetFile: 'progress.md',
    insertAfter: '# Session Progress Log',
    sectionName: 'Progress sections',
    snippet: `

## Current State

**Last Updated:** YYYY-MM-DD HH:MM
**Session ID:** [optional]
**Active Feature:** [feat-XXX - Feature Name]

## Status

### What's Done

- [x] [Completed item 1]

### What's In Progress

- [ ] [Current work item]

### What's Next (with verification per step)

1. [Step description] → verify: [specific check]
`
  },
  'Handoff captures blockers/files/next step': {
    targetFile: 'session-handoff.md',
    insertAfter: '# Session Handoff',
    sectionName: 'Handoff sections',
    snippet: `

## Current Objective

- Goal:
- Current status:
- Branch / commit:

## Completed This Session

- [ ]

## Verification Evidence

| Check | Command | Result | Notes |
|---|---|---|---|

## Files Changed

-

## Decisions Made

-

## Blockers / Risks

-

## Next Session Startup

1. Read \`AGENTS.md\`.
2. Read \`feature_list.json\` and \`progress.md\`.
3. Review this handoff.
4. Run \`./init.sh\` before editing.

## Recommended Next Step

-
`
  },

  // === Structural: Verification ===
  'Verification entrypoint exists': {
    template: 'init.sh',
    defaultPath: 'init.sh',
    sectionName: 'init.sh'
  },
  'Verification fails fast': {
    targetFile: 'init.sh',
    insertAfter: '#!/bin/bash',
    sectionName: 'set -e',
    snippet: 'set -e\n'
  },
  'Test command documented': {
    targetFile: 'AGENTS.md',
    insertAfter: '## Verification Commands',
    sectionName: 'Test command',
    snippet: `
- \`echo "Add your test command here (e.g., npm test, pytest, go test)"\`
`
  },
  'Static/build check documented': {
    targetFile: 'AGENTS.md',
    insertAfter: '## Verification Commands',
    sectionName: 'Static check',
    snippet: `
- \`echo "Add your static check command here (e.g., npm run typecheck, tsc --noEmit)"\`
`
  },
  'Verification evidence is recorded': {},

  // === Structural: Scope ===
  'One-feature-at-a-time rule exists': {
    targetFile: 'AGENTS.md',
    insertAfter: '## Working Rules',
    sectionName: 'One-feature-at-a-time rule',
    snippet: `
- **One feature at a time**: Pick exactly one unfinished feature from \`feature_list.json\`
`
  },
  'Feature dependencies are tracked': {},
  'Feature status is explicit': {},
  'Scope boundary documented': {
    targetFile: 'AGENTS.md',
    insertAfter: '## Working Rules',
    sectionName: 'Scope boundary',
    snippet: `
- **Stay in scope**: Don't modify files unrelated to the current feature
- **No bonus surface**: Build only what the request names. Do NOT add new CLI flags,
  commands, modes, config keys, or abstractions beyond the stated feature. If a
  useful extra occurs to you, name it in one line and ask — don't build it.
`
  },
  'Completion gate limits scope closure': {},

  // === Structural: Lifecycle ===
  'Startup script exists': {
    template: 'init.sh',
    defaultPath: 'init.sh',
    sectionName: 'init.sh'
  },
  'End-of-session procedure exists': {
    targetFile: 'AGENTS.md',
    insertAfter: '## Definition of Done',
    sectionName: 'End of Session',
    snippet: `

## End of Session

Before ending a session:

1. Update \`progress.md\` with current state
2. Update \`feature_list.json\` with new feature status
3. Record any unresolved risks or blockers
4. Commit with descriptive message once work is in safe state
5. Leave repo clean enough for next session to run \`./init.sh\` immediately
`
  },
  'Session handoff template exists': {
    template: 'session-handoff.md',
    defaultPath: 'session-handoff.md',
    sectionName: 'session-handoff.md'
  },
  'Session restart markers exist': {
    targetFile: 'progress.md',
    insertAfter: '## Notes for Next Session',
    sectionName: 'Notes for Next Session',
    snippet: `
[Free-form notes that will help the next session pick up context]
`
  },
  'Clean restart path documented': {
    targetFile: 'AGENTS.md',
    insertAfter: '## End of Session',
    sectionName: 'Clean restart rule',
    snippet: `
- **Leave clean state**: Next session must be able to run \`./init.sh\` immediately
`
  },

  // === Behavioral: Coding Policy ===
  'Coding minimalism policy (Ponytail ladder) present': {
    targetFile: 'AGENTS.md',
    insertAfter: 'If baseline verification is failing, repair that first before adding new scope.',
    sectionName: 'Coding Policy',
    snippet: `

## Coding Policy

Before writing any code, stop at the first rung that holds:

1. **Does this need to exist at all?** Speculative need = skip it. (YAGNI)
2. **Does the standard library already do this?** Use it.
3. **Does a native platform feature cover it?** \`<input type="date">\` over a
   picker lib, CSS over JS, DB constraint over app code.
4. **Does an already-installed dependency solve it?** Use it. Never add a new
   dependency for what a few lines can do.
5. **Can this be one line?** Make it one line.
6. **Only then:** write the minimum code that works.

The ladder is a reflex, not a research project. Two rungs work → take the
higher one and move on.
`
  },
  'Coding standards (no over-engineering) documented': {
    targetFile: 'AGENTS.md',
    insertAfter: '## Coding Policy',
    sectionName: 'Coding Standards',
    snippet: `

## Coding Standards

- Write the **minimum code** that solves the problem. Nothing speculative.
- No abstractions that weren't requested. No interface with one implementation.
- No unrequested "flexibility" or "configurability." No scaffolding "for later."
- No error handling for scenarios the code structure makes **impossible**.
- Deletion over addition. Boring over clever. Fewest files possible.
- Mark deliberate simplifications: \`// ponytail: O(n²) scan, upgrade to index if >10k rows\`
- Non-trivial logic leaves ONE runnable check. Trivial one-liners need no test.
`
  },
  'Surgical editing discipline documented': {
    targetFile: 'AGENTS.md',
    insertAfter: '## Coding Standards',
    sectionName: 'Editing Discipline',
    snippet: `

## Editing Discipline

- **Touch only what the feature requires.** Do not "improve" or reformat adjacent
  code, comments, or whitespace — even when they could be better.
- **Match the existing style.** Consistency beats your preference.
- **Don't refactor things that aren't broken.**
- **If you notice unrelated dead code or issues**, mention them in \`progress.md\` —
  don't fix them in this diff.
- **Remove only the imports, variables, or functions that YOUR changes made unused.**
- **The test:** Every changed line should trace to the feature in \`feature_list.json\`.
`
  },
  'Test-first verification gate present': {
    targetFile: 'AGENTS.md',
    insertAfter: '## Editing Discipline',
    sectionName: 'Before Multi-Step Work',
    snippet: `

## Before Multi-Step Work

State a **one-line success criterion**. If the task spans more than 2 files or
3 logical steps, add a numbered plan with a verify check per step:

\`\`\`
1. [Step] → verify: [specific check]
2. [Step] → verify: [specific check]
3. [Step] → verify: [specific check]
\`\`\`

For bugs: write a reproduction test FIRST, then make it pass.
For features: write the verification check FIRST, then implement.
One-liners and trivial changes skip this — the task itself is the criterion.
`
  },
  'Multi-step planning with verify-per-step documented': {
    // Covered by "Before Multi-Step Work" above
  },
  'Proactive assumption surfacing documented': {
    // Covered by Startup Workflow step 7
  },
  'Safety carve-outs documented': {
    targetFile: 'AGENTS.md',
    insertAfter: '## End of Session',
    sectionName: 'Safety',
    snippet: `

## Safety (Never Simplify Away)

- Input validation at trust boundaries
- Error handling that prevents data loss
- Security measures
- Accessibility basics
- Hardware calibration (the platform is never the spec ideal)
- Anything the user explicitly asked to keep
`
  },
  'Over-specified requirements escalation documented': {
    targetFile: 'AGENTS.md',
    insertAfter: '- **Repeated test failures**: Update progress, flag for human review',
    sectionName: 'Over-specified escalation',
    snippet: `
- **Scope ambiguity**: Re-read \`feature_list.json\` for definition of done
`
  }
};

// === Main ===

const args = parseArgs(process.argv.slice(2));

if (args.help) {
  console.log(`Usage: node scripts/enrich-harness.mjs [--target DIR] [--apply] [--diff FILE]

Reads an existing harness, identifies gaps against the five-subsystem + behavioral model,
and proposes specific fixes for each failing check.

Flags:
  --target DIR   Project directory to enrich (default: cwd)
  --apply        Write proposed fixes to files (default: dry-run, prints diff only)
  --diff FILE    Write a unified diff of proposed changes to FILE

Each validation check has a canonical fix:
  - Missing file    → Creates the file from a template
  - Missing section → Inserts the canonical snippet into an existing file
  - Structural JSON → Requires human review (not auto-fixable)

v3 adds behavioral policy enrichment: Coding Policy, Coding Standards, Editing
Discipline, Test-First gates, Safety carve-outs.`);

  process.exit(0);
}

const target = path.resolve(args.target || args._[0] || process.cwd());
const apply = Boolean(args.apply);
const files = await loadHarnessFiles(target);
const result = scoreHarness(files);

console.log(`Harness enrichment for ${target}`);
console.log(`Overall: ${result.overall}/100 — ${usabilityTierLabel(result)}`);
console.log('');

// Collect all failing checks
const gaps = [];
for (const [subsystemName, subsystem] of Object.entries(result.subsystems)) {
  for (const check of subsystem.checks) {
    if (!check.pass) {
      gaps.push({ subsystem: subsystemName, ...check, fix: GAP_FIXES[check.message] });
    }
  }
}

if (gaps.length === 0) {
  console.log('✅ No gaps found. Harness is at full score.');
  process.exit(0);
}

console.log(`Found ${gaps.length} gap(s):\n`);

const diffLines = [];
const proposedFiles = new Map();

for (const gap of gaps) {
  console.log(`🔶 [${gap.subsystem}] ${gap.message}`);

  if (!gap.fix) {
    console.log('   → No automatic fix available. Manual intervention required.');
    console.log('');
    continue;
  }

  if (gap.fix.template) {
    const filePath = gap.fix.defaultPath || gap.fix.template;
    console.log(`   → Create ${filePath} from template: ${gap.fix.template}`);
    diffLines.push(`--- /dev/null`);
    diffLines.push(`+++ ${path.join(target, filePath)}`);
    diffLines.push(`@@ -0,0 +1 @@`);
    diffLines.push(`+ [Create ${filePath} from template ${gap.fix.template}]`);
    diffLines.push('');

    if (!proposedFiles.has(filePath)) {
      proposedFiles.set(filePath, []);
    }
    proposedFiles.get(filePath).push(gap.fix);
  } else if (gap.fix.snippet) {
    const filePath = gap.fix.targetFile || 'AGENTS.md';
    console.log(`   → Insert "${gap.fix.sectionName || 'section'}" into ${filePath}`);

    diffLines.push(`--- a/${filePath}`);
    diffLines.push(`+++ b/${filePath}`);
    const preview = gap.fix.snippet.split('\n').filter(Boolean).slice(0, 3).map((l) => `+ ${l}`).join('\n');
    diffLines.push(`@@ ... @@`);
    diffLines.push(preview);
    diffLines.push('');

    if (!proposedFiles.has(filePath)) {
      proposedFiles.set(filePath, []);
    }
    proposedFiles.get(filePath).push(gap.fix);
  }

  console.log('');
}

// Write diff if requested
const diffContent = diffLines.join('\n');
if (args.diff) {
  const diffPath = path.resolve(args.diff);
  await mkdir(path.dirname(diffPath), { recursive: true });
  await writeText(diffPath, diffContent);
  console.log(`Diff written to ${diffPath}`);
}

if (apply) {
  console.log('=== Applying fixes ===\n');

  for (const gap of gaps) {
    if (!gap.fix || !gap.fix.template) continue;
    const filePath = path.join(target, gap.fix.defaultPath || gap.fix.template);
    console.log(`Creating ${path.relative(target, filePath)} from template...`);
    try {
      const { copyTemplate } = await import('./lib/harness-utils.mjs');
      const res = await copyTemplate(
        gap.fix.template,
        filePath,
        gap.fix.replacements || {},
        { force: false }
      );
      console.log(`  ${res.status.toUpperCase()} ${path.relative(target, res.path)}`);
    } catch (err) {
      console.error(`  ERROR: ${err.message}`);
    }
  }

  const fsPromises = await import('node:fs/promises');
  for (const [fileName, fixes] of proposedFiles) {
    const filePath = path.join(target, fileName);
    console.log(`\nPatching ${path.relative(target, filePath)}...`);

    try {
      const content = await fsPromises.readFile(filePath, 'utf8');
      let patched = content;

      for (const fix of fixes) {
        if (!fix.snippet) continue;

        // Skip if snippet already present (dedup)
        const snippetLines = fix.snippet.trim().split('\n').filter(Boolean);
        if (snippetLines.length > 0 && content.includes(snippetLines[0].trim())) {
          continue;
        }

        const afterMarker = fix.insertAfter;
        if (afterMarker && content.includes(afterMarker)) {
          const lines = patched.split('\n');
          const newLines = [];
          for (const line of lines) {
            newLines.push(line);
            if (line.includes(afterMarker)) {
              newLines.push(fix.snippet.trimEnd());
            }
          }
          patched = newLines.join('\n');
        } else {
          patched = patched.trimEnd() + '\n' + fix.snippet.trim() + '\n';
        }
      }

      if (patched !== content) {
        await fsPromises.writeFile(filePath, patched, 'utf8');
        console.log(`  PATCHED ${path.relative(target, filePath)}`);
      } else {
        console.log(`  UNCHANGED ${path.relative(target, filePath)} (content already matches)`);
      }
    } catch (err) {
      console.error(`  ERROR patching ${path.relative(target, filePath)}: ${err.message}`);
    }
  }

  console.log('\n=== Enrichment complete ===');
  console.log('Re-run validate-harness.mjs to confirm scores.');
} else {
  console.log('Dry run complete. Use --apply to write changes.');
  console.log('Use --diff FILE to save a diff of proposed changes.');
}
