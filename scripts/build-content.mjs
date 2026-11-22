// Chaîne des contenus : content/ (source de vérité) -> src/content/generated/*.json
//
// Usage : node scripts/build-content.mjs [--check] [--content=<dossier>] [--out=<dossier>] [--qa=<dossier>]
//   --check   : valide et affiche le résumé sans rien écrire.
//   --content : lit un autre dossier que content/ (jeux d'essai).
//   --out     : écrit les modules ailleurs que dans src/content/generated/.
//   --qa      : écrit les deux rapports ailleurs que dans reports/qa/.
//
// Ce que fait le script, dans l'ordre :
//   1. lit les jeux existants (champs suffixés Fr/En) et les convertit vers les formes de
//      src/core/content/types.ts (Localized { fr, en, hv? }) ;
//   2. fusionne content/translations/*.en.json ; quand l'anglais manque, en = fr et le champ
//      est consigné dans reports/qa/content-missing-en.json (au format du fichier attendu) ;
//   3. résout les noms français (personnes, dragons, lieux, dragonniers) en EntityRef avec id ;
//   4. lit les jeux nouveaux s'ils existent (récits, biographies, guerres, lieux, carte,
//      apparences des dragons, langue, parcours, chaînes d'interface) ;
//   5. valide : formes, identifiants uniques, références, Localized complets, années ;
//   6. écrit les douze modules JSON et le rapport reports/qa/content-build.md.
//
// Erreur bloquante : code de sortie 1, rien n'est écrit dans src/content/generated/.
// Aucune dépendance : Node 24 suffit. Sortie déterministe (aucune date, ordre des sources).

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const option = (name, fallback) => {
  const given = process.argv.find((arg) => arg.startsWith(`--${name}=`));
  return given ? path.resolve(given.slice(name.length + 3)) : fallback;
};
const CONTENT = option('content', path.join(ROOT, 'content'));
const OUT = option('out', path.join(ROOT, 'src', 'content', 'generated'));
const QA = option('qa', path.join(ROOT, 'reports', 'qa'));
const CHECK_ONLY = process.argv.includes('--check');

/* ------------------------------------------------------------------ Tables éditoriales */

/**
 * Noms employés par la chronologie ou le registre des dragons qui désignent une personne
 * de la généalogie sous une autre forme que son `nameFr`. `only` restreint l'alias à un
 * contexte (identifiant de période, ou « dragon:<id> ») quand le nom nu est ambigu.
 */
const PERSON_ALIASES = [
  { name: 'Elaena Targaryen', id: 'elaena-peyredragon', only: ['p1', 'p2'] },
  { name: 'Aerys Targaryen (seigneur de Peyredragon)', id: 'aerys-peyredragon' },
  { name: 'Baelon Targaryen (seigneur de Peyredragon)', id: 'baelon-peyredragon' },
  { name: 'Aerion Targaryen', id: 'aerion-peyredragon', only: ['p2', 'p3'] },
  { name: 'Rhaenys Targaryen (sœur d’Aegon Ier)', id: 'rhaenys' },
  { name: 'Baelon Targaryen', id: 'baelon-fils-jaehaerys-i', only: ['p4', 'p5', 'dragon:vhagar'] },
  { name: 'Rhaena Targaryen (sœur de Baelor)', id: 'rhaena-fille-aegon-iii' },
  { name: 'Elaena Targaryen (sœur de Baelor)', id: 'elaena-fille-aegon-iii' },
  { name: 'Aemon le Chevalier-Dragon', id: 'aemon-fils-viserys-ii' },
  { name: 'Daemon Feunoyr', id: 'daemon-i-blackfyre', only: ['p6'] },
  { name: 'Aegor Rivers (Aigracier)', id: 'aegor-rivers' },
  { name: 'Brynden Rivers (Freuxsanglant)', id: 'brynden-rivers' },
  { name: 'Mariah Martell', id: 'myriah-martell' },
  { name: 'Baelor Targaryen (Briselance)', id: 'baelor-fils-daeron-ii' },
  { name: 'Aerion Targaryen (le Flamboyant)', id: 'aerion-fils-maekar-i' },
  { name: 'Haegon Feunoyr', id: 'haegon-blackfyre' },
  { name: 'Aemon Targaryen (mestre)', id: 'aemon-fils-maekar-i' },
  { name: 'Duncan Targaryen (prince des Libellules)', id: 'duncan' },
  { name: 'Rhaella Targaryen', id: 'rhaella-fille-jaehaerys-ii', only: ['p6', 'p7', 'p8'] },
  { name: 'Robert Baratheon', id: 'robert-i-baratheon' },
];

/**
 * Forme anglaise des personnes citées qui ne figurent pas dans la généalogie et dont le
 * nom français diffère du nom d'origine. Tout nom absent de cette table est tenu pour
 * identique dans les deux langues (Otto Hightower, Criston Cole…).
 */
const PERSON_NAME_EN = {
  'Garin le Grand': 'Garin the Great',
  'Harren le Noir': 'Harren the Black',
  'Harren le Rouge': 'Harren the Red',
  'Mern IX Jardinier': 'Mern IX Gardener',
  'Loren Ier Lannister': 'Loren I Lannister',
  'Hugh le Marteau': 'Hugh Hammer',
  'Ulf le Blanc': 'Ulf the White',
  'Orties (Nettles)': 'Nettles',
  'le Berger': 'the Shepherd',
  'Benjicot Nerbosc': 'Benjicot Blackwood',
  'Gaemon Cheveux-Pâles': 'Gaemon Palehair',
  'Duncan le Grand': 'Duncan the Tall',
  'Maelys Feunoyr': 'Maelys Blackfyre',
  'Aegon (« Griff le Jeune »)': 'Aegon (“Young Griff”)',
};

/** Indices d'un nom resté en français alors qu'aucune forme anglaise n'est connue. */
const FRENCH_NAME_HINT = /(^| )(le|la|les|de|du|des) |\bIer\b|Feunoyr|Nerbosc|Jardinier|«/;

/** Noms de lieux de la chronologie qui diffèrent du `name.fr` du registre des lieux. */
const PLACE_ALIASES = {
  // 'nom dans la chronologie': 'identifiant de lieu'
};

/**
 * Vocabulaire de certitude de la généalogie -> niveaux de fiabilité du musée.
 * « conteste » : un autre père est nommé par une partie des témoins -> récits contradictoires.
 * « incertain » : relation rapportée par la rumeur -> tradition ou rumeur (niveau « legende »).
 * Voir le rapport : le contrat gagnerait à garder les trois valeurs d'origine.
 */
const CERTAINTY_TO_RELIABILITY = { etabli: 'etabli', conteste: 'contradictoire', incertain: 'legende' };

/** `dateCertainty` de la chronologie -> contrat (qui n'a pas de valeur « contestee »). */
const DATE_CERTAINTY = { exacte: 'exacte', approximative: 'approximative', inconnue: 'inconnue', contestee: 'approximative' };

/** Thème par défaut des entrées du lexique d'origine, d'après le préfixe de l'identifiant. */
const THEME_BY_PREFIX = {
  nav: 'interface',
  action: 'interface',
  label: 'interface',
  phrase: 'formules',
  text: 'formules',
  title: 'formules',
  period: 'temps',
  name: 'noms',
};

/**
 * Teinte de corps par clé de couleur, pour l'apparence par défaut (looks.json absent).
 * Valeurs neutres et mates : la planche réelle vient de content/dragons/looks.json.
 */
const BODY_BY_COLOR_KEY = {
  noir: '#1d1819',
  argent: '#b4b7ba',
  bleu: '#5a7896',
  bronze: '#8a6a3c',
  rouge: '#8c211d',
  jaune: '#c2a136',
  gris: '#959794',
  or: '#c39b47',
  vert: '#506a47',
  brun: '#6a5545',
  rose: '#d3a5a3',
  creme: '#ddd1b3',
};
const BODY_UNDESCRIBED = '#5c5652';
const FLAME_DEFAULT = '#d2702a';

const RELIABILITY = ['etabli', 'recit-unique', 'contradictoire', 'legende', 'adaptation'];
const CONTINUITY = ['livres', 'adaptation'];
const DATE_CERT = ['exacte', 'approximative', 'inconnue'];
const HV_STATUS = ['atteste', 'derive', 'editorial', 'adaptation'];
const PLACE_KIND = ['cite', 'forteresse', 'ile', 'region', 'ruine', 'champ-de-bataille', 'cite-libre'];
const TONES = ['noir', 'vert', 'rouge', 'or', 'neutre'];
const SOURCE_TYPES = ['livre', 'nouvelle', 'encyclopedie-univers', 'serie', 'outil-de-verification'];
const LEGITIMACY = ['legitime', 'batard', 'legitime-par-decret'];
const UNION_TYPES = ['mariage', 'liaison', 'fiancailles'];

const STATIC_ROUTES = new Set([
  '/', '/chroniques', '/lignee', '/personnages', '/dragons', '/guerres', '/lieux', '/langue',
  '/langue/lexique', '/langue/grammaire', '/langue/expressions', '/sources', '/apprendre', '/a-propos',
]);

/* ------------------------------------------------------------------ Diagnostics */

const errors = [];
/** Vrai quand tous les jeux sont convertis : le résumé et le rapport peuvent être produits. */
let ready = false;
/** @type {Map<string, string[]>} */
const warnings = new Map();
const notes = [];

function error(message) {
  errors.push(message);
}
function warn(category, message) {
  if (!warnings.has(category)) warnings.set(category, []);
  warnings.get(category).push(message);
}
function note(message) {
  notes.push(message);
}

/* ------------------------------------------------------------------ Outils */

const isStr = (v) => typeof v === 'string' && v.trim() !== '';
const isObj = (v) => v !== null && typeof v === 'object' && !Array.isArray(v);
/** Chemin lisible d'un fichier de contenu, toujours écrit « content/… ». */
const rel = (file) => `content/${path.relative(CONTENT, file).split(path.sep).join('/')}`;

/** Minuscules, sans diacritiques, apostrophes et espaces unifiés : clé de comparaison des noms. */
function norm(text) {
  return String(text)
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/œ/g, 'oe')
    .replace(/æ/g, 'ae')
    .replace(/[’‘`´]/g, "'")
    .replace(/[«»“”"]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}
const stripArticle = (key) => key.replace(/^(le |la |les |l')/, '');
const stripParens = (key) => key.replace(/\s*\([^)]*\)\s*/g, ' ').replace(/\s+/g, ' ').trim();

function readJson(file, { required = false } = {}) {
  if (!fs.existsSync(file)) {
    if (required) error(`${rel(file)} : fichier requis introuvable.`);
    return null;
  }
  try {
    return JSON.parse(fs.readFileSync(file, 'utf8').replace(/^﻿/, ''));
  } catch (cause) {
    error(`${rel(file)} : JSON illisible (${cause.message}).`);
    return null;
  }
}

function listFiles(dir, pattern) {
  const full = path.join(CONTENT, dir);
  if (!fs.existsSync(full)) return [];
  return fs
    .readdirSync(full)
    .filter((name) => pattern.test(name))
    .sort()
    .map((name) => path.join(full, name));
}

/** Lit l'enveloppe { schema, generatedBy, items: [...] } d'un jeu nouveau. */
function readEnvelope(file) {
  const json = readJson(file);
  if (json === null) return null;
  if (Array.isArray(json)) {
    warn('forme', `${rel(file)} : tableau nu, l'enveloppe { schema, generatedBy, items } est attendue.`);
    return { items: json };
  }
  if (!isObj(json) || !Array.isArray(json.items)) {
    error(`${rel(file)} : enveloppe invalide, « items » doit être un tableau.`);
    return null;
  }
  return json;
}

/** Enlève les clés dont la valeur est `undefined` (champs facultatifs absents). */
function compact(object) {
  const out = {};
  for (const [key, value] of Object.entries(object)) if (value !== undefined) out[key] = value;
  return out;
}

function uniqueIds(items, label, key = 'id') {
  const seen = new Set();
  for (const item of items) {
    const id = item?.[key];
    if (!isStr(id)) continue;
    if (seen.has(id)) error(`${label} : identifiant en double « ${id} ».`);
    seen.add(id);
  }
  return seen;
}

const SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
function checkSlugs(items, label) {
  for (const item of items) {
    if (isStr(item.id) && !SLUG.test(item.id)) {
      warn('identifiants', `${label} « ${item.id} » : identifiant peu sûr dans une adresse (attendu : minuscules, chiffres, tirets).`);
    }
  }
}

