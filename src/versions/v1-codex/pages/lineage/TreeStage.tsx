import { useCallback, useEffect, useImperativeHandle, useMemo, useRef } from 'react';
import type { KeyboardEvent, ReactNode, Ref } from 'react';

import type { Person, SupportLang } from '@/core/content/types';
import type { LayoutResult } from '@/core/genealogy';
import { formatYear, useT } from '@/core/i18n';
import { DURATION, EASE, gsap, MOTION_CONDITIONS, useGSAP } from '@/core/motion';

import { toRoman } from '../../components/numerals';
import { graph } from './model';
import { pathOf, TreeDrawing } from './TreeDrawing';
import styles from './TreeStage.module.css';
import { usePanZoom } from './usePanZoom';

/** Ce que la page peut demander au rouleau. */
export interface TreeStageHandle {
  center: (id: string, animate?: boolean) => void;
  zoomBy: (factor: number) => void;
  fit: () => void;
  recenter: () => void;
}

interface TreeStageProps {
  layout: LayoutResult;
  reading: SupportLang;
  selected: string | null;
  showLoops: boolean;
  /** Largeur que le volet couvre à droite : le centre visible se décale d'autant. */
  coveredRight: number;
  onSelect: (id: string) => void;
  describe: (person: Person) => string;
  /** Personne autour de laquelle s'ouvre le rouleau quand rien n'est choisi. */
  home: string;
  /** Le volet, posé dans la scène. */
  children?: ReactNode;
  ref?: Ref<TreeStageHandle>;
}

const READING_ZOOM = 0.9;
/** Largeur maximale du volet (23 rem), comme dans KinPanel.module.css. */
const PANEL_MAX = 368;


/** Médiane des années de naissance connues d'une rangée : l'époque de la génération. */
function rowEpochs(layout: LayoutResult): Map<number, number | null> {
  const map = new Map<number, number | null>();
  for (const row of layout.rows) {
    const years = layout.nodes
      .filter((node) => node.generation === row.generation)
      .map((node) => graph.personById.get(node.id)?.born)
      .filter((year): year is number => typeof year === 'number')
      .sort((a, b) => a - b);
    map.set(row.generation, years.length > 0 ? (years[Math.floor(years.length / 2)] ?? null) : null);
  }
  return map;
}

/**
 * Le rouleau : l'arbre complet sur le vélin, qu'on déplace au glisser, qu'on agrandit à la
 * molette ou en pinçant, et ses commandes (agrandir, réduire, recentrer, tout l'arbre). La
 * marge gauche nomme la génération de chaque rangée et son époque. Quand une personne est
 * centrée, les fils qui la relient à ses parents et à ses enfants se retracent.
 */
