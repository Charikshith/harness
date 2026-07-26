import { existsSync } from 'node:fs';
import { access, appendFile, chmod, copyFile, mkdir, readFile, readdir, stat, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

export const SKILL_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
export const TEMPLATE_DIR = path.join(SKILL_ROOT, 'templates');
export const STRUCTURAL_SUBSYSTEMS = ['instructions', 'state', 'verification', 'scope', 'lifecycle'];
export const SUBSYSTEMS = [...STRUCTURAL_SUBSYSTEMS, 'memory', 'behavioral'];

// Display labels for non-structural subsystems. Module scope so it is allocated once.
const SECTION_LABELS = { memory: 'Memory & Curation', behavioral: 'Behavioral Policies' };

export function parseArgs(argv) {
  const args = { _: [] };
  for (let i = 0; i < argv.length; i += 1) {
    const token = argv[i];
    if (!token.startsWith('--')) {
      args._.push(token);
      continue;
    }
    const [rawKey, inlineValue] = token.slice(2).split('=', 2);
    const key = rawKey.replace(/-([a-z])/g, (_, letter) => letter.toUpperCase());
    if (inlineValue !== undefined) {
      args[key] = inlineValue;
    } else if (argv[i + 1] && !argv[i + 1].startsWith('--')) {
      args[key] = argv[i + 1];
      i += 1;
    } else {
      args[key] = true;
    }
  }
  return args;
}

export async function exists(filePath) {
  try {
    await access(filePath);
    return true;
  } catch {
    return false;
  }
}

export async function readText(filePath) {
  return readFile(filePath, 'utf8');
}

export async function readJson(filePath) {
  return JSON.parse(await readText(filePath));
}

export async function writeText(filePath, contents) {
  await mkdir(path.dirname(filePath), { recursive: true });
  await writeFile(filePath, contents, 'utf8');
}

export async function copyTemplate(templateName, targetPath, replacements = {}, { force = false } = {}) {
  if (!force && await exists(targetPath)) {
    return { path: targetPath, status: 'skipped', reason: 'exists' };
  }

  let contents = await readText(path.join(TEMPLATE_DIR, templateName));
  for (const [key, value] of Object.entries(replacements)) {
    contents = contents.split(`{{${key}}}`).join(value);
  }
  await writeText(targetPath, contents);
  if (templateName.endsWith('.sh')) {
    await chmod(targetPath, 0o755);
  }
  return { path: targetPath, status: 'written' };
}

export function detectPackageManager(root, explicit) {
  if (explicit) return explicit;
  if (existsSync(path.join(root, 'bun.lockb')) || existsSync(path.join(root, 'bun.lock'))) return 'bun';
  if (existsSync(path.join(root, 'pnpm-lock.yaml'))) return 'pnpm';
  if (existsSync(path.join(root, 'yarn.lock'))) return 'yarn';
  return 'npm';
}

export async function detectProject(root) {
  const files = await listFiles(root, { maxFiles: 800 });
  const has = (name) => files.some((file) => file === name || file.endsWith(`/${name}`));
  const hasPrefix = (prefix) => files.some((file) => file.startsWith(prefix));
  const packageJsonPath = path.join(root, 'package.json');
  const packageJson = await exists(packageJsonPath).then((ok) => ok ? readJson(packageJsonPath) : null);

  let stack = 'generic';
  if (packageJson) {
    const deps = { ...packageJson.dependencies, ...packageJson.devDependencies };
    if (deps.react || hasPrefix('src/renderer')) stack = 'typescript-react';
    else if (deps.typescript || has('tsconfig.json')) stack = 'typescript';
    else stack = 'node';
  } else if (has('pyproject.toml') || has('requirements.txt')) {
    stack = 'python';
  } else if (has('go.mod')) {
    stack = 'go';
  } else if (has('Cargo.toml')) {
    stack = 'rust';
  } else if (has('pom.xml')) {
    stack = 'java-maven';
  } else if (has('build.gradle') || has('build.gradle.kts')) {
    stack = 'java-gradle';
  } else if (files.some((file) => file.endsWith('.csproj') || file.endsWith('.sln'))) {
    stack = 'dotnet';
  }

  return {
    root,
    stack,
    packageJson,
    files,
    packageManager: detectPackageManager(root)
  };
}

export async function listFiles(root, { maxFiles = 1000 } = {}) {
  const ignored = new Set(['.git', 'node_modules', 'dist', 'build', '.next', '.venv', 'venv', '__pycache__']);
  const results = [];

  async function walk(current, relative) {
    if (results.length >= maxFiles) return;
    let entries = [];
    try {
      entries = await readdir(current, { withFileTypes: true });
    } catch {
      return;
    }
    for (const entry of entries) {
      if (results.length >= maxFiles) return;
      if (ignored.has(entry.name)) continue;
      const rel = relative ? `${relative}/${entry.name}` : entry.name;
      const full = path.join(current, entry.name);
      if (entry.isDirectory()) {
        await walk(full, rel);
      } else if (entry.isFile()) {
        results.push(rel);
      }
    }
  }

  await walk(root, '');
  return results.sort();
}

export function verificationCommands(project, explicitPackageManager) {
  const pm = explicitPackageManager || project.packageManager || 'npm';
  const scripts = project.packageJson?.scripts ?? {};
  const run = (script) => {
    if (pm === 'npm') return `npm run ${script}`;
    if (pm === 'yarn') return `yarn ${script}`;
    return `${pm} run ${script}`;
  };

  if (project.stack === 'python') {
    const py = 'python3';
    return [
      `${py} -m pytest || [ $? -eq 5 ]`,
      `${py} -m compileall -q -x '(^|/)(\\.?venv|env|node_modules|build|dist|__pycache__)(/|$)' .`
    ];
  }

  if (project.stack === 'go') return ['go test ./...'];
  if (project.stack === 'rust') return ['cargo test'];
  if (project.stack === 'java-maven') return ['mvn test'];
  if (project.stack === 'java-gradle') return ['./gradlew test'];
  if (project.stack === 'dotnet') return ['dotnet test'];

  if (!project.packageJson) {
    return [
      'echo "No package manifest detected; replace this line with your project verification command."'
    ];
  }

  const install = pm === 'npm'
    ? 'npm install'
    : pm === 'yarn'
      ? 'yarn install'
      : `${pm} install`;
  const candidates = [
    scripts.check ? run('check') : null,
    scripts.typecheck ? run('typecheck') : null,
    scripts['type-check'] ? run('type-check') : null,
    scripts.lint ? run('lint') : null,
    scripts.test ? (pm === 'npm' ? 'npm test' : `${pm} test`) : null,
    scripts.build ? run('build') : null
  ].filter(Boolean);

  return [install, ...dedupe(candidates)];
}

// Kept in sync with the same block in templates/init.sh. create-harness.mjs writes a
// generated init.sh via initScriptFromCommands() and never copies that template, so a
// change made only there would never reach a scaffolded project — the environment check
// would then be unsatisfiable by construction for every project the scaffolder creates.
const ENV_CONTRACT_BLOCK = `# Environment contract runs before anything else and reports separately from test output:
# a missing tool is not a failing test, and conflating the two sends the next session
# debugging code that was never broken.
if [ -f environment.md ]; then
  echo "=== Environment contract ==="
  ENV_FAILED=0
  while IFS='|' read -r _ requirement check _; do
    requirement="$(echo "$requirement" | sed 's/^ *//;s/ *$//')"
    check="$(echo "$check" | sed 's/^ *//;s/ *$//;s/^\`//;s/\`$//')"
    case "$requirement" in ''|Requirement|---*) continue ;; esac
    [ -z "$check" ] && continue
    if eval "$check" >/dev/null 2>&1; then
      echo "  PASS  $requirement"
    else
      echo "  FAIL  $requirement   (check: $check)"
      ENV_FAILED=$((ENV_FAILED + 1))
    fi
  done < environment.md
  if [ "$ENV_FAILED" -gt 0 ]; then
    echo "Environment contract failed ($ENV_FAILED unmet). This is the machine, not the code."
    exit 1
  fi
fi`;

export function initScriptFromCommands(commands) {
  const body = commands.map((command) => `echo "=== ${escapeForEcho(command)} ==="\n${command}`).join('\n\n');
  return `#!/bin/bash
set -e

echo "=== Harness Initialization ==="

${ENV_CONTRACT_BLOCK}

${body}

echo "=== Verification Complete ==="
echo ""
echo "Next steps:"
echo "1. Read feature_list.json to see current feature state"
echo "2. Pick ONE unfinished feature to work on"
echo "3. Implement only that feature"
echo "4. Re-run verification before claiming done"
`;
}

function escapeForEcho(value) {
  return value.replaceAll('"', '\\"');
}

export function dedupe(values) {
  return [...new Set(values)];
}

// killRate is passed in rather than computed here on purpose. Measuring it means copying
// the project and executing init.sh, which would make scoreHarness async and impure and
// would put a multi-second subprocess run behind every routine --json call. Callers that
// want it run mutate-gate.mjs themselves and hand the summary in; everyone else gets a
// vacuously-passing check and an identical score to before this existed.
export function scoreHarness(files, { killRate } = {}) {
  const byPath = new Map(files.map((file) => [file.path, file.content]));
  // Memory artifacts are excluded from allText on purpose. They are agent-written
  // free text, so letting them feed the corpus-wide checks lets memory content
  // satisfy unrelated subsystems — e.g. the word "Evidence" in a dream-queue table
  // header would pass verification's "evidence is recorded" check for free.
  const allText = files
    .filter((file) => !file.path.startsWith('memory/'))
    .map((file) => `${file.path}\n${file.content}`).join('\n\n');
  const agents = byPath.get('AGENTS.md') || byPath.get('CLAUDE.md') || '';
  const featureList = byPath.get('feature_list.json') || byPath.get('feature-list.json') || '';
  const progress = byPath.get('progress.md') || '';
  const init = byPath.get('init.sh') || '';
  const handoff = byPath.get('session-handoff.md') || '';
  const environment = byPath.get('environment.md') || '';
  const memoryIndex = byPath.get('memory/index.md') || '';
  const memoryJournal = byPath.get('memory/journal.md') || '';
  const memoryGraveyard = byPath.get('memory/graveyard.md') || '';
  const dreamQueue = byPath.get('dream-queue.md') || '';
  // graveyard.md is not a lesson and is deliberately not linked from the index, so it
  // must be excluded here or memoryLinksIntact reports it as orphaned. Measured before
  // this line existed: scaffolding graveyard.md dropped memory 4/5 -> 3/5, overall
  // 97 -> 94. Any future non-lesson artifact added under memory/ needs the same entry.
  const memoryTopics = files.filter((file) =>
    file.path.startsWith('memory/') &&
    !['memory/index.md', 'memory/journal.md', 'memory/graveyard.md'].includes(file.path));

  const checks = {
    instructions: [
      hasFile(byPath, ['AGENTS.md', 'CLAUDE.md'], 'Agent instruction file exists'),
      structuredHas(agents, ['Startup Workflow', 'Before writing code'], 'Startup workflow documented'),
      structuredHas(agents, ['Definition of Done', 'done only when'], 'Definition of done documented'),
      structuredHas(agents, ['Verification Commands', './init.sh', 'test', 'verify'], 'Verification commands discoverable'),
      structuredHas(agents, ['feature_list.json', 'progress.md'], 'State artifacts routed from instructions')
    ],
    state: [
      hasFile(byPath, ['feature_list.json', 'feature-list.json'], 'Feature tracker exists'),
      jsonFeatureList(featureList, 'Feature tracker is valid and has feature fields'),
      hasFile(byPath, ['progress.md'], 'Progress log exists'),
      structuredHas(progress, ['Current State', 'What', 'Next'], 'Progress log supports restart'),
      structuredHas(handoff || progress, ['Blockers', 'Files', 'Next Session'], 'Handoff captures blockers/files/next step')
    ],
    verification: [
      hasFile(byPath, ['init.sh'], 'Verification entrypoint exists'),
      textHas(init, ['set -e'], 'Verification fails fast'),
      textHas(init + agents, ['test', 'pytest', 'vitest', 'cargo test', 'go test', 'dotnet test'], 'Test command documented'),
      textHas(init + agents, ['build', 'type', 'lint', 'compile'], 'Static/build check documented'),
      textHas(allText, ['Evidence', 'Verification Evidence', 'command and output'], 'Verification evidence is recorded'),
      entrypointExecutesSomething(init, 'Entrypoint actually runs a command'),
      environmentContractHonoured(environment, init, 'Declared environment preconditions are checked by the entrypoint'),
      gateCatchesBreakage(killRate, 'Gate demonstrably catches known breakage')
    ],
    scope: [
      structuredHas(agents, ['One feature at a time', 'one-feature-at-a-time'], 'One-feature-at-a-time rule exists'),
      textHas(featureList, ['dependencies'], 'Feature dependencies are tracked'),
      textHas(agents + featureList, ['status'], 'Feature status is explicit'),
      structuredHas(agents, ['Stay in scope', 'scope'], 'Scope boundary documented'),
      structuredHas(agents, ['Definition of Done'], 'Completion gate limits scope closure'),
      hasFile(byPath, ['open-work.md'], 'Recruitable open-work surface exists')
    ],
    lifecycle: [
      hasFile(byPath, ['init.sh'], 'Startup script exists'),
      structuredHas(agents, ['End of Session', 'Before ending'], 'End-of-session procedure exists'),
      hasFile(byPath, ['session-handoff.md'], 'Session handoff template exists'),
      structuredHas(progress + '\n' + handoff, ['Last Updated', 'Current Objective', 'Recommended Next Step'], 'Session restart markers exist'),
      textHas(agents + init, ['restartable', 'clean', 'Next steps'], 'Clean restart path documented')
    ],
    // Memory checks inspect the store, not the prose describing it. Keyword checks
    // are used only where the thing being verified genuinely is a documented rule,
    // and even then the needles are specific enough not to match unrelated text
    // ("two-step save" not "two-step"; "curation cadence" not "cadence").
    memory: [
      hasFile(byPath, ['memory/index.md'], 'Memory index exists'),
      memoryIndexUsable(memoryIndex, 'Memory index is initialised and within its cap'),
      memoryLinksIntact(memoryIndex, memoryTopics, 'Memory links intact (no dangling or orphaned entries)'),
      hasFile(byPath, ['memory/journal.md'], 'Curation input exists (session journal)'),
      structuredHas(
        agents,
        ['two-step save', 'one-line pointer to'],
        'Two-step save invariant documented'
      ),
      structuredHas(
        agents + '\n' + dreamQueue,
        ['curation cadence', 'every ~10 sessions', 'propose, never apply'],
        'Curation cadence and human gate documented'
      ),
      graveyardWellFormed(memoryGraveyard, 'Graveyard entries carry a cause and an expiry condition')
    ],
    behavioral: [
      structuredHas(agents, ['Coding Policy', 'ladder', 'YAGNI', 'standard library', 'one line'], 'Coding minimalism policy (Ponytail ladder) present'),
      structuredHas(agents, ['no abstractions', 'minimum code', 'speculative', 'Deletion over addition'], 'Coding standards (no over-engineering) documented'),
      structuredHas(agents, ['Editing Discipline', 'Touch only', 'match the existing style', 'surgical'], 'Surgical editing discipline documented'),
      textHas(agents, ['reproduction test was written FIRST', 'write the verification check FIRST', 'test-first', 'test first'], 'Test-first verification gate present'),
      structuredHas(agents, ['Before Multi-Step Work', 'success criterion', 'verify'], 'Multi-step planning with verify-per-step documented'),
      structuredHas(agents, ['state your understanding', 'stop and ask', 'ambiguity'], 'Proactive assumption surfacing documented'),
      structuredHas(agents, ['Safety (Never Simplify Away)', 'Never simplify away'], 'Safety carve-outs documented'),
      structuredHas(agents, ['over-specified', 'question whether the spec'], 'Over-specified requirements escalation documented')
    ]
  };

  const subsystems = Object.fromEntries(Object.entries(checks).map(([name, subsystemChecks]) => {
    const passed = subsystemChecks.filter((check) => check.pass).length;
    const score = Math.max(1, Math.round((passed / subsystemChecks.length) * 5));
    return [name, {
      score,
      passed,
      total: subsystemChecks.length,
      checks: subsystemChecks
    }];
  }));

  const total = Object.values(subsystems).reduce((sum, item) => sum + item.score, 0);
  const overall = Math.round((total / (SUBSYSTEMS.length * 5)) * 100);
  const ranked = Object.entries(subsystems).sort((a, b) => a[1].score - b[1].score);
  // Tie-break toward structural subsystems. Memory is new, so nearly every existing
  // harness scores 1 on it and would otherwise win this sort forever — hiding a
  // genuinely broken verification or lifecycle behind a scaffolding gap.
  const ranked2 = [...ranked].sort((a, b) => {
    if (a[1].score !== b[1].score) return a[1].score - b[1].score;
    const aStructural = STRUCTURAL_SUBSYSTEMS.includes(a[0]) ? 0 : 1;
    const bStructural = STRUCTURAL_SUBSYSTEMS.includes(b[0]) ? 0 : 1;
    return aStructural - bStructural;
  });
  const bottleneck = ranked2[0][1].score === 5 ? null : ranked2[0][0];
  // Anything else at or below 2 is also worth naming, so one low subsystem cannot
  // make the others invisible.
  const alsoLow = ranked2.slice(1)
    .filter(([, item]) => item.score <= 2)
    .map(([name, item]) => `${name} (${item.score}/5)`);
  return { overall, bottleneck, alsoLow, subsystems };
}

// Checks keep `message` stable for GAP_FIXES lookups; `detail` carries the variable
// part and is appended only at render time.
function formatCheck(check) {
  return check.detail ? `${check.message} — ${check.detail}` : check.message;
}

function hasFile(byPath, names, message) {
  return { pass: names.some((name) => byPath.has(name)), message };
}

function textHas(text, needles, message) {
  const lower = text.toLowerCase();
  return { pass: needles.some((needle) => lower.includes(needle.toLowerCase())), message };
}

function structuredText(markdown) {
  const kept = [];
  let inFence = false;
  for (const raw of markdown.split(/\r?\n/)) {
    const line = raw.trim();
    if (/^(```|~~~)/.test(line)) { inFence = !inFence; continue; }
    if (inFence) { kept.push(line); continue; }
    if (!line) continue;
    const isHeading = /^#{1,6}\s/.test(line);
    const isList = /^([-*+]|\d+\.)\s/.test(line);
    const isTable = line.startsWith('|');
    const isBoldLead = /^\*\*[^*]+\*\*/.test(line);
    if (isHeading || isList || isTable || isBoldLead) kept.push(line);
  }
  return kept.join('\n');
}

function structuredHas(markdown, needles, message) {
  return textHas(structuredText(markdown), needles, message);
}

// --- Memory artifact checks -------------------------------------------------
// These inspect the store itself. A keyword check can be satisfied by pasting
// vocabulary into AGENTS.md; these cannot.

const MEMORY_INDEX_MAX_LINES = 200;
const MEMORY_INDEX_MAX_BYTES = 25 * 1024;

// Matches any markdown link to a .md file: [title](target.md)
const MEMORY_LINK_RE = /\]\(\s*([^)\s]+\.md)\s*\)/g;

function memoryIndexLinks(indexText) {
  const out = new Set();
  // Strip HTML comments first. The index template documents its own row format
  // inside a comment, and those examples are not real pointers.
  const body = indexText.replace(/<!--[\s\S]*?-->/g, '');
  for (const match of body.matchAll(MEMORY_LINK_RE)) {
    const normalised = match[1].replace(/^\.\//, '').replace(/^memory\//, '');
    if (normalised.includes('..')) continue;
    // A topic pointer is a sibling file or lives under topics/. Anything with a
    // different path prefix is a cross-reference to another doc, not a lesson.
    const isSibling = !normalised.includes('/');
    if (isSibling || normalised.startsWith('topics/')) out.add(normalised);
  }
  return out;
}

// NOTE: `message` must stay byte-stable — enrich-harness.mjs keys its GAP_FIXES table
// on the exact string. Anything variable goes in `detail`, which reporters append.
function memoryIndexUsable(indexText, message) {
  if (!indexText.trim()) {
    return { pass: false, message, detail: 'index is empty (not even a placeholder)' };
  }
  const lines = indexText.split(/\r?\n/).length;
  const bytes = Buffer.byteLength(indexText, 'utf8');
  if (lines > MEMORY_INDEX_MAX_LINES) {
    return { pass: false, message, detail: `${lines} lines exceeds ${MEMORY_INDEX_MAX_LINES}; curation is overdue` };
  }
  if (bytes > MEMORY_INDEX_MAX_BYTES) {
    return { pass: false, message, detail: `${Math.round(bytes / 1024)}KB exceeds 25KB; curation is overdue` };
  }
  // An index must be recognisably an index: either it holds pointer rows, or it
  // explicitly declares itself empty. A blank file with a title is neither.
  const entries = memoryIndexLinks(indexText).size;
  const declaresEmpty = /no lessons recorded yet|_none_|_empty_/i.test(indexText);
  if (!entries && !declaresEmpty) {
    return { pass: false, message, detail: 'no pointer rows and no explicit "no lessons yet" marker' };
  }
  return { pass: true, message, detail: `${lines} lines, ${entries} entries` };
}

function memoryLinksIntact(indexText, topicFiles, message) {
  if (!indexText.trim()) {
    return { pass: false, message, detail: 'no index to check' };
  }
  const linked = memoryIndexLinks(indexText);
  const present = new Set(topicFiles
    .map((file) => file.path.replace(/^memory\//, ''))
    .filter((name) => !name.startsWith('_')));

  const dangling = [...linked].filter((name) => !present.has(name));
  const orphaned = [...present].filter((name) => !linked.has(name));

  if (dangling.length || orphaned.length) {
    const parts = [];
    if (dangling.length) parts.push(`dangling: ${dangling.slice(0, 3).join(', ')}`);
    if (orphaned.length) parts.push(`orphaned: ${orphaned.slice(0, 3).join(', ')}`);
    return { pass: false, message, detail: parts.join('; ') };
  }
  return { pass: true, message, detail: `${linked.size} linked, 0 dangling, 0 orphaned` };
}

// Optional artifact: absence is not penalised, only malformed rows are. A row without a
// Recheck-if is unfalsifiable folklore — it will be obeyed forever or ignored entirely,
// and there is no way to tell which from the file. Column indices are 1-based because
// splitting a leading-pipe markdown row yields an empty cell at 0.
function graveyardWellFormed(graveyardText, message) {
  if (!graveyardText.trim()) {
    return { pass: true, message, detail: 'no graveyard (optional)' };
  }
  const rows = graveyardText.split(/\r?\n/)
    .map((line) => line.split('|').map((cell) => cell.trim()))
    .filter((cells) => cells.length >= 8 && cells[1] && !/^-+$/.test(cells[1])
      && cells[1].toLowerCase() !== 'route');
  if (!rows.length) {
    return { pass: false, message, detail: 'graveyard exists but has no parseable rows' };
  }
  const bad = rows.filter((cells) => !cells[3] || !cells[6]);
  if (bad.length) {
    return {
      pass: false,
      message,
      detail: `${bad.length}/${rows.length} rows missing Because or Recheck-if: ${bad.slice(0, 3).map((cells) => cells[1]).join(', ')}`
    };
  }
  return { pass: true, message, detail: `${rows.length} rows, all with cause and expiry` };
}

// --- Entrypoint substance ---------------------------------------------------
// The two checks above deliberately read `init + agents`: they ask whether a test command
// is *documented*, and documenting it in AGENTS.md is legitimate. Narrowing them to `init`
// would fail every harness that keeps its command list in prose.
//
// But that left nothing asking whether init.sh RUNS anything, so an entrypoint reduced to
// `set -e; exit 0` scored verification 5/5 — measured, on both bundled examples. That is a
// different question, so it gets its own check rather than a redefinition of theirs.
//
// `exit` is excluded on purpose: exiting is not verifying. Comments, blanks, the shebang,
// `set -*`, `echo`, and bare shell control keywords are all scaffolding, not work.
const SHELL_NOISE = /^(set\b|echo\b|exit\b|then$|else$|elif\b|fi$|do$|done$|esac$|case\b|while\b|for\b|if\b|\{$|\}$|;;$|\*\)|\S+\))/;

function entrypointExecutesSomething(initText, message) {
  if (!initText.trim()) {
    return { pass: false, message, detail: 'no entrypoint to inspect' };
  }
  const substantive = initText.split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line && !line.startsWith('#') && !SHELL_NOISE.test(line));

  if (!substantive.length) {
    return { pass: false, message, detail: 'entrypoint contains no command — only echoes, comments or control flow' };
  }
  return { pass: true, message, detail: `${substantive.length} command line(s)` };
}

// --- Verification adversary -------------------------------------------------
// Vacuously true when unmeasured, so every invocation without --mutate scores exactly as
// it did before this check existed. Opt-in for the same reason --log is: the measurement
// copies the project and runs its gate, which is far too expensive for a default.
//
// 0.8 rather than 1.0 because a mutation set is a sample, not a specification. One
// surviving mutant out of six is a gap worth naming in the detail line; it is not
// evidence the gate is decorative.
const KILL_RATE_THRESHOLD = 0.8;

function gateCatchesBreakage(killRate, message) {
  if (killRate === undefined) {
    return { pass: true, message, detail: 'not measured (run with --mutate)' };
  }
  if (killRate.total === 0) {
    return { pass: true, message, detail: 'no applicable mutations for this project type' };
  }
  const percent = Math.round(killRate.rate * 100);
  if (killRate.rate < KILL_RATE_THRESHOLD) {
    return {
      pass: false,
      message,
      detail: `${killRate.killed}/${killRate.total} mutants killed (${percent}%); survived: ${killRate.survivors.join(', ')}`
    };
  }
  return { pass: true, message, detail: `${killRate.killed}/${killRate.total} mutants killed (${percent}%)` };
}

// --- Environment contract ---------------------------------------------------
// Vacuously true when environment.md is absent: the file is optional, so its absence is
// not a defect. Only a declared-but-unchecked contract is — a project that writes down
// its preconditions and then never checks them is worse off than one that never wrote
// them down, because the file reads as a guarantee.
function environmentContractHonoured(environmentText, initText, message) {
  if (!environmentText.trim()) {
    return { pass: true, message, detail: 'no environment.md declared' };
  }
  const rows = environmentText.split(/\r?\n/).filter((line) => {
    const cells = line.split('|').map((cell) => cell.trim());
    return cells.length >= 4 && cells[1] && cells[2]
      && cells[1] !== 'Requirement' && !/^-+$/.test(cells[1]);
  });
  if (!rows.length) {
    return { pass: false, message, detail: 'environment.md has no parseable requirement rows' };
  }
  if (!initText.includes('environment.md')) {
    return { pass: false, message, detail: `${rows.length} requirements declared but init.sh never reads environment.md` };
  }
  return { pass: true, message, detail: `${rows.length} requirements checked by init.sh` };
}

function jsonFeatureList(text, message) {
  try {
    const parsed = JSON.parse(text);
    const valid = Array.isArray(parsed.features) && parsed.features.every((feature) =>
      typeof feature.id === 'string'
      && typeof feature.name === 'string'
      && typeof feature.description === 'string'
      && typeof feature.status === 'string'
    );
    return { pass: valid, message };
  } catch {
    return { pass: false, message };
  }
}

export async function loadHarnessFiles(root) {
  const candidates = [
    'AGENTS.md',
    'CLAUDE.md',
    'feature_list.json',
    'feature-list.json',
    'progress.md',
    'session-handoff.md',
    'init.sh',
    'dream-queue.md',
    // hasFile() reads byPath, which is built only from what this list returned. A check
    // for a file missing from here fails 100% of the time regardless of whether the file
    // exists on disk.
    'environment.md',
    'open-work.md'
  ];
  const files = [];
  for (const candidate of candidates) {
    const fullPath = path.join(root, candidate);
    if (await exists(fullPath)) {
      files.push({ path: candidate, content: await readText(fullPath) });
    }
  }
  files.push(...await loadMemoryFiles(root));
  return files;
}

// Memory lives in a directory, not a fixed filename, so it needs discovery rather
// than a candidate list. Probe the locations the skill has ever recommended and
// canonicalise whichever is found to `memory/...` keys, so scoreHarness has one
// shape to look up regardless of where the store physically sits.
export async function isDirectory(target) {
  try {
    return (await stat(target)).isDirectory();
  } catch {
    return false;
  }
}

const MEMORY_DIR_CANDIDATES = ['memory', '.agents/memory', '.claude/memory'];
const MEMORY_MAX_FILES = 200;

export async function loadMemoryFiles(root) {
  for (const dir of MEMORY_DIR_CANDIDATES) {
    const indexPath = path.join(root, dir, 'index.md');
    if (!await exists(indexPath)) continue;

    const files = [{ path: 'memory/index.md', content: await readText(indexPath) }];
    const seen = new Set(['index.md']);

    for (const sub of ['.', 'topics']) {
      let entries = [];
      try {
        entries = await readdir(path.join(root, dir, sub), { withFileTypes: true });
      } catch { continue; }
      for (const entry of entries.sort((a, b) => a.name.localeCompare(b.name))) {
        if (!entry.isFile() || !entry.name.endsWith('.md')) continue;
        // Key on the bare filename so index links like (topics/x.md) and (x.md)
        // both resolve, whichever layout the project chose.
        if (seen.has(entry.name) || files.length >= MEMORY_MAX_FILES) continue;
        seen.add(entry.name);
        files.push({
          path: `memory/${entry.name}`,
          content: await readText(path.join(root, dir, sub, entry.name))
        });
      }
    }
    return files;
  }
  return [];
}

// --- Longitudinal telemetry -------------------------------------------------
// Deliberately NOT wired into any check, and it must stay that way. A trend can say "this
// got worse"; it cannot say "this is unacceptable", because acceptable is contextual — a
// prototype decaying is fine, a production repo decaying is not. Wire a trend to an exit
// code and the cheapest way to go green becomes "stop measuring honestly".
//
// Append-only, never read-modify-write: a corrupted tail must cost one line, not the whole
// history. The reader (phase 1) parses defensively and skips unparseable lines.
//
// .jsonl and not .md on purpose — loadMemoryFiles filters on .md, so this file is invisible
// to the memory checks and cannot be mistaken for a lesson or reported as orphaned.
export async function appendAuditEntry(root, result) {
  const line = JSON.stringify({
    at: new Date().toISOString(),
    overall: result.overall,
    bottleneck: result.bottleneck,
    subsystems: Object.fromEntries(
      Object.entries(result.subsystems).map(([name, item]) => [name, item.score])
    )
  }) + '\n';
  const logPath = path.join(root, 'memory', 'audit-log.jsonl');
  await mkdir(path.dirname(logPath), { recursive: true });
  await appendFile(logPath, line, 'utf8');
  return logPath;
}

export function formatScoreReport(result, root = '.') {
  const lines = [
    `Harness validation for ${root}`,
    `Overall: ${result.overall}/100`,
    `Bottleneck: ${result.bottleneck ?? 'none — all subsystems at full score'}`,
    ...(result.alsoLow?.length ? [`Also low: ${result.alsoLow.join(', ')}`] : []),
    ''
  ];

  // Structural subsystems first, then behavioral
  const structuralOrder = ['instructions', 'state', 'verification', 'scope', 'lifecycle'];
  for (const name of structuralOrder) {
    const subsystem = result.subsystems[name];
    if (!subsystem) continue;
    lines.push(`${name}: ${subsystem.score}/5 (${subsystem.passed}/${subsystem.total})`);
    for (const check of subsystem.checks) {
      lines.push(`  ${check.pass ? 'PASS' : 'FAIL'} ${formatCheck(check)}`);
    }
    lines.push('');
  }

  // Everything that is not structural, in SUBSYSTEMS order. Derived rather than
  // listed, so adding an eighth subsystem needs no change here.
  for (const name of SUBSYSTEMS.filter((item) => !STRUCTURAL_SUBSYSTEMS.includes(item))) {
    const subsystem = result.subsystems[name];
    if (!subsystem) continue;
    lines.push(`${name}: ${subsystem.score}/5 (${subsystem.passed}/${subsystem.total})`);
    for (const check of subsystem.checks) {
      lines.push(`  ${check.pass ? 'PASS' : 'FAIL'} ${formatCheck(check)}`);
    }
    lines.push('');
  }

  return lines.join('\n');
}

export function htmlReport(result, title = 'Harness Assessment') {
  const structuralOrder = ['instructions', 'state', 'verification', 'scope', 'lifecycle'];

  let rows = '';
  for (const name of structuralOrder) {
    const subsystem = result.subsystems[name];
    if (!subsystem) continue;
    rows += renderSubsystemHtml(name, subsystem);
  }
  // Non-structural subsystems, derived from SUBSYSTEMS order. One separator for the
  // whole group, not one per subsystem.
  const extras = SUBSYSTEMS.filter((item) =>
    !STRUCTURAL_SUBSYSTEMS.includes(item) && result.subsystems[item]);
  if (extras.length) rows += `<section class="subsystem-separator"></section>`;
  for (const name of extras) {
    rows += renderSubsystemHtml(name, result.subsystems[name]);
  }

  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${escapeHtml(title)}</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; margin: 32px; color: #172026; background: #f7f8fa; }
    main { max-width: 960px; margin: 0 auto; }
    header { margin-bottom: 24px; }
    h1 { margin: 0 0 8px; font-size: 32px; }
    .summary { display: flex; gap: 16px; flex-wrap: wrap; margin: 20px 0; }
    .metric { background: white; border: 1px solid #d9dee5; border-radius: 8px; padding: 16px 18px; min-width: 180px; }
    .metric strong { display: block; font-size: 28px; margin-top: 4px; }
    section { background: white; border: 1px solid #d9dee5; border-radius: 8px; margin: 14px 0; padding: 16px 18px; }
    h2 { margin: 0 0 10px; font-size: 20px; display: flex; justify-content: space-between; }
    ul { margin: 0; padding-left: 20px; }
    li { margin: 6px 0; }
    .pass { color: #126c43; }
    .fail { color: #a23020; }
    .subsystem-separator { background: transparent; border: none; margin: 4px 0; }
    .section-label { font-size: 12px; text-transform: uppercase; letter-spacing: 0.5px; color: #6b7280; margin-bottom: 8px; }
  </style>
</head>
<body>
  <main>
    <header>
      <h1>${escapeHtml(title)}</h1>
      <p>Five structural subsystems + memory &amp; curation + behavioral policies. v3 harness assessment.</p>
      <div class="summary">
        <div class="metric">Overall<strong>${result.overall}/100</strong></div>
        <div class="metric">Bottleneck<strong>${escapeHtml(result.bottleneck ?? 'none')}</strong></div>
      </div>
    </header>
    ${rows}
  </main>
</body>
</html>
`;
}

function renderSubsystemHtml(name, subsystem) {
  const checks = subsystem.checks.map((check) =>
    `<li class="${check.pass ? 'pass' : 'fail'}">${check.pass ? 'PASS' : 'FAIL'} ${escapeHtml(formatCheck(check))}</li>`
  ).join('');
  const label = SECTION_LABELS[name]
    ? `<div class="section-label">${escapeHtml(SECTION_LABELS[name])}</div>`
    : '';
  return `<section>
    <h2>${escapeHtml(name)} <span>${subsystem.score}/5</span></h2>
    ${label}
    <ul>${checks}</ul>
  </section>`;
}

function escapeHtml(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

export async function copyFileSafe(source, target, { force = false } = {}) {
  if (!force && await exists(target)) {
    return { path: target, status: 'skipped', reason: 'exists' };
  }
  await mkdir(path.dirname(target), { recursive: true });
  await copyFile(source, target);
  return { path: target, status: 'written' };
}

// A single subsystem is worth at most 5/35 (~14%), so total failure of one cannot by
// itself drop the percentage out of the top band. Gate on the weakest subsystem too,
// otherwise a harness can report a 0-scoring mandatory subsystem and "production" in
// the same breath.
function weakestSubsystemScore(result) {
  const scores = Object.values(result.subsystems || {}).map((item) => item.score);
  return scores.length ? Math.min(...scores) : 0;
}

export function usabilityTierLabel(result) {
  const score = result.overall;
  if (score >= 85 && weakestSubsystemScore(result) <= 1) {
    return '⚠️ usable — One subsystem is entirely absent; fix it before multi-session work';
  }
  if (score >= 85) return '✅ production — Ready for multi-session agent work';
  if (score >= 60) return '⚠️ usable — Works for single sessions; gaps in handoff and state';
  if (score >= 30) return '🔶 degraded — Agent has basic instructions but will drift across sessions';
  return '❌ insufficient — Agent has no reliable startup path';
}

export function usabilityTier(result) {
  const score = result.overall;
  if (score >= 85 && weakestSubsystemScore(result) <= 1) return 'usable';
  if (score >= 85) return 'production';
  if (score >= 60) return 'usable';
  if (score >= 30) return 'degraded';
  return 'insufficient';
}
