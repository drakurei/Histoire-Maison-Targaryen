import { useMemo } from 'react';

import { dragons } from '@/core/content/dragons';
import { getSource, getSourceScaleStep, reliabilityLevels, sources } from '@/core/content/sources';
import { events } from '@/core/content/timeline';
import type { Reliability, Source, SourceRef } from '@/core/content/types';
import { battles, wars } from '@/core/content/wars';
import { Gloss, useLang, useT, useTxTypo } from '@/core/i18n';
import { BookGlyph, ReliabilityGlyph } from '@/shared/marks/Marks';

import { Page } from '../components/Page';
import { Parti } from '../components/Parti';
import { Titre } from '../components/Titre';
import { useFasce } from '../state/fasce';

import { Frise } from './savoirs/Frise';
import commun from './savoirs/Savoirs.module.css';
import styles from './SourcesPage.module.css';

/** Les natures d'ouvrages, dans l'ordre du registre (spec §5.14). */
const GROUPS: readonly Source['type'][] = ['livre', 'nouvelle', 'encyclopedie-univers', 'serie', 'outil-de-verification'];

/** Suffixe des clés de nature d'ouvrage (`page.sources.type.*`, `v2.sources.group.*`). */
const TYPE_KEY: Record<Source['type'], string> = {
  livre: 'livre',
  nouvelle: 'nouvelle',
  'encyclopedie-univers': 'encyclopedie',
  serie: 'serie',
  'outil-de-verification': 'outil',
};

/** Fin de la frise : la parution la plus récente. */
const LATEST = Math.max(...sources.map((source) => Math.max(source.year ?? 0, source.yearEnd ?? 0)));

/** Nombre de renvois de chaque source : événements, dragons, guerres et batailles qui la citent. */
function citations(): Map<string, number> {
  const counts = new Map<string, number>();
  const add = (refs: readonly SourceRef[]) => {
    for (const id of new Set(refs.map((ref) => ref.id))) counts.set(id, (counts.get(id) ?? 0) + 1);
  };
  for (const item of [...events, ...dragons, ...wars, ...battles]) add(item.sources);
  return counts;
}

function Ouvrage({ source, cited }: { source: Source; cited: number }) {
  const t = useT();
  const typo = useTxTypo();
  const { reading } = useLang();
  const main = reading === 'fr' && source.titleFr ? source.titleFr : source.title;
  const other = main === source.title ? (source.titleFr && source.titleFr !== source.title ? source.titleFr : null) : source.title;
  const step = getSourceScaleStep(source.reliability);
  const span =
    source.year === null
      ? null
      : source.yearEnd
        ? t('page.sources.entry.span', { from: source.year, to: source.yearEnd })
        : source.type === 'serie'
          ? t('page.sources.entry.since', { from: source.year })
          : String(source.year);
  return (
    <article id={source.id} className={styles.ouvrage} aria-labelledby={`${source.id}-titre`}>
      <h3 id={`${source.id}-titre`} className={styles.titre}>
        <cite>{main}</cite>
      </h3>
      {other ? (
        <p className={styles.autreTitre}>
          {main === source.title ? t('page.sources.entry.titleFr', { t: other }) : <cite>{other}</cite>}
        </p>
      ) : null}
      <p className={styles.meta}>
        <span>{source.author}</span>
        {span ? <span className={styles.annees}>{span}</span> : null}
        <span className={styles.continuite}>
          {source.continuity === 'livres' ? <BookGlyph className={styles.marque} /> : <ReliabilityGlyph level="adaptation" className={styles.marque} />}
          {t(source.continuity === 'livres' ? 'label.continuity.books' : 'label.continuity.show')}
        </span>
      </p>
      {step ? (
        <p className={styles.nature}>
          <span className={styles.natureNom}>{typo(step.label)}</span>
          <span className={styles.natureDef}>{typo(step.definition)}</span>
        </p>
      ) : null}
      <p className={styles.note}>{typo(source.reliabilityNote)}</p>
      {source.members && source.members.length > 0 ? (
        <p className={styles.membres}>
          <span className={styles.membresNom}>{t('page.sources.entry.members')}</span>
          {source.members.map((id) => {
            const member = getSource(id);
            if (!member) return null;
            return (
              <a key={id} href={`#${id}`} className={styles.membre}>
                <cite>{reading === 'fr' && member.titleFr ? member.titleFr : member.title}</cite>
              </a>
            );
          })}
        </p>
      ) : null}
      <p className={styles.renvois}>
        {cited === 0
          ? t('page.sources.entry.cited.none')
          : cited === 1
            ? t('page.sources.entry.cited.one')
            : t('page.sources.entry.cited', { n: cited })}
      </p>
    </article>
  );
}

