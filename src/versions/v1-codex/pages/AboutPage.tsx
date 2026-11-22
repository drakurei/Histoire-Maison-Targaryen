import { MAIN_ID } from '@/app/a11y';
import { dragons, getDragon } from '@/core/content/dragons';
import { lexicon } from '@/core/content/language';
import { persons } from '@/core/content/people';
import { places } from '@/core/content/places';
import { sources } from '@/core/content/sources';
import { events } from '@/core/content/timeline';
import { wars } from '@/core/content/wars';
import { useLang, useT, useTitle } from '@/core/i18n';
import { DragonFigure } from '@/shared/dragon';
import { HallmarkJD } from '@/shared/marks/Marks';

import { Figure } from '../components/Figure';
import { Folio } from '../components/Folio';
import { col } from '../components/grid';
import { Rubric } from '../components/Rubric';
import styles from './AboutPage.module.css';

/** Le dragon de la planche : celui qui sert d'étalon à toutes les envergures. */
const PLATE_DRAGON = 'balerion';

/** Les quatre voix de la bibliothèque, dans l'ordre de DESIGN.md §3. */
const FACES = [
  { id: 'texturina', name: 'Texturina', family: 'var(--f-chronique)' },
  { id: 'grenze', name: 'Grenze Gotisch', family: 'var(--f-lettrine)' },
  { id: 'alegreya', name: 'Alegreya', family: 'var(--f-recit)' },
  { id: 'alegreyaSans', name: 'Alegreya Sans', family: 'var(--f-musee)' },
] as const;

/**
 * À propos (/a-propos) : le colophon de la bibliothèque. Pourquoi elle existe, comment elle
 * est faite (données vérifiées, figures dessinées par le code, avec un spécimen), ses
 * polices et leurs licences, sa dette envers Martin et Peterson, la mention non officielle,
 * le poinçon du relieur et la justification de l'édition.
 */
export default function AboutPage() {
  const t = useT();
  const title = useTitle();
  const { reading } = useLang();
  const dragon = getDragon(PLATE_DRAGON);
  const number = new Intl.NumberFormat(reading === 'fr' ? 'fr-FR' : 'en-GB', { maximumFractionDigits: 2 });

  return (
    <main id={MAIN_ID}>
      <Folio>
        <Rubric as="h1" size="monumental" k="nav.about" className={styles.title} />
        <p className={`${styles.lead} ${col.recit}`} lang={reading}>
          {t('page.about.lead')}
        </p>

        <Rubric as="h2" k="page.about.why.title" className={styles.section} />
        <p className={styles.prose} lang={reading}>
          {t('page.about.why.body')}
        </p>

        <Rubric as="h2" k="page.about.how.title" className={styles.section} />
        <div className={styles.prose} lang={reading}>
          <p>{t('page.about.how.data')}</p>
          <p>{t('page.about.how.figures')}</p>
        </div>

        {dragon ? (
          <Figure
            className={`${styles.plate} ${col.pleine}`}
            caption={t('page.about.figure.caption', {
              name: title(dragon.name).primary,
              span: number.format(dragon.look.span),
              neck: number.format(dragon.look.neck),
              tail: number.format(dragon.look.tail),
              horns: number.format(dragon.look.horns),
            })}
          >
            <DragonFigure
              look={dragon.look}
              title={t('page.about.figure.title', { name: title(dragon.name).primary })}
              tone="engraving"
              ground="light"
              unattested="bare"
              className={styles.dragon}
            />
          </Figure>
        ) : null}

        <Rubric as="h2" k="page.about.type.title" className={styles.section} />
        <p className={styles.prose} lang={reading}>
          {t('page.about.type.intro')}
        </p>
        <ul role="list" className={`${styles.faces} ${col.pleine}`}>
          {FACES.map((face) => (
            <li key={face.id} className={styles.face}>
              <span className={styles.faceName} style={{ fontFamily: face.family }} data-face={face.id}>
                {face.name}
              </span>
              <span className={styles.faceRole} lang={reading}>
                {t(`page.about.type.${face.id}.role`)}
              </span>
              <span className={styles.faceCredit}>{t(`page.about.type.${face.id}.credit`)}</span>
            </li>
          ))}
        </ul>

        <Rubric as="h2" k="page.about.debt.title" className={styles.section} />
        <div className={styles.prose} lang={reading}>
          <p>{t('page.about.debt.martin')}</p>
          <p>{t('page.about.debt.peterson')}</p>
          <p className={styles.unofficial}>{t('page.bati.colophon.unofficial')}</p>
        </div>

        <Rubric as="h2" k="page.about.mark.title" className={styles.section} />
        <div className={`${styles.mark} ${col.pleine}`}>
          <HallmarkJD size="7.5rem" className={styles.hallmark} title={t('page.bati.colophon.hallmark')} />
          <p className={styles.markText} lang={reading}>
            {t('page.about.mark.body')}
          </p>
        </div>

        <p className={`${styles.justification} ${col.recit}`} lang={reading}>
          {t('page.about.justification', {
            events: events.length,
            people: persons.length,
            dragons: dragons.length,
            wars: wars.length,
            places: places.length,
            words: lexicon.length,
            sources: sources.length,
          })}
        </p>
      </Folio>
    </main>
  );
}
