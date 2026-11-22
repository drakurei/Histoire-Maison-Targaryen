import { useMemo } from 'react';
import { useParams } from 'react-router-dom';

import { getPath, paths } from '@/core/content/paths';
import { getEvent } from '@/core/content/timeline';
import type { LearningPath, PathStep } from '@/core/content/types';
import { formatSpan, Gloss, useLang, useT, useTitle, useTxTypo, VALYRIAN_TAG } from '@/core/i18n';
import { quizScore } from '@/core/quiz';
import { col } from '@/versions/v1-codex/components/grid';
import { Prose } from '@/versions/v1-codex/components/Prose';
import { Rubric } from '@/versions/v1-codex/components/Rubric';
import { Quiz } from '@/versions/v1-codex/pages/learn/Quiz';
import { Lien } from '@/versions/v2/components/Lien';
import { useEnLecture } from '@/versions/v2/pages/savoirs/hooks';
import { savedQuiz } from '@/versions/v2/pages/savoirs/memoire';
import { lienGenre, pathCover, stepCover } from '@/versions/v2/pages/savoirs/parcours';
import type { Couverture } from '@/versions/v2/pages/savoirs/parcours';
import { boundsOf, DOMAIN, periods, presence } from '@/versions/v2/state/scene';

import { Colonne } from '../components/common/Colonne';
import { Nom } from '../components/common/Nom';
import { Parti3 } from '../components/common/Parti3';
import { DESKTOP, useMedia } from '../components/common/useMedia';
import { useVue } from '../components/common/useVue';
import { Vue } from '../components/common/Vue';
import NotFoundPage from './NotFoundPage';
import commun from './savoirs/commun.module.css';
import styles from './savoirs/Parcours.module.css';
import { Sommaire3 } from './savoirs/pieces';

const COVER_DATA = { periods, getEvent, bounds: boundsOf };
const QUIZ_ID = 'questions';

function stepAnchor(step: PathStep): string {
  return `etape-${step.id}`;
}

/** Vrai si au moins un dragon vit dans la durée : sinon pas de profil (la Chute). */
function hasDragons(span: readonly [number, number] | null): boolean {
  if (!span) return false;
  return presence.years.some((entry) => entry.year >= span[0] && entry.year <= span[1] && (entry.attested.length > 0 || entry.doubtful.length > 0));
}

/**
 * Un parcours `/apprendre/:pathId` (v3-spec §6.17 ; parti). Le folio : rang, titre, durée,
 * introduction, sommaire de toutes les étapes, les étapes (texte, liens vers les salles ou
 * noms qui ouvrent le cartel, « à retenir »), puis le questionnaire de la V1, une question à
 * la fois, et les parcours voisins. La colonne du champ : l'étape en cours, les périodes
 * qu'elle ouvre, le profil de sa durée soudé à la fasce, la position dans le questionnaire.
 */
export default function PathPage() {
  const { pathId = '' } = useParams();
  const path = getPath(pathId);
  if (!path) return <NotFoundPage />;
  return <Parcours key={path.id} path={path} />;
}

