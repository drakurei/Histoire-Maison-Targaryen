import { useId } from 'react';
import type { ReactNode } from 'react';

import { useT } from '@/core/i18n';

import styles from './FilterBar.module.css';

export interface FilterOption {
  value: string;
  /** Libellé déjà traduit ou composé (une marque de fiabilité, un nom). */
  label: ReactNode;
  pressed: boolean;
  /** Nombre d'éléments que ce filtre retient, s'il est utile de le dire. */
  count?: number;
}

export interface FilterGroup {
  id: string;
  /** Nom du groupe, déjà traduit (« Fiabilité », « Dragons »). */
  label: string;
  options: readonly FilterOption[];
}

interface FilterBarProps {
  groups: readonly FilterGroup[];
  onToggle: (groupId: string, value: string) => void;
  /** Éléments affichés après filtrage, et en tout : annoncés en direct. */
  shown: number;
  total: number;
  /** Retire tous les filtres ; le bouton n'apparaît que si quelque chose est filtré. */
  onClear?: () => void;
  /** Champ de texte libre. */
  text?: { value: string; onChange: (value: string) => void };
  /** Nom du groupe de filtres ; par défaut « Filtrer ». */
  label?: string;
  className?: string;
}

/**
 * FilterBar : filtres en ligne. Des mots qui se soulignent quand ils sont actifs (boutons
 * bascule, `aria-pressed`), jamais des pastilles ; un champ de texte facultatif ; le compte
 * des résultats annoncé en direct (`aria-live`).
 */
export function FilterBar({ groups, onToggle, shown, total, onClear, text, label, className }: FilterBarProps) {
  const t = useT();
  const id = useId();
  const filtered = shown !== total || groups.some((group) => group.options.some((option) => option.pressed));

  return (
    <div className={`${styles.bar} ${className ?? ''}`} role="group" aria-label={label ?? t('page.bati.filter.label')}>
      {text ? (
        <label className={styles.text}>
          <span className={styles.groupLabel}>{t('page.bati.filter.text')}</span>
          <input
            type="search"
            className={styles.input}
            value={text.value}
            onChange={(event) => text.onChange(event.target.value)}
            autoComplete="off"
            spellCheck={false}
          />
        </label>
      ) : null}

      {groups.map((group) => {
        const labelId = `${id}-${group.id}`;
        return (
          <div key={group.id} className={styles.group} role="group" aria-labelledby={labelId}>
            <span id={labelId} className={styles.groupLabel}>
              {group.label}
            </span>
            <div className={styles.options}>
              {group.options.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  className={styles.option}
                  aria-pressed={option.pressed}
                  onClick={() => onToggle(group.id, option.value)}
                >
                  {option.label}
                  {option.count !== undefined ? <span className={styles.count}>{option.count}</span> : null}
                </button>
              ))}
            </div>
          </div>
        );
      })}

      <div className={styles.status}>
        <p className={styles.tally} aria-live="polite" aria-atomic="true">
          {t('page.bati.filter.count', { n: shown, total })}
        </p>
        {onClear && filtered ? (
          <button type="button" className={styles.clear} onClick={onClear}>
            {t('page.bati.filter.clear')}
          </button>
        ) : null}
      </div>
    </div>
  );
}
