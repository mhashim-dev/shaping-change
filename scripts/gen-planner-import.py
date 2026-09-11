#!/usr/bin/env python3
"""Generate import helpers for the Microsoft Planner project plan:
  - docs/planner-import.csv          (fields + durations + checklists, for Power Automate)
  - docs/planner-tasks-by-bucket.txt (clean task names per bucket, for the paste route)
"""
import csv, os

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DOCS = os.path.join(ROOT, 'docs')

# (Bucket, Task, Priority, Duration(days), Owner/Label, [checklist...], Depends on, Reference)
# Kept deliberately lean for a ~1-month project (content received 1 Jul 2026; target
# finish by 31 Jul 2026). Phase 2 (the build) is a few generic tasks — detail in the
# checklists. Phases OVERLAP (parallel tracks) to fit the month. Google Analytics is the
# FINAL stage: it is added after launch, so it is removed from QA and the launch smoke-test.
T = [
 ('Initiation & Sign-off', 'Confirm scope, roles & the single review', 'High', 1, 'Me (PM/Dev)',
  ['In/out of scope (internal; public embed); success measures (launch by 31 Jul, WCAG AA, IT sign-off)',
   'Roles: Me = PM + developer; Edu = finalised content; PVAW = pedagogy oversight; Digital = QA + integration; IT = security sign-off',
   'Agree ONE stakeholder review (Edu + PVAW)'], '', ''),
 ('Initiation & Sign-off', 'Confirm AMES technical prerequisites', 'High', 1, 'Digital team',
  ['Drupal CSP in force?; cookie-consent tool', 'Hosting choice (subdomain vs subfolder); target URL'], '', 'AMES_DRUPAL_INTEGRATION.md'),
 ('Initiation & Sign-off', 'Set up the Planner plan & link docs', 'Medium', 1, 'Me (PM/Dev)',
  ['Finalise buckets, labels, goals', 'Attach GDD, integration, security, project plan'], '', 'PROJECT_PLAN_PLANNER.md'),

 # ---- Content Intake & Build (starts on the finalised content — received 1 Jul) ----
 ('Content Intake & Build', 'Receive finalised game content document (Edu team)', 'High', 1, 'Edu team',
  ['Edu delivered final copy, choices and structure on 1 Jul 2026', 'Confirm completeness; clarify gaps before build (build trigger)'], '', ''),
 ('Content Intake & Build', 'Build the game visuals & world', 'High', 4, 'Me (PM/Dev)',
  ['Set up the app; procedural tree (trunk, branches, roots) with stage-based growth',
   'Living landscape (sky, hills, meadow, sun, clouds, ambient motion)',
   'Health-driven states: decline (leaf fall, thinning, bark, snag) + watering / heal feedback'], 'Receive finalised game content document (Edu team)', ''),
 ('Content Intake & Build', 'Build the game flow & interface', 'High', 3, 'Me (PM/Dev)',
  ['Branching logic & game state (choices, forward/back navigation, outcome resolution)',
   'UI panel & responsive layout (question, choices, insight, progress, support line; desktop panel vs mobile bottom-sheet)',
   'Synthesised audio (mute toggle) + save/resume progress'], 'Build the game visuals & world', ''),
 ('Content Intake & Build', 'Wire in the finalised content & the three outcomes', 'High', 2, 'Me (PM/Dev)',
  ['Load the Edu copy and branches end-to-end', 'The three outcomes (Healthy / Healing / Under strain) + path recap'], 'Build the game flow & interface', ''),
 ('Content Intake & Build', 'Pedagogy guardrail check (with PVAW)', 'High', 1, 'Me (PM/Dev) + PVAW team',
  ['Support line on every screen; no "wrong answer" on pressures/impacts', 'Harm never heals; no shame language; damaged outcome reversible'], 'Wire in the finalised content & the three outcomes', 'GAME_DESIGN_DOCUMENT.md'),
 ('Content Intake & Build', 'Accessibility (WCAG 2.1 AA) & internal build QA', 'High', 2, 'Me (PM/Dev)',
  ['Keyboard nav & focus; labels/text alternatives; contrast; reduced-motion; screen-reader run-through',
   'Cross-device polish; fix build issues',
   "Static export (output:'export'; npm run build -> out/); test locally"], 'Wire in the finalised content & the three outcomes', 'AMES_DRUPAL_INTEGRATION.md'),

 # ---- Security & Integration (Digital team — can start alongside the build tail) ----
 ('Security & Integration', 'Provision hosting & apply security headers/CSP', 'High', 2, 'Digital team',
  ['Subdomain (recommended) or subfolder; DNS, HTTPS, MIME/cache; deploy out/',
   'CSP, HSTS, X-Content-Type-Options, frame-ancestors, Referrer-Policy, Permissions-Policy (tuned to the build)'], 'Accessibility (WCAG 2.1 AA) & internal build QA', 'AMES_DRUPAL_INTEGRATION.md'),
 ('Security & Integration', 'Embed in the Drupal page & run security scans', 'High', 2, 'Digital team',
  ['Create page/block; responsive iframe; allow <iframe> in text format; title/allow attributes',
   'npm audit / SCA; OWASP ZAP; manual XSS test on the commitment field'], 'Provision hosting & apply security headers/CSP', 'AMES_DRUPAL_INTEGRATION.md'),
 ('Security & Integration', 'IT/Security review & sign-off', 'High', 1, 'IT/Security',
  ['Walk the risk register; complete the go-live checklist', 'Record approval'], 'Provision hosting & apply security headers/CSP; Embed in the Drupal page & run security scans', 'SECURITY_RISK_ASSESSMENT.md'),

 # ---- QA (no analytics here — GA is the final stage) ----
 ('QA', 'QA - functional, cross-browser/device & accessibility', 'High', 2, 'Digital team',
  ['All branches & three outcomes; back/restart; persistence; audio; edge cases',
   'Chrome/Edge/Safari/Firefox; iOS & Android; iframe scaling; keyboard focus',
   'Screen reader / keyboard-only / contrast / reduced-motion'], 'Embed in the Drupal page & run security scans', ''),
 ('QA', 'Fix issues found in QA', 'High', 2, 'Me (PM/Dev)',
  ['Triage and fix; redeploy', 'Retest with the Digital team'], 'QA - functional, cross-browser/device & accessibility', ''),

 ('Stakeholder Review & Sign-off', 'Stakeholder review & sign-off (Edu + PVAW)', 'High', 2, 'Edu team + PVAW team',
  ['One consolidated review of the QA-d game (both teams together)', 'Confirm build matches the finalised content; pedagogy, guardrails, support line', 'Capture one set of feedback; record sign-off'], 'Fix issues found in QA', ''),
 ('Stakeholder Review & Sign-off', 'Address review feedback', 'High', 2, 'Me (PM/Dev)',
  ['Implement agreed changes', 'Re-confirm with stakeholders if needed'], 'Stakeholder review & sign-off (Edu + PVAW)', ''),

 # ---- Launch & Handover (target launch ~29 Jul) ----
 ('Launch & Handover', 'Go-live readiness review', 'High', 1, 'Me (PM/Dev)',
  ['Tick security go-live checklist + QA + accessibility', 'Confirm IT sign-off AND stakeholder sign-off are in'], 'IT/Security review & sign-off; Address review feedback', 'SECURITY_RISK_ASSESSMENT.md'),
 ('Launch & Handover', 'Publish, announce & smoke test', 'High', 1, 'Digital team + Me (PM/Dev)',
  ['Publish page; add to menu/nav; internal comms; optional soft launch', 'Verify live page; headers live; support line visible'], 'Go-live readiness review', ''),
 ('Launch & Handover', 'Monitor, support & documentation handover', 'Medium', 3, 'Me (PM/Dev)',
  ['Watch feedback/error reports; triage with the Digital team (first weeks); patch cadence',
   'Store all docs in AMES repo / SharePoint; lessons learned; future ideas with Edu/PVAW'], 'Publish, announce & smoke test', ''),

 # ---- Analytics & Privacy (THE FINAL STAGE — added after launch, ~30-31 Jul) ----
 ('Analytics & Privacy', 'Set up analytics & events (GA4) + data-minimisation', 'Medium', 2, 'Me (PM/Dev)',
  ['Add gtag + lib/analytics to the live site; fire game_start, choice_made, outcome_reached, commitment_written, restart',
   'Data-minimisation: NO free-text/commitment sent; only fixed labels, kind, hidden health'], 'Publish, announce & smoke test', 'AMES_DRUPAL_INTEGRATION.md'),
 ('Analytics & Privacy', 'GA4 property, consent, privacy notice & verify', 'High', 1, 'Digital team + Me (PM/Dev)',
  ['GA4 data stream / Measurement ID; consent (Consent Mode v2 / banner); IP anonymisation; update privacy policy',
   'Verify events in DebugView/Realtime (no free-text captured); mark key events; basic reports'], 'Set up analytics & events (GA4) + data-minimisation', 'SECURITY_RISK_ASSESSMENT.md'),
]

