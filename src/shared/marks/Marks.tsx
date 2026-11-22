import type { ReactNode } from 'react';
import type { Reliability } from '@/core/content/types';

/**
 * Les marques du musée. Grille de 16, trait de 1.5, `currentColor`.
 * Décoratives par défaut (`aria-hidden`) : le libellé est toujours écrit à côté.
 *
 * Fiabilité : moins il y a d'encre, moins le fait est sûr.
 *   établi          disque plein
 *   récit unique    anneau et un seul point (une seule voix)
 *   contradictoire  disque fendu, les deux moitiés décalées
 *   légende         anneau en pointillé (rien ne le tient)
 *   adaptation      cadre d'écran (une autre continuité)
 */

interface GlyphProps {
  /** Taille CSS ; par défaut la hauteur de la ligne de texte. */
  size?: string;
  className?: string;
  title?: string;
}

function Svg({ size = '1em', className, title, children }: GlyphProps & { children: ReactNode }) {
  return (
    <svg
      viewBox="0 0 16 16"
      width={size}
      height={size}
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      strokeLinecap="butt"
      strokeLinejoin="miter"
      role={title ? 'img' : undefined}
      aria-hidden={title ? undefined : true}
      aria-label={title}
      focusable="false"
    >
      {children}
    </svg>
  );
}

const RELIABILITY_SHAPES: Record<Reliability, ReactNode> = {
  etabli: <circle cx="8" cy="8" r="5.25" fill="currentColor" />,
  'recit-unique': (
    <>
      <circle cx="8" cy="8" r="5.25" />
      <circle cx="8" cy="8" r="1.6" fill="currentColor" stroke="none" />
    </>
  ),
  contradictoire: (
    <>
      <path d="M7 1.75a5.25 5.25 0 0 0 0 10.5z" fill="currentColor" />
      <path d="M9 3.75a5.25 5.25 0 0 1 0 10.5z" />
    </>
  ),
  legende: <circle cx="8" cy="8" r="5.25" strokeDasharray="2.2 2.2" />,
  adaptation: (
    <>
      <path d="M2.25 3.75h11.5v7.5H2.25z" />
      <path d="M5.5 13.75h5" />
    </>
  ),
};

export function ReliabilityGlyph({ level, ...rest }: GlyphProps & { level: Reliability }) {
  return <Svg {...rest}>{RELIABILITY_SHAPES[level]}</Svg>;
}

/**
 * La couronne d'Aegon le Conquérant telle que les livres la décrivent :
 * un simple bandeau d'acier valyrien serti de rubis carrés. Pas de fleurons.
 */
export function CrownGlyph(props: GlyphProps) {
  return (
    <Svg {...props}>
      <path d="M1.75 5.25h12.5v5.5H1.75z" />
      <path d="M3.9 6.9h2.2v2.2H3.9zM6.9 6.9h2.2v2.2H6.9zM9.9 6.9h2.2v2.2H9.9z" fill="currentColor" stroke="none" />
    </Svg>
  );
}

/** Continuité des livres : un cahier ouvert vu de la tranche. */
export function BookGlyph(props: GlyphProps) {
  return (
    <Svg {...props}>
      <path d="M8 4.5C6.4 3.2 4.3 2.9 2.25 3.25v8.5C4.3 11.4 6.4 11.7 8 13c1.6-1.3 3.7-1.6 5.75-1.25v-8.5C11.7 2.9 9.6 3.2 8 4.5z" />
      <path d="M8 4.5V13" />
    </Svg>
  );
}

/** Dragon monté : une aile, trois doigts. Signale un cavalier de dragon dans les index. */
export function WingGlyph(props: GlyphProps) {
  return (
    <Svg {...props}>
      <path d="M1.5 13.5C3.2 7.2 7.6 3.4 14.5 2.5l-1.6 4.1c-1.2-.3-2.3.1-3 1.1l-.5 3c-1.1-.5-2.2-.2-3 .7l-.9 2.6c-1.2-.9-2.6-1-4-.5z" fill="currentColor" stroke="none" />
    </Svg>
  );
}

/**
 * Poinçon du relieur : J et D partagent le même fût, dans un cartouche carré.
 * Signature du créateur, à n'employer que dans le colophon et au dos de l'emblème.
 */
export function HallmarkJD({ size = '1.5em', className, title }: GlyphProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      strokeLinejoin="miter"
      role={title ? 'img' : undefined}
      aria-hidden={title ? undefined : true}
      aria-label={title}
      focusable="false"
    >
      <path d="M2.75 2.75h18.5v18.5H2.75z" />
      {/* Le fût commun, puis la panse du D à droite et la crosse du J à gauche. */}
      <path d="M11.5 6v9.5" strokeWidth={2} />
      <path d="M11.5 6h1.75a5 5 0 0 1 0 10H11.5" />
      <path d="M11.5 15.5a2.75 2.75 0 0 1-5.5 0" />
      <path d="M8.5 6h3" />
    </svg>
  );
}