/**
 * Sources `/sources` (parti, fasce éteinte, spec §5.14). À gauche, le registre des ouvrages
 * par nature, chacun avec la nature de son témoignage et sa note de fiabilité, puis la
 * séparation des livres et de l'adaptation et la frise de leurs parutions. À droite,
 * collante, la figure est l'échelle des cinq marques de fiabilité, avec le nombre
 * d'événements de la chronique qui portent chacune. Ancres `#<sourceId>`.
 */
export default function SourcesPage() {
  useFasce({ off: true });
  const t = useT();
  const typo = useTxTypo();
  const cited = useMemo(citations, []);
  const levels = useMemo(() => {
    const counts = new Map<Reliability, number>();
    for (const event of events) counts.set(event.reliability, (counts.get(event.reliability) ?? 0) + 1);
    const ordered = [...reliabilityLevels].sort((a, b) => a.order - b.order);
    const max = Math.max(1, ...ordered.map((level) => counts.get(level.id) ?? 0));
    return ordered.map((level) => ({ level, count: counts.get(level.id) ?? 0, share: (counts.get(level.id) ?? 0) / max }));
  }, []);
  const groups = useMemo(
    () => GROUPS.map((type) => ({ type, items: sources.filter((source) => source.type === type) })).filter((group) => group.items.length > 0),
    [],
  );

  const entete = (
    <div className={commun.entete}>
      <Titre k="nav.sources" />
      <p className={styles.chapeau}>{t('page.sources.lead')}</p>
    </div>
  );

  const temps = (
    <figure className={`${commun.colonne} ${styles.echelle}`} aria-labelledby="v2-sources-echelle">
      <h2 id="v2-sources-echelle" className={styles.echelleTitre}>
        {t('page.sources.levels.title')}
      </h2>
      <p className={styles.echelleIntro}>{t('page.sources.levels.intro')}</p>
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
  );

  const recit = (
    <div className={styles.recit}>
      <section className={commun.section} aria-labelledby="v2-sources-registre">
        <h2 id="v2-sources-registre" className={commun.intertitre}>
          <Gloss k="page.sources.register.title" />
        </h2>
        <p className={commun.texte}>{t('page.sources.register.intro')}</p>
        {groups.map((group) => (
          <section key={group.type} className={styles.groupe} aria-labelledby={`v2-sources-${group.type}`}>
            <h3 id={`v2-sources-${group.type}`} className={styles.groupeTitre}>
              {t(`v2.sources.group.${TYPE_KEY[group.type]}`)}
              <span className={styles.groupeNombre}>{group.items.length}</span>
            </h3>
            <div className={styles.ouvrages}>
              {group.items.map((source) => (
                <Ouvrage key={source.id} source={source} cited={cited.get(source.id) ?? 0} />
              ))}
            </div>
          </section>
        ))}
      </section>

      <section className={commun.section} aria-labelledby="v2-sources-separation">
        <h2 id="v2-sources-separation" className={commun.intertitre}>
          {t('page.sources.separate.title')}
        </h2>
        <p className={commun.texte}>{t('page.sources.separate.body')}</p>
        <figure className={styles.frise}>
          <Frise sources={sources} until={LATEST} />
          <figcaption className={commun.legende}>{t('page.sources.separate.caption')}</figcaption>
        </figure>
      </section>
    </div>
  );

  return (
    <Page partition="parti">
      <Parti entete={entete} recit={recit} temps={temps} />
    </Page>
  );
}
