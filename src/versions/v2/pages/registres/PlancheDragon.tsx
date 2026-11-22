import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import type { CSSProperties, RefObject } from 'react';

import { dragons, getDragon } from '@/core/content/dragons';
import type { Dragon, DragonLook } from '@/core/content/types';
import { buildDragon } from '@/core/dragons/geometry';
import type { DragonGeometry } from '@/core/dragons/geometry';
import { formatSpan, useLang, useT, useTx } from '@/core/i18n';
import { DURATION, EASE, gsap, MOTION_CONDITIONS, useGSAP } from '@/core/motion';
import { DragonFigure, dragonSilhouette, layerPath } from '@/shared/dragon';

import { Fiabilite } from '../../components/Fiabilite';
import { Lien } from '../../components/Lien';
import { Titre } from '../../components/Titre';

import { ghostFor, rememberPlate } from './ghost';
import { usePhone } from './media';
import styles from './PlancheDragon.module.css';

/** La pose de `DragonFigure` par défaut : le contour et le fantôme doivent la reprendre exactement. */
const POSE = { flap: 0, bank: 0, neckCurve: 0.16, tailCurve: 0.34 } as const;
/** Ordinateur : l'envergure de Balerion vaut 1,6 largeur de fenêtre (spec §5.10). */
const DESKTOP_SPAN = 1.6;
/** Téléphone : Balerion mesure 2,4 hauteurs d'écran de la tête au bout de la queue. */
const PHONE_LENGTH = 2.4;

const geometries = new Map<string, DragonGeometry>();

function geometryOf(id: string, look: DragonLook): DragonGeometry {
  let geometry = geometries.get(id);
  if (!geometry) {
    geometry = buildDragon(look, POSE);
    geometries.set(id, geometry);
  }
  return geometry;
}

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
        current && Math.abs(current.width - rect.width) < 1 && Math.abs(current.height - rect.height) < 1
          ? current
          : { width: rect.width, height: rect.height },
      );
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(node);
    return () => observer.disconnect();
  }, []);
  return [ref, size];
}

interface Placed {
  geometry: DragonGeometry;
  /** Pixels par unité du tracé. */
  ppu: number;
  left: number;
  top: number;
  width: number;
  height: number;
}

/** Pixels pour une envergure de Balerion, selon l'écran. */
function unitPixels(phone: boolean, plateWidth: number): number {
  if (!phone) return DESKTOP_SPAN * plateWidth;
  const balerion = getDragon('balerion');
  const geometry = balerion ? geometryOf(balerion.id, balerion.look) : null;
  const viewport = window.innerHeight;
  return geometry ? (PHONE_LENGTH * viewport * geometry.metrics.wingspan) / geometry.box.height : PHONE_LENGTH * viewport;
}

function measureDragon(dragon: Dragon, unit: number): Omit<Placed, 'left' | 'top'> {
  const geometry = geometryOf(dragon.id, dragon.look);
  const ppu = (Math.max(0.02, dragon.look.span) * unit) / geometry.metrics.wingspan;
  return { geometry, ppu, width: geometry.box.width * ppu, height: geometry.box.height * ppu };
}

/** Hauteur de l'épaule sous le haut du cadre du tracé, en pixels. */
function shoulderDrop(placed: Omit<Placed, 'left' | 'top'>): number {
  return (placed.geometry.anchors.shoulder[1] - placed.geometry.box.y) * placed.ppu;
}

/**
 * Le contour d'un dragon en pointillé, à la même échelle : le tracé plein de la silhouette
 * est d'abord cerné d'un trait large en pointillé, puis rempli de sable, si bien que seule la
 * moitié extérieure du trait reste visible et que les coutures intérieures disparaissent.
 */
function Contour({ placed, tone, className }: { placed: Placed; tone: 'fantome' | 'estime'; className?: string }) {
  const d = layerPath(dragonSilhouette, placed.geometry.parts);
  const unit = 1 / placed.ppu;
  const box = placed.geometry.box;
  return (
    <svg
      className={`${styles.contour} ${className ?? ''}`}
      data-ton={tone}
      viewBox={`${box.x} ${box.y} ${box.width} ${box.height}`}
      style={{ left: placed.left, top: placed.top, width: placed.width, height: placed.height }}
      aria-hidden="true"
      focusable="false"
    >
      <path d={d} className={styles.trait} style={{ strokeWidth: (tone === 'fantome' ? 3 : 6) * unit, strokeDasharray: `${5 * unit} ${5 * unit}` }} />
      <path d={d} className={styles.fond} />
    </svg>
  );
}

/**
 * La planche d'un dragon (spec §5.10), premier écran de sa page : le dragon à l'échelle
 * commune de toutes les planches (Balerion déborde de l'écran, Syrax y tient), le fantôme du
 * dragon vu juste avant au même point d'épaule, le contour en pointillé si la taille n'est
 * pas dite par les livres, et la réserve d'obsidienne qui porte le nom et coupe le dessin.
 * Téléphone : tête en haut, mesuré au défilement.
 */
