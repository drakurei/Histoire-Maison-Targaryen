/**
 * Géométrie procédurale du dragon, vu du dessus, ailes déployées.
 *
 * Fonctions pures : un `DragonLook` et une pose donnent des tracés SVG (attribut `d`).
 * Aucune présentation ici ; les couleurs et les couches sont l'affaire de `src/shared/dragon`.
 *
 * Anatomie retenue (dragon de Martin) : deux pattes arrière, les ailes SONT les membres
 * antérieurs (épaule, humérus, avant-bras, poignet, quatre doigts longs et une griffe de
 * pouce), membrane tendue entre les doigts puis jusqu'au flanc, long cou, longue queue,
 * crâne cornu. Construction par squelette : une colonne (spline de Catmull-Rom du museau au
 * bout de la queue, épaisseur variable) et, par aile, une chaîne d'articulations dont le
 * battement change les angles. Le battement n'est jamais une mise à l'échelle.
 *
 * Repère : l'épaule est à l'origine, la tête vers le haut (y négatif), la queue vers le bas.
 * Unité : l'envergure à plat vaut à peu près 1000, quel que soit le dragon ; la taille
 * réelle (look.span) agit sur les proportions (masse, os, usure des membranes), pas sur
 * l'échelle. `metrics.wingspan` permet de remettre plusieurs dragons à l'échelle.
 *
 * Fichier en TypeScript « effaçable » : importable tel quel par Node 24.
 */
import type { DragonLook } from '../content/types.ts';
import type { Bounds, Chain, Cubic, Pt } from './curves.ts';
import {
  DEG,
  TAU,
  at,
  clamp,
  cubicAt,
  dist,
  emptyBounds,
  finite,
  grow,
  lerp,
  lineTo,
  loop,
  mix,
  noise,
  orient,
  pathOf,
  polar,
  polygon,
  profile,
  r1,
  ribbon,
  segment,
  shape,
  smooth,
  subCubic,
  through,
  unit,
} from './curves.ts';

/** Les quatre paramètres du look qui décident de la silhouette. */
export type DragonShape = Pick<DragonLook, 'span' | 'neck' | 'tail' | 'horns'>;

export interface DragonPose {
  /** Phase du battement, cyclique. 0 : ailes étendues à plat ; 0.25 : fin de l'abaissée ; 0.5 : remontée, aile repliée ; 0.75 : haut de la remontée. */
  flap: number;
  /** Roulis, de -1 à 1 : raccourcit une aile et allonge l'autre. */
  bank?: number;
  /** Courbure du cou, de -1 à 1 (0 : droit). */
  neckCurve?: number;
  /** Ondulation de la queue, de -1 à 1 (0 : droite). */
  tailCurve?: number;
}

export const DRAGON_PARTS = [
  'wingMembraneL',
  'wingMembraneR',
  'wingShadeL',
  'wingShadeR',
  'wingVeinsL',
  'wingVeinsR',
  'wingHatchL',
  'wingHatchR',
  'wingBonesL',
  'wingBonesR',
  'wingArmL',
  'wingArmR',
  'wingHandL',
  'wingHandR',
  'legs',
  'claws',
  'tail',
  'tailTip',
  'body',
  'neck',
  'trunk',
  'horns',
  'head',
  'spine',
  'bodyShade',
  'bodyMarks',
  'headShade',
  'bodyHatch',
  'headMarks',
  'eyes',
] as const;

export type DragonPartName = (typeof DRAGON_PARTS)[number];
export type DragonParts = Record<DragonPartName, string>;

/** Parties dont le tracé dépend de la phase du battement. */
export const DRAGON_WING_PARTS = [
  'wingMembraneL',
  'wingMembraneR',
  'wingShadeL',
  'wingShadeR',
  'wingVeinsL',
  'wingVeinsR',
  'wingHatchL',
  'wingHatchR',
  'wingBonesL',
  'wingBonesR',
  'wingArmL',
  'wingArmR',
  'wingHandL',
  'wingHandR',
] as const satisfies readonly DragonPartName[];

export interface DragonBox {
  x: number;
  y: number;
  width: number;
  height: number;
}

export type DragonPoint = readonly [number, number];

export interface DragonGeometry {
  /** Cadre fixe pour un look donné : il ne bouge pas pendant le battement. */
  viewBox: string;
  box: DragonBox;
  parts: DragonParts;
  /** Repères utiles aux effets (flamme au museau, cavalier à l'épaule). */
  anchors: {
    snout: DragonPoint;
    skullBase: DragonPoint;
    shoulder: DragonPoint;
    hip: DragonPoint;
    tailEnd: DragonPoint;
    wristL: DragonPoint;
    wristR: DragonPoint;
    wingtipL: DragonPoint;
    wingtipR: DragonPoint;
  };
  metrics: {
    /** Envergure à plat (phase 0), en unités du tracé. */
    wingspan: number;
    /** Longueur du museau au bout de la queue, colonne droite. */
    length: number;
  };
}

/* ------------------------------------------------------------------ proportions */

interface Proportions {
  key: string;
  /** Masse relative : racine de l'envergure (un dragon ne cesse de grandir, les vieux sont massifs). */
  mass: number;
  horns: number;
  torsoHalf: number;
  headLen: number;
  headWide: number;
  neckLen: number;
  torsoLen: number;
  tailLen: number;
  vaneLen: number;
  /** Épaisseur relative des os de l'aile. */
  bone: number;
  /** Échelle des pattes arrière. */
  leg: number;
  /** Usure du bord de fuite, 0 à 1 : les très grands dragons ont des membranes entaillées. */
  wear: number;
  crest: number;
  /** Stations le long de la colonne, museau = 0. */
  sHead: number;
  sShoulder: number;
  sHip: number;
  sEnd: number;
  /** Demi-largeur du corps à une station. */
  half: (s: number) => number;
}

