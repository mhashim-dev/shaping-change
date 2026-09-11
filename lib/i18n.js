/* lib/i18n.js — localisation layer for "Shaping Change".
 *
 * The game is for migrant, English-as-an-additional-language communities, so it is
 * built to be delivered in community languages. This module is the SEAM for that:
 * the English copy in game-content.js is the source of truth and the fallback, and a
 * language pack supplies per-node text overrides + UI-chrome strings.
 *
 * IMPORTANT — this is a family/domestic-violence PRIMARY-PREVENTION tool. Translations
 * carry pedagogy and safety nuance and MUST be produced/validated by qualified
 * translators and re-checked with the Edu team (Thuy) + PVAW (Anu/Ali) before a
 * language is switched on. DO NOT auto-/machine-translate this content and ship it.
 * A mistranslation here is not a typo — it can invert the meaning of a safety message.
 *
 * To add a language:
 *   1. Generate a template of every translatable string:  npm run i18n:template
 *      (writes lib/i18n-<lang>.template.json — see docs/I18N_TRANSLATION_GUIDE.md)
 *   2. Have it professionally translated + reviewed.
 *   3. Register it in PACKS below (code → { meta, ui, nodes }).
 *   4. Re-run the pedagogy check against the translated build.
 * The language picker appears automatically once more than one pack is registered.
 */

// Which node fields hold player-facing text (used by translateNode + the template gen).
export const TRANSLATABLE_FIELDS = ['tag', 'prompt', 'hint', 'btn', 'altBtn'];
export const TRANSLATABLE_OPTION_FIELDS = ['label', 'info'];

// UI chrome strings (everything not coming from a content node).
export const UI_EN = {
  startOver: 'Start over',
  prevStep: 'Previous step',
  readAloud: 'Read the text aloud',
  stopReading: 'Stop reading',
  soundOn: 'Turn sound on',
  soundOff: 'Turn sound off',
  skipToActivity: 'Skip to the activity',
  language: 'Language',
  welcome: 'Welcome',
  complete: 'Complete',
  stepOf: 'Step {n} of {total}',
  framing: 'This is about understanding patterns — not blaming people or cultures. A simple story, with real choices.',
  supportLine: 'Need to talk? Call 1800RESPECT (1800 737 732). In an emergency, call 000.',
  printPlan: 'Print or save my summary',
  keepsakeTitle: 'Shaping Change — my journey',
  keepsakeIntro: 'A summary of the choices I made and the plan I am taking home.',
  keepsakePledge: 'My pledge as a leader',
  keepsakeJourney: 'The choices I explored',
  keepsakeOutcome: 'Where it led',
  keepsakeFelt: 'How I felt',
  keepsakePrepared: 'Prepared on',
  keepsakeQuestions: 'Questions I will keep asking myself',
  keepsakeRemember: 'Worth remembering',
  keepsakeFoot: 'A keepsake from the Shaping Change activity. Support is always available.',
  coachExplore: 'Tap each part of the tree to explore it.',
  coachDrop: 'Drag your choice onto the tree — or just tap it.',
  coachDismiss: 'Got it',
  reflectQuestion: 'Optional: how ready do you feel to lead positive change at home?',
  reflectSkip: 'Prefer not to say',
  reflectThanks: 'Thank you.',
  reflectShift: 'You started here — and finished here:',
  reflectStart: 'At the start',
  reflectEnd: 'At the end',
  facTitle: 'Facilitator mode',
  facDiscuss: 'Discussion prompt',
  facReset: 'Reset for next participant',
  facHide: 'Hide facilitator notes'
};

// Group-delivery discussion prompts, keyed by node phase. These are FACILITATOR guidance,
// deliberately kept OUT of the signed-off learner content (game-content.js) so they never
// affect the activity itself — shown only when facilitator mode is on.
export const FACILITATOR_PROMPTS = {
  Meet: 'Invite the group: what pressures do people face when they first arrive in a new country?',
  Pressure: 'Ask: which of these pressures feel familiar? How do they show up at home?',
  Behaviour: 'Discuss: why might someone respond this way? Separate understanding the cause from excusing the harm.',
  Impact: 'Ask the group: who else feels the effects of these choices, and how?',
  Belief: 'Explore: where do these beliefs come from? Which ones can a strong leader question?',
  Root: 'Use the tree model: which part (roots, soil, trunk, branches) is easiest to change first, and why?',
  Rebuild: 'Ask: what would sharing power actually look like day-to-day in this family?',
  Outcome: 'Reflect: what made the difference between the outcomes? What is one small first step?',
  Leadership: 'Invite each person to name one action they will take as a leader this week.',
  Support: 'Close by naming the local services available, and remind the group support is confidential.'
};

export function facilitatorPrompt(phase) { return FACILITATOR_PROMPTS[phase] || ''; }

// Registered language packs. English is implicit (the source). Add reviewed packs here.
// Example shape (do NOT fill with machine translation):
//   'ar': { meta: { name: 'العربية', dir: 'rtl' }, ui: {…}, nodes: { intro: { prompt: '…', hint: '…' }, … } }
export const PACKS = {
  en: { meta: { name: 'English', dir: 'ltr' }, ui: UI_EN, nodes: {} }
};

export const DEFAULT_LANG = 'en';

export function availableLanguages() {
  return Object.keys(PACKS).map((code) => ({ code, name: PACKS[code].meta.name, dir: PACKS[code].meta.dir }));
}

export function langMeta(lang) {
  const p = PACKS[lang] || PACKS[DEFAULT_LANG];
  return p.meta;
}

// A UI string in the chosen language, English fallback, with {n}/{total} interpolation.
export function uiString(key, lang, vars) {
  const pack = PACKS[lang] || PACKS[DEFAULT_LANG];
  let s = (pack.ui && pack.ui[key] != null) ? pack.ui[key] : UI_EN[key];
  if (s == null) s = key;
  if (vars) for (const k in vars) s = s.replace('{' + k + '}', vars[k]);
  return s;
}

// A shallow, DISPLAY-ONLY translated copy of a content node. Logic fields (id, type,
// next, altNext, fx, kind, options[].next/fx/kind, display, reveal.btn target, etc.)
// are preserved from the source — only visible text is overlaid. Callers use the source
// node for navigation/scoring and this copy for what the player reads.
export function translateNode(node, lang) {
  if (!node || !lang || lang === DEFAULT_LANG) return node;
  const pack = PACKS[lang];
  const over = pack && pack.nodes && pack.nodes[node.id];
  if (!over) return node;
  const out = Object.assign({}, node);
  for (const f of TRANSLATABLE_FIELDS) if (over[f] != null) out[f] = over[f];
  if (over.reveal && node.reveal) out.reveal = Object.assign({}, node.reveal, over.reveal);
  if (Array.isArray(node.options)) {
    out.options = node.options.map((opt, i) => {
      const oo = over.options && over.options[i];
      if (!oo) return opt;
      const copy = Object.assign({}, opt);
      for (const f of TRANSLATABLE_OPTION_FIELDS) if (oo[f] != null) copy[f] = oo[f];
      return copy;
    });
  }
  return out;
}
