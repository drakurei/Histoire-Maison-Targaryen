import { useMemo, useRef } from 'react';
import type { DragonLook } from '@/core/content/types';
import { buildDragon } from '@/core/dragons/geometry';
import type { DragonParts } from '@/core/dragons/geometry';
import { MOTION_CONDITIONS, gsap, useGSAP } from '@/core/motion';
import { dragonLayers, layerPath } from './layers';
import { layerStyle } from './layerStyle';
import type { DragonDetail, DragonGround, DragonKnown, DragonTone } from './layers';
import styles from './DragonFigure.module.css';

export interface DragonFigureProps {
  look: DragonLook;
  /** Nom accessible de la figure (déjà traduit par l'appelant). */
  title: string;
  /** Phase du battement, 0 à 1. 0 : ailes étendues. Point de départ si `animate`. */
  flap?: number;
  /** Fait battre les ailes en boucle. Sans effet si le lecteur demande un mouvement réduit : ailes ouvertes, figées. */
  animate?: boolean;
  /** `specimen` : aplats du look. `engraving` : trait et hachures. `shadow` : silhouette. */
  tone?: DragonTone;
  /** Surface sous le spécimen : `light` (vélin) ou `dark` (obsidienne). Décide du liseré. */
  ground?: DragonGround;
  /**
   * Ce que les livres ne décrivent pas (`look.attested`) : `tinted` le peint de la teinte neutre
   * du look, `bare` le laisse au trait, comme la partie inconnue d'un spécimen.
   */
  unattested?: 'tinted' | 'bare';
  /**
   * `fine` : hachures, carènes et arêtes, pour une planche. `plain` : aplats et contour épaissi,
   * pour une vignette (en dessous de 240 px de large environ) ou une grille de nombreux dragons.
   */
  detail?: DragonDetail;
  /** Roulis, de -1 à 1. */
  bank?: number;
  /** Courbure du cou, de -1 à 1. */
  neckCurve?: number;
  /** Ondulation de la queue, de -1 à 1. */
  tailCurve?: number;
  /** Durée d'un battement, en secondes. Par défaut, d'autant plus lent que le dragon est grand. */
  beat?: number;
  /** Plané entre deux battements, en fraction de la durée d'un battement. */
  glide?: number;
  className?: string;
}

/**
 * Le dragon du musée, vu du dessus, dessiné par `core/dragons/geometry`.
 * Le battement recalcule les tracés des ailes à chaque image (le poignet plie, les doigts
 * se resserrent) : il ne passe ni par une mise à l'échelle ni par un filtre.
 */
export function DragonFigure({
  look,
  title,
  flap = 0,
  animate = false,
  tone = 'specimen',
  ground = 'light',
  unattested = 'tinted',
  detail = 'fine',
  bank = 0,
  neckCurve = 0.16,
  tailCurve = 0.34,
  beat,
  glide = 0.3,
  className,
}: DragonFigureProps) {
  const root = useRef<SVGSVGElement>(null);
  const nodes = useRef<(SVGPathElement | null)[]>([]);

  const { span, neck, tail, horns, body, wing, crest, flame } = look;
  const shape = useMemo(() => ({ span, neck, tail, horns }), [span, neck, tail, horns]);
  const bare = unattested === 'bare';
  const { body: knownBody, wing: knownWing, crest: knownCrest, flame: knownFlame } = look.attested;
  const layers = useMemo(() => {
    const known: DragonKnown = bare ? { body: knownBody, wing: knownWing, crest: knownCrest, flame: knownFlame } : {};
    return dragonLayers({ body, wing, crest, flame }, tone, ground, known, detail);
  }, [body, wing, crest, flame, tone, ground, detail, bare, knownBody, knownWing, knownCrest, knownFlame]);
  const still = useMemo(() => buildDragon(shape, { flap, bank, neckCurve, tailCurve }), [shape, flap, bank, neckCurve, tailCurve]);
  const duration = beat ?? 1.5 + 2.3 * Math.sqrt(Math.max(span, 0.05));

  useGSAP(
    () => {
      const paint = (parts: DragonParts, wingsOnly: boolean) => {
        layers.forEach((item, i) => {
          if (wingsOnly && !item.wing) return;
          nodes.current[i]?.setAttribute('d', layerPath(item, parts));
        });
      };
      // Les tracés sont écrits ici à chaque changement de props : après un arrêt de
      // l'animation, la figure retrouve sa pose de repos.
      paint(still.parts, false);
      if (!animate) return;

      const svg = root.current;
      const mm = gsap.matchMedia();
      mm.add(MOTION_CONDITIONS, (context) => {
        if (context.conditions?.reduced) {
          paint(buildDragon(shape, { flap: 0, bank, neckCurve, tailCurve }).parts, true);
          return undefined;
        }
        const state = { phase: flap };
        const tween = gsap.to(state, {
          phase: flap + 1,
          duration,
          ease: 'sine.inOut',
          repeat: -1,
          repeatDelay: duration * Math.max(0, glide),
          onUpdate: () => paint(buildDragon(shape, { flap: state.phase, bank, neckCurve, tailCurve }).parts, true),
        });
        // Hors écran, on ne calcule rien.
        if (!svg || typeof IntersectionObserver === 'undefined') return undefined;
        const watcher = new IntersectionObserver((entries) => {
          tween.paused(!entries.some((entry) => entry.isIntersecting));
        });
        watcher.observe(svg);
        return () => watcher.disconnect();
      });
    },
    { scope: root, dependencies: [animate, still, layers, shape, flap, bank, neckCurve, tailCurve, duration, glide], revertOnUpdate: true },
  );

  const classes = [styles.figure, className].filter(Boolean).join(' ');

  return (
    <svg
      ref={root}
      className={classes}
      viewBox={still.viewBox}
      role="img"
      aria-label={title}
      data-tone={tone}
      data-ground={ground}
      preserveAspectRatio="xMidYMid meet"
    >
      <title>{title}</title>
      {layers.map((item, i) => (
        <path
          key={item.key}
          ref={(el) => {
            nodes.current[i] = el;
          }}
          d={layerPath(item, still.parts)}
          style={layerStyle(item)}
        />
      ))}
    </svg>
  );
}
