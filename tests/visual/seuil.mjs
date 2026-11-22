// Capture l'écran d'ouverture à plusieurs instants, puis le site une fois le seuil levé.
// Usage : node tests/visual/seuil.mjs [url=http://127.0.0.1:4173/?seuil] [largeur=1440] [hauteur=900]
import fs from 'node:fs';
import { chromium } from 'playwright-core';

const [url = 'http://127.0.0.1:4173/?seuil', w = '1440', h = '900'] = process.argv.slice(2);
const out = 'tests/visual/out';
fs.mkdirSync(out, { recursive: true });

const browser = await chromium.launch({ channel: 'chrome', headless: true });
try {
  const page = await browser.newPage({ viewport: { width: Number(w), height: Number(h) } });
  const errors = [];
  page.on('pageerror', (e) => errors.push(String(e)));
  page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
  const t0 = Date.now();
  await page.goto(url);
  for (const ms of [500, 1400, 2600, 3600, 5200, 7500]) {
    await page.waitForTimeout(Math.max(0, ms - (Date.now() - t0)));
    await page.screenshot({ path: `${out}/seuil-${w}-${String(ms).padStart(4, '0')}.png` });
  }
  const stillOpen = await page.evaluate(() => Boolean(document.querySelector('[aria-busy]')));
  console.log('Seuil encore présent à 7,5 s :', stillOpen);
  if (errors.length) console.log('Erreurs :\n' + errors.join('\n'));
} finally {
  await browser.close();
}
