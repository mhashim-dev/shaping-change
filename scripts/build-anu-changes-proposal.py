#!/usr/bin/env python3
"""Proposed changes against Anu's clarifications on Oleksandra's screen-design comments.
    python3 scripts/build-anu-changes-proposal.py  -> docs/Shaping-Change-Proposed-Changes-Anu.docx
"""
import os
from docx import Document
from docx.shared import Pt, RGBColor
from docx.oxml.ns import qn
from docx.oxml import OxmlElement

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
GOLD = RGBColor(0xB0, 0x86, 0x1a); DARK = RGBColor(0x2A, 0x1F, 0x10); GREY = RGBColor(0x55, 0x4d, 0x40)
GREEN = RGBColor(0x1e, 0x7a, 0x3c); RED = RGBColor(0xb0, 0x1a, 0x1a); BLUE = RGBColor(0x1c, 0x5a, 0x9c)

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


def para(text, after=6, italic=False, color=None, size=10.5, before=0, bold=False):
    p = doc.add_paragraph(); p.paragraph_format.space_after = Pt(after); p.paragraph_format.space_before = Pt(before)
    r = p.add_run(text); r.italic = italic; r.bold = bold; r.font.size = Pt(size)
    if color: r.font.color.rgb = color
    return p


def bullet(text, bold_lead=None, level=0):
    p = doc.add_paragraph(style='List Bullet' if level == 0 else 'List Bullet 2')
    p.paragraph_format.space_after = Pt(3)
    if bold_lead:
        r = p.add_run(bold_lead + ' '); r.bold = True
    p.add_run(text)
    return p


def tag(label, color):
    p = doc.add_paragraph(); p.paragraph_format.space_after = Pt(2); p.paragraph_format.space_before = Pt(6)
    r = p.add_run(label); r.bold = True; r.font.size = Pt(9); r.font.color.rgb = color
    return p


def quote(author, text):
    p = doc.add_paragraph(); p.paragraph_format.space_before = Pt(6); p.paragraph_format.space_after = Pt(6)
    p.paragraph_format.left_indent = Pt(10)
    la = p.add_run(author + ':  '); la.bold = True; la.italic = True; la.font.size = Pt(10); la.font.color.rgb = GREY
    lt = p.add_run('"' + text + '"'); lt.italic = True; lt.font.size = Pt(10); lt.font.color.rgb = GREY
    shade(p)
    return p


def screen_heading(num, title):
    p = doc.add_paragraph(); p.paragraph_format.space_before = Pt(18); p.paragraph_format.space_after = Pt(2)
    r = p.add_run(f'Screen {num} — {title}'); r.bold = True; r.font.size = Pt(14); r.font.color.rgb = GOLD
    return p


def rule():
    p = doc.add_paragraph(); p.paragraph_format.space_before = Pt(6); p.paragraph_format.space_after = Pt(6)
    p.add_run('_' * 60).font.color.rgb = RGBColor(0xCC, 0xC4, 0xB6)


def effort(label, color):
    p = doc.add_paragraph(); p.paragraph_format.space_before = Pt(4); p.paragraph_format.space_after = Pt(2)
    r = p.add_run('Scope: '); r.bold = True; r.font.size = Pt(9.5); r.font.color.rgb = GREY
    r2 = p.add_run(label); r2.bold = True; r2.font.size = Pt(9.5); r2.font.color.rgb = color
    return p


# ---------------- HEADER ----------------
title = doc.add_paragraph(); r = title.add_run('Shaping Change'); r.bold = True; r.font.size = Pt(24); r.font.color.rgb = DARK
sub = doc.add_paragraph(); r = sub.add_run('Proposed Changes Against Anu’s Feedback'); r.bold = True; r.italic = True; r.font.size = Pt(14); r.font.color.rgb = GOLD
sub.paragraph_format.space_after = Pt(6)
para('A screen-by-screen proposal for what the multi-select and related changes would actually involve, based on '
     'Anu’s replies (17 September 2026) to Oleksandra’s comments. This is a planning document, not a '
     'build — nothing here has been implemented yet.', italic=True, color=GREY)

# ---------------- IMPORTANT CONSIDERATION ----------------
rule()
H('An important constraint to weigh before we proceed', 15, RED, before=8)
p = doc.add_paragraph(); p.paragraph_format.space_after = Pt(6)
p.add_run('The game has a hard design rule that’s been carefully maintained throughout: ').font.size = Pt(10.5)
rb = p.add_run('no screen ever requires scrolling to read it'); rb.bold = True; rb.font.size = Pt(10.5)
p.add_run(' — verified down to a 320px-wide phone. This matters a lot for multi-select specifically, because '
          'several of these screens currently show one paragraph of "reasoning" text per option, and that text '
          'only appears for the ONE option a learner picks.').font.size = Pt(10.5)
