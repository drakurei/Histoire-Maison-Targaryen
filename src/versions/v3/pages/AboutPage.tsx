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
import { col } from '@/versions/v1-codex/components/grid';
import { Rubric } from '@/versions/v1-codex/components/Rubric';
import { useHashScroll } from '@/versions/v1-codex/pages/language/useHashScroll';
import { DOMAIN, PEAK, presence } from '@/versions/v2/state/scene';

import { Colonne } from '../components/common/Colonne';
import { Parti3 } from '../components/common/Parti3';
import { useVue } from '../components/common/useVue';
import { Vue } from '../components/common/Vue';
import commun from './savoirs/commun.module.css';
import styles from './savoirs/APropos.module.css';

/** Les quatre voix de la bibliothèque, chacune écrite dans sa propre famille (DESIGN §3). */
const FAMILIES = [
  { key: 'texturina', name: 'Texturina', family: 'var(--f-chronique)' },
  { key: 'grenze', name: 'Grenze Gotisch', family: 'var(--f-lettrine)' },
  { key: 'alegreya', name: 'Alegreya', family: 'var(--f-recit)' },
  { key: 'alegreyaSans', name: 'Alegreya Sans', family: 'var(--f-musee)' },
] as const;

/** Première année où la fasce atteint son plus haut. */
const PEAK_YEAR = presence.years.find((entry) => entry.attested.length === PEAK)?.year ?? null;

/**
 * À propos `/a-propos` (v3-spec §6.18 ; folio, fasce éteinte). Le colophon sur le vélin :
 * pourquoi cette bibliothèque, comment elle est faite, ce que compte la fasce et ce qu'elle
 * ne compte pas, les polices et leurs licences, ce qu'elle doit à George R. R. Martin et à
 * David J. Peterson, la mention non officielle, la justification de l'édition. La colonne du
 * champ porte l'emblème en sang et le poinçon du relieur (`#poincon`, cible de « dracarys »).
 * Au téléphone, le titre vient d'abord, l'emblème après le texte.
 */
export default function AboutPage() {
  const t = useT();
  const { reading } = useLang();
  useVue({ etat: 'eteinte' });
  useHashScroll();

  const titreId = 'v3-apropos-titre';
  const tete = (
    <header className={`${commun.tete} ${col.recit}`}>
      <Rubric as="h1" id={titreId} k="nav.about" />
      <p className={commun.chapeau} lang={reading}>
        {t('page.about.lead')}
      </p>
    </header>
  );

  const folio = (
    <>
      <section className={`${commun.section} ${col.recit}`} aria-labelledby="v3-apropos-pourquoi">
        <Rubric as="h2" id="v3-apropos-pourquoi" k="page.about.why.title" />
        <div className={commun.texte} lang={reading}>
          <p>{t('page.about.why.body')}</p>
        </div>
      </section>

      <section className={`${commun.section} ${col.recit}`} aria-labelledby="v3-apropos-comment">
        <Rubric as="h2" id="v3-apropos-comment" k="page.about.how.title" />
        <div className={commun.texte} lang={reading}>
          <p>{t('page.about.how.data')}</p>
          <p>{t('page.about.how.figures')}</p>
        </div>
      </section>

      <section className={`${commun.section} ${col.recit}`} aria-labelledby="v3-apropos-fasce">
        <Rubric as="h2" id="v3-apropos-fasce" k="v2.about.fasce.title" />
        <div className={commun.texte} lang={reading}>
          <p>{t('v2.about.fasce.body')}</p>
          <p>{t('v2.about.fasce.count')}</p>
          <p>{t('v2.about.fasce.limits')}</p>
        </div>
        <p className={`${commun.legende} ${styles.chiffre}`}>
          {t('v2.about.fasce.caption', { to: formatYear(DOMAIN[1], reading), n: PEAK, year: formatYear(PEAK_YEAR, reading) })}
        </p>
      </section>

      <section className={`${commun.section} ${col.pleine}`} aria-labelledby="v3-apropos-polices">
        <Rubric as="h2" id="v3-apropos-polices" k="page.about.type.title" />
        <p className={commun.texte} lang={reading}>
          {t('page.about.type.intro')}
        </p>
        <dl className={styles.familles}>
          {FAMILIES.map((family) => (
            <div key={family.key} className={styles.famille}>
              <dt className={styles.familleNom} style={{ fontFamily: family.family }} data-famille={family.key}>
                {family.name}
              </dt>
              <dd className={styles.familleRole} lang={reading}>
                {t(`page.about.type.${family.key}.role`)}
              </dd>
              <dd className={styles.familleCredit}>{t(`page.about.type.${family.key}.credit`)}</dd>
            </div>
          ))}
        </dl>
      </section>

      <section className={`${commun.section} ${col.recit}`} aria-labelledby="v3-apropos-dette">
        <Rubric as="h2" id="v3-apropos-dette" k="page.about.debt.title" />
        <div className={commun.texte} lang={reading}>
          <p>{t('page.about.debt.martin')}</p>
          <p>{t('page.about.debt.peterson')}</p>
        </div>
        <p className={styles.mention}>{t('page.bati.colophon.unofficial')}</p>
      </section>

      <p className={`${styles.justification} ${col.recit}`} lang={reading}>
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
    </>
  );

  const colonne = (
    <Colonne
      label={t('v3.savoirs.apropos.colonne')}
      figure={
        <div className={`${commun.colonne} ${styles.colonne}`}>
          <figure className={styles.embleme}>
            <Emblem className={styles.emblemeDessin} title={t('v2.about.emblem')} />
            <figcaption className={commun.legende}>{t('v2.about.recto')}</figcaption>
          </figure>
          <section id="poincon" className={styles.poincon} aria-labelledby="v3-apropos-poincon" tabIndex={-1}>
            <HallmarkJD size="4.5rem" className={styles.poinconMarque} title={t('page.bati.colophon.hallmark')} />
            <div className={styles.poinconTexte}>
              <h2 id="v3-apropos-poincon" className={styles.poinconTitre}>
                <Gloss k="page.about.mark.title" />
              </h2>
              <p>{t('v2.about.mark.body')}</p>
            </div>
          </section>
        </div>
      }
    />
  );

  return (
    <Vue partition="parti">
      <Parti3 labelledBy={titreId} tete={tete} folio={folio} colonne={colonne} />
    </Vue>
  );
}
