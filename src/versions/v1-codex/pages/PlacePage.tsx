import { useMemo } from 'react';
import { useParams } from 'react-router-dom';

import { MAIN_ID } from '@/app/a11y';
import { NotFound } from '../components/NotFound';
import { VLink } from '@/app/version';
import { getPlace, mapAvailable, places } from '@/core/content/places';
import { getEvent } from '@/core/content/timeline';
import type { Battle, HistoricalEvent } from '@/core/content/types';
import { battles as allBattles, getWar } from '@/core/content/wars';
import { formatYear, useLang, useT, useTitle, useTx, VALYRIAN_TAG } from '@/core/i18n';
import type { MapFrame } from '@/shared/map';

import { EntityLink } from '../components/EntityLink';
import { Figure } from '../components/Figure';
import { Folio } from '../components/Folio';
import { col } from '../components/grid';
import { Prose } from '../components/Prose';
import { ReliabilityMark } from '../components/ReliabilityMark';
import { Rubric } from '../components/Rubric';
import { SourceList } from '../components/SourceList';
import styles from './PlacePage.module.css';
import { CodexMap } from './places/CodexMap';
import { kindKey, nearestPlaces, toMapPlace } from './places/placeModel';

/** Largeur de la vue recadrée, en unités de la carte : une contrée et ses voisins. */
const CLOSE_VIEW = 300;
const NEIGHBOURS = 5;

/**
 * Un lieu (/lieux/:placeId) : la carte recadrée sur lui, sa description, ce que la dynastie
 * lui doit, puis les événements et les batailles qui s'y tiennent, dans l'ordre du temps.
 */
export default function PlacePage() {
  const { placeId = '' } = useParams();
  const place = getPlace(placeId);
  const t = useT();
  const tx = useTx();
  const title = useTitle();
  const { reading } = useLang();

  const mapPlaces = useMemo(
    () => places.map((other) => toMapPlace(other, title(other.name), `${t(kindKey(other.kind))}, ${tx(other.region)}`)),
    [title, t, tx],
  );

  if (!place) return <NotFound />;

  const name = title(place.name);
  const frame: MapFrame = { center: place.coord, width: CLOSE_VIEW };
  const events = place.eventIds
    .map((id) => getEvent(id))
    .filter((event): event is HistoricalEvent => event !== undefined)
    .sort((a, b) => a.sortYear - b.sortYear);
  const battleIds = new Set(place.battleIds);
  const battles = allBattles
    .filter((battle) => battleIds.has(battle.id) || battle.placeId === place.id)
    .sort((a, b) => (a.year ?? 0) - (b.year ?? 0));
  const near = nearestPlaces(place, places, NEIGHBOURS);

  return (
    <main id={MAIN_ID}>
      <Folio>
        <header className={`${col.pleine} ${styles.head}`}>
          <Rubric as="h1" text={place.name} size="monumental" />
          <p className={styles.kind}>
            {t(kindKey(place.kind))}, {tx(place.region)}
          </p>
        </header>

        {mapAvailable ? (
          <Figure className={`${col.pleine} ${styles.mapFigure}`} caption={<MapCaption text={t('page.place.map.caption', { name: NAME_SLOT })} name={name.primary} hv={name.isHv} />}>
            <CodexMap
              places={mapPlaces}
              title={t('page.place.map.title', { name: name.primary })}
              frame={frame}
              selectedId={place.id}
              variant="vignette"
            />
          </Figure>
        ) : null}

        <section className={col.rangee} aria-label={name.primary}>
          <div className={col.recit}>
            <Prose text={place.description} lettrine />
            <Rubric as="h2" k="page.place.role.heading" className={styles.subhead} />
            <Prose text={place.role} />
          </div>
          <aside className={`${col.marge} ${styles.margin}`}>
            <p className={styles.marginHead}>{t('page.place.near')}</p>
            <ul className={styles.near} role="list">
              {near.map((other) => {
                const otherName = title(other.name);
                return (
                  <li key={other.id}>
                    <VLink to={`/lieux/${other.id}`} className={styles.nearLink} lang={otherName.isHv ? VALYRIAN_TAG : undefined}>
                      {otherName.primary}
                    </VLink>
                    <span className={styles.nearKind}>{t(kindKey(other.kind))}</span>
                  </li>
                );
              })}
            </ul>
            <p className={`${styles.marginHead} ${styles.sourcesHead}`}>{t('label.sources')}</p>
            <SourceList sources={place.sources} />
          </aside>
        </section>

        <section className={`${col.pleine} ${styles.section}`} aria-labelledby="annales">
          <Rubric as="h2" id="annales" k="page.place.events.heading" />
          {events.length > 0 ? (
            <ol className={styles.annals} role="list">
              {events.map((event) => (
                <li key={event.id} className={styles.annal}>
                  <span className={styles.year}>{tx(event.yearLabel) || formatYear(event.year, reading)}</span>
                  <div className={styles.annalBody}>
                    <h3 className={styles.annalTitle}>
                      <EntityLink kind="event" id={event.id} periodId={event.periodId} name={event.title} />
                    </h3>
                    <ReliabilityMark level={event.reliability} compact className={styles.mark} />
                  </div>
                </li>
              ))}
            </ol>
          ) : (
            <p className={styles.nothing}>{t('page.place.nothing')}</p>
          )}
        </section>

        {battles.length > 0 ? (
          <section className={`${col.pleine} ${styles.section}`} aria-labelledby="batailles">
            <Rubric as="h2" id="batailles" k="page.place.battles.heading" />
            <ol className={styles.annals} role="list">
              {battles.map((battle) => (
                <BattleLine key={battle.id} battle={battle} />
              ))}
            </ol>
          </section>
        ) : null}

        <nav className={`${col.pleine} ${styles.pager}`} aria-label={t('page.place.back')}>
          <VLink to="/lieux" className={styles.back}>
            {t('page.place.back')}
          </VLink>
        </nav>
      </Folio>
    </main>
  );
}

function BattleLine({ battle }: { battle: Battle }) {
  const tx = useTx();
  const { reading } = useLang();
  const war = getWar(battle.warId);
  return (
    <li className={styles.annal}>
      <span className={styles.year}>{formatYear(battle.year, reading)}</span>
      <div className={styles.annalBody}>
        <h3 className={styles.annalTitle}>
          <EntityLink kind="battle" id={battle.id} warId={battle.warId} name={battle.name} />
        </h3>
        {war ? (
          <p className={styles.annalWar}>
            <EntityLink kind="war" id={war.id} name={war.title} />
          </p>
        ) : null}
        <p className={styles.annalOutcome}>{tx(battle.outcome)}</p>
      </div>
    </li>
  );
}

/** Repère du nom dans la légende : le nom valyrien y reçoit son balisage de langue. */
const NAME_SLOT = '\u0000';

function MapCaption({ text, name, hv }: { text: string; name: string; hv: boolean }) {
  const [before, after = ''] = text.split(NAME_SLOT);
  return (
    <>
      {before}
      <span lang={hv ? VALYRIAN_TAG : undefined}>{name}</span>
      {after}
    </>
  );
}
