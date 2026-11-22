import { useEffect, useMemo, useRef } from 'react';
import { useParams } from 'react-router-dom';

import { getDragon } from '@/core/content/dragons';
import { useEssay } from '@/core/content/essays';
import { eventsOfPeriod, getPeriod, openQuestionsOfPeriod, periods } from '@/core/content/timeline';
import type { Period, Reliability } from '@/core/content/types';
import { formatSpan, Gloss, useLang, useT, useTitle, useTxTypo, yearParts } from '@/core/i18n';
import { eventFacets } from '@/core/timeline';
import { col } from '@/versions/v1-codex/components/grid';
import { Passage } from '@/versions/v1-codex/components/Passage';
import { Prose } from '@/versions/v1-codex/components/Prose';
import { ReliabilityMark } from '@/versions/v1-codex/components/ReliabilityMark';
import { Rubric } from '@/versions/v1-codex/components/Rubric';
import { SourceList } from '@/versions/v1-codex/components/SourceList';
import { OpenQuestions } from '@/versions/v1-codex/pages/chronicles/OpenQuestions';
import { Carte } from '@/versions/v2/components/Carte';
import { toRoman } from '@/versions/v2/components/numerals';
import { Ombre } from '@/versions/v2/components/Ombre';
import { Annales } from '@/versions/v2/pages/entree/Annales';
import { CarteTel } from '@/versions/v2/pages/entree/CarteTel';
import { leadingDragon, placeIdsOf, placesOfYear } from '@/versions/v2/pages/entree/model';
import { hasDragons } from '@/versions/v2/pages/entree/TempsVue';
import { boundsOf } from '@/versions/v2/state/scene';
import { writeResume } from '@/versions/v2/state/storage';
import { useYear } from '@/versions/v2/state/year';

import { Colonne } from '../components/common/Colonne';
import { Parti3 } from '../components/common/Parti3';
import { DESKTOP, useMedia } from '../components/common/useMedia';
import { useVue } from '../components/common/useVue';
import { Vue } from '../components/common/Vue';
import { armerTourne, Tourne } from './entree/Tourne';
import { Voisins } from './entree/Voisins';
import NotFoundPage from './NotFoundPage';
import styles from './PeriodPage.module.css';

const RELIABILITY_ORDER: readonly Reliability[] = ['etabli', 'recit-unique', 'contradictoire', 'legende', 'adaptation'];
const ANNALS_ID = 'annales';
const QUESTIONS_ID = 'questions';

/**
 * Période (v3-spec §6.3, parti). Le folio porte le titre rubriqué, le chapeau, et en marge les
 * années, les marques de fiabilité comptées et le sommaire ; puis le récit en sections (lettrine
 * dorée à la première, sources en marge), les questions ouvertes et les volumes voisins, qui
 * tournent la page. La colonne du champ porte la carte de la période, le grand nombre au pied
 * de la carte et le profil soudé à la fasce. Les annales se posent sur le champ, sous le folio :
 * c'est un instrument, elles règlent l'année.
 */
export default function PeriodPage() {
  const { periodId = '' } = useParams();
  const period = getPeriod(periodId);
  if (!period) return <NotFoundPage />;
  return (
    <Tourne volume={period.id}>
      <PeriodView key={period.id} period={period} />
    </Tourne>
  );
}

