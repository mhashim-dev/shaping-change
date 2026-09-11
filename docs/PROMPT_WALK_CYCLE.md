# Prompt — natural side-profile walk cycle for Mr. Atlas

*Paste this into a Claude design/artifact session. The result (a `drawAtlasWalker`
function inside an interactive HTML preview) is written to drop straight into
`lib/tree-engine.js` — bring it back and it will be integrated with the walk-in.*

---

Build a natural side-profile walk cycle for a flat-vector canvas character.

I need a walking animation for "Mr. Atlas", a procedural character in an HTML5 canvas
game. Everything is drawn with the Canvas 2D API — no images, no sprites, no libraries,
no external assets of any kind (hard requirement: the game must stay fully
self-contained). Canvas convention: y grows downward.

THE CHARACTER (match exactly):
- Flat vector style: simple rounded shapes, no outlines
- Colours: skin #b97a4e · hair #2b2018 (short, dark) · long-sleeve top #5f6b74 with
  darker sleeve tone #4d5760 · trousers #3b3640 · shoes #2b2018 · far-side limbs
  slightly darker for depth
- Proportions at scale 1: total height ≈ 200px, head radius ≈ 30, hips ≈ 92px above
  the ground line, shoulders ≈ 178px above the ground line
- He is a middle-aged man, warm and approachable. This is a serious educational story:
  calm and purposeful, NOT bouncy or cartoonish — no squash-and-stretch.

WHAT I NEED — a walk that reads as a real walk (walking left → right):
1. Two-segment legs: thigh + calf with a bending KNEE (knee bends most in the
   passing/lift phase; the leg is nearly straight at heel strike)
2. A proper 4-pose gait — contact (heel strike) → down (weight) → passing → push-off —
   cycled for both legs at half-phase offset
3. Feet that PLANT without sliding, with visible heel-strike and toe-off; shoes point
   in the walking direction
4. Arms with elbows, swinging opposite the legs, relaxed
5. Subtle body dynamics: forward lean ~3–5°, vertical bob synced to the steps
   (body highest at the passing pose)
6. Profile head facing right: hair as a back/top rim, a visible nose, one eye and one
   brow. The brow must be neutral/friendly — a brow angled DOWN toward the front reads
   as a scowl. Gentle, content mouth.

REQUIRED API (so I can drop it into my engine) — plain ES5 JavaScript (var + function
declarations, no classes, no arrow functions, no imports), one self-contained function:

    // ctx: CanvasRenderingContext2D · x: figure centre-x · groundY: ground line y
    // s: uniform scale (my game uses 0.82) · phase: gait phase in radians,
    // one full cycle (two steps) per 2π.
    // IMPORTANT CONTRACT: I advance `phase` proportionally to distance covered
    // (phase = distanceTravelled * k), so all motion must derive from `phase` only —
    // no time-based math inside the function. Tell me what k (radians per pixel of
    // travel) makes the feet plant without sliding for your stride length.
    // Do not clear the canvas inside the function; save/restore any ctx state you touch.
    function drawAtlasWalker(ctx, x, groundY, s, phase) { ... }

DELIVERABLE — one single-file interactive HTML preview (inline CSS/JS only):
1. The character walking continuously across a flat ground line, looping
2. A row of 8 frozen poses spanning one full cycle, side by side, for inspecting
   each pose
3. Sliders for walk speed and scale, plus a pause button
4. The drawAtlasWalker function isolated in one clearly-marked block, ready to copy out

Before you finish, watch the loop critically and fix anything that reads as
moonwalking, skating, limping, or stiffness. The bar: "a calm man walking to work,
seen from the side" — not a game sprite.
