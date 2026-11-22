/**
 * L'échelle commune de la version, et la place de la fasce dans la fenêtre.
 *
 * Toutes les figures « fascé » (chroniques, personnages, dragons, guerres, apprendre) et le
 * profil de la colonne du parti s'alignent au pixel sur la fasce : elles lisent sa géométrie
 * par `useFasceGeometry()` et son échelle par `fasceScale(width)`.
 */
import { useSyncExternalStore } from 'react';

import { createTimeScale } from '@/core/timeline';
import type { TimeScale } from '@/core/timeline';

import { DOMAIN } from '../../state/scene';

const scales = new Map<number, TimeScale>();

/** L'échelle de la fasce pour une largeur en pixels, de 0 à `width`. Mémorisée par largeur. */
export function fasceScale(width: number): TimeScale {
  const key = Math.round(width);
  let scale = scales.get(key);
  if (!scale) {
    if (scales.size > 24) scales.clear();
    scale = createTimeScale({ domain: DOMAIN, range: [0, key] });
    scales.set(key, scale);
  }
  return scale;
}

export interface FasceGeometry {
  /** Bord gauche de la masse dans la fenêtre, en pixels. */
  left: number;
  /** Largeur de la masse : l'étendue de l'échelle. */
  width: number;
  /** Haut de la masse dans la fenêtre. */
  massTop: number;
  /** Hauteur de la masse (44 px sur ordinateur, 20 au téléphone). */
  massHeight: number;
}

let geometry: FasceGeometry | null = null;
const listeners = new Set<() => void>();

function same(a: FasceGeometry | null, b: FasceGeometry): boolean {
  return (
    a !== null &&
    Math.abs(a.left - b.left) < 0.5 &&
    Math.abs(a.width - b.width) < 0.5 &&
    Math.abs(a.massTop - b.massTop) < 0.5 &&
    Math.abs(a.massHeight - b.massHeight) < 0.5
  );
}

/** Écrit par la fasce quand elle se mesure. */
export function publishFasceGeometry(next: FasceGeometry): void {
  if (same(geometry, next)) return;
  geometry = next;
  for (const listener of listeners) listener();
}

/** Lecture ponctuelle, hors React (le feu). */
export function readFasceGeometry(): FasceGeometry | null {
  return geometry;
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

/** La place de la fasce, tenue à jour au redimensionnement. `null` avant la première mesure. */
export function useFasceGeometry(): FasceGeometry | null {
  return useSyncExternalStore(subscribe, readFasceGeometry, () => null);
}
