import { Fragment, useCallback, useId, useMemo, useState } from 'react';
import type { ChangeEvent } from 'react';
import { useSearchParams } from 'react-router-dom';

import { lexicon } from '@/core/content/language';
import type { LexiconEntry } from '@/core/content/types';
import { useT, useTx, useTxTypo, VALYRIAN_TAG } from '@/core/i18n';
import { normalize } from '@/core/search';

import { Filtres, useFiltre } from '../components/Filtres';
import { Page } from '../components/Page';
import { Parti } from '../components/Parti';
import { Titre } from '../components/Titre';
import { Vide } from '../components/Vide';
import { useFasce } from '../state/fasce';

import { DESKTOP_QUERY, useMedia } from './savoirs/hooks';
import commun from './savoirs/Savoirs.module.css';
import { Specimen } from './savoirs/Specimen';
import { Statut, STATUSES } from './savoirs/Statut';
import styles from './LexiconPage.module.css';

/** Le mot montré quand le lecteur n'en a choisi aucun : « dragon ». */
const DEFAULT_WORD = 'label.dragon';

interface Row {
  entry: LexiconEntry;
  /** Forme normalisée : tri, initiale et recherche sans macrons. */
  key: string;
  letter: string;
  haystack: string;
}

const ROWS: readonly Row[] = lexicon
  .map((entry) => {
    const key = normalize(entry.hv);
    return {
      entry,
      key,
      letter: (key.match(/[a-z]/)?.[0] ?? '#').toUpperCase(),
      haystack: normalize(`${entry.hv} ${entry.fr} ${entry.en}`),
    };
  })
  .sort((a, b) => a.key.localeCompare(b.key, 'en'));

const THEMES: readonly string[] = [...new Set(lexicon.map((entry) => entry.theme))];

function rowId(entry: LexiconEntry): string {
  return `mot-${entry.id}`;
}

/**
 * Lexique `/langue/lexique` (parti, fasce éteinte, spec §5.13). Des mots dès le premier
 * écran : la table alphabétique, cherchable sans macrons, filtrée par thème et par statut ;
 * à droite, collant, le spécimen du mot survolé ou choisi. Au téléphone, toucher un mot
 * déplie son spécimen sous la rangée. Tout l'état est dans l'adresse (`q`, `theme`, `statut`,
 * `mot`), sans entrée d'historique.
 */