function proportions(look: DragonShape): Proportions {
  const span = clamp(finite(look.span, 0.5), 0.05, 1.5);
  const neck = clamp(finite(look.neck, 0.5), 0, 1);
  const tail = clamp(finite(look.tail, 0.5), 0, 1);
  const horns = clamp(finite(look.horns, 1), 0, 3);
  const mass = Math.sqrt(span);
  // Un jeune dragon a la tête grosse pour son corps et le corps mince pour ses ailes.
  const young = 1 - Math.min(mass, 1);
  // À envergure égale, un vieux dragon est tout en voilure et en poitrail ; un jeune est
  // plus long pour ses ailes.
  const stretch = 1.1 - 0.16 * Math.min(mass, 1);
  const torsoHalf = 18 + 57 * mass - 16 * (neck - 0.5);
  const headLen = 122 + 32 * young;
  const headWide = 0.82 + 0.3 * mass - 0.08 * (neck - 0.5);
  // Le cou s'allonge plus vite que le paramètre : un cou de 1 est presque le double d'un cou moyen.
  const neckLen = (64 + 150 * neck + 110 * neck * neck) * stretch;
  const torsoLen = (176 + 12 * mass) * stretch;
  const tailLen = (200 + 330 * tail) * stretch;
  const vaneLen = Math.min(58 + 18 * mass, tailLen * 0.3);

  const sHead = headLen;
  const sShoulder = sHead + neckLen;
  const sHip = sShoulder + torsoLen;
  const sEnd = sHip + tailLen;
  const cheek = SKULL_WIDEST * headLen * headWide;
  const neckTop = cheek * (0.5 - 0.06 * neck);
  const neckBase = torsoHalf * (0.56 - 0.1 * neck);

  // Le cou s'évase vers le garrot sur une longueur bornée : pas d'épaule en goulot de bouteille.
  const lead = Math.min(64, 0.5 * neckLen);
  const half = profile([
    [sHead - 0.3 * headLen, neckTop * 0.94],
    [sHead, neckTop],
    [sHead + 0.45 * (neckLen - lead), lerp(neckTop, neckBase, 0.4)],
    [sShoulder - lead, neckBase],
    [sShoulder - lead * 0.36, torsoHalf * 0.76],
    [sShoulder + 4, torsoHalf * 0.93],
    [sShoulder + 0.2 * torsoLen, torsoHalf],
    [sShoulder + 0.46 * torsoLen, torsoHalf * 0.86],
    [sShoulder + 0.76 * torsoLen, torsoHalf * 0.66],
    [sHip - 0.02 * torsoLen, torsoHalf * 0.62],
    [sHip + 0.1 * tailLen, torsoHalf * 0.46],
    [sHip + 0.3 * tailLen, torsoHalf * 0.3],
    [sHip + 0.6 * tailLen, torsoHalf * 0.15],
    [sEnd - vaneLen, 2.6],
    [sEnd, 0],
  ]);

  return {
    key: `${r1(span * 100)}|${r1(neck * 100)}|${r1(tail * 100)}|${r1(horns * 100)}`,
    mass,
    horns,
    torsoHalf,
    headLen,
    headWide,
    neckLen,
    torsoLen,
    tailLen,
    vaneLen,
    bone: 0.64 + 0.56 * mass,
    leg: 0.6 + 0.48 * mass,
    wear: smooth((span - 0.62) / 0.38),
    crest: 0.62 + 0.14 * horns + 0.22 * mass,
    sHead,
    sShoulder,
    sHip,
    sEnd,
    half,
  };
}

/* ------------------------------------------------------------------ colonne */

interface Axis {
  pts: Pt[];
  st: number[];
}

interface Frame {
  /** Point de la colonne. */
  p: Pt;
  /** Tangente unitaire, vers la queue. */
  t: Pt;
  /** Normale unitaire. */
  n: Pt;
}

/** Vertèbres de contrôle : on intègre un cap le long du cou et de la queue, les longueurs sont conservées. */
function vertebrae(pr: Proportions, neckCurve: number, tailCurve: number): { ctrl: Pt[]; st: number[] } {
  const ctrl: Pt[] = [];
  const st: number[] = [];
  const neckSteps = 7;
  const tailSteps = 10;

  // Du garrot vers le museau (y décroît). Le cap dessine un S : la tête revient vers l'axe.
  const up: Pt[] = [];
  let p: Pt = [0, 0];
  let heading = 0;
  for (let i = 1; i <= neckSteps; i++) {
    const u = (i - 0.5) / neckSteps;
    heading = neckCurve * (0.85 * Math.sin(1.32 * Math.PI * u) + 0.1 * u);
    const step = pr.neckLen / neckSteps;
    p = [p[0] + Math.sin(heading) * step, p[1] - Math.cos(heading) * step];
    up.push(p);
  }
  const headHeading = heading * 0.9;
  const skull = at(up, up.length - 1);
  const mid: Pt = [skull[0] + Math.sin(headHeading) * pr.headLen * 0.5, skull[1] - Math.cos(headHeading) * pr.headLen * 0.5];
  const snout: Pt = [skull[0] + Math.sin(headHeading) * pr.headLen, skull[1] - Math.cos(headHeading) * pr.headLen];

  ctrl.push(snout, mid);
  st.push(0, pr.headLen * 0.5);
  for (let i = neckSteps - 1; i >= 0; i--) {
    ctrl.push(at(up, i));
    st.push(pr.sShoulder - ((i + 1) * pr.neckLen) / neckSteps);
  }
  // Tronc : rigide, droit.
  ctrl.push([0, 0], [0, pr.torsoLen / 3], [0, (2 * pr.torsoLen) / 3], [0, pr.torsoLen]);
  st.push(pr.sShoulder, pr.sShoulder + pr.torsoLen / 3, pr.sShoulder + (2 * pr.torsoLen) / 3, pr.sHip);
  // Queue : la base reste dans l'axe (elle porte les cuisses), l'ondulation grandit vers la pointe.
  p = [0, pr.torsoLen];
  for (let i = 1; i <= tailSteps; i++) {
    const u = (i - 0.5) / tailSteps;
    const sway = tailCurve * 1.1 * smooth(u / 0.32) * Math.pow(u, 0.6) * Math.sin(1.5 * Math.PI * u + 0.2);
    const step = pr.tailLen / tailSteps;
    p = [p[0] + Math.sin(sway) * step, p[1] + Math.cos(sway) * step];
    ctrl.push(p);
    st.push(pr.sHip + (i * pr.tailLen) / tailSteps);
  }
  return { ctrl, st };
}

