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


def current_vs_suggested(current, suggested):
    p1 = doc.add_paragraph(); p1.paragraph_format.space_before = Pt(6); p1.paragraph_format.space_after = Pt(3)
    p1.paragraph_format.left_indent = Pt(10)
    l1 = p1.add_run('Current:  '); l1.bold = True; l1.font.size = Pt(9.5); l1.font.color.rgb = GREY
    t1 = p1.add_run(current); t1.italic = True; t1.font.size = Pt(9.5); t1.font.color.rgb = GREY
    shade(p1, 'F3F1EB')
    p2 = doc.add_paragraph(); p2.paragraph_format.space_before = Pt(2); p2.paragraph_format.space_after = Pt(6)
    p2.paragraph_format.left_indent = Pt(10)
    l2 = p2.add_run('Ali’s suggestion:  '); l2.bold = True; l2.font.size = Pt(9.5); l2.font.color.rgb = GREEN
    t2 = p2.add_run(suggested); t2.font.size = Pt(9.5); t2.font.color.rgb = DARK
    shade(p2, 'EFF6EF')


def screen_heading(num, title):
    p = doc.add_paragraph(); p.paragraph_format.space_before = Pt(18); p.paragraph_format.space_after = Pt(2)
    r = p.add_run(f'Screen {num}: {title}'); r.bold = True; r.font.size = Pt(14); r.font.color.rgb = GOLD
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
sub = doc.add_paragraph(); r = sub.add_run('Proposed Changes: Anu’s Feedback & Ali’s Text Suggestions'); r.bold = True; r.italic = True; r.font.size = Pt(14); r.font.color.rgb = GOLD
sub.paragraph_format.space_after = Pt(6)
para('Part 1 is a screen-by-screen proposal for what the multi-select and related changes would actually '
     'involve, based on Anu’s replies (17 September 2026) to Oleksandra’s comments. Part 2 covers '
     'Ali’s suggestions for cutting down on-screen text, from "Suggestions to the game.docx" (17 September '
     '2026). This is a planning document, not a build; nothing here has been implemented yet.',
     italic=True, color=GREY)

rule()
H('Part 1: Anu’s feedback on Oleksandra’s comments', 16, DARK, before=6, after=10)

# ---------------- IMPORTANT CONSIDERATION ----------------
rule()
H('An important constraint to weigh before we proceed', 15, RED, before=8)
p = doc.add_paragraph(); p.paragraph_format.space_after = Pt(6)
p.add_run('The game has a hard design rule that’s been carefully maintained throughout: ').font.size = Pt(10.5)
rb = p.add_run('no screen ever requires scrolling to read it'); rb.bold = True; rb.font.size = Pt(10.5)
p.add_run('. This has been verified down to a 320px-wide phone, and it matters a lot for multi-select '
          'specifically, because several of these screens currently show one paragraph of "reasoning" text per '
          'option, and that text only appears for the ONE option a learner picks.').font.size = Pt(10.5)
para('If a learner can now select several options at once, and we show the reasoning/outcome text for '
     'every one they picked, that could be 3 to 5 paragraphs stacked in the same panel that used to hold one. '
     'On the two screens with the most options (belief, with 5 choices) and the busiest text (behaviour, '
     'with the new colour-coded outcomes Anu asked for), this could break the no-scroll rule on smaller phones.')
para('Options worth deciding on:', before=4, bold=True)
bullet('Show only the reasoning for the MOST RECENTLY selected option (simplest, least visual clutter, but a '
       'learner might lose earlier reasoning they wanted to compare).')
bullet('Show a short one-line outcome tag per selected option (not the full paragraph), with the full reasoning '
       'only for the last one selected, as a middle ground.')
bullet('Let the reasoning area scroll internally while the rest of the panel (question, options, Continue) '
       'stays fixed. This would be the one place we’d deliberately break the "never scroll" rule, and '
       'only in a small contained area.')
para('This affects every screen below, so it’s flagged once here rather than repeated five times. Happy to '
     'propose a specific approach once we’ve agreed a direction.', italic=True, color=GREY, before=4)

# ==================== SCREEN 06 ====================
rule()
screen_heading('06', 'Money worries → Behaviour under pressure (Slide 9)')
quote('Anu', 'Agree that participant should be able to choose all of the 3 options, but the outcomes are '
             'slightly different... The outcomes can be added at the end of the explanations in a different '
             'colour... ALL 3 are negative outcomes and not healthy choices.')
