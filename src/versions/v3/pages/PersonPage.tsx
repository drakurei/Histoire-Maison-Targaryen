import { useMemo } from 'react';
import { useParams } from 'react-router-dom';

import { useBiography } from '@/core/content/biographies';
import { getDragon } from '@/core/content/dragons';
import { getPerson } from '@/core/content/people';
import { events } from '@/core/content/timeline';
import type { Biography, Dragon, HistoricalEvent, Person, SourceRef } from '@/core/content/types';
import { formatSpan, formatYear, useLang, useT, useTitle, useTxTypo } from '@/core/i18n';
import { DragonFigure } from '@/shared/dragon';
import { EntityLink } from '@/versions/v1-codex/components/EntityLink';
import { col } from '@/versions/v1-codex/components/grid';
import { Prose } from '@/versions/v1-codex/components/Prose';
import { ReliabilityMark } from '@/versions/v1-codex/components/ReliabilityMark';
import { Rubric } from '@/versions/v1-codex/components/Rubric';
import { SourceList } from '@/versions/v1-codex/components/SourceList';
import { graph as v1Graph } from '@/versions/v1-codex/pages/lineage/model';
import { Kinship } from '@/versions/v1-codex/pages/people/Kinship';
import { Lien } from '@/versions/v2/components/Lien';
import { ageAt } from '@/versions/v2/model/relations';
import { deathKnown, dragonsByRider, lifeBounds, sovereignById } from '@/versions/v2/pages/lignee/donnees';
import { FragmentPal } from '@/versions/v2/pages/lignee/FragmentPal';
import { VieAgrandie } from '@/versions/v2/pages/lignee/VieAgrandie';
import { useYear } from '@/versions/v2/state/year';

import { Colonne } from '../components/common/Colonne';
import { Parti3 } from '../components/common/Parti3';
import { useVue } from '../components/common/useVue';
import { Vue } from '../components/common/Vue';
import NotFoundPage from './NotFoundPage';
import styles from './PersonPage.module.css';

/** Événements des annales où la personne paraît, dans l'ordre du temps. */
function eventsOf(person: Person, biography: Biography | undefined): HistoricalEvent[] {
  const extra = new Set(biography?.eventIds ?? []);
  return events.filter((event) => extra.has(event.id) || event.people.some((ref) => ref.id === person.id)).sort((a, b) => a.sortYear - b.sortYear);
}

/** Dragons montés : registre des dragons et biographie réunis (comme la fiche de la V1). */
function dragonsOf(person: Person, biography: Biography | undefined, registry: readonly string[]): Dragon[] {
  const ids = new Set([...registry, ...(biography?.dragonIds ?? [])]);
  return [...ids].map((id) => getDragon(id)).filter((dragon): dragon is Dragon => dragon !== undefined);
}

function sourceRefs(person: Person, biography: Biography | undefined): SourceRef[] {
  if (biography && biography.sources.length > 0) return biography.sources;
  return person.sources.map((id) => ({ id }));
}

export default function PersonPage() {
  const { personId = '' } = useParams();
  const person = getPerson(personId);
  if (!person) return <NotFoundPage />;
  return <Fiche key={person.id} person={person} />;
}

/**
 * Fiche `/personnages/:personId` de la V3 (v3-spec §6.7, parti). Le folio de la V1 : nom
 * rubriqué, épithète, titres, chapeau, parenté en notation généalogique, biographie en
 * sections (lettrine rubrique, sources en marge), ce que les sources ne tranchent pas, puis
 * ce que l'adaptation change, à part sur le vélin d'ombre. La colonne de la V2 sur le champ :
 * fragment du pal et vie agrandie (qui porte déjà le profil de la vie : la
 * colonne n'en ajoute pas un second). Pas de grand nombre : posé sur un fragment de pal
 * de hauteur variable, il couvrait les noms ; l'année du règne est dans la marge du folio.
 */
