/** Les neuf registres de la ligne haute et de l'Index, dans l'ordre de la spec (§2.1). */
export interface Register {
  to: string;
  /** Clé d'interface du nom (`nav.*`). */
  key: string;
}

export const REGISTERS: readonly Register[] = [
  { to: '/chroniques', key: 'nav.chronicles' },
  { to: '/lignee', key: 'nav.genealogy' },
  { to: '/personnages', key: 'nav.characters' },
  { to: '/dragons', key: 'nav.dragons' },
  { to: '/guerres', key: 'nav.wars' },
  { to: '/lieux', key: 'nav.places' },
  { to: '/langue', key: 'nav.language' },
  { to: '/sources', key: 'nav.sources' },
  { to: '/apprendre', key: 'nav.learn' },
];
