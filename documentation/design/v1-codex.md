# Version 1 : « Le Codex » — spécification de réalisation

Complète `DESIGN.md` (qui fait autorité sur couleurs, typographie, interdits, mouvement). Code dans `src/versions/v1-codex/`. Classe racine `.v1`.

## 1. L'idée

Une table de basalte, la nuit. Dessus, une chronique en huit volumes. À gauche de l'écran, les huit dos des volumes, debout. Au milieu, la feuille de vélin qu'on est en train de lire. En haut de la feuille dépassent des signets de tissu rouge : les registres. Rien d'autre.

Ce qui rend la version reconnaissable : (1) les dos de volumes comme navigation ; (2) la rubrication, c'est-à-dire le rouge d'encre pour tout ce qui titre ou ouvre ; (3) la marge savante ; (4) les lettrines gothiques ; (5) des figures tracées à l'encre (dragon en gravure, carte gravée, courbes) ; (6) la page qui se tourne.

## 2. Bâti (ordinateur, ≥ 1024 px)

```
 ┌────────────────────────────────────────────────────────────────────────────┐
 │ ◈ Targārio Lentro Vestriarja                    [ Korjās… ]   HV  FR  EN   │ barre haute, 56 px, sur obsidienne, sans filet
 ├──┬──┬──┬──┬──┬──┬──┬──┬────────────────────────────────────────────────────┤
 │I │II│II│IV│V │VI│VI│VI│   ┃signet┃signet┃signet┃signet┃signet┃signet┃      │ signets rouges, dépassent de 14 px
 │  │  │I │  │  │  │I │II│  ╔══════════════════════════════════════════════╗  │
 │t │t │  │t │t │t │  │  │  ║  FOLIO (vélin)                               ║  │
 │i │i │t │i │i │i │t │t │  ║  récit : 7 col.            marge : 3 col.    ║  │
 │t │t │i │t │t │t │i │i │  ║                                              ║  │
 │r │r │t │r │r │r │t │t │  ║                                              ║  │
 │e │e │r │e │e │e │r │r │  ╚══════════════════════════════════════════════╝  │
 └──┴──┴──┴──┴──┴──┴──┴──┴────────────────────────────────────────────────────┘
   8 dos de 40 px (320 px), fixes ; le folio défile seul
```

