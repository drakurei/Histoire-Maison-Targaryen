/**
 * Recette de peinture du dragon : quelles parties, dans quel ordre, avec quelles teintes.
 *
 * Fonctions pures, sans React ni CSS importé, en TypeScript « effaçable » : la planche de
 * contrôle (`scripts/dragon-sheet.mjs`) et `DragonFigure` partagent exactement la même
 * recette, donc ce que montre la planche est ce que rend le composant.
 *
 * Trois tons :
 * - `specimen` : gravure rehaussée. Aplats aux couleurs du look, membrane légèrement
 *   translucide, os plus sombres, et par-dessus les hachures et les carènes de la gravure,
 *   dans le ton de la robe (éclaircies sur un dragon sombre, foncées sur un dragon clair) ;
 * - `engraving` : trait seul et hachures, pour une planche d'histoire naturelle ;
 * - `shadow` : silhouette d'un seul tenant.
 *
 * Deux niveaux de détail : `fine` pour une planche, `plain` pour une vignette ou une grille
 * (plus de hachures, trait épaissi, un tiers de tracé en moins dans la page).
 *
 * Le doute est visible : si l'on passe les drapeaux `attested` du look, ce que les livres ne
 * décrivent pas (robe, membranes, crêtes) n'est pas peint mais laissé au trait, comme la
 * partie inconnue d'un spécimen sur une planche. Un dragon jamais décrit devient une gravure.
 *
 * Aucun dégradé, aucun filtre. Les teintes dérivées passent par `color-mix`, ce qui laisse
 * au look n'importe quelle couleur CSS.
 *
 * Jetons lus (tous facultatifs) : `--dragon-ink` (encre du trait, défaut : couleur du
 * texte), `--dragon-paper` (papier sous le trait, défaut : `--velin`), `--dragon-shadow`
 * (teinte de la silhouette).
 */
import type { DragonLook } from '../../core/content/types.ts';
import type { DragonPartName, DragonParts } from '../../core/dragons/geometry.ts';

export type DragonTone = 'specimen' | 'shadow' | 'engraving';
/** Niveau de détail : `fine` pour une planche, `plain` pour une vignette. */
export type DragonDetail = 'fine' | 'plain';
/** Surface sur laquelle le spécimen est posé : décide du sens du liseré. */
export type DragonGround = 'light' | 'dark';
/** Ce que les livres décrivent : une teinte absente ou fausse est laissée au trait. */
export type DragonKnown = Partial<Pick<DragonLook['attested'], 'body' | 'wing' | 'crest' | 'flame'>>;

export interface DragonLayer {
  key: string;
  parts: readonly DragonPartName[];
  fill: string;
  stroke: string;
  /** En unités du tracé (l'envergure vaut environ 1000). */
  strokeWidth: number;
  opacity: number;
  /** Trait peint sous le remplissage : le contour d'une réunion de formes, sans couture intérieure. */
  strokeUnder: boolean;
  /** Vrai si la couche change pendant le battement. */
  wing: boolean;
}

type Colors = Pick<DragonLook, 'body' | 'wing' | 'crest' | 'flame'>;
type Paint = Partial<Omit<DragonLayer, 'key' | 'parts' | 'wing'>>;

const DEEP = '#0e0908';
const PALE = '#f2e8d5';
/** Gris chaud moyen : y mêler une teinte éclaircit une robe sombre et fonce une robe claire. Le détail reste lisible sur un dragon noir. */
const MID = '#8b7f73';
const INK = 'var(--dragon-ink, currentColor)';
const PAPER = 'var(--dragon-paper, var(--velin, #e8dcc3))';
const SHADOW = 'var(--dragon-shadow, #0b0807)';

const blend = (color: string, share: number, other: string): string => `color-mix(in oklab, ${color} ${share}%, ${other})`;

function layer(key: string, parts: readonly DragonPartName[], paint: Paint): DragonLayer {
  return {
    key,
    parts,
    fill: paint.fill ?? 'none',
    stroke: paint.stroke ?? 'none',
    strokeWidth: paint.strokeWidth ?? 0,
    opacity: paint.opacity ?? 1,
    strokeUnder: paint.strokeUnder ?? false,
    wing: parts.some((p) => p.startsWith('wing')),
  };
}

/** Le trait de la gravure : papier dessous, encre autour. */
const line = (strokeWidth: number): Paint => ({ fill: PAPER, stroke: INK, strokeWidth, strokeUnder: true });

