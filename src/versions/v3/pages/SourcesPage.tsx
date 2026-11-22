import { useMemo } from 'react';
import type { ReactNode } from 'react';

import { dragons } from '@/core/content/dragons';
import { getSource, reliabilityLevels, sources, sourceScale } from '@/core/content/sources';
import { events } from '@/core/content/timeline';
import type { Reliability, Source, SourceRef } from '@/core/content/types';
import { wars } from '@/core/content/wars';
import { useLang, useT, useTxTypo } from '@/core/i18n';
import { BookGlyph, ReliabilityGlyph } from '@/shared/marks/Marks';
import { col } from '@/versions/v1-codex/components/grid';
import { Prose } from '@/versions/v1-codex/components/Prose';
import { Rubric } from '@/versions/v1-codex/components/Rubric';
import { useHashScroll } from '@/versions/v1-codex/pages/language/useHashScroll';
import { Frise } from '@/versions/v2/pages/savoirs/Frise';

import { Colonne } from '../components/common/Colonne';
import { Parti3 } from '../components/common/Parti3';
import { useVue } from '../components/common/useVue';
import { Vue } from '../components/common/Vue';
import commun from './savoirs/commun.module.css';
import styles from './savoirs/Sources.module.css';

/*
 * Sigles des ouvrages, les mêmes que dans la marge des récits (`SourceList` de la V1, qui ne
 * les exporte pas) : le lecteur retrouve ici le sigle lu en marge.
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

/** Fin de la frise : la parution la plus récente. */
const LATEST = Math.max(...sources.map((source) => Math.max(source.year ?? 0, source.yearEnd ?? 0)));

/** Renvois par ouvrage : événements, dragons, guerres et batailles qui le citent. */
function citationCounts(): Map<string, number> {
  const counts = new Map<string, number>();
  const add = (refs: readonly SourceRef[]) => {
    for (const id of new Set(refs.map((ref) => ref.id))) counts.set(id, (counts.get(id) ?? 0) + 1);
  };
  for (const item of events) add(item.sources);
  for (const item of dragons) add(item.sources);
  for (const war of wars) {
    add(war.sources);
    for (const battle of war.battles) add(battle.sources);
  }
  return counts;
}

/**
 * Les sources `/sources` (v3-spec §6.16 ; parti, fasce éteinte). Le folio tient le registre :
 * les ouvrages des livres rangés selon la nature de leur témoignage, chacun avec sa note de
 * fiabilité et le nombre de faits qui le citent ; puis la séparation des livres et de
 * l'adaptation, et les séries. La colonne du champ porte l'échelle des cinq marques et leur
 * poids dans la chronique ; sous le parti, sur le champ, la frise des parutions. Chaque
 * notice porte l'ancre que visent les listes de sources du site (« /sources#fab »).
 */
