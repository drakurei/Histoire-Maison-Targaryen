import { useEffect, useState } from 'react';

import type { DragonLook } from '@/core/content/types';
import { prefersReducedMotion } from '@/core/motion/reducedMotion';
import { DragonShadow } from '@/shared/dragon';

import { hasPlayed, markPlayed } from '../state/storage';

import styles from './Ombre.module.css';

interface OmbreProps {
  /** Clé du geste dans la session, par exemple « ombre:p5 » ou « ombre:balerion ». */
  once: string;
  /** Silhouette du dragon qui passe. */
  look: DragonLook;
  from?: 'left' | 'right';
}

/**
 * L'ombre passe sur le rouge seul (spec §6, mouvement 4) : `DragonShadow` dans une couche
 * fixe en `mix-blend-mode: multiply`, invisible sur le sable, qui assombrit la fasce, le
 * profil, le pal qu'elle traverse. Une fois par page et par session ; rien en mouvement réduit.
 */
export function Ombre({ once, look, from = 'left' }: OmbreProps) {
  const [play, setPlay] = useState(false);

  useEffect(() => {
    if (prefersReducedMotion() || hasPlayed(once)) return;
    markPlayed(once);
    const timer = window.setTimeout(() => setPlay(true), 450);
    return () => window.clearTimeout(timer);
  }, [once]);

  if (!play) return null;
  return (
    <div className={styles.ombre} aria-hidden="true">
      <DragonShadow play={play} look={look} from={from} onDone={() => setPlay(false)} />
    </div>
  );
}
