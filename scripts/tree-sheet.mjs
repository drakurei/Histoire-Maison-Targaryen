// Planche de contrôle de l'arbre généalogique.
// Usage : node scripts/tree-sheet.mjs [--view=sheet|tree|thread] [--crop=x,y,l,h] [--quiet]
// Écrit design/prototypes/tree-check.svg, à rendre ensuite avec :
//   node scripts/render.mjs design/prototypes/tree-check.svg design/prototypes/tree-check.png 2400 1600 --light
// --view=sheet  (défaut) : l'arbre entier en haut, le fil vertical découpé en colonnes en bas.
// --view=tree   : l'arbre seul.   --view=thread : le fil vertical seul, en colonnes.
// --crop=x,y,l,h : une fenêtre de l'arbre (ou du fil avec --view=thread), en coordonnées de la
//                  mise en page, pour la relire à l'échelle 1.
// Le script sort en erreur (code 1) si un contrôle échoue.
// Node 24 importe directement le TypeScript effaçable de src/.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildGraph, consanguinity, generationsOf } from '../src/core/genealogy/graph.ts';
import { layoutThread, layoutTree } from '../src/core/genealogy/layout.ts';
import { auditLayout } from '../src/core/genealogy/audit.ts';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const out = path.join(root, 'design', 'prototypes', 'tree-check.svg');
const flags = process.argv.slice(2);
const flag = (name, fallback) => (flags.find((f) => f.startsWith(`--${name}=`)) ?? `--${name}=${fallback}`).split('=')[1];
const view = flag('view', 'sheet');
const crop = flag('crop', '');
const quiet = flags.includes('--quiet');

/* ------------------------------------------------------------------ données */

// Sortie normalisée de scripts/build-content.mjs, déjà à la forme de src/core/content/types.ts.
const raw = JSON.parse(fs.readFileSync(path.join(root, 'src', 'content', 'generated', 'people.json'), 'utf8'));
const persons = raw.persons;
const personById = new Map(persons.map((p) => [p.id, p]));
const unionById = new Map(raw.unions.map((u) => [u.id, u]));
const parentageByChild = new Map(raw.parentage.map((p) => [p.child, p]));
const mainThread = raw.mainThread;
// Étiquette de planche : le prénom et son numéro, sans le nom de maison ni la précision entre parenthèses.
const shortName = (p) => p.name.fr.replace(/ \(.*\)$/, '').replace(/ Targaryen$/, '');
// Le fil reçoit la règle de l'interface : un enfant dont le nom déborde de sa case prend toute la ligne.
const SMALL_TEXT = 10.5;
const threadOptions = { wideChild: (p, width) => shortName(p).length * SMALL_TEXT * 0.56 > width - 6 };

/* ------------------------------------------------------------------ calcul et contrôles */

const problems = [];
const t0 = performance.now();
const graph = buildGraph(persons, raw.unions, raw.parentage);
const t1 = performance.now();
const tree = layoutTree(graph);
const t2 = performance.now();
const again = layoutTree(buildGraph(persons, raw.unions, raw.parentage));
const t3 = performance.now();
const thread = layoutThread(graph, mainThread, threadOptions);
const t4 = performance.now();