- **Table** (`Table.tsx`) : fond `--obsidienne` avec un grain de pierre statique (SVG `feTurbulence` rendu une fois en image de fond, ou `ShaderCanvas` basalte figé) et une lumière chaude très faible venant d'en bas à gauche (un seul `radial-gradient` large, `--cramoisi` à 18 % d'opacité). Pas d'animation permanente.
- **Dos de volumes** (`Spines.tsx`) : `nav` fixe à gauche. Chaque dos est un lien de 40 px de large sur toute la hauteur, d'une teinte de cuir différente tirée de la palette (du `--cramoisi` au `--suie`, en passant par un brun `oklch(0.26 0.04 45)`), avec en tête le chiffre du volume en Grenze Gotisch (`--or` pour le volume ouvert, `--ivoire` sinon), puis le titre valyrien écrit verticalement (`writing-mode: vertical-rl`, Texturina 500, `--t0`), et en pied les années. Deux nerfs de reliure : deux traits horizontaux de 2 px plus sombres, à hauteur fixe, qui existent sur un vrai dos. Au survol ou au focus : le dos avance de 6 px (`translateX`), et une étiquette de marge donne la glose (« La Danse des Dragons, 129 à 131 »). Le dos du volume ouvert est tiré de 12 px et passe en `--sang`. Largeur < 1280 : dos de 32 px, titre masqué sauf volume ouvert.
- **Signets** (`Ribbons.tsx`) : `nav` des registres en haut du folio : rubans `--sang` de 30 px de large à extrémité en queue d'aronde (`clip-path`), libellé valyrien vertical lisible une fois le ruban tiré ; au repos on ne voit que 14 px et l'initiale. Survol ou focus : le ruban descend (`translateY`) et montre libellé + glose. Sept signets : lignée, personnages, dragons, guerres, lieux, langue, apprendre. Sources et à-propos sont dans le pied du folio (colophon).
- **Folio** (`Folio.tsx`) : `main`, largeur max 1180 px, fond `--velin`, bords très légèrement irréguliers (`clip-path: polygon(...)` à 24 points, écart ≤ 3 px), ombre portée courte et dure vers le bas à droite (pas de flou large), marge intérieure `clamp(2rem, 5vw, 5rem)`. Grille interne 10 colonnes : récit 7, marge 3. En bas : foliotation en toutes lettres (« volume II, feuillet 14 ») en Alegreya Sans, `--encre-pale`.
- **Barre haute** (`TopBar.tsx`) : emblème 28 px + nom du site en Texturina (bas de casse) à gauche ; à droite le déclencheur de recherche (ressemble à un champ, ouvre le panneau), le choix de langue (trois boutons texte, l'actif souligné épais `--braise`), et en mode `hv` le choix de la langue de glose.

### Téléphone et tablette (< 1024 px)

- Plus de dos à gauche. Une **étagère** (`Shelf.tsx`) fixe en bas : une barre de 56 px avec quatre entrées (volumes, registres, chercher, langue). « Volumes » ouvre un tiroir plein écran où les huit dos sont couchés à l'horizontale, empilés (chacun 64 px de haut : chiffre, titre valyrien, glose, années). « Registres » ouvre la liste des signets. Tiroirs : `dialog` natif, fermeture par Échap et par un bouton.
- Le folio occupe toute la largeur, marge intérieure 1.25rem, pas de bords irréguliers (un simple pli d'ombre en haut).
- La marge savante devient des appels de note : un chiffre en exposant ouvre la note sous le paragraphe (bouton `aria-expanded`), sans fenêtre modale.

## 3. Composants communs de la version (dossier `components/`)

| Composant | Rôle |
|---|---|
| `Table`, `Spines`, `Ribbons`, `Folio`, `TopBar`, `Shelf`, `Colophon` | bâti |
| `Rubric` | titre rubriqué : `h1`/`h2` en Texturina `--rubrique`, avec glose interlinéaire |
| `Lettrine` | première lettre d'un paragraphe en Grenze Gotisch sur 4 lignes (`initial-letter` avec repli `float`), `--rubrique` ; variante `gilded` (or sombre sur vélin : `oklch(0.52 0.10 75)`) pour l'ouverture d'un volume |
| `Prose` | rend un `Localized` en paragraphes (séparés par ligne vide), longueur de ligne bornée, césure activée |
| `MarginNote`, `NoteRef` | note de marge reliée à son appel ; en étroit, se déplie sous le paragraphe |
| `SourceList` | sources d'un élément : sigle de l'ouvrage, titre en italique, emplacement ; lien vers `/sources#id` |
| `ReliabilityMark` | marque dessinée + libellé du niveau de fiabilité (vient de `src/shared/marks`) |
| `YearRule` | règle du temps horizontale à l'encre (graduations, périodes), réutilisée par chroniques, guerres, fiches |
| `Figure` | cadre de figure : la figure, puis une légende en Alegreya Sans ; numéro (« Fig. 3 ») seulement si la page compte plusieurs figures |
| `EntityLink` | lien vers personne, dragon, lieu, événement ; affiche le nom, et pour un roi la petite couronne |
| `FilterBar` | filtres en ligne (boutons bascule texte, pas de pastilles arrondies), compteur de résultats en `aria-live` |
| `SearchPanel` | recherche globale : panneau qui descend de la barre haute, résultats groupés par genre, navigation au clavier |
| `LangSwitch`, `SupportSwitch` | langues |
| `PageTurn` | transition de volume |
| `EmptyState`, `NotFound` | états vides et page introuvable (« Kesir ilos daor. ») |

Boutons : texte en Alegreya Sans 500, fond `--encre` sur vélin (ou `--sang` pour l'action principale d'une page), angles vifs, 44 px de haut, pas d'icône sauf nécessité. Liens dans le récit : soulignement de 2 px `--rubrique` décalé de 3 px, sans changement de couleur du texte.

## 4. Les vues

### Portail `/`
```
 dos │  Targārio                                            (emblème, 46vh,
     │  Lentro                                               rouge, coupé par le
     │  Vestriarja            ← --t6, 3 lignes, ivoire       bord droit du cadre)
     │  Les Chroniques de la Maison Targaryen   ← glose
     │
     │  Kesīr Targārio Lentro vestriarzir ilza…  ← incipit valyrien, --t2
     │  Ici se trouve l'histoire…                ← glose
     │  [ Ouvrir le premier volume ]
     ├───────────────────────────────────────────────────────────────
     │  FOLIO : « Dragons vivants, de 114 av. C. à 300 apr. C. »
     │  (courbe à l'encre pleine largeur, annotée : la Conquête, la Danse, 153, 298)
     │  puis les huit volumes en table des matières (chiffre gothique, titre valyrien,
     │  glose, années, une phrase), puis les registres, puis le colophon.
```
Le haut du portail est sur la table (sombre), pas sur vélin : c'est la seule page dont le premier écran est sombre. Aucun bouton « en savoir plus », aucun chiffre-clé décoratif. La courbe des dragons vivants est la pièce maîtresse : elle raconte toute l'histoire en une figure.

Ouverture (une fois par session, après le seuil) : la pierre monte du noir (opacité), une lueur rouge traverse de gauche à droite (un dégradé qui se déplace, 900 ms), l'ombre d'un dragon passe (`DragonShadow`), l'emblème se trace (`DrawSVG`), le titre s'inscrit ligne par ligne (masque `clip-path`, pas de fondu), les dos de volumes se lèvent un à un depuis le bas (40 ms d'écart). Durée totale ≤ 3,2 s, passable par clic ou touche.

### Chroniques `/chroniques`
Table des huit volumes sur un grand ruban du temps (échelle de `core/timeline/scale`) : les périodes en bandes, les règnes en ruban au-dessous, la courbe des dragons au-dessus. Sous la figure, la liste des volumes (un par ligne, pas de cartes).

### Volume `/chroniques/:periodId`
En-tête : chiffre gothique géant (`--t6`, `--rubrique`) à gauche, titre valyrien + glose + années à droite du chiffre. Puis le résumé en chapeau (`--t1`), puis le récit long en sections (`h2` rubriqués, première section avec lettrine dorée), sources en marge. Puis « Annales » : les événements dans l'ordre, année en colonne de marge gauche suspendue (rouge), titre, résumé, « ce que cela change », marque de fiabilité ; filtres (personne, dragon, fiabilité, texte). Puis les questions ouvertes. Puis lien vers le volume suivant et le précédent.

### Événement `/chroniques/:periodId/:eventId`
Date en très grand, titre, récit, conséquence, personnes, dragons et lieux en marge (liens), fiabilité et note, sources, précédent et suivant.

### Lignée `/lignee`
Pleine largeur (le folio s'élargit à toute la zone, c'est un rouleau). L'arbre complet (`layoutTree`) tracé à l'encre : filiations en traits `--encre`, lignée régnante en `--rubrique` épais, unions en petits nœuds, unions consanguines fermées en boucle visible, rois marqués d'une couronne. Déplacement au glisser, zoom molette et pincement, boutons + / − / recentrer. Recherche d'une personne (liste déroulante accessible). Clic sur une personne : un volet latéral (pas une modale) avec parents, unions, enfants, fratrie, lien vers la fiche. `?p=<id>` centre l'arbre. Sous 768 px : le fil vertical (`layoutThread`), conjoints et enfants en éventail.
Animation : quand on centre une personne, les fils qui la relient à ses parents et à ses enfants se retracent (`DrawSVG`, 500 ms).

### Personnages `/personnages`
Un index, comme à la fin d'un livre savant : colonnes de noms classés (alphabétique par défaut, ou par génération, ou par maison), chaque ligne : nom, épithète en italique, années, couronne si roi, point plein si une biographie rédigée existe. Filtres : rois, reines et prétendants, cavaliers de dragon, bâtards, maison. En tête : le ruban des dix-sept règnes.

### Fiche `/personnages/:personId`
Initiale du nom en Grenze Gotisch géante (`--t6`), nom, épithète, titres. Ligne de vie (naissance, règne en or, mort) sur une règle du temps avec les événements où la personne paraît. Parenté écrite en notation généalogique (père, mère, unions, enfants) avec liens. Biographie en sections. Dragons montés (petite figure du dragon en gravure). Ce que les sources ne tranchent pas. Ce que l'adaptation change (bloc distinct, étiqueté). Sources en marge. Sans biographie rédigée : notice courte + parenté + événements.

### Dragons `/dragons` et planche `/dragons/:dragonId`
Registre : en tête, l'échelle comparée (`DragonScale`) des dragons triés par envergure ; puis la liste par époque (petite figure, nom, alias, cavaliers, années, sort en quelques mots). Planche : grande figure en gravure sur vélin, annotée (envergure relative, couleurs avec mention « décrite » ou « non décrite par les livres »), cavaliers sur une règle du temps, origine, batailles, sort, note d'adaptation, sources. Bouton discret « voir voler » : la figure bat des ailes (un cycle).

### Guerres `/guerres` et `/guerres/:warId`
Liste : les conflits sur la règle du temps (barres de durée), puis un par ligne. Conflit : les camps face à face (deux colonnes, teinte attestée : noirs, verts), causes, batailles dans l'ordre (année en marge, lieu lié, vainqueur, dragons engagés et leur sort, récit), carte de situation des batailles, conséquences, sources.

### Lieux `/lieux` et `/lieux/:placeId`
La carte gravée pleine largeur sur vélin (côtes à l'encre, hachures de mer, noms en Texturina italique), lieux cliquables, liste à côté (ou dessous en étroit), filtres par genre. Lieu : carte recadrée sur le lieu, description, rôle, événements et batailles qui s'y tiennent.

### Langue `/langue`, `/langue/lexique`, `/langue/grammaire`, `/langue/expressions`
Accueil : ce qu'est le haut valyrien, d'où il vient (Peterson), ce que le site s'interdit (aucune écriture inventée), comment lire les statuts. Lexique : table filtrable par thème et par statut, recherche tolérante aux macrons, chaque mot ouvre sa note. Grammaire : leçons avec tableaux de déclinaison. Expressions : formule, mot à mot, sens, contexte.

### Sources `/sources`
Registre des ouvrages par nature, note de fiabilité de chacun, les cinq niveaux de fiabilité avec leurs marques, la séparation livres / adaptation expliquée.

### Apprendre `/apprendre` et `/apprendre/:pathId`
Cinq parcours (numérotés, c'est une vraie suite). Parcours : étapes dans l'ordre, « à retenir », liens vers les salles ; puis le questionnaire : une question à la fois, réponse expliquée et sourcée, bilan final avec les erreurs à revoir. Progression gardée en local. Aucune médaille, aucun score clinquant.

### À propos `/a-propos`
Colophon : pourquoi cette bibliothèque, comment elle est faite (polices et licences, figures dessinées par le code), ce qu'elle doit à Martin et à Peterson, mention non officielle, poinçon JD.

## 5. Mouvement propre à la version

- `PageTurn` : au changement de volume, la feuille pivote autour de la reliure (bord gauche du folio), `rotateY` de 0 à −88°, ombre qui s'allonge, puis la nouvelle arrive de +88° à 0. 620 ms au total, `power3.inOut`. Entre deux vues d'un même volume ou d'un registre : fondu de 160 ms.
- Dos de volumes et signets : translations de 6 à 14 px, 180 ms.
- Figures : la courbe des dragons se trace une fois quand elle entre à l'écran (`DrawSVG`, 1,4 s) ; les annotations suivent.
- Rien d'autre ne bouge au défilement.

## 6. Écriture

Chaque vue ajoute ses chaînes dans son propre fichier `content/interface/ui.v1-<vue>.json` (`{ "schema":1, "items":[ { "key":"page.<vue>.<nom>", "fr":"…", "en":"…" } ] }`). Le valyrien de ces chaînes sera ajouté ensuite par l'agent linguiste : ne pas en inventer.
