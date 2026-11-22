import { useEffect, useMemo, useRef } from 'react';
import type { MouseEvent } from 'react';
import { useParams } from 'react-router-dom';

import { getDragon } from '@/core/content/dragons';
import { eventsOfPeriod, getPeriod, openQuestionsOfPeriod, periods } from '@/core/content/timeline';
import type { Period, Reliability } from '@/core/content/types';
import { formatSpan, useLang, useT, useTitle, useTxTypo, VALYRIAN_TAG, yearParts } from '@/core/i18n';
import { eventFacets } from '@/core/timeline';

import { Fiabilite } from '../components/Fiabilite';
import { useFeu } from '../components/Feu';
import { Introuvable } from '../components/Introuvable';
import { Note, NoteRef, useNotes } from '../components/Notes';
import { isModifiedClick, toRoman } from '../components/numerals';
import { Ombre } from '../components/Ombre';
import { Page } from '../components/Page';
import { Parti } from '../components/Parti';
import { Prose } from '../components/Prose';
import { Sommaire } from '../components/Sommaire';
import { SourcesPied } from '../components/SourcesPied';
import { Titre } from '../components/Titre';
import { Vide } from '../components/Vide';
import { useFasce } from '../state/fasce';
import { useLienHref } from '../state/links';
import { boundsOf } from '../state/scene';
import { writeResume } from '../state/storage';
import { useYear } from '../state/year';

import { Annales } from './entree/Annales';
import { CarteTel } from './entree/CarteTel';
import { DESKTOP_QUERY, useMedia } from './entree/hooks';
import { leadingDragon, placeIdsOf, placesOfYear } from './entree/model';
import { ProfilTel, TempsVue } from './entree/TempsVue';
import styles from './PeriodPage.module.css';
import { withBase } from '@/app/paths';

const RELIABILITY_ORDER: readonly Reliability[] = ['etabli', 'recit-unique', 'contradictoire', 'legende', 'adaptation'];
const ANNALS_ID = 'annales';
const QUESTIONS_ID = 'questions';

/**
 * Période `/chroniques/:periodId` (parti, spec §5.5) : le récit à gauche, la colonne du temps
 * et de l'espace à droite (carte des lieux de la période, profil soudé à la fasce, grand
 * nombre évidé). Les annales règlent l'année ; la carte allume les lieux de l'année.
 */
export default function PeriodPage() {
  const { periodId = '' } = useParams();
  const period = getPeriod(periodId);
  if (!period) return <Introuvable />;
  return <PeriodView key={period.id} period={period} />;
}

