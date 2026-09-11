#!/usr/bin/env python3
"""Build a 'Screen Designs & Descriptions' PowerPoint — a cover slide plus one slide per
screen: the design mockup on the left, its title / phase / on-screen / purpose on the right.
Shares scripts/screens_data.py with the Word version so the two never drift apart.

    pip install python-pptx
    python3 scripts/build-screens-deck.py   # -> docs/Shaping-Change-Screen-Designs.pptx
"""
import os
import sys
from pptx import Presentation
from pptx.util import Emu, Pt
from pptx.dml.color import RGBColor
from pptx.enum.shapes import MSO_SHAPE
from pptx.enum.text import PP_ALIGN, MSO_ANCHOR

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from screens_data import SCREENS, ENHANCEMENTS, CHANGES   # noqa: E402  (canonical per-screen + enhancements + changelog)

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
IMG = os.path.join(ROOT, 'docs', 'figma-screens')
HERO = os.path.join(ROOT, 'docs', 'images', 'scene-flourishing.png')

GOLD = RGBColor(0xF0, 0xC6, 0x6A); INK = RGBColor(0x2A, 0x1F, 0x10)
DARK = RGBColor(0x1B, 0x14, 0x0C); PANEL = RGBColor(0x17, 0x11, 0x0A)
CREAM = RGBColor(0xF5, 0xEF, 0xE2); MUTE = RGBColor(0xCF, 0xC7, 0xB8)
LINEC = RGBColor(0x4A, 0x3E, 0x2A)
SERIF, SANS = 'Georgia', 'Helvetica'

W, H = 12192000, 6858000
IMG_W = 6600000
IMG_H = IMG_W * 900 // 1600
prs = Presentation(); prs.slide_width = Emu(W); prs.slide_height = Emu(H)
blank = prs.slide_layouts[6]


def runs_para(tf, runs, *, align=PP_ALIGN.LEFT, before=0, after=6, spacing=None, reuse=None):
    p = reuse if reuse is not None else (
        tf.paragraphs[0] if (len(tf.paragraphs) == 1 and not tf.paragraphs[0].runs) else tf.add_paragraph())
    p.alignment = align
    if before: p.space_before = Pt(before)
    p.space_after = Pt(after)
    if spacing: p.line_spacing = spacing
    for (text, size, font, color, bold, italic) in runs:
        r = p.add_run(); r.text = text
        r.font.size = Pt(size); r.font.name = font; r.font.bold = bold; r.font.italic = italic
        r.font.color.rgb = color
    return p


def para(tf, text, size, font, color, **kw):
    return runs_para(tf, [(text, size, font, color, kw.pop('bold', False), kw.pop('italic', False))], **kw)


def rect(slide, x, y, w, h, fill):
    s = slide.shapes.add_shape(MSO_SHAPE.RECTANGLE, Emu(x), Emu(y), Emu(w), Emu(h))
    s.fill.solid(); s.fill.fore_color.rgb = fill; s.line.fill.background(); s.shadow.inherit = False
    return s


def textbox(slide, x, y, w, h):
    tf = slide.shapes.add_textbox(Emu(x), Emu(y), Emu(w), Emu(h)).text_frame
    tf.word_wrap = True
    return tf


# ---- cover slide ----
c = prs.slides.add_slide(blank)
if os.path.exists(HERO):
    c.shapes.add_picture(HERO, 0, 0, width=Emu(W), height=Emu(H))
