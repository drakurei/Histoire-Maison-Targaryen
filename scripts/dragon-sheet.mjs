// Planche de contrôle du dragon procédural.
// Usage : node scripts/dragon-sheet.mjs [--crop=x,y,largeur,hauteur]
// Écrit design/prototypes/dragon-sheet.svg, à rendre ensuite avec :
//   node scripts/render.mjs design/prototypes/dragon-sheet.svg design/prototypes/dragon-sheet.png 1800 1400
// La planche porte son propre fond de vélin ; scripts/render.mjs l'inscrit dans un carré de
// 1120 px, d'où son format carré. Elle passe d'abord tous les looks (planche, registre, cas
// limites) par une série de contrôles et sort en erreur si l'un d'eux échoue.
// Node 24 importe directement le TypeScript effaçable de src/.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDragon, DRAGON_PARTS } from '../src/core/dragons/geometry.ts';
import { layoutDragonScale, humanFigure } from '../src/core/dragons/scale.ts';
import { dragonLayers, layerCss, layerPath } from '../src/shared/dragon/layers.ts';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const out = path.join(root, 'design', 'prototypes', 'dragon-sheet.svg');

// Looks de contrôle. Les teintes suivent ce que les livres décrivent ; les proportions sont
// des ordres de grandeur choisis pour éprouver le générateur. Les looks du site viennent de
// content/dragons/looks.json : la dernière bande de la planche les montre tous.
const attested = { body: true, wing: true, crest: false, flame: false, size: false };
const LOOKS = [
  { id: 'balerion', name: 'Balerion', note: 'noir', span: 1, neck: 0.5, tail: 0.62, horns: 3, body: '#1f1b1c', wing: '#2d2627', crest: '#131011', flame: '#b8281f' },
  { id: 'vhagar', name: 'Vhagar', note: 'bronze, reflets bleu-vert', span: 0.94, neck: 0.42, tail: 0.5, horns: 2, body: '#7d5c2e', wing: '#55766a', crest: '#4a3619', flame: '#d98a2b' },
  { id: 'meraxes', name: 'Meraxes', note: 'argent', span: 0.82, neck: 0.5, tail: 0.6, horns: 2, body: '#b4b8bc', wing: '#9aa0a6', crest: '#6f7479', flame: '#d2a23c' },
  { id: 'caraxes', name: 'Caraxes', note: 'rouge sang, cou très long', span: 0.58, neck: 1, tail: 0.88, horns: 2, body: '#8c1a1a', wing: '#a32a23', crest: '#3d0e0d', flame: '#e2a530' },
  { id: 'syrax', name: 'Syrax', note: 'jaune', span: 0.5, neck: 0.5, tail: 0.55, horns: 1, body: '#d3ad38', wing: '#dcc162', crest: '#96761d', flame: '#e6c24a' },
  { id: 'sunfyre', name: 'Sunfyre', note: 'or, membranes rose pâle', span: 0.44, neck: 0.56, tail: 0.6, horns: 2, body: '#d6a436', wing: '#ecc4be', crest: '#b07f27', flame: '#f0cf62' },
  { id: 'dreamfyre', name: 'Dreamfyre', note: 'bleu pâle marqué d’argent', span: 0.6, neck: 0.5, tail: 0.66, horns: 1, body: '#a5bfd3', wing: '#b8cddb', crest: '#cdd2d6', flame: '#c9dcea' },
  { id: 'meleys', name: 'Meleys', note: 'écarlate, membranes roses, crêtes cuivre', span: 0.58, neck: 0.44, tail: 0.54, horns: 2, body: '#bd281e', wing: '#e3a3a1', crest: '#ae6835', flame: '#e0a04a' },
  { id: 'seasmoke', name: 'Seasmoke', note: 'gris argent pâle', span: 0.4, neck: 0.5, tail: 0.55, horns: 1, body: '#c0c4c6', wing: '#d2d5d6', crest: '#9a9fa2', flame: '#dfe3e4' },
  { id: 'arrax', name: 'Arrax', note: 'blanc nacré, petit', span: 0.16, neck: 0.36, tail: 0.44, horns: 0.6, body: '#e8e3d6', wing: '#f0ebe0', crest: '#cdb565', flame: '#e3c64f' },
].map((l) => ({ ...l, attested }));

const look = (id) => LOOKS.find((l) => l.id === id);

/** Les looks réels du registre, tels que les pages les recevront. */
function registry() {
  try {
    const file = JSON.parse(fs.readFileSync(path.join(root, 'content', 'dragons', 'looks.json'), 'utf8'));
    return file.items.map((item) => ({ id: item.dragonId, ...item.look }));
  } catch {
    return [];
  }
}
const REGISTRY = registry();

/* ------------------------------------------------------------------ contrôles */

