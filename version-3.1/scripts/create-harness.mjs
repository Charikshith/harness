#!/usr/bin/env node
import { chmod, mkdir } from 'node:fs/promises';
import path from 'node:path';
import {
  copyTemplate,
  detectPackageManager,
  detectProject,
  exists,
  initScriptFromCommands,
  isDirectory,
  parseArgs,
  verificationCommands,
  writeText
} from './lib/harness-utils.mjs';

const args = parseArgs(process.argv.slice(2));

if (args.help) {
  console.log(`Usage: node scripts/create-harness.mjs [--target DIR] [--package-manager npm|pnpm|yarn|bun] [--force]

Creates a minimal production harness:
  AGENTS.md (full instruction file)
  CLAUDE.md (reference to AGENTS.md)
  feature_list.json
  progress.md
  session-handoff.md
  memory/index.md (bounded index of agent-written lessons)
  memory/journal.md (append-only friction log; the input to curation)
  memory/graveyard.md (rejected routes, each with an expiry condition)
  dream-queue.md (out-of-band curation proposals, human-gated)
  init.sh

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

// memory/ is the first template destination inside a subdirectory, so an existing
// non-directory at that path would make mkdir throw part-way through the scaffold and
// leave the target without init.sh. Check before writing anything, not on the way past.
const memoryDir = path.join(target, 'memory');
if (await exists(memoryDir) && !await isDirectory(memoryDir)) {
  console.error(`ERROR: ${memoryDir} exists and is not a directory.`);
  console.error('Move or remove it, then re-run. Nothing was written.');
  process.exit(1);
}

const replacements = {
  AGENT_FILE_NAME: 'AGENTS.md',
  PROJECT_PURPOSE: project.stack === 'generic'
    ? 'Project harness for reliable agent-assisted development.'
    : `Project harness for reliable agent-assisted development in a ${project.stack} codebase.`,
  VERIFICATION_COMMANDS: commands.map((command) => `- \`${command}\``).join('\n'),
  PRIMARY_VERIFICATION_COMMAND: './init.sh'
};

const results = [];
results.push(await copyTemplate('agents.md', path.join(target, 'AGENTS.md'), replacements, { force }));
results.push(await copyTemplate('feature-list.json', path.join(target, 'feature_list.json'), {}, { force }));
results.push(await copyTemplate('progress.md', path.join(target, 'progress.md'), {}, { force }));
results.push(await copyTemplate('session-handoff.md', path.join(target, 'session-handoff.md'), {}, { force }));
results.push(await copyTemplate('memory-index.md', path.join(target, 'memory', 'index.md'), {}, { force }));
results.push(await copyTemplate('memory-journal.md', path.join(target, 'memory', 'journal.md'), {}, { force }));
results.push(await copyTemplate('memory-graveyard.md', path.join(target, 'memory', 'graveyard.md'), {}, { force }));
results.push(await copyTemplate('dream-queue.md', path.join(target, 'dream-queue.md'), {}, { force }));

const initPath = path.join(target, 'init.sh');
if (force || !await exists(initPath)) {
  await writeText(initPath, initScriptFromCommands(commands));
  await chmod(initPath, 0o755);
  results.push({ path: initPath, status: 'written' });
} else {
  results.push({ path: initPath, status: 'skipped', reason: 'exists' });
}

// Create CLAUDE.md as a reference to AGENTS.md
const claudePath = path.join(target, 'CLAUDE.md');
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
