// Contrôle de la racine et du seuil sur la V3 : « / » mène à /version-3, « /?seuil » joue l'ouverture puis rend la V3.
// Usage : node scripts/serial.mjs node tests/visual/seuil-v3.mjs [base=http://127.0.0.1:5173]
import fs from 'node:fs';
import { chromium } from 'playwright-core';

const base = process.argv[2] ?? 'http://127.0.0.1:5173';
const out = 'tests/visual/out/v3/audit';
fs.mkdirSync(out, { recursive: true });
const browser = await chromium.launch({ channel: 'chrome', headless: true });
try {
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  const errors = [];
  page.on('pageerror', (e) => errors.push(String(e)));
  page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
  await page.goto(base + '/', { waitUntil: 'load' });
  await page.waitForTimeout(800);
  console.log('Racine mène à :', new URL(page.url()).pathname);
  await page.goto(base + '/?seuil', { waitUntil: 'load' });
  const t0 = Date.now();
  for (const ms of [600, 2000, 4000, 8000]) {
    await page.waitForTimeout(Math.max(0, ms - (Date.now() - t0)));
    await page.screenshot({ path: `${out}/seuil-${ms}.png` });
  }
  const state = await page.evaluate(() => ({ path: location.pathname, busy: Boolean(document.querySelector('[aria-busy="true"]')), v3: Boolean(document.querySelector('.v3 main h1')) }));
  console.log('Après 8 s :', JSON.stringify(state));
  if (errors.length) console.log('Erreurs :\n' + errors.join('\n'));
} finally {
  await browser.close();
}