const problems = [];
const EXTREMES = [
  { id: 'minimal', span: 0.05, neck: 0, tail: 0, horns: 0 },
  { id: 'maximal', span: 1.5, neck: 1, tail: 1, horns: 3 },
  { id: 'cou seul', span: 0.3, neck: 1, tail: 0, horns: 1.5 },
  { id: 'queue seule', span: 0.3, neck: 0, tail: 1, horns: 0.4 },
  { id: 'valeurs absentes', span: Number.NaN, neck: undefined, tail: null, horns: 'x' },
];
const checked = [...LOOKS, ...REGISTRY, ...EXTREMES];
for (const l of checked) {
  const frames = [0, 0.25, 0.5, 0.75].map((flap) => buildDragon(l, { flap, tailCurve: 0.3, neckCurve: 0.2 }));
  for (const g of frames) {
    if (g.viewBox !== frames[0].viewBox) problems.push(`${l.id} : le cadre change avec la phase`);
    for (const name of DRAGON_PARTS) {
      const d = g.parts[name];
      const mayBeEmpty = (name === 'horns' && !(l.horns >= 0.06)) || name === 'bodyMarks';
      if (typeof d !== 'string') problems.push(`${l.id} : partie ${name} absente`);
      else if (/NaN|Infinity|undefined/.test(d)) problems.push(`${l.id} : ${name} contient une valeur invalide`);
      else if (d === '' && !mayBeEmpty) problems.push(`${l.id} : ${name} vide`);
    }
    // Le dragon tient dans son cadre à toutes les phases.
    if (g.anchors.wingtipL[0] < g.box.x || g.anchors.wingtipR[0] > g.box.x + g.box.width) problems.push(`${l.id} : une aile sort du cadre`);
  }
  const again = buildDragon(l, { flap: 0.25, tailCurve: 0.3, neckCurve: 0.2 });
  if (JSON.stringify(again.parts) !== JSON.stringify(frames[1].parts)) problems.push(`${l.id} : résultat non déterministe`);
  // Le battement est cyclique : la phase 1 rejoint la phase 0.
  const cycle = buildDragon(l, { flap: 1, tailCurve: 0.3, neckCurve: 0.2 });
  if (cycle.parts.wingMembraneR !== frames[0].parts.wingMembraneR) problems.push(`${l.id} : le battement ne boucle pas`);
  // Le battement plie l'aile : ce n'est pas une mise à l'échelle.
  const open = frames[0].anchors.wingtipR[0] - frames[0].anchors.wristR[0];
  const folded = frames[2].anchors.wingtipR[0] - frames[2].anchors.wristR[0];
  if (!(folded < open * 0.7)) problems.push(`${l.id} : l'aile ne se replie pas à la remontée`);
}
// Les paramètres changent vraiment la silhouette.
{
  const a = buildDragon(look('balerion'));
  const c = buildDragon(look('caraxes'));
  const x = buildDragon(look('arrax'));
  if (!(c.metrics.length > a.metrics.length * 1.08)) problems.push('Caraxes n’est pas nettement plus long que Balerion');
  if (a.parts.body === x.parts.body || a.parts.wingMembraneR === x.parts.wingMembraneR) problems.push('Balerion et Arrax ont la même silhouette');
}

/* ------------------------------------------------------------------ dessin */

const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;');

// Contrôle rapproché : --crop=x,y,largeur,hauteur ne garde que les figures du cadre, à pleine
// précision (ne pas laisser le fichier recadré en place).
const crop = (process.argv.find((a) => a.startsWith('--crop=')) ?? '').slice(7).split(',').map(Number);
const cropped = crop.length === 4 && crop.every(Number.isFinite);

/**
 * Réécrit un tracé à l'unité près et en coordonnées relatives. La planche entière passe en
 * URL de données dans scripts/render.mjs : elle doit peser moins de 2 Mo une fois encodée.
 */
function leanPath(d) {
  const tokens = d.match(/[MLCZ]|-?\d*\.?\d+/g) ?? [];
  let lean = '';
  let cx = 0;
  let cy = 0;
  let sx = 0;
  let sy = 0;
  const put = (n) => {
    const s = String(n);
    lean += /\d$/.test(lean) && s[0] !== '-' ? ` ${s}` : s;
  };
  let i = 0;
  while (i < tokens.length) {
    const cmd = tokens[i++];
    if (cmd === 'Z') {
      lean += 'z';
      cx = sx;
      cy = sy;
      continue;
    }
    lean += cmd.toLowerCase();
    let ex = cx;
    let ey = cy;
    for (let k = cmd === 'C' ? 3 : 1; k > 0; k--) {
      ex = Math.round(Number(tokens[i++]));
      ey = Math.round(Number(tokens[i++]));
      put(ex - cx);
      put(ey - cy);
    }
    cx = ex;
    cy = ey;
    if (cmd === 'M') {
      sx = cx;
      sy = cy;
    }
  }
  return lean;
}

