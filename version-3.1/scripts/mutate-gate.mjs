#!/usr/bin/env node
// Every verification check in this skill asks whether text is PRESENT. None asks whether
// the gate WORKS. This script breaks things in known ways and reports what went unnoticed.
//
// Two probes, asking questions each can actually answer:
//
//   runtime    mutate the PROJECT, then RUN init.sh.
//              Asks: does this project's gate catch breakage in this project?
//              A project controls the answer, so this is what gets SCORED.
//
//   validator  mutate init.sh, then SCORE the harness.
//              Asks: can the scorer tell a working gate from a decorative one?
//              No individual project can fix the answer, so this is REPORTED, not scored.
//
// Both distinctions are load-bearing.
//
// The pairing matters: mutating init.sh and then running init.sh is unkillable by
// construction — deleting a gate cannot be caught by running the gate you just deleted.
// That combination reports SURVIVED however good the harness is.
//
// The scoring split matters just as much. `hollow-gate` survives on a stub and on a
// well-tested project alike, because two verification checks read `init + agents` and
// AGENTS.md prose satisfies them whatever init.sh contains. Counting it against a project
// would mean no project could ever exceed 50% and the check would fail permanently — a
// check that cannot pass is not a signal. It is a finding about this skill, so it is
// printed under "scorer blindness" and left out of the rate.
import { cp, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { spawnSync } from 'node:child_process';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  detectProject,
  exists,
  loadHarnessFiles,
  parseArgs,
  scoreHarness
} from './lib/harness-utils.mjs';

// A mutation whose `applicable` returns false is excluded from the kill rate entirely
// rather than counted as survived. A generic project with no test suite genuinely cannot
// be probed at runtime, and scoring it as a failure would punish it for what it is rather
// than for what it got wrong.
const MUTATIONS = [
  {
    id: 'hollow-gate',
    probe: 'validator',
    describes: 'init.sh keeps set -e but runs nothing at all',
    applicable: () => true,
    mutate: async (scratch) => {
      await writeFile(path.join(scratch, 'init.sh'), '#!/bin/bash\nset -e\nexit 0\n', { mode: 0o755 });
    }
  },
  {
    id: 'strip-all-commands',
    probe: 'validator',
    describes: 'every command removed, comments and echoes kept',
    applicable: () => true,
    mutate: async (scratch) => {
      const initPath = path.join(scratch, 'init.sh');
      const kept = (await readFile(initPath, 'utf8')).split('\n')
        .filter((line) => !line.trim() || line.startsWith('#') || /^\s*(echo|set)\b/.test(line.trim()))
        .join('\n');
      await writeFile(initPath, kept, { mode: 0o755 });
    }
  },
  {
    id: 'drop-fail-fast',
    probe: 'validator',
    describes: 'set -e removed, so a failing step no longer stops the run',
    applicable: () => true,
    mutate: async (scratch) => {
      const initPath = path.join(scratch, 'init.sh');
      const text = (await readFile(initPath, 'utf8')).replace(/^set -e.*$/m, '');
      await writeFile(initPath, text, { mode: 0o755 });
    }
  },
  {
    // The positive control: if the gate runs tests at all, an always-failing test must
    // fail it. A SURVIVED here means init.sh reports success over a red suite.
    id: 'inject-failing-test',
    probe: 'runtime',
    describes: 'an always-failing test is added to the suite',
    applicable: (project) => FAILING_TEST_BY_STACK[project.stack] !== undefined,
    mutate: async (scratch, project) => {
      const spec = FAILING_TEST_BY_STACK[project.stack];
      await writeFile(path.join(scratch, spec.file), spec.body);
    }
  }
];

// Written in each ecosystem's default discovery convention so no config change is needed
// for the runner to pick the file up.
const FAILING_TEST_BY_STACK = {
  node: { file: 'mutant.test.js', body: 'test("mutant", () => { throw new Error("mutant"); });\n' },
  typescript: { file: 'mutant.test.ts', body: 'test("mutant", () => { throw new Error("mutant"); });\n' },
  'typescript-react': { file: 'mutant.test.ts', body: 'test("mutant", () => { throw new Error("mutant"); });\n' },
  python: { file: 'test_mutant.py', body: 'def test_mutant():\n    assert False, "mutant"\n' },
  go: { file: 'mutant_test.go', body: 'package main\n\nimport "testing"\n\nfunc TestMutant(t *testing.T) { t.Fatal("mutant") }\n' },
  rust: { file: 'tests/mutant.rs', body: '#[test]\nfn mutant() { panic!("mutant"); }\n' }
};