if (graph.issues.length) problems.push(`graphe : ${graph.issues.length} anomalie(s) : ${graph.issues.map((i) => `${i.kind} ${i.ref}`).join(', ')}`);
if (JSON.stringify(again) !== JSON.stringify(tree)) problems.push('arbre : résultat non déterministe');
if (JSON.stringify(layoutThread(graph, mainThread, threadOptions)) !== JSON.stringify(thread)) problems.push('fil : résultat non déterministe');
const computed = generationsOf(graph);
for (const p of persons) if (computed.get(p.id) !== p.generation) problems.push(`génération : ${p.id} vaut ${p.generation}, recalculée ${computed.get(p.id)}`);
if (tree.nodes.length !== persons.length) problems.push(`arbre : ${tree.nodes.length} cases pour ${persons.length} personnes`);
if (tree.links.length !== graph.parentage.filter((p) => graph.parentIds.get(p.child)?.length).length) problems.push('arbre : il manque des filiations');
for (const u of raw.unions) if (!tree.unions.some((m) => m.id === u.id)) problems.push(`arbre : union sans point : ${u.id}`);
for (const n of tree.nodes) if (n.generation !== personById.get(n.id).generation) problems.push(`arbre : ${n.id} hors de sa rangée`);
if (/NaN|Infinity|null/.test(JSON.stringify([tree.nodes, tree.unions.map((u) => [u.x, u.y, u.ties]), tree.links.map((l) => l.points), tree.bounds]))) problems.push('arbre : coordonnée invalide');
if (/NaN|Infinity/.test(JSON.stringify(thread))) problems.push('fil : coordonnée invalide');
for (const id of mainThread) if (!thread.nodes.some((n) => n.id === id && n.role === 'thread')) problems.push(`fil : maillon absent : ${id}`);

const outside = (layout) => {
  const { width, height } = layout.bounds;
  const off = (p) => p.x < 0 || p.y < 0 || p.x > width || p.y > height;
  return (
    layout.nodes.filter((n) => off(n) || off({ x: n.x + n.w, y: n.y + n.h })).length +
    layout.links.filter((l) => l.points.some(off)).length +
    layout.unions.filter((u) => off(u) || u.ties.some((t) => t.points.some(off))).length
  );
};

const treeAudit = auditLayout(tree);
const threadAudit = auditLayout(thread);
const report = (name, layout, audit, { combs }) => {
  if (audit.nodeOverlaps.length) problems.push(`${name} : ${audit.nodeOverlaps.length} chevauchement(s) de cases : ${audit.nodeOverlaps.slice(0, 6).map((p) => p.join(' / ')).join(' ; ')}`);
  if (audit.linesThroughNodes.length) problems.push(`${name} : ${audit.linesThroughNodes.length} tracé(s) à travers une case : ${audit.linesThroughNodes.slice(0, 8).join(' ; ')}`);
  if (audit.markersInNodes.length) problems.push(`${name} : point d'union dans une case : ${audit.markersInNodes.join(' ; ')}`);
  if (audit.loose.length) problems.push(`${name} : ${audit.loose.length} tracé(s) détaché(s) : ${audit.loose.slice(0, 8).join(' ; ')}`);
  if (audit.diagonals) problems.push(`${name} : ${audit.diagonals} segment(s) en biais`);
  if (audit.overlaps) problems.push(`${name} : ${audit.overlaps} superposition(s) de tracés`);
  if (!combs && audit.combs) problems.push(`${name} : ${audit.combs} tracé(s) partagent un départ`);
  const off = outside(layout);
  if (off) problems.push(`${name} : ${off} élément(s) hors du cadre`);
};
report('arbre', tree, treeAudit, { combs: false });
report('fil', thread, threadAudit, { combs: true });
if (treeAudit.duplicates.length) problems.push(`arbre : personnes en double : ${treeAudit.duplicates.join(', ')}`);
// Dans le fil, une personne ne peut reparaître que marquée `repeat`.
const firstSeen = new Set();
for (const n of thread.nodes) {
  if (firstSeen.has(n.id) && !n.repeat) problems.push(`fil : ${n.id} redessiné sans marque`);
  firstSeen.add(n.id);
}

// Crochets (unions dont les conjoints ne se touchent pas) et longueur totale des tracés.
const lengthOf = (points) => points.slice(1).reduce((sum, p, i) => sum + Math.abs(p.x - points[i].x) + Math.abs(p.y - points[i].y), 0);
const hooks = tree.unions.filter((u) => u.ties.some((t) => t.route === 'over' || t.route === 'under'));
const descents = tree.unions.filter((u) => u.ties.some((t) => t.route === 'descent'));
const ink = Math.round(tree.links.reduce((s, l) => s + lengthOf(l.points), 0) + tree.unions.reduce((s, u) => s + u.ties.reduce((k, t) => k + lengthOf(t.points), 0), 0));