function frYear(year) {
  return year < 0 ? `${-year} av. C.` : `${year} apr. C.`;
}
function enYear(year) {
  return year < 0 ? `${-year} BC` : `${year} AC`;
}
/** Intervalle d'années lisible dans les deux langues, ou `undefined` si rien n'est connu. */
function spanHint(from, to) {
  if (from === null && to === null) return undefined;
  if (from === null) return { fr: `jusqu'en ${frYear(to)}`, en: `until ${enYear(to)}` };
  if (to === null) return { fr: `à partir de ${frYear(from)}`, en: `from ${enYear(from)}` };
  if (from === to) return { fr: frYear(from), en: enYear(from) };
  // Même ère : « 41–48 apr. C. », comme les libellés de la chronologie.
  if (from < 0 === to < 0) {
    return { fr: `${Math.abs(from)}–${frYear(to)}`, en: `${Math.abs(from)}–${enYear(to)}` };
  }
  return { fr: `${frYear(from)} – ${frYear(to)}`, en: `${enYear(from)} – ${enYear(to)}` };
}

/* ------------------------------------------------------------------ Traductions anglaises */

const translationCache = new Map();
const translationUsed = new Set();
/** Champs sans anglais, au format exact du fichier de traduction attendu. */
const missingEn = {};
let missingEnCount = 0;
/** Champs dont seule la forme anglaise existe (le français est à fournir à la source). */
const missingFr = [];

function translationItems(file) {
  if (!translationCache.has(file)) {
    const json = readJson(path.join(CONTENT, 'translations', file));
    translationCache.set(file, { present: json !== null, items: isObj(json?.items) ? json.items : {} });
    if (json !== null && !isObj(json.items)) error(`content/translations/${file} : « items » doit être un objet.`);
  }
  return translationCache.get(file).items;
}

/**
 * Texte anglais d'un champ français : anglais d'origine s'il existe, sinon traduction
 * fournie, sinon repli sur le français (et consignation dans le rapport des manques).
 */
function english(file, keyPath, field, fr, native) {
  if (isStr(native)) return native;
  let node = translationItems(file);
  for (const key of keyPath) node = isObj(node) ? node[key] : undefined;
  translationUsed.add([file, ...keyPath, field].join('\u0000'));
  const translated = isObj(node) ? node[field] : undefined;
  if (isStr(translated)) return translated;
  let slot = (missingEn[file] ??= {});
  for (const key of keyPath) slot = slot[key] ??= {};
  if (!(field in slot)) missingEnCount += 1;
  slot[field] = fr;
  return fr;
}

/** Localized à partir d'un champ français et, s'il existe, de son pendant anglais d'origine. */
function L(file, keyPath, object, frField, enField) {
  const fr = object[frField];
  if (!isStr(fr)) return undefined;
  return { fr, en: english(file, keyPath, frField, fr, enField ? object[enField] : undefined) };
}

/** Localized quand l'une des deux langues peut manquer à la source (épithètes, surnoms). */
function pairOrFallback(sourceFile, id, frField, fr, en) {
  if (!isStr(fr) && !isStr(en)) return undefined;
  if (isStr(fr) && isStr(en)) return { fr, en };
  if (isStr(en)) {
    missingFr.push({ file: sourceFile, id, field: frField, en });
    return { fr: en, en };
  }
  return { fr, en: fr };
}

function reportUnusedTranslations() {
  for (const [file, { items }] of translationCache) {
    const walk = (node, trail) => {
      for (const [key, value] of Object.entries(node)) {
        if (isObj(value)) walk(value, [...trail, key]);
        else if (!translationUsed.has([file, ...trail, key].join('\u0000'))) {
          warn('traductions', `content/translations/${file} : « ${[...trail, key].join(' > ')} » ne correspond à aucun champ à traduire.`);
        }
      }
    };
    walk(items, []);
  }
}

/* ------------------------------------------------------------------ Validation de forme */

const opt = (schema) => ({ opt: schema });
const arr = (schema) => ({ arr: schema });
const obj = (fields) => ({ obj: fields });
const tuple = (...schemas) => ({ tuple: schemas });
const oneOf = (values) => ({ oneOf: values });

const str = (v) => (isStr(v) ? null : 'chaîne non vide attendue');
const num = (v) => (Number.isFinite(v) ? null : 'nombre attendu');
const int = (v) => (Number.isInteger(v) ? null : 'entier attendu');
const bool = (v) => (typeof v === 'boolean' ? null : 'booléen attendu');
const year = (v) => (v === null || Number.isInteger(v) ? null : 'année entière ou null attendue');
const loc = (v) => {
  if (!isObj(v)) return 'texte traduit { fr, en } attendu';
  if (!isStr(v.fr)) return 'texte français manquant';
  if (!isStr(v.en)) return 'texte anglais manquant';
  if ('hv' in v && !isStr(v.hv)) return 'forme valyrienne vide';
  const extra = Object.keys(v).filter((k) => !['fr', 'en', 'hv'].includes(k));
  return extra.length ? `clés inattendues dans un texte traduit : ${extra.join(', ')}` : null;
};

const sourceRef = obj({ id: str, locator: opt(str) });
const entityRef = obj({ id: opt(str), name: loc });
const essaySection = obj({ id: str, heading: loc, body: loc, sources: arr(sourceRef) });

const SHAPES = {
  essay: obj({ periodId: str, sections: arr(essaySection) }),
  biography: obj({
    personId: str,
    titles: arr(loc),
    lead: loc,
    sections: arr(essaySection),
    dragonIds: arr(str),
    eventIds: arr(str),
    warIds: arr(str),
    disputed: opt(loc),
    adaptation: opt(loc),
    sources: arr(sourceRef),
  }),
  war: obj({
    id: str,
    title: loc,
    hvStatus: opt(oneOf(HV_STATUS)),
    from: int,
    to: int,
    periodId: str,
    summary: loc,
    causes: loc,
    belligerents: arr(obj({ id: str, name: loc, tone: oneOf(TONES), leaders: arr(entityRef) })),
    battles: arr(
      obj({
        id: str,
        warId: str,
        name: loc,
        year,
        dateCertainty: oneOf(DATE_CERT),
        placeId: opt(str),
        placeName: loc,
        sides: tuple(str, str),
        victor: str,
        dragons: arr(obj({ dragonId: str, side: str, fate: loc })),
        summary: loc,
        outcome: loc,
        losses: opt(loc),
        reliability: oneOf(RELIABILITY),
        sources: arr(sourceRef),
      }),
    ),
    consequences: loc,
    eventIds: arr(str),
    continuity: oneOf(CONTINUITY),
    reliability: oneOf(RELIABILITY),
    sources: arr(sourceRef),
  }),
  place: obj({
    id: str,
    name: loc,
    hvStatus: opt(oneOf(HV_STATUS)),
    kind: oneOf(PLACE_KIND),
    region: loc,
    coord: tuple(num, num),
    description: loc,
    role: loc,
    eventIds: arr(str),
    battleIds: arr(str),
    sources: arr(sourceRef),
  }),
  map: obj({
    viewBox: tuple(num, num, num, num),
    lands: arr(obj({ id: str, name: loc, d: str })),
    islands: arr(obj({ id: str, name: opt(loc), d: str })),
    rivers: arr(obj({ id: str, name: opt(loc), d: str })),
    ranges: arr(obj({ id: str, name: opt(loc), d: str })),
    seas: arr(obj({ id: str, name: loc, at: tuple(num, num) })),
    regions: arr(obj({ id: str, name: loc, at: tuple(num, num) })),
  }),
  look: obj({
    dragonId: str,
    look: obj({
      span: num,
      neck: num,
      tail: num,
      horns: int,
      body: str,
      wing: str,
      crest: str,
      flame: str,
      attested: obj({ body: bool, wing: bool, crest: bool, flame: bool, size: bool }),
    }),
    hatched: opt(year),
    sizeNote: opt(loc),
    colorNote: opt(loc),
  }),
  lexiconEntry: obj({
    id: str,
    hv: str,
    fr: str,
    en: str,
    status: oneOf(HV_STATUS),
    theme: str,
    grammar: opt(loc),
    notes: loc,
    refs: arr(str),
    verified: bool,
  }),
  phrase: obj({
    id: str,
    hv: str,
    fr: str,
    en: str,
    literal: opt(loc),
    status: oneOf(HV_STATUS),
    context: loc,
    refs: arr(str),
  }),
  grammarLesson: obj({
    id: str,
    order: int,
    title: loc,
    summary: loc,
    blocks: arr(
      obj({
        kind: oneOf(['p', 'table', 'example']),
        text: opt(loc),
        rows: opt(arr(arr(loc))),
        hv: opt(str),
        gloss: opt(loc),
      }),
    ),
    refs: arr(str),
  }),
  path: obj({
    id: str,
    order: int,
    title: loc,
    hvStatus: opt(oneOf(HV_STATUS)),
    intro: loc,
    minutes: num,
    steps: arr(
      obj({
        id: str,
        title: loc,
        body: loc,
        links: arr(obj({ to: str, label: loc })),
        retain: arr(loc),
      }),
    ),
    quiz: arr(
      obj({
        id: str,
        question: loc,
        choices: arr(loc),
        answer: int,
        explanation: loc,
        source: opt(sourceRef),
      }),
    ),
  }),
  uiString: obj({ key: str, fr: str, en: str, hv: opt(str), status: opt(oneOf(HV_STATUS)), note: opt(str) }),
};

/** Vérifie `value` contre `schema`. Renvoie vrai si aucune erreur de forme n'a été trouvée. */
function shapeOk(value, schema, at) {
  let ok = true;
  const fail = (message) => {
    ok = false;
    error(`${at} : ${message}.`);
  };
  const visit = (v, s, where) => {
    if (typeof s === 'function') {
      const message = s(v);
      if (message) {
        ok = false;
        error(`${where} : ${message}.`);
      }
      return;
    }
    if (s.opt) {
      if (v !== undefined) visit(v, s.opt, where);
      return;
    }
    if (s.oneOf) {
      if (!s.oneOf.includes(v)) {
        ok = false;
        error(`${where} : valeur « ${v} » hors de la liste (${s.oneOf.join(', ')}).`);
      }
      return;
    }
    if (s.arr) {
      if (!Array.isArray(v)) {
        ok = false;
        error(`${where} : tableau attendu.`);
        return;
      }
      v.forEach((item, index) => visit(item, s.arr, `${where}[${index}]`));
      return;
    }
    if (s.tuple) {
      if (!Array.isArray(v) || v.length !== s.tuple.length) {
        ok = false;
        error(`${where} : tableau de ${s.tuple.length} valeurs attendu.`);
        return;
      }
      s.tuple.forEach((inner, index) => visit(v[index], inner, `${where}[${index}]`));
      return;
    }
    if (s.obj) {
      if (!isObj(v)) {
        ok = false;
        error(`${where} : objet attendu.`);
        return;
      }
      for (const [key, inner] of Object.entries(s.obj)) {
        if (v[key] === undefined && !inner.opt) {
          ok = false;
          error(`${where}.${key} : champ manquant.`);
        } else visit(v[key], inner, `${where}.${key}`);
      }
      for (const key of Object.keys(v)) {
        if (!(key in s.obj)) warn('forme', `${where}.${key} : champ inconnu du contrat (ignoré par l'interface).`);
      }
    }
  };
  if (schema === undefined) fail('schéma interne manquant');
  else visit(value, schema, at);
  return ok;
}

/* ================================================================== 1. Sources */

const sourcesSrc = readJson(path.join(CONTENT, 'sources', 'sources.json'), { required: true });
const lexiconSrc = readJson(path.join(CONTENT, 'glossary', 'lexicon.json'), { required: true });
const genealogySrc = readJson(path.join(CONTENT, 'genealogy', 'genealogy.json'), { required: true });
const successionSrc = readJson(path.join(CONTENT, 'genealogy', 'succession.json'), { required: true });
const sovereignsSrc = readJson(path.join(CONTENT, 'timeline', 'sovereigns.json'), { required: true });
const timelineSrc = readJson(path.join(CONTENT, 'timeline', 'timeline.json'), { required: true });
const dragonsSrc = readJson(path.join(CONTENT, 'dragons', 'dragons.json'), { required: true });

if (errors.length) finish({ abort: true });

