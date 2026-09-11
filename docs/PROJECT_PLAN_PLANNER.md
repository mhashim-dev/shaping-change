# Project Plan — Publishing *Power, Pressure & Choice* (for Microsoft Planner)

Internal project to build the interactive and publish it on the AMES Australia website.
Built for **Microsoft Planner (Premium)**. No budget/procurement tasks.

**Schedule:** the approved content was **received on Wed 1 July 2026**, and the project is
to be **finished by Fri 31 July 2026** — including QA, the Education + PVAW review, and
fixes. **Google Analytics is the final stage**, added after launch. It is an aggressive
one‑month schedule, so several tracks **run in parallel** (see §2).

**Kept deliberately lean** — 21 tasks so the board stays easy to scan. The development
build is a few generic tasks; the detail lives inside each task's **checklist**.

**How this document is laid out:**
1. **Overview** — who's involved and the shape of the project.
2. **Timeline (July 2026)** — dated, with the parallel tracks.
3. **Master task list** — every task, numbered, with owner, duration and dependencies.
4. **Set it up in Planner** — buckets, labels, goals, dates, and **how to add dependencies**.
5. **Task checklists** — the detail for each task.

---

## 1. Overview

| Role | Who | Does |
|---|---|---|
| **Me (PM/Dev)** | You | Project management **and** development — build the game, accessibility, analytics code, fixes, go‑live coordination |
| **Edu team** | Stakeholder | Delivered the **finalised content** (1 Jul); joins the single review |
| **PVAW team** | Stakeholder | Violence‑prevention / pedagogy oversight; joins the single review |
| **Digital team** | Internal | **QA** and the **website side** — hosting, Drupal embed, security headers, scans, GA setup, deploy |
| **IT / Security** | Internal | Reviews and **signs off** the security assessment |

**What shapes the plan:**
- **Content received 1 Jul → finish 31 Jul.** The build starts on the content (task 4) and
  everything must land inside July, including QA, the Edu + PVAW review and fixes.
- **One stakeholder review** (Edu + PVAW together, task 15). QA and the IT security sign‑off
  are separate technical gates, not extra content reviews.
- **Google Analytics is the final stage** (tasks 20–21). The site launches without analytics
  to hit the date, then GA4 is added straight after — so analytics is **not** part of QA or
  the launch smoke‑test.

---

## 2. Timeline — July 2026

Content **received Wed 1 Jul**, target **finish Fri 31 Jul**. To fit the month, the
Digital‑team integration track overlaps the build tail, and QA / the stakeholder review run
on the near‑final build.

| Phase (bucket) | Dates (2026) | Notes |
|---|---|---|
| 1 · Initiation & Sign‑off | Wed 1 Jul | Quick kickoff the day content arrives |
| 2 · Content Intake & Build | Wed 1 Jul – Thu 16 Jul | The long pole (~2.5 weeks) |
| 3 · Security & Integration | Wed 16 Jul – Fri 24 Jul | Digital team; starts alongside the build tail |
| 4 · QA | Wed 22 Jul – Fri 24 Jul | Functional, cross‑browser, accessibility |
| 5 · Stakeholder Review & Sign‑off (Edu + PVAW) | Mon 27 Jul – Tue 28 Jul | One consolidated review + fixes |
| 6 · Launch & Handover | **Wed 29 Jul** | Go‑live readiness + publish + smoke test |
| 7 · **Analytics & Privacy (final stage)** | **Thu 30 – Fri 31 Jul** | **GA4 added last, after launch** |

**Key dates**
- **Wed 1 Jul** — approved content received *(build trigger)*.
- **Thu 16 Jul** — build complete (incl. accessibility + internal QA).
- **~Fri 24 Jul** — security sign‑off + QA done.
- **Tue 28 Jul** — Edu + PVAW review complete and fixes done.
- **Wed 29 Jul** — **go live**.
- **Fri 31 Jul** — **Google Analytics live** (final stage); project complete. *(Monitoring &
  support then continues into early August.)*

