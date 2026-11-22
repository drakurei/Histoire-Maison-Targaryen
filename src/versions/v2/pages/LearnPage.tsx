import { useMemo, useState } from 'react';

import { paths } from '@/core/content/paths';
import { getEvent } from '@/core/content/timeline';
import type { LearningPath } from '@/core/content/types';
import { formatSpan, Gloss, useLang, useT, useTitle, useTxTypo, VALYRIAN_TAG } from '@/core/i18n';
import { quizScore } from '@/core/quiz';

import { Lien } from '../components/Lien';
import { Page } from '../components/Page';
import { Titre } from '../components/Titre';
import { Vide } from '../components/Vide';
import { useFasce } from '../state/fasce';
import { boundsOf, periods } from '../state/scene';
import { useYear } from '../state/year';

import { BandeParcours } from './savoirs/BandeParcours';
import { DESKTOP_QUERY, useMedia } from './savoirs/hooks';
import { savedQuiz } from './savoirs/memoire';
import { pathCover } from './savoirs/parcours';
import type { Couverture } from './savoirs/parcours';
import commun from './savoirs/Savoirs.module.css';
import styles from './LearnPage.module.css';

const COVER_DATA = { periods, getEvent, bounds: boundsOf };

/** La progression du questionnaire d'un parcours, écrite en toutes lettres. */
function useProgress(): (path: LearningPath) => string {
  const t = useT();
  return (path) => {
    const state = savedQuiz(path);
    if (!state || state.slots.every((slot) => slot.given === null)) return t('page.learn.progress.none');
    const score = quizScore(state);
    if (score.done) return t('page.learn.progress.done', { correct: score.correct, total: score.total });
    return t('page.learn.progress.ongoing', { n: state.index + 1, total: score.total });
  };
}

/**
 * Apprendre `/apprendre` (fascé, spec §5.15) : les cinq parcours numérotés en Grenze, une
 * vraie suite. Chaque rangée donne le titre, la durée de lecture et la progression, puis la
 * durée historique que le parcours couvre, tracée à l'échelle de la fasce et alignée sur
 * elle. Survoler une rangée pose sa durée et ses événements sur la fasce.
 */
export default function LearnPage() {
  const t = useT();
  const typo = useTxTypo();
  const title = useTitle();
  const { reading } = useLang();
  const year = useYear();
  const desktop = useMedia(DESKTOP_QUERY);
  const progress = useProgress();
  const [hovered, setHovered] = useState<string | null>(null);

  const rows = useMemo(
    () => [...paths].sort((a, b) => a.order - b.order).map((path) => ({ path, cover: pathCover(path, COVER_DATA) })),
    [],
  );
  const active = rows.find((row) => row.path.id === hovered)?.cover ?? null;
  useFasce(active ? { span: active.span, marks: active.years.map((value) => ({ year: value, active: true })) } : {});

  const bandHeight = desktop ? 44 : 24;
  const spanText = (cover: Couverture) => (cover.span ? formatSpan(cover.span[0] <= -2000 ? null : cover.span[0], cover.span[1], reading) : null);

  return (
    <Page partition="fasce" className={styles.page}>
      <div className={styles.entete}>
        <Titre k="nav.learn" />
        <p className={styles.chapeau}>{t('page.learn.lead')}</p>
      </div>

      {rows.length === 0 ? (
        <Vide
          action={
            <Lien to="/chroniques" className={commun.lienTexte}>
              <Gloss k="nav.chronicles" />
            </Lien>
          }
        >
          {t('page.learn.empty.title')} {t('page.learn.empty.body')}
        </Vide>
      ) : (
        <figure className={styles.figure} aria-labelledby="v2-apprendre-legende">
          <ol role="list" className={styles.parcours}>
            {rows.map(({ path, cover }) => {
              const name = title(path.title);
              const span = spanText(cover);
              return (
                <li
                  key={path.id}
                  className={styles.rangee}
                  onPointerEnter={() => setHovered(path.id)}
                  onPointerLeave={() => setHovered(null)}
                  onFocus={() => setHovered(path.id)}
                  onBlur={() => setHovered(null)}
                >
                  <div className={styles.tete}>
                    <span className={styles.numero} aria-hidden="true">
                      {path.order}
                    </span>
                    <div className={styles.corps}>
                      <h2 className={styles.titre}>
                        <Lien to={`/apprendre/${path.id}`}>
                          <span className="sr-only">{t('page.path.number', { n: path.order })}, </span>
                          <span lang={name.isHv ? VALYRIAN_TAG : undefined}>{name.primary}</span>
                        </Lien>
                      </h2>
                      {name.gloss ? <p className={styles.glose}>{name.gloss}</p> : null}
                      <p className={styles.meta}>
                        <span>{t('page.learn.meta', { steps: path.steps.length, questions: path.quiz.length, minutes: path.minutes })}</span>
                        {span ? <span className={styles.annees}>{t('v2.learn.span', { span })}</span> : null}
                      </p>
                      <p className={styles.intro}>{typo(path.intro).split(/(?<=[.?])\s/)[0]}</p>
                      <p className={styles.progression}>{progress(path)}</p>
                    </div>
                  </div>
                  <BandeParcours cover={cover} height={bandHeight} year={year} active={hovered === path.id} />
                </li>
              );
            })}
          </ol>
          <figcaption id="v2-apprendre-legende" className={`${commun.legende} ${styles.legende}`}>
            {t('v2.learn.caption')}
          </figcaption>
        </figure>
      )}
    </Page>
  );
}
