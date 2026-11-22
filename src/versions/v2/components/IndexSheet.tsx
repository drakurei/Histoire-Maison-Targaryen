import { useEffect, useMemo, useRef } from 'react';

import { getPeriod } from '@/core/content/timeline';
import { formatSpan, Gloss, useLang, useT, useTitle, VALYRIAN_TAG } from '@/core/i18n';
import { createTimeScale } from '@/core/timeline';

import { boundsOf, periods } from '../state/scene';
import { readResume } from '../state/storage';

import { MasseSvg } from './fasce/MasseSvg';
import { Lien } from './Lien';
import { LangSwitch } from './LangSwitch';
import { toRoman } from './numerals';
import { REGISTERS } from './registers';
import styles from './IndexSheet.module.css';

interface IndexSheetProps {
  onClose: () => void;
  onSearch: () => void;
}

const PROFILE_W = 168;
const PROFILE_H = 30;

function PeriodProfile({ from, to }: { from: number; to: number }) {
  const scale = useMemo(() => createTimeScale({ domain: [from, to], range: [0, PROFILE_W] }), [from, to]);
  return <MasseSvg scale={scale} width={PROFILE_W} height={PROFILE_H} className={styles.profil} />;
}

/**
 * « Registres » : l'Index, feuille plein écran sur l'obsidienne (spec §4). Les huit périodes
 * avec leur petit profil rouge à l'échelle commune (quinze dragons valent toute la hauteur),
 * les neuf registres, puis l'à-propos, la langue et la reprise de lecture. `dialog` natif :
 * Échap ferme, le focus revient à « Registres ».
 */
export function IndexSheet({ onClose, onSearch }: IndexSheetProps) {
  const t = useT();
  const title = useTitle();
  const { reading } = useLang();
  const dialog = useRef<HTMLDialogElement>(null);
  const resume = useMemo(() => readResume(), []);
  const resumed = resume ? getPeriod(resume.ref) : undefined;

  useEffect(() => {
    const node = dialog.current;
    // Pas de fermeture au démontage : l'élément quitte la couche du dessus avec le DOM.
    if (node && !node.open) node.showModal();
  }, []);

  const close = () => dialog.current?.close();

  return (
    <dialog ref={dialog} className={styles.root} aria-labelledby="v2-index-titre" onClose={onClose} data-fondu="">
      <div className={styles.sheet}>
        <div className={styles.tete}>
          <h2 id="v2-index-titre" className={styles.titre}>
            <Gloss k="v2.index.title" />
          </h2>
          <div className={styles.actions}>
            <button
              type="button"
              className={styles.action}
              onClick={() => {
                close();
                onSearch();
              }}
            >
              <Gloss k="action.search" />
            </button>
            <button type="button" className={styles.action} onClick={close}>
              <Gloss k="action.close" />
            </button>
          </div>
        </div>

        <section className={styles.periodes} aria-labelledby="v2-index-periodes">
          <h3 id="v2-index-periodes" className={styles.intertitre}>
            {t('v2.index.periods')}
          </h3>
          <ol role="list" className={styles.listePeriodes}>
            {periods.map((period) => {
              const [from, to] = boundsOf(period);
              const name = title(period.title);
              return (
                <li key={period.id}>
                  <Lien to={`/chroniques/${period.id}`} className={styles.periode} onClick={close}>
                    <span className={styles.chiffre} aria-hidden="true">
                      {toRoman(period.order)}
                    </span>
                    <span className={styles.nomPeriode}>
                      <span className={styles.hv} lang={name.isHv ? VALYRIAN_TAG : undefined}>
                        {name.primary}
                      </span>
                      {name.gloss ? <span className={styles.glose}>{name.gloss}</span> : null}
                    </span>
                    <span className={styles.annees}>{formatSpan(period.from, to, reading)}</span>
                    <PeriodProfile from={from} to={to} />
                  </Lien>
                </li>
              );
            })}
          </ol>
        </section>

        <nav className={styles.registres} aria-labelledby="v2-index-registres">
          <h3 id="v2-index-registres" className={styles.intertitre}>
            {t('v2.index.registers')}
          </h3>
          <ul role="list" className={styles.listeRegistres}>
            {REGISTERS.map((register) => (
              <li key={register.to}>
                <Lien to={register.to} className={styles.registre} onClick={close}>
                  <Gloss k={register.key} />
                </Lien>
              </li>
            ))}
          </ul>
        </nav>

        <div className={styles.pied}>
          <Lien to="/a-propos" className={styles.lienPied} onClick={close}>
            <Gloss k="nav.about" />
          </Lien>
          {resume && resumed ? (
            <Lien to={resume.to} year={resume.year} className={styles.lienPied} onClick={close}>
              {t('v2.resume.label', { title: title(resumed.title).gloss ?? title(resumed.title).primary })}
            </Lien>
          ) : null}
          <LangSwitch />
        </div>
      </div>
    </dialog>
  );
}