---

## 3. Master task list (with dependencies)

**How to read it:** **#** is the task number. **Depends on** lists the number(s) that must
finish first (a dash = no predecessor). **Days** = working‑day estimate — note phases
**overlap** (see §2), so the calendar is shorter than the durations added up. Tasks are in
build order.

| # | Task | Phase | Owner | Pri | Days | Depends on |
|---|---|---|---|---|---|---|
| 1 | Confirm scope, roles & the single review | Initiation & Sign‑off | Me (PM/Dev) | High | 1 | — |
| 2 | Confirm AMES technical prerequisites | Initiation & Sign‑off | Digital team | High | 1 | — |
| 3 | Set up the Planner plan & link docs | Initiation & Sign‑off | Me (PM/Dev) | Medium | 1 | — |
| 4 | **Receive finalised game content (Edu team)** — *1 Jul* | Content Intake & Build | Edu team | High | 1 | — |
| 5 | Build the game visuals & world | Content Intake & Build | Me (PM/Dev) | High | 4 | 4 |
| 6 | Build the game flow & interface | Content Intake & Build | Me (PM/Dev) | High | 3 | 5 |
| 7 | Wire in the finalised content & the three outcomes | Content Intake & Build | Me (PM/Dev) | High | 2 | 6 |
| 8 | Pedagogy guardrail check (with PVAW) | Content Intake & Build | Me (PM/Dev) + PVAW | High | 1 | 7 |
| 9 | Accessibility (WCAG 2.1 AA) & internal build QA | Content Intake & Build | Me (PM/Dev) | High | 2 | 7 |
| 10 | Provision hosting & apply security headers/CSP | Security & Integration | Digital team | High | 2 | 9 |
| 11 | Embed in the Drupal page & run security scans | Security & Integration | Digital team | High | 2 | 10 |
| 12 | IT/Security review & sign‑off | Security & Integration | IT/Security | High | 1 | 10, 11 |
| 13 | QA — functional, cross‑browser/device & accessibility | QA | Digital team | High | 2 | 11 |
| 14 | Fix issues found in QA | QA | Me (PM/Dev) | High | 2 | 13 |
| 15 | **Stakeholder review & sign‑off (Edu + PVAW)** | Stakeholder Review & Sign‑off | Edu + PVAW | High | 2 | 14 |
| 16 | Address review feedback | Stakeholder Review & Sign‑off | Me (PM/Dev) | High | 2 | 15 |
| 17 | Go‑live readiness review | Launch & Handover | Me (PM/Dev) | High | 1 | 12, 16 |
| 18 | Publish, announce & smoke test | Launch & Handover | Digital + Me | High | 1 | 17 |
| 19 | Monitor, support & documentation handover | Launch & Handover | Me (PM/Dev) | Medium | 3 | 18 |
| 20 | **Set up analytics & events (GA4) + data‑minimisation** | Analytics & Privacy | Me (PM/Dev) | Medium | 2 | 18 |
| 21 | **GA4 property, consent, privacy notice & verify** | Analytics & Privacy | Digital + Me | High | 1 | 20 |

**The critical path** (the chain that sets the end date):
**4 → 5 → 6 → 7 → 9 → 10 → 11 → 13 → 14 → 15 → 16 → 17 → 18 → 20 → 21.**
Google Analytics (20–21) is the tail, added after launch (18).

---

## 4. Set it up in Planner

### 4.1 Buckets and labels
- **Buckets (columns) = the 7 phases:** Initiation & Sign‑off · Content Intake & Build ·
  Security & Integration · QA · Stakeholder Review & Sign‑off · Launch & Handover ·
  **Analytics & Privacy** *(final)*.
- **Labels (colour tags), one per task by owner:** `Me (PM/Dev)` · `Edu team` ·
  `PVAW team` · `Digital team` · `IT/Security`.
