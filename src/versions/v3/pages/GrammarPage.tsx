import { useMemo } from 'react';

import { grammar, lexicon } from '@/core/content/language';
import { useLang, useT, useTxTypo } from '@/core/i18n';
import { Figure } from '@/versions/v1-codex/components/Figure';
import { col } from '@/versions/v1-codex/components/grid';
import { toRoman } from '@/versions/v1-codex/components/numerals';
import { Rubric } from '@/versions/v1-codex/components/Rubric';
import { GrammarFrame } from '@/versions/v1-codex/pages/language/GrammarFrame';
import { Lesson } from '@/versions/v1-codex/pages/language/Lesson';
import { useHashScroll } from '@/versions/v1-codex/pages/language/useHashScroll';
import { Lien } from '@/versions/v2/components/Lien';
import { useEnLecture } from '@/versions/v2/pages/savoirs/hooks';

import { Colonne } from '../components/common/Colonne';
import { Parti3 } from '../components/common/Parti3';
import { DESKTOP, useMedia } from '../components/common/useMedia';
import { useVue } from '../components/common/useVue';
import { Vue } from '../components/common/Vue';
import commun from './savoirs/commun.module.css';
import styles from './savoirs/Grammaire.module.css';
import { Refs3, Sommaire3 } from './savoirs/pieces';

/** Ancre d'une leçon : celle que pose le titre de `Lesson` (V1). */
function lessonAnchor(id: string): string {
  return `lecon-${id}`;
}

/**
 * La grammaire `/langue/grammaire` (v3-spec §6.15 ; parti, fasce éteinte). Le folio porte la
 * planche des catégories du nom, puis les leçons numérotées (`Lesson` de la V1 : tableaux à
 * l'encre sans filet vertical ni cadre). La colonne du champ porte le sommaire des leçons,
 * celle qu'on lit marquée, son rang au pied et ses références. Le titre reste dans la langue
 * d'appui : le contenu ne donne pas de forme valyrienne pour « grammaire ».
 */
export default function GrammarPage() {
  const t = useT();
  const typo = useTxTypo();
  const { reading } = useLang();
  const desktop = useMedia(DESKTOP);
  useVue({ etat: 'eteinte' });
  useHashScroll();

  const lessons = useMemo(() => [...grammar].sort((a, b) => a.order - b.order), []);
  const anchors = useMemo(() => lessons.map((lesson) => lessonAnchor(lesson.id)), [lessons]);
  const active = useEnLecture(desktop ? anchors : []);
  const current = lessons[Math.max(0, anchors.indexOf(active ?? ''))];
  const entries = lessons.map((lesson) => ({ id: lessonAnchor(lesson.id), label: typo(lesson.title), rang: toRoman(lesson.order) }));

  const titreId = 'v3-grammaire-titre';
  const tete = (
    <header className={`${commun.tete} ${col.recit}`}>
      <Rubric as="h1" id={titreId} k="page.bati.title.grammar" />
      <p className={commun.chapeau} lang={reading}>
        {t('v2.grammar.lead', { n: lessons.length })}
      </p>
      {!desktop && lessons.length > 0 ? <Sommaire3 label={t('v2.grammar.contents')} entries={entries} className={styles.sommaireTel} /> : null}
    </header>
  );

  const folio = (
    <>
      <section className={`${commun.section} ${col.pleine}`} aria-labelledby="v3-grammaire-cadre">
        <Rubric as="h2" id="v3-grammaire-cadre" k="page.grammar.frame.title" />
        <Figure className={commun.cibles} caption={t('page.grammar.frame.caption')}>
          <GrammarFrame lexicon={lexicon} />
        </Figure>
      </section>

      <section className={`${commun.section} ${col.pleine}`} aria-labelledby="v3-grammaire-lecons">
        <Rubric as="h2" id="v3-grammaire-lecons" k="page.grammar.lessons.title" />
        {lessons.length === 0 ? (
          <div className={styles.vide}>
            <p className={commun.texte}>
              {t('page.grammar.lessons.empty.title')} {t('page.grammar.lessons.empty.body')}
            </p>
            <Lien to="/langue/lexique" className={commun.lienTexte}>
              {t('page.grammar.lessons.empty.action')}
            </Lien>
          </div>
        ) : (
          <div className={styles.lecons}>
            {lessons.map((lesson) => (
              <div key={lesson.id} className={styles.lecon}>
                <Lesson lesson={lesson} />
                <Refs3 refs={lesson.refs} className={styles.refsLecon} />
              </div>
            ))}
          </div>
        )}
      </section>
    </>
  );

  const colonne =
    desktop && current ? (
      <Colonne
        label={t('v2.grammar.contents')}
        figure={
          <div className={`${commun.colonne} ${styles.colonne}`}>
            <Sommaire3 label={t('v2.grammar.contents')} entries={entries} active={active} />
          </div>
        }
        pied={
          <div className={styles.pied}>
            <p className={styles.enCours}>
              <span className={styles.enCoursRang} aria-hidden="true">
                {toRoman(current.order)}
              </span>
              <span className={styles.enCoursSur}>{t('v2.grammar.position', { n: lessons.indexOf(current) + 1, total: lessons.length })}</span>
              <span className={styles.enCoursTitre}>{typo(current.title)}</span>
            </p>
          </div>
        }
      />
    ) : null;

  return (
    <Vue partition="parti">
      <Parti3 labelledBy={titreId} tete={tete} folio={folio} colonne={colonne} />
    </Vue>
  );
}
