"""Canonical per-screen descriptions for the 23 Shaping Change screens.
Shared by scripts/build-screens-doc.py (Word) and scripts/build-screens-deck.py (PowerPoint)
so the two artifacts can never drift apart. Each entry: (file, title, phase, on_screen, purpose)."""

SCREENS = [
 ('01-welcome', 'Welcome — what this is', 'Opening',
  'The activity title, “Shaping Change: Building strong roots for safety,” and a short, plain-English '
  'overview — what the activity is (a reflective activity about safe, respectful homes); that settling in '
  'a new country brings pressures we can respond to; how you follow Orion’s story and make a few choices '
  'with a tree that grows alongside; “no right or wrong answers, no blame — understanding patterns, not '
  'blaming people or cultures”; and a short “What to expect” list (about 10–15 minutes, simple English, '
  'works on any device, private). Button: “Begin.”',
  'A short, warm “what this is / what to expect” intro, so the next screen can focus on meeting the '
  'character. Trimmed for readability (PAG), and kept focused on Orion’s story rather than on the player '
  'as a leader. The optional readiness self-check was removed (PAG).'),

 ('02-intro', 'Meet Orion', 'Opening',
  'We meet Orion. He arrived in Australia in 2023 and, back home, was a respected community leader — '
  'people came to him for help. Now he is starting again. The screen keeps the focus on the character and '
  'invites the player to follow his story and help him make better choices. He stands beside a mature tree '
  'and waves hello.',
  'Introduces the character warmly and non-judgementally, and positions the player as a supportive guide '
  'to Orion.'),

 ('03-pressure-money', 'Money worries', 'Phase 1 · The pressures build',
  'Back home, Orion trained and worked as an engineer. Here, the doors keep closing: his overseas '
  'qualifications are not recognised, employers want local experience he has not had a chance to get, and '
  'he has few contacts to help him find work. These barriers are common for new arrivals and are not his '
  'fault. He is trying hard, but money is tight and he worries every day. The tree shows early strain; a '
  'thought bubble shows coins with a falling arrow.',
  'Frames the job struggle as a set of structural, systemic barriers — non-recognition of overseas '
  'qualifications, no local experience, and limited professional networks (from Ali’s list) — rather than '
  'personal failure. Establishes that the pressure is real and understandable, and never a “wrong answer.”'),

 ('04-pressure-role', 'A changing role', 'Phase 1 · The pressures build',
  'His wife wants to study and find work, and the children want to choose their own paths. He no longer '
  'feels that his family members respect him or listen to him, and feels his role in the family is '
  'changing. His thought bubble shows his wife and children at full size, and Orion himself smaller — '
  'how he pictures his own standing shrinking.',
  'Names the changing role and loss of standing. The phrase “head of the family” was removed (PAG — to '
  'avoid reinforcing hierarchy). The “smaller Orion” bubble visualises his loss of standing (PAG / Ali, '
  'S4). Builds empathy for his internal experience without excusing any behaviour.'),

 ('05-pressures-two', 'Two big pressures', 'Phase 1 · The pressures build',
  'The two big pressures are shown together on one screen: migration pressure (a new language, hard to '
  'find work, few social connections) and loss of status (back home he was respected and led others; here '
  'he can feel unseen, like starting from zero). It closes: “these pressures are not his fault, but they '
  'shape how he feels and acts. Orion is not sure where to go, and he has a choice to make.”',
  'Combines the two named pressures onto a single screen, shown side by side as thought bubbles (PAG '
  'request), and bridges into the choice ahead.'),

 ('06-behaviour', 'The behaviour under pressure', 'Phase 1 · The behaviour  (choice)',
  '“The pressure is heavy. What does Orion do?” The player chooses between three realistic responses — '
  'take tight control, go quiet and pull away, or let the stress come out as anger. The screen explains '
  'these are realistic but unhealthy ways a person under stress can act, and that seeing what each does '
  'helps us understand, not judge. Each choice reveals “Orion’s reasoning” — why he might act this way — '
  'alongside the effect on the family (understanding why is not the same as excusing it).',
  'The player witnesses the problem behaviour by choosing. Now states plainly that the options are '
  'realistic-but-unhealthy — not “correct” answers — and points to their impact (PAG / Ali). Understanding '
  'why is not the same as excusing it.'),

 ('07-impact', 'Family experiences', 'Phase 1 · The impact',
  'His partner feels stressed and unheard; the children grow quiet and pull away. The screen states plainly '
  'that this is a response to Orion’s behaviour — his own actions are shaping how his family feels — and '
  'that it is not their fault, nor the pressure itself. He does not fully see it yet, but behaviour can be '
  'changed. A thought bubble shows his partner and children looking unhappy, and the tree is visibly declining.',
  'Retitled “Family experiences” (PAG). Makes the ripple effect on the whole family concrete and visible, '
  'without depicting violence. Now puts a clear spotlight on the fact that it is Orion’s behaviour driving '
  'the family’s reactions — and that behaviour can change (Anu, final approval note).'),

 ('08-belief', 'The belief underneath', 'Phase 1 · The belief  (choice)',
  'The screen notes that the pressures stay the same, but the belief behind our choices shapes how we '
  'respond. “What belief might sit behind this?” The player picks the belief that best fits, from five '
  'options — for example, “As the father, it is my job to lead and decide,” “People expect men like me to '
  'be strong and in control,” and “Men shouldn’t ask for help — private problems should stay private.” '
  'There is no wrong choice.',
  'Surfaces the belief driving the behaviour — the “soil.” Expanded with the belief options Ali supplied, '
  'including ones that block help-seeking (which the rebuild then addresses).'),

 ('09-root-tree-model', 'The whole tree', 'Phase 1 · The tree model',
  'The conceptual reveal: roots are life pressures, soil is beliefs, the trunk is behaviour, and the '
  'branches are the impact on family. “Our values and beliefs shape how we act.” The player **taps each '
  'part of the tree** to discover it — the part highlights and its meaning fills into the legend, so the '
  'model is discovered rather than read. Tapping the legend works too, and the parts are keyboard-'
  'selectable. A gentle one-time hint points to the tree the first time.',
  'The centrepiece of the activity — the tree metaphor. Shows that to change the outcome you look at the '
  'whole tree, and that values can be kept and expressed in a healthier way. Closes Phase 1.'),

 ('10-rebuild-intro', 'Help Orion rebuild', 'Phase 2 · Rebuild',
  'The same pressures are still there, but new beliefs and new actions can grow a healthier tree — '
  '“let’s rebuild it, step by step.”',
  'Opens the rebuild. Reframed to keep the focus on Orion (“help Orion rebuild”) rather than casting the '
  'player as a community leader (PAG / Ali).'),

 ('11-attitude', 'A healthier belief', 'Phase 2 · Rebuild — the belief  (choice)',
  '“What belief would help most?” Four healthier beliefs to choose from — respect earned through trust and '
  'listening; worth beyond status or work; children feeling safe to share their feelings; or staying in '
  'charge if fair. The soil feeds the tree. The player **drags the belief onto the soil** to plant it '
  '(tapping a card still works), and the soil takes it up as it lands.',
  'The first rebuild choice — replacing the driving belief. Models that strong families are built on '
  'trust, not control or fear.'),

 ('12-behaviour-good', 'Orion’s action', 'Phase 2 · Rebuild — the action  (choice)',
  '“What action should Orion take?” Three options — make the big decisions together with his wife while '
  'still taking responsibility; ask for help (English classes, job support, counselling); or keep control '
  'but be kinder. The trunk is what people see — and the player **drags the chosen action onto the trunk** '
  'to commit to it (tapping still works). His thought bubble pictures the healthy way — two people '
  'working things out together over a shared plan.',
  'The hinge of Phase 2 — the action decides which tree grows. Reworded to keep the focus on Orion and to '
  'include “making decisions together while remaining responsible” (Ali). Shared power and help-seeking '
  'heal the tree; keeping all the power to himself does not.'),

 ('13-impact-good', 'The family feels the change', 'Phase 2 · The change',
  'When Orion shares power and asks for help, the family feels it: his partner feels respected and can '
  'follow her goals, the children feel safe and open up, and Orion feels calmer, more confident and less '
  'alone — closer to his family, and less weighed down by stress. The thought bubble now shows the same '
  'family smiling.',
  'Shows the positive ripple of the healthier choices — and names the benefits: more confidence, less '
  'stress, stronger relationships (PAG).'),

 ('14-outcome-healthy', 'A healthy tree', 'Phase 2 · Outcome',
  'A full green tree, now bearing fruit. Communication became open and respectful, decisions were shared, '
  'and the home felt calmer and safer. The pressures did not disappear — he learned to face them with '
  'support.',
  'The best outcome, earned by the rebuild choices rather than luck. The fruit signals a flourishing, '
  'safe home.'),

 ('15-outcome-mixed', 'A tree that is healing', 'Phase 2 · Outcome',
  'A recovering, mostly-green tree with some strain remaining. A few choices kept the power with Orion '
  'alone, but he is trying, and the tree is greener than before. “Change is a journey — even small steps '
  'make a real difference. Positive change does not need big actions.”',
  'A realistic middle outcome that rewards effort, now with an explicit message that small changes still '
  'make a meaningful difference (PAG) — and invites another go.'),

 ('16-outcome-damaged', 'A tree under strain', 'Phase 2 · Outcome',
  'The old patterns held on and the family still feels the strain. Framed as “a warning, not the end” — '
  'he can change course now, or hold on to the old ways. The screen always offers “Go back and rebuild.”',
  'The strained outcome, always reversible. “Dig in” was reworded to “hold on to the old ways” for clarity '
  '(PAG). Framed as a warning and a choice point, never “game over” and never blame.'),

 ('17-insist-1', 'He holds on to the old ways', 'Phase 2 · Escalation  (optional path)',
  'Orion raises his voice and ends the conversation — “It’s my house, they should follow my rules.” The '
  'family grows quiet and pulls further away, and the tree loses more of its leaves. He is shown beside '
  'the tree, tense, his thought bubble showing the family unhappy.',
  'An optional pathway, reworked with PVAW. Shows harm as repeated non-physical choices escalating — his '
  'behaviour, with no external force. Retitled from “He digs in” for clarity (PAG). Reversible at every step.'),

 ('18-insist-2', 'It gets heavier', 'Phase 2 · Escalation  (optional path)',
  'He slams the door and walks away from every argument, arms crossed — “I’m only trying to protect '
  'them.” But control is not protection; no one feels safe to speak, branches begin to fall, and his '
  'thought bubble still shows the family unhappy.',
  'Continues the escalation with recognisable non-physical behaviours, kept calm and non-graphic. The '
  'way back to rebuild is always offered.'),

 ('19-escalation-warning', 'Where this can lead', 'Phase 2 · Escalation  (optional path)',
  'A calm, serious warning: left unaddressed, these patterns harden — more control, more distance, less '
  'safety at home. “This is how everyday stress, unmanaged, can grow into harm. This is what we work to '
  'prevent. It is never too late to choose a different way.” There is no fire or lightning.',
  'The prevention message — how everyday stress, unmanaged, can grow into harm. Deliberately calm '
  '(never frightening), internal in cause, and reversible.'),

 ('20-takeaways', 'What we learn', 'Phase 2 · Reflect',
  'By changing his beliefs, Orion can change his actions — and build a safe, respectful home. Four '
  'reflection questions follow: which belief is worth changing first; what helps most when the pressure '
  'is high; what trust looks like at home; and what home we want for our family.',
  'Consolidates the learning through the tree and turns it into personal reflection. Questions revised (PAG).'),

 ('21-why-matters', 'Bigger than one family', 'Phase 2 · Why this matters',
  'Orion’s story is one of many; when families are safe, we build safer communities. The statistics sit '
  'behind an opt-in “Show the numbers” button — one woman a week killed by a partner (AIHW, 2018); '
  'gender-based violence costs Australia $26 billion a year (PM&C, 2023); 1 in 2 women have experienced '
  'sexual harassment (ABS, 2021). “Men can lead the change.”',
  'Zooms out to the wider issue — placed at the end (per Anu) so the numbers land as “why this matters” '
  'rather than a scare. The opt-in reveal keeps it non-alarming. Each figure carries its source citation; '
  'the figures still require independent source-verification and a final PVAW wording check before public '
  'launch (tracked in docs/STATISTICS_SOURCES.md).'),

 ('22-leadership', 'One step you will take', 'Phase 2 · Your next step',
  'The player writes one small, real step of their own, or picks a suggestion (for example, “This month, '
  'I will ask for help when I need it,” “…share a decision at home,” “…listen more to my partner and '
  'children”). Time-bound wording is encouraged — “This month, I will…”. “Small steps build strong '
  'families.”',
  'Turns insight into a personal commitment — the player’s own step is what makes the learning stick. '
  'Renamed from “leadership pledge” and made specific and time-bound (PAG), and kept personal / home-'
  'focused rather than framed as community leadership.'),

 ('23-support', 'You can keep growing', 'Phase 2 · Support & close',
  'Helpful next steps — the AMES “Stop Violence Against Women” Leadership Course, Neighbourhood Houses, '
  'local men’s groups, and community, faith and cultural groups — with the key messages summarised. The '
  '1800RESPECT / 000 support line is present, as on every screen. The player can **print or save their '
  'plan** (their step + reflection prompts + key messages) as a keepsake.',
  'Closes on hope and concrete pathways to keep going, with help-seeking normalised. The take-home plan '
  'gives something to carry beyond the screen. (The optional before/after self-rating was removed per PAG.)'),
]


