import type { LexiconEntry } from '@/core/content/types';
import { useT, useTx, useTxTypo, VALYRIAN_TAG } from '@/core/i18n';

import { Refs } from './Refs';
import { Statut } from './Statut';
import styles from './Specimen.module.css';

interface SpecimenProps {
  entry: LexiconEntry;
  /** `grand` : la colonne collante de l'ordinateur ; `deplie` : sous la rangée, au téléphone. */
  taille: 'grand' | 'deplie';
  id?: string;
}

/**
 * Le spécimen d'un mot (spec §5.13) : la forme en grand, sa glose, son statut et ce qu'il
 * veut dire, sa nature grammaticale, la note du linguiste, ses références.
 */
export function Specimen({ entry, taille, id }: SpecimenProps) {
  const t = useT();
  const tx = useTx();
  const typo = useTxTypo();
  return (
    <article id={id} className={styles.specimen} data-taille={taille} aria-labelledby={id ? `${id}-forme` : undefined}>
      <p id={id ? `${id}-forme` : undefined} className={styles.forme} lang={VALYRIAN_TAG}>
        {entry.hv}
      </p>
      <p className={styles.sens}>{tx({ fr: entry.fr, en: entry.en })}</p>
      <div className={styles.statut}>
        <Statut status={entry.status} />
        <span className={styles.theme}>{t(`v2.lexicon.theme.${entry.theme}`)}</span>
      </div>
      <dl className={styles.notice}>
        {entry.grammar ? (
          <div className={styles.rubrique}>
            <dt>{t('page.lexicon.entry.grammar')}</dt>
            <dd>{typo(entry.grammar)}</dd>
          </div>
        ) : null}
        <div className={styles.rubrique}>
          <dt>{t('page.lexicon.entry.note')}</dt>
          <dd className={styles.note}>{typo(entry.notes)}</dd>
        </div>
      </dl>
      {entry.verified ? null : <p className={styles.averti}>{t('page.lexicon.entry.unverified')}</p>}
      <Refs refs={entry.refs} className={styles.refs} />
    </article>
  );
}
