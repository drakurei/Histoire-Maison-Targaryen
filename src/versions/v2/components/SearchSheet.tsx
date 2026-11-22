import { useDeferredValue, useEffect, useId, useMemo, useRef, useState } from 'react';
import type { KeyboardEvent } from 'react';
import { useNavigate } from 'react-router-dom';

import { searchEntries } from '@/core/content/search';
import type { SearchKind } from '@/core/content/types';
import { formatYear, useLang, useT, useTitle, useTx, useTypo, VALYRIAN_TAG } from '@/core/i18n';
import { search, splitByRanges } from '@/core/search';
import type { SearchHit, TextRange } from '@/core/search';

import { parseYearQuery } from '../model/presence';
import { useLienHref } from '../state/links';
import { clampToDomain } from '../state/scene';
import { useSetYear } from '../state/year';

import styles from './SearchSheet.module.css';

interface SearchSheetProps {
  onClose: () => void;
}

const LIMIT = 40;

const KIND_KEYS: Record<SearchKind, string> = {
  person: 'page.bati.search.kind.person',
  dragon: 'page.bati.search.kind.dragon',
  event: 'page.bati.search.kind.event',
  period: 'v2.search.kind.period',
  war: 'page.bati.search.kind.war',
  battle: 'page.bati.search.kind.battle',
  place: 'page.bati.search.kind.place',
  word: 'page.bati.search.kind.word',
  path: 'page.bati.search.kind.path',
};

/** Passages trouvés soulignés de braise. */
function Marked({ text, ranges }: { text: string; ranges: readonly TextRange[] | undefined }) {
  if (!ranges || ranges.length === 0) return <>{text}</>;
  return (
    <>
      {splitByRanges(text, ranges).map((segment, index) =>
        segment.hit ? (
          <mark key={index} className={styles.trouve}>
            {segment.text}
          </mark>
        ) : (
          <span key={index}>{segment.text}</span>
        ),
      )}
    </>
  );
}

type Option = { type: 'year'; year: number } | { type: 'hit'; hit: SearchHit };

/**
 * « Korjās » : la recherche (spec §4). Un champ pleine largeur, les réponses groupées par
 * genre, le compte annoncé. Une requête d'année (« 129 », « 114 av ») propose d'abord de
 * régler la fasce. Parcours aux flèches, Entrée pour ouvrir, Échap pour fermer. Chargée à la
 * demande avec son index ; l'année du lecteur est gardée.
 */
