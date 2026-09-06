import { deflateSync } from 'node:zlib';
import { writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..', 'public');

function crc32(buffer) {
  let crc = 0xffffffff;
  for (const byte of buffer) {
    crc ^= byte;
    for (let i = 0; i < 8; i += 1) crc = (crc >>> 1) ^ (0xedb88320 & -(crc & 1));
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function chunk(type, data) {
  const header = Buffer.from(type);
  const payload = Buffer.concat([header, data]);
  const length = Buffer.alloc(4);
  length.writeUInt32BE(data.length);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(payload));
  return Buffer.concat([length, payload, crc]);
}

function paint(size, x, y) {
  const nx = (x + 0.5) / size;
  const ny = (y + 0.5) / size;
  const cx = nx - 0.5;
  const cy = ny - 0.5;

  if (Math.max(Math.abs(cx), Math.abs(cy)) > 0.46) return [11, 14, 18, 255];

  const inBody = (cx * cx) / 0.11 + ((cy + 0.02) * (cy + 0.02)) / 0.145 < 1;
  const leftEye = (cx + 0.12) ** 2 + (cy + 0.02) ** 2 < 0.012;
  const rightEye = (cx - 0.12) ** 2 + (cy + 0.02) ** 2 < 0.012;
  const leftPupil = (cx + 0.12) ** 2 + (cy + 0.02) ** 2 < 0.0028;
  const rightPupil = (cx - 0.12) ** 2 + (cy + 0.02) ** 2 < 0.0028;
  const beak = Math.abs(cx) < 0.05 && cy > 0.06 && cy < 0.15 && cy > Math.abs(cx) * 1.1;

  if (leftPupil || rightPupil) return [11, 14, 18, 255];
  if (leftEye || rightEye) return [243, 234, 216, 255];
  if (beak) return [228, 184, 106, 255];
  if (inBody) return [24, 31, 41, 255];
  return [11, 14, 18, 255];
}

function png(size) {
  const raw = Buffer.alloc((size * 4 + 1) * size);
  for (let y = 0; y < size; y += 1) {
    raw[(size * 4 + 1) * y] = 0;
    for (let x = 0; x < size; x += 1) {
      const [r, g, b, a] = paint(size, x, y);
      const i = (size * 4 + 1) * y + 1 + x * 4;
      raw[i] = r;
      raw[i + 1] = g;
      raw[i + 2] = b;
      raw[i + 3] = a;
    }
  }

  const header = Buffer.alloc(13);
  header.writeUInt32BE(size, 0);
  header.writeUInt32BE(size, 4);
  header[8] = 8;
  header[9] = 6;
  return Buffer.concat([
    Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
    chunk('IHDR', header),
    chunk('IDAT', deflateSync(raw)),
    chunk('IEND', Buffer.alloc(0)),
  ]);
}

writeFileSync(join(root, 'icon-192.png'), png(192));
writeFileSync(join(root, 'icon-512.png'), png(512));
writeFileSync(join(root, 'apple-touch-icon.png'), png(180));
console.log('Icons written');
