/* scripts/validate-content.mjs — the PEDAGOGY INVARIANT GUARD.
 *
 * "Power, Pressure & Choice" / "Shaping Change" carries sign-off from the Edu team
 * (Thuy Reynolds), PVAW (Anu Krishnan / Ali Yaghobi) and the Digital team. Those
 * approvals rest on a set of non-negotiable pedagogy rules. A content edit that
 * silently broke one of them would put the sign-off at risk without anyone noticing.
 *
 * This script asserts those rules against lib/game-content.js (+ the resolution
 * thresholds the app applies). It is pure data validation — no browser, no build.
 *
 *   npm run test:content     # or: node scripts/validate-content.mjs
 *
 * Exit code 0 = all invariants hold; 1 = at least one is broken (details printed).
 * WIRE THIS INTO CI / run it before every render + every release.
 */
import { STEPS, PHASE_ORDER, SUPPORT_LINE, LEGEND } from '../lib/game-content.js';

// ---- the app's resolution logic, mirrored so the guard is self-contained ----
// (keep in sync with resolveOutcome() in app/page.js + scripts/poc-ui.js)
const INITIAL_HEALTH = 68;                 // INITIAL_FRAME.health
function resolveOutcome(health) {
  if (health >= 70) return 'outcome_healthy';
  if (health >= 40) return 'outcome_mixed';
  return 'outcome_damaged';
}

const byId = new Map(STEPS.map((n) => [n.id, n]));
const failures = [];
const notes = [];
const fail = (msg) => failures.push(msg);
const note = (msg) => notes.push(msg);

// A pointer is valid if it names a real node or the one synthetic target the app resolves.
const SPECIAL_TARGETS = new Set(['RESOLVE_OUTCOME']);
const isValidTarget = (id) => id != null && (byId.has(id) || SPECIAL_TARGETS.has(id));

// Collect every outgoing pointer from a node (story next/altNext, pick option nexts).
function outgoing(node) {
  const out = [];
  if (node.next) out.push(node.next);
  if (node.altNext) out.push(node.altNext);
  if (Array.isArray(node.options)) node.options.forEach((o) => o.next && out.push(o.next));
  return out;
}

// ---- 1. structural integrity: ids unique, pointers resolve, no dead ends ----
const seenIds = new Set();
for (const n of STEPS) {
  if (!n.id) fail(`A node has no id: ${JSON.stringify(n).slice(0, 80)}`);
  if (seenIds.has(n.id)) fail(`Duplicate node id: ${n.id}`);
  seenIds.add(n.id);
  if (!n.type) fail(`Node ${n.id} has no type`);
  if (!PHASE_ORDER.includes(n.phase)) fail(`Node ${n.id} has phase "${n.phase}" not in PHASE_ORDER`);

  for (const t of outgoing(n)) {
    if (!isValidTarget(t)) fail(`Node ${n.id} points to unknown target "${t}"`);
  }
  // every non-ending node must lead somewhere
  const leads = outgoing(n).length > 0;
  if (n.type !== 'ending' && !leads) fail(`Node ${n.id} (type ${n.type}) is a dead end (no next/options)`);
}

// ---- 2. reachability: every node is reachable from the intro ----
const start = STEPS.find((n) => n.type === 'intro') || STEPS[0];
const reachable = new Set();
(function walk(id) {
  if (id === 'RESOLVE_OUTCOME') { ['outcome_healthy', 'outcome_mixed', 'outcome_damaged'].forEach(walk); return; }
  if (!byId.has(id) || reachable.has(id)) return;
  reachable.add(id);
  outgoing(byId.get(id)).forEach(walk);
})(start.id);
for (const n of STEPS) {
  if (!reachable.has(n.id)) fail(`Node ${n.id} is unreachable from "${start.id}" (orphan)`);
}

// ---- 3. harmful behaviour never heals; help-seeking always heals ----
for (const n of STEPS) {
  if (!Array.isArray(n.options)) continue;
  for (const o of n.options) {
    const dh = o.fx && typeof o.fx.health === 'number' ? o.fx.health : 0;
    if (o.kind === 'harmful' && dh > 0) fail(`Harmful option in ${n.id} heals the tree (fx.health=${dh}): "${o.label.slice(0, 50)}"`);
    if (o.kind === 'healthy' && dh < 0) fail(`"Healthy" option in ${n.id} harms the tree (fx.health=${dh}): "${o.label.slice(0, 50)}"`);
  }
}
// at least one explicit help-seeking action must heal (help-seeking always heals)
const helpHeals = STEPS.some((n) => Array.isArray(n.options) && n.options.some(
  (o) => /ask for help|counsel|support|english class/i.test(o.label) && o.fx && o.fx.health > 0));
if (!helpHeals) fail('No help-seeking option heals the tree (expected e.g. "Ask for help …" with fx.health > 0)');

// ---- 4. the pressures + impacts are narrative, never a "wrong answer" ----
const NEUTRAL_NODES = ['pressure_money', 'pressure_role', 'pressures_two', 'root', 'impact', 'impact_good'];
for (const id of NEUTRAL_NODES) {
  const n = byId.get(id);
  if (!n) { fail(`Expected narrative node "${id}" is missing`); continue; }
  if (n.kind === 'harmful') fail(`Narrative/pressure node ${id} is marked harmful — it must never be a wrong answer`);
}

