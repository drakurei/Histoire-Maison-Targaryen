/**
 * Le cartel ouvert, écrit dans l'adresse (`?voir=person:rhaenyra`, `?voir=etat`) : spec §2.6.
 * Ouvrir pousse une entrée d'historique (Retour ferme le cartel) ; fermer revient en arrière
 * si c'est le cartel qui l'a poussée, sinon retire le paramètre sans nouvelle entrée.
 */
import { useCallback, useMemo } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

export const VOIR_PARAM = 'voir';

export type EntityKind = 'person' | 'dragon' | 'place' | 'war' | 'battle' | 'event';

export type Voir = { kind: EntityKind; id: string } | { kind: 'etat' };

const KINDS: readonly EntityKind[] = ['person', 'dragon', 'place', 'war', 'battle', 'event'];

function isKind(value: string): value is EntityKind {
  return (KINDS as readonly string[]).includes(value);
}

export function parseVoir(value: string | null): Voir | null {
  if (!value) return null;
  if (value === 'etat') return { kind: 'etat' };
  const cut = value.indexOf(':');
  if (cut <= 0) return null;
  const kind = value.slice(0, cut);
  const id = value.slice(cut + 1);
  return isKind(kind) && /^[\w-]+$/.test(id) ? { kind, id } : null;
}

export function formatVoir(voir: Voir): string {
  return voir.kind === 'etat' ? 'etat' : `${voir.kind}:${voir.id}`;
}

/** Marque posée dans l'état d'historique de l'entrée que le cartel a poussée. */
interface VoirState {
  v2voir?: true;
}

export interface VoirApi {
  voir: Voir | null;
  /** Adresse de la page courante avec ce cartel ouvert (pour un `href`). */
  hrefOf: (voir: Voir) => string;
  open: (voir: Voir) => void;
  close: () => void;
}

export function useVoir(): VoirApi {
  const location = useLocation();
  const navigate = useNavigate();
  const params = useMemo(() => new URLSearchParams(location.search), [location.search]);
  const voir = parseVoir(params.get(VOIR_PARAM));

  const hrefOf = useCallback(
    (next: Voir) => {
      const copy = new URLSearchParams(location.search);
      copy.set(VOIR_PARAM, formatVoir(next));
      return `${location.pathname}?${copy.toString()}${location.hash}`;
    },
    [location.pathname, location.search, location.hash],
  );

  const open = useCallback(
    (next: Voir) => {
      const state: VoirState = { v2voir: true };
      navigate(hrefOf(next), { state, preventScrollReset: true });
    },
    [navigate, hrefOf],
  );

  const close = useCallback(() => {
    const state = location.state as VoirState | null;
    if (state?.v2voir) {
      navigate(-1);
      return;
    }
    const copy = new URLSearchParams(location.search);
    copy.delete(VOIR_PARAM);
    const search = copy.toString();
    navigate(
      { pathname: location.pathname, search: search ? `?${search}` : '', hash: location.hash },
      { replace: true, preventScrollReset: true },
    );
  }, [navigate, location.pathname, location.search, location.hash, location.state]);

  return { voir, hrefOf, open, close };
}
