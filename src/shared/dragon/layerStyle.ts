import type { CSSProperties } from 'react';
import type { DragonLayer } from './layers';

/** Style React d'une couche du dragon (même recette que `layerCss`, pour un SVG écrit à la main). */
export function layerStyle(item: DragonLayer): CSSProperties {
  const style: CSSProperties = { fill: item.fill };
  if (item.stroke !== 'none') {
    style.stroke = item.stroke;
    style.strokeWidth = item.strokeWidth;
    style.strokeLinejoin = 'round';
    style.strokeLinecap = 'round';
    if (item.strokeUnder) style.paintOrder = 'stroke';
  }
  if (item.opacity < 1) style.opacity = item.opacity;
  return style;
}
