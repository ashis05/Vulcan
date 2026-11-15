#!/usr/bin/env node
// Screenshots every prototype screen in frontend/Design/screens into docs/readme/screens/*.jpg
// (phone viewport, 2x), for the README gallery and the header image.
//
//   cd docs/readme && npm install --no-save --no-package-lock playwright && npx playwright install chromium
//   node shoot.cjs
//
// Then rebuild the header: python3 docs/readme/make_svg.py
const path = require('path');
const fs = require('fs');
const { chromium } = require('playwright');

const ROOT = path.resolve(__dirname, '..', '..');
const SRC = path.join(ROOT, 'frontend', 'Design', 'screens');
const OUT = path.join(__dirname, 'screens');
// The splash redirects to the welcome screen almost at once, so it has no picture of its own.
const SKIP = new Set(['s01-splash.html']);

(async () => {
  fs.mkdirSync(OUT, { recursive: true });
  const browser = await chromium.launch();
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 });
  // Some screens style their containers with display:flex, which beats the [hidden] attribute,
  // so the loading skeleton would stay on top of the real content.
  await ctx.addInitScript(() => document.addEventListener('DOMContentLoaded', () => {
    const s = document.createElement('style');
    s.textContent = '[hidden]{display:none!important}';
    document.head.appendChild(s);
  }));
  const files = fs.readdirSync(SRC).filter((f) => /^s\d\d-.*\.html$/.test(f) && !SKIP.has(f)).sort();
  for (const f of files) {
    const page = await ctx.newPage();
    await page.goto('file://' + path.join(SRC, f), { waitUntil: 'networkidle' });
    await page.waitForTimeout(2500); // let entrance animations and fake loading finish
    await page.screenshot({ path: path.join(OUT, f.replace('.html', '.jpg')), type: 'jpeg', quality: 82 });
    await page.close();
    console.log('shot', f);
  }
  await browser.close();
})();
