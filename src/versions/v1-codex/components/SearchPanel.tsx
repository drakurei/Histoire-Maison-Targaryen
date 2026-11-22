import { useDeferredValue, useEffect, useId, useMemo, useRef, useState } from 'react';
import type { KeyboardEvent } from 'react';
import { useNavigate } from 'react-router-dom';

import { useVersionPath } from '@/app/version';
import { searchEntries } from '@/core/content/search';
import type { SearchEntry } from '@/core/content/types';
import { Gloss, useLang, useT, useTitle, VALYRIAN_TAG } from '@/core/i18n';
import { search, splitByRanges } from '@/core/search';
import type { SearchHit, TextRange } from '@/core/search';

import styles from './SearchPanel.module.css';

interface SearchPanelProps {
  /** Appelé quand le panneau se ferme (Échap, bouton, choix d'une réponse). */
  onClose: () => void;
}

const LIMIT = 40;

/** Texte affiché, passages trouvés soulignés à l'encre rouge. */
function Marked({ text, ranges }: { text: string; ranges: readonly TextRange[] | undefined }) {
  if (!ranges || ranges.length === 0) return <>{text}</>;
  return (
    <>
      {splitByRanges(text, ranges).map((segment, index) =>
        segment.hit ? (
          <mark key={index} className={styles.hit}>
            {segment.text}
          </mark>
        ) : (
          <span key={index}>{segment.text}</span>
        ),
      )}
    </>
  );
}

/**
 * SearchPanel : la recherche globale. Un feuillet de vélin descend de la barre haute
 * (<dialog> modal) ; réponses groupées par genre (@/core/search), parcourues aux flèches,
 * ouvertes par Entrée, passages trouvés soulignés. Chargé à la demande avec son index.
 */
export function SearchPanel({ onClose }: SearchPanelProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();
  const path = useVersionPath();
  const t = useT();
  const title = useTitle();
  const { lang, reading } = useLang();
  const id = useId();
  const [query, setQuery] = useState('');
  const deferred = useDeferredValue(query);
  const [cursor, setCursor] = useState({ query: '', index: 0 });

  const results = useMemo(() => search(searchEntries, deferred, lang, LIMIT), [deferred, lang]);
  const flat = useMemo(() => results.groups.flatMap((group) => group.hits), [results]);
  const active = cursor.query === deferred ? Math.min(cursor.index, flat.length - 1) : 0;
  const optionId = (index: number) => `${id}-o${index}`;

  useEffect(() => {
    const dialog = dialogRef.current;
    if (dialog && !dialog.open) dialog.showModal();
    // showModal() donne le focus au premier bouton : le lecteur vient pour écrire.
    inputRef.current?.focus();
  }, []);

  useEffect(() => {
    document.getElementById(`${id}-o${active}`)?.scrollIntoView({ block: 'nearest' });
  }, [id, active]);

  const open = (entry: SearchEntry) => {
    dialogRef.current?.close();
    navigate(path(entry.to));
  };

  const move = (index: number) => setCursor({ query: deferred, index });

  const onKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (flat.length === 0) return;
    const last = flat.length - 1;
    const keys: Record<string, () => void> = {
      ArrowDown: () => move(active >= last ? 0 : active + 1),
      ArrowUp: () => move(active <= 0 ? last : active - 1),
      Home: () => move(0),
      End: () => move(last),
      Enter: () => {
        const hit = flat[active];
        if (hit) open(hit.entry);
      },
    };
    const action = keys[event.key];
    if (!action) return;
    event.preventDefault();
    action();
  };

  const status =
    deferred.trim() === ''
      ? t('page.bati.search.idle')
      : results.total === 0
        ? t('page.bati.search.none', { q: deferred.trim() })
        : results.total === 1
          ? t('page.bati.search.count.one')
          : t('page.bati.search.count.many', { n: results.total });

  let index = -1;
  const renderHit = (hit: SearchHit) => {
    index += 1;
    const position = index;
    const label = title(hit.entry.label);
    const labelRanges = label.isHv ? hit.label.hv : hit.label[reading];
    const hint = hit.entry.hint?.[reading];
    return (
      <li
        key={`${hit.entry.kind}-${hit.entry.id}`}
        id={optionId(position)}
        role="option"
        aria-selected={position === active}
        className={styles.option}
        onClick={() => open(hit.entry)}
        onMouseMove={() => position !== active && move(position)}
      >
        <span className={styles.label} lang={label.isHv ? VALYRIAN_TAG : undefined}>
          <Marked text={label.primary} ranges={labelRanges} />
        </span>
        {label.gloss && label.gloss !== label.primary ? <span className={styles.gloss}>{label.gloss}</span> : null}
        {hint ? (
          <span className={styles.hint}>
            <Marked text={hint} ranges={hit.hint?.[reading]} />
          </span>
        ) : null}
      </li>
    );
  };

  return (
    <dialog ref={dialogRef} className={styles.panel} aria-labelledby={`${id}-title`} onClose={onClose} data-surface="velin">
      <div className={styles.head}>
        <h2 id={`${id}-title`} className={styles.title}>
          {t('page.bati.search.title')}
        </h2>
        <button type="button" className={styles.close} onClick={() => dialogRef.current?.close()}>
          <Gloss k="action.close" classes={{ root: styles.closeLabel }} />
        </button>
      </div>

      <input
        ref={inputRef}
        type="search"
        className={styles.input}
        value={query}
        placeholder={t('page.bati.search.placeholder')}
        aria-label={t('page.bati.search.title')}
        role="combobox"
        aria-expanded={flat.length > 0}
        aria-controls={`${id}-list`}
        aria-activedescendant={flat.length > 0 ? optionId(active) : undefined}
        aria-autocomplete="list"
        autoComplete="off"
        spellCheck={false}
        onChange={(event) => setQuery(event.target.value)}
        onKeyDown={onKeyDown}
      />

      <p className={styles.status} aria-live="polite" aria-atomic="true">
        {status}
      </p>

      <div id={`${id}-list`} role="listbox" aria-labelledby={`${id}-title`} className={styles.results}>
        {results.groups.map((group) => (
          <div key={group.kind} role="group" aria-labelledby={`${id}-${group.kind}`} className={styles.group}>
            <h3 id={`${id}-${group.kind}`} className={styles.kind}>
              {t(`page.bati.search.kind.${group.kind}`)}
            </h3>
            <ul role="presentation" className={styles.hits}>
              {group.hits.map(renderHit)}
            </ul>
            {group.total > group.hits.length ? (
              <p className={styles.more}>{t('page.bati.search.more', { n: group.total - group.hits.length })}</p>
            ) : null}
          </div>
        ))}
      </div>

      <p className={styles.keys}>{t('page.bati.search.keys')}</p>
    </dialog>
  );
}

export default SearchPanel;