const MEMBRANE = ['wingMembraneL', 'wingMembraneR'] as const;
const FOLD = ['wingShadeL', 'wingShadeR'] as const;
const VEINS = ['wingVeinsL', 'wingVeinsR'] as const;
const HATCH = ['wingHatchL', 'wingHatchR'] as const;
const ARM = ['wingArmL', 'wingArmR'] as const;
const HAND = ['wingHandL', 'wingHandR'] as const;

function specimen(c: Colors, ground: DragonGround, known: DragonKnown): DragonLayer[] {
  // Sur vélin, un liseré d'encre ; sur obsidienne, un liseré clair, plus large, qui détache un dragon noir.
  const dark = ground === 'dark';
  const rim = dark ? PALE : DEEP;
  const edge = (color: string): string => blend(color, dark ? 46 : 48, rim);
  const w = dark ? 1.5 : 1;
  const bone = blend(c.body, 74, DEEP);
  const wing = known.wing !== false;
  const body = known.body !== false;
  // Corne et crêtes : la teinte décrite ; à défaut, le ton de la robe assombri ; si la robe
  // elle-même est inconnue, le trait seul.
  const horn = known.crest !== false ? c.crest : body ? blend(c.body, 76, MID) : null;

  const membrane = wing
    ? [
        layer('membrane', MEMBRANE, { fill: c.wing, stroke: edge(c.wing), strokeWidth: 1.6 * w, opacity: 0.92 }),
        layer('fold', FOLD, { fill: DEEP, opacity: 0.13 }),
        // Gravure rehaussée : les hachures de la planche restent sous la couleur, dans le ton de la membrane.
        layer('hatch', HATCH, { stroke: blend(c.wing, 52, MID), strokeWidth: 0.8, opacity: 0.6 }),
        layer('veins', VEINS, { stroke: blend(c.wing, 46, MID), strokeWidth: 1.2, opacity: 0.7 }),
      ]
    : [
        layer('membrane', MEMBRANE, { fill: PAPER, stroke: INK, strokeWidth: 1.7 }),
        layer('fold', HATCH, { stroke: INK, strokeWidth: 0.75, opacity: 0.8 }),
        layer('veins', VEINS, { stroke: INK, strokeWidth: 1 }),
      ];
  const limbs = body
    ? [
        layer('arm', ARM, { fill: blend(c.body, 90, DEEP), stroke: edge(c.body), strokeWidth: 2 * w, strokeUnder: true }),
        layer('hand', HAND, { fill: bone, stroke: edge(bone), strokeWidth: 2 * w, strokeUnder: true }),
      ]
    : [layer('arm', ARM, line(3)), layer('hand', HAND, line(3))];
  const trunk = body
    ? [
        layer('legs', ['legs'], { fill: blend(c.body, 88, DEEP), stroke: edge(c.body), strokeWidth: 2.2 * w, strokeUnder: true }),
        layer('trunk', ['trunk'], { fill: c.body, stroke: edge(c.body), strokeWidth: 2.4 * w, strokeUnder: true }),
        layer('shade', ['bodyShade'], { fill: DEEP, opacity: 0.2 }),
        layer('bodyHatch', ['bodyHatch'], { stroke: blend(c.body, 46, MID), strokeWidth: 0.8, opacity: 0.6 }),
        layer('plates', ['bodyMarks'], { fill: blend(c.body, 54, MID), opacity: 0.75 }),
      ]
    : [
        layer('legs', ['legs'], line(3)),
        layer('trunk', ['trunk'], line(3.4)),
        layer('shade', ['bodyHatch'], { stroke: INK, strokeWidth: 0.8, opacity: 0.85 }),
        layer('plates', ['bodyMarks'], { fill: PAPER, stroke: INK, strokeWidth: 0.9 }),
      ];
  const skull = body
    ? [
        layer('head', ['head'], { fill: c.body, stroke: edge(c.body), strokeWidth: 2.4 * w, strokeUnder: true }),
        layer('cheek', ['headShade'], { fill: DEEP, opacity: 0.2 }),
      ]
    : [layer('head', ['head'], line(3.2))];

  return [
    ...membrane,
    ...limbs,
    horn ? layer('claws', ['claws'], { fill: horn, stroke: edge(horn), strokeWidth: 1.4 * w, strokeUnder: true }) : layer('claws', ['claws'], { fill: INK }),
    ...trunk,
    layer('vane', ['tailTip'], horn ? { fill: horn, stroke: edge(horn), strokeWidth: 2 * w, strokeUnder: true } : line(3)),
    layer('horns', ['horns'], horn ? { fill: horn, stroke: edge(horn), strokeWidth: 2 * w, strokeUnder: true } : line(3)),
    ...skull,
    horn
      ? layer('scutes', ['spine'], { fill: horn, stroke: dark ? edge(horn) : 'none', strokeWidth: dark ? 1.2 : 0, strokeUnder: true })
      : layer('scutes', ['spine'], { fill: PAPER, stroke: INK, strokeWidth: 1.1 }),
    layer('marks', ['headMarks'], body ? { stroke: blend(c.body, 46, MID), strokeWidth: 1.2, opacity: 0.85 } : { stroke: INK, strokeWidth: 1 }),
    layer('eyes', ['eyes'], { fill: known.flame === false ? INK : c.flame }),
  ];
}

