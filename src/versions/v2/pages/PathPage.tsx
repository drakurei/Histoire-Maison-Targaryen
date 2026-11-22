import { useEffect, useMemo, useReducer } from 'react';
import { useParams } from 'react-router-dom';

import { getPath, paths } from '@/core/content/paths';
import { getEvent } from '@/core/content/timeline';
import type { LearningPath, PathStep } from '@/core/content/types';
import { formatSpan, Gloss, useLang, useT, useTitle, useTxTypo, VALYRIAN_TAG } from '@/core/i18n';
import { createQuiz, quizReducer, quizStorageKey, saveQuiz } from '@/core/quiz';
import type { QuizState } from '@/core/quiz';

import { GrandNombre } from '../components/GrandNombre';
import { Introuvable } from '../components/Introuvable';
import { Lien } from '../components/Lien';
import { NomEntite } from '../components/NomEntite';
import { Page } from '../components/Page';
import { Parti } from '../components/Parti';
import { Profil } from '../components/Profil';
import { Prose } from '../components/Prose';
import { Sommaire } from '../components/Sommaire';
import { Titre } from '../components/Titre';
import { useElementWidth } from '../components/useElementWidth';
import { useFasce } from '../state/fasce';
import { boundsOf, DOMAIN, periods, presence } from '../state/scene';

import { DESKTOP_QUERY, useEnLecture, useMedia } from './savoirs/hooks';
import { quizStorage, savedQuiz } from './savoirs/memoire';
import { lienGenre, pathCover, stepCover } from './savoirs/parcours';
import type { Couverture } from './savoirs/parcours';
import { Questionnaire } from './savoirs/Questionnaire';
import commun from './savoirs/Savoirs.module.css';
import styles from './PathPage.module.css';

const COVER_DATA = { periods, getEvent, bounds: boundsOf };
const QUIZ_ID = 'questions';

function stepAnchor(step: PathStep): string {
  return `etape-${step.id}`;
}

/** Un lien d'étape : une entité s'ouvre au cartel, une vue se suit. */
function LienEtape({ to, label }: PathStep['links'][number]) {
  const kind = lienGenre(to);
  if (kind.kind === 'page') {
    return (
      <Lien to={to} className={styles.lienVue}>
        <Gloss text={label} />
      </Lien>
    );
  }
  return <NomEntite kind={kind.kind} id={kind.id} name={label} />;
}

function Etape({ step, index }: { step: PathStep; index: number }) {
  const t = useT();
  const typo = useTxTypo();
  const anchor = stepAnchor(step);
  return (
    <section id={anchor} className={styles.etape} aria-labelledby={`${anchor}-titre`}>
      <h2 id={`${anchor}-titre`} className={styles.etapeTitre}>
        <span className={styles.etapeNumero} aria-hidden="true">
          {index + 1}
        </span>
        <span className="sr-only">{t('v2.path.step', { n: index + 1 })}, </span>
        {typo(step.title)}
      </h2>
      <Prose text={step.body} />
      {step.links.length > 0 ? (
        <div className={styles.liens}>
          <p className={styles.rubrique}>{t('page.path.links')}</p>
          <ul role="list" className={styles.listeLiens}>
            {step.links.map((link) => (
              <li key={link.to}>
                <LienEtape {...link} />
              </li>
            ))}
          </ul>
        </div>
      ) : null}
      {step.retain.length > 0 ? (
        <div className={styles.retenir}>
          <p className={styles.rubrique}>{t('page.path.retain')}</p>
          <ul role="list" className={styles.listeRetenir}>
            {step.retain.map((item, i) => (
              <li key={i}>{typo(item)}</li>
            ))}
          </ul>
        </div>
      ) : null}
    </section>
  );
}

function initialQuiz(path: LearningPath): QuizState {
  return savedQuiz(path) ?? createQuiz(path.quiz, { shuffle: true, seed: Date.now() % 2147483647 });
}

