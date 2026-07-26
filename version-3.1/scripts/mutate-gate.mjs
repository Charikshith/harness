#!/usr/bin/env node
// Phase 0: standalone. Imported by nothing, and deliberately so.
//
// Every verification check in this skill asks whether text is present. None asks whether
// the gate WORKS. This script breaks init.sh in known ways and reports whether running it
// still succeeds. A mutant that SURVIVES is a class of breakage the gate cannot see.
//
// Expected on an unmodified scaffold: `early-exit` SURVIVES. That single result is the
// justification for wiring a kill-rate check into scoring. If it is KILLED instead, the
// premise is wrong and Phase 1 should not be built.
import { cp, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { spawnSync } from 'node:child_process';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { exists, loadHarnessFiles, parseArgs, scoreHarness } from './lib/harness-utils.mjs';

// Two probes, asking different questions of the same mutation:
//
//   runtime   — mutate init.sh, then RUN it. Does the gate exit non-zero?
//   validator — mutate init.sh, then SCORE the harness. Does verification drop?
//
// The runtime probe is close to tautological for a mutation that disables the gate
// outright: of course a disabled gate reports success. The validator probe is the
// informative one — it asks whether the scoring layer can tell a working gate from a
// decorative one, and that is the question the harness actually gets wrong.
const MUTATIONS = [
  {
    id: 'early-exit',
    probe: 'runtime',
    describes: 'init.sh returns success without running any check',
    apply: (sh) => sh.replace(/^(#!.*\n)/, '$1exit 0\n')
  },
  {
    id: 'neuter-first-check',
    probe: 'runtime',
    describes: 'the first real command can fail without failing the gate',
    apply: (sh) => {
      const lines = sh.split('\n');
      const i = lines.findIndex((line) =>
        line.trim() && !line.trim().startsWith('#') && !line.startsWith('#!'));
      if (i >= 0) lines[i] += ' || true';
      return lines.join('\n');
    }
  },
  {
    id: 'hollow-gate',
    probe: 'validator',
    describes: 'init.sh keeps set -e but runs nothing at all',
    apply: () => '#!/bin/bash\nset -e\nexit 0\n'
  },
  {
    id: 'strip-all-commands',
    probe: 'validator',
    describes: 'every command removed, comments and echoes kept',
    apply: (sh) => sh.split('\n')
      .filter((line) => !line.trim() || line.startsWith('#') || /^\s*(echo|set)\b/.test(line.trim()))
      .join('\n')
  }
];

const args = parseArgs(process.argv.slice(2));

if (args.help) {
  console.log(`Usage: node scripts/mutate-gate.mjs [--target DIR]

Mutation-tests a harness's verification gate. Copies the target to a scratch directory,
breaks init.sh in a known way, and reports whether the breakage was noticed.

Probes:
  runtime    runs the mutated init.sh — KILLED if it exits non-zero
  validator  scores the mutated harness — KILLED if verification drops

  KILLED    the breakage was caught
  SURVIVED  the breakage is invisible

A surviving mutant is not a bug in this script. It is a gap in the gate.`);
  process.exit(0);
}

const target = path.resolve(args.target || args._[0] || process.cwd());

if (!await exists(path.join(target, 'init.sh'))) {
  console.error(`No init.sh in ${target} — nothing to mutate.`);
  process.exit(1);
}

const baseline = scoreHarness(await loadHarnessFiles(target)).subsystems.verification.score;

let survived = 0;
for (const mutation of MUTATIONS) {
  const scratch = await mkdtemp(path.join(tmpdir(), 'mutate-gate-'));
  try {
    await cp(target, scratch, { recursive: true });
    const initPath = path.join(scratch, 'init.sh');
    const mutated = mutation.apply(await readFile(initPath, 'utf8'));
    await writeFile(initPath, mutated, { mode: 0o755 });

    let killed;
    let note = '';
    if (mutation.probe === 'validator') {
      const score = scoreHarness(await loadHarnessFiles(scratch)).subsystems.verification.score;
      killed = score < baseline;
      note = `verification ${baseline}/5 -> ${score}/5`;
    } else {
      const run = spawnSync('bash', ['init.sh'], { cwd: scratch, encoding: 'utf8', timeout: 120000 });
      killed = run.status !== 0;
      note = `exit ${run.status}`;
    }
    if (!killed) survived += 1;
    console.log(`${killed ? 'KILLED  ' : 'SURVIVED'} [${mutation.probe.padEnd(9)}] ${mutation.id.padEnd(20)} ${mutation.describes} (${note})`);
  } finally {
    await rm(scratch, { recursive: true, force: true });
  }
}

console.log(`\n${MUTATIONS.length - survived}/${MUTATIONS.length} mutants killed.`);
if (survived) {
  console.log(`${survived} surviving mutant(s): the gate cannot distinguish these from a healthy run.`);
}
// Phase 0 reports; it does not gate. Exit 0 regardless, so nothing downstream can come to
// depend on this exit code before the scoring hookup is designed.
