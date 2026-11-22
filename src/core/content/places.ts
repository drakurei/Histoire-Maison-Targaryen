/**
 * Lieux et carte.
 * Données produites par `scripts/build-content.mjs` à partir de `content/locations/`.
 */
import placesJson from '@/content/generated/places.json';
import mapJson from '@/content/generated/map.json';
import type { MapData, Place } from './types';

interface PlacesData {
  places: Place[];
}

interface MapFile {
  /** Faux tant que `content/locations/map.json` n'est pas livré : la carte est alors vide. */
  available: boolean;
  map: MapData;
}

/*
 * Seuls transtypages du module, un par fichier. TypeScript infère du JSON des tableaux là
 * où le contrat attend des couples et des quadruplets (`coord`, `viewBox`) : la forme
 * exacte est garantie en amont par la validation de `scripts/build-content.mjs`.
 */
const typedPlaces = placesJson as unknown as PlacesData;
const typedMap = mapJson as unknown as MapFile;

export const places: readonly Place[] = typedPlaces.places;

const placeById: ReadonlyMap<string, Place> = new Map(places.map((place) => [place.id, place]));

export function getPlace(id: string): Place | undefined {
  return placeById.get(id);
}

/** Tracés de la carte. Toutes les couches sont des tableaux, vides si la carte manque. */
export const mapData: Readonly<MapData> = typedMap.map;

export const mapAvailable: boolean = typedMap.available;