// ---- 5. all three outcomes exist AND are reachable by the health math ----
for (const id of ['outcome_healthy', 'outcome_mixed', 'outcome_damaged']) {
  if (!byId.has(id)) fail(`Outcome node "${id}" is missing`);
}
// simulate the reachable health range entering RESOLVE_OUTCOME by exploring every
// choice path from the intro, applying fx.health, and recording what each outcome
// resolves to. Confirms healthy / mixed / damaged are ALL actually attainable.
const outcomesHit = new Set();
(function sim(id, health, depth) {
  if (depth > 40) return;                       // guard against any accidental cycle
  if (id === 'RESOLVE_OUTCOME') { outcomesHit.add(resolveOutcome(health)); return; }
  const n = byId.get(id);
  if (!n) return;
  const step = (target, fx) => sim(target, health + ((fx && typeof fx.health === 'number') ? fx.health : 0), depth + 1);
  if (Array.isArray(n.options)) { n.options.forEach((o) => step(o.next, o.fx)); return; }
  // story/intro: follow the PRIMARY next only for the outcome sweep (alt paths loop back
  // to rebuild_intro, which the option recursion already covers)
  if (n.next) step(n.next, n.fx);
})(start.id, INITIAL_HEALTH, 0);
for (const id of ['outcome_healthy', 'outcome_mixed', 'outcome_damaged']) {
  if (!outcomesHit.has(id)) fail(`Outcome "${id}" is NOT reachable by any combination of choices (health math drifted)`);
}
note(`Reachable outcomes from health ${INITIAL_HEALTH}: ${[...outcomesHit].sort().join(', ')}`);

// ---- 6. the damaged outcome is always reversible ----
const damaged = byId.get('outcome_damaged');
if (damaged) {
  const offersRebuild = [damaged.next, damaged.altNext].includes('rebuild_intro');
  if (!offersRebuild) fail('outcome_damaged must offer a way back to "rebuild_intro" (reversible)');
}
// and every step of the escalation branch must be reversible too
for (const id of ['insist_1', 'insist_2', 'escalation_warning']) {
  const n = byId.get(id);
  if (n && n.next !== 'rebuild_intro') fail(`Escalation node ${id} must default (primary button) back to "rebuild_intro"`);
}

// ---- 7. the support line is present and mentions the real services ----
if (!SUPPORT_LINE || !/1800\s?RESPECT/i.test(SUPPORT_LINE) || !/\b000\b/.test(SUPPORT_LINE)) {
  fail('SUPPORT_LINE must reference 1800RESPECT and 000 (persistent help footer)');
}

// ---- 8. no shame / score language in player-facing copy ----
const SHAME = /\b(you (failed|lost|are wrong)|wrong answer|game over|score|points|you scored|shame on)\b/i;
for (const n of STEPS) {
  const texts = [n.prompt, n.hint, n.tag].filter(Boolean);
  if (Array.isArray(n.options)) n.options.forEach((o) => { if (o.info) texts.push(o.info); });
  for (const t of texts) if (SHAME.test(t)) fail(`Shame/score language in ${n.id}: "${t.match(SHAME)[0]}"`);
}

// ---- 9. LEGEND keys line up with the tree parts the engine can highlight ----
const PART_KEYS = ['roots', 'soil', 'trunk', 'branches'];
if (Array.isArray(LEGEND)) {
  for (const e of LEGEND) if (e.key && !PART_KEYS.includes(e.key)) fail(`LEGEND entry key "${e.key}" is not a tree part (${PART_KEYS.join('/')})`);
}

// ---- 10. any statistic shown to the player must keep a source citation ----
// (can't verify the number is correct — that's docs/STATISTICS_SOURCES.md — but a
//  citation must never be silently dropped)
for (const n of STEPS) {
  if (!n.reveal || !n.reveal.text) continue;
  const t = n.reveal.text;
  const quotesFigure = /\bbillion\b|\bmillion\b|1 in \d|one (?:woman|man) a (?:week|day)|\$\s?\d/i.test(t);
  const hasCitation = /\(\s*[A-Za-z&]+\s*,?\s*20\d{2}\s*\)|,\s*20\d{2}\s*\)/.test(t);
  if (quotesFigure && !hasCitation) fail(`Reveal on ${n.id} quotes a statistic with no year citation — figures must be attributed (see docs/STATISTICS_SOURCES.md)`);
}

// ---------------------------------------------------------------------------
console.log(`\nShaping Change — pedagogy invariant check`);
console.log(`  nodes: ${STEPS.length}   reachable: ${reachable.size}   phases: ${PHASE_ORDER.length}`);
notes.forEach((m) => console.log(`  · ${m}`));
if (failures.length === 0) {
  console.log(`\n✓ All ${10} invariant groups hold.\n`);
  process.exit(0);
} else {
  console.error(`\n✗ ${failures.length} invariant violation(s):`);
  failures.forEach((m) => console.error(`  ✗ ${m}`));
  console.error('');
  process.exit(1);
}
