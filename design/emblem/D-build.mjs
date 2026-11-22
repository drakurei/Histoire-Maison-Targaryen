// Emblème D : dragon tricéphale « déployé », construit par le calcul.
// Usage : node design/emblem/D-build.mjs  ->  design/emblem/D-emblem.svg
// Parti pris : verre-dragon. Angles vifs pour les têtes, les griffes et les ailes ;
// courbes tendues pour les cous et la queue. Symétrie d'axe vertical, sauf la queue.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const CX = 256;
const r1 = (n) => Math.round(n * 10) / 10;
const P = (pts) => pts.map(([x, y], i) => (i ? 'L' : 'M') + r1(x) + ' ' + r1(y)).join('') + 'Z';
const mx = (x) => 2 * CX - x;
const mirror = (pts) => pts.map(([x, y]) => [mx(x), y]).reverse();

/** Spline de Catmull-Rom échantillonnée. */
function spline(ctrl, samples = 48) {
  const out = [];
  const p = [ctrl[0], ...ctrl, ctrl[ctrl.length - 1]];
  const segs = ctrl.length - 1;
  for (let s = 0; s < segs; s++) {
    const [p0, p1, p2, p3] = [p[s], p[s + 1], p[s + 2], p[s + 3]];
    const n = Math.ceil(samples / segs);
    for (let i = 0; i < n; i++) {
      const t = i / n;
      const t2 = t * t;
      const t3 = t2 * t;
      out.push([0, 1].map((k) => 0.5 * (2 * p1[k] + (-p0[k] + p2[k]) * t + (2 * p0[k] - 5 * p1[k] + 4 * p2[k] - p3[k]) * t2 + (-p0[k] + 3 * p1[k] - 3 * p2[k] + p3[k]) * t3)));
    }
  }
  out.push(ctrl[ctrl.length - 1]);
  return out;
}

/** Ruban d'épaisseur variable autour d'une ligne centrale. widths : [[t, demi-largeur], …]. */
function ribbon(ctrl, widths, samples = 60) {
  const c = spline(ctrl, samples);
  const w = (t) => {
    for (let i = 1; i < widths.length; i++) {
      if (t <= widths[i][0]) {
        const [t0, w0] = widths[i - 1];
        const [t1, w1] = widths[i];
        return w0 + (w1 - w0) * ((t - t0) / (t1 - t0 || 1));
      }
    }
    return widths[widths.length - 1][1];
  };
  const L = [];
  const R = [];
  c.forEach(([x, y], i) => {
    const a = c[Math.max(0, i - 1)];
    const b = c[Math.min(c.length - 1, i + 1)];
    const dx = b[0] - a[0];
    const dy = b[1] - a[1];
    const len = Math.hypot(dx, dy) || 1;
    const hw = w(i / (c.length - 1));
    L.push([x - (dy / len) * hw, y + (dx / len) * hw]);
    R.push([x + (dy / len) * hw, y - (dx / len) * hw]);
  });
  return [...L, ...R.reverse()];
}

/** Place un tracé local (origine = attache du cou, museau vers +x) dans le plan. */
const place = (pts, [ox, oy], angleDeg, scale = 1) => {
  const a = (angleDeg * Math.PI) / 180;
  return pts.map(([x, y]) => {
    const X = x * scale;
    const Y = y * scale;
    return [ox + X * Math.cos(a) - Y * Math.sin(a), oy + X * Math.sin(a) + Y * Math.cos(a)];
  });
};

/* ------------------------------------------------------------ Têtes */

// Tête de profil, museau vers +x. Mâchoires entrouvertes, deux cornes couchées.
const HEAD_PROFILE = [
  [-12, 10], [-14, -8],
  [-32, -36], [-4, -18], // corne haute
  [8, -19], [18, -26], [24, -15], // arcade
  [52, -11], [70, -4], [66, 3], // museau
  [44, 3], [22, 7], // gueule
  [40, 10], [60, 16], [52, 21], // mâchoire inférieure
  [18, 21], [0, 17],
];
const HORN_LOW = [[-13, -2], [-36, -12], [-12, 9]];
const EYE = [[15, -13], [32, -10], [19, -5]];

// Tête centrale vue du dessus, museau vers −y (demi-profil puis miroir).
const HEAD_TOP_HALF = [
  [0, -80], [6, -62], [13, -40], [19, -30], [21, -18], // museau, joue, arcade
  [36, 30], [14, -2], // corne balayée vers l'arrière
  [22, 40], [10, 10], // seconde corne
  [9, 18],
];
const headTop = (ox, oy, s = 1) => {
  const right = HEAD_TOP_HALF.map(([x, y]) => [ox + x * s, oy + y * s]);
  const left = HEAD_TOP_HALF.slice(1).map(([x, y]) => [ox - x * s, oy + y * s]).reverse();
  return [...right, ...left];
};
const EYE_TOP = [[6, -37], [14, -28], [8, -29]];

/* ------------------------------------------------------------ Cous et têtes placés */

const neckR = ribbon([[270, 252], [312, 244], [362, 222], [380, 184], [374, 152]], [[0, 17], [0.5, 14], [1, 11]]);
const neckC = ribbon([[256, 256], [256, 210], [256, 160], [256, 122]], [[0, 17], [0.6, 13], [1, 10.5]]);

const HR_AT = [375, 150];
const HR_ANGLE = -32;
const HR_SCALE = 1.4;
const headR = place(HEAD_PROFILE, HR_AT, HR_ANGLE, HR_SCALE);
const hornR = place(HORN_LOW, HR_AT, HR_ANGLE, HR_SCALE);
const eyeR = place(EYE, HR_AT, HR_ANGLE, HR_SCALE);
const headC = headTop(256, 122, 1.3);
const eyeCR = EYE_TOP.map(([x, y]) => [256 + x * 1.3, 122 + y * 1.3]);

