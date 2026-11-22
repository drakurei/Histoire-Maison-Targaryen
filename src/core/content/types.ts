/**
 * Contrat des contenus, côté application.
 *
 * Tout ce que l'interface affiche passe par ces types. Les fichiers de `content/`
 * (source de vérité, rédigés par les agents de contenu) sont validés et normalisés
 * par `scripts/build-content.mjs` vers `src/content/generated/*.json`, qui respecte
 * exactement ces formes. Aucune donnée ne dépend de la présentation.
 */

/** Langue d'affichage. `hv` : haut valyrien pour l'interface et les titres, récit dans la langue d'appui. */
export type Lang = 'hv' | 'fr' | 'en';
/** Langue d'appui : celle du récit et des gloses quand `Lang` vaut `hv`. */
export type SupportLang = 'fr' | 'en';

/** Texte traduit. `hv` n'existe que si une forme valyrienne a été validée par le linguiste. */
export interface Localized {
  fr: string;
  en: string;
  hv?: string;
}

/** Statut linguistique d'une forme valyrienne. */
export type HvStatus = 'atteste' | 'derive' | 'editorial' | 'adaptation';

export type Reliability = 'etabli' | 'recit-unique' | 'contradictoire' | 'legende' | 'adaptation';
export type Continuity = 'livres' | 'adaptation';
export type DateCertainty = 'exacte' | 'approximative' | 'inconnue';

/** Années : nombre d'années après la Conquête ; négatif avant ; `null` si les sources ne donnent rien. */
export type Year = number | null;

export interface SourceRef {
  id: string;
  locator?: string;
}

export interface Source {
  id: string;
  title: string;
  titleFr: string | null;
  author: string;
  year: number | null;
  yearEnd?: number | null;
  type: 'livre' | 'nouvelle' | 'encyclopedie-univers' | 'serie' | 'outil-de-verification';
  continuity: Continuity;
  /** Nature du témoignage (échelle `sourceReliabilityScale`). */
  reliability: string;
  reliabilityNote: Localized;
  members?: string[];
}

export interface ReliabilityLevel {
  id: Reliability;
  order: number;
  label: Localized;
  definition: Localized;
}

/** Référence à une entité : `id` si elle existe dans nos registres, sinon seulement son nom. */
export interface EntityRef {
  id?: string;
  name: Localized;
}

/* ------------------------------------------------------------------ Chroniques */

export interface EssaySection {
  id: string;
  heading: Localized;
  /** Paragraphes séparés par une ligne vide. Texte original, jamais recopié des ouvrages. */
  body: Localized;
  sources: SourceRef[];
}

export interface Period {
  id: string; // p1 … p8
  order: number;
  title: Localized; // hv = titre valyrien de la période
  hvStatus: HvStatus;
  from: Year;
  to: number;
  summary: Localized;
  /** Récit long de la période, en sections. */
  essay: EssaySection[];
  note?: Localized;
  openQuestions: Localized[];
  eventIds: string[];
}

export interface HistoricalEvent {
  id: string;
  periodId: string;
  year: Year;
  yearEnd?: number;
  sortYear: number;
  dateCertainty: DateCertainty;
  yearLabel: Localized;
  dateNote?: Localized;
  title: Localized;
  summary: Localized;
  consequence: Localized;
  people: EntityRef[];
  dragons: EntityRef[];
  places: EntityRef[];
  continuity: Continuity;
  reliability: Reliability;
  reliabilityNote?: Localized;
  sources: SourceRef[];
}

/* ------------------------------------------------------------------ Lignée et personnes */

export type Legitimacy = 'legitime' | 'batard' | 'legitime-par-decret';

export interface Person {
  id: string;
  name: Localized;
  epithet?: Localized;
  sex: 'm' | 'f';
  house: string;
  born: Year;
  died: Year;
  bornRange?: [Year, Year];
  diedRange?: [Year, Year];
  dateCertainty: DateCertainty;
  alive?: boolean;
  king: boolean;
  reign: [number, number] | null;
  pretender?: { from: number; to: number | null; note?: Localized };
  legitimacy: Legitimacy;
  generation: number;
  note?: Localized;
  sources: string[];
  /** Vrai si une biographie rédigée existe (`Biography`). */
  hasBiography: boolean;
}

