import { useId } from 'react';

import type { Lang, SupportLang } from '@/core/content/types';
import { LANGS, SUPPORT_LANGS, useLang, useT } from '@/core/i18n';

import styles from './LangSwitch.module.css';

interface LangSwitchProps {
  /** `inline` : boutons côte à côte (ligne haute, Index). `select` : liste native (téléphone). */
  mode?: 'inline' | 'select';
  className?: string;
}

const SHORT: Record<Lang, string> = { hv: 'page.bati.lang.short.hv', fr: 'page.bati.lang.short.fr', en: 'page.bati.lang.short.en' };

/**
 * Langue d'affichage (HV FR EN, trois boutons texte, l'actif souligné) et, en mode `hv`,
 * la langue de glose. Au téléphone, une liste native : le système donne le meilleur sélecteur.
 */
export function LangSwitch({ mode = 'inline', className }: LangSwitchProps) {
  const t = useT();
  const { lang, support, setLang, setSupport } = useLang();
  const id = useId();

  if (mode === 'select') {
    return (
      <div className={`${styles.select} ${className ?? ''}`}>
        <label htmlFor={id} className="sr-only">
          {t('a11y.languageSwitch')}
        </label>
        <select id={id} value={lang} onChange={(event) => setLang(event.target.value as Lang)}>
          {LANGS.map((code) => (
            <option key={code} value={code}>
              {t(SHORT[code])}
            </option>
          ))}
        </select>
        <svg className={styles.chevron} viewBox="0 0 16 16" width="0.85em" height="0.85em" aria-hidden="true" focusable="false">
          <path d="M3.5 6l4.5 4.5L12.5 6" fill="none" stroke="currentColor" strokeWidth={1.5} />
        </svg>
      </div>
    );
  }

  return (
    <div className={`${styles.root} ${className ?? ''}`}>
      <div role="group" aria-label={t('a11y.languageSwitch')} className={styles.group}>
        {LANGS.map((code) => (
          <button
            key={code}
            type="button"
            className={styles.button}
            aria-pressed={lang === code}
            onClick={() => setLang(code)}
          >
            {t(SHORT[code])}
          </button>
        ))}
      </div>
      {lang === 'hv' ? (
        <div role="group" aria-label={t('a11y.supportSwitch')} className={styles.group}>
          <span className={styles.label} aria-hidden="true">
            {t('page.bati.support.label')}
          </span>
          {SUPPORT_LANGS.map((code: SupportLang) => (
            <button
              key={code}
              type="button"
              className={styles.button}
              aria-pressed={support === code}
              onClick={() => setSupport(code)}
            >
              {t(SHORT[code])}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}
