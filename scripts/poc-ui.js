/* poc-ui.js — vanilla-JS UI shell for the self-contained proof-of-concept.
   Mirrors app/page.js + components/TreeStage.jsx, but with no framework so the
   whole game runs from a single double-clickable HTML file (file://, offline).
   The tree engine, audio engine and branching content are the real lib files,
   inlined ahead of this script by scripts/build-poc.cjs. */
(function () {
  'use strict';

  var LS_KEY = 'ppc-poc-state-v4', MUTE_KEY = 'ppc-poc-muted', LANG_KEY = 'ppc-lang', COACH_KEY = 'ppc-coach-v1', EVAL_KEY = 'ppc-eval-v1';
  var FACES = ['😟', '🙁', '😐', '🙂', '😃'];
  var facilitator = /[?&]facilitator=1\b/.test(typeof location !== 'undefined' ? location.search : '');
  var BY_ID = {};
  STEPS.forEach(function (s) { BY_ID[s.id] = s; });

  // opens on Orion's mature but strained tree (Phase 1), not a seed
  var INITIAL_FRAME = { id: 'welcome', stage: 5, health: 68, palette: 'spring', mood: 'noon', density: 1.2, wrongCount: 0 };
  function FRESH() { return { id: 'welcome', answers: [], commitment: '', trail: [INITIAL_FRAME] }; }

  function clamp(v, a, b) { return v < a ? a : v > b ? b : v; }
  function reducedMotion() {
    return typeof window !== 'undefined' && window.matchMedia
      ? window.matchMedia('(prefers-reduced-motion: reduce)').matches : false;
  }
  function esc(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  }
  // escape, then keep simple-English line breaks (content uses \n between sentences)
  function escText(s) { return esc(s).replace(/\n/g, '<br>'); }
  // the Phase-2 rebuild outcome follows the rebuild choices (health), never the pressure
  function resolveOutcome(health) {
    if (health >= 70) return 'outcome_healthy';
    if (health >= 40) return 'outcome_mixed';
    return 'outcome_damaged';
  }

  // ---------------- DOM scaffold ----------------
  var skip = document.createElement('a');
  skip.className = 'skip-link'; skip.href = '#activity-panel'; skip.textContent = 'Skip to the activity';
  var announcer = document.createElement('div');   // screen-reader announcement of each new screen
  announcer.className = 'visually-hidden';
  announcer.setAttribute('role', 'status');
  announcer.setAttribute('aria-live', 'polite');
  announcer.setAttribute('aria-atomic', 'true');
  var stageEl = document.createElement('div'); stageEl.className = 'stage';
  var canvas = document.createElement('canvas'); canvas.width = 1600; canvas.height = 900;
  canvas.setAttribute('role', 'img');
  canvas.setAttribute('aria-label', 'Illustration of a tree that reflects the story');
  stageEl.appendChild(canvas);
  var panel = document.createElement('section');
  panel.className = 'panel'; panel.id = 'activity-panel';
  panel.setAttribute('role', 'region'); panel.setAttribute('aria-label', 'Activity steps');
  var keepsake = document.createElement('div');   // print/save-friendly plan (built on the ending)
  keepsake.className = 'keepsake'; keepsake.setAttribute('aria-hidden', 'true');
  var coach = document.createElement('div');       // first-time "the tree is interactive" nudge
  coach.className = 'gcoach'; coach.setAttribute('role', 'note'); coach.style.display = 'none';
  var fac = document.createElement('div');          // facilitator (group-delivery) banner
  fac.className = 'gfac'; fac.setAttribute('role', 'complementary'); fac.style.display = 'none';
  document.body.appendChild(skip);
  document.body.appendChild(announcer);
  document.body.appendChild(stageEl);
  document.body.appendChild(panel);
  document.body.appendChild(keepsake);
  document.body.appendChild(coach);
  document.body.appendChild(fac);

  var coachDone = true;
  try { coachDone = localStorage.getItem(COACH_KEY) === '1'; } catch (e) { coachDone = false; }
  function dismissCoach() { coachDone = true; coach.style.display = 'none'; try { localStorage.setItem(COACH_KEY, '1'); } catch (e) { } }

  var evalState = { pre: null, post: null };
  try { var _ev = JSON.parse(localStorage.getItem(EVAL_KEY)); if (_ev) evalState = { pre: _ev.pre == null ? null : _ev.pre, post: _ev.post == null ? null : _ev.post }; } catch (e) { }
  function recordEval(which, val) { evalState[which] = val; try { localStorage.setItem(EVAL_KEY, JSON.stringify(evalState)); } catch (e) { } render(); }
  // optional self-rating faces (1–5) as an HTML string; `which` = 'pre' | 'post'
  function facilitatorReset() { try { localStorage.removeItem(EVAL_KEY); } catch (e) { } evalState = { pre: null, post: null }; restart(); }

  // reflection prompts from the takeaways screen (the 🌱🌿🌳🍎 lines), reused on the keepsake
  function reflectionPrompts() {
    var t = translateNode(BY_ID['takeaways'], lang);
    if (!t || !t.hint) return [];
    return t.hint.split('\n').map(function (s) { return s.trim(); }).filter(function (s) { return /^[🌱🌿🌳🍎]/.test(s); });
  }
  // the player's own responses through the whole game, for the take-home summary:
  // the actual question shown + the exact option they selected
  var OUTCOME_IDS = ['outcome_healthy', 'outcome_mixed', 'outcome_damaged'];
  function journeySteps() {
    return (game.answers || []).filter(function (a) { return a && a.label && BY_ID[a.nodeId]; })
      .map(function (a) { var n = translateNode(BY_ID[a.nodeId], lang); return { q: n.prompt, a: a.label }; });
  }
  function journeyOutcome() {
    for (var i = (game.trail || []).length - 1; i >= 0; i--) {
      var id = game.trail[i] && game.trail[i].id;
      if (OUTCOME_IDS.indexOf(id) >= 0) { var n = translateNode(BY_ID[id], lang); return n ? n.prompt : id; }
    }
    return null;
  }

  // plain-text alternative to the tree illustration (mirrors sceneDescription in app/page.js)
  function sceneDescription(node, health) {
    var h = typeof health === 'number' ? health : 68;
    var state = h >= 62 ? 'looks healthy and full of leaves'
      : h >= 38 ? 'looks strained and is losing some leaves'
        : 'is bare and struggling, with fallen branches';
    var withHim = node && node.alpha !== false && node.phase && ['Outcome', 'Leadership', 'Support'].indexOf(node.phase) === -1;
    return 'Illustration: a tree in a meadow that ' + state + '. ' +
      (withHim ? 'Orion stands beside it. ' : '') +
      'The tree is a picture of the story — the text on this screen explains it.';
  }
  function announceText(node) {
    if (!node) return '';
    var bits = [];
    if (node.tag) bits.push(node.tag);
    if (node.prompt) bits.push(node.prompt);
    if (node.hint) bits.push(node.hint);
    if (node.reveal && revealed) bits.push(node.reveal.text);
    return bits.join('. ').replace(/\n/g, '. ').replace(/\s+/g, ' ').trim();
  }

  // ---------------- state ----------------
  var engine = createTreeEngine(canvas);
  var audio = null, muted = false, picked, settled = true;
  var revealed = false, speaking = false;
  var ttsOK = (typeof window !== 'undefined' && 'speechSynthesis' in window);
  var game = FRESH();

  // chosen language (English is the source + fallback). Picker shows only when >1 pack.
  var lang = DEFAULT_LANG, langs = availableLanguages();
  try { var _l = localStorage.getItem(LANG_KEY); if (_l && langs.some(function (x) { return x.code === _l; })) lang = _l; } catch (e) { }
  function applyLang() {
    var meta = langMeta(lang);
    try { document.documentElement.lang = lang; document.documentElement.dir = meta.dir || 'ltr'; } catch (e) { }
    try { localStorage.setItem(LANG_KEY, lang); } catch (e) { }
  }
  function setLang(code) { lang = code; applyLang(); render(); }
  applyLang();

  try { if (localStorage.getItem(MUTE_KEY) === '1') muted = true; } catch (e) { }
  try {
    var saved = JSON.parse(localStorage.getItem(LS_KEY));
    if (saved && Array.isArray(saved.trail) && saved.trail.length && BY_ID[saved.id]) {
      game = { id: saved.id, answers: saved.answers || [], commitment: saved.commitment || '', trail: saved.trail };
    }
  } catch (e) { }

  function save() { try { localStorage.setItem(LS_KEY, JSON.stringify(game)); } catch (e) { } }

  // ---------------- audio ----------------
  function startAudio() {
    if (!audio) { audio = createAudioEngine(); if (audio) audio.setMuted(muted); }
    if (audio) audio.start();
    return audio;
  }
  function toggleMute() {
    muted = !muted;
    try { localStorage.setItem(MUTE_KEY, muted ? '1' : '0'); } catch (e) { }
    if (audio) audio.setMuted(muted); else if (!muted) startAudio();
    render();
  }

  // ---------------- read-aloud (voice-over) ----------------
  function spoken(node) {
    if (!node) return '';
    var parts = [];
    if (node.prompt) parts.push(node.prompt);
    if (node.hint) parts.push(node.hint);
    if (node.reveal && revealed) parts.push(node.reveal.text);
    if (node.type === 'pick' && node.options) node.options.forEach(function (o) { parts.push(o.label); });
    if (node.type === 'ending') KEY_MESSAGES.forEach(function (m) { parts.push(m); });
    return parts.join('. ').replace(/\n/g, ' ').replace(/[🌱🌿🌳🍎•]/g, '').replace(/\s+/g, ' ').trim();
  }
  function toggleSpeak() {
    if (!ttsOK) return;
    var synth = window.speechSynthesis;
    if (synth.speaking || speaking) { synth.cancel(); speaking = false; render(); return; }
    var text = spoken(translateNode(BY_ID[game.id], lang));
    if (!text) return;
    var u = new SpeechSynthesisUtterance(text);
    var vs2 = window.speechSynthesis.getVoices();
    var auV = null;
    for (var vi = 0; vi < vs2.length; vi++) { if (/en[-_]AU/i.test(vs2[vi].lang)) { auV = vs2[vi]; break; } }
    if (!auV) { for (var vj = 0; vj < vs2.length; vj++) { if (/en[-_]GB/i.test(vs2[vj].lang)) { auV = vs2[vj]; break; } } }
    if (auV) u.voice = auV;
    u.rate = 0.92;
    u.onend = function () { speaking = false; render(); };
    u.onerror = function () { speaking = false; };
    synth.cancel(); synth.speak(u); speaking = true; render();
  }
  // reset the per-screen reveal + stop any read-aloud when the screen changes
  function resetTransient() {
    revealed = false; speaking = false;
    discovered = []; endDrag();
    if (engine.setHighlight) engine.setHighlight(null);
    if (ttsOK) { try { window.speechSynthesis.cancel(); } catch (e) { } }
  }

  // ---- interacting with the tree itself ----
  var curNode = null;       // module-scope copy of render()'s `current`, for the handlers below
  var lastFadeId = null;    // fade the panel in only when the SCREEN changes, not every render
  // read-lock removed (user request): Continue is available immediately \u2014 no countdown timer.
  var lockLeft = 0, lockTimer = null;
  function startReadLock() { lockLeft = 0; if (lockTimer) { clearInterval(lockTimer); lockTimer = null; } }
  var discovered = [];      // parts found on the explore screen
  var dragGhost = null;     // floating card while dragging

  function partAt(clientX, clientY) {
    if (!engine.hitPart) return null;
    var r = canvas.getBoundingClientRect();
    if (!r.width || !r.height) return null;
    var x = (clientX - r.left) * (1600 / r.width);
    var y = (clientY - r.top) * (900 / r.height);
    if (x < 0 || y < 0 || x > 1600 || y > 900) return null;
    return engine.hitPart(x, y);
  }
  function discover(key) {
    if (!key || discovered.indexOf(key) >= 0) return;
    discovered.push(key); render();
  }
  function endDrag() {
    if (dragGhost && dragGhost.parentNode) dragGhost.parentNode.removeChild(dragGhost);
    dragGhost = null;
  }
  // tapping the tree on the explore screen; hovering highlights any part
  canvas.addEventListener('pointermove', function (ev) {
    if (!curNode || !curNode.explore) return;
    if (engine.setHighlight) engine.setHighlight(partAt(ev.clientX, ev.clientY));
  });
  canvas.addEventListener('pointerdown', function (ev) {
    if (!coachDone) dismissCoach();               // they found the tree is interactive
    if (!curNode || !curNode.explore) return;
    discover(partAt(ev.clientX, ev.clientY));
  });
  canvas.addEventListener('pointerleave', function () {
    if (engine.setHighlight) engine.setHighlight(null);
  });
  // drag an option onto the tree — clicking the card still works (accessibility)
  function startDrag(i, ev) {
    if (!curNode || !curNode.drop) return;
    ev.preventDefault();
    var label = translateNode(curNode, lang).options[i].label;
    if (engine.setHighlight) engine.setHighlight(curNode.drop);
    dragGhost = document.createElement('div');
    dragGhost.className = 'gdrag';
    dragGhost.textContent = label;
    document.body.appendChild(dragGhost);
    var place = function (x, y, over) {
      if (!dragGhost) return;
      dragGhost.style.left = x + 'px'; dragGhost.style.top = y + 'px';
      dragGhost.className = 'gdrag' + (over ? ' over' : '');
    };
    // roots aren't a pickable target on the soil-drop screen, and they sit right where a
    // player naturally aims (near the trunk base) — so a "roots" hit there should still count
    // as a soil drop, rather than silently rejecting it (team feedback).
    var matchesDrop = function (part) { return part === curNode.drop || (curNode.drop === 'soil' && part === 'roots'); };
    place(ev.clientX, ev.clientY, false);
    var move = function (e) { place(e.clientX, e.clientY, matchesDrop(partAt(e.clientX, e.clientY))); };
    var up = function (e) {
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerup', up);
      var dropped = matchesDrop(partAt(e.clientX, e.clientY));
      if (engine.setHighlight) engine.setHighlight(null);
      endDrag();
      if (dropped) {
        picked = i;
        // only a genuinely HEALTHY choice waters the soil — a neutral pick still advances
        // the story, but shouldn't get the same positive reinforcement as a healthy one
        if (curNode.drop === 'soil' && curNode.options[i].kind === 'healthy' && engine.pulseWater) engine.pulseWater();
        render();
      }
    };
    window.addEventListener('pointermove', move);
    window.addEventListener('pointerup', up);
  }

  // ---------------- engine helpers ----------------
  function applyFrame(frame, instant) {
    engine.applyTweaks({ palette: frame.palette, mood: frame.mood, density: frame.density });
    engine.setStage(frame.stage, instant);
    if (engine.setHealth) engine.setHealth(typeof frame.health === 'number' ? frame.health : 100, instant);
  }

  // ---------------- a choice: move the tree, log the path, navigate ----------------
  function choose(option, idx) {
    if (!engine) return;
    resetTransient();
    var au = startAudio(); // this click is the gesture that lets audio play
    var cur = BY_ID[game.id];
    var top = game.trail[game.trail.length - 1];
    var fx = option.fx || {};

    var stage = clamp(top.stage + (option.stageDelta || 0), 0, 5);
    var health = clamp(top.health + (fx.health || 0), 0, 100);
    var palette = fx.palette || top.palette;
    var mood = fx.mood || top.mood;
    var density = typeof fx.density === 'number' ? fx.density : top.density;
    var wrongCount = (top.wrongCount || 0) + (option.kind === 'harmful' ? 1 : 0);

    var answers = cur.type === 'pick'
      ? game.answers.concat([{ nodeId: cur.id, optionIndex: idx, label: option.label, kind: option.kind }])
      : game.answers;

    var nextId = option.next;
    if (nextId === 'RESOLVE_OUTCOME') nextId = resolveOutcome(health);
    var nextNode = BY_ID[nextId];

    if (nextNode.display) {
      stage = nextNode.display.stage;
      palette = nextNode.display.palette;
      mood = nextNode.display.mood;
      density = nextNode.display.density;
      if (typeof nextNode.display.health === 'number') health = nextNode.display.health;
    }

    var reduce = reducedMotion();
    engine.applyTweaks({ palette: palette, mood: mood, density: density });
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
    // a badly strained tree drops broken branches too
    if (!reduce && engine.shedBranches) {
      if (nextNode.tone === 'damaged') engine.shedBranches(3);
      else if (option.kind === 'harmful' && health < 40) engine.shedBranches(1);
    }

    if (au) {
      if (nextNode.tone === 'healthy') au.ending('flourishing');
      else if (nextNode.tone === 'mixed') au.ending('recovering');
      else if (nextNode.tone === 'damaged') au.ending('withered');
      else if (nextNode.type === 'ending') au.ending(nextNode.endingTone);
      else if (option.kind === 'healthy') au.swell();
      else if (option.kind === 'harmful') au.hush();
    }

    var frame = { id: nextId, stage: stage, health: health, palette: palette, mood: mood, density: density, wrongCount: wrongCount };
    game = { id: nextId, answers: answers, commitment: game.commitment, trail: game.trail.concat([frame]) };
    save(); picked = undefined; render();
  }

  // a 'story' screen advances via its own next pointer, reusing choose() (no answer logged)
  function advanceStory(node, useAlt) {
    choose({
      label: node.btn, kind: node.kind || 'neutral',
      next: useAlt ? node.altNext : node.next,
      stageDelta: node.stageDelta || 0, fx: node.fx || {}
    }, 0);
  }

  function goBack() {
    if (game.trail.length <= 1) return;
    resetTransient();
    var newTrail = game.trail.slice(0, -1);
    var prev = newTrail[newTrail.length - 1];
    var prevNode = BY_ID[prev.id];
    var answers = (prevNode && prevNode.type === 'pick' && game.answers.length) ? game.answers.slice(0, -1) : game.answers;
    applyFrame(prev, true);
    game = { id: prev.id, answers: answers, commitment: game.commitment, trail: newTrail };
    save(); picked = undefined; render();
  }

  function goBackTo(targetId) {
    resetTransient();
    var ids = game.trail.map(function (f) { return f.id; });
    var idx = ids.lastIndexOf(targetId);
    if (idx < 0) return restart();
    var newTrail = game.trail.slice(0, idx + 1);
    var frame = newTrail[newTrail.length - 1];
    var pi = game.answers.findIndex(function (a) { return a.nodeId === targetId; });
    var answers = pi >= 0 ? game.answers.slice(0, pi) : game.answers;
    applyFrame(frame, true);
    game = { id: targetId, answers: answers, commitment: game.commitment, trail: newTrail };
    save(); picked = undefined; render();
  }

  function restart() {
    resetTransient();
    game = FRESH();
    applyFrame(INITIAL_FRAME, true);
    if (engine.wave && !reducedMotion()) engine.wave();
    engine.renderNow();
    save(); picked = undefined; render();
  }

  function onEndingNav(option) {
    if (option.next === 'intro') restart();
    else if (option.next && option.next !== game.id) goBackTo(option.next);
  }

  // ---------------- rendering the panel ----------------
  function render() {
    var current = BY_ID[game.id];
    // DISPLAY copy in the chosen language (logic fields preserved — safe for nav too)
    var view = translateNode(current, lang);
    curNode = current;
    if (lastFadeId !== game.id) {
      lastFadeId = game.id;
      startReadLock();
      // the panel card fades in on a screen change
      panel.classList.remove('fadein'); void panel.offsetWidth; panel.classList.add('fadein');
      // background music follows the story's mood
      var fr2 = game.trail[game.trail.length - 1] || {};
      var hp2 = typeof fr2.health === 'number' ? fr2.health : 68;
      if (audio && audio.setMood) audio.setMood(hp2 >= 62 ? 'bright' : hp2 >= 38 ? 'soft' : 'low');
    }
    var phaseIndex = PHASE_ORDER.indexOf(current.phase);
    // Orion appears through the story (Meet → Rebuild) + escalation (nodes with alpha:true)
    if (engine.setAlpha) engine.setAlpha(typeof current.alpha === 'boolean' ? current.alpha : (phaseIndex >= 0 && phaseIndex <= 6));
    if (engine.setThought) engine.setThought(current.think);
    var isEnding = current.type === 'ending';
    var stepLabel = current.type === 'intro' ? uiString('welcome', lang)
      : isEnding ? uiString('complete', lang)
        : phaseIndex >= 0 ? uiString('stepOf', lang, { n: phaseIndex + 1, total: PHASE_ORDER.length }) : '';

    var dots = PHASE_ORDER.map(function (p, i) {
      var cls = (isEnding || i < phaseIndex) ? 'on' : (i === phaseIndex ? 'now' : '');
      return '<span class="' + cls + '"></span>';
    }).join('');

    var html = '' +
      '<div class="panel-top">' +
        '<div class="gstep">' + esc(stepLabel) + '</div>' +
        '<div class="gdots">' + dots + '</div>' +
        '<div class="panel-top-right">' +
          (langs.length > 1 ? '<select class="glang" data-act="lang" aria-label="' + esc(uiString('language', lang)) + '">' +
            langs.map(function (l) { return '<option value="' + esc(l.code) + '"' + (l.code === lang ? ' selected' : '') + '>' + esc(l.name) + '</option>'; }).join('') + '</select>' : '') +
          /* voice-over (read-aloud) removed for now — toggleSpeak/spoken kept dormant to restore later */
          '<button class="gsound" data-act="mute" type="button" title="' + esc(muted ? uiString('soundOff', lang) : uiString('soundOn', lang)) + '">' + (muted ? '🔇' : '🔊') + '</button>' +
          '<button class="grestart" data-act="restart" type="button">' + esc(uiString('startOver', lang)) + '</button>' +
        '</div>' +
      '</div>';

    if (current.type === 'intro') {
      var introExtra = '';
      html += '<div>' +
        '<h1 class="gtitle">' + esc(view.prompt) + '</h1>' +
        '<p class="ghint" style="margin-bottom:10px">' + escText(view.hint) + '</p>' +
        introExtra +
        '<div class="panel-foot"><span></span>' +
          '<button class="grow" data-act="intro" type="button"' + ((settled && lockLeft <= 0) ? '' : ' disabled') + '>' + esc(view.btn) + (lockLeft > 0 ? '  \u00b7  ' + lockLeft : '') + '</button>' +
        '</div>' +
      '</div>';
    } else if (current.type === 'story') {
      var legend2 = '';
      if (current.showLegend) {
        if (current.explore) {
          legend2 += '<p class="gexplore">' + (discovered.length < LEGEND.length
            ? 'Tap each part of the tree to explore it — ' + discovered.length + ' of ' + LEGEND.length + ' found'
            : 'You found all four parts of the tree.') + '</p>';
        }
        legend2 += '<div class="glegend">' + LEGEND.map(function (l) {
          var found = !current.explore || discovered.indexOf(l.key) >= 0;
          return '<button type="button" class="' + (found ? '' : 'locked') + '" data-act="legend" data-k="' + esc(l.key) + '"' +
            ' aria-label="' + esc(found ? l.label : ('Find the ' + l.key + ' by selecting the tree')) + '">' +
            '<i style="background:' + esc(l.color) + '"></i>' +
            (found ? esc(l.label) : 'Select the tree to find this') + '</button>';
        }).join('') + '</div>';
      }
      var altBtn = current.altNext
        ? '<button class="gback" data-act="storyalt" type="button"' + ((settled && lockLeft <= 0) ? '' : ' disabled') + '>' + esc(view.altBtn) + '</button>'
        : '';
      var revealHTML = current.reveal
        ? (revealed
            ? '<p class="ghint" style="margin-top:2px">' + escText(view.reveal.text) + '</p>'
            : '<button class="greveal" data-act="reveal" type="button">' + esc(view.reveal.btn) + '</button>')
        : '';
      html += '<div>' +
        '<p class="gtag">' + esc(view.tag) + '</p>' +
        '<h1 class="gq">' + esc(view.prompt) + '</h1>' +
        '<p class="ghint">' + escText(view.hint) + '</p>' +
        revealHTML +
        legend2 +
        '<div class="panel-foot">' +
          '<button class="gback" data-act="back" type="button" style="visibility:' + (game.trail.length > 1 ? 'visible' : 'hidden') + '">&#8592; ' + esc(uiString('prevStep', lang)) + '</button>' +
          '<div style="display:flex;gap:10px;align-items:center">' + altBtn +
            '<button class="grow" data-act="story" type="button"' + ((settled && lockLeft <= 0) ? '' : ' disabled') + '>' + esc(view.btn) + (lockLeft > 0 ? '  \u00b7  ' + lockLeft : '') + '</button>' +
          '</div>' +
        '</div>' +
      '</div>';
    } else if (current.type === 'pick') {
      var pills = view.options.map(function (opt, i) {
        return '<button type="button" class="pill' + (picked === i ? ' sel' : '') + (current.drop ? ' draggable' : '') + '" data-act="pick" data-i="' + i + '" aria-pressed="' + (picked === i ? 'true' : 'false') + '">' + esc(opt.label) + '</button>';
      }).join('');
      var info = picked !== undefined ? view.options[picked].info : ' ';
      var ready = picked !== undefined;
      html += '<div>' +
        '<p class="gtag">' + esc(view.tag) + '</p>' +
        '<h1 class="gq">' + esc(view.prompt) + '</h1>' +
        '<p class="ghint">' + esc(view.hint) + '</p>' +
        (current.drop ? '<p class="gexplore">Drag a card onto the ' + (current.drop === 'soil' ? 'soil' : 'trunk') + ' — or just tap to choose.</p>' : '') +
        '<div class="gpills">' + pills + '</div>' +
        '<p class="ginfo">' + esc(info) + '</p>' +
        '<div class="panel-foot">' +
          '<button class="gback" data-act="back" type="button" style="visibility:' + (game.trail.length > 2 ? 'visible' : 'hidden') + '">&#8592; ' + esc(uiString('prevStep', lang)) + '</button>' +
          '<button class="grow" data-act="choose" type="button"' + ((!ready || !settled) ? ' disabled' : '') + '>' + esc(view.btn) + '</button>' +
        '</div>' +
      '</div>';
    } else if (current.type === 'commit') {
      var chips = (current.suggestions || []).map(function (s) {
        return '<button type="button" class="chip" data-act="chip" data-v="' + esc(s) + '">' + esc(s) + '</button>';
      }).join('');
      var rdy = game.commitment.trim().length > 0;
      html += '<div>' +
        '<p class="gtag">' + esc(view.tag) + '</p>' +
        '<h1 class="gq">' + esc(view.prompt) + '</h1>' +
        '<p class="ghint">' + esc(view.hint) + '</p>' +
        '<textarea class="gcommit" rows="2" maxlength="160" placeholder="This month, I will…">' + esc(game.commitment) + '</textarea>' +
        '<div class="gchips">' + chips + '</div>' +
        '<div class="panel-foot">' +
          '<button class="gback" data-act="back" type="button">&#8592; ' + esc(uiString('prevStep', lang)) + '</button>' +
          '<button class="grow" data-act="commit" type="button"' + ((!rdy || !settled) ? ' disabled' : '') + '>' + esc(view.btn) + '</button>' +
        '</div>' +
      '</div>';
    } else if (isEnding) {
      var recap = game.answers.filter(function (a) { return a && a.label; }).map(function (a) { return esc(a.label); });
      var keys = KEY_MESSAGES.map(function (m) { return '<div><i></i>' + esc(m) + '</div>'; }).join('');
      var actions = view.options.map(function (opt, i) {
        return '<button type="button" class="grow" data-act="endnav" data-i="' + i + '">' + esc(opt.label) + '</button>';
      }).join('');
      actions += '<button type="button" class="gkeepsake-btn" data-act="print">🖨️ ' + esc(uiString('printPlan', lang)) + '</button>';
      var stepsHTML = view.steps ? '<ul class="gsteps">' + view.steps.map(function (st) {
        return '<li><a href="' + esc(st.url) + '" target="_blank" rel="noopener noreferrer">' + esc(st.label) + '</a></li>';
      }).join('') + '</ul>' : '';
      html += '<div class="gdone ' + esc(current.endingTone || '') + '">' +
        '<p class="gtag">' + esc(view.tag) + '</p>' +
        '<h1 class="gdone-title">' + esc(view.prompt) + '</h1>' +
        '<p class="ghint" style="margin-bottom:' + (view.steps ? '4' : '10') + 'px">' + escText(view.hint) + '</p>' +
        stepsHTML +
        (recap.length ? '<p class="grecap">' + recap.join('  &rarr;  ') + '</p>' : '') +
        (game.commitment.trim() ? '<p class="gcommit-echo">&ldquo;' + esc(game.commitment.trim()) + '&rdquo;</p>' : '') +
        '<div class="gkeys">' + keys + '</div>' +
        '<div class="gend-actions">' + actions + '</div>' +
      '</div>';
    }

    html += '<p class="gsupport">' + esc(SUPPORT_LINE) + '</p>';
    // the welcome screen is a centred landing card with the tree hidden (see .landing CSS)
    var isLanding = current.id === 'welcome';
    panel.className = 'panel' + (isLanding ? ' landing' : '');
    document.body.classList.toggle('landing', isLanding);
    panel.innerHTML = html;

    // keep the non-visual layer in step with the screen
    var frH = game.trail[game.trail.length - 1];
    canvas.setAttribute('aria-label', sceneDescription(current, frH && typeof frH.health === 'number' ? frH.health : 68));
    var msg = announceText(view);
    if (announcer.textContent !== msg) announcer.textContent = msg;

    // build the print/save keepsake on the ending screen (empty otherwise) — a summary of
    // the player's whole journey: pledge, choices, outcome, before/after reflection, messages
    if (isEnding) {
      var pledge = game.commitment.trim();
      var jsteps = journeySteps(), joutcome = journeyOutcome();
      var journeyHTML = '';
      if (jsteps.length || joutcome) {
        journeyHTML = '<h2>' + esc(uiString('keepsakeJourney', lang)) + '</h2><ul class="k-journey">' +
          jsteps.map(function (s) { return '<li><span class="k-q">' + esc(s.q) + '</span><span class="k-a">' + esc(s.a) + '</span></li>'; }).join('') +
          (joutcome ? '<li class="k-led"><span class="k-q">' + esc(uiString('keepsakeOutcome', lang)) + '</span><span class="k-a">' + esc(joutcome) + '</span></li>' : '') + '</ul>';
      }
      var kLogo = '<svg class="k-logo" viewBox="0 0 100 100" aria-hidden="true">' +
        '<circle cx="50" cy="40" r="26" fill="#3c7a4a"/><circle cx="34" cy="36" r="16" fill="#4f9a5f"/>' +
        '<circle cx="66" cy="36" r="16" fill="#4f9a5f"/><circle cx="62" cy="32" r="6" fill="#e4574c"/>' +
        '<circle cx="40" cy="30" r="5" fill="#e4574c"/><rect x="46" y="54" width="8" height="30" rx="3" fill="#7c5d40"/>' +
        '<path d="M50 64 L38 76 M50 70 L62 78" stroke="#7c5d40" stroke-width="5" stroke-linecap="round" fill="none"/></svg>';
      var kDate = new Date().toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' });
      keepsake.innerHTML =
        '<div class="k-head">' + kLogo + '<div><h1>' + esc(uiString('keepsakeTitle', lang)) + '</h1>' +
          '<p class="k-intro">' + esc(uiString('keepsakeIntro', lang)) + '</p></div></div>' +
        '<p class="k-date">' + esc(uiString('keepsakePrepared', lang)) + ' ' + esc(kDate) + '</p>' +
        (pledge ? '<h2>' + esc(uiString('keepsakePledge', lang)) + '</h2><p class="k-pledge">“' + esc(pledge) + '”</p>' : '') +
        journeyHTML +
        '<h2>' + esc(uiString('keepsakeQuestions', lang)) + '</h2><ul class="k-qlist">' +
          reflectionPrompts().map(function (p) { return '<li>' + esc(p) + '</li>'; }).join('') + '</ul>' +
        '<h2>' + esc(uiString('keepsakeRemember', lang)) + '</h2><ul class="k-mlist">' +
          KEY_MESSAGES.map(function (m) { return '<li>' + esc(m) + '</li>'; }).join('') + '</ul>' +
        '<p class="k-support">' + esc(SUPPORT_LINE) + '</p>' +
        '<p class="k-foot">' + esc(uiString('keepsakeFoot', lang)) + '</p>';
    } else {
      keepsake.innerHTML = '';
    }

    // facilitator (group-delivery) banner: per-phase discussion prompt + reset
    if (facilitator) {
      fac.innerHTML = '<span class="gfac-tag">' + esc(uiString('facDiscuss', lang)) + '</span>' +
        '<span class="gfac-body">' + esc(facilitatorPrompt(current.phase)) + '</span>' +
        '<button type="button" data-act="facreset">' + esc(uiString('facReset', lang)) + '</button>';
      fac.style.display = '';
      var fr = fac.querySelector('[data-act="facreset"]'); if (fr) fr.onclick = facilitatorReset;
    }

    // first-time nudge that the tree itself is interactive
    if (!coachDone && (current.explore || current.drop)) {
      coach.innerHTML = '<span class="g-emoji" aria-hidden="true">' + (current.drop ? '✋' : '👆') + '</span>' +
        '<span>' + esc(uiString(current.drop ? 'coachDrop' : 'coachExplore', lang)) + '</span>' +
        '<button type="button" class="g-x" data-act="coachx" aria-label="' + esc(uiString('coachDismiss', lang)) + '">✕</button>';
      coach.style.display = '';
      var cx = coach.querySelector('[data-act="coachx"]'); if (cx) cx.onclick = dismissCoach;
    } else {
      coach.style.display = 'none';
    }

    // ---- wire events ----
    panel.querySelectorAll('[data-act]').forEach(function (el) {
      var act = el.getAttribute('data-act');
      if (act === 'mute') el.onclick = toggleMute;
      else if (act === 'speak') el.onclick = toggleSpeak;
      else if (act === 'lang') el.onchange = function () { setLang(el.value); };
      else if (act === 'print') el.onclick = function () { window.print(); };
      else if (act === 'reface') el.onclick = function () { var v = el.getAttribute('data-v'); recordEval(el.getAttribute('data-w'), v === 'skip' ? 'skip' : +v); };
      else if (act === 'reveal') el.onclick = function () { revealed = true; render(); };
      else if (act === 'restart') el.onclick = restart;
      else if (act === 'intro') el.onclick = function () { choose(view.options[0], 0); };
      else if (act === 'pick') {
        el.onclick = function () { picked = +el.getAttribute('data-i'); render(); };
        if (current.drop) el.onpointerdown = function (ev) { startDrag(+el.getAttribute('data-i'), ev); };
      }
      else if (act === 'legend') {
        el.onclick = function () { discover(el.getAttribute('data-k')); };
        var hi = function () { if (engine.setHighlight) engine.setHighlight(el.getAttribute('data-k')); };
        var lo = function () { if (engine.setHighlight) engine.setHighlight(null); };
        el.onmouseenter = hi; el.onmouseleave = lo;
        el.onfocus = hi; el.onblur = lo;   // keyboard parity with hover
      }
      else if (act === 'choose') el.onclick = function () { if (picked !== undefined) choose(view.options[picked], picked); };
      else if (act === 'story') el.onclick = function () { advanceStory(current, false); };
      else if (act === 'storyalt') el.onclick = function () { advanceStory(current, true); };
      else if (act === 'back') el.onclick = goBack;
      else if (act === 'commit') el.onclick = function () { choose(view.options[0], 0); };
      else if (act === 'endnav') el.onclick = function () { onEndingNav(current.options[+el.getAttribute('data-i')]); };
      else if (act === 'chip') el.onclick = function () {
        game.commitment = el.getAttribute('data-v'); save(); render();
      };
    });

    // commit textarea: update without re-rendering (keep focus)
    var ta = panel.querySelector('textarea.gcommit');
    if (ta) {
      ta.oninput = function () {
        game.commitment = ta.value; save();
        var btn = panel.querySelector('[data-act="commit"]');
        if (btn) btn.disabled = !(game.commitment.trim().length > 0) || !settled;
      };
    }

    fitPanel();   // this screen's text may be taller/shorter than the last — never scroll
  }

  // ---------------- keep the panel readable without scrolling ----------------
  // It never scrolls: it rests at top:220 (below the sun), grows UPWARD when the text
  // needs more room, and only scales itself down if the window is still too short.
  function fitPanel() {
    if (panel.classList.contains('landing')) { panel.style.top = ''; panel.style.removeProperty('--pfit'); return; }  // centred card
    var h = panel.offsetHeight;                     // natural height (transforms don't affect layout)
    var vh = window.innerHeight, avail, top;
    if (vh <= 520 && window.innerWidth > vh) {      // landscape phone: wide right-docked panel, vertically centred (see CSS)
      avail = vh - 12;
      panel.style.top = '';                         // CSS positions it at top:50%
      panel.style.setProperty('--pfit', h > avail ? Math.max(0.5, avail / h).toFixed(3) : '1');
      return;
    }
    if (window.innerWidth <= 900) {                 // bottom sheet: already anchored low, so only scale
      // portrait: the panel owns a FIXED 60% band (matches min-height:60vh in CSS) so it renders
      // the same size on every screen; landscape: adaptive (short height).
      avail = (vh >= window.innerWidth) ? vh * 0.60 : vh * 0.72;
      var pfit = h > avail ? Math.max(0.5, avail / h) : 1;
      if (h * pfit > vh - 6) pfit = (vh - 6) / h;   // but NEVER exceed the viewport (short landscape phone)
      panel.style.top = '';
      panel.style.setProperty('--pfit', pfit.toFixed(3));
      return;
    }
    top = Math.min(220, Math.max(16, vh - 16 - h));
    avail = vh - top - 16;
    panel.style.top = top + 'px';
    panel.style.setProperty('--pfit', h > avail ? Math.max(0.5, avail / h).toFixed(3) : '1');
  }

  // ---------------- scale the 1600x900 scene to the viewport ----------------
  function fit() {
    // landing screen: the card is centred (not docked), so let the scene fill the
    // whole viewport as a backdrop behind it instead of squeezing into a side strip.
    if (panel.classList.contains('landing')) {
      var sc = Math.max(window.innerWidth / 1600, window.innerHeight / 900);
      stageEl.style.left = '50%'; stageEl.style.top = '50%';
      stageEl.style.transform = 'translate(-50%, -50%) scale(' + sc + ')';
      return;
    }
    // landscape phones (wide but very short, e.g. iPhone 16 Pro Max landscape 956x440) get a
    // right-docked panel — so, like desktop, the scene fills the window behind it.
    var landscapePhone = window.innerHeight <= 520 && window.innerWidth > window.innerHeight;
    var sw = (landscapePhone || window.innerWidth > 900) ? 372 : 0;
    var s, left, top;
    if (sw > 0) {
      // desktop / landscape phone: the scene fills the whole window and the panel floats over
      // it (team feedback) — matches the live app's TreeStage.
      s = Math.max(window.innerWidth / 1600, window.innerHeight / 900);
      left = '50%'; top = '50%';
    } else if (window.innerHeight >= window.innerWidth) {
      // PORTRAIT mobile: a FIXED scene banner across the top — the illustration is the SAME size
      // and position on every screen. (It used to be scaled to each screen's panel height, which
      // made it jump/resize.) The panel owns a fixed band below — see fitPanel() + the CSS.
      var bandH = window.innerHeight * 0.40;
      s = Math.max(window.innerWidth / 1600, bandH / 900);   // cover the band, centred
      left = '50%'; top = Math.round(bandH / 2) + 'px';
    } else {
      // LANDSCAPE mobile: very short — keep the adaptive fit (the panel needs most of the room)
      var reserve = (panel.getBoundingClientRect().height || window.innerHeight * 0.44) + 20;
      var avail = window.innerHeight - reserve - 16;
      s = Math.min((window.innerWidth - 24) / 1600, avail / 900);
      left = '50%'; top = (8 + avail / 2) + 'px';
    }
    stageEl.style.left = left;
    stageEl.style.top = top;
    stageEl.style.transform = 'translate(-50%, -50%) scale(' + s + ')';
  }

  // ---------------- boot ----------------
  // Keep the music alive: browsers suspend the AudioContext when the tab is hidden or the phone
  // locks, and it doesn't come back on its own — resume it when the page returns or on any tap.
  document.addEventListener('visibilitychange', function () {
    if (!document.hidden && audio && !muted && audio.resume) { try { audio.resume(); } catch (e) { } }
  });
  window.addEventListener('pointerdown', function () {
    if (audio && !muted && audio.resume) { try { audio.resume(); } catch (e) { } }
  }, true);
  window.addEventListener('resize', function () { fitPanel(); fit(); });
  setInterval(function () { fitPanel(); fit(); }, 400);  // re-fit: a mid-resize measure can be stale
  setInterval(function () {
    if (!engine) return;
    var s = engine.isSettled();
    if (s !== settled) {
      settled = s;
      // just toggle the action button rather than a full re-render
      var btn = panel.querySelector('[data-act="choose"],[data-act="intro"],[data-act="commit"],[data-act="story"]');
      if (btn) {
        var cur = BY_ID[game.id];
        var ready = cur.type === 'pick' ? picked !== undefined
          : cur.type === 'commit' ? game.commitment.trim().length > 0 : true;
        var lockHeld = lockLeft > 0 && (cur.type === 'story' || cur.type === 'intro');
        btn.disabled = !ready || !settled || lockHeld;
      }
    }
  }, 200);

  applyFrame(game.trail[game.trail.length - 1], true);
  if (game.id === 'welcome' && game.trail.length === 1 && engine.wave && !reducedMotion()) engine.wave();
  engine.renderNow();
  fit();
  render();
})();
