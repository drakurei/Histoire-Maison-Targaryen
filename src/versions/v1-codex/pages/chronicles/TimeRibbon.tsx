import { useId, useMemo, useRef } from 'react';
import type { CSSProperties } from 'react';
import { useNavigate } from 'react-router-dom';

import { useVersionPath } from '@/app/version';
import { dragons } from '@/core/content/dragons';
import { sovereigns } from '@/core/content/people';
import { events, periods } from '@/core/content/timeline';
import { formatSpan, formatYear, useLang, useT, useTitle, VALYRIAN_TAG } from '@/core/i18n';
import { createTimeScale, reignRibbons, timeTicks, timeZones, yearToX } from '@/core/timeline';

import { useElementWidth } from '../../components/hooks';
import { toRoman } from '../../components/numerals';
import { dragonCurve, stepPath } from '../portal/curveData';
import styles from './TimeRibbon.module.css';

const PAD = 8;
const CURVE_FROM = -114;
const NARRATIVE_END = 300;

/** Première année que les annales placent sur le temps : le début du ruban. */
export const RIBBON_FROM = Math.floor(Math.min(...events.map((event) => event.year ?? event.sortYear)) / 1000) * 1000;

interface Lane<T> {
  item: T;
  lane: number;
}

/** Range des durées qui se recouvrent sur des couloirs successifs. */
function lanes<T extends { from: number; to: number }>(items: readonly T[]): Lane<T>[] {
  const ends: number[] = [];
  return [...items]
    .sort((a, b) => a.from - b.from)
    .map((item) => {
      let lane = ends.findIndex((end) => end < item.from);
      if (lane === -1) lane = ends.length;
      ends[lane] = item.to;
      return { item, lane };
    });
}

/**
 * Le ruban du temps des chroniques : les dragons vivants en haut, les huit volumes en
 * bandes de cuir au milieu, les règnes à l'or en bas, sur l'échelle commune (temps des
 * légendes resserré). Les bandes mènent aux volumes ; la table qui suit le ruban en donne
 * l'accès au clavier.
 */