/* ------------------------------------------------------------------ dessin */

const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;');
const VELIN = '#e9dfc9';
const ENCRE = '#2a1a16';
const ENCRE_PALE = '#6b5a50';
const ROUGE = '#9c1b22';
const OR = '#8a6a1c';
const CASE = '#f5eedc';

const d = (points) => points.map((p, i) => `${i ? 'L' : 'M'}${p.x} ${p.y}`).join('');
const years = (p) => (p.born === null && p.died === null ? '' : `${p.born ?? '?'} – ${p.died ?? (p.alive ? '' : '?')}`);

function drawNode(n, { small = false } = {}) {
  const p = personById.get(n.id);
  const blood = p.house === 'targaryen' || p.house === 'blackfyre';
  const stroke = p.king ? OR : blood ? ROUGE : ENCRE_PALE;
  const size = small ? SMALL_TEXT : 12.5;
  const label = shortName(p);
  const max = Math.floor(n.w / (size * 0.56));
  const shown = label.length > max ? `${label.slice(0, max - 1)}…` : label;
  const two = !small && n.h >= 40;
  return (
    `<rect x="${n.x}" y="${n.y}" width="${n.w}" height="${n.h}" fill="${n.repeat ? 'none' : CASE}" stroke="${stroke}" stroke-width="${p.king ? 2.4 : 1.1}"${p.legitimacy === 'batard' ? ' stroke-dasharray="5 3"' : ''}/>` +
    `<text x="${n.x + n.w / 2}" y="${n.y + (two ? n.h / 2 - 3 : n.h / 2 + size * 0.35)}" font-size="${size}" text-anchor="middle" fill="${ENCRE}"${p.king ? ' font-weight="700"' : ''}${n.repeat ? ' font-style="italic"' : ''}>${esc(shown)}</text>` +
    (two ? `<text x="${n.x + n.w / 2}" y="${n.y + n.h / 2 + 13}" font-size="10" text-anchor="middle" fill="${ENCRE_PALE}">${esc(years(p))}</text>` : '')
  );
}

function drawLayout(layout, { small = false } = {}) {
  const parts = [];
  for (const link of layout.links) {
    const certainty = parentageByChild.get(link.to)?.certainty;
    parts.push(`<path d="${d(link.points)}" fill="none" stroke="${ENCRE}" stroke-width="1.3"${certainty && certainty !== 'etabli' ? ' stroke-dasharray="2 3"' : ''}/>`);
  }
  for (const union of layout.unions) {
    const type = union.unionId ? unionById.get(union.unionId)?.type : 'liaison';
    const color = union.consanguineous ? ROUGE : ENCRE_PALE;
    for (const tie of union.ties) {
      parts.push(`<path d="${d(tie.points)}" fill="none" stroke="${color}" stroke-width="${union.consanguineous ? 2 : 1.3}"${type === 'mariage' ? '' : ' stroke-dasharray="6 3"'}/>`);
    }
  }
  for (const node of layout.nodes) parts.push(drawNode(node, { small: small || node.h < 34 }));
  for (const union of layout.unions) {
    parts.push(`<circle cx="${union.x}" cy="${union.y}" r="${union.consanguineous ? 5 : 4}" fill="${union.consanguineous ? ROUGE : VELIN}" stroke="${union.consanguineous ? ROUGE : ENCRE_PALE}" stroke-width="1.3"/>`);
  }
  return parts.join('');
}

function drawTree() {
  const rows = tree.rows
    .map((row) => `<text x="6" y="${row.y + row.height / 2 + 4}" font-size="11" fill="${ENCRE_PALE}">${row.generation}</text>`)
    .join('');
  return rows + drawLayout(tree);
}

