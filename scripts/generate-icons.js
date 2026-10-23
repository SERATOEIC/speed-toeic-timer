import fs from 'node:fs';
import path from 'node:path';
import zlib from 'node:zlib';

// Function to generate a raw uncompressed PNG buffer
function createPng(width, height, drawFn) {
  // 4 channels RGBA
  const rowSize = width * 4;
  const rawData = Buffer.alloc((rowSize + 1) * height);

  for (let y = 0; y < height; y++) {
    const rowOffset = y * (rowSize + 1);
    rawData[rowOffset] = 0; // Filter type: None
    for (let x = 0; x < width; x++) {
      const pixelOffset = rowOffset + 1 + x * 4;
      const [r, g, b, a] = drawFn(x, y, width, height);
      rawData[pixelOffset] = r;
      rawData[pixelOffset + 1] = g;
      rawData[pixelOffset + 2] = b;
      rawData[pixelOffset + 3] = a;
    }
  }

  const deflated = zlib.deflateSync(rawData);

  // Helper CRC32
  const crcTable = new Uint32Array(256);
  for (let i = 0; i < 256; i++) {
    let c = i;
    for (let k = 0; k < 8; k++) {
      c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    }
    crcTable[i] = c;
  }

  function crc32(buf) {
    let c = 0xffffffff;
    for (let i = 0; i < buf.length; i++) {
      c = crcTable[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
    }
    return (c ^ 0xffffffff) >>> 0;
  }

  function makeChunk(type, data) {
    const len = data.length;
    const buf = Buffer.alloc(8 + len + 4);
    buf.writeUInt32BE(len, 0);
    buf.write(type, 4, 4, 'ascii');
    data.copy(buf, 8);
    const crc = crc32(buf.subarray(4, 8 + len));
    buf.writeUInt32BE(crc, 8 + len);
    return buf;
  }

  // PNG Signature
  const signature = Buffer.from([137, 80, 78, 79, 13, 10, 26, 10]);

  // IHDR
  const ihdrData = Buffer.alloc(13);
  ihdrData.writeUInt32BE(width, 0);
  ihdrData.writeUInt32BE(height, 4);
  ihdrData[8] = 8; // Bit depth
  ihdrData[9] = 6; // Color type: RGBA
  ihdrData[10] = 0; // Compression
  ihdrData[11] = 0; // Filter
  ihdrData[12] = 0; // Interlace

  const ihdr = makeChunk('IHDR', ihdrData);
  const idat = makeChunk('IDAT', deflated);
  const iend = makeChunk('IEND', Buffer.alloc(0));

  return Buffer.concat([signature, ihdr, idat, iend]);
}

// Draw TOEIC speed clock icon
function renderClockIcon(x, y, w, h, isMaskable = false) {
  const cx = w / 2;
  const cy = h / 2;
  const dx = x - cx;
  const dy = y - cy;
  const dist = Math.sqrt(dx * dx + dy * dy);

  // Background gradient: dark navy (#020617 to #0f172a)
  const normY = y / h;
  let bgR = Math.round(2 + normY * 13);
  let bgG = Math.round(6 + normY * 17);
  let bgB = Math.round(23 + normY * 19);

  if (isMaskable) {
    // Solid full bleed for maskable
    // Clock outer radius
    const radius = w * 0.38;
    if (dist <= radius) {
      // Clock dial
      if (dist >= radius - 8) {
        return [59, 130, 246, 255]; // Blue border
      } else if (dist >= radius - 14) {
        return [30, 58, 138, 255]; // Deep navy ring
      } else {
        // Dial face
        // Hands
        // Center pin
        if (dist <= 10) return [239, 68, 68, 255]; // Red pin
        // Hour hand pointing 10 o'clock
        const angle = Math.atan2(dy, dx);
        // Check 10 o'clock hand (~ -2.35 rad)
        const hourAngle = -2.2;
        const minAngle = 0.5; // ~ 10-15 min mark
        const dHourAngle = Math.abs(angle - hourAngle);
        const dMinAngle = Math.abs(angle - minAngle);

        if (dist < radius * 0.55 && (dHourAngle < 0.12 || dHourAngle > Math.PI * 2 - 0.12)) {
          return [255, 255, 255, 255];
        }
        if (dist < radius * 0.75 && (dMinAngle < 0.08 || dMinAngle > Math.PI * 2 - 0.08)) {
          return [56, 189, 248, 255]; // Sky blue min hand
        }
        return [15, 23, 42, 255];
      }
    }
    return [bgR, bgG, bgB, 255];
  } else {
    // Squircle container
    const cornerR = w * 0.22;
    // Check squircle distance
    const qx = Math.max(0, Math.abs(dx) - (w / 2 - cornerR));
    const qy = Math.max(0, Math.abs(dy) - (h / 2 - cornerR));
    const outsideDist = Math.sqrt(qx * qx + qy * qy);

    if (outsideDist > cornerR) {
      return [0, 0, 0, 0]; // Transparent outside squircle
    }

    // Border of squircle
    if (outsideDist >= cornerR - 3) {
      return [59, 130, 246, 255];
    }

    // Clock outer radius
    const radius = w * 0.36;
    if (dist <= radius) {
      if (dist >= radius - 6) {
        return [59, 130, 246, 255]; // Blue border
      } else if (dist >= radius - 12) {
        return [30, 58, 138, 255]; // Ring
      } else {
        // Center pin
        if (dist <= 8) return [239, 68, 68, 255];
        const angle = Math.atan2(dy, dx);
        const hourAngle = -2.2;
        const minAngle = 0.5;
        const dHourAngle = Math.abs(angle - hourAngle);
        const dMinAngle = Math.abs(angle - minAngle);

        if (dist < radius * 0.55 && (dHourAngle < 0.12 || dHourAngle > Math.PI * 2 - 0.12)) {
          return [255, 255, 255, 255];
        }
        if (dist < radius * 0.75 && (dMinAngle < 0.08 || dMinAngle > Math.PI * 2 - 0.08)) {
          return [56, 189, 248, 255];
        }
        return [15, 23, 42, 255];
      }
    }

    return [bgR, bgG, bgB, 255];
  }
}

const publicDir = path.resolve('public');
if (!fs.existsSync(publicDir)) {
  fs.mkdirSync(publicDir, { recursive: true });
}

// Generate icons
fs.writeFileSync(
  path.join(publicDir, 'pwa-192x192.png'),
  createPng(192, 192, (x, y, w, h) => renderClockIcon(x, y, w, h, false))
);
console.log('Created pwa-192x192.png');

fs.writeFileSync(
  path.join(publicDir, 'pwa-512x512.png'),
  createPng(512, 512, (x, y, w, h) => renderClockIcon(x, y, w, h, false))
);
console.log('Created pwa-512x512.png');

fs.writeFileSync(
  path.join(publicDir, 'pwa-maskable-512x512.png'),
  createPng(512, 512, (x, y, w, h) => renderClockIcon(x, y, w, h, true))
);
console.log('Created pwa-maskable-512x512.png');

fs.writeFileSync(
  path.join(publicDir, 'apple-touch-icon.png'),
  createPng(180, 180, (x, y, w, h) => renderClockIcon(x, y, w, h, true))
);
console.log('Created apple-touch-icon.png');
