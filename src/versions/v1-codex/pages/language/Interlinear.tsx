import { useLang, VALYRIAN_TAG } from '@/core/i18n';

import styles from './Interlinear.module.css';

export interface InterlinearWord {
  /** La forme valyrienne, telle qu'elle s'écrit dans la phrase. */
  form: string;
  /** Mot de dictionnaire et son sens (« vala, « homme » »). */
  lemma?: string;
  /** Analyse grammaticale (« nominatif collectif »). */
  grammar?: string;
  /** Ce que le mot dit dans la phrase (« tous les hommes »). */
  sense?: string;
}

interface InterlinearProps {
  words: readonly InterlinearWord[];
  /** Traduction libre de toute la phrase. */
  free?: string;
  /** `grand` : figure d'ouverture ; `courant` : exemple dans une leçon. */
  size?: 'grand' | 'courant';
  className?: string;
}

/**
 * Interlinear : une phrase valyrienne analysée comme dans une édition savante. Chaque mot
 * tient sa colonne : la forme, puis le mot de dictionnaire, l'analyse et le sens, alignés
 * sous elle ; la traduction libre ferme la figure. Sur téléphone, les colonnes passent
 * l'une sous l'autre, chaque mot gardant son analyse.
 */
export function Interlinear({ words, free, size = 'grand', className }: InterlinearProps) {
  const { reading } = useLang();
  return (
    <div className={`${styles.interlinear} ${className ?? ''}`} data-size={size}>
      <ol role="list" className={styles.words}>
        {words.map((word, index) => (
          <li key={`${word.form}-${index}`} className={styles.word}>
            <span className={styles.form} lang={VALYRIAN_TAG}>
              {word.form}
            </span>
            {word.lemma ? (
              <span className={styles.lemma} lang={reading}>
                {word.lemma}
              </span>
            ) : null}
            {word.grammar ? (
              <span className={styles.grammar} lang={reading}>
                {word.grammar}
              </span>
            ) : null}
            {word.sense ? (
              <span className={styles.sense} lang={reading}>
                {word.sense}
              </span>
            ) : null}
          </li>
        ))}
      </ol>
      {free ? (
        <p className={styles.free} lang={reading}>
          {free}
        </p>
      ) : null}
    </div>
  );
}
