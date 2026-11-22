/**
 * Ce que les vues donnent à la fasce (spec §2.2) : la durée de la vue, la fasce éteinte, les
 * encoches d'entité, la fasce en majesté du portail. Chaque vue (et le cartel ouvert) déclare
 * une couche par `useFasce()` ; la fasce lit la composition par `useFasceState()`.
 *
 * Composition : la couche du cartel l'emporte sur celle de la vue pour la durée ; une durée
 * rallume une fasce éteinte ; les encoches s'additionnent.
 */
import { useEffect, useId, useSyncExternalStore } from 'react';

export interface FasceMark {
  year: number;
  /** Encoche mise en avant (survol, focus) : elle passe en braise. */
  active?: boolean;
}

export interface FasceLayer {
  /** Durée de la vue : la masse est en sang dans la durée, en cramoisi hors d'elle. */
  span?: readonly [number, number] | null;
  /** Règne compris dans la durée : trait d'or au-dessus du trait ivoire. */
  reign?: readonly [number, number] | null;
  /** Le temps ne s'applique pas à la vue : toute la masse en cramoisi, pas d'encoche. */
  off?: boolean;
  /** Années ponctuelles de la vue (années d'un lieu, résultats d'une recherche). */
  marks?: readonly FasceMark[];
  /**
   * La fasce en majesté (ordinateur seulement) : sa hauteur totale en `svh`. Le portail la
   * dresse à 45, la page introuvable à 30.
   */
  majesty?: number;
}

export type FascePriority = 'view' | 'cartel' | 'transient';

interface Entry {
  priority: FascePriority;
  layer: FasceLayer;
  order: number;
}

export interface FasceState {
  span: readonly [number, number] | null;
  reign: readonly [number, number] | null;
  off: boolean;
  marks: readonly FasceMark[];
  /** Hauteur de la fasce en majesté, en `svh` ; `null` : la fasce ordinaire. */
  majesty: number | null;
}

const RANK: Record<FascePriority, number> = { view: 0, cartel: 1, transient: 2 };
const EMPTY: FasceState = { span: null, reign: null, off: false, marks: [], majesty: null };

const entries = new Map<string, Entry>();
const listeners = new Set<() => void>();
let counter = 0;
let state: FasceState = EMPTY;

function compose(): FasceState {
  const sorted = [...entries.values()].sort((a, b) => RANK[a.priority] - RANK[b.priority] || a.order - b.order);
  let span: FasceState['span'] = null;
  let reign: FasceState['reign'] = null;
  let off = false;
  let majesty: number | null = null;
  const marks: FasceMark[] = [];
  for (const { layer } of sorted) {
    if (layer.span !== undefined && layer.span !== null) {
      span = layer.span;
      reign = layer.reign ?? null;
    }
    if (layer.off) off = true;
    if (layer.majesty) majesty = layer.majesty;
    if (layer.marks) marks.push(...layer.marks);
  }
  // Une entité ouverte au cartel rallume une fasce éteinte : sa durée est une donnée.
  const lit = sorted.some((entry) => entry.priority !== 'view' && entry.layer.span);
  return { span, reign, off: off && !lit, marks, majesty };
}

function publish(): void {
  state = entries.size === 0 ? EMPTY : compose();
  for (const listener of listeners) listener();
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

const getState = () => state;

/** La fasce telle que les vues la composent. */
export function useFasceState(): FasceState {
  return useSyncExternalStore(subscribe, getState, () => EMPTY);
}

/**
 * Déclare la couche d'une vue (ou du cartel). La couche suit les valeurs reçues et disparaît
 * au démontage. Passer un objet stable ou des valeurs simples : la couche est comparée par
 * son contenu sérialisé, pas par identité.
 */
export function useFasce(layer: FasceLayer, priority: FascePriority = 'view'): void {
  const id = useId();
  const key = JSON.stringify(layer);
  useEffect(() => {
    counter += 1;
    entries.set(id, { priority, layer: JSON.parse(key) as FasceLayer, order: counter });
    publish();
    return () => {
      entries.delete(id);
      publish();
    };
  }, [id, key, priority]);
}
