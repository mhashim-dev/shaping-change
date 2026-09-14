'use client';

import { useEffect, useRef, useState } from 'react';
import TreeStage from '@/components/TreeStage';
import { createAudioEngine } from '@/lib/audio-engine';
import { STEPS, PHASE_ORDER, SUPPORT_LINE, KEY_MESSAGES, LEGEND } from '@/lib/game-content';
import { translateNode, uiString, availableLanguages, langMeta, facilitatorPrompt, DEFAULT_LANG } from '@/lib/i18n';

const LS_KEY = 'ppc-game-state-v5';   // bumped: combining the two pressure screens removes nodes old saves may point at
const MUTE_KEY = 'ppc-muted';
const LANG_KEY = 'ppc-lang';
const COACH_KEY = 'ppc-coach-v1';   // first-time "the tree is interactive" nudge
const EVAL_KEY = 'ppc-eval-v1';     // optional before/after self-rating (local only)
const FACES = ['😟', '🙁', '😐', '🙂', '😃'];
const BY_ID = STEPS.reduce((m, s) => { m[s.id] = s; return m; }, {});

// engine state captured at ENTRY to each visited node — drives back navigation.
// The story opens on Orion's mature but strained tree (Phase 1), not a seed.
const INITIAL_FRAME = { id: 'welcome', stage: 5, health: 68, palette: 'spring', mood: 'noon', density: 1.2, wrongCount: 0 };
const FRESH = () => ({ id: 'welcome', answers: [], commitment: '', trail: [INITIAL_FRAME] });

const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);
// >0 means "scene fills the window, panel floats over it" (desktop + landscape phone).
// Landscape phones are wide but very short (e.g. iPhone 16 Pro Max landscape is 956px — over
// the 900px breakpoint — yet only ~380–440px tall): the old rule treated them as desktop and
// the side panel collapsed to a tiny scaled sliver. Now they get a wide right-docked panel.
const isLandscapePhone = () => typeof window !== 'undefined'
  && window.innerHeight <= 520 && window.innerWidth > window.innerHeight;
const getSideWidth = () => (isLandscapePhone() || window.innerWidth > 900 ? 452 : 0);
const reducedMotion = () =>
  typeof window !== 'undefined' && window.matchMedia
    ? window.matchMedia('(prefers-reduced-motion: reduce)').matches
    : false;

// render simple-English body text with line breaks (content uses \n between sentences)
const renderText = (s) => String(s == null ? '' : s).split('\n').map((line, i, arr) => (
  <span key={i}>{line}{i < arr.length - 1 ? <br /> : null}</span>
));

// the on-screen text of a node, flattened for the read-aloud (voice-over) button
function spokenText(node, revealText) {
  if (!node) return '';
  const parts = [];
  if (node.prompt) parts.push(node.prompt);
  if (node.hint) parts.push(node.hint);
  if (revealText) parts.push(revealText);
  if (node.type === 'pick' && node.options) node.options.forEach((o) => parts.push(o.label));
  if (node.type === 'ending') KEY_MESSAGES.forEach((m) => parts.push(m));
  return parts.join('. ').replace(/\n/g, ' ').replace(/[🌱🌿🌳🍎•]/g, '').replace(/\s+/g, ' ').trim();
}

// a plain-text alternative to the canvas tree scene, so non-visual users still get the
// meaning the illustration carries (role="img" aria-label on the canvas)
function sceneDescription(node, health) {
  const h = typeof health === 'number' ? health : 68;
  const state = h >= 62 ? 'looks healthy and full of leaves'
    : h >= 38 ? 'looks strained and is losing some leaves'
      : 'is bare and struggling, with fallen branches';
  const withHim = node && node.alpha !== false && node.phase && !['Outcome', 'Leadership', 'Support'].includes(node.phase);
  return `Illustration: a tree in a meadow that ${state}. ` +
    (withHim ? 'Orion stands beside it. ' : '') +
    'The tree is a picture of the story — the text on this screen explains it.';
}

// the whole screen as one plain-text string, pushed to a live region so screen-reader
// users hear each new screen (route-change announcement pattern for a single-view app)
function announceText(node, revealText) {
  if (!node) return '';
  const bits = [];
  if (node.tag) bits.push(node.tag);
  if (node.prompt) bits.push(node.prompt);
  if (node.hint) bits.push(node.hint);
  if (revealText) bits.push(revealText);
  return bits.join('. ').replace(/\n/g, '. ').replace(/\s+/g, ' ').trim();
}

// the reflection prompts from the takeaways screen (the 🌱🌿🌳🍎 lines), reused on the keepsake
function reflectionPrompts(lang) {
  const t = translateNode(BY_ID['takeaways'], lang);
  if (!t || !t.hint) return [];
  return t.hint.split('\n').map((s) => s.trim()).filter((s) => /^[🌱🌿🌳🍎]/.test(s));
}

