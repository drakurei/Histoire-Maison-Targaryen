import { useCallback, useMemo, useState } from 'react';

import { MAIN_ID } from '@/app/a11y';
import { VLink } from '@/app/version';
import { persons } from '@/core/content/people';
import type { Person } from '@/core/content/types';
import { formatYear, useLang, useT } from '@/core/i18n';
import { CrownGlyph, WingGlyph } from '@/shared/marks/Marks';

import { EmptyState } from '../components/EmptyState';
import { Figure } from '../components/Figure';
import { FilterBar } from '../components/FilterBar';
import type { FilterGroup } from '../components/FilterBar';
import { Folio } from '../components/Folio';
import { col } from '../components/grid';
import { toRoman } from '../components/numerals';
import { Rubric } from '../components/Rubric';
import { CROWNED, RIDERS, indexName, lifeYears } from './lineage/model';
import styles from './PeoplePage.module.css';
import { countHouse, groupIndex, hasRole, HOUSE_FILTERS, matches, medianBirth, ROLES } from './people/peopleIndex';
import type { IndexGroup, Role, SortMode } from './people/peopleIndex';
import { ReignRibbon } from './people/ReignRibbon';
import { useTxTypo } from '../components/typo';

const SORTS: readonly SortMode[] = ['alpha', 'generation', 'house'];

function toggled<T>(set: ReadonlySet<T>, value: T): Set<T> {
  const next = new Set(set);
  if (next.has(value)) next.delete(value);
  else next.add(value);
  return next;
}

function Entry({ person }: { person: Person }) {
  const t = useT();
  const tx = useTxTypo();
  const { reading } = useLang();
  const name = indexName(person, reading);
  const years = lifeYears(person, reading);
  return (
    <li className={styles.entry}>
      <span className={styles.signs}>
        {CROWNED.has(person.id) ? <CrownGlyph size="0.95em" className={styles.crown} title={t('page.people.sign.crowned')} /> : null}
      </span>
      <span className={styles.body}>
        <VLink to={`/personnages/${person.id}`} className={styles.name}>
          {name.main}
        </VLink>
        {name.qualifier ? <span className={styles.qualifier}> ({name.qualifier})</span> : null}
        {person.epithet ? <span className={styles.epithet}>, {tx(person.epithet)}</span> : null}
        {years ? <span className={styles.years}>{years}</span> : null}
        {RIDERS.has(person.id) ? <WingGlyph size="0.95em" className={styles.wing} title={t('page.people.sign.rider')} /> : null}
        {person.hasBiography ? (
          <span className={styles.bio} role="img" aria-label={t('page.people.sign.biography')} title={t('page.people.sign.biography')} />
        ) : null}
      </span>
    </li>
  );
}

function GroupHeading({ group }: { group: IndexGroup }) {
  const t = useT();
  const { reading } = useLang();
  if (group.mode === 'alpha') return <h2 className={styles.letter}>{group.id}</h2>;
  if (group.mode === 'generation') {
    const epoch = medianBirth(group.persons);
    return (
      <h2 className={styles.generation}>
        <span className={styles.numeral} aria-hidden="true">
          {toRoman(Number(group.id) + 1)}
        </span>
        <span className={styles.generationText}>
          <span className={styles.visuallyHidden}>{t('page.people.generation', { n: Number(group.id) + 1 })}</span>
          {epoch !== null ? <span className={styles.epoch}>{t('page.lignee.rail.circa', { year: formatYear(epoch, reading) })}</span> : null}
        </span>
      </h2>
    );
  }
  return <h2 className={styles.house}>{t(`page.people.house.${group.id}`)}</h2>;
}

/**
 * Personnages (/personnages) : un index à la manière de ceux qui ferment les livres savants.
 * Le ruban des règnes en tête ; puis les noms en colonnes, classés par ordre alphabétique,
 * par génération ou par maison ; filtres par rôle et par maison.
 */
