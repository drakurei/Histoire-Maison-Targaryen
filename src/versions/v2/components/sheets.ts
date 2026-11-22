import { createContext, useContext } from 'react';

/** Ouvrir la recherche ou l'Index depuis une vue (page introuvable, portail, états vides). */
export interface SheetsApi {
  openSearch: () => void;
  openIndex: () => void;
}

export const SheetsContext = createContext<SheetsApi>({ openSearch: () => undefined, openIndex: () => undefined });

export function useSheets(): SheetsApi {
  return useContext(SheetsContext);
}
