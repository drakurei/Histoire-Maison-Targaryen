import { useParams } from 'react-router-dom';

import { MAIN_ID } from '@/app/a11y';
import { NotFound } from '@/app/NotFound';
import { VLink } from '@/app/version';
import { getBiography } from '@/core/content/biographies';
import { getDragon } from '@/core/content/dragons';
import { getPerson, sovereigns } from '@/core/content/people';
import { events } from '@/core/content/timeline';
import type { Biography, Dragon, HistoricalEvent, Person, SourceRef } from '@/core/content/types';
import { formatSpan, formatYear, useLang, useT, useTitle, useTx } from '@/core/i18n';
import { DragonFigure } from '@/shared/dragon';
import { NARRATIVE_END } from '@/core/timeline';

import { EntityLink } from '../components/EntityLink';
import { Folio } from '../components/Folio';
import { col } from '../components/grid';
import { toRoman } from '../components/numerals';
import { Prose } from '../components/Prose';
import { ReliabilityMark } from '../components/ReliabilityMark';
import { Rubric } from '../components/Rubric';
import { SourceList } from '../components/SourceList';
import { YearRule } from '../components/YearRule';
import type { YearMark, YearSpan } from '../components/YearRule';
import { CROWNED, graph, RIDERS, shortName } from './lineage/model';
import styles from './PersonPage.module.css';
import { Kinship } from './people/Kinship';

/** Événements des annales où la personne paraît, dans l'ordre du temps. */
function eventsOf(person: Person, biography: Biography | undefined): HistoricalEvent[] {
  const extra = new Set(biography?.eventIds ?? []);
  return events.filter((event) => extra.has(event.id) || event.people.some((ref) => ref.id === person.id)).sort((a, b) => a.sortYear - b.sortYear);
}

/** Les livres d'un côté, l'adaptation télévisée de l'autre : elle n'entre pas dans la ligne de vie. */
function splitContinuity(list: readonly HistoricalEvent[]): { books: HistoricalEvent[]; show: HistoricalEvent[] } {
  return { books: list.filter((event) => event.continuity === 'livres'), show: list.filter((event) => event.continuity !== 'livres') };
}

/** Dragons montés : registre des dragons et biographie réunis. */
function dragonsOf(person: Person, biography: Biography | undefined): Dragon[] {
  const ids = new Set([...(RIDERS.get(person.id) ?? []), ...(biography?.dragonIds ?? [])]);
  return [...ids].map((id) => getDragon(id)).filter((dragon): dragon is Dragon => dragon !== undefined);
}

/** Bornes de la ligne de vie : tout ce qu'une source rattache à cette vie, avec un peu d'air. */
function lifeBounds(person: Person, annals: readonly HistoricalEvent[]): [number, number] | null {
  const known = [
    person.born,
    person.died,
    ...(person.bornRange ?? []),
    ...(person.diedRange ?? []),
    ...(person.reign ?? []),
    person.pretender?.from ?? null,
    person.pretender?.to ?? null,
    person.alive ? NARRATIVE_END : null,
    ...annals.map((event) => event.year),
  ].filter((year): year is number => typeof year === 'number');
  if (known.length === 0) return null;
  const first = Math.min(...known);
  const last = Math.max(...known);
  const pad = Math.max(3, Math.round((last - first) * 0.08));
  return [first - pad, last + pad];
}

function sourceRefs(person: Person, biography: Biography | undefined): SourceRef[] {
  if (biography && biography.sources.length > 0) return biography.sources;
  return person.sources.map((id) => ({ id }));
}

/**
 * Fiche d'un personnage (/personnages/:personId) : l'initiale gothique, le nom, l'épithète et
 * les titres ; la ligne de vie sur la règle du temps (règne à l'or, événements des annales) ;
 * la parenté en notation généalogique ; la biographie par sections quand elle est rédigée,
 * une notice sinon ; les dragons montés ; ce que les sources ne tranchent pas ; ce que
 * l'adaptation change, tenu à part ; les sources.
 */