const sources = (sourcesSrc.sources ?? []).map((s) =>
  compact({
    id: s.id,
    title: s.title,
    titleFr: s.titleFr ?? null,
    author: s.author,
    year: s.year ?? null,
    yearEnd: s.yearEnd,
    type: s.type,
    continuity: s.continuity,
    reliability: s.reliability,
    reliabilityNote: L('sources.en.json', [s.id], s, 'reliabilityNote'),
    members: s.members,
  }),
);
const sourceIds = uniqueIds(sources, 'Sources');

const reliabilityLevels = (sourcesSrc.reliabilityLevels ?? []).map((level) => ({
  id: level.id,
  order: level.order,
  label: { fr: level.label, en: level.labelEn },
  definition: { fr: level.definition, en: level.definitionEn },
}));

const sourceScale = (sourcesSrc.sourceReliabilityScale ?? []).map((step) => ({
  id: step.id,
  label: L('sources.en.json', [`scale:${step.id}`], step, 'label'),
  definition: L('sources.en.json', [`scale:${step.id}`], step, 'definition'),
}));

{
  const scaleIds = new Set(sourceScale.map((step) => step.id));
  for (const s of sources) {
    if (!SOURCE_TYPES.includes(s.type)) error(`Source « ${s.id} » : type « ${s.type} » inconnu.`);
    if (!CONTINUITY.includes(s.continuity)) error(`Source « ${s.id} » : continuité « ${s.continuity} » inconnue.`);
    if (!scaleIds.has(s.reliability)) error(`Source « ${s.id} » : nature de témoignage « ${s.reliability} » absente de l'échelle.`);
    if (!s.reliabilityNote) error(`Source « ${s.id} » : note de fiabilité manquante.`);
    for (const member of s.members ?? []) {
      if (!sourceIds.has(member)) error(`Source « ${s.id} » : membre « ${member} » introuvable.`);
    }
    if (s.year !== null && s.yearEnd != null && s.yearEnd < s.year) error(`Source « ${s.id} » : yearEnd antérieur à year.`);
  }
  const levelIds = reliabilityLevels.map((level) => level.id);
  for (const id of RELIABILITY) if (!levelIds.includes(id)) error(`Niveaux de fiabilité : « ${id} » manque dans sources.json.`);
  for (const id of levelIds) if (!RELIABILITY.includes(id)) error(`Niveaux de fiabilité : « ${id} » n'existe pas dans le contrat.`);
  for (const step of sourceScale) if (!step.label || !step.definition) error(`Échelle des sources « ${step.id} » : libellé ou définition manquant.`);
}

/** Vérifie une liste de références de sources (objets { id } ou identifiants nus). */
function checkSources(list, where) {
  if (!Array.isArray(list)) {
    error(`${where} : liste de sources manquante.`);
    return;
  }
  if (list.length === 0) warn('sources', `${where} : aucune source citée.`);
  for (const ref of list) {
    const id = typeof ref === 'string' ? ref : ref?.id;
    if (!sourceIds.has(id)) error(`${where} : source « ${id} » introuvable dans content/sources/sources.json.`);
  }
}

/* ================================================================== 2. Lexique */

const lexiconFiles = { extended: path.join(CONTENT, 'valyrian', 'lexicon-extended.json') };
const lexiconExtended = fs.existsSync(lexiconFiles.extended) ? readEnvelope(lexiconFiles.extended) : null;
if (!fs.existsSync(lexiconFiles.extended)) {
  warn('jeux absents', 'content/valyrian/lexicon-extended.json absent : le lexique se limite aux 87 entrées d’origine.');
}
const themeOverrides = isObj(lexiconExtended?.themes) ? lexiconExtended.themes : {};

const lexicon = (lexiconSrc.entries ?? []).map((entry) => {
  const prefix = String(entry.id).split('.')[0];
  if (!THEME_BY_PREFIX[prefix] && !themeOverrides[entry.id]) {
    warn('lexique', `Entrée « ${entry.id} » : aucun thème connu pour le préfixe « ${prefix} », classée « divers ».`);
  }
  return {
    id: entry.id,
    hv: entry.hv,
    fr: entry.fr,
    en: entry.en,
    status: entry.status,
    theme: themeOverrides[entry.id] ?? THEME_BY_PREFIX[prefix] ?? 'divers',
    notes: L('lexicon.en.json', [entry.id], entry, 'notes'),
    refs: entry.refs ?? [],
    verified: entry.verifie_en_ligne === true,
  };
});
const originalLexiconIds = new Set(lexicon.map((entry) => entry.id));
for (const id of Object.keys(themeOverrides)) {
  if (!originalLexiconIds.has(id)) warn('lexique', `lexicon-extended.json > themes : « ${id} » n'est pas une entrée du lexique d'origine.`);
}
lexicon.forEach((entry, index) => shapeOk(entry, SHAPES.lexiconEntry, `Lexique[${index}] « ${entry.id} »`));
for (const [index, entry] of (lexiconExtended?.items ?? []).entries()) {
  if (shapeOk(entry, SHAPES.lexiconEntry, `content/valyrian/lexicon-extended.json items[${index}]`)) lexicon.push(entry);
}
uniqueIds(lexicon, 'Lexique');
const lexiconById = new Map(lexicon.map((entry) => [entry.id, entry]));

/** Noms propres valyriens du lexique (entrées name.*), indexés par leurs formes fr et en. */
const valyrianNames = new Map();
for (const entry of lexicon) {
  if (!entry.id.startsWith('name.')) continue;
  for (const form of [entry.fr, entry.en]) valyrianNames.set(norm(form), entry);
}

/* ================================================================== 3. Personnes */

const GEN_FILE = 'content/genealogy/genealogy.json';
const sovereignById = new Map((sovereignsSrc.sovereigns ?? []).map((s) => [s.id, s]));

const persons = (genealogySrc.persons ?? []).map((p) => {
  const crowned = sovereignById.get(p.id);
  // La liste des souverains porte parfois une épithète française que la généalogie n'a pas.
  const epithetFr = p.epithetFr ?? crowned?.epithetFr ?? null;
  if (isStr(p.epithetFr) && isStr(crowned?.epithetFr) && p.epithetFr !== crowned.epithetFr) {
    warn('cohérence', `« ${p.id} » : épithète « ${p.epithetFr} » dans la généalogie, « ${crowned.epithetFr} » dans la liste des souverains.`);
  }
  const pretender = p.pretender
    ? compact({
        from: p.pretender.from,
        to: p.pretender.to ?? null,
        note: isStr(p.pretender.styledAs)
          ? { fr: p.pretender.styledAs, en: english('genealogy.en.json', ['persons', p.id], 'pretender.styledAs', p.pretender.styledAs) }
          : undefined,
      })
    : undefined;
  return compact({
    id: p.id,
    name: { fr: p.nameFr, en: p.nameEn },
    epithet: pairOrFallback(GEN_FILE, p.id, 'epithetFr', epithetFr, p.epithetEn),
    sex: p.sex,
    house: p.house,
    born: p.born ?? null,
    died: p.died ?? null,
    bornRange: p.bornRange,
    diedRange: p.diedRange,
    dateCertainty: p.dateCertainty,
    alive: p.alive,
    king: p.king === true,
    reign: p.reign ?? null,
    pretender,
    legitimacy: p.legitimacy,
    generation: p.generation,
    note: L('genealogy.en.json', ['persons', p.id], p, 'noteFr'),
    sources: p.sources ?? [],
    hasBiography: false,
  });
});
const personIds = uniqueIds(persons, 'Personnes');
const personById = new Map(persons.map((p) => [p.id, p]));
checkSlugs(persons, 'Personne');

const unions = (genealogySrc.unions ?? []).map((u) =>
  compact({
    id: u.id,
    partners: u.partners,
    type: u.type,
    year: u.year ?? null,
    endYear: u.endYear,
    certainty: CERTAINTY_TO_RELIABILITY[u.certainty] ?? u.certainty,
    note: L('genealogy.en.json', ['unions', u.id], u, 'noteFr'),
    sources: u.sources ?? [],
  }),
);
const unionIds = uniqueIds(unions, 'Unions');
const unionById = new Map(unions.map((u) => [u.id, u]));

const parentage = (genealogySrc.parentage ?? []).map((link) =>
  compact({
    child: link.child,
    union: link.union ?? null,
    father: link.father ?? null,
    mother: link.mother ?? null,
    allegedFather: link.allegedFather,
    certainty: CERTAINTY_TO_RELIABILITY[link.certainty] ?? link.certainty,
    note: L('genealogy.en.json', ['parentage', link.child], link, 'noteFr'),
    sources: link.sources ?? [],
  }),
);
uniqueIds(parentage, 'Filiations', 'child');

const mainThread = genealogySrc.mainThread?.ids ?? [];

const sovereigns = (sovereignsSrc.sovereigns ?? []).map((s) =>
  compact({
    id: s.id,
    ordinal: s.ordinal ?? null,
    name: { fr: s.nameFr, en: s.nameEn },
    epithet: pairOrFallback('content/timeline/sovereigns.json', s.id, 'epithetFr', s.epithetFr, s.epithetEn),
    reignFrom: s.reignFrom,
    reignTo: s.reignTo,
    born: s.born ?? null,
    died: s.died,
    predecessor: s.predecessor ?? null,
    successor: s.successor ?? null,
    relationToPredecessor: L('sovereigns.en.json', [s.id], s, 'relationToPredecessorFr', 'relationToPredecessorEn'),
    contested: s.contested === true,
    contestedNote: L('sovereigns.en.json', [s.id], s, 'contestedNoteFr', 'contestedNoteEn'),
    note: L('sovereigns.en.json', [s.id], s, 'noteFr', 'noteEn'),
    sources: s.sources ?? [],
  }),
);
uniqueIds(sovereigns, 'Souverains');

/** Prétendants que les listes officielles ne comptent pas (hors contrat : type local dans people.ts). */
const uncountedClaimants = (sovereignsSrc.claimantsNotCounted ?? []).map((c, index) => {
  const key = [`claimant:${index + 1}`];
  return {
    name: { fr: c.nameFr, en: c.nameEn },
    years: { fr: c.years, en: english('sovereigns.en.json', key, 'years', c.years, /^[\d–\- ]+$/.test(c.years) ? c.years : undefined) },
    note: L('sovereigns.en.json', key, c, 'noteFr', 'noteEn'),
    sources: c.sources ?? [],
  };
});

const successions = (successionSrc.successions ?? []).map((s) => ({
  order: s.order,
  from: s.from ?? null,
  to: s.to,
  year: s.year,
  relation: L('succession.en.json', [String(s.order)], s, 'relationFr', 'relationEn'),
  mode: s.mode,
  official: s.official === true,
  parentChild: s.parentChild === true,
  contestedBy: s.contestedBy ?? [],
  passedOver: s.passedOver ?? [],
  note: L('succession.en.json', [String(s.order)], s, 'noteFr', 'noteEn'),
  sources: s.sources ?? [],
}));
uniqueIds(successions.map((s) => ({ id: String(s.order) })), 'Successions (order)');

/* --- validation des personnes, unions, filiations, souverains, successions --- */

const needPerson = (id, where) => {
  if (!personIds.has(id)) error(`${where} : personne « ${id} » introuvable dans la généalogie.`);
};
const orderedRange = (range, where) => {
  if (range === undefined) return;
  if (!Array.isArray(range) || range.length !== 2) error(`${where} : intervalle [min, max] attendu.`);
  else if (range[0] !== null && range[1] !== null && range[0] > range[1]) error(`${where} : borne basse après la borne haute.`);
};

for (const p of persons) {
  const at = `Personne « ${p.id} »`;
  if (!isStr(p.name.fr) || !isStr(p.name.en)) error(`${at} : nom manquant.`);
  if (!['m', 'f'].includes(p.sex)) error(`${at} : sexe « ${p.sex} » invalide.`);
  if (!isStr(p.house)) error(`${at} : maison manquante.`);
  if (!DATE_CERT.includes(p.dateCertainty)) error(`${at} : dateCertainty « ${p.dateCertainty} » invalide.`);
  if (!LEGITIMACY.includes(p.legitimacy)) error(`${at} : légitimité « ${p.legitimacy} » invalide.`);
  if (!Number.isInteger(p.generation) || p.generation < 0) error(`${at} : génération invalide.`);
  if (year(p.born) || year(p.died)) error(`${at} : année de naissance ou de mort invalide.`);
  if (p.born === 0 || p.died === 0) error(`${at} : il n'y a pas d'an 0.`);
  if (p.born !== null && p.died !== null && p.born > p.died) error(`${at} : naissance (${p.born}) après la mort (${p.died}).`);
  orderedRange(p.bornRange, `${at} bornRange`);
  orderedRange(p.diedRange, `${at} diedRange`);
  if (p.alive === true && p.died !== null) error(`${at} : dite vivante mais année de mort renseignée.`);
  if (p.king !== (p.reign !== null)) error(`${at} : « king » et « reign » ne concordent pas.`);
  if (p.reign) {
    const [from, to] = p.reign;
    if (!Number.isInteger(from) || !Number.isInteger(to) || from > to) error(`${at} : règne invalide.`);
    if (p.born !== null && from < p.born) error(`${at} : règne commencé avant la naissance.`);
    if (p.died !== null && to > p.died) error(`${at} : règne poursuivi après la mort.`);
  }
  if (p.pretender) {
    if (!Number.isInteger(p.pretender.from)) error(`${at} : prétention sans année de début.`);
    if (p.pretender.to !== null && p.pretender.to < p.pretender.from) error(`${at} : prétention terminée avant son début.`);
  }
  checkSources(p.sources, at);
}