/** Spline de Catmull-Rom (forme d'Hermite, paramétrée par la station) échantillonnée à pas régulier. */
function sampleAxis(ctrl: readonly Pt[], st: readonly number[], step: number): Axis {
  const pts: Pt[] = [];
  const out: number[] = [];
  const tangent = (i: number): Pt => {
    const a = at(ctrl, i - 1);
    const b = at(ctrl, i + 1);
    const ds = at(st, i + 1) - at(st, i - 1) || 1;
    return [(b[0] - a[0]) / ds, (b[1] - a[1]) / ds];
  };
  for (let i = 0; i < ctrl.length - 1; i++) {
    const p1 = at(ctrl, i);
    const p2 = at(ctrl, i + 1);
    const s1 = at(st, i);
    const dt = at(st, i + 1) - s1;
    const m1 = tangent(i);
    const m2 = tangent(i + 1);
    const count = Math.max(1, Math.ceil(dt / step));
    for (let j = 0; j < count; j++) {
      const t = j / count;
      const t2 = t * t;
      const t3 = t2 * t;
      const h00 = 2 * t3 - 3 * t2 + 1;
      const h10 = (t3 - 2 * t2 + t) * dt;
      const h01 = -2 * t3 + 3 * t2;
      const h11 = (t3 - t2) * dt;
      pts.push([
        h00 * p1[0] + h10 * m1[0] + h01 * p2[0] + h11 * m2[0],
        h00 * p1[1] + h10 * m1[1] + h01 * p2[1] + h11 * m2[1],
      ]);
      out.push(s1 + t * dt);
    }
  }
  pts.push(at(ctrl, ctrl.length - 1));
  out.push(at(st, st.length - 1));
  return { pts, st: out };
}

function frameAt(axis: Axis, s: number): Frame {
  const { pts, st } = axis;
  let lo = 0;
  let hi = st.length - 1;
  while (hi - lo > 1) {
    const m = (lo + hi) >> 1;
    if (at(st, m) <= s) lo = m;
    else hi = m;
  }
  const a = at(pts, lo);
  const b = at(pts, lo + 1);
  const u = clamp((s - at(st, lo)) / (at(st, lo + 1) - at(st, lo) || 1), 0, 1);
  const t0 = unit(at(pts, lo - 1), b);
  const t1 = unit(a, at(pts, lo + 2));
  const tx = lerp(t0[0], t1[0], u);
  const ty = lerp(t0[1], t1[1], u);
  const l = Math.hypot(tx, ty) || 1;
  return { p: mix(a, b, u), t: [tx / l, ty / l], n: [-ty / l, tx / l] };
}

const place = (f: Frame, along: number, across: number): Pt => [
  f.p[0] + f.t[0] * along + f.n[0] * across,
  f.p[1] + f.t[1] * along + f.n[1] * across,
];

/** Bande le long de la colonne, entre deux fractions de la demi-largeur (-1 et 1 : le corps entier). */
function band(axis: Axis, half: (s: number) => number, from: number, to: number, step: number, lo: number, hi: number): Chain {
  const outer: Pt[] = [];
  const inner: Pt[] = [];
  const count = Math.max(2, Math.ceil((to - from) / step));
  for (let i = 0; i <= count; i++) {
    const s = lerp(from, to, i / count);
    const f = frameAt(axis, s);
    const h = half(s);
    outer.push(place(f, 0, h * hi));
    inner.push(place(f, 0, h * lo));
  }
  inner.reverse();
  return [...through(outer), ...lineTo(at(outer, outer.length - 1), at(inner, 0)), ...through(inner).slice(1)];
}

/* ------------------------------------------------------------------ parties axiales */

type AxialName = Exclude<DragonPartName, (typeof DRAGON_WING_PARTS)[number]>;

interface Axial {
  parts: Record<AxialName, string>;
  bounds: Bounds;
  anchors: Pick<DragonGeometry['anchors'], 'snout' | 'skullBase' | 'shoulder' | 'hip' | 'tailEnd'>;
}

/**
 * Demi-profil du crâne vu du dessus : (position le long du crâne, demi-largeur), en fractions
 * de sa longueur. Un coin de reptile : museau carré renflé aux narines, flancs qui s'écartent
 * sans palier jusqu'aux arcades, encoche de l'œil, puis l'articulation de la mâchoire et son
 * éperon, tout à l'arrière.
 */
const SKULL: readonly (readonly [number, number])[] = [
  [0, 0.044],
  [0.02, 0.084],
  [0.075, 0.112],
  [0.15, 0.108],
  [0.25, 0.108],
  [0.36, 0.126],
  [0.46, 0.156],
  [0.535, 0.194],
  [0.6, 0.226],
  [0.66, 0.212],
  [0.74, 0.226],
  [0.83, 0.25],
  [0.915, 0.27],
  [0.99, 0.296],
  [0.962, 0.22],
  [1.0, 0.146],
  [1.05, 0.074],
];
/** Indice de l'éperon de la mâchoire : la seule pointe vive du contour. */
const SKULL_SPUR = 13;
/** Demi-largeur du crâne à l'articulation de la mâchoire : le cou s'y raccorde. */
const SKULL_WIDEST = 0.25;

/**
 * Arête du toit du crâne : les deux arêtes naissent ensemble sur le chanfrein, s'écartent
 * jusqu'aux arcades, puis filent vers la base des grandes cornes. Au-delà, la joue descend.
 */
const SKULL_ROOF: readonly (readonly [number, number])[] = [
  [0.18, 0.012],
  [0.3, 0.036],
  [0.42, 0.072],
  [0.52, 0.118],
  [0.6, 0.166],
  [0.71, 0.16],
  [0.85, 0.142],
  [0.96, 0.114],
];

interface HornSpec {
  along: number;
  across: number;
  angle: number;
  length: number;
  bend: number;
  width: number;
}

/** Trois paires possibles : occiput (en lyre), angle de la mâchoire, joue. */
const HORNS: readonly HornSpec[] = [
  { along: 0.97, across: 0.128, angle: 25, length: 0.8, bend: -17, width: 0.064 },
  { along: 0.93, across: 0.222, angle: 49, length: 0.45, bend: -20, width: 0.05 },
  { along: 0.8, across: 0.214, angle: 72, length: 0.26, bend: -16, width: 0.04 },
];

interface Head {
  head: string;
  horns: string;
  headMarks: string;
  eyes: string;
  /** Joue du côté de l'ombre. */
  shade: string;
}