/** La colonne : l'étape en cours, la période qu'elle ouvre, la position dans le questionnaire. */
function Colonne({
  path,
  activeIndex,
  inQuiz,
  cover,
  quiz,
  desktop,
}: {
  desktop: boolean;
  path: LearningPath;
  activeIndex: number;
  inQuiz: boolean;
  cover: Couverture;
  quiz: QuizState;
}) {
  const t = useT();
  const typo = useTxTypo();
  const title = useTitle();
  const { reading } = useLang();
  const [ref, width] = useElementWidth<HTMLDivElement>();
  const step = path.steps[activeIndex];
  const span = cover.span;
  const hasDragons =
    span !== null && presence.years.some((entry) => entry.year >= span[0] && entry.year <= span[1] && (entry.attested.length > 0 || entry.doubtful.length > 0));
  const profileHeight = Math.round(Math.min(220, window.innerHeight * 0.24));
  const answered = quiz.slots.filter((slot) => slot.given !== null).length;

  return (
    <div className={`${commun.colonne} ${styles.colonne}`}>
      {!desktop ? null : inQuiz ? (
        <GrandNombre value={String(Math.min(quiz.slots.length, quiz.index + 1))} era={`/ ${quiz.slots.length}`} />
      ) : (
        <GrandNombre value={String(activeIndex + 1)} era={`/ ${path.steps.length}`} />
      )}
      <p className={styles.position} hidden={!desktop}>
        {inQuiz ? (
          <Gloss k="page.path.quiz.title" />
        ) : step ? (
          <>
            <span className={styles.positionSur}>{t('v2.path.position', { n: activeIndex + 1, total: path.steps.length })}</span>
            <span className={styles.positionTitre}>{typo(step.title)}</span>
          </>
        ) : null}
      </p>

      {!inQuiz ? (
        <div ref={ref} className={styles.temps}>
          {cover.periods.length > 0 ? (
            <ul role="list" className={styles.periodes}>
              {cover.periods.map((period) => {
                const name = title(period.title);
                return (
                  <li key={period.id}>
                    <Lien to={`/chroniques/${period.id}`} className={styles.periode}>
                      <span lang={name.isHv ? VALYRIAN_TAG : undefined}>{name.primary}</span>
                    </Lien>
                    <span className={styles.periodeAnnees}>
                      {name.gloss ? `${name.gloss}, ` : ''}
                      {formatSpan(period.from, period.to, reading)}
                    </span>
                  </li>
                );
              })}
            </ul>
          ) : (
            <p className={styles.sansPeriode}>{t('v2.path.no_period')}</p>
          )}
          {span && hasDragons && width > 0 ? (
            <div className={styles.profil} aria-hidden="true">
              <Profil from={span[0]} to={span[1]} width={width} height={profileHeight} full={profileHeight} />
            </div>
          ) : null}
        </div>
      ) : null}

      <div className={styles.questionnaire} hidden={!desktop}>
        <ol role="list" className={styles.cases} aria-hidden="true">
          {quiz.slots.map((slot, index) => (
            <li
              key={index}
              className={styles.case}
              data-etat={slot.given !== null ? 'repondu' : index === quiz.index && quiz.phase !== 'done' ? 'courant' : 'attente'}
            />
          ))}
        </ol>
        <p className={styles.questionnaireTexte}>
          {quiz.phase === 'done'
            ? t('v2.path.quiz_done')
            : answered === 0
              ? t('v2.path.quiz_waiting', { n: quiz.slots.length })
              : t('page.path.quiz.counter', { n: quiz.index + 1, total: quiz.slots.length })}
        </p>
        {!inQuiz ? (
          <a href={`#${QUIZ_ID}`} className={styles.allerQuiz}>
            {t('v2.path.to_quiz')}
          </a>
        ) : null}
      </div>
    </div>
  );
}

/**
 * Parcours `/apprendre/:pathId` (parti, spec §5.15). À gauche, l'introduction, le sommaire de
 * toutes les étapes, les étapes dans l'ordre (texte, liens vers les salles, ce qu'il faut
 * retenir), puis le questionnaire, une question à la fois. À droite, collants : l'étape en
 * cours en grand nombre, le profil de la période qu'elle ouvre (la fasce en fait autant), et
 * la position dans le questionnaire. La progression reste sur l'appareil.
 */
export default function PathPage() {
  const { pathId = '' } = useParams();
  const path = getPath(pathId);
  if (!path) return <Introuvable />;
  return <Parcours key={path.id} path={path} />;
}

