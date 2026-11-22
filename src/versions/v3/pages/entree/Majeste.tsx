/*
 * La masse en majesté du portail (v3-spec §6.1). Les repères sont une copie adaptée de
 * `Reperes` de la V2 (src/versions/v2/pages/entree/Reperes.tsx) : mêmes cinq moments, mêmes
 * nombres calculés, mais posés dans le flux de la page, sur la majesté elle-même, et non dans
 * un calque fixe au-dessus de la fasce.
 */
import { useMemo, useRef } from 'react';
import type { CSSProperties, MouseEvent } from 'react';

import { formatYear, useLang, useT } from '@/core/i18n';
import { xToYear } from '@/core/timeline';
import type { TimeScale } from '@/core/timeline';
import { fasceScale, useFasceGeometry } from '@/versions/v2/components/fasce/geometry';
import { MasseSvg } from '@/versions/v2/components/fasce/MasseSvg';
import { useElementWidth } from '@/versions/v2/components/useElementWidth';
import { yearCenter, yearEdges } from '@/versions/v2/model/geometry';
import { REPERES } from '@/versions/v2/pages/entree/jalons';
import type { Repere } from '@/versions/v2/pages/entree/jalons';
import { clampToDomain, PEAK, presence } from '@/versions/v2/state/scene';
import { setHoverYear, useSetYear, useYear } from '@/versions/v2/state/year';

import { Nom } from '../../components/common/Nom';
import { useMajeste } from '../../components/common/useVue';
import styles from './Majeste.module.css';

interface MajesteProps {
  /** Hauteur de la masse, en pixels. */
  height: number;
  /** Ordinateur : les cinq repères ; téléphone : les deux qu'il garde. */
  desktop: boolean;
}

/** Hauteur du relief au-dessus du pied, pour une année. */
function reliefOf(year: number, height: number): number {
  const entry = presence.years.find((candidate) => candidate.year === year);
  const count = (entry?.attested.length ?? 0) + (entry?.doubtful.length ?? 0);
  return (count * height) / PEAK;
}

function placeOf(repere: Repere, scale: TimeScale, left: number, width: number, height: number): CSSProperties {
  if (repere.mode === 'relief') {
    const x = left + yearCenter(scale, repere.year);
    const top = height - reliefOf(repere.year, height) - 4;
    return repere.side === 'droite'
      ? { left: x - 1, top, maxWidth: width - x - 12 }
      : { right: width - x - 1, top, maxWidth: x - 12 };
  }
  const x = left + yearEdges(scale, repere.year)[1];
  return { left: x + 10, top: 6, maxWidth: width - x - 22 };
}

/**
 * La fasce elle-même, haute : même échelle, même bord gauche, même largeur que la fasce
 * fixe, pour que la masse qui se dépose tombe exactement sur elle. Survoler écrit l'année
 * dans le cartel de la fasce sans la régler ; presser la règle. Tant qu'elle est à l'écran,
 * la fasce fixe ne montre que sa rangée (jamais deux masses).
 */
export function Majeste({ height, desktop }: MajesteProps) {
  const t = useT();
  const { reading } = useLang();
  const year = useYear();
  const setYear = useSetYear();
  const geometry = useFasceGeometry();
  const root = useRef<HTMLDivElement>(null);
  const [cadre, cadreWidth] = useElementWidth<HTMLDivElement>();
  useMajeste(root);

  // Ordinateur : la masse suit la fasce au pixel. Téléphone : toute la largeur de l'écran.
  const left = desktop && geometry ? geometry.left : 0;
  const width = desktop && geometry ? geometry.width : cadreWidth;
  const scale = useMemo(() => fasceScale(Math.max(1, width)), [width]);
  const reperes = REPERES.filter((repere) => desktop || repere.phone);
  const tige = desktop ? 36 : 22;

  const yearAt = (event: MouseEvent<HTMLDivElement>): number | null => {
    const box = event.currentTarget.getBoundingClientRect();
    const x = event.clientX - box.left - left;
    if (x < 0 || x > width) return null;
    const raw = Math.floor(xToYear(scale, x));
    return clampToDomain(raw === 0 ? 1 : raw);
  };

  const notch = year !== null && width > 0 ? left + yearCenter(scale, year) : null;

  return (
    <div ref={root} className={styles.majeste} style={{ height }}>
      <div
        ref={cadre}
        className={styles.cadre}
        role="img"
        aria-label={t('v3.a.majeste')}
        onPointerMove={(event) => {
          if (event.pointerType === 'mouse') setHoverYear(yearAt(event));
        }}
        onPointerLeave={() => setHoverYear(null)}
        onClick={(event) => {
          const picked = yearAt(event);
          if (picked !== null) setYear(picked);
        }}
      >
        {width > 0 ? (
          <div className={styles.masse} style={{ left, width }}>
            <MasseSvg scale={scale} width={width} height={height} full={height} />
          </div>
        ) : null}
        {notch !== null ? <span className={styles.encoche} style={{ left: notch - 1 }} aria-hidden="true" /> : null}
      </div>
      {width > 0 ? (
        <ul role="list" className={styles.reperes} aria-label={t('v2.portal.notes')}>
          {reperes.map((repere) => (
            <li
              key={repere.id}
              className={styles.repere}
              style={placeOf(repere, scale, left, cadreWidth, height)}
              data-mode={repere.mode}
              data-cote={repere.side}
            >
              <span className={styles.texte}>
                <span className={styles.annee}>{formatYear(repere.year, reading)}</span>
                <Nom kind="event" id={repere.eventId} className={styles.lien}>
                  {t(repere.key, repere.n === undefined ? undefined : { n: repere.n })}
                </Nom>
              </span>
              {repere.mode === 'relief' ? <span className={styles.tige} style={{ height: tige }} aria-hidden="true" /> : null}
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