para('Proposed change:', bold=True, before=6)
bullet('The three options become multi-select: pills stay pressed once tapped, and accumulate.')
bullet('Each option keeps its existing reasoning text, with Anu’s new outcome line appended in a distinct '
       'colour (gold, matching the app’s accent colour):')
bullet('Take tight control: "Family feels stifled."', level=1)
bullet('Go quiet and pull away: "Impacts Orion’s own mental health."', level=1)
bullet('Anger and blame: "The family can be hurt by it."', level=1)
bullet('"Continue" is enabled once at least one option is selected.')
tag('NEEDS A DECISION', RED)
para('All three options currently reduce the tree’s health by a similar amount when picked alone '
     '(around 18 to 20 points). If a learner selects two or three of them together, does the health penalty '
     'stack (each one applies), or should it cap at the single worst option’s penalty? Stacking is more '
     'realistic (more harmful choices means more harm) but could push the tree toward the "damaged" outcome '
     'very quickly if someone selects all three just to read the feedback, which may not reflect what they’d '
     'actually do. Recommend capping at the worst-selected option’s penalty, so exploring options out of '
     'curiosity isn’t punished harder than committing to the single worst one. That said, this is a pedagogy '
     'call, not a dev one.')
effort('Medium: new multi-select interaction, new copy (already supplied by Anu), one scoring decision.', GOLD)

# ==================== SCREEN 08 ====================
rule()
screen_heading('08', 'The belief underneath (Slide 11)')
quote('Anu', 'Agree that participant should be able to choose all of the options.')
para('Proposed change:', bold=True, before=6)
bullet('The five belief options become multi-select, same accumulating-pill behaviour as Screen 06.')
bullet('No colour-coded outcomes needed here: Anu didn’t flag differing outcomes for this screen, and '
       'all options already lead to the same next screen with fx.health: 0 (no scoring impact either way).')
bullet('Simplest of the multi-select changes: no scoring conflict, since none of these options affects health.')
effort('Small: same mechanic as Screen 06, no scoring question, no new copy needed.', GREEN)

# ==================== SCREEN 11 ====================
rule()
screen_heading('11', 'A healthier belief / soil (Slide 14)')
quote('Anu', 'Allow multiple options... Agree. Extend the soil drop zone... Agree. Update Orion’s facial '
             'expression... Excellent suggestion!')
para('Proposed change:', bold=True, before=6)
bullet('Multi-select drag-and-drop onto the soil: each card dropped stays "planted" and accumulates, rather '
       'than replacing the previous one.')
bullet('Soil drop zone: already fixed and live (this was actioned in the round before Anu’s reply); no '
       'further work needed.')
bullet('Orion’s expression: after the FIRST healthy option is dropped, his expression shifts to visibly '
       'less sad. This is a new engine feature (his mood currently only follows the overall health score, not '
       'a live in-screen reaction to a single choice).')
tag('NEEDS A DECISION', RED)
para('Three of the four options here are healthy (plus 18 health each) and one is neutral ("I can stay in '
     'charge", minus 2 health). If a learner selects a mix, say two healthy beliefs and the neutral one, how '
     'should that combine? Recommend: any healthy selection counts as healthy overall (the neutral option only '
     'applies if it’s the ONLY thing selected), so exploring doesn’t accidentally cancel out a good choice. '
     'It’s the same underlying question as Screen 06, just in the opposite direction (mixing helps here, '
     'hurts there).')
effort('Medium to Large: multi-select drag-and-drop (a new pattern, since the existing drag mechanic assumes a '
       'single selection), plus a new progressive-expression feature.', GOLD)

# ==================== SCREEN 12 ====================
rule()
screen_heading('12', 'Orion’s action / trunk (Slide 15)')
quote('Anu', 'Can we add an immediate action if the correct answer is dropped? Like watering the soil in the '
             'previous step: Agree. If multiple options could remain pressed and accumulate here, that would '
             'be more logical: Agree.')
para('Proposed change:', bold=True, before=6)
bullet('Multi-select drag-and-drop onto the trunk, same accumulating pattern as Screen 11.')
bullet('A new immediate visual cue the moment a HEALTHY option is dropped, consistent with the soil-watering '
       'effect, applied to the trunk (e.g. a brief glow/strengthen pulse on the trunk).')
