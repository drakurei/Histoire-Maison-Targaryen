import type { ComponentProps } from 'react';
import { Link } from 'react-router-dom';

import { useLienHref } from '../state/links';
import type { LinkYear } from '../state/links';

type LienProps = Omit<ComponentProps<typeof Link>, 'to'> & {
  /** Chemin interne, sans préfixe de version : « /dragons/balerion ». */
  to: string;
  /**
   * Année que porte le lien. Par défaut, celle du lecteur (`?an=` suit le lecteur). Un lien
   * vers un événement ou une bataille datés passe leur année ; `null` mène à « tout le temps ».
   */
  year?: LinkYear;
};

/** Lien interne de la version 2 : préfixe de version et année du lecteur compris (spec §2.6). */
export function Lien({ to, year = 'keep', ...rest }: LienProps) {
  const href = useLienHref();
  return <Link to={href(to, year)} {...rest} />;
}
