import { useMemo } from 'react';
import { useParams } from 'react-router-dom';

import { MAIN_ID } from '@/app/a11y';
import { NotFound } from '../components/NotFound';
import { eventsOfPeriod, getPeriod, periods } from '@/core/content/timeline';
import type { Period } from '@/core/content/types';
import { formatSpan, Gloss, useLang, useT } from '@/core/i18n';

import { Folio } from '../components/Folio';
import { col } from '../components/grid';
import { toRoman } from '../components/numerals';
import { Passage } from '../components/Passage';
import { Prose } from '../components/Prose';
import { Rubric } from '../components/Rubric';
import { SourceList } from '../components/SourceList';
import { YearRule } from '../components/YearRule';
import type { YearMark, YearSpan } from '../components/YearRule';
import { Annals } from './chronicles/Annals';
import { NeighbourNav } from './chronicles/NeighbourNav';
import type { Neighbour } from './chronicles/NeighbourNav';
import { OpenQuestions } from './chronicles/OpenQuestions';
import styles from './PeriodPage.module.css';

function neighbour(period: Period | undefined): Neighbour | null {
  if (!period) return null;
  return {
    to: `/chroniques/${period.id}`,
    mark: toRoman(period.order),
    title: <Gloss text={period.title} />,
  };
}

/**
 * Un volume (/chroniques/:periodId). En-tête : le chiffre gothique géant, le titre valyrien
 * et sa glose, les années. Puis le chapeau, la règle du temps du volume, le récit long par
 * sections (s'il est écrit ; sinon les annales en tiennent lieu et le disent), les annales
 * filtrables, les questions ouvertes, et les volumes voisins.
 */
export default function PeriodPage() {
  const { periodId = '' } = useParams();
  const t = useT();
  const { reading } = useLang();
  const period = getPeriod(periodId);
  const events = eventsOfPeriod(periodId);

  const rule = useMemo(() => {
    if (!period) return null;
    const placed = events.filter((event) => event.continuity === 'livres').map((event) => event.year ?? event.sortYear);
    const from = period.from ?? Math.min(...placed, period.to - 1);
    // Une encoche rouge par année d'événement (une seule si plusieurs tombent la même année).
    const years = new Set(events.filter((event) => event.year !== null && event.continuity === 'livres').map((event) => event.year as number));
    const marks: YearMark[] = [...years].map((year) => ({ year, strong: true }));
    const spans: YearSpan[] = events
      .filter((event) => event.year !== null && event.yearEnd !== undefined && event.yearEnd !== event.year)
      .map((event) => ({ from: event.year as number, to: event.yearEnd as number, tone: 'rubrique' }));
    return { from, to: period.to, marks, spans };
  }, [period, events]);

  if (!period || !rule) return <NotFound />;

  const index = periods.indexOf(period);
  const essay = period.essay;

  return (
    <main id={MAIN_ID}>
      <Folio volume={period.order}>
        <header className={`${col.rangee} ${styles.head}`}>
          <span className={styles.numeral} aria-hidden="true">
            {toRoman(period.order)}
          </span>
          <div className={styles.headText}>
            <p className="sr-only">{t('page.bati.volume.numbered', { n: period.order })}</p>
            <Rubric as="h1" text={period.title} className={styles.title} />
            <p className={styles.years}>
              <time>{formatSpan(period.from, period.to, reading)}</time>
            </p>
          </div>
        </header>

        <Prose text={period.summary} variant="chapeau" className={styles.chapeau} />

        <div className={`${col.pleine} ${styles.rule}`}>
          <YearRule from={rule.from} to={rule.to} marks={rule.marks} spans={rule.spans} label={t('page.period.rule.label')} />
        </div>

        {essay.length > 0 ? (
          essay.map((section, position) => (
            <section key={section.id} className={`${col.rangee} ${styles.section}`} aria-labelledby={`recit-${section.id}`}>
              <Rubric as="h2" id={`recit-${section.id}`} text={section.heading} className={styles.sectionTitle} />
              <Passage notes={section.sources.length > 0 ? <SourceList sources={section.sources} /> : undefined}>
                <Prose text={section.body} lettrine={position === 0 ? 'gilded' : false} />
              </Passage>
            </section>
          ))
        ) : (
          <p className={styles.pending} lang={reading}>
            {t('page.period.essay.pending')}
          </p>
        )}

        <section className={`${col.rangee} ${styles.annals}`} aria-labelledby="annales">
          <Rubric as="h2" id="annales" k="page.period.annals.title" size="titre" className={styles.sectionTitle} />
          <p className={styles.annalsLead} lang={reading}>
            {t('page.period.annals.lead')}
          </p>
          <Annals events={events} />
        </section>

        {period.openQuestions.length > 0 ? (
          <section className={`${col.rangee} ${styles.section}`} aria-labelledby="questions">
            <Rubric as="h2" id="questions" k="page.period.questions.title" className={styles.sectionTitle} />
            <p className={styles.annalsLead} lang={reading}>
              {t('page.period.questions.lead')}
            </p>
            <OpenQuestions period={period} />
          </section>
        ) : null}

        <NeighbourNav
          labelKey="page.period.nav.label"
          prevKey="page.period.prev"
          nextKey="page.period.next"
          prev={neighbour(periods[index - 1])}
          next={neighbour(periods[index + 1])}
        />
      </Folio>
    </main>
  );
}
