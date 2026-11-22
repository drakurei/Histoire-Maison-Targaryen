import { useMemo, useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';

import { getPlace, places } from '@/core/content/places';
import { useT, useTx } from '@/core/i18n';
import { useFiltre } from '@/versions/v2/components/Filtres';
import { placeHistory, placesOfYear, withoutTwins } from '@/versions/v2/pages/registres/appearances';
import { useUrlYear, useYear } from '@/versions/v2/state/year';

import { useVue } from '../components/common/useVue';
import { Vue } from '../components/common/Vue';
import { ListeLieux } from './registres/ListeLieux';
import { boundsAround, boundsAroundPlaces, DEFAULT_BOUNDS, PHONE_BOUNDS, Scene } from './registres/Scene';
import styles from './PlacesPage.module.css';

/** Le lieu ouvert, lu dans l'adresse : le parent ne reçoit pas les paramètres de sa route fille. */
function usePlaceId(): string | null {
  const { pathname } = useLocation();
  const match = /\/lieux\/([^/]+)\/?$/.exec(pathname);
  return match?.[1] ? decodeURIComponent(match[1]) : null;
}

/**
 * Lieux `/lieux` et `/lieux/:placeId` (v3-spec §6.12, champ plein, carte persistante). Ce
 * parent commun porte la carte : elle se recadre d'un lieu à l'autre, elle ne se remonte pas.
 * La colonne de gauche montre l'index (titre, lieux de l'année, tous les lieux par contrée,
 * filtres par genre) ou, sur un lieu, sa notice rendue par la route fille (`<Outlet />`).
 * Les années du lieu ouvert sont des encoches sur la fasce.
 */
export default function PlacesPage() {
  const t = useT();
  const tx = useTx();
  const year = useYear();
  const settled = useUrlYear();
  const kinds = useFiltre('genre');
  const [survol, setSurvol] = useState<string | null>(null);
  const placeId = usePlaceId();
  const place = placeId ? getPlace(placeId) : undefined;

  const years = useMemo(() => {
    if (!place) return [];
    const history = withoutTwins(placeHistory(place.id), tx);
    return [...new Set(history.map((item) => item.year).filter((value): value is number => value !== null))].sort((a, b) => a - b);
  }, [place, tx]);
  useVue({ marks: years.map((mark) => ({ year: mark, active: mark === year })) });

  const ofYear = useMemo(() => (year !== null ? placesOfYear(year) : null), [year]);
  const highlight = useMemo(() => (ofYear ? new Set(ofYear.keys()) : null), [ofYear]);
  const shown = useMemo(() => places.filter((candidate) => kinds.size === 0 || kinds.has(candidate.kind)), [kinds]);

  // L'index se cadre sur les lieux de l'année une fois l'année posée (au relâcher, jamais pendant le glisser).
  const framed = useMemo(() => {
    if (settled === null) return null;
    const ids = new Set(placesOfYear(settled).keys());
    return boundsAroundPlaces(places.filter((candidate) => ids.has(candidate.id)).map((candidate) => candidate.coord));
  }, [settled]);

  const bounds = place ? boundsAround(place.coord) : (framed ?? DEFAULT_BOUNDS);
  const phoneBounds = place ? bounds : (framed ?? PHONE_BOUNDS);
  const mapTitle = place ? t('page.place.map.title', { name: tx(place.name) }) : t('page.places.map.title');

  return (
    <Vue partition="champ" className={styles.vue} ecran={placeId && !place ? 'introuvable' : undefined}>
      <Scene
        bounds={bounds}
        phoneBounds={phoneBounds}
        placeIds={!place && kinds.size > 0 ? shown.map((candidate) => candidate.id) : undefined}
        highlightIds={highlight}
        selectedId={place ? place.id : survol}
        mapTitle={mapTitle}
        label={place ? tx(place.name) : t('v3.registres.lieux.colonne')}
      >
        {placeId ? <Outlet /> : <ListeLieux shown={shown} ofYear={ofYear} highlight={highlight} survol={survol} onSurvol={setSurvol} />}
      </Scene>
    </Vue>
  );
}