// the player's own responses through the whole game, for the take-home summary:
// the actual question shown + the exact option they selected
const OUTCOME_IDS = ['outcome_healthy', 'outcome_mixed', 'outcome_damaged'];
function journeySteps(game, lang) {
  return (game.answers || [])
    .filter((a) => a && a.label && BY_ID[a.nodeId])
    .map((a) => { const n = translateNode(BY_ID[a.nodeId], lang); return { q: n.prompt, a: a.label }; });
}
function journeyOutcome(game, lang) {
  for (let i = (game.trail || []).length - 1; i >= 0; i--) {
    const id = game.trail[i] && game.trail[i].id;
    if (OUTCOME_IDS.includes(id)) { const n = translateNode(BY_ID[id], lang); return n ? n.prompt : id; }
  }
  return null;
}

// the Phase-2 rebuild outcome follows the player's REBUILD choices (health), never
// the pressure itself. All three outcomes continue to the key messages, the
// leadership pledge and support — the "Damaged" outcome is always reversible.
function resolveOutcome(health) {
  if (health >= 70) return 'outcome_healthy';
  if (health >= 40) return 'outcome_mixed';
  return 'outcome_damaged';
}

export default function Home() {
  const engineRef = useRef(null);
  const panelRef = useRef(null);
  const audioRef = useRef(null);
  const [game, setGame] = useState(FRESH);
  const [picked, setPicked] = useState(undefined);
  const [settled, setSettled] = useState(true);
  const [sideWidth, setSideWidth] = useState(372);
  const [muted, setMuted] = useState(false);
  const [revealed, setRevealed] = useState(false);   // "Show the numbers" opt-in
  const [speaking, setSpeaking] = useState(false);    // read-aloud active
  const [ttsAvailable, setTtsAvailable] = useState(false);
  const [discovered, setDiscovered] = useState([]);   // tree parts found on the explore screen
  const [dragUI, setDragUI] = useState(null);         // drag-to-place ghost {x,y,over,label}
  const stageApi = useRef(null);                      // { partAt(clientX, clientY) }
  const visitedRef = useRef(new Set());               // screens already read (no re-lock on Back)
  const [lockLeft, setLockLeft] = useState(0);        // seconds until Continue unlocks
  const [lang, setLang] = useState(DEFAULT_LANG);     // chosen language (English source/fallback)
  const languages = availableLanguages();
  const [coachDone, setCoachDone] = useState(true);   // has the interactive-tree nudge been seen?
  const dismissCoach = () => { setCoachDone(true); try { localStorage.setItem(COACH_KEY, '1'); } catch (e) { } };
  const [evalState, setEvalState] = useState({ pre: null, post: null });   // optional self-rating
  const recordEval = (which, val) => setEvalState((s) => {
    const next = { ...s, [which]: val };
    try { localStorage.setItem(EVAL_KEY, JSON.stringify(next)); } catch (e) { }
    return next;
  });
  const facilitator = typeof window !== 'undefined' && /[?&]facilitator=1\b/.test(window.location.search);

  // restore the sound preference; tear the audio engine down on unmount
  useEffect(() => {
    try { if (localStorage.getItem(MUTE_KEY) === '1') setMuted(true); } catch (e) { }
    try { const l = localStorage.getItem(LANG_KEY); if (l && languages.some((x) => x.code === l)) setLang(l); } catch (e) { }
    try { setCoachDone(localStorage.getItem(COACH_KEY) === '1'); } catch (e) { setCoachDone(false); }
    try { const ev = JSON.parse(localStorage.getItem(EVAL_KEY)); if (ev) setEvalState({ pre: ev.pre ?? null, post: ev.post ?? null }); } catch (e) { }
    setTtsAvailable(typeof window !== 'undefined' && 'speechSynthesis' in window);
    // Keep the music alive: browsers suspend the AudioContext when the tab is hidden or the phone
    // locks, and it doesn't come back on its own — resume it when the page returns or on any tap.
    const resume = () => { const a = audioRef.current; if (a && a.resume) { try { a.resume(); } catch (e) { } } };
    const onVis = () => { if (!document.hidden) resume(); };
    document.addEventListener('visibilitychange', onVis);
    window.addEventListener('pointerdown', resume, true);
    return () => {
      document.removeEventListener('visibilitychange', onVis);
      window.removeEventListener('pointerdown', resume, true);
      if (audioRef.current) audioRef.current.destroy();
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) window.speechSynthesis.cancel();
    };
  }, []);

  // reflect the chosen language on <html> (screen readers, hyphenation, RTL scripts)
  useEffect(() => {
    if (typeof document === 'undefined') return;
    const meta = langMeta(lang);
    document.documentElement.lang = lang;
    document.documentElement.dir = meta.dir || 'ltr';
    try { localStorage.setItem(LANG_KEY, lang); } catch (e) { }
  }, [lang]);

  // lazily create + start the audio engine (must happen inside a user gesture)
  const startAudio = () => {
    if (!audioRef.current) {
      audioRef.current = createAudioEngine();
      if (audioRef.current) audioRef.current.setMuted(muted);
    }
    if (audioRef.current) audioRef.current.start();
    return audioRef.current;
  };

  const toggleMute = () => {
    const m = !muted;
    setMuted(m);
    try { localStorage.setItem(MUTE_KEY, m ? '1' : '0'); } catch (e) { }
    if (audioRef.current) audioRef.current.setMuted(m);
    else if (!m) startAudio(); // unmuting before anything played — this click is the gesture
  };

  useEffect(() => {
    const update = () => setSideWidth(getSideWidth());
    update();
    window.addEventListener('resize', update);
    return () => window.removeEventListener('resize', update);
  }, []);

  // Nobody should have to scroll to read the text, so the panel never scrolls: it rests at
  // top:220 (below the sun), grows UPWARD when the text needs more room, and only if the
  // window is still too short does it scale itself down to fit.
  const fitPanel = () => {
    const p = panelRef.current;
    if (!p) return;
    if (p.classList.contains('landing')) { p.style.top = ''; p.style.removeProperty('--pfit'); return; }  // centred card, not the HUD fit
    const h = p.offsetHeight;                       // natural height (transforms don't affect layout)
    const vh = window.innerHeight;
    if (isLandscapePhone()) {                       // wide right-docked panel, vertically centred (see CSS)
      const avail = vh - 12;
      p.style.top = '';                             // CSS positions it at top:50%
      p.style.setProperty('--pfit', h > avail ? Math.max(0.5, avail / h).toFixed(3) : '1');
      return;
    }
    if (window.innerWidth <= 900) {                 // bottom sheet: already anchored low, so only scale
      // portrait: the panel owns a FIXED 60% band (matches min-height:60vh in CSS) so it renders the
      // same size on every screen; landscape: adaptive (short height).
      const avail = (vh >= window.innerWidth) ? vh * 0.60 : vh * 0.72;
      let pfit = h > avail ? Math.max(0.5, avail / h) : 1;
      if (h * pfit > vh - 6) pfit = (vh - 6) / h;   // but NEVER exceed the viewport (short landscape phone)
      p.style.top = '';
      p.style.setProperty('--pfit', pfit.toFixed(3));
      return;
    }
    const top = Math.min(220, Math.max(16, vh - 16 - h));
    const avail = vh - top - 16;
    p.style.top = top + 'px';
    p.style.setProperty('--pfit', h > avail ? Math.max(0.5, avail / h).toFixed(3) : '1');
  };
  useEffect(fitPanel);                              // content height changes with every screen
  useEffect(() => {
    window.addEventListener('resize', fitPanel);
    const refit = setInterval(fitPanel, 400);       // a mid-resize measure can be stale; re-fit
    return () => { window.removeEventListener('resize', fitPanel); clearInterval(refit); };
  }, []);

  const save = (g) => {
    try { localStorage.setItem(LS_KEY, JSON.stringify(g)); } catch (e) { }
  };

  const applyFrame = (engine, frame, instant) => {
    engine.applyTweaks({ palette: frame.palette, mood: frame.mood, density: frame.density });
    engine.setStage(frame.stage, instant);
    if (engine.setHealth) engine.setHealth(typeof frame.health === 'number' ? frame.health : 100, instant);
  };

  const handleEngine = (engine) => {
    engineRef.current = engine;
    let g = FRESH();
    try {
      const saved = JSON.parse(localStorage.getItem(LS_KEY));
      if (saved && Array.isArray(saved.trail) && saved.trail.length && BY_ID[saved.id]) {
        g = { id: saved.id, answers: saved.answers || [], commitment: saved.commitment || '', trail: saved.trail };
      }
    } catch (e) { }
    applyFrame(engine, g.trail[g.trail.length - 1], true);
    const n0 = BY_ID[g.id];
    const pi0 = PHASE_ORDER.indexOf(n0.phase);
    if (engine.setAlpha) engine.setAlpha(typeof n0.alpha === 'boolean' ? n0.alpha : (pi0 >= 0 && pi0 <= 6));
    if (engine.setThought) engine.setThought(n0.think);
    engine.renderNow();
    setGame(g);
    setPicked(undefined);
  };

  useEffect(() => {
    const poll = setInterval(() => {
      const engine = engineRef.current;
      if (engine) setSettled(engine.isSettled());
    }, 200);
    return () => clearInterval(poll);
  }, []);

  const current = BY_ID[game.id];
  // DISPLAY copy in the chosen language (English is the source + fallback). Logic fields
  // (next/fx/kind/type/…) are preserved, so `view` is safe to use for navigation too.
  const view = translateNode(current, lang);

  // read-lock removed (user request): Continue is available immediately — no countdown timer.
  useEffect(() => { setLockLeft(0); }, [game.id]);

  // reset the per-screen "Show the numbers" reveal + cancel any read-aloud on a screen change
  useEffect(() => {
    setRevealed(false);
    setDiscovered([]);
    setDragUI(null);
    { const e0 = engineRef.current; if (e0 && e0.setHighlight) e0.setHighlight(null); }
    if (ttsAvailable) { window.speechSynthesis.cancel(); setSpeaking(false); }
    // Orion shows through the story (Meet → Rebuild) + the escalation (nodes with alpha:true),
    // hidden on the outcome tableaux / wrap-up
    const eng = engineRef.current;
    if (eng && eng.setAlpha) {
      const pi = PHASE_ORDER.indexOf(current.phase);
      eng.setAlpha(typeof current.alpha === 'boolean' ? current.alpha : (pi >= 0 && pi <= 6));
      if (eng.setThought) eng.setThought(current.think);
      // no walk-in: he is standing there from the first frame — he just waves hello on the welcome screen
      if (game.id === 'welcome' && game.trail.length === 1 && eng.wave && !reducedMotion()) eng.wave();
    }
    // background music follows the story's mood (happy / neutral / sad)
    const fr = game.trail[game.trail.length - 1] || {};
    const hp = typeof fr.health === 'number' ? fr.health : 68;
    const au2 = audioRef.current;
    if (au2 && au2.setMood) au2.setMood(hp >= 62 ? 'bright' : hp >= 38 ? 'soft' : 'low');
  }, [game.id, ttsAvailable]);

  // ---- interacting with the tree itself ----
  const discover = (key) => {
    if (!key) return;
    setDiscovered((d) => (d.includes(key) ? d : [...d, key]));
  };

  // pointer over/into the canvas: highlight parts, and tap to discover on the explore screen
  const handleCanvasPointer = (type, part) => {
    const eng = engineRef.current;
    if (type === 'down' && !coachDone) dismissCoach();   // they found the tree is interactive
    if (type === 'leave') { if (eng && eng.setHighlight) eng.setHighlight(null); return; }
    if (!current.explore) return;
    if (eng && eng.setHighlight) eng.setHighlight(part);
    if (type === 'down' && part) discover(part);
  };

  // drag an option onto the tree (soil / trunk). Clicking a pill still works — the drag
  // is an enhancement, never the only route (keyboard + tap must keep working, WCAG AA).
  const startDrag = (i, ev) => {
    if (!current.drop) return;
    ev.preventDefault();
    const label = translateNode(current, lang).options[i].label;
    const setHL = (v) => { const e = engineRef.current; if (e && e.setHighlight) e.setHighlight(v); };
    const partAt = (e) => (stageApi.current ? stageApi.current.partAt(e.clientX, e.clientY) : null);
    // roots aren't a pickable target on the soil-drop screen, and they sit right where a
    // player naturally aims (near the trunk base) — so a "roots" hit there should still count
    // as a soil drop, rather than silently rejecting it (team feedback).
    const matchesDrop = (part) => part === current.drop || (current.drop === 'soil' && part === 'roots');
    setHL(current.drop);
    setDragUI({ x: ev.clientX, y: ev.clientY, over: false, label });
    const move = (e) => {
      const over = matchesDrop(partAt(e));
      setDragUI({ x: e.clientX, y: e.clientY, over, label });
    };
    const up = (e) => {
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerup', up);
      const dropped = matchesDrop(partAt(e));
      setHL(null);
      setDragUI(null);
      if (dropped) {
        setPicked(i);
        const e2 = engineRef.current;
        // only a genuinely HEALTHY choice waters the soil — a neutral pick still advances
        // the story, but shouldn't get the same positive reinforcement as a healthy one
        if (e2 && current.drop === 'soil' && current.options[i].kind === 'healthy' && e2.pulseWater) e2.pulseWater();
      }
    };
    window.addEventListener('pointermove', move);
    window.addEventListener('pointerup', up);
  };

  // read the current screen's text aloud (browser text-to-speech) — off by default
  const toggleSpeak = () => {
    if (!ttsAvailable) return;
    const synth = window.speechSynthesis;
    if (synth.speaking || speaking) { synth.cancel(); setSpeaking(false); return; }
    const text = spokenText(view, view.reveal && revealed ? view.reveal.text : '');
    if (!text) return;
    const u = new SpeechSynthesisUtterance(text);
    // prefer an Australian English voice when the device has one (e.g. Karen on macOS),
    // falling back to UK English — warmer for this audience than the US default
    const vs = synth.getVoices();
    const au = vs.find((v) => /en[-_]AU/i.test(v.lang)) || vs.find((v) => /en[-_]GB/i.test(v.lang));
    if (au) u.voice = au;
    u.rate = 0.92;
    u.onend = () => setSpeaking(false);
    u.onerror = () => setSpeaking(false);
    synth.cancel();
    synth.speak(u);
    setSpeaking(true);
  };

  // a pick/intro/commit choice: move the tree, log the path, navigate the graph
  const choose = (option, idx) => {
    const engine = engineRef.current;
    if (!engine) return;
    const audio = startAudio(); // this click is the user gesture that lets audio play
    const cur = BY_ID[game.id];
    const top = game.trail[game.trail.length - 1];
    const fx = option.fx || {};

    let stage = clamp(top.stage + (option.stageDelta || 0), 0, 5);
    let health = clamp(top.health + (fx.health || 0), 0, 100);
    let palette = fx.palette || top.palette;
    let mood = fx.mood || top.mood;
    let density = typeof fx.density === 'number' ? fx.density : top.density;
    // count wrong (harmful) choices: 1st recolours the leaves, 2nd+ makes them fall
    const wrongCount = (top.wrongCount || 0) + (option.kind === 'harmful' ? 1 : 0);

    const answers = cur.type === 'pick'
      ? [...game.answers, { nodeId: cur.id, optionIndex: idx, label: option.label, kind: option.kind }]
      : game.answers;

    let nextId = option.next;
    if (nextId === 'RESOLVE_OUTCOME') nextId = resolveOutcome(health);
    const nextNode = BY_ID[nextId];

    // an outcome / ending screen sets an absolute tableau rather than a relative nudge
    if (nextNode.display) {
      stage = nextNode.display.stage;
      palette = nextNode.display.palette;
      mood = nextNode.display.mood;
      density = nextNode.display.density;
      if (typeof nextNode.display.health === 'number') health = nextNode.display.health;
    }

    const reduce = reducedMotion();
    engine.applyTweaks({ palette, mood, density });
    engine.setStage(stage);
    if (engine.setHealth) engine.setHealth(health);
    // shed leaves as the tree declines (Phase 1 harm / a strained outcome)
    if (!reduce && fx.shed && engine.dropLeaves) engine.dropLeaves(fx.shed);
    if (!reduce && nextNode.display && nextNode.display.shed && engine.dropLeaves) engine.dropLeaves(nextNode.display.shed);
    // rebuild: healthy choices heal and water the tree
    if (!reduce && option.kind === 'healthy') {
      if (engine.pulseHeal) engine.pulseHeal();
      if (engine.pulseWater) engine.pulseWater();
    }
    // a badly strained tree drops broken branches too, not only leaves
    if (!reduce && engine.shedBranches) {
      if (nextNode.tone === 'damaged') engine.shedBranches(3);
      else if (option.kind === 'harmful' && health < 40) engine.shedBranches(1);
    }

    // soft, non-gamified audio cues
    if (audio) {
      if (nextNode.tone === 'healthy') audio.ending('flourishing');
      else if (nextNode.tone === 'mixed') audio.ending('recovering');
      else if (nextNode.tone === 'damaged') audio.ending('withered');
      else if (nextNode.type === 'ending') audio.ending(nextNode.endingTone);
      else if (option.kind === 'healthy') audio.swell();
      else if (option.kind === 'harmful') audio.hush();
    }

    const frame = { id: nextId, stage, health, palette, mood, density, wrongCount };
    const g = { id: nextId, answers, commitment: game.commitment, trail: [...game.trail, frame] };
    setGame(g); save(g); setPicked(undefined);
  };

  // a 'story' screen (narrative / outcome) advances via its own next pointer,
  // reusing the same engine + navigation logic as a choice (no answer is logged).
  const advanceStory = (node, useAlt) => {
    choose({
      label: node.btn, kind: node.kind || 'neutral',
      next: useAlt ? node.altNext : node.next,
      stageDelta: node.stageDelta || 0, fx: node.fx || {}
    }, 0);
  };

  // re-enter an earlier node, restoring exactly how the scene looked then
  const goBack = () => {
    if (game.trail.length <= 1) return;
    const newTrail = game.trail.slice(0, -1);
    const prev = newTrail[newTrail.length - 1];
    const prevNode = BY_ID[prev.id];
    const answers = prevNode && prevNode.type === 'pick' && game.answers.length
      ? game.answers.slice(0, -1)
      : game.answers;
    const engine = engineRef.current;
    if (engine) applyFrame(engine, prev, true);
    const g = { id: prev.id, answers, commitment: game.commitment, trail: newTrail };
    setGame(g); save(g); setPicked(undefined);
  };

  // jump back to a named node (the withered ending's "choose again" → pivot)
  const goBackTo = (targetId) => {
    const ids = game.trail.map((f) => f.id);
    const idx = ids.lastIndexOf(targetId);
    if (idx < 0) return restart();
    const newTrail = game.trail.slice(0, idx + 1);
    const frame = newTrail[newTrail.length - 1];
    const pi = game.answers.findIndex((a) => a.nodeId === targetId);
    const answers = pi >= 0 ? game.answers.slice(0, pi) : game.answers;
    const engine = engineRef.current;
    if (engine) applyFrame(engine, frame, true);
    const g = { id: targetId, answers, commitment: game.commitment, trail: newTrail };
    setGame(g); save(g); setPicked(undefined);
  };

  const restart = () => {
    const engine = engineRef.current;
    const g = FRESH();
    if (engine) { applyFrame(engine, INITIAL_FRAME, true); engine.renderNow(); }
    setGame(g); save(g); setPicked(undefined);
  };

  const onEndingNav = (option) => {
    if (option.next === 'intro') restart();
    else if (option.next && option.next !== game.id) goBackTo(option.next);
  };

  const setCommitment = (text) => {
    const g = { ...game, commitment: text };
    setGame(g); save(g);
  };

  // progress along the fixed phase backbone — stable across branches
  const phaseIndex = PHASE_ORDER.indexOf(current.phase);
  const isEnding = current.type === 'ending';
  const stepLabel =
    current.type === 'intro' ? uiString('welcome', lang)
      : isEnding ? uiString('complete', lang)
        : phaseIndex >= 0 ? uiString('stepOf', lang, { n: phaseIndex + 1, total: PHASE_ORDER.length })
          : '';

  const ready =
    current.type === 'pick' ? picked !== undefined
      : current.type === 'commit' ? game.commitment.trim().length > 0
        : true;

  const recap = game.answers.filter((a) => a && a.label).map((a) => a.label);
  const frameHealth = (() => { const f = game.trail[game.trail.length - 1]; return f && typeof f.health === 'number' ? f.health : 68; })();

  const facilitatorReset = () => {
    try { localStorage.removeItem(EVAL_KEY); } catch (e) { }
    setEvalState({ pre: null, post: null });
    restart();
  };
  const revealText = view.reveal && revealed ? view.reveal.text : '';

  return (
    <main aria-label="Shaping Change — interactive activity" className={current.id === 'welcome' ? 'landing' : undefined}>
      <a className="skip-link" href="#activity-panel">{uiString('skipToActivity', lang)}</a>

      {/* screen-reader announcement of each new screen (visually hidden) */}
      <div className="visually-hidden" role="status" aria-live="polite" aria-atomic="true">
        {announceText(view, revealText)}
      </div>

      <TreeStage
        onEngine={handleEngine}
        apiRef={stageApi}
        onCanvasPointer={handleCanvasPointer}
        sideWidth={sideWidth}
        landing={current.id === 'welcome'}
        ariaLabel={sceneDescription(current, frameHealth)}
        getReserve={() => {
          // measured, not assumed: the panel's on-screen height now varies with the text
          const h = panelRef.current ? panelRef.current.getBoundingClientRect().height : 0;
          if (window.innerWidth <= 900) return (h || window.innerHeight * 0.44) + 20;
          return (h || 250) + 30;
        }}
      />

      {dragUI && (
        <div className={'gdrag' + (dragUI.over ? ' over' : '')} style={{ left: dragUI.x, top: dragUI.y }}>
          {dragUI.label}
        </div>
      )}

      {!coachDone && (current.explore || current.drop) && (
        <div className="gcoach" role="note">
          <span className="g-emoji" aria-hidden="true">{current.drop ? '✋' : '👆'}</span>
          <span>{uiString(current.drop ? 'coachDrop' : 'coachExplore', lang)}</span>
          <button type="button" className="g-x" aria-label={uiString('coachDismiss', lang)} onClick={dismissCoach}>✕</button>
        </div>
      )}

      <section className={'panel fadein' + (current.id === 'welcome' ? ' landing' : '')} key={game.id} ref={panelRef} id="activity-panel" role="region" aria-label="Activity steps">
        <div className="panel-top">
          <div className="gstep">{stepLabel}</div>
          <div className="gdots">
            {PHASE_ORDER.map((p, i) => (
              <span key={p} className={isEnding || i < phaseIndex ? 'on' : i === phaseIndex ? 'now' : ''}></span>
            ))}
          </div>
          <div className="panel-top-right">
            {/* voice-over (read-aloud) removed for now — toggleSpeak/spokenText kept dormant to restore later */}
            <button
              className="gsound"
              type="button"
              onClick={toggleMute}
              aria-label={muted ? 'Turn sound on' : 'Turn sound off'}
              title={muted ? 'Sound off' : 'Sound on'}
            >
              {muted ? '🔇' : '🔊'}
            </button>
            {languages.length > 1 && (
              <select
                className="glang"
                aria-label={uiString('language', lang)}
                value={lang}
                onChange={(e) => setLang(e.target.value)}
              >
                {languages.map((l) => <option key={l.code} value={l.code}>{l.name}</option>)}
              </select>
            )}
            <button className="grestart" type="button" onClick={restart}>{uiString('startOver', lang)}</button>
          </div>
        </div>

        {current.type === 'intro' && (
          <div>
            <h1 className="gtitle">{view.prompt}</h1>
            <p className="ghint" style={{ marginBottom: 10 }}>{renderText(view.hint)}</p>
            <div className="panel-foot">
              <span></span>
              <button className="grow" type="button" disabled={!settled || lockLeft > 0} onClick={() => choose(view.options[0], 0)}>
                {lockLeft > 0 ? view.btn + '  ·  ' + lockLeft : view.btn}
              </button>
            </div>
          </div>
        )}

        {current.type === 'story' && (
          <div>
            <p className="gtag">{view.tag}</p>
            <h1 className="gq">{view.prompt}</h1>
            <p className="ghint">{renderText(view.hint)}</p>
            {current.reveal && (revealed
              ? <p className="ghint" style={{ marginTop: 2 }}>{renderText(view.reveal.text)}</p>
              : <button className="greveal" type="button" onClick={() => setRevealed(true)}>{view.reveal.btn}</button>
            )}
            {current.showLegend && (
              <>
                {current.explore && (
                  <p className="gexplore">
                    {discovered.length < LEGEND.length
                      ? 'Tap each part of the tree to explore it — ' + discovered.length + ' of ' + LEGEND.length + ' found'
                      : 'You found all four parts of the tree.'}
                  </p>
                )}
                <div className="glegend">
                  {LEGEND.map((l) => {
                    const found = !current.explore || discovered.includes(l.key);
                    return (
                      <button
                        key={l.label}
                        type="button"
                        className={found ? '' : 'locked'}
                        aria-label={found ? l.label : ('Find the ' + l.key + ' by selecting the tree')}
                        onClick={() => discover(l.key)}
                        onFocus={() => { const e = engineRef.current; if (e && e.setHighlight) e.setHighlight(l.key); }}
                        onBlur={() => { const e = engineRef.current; if (e && e.setHighlight) e.setHighlight(null); }}
                        onMouseEnter={() => { const e = engineRef.current; if (e && e.setHighlight) e.setHighlight(l.key); }}
                        onMouseLeave={() => { const e = engineRef.current; if (e && e.setHighlight) e.setHighlight(null); }}
                      >
                        <i style={{ background: l.color }}></i>{found ? l.label : 'Select the tree to find this'}
                      </button>
                    );
                  })}
                </div>
              </>
            )}
            <div className="panel-foot">
              <button
                className="gback"
                type="button"
                style={{ visibility: game.trail.length > 1 ? 'visible' : 'hidden' }}
                onClick={goBack}
              >
                &#8592; {uiString('prevStep', lang)}
              </button>
              <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                {current.altNext && (
                  <button className="gback" type="button" disabled={!settled || lockLeft > 0} onClick={() => advanceStory(current, true)}>
                    {view.altBtn}
                  </button>
                )}
                <button className="grow" type="button" disabled={!settled || lockLeft > 0} onClick={() => advanceStory(current, false)}>
                  {lockLeft > 0 ? view.btn + '  ·  ' + lockLeft : view.btn}
                </button>
              </div>
            </div>
          </div>
        )}

        {current.type === 'pick' && (
          <div>
            <p className="gtag">{view.tag}</p>
            <h1 className="gq">{view.prompt}</h1>
            <p className="ghint">{view.hint}</p>
            {current.drop && (
              <p className="gexplore">
                Drag a card onto the {current.drop === 'soil' ? 'soil' : 'trunk'} — or just tap to choose.
              </p>
            )}
            <div className="gpills">
              {view.options.map((opt, i) => (
                <button
                  key={opt.label}
                  type="button"
                  className={'pill' + (picked === i ? ' sel' : '') + (current.drop ? ' draggable' : '')}
                  aria-pressed={picked === i}
                  onPointerDown={(ev) => startDrag(i, ev)}
                  onClick={() => setPicked(i)}
                >
                  {opt.label}
                </button>
              ))}
            </div>
            <p className="ginfo">{picked !== undefined ? view.options[picked].info : ' '}</p>
            <div className="panel-foot">
              <button
                className="gback"
                type="button"
                style={{ visibility: game.trail.length > 2 ? 'visible' : 'hidden' }}
                onClick={goBack}
              >
                &#8592; {uiString('prevStep', lang)}
              </button>
              <button
                className="grow"
                type="button"
                disabled={!ready || !settled}
                onClick={() => choose(view.options[picked], picked)}
              >
                {view.btn}
              </button>
            </div>
          </div>
        )}

        {current.type === 'commit' && (
          <div>
            <p className="gtag">{current.tag}</p>
            <h1 className="gq">{current.prompt}</h1>
            <p className="ghint">{current.hint}</p>
            <textarea
              className="gcommit"
              rows={2}
              maxLength={160}
              placeholder="This month, I will…"
              value={game.commitment}
              onChange={(e) => setCommitment(e.target.value)}
            ></textarea>
            <div className="gchips">
              {(current.suggestions || []).map((s) => (
                <button key={s} type="button" className="chip" onClick={() => setCommitment(s)}>
                  {s}
                </button>
              ))}
            </div>
            <div className="panel-foot">
              <button className="gback" type="button" onClick={goBack}>&#8592; Previous step</button>
              <button
                className="grow"
                type="button"
                disabled={!ready || !settled}
                onClick={() => choose(current.options[0], 0)}
              >
                {current.btn}
              </button>
            </div>
          </div>
        )}

        {isEnding && (
          <div className={'gdone ' + (current.endingTone || '')}>
            <p className="gtag">{view.tag}</p>
            <h1 className="gdone-title">{view.prompt}</h1>
            <p className="ghint" style={{ marginBottom: view.steps ? 4 : 10 }}>{renderText(view.hint)}</p>
            {view.steps && (
              <ul className="gsteps">
                {view.steps.map((s) => (
                  <li key={s.label}>
                    <a href={s.url} target="_blank" rel="noopener noreferrer">{s.label}</a>
                  </li>
                ))}
              </ul>
            )}
            {recap.length > 0 && (
              <p className="grecap">{recap.join('  →  ')}</p>
            )}
            {game.commitment.trim() && (
              <p className="gcommit-echo">&ldquo;{game.commitment.trim()}&rdquo;</p>
            )}
            <div className="gkeys">
              {KEY_MESSAGES.map((m) => (
                <div key={m}><i></i>{m}</div>
              ))}
            </div>
            <div className="gend-actions">
              {view.options.map((opt, i) => (
                <button key={opt.label} type="button" className="grow" onClick={() => onEndingNav(current.options[i])}>
                  {opt.label}
                </button>
              ))}
              <button type="button" className="gkeepsake-btn" onClick={() => window.print()}>
                🖨️ {uiString('printPlan', lang)}
              </button>
            </div>
          </div>
        )}

        <p className="gsupport">{SUPPORT_LINE}</p>
      </section>

      {isEnding && (() => {
        const steps = journeySteps(game, lang);
        const outcome = journeyOutcome(game, lang);
        return (
          <div className="keepsake" aria-hidden="true">
            <div className="k-head">
              <svg className="k-logo" viewBox="0 0 100 100" aria-hidden="true">
                <circle cx="50" cy="40" r="26" fill="#3c7a4a" />
                <circle cx="34" cy="36" r="16" fill="#4f9a5f" />
                <circle cx="66" cy="36" r="16" fill="#4f9a5f" />
                <circle cx="62" cy="32" r="6" fill="#e4574c" />
                <circle cx="40" cy="30" r="5" fill="#e4574c" />
                <rect x="46" y="54" width="8" height="30" rx="3" fill="#7c5d40" />
                <path d="M50 64 L38 76 M50 70 L62 78" stroke="#7c5d40" strokeWidth="5" strokeLinecap="round" fill="none" />
              </svg>
              <div>
                <h1>{uiString('keepsakeTitle', lang)}</h1>
                <p className="k-intro">{uiString('keepsakeIntro', lang)}</p>
              </div>
            </div>
            <p className="k-date">{uiString('keepsakePrepared', lang)} {new Date().toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })}</p>

            {game.commitment.trim() && (
              <>
                <h2>{uiString('keepsakePledge', lang)}</h2>
                <p className="k-pledge">“{game.commitment.trim()}”</p>
              </>
            )}

            {(steps.length > 0 || outcome) && (
              <>
                <h2>{uiString('keepsakeJourney', lang)}</h2>
                <ul className="k-journey">
                  {steps.map((s, i) => (
                    <li key={i}>
                      <span className="k-q">{s.q}</span>
                      <span className="k-a">{s.a}</span>
                    </li>
                  ))}
                  {outcome && <li className="k-led"><span className="k-q">{uiString('keepsakeOutcome', lang)}</span><span className="k-a">{outcome}</span></li>}
                </ul>
              </>
            )}

            <h2>{uiString('keepsakeQuestions', lang)}</h2>
            <ul className="k-qlist">{reflectionPrompts(lang).map((p) => <li key={p}>{p}</li>)}</ul>
            <h2>{uiString('keepsakeRemember', lang)}</h2>
            <ul className="k-mlist">{KEY_MESSAGES.map((m) => <li key={m}>{m}</li>)}</ul>
            <p className="k-support">{SUPPORT_LINE}</p>
            <p className="k-foot">{uiString('keepsakeFoot', lang)}</p>
          </div>
        );
      })()}

      {facilitator && (
        <div className="gfac" role="complementary" aria-label={uiString('facTitle', lang)}>
          <span className="gfac-tag">{uiString('facDiscuss', lang)}</span>
          <span className="gfac-body">{facilitatorPrompt(current.phase)}</span>
          <button type="button" onClick={facilitatorReset}>{uiString('facReset', lang)}</button>
        </div>
      )}
    </main>
  );
}
