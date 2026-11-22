import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';

import { MAIN_ID } from '@/app/a11y';
import { persons } from '@/core/content/people';
import type { Person } from '@/core/content/types';
import { layoutTree } from '@/core/genealogy';
import { useLang, useT } from '@/core/i18n';

import { Folio } from '../components/Folio';
import { col } from '../components/grid';
import { useElementWidth, useMediaQuery } from '../components/hooks';
import { Rubric } from '../components/Rubric';
import styles from './LineagePage.module.css';
import { KinPanel } from './lineage/KinPanel';
import { CROWNED, graph, lifeYears, shortName } from './lineage/model';
import { PersonSearch } from './lineage/PersonSearch';
import { ThreadView } from './lineage/ThreadView';
import { TreeControls } from './lineage/TreeControls';
import { TreeKey } from './lineage/TreeKey';
import { TreeStage } from './lineage/TreeStage';
import type { TreeStageHandle } from './lineage/TreeStage';

const NARROW_QUERY = '(max-width: 767.98px)';
/** Le rouleau s'ouvre sur la génération de la Conquête. */
const HOME = 'aegon-i';
const PANEL_MAX = 368;

/** Chasse moyenne de Texturina à 15 px, pour régler la largeur de chaque case sur son nom. */
const NAME_CHAR = 7.6;

/**
 * Lignée (/lignee) : l'arbre complet de la Maison, tracé à l'encre sur un rouleau qu'on
 * déplace et qu'on agrandit. Une personne choisie (clic, clavier, recherche ou `?p=`) est
 * centrée, ses fils se retracent, et le volet donne sa parenté. Sous 768 px, le fil vertical.
 */
export default function LineagePage() {
  const t = useT();
  const { reading } = useLang();
  const narrow = useMediaQuery(NARROW_QUERY);
  const [params, setParams] = useSearchParams();
  const requested = params.get('p');
  const selected = requested && graph.personById.has(requested) ? requested : null;
  const [showLoops, setShowLoops] = useState(false);
  const [mode, setMode] = useState<'thread' | 'tree'>('thread');
  const stage = useRef<TreeStageHandle>(null);
  const area = useRef<HTMLDivElement>(null);
  const areaWidth = useElementWidth(area);

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

  const generations = useMemo(() => new Set(persons.map((person) => person.generation)).size, []);
  const treeShown = !narrow || mode === 'tree';
  const coveredRight = selected && treeShown && !narrow ? Math.min(PANEL_MAX, areaWidth * 0.44) : 0;

  const select = useCallback(
    (id: string) => {
      setParams(
        (current) => {
          const next = new URLSearchParams(current);
          next.set('p', id);
          return next;
        },
        { replace: true, preventScrollReset: true },
      );
    },
    [setParams],
  );

  const close = useCallback(() => {
    const id = selected;
    setParams(
      (current) => {
        const next = new URLSearchParams(current);
        next.delete('p');
        return next;
      },
      { replace: true, preventScrollReset: true },
    );
    if (id) window.requestAnimationFrame(() => document.querySelector<SVGGElement>(`[data-person="${CSS.escape(id)}"]`)?.focus());
  }, [selected, setParams]);

  // Chaque nouvelle personne choisie est amenée au centre du rouleau.
  const previous = useRef(selected);
  useEffect(() => {
    if (selected && selected !== previous.current) stage.current?.center(selected);
    previous.current = selected;
  }, [selected]);

  const describe = useCallback(
    (person: Person) => {
      const years = lifeYears(person, reading);
      const parts = [person.name[reading], person.epithet?.[reading], years, CROWNED.has(person.id) ? t('page.lignee.crowned') : null];
      return parts.filter(Boolean).join(', ');
    },
    [reading, t],
  );

  const panel = (placement: 'side' | 'sheet') =>
    selected ? <KinPanel key={selected} id={selected} onSelect={select} onClose={close} placement={placement} /> : null;

  return (
    <main id={MAIN_ID}>
      <Folio wide>
        <header className={`${col.pleine} ${styles.head}`}>
          <div className={styles.titling}>
            <Rubric as="h1" k="nav.genealogy" />
            <p className={styles.intro}>{t('page.lignee.intro', { n: persons.length, generations })}</p>
          </div>
          <div className={styles.tools}>
            <PersonSearch onPick={select} className={styles.search} />
            <div className={styles.switches}>
              {treeShown ? (
                <TreeControls
                  onZoomIn={() => stage.current?.zoomBy(1.35)}
                  onZoomOut={() => stage.current?.zoomBy(1 / 1.35)}
                  onRecenter={() => stage.current?.recenter()}
                  onAll={() => stage.current?.fit()}
                />
              ) : null}
              {narrow ? (
                <div className={styles.modes} role="group" aria-label={t('page.lignee.mode.label')}>
                  <button type="button" className={styles.toggle} aria-pressed={mode === 'thread'} onClick={() => setMode('thread')}>
                    {t('page.lignee.mode.thread')}
                  </button>
                  <button type="button" className={styles.toggle} aria-pressed={mode === 'tree'} onClick={() => setMode('tree')}>
                    {t('page.lignee.mode.tree')}
                  </button>
                </div>
              ) : null}
              <button type="button" className={styles.toggle} aria-pressed={showLoops} onClick={() => setShowLoops((value) => !value)}>
                {t('page.lignee.loops')}
              </button>
            </div>
          </div>
        </header>

        <div ref={area} className={`${col.pleine} ${styles.area}`}>
          {treeShown ? (
            <TreeStage
              ref={stage}
              layout={layout}
              reading={reading}
              selected={selected}
              showLoops={showLoops}
              coveredRight={coveredRight}
              onSelect={select}
              describe={describe}
              home={HOME}
            >
              {narrow ? <div className={styles.sheetSlot}>{panel('sheet')}</div> : panel('side')}
            </TreeStage>
          ) : (
            <div className={styles.threadWrap}>
              <ThreadView reading={reading} selected={selected} showLoops={showLoops} onSelect={select} describe={describe} />
              {selected ? <div className={styles.sticky}>{panel('sheet')}</div> : null}
            </div>
          )}
        </div>

        <TreeKey className={`${col.pleine} ${styles.key}`} />
      </Folio>
    </main>
  );
}