export function TreeStage({ layout, reading, selected, showLoops, coveredRight, onSelect, describe, home, children, ref }: TreeStageProps) {
  const t = useT();
  const stage = useRef<HTMLDivElement>(null);
  const svg = useRef<SVGSVGElement>(null);
  const { view, dragged, zoomBy, centerOn, fit, reveal } = usePanZoom(stage, layout.bounds);
  const nodeById = useMemo(() => new Map(layout.nodes.map((node) => [node.id, node])), [layout.nodes]);
  const epochs = useMemo(() => rowEpochs(layout), [layout]);
  const drawing = useMemo(() => ({ ...layout, width: layout.bounds.width, height: layout.bounds.height }), [layout]);
  const covered = useRef(coveredRight);
  covered.current = coveredRight;

  const center = useCallback(
    (id: string, animate = true, lift = 0, cover = covered.current) => {
      const node = nodeById.get(id);
      if (!node) return;
      const k = READING_ZOOM;
      centerOn(node.x + node.w / 2 + cover / 2 / k, node.y + node.h / 2 + lift / k, k, animate);
    },
    [centerOn, nodeById],
  );


  // Première ouverture : sur la personne demandée, sinon sur la maison au temps de la Conquête.
  const opened = useRef(false);
  useEffect(() => {
    if (opened.current) return;
    opened.current = true;
    // Sans personne choisie, la Conquête se lit dans le tiers haut : sa descendance remplit le reste.
    // À l'ouverture, la largeur du volet n'est pas encore mesurée par la page : on l'estime ici.
    const width = stage.current?.clientWidth ?? 0;
    if (selected) center(selected, false, 0, width >= 760 ? Math.min(PANEL_MAX, width * 0.44) : 0);
    else center(home, false, (stage.current?.clientHeight ?? 600) * 0.22);
  }, [center, home, selected]);

  // Les fils qui touchent la personne centrée : vers ses parents, ses conjoints, ses enfants.
  const traced = useMemo(() => {
    if (!selected) return [];
    const own = new Set(graph.unionIds.get(selected) ?? []);
    const paths: { key: string; d: string; kind: 'up' | 'down' | 'tie' }[] = [];
    const myUnions = layout.unions.filter((union) => union.a === selected || union.b === selected || (union.unionId !== null && own.has(union.unionId)));
    const myUnionIds = new Set(myUnions.map((union) => union.id));
    for (const link of layout.links) {
      if (link.to === selected) paths.push({ key: `u${link.from}`, d: pathOf(link.points), kind: 'up' });
      else if (myUnionIds.has(link.from) || link.from === selected) paths.push({ key: `d${link.from}${link.to}`, d: pathOf(link.points), kind: 'down' });
    }
    for (const union of myUnions) for (const tie of union.ties) paths.push({ key: `t${union.id}${tie.person}`, d: pathOf(tie.points), kind: 'tie' });
    return paths;
  }, [layout, selected]);

  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      mm.add(MOTION_CONDITIONS, (context) => {
        if (context.conditions?.reduced) return;
        const up = gsap.utils.toArray<SVGPathElement>('[data-trace="up"], [data-trace="tie"]');
        const down = gsap.utils.toArray<SVGPathElement>('[data-trace="down"]');
        if (up.length === 0 && down.length === 0) return;
        const timeline = gsap.timeline({ defaults: { ease: EASE.power4 } });
        timeline.fromTo(up, { drawSVG: '0%' }, { drawSVG: '100%', duration: 0.5 }, 0.12);
        timeline.fromTo(down, { drawSVG: '0%' }, { drawSVG: '100%', duration: 0.5 }, 0.22);
      });
      return () => mm.revert();
    },
    { scope: svg, dependencies: [selected], revertOnUpdate: true },
  );

  // La lignée se déploie une fois : les filiations se tracent du haut vers le bas, rangée après rangée.
  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      mm.add(MOTION_CONDITIONS, (context) => {
        if (context.conditions?.reduced) return;
        const links = gsap.utils.toArray<SVGPathElement>('[data-gen]');
        gsap.fromTo(
          links,
          { drawSVG: '0%' },
          {
            drawSVG: '100%',
            duration: DURATION.passage,
            ease: EASE.expo,
            delay: (_index: number, target: SVGPathElement) => Number(target.dataset.gen ?? 0) * 0.06,
          },
        );
      });
      return () => mm.revert();
    },
    { scope: svg },
  );

  // Au clavier : flèches de rangée en rangée et le long d'une rangée, Entrée pour centrer.
  const rows = useMemo(() => {
    const map = new Map<number, typeof layout.nodes>();
    for (const node of layout.nodes) map.set(node.generation, [...(map.get(node.generation) ?? []), node]);
    for (const list of map.values()) list.sort((a, b) => a.x - b.x);
    return map;
  }, [layout]);

  const onKey = useCallback(
    (event: KeyboardEvent<SVGGElement>, id: string) => {
      const node = nodeById.get(id);
      if (!node) return;
      let target: string | null = null;
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        onSelect(id);
        return;
      }
      const row = rows.get(node.generation) ?? [];
      const index = row.findIndex((candidate) => candidate.id === id);
      if (event.key === 'ArrowLeft') target = row[index - 1]?.id ?? null;
      else if (event.key === 'ArrowRight') target = row[index + 1]?.id ?? null;
      else if (event.key === 'ArrowUp' || event.key === 'ArrowDown') {
        const other = rows.get(node.generation + (event.key === 'ArrowUp' ? -1 : 1)) ?? [];
        const middle = node.x + node.w / 2;
        let best: number | null = null;
        for (const candidate of other) {
          const distance = Math.abs(candidate.x + candidate.w / 2 - middle);
          if (best === null || distance < best) {
            best = distance;
            target = candidate.id;
          }
        }
      } else return;
      event.preventDefault();
      if (!target) return;
      const next = nodeById.get(target);
      if (next) reveal(next.x + next.w / 2, next.y + next.h / 2);
      svg.current?.querySelector<SVGGElement>(`[data-person="${CSS.escape(target)}"]`)?.focus();
    },
    [nodeById, onSelect, reveal, rows],
  );

  const recenter = useCallback(
    () => (selected ? center(selected) : center(home, true, (stage.current?.clientHeight ?? 600) * 0.22)),
    [center, home, selected],
  );
  useImperativeHandle(ref, () => ({ center, zoomBy, fit: () => fit(), recenter }), [center, fit, recenter, zoomBy]);

  return (
    <div className={styles.frame}>
      <div ref={stage} className={styles.stage} aria-roledescription={t('page.lignee.stage.role')} role="group" aria-label={t('page.lignee.stage.label')}>
        <svg ref={svg} className={styles.svg} aria-hidden={false}>
          <g transform={`translate(${view.x.toFixed(2)} ${view.y.toFixed(2)}) scale(${view.k.toFixed(4)})`}>
            <g className={styles.traces} aria-hidden="true">
              {traced.map((path) => (
                <path key={`${selected ?? ''}-${path.key}`} d={path.d} className={styles.trace} data-trace={path.kind} />
              ))}
            </g>
            <TreeDrawing
              drawing={drawing}
              reading={reading}
              selected={selected}
              showLoops={showLoops}
              onActivate={onSelect}
              onKey={onKey}
              tabStop={selected ?? home}
              dragged={dragged}
              describe={describe}
            />
          </g>
        </svg>

        <ol className={styles.rail} aria-hidden="true">
          {layout.rows.map((row) => {
            const y = (row.y + row.height / 2) * view.k + view.y;
            if (y < 10) return null;
            const epoch = epochs.get(row.generation);
            return (
              <li key={row.generation} className={styles.railRow} style={{ transform: `translateY(${y.toFixed(1)}px)` }}>
                <span className={styles.railNumber}>{toRoman(row.generation + 1)}</span>
                {epoch !== null && epoch !== undefined ? (
                  <span className={styles.railYear}>{t('page.lignee.rail.circa', { year: formatYear(epoch, reading) })}</span>
                ) : null}
              </li>
            );
          })}
        </ol>


        {children}
      </div>
    </div>
  );
}
