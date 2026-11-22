import { useMemo, useState } from 'react';

import { MAIN_ID } from '@/app/a11y';
import { VLink } from '@/app/version';
import { mapAvailable, places } from '@/core/content/places';
import type { Battle, PlaceKind } from '@/core/content/types';
import { battles, getWar } from '@/core/content/wars';
import { useLang, useT, useTitle, useTx, VALYRIAN_TAG } from '@/core/i18n';
import type { MapFrame } from '@/shared/map';

import { EmptyState } from '../components/EmptyState';
import { EntityLink } from '../components/EntityLink';
import { FilterBar } from '../components/FilterBar';
import { useWide } from '../components/hooks';
import type { FilterGroup } from '../components/FilterBar';
import { Folio } from '../components/Folio';
import { col } from '../components/grid';
import { Rubric } from '../components/Rubric';
import styles from './PlacesPage.module.css';
import { CodexMap } from './places/CodexMap';
import { alphabetical, kindKey, PLACE_KINDS, toMapPlace } from './places/placeModel';

/** Toute la carte, Westeros et l'ouest d'Essos, sans les marges de mer vide. */
const OVERVIEW: MapFrame = { bounds: [60, -30, 1990, 1330], pad: 0.01 };
/** Sur un écran étroit, la carte s'ouvre sur Westeros et le détroit ; Essos est à un glisser. */
const WESTEROS: MapFrame = { bounds: [170, 10, 830, 1150], pad: 0.02 };

/**
 * Les lieux (/lieux) : la carte gravée sur toute la largeur du rouleau, l'index des lieux à
 * côté, comme celui d'un atlas, et des filtres par genre. Survoler un nom de l'index le
 * désigne sur la carte ; un signe de la carte mène à la notice du lieu.
 */
export default function PlacesPage() {
  const t = useT();
  const tx = useTx();
  const title = useTitle();
  const { reading } = useLang();
  const [kinds, setKinds] = useState<ReadonlySet<PlaceKind>>(() => new Set());
  const [hovered, setHovered] = useState<string | null>(null);
  const wide = useWide();

  const shown = useMemo(() => (kinds.size === 0 ? places : places.filter((place) => kinds.has(place.kind))), [kinds]);
  const shownIds = useMemo(() => (kinds.size === 0 ? null : new Set(shown.map((place) => place.id))), [kinds, shown]);
  const mapPlaces = useMemo(
    () => places.map((place) => toMapPlace(place, title(place.name), `${t(kindKey(place.kind))}, ${tx(place.region)}`)),
    [title, t, tx],
  );
  const index = useMemo(() => alphabetical(shown, (place) => tx(place.name), reading), [shown, tx, reading]);

  const groups: FilterGroup[] = [
    {
      id: 'kind',
      label: t('page.places.filter.kind'),
      options: PLACE_KINDS.map((kind) => ({
        value: kind,
        label: t(kindKey(kind, true)),
        pressed: kinds.has(kind),
        count: places.filter((place) => place.kind === kind).length,
      })).filter((option) => option.count > 0),
    },
  ];

  const toggle = (_group: string, value: string) => {
    setKinds((current) => {
      const next = new Set(current);
      const kind = value as PlaceKind;
      if (next.has(kind)) next.delete(kind);
      else next.add(kind);
      return next;
    });
  };

  return (
    <main id={MAIN_ID}>
      <Folio wide>
        <header className={`${col.pleine} ${styles.head}`}>
          <Rubric as="h1" k="nav.places" size="monumental" />
          <p className={styles.lead}>{t('page.places.lead')}</p>
        </header>

        {places.length > 0 ? (
          <FilterBar
            className={`${col.pleine} ${styles.filters}`}
            groups={groups}
            onToggle={toggle}
            shown={shown.length}
            total={places.length}
            onClear={() => setKinds(new Set())}
          />
        ) : null}

        <div className={`${col.pleine} ${styles.atlas}`}>
          <div className={styles.mapColumn}>
            {mapAvailable ? (
              <CodexMap
                places={mapPlaces}
                title={t('page.places.map.title')}
                frame={wide ? OVERVIEW : WESTEROS}
                highlightIds={shownIds}
                selectedId={hovered}
                onHover={setHovered}
                className={styles.map}
              />
            ) : (
              <EmptyState titleKey="page.places.map.missing" bodyKey="page.places.map.missingBody" />
            )}
            <p className={styles.caption}>{t('page.places.map.caption')}</p>
          </div>

          <nav className={styles.index} aria-label={t('page.places.index.label')}>
            {places.length === 0 ? (
              <BattlePlaces />
            ) : shown.length === 0 ? (
              <EmptyState titleKey="page.places.empty" action={{ labelKey: 'page.bati.filter.clear', onClick: () => setKinds(new Set()) }} />
            ) : (
              index.map((group) => (
                <section key={group.letter} className={styles.letter} aria-label={group.letter}>
                  <p className={styles.initial} aria-hidden="true">
                    {group.letter}
                  </p>
                  <ul className={styles.entries} role="list">
                    {group.items.map((place) => {
                      const name = title(place.name);
                      return (
                        <li key={place.id} className={styles.entry} data-active={hovered === place.id || undefined}>
                          <VLink
                            to={`/lieux/${place.id}`}
                            className={styles.entryLink}
                            onPointerEnter={() => setHovered(place.id)}
                            onPointerLeave={() => setHovered(null)}
                            onFocus={() => setHovered(place.id)}
                            onBlur={() => setHovered(null)}
                          >
                            <span className={styles.entryName} lang={name.isHv ? VALYRIAN_TAG : undefined}>
                              {name.primary}
                            </span>
                            {name.gloss ? <span className={styles.entryGloss}>{name.gloss}</span> : null}
                          </VLink>
                          <span className={styles.entryKind}>
                            {t(kindKey(place.kind))}, {tx(place.region)}
                          </span>
                        </li>
                      );
                    })}
                  </ul>
                </section>
              ))
            )}
          </nav>
        </div>
      </Folio>
    </main>
  );
}

/** Sans registre des lieux : ceux que nomment les batailles, sans position, avec leur guerre. */
function BattlePlaces() {
  const tx = useTx();
  const known = new Map<string, Battle>();
  for (const battle of battles) {
    const key = tx(battle.placeName);
    if (!known.has(key)) known.set(key, battle);
  }
  return (
    <div>
      <EmptyState titleKey="page.places.registryMissing" bodyKey="page.places.registryMissingBody" />
      <ul className={styles.entries} role="list">
        {[...known.entries()].map(([name, battle]) => {
          const war = getWar(battle.warId);
          return (
            <li key={name} className={styles.entry}>
              <span className={styles.entryName}>{name}</span>
              {war ? (
                <span className={styles.entryKind}>
                  <EntityLink kind="battle" id={battle.id} warId={battle.warId} name={battle.name} />
                </span>
              ) : null}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
