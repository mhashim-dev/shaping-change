// Full-page screenshot over CDP (captureBeyondViewport), for static pages taller than
// the viewport — e.g. the 22-screen contact sheet.
//   node scripts/shot-full.mjs <port> <out.png> <waitMs>
import { writeFileSync } from 'node:fs';
const [port, out, waitMs] = process.argv.slice(2);

const list = await (await fetch(`http://127.0.0.1:${port}/json`)).json();
const page = list.find(t => t.type === 'page') || list[0];
const ws = new WebSocket(page.webSocketDebuggerUrl);
await new Promise(r => ws.addEventListener('open', r, { once: true }));
let id = 0; const pend = new Map();
ws.addEventListener('message', e => {
  const m = JSON.parse(e.data);
  if (m.id && pend.has(m.id)) { pend.get(m.id)(m); pend.delete(m.id); }
});
const send = (method, params = {}) => new Promise(res => {
  const mid = ++id; pend.set(mid, res); ws.send(JSON.stringify({ id: mid, method, params }));
});
const sleep = ms => new Promise(r => setTimeout(r, ms));

await send('Page.enable'); await send('Runtime.enable');
await sleep(Number(waitMs));
const meta = await send('Runtime.evaluate', {
  expression: 'JSON.stringify({w:document.body.scrollWidth,h:document.body.scrollHeight})',
  returnByValue: true
});
const { w, h } = JSON.parse(meta.result.result.value);
process.stderr.write('page ' + w + 'x' + h + '\n');
const shot = await send('Page.captureScreenshot', {
  format: 'png', captureBeyondViewport: true,
  clip: { x: 0, y: 0, width: w, height: h, scale: 1 }
});
if (!shot.result?.data) { console.error('NO DATA'); process.exit(1); }
writeFileSync(out, Buffer.from(shot.result.data, 'base64'));
console.log('wrote', out, w + 'x' + h);
ws.close(); process.exit(0);
