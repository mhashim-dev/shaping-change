# Translation guide — Shaping Change

The activity is built for migrant, English-as-an-additional-language communities, so it
is designed to be delivered in community languages. English is the **source of truth and
the fallback**; each additional language is a "pack" of translated strings that overlays
the English text.

> ⚠️ **This is family / domestic-violence primary-prevention content.** Wording carries
> pedagogy and safety nuance that has been signed off by the Edu team (Thuy Reynolds) and
> PVAW (Anu Krishnan / Ali Yaghobi). Translations **must** be produced by qualified human
> translators and **re-checked with the Edu/PVAW teams** before a language is switched on.
> Do **not** machine-translate this content and ship it — a mistranslation here can invert
> the meaning of a safety message.

## How the pieces fit

- `lib/game-content.js` — the English content (source of truth). Never translated in place.
- `lib/i18n.js` — the localisation layer: the list of registered language `PACKS`, the UI
  chrome strings (`UI_EN`), and the `translateNode()` / `uiString()` helpers the UI calls.
- `app/page.js` + `scripts/poc-ui.js` — both render through those helpers, so registering a
  pack localises the whole experience (content + buttons + step labels + screen-reader text).
- The **language picker** (top-right of the panel) appears automatically once more than one
  pack is registered. It also sets `<html lang>` and `dir` (`rtl` for Arabic / Farsi / Dari).

## Adding a language (e.g. Vietnamese `vi`)

1. **Generate the template** (extracts every player-facing string with the English source
   beside a blank target field):

   ```sh
   npm run i18n:template vi
   # → writes lib/i18n-vi.template.json  (~129 strings)
   ```

2. **Translate + review.** A professional translator fills every `"vi"` field, keeping the
   meaning and gentle, non-blaming tone. Then the Edu/PVAW teams review it.

3. **Register the reviewed pack** in `lib/i18n.js` → `PACKS`:

   ```js
   export const PACKS = {
     en: { meta: { name: 'English', dir: 'ltr' }, ui: UI_EN, nodes: {} },
     vi: {
       meta: { name: 'Tiếng Việt', dir: 'ltr' },
       ui:   { startOver: '…', prevStep: '…', /* …the UI_EN keys you translated… */ },
       nodes: {
         intro: { prompt: '…', hint: '…', btn: '…' },
         behaviour: { prompt: '…', options: [ { label: '…', info: '…' }, /* … */ ] },
         /* …one entry per node id you translated; omit fields to fall back to English… */
       }
     }
   };
   ```

   You can load the pack from the JSON you produced in step 1 instead of hand-writing it —
   map each `{ en, vi }` pair down to its `vi` value. Keep the `nodes` keys equal to the
   node `id`s in `game-content.js`, and keep `options` in the same order.

4. **Rebuild + re-check**:

   ```sh
   npm run test:content     # pedagogy invariants (language-independent, but run it)
   npm run build:poc        # regenerate the offline POC with the new pack inlined
   npm run build            # the Next app
   ```

## Rules that keep it safe

- Only **display text** is translated. Navigation/scoring fields (`next`, `fx`, `kind`,
  `type`, `display`, option order, tree-part `key`s) always come from the English source —
  `translateNode()` preserves them — so a translation can never change the game's logic or
  break the pedagogy invariants.
- Any field you leave out **falls back to English**, so a partial translation is safe to
  ship (it just shows some English). Aim for complete packs before going live.
- The support line (1800RESPECT / 000) and the numbered statistics have their own review
  requirements — see the note on the `why_matters` screen in `GAME_CONTENT_FOR_APPROVAL`.
