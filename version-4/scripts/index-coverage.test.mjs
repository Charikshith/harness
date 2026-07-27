#!/usr/bin/env node
// Self-check: every index.md must list every file beside it, and must not link to files
// that do not exist. Run directly: node scripts/index-coverage.test.mjs
//
// This exists because enrich-harness.mjs — one of the seven scripts, and the entire
// retrofit story — was missing from scripts/index.md and nobody noticed. An index is a
// routing table; a missing row means an agent doing progressive disclosure never learns
// the capability exists. Nothing failed, so nothing surfaced it.
//
// Deliberately NOT checked here: whether a frontmatter `timestamp`/`updated` date matches
// the file's last content change. That needs git, and a rename touches every file without
// changing any, so the honest version is more machinery than the drift is worth. Those
// dates are hand-maintained and will drift again.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const SKILL_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

// dir -> which files are expected to have a row. lib/ is nested and listed by path, so it
// is matched on the bare filename like everything else.
//
// evals/ is absent on purpose: its index is a routing table over the cases *inside*
// evals.json, not over files in the directory, so a per-file rule there is meaningless.
// Drift between the two is covered by its own check further down.
const INDEXED = [
  { dir: 'templates', match: (f) => /\.(md|json|sh)$/.test(f) },
  { dir: 'references', match: (f) => f.endsWith('.md') },
  { dir: 'scripts', match: (f) => f.endsWith('.mjs') }
];

let run = 0;
function check(name, fn) {
  run += 1;
  try {
    const result = fn();
    // Reject a thenable outright rather than awaiting it. This runner is synchronous, so an
    // async body would have its assertion failure escape the try/catch and report "ok".
    // Failing loudly here is better than a check that cannot fail.
    if (result && typeof result.then === 'function') {
      throw new Error('check body must be synchronous; an async body cannot fail this runner');
    }
    console.log(`  ok   ${name}`);
  } catch (err) {
    console.error(`  FAIL ${name}\n       ${err.message}`);
    process.exitCode = 1;
  }
}

console.log('index coverage');

