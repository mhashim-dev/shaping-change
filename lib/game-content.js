/* lib/game-content.js — "Power, Pressure & Choice" (Migration Pressure edition)
   Built to the Edu team's final Game Blueprint. Simple English (EAL). Two phases:

     PHASE 1 — Experience the Problem: follow Orion.
       pressure -> behaviour -> impact -> belief -> root  (the tree declines).
     PHASE 2 — Rebuild the Outcome: the player becomes the leader.
       attitude -> behaviour -> impact -> outcome, then key messages,
       a leadership pledge, and support / next steps  (the tree heals).

   Node fields:
     type: 'intro' | 'story' | 'pick' | 'commit' | 'ending'
     For 'story'/'intro': next, kind, fx, btn (+ optional altNext/altBtn, showLegend, display)
     For 'pick': options[{label, kind, next, fx, info}]
     kind: 'healthy' | 'harmful' | 'neutral'  — drives consequence, NOT appearance.
     fx: { health, mood?, palette?, density?, shed? }

   PEDAGOGY GUARDRAILS (do not "fix" these):
   - Understanding patterns, not blaming individuals or culture.
   - The pressures (roots) and the impacts (branches) are never a "wrong answer".
   - Harmful behaviour never heals the tree; help-seeking always heals.
   - No outcome is caused by the pressure itself — outcomes follow the REBUILD choices.
   - The 1800RESPECT / 000 support line shows on every screen. No shame language.
   - The "Damaged" outcome is always reversible — it offers "Go back and rebuild".
*/