function Parcours({ path }: { path: LearningPath }) {
  const t = useT();
  const typo = useTxTypo();
  const [quiz, dispatch] = useReducer(quizReducer, path, initialQuiz);

  useEffect(() => {
    const storage = quizStorage();
    if (storage) saveQuiz(storage, quizStorageKey(path.id), quiz);
  }, [quiz, path.id]);

  const anchors = useMemo(() => [...path.steps.map(stepAnchor), QUIZ_ID], [path]);
  const desktop = useMedia(DESKTOP_QUERY);
  const active = useEnLecture(desktop ? anchors : []);
  const inQuiz = active === QUIZ_ID;
  const activeIndex = Math.max(0, Math.min(path.steps.length - 1, anchors.indexOf(active ?? '')));
  const whole = useMemo(() => pathCover(path, COVER_DATA), [path]);
  const stepCovers = useMemo(() => path.steps.map((step) => stepCover(step, COVER_DATA)), [path]);
  const current = !desktop || inQuiz ? whole : stepCovers[activeIndex]?.span ? stepCovers[activeIndex] : whole;
  useFasce({ span: current?.span ?? null, marks: (current?.years ?? []).map((year) => ({ year })) });

  const ordered = useMemo(() => [...paths].sort((a, b) => a.order - b.order), []);
  const position = ordered.findIndex((item) => item.id === path.id);
  const previous = ordered[position - 1];
  const following = ordered[position + 1];

  const entete = (
    <div className={commun.entete}>
      <Titre text={path.title}>
        <p className={styles.meta}>
          <span>{t('v2.path.rank', { n: path.order, total: ordered.length })}</span>
          <span>{t('page.learn.meta', { steps: path.steps.length, questions: path.quiz.length, minutes: path.minutes })}</span>
          {whole.span ? (
            <span className={styles.metaAnnees}>
              <SpanText span={whole.span} />
            </span>
          ) : null}
        </p>
      </Titre>
      <Prose text={path.intro} variant="chapeau" />
      <Sommaire
        label={t('page.path.steps.title')}
        entries={[
          ...path.steps.map((step) => ({ id: stepAnchor(step), label: typo(step.title) })),
          { id: QUIZ_ID, label: t('page.path.quiz.title') },
        ]}
        className={styles.sommaire}
      />
    </div>
  );

  const recit = (
    <div className={styles.recit}>
      {path.steps.map((step, index) => (
        <Etape key={step.id} step={step} index={index} />
      ))}
      <section id={QUIZ_ID} className={styles.quiz} aria-labelledby={`${QUIZ_ID}-titre`}>
        <h2 id={`${QUIZ_ID}-titre`} className={commun.intertitre}>
          <Gloss k="page.path.quiz.title" />
        </h2>
        {path.quiz.length > 0 ? <p className={styles.quizIntro}>{t('page.path.quiz.intro', { n: path.quiz.length })}</p> : null}
        <Questionnaire state={quiz} dispatch={dispatch} />
      </section>
      <nav className={styles.voisins} aria-label={t('page.path.all')}>
        {previous ? (
          <Lien to={`/apprendre/${previous.id}`} className={styles.voisin}>
            <span className={styles.voisinSens}>{t('page.path.previous')}</span>
            <span className={styles.voisinTitre}>{typo(previous.title)}</span>
          </Lien>
        ) : null}
        {following ? (
          <Lien to={`/apprendre/${following.id}`} className={styles.voisin}>
            <span className={styles.voisinSens}>{t('page.path.next')}</span>
            <span className={styles.voisinTitre}>{typo(following.title)}</span>
          </Lien>
        ) : null}
        <Lien to="/apprendre" className={styles.voisin}>
          <span className={styles.voisinSens}>
            <Gloss k="nav.learn" />
          </span>
          <span className={styles.voisinTitre}>{t('page.path.all')}</span>
        </Lien>
      </nav>
    </div>
  );

  return (
    <Page partition="parti">
      <Parti
        entete={entete}
        recit={recit}
        temps={<Colonne path={path} activeIndex={activeIndex} inQuiz={inQuiz} cover={current ?? whole} quiz={quiz} desktop={desktop} />}
      />
    </Page>
  );

}

function SpanText({ span }: { span: readonly [number, number] }) {
  const { reading } = useLang();
  return <>{formatSpan(span[0] <= DOMAIN[0] ? null : span[0], span[1], reading)}</>;
}
