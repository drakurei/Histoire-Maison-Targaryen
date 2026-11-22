import { useMemo } from 'react';

import { grammar, lexicon, phrases } from '@/core/content/language';
import type { HvStatus } from '@/core/content/types';
import { Gloss, useT, useTx, useTxTypo, VALYRIAN_TAG } from '@/core/i18n';

import { Lien } from '../components/Lien';
import { Note, NoteRef, useNotes } from '../components/Notes';
import { Page } from '../components/Page';
import { Parti } from '../components/Parti';
import { Titre } from '../components/Titre';
import { useFasce } from '../state/fasce';

import { Statut, StatutGlyph, STATUSES } from './savoirs/Statut';
import commun from './savoirs/Savoirs.module.css';
import styles from './LanguagePage.module.css';

/** Les deux mots de la formule, analysés par les chaînes de l'interface (lemme, grammaire, sens). */
const SPECIMEN_WORDS = [
  { form: 'Valar', key: 'valar' },
  { form: 'morghūlis', key: 'morghulis' },
] as const;

/** Un échantillon du lexique, écrit sous le nom de la salle : dragon, feu, sang, maison, roi, mère. */
const SAMPLE_IDS = ['label.dragon', 'label.fire', 'label.blood', 'label.house', 'label.king', 'label.mother'] as const;

/** Le premier exemple d'un statut : une forme des mots de la bibliothèque si possible. */
function exampleOf(status: HvStatus) {
  return lexicon.find((entry) => entry.status === status && entry.theme === 'interface') ?? lexicon.find((entry) => entry.status === status);
}

/**
 * Langue `/langue` (parti, fasce éteinte, spec §5.13). À gauche, ce qu'est le haut valyrien,
 * d'où vient ce qu'on en sait, ce que la bibliothèque s'interdit, les statuts des formes et
 * les trois salles. À droite, collante, la figure est une glose : « Valar morghūlis » analysé
 * mot à mot, avec son statut et la note du linguiste.
 */
