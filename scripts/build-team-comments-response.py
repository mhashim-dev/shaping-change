#!/usr/bin/env python3
"""Response document to Oleksandra & Dennis's PPT comments on the screen-designs deck.
    python3 scripts/build-team-comments-response.py  -> docs/Shaping-Change-Team-Comments-Response.docx
"""
import os
from docx import Document
from docx.shared import Pt, RGBColor
from docx.oxml.ns import qn
from docx.oxml import OxmlElement

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
GOLD = RGBColor(0xB0, 0x86, 0x1a); DARK = RGBColor(0x2A, 0x1F, 0x10); GREY = RGBColor(0x55, 0x4d, 0x40)
GREEN = RGBColor(0x1e, 0x7a, 0x3c); BLUE = RGBColor(0x1c, 0x5a, 0x9c); AMBER = RGBColor(0x8a, 0x5a, 0x00)

doc = Document()
st = doc.styles['Normal']; st.font.name = 'Calibri'; st.font.size = Pt(10.5)


def shade(paragraph, fill='F3F1EB'):
    pPr = paragraph._p.get_or_add_pPr()
    shd = OxmlElement('w:shd'); shd.set(qn('w:val'), 'clear'); shd.set(qn('w:color'), 'auto'); shd.set(qn('w:fill'), fill)
    pPr.append(shd)


def H(text, size, color=DARK, before=14, after=4, bold=True):
    p = doc.add_paragraph(); p.paragraph_format.space_before = Pt(before); p.paragraph_format.space_after = Pt(after)
    r = p.add_run(text); r.bold = bold; r.font.size = Pt(size); r.font.color.rgb = color
    return p


def para(text, after=6, italic=False, color=None, size=10.5, before=0):
    p = doc.add_paragraph(); p.paragraph_format.space_after = Pt(after); p.paragraph_format.space_before = Pt(before)
    r = p.add_run(text); r.italic = italic; r.font.size = Pt(size)
    if color: r.font.color.rgb = color
    return p


def bullet(text, bold_lead=None):
    p = doc.add_paragraph(style='List Bullet'); p.paragraph_format.space_after = Pt(3)
    if bold_lead:
        r = p.add_run(bold_lead + ' '); r.bold = True
    p.add_run(text)
    return p


def status_tag(label, color):
    p = doc.add_paragraph(); p.paragraph_format.space_after = Pt(2); p.paragraph_format.space_before = Pt(2)
    r = p.add_run(label); r.bold = True; r.font.size = Pt(9); r.font.color.rgb = color
    return p


def quoted_comment(author, text):
    p = doc.add_paragraph(); p.paragraph_format.space_before = Pt(6); p.paragraph_format.space_after = Pt(4)
    p.paragraph_format.left_indent = Pt(10)
    la = p.add_run(author + ':  '); la.bold = True; la.italic = True; la.font.size = Pt(10); la.font.color.rgb = GREY
    lt = p.add_run('"' + text + '"'); lt.italic = True; lt.font.size = Pt(10); lt.font.color.rgb = GREY
    shade(p)
    return p


def reply(text):
    p = doc.add_paragraph(); p.paragraph_format.space_before = Pt(4); p.paragraph_format.space_after = Pt(4)
    p.paragraph_format.left_indent = Pt(10)
    lr = p.add_run('Reply:  '); lr.bold = True; lr.font.size = Pt(10.5); lr.font.color.rgb = DARK
    p.add_run(text)
    return p


def screen_heading(num, title):
    p = doc.add_paragraph(); p.paragraph_format.space_before = Pt(16); p.paragraph_format.space_after = Pt(2)
    r = p.add_run(f'Screen {num} — {title}'); r.bold = True; r.font.size = Pt(13); r.font.color.rgb = GOLD
    return p


def rule():
    p = doc.add_paragraph(); p.paragraph_format.space_before = Pt(6); p.paragraph_format.space_after = Pt(6)
    p.add_run('_' * 60).font.color.rgb = RGBColor(0xCC, 0xC4, 0xB6)