function buildHead(pr: Proportions, axis: Axis, b: Bounds): Head {
  const snout = at(axis.pts, 0);
  const base = frameAt(axis, pr.sHead).p;
  const t = unit(snout, base);
  const f: Frame = { p: snout, t, n: [-t[1], t[0]] };
  const L = pr.headLen;
  const wide = pr.headWide;
  const local = (along: number, across: number): Pt => place(f, along * L, across * L * wide);

  const outline: Pt[] = [];
  for (const [u, w] of SKULL) outline.push(local(u, w));
  for (let i = SKULL.length - 1; i >= 0; i--) {
    const [u, w] = at(SKULL, i);
    outline.push(local(u, -w));
  }
  const spurs = new Set([SKULL_SPUR, 2 * SKULL.length - 1 - SKULL_SPUR]);
  const head = pathOf(orient(shape(outline, spurs)), b);

  let horns = '';
  HORNS.forEach((spec, k) => {
    const grown = clamp(pr.horns - k, 0, 1);
    if (grown <= 0.05) return;
    for (const side of [1, -1] as const) {
      const center: Pt[] = [];
      const halves: number[] = [];
      const steps = 6;
      const length = spec.length * L * (0.5 + 0.5 * grown) * (0.74 + 0.4 * pr.mass);
      let p = local(spec.along, side * spec.across);
      // La base part de sous le crâne pour que la corne en sorte.
      p = [p[0] - f.t[0] * 0.07 * L, p[1] - f.t[1] * 0.07 * L];
      for (let i = 0; i <= steps; i++) {
        const u = i / steps;
        center.push(p);
        halves.push(spec.width * L * (0.8 + 0.3 * pr.mass) * Math.pow(1 - u, 0.8));
        const a = (spec.angle + spec.bend * u * u * 1.4) * DEG;
        const dx = f.t[0] * Math.cos(a) + f.n[0] * side * Math.sin(a);
        const dy = f.t[1] * Math.cos(a) + f.n[1] * side * Math.sin(a);
        p = [p[0] + (dx * length) / steps, p[1] + (dy * length) / steps];
      }
      horns += pathOf(ribbon(center, halves), b);
    }
  });

  let marks = '';
  let eyes = '';
  for (const side of [1, -1] as const) {
    marks += segment(local(0.046, side * 0.04), local(0.11, side * 0.078));
    marks += pathOf(through(SKULL_ROOF.map(([u, w]) => local(u, side * w))), b, false);
    // L'œil se loge sous l'arcade, dans l'encoche qui la suit.
    const eye = [local(0.594, side * 0.176), local(0.636, side * 0.21), local(0.706, side * 0.212), local(0.672, side * 0.182)];
    eyes += pathOf(orient(loop(eye)), b);
  }
  // Joue à l'ombre : entre l'arête du toit et le bord du crâne.
  const cheek: Pt[] = SKULL_ROOF.map(([u, w]) => local(u, -w));
  for (let i = SKULL_SPUR - 1; i >= 2; i--) {
    const [u, w] = at(SKULL, i);
    cheek.push(local(u, -w * 0.985));
  }
  const shade = pathOf(orient(loop(cheek)), b);
  return { head, horns, headMarks: marks, eyes, shade };
}

/** Station de la hanche, en fraction du tronc. */
const LEG_AT = 0.86;

/**
 * Pattes arrière repliées en vol : la cuisse sort de la hanche et fait saillie de part et
 * d'autre de la base de la queue, le genou en dehors, la jambe ramenée vers l'arrière.
 */
function buildLegs(pr: Proportions, axis: Axis, b: Bounds): { legs: string; claws: string } {
  const y = pr.sShoulder + pr.torsoLen * LEG_AT;
  const k = pr.leg;
  let legs = '';
  let claws = '';
  for (const side of [1, -1] as const) {
    // La patte suit le bord du corps : la jambe se couche contre la queue et ondule avec elle.
    const pt = (x: number, dy: number): Pt => {
      const s = y + dy * k;
      return place(frameAt(axis, s), 0, -side * (pr.half(s) + x * k));
    };
    const back = frameAt(axis, y + 118 * k).t;
    const heading = Math.atan2(back[1], back[0]);
    // Contour articulé, pas un boudin : la cuisse s'écarte, le genou fait saillie, la jambe
    // revient contre la queue, la cheville se renfle avant le pied.
    const outline = [
      pt(-14, -22),
      pt(3, -11),
      pt(13, 5),
      pt(19, 24),
      pt(20.5, 40),
      pt(15.5, 54),
      pt(9.5, 70),
      pt(7.6, 87),
      pt(9.8, 101),
      pt(8.4, 113),
      pt(4, 121),
      pt(-2.5, 113),
      pt(-6, 88),
      pt(-10, 50),
      pt(-16, 8),
    ];
    legs += pathOf(orient(loop(outline)), b);
    const foot = pt(3.4, 113);
    for (const toe of [-30, -3, 24]) {
      const a = heading + toe * side * DEG;
      const c: Pt[] = [];
      const h: number[] = [];
      for (let i = 0; i <= 4; i++) {
        const u = i / 4;
        c.push(polar(foot, 32 * k * u, a + side * 0.2 * u * u));
        h.push(4.2 * k * (1 - 0.55 * u));
      }
      legs += pathOf(ribbon(c, h), b);
      // Griffe : une lame courbe au bout de l'orteil.
      const tip = at(c, 4);
      const g: Pt[] = [];
      const gh: number[] = [];
      for (let i = 0; i <= 3; i++) {
        const u = i / 3;
        g.push(polar(tip, 13 * k * u - 2, a + side * (0.2 + 0.5 * u)));
        gh.push(2.3 * k * Math.pow(1 - u, 0.8) + 0.1);
      }
      claws += pathOf(ribbon(g, gh), b);
    }
  }
  return { legs, claws };
}

