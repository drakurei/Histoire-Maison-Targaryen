import { useMemo, useRef } from 'react';
import type { CSSProperties } from 'react';
import { createPortal } from 'react-dom';

import { formatYear, useLang, useT } from '@/core/i18n';
import { EASE, gsap, useGSAP } from '@/core/motion';
import { createTimeScale } from '@/core/timeline';
import type { TimeScale } from '@/core/timeline';

import { fasceScale, useFasceGeometry } from '../../components/fasce/geometry';
import { NomEntite } from '../../components/NomEntite';
import { yearCenter, yearEdges } from '../../model/geometry';
import { DOMAIN, PEAK, presence } from '../../state/scene';

import { REPERES } from './jalons';
import type { Repere } from './jalons';
import styles from './Reperes.module.css';

/** Où sont la masse et son échelle, dans le repère du calque qui porte les repères. */
interface Masse {
  scale: TimeScale;
  /** Abscisse de l'origine de l'échelle dans le calque. */
  left: number;
  top: number;
  height: number;
  /** Largeur du calque : les textes ne la dépassent pas. */
  width: number;
  /** Étendue de l'échelle (largeur de la masse). */
  span: number;
}

/** Hauteur de la masse (aplat et hachure) au-dessus de son pied, pour une année. */
function reliefOf(masse: Masse, year: number): number {
  const entry = presence.years.find((candidate) => candidate.year === year);
  const count = (entry?.attested.length ?? 0) + (entry?.doubtful.length ?? 0);
  return (count * masse.height) / PEAK;
}

interface Place {
  style: CSSProperties;
  /** Abscisse de l'ancre dans le calque (pour le rideau de l'ouverture). */
  x: number;
  tige: number;
}

function placeOf(repere: Repere, masse: Masse, tige: number): Place {
  const bottom = masse.top + masse.height;
  if (repere.mode === 'relief') {
    const x = masse.left + yearCenter(masse.scale, repere.year);
    const top = bottom - reliefOf(masse, repere.year) - 4;
    const style: CSSProperties =
      repere.side === 'droite'
        ? { left: x - 1, top, maxWidth: masse.width - x - 12 }
        : { right: masse.width - x - 1, top, maxWidth: x - 12 };
    return { style, x, tige };
  }
  // Contre le mur de Valyria ou le flanc du sommet : au haut de la masse, sans tige.
  const x = masse.left + yearEdges(masse.scale, repere.year)[1];
  return { style: { left: x + 10, top: masse.top + 6, maxWidth: masse.width - x - 22 }, x, tige: 0 };
}

interface MarqueProps {
  repere: Repere;
  place: Place;
}

/** Un repère : l'année, le texte lié à l'événement, et la tige qui le pose sur le relief. */
function Marque({ repere, place }: MarqueProps) {
  const t = useT();
  const { reading } = useLang();
  return (
    <div className={styles.repere} style={place.style} data-mode={repere.mode} data-cote={repere.side} data-repere={repere.id}>
      <span className={styles.texte}>
        <span className={styles.annee}>{formatYear(repere.year, reading)}</span>
        <NomEntite kind="event" id={repere.eventId} className={styles.lien}>
          {t(repere.key, repere.n === undefined ? undefined : { n: repere.n })}
        </NomEntite>
      </span>
      {place.tige > 0 ? <span className={styles.tige} style={{ height: place.tige }} aria-hidden="true" /> : null}
    </div>
  );
}

export type Ouverture = 'attente' | 'jeu' | 'fini';

interface ReperesOrdiProps {
  ouverture: Ouverture;
  onFin: () => void;
}

/**
 * Ordinateur : les repères posés sur la masse en majesté de la fasce fixe, dans un calque
 * fixe au-dessus d'elle (le calque ne prend aucun geste, seuls les liens en prennent).
 *
 * L'ouverture (une fois par session, après le seuil) : un rideau d'obsidienne couvre la
 * masse et se retire de gauche à droite, des légendes de Valyria jusqu'à l'an 300 ; chaque
 * repère s'inscrit quand le rideau le découvre. L'histoire se montre dans l'ordre du temps.
 */
