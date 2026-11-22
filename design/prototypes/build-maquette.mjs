#!/usr/bin/env node
// Assemble la maquette en UN fichier HTML autonome (polices, jetons, sceau et données inclus),
// lisible hors ligne par simple double-clic. Aucune dépendance.
// Usage : node design/prototypes/build-maquette.mjs

import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, '..', '..');
const read = (...parts) => readFile(path.join(ROOT, ...parts), 'utf8');
const json = async (...parts) => JSON.parse(await read(...parts));

async function inlineFonts() {
  const dir = path.join(ROOT, 'assets', 'fonts');
  let css = await readFile(path.join(dir, 'fonts.css'), 'utf8');
  const files = [...new Set([...css.matchAll(/url\('\.\/([^']+\.woff2)'\)/g)].map((match) => match[1]))];
  for (const file of files) {
    const base64 = (await readFile(path.join(dir, file))).toString('base64');
    css = css.replaceAll(`url('./${file}')`, `url(data:font/woff2;base64,${base64})`);
  }
  return css.replace(/\/\*[\s\S]*?\*\//g, '');
}

const [template, css, js, tokens, seal, lexicon, timeline, dragons, genealogy, sources, fonts] = await Promise.all([
  read('design', 'prototypes', 'src', 'template.html'),
  read('design', 'prototypes', 'src', 'maquette.css'),
  read('design', 'prototypes', 'src', 'maquette.js'),
  read('design', 'design-system', 'tokens.css'),
  read('design', 'design-system', 'sceau.svg'),
  json('content', 'glossary', 'lexicon.json'),
  json('content', 'timeline', 'timeline.json'),
  json('content', 'dragons', 'dragons.json'),
  json('content', 'genealogy', 'genealogy.json'),
  json('content', 'sources', 'sources.json'),
  inlineFonts(),
]);

const sealUri = `data:image/svg+xml;base64,${Buffer.from(seal).toString('base64')}`;
const sealInline = seal
  .replace(/<\?xml[^>]*\?>\s*/, '')
  .replace(/<!--[\s\S]*?-->/g, '')
  .replace(/<svg([^>]*?)\swidth="\d+"\sheight="\d+"/, '<svg$1')
  .replace('<svg ', '<svg class="seuil__sceau" aria-hidden="true" ')
  .replace(/\srole="img"\saria-labelledby="[^"]*"/, '')
  .replace(/<title[\s\S]*?<\/title>\s*<desc[\s\S]*?<\/desc>/, '');
const favicon = `data:image/svg+xml,${encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16"><circle cx="8" cy="8" r="8" fill="#0B0A0A"/><path fill="none" stroke="#C8A45A" stroke-width="1.1" d="M8 1.2A7.12 7.12 0 0 1 8 14.8A7.12 7.12 0 0 1 8 1.2Z"/><path fill="#EFE7D6" d="M8 3.2C8.6 4.8 9.9 5.7 9.9 7.3A1.9 1.9 0 0 1 6.1 7.3C6.1 5.7 7.4 4.8 8 3.2Z"/><path fill="#C8A45A" d="M7.3 10H8.7V12.8H7.3Z"/></svg>')}`;

const data = {
  sealUri,
  lexicon: lexicon.entries,
  timeline: {
    periods: timeline.periods.map((period) => ({
      ...period,
      events: [...period.events]
        .sort((a, b) => (a.sortYear ?? a.year ?? 0) - (b.sortYear ?? b.year ?? 0))
        .map(({ reliabilityNoteFr, verifiedOnline, sortYear, ...event }) => event),
    })),
  },
  dragons: dragons.dragons,
  genealogy: { persons: genealogy.persons, unions: genealogy.unions, parentage: genealogy.parentage, mainThread: genealogy.mainThread.ids },
  sources: { sources: sources.sources, reliabilityLevels: sources.reliabilityLevels },
};
const safeJson = JSON.stringify(data).replace(/</g, '\\u003c');

const fill = (source, values) => Object.entries(values).reduce((text, [key, value]) => text.replace(`{{${key}}}`, () => value), source);
const html = fill(template, { FAVICON: favicon, FONTS: fonts, TOKENS: tokens, CSS: css, SCEAU_INLINE: sealInline, DATA: safeJson, JS: js });
const out = path.join(HERE, 'maquette.html');
await writeFile(out, html, 'utf8');
console.log(`maquette.html : ${(Buffer.byteLength(html) / 1024).toFixed(0)} Kio`);
