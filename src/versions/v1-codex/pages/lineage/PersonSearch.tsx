import { useId, useMemo, useRef, useState } from 'react';
import type { KeyboardEvent } from 'react';

import { persons } from '@/core/content/people';
import type { Person } from '@/core/content/types';
import { useLang, useT } from '@/core/i18n';
import { CrownGlyph } from '@/shared/marks/Marks';

import { CROWNED, lifeYears } from './model';
import styles from './PersonSearch.module.css';

interface PersonSearchProps {
  onPick: (id: string) => void;
  className?: string;
}

const LIMIT = 8;

/** Minuscules sans diacritiques : « Ǣ », « ē » et « e » se confondent dans la recherche. */
function fold(text: string): string {
  return text
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase();
}

/**
 * Chercher une personne dans l'arbre : une liste déroulante accessible (motif « combobox »
 * de l'ARIA), tolérante aux accents, qui cherche dans le nom et le surnom. Flèches pour
 * parcourir, Entrée pour centrer l'arbre, Échap pour refermer.
 */
export function PersonSearch({ onPick, className }: PersonSearchProps) {
  const t = useT();
  const { reading } = useLang();
  const id = useId();
  const input = useRef<HTMLInputElement>(null);
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);

  const index = useMemo(
    () => persons.map((person) => ({ person, key: fold(`${person.name[reading]} ${person.epithet?.[reading] ?? ''}`) })),
    [reading],
  );

  const results = useMemo((): Person[] => {
    const needle = fold(query.trim());
    if (needle.length === 0) return [];
    const words = needle.split(/\s+/);
    return index
      .filter((entry) => words.every((word) => entry.key.includes(word)))
      .sort((a, b) => Number(!a.key.startsWith(words[0] ?? '')) - Number(!b.key.startsWith(words[0] ?? '')))
      .slice(0, LIMIT)
      .map((entry) => entry.person);
  }, [index, query]);

  const expanded = open && query.trim().length > 0;

  const pick = (person: Person) => {
    onPick(person.id);
    setQuery('');
    setOpen(false);
    setActive(0);
  };

  const onKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      setOpen(true);
      setActive((current) => Math.min(results.length - 1, current + 1));
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      setActive((current) => Math.max(0, current - 1));
    } else if (event.key === 'Enter') {
      const person = results[active];
      if (person) {
        event.preventDefault();
        pick(person);
      }
    } else if (event.key === 'Escape') {
      if (expanded) setOpen(false);
      else setQuery('');
    }
  };

  return (
    <div className={`${styles.search} ${className ?? ''}`}>
      <label htmlFor={`${id}-input`} className={styles.label}>
        {t('page.lignee.search.label')}
      </label>
      <input
        ref={input}
        id={`${id}-input`}
        className={styles.input}
        type="search"
        role="combobox"
        aria-expanded={expanded}
        aria-controls={`${id}-list`}
        aria-autocomplete="list"
        aria-activedescendant={expanded && results[active] ? `${id}-o-${active}` : undefined}
        placeholder={t('page.lignee.search.placeholder')}
        value={query}
        autoComplete="off"
        spellCheck={false}
        onChange={(event) => {
          setQuery(event.target.value);
          setOpen(true);
          setActive(0);
        }}
        onKeyDown={onKeyDown}
        onBlur={() => window.setTimeout(() => setOpen(false), 120)}
        onFocus={() => setOpen(true)}
      />
      <ul id={`${id}-list`} role="listbox" className={styles.list} hidden={!expanded} aria-label={t('page.lignee.search.label')}>
        {results.map((person, position) => (
          <li
            key={person.id}
            id={`${id}-o-${position}`}
            role="option"
            aria-selected={position === active}
            className={styles.option}
            onMouseDown={(event) => event.preventDefault()}
            onClick={() => pick(person)}
            onMouseEnter={() => setActive(position)}
          >
            <span className={styles.optionName}>
              {CROWNED.has(person.id) ? <CrownGlyph size="0.85em" className={styles.crown} /> : null}
              {person.name[reading]}
            </span>
            {person.epithet ? <span className={styles.optionEpithet}>{person.epithet[reading]}</span> : null}
            <span className={styles.optionYears}>{lifeYears(person, reading) ?? ''}</span>
          </li>
        ))}
      </ul>
      <p className={styles.status} aria-live="polite">
        {expanded ? (results.length === 0 ? t('page.lignee.search.none') : t('page.lignee.search.count', { n: results.length })) : ''}
      </p>
    </div>
  );
}
