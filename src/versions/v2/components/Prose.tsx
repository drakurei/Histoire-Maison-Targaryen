import type { Localized } from '@/core/content/types';
import { useTxTypo } from '@/core/i18n';

import styles from './Prose.module.css';

interface ProseProps {
  /** Texte de récit ; les paragraphes sont séparés par une ligne vide. */
  text: Localized | null | undefined;
  /** `chapeau` : le résumé en tête de vue, au corps `--t1`. */
  variant?: 'recit' | 'chapeau';
  className?: string;
}

/** Les paragraphes d'un texte, tels que le contenu les sépare (ligne vide). */
export function paragraphsOf(text: string): string[] {
  return text
    .split(/\n\s*\n/)
    .map((part) => part.trim())
    .filter(Boolean);
}

/**
 * Le récit (spec §3.2) : Alegreya, ivoire sur sable, 64 caractères par ligne, interlignage
 * 1.68, chiffres elzéviriens, césure, et la typographie fine du cœur (`useTxTypo`).
 */
export function Prose({ text, variant = 'recit', className }: ProseProps) {
  const tx = useTxTypo();
  const body = tx(text);
  if (!body) return null;
  return (
    <div className={`${styles.prose} ${className ?? ''}`} data-variante={variant}>
      {paragraphsOf(body).map((paragraph, index) => (
        <p key={index}>{paragraph}</p>
      ))}
    </div>
  );
}
