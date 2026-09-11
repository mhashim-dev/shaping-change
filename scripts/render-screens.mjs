// Render the screens-harness over CDP, one 1600x900 PNG per block (avoids Chrome's
// ~16k-px single-screenshot ceiling). Reads document.title ("SCREENS <n> <f1,f2,...>")
// for the screen order, then captures each block via a clip at its y-offset.
//   node render-sheet.mjs <port> <outDir> <waitMs>
import { writeFileSync } from 'node:fs';
import { join } from 'node:path';
const [port, outDir, waitMs] = process.argv.slice(2);
const BLOCK_H = 900, BLOCK_W = 1600;

const list = await (await fetch(`http://127.0.0.1:${port}/json`)).json();
const page = list.find(t => t.type === 'page') || list[0];
const ws = new WebSocket(page.webSocketDebuggerUrl);
await new Promise(r => ws.addEventListener('open', r, { once: true }));
let id = 0; const pending = new Map();
ws.addEventListener('message', e => {
  const m = JSON.parse(e.data);
  if (m.id && pending.has(m.id)) { pending.get(m.id)(m); pending.delete(m.id); }
});
const send = (method, params = {}) => new Promise(res => {
  const mid = ++id; pending.set(mid, res); ws.send(JSON.stringify({ id: mid, method, params }));
});
const sleep = ms => new Promise(r => setTimeout(r, ms));

await send('Page.enable'); await send('Runtime.enable');
// Pin the layout viewport to the block width so the desktop layout is used
// (a narrow default window would trip the @media (max-width:900px) mobile rule).
await send('Emulation.setDeviceMetricsOverride', {
  width: BLOCK_W, height: BLOCK_H, deviceScaleFactor: 1, mobile: false
});
await sleep(Number(waitMs));

const meta = await send('Runtime.evaluate', {
  expression: 'JSON.stringify({ title: document.title, h: document.body.scrollHeight })',
  returnByValue: true
});
const info = JSON.parse(meta.result.result.value);
const names = info.title.replace(/^SCREENS \d+ /, '').split(',');
process.stderr.write('screens: ' + names.length + ' | page h: ' + info.h + '\n');

for (let i = 0; i < names.length; i++) {
  const shot = await send('Page.captureScreenshot', {
    format: 'png',
    captureBeyondViewport: true,
    clip: { x: 0, y: i * BLOCK_H, width: BLOCK_W, height: BLOCK_H, scale: 1 }
  });
  if (!shot.result?.data) { console.error('NO DATA for', names[i]); process.exit(1); }
  const file = join(outDir, names[i] + '.png');
  writeFileSync(file, Buffer.from(shot.result.data, 'base64'));
  process.stderr.write('  wrote ' + names[i] + '.png\n');
}
console.log('OK ' + names.length);
ws.close(); process.exit(0);
