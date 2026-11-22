import { useEffect, useLayoutEffect, useRef } from 'react';
import { NavigationType, useLocation, useNavigationType } from 'react-router-dom';

import { focusMain } from './a11y';

/*
 * Défilement et focus au fil de la navigation. En mode déclaratif, React Router ne
 * restaure pas le défilement : on le fait ici.
 *
 * - Nouvelle page (lien suivi) : haut de page, focus sur le contenu principal.
 * - Retour ou avance dans l'historique, rechargement : position où le lecteur s'était arrêté.
 * - Adresse avec ancre (« /guerres/danse#bataille ») : l'élément visé.
 * - Même page, seuls les paramètres changent (filtre, « ?p= ») : on ne touche à rien.
 *
 * Une vue peut arriver en retard (bloc ou données chargés à la demande). L'action est donc
 * retentée à chaque image pendant un court délai, et abandonnée dès que le lecteur
 * reprend la main : on ne lui arrache jamais la page des doigts.
 */

const STORAGE_KEY = 'tlv.scroll';
const MAX_ENTRIES = 50;
/** Environ une seconde et demie à 60 images par seconde. */
const MAX_FRAMES = 90;
const READER_EVENTS = ['wheel', 'touchstart', 'keydown', 'pointerdown'] as const;
/** Clé que React Router donne à la première entrée d'un chargement sans état d'historique. */
const FIRST_ENTRY_KEY = 'default';

/** Positions par entrée d'historique (`location.key`), de la plus ancienne à la plus récente. */
const positions = readPositions();

function readPositions(): Map<string, number> {
  try {
    const stored: unknown = JSON.parse(window.sessionStorage.getItem(STORAGE_KEY) ?? '[]');
    if (!Array.isArray(stored)) return new Map();
    const entries = stored.filter(
      (entry): entry is [string, number] =>
        Array.isArray(entry) && typeof entry[0] === 'string' && typeof entry[1] === 'number',
    );
    const restored = new Map(entries);
    // Une arrivée neuve réutilise la clé de première entrée : sa position passée ne la concerne pas.
    if (!loadedFromHistory()) restored.delete(FIRST_ENTRY_KEY);
    return restored;
  } catch {
    return new Map();
  }
}

function writePositions(): void {
  try {
    const recent = [...positions].slice(-MAX_ENTRIES);
    window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify(recent));
  } catch {
    // Stockage refusé : la restauration vaut alors pour la visite en cours seulement.
  }
}

/** Vrai si le document a été rechargé ou rejoint par les boutons précédent et suivant. */
function loadedFromHistory(): boolean {
  const [entry] = window.performance.getEntriesByType('navigation');
  return entry instanceof PerformanceNavigationTiming && (entry.type === 'reload' || entry.type === 'back_forward');
}

function remember(key: string): void {
  positions.delete(key);
  positions.set(key, window.scrollY);
}

function jumpTo(top: number): void {
  window.scrollTo({ top, left: 0, behavior: 'instant' });
}

/**
 * Rejoue `attempt` à chaque image jusqu'à ce qu'il réussisse. S'arrête si le lecteur agit
 * ou si le délai expire (`giveUp` est alors appelé). Rend la fonction d'annulation.
 */
function eachFrameUntil(attempt: () => boolean, giveUp?: () => void): () => void {
  let frame = 0;
  let remaining = MAX_FRAMES;

  const stop = () => {
    window.cancelAnimationFrame(frame);
    for (const type of READER_EVENTS) window.removeEventListener(type, stop);
  };

  const tick = () => {
    if (attempt()) {
      stop();
      return;
    }
    remaining -= 1;
    if (remaining <= 0) {
      stop();
      giveUp?.();
      return;
    }
    frame = window.requestAnimationFrame(tick);
  };

  for (const type of READER_EVENTS) window.addEventListener(type, stop, { passive: true });
  tick();
  return stop;
}

/** Revient à `top` dès que la page est assez haute pour l'atteindre. */
function restore(top: number): () => void {
  return eachFrameUntil(
    () => {
      const reachable = document.documentElement.scrollHeight - window.innerHeight;
      if (reachable < top) return false;
      jumpTo(top);
      return true;
    },
    () => jumpTo(top),
  );
}

/** Amène à l'écran l'élément visé par l'ancre, dès qu'il existe. */
function revealAnchor(hash: string): () => void {
  const id = decodeAnchor(hash);
  return eachFrameUntil(() => {
    const target = document.getElementById(id);
    if (!target) return false;
    target.scrollIntoView({ block: 'start' });
    return true;
  });
}

function decodeAnchor(hash: string): string {
  const raw = hash.slice(1);
  try {
    return decodeURIComponent(raw);
  } catch {
    return raw;
  }
}

export function ScrollManager() {
  const { key, pathname, hash } = useLocation();
  const navigationType = useNavigationType();
  /** Entrée d'historique à laquelle appartiennent les défilements en cours. */
  const currentKey = useRef(key);
  const previousPathname = useRef<string | null>(null);

  // Le navigateur nous laisse la main ; les positions survivent à un rechargement.
  // Un seul écouteur de défilement pour toute la visite : il lit l'entrée courante dans
  // `currentKey`, mise à jour avant tout déplacement. Un écouteur réinstallé à chaque
  // navigation pourrait attribuer à la page quittée le retour en haut de la page suivante.
  useEffect(() => {
    const browserDefault = window.history.scrollRestoration;
    window.history.scrollRestoration = 'manual';
    const record = () => remember(currentKey.current);
    window.addEventListener('scroll', record, { passive: true });
    window.addEventListener('pagehide', writePositions);
    return () => {
      window.history.scrollRestoration = browserDefault;
      window.removeEventListener('scroll', record);
      window.removeEventListener('pagehide', writePositions);
    };
  }, []);

  useLayoutEffect(() => {
    const samePage = previousPathname.current === pathname;
    previousPathname.current = pathname;
    currentKey.current = key;

    if (navigationType === NavigationType.Pop) {
      const saved = positions.get(key);
      if (saved !== undefined) return restore(saved);
      if (hash) return revealAnchor(hash);
      // Entrée dont on ne sait rien (première arrivée, stockage refusé) : le haut de la page.
      if (!samePage) jumpTo(0);
      remember(key);
      return undefined;
    }

    // Toute entrée est retenue dès l'arrivée : y revenir sans y avoir défilé la retrouve telle quelle.
    if (hash) {
      remember(key);
      return revealAnchor(hash);
    }
    if (samePage) {
      remember(key);
      return undefined;
    }

    jumpTo(0);
    remember(key);
    // Un lien suivi déplace le focus vers la nouvelle vue ; une redirection ne le déplace pas.
    return navigationType === NavigationType.Push ? eachFrameUntil(focusMain) : undefined;
  }, [key, pathname, hash, navigationType]);

  return null;
}
