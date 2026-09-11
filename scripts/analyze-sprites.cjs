/* Measure each pose sprite: alpha bbox, shoulder line (first sage-shirt row),
   head band (wide rows above the shoulders). Emits data to normalise scale by
   HEAD size so the body never changes size between poses. */
const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

function paeth(a, b, c) {
  const p = a + b - c, pa = Math.abs(p - a), pb = Math.abs(p - b), pc = Math.abs(p - c);
  return (pa <= pb && pa <= pc) ? a : (pb <= pc ? b : c);
}
function decode(buf) {
  let off = 8; const chunks = [];
  while (off < buf.length) {
    const len = buf.readUInt32BE(off);
    const type = buf.toString('ascii', off + 4, off + 8);
    chunks.push({ type, data: buf.slice(off + 8, off + 8 + len) });
    off += 12 + len;
  }
  const ihdr = chunks.find((c) => c.type === 'IHDR').data;
  const width = ihdr.readUInt32BE(0), height = ihdr.readUInt32BE(4);
  const ch = ihdr[9] === 6 ? 4 : 3;
  const raw = zlib.inflateSync(Buffer.concat(chunks.filter((c) => c.type === 'IDAT').map((c) => c.data)));
  const stride = width * ch;
  const px = Buffer.alloc(height * stride);
  let pos = 0;
  for (let y = 0; y < height; y++) {
    const ft = raw[pos++]; const o = y * stride, po = (y - 1) * stride;
    for (let i = 0; i < stride; i++) {
      const a = i >= ch ? px[o + i - ch] : 0;
      const b = y > 0 ? px[po + i] : 0;
      const c = (y > 0 && i >= ch) ? px[po + i - ch] : 0;
      let v = raw[pos++];
      if (ft === 1) v = (v + a) & 255;
      else if (ft === 2) v = (v + b) & 255;
      else if (ft === 3) v = (v + ((a + b) >> 1)) & 255;
      else if (ft === 4) v = (v + paeth(a, b, c)) & 255;
      px[o + i] = v;
    }
  }
  return { width, height, ch, px };
}
const dir = path.join(__dirname, '..', 'assets', 'atlas-poses');
const out = {};
for (const f of fs.readdirSync(dir).filter((f) => f.endsWith('.png')).sort()) {
  const { width, height, ch, px } = decode(fs.readFileSync(path.join(dir, f)));
  const at = (x, y) => px[(y * width + x) * ch + 3];
  const rgb = (x, y) => [px[(y * width + x) * ch], px[(y * width + x) * ch + 1], px[(y * width + x) * ch + 2]];
  let minX = width, minY = height, maxX = -1, maxY = -1;
  const rowW = [], rowSage = [], rowCx = [];
  for (let y = 0; y < height; y++) {
    let lo = -1, hi = -1, sage = 0, sum = 0, n = 0;
    for (let x = 0; x < width; x++) {
      if (at(x, y) > 16) {
        if (lo < 0) lo = x; hi = x; sum += x; n++;
        const [r, g, b] = rgb(x, y);
        if (g > r + 18 && g > b + 6 && g > 90) sage++;
        if (x < minX) minX = x; if (x > maxX) maxX = x;
        if (y < minY) minY = y; if (y > maxY) maxY = y;
      }
    }
    rowW.push(lo < 0 ? 0 : hi - lo + 1); rowSage.push(sage); rowCx.push(n ? sum / n : 0);
  }
  // shoulder = first row (below bbox top) with a solid band of shirt colour
  let shoulder = -1;
  for (let y = minY; y <= maxY; y++) if (rowSage[y] >= 12) { shoulder = y; break; }
  // head band = rows above the shoulder at ≥62% of the max width up there
  let headW = 0, headTop = -1, headCx = 0;
  if (shoulder > 0) {
    let mw = 0;
    for (let y = minY; y < shoulder; y++) mw = Math.max(mw, rowW[y]);
    for (let y = minY; y < shoulder; y++) {
      if (rowW[y] >= mw * 0.62) { if (headTop < 0) headTop = y; if (rowW[y] > headW) { headW = rowW[y]; headCx = rowCx[y]; } }
    }
  }
  out[f] = { w: width, h: height, bbox: [minX, minY, maxX - minX + 1, maxY - minY + 1],
             shoulder, headTop, headH: shoulder - headTop, headW, headCx: Math.round(headCx) };
  console.log(f.padEnd(28), 'bboxH', String(maxY - minY + 1).padStart(3),
              'headTop', String(headTop).padStart(3), 'shoulder', String(shoulder).padStart(3),
              'headH', String(shoulder - headTop).padStart(3), 'headW', String(headW).padStart(3), 'headCx', Math.round(headCx));
}
fs.writeFileSync(path.join(__dirname, '..', 'assets', 'sprite-metrics.json'), JSON.stringify(out, null, 1));
console.log('\nwrote assets/sprite-metrics.json');
