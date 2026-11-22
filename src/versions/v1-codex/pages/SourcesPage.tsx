import { useMemo } from 'react';
import type { CSSProperties } from 'react';

import { MAIN_ID } from '@/app/a11y';
import { dragons } from '@/core/content/dragons';
import { reliabilityLevels, sources, sourceScale } from '@/core/content/sources';
import { events } from '@/core/content/timeline';
import type { Reliability, Source, SourceRef } from '@/core/content/types';
import { wars } from '@/core/content/wars';
import { useLang, useT, useTx } from '@/core/i18n';
import { ReliabilityGlyph } from '@/shared/marks/Marks';

import { Figure } from '../components/Figure';
import { Folio } from '../components/Folio';
import { col } from '../components/grid';
import { Prose } from '../components/Prose';
import { Rubric } from '../components/Rubric';
import { useHashScroll } from './language/useHashScroll';
import styles from './SourcesPage.module.css';

/*
 * Sigles des ouvrages : les mêmes que dans components/SourceList (qui ne les exporte pas),
 * pour que le lecteur retrouve ici le sigle lu en marge. À fusionner si le contrat des
 * sources gagne un champ `siglum`.
 */
const SIGLA: Readonly<Record<string, string>> = {
  fab: 'F&B',
  twoiaf: 'TWoIaF',
  trotd: 'TRotD',
  agot: 'AGoT',
  acok: 'ACoK',
  asos: 'ASoS',
  affc: 'AFfC',
  adwd: 'ADwD',
  thk: 'THK',
  tss: 'TSS',
  tmk: 'TMK',
  tpatq: 'TPatQ',
  trp: 'TRP',
  tsotd: 'TSotD',
  asoiaf: 'ASoIaF',
  'dunk-egg': 'D&E',
  got: 'GoT',
  hotd: 'HotD',
  'akotsk-serie': 'AKotSK',
  awoiaf: 'AWoIaF',
};

const TYPE_KEY: Readonly<Record<Source['type'], string>> = {
  livre: 'page.sources.type.livre',
  nouvelle: 'page.sources.type.nouvelle',
  'encyclopedie-univers': 'page.sources.type.encyclopedie',
  serie: 'page.sources.type.serie',
  'outil-de-verification': 'page.sources.type.outil',
};

const siglum = (id: string): string => SIGLA[id] ?? id;

/* ------------------------------------------------------------------ comptes (purs) */

/** Renvois par ouvrage : événements, dragons, guerres et batailles qui le citent. */
function citationCounts(): Map<string, number> {
  const counts = new Map<string, number>();
  const add = (refs: readonly SourceRef[]) => {
    for (const ref of refs) counts.set(ref.id, (counts.get(ref.id) ?? 0) + 1);
  };
  for (const item of events) add(item.sources);
  for (const item of dragons) add(item.sources);
  for (const war of wars) {
    add(war.sources);
    for (const battle of war.battles) add(battle.sources);
  }
  return counts;
}

/* Frise des parutions : bornes de l'échelle, en années de notre calendrier. */
const FRIEZE_FROM = 1994;
const FRIEZE_TO = 2030;
const FRIEZE_TICKS = [1995, 2000, 2005, 2010, 2015, 2020, 2025];
/** Le présent de la frise, pour une série qui court encore. */
const FRIEZE_NOW = 2026;

const posOf = (year: number): number => (year - FRIEZE_FROM) / (FRIEZE_TO - FRIEZE_FROM);

interface Placed {
  source: Source;
  from: number;
  to: number;
  /** Couloir sur la frise couchée (écran large) et debout (téléphone). */
  laneH: number;
  laneV: number;
}

/** Range chaque ouvrage dans le premier couloir où il ne touche pas le précédent. */
function lanes(items: readonly { from: number; to: number }[], gap: number): number[] {
  const ends: number[] = [];
  return items.map((item) => {
    let lane = ends.findIndex((end) => item.from - end >= gap);
    if (lane === -1) lane = ends.length;
    ends[lane] = Math.max(item.from, item.to);
    return lane;
  });
}

function placeAll(list: readonly Source[]): Placed[] {
  const dated = list
    .filter((source) => source.year !== null && !source.members?.length)
    .map((source) => ({ source, from: source.year ?? 0, to: source.yearEnd === undefined ? (source.year ?? 0) : (source.yearEnd ?? FRIEZE_NOW) }))
    .sort((a, b) => a.from - b.from || a.source.id.localeCompare(b.source.id));
  const horizontal = lanes(dated, 2.6);
  const vertical = lanes(dated, 1.4);
  return dated.map((item, index) => ({ ...item, laneH: horizontal[index] ?? 0, laneV: vertical[index] ?? 0 }));
}

