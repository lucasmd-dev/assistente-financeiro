import { deflateSync } from 'node:zlib';
import { writeFileSync, mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';

const outputFiles = [
  ['public/apple-touch-icon.png', 180],
  ['public/pwa-icon-192.png', 192],
  ['public/pwa-icon-512.png', 512],
];

const clamp = (value, min = 0, max = 255) => Math.max(min, Math.min(max, value));
const lerp = (a, b, t) => a + (b - a) * t;
const smoothstep = (edge0, edge1, value) => {
  const t = clamp((value - edge0) / (edge1 - edge0), 0, 1);
  return t * t * (3 - 2 * t);
};

const hexToRgb = (hex) => {
  const value = hex.replace('#', '');
  return [
    parseInt(value.slice(0, 2), 16),
    parseInt(value.slice(2, 4), 16),
    parseInt(value.slice(4, 6), 16),
  ];
};

const mix = (from, to, t) => [
  lerp(from[0], to[0], t),
  lerp(from[1], to[1], t),
  lerp(from[2], to[2], t),
];

const createCanvas = (size) => ({
  size,
  pixels: new Uint8ClampedArray(size * size * 4),
});

const blendPixel = (canvas, x, y, color, alpha = 1) => {
  const xi = Math.round(x);
  const yi = Math.round(y);

  if (xi < 0 || yi < 0 || xi >= canvas.size || yi >= canvas.size || alpha <= 0) {
    return;
  }

  const index = (yi * canvas.size + xi) * 4;
  const sourceAlpha = clamp(alpha, 0, 1);
  const destAlpha = canvas.pixels[index + 3] / 255;
  const outAlpha = sourceAlpha + destAlpha * (1 - sourceAlpha);

  if (outAlpha <= 0) {
    return;
  }

  canvas.pixels[index] = ((color[0] * sourceAlpha) + (canvas.pixels[index] * destAlpha * (1 - sourceAlpha))) / outAlpha;
  canvas.pixels[index + 1] = ((color[1] * sourceAlpha) + (canvas.pixels[index + 1] * destAlpha * (1 - sourceAlpha))) / outAlpha;
  canvas.pixels[index + 2] = ((color[2] * sourceAlpha) + (canvas.pixels[index + 2] * destAlpha * (1 - sourceAlpha))) / outAlpha;
  canvas.pixels[index + 3] = outAlpha * 255;
};

const roundedRectAlpha = (x, y, rectX, rectY, width, height, radius) => {
  const px = Math.abs(x - (rectX + width / 2)) - width / 2 + radius;
  const py = Math.abs(y - (rectY + height / 2)) - height / 2 + radius;
  const outside = Math.hypot(Math.max(px, 0), Math.max(py, 0));
  const inside = Math.min(Math.max(px, py), 0);
  const distance = outside + inside - radius;

  return 1 - smoothstep(-1.2, 1.2, distance);
};

const fillRoundedRect = (canvas, x, y, width, height, radius, color, alpha = 1) => {
  const minX = Math.max(0, Math.floor(x - 2));
  const minY = Math.max(0, Math.floor(y - 2));
  const maxX = Math.min(canvas.size - 1, Math.ceil(x + width + 2));
  const maxY = Math.min(canvas.size - 1, Math.ceil(y + height + 2));

  for (let py = minY; py <= maxY; py += 1) {
    for (let px = minX; px <= maxX; px += 1) {
      blendPixel(canvas, px, py, color, alpha * roundedRectAlpha(px, py, x, y, width, height, radius));
    }
  }
};

const strokeRoundedRect = (canvas, x, y, width, height, radius, thickness, color, alpha = 1) => {
  fillRoundedRect(canvas, x, y, width, height, radius, color, alpha);
  fillRoundedRect(
    canvas,
    x + thickness,
    y + thickness,
    width - thickness * 2,
    height - thickness * 2,
    Math.max(0, radius - thickness),
    hexToRgb('#0F151C'),
    1
  );
};

const fillCircle = (canvas, cx, cy, radius, color, alpha = 1) => {
  const minX = Math.max(0, Math.floor(cx - radius - 2));
  const minY = Math.max(0, Math.floor(cy - radius - 2));
  const maxX = Math.min(canvas.size - 1, Math.ceil(cx + radius + 2));
  const maxY = Math.min(canvas.size - 1, Math.ceil(cy + radius + 2));

  for (let y = minY; y <= maxY; y += 1) {
    for (let x = minX; x <= maxX; x += 1) {
      const distance = Math.hypot(x - cx, y - cy) - radius;
      blendPixel(canvas, x, y, color, alpha * (1 - smoothstep(-1.4, 1.4, distance)));
    }
  }
};

const distanceToSegment = (px, py, ax, ay, bx, by) => {
  const dx = bx - ax;
  const dy = by - ay;
  const lengthSquared = dx * dx + dy * dy;
  const t = lengthSquared === 0 ? 0 : clamp(((px - ax) * dx + (py - ay) * dy) / lengthSquared, 0, 1);
  const x = ax + t * dx;
  const y = ay + t * dy;

  return Math.hypot(px - x, py - y);
};

const strokeLine = (canvas, ax, ay, bx, by, thickness, fromColor, toColor, alpha = 1) => {
  const padding = thickness + 3;
  const minX = Math.max(0, Math.floor(Math.min(ax, bx) - padding));
  const minY = Math.max(0, Math.floor(Math.min(ay, by) - padding));
  const maxX = Math.min(canvas.size - 1, Math.ceil(Math.max(ax, bx) + padding));
  const maxY = Math.min(canvas.size - 1, Math.ceil(Math.max(ay, by) + padding));
  const lengthSquared = (bx - ax) ** 2 + (by - ay) ** 2;

  for (let y = minY; y <= maxY; y += 1) {
    for (let x = minX; x <= maxX; x += 1) {
      const distance = distanceToSegment(x, y, ax, ay, bx, by) - thickness / 2;
      const progress = lengthSquared === 0 ? 0 : clamp(((x - ax) * (bx - ax) + (y - ay) * (by - ay)) / lengthSquared, 0, 1);
      const color = mix(fromColor, toColor, progress);

      blendPixel(canvas, x, y, color, alpha * (1 - smoothstep(-1.4, 1.4, distance)));
    }
  }

  fillCircle(canvas, ax, ay, thickness / 2, fromColor, alpha);
  fillCircle(canvas, bx, by, thickness / 2, toColor, alpha);
};

const fillBackground = (canvas) => {
  const dark = hexToRgb('#0A0D12');
  const cool = hexToRgb('#8AC8D8');
  const warm = hexToRgb('#F3A35C');
  const size = canvas.size;

  for (let y = 0; y < size; y += 1) {
    for (let x = 0; x < size; x += 1) {
      const index = (y * size + x) * 4;
      const coolGlow = Math.max(0, 1 - Math.hypot(x - size * 0.25, y - size * 0.22) / (size * 0.62)) ** 2;
      const warmGlow = Math.max(0, 1 - Math.hypot(x - size * 0.78, y - size * 0.26) / (size * 0.62)) ** 2;
      let color = mix(dark, cool, coolGlow * 0.26);
      color = mix(color, warm, warmGlow * 0.32);

      canvas.pixels[index] = color[0];
      canvas.pixels[index + 1] = color[1];
      canvas.pixels[index + 2] = color[2];
      canvas.pixels[index + 3] = 255;
    }
  }
};

const drawIcon = (size) => {
  const canvas = createCanvas(size);
  const scale = size / 512;
  const s = (value) => value * scale;
  const dark = hexToRgb('#0A0D12');
  const panel = hexToRgb('#111820');
  const panelTop = hexToRgb('#1B242E');
  const accent = hexToRgb('#F3A35C');
  const accentStrong = hexToRgb('#FFC07D');
  const cool = hexToRgb('#8AC8D8');
  const text = hexToRgb('#EEF4F7');

  fillBackground(canvas);
  fillRoundedRect(canvas, s(24), s(24), s(464), s(464), s(104), dark, 0.22);
  fillRoundedRect(canvas, s(96), s(100), s(320), s(312), s(64), panel, 0.98);
  strokeRoundedRect(canvas, s(96), s(100), s(320), s(312), s(64), Math.max(3, s(10)), accent, 0.42);
  fillRoundedRect(canvas, s(108), s(112), s(296), s(145), s(50), panelTop, 0.72);

  fillRoundedRect(canvas, s(142), s(154), s(52), s(18), s(9), cool, 0.72);
  fillRoundedRect(canvas, s(142), s(195), s(228), s(13), s(7), text, 0.09);
  fillRoundedRect(canvas, s(142), s(231), s(144), s(13), s(7), text, 0.08);
  fillRoundedRect(canvas, s(142), s(366), s(180), s(18), s(9), text, 0.16);

  strokeLine(canvas, s(151), s(321), s(212), s(265), s(30), cool, accentStrong, 1);
  strokeLine(canvas, s(212), s(265), s(262), s(292), s(30), accentStrong, accentStrong, 1);
  strokeLine(canvas, s(262), s(292), s(355), s(204), s(30), accentStrong, accent, 1);
  strokeLine(canvas, s(332), s(202), s(357), s(202), s(25), accentStrong, accentStrong, 1);
  strokeLine(canvas, s(357), s(202), s(357), s(227), s(25), accentStrong, accentStrong, 1);
  fillCircle(canvas, s(151), s(321), s(20), cool, 1);
  fillCircle(canvas, s(262), s(292), s(17), accentStrong, 1);

  return canvas;
};

const crcTable = new Uint32Array(256).map((_, n) => {
  let c = n;

  for (let k = 0; k < 8; k += 1) {
    c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  }

  return c >>> 0;
});

const crc32 = (buffer) => {
  let crc = 0xffffffff;

  for (const byte of buffer) {
    crc = crcTable[(crc ^ byte) & 0xff] ^ (crc >>> 8);
  }

  return (crc ^ 0xffffffff) >>> 0;
};

const chunk = (type, data) => {
  const typeBuffer = Buffer.from(type);
  const length = Buffer.alloc(4);
  const crc = Buffer.alloc(4);
  const content = Buffer.concat([typeBuffer, data]);

  length.writeUInt32BE(data.length, 0);
  crc.writeUInt32BE(crc32(content), 0);

  return Buffer.concat([length, content, crc]);
};

const encodePng = ({ size, pixels }) => {
  const header = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  const ihdr = Buffer.alloc(13);
  const raw = Buffer.alloc((size * 4 + 1) * size);

  ihdr.writeUInt32BE(size, 0);
  ihdr.writeUInt32BE(size, 4);
  ihdr[8] = 8;
  ihdr[9] = 6;
  ihdr[10] = 0;
  ihdr[11] = 0;
  ihdr[12] = 0;

  for (let y = 0; y < size; y += 1) {
    const rowStart = y * (size * 4 + 1);
    raw[rowStart] = 0;
    Buffer.from(pixels.buffer, y * size * 4, size * 4).copy(raw, rowStart + 1);
  }

  return Buffer.concat([
    header,
    chunk('IHDR', ihdr),
    chunk('IDAT', deflateSync(raw, { level: 9 })),
    chunk('IEND', Buffer.alloc(0)),
  ]);
};

for (const [file, size] of outputFiles) {
  const fullPath = resolve(file);
  mkdirSync(dirname(fullPath), { recursive: true });
  writeFileSync(fullPath, encodePng(drawIcon(size)));
}
