# Shaping Change — Team Training & Handover Guide

*How the game is built, and how to change it going forward — written for people who have **not** worked with web code before.*

---

## 1. What this guide is

This is a run-through you can use in a training session so the team can **maintain and update the game themselves**. It explains, in plain language:

- what the game is made of,
- how to open it and see your changes,
- **exactly how to make the common changes** (wording, choices, links, adding a screen),
- the built-in safety check that stops us breaking the pedagogy, and
- how to produce the shareable files (the offline game, the review deck).

**The good news:** you do **not** need to learn to code. About 90% of the changes the team will want live in **one plain text file of words and choices** (`lib/game-content.js`). If you can edit a list, you can edit the game.

---

## 2. The 60-second overview

**Shaping Change** is a short, self-paced web activity. The player follows Orion's story and makes choices; a tree grows or declines to reflect the story.

There are **two copies of the same game**, and it's important to know the difference:

| Copy | What it's for | File |
|---|---|---|
| **The dev app** | What you edit and preview live while working | the project folder, run with a command |
| **The offline game (POC)** | The single file you *share* — it runs on any device with no internet | `Power-Pressure-Choice-POC.html` |

Both copies read the **same words and choices** from one file, so you write content once. The dev app updates instantly as you type; the offline game is *rebuilt* with one command when you're ready to share.

---

## 3. The technology, in plain terms

You'll hear these words — here's what they mean and how much you need to care:

- **Next.js / React** — the "framework" the app is built with. Think of it as the engine that turns our files into a web page. **You rarely touch this.** It lives in `app/page.js`.
- **JavaScript** — the programming language. The **content file** is written in a very simple slice of it — basically a labelled list. That's the part you'll edit.
- **Node.js** — a program your computer needs so the commands below work. Install once (see §4).
- **npm** — comes with Node. It's how we run commands like "start the app" or "rebuild the offline game."
- **Terminal** — the text window where you type commands. In VS Code: **View → Terminal**.
- **localhost** — your own computer. When the app runs, you view it at `http://localhost:3000` — a private preview only you can see.
- **Canvas** — the drawing area where the tree and Orion are painted. This is advanced (`lib/tree-engine.js`) — **leave it alone** unless you're comfortable.

> **Key mindset:** the *words and choices* (content) are deliberately kept in a separate file from the *drawing and mechanics* (code). The team's job is the content file. The engine can stay untouched.

---

## 4. What you need (one-time setup)

1. **Install Node.js** — go to <https://nodejs.org>, download the "LTS" version, install it (click through the defaults).
2. **Install VS Code** — a free editor from <https://code.visualstudio.com>. This is where you'll open the project and edit files.
3. **Open the project** — in VS Code: **File → Open Folder →** choose the `ames-tree-main` folder.
4. **Install the project's parts** — open the Terminal (**View → Terminal**) and type:
   ```
   npm install
   ```
   Wait for it to finish (a minute or two). You only do this once per computer.

---

## 5. Running the game so you can see your changes

In the Terminal, type:
```
npm run dev
```
Then open a web browser to **http://localhost:3000**. You'll see the game. Leave this running — as you edit and save files, the page updates automatically. To stop it, click the Terminal and press **Ctrl + C**.

To open the **offline shareable game**, just double-click `Power-Pressure-Choice-POC.html` — it opens in any browser, no server needed. (Remember: this file only shows your latest changes after you *rebuild* it — see §9.)

---

## 6. The map — which file does what

You will spend almost all your time in the **first row**. The rest is for reference.

| File | What it holds | How often you'll touch it |
|---|---|---|
| **`lib/game-content.js`** | **Every screen: the words, the choices, the order** | **Often — this is your main file** |
| `lib/i18n.js` | Fixed button/label wording (e.g. "Start over"), and the setup for future languages | Occasionally |
| `app/globals.css` | Colours, fonts, spacing (the "look") | Occasionally |
| `lib/tree-engine.js` | Draws the tree, Orion, thought bubbles, weather | Rarely — advanced |
| `lib/audio-engine.js` | The background music and sound cues | Rarely |
| `scripts/validate-content.mjs` | The **safety check** that guards the pedagogy | You *run* it; you don't edit it |
| `scripts/build-poc.cjs` | Builds the offline shareable game | You *run* it; you don't edit it |
| `app/page.js` + `scripts/poc-ui.js` | The two user interfaces (dev app + offline copy) | Advanced — only for behaviour changes |
| `scripts/screens_data.py` + the `build-screens-*.py` scripts | The review **Word doc** and **deck** | When refreshing the shared review pack |

---

## 7. The content file — how a screen works

