import { useLayoutEffect, useMemo, useState } from 'react';
import type { CSSProperties, RefObject } from 'react';

import { useT } from '@/core/i18n';

import { GrandNombre } from '../../components/GrandNombre';
import { Profil } from '../../components/Profil';
import { Carte } from '../../components/Carte';
import { useElementWidth } from '../../components/useElementWidth';
import { presence } from '../../state/scene';

import { useViewportHeight } from './hooks';
import { NombreSurProfil } from './NombreSurProfil';
import type { Nombre } from './NombreSurProfil';
import styles from './TempsVue.module.css';

/** La durée porte-t-elle au moins un dragon, attesté ou au sort inconnu ? Sinon, pas de profil. */
export function hasDragons(span: readonly [number, number] | null): boolean {
  return (
    span !== null &&
    presence.years.some((entry) => entry.year >= span[0] && entry.year <= span[1] && (entry.attested.length > 0 || entry.doubtful.length > 0))
  );
}

/**
 * Quinze dragons valent 45 % de la colonne telle qu'on la voit en arrivant : de son haut,
 * sous l'en-tête de la vue, jusqu'à la fasce (environ 100 px sur ordinateur). Mesuré sur la
 * fenêtre entière, le profil montait sur la carte et en couvrait les noms à 1280 x 800.
 */
function profileHeightOf(viewport: number, tete: number): number {
  return Math.round(Math.max(280, viewport - 100 - tete) * 0.45);
}

/**
 * Distance du haut du document au haut de la colonne. La carte colle à cette hauteur et ne
 * bouge plus : elle tient entre l'en-tête et le profil dès l'arrivée, sans que le profil la
 * recouvre. Bornée au tiers de la fenêtre pour qu'un long en-tête n'écrase pas la carte.
 */
function useTete(ref: RefObject<HTMLElement | null>, viewport: number): number {
  const [tete, setTete] = useState(0);
  useLayoutEffect(() => {
    const node = ref.current;
    if (!node) return;
    let alive = true;
    const measure = () => {
      if (!alive) return;
      const top = Math.max(0, Math.round(Math.min(viewport / 3, node.getBoundingClientRect().top + window.scrollY)));
      setTete((current) => (Math.abs(current - top) < 1 ? current : top));
    };
    measure();
    void document.fonts.ready.then(measure);
    window.addEventListener('resize', measure);
    return () => {
      alive = false;
      window.removeEventListener('resize', measure);
    };
  }, [ref, viewport]);
  return tete;
}

interface TempsVueProps {
  span: readonly [number, number] | null;
  placeIds: readonly string[];
  highlightIds?: ReadonlySet<string> | null;
  mapTitle: string;
  /** Le grand nombre de la vue, posé sur le profil ; absent pour une vue qui le porte ailleurs. */
  nombre?: Nombre | null;
}

/**
 * Ordinateur : la colonne du temps et de l'espace du parti (spec §2.4), composée ici de la
 * carte et du profil plutôt que par `TempsEspace`, pour que le profil soit soudé à la fasce
 * dès l'arrivée et non seulement après un défilement : la carte colle sous l'en-tête, à la
 * hauteur où elle est arrivée, le profil colle au-dessus de la fasce, et les deux ne se
 * recouvrent jamais (audit V2). Le grand nombre est évidé dans le profil. Sans dragon dans la durée (la Chute),
 * pas de profil : la carte prend toute la colonne et le nombre s'écrit en ivoire à son pied.
 */
export function TempsVue({ span, placeIds, highlightIds = null, mapTitle, nombre = null }: TempsVueProps) {
  const t = useT();
  const [ref, width] = useElementWidth<HTMLDivElement>();
  const viewport = useViewportHeight();
  const profiled = useMemo(() => hasDragons(span), [span]);
  const tete = useTete(ref, viewport);
  const full = profileHeightOf(viewport, tete);
  const pose = { '--v2-tete': `${tete}px`, ...(profiled ? { '--v2-profil': `${full}px` } : {}) } as CSSProperties;

  return (
    <div ref={ref} className={styles.pile} style={pose} data-sans-profil={profiled ? undefined : ''}>
      <div className={styles.carte}>
        <Carte title={mapTitle} placeIds={placeIds.length > 0 ? placeIds : undefined} highlightIds={highlightIds} />
      </div>
      {nombre && !profiled ? (
        <div className={`${styles.socle} ${styles.socleSeul}`}>
          <GrandNombre value={nombre.value} era={nombre.era} />
          {span ? <p className={styles.sansDragon}>{t('v2.period.no_dragons')}</p> : null}
        </div>
      ) : null}
      {span && profiled && width > 0 ? (
        <div className={styles.socle} style={{ height: full }}>
          <div className={styles.socleProfil} aria-hidden="true">
            <Profil from={span[0]} to={span[1]} width={width} height={full} full={full} />
          </div>
          {nombre ? (
            <div className={styles.socleNombre}>
              <NombreSurProfil from={span[0]} to={span[1]} width={width} full={full} {...nombre} />
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

interface ProfilTelProps {
  span: readonly [number, number];
  nombre: Nombre;
}

/**
 * Téléphone : le profil de la durée sur toute la largeur (28 svh), le grand nombre évidé
 * dedans. Sans dragon, le nombre seul, en ivoire.
 */
export function ProfilTel({ span, nombre }: ProfilTelProps) {
  const t = useT();
  const [ref, width] = useElementWidth<HTMLDivElement>();
  const viewport = useViewportHeight();
  const height = Math.round(viewport * 0.28);
  const profiled = useMemo(() => hasDragons(span), [span]);

  if (!profiled) {
    return (
      <div className={styles.seulTel}>
        <GrandNombre value={nombre.value} era={nombre.era} />
        <p className={styles.sansDragon}>{t('v2.period.no_dragons')}</p>
      </div>
    );
  }
  return (
    <div ref={ref} className={styles.tel} style={{ height }}>
      {width > 0 ? (
        <>
          <div className={styles.telProfil} aria-hidden="true">
            <Profil from={span[0]} to={span[1]} width={width} height={height} full={height} />
          </div>
          <div className={styles.telNombre}>
            <NombreSurProfil from={span[0]} to={span[1]} width={width} full={height} {...nombre} />
          </div>
        </>
      ) : null}
    </div>
  );
}