export function PlancheDragon({ dragon }: { dragon: Dragon }) {
  const t = useT();
  const tx = useTx();
  const { reading } = useLang();
  const phone = usePhone();
  const [ref, size] = useSize<HTMLDivElement>();
  const scope = useRef<HTMLDivElement>(null);
  const figureRef = useRef<HTMLDivElement>(null);
  const [ghostRef] = useState(() => ghostFor(dragon.id));
  const ghost = ghostRef ? getDragon(ghostRef.id) : undefined;

  useEffect(() => {
    rememberPlate(dragon.id);
  }, [dragon.id]);

  const layout = useMemo(() => {
    if (!size) return null;
    const unit = unitPixels(phone, size.width);
    const own = measureDragon(dragon, unit);
    const centerX = size.width * (phone ? 0.5 : 0.56);
    const plateHeight = phone ? own.height + 48 : size.height;
    const top = phone ? 24 : own.height <= size.height * 0.9 ? (size.height - own.height) / 2 : size.height * 0.05;
    const current: Placed = { ...own, left: centerX + own.geometry.box.x * own.ppu, top };
    const shoulderY = top + shoulderDrop(own);
    let shadow: Placed | null = null;
    if (ghost) {
      const other = measureDragon(ghost, unit);
      shadow = { ...other, left: centerX + other.geometry.box.x * other.ppu, top: shoulderY - shoulderDrop(other) };
    }
    return { current, shadow, plateHeight, shoulder: [centerX, shoulderY] as const };
  }, [size, phone, dragon, ghost]);

  // En passant d'une planche à l'autre, le dragon arrive à la taille du précédent puis prend
  // la sienne : on sent l'écart d'échelle. Mouvement réduit : la planche est posée.
  useGSAP(
    () => {
      const node = figureRef.current;
      if (!node || !layout || !ghost) return;
      const ratio = Math.min(2.5, Math.max(0.4, ghost.look.span / Math.max(0.02, dragon.look.span)));
      if (Math.abs(ratio - 1) < 0.04) return;
      const mm = gsap.matchMedia();
      mm.add(MOTION_CONDITIONS, (context) => {
        if (context.conditions?.reduced) return;
        const origin = `${layout.shoulder[0] - layout.current.left}px ${layout.shoulder[1] - layout.current.top}px`;
        gsap.fromTo(node, { scale: ratio, transformOrigin: origin }, { scale: 1, duration: DURATION.passage, ease: EASE.expo, delay: 0.12 });
      });
    },
    { scope, dependencies: [dragon.id, layout !== null] },
  );

  const index = dragons.findIndex((item) => item.id === dragon.id);
  const previous = index > 0 ? dragons[index - 1] : undefined;
  const next = index >= 0 && index < dragons.length - 1 ? dragons[index + 1] : undefined;
  const estimated = !dragon.look.attested.size;
  const years =
    dragon.hatched === null && dragon.died === null ? t('page.dragons.years.unknownAlive') : formatSpan(dragon.hatched, dragon.died, reading);

  const plateStyle: CSSProperties | undefined = phone && layout ? { height: layout.plateHeight } : undefined;

  return (
    <div ref={scope} className={styles.planche}>
      <div className={styles.reserve}>
        <Titre text={dragon.name} className={styles.titre}>
          {dragon.alias ? <p className={styles.alias}>{tx(dragon.alias)}</p> : null}
          <p className={styles.ligne}>
            <span className={styles.annees}>{years}</span>
            <Fiabilite level={dragon.reliability} />
          </p>
        </Titre>
        <div className={styles.notes}>
          <p className={styles.echelleNote} data-ecran="ordinateur">
            {t('v2.dragon.scale_note')}
          </p>
          <p className={styles.echelleNote} data-ecran="telephone">
            {t('v2.dragon.scale_note_phone')}
          </p>
          {estimated ? <p>{t('v2.dragon.size_estimated')}</p> : null}
          {ghost ? <p>{t(ghostRef?.previous ? 'v2.dragon.ghost' : 'v2.dragon.ghost_default', { name: tx(ghost.name) })}</p> : null}
        </div>
        <nav className={styles.pager} aria-label={t('page.dragon.pager')}>
          {previous ? (
            <Lien to={`/dragons/${previous.id}`} className={styles.pas}>
              <span>{t('page.dragon.previous')}</span>
              <span className={styles.pasNom}>{tx(previous.name)}</span>
            </Lien>
          ) : null}
          {next ? (
            <Lien to={`/dragons/${next.id}`} className={styles.pas}>
              <span>{t('page.dragon.next')}</span>
              <span className={styles.pasNom}>{tx(next.name)}</span>
            </Lien>
          ) : null}
        </nav>
      </div>
      <div ref={ref} className={styles.cadre} style={plateStyle}>
        {layout ? (
          <>
            {layout.shadow ? <Contour placed={layout.shadow} tone="fantome" /> : null}
            {estimated ? <Contour placed={layout.current} tone="estime" /> : null}
            <div
              ref={figureRef}
              className={styles.dragon}
              style={{ left: layout.current.left, top: layout.current.top, width: layout.current.width, height: layout.current.height }}
            >
              <DragonFigure
                look={dragon.look}
                title={t('page.dragon.plate.title', { name: tx(dragon.name) })}
                tone="specimen"
                ground="dark"
                detail="fine"
                unattested="bare"
              />
            </div>
          </>
        ) : null}
      </div>
    </div>
  );
}
