/* lib/tree-engine.js — procedural growing tree in a sunny landscape.
   Ported 1:1 from the HTML prototype — same drawing code, wrapped as a factory.
   Stages: 0 seed, 1 roots, 2 soil, 3 trunk, 4 leaves/impacts, 5 color.
   These map onto a real tree's life cycle (ecotree.green/en/blog/the-life-cycle-of-a-tree):
     0 Seed · 1 Germination · 2 Seedling · 3 Sapling · 4 Young tree · 5 Mature tree.
   The health channel (setHealth 100→0) runs the dying half: a mature tree ages and
   declines (dieback) to a bare, decaying "snag" at 0.
   Fractional stage targets are allowed (e.g. setStage(4.34) heals a third of the color).
   Usage (client-side only):
     const engine = createTreeEngine(canvasEl);
     engine.setStage(2);            // animate to a stage
     engine.setStage(2, true);      // jump instantly
     engine.applyTweaks({ palette: 'spring', density: 1.2, speed: 1, mood: 'golden' });
     engine.regen(42);              // new tree shape (omit arg for random)
     engine.destroy();              // stop the render loop on unmount
*/
export function createTreeEngine(canvas) {
  // GROUND sits low so the soil is only a shallow band (~23% of the frame) — the meadow
  // takes the space instead. ROOT_SCALE shrinks the root system to match that band.
  var W = 1600, H = 900, GROUND = 690, BASEX = 690;
  var ROOT_SCALE = 0.85;
  var TAU = Math.PI * 2;
  var STAGES = 6; // 0 seed, 1 roots, 2 soil, 3 trunk, 4 leaves/impacts, 5 color

  // ---------------- utils ----------------
  function mulberry32(a) {
    return function () {
      a |= 0; a = a + 0x6D2B79F5 | 0;
      var t = Math.imul(a ^ a >>> 15, 1 | a);
      t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
      return ((t ^ t >>> 14) >>> 0) / 4294967296;
    };
  }
  function clamp(v, a, b) { return v < a ? a : v > b ? b : v; }
  function lerp(a, b, t) { return a + (b - a) * t; }
  function smooth(t) { t = clamp(t, 0, 1); return t * t * (3 - 2 * t); }
  function easeOutBack(t) {
    t = clamp(t, 0, 1); var c = 1.6;
    return 1 + (c + 1) * Math.pow(t - 1, 3) + c * Math.pow(t - 1, 2);
  }
  function hueLerp(a, b, t) { var d = ((b - a + 540) % 360) - 180; return a + d * t; }
  function hsl(h, s, l, a) {
    if (a === undefined) return 'hsl(' + h.toFixed(1) + ',' + s.toFixed(1) + '%,' + l.toFixed(1) + '%)';
    return 'hsla(' + h.toFixed(1) + ',' + s.toFixed(1) + '%,' + l.toFixed(1) + '%,' + a.toFixed(3) + ')';
  }
  function blend3(from, to, t) { // [h,s,l] triplets
    return [hueLerp(from[0], to[0], t), lerp(from[1], to[1], t), lerp(from[2], to[2], t)];
  }
  function hex2rgb(h) { h = h.replace('#', ''); return [parseInt(h.substr(0, 2), 16), parseInt(h.substr(2, 2), 16), parseInt(h.substr(4, 2), 16)]; }
  function mixHex(a, b, t) { var x = hex2rgb(a), y = hex2rgb(b); return 'rgb(' + Math.round(lerp(x[0], y[0], t)) + ',' + Math.round(lerp(x[1], y[1], t)) + ',' + Math.round(lerp(x[2], y[2], t)) + ')'; }
  // stable per-feature pseudo-random in [0,1) from a number — used so a branch's
  // "does it break off when dead" verdict is fixed without perturbing the RNG stream.
  function fract(x) { x = Math.sin(x) * 43758.5453; return x - Math.floor(x); }

  // ---------------- palettes ----------------
  var BUD = [66, 19, 61]; // pale, slightly sickly young-leaf color
  var PALETTES = {
    spring: {
      h0: 92, h1: 142, s0: 48, s1: 65, l0: 31, l1: 57,
      accentChance: 0.055, accents: [[350, 85, 88], [44, 95, 70]],
      grass: [102, 52, 43], hillFar: [128, 30, 60], hillNear: [104, 40, 44]
    },
    autumn: {
      h0: 14, h1: 52, s0: 60, s1: 82, l0: 40, l1: 58,
      accentChance: 0.09, accents: [[2, 70, 44], [28, 90, 56]],
      grass: [66, 44, 47], hillFar: [52, 32, 60], hillNear: [42, 44, 47]
    },
    blossom: {
      h0: 326, h1: 350, s0: 58, s1: 78, l0: 64, l1: 82,
      accentChance: 0.10, accents: [[0, 0, 98], [346, 72, 62]],
      grass: [106, 42, 46], hillFar: [130, 26, 62], hillNear: [108, 34, 46]
    },
    // sickly / withered: foliage and scenery desaturate toward grey even when
    // colorP cannot drain (below stage 4). The primary "this went wrong" signal.
    dull: {
      h0: 92, h1: 118, s0: 14, s1: 20, l0: 33, l1: 48,
      accentChance: 0, accents: [[0, 0, 66]],
      grass: [84, 24, 52], hillFar: [150, 14, 64], hillNear: [110, 18, 52]
    }
  };
  var GRASS_DULL = [84, 24, 52], HILLFAR_DULL = [150, 14, 64], HILLNEAR_DULL = [110, 18, 52];

  var BARK = ['#6b4c31', '#73553a', '#7c5d40', '#856747', '#8d6f4e', '#937753'];
  var ROOTC = ['#5b452d', '#634d34', '#6b553b', '#71593e'];

  // light moods for the final "color" stage
  var MOODS = {
    morning: { warm: '255,222,170', amt: 0.07, dapple: 0.10 },
    noon: { warm: '255,196,110', amt: 0.10, dapple: 0.16 },
    golden: { warm: '255,162,80', amt: 0.19, dapple: 0.24 },
    // flat, cool light for a withering scene — drains the warm wash and dapple.
    overcast: { warm: '200,205,210', amt: 0.02, dapple: 0.03 }
  };

  // ---------------- tree generation ----------------
  function pointAt(pts, t) {
    var n = pts.length - 1, f = clamp(t, 0, 1) * n;
    var i = Math.min(n - 1, Math.floor(f)), u = f - i;
    return { x: lerp(pts[i].x, pts[i + 1].x, u), y: lerp(pts[i].y, pts[i + 1].y, u) };
  }
  function angleAt(pts, t) {
    var n = pts.length - 1, i = Math.min(n - 1, Math.floor(clamp(t, 0, 0.999) * n));
    return Math.atan2(pts[i + 1].y - pts[i].y, pts[i + 1].x - pts[i].x);
  }

  function buildTree(seed) {
    var rng = mulberry32(seed);
    var maxDepth = 5;
    var maxDist = 0, rootMaxDist = 0;
    var clusters = [];
    // above-ground bounding box (trunk + canopy) — used to scale the mature tree
    // so its crown never grows off the top/sides of the canvas.
    var bMinX = 1e9, bMaxX = -1e9, bMinY = 1e9, bMaxY = -1e9;

    function grow(x, y, ang, len, wid, depth, startDist) {
      var segs = Math.max(3, Math.round(len / 15));
      var pts = [{ x: x, y: y }], a = ang, cx = x, cy = y;
      for (var i = 0; i < segs; i++) {
        a += (rng() - 0.5) * (depth === 0 ? 0.16 : 0.30);
        a = a * (1 - 0.045) + (-Math.PI / 2) * 0.045; // gentle pull toward the sky
        var sl = len / segs;
        cx += Math.cos(a) * sl; cy += Math.sin(a) * sl;
        pts.push({ x: cx, y: cy });
      }
      var node = { pts: pts, len: len, w0: wid, w1: Math.max(depth >= maxDepth ? 1.1 : 2, wid * 0.58), depth: depth, startDist: startDist, children: [], streaks: [] };
      node.brk = fract(startDist * 1.37 + depth * 7.13 + x * 0.011 + y * 0.017); // fixed "breaks off when dead?" roll
      maxDist = Math.max(maxDist, startDist + len);
      for (var bp = 0; bp < pts.length; bp++) {
        var bhw = Math.max(node.w0, node.w1) * 0.5;
        if (pts[bp].x - bhw < bMinX) bMinX = pts[bp].x - bhw;
        if (pts[bp].x + bhw > bMaxX) bMaxX = pts[bp].x + bhw;
        if (pts[bp].y - bhw < bMinY) bMinY = pts[bp].y - bhw;
        if (pts[bp].y + bhw > bMaxY) bMaxY = pts[bp].y + bhw;
      }

      // bark streak texture on thick wood
      if (depth <= 1 && wid > 9) {
        var nS = depth === 0 ? 5 : 2;
        for (var s = 0; s < nS; s++) {
          var off = (rng() - 0.5) * 0.95, t0 = rng() * 0.3, t1 = 0.55 + rng() * 0.45;
          var spts = [];
          for (var j = 0; j < pts.length; j++) {
            var u = j / (pts.length - 1);
            if (u < t0 || u > t1) continue;
            var aa = angleAt(pts, u), w = lerp(wid, wid * 0.6, u);
            spts.push({ x: pts[j].x + Math.cos(aa + Math.PI / 2) * w * 0.5 * off, y: pts[j].y + Math.sin(aa + Math.PI / 2) * w * 0.5 * off, u: u });
          }
          if (spts.length > 1) node.streaks.push({ pts: spts, dark: rng() < 0.7 });
        }
      }

      if (depth < maxDepth) {
        var kids = [];
        kids.push({ at: 1, ang: a + (rng() - 0.5) * 0.5, len: len * (0.68 + rng() * 0.14), wid: wid * 0.62 });
        var nSide = depth === 0 ? 3 : (rng() < 0.6 ? 1 : 2);
        for (var k = 0; k < nSide; k++) {
          var at = depth === 0 ? 0.40 + 0.55 * ((k + 0.3 + rng() * 0.6) / nSide) : 0.45 + 0.5 * rng();
          var dir = (k % 2 === 0 ? 1 : -1) * (rng() < 0.18 ? -1 : 1);
          var ca = angleAt(pts, at) + dir * (0.55 + rng() * 0.58);
          ca = ca * 0.86 + (-Math.PI / 2) * 0.14;
          kids.push({ at: at, ang: ca, len: len * (0.55 + rng() * 0.16), wid: wid * (0.40 + rng() * 0.12) });
        }
        for (var c = 0; c < kids.length; c++) {
          var kd = kids[c];
          if (kd.wid < 1.1 || kd.len < 10) continue;
          var p = pointAt(pts, kd.at);
          node.children.push(grow(p.x, p.y, kd.ang, kd.len, kd.wid, depth + 1, startDist + len * kd.at));
        }
      }

      // leaf clusters at outer twigs
      if (depth === maxDepth || (depth === maxDepth - 1 && rng() < 0.75)) {
        var tip = pts[pts.length - 1];
        var r = depth === maxDepth ? 30 + rng() * 24 : 22 + rng() * 16;
        var blobs = [], nB = Math.round(7 + r * 0.18);
        for (var b = 0; b < nB; b++) {
          var ba = rng() * TAU, br = Math.sqrt(rng()) * r;
          var bdx = Math.cos(ba) * br, bdy = Math.sin(ba) * br * 0.82, blr = 7 + rng() * 9.5;
          blobs.push({
            dx: bdx, dy: bdy, r: blr,
            h: rng(), s: rng(), l: rng(), ph: rng() * TAU, acc: rng()
          });
          var ex = tip.x + bdx, ey = tip.y + bdy, pad = blr * 1.2;
          if (ex - pad < bMinX) bMinX = ex - pad;
          if (ex + pad > bMaxX) bMaxX = ex + pad;
          if (ey - pad < bMinY) bMinY = ey - pad;
          if (ey + pad > bMaxY) bMaxY = ey + pad;
        }
        clusters.push({ x: tip.x, y: tip.y, r: r, blobs: blobs, dist: startDist + len, ph: rng() * TAU });
      }
      return node;
    }

    var trunk = grow(BASEX, GROUND + 6, -Math.PI / 2 + (rng() - 0.5) * 0.12, 235, 44, 0, 0);

    function rgrow(x, y, ang, len, wid, depth, startDist) {
      var segs = Math.max(3, Math.round(len / 14));
      var pts = [{ x: x, y: y }], a = ang, cx = x, cy = y;
      for (var i = 0; i < segs; i++) {
        a += (rng() - 0.5) * 0.34;
        // dive downward — gently, so the system spreads WIDE in the shallow soil band
        a = a * 0.94 + (Math.PI / 2) * 0.06 * (depth === 0 ? 0.36 : 0.72);
        if (cy > H - 80) a = a * 0.85 + (Math.cos(a) >= 0 ? 0 : Math.PI) * 0.15;
        if (cy < GROUND + 26) a = a * 0.85 + (Math.PI / 2) * 0.15;
        cx += Math.cos(a) * len / segs; cy += Math.sin(a) * len / segs;
        cy = clamp(cy, GROUND + 8, H - 16);
        pts.push({ x: cx, y: cy });
      }
      var node = { pts: pts, len: len, w0: wid, w1: Math.max(1, wid * 0.45), depth: depth, startDist: startDist, children: [], streaks: [] };
      rootMaxDist = Math.max(rootMaxDist, startDist + len);
      if (depth < 3 && wid > 2.2) {
        var kids = [{ at: 1, ang: a + (rng() - 0.5) * 0.7, len: len * 0.7, wid: wid * 0.55 }];
        var ns = depth === 0 ? 2 : 1;
        for (var k = 0; k < ns; k++) {
          var at = 0.3 + 0.6 * rng();
          kids.push({ at: at, ang: angleAt(pts, at) + (rng() < 0.5 ? -1 : 1) * (0.5 + rng() * 0.6), len: len * (0.5 + rng() * 0.2), wid: wid * 0.45 });
        }
        for (var c = 0; c < kids.length; c++) {
          var kd = kids[c];
          if (kd.len < 12) continue;
          var p = pointAt(pts, kd.at);
          node.children.push(rgrow(p.x, p.y, kd.ang, kd.len, kd.wid, depth + 1, startDist + len * kd.at));
        }
      }
      return node;
    }

    var roots = [], nRoots = 5;
    for (var i = 0; i < nRoots; i++) {
      var f = (i + 0.5) / nRoots;
      var ang = lerp(Math.PI * 0.86, Math.PI * 0.14, f) + (rng() - 0.5) * 0.22;
      roots.push(rgrow(BASEX + (f - 0.5) * 26, GROUND + 10, ang,
        (105 + rng() * 55 + 45 * Math.sin(Math.PI * f)) * ROOT_SCALE, (15 + rng() * 7) * 0.85, 0, 0));
    }

    // canopy bounds (for light dapple + butterflies)
    var cx2 = 0, cy2 = 0;
    for (var q = 0; q < clusters.length; q++) { cx2 += clusters[q].x; cy2 += clusters[q].y; }
    cx2 /= Math.max(1, clusters.length); cy2 /= Math.max(1, clusters.length);
    var cr = 60;
    for (q = 0; q < clusters.length; q++) {
      var d = Math.hypot(clusters[q].x - cx2, clusters[q].y - cy2) + clusters[q].r;
      if (d > cr) cr = d;
    }

    // where shed leaves and broken branches come to rest on the meadow — a scatter
    // under the crown that fills in as the tree declines (curWilt drives how many show).
    var spread = clamp((bMaxX - bMinX) * 0.5, 150, 360);
    var groundLeaves = [];
    for (var gl = 0; gl < 76; gl++) {
      var gnear = gl < 40;
      groundLeaves.push({
        x: BASEX + (rng() - 0.5) * spread * 2 + (cx2 - BASEX) * 0.5,
        y: (gnear ? GROUND - 2 + rng() * 12 : GROUND - 14 - rng() * 18),
        r: (gnear ? 4.5 + rng() * 3.5 : 3 + rng() * 2.2),
        rot: rng() * TAU, h: rng(), order: rng()
      });
    }
    var groundBranches = [];
    for (var gbI = 0; gbI < 16; gbI++) {
      groundBranches.push({
        x: BASEX + (rng() - 0.5) * spread * 1.5,
        y: GROUND - 1 + rng() * 12,
        len: 26 + rng() * 46, ang: (rng() - 0.5) * 0.7, wid: 3 + rng() * 4,
        bend: (rng() - 0.5) * 0.5, tone: rng(), order: rng(),
        twigs: (rng() < 0.6 ? 1 : 0)
      });
    }

    return {
      trunk: trunk, roots: roots, clusters: clusters, maxDist: maxDist, rootMaxDist: rootMaxDist,
      canopy: { x: cx2, y: cy2, r: cr }, seed: seed,
      bounds: { minX: bMinX, maxX: bMaxX, minY: bMinY, maxY: bMaxY },
      groundLeaves: groundLeaves, groundBranches: groundBranches
    };
  }

  // largest scale (about the base) at which the mature crown still fits the canvas,
  // with a little headroom — recomputed per tree because regen() picks new shapes.
  function fitScaleFor(b) {
    var MT = 16, MS = 26, s = 1;
    if (b.minY < GROUND) s = Math.min(s, (GROUND - MT) / (GROUND - b.minY));
    if (b.minX < BASEX) s = Math.min(s, (BASEX - MS) / (BASEX - b.minX));
    if (b.maxX > BASEX) s = Math.min(s, (W - MS - BASEX) / (b.maxX - BASEX));
    return clamp(s, 0.5, 1);
  }

  // ---------------- static scenery ----------------
  var sceneRng = mulberry32(20260611);
  var clouds = [];
  for (var ci = 0; ci < 6; ci++) {
    var highCloud = ci >= 4; // a couple of small, high, faint clouds for depth
    var np = (highCloud ? 3 : 4) + Math.floor(sceneRng() * 3), puffs = [];
    for (var pi = 0; pi < np; pi++) {
      puffs.push({ dx: (pi - np / 2) * 36 + (sceneRng() - 0.5) * 24, dy: (sceneRng() - 0.5) * 18, r: 22 + sceneRng() * 22 });
    }
    clouds.push({
      x: sceneRng() * W,
      y: (highCloud ? 50 : 90) + sceneRng() * (highCloud ? 70 : 150),
      sc: highCloud ? 0.42 + sceneRng() * 0.3 : 0.78 + sceneRng() * 0.66,
      sp: (3 + sceneRng() * 6) * (highCloud ? 0.6 : 1),
      alpha: highCloud ? 0.5 : 0.92,
      puffs: puffs
    });
  }
  var pebbles = [];
  for (var pb = 0; pb < 46; pb++) {
    pebbles.push({
      x: sceneRng() * W, y: GROUND + 30 + sceneRng() * (H - GROUND - 50),
      rx: 3 + sceneRng() * 9, ry: 2 + sceneRng() * 5, rot: sceneRng() * TAU, tone: sceneRng()
    });
  }
  var blades = [];
  for (var gb = 0; gb < 230; gb++) {
    var nearEdge = gb < 90;
    blades.push({
      x: sceneRng() * W,
      y: nearEdge ? GROUND + 2 + sceneRng() * 4 : 478 + Math.pow(sceneRng(), 0.7) * (GROUND - 482),
      len: nearEdge ? 12 + sceneRng() * 14 : 7 + sceneRng() * 10,
      lean: (sceneRng() - 0.5) * 10, ph: sceneRng() * TAU, tone: sceneRng()
    });
  }
  var strata = [];
  for (var st = 0; st < 5; st++) {
    var line = [], yy = GROUND + 24 + st * ((H - GROUND - 44) / 5) + sceneRng() * 10;
    for (var sx = 0; sx <= W; sx += 80) line.push({ x: sx, y: yy + Math.sin(sx * 0.01 + st * 2) * 9 + (sceneRng() - 0.5) * 8 });
    strata.push(line);
  }
  // wildflowers in the meadow ([h,s,l]: white, buttercup, pink, lavender, poppy)
  var FLOWER_COLS = [[0, 0, 100], [48, 92, 66], [344, 80, 76], [280, 44, 72], [12, 86, 60]];
  var flowers = [];
  for (var fl = 0; fl < 74; fl++) {
    var fNear = fl < 30;
    flowers.push({
      x: sceneRng() * W,
      base: fNear ? GROUND - 1 - sceneRng() * 16 : 488 + Math.pow(sceneRng(), 0.8) * (GROUND - 492),
      stem: fNear ? 12 + sceneRng() * 16 : 6 + sceneRng() * 9,
      r: fNear ? 3 + sceneRng() * 2.4 : 1.8 + sceneRng() * 1.3,
      col: FLOWER_COLS[(sceneRng() * FLOWER_COLS.length) | 0],
      lean: (sceneRng() - 0.5) * 6, ph: sceneRng() * TAU
    });
  }
  // floating pollen/dust motes that catch the light
  var motes = [];
  for (var mo = 0; mo < 46; mo++) {
    motes.push({ x: sceneRng() * W, y: 130 + sceneRng() * (GROUND - 150), r: 0.8 + sceneRng() * 1.9, ph: sceneRng() * TAU, sp: 0.3 + sceneRng() * 0.6, amp: 8 + sceneRng() * 22 });
  }
  // a distant flock drifting as a loose V
  var flock = [];
  for (var fk = 0; fk < 7; fk++) flock.push({ dx: (fk - 3) * 16, dy: Math.abs(fk - 3) * 7, ph: sceneRng() * TAU });
  // warm specks that light up the soil during the "soil" (beliefs) stage
  var soilSpecks = [];
  for (var sk = 0; sk < 42; sk++) {
    var ska = sceneRng() * Math.PI, skr = 40 + sceneRng() * 290;
    soilSpecks.push({
      x: BASEX + Math.cos(ska) * skr * (sceneRng() < 0.5 ? 1 : -1) * 0.9,
      y: GROUND + 22 + sceneRng() * (H - GROUND - 44),
      r: 1.4 + sceneRng() * 1.6,
      d: skr, ph: sceneRng() * TAU
    });
  }
  var birds = [
    { x: 220, y: 140, sp: 9, sc: 1.0, ph: 0.0 },
    { x: 420, y: 105, sp: 7, sc: 0.7, ph: 2.1 },
    { x: 760, y: 175, sp: 11, sc: 0.85, ph: 4.0 },
    { x: 1040, y: 120, sp: 6, sc: 0.6, ph: 1.2 }
  ];
  var butterflies = [
    { ph: 0.4, rx: 220, ry: 90, sp: 0.31, col: '#f59e3f', col2: '#e5731f' },
    { ph: 2.6, rx: 170, ry: 120, sp: 0.24, col: '#fefaf2', col2: '#f1d8b8' },
    { ph: 4.6, rx: 260, ry: 70, sp: 0.40, col: '#f0b53e', col2: '#d98a1e' }
  ];

  // ---------------- state ----------------
  var ctx, dpr = 1;
  var seed = 1357911;
  var tree = buildTree(seed);
  var t = 0, target = 0;
  var speed = 1, density = 1, pal = PALETTES.spring, palName = 'spring', mood = MOODS.noon;
  var SUN = { x: 1255, y: 158 };
  var lastNow = 0;

  // falling-leaf particles (the literal "leaves fall" effect) + heal shimmer
  var fallingLeaves = [];
  var fallingBranches = []; // broken twigs tumbling down as the dead tree comes apart
  var healPulse = 0;

  // the "spark": a metaphorical lightning strike scorches the TREE (never a person) —
  // shows that unaddressed stress + control can escalate to harm. Always reversible.
  var flash = 0, scorch = 0, sparkBolt = null, embers = [], flames = [];

  // Orion: an optional procedural figure at the tree base whose emotion mirrors the
  // tree's health (asset-free — no image). Shown on the story screens via setAlpha().
  var alphaShown = false;
  var thought = null;   // what Orion is thinking about (see drawThought)
  var alphaWalk = null; // {from,to,t0,dur} while he walks in from the left
  var alphaWave = null; // {t0,dur} while he waves hello at the start of the story
  var figurePose = null; // node-driven pose override: {pose, expr} (see drawAtlasPose)
  var sprites = null;    // the team's embedded artwork (see loadAtlasSprites) — null = procedural
  // visual height of each sprite in scene px (bbox-normalised); tuned so the body
  // stays a consistent size across poses (the wave arm adds height, sitting removes it)
  // heights derived from assets/sprite-metrics.json so the HEAD is ~50px on screen in
  // every pose — normalising by bounding box made him grow/shrink between poses
  var SPRITE_H = { front: 172, threeq: 168, profile: 172, back: 173, backthreeq: 172,
                   walk: 161, run: 156, wave: 164, point: 153, think: 152, sit: 127 };
  var WALK_K = 0.045;  // rad per px of travel — tuned for the front-facing figure's stride

  // watering: little ground sprinklers throw arcs of water at the trunk as it grows
  var waterPulse = 0, soilMoist = 0, waterDrops = [], waterSplashes = [], waterEmit = 0;

  // mature crown can't exceed this scale or it clips off-canvas (per-tree, see fitScaleFor)
  var matScaleMax = fitScaleFor(tree.bounds);

  // a subtle ambient breeze — slow, self-driven, not tied to the cursor
  var windX = 0, windY = 0;

  // tree vitality: 100 = healthy, 0 = dead. Drives the staged decline below.
  //   wilt 0..1 = 1 - health/100   ·   vit = health/100
  var healthV = 100, healthTarget = 100, curWilt = 0, vit = 1;

  // life-cycle size: the crown scales up from a small sapling to a full mature tree
  var growthScale = 1;

  // ---------------- drawing ----------------
  function drawSky(time, colorP) {
    var g = ctx.createLinearGradient(0, 0, 0, 520);
    g.addColorStop(0, '#4a92d6');
    g.addColorStop(0.32, '#74b4e6');
    g.addColorStop(0.66, '#a8d6ef');
    g.addColorStop(0.86, '#d4e9f2');
    g.addColorStop(1, '#edf3e6');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, 520);
    // warm atmospheric haze gathering near the horizon
    var haze = ctx.createLinearGradient(0, 420, 0, 520);
    haze.addColorStop(0, 'rgba(255,243,214,0)');
    haze.addColorStop(1, 'rgba(255,240,206,' + (0.30 + 0.18 * colorP).toFixed(3) + ')');
    ctx.fillStyle = haze;
    ctx.fillRect(0, 420, W, 100);

    // sun glow
    var glow = ctx.createRadialGradient(SUN.x, SUN.y, 10, SUN.x, SUN.y, 300);
    glow.addColorStop(0, 'rgba(255,244,200,' + (0.85).toFixed(2) + ')');
    glow.addColorStop(0.35, 'rgba(255,228,150,' + (0.30 + 0.14 * colorP).toFixed(2) + ')');
    glow.addColorStop(1, 'rgba(255,228,150,0)');
    ctx.fillStyle = glow;
    ctx.fillRect(SUN.x - 300, SUN.y - 300, 600, 600);

    // rotating rays
    ctx.save();
    ctx.translate(SUN.x, SUN.y);
    ctx.rotate(time * 0.00006);
    ctx.fillStyle = 'rgba(255,236,170,' + (0.10 + 0.06 * colorP).toFixed(3) + ')';
    for (var i = 0; i < 12; i++) {
      ctx.rotate(TAU / 12);
      ctx.beginPath();
      ctx.moveTo(60, -7); ctx.lineTo(190 + (i % 2) * 40, 0); ctx.lineTo(60, 7);
      ctx.closePath(); ctx.fill();
    }
    ctx.restore();

    // sun disc
    ctx.fillStyle = '#fff6d8';
    ctx.beginPath(); ctx.arc(SUN.x, SUN.y, 46, 0, TAU); ctx.fill();
    ctx.strokeStyle = 'rgba(255,196,90,0.85)'; ctx.lineWidth = 4;
    ctx.beginPath(); ctx.arc(SUN.x, SUN.y, 46, 0, TAU); ctx.stroke();
  }

  function drawClouds(dt) {
    for (var i = 0; i < clouds.length; i++) {
      var c = clouds[i];
      c.x += (c.sp + windX * 26) * dt;
      if (c.x > W + 200) c.x = -200;
      else if (c.x < -200) c.x = W + 200;
      var p, pf;
      // shadowed underside
      ctx.fillStyle = 'rgba(193,208,226,' + (c.alpha * 0.5).toFixed(3) + ')';
      for (p = 0; p < c.puffs.length; p++) {
        pf = c.puffs[p];
        ctx.beginPath();
        ctx.ellipse(c.x + pf.dx * c.sc, c.y + pf.dy * c.sc + pf.r * c.sc * 0.22, pf.r * c.sc, pf.r * 0.6 * c.sc, 0, 0, TAU);
        ctx.fill();
      }
      // bright body
      ctx.fillStyle = 'rgba(255,255,255,' + c.alpha.toFixed(3) + ')';
      for (p = 0; p < c.puffs.length; p++) {
        pf = c.puffs[p];
        ctx.beginPath();
        ctx.ellipse(c.x + pf.dx * c.sc, c.y + pf.dy * c.sc, pf.r * c.sc, pf.r * 0.62 * c.sc, 0, 0, TAU);
        ctx.fill();
      }
      // sunlit top highlight
      ctx.fillStyle = 'rgba(255,250,230,' + (c.alpha * 0.85).toFixed(3) + ')';
      for (p = 0; p < c.puffs.length; p++) {
        pf = c.puffs[p];
        ctx.beginPath();
        ctx.ellipse(c.x + pf.dx * c.sc, c.y + pf.dy * c.sc - pf.r * c.sc * 0.28, pf.r * c.sc * 0.7, pf.r * 0.4 * c.sc, 0, 0, TAU);
        ctx.fill();
      }
    }
  }

  function drawBirds(time) {
    ctx.strokeStyle = 'rgba(60,70,90,0.55)';
    ctx.lineWidth = 2.4;
    ctx.lineCap = 'round';
    for (var i = 0; i < birds.length; i++) {
      var b = birds[i];
      var x = (b.x + time * 0.001 * b.sp) % (W + 200) - 100;
      var y = b.y + Math.sin(time * 0.001 + b.ph) * 8;
      var flap = Math.sin(time * 0.006 + b.ph) * 4 * b.sc;
      ctx.beginPath();
      ctx.moveTo(x - 11 * b.sc, y - 2 + flap);
      ctx.quadraticCurveTo(x - 4 * b.sc, y + 3, x, y);
      ctx.quadraticCurveTo(x + 4 * b.sc, y + 3, x + 11 * b.sc, y - 2 + flap);
      ctx.stroke();
    }
    // a distant flock drifting across in a loose V, smaller and fainter
    var fx = (time * 0.013) % (W + 380) - 190;
    var fy = 98 + Math.sin(time * 0.0004) * 10;
    ctx.strokeStyle = 'rgba(72,82,102,0.32)';
    ctx.lineWidth = 1.5;
    for (var k = 0; k < flock.length; k++) {
      var bf = flock[k];
      var bx = fx + bf.dx, by = fy + bf.dy;
      var fl2 = Math.sin(time * 0.007 + bf.ph) * 2.1;
      ctx.beginPath();
      ctx.moveTo(bx - 5, by - 1 + fl2);
      ctx.quadraticCurveTo(bx, by + 1.5, bx, by);
      ctx.quadraticCurveTo(bx, by + 1.5, bx + 5, by - 1 + fl2);
      ctx.stroke();
    }
  }

  function drawHills(colorP) {
    // distant mountains — hazy, pale, bluish (atmospheric perspective)
    var mtn = blend3([150, 12, 70], [150, 22, 63], colorP);
    var mg = ctx.createLinearGradient(0, 398, 0, 492);
    mg.addColorStop(0, hsl(mtn[0], mtn[1], mtn[2] + 6));
    mg.addColorStop(1, hsl(mtn[0], mtn[1] - 4, mtn[2] - 3));
    ctx.fillStyle = mg;
    ctx.beginPath();
    ctx.moveTo(0, 452);
    ctx.quadraticCurveTo(240, 398, 470, 440);
    ctx.quadraticCurveTo(700, 470, 940, 430);
    ctx.quadraticCurveTo(1230, 392, 1450, 444);
    ctx.quadraticCurveTo(1540, 456, 1600, 448);
    ctx.lineTo(W, 496); ctx.lineTo(0, 496);
    ctx.closePath(); ctx.fill();

    var far = blend3(HILLFAR_DULL, pal.hillFar, colorP);
    var near = blend3(HILLNEAR_DULL, pal.hillNear, colorP);

    // far hills, with a soft vertical gradient
    var fg = ctx.createLinearGradient(0, 440, 0, 522);
    fg.addColorStop(0, hsl(far[0], far[1], far[2] + 7));
    fg.addColorStop(1, hsl(far[0], far[1], far[2] - 4));
    ctx.fillStyle = fg;
    ctx.beginPath();
    ctx.moveTo(0, 478);
    ctx.quadraticCurveTo(180, 380, 420, 452);
    ctx.quadraticCurveTo(600, 500, 820, 462);
    ctx.quadraticCurveTo(1100, 398, 1340, 458);
    ctx.quadraticCurveTo(1480, 488, 1600, 470);
    ctx.lineTo(W, 520); ctx.lineTo(0, 520);
    ctx.closePath(); ctx.fill();

    // near rolling field band, gradient-shaded
    var ng = ctx.createLinearGradient(0, 486, 0, GROUND + 4);
    ng.addColorStop(0, hsl(near[0], near[1], near[2] + 6));
    ng.addColorStop(1, hsl(near[0], near[1], near[2] - 5));
    ctx.fillStyle = ng;
    ctx.beginPath();
    ctx.moveTo(0, 500);
    ctx.quadraticCurveTo(400, 470, 800, 492);
    ctx.quadraticCurveTo(1200, 512, 1600, 486);
    ctx.lineTo(W, GROUND + 4); ctx.lineTo(0, GROUND + 4);
    ctx.closePath(); ctx.fill();

    // foreground meadow
    var gr = blend3(GRASS_DULL, pal.grass, colorP);
    var g = ctx.createLinearGradient(0, 495, 0, GROUND + 4);
    g.addColorStop(0, hsl(gr[0], gr[1], gr[2] + 8));
    g.addColorStop(1, hsl(gr[0], gr[1], gr[2] - 4));
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.moveTo(0, 512);
    ctx.quadraticCurveTo(500, 492, 900, 506);
    ctx.quadraticCurveTo(1280, 518, 1600, 502);
    ctx.lineTo(W, GROUND + 4); ctx.lineTo(0, GROUND + 4);
    ctx.closePath(); ctx.fill();

    // soft pools of sunlight across the meadow (fade out as the scene withers)
    if (colorP > 0.02) {
      var dapN = 5;
      for (var d = 0; d < dapN; d++) {
        var dx = (d + 0.5) / dapN * W + Math.sin(d * 1.7) * 60;
        var pool = ctx.createRadialGradient(dx, 536, 8, dx, 536, 150);
        pool.addColorStop(0, 'rgba(255,241,198,' + (0.10 * colorP).toFixed(3) + ')');
        pool.addColorStop(1, 'rgba(255,241,198,0)');
        ctx.fillStyle = pool;
        ctx.fillRect(dx - 150, 500, 300, GROUND - 496);
      }
    }
  }

  function drawSoil(soilP, time) {
    var g = ctx.createLinearGradient(0, GROUND, 0, H);
    g.addColorStop(0, '#7d5a3c');
    g.addColorStop(0.5, '#63452a');
    g.addColorStop(1, '#46301c');
    ctx.fillStyle = g;
    ctx.fillRect(0, GROUND, W, H - GROUND);
    // the soil enriches as beliefs/values feed it
    if (soilP > 0.01) {
      var rich = ctx.createRadialGradient(BASEX, GROUND + 40, 20, BASEX, GROUND + 40, 200 + soilP * 480);
      rich.addColorStop(0, 'rgba(82,52,24,' + (0.55 * soilP).toFixed(3) + ')');
      rich.addColorStop(1, 'rgba(82,52,24,0)');
      ctx.fillStyle = rich;
      ctx.fillRect(0, GROUND, W, H - GROUND);
    }
    // strata
    ctx.strokeStyle = 'rgba(30,18,8,0.10)';
    ctx.lineWidth = 3;
    for (var s = 0; s < strata.length; s++) {
      ctx.beginPath();
      for (var i = 0; i < strata[s].length; i++) {
        var p = strata[s][i];
        if (i === 0) ctx.moveTo(p.x, p.y); else ctx.lineTo(p.x, p.y);
      }
      ctx.stroke();
    }
    // pebbles
    for (var pb = 0; pb < pebbles.length; pb++) {
      var st2 = pebbles[pb];
      ctx.fillStyle = st2.tone < 0.5 ? 'rgba(36,24,12,0.30)' : 'rgba(190,160,120,0.22)';
      ctx.beginPath();
      ctx.ellipse(st2.x, st2.y, st2.rx, st2.ry, st2.rot, 0, TAU);
      ctx.fill();
    }
    // glowing specks: beliefs and values working through the soil
    if (soilP > 0.01) {
      for (var sk = 0; sk < soilSpecks.length; sk++) {
        var spk = soilSpecks[sk];
        var reach = clamp(soilP * 1.5 - spk.d / 460, 0, 1);
        if (reach <= 0) continue;
        var tw = 0.55 + 0.45 * Math.sin(time * 0.0018 + spk.ph);
        ctx.fillStyle = 'rgba(240,198,106,' + (0.55 * reach * tw).toFixed(3) + ')';
        ctx.beginPath();
        ctx.arc(spk.x, spk.y, spk.r * reach, 0, TAU);
        ctx.fill();
      }
    }
    // top edge
    ctx.fillStyle = 'rgba(38,26,14,0.55)';
    ctx.fillRect(0, GROUND, W, 5);
  }

  // dying branches sag downward. A pure function of position, so a parent's
  // endpoint and its child's start (the same x,y) move together and stay joined.
  function droopY(x, y) {
    if (curWilt <= 0.001) return 0;
    var h = clamp((GROUND - y) / 230, 0, 1.9);   // 0 at the ground, ~1.9 at the canopy top
    return curWilt * 20 * h * h;                   // quadratic: tips and crown sag most
  }

  function drawWood(node, prog, maxDist, isRoot) {
    var f = clamp((prog * maxDist - node.startDist) / node.len, 0, 1);
    if (f <= 0) return;
    // once the tree is dead, outer branches snap off (and take their twigs with them)
    if (!isRoot && curWilt > 0.82 && node.depth >= 3 && node.brk < (curWilt - 0.82) / 0.18 * 0.6) return;
    var pts = node.pts, n = pts.length - 1, fn = f * n;
    var colArr = isRoot ? ROOTC : BARK;
    var bark = colArr[Math.min(colArr.length - 1, node.depth)];
    // dying wood darkens to brown, then weathers to silvery-grey deadwood (a snag)
    var deadCol = curWilt < 0.7
      ? mixHex(bark, '#473f36', curWilt / 0.7)
      : mixHex('#473f36', '#7c746a', (curWilt - 0.7) / 0.3);
    ctx.strokeStyle = isRoot ? bark : deadCol;
    ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    for (var i = 0; i < fn; i++) {
      var tEnd = Math.min(1, fn - i);
      var u = (i + tEnd) / n;
      var w = lerp(node.w0, node.w1, u);
      if (!isRoot && node.depth === 0) w += node.w0 * 0.7 * Math.max(0, 1 - u * 5); // base flare
      ctx.lineWidth = Math.max(0.9, w);
      var ax = pts[i].x, ay = pts[i].y + (isRoot ? 0 : droopY(pts[i].x, pts[i].y));
      var bx = lerp(pts[i].x, pts[i + 1].x, tEnd), bry = lerp(pts[i].y, pts[i + 1].y, tEnd);
      var by = bry + (isRoot ? 0 : droopY(bx, bry));
      ctx.beginPath();
      ctx.moveTo(ax, ay);
      ctx.lineTo(bx, by);
      ctx.stroke();
    }
    // bark streaks become darker, wider cracks as the tree dies
    if (f > 0.08 && node.streaks.length) {
      for (var s = 0; s < node.streaks.length; s++) {
        var stk = node.streaks[s];
        ctx.strokeStyle = stk.dark
          ? 'rgba(32,20,11,' + (0.30 + 0.5 * curWilt).toFixed(3) + ')'
          : 'rgba(255,226,180,' + (0.16 * (1 - curWilt)).toFixed(3) + ')';
        ctx.lineWidth = 1.5 + curWilt * 1.6;
        ctx.beginPath();
        var started = false;
        for (var j = 0; j < stk.pts.length; j++) {
          var sp = stk.pts[j];
          if (sp.u > f) break;
          var spy = sp.y + droopY(sp.x, sp.y);
          if (!started) { ctx.moveTo(sp.x, spy); started = true; }
          else ctx.lineTo(sp.x, spy);
        }
        if (started) ctx.stroke();
      }
    }
    // near death: loose strips of bark hang and droop off the thick wood
    if (!isRoot && curWilt > 0.72 && node.depth <= 1 && node.w0 > 10 && f > 0.5) {
      var flapA = (curWilt - 0.72) / 0.28;
      ctx.strokeStyle = mixHex(bark, '#352e26', 0.7);
      ctx.lineWidth = 2;
      for (var fl = 0; fl < 3; fl++) {
        var ut = 0.32 + fl * 0.2;
        if (ut > f) continue;
        var pp = pointAt(pts, ut), ppy = pp.y + droopY(pp.x, pp.y);
        var side = fl % 2 === 0 ? 1 : -1;
        var hx = pp.x + side * lerp(node.w0, node.w1, ut) * 0.5;
        ctx.beginPath();
        ctx.moveTo(hx, ppy);
        ctx.quadraticCurveTo(hx + side * 3, ppy + 9 * flapA, hx + side * 1.5, ppy + 18 * flapA);
        ctx.stroke();
      }
    }
    // peeling bark exposes pale, weathered sapwood patches on the dying trunk
    if (!isRoot && curWilt > 0.55 && node.depth <= 1 && node.w0 > 9 && f > 0.3) {
      var peel = clamp((curWilt - 0.55) / 0.45, 0, 1);
      ctx.fillStyle = mixHex('#8d8274', '#bcb19c', peel);
      for (var pw = 0; pw < 3; pw++) {
        var pu = 0.26 + pw * 0.22;
        if (pu > f) continue;
        var ppt = pointAt(pts, pu), ppy2 = ppt.y + droopY(ppt.x, ppt.y);
        var pside = pw % 2 === 0 ? -1 : 1;
        var pwid = lerp(node.w0, node.w1, pu);
        ctx.save();
        ctx.globalAlpha = 0.55 * peel;
        ctx.beginPath();
        ctx.ellipse(ppt.x + pside * pwid * 0.16, ppy2, pwid * 0.24, 7 + 6 * peel, pside * 0.22, 0, TAU);
        ctx.fill();
        ctx.restore();
      }
    }
    // deep decay: dark rot hollows open on the dead trunk (the snag)
    if (!isRoot && curWilt > 0.8 && node.depth === 0 && f > 0.4) {
      var hn = (curWilt - 0.8) / 0.2;
      ctx.fillStyle = 'rgba(18,14,10,' + (0.45 * hn).toFixed(3) + ')';
      for (var hh = 0; hh < 2; hh++) {
        var hu = 0.34 + hh * 0.3;
        if (hu > f) continue;
        var hp = pointAt(pts, hu), hpy = hp.y + droopY(hp.x, hp.y);
        ctx.beginPath();
        ctx.ellipse(hp.x + (hh ? 4 : -5), hpy, 3.5 + 2.5 * hn, 6 + 4 * hn, hh ? 0.3 : -0.3, 0, TAU);
        ctx.fill();
      }
    }
    for (var c = 0; c < node.children.length; c++) drawWood(node.children[c], prog, maxDist, isRoot);
  }

  function drawLeaves(time, leafP, colorP) {
    if (leafP <= 0) return;
    var cls = tree.clusters;
    var anim = vit;                                 // foliage stills as the tree dies
    var thin = Math.max(0, 1 - curWilt * 1.05);     // canopy thins toward bare
    for (var i = 0; i < cls.length; i++) {
      var cl = cls[i];
      var order = cl.dist / tree.maxDist;
      var f = clamp((leafP * 1.45 - order * 0.45), 0, 1);
      if (f <= 0) continue;
      var pop = easeOutBack(f);
      var clx = cl.x, cly = cl.y + droopY(cl.x, cl.y);   // canopy droops with the branches
      var lean = windX * (12 + (GROUND - cl.y) * 0.05) * anim;
      var swx = (Math.sin(time * 0.0011 + cl.ph) * 2.6 + windX * Math.sin(time * 0.004 + cl.ph) * 3) * anim + lean;
      var swy = (Math.cos(time * 0.0009 + cl.ph * 1.7) * 1.6 + windY * 7) * anim;
      var nB = Math.round(cl.blobs.length * density * thin);
      nB = Math.min(nB, cl.blobs.length);
      for (var b = 0; b < nB; b++) {
        var bl = cl.blobs[b];
        // healthy base colour greens in as the canopy grows (leafP), golden pop with colorP
        var cF = clamp(Math.max(colorP * 1.5 - bl.h * 0.5, leafP * 1.25 - bl.h * 0.4), 0, 1);
        var col;
        if (cF > 0.25 && bl.acc < pal.accentChance) {
          var ai = Math.floor(bl.acc / pal.accentChance * pal.accents.length) % pal.accents.length;
          col = blend3(BUD, pal.accents[ai], cF);
        } else {
          var targ = [lerp(pal.h0, pal.h1, bl.h), lerp(pal.s0, pal.s1, bl.s), lerp(pal.l0, pal.l1, bl.l)];
          col = blend3(BUD, targ, cF);
        }
        // decline cue: leaves change colour as vitality drops (they fall too — gated in the UI)
        if (curWilt > 0.001) {
          var wv = clamp(curWilt * (0.85 + 0.5 * bl.acc), 0, 1);
          var aH, aS, aL;
          if (wv < 0.5) { var uu = wv / 0.5; aH = lerp(54, 32, uu); aS = lerp(70, 76, uu); aL = lerp(52, 44, uu); }
          else { var u2 = (wv - 0.5) / 0.5; aH = lerp(32, 24, u2); aS = lerp(76, 28, u2); aL = lerp(44, 27, u2); }
          col = blend3(col, [aH, aS, aL], Math.min(1, wv * 1.9));
        }
        var r = bl.r * pop * (0.74 + 0.34 * cF);
        if (r < 0.5) continue;
        ctx.fillStyle = hsl(col[0], col[1], col[2]);
        ctx.beginPath();
        ctx.ellipse(clx + bl.dx + swx + Math.sin(time * 0.0014 + bl.ph) * 1.4 * anim,
          cly + bl.dy + swy, r, r * 0.84, 0, 0, TAU);
        ctx.fill();
      }
    }
    // sun dapple on the canopy — only while it is alive and leafy
    if (colorP > 0.05 && vit > 0.4) {
      var cp = tree.canopy;
      ctx.save();
      ctx.globalCompositeOperation = 'lighter';
      var dap = ctx.createRadialGradient(cp.x + cp.r * 0.35, cp.y - cp.r * 0.4, 10, cp.x + cp.r * 0.35, cp.y - cp.r * 0.4, cp.r * 0.95);
      dap.addColorStop(0, 'rgba(255,232,150,' + (mood.dapple * colorP * vit).toFixed(3) + ')');
      dap.addColorStop(1, 'rgba(255,232,150,0)');
      ctx.fillStyle = dap;
      ctx.fillRect(cp.x - cp.r, cp.y - cp.r * 1.3, cp.r * 2.2, cp.r * 2.2);
      ctx.restore();
    }
  }

  function drawSeed(rootP, soilP, trunkP) {
    var husk = 1 - clamp(trunkP * 1.8, 0, 0.85);
    if (husk <= 0.01) return;
    ctx.save();
    ctx.globalAlpha = husk;
    var split = smooth(clamp(rootP * 2.2, 0, 1)) * 6;
    // soil pocket around the seed so it reads at a glance
    ctx.fillStyle = 'rgba(30,19,9,0.35)';
    ctx.beginPath(); ctx.ellipse(BASEX, GROUND + 30, 30, 22, 0, 0, TAU); ctx.fill();
    ctx.fillStyle = '#926c40';
    ctx.strokeStyle = '#5e4326';
    ctx.lineWidth = 1.6;
    // two halves
    ctx.beginPath(); ctx.ellipse(BASEX - 6 - split, GROUND + 28, 10, 15, -0.35, 0, TAU); ctx.fill(); ctx.stroke();
    ctx.beginPath(); ctx.ellipse(BASEX + 6 + split, GROUND + 28, 10, 15, 0.35, 0, TAU); ctx.fill(); ctx.stroke();
    // highlight
    ctx.fillStyle = 'rgba(255,226,170,0.35)';
    ctx.beginPath(); ctx.ellipse(BASEX - 8 - split, GROUND + 23, 3.5, 6, -0.35, 0, TAU); ctx.fill();
    ctx.restore();
    // first sprout pokes out as the soil feeds it
    var sp = smooth(clamp((soilP - 0.55) * 3.2, 0, 1)) * (1 - clamp(trunkP * 3, 0, 1));
    if (sp > 0.01) {
      ctx.strokeStyle = '#7fae4e'; ctx.lineWidth = 3.4; ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(BASEX, GROUND + 14);
      ctx.quadraticCurveTo(BASEX + 2, GROUND + 4 - 12 * sp, BASEX - 1, GROUND + 2 - 22 * sp);
      ctx.stroke();
      ctx.fillStyle = '#8cbe57';
      ctx.beginPath(); ctx.ellipse(BASEX - 7 * sp, GROUND - 22 * sp, 7 * sp, 4 * sp, -0.5, 0, TAU); ctx.fill();
      ctx.beginPath(); ctx.ellipse(BASEX + 6 * sp, GROUND - 24 * sp, 7 * sp, 4 * sp, 0.5, 0, TAU); ctx.fill();
    }
  }

  function drawShadow(trunkP, leafP) {
    if (trunkP <= 0.02) return;
    var rx = (40 + trunkP * 50 + leafP * 175) * growthScale; // shadow grows with the crown
    ctx.fillStyle = 'rgba(40,55,28,' + (0.16 * trunkP).toFixed(3) + ')';
    ctx.beginPath();
    ctx.ellipse(BASEX - rx * 0.30, GROUND - 2, rx, (9 + leafP * 9) * growthScale, 0, 0, TAU);
    ctx.fill();
  }

  function drawGrass(time, colorP) {
    var gr = blend3(GRASS_DULL, pal.grass, colorP);
    ctx.lineCap = 'round';
    for (var i = 0; i < blades.length; i++) {
      var b = blades[i];
      var sway = Math.sin(time * 0.0013 + b.ph) * 2.2 + windX * 7;
      ctx.strokeStyle = hsl(gr[0] + (b.tone - 0.5) * 16, gr[1], gr[2] - 8 + b.tone * 16);
      ctx.lineWidth = 1.7;
      ctx.beginPath();
      ctx.moveTo(b.x, b.y);
      ctx.quadraticCurveTo(b.x + b.lean * 0.4 + windX * 3, b.y - b.len * 0.6, b.x + b.lean + sway, b.y - b.len);
      ctx.stroke();
    }
  }

  function drawButterflies(time, colorP) {
    var a = clamp((colorP - 0.45) * 2.2, 0, 1) * vit;
    if (a <= 0) return;
    var cp = tree.canopy;
    ctx.save();
    ctx.globalAlpha = a;
    for (var i = 0; i < butterflies.length; i++) {
      var bf = butterflies[i];
      var tt = time * 0.001 * bf.sp + bf.ph;
      var x = cp.x + Math.cos(tt) * (cp.r * 0.5 + bf.rx * 0.5) + windX * 24;
      var y = cp.y + Math.sin(tt * 1.7) * bf.ry - 20 + windY * 10;
      var flap = Math.abs(Math.sin(time * 0.012 + bf.ph * 3));
      var wr = 7;
      ctx.fillStyle = bf.col;
      ctx.beginPath(); ctx.ellipse(x - wr * 0.7 * flap - 1, y, wr * flap, wr * 0.62, -0.5, 0, TAU); ctx.fill();
      ctx.fillStyle = bf.col2;
      ctx.beginPath(); ctx.ellipse(x + wr * 0.7 * flap + 1, y, wr * flap, wr * 0.62, 0.5, 0, TAU); ctx.fill();
      ctx.strokeStyle = '#3a2c1c'; ctx.lineWidth = 2; ctx.lineCap = 'round';
      ctx.beginPath(); ctx.moveTo(x, y - 4); ctx.lineTo(x, y + 4); ctx.stroke();
    }
    ctx.restore();
  }

  // wildflowers in the meadow — bloom as the scene comes to life, gone when withered
  function drawFlowers(time, colorP) {
    var vis = clamp(colorP * 1.25 - 0.12, 0, 1) * vit;
    if (vis <= 0.02) return;
    ctx.lineCap = 'round';
    for (var i = 0; i < flowers.length; i++) {
      var f = flowers[i];
      var sway = Math.sin(time * 0.0014 + f.ph) * 2 + windX * 6;
      var tx = f.x + f.lean + sway, ty = f.base - f.stem;
      ctx.strokeStyle = 'rgba(74,118,58,' + (0.7 * vis).toFixed(3) + ')';
      ctx.lineWidth = 1.4;
      ctx.beginPath();
      ctx.moveTo(f.x, f.base);
      ctx.quadraticCurveTo(f.x + f.lean * 0.4 + windX * 3, f.base - f.stem * 0.6, tx, ty);
      ctx.stroke();
      var c = f.col;
      ctx.fillStyle = hsl(c[0], c[1], c[2], 0.92 * vis);
      for (var pp = 0; pp < 5; pp++) {
        var a = pp / 5 * TAU + f.ph;
        ctx.beginPath();
        ctx.arc(tx + Math.cos(a) * f.r, ty + Math.sin(a) * f.r, f.r * 0.6, 0, TAU);
        ctx.fill();
      }
      ctx.fillStyle = hsl(46, 90, 60, 0.95 * vis);
      ctx.beginPath();
      ctx.arc(tx, ty, f.r * 0.55, 0, TAU);
      ctx.fill();
    }
  }

  // pollen/dust motes drifting in the light — subtle, gated by how alive the scene is
  function drawMotes(time, colorP) {
    var vis = clamp(colorP * 1.1 - 0.05, 0, 0.8) * vit;
    if (vis <= 0.02) return;
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    for (var i = 0; i < motes.length; i++) {
      var m = motes[i];
      var mx = m.x + Math.sin(time * 0.0003 * m.sp + m.ph) * m.amp + windX * 18;
      var my = m.y + Math.cos(time * 0.00026 * m.sp + m.ph * 1.3) * (m.amp * 0.5) + windY * 8;
      var tw = 0.5 + 0.5 * Math.sin(time * 0.002 + m.ph);
      ctx.fillStyle = 'rgba(255,240,200,' + (0.5 * vis * tw).toFixed(3) + ')';
      ctx.beginPath();
      ctx.arc(mx, my, m.r, 0, TAU);
      ctx.fill();
    }
    ctx.restore();
  }

  // spawn a burst of leaves that drift down — fired on harmful choices
  function spawnFallingLeaves(intensity) {
    var cls = tree.clusters;
    if (!cls.length) return;
    var n = Math.round(6 * (intensity || 1));
    for (var i = 0; i < n; i++) {
      var cl = cls[(Math.random() * cls.length) | 0];
      var ch = lerp(pal.h0, pal.h1, Math.random()), cs = lerp(pal.s0, pal.s1, Math.random()), clt = lerp(pal.l0, pal.l1, Math.random());
      if (curWilt > 0.001) { // shed leaves match the discoloured canopy
        var ww = clamp(curWilt * (0.85 + 0.4 * Math.random()), 0, 1), m = Math.min(1, ww * 1.9);
        var bh = ww < 0.5 ? lerp(54, 32, ww / 0.5) : lerp(32, 24, (ww - 0.5) / 0.5);
        var bs = ww < 0.5 ? lerp(70, 76, ww / 0.5) : lerp(76, 28, (ww - 0.5) / 0.5);
        var bl2 = ww < 0.5 ? lerp(52, 44, ww / 0.5) : lerp(44, 27, (ww - 0.5) / 0.5);
        ch = hueLerp(ch, bh, m); cs = lerp(cs, bs, m); clt = lerp(clt, bl2, m);
      }
      var col = hsl(ch, cs, clt);
      // map the canopy point (local, drooped) into on-screen space (the crown is scaled)
      var lx = cl.x + (Math.random() - 0.5) * cl.r * 1.4;
      var ly = cl.y + droopY(cl.x, cl.y) + (Math.random() - 0.5) * cl.r * 1.0;
      fallingLeaves.push({
        x: BASEX + (lx - BASEX) * growthScale,
        y: GROUND + (ly - GROUND) * growthScale,
        vx: (Math.random() - 0.5) * 10,
        vy: 16 + Math.random() * 20,
        rot: Math.random() * TAU,
        rotV: (Math.random() - 0.5) * 1.6,
        r: (4 + Math.random() * 4) * growthScale,
        sway: Math.random() * TAU,
        life: 1,
        col: col
      });
    }
  }

  function drawFallingLeaves(dt, time) {
    if (!fallingLeaves.length) return;
    for (var i = fallingLeaves.length - 1; i >= 0; i--) {
      var p = fallingLeaves[i];
      p.x += (p.vx + Math.sin(time * 0.002 + p.sway) * 9 + windX * 26) * dt;
      p.y += (p.vy + windY * 12) * dt;
      p.vy = Math.min(p.vy + 26 * dt, 64); // gentle gravity toward a slow terminal drift
      p.rot += p.rotV * dt;
      p.life -= dt * 0.32;
      if (p.y > GROUND + 16 || p.life <= 0) { fallingLeaves.splice(i, 1); continue; }
      ctx.save();
      ctx.globalAlpha = clamp(p.life, 0, 1) * 0.9;
      ctx.translate(p.x, p.y);
      ctx.rotate(p.rot);
      ctx.fillStyle = p.col;
      ctx.beginPath();
      ctx.ellipse(0, 0, p.r, p.r * 0.6, 0, 0, TAU);
      ctx.fill();
      ctx.restore();
    }
  }

  // a brief upward shimmer of warm motes — reward for a healthy/leadership choice
  function drawHealPulse(dt, time) {
    if (healPulse <= 0.01) return;
    healPulse = Math.max(0, healPulse - dt * 0.8);
    var cp = tree.canopy;
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    for (var i = 0; i < 12; i++) {
      var a = (i / 12) * TAU + time * 0.0005;
      var rr = cp.r * (0.28 + 0.62 * ((i * 0.17) % 1));
      var mx = cp.x + Math.cos(a) * rr;
      var my = cp.y + Math.sin(a) * rr * 0.7 - (1 - healPulse) * 34;
      ctx.fillStyle = 'rgba(255,224,140,' + (0.5 * healPulse).toFixed(3) + ')';
      ctx.beginPath();
      ctx.arc(mx, my, 3.2, 0, TAU);
      ctx.fill();
    }
    ctx.restore();
  }

  // ---- watering: two ground sprinklers spray arcs of water at the trunk on growth ----
  // heads sit on the meadow flanking the base; each throws a fan of droplets inward,
  // the arcs crossing over the root zone so it clearly reads as "watering the tree".
  var SPRINKLERS = [
    { x: BASEX - 138, dir: 1 },   // left head, sprays up-and-right toward the trunk
    { x: BASEX + 138, dir: -1 }   // right head, sprays up-and-left toward the trunk
  ];
  var WATER_G = 1100; // px/s² gravity on the droplets

  function spawnWater() { waterPulse = 1; soilMoist = 1; }

  function emitWater(dt) {
    if (waterPulse <= 0.2 || waterDrops.length > 230) return; // emit during the active phase
    waterEmit += dt * 150; // ~150 droplets/sec across both heads
    while (waterEmit >= 1) {
      waterEmit -= 1;
      var hd = SPRINKLERS[(Math.random() * SPRINKLERS.length) | 0];
      waterDrops.push({
        x: hd.x + hd.dir * (2 + Math.random() * 6), y: GROUND - 7,
        vx: hd.dir * (95 + Math.random() * 175),     // inward, toward the trunk
        vy: -(395 + Math.random() * 205)             // launched upward into an arc
      });
    }
  }

  function drawWater(dt) {
    emitWater(dt);
    if (soilMoist > 0.001) soilMoist = Math.max(0, soilMoist - dt * 0.32);
    if (waterPulse > 0.001) waterPulse = Math.max(0, waterPulse - dt * 0.4);

    // wet, darkened ground across the watered band, with a faint sheen line
    if (soilMoist > 0.01) {
      var mg = ctx.createLinearGradient(0, GROUND, 0, GROUND + 64);
      mg.addColorStop(0, 'rgba(33,20,9,' + (0.30 * soilMoist).toFixed(3) + ')');
      mg.addColorStop(1, 'rgba(33,20,9,0)');
      ctx.fillStyle = mg;
      ctx.fillRect(BASEX - 210, GROUND, 420, 64);
      ctx.fillStyle = 'rgba(184,212,226,' + (0.07 * soilMoist).toFixed(3) + ')';
      ctx.fillRect(BASEX - 198, GROUND, 396, 3);
    }

    // ballistic droplets — each arcs up from a head and falls back to the meadow
    ctx.lineCap = 'round';
    for (var i = waterDrops.length - 1; i >= 0; i--) {
      var d = waterDrops[i];
      d.vy += WATER_G * dt;
      d.x += (d.vx + windX * 8) * dt;
      d.y += d.vy * dt;
      if (d.y >= GROUND - 1 && d.vy > 0) {
        waterSplashes.push({ x: d.x, y: GROUND - 1, r: 1, life: 1 });
        waterDrops.splice(i, 1);
        continue;
      }
      var spd = Math.max(1, Math.hypot(d.vx, d.vy)), ux = d.vx / spd, uy = d.vy / spd; // streak along travel
      ctx.strokeStyle = 'rgba(170,212,238,0.72)';
      ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(d.x - ux * 5, d.y - uy * 5); ctx.lineTo(d.x, d.y); ctx.stroke();
      ctx.fillStyle = 'rgba(226,242,250,0.9)';
      ctx.beginPath(); ctx.arc(d.x, d.y, 1.7, 0, TAU); ctx.fill();
    }

    // splash rings where droplets land
    for (var s = waterSplashes.length - 1; s >= 0; s--) {
      var ws = waterSplashes[s];
      ws.r += 30 * dt; ws.life -= dt * 2.4;
      if (ws.life <= 0) { waterSplashes.splice(s, 1); continue; }
      ctx.strokeStyle = 'rgba(175,216,238,' + (0.5 * ws.life).toFixed(3) + ')';
      ctx.lineWidth = 1.3;
      ctx.beginPath(); ctx.ellipse(ws.x, ws.y, ws.r, ws.r * 0.4, 0, 0, TAU); ctx.stroke();
    }

    // the sprinkler heads, fading in/out with the watering pulse
    var ha = clamp(waterPulse * 2.2, 0, 1);
    if (ha > 0.01) {
      for (var h = 0; h < SPRINKLERS.length; h++) {
        var sk = SPRINKLERS[h];
        ctx.save();
        ctx.globalAlpha = ha;
        ctx.strokeStyle = '#3c4a4f'; ctx.lineWidth = 3; ctx.lineCap = 'round';
        ctx.beginPath(); ctx.moveTo(sk.x, GROUND + 7); ctx.lineTo(sk.x, GROUND - 7); ctx.stroke();
        ctx.fillStyle = '#566a70';
        ctx.beginPath(); ctx.ellipse(sk.x, GROUND - 8, 5, 4, 0, 0, TAU); ctx.fill();
        ctx.fillStyle = '#869da3';
        ctx.beginPath(); ctx.ellipse(sk.x + sk.dir * 1.5, GROUND - 9, 2.4, 2, 0, 0, TAU); ctx.fill();
        ctx.restore();
      }
    }
  }

  // ---- branches snap off and tumble down as the dead tree comes apart ----
  function spawnFallingBranches(intensity) {
    var cls = tree.clusters;
    if (!cls.length) return;
    var n = Math.round(2 + 2 * (intensity || 1));
    for (var i = 0; i < n; i++) {
      var cl = cls[(Math.random() * cls.length) | 0];
      var lx = cl.x + (Math.random() - 0.5) * 40, ly = cl.y + droopY(cl.x, cl.y);
      fallingBranches.push({
        x: BASEX + (lx - BASEX) * growthScale, y: GROUND + (ly - GROUND) * growthScale,
        vx: (Math.random() - 0.5) * 26, vy: 28 + Math.random() * 30,
        rot: Math.random() * TAU, rotV: (Math.random() - 0.5) * 3,
        len: (20 + Math.random() * 26) * growthScale, wid: (2.5 + Math.random() * 2) * growthScale,
        bend: (Math.random() - 0.5) * 0.6, twig: Math.random() < 0.6
      });
    }
  }
  function drawFallingBranches(dt) {
    if (!fallingBranches.length) return;
    ctx.lineCap = 'round';
    for (var i = fallingBranches.length - 1; i >= 0; i--) {
      var p = fallingBranches[i];
      p.x += (p.vx + windX * 16) * dt; p.y += p.vy * dt;
      p.vy = Math.min(p.vy + 70 * dt, 150); p.rot += p.rotV * dt;
      if (p.y >= GROUND - 1) { fallingBranches.splice(i, 1); continue; } // joins the ground litter
      ctx.save();
      ctx.translate(p.x, p.y); ctx.rotate(p.rot);
      ctx.strokeStyle = '#6f6253'; ctx.lineWidth = p.wid;
      ctx.beginPath(); ctx.moveTo(-p.len * 0.5, 0); ctx.quadraticCurveTo(0, p.bend * 14, p.len * 0.5, 0); ctx.stroke();
      if (p.twig) {
        ctx.lineWidth = p.wid * 0.6;
        ctx.beginPath(); ctx.moveTo(p.len * 0.1, 0); ctx.lineTo(p.len * 0.3, -p.len * 0.28); ctx.stroke();
      }
      ctx.restore();
    }
  }

  // ---- the "spark": lightning strike + embers + scorch (Point 1 metaphor) ----
  function spawnSpark() {
    var tx = BASEX + (Math.random() - 0.5) * 60;
    var ty = GROUND - 430 * growthScale;   // roughly the crown top
    // a jagged bolt from the sky to the crown, precomputed so it holds during the flash
    var pts = [{ x: tx + (Math.random() - 0.5) * 40, y: -10 }];
    for (var i = 1; i <= 7; i++) {
      var f = i / 7;
      pts.push({ x: lerp(pts[0].x, tx, f) + (Math.random() - 0.5) * 60 * (1 - f), y: lerp(-10, ty, f) });
    }
    sparkBolt = pts;
    flash = 1; scorch = 1; embers = []; flames = [];
    for (var e = 0; e < 26; e++) {
      embers.push({
        x: tx + (Math.random() - 0.5) * 160 * growthScale,
        y: ty + Math.random() * 220 * growthScale,
        vx: (Math.random() - 0.5) * 18, vy: -20 - Math.random() * 34,
        r: 1.4 + Math.random() * 2.2, life: 1, decay: 0.28 + Math.random() * 0.3
      });
    }
    // flames catching across the crown and up the trunk — the strike sets the tree alight
    var cyF = GROUND - 300 * growthScale, crF = 190 * growthScale;
    for (var gf = 0; gf < 16; gf++) {
      var fx, fy;
      if (gf % 4 === 0) { fx = BASEX + (Math.random() - 0.5) * 34 * growthScale; fy = GROUND - Math.random() * 250 * growthScale; }
      else { var an = Math.random() * TAU, rd = Math.sqrt(Math.random()) * crF; fx = BASEX + Math.cos(an) * rd; fy = cyF + Math.sin(an) * rd * 0.85; }
      flames.push({ x: fx, y: fy, h: (24 + Math.random() * 34) * growthScale, w: (11 + Math.random() * 9) * growthScale, ph: Math.random() * TAU });
    }
    spawnFallingLeaves(8);
    spawnFallingBranches(4);
  }
  function drawFlames(now, sc) {
    if (!flames.length || sc <= 0.05) return;
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    for (var i = 0; i < flames.length; i++) {
      var fl = flames[i];
      var flick = 0.72 + 0.28 * Math.sin(now * 0.02 + fl.ph) + 0.14 * Math.sin(now * 0.037 + fl.ph * 1.7);
      var h = fl.h * Math.max(0.2, flick) * sc, w = fl.w * (0.85 + 0.28 * Math.sin(now * 0.03 + fl.ph));
      var x = fl.x, y = fl.y;
      var g = ctx.createLinearGradient(x, y, x, y - h);
      g.addColorStop(0, 'rgba(255,110,20,' + (0.5 * sc).toFixed(3) + ')');
      g.addColorStop(0.55, 'rgba(255,170,45,' + (0.42 * sc).toFixed(3) + ')');
      g.addColorStop(1, 'rgba(255,240,160,0)');
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.moveTo(x - w / 2, y);
      ctx.quadraticCurveTo(x - w * 0.42, y - h * 0.5, x, y - h);
      ctx.quadraticCurveTo(x + w * 0.42, y - h * 0.5, x + w / 2, y);
      ctx.quadraticCurveTo(x, y + h * 0.12, x - w / 2, y);
      ctx.closePath(); ctx.fill();
    }
    ctx.restore();
  }
  function drawLightning() {
    if (!sparkBolt || flash < 0.55) return;
    ctx.save();
    ctx.strokeStyle = 'rgba(255,255,255,' + clamp((flash - 0.55) / 0.45, 0, 1).toFixed(3) + ')';
    ctx.lineWidth = 3.2; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    ctx.shadowColor = 'rgba(180,210,255,0.9)'; ctx.shadowBlur = 18;
    ctx.beginPath(); ctx.moveTo(sparkBolt[0].x, sparkBolt[0].y);
    for (var i = 1; i < sparkBolt.length; i++) ctx.lineTo(sparkBolt[i].x, sparkBolt[i].y);
    ctx.stroke();
    ctx.restore();
  }
  function drawEmbers(dt) {
    for (var i = embers.length - 1; i >= 0; i--) {
      var p = embers[i];
      p.life -= dt * p.decay;
      if (p.life <= 0) { embers.splice(i, 1); continue; }
      p.x += (p.vx + windX * 10) * dt; p.y += p.vy * dt; p.vy += 8 * dt;
      var a = clamp(p.life, 0, 1);
      ctx.save();
      ctx.globalCompositeOperation = 'lighter';
      ctx.fillStyle = 'rgba(255,' + ((110 + 90 * a) | 0) + ',40,' + (a * 0.9).toFixed(3) + ')';
      ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, TAU); ctx.fill();
      ctx.restore();
    }
  }

  // ---- fruit appears on the crown once the tree is healthy and in full colour ----
  function drawFruit(vitv, colorP) {
    // fruit = the tree bearing the reward of a healthy home; ripens with vitality only,
    // fully present once the tree is thriving (no colour gate — a leafy tree is a fed one).
    var amt = clamp((vitv - 0.8) / 0.16, 0, 1);
    if (amt < 0.05) return;
    var cls = tree.clusters;
    if (!cls.length) return;
    for (var i = 2; i < cls.length; i += 5) {   // a scatter of fruit through the crown
      var c = cls[i];
      var fx = c.x + 3, fy = c.y + droopY(c.x, c.y) + 9;
      ctx.strokeStyle = 'rgba(84,58,36,' + (0.85 * amt).toFixed(3) + ')'; ctx.lineWidth = 1.6; ctx.lineCap = 'round';
      ctx.beginPath(); ctx.moveTo(fx, fy - 6.5); ctx.lineTo(fx + 2, fy - 11); ctx.stroke();
      ctx.fillStyle = 'rgba(206,38,34,' + amt.toFixed(3) + ')';        // a ripe, unmistakable red apple
      ctx.beginPath(); ctx.arc(fx, fy, 7.2, 0, TAU); ctx.fill();
      ctx.fillStyle = 'rgba(150,20,22,' + (0.6 * amt).toFixed(3) + ')'; // shaded underside
      ctx.beginPath(); ctx.arc(fx + 1.6, fy + 1.8, 4.6, 0, TAU); ctx.fill();
      ctx.fillStyle = 'rgba(255,208,198,' + (0.75 * amt).toFixed(3) + ')'; // highlight
      ctx.beginPath(); ctx.arc(fx - 2.4, fy - 2.4, 2.1, 0, TAU); ctx.fill();
    }
  }

  // ---- Orion: a procedural figure whose emotion mirrors the tree's health
  //      (mood: 0 stressed → 1 calm). Asset-free — no image. ----
  function rrect(x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath(); ctx.fill();
  }
  function puff(x, y, r) {
    ctx.beginPath();
    ctx.arc(x - r * 0.7, y, r * 0.6, 0, TAU); ctx.arc(x, y - r * 0.25, r * 0.8, 0, TAU);
    ctx.arc(x + r * 0.75, y, r * 0.6, 0, TAU); ctx.rect(x - r * 0.9, y, r * 1.8, r * 0.7);
    ctx.fill();
  }
  // ---- thought bubble: what is on Orion's mind, drawn procedurally (no images) ----
  function tinyFace(x, y, r, mood) {
    var ink = '#3b2c1f';
    // Features are spaced so brows, eyes and mouth stay separate at this size — the
    // hairline sits at -0.33r, so nothing is drawn over the forehead.
    var bi = mood === 'sad' ? -r * 0.10 : 0;      // inner brow ends lift when sad
    ctx.strokeStyle = ink; ctx.lineWidth = Math.max(1, r * 0.085); ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(x - r * 0.50, y - r * 0.19); ctx.lineTo(x - r * 0.20, y - r * 0.21 + bi); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(x + r * 0.50, y - r * 0.19); ctx.lineTo(x + r * 0.20, y - r * 0.21 + bi); ctx.stroke();
    ctx.fillStyle = ink;                          // eyes
    ctx.beginPath();
    ctx.ellipse(x - r * 0.33, y + r * 0.09, r * 0.115, r * 0.145, 0, 0, TAU);
    ctx.ellipse(x + r * 0.33, y + r * 0.09, r * 0.115, r * 0.145, 0, 0, TAU);
    ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.9)';      // catchlight
    ctx.beginPath();
    ctx.arc(x - r * 0.29, y + r * 0.04, r * 0.042, 0, TAU);
    ctx.arc(x + r * 0.37, y + r * 0.04, r * 0.042, 0, TAU);
    ctx.fill();
    // mouth — canvas y grows downward, so POSITIVE dips into a smile (matches drawAlpha)
    ctx.strokeStyle = ink; ctx.lineWidth = Math.max(1, r * 0.115);
    var mo = mood === 'happy' ? r * 0.34 : (mood === 'sad' ? -r * 0.30 : 0);
    ctx.beginPath();
    ctx.moveTo(x - r * 0.30, y + r * 0.52);
    ctx.quadraticCurveTo(x, y + r * 0.52 + mo, x + r * 0.30, y + r * 0.52);
    ctx.stroke();
    if (mood === 'happy') {                       // a hint of cheek colour
      ctx.fillStyle = 'rgba(220,120,110,0.26)';
      ctx.beginPath();
      ctx.arc(x - r * 0.62, y + r * 0.33, r * 0.15, 0, TAU);
      ctx.arc(x + r * 0.62, y + r * 0.33, r * 0.15, 0, TAU);
      ctx.fill();
    }
  }

  function tinyPerson(x, y, h, mood, shirt, hair, longHair) {
    var hr = h * 0.30, headY = y - h * 0.27;
    var shirtD = mixHex(shirt, '#241a12', 0.34);
    var skin = '#c99163', skinD = '#ab7749';
    if (longHair) {                               // hair falling behind the shoulders
      ctx.fillStyle = hair;
      ctx.beginPath();
      ctx.ellipse(x, headY + hr * 0.58, hr * 1.10, hr * 1.36, 0, 0, TAU);
      ctx.fill();
    }
    ctx.fillStyle = skinD;                        // neck
    ctx.fillRect(x - h * 0.055, headY + hr * 0.55, h * 0.11, h * 0.16);
    ctx.fillStyle = shirt;                        // torso with sloped shoulders
    ctx.beginPath();
    ctx.moveTo(x - h * 0.34, y + h * 0.54);
    ctx.quadraticCurveTo(x - h * 0.36, y + h * 0.11, x - h * 0.16, y + h * 0.015);
    ctx.quadraticCurveTo(x, y - h * 0.03, x + h * 0.16, y + h * 0.015);
    ctx.quadraticCurveTo(x + h * 0.36, y + h * 0.11, x + h * 0.34, y + h * 0.54);
    ctx.closePath(); ctx.fill();
    ctx.fillStyle = shirtD;                       // shaded hem gives the torso some form
    ctx.beginPath();
    ctx.moveTo(x - h * 0.34, y + h * 0.54);
    ctx.quadraticCurveTo(x, y + h * 0.44, x + h * 0.34, y + h * 0.54);
    ctx.lineTo(x + h * 0.34, y + h * 0.56); ctx.lineTo(x - h * 0.34, y + h * 0.56);
    ctx.closePath(); ctx.fill();
    ctx.fillStyle = skin;                         // head
    ctx.beginPath(); ctx.arc(x, headY, hr, 0, TAU); ctx.fill();
    // hair cap over the crown — the chord lands at -0.33r, leaving a clear forehead
    ctx.fillStyle = hair;
    ctx.beginPath(); ctx.arc(x, headY, hr * 1.05, Math.PI + 0.33, TAU - 0.33);
    ctx.closePath(); ctx.fill();
    tinyFace(x, headY, hr, mood);
  }

  function coin(cx2, cy2, r) {
    var g = ctx.createRadialGradient(cx2 - r * 0.35, cy2 - r * 0.40, r * 0.15, cx2, cy2, r);
    g.addColorStop(0, '#f7dc95'); g.addColorStop(0.55, '#ecc157'); g.addColorStop(1, '#c99a2c');
    ctx.fillStyle = g;
    ctx.beginPath(); ctx.arc(cx2, cy2, r, 0, TAU); ctx.fill();
    ctx.strokeStyle = '#a97c1e'; ctx.lineWidth = r * 0.14;
    ctx.beginPath(); ctx.arc(cx2, cy2, r * 0.92, 0, TAU); ctx.stroke();   // milled rim
    ctx.fillStyle = 'rgba(255,255,255,0.5)';                              // shine
    ctx.beginPath();
    ctx.ellipse(cx2 - r * 0.34, cy2 - r * 0.40, r * 0.26, r * 0.14, -0.6, 0, TAU);
    ctx.fill();
  }

  function thoughtMoney(x, y, u) {
    // a banknote, tilted, sitting behind the coins
    ctx.save();
    ctx.translate(x - u * 0.10, y + u * 0.10); ctx.rotate(-0.15);
    ctx.fillStyle = 'rgba(40,60,36,0.18)';
    rrect(-u * 1.02, -u * 0.44, u * 2.04, u * 0.92, u * 0.13);
    ctx.fillStyle = '#8fc08a';
    rrect(-u * 1.05, -u * 0.48, u * 2.04, u * 0.92, u * 0.13);
    ctx.strokeStyle = '#6d9c69'; ctx.lineWidth = u * 0.055;
    ctx.beginPath(); ctx.rect(-u * 0.90, -u * 0.34, u * 1.74, u * 0.64); ctx.stroke();
    ctx.fillStyle = '#d9edd6';
    ctx.beginPath(); ctx.arc(-u * 0.03, -u * 0.02, u * 0.20, 0, TAU); ctx.fill();
    ctx.restore();
    coin(x - u * 0.60, y + u * 0.30, u * 0.42);       // back coin
    coin(x + u * 0.12, y + u * 0.02, u * 0.54);       // front coin
    ctx.fillStyle = '#7a5510';
    ctx.font = 'bold ' + (u * 0.60).toFixed(1) + 'px Helvetica, Arial, sans-serif';
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText('$', x + u * 0.12, y + u * 0.05);
    // a red arrow pointing down — there is not enough
    ctx.strokeStyle = '#c0392b'; ctx.lineWidth = u * 0.18;
    ctx.lineJoin = 'round'; ctx.lineCap = 'round';
    var axx = x + u * 1.06;
    ctx.beginPath(); ctx.moveTo(axx, y - u * 0.52); ctx.lineTo(axx, y + u * 0.42); ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(axx - u * 0.26, y + u * 0.08); ctx.lineTo(axx, y + u * 0.50);
    ctx.lineTo(axx + u * 0.26, y + u * 0.08); ctx.stroke();
  }

  // kind: money | partner_sad | children_sad | pressures | family_role | talk_together | family | family_sad | family_happy
  function drawThought(bx, by, s, kind, fromX, fromY) {
    var wide = (kind === 'pressures' || kind === 'family_role');   // multi-figure bubbles need more room
    var bw = (wide ? 128 : 112) * s, bh = 80 * s;
    var lobes = [[-0.60, 0.12, 0.42], [-0.24, -0.32, 0.50], [0.24, -0.30, 0.48],
                 [0.60, 0.10, 0.40], [0, 0.30, 0.48]];
    // outline pass (slightly larger, translucent) then the white fill — gives a clean
    // silhouette without internal arcs showing through.
    var bg = ctx.createLinearGradient(0, by - bh * 1.1, 0, by + bh * 1.1);
    bg.addColorStop(0, 'rgba(255,255,253,0.985)');
    bg.addColorStop(1, 'rgba(238,231,218,0.985)');
    for (var pass = 0; pass < 2; pass++) {
      ctx.fillStyle = pass === 0 ? 'rgba(58,44,28,0.26)' : bg;
      var grow = pass === 0 ? 2.4 * s : 0;
      for (var i = 0; i < 3; i++) {              // the three trailing puffs
        var t = (i + 1) / 4.2;
        ctx.beginPath();
        ctx.arc(fromX + (bx - fromX) * t, fromY + (by - fromY) * t, (2.6 + i * 2.4) * s + grow, 0, TAU);
        ctx.fill();
      }
      for (var l = 0; l < lobes.length; l++) {
        var L = lobes[l];
        ctx.beginPath();
        ctx.arc(bx + L[0] * bw, by + L[1] * bh, L[2] * bw + grow, 0, TAU);
        ctx.fill();
      }
    }
    var sad = 'sad', happy = 'happy';
    if (kind === 'money') {
      thoughtMoney(bx, by, 33 * s);
    } else if (kind === 'partner_sad') {
      tinyPerson(bx, by, 64 * s, sad, '#b0688f', '#2e2119', true);
    } else if (kind === 'children_sad') {
      tinyPerson(bx - 28 * s, by + 2 * s, 50 * s, sad, '#5f8ab0', '#3a2a1e', false);
      tinyPerson(bx + 28 * s, by + 4 * s, 45 * s, sad, '#6fa07a', '#4a3524', false);
    } else if (kind === 'pressures') {
      // two pressures on his mind at once: the money / work worry + the changing family
      // (roles & standing). Delivers the PAG slide-5 "two pressures as bubbles" note.
      thoughtMoney(bx - 42 * s, by - 2 * s, 18 * s);
      tinyPerson(bx + 34 * s, by - 4 * s, 44 * s, null, '#b0688f', '#2e2119', true);   // partner
      tinyPerson(bx + 62 * s, by + 8 * s, 34 * s, null, '#6fa07a', '#4a3524', false);  // child
    } else if (kind === 'family_role') {
      // his changing role: he pictures his wife and children at full size, and himself
      // SMALLER — how he perceives his standing shrinking (PAG / Ali, S4; also the visual
      // support for "loss of status").
      tinyPerson(bx + 6 * s, by - 6 * s, 56 * s, null, '#b0688f', '#2e2119', true);    // wife (larger)
      tinyPerson(bx + 47 * s, by + 6 * s, 46 * s, null, '#5f8ab0', '#3a2a1e', false);  // child
      tinyPerson(bx - 48 * s, by + 12 * s, 30 * s, sad, '#5e7a69', '#2e2119', false);  // Orion, smaller
    } else if (kind === 'talk_together') {
      // the healthy way: two people working things out together — shared decisions / asking
      // for help. Illustrates the rebuild actions (PAG / Ali, S13).
      tinyPerson(bx - 28 * s, by, 50 * s, happy, '#5e7a69', '#2e2119', false);   // Orion
      tinyPerson(bx + 28 * s, by, 50 * s, happy, '#b0688f', '#2e2119', true);    // partner
      ctx.fillStyle = '#fdfbf5';                                                 // a shared plan/paper
      rrect(bx - 10 * s, by + 5 * s, 20 * s, 15 * s, 2.5 * s);
      ctx.strokeStyle = '#b9ad97'; ctx.lineWidth = 1.3 * s; ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(bx - 5 * s, by + 10 * s); ctx.lineTo(bx + 5 * s, by + 10 * s);
      ctx.moveTo(bx - 5 * s, by + 14 * s); ctx.lineTo(bx + 5 * s, by + 14 * s);
      ctx.stroke();
    } else {                                     // family (neutral / sad / happy)
      var mood = kind === 'family_happy' ? happy : (kind === 'family_sad' ? sad : null);
      tinyPerson(bx - 46 * s, by - 2 * s, 60 * s, mood, '#b0688f', '#2e2119', true);  // partner
      tinyPerson(bx + 6 * s, by + 8 * s, 46 * s, mood, '#5f8ab0', '#3a2a1e', false);  // child
      tinyPerson(bx + 47 * s, by + 10 * s, 41 * s, mood, '#6fa07a', '#4a3524', false); // child
    }
  }

  // ---- pointer hit-testing + highlight, so the tree itself is interactive ----
  // Points are in the engine's logical 1600x900 space (the UI scales client coords).
  var highlight = null;

  function canopyOnScreen() {
    var g = growthScale;
    return {
      x: BASEX + (tree.canopy.x - BASEX) * g,
      y: GROUND + (tree.canopy.y - GROUND) * g,
      r: tree.canopy.r * g * 1.06, g: g
    };
  }

  function hitPart(px, py) {
    var c = canopyOnScreen();
    if (py < GROUND) {
      var dx = px - c.x, dy = py - c.y;
      if (dx * dx + dy * dy < c.r * c.r) return 'branches';
      if (Math.abs(px - BASEX) < 95 * c.g && py > GROUND - 330 * c.g) return 'trunk';
      return null;                                   // sky / meadow
    }
    if (py < GROUND + 175 && Math.abs(px - BASEX) < 330 * c.g) return 'roots';
    return 'soil';
  }

  function partPath(part) {
    var c = canopyOnScreen();
    ctx.beginPath();
    if (part === 'branches') { ctx.arc(c.x, c.y, c.r, 0, TAU); return; }
    if (part === 'trunk') {
      var x0 = BASEX - 95 * c.g, y0 = GROUND - 330 * c.g, w0 = 190 * c.g, h0 = 330 * c.g, r0 = 24;
      ctx.moveTo(x0 + r0, y0);
      ctx.arcTo(x0 + w0, y0, x0 + w0, y0 + h0, r0); ctx.arcTo(x0 + w0, y0 + h0, x0, y0 + h0, r0);
      ctx.arcTo(x0, y0 + h0, x0, y0, r0); ctx.arcTo(x0, y0, x0 + w0, y0, r0);
      ctx.closePath(); return;
    }
    if (part === 'roots') { ctx.ellipse(BASEX, GROUND + 80, 330 * c.g, 108, 0, 0, TAU); return; }
    ctx.rect(0, GROUND, W, H - GROUND);              // soil band
  }

  function drawHighlight(now) {
    if (!highlight) return;
    var pulse = 0.5 + 0.5 * Math.sin(now * 0.004);
    ctx.save();
    partPath(highlight);
    ctx.fillStyle = 'rgba(240,198,106,' + (0.13 + 0.07 * pulse).toFixed(3) + ')';
    ctx.fill();
    ctx.strokeStyle = 'rgba(248,214,130,' + (0.70 + 0.25 * pulse).toFixed(3) + ')';
    ctx.lineWidth = 3.5; ctx.setLineDash([13, 9]); ctx.lineDashOffset = -now * 0.03;
    ctx.stroke();
    ctx.restore();
  }

  // ---- the team's artwork, anchored feet-to-ground with a soft shadow ----
  function drawSpriteFig(key, x, gy2, targetH, now2, rock) {
    var sp = sprites && sprites[key];
    if (!sp) return false;
    var scale = targetH / sp.sh;
    var w = sp.sw * scale;
    var bob = Math.sin(now2 * 0.0022) * 1.4;   // breathing
    ctx.fillStyle = 'rgba(40,30,20,0.16)';
    ctx.beginPath(); ctx.ellipse(x, gy2 + 4, Math.max(34, w * 0.40), 10, 0, 0, TAU); ctx.fill();
    ctx.save();
    ctx.translate(x, gy2 + bob);
    if (rock) { ctx.rotate(rock); }
    ctx.drawImage(sp.img, sp.sx, sp.sy, sp.sw, sp.sh, -w / 2, -targetH, w, targetH);
    ctx.restore();
    return true;
  }

  // ---- mood faces: the team's sad/angry artwork overlaid on the front figure ----
  // The busts are drawn at the SAME pixel scale as the front figure's head
  // (both heads are 120px tall in the source art), so this is a clean swap.
  function overlayFace(faceKey, b, x, gy2, targetH, now2) {
    var f = sprites && sprites[faceKey];
    if (!f || !f.headW || f.headH < 50 || !b.headW) return;
    var s1 = targetH / b.sh;
    var bob = Math.sin(now2 * 0.0022) * 1.4;
    var headTopY = gy2 + bob - targetH + (b.headTop - b.sy) * s1;
    var headCxX = x - (b.sw * s1) / 2 + (b.headCx - b.sx) * s1;
    var fscale = s1 * (b.headW / f.headW);
    var cropH = Math.min(f.sh, (f.shoulder + 2) - f.sy);
    var dx = headCxX - (f.headCx - f.sx) * fscale;
    var dy = headTopY - (f.headTop - f.sy) * fscale;
    ctx.drawImage(f.img, f.sx, f.sy, f.sw, cropH, dx, dy, f.sw * fscale, cropH * fscale);
  }

  function drawAlpha(cx, gy, s, m, now, walkPhase, wavePhase) {
    m = clamp(m, 0, 1);
    now = now || 0;
    var slump = 1 - m;
    var walking = !!walkPhase;
    var gWave = clamp(wavePhase || 0, 0, 1);     // greeting wave — owns the right arm while it runs
    // idle gestures: a soft pulse every ~9s, whose kind follows his mood band —
    // calm: a slow nod · under pressure: scratches his head · tense: a slow head-shake
    var gc = (now % 9000) / 9000;
    var gp = smooth(clamp((gc - 0.55) / 0.07, 0, 1)) * smooth(clamp((0.78 - gc) / 0.07, 0, 1));
    var gNod = 0, gScratch = 0, gShake = 0;
    if (!walking && !gWave && now) {
      if (m >= 0.55) gNod = gp; else if (m >= 0.32) gScratch = gp; else gShake = gp;
    }
    var bob = walking ? -Math.abs(Math.sin(walkPhase)) * 4 * s
                      : Math.sin(now * 0.0022) * 1.4 * s;   // breathing
    var skin = '#b97a4e', skinD = '#9c6238', dark = '#2b2018';
    var shirt = mixHex('#5f6b74', '#4e8a6b', m), shirtD = mixHex('#4d5760', '#3f7358', m), trouser = '#3b3640';
    var headR = 30 * s;
    var headCy = gy - 196 * s + slump * 16 * s;
    var neckY = headCy + headR - 2 * s, shoulderY = neckY + 14 * s, hipY = gy - 92 * s;
    ctx.save();
    ctx.fillStyle = 'rgba(40,30,20,0.16)';
    ctx.beginPath(); ctx.ellipse(cx, gy + 4 * s, 58 * s, 12 * s, 0, 0, TAU); ctx.fill();
    ctx.translate(0, bob);                       // the body bobs; the shadow stays grounded
    if (walking) {                               // lean into the direction of travel
      ctx.translate(cx, gy); ctx.rotate(0.055); ctx.translate(-cx, -gy);
    }
    function drawLeg(px, ang) {
      var L = gy - hipY - 4 * s;
      ctx.save(); ctx.translate(px, hipY); ctx.rotate(ang);
      ctx.fillStyle = trouser; rrect(-8.5 * s, 0, 17 * s, L, 7 * s);
      ctx.fillStyle = dark; rrect(-13.5 * s, L - 5 * s, 25 * s, 11 * s, 5 * s);
      ctx.restore();
    }
    if (walking) {
      drawLeg(cx - 13.5 * s, Math.sin(walkPhase) * 0.42);
      drawLeg(cx + 13.5 * s, -Math.sin(walkPhase) * 0.42);
    } else {
      ctx.fillStyle = trouser; rrect(cx - 22 * s, hipY, 17 * s, gy - hipY - 4 * s, 7 * s); rrect(cx + 5 * s, hipY, 17 * s, gy - hipY - 4 * s, 7 * s);
      ctx.fillStyle = dark; rrect(cx - 27 * s, gy - 9 * s, 25 * s, 11 * s, 5 * s); rrect(cx + 2 * s, gy - 9 * s, 25 * s, 11 * s, 5 * s);
    }
    var sw = 44 * s, hw = 30 * s;
    ctx.fillStyle = shirt; ctx.beginPath();
    ctx.moveTo(cx - sw, shoulderY + 6 * s);
    ctx.quadraticCurveTo(cx - sw - 4 * s, (shoulderY + hipY) / 2, cx - hw, hipY + 8 * s);
    ctx.quadraticCurveTo(cx, hipY + 18 * s, cx + hw, hipY + 8 * s);
    ctx.quadraticCurveTo(cx + sw + 4 * s, (shoulderY + hipY) / 2, cx + sw, shoulderY + 6 * s);
    ctx.quadraticCurveTo(cx, shoulderY - 10 * s, cx - sw, shoulderY + 6 * s);
    ctx.closePath(); ctx.fill();
    var spread = lerp(1 * s, 8 * s, m);
    ctx.strokeStyle = shirtD; ctx.lineCap = 'round'; ctx.lineWidth = 15 * s;
    var lsx = cx - sw + 7 * s, lsy = shoulderY + 12 * s;
    var rsx = cx + sw - 7 * s, rsy = shoulderY + 12 * s;
    var lhx = cx - sw + 3 * s - spread, lhy = hipY + 4 * s;
    var rhx = cx + sw - 3 * s + spread, rhy = hipY + 4 * s;
    if (walking) {                               // arms swing opposite the legs
      lhx += Math.sin(walkPhase) * 16 * s;
      rhx -= Math.sin(walkPhase) * 16 * s;
    }
    ctx.beginPath(); ctx.moveTo(lsx, lsy); ctx.lineTo(lhx, lhy); ctx.stroke();
    if (gWave > 0.01) {                          // hello: right arm up beside the head, hand wagging
      var wag = Math.sin(now * 0.012) * 11 * s * gWave;
      var tx3 = cx + headR + 22 * s + wag, ty3 = headCy - 20 * s;
      rhx = lerp(rhx, tx3, gWave); rhy = lerp(rhy, ty3, gWave);
      var ex3 = cx + sw + 8 * s, ey3 = lerp((shoulderY + hipY) / 2, shoulderY + 12 * s, gWave);
      ctx.beginPath(); ctx.moveTo(rsx, rsy); ctx.lineTo(ex3, ey3); ctx.lineTo(rhx, rhy); ctx.stroke();
    } else if (gScratch > 0.01) {                // right hand rises to the side of his head
      var tx2 = cx + headR + 7 * s, ty2 = headCy + 1 * s + Math.sin(now * 0.02) * 3 * s * gScratch;
      rhx = lerp(rhx, tx2, gScratch); rhy = lerp(rhy, ty2, gScratch);
      var ex2 = cx + sw + 9 * s, ey2 = lerp((shoulderY + hipY) / 2, shoulderY + 24 * s, gScratch);
      ctx.beginPath(); ctx.moveTo(rsx, rsy); ctx.lineTo(ex2, ey2); ctx.lineTo(rhx, rhy); ctx.stroke();
    } else {
      ctx.beginPath(); ctx.moveTo(rsx, rsy); ctx.lineTo(rhx, rhy); ctx.stroke();
    }
    ctx.fillStyle = skin;
    ctx.beginPath(); ctx.arc(lhx, lhy + 4 * s, 7 * s, 0, TAU); ctx.fill();
    ctx.beginPath(); ctx.arc(rhx, rhy + (gScratch > 0.01 || gWave > 0.01 ? 0 : 4 * s), 7 * s, 0, TAU); ctx.fill();
    ctx.fillStyle = skin; rrect(cx - 8 * s, neckY - 6 * s, 16 * s, 20 * s, 5 * s);  // neck (matches face — no collar band)
    ctx.save(); ctx.translate(cx, headCy);
    ctx.rotate(lerp(0.13, -0.02, m)
      + Math.sin(now * 0.009) * 0.10 * gNod       // gentle nod when things are going well
      + Math.sin(now * 0.011) * 0.06 * gShake     // slow head-shake when tense
      + 0.05 * gScratch                            // slight tilt into the scratch
      - 0.05 * gWave);                             // and a friendly tilt into the wave
    ctx.fillStyle = skin;
    ctx.beginPath(); ctx.arc(-headR + 3 * s, 3 * s, 6 * s, 0, TAU); ctx.arc(headR - 3 * s, 3 * s, 6 * s, 0, TAU); ctx.fill();
    ctx.beginPath(); ctx.arc(0, 0, headR, 0, TAU); ctx.fill();
    ctx.fillStyle = dark;                      // (clean-shaven — no beard/chin band)
    ctx.beginPath();
    ctx.moveTo(-headR + 2 * s, 0);
    ctx.quadraticCurveTo(-headR - 1 * s, -headR - 6 * s, 0, -headR - 4 * s);
    ctx.quadraticCurveTo(headR + 1 * s, -headR - 6 * s, headR - 2 * s, 0);
    ctx.quadraticCurveTo(headR - 6 * s, -headR + 5 * s, 0, -headR + 6 * s);
    ctx.quadraticCurveTo(-(headR - 6 * s), -headR + 5 * s, -headR + 2 * s, 0);
    ctx.closePath(); ctx.fill();
    // expression: calm/smiling (high) → sad (mid, "under pressure") → angry/tense (very low)
    var calm = clamp((m - 0.45) / 0.3, 0, 1);
    var angry = clamp((0.32 - m) / 0.22, 0, 1);
    var sad = clamp(1 - calm - angry, 0, 1);
    var innerY = (-4 * sad + 5 * angry) * s;   // inner brow rises when sad, drops (furrows) when angry
    ctx.strokeStyle = dark; ctx.lineWidth = 3.4 * s; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(-16 * s, -8 * s); ctx.lineTo(-5 * s, -7 * s + innerY); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(16 * s, -8 * s); ctx.lineTo(5 * s, -7 * s + innerY); ctx.stroke();
    ctx.fillStyle = dark;
    var eyeY = (2 + 1.6 * sad) * s;             // eyes cast a touch lower when sad
    ctx.beginPath(); ctx.arc(-10 * s, eyeY, 3 * s, 0, TAU); ctx.arc(10 * s, eyeY, 3 * s, 0, TAU); ctx.fill();
    ctx.strokeStyle = dark; ctx.lineWidth = 3.2 * s;
    var mc = (5 * calm - 6 * sad - 3 * angry) * s;   // smile → frown → tight line
    ctx.beginPath(); ctx.moveTo(-9 * s, 15 * s); ctx.quadraticCurveTo(0, 15 * s + mc, 9 * s, 15 * s); ctx.stroke();
    ctx.restore();
    var ax = cx, ay = headCy - headR - 40 * s;
    if (thought) {
      // a thought bubble replaces the mood aura — his face already carries the feeling
      drawThought(cx - 134 * s, headCy - 122 * s, s, thought, cx - 22 * s, headCy - headR - 6 * s);
    } else if (m < 0.55) {
      var ca = (0.55 - m) / 0.55;                  // 0 → 1 as the mood drops
      // a grey storm-cloud over his head reads as "under pressure" — bigger and darker the
      // more stressed he is (PAG: make it more prominent). Deliberately NO lightning bolt
      // (per PVAW: the cause is internal, never an external strike).
      var cr = (28 + 9 * ca) * s, cy = ay - 2 * s;
      ctx.fillStyle = 'rgba(66,68,80,' + (0.16 + 0.24 * ca).toFixed(2) + ')';   // shadow puff, for volume
      puff(ax + 3 * s, cy + 4 * s, cr * 1.05);
      ctx.fillStyle = 'rgba(92,95,108,' + (0.46 + 0.40 * ca).toFixed(2) + ')';  // the darker cloud
      puff(ax, cy, cr);
      if (ca > 0.35) {                             // faint rain when the stress is heavier
        ctx.strokeStyle = 'rgba(118,130,150,' + (0.34 * ca).toFixed(2) + ')';
        ctx.lineWidth = 2.2 * s; ctx.lineCap = 'round';
        for (var ri = -1; ri <= 1; ri++) {
          var rx = ax + ri * cr * 0.52;
          ctx.beginPath();
          ctx.moveTo(rx, cy + cr * 0.62);
          ctx.lineTo(rx - 3 * s, cy + cr * 0.62 + (8 + 5 * ca) * s);
          ctx.stroke();
        }
      }
    } else {
      var g = ctx.createRadialGradient(ax, ay + 8 * s, 2 * s, ax, ay + 8 * s, 38 * s);
      g.addColorStop(0, 'rgba(255,214,120,' + (0.55 * (m - 0.55) / 0.45).toFixed(2) + ')');
      g.addColorStop(1, 'rgba(255,214,120,0)');
      ctx.fillStyle = g; ctx.beginPath(); ctx.arc(ax, ay + 8 * s, 38 * s, 0, TAU); ctx.fill();
    }
    ctx.restore();
  }

  // ---- shed leaves and broken branches resting on the meadow (curWilt-driven) ----
  function drawGroundDebris() {
    if (curWilt <= 0.02) return;
    var gls = tree.groundLeaves;
    var leafShown = Math.round(gls.length * clamp(curWilt * 1.15, 0, 1));
    for (var i = 0; i < leafShown; i++) {
      var L = gls[i];
      var wv = clamp(curWilt * (0.8 + 0.4 * L.h), 0, 1), lh, ls, ll;
      if (wv < 0.5) { var u = wv / 0.5; lh = lerp(54, 32, u); ls = lerp(64, 70, u); ll = lerp(46, 38, u); }
      else { var u2 = (wv - 0.5) / 0.5; lh = lerp(32, 24, u2); ls = lerp(70, 30, u2); ll = lerp(38, 26, u2); }
      ctx.save();
      ctx.translate(L.x, L.y); ctx.rotate(L.rot);
      ctx.fillStyle = hsl(lh, ls, ll, clamp(0.5 + curWilt * 0.4, 0, 0.92));
      ctx.beginPath(); ctx.ellipse(0, 0, L.r, L.r * 0.55, 0, 0, TAU); ctx.fill();
      ctx.restore();
    }
    var gbs = tree.groundBranches;
    var bShown = Math.round(gbs.length * clamp((curWilt - 0.45) / 0.55, 0, 1));
    var col = mixHex('#5f4f3a', '#7c746a', clamp((curWilt - 0.5) / 0.5, 0, 1));
    ctx.lineCap = 'round';
    for (var b = 0; b < bShown; b++) {
      var B = gbs[b];
      ctx.save();
      ctx.translate(B.x, B.y); ctx.rotate(B.ang);
      ctx.strokeStyle = 'rgba(30,22,12,0.18)'; ctx.lineWidth = B.wid + 2.5;
      ctx.beginPath(); ctx.moveTo(-B.len * 0.5, 2.5); ctx.quadraticCurveTo(0, B.bend * 16 + 2.5, B.len * 0.5, 2.5); ctx.stroke();
      ctx.strokeStyle = col; ctx.lineWidth = B.wid;
      ctx.beginPath(); ctx.moveTo(-B.len * 0.5, 0); ctx.quadraticCurveTo(0, B.bend * 16, B.len * 0.5, 0); ctx.stroke();
      if (B.twigs) {
        ctx.lineWidth = B.wid * 0.55;
        ctx.beginPath(); ctx.moveTo(B.len * 0.05, 0); ctx.lineTo(B.len * 0.22, -B.len * 0.22); ctx.stroke();
      }
      ctx.restore();
    }
  }

  var rafAlive = false;
  var stopped = false;
  function render(now) {
    if (stopped || !ctx) return;
    try {
      renderInner(now);
    } catch (e) {
      console.error('tree render error', e);
    }
  }
  function rafLoop(now) {
    if (stopped) return;
    rafAlive = true;
    render(now);
    requestAnimationFrame(rafLoop);
  }

  function renderInner(now) {
    var dt = Math.min(0.05, (now - lastNow) / 1000) || 0.016;
    lastNow = now;

    // gentle ambient breeze: a slow drifting gust that ebbs and flows on its own
    windX = 0.30 * Math.sin(now * 0.00012) + 0.13 * Math.sin(now * 0.00029 + 1.7);
    windY = 0.05 * Math.sin(now * 0.00017 + 0.6);

    // ease vitality toward its target, then derive the wilt / vit the draws use
    if (healthV < healthTarget) healthV = Math.min(healthTarget, healthV + dt * 26);
    else if (healthV > healthTarget) healthV = Math.max(healthTarget, healthV - dt * 26);
    curWilt = clamp(1 - healthV / 100, 0, 1);
    vit = healthV / 100;

    // the spark: the flash fades fast; the smoky scorch lingers a few seconds
    if (flash > 0) flash = Math.max(0, flash - dt * 2.2);
    if (scorch > 0) scorch = Math.max(0, scorch - dt * 0.05);  // the burn lingers ~20s

    // life-cycle scale: tiny sapling at the trunk stage → mature size by the end,
    // capped at matScaleMax so the full crown always fits on the canvas.
    growthScale = 0.32 + (matScaleMax - 0.32) * smooth(clamp((t - 2) / 3, 0, 1));

    // tween toward target stage
    var rate = 0.5 * speed;
    if (t < target) t = Math.min(target, t + dt * rate);
    else if (t > target) t = Math.max(target, t - dt * rate * 1.6);

    // roots establish at the Roots stage, then keep spreading as the tree grows
    // taller — so they are not already fully grown by the time the trunk appears.
    var rootP = 0.5 * smooth(clamp(t, 0, 1)) + 0.5 * smooth(clamp((t - 1) / 3, 0, 1));
    var soilP = smooth(clamp(t - 1, 0, 1));
    var trunkP = smooth(clamp(t - 2, 0, 1));
    // young leaves emerge while the sapling is still rising and fill out to a full
    // canopy by the young-tree stage, so there is some foliage as it grows taller.
    var leafP = smooth(clamp((t - 2.4) / 1.6, 0, 1));
    var colorP = smooth(clamp(t - 4, 0, 1));

    ctx.clearRect(0, 0, W, H);
    drawSky(now, colorP);
    drawClouds(dt);
    drawBirds(now);
    drawHills(colorP);
    drawShadow(trunkP, leafP);
    drawSoil(soilP, now);

    // roots inside the soil
    for (var r = 0; r < tree.roots.length; r++) drawWood(tree.roots[r], rootP, tree.rootMaxDist, true);
    // soil tint embeds the roots
    ctx.fillStyle = 'rgba(70,48,28,0.16)';
    ctx.fillRect(0, GROUND + 5, W, H - GROUND - 5);

    drawSeed(rootP, soilP, trunkP);
    // the crown grows in size as it matures — scale the above-ground tree about its base
    ctx.save();
    ctx.translate(BASEX, GROUND);
    ctx.scale(growthScale, growthScale);
    ctx.translate(-BASEX, -GROUND);
    drawWood(tree.trunk, trunkP, tree.maxDist, false);
    drawLeaves(now, leafP, colorP);
    drawFruit(vit, colorP);          // ripe fruit on a thriving crown (healthy outcomes only)
    ctx.restore();
    drawGrass(now, colorP);
    drawGroundDebris();              // shed leaves / broken branches lying on the meadow
    if (alphaShown) {
      var axp = 392, wkp = 0;
      if (alphaWalk) {                            // walking in from the left edge
        if (!alphaWalk.t0) alphaWalk.t0 = now;
        var wpr = clamp((now - alphaWalk.t0) / alphaWalk.dur, 0, 1);
        axp = lerp(alphaWalk.from, alphaWalk.to, smooth(wpr));
        // gait synced to the ground he covers, so the planted foot stays planted —
        // a time-based phase makes the stride read backwards (moonwalk)
        wkp = wpr < 1 ? 1e-4 + (axp - alphaWalk.from) * 0.045 : 0;
        if (wpr >= 1) alphaWalk = null;
      }
      var wvp = 0;
      if (alphaWave) {                            // waving hello — eased in and out
        if (!alphaWave.t0) alphaWave.t0 = now;
        var wvr = clamp((now - alphaWave.t0) / alphaWave.dur, 0, 1);
        wvp = smooth(clamp(wvr / 0.18, 0, 1)) * smooth(clamp((1 - wvr) / 0.18, 0, 1));
        if (wvr >= 1) alphaWave = null;
      }
      drawAlpha(axp, GROUND, 0.82, vit, now, wkp, wvp);  // Orion, emotion = health
    }
    drawHighlight(now);              // interactive part highlight, on top of everything
    drawFlowers(now, colorP);
    drawButterflies(now, colorP);
    drawMotes(now, colorP);
    drawHealPulse(dt, now);
    drawFallingLeaves(dt, now);
    drawFallingBranches(dt);         // branches tumbling down from the dying crown
    drawWater(dt);                   // watering shower + moist soil while growing

    // warm sunlight wash
    var warm = ctx.createRadialGradient(SUN.x, SUN.y, 50, SUN.x, SUN.y, 1400);
    warm.addColorStop(0, 'rgba(' + mood.warm + ',' + (0.10 + (mood.amt - 0.03) * colorP).toFixed(3) + ')');
    warm.addColorStop(1, 'rgba(' + mood.warm + ',0)');
    ctx.fillStyle = warm;
    ctx.fillRect(0, 0, W, H);

    // ---- the "spark": the tree burns — char, smoke, flames, embers, bolt, flash ----
    if (scorch > 0.01) {
      var crownY = GROUND - 300 * growthScale, crownR = 185 * growthScale, av = clamp(scorch, 0, 1);
      // char the tree toward charcoal (crown + trunk go black)
      var ch = ctx.createRadialGradient(BASEX, crownY, 18, BASEX, crownY, crownR);
      ch.addColorStop(0, 'rgba(20,15,12,' + (0.74 * av).toFixed(3) + ')');
      ch.addColorStop(0.68, 'rgba(20,15,12,' + (0.5 * av).toFixed(3) + ')');
      ch.addColorStop(1, 'rgba(20,15,12,0)');
      ctx.fillStyle = ch;
      ctx.beginPath(); ctx.ellipse(BASEX, crownY, crownR, crownR * 0.95, 0, 0, TAU); ctx.fill();
      ctx.fillStyle = 'rgba(20,15,12,' + (0.55 * av).toFixed(3) + ')';
      ctx.beginPath();
      ctx.moveTo(BASEX - 20 * growthScale, GROUND); ctx.lineTo(BASEX - 9 * growthScale, crownY);
      ctx.lineTo(BASEX + 9 * growthScale, crownY); ctx.lineTo(BASEX + 20 * growthScale, GROUND);
      ctx.closePath(); ctx.fill();
      // smoke billowing above the tree
      var sm = ctx.createRadialGradient(BASEX, crownY - 70 * growthScale, 30, BASEX, crownY - 95 * growthScale, 340);
      sm.addColorStop(0, 'rgba(56,52,50,' + (0.44 * av).toFixed(3) + ')');
      sm.addColorStop(1, 'rgba(56,52,50,0)');
      ctx.fillStyle = sm; ctx.fillRect(0, 0, W, GROUND);
      // flames licking up the tree
      drawFlames(now, av);
    }
    if (embers.length) drawEmbers(dt);
    drawLightning();
    if (flash > 0.001) {
      ctx.fillStyle = 'rgba(245,248,255,' + (0.5 * flash * flash).toFixed(3) + ')';
      ctx.fillRect(0, 0, W, H);
    }
  }


  // ---------------- api + boot ----------------
  var fallbackInterval = 0;
  dpr = Math.min(2, (typeof window !== 'undefined' && window.devicePixelRatio) || 1);
  canvas.width = W * dpr;
  canvas.height = H * dpr;
  ctx = canvas.getContext('2d');
  ctx.scale(dpr, dpr);
  lastNow = performance.now();
  requestAnimationFrame(rafLoop);
  // rAF is suspended in hidden iframes/tabs; keep the scene alive with a timer
  var fallbackTimer = setTimeout(function () {
    if (!rafAlive && !stopped) {
      fallbackInterval = setInterval(function () { if (!rafAlive && !stopped) render(performance.now()); }, 33);
    }
  }, 400);

  var api = {
    STAGES: STAGES,
    setStage: function (n, instant) {
      var prev = target;
      target = clamp(n, 0, STAGES - 1); // fractional targets allowed
      if (instant) t = target;
      else if (target > prev + 0.001 && healthTarget > 25) spawnWater(); // water it as it grows
      if (api.onStageChange) api.onStageChange(target);
    },
    getStage: function () { return target; },
    getDisplayStage: function () { return t; },
    isSettled: function () { return t === target; },
    dropLeaves: function (intensity) { spawnFallingLeaves(intensity); },
    shedBranches: function (intensity) { spawnFallingBranches(intensity); },
    strikeSpark: function () { spawnSpark(); },
    setAlpha: function (b) { alphaShown = !!b; },  // show/hide Orion (the story figure)
    setThought: function (k) { thought = k || null; },  // thought bubble: money | partner_sad | children_sad | pressures | family_role | talk_together | family | family_sad | family_happy
    walkIn: function () { alphaWalk = { from: -90, to: 392, t0: 0, dur: 2800 }; },  // he walks in from the left (unused — the walk-in was removed)
    wave: function (dur) { alphaWave = { t0: 0, dur: dur || 2600 }; },  // he waves hello as the story starts
    setPose: function (p) { figurePose = p || null; },  // e.g. {pose:'point'} on the explore screen
    setSprites: function (reg) { sprites = reg || null; },  // swap in the embedded artwork
    size: function () { return { w: W, h: H }; },        // logical canvas size, for scaling client coords
    hitPart: function (x, y) { return hitPart(x, y); },  // 'roots'|'soil'|'trunk'|'branches'|null
    setHighlight: function (p) { highlight = p || null; },
    pulseWater: function () { spawnWater(); },
    pulseHeal: function () { healPulse = 1; scorch = 0; flash = 0; embers = []; flames = []; }, // rebuilding clears the fire
    setHealth: function (pct, instant) {
      healthTarget = clamp(pct, 0, 100);
      if (instant) { healthV = healthTarget; if (pct > 25) { scorch = 0; flash = 0; embers = []; flames = []; } } // back/restart clears it
    },
    getHealth: function () { return healthTarget; },
    applyTweaks: function (tw) {
      if (tw.palette && PALETTES[tw.palette]) { pal = PALETTES[tw.palette]; palName = tw.palette; }
      if (tw.mood && MOODS[tw.mood]) mood = MOODS[tw.mood];
      if (typeof tw.density === 'number') density = clamp(tw.density, 0.3, 1.6);
      if (typeof tw.speed === 'number') speed = clamp(tw.speed, 0.3, 3);
    },
    regen: function (newSeed) {
      seed = (typeof newSeed === 'number') ? newSeed : (Math.random() * 1e9) | 0;
      tree = buildTree(seed);
      matScaleMax = fitScaleFor(tree.bounds);
      fallingLeaves = [];
      fallingBranches = [];
      waterDrops = []; waterSplashes = []; waterEmit = 0;
      healPulse = 0; waterPulse = 0; soilMoist = 0;
      flash = 0; scorch = 0; sparkBolt = null; embers = []; flames = [];
    },
    renderNow: function () { render(performance.now()); },
    destroy: function () {
      stopped = true;
      clearTimeout(fallbackTimer);
      if (fallbackInterval) clearInterval(fallbackInterval);
    },
    onStageChange: null
  };
  return api;
}