function buildAxial(pr: Proportions, neckCurve: number, tailCurve: number, bank: number): Axial {
  const b = emptyBounds();
  const { ctrl, st } = vertebrae(pr, neckCurve, tailCurve);
  const axis = sampleAxis(ctrl, st, 9);
  const { half, sHead, sShoulder, sHip, sEnd } = pr;

  const neck = pathOf(band(axis, half, sHead - 0.24 * pr.headLen, sShoulder + 34, 16, -1, 1), b);
  const body = pathOf(band(axis, half, sShoulder - 30, sHip + 30, 18, -1, 1), b);
  const tail = pathOf(band(axis, half, sHip - 22, sEnd, 18, -1, 1), b);
  // Le tronc d'un seul tenant, du crâne au dard : c'est lui qu'on peint, sans couture entre
  // le cou, le corps et la queue.
  const trunk = pathOf(band(axis, half, sHead - 0.24 * pr.headLen, sEnd, 16, -1, 1), b);

  // Bout de la queue : un dard de corne en fer de lance étroit. Ni flèche, ni trident.
  const stingFrom = sEnd - pr.vaneLen;
  const sting = (s: number): number => {
    const u = clamp((s - stingFrom) / (sEnd - stingFrom), 0, 1);
    return half(s) * (1 - u) + (5.4 + 5 * pr.mass) * Math.pow(u, 0.62) * Math.pow(1 - u, 1.05) * 2.1;
  };
  const tailTip = pathOf(band(axis, sting, stingFrom, sEnd, 9, -1, 1), b);

  // Ombre propre du corps : une seule bande plate du côté opposé à la lumière.
  const head = buildHead(pr, axis, b);
  const bodyShade = pathOf(band(axis, half, sHead + 4, sEnd - pr.vaneLen - 6, 30, -0.985, -0.34), b);

  // Écailles dorsales : une rangée de lames, plus hautes au garrot, qui s'amenuisent vers la queue.
  const shift = Math.sin(bank) * 0.45;
  let spine = '';
  let s = sHead + 0.02 * pr.headLen;
  const lastScute = sEnd - pr.vaneLen - 10;
  while (s < lastScute) {
    const fromShoulder = (s - sShoulder) / (s < sShoulder ? pr.neckLen : sEnd - sShoulder);
    const env = s < sShoulder ? lerp(1, 0.52, -fromShoulder) : lerp(1, 0.26, Math.pow(fromShoulder, 0.7));
    const size = 25 * pr.crest * env;
    const f = frameAt(axis, s);
    const off = half(s) * shift;
    // Lame pointée vers la queue, qui recouvre la suivante.
    spine += polygon([place(f, -size * 0.2, off), place(f, size * 0.06, off + size * 0.25), place(f, size * 0.86, off), place(f, size * 0.06, off - size * 0.25)], b);
    s += size * 0.62 + 1;
  }

  // Deux rangs de plaques carénées de chaque côté de l'échine, en quinconce, du garrot à la
  // mi-queue : le dos d'un grand reptile, pas un aplat.
  let bodyMarks = '';
  const pitch = 13 + 4.5 * pr.mass;
  for (let h = sShoulder - 0.3 * pr.neckLen; h < sHip + 0.5 * pr.tailLen; h += pitch) {
    const w = half(h);
    if (w < 9) continue;
    const f = frameAt(axis, h);
    // Écailles longues, presque jointives : de loin, deux carènes le long du dos, pas des pois.
    const len = pitch * 0.78;
    const wid = Math.max(1.1, len * 0.14);
    for (const side of [1, -1] as const) {
      const inner = side * w * 0.38;
      bodyMarks += polygon([place(f, 0, inner), place(f, len * 0.4, inner + wid), place(f, len, inner), place(f, len * 0.4, inner - wid)], b);
      if (w > 20) {
        const outer = side * w * 0.68;
        const o = pitch * 0.5;
        bodyMarks += polygon([place(f, o, outer), place(f, o + len * 0.36, outer + wid * 0.85), place(f, o + len * 0.9, outer), place(f, o + len * 0.36, outer - wid * 0.85)], b);
      }
    }
  }

  // Hachures du corps (gravure) : traits courts partant du bord, plus longs du côté de l'ombre.
  let bodyHatch = '';
  let index = 0;
  for (let h = sHead + 6; h < sEnd - pr.vaneLen - 4; h += 4.6) {
    const w = half(h);
    if (w < 3) break;
    const f = frameAt(axis, h);
    const depth = index % 3 === 0 ? 0.56 : index % 3 === 1 ? 0.38 : 0.47;
    bodyHatch += segment(place(f, 0, -w * 0.97), place(f, 4 + w * 0.06, -w * (0.97 - depth)));
    if (index % 3 === 0) bodyHatch += segment(place(f, 0, w * 0.97), place(f, 3, w * 0.82));
    index++;
  }

  const limbs = buildLegs(pr, axis, b);

  return {
    parts: {
      legs: limbs.legs,
      claws: limbs.claws,
      tail,
      tailTip,
      body,
      neck,
      trunk,
      spine,
      bodyShade,
      bodyMarks,
      bodyHatch,
      head: head.head,
      horns: head.horns,
      headMarks: head.headMarks,
      headShade: head.shade,
      eyes: head.eyes,
    },
    bounds: b,
    anchors: {
      snout: at(axis.pts, 0),
      skullBase: frameAt(axis, sHead).p,
      shoulder: [0, 0],
      hip: [0, pr.torsoLen],
      tailEnd: at(axis.pts, axis.pts.length - 1),
    },
  };
}

/* ------------------------------------------------------------------ battement */

interface Beat {
  /** Repli de l'aile, 0 (étendue) à 1 (remontée). */
  fold: number;
  /** Élévation du bras et de la main, en radians : la main suit le bras avec retard. */
  elevIn: number;
  elevOut: number;
  /** Balayage de l'aile autour de l'épaule, en degrés (négatif : vers l'avant). */
  sweep: number;
}

/** Dièdre de l'aile au repos : c'est lui qui rend le roulis visible vu du dessus. */
const DIHEDRAL = 9 * DEG;

function beat(flap: number): Beat {
  const phase = flap - Math.floor(flap);
  const turn = TAU * phase;
  return {
    fold: Math.pow(Math.sin(Math.PI * clamp((phase - 0.2) / 0.66, 0, 1)), 2),
    elevIn: DIHEDRAL - 38 * DEG * Math.sin(turn),
    elevOut: DIHEDRAL - 52 * DEG * Math.sin(turn - 0.5 * Math.sin(turn)),
    sweep: -9 * Math.sin(turn),
  };
}

/* ------------------------------------------------------------------ aile */

interface FingerSpec {
  length: number;
  /** Écart angulaire au premier doigt, aile étendue, en degrés. */
  offset: number;
  width: number;
}

