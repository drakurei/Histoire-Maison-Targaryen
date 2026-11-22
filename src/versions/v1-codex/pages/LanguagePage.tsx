import { useMemo } from 'react';

import { MAIN_ID } from '@/app/a11y';
import { VLink } from '@/app/version';
import { getLexiconEntry, grammar, lexicon, phrases } from '@/core/content/language';
import type { HvStatus, LexiconEntry } from '@/core/content/types';
import { Gloss, useLang, useT, VALYRIAN_TAG } from '@/core/i18n';
import { normalize } from '@/core/search';

import { Figure } from '../components/Figure';
import { Folio } from '../components/Folio';
import { col } from '../components/grid';
import { MarginNote } from '../components/MarginNote';
import { NoteRef } from '../components/NoteRef';
import { Passage } from '../components/Passage';
import { Rubric } from '../components/Rubric';
import { Interlinear } from './language/Interlinear';
import type { InterlinearWord } from './language/Interlinear';
import { countBy, entryAnchor, sortLexicon, STATUS_ORDER } from './language/lexiconTools';
import { LexiconWall } from './language/LexiconWall';
import { StatusGlyph, StatusMark } from './language/StatusMark';
import { useHashScroll } from './language/useHashScroll';
import styles from './LanguagePage.module.css';

/** La formule analysée en tête de page ; ses mots viennent du lexique, l'analyse des chaînes. */
const SPECIMEN_ID = 'phrase.valar_morghulis';
const SPECIMEN_KEYS = ['valar', 'morghulis'] as const;
const FORBIDDEN = ['script', 'words', 'prose'] as const;

/**
 * La langue (/langue) : ce qu'est le haut valyrien, d'où il vient, ce que la bibliothèque
 * s'interdit, comment lire les statuts ; puis le lexique entier en spécimen.
 */
export default function LanguagePage() {
  const t = useT();
  const { reading } = useLang();
  const sorted = useMemo(() => sortLexicon(lexicon), []);
  const counts = useMemo(() => countBy(lexicon, (entry) => entry.status), []);
  const specimen = getLexiconEntry(SPECIMEN_ID);
  useHashScroll();

  const specimenWords: InterlinearWord[] = specimen
    ? specimen.hv.split(/\s+/).map((form, index) => {
        const key = SPECIMEN_KEYS[index];
        return key
          ? {
              form,
              lemma: t(`page.language.specimen.${key}.lemma`),
              grammar: t(`page.language.specimen.${key}.grammar`),
              sense: t(`page.language.specimen.${key}.sense`),
            }
          : { form };
      })
    : [];

  return (
    <main id={MAIN_ID}>
      <Folio>
        <Rubric as="h1" size="monumental" k="nav.language" className={styles.title} />

        <p className={`${styles.lead} ${col.recit}`} lang={reading}>
          {t('page.language.lead')}
        </p>

        <nav className={`${styles.rooms} ${col.marge}`} aria-labelledby="langue-salles">
          <h2 id="langue-salles" className={styles.roomsTitle}>
            {t('page.language.rooms.title')}
          </h2>
          <ul role="list" className={styles.roomList}>
            <Room to="/langue/lexique" k="page.bati.title.lexicon" text={t('page.language.rooms.lexicon', { n: lexicon.length })} />
            <Room
              to="/langue/grammaire"
              k="page.bati.title.grammar"
              text={t('page.language.rooms.grammar')}
              pending={grammar.length === 0 ? t('page.language.rooms.pending') : undefined}
            />
            <Room
              to="/langue/expressions"
              k="page.bati.title.phrases"
              text={t('page.language.rooms.phrases')}
              pending={phrases.length === 0 ? t('page.language.rooms.pending') : undefined}
            />
          </ul>
        </nav>

        {specimen ? (
          <Figure className={`${styles.specimen} ${col.pleine}`} caption={t('page.language.specimen.caption')} number={1}>
            <Interlinear words={specimenWords} free={reading === 'fr' ? specimen.fr : specimen.en} />
          </Figure>
        ) : null}

        <Rubric as="h2" id="origine" k="page.language.origin.title" className={styles.section} />
        <Passage
          notes={
            <>
              <MarginNote id="langue-n1" n={1}>
                <p>{t('page.language.note.martin')}</p>
              </MarginNote>
              <MarginNote id="langue-n2" n={2}>
                <p>{t('page.language.note.peterson')}</p>
              </MarginNote>
              <MarginNote id="langue-n3" n={3}>
                <p>{t('page.language.note.refs')}</p>
              </MarginNote>
            </>
          }
        >
          <div className={styles.prose} lang={reading}>
            <p>
              {t('page.language.origin.martin')}
              <NoteRef target="langue-n1" n={1} />
            </p>
            <p>
              {t('page.language.origin.peterson')}
              <NoteRef target="langue-n2" n={2} />
            </p>
            <p>
              {t('page.language.origin.shape')}
              <NoteRef target="langue-n3" n={3} />
            </p>
          </div>
        </Passage>

        <Rubric as="h2" id="interdits" k="page.language.forbid.title" className={styles.section} />
        <div className={styles.forbid} lang={reading}>
          {FORBIDDEN.map((id) => (
            <p key={id}>
              <strong className={styles.runIn}>{t(`page.language.forbid.${id}.head`)}</strong> {t(`page.language.forbid.${id}.body`)}
            </p>
          ))}
        </div>

        <Rubric as="h2" id="statuts" k="page.language.status.title" className={styles.section} />
        <p className={styles.statusIntro} lang={reading}>
          {t('page.language.status.intro')}
        </p>
        <dl className={`${styles.statuses} ${col.pleine}`}>
          {STATUS_ORDER.map((status) => (
            <StatusRow key={status} status={status} count={counts.get(status) ?? 0} example={exampleOf(sorted, status)} />
          ))}
        </dl>

        {sorted.length > 0 ? (
          <Figure
            className={`${styles.wallFigure} ${col.pleine}`}
            number={2}
            caption={
              <>
                {t('page.language.wall.caption', { n: sorted.length })}
                <span className={styles.legend}>
                  {STATUS_ORDER.filter((status) => counts.has(status)).map((status) => (
                    <StatusMark key={status} status={status} />
                  ))}
                </span>
              </>
            }
          >
            <LexiconWall entries={sorted} />
          </Figure>
        ) : null}
      </Folio>
    </main>
  );
}