// ---- Orion mid-stride, in PROFILE — walk cycle from the design session ----
// Two-bone IK legs (bending knees) + elbows, stance/swing gait with heel-strike
// and toe-off. NO-SLIP CONTRACT: the caller advances `phase` by distance
// travelled × WALK_K so planted feet stay planted (see WALK_K below).
export function drawAtlasWalker(ctx, x, groundY, s, phase) {
  // ---- gait constants (local px, at scale 1) ----------------------
  var TAU = Math.PI * 2;
  var A = 34;                 // foot reach forward at heel strike
  var B = 34;                 // foot reach back at toe-off
  var STANCE = 0.6 * TAU;     // foot planted 60% of the cycle
  var STRIDE = A + B;         // ground sweep of a planted foot

  var L_THIGH = 46, L_CALF = 44, ANKLE_H = 12;   // leg segments
  var L_UARM = 40, L_FARM = 34;                  // arm segments
  var HIP_Y = -92, SHO_Y = -152;                 // above ground line
  var HEAD_R = 30, HEAD_CX = 6, HEAD_CY = -190;  // head held high — hunched reads wrong
  var LEAN = 0.045;                              // ~2.5 deg forward lean

  var C_SKIN = '#b97a4e', C_SKINF = '#a06a45', C_HAIR = '#2f2318';
  var C_TOP = '#68927c', C_TOPF = '#55796a';
  var C_TRO = '#3f3f4a', C_TROF = '#32323c';
  var C_SHO = '#3a2817', C_SHOF = '#2a1c10';

  // vertical bob: highest at the passing pose, lowest at double-support
  var bob = -3.5 * Math.cos(2 * (phase - 0.6 * Math.PI));
  var hy = HIP_Y + bob;
  var shy = SHO_Y + bob;

  function clamp(v, a, b) { return v < a ? a : (v > b ? b : v); }
  function smooth(t) { t = clamp(t, 0, 1); return t * t * t * (t * (t * 6 - 15) + 10); }
  function circle(cx, cy, r) { ctx.beginPath(); ctx.arc(cx, cy, r, 0, TAU); ctx.fill(); }
  function bone(x1, y1, x2, y2, w, col) {
    ctx.strokeStyle = col; ctx.lineWidth = w; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke();
  }
  function rr(x, y, w, h, r) {
    ctx.beginPath(); ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath();
  }

  // ankle position + shoe angle for one leg at its local phase 'th'
  function footOf(th) {
    th = th % TAU; if (th < 0) th += TAU;
    var fx, fy, ang;
    if (th < STANCE) {                 // ---- STANCE: planted -----------
      var p = th / STANCE;             // 0..1
      fx = A - STRIDE * p;             // linear -> world foot is still
      var heel = 8 * Math.max(0, (p - 0.75) / 0.25);  // heel lifts late
      fy = -ANKLE_H - heel;
      ang = 0.30 * Math.max(0, 1 - p * 5)             // toe-up heel strike
        - 0.60 * Math.max(0, (p - 0.72) / 0.28);      // toe-down push-off
    } else {                           // ---- SWING: recover forward ----
      var q = (th - STANCE) / (TAU - STANCE);
      fx = -B + STRIDE * smooth(q);
      fy = -ANKLE_H - 18 * Math.sin(Math.PI * q);     // ground-clear arc
      ang = 0.14 * Math.sin(Math.PI * q);
    }
    return { x: fx, y: fy, a: ang };
  }

  // two-bone IK; fwd=true bends the joint toward +x (knee), else -x (elbow)
  function ik(hx, hyy, ax, ay, l1, l2, fwd) {
    var dx = ax - hx, dy = ay - hyy, d = Math.sqrt(dx * dx + dy * dy), mr = l1 + l2 - 0.01;
    if (d > mr) { ax = hx + dx / d * mr; ay = hyy + dy / d * mr; dx = ax - hx; dy = ay - hyy; d = mr; }
    if (d < 0.01) d = 0.01;
    var a = Math.acos(clamp((l1 * l1 + d * d - l2 * l2) / (2 * l1 * d), -1, 1));
    var base = Math.atan2(dy, dx);
    var x1 = hx + Math.cos(base + a) * l1, x2 = hx + Math.cos(base - a) * l1;
    var ang = fwd ? (x1 > x2 ? base + a : base - a) : (x1 < x2 ? base + a : base - a);
    return { kx: hx + Math.cos(ang) * l1, ky: hyy + Math.sin(ang) * l1, ax: ax, ay: ay };
  }

  function drawShoe(col) { ctx.fillStyle = col; rr(-11, 3, 35, 11, 5); ctx.fill(); }

  function drawLeg(hipx, foot, cT, cS) {
    var L = ik(hipx, hy, foot.x, foot.y, L_THIGH, L_CALF, true);
    bone(hipx, hy, L.kx, L.ky, 22, cT);      // thigh
    bone(L.kx, L.ky, L.ax, L.ay, 17, cT);    // calf
    ctx.save(); ctx.translate(L.ax, L.ay); ctx.rotate(foot.a); drawShoe(cS); ctx.restore();
  }

  function drawArm(th, cU, darker) {
    var sx = 0, sy = shy;
    var sw = -0.5 * Math.cos(th);            // + forward, opposite same-side leg
    var ang = Math.PI / 2 - sw;              // PI/2 = straight down
    var reach = L_UARM + L_FARM - 8;         // slack -> relaxed elbow bend
    var wx = sx + Math.cos(ang) * reach, wy = sy + Math.sin(ang) * reach;
    var E = ik(sx, sy, wx, wy, L_UARM, L_FARM, false);
    bone(sx, sy, E.kx, E.ky, 15, cU);        // upper arm
    bone(E.kx, E.ky, E.ax, E.ay, 12, cU);    // forearm
    ctx.fillStyle = cU; circle(sx, sy + 1, 10.5);   // deltoid — sockets the arm into the shoulder
    ctx.fillStyle = darker ? C_SKINF : C_SKIN; circle(E.ax, E.ay, 6);  // hand
  }

  function leanBegin() { ctx.save(); ctx.translate(0, hy); ctx.rotate(LEAN); ctx.translate(0, -hy); }
  function leanEnd() { ctx.restore(); }

  function drawTorso() { bone(0, hy - 2, 0, shy, 46, C_TOP); }

  function drawHead() {
    var cx = HEAD_CX, cy = HEAD_CY + bob;
    bone(2, shy + 3, cx - 1, cy + HEAD_R - 11, 12, C_SKIN);   // slim neck, tucked behind the chin
    ctx.fillStyle = C_SKIN; circle(cx, cy, HEAD_R);               // skull
    ctx.fillStyle = C_HAIR;                                       // crown + back cap,
    ctx.beginPath();                                              // hairline over the ear
    ctx.arc(cx, cy, HEAD_R * 1.03, -1.05, 2.55, true);
    ctx.quadraticCurveTo(cx - HEAD_R * 0.50, cy + HEAD_R * 0.10, cx - HEAD_R * 0.05, cy - HEAD_R * 0.02);
    ctx.quadraticCurveTo(cx + HEAD_R * 0.30, cy - HEAD_R * 0.30, cx + HEAD_R * 0.53, cy - HEAD_R * 0.92);
    ctx.closePath(); ctx.fill();
    ctx.fillStyle = C_SKINF; circle(cx - 4, cy + 7, 5);           // ear at the skull centre
    ctx.strokeStyle = '#8d5c38'; ctx.lineWidth = 1.6;
    ctx.beginPath(); ctx.arc(cx - 4, cy + 7, 2.4, -0.6 * Math.PI, 0.5 * Math.PI); ctx.stroke();
    // nose
    ctx.fillStyle = C_SKIN;
    ctx.beginPath(); ctx.moveTo(cx + HEAD_R + 1, cy - 1);
    ctx.quadraticCurveTo(cx + HEAD_R + 11, cy + 4, cx + HEAD_R + 1, cy + 9); ctx.closePath(); ctx.fill();
    // eye
    ctx.fillStyle = '#2b2018'; circle(cx + 14, cy - 3, 2.6);
    // brow: neutral/friendly, front end slightly higher (never angled down = scowl)
    ctx.strokeStyle = '#2b2018'; ctx.lineWidth = 3; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(cx + 8, cy - 11); ctx.lineTo(cx + 20, cy - 12); ctx.stroke();
    // gentle content mouth
    ctx.strokeStyle = '#7a4a2e'; ctx.lineWidth = 2.4;
    ctx.beginPath(); ctx.moveTo(cx + 12, cy + 13); ctx.quadraticCurveTo(cx + 18, cy + 16, cx + 23, cy + 11); ctx.stroke();
  }

  // ---- compose -----------------------------------------------------
  ctx.save();
  ctx.translate(x, groundY);
  ctx.scale(s, s);
  ctx.lineJoin = 'round';

  ctx.fillStyle = 'rgba(30,25,20,0.12)';               // contact shadow
  ctx.beginPath(); ctx.ellipse(0, 0, 44, 7, 0, 0, TAU); ctx.fill();

  drawLeg(-3, footOf(phase + Math.PI), C_TROF, C_SHOF);           // far leg
  leanBegin(); drawArm(phase + Math.PI, C_TOPF, true); leanEnd(); // far arm
  leanBegin(); drawTorso(); drawHead(); leanEnd();                // body + head
  drawLeg(3, footOf(phase), C_TRO, C_SHO);                        // near leg
  leanBegin(); drawArm(phase, C_TOP, false); leanEnd();           // near arm

  ctx.restore();
}

