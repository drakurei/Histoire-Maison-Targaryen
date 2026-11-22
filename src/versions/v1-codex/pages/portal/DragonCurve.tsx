import { useCallback, useId, useMemo, useRef, useState } from 'react';
import type { KeyboardEvent, PointerEvent } from 'react';

import { VLink } from '@/app/version';
import { dragons, getDragon } from '@/core/content/dragons';
import { events, getEvent } from '@/core/content/timeline';
import { formatYear, useLang, useT, useTitle } from '@/core/i18n';
import { gsap, MOTION_CONDITIONS, ScrollTrigger, useGSAP } from '@/core/motion';
import { createTimeScale, timeTicks, timeZones, xToYear, yearToX } from '@/core/timeline';

import { useElementWidth } from '../../components/hooks';
import { dragonCurve, stepPath } from './curveData';
import type { CurvePoint } from './curveData';
import styles from './DragonCurve.module.css';

/** Bornes de la figure maîtresse : du départ pour Peyredragon à la fin du récit. */
export const CURVE_FROM = -114;
export const CURVE_TO = 300;

/** La Danse, bornée par ses deux événements (les guerres ne sont pas chargées sur le portail). */
const DANCE = { war: 'danse-des-dragons', start: 'p5-deux-couronnements', end: 'p5-heure-du-loup' };
const LEFT = 30;
const RIGHT = 6;
const AXIS = 46;
const ROW = 46;
const CHAR = 7.2;

interface Annotation {
  year: number;
  key: string;
  detail?: string;
  to?: string;
  /** Point visé sur la courbe. */
  value: number;
}

interface PlacedAnnotation extends Annotation {
  x: number;
  row: number;
  anchor: 'start' | 'end';
}

/**
 * Range les repères sur des rangs au-dessus de la courbe. Un cartel ne chevauche ni un autre
 * cartel de son rang, ni le trait d'un repère posé plus haut (ce trait descend à travers lui).
 */
function placeAnnotations(items: readonly (Annotation & { x: number; width: number })[], width: number): PlacedAnnotation[] {
  const placed: (PlacedAnnotation & { left: number; right: number })[] = [];
  for (const item of [...items].sort((a, b) => a.x - b.x)) {
    const preferred: 'start' | 'end' = item.x + item.width > width - RIGHT ? 'end' : 'start';
    const anchors: ('start' | 'end')[] = preferred === 'start' ? ['start', 'end'] : ['end', 'start'];
    const spanOf = (anchor: 'start' | 'end'): [number, number] =>
      anchor === 'start' ? [item.x, item.x + item.width] : [item.x - item.width, item.x];
    const inside = (anchor: 'start' | 'end') => {
      const [left, right] = spanOf(anchor);
      return left >= 0 && right <= width;
    };
    const crowded = (row: number, left: number, right: number) =>
      placed.some((other) => other.row === row && other.left < right + 12 && left < other.right + 12);
    const blocked = (row: number, left: number, right: number) =>
      crowded(row, left, right) ||
      placed.some(
        (other) =>
          (other.row < row && other.x > left - 6 && other.x < right + 6) ||
          (other.row > row && item.x > other.left - 6 && item.x < other.right + 6),
      );
    let choice: { row: number; anchor: 'start' | 'end' } | null = null;
    for (let row = 0; row <= placed.length && !choice; row += 1) {
      for (const anchor of anchors) {
        const [left, right] = spanOf(anchor);
        if (inside(anchor) && !blocked(row, left, right)) {
          choice = { row, anchor };
          break;
        }
      }
    }
    // Toujours borné : si aucun rang n'est libre de tout trait, le premier rang sans cartel voisin.
    if (!choice) {
      const [left, right] = spanOf(preferred);
      let row = 0;
      while (crowded(row, left, right)) row += 1;
      choice = { row, anchor: preferred };
    }
    const [left, right] = spanOf(choice.anchor);
    placed.push({ ...item, row: choice.row, anchor: choice.anchor, left, right });
  }
  return placed;
}

function eventPath(id: string): string | undefined {
  const event = getEvent(id);
  return event ? `/chroniques/${event.periodId}/${event.id}` : undefined;
}

