// Audit de la version 3 : captures et mesures sur chaque route, une seule page Chrome.
// Usage : node scripts/serial.mjs node tests/visual/audit-v3.mjs [base=http://127.0.0.1:5173] [--only=portail,periode] [--widths=390,1440] [--links]
// Sortie : tests/visual/out/v3/audit/<nom>-<largeur>[-en|-rm].png et audit.json (mesures).
// Mesures : debordement horizontal, erreurs console, cles UI non resolues ([a.b]), nombre de h1 et de main,
// cibles tactiles de moins de 44 px (largeurs < 768), contraste rendu des textes (WCAG AA).
import fs from 'node:fs';
import path from 'node:path';
import { chromium } from 'playwright-core';

const argv = process.argv.slice(2);
const flag = (n) => argv.find((a) => a.startsWith(`--${n}=`))?.split('=')[1];
const base = argv.find((a) => !a.startsWith('--')) ?? 'http://127.0.0.1:5173';
const only = flag('only')?.split(',');
const widthsArg = flag('widths')?.split(',').map(Number);
const checkLinks = argv.includes('--links');
const OUT = 'tests/visual/out/v3/audit';
fs.mkdirSync(OUT, { recursive: true });
const H = { 360: 800, 390: 844, 768: 1024, 1280: 800, 1440: 900, 1920: 1080 };
const WIDTHS = widthsArg ?? [360, 390, 768, 1280, 1440, 1920];