# number every task (1..N, in list order) and resolve dependencies to those numbers
name_to_num = {row[1]: i for i, row in enumerate(T, 1)}

def dep_numbers(dep_str):
    if not dep_str:
        return ''
    nums = []
    for name in [d.strip() for d in dep_str.split(';') if d.strip()]:
        nums.append(str(name_to_num.get(name, '?')))
    return ', '.join(nums)

# CSV (one row per task; checklist items joined with " | ")
csv_path = os.path.join(DOCS, 'planner-import.csv')
with open(csv_path, 'w', newline='', encoding='utf-8-sig') as f:
    w = csv.writer(f)
    w.writerow(['#', 'Bucket', 'Task', 'Priority', 'Duration (days)', 'Owner (label)',
                'Depends on (#)', 'Checklist', 'Reference'])
    for i, (b, task, pri, dur, owner, cl, dep, ref) in enumerate(T, 1):
        w.writerow([i, b, task, pri, dur, owner, dep_numbers(dep), ' | '.join(cl), ref])

# Per-bucket plain task names (for the multi-line paste route)
txt_path = os.path.join(DOCS, 'planner-tasks-by-bucket.txt')
order = []
for row in T:
    if row[0] not in order:
        order.append(row[0])
with open(txt_path, 'w', encoding='utf-8') as f:
    for b in order:
        f.write('=== Bucket: ' + b + ' ===\n')
        for row in T:
            if row[0] == b:
                f.write(row[1] + '\n')
        f.write('\n')

# Master task + dependency table (Markdown) — the scannable reference for the plan doc
md_path = os.path.join(DOCS, 'planner-master-table.md')
with open(md_path, 'w', encoding='utf-8') as f:
    f.write('| # | Task | Phase | Owner | Pri | Days | Depends on |\n')
    f.write('|---|---|---|---|---|---|---|\n')
    for i, (b, task, pri, dur, owner, cl, dep, ref) in enumerate(T, 1):
        dn = dep_numbers(dep) or '—'
        f.write('| %d | %s | %s | %s | %s | %d | %s |\n' % (i, task, b, owner, pri, dur, dn))

phase2 = sum(r[3] for r in T if r[0] == 'Content Intake & Build')
print('wrote', os.path.relpath(csv_path, ROOT), '(%d tasks)' % len(T))
print('wrote', os.path.relpath(txt_path, ROOT))
print('wrote', os.path.relpath(md_path, ROOT))
print('Phase 2 (build) effort: %d working days (~%.1f weeks)' % (phase2, phase2 / 5.0))
