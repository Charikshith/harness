#!/usr/bin/env node
// Self-check for enrich-harness's pre-commit hook step. Run directly:
// node scripts/enrich-hook.test.mjs
//
// An older harness had no route to the hook: enrich acts only on failing checks, the hook is
// unscored on purpose, and a full-score harness exited at "No gaps found" before doing
// anything. Each fixture here is a bundled example with the hook and its activation removed,
// which is exactly what a pre-hook harness looks like — and it still scores 100.
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { HOOKS_BLOCK } from './lib/harness-utils.mjs';

const SKILL_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const ENRICH = path.join(SKILL_ROOT, 'scripts', 'enrich-harness.mjs');
const TEMPLATE_HOOK = path.join(SKILL_ROOT, 'templates', 'pre-commit.sh');
// A comment mentioning core.hooksPath must not count as the block being present, so match
// the command line itself, never the bare keyword.
const ACTIVATION_RE = /^[ \t]*git config core\.hooksPath \.githooks/gm;

const lf = (text) => text.replace(/\r\n/g, '\n');
const read = (file) => lf(fs.readFileSync(file, 'utf8'));
const git = (dir, ...args) => execFileSync('git', ['-C', dir, ...args], { encoding: 'utf8' }).trim();

const made = [];
function oldHarness() {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'enrich-hook-'));
  made.push(dir);
  fs.cpSync(path.join(SKILL_ROOT, 'examples', 'react-harness'), dir, { recursive: true });
  fs.rmSync(path.join(dir, '.githooks'), { recursive: true, force: true });
  const init = path.join(dir, 'init.sh');
  const stripped = read(init).replace(/^if \[ -f \.githooks\/pre-commit \][\s\S]*?^fi\n/m, '');
  assert.equal((stripped.match(ACTIVATION_RE) || []).length, 0, 'fixture still has the activation block');
  fs.writeFileSync(init, stripped);
  git(dir, 'init', '-q');
  return dir;
}

function enrich(dir, ...flags) {
  return execFileSync(process.execPath, [ENRICH, '--target', dir, ...flags], { encoding: 'utf8' });
}

let run = 0;
function check(name, fn) {
  run += 1;
  try {
    const result = fn();
    if (result && typeof result.then === 'function') throw new Error('async check bodies cannot fail here');
    console.log(`  ok   ${name}`);
  } catch (err) {
    console.error(`  FAIL ${name}\n       ${err.message}`);
    process.exitCode = 1;
  }
}

console.log('enrich-harness pre-commit hook step');

check('dry run proposes the hook and writes nothing', () => {
  const dir = oldHarness();
  const before = read(path.join(dir, 'init.sh'));
  const out = enrich(dir);
  assert.match(out, /\.githooks\/pre-commit/);
  assert.equal(fs.existsSync(path.join(dir, '.githooks', 'pre-commit')), false);
  assert.equal(read(path.join(dir, 'init.sh')), before);
});

check('--apply installs hook + activation even on a full-score harness', () => {
  const dir = oldHarness();
  const out = enrich(dir, '--apply');
  assert.match(out, /No gaps found/, 'fixture was expected to score 100 — the case this feature exists for');
  assert.equal(read(path.join(dir, '.githooks', 'pre-commit')), read(TEMPLATE_HOOK));
  const init = read(path.join(dir, 'init.sh'));
  assert.equal((init.match(ACTIVATION_RE) || []).length, 1);
  assert.ok(init.indexOf('set -e') < init.indexOf('core.hooksPath'), 'block must come after set -e');
  execFileSync('bash', ['-n', path.join(dir, 'init.sh')]);
});

check('a second --apply changes nothing', () => {
  const dir = oldHarness();
  enrich(dir, '--apply');
  const init = read(path.join(dir, 'init.sh'));
  const out = enrich(dir, '--apply');
  assert.equal(read(path.join(dir, 'init.sh')), init);
  assert.doesNotMatch(out, /INSTALLED|ADDED/);
});

check('an existing (possibly customised) hook is never overwritten', () => {
  const dir = oldHarness();
  fs.mkdirSync(path.join(dir, '.githooks'));
  fs.writeFileSync(path.join(dir, '.githooks', 'pre-commit'), '#!/bin/sh\n# custom\n');
  enrich(dir, '--apply');
  assert.equal(read(path.join(dir, '.githooks', 'pre-commit')), '#!/bin/sh\n# custom\n');
  assert.equal((read(path.join(dir, 'init.sh')).match(ACTIVATION_RE) || []).length, 1);
});

check('another hook manager (core.hooksPath=.husky) is left alone, with a warning', () => {
  const dir = oldHarness();
  git(dir, 'config', 'core.hooksPath', '.husky');
  const before = read(path.join(dir, 'init.sh'));
  const out = enrich(dir, '--apply');
  assert.match(out, /\.husky/);
  assert.equal(fs.existsSync(path.join(dir, '.githooks', 'pre-commit')), false);
  assert.equal(read(path.join(dir, 'init.sh')), before);
});

check('the activation block sets core.hooksPath only when unset', () => {
  const dir = oldHarness();
  fs.mkdirSync(path.join(dir, '.githooks'));
  fs.writeFileSync(path.join(dir, '.githooks', 'pre-commit'), '#!/bin/sh\n');
  execFileSync('bash', ['-c', HOOKS_BLOCK], { cwd: dir });
  assert.equal(git(dir, 'config', '--get', 'core.hooksPath'), '.githooks');
  git(dir, 'config', 'core.hooksPath', '.husky');
  execFileSync('bash', ['-c', HOOKS_BLOCK], { cwd: dir, stdio: 'pipe' });
  assert.equal(git(dir, 'config', '--get', 'core.hooksPath'), '.husky', 'block clobbered another hook manager');
});

for (const dir of made) fs.rmSync(dir, { recursive: true, force: true });
console.log(`${run} checks`);
