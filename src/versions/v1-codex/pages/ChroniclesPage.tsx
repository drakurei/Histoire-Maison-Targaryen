import { MAIN_ID } from '@/app/a11y';
import { formatYear, useLang, useT } from '@/core/i18n';

import { Figure } from '../components/Figure';
import { Folio } from '../components/Folio';
import { col } from '../components/grid';
import { Rubric } from '../components/Rubric';
import styles from './ChroniclesPage.module.css';
import { TimeRibbon } from './chronicles/TimeRibbon';
import { VolumeList } from './chronicles/VolumeList';

/** Charnière de l'échelle commune : avant elle, le temps est resserré (@/core/timeline, DEFAULT_WARP). */
const PIVOT = -114;

/**
 * Les chroniques (/chroniques) : les huit volumes posés sur un grand ruban du temps
 * (dragons vivants, volumes, règnes), puis leur table, un volume par ligne.
 */
export default function ChroniclesPage() {
  const t = useT();
  const { reading } = useLang();

  return (
    <main id={MAIN_ID}>
      <Folio>
        <Rubric as="h1" k="nav.chronicles" size="monumental" className={styles.title} />
        <p className={styles.lead} lang={reading}>
          {t('page.chronicles.lead')}
        </p>

        <Figure className={`${col.pleine} ${styles.figure}`} caption={t('page.chronicles.ribbon.caption', { pivot: formatYear(PIVOT, reading) })}>
          <TimeRibbon />
        </Figure>

        <section className={`${col.rangee} ${styles.section}`} aria-labelledby="chroniques-table">
          <Rubric as="h2" id="chroniques-table" k="page.chronicles.list.title" className={styles.sectionTitle} />
          <VolumeList detailed heading="h3" />
        </section>
      </Folio>
    </main>
  );
}
