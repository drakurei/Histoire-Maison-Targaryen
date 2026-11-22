import { useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';

import { useT } from '@/core/i18n';

import styles from './Filtres.module.css';

export interface FiltreOption {
  value: string;
  /** Libellé déjà traduit. */
  label: string;
}

interface FiltresProps {
  /** Paramètre de l'adresse qui garde l'état (`genre`, `theme`, `statut`, `filtre`). */
  param: string;
  options: readonly FiltreOption[];
  /** Nombre d'entrées montrées, et total : annoncés à chaque changement. */
  count: number;
  total: number;
  /** Nom accessible du groupe, déjà traduit. */
  label: string;
}

/** Les valeurs actives d'un filtre, lues dans l'adresse (`?genre=cite,ruine`). */
export function useFiltre(param: string): ReadonlySet<string> {
  const [params] = useSearchParams();
  const raw = params.get(param);
  return new Set(raw ? raw.split(',').filter(Boolean) : []);
}

/**
 * Filtres d'un registre (spec §4) : boutons bascule en texte, l'actif souligné de braise,
 * compte en `aria-live`, état dans l'adresse sans entrée d'historique (`replace`).
 */
export function Filtres({ param, options, count, total, label }: FiltresProps) {
  const t = useT();
  const [params, setParams] = useSearchParams();
  const active = useFiltre(param);

  const toggle = useCallback(
    (value: string) => {
      const next = new Set(active);
      if (next.has(value)) next.delete(value);
      else next.add(value);
      const copy = new URLSearchParams(params);
      if (next.size === 0) copy.delete(param);
      else copy.set(param, [...next].join(','));
      setParams(copy, { replace: true, preventScrollReset: true });
    },
    [active, params, param, setParams],
  );

  const clear = () => {
    const copy = new URLSearchParams(params);
    copy.delete(param);
    setParams(copy, { replace: true, preventScrollReset: true });
  };

  return (
    <div className={styles.filtres}>
      <div role="group" aria-label={label} className={styles.groupe}>
        {options.map((option) => (
          <button
            key={option.value}
            type="button"
            className={styles.bouton}
            aria-pressed={active.has(option.value)}
            onClick={() => toggle(option.value)}
          >
            {option.label}
          </button>
        ))}
        {active.size > 0 ? (
          <button type="button" className={styles.bouton} onClick={clear}>
            {t('page.bati.filter.clear')}
          </button>
        ) : null}
      </div>
      <p className={styles.compte} aria-live="polite">
        {t('page.bati.filter.count', { n: count, total })}
      </p>
    </div>
  );
}
