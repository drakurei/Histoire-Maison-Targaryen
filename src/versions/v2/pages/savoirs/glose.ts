/**
 * Lecture des textes savants de la bibliothèque linguistique : le mot à mot d'une formule et
 * le libellé d'une référence. Fonctions pures, sans données propres (testées par Vitest).
 */

/** Une colonne de glose interlinéaire : le mot, son sens, son analyse. */
export interface GloseMot {
  /** Le mot ou le groupe de mots valyriens. */
  hv: string;
  /** Le sens, sans l'analyse entre parenthèses. */
  sens: string;
  /** L'analyse grammaticale (ce qui était entre parenthèses), ou chaîne vide. */
  analyse: string;
}

export interface MotAMot {
  mots: GloseMot[];
  /** Remarques qui ne glosent aucun mot (« au singulier, sōvēs »). */
  remarques: string[];
}

/**
 * Coupe une chaîne sur un signe (« ; » ou « : ») suivi d'une espace, hors des parenthèses.
 * L'espace qui précède le signe en français est facultative : la même règle lit l'anglais.
 */
function splitOutside(text: string, sign: ';' | ':'): string[] {
  const parts: string[] = [];
  let depth = 0;
  let start = 0;
  for (let i = 0; i < text.length; i += 1) {
    const ch = text[i];
    if (ch === '(') depth += 1;
    else if (ch === ')') depth = Math.max(0, depth - 1);
    else if (depth === 0 && ch === sign && /\s/.test(text[i + 1] ?? '')) {
      parts.push(text.slice(start, i));
      start = i + 2;
    }
  }
  parts.push(text.slice(start));
  return parts.map((part) => part.trim()).filter(Boolean);
}

/** Sépare le sens de son analyse : « meurt (aoriste, 3e personne) » donne les deux. */
function senseAndAnalysis(text: string): { sens: string; analyse: string } {
  const open = text.indexOf('(');
  if (open === -1) return { sens: text.trim(), analyse: '' };
  const close = text.lastIndexOf(')');
  const sens = text.slice(0, open).trim();
  const analyse = text.slice(open + 1, close > open ? close : undefined).trim();
  const after = close > open ? text.slice(close + 1).trim() : '';
  const joint = /^[,.;:]/.test(after) ? '' : ' ';
  return { sens: after ? `${sens}${joint}${after}`.trim() : sens, analyse };
}

/**
 * Le mot à mot d'une formule, tel que le contenu l'écrit : des paires « mot : sens » séparées
 * par des points-virgules, l'analyse entre parenthèses. Une partie sans « : » est un mot non
 * glosé si elle vient en premier (un nom propre), une remarque sinon.
 */
export function parseLiteral(literal: string): MotAMot {
  const mots: GloseMot[] = [];
  const remarques: string[] = [];
  splitOutside(literal, ';').forEach((part, index) => {
    const pair = splitOutside(part, ':');
    if (pair.length >= 2) {
      const [hv = '', ...rest] = pair;
      mots.push({ hv, ...senseAndAnalysis(rest.join(' : ')) });
    } else if (index === 0 || mots.length === 0) {
      mots.push({ hv: part, sens: '', analyse: '' });
    } else {
      remarques.push(part);
    }
  });
  return { mots, remarques };
}

export interface RefLabel {
  /** Titre de la page citée, lisible. */
  titre: string;
  /** Site qui la publie. */
  site: string;
}

function decode(text: string): string {
  try {
    return decodeURIComponent(text);
  } catch {
    return text;
  }
}

/**
 * Libellé lisible d'une référence en ligne : le titre de la page (paramètre `title`, dernier
 * segment du chemin ou numéro d'article) et le site. Une chaîne qui n'est pas une adresse est
 * rendue telle quelle.
 */
export function refLabel(ref: string): RefLabel {
  let url: URL;
  try {
    url = new URL(ref);
  } catch {
    return { titre: ref, site: '' };
  }
  const site = url.hostname.replace(/^www\./, '');
  const fromQuery = url.searchParams.get('title');
  const segments = url.pathname.split('/').filter(Boolean);
  const last = segments[segments.length - 1] ?? '';
  let titre = fromQuery ?? (last && !/^index\.php$/i.test(last) ? decode(last) : '');
  if (!titre) {
    const article = url.searchParams.get('p');
    titre = article ? `${site}/?p=${article}` : site;
  }
  titre = titre.replace(/_/g, ' ').replace(/:(?=\S)/g, ': ').trim();
  const anchor = url.hash ? decode(url.hash.slice(1)).replace(/_/g, ' ') : '';
  return { titre: anchor ? `${titre}, ${anchor}` : titre, site };
}
