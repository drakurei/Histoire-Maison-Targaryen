import { useEffect, useMemo, useRef } from 'react';

import { getPeriod } from '@/core/content/timeline';
import { Gloss, useT, useTitle } from '@/core/i18n';
import { LangSwitch } from '@/versions/v2/components/LangSwitch';
import { Lien } from '@/versions/v2/components/Lien';
import { REGISTERS } from '@/versions/v2/components/registers';
import { boundsOf, periods } from '@/versions/v2/state/scene';
import { readResume } from '@/versions/v2/state/storage';
import { useYear } from '@/versions/v2/state/year';

import { Dos } from '../common/Dos';

import styles from './Index3.module.css';

interface Index3Props {
  onClose: () => void;
  onSearch: () => void;
}

/**
 * « Registres » : l'Index de la V3 (v3-spec §3.3), `dialog` natif plein écran sur le champ.
 * Les huit volumes en dos de cuir couchés avec leur profil rouge, les neuf registres en
 * Texturina, puis la reprise de lecture, l'à-propos et la langue. Échap ferme ; le focus
 * revient à « Registres ».
 */
export function Index3({ onClose, onSearch }: Index3Props) {
  const t = useT();
  const title = useTitle();
  const year = useYear();
  const dialog = useRef<HTMLDialogElement>(null);
  const resume = useMemo(() => readResume(), []);
  const resumed = resume ? getPeriod(resume.ref) : undefined;

  useEffect(() => {
    const node = dialog.current;
    if (node && !node.open) node.showModal();
  }, []);

  const close = () => dialog.current?.close();

  return (
    <dialog ref={dialog} className={styles.root} aria-labelledby="v3-index-titre" onClose={onClose}>
      <div className={styles.feuille}>
        <div className={styles.tete}>
          <h2 id="v3-index-titre" className={styles.titre}>
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

        <nav className={styles.volumes} aria-labelledby="v3-index-volumes">
          <h3 id="v3-index-volumes" className="sr-only">
            {t('v2.index.periods')}
          </h3>
          <ol role="list" className={styles.dos}>
            {periods.map((period) => {
              const [from, to] = boundsOf(period);
              return (
                <li key={period.id}>
                  <Dos
                    period={period}
                    to={`/chroniques/${period.id}`}
                    onClick={close}
                    profil
                    actif={year !== null && year >= from && year <= to}
                  />
                </li>
              );
            })}
          </ol>
        </nav>

        <nav className={styles.registres} aria-labelledby="v3-index-registres">
          <h3 id="v3-index-registres" className="sr-only">
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
          {resume && resumed ? (
            <Lien to={resume.to} year={resume.year} className={styles.lienPied} onClick={close}>
              {t('v2.resume.label', { title: title(resumed.title).gloss ?? title(resumed.title).primary })}
            </Lien>
          ) : null}
          <Lien to="/a-propos" className={styles.lienPied} onClick={close}>
            <Gloss k="nav.about" />
          </Lien>
          <LangSwitch className={styles.langue} />
        </div>
      </div>
    </dialog>
  );
}
