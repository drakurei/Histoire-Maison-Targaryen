import { Fragment, useId, useMemo, useState } from 'react';
import type { ChangeEvent, ReactNode } from 'react';

import { lexicon } from '@/core/content/language';
import type { HvStatus, LexiconEntry } from '@/core/content/types';
import { useLang, useT, useTx, useTxTypo, VALYRIAN_TAG } from '@/core/i18n';
import { normalize } from '@/core/search';
import { col } from '@/versions/v1-codex/components/grid';
import { Rubric } from '@/versions/v1-codex/components/Rubric';
import { LexiconTally } from '@/versions/v1-codex/pages/language/LexiconTally';
import { STATUS_ORDER } from '@/versions/v1-codex/pages/language/lexiconTools';
import { StatusGlyph, StatusMark } from '@/versions/v1-codex/pages/language/StatusMark';
import { Specimen } from '@/versions/v2/pages/savoirs/Specimen';

import { Colonne } from '../components/common/Colonne';
import { Parti3 } from '../components/common/Parti3';
import { DESKTOP, useMedia } from '../components/common/useMedia';
import { useVue } from '../components/common/useVue';
import { Vue } from '../components/common/Vue';
import commun from './savoirs/commun.module.css';
import styles from './savoirs/Lexique.module.css';
import { Compte, Refs3, useAdresse } from './savoirs/pieces';

/** Le mot montré quand le lecteur n'en a choisi aucun : « dragon ». */
const DEFAULT_WORD = 'label.dragon';

interface Row {
  entry: LexiconEntry;
  letter: string;
  haystack: string;
}

/** Tri, initiale et recherche sur la forme sans macrons (« Āegon » range sous A). */
const ROWS: readonly Row[] = lexicon
  .map((entry) => {
    const key = normalize(entry.hv);
    return { entry, key, letter: (key.match(/[a-z]/)?.[0] ?? '#').toUpperCase(), haystack: normalize(`${entry.hv} ${entry.fr} ${entry.en}`) };
  })
  .sort((a, b) => a.key.localeCompare(b.key, 'en'));

const THEMES: readonly string[] = [...new Set(lexicon.map((entry) => entry.theme))];
const BY_STATUS: readonly LexiconEntry[] = [...lexicon].sort((a, b) => STATUS_ORDER.indexOf(a.status) - STATUS_ORDER.indexOf(b.status));
const BY_ID: ReadonlyMap<string, LexiconEntry> = new Map(lexicon.map((entry) => [entry.id, entry]));

function rowId(entry: LexiconEntry): string {
  return `mot-${entry.id}`;
}

/**
 * Le lexique `/langue/lexique` (v3-spec §6.14 ; parti, fasce éteinte). Sur le folio, le titre
 * au même corps que les autres registres, une phrase, puis la table dès le premier écran :
 * forme, sens et nature, marque de statut, thème ; recherche sans macrons, thème, statut,
 * lettres. Dans la colonne du champ, le spécimen du mot survolé ou choisi, et le lexique
 * entier en marques. Au téléphone, toucher un mot déplie sa notice sous la rangée. L'état
 * vit dans l'adresse (`q`, `theme`, `statut`, `mot`), sans entrée d'historique.
 */
