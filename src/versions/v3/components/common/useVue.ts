/**
 * Ce qu'une vue de la version 3 donne à la fasce (v3-spec §3.1, §4.2) : son état (datée,
 * éteinte, au portail), sa durée, son règne, ses encoches. Enveloppe `useFasce` de la V2
 * (la composition avec le cartel reste la sienne : une entité ouverte rallume une fasce
 * éteinte) et tient en plus deux faits propres à la V3 : la vue est-elle le portail, et la
 * masse en majesté du portail est-elle à l'écran (jamais deux masses, §6.1).
 */
import { useEffect, useId, useSyncExternalStore } from 'react';
import type { RefObject } from 'react';

import { useFasce } from '@/versions/v2/state/fasce';
import type { FasceMark } from '@/versions/v2/state/fasce';

export type EtatFasce = 'datee' | 'eteinte' | 'portail';

export interface Vue {
  /** `datee` par défaut ; `eteinte` pour une vue sans temps ; `portail` pour le seul portail. */
  etat?: EtatFasce;
  /** Durée de la vue : sang dedans, cramoisi dehors. */
  span?: readonly [number, number] | null;
  /** Règne compris dans la durée : trait d'or. */
  reign?: readonly [number, number] | null;
  /** Années ponctuelles (encoches d'entité). */
  marks?: readonly FasceMark[];
}

interface PortailState {
  /** Une vue « portail » est montée. */
  actif: boolean;
  /** La masse en majesté est (au moins en partie) à l'écran. */
  visible: boolean;
  /** Hauteur de la majesté en pixels, pour le mouvement « la masse se dépose ». */
  hauteur: number;
}

const portails = new Set<string>();
const listeners = new Set<() => void>();
let majesteVisible = false;
let majesteHauteur = 0;
let state: PortailState = { actif: false, visible: false, hauteur: 0 };
const SERVER: PortailState = { actif: false, visible: false, hauteur: 0 };

function publish(): void {
  const actif = portails.size > 0;
  const next = { actif, visible: actif && majesteVisible, hauteur: majesteHauteur };
  if (next.actif === state.actif && next.visible === state.visible && next.hauteur === state.hauteur) return;
  state = next;
  for (const listener of listeners) listener();
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

/** L'état du portail, lu par la fasce et la mise en page. */
export function usePortail(): PortailState {
  return useSyncExternalStore(subscribe, () => state, () => SERVER);
}

/** Déclare la vue à la fasce. À appeler une fois par vue, au premier niveau de la page. */
export function useVue(vue: Vue = {}): void {
  const etat = vue.etat ?? 'datee';
  const id = useId();
  useFasce({
    span: vue.span ?? null,
    reign: vue.reign ?? null,
    marks: vue.marks,
    off: etat === 'eteinte',
  });
  useEffect(() => {
    if (etat !== 'portail') return;
    portails.add(id);
    publish();
    return () => {
      portails.delete(id);
      majesteVisible = false;
      publish();
    };
  }, [etat, id]);
}

/**
 * Le portail pose la masse en majesté dans sa page et la confie à ce crochet : tant qu'elle
 * est visible, la fasce fixe ne montre que sa rangée ; quand elle sort de l'écran, la masse
 * fixe apparaît (fondu de 160 ms, dans la fasce).
 */
export function useMajeste(ref: RefObject<HTMLElement | null>): void {
  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry) return;
        majesteVisible = entry.isIntersecting;
        majesteHauteur = Math.round(entry.boundingClientRect.height);
        publish();
      },
      { threshold: 0 },
    );
    observer.observe(node);
    return () => {
      observer.disconnect();
      majesteVisible = false;
      publish();
    };
  }, [ref]);
}
