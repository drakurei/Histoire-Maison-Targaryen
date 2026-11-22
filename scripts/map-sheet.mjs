// Carte de Westeros et de l'ouest d'Essos : relevé, tracé et planche de contrôle.
//
//   node scripts/map-sheet.mjs            relit content/locations/map.json et places.json,
//                                         écrit design/prototypes/map-check.svg
//   node scripts/map-sheet.mjs --trace    retrace d'abord map.json à partir du relevé ci-dessous
//   --crop=x,y,l,h                        cadre un détail (repère du viewBox)
//   --ids                                 étiquette les lieux par identifiant au lieu du nom
//   --en                                  noms anglais
//   --nu                                  carte seule, sans les lieux
//   --check                               vérifie que chaque lieu tombe du bon côté de la côte
//
// Le relevé est un dessin original : des suites de points posés à la main, d'après la géographie
// que décrivent les livres. Aucune carte publiée n'a été décalquée. Westeros est relevé dans un
// repère de travail (unité proche du mille, x vers l'est, y vers le sud depuis le Mur) ; Essos
// l'est directement dans le repère du viewBox. Le script ramène tout au même repère, donne aux
// points un tremblé et un détail de côte déterministes, puis les relie par des courbes de Bézier.

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const MAP_FILE = path.join(ROOT, 'content/locations/map.json');
const PLACES_FILE = path.join(ROOT, 'content/locations/places.json');
const SHEET_FILE = path.join(ROOT, 'design/prototypes/map-check.svg');

const VIEW = [0, 0, 2000, 1400];
const SX = 0.432; // unités de viewBox par unité de relevé, en largeur
const SY = 0.4; // et en hauteur
const OX = 140; // x du viewBox pour x = 0 du relevé
const OY = 40; // y du viewBox pour y = 0 du relevé (le Mur)

const args = process.argv.slice(2);
const flag = (name) => args.includes(`--${name}`);
const option = (name) => (args.find((a) => a.startsWith(`--${name}=`)) ?? '').split('=')[1];

/* ------------------------------------------------------------------ outils de tracé */

const project = ([x, y]) => [OX + x * SX, OY + y * SY];
const unproject = ([x, y]) => [(x - OX) / SX, (y - OY) / SY];
const r1 = (n) => Math.round(n * 10) / 10;

/** Points relevés dans le repère de travail. */
const pts = (text) =>
  text
    .trim()
    .split(/\s+/)
    .map((pair) => pair.split(',').map(Number));
/** Points relevés dans le repère du viewBox, ramenés au repère de travail. */
const vb = (text) => pts(text).map(unproject);

const shift = (list, dx, dy = 0) => list.map(([x, y]) => [x + dx, y + dy]);