function PeriodView({ period }: { period: Period }) {
  const t = useT();
  const typo = useTxTypo();
  const title = useTitle();
  const { reading } = useLang();
  const desktop = useMedia(DESKTOP);
  const year = useYear();
  const bounds = boundsOf(period);
  useVue({ span: bounds });

  const events = useMemo(() => eventsOfPeriod(period.id), [period.id]);
  const essay = useEssay(period.id);
  const placeIds = useMemo(() => placeIdsOf(events), [events]);
  const highlight = useMemo(() => placesOfYear(events, year), [events, year]);
  const levels = useMemo(() => {
    const counts = eventFacets(events).reliability;
    return RELIABILITY_ORDER.map((level) => ({ level, count: counts.find((facet) => facet.value === level)?.count ?? 0 })).filter(
      (entry) => entry.count > 0,
    );
  }, [events]);
  const lead = useMemo(() => {
    const id = leadingDragon(events);
    return id ? getDragon(id) : undefined;
  }, [events]);
  const questions = openQuestionsOfPeriod(period.id);
  const hasQuestions = questions.length > 0 || period.openQuestions.length > 0;

  const inPeriod = year !== null && year >= bounds[0] && year <= bounds[1];
  const parts = inPeriod ? yearParts(year, reading) : null;
  const nombre = parts ? { value: parts.value, era: parts.era } : { value: toRoman(period.order) };
  const profil = hasDragons(bounds) ? { from: bounds[0], to: bounds[1], span: bounds } : null;
  const name = title(period.title);
  const mapTitle = t('v2.period.map', { title: name.gloss ?? name.primary });

  const index = periods.findIndex((item) => item.id === period.id);
  const previous = periods[index - 1];
  const next = periods[index + 1];
  const voisin = (target: Period | undefined) =>
    target
      ? {
          to: `/chroniques/${target.id}`,
          mark: toRoman(target.order),
          title: <Gloss text={target.title} />,
          onClick: armerTourne,
        }
      : null;

  const entries = [
    ...essay.map((section) => ({ id: section.id, label: typo(section.heading) })),
    ...(hasQuestions ? [{ id: QUESTIONS_ID, label: t('page.period.questions.title') }] : []),
    { id: ANNALS_ID, label: t('page.period.annals.title') },
  ];

  // Reprise de lecture : la dernière section atteinte, par période.
  const recit = useRef<HTMLDivElement>(null);
  const yearRef = useRef(year);
  useEffect(() => {
    yearRef.current = year;
  }, [year]);
  useEffect(() => {
    const node = recit.current?.closest('article');
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

  const titreId = `v3-periode-${period.id}`;

  const sommaire = (
    <nav className={styles.sommaire} aria-label={t('v2.period.contents')}>
      <ol role="list">
        {entries.map((entry, position) => (
          <li key={entry.id}>
            <a href={`#${entry.id}`} className={styles.entree}>
              <span className={styles.rang} aria-hidden="true">
                {position + 1}
              </span>
              <span>{entry.label}</span>
            </a>
          </li>
        ))}
      </ol>
    </nav>
  );
  const note = period.note ? <p className={styles.note}>{typo(period.note)}</p> : null;

  const tete = (
    <header className={`${col.rangee} ${styles.tete}`}>
      <div className={`${col.recit} ${styles.titres}`}>
        <p className="sr-only">{t('v3.a.volume', { n: period.order })}</p>
        <Rubric as="h1" id={titreId} text={period.title} className={styles.titre} />
      </div>
      <div className={`${col.marge} ${styles.marge}`}>
        <p className={styles.annees}>
          <time>{formatSpan(period.from, period.to, reading)}</time>
        </p>
        {levels.length > 0 ? (
          <ul role="list" className={styles.niveaux} aria-label={t('label.reliability')}>
            {levels.map(({ level, count }) => (
              <li key={level} className={styles.niveau}>
                <ReliabilityMark level={level} compact />
                <span className={styles.compte}>{count}</span>
              </li>
            ))}
          </ul>
        ) : null}
      </div>
      <Prose text={period.summary} variant="chapeau" className={`${col.pleine} ${styles.chapeau}`} />
    </header>
  );

  // La marge savante de la première section porte le sommaire et la note sur les bornes.
  const folio = (
    <>
      <div ref={recit} className={styles.repere} aria-hidden="true" />
      {essay.length === 0 ? (
        <div className={`${col.rangee} ${styles.section}`}>
          <p className={`${col.recit} ${styles.attente}`} lang={reading}>
            {t('page.essay.pending')}
          </p>
          <div className={`${col.marge} ${styles.margeTete}`}>
            {sommaire}
            {note}
          </div>
        </div>
      ) : null}
      {essay.map((section, position) => (
        <section key={section.id} id={section.id} data-reprise="" className={`${col.rangee} ${styles.section}`} aria-labelledby={`${section.id}-t`}>
          <Rubric as="h2" id={`${section.id}-t`} text={section.heading} className={styles.intertitre} />
          <Passage
            notes={
              position === 0 ? (
                <>
                  {sommaire}
                  {note}
                  {section.sources.length > 0 ? <SourceList sources={section.sources} /> : null}
                </>
              ) : section.sources.length > 0 ? (
                <SourceList sources={section.sources} />
              ) : undefined
            }
          >
            <Prose text={section.body} lettrine={position === 0 ? 'gilded' : false} />
          </Passage>
        </section>
      ))}
      {hasQuestions ? (
        <section id={QUESTIONS_ID} data-reprise="" className={`${col.rangee} ${styles.section}`} aria-labelledby={`${QUESTIONS_ID}-t`}>
          <Rubric as="h2" id={`${QUESTIONS_ID}-t`} k="page.period.questions.title" className={styles.intertitre} />
          <p className={`${col.recit} ${styles.lead}`} lang={reading}>
            {t('page.period.questions.lead')}
          </p>
          <div className={col.pleine}>
            <OpenQuestions period={period} />
          </div>
        </section>
      ) : null}
      <Voisins
        label="page.period.nav.label"
        prevLabel="page.period.prev"
        nextLabel="page.period.next"
        prev={voisin(previous)}
        next={voisin(next)}
      />
    </>
  );

  const annales = (
    <section id={ANNALS_ID} className={styles.annales} aria-labelledby={`${ANNALS_ID}-t`}>
      <h2 id={`${ANNALS_ID}-t`} className={styles.annalesTitre}>
        {t('page.period.annals.title')}
      </h2>
      <p className={styles.annalesLead}>{t('v2.period.annals_lead')}</p>
      <Annales events={events} />
    </section>
  );

  const figure = desktop ? (
    <Carte title={mapTitle} placeIds={placeIds.length > 0 ? placeIds : undefined} highlightIds={highlight} />
  ) : (
    <CarteTel title={mapTitle} placeIds={placeIds} highlightIds={highlight} />
  );

  return (
    <Vue partition="parti" className={styles.vue}>
      <Parti3
        labelledBy={titreId}
        tete={tete}
        folio={folio}
        volume={period.order}
        profil={profil}
        suite={annales}
        colonne={<Colonne label={t('v3.a.colonne.periode')} figure={figure} nombre={desktop ? nombre : null} profil={profil} />}
      />
      {lead ? <Ombre once={`ombre:${period.id}`} look={lead.look} /> : null}
    </Vue>
  );
}