panel = c.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, Emu(2100000), Emu(1250000), Emu(8000000), Emu(4150000))
panel.fill.solid(); panel.fill.fore_color.rgb = PANEL; panel.line.color.rgb = GOLD; panel.line.width = Pt(1.25)
panel.shadow.inherit = False
cb = textbox(c, 2440000, 1600000, 7320000, 3500000)
para(cb, 'SCREEN  DESIGNS  &  DESCRIPTIONS', 13, SANS, GOLD, bold=True, after=14, align=PP_ALIGN.CENTER)
para(cb, 'Shaping Change', 40, SERIF, CREAM, italic=True, bold=True, after=6, align=PP_ALIGN.CENTER)
para(cb, 'Building strong roots for safety', 20, SERIF, GOLD, italic=True, after=16, align=PP_ALIGN.CENTER)
para(cb, '23 screens · Edu & PVAW–approved content. One slide per screen — the design, what appears '
        'on screen, and its purpose. The story runs in two phases: the tree declines as the pressure '
        'builds, then heals as Orion rebuilds. The next slides summarise what changed in this update.',
     14, SANS, MUTE, after=0, align=PP_ALIGN.CENTER, spacing=1.2)
c.notes_slide.notes_text_frame.text = (
    'A screen-by-screen design reference. One slide per screen, with the design mockup and a short '
    'description of what it shows and why it is there.')

# ---- "what changed in this update" summary (PAG feedback round) ----
CH_PAGES = [CHANGES[:2], CHANGES[2:]]   # p1: structural + wording · p2: framing/sound/removed/to-come
for pi, page in enumerate(CH_PAGES):
    s = prs.slides.add_slide(blank)
    rect(s, 0, 0, W, H, DARK)
    eb = textbox(s, 520000, 340000, 8600000, 460000)
    para(eb, 'SHAPING CHANGE    ·    WHAT CHANGED IN THIS UPDATE', 12, SANS, GOLD, bold=True, after=0)
    cnt = textbox(s, 9200000, 340000, 2472000, 460000)
    para(cnt, 'PAG feedback · %d / %d' % (pi + 1, len(CH_PAGES)), 12, SANS, MUTE, bold=True, after=0, align=PP_ALIGN.RIGHT)
    rect(s, 520000, 780000, W - 1040000, 10000, LINEC)
    tx = textbox(s, 520000, 1000000, 11150000, 5650000)
    first = True
    for heading, items in page:
        para(tx, heading, 14, SERIF, GOLD, bold=True, italic=True, before=(0 if first else 11), after=5)
        first = False
        for text, source in items:
            runs_para(tx, [('•  ', 11, SANS, GOLD, True, False),
                           (text + '  ', 11, SANS, CREAM, False, False),
                           ('(' + source + ')', 10, SANS, MUTE, False, True)], after=3, spacing=1.04)
    s.notes_slide.notes_text_frame.text = 'What changed in this update, from the PAG feedback round (August 2026).'

# ---- one slide per screen ----
for f, title, phase, on_screen, purpose in SCREENS:
    s = prs.slides.add_slide(blank)
    rect(s, 0, 0, W, H, DARK)
    # header
    eb = textbox(s, 520000, 340000, 8200000, 460000)
    para(eb, 'SHAPING CHANGE    ·    SCREEN DESIGNS', 12, SANS, GOLD, bold=True, after=0)
    cnt = textbox(s, 9200000, 340000, 2472000, 460000)
    para(cnt, f[:2] + '  /  23', 12, SANS, MUTE, bold=True, after=0, align=PP_ALIGN.RIGHT)
    rect(s, 520000, 780000, W - 1040000, 10000, LINEC)
    # image (left) with a thin frame
    iy = 1000000 + (5500000 - IMG_H) // 2
    pic = s.shapes.add_picture(os.path.join(IMG, f + '.png'), Emu(520000), Emu(iy), width=Emu(IMG_W), height=Emu(IMG_H))
    pic.line.color.rgb = LINEC; pic.line.width = Pt(1)
    cap = textbox(s, 520000, iy + IMG_H + 70000, IMG_W, 360000)
    para(cap, f + '.png', 9, SANS, MUTE, italic=True, after=0, align=PP_ALIGN.CENTER)
    # description (right)
    tx = textbox(s, 7420000, 1240000, 4292000, 5100000)
    para(tx, title, 23, SERIF, CREAM, italic=True, bold=True, after=3)
    para(tx, phase, 12, SANS, GOLD, italic=True, after=12)
    rect(s, 7420000, 2170000, 4100000, 9000, LINEC)
    para(tx, 'ON SCREEN', 11.5, SANS, GOLD, bold=True, before=12, after=5)
    para(tx, on_screen, 12, SANS, CREAM, after=13, spacing=1.06)
    para(tx, 'PURPOSE', 11.5, SANS, GOLD, bold=True, after=5)
    para(tx, purpose, 12, SANS, MUTE, after=0, spacing=1.06)
    s.notes_slide.notes_text_frame.text = 'On screen: ' + on_screen + '\n\nPurpose: ' + purpose

