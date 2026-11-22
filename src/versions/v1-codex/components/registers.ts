/**
 * Les registres de la bibliothèque : signets du folio (écran large) et tiroir de l'étagère
 * (téléphone). Sources et à-propos n'y sont pas : ils vivent dans le colophon.
 */
export interface Register {
  id: string;
  /** Chemin interne, sans préfixe de version. */
  to: string;
  /** Clé d'interface du libellé (avec forme valyrienne quand elle existe). */
  key: string;
}

export const REGISTERS: readonly Register[] = [
  { id: 'lignee', to: '/lignee', key: 'nav.genealogy' },
  { id: 'personnages', to: '/personnages', key: 'nav.characters' },
  { id: 'dragons', to: '/dragons', key: 'nav.dragons' },
  { id: 'guerres', to: '/guerres', key: 'nav.wars' },
  { id: 'lieux', to: '/lieux', key: 'nav.places' },
  { id: 'langue', to: '/langue', key: 'nav.language' },
  { id: 'apprendre', to: '/apprendre', key: 'nav.learn' },
];

/** Vrai si le chemin interne courant appartient au registre (la salle et ses fiches). */
export function inRegister(path: string, register: Register): boolean {
  return path === register.to || path.startsWith(`${register.to}/`);
}
