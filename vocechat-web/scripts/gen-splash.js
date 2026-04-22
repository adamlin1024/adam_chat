#!/usr/bin/env node
// Generates solid-color iOS splash PNGs for modern iPhones (no external deps)
const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

const R = 0x08, G = 0x09, B = 0x0b; // #08090b

function crc32(buf) {
  const t = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = (c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1);
    t[n] = c;
  }
  let crc = 0xFFFFFFFF;
  for (let i = 0; i < buf.length; i++) crc = t[(crc ^ buf[i]) & 0xFF] ^ (crc >>> 8);
  return (crc ^ 0xFFFFFFFF) >>> 0;
}

function makeChunk(type, data) {
  const tb = Buffer.from(type, 'ascii');
  const len = Buffer.alloc(4); len.writeUInt32BE(data.length);
  const crcVal = Buffer.alloc(4);
  crcVal.writeUInt32BE(crc32(Buffer.concat([tb, data])));
  return Buffer.concat([len, tb, data, crcVal]);
}

function solidPNG(w, h) {
  const sig = Buffer.from([0x89,0x50,0x4E,0x47,0x0D,0x0A,0x1A,0x0A]);
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(w, 0); ihdr.writeUInt32BE(h, 4);
  ihdr[8] = 8; ihdr[9] = 2; // 8-bit RGB, no alpha

  // One row: filter=0, then RGB for each pixel
  const row = Buffer.alloc(1 + w * 3);
  for (let x = 0; x < w; x++) { row[1+x*3]=R; row[2+x*3]=G; row[3+x*3]=B; }

  // All rows are identical — zlib will compress them to near-nothing
  const raw = Buffer.alloc(h * row.length);
  for (let y = 0; y < h; y++) row.copy(raw, y * row.length);

  const idat = zlib.deflateSync(raw, { level: 9 });
  return Buffer.concat([sig, makeChunk('IHDR', ihdr), makeChunk('IDAT', idat), makeChunk('IEND', Buffer.alloc(0))]);
}

const sizes = [
  { name: 'iphone12mini_splash',   w: 1080, h: 2340 }, // 12 mini, 13 mini       360×780 @3x
  { name: 'iphone12_splash',       w: 1170, h: 2532 }, // 12, 13, 14, 16         390×844 @3x
  { name: 'iphone14pro_splash',    w: 1179, h: 2556 }, // 14 Pro, 15, 15 Pro, 16 Pro(same) 393×852 @3x — but 16 Pro is 402×874
  { name: 'iphone12max_splash',    w: 1284, h: 2778 }, // 12/13 Pro Max, 14 Plus 428×926 @3x
  { name: 'iphone14promax_splash', w: 1290, h: 2796 }, // 14 Pro Max, 15 Plus, 15 Pro Max, 16 Plus 430×932 @3x
  { name: 'iphone16pro_splash',    w: 1206, h: 2622 }, // 16 Pro                 402×874 @3x
  { name: 'iphone16promax_splash', w: 1320, h: 2868 }, // 16 Pro Max             440×956 @3x
];

const outDir = path.join(__dirname, '..', 'public', 'splash');

for (const { name, w, h } of sizes) {
  const outPath = path.join(outDir, `${name}.png`);
  process.stdout.write(`generating ${name}.png (${w}×${h})... `);
  const png = solidPNG(w, h);
  fs.writeFileSync(outPath, png);
  console.log(`${(png.length / 1024).toFixed(1)} KB`);
}
console.log('done');
