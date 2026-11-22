import type { Localized } from '@/core/content/types';
import { useLang } from '@/core/i18n';

import { Lettrine } from './Lettrine';
import styles from './Prose.module.css';
import { useTxTypo } from './typo';

interface ProseProps {
  /** Texte de récit ; les paragraphes sont séparés par une ligne vide. */
  text: Localized | null | undefined;
  /** Première lettre en lettrine : `true` (rubrique) ou `'gilded'` (ouverture de volume). */
  lettrine?: boolean | 'gilded';
  /** `chapeau` : le résumé en tête de page, au corps --t1. */
  variant?: 'recit' | 'chapeau';
  className?: string;
}

const PARAGRAPH_BREAK = /\n\s*\n/;

/**
 * Prose : un texte traduit rendu en paragraphes, dans la langue lue, mesure bornée,
 * césure activée (l'attribut `lang` local la rend possible même en mode valyrien).
 */
export function Prose({ text, lettrine = false, variant = 'recit', className }: ProseProps) {
  const tx = useTxTypo();
  const { reading } = useLang();
  const paragraphs = tx(text)
    .split(PARAGRAPH_BREAK)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean);
  if (paragraphs.length === 0) return null;

  return (
    <div className={`${styles.prose} ${className ?? ''}`} lang={reading} data-variant={variant}>
      {paragraphs.map((paragraph, index) =>
        index === 0 && lettrine ? (
          <Lettrine key={index} gilded={lettrine === 'gilded'}>
            {paragraph}
          </Lettrine>
        ) : (
          <p key={index}>{paragraph}</p>
        ),
      )}
    </div>
  );
}
