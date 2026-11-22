import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import { Seuil } from './Seuil';

const SESSION_KEY = 'tlv.seuil';
/** Le seuil ne retient jamais le visiteur : au-delà de ce délai, le site est tenu pour prêt. */
const READY_TIMEOUT_MS = 7000;

interface SeuilContextValue {
  /** À appeler quand la première vue est montée. */
  markReady: () => void;
  /** Rejoue l'ouverture (lien « revoir l'ouverture » du colophon). */
  replay: () => void;
  /** Vrai tant que le seuil couvre le site. */
  open: boolean;
}

const SeuilContext = createContext<SeuilContextValue>({ markReady: () => undefined, replay: () => undefined, open: false });

function seenThisSession(): boolean {
  try {
    return window.sessionStorage.getItem(SESSION_KEY) === '1';
  } catch {
    return false;
  }
}

function remember(): void {
  try {
    window.sessionStorage.setItem(SESSION_KEY, '1');
  } catch {
    // Stockage indisponible (navigation privée stricte) : le seuil se rejouera, sans autre effet.
  }
}

function forcedByUrl(): boolean {
  return new URLSearchParams(window.location.search).has('seuil');
}

/**
 * Garde du seuil : affiche l'ouverture une fois par session (ou si l'adresse porte `?seuil`),
 * rend le site inerte derrière elle, et la lève quand les polices et la première vue sont prêtes.
 */
export function SeuilGate({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(() => forcedByUrl() || !seenThisSession());
  const [viewReady, setViewReady] = useState(false);
  const [fontsReady, setFontsReady] = useState(false);
  const [timedOut, setTimedOut] = useState(false);

  useEffect(() => {
    if (!open) return;
    let alive = true;
    document.fonts.ready.then(() => alive && setFontsReady(true)).catch(() => alive && setFontsReady(true));
    const timer = window.setTimeout(() => alive && setTimedOut(true), READY_TIMEOUT_MS);
    return () => {
      alive = false;
      window.clearTimeout(timer);
    };
  }, [open]);

  // Le site derrière le seuil ne défile pas tant que le seuil le couvre.
  useEffect(() => {
    if (!open) return;
    const root = document.documentElement;
    const previous = { overflow: root.style.overflow, gutter: root.style.scrollbarGutter };
    root.style.overflow = 'hidden';
    // Sans cela, la gouttière réservée à la barre de défilement resterait visible au bord droit.
    root.style.scrollbarGutter = 'auto';
    return () => {
      root.style.overflow = previous.overflow;
      root.style.scrollbarGutter = previous.gutter;
    };
  }, [open]);

  const markReady = useCallback(() => setViewReady(true), []);
  const replay = useCallback(() => {
    setTimedOut(false);
    setOpen(true);
  }, []);
  const close = useCallback(() => {
    remember();
    setOpen(false);
  }, []);

  const value = useMemo(() => ({ markReady, replay, open }), [markReady, replay, open]);
  const ready = timedOut || (viewReady && fontsReady);

  return (
    <SeuilContext value={value}>
      <div inert={open}>{children}</div>
      {open ? <Seuil ready={ready} onDone={close} /> : null}
    </SeuilContext>
  );
}

/** À poser dans la mise en page d'une version : signale que la première vue est montée. */
export function useSeuilReady(): void {
  const { markReady } = useContext(SeuilContext);
  useEffect(() => {
    markReady();
  }, [markReady]);
}

/** Rejouer l'ouverture, et savoir si elle est en cours (pour différer une chorégraphie d'entrée). */
export function useSeuil(): Pick<SeuilContextValue, 'replay' | 'open'> {
  const { replay, open } = useContext(SeuilContext);
  return { replay, open };
}
