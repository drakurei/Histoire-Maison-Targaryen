import { useMemo } from 'react';

import { presence } from '../state/scene';

import { Carte } from './Carte';
import { Profil } from './Profil';
import { useElementWidth } from './useElementWidth';
import styles from './TempsEspace.module.css';

interface TempsEspaceProps {
  /** Durée de la vue : le segment de la fasce agrandi en bas de la colonne. */
  span: readonly [number, number] | null;
  /** Lieux de la vue (la carte se cadre sur eux). */
  placeIds: readonly string[];
  /** Lieux de l'année réglée. */
  highlightIds?: ReadonlySet<string> | null;
  /** Numéros d'ordre posés sur la carte (batailles). */
  marks?: ReadonlyMap<string, string>;
  /** Nom accessible de la carte, déjà traduit. */
  mapTitle: string;
}

/** Hauteur du profil : quinze dragons valent 45 % de la colonne (spec §2.4). */
const PROFILE_SHARE = 0.45;

/**
 * La colonne du temps et de l'espace, réservée au parti (spec §2.4) : collante, de la ligne
 * de lecture à la fasce. En bas, le profil de la durée de la vue, posé sur la fasce et soudé
 * à elle ; au-dessus, la carte cadrée sur les lieux de la vue. Si la durée n'a aucun dragon
 * (la Chute), pas de profil : la carte prend toute la colonne.
 */
export function TempsEspace({ span, placeIds, highlightIds = null, marks, mapTitle }: TempsEspaceProps) {
  const [ref, width] = useElementWidth<HTMLDivElement>();
  const hasDragons = useMemo(
    () =>
      span !== null &&
      presence.years.some((entry) => entry.year >= span[0] && entry.year <= span[1] && (entry.attested.length > 0 || entry.doubtful.length > 0)),
    [span],
  );
  // La colonne va du haut de la fenêtre à la fasce (environ 100 px sur ordinateur).
  const columnHeight = Math.max(320, window.innerHeight - 100);
  const profileHeight = Math.round(columnHeight * PROFILE_SHARE);

  return (
    <div ref={ref} className={styles.colonne}>
      <div className={styles.carte}>
        <Carte title={mapTitle} placeIds={placeIds.length > 0 ? placeIds : undefined} highlightIds={highlightIds} marks={marks} />
      </div>
      {span && hasDragons && width > 0 ? (
        <div className={styles.profil} aria-hidden="true">
          <Profil from={span[0]} to={span[1]} width={width} height={profileHeight} full={profileHeight} />
        </div>
      ) : null}
    </div>
  );
}
