import { useMemo } from 'react';
import type { MouseEvent } from 'react';

import { formatSpan, Gloss, useLang, useT, useTitle, VALYRIAN_TAG } from '@/core/i18n';
import { createTimeScale } from '@/core/timeline';

import { useFeu } from '../../components/Feu';
import { MasseSvg } from '../../components/fasce/MasseSvg';
import { Lien } from '../../components/Lien';
import { isModifiedClick, toRoman } from '../../components/numerals';
import { REGISTERS } from '../../components/registers';
import { useLienHref } from '../../state/links';
import { boundsOf, periods } from '../../state/scene';

import styles from './PortalListes.module.css';
import { withBase } from '@/app/paths';

const PROFILE_W = 88;
const PROFILE_H = 24;

/** Le petit profil d'une période : son segment de la fasce, quinze dragons valant toute la hauteur. */
function PetitProfil({ from, to }: { from: number; to: number }) {
  const scale = useMemo(() => createTimeScale({ domain: [from, to], range: [0, PROFILE_W] }), [from, to]);
  return <MasseSvg scale={scale} width={PROFILE_W} height={PROFILE_H} className={styles.profil} />;
}

/**
 * Téléphone (spec §5.1) : sous la masse, les huit périodes (une rangée de 56 px : chiffre,
 * titre valyrien, glose, années, petit profil), puis les neuf registres en grand.
 */
export function PortalListes() {
  const t = useT();
  const title = useTitle();
  const { reading } = useLang();
  const href = useLienHref();
  const feu = useFeu();

  const open = (event: MouseEvent<HTMLAnchorElement>, to: string, year: number) => {
    if (isModifiedClick(event)) return;
    event.preventDefault();
    feu.passer(to, { year });
  };

  return (
    <div className={styles.listes}>
      <section aria-labelledby="v2-portail-periodes">
        <h2 id="v2-portail-periodes" className={styles.intertitre}>
          {t('v2.index.periods')}
        </h2>
        <ol role="list" className={styles.periodes}>
          {periods.map((period) => {
            const [from, to] = boundsOf(period);
            const name = title(period.title);
            const target = href(`/chroniques/${period.id}`);
            return (
              <li key={period.id}>
                <a href={withBase(target)} className={styles.periode} onClick={(event) => open(event, target, from)}>
                  <span className={styles.chiffre} aria-hidden="true">
                    {toRoman(period.order)}
                  </span>
                  <span className={styles.nom}>
                    <span className={styles.hv} lang={name.isHv ? VALYRIAN_TAG : undefined}>
                      {name.primary}
                    </span>
                    <span className={styles.ligne}>
                      {name.gloss ? <span className={styles.glose}>{name.gloss}</span> : null}
                      <span className={styles.annees}>{formatSpan(period.from, to, reading)}</span>
                    </span>
                  </span>
                  <PetitProfil from={from} to={to} />
                </a>
              </li>
            );
          })}
        </ol>
      </section>

      <nav aria-labelledby="v2-portail-registres">
        <h2 id="v2-portail-registres" className={styles.intertitre}>
          {t('v2.index.registers')}
        </h2>
        <ul role="list" className={styles.registres}>
          {REGISTERS.map((register) => (
            <li key={register.to}>
              <Lien to={register.to} className={styles.registre}>
                <Gloss k={register.key} />
              </Lien>
            </li>
          ))}
        </ul>
      </nav>
    </div>
  );
}