function Fiche({ person }: { person: Person }) {
  const t = useT();
  const tx = useTxTypo();
  const title = useTitle();
  const { reading } = useLang();
  const year = useYear();

  const biography = useBiography(person.hasBiography ? person.id : undefined);
  const sovereign = sovereignById.get(person.id);
  const all = useMemo(() => eventsOf(person, biography), [person, biography]);
  const annals = all.filter((event) => event.continuity === 'livres');
  const show = all.filter((event) => event.continuity !== 'livres');
  const eventYears = useMemo(() => [...new Set(annals.map((event) => event.year).filter((value): value is number => value !== null))], [annals]);
  const bounds = lifeBounds(person);
  const end = bounds.died ?? (person.alive ? 300 : null);
  const span: readonly [number, number] | null = bounds.born !== null && end !== null ? [bounds.born, end] : null;
  useVue({
    span,
    reign: sovereign ? [sovereign.reignFrom, sovereign.reignTo] : null,
    marks: eventYears.map((value) => ({ year: value })),
  });

  const mounts = dragonsOf(person, biography, dragonsByRider.get(person.id) ?? []);
  const parentage = v1Graph.parentageByChild.get(person.id);
  const doubtfulParentage = parentage && parentage.certainty !== 'etabli' && parentage.note ? parentage : null;
  const disputed = biography?.disputed ?? null;
  const datesDoubt = person.dateCertainty !== 'exacte';
  const hasDoubt = Boolean(disputed || doubtfulParentage || datesDoubt);
  const sections = biography?.sections ?? [];
  const name = person.name[reading];

  const lifeText =
    bounds.born === null && bounds.died === null
      ? t('page.person.datesUnknown')
      : person.dateCertainty === 'exacte' || bounds.born === null || bounds.died === null
        ? formatSpan(bounds.born, bounds.died, reading)
        : t('v2.cartel.circa', { span: formatSpan(bounds.born, bounds.died, reading) });
  const age = year !== null && deathKnown(person) ? ageAt(person, year) : null;
  const outside =
    age && year !== null && age.state !== 'alive'
      ? age.state === 'unborn'
        ? t('v2.year.outside.unborn', { year: formatYear(year, reading), name })
        : t('v2.year.outside.dead', { year: formatYear(year, reading), name, n: age.since })
      : null;

  const titreId = `v3-fiche-${person.id}`;

  const tete = (
    <header className={`${col.pleine} ${styles.tete}`}>
      <Rubric as="h1" id={titreId} text={person.name} className={styles.titre} />
      {person.epithet ? <p className={styles.epithete}>{tx(person.epithet)}</p> : null}
      {biography && biography.titles.length > 0 ? (
        <ul className={styles.titres} role="list" aria-label={t('v2.person.titles')}>
          {biography.titles.map((entry, index) => (
            <li key={index}>{tx(entry)}</li>
          ))}
        </ul>
      ) : null}
      <p className={styles.meta}>
        <span>{lifeText}</span>
        {person.alive ? <span>{t(person.sex === 'f' ? 'page.person.alive.f' : 'page.person.alive.m')}</span> : null}
        {person.house !== 'aucune' ? <span>{t('page.person.house', { house: t(`page.people.house.${person.house}`) })}</span> : null}
      </p>
      {outside ? <p className={styles.dehors}>{outside}</p> : null}
    </header>
  );

  const folio = (
    <>
      <div className={`${col.rangee} ${styles.ouverture}`}>
        <div className={col.recit}>
          {biography ? <Prose text={biography.lead} variant="chapeau" /> : <Prose text={person.note} variant="chapeau" />}
        </div>
        <aside className={`${col.marge} ${styles.marge}`} aria-label={t('v3.lignee.marge')}>
          {sovereign ? (
            <div className={styles.note}>
              <p className={styles.regne}>{t('page.person.reign', { span: formatSpan(sovereign.reignFrom, sovereign.reignTo, reading) })}</p>
              {sovereign.ordinal !== null ? <p>{t('v2.person.rank', { n: sovereign.ordinal })}</p> : null}
              <p>{tx(sovereign.relationToPredecessor)}</p>
              {sovereign.contested && sovereign.contestedNote ? <p>{tx(sovereign.contestedNote)}</p> : null}
            </div>
          ) : null}
          {person.pretender ? (
            <div className={styles.note}>
              <p className={styles.regne}>{t('page.person.claim', { span: formatSpan(person.pretender.from, person.pretender.to, reading) })}</p>
              {person.pretender.note ? <p>{tx(person.pretender.note)}</p> : null}
            </div>
          ) : null}
          <p className={styles.note}>
            <Lien to={`/lignee?p=${person.id}`} className={styles.lienVelin}>
              {t('page.person.inTree')}
            </Lien>
          </p>
        </aside>
      </div>

      <section className={`${col.rangee} ${styles.section}`} aria-labelledby={`${titreId}-parente`}>
        <div className={col.large}>
          <Rubric as="h2" id={`${titreId}-parente`} k="page.person.kin.heading" />
          <Kinship person={person} />
        </div>
      </section>

      {sections.length > 0 ? (
        sections.map((section, index) => (
          <section key={section.id} className={`${col.rangee} ${styles.section}`} aria-labelledby={`${titreId}-${section.id}`}>
            <div className={col.recit}>
              <Rubric as="h2" id={`${titreId}-${section.id}`} text={section.heading} />
              <Prose text={section.body} lettrine={index === 0} />
            </div>
            {section.sources.length > 0 ? (
              <aside className={col.marge} aria-label={t('label.sources')}>
                <SourceList sources={section.sources} variant="marge" />
              </aside>
            ) : null}
          </section>
        ))
      ) : null}

      <section className={`${col.rangee} ${styles.section}`} aria-labelledby={`${titreId}-annales`}>
        <div className={col.recit}>
          <Rubric as="h2" id={`${titreId}-annales`} k="v2.person.annals" />
          {annals.length > 0 ? (
            <ol className={styles.annales} role="list">
              {annals.map((event) => (
                <li key={event.id} className={styles.annale}>
                  <span className={styles.annaleAnnee}>{tx(event.yearLabel) || formatYear(event.year, reading)}</span>
                  <span className={styles.annaleTitre}>
                    <EntityLink kind="event" id={event.id} name={event.title} periodId={event.periodId} />
                  </span>
                  <ReliabilityMark level={event.reliability} compact className={styles.annaleMarque} />
                </li>
              ))}
            </ol>
          ) : (
            <p className={styles.calme}>{t('page.person.life.noEvents')}</p>
          )}
        </div>
      </section>

      {mounts.length > 0 ? (
        <section className={`${col.pleine} ${styles.section}`} aria-labelledby={`${titreId}-dragons`}>
          <Rubric as="h2" id={`${titreId}-dragons`} k={mounts.length > 1 ? 'page.person.dragons.many' : 'page.person.dragons.one'} />
          <ul className={styles.montures} role="list">
            {mounts.map((dragon) => {
              const ride = dragon.riders.find((rider) => rider.personId === person.id && (rider.from !== undefined || rider.to !== undefined));
              return (
                <li key={dragon.id} className={styles.monture}>
                  <div className={styles.montureFigure} aria-hidden="true">
                    <div style={{ inlineSize: `${Math.round(40 + 60 * Math.min(dragon.look.span, 1))}%` }}>
                      <DragonFigure look={dragon.look} title={title(dragon.name).primary} tone="engraving" detail="plain" />
                    </div>
                  </div>
                  <p className={styles.montureNom}>
                    <EntityLink kind="dragon" id={dragon.id} name={dragon.name} />
                  </p>
                  {ride ? <p className={styles.montureAnnees}>{formatSpan(ride.from, ride.to, reading)}</p> : null}
                </li>
              );
            })}
          </ul>
        </section>
      ) : null}

      {sections.length === 0 ? (
        <section className={`${col.rangee} ${styles.section}`} aria-labelledby={`${titreId}-notice`}>
          <div className={col.recit}>
            <Rubric as="h2" id={`${titreId}-notice`} k="page.person.notice.heading" />
            <p className={styles.calme}>{t('page.person.notice.body', { name })}</p>
          </div>
        </section>
      ) : null}

      {hasDoubt ? (
        <section className={`${col.rangee} ${styles.section}`} aria-labelledby={`${titreId}-doutes`}>
          <div className={col.recit}>
            <Rubric as="h2" id={`${titreId}-doutes`} k="page.person.doubt.heading" />
            {disputed ? <Prose text={disputed} /> : null}
            {doubtfulParentage ? (
              <div className={styles.doute}>
                <ReliabilityMark level={doubtfulParentage.certainty} />
                <Prose text={doubtfulParentage.note} />
              </div>
            ) : null}
            {datesDoubt ? (
              <p className={styles.calme}>{t(person.dateCertainty === 'inconnue' ? 'page.person.doubt.datesUnknown' : 'page.person.doubt.datesApprox')}</p>
            ) : null}
          </div>
        </section>
      ) : null}

      {biography?.adaptation || show.length > 0 ? (
        <section className={`${col.pleine} ${styles.adaptation}`} aria-labelledby={`${titreId}-adaptation`}>
          <div className={styles.adaptationTexte}>
            <p className={styles.adaptationMarque}>
              <ReliabilityMark level="adaptation" />
            </p>
            <Rubric as="h2" id={`${titreId}-adaptation`} k="page.person.adaptation.heading" size="sous" />
            {biography?.adaptation ? <Prose text={biography.adaptation} /> : null}
            {show.length > 0 ? (
              <ul className={styles.adaptationListe} role="list">
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

      <section className={`${col.rangee} ${styles.section}`} aria-labelledby={`${titreId}-sources`}>
        <div className={col.recit}>
          <Rubric as="h2" id={`${titreId}-sources`} k="label.sources" size="sous" />
          <SourceList sources={sourceRefs(person, biography)} variant="bloc" />
        </div>
      </section>
    </>
  );

  return (
    <Vue partition="parti">
      <Parti3
        labelledBy={titreId}
        tete={tete}
        folio={folio}
        colonne={
          <Colonne
            label={t('v3.lignee.colonne')}
            figure={
              <div className={styles.figure}>
                <FragmentPal person={person} />
              </div>
            }
            pied={<VieAgrandie person={person} eventYears={eventYears} year={year} height={150} />}
          />
        }
      />
    </Vue>
  );
}
