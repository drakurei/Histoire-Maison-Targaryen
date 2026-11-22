import { useEffect, useMemo, useRef } from 'react';
import type { MouseEvent } from 'react';
import { useParams } from 'react-router-dom';

import { eventsOfPeriod, events as allEvents, getEvent, getPeriod } from '@/core/content/timeline';
import type { EntityRef, HistoricalEvent } from '@/core/content/types';
import { formatSpan, formatYear, useLang, useT, useTitle, useTx, useTxTypo, VALYRIAN_TAG, yearParts } from '@/core/i18n';
import { BookGlyph, ReliabilityGlyph } from '@/shared/marks/Marks';

import { Fiabilite } from '../components/Fiabilite';
import { useFeu } from '../components/Feu';
import { GrandNombre } from '../components/GrandNombre';
import { Introuvable } from '../components/Introuvable';
import { Lien } from '../components/Lien';
import { NomEntite } from '../components/NomEntite';
import { isModifiedClick, toRoman } from '../components/numerals';
import { Page } from '../components/Page';
import { Parti } from '../components/Parti';
import { SourcesPied } from '../components/SourcesPied';
import { Titre } from '../components/Titre';
import { useFasce } from '../state/fasce';
import { useLienHref } from '../state/links';
import { boundsOf } from '../state/scene';
import type { EntityKind } from '../state/useVoir';
import { useSetYear, useUrlYear } from '../state/year';

import { CarteTel } from './entree/CarteTel';
import { DESKTOP_QUERY, useMedia } from './entree/hooks';
import { chronology, neighboursOf, placeIdsOf } from './entree/model';
import { TempsVue } from './entree/TempsVue';
import styles from './EventPage.module.css';
import { withBase } from '@/app/paths';

/**
 * Le fil du temps de toute la chronique, calculé une fois. Les événements des livres se
 * suivent entre eux ; ceux de l'adaptation, tenus à part, ont leur propre fil.
 */
const CHRONOLOGY = chronology(allEvents);
const BOOKS = CHRONOLOGY.filter((item) => item.continuity === 'livres');
const SHOW = CHRONOLOGY.filter((item) => item.continuity === 'adaptation');

/**
 * Événement `/chroniques/:periodId/:eventId` (parti, spec §5.6). À gauche, l'année en grand
 * nombre, le titre, la période, le résumé, ce que cela change, les personnes, dragons et
 * lieux, la certitude, la continuité, les sources, puis le précédent et le suivant dans le
 * fil du temps. À droite, la carte de ses lieux et le profil de sa période. Ouvrir un
 * événement règle l'année sur la sienne.
 */
export default function EventPage() {
  const { eventId = '' } = useParams();
  const event = getEvent(eventId);
  if (!event) return <Introuvable />;
  return <EventView key={event.id} event={event} />;
}

interface ListeProps {
  label: string;
  kind: EntityKind;
  refs: readonly EntityRef[];
}

function Liste({ label, kind, refs }: ListeProps) {
  const t = useT();
  const tx = useTx();
  return (
    <div className={styles.rangee}>
      <dt className={styles.rangeeLabel}>{label}</dt>
      <dd className={styles.rangeeNoms}>
        {refs.length === 0 ? <span className={styles.aucun}>{t('v2.event.no_entities')}</span> : null}
        {refs.map((ref, index) => (
          <span key={`${ref.id ?? tx(ref.name)}-${index}`} className={styles.nom}>
            {ref.id ? <NomEntite kind={kind} id={ref.id} name={ref.name} /> : <span className={styles.sansFiche}>{tx(ref.name)}</span>}
          </span>
        ))}
      </dd>
    </div>
  );
}

interface VoisinProps {
  event: HistoricalEvent;
  sens: 'previous' | 'next';
  current: HistoricalEvent;
}

function Voisin({ event, sens, current }: VoisinProps) {
  const t = useT();
  const tx = useTxTypo();
  const href = useLienHref();
  const feu = useFeu();
  const { reading } = useLang();
  const to = `/chroniques/${event.periodId}/${event.id}`;
  const target = href(to, event.year ?? 'keep');
  // Changer de période par « suivant » : le feu part de l'année de l'événement (spec §5.6).
  const onClick = (click: MouseEvent<HTMLAnchorElement>) => {
    if (event.periodId === current.periodId || isModifiedClick(click)) return;
    click.preventDefault();
    feu.passer(target, { year: event.year ?? event.sortYear });
  };
  return (
    <a href={withBase(target)} className={`${styles.voisin} ${sens === 'next' ? styles.suivant : ''}`} onClick={onClick}>
      <span className={styles.voisinSens}>{t(sens === 'next' ? 'v2.event.next' : 'v2.event.previous')}</span>
      <span className={styles.voisinAnnee}>{event.year === null ? t('label.unknownDate') : formatYear(event.year, reading)}</span>
      <span className={styles.voisinTitre}>{tx(event.title)}</span>
    </a>
  );
}

