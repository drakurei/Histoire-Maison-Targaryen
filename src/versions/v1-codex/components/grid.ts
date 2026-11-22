/**
 * Classes de la grille du folio (10 colonnes sur écran large, une seule sous 1024 px).
 *
 *   col.recit   colonnes 1 à 7 (défaut de tout enfant direct du folio)
 *   col.marge   colonnes 8 à 10 : notes, sources, liens de marge
 *   col.large   colonnes 1 à 9 : figure qui déborde un peu le récit
 *   col.pleine  toute la largeur : règle du temps, carte, tableau
 *   col.rangee  rangée en sous-grille : récit et marge alignés sur la même ligne
 */
import styles from './Folio.module.css';

export const col = {
  recit: styles.recit ?? '',
  marge: styles.marge ?? '',
  large: styles.large ?? '',
  pleine: styles.pleine ?? '',
  rangee: styles.rangee ?? '',
} as const;
