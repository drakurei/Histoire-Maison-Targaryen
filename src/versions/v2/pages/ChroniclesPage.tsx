import { useMemo } from 'react';
import type { MouseEvent } from 'react';

import { formatSpan, formatYear, useLang, useT, useTitle, useTxTypo, VALYRIAN_TAG } from '@/core/i18n';

import { useFeu } from '../components/Feu';
import { isModifiedClick, toRoman } from '../components/numerals';
import { Page } from '../components/Page';
import { Titre } from '../components/Titre';
import { useLienHref } from '../state/links';
import { boundsOf, periods, presence, VALYRIA } from '../state/scene';

import { FigureChroniques } from './entree/FigureChroniques';
import { firstSentence, peakIn } from './entree/model';
import styles from './ChroniclesPage.module.css';

/**
 * Chroniques `/chroniques` (fascé, spec §5.4) : les huit périodes alignées sur l'échelle de
 * la fasce, règnes et guerres au-dessus ; puis la liste des huit périodes, une par ligne,
 * avec leur première phrase et le plus fort de leurs dragons.
 */
export default function ChroniclesPage() {
  const t = useT();
  const typo = useTxTypo();
  const title = useTitle();
  const { reading } = useLang();
  const href = useLienHref();
  const feu = useFeu();

  const rows = useMemo(
    () =>
      periods.map((period) => {
        const [from, to] = boundsOf(period);
        return { period, from, to, peak: peakIn(presence, from, to, VALYRIA) };
      }),
    [],
  );

  const open = (event: MouseEvent<HTMLAnchorElement>, to: string, year: number) => {
    if (isModifiedClick(event)) return;
    event.preventDefault();
    feu.passer(to, { year });
  };

  const peakText = (peak: (typeof rows)[number]['peak']) => {
    if (peak.uncounted && peak.count <= 1) return t('v2.chronicles.uncounted');
    if (peak.count === 0 || peak.year === null) return t('v2.chronicles.peak_none');
    const year = formatYear(peak.year, reading);
    return peak.count === 1 ? t('v2.chronicles.peak_one', { year }) : t('v2.chronicles.peak', { n: peak.count, year });
  };

  return (
    <Page partition="fasce" className={styles.page}>
      <Titre k="nav.chronicles" className={styles.titre} />

      <figure className={styles.figure} aria-labelledby="v2-chroniques-legende">
        <FigureChroniques />
        <figcaption id="v2-chroniques-legende" className={styles.legende}>
          {t('v2.chronicles.caption')}
        </figcaption>
      </figure>

      <section className={styles.liste} aria-labelledby="v2-chroniques-periodes">
        <h2 id="v2-chroniques-periodes" className={styles.intertitre}>
          {t('v2.index.periods')}
        </h2>
        <ol role="list" className={styles.periodes}>
          {rows.map(({ period, from, to, peak }) => {
            const name = title(period.title);
            const target = href(`/chroniques/${period.id}`);
            return (
              <li key={period.id} className={styles.periode}>
                <span className={styles.chiffre} aria-hidden="true">
                  {toRoman(period.order)}
                </span>
                <div className={styles.tete}>
                  <h3 className={styles.nom}>
                    <a href={target} onClick={(event) => open(event, target, from)}>
                      <span lang={name.isHv ? VALYRIAN_TAG : undefined}>{name.primary}</span>
                    </a>
                  </h3>
                  {name.gloss ? <p className={styles.glose}>{name.gloss}</p> : null}
                  <p className={styles.annees}>{formatSpan(period.from, to, reading)}</p>
                </div>
                <p className={styles.phrase}>{firstSentence(typo(period.summary))}</p>
                <p className={styles.dragons} data-vide={peak.count === 0 ? '' : undefined}>
                  {peakText(peak)}
                </p>
              </li>
            );
          })}
        </ol>
      </section>
    </Page>
  );
}
