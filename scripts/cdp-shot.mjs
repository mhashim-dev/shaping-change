// Screenshot a LIVE page (with a running rAF loop) over the Chrome DevTools Protocol.
// Idle-waiting modes (--screenshot / --dump-dom with --virtual-time-budget) hang on a
// continuously-animating page; this connects to a real headless instance, waits a fixed
// real-time interval for first paint, then captures. Optionally clicks selectors first.
//
//   node scripts/cdp-shot.mjs <port> <out.png> <waitMs> [clickSelector waitMs ...]
import { writeFileSync } from 'node:fs';

const [port, out, waitMs, ...steps] = process.argv.slice(2);

async function cdp() {
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
    const mid = ++id; pending.set(mid, res);
    ws.send(JSON.stringify({ id: mid, method, params }));
  });
  const sleep = ms => new Promise(r => setTimeout(r, ms));
  return { send, sleep, close: () => ws.close() };
}

const c = await cdp();
await c.send('Page.enable');
await c.send('Runtime.enable');
await c.sleep(Number(waitMs));

// optional click steps: (selector, waitMs) pairs — click via elementFromPoint center
for (let i = 0; i < steps.length; i += 2) {
  const sel = steps[i]; const w = Number(steps[i + 1] || 800);
  const expr = `(() => { const el = document.querySelector(${JSON.stringify(sel)});
    if (!el) return 'MISS:' + ${JSON.stringify(sel)};
    el.click(); return 'OK:' + ${JSON.stringify(sel)}; })()`;
  const r = await c.send('Runtime.evaluate', { expression: expr, returnByValue: true });
  process.stderr.write(`click ${sel} -> ${r.result?.result?.value}\n`);
  await c.sleep(w);
}

const shot = await c.send('Page.captureScreenshot', { format: 'png' });
if (!shot.result?.data) { console.error('NO DATA', JSON.stringify(shot).slice(0, 300)); process.exit(1); }
writeFileSync(out, Buffer.from(shot.result.data, 'base64'));
console.log('wrote', out);
c.close();
process.exit(0);
