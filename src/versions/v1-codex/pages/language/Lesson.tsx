import type { GrammarBlock, GrammarLesson, Localized } from '@/core/content/types';
import { useLang, useT, VALYRIAN_TAG } from '@/core/i18n';

import { Prose } from '../../components/Prose';
import { Rubric } from '../../components/Rubric';
import { toRoman } from '../../components/numerals';
import styles from './Lesson.module.css';
import { useTxTypo } from '../../components/typo';

/** Une cellule de tableau : la forme valyrienne quand elle existe (c'est le sujet de la leçon), sinon le texte lu. */
function Cell({ value }: { value: Localized }) {
  const tx = useTxTypo();
  return value.hv ? <span lang={VALYRIAN_TAG}>{value.hv}</span> : <>{tx(value)}</>;
}

function Block({ block }: { block: GrammarBlock }) {
  const tx = useTxTypo();
  const { reading } = useLang();

  if (block.kind === 'p') return <Prose text={block.text} className={styles.p} />;

  if (block.kind === 'example') {
    return (
      <figure className={styles.example}>
        {block.hv ? (
          <p className={styles.exampleHv} lang={VALYRIAN_TAG}>
            {block.hv}
          </p>
        ) : null}
        {block.gloss ? (
          <p className={styles.exampleGloss} lang={reading}>
            {tx(block.gloss)}
          </p>
        ) : null}
        {block.text ? (
          <figcaption className={styles.exampleNote} lang={reading}>
            {tx(block.text)}
          </figcaption>
        ) : null}
      </figure>
    );
  }

  const [head, ...rows] = block.rows ?? [];
  if (!head) return null;
  return (
    <div className={styles.tableWrap}>
      <table className={styles.table}>
        {block.text ? <caption className={styles.caption}>{tx(block.text)}</caption> : null}
        <thead>
          <tr>
            {head.map((cell, index) => (
              <th key={index} scope="col">
                <Cell value={cell} />
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, rowIndex) => (
            <tr key={rowIndex}>
              {row.map((cell, index) =>
                index === 0 ? (
                  <th key={index} scope="row">
                    <Cell value={cell} />
                  </th>
                ) : (
                  <td key={index}>
                    <Cell value={cell} />
                  </td>
                ),
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/**
 * Lesson : une leçon de grammaire. Son rang en chiffre gothique (les leçons forment une
 * vraie suite), le titre rubriqué, le chapeau, puis les blocs : paragraphes, tableaux de
 * déclinaison (filets d'édition savante, défilement horizontal sur téléphone), exemples.
 */
export function Lesson({ lesson }: { lesson: GrammarLesson }) {
  const t = useT();
  const id = `lecon-${lesson.id}`;
  return (
    <section className={styles.lesson} aria-labelledby={id}>
      <p className={styles.number} aria-hidden="true">
        {toRoman(lesson.order)}
      </p>
      <div className={styles.body}>
        <Rubric as="h3" size="section" id={id} className={styles.title}>
          <span className={styles.srOnly}>{t('page.grammar.lesson.number', { n: lesson.order })} </span>
          <LessonTitle text={lesson.title} />
        </Rubric>
        <Prose text={lesson.summary} variant="chapeau" className={styles.summary} />
        {lesson.blocks.map((block, index) => (
          <Block key={index} block={block} />
        ))}
      </div>
    </section>
  );
}

function LessonTitle({ text }: { text: Localized }) {
  const tx = useTxTypo();
  return <>{tx(text)}</>;
}