function EventView({ event }: { event: HistoricalEvent }) {
  const t = useT();
  const tx = useTxTypo();
  const title = useTitle();
  const { reading } = useLang();
  const desktop = useMedia(DESKTOP_QUERY);
  const period = getPeriod(event.periodId);
  const bounds = period ? boundsOf(period) : event.year !== null ? ([event.year, event.yearEnd ?? event.year] as const) : null;
  useFasce({ span: bounds, marks: event.year !== null ? [{ year: event.year, active: true }] : [] });

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
  // La carte montre les lieux de la période, pour situer ; ceux de l'événement sont allumés.
  const placeIds = useMemo(() => [...new Set([...ownPlaces, ...periodPlaces])], [ownPlaces, periodPlaces]);
  const highlight = useMemo(() => (ownPlaces.length > 0 ? new Set(ownPlaces) : null), [ownPlaces]);
  const { previous, next } = neighboursOf(event.continuity === 'adaptation' ? SHOW : BOOKS, event.id);
  const parts = yearParts(event.year, reading);
  const mapTitle = t('v2.event.map', { title: tx(event.title) });
  const periodName = period ? title(period.title) : null;

  const entete = (
    <div className={styles.entete}>
      {parts ? (
        <div className={styles.annee}>
          <GrandNombre value={parts.value} era={parts.era} />
          <p className={event.yearEnd !== undefined || event.dateCertainty === 'approximative' ? styles.date : 'sr-only'}>
            <span className={event.yearEnd !== undefined ? undefined : 'sr-only'}>{formatSpan(event.year, event.yearEnd ?? event.year, reading)}</span>
            {event.dateCertainty === 'approximative' ? <span className={styles.approx}>{t('page.event.date.approximative')}</span> : null}
          </p>
        </div>
      ) : (
        <p className={styles.inconnue}>{t('label.unknownDate')}</p>
      )}
      <Titre text={event.title}>
        {period && periodName ? (
          <p className={styles.periode}>
            <span className={styles.periodeChiffre} aria-hidden="true">
              {toRoman(period.order)}
            </span>
            <Lien to={`/chroniques/${period.id}`} className={styles.periodeLien}>
              <span className="sr-only">{t('v2.event.period', { n: period.order })}, </span>
              <span lang={periodName.isHv ? VALYRIAN_TAG : undefined}>{periodName.primary}</span>
            </Lien>
            {periodName.gloss ? <span className={styles.periodeGlose}>{periodName.gloss}</span> : null}
          </p>
        ) : null}
      </Titre>
    </div>
  );

  const corps = (
    <div className={styles.corps}>
      <p className={styles.resume}>{tx(event.summary)}</p>

      {tx(event.consequence) ? (
        <section className={styles.bloc} aria-labelledby="ev-consequence">
          <h2 id="ev-consequence" className={styles.blocTitre}>
            {t('page.period.consequence')}
          </h2>
          <p className={styles.consequence}>{tx(event.consequence)}</p>
        </section>
      ) : null}

      {event.dateNote ? (
        <section className={styles.bloc} aria-labelledby="ev-date">
          <h2 id="ev-date" className={styles.blocTitre}>
            {t('v2.event.date_note')}
          </h2>
          <p className={styles.note}>{tx(event.dateNote)}</p>
        </section>
      ) : null}

      <dl className={styles.rangees}>
        <Liste label={t('page.event.people')} kind="person" refs={event.people} />
        <Liste label={t('page.event.dragons')} kind="dragon" refs={event.dragons} />
        <Liste label={t('page.event.places')} kind="place" refs={event.places} />
      </dl>

      <section className={styles.certitude} aria-labelledby="ev-certitude">
        <h2 id="ev-certitude" className={styles.blocTitre}>
          {t('label.reliability')}
        </h2>
        <Fiabilite level={event.reliability} className={styles.marque} />
        {event.reliabilityNote ? <p className={styles.note}>{tx(event.reliabilityNote)}</p> : null}
      </section>

      <section className={`${styles.certitude} ${event.continuity === 'adaptation' ? styles.adaptation : ''}`} aria-labelledby="ev-continuite">
        <h2 id="ev-continuite" className={styles.blocTitre}>
          {t('v2.event.continuity')}
        </h2>
        <p className={styles.continuite}>
          {event.continuity === 'adaptation' ? (
            <ReliabilityGlyph level="adaptation" className={styles.continuiteMarque} />
          ) : (
            <BookGlyph className={styles.continuiteMarque} />
          )}
          <span>{t(event.continuity === 'adaptation' ? 'label.continuity.show' : 'label.continuity.books')}</span>
        </p>
        {event.continuity === 'adaptation' ? <p className={styles.note}>{t('v2.event.show_note')}</p> : null}
      </section>

      <SourcesPied sources={event.sources} />

      {ownPlaces.length === 0 ? <p className={styles.legende}>{t('v2.event.no_places')}</p> : null}

      <nav className={styles.voisins} aria-label={t('v2.event.neighbours')}>
        {previous ? <Voisin event={previous} sens="previous" current={event} /> : <span />}
        {next ? <Voisin event={next} sens="next" current={event} /> : null}
      </nav>
    </div>
  );

  const temps = desktop ? (
    <TempsVue span={bounds} placeIds={placeIds} highlightIds={highlight} mapTitle={mapTitle} />
  ) : (
    <CarteTel title={mapTitle} placeIds={placeIds} highlightIds={highlight} />
  );

  return (
    <Page partition="parti" className={styles.page}>
      <Parti entete={entete} recit={corps} temps={temps} />
    </Page>
  );
}