/* ------------------------------------------------------------------ page */

/**
 * Les sources (/sources) : les cinq degrés de certitude et leur poids dans la chronique,
 * le registre des ouvrages par nature de témoignage, puis la séparation des livres et de
 * l'adaptation, avec la frise des parutions. Chaque notice porte l'ancre que visent les
 * listes de sources de tout le site (« /sources#fab »).
 */
export default function SourcesPage() {
  const t = useT();
  const { reading } = useLang();
  useHashScroll();

  const counts = useMemo(citationCounts, []);
  const maxCount = Math.max(1, ...counts.values());
  const books = sources.filter((source) => source.continuity === 'livres');
  const screen = sources.filter((source) => source.continuity === 'adaptation');
  const bookSteps = sourceScale.filter((step) => books.some((source) => source.reliability === step.id));
  const levelCounts = useMemo(() => {
    const map = new Map<Reliability, number>();
    for (const item of events) map.set(item.reliability, (map.get(item.reliability) ?? 0) + 1);
    return map;
  }, []);

  return (
    <main id={MAIN_ID}>
      <Folio>
        <Rubric as="h1" k="nav.sources" className={styles.title} />
        <p className={`${styles.lead} ${col.recit}`} lang={reading}>
          {t('page.sources.lead')}
        </p>

        <Rubric as="h2" id="degres" k="page.sources.levels.title" className={styles.section} />
        <p className={styles.intro} lang={reading}>
          {t('page.sources.levels.intro')}
        </p>
        <Figure className={`${styles.levelsFigure} ${col.pleine}`} number={1} caption={t('page.sources.levels.caption', { n: events.length })}>
          <ol role="list" className={styles.levels}>
            {[...reliabilityLevels]
              .sort((a, b) => a.order - b.order)
              .map((level) => (
                <LevelRow key={level.id} level={level.id} count={levelCounts.get(level.id) ?? 0} />
              ))}
          </ol>
        </Figure>

        <Rubric as="h2" id="registre" k="page.sources.register.title" className={styles.section} />
        <p className={styles.intro} lang={reading}>
          {t('page.sources.register.intro')}
        </p>
        {bookSteps.map((step) => (
          <section key={step.id} className={`${styles.nature} ${col.pleine}`} aria-labelledby={`nature-${step.id}`}>
            <NatureHead id={`nature-${step.id}`} stepId={step.id} />
            <ul role="list" className={styles.entries}>
              {books
                .filter((source) => source.reliability === step.id)
                .map((source) => (
                  <SourceEntry key={source.id} source={source} count={counts.get(source.id) ?? 0} max={maxCount} />
                ))}
            </ul>
          </section>
        ))}

        <Rubric as="h2" id="adaptation" k="page.sources.separate.title" className={styles.section} />
        <p className={styles.intro} lang={reading}>
          {t('page.sources.separate.body')}
        </p>
        <Figure className={`${styles.friezeFigure} ${col.pleine}`} number={2} caption={t('page.sources.separate.caption')}>
          <Frieze books={books} screen={screen} />
        </Figure>
        {screen.length > 0 ? (
          <section className={`${styles.nature} ${col.pleine}`} aria-labelledby="nature-adaptation">
            <NatureHead id="nature-adaptation" stepId="adaptation" />
            <ul role="list" className={styles.entries}>
              {screen.map((source) => (
                <SourceEntry key={source.id} source={source} count={counts.get(source.id) ?? 0} max={maxCount} />
              ))}
            </ul>
          </section>
        ) : null}
      </Folio>
    </main>
  );
}

function LevelRow({ level, count }: { level: Reliability; count: number }) {
  const t = useT();
  const tx = useTx();
  const { reading } = useLang();
  const data = reliabilityLevels.find((item) => item.id === level);
  return (
    <li className={styles.level} data-level={level}>
      <div className={styles.levelHead}>
        <ReliabilityGlyph level={level} size="2rem" className={styles.levelGlyph} />
        <span className={styles.levelLabel}>{tx(data?.label)}</span>
        <span className={styles.levelCount}>
          {count === 1 ? t('page.sources.levels.count.one') : t('page.sources.levels.count', { n: count })}
        </span>
      </div>
      <div className={styles.levelBody}>
        <p className={styles.levelDef} lang={reading}>
          {tx(data?.definition)}
        </p>
        <span className={styles.tally} aria-hidden="true">
          {Array.from({ length: count }, (_, index) => (
            <ReliabilityGlyph key={index} level={level} size="0.9rem" />
          ))}
        </span>
      </div>
    </li>
  );
}

