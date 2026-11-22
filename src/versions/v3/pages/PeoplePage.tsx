import { useMemo } from 'react';
import type { ReactNode } from 'react';
import { useSearchParams } from 'react-router-dom';

import { periods } from '@/core/content/timeline';
import type { Person } from '@/core/content/types';
import { formatYear, useLang, useT, useTitle } from '@/core/i18n';
import { lifeSpans } from '@/core/timeline';
import { groupIndex } from '@/versions/v1-codex/pages/people/peopleIndex';
import { Filtres, useFiltre } from '@/versions/v2/components/Filtres';
import type { FiltreOption } from '@/versions/v2/components/Filtres';
import { GrandNombre } from '@/versions/v2/components/GrandNombre';
import { toRoman } from '@/versions/v2/components/numerals';
import { Vide } from '@/versions/v2/components/Vide';
import { ageAt } from '@/versions/v2/model/relations';
import { deathKnown, dragonsByRider, persons, sovereignById, sovereigns } from '@/versions/v2/pages/lignee/donnees';
import { groupesVies } from '@/versions/v2/pages/lignee/groupesVies';
import { ViesFascees } from '@/versions/v2/pages/lignee/ViesFascees';
import { useYear } from '@/versions/v2/state/year';

import { Nom } from '../components/common/Nom';
import { TitreChamp } from '../components/common/TitreChamp';
import { DESKTOP, useMedia } from '../components/common/useMedia';
import { useVue } from '../components/common/useVue';
import { Vue } from '../components/common/Vue';
import { IndexNoms } from './lignee/IndexNoms';
import styles from './PeoplePage.module.css';

const ROLES = ['crowned', 'pretenders', 'riders', 'bastards'] as const;
type RoleId = (typeof ROLES)[number];

/** Maisons nommées dans le filtre : au moins trois personnes ; le reste sous « autres maisons ». */
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

type Tri = 'naissance' | 'nom';

/** Le rail de saut : en clair sur ordinateur, replié sous son intitulé au téléphone (il pousserait la figure hors de l'écran). */
function Rail({ label, children }: { label: string; children: ReactNode }) {
  const desktop = useMedia(DESKTOP);
  const liste = (
    <ol role="list" className={styles.railListe}>
      {children}
    </ol>
  );
  return (
    <nav className={styles.rail} aria-label={label}>
      {desktop ? (
        liste
      ) : (
        <details className={styles.railPli}>
          <summary className={styles.railTitre}>{label}</summary>
          {liste}
        </details>
      )}
    </nav>
  );
}

/**
 * Personnages `/personnages` de la V3 (v3-spec §6.6, fascé sur le champ). Par naissance
 * (défaut) : les lignes de vie de la V2, en groupes de période, l'entaille de l'année réglée
 * à travers toutes les lignes, les personnes sans date à la fin. Par nom (`?tri=nom`) :
 * l'index savant de la V1. Les filtres (`?filtre=`) valent pour les deux ordres.
 */
