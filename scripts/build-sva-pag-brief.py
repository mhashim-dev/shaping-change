#!/usr/bin/env python3
"""Build the SVA Project Advisory Group 'Activity Brief' deck (Phase 1 preview).

A ~20-minute presentation: what the activity is, why it matters, the approach, and a
walk through Phase 1 (which is built). Phase 2 is named as 'in development' only — no
Phase 2 screens are shown. Speaker notes on every slide help pace the 20 minutes.

    pip install python-pptx
    python3 scripts/build-sva-pag-brief.py   # -> docs/Shaping-Change-SVA-PAG-Brief.pptx
"""
import os
from pptx import Presentation
from pptx.util import Emu, Pt
from pptx.dml.color import RGBColor
from pptx.enum.shapes import MSO_SHAPE
from pptx.enum.text import PP_ALIGN, MSO_ANCHOR

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
IMG = os.path.join(ROOT, 'docs', 'figma-screens')
IMGX = os.path.join(ROOT, 'docs', 'images')

GOLD = RGBColor(0xF0, 0xC6, 0x6A); INK = RGBColor(0x2A, 0x1F, 0x10)
DARK = RGBColor(0x1B, 0x14, 0x0C); PANEL = RGBColor(0x17, 0x11, 0x0A)
CREAM = RGBColor(0xF5, 0xEF, 0xE2); MUTE = RGBColor(0xCF, 0xC7, 0xB8)
LINEC = RGBColor(0x4A, 0x3E, 0x2A); GREEN = RGBColor(0x9F, 0xD4, 0xA6)
SERIF, SANS = 'Georgia', 'Helvetica'

W, H = 12192000, 6858000
prs = Presentation(); prs.slide_width = Emu(W); prs.slide_height = Emu(H)
blank = prs.slide_layouts[6]


def rect(slide, x, y, w, h, fill):
    s = slide.shapes.add_shape(MSO_SHAPE.RECTANGLE, Emu(x), Emu(y), Emu(w), Emu(h))
    s.fill.solid(); s.fill.fore_color.rgb = fill; s.line.fill.background(); s.shadow.inherit = False
    return s


def tb(slide, x, y, w, h):
    t = slide.shapes.add_textbox(Emu(x), Emu(y), Emu(w), Emu(h)).text_frame
    t.word_wrap = True
    return t


def para(tf, runs, *, align=PP_ALIGN.LEFT, before=0, after=6, spacing=1.06, bullet=False, reuse=False):
    p = tf.paragraphs[0] if (reuse and len(tf.paragraphs) == 1 and not tf.paragraphs[0].runs) else tf.add_paragraph()
    p.alignment = align
    if before: p.space_before = Pt(before)
    p.space_after = Pt(after); p.line_spacing = spacing
    if isinstance(runs, str):
        runs = [(runs, 18, SANS, CREAM, False, False)]
    for (text, size, font, color, bold, italic) in runs:
        r = p.add_run(); r.text = text
        r.font.size = Pt(size); r.font.name = font; r.font.bold = bold; r.font.italic = italic
        r.font.color.rgb = color
    return p


def notes(slide, text):
    slide.notes_slide.notes_text_frame.text = text


def base(kicker='SHAPING CHANGE   ·   ACTIVITY BRIEF'):
    s = prs.slides.add_slide(blank)
    rect(s, 0, 0, W, H, DARK)
    eb = tb(s, 520000, 330000, 9000000, 460000)
    para(eb, [(kicker, 12, SANS, GOLD, True, False)], after=0, reuse=True)
    rect(s, 520000, 770000, W - 1040000, 9000, LINEC)
    return s