para('Same scoring question as Screen 11 applies here too (two healthy options plus one neutral "keep control '
     'but kinder").', italic=True, color=GREY)
effort('Medium: same multi-select drag-and-drop pattern as Screen 11, plus one new visual cue (smaller than '
       'the expression feature).', GOLD)

# ==================== SCREEN 13 ====================
rule()
screen_heading('13', 'The family feels the change / branches (Slide 16)')
quote('Anu', 'If possible we could do an incremental improved family emotional wellbeing as the 3rd drag, making '
             'branches flourish?')
para('Proposed change:', bold=True, before=6)
bullet('This is a genuinely new mechanic, not a tweak: this screen currently just narrates the outcome (no '
       'choices at all). Turning it into a third drag-and-drop means: new draggable option content (what '
       'specific "family wellbeing" actions would a learner choose from?), wiring the engine to accept the '
       '"branches" area as a drop target, and a new visual: the branches visibly flourishing (extra leaves, '
       'colour, maybe early fruit) as it’s dropped.')
tag('NEEDS CONTENT INPUT, NOT JUST A DEV DECISION', BLUE)
para('Anu’s idea is a strong direction, but we’d need two or three concrete option choices and their wording '
     'before this can be built, e.g. "spend time together," "really listen when they talk," "keep the promise '
     'he made." Suggest this goes to the content/Edu side as its own small task, separate from the other four '
     'screens (which are ready to build once the scoring questions above are settled).')
effort('Large: a new mechanic end-to-end (content, drop-target wiring, new visual), and blocked on content '
       'before any build work can start.', RED)

# ==================== SCREEN 22 ====================
rule()
screen_heading('22', 'One step you will take (Slide 25)')
quote('Anu', 'Agree.')
para('Proposed change:', bold=True, before=6)
bullet('Suggestion chips currently REPLACE the pledge text box when tapped. Change so tapping a chip ADDS it to '
       'the text (joined naturally, e.g. "...and join a men’s group"), and tapping an already-added chip '
       'removes it again.')
bullet('Free-text editing stays exactly as it is; this only changes how the suggestion chips behave.')
bullet('No scoring question here: the pledge doesn’t affect the tree’s health, so there’s '
       'nothing to reconcile.')
effort('Small: a self-contained UI change, no scoring question, no new copy.', GREEN)

# ==================================================================
# PART 2: ALI'S TEXT-DENSITY SUGGESTIONS
# ==================================================================
rule()
H('Part 2: Ali’s suggestions on cutting down the text', 16, DARK, before=18, after=10)
para('Two structural suggestions, then shorter replacement wording for eleven screens/lines. None of this has '
     'been applied yet.', italic=True, color=GREY)

# ---- structural suggestion 1: support line placement ----
H('1. Show 1800RESPECT / 000 on the last screen only', 13, GOLD, before=14)
quote('Ali', 'The 1800RESPECT and 000 numbers to appear on the last screen only. The order to be 000 followed '
             'by 1800RESPECT.')
tag('CONFLICTS WITH AN EXISTING SAFETY GUARDRAIL: NEEDS PVAW SIGN-OFF', RED)
para('This isn’t a copy edit. It reverses a specific, documented pedagogy decision: "the 1800RESPECT / '
     '000 support line shows on every screen," which is checked automatically on every content change '
     '(the build fails if any screen is missing it). That rule exists so the support line is always visible '
     'without a learner needing to reach the end of the activity. Removing it from every screen but the last '
     'is a real safety-design change, not a text-density one, so this needs Anu/PVAW’s explicit '
     'confirmation before it happens. It carries the same weight as the multi-select decision in Part 1, not '
     'something to fold in quietly alongside the wording trims below.')
para('If it does get confirmed, the reorder (000 before 1800RESPECT) is the easy part.', italic=True, color=GREY)

# ---- structural suggestion 2: one screen title ----
H('2. One screen title per screen, not several', 13, GOLD, before=14)
quote('Ali', 'To have only one screen title to identify each screen (currently there are a couple of titles for '
             'each screen — example: "step 3 of 10" / "phase 1. what does he do?" / "the pressure is heavy, '
             'what does Orion do?")')
