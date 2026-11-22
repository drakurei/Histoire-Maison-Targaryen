import { useParams } from 'react-router-dom';

import { MAIN_ID } from '@/app/a11y';
import { NotFound } from '../components/NotFound';
import { VLink } from '@/app/version';
import { events, eventsOfPeriod, getEvent, getPeriod } from '@/core/content/timeline';
import type { EntityRef, HistoricalEvent } from '@/core/content/types';
import { Gloss, useLang, useT, yearParts } from '@/core/i18n';

import { EntityLink } from '../components/EntityLink';
import type { EntityKind } from '../components/EntityLink';
import { Figure } from '../components/Figure';
import { Folio } from '../components/Folio';
import { col } from '../components/grid';
import { toRoman } from '../components/numerals';
import { Prose } from '../components/Prose';
import { ReliabilityMark } from '../components/ReliabilityMark';
import { Rubric } from '../components/Rubric';
import { SourceList } from '../components/SourceList';
import { YearRule } from '../components/YearRule';
import { NeighbourNav } from './chronicles/NeighbourNav';
import type { Neighbour } from './chronicles/NeighbourNav';
import styles from './EventPage.module.css';
import { useTxTypo } from '../components/typo';

function MarginList({ titleKey, kind, refs }: { titleKey: string; kind: EntityKind; refs: readonly EntityRef[] }) {
  const t = useT();
  if (refs.length === 0) return null;
  return (
    <div className={styles.block}>
      <h2 className={styles.blockTitle}>{t(titleKey)}</h2>
      <ul role="list" className={styles.refs}>
        {refs.map((ref, index) => (
          <li key={`${ref.id ?? ref.name.fr}-${index}`}>
            <EntityLink kind={kind} id={ref.id} name={ref.name} />
          </li>
        ))}
      </ul>
    </div>
  );
}

/** La date monumentale : le nombre en gothique, le sigle d'ère en cartel ; à défaut, la date telle que la source la donne. */
function BigDate({ event }: { event: HistoricalEvent }) {
  const t = useT();
  const tx = useTxTypo();
  const { reading } = useLang();
  const start = yearParts(event.year, reading);
  if (!start) return <p className={styles.dateLoose}>{tx(event.yearLabel)}</p>;
  const end = event.yearEnd !== undefined && event.yearEnd !== event.year ? yearParts(event.yearEnd, reading) : null;
  const sameEra = end !== null && end.era === start.era;
  return (
    <p className={styles.date}>
      {event.dateCertainty === 'approximative' ? <span className={styles.approx}>{t('page.event.approx')}</span> : null}
      <span className={styles.number}>{start.value}</span>
      {end && !sameEra ? <span className={styles.era}>{start.era}</span> : null}
      {end ? (
        <>
          <span className={styles.dash} aria-hidden="true">
            {'–'}
          </span>
          <span className="sr-only"> {'–'} </span>
          <span className={styles.number}>{end.value}</span>
          <span className={styles.era}>{end.era}</span>
        </>
      ) : (
        <span className={styles.era}>{start.era}</span>
      )}
    </p>
  );
}

function neighbour(event: HistoricalEvent | undefined, tx: (loc: HistoricalEvent['title']) => string): Neighbour | null {
  if (!event) return null;
  return { to: `/chroniques/${event.periodId}/${event.id}`, mark: tx(event.yearLabel), markKind: 'date', title: tx(event.title) };
}

/**
 * Un événement (/chroniques/:periodId/:eventId) : la date en très grand, le titre, le récit
 * et ce qu'il change ; en marge, le volume, les personnes, dragons et lieux, la certitude et
 * les sources ; dessous, l'événement situé parmi ceux de son volume ; puis les voisins.
 */
export default function EventPage() {
  const { periodId = '', eventId = '' } = useParams();
  const t = useT();
  const tx = useTxTypo();
  const { reading } = useLang();
  const period = getPeriod(periodId);
  const event = getEvent(eventId);
  if (!period || !event || event.periodId !== period.id) return <NotFound />;

  const siblings = eventsOfPeriod(period.id);
  const leaf = siblings.indexOf(event) + 1;
  const index = events.indexOf(event);
  const placed = siblings.filter((item) => item.year !== null && item.continuity === 'livres');
  const ruleFrom = period.from ?? Math.min(...siblings.map((item) => item.year ?? item.sortYear), period.to - 1);
  const marks = [
    ...[...new Set(placed.map((item) => item.year as number))].filter((year) => year !== event.year).map((year) => ({ year })),
    ...(event.year !== null ? [{ year: event.year, label: tx(event.yearLabel), strong: true }] : []),
  ];

  return (
    <main id={MAIN_ID}>
      <Folio volume={period.order} leaf={leaf}>
        <div className={`${col.rangee} ${styles.head}`}>
          <BigDate event={event} />
          <VLink to={`/chroniques/${period.id}`} className={styles.volume}>
            <span className={styles.volumeNumber}>{t('page.event.in_volume', { n: toRoman(period.order) })}</span>
            <Gloss text={period.title} classes={{ main: styles.volumeTitle, tr: styles.volumeGloss }} />
          </VLink>
        </div>

        <Rubric as="h1" text={event.title} className={styles.title} />
        {event.dateNote || event.dateCertainty !== 'exacte' ? (
          <p className={styles.dateNote} lang={reading}>
            {tx(event.dateNote) || t(`page.event.date.${event.dateCertainty}`)}
          </p>
        ) : null}

        <div className={`${col.rangee} ${styles.body}`}>
          <div className={styles.text}>
            {event.continuity === 'adaptation' ? <p className={styles.adaptation}>{t('page.event.continuity.adaptation')}</p> : null}
            <Prose text={event.summary} lettrine />
            {tx(event.consequence) ? (
              <>
                <h2 className={styles.consequenceTitle}>{t('page.period.consequence')}</h2>
                <Prose text={event.consequence} className={styles.consequence} />
              </>
            ) : null}
          </div>

          <aside className={styles.margin}>
            <MarginList titleKey="page.event.people" kind="person" refs={event.people} />
            <MarginList titleKey="page.event.dragons" kind="dragon" refs={event.dragons} />
            <MarginList titleKey="page.event.places" kind="place" refs={event.places} />
            <div className={styles.block}>
              <h2 className={styles.blockTitle}>{t('page.event.reliability')}</h2>
              <ReliabilityMark level={event.reliability} className={styles.reliability} />
              {event.reliabilityNote ? (
                <p className={styles.note} lang={reading}>
                  {tx(event.reliabilityNote)}
                </p>
              ) : null}
            </div>
            {event.sources.length > 0 ? (
              <div className={styles.block}>
                <h2 className={styles.blockTitle}>{t('page.event.sources')}</h2>
                <SourceList sources={event.sources} />
              </div>
            ) : null}
          </aside>
        </div>

        {marks.length > 1 ? (
          <Figure className={`${col.pleine} ${styles.figure}`} caption={t('page.event.rule.label')}>
            <YearRule from={ruleFrom} to={period.to} marks={marks} label={t('page.event.rule.label')} />
          </Figure>
        ) : null}

        <NeighbourNav
          labelKey="page.event.nav.label"
          prevKey="page.event.prev"
          nextKey="page.event.next"
          prev={neighbour(events[index - 1], tx)}
          next={neighbour(events[index + 1], tx)}
        />
      </Folio>
    </main>
  );
}