export default function SearchSheet({ onClose }: SearchSheetProps) {
  const t = useT();
  const title = useTitle();
  const tx = useTx();
  const typo = useTypo();
  const { lang, reading } = useLang();
  const href = useLienHref();
  const navigate = useNavigate();
  const setYear = useSetYear();
  const dialog = useRef<HTMLDialogElement>(null);
  const id = useId();
  const [query, setQuery] = useState('');
  const deferred = useDeferredValue(query);
  const [cursor, setCursor] = useState({ query: '', index: 0 });

  useEffect(() => {
    const node = dialog.current;
    if (node && !node.open) node.showModal();
  }, []);

  const results = useMemo(() => search(searchEntries, deferred, lang, LIMIT), [deferred, lang]);
  const asked = parseYearQuery(deferred);
  const yearOption = asked === null ? null : clampToDomain(asked);
  const options = useMemo<Option[]>(() => {
    const list: Option[] = yearOption === null ? [] : [{ type: 'year', year: yearOption }];
    for (const group of results.groups) for (const hit of group.hits) list.push({ type: 'hit', hit });
    return list;
  }, [results, yearOption]);
  /** Rang de chaque réponse dans la liste des options (l'année, s'il y en a une, vient d'abord). */
  const rank = useMemo(() => {
    const map = new Map<SearchHit, number>();
    options.forEach((option, position) => {
      if (option.type === 'hit') map.set(option.hit, position);
    });
    return map;
  }, [options]);
  const active = cursor.query === deferred ? Math.min(cursor.index, options.length - 1) : 0;
  const optionId = (index: number) => `${id}-o${index}`;

  const close = () => dialog.current?.close();

  const choose = (option: Option | undefined) => {
    if (!option) return;
    close();
    if (option.type === 'year') setYear(option.year);
    else navigate(href(option.hit.entry.to));
  };

  const onKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    // Échap ferme d'un coup, même quand le champ n'est pas vide (Chrome ne ferait que le vider).
    if (event.key === 'Escape') {
      event.preventDefault();
      close();
      return;
    }
    if (options.length === 0) return;
    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      event.preventDefault();
      const delta = event.key === 'ArrowDown' ? 1 : -1;
      setCursor({ query: deferred, index: (active + delta + options.length) % options.length });
    } else if (event.key === 'Enter') {
      event.preventDefault();
      choose(options[active]);
    }
  };

  useEffect(() => {
    document.getElementById(optionId(active))?.scrollIntoView({ block: 'nearest' });
  });

  const answers = results.total + (yearOption === null ? 0 : 1);
  let countText = t('page.bati.search.idle');
  if (deferred.trim() !== '') {
    if (answers === 0) countText = t('page.bati.search.none', { q: deferred.trim() });
    else if (answers === 1) countText = t('page.bati.search.count.one');
    else countText = t('page.bati.search.count.many', { n: answers });
  }


  return (
    <dialog ref={dialog} className={styles.root} aria-label={t('action.search')} onClose={onClose} data-fondu="">
      <div className={styles.sheet}>
        <div className={styles.champ}>
          <label htmlFor={`${id}-q`} className="sr-only">
            {t('action.search')}
          </label>
          <input
            id={`${id}-q`}
            className={styles.input}
            type="search"
            autoComplete="off"
            spellCheck={false}
            placeholder={t('v2.search.placeholder')}
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            onKeyDown={onKeyDown}
            role="combobox"
            aria-expanded={options.length > 0}
            aria-controls={`${id}-list`}
            aria-activedescendant={options.length > 0 ? optionId(active) : undefined}
            aria-autocomplete="list"
          />
          <button type="button" className={styles.fermer} onClick={close}>
            {t('action.close')}
          </button>
        </div>
        <p className={styles.compte} aria-live="polite">
          {countText}
        </p>
        <div id={`${id}-list`} role="listbox" aria-label={t('action.search')} className={styles.reponses}>
          {yearOption !== null ? (
            <div
              id={optionId(0)}
              role="option"
              aria-selected={active === 0}
              className={styles.option}
              data-actif={active === 0 ? '' : undefined}
              onClick={() => choose(options[0])}
              onPointerMove={() => setCursor({ query: deferred, index: 0 })}
            >
              <span className={styles.annee}>{t('v2.search.set_year', { year: formatYear(yearOption, reading) })}</span>
            </div>
          ) : null}
          {results.groups.map((group) => (
            <div key={group.kind} role="group" className={styles.groupe} aria-label={t(KIND_KEYS[group.kind])}>
              <h3 className={styles.genre} aria-hidden="true">
                {t(KIND_KEYS[group.kind])}
              </h3>
              {group.hits.map((hit) => {
                const mine = rank.get(hit) ?? 0;
                const label = title(hit.entry.label);
                const ranges = label.isHv ? hit.label.hv : hit.label[reading];
                return (
                  <div
                    key={`${hit.entry.kind}-${hit.entry.id}`}
                    id={optionId(mine)}
                    role="option"
                    aria-selected={active === mine}
                    className={styles.option}
                    data-actif={active === mine ? '' : undefined}
                    onClick={() => choose(options[mine])}
                    onPointerMove={() => setCursor({ query: deferred, index: mine })}
                  >
                    <span className={styles.libelle} lang={label.isHv ? VALYRIAN_TAG : undefined}>
                      <Marked text={label.isHv ? label.primary : typo(label.primary)} ranges={ranges} />
                    </span>
                    {hit.entry.hint ? <span className={styles.indice}>{typo(tx(hit.entry.hint))}</span> : null}
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>
    </dialog>
  );
}