# ---------------- HEADER ----------------
title = doc.add_paragraph(); r = title.add_run('Shaping Change'); r.bold = True; r.font.size = Pt(24); r.font.color.rgb = DARK
sub = doc.add_paragraph(); r = sub.add_run('Response to Team Comments — Oleksandra & Dennis'); r.bold = True; r.italic = True; r.font.size = Pt(14); r.font.color.rgb = GOLD
sub.paragraph_format.space_after = Pt(6)
para('Comments left on "Shaping-Change-Screen-Designs — Latest team comments.pptx" (11 September 2026), '
     'with a response against each one below.', italic=True, color=GREY)

# ---------------- SUMMARY ----------------
H('Summary', 15, GOLD, before=16)
para('Thank you both — really thorough feedback, and it’s clear you’ve gone through the flow carefully. '
     'Here’s where things landed:')

status_tag('DONE', GREEN)
bullet('The soil drop zone was already meant to cover the whole soil area, but a drop near the trunk was being '
       'intercepted by the roots hit-zone (not a valid target on that screen) and silently rejected — exactly '
       'where a player would naturally aim. Fixed.', bold_lead='Soil drop zone (Screen 11) —')
bullet('The watering effect was triggering for any dropped option, including the neutral "I can stay in charge" '
       'choice. Now limited to the three genuinely healthy beliefs, so the visual reward matches an actually '
       'healthy choice.', bold_lead='Soil-watering consistency (Screen 11) —')

status_tag('HOLDING FOR A TEAM DISCUSSION', AMBER)
para('Several of Oleksandra’s comments point at the same underlying idea — letting learners select '
     'multiple options on a screen instead of one at a time, since the options often lead to the same next screen '
     'anyway. This isn’t being changed screen-by-screen: it’s a real shift in the interaction model Edu/PVAW '
     'signed off on (one meaningful choice, with feedback specific to that choice) — across five different '
     'screens (06, 08, 11, 12, 22). It will go to Edu/PVAW as one combined conversation rather than piecemeal changes.')

status_tag('NOT YET DECIDED', BLUE)
bullet('Nice idea; wants proper thought before building rather than a quick bolt-on (see Screen 11 below).', bold_lead='Orion’s expression gradually brightening as the rebuild goes well —')
bullet('Oleksandra raised this as a question to the content team rather than a firm ask, so it’s being treated as one (see Screen 13 below).', bold_lead='A third drag-and-drop for the branches —')

rule()
H('Responses to each comment', 15, GOLD, before=4)
para('In the order they appear in the deck.', italic=True, color=GREY, after=8)

# ---------------- SCREEN 06 ----------------
screen_heading('06', 'The behaviour under pressure')
quoted_comment('Oleksandra',
  'The sequence from Step 3 onward is not fully logical or clear. Learners are presented with three separate '
  'options that operate independently. After choosing one option, they proceed to see the outcome... If all '
  'three options ultimately lead to the same result, I recommend enabling multiple choice in Step 3.')
reply('Good catch — you’re right that all three lead to the same next screen. This is part of a bigger '
      'question though: letting learners multi-select here would change the single-choice-with-feedback model, '
      'and it’s not just this screen — the same logic applies to belief, both rebuild drag screens, and the '
      'pledge. I’d rather bring this to Edu/PVAW as one combined design conversation than change it '
      'screen-by-screen, so the tone and pacing stay consistent across the game. Will follow up once we’ve '
      'discussed it.')

# ---------------- SCREEN 08 ----------------
screen_heading('08', 'The belief underneath')
quoted_comment('Oleksandra',
  'I would suggest enabling multiple choice here as well, in case more than one option resonates with the '
  'learner. Since the outcome (the next page) is identical for all options, the current back-and-forth '
  'navigation feels unnecessary.')