para('If a learner can now select several options at once, and we show the reasoning/outcome text for '
     'every one they picked, that could be 3–5 paragraphs stacked in the same panel that used to hold one. '
     'On the two screens with the most options (belief, with 5 choices) and the busiest text (behaviour, '
     'with the new colour-coded outcomes Anu asked for), this could break the no-scroll rule on smaller phones.')
para('Options worth deciding on:', before=4, bold=True)
bullet('Show only the reasoning for the MOST RECENTLY selected option (simplest, least visual clutter, but a '
       'learner might lose earlier reasoning they wanted to compare).')
bullet('Show a short one-line outcome tag per selected option (not the full paragraph), with the full reasoning '
       'only for the last one selected — a middle ground.')
bullet('Let the reasoning area scroll internally while the rest of the panel (question, options, Continue) '
       'stays fixed — the one place we’d deliberately break the "never scroll" rule, and only in a small '
       'contained area.')
para('This affects every screen below, so it’s flagged once here rather than repeated five times. Happy to '
     'propose a specific approach once we’ve agreed a direction.', italic=True, color=GREY, before=4)

# ==================== SCREEN 06 ====================
rule()
screen_heading('06', 'Money worries → Behaviour under pressure (Slide 9)')
quote('Anu', 'Agree that participant should be able to choose all of the 3 options, but the outcomes are '
             'slightly different... The outcomes can be added at the end of the explanations in a different '
             'colour... ALL 3 are negative outcomes and not healthy choices.')
para('Proposed change:', bold=True, before=6)
bullet('The three options become multi-select — pills stay pressed once tapped, and accumulate.')
bullet('Each option keeps its existing reasoning text, with Anu’s new outcome line appended in a distinct '
       'colour (gold, matching the app’s accent colour):')
bullet('Take tight control → "Family feels stifled."', level=1)
bullet('Go quiet and pull away → "Impacts Orion’s own mental health."', level=1)
bullet('Anger and blame → "The family can be hurt by it."', level=1)
bullet('"Continue" is enabled once at least one option is selected.')
tag('NEEDS A DECISION', RED)
para('All three options currently reduce the tree’s health by a similar amount when picked alone '
     '(–18 to –20). If a learner selects two or three of them together, does the health penalty '
     'stack (each one applies), or should it cap at the single worst option’s penalty? Stacking is more '
     'realistic (more harmful choices = more harm) but could push the tree toward the "damaged" outcome very '
     'quickly if someone selects all three just to read the feedback, which may not reflect what they’d '
     'actually do. Recommend capping at the worst-selected option’s penalty, so exploring options out of '
     'curiosity isn’t punished harder than committing to the single worst one — but this is a pedagogy '
     'call, not a dev one.')
effort('Medium — new multi-select interaction, new copy (already supplied by Anu), one scoring decision.', GOLD)

# ==================== SCREEN 08 ====================
rule()
screen_heading('08', 'The belief underneath (Slide 11)')
quote('Anu', 'Agree that participant should be able to choose all of the options.')
para('Proposed change:', bold=True, before=6)
bullet('The five belief options become multi-select, same accumulating-pill behaviour as Screen 06.')
bullet('No colour-coded outcomes needed here — Anu didn’t flag differing outcomes for this screen, and '
       'all options already lead to the same next screen with fx.health: 0 (no scoring impact either way).')
bullet('Simplest of the multi-select changes — no scoring conflict, since none of these options affects health.')
effort('Small — same mechanic as Screen 06, no scoring question, no new copy needed.', GREEN)

# ==================== SCREEN 11 ====================
rule()
screen_heading('11', 'A healthier belief / soil (Slide 14)')
quote('Anu', 'Allow multiple options... Agree. Extend the soil drop zone... Agree. Update Orion’s facial '
             'expression... Excellent suggestion!')
para('Proposed change:', bold=True, before=6)
bullet('Multi-select drag-and-drop onto the soil: each card dropped stays "planted" and accumulates, rather '
       'than replacing the previous one.')
bullet('Soil drop zone — already fixed and live (this was actioned in the round before Anu’s reply); no '
       'further work needed.')
bullet('Orion’s expression: after the FIRST healthy option is dropped, his expression shifts to visibly '
       'less sad — a new engine feature (his mood currently only follows the overall health score, not a '
       'live in-screen reaction to a single choice).')