/** Le fil découpé en `columns` colonnes, à l'échelle `scale`, posé en (x0, y0). Rend le dessin et sa taille. */
function drawThreadColumns(columns, scale, x0, y0, gap = 28) {
  const perColumn = Math.ceil(thread.steps.length / columns);
  const drawing = drawLayout(thread);
  const parts = [];
  let tallest = 0;
  let count = 0;
  for (let c = 0; c < columns; c += 1) {
    const steps = thread.steps.slice(c * perColumn, (c + 1) * perColumn);
    if (steps.length === 0) continue;
    const top = steps[0].y - 12;
    const next = thread.steps[(c + 1) * perColumn];
    const bottom = next ? next.y - 4 : thread.bounds.height;
    const w = thread.bounds.width * scale;
    const h = (bottom - top) * scale;
    const x = x0 + count * (w + gap);
    parts.push(
      `<rect x="${x}" y="${y0}" width="${w}" height="${h}" fill="none" stroke="${ENCRE_PALE}" stroke-width="1" stroke-dasharray="3 5"/>` +
        `<svg x="${x}" y="${y0}" width="${w}" height="${h}" viewBox="0 ${top} ${thread.bounds.width} ${bottom - top}">${drawing}</svg>`,
    );
    tallest = Math.max(tallest, h);
    count += 1;
  }
  return { svg: parts.join(''), width: count * (thread.bounds.width * scale + gap) - gap, height: tallest };
}

const text = (x, y, s, size = 22, fill = ENCRE, extra = '') => `<text x="${x}" y="${y}" font-size="${size}" fill="${fill}"${extra}>${esc(s)}</text>`;

let W;
let H;
let body;
if (crop) {
  const [x, y, w, h] = crop.split(',').map(Number);
  W = w;
  H = h;
  body = `<svg x="0" y="0" width="${w}" height="${h}" viewBox="${x} ${y} ${w} ${h}">${view === 'thread' ? drawLayout(thread) : drawTree()}</svg>`;
} else if (view === 'tree') {
  W = tree.bounds.width;
  H = tree.bounds.height;
  body = drawTree();
} else if (view === 'thread') {
  const columns = Math.max(1, Math.round(Math.sqrt(thread.bounds.height / (thread.bounds.width + 28))));
  const drawn = drawThreadColumns(columns, 1, 20, 20);
  W = drawn.width + 40;
  H = drawn.height + 40;
  body = drawn.svg;
} else {
  // Planche carrée : l'arbre entier en haut, le fil vertical découpé en colonnes en bas.
  W = Math.max(tree.bounds.width, 3200);
  const head = 150;
  const treeScale = W / tree.bounds.width;
  const treeH = tree.bounds.height * treeScale;
  const columns = 7;
  const columnW = W / columns;
  const probe = drawThreadColumns(columns, 1, 0, 0, 0);
  const threadScale = Math.min((columnW - 40) / thread.bounds.width, (W - head - treeH - 130) / probe.height);
  const drawn = drawThreadColumns(columns, threadScale, 20, head + treeH + 100, columnW - thread.bounds.width * threadScale);
  H = Math.max(W, head + treeH + 100 + drawn.height + 30);
  const title = `Arbre : ${tree.nodes.length} personnes, ${tree.unions.length} points d’union (${raw.unions.length} unions), ${tree.links.length} filiations, ${tree.rows.length} rangées, ${Math.round(tree.bounds.width)} × ${Math.round(tree.bounds.height)} px`;
  const facts = `croisements ${treeAudit.crossings} (estimés ${tree.estimate.crossings}) · unions en crochet ${hooks.length} · unions entre deux rangées ${descents.length} · cases qui se chevauchent ${treeAudit.nodeOverlaps.length} · tracés à travers une case ${treeAudit.linesThroughNodes.length} · superpositions ${treeAudit.overlaps + treeAudit.combs} · calcul ${(t2 - t1).toFixed(0)} ms`;
  const legend = 'Trait rouge épais et point plein : union consanguine. Tirets : liaison ou fiançailles. Pointillé : filiation contestée. Cadre or : roi. Cadre tireté : bâtard.';
  body =
    text(40, 52, title, 34) +
    text(40, 92, facts, 26, problems.length ? ROUGE : ENCRE_PALE) +
    text(40, 128, legend, 24, ENCRE_PALE) +
    `<svg x="0" y="${head}" width="${W}" height="${treeH}" viewBox="0 0 ${tree.bounds.width} ${tree.bounds.height}">${drawTree()}</svg>` +
    text(40, head + treeH + 60, `Fil vertical (largeur ${thread.bounds.width} px, hauteur ${Math.round(thread.bounds.height)} px), découpé en ${columns} colonnes : croisements ${threadAudit.crossings}, chevauchements ${threadAudit.nodeOverlaps.length}, superpositions ${threadAudit.overlaps}, cases répétées ${thread.nodes.filter((n) => n.repeat).length}`, 30) +
    drawn.svg;
}

