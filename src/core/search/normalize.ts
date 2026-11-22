/**
 * Normalisation des textes pour la recherche et les filtres.
 *
 * Même règle que `norm` dans `scripts/build-content.mjs`, qui fabrique les clés de l'index :
 * minuscules, ni accents ni macrons, « œ » et « æ » déliés, apostrophes ramenées à
 * l'apostrophe droite, guillemets retirés, espaces réduits à un seul. Une requête passée par
 * `normalize` se compare donc telle quelle aux `SearchEntry.keys`.
 *
 * `fold` rend en plus, pour chaque caractère normalisé, sa place dans le texte d'origine :
 * c'est ce qui permet de surligner « Réal » quand le lecteur a tapé « real ».
 *
 * Fichier en TypeScript « effaçable » : importable tel quel par Node 24.
 */

/** Accents, macrons et trémas, une fois la lettre décomposée (NFD) : U+0300 à U+036F. */
const MARKS = /[\u0300-\u036f]/g;
const MARK_ONLY = /^[\u0300-\u036f]+$/;
const SPACE = /\s/;

/** ’ ‘ ‛ ʼ ʻ ′ ` ´ : toutes les apostrophes qu'un clavier ou un traitement de texte peut produire. */
const APOSTROPHES: ReadonlySet<string> = new Set(['\u2019', '\u2018', '\u201B', '\u02BC', '\u02BB', '\u2032', '`', '\u00B4']);
/** « » “ ” " : les guillemets ne se cherchent pas. */
const QUOTES: ReadonlySet<string> = new Set(['«', '»', '“', '”', '"']);
/** Césure conditionnelle (U+00AD), espace et liants sans chasse (U+200B à U+200D), marque d'ordre des octets (U+FEFF) : invisibles, donc ignorés. */
const INVISIBLE: ReadonlySet<string> = new Set(['\u00AD', '\u200B', '\u200C', '\u200D', '\uFEFF']);
const LIGATURES: ReadonlyMap<string, string> = new Map([
  ['œ', 'oe'],
  ['æ', 'ae'],
]);

/** Ce que devient un caractère : une ou deux lettres, une espace, ou rien. */
function foldChar(ch: string): string {
  if (APOSTROPHES.has(ch)) return "'";
  if (QUOTES.has(ch) || INVISIBLE.has(ch)) return '';
  if (SPACE.test(ch)) return ' ';
  if (ch.charCodeAt(0) < 0x80) return ch.toLowerCase();
  const base = ch.toLowerCase().normalize('NFD').replace(MARKS, '');
  return LIGATURES.get(base) ?? base;
}

/** Minuscules, sans diacritiques ni macrons, apostrophes unifiées, espaces réduits et rognés. */
export function normalize(text: string): string {
  let out = '';
  for (const ch of text) {
    const folded = foldChar(ch);
    if (folded !== ' ') out += folded;
    else if (out.length > 0 && !out.endsWith(' ')) out += ' ';
  }
  return out.endsWith(' ') ? out.slice(0, -1) : out;
}

/** Texte normalisé et, pour chacun de ses caractères, l'étendue du caractère d'origine. */
export interface Folded {
  text: string;
  /** Début (inclus) dans le texte d'origine, en unités UTF-16. */
  starts: number[];
  /** Fin (exclue) dans le texte d'origine. */
  ends: number[];
}

/**
 * Comme `normalize`, en gardant la correspondance avec le texte d'origine :
 * `fold(t).text === normalize(t)` pour tout `t`.
 *
 * Une suite d'espaces compte pour une seule, qui couvre toute la suite. Un accent écrit à
 * part de sa lettre (texte déjà décomposé) reste attaché à elle : un surlignage ne coupe
 * jamais une lettre de son macron.
 */
export function fold(source: string): Folded {
  let text = '';
  const starts: number[] = [];
  const ends: number[] = [];
  let at = 0;
  for (const ch of source) {
    const next = at + ch.length;
    const folded = foldChar(ch);
    const last = ends.length - 1;
    if (folded === ' ') {
      if (text.endsWith(' ')) ends[last] = next;
      else if (text.length > 0) {
        text += ' ';
        starts.push(at);
        ends.push(next);
      }
    } else if (folded === '') {
      if (last >= 0 && ends[last] === at && MARK_ONLY.test(ch)) ends[last] = next;
    } else {
      text += folded;
      for (let i = 0; i < folded.length; i += 1) {
        starts.push(at);
        ends.push(next);
      }
    }
    at = next;
  }
  return text.endsWith(' ') ? dropLast({ text, starts, ends }) : { text, starts, ends };
}

function dropLast(folded: Folded): Folded {
  return { text: folded.text.slice(0, -1), starts: folded.starts.slice(0, -1), ends: folded.ends.slice(0, -1) };
}

/** Tirets et apostrophes : ils séparent des mots, on les lit comme des espaces. */
const SEPARATORS: ReadonlySet<string> = new Set(['-', "'"]);
/** Ponctuation que la forme relâchée oublie. */
const PUNCTUATION: ReadonlySet<string> = new Set(['(', ')', '.', ',', ':', ';']);

/**
 * Forme relâchée d'un texte déjà normalisé : tirets et apostrophes deviennent des espaces,
 * la ponctuation disparaît. C'est la seconde clé que `build-content.mjs` range dans l'index
 * (« port real », « l exile »), avec la correspondance vers le texte d'origine en plus.
 */
export function loosen(folded: Folded): Folded {
  let text = '';
  const starts: number[] = [];
  const ends: number[] = [];
  for (let i = 0; i < folded.text.length; i += 1) {
    const ch = folded.text.charAt(i);
    if (PUNCTUATION.has(ch)) continue;
    const start = folded.starts[i] ?? 0;
    const end = folded.ends[i] ?? start;
    if (ch !== ' ' && !SEPARATORS.has(ch)) {
      text += ch;
      starts.push(start);
      ends.push(end);
    } else if (text.endsWith(' ')) {
      ends[ends.length - 1] = end;
    } else if (text.length > 0) {
      text += ' ';
      starts.push(start);
      ends.push(end);
    }
  }
  return text.endsWith(' ') ? dropLast({ text, starts, ends }) : { text, starts, ends };
}

/** Forme relâchée d'un texte quelconque : « Port-Réal » donne « port real ». */
export function normalizeLoose(text: string): string {
  return loosen(fold(text)).text;
}

/** Mots d'une requête normalisée ; aucun n'est vide. */
export function wordsOf(normalized: string): string[] {
  return normalized.split(' ').filter((word) => word !== '');
}
