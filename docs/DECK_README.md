# Shaping Change — Clickable Slide Deck

**[Power-Pressure-Choice-Deck.pptx](./Power-Pressure-Choice-Deck.pptx)** — a 24-slide
PowerPoint walkthrough you **click through** in presentation mode (branches and all):

- a **title slide**,
- the **22 stages** of the two-phase journey (one full-bleed screen each), and
- a closing **"Key messages"** slide.

It follows the Edu/PVAW-approved content — the story of **Mr. Atlas** (activity title
*"Shaping Change: Building strong roots for safety"*): Phase 1 watches the pressures grow
a strained tree; Phase 2 helps him rebuild it.

Every slide has **speaker notes** — a sentence the presenter can read out.

## How to present it

1. Open the `.pptx` in **PowerPoint** (or Keynote — see notes).
2. Use **Presenter View** if you want the speaker notes visible on your screen
   (PowerPoint: *Slide Show → Presenter View*).
3. Start the slideshow (*From Beginning*, `F5` / `⌘+Enter`).
4. **Click the on-screen buttons** to move through it. Clicking empty space does
   nothing on purpose — navigation is button-only, so the story can branch.

## The click flow

- **Title → Begin** opens the journey.
- **Phase 1 (watch the problem grow):** *Continue …* walks through Intro → the two
  pressures (money, loss of role) → a dedicated **"two big pressures" explainer**
  (migration pressure & loss of status) → the controlling behaviour → the impact on the
  family → the belief → **the whole-tree reveal**. The tree visibly declines across these.
- **Now, help him rebuild ▶** starts **Phase 2**: Rebuild intro → a new attitude → and
  then the **rebuild fork** (`11-behaviour-good`), which branches:
  - **Share power & seek support ▶** → Impact → **Healthy** (full green tree, **bearing fruit**).
  - **Change only a few things ▶** → **Healing** (some strain remains).
  - **Keep the old pattern ▶** → **Under strain** (a warning).
- **Healing** and **Under strain** both offer **← Go back & rebuild** (jump back to the
  rebuild intro and show another outcome live). **Under strain** also opens an **optional
  escalation branch** — *But he digs in ▶* → he raises his voice → slams the door and walks
  away → a calm **"Where this can lead"** warning (his escalating non-physical behaviour;
  no fire or lightning, reversible at every step). The healthy/healing paths and the
  escalation warning all lead on to Takeaways → **Why this matters** (the wider issue +
  statistics behind a *Show the numbers* button, placed at the end on Anu's advice) →
  Leadership pledge → Support.
- The **closing slide** wraps up the four key messages + the support line, with
  **↺ Start over** and **Replay the rebuild**.

> All three outcomes are reachable from a single click at the fork, so you can demo
> "what changes the outcome" in front of the team without leaving the deck. The outcome
> follows the **rebuild choices**, never the pressures themselves.

## Editing / re-using

- It's a normal `.pptx` — drag slides into an existing deck, restyle the buttons, edit
  the speaker notes, or change copy. Each stage slide is a single full-bleed image plus
  the button shapes; the title and closing slides are editable text panels.
- Built from the screen images in [`figma-screens/`](./figma-screens/) by
  `scripts/build-deck.py` (`pip install python-pptx` first).

## Notes on other apps

- **Keynote** opens `.pptx` and keeps the click actions; export back to PowerPoint to
  preserve them.
- **Google Slides** imports it, but **action-button hyperlinks between slides don't
  survive the import** — if the team uses Google Slides, present the PowerPoint file
  directly (PowerPoint Online works), or use the self-contained HTML demo
  (`../POC_README.md`) for guaranteed click-through.
