#!/usr/bin/env python3
"""Build a 2-slide manager/team PROGRESS UPDATE for the week of 14-20 Jul 2026.

Styled to match the walkthrough deck (same palette + fonts). Deliberately
forward-looking: it reports approvals secured, scope locked, design mockups + a
voiceover script produced, and the BUILD KICKED OFF — culminating in a mid-August
first draft. (It does not present the activity as finished.)

    pip install python-pptx
    python3 scripts/build-progress-slide.py   # -> docs/Shaping-Change-Progress-Update.pptx
"""
import os
from pptx import Presentation
from pptx.util import Emu, Pt
from pptx.dml.color import RGBColor
from pptx.enum.shapes import MSO_SHAPE
from pptx.enum.text import PP_ALIGN, MSO_ANCHOR

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
HERO = os.path.join(ROOT, 'docs', 'images', 'scene-flourishing.png')

GOLD = RGBColor(0xF0, 0xC6, 0x6A); INK = RGBColor(0x2A, 0x1F, 0x10)
DARK = RGBColor(0x20, 0x18, 0x0F); PANEL = RGBColor(0x17, 0x11, 0x0A)
CREAM = RGBColor(0xF5, 0xEF, 0xE2); MUTE = RGBColor(0xCF, 0xC7, 0xB8)
LINEC = RGBColor(0x4A, 0x3E, 0x2A); CALLOUT = RGBColor(0x241B, 0x241B, 0x241B) if False else RGBColor(0x24, 0x1B, 0x10)
SERIF, SANS = 'Georgia', 'Helvetica'

W, H = 12192000, 6858000
prs = Presentation(); prs.slide_width = Emu(W); prs.slide_height = Emu(H)
blank = prs.slide_layouts[6]


def runs_para(tf, runs, *, align=PP_ALIGN.LEFT, before=0, after=6, spacing=None, reuse=None):
    """Add a paragraph built from a list of (text, size, font, color, bold, italic) runs."""
    if reuse is None:
        p = tf.paragraphs[0] if (len(tf.paragraphs) == 1 and not tf.paragraphs[0].runs) else tf.add_paragraph()
    else:
        p = reuse
    p.alignment = align
    if before: p.space_before = Pt(before)
    p.space_after = Pt(after)
    if spacing: p.line_spacing = spacing
    for (text, size, font, color, bold, italic) in runs:
        r = p.add_run(); r.text = text
        r.font.size = Pt(size); r.font.name = font; r.font.bold = bold
        r.font.italic = italic; r.font.color.rgb = color
    return p


def para(tf, text, size, font, color, **kw):
    return runs_para(tf, [(text, size, font, color, kw.pop('bold', False), kw.pop('italic', False))], **kw)


def rrect(slide, x, y, w, h, fill, line=None, line_w=1.0):
    shp = slide.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, Emu(x), Emu(y), Emu(w), Emu(h))
    shp.fill.solid(); shp.fill.fore_color.rgb = fill
    if line is None:
        shp.line.fill.background()
    else:
        shp.line.color.rgb = line; shp.line.width = Pt(line_w)
    shp.shadow.inherit = False
    return shp


def rect(slide, x, y, w, h, fill):
    shp = slide.shapes.add_shape(MSO_SHAPE.RECTANGLE, Emu(x), Emu(y), Emu(w), Emu(h))
    shp.fill.solid(); shp.fill.fore_color.rgb = fill; shp.line.fill.background(); shp.shadow.inherit = False
    return shp


def textbox(slide, x, y, w, h):
    tf = slide.shapes.add_textbox(Emu(x), Emu(y), Emu(w), Emu(h)).text_frame
    tf.word_wrap = True
    return tf


def base(slide):
    """Hero frame + big dark content panel (falls back to solid dark if the hero is missing)."""
    if os.path.exists(HERO):
        slide.shapes.add_picture(HERO, 0, 0, width=Emu(W), height=Emu(H))
    else:
        rect(slide, 0, 0, W, H, DARK)
    rrect(slide, 300000, 300000, W - 600000, H - 600000, PANEL, line=GOLD, line_w=1.25)


# =========================== SLIDE 1 — this week ===========================
s1 = prs.slides.add_slide(blank)
base(s1)

# header
eb = textbox(s1, 700000, 520000, 8600000, 500000)
para(eb, 'WEEKLY  PROGRESS  UPDATE   ·   WEEK OF 14–20 JULY 2026', 12.5, SANS, GOLD, bold=True, after=0)
ttl = textbox(s1, 690000, 780000, 8800000, 1050000)
para(ttl, 'Shaping Change', 33, SERIF, CREAM, italic=True, bold=True, after=2)
para(ttl, 'Building strong roots for safety', 15, SERIF, GOLD, italic=True, after=0)

