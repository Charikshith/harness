#!/usr/bin/env node
// Self-check for insertAtAnchor(). Run directly: node scripts/insert-anchor.test.mjs
//
// Every case here is a bug that shipped, not a hypothetical. The first one corrupted a real
// AGENTS.md: the Memory section was anchored on '## Working Rules' and landed on the line
// after the heading, so Working Rules' own bullets ended up below it, reading as Memory's
// content. Nothing failed — the file just said something different from what it meant.
import assert from 'node:assert/strict';
import { insertAtAnchor } from './lib/harness-utils.mjs';

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

console.log('insertAtAnchor()');

check('heading anchor inserts after the section body, not after the heading', () => {
  const doc = [
    '## Working Rules',
    '',
    '- One feature at a time',
    '- Stay in scope',
    '',
    '## Editing Discipline',
    '',
    '- Touch only what the feature requires'
  ].join('\n');

  const out = insertAtAnchor(doc, '## Working Rules', '\n\n## Memory\n\nLessons live here.\n');
  const lines = out.split('\n');

  // The anchored section keeps its own bullets.
  assert.ok(lines.indexOf('- One feature at a time') < lines.indexOf('## Memory'),
    'Working Rules bullets must stay above the inserted section');
  assert.ok(lines.indexOf('- Stay in scope') < lines.indexOf('## Memory'),
    'every bullet must stay above, not just the first');
  // And the new section lands before the next heading.
  assert.ok(lines.indexOf('## Memory') < lines.indexOf('## Editing Discipline'),
    'inserted section must precede the following heading');
});

check('h1 anchor lands under the title prose, not at end of document', () => {
  const doc = [
    '# AGENTS.md',
    '',
    'Project harness for reliable agent-assisted development.',
    '',
    '## Working Rules',
    '',
    '- One feature at a time'
  ].join('\n');

  const out = insertAtAnchor(doc, '# AGENTS.md', '\n\n## Startup Workflow\n\nBefore writing code:\n');
  const lines = out.split('\n');

  assert.ok(lines.indexOf('Project harness for reliable agent-assisted development.')
    < lines.indexOf('## Startup Workflow'), 'title prose must stay above');
  assert.ok(lines.indexOf('## Startup Workflow') < lines.indexOf('## Working Rules'),
    'must land near the top, not pushed past every subsection');
});

check('a "#" comment inside a fenced block is not treated as a heading', () => {
  const doc = [
    '## Verification Commands',
    '',
    '```bash',
    '# Full verification (recommended)',
    './init.sh',
    '```',
    '',
    'Required checks:',
    '',
    '- `npm test`',
    '',
    '## Coding Standards'
  ].join('\n');

  const out = insertAtAnchor(doc, '## Verification Commands', '- `npm run typecheck`');
  const lines = out.split('\n');

  // Must not be spliced into the code sample.
  assert.equal(lines[lines.indexOf('```bash') + 1], '# Full verification (recommended)',
    'the code fence must be left intact');
  assert.ok(lines.indexOf('- `npm run typecheck`') > lines.indexOf('- `npm test`'),
    'bullet joins the end of the section');
  assert.ok(lines.indexOf('- `npm run typecheck`') < lines.indexOf('## Coding Standards'),
    'bullet stays inside its own section');
});

check('inserts once even when the anchor appears more than once', () => {
  const doc = [
    '## Working Rules',
    '',
    '- see "## Working Rules" above',
    '',
    '## Next'
  ].join('\n');

  const out = insertAtAnchor(doc, '## Working Rules', '## Memory');
  assert.equal(out.split('## Memory').length - 1, 1, 'exactly one copy inserted');
});

check('non-heading anchor inserts on the following line', () => {
  const doc = ['#!/bin/bash', 'echo hi'].join('\n');
  const out = insertAtAnchor(doc, '#!/bin/bash', 'set -e');
  assert.equal(out, '#!/bin/bash\nset -e\necho hi');
});

check('missing anchor returns null so callers can fall back to appending', () => {
  assert.equal(insertAtAnchor('# Title\n\nBody\n', '## Nope', 'x'), null);
});

check('does not double blank lines around the insertion', () => {
  const doc = ['## A', '', 'body', '', '## B'].join('\n');
  const out = insertAtAnchor(doc, '## A', '## New\n\ntext');
  assert.ok(!/\n\n\n/.test(out), `no blank-line runs, got:\n${JSON.stringify(out)}`);
});

if (process.exitCode) {
  console.error(`\n${run} checks run, failures above.`);
} else {
  console.log(`\n${run} checks passed.`);
}
