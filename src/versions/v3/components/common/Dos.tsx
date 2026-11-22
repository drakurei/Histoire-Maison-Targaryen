import type { CSSProperties, MouseEvent } from 'react';

import type { Period } from '@/core/content/types';
import { formatSpan, useLang, useTitle, VALYRIAN_TAG } from '@/core/i18n';
import { Lien } from '@/versions/v2/components/Lien';
import { toRoman } from '@/versions/v2/components/numerals';
import { Profil } from '@/versions/v2/components/Profil';
import { boundsOf } from '@/versions/v2/state/scene';

import styles from './Dos.module.css';

interface DosProps {
  period: Period;
  /** Chemin interne (sans préfixe) : le dos devient un lien. */
  to?: string;
  onClick?: (event: MouseEvent<HTMLAnchorElement>) => void;
  /** Le petit profil rouge de la période, à droite (Index, introuvable). */
  profil?: boolean;
  /** La période contient l'année réglée : le chiffre passe à l'or. */
  actif?: boolean;
  className?: string;
}

const PROFIL_W = 168;
const PROFIL_H = 30;

/**
 * Un dos de cuir couché (v3-spec §3.3) : une rangée de 64 px teinte du cuir de la période,
 * deux nerfs plus sombres comme sur un vrai dos, le chiffre en Grenze Gotisch, le titre
 * valyrien en Texturina et sa glose, les années, et à droite, au besoin, le profil rouge
 * de la période (quinze dragons valent toute sa hauteur). Ni rayon ni cadre.
 */
export function Dos({ period, to, onClick, profil = false, actif = false, className }: DosProps) {
  const title = useTitle();
  const { reading } = useLang();
  const name = title(period.title);
  const [from, to2] = boundsOf(period);
  const style = { '--cuir': `var(--v3-cuir-${period.order})` } as CSSProperties;

  const contenu = (
    <>
      <span className={styles.chiffre} aria-hidden="true">
        {toRoman(period.order)}
      </span>
      <span className={styles.nom}>
        <span className={styles.hv} lang={name.isHv ? VALYRIAN_TAG : undefined}>
          {name.primary}
        </span>
        {name.gloss ? <span className={styles.glose}>{name.gloss}</span> : null}
      </span>
      <span className={styles.annees}>{formatSpan(period.from, period.to, reading)}</span>
      {profil ? (
        <span className={styles.profil} aria-hidden="true">
          <Profil from={from} to={to2} width={PROFIL_W} height={PROFIL_H} full={PROFIL_H} />
        </span>
      ) : null}
    </>
  );

  const classes = `${styles.dos} ${className ?? ''}`;
  if (to !== undefined) {
    return (
      <Lien to={to} className={classes} style={style} onClick={onClick} data-actif={actif ? '' : undefined} data-profil={profil ? '' : undefined}>
        {contenu}
      </Lien>
    );
  }
  return (
    <div className={classes} style={style} data-actif={actif ? '' : undefined} data-profil={profil ? '' : undefined}>
      {contenu}
    </div>
  );
}