para('Reading this as: keep the step-progress indicator (the dots plus "Step X of 10", since that’s '
     'orientation, not really a "title") and the actual question/heading, and drop the middle line (the '
     '"Phase 1 · ..." tag), which mostly repeats what the heading already says. Worth confirming that’s '
     'the intended reading before it’s applied everywhere, since it touches every single screen in the game.')
effort('Small: a consistent CSS/markup change once the interpretation above is confirmed.', GREEN)

# ---- per-screen text trims ----
H('3. Shorter wording, screen by screen', 13, GOLD, before=16)
para('Ali’s versions are generally shorter and keep the core teaching point. A couple of specific '
     'personal-detail callbacks (e.g. "Since 2023..." on the tree screen) are dropped in the interest of '
     'brevity, flagged where that happens; otherwise nothing substantive seems to be lost.', color=GREY, italic=True)

screen_heading('03', 'Money worries')
current_vs_suggested(
    'Back home, Orion trained and worked as an engineer. Here, the doors keep closing: his overseas '
    'qualifications are not recognised, employers want local experience he has not had a chance to get, and '
    'he has few contacts to help him find work. These barriers are common for new arrivals — they are not '
    'his fault. Orion is trying hard, but money is tight, and he worries every day.',
    'Orion trained and worked as an engineer back home. Here, his qualifications are not recognised, '
    'employers want local experience, and he has few professional contacts. Work is hard to find, money is '
    'tight, and he worries every day.')

screen_heading('04', 'A changing role')
current_vs_suggested(
    'His wife wants to study and find work. His children want to choose their own paths. He no longer feels '
    'that his family members respect him or listen to him. He feels his role in the family is changing. He '
    'feels unheard and unsure.',
    'His wife wants to study and work, while his children want to choose their own paths. Orion feels his '
    'role in the family is changing. He feels unheard and uncertain.')

screen_heading('05', 'Two big pressures')
current_vs_suggested(
    'Orion is facing two big pressures that many new arrivals know. One is migration pressure — a new '
    'language, hard to find work, and few social connections. The other is loss of status — back home he '
    'was respected and led others; here he can feel unseen, like starting from zero. These pressures are not '
    'his fault, but they shape how he feels and acts. Orion is not sure where to go, and he has a choice to make.',
    'Orion is facing challenges many new arrivals experience. Finding work is difficult, social connections '
    'are limited, and he feels he has lost the respect and status he once had. Unsure of what comes next, he '
    'has a choice to make.')

screen_heading('06', 'The behaviour under pressure')
current_vs_suggested(
    'There is no perfect answer. These are realistic — but unhealthy — ways a person under stress can act. '
    'Choosing one does not make it right; seeing what it does to the family helps us understand, not judge.',
    'People under stress do not always make healthy choices. Explore the consequences to understand, not judge.')
para('Note: this is the intro line above the options; it sits alongside whatever gets decided for the '
     'multi-select and colour-coded outcomes in Part 1, Screen 06.', italic=True, color=GREY, before=2)

screen_heading('07', 'Family experiences')
current_vs_suggested(
    'His partner feels stressed and not heard. The children feel worried, grow quiet, and pull away. This is '
    'a response to Orion’s behaviour — his own actions are shaping how his family feels. It is not '
    'their fault, and not the pressure itself. He does not fully see it yet. But behaviour can be changed — '
    'and that is where the story can turn.',
    'Orion’s partner feels unheard. The children are worried and pull away. His actions are affecting '
    'the family more than he realises. But change is still possible.')

screen_heading('08', 'The belief underneath')
current_vs_suggested(
    'Beliefs shape how we act under pressure. The pressures stay the same — but the belief behind our '
    'choices shapes how we respond. Which one fits best? There is no wrong choice.',
    'Beliefs shape how we respond to pressure. The challenges are the same, but different beliefs can lead '
    'to different choices. Which one fits best? There is no wrong answer.')
para('Ali also flagged the heading itself, "What belief might sit behind this?", as reading better in the '
     'plural ("What beliefs..."), since there are several to choose from. Worth a quick confirm since it’s '
     'a matter of preference either way, not a correction.', italic=True, color=GREY, before=2)

