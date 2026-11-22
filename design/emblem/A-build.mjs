// Emblème A : dragon tricéphale « déployé », symétrique sur l'axe vertical.
// Usage : node design/emblem/A-build.mjs   -> écrit design/emblem/A-emblem.svg
// Tout le dessin est calculé : demi-figure gauche, miroir sur x = 256.
// Vocabulaire unique : des éclats bornés par des arcs tendus qui se rejoignent en pointe.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const AXIS = 256;
const r = (n) => Math.round(n * 10) / 10;

/* ------------------------------------------------------------ outils */
const add = (a, b) => [a[0] + b[0], a[1] + b[1]];
const sub = (a, b) => [a[0] - b[0], a[1] - b[1]];
const mul = (a, k) => [a[0] * k, a[1] * k];
const len = (a) => Math.hypot(a[0], a[1]);
const mirrorPt = ([x, y]) => [2 * AXIS - x, y];

/** Arête courbe de a vers b ; `bulge` = flèche en fraction de la corde (positif : à gauche du sens de marche). */
function edge(a, b, bulge = 0) {
  if (!bulge) return { t: 'L', p: [b] };
  const d = sub(b, a);
  const n = [d[1], -d[0]];
  const c = add(mul(add(a, b), 0.5), mul(n, bulge * 2));
  return { t: 'Q', p: [c, b] };
}

/** Contour fermé à partir de sommets [x, y, bulge de l'arête sortante]. */
function shard(pts) {
  const segs = [{ t: 'M', p: [[pts[0][0], pts[0][1]]] }];
  for (let i = 0; i < pts.length; i++) {
    const a = pts[i];
    const b = pts[(i + 1) % pts.length];
    segs.push(edge([a[0], a[1]], [b[0], b[1]], a[2] ?? 0));
  }
  segs.push({ t: 'Z', p: [] });
  return segs;
}

/** Demi-contour (du haut de l'axe au bas de l'axe) complété par son miroir : forme symétrique fermée. */
function symmetric(half) {
  const left = [];
  for (let i = 0; i < half.length - 1; i++) {
    left.push(edge([half[i][0], half[i][1]], [half[i + 1][0], half[i + 1][1]], half[i][2] ?? 0));
  }
  const segs = [{ t: 'M', p: [[half[0][0], half[0][1]]] }, ...left];
  // retour par la droite : on remonte le demi-contour en miroir
  for (let i = half.length - 1; i > 0; i--) {
    const a = mirrorPt([half[i][0], half[i][1]]);
    const b = mirrorPt([half[i - 1][0], half[i - 1][1]]);
    segs.push(edge(a, b, half[i - 1][2] ?? 0));
  }
  segs.push({ t: 'Z', p: [] });
  return segs;
}

const mirrorSegs = (segs) => segs.map((s) => ({ t: s.t, p: s.p.map(mirrorPt) }));
const toD = (segs) =>
  segs
    .map((s) => (s.t === 'Z' ? 'Z' : s.t + s.p.map((p) => `${r(p[0])} ${r(p[1])}`).join(' ')))
    .join('');

/** Point et tangente d'une cubique. */
function cubic(P, t) {
  const u = 1 - t;
  const pt = [
    u * u * u * P[0][0] + 3 * u * u * t * P[1][0] + 3 * u * t * t * P[2][0] + t * t * t * P[3][0],
    u * u * u * P[0][1] + 3 * u * u * t * P[1][1] + 3 * u * t * t * P[2][1] + t * t * t * P[3][1],
  ];
  const d = [
    3 * u * u * (P[1][0] - P[0][0]) + 6 * u * t * (P[2][0] - P[1][0]) + 3 * t * t * (P[3][0] - P[2][0]),
    3 * u * u * (P[1][1] - P[0][1]) + 6 * u * t * (P[2][1] - P[1][1]) + 3 * t * t * (P[3][1] - P[2][1]),
  ];
  return { pt, d };
}