- **Goals (Premium → Goals):** G1 Live on ames.net.au by 31 Jul · G2 WCAG 2.1 AA ·
  G3 IT security sign‑off · G4 Analytics live & privacy‑compliant (final stage).

### 4.2 Adding the tasks
Fastest: in each bucket, **+ Add task → paste** that bucket's task names from
`planner-tasks-by-bucket.txt` (Planner creates them all at once). Full steps and the
automated option are in **PLANNER_IMPORT_GUIDE.md**. Then add each task's checklist (§5),
owner, priority, duration and dates.

### 4.3 Dates and dependencies (Planner Premium)

**Set the dates from §2.** Give task **4** a start date of **1 Jul 2026**, then set each
bucket's start from the §2 calendar. Because the month is tight, **set the phase start dates
directly** (parallel tracks) rather than relying purely on finish‑to‑start chaining — the
dependencies below capture the must‑finish‑before order **within** each track.

**Add the dependencies (Grid view):**
1. Switch to **Grid** view; add tasks **in the table order** so row numbers match the **#** column.
2. Add the **"Depends on"** column (**+ Add column → Depends on**).
3. In each task's **Depends on** cell, type the predecessor **number(s)** — comma‑separated,
   e.g. enter `10, 11` on task **12 (IT/Security review & sign‑off)**.

Or draw the links in **Timeline (Schedule)** view: grab the round link handle on a bar's
right edge and drag to the successor. Work down the critical path
(4 → 5 → 6 → 7 → 9 → 10 → 11 → 13 → 14 → 15 → 16 → 17 → 18 → 20 → 21).

> Planner uses **finish‑to‑start** links. Because the calendar overlaps phases to fit July,
> the durations added up are longer than the calendar — trust the §2 dates for scheduling.

---

## 5. Task checklists (the detail for each task)

Owner, duration and dependencies are in the master table (§3). Paste these into each task's
**Checklist** in Planner.

### Phase 1 — Initiation & Sign‑off  _(Wed 1 Jul)_
- **1. Confirm scope, roles & the single review** — in/out of scope and success measures (launch by 31 Jul, WCAG AA, IT sign‑off); roles (Me = PM + developer; Edu = finalised content; PVAW = oversight; Digital = QA + integration; IT = security sign‑off); agree the one review.
- **2. Confirm AMES technical prerequisites** — Drupal CSP?; cookie‑consent tool; hosting choice & target URL.
- **3. Set up the Planner plan & link docs** — buckets, labels, goals; attach the docs.

### Phase 2 — Content Intake & Build  _(Wed 1 Jul – Thu 16 Jul)_
- **4. Receive finalised game content (Edu team)** — final copy, choices and structure delivered **1 Jul**; confirm completeness before build. _(Build trigger.)_
- **5. Build the game visuals & world** — set up the app; procedural tree (trunk, branches, roots) with stage‑based growth; living landscape (sky, hills, meadow, sun, clouds, ambient motion); health‑driven states — decline (leaf fall, thinning, bark, snag) and watering / heal feedback.
- **6. Build the game flow & interface** — branching logic & game state (choices, forward/back navigation, outcome resolution); UI panel & responsive layout (question, choices, insight, progress, support line; desktop panel vs mobile bottom‑sheet); synthesised audio (mute toggle) and save/resume progress.
- **7. Wire in the finalised content & the three outcomes** — load the Edu copy and branches end‑to‑end; the three outcomes (Healthy / Healing / Under strain) plus the path recap.
- **8. Pedagogy guardrail check (with PVAW)** — support line on every screen; no "wrong answer" on pressures/impacts; harm never heals; no shame language; the damaged outcome is reversible.
- **9. Accessibility (WCAG 2.1 AA) & internal build QA** — keyboard nav & focus, labels/text alternatives, contrast, reduced‑motion, screen‑reader run‑through; cross‑device polish and fixes; static export (`output:'export'`; `npm run build` → `out/`) tested locally.