for (const u of unions) {
  const at = `Union « ${u.id} »`;
  if (!Array.isArray(u.partners) || u.partners.length !== 2) error(`${at} : deux partenaires attendus.`);
  else u.partners.forEach((id) => needPerson(id, at));
  if (!UNION_TYPES.includes(u.type)) error(`${at} : type « ${u.type} » invalide.`);
  if (!RELIABILITY.includes(u.certainty)) error(`${at} : certitude « ${u.certainty} » sans équivalent dans le contrat.`);
  if (year(u.year)) error(`${at} : année invalide.`);
  if (u.endYear !== undefined && u.year !== null && u.endYear < u.year) error(`${at} : fin antérieure au début.`);
  if (u.year !== null) {
    for (const id of u.partners ?? []) {
      const partner = personById.get(id);
      if (partner?.died != null && u.year > partner.died) error(`${at} : datée de ${u.year}, après la mort de « ${id} » (${partner.died}).`);
      if (partner?.born != null && u.year < partner.born) error(`${at} : datée de ${u.year}, avant la naissance de « ${id} » (${partner.born}).`);
    }
  }
  checkSources(u.sources, at);
}

for (const link of parentage) {
  const at = `Filiation de « ${link.child} »`;
  needPerson(link.child, at);
  for (const role of ['father', 'mother', 'allegedFather']) if (link[role] != null) needPerson(link[role], `${at} (${role})`);
  if (link.union !== null && !unionIds.has(link.union)) error(`${at} : union « ${link.union} » introuvable.`);
  if (link.union !== null && unionById.has(link.union)) {
    const partners = unionById.get(link.union).partners ?? [];
    for (const role of ['father', 'mother']) {
      if (link[role] !== null && !partners.includes(link[role])) error(`${at} : « ${link[role]} » n'appartient pas à l'union « ${link.union} ».`);
    }
  }
  if (!RELIABILITY.includes(link.certainty)) error(`${at} : certitude « ${link.certainty} » sans équivalent dans le contrat.`);
  const child = personById.get(link.child);
  for (const role of ['father', 'mother']) {
    const parent = personById.get(link[role]);
    if (child?.born != null && parent?.born != null && child.born <= parent.born) {
      error(`${at} : né en ${child.born}, pas après son parent « ${parent.id} » (${parent.born}).`);
    }
  }
  const mother = personById.get(link.mother);
  if (child?.born != null && mother?.died != null && child.born > mother.died) {
    error(`${at} : né en ${child.born}, après la mort de sa mère (${mother.died}).`);
  }
  const father = personById.get(link.father);
  if (child?.born != null && father?.died != null && child.born > father.died + 1) {
    error(`${at} : né en ${child.born}, plus d'un an après la mort de son père (${father.died}).`);
  }
  checkSources(link.sources, at);
}

mainThread.forEach((id) => needPerson(id, 'Fil principal de la lignée'));

for (const s of sovereigns) {
  const at = `Souverain « ${s.id} »`;
  needPerson(s.id, at);
  for (const key of ['predecessor', 'successor']) if (s[key] !== null) needPerson(s[key], `${at} (${key})`);
  if (!Number.isInteger(s.reignFrom) || !Number.isInteger(s.reignTo) || s.reignFrom > s.reignTo) error(`${at} : règne invalide.`);
  if (!Number.isInteger(s.died)) error(`${at} : année de mort manquante.`);
  if (s.born !== null && s.born > s.died) error(`${at} : naissance après la mort.`);
  if (!s.relationToPredecessor) error(`${at} : relation au prédécesseur manquante.`);
  if (!s.note) error(`${at} : note manquante.`);
  if (s.contested && !s.contestedNote) warn('cohérence', `${at} : contesté sans note d'explication.`);
  const person = personById.get(s.id);
  if (person) {
    if (person.king && (person.reign[0] !== s.reignFrom || person.reign[1] !== s.reignTo)) {
      error(`${at} : règne ${s.reignFrom}-${s.reignTo} ici, ${person.reign.join('-')} dans la généalogie.`);
    }
    if (person.born !== s.born || person.died !== s.died) {
      error(`${at} : dates de vie différentes de celles de la généalogie (${person.born}, ${person.died}).`);
    }
    if (s.ordinal !== null && !person.king) error(`${at} : numéroté dans la liste mais « king » est faux dans la généalogie.`);
  }
  const next = sovereigns.find((other) => other.id === s.successor);
  if (next && next.predecessor !== s.id) error(`${at} : son successeur « ${next.id} » ne le désigne pas comme prédécesseur.`);
  checkSources(s.sources, at);
}
for (const c of uncountedClaimants) checkSources(c.sources, `Prétendant non compté « ${c.name.fr} »`);

for (const s of successions) {
  const at = `Succession n° ${s.order}`;
  if (s.from !== null) needPerson(s.from, at);
  needPerson(s.to, at);
  [...s.contestedBy, ...s.passedOver].forEach((id) => needPerson(id, at));
  if (!Number.isInteger(s.year)) error(`${at} : année manquante.`);
  if (!s.relation || !s.note) error(`${at} : relation ou note manquante.`);
  if (!isStr(s.mode)) error(`${at} : mode manquant.`);
  checkSources(s.sources, at);
}

/* --- résolution des noms de personnes --- */

const personIndex = new Map();
for (const p of persons) {
  for (const form of [p.name.fr, p.name.en]) {
    const key = norm(form);
    if (personIndex.has(key) && personIndex.get(key) !== p.id) {
      error(`Généalogie : « ${form} » désigne à la fois « ${personIndex.get(key)} » et « ${p.id} ».`);
    }
    personIndex.set(key, p.id);
  }
}
const personAliasIndex = new Map();
for (const alias of PERSON_ALIASES) {
  if (!personIds.has(alias.id)) {
    error(`Table d'alias : « ${alias.name} » renvoie à « ${alias.id} », absent de la généalogie.`);
    continue;
  }
  const key = norm(alias.name);
  if (!personAliasIndex.has(key)) personAliasIndex.set(key, []);
  personAliasIndex.get(key).push(alias);
}

const unresolved = { people: new Map(), dragons: new Map(), places: new Map() };
const aliasHits = new Map();
const bump = (map, key) => map.set(key, (map.get(key) ?? 0) + 1);

/** Résout un nom français de personne dans un contexte (période ou « dragon:<id> »). */
function resolvePersonId(name, context) {
  const key = norm(name);
  const direct = personIndex.get(key);
  if (direct) return direct;
  const alias = (personAliasIndex.get(key) ?? []).find((a) => !a.only || a.only.includes(context));
  if (alias) {
    bump(aliasHits, `${name} -> ${alias.id}`);
    return alias.id;
  }
  if (personAliasIndex.has(key)) {
    warn('références', `« ${name} » : alias connu mais pas dans le contexte « ${context} » ; laissé sans identifiant.`);
  }
  return undefined;
}

function personRef(name, context) {
  const id = resolvePersonId(name, context);
  if (id) return { id, name: personById.get(id).name };
  bump(unresolved.people, name);
  if (!PERSON_NAME_EN[name] && FRENCH_NAME_HINT.test(name)) {
    warn('références', `« ${name} » : nom français sans forme anglaise connue (table PERSON_NAME_EN du script).`);
  }
  return { name: { fr: name, en: PERSON_NAME_EN[name] ?? name } };
}

/* ================================================================== 4. Dragons */

const looksFile = path.join(CONTENT, 'dragons', 'looks.json');
const looksEnvelope = fs.existsSync(looksFile) ? readEnvelope(looksFile) : null;
if (!fs.existsSync(looksFile)) {
  warn('jeux absents', 'content/dragons/looks.json absent : apparence par défaut déduite de colorKey (aucune mesure, aucune teinte d’aile attestée).');
}
const looks = new Map();
for (const [index, item] of (looksEnvelope?.items ?? []).entries()) {
  if (!shapeOk(item, SHAPES.look, `content/dragons/looks.json items[${index}]`)) continue;
  if (looks.has(item.dragonId)) error(`content/dragons/looks.json : deux apparences pour « ${item.dragonId} ».`);
  looks.set(item.dragonId, item);
}

/** Mélange une couleur hexadécimale avec du noir (t < 0) ou du blanc (t > 0). */
function shade(hex, t) {
  const target = t < 0 ? 0 : 255;
  const amount = Math.abs(t);
  const channels = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16));
  return `#${channels.map((c) => Math.round(c + (target - c) * amount).toString(16).padStart(2, '0')).join('')}`;
}

function defaultLook(d) {
  const body = BODY_BY_COLOR_KEY[d.colorKey] ?? BODY_UNDESCRIBED;
  if (d.colorKey != null && !BODY_BY_COLOR_KEY[d.colorKey]) {
    warn('dragons', `Dragon « ${d.id} » : colorKey « ${d.colorKey} » sans teinte par défaut.`);
  }
  return {
    // Balerion définit l'unité de l'échelle ; les autres attendent looks.json.
    span: d.id === 'balerion' ? 1 : 0.5,
    neck: 0.5,
    tail: 0.5,
    horns: 1,
    body,
    wing: shade(body, 0.16),
    crest: shade(body, -0.28),
    flame: FLAME_DEFAULT,
    attested: { body: isStr(d.colorFr), wing: false, crest: false, flame: false, size: false },
  };
}

/** Année d'éclosion écrite sans réserve dans la notice (« Éclose à Peyredragon en 7 AC »). */
function explicitHatchYear(text) {
  const match = /^Éclose? (?:à [\p{L}-]+ )?en (\d+) AC\b/u.exec(text ?? '');
  return match ? Number(match[1]) : null;
}

const DRAGONS_FILE = 'content/dragons/dragons.json';
const hatchDerived = [];
const dragonExtraTextualNotes = {};
const dragonLookNotes = {};

const dragons = (dragonsSrc.dragons ?? []).map((d) => {
  const look = looks.get(d.id);
  let hatched = null;
  if (look && 'hatched' in look) hatched = look.hatched;
  else {
    hatched = explicitHatchYear(d.hatchedOrFirstKnown);
    if (hatched !== null) hatchDerived.push(`${d.id} : ${hatched}`);
  }
  const extra = L('dragons.en.json', [d.id], d, 'extraTextualNoteFr', 'extraTextualNoteEn');
  if (extra) dragonExtraTextualNotes[d.id] = extra;
  if (look?.sizeNote || look?.colorNote) dragonLookNotes[d.id] = compact({ size: look.sizeNote, color: look.colorNote });

  const name = { fr: d.name, en: d.nameEn ?? d.name };
  const valyrian = valyrianNames.get(norm(name.en));
  if (valyrian && valyrian.status === 'atteste') name.hv = valyrian.hv;

  return compact({
    id: d.id,
    name,
    alias: pairOrFallback(DRAGONS_FILE, d.id, 'aliasFr', d.aliasFr, d.aliasEn),
    appearance: L('dragons.en.json', [d.id], d, 'colorFr', 'colorEn') ?? null,
    look: look?.look ?? defaultLook(d),
    riders: (d.riders ?? []).map((rider) => {
      const ref = personRef(rider.name, `dragon:${d.id}`);
      return compact({ personId: ref.id, name: ref.name, from: rider.from, to: rider.to });
    }),
    ridersNote: L('dragons.en.json', [d.id], d, 'ridersNoteFr', 'ridersNoteEn'),
    origin: L('dragons.en.json', [d.id], d, 'hatchedOrFirstKnown', 'hatchedOrFirstKnownEn'),
    hatched,
    died: d.died ?? null,
    alive: d.died == null ? true : undefined,
    fate: L('dragons.en.json', [d.id], d, 'fateFr', 'fateEn'),
    battleIds: [],
    eventIds: [],
    adaptationNote: L('dragons.en.json', [d.id], d, 'adaptationNoteFr', 'adaptationNoteEn'),
    continuity: d.continuity,
    reliability: d.reliability,
    sources: d.sources ?? [],
  });
});
const dragonIds = uniqueIds(dragons, 'Dragons');
const dragonById = new Map(dragons.map((d) => [d.id, d]));
checkSlugs(dragons, 'Dragon');
for (const id of looks.keys()) if (!dragonIds.has(id)) error(`content/dragons/looks.json : dragon « ${id} » introuvable.`);
if (looksEnvelope) {
  for (const d of dragons) if (!looks.has(d.id)) warn('dragons', `Dragon « ${d.id} » : aucune apparence dans looks.json, apparence par défaut.`);
}