export default function PeoplePage() {
  const t = useT();
  const { reading } = useLang();
  const [sort, setSort] = useState<SortMode>('alpha');
  const [roles, setRoles] = useState<ReadonlySet<Role>>(() => new Set());
  const [houses, setHouses] = useState<ReadonlySet<string>>(() => new Set());

  const shown = useMemo(() => persons.filter((person) => matches(person, { roles, houses })), [houses, roles]);
  const groups = useMemo(() => groupIndex(shown, sort, reading), [reading, shown, sort]);

  const filterGroups: FilterGroup[] = [
    {
      id: 'roles',
      label: t('page.people.filter.roles'),
      options: ROLES.map((role) => ({
        value: role,
        label: t(`page.people.role.${role}`),
        pressed: roles.has(role),
        count: persons.filter((person) => hasRole(person, role)).length,
      })),
    },
    {
      id: 'houses',
      label: t('page.people.filter.houses'),
      options: HOUSE_FILTERS.map((house) => ({
        value: house,
        label: t(`page.people.house.${house}`),
        pressed: houses.has(house),
        count: countHouse(persons, house),
      })),
    },
  ];

  const onToggle = useCallback((groupId: string, value: string) => {
    if (groupId === 'roles') setRoles((current) => toggled(current, value as Role));
    else setHouses((current) => toggled(current, value));
  }, []);

  const clear = useCallback(() => {
    setRoles(new Set());
    setHouses(new Set());
  }, []);

  return (
    <main id={MAIN_ID}>
      <Folio>
        <header className={`${col.rangee} ${styles.head}`}>
          <div className={col.recit}>
            <Rubric as="h1" k="nav.characters" />
            <p className={styles.lead}>{t('page.people.lead', { n: persons.length })}</p>
          </div>
          <ul className={`${col.marge} ${styles.legend}`} role="list" aria-label={t('page.people.legend')}>
            <li>
              <CrownGlyph size="1em" className={styles.crown} />
              <span>{t('page.people.sign.crowned')}</span>
            </li>
            <li>
              <WingGlyph size="1em" className={styles.wing} />
              <span>{t('page.people.sign.rider')}</span>
            </li>
            <li>
              <span className={styles.bio} aria-hidden="true" />
              <span>{t('page.people.sign.biography')}</span>
            </li>
          </ul>
        </header>

        <Figure className={`${col.pleine} ${styles.ribbon}`} caption={t('page.people.ribbon.caption')}>
          <ReignRibbon />
        </Figure>

        <div className={`${col.pleine} ${styles.controls}`}>
          <div className={styles.sort} role="group" aria-label={t('page.people.sort.label')}>
            <span className={styles.sortLabel}>{t('page.people.sort.label')}</span>
            <div className={styles.sortOptions}>
              {SORTS.map((mode) => (
                <button key={mode} type="button" className={styles.sortButton} aria-pressed={sort === mode} onClick={() => setSort(mode)}>
                  {t(`page.people.sort.${mode}`)}
                </button>
              ))}
            </div>
          </div>
          <FilterBar groups={filterGroups} onToggle={onToggle} shown={shown.length} total={persons.length} onClear={clear} />
        </div>

        {groups.length > 0 ? (
          <div className={`${col.pleine} ${styles.index}`} data-sort={sort}>
            {groups.map((group) => (
              <section key={`${sort}-${group.id}`} className={styles.group}>
                <GroupHeading group={group} />
                <ul className={styles.entries} role="list">
                  {group.persons.map((person) => (
                    <Entry key={person.id} person={person} />
                  ))}
                </ul>
              </section>
            ))}
          </div>
        ) : (
          <EmptyState
            className={col.pleine}
            titleKey="page.people.empty.title"
            bodyKey="page.people.empty.body"
            action={{ labelKey: 'page.bati.filter.clear', onClick: clear }}
          />
        )}
      </Folio>
    </main>
  );
}
