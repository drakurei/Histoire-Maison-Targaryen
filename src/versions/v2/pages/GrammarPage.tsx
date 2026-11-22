import { useMemo } from 'react';

import { grammar } from '@/core/content/language';
import type { GrammarBlock, Localized } from '@/core/content/types';
import { useT, useTxTypo, VALYRIAN_TAG } from '@/core/i18n';

import { Lien } from '../components/Lien';
import { Page } from '../components/Page';
import { Parti } from '../components/Parti';
import { Sommaire } from '../components/Sommaire';
import { Titre } from '../components/Titre';
import { Vide } from '../components/Vide';
import { useFasce } from '../state/fasce';

import { useEnLecture } from './savoirs/hooks';
import { Refs } from './savoirs/Refs';
import commun from './savoirs/Savoirs.module.css';
import styles from './GrammarPage.module.css';

function lessonId(id: string): string {
  return `lecon-${id}`;
}

/** Un tableau de leçon : sans filet vertical ni cadre, un seul trait sous les en-têtes. */
function Tableau({ rows }: { rows: readonly Localized[][] }) {
  const typo = useTxTypo();
  const [head, ...body] = rows;
  if (!head) return null;
  const headers = head.map((cell) => typo(cell));
  return (
    <div className={styles.tableau}>
      <table className={styles.table}>
        <thead>
          <tr>
            {headers.map((header, index) => (
              <th key={index} scope="col">
                {header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {body.map((row, rowIndex) => (
            <tr key={rowIndex}>
              {row.map((cell, index) =>
                index === 0 ? (
                  <th key={index} scope="row" data-label={headers[index]}>
                    {typo(cell)}
                  </th>
                ) : (
                  <td key={index} data-label={headers[index]}>
                    {typo(cell)}
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

function Bloc({ block }: { block: GrammarBlock }) {
  const typo = useTxTypo();
  if (block.kind === 'table' && block.rows) return <Tableau rows={block.rows} />;
  if (block.kind === 'example') {
    return (
      <blockquote className={styles.exemple}>
        {block.hv ? (
          <p className={styles.exempleHv} lang={VALYRIAN_TAG}>
            {block.hv}
          </p>
        ) : null}
        {block.gloss ? <p className={styles.exempleGlose}>{typo(block.gloss)}</p> : null}
      </blockquote>
    );
  }
  return block.text ? <p className={styles.paragraphe}>{typo(block.text)}</p> : null;
}

/**
 * Grammaire `/langue/grammaire` (parti, fasce éteinte, spec §5.13) : les leçons dans l'ordre
 * (numérotées : c'est une suite), leurs tableaux sans filet vertical ni cadre ; à droite, le
 * sommaire des leçons et la leçon en cours de lecture.
 */
export default function GrammarPage() {
  useFasce({ off: true });
  const t = useT();
  const typo = useTxTypo();
  const lessons = useMemo(() => [...grammar].sort((a, b) => a.order - b.order), []);
  const ids = useMemo(() => lessons.map((lesson) => lessonId(lesson.id)), [lessons]);
  const active = useEnLecture(ids);
  const activeIndex = Math.max(0, ids.indexOf(active ?? ''));
  const current = lessons[activeIndex];

  const entete = (
    <div className={commun.entete}>
      <Titre k="page.bati.title.grammar" />
      <p className={styles.chapeau}>{t('v2.grammar.lead', { n: lessons.length })}</p>
    </div>
  );

  const temps =
    lessons.length > 0 ? (
      <div className={commun.colonne}>
        {current ? (
          <p className={styles.enCours} aria-hidden="true">
            <span className={styles.enCoursNombre}>{current.order}</span>
            <span className={styles.enCoursTexte}>
              <span className={styles.enCoursSur}>{t('v2.grammar.position', { n: activeIndex + 1, total: lessons.length })}</span>
              <span className={styles.enCoursTitre}>{typo(current.title)}</span>
            </span>
          </p>
        ) : null}
        <Sommaire
          label={t('v2.grammar.contents')}
          entries={lessons.map((lesson) => ({ id: lessonId(lesson.id), label: typo(lesson.title) }))}
          className={styles.sommaire}
        />
      </div>
    ) : null;

  const recit =
    lessons.length === 0 ? (
      <Vide
        action={
          <Lien to="/langue/lexique" className={commun.lienTexte}>
            {t('page.grammar.lessons.empty.action')}
          </Lien>
        }
      >
        {t('page.grammar.lessons.empty.title')} {t('page.grammar.lessons.empty.body')}
      </Vide>
    ) : (
      <div className={styles.lecons}>
        {lessons.map((lesson) => (
          <section key={lesson.id} id={lessonId(lesson.id)} className={styles.lecon} aria-labelledby={`${lessonId(lesson.id)}-titre`}>
            <header className={styles.leconTete}>
              <span className={styles.numero} aria-hidden="true">
                {lesson.order}
              </span>
              <h2 id={`${lessonId(lesson.id)}-titre`} className={styles.leconTitre}>
                <span className="sr-only">{t('page.grammar.lesson.number', { n: lesson.order })}, </span>
                {typo(lesson.title)}
              </h2>
              <p className={styles.resume}>{typo(lesson.summary)}</p>
            </header>
            <div className={styles.blocs}>
              {lesson.blocks.map((block, index) => (
                <Bloc key={index} block={block} />
              ))}
            </div>
            <Refs refs={lesson.refs} className={styles.refs} />
          </section>
        ))}
      </div>
    );

  return (
    <Page partition="parti">
      <Parti entete={entete} recit={recit} temps={temps} />
    </Page>
  );
}