# status chip (top-right)
chip = rrect(s1, 8760000, 660000, 2820000, 620000, GOLD)
ctf = chip.text_frame; ctf.word_wrap = True; ctf.vertical_anchor = MSO_ANCHOR.MIDDLE
runs_para(ctf, [('●  ', 12, SANS, RGBColor(0x2E, 0x7D, 0x32), True, False),
                ('ON TRACK', 14, SANS, INK, True, False)], align=PP_ALIGN.CENTER, after=0)

# divider
rect(s1, 700000, 1930000, W - 1400000, 12000, LINEC)

# left column — this week's progress
lh = textbox(s1, 700000, 2060000, 6300000, 460000)
para(lh, 'THIS WEEK', 14, SANS, GOLD, bold=True, after=0)
check = textbox(s1, 700000, 2440000, 6350000, 3250000)
DONE = [
    'Educational content approved — Edu team  (14 Jul)',
    'PVAW sign-off — pedagogy, prevention approach, statistics & citations  (16 Jul)',
    'Scope locked & project plan confirmed to mid-August',
    'Screen-by-screen design mockups produced — all 22 screens',
    'Screen flow & interactions mapped end-to-end',
]
for i, t in enumerate(DONE):
    runs_para(check, [('✓   ', 14.5, SANS, GOLD, True, False), (t, 13.5, SANS, CREAM, False, False)],
              after=11, spacing=1.02)
runs_para(check, [('▸   ', 14.5, SANS, GOLD, True, False),
                  ('Build environment set up; Phase 1 development underway',
                   13.5, SANS, MUTE, False, True)], after=0, spacing=1.02)

# right column — milestones callout
co = rrect(s1, 7350000, 2060000, 4240000, 2760000, CALLOUT, line=LINEC, line_w=1.0)
cotf = textbox(s1, 7620000, 2210000, 3780000, 2460000)
para(cotf, 'MILESTONES', 12, SANS, GOLD, bold=True, after=12)
runs_para(cotf, [('✓  ', 13.5, SANS, GOLD, True, False), ('14 Jul', 13, SANS, CREAM, True, False),
                 ('  —  Edu sign-off', 12.5, SANS, MUTE, False, False)], after=9)
runs_para(cotf, [('✓  ', 13.5, SANS, GOLD, True, False), ('16 Jul', 13, SANS, CREAM, True, False),
                 ('  —  PVAW sign-off', 12.5, SANS, MUTE, False, False)], after=9)
runs_para(cotf, [('▸  ', 13.5, SANS, GOLD, True, False), ('26–27 Jul', 13, SANS, GOLD, True, False),
                 ('  —  Phase 1 preview', 12.5, SANS, CREAM, True, False)], after=9)
runs_para(cotf, [('○  ', 13.5, SANS, MUTE, False, False), ('mid-Aug', 13, SANS, CREAM, True, False),
                 ('  —  first draft', 12.5, SANS, MUTE, False, False)], after=13)
para(cotf, 'Phase 1 preview → your feedback before the advisory group meeting.', 11, SANS, MUTE,
     italic=True, after=0, spacing=1.05)

# bottom roadmap strip
rmap = textbox(s1, 700000, 5980000, W - 1400000, 620000)
phases = [('Content', 'done'), ('Design', 'done'), ('Build', 'now'),
          ('Accessibility + security', 'next'), ('QA + first draft', 'next')]
segs = []
for i, (name, st) in enumerate(phases):
    if st == 'done':
        segs += [('✓ ', 12.5, SANS, GOLD, True, False), (name, 12, SANS, CREAM, True, False)]
    elif st == 'now':
        segs += [('▸ ', 12.5, SANS, GOLD, True, False), (name + ' (in progress)', 12, SANS, GOLD, True, False)]
    else:
        segs += [('○ ', 12.5, SANS, MUTE, False, False), (name, 12, SANS, MUTE, False, False)]
    if i < len(phases) - 1:
        segs.append(('     ·     ', 12, SANS, LINEC, False, False))
runs_para(rmap, segs, align=PP_ALIGN.CENTER, after=0)


# =========================== SLIDE 2 — locked & next ===========================
s2 = prs.slides.add_slide(blank)
base(s2)

eb2 = textbox(s2, 700000, 520000, 10600000, 460000)
para(eb2, 'SHAPING CHANGE   ·   PROGRESS UPDATE', 12.5, SANS, GOLD, bold=True, after=0)
ttl2 = textbox(s2, 690000, 760000, 10800000, 760000)
para(ttl2, 'What’s locked — and what’s next', 29, SERIF, CREAM, italic=True, bold=True, after=0)
rect(s2, 700000, 1640000, W - 1400000, 12000, LINEC)