/** Générateur pseudo-aléatoire déterministe : le même relevé donne toujours la même côte. */
function seeded(label) {
  let h = 2166136261;
  for (const ch of label) h = Math.imul(h ^ ch.charCodeAt(0), 16777619);
  return () => {
    h += 0x6d2b79f5;
    let t = h;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * Tremblé de la main : chaque point relevé est déplacé d'une petite distance, toujours la même
 * pour un même relevé. Un tracé trop régulier trahit la règle et le compas.
 */
function jitter(list, amount, seed) {
  const rand = seeded(`j-${seed}`);
  return list.map(([x, y]) => {
    const a = rand() * Math.PI * 2;
    const r = Math.sqrt(rand()) * amount;
    return [x + Math.cos(a) * r, y + Math.sin(a) * r];
  });
}

/**
 * Détail de la côte : tout segment plus long que `max` reçoit un point déporté
 * perpendiculairement, jusqu'à ce qu'aucun segment ne dépasse `max`. `amp` est une fraction
 * de la longueur du segment, modulée par une « rudesse » qui varie lentement le long du tracé :
 * des côtes calmes alternent avec des côtes déchiquetées. Une dernière passe, si `fine` est
 * donné, pose un point de plus sur les segments plus longs que `fine` : criques et pointes, à
 * l'échelle où un graveur laisse trembler son burin.
 */
function fray(list, { amp = 0.2, max = 20, fine = 0, seed = 'x', closed = true } = {}) {
  const rand = seeded(`f-${seed}`);
  const knots = Array.from({ length: 64 }, () => rand());
  const rough = (u) => {
    const p = u * 24;
    const i = Math.floor(p);
    const f = p - i;
    const e = f * f * (3 - 2 * f);
    return 0.3 + 1.25 * (knots[i % 64] * (1 - e) + knots[(i + 1) % 64] * e);
  };
  let current = list;
  for (let pass = 0; pass < 4; pass += 1) {
    const out = [];
    let split = false;
    const last = closed ? current.length : current.length - 1;
    for (let i = 0; i < last; i += 1) {
      const a = current[i];
      const b = current[(i + 1) % current.length];
      out.push(a);
      const dx = b[0] - a[0];
      const dy = b[1] - a[1];
      if (Math.hypot(dx, dy) > max) {
        const k = (rand() * 2 - 1) * amp * rough(i / current.length);
        const t = 0.36 + rand() * 0.28;
        out.push([a[0] + dx * t - dy * k, a[1] + dy * t + dx * k]);
        split = true;
      }
    }
    if (!closed) out.push(current[current.length - 1]);
    current = out;
    if (!split) break;
  }
  if (fine > 0) {
    const out = [];
    const last = closed ? current.length : current.length - 1;
    for (let i = 0; i < last; i += 1) {
      const a = current[i];
      const b = current[(i + 1) % current.length];
      out.push(a);
      const dx = b[0] - a[0];
      const dy = b[1] - a[1];
      const k = (rand() * 2 - 1) * amp * 1.1 * rough(i / current.length);
      const t = 0.38 + rand() * 0.24;
      if (Math.hypot(dx, dy) > fine) out.push([a[0] + dx * t - dy * k, a[1] + dy * t + dx * k]);
    }
    if (!closed) out.push(current[current.length - 1]);
    current = out;
  }
  return current;
}

/**
 * Courbe passant par tous les points ; la longueur des tangentes suit celle du segment (pas de
 * boucle). Sortie en commandes relatives, une décimale, pour un fichier léger.
 */
function smooth(list, closed = true, k = 0.26) {
  const n = list.length;
  const at = (i) => (closed ? list[(i + n) % n] : list[Math.max(0, Math.min(n - 1, i))]);
  const tangent = (i) => {
    const a = at(i - 1);
    const b = at(i + 1);
    const len = Math.hypot(b[0] - a[0], b[1] - a[1]) || 1;
    return [(b[0] - a[0]) / len, (b[1] - a[1]) / len];
  };
  let pen = [r1(list[0][0]), r1(list[0][1])];
  let d = `M${pen[0]},${pen[1]}`;
  const rel = ([x, y]) => `${r1(x - pen[0])},${r1(y - pen[1])}`;
  const segments = closed ? n : n - 1;
  for (let i = 0; i < segments; i += 1) {
    const p1 = at(i);
    const p2 = at(i + 1);
    const len = Math.hypot(p2[0] - p1[0], p2[1] - p1[1]);
    const t1 = tangent(i);
    const t2 = tangent(i + 1);
    const c1 = [p1[0] + t1[0] * len * k, p1[1] + t1[1] * len * k];
    const c2 = [p2[0] - t2[0] * len * k, p2[1] - t2[1] * len * k];
    d += `c${rel(c1)} ${rel(c2)} ${rel(p2)}`;
    pen = [r1(p2[0]), r1(p2[1])];
  }
  return closed ? `${d}z` : d;
}

const area = (list) =>
  list.reduce((sum, [x, y], i) => {
    const [nx, ny] = list[(i + 1) % list.length];
    return sum + (x * ny - nx * y);
  }, 0) / 2;

/** Oriente un contour : sens horaire à l'écran pour une terre, sens inverse pour un lac (trou). */
const oriented = (list, clockwise) => (area(list) > 0 === clockwise ? list : [...list].reverse());

const coast = (list, seed, { shake = 3, ...opts } = {}) =>
  smooth(oriented(fray(jitter(list, shake, seed), { seed, ...opts }), true).map(project));
const lake = (list, seed) => smooth(oriented(fray(jitter(list, 2, seed), { seed, max: 14 }), false).map(project));
const line = (list, seed, opts = {}) =>
  smooth(fray(list, { seed, closed: false, amp: 0.14, max: 22, ...opts }).map(project), false);

/** Îlot : contour irrégulier autour d'un centre, pour les terres trop petites pour un relevé point par point. */
function islet(cx, cy, rx, ry, seed, n = 7) {
  const rand = seeded(seed);
  const turn = rand() * Math.PI;
  const list = [];
  for (let i = 0; i < n; i += 1) {
    const a = (i / n) * Math.PI * 2;
    const r = 0.7 + rand() * 0.55;
    const x = Math.cos(a) * rx * r;
    const y = Math.sin(a) * ry * r;
    list.push([cx + x * Math.cos(turn) - y * Math.sin(turn), cy + x * Math.sin(turn) + y * Math.cos(turn)]);
  }
  return smooth(oriented(list, true).map(project));
}
/** Îlot donné dans le repère du viewBox : [cx, cy, rx, ry]. */
const isletVb = ([cx, cy, rx, ry], seed) => {
  const [x, y] = unproject([cx, cy]);
  return islet(x, y, rx / SX, ry / SY, seed);
};

/* ------------------------------------------------------------------ relevé : Westeros */

// Sens horaire, depuis les terres d'au-delà du Mur (coupées par le cadre).
const WESTEROS = pts(`
  290,-260 420,-270 540,-265 660,-270 800,-260
  776,-96 754,-58 740,-24 732,0

  736,30 748,60 744,92 754,122 770,148 780,178 776,208 792,232 818,244 846,250 872,244 898,252 926,266
  954,282 980,300 1002,322 1014,348 1010,370 992,384 968,392 944,404 922,420 902,438 880,452 862,470
  850,495 842,525 828,548 822,575 830,600

  848,618 872,634 898,646 926,660 952,680 976,704 998,730 1014,758 1020,782 1004,796 980,794 956,786
  930,790 904,802 880,812 860,830 848,852 838,878 820,892 795,896 772,905 752,922 735,940 712,948
  690,942 668,930 650,912

  636,922 624,945 612,968 600,992 590,1015 584,1040 588,1062 598,1085 612,1105 630,1120 655,1128
  682,1126 710,1118 738,1112 765,1108 790,1098 812,1085

  832,1066 852,1046 872,1030 884,1030 882,1044 864,1062 846,1082
  850,1096 872,1086 900,1068 935,1052 962,1044 972,1052 950,1066 918,1082 888,1100 868,1114
  872,1126 898,1118 932,1104 968,1094 1000,1090 1022,1094 1026,1106 1004,1112 970,1118 936,1128 906,1140 886,1152
  890,1164 915,1160 948,1158 976,1166 990,1178 984,1190 962,1188 938,1184 915,1188 898,1198
  902,1210 925,1210 946,1218 954,1232 942,1242 924,1240

  932,1256 950,1266 972,1270 996,1274 1018,1286 1034,1304 1040,1326 1028,1342 1012,1352 1022,1370
  1042,1380 1062,1392 1070,1410 1058,1426 1036,1430 1012,1428 990,1436 972,1448 955,1444 938,1452
  915,1462 892,1460 868,1454 845,1460 820,1470 796,1474 770,1480 745,1486 724,1493

  716,1504 730,1524 750,1542 774,1556 800,1566 828,1572 856,1568 884,1560 912,1556 940,1548 966,1540
  990,1542 1008,1554 1016,1572 1006,1590 984,1598 962,1610 938,1612 914,1620 890,1626 866,1636
  846,1650 828,1668 814,1688 800,1708 786,1728 770,1744 756,1752 748,1758

  752,1776 760,1800 776,1822 798,1840 824,1852 852,1858 880,1856 906,1846 928,1830 946,1810 960,1788
  970,1766 976,1744 984,1726 998,1720 1010,1732 1012,1754 1006,1776 998,1800 986,1824 972,1846
  958,1866 944,1886 932,1906 920,1926 910,1946 900,1966 890,1984 880,2000 872,2014 876,2028

  862,2044 842,2052 820,2062 802,2078 792,2100 800,2120 820,2132 846,2136 872,2140 898,2150 924,2160
  946,2172 968,2190 988,2210 1006,2234 1018,2260 1016,2286 1000,2304 974,2312 946,2316 918,2322
  892,2316 866,2310 840,2304 815,2298 790,2296 764,2302 740,2310 716,2318 692,2326 670,2336 652,2350

  656,2372 668,2388 688,2398 704,2414 700,2436 690,2452 706,2464 730,2466 756,2462 782,2470 806,2482
  830,2490 856,2486 880,2492 904,2504 930,2500 954,2490 978,2492 1002,2480 1026,2466 1050,2456
  1074,2446 1098,2436 1122,2424 1144,2420 1158,2430 1152,2446 1132,2456 1112,2468 1090,2482 1070,2500
  1052,2520 1036,2542 1022,2566 1012,2592 1006,2620 1010,2648 1024,2672 1040,2694 1042,2716 1026,2738
  1008,2760 986,2784 960,2806 930,2826 898,2844 866,2858 834,2870 802,2878 770,2882 738,2878 708,2866
  680,2850 652,2830 626,2806 602,2780 578,2752 556,2724 536,2696 518,2668 502,2644 488,2628

  462,2634 436,2644 410,2650 386,2656 364,2660 348,2646 340,2620 334,2594 324,2568 314,2544
  303,2526 290,2540 280,2562 268,2586 256,2608 244,2630 234,2652 228,2674 214,2688 194,2684 176,2664
  164,2636 158,2604 160,2572 166,2544 172,2522
  182,2498 196,2466 212,2438 228,2412 240,2386 238,2358 228,2332 222,2304 224,2276 232,2248 238,2220
  234,2192 226,2168 244,2156 266,2146 282,2138 264,2128 240,2122 218,2112 208,2090 206,2066 214,2042
  228,2020 242,1996 248,1970 240,1944 224,1922 206,1900 194,1876 180,1852 170,1826 176,1802 190,1782
  202,1762 206,1740 198,1714 192,1688 196,1660 206,1634 216,1610 224,1590 214,1572 200,1558 184,1544 170,1528
  174,1510 190,1498 208,1490 220,1472 228,1450 238,1430 250,1410 266,1392 288,1378 312,1364 338,1352
  362,1338 386,1322 408,1306 428,1290 442,1272

  430,1258 408,1250 384,1252 360,1258 338,1256 322,1244 326,1228 345,1218 370,1212 396,1204 420,1194
  440,1178 454,1158 462,1134 464,1110 458,1090 444,1076

  420,1078 392,1084 364,1090 336,1092 308,1088 282,1080 256,1070 232,1058 208,1046 186,1032 166,1016
  152,998 150,978 162,964 182,960 204,966 226,972 250,972 274,968 298,970 322,976 348,982 374,984
  400,980 426,982 452,988 478,992 504,994 526,988 518,976 494,970 468,962 442,950 418,936 396,920
  376,902 356,886 334,876 308,872 282,874 256,870 232,860 214,844 204,822 198,798 200,774 194,750
  182,728 168,708 158,686 152,662 156,640 170,624 192,616 218,618 244,626 270,632 296,630 318,620
  334,604 338,584 326,566 304,552 280,540 256,530 232,520 208,510 184,498 162,484 146,466 138,446
  144,426 162,414 186,408 210,410 236,408 262,400 288,392 312,380 332,364 346,344 354,320 360,296
  372,272 386,250 396,226 402,200 408,172 416,144 424,114 430,84 432,54 430,26 428,0

  420,-25 405,-50 385,-70 360,-92 330,-112
`);

const OEILDIEU = pts('615,1565 640,1555 665,1565 676,1590 668,1618 645,1630 620,1620 607,1595');

const WESTEROS_ISLANDS = [
  { id: 'ile-aux-ours', name: { fr: 'Île-aux-Ours', en: 'Bear Island' }, shapes: [pts('248,300 268,286 292,282 315,290 325,305 312,320 290,328 265,325 250,315')] },
  { id: 'skagos', name: { fr: 'Skagos', en: 'Skagos' }, shapes: [pts('862,70 880,48 905,40 925,55 940,80 962,95 968,120 950,140 955,165 940,190 915,200 900,225 878,220 870,195 882,170 868,145 872,115 858,95'), pts('815,45 830,35 842,48 835,65 820,62')] },
  { id: 'trois-soeurs', name: { fr: 'les Trois Sœurs', en: 'the Three Sisters' }, shapes: [pts('742,1042 758,1036 770,1046 764,1060 748,1058'), pts('782,1022 800,1018 812,1030 804,1044 788,1040'), pts('772,1070 786,1066 794,1078 784,1088 772,1084')] },
  {
    id: 'iles-de-fer',
    name: { fr: 'îles de Fer', en: 'Iron Islands' },
    shapes: [
      pts('150,1282 172,1272 196,1278 212,1296 208,1320 188,1338 164,1336 146,1318 142,1298'), // Grand Wyk
      pts('122,1240 138,1234 150,1246 142,1260 126,1256'), // Vieux Wyk
      pts('246,1236 262,1230 272,1242 264,1256 248,1252'), // Noirmarées
      pts('228,1296 244,1290 256,1304 250,1324 234,1328 224,1312'), // Orkmont
      pts('272,1292 290,1286 306,1298 310,1322 300,1346 282,1352 270,1334 266,1312'), // Harloi
      pts('168,1366 184,1360 196,1372 188,1386 172,1384'), // Salfalaise
      pts('206,1374 222,1366 238,1374 240,1392 226,1402 210,1396'), // Pyk
    ],
  },
  { id: 'ile-aux-faces', name: { fr: 'Île-aux-Faces', en: 'Isle of Faces' }, shapes: [pts('636,1586 644,1584 648,1592 642,1598 635,1594')] },
  { id: 'belle-ile', name: { fr: 'Belle Île', en: 'Fair Isle' }, shapes: [pts('112,1478 126,1466 142,1472 150,1492 146,1516 132,1530 118,1522 110,1500')] },
  { id: 'peyredragon', name: { fr: 'Peyredragon', en: 'Dragonstone' }, shapes: [pts('1058,1616 1074,1606 1092,1610 1106,1624 1102,1642 1110,1660 1100,1678 1082,1686 1066,1676 1060,1658 1050,1642 1052,1626')] },
  { id: 'lamarck', name: { fr: 'Lamarck', en: 'Driftmark' }, shapes: [pts('990,1648 1006,1640 1022,1646 1030,1660 1022,1676 1006,1684 990,1676 984,1662')] },
  { id: 'ile-de-la-pince', shapes: [pts('1040,1550 1052,1544 1062,1554 1056,1566 1042,1564')] },
  { id: 'torth', name: { fr: 'Torth', en: 'Tarth' }, shapes: [pts('1000,1912 1016,1900 1032,1908 1040,1930 1036,1956 1042,1982 1034,2010 1022,2032 1006,2026 1000,2000 1006,1974 996,1944')] },
  { id: 'estremont', name: { fr: 'Estremont', en: 'Estermont' }, shapes: [pts('1044,2176 1060,2168 1074,2178 1080,2200 1074,2224 1062,2240 1048,2232 1042,2206')] },
  {
    id: 'iles-bouclier',
    name: { fr: 'îles Bouclier', en: 'Shield Islands' },
    shapes: [pts('156,2086 168,2080 178,2090 172,2104 158,2102'), pts('130,2104 144,2098 154,2110 146,2124 132,2120'), pts('154,2128 168,2124 176,2136 168,2150 154,2146'), pts('128,2150 142,2146 152,2158 144,2172 130,2168')],
  },
  {
    id: 'la-treille',
    name: { fr: 'La Treille', en: 'The Arbor' },
    shapes: [
      shift(pts('150,2740 172,2722 200,2716 230,2720 258,2714 286,2720 308,2734 318,2754 306,2772 282,2784 254,2788 226,2784 198,2790 172,2782 154,2766'), 0, 16),
      shift(pts('330,2718 342,2712 352,2722 346,2734 334,2732'), 0, 16),
      shift(pts('346,2750 358,2746 366,2758 358,2768 346,2764'), 0, 16),
    ],
  },
  {
    id: 'degres-de-pierre',
    name: { fr: 'Degrés de Pierre', en: 'Stepstones' },
    shapes: [
      pts('1172,2408 1184,2400 1196,2408 1194,2422 1180,2424'),
      pts('1186,2440 1204,2432 1220,2442 1218,2460 1200,2466 1186,2456'), // Pierre-Sanglante
      pts('1214,2400 1226,2394 1236,2402 1232,2414 1218,2414'),
      pts('1238,2428 1250,2422 1260,2432 1254,2444 1240,2442'),
      pts('1252,2384 1268,2376 1282,2386 1278,2402 1262,2404'), // Gibet-Gris
      pts('1284,2418 1294,2414 1302,2422 1296,2432 1286,2430'),
    ],
  },
];

/* ------------------------------------------------------------------ relevé : Essos (repère du viewBox) */

// Depuis l'angle nord-est (hors cadre) : côte de la mer Grelotte vers l'ouest, la Hache, la baie
// de Lorath, la lagune de Braavos ; puis la mer Étroite vers le sud, la baie de Pentos, la mer de
// Myrth, les Terres Disputées ; la côte de la mer d'Été vers l'est, Volantis, la péninsule de
// Valyria jusqu'à sa cassure ; la baie des Serfs, la presqu'île de Ghiscar ; retour hors cadre.
const ESSOS = vb(`
  2100,360 2040,384 2000,404 1962,428 1930,452 1896,478 1862,498 1826,512 1790,518 1756,508 1726,490
  1700,468 1672,452 1640,442 1606,446 1574,460 1544,474 1512,480 1480,472 1450,464 1420,470 1392,484
  1364,500 1338,514 1314,520 1296,508 1276,494 1254,490 1232,500 1212,514 1190,518 1170,506 1156,488

  1150,466 1146,444 1150,424 1164,410 1182,400 1198,384 1204,364 1196,346 1176,338 1152,340 1128,334
  1104,338 1080,330 1056,326 1034,334 1022,350 1026,370 1040,386 1060,396 1076,408 1084,428 1084,450
  1076,470 1060,486

  1026,498 1000,494 974,500 950,512 926,520 900,520 876,512 852,500 828,496 804,500 782,494 764,484

  752,472 740,460 724,452 708,452 696,460
  706,467 720,464 734,468 744,478 746,492 738,504 724,508 710,504
  698,498 690,506 694,520 704,532

  710,546 708,566 700,584 692,604 686,626 686,646 692,662 704,674 720,681 738,687
  752,698 758,714 752,730 740,741 724,748 708,754 696,766 690,782 692,800 696,816 692,832 686,852 682,874 686,894
  696,908 712,912 730,906 750,900 770,896 790,900 804,912 810,928 804,944 790,954 770,960 750,964
  732,968 720,974 714,985 712,997

  714,1010 720,1024 727,1037 735,1050 746,1064 760,1080 782,1092 806,1098 830,1102

  856,1108 882,1104 908,1110 934,1118 958,1114 976,1120 984,1130 996,1128 1006,1118
  1030,1114 1056,1120 1080,1128 1104,1126 1126,1114 1142,1096 1152,1074 1164,1054 1182,1040 1204,1036
  1224,1044 1240,1060

  1248,1082 1246,1106 1238,1130 1232,1154 1234,1178 1242,1200 1254,1222 1260,1246 1256,1270 1262,1290
  1272,1306
  1286,1296 1290,1276 1300,1258 1318,1248 1338,1256 1356,1244 1376,1250 1396,1258 1414,1246 1430,1252
  1440,1268 1444,1286 1454,1296 1464,1284 1466,1262 1460,1240 1468,1216 1464,1190 1476,1166 1486,1148
  1474,1132 1466,1112 1462,1086

  1466,1060 1478,1036 1498,1016 1524,1004 1552,1000 1580,992 1608,986 1632,988 1646,998 1662,1004
  1668,1022 1662,1042 1668,1062 1676,1080 1672,1100 1678,1124 1672,1150 1664,1176 1656,1200

  1646,1226 1630,1250 1612,1274 1600,1300 1596,1326 1602,1350 1616,1366 1636,1374
  1656,1366 1684,1358 1712,1350 1742,1342 1774,1334 1810,1324 1848,1314 1888,1304 1930,1298 1975,1294
  2040,1290 2100,1286
  2130,1200 2140,1100 2130,1000 2140,900 2130,800 2140,700 2130,600 2140,500 2130,420
`);

const LAC_DAGUE = vb('966,799 972,796 977,802 976,811 970,815 965,808');

const ESSOS_ISLANDS = [
  { id: 'braavos', name: { fr: 'Braavos', en: 'Braavos' }, islets: [[722, 484, 4.5, 3.5], [731, 491, 4, 3], [718, 495, 3, 2.5], [730, 478, 3, 2.5], [712, 486, 2.5, 2]] },
  { id: 'lorath', name: { fr: 'Lorath', en: 'Lorath' }, shapes: [vb('918,466 928,460 938,464 942,476 934,486 922,484 916,476')], islets: [[950, 458, 5, 4], [906, 482, 4, 3]] },
  { id: 'tyrosh', name: { fr: 'Tyrosh', en: 'Tyrosh' }, shapes: [vb('676,972 684,967 692,971 693,980 686,987 677,984')] },
  { id: 'lys', name: { fr: 'Lys', en: 'Lys' }, shapes: [vb('776,1140 786,1134 797,1138 801,1148 795,1158 784,1160 776,1153')], islets: [[808, 1162, 4, 3], [768, 1162, 3, 2.5]] },
  { id: 'ile-des-cedres', name: { fr: 'île des Cèdres', en: 'Isle of Cedars' }, shapes: [vb('1518,1236 1530,1229 1542,1234 1549,1248 1546,1264 1536,1275 1524,1271 1517,1256')] },
  { id: 'elyria', name: { fr: 'Elyria', en: 'Elyria' }, islets: [[1494, 1128, 5, 4]] },
  { id: 'yaros', name: { fr: 'Yaros', en: 'Yaros' }, islets: [[1648, 1140, 4, 6]] },
  { id: 'nouvelle-ghis', name: { fr: 'Nouvelle-Ghis', en: 'New Ghis' }, shapes: [vb('1572,1374 1583,1368 1593,1375 1591,1387 1579,1391 1570,1384')] },
  {
    // Ce que le Fléau a laissé au sud de la mer Fumeuse : une grande île, deux éclats et des îlots.
    id: 'valyria',
    name: { fr: 'Valyria', en: 'Valyria' },
    shapes: [
      vb('1304,1322 1322,1310 1342,1316 1358,1306 1374,1310 1392,1304 1412,1310 1430,1318 1440,1334 1432,1348 1442,1364 1434,1380 1416,1386 1402,1380 1394,1366 1380,1362 1370,1374 1364,1390 1346,1388 1334,1374 1318,1376 1308,1362 1316,1346 1304,1336'),
      vb('1272,1322 1284,1316 1294,1326 1292,1342 1280,1350 1270,1340'),
      vb('1456,1316 1468,1310 1478,1320 1476,1338 1464,1346 1454,1334'),
    ],
    islets: [[1322, 1280, 6, 4], [1350, 1286, 4, 3], [1386, 1284, 7, 4], [1416, 1280, 5, 3.5], [1296, 1300, 3.5, 3], [1444, 1304, 3, 3], [1290, 1368, 5, 4], [1452, 1372, 4, 4]],
  },
];

/* ------------------------------------------------------------------ relevé : fleuves, reliefs */

const RIVERS = [
  { id: 'trident', name: { fr: 'le Trident', en: 'the Trident' }, lines: [pts('640,1478 665,1486 690,1494 716,1504')] },
  { id: 'verfurque', name: { fr: 'la Verfurque', en: 'the Green Fork' }, lines: [pts('545,1150 532,1200 522,1245 535,1290 555,1335 580,1380 605,1425 625,1458 640,1478')] },
  { id: 'bleufurque', name: { fr: 'la Bleufurque', en: 'the Blue Fork' }, lines: [pts('430,1330 465,1355 500,1380 540,1410 580,1440 615,1462 640,1478')] },
  { id: 'ruffurque', name: { fr: 'la Ruffurque', en: 'the Red Fork' }, lines: [pts('350,1590 385,1560 420,1520 455,1485 472,1468 505,1475 540,1490 575,1500 600,1500 625,1492 640,1478'), pts('380,1430 430,1450 472,1468')] },
  { id: 'nera', name: { fr: 'la Néra', en: 'the Blackwater Rush' }, lines: [pts('395,1650 440,1665 480,1690 520,1705 560,1720 600,1735 640,1742 680,1748 720,1755 748,1758'), pts('642,1628 648,1670 655,1710 660,1744')] },
  { id: 'mander', name: { fr: 'la Mander', en: 'the Mander' }, lines: [pts('640,1850 610,1880 575,1915 545,1950 510,1985 480,2020 450,2055 425,2085 395,2115 360,2148 325,2150 300,2142 282,2138'), pts('560,2130 510,2118 465,2100 425,2085')] },
  { id: 'hydromel', name: { fr: "l'Hydromel", en: 'the Honeywine' }, lines: [pts('350,2330 335,2400 318,2470 303,2526')] },
  { id: 'blanchedague', name: { fr: 'la Blanchedague', en: 'the White Knife' }, lines: [pts('610,380 600,440 585,520 580,600 590,680 610,760 630,840 650,912')] },
  { id: 'sang-vert', name: { fr: 'la Sang-vert', en: 'the Greenblood' }, lines: [pts('700,2690 760,2715 840,2735 900,2744 960,2748 1024,2740'), pts('790,2640 815,2690 840,2735')] },
  { id: 'soufre', name: { fr: 'la Soufre', en: 'the Brimstone' }, lines: [pts('640,2610 670,2670 690,2740 702,2800 708,2864')] },
  { id: 'torrentine', name: { fr: 'la Torrentine', en: 'the Torrentine' }, lines: [pts('540,2470 520,2540 500,2600 494,2634')] },
  {
    id: 'rhoyne',
    name: { fr: 'la Rhoyne', en: 'the Rhoyne' },
    lines: [
      vb('846,596 866,624 886,650 902,672 918,696 938,722 956,752 968,786 970,800'),
      vb('972,816 978,860 976,896 980,934 978,972 982,1010 980,1050 984,1090 986,1124'),
      vb('818,708 838,703 858,696 880,684 902,672'), // Petite Rhoyne
      vb('958,566 964,606 960,648 950,688 938,722'), // Noyne
      vb('1100,650 1068,690 1034,730 1000,766 975,800'), // Qhoyne
      vb('1130,880 1090,884 1050,890 1012,888 976,896'), // Lhorulu
      vb('1110,1000 1070,1004 1030,1010 982,1010'), // Selhoru
      vb('1080,1066 1050,1070 1016,1080 984,1090'), // Volaena
    ],
  },
  { id: 'skahazadhan', name: { fr: 'la Skahazadhan', en: 'the Skahazadhan' }, lines: [vb('1820,880 1780,912 1744,940 1712,966 1684,990 1654,1010')] },
  { id: 'ver', name: { fr: 'le Ver', en: 'the Worm' }, lines: [vb('1722,1186 1690,1196 1656,1200')] },
  { id: 'sarne', name: { fr: 'la Sarne', en: 'the Sarne' }, lines: [vb('1480,700 1440,660 1400,620 1364,580 1334,548 1314,520')] },
];

const RANGES = [
  { id: 'le-mur', name: { fr: 'le Mur', en: 'the Wall' }, lines: [pts('428,0 480,2 530,-1 580,1 630,-1 680,1 732,0')], straight: true },
  { id: 'montagnes-du-nord', lines: [pts('450,30 446,90 436,160 426,230 410,300 396,360')] },
  { id: 'montagnes-de-la-lune', name: { fr: 'montagnes de la Lune', en: 'Mountains of the Moon' }, lines: [pts('690,1178 715,1215 735,1260 746,1305 752,1350 766,1395 790,1430'), pts('715,1215 760,1202 810,1192 860,1196')] },
  { id: 'collines-de-l-ouest', lines: [pts('310,1440 330,1500 345,1560 350,1620 340,1690')] },
  { id: 'montagnes-rouges', name: { fr: 'montagnes Rouges', en: 'Red Mountains' }, lines: [pts('640,2345 610,2335 580,2345 550,2370 525,2410 505,2460 490,2520 480,2580'), pts('610,2335 625,2285 640,2240')] },
  { id: 'collines-de-norvos', name: { fr: 'collines de Norvos', en: 'Hills of Norvos' }, lines: [vb('905,560 930,548 960,540 990,548 1020,540')] },
  { id: 'collines-de-velours', name: { fr: 'collines de Velours', en: 'Velvet Hills' }, lines: [vb('770,640 790,662 806,690 812,720')] },
  { id: 'quatorze-flammes', name: { fr: 'les Quatorze Flammes', en: 'the Fourteen Flames' }, lines: [vb('1250,1094 1282,1086 1316,1092 1350,1084 1384,1090 1418,1084 1456,1092')] },
  { id: 'monts-de-la-baie', lines: [vb('1716,950 1722,1000 1714,1050 1722,1100 1716,1150 1708,1180')] },
];

/* ------------------------------------------------------------------ noms (repère du viewBox) */

const label = (id, fr, en, x, y) => ({ id, name: { fr, en }, at: [x, y] });

const SEAS = [
  label('mer-du-crepuscule', 'mer du Crépuscule', 'Sunset Sea', 95, 800),
  label('mer-grelotte', 'mer Grelotte', 'Shivering Sea', 900, 300),
  label('mer-etroite', 'mer Étroite', 'Narrow Sea', 648, 560),
  label('mer-d-ete', "mer d'Été", 'Summer Sea', 1010, 1270),
  label('baie-des-glaces', 'baie des Glaces', 'Bay of Ice', 232, 116),
  label('baie-des-phoques', 'baie des Phoques', 'Bay of Seals', 632, 104),
  label('la-morsure', 'la Morsure', 'the Bite', 440, 444),
  label('baie-du-fer-ne', 'baie du Fer-né', "Ironman's Bay", 240, 506),
  label('baie-des-crabes', 'baie des Crabes', 'Bay of Crabs', 508, 644),
  label('baie-de-la-nera', 'baie de la Néra', 'Blackwater Bay', 512, 772),
  label('baie-des-naufrageurs', 'baie des Naufrageurs', 'Shipbreaker Bay', 586, 882),
  label('mer-de-dorne', 'mer de Dorne', 'Sea of Dorne', 508, 1000),
  label('baie-des-serfs', 'baie des Serfs', "Slaver's Bay", 1566, 1080),
  label('mer-fumeuse', 'mer Fumeuse', 'Smoking Sea', 1372, 1284),
];

const REGIONS = [
  label('le-nord', 'le Nord', 'the North', 322, 214),
  label('le-neck', 'le Neck', 'the Neck', 364, 480),
  label('le-val', "le Val d'Arryn", 'the Vale of Arryn', 524, 598),
  label('le-conflans', 'le Conflans', 'the Riverlands', 372, 596),
  label('terres-de-l-ouest', "terres de l'Ouest", 'the Westerlands', 262, 706),
  label('terres-de-la-couronne', 'terres de la Couronne', 'the Crownlands', 478, 800),
  label('le-bief', 'le Bief', 'the Reach', 313, 840),
  label('terres-de-l-orage', "terres de l'Orage", 'the Stormlands', 486, 928),
  label('dorne', 'Dorne', 'Dorne', 486, 1080),
  label('andalos', 'Andalos', 'Andalos', 760, 610),
  label('terres-disputees', 'Terres Disputées', 'Disputed Lands', 800, 1040),
  label('contrees-de-l-ete-constant', "contrées de l'Été constant", 'Lands of the Long Summer', 1356, 1160),
  label('peninsule-de-valyria', 'péninsule de Valyria', 'Valyrian peninsula', 1358, 1216),
  label('mer-dothrak', 'mer Dothrak', 'Dothraki Sea', 1500, 720),
  label('lhazar', 'Lhazar', 'Lhazar', 1840, 1020),
  label('ghiscar', 'Ghiscar', 'Ghiscar', 1700, 1290),
  label('desert-rouge', 'désert Rouge', 'Red Waste', 1900, 1200),
];

/* ------------------------------------------------------------------ construction de map.json */

function trace() {
  const islandPath = (entry) => {
    const parts = [];
    for (const [i, shape] of (entry.shapes ?? []).entries()) parts.push(coast(shape, `${entry.id}-${i}`, { shake: 1.5, amp: 0.18, max: 9 }));
    for (const [i, spec] of (entry.islets ?? []).entries()) parts.push(isletVb(spec, `${entry.id}-i${i}`));
    return parts.join('');
  };
  const item = (entry, d) => (entry.name ? { id: entry.id, name: entry.name, d } : { id: entry.id, d });
  const linePath = (entry) =>
    entry.lines.map((l, i) => (entry.straight ? smooth(l.map(project), false) : line(l, `${entry.id}-${i}`))).join('');

  const map = {
    viewBox: VIEW,
    lands: [
      { id: 'westeros', name: { fr: 'Westeros', en: 'Westeros' }, d: coast(WESTEROS, 'westeros', { max: 25, fine: 13 }) + lake(OEILDIEU, 'oeildieu') },
      { id: 'essos', name: { fr: 'Essos', en: 'Essos' }, d: coast(ESSOS, 'essos', { max: 25, fine: 13 }) + lake(LAC_DAGUE, 'lac-dague') },
    ],
    islands: [...WESTEROS_ISLANDS, ...ESSOS_ISLANDS].map((e) => item(e, islandPath(e))),
    rivers: RIVERS.map((e) => item(e, linePath(e))),
    ranges: RANGES.map((e) => item(e, linePath(e))),
    seas: SEAS,
    regions: REGIONS,
  };
  fs.mkdirSync(path.dirname(MAP_FILE), { recursive: true });
  fs.writeFileSync(MAP_FILE, `${JSON.stringify({ schema: 1, generatedBy: 'agent-07', items: [map] }, null, 1)}\n`, 'utf8');
  const count = (d) => (d.match(/c/g) ?? []).length;
  console.log(
    `map.json retracé : relevé de ${WESTEROS.length} points pour Westeros (${count(map.lands[0].d)} courbes, lac compris), ` +
      `${ESSOS.length} pour Essos (${count(map.lands[1].d)} courbes), ${map.islands.length} îles ou archipels.`,
  );
}

/* ------------------------------------------------------------------ planche de contrôle */

const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

// Position des étiquettes de lieux, pour la planche seulement : [dx, dy, ancre].
const W = (dy = 3.5) => [-6, dy, 'end'];
const N = [0, -7, 'middle'];
const S = [0, 14, 'middle'];
const LABELS = {
  'port-real': [-6, 9, 'end'],
  fossedragon: [-5, -3, 'end'],
  'repos-du-freux': [-5, -4, 'end'],
  sombreval: W(),
  lamarck: N,
  'le-gosier': [5, 10, 'start'],
  blackwater: N,
  herberouge: W(),
  'champ-de-feu': W(),
  'castral-roc': W(0),
  accalmie: W(),
  'tour-de-la-joie': W(),
  tyrosh: W(),
  'degres-de-pierre': S,
  valyria: S,
  'quatorze-flammes': N,
  'le-mur': N,
  'le-trident': [5, -4, 'start'],
};

function sheet() {
  const map = JSON.parse(fs.readFileSync(MAP_FILE, 'utf8')).items[0];
  const places = !flag('nu') && fs.existsSync(PLACES_FILE) ? JSON.parse(fs.readFileSync(PLACES_FILE, 'utf8')).items : [];
  const lang = flag('en') ? 'en' : 'fr';
  const crop = option('crop');
  const view = crop ? crop.split(',').map(Number) : map.viewBox;
  const zoom = map.viewBox[2] / view[2];
  const u = (n) => r1(n / Math.sqrt(zoom)); // les traits et les lettres grossissent moins vite que le cadre

  const landD = map.lands.map((l) => l.d).join('') + map.islands.map((l) => l.d).join('');
  const out = [];
  out.push(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="${view.join(' ')}" font-family="Georgia, 'Times New Roman', serif">`);
  out.push(`<clipPath id="cadre"><rect x="${view[0]}" y="${view[1]}" width="${view[2]}" height="${view[3]}"/></clipPath>`);
  out.push(`<g clip-path="url(#cadre)">`);
  out.push(`<rect x="${view[0]}" y="${view[1]}" width="${view[2]}" height="${view[3]}" fill="#1d1614"/>`);
  out.push(`<g fill="none" stroke="#e9dcc0" stroke-linejoin="round">`);
  out.push(`<path d="${landD}" stroke-width="${u(14)}" stroke-opacity="0.035"/>`);
  out.push(`<path d="${landD}" stroke-width="${u(6)}" stroke-opacity="0.05"/>`);
  out.push(`</g>`);
  out.push(`<path d="${landD}" fill="#e3d6b8" stroke="#8d7a58" stroke-width="${u(0.8)}" stroke-linejoin="round"/>`);
  out.push(`<g fill="none" stroke="#3b4a52" stroke-linecap="round" stroke-linejoin="round" stroke-width="${u(1.2)}">`);
  for (const river of map.rivers) out.push(`<path d="${river.d}"/>`);
  out.push(`</g>`);
  out.push(`<g fill="none" stroke="#8a6a3c" stroke-linecap="round" stroke-width="${u(3.2)}" stroke-dasharray="0.1 ${u(6)}">`);
  for (const range of map.ranges) {
    if (range.id === 'le-mur') out.push(`<path d="${range.d}" stroke="#f6f1e6" stroke-width="${u(2.4)}" stroke-dasharray="none"/>`);
    else out.push(`<path d="${range.d}"/>`);
  }
  out.push(`</g>`);
  out.push(`<g fill="#a89a84" font-style="italic" font-size="${u(17)}" text-anchor="middle">`);
  for (const s of map.seas) out.push(`<text x="${s.at[0]}" y="${s.at[1]}">${esc(s.name[lang])}</text>`);
  out.push(`</g>`);
  out.push(`<g fill="#8b7755" font-size="${u(15)}" text-anchor="middle" font-style="italic">`);
  for (const region of map.regions) out.push(`<text x="${region.at[0]}" y="${region.at[1]}">${esc(region.name[lang])}</text>`);
  out.push(`</g>`);
  out.push(`<g font-size="${u(11.5)}" fill="#2a1d18">`);
  for (const place of places) {
    const [x, y] = place.coord;
    const [dx, dy, anchor] = LABELS[place.id] ?? [6, 3.5, 'start'];
    out.push(`<circle cx="${x}" cy="${y}" r="${u(3)}" fill="#a3271f" stroke="#2a1d18" stroke-width="${u(0.7)}"/>`);
    out.push(`<text x="${r1(x + dx / Math.sqrt(zoom))}" y="${r1(y + dy / Math.sqrt(zoom))}" text-anchor="${anchor}" paint-order="stroke" stroke="#e3d6b8" stroke-width="${u(2.6)}" stroke-linejoin="round">${esc(flag('ids') ? place.id : place.name[lang])}</text>`);
  }
  out.push(`</g>`);
  out.push(`</g>`);
  out.push(`</svg>`);
  fs.mkdirSync(path.dirname(SHEET_FILE), { recursive: true });
  fs.writeFileSync(SHEET_FILE, `${out.join('\n')}\n`, 'utf8');
  console.log(`Planche écrite : ${path.relative(ROOT, SHEET_FILE)} (${places.length} lieux)`);
}

/* ------------------------------------------------------------------ contrôle des coordonnées */

// Lieux qui doivent tomber dans l'eau (baie, chenal, lac) ; Braavos est une lagune, l'un ou l'autre.
const IN_WATER = new Set(['le-gosier', 'blackwater', 'oeildieu']);
const EITHER = new Set(['braavos']);

/** Sommets d'un tracé produit par `smooth` : un polygone par sous-tracé (les courbes sont réduites à leurs extrémités). */
function polygons(d) {
  return d
    .split('M')
    .filter(Boolean)
    .map((sub) => {
      const [start, ...curves] = sub.replace(/z$/, '').split('c');
      let [x, y] = start.split(',').map(Number);
      const ring = [[x, y]];
      for (const curve of curves) {
        const [dx, dy] = curve.trim().split(' ')[2].split(',').map(Number);
        x += dx;
        y += dy;
        ring.push([x, y]);
      }
      return ring;
    });
}

const inside = ([px, py], ring) => {
  let hit = false;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i, i += 1) {
    const [xi, yi] = ring[i];
    const [xj, yj] = ring[j];
    if (yi > py !== yj > py && px < ((xj - xi) * (py - yi)) / (yj - yi) + xi) hit = !hit;
  }
  return hit;
};

/** Vérifie que chaque lieu tombe du bon côté de la côte : un lac compte comme de l'eau (parité des contours). */
function check() {
  const map = JSON.parse(fs.readFileSync(MAP_FILE, 'utf8')).items[0];
  const places = JSON.parse(fs.readFileSync(PLACES_FILE, 'utf8')).items;
  const rings = [...map.lands, ...map.islands].flatMap((l) => polygons(l.d));
  let faults = 0;
  for (const place of places) {
    const onLand = rings.filter((ring) => inside(place.coord, ring)).length % 2 === 1;
    const [x, y, w, h] = map.viewBox;
    const inFrame = place.coord[0] >= x && place.coord[0] <= x + w && place.coord[1] >= y && place.coord[1] <= y + h;
    const ok = inFrame && (EITHER.has(place.id) || onLand !== IN_WATER.has(place.id));
    if (!ok) {
      faults += 1;
      console.log(`  ${place.id} : ${inFrame ? (onLand ? 'sur la terre, attendu dans l’eau' : 'dans l’eau, attendu sur la terre') : 'hors du cadre'}`);
    }
  }
  console.log(`Contrôle des coordonnées : ${places.length - faults} lieux sur ${places.length} du bon côté de la côte.`);
}

if (flag('trace')) trace();
sheet();
if (flag('check')) check();
