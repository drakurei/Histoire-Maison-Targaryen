import { useEffect, useMemo } from 'react';
import { useLocation, useParams } from 'react-router-dom';

import { MAIN_ID } from '@/app/a11y';
import { NotFound } from '@/app/NotFound';
import { VLink } from '@/app/version';
import { getPlace, mapAvailable } from '@/core/content/places';
import { getPeriod } from '@/core/content/timeline';
import type { War } from '@/core/content/types';
import { getWar, wars } from '@/core/content/wars';
import { formatSpan, useLang, useT, useTitle, useTx, VALYRIAN_TAG } from '@/core/i18n';
import { boundsOfPoints } from '@/shared/map';
import type { MapBounds, MapFrame, WorldMapPlace } from '@/shared/map';

import { Figure } from '../components/Figure';
import { Folio } from '../components/Folio';
import { col } from '../components/grid';
import { toRoman } from '../components/numerals';
import { Prose } from '../components/Prose';
import { ReliabilityMark } from '../components/ReliabilityMark';
import { Rubric } from '../components/Rubric';
import { SourceList } from '../components/SourceList';
import { neighbours } from './dragons/registry';
import { CodexMap } from './places/CodexMap';
import styles from './WarPage.module.css';
import { BattleEntry } from './wars/BattleEntry';
import { Camps } from './wars/Camps';
import { battleMarkers, battlesInOrder } from './wars/warModel';

/** Largeur minimale de la carte de situation, en unités de la carte. */
const MIN_FRAME = 320;

/**
 * Un conflit (/guerres/:warId) : les camps face à face, les causes, la carte de situation des
 * batailles, les batailles dans l'ordre (numérotées comme sur la carte), les conséquences.
 */
