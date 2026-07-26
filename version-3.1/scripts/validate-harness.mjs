#!/usr/bin/env node
import path from 'node:path';
import {
  appendAuditEntry,
  formatScoreReport,
  htmlReport,
  loadHarnessFiles,
  parseArgs,
  scoreHarness,
  usabilityTierLabel,
  writeText
} from './lib/harness-utils.mjs';

const args = parseArgs(process.argv.slice(2));

if (args.help) {
  console.log(`Usage: node scripts/validate-harness.mjs [--target DIR] [--json] [--html FILE] [--fail-fast] [--no-fail]

Scores a project harness across five structural subsystems + memory + behavioral policies:
  instructions, state, verification, scope, lifecycle, memory, behavioral

Tiers:
  >= 85  production   Ready for multi-session agent work
  >= 60  usable       Works for single sessions; gaps in handoff or behavioral policies
  >= 30  degraded     Agent has basic instructions but will drift across sessions
  < 30   insufficient Agent has no reliable startup path

Flags:
  --fail-fast    Exit 2 below 85, exit 1 below 60 (CI use)
  --no-fail      Never exit with error; always exit 0 (interactive use)
  --min-score N  Custom threshold (default 60, the usable tier boundary)
  --mutate       Measure whether the gate actually catches breakage (slow: copies the
                 project and runs init.sh once per mutation). Without it, that check
                 reports "not measured" and passes.
  --log          Append this audit to <memory store>/audit-log.jsonl, alongside whichever
                 memory directory the project already uses. Never affects the score or
                 the exit code — telemetry reports, it does not gate.
  --budget       Report the always-on context cost in lines and estimated tokens.
                 Advisory only; never affects the score or the exit code.`);
  process.exit(0);
}

const target = path.resolve(args.target || args._[0] || process.cwd());
const failFast = Boolean(args.failFast);
const noFail = Boolean(args.noFail);
const minScore = Number(args.minScore || (failFast ? 85 : 60));
const files = await loadHarnessFiles(target);

// Opt-in: measuring the kill rate copies the project and runs its gate once per mutation.
// Without the flag the check reports "not measured" and passes, so the score is identical
// to what it was before the adversary existed.
let killRate;
if (args.mutate) {
  const { runMutations } = await import('./mutate-gate.mjs');
  killRate = await runMutations(target);
}

const result = scoreHarness(files, { killRate });

if (args.log) {
  console.log(`Audit appended to ${await appendAuditEntry(target, result)}`);
}

if (args.html) {
  const htmlPath = path.resolve(args.html);
  await writeText(htmlPath, htmlReport(result, `Harness Assessment: ${path.basename(target)}`));
  console.log(`HTML report written to ${htmlPath}`);
}

if (args.json) {
  console.log(JSON.stringify(result, null, 2));
} else {
  console.log(formatScoreReport(result, target));
  console.log(`Usability tier: ${usabilityTierLabel(result)}`);

  // Bonus: warn if behavioral score is significantly lower than structural
  const structuralNames = ['instructions', 'state', 'verification', 'scope', 'lifecycle'];
  const structuralAvg = structuralNames.reduce((sum, n) => sum + (result.subsystems[n]?.score || 0), 0) / structuralNames.length;
  const behavioralScore = result.subsystems.behavioral?.score || 0;
  if (behavioralScore > 0 && behavioralScore < structuralAvg - 1.5) {
    console.log(`\n⚠️  Behavioral score (${behavioralScore}/5) lags behind structural average (${structuralAvg.toFixed(1)}/5).`);
    console.log('   The harness has good structure but missing behavioral policies.');
    console.log('   Run enrich-harness.mjs to add Coding Policy, Editing Discipline, and Safety sections.');
  }
}

// Advisory only. Deliberately a console.log and not a check: a context budget is a
// warning, not a pass/fail question, and there is no defensible universal ceiling. Adding
// it to `checks` would make an arbitrary number gate a build.
if (args.budget) {
  const alwaysOn = ['AGENTS.md', 'CLAUDE.md', 'memory/index.md', 'open-work.md'];
  console.log('\nAlways-on context (loaded every session):');
  let totalTokens = 0;
  for (const name of alwaysOn) {
    const file = files.find((item) => item.path === name);
    if (!file) continue;
    // chars/4 is a crude approximation on purpose — this is budget awareness, not
    // accounting. A precise tokeniser would be a dependency, and the ladder says no.
    const tokens = Math.round(file.content.length / 4);
    const lines = file.content.split('\n').length;
    totalTokens += tokens;
    console.log(`  ${name.padEnd(20)} ${String(lines).padStart(4)} lines  ~${String(tokens).padStart(6)} tokens`);
  }
  console.log(`  ${'total'.padEnd(20)} ${' '.repeat(4)}         ~${String(totalTokens).padStart(6)} tokens`);
}

if (noFail) {
  process.exitCode = 0;
} else if (result.overall < 30) {
  console.error('Harness insufficient for agent use. Run create-harness.mjs to scaffold the basics.');
  process.exitCode = 2;
} else if (failFast && result.overall < 85) {
  process.exitCode = 2;
} else if (result.overall < minScore) {
  process.exitCode = 1;
}