### Phase 3 — Security & Integration  _(Wed 16 Jul – Fri 24 Jul; Digital team, overlaps the build tail)_
- **10. Provision hosting & apply security headers/CSP** — subdomain (recommended) or subfolder; DNS, HTTPS, MIME/cache; deploy `out/`; CSP, HSTS, X‑Content‑Type‑Options, frame‑ancestors, Referrer‑Policy, Permissions‑Policy, tuned to the build.
- **11. Embed in the Drupal page & run security scans** — page/block, responsive iframe, allow `<iframe>` in the text format, title/allow attributes; npm audit / SCA; OWASP ZAP; manual XSS test on the commitment field.
- **12. IT/Security review & sign‑off** — walk the risk register; complete the go‑live checklist; record approval.

### Phase 4 — QA  _(Wed 22 Jul – Fri 24 Jul)_  ·  *no analytics here — GA is the final stage*
- **13. QA — functional, cross‑browser/device & accessibility** — all branches & three outcomes, back/restart, persistence, audio, edge cases; Chrome/Edge/Safari/Firefox, iOS & Android, iframe scaling, keyboard focus; screen reader / keyboard‑only / contrast / reduced‑motion.
- **14. Fix issues found in QA** — triage and fix; redeploy; retest with the Digital team.

### Phase 5 — Stakeholder Review & Sign‑off  _(Mon 27 Jul – Tue 28 Jul; the single review)_
- **15. Stakeholder review & sign‑off (Edu + PVAW)** — one consolidated review of the QA'd game; confirm it matches the finalised content; pedagogy, guardrails, support line; capture one set of feedback; record sign‑off.
- **16. Address review feedback** — implement agreed changes; re‑confirm if needed.

### Phase 6 — Launch & Handover  _(Wed 29 Jul)_
- **17. Go‑live readiness review** — tick the security go‑live checklist; QA + accessibility done; IT sign‑off **and** stakeholder sign‑off both in.
- **18. Publish, announce & smoke test** — publish the page, add to menu/nav, internal comms, optional soft launch; then verify the live page, headers live, support line visible. _(Analytics is added next, in the final stage.)_
- **19. Monitor, support & documentation handover** — watch feedback/error reports and triage with the Digital team (first weeks), patch cadence; store all docs in the AMES repo / SharePoint; lessons learned; future ideas with Edu/PVAW. _(Continues into early August.)_

### Phase 7 — Analytics & Privacy  _(Thu 30 – Fri 31 Jul — **the final stage**)_
- **20. Set up analytics & events (GA4) + data‑minimisation** — add gtag + `lib/analytics` to the **live** site; fire game_start, choice_made, outcome_reached, commitment_written, restart; **report the two headline measures Thuy asked for — number of participants** (unique `game_start` / users) **and time spent** (GA4 engagement time per session); **data‑minimisation:** no free‑text/commitment sent, only fixed labels, kind and hidden health.
- **21. GA4 property, consent, privacy notice & verify** — GA4 data stream / Measurement ID; consent (Consent Mode v2 / banner); IP anonymisation; update the privacy policy; verify events in DebugView/Realtime (no free‑text captured); mark key events; basic reports.

---

## Assumptions

- **Content received 1 Jul 2026; target finish 31 Jul 2026.** Working‑day estimates for one
  developer; **phases overlap** (parallel tracks) so the calendar (§2) fits the month even
  though the durations added up are longer.
- **You are PM + Developer**; the Digital team and stakeholders own the rest.
- **One stakeholder review** (task 15, Edu + PVAW together) on the QA'd build.
- **Google Analytics is deliberately the final stage** (tasks 20–21): the site launches
  without analytics on ~29 Jul, then GA4 + consent are added ~30–31 Jul. The launch page has
  no cookies until then, so no consent is needed at launch. Analytics is therefore **not**
  part of QA or the launch smoke‑test.
- **"Digital team" covers QA and the website side** (hosting, Drupal embed, headers, scans,
  GA setup, deploy). If they only do QA, reassign the web tasks to yourself.
- **No budget/procurement tasks** (internal project).