/**
 * Du bord d'attaque vers le corps. Les longueurs décroissent : le premier doigt fait la
 * pointe de l'aile, le quatrième part presque droit vers la queue et porte le bord de fuite.
 * Des doigts égaux donneraient un éventail de parapluie.
 */
const FINGERS: readonly FingerSpec[] = [
  { length: 280, offset: 0, width: 5.2 },
  { length: 274, offset: 15, width: 4.5 },
  { length: 266, offset: 41, width: 4.3 },
  { length: 258, offset: 74, width: 4.6 },
];
const HUMERUS = 90;
const FOREARM = 132;
/** La membrane s'attache un peu avant la pointe du doigt : il en reste une griffe. */
const ATTACH = 0.962;

interface Wing {
  membrane: string;
  /** Bras seul (humérus, avant-bras) : il est de chair, comme le corps. */
  arm: string;
  /** Main seule : carpe, quatre doigts, griffe du pouce. */
  hand: string;
  veins: string;
  shade: string;
  hatch: string;
  wrist: Pt;
  tip: Pt;
}

function buildWing(pr: Proportions, side: 1 | -1, bt: Beat, bank: number, b: Bounds): Wing {
  const sx = pr.torsoHalf * 0.66;
  const sy = 8;
  const fold = bt.fold;
  const elevIn = bt.elevIn + side * bank;
  const elevOut = bt.elevOut + side * bank;

  // Du plan de l'aile vers la vue du dessus : une aile levée ou abaissée se raccourcit.
  const project = (p: Pt): Pt => {
    const dx = p[0] - sx;
    if (dx <= 0) return [side * p[0], p[1]];
    const elev = lerp(elevIn, elevOut, smooth(dx / 440));
    return [side * (sx + dx * Math.cos(elev)), p[1]];
  };

  // Articulations, dans le plan de l'aile (côté droit, x vers l'extérieur, y vers la queue).
  const shoulder: Pt = [sx, sy];
  const humerus = (lerp(15, 44, fold) + bt.sweep) * DEG;
  const forearm = (lerp(-32, -66, fold) + bt.sweep) * DEG;
  const elbow = polar(shoulder, HUMERUS, humerus);
  const wrist = polar(elbow, FOREARM, forearm);
  const lead = lerp(15, 58, fold) + bt.sweep;
  const fan = lerp(1, 0.44, fold);
  const curl = lerp(7, 12, fold);

  let hand = '';

  // Bras : charnu à l'épaule, renflé au coude et au poignet.
  const root = polar(shoulder, -24, humerus);
  const arm = [
    root,
    shoulder,
    mix(shoulder, elbow, 0.36),
    mix(shoulder, elbow, 0.74),
    elbow,
    mix(elbow, wrist, 0.2),
    mix(elbow, wrist, 0.52),
    mix(elbow, wrist, 0.84),
    polar(wrist, 5, forearm),
  ];
  // Deux profils : devant, le biceps puis le ventre des extenseurs ; derrière, le triceps et
  // la pointe du coude. Un ruban symétrique donnerait un tuyau.
  const armLead = [21, 19.5, 15.5, 10.4, 8.6, 10.6, 8.2, 5.6, 6];
  const armTrail = [22, 21, 14.4, 10.2, 13.8, 8, 6.2, 5.4, 6.4];
  const leadSide: Pt[] = [];
  const trailSide: Pt[] = [];
  arm.forEach((c, i) => {
    const [tx, ty] = unit(at(arm, i - 1), at(arm, i + 1));
    const lead = at(armLead, i) * pr.bone;
    const trail = at(armTrail, i) * pr.bone;
    leadSide.push(project([c[0] + ty * lead, c[1] - tx * lead]));
    trailSide.push(project([c[0] - ty * trail, c[1] + tx * trail]));
  });
  trailSide.reverse();
  const armPath = pathOf(orient([...through(leadSide), ...lineTo(at(leadSide, arm.length - 1), at(trailSide, 0)), ...through(trailSide).slice(1)]), b);

  // Doigts : chacun s'incurve vers le bord de fuite ; le repli les rapproche et les recourbe.
  const fingers: Pt[][] = [];
  const steps = 6;
  FINGERS.forEach((spec, index) => {
    // Les vieux dragons ont la voilure large : les doigts du bord de fuite s'allongent avec la masse.
    const reach = spec.length * (index === 0 ? 1 : index === 1 ? 0.95 + 0.06 * pr.mass : 0.8 + 0.28 * pr.mass);
    const base = lead + spec.offset * fan;
    const center: Pt[] = [];
    const halves: number[] = [];
    let p = wrist;
    for (let i = 0; i <= steps; i++) {
      const u = i / steps;
      center.push(p);
      const knuckle = 0.7 * Math.exp(-Math.pow((u - 0.38) / 0.05, 2)) + 0.5 * Math.exp(-Math.pow((u - 0.7) / 0.05, 2));
      halves.push((spec.width * (1 - 0.8 * u) + knuckle + 0.3) * pr.bone * (i === steps ? 0.3 : 1));
      const a = (base + curl * (-0.9 + 2.7 * Math.pow((i + 0.5) / steps, 1.25))) * DEG;
      p = polar(p, reach / steps, a);
    }
    const projected = center.map(project);
    fingers.push(projected);
    hand += pathOf(ribbon(projected, halves), b);
  });

  // Griffe du pouce, au poignet, tournée vers l'avant.
  const thumb: Pt[] = [];
  const thumbHalf: number[] = [];
  for (let i = 0; i <= 5; i++) {
    const u = i / 5;
    thumb.push(project(polar(wrist, 36 * u * pr.bone, forearm - (30 - 38 * u) * DEG)));
    thumbHalf.push(4.8 * pr.bone * Math.pow(1 - u, 0.85) + 0.2);
  }
  hand += pathOf(ribbon(thumb, thumbHalf), b);
  // Carpe : le nœud d'où partent les doigts.
  const carpus: Pt[] = [];
  for (let i = 0; i < 6; i++) carpus.push(project(polar(wrist, 8.2 * pr.bone, (i * TAU) / 6)));
  hand += pathOf(orient(loop(carpus)), b);

  // Membrane. Attache avant devant l'épaule, attache arrière sur le flanc, à la hanche.
  const pWrist = project(wrist);
  const pElbow = project(elbow);
  const pShoulder = project(shoulder);
  const frontY = sy - 20 - 8 * pr.mass;
  const front: Pt = [side * pr.half(pr.sShoulder + frontY) * 0.8, frontY];
  // Attache arrière sur la cuisse, au-dessus du genou : l'aile et la patte font un seul appareil.
  const hipY = pr.torsoLen * LEG_AT + 20 * pr.leg;
  const hip: Pt = [side * (pr.half(pr.sShoulder + hipY) + 11 * pr.leg), hipY];

  const along = (f: readonly Pt[], u: number): Pt => {
    const x = clamp(u, 0, 1) * (f.length - 1);
    const i = Math.min(Math.floor(x), f.length - 2);
    return mix(at(f, i), at(f, i + 1), x - i);
  };
  // Arc tendu entre deux attaches, creusé vers un repère : une membrane sous tension, pas
  // un feston de rideau.
  const arc = (a: Pt, z: Pt, sag: number, toward: Pt, from = 0.26, to = 0.74): Cubic => {
    const len = dist(a, z);
    const dir = unit(a, z);
    let n: Pt = [-dir[1], dir[0]];
    const mid = mix(a, z, 0.5);
    if ((toward[0] - mid[0]) * n[0] + (toward[1] - mid[1]) * n[1] < 0) n = [-n[0], -n[1]];
    const h = (len * sag * 4) / 3;
    return [
      a,
      [a[0] + dir[0] * len * from + n[0] * h, a[1] + dir[1] * len * from + n[1] * h],
      [a[0] + dir[0] * len * to + n[0] * h, a[1] + dir[1] * len * to + n[1] * h],
      z,
    ];
  };

  // Propatagium : un tendon de l'épaule au poignet, qui se détend quand l'aile se replie.
  const tendon = arc(front, pWrist, 0.1 + 0.1 * fold, pElbow, 0.3, 0.78);
  const chain: Chain = [front, tendon[1], tendon[2], pWrist];
  // Bord d'attaque : le premier doigt.
  const attach = fingers.map((f) => along(f, ATTACH));
  const leading = [...at(fingers, 0).slice(0, -1), at(attach, 0)];
  chain.push(...through(leading).slice(1));

  // Bord de fuite : un arc par panneau, puis un grand arc du quatrième doigt à la hanche.
  const scallops: Cubic[] = [];
  for (let i = 0; i < FINGERS.length; i++) {
    const a = at(attach, i);
    const last = i === FINGERS.length - 1;
    const z = last ? hip : at(attach, i + 1);
    const chord = dist(a, z);
    const cubic = last ? arc(a, z, lerp(0.15, 0.2, fold), pWrist, 0.16, 0.6) : arc(a, z, lerp(0.13, 0.3, fold), pWrist);
    scallops.push(cubic);

    // Entailles des vieilles membranes.
    const seed = i * 7.3 + (side > 0 ? 1.7 : 5.9) + pr.mass * 13;
    const count = Math.min(last ? 2 : 1, Math.round(pr.wear * (0.1 + 1.6 * noise(seed))));
    let from = 0;
    for (let j = 0; j < count; j++) {
      const t = 0.3 + (0.42 * (j + 0.2 + 0.6 * noise(seed + j * 3.1))) / count;
      const gap = (last ? 0.014 : 0.034) * (0.7 + 0.8 * noise(seed + j * 5.3));
      const edge = cubicAt(cubic, t);
      // La déchirure entre perpendiculairement au bord, vers l'intérieur du panneau.
      const run = unit(cubicAt(cubic, t - 0.02), cubicAt(cubic, t + 0.02));
      const toWrist = unit(edge, pWrist);
      const turn = run[1] * toWrist[0] - run[0] * toWrist[1] >= 0 ? 1 : -1;
      const inward: Pt = [run[1] * turn + run[0] * 0.35, -run[0] * turn + run[1] * 0.35];
      const cut = Math.min(chord, 150) * (last ? 0.6 : 1) * (0.1 + 0.14 * noise(seed + j * 9.7)) * (0.5 + 0.5 * pr.wear);
      const apex: Pt = [edge[0] + inward[0] * cut, edge[1] + inward[1] * cut];
      const before = cubicAt(cubic, t - gap);
      const after = cubicAt(cubic, t + gap);
      // Les lèvres de la déchirure sont courbes : la membrane se rétracte en s'ouvrant.
      const lipIn = mix(mix(before, apex, 0.55), edge, 0.3);
      const lipOut = mix(mix(after, apex, 0.55), edge, 0.3);
      chain.push(...subCubic(cubic, from, t - gap), mix(before, lipIn, 0.6), lipIn, apex, lipOut, mix(after, lipOut, 0.6), after);
      from = t + gap;
    }
    chain.push(...subCubic(cubic, from, 1));
  }
  // Fermeture sous le corps.
  const inX = side * 3;
  chain.push(...lineTo(hip, [inX, hipY]), ...lineTo([inX, hipY], [inX, frontY]));
  const membrane = pathOf(orient(chain), b);

  // Ombre de la membrane contre l'os : une lame le long du bord de fuite de chaque doigt et
  // du bras. Elle donne du relief à l'aile sans dégradé.
  const blade = (center: readonly Pt[], width: (u: number) => number): string => {
    const far: Pt[] = [];
    const n = center.length;
    for (let i = 0; i < n; i++) {
      const c = at(center, i);
      const [tx, ty] = unit(at(center, i - 1), at(center, i + 1));
      const w = width(i / (n - 1)) * side;
      far.push([c[0] - ty * w, c[1] + tx * w]);
    }
    far.reverse();
    return pathOf(orient([...through(center), ...lineTo(at(center, n - 1), at(far, 0)), ...through(far).slice(1)]), b);
  };
  let shade = '';
  const slack = (1 - 0.4 * fold) * (0.8 + 0.3 * pr.mass);
  fingers.forEach((f, i) => {
    const run: Pt[] = [];
    for (let k = 0; k <= 6; k++) run.push(along(f, 0.03 + 0.9 * (k / 6)));
    const wide = i === FINGERS.length - 1 ? 19 : 12 + 2.5 * i;
    shade += blade(run, (u) => (1.5 + wide * Math.pow(Math.sin(Math.PI * Math.pow(u, 0.8)), 0.8)) * slack);
  });
  shade += blade([pShoulder, mix(pShoulder, pElbow, 0.5), pElbow, mix(pElbow, pWrist, 0.5), pWrist], (u) => (9 + 13 * Math.sin(Math.PI * u)) * slack);

  // Lignes de tension de la membrane : rares (nervures), puis denses (hachures de gravure).
  const armPoint = (t: number): Pt => (t < 0.55 ? mix(pWrist, pElbow, t / 0.55) : mix(pElbow, pShoulder, (t - 0.55) / 0.45));
  const lines = (count: number, i: number, starts: readonly number[], reach: number): string => {
    let d = '';
    const cubic = at(scallops, i);
    const last = i === FINGERS.length - 1;
    for (let j = 1; j <= count; j++) {
      const t = j / (count + 1);
      const end = cubicAt(cubic, t);
      const s0 = at(starts, (j - 1) % starts.length);
      const start = last ? mix(armPoint(t), end, s0) : mix(along(at(fingers, i), s0), along(at(fingers, i + 1), s0), t);
      d += segment(start, mix(start, end, reach));
    }
    return d;
  };
  // Gravure : la teinte se pose le long du bord de fuite, puis à l'ombre du bras ; le milieu
  // des panneaux reste clair.
  const stagger = [0.56, 0.82, 0.66, 0.88, 0.6, 0.76];
  let veins = '';
  let hatch = '';
  for (let i = 0; i < FINGERS.length; i++) {
    const last = i === FINGERS.length - 1;
    veins += lines(last ? 5 : i === 0 ? 1 : i + 1, i, [0.24, 0.32], 0.985);
    hatch += lines(last ? 23 : i === 0 ? 5 : 9 + 3 * i, i, stagger, 0.965);
  }
  for (let j = 1; j <= 19; j++) {
    const t = j / 20;
    const anchor = armPoint(t);
    const end = cubicAt(at(scallops, FINGERS.length - 1), t);
    hatch += segment(mix(anchor, end, 0.05), mix(anchor, end, j % 2 === 0 ? 0.2 : 0.13));
  }
  // Le propatagium reçoit quelques traits parallèles au tendon.
  for (let j = 1; j <= 6; j++) {
    const t = j / 7;
    const a = t < 0.5 ? mix(pShoulder, pElbow, t * 2) : mix(pElbow, pWrist, t * 2 - 1);
    const z = cubicAt(tendon, lerp(0.2, 0.92, t));
    hatch += segment(mix(a, z, 0.14), mix(a, z, j % 2 === 0 ? 0.52 : 0.38));
  }

  return { membrane, arm: armPath, hand, veins, shade, hatch, wrist: pWrist, tip: at(at(fingers, 0), steps) };
}