export interface Union {
  id: string;
  partners: [string, string];
  type: 'mariage' | 'liaison' | 'fiancailles';
  year: Year;
  endYear?: number;
  certainty: Reliability;
  note?: Localized;
  sources: string[];
}

export interface Parentage {
  child: string;
  union: string | null;
  father: string | null;
  mother: string | null;
  allegedFather?: string;
  certainty: Reliability;
  note?: Localized;
  sources: string[];
}

export interface Biography {
  personId: string;
  /** Titres portés, du plus important au moindre. */
  titles: Localized[];
  /** Une phrase qui situe la personne. */
  lead: Localized;
  sections: EssaySection[];
  dragonIds: string[];
  eventIds: string[];
  warIds: string[];
  /** Ce que les sources ne tranchent pas. */
  disputed?: Localized;
  /** Ce que l'adaptation télévisée change, tenu à part. */
  adaptation?: Localized;
  sources: SourceRef[];
}

export interface Sovereign {
  id: string; // identifiant de Person
  ordinal: number | null;
  name: Localized;
  epithet?: Localized;
  reignFrom: number;
  reignTo: number;
  born: Year;
  died: number;
  predecessor: string | null;
  successor: string | null;
  relationToPredecessor: Localized;
  contested: boolean;
  contestedNote?: Localized;
  note: Localized;
  sources: SourceRef[];
}

export interface Succession {
  order: number;
  from: string | null;
  to: string;
  year: number;
  relation: Localized;
  mode: string;
  official: boolean;
  parentChild: boolean;
  contestedBy: string[];
  passedOver: string[];
  note: Localized;
  sources: string[];
}

/* ------------------------------------------------------------------ Dragons */

/**
 * Paramètres du dessin procédural. Les couleurs ne sont dites `attested` que si le
 * texte des livres les décrit ; sinon la planche le signale (« teinte non décrite »).
 */
export interface DragonLook {
  /** Envergure relative : Balerion = 1. Ordre de grandeur, les livres ne donnent pas de mesures. */
  span: number;
  /** Longueur relative du cou, 0 à 1 (Caraxes est décrit comme ayant un cou très long). */
  neck: number;
  /** Longueur relative de la queue, 0 à 1. */
  tail: number;
  /** Nombre de paires de cornes ou de crêtes, 0 à 3. */
  horns: number;
  body: string; // couleur CSS
  wing: string;
  crest: string;
  flame: string;
  attested: { body: boolean; wing: boolean; crest: boolean; flame: boolean; size: boolean };
}

export interface DragonRider {
  personId?: string;
  name: Localized;
  from?: number;
  to?: number;
}

export interface Dragon {
  id: string;
  name: Localized; // hv = forme valyrienne si attestée
  alias?: Localized;
  appearance: Localized | null;
  look: DragonLook;
  riders: DragonRider[];
  ridersNote?: Localized;
  origin: Localized;
  hatched: Year; // année d'éclosion ou de première mention, si connue
  died: Year;
  alive?: boolean; // vrai si le sort est inconnu ou si le dragon vit à la fin du récit
  fate: Localized;
  battleIds: string[];
  eventIds: string[];
  adaptationNote?: Localized;
  continuity: Continuity;
  reliability: Reliability;
  sources: SourceRef[];
}

/* ------------------------------------------------------------------ Guerres */

export interface Belligerent {
  id: string; // ex. « noirs », « verts »
  name: Localized;
  /** Couleur d'identification attestée par les sources (les Noirs, les Verts) ou neutre. */
  tone: 'noir' | 'vert' | 'rouge' | 'or' | 'neutre';
  leaders: EntityRef[];
}

export interface Battle {
  id: string;
  warId: string;
  name: Localized;
  year: Year;
  dateCertainty: DateCertainty;
  placeId?: string;
  placeName: Localized;
  /** Identifiants de Belligerent du conflit parent. */
  sides: [string, string];
  victor: string | 'indecis';
  dragons: { dragonId: string; side: string; fate: Localized }[];
  summary: Localized;
  outcome: Localized;
  losses?: Localized;
  reliability: Reliability;
  sources: SourceRef[];
}

