import type { MouseEvent, ReactNode } from 'react';
import { Link } from 'react-router-dom';

import { useFeu } from '../../components/Feu';
import { isModifiedClick } from '../../components/numerals';
import { useLienHref } from '../../state/links';

interface LienFeuProps {
  to: string;
  /** Année d'où part le feu sur la fasce. */
  year: number;
  className?: string;
  children: ReactNode;
}

/**
 * Lien qui entre dans un conflit depuis une autre vue (spec §6, mouvement 3) : le feu part
 * de son année sur la fasce, couvre l'écran, puis la vue arrive. Le clic du milieu et
 * Ctrl+clic gardent leur sens. L'année du lecteur est gardée.
 */
export function LienFeu({ to, year, className, children }: LienFeuProps) {
  const href = useLienHref();
  const { passer } = useFeu();
  const target = href(to);
  const onClick = (event: MouseEvent<HTMLAnchorElement>) => {
    if (isModifiedClick(event)) return;
    event.preventDefault();
    passer(target, { year });
  };
  return (
    <Link to={target} className={className} onClick={onClick}>
      {children}
    </Link>
  );
}
