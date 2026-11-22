import { useMemo } from 'react';
import type { MouseEvent } from 'react';

import { formatSpan, useLang, useT, useTitle, useTxTypo, VALYRIAN_TAG } from '@/core/i18n';
import { useFeu } from '@/versions/v2/components/Feu';
import { isModifiedClick, toRoman } from '@/versions/v2/components/numerals';
import { firstSentence, peakIn } from '@/versions/v2/pages/entree/model';
import { useLienHref } from '@/versions/v2/state/links';
import { boundsOf, periods, presence, VALYRIA } from '@/versions/v2/state/scene';
import { withBase } from '@/app/paths';

import { TitreChamp } from '../components/common/TitreChamp';
import { useVue } from '../components/common/useVue';
import { Vue } from '../components/common/Vue';
import { FigureFascee } from './entree/FigureFascee';
import { usePeakText } from './entree/TableVolumes';
import styles from './ChroniclesPage.module.css';

/**
 * Chroniques (v3-spec §6.2, fascé, champ) : le titre, la figure des huit périodes alignée sur
 * la fasce (règnes, guerres, puis un dos de cuir par période contre son segment), sa légende,
 * puis la liste des périodes, une par ligne, sans carte ni filet.
 */
export default function ChroniclesPage() {
  const t = useT();
  const typo = useTxTypo();
  const title = useTitle();
  const { reading } = useLang();
  const href = useLienHref();
  const feu = useFeu();
  const peakText = usePeakText();
  useVue();

  const rows = useMemo(
    () =>
      periods.map((period) => {
        const [from, to] = boundsOf(period);
        return { period, from, peak: peakIn(presence, from, to, VALYRIA) };
      }),
    [],
  );

  const open = (event: MouseEvent<HTMLAnchorElement>, to: string, year: number) => {
    if (isModifiedClick(event)) return;
    event.preventDefault();
    feu.passer(to, { year });
  };

  return (
    <Vue partition="fasce" className={styles.vue}>
      <TitreChamp k="nav.chronicles" className={styles.titre} />

      <figure className={styles.figure} aria-labelledby="v3-chroniques-legende">
        <FigureFascee />
        <figcaption id="v3-chroniques-legende" className={styles.legende}>
          {t('v3.a.chroniques.dos')}
        </figcaption>
      </figure>

      <section className={styles.liste} aria-labelledby="v3-chroniques-periodes">
        <h2 id="v3-chroniques-periodes" className={styles.intertitre}>
          {t('v2.index.periods')}
        </h2>
        <ol role="list" className={styles.periodes}>
          {rows.map(({ period, from, peak }) => {
            const name = title(period.title);
            const target = href(`/chroniques/${period.id}`);
            return (
              <li key={period.id} className={styles.periode}>
                <span className={styles.chiffre} aria-hidden="true">
                  {toRoman(period.order)}
                </span>
                <div className={styles.tete}>
                  <h3 className={styles.nom}>
                    <a href={withBase(target)} onClick={(event) => open(event, target, from)}>
                      <span className="sr-only">{t('v3.a.volume', { n: period.order })}, </span>
                      <span lang={name.isHv ? VALYRIAN_TAG : undefined}>{name.primary}</span>
                    </a>
                  </h3>
                  {name.gloss ? <p className={styles.glose}>{name.gloss}</p> : null}
                  <p className={styles.annees}>{formatSpan(period.from, period.to, reading)}</p>
                </div>
                <p className={styles.phrase}>{firstSentence(typo(period.summary))}</p>
                <p className={styles.dragons} data-vide={peak.count === 0 ? '' : undefined}>
                  <span>{peakText(peak)}</span>
                  <span className={styles.compte}>{t('v3.a.evenements', { n: period.eventIds.length })}</span>
                </p>
              </li>
            );
          })}
        </ol>
      </section>
    </Vue>
  );
}
