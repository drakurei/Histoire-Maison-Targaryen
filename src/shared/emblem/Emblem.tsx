import type { CSSProperties } from 'react';
import { EMBLEM_PARTS, EMBLEM_VIEWBOX } from './paths';

interface EmblemProps {
  /** Taille CSS du côté ; par défaut l'emblème remplit son conteneur. */
  size?: string;
  className?: string;
  style?: CSSProperties;
  /** Nom accessible. Sans lui, l'emblème est décoratif. */
  title?: string;
}

/**
 * L'emblème du site : dragon tricéphale original, dessiné par `design/emblem/D-build.mjs`.
 * Une seule couleur (`currentColor`). Chaque tracé porte `data-part` (tail, body, wings, heads)
 * pour que l'écran d'ouverture puisse le tracer partie par partie.
 */
export function Emblem({ size, className, style, title }: EmblemProps) {
  return (
    <svg
      viewBox={EMBLEM_VIEWBOX}
      width={size}
      height={size}
      className={className}
      style={style}
      fill="currentColor"
      fillRule="evenodd"
      role={title ? 'img' : undefined}
      aria-label={title}
      aria-hidden={title ? undefined : true}
      focusable="false"
    >
      {EMBLEM_PARTS.map(({ part, paths }) => (
        <g key={part} data-part={part}>
          {paths.map((d, i) => (
            <path key={i} d={d} data-part={part} />
          ))}
        </g>
      ))}
    </svg>
  );
}
