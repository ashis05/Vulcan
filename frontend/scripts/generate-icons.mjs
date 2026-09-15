// Regenerates the launcher/splash icons from the VULCAN Spark mark.
// The launcher icon pairs the mark with the plain "VULCAN" wordmark used in
// index.tsx (not the decorative wordmark.png asset).
// Usage: node scripts/generate-icons.mjs
import { mkdirSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

import { Resvg } from '@resvg/resvg-js';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const out = join(root, 'assets', 'images');
const boldFont = join(root, 'node_modules', '@expo-google-fonts', 'space-grotesk', '700Bold', 'SpaceGrotesk_700Bold.ttf');

const SPARK = 'M12 2 13.75 10.25 22 12 13.75 13.75 12 22 10.25 13.75 2 12 10.25 10.25Z';
const BG = '#0B0B0D';
const WORD = '#F5F2EC';

function buildSvg({ size, sparkCenterY, sparkSpan, word }) {
  const scale = sparkSpan / 20;
  const wordSize = Math.round(size * 0.115);
  const wordSpacing = Math.round(size * 0.028);
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
  <defs>
    <linearGradient id="spark" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#FFB347"/>
      <stop offset="55%" stop-color="#FF6A00"/>
      <stop offset="100%" stop-color="#E63E00"/>
    </linearGradient>
    <radialGradient id="glow" cx="50%" cy="50%" r="50%">
      <stop offset="0%" stop-color="#FF6A00" stop-opacity="0.35"/>
      <stop offset="60%" stop-color="#E63E00" stop-opacity="0.12"/>
      <stop offset="100%" stop-color="#E63E00" stop-opacity="0"/>
    </radialGradient>
  </defs>
  <circle cx="${size / 2}" cy="${sparkCenterY}" r="${size * 0.4}" fill="url(#glow)"/>
  <path transform="matrix(${scale} 0 0 ${scale} ${size / 2 - 12 * scale} ${sparkCenterY - 12 * scale})" d="${SPARK}" fill="url(#spark)"/>
  ${
    word
      ? `<text x="${size / 2}" y="${Math.round(size * 0.8)}" text-anchor="middle" font-family="Space Grotesk" font-weight="700" font-size="${wordSize}" letter-spacing="${wordSpacing}" fill="${WORD}">${word}</text>`
      : ''
  }
</svg>`;
}

function render(svgString, size, background) {
  const withBg = background
    ? svgString.replace('<defs>', `<rect width="${size}" height="${size}" fill="${background}"/><defs>`)
    : svgString;
  const resvg = new Resvg(withBg, {
    fitTo: { mode: 'width', value: size },
    font: { fontFiles: [boldFont], loadSystemFonts: false, defaultFontFamily: 'Space Grotesk' },
  });
  return resvg.render().asPng();
}

const outputs = [
  // Launcher icon is the Spark mark only; the wordmark text lives on the splash.
  { file: 'icon.png', size: 1024, sparkCenterY: 512, sparkSpan: 640, word: null, background: BG },
  { file: 'android-icon-foreground.png', size: 1024, sparkCenterY: 512, sparkSpan: 560, word: null, background: null },
  { file: 'splash-icon.png', size: 1024, sparkCenterY: 512, sparkSpan: 820, word: null, background: null },
  { file: 'favicon.png', size: 64, sparkCenterY: 32, sparkSpan: 46, word: null, background: BG },
];

mkdirSync(out, { recursive: true });
for (const o of outputs) {
  const png = render(buildSvg(o), o.size, o.background);
  writeFileSync(join(out, o.file), png);
  console.log('wrote', o.file);
}
