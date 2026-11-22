import { useMemo } from 'react';
import { useParams } from 'react-router-dom';

import { MAIN_ID } from '@/app/a11y';
import { NotFound } from '../components/NotFound';
import { VLink } from '@/app/version';
import { dragons, getDragon, getExtraTextualNote, getLookNote } from '@/core/content/dragons';
import { getPerson } from '@/core/content/people';
import { events, periods } from '@/core/content/timeline';
import type { Battle, Dragon } from '@/core/content/types';
import { getBattle, getWar } from '@/core/content/wars';
import { formatSpan, formatYear, useLang, useT, useTitle, VALYRIAN_TAG } from '@/core/i18n';
import { DragonScale } from '@/shared/dragon';

import { EntityLink } from '../components/EntityLink';
import { Figure } from '../components/Figure';
import { Folio } from '../components/Folio';
import { col } from '../components/grid';
import { Prose } from '../components/Prose';
import { ReliabilityMark } from '../components/ReliabilityMark';
import { Rubric } from '../components/Rubric';
import { SourceList } from '../components/SourceList';
import { YearRule } from '../components/YearRule';
import type { YearMark, YearSpan } from '../components/YearRule';
import styles from './DragonPage.module.css';
import { useDragonYears } from './dragons/DragonRow';
import { Plate } from './dragons/Plate';
import { dragonEpochs, dragonName, firstKnownYear, neighbours } from './dragons/registry';
import { SpanRuler } from './dragons/SpanRuler';
import { useTxTypo } from '../components/typo';

const BALERION = 'balerion';
const NARRATIVE_END = 300;

/** Bornes de la règle des cavaliers : de la première mention à la mort (ou à la fin du récit). */
function lifeBounds(dragon: Dragon): [number, number] {
  const eventById = new Map(events.map((event) => [event.id, event]));
  const first = firstKnownYear(dragon, eventById);
  const known = [
    ...dragon.riders.flatMap((rider) => [rider.from, rider.to]),
    ...dragon.eventIds.map((id) => eventById.get(id)?.sortYear),
  ].filter((year): year is number => typeof year === 'number');
  const last = known.length > 0 ? Math.max(...known) : (first ?? 0);
  const to = dragon.died ?? Math.min(NARRATIVE_END, last + 10);
  let from = first ?? to - 20;
  if (from >= to) from = to - 10;
  return [from, to];
}

/**
 * Planche d'un dragon (/dragons/:dragonId) : la gravure coloriée et annotée, l'envergure
 * rapportée à Balerion, les cavaliers sur la règle du temps, l'origine, la robe, les
 * batailles, le sort, ce que l'adaptation change, les sources.
 */
