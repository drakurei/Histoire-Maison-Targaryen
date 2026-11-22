import { VLink } from '@/app/version';
import { periods } from '@/core/content/timeline';
import type { Localized } from '@/core/content/types';
import { formatSpan, Gloss, useLang, useT, useTxTypo } from '@/core/i18n';

import { toRoman } from '../../components/numerals';
import styles from './VolumeList.module.css';

/** Abréviations après lesquelles un point ne clôt pas la phrase (sigles d'ère, « v. » pour « vers »). */
const ABBREVIATIONS = new Set(['av', 'apr', 'C', 'v', 'c', 'St', 'BC', 'AC']);

/** Première phrase d'un résumé, sans couper après « av. C. » ni « v. ». */
export function firstSentence(text: string): string {
  const pattern = /([.?!])(\s+)/g;
  for (let match = pattern.exec(text); match; match = pattern.exec(text)) {
    const before = text.slice(0, match.index);
    const word = /([A-Za-zÀ-ÿ]+)$/.exec(before)?.[1] ?? '';
    if (match[1] === '.' && ABBREVIATIONS.has(word)) continue;
    return text.slice(0, match.index + 1);
  }
  return text;
}

interface VolumeListProps {
  /** Niveau des titres de volume dans la page. */
  heading?: 'h2' | 'h3';
  /** Ajoute le nombre d'événements et l'état du récit (page des chroniques). */
  detailed?: boolean;
}

/**
 * La table des huit volumes, comme au début d'un livre : chiffre gothique rubriqué, titre
 * valyrien et sa glose, une phrase, les années. Une ligne par volume, aucun cadre ; toute la
 * ligne mène au volume.
 */
export function VolumeList({ heading: Heading = 'h3', detailed = false }: VolumeListProps) {
  const t = useT();
  const tx = useTxTypo();
  const { reading } = useLang();

  return (
    <ol role="list" className={styles.list}>
      {periods.map((period) => {
        const sentence = firstSentence(tx(period.summary));
        return (
          <li key={period.id} className={styles.row}>
            <span className={styles.numeral} aria-hidden="true">
              {toRoman(period.order)}
            </span>
            <div className={styles.body}>
              <Heading className={styles.title}>
                <VLink to={`/chroniques/${period.id}`} className={styles.link}>
                  <span className="sr-only">{t('page.bati.volume.numbered', { n: period.order })} </span>
                  <Gloss text={period.title as Localized} classes={{ main: styles.titleMain, tr: styles.titleTr }} />
                </VLink>
              </Heading>
              <p className={styles.sentence} lang={reading}>
                {sentence}
              </p>
              {detailed ? (
                <p className={styles.meta}>
                  {t('page.chronicles.volume.events', { n: period.eventIds.length })}
                  {', '}
                  {period.essay.length > 0 ? t('page.chronicles.volume.essay', { n: period.essay.length }) : t('page.chronicles.volume.annals')}
                </p>
              ) : null}
            </div>
            <p className={styles.years}>
              <time>{formatSpan(period.from, period.to, reading)}</time>
            </p>
          </li>
        );
      })}
    </ol>
  );
}