export async function runMutations(target, { onResult } = {}) {
  const project = await detectProject(target);
  const baseline = scoreHarness(await loadHarnessFiles(target)).subsystems.verification.score;
  const results = [];

  for (const mutation of MUTATIONS) {
    if (!mutation.applicable(project)) {
      results.push({ ...mutation, applicable: false, killed: null, note: `not applicable (stack: ${project.stack})` });
      onResult?.(results.at(-1));
      continue;
    }

    const scratch = await mkdtemp(path.join(tmpdir(), 'mutate-gate-'));
    try {
      await cp(target, scratch, { recursive: true });
      await mutation.mutate(scratch, project);

      let killed;
      let note;
      if (mutation.probe === 'validator') {
        const score = scoreHarness(await loadHarnessFiles(scratch)).subsystems.verification.score;
        killed = score < baseline;
        note = `verification ${baseline}/5 -> ${score}/5`;
      } else {
        const run = spawnSync('bash', ['init.sh'], { cwd: scratch, encoding: 'utf8', timeout: 300000 });
        killed = run.status !== 0;
        note = `init.sh exit ${run.status}`;
      }
      results.push({ ...mutation, applicable: true, killed, note });
      onResult?.(results.at(-1));
    } finally {
      await rm(scratch, { recursive: true, force: true });
    }
  }

  // Scored: runtime probes only. See the header comment — validator probes measure this
  // skill's blindness, not this project's gate, and no project can act on them.
  const scored = results.filter((item) => item.applicable && item.probe === 'runtime');
  const killed = scored.filter((item) => item.killed).length;
  const blindness = results.filter((item) =>
    item.applicable && item.probe === 'validator' && !item.killed).map((item) => item.id);

  return {
    killed,
    total: scored.length,
    skipped: results.filter((item) => !item.applicable).length,
    rate: scored.length ? killed / scored.length : null,
    survivors: scored.filter((item) => !item.killed).map((item) => item.id),
    blindness,
    results
  };
}

// --- CLI --------------------------------------------------------------------
const invokedDirectly = process.argv[1]
  && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);

if (invokedDirectly) {
  const args = parseArgs(process.argv.slice(2));

  if (args.help) {
    console.log(`Usage: node scripts/mutate-gate.mjs [--target DIR]

Mutation-tests a harness's verification gate. Copies the target to a scratch directory,
breaks something in a known way, and reports whether anything noticed.

Probes:
  validator  mutate init.sh, then score the harness  - KILLED if verification drops
  runtime    mutate the project, then run init.sh    - KILLED if init.sh exits non-zero

  KILLED    the breakage was caught
  SURVIVED  the breakage is invisible to this harness
  SKIPPED   not applicable to this project (e.g. no test suite to inject into)

A surviving mutant is not a bug in this script. It is a gap in the gate.
Reports only; always exits 0. Wire it into scoring via validate-harness.mjs --mutate.`);
    process.exit(0);
  }

  const target = path.resolve(args.target || args._[0] || process.cwd());

  if (!await exists(path.join(target, 'init.sh'))) {
    console.error(`No init.sh in ${target} — nothing to mutate.`);
    process.exit(1);
  }

  const summary = await runMutations(target, {
    onResult: (item) => {
      const verdict = item.applicable ? (item.killed ? 'KILLED  ' : 'SURVIVED') : 'SKIPPED ';
      console.log(`${verdict} [${item.probe.padEnd(9)}] ${item.id.padEnd(20)} ${item.describes} (${item.note})`);
    }
  });

  console.log('');
  if (summary.total === 0) {
    console.log('Kill rate: unmeasurable — no runtime mutation applies to this project.');
    console.log('A project with no test suite has nothing for its gate to verify.');
  } else {
    console.log(`Kill rate: ${summary.killed}/${summary.total} (${Math.round(summary.rate * 100)}%) — scored.`);
  }
  if (summary.survivors.length) {
    console.log(`Surviving: ${summary.survivors.join(', ')} — this gate cannot distinguish these from a healthy run.`);
  }
  if (summary.skipped) console.log(`${summary.skipped} mutation(s) skipped as not applicable.`);
  if (summary.blindness.length) {
    console.log(`\nScorer blindness (not counted against this project): ${summary.blindness.join(', ')}`);
    console.log('These survive on every project. Two verification checks read init + agents,');
    console.log('so AGENTS.md prose satisfies them whatever init.sh actually contains.');
  }
}
