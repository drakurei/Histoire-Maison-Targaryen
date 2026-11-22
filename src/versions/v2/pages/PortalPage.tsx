import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { getPeriod } from '@/core/content/timeline';
import { Gloss, useT, useTitle, useUi } from '@/core/i18n';
import { EASE, gsap, useGSAP } from '@/core/motion';
import { prefersReducedMotion } from '@/core/motion/reducedMotion';
import { useSeuil } from '@/shared/seuil/SeuilGate';

import { Lien } from '../components/Lien';
import { Page } from '../components/Page';
import { Profil } from '../components/Profil';
import { useElementWidth } from '../components/useElementWidth';
import { useFasce } from '../state/fasce';
import { DOMAIN } from '../state/scene';
import { hasPlayed, markPlayed, readResume } from '../state/storage';

import { DESKTOP_QUERY, useMedia, useViewportHeight } from './entree/hooks';
import { PortalListes } from './entree/PortalListes';
import { ReperesOrdi, ReperesTel } from './entree/Reperes';
import type { Ouverture } from './entree/Reperes';
import styles from './PortalPage.module.css';

/** L'ouverture du portail, une fois par session. */
const OPENING_KEY = 'portail:ouverture';

/**
 * Portail `/` (champ plein, spec §5.1). Ordinateur : la fasce est en majesté (45 svh), la
 * même que partout, soudée à sa rangée des périodes et à son cartel ; au-dessus, le titre,
 * l'incipit et la légende de la masse ; sur la masse, cinq repères liés à leur événement.
 * Pas d'emblème (il a été vu au seuil), pas de bouton « entrer ».
 *
 * Ouverture, après le seuil, une fois par session : le titre s'inscrit de gauche à droite,
 * puis un rideau découvre la masse dans l'ordre du temps et les repères s'inscrivent à leur
 * passage. Mouvement réduit : tout est posé d'emblée.
 *
 * Téléphone : titre et incipit, la masse en majesté dans le flux (34 svh) avec deux repères,
 * les huit périodes, les neuf registres. La fasce fixe est là dès le portail.
 */
export default function PortalPage() {
  const t = useT();
  const ui = useUi();
  const title = useTitle();
  const desktop = useMedia(DESKTOP_QUERY);
  const viewport = useViewportHeight();
  const { open: seuilOpen } = useSeuil();
  const [figure, width] = useElementWidth<HTMLDivElement>();
  const resume = useMemo(() => readResume(), []);
  const resumed = resume ? getPeriod(resume.ref) : undefined;
  useFasce({ majesty: 45 });

  const [ouverture, setOuverture] = useState<Ouverture>(() =>
    window.matchMedia(DESKTOP_QUERY).matches && !prefersReducedMotion() && !hasPlayed(OPENING_KEY) ? 'attente' : 'fini',
  );
  useEffect(() => {
    if (ouverture !== 'attente' || seuilOpen) return;
    markPlayed(OPENING_KEY);
    setOuverture('jeu');
  }, [ouverture, seuilOpen]);
  const finish = useCallback(() => setOuverture('fini'), []);

  const titre = useRef<HTMLHeadingElement>(null);
  const incipit = useRef<HTMLDivElement>(null);
  useGSAP(
    () => {
      if (ouverture !== 'jeu') return;
      const lines = [
        ...(titre.current?.querySelectorAll<HTMLElement>('.gloss__main, .gloss__tr') ?? []),
        ...(incipit.current ? [incipit.current] : []),
      ];
      gsap.fromTo(
        lines,
        { clipPath: 'inset(-0.3em 100% -0.4em 0)' },
        { clipPath: 'inset(-0.3em 0% -0.4em 0)', duration: 1.1, ease: EASE.expo, stagger: 0.18, clearProps: 'clipPath' },
      );
    },
    { dependencies: [ouverture] },
  );

  const height = Math.round(viewport * 0.34);
  const hidden = ouverture === 'attente' ? '' : undefined;

  return (
    <Page partition="champ" className={styles.page}>
      <h1 ref={titre} className={styles.titre} data-cache={hidden} data-long={ui('title.site').isHv ? undefined : ''}>
        <Gloss k="title.site" classes={{ tr: styles.glose }} />
      </h1>
      <div ref={incipit} className={styles.incipit} data-cache={hidden}>
        <p className={styles.formule}>
          <Gloss k="text.portal_intro" classes={{ tr: styles.formuleGlose }} />
        </p>
        {resume && resumed ? (
          <Lien to={resume.to} year={resume.year} className={styles.reprise}>
            {t('v2.resume.label', { title: title(resumed.title).gloss ?? title(resumed.title).primary })}
          </Lien>
        ) : null}
        {desktop ? <p className={styles.legende}>{t('v2.portal.legend')}</p> : null}
      </div>

      {desktop ? <ReperesOrdi ouverture={ouverture} onFin={finish} /> : null}
      {/* Téléphone : la masse en majesté est une figure dans le flux (cachée sur ordinateur). */}
      <div ref={figure} className={styles.majesteTel}>
        {!desktop && width > 0 ? (
          <>
            <div aria-hidden="true" className={styles.masseTel}>
              <Profil from={DOMAIN[0]} to={DOMAIN[1]} width={width} height={height} full={height} />
            </div>
            <ReperesTel width={width} height={height} />
          </>
        ) : null}
      </div>
      {desktop ? null : (
        <>
          <p className={styles.legendeTel}>{t('v2.portal.legend')}</p>
          <PortalListes />
        </>
      )}
    </Page>
  );
}
