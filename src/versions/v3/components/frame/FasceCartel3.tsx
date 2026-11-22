/*
 * Écrit à neuf pour la V3 d'après `FasceCartel` de la V2 (src/versions/v2/components/fasce/
 * FasceCartel.tsx), dont la mise en page dépend de la hauteur de la fasce V2. Ici le cartel
 * prend deux formes : en pile (deux rangées de 44 px, fasce datée sur ordinateur) ou en ligne
 * (une rangée : téléphone, fasce éteinte, portail tant que la majesté est à l'écran).
 */
import { formatSpan, Gloss, useLang, useT, useTitle } from '@/core/i18n';
import { YearNumeral } from '@/versions/v2/components/fasce/YearNumeral';
import { useAliveText, useYearInfo } from '@/versions/v2/components/fasce/useYearInfo';
import { stepYear } from '@/versions/v2/model/presence';
import { boundsOf, DATED_YEARS, periods } from '@/versions/v2/state/scene';
import { useVoir } from '@/versions/v2/state/useVoir';
import { useHoverYear, useSetYear } from '@/versions/v2/state/year';

import styles from './FasceCartel3.module.css';

interface FasceCartel3Props {
  year: number | null;
  /** Période survolée dans la rangée : sa glose et ses années remplacent le règne. */
  hoverPeriod: string | null;
  /** Fasce éteinte : l'année reste écrite, en cendre. */
  off: boolean;
  /** Une seule rangée au lieu de deux. */
  enLigne: boolean;
  onSearch: () => void;
  onIndex: () => void;
}

/**
 * Le cartel de la fasce : « ‹ », l'année en Grenze Gotisch et son ère, le règne dessous,
 * « › » ; puis Korjās (la recherche) et Registres (l'Index). Toucher l'année ouvre l'état du
 * royaume. Survoler la masse y écrit l'année et le compte des dragons sans la régler.
 */
export function FasceCartel3({ year, hoverPeriod, off, enLigne, onSearch, onIndex }: FasceCartel3Props) {
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
    <div
      className={styles.root}
      data-en-ligne={enLigne ? '' : undefined}
      data-eteinte={off ? '' : undefined}
      data-survol={hover !== null ? '' : undefined}
    >
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
