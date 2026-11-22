import type { Localized } from '@/core/content/types';
import { useT, useTitle, VALYRIAN_TAG } from '@/core/i18n';
import { VLink } from '@/app/version';
import { CrownGlyph } from '@/shared/marks/Marks';

import styles from './EntityLink.module.css';

export type EntityKind = 'person' | 'dragon' | 'place' | 'event' | 'period' | 'war' | 'battle';

interface EntityLinkProps {
  kind: EntityKind;
  /** Identifiant dans nos registres. Sans lui (EntityRef sans `id`), le nom s'écrit sans lien. */
  id?: string;
  name: Localized;
  /** Personne : vrai pour un souverain (petite couronne). */
  king?: boolean;
  /** Événement : sa période, si l'identifiant ne la porte pas (« p5-… »). */
  periodId?: string;
  /** Bataille : sa guerre (la bataille est une ancre de la page de guerre). */
  warId?: string;
  className?: string;
}

const PERIOD_IN_ID = /(?:^|-)(p[1-8])-/;

/** Chemin interne d'une entité, ou `null` si on ne sait pas où elle vit. */
function pathOf(kind: EntityKind, id: string, periodId?: string, warId?: string): string | null {
  switch (kind) {
    case 'person':
      return `/personnages/${id}`;
    case 'dragon':
      return `/dragons/${id}`;
    case 'place':
      return `/lieux/${id}`;
    case 'period':
      return `/chroniques/${id}`;
    case 'war':
      return `/guerres/${id}`;
    case 'battle':
      return warId ? `/guerres/${warId}#${id}` : null;
    case 'event': {
      const period = periodId ?? PERIOD_IN_ID.exec(id)?.[1];
      return period ? `/chroniques/${period}/${id}` : null;
    }
  }
}

/**
 * EntityLink : lien vers une personne, un dragon, un lieu, une période, un événement, une
 * guerre ou une bataille. Le nom est celui de la langue lue (valyrien quand il existe en
 * mode valyrien, glose en infobulle) ; un roi porte la petite couronne d'acier aux rubis.
 */
export function EntityLink({ kind, id, name, king = false, periodId, warId, className }: EntityLinkProps) {
  const title = useTitle();
  const t = useT();
  const shown = title(name);
  const to = id ? pathOf(kind, id, periodId, warId) : null;

  const content = (
    <>
      {king ? <CrownGlyph className={styles.crown} size="0.95em" title={t('label.king')} /> : null}
      <span lang={shown.isHv ? VALYRIAN_TAG : undefined}>{shown.primary}</span>
    </>
  );

  if (!to) {
    return <span className={`${styles.entity} ${className ?? ''}`}>{content}</span>;
  }
  return (
    <VLink to={to} className={`${styles.entity} ${styles.link} ${className ?? ''}`} title={shown.gloss}>
      {content}
    </VLink>
  );
}
