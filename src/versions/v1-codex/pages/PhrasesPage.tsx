import { useMemo } from 'react';

import { MAIN_ID } from '@/app/a11y';
import { lexicon, phrases } from '@/core/content/language';
import { useLang, useT, useTx } from '@/core/i18n';

import { EmptyState } from '../components/EmptyState';
import { Folio } from '../components/Folio';
import { col } from '../components/grid';
import { Rubric } from '../components/Rubric';
import { frenchSpacing } from './language/lexiconTools';
import { PhraseEntry } from './language/PhraseEntry';
import { useHashScroll } from './language/useHashScroll';
import styles from './PhrasesPage.module.css';

/** Thème du lexique qui range les formules, en attendant le recueil commenté. */
const FORMULA_THEME = 'formules';

/**
 * Les expressions (/langue/expressions) : chaque formule, son mot à mot, son sens, son
 * contexte. Tant que le recueil (`phrases`) n'est pas rédigé, la page montre les formules
 * déjà documentées par le lexique, avec leur analyse, et le dit.
 */
export default function PhrasesPage() {
  const t = useT();
  const tx = useTx();
  const { reading } = useLang();
  useHashScroll();
  const formulas = useMemo(() => lexicon.filter((entry) => entry.theme === FORMULA_THEME), []);
  const interim = phrases.length === 0;

  return (
    <main id={MAIN_ID}>
      <Folio>
        <Rubric as="h1" k="page.bati.title.phrases" className={styles.title} />
        <p className={`${styles.lead} ${col.recit}`} lang={reading}>
          {t('page.phrases.lead')}
        </p>

        {!interim ? (
          <div className={`${styles.list} ${col.pleine}`}>
            {phrases.map((phrase) => (
              <PhraseEntry
                key={phrase.id}
                id={phrase.id}
                hv={phrase.hv}
                meaning={phrase[reading]}
                status={phrase.status}
                literal={phrase.literal ? tx(phrase.literal) : undefined}
                context={tx(phrase.context)}
                refs={phrase.refs}
              />
            ))}
          </div>
        ) : formulas.length > 0 ? (
          <>
            <div className={`${styles.interim} ${col.recit}`} role="note">
              <p className={styles.interimTitle}>{t('page.phrases.interim.title')}</p>
              <p className={styles.interimBody}>{t('page.phrases.interim.body')}</p>
            </div>
            <div className={`${styles.list} ${col.pleine}`}>
              {formulas.map((entry) => (
                <PhraseEntry
                  key={entry.id}
                  id={entry.id}
                  hv={entry.hv}
                  meaning={entry[reading]}
                  status={entry.status}
                  analysis={reading === 'fr' || entry.notes.en === entry.notes.fr ? frenchSpacing(tx(entry.notes)) : tx(entry.notes)}
                  analysisLang={reading === 'en' && entry.notes.en === entry.notes.fr ? 'fr' : undefined}
                  refs={entry.refs}
                />
              ))}
            </div>
          </>
        ) : (
          <EmptyState titleKey="page.phrases.empty.title" bodyKey="page.phrases.empty.body" />
        )}
      </Folio>
    </main>
  );
}