const browser = await chromium.launch({ channel: 'chrome', headless: true });
const results = [];
try {
  const ctx = await browser.newContext({ deviceScaleFactor: 1, locale: 'fr-FR' });
  await ctx.addInitScript(() => sessionStorage.setItem('tlv.seuil', '1'));
  const page = await ctx.newPage();
  let errs = [];
  page.on('pageerror', (e) => errs.push('pageerror: ' + String(e).slice(0, 300)));
  page.on('console', (m) => {
    if (m.type() === 'error' || (m.type() === 'warning' && /missing|manquant|\[.*\]/i.test(m.text()))) errs.push(m.type() + ': ' + m.text().slice(0, 300));
  });

  // Identifiants des vues de detail : premier lien trouve sur la vue liste.
  await page.setViewportSize({ width: 1440, height: 900 });
  const firstHref = async (list, re) => {
    await page.goto(base + list, { waitUntil: 'load' });
    await page.waitForTimeout(900);
    const hrefs = await page.$$eval('a[href]', (as) => as.map((a) => new URL(a.getAttribute('href'), location.href).pathname));
    return hrefs.find((h) => new RegExp(re).test(h));
  };
  const P = '/version-3';
  const period = await firstHref(P + '/chroniques', '^/version-3/chroniques/[^/]+$');
  const event = period ? await firstHref(period, '^/version-3/chroniques/[^/]+/[^/]+$') : null;
  const person = await firstHref(P + '/personnages', '^/version-3/personnages/[^/]+$');
  const dragon = (await firstHref(P + '/dragons', '^/version-3/dragons/[^/]+$')) ?? P + '/dragons/balerion';
  const war = await firstHref(P + '/guerres', '^/version-3/guerres/[^/]+$');
  const place = await firstHref(P + '/lieux', '^/version-3/lieux/[^/]+$');
  const pathL = await firstHref(P + '/apprendre', '^/version-3/apprendre/[^/]+$');
  const routes = {
    portail: P, chroniques: P + '/chroniques', periode: period, evenement: event, lignee: P + '/lignee',
    personnages: P + '/personnages', personne: person, dragons: P + '/dragons', dragon,
    guerres: P + '/guerres', guerre: war, lieux: P + '/lieux', lieu: place, langue: P + '/langue',
    lexique: P + '/langue/lexique', grammaire: P + '/langue/grammaire', expressions: P + '/langue/expressions',
    sources: P + '/sources', apprendre: P + '/apprendre', parcours: pathL, apropos: P + '/a-propos', introuvable: P + '/zzz-introuvable',
  };
  console.log(JSON.stringify(routes));

  const measure = (narrow) => page.evaluate((narrow) => {
    const cv = document.createElement('canvas'); cv.width = cv.height = 1;
    const cx = cv.getContext('2d', { willReadFrequently: true });
    const rgba = (c) => { cx.clearRect(0, 0, 1, 1); cx.fillStyle = '#010203'; cx.fillStyle = c; cx.fillRect(0, 0, 1, 1); const d = cx.getImageData(0, 0, 1, 1).data; return [d[0], d[1], d[2], d[3] / 255]; };
    const lum = ([r, g, b]) => { const f = (v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; }; return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b); };
    const bgOf = (el) => { let stack = []; for (let e = el; e; e = e.parentElement) { const s = getComputedStyle(e); if (s.backgroundImage !== 'none') return null; const c = rgba(s.backgroundColor); if (c[3] > 0) { stack.push(c); if (c[3] >= 0.99) break; } } let out = [20, 16, 17]; for (const c of stack.reverse()) out = out.map((v, i) => v * (1 - c[3]) + c[i] * c[3]); return out; };
    const vw = innerWidth;
    const over = document.documentElement.scrollWidth - vw;
    const offenders = over > 0 ? [...document.querySelectorAll('body *')].filter((e) => e.getBoundingClientRect().right > vw + 1 && getComputedStyle(e).position !== 'fixed').slice(0, 5).map((e) => e.tagName + '.' + String(e.className).slice(0, 40)) : [];
    const text = document.body.innerText;
    const keys = [...new Set(text.match(/\[[a-z0-9_]+(\.[A-Za-z0-9_-]+)+\]/g) ?? [])];
    const small = [];
    if (narrow) for (const e of document.querySelectorAll('a[href],button,input,select,[role=button],[tabindex="0"]')) {
      const r = e.getBoundingClientRect(); if (!r.width || !r.height) continue; const s = getComputedStyle(e); if (s.visibility === 'hidden') continue;
      if (r.width < 43.5 || r.height < 43.5) { const inline = s.display === 'inline' && e.closest('p,li,dd,figcaption'); if (!inline) small.push(`${e.tagName}.${String(e.className?.baseVal ?? e.className).split(/\s+/)[0].slice(0, 28)} ${Math.round(r.width)}x${Math.round(r.height)} "${(e.innerText || e.getAttribute('aria-label') || '').trim().slice(0, 30)}"`); }
    }
    const low = []; let minRatio = 99, checked = 0;
    const seen = new Set();
    const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
    while (walker.nextNode()) {
      const n = walker.currentNode; if (!n.textContent.trim()) continue; const el = n.parentElement; if (!el || seen.has(el)) continue; seen.add(el);
      if (el.closest('[aria-hidden="true"],svg')) continue;
      const r = el.getBoundingClientRect(); if (!r.width || r.bottom < 0 || r.top > innerHeight * 3) continue;
      const s = getComputedStyle(el); if (s.visibility === 'hidden' || +s.opacity === 0) continue;
      const fg = rgba(s.color); const bg = bgOf(el); if (!bg) continue;
      const f = fg.slice(0, 3).map((v, i) => v * fg[3] + bg[i] * (1 - fg[3]));
      const L1 = lum(f), L2 = lum(bg); const ratio = (Math.max(L1, L2) + 0.05) / (Math.min(L1, L2) + 0.05);
      const size = parseFloat(s.fontSize); const bold = +s.fontWeight >= 700; const large = size >= 24 || (bold && size >= 18.66);
      const need = large ? 3 : 4.5; checked++; if (ratio < minRatio) minRatio = ratio;
      if (ratio < need) low.push(`${ratio.toFixed(2)}<${need} ${Math.round(size)}px "${n.textContent.trim().slice(0, 30)}" ${s.color} on rgb(${bg.map(Math.round)})`);
    }
    return { over, offenders, keys, h1: document.querySelectorAll('h1').length, main: document.querySelectorAll('main').length, small: small.slice(0, 12), smallCount: small.length, low: low.slice(0, 12), lowCount: low.length, minRatio: +minRatio.toFixed(2), checked, introuvable: Boolean(document.querySelector('[data-ecran="introuvable"]')), h1text: document.querySelector('h1')?.innerText.slice(0, 60) };
  }, narrow);

  const shoot = async (name, url, w, suffix = '', rm = false) => {
    errs = [];
    await page.emulateMedia({ reducedMotion: rm ? 'reduce' : 'no-preference' });
    await page.setViewportSize({ width: w, height: H[w] ?? 800 });
    await page.evaluate(() => { try { localStorage.clear(); } catch {} }).catch(() => {});
    await page.goto(base + url, { waitUntil: 'load' });
    await page.waitForSelector('main h1', { timeout: 10000 }).catch(() => {});
    await page.evaluate(() => document.fonts.ready);
    await page.waitForTimeout(1100);
    const m = await measure(w < 768);
    await page.screenshot({ path: `${OUT}/${name}-${w}${suffix}.png` });
    results.push({ name, url, w, suffix, ...m, errors: [...new Set(errs)] });
  };

  for (const [name, url] of Object.entries(routes)) {
    if (!url || (only && !only.includes(name))) continue;
    for (const w of WIDTHS) await shoot(name, url, w);
    if (!widthsArg) {
      for (const w of [390, 1440]) await shoot(name, url + (url.includes('?') ? '&' : '?') + 'lang=en', w, '-en');
      if (['portail', 'periode', 'lignee'].includes(name)) for (const w of [390, 1440]) await shoot(name, url, w, '-rm', true);
    }
  }

  if (checkLinks) {
    const maxDepth = Number(flag('depth') ?? 99); const todo = [P]; const depth = new Map([[P, 0]]); const done = new Set(); const broken = [];
    await page.setViewportSize({ width: 1280, height: 800 });
    while (todo.length) {
      const p = todo.shift(); if (done.has(p)) continue; done.add(p);
      errs = [];
      await page.goto(base + p, { waitUntil: 'load' }).catch(() => {});
      await page.waitForTimeout(350);
      const info = await page.evaluate(() => ({ nf: Boolean(document.querySelector('[data-ecran="introuvable"]')), hrefs: [...document.querySelectorAll('a[href]')].map((a) => new URL(a.getAttribute('href'), location.href)).filter((u) => u.origin === location.origin).map((u) => u.pathname) })).catch(() => ({ nf: true, hrefs: [] }));
      if (info.nf || errs.some((e) => e.startsWith('pageerror'))) broken.push({ p, errs: [...new Set(errs)].slice(0, 2) });
      for (const h of info.hrefs) if (depth.get(p) < maxDepth && !done.has(h) && h.startsWith('/version-3') && !todo.includes(h)) { todo.push(h); depth.set(h, depth.get(p) + 1); }
      if (done.size % 25 === 0) console.log('visites', done.size, 'reste', todo.length);
      for (const h of info.hrefs) if (!h.startsWith('/version-')) broken.push({ p: h, from: p, reason: 'hors prefixe' });
    }
    results.push({ links: done.size, broken });
    console.log('Liens visites :', done.size, 'casses :', JSON.stringify(broken.slice(0, 40)));
  }
} finally {
  await browser.close();
}
fs.writeFileSync(`${OUT}/audit${only ? '-' + only.join('_') : ''}${checkLinks ? '-links' : ''}.json`, JSON.stringify(results, null, 1));
for (const r of results) {
  if (r.links !== undefined) continue;
  const issues = [];
  if (r.over > 0) issues.push(`overflow ${r.over}px ${r.offenders.join(',')}`);
  if (r.keys.length) issues.push('keys ' + r.keys.join(' '));
  if (r.h1 !== 1 || r.main !== 1) issues.push(`h1=${r.h1} main=${r.main}`);
  if (r.errors.length) issues.push('errors ' + r.errors.join(' | '));
  if (r.smallCount) issues.push(`small(${r.smallCount}) ${r.small.slice(0, 4).join('; ')}`);
  if (r.lowCount) issues.push(`contrast(${r.lowCount}) ${r.low.slice(0, 3).join('; ')}`);
  console.log(`${r.name}-${r.w}${r.suffix} [min ${r.minRatio}/${r.checked}]: ${issues.join(' || ') || 'ok'}`);
}
