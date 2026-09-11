/* scripts/slice-png.cjs — dependency-free PNG row-slicer (Node built-ins only).
   Crops horizontal bands out of a non-interlaced 8-bit PNG with explicit top-left
   geometry — used to cut a tall contact-sheet into individual screen images.
   Usage:  node scripts/slice-png.cjs <input.png> <outDir> <y> <h> <name> [<y> <h> <name> ...] */
const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

function crc32(buf) {
  let c = ~0;
  for (let i = 0; i < buf.length; i++) {
    c ^= buf[i];
    for (let k = 0; k < 8; k++) c = (c >>> 1) ^ (0xEDB88320 & -(c & 1));
  }
  return (~c) >>> 0;
}
function readChunks(buf) {
  let off = 8; const chunks = [];
  while (off < buf.length) {
    const len = buf.readUInt32BE(off);
    const type = buf.toString('ascii', off + 4, off + 8);
    chunks.push({ type, data: buf.slice(off + 8, off + 8 + len) });
    off += 12 + len;
  }
  return chunks;
}
function chunk(type, data) {
  const len = Buffer.alloc(4); len.writeUInt32BE(data.length, 0);
  const t = Buffer.from(type, 'ascii');
  const crc = Buffer.alloc(4); crc.writeUInt32BE(crc32(Buffer.concat([t, data])), 0);
  return Buffer.concat([len, t, data, crc]);
}
function paeth(a, b, c) {
  const p = a + b - c, pa = Math.abs(p - a), pb = Math.abs(p - b), pc = Math.abs(p - c);
  return (pa <= pb && pa <= pc) ? a : (pb <= pc ? b : c);
}
function decode(buf) {
  const chunks = readChunks(buf);
  const ihdr = chunks.find((c) => c.type === 'IHDR').data;
  const width = ihdr.readUInt32BE(0), height = ihdr.readUInt32BE(4);
  const bitDepth = ihdr[8], colorType = ihdr[9], interlace = ihdr[12];
  if (bitDepth !== 8) throw new Error('unsupported bit depth ' + bitDepth);
  if (interlace !== 0) throw new Error('interlaced PNG not supported');
  const ch = colorType === 6 ? 4 : colorType === 2 ? 3 : colorType === 4 ? 2 : colorType === 0 ? 1 : null;
  if (!ch) throw new Error('unsupported color type ' + colorType);
  const raw = zlib.inflateSync(Buffer.concat(chunks.filter((c) => c.type === 'IDAT').map((c) => c.data)));
  const stride = width * ch;
  const px = Buffer.alloc(height * stride);
  let pos = 0;
  for (let y = 0; y < height; y++) {
    const ft = raw[pos++];
    const o = y * stride, po = (y - 1) * stride;
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
  return { width, height, ch, colorType, stride, px };
}
function encode(width, height, ch, colorType, px, srcStride, srcY) {
  const stride = width * ch;
  const raw = Buffer.alloc(height * (stride + 1));
  for (let y = 0; y < height; y++) {
    raw[y * (stride + 1)] = 0; // filter: none
    px.copy(raw, y * (stride + 1) + 1, (srcY + y) * srcStride, (srcY + y) * srcStride + stride);
  }
  const idat = zlib.deflateSync(raw, { level: 9 });
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0); ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8; ihdr[9] = colorType;
  const sig = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  return Buffer.concat([sig, chunk('IHDR', ihdr), chunk('IDAT', idat), chunk('IEND', Buffer.alloc(0))]);
}

const [, , input, outDir, ...rest] = process.argv;
const img = decode(fs.readFileSync(input));
for (let i = 0; i + 2 < rest.length; i += 3) {
  const y = +rest[i], h = +rest[i + 1], name = rest[i + 2];
  if (y < 0 || y + h > img.height) throw new Error('crop ' + name + ' out of bounds');
  fs.writeFileSync(path.join(outDir, name), encode(img.width, h, img.ch, img.colorType, img.px, img.stride, y));
  console.log(name + ': ' + img.width + 'x' + h + ' @y=' + y);
}
