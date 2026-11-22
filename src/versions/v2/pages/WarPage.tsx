import { useCallback, useMemo, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';

import { getDragon } from '@/core/content/dragons';
import { getPlace } from '@/core/content/places';
import { getEvent } from '@/core/content/timeline';
import type { Battle, Belligerent, War } from '@/core/content/types';
import { getWar } from '@/core/content/wars';
import { formatSpan, formatYear, Gloss, useLang, useT, useTx, useTxTypo, useUi } from '@/core/i18n';
import type { MapFrame } from '@/shared/map';

import { Carte } from '../components/Carte';
import { Fiabilite } from '../components/Fiabilite';
import { Introuvable } from '../components/Introuvable';
import { NomEntite } from '../components/NomEntite';
import { Page } from '../components/Page';
import { Parti } from '../components/Parti';
import { Prose } from '../components/Prose';
import { Sommaire } from '../components/Sommaire';
import { SourcesPied } from '../components/SourcesPied';
import { Titre } from '../components/Titre';
import { useFasce } from '../state/fasce';
import { YEAR_PARAM, useYear } from '../state/year';

import { battleMarks } from './registres/appearances';
import { CampMark } from './registres/CampMark';
import { Colonne } from './registres/Colonne';
import styles from './WarPage.module.css';

/** Largeur du cadre de la carte autour d'une bataille, en unités de la carte. */
const BATTLE_FRAME = 260;

function sideOf(war: War, id: string): Belligerent | undefined {
  return war.belligerents.find((side) => side.id === id);
}

function Camp({ side }: { side: Belligerent }) {
  const t = useT();
  const tx = useTx();
  return (
    <div className={styles.camp}>
      <h3 className={styles.campNom}>
        <CampMark tone={side.tone} />
        <span>{tx(side.name)}</span>
      </h3>
      {side.leaders.length > 0 ? (
        <p className={styles.chefs}>
          <span className={styles.etiquette}>{t('v2.war.leaders')}</span>{' '}
          {side.leaders.map((leader, index) => (
            <span key={`${leader.id ?? tx(leader.name)}`}>
              {index > 0 ? ', ' : null}
              {leader.id ? <NomEntite kind="person" id={leader.id} name={leader.name} /> : tx(leader.name)}
            </span>
          ))}
        </p>
      ) : null}
    </div>
  );
}

interface BatailleProps {
  war: War;
  battle: Battle;
  index: number;
  current: boolean;
  onStep: (index: number) => void;
}

function Bataille({ war, battle, index, current, onStep }: BatailleProps) {
  const t = useT();
  const tx = useTx();
  const typo = useTxTypo();
  const { reading } = useLang();
  const place = battle.placeId ? getPlace(battle.placeId) : undefined;
  const victor = battle.victor === 'indecis' ? undefined : sideOf(war, battle.victor);
  const total = war.battles.length;
  const date =
    battle.dateCertainty === 'exacte'
      ? formatYear(battle.year, reading)
      : `${formatYear(battle.year, reading)}, ${t(battle.dateCertainty === 'approximative' ? 'page.war.date.approximative' : 'page.war.date.inconnue')}`;

  return (
    <article id={battle.id} className={styles.bataille} data-courante={current ? '' : undefined} aria-labelledby={`${battle.id}-titre`}>
      <span className={styles.numero} aria-hidden="true">
        {index + 1}
      </span>
      <div className={styles.corps}>
        <p className={styles.date}>{date}</p>
        <h3 id={`${battle.id}-titre`} className={styles.batailleNom}>
          <span className={styles.cache}>{t('v2.war.number', { n: index + 1 })} : </span>
          {tx(battle.name)}
        </h3>
        <p className={styles.lieu}>
          {place ? <NomEntite kind="place" id={place.id} name={place.name} /> : <span className={styles.cendre}>{t('v2.war.place_unknown')}</span>}
          <span className={styles.precision}>{tx(battle.placeName)}</span>
        </p>
        <p className={styles.issue}>
          {victor ? (
            <>
              <CampMark tone={victor.tone} /> {t('page.war.victor', { side: tx(victor.name) })}
            </>
          ) : (
            t('page.war.undecided')
          )}
        </p>
        {battle.dragons.length > 0 ? (
          <div className={styles.dragons}>
            <p className={styles.etiquette}>{t('page.war.dragons')}</p>
            <ul className={styles.dragonsListe} role="list">
              {battle.dragons.map((engaged) => {
                const dragon = getDragon(engaged.dragonId);
                const side = sideOf(war, engaged.side);
                return (
                  <li key={engaged.dragonId} className={styles.dragon}>
                    <span className={styles.dragonNom}>
                      {side ? <CampMark tone={side.tone} /> : null}
                      {dragon ? <NomEntite kind="dragon" id={dragon.id} name={dragon.name} /> : engaged.dragonId}
                    </span>
                    <span className={styles.sort}>{typo(engaged.fate)}</span>
                  </li>
                );
              })}
            </ul>
          </div>
        ) : null}
        <Prose text={battle.summary} />
        <Prose text={battle.outcome} />
        {battle.losses ? (
          <p className={styles.pertes}>
            <span className={styles.etiquette}>{t('page.war.losses')}</span> {typo(battle.losses)}
          </p>
        ) : null}
        <p className={styles.fiabilite}>
          <Fiabilite level={battle.reliability} />
        </p>
        <nav className={styles.pasTel} aria-label={t('v2.war.replay_label')}>
          {index > 0 ? (
            <button type="button" className={styles.bouton} onClick={() => onStep(index - 1)}>
              {t('v2.war.replay_previous')}
            </button>
          ) : null}
          {index < total - 1 ? (
            <button type="button" className={styles.bouton} onClick={() => onStep(index + 1)}>
              {t('v2.war.replay_next')}
            </button>
          ) : null}
        </nav>
      </div>
    </article>
  );
}

/**
 * Conflit `/guerres/:warId` (parti, spec §5.11). À gauche : le titre, les années, le récit,
 * les camps face à face, les causes, puis les batailles dans l'ordre (numéro en colonne
 * suspendue, ancre `#<battleId>`), les conséquences, les événements liés, les sources. À
 * droite, collante : la carte où chaque bataille située porte son numéro, « rejouer »
 * (bataille précédente, suivante : la carte se recadre, l'année se règle, l'ancre suit),
 * le profil de la guerre soudé à la fasce et l'année en grand nombre.
 */
export default function WarPage() {
  const { warId = '' } = useParams();
  const war = getWar(warId);
  const t = useT();
  const ui = useUi();
  const tx = useTx();
  const { reading } = useLang();
  const year = useYear();
  const location = useLocation();
  const navigate = useNavigate();
  useFasce({ span: war ? [war.from, war.to] : null });

  const fromHash = war ? war.battles.findIndex((battle) => `#${battle.id}` === decodeURIComponent(location.hash)) : -1;
  const [current, setCurrent] = useState<number | null>(fromHash >= 0 ? fromHash : null);
  const [frame, setFrame] = useState<MapFrame | undefined>(() => {
    const battle = war && fromHash >= 0 ? war.battles[fromHash] : undefined;
    const place = battle?.placeId ? getPlace(battle.placeId) : undefined;
    return place ? { center: place.coord, width: BATTLE_FRAME } : undefined;
  });
  const [kept, setKept] = useState(false);

  const marks = useMemo(() => (war ? battleMarks(war) : new Map<string, string>()), [war]);
  const placeIds = useMemo(() => [...marks.keys()], [marks]);

  const step = useCallback(
    (index: number) => {
      if (!war) return;
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
    },
    [war, location.search, location.pathname, location.state, navigate],
  );

  if (!war) return <Introuvable />;

  const total = war.battles.length;
  const battle = current !== null ? war.battles[current] : undefined;
  const selectedId = battle?.placeId && getPlace(battle.placeId) ? battle.placeId : null;
  const events = war.eventIds.flatMap((id) => {
    const event = getEvent(id);
    return event ? [event] : [];
  });
  const shownYear = year !== null && year >= war.from && year <= war.to ? year : war.from;

  // Le sommaire se lit dans la langue du récit : la forme valyrienne reste aux titres, avec leur glose.
  const plain = (key: string) => ui(key).gloss ?? ui(key).primary;
  const entries = [
    { id: 'camps', label: plain('page.war.camps.heading') },
    { id: 'causes', label: plain('page.war.causes.heading') },
    { id: 'batailles', label: plain('page.war.battles.heading') },
    { id: 'consequences', label: plain('page.war.consequences.heading') },
    ...(events.length > 0 ? [{ id: 'evenements', label: t('v2.war.events') }] : []),
  ];

  const entete = (
    <div className={styles.entete}>
      <p className={styles.annees}>
        <span>{formatSpan(war.from, war.to, reading)}</span>
        <Fiabilite level={war.reliability} />
      </p>
      <Sommaire entries={entries} label={t('v2.war.contents')} className={styles.sommaire} />
    </div>
  );

  const recit = (
    <div className={styles.recit}>
      <Prose text={war.summary} />

      <section className={styles.section} aria-labelledby="camps">
        <h2 id="camps" className={styles.titre}>
          <Gloss k="page.war.camps.heading" />
        </h2>
        <div className={styles.camps}>
          {war.belligerents.map((side) => (
            <Camp key={side.id} side={side} />
          ))}
        </div>
      </section>

      <section className={styles.section} aria-labelledby="causes">
        <h2 id="causes" className={styles.titre}>
          <Gloss k="page.war.causes.heading" />
        </h2>
        <Prose text={war.causes} />
      </section>

      <section className={styles.section} aria-labelledby="batailles">
        <h2 id="batailles" className={styles.titre}>
          <Gloss k="page.war.battles.heading" />
        </h2>
        {total === 0 ? (
          <p className={styles.cendre}>{t('v2.war.no_battles')}</p>
        ) : (
          <div className={styles.batailles}>
            {war.battles.map((item, index) => (
              <Bataille key={item.id} war={war} battle={item} index={index} current={index === current} onStep={step} />
            ))}
          </div>
        )}
      </section>

      <section className={styles.section} aria-labelledby="consequences">
        <h2 id="consequences" className={styles.titre}>
          <Gloss k="page.war.consequences.heading" />
        </h2>
        <Prose text={war.consequences} />
      </section>

      {events.length > 0 ? (
        <section className={styles.section} aria-labelledby="evenements">
          <h2 id="evenements" className={styles.titre}>
            {t('v2.war.events')}
          </h2>
          <ul className={styles.evenements} role="list">
            {events.map((event) => (
              <li key={event.id}>
                <span className={styles.anneeListe}>{formatYear(event.year, reading)}</span>
                <NomEntite kind="event" id={event.id} name={event.title} />
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <SourcesPied sources={war.sources} />
    </div>
  );

  const commandes =
    total > 0 ? (
      <div className={styles.rejouer} role="group" aria-label={t('v2.war.replay_label')}>
        <div className={styles.boutons}>
          <button type="button" className={styles.bouton} disabled={current === null || current === 0} onClick={() => current !== null && step(current - 1)}>
            {t('v2.war.replay_previous')}
          </button>
          <button
            type="button"
            className={styles.bouton}
            disabled={current !== null && current >= total - 1}
            onClick={() => step(current === null ? 0 : current + 1)}
          >
            {current === null ? t('v2.war.replay_start') : `${t('v2.war.replay_next')}`}
          </button>
        </div>
        <p className={styles.etat} aria-live="polite">
          {battle ? (
            <>
              <span className={styles.compteur}>{t('v2.war.replay_status', { n: (current ?? 0) + 1, total })}</span> {tx(battle.name)}
              {kept ? <span className={styles.garde}>{t('v2.war.place_kept')}</span> : null}
            </>
          ) : null}
        </p>
      </div>
    ) : null;

  return (
    <Page partition="parti">
      <Parti
        entete={
          <Titre text={war.title} className={tx(war.title).length > 22 ? styles.titreLong : undefined}>
            {entete}
          </Titre>
        }
        recit={recit}
        temps={
          <Colonne
            span={[war.from, war.to]}
            annee={shownYear}
            carte={
              placeIds.length > 0 ? (
                <Carte
                  title={t('page.war.map.title', { name: tx(war.title) })}
                  placeIds={placeIds}
                  marks={marks}
                  selectedId={selectedId}
                  frame={frame}
                />
              ) : null
            }
            commandes={commandes}
          />
        }
      />
    </Page>
  );
}