# left — locked this week
lc = textbox(s2, 700000, 1820000, 5450000, 4650000)
para(lc, 'LOCKED THIS WEEK  (from the sign-offs)', 13, SANS, GOLD, bold=True, after=12)
LOCKED = [
    ('Activity title', '“Shaping Change: Building strong roots for safety”'),
    ('Character & scenario', 'Orion — migration pressure & loss of status (primary-prevention framing)'),
    ('Prevention approach', 'internal-cause model — no depicted physical violence; escalation shown through non-physical behaviour'),
    ('Statistics', 'finalised with citations (AIHW 2018 · PM&C 2023 · ABS 2021), placed at the end'),
    ('Structure', 'beliefs + attitudes combined; one scenario with a couple of pathways'),
]
for head, body in LOCKED:
    runs_para(lc, [('•  ', 13.5, SANS, GOLD, True, False), (head + ' — ', 13, SANS, CREAM, True, False),
                   (body, 12.5, SANS, MUTE, False, False)], after=10, spacing=1.03)

# right — next to mid-August
rc = textbox(s2, 6450000, 1820000, 5140000, 4650000)
para(rc, 'NEXT  —  TO MID-AUGUST', 13, SANS, GOLD, bold=True, after=12)
NEXT = [
    ('Preview Phase 1 with you', '26–27 Jul — to fold in your feedback before the advisory group meeting'),
    ('Complete Phase 2', 'the rebuild outcomes and reflection'),
    ('Accessibility pass', 'WCAG 2.1 AA — built for EAL learners'),
    ('Security & privacy review', 'with the Digital team / IT sign-off'),
    ('Internal QA & review', 'test the flow end-to-end'),
]
for head, body in NEXT:
    runs_para(rc, [('•  ', 13.5, SANS, GOLD, True, False), (head + ' — ', 13, SANS, CREAM, True, False),
                   (body, 12.5, SANS, MUTE, False, False)], after=10, spacing=1.03)
runs_para(rc, [('★  ', 14, SANS, GOLD, True, False),
               ('First playable draft — mid-August', 14.5, SANS, CREAM, True, False)],
          before=4, after=0, spacing=1.05)

# bottom note
note = textbox(s2, 700000, 6180000, W - 1400000, 470000)
para(note, 'On track, no blockers. Next step: preview Phase 1 with you on 26–27 July to fold in changes '
           'before the advisory group meeting.  (Still to confirm the character name with the Digital team.)',
     12, SANS, MUTE, italic=True, after=0, spacing=1.05)

# =========================== SLIDE 3 — the 22 screen designs ===========================
import struct
CONTACT = os.path.join(ROOT, 'docs', 'images', 'screen-designs-contact.png')
s3 = prs.slides.add_slide(blank)
base(s3)
with open(CONTACT, 'rb') as fh:
    fh.read(16); iw, ih = struct.unpack('>II', fh.read(8))   # PNG width/height from IHDR
bx, by, bw, bh = 560000, 560000, W - 1120000, H - 1120000    # fit inside the panel with a margin
scale = min(bw / iw, bh / ih)
dw, dh = int(iw * scale), int(ih * scale)
dx, dy = (W - dw) // 2, by + (bh - dh) // 2
s3.shapes.add_picture(CONTACT, Emu(dx), Emu(dy), width=Emu(dw), height=Emu(dh))

s1.notes_slide.notes_text_frame.text = (
    'Quick status. Both content approvals are now in — Edu signed off on the 14th, PVAW on the '
    '16th — so the content is locked. This week I turned the approved blueprint into screen-by-'
    'screen design mockups for all 22 screens, mapped the full flow, confirmed the plan to a '
    'mid-August first draft, and set up the build and started Phase 1 development. Next milestone '
    'is a Phase 1 preview for you on the 26th–27th, so we can fold in your feedback before the '
    'advisory group meeting. On track.')
s2.notes_slide.notes_text_frame.text = (
    'These are the decisions the two sign-offs locked in — the title, the character and scenario, '
    'the prevention approach (no depicted physical violence), the finalised statistics with '
    'citations, and the structure. Next I will preview Phase 1 with you on the 26th–27th, complete '
    'Phase 2, then do the accessibility and security/privacy work and internal QA — landing the '
    'first playable draft in mid-August. No blockers; still to confirm the character name with the '
    'Digital team.')
s3.notes_slide.notes_text_frame.text = (
    'These are the design mockups produced this week — one for every screen in the journey, using '
    'the exact copy and flow that Edu and PVAW signed off. You can see the story in the tree: it '
    'declines through Phase 1 as the pressure builds, then heals (and bears fruit) as he rebuilds. '
    'This is what I am now building into Phase 1 for the preview on the 26th–27th.')

out = os.path.join(ROOT, 'docs', 'Shaping-Change-Progress-Update.pptx')
prs.core_properties.title = 'Shaping Change — Weekly Progress Update'
prs.core_properties.author = 'Shaping Change'
prs.save(out)
print('saved', os.path.relpath(out, ROOT), '(%d slides)' % len(prs.slides._sldIdLst))