export default function PersonPage() {
  const { personId = '' } = useParams();
  const person = getPerson(personId);
  const t = useT();
  const tx = useTx();
  const title = useTitle();
  const { reading } = useLang();
  if (!person) return <NotFound />;

  const biography = person.hasBiography ? getBiography(person.id) : undefined;
  const sovereign = sovereigns.find((entry) => entry.id === person.id);
  const crowned = CROWNED.has(person.id);
  const { books: annals, show } = splitContinuity(eventsOf(person, biography));
  const mounts = dragonsOf(person, biography);
  const bounds = lifeBounds(person, annals);
  const name = shortName(person, reading);
  const initial = name.charAt(0);
  const parentage = graph.parentageByChild.get(person.id);
  const doubtfulParentage = parentage && parentage.certainty !== 'etabli' && parentage.note ? parentage : null;
  const disputed = biography?.disputed ?? null;
  const datesDoubt = person.dateCertainty !== 'exacte';
  const hasDoubt = Boolean(disputed || doubtfulParentage || datesDoubt);

  const marks: YearMark[] = [];
  const spans: YearSpan[] = [];
  if (bounds) {
    const start = person.born ?? person.bornRange?.[1] ?? null;
    const end = person.died ?? (person.alive ? NARRATIVE_END : (person.diedRange?.[0] ?? null));
    if (start !== null || end !== null) spans.push({ from: start ?? end ?? 0, to: end ?? start ?? 0, tone: 'encre', label: name });
    if (person.pretender) spans.push({ from: person.pretender.from, to: person.pretender.to ?? end ?? person.pretender.from, tone: 'rubrique', label: t('page.person.rule.claim') });
    if (person.reign) spans.push({ from: person.reign[0], to: person.reign[1], tone: 'or', label: t('page.person.rule.reign') });
    if (person.born !== null) marks.push({ year: person.born, label: t('page.person.rule.born'), strong: true });
    if (person.died !== null) marks.push({ year: person.died, label: t('page.person.rule.died'), strong: true });
    if (person.reign) marks.push({ year: person.reign[0], label: t('page.person.rule.crowned'), strong: true });
    for (const event of annals) if (event.year !== null) marks.push({ year: event.year });
  }

  const lifeParts = [
    person.born !== null ? `° ${formatYear(person.born, reading)}` : null,
    person.died !== null ? `† ${formatYear(person.died, reading)}` : null,
  ].filter((part): part is string => part !== null);

  return (
    <main id={MAIN_ID}>
      <Folio>
        <header className={`${col.pleine} ${styles.head}`}>
          <span className={styles.initial} data-crowned={crowned || undefined} aria-hidden="true">
            {initial}
          </span>
          <div className={styles.identity}>
            <Rubric as="h1" text={person.name} className={styles.title} />
            {person.epithet ? <p className={styles.epithet}>{tx(person.epithet)}</p> : null}
            {biography && biography.titles.length > 0 ? (
              <ul className={styles.titles} role="list">
                {biography.titles.map((entry, index) => (
                  <li key={index}>{tx(entry)}</li>
                ))}
              </ul>
            ) : null}
            <p className={styles.dates}>
              {lifeParts.length > 0 ? (
                lifeParts.map((part) => (
                  <span key={part} className={styles.life}>
                    {part}
                  </span>
                ))
              ) : (
                <span className={styles.life}>{t('page.person.datesUnknown')}</span>
              )}
              {person.alive ? <span className={styles.alive}>{t(person.sex === 'f' ? 'page.person.alive.f' : 'page.person.alive.m')}</span> : null}
              <span className={styles.house}>{t('page.person.house', { house: t(`page.people.house.${person.house}`) })}</span>
            </p>
          </div>
        </header>

        <div className={`${col.rangee} ${styles.opening}`}>
          <div className={col.recit}>
            {biography ? <Prose text={biography.lead} variant="chapeau" /> : <Prose text={person.note} variant="chapeau" />}
          </div>
          <aside className={`${col.marge} ${styles.margin}`}>
            {sovereign ? (
              <div className={styles.crownNote}>
                <p className={styles.reignLine}>
                  {sovereign.ordinal !== null ? (
                    <span className={styles.ordinal}>{toRoman(sovereign.ordinal)}</span>
                  ) : null}
                  <span>{t('page.person.reign', { span: formatSpan(sovereign.reignFrom, sovereign.reignTo, reading) })}</span>
                </p>
                <p>{tx(sovereign.relationToPredecessor)}</p>
                {sovereign.contested && sovereign.contestedNote ? <p>{tx(sovereign.contestedNote)}</p> : null}
              </div>
            ) : null}
            {person.pretender ? (
              <div className={styles.claim}>
                <p>{t('page.person.claim', { span: formatSpan(person.pretender.from, person.pretender.to, reading) })}</p>
                {person.pretender.note ? <p>{tx(person.pretender.note)}</p> : null}
              </div>
            ) : null}
            <VLink to={`/lignee?p=${person.id}`} className={styles.treeLink}>
              {t('page.person.inTree')}
            </VLink>
          </aside>
        </div>

        {bounds ? (
          <section className={`${col.pleine} ${styles.section}`} aria-labelledby="ligne-de-vie">
            <Rubric as="h2" id="ligne-de-vie" k="page.person.life.heading" />
            <YearRule
              from={bounds[0]}
              to={bounds[1]}
              marks={marks}
              spans={spans}
              label={t('page.person.life.label', { name })}
              className={styles.rule}
            />
            {annals.length > 0 ? (
              <ol className={styles.annals} role="list">
                {annals.map((event) => (
                  <li key={event.id} className={styles.annal}>
                    <span className={styles.annalYear}>{tx(event.yearLabel) || formatYear(event.year, reading)}</span>
                    <span className={styles.annalTitle}>
                      <EntityLink kind="event" id={event.id} name={event.title} periodId={event.periodId} />
                    </span>
                    <ReliabilityMark level={event.reliability} compact className={styles.annalMark} />
                  </li>
                ))}
              </ol>
            ) : (
              <p className={styles.quiet}>{t('page.person.life.noEvents')}</p>
            )}
          </section>
        ) : null}

        <section className={`${col.rangee} ${styles.section}`} aria-labelledby="parente">
          <div className={col.large}>
            <Rubric as="h2" id="parente" k="page.person.kin.heading" />
            <Kinship person={person} />
          </div>
        </section>

        {biography && biography.sections.length > 0 ? (
          biography.sections.map((section, index) => (
            <section key={section.id} className={`${col.rangee} ${styles.section}`} aria-labelledby={`bio-${section.id}`}>
              <div className={col.recit}>
                <Rubric as="h2" id={`bio-${section.id}`} text={section.heading} />
                <Prose text={section.body} lettrine={index === 0} />
              </div>
              {section.sources.length > 0 ? (
                <aside className={col.marge}>
                  <SourceList sources={section.sources} variant="marge" />
                </aside>
              ) : null}
            </section>
          ))
        ) : (
          <section className={`${col.rangee} ${styles.section}`} aria-labelledby="notice">
            <div className={col.recit}>
              <Rubric as="h2" id="notice" k="page.person.notice.heading" />
              <p className={styles.notice}>{t('page.person.notice.body', { name })}</p>
            </div>
          </section>
        )}

        {mounts.length > 0 ? (
          <section className={`${col.pleine} ${styles.section}`} aria-labelledby="dragons">
            <Rubric as="h2" id="dragons" k={mounts.length > 1 ? 'page.person.dragons.many' : 'page.person.dragons.one'} />
            <ul className={styles.mounts} role="list">
              {mounts.map((dragon) => {
                const dragonTitle = title(dragon.name);
                const rides = dragon.riders.filter((rider) => rider.personId === person.id);
                const ridden = rides.find((rider) => rider.from !== undefined || rider.to !== undefined);
                return (
                  <li key={dragon.id} className={styles.mount}>
                    <div className={styles.mountFigure} aria-hidden="true">
                      <div style={{ inlineSize: `${Math.round(40 + 60 * Math.min(dragon.look.span, 1))}%` }}>
                        <DragonFigure look={dragon.look} title={dragonTitle.primary} tone="engraving" detail="plain" />
                      </div>
                    </div>
                    <p className={styles.mountName}>
                      <EntityLink kind="dragon" id={dragon.id} name={dragon.name} />
                    </p>
                    {ridden ? <p className={styles.mountYears}>{formatSpan(ridden.from, ridden.to, reading)}</p> : null}
                  </li>
                );
              })}
            </ul>
          </section>
        ) : null}

        {hasDoubt ? (
          <section className={`${col.rangee} ${styles.section}`} aria-labelledby="doutes">
            <div className={col.recit}>
              <Rubric as="h2" id="doutes" k="page.person.doubt.heading" />
              {disputed ? <Prose text={disputed} /> : null}
              {doubtfulParentage ? (
                <div className={styles.doubt}>
                  <ReliabilityMark level={doubtfulParentage.certainty} />
                  <Prose text={doubtfulParentage.note} />
                </div>
              ) : null}
              {datesDoubt ? (
                <p className={styles.doubtLine}>{t(person.dateCertainty === 'inconnue' ? 'page.person.doubt.datesUnknown' : 'page.person.doubt.datesApprox')}</p>
              ) : null}
            </div>
          </section>
        ) : null}

        {biography?.adaptation || show.length > 0 ? (
          <section className={`${col.rangee} ${styles.section}`} aria-labelledby="adaptation">
            <div className={`${col.recit} ${styles.adaptation}`}>
              <p className={styles.adaptationMark}>
                <ReliabilityMark level="adaptation" />
              </p>
              <Rubric as="h2" id="adaptation" k="page.person.adaptation.heading" size="sous" />
              {biography?.adaptation ? <Prose text={biography.adaptation} /> : null}
              {show.length > 0 ? (
                <ul className={styles.showList} role="list">
                  {show.map((event) => (
                    <li key={event.id}>
                      <EntityLink kind="event" id={event.id} name={event.title} periodId={event.periodId} />
                    </li>
                  ))}
                </ul>
              ) : null}
            </div>
          </section>
        ) : null}

        <section className={`${col.rangee} ${styles.section}`} aria-labelledby="sources">
          <div className={col.recit}>
            <Rubric as="h2" id="sources" k="label.sources" size="sous" />
            <SourceList sources={sourceRefs(person, biography)} variant="bloc" />
          </div>
        </section>
      </Folio>
    </main>
  );
}
