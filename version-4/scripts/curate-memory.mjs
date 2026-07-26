#!/usr/bin/env node
// Out-of-band memory curation — the "dreaming" pass.
//
// Reads the journal, the lesson store and the graveyard; writes PROPOSALS to dream-queue.md
// and nothing else. It never edits memory/, never edits AGENTS.md, and never applies its own
// suggestions. That is not a limitation to lift later: an agent that can silently rewrite the
// rules it operates under has no reviewable history, and a proposal nobody accepted is
// indistinguishable from one that was.
//
// Of the five curation signals in references/dreaming-pattern.md, only two are countable:
//
//   detectable    recurring-but-unrecorded  (a token recurs in the journal, no lesson exists)
//                 reconsidered              (a graveyard route resurfaces in the journal)
//
//   judgement     two lessons contradict          — needs reading both and deciding
//                 a lesson nothing referenced     — needs read instrumentation that does not
//                                                   exist, and is a documented non-goal
//                 a lesson contradicted by reality— needs knowing current reality
//
// The three judgement signals are reported as an explicit manual checklist rather than
// silently omitted, because a pass that prints only what it can count reads as a pass that
// found everything there was.
import path from 'node:path';
import {
  exists,
  HARNESS_DIR,
  loadMemoryFiles,
  locateHarnessFile,
  resolveMemoryDir,
  parseArgs,
  readText,
  writeText
} from './lib/harness-utils.mjs';

const QUEUE_CAP = 5;
const MIN_PREVALENCE = 2;      // a pattern needs to recur; once is an anecdote
const MIN_TOKEN_LENGTH = 3;

const args = parseArgs(process.argv.slice(2));

if (args.help) {
  console.log(`Usage: node scripts/curate-memory.mjs [--target DIR] [--apply]

Runs an out-of-band curation pass over a harness's memory store.

Reads:   ${HARNESS_DIR}/memory/{journal,index,graveyard}.md and ${HARNESS_DIR}/memory/*.md
Writes:  ${HARNESS_DIR}/dream-queue.md — proposals only, and only with --apply

  (default)   dry run; print proposals and the manual checklist
  --apply     append proposals to the dream queue, respecting the ${QUEUE_CAP}-proposal cap

A harness still using the pre-${HARNESS_DIR}/ flat layout is read and written in place.

Never edits the memory store or AGENTS.md. Curation proposes; a human decides.`);
  process.exit(0);
}

const target = path.resolve(args.target || args._[0] || process.cwd());
const apply = Boolean(args.apply);

const memoryFiles = await loadMemoryFiles(target);
if (!memoryFiles.length) {
  console.error(`No memory store found in ${target} (looked for ${HARNESS_DIR}/memory/index.md).`);
  process.exit(1);
}

const byPath = new Map(memoryFiles.map((file) => [file.path, file.content]));
const journal = byPath.get('memory/journal.md') || '';
const index = byPath.get('memory/index.md') || '';
const graveyard = byPath.get('memory/graveyard.md') || '';
const lessonText = memoryFiles
  .filter((file) => !['memory/journal.md', 'memory/graveyard.md'].includes(file.path))
  .map((file) => file.content).join('\n');

// HTML comments hold format examples in every one of these templates. Matching inside them
// would mine the instructions for evidence — the same trap memoryIndexLinks had to avoid.
const stripComments = (text) => text.replace(/<!--[\s\S]*?-->/g, '');

