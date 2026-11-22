import { useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';

import { periods } from '@/core/content/timeline';
import type { Person } from '@/core/content/types';
import { formatYear, useLang, useT, useTitle } from '@/core/i18n';
import { lifeSpans } from '@/core/timeline';

import { Filtres, useFiltre } from '../components/Filtres';
import type { FiltreOption } from '../components/Filtres';
import { GrandNombre } from '../components/GrandNombre';
import { NomEntite } from '../components/NomEntite';
import { toRoman } from '../components/numerals';
import { Page } from '../components/Page';
import { Titre } from '../components/Titre';
import { Vide } from '../components/Vide';
import { ageAt } from '../model/relations';
import { useYear } from '../state/year';

import { deathKnown, dragonsByRider, persons, sovereignById, sovereigns } from './lignee/donnees';
import { groupesVies } from './lignee/groupesVies';
import { ViesFascees } from './lignee/ViesFascees';
import styles from './PeoplePage.module.css';

const ROLES = ['crowned', 'pretenders', 'riders', 'bastards'] as const;
type RoleId = (typeof ROLES)[number];

/** Maisons nommées dans le filtre : celles qui comptent au moins trois personnes ; le reste va sous « autres maisons ». */
const HOUSES: readonly string[] = (() => {
  const counts = new Map<string, number>();
  for (const person of persons) counts.set(person.house, (counts.get(person.house) ?? 0) + 1);
  return [...counts].filter(([house, n]) => n >= 3 && house !== 'aucune').sort((a, b) => b[1] - a[1]).map(([house]) => house);
})();

function hasRole(person: Person, role: RoleId): boolean {
  switch (role) {
    case 'crowned':
      return sovereignById.has(person.id);
    case 'pretenders':
      return person.pretender !== undefined;
    case 'riders':
      return dragonsByRider.has(person.id);
    case 'bastards':
      return person.legitimacy !== 'legitime';
  }
}

function houseKey(person: Person): string {
  return HOUSES.includes(person.house) ? person.house : 'others';
}

const ALL_SPANS = lifeSpans(persons);

/** Un souverain sans le nom de la Maison, qui va sans dire ici : « Jaehaerys Ier ». */
function sansMaison(name: string): string {
  return name.replace(/\s+Targaryen$/, '');
}

/**
 * Personnages `/personnages` (fascé, spec §5.8) : une rangée par personne, par naissance, en
 * groupes de période (les longues subdivisées par règne), la vie à l'échelle de la fasce ;
 * les personnes sans aucune année à la fin. Filtres dans l'adresse (`?filtre=riders,maison-velaryon`) :
 * plusieurs rôles s'additionnent, plusieurs maisons aussi, et un rôle croise une maison.
 */
export default function PeoplePage() {
  const t = useT();
  const title = useTitle();
  const { reading } = useLang();
  const year = useYear();
  const active = useFiltre('filtre');
  const roles = useMemo(() => new Set([...active].filter((value) => !value.startsWith('maison-'))), [active]);
  const houses = useMemo(() => new Set([...active].filter((value) => value.startsWith('maison-')).map((value) => value.slice(7))), [active]);
  const [, setParams] = useSearchParams();

  const keep = useMemo(() => {
    return (person: Person) =>
      (roles.size === 0 || [...roles].some((role) => (ROLES as readonly string[]).includes(role) && hasRole(person, role as RoleId))) &&
      (houses.size === 0 || houses.has(houseKey(person)));
  }, [roles, houses]);

  const shown = useMemo(() => persons.filter(keep), [keep]);
  const shownIds = useMemo(() => new Set(shown.map((person) => person.id)), [shown]);
  const groupes = useMemo(
    () => groupesVies(ALL_SPANS.spans.filter((span) => shownIds.has(span.id)), periods, sovereigns),
    [shownIds],
  );
  const undated = useMemo(() => ALL_SPANS.undated.filter((id) => shownIds.has(id)), [shownIds]);
  const living = useMemo(() => (year === null ? null : persons.filter((person) => deathKnown(person) && ageAt(person, year)?.state === 'alive').length), [year]);

  const options: FiltreOption[] = [
    ...ROLES.map((role) => ({ value: role, label: t(`page.people.role.${role}`) })),
    ...[...HOUSES, 'others'].map((house) => ({ value: `maison-${house}`, label: t(`page.people.house.${house}`) })),
  ];

  const clear = () => {
    setParams(
      (previous) => {
        const copy = new URLSearchParams(previous);
        copy.delete('filtre');
        return copy;
      },
      { replace: true, preventScrollReset: true },
    );
  };

  return (
    <Page partition="fasce" className={styles.page}>
      <div className={styles.tete}>
        <Titre k="nav.characters">
          <p className={styles.chapeau}>{t('v2.people.lead', { n: ALL_SPANS.spans.length })}</p>
        </Titre>
        <div className={styles.nombre}>
          <GrandNombre value={String(living ?? persons.length)} />
          <p className={styles.legende}>
            {living === null ? t('v2.people.total') : t('v2.people.living', { year: formatYear(year, reading) })}
          </p>
        </div>
      </div>

      <div className={styles.commandes}>
        <Filtres param="filtre" options={options} count={shown.length} total={persons.length} label={t('page.people.filter.roles')} />
      </div>

      {groupes.length > 0 ? (
        <nav className={styles.rail} aria-label={t('v2.people.jump')}>
          <ol role="list" className={styles.railListe}>
            {groupes.map((groupe) => (
              <li key={groupe.key}>
                <a href={`#g-${groupe.key}`} className={styles.railLien}>
                  <span className={styles.railChiffre}>{toRoman(groupe.period.order)}</span>
                  <span>
                    {groupe.reigns.length > 0
                      ? groupe.reigns.map((sovereign) => sansMaison(sovereign.name[reading])).join(', ')
                      : (title(groupe.period.title).gloss ?? title(groupe.period.title).primary)}
                  </span>
                </a>
              </li>
            ))}
            {undated.length > 0 ? (
              <li>
                <a href="#g-sans-date" className={styles.railLien}>
                  {t('v2.people.undated')}
                </a>
              </li>
            ) : null}
          </ol>
        </nav>
      ) : null}

      {shown.length === 0 ? (
        <Vide
          action={
            <button type="button" className={styles.effacer} onClick={clear}>
              {t('page.bati.filter.clear')}
            </button>
          }
        >
          {t('page.people.empty.title')} {t('page.people.empty.body')}
        </Vide>
      ) : (
        <ViesFascees groupes={groupes} year={year} />
      )}

      {undated.length > 0 ? (
        <section id="g-sans-date" className={styles.sansDate}>
          <h2 className={styles.sansDateTitre}>{t('v2.people.undated')}</h2>
          <p className={styles.sansDateNote}>{t('v2.people.undated_note', { n: undated.length })}</p>
          <ul role="list" className={styles.sansDateListe}>
            {undated.map((id) => {
              const person = persons.find((candidate) => candidate.id === id);
              if (!person) return null;
              return (
                <li key={id} className={styles.sansDateNom}>
                  <NomEntite kind="person" id={id} name={person.name} />
                  <svg className={styles.hachure} width="28" height="8" viewBox="0 0 28 8" aria-hidden="true" focusable="false">
                    <path d="M0 8L8 0M6 8L14 0M12 8L20 0M18 8L26 0" />
                  </svg>
                </li>
              );
            })}
          </ul>
        </section>
      ) : null}
    </Page>
  );
}
