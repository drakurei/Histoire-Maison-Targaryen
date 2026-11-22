/*
 * Copie adaptée de `FigureChroniques` de la V2 (src/versions/v2/pages/entree/FigureChroniques.tsx) :
 * mêmes bandes des règnes et des guerres, même alignement au pixel sur la fasce, même lecture
 * au survol ; mais chaque période est un dos de cuir couché (V1), adossé à son segment de
 * fasce, au lieu d'une étiquette nue.
 */
import { useMemo, useState } from 'react';
import type { MouseEvent, PointerEvent } from 'react';

import { formatSpan, formatYear, useLang, useT, useTx } from '@/core/i18n';
import { reignRibbons, xToYear } from '@/core/timeline';
import { useFeu } from '@/versions/v2/components/Feu';
import { fasceScale, useFasceGeometry } from '@/versions/v2/components/fasce/geometry';
import { withoutHouse } from '@/versions/v2/components/fasce/useYearInfo';
import { isModifiedClick } from '@/versions/v2/components/numerals';
import { Profil } from '@/versions/v2/components/Profil';
import { extentLanes, yearCenter, yearEdges } from '@/versions/v2/model/geometry';
import { useBox } from '@/versions/v2/pages/entree/hooks';
import { hasDragons } from '@/versions/v2/pages/entree/TempsVue';
import { useLienHref } from '@/versions/v2/state/links';
import { boundsOf, clampToDomain, DOMAIN, periods, sovereigns, wars } from '@/versions/v2/state/scene';
import { setHoverYear, useYear } from '@/versions/v2/state/year';
import { withBase } from '@/app/paths';

import { Dos } from '../../components/common/Dos';
import { DESKTOP, useMedia } from '../../components/common/useMedia';
import styles from './FigureFascee.module.css';

/** Mesures en pixels : ordinateur, puis téléphone. */
const SIZES = {
  desktop: { lane: 7, laneGap: 3, row: 64, rowGap: 10, bandGap: 18, dos: 384 },
  phone: { lane: 5, laneGap: 2, row: 72, rowGap: 0, bandGap: 14, dos: 0 },
} as const;
const MIN_WAR = 6;
const GAP = 12;
const PROFIL_TEL = 40;

/**
 * Les chroniques en fascé (v3-spec §6.2). Ordinateur : en haut les règnes (or) et les guerres
 * (sang), puis une rangée de 64 px par période : son segment de la fasce, à sa place exacte,
 * et contre lui son dos de cuir, du côté où il reste de la place ; la suite des dos descend
 * en escalier, comme le temps. Téléphone : chaque dos sur toute la largeur, son profil dessous.
 * Activer une rangée ouvre la période, le feu parti de son abscisse sur la fasce.
 */
