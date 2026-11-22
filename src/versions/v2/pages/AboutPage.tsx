import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';

import { dragons } from '@/core/content/dragons';
import { lexicon } from '@/core/content/language';
import { persons } from '@/core/content/people';
import { places } from '@/core/content/places';
import { sources } from '@/core/content/sources';
import { events, periods } from '@/core/content/timeline';
import { wars } from '@/core/content/wars';
import { formatYear, Gloss, useLang, useT } from '@/core/i18n';
import { Emblem } from '@/shared/emblem/Emblem';
import { HallmarkJD } from '@/shared/marks/Marks';

import { Page } from '../components/Page';
import { Profil } from '../components/Profil';
import { Titre } from '../components/Titre';
import { useElementWidth } from '../components/useElementWidth';
import { useFasce } from '../state/fasce';
import { DOMAIN, PEAK, presence } from '../state/scene';

import commun from './savoirs/Savoirs.module.css';
import styles from './AboutPage.module.css';

/** Les quatre familles, chacune écrite dans sa propre voix (DESIGN §3). */
const FAMILIES = [
  { key: 'texturina', name: 'Texturina', className: 'texturina' },
  { key: 'grenze', name: 'Grenze Gotisch', className: 'grenze' },
  { key: 'alegreya', name: 'Alegreya', className: 'alegreya' },
  { key: 'alegreyaSans', name: 'Alegreya Sans', className: 'alegreyaSans' },
] as const;

/** Première année où la fasce atteint son plus haut. */
const PEAK_YEAR = presence.years.find((entry) => entry.attested.length === PEAK)?.year ?? null;

/**
 * À propos `/a-propos` (champ plein, fasce éteinte, spec §5.16) : le colophon. Pourquoi
 * cette bibliothèque, comment elle est faite, ce qu'est la fasce et ce qu'elle ne compte
 * pas, les polices et leurs licences, ce qu'elle doit à George R. R. Martin et à David J.
 * Peterson. La figure : l'emblème en sang sur le sable ; on le retourne pour voir, au dos, le
 * poinçon du relieur (`#poincon`, cible du détail caché).
 */
export default function AboutPage() {
  useFasce({ off: true });
  const t = useT();
  const { reading } = useLang();
  const { hash } = useLocation();
  const [verso, setVerso] = useState(hash === '#poincon');
  const [ref, width] = useElementWidth<HTMLDivElement>();

  useEffect(() => {
    if (hash === '#poincon') setVerso(true);
  }, [hash]);

  const profileHeight = width > 0 ? Math.round(Math.min(160, Math.max(72, width * 0.18))) : 0;

  return (
    <Page partition="champ" className={styles.page}>
      <div className={styles.texte}>
        <div className={commun.entete}>
          <Titre k="nav.about" />
          <p className={styles.chapeau}>{t('v2.about.lead')}</p>
        </div>

        <section className={commun.section} aria-labelledby="v2-apropos-pourquoi">
          <h2 id="v2-apropos-pourquoi" className={commun.intertitre}>
            <Gloss k="page.about.why.title" />
          </h2>
          <p className={commun.texte}>{t('page.about.why.body')}</p>
        </section>

        <section className={commun.section} aria-labelledby="v2-apropos-comment">
          <h2 id="v2-apropos-comment" className={commun.intertitre}>
            {t('page.about.how.title')}
          </h2>
          <div className={commun.texte}>
            <p>{t('page.about.how.data')}</p>
            <p>{t('page.about.how.figures')}</p>
          </div>
        </section>

        <section className={commun.section} aria-labelledby="v2-apropos-fasce">
          <h2 id="v2-apropos-fasce" className={commun.intertitre}>
            {t('v2.about.fasce.title')}
          </h2>
          <div className={commun.texte}>
            <p>{t('v2.about.fasce.body')}</p>
            <p>{t('v2.about.fasce.count')}</p>
            <p>{t('v2.about.fasce.limits')}</p>
          </div>
          <figure className={styles.fasce} aria-labelledby="v2-apropos-fasce-legende">
            <div ref={ref} className={styles.fasceDessin} aria-hidden="true">
              {width > 0 ? <Profil from={DOMAIN[0]} to={DOMAIN[1]} width={width} height={profileHeight} full={profileHeight} /> : null}
            </div>
            <figcaption id="v2-apropos-fasce-legende" className={commun.legende}>
              {t('v2.about.fasce.caption', {
                to: formatYear(DOMAIN[1], reading),
                n: PEAK,
                year: formatYear(PEAK_YEAR, reading),
              })}
            </figcaption>
          </figure>
        </section>

        <section className={commun.section} aria-labelledby="v2-apropos-polices">
          <h2 id="v2-apropos-polices" className={commun.intertitre}>
            {t('page.about.type.title')}
          </h2>
          <p className={commun.texte}>{t('page.about.type.intro')}</p>
          <dl className={styles.familles}>
            {FAMILIES.map((family) => (
              <div key={family.key} className={styles.famille}>
                <dt className={`${styles.familleNom} ${styles[family.className]}`}>{family.name}</dt>
                <dd className={styles.familleRole}>{t(`page.about.type.${family.key}.role`)}</dd>
                <dd className={styles.familleCredit}>{t(`page.about.type.${family.key}.credit`)}</dd>
              </div>
            ))}
          </dl>
        </section>

        <section className={commun.section} aria-labelledby="v2-apropos-dette">
          <h2 id="v2-apropos-dette" className={commun.intertitre}>
            {t('page.about.debt.title')}
          </h2>
          <div className={commun.texte}>
            <p>{t('page.about.debt.martin')}</p>
            <p>{t('page.about.debt.peterson')}</p>
            <p className={styles.mention}>{t('page.bati.colophon.unofficial')}</p>
          </div>
        </section>

        <section id="poincon" className={`${commun.section} ${styles.poincon}`} aria-labelledby="v2-apropos-poincon">
          <h2 id="v2-apropos-poincon" className={commun.intertitre}>
            <Gloss k="page.about.mark.title" />
          </h2>
          <div className={styles.poinconCorps}>
            <HallmarkJD size="4rem" className={styles.poinconMarque} />
            <p className={commun.texte}>{t('v2.about.mark.body')}</p>
          </div>
          <p className={styles.justification}>
            {t('v2.about.justification', {
              periods: periods.length,
              events: events.length,
              people: persons.length,
              dragons: dragons.length,
              wars: wars.length,
              places: places.length,
              words: lexicon.length,
              sources: sources.length,
            })}
          </p>
        </section>
      </div>

      <figure className={styles.figure}>
        <div className={styles.medaille} data-verso={verso ? '' : undefined}>
          <div className={styles.face} aria-hidden={verso}>
            <Emblem className={styles.emblem} title={t('v2.about.emblem')} />
          </div>
          <div className={`${styles.face} ${styles.dos}`} aria-hidden={!verso}>
            <Emblem className={`${styles.emblem} ${styles.emblemDos}`} />
            <HallmarkJD size="22%" className={styles.dosMarque} title={t('page.bati.colophon.hallmark')} />
          </div>
        </div>
        <figcaption className={styles.figureLegende}>
          <span className={commun.legende}>{verso ? t('v2.about.verso') : t('v2.about.recto')}</span>
          <button type="button" className={styles.retourner} aria-pressed={verso} onClick={() => setVerso((value) => !value)}>
            {verso ? t('v2.about.show_recto') : t('v2.about.show_verso')}
          </button>
        </figcaption>
      </figure>
    </Page>
  );
}