def bullet_slide(title, sub, items, *, note=''):
    s = base()
    t = tb(s, 520000, 1120000, W - 1040000, 5200000)
    para(t, [(title, 30, SERIF, CREAM, True, True)], after=4, reuse=True)
    if sub:
        para(t, [(sub, 15, SANS, GOLD, False, True)], after=14)
    for it in items:
        if isinstance(it, tuple):
            head, body = it
            para(t, [('•  ', 18, SANS, GOLD, True, False), (head + '  ', 18, SANS, CREAM, True, False),
                     (body, 18, SANS, MUTE, False, False)], after=10, spacing=1.08)
        else:
            para(t, [('•  ', 18, SANS, GOLD, True, False), (it, 18, SANS, CREAM, False, False)], after=10, spacing=1.08)
    notes(s, note)
    return s


def screen_slide(kicker_title, img, title, phase, points, *, note=''):
    s = base()
    # image left
    iw = 6650000; ih = iw * 900 // 1600
    iy = 1050000 + (5400000 - ih) // 2
    pic = s.shapes.add_picture(os.path.join(IMG, img), Emu(520000), Emu(iy), width=Emu(iw), height=Emu(ih))
    pic.line.color.rgb = LINEC; pic.line.width = Pt(1)
    # text right
    t = tb(s, 7420000, 1180000, 4292000, 5000000)
    para(t, [(kicker_title, 12, SANS, GOLD, True, False)], after=6, reuse=True)
    para(t, [(title, 24, SERIF, CREAM, True, True)], after=3)
    para(t, [(phase, 12, SANS, GOLD, False, True)], after=12)
    rect(s, 7420000, 2130000, 4100000, 9000, LINEC)
    for p in points:
        para(t, [('•  ', 16, SANS, GOLD, True, False), (p, 15.5, SANS, CREAM, False, False)], before=8, after=6, spacing=1.1)
    notes(s, note)
    return s


