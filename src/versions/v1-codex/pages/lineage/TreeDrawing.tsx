import { memo, useMemo } from 'react';
import type { KeyboardEvent, RefObject } from 'react';

import { unions as allUnions } from '@/core/content/people';
import type { Person, SupportLang, Union } from '@/core/content/types';
import type { LayoutLink, LayoutNode, LayoutUnion, Point } from '@/core/genealogy';
import { CrownGlyph } from '@/shared/marks/Marks';

import { CROWNED, edgeKey, graph, LOOPS, marriedIn, RULING_EDGES, shortName, treeYears } from './model';
import styles from './TreeDrawing.module.css';

const unionById: ReadonlyMap<string, Union> = new Map(allUnions.map((union) => [union.id, union]));

export interface Drawing {
  nodes: readonly LayoutNode[];
  unions: readonly LayoutUnion[];
  links: readonly LayoutLink[];
  width: number;
  height: number;
}

interface TreeDrawingProps {
  drawing: Drawing;
  reading: SupportLang;
  selected: string | null;
  showLoops: boolean;
  /** Échelle d'écriture : `tree` pour le rouleau, `thread` pour le fil du téléphone (cases plus petites). */
  scale?: 'tree' | 'thread';
  /** Rôle de chaque case du fil (`thread`, `partner`, `child`). */
  roles?: ReadonlyMap<string, string>;
  onActivate: (id: string) => void;
  onKey?: (event: KeyboardEvent<SVGGElement>, id: string) => void;
  /** Personne qui porte le seul arrêt de tabulation de l'arbre ; absent, chaque case en est un. */
  tabStop?: string | null;
  dragged?: RefObject<boolean>;
  /** Libellé accessible de chaque case. */
  describe: (person: Person) => string;
}

export function pathOf(points: readonly Point[]): string {
  return points.map((point, index) => `${index === 0 ? 'M' : 'L'}${point.x.toFixed(1)} ${point.y.toFixed(1)}`).join('');
}

/** Parents réels d'un trait de filiation : les deux conjoints d'une union, ou le parent seul. */
function parentsOfLink(link: LayoutLink, unionByLayoutId: ReadonlyMap<string, LayoutUnion>): string[] {
  if (link.fromKind === 'person') return [link.from];
  const union = unionByLayoutId.get(link.from);
  return union ? [union.a, union.b] : [];
}

function onEdges(link: LayoutLink, parents: readonly string[], edges: ReadonlySet<string>): boolean {
  return parents.some((parent) => edges.has(edgeKey(parent, link.to)));
}

/**
 * L'arbre tracé à l'encre : filiations, crochets d'union, points d'union, noms. Les souverains
 * sont inscrits dans un double médaillon d'or sombre et couronnés ; ceux qui sont entrés dans
 * la famille par alliance sont écrits à l'encre pâle, en italique. Le sang de la couronne est
 * un trait rouge épais ; une union consanguine porte un nœud rouge et, quand on la montre, la
 * boucle de filiation qu'elle referme.
 */