# ---- enhancements section ----
ENH_IMG = os.path.join(ROOT, 'docs', 'images', 'enhancements')
GREEN = RGBColor(0x8F, 0xD1, 0x9A)
BLUE = RGBColor(0x8F, 0xC0, 0xFF)

# divider slide
d = prs.slides.add_slide(blank)
rect(d, 0, 0, W, H, PANEL)
db = textbox(d, 1400000, 2500000, 9392000, 1900000)
para(db, 'ENHANCEMENTS SINCE CONTENT SIGN-OFF', 14, SANS, GOLD, bold=True, after=12, align=PP_ALIGN.CENTER)
para(db, 'For your review — July 2026', 30, SERIF, CREAM, italic=True, bold=True, after=14, align=PP_ALIGN.CENTER)
para(db, 'The approved content and the two-phase story are unchanged. These additions improve accessibility, '
        'reach and delivery. Items marked “For your sign-off” are where we would value Edu or PVAW’s confirmation.',
     15, SANS, MUTE, after=0, align=PP_ALIGN.CENTER, spacing=1.2)

for title, audience, images, paras, flag in ENHANCEMENTS:
    s = prs.slides.add_slide(blank)
    rect(s, 0, 0, W, H, DARK)
    eb = textbox(s, 520000, 340000, 8200000, 460000)
    para(eb, 'SHAPING CHANGE    ·    ENHANCEMENTS FOR REVIEW', 12, SANS, GOLD, bold=True, after=0)
    rect(s, 520000, 780000, W - 1040000, 10000, LINEC)
    has_img = bool(images) and os.path.exists(os.path.join(ENH_IMG, images[0]))
    tx_x, tx_w = (7420000, 4292000) if has_img else (520000, 11150000)
    if has_img:
        iw = 6600000; ih = iw * 683 // 1360
        iy = 1000000 + (5500000 - ih) // 2
        pic = s.shapes.add_picture(os.path.join(ENH_IMG, images[0]), Emu(520000), Emu(iy), width=Emu(iw), height=Emu(ih))
        pic.line.color.rgb = LINEC; pic.line.width = Pt(1)
    tx = textbox(s, tx_x, 1120000, tx_w, 5300000)
    para(tx, title, 22, SERIF, CREAM, italic=True, bold=True, after=4)
    para(tx, audience.upper(), 11, SANS, BLUE, bold=True, after=12)
    rect(s, tx_x, 2120000, min(tx_w, 4100000), 9000, LINEC)
    for para_txt in paras:
        para(tx, para_txt, 12.5, SANS, CREAM, after=10, spacing=1.08)
    if flag:
        para(tx, '✔ ' + flag, 12.5, SANS, GREEN, bold=True, after=0, spacing=1.08)
    s.notes_slide.notes_text_frame.text = title + ' — ' + audience + '\n\n' + '\n\n'.join(paras) + (('\n\n' + flag) if flag else '')

out = os.path.join(ROOT, 'docs', 'Shaping-Change-Screen-Designs.pptx')
prs.core_properties.title = 'Shaping Change — Screen Designs & Descriptions'
prs.core_properties.author = 'Shaping Change'
prs.save(out)
print('saved', os.path.relpath(out, ROOT), '(%d slides)' % len(prs.slides._sldIdLst))