export function ReperesOrdi({ ouverture, onFin }: ReperesOrdiProps) {
  const t = useT();
  const geometry = useFasceGeometry();
  const calque = useRef<HTMLDivElement>(null);
  const rideau = useRef<HTMLDivElement>(null);

  const masse = useMemo<Masse | null>(() => {
    if (!geometry || geometry.width <= 0) return null;
    return {
      scale: fasceScale(geometry.width),
      left: geometry.left,
      top: geometry.massTop,
      height: geometry.massHeight,
      width: window.innerWidth,
      span: geometry.width,
    };
  }, [geometry]);

  const places = useMemo(() => (masse ? REPERES.map((repere) => ({ repere, place: placeOf(repere, masse, 36) })) : []), [masse]);

  useGSAP(
    () => {
      if (ouverture !== 'jeu' || !masse || !rideau.current || !calque.current) return;
      const marks = places.map(({ repere, place }) => ({
        node: calque.current?.querySelector<HTMLElement>(`[data-repere="${repere.id}"]`) ?? null,
        at: (place.x - masse.left) / masse.span,
        shown: false,
      }));
      const show = (node: HTMLElement) => {
        const texte = node.firstElementChild;
        const tige = node.querySelector<HTMLElement>(`.${styles.tige}`);
        if (tige) gsap.fromTo(tige, { scaleY: 0 }, { scaleY: 1, duration: 0.28, ease: EASE.expo, transformOrigin: '50% 100%' });
        if (texte) {
          gsap.fromTo(
            texte,
            { clipPath: 'inset(-0.4em 100% -0.4em 0)' },
            { clipPath: 'inset(-0.4em 0% -0.4em 0)', duration: 0.5, delay: 0.12, ease: EASE.expo },
          );
        }
        gsap.set(node, { visibility: 'visible' });
      };
      const tween = gsap.fromTo(
        rideau.current,
        { scaleX: 1 },
        {
          scaleX: 0,
          duration: 3.2,
          delay: 0.35,
          ease: EASE.power4,
          transformOrigin: '100% 50%',
          onUpdate() {
            const reached = 1 - Number(gsap.getProperty(rideau.current, 'scaleX'));
            for (const mark of marks) {
              if (!mark.shown && mark.node && mark.at <= reached) {
                mark.shown = true;
                show(mark.node);
              }
            }
          },
          onComplete: onFin,
        },
      );
      return () => tween.kill();
    },
    { dependencies: [ouverture, masse], scope: calque },
  );

  if (!masse) return null;

  return createPortal(
    <div ref={calque} className={`v2 ${styles.calque}`} data-ouverture={ouverture} aria-label={t('v2.portal.notes')} role="group">
      {ouverture !== 'fini' ? (
        <div
          ref={rideau}
          className={styles.rideau}
          style={{ left: masse.left, top: masse.top - 14, width: masse.span, height: masse.height + 14 }}
          aria-hidden="true"
        />
      ) : null}
      {places.map(({ repere, place }) => (
        <Marque key={repere.id} repere={repere} place={place} />
      ))}
    </div>,
    document.body,
  );
}

interface ReperesTelProps {
  width: number;
  height: number;
}

/** Téléphone : deux repères seulement (la Danse et 153), posés sur la masse dans le flux. */
export function ReperesTel({ width, height }: ReperesTelProps) {
  const masse = useMemo<Masse>(
    () => ({ scale: createTimeScale({ domain: DOMAIN, range: [0, width] }), left: 0, top: 0, height, width, span: width }),
    [width, height],
  );
  return (
    <div className={styles.tel}>
      {REPERES.filter((repere) => repere.phone).map((repere) => (
        <Marque key={repere.id} repere={repere} place={placeOf(repere, masse, 22)} />
      ))}
    </div>
  );
}