Open `lib/game-content.js`. It's a list called `STEPS`. **Each screen in the game is one block** in that list. Here is a real one (the "Money worries" screen), annotated:

```js
{
  id: 'pressure_money',                 // the screen's internal name (don't show players)
  think: 'pressures',                   // which thought bubble to show above Orion (optional)
  type: 'story',                        // the KIND of screen (see below)
  phase: 'Pressure',                    // which chapter it belongs to (drives the progress dots)
  tag: 'Phase 1 · The pressures build', // the small gold line at the top of the card
  prompt: 'Money worries',              // the big heading
  hint: 'Back home, Orion trained ...', // the body text the player reads
  btn: 'Continue',                      // the button label
  kind: 'neutral',                      // 'healthy' | 'harmful' | 'neutral' — the meaning of the choice
  fx: { health: -7 },                   // the effect on the hidden "health" score (see §7.3)
  next: 'pressure_role'                 // which screen comes next (by its id)
}
```

### 7.1 The five screen `type`s

- **`intro`** — a welcome/character screen (Welcome, Meet Orion).
- **`story`** — narration the player reads, with one **Continue** button (`next` points to the following screen).
- **`pick`** — a choice screen. Instead of `next`, it has a list of **`options`** (see §7.2).
- **`commit`** — the pledge screen, where the player writes/chooses their own step.
- **`ending`** — the final support screen.

### 7.2 A choice screen's options

A `pick` screen has an `options` list. Each option is one button:

```js
options: [
  {
    label: 'Take tight control of the money and the decisions',  // the button text
    kind: 'harmful',        // the meaning: healthy | harmful | neutral
    next: 'impact',         // the screen this choice leads to
    fx: { health: -18 },    // its effect on the tree's health
    info: 'Orion’s reasoning: ...'  // the feedback shown after they pick it
  },
  { ... },
]
```

### 7.3 How the story connects, and how the ending is decided

- **The order** is set by `next` (on story screens) and by each option's `next` (on choice screens). Every screen points to the next one by its **`id`**. Follow the `next` values and you can trace the whole game.
- There's a hidden **`health`** score (starts at 68). Each `fx: { health: ... }` nudges it up or down. It's what makes the tree greener or barer.
- At the end of the rebuild, the game reads the health score to pick the outcome (this rule lives in `app/page.js`):
  - **70 or more → healthy tree**
  - **40–69 → healing tree**
  - **below 40 → tree under strain**
- `fx` can also set the weather/mood: `mood: 'golden' | 'noon' | 'overcast'`, and `shed:` drops leaves.

### 7.4 The thought bubble (`think:`)

Add `think: '...'` to a screen to show a picture above Orion. Available pictures:
`money` · `pressures` (money + family together) · `family_role` (Orion smaller than his family) · `family` / `family_sad` / `family_happy` · `talk_together` (two people working things out) · `partner_sad` · `children_sad`.

---

## 8. How to make the common changes (recipes)

> **Golden rule for every change:** after editing, run the safety check (§9), then look at it in the browser (§5).

### Recipe A — Change the words on a screen
1. Open `lib/game-content.js`.
2. Press **Ctrl/Cmd + F** and search for a phrase you can see on the screen, or the screen's `id`.
3. Edit the text inside the quotes for `prompt` (heading), `hint` (body), or `btn` (button).
4. Save. Check the browser.

*Tip:* inside the `hint` text, `\n` means "start a new line."

### Recipe B — Change or add an answer option
1. Find the screen (a `type: 'pick'`), e.g. `id: 'attitude'`.
2. To **edit** an option, change its `label` and `info`.
3. To **add** one, copy an existing `{ ... }` option, paste it in the list (mind the commas between items), and set its `label`, `kind`, `next`, `fx`, and `info`.
4. **Keep the pedagogy rules** (§9): a `harmful` option must never *raise* health; a help-seeking option should heal.
5. Save, run the safety check, check the browser.

### Recipe C — Change the support links (last screen)
1. Find `id: 'support'`.
2. Edit the `steps` list — each has a `label` (the visible text) and a `url` (the link).

### Recipe D — Change a thought bubble on a screen
Add, remove, or change the `think:` value (see §7.4). Example: to show the "two pressures" picture, add `think: 'pressures',`.

### Recipe E — Add a whole new screen
1. Copy an existing screen block that's closest to what you want.
2. Give it a **new, unique `id`**.
3. Set its words (`prompt`, `hint`, `btn`).
4. **Wire it in:** point the previous screen's `next` to your new `id`, and set your new screen's `next` to where it should go afterwards.
5. Run the safety check — it will tell you if a link is broken.