/* ------------------------------------------------------------------ assemblage */

interface Built {
  parts: DragonParts;
  bounds: Bounds;
  anchors: DragonGeometry['anchors'];
}

/** Corps déjà construits, par look et par pose : plusieurs dragons peuvent battre des ailes sur la même page. */
const axials = new Map<string, Axial>();
const AXIAL_MEMORY = 64;

function construct(pr: Proportions, pose: DragonPose): Built {
  const bank = clamp(finite(pose.bank, 0), -1, 1) * 28 * DEG;
  const neckCurve = clamp(finite(pose.neckCurve, 0), -1, 1);
  const tailCurve = clamp(finite(pose.tailCurve, 0), -1, 1);

  // Le corps ne dépend pas de la phase : on le garde d'une image à l'autre.
  const key = `${pr.key}|${r1(bank * 100)}|${r1(neckCurve * 100)}|${r1(tailCurve * 100)}`;
  let axial = axials.get(key);
  if (!axial) {
    axial = buildAxial(pr, neckCurve, tailCurve, bank);
    if (axials.size >= AXIAL_MEMORY) axials.clear();
    axials.set(key, axial);
  }

  const bt = beat(finite(pose.flap, 0));
  const bounds: Bounds = { ...axial.bounds };
  const right = buildWing(pr, 1, bt, bank, bounds);
  const left = buildWing(pr, -1, bt, bank, bounds);

  return {
    parts: {
      ...axial.parts,
      wingMembraneL: left.membrane,
      wingMembraneR: right.membrane,
      wingBonesL: left.arm + left.hand,
      wingBonesR: right.arm + right.hand,
      wingArmL: left.arm,
      wingArmR: right.arm,
      wingHandL: left.hand,
      wingHandR: right.hand,
      wingShadeL: left.shade,
      wingShadeR: right.shade,
      wingVeinsL: left.veins,
      wingVeinsR: right.veins,
      wingHatchL: left.hatch,
      wingHatchR: right.hatch,
    },
    bounds,
    anchors: { ...axial.anchors, wristL: left.wrist, wristR: right.wrist, wingtipL: left.tip, wingtipR: right.tip },
  };
}