/** Bord décalé d'une cubique (demi-largeur variable), rendu en `pieces` cubiques par interpolation d'Hermite. */
function offsetCurve(P, halfWidth, side, pieces = 3, t0 = 0, t1 = 1) {
  const at = (t) => {
    const { pt, d } = cubic(P, t);
    const l = len(d) || 1;
    const n = [(d[1] / l) * side, (-d[0] / l) * side];
    return add(pt, mul(n, halfWidth(t)));
  };
  const h = 1e-3;
  const deriv = (t) => mul(sub(at(Math.min(1, t + h)), at(Math.max(0, t - h))), 1 / (Math.min(1, t + h) - Math.max(0, t - h)));
  const out = [];
  for (let i = 0; i < pieces; i++) {
    const a = t0 + ((t1 - t0) * i) / pieces;
    const b = t0 + ((t1 - t0) * (i + 1)) / pieces;
    const dt = b - a;
    const pa = at(a);
    const pb = at(b);
    out.push({ start: pa, t: 'C', p: [add(pa, mul(deriv(a), dt / 3)), sub(pb, mul(deriv(b), dt / 3)), pb] });
  }
  return out;
}
const reverseCubics = (cs) =>
  cs
    .slice()
    .reverse()
    .map((c) => ({ start: c.p[2], t: 'C', p: [c.p[1], c.p[0], c.start] }));

/* ------------------------------------------------------------ paramètres */
const K = JSON.parse(process.env.A_PARAMS ?? '{}');
const cfg = {
  tilt: 16, // inclinaison des têtes latérales au-dessus de l'horizontale, en degrés
  ...K,
};

/* ------------------------------------------------------------ tête centrale (vue de dessus, museau vers le haut) */
function centerHead() {
  const half = [
    [256, 20, -0.05], // pointe du museau
    [243, 76, 0.07], // naseaux
    [228, 116, 0.02], // arcade
    [222, 138, 0.04], // angle de la mâchoire, point le plus large
    [196, 184, 0.1], // pointe de la grande corne
    [236, 152, 0.05], // creux entre les cornes
    [224, 190, 0.08], // pointe de la petite corne
    [243, 168, 0], // nuque
    [240, 262, 0], // base du cou
    [256, 262, 0],
  ];
  const eyeL = shard([
    [246, 110, -0.12],
    [234, 132, -0.1],
    [240, 113, 0],
  ]);
  const nostrilL = shard([
    [252, 58, 0],
    [248, 74, 0],
    [251, 72, 0],
  ]);
  return [symmetric(half), eyeL, mirrorSegs(eyeL), nostrilL, mirrorSegs(nostrilL)];
}

/* ------------------------------------------------------------ tête latérale (profil) et son cou */
function sideHead() {
  const tau = (cfg.tilt * Math.PI) / 180;
  const O = [170, 128]; // base du crâne
  const fwd = [-Math.cos(tau), -Math.sin(tau)];
  const up = [Math.sin(tau), -Math.cos(tau)];
  const L = (u, v) => add(O, add(mul(fwd, u), mul(up, v)));

  // Cou : ligne médiane de l'épaule à la base du crâne.
  const neck = [
    [238, 268],
    [226, 214],
    [214, 150],
    L(0, -6),
  ];
  const w = (t) => 17 - 5.5 * t;
  const outer = offsetCurve(neck, w, -1, 3); // côté gorge (extérieur)
  const inner = offsetCurve(neck, w, 1, 3); // côté nuque (vers l'axe)
  const T = outer[outer.length - 1].p[2];
  const N = inner[inner.length - 1].p[2];

  const head = [
    // de la gorge à la nuque, en passant par le museau
    [L(26, -27), -0.06], // angle de la mâchoire
    [L(96, -33), 0], // pointe de la mâchoire inférieure
    [L(78, -22), 0],
    [L(74, -12), 0], // croc inférieur
    [L(68, -19), 0.03],
    [L(34, -5), 0], // commissure
    [L(82, -3), 0],
    [L(87, -15), 0], // croc supérieur
    [L(93, -3), 0.1],
    [L(110, -7), 0.12], // bec du museau
    [L(96, 9), -0.03], // naseau
    [L(44, 23), 0.03], // arcade
    [L(16, 25), -0.06],
    [L(-56, 50), 0.1], // pointe de la grande corne
    [L(-2, 13), -0.08],
    [L(-44, 12), 0.1], // pointe de la petite corne
  ];

  const segs = [{ t: 'M', p: [outer[0].start] }];
  for (const c of outer) segs.push({ t: 'C', p: c.p });
  let prev = T;
  for (let i = 0; i < head.length; i++) {
    const [pt] = head[i];
    const bulge = i === 0 ? 0.08 : head[i - 1][1];
    segs.push(edge(prev, pt, bulge));
    prev = pt;
  }
  segs.push(edge(prev, N, head[head.length - 1][1]));
  for (const c of reverseCubics(inner)) segs.push({ t: 'C', p: c.p });
  segs.push({ t: 'Z', p: [] });

  const eye = shard([
    [...L(60, 11), -0.14],
    [...L(40, 9), -0.12],
    [...L(56, 15), 0],
  ]);
  return [segs, eye];
}

