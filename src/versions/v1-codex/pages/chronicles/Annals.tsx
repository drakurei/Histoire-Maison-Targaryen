import { useMemo, useState } from 'react';

import { VLink } from '@/app/version';
import { getReliabilityLevel } from '@/core/content/sources';
import type { HistoricalEvent, Reliability } from '@/core/content/types';
import { useLang, useT, useTitle, useTx, VALYRIAN_TAG, yearParts } from '@/core/i18n';
import { eventFacets, eventsByYear, filterEvents } from '@/core/timeline';
import type { YearGroup } from '@/core/timeline';

import { EmptyState } from '../../components/EmptyState';
import { FilterBar } from '../../components/FilterBar';
import type { FilterGroup } from '../../components/FilterBar';
import { ReliabilityMark } from '../../components/ReliabilityMark';
import styles from './Annals.module.css';

/** Nombre de personnes et de dragons proposés comme filtres : les plus cités du volume. */
const FACETS_SHOWN = 8;

type Criterion = 'reliability' | 'people' | 'dragons';

function toggle(set: ReadonlySet<string>, value: string): Set<string> {
  const next = new Set(set);
  if (next.has(value)) next.delete(value);
  else next.add(value);
  return next;
}

/** L'année suspendue en marge : le nombre en grand, le sigle d'ère dessous ; à défaut, la date telle que la source la donne. */
function HangingYear({ group }: { group: YearGroup }) {
  const t = useT();
  const tx = useTx();
  const { reading } = useLang();
  const first = group.events[0];
  const parts = yearParts(group.year, reading);
  if (!parts || !first) {
    return <p className={styles.yearLoose}>{tx(first?.yearLabel)}</p>;
  }
  const approx = first.dateCertainty === 'approximative';
  return (
    <p className={styles.year}>
      {approx ? <span className={styles.approx}>{t('page.event.approx')} </span> : null}
      <span className={styles.number}>{parts.value}</span> <span className={styles.era}>{parts.era}</span>
    </p>
  );
}

function Entry({ event }: { event: HistoricalEvent }) {
  const t = useT();
  const tx = useTx();
  const title = useTitle();
  const { reading } = useLang();
  const span = event.yearEnd !== undefined && event.yearEnd !== event.year;
  const heading = title(event.title);
  return (
    <li className={styles.entry} data-continuity={event.continuity}>
      <h3 className={styles.title}>
        <VLink to={`/chroniques/${event.periodId}/${event.id}`} className={styles.link}>
          <span lang={heading.isHv ? VALYRIAN_TAG : undefined}>{heading.primary}</span>
        </VLink>
      </h3>
      <p className={styles.summary} lang={reading}>
        {tx(event.summary)}
      </p>
      {tx(event.consequence) ? (
        <p className={styles.consequence} lang={reading}>
          <span className={styles.consequenceLabel}>{t('page.period.consequence')}</span> {tx(event.consequence)}
        </p>
      ) : null}
      <p className={styles.meta}>
        <ReliabilityMark level={event.reliability} />
        {span ? <span className={styles.span}>{tx(event.yearLabel)}</span> : null}
        {event.continuity === 'adaptation' ? <span className={styles.adaptation}>{t('page.period.adaptation')}</span> : null}
      </p>
    </li>
  );
}

/**
 * Les annales d'un volume : les événements dans l'ordre du temps, regroupés par année,
 * l'année suspendue en marge à l'encre rouge. Filtres par certitude, personne, dragon et mot ;
 * la logique de filtre est celle de @/core/timeline.
 */
export function Annals({ events }: { events: readonly HistoricalEvent[] }) {
  const t = useT();
  const tx = useTx();
  const title = useTitle();
  const { reading } = useLang();
  const [chosen, setChosen] = useState<Record<Criterion, ReadonlySet<string>>>({
    reliability: new Set(),
    people: new Set(),
    dragons: new Set(),
  });
  const [text, setText] = useState('');

  const facets = useMemo(() => eventFacets(events), [events]);
  const shown = useMemo(
    () =>
      filterEvents(
        events,
        {
          reliability: [...chosen.reliability] as Reliability[],
          people: [...chosen.people],
          dragons: [...chosen.dragons],
          text,
        },
        reading,
      ),
    [events, chosen, text, reading],
  );
  const groups = useMemo(() => eventsByYear(shown), [shown]);

  const filterGroups: FilterGroup[] = [
    {
      id: 'reliability',
      label: t('page.period.filter.reliability'),
      options: [...facets.reliability]
        .sort((a, b) => (getReliabilityLevel(a.value)?.order ?? 0) - (getReliabilityLevel(b.value)?.order ?? 0))
        .map((facet) => ({
          value: facet.value,
          label: <ReliabilityMark level={facet.value} />,
          pressed: chosen.reliability.has(facet.value),
          count: facet.count,
        })),
    },
    {
      id: 'people',
      label: t('page.period.filter.people'),
      options: facets.people
        .filter((facet) => facet.id && facet.count > 1)
        .slice(0, FACETS_SHOWN)
        .map((facet) => ({ value: facet.key, label: tx(facet.name), pressed: chosen.people.has(facet.key), count: facet.count })),
    },
    {
      id: 'dragons',
      label: t('page.period.filter.dragons'),
      options: facets.dragons
        .filter((facet) => facet.id)
        .slice(0, FACETS_SHOWN)
        .map((facet) => ({ value: facet.key, label: title(facet.name).primary, pressed: chosen.dragons.has(facet.key), count: facet.count })),
    },
  ].filter((group) => group.options.length > 1);

  const clear = () => {
    setChosen({ reliability: new Set(), people: new Set(), dragons: new Set() });
    setText('');
  };

  return (
    <div className={styles.annals}>
      <FilterBar
        className={styles.filters}
        label={t('page.period.filter.label')}
        groups={filterGroups}
        onToggle={(group, value) => setChosen((current) => ({ ...current, [group]: toggle(current[group as Criterion], value) }))}
        shown={shown.length}
        total={events.length}
        onClear={clear}
        text={{ value: text, onChange: setText }}
      />

      {groups.length === 0 ? (
        <EmptyState
          className={styles.empty}
          titleKey="page.period.annals.empty"
          bodyKey="page.period.annals.emptyBody"
          action={{ labelKey: 'page.bati.filter.clear', onClick: clear }}
        />
      ) : (
        <ol role="list" className={styles.list}>
          {groups.map((group) => (
            <li key={`${group.year ?? 'n'}-${group.sortYear}`} className={styles.group}>
              <HangingYear group={group} />
              <ol role="list" className={styles.entries}>
                {group.events.map((event) => (
                  <Entry key={event.id} event={event} />
                ))}
              </ol>
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}