export default function SourcesPage() {
  const t = useT();
  const typo = useTxTypo();
  const { reading } = useLang();
  useVue({ etat: 'eteinte' });
  useHashScroll();

  const cited = useMemo(() => citationCounts(), []);
  const books = sources.filter((source) => source.continuity === 'livres');
  const screen = sources.filter((source) => source.continuity === 'adaptation');
  const steps = sourceScale.filter((step) => books.some((source) => source.reliability === step.id));
  const levels = useMemo(() => {
    const counts = new Map<Reliability, number>();
    for (const event of events) counts.set(event.reliability, (counts.get(event.reliability) ?? 0) + 1);
    const ordered = [...reliabilityLevels].sort((a, b) => a.order - b.order);
    const max = Math.max(1, ...ordered.map((level) => counts.get(level.id) ?? 0));
    return ordered.map((level) => ({ level, count: counts.get(level.id) ?? 0, share: (counts.get(level.id) ?? 0) / max }));
  }, []);

  const titreId = 'v3-sources-titre';
  const tete = (
    <header className={`${commun.tete} ${col.recit}`}>
      <Rubric as="h1" id={titreId} k="nav.sources" />
      <p className={commun.chapeau} lang={reading}>
        {t('page.sources.lead')}
      </p>
    </header>
  );

  const folio = (
    <>
      <section className={`${commun.section} ${col.pleine}`} aria-labelledby="v3-sources-registre">
        <Rubric as="h2" id="v3-sources-registre" k="page.sources.register.title" />
        <p className={commun.texte} lang={reading}>
          {t('page.sources.register.intro')}
        </p>
        {steps.map((step) => (
          <Groupe key={step.id} id={`nature-${step.id}`} label={typo(step.label)} definition={typo(step.definition)}>
            {books
              .filter((source) => source.reliability === step.id)
              .map((source) => (
                <Ouvrage key={source.id} source={source} cited={cited.get(source.id) ?? 0} />
              ))}
          </Groupe>
        ))}
      </section>

      <section className={`${commun.section} ${col.pleine}`} aria-labelledby="v3-sources-adaptation">
        <Rubric as="h2" id="v3-sources-adaptation" k="page.sources.separate.title" />
        <p className={commun.texte} lang={reading}>
          {t('page.sources.separate.body')}
        </p>
        {screen.length > 0 ? (
          <Groupe
            id="nature-adaptation"
            label={typo(sourceScale.find((step) => step.id === 'adaptation')?.label)}
            definition={typo(sourceScale.find((step) => step.id === 'adaptation')?.definition)}
          >
            {screen.map((source) => (
              <Ouvrage key={source.id} source={source} cited={cited.get(source.id) ?? 0} />
            ))}
          </Groupe>
        ) : null}
      </section>
    </>
  );

  const colonne = (
    <Colonne
      label={t('page.sources.levels.title')}
      figure={
        <figure className={`${commun.colonne} ${styles.echelle}`} aria-labelledby="v3-sources-echelle">
          <h2 id="v3-sources-echelle" className={styles.echelleTitre}>
            {t('page.sources.levels.title')}
          </h2>
          <ol role="list" className={styles.niveaux}>
            {levels.map(({ level, count, share }) => (
              <li key={level.id} className={styles.niveau} data-niveau={level.id}>
                <ReliabilityGlyph level={level.id} size="3rem" className={styles.niveauMarque} />
                <div className={styles.niveauCorps}>
                  <p className={styles.niveauNom}>{typo(level.label)}</p>
                  <p className={styles.niveauDef}>{typo(level.definition)}</p>
                  <p className={styles.niveauCompte}>
                    <span className={styles.barre} style={{ inlineSize: `${Math.max(2, share * 100)}%` }} aria-hidden="true" />
                    <span>{count === 1 ? t('page.sources.levels.count.one') : t('page.sources.levels.count', { n: count })}</span>
                  </p>
                </div>
              </li>
            ))}
          </ol>
          <figcaption className={commun.legende}>{t('v2.sources.scale', { n: events.length })}</figcaption>
        </figure>
      }
    />
  );

  const suite = (
    <figure className={styles.frise} aria-labelledby="v3-sources-frise">
      <Frise sources={sources} until={LATEST} />
      <figcaption id="v3-sources-frise" className={commun.legende}>
        {t('page.sources.separate.caption')}
      </figcaption>
    </figure>
  );

  return (
    <Vue partition="parti">
      <Parti3 labelledBy={titreId} tete={tete} folio={folio} colonne={colonne} suite={suite} />
    </Vue>
  );
}

function Groupe({ id, label, definition, children }: { id: string; label: string; definition: string; children: ReactNode }) {
  return (
    <section className={styles.groupe} aria-labelledby={id}>
      <div className={styles.groupeTete}>
        <h3 id={id} className={styles.groupeTitre}>
          {label}
        </h3>
        <p className={styles.groupeDef}>{definition}</p>
      </div>
      <ul role="list" className={styles.ouvrages}>
        {children}
      </ul>
    </section>
  );
}

function Ouvrage({ source, cited }: { source: Source; cited: number }) {
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
  const count = cited === 0 ? t('page.sources.entry.cited.none') : cited === 1 ? t('page.sources.entry.cited.one') : t('page.sources.entry.cited', { n: cited });
  const titleFr = reading === 'fr' && source.titleFr && source.titleFr !== source.title ? source.titleFr : null;

  return (
    <li id={source.id} className={styles.ouvrage}>
      <span className={styles.sigle}>{SIGLA[source.id] ?? source.id}</span>
      <div className={styles.ouvrageCorps}>
        <p className={styles.ouvrageTitre}>
          <cite lang="en">{source.title}</cite>
        </p>
        {titleFr ? <p className={styles.ouvrageFr}>{t('page.sources.entry.titleFr', { t: titleFr })}</p> : null}
        <p className={styles.faits}>
          <span className={styles.continuite}>
            {source.continuity === 'livres' ? <BookGlyph size="1.05rem" /> : <ReliabilityGlyph level="adaptation" size="1.05rem" />}
            <span className="sr-only">{t(source.continuity === 'livres' ? 'label.continuity.books' : 'label.continuity.show')}, </span>
          </span>
          {facts}.
        </p>
        <Prose text={source.reliabilityNote} className={styles.note} />
        <p className={styles.renvois}>
          {count}
          {source.members?.length ? (
            <span className={styles.membres}>
              {t('page.sources.entry.members')}{' '}
              {source.members.map((member, index) => {
                const target = getSource(member);
                return (
                  <span key={member}>
                    {index > 0 ? ', ' : null}
                    <a href={`#${member}`} title={target?.title}>
                      {SIGLA[member] ?? member}
                    </a>
                  </span>
                );
              })}
            </span>
          ) : null}
        </p>
      </div>
    </li>
  );
}