# ---------------- 1. COVER ----------------
c = prs.slides.add_slide(blank)
rect(c, 0, 0, W, H, PANEL)
# scene image on the right
sc = os.path.join(IMGX, 'sva-cover-scene.png')
if os.path.exists(sc):
    cw = 5200000; ch = cw * 880 // 1080
    c.shapes.add_picture(sc, Emu(W - cw - 500000), Emu((H - ch) // 2), width=Emu(cw), height=Emu(ch))
ct = tb(c, 620000, 1500000, 6200000, 4000000)
para(ct, [('ACTIVITY  BRIEF', 15, SANS, GOLD, True, False)], after=16, reuse=True)
para(ct, [('Shaping Change', 44, SERIF, CREAM, True, True)], after=4)
para(ct, [('Building strong roots for safety', 21, SERIF, GOLD, False, True)], after=22)
para(ct, [('Stronger Voices for Action — Project Advisory Group', 16, SANS, CREAM, False, False)], after=6)
para(ct, [('Phase 1 preview   ·   [Presenter]   ·   [Date]', 14, SANS, MUTE, False, False)], after=0)
notes(c, 'Good morning/afternoon. Thank you for the time. I\'m going to give a short brief on the '
        'Shaping Change activity — what it is, why we\'re building it, and a walk through Phase 1, '
        'which is built. I\'ll keep the brief to about 15 minutes and leave plenty of room for '
        'questions. This activity sits within the Stronger Voices for Action work as a primary-'
        'prevention piece aimed at engaging men as leaders of positive change.')

# ---------------- 2. WHAT IT IS ----------------
bullet_slide(
    'What it is', 'A short, reflective, interactive digital activity',
    [('Primary prevention', 'of family and domestic violence — engaging men as part of the change.'),
     ('For newly-arrived and migrant-community men', 'positioned as leaders of positive change, not as a problem.'),
     ('Simple English (EAL)', 'self-paced, about 10–15 minutes, works on a phone or a shared device.'),
     ('Meaning carried by a story and a growing tree', 'one man\'s journey — not lectures or statistics.')],
    note='In one line: it\'s a short, reflective digital activity for primary prevention, made for '
         'men from newly-arrived and migrant communities, in simple English. It\'s self-paced and takes '
         'about 10–15 minutes. The important design choice is that the meaning is carried by a story and '
         'a growing tree — the learner feels the idea rather than being lectured, which suits a wide range '
         'of English literacy.')

# ---------------- 3. WHY IT MATTERS ----------------
bullet_slide(
    'Why this activity', 'The need it responds to',
    ['Settlement is a period of real pressure and change — work, language, culture, and family roles.',
     'Primary prevention means addressing the drivers of violence — gender inequality, rigid roles, control — before harm occurs.',
     'Men are essential to that change; the activity invites them in as part of the solution.',
     'It normalises the pressure, and clearly separates understanding it from excusing any harm.'],
    note='Why this, and why now. Arriving and settling in a new country brings genuine pressure across '
         'work, language, culture and changing family roles. Primary prevention means getting upstream of '
         'violence — to the drivers like gender inequality and rigid ideas about control — before any harm. '
         'Men are central to that, so we engage them as part of the solution. A careful line we hold '
         'throughout: we normalise the pressure people feel, while being clear that understanding a '
         'behaviour is never the same as excusing it.')

# ---------------- 4. APPROACH ----------------
bullet_slide(
    'Understanding patterns — not blaming people', 'Our pedagogy, developed with Education and PVAW',
    ['Non-judgemental and strengths-based — safety, equity and respect as shared values.',
     'A soft, reflective story — no depicted violence.',
     'Violence is always a choice, and is driven by gender inequality — the activity keeps that frame gentle and clear.',
     'The 1800RESPECT / 000 support line is present on every single screen.'],
    note='The heart of the approach is: understand patterns, don\'t blame people or cultures. It\'s '
         'strengths-based and non-judgemental, built around safety, equity and respect. There is no '
         'depicted violence — it\'s a soft, reflective story. We keep the primary-prevention message '
         'clear but gentle: violence is a choice, and it\'s driven by gender inequality. And on every '
         'screen, without exception, the 1800RESPECT and 000 support line is visible. This has been '
         'shaped closely with our Education and PVAW colleagues.')

# ---------------- 5. THE BIG IDEA (tree) ----------------
s5 = base()
tm = os.path.join(IMGX, 'sva-tree-model.png')
if os.path.exists(tm):
    tw = 5400000; th = tw * 880 // 1080
    s5.shapes.add_picture(tm, Emu(560000), Emu(1150000 + (5300000 - th) // 2), width=Emu(tw), height=Emu(th))
t5 = tb(s5, 6500000, 1180000, 5200000, 5000000)
para(t5, [('The big idea: the whole tree', 30, SERIF, CREAM, True, True)], after=12, reuse=True)
for head, body in [('Roots', 'the life pressures — migration stress, loss of status'),
                   ('Soil', 'beliefs and attitudes'),
                   ('Trunk', 'behaviour'),
                   ('Branches', 'the impact on the family')]:
    para(t5, [('•  ', 18, SANS, GOLD, True, False), (head + ' — ', 18, SANS, CREAM, True, False),
              (body, 18, SANS, MUTE, False, False)], after=9, spacing=1.1)
para(t5, [('"Our values shape how we think, which shapes how we act, which affects the people around us."',
           15, SERIF, GOLD, False, True)], before=10, after=0, spacing=1.2)
notes(s5, 'Everything hangs off one simple idea — a tree. The roots are the life pressures a person is '
          'under. The soil is their beliefs and attitudes. The trunk is their behaviour — what people see. '
          'And the branches are the impact on the family. The message is that our values shape how we '
          'think, which shapes how we act, which affects those around us. To make change we look at the '
          'whole tree — and importantly, we can keep our values and express them in a healthier way.')

# ---------------- 6. TWO PHASES ----------------
s6 = base()
t6 = tb(s6, 520000, 1120000, W - 1040000, 1400000)
para(t6, [('How the activity works — two phases', 30, SERIF, CREAM, True, True)], after=4, reuse=True)
para(t6, [('The same tree runs through both — it declines, then heals', 15, SANS, GOLD, False, True)], after=0)
# two panels
pw = 5300000; px1 = 520000; px2 = 520000 + pw + 520000; py = 2650000; ph = 3200000
for (x, tag, ttl, body, statecol, state) in [
    (px1, 'PHASE 1', 'Experience the Problem',
     'Follow the story. The tree declines as the pressure builds — the learner sees how pressure can turn into harmful behaviour, and the impact on the family.',
     GREEN, 'Built — we\'ll walk through it now'),
    (px2, 'PHASE 2', 'Rebuild the Outcome',
     'The learner steps in as the leader and helps grow a healthier outcome — new beliefs, new actions, a stronger home.',
     GOLD, 'In development')]:
    p = s6.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, Emu(x), Emu(py), Emu(pw), Emu(ph))
    p.fill.solid(); p.fill.fore_color.rgb = PANEL; p.line.color.rgb = LINEC; p.line.width = Pt(1); p.shadow.inherit = False
    pt = tb(s6, x + 300000, py + 260000, pw - 600000, ph - 520000)
    para(pt, [(tag, 13, SANS, GOLD, True, False)], after=6, reuse=True)
    para(pt, [(ttl, 22, SERIF, CREAM, True, True)], after=10)
    para(pt, [(body, 15, SANS, MUTE, False, False)], after=12, spacing=1.14)
    para(pt, [('●  ', 13, SANS, statecol, True, False), (state, 14, SANS, statecol, True, False)], after=0)
notes(s6, 'The activity is two phases, and the same tree runs through both. In Phase 1 — Experience the '
          'Problem — we follow the story and the tree declines as pressure builds. In Phase 2 — Rebuild the '
          'Outcome — the learner becomes the leader and helps grow a healthier outcome. Phase 1 is built, '
          'and that\'s what I\'ll show you today. Phase 2 is in development and follows the same tree.')

# ---------------- 7–13. PHASE 1 WALKTHROUGH ----------------
screen_slide('PHASE 1  ·  WELCOME', '01-welcome.png', 'A gentle welcome', 'Opening · the landing screen',
             ['Plain-language expectations up front: about 10–15 minutes, at your own pace, on any device.',
              '"Understanding patterns — not blaming people or cultures." The frame is set before the story.',
              'Private and self-paced; an optional one-tap check-in invites reflection, never pressure.'],
             note='We open on a short welcome — a landing screen we added in response to feedback that '
                  'learners want a little context before they begin. In plain language it sets expectations: '
                  'a short, reflective activity, about 10–15 minutes, at your own pace, with no right or wrong '
                  'answers. It states our frame up front — understanding patterns, not blaming people or '
                  'cultures — and offers an entirely optional one-tap check-in on how ready someone feels to '
                  'lead positive change at home.')

screen_slide('PHASE 1  ·  MEET', '02-intro.png', 'Meet Orion', 'Opening',
             ['Arrived in 2023; back home he was a respected community leader.',
              'Warm, non-judgemental tone — "understanding patterns, not blaming people."',
              'Follow his story, and help him make better choices along the way.'],
             note='We then meet our character, Orion. He arrived in Australia in 2023, and back home he was '
                  'a respected community leader — people came to him for help. That matters: he\'s not a '
                  'villain, he\'s someone many in the room will recognise. The tone is warm and non-'
                  'judgemental, and the learner is invited to follow his story and help him make better '
                  'choices.')

screen_slide('PHASE 1  ·  THE PRESSURES', '05-pressure-migration.png', 'The pressures build', 'Phase 1 · The pressures',
             ['Two named pressures: migration pressure, and loss of status.',
              'Money worries and changing family roles come first, each on its own screen.',
              'Deliberately split into small, single-idea screens for lower English literacy.',
              '"These are not his fault — but they shape how he feels and acts."'],
             note='We then build the pressure. Money is tight, he hasn\'t found work; his wife wants to '
                  'study and work and the children want their own paths, so he feels his role changing. We '
                  'name two big pressures explicitly — migration pressure, and loss of status — because '
                  'recognising them is the first step. And we state plainly: these are not his fault, but '
                  'they do shape how he feels and acts at home. The tree is quietly beginning to strain.')

screen_slide('PHASE 1  ·  THE CHOICE', '07-behaviour.png', 'The moment of choice', 'Phase 1 · The behaviour',
             ['The learner chooses how a stressed person might respond.',
              'No perfect answer; gentle, non-shaming feedback follows each.',
              'Naming the behaviour is the first step to understanding it.'],
             note='Here the learner makes a choice — how might someone under this much pressure respond? '
                  'Take tight control, go quiet and pull away, or let it come out as anger. There\'s no '
                  'perfect answer, and the feedback is gentle and never shaming — it names the behaviour and '
                  'makes clear that understanding why it happens is not the same as saying it\'s okay. This '
                  'is the activity\'s honest centre, handled softly.')

screen_slide('PHASE 1  ·  THE IMPACT', '08-impact.png', 'Who feels it?', 'Phase 1 · The impact',
             ['The ripple to partner and children — worry, distance, quiet.',
              'Shown through feeling and the declining tree — no depicted violence.',
              'Builds empathy for the whole family.'],
             note='Next we show who feels it. The partner feels unheard; the children grow quiet and pull '
                  'away; and he feels more alone, not seeing how his behaviour is landing on the family he '
                  'cares about. Crucially there is no depicted violence — the impact is carried by feeling, '
                  'by a thought bubble, and by the declining tree. It builds empathy for the whole family.')

screen_slide('PHASE 1  ·  THE BELIEF', '09-belief.png', 'The belief underneath', 'Phase 1 · The belief',
             ['Surfaces the belief driving the behaviour — the "soil."',
              'A reflection point, not blame — "there is no wrong choice."',
              'Sets up the idea that changing beliefs can change actions.'],
             note='We then gently surface the belief sitting underneath — for example, "as the father, it '
                  'is my job to lead and decide." In tree terms, this is the soil. It\'s framed as reflection, '
                  'not blame — there\'s no wrong choice here — and it sets up the key idea that if we can '
                  'shift the belief, we can shift the behaviour.')

screen_slide('PHASE 1  ·  THE MODEL', '10-root-tree-model.png', 'The whole tree revealed', 'Phase 1 · The tree model',
             ['The model comes together: roots, soil, trunk, branches.',
              'Interactive — the learner taps each part of the tree to discover it.',
              'Closes Phase 1 and sets up the rebuild.'],
             note='Phase 1 closes by pulling it all together on the tree the learner has been watching. '
                  'The roots are the pressures, the soil the beliefs, the trunk the behaviour, the branches '
                  'the impact. It\'s interactive — they tap each part of the tree to discover it, so the model '
                  'is discovered rather than read. This is the pivot point: having experienced the problem, '
                  'the learner is ready to help rebuild — which is Phase 2.')

# ---------------- 13. REACH & SAFETY ----------------
bullet_slide(
    'Built for reach — and for safety', 'Designed for this audience and this subject',
    [('Accessible', 'simple English, screen-reader friendly, keyboard-operable, tap or drag (WCAG 2.1 AA).'),
     ('Works on any device', 'phone, tablet or computer — the text always fits, with no scrolling to read it.'),
     ('A personalised take-home summary', 'print or save the choices the learner made and the leadership pledge they wrote.'),
     ('Private', 'answers stay on the learner\'s own device.'),
     ('Safe by design', 'no depicted violence; the support line on every screen; built with Edu & PVAW.')],
    note='A few things that make it fit this audience and this subject. It\'s accessible — simple English, '
         'and it meets common accessibility standards so it works with screen readers and a keyboard, not '
         'just touch. It works on any device — phone, tablet or computer — and the layout is designed so the '
         'text always fits without the learner ever needing to scroll to read it, which matters for lower '
         'literacy. At the end, the learner can take home a personalised summary — the choices they made and '
         'the leadership pledge they wrote. Answers stay on the learner\'s own device. And it\'s safe by '
         'design — no depicted violence, the support line always present, and shaped throughout with our '
         'Education and PVAW teams.')

# ---------------- 14. WHERE IT'S AT ----------------
bullet_slide(
    'Where it\'s at — and what\'s next', 'Status and next steps',
    [('Phase 1 is built', 'the experience you\'ve just seen, now refined from team feedback.'),
     ('Phase 2 in development', 'the rebuild — same tree, learner as leader.'),
     ('Screen designs out for review', 'with Education, PVAW and Digital — comments welcome.'),
     ('Evaluation', 'optional before/after reflection, plus anonymous engagement measures.'),
     ('For confirmation', 'closing statistics wording, and the delivery model.')],
    note='Where we are: Phase 1 is built — that\'s what you\'ve just seen, and it\'s been refined from team '
         'feedback. Phase 2, the rebuild, is in development and uses the same tree. The full screen designs '
         'are out for review with Education, PVAW and Digital, and comments are very welcome. On evaluation, '
         'we have an optional before-and-after reflection built in, plus anonymous engagement measures. And '
         'there are a couple of things we\'d like this group\'s steer on — the wording of the closing '
         'statistics, and how best to deliver it.')

# ---------------- 15. FOR DISCUSSION ----------------
bullet_slide(
    'For discussion', 'We\'d welcome the group\'s view on',
    ['Does the tone and framing feel right for our communities?',
     'How might this be delivered — self-paced, in groups, or both?',
     'What would make this most useful to the services and leaders you work with?',
     'What matters most as we shape Phase 2 — the rebuild?',
     'Anything we should be careful about, given the subject and the audience?'],
    note='I\'ll stop there and open it up. A few things we\'d genuinely value your view on: does the tone '
         'feel right for our communities; how you\'d see it delivered — self-paced, in groups, or both; what '
         'would make it most useful to the leaders and services you work with; what matters most as we shape '
         'Phase 2; and anything we should hold in mind given the subject and the audience. Over to you — '
         'happy to take any questions.')

# ---------------- 16. THANK YOU ----------------
tqs = prs.slides.add_slide(blank)
rect(tqs, 0, 0, W, H, PANEL)
tq = tb(tqs, 0, 2500000, W, 1900000)
para(tq, [('Thank you', 40, SERIF, CREAM, True, True)], align=PP_ALIGN.CENTER, after=10, reuse=True)
para(tq, [('Questions & discussion', 20, SERIF, GOLD, False, True)], align=PP_ALIGN.CENTER, after=18)
para(tq, [('Shaping Change: Building strong roots for safety   ·   Stronger Voices for Action',
           14, SANS, MUTE, False, False)], align=PP_ALIGN.CENTER, after=6)
para(tq, [('Support is always available — 1800RESPECT (1800 737 732)  ·  in an emergency, 000',
           13, SANS, CREAM, False, False)], align=PP_ALIGN.CENTER, after=0)
notes(tqs, 'Thank you. Reminder for the room that support is always available — 1800RESPECT, and 000 in an '
           'emergency. Happy to keep talking or follow up individually.')

out = os.path.join(ROOT, 'docs', 'Shaping-Change-SVA-PAG-Brief.pptx')
prs.core_properties.title = 'Shaping Change — SVA PAG Activity Brief (Phase 1 preview)'
prs.core_properties.author = 'Shaping Change'
prs.save(out)
print('saved', os.path.relpath(out, ROOT), '(%d slides)' % len(prs.slides._sldIdLst))