export interface War {
  id: string;
  title: Localized;
  hvStatus?: HvStatus;
  from: number;
  to: number;
  periodId: string;
  summary: Localized;
  causes: Localized;
  belligerents: Belligerent[];
  battles: Battle[];
  consequences: Localized;
  eventIds: string[];
  continuity: Continuity;
  reliability: Reliability;
  sources: SourceRef[];
}

/* ------------------------------------------------------------------ Lieux et carte */

export type PlaceKind = 'cite' | 'forteresse' | 'ile' | 'region' | 'ruine' | 'champ-de-bataille' | 'cite-libre';

export interface Place {
  id: string;
  name: Localized;
  hvStatus?: HvStatus;
  kind: PlaceKind;
  region: Localized;
  /** Position dans le repère de `MapData.viewBox`. */
  coord: [number, number];
  description: Localized;
  /** Ce que le lieu doit à la dynastie, ou ce qu'elle lui doit. */
  role: Localized;
  eventIds: string[];
  battleIds: string[];
  sources: SourceRef[];
}

export interface MapData {
  viewBox: [number, number, number, number];
  lands: { id: string; name: Localized; d: string }[];
  islands: { id: string; name?: Localized; d: string }[];
  rivers: { id: string; name?: Localized; d: string }[];
  ranges: { id: string; name?: Localized; d: string }[];
  seas: { id: string; name: Localized; at: [number, number] }[];
  regions: { id: string; name: Localized; at: [number, number] }[];
}

/* ------------------------------------------------------------------ Langue */

export interface LexiconEntry {
  id: string;
  hv: string;
  fr: string;
  en: string;
  status: HvStatus;
  /** Thème de classement : parenté, royauté, guerre, feu, nature, corps, temps, nombres, formules, interface… */
  theme: string;
  /** Nature grammaticale et déclinaison ou classe verbale si connue. */
  grammar?: Localized;
  notes: Localized;
  refs: string[];
  verified: boolean;
}

export interface Phrase {
  id: string;
  hv: string;
  fr: string;
  en: string;
  /** Mot à mot. */
  literal?: Localized;
  status: HvStatus;
  context: Localized;
  refs: string[];
}

export interface GrammarBlock {
  kind: 'p' | 'table' | 'example';
  text?: Localized;
  /** Pour `table` : première ligne = en-têtes. */
  rows?: Localized[][];
  hv?: string;
  gloss?: Localized;
}

export interface GrammarLesson {
  id: string;
  order: number;
  title: Localized;
  summary: Localized;
  blocks: GrammarBlock[];
  refs: string[];
}

/** Chaîne d'interface. `hv` absent : la langue d'appui est affichée seule. */
export interface UiString {
  key: string;
  fr: string;
  en: string;
  hv?: string;
  status?: HvStatus;
  note?: string;
}

/* ------------------------------------------------------------------ Apprendre */

export interface PathStep {
  id: string;
  title: Localized;
  body: Localized;
  /** Chemins internes sans préfixe de version, ex. « /chroniques/p5 ». */
  links: { to: string; label: Localized }[];
  retain: Localized[];
}

export interface QuizQuestion {
  id: string;
  question: Localized;
  choices: Localized[];
  answer: number;
  explanation: Localized;
  source?: SourceRef;
}

export interface LearningPath {
  id: string;
  order: number;
  title: Localized;
  hvStatus?: HvStatus;
  intro: Localized;
  /** Durée de lecture estimée, en minutes. */
  minutes: number;
  steps: PathStep[];
  quiz: QuizQuestion[];
}

/* ------------------------------------------------------------------ Recherche */

export type SearchKind = 'person' | 'dragon' | 'event' | 'period' | 'war' | 'battle' | 'place' | 'word' | 'path';

export interface SearchEntry {
  kind: SearchKind;
  id: string;
  /** Chemin interne sans préfixe de version. */
  to: string;
  label: Localized;
  /** Texte secondaire : dates, épithète, traduction. */
  hint?: Localized;
  /** Formes normalisées (sans diacritiques, minuscules) sur lesquelles chercher. */
  keys: string[];
}
