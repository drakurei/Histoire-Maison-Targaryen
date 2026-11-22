import { useMemo, useRef } from 'react';

import { MAIN_ID } from '@/app/a11y';
import { VLink } from '@/app/version';
import { dragons } from '@/core/content/dragons';
import { events } from '@/core/content/timeline';
import { uiByKey } from '@/core/content/ui';
import { formatYear, useLang, useT, useUi, VALYRIAN_TAG } from '@/core/i18n';
import { DragonShadow } from '@/shared/dragon';
import { Emblem } from '@/shared/emblem/Emblem';

import { Folio } from '../components/Folio';
import { col } from '../components/grid';
import { Rubric } from '../components/Rubric';
import { VolumeList } from './chronicles/VolumeList';
import { CURVE_FROM, CURVE_TO, DragonCurve } from './portal/DragonCurve';
import { dragonCurve } from './portal/curveData';
import { Registers } from './portal/Registers';
import { useOpening } from './portal/useOpening';
import styles from './PortalPage.module.css';

/**
 * Le portail (/). Seule vue dont le premier écran est sur la table : le nom de la
 * bibliothèque en trois lignes, l'emblème rouge coupé par le bord, l'incipit valyrien et sa
 * glose, l'action qui ouvre le premier volume. Puis le folio : la courbe des dragons vivants,
 * qui raconte toute la dynastie en une figure, la table des huit volumes, les registres.
 */
export default function PortalPage() {
  const t = useT();
  const ui = useUi();
  const { reading } = useLang();
  const scope = useRef<HTMLElement>(null);
  const opening = useOpening(scope);

  // Le nom et l'incipit sont des formules : le valyrien en reste le sujet dans toutes les langues.
  const name = uiByKey.get('title.site');
  const words = (name?.hv ?? name?.[reading] ?? '').split(/\s+/).filter(Boolean);
  const subtitle = ui('title.site');
  const incipit = uiByKey.get('text.portal_intro');
  const incipitTr = incipit?.[reading] ?? '';

  const curve = useMemo(() => dragonCurve(dragons, events, CURVE_FROM, CURVE_TO), []);

  return (
    <main id={MAIN_ID} ref={scope} className={styles.portal}>
      <section className={styles.hero} aria-labelledby="portail-titre">
        <div className={styles.emblem} data-op-emblem="">
          <Emblem />
        </div>

        <h1 id="portail-titre" className={styles.title} lang={name?.hv ? VALYRIAN_TAG : undefined}>
          {words.map((word, index) => (
            <span key={index} className={styles.line}>
              <span className={styles.ink} data-op-line="">
                {word}
              </span>{' '}
            </span>
          ))}
        </h1>
        <p className={styles.subtitle} data-op-after="">
          {subtitle.isHv ? subtitle.gloss : subtitle.primary}
        </p>

        {incipit ? (
          <div className={styles.incipit} data-op-after="">
            {incipit.hv ? (
              <p className={styles.incipitHv} lang={VALYRIAN_TAG}>
                {incipit.hv}
              </p>
            ) : null}
            <p className={styles.incipitTr} lang={reading}>
              {incipitTr}
            </p>
          </div>
        ) : null}

        <p className={styles.actions} data-op-after="">
          <VLink to="/chroniques/p1" className={styles.action}>
            {t('page.portal.open_first')}
          </VLink>
          <VLink to="/chroniques" className={styles.secondary}>
            {t('page.portal.all_volumes')}
          </VLink>
        </p>

        {opening.phase !== 'idle' ? (
          <>
            <div className={styles.veil} data-op-veil="" aria-hidden="true" />
            <div className={styles.glow} aria-hidden="true">
              <div className={styles.glowBand} data-op-glow="" />
            </div>
          </>
        ) : null}
        {opening.phase === 'running' && opening.shadow ? <DragonShadow play={opening.flight} from="left" duration={2.6} /> : null}
        {opening.phase === 'running' ? (
          <button type="button" className={styles.skip} onClick={opening.skip}>
            {t('page.portal.skip')}
          </button>
        ) : null}
      </section>

      <Folio>
        <section className={`${col.rangee} ${styles.section}`} aria-labelledby="portail-courbe">
          <Rubric as="h2" id="portail-courbe" size="titre" className={styles.sectionTitle}>
            <span className={styles.titleLine}>{t('page.portal.curve.title')}</span>{' '}
            <span className={styles.titleLine}>{t('page.portal.curve.span', { from: formatYear(CURVE_FROM, reading), to: formatYear(CURVE_TO, reading) })}</span>
          </Rubric>
          <p className={styles.lead} lang={reading}>
            {t('page.portal.curve.lead', {
              peak: curve.peak.count,
              peakYear: formatYear(curve.peak.year, reading),
              extinction: formatYear(curve.extinction, reading),
              return: formatYear(curve.revival, reading),
            })}
          </p>
          <DragonCurve />
        </section>

        <section className={`${col.rangee} ${styles.section}`} aria-labelledby="portail-volumes">
          <Rubric as="h2" id="portail-volumes" k="page.portal.volumes.title" className={styles.sectionTitle} />
          <VolumeList />
        </section>

        <section className={`${col.rangee} ${styles.section}`} aria-labelledby="portail-registres">
          <Rubric as="h2" id="portail-registres" k="page.portal.registers.title" className={styles.sectionTitle} />
          <Registers />
        </section>
      </Folio>
    </main>
  );
}