/** Index des noms de dragons : nom d'origine, nom anglais, proposition française. */
const dragonIndex = new Map();
for (const d of dragonsSrc.dragons ?? []) {
  for (const form of [d.name, d.nameEn, d.nameFrCandidate]) if (isStr(form)) dragonIndex.set(norm(form), d.id);
}
function dragonRef(name) {
  const id = dragonIndex.get(norm(name));
  if (id) return { id, name: dragonById.get(id).name };
  bump(unresolved.dragons, name);
  return { name: { fr: name, en: name } };
}

for (const d of dragons) {
  const at = `Dragon « ${d.id} »`;
  if (!CONTINUITY.includes(d.continuity)) error(`${at} : continuité « ${d.continuity} » invalide.`);
  if (!RELIABILITY.includes(d.reliability)) error(`${at} : fiabilité « ${d.reliability} » invalide.`);
  if (!d.origin) error(`${at} : origine manquante.`);
  if (!d.fate) error(`${at} : sort manquant.`);
  if (year(d.died) || year(d.hatched)) error(`${at} : année invalide.`);
  if (d.hatched !== null && d.died !== null && d.hatched > d.died) error(`${at} : éclosion (${d.hatched}) après la mort (${d.died}).`);
  for (const rider of d.riders) {
    if (rider.from !== undefined && rider.to !== undefined && rider.from > rider.to) error(`${at} : dragonnier « ${rider.name.fr} », début après la fin.`);
    if (d.died !== null && rider.from !== undefined && rider.from > d.died) error(`${at} : dragonnier « ${rider.name.fr} » après la mort du dragon.`);
    const person = personById.get(rider.personId);
    if (person?.died != null && rider.to !== undefined && rider.to > person.died) {
      error(`${at} : « ${rider.name.fr} » monte encore en ${rider.to}, après sa mort (${person.died}).`);
    }
    if (person?.born != null && rider.from !== undefined && rider.from < person.born) {
      error(`${at} : « ${rider.name.fr} » monte dès ${rider.from}, avant sa naissance (${person.born}).`);
    }
  }
  const { look } = d;
  for (const key of ['neck', 'tail']) if (look[key] < 0 || look[key] > 1) error(`${at} : look.${key} hors de l'intervalle 0 à 1.`);
  if (look.span <= 0 || look.span > 1.5) error(`${at} : look.span hors de l'intervalle attendu (Balerion = 1).`);
  if (look.horns < 0 || look.horns > 3) error(`${at} : look.horns hors de l'intervalle 0 à 3.`);
  if (look.attested.body && d.appearance === null) {
    warn('dragons', `${at} : teinte de corps dite attestée alors que les livres ne décrivent pas ce dragon.`);
  }
  checkSources(d.sources, at);
}

/* ================================================================== 5. Lieux, carte */

const placesFile = path.join(CONTENT, 'locations', 'places.json');
const placesEnvelope = fs.existsSync(placesFile) ? readEnvelope(placesFile) : null;
const placesPresent = placesEnvelope !== null;
if (!fs.existsSync(placesFile)) {
  warn('jeux absents', 'content/locations/places.json absent : aucun lieu, les lieux des événements restent sans identifiant.');
}
const places = (placesEnvelope?.items ?? []).filter((item, index) => shapeOk(item, SHAPES.place, `content/locations/places.json items[${index}]`));
const placeIds = uniqueIds(places, 'Lieux');
const placeById = new Map(places.map((p) => [p.id, p]));
checkSlugs(places, 'Lieu');

for (const place of places) {
  const valyrian = valyrianNames.get(norm(place.name.en)) ?? valyrianNames.get(norm(place.name.fr));
  if (!valyrian) continue;
  if (isStr(place.name.hv) && place.name.hv !== valyrian.hv) {
    warn('cohérence', `Lieu « ${place.id} » : forme valyrienne « ${place.name.hv} », le lexique donne « ${valyrian.hv} » (${valyrian.id}).`);
  } else if (!isStr(place.name.hv)) {
    place.name = { ...place.name, hv: valyrian.hv };
    place.hvStatus = valyrian.status;
  }
}
for (const place of places) {
  if (isStr(place.name.hv) && !place.hvStatus) error(`Lieu « ${place.id} » : forme valyrienne sans statut (hvStatus).`);
}

const mapFile = path.join(CONTENT, 'locations', 'map.json');
const mapEnvelope = fs.existsSync(mapFile) ? readEnvelope(mapFile) : null;
let mapData = { viewBox: [0, 0, 1000, 1000], lands: [], islands: [], rivers: [], ranges: [], seas: [], regions: [] };
let mapPresent = false;
if (!fs.existsSync(mapFile)) {
  warn('jeux absents', 'content/locations/map.json absent : carte vide.');
} else if (mapEnvelope) {
  if (mapEnvelope.items.length !== 1) error('content/locations/map.json : un seul objet MapData est attendu dans « items ».');
  else if (shapeOk(mapEnvelope.items[0], SHAPES.map, 'content/locations/map.json items[0]')) {
    mapData = mapEnvelope.items[0];
    mapPresent = true;
    for (const layer of ['lands', 'islands', 'rivers', 'ranges', 'seas', 'regions']) uniqueIds(mapData[layer], `Carte (${layer})`);
    const [x, y, w, h] = mapData.viewBox;
    for (const place of places) {
      const [px, py] = place.coord;
      if (px < x || px > x + w || py < y || py > y + h) error(`Lieu « ${place.id} » : coordonnées hors du cadre de la carte.`);
    }
  }
}

const gazetteer = new Map((timelineSrc.gazetteer ?? []).map((entry) => [norm(entry.fr), entry.en]));
const placeIndex = new Map();
for (const place of places) {
  for (const form of [place.name.fr, place.name.en]) {
    const key = norm(form);
    for (const variant of new Set([key, stripArticle(key), stripParens(key), stripArticle(stripParens(key))])) {
      if (variant && !placeIndex.has(variant)) placeIndex.set(variant, place.id);
    }
  }
}
for (const [name, id] of Object.entries(PLACE_ALIASES)) {
  if (placesPresent && !placeIds.has(id)) error(`Table d'alias des lieux : « ${name} » renvoie à « ${id} », introuvable.`);
  else placeIndex.set(norm(name), id);
}

function placeRef(name) {
  const key = norm(name);
  const englishName = gazetteer.get(key);
  if (!englishName) warn('références', `Lieu « ${name} » : absent de la table des noms anglais (gazetteer de timeline.json).`);
  const candidates = [key, stripArticle(key), stripParens(key), stripArticle(stripParens(key))];
  if (englishName) candidates.push(norm(englishName), norm(englishName).replace(/^the /, ''), stripParens(norm(englishName)));
  const id = candidates.map((candidate) => placeIndex.get(candidate)).find(Boolean);
  if (id) return { id, name: { fr: placeById.get(id).name.fr, en: placeById.get(id).name.en } };
  bump(unresolved.places, name);
  return { name: { fr: name, en: englishName ?? name } };
}

/* ================================================================== 6. Chronologie */

const typographyFixes = [];
/** « Série — le rêve d'Aegon » -> « Série : le rêve d'Aegon » : le musée n'emploie pas le tiret cadratin. */
function titleWithoutDash(text, lang, where) {
  if (!isStr(text) || text.split(' — ').length !== 2) return text;
  const fixed = text.replace(' — ', lang === 'fr' ? ' : ' : ': ');
  typographyFixes.push(`${where} (${lang}) : « ${text} » devient « ${fixed} »`);
  return fixed;
}

const essaysByPeriod = new Map();
const essayFiles = listFiles('timeline/essays', /^p.*\.json$/);
if (essayFiles.length === 0) warn('jeux absents', 'content/timeline/essays/p*.json absents : aucune période n’a encore de récit long.');
for (const file of essayFiles) {
  const envelope = readEnvelope(file);
  for (const [index, item] of (envelope?.items ?? []).entries()) {
    if (!shapeOk(item, SHAPES.essay, `${rel(file)} items[${index}]`)) continue;
    if (essaysByPeriod.has(item.periodId)) error(`${rel(file)} : un récit existe déjà pour la période « ${item.periodId} ».`);
    essaysByPeriod.set(item.periodId, item.sections);
    uniqueIds(item.sections, `Récit de la période « ${item.periodId} » (sections)`);
    item.sections.forEach((section) => checkSources(section.sources, `Récit « ${item.periodId} », section « ${section.id} »`));
  }
}

const events = [];
const openQuestions = [];
const periods = (timelineSrc.periods ?? []).map((p) => {
  const titleEntry = lexiconById.get(`period.${p.order}`);
  const title = { fr: p.titleFr, en: p.titleEn };
  let hvStatus = 'editorial';
  if (titleEntry) {
    title.hv = titleEntry.hv;
    hvStatus = titleEntry.status;
    if (norm(titleEntry.fr) !== norm(p.titleFr)) {
      warn('cohérence', `Période « ${p.id} » : titre « ${p.titleFr} », alors que le titre valyrien « ${titleEntry.hv} » est glosé « ${titleEntry.fr} » dans le lexique.`);
    }
  } else {
    warn('lexique', `Période « ${p.id} » : aucune entrée « period.${p.order} » dans le lexique, pas de titre valyrien.`);
  }

  const eventIds = [];
  for (const e of p.events ?? []) {
    const keyPath = ['events', e.id];
    const at = `Événement « ${e.id} »`;
    if (!(e.dateCertainty in DATE_CERTAINTY)) error(`${at} : dateCertainty « ${e.dateCertainty} » inconnue.`);
    if (e.dateCertainty === 'contestee') {
      note(`${at} : dateCertainty « contestee » rendue par « approximative » (le contrat n'a pas cette valeur) ; la divergence reste dite dans dateNote.`);
    }
    eventIds.push(e.id);
    events.push(
      compact({
        id: e.id,
        periodId: p.id,
        year: e.year ?? null,
        yearEnd: e.yearEnd,
        sortYear: e.sortYear,
        dateCertainty: DATE_CERTAINTY[e.dateCertainty] ?? e.dateCertainty,
        yearLabel: { fr: e.yearLabelFr, en: e.yearLabelEn },
        dateNote: L('timeline.en.json', keyPath, e, 'dateNoteFr', 'dateNoteEn'),
        title: { fr: titleWithoutDash(e.titleFr, 'fr', at), en: titleWithoutDash(e.titleEn, 'en', at) },
        summary: { fr: e.summaryFr, en: e.summaryEn },
        consequence: { fr: e.consequenceFr, en: e.consequenceEn },
        people: (e.people ?? []).map((name) => personRef(name, p.id)),
        dragons: (e.dragons ?? []).map(dragonRef),
        places: (e.places ?? []).map(placeRef),
        continuity: e.continuity,
        reliability: e.reliability,
        reliabilityNote: L('timeline.en.json', keyPath, e, 'reliabilityNoteFr', 'reliabilityNoteEn'),
        sources: e.sources ?? [],
      }),
    );
  }

  for (const q of p.openQuestions ?? []) {
    openQuestions.push(
      compact({
        id: q.id,
        periodId: p.id,
        question: { fr: q.questionFr, en: q.questionEn },
        established: { fr: q.establishedFr, en: q.establishedEn },
        hypothesis: { fr: q.hypothesisFr, en: q.hypothesisEn },
        adaptation: isStr(q.adaptationFr) ? { fr: q.adaptationFr, en: q.adaptationEn } : undefined,
        status: q.status,
        sources: q.sources ?? [],
      }),
    );
  }

  return compact({
    id: p.id,
    order: p.order,
    title,
    hvStatus,
    from: p.from ?? null,
    to: p.to,
    summary: { fr: p.summaryFr, en: p.summaryEn },
    essay: essaysByPeriod.get(p.id) ?? [],
    note: L('timeline.en.json', ['periods', p.id], p, 'noteFr', 'noteEn'),
    openQuestions: (p.openQuestions ?? []).map((q) => ({ fr: q.questionFr, en: q.questionEn })),
    eventIds,
  });
});
const periodIds = uniqueIds(periods, 'Périodes');
const periodById = new Map(periods.map((p) => [p.id, p]));
const eventIds = uniqueIds(events, 'Événements');
const eventById = new Map(events.map((e) => [e.id, e]));
uniqueIds(openQuestions, 'Questions ouvertes');
checkSlugs(events, 'Événement');
for (const id of essaysByPeriod.keys()) if (!periodIds.has(id)) error(`Récit long : période « ${id} » introuvable.`);