// Only dated blocks count as entries. Restricting to them excludes the template's own
// "How to write a block" prose without needing a stoplist for it.
function journalBlocks(text) {
  const blocks = [];
  const lines = stripComments(text).split(/\r?\n/);
  let current = null;
  for (const line of lines) {
    const heading = line.match(/^##\s+(\d{4}-\d{2}-\d{2})(.*)$/);
    if (heading) {
      if (current) blocks.push(current);
      current = { date: heading[1], label: heading[2].trim(), body: [] };
    } else if (current && line.startsWith('## ')) {
      blocks.push(current);
      current = null;
    } else if (current) {
      current.body.push(line);
    }
  }
  if (current) blocks.push(current);
  return blocks.map((block) => ({ ...block, body: block.body.join('\n') }));
}

const backticked = (text) => [...text.matchAll(/`([^`\n]+)`/g)]
  .map((match) => match[1].trim())
  .filter((token) => token.length >= MIN_TOKEN_LENGTH);

const blocks = journalBlocks(journal);

if (!blocks.length) {
  console.log(`No dated journal entries in ${path.join(target, await resolveMemoryDir(target), 'journal.md')}.`);
  console.log('Curation has no corpus to read. Accumulate sessions first — a pattern needs');
  console.log('several to exist, and a pass over an empty journal produces opinions.');
  process.exit(0);
}

// --- Signal 1: recurring but unrecorded -------------------------------------
const seenIn = new Map();
for (const block of blocks) {
  for (const token of new Set(backticked(block.body))) {
    if (!seenIn.has(token)) seenIn.set(token, []);
    seenIn.get(token).push(block.date);
  }
}

const queuePath = path.join(target, await locateHarnessFile(target, 'dream-queue.md'));
const queueText = await exists(queuePath) ? await readText(queuePath) : '';

// Deduped against the queue's Open *and* Decided sections. Without this, a token that
// recurs but has no lesson gets re-proposed on every pass — including one a human already
// rejected, which is exactly the loop dream-queue.md's Decided table exists to break.
const alreadyProposed = stripComments(queueText).toLowerCase();
const recorded = stripComments(index + '\n' + lessonText).toLowerCase();
const proposals = [];

for (const [token, dates] of [...seenIn].sort((a, b) => b[1].length - a[1].length)) {
  if (dates.length < MIN_PREVALENCE) continue;
  if (recorded.includes(token.toLowerCase())) continue;
  if (alreadyProposed.includes(token.toLowerCase())) continue;
  proposals.push({
    signal: 'recurring-unrecorded',
    claim: `Add a lesson covering \`${token}\` — it recurs in the journal with no entry in the store`,
    evidence: `journal ${dates.join(', ')}`,
    prevalence: `${dates.length}x`
  });
}

// --- Signal 5: reconsidered -------------------------------------------------
// A graveyard route reappearing means either its prohibition went unread, or its Recheck-if
// quietly came true. Both need a human: one is a discipline problem, the other a stale verdict.
const graveyardRoutes = stripComments(graveyard).split(/\r?\n/)
  .map((line) => line.split('|').map((cell) => cell.trim()))
  .filter((cells) => cells.length >= 8 && cells[1] && !/^-+$/.test(cells[1])
    && cells[1].toLowerCase() !== 'route')
  .map((cells) => ({ route: cells[1], recheck: cells[6] }));

for (const { route, recheck } of graveyardRoutes) {
  if (alreadyProposed.includes(route.toLowerCase())) continue;
  for (const token of backticked(route).concat(route)) {
    const hits = blocks.filter((block) => block.body.toLowerCase().includes(token.toLowerCase()));
    if (!hits.length) continue;
    proposals.push({
      signal: 'reconsidered',
      claim: `Graveyard route ${route} resurfaced — confirm whether "${recheck}" now holds, or raise its Sessions count`,
      evidence: `journal ${hits.map((block) => block.date).join(', ')}; graveyard row exists`,
      prevalence: `${hits.length}x`
    });
    break;
  }
}

// --- Report -----------------------------------------------------------------
const openRows = stripComments(queueText).split(/\r?\n/)
  .filter((line) => /^\|\s*\d+\s*\|/.test(line)).length;
const room = Math.max(0, QUEUE_CAP - openRows);

console.log(`Curation pass over ${target}`);
console.log(`Journal: ${blocks.length} dated entr${blocks.length === 1 ? 'y' : 'ies'} (${blocks[0].date} to ${blocks.at(-1).date})`);
console.log(`Queue: ${openRows} open, ${room} slot(s) free of ${QUEUE_CAP}`);
console.log('');