export const STEPS = [
  // ---------------- PHASE 1 — EXPERIENCE THE PROBLEM ----------------

  {
    id: 'welcome', type: 'intro', phase: 'Meet', tag: 'Welcome',
    prompt: 'Shaping Change',
    hint: 'Building strong roots for safety.\n\nThis is a short, reflective activity about safe and respectful homes.\n\nStarting again in a new country changes many things — work, language, culture, and family roles. It brings hope, and also real stress. You will follow Orion’s story and make a few choices, and a tree grows with the story to show how pressures, beliefs and choices shape family life.\n\nThere are no right or wrong answers, and no blame — this is about understanding patterns, not blaming people or cultures.\n\nWhat to expect:\n•  About 10–15 minutes, at your own pace\n•  Simple English\n•  Works on any device\n•  Private — your answers stay on your device',
    btn: 'Begin',
    options: [
      { label: 'Begin', kind: 'neutral', next: 'intro', fx: { health: 0 }, info: '' }
    ]
  },

  {
    id: 'intro', type: 'intro', phase: 'Meet', tag: 'Welcome',
    prompt: 'Meet Orion',
    hint: 'Meet Orion. He arrived in Australia in 2023. Back home, he was a respected community leader — people came to him for help. Now he is starting again.\n\nFollow his story, and help him make better choices.',
    btn: 'Start the story',
    options: [
      { label: 'Start the story', kind: 'neutral', next: 'pressure_money', fx: { health: 0 }, info: '' }
    ]
  },

  {
    id: 'pressure_money', think: 'money', type: 'story', phase: 'Pressure',
    tag: 'Phase 1 · The pressure builds',
    prompt: 'Money worries',
    hint: 'Back home, Orion trained and worked as an engineer.\nHere, the doors keep closing: his overseas qualifications are not recognised, employers want local experience he has not had a chance to get, and he has few contacts to help him find work.\nThese barriers are common for new arrivals — they are not his fault. Orion is trying hard, but money is tight, and he worries every day.',
    btn: 'Continue',
    kind: 'neutral', fx: { health: -7 }, next: 'pressure_role'
  },

  {
    id: 'pressure_role', think: 'family_role', type: 'story', phase: 'Pressure',
    tag: 'Phase 1 · The pressure builds',
    prompt: 'A changing role',
    hint: 'His wife wants to study and find work. His children want to choose their own paths.\nHe no longer feels that his family members respect him or listen to him. He feels his role in the family is changing.\nHe feels unheard and unsure.',
    btn: 'Continue',
    kind: 'neutral', fx: { health: -7 }, next: 'pressures_two'
  },

  // The "two big pressures" shown together on one screen (PAG request): both pressures
  // sit side by side as thought bubbles — migration pressure and loss of status.
  {
    id: 'pressures_two', think: 'pressures', type: 'story', phase: 'Pressure',
    tag: 'Phase 1 · Two big pressures',
    prompt: 'Two big pressures',
    hint: 'Orion is facing two big pressures that many new arrivals know.\n\nOne is migration pressure — a new language, hard to find work, and few social connections.\nThe other is loss of status — back home he was respected and led others; here he can feel unseen, like starting from zero.\n\nThese pressures are not his fault, but they shape how he feels and acts. Orion is not sure where to go, and he has a choice to make.',
    btn: 'Continue',
    kind: 'neutral', fx: { health: -4 }, next: 'behaviour'
  },

  {
    id: 'behaviour', think: 'pressures', type: 'pick', phase: 'Behaviour',
    tag: 'Phase 1 · What does he do?',
    prompt: 'The pressure is heavy. What does Orion do?',
    hint: 'There is no perfect answer. These are realistic — but unhealthy — ways a person under stress can act. Choosing one does not make it right; seeing what it does to the family helps us understand, not judge.',
    btn: 'See what happens',
    options: [
      { label: 'Take tight control of the money and the decisions', kind: 'harmful', next: 'impact', fx: { mood: 'overcast', shed: 2, health: -18 }, info: 'Orion’s reasoning: he has always been the main decision-maker and believes leading the family is his job as a man. It is the one area of life where he still feels in control, and he believes he knows best how to manage the money.\nBut his family starts to feel unheard — understanding why does not make it okay.' },
      { label: 'Go quiet and pull away from the family', kind: 'harmful', next: 'impact', fx: { mood: 'overcast', shed: 2, health: -18 }, info: 'Orion’s reasoning: he believes talking about feelings is weak, and he struggles to put his emotions into words or to ask for help. He is frustrated with himself, and tells himself that pulling away protects the family.\nBut the people closest to him feel the cold.' },
      { label: 'Let the stress come out as anger and blame', kind: 'harmful', next: 'impact', fx: { mood: 'overcast', shed: 3, health: -20 }, info: 'Orion’s reasoning: he is angry with himself and the world around him. Home is the one place he feels able to let his feelings out — and anger is the emotion he knows best.\nBut stress with no safe outlet lands on the family. Naming this is the first step to changing it.' }
    ]
  },

  {
    id: 'impact', think: 'family_sad', type: 'story', phase: 'Impact',
    tag: 'Phase 1 · The impact',
    prompt: 'Family experiences',
    hint: 'His partner feels stressed and not heard. The children feel worried, grow quiet, and pull away.\nThis is a response to Orion’s behaviour — his own actions are shaping how his family feels. It is not their fault, and not the pressure itself.\nHe does not fully see it yet. But behaviour can be changed — and that is where the story can turn.',
    btn: 'Continue',
    kind: 'neutral', fx: { mood: 'overcast', shed: 2, health: -11 }, next: 'belief'
  },

  {
    id: 'belief', type: 'pick', phase: 'Belief',
    tag: 'Phase 1 · The belief behind it',
    prompt: 'What belief might sit behind this?',
    hint: 'Beliefs shape how we act under pressure. The pressures stay the same — but the belief behind our choices shapes how we respond. Which one fits best? There is no wrong choice.',
    btn: 'Reflect',
    options: [
      { label: '“As the father, it is my job to lead and decide.”', kind: 'neutral', next: 'root', fx: { health: 0 }, info: 'This belief can turn stress into a need for control over others.' },
      { label: '“If I don’t stay in control, things will fall apart.”', kind: 'neutral', next: 'root', fx: { health: 0 }, info: 'This belief makes it hard to share or to ask for help.' },
      { label: '“Respect means being listened to and obeyed.”', kind: 'neutral', next: 'root', fx: { health: 0 }, info: 'This belief can make sharing power feel like a loss.' },
      { label: '“People expect men like me to be strong and in control.”', kind: 'neutral', next: 'root', fx: { health: 0 }, info: 'This belief can make it hard to show feelings or share the load.' },
      { label: '“Men shouldn’t ask for help — private problems should stay private.”', kind: 'neutral', next: 'root', fx: { health: 0 }, info: 'This belief makes it hard to reach out. Asking for help is a strength, not a weakness.' }
    ]
  },

  {
    id: 'root', explore: true, type: 'story', phase: 'Root',
    tag: 'Phase 1 · The root cause',
    prompt: 'The whole tree',
    hint: 'Deep down are two big pressures: migration stress and loss of status.\nSince 2023: a new language, no work, few connections. He was a leader; now he feels unseen.\n\nThink of a tree. The roots are life pressures. The soil is beliefs. The trunk is behaviour. The branches are the impact on family.\nOur values and beliefs shape how we think, which shapes how we act, which affects the people around us. To make change, we look at the whole tree. We can keep our values and show them in a healthier way — not just change the behaviour.',
    btn: 'Now, help him rebuild',
    kind: 'neutral', fx: { mood: 'overcast', health: -4 }, next: 'rebuild_intro',
    showLegend: true
  },

  // ---------------- PHASE 2 — REBUILD THE OUTCOME ----------------

  {
    id: 'rebuild_intro', type: 'story', phase: 'Rebuild',
    tag: 'Phase 2 · Rebuild the tree',
    prompt: 'Help Orion rebuild',
    hint: 'Now, help Orion rebuild.\nThe same pressures are still there. But new beliefs and new actions can grow a healthier tree.\nLet’s rebuild it, step by step.',
    btn: 'Choose a belief',
    kind: 'neutral', fx: { health: 0 }, next: 'attitude'
  },

  {
    id: 'attitude', drop: 'soil', type: 'pick', phase: 'Rebuild',
    tag: 'Phase 2 · Soil · The belief',
    prompt: 'What belief would help most?',
    hint: 'The soil feeds the tree. A healthier belief helps everything grow.',
    btn: 'Feed the soil',
    options: [
      { label: '“Respect is earned through trust, not control — I need to respect my family’s views and really listen too.”', kind: 'healthy', next: 'behaviour_good', fx: { mood: 'noon', health: 18 }, info: 'New belief: strong leaders build trust, not fear.' },
      { label: '“My worth is more than my job or my authority.”', kind: 'healthy', next: 'behaviour_good', fx: { mood: 'noon', health: 18 }, info: 'New belief: your value is not only your status or your work.' },
      { label: '“As a father, I want my children to feel safe sharing their feelings with me — not scared.”', kind: 'healthy', next: 'behaviour_good', fx: { mood: 'noon', health: 18 }, info: 'New belief: a safe home is one where everyone can speak freely.' },
      { label: '“I can stay in charge, as long as I am fair.”', kind: 'neutral', next: 'behaviour_good', fx: { health: -2 }, info: 'Being fair is good. But staying “in charge” alone can still leave others unheard. Sharing power works better.' }
    ]
  },

  {
    id: 'behaviour_good', think: 'talk_together', drop: 'trunk', type: 'pick', phase: 'Rebuild',
    tag: 'Phase 2 · Trunk · The action',
    prompt: 'What action should Orion take?',
    hint: 'The trunk is what people see. Choose the action Orion takes.',
    btn: 'Grow the trunk',
    options: [
      { label: 'Make the big decisions together with his wife, while still taking responsibility', kind: 'healthy', next: 'impact_good', fx: { health: 22 }, info: 'Shared power builds safety and trust. Respect is not control.' },
      { label: 'Ask for help — English classes, job support, counselling', kind: 'healthy', next: 'impact_good', fx: { health: 22 }, info: 'Asking for help is a strength, not a weakness.' },
      { label: 'Keep control, but try to be kinder about it', kind: 'neutral', next: 'impact_good', fx: { health: -4 }, info: 'Kindness helps. But keeping all the power to himself does not really heal the tree. Sharing it does.' }
    ]
  },

  {
    id: 'impact_good', think: 'family_happy', type: 'story', phase: 'Rebuild',
    tag: 'Phase 2 · Branches · The impact',
    prompt: 'The family feels the change',
    hint: 'When Orion shares power and asks for help, the family feels it.\nHis partner feels respected and can follow her goals.\nThe children feel safe and open up.\nOrion feels calmer and more confident, less alone — closer to his family, and less weighed down by stress.',
    btn: 'See the outcome',
    kind: 'healthy', fx: { mood: 'golden', health: 18 }, next: 'RESOLVE_OUTCOME'
  },

  // ---- the three outcomes (chosen by the rebuild choices, not the pressure) ----

  {
    id: 'outcome_healthy', type: 'story', phase: 'Outcome', tone: 'healthy',
    tag: 'The outcome', prompt: 'A healthy tree',
    hint: 'Over time, Orion changed how he responds.\nCommunication became open and respectful. Decisions were shared. The home felt calmer and safer.\nThe pressures did not disappear — but he learned to face them with support.',
    btn: 'Key messages',
    kind: 'neutral', fx: { health: 0 }, next: 'takeaways',
    display: { stage: 5, palette: 'spring', mood: 'golden', density: 1.4, health: 100 }
  },

  {
    id: 'outcome_mixed', type: 'story', phase: 'Outcome', tone: 'mixed',
    tag: 'The outcome', prompt: 'A tree that is healing',
    hint: 'Some things got better, and some strain remains.\nA few choices kept the power with Orion alone. But he is trying, and the tree is greener than before.\nChange is a journey — even small steps make a real difference. Positive change does not need big actions.',
    btn: 'Key messages',
    kind: 'neutral', fx: { health: 0 }, next: 'takeaways',
    altBtn: 'Go back and rebuild', altNext: 'rebuild_intro',
    // health 78: visibly GREENER than before (matches "a tree that is healing"), but below the
    // fruiting threshold (~0.81) and less full than the healthy outcome (100) so the three stay distinct
    display: { stage: 5, palette: 'spring', mood: 'noon', density: 1.25, health: 78 }
  },

  {
    id: 'outcome_damaged', type: 'story', phase: 'Outcome', tone: 'damaged',
    tag: 'The outcome', prompt: 'A tree under strain',
    hint: 'The old patterns held on, and the family still feels the strain.\nThis is a warning, not the end.\nHe can change course now — or hold on to the old ways.',
    btn: 'Go back and rebuild',
    kind: 'neutral', fx: { health: 0 }, next: 'rebuild_intro',
    altBtn: 'But he holds on →', altNext: 'insist_1',
    display: { stage: 5, palette: 'spring', mood: 'overcast', density: 1.0, health: 18, shed: 4 }
  },

  // ---- the escalating negative pathway: repeated poor choices show up as escalating
  //      NON-PHYSICAL harmful behaviours (per Ali/PVAW — internal drivers, NOT an external
  //      "spark"/lightning), and the tree keeps declining. Reversible at every step.
  //      Orion is shown (tense) so the consequence reads as HIS behaviour. ----
  {
    id: 'insist_1', think: 'family_sad', type: 'story', phase: 'Outcome', tone: 'damaged', alpha: true,
    tag: 'The old pattern holds', prompt: 'He holds on to the old ways',
    hint: 'Orion raises his voice and ends the conversation. “It’s my house — they should follow my rules.”\nThe family grows quiet and pulls further away. The tree loses more of its leaves.',
    btn: 'Go back and rebuild', kind: 'neutral', fx: { health: 0 }, next: 'rebuild_intro',
    altBtn: 'He refuses to listen →', altNext: 'insist_2',
    display: { stage: 5, palette: 'spring', mood: 'overcast', density: 0.9, health: 12, shed: 4 }
  },
  {
    id: 'insist_2', think: 'family_sad', type: 'story', phase: 'Outcome', tone: 'damaged', alpha: true,
    tag: 'The pressure builds', prompt: 'It gets heavier',
    hint: 'He slams the door and walks away from every argument, arms crossed. “I’m only trying to protect them.”\nBut control is not protection. No one feels safe to speak, and branches begin to fall.',
    btn: 'Go back and rebuild', kind: 'neutral', fx: { health: 0 }, next: 'rebuild_intro',
    altBtn: 'He will not back down →', altNext: 'escalation_warning',
    display: { stage: 5, palette: 'spring', mood: 'overcast', density: 0.8, health: 6, shed: 5 }
  },
  {
    id: 'escalation_warning', type: 'story', phase: 'Outcome', tone: 'damaged', alpha: true,
    tag: 'A warning', prompt: 'Where this can lead',
    hint: 'Left unaddressed, these patterns harden — more control, more distance, less safety at home.\nThis is how everyday stress, unmanaged, can grow into harm. This is what we work to prevent.\nIt is never too late to choose a different way.',
    btn: 'Go back and rebuild', kind: 'neutral', fx: { health: 0 }, next: 'rebuild_intro',
    altBtn: 'What this teaches us →', altNext: 'takeaways',
    display: { stage: 5, palette: 'spring', mood: 'overcast', density: 0.7, health: 3, shed: 6 }
  },

  {
    id: 'takeaways', type: 'story', phase: 'Outcome',
    tag: 'Key takeaways', prompt: 'What we learn',
    hint: 'By changing his beliefs, Orion can change his actions — and build a safe, respectful home.\n\nAsk yourself:\n🌱 Which belief is worth changing first?\n🌿 What helps most when the pressure is high?\n🌳 What does trust look like at home?\n🍎 What home do we want for our family?',
    btn: 'Why this matters',
    kind: 'neutral', fx: { health: 0 }, next: 'why_matters'
  },

  {
    id: 'why_matters', type: 'story', phase: 'Outcome',
    tag: 'Why this matters', prompt: 'Bigger than one family',
    hint: 'Orion’s story is one of many. When families are safe, we build safer communities.\nFamily violence is a serious issue in Australia — and understanding the causes helps prevent it.',
    // Stats sit behind a button (opt-in) so they land as understanding, not a shock.
    // Figures + citations confirmed by Ali (PVAW), Jul 2026. BEFORE PUBLIC LAUNCH each
    // figure must be independently source-verified — see docs/STATISTICS_SOURCES.md
    // (checklist + source URLs + wording caveats). Keep this text and that doc in sync.
    reveal: {
      btn: 'Show the numbers',
      text: '• On average, one woman a week was killed by a current or former intimate partner in Australia (AIHW, 2018).\n• Gender-based violence costs Australia $26 billion a year (PM&C, 2023).\n• 1 in 2 women have experienced sexual harassment (ABS, 2021).\n\nMen can lead the change.'
    },
    btn: 'Your turn',
    kind: 'neutral', fx: { health: 0 }, next: 'leadership'
  },

  {
    id: 'leadership', type: 'commit', phase: 'Leadership',
    tag: 'Your next step',
    prompt: 'One step you will take',
    hint: 'Pick one small, real step — or write your own. Try to make it time-bound, for example: “This month, I will…”. Small steps build strong families.',
    btn: 'Commit',
    suggestions: [
      'This month, I will ask for help when I need it',
      'This month, I will share a decision at home',
      'This month, I will listen more to my partner and children',
      'This month, I will join a men’s group or community group',
      'This month, I will talk to someone I trust when things feel hard'
    ],
    options: [
      { label: 'Commit', kind: 'neutral', next: 'support', fx: { health: 0 }, info: '' }
    ]
  },

  {
    id: 'support', type: 'ending', phase: 'Support', endingTone: 'flourishing',
    tag: 'Support & next steps',
    prompt: 'You can keep growing',
    hint: 'Helpful next steps:',
    // left-aligned linked list (see .gsteps). URLs are best-known national resources —
    // confirm/localise before launch (esp. men's groups + community groups by region).
    steps: [
      { label: 'AMES “Stop Violence Against Women” Leadership Course', url: 'https://www.ames.net.au/find-a-course/preventing-violence-against-women-leadership' },
      { label: 'Neighbourhood Houses — English classes, groups and workshops', url: 'https://www.anhca.org/findahousecentre' },
      { label: 'Local men’s groups and peer networks', url: 'https://mensline.org.au' },
      { label: 'Community, faith and cultural groups near you', url: 'https://askizzy.org.au' }
    ],
    options: [
      { label: 'Play again', kind: 'neutral', next: 'intro', info: '' }
    ]
  }
];

/* Progress backbone for the step dots. Every screen maps onto one of these phases. */
export const PHASE_ORDER = ['Meet', 'Pressure', 'Behaviour', 'Impact', 'Belief', 'Root', 'Rebuild', 'Outcome', 'Leadership', 'Support'];

export const SUPPORT_LINE = 'Need to talk? Call 1800RESPECT (1800 737 732). In an emergency, call 000.';

export const KEY_MESSAGES = [
  'Behaviour is shaped by pressure and beliefs',
  'Control can cause harm',
  'Change is possible',
  'A leader listens and values every voice'
];

/* The tree model (revealed at the "Root" screen). */
// `key` matches engine.hitPart() so the player can tap each part of the tree to discover it
export const LEGEND = [
  { key: 'roots',    color: '#6b553b', label: 'Roots — life pressures' },
  { key: 'soil',     color: '#52341c', label: 'Soil — beliefs & attitudes' },
  { key: 'trunk',    color: '#7c5d40', label: 'Trunk — behaviour' },
  { key: 'branches', color: '#7fae4e', label: 'Branches — impact on family' }
];
