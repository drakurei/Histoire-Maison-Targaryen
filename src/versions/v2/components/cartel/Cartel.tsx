import { useEffect, useRef, useState } from 'react';
import type { ReactNode } from 'react';

import { Gloss } from '@/core/i18n';

import { takeOpener } from '../../state/entities';

import styles from './Cartel.module.css';

interface CartelProps {
  /** Nom accessible de la surface. */
  label: string;
  onClose: () => void;
  children: ReactNode;
}

const DESKTOP = '(min-width: 1024px)';

/**
 * La surface du cartel (spec §4, §5.2). Ordinateur : volet de suie à droite, de la ligne
 * haute à la fasce, sans piège de focus (il est à côté du texte) ; le focus y entre à
 * l'ouverture et revient au nom à la fermeture. Téléphone : feuille posée sur la fasce,
 * `dialog` modal. Échap, « fermer » et Retour ferment.
 */
export function Cartel({ label, onClose, children }: CartelProps) {
  const [desktop] = useState(() => window.matchMedia(DESKTOP).matches);
  const surface = useRef<HTMLElement>(null);
  const dialog = useRef<HTMLDialogElement>(null);
  const closing = useRef(onClose);

  useEffect(() => {
    closing.current = onClose;
  }, [onClose]);

  // À l'ouverture, le focus entre ; à la fermeture (démontage), il revient au nom touché.
  useEffect(() => {
    const node = desktop ? surface.current : dialog.current;
    if (!desktop && dialog.current && !dialog.current.open) dialog.current.showModal();
    node?.focus({ preventScroll: true });
    return () => {
      const opener = takeOpener();
      opener?.focus({ preventScroll: true });
    };
  }, [desktop]);

  useEffect(() => {
    if (!desktop) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && !event.defaultPrevented && !document.querySelector('dialog[open]')) closing.current();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [desktop]);

  const close = (
    <button type="button" className={styles.fermer} onClick={() => closing.current()}>
      <Gloss k="action.close" />
    </button>
  );

  if (desktop) {
    return (
      <aside ref={surface} className={styles.volet} aria-label={label} tabIndex={-1}>
        <div className={styles.barre}>{close}</div>
        <div className={styles.contenu}>{children}</div>
      </aside>
    );
  }

  return (
    <dialog
      ref={dialog}
      className={styles.feuille}
      aria-label={label}
      onCancel={(event) => {
        event.preventDefault();
        closing.current();
      }}
    >
      <div className={styles.barre}>{close}</div>
      <div className={styles.contenu}>{children}</div>
    </dialog>
  );
}
