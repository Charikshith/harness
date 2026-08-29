#!/usr/bin/env node
import { chmod, mkdir } from 'node:fs/promises';
import path from 'node:path';
import {
  HARNESS_DIR,
  copyTemplate,
  detectPackageManager,
  detectProject,
  exists,
  initScriptFromCommands,
  isDirectory,
  locateHarnessFile,
  parseArgs,
  verificationCommands,
  writeText
} from './lib/harness-utils.mjs';

const args = parseArgs(process.argv.slice(2));

if (args.help) {
  console.log(`Usage: node scripts/create-harness.mjs [--target DIR] [--package-manager npm|pnpm|yarn|bun] [--force]

Creates a minimal production harness. Three files land in the project root; all
harness state lives under ${HARNESS_DIR}/.

  AGENTS.md (full instruction file — root, the cross-tool convention)
  CLAUDE.md (reference to AGENTS.md — root)
  init.sh (root, so it stays runnable as ./init.sh)

  ${HARNESS_DIR}/feature_list.json
  ${HARNESS_DIR}/progress.md
  ${HARNESS_DIR}/memory/index.md (bounded index of agent-written lessons)
  ${HARNESS_DIR}/memory/journal.md (append-only friction log; the input to curation)
  ${HARNESS_DIR}/memory/graveyard.md (rejected routes, each with an expiry condition)
  ${HARNESS_DIR}/dream-queue.md (out-of-band curation proposals, human-gated)
  ${HARNESS_DIR}/open-work.md (work seen but declined under scope discipline)

Existing files are skipped unless --force is set.`);
  process.exit(0);
}

const target = path.resolve(args.target || args._[0] || process.cwd());
const force = Boolean(args.force);
const project = await detectProject(target);
project.packageManager = detectPackageManager(target, args.packageManager);
const commands = args.commands
  ? String(args.commands).split(',').map((command) => command.trim()).filter(Boolean)
  : verificationCommands(project, args.packageManager);

await mkdir(target, { recursive: true });

// Every template destination except the three root files now lives inside harness/, so an
// existing non-directory at either path would make mkdir throw part-way through the
// scaffold and leave the target without init.sh. Check before writing anything, not on the
// way past.
for (const dir of [HARNESS_DIR, `${HARNESS_DIR}/memory`]) {
  const fullPath = path.join(target, dir);
  if (await exists(fullPath) && !await isDirectory(fullPath)) {
    console.error(`ERROR: ${fullPath} exists and is not a directory.`);
    console.error('Move or remove it, then re-run. Nothing was written.');
    process.exit(1);
  }
}

const replacements = {
  AGENT_FILE_NAME: 'AGENTS.md',
  PROJECT_PURPOSE: project.stack === 'generic'
    ? 'Project harness for reliable agent-assisted development.'
    : `Project harness for reliable agent-assisted development in a ${project.stack} codebase.`,
  VERIFICATION_COMMANDS: commands.map((command) => `- \`${command}\``).join('\n'),
  PRIMARY_VERIFICATION_COMMAND: './init.sh'
};

// locateHarnessFile() rather than harnessPath(): a greenfield project gets the harness/
// layout, but re-running over a harness scaffolded before harness/ existed resolves to the
// files already at the root, so they are skipped instead of duplicated one level down.
const at = async (name) => path.join(target, await locateHarnessFile(target, name));

const results = [];
results.push(await copyTemplate('agents.md', await at('AGENTS.md'), replacements, { force }));
results.push(await copyTemplate('feature-list.json', await at('feature_list.json'), {}, { force }));
results.push(await copyTemplate('progress.md', await at('progress.md'), {}, { force }));
results.push(await copyTemplate('memory-index.md', await at('memory/index.md'), {}, { force }));
results.push(await copyTemplate('memory-journal.md', await at('memory/journal.md'), {}, { force }));
results.push(await copyTemplate('memory-graveyard.md', await at('memory/graveyard.md'), {}, { force }));
results.push(await copyTemplate('dream-queue.md', await at('dream-queue.md'), {}, { force }));
results.push(await copyTemplate('open-work.md', await at('open-work.md'), {}, { force }));

const initPath = await at('init.sh');
if (force || !await exists(initPath)) {
  await writeText(initPath, initScriptFromCommands(commands));
  await chmod(initPath, 0o755);
  results.push({ path: initPath, status: 'written' });
} else {
  results.push({ path: initPath, status: 'skipped', reason: 'exists' });
}

// Create CLAUDE.md as a reference to AGENTS.md
const claudePath = await at('CLAUDE.md');
if (force || !await exists(claudePath)) {
  await writeText(claudePath, 'See [AGENTS.md](AGENTS.md)');
  results.push({ path: claudePath, status: 'written' });
} else {
  results.push({ path: claudePath, status: 'skipped', reason: 'exists' });
}

console.log(`Created harness for ${target}`);
console.log(`Detected stack: ${project.stack}`);
console.log(`Verification commands:`);
for (const command of commands) {
  console.log(`  - ${command}`);
}
console.log('');
for (const result of results) {
  console.log(`${result.status.toUpperCase()} ${path.relative(target, result.path)}${result.reason ? ` (${result.reason})` : ''}`);
}