/** Premier mot du statut hors interface, pour l'exemple ; à défaut, le premier venu. */
function exampleOf(entries: readonly LexiconEntry[], status: HvStatus): LexiconEntry | undefined {
  const own = entries.filter((entry) => entry.status === status);
  const single = own.filter((entry) => !/\s/.test(entry.hv.trim()));
  // Un exemple parlant : un mot seul dont la traduction diffère de la forme (pas « Aegon » pour « Āegon »).
  const telling = single.find((entry) => entry.theme !== 'interface' && normalize(entry.hv) !== normalize(entry.fr));
  return telling ?? single.find((entry) => normalize(entry.hv) !== normalize(entry.fr)) ?? own[0];
}

function Room({ to, k, text, pending }: { to: string; k: string; text: string; pending?: string }) {
  return (
    <li className={styles.room}>
      <VLink to={to} className={styles.roomLink}>
        <Gloss k={k} classes={{ main: styles.roomName, tr: styles.roomGloss }} />
      </VLink>
      <span className={styles.roomText}>{text}</span>
      {pending ? <span className={styles.pending}>{pending}</span> : null}
    </li>
  );
}

function StatusRow({ status, count, example }: { status: HvStatus; count: number; example?: LexiconEntry }) {
  const t = useT();
  const { reading } = useLang();
  return (
    <div className={styles.status} data-status={status}>
      <dt className={styles.statusTerm}>
        <StatusGlyph status={status} size="2.25rem" className={styles.statusGlyph} />
        <span className={styles.statusLabel}>{t(`page.savoirs.status.${status}`)}</span>
      </dt>
      <dd className={styles.statusDef} lang={reading}>
        {t(`page.savoirs.status.${status}.def`)}
      </dd>
      <dd className={styles.statusData}>
        <span className={styles.statusCount}>
          {count === 1 ? t('page.language.status.count.one') : t('page.language.status.count', { n: count })}
        </span>
        {example ? (
          <span className={styles.statusExample}>
            {t('page.language.status.example')}{' '}
            <VLink to={`/langue/lexique#${entryAnchor(example.id)}`} className={styles.exampleLink} lang={VALYRIAN_TAG}>
              {example.hv}
            </VLink>
            {normalize(example[reading]) !== normalize(example.hv) ? <span className={styles.exampleGloss}>{example[reading]}</span> : null}
          </span>
        ) : null}
      </dd>
    </div>
  );
}
