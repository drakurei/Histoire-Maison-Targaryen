import { useLayoutEffect, useRef, useState } from 'react';
import type { CSSProperties, ReactNode } from 'react';

import { GrandNombre } from '@/versions/v2/components/GrandNombre';
import { Profil } from '@/versions/v2/components/Profil';
import { useElementWidth } from '@/versions/v2/components/useElementWidth';

import { DESKTOP, useMedia } from './useMedia';
import styles from './Colonne.module.css';

export interface ColonneNombre {
  /** Le nombre déjà écrit (année sans signe, chiffre romain). */
  value: string;
  /** Sigle d'ère, en petites capitales. */
  era?: string;
}

export interface ColonneProfil {
  from: number;
  to: number;
  /** Durée de la vue en sang, le reste du segment en cramoisi. */
  span?: readonly [number, number] | null;
}

interface ColonneProps {
  /** Nom accessible de l'`aside`. */
  label: string;
  /** La figure de la vue : la carte le plus souvent. Elle prend la place laissée par le profil. */
  figure: ReactNode;
  /** Le grand nombre de la vue, posé sous la figure : il ne couvre ni la figure ni le profil. */
  nombre?: ColonneNombre | null;
  /** Le profil soudé à la fasce ; absent sans dragon dans la durée (la Chute). */
  profil?: ColonneProfil | null;
  /** Sous la figure, avant le profil : une légende, deux commandes (bataille précédente, suivante). */
  pied?: ReactNode;
  /** Part de la pile donnée au profil (0,45 par défaut) ; moins quand la figure doit primer (carte d'une guerre). */
  profilPart?: number;
  className?: string;
}

/** Quinze dragons valent 45 % de la colonne telle qu'on la voit en arrivant. */
const PROFIL_PART = 0.45;

/**
 * Distance du haut du document au haut de la colonne, mesurée à l'arrivée, au
 * redimensionnement et quand les polices sont prêtes (méthode de la correction n° 1 de
 * l'audit V2). Bornée au tiers de la fenêtre : un long en-tête n'écrase pas la figure.
 */
function useHaut(node: HTMLElement | null): number {
  const [haut, setHaut] = useState(0);
  useLayoutEffect(() => {
    if (!node) return;
    let alive = true;
    const measure = () => {
      if (!alive) return;
      const top = Math.max(0, Math.round(Math.min(window.innerHeight / 3, node.getBoundingClientRect().top + window.scrollY)));
      setHaut((current) => (Math.abs(current - top) < 1 ? current : top));
    };
    measure();
    void document.fonts?.ready.then(measure);
    window.addEventListener('resize', measure);
    return () => {
      alive = false;
      window.removeEventListener('resize', measure);
    };
  }, [node]);
  return haut;
}

/**
 * La colonne du parti (v3-spec §3.1), sur le champ, colonnes 9 à 12 : collante, de son haut
 * d'arrivée jusqu'à la fasce, sans jamais passer sous elle. De haut en bas : la figure, le
 * grand nombre sous elle (il ne la recouvre plus : il cachait les noms de la carte), ce que
 * la vue met dessous, puis le profil soudé à la fasce.
 */
export function Colonne({ label, figure, nombre = null, profil = null, pied, profilPart = PROFIL_PART, className }: ColonneProps) {
  const aside = useRef<HTMLElement>(null);
  const [node, setNode] = useState<HTMLElement | null>(null);
  const haut = useHaut(node);
  const [mesure, largeur] = useElementWidth<HTMLDivElement>();
  const [hauteur, setHauteur] = useState(0);

  useLayoutEffect(() => {
    setNode(aside.current);
  }, []);

  // Hauteur réelle de la pile : le profil en prend `profilPart` (45 % par défaut).
  useLayoutEffect(() => {
    const pile = mesure.current;
    if (!pile) return;
    const measure = () => setHauteur(Math.round(pile.getBoundingClientRect().height));
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(pile);
    return () => observer.disconnect();
  }, [mesure]);

  const desktop = useMedia(DESKTOP);
  // Sous 1024 px, le profil passe après le titre (Parti3) : la colonne ne le porte pas.
  const profilH = profil && desktop ? Math.round(hauteur * Math.min(0.6, Math.max(0.15, profilPart))) : 0;
  const style = { '--v3-colonne-haut': `${haut}px` } as CSSProperties;

  return (
    <aside ref={aside} className={`${styles.colonne} ${className ?? ''}`} aria-label={label} style={style}>
      <div ref={mesure} className={styles.pile}>
        <div className={styles.figure}>
          <div className={styles.dessin}>{figure}</div>
          {nombre ? (
            <div className={styles.nombre}>
              <GrandNombre value={nombre.value} era={nombre.era} />
            </div>
          ) : null}
        </div>
        {pied ? <div className={styles.pied}>{pied}</div> : null}
        {profil && largeur > 0 && profilH > 0 ? (
          <div className={styles.profil} style={{ height: profilH }} aria-hidden="true">
            <Profil from={profil.from} to={profil.to} span={profil.span ?? null} width={largeur} height={profilH} full={profilH} />
          </div>
        ) : null}
      </div>
    </aside>
  );
}
