import { useLayoutEffect, useRef, useState } from 'react';

import { fasceScale, useFasceGeometry } from '../../components/fasce/geometry';
import { Profil } from '../../components/Profil';
import { yearCenter, yearEdges } from '../../model/geometry';
import { boundsOf, DOMAIN } from '../../state/scene';

import type { Couverture } from './parcours';
import styles from './BandeParcours.module.css';

/** Bord gauche d'un élément dans la fenêtre, tenu à jour au redimensionnement. */
function useLeft<T extends HTMLElement>() {
  const ref = useRef<T>(null);
  const [left, setLeft] = useState<number | null>(null);
  useLayoutEffect(() => {
    const node = ref.current;
    if (!node) return;
    const measure = () => setLeft(node.getBoundingClientRect().left);
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(node);
    window.addEventListener('resize', measure);
    return () => {
      observer.disconnect();
      window.removeEventListener('resize', measure);
    };
  }, []);
  return [ref, left] as const;
}

interface BandeParcoursProps {
  cover: Couverture;
  /** Hauteur de quinze dragons, en pixels : celle de la masse de la fasce. */
  height: number;
  /** Année réglée : une entaille d'obsidienne la marque à travers la bande. */
  year: number | null;
  /** La rangée est survolée ou a le focus : les encoches passent en braise. */
  active?: boolean;
}

/**
 * La durée historique d'un parcours, à l'échelle exacte de la fasce et alignée au pixel sur
 * elle (spec §5.15) : pour chaque période que le parcours ouvre, son segment de la fasce (le
 * rouge y compte les dragons vivants) ; au-dessus, la durée couverte en trait ivoire et les
 * événements cités en encoches. Dessin seul : la rangée dit la même chose en texte.
 */
export function BandeParcours({ cover, height, year, active = false }: BandeParcoursProps) {
  const geometry = useFasceGeometry();
  const [ref, left] = useLeft<HTMLDivElement>();
  const ready = geometry !== null && left !== null;
  const scale = fasceScale(geometry?.width ?? 1);
  const offset = (geometry?.left ?? 0) - (left ?? 0);
  const x0 = (from: number) => offset + yearEdges(scale, from)[0];
  const x1 = (to: number) => offset + yearEdges(scale, to)[1];

  return (
    <div ref={ref} className={styles.bande} style={{ height: height + 14 }} data-actif={active ? '' : undefined} aria-hidden="true">
      {ready ? (
        <>
          <span className={styles.axe} style={{ left: offset, width: geometry.width }} />
          {cover.span ? (
            <span className={styles.duree} style={{ left: x0(cover.span[0]), width: Math.max(2, x1(cover.span[1]) - x0(cover.span[0])) }} />
          ) : null}
          {cover.years.map((value) => (
            <span key={value} className={styles.encoche} style={{ transform: `translateX(${offset + yearCenter(scale, value) - 1}px)` }} />
          ))}
          {cover.periods.map((period) => {
            const [from, to] = boundsOf(period);
            const start = x0(from);
            const width = Math.max(2, x1(to) - start);
            return (
              <span key={period.id} className={styles.segment} style={{ left: start, width, height }}>
                <Profil from={from} to={Math.min(DOMAIN[1], to + 1)} width={width} height={height} full={height} />
              </span>
            );
          })}
          {year !== null ? (
            <span className={styles.entaille} style={{ transform: `translateX(${offset + yearCenter(scale, year) - 1}px)`, height }} />
          ) : null}
        </>
      ) : null}
    </div>
  );
}