# Enhancements added since the content sign-off (July 2026), for the team / Edu / PVAW review
# section of the Word doc + PowerPoint. Each entry:
#   (title, audience, [image filenames in docs/images/enhancements] or None, [paragraphs], flag or None)
ENHANCEMENTS = [
    ('A take-home plan (keepsake)', 'For Edu & PVAW to note',
     ['keepsake-print.png'],
     ['On the closing screen the person can “Print or save my plan.” It produces a clean one-page keepsake '
      'with their own step, the choices they made through the story, the four reflection questions (which '
      'belief to change · what helps under pressure · what trust looks like · the home we want), the key '
      'messages, and the 1800RESPECT / 000 support line.',
      'It turns the on-screen commitment into something they can keep, put on the fridge, or take to a group '
      'session — reinforcing the pledge and keeping the support line with them.'],
     None),

    ('First-time hint on the interactive tree', 'For Edu & PVAW to note',
     ['coach-mark.png'],
     ['The tree itself is interactive. On the “whole tree” screen the person taps each part — roots, '
      'soil, trunk, branches — to discover it; on the rebuild screens they can drag their chosen card '
      'onto the tree. A gentle one-time hint points to the tree the first time so this is not missed. '
      'It disappears after the first tap or drag and does not come back.',
      'Clicking or tapping always works on its own — the hint and the drag are enhancements, never the '
      'only way through (so it stays simple for every literacy and ability level).'],
     None),

    ('Facilitator / group-delivery mode', 'For Edu to review',
     ['facilitator.png'],
     ['When the activity is opened in facilitator mode (a special link), a discussion prompt appears at the '
      'bottom of each screen — for example, “Invite the group: what pressures do people face when they first '
      'arrive in a new country?” — plus a “Reset for next participant” button. This supports classroom and '
      'group delivery alongside self-paced use.',
      'These prompts are facilitation guidance only. They are kept entirely separate from the approved '
      'learner content and never appear in the normal self-paced activity.'],
     'For your sign-off: please review the discussion prompts (one per phase).'),

    ('Community-language ready', 'For Edu & PVAW to guide',
     None,
     ['The activity is now built to be delivered in community languages. English remains the source, and a '
      'language menu appears automatically once a translated language is added. Right-to-left scripts '
      '(e.g. Arabic, Dari, Farsi) are supported.',
      'Because this is family-violence prevention content, translations will be done by qualified '
      'translators and re-checked with Edu/PVAW before any language is switched on — we will not '
      'machine-translate and publish. A ready-to-fill translation template can be generated on request.'],
     'For your guidance: which community languages should we prioritise first?'),

    ('Accessibility (WCAG 2.1 AA)', 'For the Digital team',
     None,
     ['The activity now meets common accessibility requirements: the tree illustration has a written '
      'description for screen-reader users, each new screen is announced, headings and keyboard operation '
      'are in place (including selecting the tree parts by keyboard), text contrast was lifted, and all '
      'motion respects the “reduce motion” setting. Clicking or tapping always works — dragging is only ever '
      'an enhancement.'],
     None),

    ('Works offline and installable', 'For the Digital team',
     None,
     ['The activity can be “installed” to a phone or tablet home screen and continues to work with no or '
      'patchy internet — useful for community and shared devices. It still makes no external calls and loads '
      'no outside content, so the existing privacy and security posture is unchanged.'],
     None),

    ('Statistics now cited, with a verification tracker', 'For PVAW to confirm',
     None,
     ['The three figures on the “Bigger than one family” screen now each show their source (AIHW 2018; '
      'PM&C 2023; ABS 2021). A short tracking document lists each figure, its source link, and any wording '
      'caveat — for example, the well-known “one woman a week” figure draws on 2012–14 data and should not '
      'be read as a single recent year.'],
     'For your sign-off: please confirm each figure, its timeframe and wording before public launch.'),

    ('A built-in content safeguard', 'For the team',
     None,
     ['An automated check now guards the pedagogy rules every time the content is updated — for example, that '
      'all three outcomes stay reachable, that a harmful choice can never “heal” the tree, that the damaged '
      'outcome is always reversible, that the support line stays on every screen, and that any statistic keeps '
      'its citation. This protects the Edu/PVAW/Digital sign-offs from being broken by accident in future edits.'],
     None),
]


