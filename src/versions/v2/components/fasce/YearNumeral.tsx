import { useState } from 'react';

import styles from './YearNumeral.module.css';

interface YearNumeralProps {
  /** Le nombre, sans signe (l'ère est écrite à part). */
  value: string;
  className?: string;
}

/**
 * Le nombre de l'année en Grenze Gotisch. Seuls les chiffres qui changent roulent, dans un
 * masque, de bas en haut quand l'année avance et de haut en bas quand elle recule (240 ms,
 * `expo.out`). Rien ne roule au premier affichage. Mouvement réduit : le chiffre change,
 * rien ne roule (socle commun).
 */
export function YearNumeral({ value, className }: YearNumeralProps) {
  // Information tirée du rendu précédent : motif « stocker la valeur précédente » de React.
  const [previous, setPrevious] = useState(value);
  const [direction, setDirection] = useState<'up' | 'down'>('up');
  const [moved, setMoved] = useState(false);
  if (previous !== value) {
    setPrevious(value);
    setDirection(Number(value) >= Number(previous) ? 'up' : 'down');
    setMoved(true);
  }
  // Clés comptées depuis la droite : un nombre qui gagne un chiffre ne fait pas rouler les autres.
  const digits = value.split('');
  return (
    <span
      className={`${styles.numeral} ${className ?? ''}`}
      data-sens={direction}
      data-immobile={moved ? undefined : ''}
    >
      {digits.map((digit, index) => (
        <span key={`${digits.length - index}-${digit}`} className={styles.cell}>
          <span className={styles.digit}>{digit}</span>
        </span>
      ))}
    </span>
  );
}
