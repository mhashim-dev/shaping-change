# Shaping Change — Screen Mockups (for Figma)

A numbered set of **finished, pixel-accurate screen mockups** of the activity — the live
scene plus the floating panel UI — at every stage of the journey. Each image is
**1600 × 900 (16:9)**, rendered from the real build (same tree engine, palette,
typography and copy as the app).

These reflect the **Edu/PVAW‑approved** content: the two‑phase *Migration Pressure* story
of **Mr. Atlas**, in simple English, under the activity title **“Shaping Change: Building
strong roots for safety.”** Use them to assemble a Figma POC or a slide deck to show the
team.

## The two phases

- **Phase 1 — Experience the problem** (the tree **declines**): we meet Mr. Atlas,
  watch the pressures build (with a dedicated screen naming migration pressure & loss of
  status), see the controlling behaviour and its impact on the family, name the belief
  underneath, then reveal the whole tree. Mr. Atlas stands beside the tree, his expression
  mirroring its health.
- **Phase 2 — Rebuild the outcome** (the tree **heals**, or stays strained): a new
  attitude and a new way of acting lead to one of three outcomes. The **healthy** tree
  **bears fruit**. Then takeaways, a "why this matters" beat (the wider issue + key
  statistics behind a *Show the numbers* button), a personal leadership pledge, and support.

## The escalating pathway (reworked per Ali / PVAW)

If the player keeps choosing control from the **Under strain** outcome, three optional
screens (16–18) show Mr. Atlas's **escalating non‑physical behaviours** — raising his
voice and ending the conversation, then slamming the door and walking away — ending on a
calm, serious **"Where this can lead"** warning. There is **no lightning or fire**: the
cause is internal (his beliefs and behaviour), never an external strike. Every step is
reversible, and the support line is always present.

## The screens (in order)

| # | File | Phase | What it shows |
|---|---|---|---|
| 1 | `01-intro.png` | — | Welcome — meet Mr. Atlas (migrated 2023); "help him make better choices"; non‑blaming framing |
| 2 | `02-pressure-money.png` | 1 | Pressure — no work since arriving; money is tight; his home feels too small (not his fault) |
| 3 | `03-pressure-role.png` | 1 | Pressure — loss of role and status; he feels unseen |
| 4 | `04-pressures-explained.png` | 1 | **Two big pressures** — migration pressure & loss of status, named (Edu's dedicated explainer) |
| 5 | `05-behaviour.png` | 1 | Behaviour — under pressure he takes tight control (the problem, witnessed) |
| 6 | `06-impact.png` | 1 | Impact — partner not heard, children pull away; he doesn't see how his behaviour affects them |
| 7 | `07-belief.png` | 1 | Belief — "As the father, it is my job to lead and decide" (reflection) |
| 8 | `08-root-tree-model.png` | 1 | **The whole tree** — roots/soil/trunk/branches revealed; values & beliefs shape behaviour |
| 9 | `09-rebuild-intro.png` | 2 | Rebuild — the pressures remain, but the response can change |
| 10 | `10-attitude.png` | 2 | Attitude — a healthier belief (four options, incl. "children feel safe sharing their feelings") |
| 11 | `11-behaviour-good.png` | 2 | Behaviour — talk about finances & big decisions together, seek support |
| 12 | `12-impact-good.png` | 2 | Impact — open, respectful, shared; the home feels calmer and safer |
| 13 | `13-outcome-healthy.png` | 2 | **Healthy** — full green tree **bearing fruit**; change earned by choice |
| 14 | `14-outcome-mixed.png` | 2 | **Healing** — golden, some strain remains; "every step counts" |
| 15 | `15-outcome-damaged.png` | 2 | **Under strain** — old patterns held; a warning, always reversible |
| 16 | `16-insist-1.png` | 2 | *Escalation* — he digs in: raises his voice, ends the conversation; the family goes quiet |
| 17 | `17-insist-2.png` | 2 | *Escalation* — it gets heavier: slams the door, walks away, arms crossed; branches fall |
| 18 | `18-escalation-warning.png` | 2 | *Escalation* — **"Where this can lead"**: a calm, serious warning (no fire; internal cause) |
| 19 | `19-takeaways.png` | 2 | Takeaways — reflect back through the tree (belief → leader → behaviour → impact) |
| 20 | `20-why-matters.png` | 2 | **Why this matters** — the bigger picture + key statistics (at the *end*, per Anu; shown revealed) |
| 21 | `21-leadership.png` | 2 | Write one real, small leadership action of your own |
| 22 | `22-support.png` | 2 | Support & next steps — AMES SVAW course + community services |

## Getting them into Figma

1. In Figma: **File → Place image…** (or just **drag the 22 PNGs** onto the canvas).
2. Tip: select all 22 and use **Tidy up** (the grid icon, or `Ctrl/Cmd+Alt+T`) to lay
   them out in a neat grid.
3. To make it a **click-through prototype**: switch to **Prototype** mode and drag a
   connection from each screen to the next. The main branch is at **`11-behaviour-good`**:
   the healthy path goes to `12-impact-good` → `13-outcome-healthy`; a weaker choice goes
   to `14-outcome-mixed`; keeping the old pattern goes to `15-outcome-damaged`. All three
   outcomes link back to `09-rebuild-intro` ("go back and rebuild"). The optional escalation
   branch runs `15` → `16-insist-1` → `17-insist-2` → `18-escalation-warning`, each of which
   also offers "go back and rebuild".

## Notes

- **The outcome follows the Phase-2 rebuild, never the pressure itself.** The pressures
  (money, loss of status) and the impacts are narrative, never a "wrong answer".
- All three outcomes are reachable, and every strained/escalation screen always offers a
  way back to rebuild. The **1800RESPECT / 000** support line sits on every screen.
- The **statistics** carry finalised citations (AIHW 2018 · PM&C 2023 · ABS 2021) and sit
  behind a *Show the numbers* button in the live build — shown revealed here so reviewers
  can read the content.
- These are **static mockups** — for the actual interactive build, see
  `../POC_README.md` (the single-file HTML demo) or run the Next.js app.

## Regenerating

The set is composed by `scripts/screens-harness.html` (all 22 screens, from the real
engine + content + panel styles) and captured by `scripts/render-screens.mjs`, which
grabs each 1600 × 900 block individually over the Chrome DevTools Protocol (a single
full‑page screenshot would exceed Chrome's ~16k‑px ceiling). Serve the project root over
HTTP so the harness can import `lib/tree-engine.js` and `lib/game-content.js`:

```sh
python3 -m http.server 8099
# launch headless Chrome with --remote-debugging-port=9223 pointed at
#   http://localhost:8099/scripts/screens-harness.html
node scripts/render-screens.mjs 9223 docs/figma-screens 3500
```
