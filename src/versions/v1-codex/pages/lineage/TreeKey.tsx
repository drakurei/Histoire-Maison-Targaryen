import type { ReactNode } from 'react';

import { useT } from '@/core/i18n';
import { CrownGlyph } from '@/shared/marks/Marks';

import styles from './TreeKey.module.css';

interface Sample {
  key: string;
  draw: ReactNode;
}

const W = 44;
const H = 18;

/**
 * La clé du rouleau : chaque trait, chaque point et chaque écriture de l'arbre, dessinés tels
 * qu'ils y figurent, avec leur sens. C'est la légende d'une planche, pas un décor.
 */
export function TreeKey({ className }: { className?: string }) {
  const t = useT();
  const samples: Sample[] = [
    { key: 'ruling', draw: <path d={`M2 ${H / 2}H${W - 2}`} className={styles.ruling} /> },
    { key: 'filiation', draw: <path d={`M2 ${H / 2}H${W - 2}`} className={styles.ink} /> },
    { key: 'doubt', draw: <path d={`M2 ${H / 2}H${W - 2}`} className={`${styles.ink} ${styles.dashed}`} /> },
    {
      key: 'union',
      draw: (
        <>
          <path d={`M2 ${H / 2}H${W - 2}`} className={styles.ink} />
          <circle cx={W / 2} cy={H / 2} r={3.2} className={styles.dot} />
        </>
      ),
    },
    {
      key: 'liaison',
      draw: (
        <>
          <path d={`M2 ${H / 2}H${W - 2}`} className={`${styles.ink} ${styles.dotted}`} />
          <circle cx={W / 2} cy={H / 2} r={3.2} className={styles.hollow} />
        </>
      ),
    },
    {
      key: 'blood',
      draw: (
        <>
          <path d={`M2 ${H / 2}H${W - 2}`} className={styles.red} />
          <circle cx={W / 2} cy={H / 2} r={5} className={styles.knot} />
          <circle cx={W / 2} cy={H / 2} r={1.9} className={styles.knotCore} />
        </>
      ),
    },
    { key: 'loop', draw: <path d={`M2 ${H / 2}H${W - 2}`} className={`${styles.red} ${styles.looped}`} /> },
    {
      key: 'crowned',
      draw: (
        <>
          <ellipse cx={W / 2} cy={H / 2} rx={W / 2 - 1.5} ry={H / 2 - 1} className={styles.medal} />
          <g transform={`translate(${W / 2 - 6} ${H / 2 - 6})`} className={styles.crown}>
            <CrownGlyph size="12" />
          </g>
        </>
      ),
    },
  ];

  return (
    <div className={`${styles.key} ${className ?? ''}`}>
      <h2 className={styles.title}>{t('page.lignee.key.title')}</h2>
      <ul className={styles.list} role="list">
        {samples.map((sample) => (
          <li key={sample.key} className={styles.item}>
            <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} aria-hidden="true" className={styles.sample}>
              {sample.draw}
            </svg>
            <span>{t(`page.lignee.key.${sample.key}`)}</span>
          </li>
        ))}
        <li className={styles.item}>
          <span className={styles.alliance} aria-hidden="true">
            {t('page.lignee.key.allianceSample')}
          </span>
          <span>{t('page.lignee.key.alliance')}</span>
        </li>
      </ul>
    </div>
  );
}
