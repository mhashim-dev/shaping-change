# Power, Pressure & Choice — Proof of Concept

A single, self-contained HTML file you can run by the team to **play the actual game**
— no install, no server, no internet. Just open it.

## How to run it

1. Take the file **`Power-Pressure-Choice-POC.html`** (project root).
2. **Double-click it** (or drag it into any modern browser — Chrome, Edge, Safari, Firefox).
3. It opens full-screen and plays. Works **offline** and on a phone (open the file in a mobile browser).

> To share with the team: email or message the one `.html` file, or drop it in
> Teams/SharePoint/Drive. Recipients just open it — nothing to set up.

## What it demonstrates

This is the real experience, not a mock-up — it runs the same procedural canvas tree,
the same branching script, and the same synthesised audio as the full build:

- The **living, golden-hour scene** (drawn live — no image files) with a tree that
  **grows as you choose**, watered by little ground sprinklers on each growth step.
- The **branching journey**: pressures → belief → behaviour → impact → a turning point,
  then either leadership back to a full bloom, or a harm arc that lets the tree decline
  (leaves recolour, then fall and gather, branches break off, bark peels) — always with
  a door back.
- **Three endings** (Flourishing / Recovering / Withered), each recapping the player's
  actual path and the commitment they wrote.
- **Sound** (toggleable) and **auto-save** (your progress resumes if you reopen the file).

The pedagogy guardrails are intact: pressures are never a "wrong answer", naming who is
harmed is never a failure, help-seeking always heals, the **1800RESPECT / 000 support
line** is on every screen, and the withered ending is always reversible.

## Talking points for the team

- It's **framework-free and asset-free** — everything (tree, scenery, audio) is generated
  in the browser, so the footprint is tiny and there are no images/sounds to license or host.
- The whole branching script lives as editable data, so **writers can change copy and
  branches without touching the rendering**.
- The same code drops into the AMES Drupal site (see `AMES_DRUPAL_INTEGRATION.md`) and
  is trackable in Google Analytics.

## Rebuilding the POC

The file is generated from the real source (`lib/tree-engine.js`, `lib/audio-engine.js`,
`lib/game-content.js`, `app/globals.css`) plus the vanilla UI shell `scripts/poc-ui.js`:

```
npm run build:poc        # → Power-Pressure-Choice-POC.html
```

Re-run it after changing the game so the demo stays in sync with the full app.

## Want the full app instead?

The production version (Next.js) runs with `npm install && npm run dev` and is what
ships to the website. The POC is purely a frictionless way to **demo and share** it.
