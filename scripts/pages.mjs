// Prépare dist/ pour GitHub Pages, après « vite build » avec BASE_PATH=/Histoire-Maison-Targaryen/.
// GitHub Pages ne sert que des fichiers : chaque adresse du site reçoit donc sa propre copie
// d'index.html (réponse 200, et non la page 404), le reste retombe sur 404.html.
// Écrit aussi .nojekyll, robots.txt et sitemap.xml.
// Usage : node scripts/pages.mjs [https://drakurei.github.io/Histoire-Maison-Targaryen]
import fs from 'node:fs';
import path from 'node:path';

const DIST = path.resolve('dist');
const GEN = path.resolve('src/content/generated');
const SITE = (process.argv[2] ?? 'https://drakurei.github.io/Histoire-Maison-Targaryen').replace(/\/+$/, '');
const VERSIONS = ['version-1', 'version-2', 'version-3'];

const read = (name) => JSON.parse(fs.readFileSync(path.join(GEN, name), 'utf8'));
const { periods, events } = read('timeline.json');
const { persons } = read('people.json');
const { dragons } = read('dragons.json');
const { wars } = read('wars.json');
const { places } = read('places.json');
const { paths } = read('paths.json');

// Plan commun des trois versions (ARCHITECTURE.md), sans préfixe de version.
const plan = [
  '',
  'chroniques',
  ...periods.map((p) => `chroniques/${p.id}`),
  ...events.map((e) => `chroniques/${e.periodId}/${e.id}`),
  'lignee',
  'personnages',
  ...persons.map((p) => `personnages/${p.id}`),
  'dragons',
  ...dragons.map((d) => `dragons/${d.id}`),
  'guerres',
  ...wars.map((w) => `guerres/${w.id}`),
  'lieux',
  ...places.map((p) => `lieux/${p.id}`),
  'langue',
  'langue/lexique',
  'langue/grammaire',
  'langue/expressions',
  'sources',
  'apprendre',
  ...paths.map((p) => `apprendre/${p.id}`),
  'a-propos',
];

const routes = ['comparer', ...VERSIONS.flatMap((v) => plan.map((p) => (p ? `${v}/${p}` : v)))];

const index = path.join(DIST, 'index.html');
if (!fs.existsSync(index)) {
  console.error('dist/index.html introuvable : lancer « vite build » avant.');
  process.exit(1);
}
const html = fs.readFileSync(index);

for (const route of routes) {
  const dir = path.join(DIST, ...route.split('/'));
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, 'index.html'), html);
}
fs.writeFileSync(path.join(DIST, '404.html'), html);
fs.writeFileSync(path.join(DIST, '.nojekyll'), '');
fs.writeFileSync(path.join(DIST, 'robots.txt'), `User-agent: *\nAllow: /\n\nSitemap: ${SITE}/sitemap.xml\n`);

const urls = ['', ...routes].map((r) => `  <url><loc>${SITE}/${r ? `${r}/` : ''}</loc></url>`).join('\n');
fs.writeFileSync(
  path.join(DIST, 'sitemap.xml'),
  `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`,
);

console.log(`Pages : ${routes.length} adresses écrites, 404.html, robots.txt, sitemap.xml.`);