function PeriodView({ period }: { period: Period }) {
  const t = useT();
  const typo = useTxTypo();
  const title = useTitle();
  const { reading } = useLang();
  const href = useLienHref();
  const feu = useFeu();
  const notes = useNotes();
  const desktop = useMedia(DESKTOP_QUERY);
  const year = useYear();
  const bounds = boundsOf(period);
  useFasce({ span: bounds });

  const events = eventsOfPeriod(period.id);
  const placeIds = useMemo(() => placeIdsOf(events), [events]);
  const highlight = useMemo(() => placesOfYear(events, year), [events, year]);
  const levels = useMemo(() => {
    const counts = eventFacets(events).reliability;
    return RELIABILITY_ORDER.map((level) => ({ level, count: counts.find((facet) => facet.value === level)?.count ?? 0 })).filter(
      (entry) => entry.count > 0,
    );
  }, [events]);
  const questions = openQuestionsOfPeriod(period.id);
  const lead = useMemo(() => {
    const id = leadingDragon(events);
    return id ? getDragon(id) : undefined;
  }, [events]);

  const inPeriod = year !== null && year >= bounds[0] && year <= bounds[1];
  const parts = inPeriod ? yearParts(year, reading) : null;
  const nombre = parts ? { value: parts.value, era: parts.era, near: year } : { value: toRoman(period.order) };
  const name = title(period.title);
  const mapTitle = t('v2.period.map', { title: name.gloss ?? name.primary });

  const entries = [
    ...period.essay.map((section) => ({ id: section.id, label: typo(section.heading) })),
    { id: ANNALS_ID, label: t('page.period.annals.title') },
    ...(questions.length > 0 || period.openQuestions.length > 0 ? [{ id: QUESTIONS_ID, label: t('page.period.questions.title') }] : []),
  ];

  const index = periods.findIndex((item) => item.id === period.id);
  const previous = periods[index - 1];
  const next = periods[index + 1];
  const go = (event: MouseEvent<HTMLAnchorElement>, target: Period) => {
    if (isModifiedClick(event)) return;
    event.preventDefault();
    feu.passer(href(`/chroniques/${target.id}`), { year: boundsOf(target)[0] });
  };

  // Reprise de lecture : la dernière section atteinte, par période.
  const recit = useRef<HTMLDivElement>(null);
  const yearRef = useRef(year);
  yearRef.current = year;
  useEffect(() => {
    const node = recit.current;
    if (!node) return;
    const observer = new IntersectionObserver(
      (seen) => {
        const crossing = seen.filter((entry) => entry.isIntersecting).pop();
        if (!crossing) return;
        writeResume({ to: `/chroniques/${period.id}#${crossing.target.id}`, ref: period.id, year: yearRef.current });
      },
      { rootMargin: '-40% 0px -59% 0px' },
    );
    for (const section of node.querySelectorAll('[data-reprise]')) observer.observe(section);
    return () => observer.disconnect();
  }, [period.id]);

  const entete = (
    <div className={styles.entete}>
      <p className={styles.chiffre} aria-hidden="true">
        {toRoman(period.order)}
      </p>
      <Titre text={period.title}>
        <p className={styles.annees}>
          <span>{formatSpan(period.from, period.to, reading)}</span>
          {period.note ? <NoteRef {...notes.ref(1)} /> : null}
        </p>
        {period.note ? (
          <Note {...notes.note(1)}>
            <p>{typo(period.note)}</p>
          </Note>
        ) : null}
        {levels.length > 0 ? (
          <ul role="list" className={styles.niveaux} aria-label={t('label.reliability')}>
            {levels.map(({ level, count }) => (
              <li key={level} className={styles.niveau}>
                <Fiabilite level={level} />
                <span className={styles.compte}>{count}</span>
              </li>
            ))}
          </ul>
        ) : null}
      </Titre>
    </div>
  );

  const temps = desktop ? (
    <TempsVue span={bounds} placeIds={placeIds} highlightIds={highlight} mapTitle={mapTitle} nombre={nombre} />
  ) : (
    <ProfilTel span={bounds} nombre={nombre} />
  );

  const corps = (
    <div ref={recit} className={styles.recit}>
      <Prose text={period.summary} variant="chapeau" className={styles.chapeau} />
      <Sommaire entries={entries} label={t('v2.period.contents')} className={styles.sommaire} />

      {period.essay.length === 0 ? <Vide>{t('v2.period.no_essay')}</Vide> : null}
      {period.essay.map((section, position) => (
        <section key={section.id} id={section.id} data-reprise="" className={styles.section} aria-labelledby={`${section.id}-t`}>
          <h2 id={`${section.id}-t`} className={styles.intertitre}>
            <span className={styles.rang} aria-hidden="true">
              {position + 1}
            </span>
            <span>{typo(section.heading)}</span>
          </h2>
          <Prose text={section.body} />
          <SourcesPied sources={section.sources} />
        </section>
      ))}

      <section id={ANNALS_ID} data-reprise="" className={styles.annalesSection} aria-labelledby={`${ANNALS_ID}-t`}>
        <h2 id={`${ANNALS_ID}-t`} className={styles.intertitre}>
          <span className={styles.rang} aria-hidden="true">
            {period.essay.length + 1}
          </span>
          <span>{t('page.period.annals.title')}</span>
        </h2>
        <p className={styles.annalesChapeau}>{t('v2.period.annals_lead')}</p>
        <Annales
          events={events}
          carte={desktop ? null : <CarteTel title={mapTitle} placeIds={placeIds} highlightIds={highlight} />}
        />
      </section>

      {questions.length > 0 || period.openQuestions.length > 0 ? (
        <section id={QUESTIONS_ID} data-reprise="" className={styles.section} aria-labelledby={`${QUESTIONS_ID}-t`}>
          <h2 id={`${QUESTIONS_ID}-t`} className={styles.intertitre}>
            <span className={styles.rang} aria-hidden="true">
              {period.essay.length + 2}
            </span>
            <span>{t('page.period.questions.title')}</span>
          </h2>
          <p className={styles.annalesChapeau}>{t('page.period.questions.lead')}</p>
          {questions.length > 0 ? (
            <ol role="list" className={styles.questions}>
              {questions.map((question) => (
                <li key={question.id} className={styles.question}>
                  <h3 className={styles.questionTitre}>{typo(question.question)}</h3>
                  <div className={styles.questionPart}>
                    <p className={styles.partLabel}>{t('page.period.q.established')}</p>
                    <Prose text={question.established} />
                  </div>
                  <div className={styles.questionPart}>
                    <p className={styles.partLabel}>{t('page.period.q.hypothesis')}</p>
                    <Prose text={question.hypothesis} />
                  </div>
                  {question.adaptation ? (
                    <div className={`${styles.questionPart} ${styles.adaptation}`}>
                      <p className={styles.partLabel}>{t('page.period.q.adaptation')}</p>
                      <Prose text={question.adaptation} />
                    </div>
                  ) : null}
                  <SourcesPied sources={question.sources} />
                </li>
              ))}
            </ol>
          ) : (
            <ul role="list" className={styles.questions}>
              {period.openQuestions.map((question, position) => (
                <li key={position} className={styles.questionTitre}>
                  {typo(question)}
                </li>
              ))}
            </ul>
          )}
        </section>
      ) : null}

      <nav className={styles.voisins} aria-label={t('v2.period.neighbours')}>
        {previous ? (
          <a href={withBase(href(`/chroniques/${previous.id}`))} className={styles.voisin} onClick={(event) => go(event, previous)}>
            <span className={styles.voisinSens}>{t('v2.period.previous')}</span>
            <span className={styles.voisinNom}>
              <span className={styles.voisinChiffre} aria-hidden="true">
                {toRoman(previous.order)}
              </span>
              <span lang={title(previous.title).isHv ? VALYRIAN_TAG : undefined}>{title(previous.title).primary}</span>
            </span>
            {title(previous.title).gloss ? <span className={styles.voisinGlose}>{title(previous.title).gloss}</span> : null}
          </a>
        ) : (
          <span />
        )}
        {next ? (
          <a href={withBase(href(`/chroniques/${next.id}`))} className={`${styles.voisin} ${styles.suivant}`} onClick={(event) => go(event, next)}>
            <span className={styles.voisinSens}>{t('v2.period.next')}</span>
            <span className={styles.voisinNom}>
              <span className={styles.voisinChiffre} aria-hidden="true">
                {toRoman(next.order)}
              </span>
              <span lang={title(next.title).isHv ? VALYRIAN_TAG : undefined}>{title(next.title).primary}</span>
            </span>
            {title(next.title).gloss ? <span className={styles.voisinGlose}>{title(next.title).gloss}</span> : null}
          </a>
        ) : null}
      </nav>
    </div>
  );

  return (
    <Page partition="parti" className={styles.page}>
      <Parti entete={entete} recit={corps} temps={temps} />
      {lead ? <Ombre once={`ombre:${period.id}`} look={lead.look} /> : null}
    </Page>
  );
}
