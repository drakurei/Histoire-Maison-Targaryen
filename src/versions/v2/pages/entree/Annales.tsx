import { useCallback, useEffect, useMemo, useRef } from 'react';
import type { ChangeEvent, ReactNode } from 'react';
import { useSearchParams } from 'react-router-dom';

import { getReliabilityLevel } from '@/core/content/sources';
import type { EntityRef, HistoricalEvent, Reliability } from '@/core/content/types';
import { formatYear, useLang, useT, useTx, useTxTypo, yearParts } from '@/core/i18n';
import { prefersReducedMotion } from '@/core/motion/reducedMotion';
import { eventFacets, eventsByYear, filterEvents } from '@/core/timeline';
import type { EventFilter } from '@/core/timeline';

import { Fiabilite } from '../../components/Fiabilite';
import { Filtres, useFiltre } from '../../components/Filtres';
import type { FiltreOption } from '../../components/Filtres';
import { Lien } from '../../components/Lien';
import { NomEntite } from '../../components/NomEntite';
import { Vide } from '../../components/Vide';
import type { EntityKind } from '../../state/useVoir';
import { useSetYear, useUrlYear } from '../../state/year';

import styles from './Annales.module.css';

const FILTER_PARAM = 'filtre';
const TEXT_PARAM = 'texte';
const RELIABILITIES: readonly Reliability[] = ['etabli', 'recit-unique', 'contradictoire', 'legende', 'adaptation'];
/** Ligne de lecture : 40 % de la hauteur de la fenêtre (spec §5.5). */
const READING_LINE = 0.4;
/** Combien de dragons proposer en filtre : les plus cités. */
const DRAGON_OPTIONS = 8;

function isReliability(value: string): value is Reliability {
  return (RELIABILITIES as readonly string[]).includes(value);
}

interface EntitesProps {
  label: string;
  kind: EntityKind;
  refs: readonly EntityRef[];
}

/** Une rangée d'entités citées : les noms des registres ouvrent leur cartel, les autres sont écrits. */
function Entites({ label, kind, refs }: EntitesProps) {
  const tx = useTx();
  if (refs.length === 0) return null;
  return (
    <div className={styles.entites}>
      <dt className={styles.entitesLabel}>{label}</dt>
      <dd className={styles.entitesListe}>
        {refs.map((ref, index) => (
          <span key={`${ref.id ?? tx(ref.name)}-${index}`} className={styles.entite}>
            {ref.id ? <NomEntite kind={kind} id={ref.id} name={ref.name} /> : <span>{tx(ref.name)}</span>}
          </span>
        ))}
      </dd>
    </div>
  );
}

interface EvenementProps {
  event: HistoricalEvent;
}

function Evenement({ event }: EvenementProps) {
  const t = useT();
  const tx = useTxTypo();
  return (
    <article className={styles.evenement} aria-labelledby={`ev-${event.id}`}>
      <h3 id={`ev-${event.id}`} className={styles.titre}>
        <Lien to={`/chroniques/${event.periodId}/${event.id}`} year={event.year ?? 'keep'}>
          {tx(event.title)}
        </Lien>
      </h3>
      <p className={styles.meta}>
        <Fiabilite level={event.reliability} />
        {event.continuity === 'adaptation' ? <span className={styles.adaptation}>{t('label.continuity.show')}</span> : null}
        {event.dateCertainty === 'approximative' && event.year !== null ? (
          <span>{t('page.event.date.approximative')}</span>
        ) : null}
      </p>
      <p className={styles.resume}>{tx(event.summary)}</p>
      {tx(event.consequence) ? (
        <p className={styles.consequence}>
          <span className={styles.consequenceLabel}>{t('page.period.consequence')}</span> {tx(event.consequence)}
        </p>
      ) : null}
      <dl className={styles.liste}>
        <Entites label={t('page.event.people')} kind="person" refs={event.people} />
        <Entites label={t('page.event.dragons')} kind="dragon" refs={event.dragons} />
        <Entites label={t('page.event.places')} kind="place" refs={event.places} />
      </dl>
    </article>
  );
}

interface AnnalesProps {
  events: readonly HistoricalEvent[];
  /** Ce qui précède les annales sur téléphone : la carte qui suit l'année. */
  carte?: ReactNode;
}

/**
 * Les annales d'une période (spec §5.5) : filtres, puis les événements groupés par année,
 * l'année dans une colonne suspendue, un fil de sang qui porte une entaille par année.
 * Les annales règlent l'année : quand un groupe franchit la ligne de lecture, l'année est
 * réglée (sans entrée d'historique) ; régler l'année ailleurs pendant qu'elles sont à
 * l'écran les fait défiler jusqu'à son groupe. Le défilement programmé n'est pas relu.
 */