const boxes = new Map<string, { box: DragonBox; wingspan: number }>();

/** Cadre commun à toutes les phases du battement, symétrique, colonne droite. */
function frameOf(pr: Proportions): { box: DragonBox; wingspan: number } {
  const known = boxes.get(pr.key);
  if (known) return known;
  const all = emptyBounds();
  let wingspan = 0;
  for (const flap of [0, 0.25, 0.5, 0.75]) {
    const built = construct(pr, { flap });
    grow(all, built.bounds.minX, built.bounds.minY);
    grow(all, built.bounds.maxX, built.bounds.maxY);
    if (flap === 0) wingspan = built.anchors.wingtipR[0] - built.anchors.wingtipL[0];
  }
  const halfWidth = Math.ceil(Math.max(-all.minX, all.maxX) + 14);
  const top = Math.floor(all.minY - 14);
  const bottom = Math.ceil(all.maxY + 14);
  const entry = { box: { x: -halfWidth, y: top, width: halfWidth * 2, height: bottom - top }, wingspan };
  boxes.set(pr.key, entry);
  return entry;
}

/**
 * Construit le dragon d'un look dans une pose.
 * Appel peu coûteux (quelques centaines de points) : on peut le rejouer à chaque image d'une animation.
 */
export function buildDragon(look: DragonShape, pose: DragonPose = { flap: 0 }): DragonGeometry {
  const pr = proportions(look);
  const { box, wingspan } = frameOf(pr);
  const built = construct(pr, pose);
  return {
    viewBox: `${box.x} ${box.y} ${box.width} ${box.height}`,
    box,
    parts: built.parts,
    anchors: built.anchors,
    metrics: { wingspan, length: pr.sEnd },
  };
}