export default function WarPage() {
  const { warId = '' } = useParams();
  const war = getWar(warId);
  const t = useT();
  const tx = useTx();
  const title = useTitle();
  const { reading } = useLang();
  const { hash } = useLocation();

  const ordered = useMemo(() => (war ? battlesInOrder(war) : []), [war]);
  const markers = useMemo(() => battleMarkers(ordered, getPlace), [ordered]);

  // Une ancre (#bataille) ouvre la page sur la bataille.
  useEffect(() => {
    if (!hash) return;
    const target = document.getElementById(decodeURIComponent(hash.slice(1)));
    if (target) {
      target.scrollIntoView({ block: 'start' });
      target.focus({ preventScroll: true });
    }
  }, [hash, warId]);

  if (!war) return <NotFound />;

  const name = title(war.title);
  const period = getPeriod(war.periodId);
  const { previous, next } = neighbours(wars, war.id);
  const mapped = new Set(markers.flatMap((marker) => marker.numbers));

  const mapPlaces: WorldMapPlace[] = markers.map((marker) => {
    const place = getPlace(marker.placeId);
    const placeName = place ? title(place.name) : null;
    return {
      id: marker.placeId,
      name: placeName?.primary ?? marker.placeId,
      nameLang: placeName?.isHv ? VALYRIAN_TAG : undefined,
      kind: place?.kind ?? 'champ-de-bataille',
      coord: marker.coord,
      href: `#${marker.battleId}`,
      mark: marker.numbers.join(','),
      detail: marker.numbers.map((n) => tx(ordered[n - 1]?.name)).join(' ; '),
    };
  });
  const bounds = boundsOfPoints(markers.map((marker) => marker.coord));
  const frame: MapFrame | undefined = bounds ? { bounds: widen(bounds, MIN_FRAME), pad: 0.16 } : undefined;

  return (
    <main id={MAIN_ID}>
      <Folio volume={period?.order}>
        <header className={`${col.pleine} ${styles.head}`}>
          <p className={styles.years}>
            <span>{formatSpan(war.from, war.to, reading)}</span>
            {period ? (
              <VLink to={`/chroniques/${period.id}`} className={styles.volume}>
                <span className={styles.numeral}>{toRoman(period.order)}</span> {tx(period.title)}
              </VLink>
            ) : null}
          </p>
          <Rubric as="h1" text={war.title} size="titre" className={styles.title} />
          <p className={styles.facts}>
            <span>{t(war.battles.length > 1 ? 'page.wars.battles' : 'page.wars.battle', { n: war.battles.length })}</span>
            <span>{t(war.continuity === 'livres' ? 'label.continuity.books' : 'label.continuity.show')}</span>
            <ReliabilityMark level={war.reliability} />
          </p>
        </header>

        <div className={`${col.recit} ${styles.summary}`}>
          <Prose text={war.summary} lettrine />
        </div>

        <section className={`${col.pleine} ${styles.section}`} aria-labelledby="camps">
          <Rubric as="h2" id="camps" k="page.war.camps.heading" />
          <div className={styles.campsBody}>
            <Camps sides={war.belligerents} />
          </div>
        </section>

        <section className={`${col.rangee} ${styles.section}`} aria-labelledby="causes">
          <div className={col.recit}>
            <Rubric as="h2" id="causes" k="page.war.causes.heading" />
            <Prose text={war.causes} className={styles.prose} />
          </div>
          <aside className={`${col.marge} ${styles.margin}`} aria-label={t('label.sources')}>
            <p className={styles.marginHead}>{t('label.sources')}</p>
            <SourceList sources={war.sources} />
          </aside>
        </section>

        {mapAvailable && mapPlaces.length > 0 ? (
          <Figure className={`${col.pleine} ${styles.mapFigure}`} caption={t('page.war.map.caption')}>
            <CodexMap places={mapPlaces} title={t('page.war.map.title', { name: name.primary })} frame={frame} variant="vignette" showRegions />
          </Figure>
        ) : null}

        <section className={`${col.pleine} ${styles.section}`} aria-labelledby="batailles">
          <Rubric as="h2" id="batailles" k="page.war.battles.heading" />
          <ol className={styles.battles} role="list">
            {ordered.map((battle, index) => (
              <BattleEntry key={battle.id} war={war} battle={battle} number={index + 1} mapped={mapped.has(index + 1)} />
            ))}
          </ol>
        </section>

        <section className={`${col.recit} ${styles.section}`} aria-labelledby="consequences">
          <Rubric as="h2" id="consequences" k="page.war.consequences.heading" />
          <Prose text={war.consequences} className={styles.prose} />
        </section>

        <nav className={`${col.pleine} ${styles.pager}`} aria-label={t('page.war.pager')}>
          {previous ? (
            <VLink to={`/guerres/${previous.id}`} className={styles.pagerLink} rel="prev">
              <span className={styles.pagerLabel}>{t('page.war.previous')}</span>
              <span className={styles.pagerName}>
                <EntityTitle war={previous} />
              </span>
            </VLink>
          ) : (
            <span />
          )}
          <VLink to="/guerres" className={styles.pagerHome}>
            {t('page.war.back')}
          </VLink>
          {next ? (
            <VLink to={`/guerres/${next.id}`} className={`${styles.pagerLink} ${styles.pagerNext}`} rel="next">
              <span className={styles.pagerLabel}>{t('page.war.next')}</span>
              <span className={styles.pagerName}>
                <EntityTitle war={next} />
              </span>
            </VLink>
          ) : (
            <span />
          )}
        </nav>
      </Folio>
    </main>
  );
}

/** Élargit un cadre trop serré autour de son centre (une guerre livrée en un seul lieu). */
function widen(bounds: MapBounds, min: number): MapBounds {
  const [x0, y0, x1, y1] = bounds;
  const cx = (x0 + x1) / 2;
  const cy = (y0 + y1) / 2;
  const w = Math.max(x1 - x0, min);
  const h = Math.max(y1 - y0, min * 0.6);
  return [cx - w / 2, cy - h / 2, cx + w / 2, cy + h / 2];
}

function EntityTitle({ war }: { war: War }) {
  const title = useTitle();
  const shown = title(war.title);
  return <span lang={shown.isHv ? VALYRIAN_TAG : undefined}>{shown.primary}</span>;
}