export default function LexiconPage() {
  useFasce({ off: true });
  const t = useT();
  const tx = useTx();
  const typo = useTxTypo();
  const desktop = useMedia(DESKTOP_QUERY);
  const specimenId = useId();
  const [params, setParams] = useSearchParams();
  const statuts = useFiltre('statut');
  const query = params.get('q') ?? '';
  const theme = params.get('theme') ?? '';
  const chosen = params.get('mot');
  const [preview, setPreview] = useState<string | null>(null);

  const patch = useCallback(
    (changes: Record<string, string | null>) => {
      const copy = new URLSearchParams(params);
      for (const [name, value] of Object.entries(changes)) {
        if (value) copy.set(name, value);
        else copy.delete(name);
      }
      setParams(copy, { replace: true, preventScrollReset: true });
    },
    [params, setParams],
  );

  const rows = useMemo(() => {
    const words = normalize(query).split(' ').filter(Boolean);
    return ROWS.filter(
      (row) =>
        (statuts.size === 0 || statuts.has(row.entry.status)) &&
        (!theme || row.entry.theme === theme) &&
        words.every((word) => row.haystack.includes(word)),
    );
  }, [query, theme, statuts]);

  const letters = useMemo(() => {
    const first = new Map<string, LexiconEntry>();
    for (const row of rows) if (!first.has(row.letter)) first.set(row.letter, row.entry);
    return [...first.entries()];
  }, [rows]);

  const byId = useMemo(() => new Map(lexicon.map((entry) => [entry.id, entry])), []);
  const shown = byId.get(preview ?? '') ?? byId.get(chosen ?? '') ?? byId.get(DEFAULT_WORD) ?? lexicon[0];

  const choose = (entry: LexiconEntry) => {
    patch({ mot: !desktop && chosen === entry.id ? null : entry.id });
  };

  const clearAll = () => patch({ q: null, theme: null, statut: null });

  const entete = (
    <div className={styles.entete}>
      <Titre k="page.bati.title.lexicon" />
      <p className={styles.chapeau}>{t('v2.lexicon.lead', { n: lexicon.length })}</p>
    </div>
  );

  const temps =
    desktop && shown ? (
      <div className={commun.colonne} aria-live="polite">
        {/* Une étiquette au-dessus du bloc serait un « eyebrow » (DESIGN §0) : elle n'est dite qu'au lecteur d'écran. */}
        <p className="sr-only">{t('v2.lexicon.specimen')}</p>
        <Specimen entry={shown} taille="grand" id={specimenId} />
      </div>
    ) : null;

  const recit = (
    <div className={styles.recit}>
      <div className={styles.outils}>
        <div className={styles.champs}>
          <label className={styles.champ}>
            <span className={styles.champNom}>{t('page.bati.filter.text')}</span>
            <input
              type="search"
              className={styles.saisie}
              value={query}
              placeholder={t('v2.lexicon.placeholder')}
              onChange={(event: ChangeEvent<HTMLInputElement>) => patch({ q: event.target.value || null })}
              autoComplete="off"
              spellCheck={false}
            />
          </label>
          <label className={styles.champ}>
            <span className={styles.champNom}>{t('page.lexicon.filter.theme')}</span>
            <select className={styles.choix} value={theme} onChange={(event) => patch({ theme: event.target.value || null })}>
              <option value="">{t('v2.lexicon.theme.all')}</option>
              {THEMES.map((value) => (
                <option key={value} value={value}>
                  {t(`v2.lexicon.theme.${value}`)}
                </option>
              ))}
            </select>
          </label>
        </div>
        <Filtres
          param="statut"
          label={t('page.lexicon.filter.status')}
          options={STATUSES.map((status) => ({ value: status, label: t(`page.savoirs.status.${status}`) }))}
          count={rows.length}
          total={lexicon.length}
        />
      </div>

      {letters.length > 1 ? (
        <nav className={styles.rail} aria-label={t('v2.lexicon.letters')}>
          <ul role="list">
            {letters.map(([letter, entry]) => (
              <li key={letter}>
                <a href={`#${rowId(entry)}`} className={styles.lettre}>
                  {letter}
                </a>
              </li>
            ))}
          </ul>
        </nav>
      ) : null}

      {rows.length === 0 ? (
        <Vide
          action={
            <button type="button" className={commun.lienTexte} onClick={clearAll}>
              {t('page.bati.filter.clear')}
            </button>
          }
        >
          {t('page.lexicon.empty.title')} {t('page.lexicon.empty.body')}
        </Vide>
      ) : (
        <table className={styles.table} onPointerLeave={() => setPreview(null)}>
          <caption className="sr-only">{t('v2.lexicon.caption', { n: rows.length })}</caption>
          <thead>
            <tr>
              <th scope="col">{t('page.lexicon.col.form')}</th>
              <th scope="col">{t('page.lexicon.col.meaning')}</th>
              <th scope="col">{t('page.savoirs.status.label')}</th>
              <th scope="col">{t('page.lexicon.col.theme')}</th>
            </tr>
          </thead>
          <tbody>
            {rows.map(({ entry, letter }, index) => {
              const open = chosen === entry.id;
              const newLetter = index === 0 || rows[index - 1]?.letter !== letter;
              return (
                <Fragment key={entry.id}>
                  <tr
                    id={rowId(entry)}
                    className={styles.rangee}
                    data-choisi={open || (desktop && shown?.id === entry.id) ? '' : undefined}
                    data-initiale={newLetter ? letter : undefined}
                  >
                    <th scope="row" className={styles.forme}>
                      {newLetter ? (
                        <span className={styles.initiale} aria-hidden="true">
                          {letter}
                        </span>
                      ) : null}
                      <button
                        type="button"
                        className={styles.mot}
                        lang={VALYRIAN_TAG}
                        aria-pressed={desktop ? open : undefined}
                        aria-expanded={desktop ? undefined : open}
                        aria-controls={desktop ? specimenId : undefined}
                        onClick={() => choose(entry)}
                        onPointerEnter={(event) => (event.pointerType === 'mouse' ? setPreview(entry.id) : undefined)}
                        onFocus={() => (desktop ? setPreview(entry.id) : undefined)}
                        onBlur={() => setPreview(null)}
                      >
                        {entry.hv}
                      </button>
                    </th>
                    <td className={styles.sens}>
                      <span className={styles.traduction}>{tx({ fr: entry.fr, en: entry.en })}</span>
                      {entry.grammar ? <span className={styles.nature}>{typo(entry.grammar)}</span> : null}
                    </td>
                    <td className={styles.statut}>
                      <Statut status={entry.status} compact />
                    </td>
                    <td className={styles.theme}>{t(`v2.lexicon.theme.${entry.theme}`)}</td>
                  </tr>
                  {!desktop && open ? (
                    <tr className={styles.deplie}>
                      <td colSpan={4}>
                        <Specimen entry={entry} taille="deplie" />
                      </td>
                    </tr>
                  ) : null}
                </Fragment>
              );
            })}
          </tbody>
        </table>
      )}
    </div>
  );

  return (
    <Page partition="parti" className={styles.page}>
      <Parti entete={entete} recit={recit} temps={temps} />
    </Page>
  );
}
