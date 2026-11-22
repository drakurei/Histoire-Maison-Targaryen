import { MAIN_ID } from '@/app/a11y';
import { grammar, lexicon } from '@/core/content/language';
import { useLang, useT } from '@/core/i18n';

import { EmptyState } from '../components/EmptyState';
import { Figure } from '../components/Figure';
import { Folio } from '../components/Folio';
import { col } from '../components/grid';
import { Rubric } from '../components/Rubric';
import { GrammarFrame } from './language/GrammarFrame';
import { Lesson } from './language/Lesson';
import { useHashScroll } from './language/useHashScroll';
import styles from './GrammarPage.module.css';

/**
 * La grammaire (/langue/grammaire) : la planche des catégories du nom, toujours présente,
 * puis les leçons dans l'ordre (GrammarLesson), ou leur état d'attente.
 */
export default function GrammarPage() {
  const t = useT();
  const { reading } = useLang();
  useHashScroll();

  return (
    <main id={MAIN_ID}>
      <Folio>
        <Rubric as="h1" k="page.bati.title.grammar" className={styles.title} />
        <p className={`${styles.lead} ${col.recit}`} lang={reading}>
          {t('page.grammar.lead')}
        </p>

        <Rubric as="h2" id="cadre" k="page.grammar.frame.title" className={styles.section} />
        <Figure className={`${styles.frame} ${col.pleine}`} caption={t('page.grammar.frame.caption')}>
          <GrammarFrame lexicon={lexicon} />
        </Figure>

        <Rubric as="h2" id="lecons" k="page.grammar.lessons.title" className={styles.section} />
        {grammar.length === 0 ? (
          <EmptyState
            titleKey="page.grammar.lessons.empty.title"
            bodyKey="page.grammar.lessons.empty.body"
            action={{ labelKey: 'page.grammar.lessons.empty.action', to: '/langue/lexique' }}
          />
        ) : (
          <div className={col.large}>
            {grammar.map((lesson) => (
              <Lesson key={lesson.id} lesson={lesson} />
            ))}
          </div>
        )}
      </Folio>
    </main>
  );
}