function engraving(): DragonLayer[] {
  return [
    layer('membrane', MEMBRANE, { fill: PAPER, stroke: INK, strokeWidth: 1.7 }),
    layer('hatch', HATCH, { stroke: INK, strokeWidth: 0.75, opacity: 0.8 }),
    layer('veins', VEINS, { stroke: INK, strokeWidth: 1 }),
    layer('bones', ['wingBonesL', 'wingBonesR'], line(3)),
    layer('claws', ['claws'], { fill: INK }),
    layer('legs', ['legs'], line(3)),
    layer('trunk', ['trunk', 'tailTip'], line(3.4)),
    layer('bodyHatch', ['bodyHatch'], { stroke: INK, strokeWidth: 0.8, opacity: 0.85 }),
    layer('plates', ['bodyMarks'], { fill: PAPER, stroke: INK, strokeWidth: 0.9 }),
    layer('horns', ['horns'], line(3)),
    layer('head', ['head'], line(3.2)),
    layer('scutes', ['spine'], { fill: PAPER, stroke: INK, strokeWidth: 1.1 }),
    layer('marks', ['headMarks'], { stroke: INK, strokeWidth: 1 }),
    layer('eyes', ['eyes'], { fill: INK }),
  ];
}

/** La silhouette d'un seul tenant : toutes les formes pleines réunies dans un même tracé. */
export const dragonSilhouette: DragonLayer = layer(
  'silhouette',
  ['wingMembraneL', 'wingMembraneR', 'wingBonesL', 'wingBonesR', 'legs', 'claws', 'trunk', 'tailTip', 'horns', 'head'],
  { fill: SHADOW },
);

const ALL_KNOWN: DragonKnown = {};

/** Parties qui ne se lisent qu'en grand : hachures, carènes, arêtes du crâne. */
const FINE_PARTS: ReadonlySet<DragonPartName> = new Set<DragonPartName>(['wingHatchL', 'wingHatchR', 'bodyHatch', 'bodyMarks', 'headMarks']);
/** En vignette, le trait s'épaissit pour rester un trait. */
const PLAIN_STROKE = 1.8;

function plain(layers: DragonLayer[]): DragonLayer[] {
  return layers
    .filter((item) => !item.parts.some((part) => FINE_PARTS.has(part)))
    .map((item) => (item.strokeWidth > 0 ? { ...item, strokeWidth: item.strokeWidth * PLAIN_STROKE } : item));
}

/**
 * Couches à peindre, de la plus basse à la plus haute.
 * `known` : drapeaux `attested` du look, si l'on veut laisser au trait ce qui n'est pas décrit.
 * `detail` : `fine` pour une planche (hachures, carènes), `plain` pour une vignette ou une
 * échelle comparée, où ces traits passeraient sous le pixel et alourdiraient la page.
 */
export function dragonLayers(
  look: Colors,
  tone: DragonTone = 'specimen',
  ground: DragonGround = 'light',
  known: DragonKnown = ALL_KNOWN,
  detail: DragonDetail = 'fine',
): DragonLayer[] {
  if (tone === 'shadow') return [dragonSilhouette];
  const layers = tone === 'engraving' ? engraving() : specimen(look, ground, known);
  return detail === 'plain' ? plain(layers) : layers;
}

/** Tracé d'une couche : la réunion de ses parties. */
export function layerPath(item: DragonLayer, parts: DragonParts): string {
  let d = '';
  for (const name of item.parts) d += parts[name];
  return d;
}

/** Style en ligne d'une couche, pour un SVG écrit à la main (la planche de contrôle). */
export function layerCss(item: DragonLayer): string {
  const rules = [`fill:${item.fill}`];
  if (item.stroke !== 'none') {
    rules.push(`stroke:${item.stroke}`, `stroke-width:${item.strokeWidth}`, 'stroke-linejoin:round', 'stroke-linecap:round');
    if (item.strokeUnder) rules.push('paint-order:stroke');
  }
  if (item.opacity < 1) rules.push(`opacity:${item.opacity}`);
  return rules.join(';');
}
