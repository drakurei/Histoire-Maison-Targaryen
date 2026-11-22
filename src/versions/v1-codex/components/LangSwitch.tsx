import { LANGS, useLang, useT } from '@/core/i18n';

import styles from './LangSwitch.module.css';

interface LangSwitchProps {
  /** `bar` : trois sigles dans la barre haute ; `drawer` : noms entiers, en grand, dans le tiroir de l'étagère. */
  variant?: 'bar' | 'drawer';
}

/** LangSwitch : langue d'affichage (haut valyrien, français, anglais), trois boutons texte, l'actif souligné à la braise. */
export function LangSwitch({ variant = 'bar' }: LangSwitchProps) {
  const t = useT();
  const { lang, setLang } = useLang();

  return (
    <div className={styles.switch} data-variant={variant} role="group" aria-label={t('a11y.languageSwitch')}>
      {LANGS.map((code) => {
        const name = t(`lang.${code}`);
        return (
          <button
            key={code}
            type="button"
            className={styles.option}
            aria-pressed={lang === code}
            onClick={() => setLang(code)}
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
  );
}
