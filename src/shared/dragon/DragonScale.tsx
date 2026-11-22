import { useMemo } from 'react';
import type { DragonLook } from '@/core/content/types';
import { buildDragon } from '@/core/dragons/geometry';
import { humanFigure, layoutDragonScale } from '@/core/dragons/scale';
import type { ScaleOptions } from '@/core/dragons/scale';
import { dragonLayers, layerPath } from './layers';
import { layerStyle } from './layerStyle';
import type { DragonDetail, DragonGround, DragonTone } from './layers';
import styles from './DragonScale.module.css';

export interface DragonScaleEntry {
  id: string;
  look: DragonLook;
  /** Nom accessible du dragon (déjà traduit par l'appelant). */
  title: string;
}

export interface DragonScaleProps {
  dragons: readonly DragonScaleEntry[];
  /** Nom accessible de la figure entière. */
  title: string;
  /** Nom accessible du repère humain. */
  humanTitle: string;
  /** Taille de l'homme rapportée à l'envergure de Balerion. Hypothèse éditoriale : voir `HUMAN_RATIO`. */
  humanRatio?: ScaleOptions['humanRatio'];
  /** Espace entre deux envergures, en fraction de l'envergure de Balerion. */
  gap?: ScaleOptions['gap'];
  /** Ordre des dragons : du plus grand au plus petit par défaut. */
  order?: ScaleOptions['order'];
  tone?: DragonTone;
  ground?: DragonGround;
  /** `bare` : ce que les livres ne décrivent pas est laissé au trait (voir `DragonFigure`). */
  unattested?: 'tinted' | 'bare';
  /** Niveau de détail. Par défaut `plain` : à cette échelle, les hachures passeraient sous le pixel. */
  detail?: DragonDetail;
  /** Dragon mis en avant : les autres s'effacent à demi. */
  activeId?: string;
  className?: string;
}

/**
 * Échelle comparée : les dragons côte à côte, épaules sur une même ligne, chacun à l'échelle
 * de son envergure, et un homme debout pour repère.
 *
 * Les légendes vivent en dehors du composant. Pour les aligner sous chaque dragon, la page
 * appelle `layoutDragonScale` (même entrée, mêmes options) : `centerX / width` donne la
 * position horizontale de chaque colonne. Chaque groupe porte aussi `data-dragon`.
 */
export function DragonScale({
  dragons,
  title,
  humanTitle,
  humanRatio,
  gap,
  order,
  tone = 'specimen',
  ground = 'light',
  unattested = 'tinted',
  detail = 'plain',
  activeId,
  className,
}: DragonScaleProps) {
  const layout = useMemo(
    () =>
      layoutDragonScale(
        dragons.map((d) => ({ id: d.id, look: d.look })),
        { humanRatio, gap, order },
      ),
    [dragons, humanRatio, gap, order],
  );
  const figures = useMemo(() => {
    const byId = new Map(dragons.map((d) => [d.id, d]));
    return layout.items.flatMap((item) => {
      const entry = byId.get(item.id);
      if (!entry) return [];
      const geometry = buildDragon(entry.look, { flap: 0, tailCurve: 0.3, neckCurve: 0.12 });
      const paths = dragonLayers(entry.look, tone, ground, unattested === 'bare' ? entry.look.attested : {}, detail).map((part) => ({
        key: part.key,
        d: layerPath(part, geometry.parts),
        style: layerStyle(part),
      }));
      return [{ item, title: entry.title, viewBox: geometry.viewBox, paths }];
    });
  }, [dragons, layout, tone, ground, unattested, detail]);

  const man = humanFigure();
  const manHeight = layout.human.height;
  const manWidth = (manHeight * man.width) / man.height;
  const classes = [styles.scale, className].filter(Boolean).join(' ');

  return (
    <svg className={classes} viewBox={`0 0 ${layout.width} ${layout.height}`} role="img" aria-label={title} data-tone={tone} data-ground={ground}>
      <title>{title}</title>
      {figures.map(({ item, title: name, viewBox, paths }) => (
        <svg
          key={item.id}
          x={item.x}
          y={item.y}
          width={item.width}
          height={item.height}
          viewBox={viewBox}
          className={activeId !== undefined && activeId !== item.id ? styles.dimmed : styles.item}
          data-dragon={item.id}
        >
          <title>{name}</title>
          {paths.map((path) => (
            <path key={path.key} d={path.d} style={path.style} />
          ))}
        </svg>
      ))}
      <svg
        x={layout.human.x - manWidth / 2}
        y={layout.human.y - manHeight}
        width={manWidth}
        height={manHeight}
        viewBox={`0 0 ${man.width} ${man.height}`}
        className={styles.human}
      >
        <title>{humanTitle}</title>
        <path d={man.d} />
      </svg>
    </svg>
  );
}
