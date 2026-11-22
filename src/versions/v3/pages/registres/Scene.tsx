/*
 * Copie adaptée de `LieuxScene` de la V2 (src/versions/v2/pages/registres/LieuxScene.tsx), avec
 * ses corrections (cadre par défaut sur la baie de la Néra, Valyria au bord ; carte qui commence
 * au bord de la colonne ; nom du lieu choisi en ivoire, porté par `Carte`). Différence : la scène
 * est montée une fois par le parent commun de `/lieux` et `/lieux/:placeId` (v3-spec §6.12) ;
 * passer d'un lieu à l'autre recadre la carte, elle ne se remonte pas.
 */
import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import type { ReactNode, RefObject } from 'react';

import { useT } from '@/core/i18n';
import type { MapBounds, MapFrame } from '@/shared/map';
import { Carte } from '@/versions/v2/components/Carte';

import { DESKTOP, useMedia } from '../../components/common/useMedia';
import styles from './Scene.module.css';

export { boundsAround, boundsAroundPlaces, DEFAULT_BOUNDS, PHONE_BOUNDS } from '@/versions/v2/pages/registres/LieuxScene';

interface Size {
  width: number;
  height: number;
}

function useSize<T extends HTMLElement>(): [RefObject<T | null>, Size | null] {
  const ref = useRef<T>(null);
  const [size, setSize] = useState<Size | null>(null);
  useLayoutEffect(() => {
    const node = ref.current;
    if (!node) return;
    const measure = () => {
      const rect = node.getBoundingClientRect();
      setSize((current) =>
        current && Math.abs(current.width - rect.width) < 1 && Math.abs(current.height - rect.height) < 1 ? current : { width: rect.width, height: rect.height },
      );
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(node);
    return () => observer.disconnect();
  }, []);
  return [ref, size];
}

/** Le cadre qui montre `bounds` dans la part de carte visible. */
function frameFor(bounds: MapBounds, map: Size): MapFrame {
  const [x0, y0, x1, y1] = bounds;
  const unit = Math.max((x1 - x0) / Math.max(80, map.width), (y1 - y0) / Math.max(80, map.height));
  return { center: [(x0 + x1) / 2, (y0 + y1) / 2], width: unit * map.width };
}

interface SceneProps {
  /** La colonne : titre et liste, ou notice. */
  children: ReactNode;
  bounds: MapBounds;
  phoneBounds?: MapBounds;
  placeIds?: readonly string[];
  highlightIds: ReadonlySet<string> | null;
  selectedId: string | null;
  mapTitle: string;
  /** Nom accessible de la colonne. */
  label: string;
}

/**
 * La scène des lieux, champ plein : la carte collante entre la ligne haute et la fasce, et la
 * colonne de gauche, réserve d'obsidienne opaque, qui défile à côté. Téléphone : la carte en
 * tête (55 svh), sans geste propre, et « plein écran » qui l'ouvre dans un `dialog`.
 */
export function Scene({ children, bounds, phoneBounds, placeIds, highlightIds, selectedId, mapTitle, label }: SceneProps) {
  const t = useT();
  const [mapRef, map] = useSize<HTMLDivElement>();
  const dialog = useRef<HTMLDialogElement>(null);
  const [full, setFull] = useState(false);
  const phone = !useMedia(DESKTOP);

  const target = useMemo(() => (map ? frameFor(phone ? (phoneBounds ?? bounds) : bounds, map) : undefined), [bounds, phoneBounds, map, phone]);
  const [frame, setFrame] = useState<MapFrame | undefined>(undefined);

  useEffect(() => {
    if (!target) return;
    const id = window.requestAnimationFrame(() => setFrame(target));
    return () => window.cancelAnimationFrame(id);
  }, [target]);

  useEffect(() => {
    const node = dialog.current;
    if (!node) return;
    if (full && !node.open) node.showModal();
    if (!full && node.open) node.close();
  }, [full]);

  return (
    <div className={styles.scene}>
      <div ref={mapRef} className={styles.carte} data-annee={highlightIds ? '' : undefined}>
        <Carte title={mapTitle} placeIds={placeIds} highlightIds={highlightIds} selectedId={selectedId} frame={frame} />
        <button type="button" className={styles.pleinEcran} onClick={() => setFull(true)}>
          {t('v2.map.fullscreen')}
        </button>
      </div>
      <section className={styles.colonne} aria-label={label}>
        {children}
      </section>
      <dialog ref={dialog} className={styles.dialogue} aria-label={mapTitle} onClose={() => setFull(false)}>
        {full ? (
          <div className={styles.dialogueCarte}>
            <Carte title={mapTitle} placeIds={placeIds} highlightIds={highlightIds} selectedId={selectedId} frame={map ? frameFor(bounds, map) : undefined} />
          </div>
        ) : null}
        <button type="button" className={styles.fermer} onClick={() => setFull(false)}>
          {t('action.close')}
        </button>
      </dialog>
    </div>
  );
}
