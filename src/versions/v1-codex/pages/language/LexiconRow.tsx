import type { LexiconEntry } from '@/core/content/types';
import { useLang, useT, useTx, VALYRIAN_TAG } from '@/core/i18n';
import { normalize } from '@/core/search';

import styles from './LexiconRow.module.css';
import { entryAnchor, frenchSpacing, refLabel } from './lexiconTools';
import { StatusMark } from './StatusMark';

interface LexiconRowProps {
  entry: LexiconEntry;
  themeLabel: string;
  open: boolean;
  onToggle: (id: string) => void;
}

/**
 * LexiconRow : une ligne du lexique. La ligne entière est un bouton qui déplie la notice
 * juste dessous (pas de fenêtre) : grammaire, note du linguiste, références. L'élément
 * porte l'ancre « #mot-<id> », que la page de la langue et la recherche visent.
 */
export function LexiconRow({ entry, themeLabel, open, onToggle }: LexiconRowProps) {
  const t = useT();
  const tx = useTx();
  const { reading } = useLang();
  const anchor = entryAnchor(entry.id);
  const panelId = `${anchor}-notice`;
  const meaning = entry[reading];
  // Certaines notes n'existent qu'en français : on le dit au navigateur et au lecteur d'écran.
  const noteLang = reading === 'en' && entry.notes.en === entry.notes.fr ? 'fr' : reading;

  return (
    <li id={anchor} className={styles.row} data-open={open || undefined}>
      <button type="button" className={styles.head} aria-expanded={open} aria-controls={panelId} onClick={() => onToggle(entry.id)}>
        <span className={styles.form} lang={VALYRIAN_TAG}>
          {entry.hv}
        </span>
        <span className={styles.meaning} lang={reading}>
          {normalize(meaning) === normalize(entry.hv) ? <span className={styles.same}>{meaning}</span> : meaning}
        </span>
        <span className={styles.theme}>{themeLabel}</span>
        <StatusMark status={entry.status} className={styles.status} />
      </button>
      <div id={panelId} className={styles.panel} hidden={!open}>
        <div className={styles.body}>
          {entry.grammar ? (
            <p className={styles.grammar}>
              <span className={styles.term}>{t('page.lexicon.entry.grammar')}</span> {tx(entry.grammar)}
            </p>
          ) : null}
          <p className={styles.note} lang={noteLang}>
            {noteLang === 'fr' ? frenchSpacing(tx(entry.notes)) : tx(entry.notes)}
          </p>
          {!entry.verified ? <p className={styles.unverified}>{t('page.lexicon.entry.unverified')}</p> : null}
        </div>
        {entry.refs.length > 0 ? (
          <div className={styles.refs}>
            <p className={styles.term}>{t('page.lexicon.entry.refs')}</p>
            <ul role="list" className={styles.refList}>
              {entry.refs.map((url) => (
                <li key={url}>
                  <a href={url} className={styles.ref} rel="noreferrer noopener" target="_blank">
                    {refLabel(url)}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        ) : null}
      </div>
    </li>
  );
}