{
  const orders = periods.map((p) => p.order).sort((a, b) => a - b);
  if (orders.some((order, index) => order !== index + 1)) error('Périodes : la suite des numéros d’ordre n’est pas 1, 2, 3…');
}
for (const p of periods) {
  const at = `Période « ${p.id} »`;
  if (!Number.isInteger(p.to) || year(p.from)) error(`${at} : bornes invalides.`);
  if (p.from !== null && p.from > p.to) error(`${at} : début après la fin.`);
  if (!HV_STATUS.includes(p.hvStatus)) error(`${at} : statut valyrien « ${p.hvStatus} » invalide.`);
  if (p.eventIds.length === 0) warn('cohérence', `${at} : aucun événement.`);
}

const lifetimeNotes = [];
for (const e of events) {
  const at = `Événement « ${e.id} »`;
  const period = periodById.get(e.periodId);
  if (year(e.year)) error(`${at} : année invalide.`);
  if (e.year === 0 || e.yearEnd === 0) error(`${at} : il n'y a pas d'an 0.`);
  if (!Number.isFinite(e.sortYear)) error(`${at} : sortYear manquant.`);
  if ((e.year === null) !== (e.dateCertainty === 'inconnue')) error(`${at} : « year » nul et dateCertainty « inconnue » doivent aller ensemble.`);
  if (e.yearEnd !== undefined && (e.year === null || e.yearEnd < e.year)) error(`${at} : yearEnd incohérent avec year.`);
  if (e.year !== null && e.sortYear !== e.year) warn('cohérence', `${at} : sortYear (${e.sortYear}) diffère de year (${e.year}).`);
  if (e.year !== null && ((period.from !== null && e.year < period.from) || e.year > period.to)) {
    error(`${at} : daté de ${e.year}, hors des bornes de la période « ${period.id} ».`);
  }
  if (!CONTINUITY.includes(e.continuity)) error(`${at} : continuité « ${e.continuity} » invalide.`);
  if (!RELIABILITY.includes(e.reliability)) error(`${at} : fiabilité « ${e.reliability} » invalide.`);
  if ((e.continuity === 'adaptation') !== (e.reliability === 'adaptation')) {
    error(`${at} : continuité « ${e.continuity} » et fiabilité « ${e.reliability} » se contredisent.`);
  }
  if ((e.continuity === 'adaptation') !== e.id.startsWith('tv-')) warn('cohérence', `${at} : le préfixe « tv- » et la continuité ne concordent pas.`);
  checkSources(e.sources, at);
  if (e.year !== null) {
    for (const ref of e.people) {
      const person = personById.get(ref.id);
      if (!person) continue;
      const last = e.yearEnd ?? e.year;
      if ((person.born !== null && last < person.born) || (person.died !== null && e.year > person.died)) {
        lifetimeNotes.push(`${e.id} (${e.year}) cite « ${person.name.fr} » (${person.born ?? '?'} à ${person.died ?? '?'})`);
      }
    }
  }
}
for (const q of openQuestions) checkSources(q.sources, `Question ouverte « ${q.id} »`);

/* ================================================================== 7. Guerres */

const warFiles = listFiles('battles', /^wars-.*\.json$/);
if (warFiles.length === 0) warn('jeux absents', 'content/battles/wars-*.json absents : aucune guerre, aucune bataille.');
const wars = [];
for (const file of warFiles) {
  const envelope = readEnvelope(file);
  for (const [index, item] of (envelope?.items ?? []).entries()) {
    if (shapeOk(item, SHAPES.war, `${rel(file)} items[${index}]`)) wars.push(item);
  }
}
const warsPresent = warFiles.length > 0;
wars.sort((a, b) => a.from - b.from || a.id.localeCompare(b.id));
const warIds = uniqueIds(wars, 'Guerres');
const battles = wars.flatMap((war) => war.battles);
const battleIds = uniqueIds(battles, 'Batailles');
const battleById = new Map(battles.map((b) => [b.id, b]));
checkSlugs(wars, 'Guerre');
checkSlugs(battles, 'Bataille');

/** Référence vers un jeu qui peut ne pas être encore livré : erreur s'il existe, avertissement sinon. */
function needIn(ids, present, id, where, label) {
  if (ids.has(id)) return;
  if (present) error(`${where} : ${label} « ${id} » introuvable.`);
  else warn('références', `${where} : ${label} « ${id} » non vérifiable, le jeu correspondant n'est pas encore livré.`);
}

for (const war of wars) {
  const at = `Guerre « ${war.id} »`;
  if (war.from > war.to) error(`${at} : début après la fin.`);
  if (!periodIds.has(war.periodId)) error(`${at} : période « ${war.periodId} » introuvable.`);
  if (isStr(war.title.hv) && !war.hvStatus) error(`${at} : titre valyrien sans statut (hvStatus).`);
  const sideIds = uniqueIds(war.belligerents, `${at} (belligérants)`);
  if (war.belligerents.length < 2) error(`${at} : deux belligérants au moins sont attendus.`);
  for (const side of war.belligerents) {
    for (const leader of side.leaders) if (leader.id !== undefined) needPerson(leader.id, `${at}, camp « ${side.id} »`);
  }
  war.eventIds.forEach((id) => needIn(eventIds, true, id, at, 'événement'));
  checkSources(war.sources, at);
  for (const battle of war.battles) {
    const where = `Bataille « ${battle.id} »`;
    if (battle.warId !== war.id) error(`${where} : warId « ${battle.warId} » alors qu'elle est rangée dans « ${war.id} ».`);
    battle.sides.forEach((side) => {
      if (!sideIds.has(side)) error(`${where} : camp « ${side} » absent des belligérants de « ${war.id} ».`);
    });
    if (battle.sides[0] === battle.sides[1]) error(`${where} : les deux camps sont identiques.`);
    if (battle.victor !== 'indecis' && !battle.sides.includes(battle.victor)) error(`${where} : vainqueur « ${battle.victor} » étranger à la bataille.`);
    if ((battle.year === null) !== (battle.dateCertainty === 'inconnue')) error(`${where} : « year » nul et dateCertainty « inconnue » doivent aller ensemble.`);
    if (battle.year === 0) error(`${where} : il n'y a pas d'an 0.`);
    if (battle.year !== null && (battle.year < war.from || battle.year > war.to)) error(`${where} : datée de ${battle.year}, hors de la guerre (${war.from} à ${war.to}).`);
    if (battle.placeId !== undefined) needIn(placeIds, placesPresent, battle.placeId, where, 'lieu');
    for (const entry of battle.dragons) {
      needIn(dragonIds, true, entry.dragonId, where, 'dragon');
      if (!battle.sides.includes(entry.side)) error(`${where} : le dragon « ${entry.dragonId} » combat pour un camp absent (« ${entry.side} »).`);
      const dragon = dragonById.get(entry.dragonId);
      if (dragon?.died != null && battle.year !== null && battle.year > dragon.died) {
        error(`${where} : le dragon « ${entry.dragonId} » est mort en ${dragon.died}, avant la bataille.`);
      }
    }
    checkSources(battle.sources, where);
  }
}

/* ================================================================== 8. Biographies */

const biographyFiles = listFiles('characters/biographies', /\.json$/);
if (biographyFiles.length === 0) warn('jeux absents', 'content/characters/biographies/*.json absents : aucune biographie rédigée.');
const biographies = [];
for (const file of biographyFiles) {
  const envelope = readEnvelope(file);
  for (const [index, item] of (envelope?.items ?? []).entries()) {
    if (shapeOk(item, SHAPES.biography, `${rel(file)} items[${index}]`)) biographies.push(item);
  }
}
uniqueIds(biographies, 'Biographies', 'personId');
for (const bio of biographies) {
  const at = `Biographie de « ${bio.personId} »`;
  needPerson(bio.personId, at);
  bio.dragonIds.forEach((id) => needIn(dragonIds, true, id, at, 'dragon'));
  bio.eventIds.forEach((id) => needIn(eventIds, true, id, at, 'événement'));
  bio.warIds.forEach((id) => needIn(warIds, warsPresent, id, at, 'guerre'));
  uniqueIds(bio.sections, `${at} (sections)`);
  bio.sections.forEach((section) => checkSources(section.sources, `${at}, section « ${section.id} »`));
  checkSources(bio.sources, at);
  const person = personById.get(bio.personId);
  if (person) person.hasBiography = true;
}
biographies.sort((a, b) => persons.findIndex((p) => p.id === a.personId) - persons.findIndex((p) => p.id === b.personId));

/* ================================================================== 9. Renvois calculés */

const bySortYear = (a, b) => eventById.get(a).sortYear - eventById.get(b).sortYear;
for (const e of events) {
  for (const ref of e.dragons) if (ref.id) dragonById.get(ref.id).eventIds.push(e.id);
}
for (const battle of battles) {
  for (const entry of battle.dragons) {
    const dragon = dragonById.get(entry.dragonId);
    if (dragon && !dragon.battleIds.includes(battle.id)) dragon.battleIds.push(battle.id);
  }
}
for (const place of places) {
  const at = `Lieu « ${place.id} »`;
  place.eventIds.forEach((id) => needIn(eventIds, true, id, at, 'événement'));
  place.battleIds.forEach((id) => needIn(battleIds, warsPresent, id, at, 'bataille'));
  checkSources(place.sources, at);
  // Aux renvois rédigés s'ajoutent ceux que la chronologie et les batailles établissent.
  const linkedEvents = new Set(place.eventIds.filter((id) => eventIds.has(id)));
  for (const e of events) if (e.places.some((ref) => ref.id === place.id)) linkedEvents.add(e.id);
  place.eventIds = [...linkedEvents].sort(bySortYear);
  const linkedBattles = new Set(place.battleIds);
  for (const battle of battles) if (battle.placeId === place.id) linkedBattles.add(battle.id);
  place.battleIds = [...linkedBattles];
}

/* ================================================================== 10. Langue, parcours */

function readCollection(relPath, shape, label, absentMessage) {
  const file = path.join(CONTENT, relPath);
  if (!fs.existsSync(file)) {
    warn('jeux absents', `content/${relPath} absent : ${absentMessage}`);
    return { items: [], present: false };
  }
  const envelope = readEnvelope(file);
  const items = (envelope?.items ?? []).filter((item, index) => shapeOk(item, shape, `content/${relPath} items[${index}]`));
  uniqueIds(items, label);
  return { items, present: true };
}

const phrases = readCollection('valyrian/phrases.json', SHAPES.phrase, 'Expressions', 'aucune expression.').items;
const grammar = readCollection('valyrian/grammar.json', SHAPES.grammarLesson, 'Leçons de grammaire', 'aucune leçon de grammaire.').items;
grammar.sort((a, b) => a.order - b.order);
for (const lesson of grammar) {
  lesson.blocks.forEach((block, index) => {
    const at = `Leçon « ${lesson.id} », bloc ${index + 1}`;
    if (block.kind === 'p' && !block.text) error(`${at} : un paragraphe demande « text ».`);
    if (block.kind === 'table' && !(block.rows?.length >= 2)) error(`${at} : un tableau demande « rows » (en-têtes et au moins une ligne).`);
    if (block.kind === 'table' && block.rows && new Set(block.rows.map((row) => row.length)).size > 1) error(`${at} : les lignes du tableau n'ont pas toutes le même nombre de cellules.`);
    if (block.kind === 'example' && (!isStr(block.hv) || !block.gloss)) error(`${at} : un exemple demande « hv » et « gloss ».`);
  });
}

const paths = readCollection('learning/paths.json', SHAPES.path, 'Parcours', 'aucun parcours.').items;
paths.sort((a, b) => a.order - b.order);
checkSlugs(paths, 'Parcours');
const pathIds = new Set(paths.map((p) => p.id));