export const TreeDrawing = memo(function TreeDrawing({
  drawing,
  reading,
  selected,
  showLoops,
  scale = 'tree',
  roles,
  onActivate,
  onKey,
  tabStop,
  dragged,
  describe,
}: TreeDrawingProps) {
  const unionByLayoutId = useMemo(() => new Map(drawing.unions.map((union) => [union.id, union])), [drawing.unions]);
  const generationOf = useMemo(() => new Map(drawing.nodes.map((node) => [node.id, node.generation])), [drawing.nodes]);

  /** Enfants de chaque point d'union, pour savoir si un crochet porte le sang de la couronne. */
  const childrenOfUnion = useMemo(() => {
    const map = new Map<string, string[]>();
    for (const link of drawing.links) {
      if (link.fromKind !== 'union') continue;
      map.set(link.from, [...(map.get(link.from) ?? []), link.to]);
    }
    return map;
  }, [drawing.links]);

  const loopEdges = useMemo(() => {
    const set = new Set<string>();
    const add = (unionId: string | null) => {
      for (const edge of (unionId && LOOPS.get(unionId)) || []) set.add(edge);
    };
    if (showLoops) for (const unionId of LOOPS.keys()) add(unionId);
    else if (selected) for (const unionId of graph.unionIds.get(selected) ?? []) add(unionId);
    return set;
  }, [selected, showLoops]);

  const loopUnions = useMemo(() => {
    if (showLoops) return new Set(LOOPS.keys());
    return new Set((selected ? (graph.unionIds.get(selected) ?? []) : []).filter((id) => LOOPS.has(id)));
  }, [selected, showLoops]);

  const textSize = scale === 'thread' ? { name: 13.5, small: 11.5, years: 9.5 } : { name: 15, small: 15, years: 10.5 };

  return (
    <g className={styles.drawing} data-scale={scale}>
      {/* Filiations : l'encre, puis les boucles, puis le sang de la couronne par-dessus. */}
      <g className={styles.links}>
        {drawing.links.map((link) => {
          const parents = parentsOfLink(link, unionByLayoutId);
          const ruling = onEdges(link, parents, RULING_EDGES);
          const doubtful = link.certainty === 'legende' || link.certainty === 'contradictoire';
          const loop = onEdges(link, parents, loopEdges);
          return (
            <path
              key={`${link.from}>${link.to}`}
              className={styles.link}
              d={pathOf(link.points)}
              data-ruling={ruling || undefined}
              data-doubt={doubtful || undefined}
              data-loop={loop || undefined}
              data-gen={generationOf.get(link.to)}
            />
          );
        })}
      </g>

      <g className={styles.unions}>
        {drawing.unions.map((union) => {
          const record = union.unionId ? unionById.get(union.unionId) : undefined;
          const children = childrenOfUnion.get(union.id) ?? [];
          const looped = union.unionId !== null && loopUnions.has(union.unionId);
          return (
            <g key={union.id} data-kind={record?.type ?? 'mariage'} data-consanguine={union.consanguineous || undefined} data-loop={looped || undefined}>
              {union.ties.map((tie) => {
                const ruling = children.some((child) => RULING_EDGES.has(edgeKey(tie.person, child)));
                return (
                  <path
                    key={`${union.id}-${tie.person}`}
                    className={styles.tie}
                    d={pathOf(tie.points)}
                    data-ruling={ruling || undefined}
                    data-route={tie.route}
                  />
                );
              })}
              {union.consanguineous ? (
                <>
                  <circle className={styles.knot} cx={union.x} cy={union.y} r={5} />
                  <circle className={styles.knotCore} cx={union.x} cy={union.y} r={1.9} />
                </>
              ) : (
                <circle className={styles.point} cx={union.x} cy={union.y} r={3.2} />
              )}
            </g>
          );
        })}
      </g>

      <g className={styles.nodes}>
        {drawing.nodes.map((node) => {
          const person = graph.personById.get(node.id);
          if (!person) return null;
          const crowned = CROWNED.has(person.id);
          const role = roles?.get(node.id);
          const small = role === 'child';
          const cx = node.x + node.w / 2;
          const years = treeYears(person, reading);
          const nameY = node.y + (crowned ? node.h * 0.64 : node.h * 0.5) + (years ? 0 : 4);
          const isSelected = selected === person.id;
          return (
            <g
              key={`${node.id}-${node.x}-${node.y}`}
              className={styles.node}
              data-person={person.id}
              data-crowned={crowned || undefined}
              data-married-in={marriedIn(person.id) || undefined}
              data-selected={isSelected || undefined}
              data-role={role}
              role="button"
              tabIndex={tabStop === undefined || tabStop === person.id ? 0 : -1}
              aria-label={describe(person)}
              aria-pressed={isSelected}
              onClick={() => {
                if (dragged?.current) return;
                onActivate(person.id);
              }}
              onKeyDown={onKey ? (event) => onKey(event, person.id) : undefined}
            >
              <rect className={styles.hit} x={node.x} y={node.y} width={node.w} height={node.h} />
              {isSelected ? (
                <ellipse className={styles.selection} cx={cx} cy={node.y + node.h / 2} rx={node.w / 2 + 8} ry={node.h / 2 + 5} />
              ) : null}
              {crowned ? (
                <>
                  <ellipse className={styles.medal} cx={cx} cy={node.y + node.h / 2} rx={node.w / 2 + 4} ry={node.h / 2 + 2} />
                  <g transform={`translate(${cx - 7} ${node.y + 2})`} className={styles.crown}>
                    <CrownGlyph size="14" />
                  </g>
                </>
              ) : null}
              <rect className={styles.ring} x={node.x - 3} y={node.y - 3} width={node.w + 6} height={node.h + 6} />
              <text className={styles.name} x={cx} y={nameY} fontSize={small ? textSize.small : textSize.name}>
                {shortName(person, reading)}
              </text>
              {years ? (
                <text className={styles.years} x={cx} y={nameY + (small ? 11 : 14)} fontSize={textSize.years}>
                  {years}
                </text>
              ) : null}
            </g>
          );
        })}
      </g>
    </g>
  );
});
