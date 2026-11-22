import { useMemo } from 'react';
import type { ReactNode } from 'react';

import { grammar, lexicon, phrases } from '@/core/content/language';
import type { HvStatus, LexiconEntry } from '@/core/content/types';
import { Gloss, useLang, useT, useTx, useTxTypo, VALYRIAN_TAG } from '@/core/i18n';
import { normalize } from '@/core/search';
import { Figure } from '@/versions/v1-codex/components/Figure';
import { col } from '@/versions/v1-codex/components/grid';
import { MarginNote } from '@/versions/v1-codex/components/MarginNote';
import { NoteRef } from '@/versions/v1-codex/components/NoteRef';
import { Passage } from '@/versions/v1-codex/components/Passage';
import { Rubric } from '@/versions/v1-codex/components/Rubric';
import { Interlinear } from '@/versions/v1-codex/pages/language/Interlinear';
import type { InterlinearWord } from '@/versions/v1-codex/pages/language/Interlinear';
import { STATUS_ORDER } from '@/versions/v1-codex/pages/language/lexiconTools';
import { StatusGlyph, StatusMark } from '@/versions/v1-codex/pages/language/StatusMark';
import { Lien } from '@/versions/v2/components/Lien';

import { Colonne } from '../components/common/Colonne';
import { DESKTOP, useMedia } from '../components/common/useMedia';
import { Parti3 } from '../components/common/Parti3';
import { useVue } from '../components/common/useVue';
import { Vue } from '../components/common/Vue';
import commun from './savoirs/commun.module.css';
import styles from './savoirs/Langue.module.css';

/** Les deux mots de la formule ; leur analyse vient des chaînes publiées (lemme, grammaire, sens). */
const SPECIMEN = [
  { form: 'Valar', key: 'valar' },
  { form: 'morghūlis', key: 'morghulis' },
] as const;

/** Un échantillon du lexique écrit sous le nom de la salle : dragon, feu, sang, maison, roi, mère. */
const SAMPLE_IDS = ['label.dragon', 'label.fire', 'label.blood', 'label.house', 'label.king', 'label.mother'] as const;
const FORBIDDEN = ['script', 'words', 'prose'] as const;

/** L'exemple d'un statut : un mot seul dont la traduction diffère de la forme. */
function exampleOf(status: HvStatus): LexiconEntry | undefined {
  const own = lexicon.filter((entry) => entry.status === status && !/\s/.test(entry.hv.trim()));
  return own.find((entry) => entry.theme !== 'interface' && normalize(entry.hv) !== normalize(entry.fr)) ?? own[0];
}

/**
 * La langue `/langue` (v3-spec §6.13 ; parti, fasce éteinte). Le folio dit ce qu'est le haut
 * valyrien, d'où vient ce qu'on en sait, ce que la bibliothèque s'interdit, comment lire les
 * statuts, puis ouvre les trois salles avec leur compte. La colonne du champ porte la figure :
 * « Valar morghūlis » analysé mot à mot. Au téléphone, la formule passe sous le chapeau, sur
 * le vélin : le premier écran montre des mots.
 */
