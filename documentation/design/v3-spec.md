# Version 3 : « l'édition ultime », arbitrage et spécification de réalisation

Directeur artistique et arbitre de la V3, le 22 novembre 2026. Complète `DESIGN.md` (jetons, familles, interdits du §0, mouvements admis du §5), qui reste l'autorité. Code dans `src/versions/v3/`. Classe racine `.v3`. La V3 s'ouvre par défaut (`DEFAULT_VERSION = 'version-3'`), la V1 et la V2 restent montées sous leur préfixe et doivent continuer à fonctionner.

Pièces lues : `PRODUCT.md`, `DESIGN.md`, `ARCHITECTURE.md`, `v1-codex.md`, `audit-v1.md`, `v2-arbitrage.md`, `v2-spec.md`, `audit-v2.md`, le code des deux versions (bâti, points d'entrée, vues principales). Captures regardées : portail, période V, lignée, planche de Balerion, lieux, lexique, des deux versions, à 1440x900 et 390x844 (`tests/visual/out/v3/arb/v{1,2}-<vue>-{1440,390}.png`).

## 0. Le principe en une phrase

**Le champ de sable pour trouver, le vélin pour lire.** La V3 garde le lieu et l'instrument de la V2 (le champ d'obsidienne, la fasce de gueules réglée par l'année, le cartel qui montre sans quitter la page) et y pose, chaque fois qu'il y a un texte long à lire, la feuille de la V1 (vélin, rubrication, lettrine, marge savante). La V2 dit *quand* et *où* ; la V1 dit *ce qui s'est passé*. Ce n'est pas une troisième direction : c'est le livre posé sur le blason.

Nom de travail : **le Codex armorié**.

## 1. Arbitrage

### 1.1 Ce que montrent les captures

| Vue | V1 « Le Codex » | V2 « Sable et gueules » |
|---|---|---|
| Portail 1440 | Bel objet, mais l'emblème rouge et le titre occupent l'écran sans rien apprendre ; 320 px de dos de cuir à gauche. | La meilleure image du projet : la masse des dragons vivants en majesté, cinq repères, l'histoire entière en une figure. |
| Portail 390 | Titre, incipit, bouton : correct, aucune figure au premier écran ; bande sombre de 15 px au bord droit du folio. | Titre puis masse, mais **deux masses superposées** (la majesté et la fasce fixe) au premier écran. |
| Période V 1440 | La meilleure page de lecture : vélin, chiffre rubriqué, récit à 62 signes ; ni carte ni temps à côté. | Carte et profil évidé justes, mais le titre en `--t5` sur deux lignes pousse le récit sous la ligne de flottaison : on voit trois lignes de texte. |
| Lignée 1440 | Arbre complet à l'encre, dense et réel ; colonne des générations qui chevauche les noms (audit V1 n° 15). | Pal lisible au téléphone, mais à 1440 le premier écran montre quatre noms sous un titre géant. |
| Balerion 1440 | Planche annotée lisible : silhouette entière, couleurs « décrite » ou « non décrite ». | L'échelle par le cadre impressionne, mais le premier écran ne montre que la tête : on ne voit pas le dragon. |
| Lieux 1440 | La carte gravée commence sous la ligne de flottaison. | Carte persistante plein champ, juste ; signes de 22 px (n° 17). À 390, « baie de la Néra » écrit deux fois. |
| Lexique 1440 | Premier écran sans un seul mot : un paragraphe et 322 carrés. | Des mots dès le premier écran et un spécimen à droite ; mais la fasce éteinte mange 88 px sur une vue sans temps. |
| Navigation | Dos de volumes et signets : signets réduits à une initiale gothique illisible (« Z I Z V Ā V G »), dos qui coûtent un quart de l'écran. | Registres écrits en entier avec leur glose, fasce au pouce : clair et rapide. |

### 1.2 Ce que la V3 prend, vue par vue

| Vue | De la V1 | De la V2 | Défaut des deux, corrigé en V3 | Nouveau en V3 |
|---|---|---|---|---|
| Bâti | la feuille de vélin, ses encres par surface (`data-surface`), les dos de cuir (dans l'Index seulement) | la fasce et son année, la ligne des registres, le cartel `?voir=`, la recherche qui accepte une année, l'Index | dos permanents (V1) qui coûtent 320 px ; fasce éteinte de 88 px (V2) sur les vues sans temps | fasce réduite à un fil et sa rangée sur les vues sans temps ; dos de cuir couchés dans l'Index avec le profil rouge de chaque période |
| Portail | la table des huit volumes sur vélin, sous le premier écran | la masse en majesté et ses repères comme premier écran | double masse au téléphone (V2) ; emblème qui couvre la glose (V1 n° 6) | la masse en majesté *est* la fasce au portail : la fasce fixe ne montre sa masse qu'après la sortie de la majesté |
| Chroniques | les dos de cuir comme rangées des périodes | le fascé aligné sur l'échelle de la fasce, règnes et guerres | | chaque rangée est un dos couché suivi de son profil à l'échelle vraie |
| Période | le folio : titre rubriqué, lettrine dorée d'ouverture, sections rubriquées, marge savante | colonne collante sombre (carte, profil soudé, grand nombre évidé), annales qui règlent l'année, sommaire, reprise | récit sous la ligne de flottaison (V2) ; chiffre trop petit (V1 n° 18) ; colonne qui passe sous la fasce à l'arrivée (V2 n° 14) | les annales quittent le folio et se posent sur le champ sombre : c'est un instrument, pas une lecture |
| Événement | folio, marge des personnes, dragons, lieux | colonne sombre cadrée sur l'événement, ouvrir règle l'année, précédent et suivant dans le fil de toute la chronique | | |
| Lignée | l'arbre entier à l'encre sur vélin (rouleau) | le pal par défaut, centre `?p=`, âges à l'année, lien de parenté | générations qui chevauchent (V1 n° 15) ; ordinal en Grenze lu comme un second numéro (V2 n° 15) ; couronne illisible (V2 n° 16) ; premier écran vide à 1440 (V2) | le centre et le lien de parenté tiennent dans le premier écran à 1440 |
| Personnages, fiche | index savant (tri alphabétique possible) ; biographie sur folio avec lettrine et parenté en notation généalogique | lignes de vie fascées ; colonne sombre : vie agrandie, fragment du pal, dragons montés | traits de rappel qui traversent les étiquettes (V1 n° 16) | |
| Dragons, planche | la planche annotée sur vélin (silhouette entière, couleurs décrites ou non), « voir voler » | registre fascé, « qui vole en 129 », échelle commune, fantôme du dragon vu juste avant, lieux où il paraît | tête seule au premier écran (V2) | la planche entière au premier écran, l'échelle comparée dans la colonne sombre à côté |
| Guerres, guerre | les batailles numérotées et rubriquées sur folio | liste fascée, carte numérotée et « rejouer » dans la colonne sombre | grand nombre coupé à l'arrivée (V2 n° 14) : le nombre passe au pied de la carte | |
| Lieux, lieu | | la carte persistante plein champ, lieux de l'année, encoches d'un lieu sur la fasce | signes de 22 px (V2 n° 17) ; carte sous la ligne de flottaison (V1) ; étiquette en double | |
| Langue et salles | glose interlinéaire mot à mot, leçons, tableaux d'encre | spécimen collant du mot survolé, des mots au premier écran, recherche sans macrons | premier écran sans un mot (V1) ; titres de salles sans valyrien et plus petits (V1 n° 17, V2 n° 22) | |
| Sources | registre sur folio | l'échelle des cinq marques en colonne | | |
| Apprendre, parcours | questionnaire sur folio, une question à la fois | parcours fascés sur l'échelle de la fasce | | |
| À propos | colophon sur folio, poinçon JD | « dracarys » | emblème avant le `h1` au téléphone (V2 n° 20) | |
| Introuvable | la table des volumes | la fasce en majesté éteinte, en cramoisi | | |

### 1.3 Ce qui est écarté

| Idée | Origine | Raison |
|---|---|---|
| Dos de volumes fixes à gauche, signets en tête du folio | V1 | 320 px pris à la lecture ; signets illisibles (une initiale). Les dos survivent dans l'Index et sur `/chroniques`, les signets disparaissent. |
| Ouverture longue (pierre, lueur, ombre, emblème, titre, dos : 3,2 s) | V1 | S'ajoute au seuil. La V3 ouvre par « la masse se dépose » (700 ms). |
| Courbe des dragons à l'encre au portail | V1 | La même donnée que la masse, en moins fort : la V2 garde la figure (`v2-arbitrage.md`, objection 2, tranchée ici). |
| Échelle par le cadre au premier écran de la planche | V2 | On ne voit pas le dragon. L'échelle passe en colonne. |
| Titre `h1` en `--t5` sur le parti | V2 | Pousse le texte sous la ligne de flottaison. Le `h1` du folio est en `--t4`. |
| Toute fasce de 88 px sur une vue sans temps | V2 | Un fil de 3 px suffit à dire « hors du temps ». |
| « Remettre dans l'ordre » | proposé à la V3 par `v2-arbitrage.md` §5 | Demande d'étendre `@/core/quiz` ; non requis, groupe D s'il reste du temps. |

## 2. Surfaces et couleur

### 2.1 Deux surfaces, une règle

| Surface | Quand | Encres |
|---|---|---|
| **Champ** (`--obsidienne`, sans grain, sans lumière) | partout par défaut : bâti, portail, figures, registres en liste, carte, lignée, colonnes du parti, annales, cartel, feuilles | `--ivoire` texte, `--cendre` appareil, `--braise` état actif, `--sang` données seulement (V2 §3.1) |
| **Folio** (`--velin`, `data-surface="velin"`) | seulement côté texte d'un **parti** (période, événement, fiche, guerre, planche sous le premier écran, langue et salles, sources, parcours, à propos), et l'arbre entier (rouleau à l'encre) | `--encre` texte, `--encre-pale` appareil, `--rubrique` titres et appels, or d'encre `oklch(0.47 0.09 72)` pour le texte doré (5,15:1) |

Règle de contrôle en revue : un vélin sans texte long à lire est refusé ; un texte de plus de trois paragraphes posé sur le champ est refusé (sauf cartel et notice de lieu).

Le grain de basalte, la lumière basse et les cuirs de la V1 ne vivent plus sur le fond : le champ est plat (la V2 avait raison, le grain coûtait et datait). Les cuirs ne servent qu'aux dos de l'Index et de `/chroniques`.

### 2.2 Jetons propres à la V3 (`theme.css`, sous `.v3`, dans `@layer v3`)

```
--v3-ligne: 4rem;              ligne des registres (ordinateur), 3rem au téléphone
--v3-fasce-ciel: 0.75rem;      encoche, durée, encoches d'entité
--v3-fasce-masse: 2.75rem;     quinze dragons (1rem au téléphone)
--v3-fasce-rangee: 2.75rem;    périodes (ordinateur) ou commandes (téléphone)
--v3-fasce-fil: 3px;           fasce éteinte
--v3-fasce: calc(ciel + masse + rangee)           vue datée
--v3-fasce-eteinte: calc(fil + rangee)            vue sans temps
--v3-fasce-totale: var(--v3-fasce | --v3-fasce-eteinte) + env(safe-area-inset-bottom)
--v3-volet: min(28rem, 34vw);  cartel ordinateur
--v3-folio-pad: clamp(1.25rem, 4vw, 4rem);
--v3-cuir-1 … --v3-cuir-8      mêmes valeurs que --v1-cuir-* (v1 theme.css)
--v3-or-encre: oklch(0.47 0.09 72);
--v3-or-sombre: oklch(0.52 0.10 75);  lettrine dorée seulement (grand corps)
--v3-vert: oklch(0.58 0.09 150);      camp des Verts, rien d'autre
```

Encres sémantiques, redéfinies par la surface (mécanisme de la V1) :

```
.v3                         --v3-texte: --ivoire; --v3-texte-2: --cendre; --v3-rubrique: --braise;
                            --v3-or: --or; --v3-trait: --basalte; --v3-surface: --obsidienne; --v3-actif: --braise
.v3 [data-surface='velin']  --v3-texte: --encre; --v3-texte-2: --encre-pale; --v3-rubrique: --rubrique;
                            --v3-or: --v3-or-sombre; --v3-trait: oklch(0.74 0.04 72); --v3-surface: --velin;
                            --v3-actif: --rubrique; --focus-couleur: --rubrique
```

**Pont vers les composants importés** (indispensable, voir §4) : sous `.v3` et sous `.v3 [data-surface='velin']`, déclarer `--v1-texte`, `--v1-texte-2`, `--v1-rubrique`, `--v1-or`, `--v1-or-sombre`, `--v1-or-encre`, `--v1-trait`, `--v1-surface`, `--v1-actif`, `--v1-folio-pad`, `--v1-folio-max`, `--v1-ombre-portee`, `--v1-barre: 0px`, `--v1-etagere: 0px` égaux aux jetons V3 ; et `--v2-fasce-totale`, `--v2-fasce`, `--v2-fasce-ciel`, `--v2-fasce-masse`, `--v2-fasce-rangee`, `--v2-fasce-chiffres`, `--v2-zone-sure`, `--v2-reserve`, `--v2-reserve-bas`, `--v2-ligne`, `--v2-volet`, `--v2-cartel`, `--v2-bord`, `--v2-colonne`, `--v2-vert`, `--v2-hachure` égaux aux mesures V3. Porter aussi dans `theme.css` les règles de base dont ces composants dépendent (liens, `.gloss`, `time`, `::selection`, `.sr-only`, champ de recherche) en lisant `src/versions/v1-codex/theme.css` et `src/versions/v2/theme.css`, sans importer ces deux fichiers.

Ajouter `v3` à l'ordre des couches s'il est déclaré quelque part (`src/styles/base.css` déclare `reset, base` ; `v1` et `v2` se déclarent par leur thème) : la couche `v3` se déclare dans `theme.css` comme les deux autres.

### 2.3 Contrastes (repris des audits, tous vérifiés depuis les jetons)

Champ : ivoire 16,2:1, cendre 5,5:1, braise 6,4:1, or 9,2:1, sang 3,0:1 (objet graphique seulement). Folio : encre 12,3:1, encre pâle 6,3:1, rubrique 6,3:1, or d'encre 5,15:1. Interdits : sang en texte sur suie (2,79:1, audit V2 n° 5), or vif en texte ou en trait sur vélin (environ 1,7:1 ; sur vélin la couronne prend `--v3-or-encre`), cendre sur cramoisi.

## 3. Bâti

### 3.1 Ordinateur (1024 px et plus)

```
┌─────────────────────────────────────────────────────────────────────────────────────┐
│ Targārio Lentro Vestriarja   Vestriarja Zaldrīzo Ānogar Issarossa … Gūrēñagon  HV FR EN│ ligne des registres, 64 px,
│ (glose)                      (glose)    (glose)         (glose)                 Gloses │ non fixe, sans fond ni filet
│                                                                                     │
│  ┌───────────────────────────────────────────────┐   ┌───────────────────────────┐  │
│  │ FOLIO (vélin), colonnes 1 à 8                  │   │ COLONNE (champ), 9 à 12   │  │
│  │ titre rubriqué --t4, glose, années, marques    │   │ collante : carte en haut, │  │
│  │ chapeau --t1                                   │   │ grand nombre au pied de   │  │
│  │ récit 7/10 du folio  │ marge savante 3/10      │   │ la carte, profil soudé    │  │
│  └───────────────────────────────────────────────┘   └───────────────────────────┘  │
├────────────────────────────────────────────────────────────────────┬────────────────┤
│░░░░░░▁▁▂▂▃▃▄▅▆▇██▌▂┄┄┄┄┄                                       ▂▂ │ ‹  129  ›      │ fasce fixe, 88 px
│ I Valyria  II III IV        V      VI                       VII VIII│ Korjās Registres│
└────────────────────────────────────────────────────────────────────┴────────────────┘
```

- **Ligne des registres** : `RegisterLine` de la V2, tel quel (nom du site, neuf registres en entier avec leur glose, langue, glose ; registre actif souligné de `--braise` 3 px ; deux rangées entre 1024 et 1279 px). Non fixe.
- **Fasce** (`frame/Fasce3.tsx`, nouveau, bâti sur les pièces de la V2) : fixe en bas, de bord à bord jusqu'au cartel de la fasce (15rem). Deux états :
  - *datée* (88 px) : masse, encoche, durée de la vue, encoches d'entité, rangée des périodes (V2 §2.2, à l'identique : trois états de présence, hachures, `role="slider"`, crans « ‹ » « › » sur les années datées, clavier, aimantation à 4 px, `?an=` en `replace`) ;
  - *éteinte* (47 px) : la masse disparaît, il reste un fil `--cramoisi` de 3 px sur toute la largeur et la rangée des périodes (qui reste une navigation) ; le cartel garde l'année en `--cendre`. Vues éteintes : langue et ses salles, sources, à propos, introuvable.
  - *au portail* : voir §6.1.
- **Le champ** : marges de page de DESIGN §6, réserve basse `calc(var(--v3-fasce-totale) + var(--e6))`.
- **Le folio** (`common/Feuillet.tsx`, enveloppe de `Folio` de la V1 avec `ribbons={false}`) : bord haut et bas irréguliers (le `clip-path` de la V1), ombre courte et dure, marge intérieure `--v3-folio-pad`, grille interne de 10 colonnes : récit 7, marge savante 3. Foliotation en pied (« volume V, feuillet 2 ») seulement dans une période. Le folio est un `article` ; le `main` est la couche de la vue.
- **La colonne** (`common/Colonne.tsx`, nouveau) : colonnes 9 à 12, `position: sticky`, haut mesuré une fois à l'arrivée puis au redimensionnement et quand les polices sont prêtes (méthode de la correction n° 1 de l'audit V2), hauteur `calc(100svh - haut - var(--v3-fasce-totale))`. De haut en bas : la carte (ou la figure de la vue), **le grand nombre posé sur le pied de la carte** (voie b de l'audit V2 n° 14, jamais au-dessus du profil), le profil soudé à la fasce (45 % de la colonne pour quinze dragons). Sans dragon dans la durée (la Chute) : pas de profil, la figure prend la colonne. Aucun élément de la colonne ne passe sous la fasce à l'arrivée, à 1280x800 comme à 1440x900 : critère d'acceptation.
- **Cartel** : `CartelHost` de la V2 (volet de suie à droite, `?voir=`, Retour ferme, focus rendu au nom).
- **Feuilles** : recherche (`SearchSheet` de la V2, chargée à la première ouverture, `/` l'ouvre) et Index (`frame/Index3.tsx`, nouveau, §3.3).

### 3.2 Téléphone et tablette (moins de 1024 px)

```
┌──────────────────────────────┐
│ Targārio Lentro…      HV ▾   │ 48 px, non fixe
│ ┌──────────────────────────┐ │
│ │ FOLIO pleine largeur      │ │ vélin bord à bord, sans bord irrégulier,
│ │ marge intérieure 20 px    │ │ un pli d'ombre en haut ; aucune bande sombre
│ │ notes : appels ¹ dépliés  │ │ au bord droit (défaut V1 vu à 390)
│ │ sous le paragraphe        │ │
│ └──────────────────────────┘ │
│  CHAMP : profil, carte fixe   │
├──────────────────────────────┤
│░▁▂▃▅██▌▇▂┄┄┄┄┄┄┄┄┄┄┄▁▂        │ masse 16 px (zone de glisser entre 16 px et largeur − 16 px)
│ ‹  129 apr. C.  ›  Korjās  Registres │ rangée 44 px + zone sûre
└──────────────────────────────┘
```

- Tout ce qui se touche est dans le dernier tiers de l'écran : crans d'année, recherche, Index. La ligne haute ne porte que le nom (lien vers le portail) et la langue (`LangSwitch` de la V2 en menu).
- Fasce datée : 60 px plus la zone sûre ; éteinte : 47 px. Sous 360 px, le règne n'est écrit que dans l'état du royaume. En paysage sous 480 px de haut : masse de 10 px.
- Entre 768 et 1023 px : rangée des huit chiffres au-dessus des commandes (V2 §2.3).
- Le parti se replie en une colonne : titre du folio, puis **le profil** sur toute la largeur (28 svh, grand nombre évidé, sur le champ), puis le folio, puis ce que la colonne portait (carte fixe 40 svh avec « plein écran » en `dialog`, figure). Aucune zone à glisser au milieu d'une page qui défile.
- Cartel : feuille posée sur la fasce (62 svh, `dialog`). Index et recherche : plein écran.

### 3.3 L'Index (« Registres »)

`dialog` natif plein écran sur le champ, fermé par Échap, `action.close` et Retour. De haut en bas :
1. **Les huit volumes en dos de cuir couchés** (V1, tiroir du téléphone) : une rangée de 64 px par période, teinte `--v3-cuir-n`, chiffre en Grenze (`--or` pour la période de l'année réglée, `--ivoire` sinon), titre valyrien en Texturina et glose, années, et à droite le petit profil rouge de la période à l'échelle commune (`Profil` de la V2). Deux nerfs de 2 px plus sombres, comme sur un vrai dos. Pas de rayon, pas de cadre.
2. Les neuf registres en Texturina `--t2` avec glose.
3. Reprise de lecture (`state/storage` de la V2), à propos, langue, langue de glose.

### 3.4 Règle des trois interactions (vérifiée en revue)

| Contenu | Chemin au téléphone | Interactions |
|---|---|---|
| Une période | Registres, le dos | 2 |
| Un événement | Korjās, frapper le nom, le résultat ; ou une période puis l'événement des annales | 3 |
| Une personne, un dragon, un lieu, une guerre | Korjās, frapper, le résultat | 3 (2 si le nom est déjà dans la page : toucher le nom ouvre le cartel) |
| Un registre | Registres, le registre | 2 |
| Un mot valyrien | Korjās, frapper le mot, le résultat | 3 |
| Une année | ‹ ou ›, ou Korjās et « 129 » | 1 à 3 |
| Un parcours | Registres, apprendre, le parcours | 3 |

Sur ordinateur, chaque registre est à un clic (ligne haute), chaque période à un clic (rangée de la fasce).

### 3.5 Adresse

Celle de la V2 (`v2-spec.md` §2.6), sans changement : `an`, `voir`, `p`, `avec`, `vue`, filtres, `#<battleId>`. L'année suit le lecteur ; un lien vers un événement ou une bataille datés porte leur année. Aucune route ajoutée.

## 4. Composants : importer, envelopper, écrire

**Exception à la frontière d'ARCHITECTURE** (« une version n'importe jamais une autre ») : la V3 est une fusion, elle **peut importer** des modules de `src/versions/v1-codex/` et `src/versions/v2/`, dans un seul sens. Conditions :
1. on importe un module feuille par son chemin (`@/versions/v1-codex/components/Prose`), jamais un point d'entrée (`index.tsx`) ni un `Layout`, ni un `theme.css` ;
2. on ne modifie **jamais** un fichier de la V1 ou de la V2 pour la V3. Si un composant ne convient pas tel quel, on le copie dans `src/versions/v3/` et on l'adapte (en citant sa source en tête) ;
3. un composant de la V1 peut se poser sur les deux surfaces (il lit `--v1-texte` et consorts, que le pont redéfinit) ; un composant de la V2 ne se pose que sur le champ (il écrit `--ivoire` en dur) ;
4. la V1 et la V2 n'importent jamais la V3 ;
5. l'orchestrateur reporte cette exception dans `ARCHITECTURE.md` (Frontières).

### 4.1 Importés tels quels

| Module | Chemin | Où dans la V3 |
|---|---|---|
| Prose (paragraphes, typographie fine, variante lettrine) | `@/versions/v1-codex/components/Prose` | récit sur folio |
| Lettrine | `@/versions/v1-codex/components/Lettrine` | ouverture du folio (dorée pour une période) |
| Rubric | `@/versions/v1-codex/components/Rubric` | `h1`, `h2` sur folio |
| MarginNote, NoteRef, Passage, notesContext | `@/versions/v1-codex/components/…` | marge savante ; dépliées sous le paragraphe sous 1024 px |
| SourceList | `@/versions/v1-codex/components/SourceList` | sources en marge du folio |
| ReliabilityMark | `@/versions/v1-codex/components/ReliabilityMark` | marques sur les deux surfaces |
| Figure | `@/versions/v1-codex/components/Figure` | légende de figure sur folio |
| Folio | `@/versions/v1-codex/components/Folio` | via `common/Feuillet` (`ribbons={false}`) |
| Plate | `@/versions/v1-codex/pages/dragons/Plate` | planche annotée |
| TreeStage et ses pièces | `@/versions/v1-codex/pages/lineage/TreeStage` | arbre entier (`?vue=arbre`) |
| Kinship | `@/versions/v1-codex/pages/people/Kinship` | parenté en notation généalogique |
| Interlinear, Lesson, GrammarFrame, PhraseEntry, StatusMark | `@/versions/v1-codex/pages/language/…` | salles de la langue |
| Quiz | `@/versions/v1-codex/pages/learn/Quiz` | questionnaire sur folio |
| RegisterLine, LangSwitch | `@/versions/v2/components/…` | ligne haute |
| MasseSvg, FasceMasse, PeriodRow, YearNumeral, geometry, useYearInfo | `@/versions/v2/components/fasce/…` | `Fasce3` |
| CartelHost (Cartel, Apercu, EtatDuRoyaume) | `@/versions/v2/components/cartel/…` | cartel |
| SearchSheet | `@/versions/v2/components/SearchSheet` | recherche (chargement différé) |
| Profil, GrandNombre, Carte, Filtres, Fiabilite, Ombre, FeuHost et useFeu, Dracarys, Lien, Sommaire, sheets | `@/versions/v2/components/…` | champ |
| Annales, FigureChroniques, Reperes, CarteTel | `@/versions/v2/pages/entree/…` | groupe A |
| Pal, LienParente, LigneAnnee, ViesFascees, VieAgrandie, FragmentPal, DragonsMontes, Anneau | `@/versions/v2/pages/lignee/…` | groupe B |
| LieuxScene, QuiVole, ViesDragons, VieCavaliers, CampMark, LienFeu | `@/versions/v2/pages/registres/…` | groupe C |
| Specimen, Statut, MotAMot, Frise, BandeParcours, Refs | `@/versions/v2/pages/savoirs/…` | groupe D |
| état de l'année, cartel, liens, mémoire de session, scène, registre | `@/versions/v2/state/{year,useVoir,fasce,links,storage,entities,scene,registry}` | partout |
| présence des dragons, crans, relations, âges | `@/versions/v2/model/{presence,relations,geometry}` | partout (logique pure, déjà testée) |
| tout `@/core/*`, `@/shared/*`, `@/app` (`VLink`, `useVersionPath`, `withBase`) | | partout |

Avant d'importer une pièce d'une vue de la V2 (`pages/*/…`), vérifier qu'elle ne dépend pas d'un contexte posé par une vue de la V2 (`Page`, `Parti`) ; sinon copier et adapter.

### 4.2 Écrits pour la V3 (par le BÂTI, avant les groupes)

| Composant | Fichier | Rôle |
|---|---|---|
| `Layout` | `src/versions/v3/Layout.tsx` (+ `.module.css`) | racine `.v3`, ligne haute, champ, couche de la vue (fondu 160 ms), colophon, `Fasce3`, `CartelHost`, feuilles, `Dracarys`, `FeuHost`, `useSeuilReady` |
| `Fasce3` | `components/frame/Fasce3.tsx` | fasce datée, éteinte, au portail (§3.1, §6.1) ; lit `useFasceState` de la V2 |
| `FasceCartel3` | `components/frame/FasceCartel3.tsx` | « ‹ année › », règne, Korjās, Registres ; écrit à neuf (le cartel de la V2 dépend de sa hauteur) |
| `Index3` | `components/frame/Index3.tsx` | Index en dos de cuir (§3.3) |
| `Dos` | `components/common/Dos.tsx` | un dos de cuir couché (Index, `/chroniques`, introuvable) |
| `Feuillet` | `components/common/Feuillet.tsx` | folio : `Folio` de la V1, `data-surface="velin"`, sans signets |
| `Parti3` | `components/common/Parti3.tsx` | composition folio (1 à 8) et colonne (9 à 12) ; repli en une colonne sous 1024 px avec le profil après le titre |
| `Colonne` | `components/common/Colonne.tsx` | colonne collante (§3.1) : figure, grand nombre au pied de la figure, profil soudé |
| `Nom` | `components/common/Nom.tsx` | nom d'entité : copie adaptée de `NomEntite` (V2), soulignement `--sang` sur le champ, `--rubrique` sur le folio, couronne en `--v3-or` (qui vaut or d'encre sur vélin) ; clic simple ouvre le cartel, clic du milieu et Ctrl+clic ouvrent la fiche |
| `TitreChamp` | `components/common/TitreChamp.tsx` | `h1` sur le champ, Texturina 300, `--t4` (`--t5` seulement au portail et à l'introuvable), glose écartée de `max(--e3, 0.2em)` (correction V2 n° 11), glose identique au nom tue |
| `useVue` | `components/common/useVue.ts` | donne à la fasce la durée et l'état (`datee`, `eteinte`, `portail`) de la vue ; enveloppe `useFasce` de la V2 |
| `NotFound` | `pages/NotFoundPage.tsx` | introuvable (§6.17) |

Les groupes écrivent leurs propres pièces dans leur dossier (`pages/entree/`, `pages/lignee/`, `pages/registres/`, `pages/savoirs/`).

## 5. Typographie

- **Texturina** : titres. Sur le folio, en `--v3-rubrique` (rubrication, V1) ; sur le champ, en `--ivoire` (V2). Bas de casse, `letter-spacing` −0.02em, interlignage 0.95 à 1.05. `h1` en `--t4` partout sauf portail et introuvable (`--t5`). `--t6` jamais pour un titre.
- **Grenze Gotisch** : un seul grand nombre par vue (`--t6`, dans la colonne ou au portail), la lettrine du folio (une par folio, 4 lignes, dorée à l'ouverture d'une période, rubrique sinon), les chiffres des périodes et des dos, les numéros d'ordre des batailles et des parcours. Plus d'ordinal en Grenze collé au nom d'un roi (V2 n° 15) : « Viserys II », et le rang de souverain, s'il est dit, en toutes lettres dans la notice.
- **Alegreya** : récit, 62 à 72 signes sur ordinateur, 40 à 44 au téléphone ; interlignage 1.6 sur vélin, 1.68 sur le champ ; césure ; chiffres elzéviriens.
- **Alegreya Sans** : appareil (fasce, cartel, marges, sources, filtres, données en chiffres tabulaires).
- Liens : soulignement de 2 px décalé de 3 px ; `--rubrique` sur vélin, `--cendre` (navigation) ou `--sang` (entité) sur le champ ; survol et focus `--braise` sur le champ, `--encre` épaissi à 3 px sur vélin. Le texte ne change pas de couleur.
- Boutons : texte Alegreya Sans 500, 44 px, angles vifs ; sur vélin, aplat `--encre` texte `--velin` ; sur le champ, sans fond, souligné au survol. Aucun bouton rouge (le rouge est une donnée sur le champ, une rubrique sur le folio).
- Typographie française : toujours par `useTxTypo` / `fineTypo` de `@/core/i18n`.

## 6. Les vues

Notation : **[C]** champ, **[F]** folio. 390 = téléphone, 1440 = ordinateur. Groupe de construction entre crochets.

### 6.1 Portail `/` [A] (champ plein, puis folio)

```
1440, premier écran                                          390
┌─────────────────────────────────────────────────────────┐  ┌────────────────────┐
│ ligne des registres                                     │  │ nom          HV ▾  │
│ Targārio Lentro          Kesīr Targārio… (incipit --t2) │  │ Targārio Lentro    │
│ Vestriarja  (--t5)       glose                          │  │ Vestriarja (--t5)  │
│ glose                    Reprendre : la Danse, an 130   │  │ glose, incipit     │
│                                       130 : n dragons   │  │ 130 : n dragons    │
│     la Conquête             ▄▆█▌    153 : le dernier    │  │      ▄▆█▌          │
│ ░░░░░░░▁▂▂▃▃▄▄▅▅▆▇▇██████▌▁ dragon meurt     ▂▂ 299     │  │ ░░▁▂▃▅▇██▌▁    ▂▂  │ majesté 34 svh
│ ░░░░░░░▃▃▃▄▄▄▅▅▆▆▇▇██████▌▁                  ▂▂         │  ├────────────────────┤
│ I  II III IV       V     VI              VII VIII│‹ › …  │  │ ‹ tout le temps ›  │ rangée seule
└─────────────────────────────────────────────────────────┘  └────────────────────┘
puis, sous le premier écran : FOLIO « table des volumes »
```

- Premier écran sur le champ : à gauche le titre (`--t5`, deux lignes au plus) et sa glose ; à droite l'incipit (`--t2`) et sa glose, puis la reprise de lecture si elle existe. En bas, **la masse en majesté** (45 svh à 1440, 34 svh à 390) soudée à la rangée des périodes et au cartel de la fasce : c'est la fasce elle-même, haute.
- **Pas de double masse** : tant que la majesté est visible (`IntersectionObserver`), `Fasce3` n'affiche que sa rangée ; quand elle sort de l'écran, la masse fixe apparaît en fondu de 160 ms. Au premier départ du portail (ordinateur), « la masse se dépose » (§7, mouvement 2).
- Repères : `Reperes` de la V2, cinq sur ordinateur, deux au téléphone. **Les nombres sont calculés** (`presence.peak` et l'année du pic), jamais écrits dans la chaîne : la V2 affiche aujourd'hui « 19 dragons vivants » alors que sa spec en annonçait 15 ; la donnée fait foi.
- Sous le premier écran, un **folio** « table des volumes » (V1) : pour chaque période, chiffre gothique rubriqué, titre valyrien, glose, années, la phrase de résumé, le maximum de dragons vivants ; puis les neuf registres en Texturina `--t2` avec glose ; puis le colophon. Pas d'emblème sur le portail (il est au seuil et à propos).
- Année par défaut : aucune. Survoler la masse écrit l'année dans le cartel sans la régler ; presser la règle.

### 6.2 Chroniques `/chroniques` [A] (fascé, champ)

- 1440 : `TitreChamp`, puis la figure : rangée des règnes (aplats `--or`), rangée des guerres (aplats `--sang`), puis huit rangées de 64 px. Chaque rangée : **un `Dos` couché** dans les colonnes 1 à 3 (cuir, chiffre en Grenze, titre valyrien, glose, années), puis le profil de la période à sa place exacte sur l'échelle de la fasce (`FigureChroniques` de la V2, alignée au pixel sur la fasce). Sous la figure, la liste des périodes (titre, années, résumé, pic de dragons), une par ligne, sans cartes.
- 390 : dos de 72 px pleine largeur, profil sous le dos sur toute la largeur.
- Activer une rangée : la période, avec le feu parti de son abscisse sur la fasce.

### 6.3 Période `/chroniques/:periodId` [A] (parti : folio et colonne)

```
1440
┌──────────────────────────────────────────────┬──────────────────────────┐
│ FOLIO                                         │ COLONNE (collante)       │
│ Zaldrīzoti Lilion  (Rubric --t4)              │ carte cadrée sur les     │
│ la Danse des Dragons   105 à 153 apr. C.      │ lieux de la période,     │
│ ● 18  ◐ 8  ▭ 3   (marques)                    │ lieux de l'année braise  │
│ chapeau --t1 (visible au premier écran)       │                          │
│ 1 … 2 … 3 annales 4 questions (Sommaire)      │ V  (ou 130) --t6, posé   │
│ V̲iserys Ier désigne…  │ ¹ note de marge       │ sur le pied de la carte  │
│ (lettrine dorée)      │ sources en marge      │ ███████▅▃▁┄┄  profil     │
├──────────────────────────────────────────────┴──────────────────────────┤
│ ANNALES (champ, pleine largeur des colonnes 1 à 8, colonne toujours là) │
├─────────────────────────────────────────────────────────────────────────┤
│ fasce : 105 à 153 en sang, le reste en cramoisi                         │
```

- **Folio** : `Rubric` `h1` (`--t4`) et glose, années, marques de fiabilité et leurs comptes, chapeau, `Sommaire`, puis le récit en sections (`h2` rubriqués, lettrine dorée à la première section, `MarginNote` et `SourceList` en marge), puis les questions ouvertes, puis « volume précédent » et « volume suivant » en pied (la page se tourne, §7). Au premier écran à 1440x900 : le titre, le chapeau et le début du récit, au moins six lignes (critère d'acceptation).
- **Annales** sur le champ, sous le folio : `Annales` de la V2 (groupées par année, filtres, compte en `aria-live`, elles règlent l'année au franchissement de la ligne de lecture ; régler l'année sur la fasce fait défiler jusqu'au groupe). Noms en `Nom`.
- **Colonne** : carte de la période, grand nombre (année réglée si elle est dans la période, sinon le chiffre romain de la période, évidé dans le profil quand le profil est assez haut), profil soudé. Valyria : masse hachurée coupée au Fléau. La Chute : pas de profil, la carte seule.
- Ombre : à la première visite de la session, l'ombre du dragon qui compte le plus passe sur le rouge.
- 390 : titre du folio, profil 28 svh avec le nombre évidé, folio (notes dépliables), carte fixe en tête des annales (40 svh, « plein écran »), annales.
- Reprise de lecture : dernière section atteinte, par période.

### 6.4 Événement `/chroniques/:periodId/:eventId` [A] (parti)

Folio : l'année en Texturina `--t3` (« date inconnue » sinon) au-dessus du `h1` rubriqué, période (lien), résumé, « ce que cela change », note de date ; en marge savante, les personnes, dragons et lieux (`Nom`), la fiabilité et sa note, la continuité (livres ou adaptation), les sources ; en pied, précédent et suivant dans le fil de toute la chronique, avec leur année. Colonne : carte cadrée sur les lieux de l'événement, grand nombre = son année, profil de sa période, encoche sur l'année. Ouvrir un événement règle l'année. Feu seulement si « suivant » change de période. 390 : comme 6.3.

### 6.5 Lignée `/lignee` [B] (pal, champ)

```
1440, premier écran
┌──────────────────────────────────────────────────────────────────────────────┐
│ Zaldrīzo Ānogar (--t4) et glose        │ LE LIEN : [Rhaenyra] et [Aegon II]  │
│ 176 personnes, 21 générations          │ « oncle et nièce, et époux »         │
│ l'arbre entier                         │ chemin en braise                     │
│   9  █  Jaehaerys Ier ♔   48 à 103                                           │
│  10  █  Baelon                                                               │
│  11  Alicent ──█── Viserys Ier ♔ ── Aemma        en 129 : mort               │
│  12  █  [ Rhaenyra ♔, 32 ans ] ◯═══ Daemon                                   │
│        Jacaerys Lucerys Joffrey Aegon III Viserys II                         │
│  en 129 : n vivants connus, n cavaliers                                      │
```

- Le pal de la V2 (`Pal`, `LigneAnnee`, `LienParente`, `Anneau`) : bande `--sang` de 12 px tirée des données, colonne des générations numérotée à gauche **avec un retrait qui ne touche aucun nom** (V1 n° 15), centre `?p=` (par défaut le souverain de l'année réglée, sinon Aegon Ier), âges à l'année, unions consanguines en anneau, lien de parenté en colonnes 9 à 12.
- **Premier écran à 1440** : titre en `--t4` sur une ligne, et le bloc du centre (parents, centre, conjoints, enfants) visible sans défiler : la vue s'ouvre **défilée sur le centre** quand `?p=` est donné, en haut sinon, et le titre est court (corrige le premier écran vide de la V2). Garder la correction StrictMode de la V2.
- Couronne : lisible (V2 n° 16). Le groupe B ajoute à `CrownGlyph` de `@/shared/marks` une variante rétrocompatible (`variant="legible"`, trois pointes distinctes sur un bandeau, 16 px au moins), sans changer le rendu par défaut ; la V3 l'emploie partout.
- Plus d'ordinal en Grenze après le nom (V2 n° 15).
- **L'arbre entier** (`?vue=arbre`) : `TreeStage` de la V1 sur un **folio pleine largeur** (rouleau à l'encre) : filiations à l'encre, lignée régnante en rubrique, boucles du sang, souverains sans médaillon d'or (correction V1 n° 1 conservée). Choisir une personne revient au pal centré sur elle. 390 : plein écran en `dialog`.
- 390 : pal à 28 px du bord, lien sous le bloc.
- Équivalent accessible : liste titrée du centre ; dessins `aria-hidden`.

### 6.6 Personnages `/personnages` [B] (fascé, champ)

`ViesFascees` de la V2 : une rangée par personne, nom (`Nom`), épithète, années, couronne ; ligne de vie à l'échelle de la fasce, règne en aplat `--or` ; entaille de l'année réglée à travers toutes les lignes. Tri : par naissance (défaut) ou alphabétique (l'index savant de la V1, `?tri=nom`) ; groupes par période, `Rail` de saut ; « sans date » à la fin. Filtres : rois et reines, prétendants, cavaliers, bâtards, maison. Aucun trait de rappel ne traverse une étiquette (V1 n° 16). 390 : nom et années sur une ligne, vie dessous pleine largeur.

### 6.7 Fiche `/personnages/:personId` [B] (parti)

Folio : `Rubric` (nom, épithète), titres portés, `lead`, **parenté en notation généalogique** (`Kinship` de la V1), biographie en sections (lettrine rubrique, marge savante, sources en marge), ce que les sources ne tranchent pas, puis **ce que l'adaptation change** dans un bloc distinct en `--velin-ombre`, ouvert par la marque de continuité. Sans biographie : la note, la parenté, les événements où la personne paraît. Colonne : `VieAgrandie` (naissance, règne en or, mort, encoches), `FragmentPal` (lien « voir dans la lignée »), `DragonsMontes` ; grand nombre : aucun pour une personne qui n'a pas régné. Fasce : la vie en sang.

### 6.8 Dragons `/dragons` [C] (fascé, champ)

En tête, `QuiVole` de la V2 (échelle commune des dragons vivants à l'année réglée, ou de tous, figure humaine, graduations `--bronze`) ; puis `ViesDragons` (une rangée par dragon, petite silhouette, `Nom`, alias, vie en plein puis hachure, cavaliers en segments) ; groupes par époque ; « non datés » à la fin. Légendes : dire ce que la figure montre, jamais comment le site est construit (V2 n° 21).

### 6.9 Planche `/dragons/:dragonId` [C] (parti)

```
1440, premier écran
┌─────────────────────────────────────────────────┬──────────────────────────┐
│ FOLIO                                            │ COLONNE                  │
│ Balerion (Rubric --t4)  la Terreur noire         │ à l'échelle : ce dragon, │
│ 114 av. C. à 94 apr. C.  ● établi                │ le fantôme du précédent  │
│     (planche annotée : silhouette entière,       │ (pointillé cendre), la   │
│      couleurs 1 à 4, décrite / non décrite)      │ figure humaine           │
│                                    voir voler    │ ▂▃▅██  vie, cavaliers    │
```

- Folio : `Plate` de la V1 (silhouette **entière** au premier écran, appels numérotés, couleurs « décrite » ou « non décrite par les livres », « voir voler » : un cycle d'ailes). Sous le premier écran : apparence, origine, batailles (`Nom`, avec le sort du dragon), sort, note d'adaptation, sources en marge.
- Colonne : **l'échelle comparée** (`DragonScale` de `@/shared/dragon` : ce dragon, le fantôme du dragon vu juste avant dans la session, la figure humaine ; contour pointillé et légende si la taille n'est pas décrite), puis les cavaliers sur la vie (`VieCavaliers`), puis la suite des lieux où il paraît, numérotés sur une petite carte, avec la légende « lieux où il paraît » (jamais un vol). Grand nombre : aucun.
- Ombre : ce dragon passe sur le rouge, une fois par session.
- 390 : planche sur folio pleine largeur, puis l'échelle sur le champ (le dragon tête en haut, à la mesure de la V2 : Balerion 2,4 hauteurs d'écran), puis le texte.

### 6.10 Guerres `/guerres` [C] (fascé, champ)

Une rangée par conflit : titre valyrien et glose, années, les deux camps et leur marque (`CampMark`), nombre de batailles, dragons perdus ; à droite la durée sur l'échelle de la fasce (au moins 6 px). Groupes par période.

### 6.11 Guerre `/guerres/:warId` [C] (parti)

Folio : `Rubric`, années, les deux camps face à face (marque pleine `--encre` pour les Noirs, `--v3-vert` pour les Verts, neutre sinon), causes, **les batailles dans l'ordre** (numéro d'ordre en Grenze rubrique dans la colonne suspendue, année, `h3` ancré `#<battleId>`, lieu ou « lieu inconnu », vainqueur, dragons engagés et leur sort, récit, pertes, fiabilité), conséquences, sources en marge. Colonne : carte où chaque bataille située porte son numéro, « bataille précédente » et « bataille suivante » sous la carte (recadre, fait défiler le folio jusqu'à la bataille, règle l'année, `replace` de l'ancre ; jamais de lecture automatique), le grand nombre (année de la bataille courante) **au pied de la carte**, le profil de la guerre. 390 : carte fixe en tête (40 svh, numéros, plein écran), puis le folio ; précédente et suivante en pied de chaque bataille.

### 6.12 Lieux `/lieux` et `/lieux/:placeId` [C] (champ plein, carte persistante)

`LieuxScene` de la V2, avec ses corrections (cadre par défaut sur la baie de la Néra avec Valyria au bord ; carte qui commence au bord de la colonne ; nom du lieu choisi en ivoire). Les deux routes sont filles d'un même parent qui porte la carte : elle se recadre, elle ne se remonte pas. Colonne gauche (réserve d'obsidienne) : titre, lieux de l'année, tous les lieux par région, filtres par genre ; sur un lieu, la notice (nom valyrien et glose, genre, région, description, rôle, événements et batailles avec leurs années) ; les années du lieu sont des encoches sur la fasce.
- Signes de la carte à 44 px de zone de pression (V2 n° 17) : le groupe C ajoute à `WorldMap` (`@/shared/map`) une option rétrocompatible `hit?: number` (défaut inchangé, 22), la V3 passe 44 ; et corrige l'étiquette écrite deux fois à 390 (« baie de la Néra ») si elle vient de `labels.ts`.
- 390 : carte fixe 55 svh, sans geste, « plein écran » ; puis liste ou notice.

### 6.13 Langue `/langue` [D] (parti, fasce éteinte)

Folio : ce qu'est le haut valyrien, d'où vient ce qu'on en sait (Peterson), ce que le site s'interdit, les statuts et leurs marques (`StatusMark`), puis les trois salles avec leur compte. Colonne : la figure est une glose, « Valar morghūlis » en Texturina `--t5`, mot à mot (`Interlinear` de la V1, sur le champ), statut et note.

### 6.14 Lexique `/langue/lexique` [D] (parti, fasce éteinte)

Folio : `h1` rubriqué de même corps que les autres registres (V1 n° 17), une phrase, puis **la table dès le premier écran** : forme en Texturina `--t1`, sens, nature, marque de statut, thème ; recherche tolérante aux macrons (`normalize`), filtres par thème et statut, `Rail` alphabétique. Colonne : `Specimen` de la V2 (le mot survolé ou choisi en `--t5`, glose, statut, note, références), et dessous, en petit, le décompte des 322 formes par statut (`LexiconTally` de la V1 si elle se lit sur le champ, sinon une phrase). 390 : toucher un mot déplie sa note et son spécimen sous la rangée.

### 6.15 Grammaire et expressions [D] (parti, fasce éteinte)

Grammaire : leçons numérotées (`Lesson`, `GrammarFrame` de la V1) sur folio, tableaux à l'encre sans filet vertical ni cadre ; colonne : sommaire des leçons. Expressions : formule en Texturina `--t2`, mot à mot en glose interlinéaire, sens, contexte, références (`PhraseEntry`) ; colonne : index des formules, liens soulignés. Titres : forme valyrienne seulement si elle existe dans le contenu (V2 n° 22) ; sinon le titre dans la langue d'appui, même corps que les autres salles, sans forme inventée. Le groupe D signale au linguiste les clés sans `hv`.

### 6.16 Sources `/sources` [D] (parti, fasce éteinte)

Folio : registre des ouvrages par nature, note de fiabilité de chacun, séparation livres et adaptation expliquée, ancres `#<sourceId>`. Colonne : l'échelle des cinq marques (`@/shared/marks`, 48 px), libellé et définition.

### 6.17 Apprendre `/apprendre` [D] (fascé) et `/apprendre/:pathId` [D] (parti)

Liste : cinq parcours numérotés en Grenze, titre, durée de lecture, et la durée historique couverte sur l'échelle de la fasce (`BandeParcours`). Parcours : folio avec introduction, sommaire de toutes les étapes, étapes (texte, liens `Nom` ou vers les vues, « à retenir »), puis le questionnaire (`Quiz` de la V1 : une question à la fois, réponse expliquée et sourcée, bilan avec les erreurs, progression en local) ; colonne : profil de la période de l'étape en cours, position dans le questionnaire. Aucune médaille, aucun score mis en scène.

### 6.18 À propos `/a-propos` [D] (folio, fasce éteinte)

Folio pleine largeur des colonnes 1 à 8 : pourquoi cette bibliothèque, comment elle est faite (polices et licences, figures dessinées par le code, ce que compte la fasce et ce qu'elle ne compte pas), ce qu'elle doit à George R. R. Martin et à David J. Peterson, mention non officielle. Colonne : l'emblème en `--sang` sur le champ et le poinçon JD (`#poincon`, cible de « dracarys »). 390 : le `h1` d'abord, l'emblème après (V2 n° 20).

### 6.19 Introuvable `*` [D] (champ plein, fasce éteinte)

« Kesir ilos daor. » (`phrase.not_found`) en `--t5` et sa glose, `error.notFound.body`, retour au portail, « Registres ». Figure : la fasce en majesté à 30 svh, toute en cramoisi, sans encoche ; dessous, les huit `Dos` couchés. Garder `data-ecran="introuvable"`.

## 7. Mouvement

GSAP par `@/core/motion` uniquement, `useGSAP` avec `scope`, `gsap.matchMedia()` et les conditions de mouvement réduit. `expo.out` et `power4.out` (et `power3.inOut` pour la page qui tourne, reprise de la V1). On n'anime que `transform`, `opacity`, `clip-path`, uniformes de shader. Rien n'apparaît au défilement.

| # | Mouvement | Raison | Technique | Mouvement réduit |
|---|---|---|---|---|
| 1 | Seuil | entrer dans le lieu | `@/shared/seuil`, une fois par session | celui du seuil |
| 2 | La masse se dépose | la navigation est l'histoire | au premier départ du portail (ordinateur), la majesté s'écrase en `scaleY` jusqu'à la fasce, 700 ms | posée |
| 3 | Le temps se règle | tout dépend de l'année | encoche par `gsap.quickTo` (280 ms), chiffres qui roulent (240 ms), un rendu par année entière | l'année saute |
| 4 | Le feu part de la fasce | changer de moment de l'histoire depuis le champ | `useFeu().passer(to, year)` : rangée des périodes, chroniques, entrée dans une guerre depuis une autre vue | voile de 150 ms |
| 5 | La page se tourne | feuilleter le livre | seulement par « volume précédent » et « volume suivant » en pied du folio : `PageTurn` de la V1 (620 ms) autour de la reliure gauche du folio, la colonne et la fasce ne bougent pas | fondu de 150 ms |
| 6 | L'ombre passe sur le rouge | le dragon couvre la couleur de la Maison | `Ombre` de la V2, une fois par page et par session (période, planche) ; jamais sur le vélin | pas d'ombre |
| 7 | La lignée se déploie | la filiation | pal : mouvement 5 de la V2 ; arbre entier : retracé des fils de la V1 (500 ms) | tout tracé |
| 8 | Gestes | ouvrir, fermer, filtrer | cartel 280 ms ; Index, recherche, couche de la vue 160 ms ; recadrage de carte 700 ms | fondus de 150 ms |
| 9 | « dracarys » | le détail caché | le feu part du pointeur et révèle `/a-propos#poincon`, une fois par session | voile de 150 ms |

Une navigation joue au plus un des mouvements 4 et 5. Retirés : l'ouverture longue de la V1, le tracé de la courbe, toute animation permanente.

## 8. Accessibilité

- Un seul `h1` par vue (sur le folio dans un parti), un seul `main` (la couche de la vue) ; le folio est un `article`, la colonne un `aside` étiqueté ; la fasce dans un `footer` étiqueté.
- La masse est un `role="slider"` complet (V2 §2.2) ; crans « ‹ » « › » de 44 px comme alternative en simple pointage (WCAG 2.5.7) ; rangée des périodes et Index en listes de liens.
- Annonce polie de l'année réglée, au plus toutes les 500 ms.
- Notes de marge : boutons `aria-expanded`, la note se déplie sous le paragraphe sous 1024 px, pas de fenêtre modale.
- Cartel : volet sans piège de focus sur ordinateur, `dialog` modal au téléphone, focus rendu au nom.
- Cibles de 44 px partout, y compris les signes de la carte (option `hit`), les noms du pal, les mots du spécimen au téléphone (V2 n° 19 : élargir la zone en `::after`).
- Contour de focus 2 px décalé de 3 px : `--braise` sur le champ, `--rubrique` sur le vélin.
- Jamais la couleur seule (durée doublée d'un trait ivoire, hachure, marques dessinées, camps de formes différentes).
- `lang="art-x-valyrian"` sur tout valyrien, SVG compris.

## 9. Performance

- Aucun WebGL permanent : `BurnTransition` monté une fois, un pixel au repos, densité plafonnée à 1,5.
- La V3 est un bloc à la demande ; chaque vue aussi ; recherche, arbre entier, carte : chargés avec leur vue ou à la première ouverture. Importer des modules feuilles de la V1 et de la V2 ne tire que ces modules : interdiction d'importer un `index.tsx`, un `Layout` ou un module qui les importe.
- Fasce : un tracé mémorisé, motif de hachure SVG, réglage par transformation et opacités.
- Carte : recadrage au plus une fois par geste, jamais au défilement.
- Budgets (Chrome, processeur ralenti quatre fois) : LCP du portail sous 2,5 s ; INP sous 200 ms pendant qu'on tire la fasce ; aucune tâche de plus de 50 ms pendant un réglage d'année ; bloc JavaScript propre à la V3 sous 140 Ko compressés, hors GSAP, hors données, hors modules partagés avec la V1 et la V2.

## 10. Écriture

Aucune chaîne en dur. Clés nouvelles en `v3.<vue>.<nom>`, dans `content/interface/ui.v3-bati.json` (bâti), `ui.v3-entree.json` (A), `ui.v3-lignee.json` (B), `ui.v3-registres.json` (C), `ui.v3-savoirs.json` (D), enveloppe `{ "schema": 1, "generatedBy": "…", "items": [ { "key", "fr", "en" } ] }`, puis `node scripts/serial.mjs node scripts/build-content.mjs`. Réutiliser d'abord les clés communes (`nav.*`, `action.*`, `label.*`, `phrase.*`, `error.*`, `a11y.*`) et celles des composants importés (`v1.*`, `v2.*`, qui restent valides). Aucun valyrien inventé. Phrases courtes, pas de point d'exclamation, pas de tiret cadratin, pas de flèche, guillemets « » en français et “ ” en anglais, aucune phrase sur le procédé hors du colophon, aucune légende qui décrit la mécanique du site.

## 11. Découpage de la construction

Ordre : **BÂTI d'abord** (seul), puis les quatre groupes en parallèle (trois agents de front au plus, règle de la machine), puis la revue. Aucun agent ne lance `git`. Commandes lourdes par `node scripts/serial.mjs`. Captures dans `tests/visual/out/v3/<groupe>/`, regardées.

### BÂTI (cadre, navigation, routes)

- Fichiers : `src/versions/v3/{index.tsx, Layout.tsx, Layout.module.css, theme.css, README.md}`, `src/versions/v3/components/{frame,common}/**`, une page provisoire par route (`src/versions/v3/pages/<Nom>Page.tsx`, exports par défaut, que les groupes remplacent), `content/interface/ui.v3-bati.json`, `src/app/routes.tsx` (`'version-3': lazy(() => import('@/versions/v3'))`).
- Livre : thème et pont (§2.2), `Layout`, `Fasce3` (trois états), `FasceCartel3`, `Index3`, `Dos`, `Feuillet`, `Parti3`, `Colonne`, `Nom`, `TitreChamp`, `useVue`, page introuvable de secours, le plan complet des routes d'ARCHITECTURE (même structure que `src/versions/v2/index.tsx`, avec un parent commun pour `lieux` et `lieux/:placeId`).
- Contrôle : une page de démonstration provisoire qui pose un parti (folio et colonne) sur `/chroniques/p5` ; captures 390x844, 1280x800, 1440x900 ; aucune colonne sous la fasce à l'arrivée ; fasce datée et éteinte ; Index ; recherche ; cartel ; `tsc` à 0.
- `DEFAULT_VERSION` ne passe à `'version-3'` qu'après la revue finale (décision de l'orchestrateur).

### Groupe A : portail, chroniques, période, événement

- Fichiers : `pages/{PortalPage,ChroniclesPage,PeriodPage,EventPage}.tsx` et leurs CSS, `pages/entree/**`, `content/interface/ui.v3-entree.json`.
- Critères : pas de double masse au portail à 390 ; repères calculés ; table des volumes sur folio ; période V à 1440x900 avec titre, chapeau et six lignes de récit au premier écran ; annales qui règlent l'année ; feu et page qui tourne chacun sur son déclencheur ; Valyria et la Chute justes.

### Groupe B : lignée, personnages, fiche

- Fichiers : `pages/{LineagePage,PeoplePage,PersonPage}.tsx` et CSS, `pages/lignee/**`, `content/interface/ui.v3-lignee.json`, et la variante `legible` de `CrownGlyph` dans `src/shared/marks/Marks.tsx` (rétrocompatible : la V1 et la V2 ne changent pas).
- Critères : centre et lien au premier écran à 1440 ; épreuve des rangées Viserys Ier, Rhaenyra, Viserys II à 360 px ; générations sans chevauchement ; pas d'ordinal en Grenze collé au nom ; couronne reconnaissable ; arbre entier sur rouleau de vélin.

### Groupe C : dragons, planche, guerres, guerre, lieux, lieu

- Fichiers : `pages/{DragonsPage,DragonPage,WarsPage,WarPage,PlacesPage,PlacePage}.tsx` et CSS, `pages/registres/**`, `content/interface/ui.v3-registres.json`, et l'option `hit` de `WorldMap` dans `src/shared/map/` (rétrocompatible).
- Critères : planche entière au premier écran ; échelle et fantôme dans la colonne ; grand nombre de la guerre jamais coupé à l'arrivée ; rejouer ; carte persistante entre les lieux ; signes à 44 px ; aucune étiquette en double.

### Groupe D : langue, lexique, grammaire, expressions, sources, apprendre, parcours, à propos, introuvable

- Fichiers : `pages/{LanguagePage,LexiconPage,GrammarPage,PhrasesPage,SourcesPage,LearnPage,PathPage,AboutPage,NotFoundPage}.tsx` et CSS, `pages/savoirs/**`, `content/interface/ui.v3-savoirs.json`.
- Critères : des mots au premier écran du lexique ; fasce éteinte (47 px) sur les vues sans temps ; titres des salles de même corps ; questionnaire sur folio ; `h1` avant l'emblème au téléphone ; introuvable avec `data-ecran="introuvable"`.

### Revue (après les quatre groupes)

Interdits de DESIGN §0 dans le code et sur capture ; règle des surfaces (§2.1) ; aucune vue sans figure ; aucun rouge sur le champ qui ne soit une donnée ; règle des trois interactions (§3.4) ; liens (`tests/functional/links.mjs`, qui doit ignorer `an`, `voir` et les filtres dans sa clé de visite, sinon il tourne sans fin comme sur la V2) ; contrastes ; mouvement réduit ; anglais ; `tsc` ; budgets du §9 ; la V1 et la V2 toujours intactes à 390 et 1440.
