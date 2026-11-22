import { useCallback, useMemo, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';

import { getPlace } from '@/core/content/places';
import { getEvent, getPeriod } from '@/core/content/timeline';
import type { War } from '@/core/content/types';
import { getWar } from '@/core/content/wars';
import { formatSpan, formatYear, useLang, useT, useTitle, useTx, yearParts } from '@/core/i18n';
import { prefersReducedMotion } from '@/core/motion/reducedMotion';
import type { MapFrame } from '@/shared/map';
import { col } from '@/versions/v1-codex/components/grid';
import { Prose } from '@/versions/v1-codex/components/Prose';
import { ReliabilityMark } from '@/versions/v1-codex/components/ReliabilityMark';
import { Rubric } from '@/versions/v1-codex/components/Rubric';
import { SourceList } from '@/versions/v1-codex/components/SourceList';
import { Carte } from '@/versions/v2/components/Carte';
import { battleMarks } from '@/versions/v2/pages/registres/appearances';
import { boundsOf, presence } from '@/versions/v2/state/scene';
import { YEAR_PARAM, useYear } from '@/versions/v2/state/year';

import { Colonne } from '../components/common/Colonne';
import { Feuillet } from '../components/common/Feuillet';
import { Nom } from '../components/common/Nom';
import { Parti3 } from '../components/common/Parti3';
import { DESKTOP, useMedia } from '../components/common/useMedia';
import { useVue } from '../components/common/useVue';
import { Vue } from '../components/common/Vue';
import NotFoundPage from './NotFoundPage';
import { Bataille } from './registres/Bataille';
import { MarqueCamp } from './registres/MarqueCamp';
import { Rejouer } from './registres/Rejouer';
import styles from './WarPage.module.css';

/** Largeur du cadre de la carte autour d'une bataille, en unités de la carte. */
const BATTLE_FRAME = 260;

/**
 * Guerre `/guerres/:warId` (v3-spec §6.11, parti). Le folio : le titre rubriqué, les années
 * et la fiabilité, le récit en chapeau, les camps face à face, les causes, les batailles dans
 * l'ordre (numéro rubriqué en colonne suspendue, ancre `#<battleId>`), ce qui en reste, les
 * événements liés, les sources en marge. La colonne : la carte où chaque bataille située
 * porte son numéro, « bataille précédente » et « suivante » dessous (la carte se recadre, le
 * folio va à la bataille, l'année se règle, l'ancre suit), l'année de la bataille courante en
 * grand nombre au pied de la carte, le profil de la guerre soudé à la fasce.
 */
export default function WarPage() {
  const { warId = '' } = useParams();
  const war = getWar(warId);
  if (!war) return <NotFoundPage />;
  return <Guerre key={war.id} war={war} />;
}

function Guerre({ war }: { war: War }) {
  const t = useT();
  const tx = useTx();
  const title = useTitle();
  const { reading } = useLang();
  const year = useYear();
  const location = useLocation();
  const navigate = useNavigate();
  const desktop = useMedia(DESKTOP);
  useVue({ span: [war.from, war.to] });

  const fromHash = war.battles.findIndex((battle) => `#${battle.id}` === decodeURIComponent(location.hash));
  const [current, setCurrent] = useState<number | null>(fromHash >= 0 ? fromHash : null);
  const [frame, setFrame] = useState<MapFrame | undefined>(() => {
    const battle = fromHash >= 0 ? war.battles[fromHash] : undefined;
    const place = battle?.placeId ? getPlace(battle.placeId) : undefined;
    return place ? { center: place.coord, width: BATTLE_FRAME } : undefined;
  });
  const [kept, setKept] = useState(false);

  const marks = useMemo(() => battleMarks(war), [war]);
  const placeIds = useMemo(() => [...marks.keys()], [marks]);
  const hasDragons = useMemo(
    () => presence.years.some((entry) => entry.year >= war.from && entry.year <= war.to && (entry.attested.length > 0 || entry.doubtful.length > 0)),
    [war],
  );

  const step = useCallback(
    (index: number) => {
      const battle = war.battles[index];
      if (!battle) return;
      setCurrent(index);
      const place = battle.placeId ? getPlace(battle.placeId) : undefined;
      if (place) {
        setFrame({ center: place.coord, width: BATTLE_FRAME });
        setKept(false);
      } else setKept(true);
      const params = new URLSearchParams(location.search);
      if (battle.year !== null) params.set(YEAR_PARAM, String(battle.year));
      const search = params.toString();
      navigate({ pathname: location.pathname, search: search ? `?${search}` : '', hash: `#${battle.id}` }, { replace: true, state: location.state });
      window.requestAnimationFrame(() => {
        document.getElementById(battle.id)?.scrollIntoView({ behavior: prefersReducedMotion() ? 'auto' : 'smooth', block: 'start' });
      });
    },
    [war, location.search, location.pathname, location.state, navigate],
  );

  const total = war.battles.length;
  const battle = current !== null ? war.battles[current] : undefined;
  const selectedId = battle?.placeId && getPlace(battle.placeId) ? battle.placeId : null;
  const events = war.eventIds.flatMap((id) => {
    const event = getEvent(id);
    return event ? [event] : [];
  });
  const shownYear = battle?.year ?? (year !== null && year >= war.from && year <= war.to ? year : war.from);
  const parts = yearParts(shownYear, reading);
  const name = title(war.title);
  const titreId = `guerre-${war.id}`;
  const [first, second, ...others] = war.belligerents;
  // Le profil de la guerre dans sa période : sang pendant la guerre, cramoisi avant et après.
  const period = getPeriod(war.periodId);
  const cadre = period ? boundsOf(period) : ([war.from, war.to] as const);
  const profil = { from: Math.min(cadre[0], war.from), to: Math.max(cadre[1], war.to), span: [war.from, war.to] as const };

  const tete = (
    <header className={`${col.recit} ${styles.tete}`}>
      <Rubric as="h1" id={titreId} text={war.title} />
      <p className={styles.faits}>
        <span className={styles.annees}>{formatSpan(war.from, war.to, reading)}</span>
        <ReliabilityMark level={war.reliability} />
      </p>
    </header>
  );

  const carte =
    placeIds.length > 0 ? (
      <Carte
        title={t('page.war.map.title', { name: name.gloss ?? name.primary })}
        placeIds={placeIds}
        marks={marks}
        selectedId={selectedId}
        frame={frame}
      />
    ) : null;

  const rejouer = total > 0 ? <Rejouer war={war} current={current} kept={kept} onStep={step} /> : null;

  const folio = (
    <>
      <div className={`${col.recit} ${styles.chapeau}`}>
        <Prose text={war.summary} variant="chapeau" />
      </div>
      <section className={`${col.pleine} ${styles.section}`} aria-labelledby={`${titreId}-camps`}>
        <Rubric as="h2" id={`${titreId}-camps`} k="page.war.camps.heading" />
        <div className={styles.face}>
          {[first, second].map((side, index) =>
            side ? (
              <div key={side.id} className={styles.camp} data-cote={index === 0 ? 'gauche' : 'droite'}>
                <h3 className={styles.campNom}>
                  <MarqueCamp tone={side.tone} />
                  <span>{tx(side.name)}</span>
                </h3>
                {side.leaders.length > 0 ? (
                  <p className={styles.chefs}>
                    <span className={styles.etiquette}>{t('v2.war.leaders')}</span>{' '}
                    {side.leaders.map((leader, i) => (
                      <span key={leader.id ?? tx(leader.name)}>
                        {i > 0 ? ', ' : null}
                        {leader.id ? <Nom kind="person" id={leader.id} name={leader.name} /> : tx(leader.name)}
                      </span>
                    ))}
                  </p>
                ) : null}
              </div>
            ) : null,
          )}
          {first && second ? (
            <p className={styles.contre} aria-hidden="true">
              {t('v3.registres.guerre.face')}
            </p>
          ) : null}
        </div>
        {others.length > 0 ? (
          <ul className={styles.autres} role="list">
            {others.map((side) => (
              <li key={side.id}>
                <MarqueCamp tone={side.tone} /> {tx(side.name)}
              </li>
            ))}
          </ul>
        ) : null}
      </section>

      <section className={`${col.rangee} ${styles.section}`} aria-labelledby={`${titreId}-causes`}>
        <div className={col.recit}>
          <Rubric as="h2" id={`${titreId}-causes`} k="page.war.causes.heading" />
          <Prose text={war.causes} lettrine />
        </div>
        <aside className={`${col.marge} ${styles.marge}`} aria-label={t('label.sources')}>
          <p className={styles.margeTitre}>{t('label.sources')}</p>
          <SourceList sources={war.sources} />
        </aside>
      </section>

      <section className={`${col.pleine} ${styles.section}`} aria-labelledby={`${titreId}-batailles`}>
        <Rubric as="h2" id={`${titreId}-batailles`} k="page.war.battles.heading" />
        {total === 0 ? (
          <p className={styles.phrase}>{t('v2.war.no_battles')}</p>
        ) : (
          <ol className={styles.batailles} role="list">
            {war.battles.map((item, index) => (
              <Bataille key={item.id} war={war} battle={item} index={index} current={index === current} onStep={desktop ? undefined : step} />
            ))}
          </ol>
        )}
      </section>

      <section className={`${col.recit} ${styles.section}`} aria-labelledby={`${titreId}-suite`}>
        <Rubric as="h2" id={`${titreId}-suite`} k="page.war.consequences.heading" />
        <Prose text={war.consequences} />
      </section>

      {events.length > 0 ? (
        <section className={`${col.recit} ${styles.section}`} aria-labelledby={`${titreId}-evenements`}>
          <Rubric as="h2" id={`${titreId}-evenements`} size="sous">
            {t('v2.war.events')}
          </Rubric>
          <ul className={styles.evenements} role="list">
            {events.map((event) => (
              <li key={event.id}>
                <span className={styles.an}>{formatYear(event.year, reading)}</span>
                <Nom kind="event" id={event.id} name={event.title} />
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </>
  );

  if (desktop) {
    return (
      <Vue partition="parti">
        <Parti3
          labelledBy={titreId}
          tete={tete}
          folio={folio}
          colonne={
            <Colonne
              label={t('v3.registres.guerre.colonne')}
              figure={carte ?? <span />}
              nombre={parts ? { value: parts.value, era: parts.era } : null}
              pied={rejouer}
              profil={hasDragons ? profil : null}
              profilPart={0.28}
            />
          }
        />
      </Vue>
    );
  }

  // Téléphone (§6.11) : la carte en tête (40 svh, numéros), puis le folio ; précédente et suivante au pied de chaque bataille.
  return (
    <Vue partition="parti">
      <article className={styles.tel} aria-labelledby={titreId}>
        <Feuillet as="div">{tete}</Feuillet>
        {carte ? (
          <div className={styles.carteTel} role="group" aria-label={t('v3.registres.guerre.colonne')}>
            {carte}
          </div>
        ) : null}
        <Feuillet as="div">{folio}</Feuillet>
      </article>
    </Vue>
  );
}
