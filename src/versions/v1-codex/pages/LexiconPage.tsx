import { useCallback, useEffect, useMemo, useState } from 'react';
import { useLocation } from 'react-router-dom';

import { MAIN_ID } from '@/app/a11y';
import { lexicon } from '@/core/content/language';
import type { HvStatus } from '@/core/content/types';
import { useLang, useT } from '@/core/i18n';

import { EmptyState } from '../components/EmptyState';
import { Figure } from '../components/Figure';
import { FilterBar } from '../components/FilterBar';
import type { FilterGroup } from '../components/FilterBar';
import { Folio } from '../components/Folio';
import { col } from '../components/grid';
import { Rubric } from '../components/Rubric';
import { LexiconRow } from './language/LexiconRow';
import { LexiconTally } from './language/LexiconTally';
import { countBy, entryFromHash, filterLexicon, groupByInitial, sortLexicon, STATUS_ORDER } from './language/lexiconTools';
import { StatusMark } from './language/StatusMark';
import { useHashScroll } from './language/useHashScroll';
import { useThemeLabel } from './language/useThemeLabel';
import styles from './LexiconPage.module.css';

const EMPTY: ReadonlySet<string> = new Set();

function toggled(set: ReadonlySet<string>, value: string): ReadonlySet<string> {
  const next = new Set(set);
  if (next.has(value)) next.delete(value);
  else next.add(value);
  return next;
}

/**
 * Le lexique (/langue/lexique) : table filtrable par thème et par statut, recherche qui
 * ignore macrons et accents, chaque ligne déplie sa notice sur place. L'ancre « #mot-<id> »
 * ouvre et montre la notice visée.
 */
export default function LexiconPage() {
  const t = useT();
  const { reading } = useLang();
  const themeLabel = useThemeLabel();
  const { hash } = useLocation();

  const sorted = useMemo(() => sortLexicon(lexicon), []);
  const byStatus = useMemo(
    () => [...lexicon].sort((a, b) => STATUS_ORDER.indexOf(a.status) - STATUS_ORDER.indexOf(b.status)),
    [],
  );
  const themeCounts = useMemo(() => countBy(lexicon, (entry) => entry.theme), []);
  const statusCounts = useMemo(() => countBy(lexicon, (entry) => entry.status), []);

  const [themes, setThemes] = useState<ReadonlySet<string>>(EMPTY);
  const [statuses, setStatuses] = useState<ReadonlySet<string>>(EMPTY);
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState<ReadonlySet<string>>(() => {
    const target = entryFromHash(hash);
    return target ? new Set([target]) : EMPTY;
  });

  // Une ancre qui change (lien depuis la page de la langue) ouvre sa notice et lève les filtres qui la cacheraient.
  useEffect(() => {
    const target = entryFromHash(hash);
    if (!target) return;
    setOpen((current) => (current.has(target) ? current : toggled(current, target)));
    setThemes(EMPTY);
    setStatuses(EMPTY);
    setQuery('');
  }, [hash]);
  useHashScroll();

  const shown = useMemo(() => filterLexicon(sorted, { themes, statuses, query }), [sorted, themes, statuses, query]);
  const shownIds = useMemo(() => new Set(shown.map((entry) => entry.id)), [shown]);
  const groups = useMemo(() => groupByInitial(shown), [shown]);

  const onToggle = useCallback((groupId: string, value: string) => {
    if (groupId === 'theme') setThemes((current) => toggled(current, value));
    else setStatuses((current) => toggled(current, value));
  }, []);
  const clear = useCallback(() => {
    setThemes(EMPTY);
    setStatuses(EMPTY);
    setQuery('');
  }, []);
  const toggleEntry = useCallback((id: string) => setOpen((current) => toggled(current, id)), []);

  const filterGroups: FilterGroup[] = [
    {
      id: 'theme',
      label: t('page.lexicon.filter.theme'),
      options: [...themeCounts].map(([theme, count]) => ({ value: theme, label: themeLabel(theme), pressed: themes.has(theme), count })),
    },
    {
      id: 'status',
      label: t('page.lexicon.filter.status'),
      options: STATUS_ORDER.filter((status) => statusCounts.has(status)).map((status: HvStatus) => ({
        value: status,
        label: <StatusMark status={status} />,
        pressed: statuses.has(status),
        count: statusCounts.get(status),
      })),
    },
  ];

  return (
    <main id={MAIN_ID}>
      <Folio>
        <Rubric as="h1" k="page.bati.title.lexicon" className={styles.title} />
        <p className={`${styles.lead} ${col.recit}`} lang={reading}>
          {t('page.lexicon.lead')}
        </p>

        {lexicon.length > 0 ? (
          <Figure className={`${styles.tally} ${col.marge}`} caption={t('page.lexicon.tally.caption', { n: lexicon.length })}>
            <LexiconTally entries={byStatus} shown={shownIds} />
          </Figure>
        ) : null}

        {lexicon.length === 0 ? (
          <EmptyState titleKey="page.lexicon.none.title" bodyKey="page.lexicon.none.body" />
        ) : (
          <>
            <FilterBar
              className={col.pleine}
              label={t('page.lexicon.filter.label')}
              groups={filterGroups}
              onToggle={onToggle}
              shown={shown.length}
              total={lexicon.length}
              onClear={clear}
              text={{ value: query, onChange: setQuery }}
            />

            <div className={`${styles.table} ${col.pleine}`}>
              <div className={styles.columns} aria-hidden="true">
                <span>{t('page.lexicon.col.form')}</span>
                <span>{t('page.lexicon.col.meaning')}</span>
                <span className={styles.wideOnly}>{t('page.lexicon.col.theme')}</span>
                <span>{t('page.savoirs.status.label')}</span>
              </div>

              {shown.length === 0 ? (
                <EmptyState
                  titleKey="page.lexicon.empty.title"
                  bodyKey="page.lexicon.empty.body"
                  action={{ labelKey: 'page.bati.filter.clear', onClick: clear }}
                />
              ) : (
                groups.map((group) => (
                  <section key={group.initial} className={styles.group} aria-labelledby={`lettre-${group.initial}`}>
                    <h2 id={`lettre-${group.initial}`} className={styles.initial}>
                      {group.initial}
                    </h2>
                    <ul role="list" className={styles.rows}>
                      {group.entries.map((entry) => (
                        <LexiconRow
                          key={entry.id}
                          entry={entry}
                          themeLabel={themeLabel(entry.theme)}
                          open={open.has(entry.id)}
                          onToggle={toggleEntry}
                        />
                      ))}
                    </ul>
                  </section>
                ))
              )}
            </div>
          </>
        )}
      </Folio>
    </main>
  );
}