// ============================================================================
// Orion pose & expression library — the character reference sheet, fully
// procedural (no image assets). Used by the game (wave on arrival) and by
// scripts/atlas-poses.html to render the sheet for review.
//   drawAtlasPose(ctx, x, groundY, s, spec)
//     spec.pose: front | threeq | profile | backthreeq | back | bust |
//                run | wave | point | think | sit        (walk = drawAtlasWalker)
//     spec.expr: neutral | talk | surprised | sad | angry | wink | joy | think
//     spec.t:    time in ms for animated poses (wave wag, run gait)
// ============================================================================
export function drawAtlasPose(ctx, x, gy, s, spec) {
  spec = spec || {};
  var pose = spec.pose || 'front', expr = spec.expr || 'neutral', t = spec.t || 0;
  var TAU = Math.PI * 2;
  var SKIN = '#b97a4e', SKIND = '#9c6238', SKINF = '#a06a45';
  var HAIR = '#2f2318', INK = '#2f2318';
  var TOP = '#68927c', TOPD = '#55796a';
  var TRO = '#3f3f4a', TROD = '#32323c';
  var SHOE = '#3a2817', SHOED = '#2a1c10';
  var R = 30, HIP = -92, SHO = -150, HEADC = -196;

  function circle(cx, cy, r) { ctx.beginPath(); ctx.arc(cx, cy, r, 0, TAU); ctx.fill(); }
  function bone(x1, y1, x2, y2, w, col) {
    ctx.strokeStyle = col; ctx.lineWidth = w; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke();
  }
  function rr(rx, ry, rw, rh, rad) {
    ctx.beginPath(); ctx.moveTo(rx + rad, ry);
    ctx.arcTo(rx + rw, ry, rx + rw, ry + rh, rad); ctx.arcTo(rx + rw, ry + rh, rx, ry + rh, rad);
    ctx.arcTo(rx, ry + rh, rx, ry, rad); ctx.arcTo(rx, ry, rx + rw, ry, rad);
    ctx.closePath(); ctx.fill();
  }
  function shadow(w) {
    ctx.fillStyle = 'rgba(30,25,20,0.12)';
    ctx.beginPath(); ctx.ellipse(0, 0, w, 8, 0, 0, TAU); ctx.fill();
  }

  // ---- the face, at head-centre (0,0), radius r; off shifts features (3/4 view) ----
  function face(r, ex, off) {
    off = off || 0;
    var eL = -0.34 * r + off, eR = 0.34 * r + off, eY = -0.08 * r;
    function brow(bx, tilt, lift) {
      ctx.strokeStyle = INK; ctx.lineWidth = 0.11 * r; ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(bx - 0.15 * r, -0.28 * r - lift + tilt);
      ctx.quadraticCurveTo(bx, -0.37 * r - lift, bx + 0.15 * r, -0.28 * r - lift - tilt);
      ctx.stroke();
    }
    function dot(bx, by, rr2) { ctx.fillStyle = INK; ctx.beginPath(); ctx.ellipse(bx, by, rr2 * 0.9, rr2, 0, 0, TAU); ctx.fill(); }
    function closedHappy(bx) {  // ∩ closed smiling eye
      ctx.strokeStyle = INK; ctx.lineWidth = 0.10 * r; ctx.lineCap = 'round';
      ctx.beginPath(); ctx.moveTo(bx - 0.14 * r, eY + 0.04 * r);
      ctx.quadraticCurveTo(bx, eY - 0.14 * r, bx + 0.14 * r, eY + 0.04 * r); ctx.stroke();
    }
    function mouthLine(dip, wid, thick) {  // dip>0 = smile
      ctx.strokeStyle = INK; ctx.lineWidth = thick || 0.09 * r; ctx.lineCap = 'round';
      ctx.beginPath(); ctx.moveTo(off * 0.8 - wid, 0.44 * r);
      ctx.quadraticCurveTo(off * 0.8, 0.44 * r + dip, off * 0.8 + wid, 0.44 * r);
      ctx.stroke();
    }
    function mouthOpen(wid) {  // open smile with teeth
      var mx = off * 0.8, my = 0.40 * r;
      ctx.fillStyle = '#5a2a1e';
      ctx.beginPath(); ctx.arc(mx, my, wid, 0, Math.PI); ctx.closePath(); ctx.fill();
      ctx.fillStyle = '#f5efe2';
      ctx.beginPath(); ctx.rect(mx - wid * 0.78, my, wid * 1.56, wid * 0.34); ctx.fill();
    }
    if (ex === 'neutral') { brow(eL, 0, 0); brow(eR, 0, 0); dot(eL, eY, 0.10 * r); dot(eR, eY, 0.10 * r); mouthLine(0.10 * r, 0.20 * r); }
    else if (ex === 'talk') { brow(eL, 0, 0.05 * r); brow(eR, 0, 0.05 * r); dot(eL, eY, 0.10 * r); dot(eR, eY, 0.10 * r); mouthOpen(0.24 * r); }
    else if (ex === 'surprised') { brow(eL, 0, 0.12 * r); brow(eR, 0, 0.12 * r); dot(eL, eY, 0.13 * r); dot(eR, eY, 0.13 * r);
      ctx.fillStyle = '#5a2a1e'; ctx.beginPath(); ctx.ellipse(off * 0.8, 0.44 * r, 0.10 * r, 0.13 * r, 0, 0, TAU); ctx.fill(); }
    else if (ex === 'sad') { brow(eL, -0.06 * r, 0.02 * r); brow(eR, 0.06 * r, 0.02 * r); dot(eL, eY + 0.02 * r, 0.10 * r); dot(eR, eY + 0.02 * r, 0.10 * r); mouthLine(-0.12 * r, 0.18 * r); }
    else if (ex === 'angry') { brow(eL, 0.10 * r, -0.02 * r); brow(eR, -0.10 * r, -0.02 * r); dot(eL, eY, 0.10 * r); dot(eR, eY, 0.10 * r); mouthLine(-0.06 * r, 0.16 * r, 0.11 * r); }
    else if (ex === 'wink') { brow(eL, 0, 0.02 * r); brow(eR, 0, 0.08 * r); dot(eL, eY, 0.10 * r);
      ctx.strokeStyle = INK; ctx.lineWidth = 0.10 * r; ctx.beginPath();
      ctx.moveTo(eR - 0.13 * r, eY); ctx.quadraticCurveTo(eR, eY + 0.10 * r, eR + 0.13 * r, eY); ctx.stroke();
      ctx.strokeStyle = INK; ctx.lineWidth = 0.09 * r; ctx.beginPath();
      ctx.moveTo(off * 0.8 - 0.16 * r, 0.45 * r); ctx.quadraticCurveTo(off * 0.8 + 0.06 * r, 0.52 * r, off * 0.8 + 0.20 * r, 0.40 * r); ctx.stroke(); }
    else if (ex === 'joy') { brow(eL, 0, 0.10 * r); brow(eR, 0, 0.10 * r); closedHappy(eL); closedHappy(eR); mouthOpen(0.27 * r); }
    else if (ex === 'think') { brow(eL, 0.07 * r, 0); brow(eR, -0.04 * r, 0.03 * r); dot(eL, eY, 0.10 * r); dot(eR, eY, 0.10 * r); mouthLine(-0.02 * r, 0.14 * r); }
  }

  function frontHair(r) {
    ctx.fillStyle = HAIR;
    ctx.beginPath();
    ctx.arc(0, 0, r * 1.03, Math.PI - 0.08, TAU + 0.08);
    ctx.quadraticCurveTo(0, -r * 0.72, -Math.cos(0.08) * r * 1.03, Math.sin(0.08) * r * 1.03);
    ctx.closePath(); ctx.fill();
  }
  function ear(exx, eyy) {
    ctx.fillStyle = SKIN; circle(exx, eyy, 6);
    ctx.strokeStyle = SKIND; ctx.lineWidth = 1.6;
    ctx.beginPath(); ctx.arc(exx, eyy, 2.6, -0.6 * Math.PI, 0.5 * Math.PI); ctx.stroke();
  }

  // ---- heads (drawn at head-centre) ----
  function headFront(ex) { ear(-R + 2, 4); ear(R - 2, 4); ctx.fillStyle = SKIN; circle(0, 0, R); frontHair(R); face(R, ex, 0); }
  function headThreeQ(ex, dir) {
    dir = dir || -1;                       // -1 = turned to the viewer's left (reference)
    ear((R - 3) * -dir, 4);
    ctx.fillStyle = SKIN; circle(0, 0, R);
    ctx.save(); ctx.translate(4 * -dir, 0); frontHair(R * 1.02); ctx.restore();
    face(R, ex, 0.16 * R * dir);
  }
  function headProfile() {
    ctx.fillStyle = SKIN; circle(0, 0, R);                    // skull
    ctx.fillStyle = SKIN;                                     // nose, proud of the silhouette
    ctx.beginPath(); ctx.moveTo(R - 2, 2);
    ctx.quadraticCurveTo(R + 9, 7, R - 2, 12); ctx.closePath(); ctx.fill();
    // hair: crown + back only — the hairline sweeps from the front fringe, over the
    // ear, down to the nape (matches the reference sheet's side view)
    ctx.fillStyle = HAIR;
    ctx.beginPath();
    ctx.arc(0, 0, R * 1.03, -1.05, 2.55, true);
    ctx.quadraticCurveTo(-R * 0.50, R * 0.10, -R * 0.05, -R * 0.02);
    ctx.quadraticCurveTo(R * 0.30, -R * 0.30, R * 0.53, -R * 0.92);
    ctx.closePath(); ctx.fill();
    ctx.fillStyle = SKINF; circle(-4, 7, 5);
    ctx.strokeStyle = '#8d5c38'; ctx.lineWidth = 1.6;
    ctx.beginPath(); ctx.arc(-4, 7, 2.4, -0.6 * Math.PI, 0.5 * Math.PI); ctx.stroke();
    ctx.fillStyle = INK; ctx.beginPath(); ctx.ellipse(R * 0.44, R * 0.04, 3, 3.6, 0, 0, TAU); ctx.fill();
    ctx.strokeStyle = INK; ctx.lineWidth = 3; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(R * 0.22, -R * 0.20); ctx.lineTo(R * 0.60, -R * 0.24); ctx.stroke();
    ctx.lineWidth = 2.6;
    ctx.beginPath(); ctx.moveTo(R * 0.44, R * 0.50); ctx.quadraticCurveTo(R * 0.60, R * 0.54, R * 0.74, R * 0.44); ctx.stroke();
  }
  function headBackThreeQ() {
    ctx.fillStyle = SKIN; circle(0, 0, R);
    ctx.fillStyle = HAIR; circle(2, -1, R * 1.02);
    ear(-R - 2, 5);
  }
  function headBack() {
    ctx.fillStyle = SKIN; circle(0, 0, R);
    ctx.fillStyle = HAIR; circle(0, -1, R * 1.01);
    ear(-R - 2, 5); ear(R + 2, 5);
  }

  // ---- the standing body (front-family views); armR/armL override arm endpoints ----
  function standingBody(view, opts) {
    opts = opts || {};
    var sw = 44, hw = 30;
    var shoulderY = SHO - 14, neckY = HEADC + R - 2;
    shadow(52);
    // legs + shoes
    ctx.fillStyle = TRO; rr(-22, HIP, 17, -HIP - 4, 7); rr(5, HIP, 17, -HIP - 4, 7);
    ctx.fillStyle = SHOE; rr(-27, -9, 25, 11, 5); rr(2, -9, 25, 11, 5);
    // torso
    ctx.fillStyle = view === 'back' || view === 'backthreeq' ? TOP : TOP;
    ctx.beginPath();
    ctx.moveTo(-sw, shoulderY + 6);
    ctx.quadraticCurveTo(-sw - 4, (shoulderY + HIP) / 2, -hw, HIP + 8);
    ctx.quadraticCurveTo(0, HIP + 18, hw, HIP + 8);
    ctx.quadraticCurveTo(sw + 4, (shoulderY + HIP) / 2, sw, shoulderY + 6);
    ctx.quadraticCurveTo(0, shoulderY - 10, -sw, shoulderY + 6);
    ctx.closePath(); ctx.fill();
    // arms
    var aL = opts.armL || { ex: -sw - 2, ey: HIP + 4, mid: null };
    var aR = opts.armR || { ex: sw + 2, ey: HIP + 4, mid: null };
    ctx.strokeStyle = TOPD; ctx.lineCap = 'round'; ctx.lineWidth = 15;
    ctx.beginPath(); ctx.moveTo(-sw + 7, shoulderY + 12);
    if (aL.mid) ctx.lineTo(aL.mid[0], aL.mid[1]);
    ctx.lineTo(aL.ex, aL.ey); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(sw - 7, shoulderY + 12);
    if (aR.mid) ctx.lineTo(aR.mid[0], aR.mid[1]);
    ctx.lineTo(aR.ex, aR.ey); ctx.stroke();
    ctx.fillStyle = SKIN;
    circle(aL.ex, aL.ey + (aL.hand === 'up' ? 0 : 4), 7);
    circle(aR.ex, aR.ey + (aR.hand === 'up' ? 0 : 4), 7);
    // neck
    ctx.fillStyle = SKIN; rr(-8, neckY - 6, 16, 20, 5);
  }

  function profileStandBody() {
    shadow(40);
    ctx.fillStyle = TRO; rr(-8, HIP, 16, -HIP - 6, 7);
    ctx.fillStyle = SHOE; rr(-8, -12, 27, 11, 5);
    var shoulderY = SHO - 14;
    ctx.fillStyle = TOP;
    ctx.beginPath();
    ctx.moveTo(-15, shoulderY);
    ctx.quadraticCurveTo(-21, (shoulderY + HIP) / 2, -14, HIP + 9);
    ctx.lineTo(13, HIP + 9);
    ctx.quadraticCurveTo(21, (shoulderY + HIP) / 2 - 8, 16, shoulderY);
    ctx.quadraticCurveTo(0, shoulderY - 9, -15, shoulderY);
    ctx.closePath(); ctx.fill();
    bone(1, shoulderY + 9, 2, HIP + 2, 14, TOPD);       // near arm hanging
    ctx.fillStyle = TOPD; circle(1, shoulderY + 10, 10);  // deltoid
    ctx.fillStyle = SKIN; circle(2, HIP + 6, 6.5);
    ctx.fillStyle = SKIN; rr(-2, HEADC + R - 8, 12, 20, 5);
  }

  // ---- compose ----
  ctx.save();
  ctx.translate(x, gy);
  ctx.scale(s, s);
  ctx.lineJoin = 'round';

  if (pose === 'front') { standingBody('front'); ctx.save(); ctx.translate(0, HEADC); headFront(expr); ctx.restore(); }
  else if (pose === 'threeq') { standingBody('threeq'); ctx.save(); ctx.translate(0, HEADC); headThreeQ(expr, -1); ctx.restore(); }
  else if (pose === 'profile') { profileStandBody(); ctx.save(); ctx.translate(4, HEADC - 6); headProfile(); ctx.restore(); }
  else if (pose === 'backthreeq') { standingBody('backthreeq'); ctx.save(); ctx.translate(0, HEADC); headBackThreeQ(); ctx.restore(); }
  else if (pose === 'back') { standingBody('back'); ctx.save(); ctx.translate(0, HEADC); headBack(); ctx.restore(); }
  else if (pose === 'bust') {
    ctx.fillStyle = TOP;
    ctx.beginPath();
    ctx.moveTo(-40, 0); ctx.quadraticCurveTo(-38, -30, -20, -34);
    ctx.quadraticCurveTo(0, -40, 20, -34); ctx.quadraticCurveTo(38, -30, 40, 0);
    ctx.closePath(); ctx.fill();
    ctx.fillStyle = SKIN; rr(-8, -52, 16, 22, 5);
    ctx.save(); ctx.translate(0, -78); headFront(expr); ctx.restore();
  }
  else if (pose === 'run') {
    var rb = Math.sin((t || 0) * 0.02) * 2;
    ctx.fillStyle = 'rgba(30,25,20,0.10)';
    ctx.beginPath(); ctx.ellipse(6, 0, 34, 7, 0, 0, TAU); ctx.fill();
    ctx.save(); ctx.translate(0, -8 + rb);
    ctx.translate(0, HIP); ctx.rotate(0.16); ctx.translate(0, -HIP);   // strong forward lean
    bone(0, HIP, -24, HIP + 26, 20, TROD);            // back thigh, trailing
    bone(-24, HIP + 26, -46, HIP + 4, 17, TROD);      // calf kicked up behind
    ctx.fillStyle = SHOED;
    ctx.save(); ctx.translate(-50, HIP + 2); ctx.rotate(-0.85); rr(-12, -5, 24, 10, 5); ctx.restore();
    bone(0, HIP, 30, HIP + 10, 20, TRO);              // front thigh reaching
    bone(30, HIP + 10, 42, HIP + 46, 17, TRO);        // shin down-forward
    ctx.fillStyle = SHOE;
    ctx.save(); ctx.translate(44, HIP + 50); ctx.rotate(0.12); rr(-6, -5, 26, 10, 5); ctx.restore();
    ctx.fillStyle = TOP;                              // narrow profile torso
    ctx.beginPath();
    ctx.moveTo(-15, SHO - 2);
    ctx.quadraticCurveTo(-21, (SHO + HIP) / 2, -14, HIP + 9);
    ctx.lineTo(13, HIP + 9);
    ctx.quadraticCurveTo(21, (SHO + HIP) / 2 - 8, 16, SHO - 2);
    ctx.quadraticCurveTo(0, SHO - 11, -15, SHO - 2);
    ctx.closePath(); ctx.fill();
    bone(-2, SHO + 8, -22, SHO + 30, 12, TOPD);       // far arm pumping back
    ctx.fillStyle = SKINF; circle(-26, SHO + 34, 6);
    bone(2, SHO + 8, 26, SHO + 32, 14, TOPD);         // near arm bent, driving forward
    bone(26, SHO + 32, 46, SHO + 14, 12, TOPD);
    ctx.fillStyle = TOPD; circle(2, SHO + 9, 10);
    ctx.fillStyle = SKIN; circle(49, SHO + 11, 6.5);
    ctx.fillStyle = SKIN; rr(-1, HEADC + R - 10, 12, 20, 5);
    ctx.save(); ctx.translate(6, HEADC + 2); headProfile(); ctx.restore();
    ctx.restore();
  }
  else if (pose === 'wave') {
    var wag = Math.sin((t || 0) * 0.012) * 8;
    standingBody('front', {
      armR: { ex: 66 + wag * 0.4, ey: HEADC - 36, mid: [58, SHO - 22], hand: 'up' }
    });
    ctx.save(); ctx.translate(0, HEADC); headFront(expr === 'neutral' ? 'talk' : expr); ctx.restore();
  }
  else if (pose === 'point') {
    standingBody('front', {
      armL: { ex: -26, ey: HIP - 14, mid: [-54, SHO + 30] },   // hand on hip (akimbo)
      armR: { ex: 86, ey: SHO + 2, mid: null, hand: 'up' }
    });
    // a small pointing finger past the hand
    ctx.fillStyle = SKIN; rr(86, SHO - 3, 15, 9, 4);
    ctx.save(); ctx.translate(0, HEADC); headThreeQ(expr, 1); ctx.restore();
  }
  else if (pose === 'think') {
    standingBody('front', {
      armL: { ex: 12, ey: HIP - 6, mid: null },                     // folded across
      armR: { ex: 14, ey: HEADC + R + 4, mid: [34, HIP - 8], hand: 'up' }  // hand to chin
    });
    ctx.save(); ctx.translate(0, HEADC); headFront('think'); ctx.restore();
  }
  else if (pose === 'sit') {
    shadow(58);
    // crossed shins
    bone(-34, -12, 20, -22, 17, TROD); bone(34, -12, -20, -22, 17, TRO);
    ctx.fillStyle = SHOE; rr(-42, -18, 20, 10, 5);
    ctx.fillStyle = SHOED; rr(24, -18, 20, 10, 5);
    // thighs
    bone(-24, -40, -6, -26, 20, TRO); bone(24, -40, 6, -26, 20, TRO);
    // torso (lowered)
    ctx.fillStyle = TOP;
    ctx.beginPath();
    ctx.moveTo(-40, -34); ctx.quadraticCurveTo(-42, -78, -30, -96);
    ctx.quadraticCurveTo(0, -108, 30, -96); ctx.quadraticCurveTo(42, -78, 40, -34);
    ctx.quadraticCurveTo(0, -22, -40, -34);
    ctx.closePath(); ctx.fill();
    // arms resting to hands in lap
    bone(-32, -88, -12, -34, 14, TOPD); bone(32, -88, 12, -34, 14, TOPD);
    ctx.fillStyle = SKIN; circle(-8, -30, 6.5); circle(8, -30, 6.5);
    ctx.fillStyle = SKIN; rr(-8, -122, 16, 20, 5);
    ctx.save(); ctx.translate(0, -142); headFront(expr === 'neutral' ? 'neutral' : expr); ctx.restore();
  }
  ctx.restore();
}