for (const { dir, match } of INDEXED) {
  const dirPath = path.join(SKILL_ROOT, dir);
  const indexPath = path.join(dirPath, 'index.md');
  if (!fs.existsSync(indexPath)) continue;
  const index = fs.readFileSync(indexPath, 'utf8');
  const files = fs.readdirSync(dirPath).filter((f) => f !== 'index.md' && match(f));

  check(`${dir}/index.md lists every file`, () => {
    const missing = files.filter((f) => !index.includes(f));
    assert.deepEqual(missing, [], `not listed in ${dir}/index.md: ${missing.join(', ')}`);
  });

  check(`${dir}/index.md has no links to missing files`, () => {
    const targets = [...index.matchAll(/\]\(([^)#]+)\)/g)].map((m) => m[1])
      .filter((t) => !/^(https?:|#)/.test(t) && !t.startsWith('..'));
    const broken = targets.filter((t) => !fs.existsSync(path.join(dirPath, t)));
    assert.deepEqual(broken, [], `${dir}/index.md links to missing: ${broken.join(', ')}`);
  });
}

// Nested library file: listed by path, so the bare-filename scan above cannot see it.
check('scripts/index.md lists lib/harness-utils.mjs', () => {
  const index = fs.readFileSync(path.join(SKILL_ROOT, 'scripts', 'index.md'), 'utf8');
  assert.ok(index.includes('lib/harness-utils.mjs'), 'the shared library has no index row');
});

// The eval index is a routing table over evals.json, so drift there is the same defect.
check('evals/index.md row count and names match evals.json', () => {
  const evals = JSON.parse(fs.readFileSync(path.join(SKILL_ROOT, 'evals', 'evals.json'), 'utf8'));
  const index = fs.readFileSync(path.join(SKILL_ROOT, 'evals', 'index.md'), 'utf8');
  const rows = [...index.matchAll(/^\|\s*(\d+)\s*\|\s*([^|]+?)\s*\|/gm)]
    .map((m) => ({ id: Number(m[1]), name: m[2].trim() }));
  assert.equal(rows.length, evals.evals.length,
    `index has ${rows.length} rows for ${evals.evals.length} evals`);
  for (const row of rows) {
    const actual = evals.evals.find((e) => e.id === row.id);
    assert.ok(actual, `index row ${row.id} has no matching eval`);
    assert.equal(actual.name, row.name, `eval ${row.id} name drift`);
  }
});

// Docs state a denominator in prose; the implementation derives it from SUBSYSTEMS.
// NOT async. check() calls fn() without awaiting, so an async body turns a failed assertion
// into an unhandled rejection and the case reports "ok" no matter what. Caught by probing
// this check with a deliberately wrong denominator, which it cheerfully passed.
check('documented score denominator matches SUBSYSTEMS', () => {
  // Static read rather than import, to keep this file free of side effects.
  const lib = fs.readFileSync(path.join(SKILL_ROOT, 'scripts', 'lib', 'harness-utils.mjs'), 'utf8');
  const structural = lib.match(/STRUCTURAL_SUBSYSTEMS = \[([^\]]+)\]/)[1].split(',').length;
  const extra = lib.match(/SUBSYSTEMS = \[\.\.\.STRUCTURAL_SUBSYSTEMS,([^\]]+)\]/)[1].split(',').length;
  const denominator = (structural + extra) * 5;
  for (const file of ['README.md', 'SKILL.md']) {
    const text = fs.readFileSync(path.join(SKILL_ROOT, file), 'utf8');
    for (const m of text.matchAll(/(?:percentage of|out of) (\d+)/g)) {
      assert.equal(Number(m[1]), denominator,
        `${file} says "${m[0]}" but the implementation scores out of ${denominator}`);
    }
  }
});

// A .json template that does not parse cannot be used for the thing its extension promises.
// templates/feature-list.schema.json carried YAML frontmatter and so was never a usable JSON
// Schema; metadata now lives in a `_meta` key, matching feature-list.json.
check('every .json template parses as JSON', () => {
  const dir = path.join(SKILL_ROOT, 'templates');
  for (const file of fs.readdirSync(dir).filter((f) => f.endsWith('.json'))) {
    try {
      JSON.parse(fs.readFileSync(path.join(dir, file), 'utf8'));
    } catch (err) {
      assert.fail(`templates/${file} is not valid JSON: ${err.message}`);
    }
  }
});

// The validator greps init.sh for the fail-fast flag, so any second occurrence — a comment
// explaining it, most naturally — keeps that check green after the real line is deleted.
// Measured: the mutation gate's drop-fail-fast mutant survived exactly this way, twice.
check('no shipped init.sh mentions the fail-fast flag more than once', () => {
  const candidates = [
    path.join(SKILL_ROOT, 'templates', 'init.sh'),
    ...fs.readdirSync(path.join(SKILL_ROOT, 'examples'), { withFileTypes: true })
      .filter((d) => d.isDirectory())
      .map((d) => path.join(SKILL_ROOT, 'examples', d.name, 'init.sh'))
  ].filter((p) => fs.existsSync(p));

  for (const file of candidates) {
    const hits = (fs.readFileSync(file, 'utf8').match(/set -e/g) || []).length;
    assert.equal(hits, 1,
      `${path.relative(SKILL_ROOT, file)} contains the flag ${hits} times; only the real line may`);
  }
});

// The block lives in both templates/init.sh and initScriptFromCommands(). create-harness
// generates init.sh and never copies the template, so drift between them means scaffolded
// projects and template users get different behaviour.
check('every shipped init.sh reads the environment contract', () => {
  const files = [
    path.join(SKILL_ROOT, 'templates', 'init.sh'),
    ...fs.readdirSync(path.join(SKILL_ROOT, 'examples'), { withFileTypes: true })
      .filter((d) => d.isDirectory())
      .map((d) => path.join(SKILL_ROOT, 'examples', d.name, 'init.sh'))
  ].filter((p) => fs.existsSync(p));

  for (const file of files) {
    assert.ok(fs.readFileSync(file, 'utf8').includes('harness/environment.md'),
      `${path.relative(SKILL_ROOT, file)} never reads harness/environment.md`);
  }
});

// templates/agents.md tells an agent which artifacts are required. If that list disagrees
// with what scoreHarness() actually enforces, the instruction file is lying in whichever
// direction it drifted. Three such mismatches existed before this check:
//   graveyard.md      listed unqualified (reads required), optional in code
//   dream-queue.md    listed unqualified (reads required), not scored at all
//   session-handoff.md  listed "Optional", yet hasFile-checked — following the doc and
//                       deleting it silently cost a lifecycle check
// Covers the bundled examples too, not just the template. They score 100 either way, since
// these labels do not affect scoring — which is exactly why both examples kept the wrong list
// through several passes. A reference example teaching the wrong thing is still wrong.
const AGENT_FILES = [
  path.join('templates', 'agents.md'),
  ...fs.readdirSync(path.join(SKILL_ROOT, 'examples'), { withFileTypes: true })
    .filter((d) => d.isDirectory())
    .map((d) => path.join('examples', d.name, 'AGENTS.md'))
].filter((p) => fs.existsSync(path.join(SKILL_ROOT, p)));

for (const relative of AGENT_FILES) {
check(`${relative.replace(/\\/g, '/')} required/optional groups match what the scorer enforces`, () => {
  const lib = fs.readFileSync(path.join(SKILL_ROOT, 'scripts', 'lib', 'harness-utils.mjs'), 'utf8');
  const agents = fs.readFileSync(path.join(SKILL_ROOT, relative), 'utf8');

  // Artifacts the scorer requires, from every hasFile() candidate list.
  const enforced = new Set();
  for (const m of lib.matchAll(/hasFile\(byPath, \[([^\]]+)\]/g)) {
    for (const raw of m[1].split(',')) enforced.add(raw.trim().replace(/^'|'$/g, ''));
  }

  const section = agents.slice(agents.indexOf('## Required Artifacts'));
  const body = section.slice(0, section.indexOf('\n## ', 4));
  const requiredBlock = body.slice(body.indexOf('**Required**'), body.indexOf('**Optional**'));
  const optionalBlock = body.slice(body.indexOf('**Optional**'));
  assert.ok(requiredBlock && optionalBlock, 'Required/Optional groups not found');

  // Only the artifact each bullet is ABOUT — the backticked path at the start of the line.
  // Matching every backticked filename in the block picks up incidental prose mentions
  // ("checked by `init.sh`" inside the environment.md bullet) and reports them as declared.
  // Compare on bare filenames, since the doc writes harness/-prefixed paths.
  const named = (block) => new Set([...block.matchAll(/^- `(?:harness\/)?([A-Za-z0-9._/-]+\.(?:md|json|sh|jsonl))`/gm)]
    .map((m) => m[1]));
  const inRequired = named(requiredBlock);
  const inOptional = named(optionalBlock);

  // Anything the doc calls optional must not be one the scorer demands.
  const wronglyOptional = [...inOptional].filter((f) => enforced.has(f));
  assert.deepEqual(wronglyOptional, [],
    `listed Optional but hasFile-checked: ${wronglyOptional.join(', ')}`);

  // And every scored artifact must appear in the required group, so nothing enforced is
  // either missing from the list or quietly sitting in the optional one. CLAUDE.md is the
  // documented alternative to AGENTS.md, so either satisfies the instruction-file slot.
  const alternatives = new Set(['CLAUDE.md', 'feature-list.json']);
  const missing = [...enforced]
    .filter((f) => !alternatives.has(f))
    .filter((f) => !inRequired.has(f));
  assert.deepEqual(missing, [], `scored but not in the Required group: ${missing.join(', ')}`);
});
}

if (process.exitCode) {
  console.error(`\n${run} checks run, failures above.`);
} else {
  console.log(`\n${run} checks passed.`);
}
