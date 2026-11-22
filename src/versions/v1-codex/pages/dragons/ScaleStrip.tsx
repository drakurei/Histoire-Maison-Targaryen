import { useMemo, useState } from 'react';

import { VLink } from '@/app/version';
import type { Dragon } from '@/core/content/types';
import { layoutDragonScale } from '@/core/dragons/scale';
import { useT, useTitle, VALYRIAN_TAG } from '@/core/i18n';
import { DragonScale } from '@/shared/dragon';

import { useWide } from '../../components/hooks';
import { dragonName } from './registry';
import styles from './ScaleStrip.module.css';

interface ScaleStripProps {
  dragons: readonly Dragon[];
}

/** Espace entre deux envergures, en fraction de celle de Balerion. */
const GAP = 0.07;
/** Pixels par unité de l'échelle (1000 unités : l'envergure de Balerion). */
const PX_WIDE = 0.21;
const PX_NARROW = 0.15;
/** Les noms se rangent sur trois lignes, en quinconce : les petits dragons sont serrés. */
const LABEL_ROWS = 3;

/**
 * L'échelle comparée du registre : tous les dragons, du plus grand au plus petit, épaules
 * alignées, un homme pour repère. La bande déborde la feuille et se fait défiler ; chaque
 * nom mène à la planche du dragon, et le survoler éclaire sa silhouette.
 */
export function ScaleStrip({ dragons }: ScaleStripProps) {
  const t = useT();
  const title = useTitle();
  const wide = useWide();
  const [active, setActive] = useState<string | undefined>(undefined);

  const entries = useMemo(
    () => dragons.map((dragon) => ({ id: dragon.id, look: dragon.look, title: title(dragonName(dragon)).primary })),
    [dragons, title],
  );
  const layout = useMemo(() => layoutDragonScale(entries, { gap: GAP }), [entries]);
  const byId = useMemo(() => new Map(dragons.map((dragon) => [dragon.id, dragon])), [dragons]);
  const width = Math.round(layout.width * (wide ? PX_WIDE : PX_NARROW));

  return (
    <div className={styles.strip} tabIndex={0} role="region" aria-label={t('page.dragons.scale.region')}>
      <div className={styles.inner} style={{ inlineSize: `${width}px` }}>
        <DragonScale
          dragons={entries}
          title={t('page.dragons.scale.title')}
          humanTitle={t('page.dragons.scale.human')}
          gap={GAP}
          tone="engraving"
          ground="light"
          activeId={active}
          className={styles.scale}
        />
        <ol className={styles.names} role="list">
          {layout.items.map((item, index) => {
            const dragon = byId.get(item.id);
            if (!dragon) return null;
            const shown = title(dragonName(dragon));
            return (
              <li
                key={item.id}
                className={styles.name}
                data-row={index % LABEL_ROWS}
                style={{ insetInlineStart: `${(item.centerX / layout.width) * 100}%` }}
              >
                <VLink
                  to={`/dragons/${dragon.id}`}
                  className={styles.link}
                  onPointerEnter={() => setActive(dragon.id)}
                  onPointerLeave={() => setActive(undefined)}
                  onFocus={() => setActive(dragon.id)}
                  onBlur={() => setActive(undefined)}
                  lang={shown.isHv ? VALYRIAN_TAG : undefined}
                >
                  {shown.primary}
                </VLink>
              </li>
            );
          })}
        </ol>
      </div>
    </div>
  );
}