export function TimeRibbon() {
  const t = useT();
  const title = useTitle();
  const { reading } = useLang();
  const navigate = useNavigate();
  const path = useVersionPath();
  const box = useRef<HTMLDivElement>(null);
  const width = useElementWidth(box);
  const uid = useId().replace(/[^a-zA-Z0-9]/g, '');

  const curve = useMemo(() => dragonCurve(dragons, events, CURVE_FROM, NARRATIVE_END), []);
  const reigns = useMemo(() => reignRibbons(sovereigns), []);
  const volumes = useMemo(
    () => lanes(periods.map((period) => ({ period, from: period.from ?? RIBBON_FROM, to: period.to }))),
    [],
  );

  const drawing = useMemo(() => {
    if (width < 200) return null;
    const narrow = width < 640;
    const scale = createTimeScale({ domain: [RIBBON_FROM, NARRATIVE_END + 1], range: [PAD, width - PAD] });
    const x = (year: number) => yearToX(scale, year);
    const curveTop = 22;
    const curveH = narrow ? 64 : 104;
    const curveBase = curveTop + curveH;
    const volTop = curveBase + (narrow ? 26 : 30);
    const volH = narrow ? 26 : 34;
    const volLanes = Math.max(...volumes.map((v) => v.lane)) + 1;
    const reignTop = volTop + volLanes * (volH + 4) + (narrow ? 22 : 26);
    const reignH = narrow ? 10 : 14;
    const reignLanes = Math.max(...reigns.map((r) => r.lane)) + 1;
    const axis = reignTop + reignLanes * (reignH + 3) + (narrow ? 16 : 22);
    const ceiling = Math.max(5, Math.ceil(curve.ceiling / 5) * 5);
    const yOf = (value: number) => curveBase - (value / ceiling) * curveH;
    const solid = curve.points.map((p) => ({ year: p.year, value: p.count }));
    const upper = curve.points.map((p) => ({ year: p.year, value: p.count + p.doubt }));
    const line = stepPath(solid, x, yOf, x(NARRATIVE_END + 1));
    return {
      narrow,
      scale,
      x,
      curveTop,
      curveBase,
      volTop,
      volH,
      reignTop,
      reignH,
      axis,
      height: axis + (narrow ? 44 : 50),
      line,
      area: `${line}V${curveBase}H${x(CURVE_FROM)}Z`,
      upper: stepPath(upper, x, yOf, x(NARRATIVE_END + 1)),
      ticks: timeTicks(scale, { minGap: narrow ? 70 : 80 }).filter((tick) => tick.year <= NARRATIVE_END),
      zones: timeZones(scale),
    };
  }, [width, curve, volumes, reigns]);

  const label = t('page.chronicles.ribbon.label', { from: formatYear(RIBBON_FROM, reading), to: formatYear(NARRATIVE_END, reading) });

  return (
    <div ref={box} className={styles.ribbon}>
      {drawing ? (
        <svg width={width} height={drawing.height} viewBox={`0 0 ${width} ${drawing.height}`} role="img" aria-label={label}>
          <defs>
            <pattern id={`h${uid}`} width="4" height="4" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
              <line x1="0" y1="0" x2="0" y2="4" className={styles.hatch} />
            </pattern>
            <pattern id={`d${uid}`} width="5" height="5" patternUnits="userSpaceOnUse">
              <circle cx="2.5" cy="2.5" r="0.75" className={styles.stipple} />
            </pattern>
          </defs>

          {/* Dragons vivants. Avant le départ pour Peyredragon, Valyria : on ne les a jamais comptés. */}
          <text className={styles.band} x={PAD} y={drawing.curveTop - 8}>
            {t('page.chronicles.ribbon.dragons')}
          </text>
          <rect
            x={drawing.x(RIBBON_FROM)}
            y={drawing.curveTop + 18}
            width={drawing.x(CURVE_FROM) - drawing.x(RIBBON_FROM)}
            height={drawing.curveBase - drawing.curveTop - 18}
            fill={`url(#d${uid})`}
          />
          {drawing.narrow ? null : (
            <text className={styles.valyria} x={drawing.x(RIBBON_FROM) + 4} y={drawing.curveBase - 8}>
              {t('page.portal.curve.valyria')}
            </text>
          )}
          <path d={drawing.area} fill={`url(#h${uid})`} />
          <path d={drawing.upper} className={styles.doubt} />
          <path d={drawing.line} className={styles.line} />
          <line className={styles.base} x1={PAD} x2={width - PAD} y1={drawing.curveBase} y2={drawing.curveBase} />

          {/* Les huit volumes. */}
          <text className={styles.band} x={PAD} y={drawing.volTop - 8}>
            {t('page.chronicles.ribbon.volumes')}
          </text>
          {volumes.map(({ item, lane }) => {
            const x0 = drawing.x(item.from);
            const x1 = drawing.x(item.to);
            const w = Math.max(3, x1 - x0);
            const y = drawing.volTop + lane * (drawing.volH + 4);
            const name = title(item.period.title);
            const numeral = toRoman(item.period.order);
            const fits = w > numeral.length * 9 + 10;
            // Hors de la bande, le chiffre se pose à droite ou à gauche s'il y a la place dans son couloir ; sinon la table le donne.
            const sameLane = volumes.filter((other) => other.lane === lane && other.item !== item);
            const need = numeral.length * 9 + 8;
            const roomRight = Math.min(width - PAD, ...sameLane.filter((o) => o.item.from >= item.to).map((o) => drawing.x(o.item.from))) - x1;
            const roomLeft = x0 - Math.max(PAD, ...sameLane.filter((o) => o.item.to <= item.from).map((o) => drawing.x(o.item.to)));
            const outside = fits ? null : roomRight >= need ? 'right' : roomLeft >= need ? 'left' : null;
            const room = w - numeral.length * 11 - 22;
            const showName = !drawing.narrow && room > name.primary.length * 7.2;
            const leather = { '--cuir': `var(--v1-cuir-${item.period.order})` } as CSSProperties;
            const go = () => navigate(path(`/chroniques/${item.period.id}`));
            return (
              <g key={item.period.id} className={styles.volume} style={leather} onClick={go}>
                <title>{`${numeral}. ${name.gloss ?? name.primary}, ${formatSpan(item.period.from, item.period.to, reading)}`}</title>
                <rect x={x0} y={y} width={w} height={drawing.volH} className={styles.leather} />
                {fits || outside ? (
                  <text
                    className={styles.numeral}
                    x={fits ? x0 + 7 : outside === 'right' ? x1 + 4 : x0 - 4}
                    y={y + drawing.volH / 2 + 5}
                    data-outside={fits ? undefined : ''}
                    textAnchor={fits || outside === 'right' ? 'start' : 'end'}
                  >
                    {numeral}
                  </text>
                ) : null}
                {showName ? (
                  <text className={styles.volName} x={x0 + numeral.length * 11 + 16} y={y + drawing.volH / 2 + 5} lang={name.isHv ? VALYRIAN_TAG : undefined}>
                    {name.primary}
                  </text>
                ) : null}
              </g>
            );
          })}

          {/* Les règnes. */}
          <text className={styles.band} x={PAD} y={drawing.reignTop - 8}>
            {t('page.chronicles.ribbon.reigns')}
          </text>
          {reigns.map((reign) => {
            const x0 = drawing.x(reign.from);
            const x1 = drawing.x(reign.to);
            const w = Math.max(2, x1 - x0 - 1);
            const y = drawing.reignTop + reign.lane * (drawing.reignH + 3);
            const ordinal = reign.ordinal === null ? null : toRoman(reign.ordinal);
            return (
              <g key={`${reign.id}-${reign.from}`}>
                <rect x={x0} y={y} width={w} height={drawing.reignH} className={styles.reign} data-uncounted={reign.ordinal === null || undefined}>
                  <title>{`${title(reign.name).primary}, ${formatSpan(reign.from, reign.to, reading)}`}</title>
                </rect>
                {ordinal && w > ordinal.length * 6 + 4 && reign.lane === 0 ? (
                  <text className={styles.ordinal} x={x0 + w / 2} y={y + drawing.reignH + 13} textAnchor="middle">
                    {ordinal}
                  </text>
                ) : null}
              </g>
            );
          })}

          {/* La règle. */}
          {drawing.zones.map((zone) => (
            <line key={zone.id} className={styles.axis} data-zone={zone.id} x1={zone.x0} x2={zone.x1} y1={drawing.axis} y2={drawing.axis} />
          ))}
          {drawing.ticks.map((tick) => (
            <g key={tick.year}>
              <line className={styles.tick} x1={drawing.x(tick.year)} x2={drawing.x(tick.year)} y1={drawing.axis} y2={drawing.axis + 6} />
              <text
                className={styles.year}
                x={drawing.x(tick.year)}
                y={drawing.axis + 20}
                textAnchor={drawing.x(tick.year) < 30 ? 'start' : drawing.x(tick.year) > width - 30 ? 'end' : 'middle'}
              >
                {formatYear(tick.year, reading)}
              </text>
            </g>
          ))}
          {drawing.zones.map((zone) => (
            <text key={`z${zone.id}`} className={styles.zone} x={zone.x0 + 2} y={drawing.axis + 38}>
              {zone.x1 - zone.x0 > t(`page.bati.time.zone.${zone.id}`).length * 5.6 + 8 ? t(`page.bati.time.zone.${zone.id}`) : ''}
            </text>
          ))}
        </svg>
      ) : null}
    </div>
  );
}