reply('Same note as the behaviour screen — this is part of the same multi-select conversation, since it’s '
      'really one interaction-model decision that would apply consistently across several screens rather than a '
      'per-screen tweak.')

# ---------------- SCREEN 11 ----------------
screen_heading('11', 'A healthier belief (soil)')
quoted_comment('Oleksandra',
  '1. Allow multiple options... 2. Extend the soil drop zone. Currently, the soil drop zone excludes the area '
  'where the roots overlap... 3. Update Orion’s facial expression. It would be great if Orion’s expression '
  'changed after at least one correct option is selected and the soil is watered... So just after the first '
  'correct option would be great — ‘I can stay in charge’ also waters the soil. If it is an incorrect '
  'option, then a positive outcome should not happen.')
reply('On multi-select: as above, part of the wider conversation.')
reply('On the drop zone: done — fixed. It was being blocked by the roots hit-zone right where you’d '
      'naturally aim near the trunk; a drop there now correctly registers as soil.')
reply('On Orion’s expression and watering: I like the idea of his expression gradually brightening as the '
      'rebuild progresses — want to think that through properly rather than bolt it on quickly. On “I can '
      'stay in charge” also watering the soil specifically — I’d lean towards not doing that one, since '
      'it’s a neutral (not fully healthy) choice, and giving it the same positive visual as the three healthy '
      'options risks blurring which choices are actually the better ones for Orion. Happy to hear more if you '
      'feel strongly about it.')

# ---------------- SCREEN 12 ----------------
screen_heading('12', 'Orion’s action (trunk)')
quoted_comment('Oleksandra',
  'To be consistent — can we add an immediate action if the correct answer is dropped? Like watering the soil '
  'in the previous step. Again, if multiple options could remain pressed and accumulate here, that would be '
  'more logical.')
reply('Noted — this ties into the multi-select conversation too, since how the immediate feedback works '
      'depends on whether one or several options can be picked. This will be covered together with belief/soil '
      'once that’s settled.')

# ---------------- SCREEN 13 ----------------
screen_heading('13', 'The family feels the change')
quoted_comment('Oleksandra',
  'For me it feels like a third drag and drop is missing. We explained roots are the same, then we dragged the '
  'soil, then dragged the trunk, so I expected dragging something to the branches (a question to the content '
  'development team, whether it is possible to think of any third drag and drop set of options).')
reply('Fair question. Right now branches represent the impact — something the player observes as a '
      'consequence, rather than an active choice like the belief (soil) or action (trunk). That’s why there '
      'isn’t a third drag-and-drop there currently. But it would make the model feel more complete and '
      'tactile, so this will go to the content team as something worth exploring — no promises yet on whether '
      'there’s a pedagogically meaningful “branches” choice to add, but it’s a good thought and '
      'worth a proper look.')

# ---------------- SCREEN 22 ----------------
screen_heading('22', 'One step you will take')
quoted_comment('Oleksandra',
  'Consider multiple options here too. What if I want for example both listen to my partner and join the men’s '
  'group?')
reply('Also part of the multi-select conversation — the appeal is clear here especially, e.g. combining '
      '“listen to my partner” and “join a men’s group.” Once a decision is made for the game as a '
      'whole, the pledge screen will be folded into that.')

# ---------------- SCREEN 33 (Dennis) ----------------
screen_heading('33', 'The keepsake / printable summary')
quoted_comment('Dennis',
  'Having the ability to save a summary and print results is really good. I’m not sure how, but maybe in that '
  'pdf if we can have the other resources included would be good but this is fine.')
reply('Thanks Dennis, really glad that’s landing well! Adding the support resources into the printed summary '
      'is a nice, low-effort addition — it will be added in a coming update.')

out = os.path.join(ROOT, 'docs', 'Shaping-Change-Team-Comments-Response.docx')
doc.save(out)
print('saved', os.path.relpath(out, ROOT))
