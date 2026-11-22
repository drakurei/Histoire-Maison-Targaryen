import { useLayoutEffect, useMemo, useRef } from 'react';

import { getDragon } from '@/core/content/dragons';
import type { Dragon } from '@/core/content/types';
import { useT, useTitle } from '@/core/i18n';
import { DragonScale } from '@/shared/dragon';
import { dragonName } from '@/versions/v1-codex/pages/dragons/registry';
import type { Ghost } from '@/versions/v2/pages/registres/ghost';

import styles from './Echelle.module.css';

interface EchelleProps {
  dragon: Dragon;
  ghost: Ghost | null;
  /** Nom du dragon, déjà résolu. */
  name: string;
}

/**
 * L'échelle comparée de la planche (v3-spec §6.9), sur le champ : ce dragon, le fantôme du
 * dragon vu juste avant dans la session (Balerion par défaut) en contour pointillé de cendre,
 * et un homme debout, tous à la même échelle. Si les livres ne disent pas la taille, une
 * phrase le dit sous la figure.
 */
export function Echelle({ dragon, ghost, name }: EchelleProps) {
  const t = useT();
  const title = useTitle();
  const ref = useRef<HTMLDivElement>(null);
  const other = ghost ? getDragon(ghost.id) : undefined;
  const otherName = other ? title(dragonName(other)).primary : '';

  const entries = useMemo(
    () => [{ id: dragon.id, look: dragon.look, title: name }, ...(other ? [{ id: other.id, look: other.look, title: otherName }] : [])],
    [dragon, name, other, otherName],
  );

  // Le fantôme est marqué dans le dessin : la feuille de style le passe au pointillé.
  useLayoutEffect(() => {
    const node = ref.current;
    if (!node || !other) return;
    node.querySelector(`[data-dragon="${CSS.escape(other.id)}"]`)?.setAttribute('data-fantome', '');
  }, [other, entries]);

  const taille =
    dragon.id === 'balerion' ? 'page.dragon.span.standard' : dragon.look.attested.size ? 'page.dragon.span.attested' : 'page.dragon.span.estimated';

  return (
    <section className={styles.echelle} aria-labelledby={`echelle-${dragon.id}`}>
      <h2 id={`echelle-${dragon.id}`} className={styles.titre}>
        {t('v3.registres.planche.echelle')}
      </h2>
      <div ref={ref} className={styles.figure}>
        <DragonScale
          dragons={entries}
          title={t('v3.registres.planche.echelle_figure', { name })}
          humanTitle={t('page.dragons.scale.human')}
          tone="specimen"
          ground="dark"
          unattested="bare"
          gap={0.08}
        />
      </div>
      <div className={styles.legende}>
        {other && ghost ? <p>{t(ghost.previous ? 'v2.dragon.ghost' : 'v2.dragon.ghost_default', { name: otherName })}</p> : null}
        <p>{t(taille)}</p>
      </div>
    </section>
  );
}