/* ------------------------------------------------------------ Ailes */

// Épaule, coude, poignet, pouce griffu, trois doigts, membrane festonnée.
const WRIST = [452, 214];
const wing = (m) =>
  'M' + m(CX + 14) + ' 244' +
  'L' + m(CX + 104) + ' 238' +
  'L' + m(WRIST[0] - 12) + ' 200' +
  'L' + m(WRIST[0] + 22) + ' 150' +
  'L' + m(WRIST[0] + 8) + ' 208' +
  'L' + m(500) + ' 322' +
  'Q' + m(452) + ' 300 ' + m(440) + ' 400' +
  'Q' + m(408) + ' 350 ' + m(362) + ' 444' +
  'Q' + m(340) + ' 372 ' + m(CX + 34) + ' 318Z';

// Os des doigts : fines entailles du poignet vers chaque pointe (vides).
const bone = (tip, w = 3.2) => {
  const wx = WRIST[0] - 4;
  const wy = WRIST[1] + 2;
  const dx = tip[0] - wx;
  const dy = tip[1] - wy;
  const len = Math.hypot(dx, dy);
  const nx = (-dy / len) * w;
  const ny = (dx / len) * w;
  const a = [wx + dx * 0.16, wy + dy * 0.16];
  const b = [wx + dx * 0.9, wy + dy * 0.9];
  return [[a[0] + nx, a[1] + ny], b, [a[0] - nx, a[1] - ny]];
};
const bonesR = [bone([440, 400]), bone([362, 444]), bone([300, 326], 2.6)];

/* ------------------------------------------------------------ Corps, serres, queue */

const torso = [[CX - 22, 240], [CX + 22, 240], [CX + 30, 286], [CX + 24, 336], [CX + 10, 372], [CX - 10, 372], [CX - 24, 336], [CX - 30, 286]];
const legR = [
  [CX + 18, 322], [CX + 46, 346], [CX + 52, 384],
  [CX + 82, 410], [CX + 56, 400], // serre extérieure
  [CX + 62, 432], [CX + 44, 404], // serre médiane
  [CX + 30, 426], [CX + 30, 392], // serre intérieure
  [CX + 26, 364], [CX + 10, 356],
];
// Trois chevrons d'écailles entaillés dans le poitrail (vides).
const chevron = (y) => [[CX - 13, y], [CX, y + 10], [CX + 13, y], [CX + 13, y + 5], [CX, y + 15], [CX - 13, y + 5]];
const chevrons = [266, 290, 314].map(chevron);
const tail = ribbon([[256, 362], [264, 392], [242, 426], [262, 458], [256, 478]], [[0, 12], [0.6, 7], [1, 2.5]]);
const dart = place([[-6, -4], [4, -15], [34, 0], [4, 15], [-6, 4]], [256, 474], 96, 1);

/* ------------------------------------------------------------ Sortie */

const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" fill="currentColor" fill-rule="evenodd">
  <g id="wings">
    <path d="${wing((x) => x)}${bonesR.map(P).join('')}"/>
    <path d="${wing(mx)}${bonesR.map((b) => P(mirror(b))).join('')}"/>
  </g>
  <g id="tail">
    <path d="${P(tail)}"/>
    <path d="${P(dart)}"/>
  </g>
  <g id="body">
    <path d="${P(torso)}${chevrons.map(P).join('')}"/>
    <path d="${P(legR)}"/>
    <path d="${P(mirror(legR))}"/>
  </g>
  <g id="heads">
    <path d="${P(neckR)}"/>
    <path d="${P(mirror(neckR))}"/>
    <path d="${P(neckC)}"/>
    <path d="${P(headR)}${P(eyeR)}"/>
    <path d="${P(hornR)}"/>
    <path d="${P(mirror(headR))}${P(mirror(eyeR))}"/>
    <path d="${P(mirror(hornR))}"/>
    <path d="${P(headC)}${P(eyeCR)}${P(mirror(eyeCR))}"/>
  </g>
</svg>
`;

const here = path.dirname(fileURLToPath(import.meta.url));
fs.writeFileSync(path.join(here, 'D-emblem.svg'), svg);

// Module consommé par src/shared/emblem/Emblem.tsx (ne pas éditer à la main : relancer ce script).
const groups = {
  tail: [P(tail), P(dart)],
  body: [P(torso) + chevrons.map(P).join(''), P(legR), P(mirror(legR))],
  wings: [wing((x) => x) + bonesR.map(P).join(''), wing(mx) + bonesR.map((b) => P(mirror(b))).join('')],
  heads: [P(neckR), P(mirror(neckR)), P(neckC), P(headR) + P(eyeR), P(hornR), P(mirror(headR)) + P(mirror(eyeR)), P(mirror(hornR)), P(headC) + P(eyeCR) + P(mirror(eyeCR))],
};
const ts = `// Généré par design/emblem/D-build.mjs. Ne pas éditer à la main.
export const EMBLEM_VIEWBOX = '0 0 512 512';

export type EmblemPart = 'tail' | 'body' | 'wings' | 'heads';

/** Tracés de l'emblème, groupés par partie, dans l'ordre où ils se dessinent à l'ouverture. */
export const EMBLEM_PARTS: readonly { part: EmblemPart; paths: readonly string[] }[] = ${JSON.stringify(
  Object.entries(groups).map(([part, paths]) => ({ part, paths })),
  null,
  2,
)};
`;
const outDir = path.join(here, '..', '..', 'src', 'shared', 'emblem');
fs.mkdirSync(outDir, { recursive: true });
fs.writeFileSync(path.join(outDir, 'paths.ts'), ts);
console.log('D-emblem.svg écrit (' + svg.length + ' octets)');
