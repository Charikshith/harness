#!/usr/bin/env node
// Self-check: the style checks follow the graveyard pattern — a missing style file is
// fine, a present one must carry rules and be loaded from a startup step. The third case
// is the regression probe: the Optional artifacts bullet names style.md and must not
// count as routing (the v0.4.7 failure shape). Run directly:
// node scripts/style-checks.test.mjs
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { scoreHarness } from './lib/harness-utils.mjs';

const SKILL_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const AGENTS = fs.readFileSync(path.join(SKILL_ROOT, 'templates', 'agents.md'), 'utf8')
  .replace(/\r\n/g, '\n');
const STYLE = fs.readFileSync(path.join(SKILL_ROOT, 'templates', 'style.md'), 'utf8')
  .replace(/\r\n/g, '\n');

const USABLE = 'Style rules are usable when present';
const ROUTED = 'Talk style rules routed as a startup step';

function pass(agents, style, message) {
  const files = [{ path: 'AGENTS.md', content: agents }];
  if (style !== undefined) files.push({ path: 'style.md', content: style });
  const found = scoreHarness(files).subsystems.behavioral.checks
    .find((c) => c.message === message);
  assert.ok(found, `no behavioral check named "${message}"`);
  return found.pass;
}

let run = 0;
function check(name, fn) {
  run += 1;
  const result = fn();
  // Synchronous bodies only: an async body turns a failed assertion into an unhandled
  // rejection this runner would report as ok (see memory/async-check-cannot-fail.md).
  if (result && typeof result.then === 'function') {
    throw new Error('check returned a thenable — keep check bodies synchronous');
  }
  console.log(`  ok   ${name}`);
}

console.log('style checks follow the graveyard pattern');
try {
  check('no style file: both checks pass (optional artifact)', () => {
    assert.equal(pass(AGENTS, undefined, USABLE), true);
    assert.equal(pass(AGENTS, undefined, ROUTED), true);
  });
  check('template pair passes: real rules, loaded from startup step 2', () => {
    assert.equal(pass(AGENTS, STYLE, USABLE), true);
    assert.equal(pass(AGENTS, STYLE, ROUTED), true);
  });
  check('an artifacts bullet does not count as routing', () => {
    // Startup step 2 keeps its style.md sentence stripped; the Optional artifacts bullet
    // below still names the file. Routing must fail anyway.
    const unrouted = AGENTS.replace(
      /\. If `harness\/style\.md` exists, read it too and follow it\s+for every reply\./, ''
    );
    assert.notEqual(unrouted, AGENTS, 'template lost its startup style sentence');
    assert.equal(unrouted.includes('`harness/style.md` — Talk rules'), true, 'artifacts bullet should remain');
    assert.equal(pass(unrouted, STYLE, ROUTED), false);
    assert.equal(pass(unrouted, STYLE, USABLE), true);
  });
  check('a rule-less style file fails the usability check', () => {
    assert.equal(pass(AGENTS, '# Talk Rules\n\nTone: friendly.\n', USABLE), false);
    assert.equal(pass(AGENTS, '', USABLE), true); // empty file counts as absent
  });
  check('loadHarnessFiles surfaces style.md end-to-end', () => {
    // The loader whitelists candidates. style.md missing from that list made both checks
    // pass vacuously ("no style file") against projects that had one — a real run, green,
    // measuring nothing. Probe the loader itself, not just scoreHarness.
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'style-'));
    fs.mkdirSync(path.join(dir, 'harness'));
    fs.writeFileSync(path.join(dir, 'AGENTS.md'), AGENTS);
    fs.writeFileSync(path.join(dir, 'harness', 'style.md'), STYLE);
    const utils = pathToFileURL(path.join(SKILL_ROOT, 'scripts', 'lib', 'harness-utils.mjs')).href;
    const probe = `import { loadHarnessFiles } from ${JSON.stringify(utils)};` +
      `const files = await loadHarnessFiles(${JSON.stringify(dir)});` +
      'process.stdout.write(files.map((f) => f.path).join(","));';
    const out = execFileSync(process.execPath, ['--input-type=module', '-e', probe], { encoding: 'utf8' });
    fs.rmSync(dir, { recursive: true, force: true });
    assert.ok(out.split(',').includes('style.md'), `loader did not surface style.md (got: ${out})`);
  });
  console.log(`passed (${run} checks)`);
} catch (err) {
  console.error(`FAIL\n     ${err.message}`);
  process.exitCode = 1;
}
