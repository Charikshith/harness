#!/usr/bin/env node
// Self-check for the lesson-shape memory check. Run directly: node scripts/lesson-shape.test.mjs
//
// The agent writes lessons directly, with no human gate on that path. Before this check, a
// lesson with no reason and no source scored exactly like a good one — AGENTS.md required a
// **Why:** line, but nothing read the lesson files to see whether they had one.
import assert from 'node:assert/strict';
import { scoreHarness } from './lib/harness-utils.mjs';

const MESSAGE = 'Lessons carry a Why and a Source';

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

function lessonCheck(lessons) {
  const files = [
    { path: 'memory/index.md', content: '# Memory Index\n\n_No lessons recorded yet._\n' },
    ...Object.entries(lessons).map(([name, content]) => ({ path: `memory/${name}`, content }))
  ];
  const found = scoreHarness(files).subsystems.memory.checks.find((c) => c.message === MESSAGE);
  assert.ok(found, `no memory check named "${MESSAGE}"`);
  return found;
}

const GOOD = '# Lesson\n\n**Source:** 2026-09-27 user correction\n\nRule.\n\n**Why:** it broke.\n';

console.log('lesson shape check');

check('no lessons passes (a young store is not a defect)', () => {
  assert.equal(lessonCheck({}).pass, true);
});

check('lesson with Why and **Source:** passes', () => {
  assert.equal(lessonCheck({ 'a.md': GOOD }).pass, true);
});

check('source: in frontmatter counts as a source', () => {
  const lesson = '---\ntype: memory\nsource: 2026-09-13 session, feat-018\n---\n\n**Why:** it broke.\n';
  assert.equal(lessonCheck({ 'a.md': lesson }).pass, true);
});

check('missing Why fails and names the file', () => {
  const result = lessonCheck({ 'a.md': GOOD, 'b.md': '# B\n\n**Source:** a run\n' });
  assert.equal(result.pass, false);
  assert.match(result.detail, /b\.md/);
  assert.doesNotMatch(result.detail, /a\.md/);
});

check('missing Source fails', () => {
  assert.equal(lessonCheck({ 'a.md': '# A\n\n**Why:** it broke.\n' }).pass, false);
});

check('an empty Why line does not count', () => {
  assert.equal(lessonCheck({ 'a.md': '# A\n\n**Source:** a run\n\n**Why:**\n' }).pass, false);
});

check('Why and Source inside an HTML comment do not count', () => {
  const lesson = '# A\n\n<!--\n**Source:** example\n**Why:** example\n-->\n';
  assert.equal(lessonCheck({ 'a.md': lesson }).pass, false);
});

check('underscore-prefixed files are not lessons', () => {
  assert.equal(lessonCheck({ '_draft.md': '# scratch\n' }).pass, true);
});

console.log(`${run} checks`);
