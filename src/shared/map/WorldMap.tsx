import { useCallback, useEffect, useId, useLayoutEffect, useMemo, useRef, useState } from 'react';
import type { KeyboardEvent, MouseEvent as ReactMouseEvent, PointerEvent as ReactPointerEvent } from 'react';

import type { MapData, PlaceKind } from '@/core/content/types';
import { useTx } from '@/core/i18n';
import { DURATION, EASE, gsap } from '@/core/motion';
import { prefersReducedMotion } from '@/core/motion/reducedMotion';

import { estimateTextWidth, glyphBox, labelShift, placeLabels } from './labels';
import type { Box, LabelCandidate, PlacedLabel } from './labels';
import { MapBase } from './MapBase';
import { boundsOfViewBox, clampView, viewBoxOf, viewContains, viewOfFrame, zoomAt } from './view';
import type { MapFrame, MapView } from './view';
import styles from './WorldMap.module.css';
import { withBase } from '@/app/paths';

/** Un lieu posé sur la carte. Les textes arrivent traduits : la carte ne connaît pas les clés d'interface. */
export interface WorldMapPlace {
  id: string;
  name: string;
  /** Attribut `lang` du nom (forme valyrienne, par exemple). */
  nameLang?: string;
  kind: PlaceKind;
  coord: readonly [number, number];
  /** Adresse du lieu : le signe devient un lien. */
  href?: string;
  /** Repère écrit dans le signe (numéro d'ordre d'une bataille). */
  mark?: string;
  /** Importance du nom quand la place manque : plus grand, écrit en premier. */
  priority?: number;
  /** Complément du nom accessible (genre, région, année). */
  detail?: string;
}

/** Textes des commandes, traduits par l'appelant. */
export interface WorldMapLabels {
  title: string;
  zoomIn: string;
  zoomOut: string;
  reset: string;
  /** Mode d'emploi au clavier et à la souris, lu par les lecteurs d'écran. */
  help: string;
}

export interface WorldMapProps {
  map: Readonly<MapData>;
  places: readonly WorldMapPlace[];
  labels: WorldMapLabels;
  /** Ce qu'il faut montrer. Par défaut, toute la carte. Le changer recadre en douceur. */
  frame?: MapFrame;
  /** Lieu mis en avant (encre rouge, nom toujours écrit). */
  selectedId?: string | null;
  /** Si donné, les autres lieux s'effacent à demi. */
  highlightIds?: ReadonlySet<string> | null;
  /** Clic ou Entrée sur un lieu. L'appelant navigue (et appelle `preventDefault`). */
  onActivate?: (id: string, event: ReactMouseEvent<Element>) => void;
  /** Survol ou focus d'un lieu ; `null` en sortant. */
  onHover?: (id: string | null) => void;
  /** Noms des régions et des mers. */
  showRegions?: boolean;
  showSeas?: boolean;
  /** Lignes de crête tracées comme un mur. */
  wallIds?: readonly string[];
  /**
   * Diamètre de la zone de toucher d'un signe, en pixels d'écran (22 par défaut). 44 pour
   * une carte qu'on touche du doigt (audit V2 n° 17) : la zone déborde le signe, pas le dessin.
   */
  hit?: number;
  className?: string;
}

const DEFAULT_WALLS = ['le-mur'];