// ============================================================================
// Sprite loader — decodes the embedded character artwork (lib/atlas-sprites.js)
// and trims each image to its alpha bounding box so feet anchor to the ground.
// Usage:  loadAtlasSprites(ATLAS_SPRITES).then((reg) => engine.setSprites(reg));
// ============================================================================
export function loadAtlasSprites(SPRITES) {
  var keys = Object.keys(SPRITES || {});
  return Promise.all(keys.map(function (k) {
    return new Promise(function (resolve) {
      var img = new Image();
      img.onload = function () {
        var m = SPRITES[k].m;
        if (m && m.bbox) {           // baked measurements from the build step
          resolve([k, { img: img, sx: m.bbox[0], sy: m.bbox[1], sw: m.bbox[2], sh: m.bbox[3],
                        headTop: m.headTop, headH: m.headH, headW: m.headW,
                        headCx: m.headCx, shoulder: m.shoulder }]);
          return;
        }
        try {
          var cv = document.createElement('canvas');
          cv.width = img.width; cv.height = img.height;
          var c2 = cv.getContext('2d');
          c2.drawImage(img, 0, 0);
          var d = c2.getImageData(0, 0, cv.width, cv.height).data;
          var minX = cv.width, minY = cv.height, maxX = -1, maxY = -1;
          for (var y = 0; y < cv.height; y++) {
            for (var x = 0; x < cv.width; x++) {
              if (d[(y * cv.width + x) * 4 + 3] > 16) {
                if (x < minX) minX = x; if (x > maxX) maxX = x;
                if (y < minY) minY = y; if (y > maxY) maxY = y;
              }
            }
          }
          if (maxX < 0) { minX = 0; minY = 0; maxX = cv.width - 1; maxY = cv.height - 1; }
          resolve([k, { img: img, sx: minX, sy: minY, sw: maxX - minX + 1, sh: maxY - minY + 1 }]);
        } catch (e) { resolve([k, { img: img, sx: 0, sy: 0, sw: img.width, sh: img.height }]); }
      };
      img.onerror = function () { resolve(null); };
      img.src = SPRITES[k].src;
    });
  })).then(function (pairs) {
    var reg = {};
    pairs.forEach(function (pr) { if (pr) reg[pr[0]] = pr[1]; });
    return reg;
  });
}