### Recipe F — Change the look (colours, fonts, spacing)
These live in `app/globals.css`. Search for a colour or size and adjust. This is safe to experiment with — if something looks wrong, undo (Ctrl/Cmd + Z).

### Recipe G — Change the audio
`lib/audio-engine.js`. Advanced, but the gentle cues live near the bottom (`swell`, `hush`, `ending`). Change with care; it can't be heard from the code, so preview in the browser.

---

## 9. The safety net — the pedagogy check

Because this is a family-violence **prevention** tool, some rules must never be broken by accident. We have an automatic check for them. After any content change, run:
```
npm run test:content
```
It confirms, among other things:
- every screen is reachable and its links point somewhere real,
- a **harmful** choice can **never heal** the tree,
- **help-seeking always heals**,
- the pressures and impacts are never treated as a "wrong answer,"
- all three outcomes stay reachable,
- the "strained" outcome is always reversible ("Go back and rebuild"),
- the **1800RESPECT / 000 support line is on every screen**,
- statistics keep their source citations.

If it prints **"✓ All 10 invariant groups hold,"** you're good. If it prints an error, it tells you exactly what to fix. **Always run this before sharing.**

---

## 10. The everyday workflow

```
1. Edit lib/game-content.js in VS Code, and Save
2. npm run test:content        ← safety check (fix anything it flags)
3. Look at http://localhost:3000  ← "npm run dev" must be running
4. npm run build:poc           ← updates the offline shareable game
5. Share Power-Pressure-Choice-POC.html
```

---

## 11. Producing the shareable files

- **The offline game** (send this to anyone): run `npm run build:poc`, then share `Power-Pressure-Choice-POC.html`. It's one self-contained file — no internet needed, nothing is sent anywhere, answers stay on the player's device.
- **The review Word doc & deck** (the screen-by-screen pack for Edu/PVAW): these are rebuilt with Python scripts and need the screen images re-rendered first. This is more involved (it uses Python and a headless browser). If the team needs this refreshed, that's the one task worth pairing with someone technical — the commands are:
  ```
  # 1. re-render the 23 screen images, then
  python3 scripts/build-screens-doc.py     # the Word doc
  python3 scripts/build-screens-deck.py    # the PowerPoint
  ```
  *(The image re-render step serves the harness over a local browser; see §13 / ask for a walkthrough the first time.)*

---

## 12. What to be careful with

- **Don't rename an `id`** unless you also update every `next` that points to it. (The safety check will catch orphaned links.)
- **Watch your commas and quotes** in `game-content.js` — a missing comma between items, or a missing quote, will stop the game loading. If the page goes blank, that's almost always the cause; undo your last edit.
- **Behaviour changes** (not words — actual mechanics) must be made in **both** `app/page.js` and `scripts/poc-ui.js` to keep the two copies matching. Content changes (`game-content.js`) don't have this problem — both copies read it.
- **Never remove the support line, and never let a harmful choice heal the tree.** The safety check guards this — respect it.
- **Anything touching the words for safety messages or statistics** should go back to Edu/PVAW before it's published.

---

## 13. Troubleshooting

| Symptom | Likely cause / fix |
|---|---|
| The page is blank | A typo in `game-content.js` (missing comma/quote). Undo your last change; re-save. |
| Changes don't show in the browser | Is `npm run dev` running? Try refreshing. |
| Changes don't show in the offline file | Run `npm run build:poc` — the offline copy is only rebuilt on command. |
| `npm` "command not found" | Node.js isn't installed (see §4). |
| The old screen keeps showing | The game remembers your progress. Click **Start over**, or clear the browser's storage for the site. |
| The safety check fails | Read the message — it names the exact rule and screen to fix. |

---

## 14. Mini-glossary

- **Node / screen** — one block in `game-content.js`; one thing the player sees.
- **`id`** — a screen's unique internal name; used by `next` to link screens.
- **`next`** — which screen comes after this one.
- **health** — the hidden score (starts 68) that drives the tree and the ending.
- **POC** — the single offline HTML file you share.
- **dev app** — the live preview you edit against (`npm run dev`).
- **the engine** — `lib/tree-engine.js`, the drawing code; advanced.
- **the safety check** — `npm run test:content`, the pedagogy guardrails.

---

## 15. Command cheat-sheet

```
npm install            # one-time setup on a new computer
npm run dev            # start the live preview at http://localhost:3000
npm run test:content   # run the pedagogy safety check (do this after every edit)
npm run build:poc      # rebuild the offline shareable game (Power-Pressure-Choice-POC.html)
```

*Questions this guide doesn't answer? The two files to know are `lib/game-content.js` (all the words and choices) and `scripts/validate-content.mjs` (the rules). Start there.*
