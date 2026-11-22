import { useEffect, useLayoutEffect, useRef, useState } from 'react';

import { useT } from '@/core/i18n';
import { EASE, gsap, prefersReducedMotion } from '@/core/motion';
import { FasceMasse } from '@/versions/v2/components/fasce/FasceMasse';
import { fasceScale, publishFasceGeometry } from '@/versions/v2/components/fasce/geometry';
import { PeriodRow } from '@/versions/v2/components/fasce/PeriodRow';
import { useAliveText, useYearInfo } from '@/versions/v2/components/fasce/useYearInfo';
import { useFasceState } from '@/versions/v2/state/fasce';
import { hasPlayed, markPlayed } from '@/versions/v2/state/storage';
import { useYear } from '@/versions/v2/state/year';

import { DESKTOP, TABLET, useMedia } from '../common/useMedia';
import { usePortail } from '../common/useVue';

import { FasceCartel3 } from './FasceCartel3';
import styles from './Fasce3.module.css';

interface Fasce3Props {
  onSearch: () => void;
  onIndex: () => void;
}

interface Size {
  width: number;
  height: number;
}

export type EtatAffiche = 'datee' | 'eteinte' | 'portail';

const PHONE_INSET = 16;
const LIVE_DELAY_MS = 500;

/** L'état que montre la fasce : la majesté du portail l'emporte, puis la fasce éteinte. */
export function useEtatFasce(): EtatAffiche {
  const fasce = useFasceState();
  const portail = usePortail();
  if (portail.visible) return 'portail';
  return fasce.off ? 'eteinte' : 'datee';
}

/**
 * La fasce de gueules de la V3 (v3-spec §3.1, §3.2), bâtie sur les pièces de la V2 : fixe au
 * bas de la fenêtre, de bord à bord jusqu'à son cartel, jamais démontée d'une vue à l'autre.
 * Trois états : datée (masse, ciel, rangée des périodes) ; éteinte (un fil de cramoisi de
 * 3 px et la rangée, qui reste une navigation) ; au portail, la rangée seule tant que la
 * masse en majesté de la page est à l'écran, puis la masse fixe en fondu.
 */
export function Fasce3({ onSearch, onIndex }: Fasce3Props) {
  const t = useT();
  const fasce = useFasceState();
  const portail = usePortail();
  const etat = useEtatFasce();
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

  // La masse se mesure : son tracé est en pixels, et sa place sert au feu et aux figures alignées.
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

  // Mouvement 2 : au premier départ du portail (ordinateur), la majesté s'écrase jusqu'à la fasce.
  const majesteVue = useRef({ visible: false, hauteur: 0 });
  useLayoutEffect(() => {
    const before = majesteVue.current;
    majesteVue.current = { visible: portail.visible, hauteur: portail.hauteur };
    const leaving = before.visible && !portail.actif;
    const node = masse.current;
    if (!leaving || !node || !desktop || size.height <= 0 || before.hauteur <= size.height) return;
    if (prefersReducedMotion() || hasPlayed('v3-masse-deposee')) return;
    markPlayed('v3-masse-deposee');
    const tween = gsap.fromTo(
      node,
      { scaleY: before.hauteur / size.height, transformOrigin: '50% 100%' },
      { scaleY: 1, duration: 0.7, ease: EASE.expo, clearProps: 'transform' },
    );
    return () => {
      tween.kill();
    };
  }, [portail.visible, portail.actif, portail.hauteur, size.height, desktop]);

  // Après un réglage, une annonce polie, au plus toutes les 500 ms. Rien à l'arrivée.
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
  const enLigne = !desktop || etat !== 'datee';

  return (
    <footer className={styles.root} aria-label={t('v2.fasce.label')} data-etat={etat}>
      <div className={styles.zone}>
        <div className={styles.mesure} ref={sizer} aria-hidden="true" />
        {etat === 'eteinte' ? <div className={styles.fil} aria-hidden="true" /> : null}
        {etat === 'datee' ? (
          <div className={styles.masse} ref={masse} data-fondu={portail.actif ? '' : undefined}>
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
        ) : null}
      </div>
      {desktop || tablet ? (
        <div className={styles.rangee}>
          {size.width > 0 ? <PeriodRow scale={scale} width={size.width} onHover={setHoverPeriod} compact={!desktop} /> : null}
        </div>
      ) : null}
      <div className={styles.cartel}>
        <FasceCartel3
          year={year}
          hoverPeriod={hoverPeriod}
          off={fasce.off}
          enLigne={enLigne}
          onSearch={onSearch}
          onIndex={onIndex}
        />
      </div>
      <p className="sr-only" aria-live="polite">
        {announce}
      </p>
    </footer>
  );
}
