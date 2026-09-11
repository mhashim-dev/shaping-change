# Choosing the Build Approach — Articulate 360 vs H5P vs Custom Next.js

_A decision aid for the team: how the three options compare for building an
experience like **Power, Pressure & Choice**, and why a custom **Next.js** build is
the best fit for this kind of work._

---

## TL;DR — recommendation

For a **bespoke, emotionally-led, procedurally-animated branching experience** like
this one, the **custom Next.js build is the strongest fit**. Articulate 360 and H5P
are excellent, mature tools — but they are optimised for *rapidly authored, fairly
standard courses* (slides, quizzes, blocks) with built-in LMS tracking. They cannot
natively deliver the things that define this game: a **living, generated tree**
(drawn in real time, no images), a **custom health/decline system**, **full
branding and UX control**, **synthesised audio**, and a tiny, asset-free footprint.

The one honest trade-off: Articulate and H5P let **non-developers** author content;
the Next.js game needs a **developer** to change content (though it's structured as
editable data to make that easy). If the goal is many standard courses authored by
instructional designers with deep LMS reporting, the authoring tools win. For *this*
product, the custom build wins on almost every dimension that matters.

---

## What each option is

- **Articulate 360 (Storyline + Rise 360)** — the industry-standard e-learning
  authoring suite. **Storyline 360** is a slide-and-trigger desktop authoring tool
  (Windows; Mac via virtualization) for interactive, quiz-style courses;
  **Rise 360** is a web-based, template/block tool for responsive courses. Publishes
  HTML5 with strong SCORM/xAPI export. Subscription, per author.

- **H5P** — a free, **open-source (MIT)** framework offering ~50 ready-made
  "content types" (interactive video, quizzes, branching scenario, drag-and-drop)
  that embed into WordPress / Moodle / Drupal / LMSs. Self-host for free, or use the
  paid **H5P.com** hosted service.

- **Custom Next.js game (this build)** — a bespoke web app built in React/Next.js.
  The tree, scenery, particles and animation are **generated procedurally on a
  `<canvas>` (no image assets)**; the branching narrative + health/decline system is
  custom code; audio is **synthesised** via the Web Audio API. You own 100% of it.

---

## Comparison table

Ratings: **Strong** = does this natively and well · **Partial** = possible but
constrained · **Limited / Weak** = not really its purpose.

| Dimension | Articulate 360 (Storyline + Rise) | H5P | Custom Next.js game (this build) |
|---|---|---|---|
| **Design model** | Slides + triggers, or block templates — fixed paradigms | Pre-built "content types" embedded in a page | **Anything you can code** — no paradigm limits |
| **Custom / generated visuals & animation** | **Limited** — images, characters, slide transitions; no generative graphics | **Weak** — styled HTML widgets only | **Strong** — procedural canvas tree, scenery & particles, all generated |
| **Bespoke branching + custom logic** (health, wither, two-step leaf rule) | **Partial** — branching via variables/triggers; clunky for a real-time sim | **Partial** — a "Branching Scenario" type for slides/video, not a live simulation | **Strong** — full node graph + live health value driving the visuals |
| **UX & branding control** | **Partial** — themed inside their player chrome | **Partial** — embeds into a host page; limited styling | **Strong** — pixel-level control, fully branded |
| **Performance & footprint** | **Partial** — heavy published output (many files) | **Partial** — moderate | **Strong** — asset-free, resolution-independent, tiny & fast |
| **Custom audio** | **Partial** — add audio/narration files | **Partial** — audio in some content types | **Strong** — synthesised ambient bed + cues, no files |
| **Accessibility** | **Strong** — mature built-in features | **Strong** — many types are accessible | **Strong** — fully controllable (reduced-motion, non-colour cues, ARIA) — your responsibility |
| **Authoring by non-developers** | **Strong** — built for instructional designers, no code | **Strong** — web authoring forms | **Weak** — needs a developer (content is editable data, but in code) |
| **LMS / SCORM / xAPI tracking** | **Strong** — SCORM 1.2/2004, xAPI, cmi5, AICC out of the box | **Partial** — xAPI statements; LMS embed via plugins | **Partial** — not built in; add an xAPI/SCORM wrapper if needed |
| **Ownership & lock-in** | **Weak** — proprietary files, vendor lock-in, ongoing subscription | **Strong** — open-source, but tied to the H5P framework | **Strong** — you own all the code; standard open stack |
| **Extensibility / future-proofing** | **Partial** — bound to the vendor roadmap | **Partial** — open, but an older architecture for custom types | **Strong** — modern stack; integrate analytics, APIs, AI, anything |
| **Licensing cost** | **$1,449 (Personal) – $1,749 (Teams) per author / year**, annual, per seat | **Software free** (self-host); **H5P.com** hosted is paid (quote) | **No licensing** — developer time + hosting (Vercel/static, free–low) |

