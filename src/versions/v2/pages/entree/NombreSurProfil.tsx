import { useLayoutEffect, useMemo, useRef, useState } from 'react';
import type { CSSProperties } from 'react';

import { createTimeScale, yearToX } from '@/core/timeline';

import { GrandNombre } from '../../components/GrandNombre';
import { PEAK, presence } from '../../state/scene';

import { placeNumber, solidHeights } from './model';
import type { NumberBox } from './model';
import styles from './NombreSurProfil.module.css';

export interface Nombre {
  /** Le nombre déjà écrit : année sans signe, chiffre romain de la période. */
  value: string;
  era?: string;
  /** Année près de laquelle poser le nombre (l'année réglée), s'il y en a une. */
  near?: number | null;
}

interface NombreSurProfilProps extends Nombre {
  /** Le profil sur lequel le nombre est posé : même durée, même taille que lui. */
  from: number;
  to: number;
  width: number;
  /** Hauteur, en pixels, de la masse au plus fort (`PEAK` dragons). */
  full: number;
}

/**
 * Le grand nombre posé sur un profil (spec §2.4) : évidé dans l'aplat rouge là où le rouge
 * est assez haut pour le contenir, au plus près de l'année réglée ; sinon écrit en ivoire
 * au-dessus de la partie la plus basse du profil. Le nombre est d'abord mesuré hors de la
 * vue, puis posé : sa taille dépend de la police et de la langue.
 */
export function NombreSurProfil({ from, to, width, full, value, era, near = null }: NombreSurProfilProps) {
  const probe = useRef<HTMLDivElement>(null);
  const [box, setBox] = useState<(NumberBox & { font: number }) | null>(null);

  useLayoutEffect(() => {
    const node = probe.current;
    if (!node) return;
    let alive = true;
    const measure = () => {
      const figure = node.firstElementChild;
      const digits = figure?.firstElementChild;
      if (!alive || !(figure instanceof HTMLElement) || !(digits instanceof HTMLElement)) return;
      // Les chiffres suivent le corps ; le sigle d'ère garde le sien : on les mesure à part.
      const rect = figure.getBoundingClientRect();
      const digitsWidth = digits.getBoundingClientRect().width;
      const font = Number.parseFloat(window.getComputedStyle(digits).fontSize) || 0;
      setBox({ width: digitsWidth, extra: Math.max(0, rect.width - digitsWidth), height: rect.height, font });
    };
    measure();
    void document.fonts?.ready.then(measure);
    return () => {
      alive = false;
    };
  }, [value, era]);

  const scale = useMemo(() => createTimeScale({ domain: [from, to], range: [0, Math.max(1, width)] }), [from, to, width]);
  const heights = useMemo(() => solidHeights(presence, scale, width, full, PEAK), [scale, width, full]);
  const placement = useMemo(() => {
    if (!box || box.width <= 0) return null;
    const preferX = near !== null && near >= from && near <= to ? yearToX(scale, near) : null;
    return placeNumber(heights, box, { preferX, pad: Math.round(box.height * 0.08) });
  }, [box, heights, near, from, to, scale]);

  const style: CSSProperties | undefined = placement
    ? ({ left: placement.left, bottom: placement.bottom, '--t6': `${(box?.font ?? 0) * placement.scale}px` } as CSSProperties)
    : undefined;

  return (
    <div className={styles.calque} style={{ width, height: full }} aria-hidden="true">
      <div ref={probe} className={styles.sonde}>
        <GrandNombre value={value} era={era} />
      </div>
      {placement ? (
        <div className={styles.pose} style={style} data-evide={placement.hollow ? '' : undefined}>
          <GrandNombre value={value} era={era} hollow={placement.hollow} />
        </div>
      ) : null}
    </div>
  );
}
