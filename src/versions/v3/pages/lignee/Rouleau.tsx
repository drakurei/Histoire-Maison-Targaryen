import { useCallback, useMemo, useRef, useState } from 'react';

import type { Person } from '@/core/content/types';
import { layoutTree } from '@/core/genealogy';
import { useLang, useT } from '@/core/i18n';
import { col } from '@/versions/v1-codex/components/grid';
import { CROWNED, graph, lifeYears, shortName } from '@/versions/v1-codex/pages/lineage/model';
import { TreeControls } from '@/versions/v1-codex/pages/lineage/TreeControls';
import { TreeKey } from '@/versions/v1-codex/pages/lineage/TreeKey';
import { TreeStage } from '@/versions/v1-codex/pages/lineage/TreeStage';
import type { TreeStageHandle } from '@/versions/v1-codex/pages/lineage/TreeStage';

import styles from './Rouleau.module.css';

/** Largeur moyenne d'un caractère du nom, comme dans la lignée de la V1. */
const NAME_CHAR = 7.6;

interface RouleauProps {
  /** La personne au centre du pal : le rouleau s'ouvre sur elle. */
  centre: string;
  /** Choisir une personne revient au pal centré sur elle. */
  onPick: (id: string) => void;
}

/**
 * L'arbre entier (v3-spec §6.5, `?vue=arbre`) : le rouleau à l'encre de la V1 (`TreeStage`),
 * posé sur le folio pleine largeur. Filiations à l'encre, lignée régnante en rubrique,
 * boucles du sang à la demande, souverains sans médaillon d'or (correction V1 n° 1 gardée).
 * Ordinateur seulement : au téléphone, la vue passe par l'arbre plein écran de la V2.
 */
export function Rouleau({ centre, onPick }: RouleauProps) {
  const t = useT();
  const { reading } = useLang();
  const stage = useRef<TreeStageHandle>(null);
  const [showLoops, setShowLoops] = useState(false);

  const layout = useMemo(
    () =>
      layoutTree(graph, {
        nodeHeight: 50,
        rowGap: 66,
        siblingGap: 18,
        blockGap: 44,
        widthOf: (person) => Math.max(104, Math.round(shortName(person, reading).length * NAME_CHAR * (CROWNED.has(person.id) ? 1.08 : 1) + 26)),
      }),
    [reading],
  );

  const describe = useCallback(
    (person: Person) => {
      const years = lifeYears(person, reading);
      const parts = [person.name[reading], person.epithet?.[reading], years, CROWNED.has(person.id) ? t('page.lignee.crowned') : null];
      return parts.filter(Boolean).join(', ');
    },
    [reading, t],
  );

  return (
    <>
      <div className={`${col.pleine} ${styles.outils}`}>
        <TreeControls
          onZoomIn={() => stage.current?.zoomBy(1.35)}
          onZoomOut={() => stage.current?.zoomBy(1 / 1.35)}
          onRecenter={() => stage.current?.recenter()}
          onAll={() => stage.current?.fit()}
        />
        <button type="button" className={styles.bascule} aria-pressed={showLoops} onClick={() => setShowLoops((value) => !value)}>
          {t('page.lignee.loops')}
        </button>
      </div>
      <div className={`${col.pleine} ${styles.scene}`}>
        <TreeStage
          ref={stage}
          layout={layout}
          reading={reading}
          selected={centre}
          showLoops={showLoops}
          coveredRight={0}
          onSelect={onPick}
          describe={describe}
          home={centre}
        />
      </div>
      <TreeKey className={`${col.pleine} ${styles.legende}`} />
    </>
  );
}
