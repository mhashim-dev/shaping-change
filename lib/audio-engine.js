/* lib/audio-engine.js — soft, warm ambient music + gentle cues (Web Audio API).
   Framework-free and asset-free: every sound is synthesised.

   Deliberately UNDERSTATED so it never grates over a long session:
     - PURE SINE tones only (no bright/edgy harmonics)
     - a LOW, warm register (nothing high or piercing; a gentle lowpass on top)
     - VERY quiet, with one barely-there whole-pad breath for life
     - NO chimes, NO fast tremolo, NO detune beating
     - harmony still MOVES: each mood slowly walks a short, calm chord progression
       (all A-anchored so moods cross smoothly) so it isn't a static drone.

   Moods follow the story's health:
     bright = A major loop  (A – F#m – D – E)      — hopeful
     soft   = open/floaty   (Aadd9 – F#m7 – Dmaj7 – Esus)
     low    = minor loop     (Am – F – C – G)       — sombre

   Autoplay: the AudioContext must be created/resumed from a user gesture, so create
   the engine and call start() inside a click handler.

   API: start(), setMood('bright'|'soft'|'low'), swell(), hush(), ending(tone),
        setMuted(bool), isMuted(), resume(), destroy().
*/
export function createAudioEngine() {
  if (typeof window === 'undefined') return null;
  var AC = window.AudioContext || window.webkitAudioContext;
  if (!AC) return null;

  var ctx = null, master = null, padBus = null;
  var started = false, muted = false, destroyed = false;
  var pad = null, padMode = null, progIdx = 0, curChord = null;
  var stepTimer = 0, breatheLFO = null;

  var LEVEL = 0.60;                       // overall gentle level (was 0.85)

  // ---------------- iPhone/iPad: unlock audio + make it ignore the ring/silent switch ----------------
  // iOS Safari can silence this engine's output in two separate ways, which is why "no sound at
  // all on iPhone" is such a common report:
  //   (a) the AudioContext starts SUSPENDED and only truly unlocks the first time a sound is
  //       actually played through it inside a user gesture — resume() alone isn't always enough;
  //   (b) the physical ring/silent switch mutes Web Audio output UNLESS the page is also actively
  //       playing an HTML <audio>/<video> element, which elevates the page into a "media
  //       playback" session that iOS does not silence with the switch.
  // A ~0.5s silent WAV, embedded as a data URI (keeps the engine asset-free/offline), covers both:
  // played once through the AudioContext it unlocks it; looped as a hidden <audio> element it
  // keeps that "ignore the switch" session alive for as long as the game runs.
  var SILENT_WAV = 'data:audio/wav;base64,UklGRsQPAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YaAPAACAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA';
  var unlockAudioEl = null;

  function unlockIOS() {
    if (!ctx) return;
    // (a) play a silent buffer through the AudioContext to fully unlock it — a reliable recipe
    // for iOS Safari; resume() alone can leave it "running" in name but producing no output.
    try {
      var b = ctx.createBuffer(1, 1, 22050);
      var src = ctx.createBufferSource();
      src.buffer = b; src.connect(ctx.destination); src.start(0);
    } catch (e) { }
    // (b) keep a silent, looping <audio> element playing so iOS treats this page's audio as
    // media playback and ignores the ring/silent switch — created once, played on a real
    // user gesture (and replayed defensively whenever we get another gesture/visibility event).
    if (typeof document === 'undefined') return;
    if (!unlockAudioEl) {
      try {
        unlockAudioEl = document.createElement('audio');
        unlockAudioEl.setAttribute('playsinline', '');
        unlockAudioEl.setAttribute('webkit-playsinline', '');
        unlockAudioEl.loop = true;
        unlockAudioEl.preload = 'auto';
        unlockAudioEl.src = SILENT_WAV;
        unlockAudioEl.style.display = 'none';
        (document.body || document.documentElement).appendChild(unlockAudioEl);
      } catch (e) { }
    }
    if (unlockAudioEl) {
      try { var p = unlockAudioEl.play(); if (p && p.catch) p.catch(function () { }); } catch (e) { }
    }
  }

  function ensureCtx() {
    if (ctx) return;
    ctx = new AC();
    master = ctx.createGain();
    master.gain.value = muted ? 0 : LEVEL;
    master.connect(ctx.destination);

    // pad bus -> a warm, fixed lowpass -> master.  A very slow, subtle breath on the bus
    // gain keeps it alive without any audible wobble.
    var lp = ctx.createBiquadFilter();
    lp.type = 'lowpass'; lp.frequency.value = 900; lp.Q.value = 0.2;
    padBus = ctx.createGain(); padBus.gain.value = 1;
    padBus.connect(lp); lp.connect(master);
    breatheLFO = ctx.createOscillator(); breatheLFO.frequency.value = 0.02;  // ~50s cycle
    var bg = ctx.createGain(); bg.gain.value = 0.10;
    breatheLFO.connect(bg); bg.connect(padBus.gain); breatheLFO.start();
  }

  // Warm, LOW chord voicings (pure sines). Top note kept ≤ ~330Hz so nothing is bright.
  var PROG = {
    bright: [
      [110.00, 164.81, 220.00, 277.18], // A    A2 E3 A3 C#4
      [92.50, 138.59, 185.00, 220.00],  // F#m  F#2 C#3 F#3 A3
      [110.00, 146.83, 220.00, 293.66], // D    A2 D3 A3 D4
      [123.47, 164.81, 246.94, 329.63]  // E    B2 E3 B3 E4
    ],
    soft: [
      [110.00, 164.81, 220.00, 246.94], // Aadd9 A2 E3 A3 B3
      [92.50, 138.59, 185.00, 277.18],  // F#m7  F#2 C#3 F#3 C#4
      [110.00, 146.83, 220.00, 277.18], // Dmaj7 A2 D3 A3 C#4
      [123.47, 164.81, 220.00, 246.94]  // Esus  B2 E3 A3 B3
    ],
    low: [
      [110.00, 164.81, 220.00, 261.63], // Am A2 E3 A3 C4
      [87.31, 130.81, 174.61, 261.63],  // F  F2 C3 F3 C4
      [130.81, 196.00, 261.63, 329.63], // C  C3 G3 C4 E4
      [98.00, 146.83, 196.00, 246.94]   // G  G2 D3 G3 B3
    ]
  };
  var VOICE_GAIN = [0.50, 0.40, 0.32, 0.24];   // upper voices quieter
  var VOICE_PAN  = [0.00, -0.22, 0.22, -0.10]; // gentle stereo spread

  // crossfade to a warm sine voicing of `freqs`
  function buildChord(freqs) {
    ensureCtx();
    var t = ctx.currentTime;
    curChord = freqs;
    var hadPad = !!pad;

    if (pad) {
      var old = pad;
      try {
        old.gain.gain.cancelScheduledValues(t);
        old.gain.gain.setValueAtTime(Math.max(0.0001, old.gain.gain.value), t);
        old.gain.gain.linearRampToValueAtTime(0.0001, t + 5.0);   // long, smooth crossfade
      } catch (e) { }
      setTimeout(function () { try { old.oscs.forEach(function (o) { o.stop(); }); } catch (e) { } }, 5400);
    }

    var g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.linearRampToValueAtTime(0.030, t + (hadPad ? 5.0 : 3.5));   // quiet, slow fade-in
    g.connect(padBus);

    var all = [];
    freqs.forEach(function (f, i) {
      var o = ctx.createOscillator();
      o.type = 'sine';                      // pure sine only — no edge
      o.frequency.value = f;
      var vg = ctx.createGain(); vg.gain.value = VOICE_GAIN[i] != null ? VOICE_GAIN[i] : 0.2;
      o.connect(vg);
      if (ctx.createStereoPanner) {
        var pan = ctx.createStereoPanner(); pan.pan.value = VOICE_PAN[i] != null ? VOICE_PAN[i] : 0;
        vg.connect(pan); pan.connect(g);
      } else { vg.connect(g); }
      o.start();
      all.push(o);
    });
    pad = { gain: g, oscs: all };
  }

  // slowly walk to the next chord in the current mood's progression
  function stepProgression() {
    if (destroyed) return;
    var delay = 18000 + Math.random() * 6000;    // hold each chord ~18–24s
    stepTimer = setTimeout(function () {
      if (!destroyed && started && ctx && ctx.state === 'running') {
        var prog = PROG[padMode] || PROG.soft;
        progIdx = (progIdx + 1) % prog.length;
        try { buildChord(prog[progIdx]); } catch (e) { }
      }
      stepProgression();
    }, delay);
  }

  // one-off soft, warm sine cue. `stagger` (seconds between note onsets) lets a cue gently
  // RISE (ascending freqs) or FALL (descending freqs) so its emotional direction reads —
  // uplifting for healthy choices, reflective/sombre for unhealthy ones. Still pure sine + quiet.
  function cue(freqs, peak, attack, hold, release, stagger) {
    if (!ctx) return;
    stagger = stagger || 0;
    var t0 = ctx.currentTime;
    var spread = stagger * (freqs.length - 1);
    var out = ctx.createGain(); out.gain.value = 0.0001; out.connect(master);
    out.gain.exponentialRampToValueAtTime(peak, t0 + attack);
    out.gain.setValueAtTime(peak, t0 + attack + hold + spread);
    out.gain.exponentialRampToValueAtTime(0.0006, t0 + attack + hold + spread + release);
    var end = t0 + attack + hold + spread + release + 0.1;
    freqs.forEach(function (f, i) {
      var o = ctx.createOscillator(); o.type = 'sine'; o.frequency.value = f;
      var g = ctx.createGain(); g.gain.value = 1 / (i + 1.5);
      o.connect(g); g.connect(out); o.start(t0 + i * stagger); o.stop(end);
    });
  }

  return {
    setMood: function (mode) {
      if (destroyed || !PROG[mode]) return;
      if (padMode === mode && pad) return;
      padMode = mode; progIdx = 0;
      if (started) { try { buildChord(PROG[mode][0]); } catch (e) { } }
    },
    start: function () {
      ensureCtx();
      if (ctx.state === 'suspended') ctx.resume();
      unlockIOS();                    // must run inside this same user-gesture call
      var first = !started;
      started = true;
      if (!pad) { if (!padMode) padMode = 'soft'; progIdx = 0; try { buildChord(PROG[padMode][0]); } catch (e) { } }
      if (first) stepProgression();
    },
    resume: function () { ensureCtx(); if (ctx.state === 'suspended') ctx.resume(); unlockIOS(); },
    // gentle, low, sine cues (no bright tops). Healthy = a soft rising figure (uplifting);
    // unhealthy = a soft falling figure (reflective). Kept quiet so it never grates.
    swell: function () { cue([220.00, 277.18, 329.63], 0.075, 0.35, 0.15, 1.8, 0.11); },       // rising, warm
    hush: function () { cue([164.81, 130.81, 110.00], 0.07, 0.30, 0.20, 2.2, 0.13); },          // falling, sombre
    ending: function (tone) {
      if (tone === 'withered') cue([146.83, 110.00, 87.31], 0.075, 0.35, 0.35, 3.4, 0.16);      // slow fall
      else if (tone === 'recovering') cue([174.61, 220.00, 261.63], 0.07, 0.5, 0.25, 2.4, 0.12); // gentle rise
      else cue([220.00, 277.18, 329.63, 392.00], 0.08, 0.45, 0.35, 2.8, 0.11);                   // flourishing, rising
    },
    setMuted: function (m) {
      muted = m;
      if (master && ctx) {
        var t = ctx.currentTime;
        master.gain.cancelScheduledValues(t);
        master.gain.setValueAtTime(master.gain.value, t);
        master.gain.linearRampToValueAtTime(m ? 0 : LEVEL, t + 0.3);
      }
    },
    isMuted: function () { return muted; },
    destroy: function () {
      destroyed = true;
      clearTimeout(stepTimer);
      if (pad) { try { pad.oscs.forEach(function (o) { o.stop(); }); } catch (e) { } pad = null; }
      try { if (breatheLFO) breatheLFO.stop(); } catch (e) { }
      try { if (ctx) ctx.close(); } catch (e) { }
      if (unlockAudioEl) { try { unlockAudioEl.pause(); unlockAudioEl.remove(); } catch (e) { } unlockAudioEl = null; }
    }
  };
}