const svg =
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" font-family="Georgia, 'Times New Roman', serif">` +
  `<rect width="${W}" height="${H}" fill="${VELIN}"/>${body}</svg>\n`;
fs.mkdirSync(path.dirname(out), { recursive: true });
fs.writeFileSync(out, svg);

/* ------------------------------------------------------------------ compte rendu */

if (!quiet) {
  const consanguineous = raw.unions.filter((u) => consanguinity(graph, u).consanguineous).length;
  console.log(`Graphe : ${persons.length} personnes, ${raw.unions.length} unions (${consanguineous} consanguines), ${graph.families.length} fratries, construit en ${(t1 - t0).toFixed(1)} ms`);
  console.log(`Arbre : ${Math.round(tree.bounds.width)} × ${Math.round(tree.bounds.height)} px, ${tree.rows.length} rangées, calcul ${(t2 - t1).toFixed(0)} ms (second passage ${(t3 - t2).toFixed(0)} ms)`);
  console.log(`  croisements mesurés ${treeAudit.crossings} (estimés ${tree.estimate.crossings}), unions en crochet ${hooks.length}, unions entre deux rangées ${descents.length}, longueur des tracés ${ink} px`);
  console.log(`  chevauchements de cases ${treeAudit.nodeOverlaps.length}, tracés à travers une case ${treeAudit.linesThroughNodes.length}, superpositions ${treeAudit.overlaps + treeAudit.combs}, tracés détachés ${treeAudit.loose.length}`);
  if (hooks.length) console.log(`  crochets : ${hooks.map((u) => u.id).join(', ')}`);
  for (const detail of treeAudit.details) console.log(`  ${detail}`);
  console.log(`Fil : ${thread.steps.length} maillons, ${thread.bounds.width} × ${Math.round(thread.bounds.height)} px, ${thread.nodes.length} cases dont ${thread.nodes.filter((n) => n.repeat).length} répétées, calcul ${(t4 - t3).toFixed(1)} ms`);
  console.log(`  croisements ${threadAudit.crossings}, chevauchements ${threadAudit.nodeOverlaps.length}, tracés à travers une case ${threadAudit.linesThroughNodes.length}, superpositions ${threadAudit.overlaps}, tracés détachés ${threadAudit.loose.length}`);
  for (const detail of threadAudit.details) console.log(`  ${detail}`);
}
console.log(`SVG écrit : ${path.relative(root, out)} (${Math.round(W)} × ${Math.round(H)})`);
if (problems.length) {
  console.log(`\n${problems.length} problème(s) :\n- ${problems.join('\n- ')}`);
  process.exitCode = 1;
} else {
  console.log('Contrôles : aucun problème.');
}
