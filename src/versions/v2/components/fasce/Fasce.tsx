import { useEffect, useLayoutEffect, useRef, useState } from 'react';

import { useT } from '@/core/i18n';
import { EASE, gsap, prefersReducedMotion } from '@/core/motion';

import { useFasceState } from '../../state/fasce';
import { hasPlayed, markPlayed } from '../../state/storage';
import { useYear } from '../../state/year';

import { FasceCartel } from './FasceCartel';
import { FasceMasse } from './FasceMasse';
import { fasceScale, publishFasceGeometry } from './geometry';
import { PeriodRow } from './PeriodRow';
import { useAliveText, useYearInfo } from './useYearInfo';
import styles from './Fasce.module.css';

interface FasceProps {
  onSearch: () => void;
  onIndex: () => void;
}

interface Size {
  width: number;
  height: number;
}

const DESKTOP = '(min-width: 1024px)';
const TABLET = '(min-width: 768px) and (max-width: 1023.98px)';
const PHONE_INSET = 16;
const LIVE_DELAY_MS = 500;

function useMedia(query: string): boolean {
  const [matches, setMatches] = useState(() => window.matchMedia(query).matches);
  useEffect(() => {
    const list = window.matchMedia(query);
    const update = () => setMatches(list.matches);
    update();
    list.addEventListener('change', update);
    return () => list.removeEventListener('change', update);
  }, [query]);
  return matches;
}

/**
 * La fasce de gueules : seul élément fixe du bâti, collée au bas de la fenêtre, de bord à
 * bord jusqu'au cartel. Elle ne se démonte jamais d'une vue à l'autre. Son épaisseur est le
 * nombre de dragons vivants, année par année ; on y règle l'année. Spec §2.1 à §2.3.
 */
export function Fasce({ onSearch, onIndex }: FasceProps) {
  const t = useT();
  const fasce = useFasceState();
  const year = useYear();
  const info = useYearInfo();
  const alive = useAliveText();
  const desktop = useMedia(DESKTOP);
  const tablet = useMedia(TABLET);
  const sizer = useRef<HTMLDivElement>(null);
  const masse = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState<Size>({ width: 0, height: 0 });
  const [hoverPeriod, setHoverPeriod] = useState<string | null>(null);
  const [announce, setAnnounce] = useState('');

  // La masse se mesure : son tracé est calculé en pixels, et sa place sert au feu et aux figures alignées.
  useLayoutEffect(() => {
    const node = sizer.current;
    if (!node) return;
    const measure = () => {
      const rect = node.getBoundingClientRect();
      setSize((current) =>
        Math.abs(current.width - rect.width) < 0.5 && Math.abs(current.height - rect.height) < 0.5
          ? current
          : { width: rect.width, height: rect.height },
      );
      publishFasceGeometry({ left: rect.left, width: rect.width, massTop: rect.top, massHeight: rect.height });
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(node);
    window.addEventListener('resize', measure);
    return () => {
      observer.disconnect();
      window.removeEventListener('resize', measure);
    };
  }, []);

  // Mouvement 1 : la masse en majesté du portail se dépose (ordinateur, une fois par session).
  const lastHeight = useRef(0);
  const wasMajesty = useRef(fasce.majesty !== null);
  useLayoutEffect(() => {
    const leaving = wasMajesty.current && fasce.majesty === null;
    const from = lastHeight.current;
    wasMajesty.current = fasce.majesty !== null;
    lastHeight.current = size.height;
    const node = masse.current;
    if (!leaving || !node || !desktop || from <= size.height || size.height <= 0) return;
    if (prefersReducedMotion() || hasPlayed('masse-deposee')) return;
    markPlayed('masse-deposee');
    const tween = gsap.fromTo(
      node,
      { scaleY: from / size.height, transformOrigin: '50% 100%' },
      { scaleY: 1, duration: 0.7, ease: EASE.expo, clearProps: 'transform' },
    );
    return () => {
      tween.kill();
    };
  }, [fasce.majesty, size.height, desktop]);

  // Après un réglage, une annonce polie, au plus toutes les 500 ms (spec §8). Rien à l'arrivée.
  const announced = useRef(year);
  useEffect(() => {
    if (announced.current === year) return;
    const timer = window.setTimeout(() => {
      announced.current = year;
      if (year === null) {
        setAnnounce(t('v2.fasce.all_time'));
        return;
      }
      const now = info(year);
      setAnnounce(t('v2.year.live', { year: now.label, count: alive(now.attested) }));
    }, LIVE_DELAY_MS);
    return () => window.clearTimeout(timer);
  }, [year, info, alive, t]);

  const scale = fasceScale(size.width);

  return (
    <section
      className={styles.root}
      aria-label={t('v2.fasce.label')}
      data-majeste={fasce.majesty !== null && desktop ? '' : undefined}
    >
      <div className={styles.zone}>
        <div className={styles.mesure} ref={sizer} aria-hidden="true" />
        <div className={styles.masse} ref={masse}>
          {size.width > 0 ? (
            <FasceMasse
              scale={scale}
              width={size.width}
              height={size.height}
              year={year}
              fasce={fasce}
              inset={desktop ? 0 : PHONE_INSET}
            />
          ) : null}
        </div>
      </div>
      {desktop || tablet ? (
        <div className={styles.rangee}>
          {size.width > 0 ? <PeriodRow scale={scale} width={size.width} onHover={setHoverPeriod} compact={!desktop} /> : null}
        </div>
      ) : null}
      <div className={styles.cartel}>
        <FasceCartel year={year} hoverPeriod={hoverPeriod} off={fasce.off} onSearch={onSearch} onIndex={onIndex} />
      </div>
      <p className="sr-only" aria-live="polite">
        {announce}
      </p>
    </section>
  );
}
