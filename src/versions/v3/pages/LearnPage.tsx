import { useMemo, useState } from 'react';

import { paths } from '@/core/content/paths';
import { getEvent } from '@/core/content/timeline';
import type { LearningPath } from '@/core/content/types';
import { formatSpan, Gloss, useLang, useT, useTitle, useTxTypo, VALYRIAN_TAG } from '@/core/i18n';
import { quizScore } from '@/core/quiz';
import { Lien } from '@/versions/v2/components/Lien';
import { BandeParcours } from '@/versions/v2/pages/savoirs/BandeParcours';
import { savedQuiz } from '@/versions/v2/pages/savoirs/memoire';
import { pathCover } from '@/versions/v2/pages/savoirs/parcours';
import type { Couverture } from '@/versions/v2/pages/savoirs/parcours';
import { boundsOf, DOMAIN, periods } from '@/versions/v2/state/scene';
import { useYear } from '@/versions/v2/state/year';

import { TitreChamp } from '../components/common/TitreChamp';
import { DESKTOP, useMedia } from '../components/common/useMedia';
import { useVue } from '../components/common/useVue';
import { Vue } from '../components/common/Vue';
import commun from './savoirs/commun.module.css';
import styles from './savoirs/Apprendre.module.css';

const COVER_DATA = { periods, getEvent, bounds: boundsOf };

/** La progression du questionnaire d'un parcours, en toutes lettres (aucune jauge). */
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
 * Apprendre `/apprendre` (v3-spec §6.17 ; fascé, sur le champ). Les cinq parcours, numérotés
 * en Grenze (une vraie suite) : titre, durée de lecture, première phrase, progression ; sous
 * chacun, la durée historique qu'il couvre, sur l'échelle même de la fasce et alignée sur
 * elle. Survoler ou parcourir une rangée au clavier pose sa durée et ses événements sur la
 * fasce.
 */
export default function LearnPage() {
  const t = useT();
  const typo = useTxTypo();
  const title = useTitle();
  const { reading } = useLang();
  const year = useYear();
  const desktop = useMedia(DESKTOP);
  const progress = useProgress();
  const [hovered, setHovered] = useState<string | null>(null);

  const rows = useMemo(() => [...paths].sort((a, b) => a.order - b.order).map((path) => ({ path, cover: pathCover(path, COVER_DATA) })), []);
  const active = rows.find((row) => row.path.id === hovered)?.cover ?? null;
  useVue(active ? { span: active.span, marks: active.years.map((value) => ({ year: value, active: true })) } : {});

  const spanText = (cover: Couverture) => (cover.span ? formatSpan(cover.span[0] <= DOMAIN[0] ? null : cover.span[0], cover.span[1], reading) : null);

  return (
    <Vue partition="fasce" className={styles.vue}>
      <div className={styles.entete}>
        <TitreChamp k="nav.learn" />
        <p className={`${commun.chapeau} ${styles.chapeau}`}>{t('page.learn.lead')}</p>
      </div>

      {rows.length === 0 ? (
        <div className={styles.vide}>
          <p className={commun.texte}>
            {t('page.learn.empty.title')} {t('page.learn.empty.body')}
          </p>
          <Lien to="/chroniques" className={commun.lienTexte}>
            <Gloss k="nav.chronicles" />
          </Lien>
        </div>
      ) : (
        <figure className={styles.figure} aria-labelledby="v3-apprendre-legende">
          <ol role="list" className={styles.parcours}>
            {rows.map(({ path, cover }) => {
              const name = title(path.title);
              const span = spanText(cover);
              return (
                <li
                  key={path.id}
                  className={styles.rangee}
                  data-actif={hovered === path.id ? '' : undefined}
                  onPointerEnter={() => setHovered(path.id)}
                  onPointerLeave={() => setHovered(null)}
                  onFocus={() => setHovered(path.id)}
                  onBlur={() => setHovered(null)}
                >
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
                    {name.gloss && name.gloss !== name.primary ? <p className={styles.glose}>{name.gloss}</p> : null}
                    <p className={styles.intro}>{typo(path.intro).split(/(?<=[.?])\s/)[0]}</p>
                  </div>
                  <div className={styles.donnees}>
                    {span ? <p className={styles.annees}>{span}</p> : null}
                    <p className={commun.meta}>{t('page.learn.meta', { steps: path.steps.length, questions: path.quiz.length, minutes: path.minutes })}</p>
                    <p className={styles.progression}>{progress(path)}</p>
                  </div>
                  <div className={styles.bande}>
                    <BandeParcours cover={cover} height={desktop ? 44 : 24} year={year} active={hovered === path.id} />
                  </div>
                </li>
              );
            })}
          </ol>
          <figcaption id="v3-apprendre-legende" className={`${commun.legende} ${styles.legende}`}>
            {t('v3.savoirs.apprendre.legende')}
          </figcaption>
        </figure>
      )}
    </Vue>
  );
}
