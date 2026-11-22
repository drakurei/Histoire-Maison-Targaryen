import { useMemo, useState } from 'react';
import type { MouseEvent, PointerEvent } from 'react';

import { formatSpan, formatYear, useLang, useT, useTitle, useTx, VALYRIAN_TAG } from '@/core/i18n';
import { reignRibbons, xToYear } from '@/core/timeline';

import { useFeu } from '../../components/Feu';
import { fasceScale, useFasceGeometry } from '../../components/fasce/geometry';
import { isModifiedClick, toRoman } from '../../components/numerals';
import { Profil } from '../../components/Profil';
import { withoutHouse } from '../../components/fasce/useYearInfo';
import { extentLanes, yearCenter, yearEdges } from '../../model/geometry';
import { useLienHref } from '../../state/links';
import { boundsOf, clampToDomain, DOMAIN, periods, sovereigns, wars } from '../../state/scene';
import { setHoverYear, useYear } from '../../state/year';

import { DESKTOP_QUERY, useBox, useMedia } from './hooks';
import { hasDragons } from './TempsVue';
import styles from './FigureChroniques.module.css';

/** Mesures de la figure, en pixels. Ordinateur, puis téléphone. */
const SIZES = {
  desktop: { lane: 7, laneGap: 3, row: 64, profile: 44, label: 280, bandGap: 18 },
  phone: { lane: 5, laneGap: 2, row: 88, profile: 26, label: 0, bandGap: 14 },
} as const;
const MIN_WAR = 6;
const LABEL_GAP = 16;

/**
 * Les chroniques en figure « fascé » (spec §5.4) : chaque période est une rangée qui porte
 * son segment de la fasce, à sa place exacte et à la même échelle, aligné au pixel sur la
 * fasce fixe. Au-dessus, les règnes (aplats d'or, en couloirs) et les guerres (aplats de
 * sang). Survoler la figure écrit l'année, ses règnes et ses guerres, et l'année dans le
 * cartel de la fasce ; activer une rangée ouvre la période, le feu parti de son abscisse.
 */
export function FigureChroniques() {
  const t = useT();
  const tx = useTx();
  const title = useTitle();
  const { reading } = useLang();
  const href = useLienHref();
  const feu = useFeu();
  const year = useYear();
  const geometry = useFasceGeometry();
  const desktop = useMedia(DESKTOP_QUERY);
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
  const reignTop = 0;
  const warTop = reignTop + bandHeight(reignLanes) + size.bandGap;
  const rowsTop = warTop + bandHeight(warLaneCount) + size.bandGap * 1.5;
  const height = rowsTop + periods.length * size.row;

  const shown = hover ?? year;
  const readout = useMemo(() => {
    if (shown === null) return null;
    const reigns = ribbons.filter((ribbon) => ribbon.from <= shown && shown <= ribbon.to).map((ribbon) => withoutHouse(tx(ribbon.name)));
    const conflicts = wars.filter((war) => war.from <= shown && shown <= war.to).map((war) => tx(war.title));
    return { year: formatYear(shown, reading), reigns: reigns.join(', '), wars: conflicts.join(', ') };
  }, [shown, ribbons, tx, reading]);

  const onMove = (event: PointerEvent<HTMLDivElement>) => {
    if (!geometry || event.pointerType !== 'mouse') return;
    const raw = Math.floor(xToYear(scale, event.clientX - geometry.left));
    const next = clampToDomain(raw === 0 ? -1 : raw);
    if (event.clientX < geometry.left || event.clientX > geometry.left + geometry.width) {
      setHover(null);
      setHoverYear(null);
      return;
    }
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
  const hoverX = ready && hover !== null ? offset + yearCenter(scale, hover) : null;

  return (
    <div className={styles.cadre}>
      <p className={styles.lecture} aria-hidden="true">
        {readout ? (
          <>
            <span className={styles.lectureAnnee}>{readout.year}</span>
            {readout.reigns ? <span className={styles.lectureRegne}>{readout.reigns}</span> : null}
            {readout.wars ? <span className={styles.lectureGuerre}>{readout.wars}</span> : null}
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
                <pattern id="v2-chron-conteste" width={4} height={4} patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
                  <rect width={2} height={4} className={styles.orPlein} />
                </pattern>
              </defs>
              {ribbons.map((ribbon) => {
                const x0 = left(ribbon.from);
                const width = Math.max(2, right(ribbon.to) - x0);
                return (
                  <rect
                    key={ribbon.id}
                    x={x0}
                    y={reignTop + ribbon.lane * (size.lane + size.laneGap)}
                    width={width}
                    height={size.lane}
                    className={ribbon.contested ? undefined : styles.orPlein}
                    fill={ribbon.contested ? 'url(#v2-chron-conteste)' : undefined}
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
            <span className={styles.bandeNom} style={{ top: reignTop }} aria-hidden="true">
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
                const name = title(period.title);
                const target = href(`/chroniques/${period.id}`);
                const toRight = !desktop || x1 + LABEL_GAP + size.label <= box.width;
                const profiled = hasDragons([from, to]);
                return (
                  <li key={period.id} className={styles.rangee} style={{ height: size.row }}>
                    <a
                      href={target}
                      className={styles.lien}
                      onClick={(event) => open(event, target, clampToDomain(centre === 0 ? 1 : centre))}
                      onFocus={() => setHoverYear(null)}
                    >
                      <span
                        className={styles.etiquette}
                        data-cote={toRight ? 'droite' : 'gauche'}
                        style={
                          desktop
                            ? toRight
                              ? { left: x1 + LABEL_GAP }
                              : { right: box.width - x0 + LABEL_GAP }
                            : undefined
                        }
                      >
                        <span className={styles.ligne1}>
                          <span className={styles.chiffre} aria-hidden="true">
                            {toRoman(period.order)}
                          </span>
                          <span className={styles.nom} lang={name.isHv ? VALYRIAN_TAG : undefined}>
                            {name.primary}
                          </span>
                        </span>
                        <span className={styles.ligne2}>
                          {name.gloss ? <span className={styles.glose}>{name.gloss}</span> : null}
                          <span className={styles.annees}>{formatSpan(period.from, period.to, reading)}</span>
                        </span>
                      </span>
                      <span
                        className={styles.segment}
                        style={{ left: x0, width: Math.max(2, x1 - x0), height: size.profile }}
                        aria-hidden="true"
                      >
                        {profiled ? (
                          <Profil from={from} to={Math.min(DOMAIN[1], to + 1)} width={Math.max(2, x1 - x0)} height={size.profile} full={size.profile} />
                        ) : null}
                      </span>
                      <svg
                        className={styles.crochet}
                        style={{ left: x0 }}
                        width={Math.max(4, x1 - x0)}
                        height={8}
                        aria-hidden="true"
                        focusable="false"
                      >
                        <path d={`M1 0V6H${Math.max(3, x1 - x0 - 1)}V0`} />
                      </svg>
                    </a>
                  </li>
                );
              })}
            </ol>

            {hoverX !== null ? <span className={styles.survol} style={{ transform: `translateX(${hoverX}px)`, top: 0 }} aria-hidden="true" /> : null}
            {notch !== null ? (
              <>
                <span className={styles.entaille} style={{ transform: `translateX(${notch - 1}px)`, top: rowsTop }} aria-hidden="true" />
                <span className={styles.trait} style={{ transform: `translateX(${notch - 1.5}px)` }} aria-hidden="true" />
              </>
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
