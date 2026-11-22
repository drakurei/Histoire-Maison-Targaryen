import { useMemo } from 'react';
import type { ReactNode } from 'react';

import { useLang, yearParts } from '@/core/i18n';

import { GrandNombre } from '../../components/GrandNombre';
import { Profil } from '../../components/Profil';
import { useElementWidth } from '../../components/useElementWidth';
import { nextYear } from '../../model/geometry';
import { presenceAt } from '../../model/presence';
import { PEAK, presence } from '../../state/scene';

import { usePhone } from './media';
import styles from './Colonne.module.css';

interface ColonneProps {
  /** Durée de la vue : le segment de la fasce agrandi, soudé à elle, en bas de la colonne. */
  span: readonly [number, number] | null;
  /** Ce qui se tient au-dessus de la carte (la vie agrandie d'un dragon). */
  haut?: ReactNode;
  /** La carte. */
  carte: ReactNode;
  /** Commandes sous la carte (rejouer une guerre). */
  commandes?: ReactNode;
  /** Le grand nombre de la vue, posé sur le profil (une année). */
  annee?: number | null;
  /** Part de la colonne que vaut le profil quand quinze dragons volent. */
  part?: number;
}

/** Corps du grand nombre (`--t6`), en pixels, pour une largeur de fenêtre. */
function numeralSize(viewport: number): number {
  return Math.min(240, Math.max(64, 16 + 0.13 * viewport));
}

/**
 * La colonne du temps et de l'espace des registres (spec §2.4), sur le modèle de
 * `TempsEspace` : collante, de la ligne de lecture à la fasce ; la carte, puis le profil de
 * la durée de la vue soudé à la fasce. Elle ajoute ce que `TempsEspace` ne prend pas : une
 * figure au-dessus de la carte, des commandes dessous, une carte recadrable, et le grand
 * nombre évidé dans le profil quand le rouge est assez haut, en ivoire au-dessus sinon.
 */
export function Colonne({ span, haut, carte, commandes, annee = null, part = 0.4 }: ColonneProps) {
  const { reading } = useLang();
  const phone = usePhone();
  const [ref, width] = useElementWidth<HTMLDivElement>();
  const hasDragons = useMemo(
    () =>
      span !== null &&
      presence.years.some((entry) => entry.year >= span[0] && entry.year <= span[1] && (entry.attested.length > 0 || entry.doubtful.length > 0)),
    [span],
  );
  const columnHeight = Math.max(320, window.innerHeight - 100);
  // Au téléphone, la colonne est dans le flux : le profil n'y est qu'un rappel de la durée.
  const profileHeight = phone ? 96 : Math.round(columnHeight * part);
  const parts = annee !== null ? yearParts(annee, reading) : null;

  let hollow = false;
  let numberLeft = 0;
  if (span && hasDragons && parts && annee !== null && width > 0) {
    const length = Math.max(1, nextYear(span[1]) - span[0]);
    const font = numeralSize(window.innerWidth);
    // Largeur approchée du nombre en Grenze (chiffres tabulaires) et de son ère.
    const numberWidth = parts.value.length * font * 0.5 + font * 0.32;
    const share = Math.min(1, Math.max(0, (annee - span[0]) / length));
    const fits = (left: number) => {
      // Évidé seulement si le rouge est plus haut que le nombre sur toute sa largeur.
      const first = span[0] + Math.floor((left / width) * length);
      const last = span[0] + Math.min(length - 1, Math.floor(((left + numberWidth) / width) * length));
      let lowest = Infinity;
      for (let y = first; y <= last; y += 1) {
        if (y === 0) continue;
        lowest = Math.min(lowest, presenceAt(presence, y)?.attested.length ?? 0);
      }
      return lowest !== Infinity && (lowest / PEAK) * profileHeight >= font * 0.74;
    };
    // Au plus près de l'année, en glissant vers le début de la durée s'il le faut.
    const preferred = Math.max(0, Math.min(width - numberWidth, width * share - font * 0.1));
    for (let left = preferred; left >= 0; left -= 8) {
      if (fits(left)) {
        hollow = true;
        numberLeft = left;
        break;
      }
    }
  }

  // Le nombre écrit au-dessus du profil prend sa place dans la colonne : le profil cède d'autant.
  const drawnHeight = parts && !hollow && !phone ? Math.max(60, profileHeight - Math.round(numeralSize(window.innerWidth) * 0.85)) : profileHeight;

  return (
    <div ref={ref} className={styles.colonne}>
      {haut ? <div className={styles.haut}>{haut}</div> : null}
      <div className={styles.carte}>{carte}</div>
      {commandes ? <div className={styles.commandes}>{commandes}</div> : null}
      {parts && !hollow ? <GrandNombre value={parts.value} era={parts.era} className={styles.nombreSeul} /> : null}
      {span && hasDragons && width > 0 ? (
        <div className={styles.profil}>
          <div aria-hidden="true">
            <Profil from={span[0]} to={nextYear(span[1])} width={width} height={drawnHeight} full={drawnHeight} />
          </div>
          {parts && hollow ? (
            <div className={styles.nombre} style={{ left: numberLeft }}>
              <GrandNombre value={parts.value} era={parts.era} hollow />
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
