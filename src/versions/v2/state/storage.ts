/**
 * Mémoire locale de la version : la reprise de lecture (`localStorage`) et les gestes déjà
 * joués dans la session (`sessionStorage`). Tout est sous `try/catch` : stockage refusé ou
 * absent, la page reste correcte, elle oublie seulement.
 */

const RESUME_KEY = 'tlv.v2.resume';
const ONCE_KEY = 'tlv.v2.once';

/** Où le lecteur s'est arrêté : une adresse interne sans préfixe, et ce qu'il lisait. */
export interface Resume {
  /** Chemin interne sans préfixe de version, ex. « /chroniques/p5#s3 ». */
  to: string;
  /** Identifiant de ce qu'il lisait (période, parcours), pour retrouver son titre. */
  ref: string;
  /** Année réglée à ce moment, s'il y en avait une. */
  year: number | null;
}

function isResume(value: unknown): value is Resume {
  if (typeof value !== 'object' || value === null) return false;
  const record = value as Record<string, unknown>;
  return (
    typeof record.to === 'string' &&
    record.to.startsWith('/') &&
    typeof record.ref === 'string' &&
    (record.year === null || typeof record.year === 'number')
  );
}

export function readResume(): Resume | null {
  try {
    const parsed: unknown = JSON.parse(window.localStorage.getItem(RESUME_KEY) ?? 'null');
    return isResume(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

export function writeResume(resume: Resume): void {
  try {
    window.localStorage.setItem(RESUME_KEY, JSON.stringify(resume));
  } catch {
    // Stockage refusé : la reprise de lecture n'est simplement pas proposée.
  }
}

function playedSet(): Set<string> {
  try {
    const parsed: unknown = JSON.parse(window.sessionStorage.getItem(ONCE_KEY) ?? '[]');
    return new Set(Array.isArray(parsed) ? parsed.filter((item): item is string => typeof item === 'string') : []);
  } catch {
    return new Set();
  }
}

/** Vrai si ce geste (l'ombre d'une période, la masse qui se dépose…) a déjà été joué. */
export function hasPlayed(key: string): boolean {
  return playedSet().has(key);
}

export function markPlayed(key: string): void {
  try {
    const set = playedSet();
    set.add(key);
    window.sessionStorage.setItem(ONCE_KEY, JSON.stringify([...set]));
  } catch {
    // Stockage refusé : le geste pourra se rejouer, sans autre effet.
  }
}
