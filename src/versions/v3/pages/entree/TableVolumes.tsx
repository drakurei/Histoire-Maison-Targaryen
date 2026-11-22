import { useMemo } from 'react';

import { formatSpan, formatYear, Gloss, useLang, useT, useTxTypo } from '@/core/i18n';
import { col } from '@/versions/v1-codex/components/grid';
import { Rubric } from '@/versions/v1-codex/components/Rubric';
import { Lien } from '@/versions/v2/components/Lien';
import { toRoman } from '@/versions/v2/components/numerals';
import { REGISTERS } from '@/versions/v2/components/registers';
import { firstSentence, peakIn } from '@/versions/v2/pages/entree/model';
import type { Peak } from '@/versions/v2/pages/entree/model';
import { boundsOf, periods, presence, VALYRIA } from '@/versions/v2/state/scene';

import { Feuillet } from '../../components/common/Feuillet';
import styles from './TableVolumes.module.css';

/** Le plus fort des dragons d'une période, en toutes lettres (même règle que les chroniques de la V2). */
export function usePeakText(): (peak: Peak) => string {
  const t = useT();
  const { reading } = useLang();
  return (peak) => {
    if (peak.uncounted && peak.count <= 1) return t('v2.chronicles.uncounted');
    if (peak.count === 0 || peak.year === null) return t('v2.chronicles.peak_none');
    const year = formatYear(peak.year, reading);
    return peak.count === 1 ? t('v2.chronicles.peak_one', { year }) : t('v2.chronicles.peak', { n: peak.count, year });
  };
}

/**
 * Sous le premier écran du portail (v3-spec §6.1), la table des volumes sur vélin, comme au
 * début d'un livre (V1) : chiffre gothique rubriqué, titre valyrien et glose, années, la
 * première phrase du résumé, le plus fort des dragons vivants ; puis les neuf registres.
 */
export function TableVolumes() {
  const t = useT();
  const tx = useTxTypo();
  const { reading } = useLang();
  const peakText = usePeakText();
  const rows = useMemo(
    () =>
      periods.map((period) => {
        const [from, to] = boundsOf(period);
        return { period, peak: peakIn(presence, from, to, VALYRIA) };
      }),
    [],
  );

  return (
    <Feuillet labelledBy="v3-table-volumes" className={styles.feuillet}>
      <Rubric as="h2" id="v3-table-volumes" k="page.chronicles.list.title" size="titre" className={col.recit} />
      <ol role="list" className={`${col.pleine} ${styles.volumes}`}>
        {rows.map(({ period, peak }) => (
          <li key={period.id} className={styles.volume}>
            <span className={styles.chiffre} aria-hidden="true">
              {toRoman(period.order)}
            </span>
            <div className={styles.corps}>
              <h3 className={styles.titre}>
                <Lien to={`/chroniques/${period.id}`} className={styles.lien}>
                  <span className="sr-only">{t('v3.a.volume', { n: period.order })}, </span>
                  <Gloss text={period.title} classes={{ main: styles.hv, tr: styles.glose }} />
                </Lien>
              </h3>
              <p className={styles.phrase} lang={reading}>
                {firstSentence(tx(period.summary))}
              </p>
            </div>
            <p className={styles.marge}>
              <span className={styles.annees}>{formatSpan(period.from, period.to, reading)}</span>
              <span className={styles.dragons} data-vide={peak.count === 0 ? '' : undefined}>
                {peakText(peak)}
              </span>
            </p>
          </li>
        ))}
      </ol>

      <nav className={`${col.pleine} ${styles.registres}`} aria-labelledby="v3-portail-registres">
        <Rubric as="h2" id="v3-portail-registres" k="v2.index.registers" size="section" />
        <ul role="list" className={styles.liste}>
          {REGISTERS.map((register) => (
            <li key={register.to}>
              <Lien to={register.to} className={styles.registre}>
                <Gloss k={register.key} classes={{ main: styles.registreNom, tr: styles.registreGlose }} />
              </Lien>
            </li>
          ))}
        </ul>
      </nav>
    </Feuillet>
  );
}