---

## Why the Next.js game is the better choice for this project

1. **It can do the one thing the others fundamentally can't — the living tree.**
   The core of this experience is a tree that *grows, blooms, yellows, sheds and
   dies* in real time, generated entirely in code with no images. Articulate and
   H5P are built around slides, blocks and pre-made widgets; neither can produce a
   bespoke procedural animation like this.

2. **The branching + health system is real custom logic, not a slide jump.** A
   hidden health value drives colour change, leaf-fall, branch droop and recovery,
   with a two-step "recolour then fall" cue. That's a small simulation — natural in
   code, awkward-to-impossible in a trigger/variable authoring tool.

3. **Total branding and UX control.** Every pixel, font, colour and transition is
   ours — no third-party player chrome, watermark or template constraints. For a
   sensitive, brand-led prevention message, that control matters.

4. **Lightweight and fast.** No image/audio assets means a tiny, resolution-
   independent build that loads quickly and scales to any screen — versus the heavy,
   multi-file output typical of published courses.

5. **You own it, with no per-seat licensing.** The code is yours on a standard open
   stack (React/Next.js). There's no recurring author subscription, no proprietary
   file format, and any web developer can maintain or extend it.

6. **Future-proof and integrable.** Because it's a normal web app, you can later add
   analytics, xAPI tracking, new scenarios, localisation, or AI features without
   waiting on a vendor's roadmap.

---

## Where Articulate or H5P would be the better choice

To be fair — these tools are excellent for what they're for, and would beat a custom
build when:

- **Non-developers need to author and update content frequently** (instructional
  designers building many courses without engineering support).
- **Deep LMS reporting is the priority** — completion, scores and detailed xAPI/SCORM
  tracking out of the box (Articulate is especially strong here).
- **You need standard course patterns fast** — quizzes, interactive video,
  click-and-reveal, knowledge checks — from a library of ready-made types.
- **There's no developer to maintain a codebase** over time.

This project is the opposite case: a single, bespoke, design-led interactive where
the *experience itself* is the point — which is exactly where a custom build shines.

---

## Cost summary

| | Up-front | Ongoing | Notes |
|---|---|---|---|
| **Articulate 360** | — | **$1,449–$1,749 per author / year** | Annual, per seat; every person who edits needs a licence |
| **H5P** | Setup/hosting | **Free software**; H5P.com SaaS paid | Free to self-host on WordPress/Moodle/Drupal; MIT-licensed |
| **Custom Next.js** | Developer build (done) | **Hosting only** (free–low) | No licensing or per-seat fees; deploy to Vercel or any static host |

---

## Recommendation

**Build it as the custom Next.js app.** It is the only option that delivers the
generated living tree, the custom health/decline system, full branding, synthesised
audio and a lightweight footprint — with no per-seat licensing and full ownership.
If, later, the organisation needs LMS completion/tracking, that can be added with an
xAPI or SCORM wrapper without changing the approach. Reserve Articulate / H5P for
standard, rapidly-authored courses where non-developers must do the authoring and
detailed LMS reporting is the main requirement.

---

_Sources: [Articulate 360 pricing](https://www.articulate.com/360/pricing/) ·
[Articulate 360 pricing 2026 (eLearning Industry)](https://elearningindustry.com/directory/elearning-software/articulate-360/pricing) ·
[H5P licensing (MIT)](https://h5p.org/licensing) ·
[H5P pricing](https://h5p.org/node/1481473). Pricing is indicative and may change;
confirm current figures before budgeting._
