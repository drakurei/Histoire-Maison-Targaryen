import { useEffect, useMemo, useRef, useState } from 'react';

import type { Dragon, DragonLook, Localized } from '@/core/content/types';
import { buildDragon } from '@/core/dragons/geometry';
import { useT } from '@/core/i18n';
import { usePrefersReducedMotion } from '@/core/motion/reducedMotion';
import { DragonFigure } from '@/shared/dragon';

import styles from './Plate.module.css';
import { useTxTypo } from '../../components/typo';

interface PlateProps {
  dragon: Dragon;
  /** Nom affiché, déjà résolu. */
  name: string;
  /** Remarque du dessinateur sur les teintes retenues. */
  colorNote?: Localized;
}

type Part = 'body' | 'wing' | 'crest' | 'flame';

const PARTS: readonly Part[] = ['body', 'wing', 'crest', 'flame'];
/** Pose de la planche : celle de DragonFigure par défaut, pour que les renvois tombent juste. */
const POSE = { flap: 0, neckCurve: 0.16, tailCurve: 0.34 } as const;

function beatOf(look: DragonLook): number {
  return 1.5 + 2.3 * Math.sqrt(Math.max(look.span, 0.05));
}

/**
 * La planche : le dragon gravé et colorié à la main là où les livres décrivent sa robe, laissé
 * au trait ailleurs. Quatre renvois numérotés désignent le corps, les ailes, la crête et le
 * feu ; la légende dit pour chacun si la teinte est décrite. « Voir voler » joue un battement.
 */
export function Plate({ dragon, name, colorNote }: PlateProps) {
  const t = useT();
  const tx = useTxTypo();
  const reduced = usePrefersReducedMotion();
  const [flying, setFlying] = useState(false);
  const timer = useRef<number | null>(null);
  const look = dragon.look;
  const beat = beatOf(look);

  const geometry = useMemo(() => buildDragon(look, POSE), [look]);
  const callouts = useMemo(() => {
    const { anchors, box } = geometry;
    const reach = box.width * 0.075;
    const wing: [number, number] = [
      anchors.wristR[0] + (anchors.wingtipR[0] - anchors.wristR[0]) * 0.35,
      anchors.wristR[1] + (anchors.wingtipR[1] - anchors.wristR[1]) * 0.35 + box.height * 0.05,
    ];
    const points: Record<Part, { at: readonly [number, number]; to: [number, number] }> = {
      flame: { at: anchors.snout, to: [anchors.snout[0] + reach * 0.9, anchors.snout[1] - reach * 0.5] },
      crest: { at: anchors.skullBase, to: [anchors.skullBase[0] - reach * 1.4, anchors.skullBase[1] - reach * 0.2] },
      wing: { at: wing, to: [wing[0] + reach * 0.4, wing[1] + reach * 1.1] },
      body: { at: anchors.hip, to: [anchors.hip[0] - reach * 1.3, anchors.hip[1] + reach * 0.4] },
    };
    return { points, size: box.width * 0.024 };
  }, [geometry]);

  useEffect(() => () => {
    if (timer.current !== null) window.clearTimeout(timer.current);
  }, []);

  const fly = () => {
    if (timer.current !== null) window.clearTimeout(timer.current);
    setFlying(true);
    timer.current = window.setTimeout(() => setFlying(false), beat * 1000 + 60);
  };

  return (
    <div className={styles.plate}>
      <div className={styles.drawing}>
        <DragonFigure
          look={look}
          title={t('page.dragon.plate.title', { name })}
          tone="specimen"
          ground="light"
          unattested="bare"
          detail="fine"
          animate={flying}
          beat={beat}
          glide={0}
          className={styles.figure}
        />
        <svg className={styles.callouts} viewBox={geometry.viewBox} preserveAspectRatio="xMidYMid meet" aria-hidden="true" data-hidden={flying || undefined}>
          {PARTS.map((part, index) => {
            const { at, to } = callouts.points[part];
            return (
              <g key={part}>
                <line x1={at[0]} y1={at[1]} x2={to[0]} y2={to[1]} className={styles.leader} vectorEffect="non-scaling-stroke" />
                <circle cx={at[0]} cy={at[1]} r={callouts.size * 0.18} className={styles.dot} />
                <circle cx={to[0]} cy={to[1]} r={callouts.size * 0.78} className={styles.badge} vectorEffect="non-scaling-stroke" />
                <text x={to[0]} y={to[1] + callouts.size * 0.36} fontSize={callouts.size} textAnchor="middle" className={styles.number}>
                  {index + 1}
                </text>
              </g>
            );
          })}
        </svg>
      </div>

      <div className={styles.legend}>
        <ol className={styles.parts} role="list">
          {PARTS.map((part, index) => {
            const described = look.attested[part];
            return (
              <li key={part} className={styles.part}>
                <span className={styles.partNumber} aria-hidden="true">
                  {index + 1}
                </span>
                <span className={styles.swatch} data-described={described || undefined} style={described ? { background: look[part] } : undefined} aria-hidden="true" />
                <span className={styles.partText}>
                  <span className={styles.partName}>{t(`page.dragon.part.${part}`)}</span>
                  <span className={styles.partState}>{t(described ? 'page.dragon.described' : 'page.dragon.undescribed')}</span>
                </span>
              </li>
            );
          })}
        </ol>
        {colorNote ? <p className={styles.note}>{tx(colorNote)}</p> : null}
        {reduced ? null : (
          <button type="button" className={styles.fly} onClick={fly} disabled={flying}>
            {t(flying ? 'page.dragon.flying' : 'page.dragon.fly')}
          </button>
        )}
      </div>
    </div>
  );
}
