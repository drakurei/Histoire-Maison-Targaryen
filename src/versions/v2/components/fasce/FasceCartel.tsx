import { formatSpan, Gloss, useLang, useT, useTitle } from '@/core/i18n';

import { stepYear } from '../../model/presence';
import { boundsOf, DATED_YEARS, periods } from '../../state/scene';
import { useVoir } from '../../state/useVoir';
import { useHoverYear, useSetYear } from '../../state/year';

import { useAliveText, useYearInfo } from './useYearInfo';
import { YearNumeral } from './YearNumeral';
import styles from './FasceCartel.module.css';

interface FasceCartelProps {
  year: number | null;
  /** Période survolée dans la rangée : sa glose et ses années remplacent le règne. */
  hoverPeriod: string | null;
  /** La fasce est éteinte : l'année reste écrite, en cendre. */
  off: boolean;
  onSearch: () => void;
  onIndex: () => void;
}

/**
 * Le cartel de la fasce : « ‹ », l'année en Grenze Gotisch et son ère, le règne de l'année
 * dessous, « › » ; puis « Korjās » (la recherche) et « Registres » (l'Index). Toucher
 * l'année ouvre l'état du royaume. Survoler la masse y écrit l'année et le compte des
 * dragons sans régler l'année.
 */
export function FasceCartel({ year, hoverPeriod, off, onSearch, onIndex }: FasceCartelProps) {
  const t = useT();
  const title = useTitle();
  const { reading } = useLang();
  const info = useYearInfo();
  const alive = useAliveText();
  const hover = useHoverYear();
  const setYear = useSetYear();
  const { open } = useVoir();

  const previous = stepYear(DATED_YEARS, year, -1);
  const next = stepYear(DATED_YEARS, year, 1);
  const period = hoverPeriod ? periods.find((candidate) => candidate.id === hoverPeriod) : undefined;
  const shown = hover ?? year;
  const now = shown === null ? null : info(shown);

  let sub: string | null = null;
  if (period) {
    const name = title(period.title);
    const [from, to] = boundsOf(period);
    sub = `${name.gloss ?? name.primary}, ${formatSpan(period.from === null ? null : from, to, reading)}`;
  } else if (hover !== null && now) {
    sub = alive(now.attested);
  } else if (now) {
    sub = now.reign || now.period;
  }

  return (
    <div className={styles.root} data-eteinte={off ? '' : undefined} data-survol={hover !== null ? '' : undefined}>
      <div className={styles.annee}>
        <button
          type="button"
          className={styles.cran}
          onClick={() => setYear(previous)}
          disabled={previous === null}
          aria-label={t('v2.fasce.step_previous')}
        >
          <span aria-hidden="true">‹</span>
        </button>
        <button
          type="button"
          className={styles.nombre}
          onClick={() => open({ kind: 'etat' })}
          aria-label={now ? t('v2.fasce.open_state', { year: now.label }) : t('v2.fasce.open_state_none')}
        >
          {now ? (
            <>
              <YearNumeral value={now.value} className={styles.chiffres} />
              <span className={styles.pile}>
                <span className={`${styles.ere} ere`}>{now.era}</span>
                {sub ? <span className={styles.sous}>{sub}</span> : null}
              </span>
            </>
          ) : (
            <span className={styles.pile}>
              <span className={styles.toutTemps}>{t('v2.fasce.all_time')}</span>
              {sub ? <span className={styles.sous}>{sub}</span> : null}
            </span>
          )}
        </button>
        <button
          type="button"
          className={styles.cran}
          onClick={() => setYear(next)}
          disabled={next === null}
          aria-label={t('v2.fasce.step_next')}
        >
          <span aria-hidden="true">›</span>
        </button>
      </div>
      <div className={styles.commandes}>
        <button type="button" className={styles.commande} onClick={onSearch} aria-keyshortcuts="/">
          <Gloss k="action.search" />
        </button>
        <button type="button" className={styles.commande} onClick={onIndex}>
          <Gloss k="v2.index.title" />
        </button>
      </div>
    </div>
  );
}
