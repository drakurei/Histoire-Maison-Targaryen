import { SUPPORT_LANGS, useLang, useT } from '@/core/i18n';

import styles from './LangSwitch.module.css';
import own from './SupportSwitch.module.css';

interface SupportSwitchProps {
  variant?: 'bar' | 'drawer';
}

/** SupportSwitch : langue des gloses et du récit, proposée seulement quand l'affichage est en haut valyrien. */
export function SupportSwitch({ variant = 'bar' }: SupportSwitchProps) {
  const t = useT();
  const { lang, support, setSupport } = useLang();
  if (lang !== 'hv') return null;

  return (
    <div className={own.support} data-variant={variant}>
      <span className={own.label} aria-hidden="true">
        {t('page.bati.support.label')}
      </span>
      <div className={styles.switch} data-variant={variant} role="group" aria-label={t('a11y.supportSwitch')}>
        {SUPPORT_LANGS.map((code) => {
          const name = t(`lang.${code}`);
          return (
            <button
              key={code}
              type="button"
              className={styles.option}
              aria-pressed={support === code}
              onClick={() => setSupport(code)}
            >
              {variant === 'bar' ? (
                <>
                  <span aria-hidden="true">{t(`page.bati.lang.short.${code}`)}</span>
                  <span className="sr-only">{name}</span>
                </>
              ) : (
                name
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