tag('NEEDS A DECISION', RED)
para('Three of the four options here are healthy (+18 health each) and one is neutral ("I can stay in charge", '
     '–2 health). If a learner selects a mix — say two healthy beliefs AND the neutral one — how should '
     'that combine? Recommend: any healthy selection counts as healthy overall (the neutral option only applies '
     'if it’s the ONLY thing selected), so exploring doesn’t accidentally cancel out a good choice. '
     'Same underlying question as Screen 06, just in the opposite direction (mixing helps here, hurts there).')
effort('Medium-Large — multi-select drag-and-drop (a new pattern, since the existing drag mechanic assumes a '
       'single selection), plus a new progressive-expression feature.', GOLD)

# ==================== SCREEN 12 ====================
rule()
screen_heading('12', 'Orion’s action / trunk (Slide 15)')
quote('Anu', 'Can we add an immediate action if the correct answer is dropped? Like watering the soil in the '
             'previous step: Agree. If multiple options could remain pressed and accumulate here, that would '
             'be more logical: Agree.')
para('Proposed change:', bold=True, before=6)
bullet('Multi-select drag-and-drop onto the trunk, same accumulating pattern as Screen 11.')
bullet('A new immediate visual cue the moment a HEALTHY option is dropped — consistent with the soil-watering '
       'effect, applied to the trunk (e.g. a brief glow/strengthen pulse on the trunk).')
para('Same scoring question as Screen 11 applies here too (two healthy options + one neutral "keep control but '
     'kinder").', italic=True, color=GREY)
effort('Medium — same multi-select drag-and-drop pattern as Screen 11, plus one new visual cue (smaller than '
       'the expression feature).', GOLD)

# ==================== SCREEN 13 ====================
rule()
screen_heading('13', 'The family feels the change / branches (Slide 16)')
quote('Anu', 'If possible we could do an incremental improved family emotional wellbeing as the 3rd drag, making '
             'branches flourish?')
para('Proposed change:', bold=True, before=6)
bullet('This is a genuinely new mechanic, not a tweak — this screen currently just narrates the outcome (no '
       'choices at all). Turning it into a third drag-and-drop means: new draggable option content (what '
       'specific "family wellbeing" actions would a learner choose from?), wiring the engine to accept the '
       '"branches" area as a drop target, and a new visual — the branches visibly flourishing (extra leaves, '
       'colour, maybe early fruit) as it’s dropped.')
tag('NEEDS CONTENT INPUT, NOT JUST A DEV DECISION', BLUE)
para('Anu’s idea is a strong direction, but we’d need 2–3 concrete option choices and their wording '
     'before this can be built — e.g. "spend time together," "really listen when they talk," "keep the promise '
     'he made." Suggest this goes to the content/Edu side as its own small task, separate from the other four '
     'screens (which are ready to build once the scoring questions above are settled).')
effort('Large — a new mechanic end-to-end (content, drop-target wiring, new visual), and blocked on content '
       'before any build work can start.', RED)

# ==================== SCREEN 22 ====================
rule()
screen_heading('22', 'One step you will take (Slide 25)')
quote('Anu', 'Agree.')
para('Proposed change:', bold=True, before=6)
bullet('Suggestion chips currently REPLACE the pledge text box when tapped. Change so tapping a chip ADDS it to '
       'the text (joined naturally, e.g. "...and join a men’s group"), and tapping an already-added chip '
       'removes it again.')
bullet('Free-text editing stays exactly as it is — this only changes how the suggestion chips behave.')
bullet('No scoring question here — the pledge doesn’t affect the tree’s health, so there’s '
       'nothing to reconcile.')
effort('Small — a self-contained UI change, no scoring question, no new copy.', GREEN)

# ---------------- NOT IN SCOPE ----------------
rule()
H('Not included in this proposal', 13, GOLD, before=10)
bullet('Text density — still pending a joint decision from Ali and Anu. Once that lands, it may touch some of '
       'the same screens above, so it makes sense to fold both changes into one pass rather than editing the '
       'same screens twice.', bold_lead='')

foot = doc.add_paragraph(); foot.paragraph_format.space_before = Pt(14)
rf = foot.add_run('Once the two flagged decisions above are settled (the scoring question, and the no-scroll '
                   'approach for multi-select reasoning text), the small/medium items (08, 22, then 06, 11, 12) '
                   'can be built in one pass. Screen 13 is better run as a separate, content-led follow-up.')
rf.italic = True; rf.font.size = Pt(9.5); rf.font.color.rgb = GREY

out = os.path.join(ROOT, 'docs', 'Shaping-Change-Proposed-Changes-Anu.docx')
doc.save(out)
print('saved', os.path.relpath(out, ROOT))