/** Un dragon dans un cadre : même recette de couches que le composant React. */
function figure(l, { x, y, w, h, tone = 'specimen', ground = 'light', pose = {}, fine = false, known = {}, detail = 'fine' }) {
  if (cropped && (x > crop[0] + crop[2] || x + w < crop[0] || y > crop[1] + crop[3] || y + h < crop[1])) return '';
  const g = buildDragon(l, { flap: 0, ...pose });
  const write = cropped || fine ? (d) => d : leanPath;
  const paths = dragonLayers(l, tone, ground, known, detail)
    .map((item) => `<path d="${write(layerPath(item, g.parts))}" style="${layerCss(item)}"/>`)
    .join('');
  return `<svg x="${x}" y="${y}" width="${w}" height="${h}" viewBox="${g.viewBox}" style="overflow:visible">${paths}</svg>`;
}

const VELIN = 'oklch(0.90 0.035 84)';
const ENCRE = 'oklch(0.24 0.02 40)';
const ENCRE_PALE = 'oklch(0.42 0.025 45)';
const OBSIDIENNE = 'oklch(0.14 0.012 25)';
const IVOIRE = 'oklch(0.93 0.025 85)';
const CENDRE = 'oklch(0.62 0.012 55)';

const text = (x, y, s, { size = 22, fill = ENCRE, italic = false, anchor = 'start', weight = 400 } = {}) =>
  `<text x="${x}" y="${y}" font-size="${size}" fill="${fill}" text-anchor="${anchor}" font-weight="${weight}"${italic ? ' font-style="italic"' : ''}>${esc(s)}</text>`;

const W = 2400;
const H = 2400;
const parts = [];
parts.push(`<rect width="${W}" height="${H}" fill="${VELIN}"/>`);
const inked = (ink, paper, inner) => `<g style="--dragon-ink:${ink};--dragon-paper:${paper};color:${ink}">${inner}</g>`;
const caption = (x, y, s, fill = ENCRE_PALE) => text(x, y, s, { size: 21, fill, italic: true });

// 1. Dix spécimens, envergure normalisée : on juge les silhouettes.
LOOKS.forEach((l, i) => {
  const col = i % 5;
  const row = Math.floor(i / 5);
  const x = 40 + col * 466;
  const y = 30 + row * 500;
  const flip = i % 2 === 0 ? 1 : -1;
  parts.push(figure(l, { x, y, w: 440, h: 388, pose: { tailCurve: 0.34 * flip, neckCurve: 0.16 * flip } }));
  parts.push(text(x + 6, y + 424, l.name, { size: 31, weight: 600 }));
  parts.push(caption(x + 6, y + 452, l.note));
  parts.push(text(x + 6, y + 476, `envergure ${l.span}, cou ${l.neck}, queue ${l.tail}, cornes ${l.horns}`, { size: 17.5, fill: ENCRE_PALE }));
});

// 2. Quatre phases du battement (Caraxes) : le poignet plie, les doigts se resserrent.
const phases = [
  [0, 'phase 0 : ailes étendues'],
  [0.25, 'phase 0,25 : fin de l’abaissée'],
  [0.5, 'phase 0,5 : remontée, aile repliée'],
  [0.75, 'phase 0,75 : haut de la remontée'],
];
phases.forEach(([flap, label], i) => {
  const x = 40 + i * 345;
  parts.push(figure(look('caraxes'), { x, y: 1040, w: 330, h: 360, pose: { flap, tailCurve: 0.34 * Math.cos(Math.PI * 2 * flap), neckCurve: 0.14 } }));
  parts.push(caption(x + 6, 1432, label));
});

// 3. Gravure : trait seul et hachures.
parts.push(inked(ENCRE, VELIN, figure(look('vhagar'), { x: 1470, y: 1030, w: 890, h: 650, tone: 'engraving', fine: true, pose: { tailCurve: -0.4, neckCurve: -0.22 } })));
parts.push(caption(1476, 1716, 'gravure : trait seul et hachures (Vhagar)'));

// 4. Lisibilité à petite taille : 120 px de large sur le rendu de 1120 px.
const SMALL = (120 * W) / 1120;
['balerion', 'caraxes', 'sunfyre', 'arrax'].forEach((id, i) => {
  parts.push(figure(look(id), { x: 40 + i * 278, y: 1466, w: SMALL, h: 232, detail: 'plain', pose: { tailCurve: 0.3 } }));
});
parts.push(inked(ENCRE, VELIN, figure(look('meraxes'), { x: 40 + 4 * 278, y: 1466, w: SMALL, h: 232, tone: 'engraving', detail: 'plain', pose: { tailCurve: 0.3 } })));
parts.push(caption(46, 1726, 'les mêmes à 120 px de large (rendu de 1120 px), détail « plain »'));

