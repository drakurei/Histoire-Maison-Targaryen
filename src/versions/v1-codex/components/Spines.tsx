import type { CSSProperties } from 'react';

import { VLink } from '@/app/version';
import { formatSpan, useLang, useT, useTitle, VALYRIAN_TAG } from '@/core/i18n';

import { toRoman } from './numerals';
import styles from './Spines.module.css';
import { periods, useOpenVolume } from './volumes';

/**
 * Spines : les huit dos de volumes debout au bord gauche (écran large). Chiffre gothique,
 * titre valyrien vertical, années ; le volume ouvert se lève du rang et passe au rouge.
 * Survol ou focus : une étiquette de vélin donne la glose et les années à droite du rayon.
 */
export function Spines() {
  const t = useT();
  const title = useTitle();
  const { reading } = useLang();
  const open = useOpenVolume();

  return (
    <nav className={styles.spines} aria-label={t('page.bati.spines.label')} data-spines="">
      <ol role="list" className={styles.row}>
        {periods.map((period) => {
          const isOpen = open?.id === period.id;
          const name = title(period.title);
          const years = formatSpan(period.from, period.to, reading);
          const leather = {
            '--cuir': `var(--v1-cuir-${period.order})`,
            '--apres': periods.length - period.order,
          } as CSSProperties;
          return (
            <li key={period.id} className={styles.item} style={leather}>
              <VLink
                to={`/chroniques/${period.id}`}
                className={styles.spine}
                aria-current={isOpen ? 'page' : undefined}
                data-open={isOpen || undefined}
              >
                <span className={styles.numeral} aria-hidden="true">
                  {toRoman(period.order)}
                </span>
                <span className="sr-only">{t('page.bati.volume.numbered', { n: period.order })}</span>
                <span className={styles.nerf} aria-hidden="true" />
                <span className={styles.title} lang={name.isHv ? VALYRIAN_TAG : undefined}>
                  {name.primary}
                </span>
                <span className={styles.nerf} aria-hidden="true" />
                <span className={styles.years} aria-hidden="true">
                  {years}
                </span>
                <span className={styles.slip}>
                  {name.gloss ? (
                    <span className={styles.slipTitle}>{name.gloss}</span>
                  ) : (
                    <span className={styles.slipTitle} aria-hidden="true">
                      {name.primary}
                    </span>
                  )}
                  <span className={styles.slipYears}>{years}</span>
                </span>
              </VLink>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
