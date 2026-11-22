import { useEffect, useRef, useState } from 'react';
import type { CSSProperties, ReactNode } from 'react';

import { VLink } from '@/app/version';
import { formatSpan, Gloss, useLang, useT, useTitle, useUi, VALYRIAN_TAG } from '@/core/i18n';

import { LangSwitch } from './LangSwitch';
import { toRoman } from './numerals';
import { inRegister, REGISTERS } from './registers';
import styles from './Shelf.module.css';
import { SupportSwitch } from './SupportSwitch';
import { periods, useInternalPath, useOpenVolume } from './volumes';

type DrawerId = 'volumes' | 'registers' | 'language';

interface ShelfProps {
  /** Ouvre le panneau de recherche. */
  onSearch: () => void;
}

/**
 * Shelf : l'étagère du téléphone et de la tablette (sous 1024 px). Une barre fixe en bas
 * (volumes, registres, chercher, langue) ; volumes, registres et langue s'ouvrent en
 * tiroirs plein écran (<dialog> natif : Échap ou le bouton les ferment).
 */
export function Shelf({ onSearch }: ShelfProps) {
  const t = useT();
  const [drawer, setDrawer] = useState<DrawerId | null>(null);
  const close = () => setDrawer(null);

  return (
    <>
      <nav className={styles.shelf} aria-label={t('page.bati.shelf.label')}>
        <ShelfButton labelKey="page.bati.shelf.volumes" onClick={() => setDrawer('volumes')} expanded={drawer === 'volumes'} />
        <ShelfButton labelKey="page.bati.shelf.registers" onClick={() => setDrawer('registers')} expanded={drawer === 'registers'} />
        <ShelfButton labelKey="action.search" onClick={onSearch} />
        <ShelfButton labelKey="action.language" onClick={() => setDrawer('language')} expanded={drawer === 'language'} />
      </nav>

      {drawer === 'volumes' ? (
        <Drawer titleKey="page.bati.shelf.drawerVolumes" onClose={close}>
          <VolumeStack onPick={close} />
        </Drawer>
      ) : null}
      {drawer === 'registers' ? (
        <Drawer titleKey="page.bati.shelf.drawerRegisters" onClose={close}>
          <RegisterList onPick={close} />
        </Drawer>
      ) : null}
      {drawer === 'language' ? (
        <Drawer titleKey="page.bati.shelf.drawerLanguage" onClose={close}>
          <div className={styles.languages}>
            <LangSwitch variant="drawer" />
            <SupportSwitch variant="drawer" />
          </div>
        </Drawer>
      ) : null}
    </>
  );
}

function ShelfButton({ labelKey, onClick, expanded }: { labelKey: string; onClick: () => void; expanded?: boolean }) {
  return (
    <button
      type="button"
      className={styles.entry}
      onClick={onClick}
      aria-haspopup="dialog"
      aria-expanded={expanded === undefined ? undefined : expanded}
    >
      <Gloss k={labelKey} classes={{ root: styles.entryLabel }} />
    </button>
  );
}

/** Tiroir plein écran : <dialog> modal, focus gardé dedans, fermé par Échap ou par son bouton. */
function Drawer({ titleKey, onClose, children }: { titleKey: string; onClose: () => void; children: ReactNode }) {
  const ref = useRef<HTMLDialogElement>(null);
  const ui = useUi();
  const title = ui(titleKey);

  useEffect(() => {
    const dialog = ref.current;
    if (dialog && !dialog.open) dialog.showModal();
  }, []);

  return (
    <dialog ref={ref} className={styles.drawer} aria-labelledby="v1-drawer-title" onClose={onClose}>
      <div className={styles.drawerHead}>
        <h2 id="v1-drawer-title" className={styles.drawerTitle} lang={title.isHv ? VALYRIAN_TAG : undefined}>
          {title.primary}
        </h2>
        <button type="button" className={styles.close} onClick={() => ref.current?.close()}>
          <Gloss k="action.close" classes={{ root: styles.closeLabel }} />
        </button>
      </div>
      {children}
    </dialog>
  );
}

/** Les huit dos couchés et empilés : chiffre, titre valyrien, glose, années. */
function VolumeStack({ onPick }: { onPick: () => void }) {
  const title = useTitle();
  const t = useT();
  const { reading } = useLang();
  const open = useOpenVolume();

  return (
    <ol role="list" className={styles.stack}>
      {periods.map((period) => {
        const name = title(period.title);
        const leather = { '--cuir': `var(--v1-cuir-${period.order})` } as CSSProperties;
        const isOpen = open?.id === period.id;
        return (
          <li key={period.id} style={leather}>
            <VLink
              to={`/chroniques/${period.id}`}
              className={styles.lying}
              onClick={onPick}
              aria-current={isOpen ? 'page' : undefined}
              data-open={isOpen || undefined}
            >
              <span className={styles.lyingNumeral} aria-hidden="true">
                {toRoman(period.order)}
              </span>
              <span className="sr-only">{t('page.bati.volume.numbered', { n: period.order })}</span>
              <span className={styles.lyingTitle}>
                <span className={styles.lyingPrimary} lang={name.isHv ? VALYRIAN_TAG : undefined}>
                  {name.primary}
                </span>
                {name.gloss ? <span className={styles.lyingGloss}>{name.gloss}</span> : null}
              </span>
              <span className={styles.lyingYears}>{formatSpan(period.from, period.to, reading)}</span>
            </VLink>
          </li>
        );
      })}
    </ol>
  );
}

/** Les signets, à plat : des rubans rouges avec leur libellé et leur glose. */
function RegisterList({ onPick }: { onPick: () => void }) {
  const ui = useUi();
  const path = useInternalPath();

  return (
    <ul role="list" className={styles.registers}>
      {REGISTERS.map((register) => {
        const label = ui(register.key);
        const current = inRegister(path, register);
        return (
          <li key={register.id}>
            <VLink
              to={register.to}
              className={styles.flatRibbon}
              onClick={onPick}
              aria-current={current ? 'page' : undefined}
              data-current={current || undefined}
            >
              <span className={styles.lyingPrimary} lang={label.isHv ? VALYRIAN_TAG : undefined}>
                {label.primary}
              </span>
              {label.gloss ? <span className={styles.lyingGloss}>{label.gloss}</span> : null}
            </VLink>
          </li>
        );
      })}
    </ul>
  );
}