export default function LanguagePage() {
  const t = useT();
  const tx = useTx();
  const typo = useTxTypo();
  const { reading } = useLang();
  const desktop = useMedia(DESKTOP);
  useVue({ etat: 'eteinte' });

  const counts = useMemo(() => {
    const byStatus = new Map<HvStatus, number>();
    for (const entry of lexicon) byStatus.set(entry.status, (byStatus.get(entry.status) ?? 0) + 1);
    return byStatus;
  }, []);
  const valar = phrases.find((phrase) => phrase.id === 'valar-morghulis');
  const sample = useMemo(() => SAMPLE_IDS.map((id) => lexicon.find((entry) => entry.id === id)).filter((entry) => entry !== undefined), []);
  const firstPhrase = phrases.find((phrase) => phrase.id === 'drakarys') ?? phrases[0];
  const words: InterlinearWord[] = SPECIMEN.map((word) => ({
    form: word.form,
    lemma: t(`page.language.specimen.${word.key}.lemma`),
    grammar: t(`page.language.specimen.${word.key}.grammar`),
    sense: t(`page.language.specimen.${word.key}.sense`),
  }));
  const free = valar ? typo({ fr: valar.fr, en: valar.en }) : t('phrase.valar_morghulis');

  const titreId = 'v3-langue-titre';
  const tete = (
    <header className={`${commun.tete} ${col.recit}`}>
      <Rubric as="h1" id={titreId} k="nav.language" />
      <p className={commun.chapeau} lang={reading}>
        {t('page.language.lead')}
      </p>
    </header>
  );

  const folio = (
    <>
      {!desktop ? (
        <Figure className={`${styles.formuleTel} ${col.pleine}`} caption={t('page.language.specimen.caption')}>
          <Interlinear words={words} free={free} size="courant" />
        </Figure>
      ) : null}

      <section className={`${commun.section} ${col.pleine}`} aria-labelledby="v3-langue-origine">
        <Rubric as="h2" id="v3-langue-origine" k="page.language.origin.title" />
        <Passage
          notes={
            <>
              <MarginNote id="v3-langue-n1" n={1}>
                <p>{t('page.language.note.martin')}</p>
              </MarginNote>
              <MarginNote id="v3-langue-n2" n={2}>
                <p>{t('page.language.note.peterson')}</p>
              </MarginNote>
              <MarginNote id="v3-langue-n3" n={3}>
                <p>{t('page.language.note.refs')}</p>
              </MarginNote>
            </>
          }
        >
          <div className={commun.texte} lang={reading}>
            <p>
              {t('page.language.origin.martin')}
              <NoteRef target="v3-langue-n1" n={1} />
            </p>
            <p>
              {t('page.language.origin.peterson')}
              <NoteRef target="v3-langue-n2" n={2} />
            </p>
            <p>
              {t('page.language.origin.shape')}
              <NoteRef target="v3-langue-n3" n={3} />
            </p>
          </div>
        </Passage>
      </section>

      <section className={`${commun.section} ${col.recit}`} aria-labelledby="v3-langue-interdits">
        <Rubric as="h2" id="v3-langue-interdits" k="page.language.forbid.title" />
        <div className={`${commun.texte} ${styles.interdits}`} lang={reading}>
          {FORBIDDEN.map((key) => (
            <p key={key}>
              <span className={commun.amorce}>{t(`page.language.forbid.${key}.head`)}</span> {t(`page.language.forbid.${key}.body`)}
            </p>
          ))}
        </div>
      </section>

      <section className={`${commun.section} ${col.pleine}`} aria-labelledby="v3-langue-statuts">
        <Rubric as="h2" id="v3-langue-statuts" k="page.language.status.title" />
        <p className={commun.texte} lang={reading}>
          {t('page.language.status.intro')}
        </p>
        <ul role="list" className={styles.statuts}>
          {STATUS_ORDER.map((status) => {
            const n = counts.get(status) ?? 0;
            const example = exampleOf(status);
            return (
              <li key={status} className={styles.statut} data-statut={status}>
                <StatusGlyph status={status} size="2.25rem" className={styles.statutMarque} />
                <p className={styles.statutNom}>
                  {t(`page.savoirs.status.${status}`)}
                  <span className={styles.statutNombre}>{n === 1 ? t('page.language.status.count.one') : t('page.language.status.count', { n })}</span>
                </p>
                <p className={styles.statutDef} lang={reading}>
                  {t(`page.savoirs.status.${status}.def`)}
                </p>
                {example ? (
                  <p className={styles.exemple}>
                    <span className={styles.exempleLabel}>{t('page.language.status.example')}</span>{' '}
                    <Lien to={`/langue/lexique?mot=${encodeURIComponent(example.id)}`} className={styles.exempleLien} lang={VALYRIAN_TAG}>
                      {example.hv}
                    </Lien>{' '}
                    {normalize(example[reading]) !== normalize(example.hv) ? <span className={styles.exempleSens}>{example[reading]}</span> : null}
                  </p>
                ) : null}
              </li>
            );
          })}
        </ul>
      </section>

      <section className={`${commun.section} ${col.pleine}`} aria-labelledby="v3-langue-salles">
        <Rubric as="h2" id="v3-langue-salles" k="v2.language.rooms" />
        <ol role="list" className={styles.salles}>
          <Salle n={lexicon.length} to="/langue/lexique" k="page.bati.title.lexicon" texte={t('page.language.rooms.lexicon', { n: lexicon.length })}>
            <p className={styles.echantillon} lang={VALYRIAN_TAG}>
              {sample.map((entry) => entry.hv).join(', ')}
            </p>
          </Salle>
          <Salle n={grammar.length} to="/langue/grammaire" k="page.bati.title.grammar" texte={t('v2.language.rooms.grammar', { n: grammar.length })}>
            <p className={styles.echantillonLecons}>
              {[...grammar]
                .sort((a, b) => a.order - b.order)
                .slice(0, 4)
                .map((lesson) => tx(lesson.title))
                .join(', ')}
            </p>
          </Salle>
          <Salle n={phrases.length} to="/langue/expressions" k="page.bati.title.phrases" texte={t('v2.language.rooms.phrases', { n: phrases.length })}>
            {firstPhrase ? (
              <p className={styles.echantillon}>
                <span lang={VALYRIAN_TAG}>{firstPhrase.hv}</span> <span className={styles.echantillonSens}>{tx({ fr: firstPhrase.fr, en: firstPhrase.en })}</span>
              </p>
            ) : null}
          </Salle>
        </ol>
      </section>
    </>
  );

  const colonne = desktop ? (
    <Colonne
      label={t('v3.savoirs.langue.colonne')}
      figure={
        <figure className={`${commun.colonne} ${styles.glose}`} aria-labelledby="v3-langue-glose">
          <p className={styles.formule} lang={VALYRIAN_TAG}>
            {valar?.hv ?? 'Valar morghūlis.'}
          </p>
          <Interlinear words={words} free={free} size="courant" className={styles.analyse} />
          <figcaption id="v3-langue-glose" className={styles.note}>
            <StatusMark status={valar?.status ?? 'atteste'} />
            <span className={commun.legende}>{t('page.language.specimen.caption')}</span>
          </figcaption>
          <p className={styles.reponse}>
            <span className={commun.legende}>{t('v2.language.reply')}</span>
            <Lien to="/langue/expressions#valar-dohaeris" className={styles.reponseLien}>
              <Gloss k="phrase.valar_dohaeris" />
            </Lien>
          </p>
        </figure>
      }
    />
  ) : null;

  return (
    <Vue partition="parti">
      <Parti3 labelledBy={titreId} tete={tete} folio={folio} colonne={colonne} />
    </Vue>
  );
}

function Salle({ n, to, k, texte, children }: { n: number; to: string; k: string; texte: string; children?: ReactNode }) {
  return (
    <li className={styles.salle}>
      <span className={styles.salleNombre} aria-hidden="true">
        {n}
      </span>
      <div className={styles.salleCorps}>
        <h3 className={styles.salleNom}>
          <Lien to={to}>
            <Gloss k={k} />
          </Lien>
        </h3>
        <p className={styles.salleTexte}>{texte}</p>
        {children}
      </div>
    </li>
  );
}
