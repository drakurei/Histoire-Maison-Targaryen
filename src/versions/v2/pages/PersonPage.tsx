import { useMemo } from 'react';
import { useParams } from 'react-router-dom';

import { useBiography } from '@/core/content/biographies';
import { getPerson } from '@/core/content/people';
import { events, getPeriod } from '@/core/content/timeline';
import type { Person, SourceRef } from '@/core/content/types';
import { focusOn } from '@/core/genealogy';
import { formatSpan, formatYear, Gloss, useLang, useT, useTitle, useTx, useTxTypo } from '@/core/i18n';
import { ReliabilityGlyph } from '@/shared/marks/Marks';

import { GrandNombre } from '../components/GrandNombre';
import { Introuvable } from '../components/Introuvable';
import { Lien } from '../components/Lien';
import { NomEntite } from '../components/NomEntite';
import { Page } from '../components/Page';
import { Parti } from '../components/Parti';
import { Prose } from '../components/Prose';
import { Sommaire } from '../components/Sommaire';
import { SourcesPied } from '../components/SourcesPied';
import { Titre } from '../components/Titre';
import { ageAt } from '../model/relations';
import { useFasce } from '../state/fasce';
import { useYear } from '../state/year';

import { deathKnown, dragonsByRider, graph, lifeBounds, sovereignById } from './lignee/donnees';
import { DragonsMontes } from './lignee/DragonsMontes';
import { FragmentPal } from './lignee/FragmentPal';
import { nomCourt } from './lignee/nomCourt';
import { VieAgrandie } from './lignee/VieAgrandie';
import styles from './PersonPage.module.css';

function Noms({ persons }: { persons: readonly Person[] }) {
  return (
    <>
      {persons.map((person, index) => (
        <span key={person.id}>
          {index > 0 ? ', ' : null}
          <NomEntite kind="person" id={person.id} name={{ fr: nomCourt(person, person.name.fr).nom, en: nomCourt(person, person.name.en).nom }} />
        </span>
      ))}
    </>
  );
}

/** La parenté écrite (spec §5.9) : parents, unions et leurs enfants, fratrie, en noms d'entités. */
function Parente({ person }: { person: Person }) {
  const t = useT();
  const vue = useMemo(() => focusOn(graph, person.id), [person.id]);
  if (!vue) return null;
  const full = vue.siblings.filter((sibling) => sibling.kind === 'full').map((sibling) => sibling.person);
  const half = vue.siblings.filter((sibling) => sibling.kind === 'half').map((sibling) => sibling.person);
  return (
    <section className={styles.section} aria-labelledby="parente">
      <h2 id="parente" className={styles.h2}>
        {t('page.person.kin.heading')}
      </h2>
      <dl className={styles.parente}>
        <div className={styles.rang}>
          <dt>{t('page.lignee.panel.parents')}</dt>
          <dd>{vue.parents.length > 0 ? <Noms persons={vue.parents.map((parent) => parent.person)} /> : <span className={styles.cendre}>{t('page.lignee.panel.noParents')}</span>}</dd>
        </div>
        {vue.allegedFather ? (
          <div className={styles.rang}>
            <dt>{t('page.person.kin.alleged')}</dt>
            <dd>
              <Noms persons={[vue.allegedFather]} />
            </dd>
          </div>
        ) : null}
        {vue.unions.length > 0 ? (
          <div className={styles.rang}>
            <dt>{t('v2.person.unions')}</dt>
            <dd className={styles.unions}>
              {vue.unions.map((union, index) => (
                <p key={union.union?.id ?? index} className={styles.union}>
                  {union.partner ? <NomEntite kind="person" id={union.partner.id} name={union.partner.name} /> : <span className={styles.cendre}>{t('page.lignee.panel.unknownPartner')}</span>}
                  {union.consanguinity?.consanguineous ? (
                    <span className={styles.precision}> {t(`page.lignee.${union.consanguinity.kinship.key}`)}</span>
                  ) : null}
                  {union.union && union.union.type !== 'mariage' ? (
                    <span className={styles.precision}> {t(`page.lignee.union.${union.union.type}`)}</span>
                  ) : null}
                  {union.children.length > 0 ? (
                    <span className={styles.enfants}>
                      <span className={styles.cendre}>{t('v2.person.children')} </span>
                      <Noms persons={union.children} />
                    </span>
                  ) : null}
                </p>
              ))}
            </dd>
          </div>
        ) : null}
        {full.length > 0 ? (
          <div className={styles.rang}>
            <dt>{t('page.person.kin.siblings')}</dt>
            <dd>
              <Noms persons={full} />
            </dd>
          </div>
        ) : null}
        {half.length > 0 ? (
          <div className={styles.rang}>
            <dt>{t('v2.lineage.half_siblings')}</dt>
            <dd>
              <Noms persons={half} />
            </dd>
          </div>
        ) : null}
      </dl>
    </section>
  );
}