screen_heading('09', 'The whole tree')
current_vs_suggested(
    'Deep down are two big pressures: migration stress and loss of status. Since 2023: a new language, no '
    'work, few connections. He was a leader; now he feels unseen. Think of a tree. The roots are life '
    'pressures. The soil is beliefs. The trunk is behaviour. The branches are the impact on family. Our '
    'values and beliefs shape how we think, which shapes how we act, which affects the people around us. To '
    'make change, we look at the whole tree. We can keep our values and show them in a healthier way — not '
    'just change the behaviour.',
    'Orion is carrying two heavy challenges: adapting to a new life and losing the status he once had. Think '
    'of it like a tree: pressures are the roots, beliefs are the soil, actions are the trunk, and family '
    'impacts are the branches. Real change comes from understanding the whole tree and finding healthier '
    'ways to live our values.')
para('Drops the specific "Since 2023..." callback to when Orion arrived. Keeps the full roots/soil/trunk/'
     'branches mapping, just more concisely.', italic=True, color=GREY, before=2)

screen_heading('13', 'The family feels the change')
current_vs_suggested(
    'When Orion shares power and asks for help, the family feels it. His partner feels respected and can '
    'follow her goals. The children feel safe and open up. Orion feels calmer and more confident, less '
    'alone — closer to his family, and less weighed down by stress.',
    'When Orion shares decision making and asks for help, things begin to change. His partner feels '
    'respected. The children feel safe and open up. Orion feels calmer, more connected, and less alone.')

screen_heading('15', 'A tree that is healing')
current_vs_suggested(
    'Some things got better, and some strain remains. A few choices kept the power with Orion alone. But he '
    'is trying, and the tree is greener than before. Change is a journey — even small steps make a real '
    'difference. Positive change does not need big actions.',
    'Some things improved, while other challenges remained. Orion still held onto some control, but he was '
    'trying to change. Change is a journey, and even small steps can make a real difference.')

screen_heading('20', 'What we learn')
current_vs_suggested(
    'By changing his beliefs, Orion can change his actions — and build a safe, respectful home. Ask '
    'yourself: \U0001F331 Which belief is worth changing first? \U0001F33F What helps most when the '
    'pressure is high? \U0001F333 What does trust look like at home? \U0001F34E What home do we want for '
    'our family?',
    'Changing beliefs can lead to healthier choices and stronger relationships. Take a moment to reflect and '
    'ask yourself: \U0001F331 Which belief is worth changing first? \U0001F33F What helps most under '
    'pressure? \U0001F333 What does trust look like at home? \U0001F34E What kind of home do we want for '
    'our family?')

screen_heading('12', 'Orion’s action: one option’s feedback text')
para('Ali flagged just the feedback for "Keep control, but try to be kinder about it" specifically, not the '
     'whole screen.', italic=True, color=GREY, before=2)
current_vs_suggested(
    'Kindness helps. But keeping all the power to himself does not really heal the tree. Sharing it does.',
    'Controlling the decisions in the family does not heal the tree even if he is kind.')

# ---------------- NOT IN SCOPE / SEQUENCING ----------------
rule()
H('Suggested order to tackle all of this', 13, GOLD, before=14)
bullet('Confirm the support-line placement with Anu/PVAW first: it’s the one item here with real safety '
       'weight, alongside the multi-select decision from Part 1.')
bullet('The screen-by-screen text trims (Part 2, section 3) are low-risk copy swaps and could be applied any '
       'time once you’re happy with the wording; they don’t depend on any other decision.')
bullet('The "one title per screen" change touches every screen’s layout, so worth doing in the same pass '
       'as the text trims rather than separately.')
bullet('Fold both into the same round of screen changes as the Part 1 items where they overlap (e.g. Screen '
       '06’s intro line, Screen 07/13’s wording), rather than editing the same screen twice.')

foot = doc.add_paragraph(); foot.paragraph_format.space_before = Pt(14)
rf = foot.add_run('Once the support-line question and the two Part 1 scoring/design decisions are settled, '
                   'everything else here (the text trims, the title consolidation, and the small/medium '
                   'Part 1 screens) can be built together in one pass. Screen 13’s new branches '
                   'drag-and-drop stays a separate, content-led follow-up.')
rf.italic = True; rf.font.size = Pt(9.5); rf.font.color.rgb = GREY

out = os.path.join(ROOT, 'docs', 'Shaping-Change-Proposed-Changes-Anu.docx')
doc.save(out)
print('saved', os.path.relpath(out, ROOT))