export function Annales({ events, carte }: AnnalesProps) {
  const t = useT();
  const tx = useTx();
  const { reading } = useLang();
  const [params, setParams] = useSearchParams();
  const active = useFiltre(FILTER_PARAM);
  const text = params.get(TEXT_PARAM) ?? '';
  const urlYear = useUrlYear();
  const setYear = useSetYear();

  const facets = useMemo(() => eventFacets(events), [events]);
  const options = useMemo<FiltreOption[]>(() => {
    const levels = RELIABILITIES.filter((level) => facets.reliability.some((facet) => facet.value === level)).map((level) => ({
      value: level,
      label: tx(getReliabilityLevel(level)?.label),
    }));
    const dragons = facets.dragons
      .filter((facet) => facet.id)
      .slice(0, DRAGON_OPTIONS)
      .map((facet) => ({ value: facet.key, label: tx(facet.name) }));
    return [...levels, ...dragons];
  }, [facets, tx]);

  const filtered = useMemo(() => {
    const values = [...active];
    const filter: EventFilter = {
      reliability: values.filter(isReliability),
      dragons: values.filter((value) => !isReliability(value)),
      text,
    };
    return filterEvents(events, filter, reading);
  }, [events, active, text, reading]);
  const groups = useMemo(() => eventsByYear(filtered), [filtered]);

  const onText = (event: ChangeEvent<HTMLInputElement>) => {
    const copy = new URLSearchParams(params);
    if (event.target.value) copy.set(TEXT_PARAM, event.target.value);
    else copy.delete(TEXT_PARAM);
    setParams(copy, { replace: true, preventScrollReset: true });
  };

  const clearAll = () => {
    const copy = new URLSearchParams(params);
    copy.delete(TEXT_PARAM);
    copy.delete(FILTER_PARAM);
    setParams(copy, { replace: true, preventScrollReset: true });
  };

  /* ---------------------------------------------------------------- l'année suit la lecture */
  const root = useRef<HTMLDivElement>(null);
  const nodes = useRef(new Map<number, HTMLElement>());
  const visible = useRef(false);
  const quietUntil = useRef(0);
  const fromReading = useRef<number | null>(null);
  const setYearRef = useRef(setYear);
  setYearRef.current = setYear;
  const yearRef = useRef(urlYear);
  yearRef.current = urlYear;

  const register = useCallback((year: number, node: HTMLElement | null) => {
    if (node) nodes.current.set(year, node);
    else nodes.current.delete(year);
  }, []);

  useEffect(() => {
    const container = root.current;
    if (!container) return;
    const presence = new IntersectionObserver((entries) => {
      for (const entry of entries) visible.current = entry.isIntersecting;
    });
    presence.observe(container);
    const line = new IntersectionObserver(
      (entries) => {
        if (performance.now() < quietUntil.current) return;
        const crossing = entries.filter((entry) => entry.isIntersecting);
        const last = crossing[crossing.length - 1];
        const year = last ? Number((last.target as HTMLElement).dataset.annee) : NaN;
        if (!Number.isFinite(year) || year === yearRef.current) return;
        fromReading.current = year;
        setYearRef.current(year);
      },
      { rootMargin: `-${READING_LINE * 100}% 0px -${(1 - READING_LINE) * 100 - 1}% 0px` },
    );
    for (const node of nodes.current.values()) line.observe(node);
    return () => {
      presence.disconnect();
      line.disconnect();
    };
  }, [groups]);

  // L'année réglée ailleurs (la fasce, l'état du royaume) : les annales vont à son groupe.
  const previous = useRef(urlYear);
  useEffect(() => {
    if (previous.current === urlYear) return;
    previous.current = urlYear;
    if (urlYear === null || urlYear === fromReading.current || !visible.current) return;
    let target: HTMLElement | null = null;
    let distance = Infinity;
    for (const [year, node] of nodes.current) {
      const gap = Math.abs(year - urlYear);
      if (gap < distance) {
        distance = gap;
        target = node;
      }
    }
    if (!target) return;
    quietUntil.current = performance.now() + 1200;
    const top = target.getBoundingClientRect().top + window.scrollY - window.innerHeight * READING_LINE + 2;
    window.scrollTo({ top, behavior: prefersReducedMotion() ? 'auto' : 'smooth' });
  }, [urlYear]);

  return (
    <div className={styles.annales} ref={root}>
      <div className={styles.outils}>
        <Filtres param={FILTER_PARAM} options={options} count={filtered.length} total={events.length} label={t('page.period.filter.label')} />
        <label className={styles.recherche}>
          <span className={styles.rechercheLabel}>{t('v2.period.text_filter')}</span>
          <input
            type="search"
            className={styles.champ}
            value={text}
            onChange={onText}
            placeholder={t('v2.period.text_placeholder')}
            autoComplete="off"
            spellCheck={false}
          />
        </label>
      </div>
      {carte}
      {groups.length === 0 ? (
        <Vide
          action={
            <button type="button" className={styles.effacer} onClick={clearAll}>
              {t('page.bati.filter.clear')}
            </button>
          }
        >
          {t('page.period.annals.empty')}. {t('page.period.annals.emptyBody')}
        </Vide>
      ) : (
        <ol role="list" className={styles.fil}>
          {groups.map((group) => {
            const label = group.year === null ? t('label.unknownDate') : formatYear(group.year, reading);
            const parts = group.year === null ? null : yearParts(group.year, reading);
            const current = group.year !== null && group.year === urlYear;
            return (
              <li
                key={`${group.year ?? 'x'}-${group.sortYear}`}
                ref={group.year === null ? undefined : (node) => register(group.year as number, node)}
                data-annee={group.year ?? undefined}
                data-courant={current ? '' : undefined}
                className={styles.groupe}
                aria-label={group.year === null ? t('v2.period.annals_undated') : t('v2.period.annals_year', { year: label })}
              >
                <p className={styles.annee} aria-hidden="true" data-inconnue={group.year === null ? '' : undefined}>
                  {parts ? (
                    <>
                      <span className={styles.valeur}>{parts.value}</span>
                      <span className={`${styles.ere} ere`}>{parts.era}</span>
                    </>
                  ) : (
                    label
                  )}
                </p>
                <div className={styles.evenements}>
                  {group.events.map((event) => (
                    <Evenement key={event.id} event={event} />
                  ))}
                </div>
              </li>
            );
          })}
        </ol>
      )}
    </div>
  );
}
