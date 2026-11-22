import { MAIN_ID } from '@/app/a11y';
import { VLink } from '@/app/version';
import { getPeriod } from '@/core/content/timeline';
import { wars } from '@/core/content/wars';
import { formatSpan, useLang, useT, useTitle, VALYRIAN_TAG } from '@/core/i18n';

import { Figure } from '../components/Figure';
import { Folio } from '../components/Folio';
import { col } from '../components/grid';
import { toRoman } from '../components/numerals';
import { ReliabilityMark } from '../components/ReliabilityMark';
import { Rubric } from '../components/Rubric';
import styles from './WarsPage.module.css';
import { WarChart } from './wars/WarChart';
import { inSentence, openingSentence } from './wars/warModel';
import { useTxTypo } from '../components/typo';

const CHART_FROM = -6;
const CHART_TO = 302;

/**
 * Les guerres (/guerres) : l'ordre des conflits sur la règle du temps, puis un conflit par
 * ligne, à la manière d'annales : années en marge, titre, phrase d'ouverture, camps.
 */
export default function WarsPage() {
  const t = useT();
  const tx = useTxTypo();
  const title = useTitle();
  const { reading } = useLang();

  return (
    <main id={MAIN_ID}>
      <Folio>
        <header className={`${col.pleine} ${styles.head}`}>
          <Rubric as="h1" k="nav.wars" size="monumental" />
          <p className={styles.lead}>{t('page.wars.lead', { n: wars.length })}</p>
        </header>

        <Figure className={`${col.pleine} ${styles.chartFigure}`} caption={t('page.wars.chart.caption')}>
          <WarChart wars={wars} from={CHART_FROM} to={CHART_TO} />
        </Figure>

        <ol className={`${col.pleine} ${styles.list}`} role="list">
          {wars.map((war) => {
            const name = title(war.title);
            const period = getPeriod(war.periodId);
            const sides = war.belligerents.slice(0, 2);
            return (
              <li key={war.id} className={styles.war}>
                <p className={styles.years}>
                  <span>{formatSpan(war.from, war.to, reading)}</span>
                  {period ? (
                    <VLink to={`/chroniques/${period.id}`} className={styles.volume} title={tx(period.title)}>
                      {t('page.wars.volume', { n: toRoman(period.order) })}
                    </VLink>
                  ) : null}
                </p>
                <div className={styles.body}>
                  <h2 className={styles.title}>
                    <VLink to={`/guerres/${war.id}`} className={styles.titleLink} lang={name.isHv ? VALYRIAN_TAG : undefined}>
                      {name.primary}
                    </VLink>
                    {name.gloss ? <span className={styles.gloss}>{name.gloss}</span> : null}
                  </h2>
                  <p className={styles.summary}>{openingSentence(tx(war.summary))}</p>
                  <p className={styles.facts}>
                    <span>
                      {sides.length === 2
                        ? t('page.wars.sides', { a: tx(sides[0]?.name), b: inSentence(tx(sides[1]?.name)) })
                        : tx(sides[0]?.name)}
                      {war.belligerents.length > 2 ? ` ${t('page.wars.moreSides', { n: war.belligerents.length - 2 })}` : ''}
                    </span>
                    <span>{t(war.battles.length > 1 ? 'page.wars.battles' : 'page.wars.battle', { n: war.battles.length })}</span>
                    <ReliabilityMark level={war.reliability} />
                  </p>
                </div>
              </li>
            );
          })}
        </ol>
      </Folio>
    </main>
  );
}
