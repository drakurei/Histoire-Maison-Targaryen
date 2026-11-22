import type { MouseEvent, ReactNode } from 'react';
import { Link } from 'react-router-dom';

import type { Localized } from '@/core/content/types';
import { useT, useTitle, VALYRIAN_TAG } from '@/core/i18n';
import { CrownGlyph } from '@/shared/marks/Marks';

import { entityPath, isSovereign, rememberOpener } from '../state/entities';
import { useLienHref } from '../state/links';
import { useVoir } from '../state/useVoir';
import type { EntityKind } from '../state/useVoir';

import { isModifiedClick } from './numerals';
import styles from './NomEntite.module.css';

interface NomEntiteProps {
  kind: EntityKind;
  id: string;
  /** Nom à écrire ; sinon `children`. */
  name?: Localized;
  children?: ReactNode;
  className?: string;
  /** Survol ou focus : l'appelant peut poser l'entité sur la fasce (`useFasce`, encoches). */
  onActive?: (active: boolean) => void;
}

/**
 * Le nom d'une entité (spec §4) : un vrai lien vers sa fiche (clic du milieu et Ctrl+clic
 * ouvrent la page entière), et un clic simple qui ouvre le cartel sans quitter la lecture
 * (`?voir=`, Retour le ferme). Soulignement de sang ; couronne d'or pour un souverain.
 */
export function NomEntite({ kind, id, name, children, className, onActive }: NomEntiteProps) {
  const t = useT();
  const title = useTitle();
  const href = useLienHref();
  const { open } = useVoir();
  const target = entityPath(kind, id);
  const text = name ? title(name) : null;

  const onClick = (event: MouseEvent<HTMLAnchorElement>) => {
    if (isModifiedClick(event)) return;
    event.preventDefault();
    rememberOpener(event.currentTarget);
    open({ kind, id });
  };

  return (
    <Link
      to={href(target.to, target.year)}
      className={`${styles.nom} ${className ?? ''}`}
      data-entite={kind}
      onClick={onClick}
      onPointerEnter={onActive ? () => onActive(true) : undefined}
      onPointerLeave={onActive ? () => onActive(false) : undefined}
      onFocus={onActive ? () => onActive(true) : undefined}
      onBlur={onActive ? () => onActive(false) : undefined}
    >
      {kind === 'person' && isSovereign(id) ? (
        <CrownGlyph variant="legible" className={styles.couronne} size="0.9em" title={t('label.reign')} />
      ) : null}
      {text ? <span lang={text.isHv ? VALYRIAN_TAG : undefined}>{text.primary}</span> : children}
    </Link>
  );
}