function Parcours({ path }: { path: LearningPath }) {
  const t = useT();
  const typo = useTxTypo();
  const title = useTitle();
  const { reading } = useLang();
  const desktop = useMedia(DESKTOP);

  const anchors = useMemo(() => [...path.steps.map(stepAnchor), QUIZ_ID], [path]);
  const active = useEnLecture(desktop ? anchors : []);
  const inQuiz = active === QUIZ_ID;
  const activeIndex = Math.max(0, Math.min(path.steps.length - 1, anchors.indexOf(active ?? '')));
  const whole = useMemo(() => pathCover(path, COVER_DATA), [path]);
  const covers = useMemo(() => path.steps.map((step) => stepCover(step, COVER_DATA)), [path]);
  const stepCv = covers[activeIndex];
  const current: Couverture = !desktop || inQuiz || !stepCv?.span ? whole : stepCv;
  useVue({ span: current.span, marks: current.years.map((year) => ({ year })) });

  const ordered = useMemo(() => [...paths].sort((a, b) => a.order - b.order), []);
  const position = ordered.findIndex((item) => item.id === path.id);
  const previous = ordered[position - 1];
  const following = ordered[position + 1];
  const step = path.steps[activeIndex];
  const saved = savedQuiz(path);
  const score = saved ? quizScore(saved) : null;
  const answered = saved ? saved.slots.filter((slot) => slot.given !== null).length : 0;
  const quizText = score?.done
    ? t('page.learn.progress.done', { correct: score.correct, total: score.total })
    : saved && answered > 0
      ? t('page.path.quiz.counter', { n: saved.index + 1, total: saved.slots.length })
      : t('v2.path.quiz_waiting', { n: path.quiz.length });
  const spanOf = (span: readonly [number, number]) => formatSpan(span[0] <= DOMAIN[0] ? null : span[0], span[1], reading);
  const profil = current.span && hasDragons(current.span) ? { from: current.span[0], to: current.span[1], span: current.span } : null;

  const titreId = `v3-parcours-${path.id}`;
  const tete = (
    <header className={`${commun.tete} ${col.pleine} ${styles.tete}`}>
      <Lien to="/apprendre" className={styles.retour}>
        {t('page.path.all')}
      </Lien>
      <div className={styles.titreRang}>
        <span className={styles.rang} aria-hidden="true">
          {path.order}
        </span>
        <Rubric as="h1" id={titreId} text={path.title} />
      </div>
      <p className={`${commun.meta} ${styles.meta}`}>
        <span>{t('v2.path.rank', { n: path.order, total: ordered.length })}</span>
        <span>{t('page.learn.meta', { steps: path.steps.length, questions: path.quiz.length, minutes: path.minutes })}</span>
        {whole.span ? <span className={styles.annees}>{spanOf(whole.span)}</span> : null}
      </p>
      <Prose text={path.intro} variant="chapeau" className={styles.intro} />
    </header>
  );

  const folio = (
    <>
      <Sommaire3
        label={t('page.path.steps.title')}
        className={`${styles.sommaire} ${col.recit}`}
        active={desktop ? active : null}
        entries={[
          ...path.steps.map((item, index) => ({ id: stepAnchor(item), label: typo(item.title), rang: String(index + 1) })),
          { id: QUIZ_ID, label: t('page.path.quiz.title'), rang: '' },
        ]}
      />
      {path.steps.map((item, index) => (
        <Etape key={item.id} step={item} index={index} />
      ))}
      <section id={QUIZ_ID} className={`${commun.section} ${col.pleine} ${styles.quiz}`} aria-labelledby={`${QUIZ_ID}-titre`}>
        <Rubric as="h2" id={`${QUIZ_ID}-titre`} k="page.path.quiz.title" />
        {path.quiz.length === 0 ? (
          <p className={commun.texte}>{t('page.path.quiz.empty')}</p>
        ) : (
          <>
            <p className={commun.texte} lang={reading}>
              {t('page.path.quiz.intro', { n: path.quiz.length })}
            </p>
            <Quiz key={path.id} pathId={path.id} questions={path.quiz} />
          </>
        )}
      </section>
      <nav className={`${styles.voisins} ${col.pleine}`} aria-label={t('page.path.all')}>
        {previous ? (
          <Lien to={`/apprendre/${previous.id}`} className={styles.voisin} rel="prev">
            <span className={styles.voisinSens}>{t('page.path.previous')}</span>
            <span className={styles.voisinTitre}>{typo(previous.title)}</span>
          </Lien>
        ) : (
          <span />
        )}
        {following ? (
          <Lien to={`/apprendre/${following.id}`} className={`${styles.voisin} ${styles.suivant}`} rel="next">
            <span className={styles.voisinSens}>{t('page.path.next')}</span>
            <span className={styles.voisinTitre}>{typo(following.title)}</span>
          </Lien>
        ) : null}
      </nav>
    </>
  );

  const colonne = (
    <Colonne
      label={t('v3.savoirs.parcours.colonne')}
      profil={profil}
      figure={
        <div className={`${commun.colonne} ${styles.colonne}`}>
          {desktop ? (
            <p className={styles.position}>
              {inQuiz ? (
                <span className={styles.positionTitre}>
                  <Gloss k="page.path.quiz.title" />
                </span>
              ) : step ? (
                <>
                  <span className={styles.positionRang} aria-hidden="true">
                    {activeIndex + 1}
                  </span>
                  <span className={styles.positionSur}>{t('v2.path.position', { n: activeIndex + 1, total: path.steps.length })}</span>
                  <span className={styles.positionTitre}>{typo(step.title)}</span>
                </>
              ) : null}
            </p>
          ) : null}
          {current.periods.length > 0 ? (
            <ul role="list" className={styles.periodes}>
              {current.periods.map((period) => {
                const name = title(period.title);
                return (
                  <li key={period.id}>
                    <Lien to={`/chroniques/${period.id}`} className={styles.periode}>
                      <span lang={name.isHv ? VALYRIAN_TAG : undefined}>{name.primary}</span>
                    </Lien>
                    <span className={styles.periodeAnnees}>
                      {name.gloss && name.gloss !== name.primary ? `${name.gloss}, ` : ''}
                      {formatSpan(period.from, period.to, reading)}
                    </span>
                  </li>
                );
              })}
            </ul>
          ) : (
            <p className={commun.legende}>{t('v2.path.no_period')}</p>
          )}
          {path.quiz.length > 0 ? (
            <div className={styles.questionnaire}>
              <ol role="list" className={styles.cases} aria-hidden="true">
                {path.quiz.map((question, index) => {
                  const slot = saved?.slots[index];
                  return <li key={question.id} data-etat={slot && slot.given !== null ? 'repondu' : 'attente'} />;
                })}
              </ol>
              <p className={commun.legende}>{quizText}</p>
              {!inQuiz ? (
                <a href={`#${QUIZ_ID}`} className={styles.allerQuiz}>
                  {t('v2.path.to_quiz')}
                </a>
              ) : null}
            </div>
          ) : null}
        </div>
      }
    />
  );

  return (
    <Vue partition="parti">
      <Parti3 labelledBy={titreId} tete={tete} folio={folio} colonne={colonne} profil={profil} />
    </Vue>
  );
}