export function FigureFascee() {
  const t = useT();
  const tx = useTx();
  const { reading } = useLang();
  const href = useLienHref();
  const feu = useFeu();
  const year = useYear();
  const geometry = useFasceGeometry();
  const desktop = useMedia(DESKTOP);
  const [ref, box] = useBox<HTMLDivElement>();
  const [hover, setHover] = useState<number | null>(null);
  const size = desktop ? SIZES.desktop : SIZES.phone;

  const ribbons = useMemo(() => reignRibbons(sovereigns), []);
  const warLanes = useMemo(() => extentLanes(wars.map((war) => ({ id: war.id, from: war.from, to: war.to }))), []);
  const reignLanes = Math.max(1, ...ribbons.map((ribbon) => ribbon.lane + 1));
  const warLaneCount = Math.max(1, ...[...warLanes.values()].map((lane) => lane + 1));

  const ready = geometry !== null && box.width > 0;
  const scale = fasceScale(geometry?.width ?? 1);
  const offset = (geometry?.left ?? 0) - box.left;
  const left = (from: number) => offset + yearEdges(scale, from)[0];
  const right = (to: number) => offset + yearEdges(scale, to)[1];

  const bandHeight = (lanes: number) => lanes * size.lane + (lanes - 1) * size.laneGap;
  const warTop = bandHeight(reignLanes) + size.bandGap;
  const rowsTop = warTop + bandHeight(warLaneCount) + size.bandGap * 1.5;
  const rowStep = desktop ? size.row + size.rowGap : size.row + PROFIL_TEL + 14;
  const height = rowsTop + periods.length * rowStep;

  const shown = hover ?? year;
  const readout = useMemo(() => {
    if (shown === null) return null;
    const reigns = ribbons.filter((ribbon) => ribbon.from <= shown && shown <= ribbon.to).map((ribbon) => withoutHouse(tx(ribbon.name)));
    const conflicts = wars.filter((war) => war.from <= shown && shown <= war.to).map((war) => tx(war.title));
    return { year: formatYear(shown, reading), reigns: reigns.join(', '), wars: conflicts.join(', ') };
  }, [shown, ribbons, tx, reading]);

  const onMove = (event: PointerEvent<HTMLDivElement>) => {
    if (!geometry || event.pointerType !== 'mouse') return;
    if (event.clientX < geometry.left || event.clientX > geometry.left + geometry.width) {
      setHover(null);
      setHoverYear(null);
      return;
    }
    const raw = Math.floor(xToYear(scale, event.clientX - geometry.left));
    const next = clampToDomain(raw === 0 ? -1 : raw);
    setHover(next);
    setHoverYear(next);
  };
  const onLeave = () => {
    setHover(null);
    setHoverYear(null);
  };

  const open = (event: MouseEvent<HTMLAnchorElement>, to: string, centre: number) => {
    if (isModifiedClick(event)) return;
    event.preventDefault();
    setHoverYear(null);
    feu.passer(to, { year: centre });
  };

  const notch = ready && year !== null ? offset + yearCenter(scale, year) : null;

  return (
    <div className={styles.cadre}>
      <p className={styles.lecture} aria-hidden="true">
        {readout && desktop ? (
          <>
            <span className={styles.lectureAnnee}>{readout.year}</span>
            {readout.reigns ? <span className={styles.lectureRegne}>{readout.reigns}</span> : null}
            {readout.wars ? <span>{readout.wars}</span> : null}
          </>
        ) : null}
      </p>
      <div
        ref={ref}
        className={styles.figure}
        style={{ height: ready ? height : undefined }}
        onPointerMove={desktop ? onMove : undefined}
        onPointerLeave={desktop ? onLeave : undefined}
      >
        {ready ? (
          <>
            <svg className={styles.bandes} width={box.width} height={rowsTop} aria-hidden="true" focusable="false">
              <defs>
                <pattern id="v3-chron-conteste" width={4} height={4} patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
                  <rect width={2} height={4} className={styles.or} />
                </pattern>
              </defs>
              {ribbons.map((ribbon) => {
                const x0 = left(ribbon.from);
                return (
                  <rect
                    key={ribbon.id}
                    x={x0}
                    y={ribbon.lane * (size.lane + size.laneGap)}
                    width={Math.max(2, right(ribbon.to) - x0)}
                    height={size.lane}
                    className={ribbon.contested ? undefined : styles.or}
                    fill={ribbon.contested ? 'url(#v3-chron-conteste)' : undefined}
                    shapeRendering="crispEdges"
                  />
                );
              })}
              {wars.map((war) => {
                const x0 = left(war.from);
                const width = Math.max(MIN_WAR, right(war.to) - x0);
                const centre = x0 + (right(war.to) - x0) / 2;
                return (
                  <rect
                    key={war.id}
                    x={width === MIN_WAR ? centre - MIN_WAR / 2 : x0}
                    y={warTop + (warLanes.get(war.id) ?? 0) * (size.lane + size.laneGap)}
                    width={width}
                    height={size.lane}
                    className={styles.sang}
                    shapeRendering="crispEdges"
                  />
                );
              })}
            </svg>
            <span className={styles.bandeNom} style={{ top: 0 }} aria-hidden="true">
              {t('v2.chronicles.reigns')}
            </span>
            <span className={styles.bandeNom} style={{ top: warTop }} aria-hidden="true">
              {t('v2.chronicles.wars')}
            </span>

            <ol role="list" className={styles.rangees} style={{ top: rowsTop }}>
              {periods.map((period) => {
                const [from, to] = boundsOf(period);
                const x0 = left(from);
                const x1 = right(to);
                const centre = Math.round(xToYear(scale, (x0 + x1) / 2 - offset));
                const target = href(`/chroniques/${period.id}`);
                const toRight = x1 + GAP + size.dos <= box.width;
                const profiled = hasDragons([from, to]);
                const segmentW = Math.max(2, x1 - x0);
                return (
                  <li key={period.id} className={styles.rangee} style={{ height: rowStep }}>
                    <a
                      href={withBase(target)}
                      className={styles.lien}
                      onClick={(event) => open(event, target, clampToDomain(centre === 0 ? 1 : centre))}
                      onFocus={() => setHoverYear(null)}
                    >
                      <span
                        className={styles.dos}
                        data-cote={toRight ? 'droite' : 'gauche'}
                        style={desktop ? (toRight ? { left: x1 + GAP } : { left: x0 - GAP - size.dos }) : undefined}
                      >
                        <Dos period={period} actif={year !== null && year >= from && year <= to} />
                      </span>
                      {desktop ? (
                        <span className={styles.segment} style={{ left: x0, width: segmentW, height: size.row }} aria-hidden="true">
                          {profiled ? <Profil from={from} to={Math.min(DOMAIN[1], to + 1)} width={segmentW} height={size.row} full={size.row} /> : null}
                        </span>
                      ) : (
                        <span className={styles.profilTel} style={{ height: PROFIL_TEL }} aria-hidden="true">
                          {profiled ? (
                            <Profil from={from} to={Math.min(DOMAIN[1], to + 1)} width={box.width} height={PROFIL_TEL} full={PROFIL_TEL} />
                          ) : null}
                        </span>
                      )}
                      {desktop ? (
                        <svg className={styles.crochet} style={{ left: x0 }} width={Math.max(4, x1 - x0)} height={8} aria-hidden="true" focusable="false">
                          <path d={`M1 0V6H${Math.max(3, x1 - x0 - 1)}V0`} />
                        </svg>
                      ) : null}
                    </a>
                  </li>
                );
              })}
            </ol>

            {desktop && notch !== null ? (
              <span className={styles.entaille} style={{ transform: `translateX(${notch - 1}px)`, top: rowsTop }} aria-hidden="true" />
            ) : null}
          </>
        ) : null}
      </div>

      <div className="sr-only">
        <h2>{t('v2.chronicles.reigns_list')}</h2>
        <ul>
          {ribbons.map((ribbon) => (
            <li key={ribbon.id}>
              {withoutHouse(tx(ribbon.name))}, {formatSpan(ribbon.from, ribbon.to, reading)}
            </li>
          ))}
        </ul>
        <h2>{t('v2.chronicles.wars_list')}</h2>
        <ul>
          {wars.map((war) => (
            <li key={war.id}>
              {tx(war.title)}, {formatSpan(war.from, war.to, reading)}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
