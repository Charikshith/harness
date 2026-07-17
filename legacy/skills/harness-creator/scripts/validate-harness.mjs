#!/usr/bin/env node
import path from 'node:path';
import {
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

Scores a project harness across five subsystems:
  instructions, state, verification, scope, lifecycle

Tiers:
  >= 85  production   Ready for multi-session agent work
  >= 60  usable       Works for single sessions; gaps in handoff and state
  >= 30  degraded     Agent has basic instructions but will drift across sessions
  < 30   insufficient Agent has no reliable startup path

Flags:
  --fail-fast    Exit 2 below 85, exit 1 below 60 (CI use)
  --no-fail      Never exit with error; always exit 0 (interactive use)
  --min-score N  Custom threshold (default 60, the usable tier boundary)`);
  process.exit(0);
}

const target = path.resolve(args.target || args._[0] || process.cwd());
const failFast = Boolean(args.failFast);
const noFail = Boolean(args.noFail);
const minScore = Number(args.minScore || (failFast ? 85 : 60));
const files = await loadHarnessFiles(target);
const result = scoreHarness(files);

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
}

if (noFail) {
  // Never exit with error (interactive use)
  process.exitCode = 0;
} else if (result.overall < 30) {
  console.error('Harness insufficient for agent use. Run create-harness.mjs to scaffold the basics.');
  process.exitCode = 2;
} else if (failFast && result.overall < 85) {
  process.exitCode = 2;
} else if (result.overall < minScore) {
  process.exitCode = 1;
}
