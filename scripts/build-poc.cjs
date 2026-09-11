/* scripts/build-poc.cjs — assemble a single, self-contained proof-of-concept HTML.
   Inlines the REAL engine, audio and content (just stripping ES `export`) plus the
   vanilla UI shell, so the whole game runs from one double-clickable file (offline).
   Run:  node scripts/build-poc.cjs   →  Power-Pressure-Choice-POC.html  */
const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const read = (p) => fs.readFileSync(path.join(root, p), 'utf8');
// turn ES modules into plain classic-script globals
const strip = (s) => s.replace(/^export function /gm, 'function ').replace(/^export const /gm, 'var ');

const css = read('app/globals.css');
const engine = strip(read('lib/tree-engine.js'));
const audio = strip(read('lib/audio-engine.js'));
const content = strip(read('lib/game-content.js'));
const i18n = strip(read('lib/i18n.js'));
const ui = read('scripts/poc-ui.js');

const pocCss = `
/* ---- proof-of-concept shell ---- */
body { -webkit-tap-highlight-color: transparent; }
.poc-loading {
  position: fixed; inset: 0; display: flex; align-items: center; justify-content: center;
  color: rgba(245,239,226,0.5); font: italic 400 15px/1.4 Georgia, serif; letter-spacing: .02em;
}
.poc-note {
  position: fixed; left: 12px; bottom: 10px; z-index: 5;
  font: 600 10px/1.3 Helvetica, Arial, sans-serif; letter-spacing: .14em; text-transform: uppercase;
  color: rgba(245,239,226,0.28); pointer-events: none;
}
@media (max-width: 900px) { .poc-note { display: none; } }
`;

const guard = '</scr' + 'ipt>'; // avoid a literal closing tag if any source ever contains one
[engine, audio, content, i18n, ui].forEach((s) => {
  if (s.indexOf(guard) !== -1) throw new Error('source contains a literal </script>; inlining unsafe');
});

const parts = [
  '<!doctype html>',
  '<html lang="en">',
  '<head>',
  '<meta charset="utf-8">',
  '<meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no">',
  '<meta name="description" content="Shaping Change: Building strong roots for safety — interactive proof of concept. A reflective, branching tree that mirrors how pressure becomes behaviour.">',
  '<title>Shaping Change — Proof of Concept</title>',
  '<style>', css, pocCss, '</style>',
  '</head>',
  '<body>',
  '<div class="poc-loading">Growing the scene…</div>',
  '<div class="poc-note">Shaping Change · Proof of Concept</div>',
  '<noscript><div class="poc-loading">This proof of concept needs JavaScript enabled to run.</div></noscript>',
  '<script>', engine, '</script>',
  '<script>', audio, '</script>',
  '<script>', content, '</script>',
  '<script>', i18n, '</script>',
  '<script>', ui, '</script>',
  // the UI mounts synchronously above; clear the loading splash now
  '<script>(function(){var l=document.querySelector(".poc-loading");if(l)l.remove();})();</script>',
  '</body>',
  '</html>',
  '',
];

const html = parts.join('\n');
// write to the project root (easy to find) and into docs/ (with the team materials)
const outs = ['Power-Pressure-Choice-POC.html', 'docs/Power-Pressure-Choice-POC.html'];
outs.forEach(function (rel) { fs.writeFileSync(path.join(root, rel), html); });
const kb = (Buffer.byteLength(html) / 1024).toFixed(0);
console.log('built (' + kb + ' KB):\n  ' + outs.join('\n  '));