/** Clé de comparaison de deux noms : sans casse, sans accents, sans article initial. */
function sameName(text: string): string {
  return text
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .toLowerCase()
    .replace(/^(?:la |le |les |l'|l’|the )/, '')
    .trim();
}

const ZOOM_STEP = 1.6;
const PAN_STEP = 0.14;
const DRAG_THRESHOLD = 4;
/** Corps des noms, en pixels. */
const PLACE_SIZE = 12.5;
const MARK_SIZE = 10.5;
const REGION_SIZE = 13;
const SEA_SIZE = 12;
/** Espacement des hachures de la mer, en pixels d'écran. */
const HATCH_PX = 4.2;
/** Rang des noms de contrées et de mers face aux noms de lieux (voir KIND_RANK). */
const REGION_PRIORITY = 4.6;
const SEA_PRIORITY = 3.6;

const KIND_RANK: Record<PlaceKind, number> = {
  cite: 6,
  'cite-libre': 5,
  forteresse: 4,
  'champ-de-bataille': 3,
  ruine: 2,
  ile: 2,
  region: 1,
};

/**
 * La carte gravée de Westeros et de l'ouest d'Essos, commune aux trois versions.
 *
 * Elle rend `MapData` en SVG (mer hachurée, lignes d'eau, côtes, fleuves, reliefs, noms)
 * et pose les lieux comme des liens accessibles au clavier. On s'y déplace au glisser, au
 * pincement, aux flèches ; on s'approche par les boutons, les touches + et −, ou la molette
 * avec Ctrl (la molette seule fait défiler la page, comme partout ailleurs).
 *
 * Tout l'habillage passe par des variables CSS (`--map-*`, voir WorldMap.module.css) : chaque
 * version donne sa couleur de mer, d'encre, de papier, ses polices.
 */
export function WorldMap({
  map,
  places,
  labels,
  frame,
  selectedId = null,
  highlightIds = null,
  onActivate,
  onHover,
  showRegions = true,
  showSeas = true,
  wallIds = DEFAULT_WALLS,
  hit = 22,
  className,
}: WorldMapProps) {
  const tx = useTx();
  const uid = `m${useId().replace(/[^a-zA-Z0-9]/g, '')}`;
  const wrap = useRef<HTMLDivElement>(null);
  const svg = useRef<SVGSVGElement>(null);
  const [size, setSize] = useState<{ width: number; height: number } | null>(null);
  const [view, setView] = useState<MapView | null>(null);
  const viewRef = useRef<MapView | null>(null);
  viewRef.current = view;
  const tween = useRef<gsap.core.Tween | null>(null);

  const mapBounds = useMemo(() => boundsOfViewBox(map.viewBox), [map.viewBox]);
  const aspect = size ? size.width / Math.max(size.height, 1) : map.viewBox[2] / map.viewBox[3];
  const fullFrame = useMemo<MapFrame>(() => ({ bounds: mapBounds, pad: 0 }), [mapBounds]);
  const target = frame ?? fullFrame;
  const frameKey = JSON.stringify(target);

  /* ------------------------------------------------------------ mesure du cadre */
  useLayoutEffect(() => {
    const element = wrap.current;
    if (!element) return;
    const measure = (width: number, height: number) => {
      if (width < 10 || height < 10) return;
      setSize((current) => (current && current.width === width && current.height === height ? current : { width, height }));
    };
    const rect = element.getBoundingClientRect();
    measure(Math.round(rect.width), Math.round(rect.height));
    const observer = new ResizeObserver(([entry]) => {
      if (entry) measure(Math.round(entry.contentRect.width), Math.round(entry.contentRect.height));
    });
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  /* ------------------------------------------------------------ recadrage demandé */
  const goTo = useCallback(
    (next: MapView, animate: boolean) => {
      tween.current?.kill();
      const from = viewRef.current;
      if (!animate || !from || prefersReducedMotion()) {
        setView(next);
        return;
      }
      const proxy = { ...from };
      tween.current = gsap.to(proxy, {
        cx: next.cx,
        cy: next.cy,
        w: next.w,
        duration: DURATION.passage,
        ease: EASE.expo,
        onUpdate: () => setView({ ...proxy }),
      });
    },
    [],
  );

  const lastFrame = useRef<string | null>(null);
  useLayoutEffect(() => {
    if (!size) return;
    const next = viewOfFrame(target, mapBounds, aspect);
    const first = lastFrame.current === null;
    if (first || lastFrame.current !== frameKey) {
      goTo(next, !first);
      lastFrame.current = frameKey;
      return;
    }
    // Même cadre, autre taille d'écran : on garde le centre, on ramène dans la carte.
    setView((current) => (current ? clampView(current, mapBounds, aspect) : next));
    // `target` est décrit par `frameKey`.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [size, frameKey, mapBounds, aspect, goTo]);

  useEffect(() => () => void tween.current?.kill(), []);

  const update = useCallback(
    (fn: (current: MapView) => MapView) => {
      tween.current?.kill();
      setView((current) => (current ? clampView(fn(current), mapBounds, aspect) : current));
    },
    [mapBounds, aspect],
  );

  /* ------------------------------------------------------------ gestes */
  const pointers = useRef(new Map<number, { x: number; y: number }>());
  const drag = useRef<{ moved: boolean; pinch: number | null }>({ moved: false, pinch: null });

  const toMap = useCallback(
    (clientX: number, clientY: number): [number, number] | null => {
      const element = svg.current;
      const current = viewRef.current;
      if (!element || !current || !size) return null;
      const rect = element.getBoundingClientRect();
      const [x, y, w, h] = viewBoxOf(current, aspect);
      return [x + ((clientX - rect.left) / rect.width) * w, y + ((clientY - rect.top) / rect.height) * h];
    },
    [aspect, size],
  );

  const onPointerDown = (event: ReactPointerEvent<SVGSVGElement>) => {
    if (event.pointerType === 'mouse' && event.button !== 0) return;
    pointers.current.set(event.pointerId, { x: event.clientX, y: event.clientY });
    drag.current = { moved: false, pinch: null };
    if (pointers.current.size === 2) {
      const [a, b] = [...pointers.current.values()];
      if (a && b) drag.current.pinch = Math.hypot(a.x - b.x, a.y - b.y);
    }
  };

  const onPointerMove = (event: ReactPointerEvent<SVGSVGElement>) => {
    const last = pointers.current.get(event.pointerId);
    if (!last || !size) return;
    const dx = event.clientX - last.x;
    const dy = event.clientY - last.y;
    if (!drag.current.moved && Math.hypot(dx, dy) < DRAG_THRESHOLD) return;
    if (!drag.current.moved) {
      drag.current.moved = true;
      svg.current?.setPointerCapture(event.pointerId);
    }
    pointers.current.set(event.pointerId, { x: event.clientX, y: event.clientY });

    if (pointers.current.size === 2 && drag.current.pinch) {
      const [a, b] = [...pointers.current.values()];
      if (!a || !b) return;
      const distance = Math.hypot(a.x - b.x, a.y - b.y);
      const at = toMap((a.x + b.x) / 2, (a.y + b.y) / 2);
      const k = distance / drag.current.pinch;
      drag.current.pinch = distance;
      if (at) update((current) => zoomAt(current, k, at));
      return;
    }
    update((current) => {
      const ppu = size.width / current.w;
      return { ...current, cx: current.cx - dx / ppu, cy: current.cy - dy / ppu };
    });
  };

  const onPointerUp = (event: ReactPointerEvent<SVGSVGElement>) => {
    pointers.current.delete(event.pointerId);
    if (pointers.current.size < 2) drag.current.pinch = null;
  };

  // Un glisser ne doit pas valoir un clic sur le lieu où il s'achève.
  const onClickCapture = (event: ReactMouseEvent) => {
    if (drag.current.moved) {
      event.preventDefault();
      event.stopPropagation();
      drag.current.moved = false;
    }
  };

  // La molette fait défiler la page ; avec Ctrl (ou le pincement du pavé tactile), elle zoome.
  useEffect(() => {
    const element = svg.current;
    if (!element) return;
    const onWheel = (event: WheelEvent) => {
      if (!event.ctrlKey && !event.metaKey) return;
      event.preventDefault();
      const at = toMap(event.clientX, event.clientY);
      if (!at) return;
      const k = Math.exp(-event.deltaY * 0.0022);
      update((current) => zoomAt(current, k, at));
    };
    element.addEventListener('wheel', onWheel, { passive: false });
    return () => element.removeEventListener('wheel', onWheel);
  }, [toMap, update]);

  const zoomBy = (k: number) => update((current) => zoomAt(current, k, [current.cx, current.cy]));
  const reset = () => goTo(viewOfFrame(target, mapBounds, aspect), true);

  const onKeyDown = (event: KeyboardEvent<SVGSVGElement>) => {
    if (event.target !== event.currentTarget) return;
    const pan = (fx: number, fy: number) => update((current) => ({ ...current, cx: current.cx + fx * current.w * PAN_STEP, cy: current.cy + fy * current.w * PAN_STEP }));
    const actions: Record<string, () => void> = {
      ArrowLeft: () => pan(-1, 0),
      ArrowRight: () => pan(1, 0),
      ArrowUp: () => pan(0, -1),
      ArrowDown: () => pan(0, 1),
      '+': () => zoomBy(ZOOM_STEP),
      '=': () => zoomBy(ZOOM_STEP),
      '-': () => zoomBy(1 / ZOOM_STEP),
      '0': reset,
    };
    const action = actions[event.key];
    if (!action) return;
    event.preventDefault();
    action();
  };

  // Un lieu atteint au clavier hors du cadre : la carte va le chercher.
  const onPlaceFocus = (place: WorldMapPlace) => {
    onHover?.(place.id);
    const current = viewRef.current;
    if (current && !viewContains(current, aspect, place.coord, 0.08)) {
      goTo(clampView({ ...current, cx: place.coord[0], cy: place.coord[1] }, mapBounds, aspect), true);
    }
  };

  /* ------------------------------------------------------------ noms */
  const ppu = view && size ? size.width / view.w : 1;
  const viewBox = view && size ? viewBoxOf(view, aspect) : map.viewBox;

  const placed = useMemo(() => {
    if (!view || !size) return new Map<string, PlacedLabel>();
    const [vx, vy] = viewBoxOf(view, aspect);
    const toScreen = (coord: readonly [number, number]) => [(coord[0] - vx) * ppu, (coord[1] - vy) * ppu] as const;
    const obstacles: Box[] = [];
    // Les commandes, en haut à droite, ne sont pas recouvertes.
    obstacles.push({ x0: size.width - 210, y0: 0, x1: size.width, y1: 64 });
    const candidates: LabelCandidate[] = places
      .filter((place) => !highlightIds || highlightIds.has(place.id) || place.id === selectedId)
      .map((place) => {
        const [x, y] = toScreen(place.coord);
        return {
          id: place.id,
          x: x + (place.mark ? 4 : 0),
          y,
          glyph: glyphBox(x, y, place.mark ? markRadius(place.mark) + 0.5 : 5),
          width: estimateTextWidth(place.name, PLACE_SIZE),
          height: PLACE_SIZE * 1.3,
          priority: (place.id === selectedId ? 1000 : 0) + (place.mark ? 500 : 0) + (place.priority ?? KIND_RANK[place.kind]),
        };
      });
    // Régions et mers concourent avec les lieux : un nom de contrée cède devant une cité.
    const fixed = (id: string, at: readonly [number, number], text: string, fontSize: number, priority: number): LabelCandidate => {
      const [x, y] = toScreen(at);
      return { id, x, y: y - fontSize * 0.36, width: estimateTextWidth(text, fontSize), height: fontSize * 1.2, priority, anchor: 'center' };
    };
    // Une mer ou une contrée qui porte le nom d'un lieu posé (la baie de la Néra, lieu d'une
    // bataille) n'est écrite qu'une fois : par le lieu.
    const named = new Set(places.map((place) => sameName(place.name)));
    const free = (text: string) => !named.has(sameName(text));
    if (showRegions) for (const region of map.regions) if (free(tx(region.name))) candidates.push(fixed(`region:${region.id}`, region.at, tx(region.name), REGION_SIZE, REGION_PRIORITY));
    if (showSeas) for (const sea of map.seas) if (free(tx(sea.name))) candidates.push(fixed(`sea:${sea.id}`, sea.at, tx(sea.name), SEA_SIZE, SEA_PRIORITY));
    return placeLabels(candidates, size, obstacles);
  }, [view, size, aspect, ppu, places, highlightIds, selectedId, map.regions, map.seas, showRegions, showSeas, tx]);

  const ready = view !== null && size !== null;
  const hatch = HATCH_PX / ppu;

  return (
    <div ref={wrap} className={`${styles.map} ${className ?? ''}`} data-ready={ready || undefined}>
      <svg
        ref={svg}
        className={styles.svg}
        viewBox={viewBox.join(' ')}
        preserveAspectRatio="xMidYMid slice"
        tabIndex={0}
        aria-labelledby={`${uid}-title`}
        aria-describedby={`${uid}-help`}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        onClickCapture={onClickCapture}
        onKeyDown={onKeyDown}
      >
        <title id={`${uid}-title`}>{labels.title}</title>
        <desc id={`${uid}-help`}>{labels.help}</desc>
        <defs>
          <pattern id={`${uid}-hatch`} patternUnits="userSpaceOnUse" width={hatch * 8} height={hatch}>
            <line className={styles.hatchLine} x1={0} x2={hatch * 8} y1={hatch / 2} y2={hatch / 2} vectorEffect="non-scaling-stroke" />
          </pattern>
        </defs>

        <rect className={styles.sea} x={mapBounds[0] - 4000} y={mapBounds[1] - 4000} width={mapBounds[2] - mapBounds[0] + 8000} height={mapBounds[3] - mapBounds[1] + 8000} />
        <rect fill={`url(#${uid}-hatch)`} x={mapBounds[0] - 4000} y={mapBounds[1] - 4000} width={mapBounds[2] - mapBounds[0] + 8000} height={mapBounds[3] - mapBounds[1] + 8000} />

        <MapBase map={map} uid={uid} wallIds={wallIds} />

        {ready ? (
          <g className={styles.names} aria-hidden="true">
            {showSeas
              ? map.seas.filter((sea) => placed.has(`sea:${sea.id}`)).map((sea) => (
                  <text key={sea.id} className={styles.seaName} transform={`translate(${sea.at[0]} ${sea.at[1]}) scale(${1 / ppu})`} fontSize={SEA_SIZE} textAnchor="middle">
                    {tx(sea.name)}
                  </text>
                ))
              : null}
            {showRegions
              ? map.regions.filter((region) => placed.has(`region:${region.id}`)).map((region) => (
                  <text key={region.id} className={styles.regionName} transform={`translate(${region.at[0]} ${region.at[1]}) scale(${1 / ppu})`} fontSize={REGION_SIZE} textAnchor="middle">
                    {tx(region.name)}
                  </text>
                ))
              : null}
          </g>
        ) : null}

        {ready ? (
          <g className={styles.places}>
            {places.map((place) => {
              const label = placed.get(place.id);
              const muted = highlightIds !== null && !highlightIds.has(place.id) && place.id !== selectedId;
              const accessible = place.detail ? `${place.name}, ${place.detail}` : place.name;
              const body = (
                <>
                  <circle className={styles.hit} r={Math.max(hit / 2, place.mark ? markRadius(place.mark) + 4 : 11)} />
                  <PlaceGlyph kind={place.kind} mark={place.mark} />
                  <circle className={styles.focusRing} r={place.mark ? markRadius(place.mark) + 3.5 : 10} />
                  {label ? (
                    <text
                      className={styles.placeName}
                      x={labelX(label.side, place.mark ? markRadius(place.mark) + 5.5 : 7)}
                      y={PLACE_SIZE * 0.36 + labelShift(label.side, PLACE_SIZE * 1.3)}
                      fontSize={PLACE_SIZE}
                      textAnchor={label.side === 'right' ? 'start' : label.side === 'left' ? 'end' : 'middle'}
                      lang={place.nameLang}
                    >
                      {place.name}
                    </text>
                  ) : null}
                </>
              );
              const common = {
                className: styles.place,
                transform: `translate(${place.coord[0]} ${place.coord[1]}) scale(${1 / ppu})`,
                'data-kind': place.kind,
                'data-selected': place.id === selectedId || undefined,
                'data-muted': muted || undefined,
                'data-marked': place.mark ? true : undefined,
              };
              if (!place.href) {
                return (
                  <g key={place.id} {...common} role="img" aria-label={accessible}>
                    {body}
                  </g>
                );
              }
              return (
                <a
                  key={place.id}
                  {...common}
                  href={withBase(place.href)}
                  aria-label={accessible}
                  aria-current={place.id === selectedId ? 'location' : undefined}
                  onClick={(event) => onActivate?.(place.id, event)}
                  onPointerEnter={() => onHover?.(place.id)}
                  onPointerLeave={() => onHover?.(null)}
                  onFocus={() => onPlaceFocus(place)}
                  onBlur={() => onHover?.(null)}
                >
                  <title>{accessible}</title>
                  {body}
                </a>
              );
            })}
          </g>
        ) : null}
      </svg>

      <div className={styles.controls}>
        <button type="button" className={styles.control} onClick={() => zoomBy(ZOOM_STEP)} aria-label={labels.zoomIn} title={labels.zoomIn}>
          <svg viewBox="0 0 16 16" aria-hidden="true" className={styles.controlGlyph}>
            <path d="M3 8h10M8 3v10" />
          </svg>
        </button>
        <button type="button" className={styles.control} onClick={() => zoomBy(1 / ZOOM_STEP)} aria-label={labels.zoomOut} title={labels.zoomOut}>
          <svg viewBox="0 0 16 16" aria-hidden="true" className={styles.controlGlyph}>
            <path d="M3 8h10" />
          </svg>
        </button>
        <button type="button" className={`${styles.control} ${styles.controlText}`} onClick={reset}>
          {labels.reset}
        </button>
      </div>
    </div>
  );
}

/** Rayon du rond d'un repère numéroté : il s'élargit quand plusieurs numéros s'y logent. */
function markRadius(mark: string): number {
  return Math.max(9.5, mark.length * 3.1 + 4.5);
}

function labelX(side: PlacedLabel['side'], gap: number): number {
  if (side === 'right') return gap;
  if (side === 'left') return -gap;
  return 0;
}

/** Signe d'un lieu, en pixels : chaque genre a sa forme, la couleur ne porte jamais seule le sens. */
function PlaceGlyph({ kind, mark }: { kind: PlaceKind; mark?: string }) {
  if (mark) {
    return (
      <g className={styles.glyphMark}>
        <circle r={markRadius(mark)} />
        <text y={MARK_SIZE * 0.36} fontSize={MARK_SIZE} textAnchor="middle">
          {mark}
        </text>
      </g>
    );
  }
  switch (kind) {
    case 'cite':
      return <circle className={styles.glyphFill} r={3.6} />;
    case 'cite-libre':
      return (
        <g>
          <circle className={styles.glyphLine} r={4.4} />
          <circle className={styles.glyphFill} r={1.7} />
        </g>
      );
    case 'forteresse':
      return <rect className={styles.glyphFill} x={-3.3} y={-3.3} width={6.6} height={6.6} />;
    case 'ruine':
      return (
        <g>
          <rect className={styles.glyphLine} x={-3.4} y={-3.4} width={6.8} height={6.8} />
          <path className={styles.glyphLine} d="M-3.4,3.4L3.4,-3.4" />
        </g>
      );
    case 'champ-de-bataille':
      return <path className={styles.glyphSwords} d="M-4.2,-4.2L4.2,4.2M4.2,-4.2L-4.2,4.2" />;
    case 'ile':
      return <circle className={styles.glyphLine} r={3.4} />;
    case 'region':
      return <path className={styles.glyphLine} d="M-4,0H4M0,-4V4" />;
  }
}