export default function DragonPage() {
  const { dragonId = '' } = useParams();
  const dragon = getDragon(dragonId);
  const t = useT();
  const tx = useTxTypo();
  const title = useTitle();
  const { reading } = useLang();
  const years = useDragonYears();
  const order = useMemo(() => dragonEpochs(dragons, periods, events).flatMap((epoch) => epoch.dragons), []);

  if (!dragon) return <NotFound />;

  const name = title(dragonName(dragon));
  const lookNote = getLookNote(dragon.id);
  const extra = getExtraTextualNote(dragon.id);
  const balerion = getDragon(BALERION);
  const { previous, next } = neighbours(order, dragon.id);
  const [from, to] = lifeBounds(dragon);

  const marks: YearMark[] = dragon.riders
    .filter((rider) => rider.from !== undefined)
    .map((rider) => ({ year: rider.from ?? from, label: tx(rider.name).replace(/ Targaryen$/, ''), strong: true }));
  if (dragon.hatched !== null) marks.push({ year: dragon.hatched, label: t('page.dragon.rule.hatched') });
  if (dragon.died !== null) marks.push({ year: dragon.died, label: t('page.dragon.rule.died') });
  const spans: YearSpan[] = [
    { from, to, tone: 'encre', label: name.primary },
    ...dragon.riders.map((rider) => ({ from: rider.from ?? from, to: rider.to ?? to, tone: 'rubrique' as const, label: tx(rider.name) })),
  ];

  const battles = dragon.battleIds
    .map((id) => getBattle(id))
    .filter((battle): battle is Battle => battle !== undefined)
    .sort((a, b) => (a.year ?? 0) - (b.year ?? 0));

  const compare = [
    ...(balerion && balerion.id !== dragon.id ? [{ id: balerion.id, look: balerion.look, title: title(dragonName(balerion)).primary }] : []),
    { id: dragon.id, look: dragon.look, title: name.primary },
  ];

  return (
    <main id={MAIN_ID}>
      <Folio>
        <header className={`${col.pleine} ${styles.head}`}>
          <Rubric as="h1" text={dragonName(dragon)} size="monumental" />
          <div className={styles.meta}>
            {dragon.alias ? <p className={styles.alias}>{tx(dragon.alias)}</p> : null}
            <p className={styles.facts}>
              <span>{years(dragon)}</span>
              <ReliabilityMark level={dragon.reliability} />
            </p>
          </div>
        </header>

        <Figure className={`${col.pleine} ${styles.plateFigure}`} caption={t('page.dragon.plate.caption')}>
          <Plate dragon={dragon} name={name.primary} colorNote={lookNote?.color} />
        </Figure>

        <section className={`${col.rangee} ${styles.section}`} aria-labelledby="envergure">
          <div className={col.recit}>
            <Rubric as="h2" id="envergure" k="page.dragon.span.heading" />
            <SpanRuler span={dragon.look.span} name={name.primary} />
            <p className={styles.sentence}>
              {dragon.id === BALERION
                ? t('page.dragon.span.standard')
                : t('page.dragon.span.value', { value: new Intl.NumberFormat(reading, { maximumFractionDigits: 2 }).format(dragon.look.span) })}{' '}
              {t(dragon.look.attested.size ? 'page.dragon.span.attested' : 'page.dragon.span.estimated')}
            </p>
            <div className={styles.compare}>
              <DragonScale
                dragons={compare}
                title={t('page.dragon.compare.title', { name: name.primary })}
                humanTitle={t('page.dragons.scale.human')}
                tone="engraving"
                gap={0.06}
                activeId={dragon.id === BALERION ? undefined : dragon.id}
              />
            </div>
          </div>
          {lookNote?.size ? (
            <aside className={`${col.marge} ${styles.note}`}>
              <p>{tx(lookNote.size)}</p>
            </aside>
          ) : null}
        </section>

        <section className={`${col.rangee} ${styles.section}`} aria-labelledby="cavaliers">
          <div className={col.recit}>
            <Rubric as="h2" id="cavaliers" k="page.dragon.riders.heading" />
            <YearRule from={from} to={to} marks={marks} spans={spans} label={t('page.dragon.riders.rule', { name: name.primary })} className={styles.rule} />
            {dragon.riders.length > 0 ? (
              <ol className={styles.riders} role="list">
                {dragon.riders.map((rider, index) => (
                  <li key={`${rider.personId ?? 'x'}-${index}`} className={styles.rider}>
                    <span className={styles.riderYears}>{formatSpan(rider.from, rider.to, reading)}</span>
                    <EntityLink kind="person" id={rider.personId} name={rider.name} king={rider.personId ? getPerson(rider.personId)?.king : false} />
                  </li>
                ))}
              </ol>
            ) : (
              <p className={styles.sentence}>{t('page.dragons.riders.none')}</p>
            )}
          </div>
          {dragon.ridersNote ? (
            <aside className={`${col.marge} ${styles.note}`}>
              <p>{tx(dragon.ridersNote)}</p>
            </aside>
          ) : null}
        </section>

        <section className={`${col.rangee} ${styles.section}`} aria-labelledby="origine">
          <div className={col.recit}>
            <Rubric as="h2" id="origine" k="page.dragon.origin.heading" />
            <Prose text={dragon.origin} />
            <Rubric as="h2" k="page.dragon.appearance.heading" className={styles.subhead} />
            {dragon.appearance ? <Prose text={dragon.appearance} /> : <p className={styles.sentence}>{t('page.dragon.appearance.none')}</p>}
            {extra ? (
              <div className={styles.extra}>
                <p className={styles.extraLabel}>{t('page.dragon.extra')}</p>
                <Prose text={extra} />
              </div>
            ) : null}
          </div>
          <aside className={`${col.marge} ${styles.sources}`} aria-label={t('label.sources')}>
            <p className={styles.marginHead}>{t('label.sources')}</p>
            <SourceList sources={dragon.sources} />
          </aside>
        </section>

        {battles.length > 0 ? (
          <section className={`${col.pleine} ${styles.section}`} aria-labelledby="batailles">
            <Rubric as="h2" id="batailles" k="page.dragon.battles.heading" />
            <ol className={styles.battles} role="list">
              {battles.map((battle) => {
                const war = getWar(battle.warId);
                const engagement = battle.dragons.find((entry) => entry.dragonId === dragon.id);
                return (
                  <li key={battle.id} className={styles.battle}>
                    <span className={styles.battleYear}>{formatYear(battle.year, reading)}</span>
                    <div className={styles.battleBody}>
                      <h3 className={styles.battleName}>
                        <EntityLink kind="battle" id={battle.id} warId={battle.warId} name={battle.name} />
                      </h3>
                      <p className={styles.battlePlace}>
                        <EntityLink kind="place" id={battle.placeId} name={battle.placeName} />
                        {war ? (
                          <>
                            {', '}
                            <EntityLink kind="war" id={war.id} name={war.title} />
                          </>
                        ) : null}
                      </p>
                      {engagement ? <p className={styles.battleFate}>{tx(engagement.fate)}</p> : null}
                    </div>
                  </li>
                );
              })}
            </ol>
          </section>
        ) : null}

        <section className={`${col.rangee} ${styles.section}`} aria-labelledby="sort">
          <div className={col.recit}>
            <Rubric as="h2" id="sort" k="page.dragon.fate.heading" />
            <Prose text={dragon.fate} />
          </div>
        </section>

        {dragon.adaptationNote ? (
          <section className={`${col.recit} ${styles.adaptation}`} aria-labelledby="adaptation">
            <Rubric as="h2" id="adaptation" k="page.dragon.adaptation.heading" size="sous" />
            <p className={styles.continuity}>{t('label.continuity.show')}</p>
            <Prose text={dragon.adaptationNote} />
          </section>
        ) : null}

        <nav className={`${col.pleine} ${styles.pager}`} aria-label={t('page.dragon.pager')}>
          {previous ? (
            <VLink to={`/dragons/${previous.id}`} className={styles.pagerLink} rel="prev">
              <span className={styles.pagerLabel}>{t('page.dragon.previous')}</span>
              <PagerName dragon={previous} />
            </VLink>
          ) : (
            <span />
          )}
          <VLink to="/dragons" className={styles.pagerHome}>
            {t('page.dragon.back')}
          </VLink>
          {next ? (
            <VLink to={`/dragons/${next.id}`} className={`${styles.pagerLink} ${styles.pagerNext}`} rel="next">
              <span className={styles.pagerLabel}>{t('page.dragon.next')}</span>
              <PagerName dragon={next} />
            </VLink>
          ) : (
            <span />
          )}
        </nav>
      </Folio>
    </main>
  );
}

function PagerName({ dragon }: { dragon: Dragon }) {
  const title = useTitle();
  const shown = title(dragonName(dragon));
  return (
    <span className={styles.pagerName} lang={shown.isHv ? VALYRIAN_TAG : undefined}>
      {shown.primary}
    </span>
  );
}