/** Un lien d'étape : une entité s'ouvre au cartel (`Nom`), une vue se suit. */
function LienEtape({ to, label }: PathStep['links'][number]) {
  const kind = lienGenre(to);
  if (kind.kind === 'page') {
    return (
      <Lien to={to}>
        <Gloss text={label} />
      </Lien>
    );
  }
  return <Nom kind={kind.kind} id={kind.id} name={label} />;
}

function Etape({ step, index }: { step: PathStep; index: number }) {
  const t = useT();
  const typo = useTxTypo();
  const anchor = stepAnchor(step);
  return (
    <section id={anchor} className={`${styles.etape} ${col.rangee} ${col.pleine}`} aria-labelledby={`${anchor}-titre`}>
      <div className={`${styles.etapeTexte} ${col.recit}`}>
        <h2 id={`${anchor}-titre`} className={styles.etapeTitre}>
          <span className={styles.etapeRang} aria-hidden="true">
            {index + 1}
          </span>
          <span className="sr-only">{t('v2.path.step', { n: index + 1 })}, </span>
          <span>{typo(step.title)}</span>
        </h2>
        <Prose text={step.body} />
      </div>
      <aside className={`${styles.marge} ${col.marge}`} aria-label={typo(step.title)}>
        {step.retain.length > 0 ? (
          <div>
            <p className={styles.margeTitre}>{t('page.path.retain')}</p>
            <ul role="list" className={styles.retenir}>
              {step.retain.map((item, i) => (
                <li key={i}>{typo(item)}</li>
              ))}
            </ul>
          </div>
        ) : null}
        {step.links.length > 0 ? (
          <div>
            <p className={styles.margeTitre}>{t('page.path.links')}</p>
            <ul role="list" className={styles.liens}>
              {step.links.map((link) => (
                <li key={link.to}>
                  <LienEtape {...link} />
                </li>
              ))}
            </ul>
          </div>
        ) : null}
      </aside>
    </section>
  );
}