/**
 * La figure maîtresse du portail : le nombre de dragons vivants, année par année, tracé à
 * l'encre. Quelques repères datés, chacun relié à sa notice. Le lecteur peut parcourir la
 * courbe (pointeur ou flèches) : l'année choisie nomme les dragons qui volent.
 */
export function DragonCurve({ compact = false }: { compact?: boolean }) {
  const t = useT();
  const title = useTitle();
  const { reading } = useLang();
  const box = useRef<HTMLDivElement>(null);
  const width = useElementWidth(box);
  const uid = useId().replace(/[^a-zA-Z0-9]/g, '');
  const [year, setYear] = useState<number | null>(null);

  const curve = useMemo(() => dragonCurve(dragons, events, CURVE_FROM, CURVE_TO), []);
  const dance = useMemo(() => {
    const from = getEvent(DANCE.start)?.year;
    const to = getEvent(DANCE.end)?.year;
    return typeof from === 'number' && typeof to === 'number' ? { id: DANCE.war, from, to } : null;
  }, []);

  const nameOf = useCallback((id: string) => title(getDragon(id)?.name ?? { fr: id, en: id }).primary, [title]);
  const list = useMemo(() => new Intl.ListFormat(reading, { style: 'long', type: 'conjunction' }), [reading]);

  const drawing = useMemo(() => {
    if (width < 120) return null;
    const narrow = width < 640;
    const height = narrow ? 440 : compact ? 300 : 400;
    const scale = createTimeScale({ domain: [CURVE_FROM, CURVE_TO + 1], range: [LEFT, width - RIGHT] });
    const x = (y: number) => yearToX(scale, y);
    const xMid = (y: number) => (x(y) + x(y === -1 ? 1 : y + 1)) / 2;

    const annotations: Annotation[] = [
      { year: CURVE_FROM, key: 'page.portal.curve.annot.departure', to: eventPath('p2-reve-daenys'), value: 1 },
      { year: -2, key: 'page.portal.curve.annot.conquest', to: eventPath('p3-debarquement'), value: 0 },
      {
        year: curve.peak.year,
        key: 'page.portal.curve.annot.dance',
        detail: t('page.portal.curve.readout.many', { n: curve.peak.count }),
        to: dance ? `/guerres/${dance.id}` : undefined,
        value: curve.peak.count,
      },
    ];
    if (curve.extinction !== null) {
      annotations.push({ year: curve.extinction, key: 'page.portal.curve.annot.last', to: eventPath('p5-dernier-dragon'), value: 0 });
    }
    if (curve.revival !== null) {
      annotations.push({ year: curve.revival, key: 'page.portal.curve.annot.return', to: eventPath('p8-eclosion'), value: 0 });
    }
    const byYear = new Map(curve.points.map((point) => [point.year, point]));
    const sized = annotations.map((item) => {
      const point = byYear.get(item.year);
      const value = point ? point.count + point.doubt : item.value;
      const label = t(item.key);
      const chars = Math.max(label.length, (item.detail?.length ?? 0) + 2, formatYear(item.year, reading).length + 2);
      return { ...item, value, x: xMid(item.year), width: Math.min(narrow ? 108 : 190, chars * (narrow ? 6.6 : CHAR)) + 6 };
    });
    const placed = placeAnnotations(sized, width);
    const rows = Math.max(1, ...placed.map((item) => item.row + 1));
    // Sur téléphone, le libellé d'un repère passe sur deux lignes : des rangs plus hauts, des cartels plus étroits.
    const rowH = narrow ? 62 : ROW;
    const top = rows * rowH + 18;
    const base = height - AXIS;
    const ceiling = Math.ceil(curve.ceiling / 5) * 5;
    const yOf = (value: number) => base - (value / ceiling) * (base - top);

    const solid = curve.points.map((point) => ({ year: point.year, value: point.count }));
    const upper = curve.points.map((point) => ({ year: point.year, value: point.count + point.doubt }));
    const end = x(CURVE_TO + 1);
    const line = stepPath(solid, x, yOf, end);
    const area = `${line}V${base}H${x(CURVE_FROM)}Z`;

    // Pointillé : seulement là où des dragons à la fin non datée s'ajoutent à la courbe pleine.
    const doubtRuns: string[] = [];
    const doubtAreas: string[] = [];
    let run: { year: number; value: number }[] = [];
    let floor: { year: number; value: number }[] = [];
    const flush = (endYear: number) => {
      if (run.length === 0) return;
      const runEnd = x(endYear);
      const top = stepPath(run, x, yOf, runEnd);
      doubtRuns.push(top);
      const under = [...floor].reverse();
      const back = under.map((point, index) => {
        const x1 = index === 0 ? runEnd : x((under[index - 1] as { year: number }).year);
        return `H${x1.toFixed(1)}V${yOf(point.value).toFixed(1)}`;
      });
      doubtAreas.push(`${top}V${yOf(floor[floor.length - 1]?.value ?? 0).toFixed(1)}${back.join('')}H${x(run[0]?.year ?? 0).toFixed(1)}Z`);
      run = [];
      floor = [];
    };
    curve.points.forEach((point, index) => {
      if (point.doubt > 0) {
        run.push(upper[index] as { year: number; value: number });
        floor.push(solid[index] as { year: number; value: number });
      } else flush(point.year);
    });
    flush(CURVE_TO + 1);

    const danceLine = dance
      ? stepPath(
          solid.filter((point) => point.year >= dance.from && point.year <= dance.to),
          x,
          yOf,
          x(dance.to + 1),
        )
      : '';

    const yTicks = Array.from({ length: ceiling / 5 + 1 }, (_, index) => index * 5);
    return {
      rowH,
      height,
      scale,
      x,
      xMid,
      yOf,
      base,
      top,
      line,
      area,
      doubtRuns,
      doubtAreas,
      danceLine,
      placed,
      yTicks,
      ticks: timeTicks(scale, { minGap: narrow ? 70 : 84 }).filter((tick) => tick.year <= CURVE_TO),
      zones: timeZones(scale),
      narrow,
    };
  }, [width, compact, curve, dance, t, reading]);

  const point: CurvePoint | undefined = year === null ? undefined : curve.points.find((item) => item.year === year);

  const choose = useCallback(
    (next: number) => {
      let value = Math.round(next);
      if (value === 0) value = next < 0 ? -1 : 1;
      setYear(Math.min(CURVE_TO, Math.max(CURVE_FROM, value)));
    },
    [setYear],
  );

  const onPointer = (event: PointerEvent<HTMLDivElement>) => {
    if (!drawing || !box.current) return;
    const rect = box.current.getBoundingClientRect();
    choose(Math.floor(xToYear(drawing.scale, event.clientX - rect.left)));
  };

  const onKey = (event: KeyboardEvent<HTMLDivElement>) => {
    const current = year ?? curve.peak.year;
    const steps: Record<string, number> = { ArrowLeft: -1, ArrowDown: -1, ArrowRight: 1, ArrowUp: 1, PageDown: -10, PageUp: 10 };
    let next: number | null = null;
    if (event.key in steps) {
      const step = steps[event.key] ?? 0;
      next = current + step;
      if (current + step === 0 || (current < 0 && next > 0) || (current > 0 && next < 0)) next += step > 0 ? 1 : -1;
    } else if (event.key === 'Home') next = CURVE_FROM;
    else if (event.key === 'End') next = CURVE_TO;
    if (next === null) return;
    event.preventDefault();
    choose(next);
  };

  const readout = point ? describe(point) : null;
  function describe(p: CurvePoint): { count: string; names: string; doubt: string | null; text: string } {
    const count =
      p.count === 0 ? t('page.portal.curve.readout.none') : p.count === 1 ? t('page.portal.curve.readout.one') : t('page.portal.curve.readout.many', { n: p.count });
    const names = p.ids.length > 0 ? list.format(p.ids.map(nameOf)) : '';
    const doubt = p.doubtIds.length > 0 ? t('page.portal.curve.readout.doubt', { names: list.format(p.doubtIds.map(nameOf)) }) : null;
    const text = [formatYear(p.year, reading), count, names, doubt].filter(Boolean).join(', ');
    return { count, names, doubt, text };
  }

  useGSAP(
    () => {
      const root = box.current;
      if (!root || !drawing) return;
      const mm = gsap.matchMedia();
      mm.add(MOTION_CONDITIONS, (context) => {
        if (context.conditions?.reduced) return;
        const ink = root.querySelectorAll<SVGPathElement>('[data-ink]');
        const washes = root.querySelectorAll('[data-wash]');
        const notes = root.querySelectorAll<HTMLElement>('[data-note]');
        if (ink.length === 0) return;
        // La courbe reste tracée tant qu'elle n'a pas été vue : rien ne disparaît si le défilement ne se déclenche pas.
        ScrollTrigger.create({
          trigger: root,
          start: 'top bottom',
          once: true,
          onEnter: () => {
            const draw = gsap.timeline();
            draw.fromTo(ink, { drawSVG: '0%' }, { drawSVG: '100%', duration: 1.4, ease: 'power2.inOut' }, 0);
            draw.fromTo(washes, { opacity: 0 }, { opacity: 1, duration: 0.6, ease: 'none' }, 0.9);
            notes.forEach((note) => {
              const at = Number(note.dataset.at ?? 0);
              draw.fromTo(note, { opacity: 0 }, { opacity: 1, duration: 0.3, ease: 'none' }, 0.2 + 1.2 * at);
            });
          },
        });
      });
      return () => mm.revert();
    },
    { scope: box, dependencies: [drawing === null] },
  );

  const uncountedNames = list.format(curve.uncounted.map(nameOf));

  return (
    <div className={styles.curve} data-compact={compact || undefined}>
      <div ref={box} className={styles.plate}>
        {drawing ? (
          <>
            <svg width={width} height={drawing.height} viewBox={`0 0 ${width} ${drawing.height}`} aria-hidden="true" focusable="false">
              <defs>
                <pattern id={`h${uid}`} width="5" height="5" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
                  <line x1="0" y1="0" x2="0" y2="5" className={styles.hatch} />
                </pattern>
                <pattern id={`d${uid}`} width="4" height="4" patternUnits="userSpaceOnUse">
                  <circle cx="2" cy="2" r="0.7" className={styles.stipple} />
                </pattern>
              </defs>

              {drawing.yTicks.map((tick) => (
                <g key={`y${tick}`}>
                  <line className={tick === 0 ? styles.baseline : styles.gridline} x1={LEFT} x2={width - RIGHT} y1={drawing.yOf(tick)} y2={drawing.yOf(tick)} />
                  {tick > 0 ? (
                    <text className={styles.yLabel} x={LEFT - 6} y={drawing.yOf(tick) + 4} textAnchor="end">
                      {tick}
                    </text>
                  ) : null}
                </g>
              ))}

              <g data-wash="">
                <path d={drawing.area} fill={`url(#h${uid})`} />
                {drawing.doubtAreas.map((d, index) => (
                  <path key={`da${index}`} d={d} fill={`url(#d${uid})`} />
                ))}
              </g>
              {drawing.doubtRuns.map((d, index) => (
                <path key={`dr${index}`} d={d} className={styles.doubt} data-wash="" />
              ))}
              <path d={drawing.line} className={styles.line} data-ink="" />
              {drawing.danceLine ? <path d={drawing.danceLine} className={styles.dance} data-ink="" /> : null}

              {drawing.placed.map((note) => {
                const rowY = note.row * drawing.rowH + (drawing.narrow ? 56 : 40);
                return (
                  <line
                    key={`l${note.year}`}
                    className={styles.leader}
                    x1={note.x}
                    x2={note.x}
                    y1={rowY}
                    y2={drawing.yOf(note.value) - 5}
                    data-note=""
                    data-at={(note.x / width).toFixed(3)}
                  />
                );
              })}

              {drawing.zones.map((zone) => (
                <line key={zone.id} className={styles.axis} data-zone={zone.id} x1={zone.x0} x2={zone.x1} y1={drawing.base} y2={drawing.base} />
              ))}
              {drawing.ticks.map((tick) => (
                <g key={`t${tick.year}`}>
                  <line className={styles.tick} x1={drawing.x(tick.year)} x2={drawing.x(tick.year)} y1={drawing.base} y2={drawing.base + 6} />
                  <text className={styles.xLabel} x={drawing.x(tick.year)} y={drawing.base + 20} textAnchor={drawing.x(tick.year) > width - 30 ? 'end' : 'middle'}>
                    {formatYear(tick.year, reading)}
                  </text>
                </g>
              ))}
              {drawing.zones.length > 1 && !drawing.narrow
                ? drawing.zones.map((zone) => (
                    <text key={`z${zone.id}`} className={styles.zone} x={zone.x0 + 2} y={drawing.base + 38}>
                      {t(zone.id === 'approach' ? 'page.bati.time.zone.approach' : zone.id === 'dynasty' ? 'page.bati.time.zone.dynasty' : 'page.bati.time.zone.legend')}
                    </text>
                  ))
                : null}

              {point ? (
                <g className={styles.cursor}>
                  <line x1={drawing.xMid(point.year)} x2={drawing.xMid(point.year)} y1={drawing.top - 6} y2={drawing.base} />
                  <circle cx={drawing.xMid(point.year)} cy={drawing.yOf(point.count)} r="3.5" />
                </g>
              ) : null}

            </svg>

            <ol role="list" className={styles.notes}>
              {drawing.placed.map((note) => (
                <li
                  key={`n${note.year}`}
                  className={styles.note}
                  data-anchor={note.anchor}
                  data-note=""
                  data-at={(note.x / width).toFixed(3)}
                  style={{ top: note.row * drawing.rowH + 4, maxInlineSize: drawing.narrow ? 114 : undefined, [note.anchor === 'start' ? 'left' : 'right']: note.anchor === 'start' ? note.x - 1 : width - note.x - 1 }}
                >
                  {note.to ? (
                    <VLink to={note.to} className={styles.noteLink}>
                      <NoteText year={note.year} label={t(note.key)} detail={note.detail} />
                    </VLink>
                  ) : (
                    <NoteText year={note.year} label={t(note.key)} detail={note.detail} />
                  )}
                </li>
              ))}
            </ol>

            <div
              className={styles.hit}
              role="slider"
              tabIndex={0}
              aria-label={t('page.portal.curve.label')}
              aria-valuemin={CURVE_FROM}
              aria-valuemax={CURVE_TO}
              aria-valuenow={year ?? curve.peak.year}
              aria-valuetext={(readout ?? describe(curve.peak)).text}
              style={{ left: LEFT, top: drawing.top - 10, width: width - LEFT - RIGHT, height: drawing.base - drawing.top + 10 }}
              onKeyDown={onKey}
              onPointerMove={onPointer}
              onPointerDown={onPointer}
              onPointerLeave={(event) => {
                if (event.pointerType === 'mouse') setYear(null);
              }}
            />
          </>
        ) : null}
      </div>

      <div className={styles.readout} aria-hidden="true">
        {readout && point ? (
          <p>
            <time className={styles.readYear}>{formatYear(point.year, reading)}</time> <strong className={styles.readCount}>{readout.count}</strong>
            {readout.names ? (
              <span className={styles.readNames} lang={reading}>
                {' '}
                {readout.names}
              </span>
            ) : null}
            {readout.doubt ? <span className={styles.readDoubt}> {readout.doubt}</span> : null}
          </p>
        ) : (
          <p className={styles.hint}>{t('page.portal.curve.hint')}</p>
        )}
      </div>

      {compact ? null : (
        <p className={styles.caption}>
          {t('page.portal.curve.caption', { extinction: formatYear(curve.extinction, reading) })}
          {curve.uncounted.length > 0 ? ` ${t('page.portal.curve.uncounted', { names: uncountedNames })}` : null}
        </p>
      )}
    </div>
  );
}

function NoteText({ year, label, detail }: { year: number; label: string; detail?: string }) {
  const { reading } = useLang();
  return (
    <>
      <span className={styles.noteHead}>
        <time className={styles.noteYear}>{formatYear(year, reading)}</time>
        {detail ? <span className={styles.noteDetail}>{detail}</span> : null}
      </span>
      <span className={styles.noteLabel}>{label}</span>
    </>
  );
}

