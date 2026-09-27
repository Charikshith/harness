#!/usr/bin/env node
// Self-check: a section check must fail when its section is gone. Run directly:
// node scripts/section-checks.test.mjs
//
// These checks pass on any one of several needles. Two of them carried a needle generic
// enough that other sections supplied it — "one line" (startup step 8) and "verify"
// (startup step 4) — so this repo's own AGENTS.md scored 100 for months with neither
// section present, and enrich-harness never inserted them because nothing failed.
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { scoreHarness } from './lib/harness-utils.mjs';

const SKILL_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const TEMPLATE = fs.readFileSync(path.join(SKILL_ROOT, 'templates', 'agents.md'), 'utf8')
  .replace(/\r\n/g, '\n');

const CASES = [
  { heading: '## Coding Policy', message: 'Coding minimalism policy (Ponytail ladder) present' },
  { heading: '## Before Multi-Step Work', message: 'Multi-step planning with verify-per-step documented' }
];

// Cut from the heading to the next level-2 heading outside a code fence — the Multi-Step
// section holds a "## Plan" line inside a fence that must not end the cut early.
function withoutSection(text, heading) {
  const lines = text.split('\n');
  const out = [];
  let cutting = false;
  let inFence = false;
  for (const line of lines) {
    if (/^(```|~~~)/.test(line.trim())) inFence = !inFence;
    if (!inFence && line.startsWith('## ')) cutting = line.trim() === heading;
    if (!cutting) out.push(line);
  }
  return out.join('\n');
}

function passes(agents, message) {
  const found = scoreHarness([{ path: 'AGENTS.md', content: agents }]).subsystems.behavioral.checks
    .find((c) => c.message === message);
  assert.ok(found, `no behavioral check named "${message}"`);
  return found.pass;
}

let run = 0;
function check(name, fn) {
  run += 1;
  try {
    fn();
    console.log(`  ok   ${name}`);
  } catch (err) {
    console.error(`  FAIL ${name}\n       ${err.message}`);
    process.exitCode = 1;
  }
}

console.log('section checks fail without their section');

for (const { heading, message } of CASES) {
  check(`${heading}: template passes`, () => {
    assert.equal(passes(TEMPLATE, message), true);
  });
  check(`${heading}: template without the section fails`, () => {
    const stripped = withoutSection(TEMPLATE, heading);
    assert.ok(!stripped.includes(heading), 'fixture still contains the heading');
    assert.equal(passes(stripped, message), false, 'check passed on words from other sections');
  });
  // A check that can now fail needs a fix that fires on it. The Multi-Step entry used to be
  // an empty object, so enrich listed the gap and silently did nothing.
  check(`${heading}: enrich --apply restores it`, () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'section-check-'));
    try {
      fs.writeFileSync(path.join(dir, 'AGENTS.md'), withoutSection(TEMPLATE, heading));
      execFileSync(process.execPath, [path.join(SKILL_ROOT, 'scripts', 'enrich-harness.mjs'),
        '--target', dir, '--apply'], { stdio: 'pipe' });
      const repaired = fs.readFileSync(path.join(dir, 'AGENTS.md'), 'utf8');
      assert.equal(passes(repaired, message), true);
      assert.equal(repaired.split(heading).length - 1, 1, `${heading} inserted more than once`);
    } finally {
      fs.rmSync(dir, { recursive: true, force: true });
    }
  });
}

check('enrich inserts the current Before Multi-Step Work wording, not a stale copy', () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'section-check-'));
  try {
    fs.writeFileSync(path.join(dir, 'AGENTS.md'), withoutSection(TEMPLATE, '## Before Multi-Step Work'));
    execFileSync(process.execPath, [path.join(SKILL_ROOT, 'scripts', 'enrich-harness.mjs'),
      '--target', dir, '--apply'], { stdio: 'pipe' });
    const repaired = fs.readFileSync(path.join(dir, 'AGENTS.md'), 'utf8').replace(/\r\n/g, '\n');
    assert.match(repaired, /wait for a "go" before writing any code/);
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
});

console.log(`${run} checks`);