/* ------------------------------------------------------------ aile gauche */
function wing() {
  const S = [236, 262]; // épaule
  const W = [58, 208]; // poignet
  const ray = (deg, l) => add(W, [Math.cos((deg * Math.PI) / 180) * l, Math.sin((deg * Math.PI) / 180) * l]);

  const fingers = [
    { a: 104, l: 128 },
    { a: 80, l: 204 },
    { a: 59, l: 226 },
  ];
  const gap = 2.6; // demi-angle de l'entaille entre deux voiles, en degrés
  const panels = [];
  for (let i = 0; i < fingers.length; i++) {
    const f = fingers[i];
    const tip = ray(f.a, f.l);
    const root = ray(f.a, 16);
    if (i < fingers.length - 1) {
      const g = fingers[i + 1];
      const end = ray(g.a + gap * 2, g.l * 0.8);
      const rootEnd = ray(g.a + gap * 2, 22);
      panels.push(
        shard([
          [...root, 0.015],
          [...tip, 0.16],
          [...end, 0],
          [...rootEnd, 0],
        ]),
      );
    } else {
      // dernière voile : du troisième doigt au flanc
      panels.push(
        shard([
          [...root, 0.015],
          [...tip, 0.17],
          [240, 338, 0],
          [236, 268, 0],
          [...ray(17, 30), 0],
        ]),
      );
    }
  }

  const arm = shard([
    [240, 244, 0.035],
    [70, 199, -0.1],
    [36, 166, -0.16], // griffe du pouce
    [54, 216, -0.02],
    [240, 280, 0],
  ]);
  return { panels, arm };
}

/* ------------------------------------------------------------ corps, pattes, queue */
function body() {
  const torso = symmetric([
    [256, 236, 0],
    [214, 246, 0.07],
    [240, 340, -0.05],
    [232, 366, -0.03],
    [244, 388, 0],
    [256, 388, 0],
  ]);
  const chevrons = [0, 1, 2].map((i) => {
    const y = 286 + i * 22;
    const hw = 17 - i * 3.5;
    return symmetric([
      [256, y, 0],
      [256 - hw, y - hw * 0.62, 0],
      [256 - hw, y - hw * 0.62 - 5, 0],
      [256, y - 6, 0],
    ]);
  });
  const leg = shard([
    [242, 352, -0.14],
    [209, 386, -0.04],
    [211, 408, 0.05],
    [184, 432, -0.12],
    [205, 423, 0.04],
    [203, 452, -0.12],
    [216, 426, 0.02],
    [230, 446, -0.12],
    [226, 408, 0.03],
    [248, 376, 0],
  ]);
  return { torso, chevrons, leg };
}

function tail() {
  return symmetric([
    [256, 372, 0],
    [243, 376, 0.015],
    [251, 444, 0.05],
    [231, 430, 0.03], // barbe du dard
    [256, 498, 0],
  ]);
}

/* ------------------------------------------------------------ assemblage */
const fmt = (segsList) => segsList.map(toD).join('');
const pathEl = (d, extra = '') => `<path${extra} d="${d}"/>`;

const [ch, ...chHoles] = centerHead();
const [sh, shEye] = sideHead();
const wg = wing();
const bd = body();
const tl = tail();

const tone2 = ' fill="var(--emblem-2, currentColor)"';

const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" fill="currentColor" fill-rule="evenodd" role="img" aria-labelledby="emblem-a-title">
<title id="emblem-a-title">Dragon à trois têtes</title>
<g id="wings">
<g id="wing-left">
${wg.panels.map((p) => pathEl(toD(p), tone2)).join('\n')}
${pathEl(toD(wg.arm))}
</g>
<g id="wing-right">
${wg.panels.map((p) => pathEl(toD(mirrorSegs(p)), tone2)).join('\n')}
${pathEl(toD(mirrorSegs(wg.arm)))}
</g>
</g>
<g id="tail">
${pathEl(toD(tl))}
</g>
<g id="body">
${pathEl(toD(bd.leg))}
${pathEl(toD(mirrorSegs(bd.leg)))}
${pathEl(fmt([bd.torso, ...bd.chevrons]))}
</g>
<g id="heads">
${pathEl(fmt([sh, shEye]))}
${pathEl(fmt([mirrorSegs(sh), mirrorSegs(shEye)]))}
${pathEl(fmt([ch, ...chHoles]))}
</g>
</svg>
`;

const out = path.join(here, process.env.A_OUT ?? 'A-emblem.svg');
fs.writeFileSync(out, svg);
console.log('SVG écrit : ' + out + ' (' + svg.length + ' octets)');
