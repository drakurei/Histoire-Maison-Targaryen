import type { ReactNode } from 'react';

import { GrandNombre } from '@/versions/v2/components/GrandNombre';
import { Profil } from '@/versions/v2/components/Profil';
import { useElementWidth } from '@/versions/v2/components/useElementWidth';

import type { ColonneNombre, ColonneProfil } from './Colonne';
import { Feuillet } from './Feuillet';
import { DESKTOP, useMedia } from './useMedia';
import styles from './Parti3.module.css';

interface Parti3Props {
  /** L'en-tête du folio : `Rubric` h1, glose, années, marques, chapeau. */
  tete: ReactNode;
  /** Le reste du folio : récit, marge savante, sources, pied. */
  folio: ReactNode;
  /** La colonne du champ, colonnes 9 à 12 : `<Colonne …>`. */
  colonne: ReactNode;
  /** Au téléphone, le profil de la durée passe sous le titre (28 svh). */
  profil?: ColonneProfil | null;
  /** Au téléphone, le grand nombre évidé dans ce profil (le rouge laisse voir le champ). */
  nombre?: ColonneNombre | null;
  /** Ce qui suit le parti sur le champ, pleine largeur des colonnes 1 à 8 (les annales). */
  suite?: ReactNode;
  /** Foliotation (une période seulement). */
  volume?: number;
  leaf?: number;
  /** Identifiant du `h1` qui nomme l'article. */
  labelledBy?: string;
}

/**
 * Le parti de la V3 (v3-spec §3.1, §3.2) : le folio de vélin à gauche (colonnes 1 à 8), la
 * colonne du champ à droite (9 à 12). Sous 1024 px, une seule colonne : l'en-tête du folio,
 * le profil sur toute la largeur, la suite du folio, puis ce que portait la colonne.
 */
export function Parti3({ tete, folio, colonne, profil = null, nombre = null, suite, volume, leaf, labelledBy }: Parti3Props) {
  const desktop = useMedia(DESKTOP);

  if (desktop) {
    return (
      <article className={styles.parti} aria-labelledby={labelledBy}>
        <div className={styles.folio}>
          <Feuillet as="div" volume={volume} leaf={leaf}>
            {tete}
            {folio}
          </Feuillet>
        </div>
        <div className={styles.colonne}>{colonne}</div>
        {suite ? <div className={styles.suite}>{suite}</div> : null}
      </article>
    );
  }

  return (
    <article className={styles.parti} aria-labelledby={labelledBy}>
      <Feuillet as="div">{tete}</Feuillet>
      {profil ? <ProfilTel profil={profil} nombre={nombre} /> : null}
      <Feuillet as="div" volume={volume} leaf={leaf}>
        {folio}
      </Feuillet>
      <div className={styles.colonne}>{colonne}</div>
      {suite ? <div className={styles.suite}>{suite}</div> : null}
    </article>
  );
}

/** Le profil de la durée au téléphone : toute la largeur, 28 svh, sur le champ, le nombre évidé dedans. */
function ProfilTel({ profil, nombre }: { profil: ColonneProfil; nombre: ColonneNombre | null }) {
  const [ref, width] = useElementWidth<HTMLDivElement>();
  const height = Math.round(window.innerHeight * 0.28);
  return (
    <div ref={ref} className={styles.profilTel} style={{ height }} aria-hidden="true">
      {width > 0 ? <Profil from={profil.from} to={profil.to} span={profil.span ?? null} width={width} height={height} full={height} /> : null}
      {nombre ? <GrandNombre className={styles.nombreTel} value={nombre.value} era={nombre.era} hollow /> : null}
    </div>
  );
}
