import { useLayoutEffect, useMemo, useRef, useState } from 'react';
import type { MouseEvent } from 'react';
import { useLocation } from 'react-router-dom';

import { formatSpan, useLang, useT, useTitle, VALYRIAN_TAG } from '@/core/i18n';
import type { TimeScale } from '@/core/timeline';

import { extentLanes, spreadTargets, yearEdges } from '../../model/geometry';
import { useLienHref } from '../../state/links';
import { boundsOf, periods } from '../../state/scene';
import { useFeu } from '../Feu';
import { isModifiedClick, toRoman } from '../numerals';

import styles from './PeriodRow.module.css';

interface PeriodRowProps {
  scale: TimeScale;
  width: number;
  /** Survol ou focus d'une période : le cartel écrit sa glose et ses années. */
  onHover: (periodId: string | null) => void;
  /** Rangée réduite aux huit chiffres (tablette). */
  compact: boolean;
}

const MIN_TARGET = 44;
const GAP = 6;

/**
 * La rangée des périodes, sous la masse : un crochet de sang par période à l'échelle vraie
 * (deuxième couloir quand deux périodes se chevauchent), et sous lui une cible d'au moins
 * 44 px, rangée au centre de son étendue et écartée de ses voisines quand elles se gênent.
 * Activer une période ouvre sa vue, et le feu part de son début sur la fasce.
 */
export function PeriodRow({ scale, width, onHover, compact }: PeriodRowProps) {
  const t = useT();
  const title = useTitle();
  const { lang, reading } = useLang();
  const href = useLienHref();
  const feu = useFeu();
  const { pathname } = useLocation();
  const current = /\/chroniques\/(p\d+)(?:\/|$)/.exec(pathname)?.[1] ?? null;
  const targets = useRef(new Map<string, HTMLAnchorElement>());
  const [lefts, setLefts] = useState<ReadonlyMap<string, number> | null>(null);

  const extents = useMemo(
    () =>
      periods.map((period) => {
        const [from, to] = boundsOf(period);
        const x0 = yearEdges(scale, from)[0];
        const x1 = yearEdges(scale, to)[1];
        return { period, from, to, x0, x1 };
      }),
    [scale],
  );
  const lanes = useMemo(() => extentLanes(extents.map(({ period, from, to }) => ({ id: period.id, from, to }))), [extents]);

  // Les cibles se mesurent une fois rendues, puis s'écartent : la largeur dépend de la langue et des polices.
  useLayoutEffect(() => {
    if (compact) return;
    let alive = true;
    const place = () => {
      if (!alive) return;
      const measured = extents.map(({ period, x0, x1 }) => ({
        id: period.id,
        center: (x0 + x1) / 2,
        width: Math.max(MIN_TARGET, targets.current.get(period.id)?.offsetWidth ?? MIN_TARGET),
      }));
      setLefts(spreadTargets(measured, 0, width, GAP));
    };
    place();
    void document.fonts?.ready.then(place);
    return () => {
      alive = false;
    };
  }, [extents, width, lang, compact]);

  const go = (event: MouseEvent<HTMLAnchorElement>, to: string, year: number) => {
    if (isModifiedClick(event)) return;
    event.preventDefault();
    feu.passer(to, { year });
  };

  return (
    <nav className={styles.root} aria-label={t('v2.fasce.periods')} data-compact={compact ? '' : undefined}>
      {compact ? null : (
        <svg className={styles.crochets} width={width} height={16} aria-hidden="true" focusable="false">
          {extents.map(({ period, x0, x1 }) => {
            // Un crochet : le trait de l'étendue et deux talons qui en marquent les bornes.
            const y = 5 + (lanes.get(period.id) ?? 0) * 4;
            const right = Math.max(x0 + 2, x1 - 1);
            return (
              <path
                key={period.id}
                d={`M${x0 + 1} ${y + 6}V${y}H${right}V${y + 6}`}
                className={styles.crochet}
              />
            );
          })}
        </svg>
      )}
      <ul role="list" className={styles.list}>
        {extents.map(({ period, from, to }) => {
          const to2 = href(`/chroniques/${period.id}`);
          const name = title(period.title);
          const left = lefts?.get(period.id);
          return (
            <li key={period.id} className={styles.item}>
              <a
                ref={(node) => {
                  if (node) targets.current.set(period.id, node);
                  else targets.current.delete(period.id);
                }}
                href={to2}
                className={styles.target}
                aria-current={current === period.id ? 'page' : undefined}
                style={compact ? undefined : { transform: `translateX(${left ?? 0}px)`, visibility: left === undefined ? 'hidden' : undefined }}
                onClick={(event) => go(event, to2, from)}
                onPointerEnter={() => onHover(period.id)}
                onPointerLeave={() => onHover(null)}
                onFocus={() => onHover(period.id)}
                onBlur={() => onHover(null)}
              >
                <span className={styles.chiffre} aria-hidden="true">
                  {toRoman(period.order)}
                </span>
                <span className={styles.titre} lang={name.isHv ? VALYRIAN_TAG : undefined} aria-hidden="true">
                  {name.primary}
                </span>
                <span className="sr-only">
                  {toRoman(period.order)}.{' '}
                  <span lang={name.isHv ? VALYRIAN_TAG : undefined}>{name.primary}</span>
                  {name.gloss ? `, ${name.gloss}` : ''}, {formatSpan(period.from, to, reading)}
                </span>
              </a>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