if (!proposals.length) {
  console.log('No countable signals found. That is a real result, not a gap —');
  console.log('it means nothing recurred often enough to distinguish from noise.');
} else {
  console.log(`${proposals.length} proposal(s) from countable signals:`);
  for (const [i, proposal] of proposals.entries()) {
    console.log(`  ${i + 1}. [${proposal.signal}] ${proposal.claim}`);
    console.log(`     evidence: ${proposal.evidence} (${proposal.prevalence})`);
  }
}

// Volume is the proposer's problem, not the reviewer's — so truncate here, and say so.
const admitted = proposals.slice(0, room);
if (proposals.length > room) {
  console.log('');
  console.log(`Cap: ${proposals.length - room} proposal(s) withheld — the queue holds ${QUEUE_CAP}.`);
  console.log('Decide the open ones first. Review fatigue is what the cap exists to prevent.');
}

console.log('');
console.log('Manual signals — not countable, still required for a complete pass:');
console.log('  [ ] Two lessons that contradict each other (read them; demote or supersede one)');
console.log('  [ ] A lesson nothing has referenced (dead stock; needs your judgement, since');
console.log('      no read instrumentation exists and building it is a documented non-goal)');
console.log('  [ ] A lesson contradicted by current reality (stale and confidently wrong)');

if (!apply) {
  console.log('');
  console.log(`Dry run. ${admitted.length ? `Re-run with --apply to add ${admitted.length} proposal(s) to dream-queue.md.` : 'Nothing to add.'}`);
  process.exit(0);
}

if (!admitted.length) {
  console.log('');
  console.log('Nothing to write.');
  process.exit(0);
}

// --- Apply: dream-queue.md only ---------------------------------------------
// The single write this script performs. memory/ and AGENTS.md are never opened for writing
// anywhere in this file — that is the propose-never-apply boundary, enforced structurally.
const rows = admitted.map((proposal, i) =>
  `| ${openRows + i + 1} | ${proposal.claim} | ${proposal.evidence} | ${proposal.prevalence} | pending |`);

// Insertion is confined to the Open section, and within it to the region before any HTML
// comment. The template documents its row format in a trailing comment that contains table
// rows of its own; a naive "last matching line" scan finds those and inserts the real
// proposals inside the comment, where they are silently invisible to every later read.
const lines = queueText.split(/\r?\n/);
const openStart = lines.findIndex((line) => /^##\s+Open\s*$/.test(line));
if (openStart === -1) {
  console.error('No "## Open" section in dream-queue.md. Nothing written.');
  process.exit(1);
}
const afterOpen = lines.findIndex((line, i) => i > openStart && /^##\s+/.test(line));
const openEnd = afterOpen === -1 ? lines.length : afterOpen;
const commentAt = lines.findIndex((line, i) => i > openStart && i < openEnd && line.includes('<!--'));
const liveEnd = commentAt === -1 ? openEnd : commentAt;

let lastRow = -1;
let placeholder = -1;
for (let i = openStart + 1; i < liveEnd; i += 1) {
  if (/^\|\s*\d+\s*\|/.test(lines[i])) lastRow = i;
  if (lines[i].includes('_No open proposals._')) placeholder = i;
}

if (lastRow !== -1) {
  lines.splice(lastRow + 1, 0, ...rows);
} else if (placeholder !== -1) {
  lines.splice(placeholder, 1,
    '| # | Proposal | Evidence | Seen | Disposition |',
    '|---|---|---|---|---|',
    ...rows);
} else {
  console.error('Could not find an insertion point in the Open section. Nothing written.');
  process.exit(1);
}
const updated = lines.join('\n');

const today = new Date().toISOString().slice(0, 10);
const stamped = updated
  .replace(/^\*\*Date:\*\*.*$/m, `**Date:** ${today}`)
  .replace(/^\*\*Inputs reviewed:\*\*.*$/m, `**Inputs reviewed:** memory/journal.md (${blocks.length} entries), memory/index.md, memory/graveyard.md`);

await writeText(queuePath, stamped);
console.log('');
console.log(`Wrote ${admitted.length} proposal(s) to ${queuePath}`);
console.log('Nothing was applied. A human accepts or rejects each one.');
