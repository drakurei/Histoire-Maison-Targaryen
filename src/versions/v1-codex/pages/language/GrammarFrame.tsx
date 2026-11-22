import { useMemo } from 'react';

import { VLink } from '@/app/version';
import type { LexiconEntry } from '@/core/content/types';
import { useLang, useT, VALYRIAN_TAG } from '@/core/i18n';
import { normalize } from '@/core/search';

import styles from './GrammarFrame.module.css';
import { entryAnchor, GENDERS, sortLexicon, wordsByGender } from './lexiconTools';

const NUMBERS = ['singulier', 'pluriel', 'paucal', 'collectif'] as const;
const CASES = ['nominatif', 'accusatif', 'genitif', 'datif', 'locatif', 'instrumental', 'comitatif', 'vocatif'] as const;

interface GrammarFrameProps {
  lexicon: readonly LexiconEntry[];
}

/**
 * GrammarFrame : la planche des catégories du nom. Quatre genres, chacun illustré par les
 * mots du lexique dont la notice donne la classe sans réserve ; quatre nombres ; huit cas
 * et leur rôle. Rien n'y est inventé : les catégories sont celles que Peterson a publiées,
 * les exemples sont lus dans les notices.
 */
export function GrammarFrame({ lexicon }: GrammarFrameProps) {
  const t = useT();
  const { reading } = useLang();
  const byGender = useMemo(() => wordsByGender(sortLexicon(lexicon)), [lexicon]);

  return (
    <div className={styles.frame}>
      <section className={styles.block} aria-labelledby="cadre-genres">
        <h3 id="cadre-genres" className={styles.heading}>
          {t('page.grammar.genders.title')}
        </h3>
        <ul role="list" className={styles.genders}>
          {GENDERS.map((gender) => {
            const words = byGender.get(gender) ?? [];
            return (
              <li key={gender} className={styles.gender}>
                <span className={styles.genderName}>{t(`page.grammar.gender.${gender}`)}</span>
                {words.length === 0 ? (
                  <span className={styles.none}>{t('page.grammar.gender.none')}</span>
                ) : (
                  <ul role="list" className={styles.words}>
                    {words.map(({ entry, declension }) => (
                      <li key={entry.id} className={styles.word}>
                        <VLink to={`/langue/lexique#${entryAnchor(entry.id)}`} className={styles.form} lang={VALYRIAN_TAG}>
                          {entry.hv}
                        </VLink>
                        {normalize(entry[reading]) !== normalize(entry.hv) ? (
                          <span className={styles.wordGloss} lang={reading}>
                            {entry[reading]}
                          </span>
                        ) : null}
                        {declension ? <span className={styles.decl}>{t('page.grammar.decl', { n: declension })}</span> : null}
                      </li>
                    ))}
                  </ul>
                )}
              </li>
            );
          })}
        </ul>
        <p className={styles.note}>{t('page.grammar.genders.note')}</p>
      </section>

      <section className={styles.block} aria-labelledby="cadre-nombres">
        <h3 id="cadre-nombres" className={styles.heading}>
          {t('page.grammar.numbers.title')}
        </h3>
        <dl className={styles.pairs} data-count="4">
          {NUMBERS.map((number) => (
            <div key={number} className={styles.pair}>
              <dt className={styles.pairName}>{t(`page.grammar.number.${number}`)}</dt>
              <dd className={styles.pairRole}>{t(`page.grammar.number.${number}.role`)}</dd>
            </div>
          ))}
        </dl>
        <p className={styles.note}>{t('page.grammar.numbers.note')}</p>
      </section>

      <section className={styles.block} aria-labelledby="cadre-cas">
        <h3 id="cadre-cas" className={styles.heading}>
          {t('page.grammar.cases.title')}
        </h3>
        <ol role="list" className={styles.cases}>
          {CASES.map((name) => (
            <li key={name} className={styles.case}>
              <span className={styles.pairName}>{t(`page.grammar.case.${name}`)}</span>
              <span className={styles.pairRole}>{t(`page.grammar.case.${name}.role`)}</span>
            </li>
          ))}
        </ol>
      </section>
    </div>
  );
}