// 5. Sur obsidienne : liseré clair ; gravure en clair sur sombre ; ton « ombre » sur vélin.
parts.push(`<rect x="0" y="1750" width="1190" height="322" fill="${OBSIDIENNE}"/>`);
['balerion', 'arrax', 'dreamfyre'].forEach((id, i) => {
  parts.push(figure(look(id), { x: 16 + i * 242, y: 1766, w: 234, h: 262, ground: 'dark', pose: { tailCurve: -0.3, neckCurve: 0.1 } }));
});
parts.push(inked(IVOIRE, OBSIDIENNE, figure(look('caraxes'), { x: 742, y: 1766, w: 234, h: 262, tone: 'engraving', ground: 'dark', pose: { tailCurve: 0.4, neckCurve: -0.2 } })));
parts.push(`<rect x="990" y="1764" width="188" height="270" fill="${VELIN}"/>`);
parts.push(`<g style="opacity:0.46">${figure(look('vhagar'), { x: 994, y: 1770, w: 180, h: 258, tone: 'shadow', pose: { flap: 0.12, bank: 0.5, tailCurve: 0.4 } })}</g>`);
parts.push(caption(22, 2058, 'sur obsidienne : liseré clair, gravure en clair ; à droite le ton « ombre », roulis 0,5', CENDRE));

// 6. Échelle comparée : chacun à l'échelle de son envergure, épaules alignées, un homme pour repère.
function scaleRow(ids, { x, y, width, height, gap }) {
  const layout = layoutDragonScale(ids.map((id) => ({ id, look: look(id) })), { gap });
  const k = Math.min(width / layout.width, height / layout.height);
  for (const item of layout.items) {
    parts.push(figure(look(item.id), { x: x + item.x * k, y: y + item.y * k, w: item.width * k, h: item.height * k, detail: 'plain', pose: { tailCurve: 0.3, neckCurve: 0.12 } }));
  }
  const man = humanFigure();
  const mh = layout.human.height * k;
  const mw = (mh * man.width) / man.height;
  parts.push(
    `<svg x="${x + layout.human.x * k - mw / 2}" y="${y + layout.human.y * k - mh}" width="${mw}" height="${mh}" viewBox="0 0 ${man.width} ${man.height}"><path d="${man.d}" fill="${ENCRE}"/></svg>`,
  );
}
scaleRow(['balerion', 'caraxes', 'syrax', 'arrax'], { x: 1224, y: 1756, width: 800, height: 290, gap: 0.04 });
scaleRow(['arrax'], { x: 2060, y: 1756, width: 310, height: 290, gap: 0.06 });
parts.push(caption(1230, 2058, 'échelle comparée, un homme pour repère (1/50 de Balerion) ; à droite, Arrax et l’homme'));

// 7. Les looks du registre (content/dragons/looks.json), tels que les pages les recevront.
// Ce que les livres ne décrivent pas est laissé au trait (unattested="bare").
REGISTRY.forEach((l, i) => {
  const col = i % 14;
  const row = Math.floor(i / 14);
  const x = 30 + col * 168;
  const y = 2086 + row * 156;
  parts.push(inked(ENCRE, VELIN, figure(l, { x, y, w: 158, h: 122, known: l.attested, detail: 'plain', pose: { tailCurve: i % 2 === 0 ? 0.3 : -0.3, neckCurve: 0.12 } })));
  parts.push(text(x + 79, y + 142, l.id, { size: 16, fill: ENCRE_PALE, anchor: 'middle' }));
});

const view = cropped ? crop.join(' ') : `0 0 ${W} ${H}`;
const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${view}" font-family="Alegreya Sans, Alegreya, Georgia, serif">${parts.join('\n')}</svg>\n`;
fs.mkdirSync(path.dirname(out), { recursive: true });
fs.writeFileSync(out, svg, 'utf8');

const encoded = encodeURIComponent(svg).length;
console.log(`Planche écrite : ${path.relative(root, out)} (${Math.round(svg.length / 1024)} Ko, ${Math.round(encoded / 1024)} Ko encodée)`);
if (encoded > 1_950_000) problems.push('planche trop lourde pour scripts/render.mjs (URL de données limitée à 2 Mo)');
if (problems.length) {
  console.error('Contrôles en échec :\n' + [...new Set(problems)].join('\n'));
  process.exitCode = 1;
} else {
  console.log(`Contrôles : ${checked.length} looks (dont ${REGISTRY.length} du registre et ${EXTREMES.length} cas limites), 4 phases, ${DRAGON_PARTS.length} parties, cadres stables, tracés valides, battement cyclique et replié, résultat déterministe.`);
}
