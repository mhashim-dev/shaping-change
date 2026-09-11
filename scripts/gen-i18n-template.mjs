/* scripts/gen-i18n-template.mjs — emit a translation template for a target language.
 *
 *   node scripts/gen-i18n-template.mjs <lang-code>        # e.g. ar, vi, zh-Hans, prs
 *
 * Writes lib/i18n-<lang>.template.json containing EVERY player-facing string (UI chrome
 * + all content-node text) with the English source alongside each blank target field,
 * so a professional translator has full context. See docs/I18N_TRANSLATION_GUIDE.md.
 * This never invents translations — it only extracts the strings to be translated.
 */
import { writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { STEPS, KEY_MESSAGES, LEGEND } from '../lib/game-content.js';
import { UI_EN, TRANSLATABLE_FIELDS, TRANSLATABLE_OPTION_FIELDS } from '../lib/i18n.js';

const lang = process.argv[2];
if (!lang) { console.error('Usage: node scripts/gen-i18n-template.mjs <lang-code>'); process.exit(1); }

const pair = (en) => ({ en, [lang]: '' });

const ui = {};
for (const k of Object.keys(UI_EN)) ui[k] = pair(UI_EN[k]);

const nodes = {};
for (const n of STEPS) {
  const entry = {};
  for (const f of TRANSLATABLE_FIELDS) if (n[f] != null) entry[f] = pair(n[f]);
  if (n.reveal) {
    entry.reveal = {};
    if (n.reveal.btn) entry.reveal.btn = pair(n.reveal.btn);
    if (n.reveal.text) entry.reveal.text = pair(n.reveal.text);
  }
  if (Array.isArray(n.options)) {
    entry.options = n.options.map((o) => {
      const oe = {};
      for (const f of TRANSLATABLE_OPTION_FIELDS) if (o[f] != null) oe[f] = pair(o[f]);
      return oe;
    });
  }
  nodes[n.id] = entry;
}

const template = {
  _README: `Translation template for "${lang}". Fill every "${lang}" field. Keep meaning + tone; ` +
    'this is family-violence prevention content — have it professionally reviewed and re-checked ' +
    'with the Edu/PVAW teams before it goes live. Do not change the English "en" reference fields.',
  meta: { name: pair('English name of this language'), dir: 'ltr (use "rtl" for Arabic/Farsi/Dari)' },
  keyMessages: KEY_MESSAGES.map(pair),
  legend: LEGEND.map((l) => ({ key: l.key, label: pair(l.label) })),
  ui,
  nodes
};

const here = dirname(fileURLToPath(import.meta.url));
const outPath = join(here, '..', 'lib', `i18n-${lang}.template.json`);
writeFileSync(outPath, JSON.stringify(template, null, 2) + '\n');
const strings = Object.keys(ui).length + Object.values(nodes).reduce((a, n) =>
  a + Object.keys(n).length + (n.options ? n.options.length : 0), 0);
console.log(`Wrote ${outPath}\n  ~${strings} strings to translate across ${STEPS.length} nodes + UI chrome.`);