export default function PeoplePage() {
  const t = useT();
  const title = useTitle();
  const { reading } = useLang();
  const year = useYear();
  const active = useFiltre('filtre');
  const [params, setParams] = useSearchParams();
  const tri: Tri = params.get('tri') === 'nom' ? 'nom' : 'naissance';
  useVue();

  const roles = useMemo(() => new Set([...active].filter((value) => !value.startsWith('maison-'))), [active]);
  const houses = useMemo(() => new Set([...active].filter((value) => value.startsWith('maison-')).map((value) => value.slice(7))), [active]);

  const keep = useMemo(() => {
    return (person: Person) =>
      (roles.size === 0 || [...roles].some((role) => (ROLES as readonly string[]).includes(role) && hasRole(person, role as RoleId))) &&
      (houses.size === 0 || houses.has(houseKey(person)));
  }, [roles, houses]);

  const shown = useMemo(() => persons.filter(keep), [keep]);
  const shownIds = useMemo(() => new Set(shown.map((person) => person.id)), [shown]);
  const groupes = useMemo(() => groupesVies(ALL_SPANS.spans.filter((span) => shownIds.has(span.id)), periods, sovereigns), [shownIds]);
  const lettres = useMemo(() => (tri === 'nom' ? groupIndex(shown, 'alpha', reading) : []), [tri, shown, reading]);
  const undated = useMemo(() => ALL_SPANS.undated.filter((id) => shownIds.has(id)), [shownIds]);
  const living = useMemo(() => (year === null ? null : persons.filter((person) => deathKnown(person) && ageAt(person, year)?.state === 'alive').length), [year]);

  const options: FiltreOption[] = [
    ...ROLES.map((role) => ({ value: role, label: t(`page.people.role.${role}`) })),
    ...[...HOUSES, 'others'].map((house) => ({ value: `maison-${house}`, label: t(`page.people.house.${house}`) })),
  ];

  const edit = (change: (copy: URLSearchParams) => void) => {
    setParams(
      (previous) => {
        const copy = new URLSearchParams(previous);
        change(copy);
        return copy;
      },
      { replace: true, preventScrollReset: true },
    );
  };
  const clear = () => edit((copy) => copy.delete('filtre'));
  const setTri = (next: Tri) =>
    edit((copy) => {
      if (next === 'nom') copy.set('tri', 'nom');
      else copy.delete('tri');
    });

  return (
    <Vue partition="fasce" className={styles.vue}>
      <div className={styles.tete}>
        <TitreChamp k="nav.characters" className={styles.titre}>
          <p className={styles.chapeau}>{t('v3.lignee.people_lead', { n: ALL_SPANS.spans.length })}</p>
        </TitreChamp>
        <div className={styles.nombre}>
          <GrandNombre value={String(living ?? persons.length)} />
          <p className={styles.legende}>
            {living === null ? t('v2.people.total') : t('v2.people.living', { year: formatYear(year, reading) })}
          </p>
        </div>
      </div>

      <div className={styles.commandes}>
        <div className={styles.tri} role="group" aria-label={t('page.people.sort.label')}>
          <span className={styles.triEtiquette} aria-hidden="true">
            {t('page.people.sort.label')}
          </span>
          <button type="button" className={styles.bascule} aria-pressed={tri === 'naissance'} onClick={() => setTri('naissance')}>
            {t('v3.lignee.tri_naissance')}
          </button>
          <button type="button" className={styles.bascule} aria-pressed={tri === 'nom'} onClick={() => setTri('nom')}>
            {t('page.people.sort.alpha')}
          </button>
        </div>
        <Filtres param="filtre" options={options} count={shown.length} total={persons.length} label={t('page.people.filter.roles')} />
      </div>

      {tri === 'naissance' && groupes.length > 0 ? (
        <Rail label={t('v2.people.jump')}>
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
        </Rail>
      ) : null}

      {tri === 'nom' && lettres.length > 0 ? (
        <Rail label={t('v3.lignee.jump_letter')}>
            {lettres.map((groupe) => (
              <li key={groupe.id}>
                <a href={`#l-${groupe.id}`} className={`${styles.railLien} ${styles.railLettre}`}>
                  {groupe.id}
                </a>
              </li>
            ))}
        </Rail>
      ) : null}

      {shown.length === 0 ? (
        <Vide
          action={
            <button type="button" className={styles.bascule} onClick={clear}>
              {t('page.bati.filter.clear')}
            </button>
          }
        >
          {t('page.people.empty.title')} {t('page.people.empty.body')}
        </Vide>
      ) : tri === 'nom' ? (
        <IndexNoms groupes={lettres} />
      ) : (
        <div className={styles.vies}>
          <ViesFascees groupes={groupes} year={year} />
        </div>
      )}

      {tri === 'naissance' && undated.length > 0 ? (
        <section id="g-sans-date" className={styles.sansDate} aria-labelledby="g-sans-date-t">
          <h2 id="g-sans-date-t" className={styles.sansDateTitre}>
            {t('v2.people.undated')}
          </h2>
          <p className={styles.sansDateNote}>{t('v2.people.undated_note', { n: undated.length })}</p>
          <ul role="list" className={styles.sansDateListe}>
            {undated.map((id) => {
              const person = persons.find((candidate) => candidate.id === id);
              if (!person) return null;
              return (
                <li key={id} className={styles.sansDateNom}>
                  <Nom kind="person" id={id} name={person.name} />
                </li>
              );
            })}
          </ul>
        </section>
      ) : null}
    </Vue>
  );
}
