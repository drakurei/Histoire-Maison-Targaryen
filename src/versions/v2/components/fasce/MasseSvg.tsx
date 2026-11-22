import { useId, useMemo } from 'react';

import { yearToX } from '@/core/timeline';
import type { TimeScale } from '@/core/timeline';

import { stepArea, yearEdges } from '../../model/geometry';
import { PEAK, presence, VALYRIA } from '../../state/scene';

export interface MasseSvgProps {
  /** Échelle de la figure, de 0 à `width`. */
  scale: TimeScale;
  width: number;
  height: number;
  /** Hauteur, en pixels, de quinze dragons (le maximum). Par défaut, toute la hauteur. */
  full?: number;
  /** Durée de la vue : sang dedans, cramoisi dehors. */
  span?: readonly [number, number] | null;
  /** Toute la masse en cramoisi : le temps ne s'applique pas. */
  off?: boolean;
  className?: string;
}

type Tone = 'sang' | 'cramoisi';

interface Shapes {
  solid: string;
  doubt: string;
  valyria: { x: number; width: number } | null;
}

/** Les tracés de la masse dans l'étendue de l'échelle. */
function shapesOf(scale: TimeScale, width: number, height: number, full: number): Shapes {
  const [from, to] = scale.domain;
  const perDragon = full / PEAK;
  const y = (value: number) => height - value * perDragon;
  const years = presence.years.filter((entry) => entry.year >= from && entry.year <= to);
  const solid = stepArea(
    years.map((entry) => ({ year: entry.year, value: entry.attested.length })),
    scale,
    y,
    height,
  );
  const doubt = stepArea(
    years.map((entry) => ({ year: entry.year, value: entry.doubtful.length > 0 ? entry.attested.length + entry.doubtful.length : 0 })),
    scale,
    y,
    height,
  );
  let valyria: Shapes['valyria'] = null;
  if (VALYRIA[0] <= to && VALYRIA[1] >= from) {
    const x0 = Math.max(0, yearToX(scale, Math.max(from, VALYRIA[0])));
    const x1 = Math.min(width, yearEdges(scale, Math.min(to, VALYRIA[1]))[1]);
    if (x1 > x0) valyria = { x: x0, width: x1 - x0 };
  }
  return { solid, doubt, valyria };
}

/**
 * La masse rouge : dragons vivants attestés en aplat, sort inconnu en hachure posée sur la
 * masse, Valyria (jamais comptée) en hachure pleine hauteur, sans contour, qui s'efface vers
 * le bord gauche et s'arrête net au Fléau. Dessin seul, sans geste : la fasce, le profil, les
 * petits profils de l'Index et la masse en majesté la réutilisent.
 */
export function MasseSvg({ scale, width, height, full = height, span = null, off = false, className }: MasseSvgProps) {
  const uid = useId().replace(/[^a-zA-Z0-9]/g, '');
  const shapes = useMemo(() => shapesOf(scale, width, height, full), [scale, width, height, full]);

  if (width <= 0 || height <= 0) return null;

  const fadeEnd = shapes.valyria ? shapes.valyria.x + shapes.valyria.width * 0.55 : 0;
  const clip = span ? [yearToX(scale, span[0]), yearEdges(scale, span[1])[1]] : null;
  const dimmed = off || span !== null;

  const layer = (tone: Tone, clipId?: string) => (
    <g clipPath={clipId ? `url(#${clipId})` : undefined} style={{ fill: `var(--${tone})` }}>
      {shapes.valyria ? (
        <rect
          x={shapes.valyria.x}
          y={0}
          width={shapes.valyria.width}
          height={height}
          fill={`url(#${uid}h${tone})`}
          mask={`url(#${uid}fade)`}
        />
      ) : null}
      {shapes.doubt ? <path d={shapes.doubt} fill={`url(#${uid}h${tone})`} /> : null}
      {shapes.solid ? <path d={shapes.solid} shapeRendering="crispEdges" /> : null}
    </g>
  );

  return (
    <svg
      className={className}
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      aria-hidden="true"
      focusable="false"
    >
      <defs>
        {(['sang', 'cramoisi'] as const).map((tone) => (
          <pattern
            key={tone}
            id={`${uid}h${tone}`}
            width={4}
            height={4}
            patternUnits="userSpaceOnUse"
            patternTransform="rotate(45)"
          >
            <rect width={1.6} height={4} style={{ fill: `var(--${tone})` }} />
          </pattern>
        ))}
        {shapes.valyria ? (
          <>
            <linearGradient id={`${uid}g`} gradientUnits="userSpaceOnUse" x1={shapes.valyria.x} x2={fadeEnd} y1={0} y2={0}>
              <stop offset="0" stopColor="rgb(255, 255, 255)" stopOpacity={0} />
              <stop offset="1" stopColor="rgb(255, 255, 255)" stopOpacity={1} />
            </linearGradient>
            <mask id={`${uid}fade`} maskUnits="userSpaceOnUse" x={0} y={0} width={width} height={height}>
              <rect x={0} y={0} width={width} height={height} fill={`url(#${uid}g)`} />
            </mask>
          </>
        ) : null}
        {clip ? (
          <clipPath id={`${uid}c`}>
            <rect x={clip[0]} y={0} width={Math.max(1, (clip[1] ?? 0) - (clip[0] ?? 0))} height={height} />
          </clipPath>
        ) : null}
      </defs>
      {layer(dimmed ? 'cramoisi' : 'sang')}
      {clip && !off ? layer('sang', `${uid}c`) : null}
    </svg>
  );
}
