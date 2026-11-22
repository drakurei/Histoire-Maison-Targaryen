// Rend un fichier local (HTML ou SVG) ou une URL en PNG avec le Chrome installé.
// Usage : node scripts/render.mjs <fichier|url> <sortie.png> [largeur=1280] [hauteur=800] [--full] [--wait=600] [--light] [--seuil]
// Ouvre Chrome sans interface, capture, referme aussitôt (machine à mémoire limitée).
import path from 'node:path';
import fs from 'node:fs';
import { pathToFileURL } from 'node:url';
import { chromium } from 'playwright-core';

const args = process.argv.slice(2);
const flags = args.filter((a) => a.startsWith('--'));
const [target, out, w = '1280', h = '800'] = args.filter((a) => !a.startsWith('--'));

if (!target || !out) {
  console.error('Usage : node scripts/render.mjs <fichier|url> <sortie.png> [largeur] [hauteur] [--full] [--wait=ms]');
  process.exit(1);
}

const wait = Number((flags.find((f) => f.startsWith('--wait=')) ?? '--wait=600').split('=')[1]);
const full = flags.includes('--full');
const isUrl = /^https?:\/\//.test(target);
let url = isUrl ? target : pathToFileURL(path.resolve(target)).href;

// Un SVG seul est enveloppé dans une page sombre pour être jugé dans son contexte.
if (!isUrl && target.toLowerCase().endsWith('.svg')) {
  const bg = flags.includes('--light') ? '#e6dcc6' : '#141011';
  const svg = fs.readFileSync(path.resolve(target), 'utf8');
  const ink = flags.includes('--light') ? '#3a1512' : '#b3151f';
  const html = `<!doctype html><meta charset="utf-8"><body style="margin:0;background:${bg};color:${ink};display:grid;place-items:center;height:100vh"><div style="width:min(80vw,80vh);height:min(80vw,80vh)">${svg.replace('<svg', '<svg style="width:100%;height:100%"')}</div>`;
  url = 'data:text/html;charset=utf-8,' + encodeURIComponent(html);
}

const browser = await chromium.launch({ channel: 'chrome', headless: true });
try {
  const page = await browser.newPage({ viewport: { width: Number(w), height: Number(h) }, deviceScaleFactor: 1 });
  // Par défaut, l'écran d'ouverture est tenu pour déjà vu (--seuil pour le garder).
  if (!flags.includes('--seuil')) await page.addInitScript(() => sessionStorage.setItem('tlv.seuil', '1'));
  const errors = [];
  page.on('pageerror', (e) => errors.push(String(e)));
  page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
  await page.goto(url, { waitUntil: 'load' });
  await page.waitForTimeout(wait);
  fs.mkdirSync(path.dirname(path.resolve(out)), { recursive: true });
  await page.screenshot({ path: out, fullPage: full });
  if (errors.length) console.log('Erreurs console :\n' + errors.join('\n'));
  console.log('PNG écrit : ' + out);
} finally {
  await browser.close();
}
