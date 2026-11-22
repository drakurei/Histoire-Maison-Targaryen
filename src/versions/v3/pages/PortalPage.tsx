import { useLayoutEffect, useMemo, useRef, useState } from 'react';
import type { CSSProperties } from 'react';

import { getPeriod } from '@/core/content/timeline';
import { Gloss, useT, useTitle, useUi } from '@/core/i18n';
import { Lien } from '@/versions/v2/components/Lien';
import { useViewportHeight } from '@/versions/v2/pages/entree/hooks';
import { readResume } from '@/versions/v2/state/storage';

import { DESKTOP, useMedia } from '../components/common/useMedia';
import { useVue } from '../components/common/useVue';
import { Vue } from '../components/common/Vue';
import { Majeste } from './entree/Majeste';
import { TableVolumes } from './entree/TableVolumes';
import styles from './PortalPage.module.css';

/** Distance du haut du document au premier écran, pour qu'il finisse pile sur la rangée de la fasce. */
function useHaut(node: HTMLElement | null): number {
  const [haut, setHaut] = useState(0);
  useLayoutEffect(() => {
    if (!node) return;
    const measure = () => {
      const top = Math.round(node.getBoundingClientRect().top + window.scrollY);
      setHaut((current) => (Math.abs(current - top) < 1 ? current : top));
    };
    measure();
    void document.fonts?.ready.then(measure);
    window.addEventListener('resize', measure);
    return () => window.removeEventListener('resize', measure);
  }, [node]);
  return haut;
}

/**
 * Portail (v3-spec §6.1). Premier écran sur le champ : le nom du site et sa glose à gauche,
 * l'incipit à droite, et en bas la masse en majesté, qui est la fasce elle-même, haute (45 svh
 * sur ordinateur, 34 au téléphone) : tant qu'elle est à l'écran, la fasce fixe ne montre que
 * sa rangée. Sous le premier écran, la table des volumes sur vélin, puis les registres.
 */
export default function PortalPage() {
  const t = useT();
  const ui = useUi();
  const title = useTitle();
  const desktop = useMedia(DESKTOP);
  const viewport = useViewportHeight();
  const [ecran, setEcran] = useState<HTMLElement | null>(null);
  const haut = useHaut(ecran);
  const resume = useMemo(() => readResume(), []);
  const resumed = resume ? getPeriod(resume.ref) : undefined;
  const titre = useRef<HTMLHeadingElement>(null);
  useVue({ etat: 'portail' });

  const height = Math.round(viewport * (desktop ? 0.45 : 0.34));
  const style = { '--v3-portail-haut': `${haut}px` } as CSSProperties;

  return (
    <Vue partition="champ" className={styles.vue}>
      <section ref={setEcran} className={styles.ecran} style={style} aria-labelledby="v3-portail-titre">
        <h1 ref={titre} id="v3-portail-titre" className={styles.titre} data-long={ui('title.site').isHv ? undefined : ''}>
          <Gloss k="title.site" classes={{ tr: styles.glose }} />
        </h1>
        <div className={styles.incipit}>
          <p className={styles.formule}>
            <Gloss k="text.portal_intro" classes={{ tr: styles.formuleGlose }} />
          </p>
          {resume && resumed ? (
            <Lien to={resume.to} year={resume.year} className={styles.reprise}>
              {t('v2.resume.label', { title: title(resumed.title).gloss ?? title(resumed.title).primary })}
            </Lien>
          ) : null}
          <p className={styles.legende}>{t('v2.portal.legend')}</p>
        </div>
        <div className={styles.pied}>
          <Majeste height={height} desktop={desktop} />
        </div>
      </section>
      <div className={styles.table}>
        <TableVolumes />
      </div>
    </Vue>
  );
}
