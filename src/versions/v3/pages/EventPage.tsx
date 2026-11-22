import { useEffect, useMemo, useRef } from 'react';
import type { MouseEvent } from 'react';
import { useParams } from 'react-router-dom';

import { events as allEvents, eventsOfPeriod, getEvent, getPeriod } from '@/core/content/timeline';
import type { EntityRef, HistoricalEvent } from '@/core/content/types';
import { formatSpan, formatYear, useLang, useT, useTitle, useTx, useTxTypo, VALYRIAN_TAG, yearParts } from '@/core/i18n';
import { BookGlyph, ReliabilityGlyph } from '@/shared/marks/Marks';
import { col } from '@/versions/v1-codex/components/grid';
import { Prose } from '@/versions/v1-codex/components/Prose';
import { ReliabilityMark } from '@/versions/v1-codex/components/ReliabilityMark';
import { Rubric } from '@/versions/v1-codex/components/Rubric';
import { SourceList } from '@/versions/v1-codex/components/SourceList';
import { Carte } from '@/versions/v2/components/Carte';
import { useFeu } from '@/versions/v2/components/Feu';
import { Lien } from '@/versions/v2/components/Lien';
import { isModifiedClick, toRoman } from '@/versions/v2/components/numerals';
import { CarteTel } from '@/versions/v2/pages/entree/CarteTel';
import { chronology, neighboursOf, placeIdsOf } from '@/versions/v2/pages/entree/model';
import { hasDragons } from '@/versions/v2/pages/entree/TempsVue';
import { useLienHref } from '@/versions/v2/state/links';
import type { LinkYear } from '@/versions/v2/state/links';
import { boundsOf } from '@/versions/v2/state/scene';
import type { EntityKind } from '@/versions/v2/state/useVoir';
import { useSetYear, useUrlYear } from '@/versions/v2/state/year';

import { Colonne } from '../components/common/Colonne';
import { Nom } from '../components/common/Nom';
import { Parti3 } from '../components/common/Parti3';
import { DESKTOP, useMedia } from '../components/common/useMedia';
import { useVue } from '../components/common/useVue';
import { Vue } from '../components/common/Vue';
import { Voisins } from './entree/Voisins';
import type { Voisin } from './entree/Voisins';
import NotFoundPage from './NotFoundPage';
import styles from './EventPage.module.css';

/** Le fil du temps de toute la chronique ; les livres et l'adaptation ont chacun le leur. */
const CHRONOLOGY = chronology(allEvents);
const BOOKS = CHRONOLOGY.filter((item) => item.continuity === 'livres');
const SHOW = CHRONOLOGY.filter((item) => item.continuity === 'adaptation');

/**
 * Événement (v3-spec §6.4, parti). Folio : l'année, le titre rubriqué, la période, le résumé
 * avec sa lettrine, ce que cela change, la note de date ; en marge savante les personnes,
 * dragons et lieux, la fiabilité, la continuité, les sources ; en pied, le précédent et le
 * suivant dans le fil de toute la chronique. Colonne : la carte cadrée sur ses lieux, son année
 * en grand nombre, le profil de sa période où l'année est en sang. Ouvrir un événement règle
 * l'année ; le feu ne part que si « suivant » change de période.
 */
export default function EventPage() {
  const { periodId = '', eventId = '' } = useParams();
  const event = getEvent(eventId);
  if (!event || event.periodId !== periodId) return <NotFoundPage />;
  return <EventView key={event.id} event={event} />;
}

function Liste({ label, kind, refs }: { label: string; kind: EntityKind; refs: readonly EntityRef[] }) {
  const tx = useTx();
  if (refs.length === 0) return null;
  return (
    <div className={styles.bloc}>
      <h2 className={styles.blocTitre}>{label}</h2>
      <ul role="list" className={styles.noms}>
        {refs.map((ref, index) => (
          <li key={`${ref.id ?? tx(ref.name)}-${index}`}>
            {ref.id ? <Nom kind={kind} id={ref.id} name={ref.name} /> : <span className={styles.sansFiche}>{tx(ref.name)}</span>}
          </li>
        ))}
      </ul>
    </div>
  );
}

