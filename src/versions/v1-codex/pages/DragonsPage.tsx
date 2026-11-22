import { useMemo } from 'react';

import { MAIN_ID } from '@/app/a11y';
import { VLink } from '@/app/version';
import { dragons } from '@/core/content/dragons';
import { events, periods } from '@/core/content/timeline';
import { formatSpan, Gloss, useLang, useT } from '@/core/i18n';

import { Figure } from '../components/Figure';
import { Folio } from '../components/Folio';
import { col } from '../components/grid';
import { toRoman } from '../components/numerals';
import { Rubric } from '../components/Rubric';
import styles from './DragonsPage.module.css';
import { DragonRow } from './dragons/DragonRow';
import { dragonEpochs } from './dragons/registry';
import { ScaleStrip } from './dragons/ScaleStrip';

/**
 * Registre des dragons (/dragons). En tête, l'échelle comparée de tous les dragons, du plus
 * grand au plus petit ; puis le registre, époque par époque, comme un catalogue de cabinet :
 * gravure, nom, années, cavaliers, sort.
 */
export default function DragonsPage() {
  const t = useT();
  const { reading } = useLang();
  const epochs = useMemo(() => dragonEpochs(dragons, periods, events), []);

  return (
    <main id={MAIN_ID}>
      <Folio>
        <header className={`${col.pleine} ${styles.head}`}>
          <Rubric as="h1" k="nav.dragons" size="monumental" className={styles.title} />
          <p className={styles.lead}>{t('page.dragons.lead', { n: dragons.length })}</p>
        </header>

        <Figure className={`${col.pleine} ${styles.scaleFigure}`} caption={t('page.dragons.scale.caption')}>
          <ScaleStrip dragons={dragons} />
        </Figure>

        <p className={`${col.recit} ${styles.order}`}>{t('page.dragons.order')}</p>

        {epochs.map((epoch) => (
          <section key={epoch.period.id} className={`${col.pleine} ${styles.epoch}`} aria-labelledby={`epoque-${epoch.period.id}`}>
            <header className={styles.epochHead}>
              <span className={styles.numeral} aria-hidden="true">
                {toRoman(epoch.period.order)}
              </span>
              <div>
                <Rubric as="h2" id={`epoque-${epoch.period.id}`} className={styles.epochTitle}>
                  <VLink to={`/chroniques/${epoch.period.id}`} className={styles.epochLink}>
                    <Gloss text={epoch.period.title} />
                  </VLink>
                </Rubric>
                <p className={styles.epochYears}>
                  {formatSpan(epoch.period.from, epoch.period.to, reading)}
                  <span className={styles.count}>{t(epoch.dragons.length > 1 ? 'page.dragons.epoch.count' : 'page.dragons.epoch.one', { n: epoch.dragons.length })}</span>
                </p>
              </div>
            </header>
            <ol className={styles.rows} role="list">
              {epoch.dragons.map((dragon) => (
                <DragonRow key={dragon.id} dragon={dragon} />
              ))}
            </ol>
          </section>
        ))}
      </Folio>
    </main>
  );
}