export default function LexiconPage() {
  const t = useT();
  const tx = useTx();
  const typo = useTxTypo();
  const desktop = useMedia(DESKTOP);
  const specimenId = useId();
  const [params, patch] = useAdresse();
  const query = params.get('q') ?? '';
  const theme = params.get('theme') ?? '';
  const statuts = useMemo(() => new Set((params.get('statut') ?? '').split(',').filter(Boolean)), [params]);
  const chosen = params.get('mot');
  const [preview, setPreview] = useState<string | null>(null);
  useVue({ etat: 'eteinte' });

  const rows = useMemo(() => {
    const words = normalize(query).split(' ').filter(Boolean);
    return ROWS.filter(
      (row) =>
        (statuts.size === 0 || statuts.has(row.entry.status)) &&
        (!theme || row.entry.theme === theme) &&
        words.every((word) => row.haystack.includes(word)),
    );
  }, [query, theme, statuts]);
  const shownIds = useMemo(() => new Set(rows.map((row) => row.entry.id)), [rows]);
  const letters = useMemo(() => {
    const first = new Map<string, LexiconEntry>();
    for (const row of rows) if (!first.has(row.letter)) first.set(row.letter, row.entry);
    return [...first.entries()];
  }, [rows]);
  const counts = useMemo(() => {
    const map = new Map<HvStatus, number>();
    for (const entry of lexicon) map.set(entry.status, (map.get(entry.status) ?? 0) + 1);
    return map;
  }, []);

  const shown = BY_ID.get(preview ?? '') ?? BY_ID.get(chosen ?? '') ?? BY_ID.get(DEFAULT_WORD) ?? lexicon[0];

  const toggleStatut = (status: HvStatus) => {
    const next = new Set(statuts);
    if (next.has(status)) next.delete(status);
    else next.add(status);
    patch({ statut: [...next].join(',') || null });
  };
  const clearAll = () => patch({ q: null, theme: null, statut: null });

  const titreId = 'v3-lexique-titre';
  const tete = (
    <header className={`${commun.tete} ${col.recit}`}>
      <Rubric as="h1" id={titreId} k="page.bati.title.lexicon" />
      <p className={`${commun.chapeau} ${styles.chapeau}`}>{t('v2.lexicon.lead', { n: lexicon.length })}</p>
    </header>
  );

  const folio = (
    <div className={`${styles.salle} ${col.pleine}`}>
      <div className={styles.outils}>
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
        <Filtres ouvert={desktop} label={t('page.bati.filter.label')} actifs={(theme ? 1 : 0) + statuts.size}>
          <label className={styles.champ}>
            <span className={styles.champNom}>{t('page.lexicon.filter.theme')}</span>
            <select className={styles.saisie} value={theme} onChange={(event) => patch({ theme: event.target.value || null })}>
              <option value="">{t('v2.lexicon.theme.all')}</option>
              {THEMES.map((value) => (
                <option key={value} value={value}>
                  {t(`v2.lexicon.theme.${value}`)}
                </option>
              ))}
            </select>
          </label>
          <div className={styles.statuts} role="group" aria-labelledby="v3-lexique-statut">
            <span id="v3-lexique-statut" className={styles.champNom}>
              {t('page.lexicon.filter.status')}
            </span>
            <div className={styles.statutsListe}>
              {STATUS_ORDER.filter((status) => counts.has(status)).map((status) => (
                <button key={status} type="button" className={styles.statut} aria-pressed={statuts.has(status)} onClick={() => toggleStatut(status)}>
                  <StatusMark status={status} />
                </button>
              ))}
            </div>
          </div>
        </Filtres>
        <div className={styles.compte}>
          <Compte n={rows.length} total={lexicon.length} />
          {rows.length < lexicon.length ? (
            <button type="button" className={commun.lienTexte} onClick={clearAll}>
              {t('page.bati.filter.clear')}
            </button>
          ) : null}
        </div>
      </div>

      {letters.length > 1 ? (
        <nav className={styles.rail} aria-label={t('v2.lexicon.letters')}>
          <ul role="list">
            {letters.map(([letter, entry]) => (
              <li key={letter}>
                <a href={`#${rowId(entry)}`}>{letter}</a>
              </li>
            ))}
          </ul>
        </nav>
      ) : null}

      {rows.length === 0 ? (
        <div className={styles.vide}>
          <p className={commun.texte}>
            {t('page.lexicon.empty.title')} {t('page.lexicon.empty.body')}
          </p>
          <button type="button" className={commun.bouton} onClick={clearAll}>
            {t('page.bati.filter.clear')}
          </button>
        </div>
      ) : (
        <table className={styles.table} onPointerLeave={() => setPreview(null)}>
          <caption className="sr-only">{t('v2.lexicon.caption', { n: rows.length })}</caption>
          <thead>
            <tr>
              <th scope="col">{t('page.lexicon.col.form')}</th>
              <th scope="col">{t('page.lexicon.col.meaning')}</th>
              <th scope="col">{t('page.savoirs.status.label')}</th>
              <th scope="col" className={styles.colTheme}>
                {t('page.lexicon.col.theme')}
              </th>
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
                    data-lettre={newLetter ? '' : undefined}
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
                        aria-controls={desktop ? specimenId : `${rowId(entry)}-notice`}
                        onClick={() => patch({ mot: !desktop && open ? null : entry.id })}
                        onPointerEnter={(event) => (event.pointerType === 'mouse' ? setPreview(entry.id) : undefined)}
                        onFocus={() => (desktop ? setPreview(entry.id) : undefined)}
                        onBlur={() => setPreview(null)}
                      >
                        {entry.hv}
                      </button>
                    </th>
                    <td className={styles.sens}>
                      <span>{tx({ fr: entry.fr, en: entry.en })}</span>
                      {entry.grammar ? <span className={styles.nature}>{typo(entry.grammar)}</span> : null}
                    </td>
                    <td className={styles.marque}>
                      <StatusMark status={entry.status} compact />
                    </td>
                    <td className={styles.theme}>{t(`v2.lexicon.theme.${entry.theme}`)}</td>
                  </tr>
                  {!desktop && open ? (
                    <tr className={styles.deplie}>
                      <td colSpan={4} id={`${rowId(entry)}-notice`}>
                        <Notice entry={entry} />
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

  const colonne = desktop ? (
    <Colonne
      label={t('v3.savoirs.lexique.colonne')}
      figure={
        <div className={commun.colonne}>
          <div aria-live="polite" className={commun.cibles}>
            {/* « Spécimen » au-dessus du bloc serait une étiquette de décor (DESIGN §0) : il n'est dit qu'au lecteur d'écran. */}
            <p className="sr-only">{t('v2.lexicon.specimen')}</p>
            {shown ? <Specimen entry={shown} taille="grand" id={specimenId} /> : null}
          </div>
          <figure className={styles.decompte}>
            <LexiconTally entries={BY_STATUS} shown={shownIds} />
            <figcaption className={commun.legende}>
              {t('v3.savoirs.lexique.compte', { n: lexicon.length })}
              <span className={styles.decompteListe}>
                {STATUS_ORDER.filter((status) => counts.has(status)).map((status) => (
                  <span key={status}>
                    <StatusGlyph status={status} size="0.9rem" />
                    {t('v3.savoirs.lexique.statut', { label: t(`page.savoirs.status.${status}`), n: counts.get(status) ?? 0 })}
                  </span>
                ))}
              </span>
            </figcaption>
          </figure>
        </div>
      }
    />
  ) : null;

  return (
    <Vue partition="parti">
      <Parti3 labelledBy={titreId} tete={tete} folio={folio} colonne={colonne} />
    </Vue>
  );
}

/** Thème et statut : en rangée sur ordinateur, repliés sous « Filtrer » au téléphone. */
function Filtres({ ouvert, label, actifs, children }: { ouvert: boolean; label: string; actifs: number; children: ReactNode }) {
  if (ouvert) return <div className={styles.filtres}>{children}</div>;
  return (
    <details className={styles.filtres} open={actifs > 0 || undefined}>
      <summary className={styles.resume}>
        {label}
        {actifs > 0 ? <span className={styles.actifs}>{actifs}</span> : null}
      </summary>
      <div className={styles.filtresCorps}>{children}</div>
    </details>
  );
}

/** La notice d'un mot, dépliée sous sa rangée au téléphone : sur le vélin, à l'encre. */
function Notice({ entry }: { entry: LexiconEntry }) {
  const t = useT();
  const typo = useTxTypo();
  const { reading } = useLang();
  const noteLang = reading === 'en' && entry.notes.en === entry.notes.fr ? 'fr' : reading;
  return (
    <div className={styles.notice}>
      <p className={styles.noticeForme} lang={VALYRIAN_TAG}>
        {entry.hv}
      </p>
      {entry.grammar ? (
        <p className={styles.noticeLigne}>
          <span className={styles.noticeTerme}>{t('page.lexicon.entry.grammar')}</span> {typo(entry.grammar)}
        </p>
      ) : null}
      <p className={styles.noticeLigne} lang={noteLang}>
        <span className={styles.noticeTerme}>{t('page.lexicon.entry.note')}</span> {typo(entry.notes)}
      </p>
      {entry.verified ? null : <p className={styles.noticeAverti}>{t('page.lexicon.entry.unverified')}</p>}
      <Refs3 refs={entry.refs} />
    </div>
  );
}
