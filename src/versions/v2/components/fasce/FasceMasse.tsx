import { useCallback, useRef } from 'react';
import type { KeyboardEvent, PointerEvent } from 'react';

import { useT } from '@/core/i18n';
import { xToYear } from '@/core/timeline';
import type { TimeScale } from '@/core/timeline';

import { yearCenter, yearEdges } from '../../model/geometry';
import { nearestDated, stepYear } from '../../model/presence';
import type { FasceState } from '../../state/fasce';
import { boundsOf, clampToDomain, DATED_YEARS, DOMAIN, periods } from '../../state/scene';
import { setDragYear, setHoverYear, useSetYear } from '../../state/year';

import { MasseSvg } from './MasseSvg';
import { useAliveText, useYearInfo } from './useYearInfo';
import styles from './FasceMasse.module.css';

interface FasceMasseProps {
  scale: TimeScale;
  width: number;
  height: number;
  /** Année réglée (glisser compris). */
  year: number | null;
  fasce: FasceState;
  /** Marge, en pixels, où la masse ne réagit pas (le geste Retour du téléphone vit au bord). */
  inset: number;
}

/** Aimant : à moins de 4 px d'une année datée, le glisser s'y pose. */
const SNAP_PX = 4;

/** Année sous l'abscisse : l'année dont la largeur contient le point. Pas d'an 0. */
function yearAtX(scale: TimeScale, x: number): number {
  const raw = Math.floor(xToYear(scale, x));
  return clampToDomain(raw === 0 ? -1 : raw);
}

function snapped(scale: TimeScale, x: number): number {
  const year = yearAtX(scale, x);
  const near = nearestDated(DATED_YEARS, year, 40);
  if (near !== null && Math.abs(yearCenter(scale, near) - x) <= SNAP_PX) return near;
  return year;
}

function shift(year: number, by: number): number {
  let next = year + by;
  if (year < 0 && next >= 0) next += 1;
  if (year > 0 && next <= 0) next -= 1;
  return clampToDomain(next);
}

/** Début de la période voisine (`[` et `]`). */
function periodStart(year: number | null, direction: 1 | -1): number | null {
  const starts = [...new Set(periods.map((period) => boundsOf(period)[0]))].sort((a, b) => a - b);
  return stepYear(starts, year, direction);
}

/**
 * La masse : le curseur du temps (`role="slider"`). Presser ou glisser règle l'année ; le
 * clavier la règle à l'année, à la décennie, d'année datée en année datée, de période en
 * période. Au-dessus, le ciel de la fasce : durée de la vue (ivoire), règne (or), encoches
 * d'entité, et le trait de braise de l'encoche ; dans la masse, l'entaille d'obsidienne.
 */