/** Vérifie un chemin interne (sans préfixe de version) contre le plan des routes et les identifiants. */
function checkRoute(to, where) {
  const [beforeHash, hash] = to.split('#');
  const [pathname, query] = beforeHash.split('?');
  if (STATIC_ROUTES.has(pathname)) {
    if (pathname === '/lignee' && query) {
      const person = new URLSearchParams(query).get('p');
      if (person) needPerson(person, where);
    }
    return;
  }
  const parts = pathname.split('/').filter(Boolean);
  const [section, first, second] = parts;
  const fail = () => error(`${where} : chemin interne « ${to} » hors du plan des routes.`);
  if (!pathname.startsWith('/') || parts.length < 2 || parts.length > 3) return fail();
  if (section === 'chroniques') {
    if (!periodIds.has(first)) return error(`${where} : période « ${first} » introuvable (« ${to} »).`);
    if (second !== undefined && periodById.get(first) && !periodById.get(first).eventIds.includes(second)) {
      return error(`${where} : l'événement « ${second} » n'appartient pas à la période « ${first} » (« ${to} »).`);
    }
    return;
  }
  if (parts.length !== 2) return fail();
  if (section === 'personnages') return needPerson(first, where);
  if (section === 'dragons') return needIn(dragonIds, true, first, where, 'dragon');
  if (section === 'guerres') {
    needIn(warIds, warsPresent, first, where, 'guerre');
    if (hash) needIn(battleIds, warsPresent, hash, where, 'bataille');
    return;
  }
  if (section === 'lieux') return needIn(placeIds, placesPresent, first, where, 'lieu');
  if (section === 'apprendre') return needIn(pathIds, true, first, where, 'parcours');
  return fail();
}

for (const learningPath of paths) {
  const at = `Parcours « ${learningPath.id} »`;
  if (isStr(learningPath.title.hv) && !learningPath.hvStatus) error(`${at} : titre valyrien sans statut (hvStatus).`);
  if (learningPath.minutes <= 0) error(`${at} : durée invalide.`);
  uniqueIds(learningPath.steps, `${at} (étapes)`);
  uniqueIds(learningPath.quiz, `${at} (questions)`);
  for (const step of learningPath.steps) {
    step.links.forEach((link) => checkRoute(link.to, `${at}, étape « ${step.id} »`));
  }
  for (const question of learningPath.quiz) {
    const where = `${at}, question « ${question.id} »`;
    if (question.choices.length < 2) error(`${where} : deux réponses au moins sont attendues.`);
    if (question.answer < 0 || question.answer >= question.choices.length) error(`${where} : l'indice de la bonne réponse est hors des choix.`);
    if (question.source) checkSources([question.source], where);
  }
}

/* ================================================================== 11. Chaînes d'interface */

const uiFiles = listFiles('interface', /^ui(\..+)?\.json$/);
if (uiFiles.length === 0) warn('jeux absents', 'content/interface/ui.*.json absents : aucune chaîne d’interface.');
const uiStrings = [];
const uiOrigin = new Map();
for (const file of uiFiles) {
  const envelope = readEnvelope(file);
  for (const [index, item] of (envelope?.items ?? []).entries()) {
    if (!shapeOk(item, SHAPES.uiString, `${rel(file)} items[${index}]`)) continue;
    if (uiOrigin.has(item.key)) {
      error(`Chaîne d'interface « ${item.key} » définie deux fois : ${uiOrigin.get(item.key)} et ${rel(file)}.`);
      continue;
    }
    uiOrigin.set(item.key, rel(file));
    if (isStr(item.hv) && !item.status) error(`${rel(file)} « ${item.key} » : forme valyrienne sans statut.`);
    if (!isStr(item.hv) && item.status) warn('interface', `${rel(file)} « ${item.key} » : statut sans forme valyrienne.`);
    if (!/^[a-z0-9]+(\.[A-Za-z0-9_]+)+$/.test(item.key)) warn('interface', `${rel(file)} « ${item.key} » : clé hors de la convention domaine.nom.`);
    const entry = lexiconById.get(item.key);
    if (entry && isStr(item.hv) && (entry.hv !== item.hv || entry.status !== item.status)) {
      warn('interface', `${rel(file)} « ${item.key} » : forme ou statut différent de l'entrée du lexique (« ${entry.hv} », ${entry.status}).`);
    }
    uiStrings.push(item);
  }
}

/* ================================================================== 12. Recherche */

/** Clés de recherche : formes normalisées, plus la variante sans tirets ni apostrophes. */
function searchKeys(...forms) {
  const keys = new Set();
  for (const form of forms.flat()) {
    if (!isStr(form)) continue;
    const key = norm(form);
    keys.add(key);
    const loose = key.replace(/[-']/g, ' ').replace(/[().,:;]/g, '').replace(/\s+/g, ' ').trim();
    if (loose) keys.add(loose);
  }
  return [...keys];
}
const both = (l) => (l ? [l.fr, l.en, l.hv] : []);
const joinHint = (...parts) => {
  const present = parts.filter(Boolean);
  if (present.length === 0) return undefined;
  return { fr: present.map((p) => p.fr).join(', '), en: present.map((p) => p.en).join(', ') };
};

function lifeHint(person) {
  const { born, died, sex } = person;
  if (born !== null && died !== null) return spanHint(born, died);
  if (born !== null) return { fr: `${sex === 'f' ? 'née' : 'né'} en ${frYear(born)}`, en: `born ${enYear(born)}` };
  if (died !== null) return { fr: `${sex === 'f' ? 'morte' : 'mort'} en ${frYear(died)}`, en: `died ${enYear(died)}` };
  return undefined;
}

const dragonCandidates = new Map((dragonsSrc.dragons ?? []).map((d) => [d.id, d.nameFrCandidate]));
const searchEntries = [
  ...periods.map((p) =>
    compact({ kind: 'period', id: p.id, to: `/chroniques/${p.id}`, label: p.title, hint: spanHint(p.from, p.to), keys: searchKeys(both(p.title)) }),
  ),
  ...persons.map((p) =>
    compact({
      kind: 'person',
      id: p.id,
      to: `/personnages/${p.id}`,
      label: p.name,
      hint: joinHint(p.epithet, lifeHint(p)),
      keys: searchKeys(both(p.name), both(p.epithet)),
    }),
  ),
  ...dragons.map((d) =>
    compact({
      kind: 'dragon',
      id: d.id,
      to: `/dragons/${d.id}`,
      label: d.name,
      hint: d.alias,
      keys: searchKeys(both(d.name), both(d.alias), dragonCandidates.get(d.id)),
    }),
  ),
  ...events.map((e) =>
    compact({ kind: 'event', id: e.id, to: `/chroniques/${e.periodId}/${e.id}`, label: e.title, hint: e.yearLabel, keys: searchKeys(both(e.title)) }),
  ),
  ...wars.map((w) =>
    compact({ kind: 'war', id: w.id, to: `/guerres/${w.id}`, label: w.title, hint: spanHint(w.from, w.to), keys: searchKeys(both(w.title)) }),
  ),
  ...battles.map((b) =>
    compact({
      kind: 'battle',
      id: b.id,
      to: `/guerres/${b.warId}#${b.id}`,
      label: b.name,
      hint: joinHint(b.year === null ? undefined : spanHint(b.year, b.year), b.placeName),
      keys: searchKeys(both(b.name), both(b.placeName)),
    }),
  ),
  ...places.map((p) =>
    compact({ kind: 'place', id: p.id, to: `/lieux/${p.id}`, label: p.name, hint: p.region, keys: searchKeys(both(p.name)) }),
  ),
  ...lexicon.map((w) => ({
    kind: 'word',
    id: w.id,
    to: `/langue/lexique#${w.id}`,
    label: { fr: w.hv, en: w.hv, hv: w.hv },
    hint: { fr: w.fr, en: w.en },
    keys: searchKeys(w.hv, w.fr, w.en),
  })),
  ...paths.map((p) =>
    compact({
      kind: 'path',
      id: p.id,
      to: `/apprendre/${p.id}`,
      label: p.title,
      hint: { fr: `${p.minutes} min de lecture`, en: `${p.minutes} min read` },
      keys: searchKeys(both(p.title)),
    }),
  ),
];
{
  const seen = new Set();
  for (const entry of searchEntries) {
    const key = `${entry.kind}:${entry.id}`;
    if (seen.has(key)) error(`Recherche : entrée en double « ${key} ».`);
    seen.add(key);
    if (entry.keys.length === 0) error(`Recherche : « ${key} » n'a aucune clé.`);
  }
}

/* ================================================================== 13. Contrôles transversaux */

const generated = {
  timeline: { periods, events, openQuestions },
  people: { persons, unions, parentage, sovereigns, successions, mainThread, uncountedClaimants },
  biographies: { biographies },
  dragons: { dragons, extraTextualNotes: dragonExtraTextualNotes, lookNotes: dragonLookNotes },
  wars: { wars },
  places: { places },
  map: { available: mapPresent, map: mapData },
  language: { lexicon, phrases, grammar },
  sources: { sources, reliabilityLevels, sourceScale },
  paths: { paths },
  ui: { strings: uiStrings },
  search: { entries: searchEntries },
};

/** Clés dont la valeur n'est pas du texte rédigé (citations bibliographiques, adresses, tracés). */
const NOT_PROSE = new Set(['locator', 'refs', 'd', 'to', 'id', 'key', 'keys', 'title', 'titleFr', 'author']);
/** Phrases qui racontent le contrôle des données au lieu de parler du sujet. */
const WORK_NOTE = /pendant la session|illisible|n'a pas pu être lue?|de mémoire|fiche lue|résumé automatique|revérifier/i;
/** Noms de champs et valeurs techniques qui n'ont rien à faire dans un texte de musée. */
const FIELD_TALK = /« ?(king|pretender|reign) ?»|dateCertainty|openQuestions|verifiedOnline|colorKey|continuity =|à (false|true|null)(?![a-zà-ÿ])/;

/**
 * Parcourt tout ce qui sera écrit : un objet qui porte « fr » ou « en » doit porter les deux,
 * non vides ; aucun texte rédigé ne contient de tiret cadratin ni de point d'exclamation.
 */
function inspect(value, trail, dataset) {
  if (Array.isArray(value)) {
    value.forEach((item, index) => inspect(item, `${trail}[${item?.id ?? item?.key ?? item?.personId ?? item?.child ?? index}]`, dataset));
    return;
  }
  if (!isObj(value)) return;
  if ('fr' in value || 'en' in value) {
    if (!isStr(value.fr)) error(`${dataset} ${trail} : texte français vide.`);
    if (!isStr(value.en)) error(`${dataset} ${trail} : texte anglais vide.`);
    if ('hv' in value && !isStr(value.hv)) error(`${dataset} ${trail} : forme valyrienne vide.`);
  }
  for (const [key, inner] of Object.entries(value)) {
    const where = `${trail}.${key}`;
    if (typeof inner === 'string') {
      // `title` d'une source est un titre d'ouvrage ; ailleurs « title » est un objet traduit.
      if (NOT_PROSE.has(key)) continue;
      // Un anglais encore absent reprend le français : inutile de signaler deux fois la même phrase.
      if (key === 'en' && inner === value.fr) continue;
      if (/—|--/.test(inner)) warn('typographie', `${dataset} ${where} : tiret cadratin dans « ${inner.slice(0, 70)}${inner.length > 70 ? '…' : ''} ».`);
      if (['fr', 'en'].includes(key) && inner.includes('!')) warn('typographie', `${dataset} ${where} : point d'exclamation.`);
      // La notice de l'outil de vérification décrit légitimement un contrôle : elle est exemptée.
      if (key === 'fr' && WORK_NOTE.test(inner) && !trail.startsWith('.sources[awoiaf]')) {
        warn('notes de travail', `${dataset} ${trail} : le texte parle du procédé de vérification, pas du sujet (« ${inner.slice(0, 80)}… »).`);
      }
      if (key === 'fr' && FIELD_TALK.test(inner)) {
        warn('notes de travail', `${dataset} ${trail} : le texte cite des noms de champs ou des valeurs techniques (« ${inner.slice(0, 80)}… »).`);
      }
    } else inspect(inner, where, dataset);
  }
}
for (const [name, data] of Object.entries(generated)) inspect(data, '', name);

reportUnusedTranslations();

/* ================================================================== 14. Écriture */

const counts = [
  ['Périodes', periods.length],
  ['Événements', events.length],
  ['  dont propres à une adaptation', events.filter((e) => e.continuity === 'adaptation').length],
  ['Sections de récit long', periods.reduce((sum, p) => sum + p.essay.length, 0)],
  ['Questions ouvertes', openQuestions.length],
  ['Personnes', persons.length],
  ['Unions', unions.length],
  ['Filiations', parentage.length],
  ['Souverains', sovereigns.length],
  ['Successions', successions.length],
  ['Biographies', biographies.length],
  ['Dragons', dragons.length],
  ['Guerres', wars.length],
  ['Batailles', battles.length],
  ['Lieux', places.length],
  ['Carte', mapPresent ? 1 : 0],
  ['Mots du lexique', lexicon.length],
  ['Expressions', phrases.length],
  ['Leçons de grammaire', grammar.length],
  ['Parcours', paths.length],
  ['Chaînes d’interface', uiStrings.length],
  ['  dont avec forme valyrienne', uiStrings.filter((s) => isStr(s.hv)).length],
  ['Sources', sources.length],
  ['Entrées de recherche', searchEntries.length],
];

function resolutionStats() {
  const stats = { people: [0, 0], dragons: [0, 0], places: [0, 0], riders: [0, 0] };
  for (const e of events) {
    for (const kind of ['people', 'dragons', 'places']) {
      for (const ref of e[kind]) stats[kind][ref.id ? 0 : 1] += 1;
    }
  }
  for (const d of dragons) for (const rider of d.riders) stats.riders[rider.personId ? 0 : 1] += 1;
  return stats;
}

function sortedCounts(map) {
  return [...map].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0], 'fr'));
}

