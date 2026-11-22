import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import type { ReactNode, RefObject } from 'react';

import { useT } from '@/core/i18n';
import type { MapBounds, MapFrame } from '@/shared/map';

import { Carte } from '../../components/Carte';

import { usePhone } from './media';
import styles from './LieuxScene.module.css';

/**
 * La baie de la Néra (Peyredragon, Port-Réal, Accalmie), Valyria au bord, pas le Nord (spec §5.12).
 * Le bord sud passe sous Valyria (1312) pour qu'elle soit vraiment à l'écran, le bord ouest à
 * l'ouest de Harrenhal (417) pour que la baie ne colle pas au bord (audit V2).
 */
export const DEFAULT_BOUNDS: MapBounds = [360, 620, 1420, 1370];

/** Téléphone : la baie de la Néra seule, de Harrenhal à Accalmie. */
export const PHONE_BOUNDS: MapBounds = [380, 640, 640, 880];

/** Le cadre d'un lieu : assez large pour que ses voisins le situent. */
export function boundsAround(coord: readonly [number, number], half = 150): MapBounds {
  return [coord[0] - half, coord[1] - half * 0.8, coord[0] + half, coord[1] + half * 0.8];
}

/** Le cadre de plusieurs lieux, avec du champ autour ; `null` s'il n'y en a aucun. */
export function boundsAroundPlaces(coords: readonly (readonly [number, number])[]): MapBounds | null {
  if (coords.length === 0) return null;
  const xs = coords.map((coord) => coord[0]);
  const ys = coords.map((coord) => coord[1]);
  const cx = (Math.min(...xs) + Math.max(...xs)) / 2;
  const cy = (Math.min(...ys) + Math.max(...ys)) / 2;
  const w = Math.max(320, (Math.max(...xs) - Math.min(...xs)) * 1.5);
  const h = Math.max(240, (Math.max(...ys) - Math.min(...ys)) * 1.5);
  return [cx - w / 2, cy - h / 2, cx + w / 2, cy + h / 2];
}

/**
 * Le dernier cadre montré, gardé d'une vue des lieux à l'autre : la vue suivante part de lui
 * et se recadre, au lieu d'apparaître d'un coup.
 */
let lastFrame: MapFrame | undefined;

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

/**
 * Le cadre qui montre `bounds` dans la carte. Sur ordinateur, la carte commence au bord de la
 * colonne (LieuxScene.module.css) : décaler le centre sous la colonne poussait le cadre hors du
 * monde dessiné, que `WorldMap` borne, et la baie de la Néra restait collée à la colonne.
 */
function frameFor(bounds: MapBounds, map: Size): MapFrame {
  const [x0, y0, x1, y1] = bounds;
  const unit = Math.max((x1 - x0) / Math.max(80, map.width), (y1 - y0) / Math.max(80, map.height));
  return { center: [(x0 + x1) / 2, (y0 + y1) / 2], width: unit * map.width };
}

interface LieuxSceneProps {
  /** La colonne : titre et liste, ou notice. */
  children: ReactNode;
  /** Ce que la carte doit montrer, hors de la colonne. */
  bounds: MapBounds;
  /** Au téléphone, la carte est étroite : un cadre plus serré, si la vue en a un. */
  phoneBounds?: MapBounds;
  placeIds?: readonly string[];
  highlightIds: ReadonlySet<string> | null;
  selectedId: string | null;
  mapTitle: string;
}

/**
 * La scène des lieux (spec §5.12), champ plein : la carte sur tout le champ, collante entre
 * la ligne haute et la fasce, et la colonne de gauche, réserve d'obsidienne opaque, qui défile
 * par-dessus. La carte se cadre sur ce qu'on lui demande dans la part que la colonne laisse
 * libre, et part du cadre de la vue précédente pour s'y recadrer. Téléphone : la carte fixe
 * en tête, sans geste propre, et un bouton « plein écran » qui l'ouvre dans un `dialog`.
 */
export function LieuxScene({ children, bounds, phoneBounds, placeIds, highlightIds, selectedId, mapTitle }: LieuxSceneProps) {
  const t = useT();
  const [mapRef, map] = useSize<HTMLDivElement>();

  const dialog = useRef<HTMLDialogElement>(null);
  const [full, setFull] = useState(false);
  const phone = usePhone();

  const target = useMemo(
    () => (map ? frameFor(phone ? (phoneBounds ?? bounds) : bounds, map) : undefined),
    [bounds, phoneBounds, map, phone],
  );
  const [frame, setFrame] = useState<MapFrame | undefined>(lastFrame);

  useEffect(() => {
    if (!target) return;
    const id = window.requestAnimationFrame(() => setFrame(target));
    lastFrame = target;
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
      <div className={styles.colonne}>
        {children}
      </div>
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