export default function LanguagePage() {
  useFasce({ off: true });
  const t = useT();
  const tx = useTx();
  const typo = useTxTypo();
  const notes = useNotes();

  const counts = useMemo(() => {
    const byStatus = new Map<HvStatus, number>();
    for (const entry of lexicon) byStatus.set(entry.status, (byStatus.get(entry.status) ?? 0) + 1);
    return byStatus;
  }, []);
  const tally = useMemo(() => STATUSES.flatMap((status) => Array.from({ length: counts.get(status) ?? 0 }, () => status)), [counts]);
  const valar = phrases.find((phrase) => phrase.id === 'valar-morghulis');
  const sampleForms = useMemo(
    () => SAMPLE_IDS.map((id) => lexicon.find((entry) => entry.id === id)).filter((entry) => entry !== undefined),
    [],
  );
  const firstPhrase = phrases.find((phrase) => phrase.id === 'drakarys') ?? phrases[0];

  const entete = (
    <div className={commun.entete}>
      <Titre k="nav.language" />
      <p className={styles.chapeau}>{t('page.language.lead')}</p>
    </div>
  );

  const temps = (
    <figure className={`${commun.colonne} ${styles.glose}`} aria-labelledby="v2-langue-glose">
      <p className={styles.formule} lang={VALYRIAN_TAG}>
        {valar?.hv ?? 'Valar morghūlis.'}
      </p>
      <dl className={styles.analyse}>
        {SPECIMEN_WORDS.map((word) => (
          <div key={word.key} className={styles.colonneMot}>
            <dt className={styles.motHv} lang={VALYRIAN_TAG}>
              {word.form}
            </dt>
            <dd className={styles.motSens}>{t(`page.language.specimen.${word.key}.sense`)}</dd>
            <dd className={styles.motLemme}>{t(`page.language.specimen.${word.key}.lemma`)}</dd>
            <dd className={styles.motGrammaire}>{t(`page.language.specimen.${word.key}.grammar`)}</dd>
          </div>
        ))}
      </dl>
      <p className={styles.traduction}>{valar ? typo({ fr: valar.fr, en: valar.en }) : t('phrase.valar_morghulis')}</p>
      <figcaption id="v2-langue-glose" className={styles.note}>
        <Statut status={valar?.status ?? 'atteste'} />
        <span>{t('page.language.specimen.caption')}</span>
      </figcaption>
      <p className={styles.reponse}>
        <span className={styles.reponseLabel}>{t('v2.language.reply')}</span>
        <Lien to="/langue/expressions#valar-dohaeris" className={styles.reponseLien}>
          <Gloss k="phrase.valar_dohaeris" />
        </Lien>
      </p>
    </figure>
  );

  const recit = (
    <div className={styles.recit}>
      <section className={commun.section} aria-labelledby="v2-langue-origine">
        <h2 id="v2-langue-origine" className={commun.intertitre}>
          {t('page.language.origin.title')}
        </h2>
        <div className={commun.texte}>
          <p>
            {t('page.language.origin.martin')}
            <NoteRef {...notes.ref(1)} />
          </p>
          <Note {...notes.note(1)}>{t('page.language.note.martin')}</Note>
          <p>
            {t('page.language.origin.peterson')}
            <NoteRef {...notes.ref(2)} />
            <NoteRef {...notes.ref(3)} />
          </p>
          <Note {...notes.note(2)}>{t('page.language.note.peterson')}</Note>
          <Note {...notes.note(3)}>{t('page.language.note.refs')}</Note>
          <p>{t('page.language.origin.shape')}</p>
        </div>
      </section>

      <section className={commun.section} aria-labelledby="v2-langue-interdits">
        <h2 id="v2-langue-interdits" className={commun.intertitre}>
          {t('page.language.forbid.title')}
        </h2>
        <dl className={styles.interdits}>
          {(['script', 'words', 'prose'] as const).map((key) => (
            <div key={key} className={styles.interdit}>
              <dt className={styles.interditTete}>{t(`page.language.forbid.${key}.head`)}</dt>
              <dd className={commun.texte}>{t(`page.language.forbid.${key}.body`)}</dd>
            </div>
          ))}
        </dl>
      </section>

      <section className={commun.section} aria-labelledby="v2-langue-statuts">
        <h2 id="v2-langue-statuts" className={commun.intertitre}>
          {t('page.language.status.title')}
        </h2>
        <p className={commun.texte}>{t('page.language.status.intro')}</p>
        <figure className={styles.compte} aria-labelledby="v2-langue-compte">
          <div className={styles.marques} aria-hidden="true">
            {tally.map((status, index) => (
              <StatutGlyph key={index} status={status} className={styles.marqueCompte} />
            ))}
          </div>
          <figcaption id="v2-langue-compte" className={commun.legende}>
            {t('v2.language.tally', { n: lexicon.length })}
          </figcaption>
        </figure>
        <ul role="list" className={styles.statuts}>
          {STATUSES.map((status) => {
            const n = counts.get(status) ?? 0;
            const example = exampleOf(status);
            return (
              <li key={status} className={styles.statut} data-statut={status}>
                <StatutGlyph status={status} size="1.75rem" className={styles.statutMarque} />
                <div className={styles.statutCorps}>
                  <p className={styles.statutTete}>
                    <span className={styles.statutNom}>{t(`page.savoirs.status.${status}`)}</span>
                    <span className={styles.statutNombre}>
                      {n === 1 ? t('page.language.status.count.one') : t('page.language.status.count', { n })}
                    </span>
                  </p>
                  <p className={styles.statutDef}>{t(`page.savoirs.status.${status}.def`)}</p>
                  {example ? (
                    <p className={styles.exemple}>
                      <span className={styles.exempleLabel}>{t('page.language.status.example')}</span>
                      <Lien to={`/langue/lexique?mot=${encodeURIComponent(example.id)}`} className={styles.exempleLien}>
                        <span lang={VALYRIAN_TAG} className={styles.exempleHv}>
                          {example.hv}
                        </span>
                      </Lien>
                      <span className={styles.exempleSens}>{tx({ fr: example.fr, en: example.en })}</span>
                    </p>
                  ) : null}
                </div>
              </li>
            );
          })}
        </ul>
      </section>

      <section className={commun.section} aria-labelledby="v2-langue-salles">
        <h2 id="v2-langue-salles" className={commun.intertitre}>
          <Gloss k="v2.language.rooms" />
        </h2>
        <ul role="list" className={styles.salles}>
          <li className={styles.salle}>
            <span className={styles.salleNombre} aria-hidden="true">
              {lexicon.length}
            </span>
            <div className={styles.salleCorps}>
              <h3 className={styles.salleNom}>
                <Lien to="/langue/lexique">
                  <Gloss k="page.bati.title.lexicon" />
                </Lien>
              </h3>
              <p className={styles.salleTexte}>{t('page.language.rooms.lexicon', { n: lexicon.length })}</p>
              <p className={styles.echantillon} lang={VALYRIAN_TAG}>
                {sampleForms.map((entry) => entry.hv).join(', ')}
              </p>
            </div>
          </li>
          <li className={styles.salle}>
            <span className={styles.salleNombre} aria-hidden="true">
              {grammar.length}
            </span>
            <div className={styles.salleCorps}>
              <h3 className={styles.salleNom}>
                <Lien to="/langue/grammaire">
                  <Gloss k="page.bati.title.grammar" />
                </Lien>
              </h3>
              <p className={styles.salleTexte}>{t('v2.language.rooms.grammar', { n: grammar.length })}</p>
              <p className={styles.echantillonLecons}>
                {grammar
                  .slice(0, 4)
                  .map((lesson) => tx(lesson.title))
                  .join(', ')}
              </p>
            </div>
          </li>
          <li className={styles.salle}>
            <span className={styles.salleNombre} aria-hidden="true">
              {phrases.length}
            </span>
            <div className={styles.salleCorps}>
              <h3 className={styles.salleNom}>
                <Lien to="/langue/expressions">
                  <Gloss k="page.bati.title.phrases" />
                </Lien>
              </h3>
              <p className={styles.salleTexte}>{t('v2.language.rooms.phrases', { n: phrases.length })}</p>
              {firstPhrase ? (
                <p className={styles.echantillon}>
                  <span lang={VALYRIAN_TAG}>{firstPhrase.hv}</span>{' '}
                  <span className={styles.echantillonSens}>{tx({ fr: firstPhrase.fr, en: firstPhrase.en })}</span>
                </p>
              ) : null}
            </div>
          </li>
        </ul>
      </section>
    </div>
  );

  return (
    <Page partition="parti">
      <Parti entete={entete} recit={recit} temps={temps} />
    </Page>
  );
}
