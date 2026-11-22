import { useCallback, useMemo } from 'react';
import type { MouseEvent as ReactMouseEvent } from 'react';

import { mapAvailable, mapData, places as allPlaces } from '@/core/content/places';
import { useT, useTitle, useTx, VALYRIAN_TAG } from '@/core/i18n';
import { boundsOfPoints, WorldMap } from '@/shared/map';
import type { MapFrame, WorldMapPlace } from '@/shared/map';

import { rememberOpener } from '../state/entities';
import { useLienHref } from '../state/links';
import { useVoir } from '../state/useVoir';

import { isModifiedClick } from './numerals';
import styles from './Carte.module.css';

interface CarteProps {
  /** Nom accessible de la carte, déjà traduit. */
  title: string;
  /** Lieux à poser ; par défaut tous. */
  placeIds?: readonly string[];
  /** Lieux sur lesquels cadrer ; par défaut ceux qui sont posés. */
  frameIds?: readonly string[];
  /** Lieux de l'année réglée : les autres s'effacent à demi. */
  highlightIds?: ReadonlySet<string> | null;
  selectedId?: string | null;
  /** Repère écrit dans le signe d'un lieu (numéro d'ordre d'une bataille). */
  marks?: ReadonlyMap<string, string>;
  frame?: MapFrame;
  className?: string;
}

/**
 * La carte peinte de la V2 (spec §3.1) : mer d'obsidienne sans hachure, terres de suie, côtes
 * de cendre, noms en Texturina italique. Un lieu est un vrai lien vers sa fiche ; le clic
 * simple ouvre son cartel sans quitter la lecture.
 */
export function Carte({ title, placeIds, frameIds, highlightIds = null, selectedId = null, marks, frame, className }: CarteProps) {
  const t = useT();
  const tx = useTx();
  const name = useTitle();
  const href = useLienHref();
  const { open } = useVoir();

  const shown = useMemo(() => {
    const wanted = placeIds ? new Set(placeIds) : null;
    return allPlaces.filter((place) => !wanted || wanted.has(place.id));
  }, [placeIds]);

  const mapPlaces = useMemo<WorldMapPlace[]>(
    () =>
      shown.map((place) => {
        const label = name(place.name);
        return {
          id: place.id,
          name: label.primary,
          nameLang: label.isHv ? VALYRIAN_TAG : undefined,
          kind: place.kind,
          coord: place.coord,
          href: href(`/lieux/${place.id}`),
          mark: marks?.get(place.id),
          detail: tx(place.region),
        };
      }),
    [shown, name, href, tx, marks],
  );

  const framed = useMemo<MapFrame | undefined>(() => {
    if (frame) return frame;
    const ids = frameIds ? new Set(frameIds) : null;
    const points = shown.filter((place) => !ids || ids.has(place.id)).map((place) => place.coord);
    if (points.length === 0 || (!placeIds && !frameIds)) return undefined;
    const bounds = boundsOfPoints(points);
    return bounds ? { bounds, pad: 0.22 } : undefined;
  }, [frame, frameIds, placeIds, shown]);

  const onActivate = useCallback(
    (id: string, event: ReactMouseEvent<Element>) => {
      if (isModifiedClick(event)) return;
      event.preventDefault();
      rememberOpener(event.currentTarget instanceof HTMLElement ? event.currentTarget : null);
      open({ kind: 'place', id });
    },
    [open],
  );

  const labels = useMemo(
    () => ({ title, zoomIn: t('page.map.zoomIn'), zoomOut: t('page.map.zoomOut'), reset: t('page.map.reset'), help: t('page.map.help') }),
    [t, title],
  );

  if (!mapAvailable) return null;

  return (
    <div className={`${styles.carte} ${className ?? ''}`}>
      <WorldMap
        map={mapData}
        places={mapPlaces}
        labels={labels}
        frame={framed}
        selectedId={selectedId}
        highlightIds={highlightIds}
        onActivate={onActivate}
        showRegions
        hit={44}
      />
    </div>
  );
}