/**
 * Fiche `/personnages/:personId` (parti, spec §5.9). À gauche : nom, titres, la phrase qui
 * situe, la parenté, la biographie en sections, ce que les sources ne tranchent pas, ce que
 * l'adaptation change (bloc à part), les événements des annales. À droite, collants : le
 * fragment du pal, les dragons montés à l'échelle commune, la vie agrandie soudée à la fasce.
 */
export default function PersonPage() {
  const { personId = '' } = useParams();
  const person = getPerson(personId);
  const t = useT();
  const tx = useTx();
  const typo = useTxTypo();
  const title = useTitle();
  const { reading } = useLang();
  const year = useYear();

  const biography = useBiography(person?.hasBiography ? person.id : undefined);
  const annals = useMemo(
    () => (person ? events.filter((event) => event.people.some((ref) => ref.id === person.id)).sort((a, b) => a.sortYear - b.sortYear) : []),
    [person],
  );
  const eventYears = useMemo(() => [...new Set(annals.map((event) => event.year).filter((value): value is number => value !== null))], [annals]);
  const sovereign = person ? sovereignById.get(person.id) : undefined;
  const bounds = person ? lifeBounds(person) : { born: null, died: null };
  const end = bounds.died ?? (person?.alive ? 300 : null);
  useFasce({
    span: bounds.born !== null && end !== null ? [bounds.born, end] : null,
    reign: sovereign ? [sovereign.reignFrom, sovereign.reignTo] : null,
    marks: eventYears.map((value) => ({ year: value })),
  });

  if (!person) return <Introuvable />;

  const name = title(person.name).primary;
  // Seuls les dragons que le registre lui donne pour monture : la biographie cite aussi ceux de son histoire.
  const dragonIds = dragonsByRider.get(person.id) ?? [];
  const span = formatSpan(bounds.born, bounds.died, reading);
  const years =
    bounds.born === null && bounds.died === null
      ? t('page.person.datesUnknown')
      : person.dateCertainty === 'exacte' || bounds.born === null || bounds.died === null
        ? span
        : t('v2.cartel.circa', { span });
  const age = year !== null && deathKnown(person) ? ageAt(person, year) : null;
  const outside =
    age && year !== null && age.state !== 'alive'
      ? age.state === 'unborn'
        ? t('v2.year.outside.unborn', { year: formatYear(year, reading), name })
        : t('v2.year.outside.dead', { year: formatYear(year, reading), name, n: age.since })
      : null;
  const sections = biography?.sections ?? [];
  const sommaire = [
    ...sections.map((section) => ({ id: section.id, label: typo(section.heading) })),
    ...(biography?.disputed ? [{ id: 'doute', label: t('page.person.doubt.heading') }] : []),
    ...(biography?.adaptation ? [{ id: 'adaptation', label: t('page.person.adaptation.heading') }] : []),
    ...(annals.length > 0 ? [{ id: 'annales', label: t('v2.person.annals') }] : []),
  ];
  const ownSources: SourceRef[] = [...(biography?.sources ?? []), ...person.sources.filter((id) => !(biography?.sources ?? []).some((ref) => ref.id === id)).map((id) => ({ id }))];

  const colonne = (
    <div className={styles.colonne}>
      <div className={styles.haut}>
        {sovereign?.ordinal ? (
          <div className={styles.nombre}>
            <GrandNombre value={String(sovereign.ordinal)} />
            <p className={styles.rangRoi}>{t('v2.person.rank', { n: sovereign.ordinal })}</p>
          </div>
        ) : null}
        <div className={styles.bureau}>
          <FragmentPal person={person} />
          <DragonsMontes ids={dragonIds} />
        </div>
      </div>
      <div className={styles.bas}>
        <VieAgrandie person={person} eventYears={eventYears} year={year} height={190} />
      </div>
    </div>
  );

  const entete = (
    <Titre text={person.name} className={styles.titre}>
      {person.epithet ? <p className={styles.epithete}>{tx(person.epithet)}</p> : null}
      <p className={styles.meta}>
        <span>{years}</span>
        {sovereign ? <span>{t('page.person.reign', { span: formatSpan(sovereign.reignFrom, sovereign.reignTo, reading) })}</span> : null}
        {person.pretender && !sovereign ? <span>{t('page.person.claim', { span: formatSpan(person.pretender.from, person.pretender.to, reading) })}</span> : null}
        {person.house !== 'aucune' ? <span>{t('page.person.house', { house: t(`page.people.house.${person.house}`) })}</span> : null}
      </p>
      {outside ? <p className={styles.dehors}>{outside}</p> : null}
    </Titre>
  );

  const recit = (
    <div className={styles.recit}>
      {biography && biography.titles.length > 0 ? (
        <section className={styles.titres} aria-label={t('v2.person.titles')}>
          <p className={styles.petiteEtiquette}>{t('v2.person.titles')}</p>
          <ul role="list">
            {biography.titles.map((entry, index) => (
              <li key={index}>{typo(entry)}</li>
            ))}
          </ul>
        </section>
      ) : null}
      {biography ? <Prose text={biography.lead} variant="chapeau" /> : <Prose text={person.note} variant="chapeau" />}
      {sommaire.length >= 3 ? <Sommaire entries={sommaire} label={t('v2.person.contents')} className={styles.sommaire} /> : null}

      <Parente person={person} />

      <div className={styles.telephone}>
        <FragmentPal person={person} />
        <DragonsMontes ids={dragonIds} />
      </div>

      {sections.map((section) => (
        <section key={section.id} id={section.id} className={styles.section} aria-labelledby={`${section.id}-t`}>
          <h2 id={`${section.id}-t`} className={styles.h2}>
            {typo(section.heading)}
          </h2>
          <Prose text={section.body} />
          <SourcesPied sources={section.sources} />
        </section>
      ))}

      {biography?.disputed ? (
        <section id="doute" className={styles.section} aria-labelledby="doute-t">
          <h2 id="doute-t" className={styles.h2}>
            {t('page.person.doubt.heading')}
          </h2>
          <Prose text={biography.disputed} />
        </section>
      ) : null}

      {biography?.adaptation ? (
        <section id="adaptation" className={styles.adaptation} aria-labelledby="adaptation-t">
          <p className={styles.continuite}>
            <ReliabilityGlyph level="adaptation" className={styles.marque} />
            <Gloss k="label.continuity.show" />
          </p>
          <h2 id="adaptation-t" className={styles.h2}>
            {t('page.person.adaptation.heading')}
          </h2>
          <Prose text={biography.adaptation} />
        </section>
      ) : null}

      <section id="annales" className={styles.section} aria-labelledby="annales-t">
        <h2 id="annales-t" className={styles.h2}>
          {t('v2.person.annals')}
        </h2>
        {annals.length === 0 ? (
          <p className={styles.cendre}>{t('page.person.life.noEvents')}</p>
        ) : (
          <ol role="list" className={styles.annales}>
            {annals.map((event) => {
              const period = getPeriod(event.periodId);
              return (
                <li key={event.id} className={styles.evenement}>
                  <span className={styles.annee}>{event.year === null ? t('label.unknownDate') : formatYear(event.year, reading)}</span>
                  <span className={styles.evenementTexte}>
                    <Lien to={`/chroniques/${event.periodId}/${event.id}`} year={event.year ?? 'keep'} className={styles.evenementTitre}>
                      {typo(event.title)}
                    </Lien>
                    {period ? <span className={styles.periode}>{title(period.title).gloss ?? title(period.title).primary}</span> : null}
                  </span>
                </li>
              );
            })}
          </ol>
        )}
      </section>

      <SourcesPied sources={ownSources} className={styles.sources} />
    </div>
  );

  return (
    <Page partition="parti" className={styles.page}>
      <Parti entete={entete} recit={recit} temps={colonne} />
    </Page>
  );
}