export function FasceMasse({ scale, width, height, year, fasce, inset }: FasceMasseProps) {
  const t = useT();
  const info = useYearInfo();
  const alive = useAliveText();
  const setYear = useSetYear();
  const dragging = useRef<number | null>(null);
  const root = useRef<HTMLDivElement>(null);

  const xOf = useCallback(
    (event: PointerEvent<HTMLDivElement>) => event.clientX - (root.current?.getBoundingClientRect().left ?? 0),
    [],
  );
  const live = (x: number) => x >= inset && x <= width - inset;

  const onPointerDown = (event: PointerEvent<HTMLDivElement>) => {
    if (event.button !== 0) return;
    const x = xOf(event);
    if (!live(x)) return;
    event.currentTarget.setPointerCapture(event.pointerId);
    const next = snapped(scale, x);
    dragging.current = next;
    setHoverYear(null);
    setDragYear(next);
  };

  const onPointerMove = (event: PointerEvent<HTMLDivElement>) => {
    const x = xOf(event);
    if (dragging.current !== null) {
      const next = snapped(scale, Math.min(width - inset, Math.max(inset, x)));
      dragging.current = next;
      setDragYear(next);
      return;
    }
    if (event.pointerType === 'mouse') setHoverYear(live(x) ? yearAtX(scale, x) : null);
  };

  const finish = (commit: boolean) => {
    const value = dragging.current;
    dragging.current = null;
    if (commit && value !== null) setYear(value);
    else setDragYear(null);
  };

  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    const from = year;
    let next: number | null | undefined;
    const step = event.shiftKey ? 10 : 1;
    switch (event.key) {
      case 'ArrowRight':
      case 'ArrowUp':
        next = from === null ? stepYear(DATED_YEARS, null, 1) : shift(from, step);
        break;
      case 'ArrowLeft':
      case 'ArrowDown':
        next = from === null ? stepYear(DATED_YEARS, null, -1) : shift(from, -step);
        break;
      case 'PageUp':
        next = stepYear(DATED_YEARS, from, -1) ?? from;
        break;
      case 'PageDown':
        next = stepYear(DATED_YEARS, from, 1) ?? from;
        break;
      case '[':
        next = periodStart(from, -1) ?? from;
        break;
      case ']':
        next = periodStart(from, 1) ?? from;
        break;
      case 'Home':
        next = DOMAIN[0];
        break;
      case 'End':
        next = DOMAIN[1];
        break;
      case 'Backspace':
      case 'Delete':
        next = null;
        break;
      default:
        return;
    }
    event.preventDefault();
    if (next !== from) setYear(next ?? null);
  };

  const now = year === null ? null : info(year);
  const valueText =
    now === null
      ? t('v2.fasce.all_time')
      : t(now.reign ? 'v2.fasce.valuetext' : 'v2.fasce.valuetext_noreign', {
          year: now.label,
          reign: now.reign,
          period: now.period,
          count: alive(now.attested),
        });

  const notchX = year === null || fasce.off ? null : yearCenter(scale, year);
  const spanEdges = fasce.span ? [yearEdges(scale, fasce.span[0])[0], yearEdges(scale, fasce.span[1])[1]] : null;
  const reignEdges = fasce.reign ? [yearEdges(scale, fasce.reign[0])[0], yearEdges(scale, fasce.reign[1])[1]] : null;

  return (
    <div className={styles.root} ref={root}>
      <div className={styles.ciel} aria-hidden="true">
        {spanEdges ? (
          <span
            className={styles.duree}
            style={{ left: spanEdges[0], width: Math.max(2, (spanEdges[1] ?? 0) - (spanEdges[0] ?? 0)) }}
          />
        ) : null}
        {reignEdges ? (
          <span
            className={styles.regne}
            style={{ left: reignEdges[0], width: Math.max(2, (reignEdges[1] ?? 0) - (reignEdges[0] ?? 0)) }}
          />
        ) : null}
        {fasce.marks.map((mark, index) => (
          <span
            key={`${mark.year}-${index}`}
            className={styles.marque}
            data-actif={mark.active ? '' : undefined}
            style={{ transform: `translateX(${yearCenter(scale, mark.year) - 1}px)` }}
          />
        ))}
        {notchX !== null ? <span className={styles.trait} style={{ transform: `translateX(${notchX - 1.5}px)` }} /> : null}
      </div>
      <div
        className={styles.masse}
        style={{ height }}
        role="slider"
        tabIndex={0}
        aria-label={t('v2.fasce.slider')}
        aria-valuemin={DOMAIN[0]}
        aria-valuemax={DOMAIN[1]}
        aria-valuenow={year ?? undefined}
        aria-valuetext={valueText}
        aria-orientation="horizontal"
        data-eteinte={fasce.off ? '' : undefined}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={() => finish(true)}
        onPointerCancel={() => finish(false)}
        onPointerLeave={() => setHoverYear(null)}
        onKeyDown={onKeyDown}
      >
        <MasseSvg scale={scale} width={width} height={height} span={fasce.span} off={fasce.off} className={styles.svg} />
        {notchX !== null ? <span className={styles.entaille} style={{ transform: `translateX(${notchX - 1.5}px)` }} /> : null}
      </div>
    </div>
  );
}