function missingSummary() {
  const perFile = {};
  const count = (node) => Object.values(node).reduce((sum, value) => sum + (isObj(value) ? count(value) : 1), 0);
  for (const [file, node] of Object.entries(missingEn)) perFile[file] = count(node);
  return perFile;
}

function buildReport() {
  const stats = resolutionStats();
  const perFile = missingSummary();
  const lines = [];
  const push = (...text) => lines.push(...text);
  push('# Construction des contenus', '');
  push('Rapport écrit par `node scripts/build-content.mjs`. Ne pas le modifier à la main : il est réécrit à chaque exécution.', '');
  push(`État : ${errors.length === 0 ? 'aucune erreur bloquante' : `${errors.length} erreur(s) bloquante(s), rien n'a été écrit dans src/content/generated/`}. Avertissements : ${[...warnings.values()].reduce((sum, list) => sum + list.length, 0)}.`, '');

  push('## Résumé chiffré', '', '| Jeu | Nombre |', '|---|---|');
  for (const [label, value] of counts) push(`| ${label.replace(/^ {2}/, '&nbsp;&nbsp;')} | ${value} |`);
  push('');

  push('## Références par nom', '', '| Champ | Avec identifiant | Sans identifiant |', '|---|---|---|');
  push(`| Personnes citées par les événements | ${stats.people[0]} | ${stats.people[1]} |`);
  push(`| Dragons cités par les événements | ${stats.dragons[0]} | ${stats.dragons[1]} |`);
  push(`| Lieux cités par les événements | ${stats.places[0]} | ${stats.places[1]} |`);
  push(`| Dragonniers | ${stats.riders[0]} | ${stats.riders[1]} |`, '');

  if (errors.length) {
    push('## Erreurs bloquantes', '');
    errors.forEach((message) => push(`- ${message}`));
    push('');
  }

  push('## Ce que le script valide', '');
  push(
    '- Forme : chaque jeu nouveau est comparé champ par champ au contrat de `src/core/content/types.ts` (champ manquant, type, valeur hors liste : erreur ; champ inconnu : avertissement).',
    '- Identifiants uniques : sources, entrées du lexique, personnes, unions, filiations (une par enfant), souverains, successions, périodes, événements, questions ouvertes, dragons, guerres, belligérants d’une guerre, batailles, lieux, couches de la carte, expressions, leçons, parcours, étapes et questions d’un parcours, sections d’un récit, clés d’interface (une clé en double entre deux fichiers est une erreur), entrées de recherche.',
    '- Références : toute source citée existe ; partenaires, parents, père allégué, fil principal, souverains, prédécesseurs, successeurs, écartés et contestataires existent dans la généalogie ; un parent appartient à l’union citée ; dragons, événements, périodes, guerres, batailles et lieux cités par les biographies, les guerres, les lieux, les apparences et les parcours existent ; les chemins internes des parcours suivent le plan des routes.',
    '- Textes traduits : tout objet qui porte `fr` ou `en` porte les deux, non vides ; `hv` n’est jamais vide ; une forme valyrienne porte toujours son statut.',
    '- Années : pas d’an 0 ; naissance avant la mort ; règne compris dans la vie ; `king` et `reign` concordants ; règnes et dates de vie identiques entre la généalogie et la liste des souverains ; chaîne prédécesseur et successeur cohérente ; union datée du vivant des deux partenaires ; enfant né après ses parents, du vivant de sa mère et au plus un an après la mort de son père ; événement daté dans les bornes de sa période ; `year` nul si et seulement si la date est inconnue ; `yearEnd` après `year` ; dragonnier actif du vivant du cavalier et du dragon ; bataille datée dans sa guerre ; dragon vivant à la date de la bataille.',
    '- Cohérence : continuité et fiabilité « adaptation » vont ensemble ; vainqueur et camps d’une bataille appartiennent aux belligérants ; coordonnées des lieux dans le cadre de la carte ; bonne réponse d’une question parmi ses choix ; chaîne d’interface reprise du lexique identique à son entrée.',
    '- Écriture : tiret cadratin, point d’exclamation et notes de travail (qui parlent du procédé de vérification ou citent des noms de champs) sont signalés en avertissement.',
    '',
  );

  push('## Avertissements', '');
  if (warnings.size === 0) push('Aucun.', '');
  for (const [category, list] of warnings) {
    push(`### ${category} (${list.length})`, '');
    list.forEach((message) => push(`- ${message}`));
    push('');
  }

  push('## Références non résolues', '');
  push(`### Personnes absentes de la généalogie (${unresolved.people.size} noms)`, '');
  push('Elles restent des `EntityRef` sans identifiant. Le nombre entre parenthèses compte les citations.', '');
  for (const [name, n] of sortedCounts(unresolved.people)) {
    push(`- ${name} (${n})${PERSON_NAME_EN[name] ? `, en anglais : ${PERSON_NAME_EN[name]}` : ''}`);
  }
  push('', `### Dragons absents du registre (${unresolved.dragons.size})`, '');
  if (unresolved.dragons.size === 0) push('Aucun.');
  for (const [name, n] of sortedCounts(unresolved.dragons)) push(`- ${name} (${n})`);
  push('', `### Lieux sans fiche (${unresolved.places.size})`, '');
  if (unresolved.places.size === 0) push('Aucun.');
  else if (!placesPresent) push('Le registre des lieux n’est pas encore livré : tous les lieux cités restent sans identifiant.', '');
  for (const [name, n] of sortedCounts(unresolved.places)) push(`- ${name} (${n})`);
  push('');

  push('## Noms résolus par la table d’alias', '');
  if (aliasHits.size === 0) push('Aucun.');
  for (const [pair, n] of sortedCounts(aliasHits)) push(`- ${pair} (${n})`);
  push('');

  push('## Traductions anglaises manquantes', '');
  push(`${missingEnCount} champ(s) français sans anglais : dans les fichiers générés, l’anglais reprend le français. Détail, au format des fichiers attendus, dans \`reports/qa/content-missing-en.json\`.`, '');
  if (Object.keys(perFile).length) {
    push('| Fichier attendu dans content/translations/ | Champs à traduire |', '|---|---|');
    for (const [file, n] of Object.entries(perFile)) push(`| ${file} | ${n} |`);
    push('');
  }
  if (missingFr.length) {
    push(`### Formes françaises manquantes (${missingFr.length})`, '', 'Seule la forme anglaise existe à la source ; le français la reprend en attendant.', '');
    for (const item of missingFr) push(`- ${item.file}, « ${item.id} », champ ${item.field} : ${item.en}`);
    push('');
  }

  push('## Transformations appliquées', '');
  push(`- Certitude des unions et des filiations : ${Object.entries(CERTAINTY_TO_RELIABILITY).map(([from, to]) => `« ${from} » devient « ${to} »`).join(', ')}.`);
  push('- Certitude de date « contestee » rendue par « approximative ».');
  if (hatchDerived.length) push(`- Année d’éclosion lue dans la notice quand elle y est écrite sans réserve : ${hatchDerived.join(' ; ')}.`);
  if (typographyFixes.length) {
    push(`- Titres dont le tiret cadratin est remplacé par deux points (${typographyFixes.length}) :`);
    typographyFixes.forEach((fix) => push(`  - ${fix}`));
  }
  push('');

  if (notes.length || lifetimeNotes.length) {
    push('## Notes', '');
    notes.forEach((message) => push(`- ${message}`));
    if (lifetimeNotes.length) {
      push('- Événements qui citent une personne hors des années de sa vie (mention posthume ou anticipée, à relire) :');
      lifetimeNotes.forEach((message) => push(`  - ${message}`));
    }
    push('');
  }
  return `${lines.join('\n').trimEnd()}\n`;
}

ready = true;

function writeJson(file, data) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, `${JSON.stringify(data, null, 2)}\n`, 'utf8');
}

function finish({ abort = false } = {}) {
  const shown = (dir) => path.relative(ROOT, dir).split(path.sep).join('/') || '.';
  const warningTotal = [...warnings.values()].reduce((sum, list) => sum + list.length, 0);
  const fatal = errors.length > 0;

  if (ready) {
    console.log('Contenus du musée');
    const width = Math.max(...counts.map(([label]) => label.length));
    for (const [label, value] of counts) console.log(`  ${label.padEnd(width)}  ${String(value).padStart(4)}`);
    const stats = resolutionStats();
    console.log('');
    console.log(`  Références résolues : personnes ${stats.people[0]}/${stats.people[0] + stats.people[1]}, dragons ${stats.dragons[0]}/${stats.dragons[0] + stats.dragons[1]}, lieux ${stats.places[0]}/${stats.places[0] + stats.places[1]}, dragonniers ${stats.riders[0]}/${stats.riders[0] + stats.riders[1]}`);
    console.log(`  Champs sans anglais : ${missingEnCount} (en = fr), formes françaises manquantes : ${missingFr.length}`);
  }

  if (warningTotal) {
    console.log('');
    console.log(`Avertissements (${warningTotal})`);
    for (const [category, list] of warnings) {
      console.log(`  ${category} : ${list.length}`);
      // Les séries longues sont détaillées dans le rapport ; la console garde les cinq premières.
      list.slice(0, 5).forEach((message) => console.log(`    - ${message}`));
      if (list.length > 5) console.log(`    … et ${list.length - 5} autre(s), voir ${shown(QA)}/content-build.md`);
    }
  }

  if (fatal) {
    console.error('');
    console.error(`Erreurs bloquantes (${errors.length})`);
    errors.forEach((message) => console.error(`  - ${message}`));
  }

  if (ready && !CHECK_ONLY) {
    fs.mkdirSync(QA, { recursive: true });
    fs.writeFileSync(path.join(QA, 'content-build.md'), buildReport(), 'utf8');
    writeJson(path.join(QA, 'content-missing-en.json'), {
      schema: 1,
      generatedBy: 'scripts/build-content.mjs',
      note: 'Champs français sans traduction anglaise. « missing » reprend la forme exacte de chaque fichier attendu dans content/translations/ : remplacer chaque texte français par sa traduction et enregistrer sous { "schema": 1, "items": … }. « missingFr » liste les champs dont seule la forme anglaise existe à la source.',
      total: missingEnCount,
      perFile: missingSummary(),
      missing: missingEn,
      missingFr,
    });
    if (!fatal) {
      for (const [name, data] of Object.entries(generated)) writeJson(path.join(OUT, `${name}.json`), data);
    }
  }

  console.log('');
  if (fatal) {
    console.error(`Échec : ${errors.length} erreur(s). Rien n'a été écrit dans ${shown(OUT)}/.`);
    // Arrêt immédiat seulement quand un fichier requis manque ; sinon la sortie se vide d'elle-même.
    if (abort) process.exit(1);
    process.exitCode = 1;
    return;
  }
  console.log(
    CHECK_ONLY
      ? 'Contrôle terminé sans erreur (aucun fichier écrit).'
      : `Écrit : ${Object.keys(generated).length} fichiers dans ${shown(OUT)}/, rapport dans ${shown(QA)}/content-build.md.`,
  );
}

finish();