# Changes made in the PAG feedback round (August 2026), for the change log (Word doc) and a
# "What changed" summary slide in the screen-designs deck. Each section: (heading, [ (change, source) ]).
CHANGES = [
    ('Structural', [
        ('The two pressure screens (“migration” and “loss of status”) are combined into one '
         '“Two big pressures” screen, shown together, ending with “Orion is not sure where to go, '
         'and he has a choice to make.”', 'PAG decision'),
    ]),
    ('Screen wording & content', [
        ('Money worries — reframed as structural barriers, not personal failure: Orion is an engineer, but '
         'his overseas qualifications are not recognised, employers want local experience he has not had a '
         'chance to get, and he has few contacts — named as barriers common for new arrivals (from Ali’s list).', 'Ali'),
        ('A changing role — “head of the family” changed to “his role in the family is changing.”', 'PAG'),
        ('The behaviour screen — added a line that the options are realistic but unhealthy (not “correct” '
         'answers), and that seeing their impact helps us understand, not judge.', 'Ali'),
        ('“Who feels it?” — retitled “Family experiences.”', 'PAG'),
        ('Family experiences — stronger spotlight that the family’s reactions are caused by Orion’s '
         'behaviour (not their fault, not the pressure), and that behaviour can be changed.', 'Anu'),
        ('The belief screen — two more beliefs added: “People expect men like me to be strong and in '
         'control,” and “Men shouldn’t ask for help — private problems should stay private.”', 'Ali'),
        ('Orion’s rebuild action — reworded, and now includes “make the big decisions together while '
         'still taking responsibility.”', 'Ali'),
        ('The family feels the change — added the benefits of healthier choices (calmer, more confident, '
         'less stress, closer family).', 'PAG'),
        ('A tree that is healing — added “even small steps make a real difference.”', 'PAG'),
        ('“He digs in” — reworded to the clearer “He holds on to the old ways.”', 'PAG'),
        ('“What we learn” — the four reflection questions were revised.', 'PAG'),
        ('The leadership pledge — renamed “One step you will take” and made time-bound '
         '(“This month, I will…”).', 'PAG'),
        ('The welcome / opening text was trimmed for readability.', 'PAG'),
    ]),
    ('Framing — kept focused on Orion', [
        ('Removed the “you as a community leader” framing throughout. The rebuild is now “Help Orion '
         'rebuild,” and the closing step is personal (“One step you will take”).', 'Ali'),
    ]),
    ('Sound', [
        ('Added gentle outcome cues — a soft rising sound for healthier choices, and a soft falling '
         'sound for less-healthy ones. Kept quiet and unobtrusive.', 'PAG (Victor / Ali)'),
    ]),
    ('Removed', [
        ('The optional “how ready do you feel to lead?” readiness question on the welcome screen '
         '(and its before/after at the end).', 'Ali'),
    ]),
    ('Screen visuals', [
        ('Thought bubbles used more (Ali): the “Two big pressures” and behaviour screens now show a '
         'combined bubble — the money worry and the family together — so the two pressures read at a '
         'glance.', 'Ali'),
        ('“A changing role” now shows Orion smaller than his wife and children in his thought bubble — '
         'how he pictures his standing shrinking (this is also the visual support for “loss of status”).', 'Ali'),
        ('The stress cloud above Orion was made more prominent — bigger and darker, with faint rain when '
         'he is most stressed (still no lightning).', 'PAG'),
        ('The healthy choices are now shown as a picture too (Ali, S13): the rebuild-action screen has a '
         'thought bubble of two people working things out together over a shared plan.', 'Ali'),
    ]),
    ('Optional / future polish', [
        ('Optional standalone icons for lower-English readers (the concrete thought bubbles already carry '
         'the meaning); richer per-option artwork for the rebuild choices.', 'PAG / Ali'),
    ]),
    ('Still to come — future versions', [
        ('Let players enter their own challenges / lived experiences, and a space to share experiences; '
         'character customisation.', 'PAG / Ali'),
    ]),
]