function EventView({ event }: { event: HistoricalEvent }) {
  const t = useT();
  const tx = useTxTypo();
  const title = useTitle();
  const { reading } = useLang();
  const href = useLienHref();
  const feu = useFeu();
  const desktop = useMedia(DESKTOP);
  const period = getPeriod(event.periodId);
  const bounds = period ? boundsOf(period) : event.year !== null ? ([event.year, event.yearEnd ?? event.year] as const) : null;
  useVue({ span: bounds, marks: event.year !== null ? [{ year: event.year, active: true }] : [] });

  // Ouvrir un événement règle l'année sur la sienne (une fois, à l'arrivée).
  const urlYear = useUrlYear();
  const setYear = useSetYear();
  const arrived = useRef(false);
  useEffect(() => {
    if (arrived.current) return;
    arrived.current = true;
    if (event.year !== null && urlYear !== event.year) setYear(event.year);
  }, [event.year, urlYear, setYear]);

  const ownPlaces = useMemo(() => placeIdsOf([event]), [event]);
  const periodPlaces = useMemo(() => placeIdsOf(eventsOfPeriod(event.periodId)), [event.periodId]);
  const placeIds = useMemo(() => [...new Set([...ownPlaces, ...periodPlaces])], [ownPlaces, periodPlaces]);
  const highlight = useMemo(() => (ownPlaces.length > 0 ? new Set(ownPlaces) : null), [ownPlaces]);
  const { previous, next } = neighboursOf(event.continuity === 'adaptation' ? SHOW : BOOKS, event.id);
  const parts = yearParts(event.year, reading);
  const mapTitle = t('v2.event.map', { title: tx(event.title) });
  const titreId = `v3-evenement-${event.id}`;
  const adaptation = event.continuity === 'adaptation';
  const periodName = period ? title(period.title) : null;

  const voisin = (target: HistoricalEvent | null | undefined): Voisin | null => {
    if (!target) return null;
    const to = `/chroniques/${target.periodId}/${target.id}`;
    const year: LinkYear = target.year ?? 'keep';
    const onClick = (click: MouseEvent<HTMLAnchorElement>) => {
      if (target.periodId === event.periodId || isModifiedClick(click)) return;
      click.preventDefault();
      feu.passer(href(to, year), { year: target.year ?? target.sortYear });
    };
    return {
      to,
      year,
      mark: target.year === null ? t('label.unknownDate') : formatYear(target.year, reading),
      markKind: 'date',
      title: tx(target.title),
      onClick,
    };
  };

  const tete = (
    <header className={styles.tete}>
      {parts ? (
        <p className={styles.annee}>
          {event.dateCertainty === 'approximative' ? <span className={styles.approx}>{t('page.event.approx')} </span> : null}
          <span>{event.yearEnd !== undefined && event.yearEnd !== event.year ? formatSpan(event.year, event.yearEnd, reading) : formatYear(event.year, reading)}</span>
        </p>
      ) : (
        <p className={styles.annee} data-inconnue="">
          {t('label.unknownDate')}
        </p>
      )}
      <Rubric as="h1" id={titreId} text={event.title} className={styles.titre} />
      {period ? (
        <p className={styles.periode}>
          <span className={styles.periodeChiffre} aria-hidden="true">
            {toRoman(period.order)}
          </span>
          <Lien to={`/chroniques/${period.id}`} className={styles.periodeLien}>
            <span className="sr-only">{t('v2.event.period', { n: period.order })}, </span>
            <span lang={periodName?.isHv ? VALYRIAN_TAG : undefined}>{periodName?.primary}</span>
          </Lien>
          {periodName?.gloss ? <span className={styles.periodeGlose}>{periodName.gloss}</span> : null}
        </p>
      ) : null}
    </header>
  );

  const folio = (
    <>
      <div className={`${col.rangee} ${styles.corps}`}>
        <div className={col.recit}>
          {adaptation ? <p className={styles.adaptation}>{t('page.event.continuity.adaptation')}</p> : null}
          <Prose text={event.summary} lettrine />
          {tx(event.consequence) ? (
            <section className={styles.section} aria-labelledby="v3-ev-consequence">
              <Rubric as="h2" id="v3-ev-consequence" k="page.period.consequence" size="sous" />
              <Prose text={event.consequence} />
            </section>
          ) : null}
          {event.dateNote || event.dateCertainty !== 'exacte' ? (
            <section className={styles.section} aria-labelledby="v3-ev-date">
              <Rubric as="h2" id="v3-ev-date" k="v2.event.date_note" size="sous" />
              <p className={styles.dateNote} lang={reading}>
                {tx(event.dateNote) || t(`page.event.date.${event.dateCertainty}`)}
              </p>
            </section>
          ) : null}
        </div>
        <aside className={`${col.marge} ${styles.marge}`} aria-label={t('v3.a.marge')}>
          <Liste label={t('page.event.people')} kind="person" refs={event.people} />
          <Liste label={t('page.event.dragons')} kind="dragon" refs={event.dragons} />
          <Liste label={t('page.event.places')} kind="place" refs={event.places} />
          <div className={styles.bloc}>
            <h2 className={styles.blocTitre}>{t('page.event.reliability')}</h2>
            <ReliabilityMark level={event.reliability} />
            {event.reliabilityNote ? (
              <p className={styles.note} lang={reading}>
                {tx(event.reliabilityNote)}
              </p>
            ) : null}
          </div>
          <div className={styles.bloc}>
            <h2 className={styles.blocTitre}>{t('v2.event.continuity')}</h2>
            <p className={styles.continuite}>
              {adaptation ? <ReliabilityGlyph level="adaptation" className={styles.glyphe} /> : <BookGlyph className={styles.glyphe} />}
              <span>{t(adaptation ? 'label.continuity.show' : 'label.continuity.books')}</span>
            </p>
          </div>
          {event.sources.length > 0 ? (
            <div className={styles.bloc}>
              <h2 className={styles.blocTitre}>{t('page.event.sources')}</h2>
              <SourceList sources={event.sources} />
            </div>
          ) : null}
          {ownPlaces.length === 0 ? <p className={styles.note}>{t('v2.event.no_places')}</p> : null}
        </aside>
      </div>
      <Voisins
        label="v2.event.neighbours"
        prevLabel="v2.event.previous"
        nextLabel="v2.event.next"
        prev={voisin(previous)}
        next={voisin(next)}
      />
    </>
  );

  const profil =
    bounds && hasDragons(bounds)
      ? { from: bounds[0], to: bounds[1], span: event.year !== null ? ([event.year, event.yearEnd ?? event.year] as const) : bounds }
      : null;

  const figure = desktop ? (
    <Carte title={mapTitle} placeIds={placeIds.length > 0 ? placeIds : undefined} highlightIds={highlight} />
  ) : (
    <CarteTel title={mapTitle} placeIds={placeIds} highlightIds={highlight} />
  );

  return (
    <Vue partition="parti">
      <Parti3
        labelledBy={titreId}
        tete={tete}
        folio={folio}
        volume={period?.order}
        leaf={period ? eventsOfPeriod(period.id).indexOf(event) + 1 : undefined}
        profil={profil}
        colonne={
          <Colonne
            label={t('v3.a.colonne.evenement')}
            figure={figure}
            nombre={desktop && parts ? { value: parts.value, era: parts.era } : null}
            profil={profil}
          />
        }
      />
    </Vue>
  );
}