function NatureHead({ id, stepId }: { id: string; stepId: string }) {
  const tx = useTx();
  const { reading } = useLang();
  const step = sourceScale.find((item) => item.id === stepId);
  return (
    <div className={styles.natureHead}>
      <h3 id={id} className={styles.natureTitle}>
        {tx(step?.label)}
      </h3>
      <p className={styles.natureDef} lang={reading}>
        {tx(step?.definition)}
      </p>
    </div>
  );
}

function SourceEntry({ source, count, max }: { source: Source; count: number; max: number }) {
  const t = useT();
  const { reading } = useLang();
  const span =
    source.year === null
      ? null
      : source.yearEnd === undefined
        ? String(source.year)
        : source.yearEnd === null
          ? t('page.sources.entry.since', { from: source.year })
          : t('page.sources.entry.span', { from: source.year, to: source.yearEnd });
  const facts = [source.author, t(TYPE_KEY[source.type]), span].filter(Boolean).join(', ');
  const cited = count === 0 ? t('page.sources.entry.cited.none') : count === 1 ? t('page.sources.entry.cited.one') : t('page.sources.entry.cited', { n: count });

  return (
    <li id={source.id} className={styles.entry}>
      <div className={styles.entryMain}>
        <p className={styles.entryHead}>
          <span className={styles.siglum}>{siglum(source.id)}</span>
          <cite className={styles.entryTitle} lang="en">
            {source.title}
          </cite>
        </p>
        {reading === 'fr' && source.titleFr && source.titleFr !== source.title ? (
          <p className={styles.entryFr}>{t('page.sources.entry.titleFr', { t: source.titleFr })}</p>
        ) : null}
        <p className={styles.entryFacts}>{facts}.</p>
        <Prose text={source.reliabilityNote} className={styles.entryNote} />
      </div>
      <div className={styles.entryMargin}>
        <span className={styles.cited}>{cited}</span>
        {count > 0 ? (
          <span className={styles.bar} aria-hidden="true">
            <span className={styles.barInk} style={{ inlineSize: `${(count / max) * 100}%` }} />
          </span>
        ) : null}
        {source.members?.length ? (
          <p className={styles.members}>
            <span className={styles.membersLabel}>{t('page.sources.entry.members')}</span>{' '}
            {source.members.map((member, index) => (
              <span key={member}>
                {index > 0 ? ', ' : null}
                <a href={`#${member}`} className={styles.memberLink}>
                  {siglum(member)}
                </a>
              </span>
            ))}
          </p>
        ) : null}
      </div>
    </li>
  );
}

function Frieze({ books, screen }: { books: readonly Source[]; screen: readonly Source[] }) {
  const t = useT();
  const placedBooks = useMemo(() => placeAll(books), [books]);
  const placedScreen = useMemo(() => placeAll(screen), [screen]);
  const lanesOf = (list: readonly Placed[], key: 'laneH' | 'laneV') => Math.max(1, ...list.map((item) => item[key] + 1));

  const style = {
    '--books-h': lanesOf(placedBooks, 'laneH'),
    '--screen-h': lanesOf(placedScreen, 'laneH'),
    '--books-v': lanesOf(placedBooks, 'laneV'),
    '--screen-v': lanesOf(placedScreen, 'laneV'),
  } as CSSProperties;

  return (
    <div className={styles.frieze} style={style} role="group" aria-label={t('page.sources.separate.figure', { from: FRIEZE_FROM, to: FRIEZE_TO })}>
      <span className={styles.axis} aria-hidden="true" />
      <span className={styles.sideBooks} aria-hidden="true">
        {t('page.sources.separate.books')}
      </span>
      <span className={styles.sideScreen} aria-hidden="true">
        {t('page.sources.separate.screen')}
      </span>
      {FRIEZE_TICKS.map((year) => (
        <span key={year} className={styles.tick} style={{ '--pos': posOf(year) } as CSSProperties} aria-hidden="true">
          {year}
        </span>
      ))}
      <ul role="list" className={styles.friezeList}>
        {placedBooks.map((item) => (
          <FriezeItem key={item.source.id} item={item} kind="book" />
        ))}
        {placedScreen.map((item) => (
          <FriezeItem key={item.source.id} item={item} kind="screen" />
        ))}
      </ul>
    </div>
  );
}

function FriezeItem({ item, kind }: { item: Placed; kind: 'book' | 'screen' }) {
  const style = {
    '--pos': posOf(item.from),
    '--end': posOf(item.to),
    '--lane-h': item.laneH,
    '--lane-v': item.laneV,
  } as CSSProperties;
  const open = item.source.yearEnd === null;
  return (
    <li className={kind === 'book' ? styles.book : styles.screen} style={style} data-open={open || undefined}>
      <a href={`#${item.source.id}`} className={styles.friezeLink} title={`${item.source.title}, ${item.from}`}>
        {siglum(item.source.id)}
      </a>
    </li>
  );
}
