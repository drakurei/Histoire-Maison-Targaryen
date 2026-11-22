import { useEffect, useRef, useState } from 'react';

import { Gloss } from '@/core/i18n';

import { Carte } from '../../components/Carte';

import styles from './CarteTel.module.css';

interface CarteTelProps {
  title: string;
  placeIds: readonly string[];
  highlightIds?: ReadonlySet<string> | null;
  className?: string;
}

/**
 * Téléphone (spec §2.3) : la carte est une figure fixe dans le flux, qui laisse défiler la
 * page ; « plein écran » l'ouvre dans un `dialog` où les gestes sont permis.
 */
export function CarteTel({ title, placeIds, highlightIds = null, className }: CarteTelProps) {
  const [open, setOpen] = useState(false);
  const dialog = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const node = dialog.current;
    if (open && node && !node.open) node.showModal();
  }, [open]);

  return (
    <figure className={`${styles.figure} ${className ?? ''}`}>
      <div className={styles.fixe}>
        <Carte title={title} placeIds={placeIds.length > 0 ? placeIds : undefined} highlightIds={highlightIds} />
      </div>
      <button type="button" className={styles.bouton} onClick={() => setOpen(true)}>
        <Gloss k="v2.map.fullscreen" />
      </button>
      {open ? (
        <dialog ref={dialog} className={styles.dialog} aria-label={title} onClose={() => setOpen(false)}>
          <div className={styles.tete}>
            <button type="button" className={styles.bouton} onClick={() => dialog.current?.close()}>
              <Gloss k="action.close" />
            </button>
          </div>
          <div className={styles.plein}>
            <Carte title={title} placeIds={placeIds.length > 0 ? placeIds : undefined} highlightIds={highlightIds} />
          </div>
        </dialog>
      ) : null}
    </figure>
  );
}
