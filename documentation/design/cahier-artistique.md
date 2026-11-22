# Cahier artistique — Targaryen Chronicles

Agent 07, direction artistique. Tâche B3. Version du 13 novembre 2026.

Fichiers liés : `design/design-system/tokens.css` (jetons), `design/design-system/sceau.svg` (sceau, marque réduite, favicon, monogramme), `reports/agent-reports/agent-07-cahier-artistique.md` (décisions, risques, arbitrages).

Ce qui est mesuré et ce qui ne l'est pas :

- Les rapports de contraste sont calculés par script (formule WCAG 2.x de luminance relative). Les contrastes « sur matière » sont mesurés sur les pixels d'un rendu Chromium des textures réelles.
- Le sceau, la marque 24 px, le favicon 16 px, le monogramme, les textures et la séquence d'ouverture ont été rendus dans Chromium et contrôlés à l'œil. Le poids du sceau est mesuré (15,8 Ko, 4,6 Ko en gzip).
- Les coûts de performance des matières sont des estimations de conception, pas des mesures sur appareil. Ils sont à confirmer par l'agent 13.
- Les faits d'univers cités (chandelles de verre, Quatorze Flammes, formule rituelle) viennent de ma connaissance des livres. Ils sont à faire valider par l'agent 02 avant tout texte public.

---

## 1. Vision

Le visiteur n'entre pas sur un site consacré à une série. Il entre dans le fonds d'une bibliothèque valyrienne qui n'aurait pas dû survivre, et il le consulte à distance. Tout ce qu'il voit est donc l'une de ces trois choses : un **document** (page, annale, planche, sceau), un **instrument** (frise, jauge, arbre) ou un **lieu** (la pierre, la table, la niche). Rien n'est une illustration.

La richesse vient de la composition typographique, de la précision des filets et de la justesse du mouvement. Elle ne vient ni des images ni des effets.

### Sept principes

| # | Principe | Ce qu'il impose | Ce qu'il interdit |
|---|---|---|---|
| 1 | **L'archive, pas le spectacle** | Chaque élément visuel est un document, un instrument ou un lieu. Les seuls mots gravés sont de vrais mots (lexique de l'agent 04, alphabet latin). | Dragons figurés, portraits imaginaires, images d'ambiance, faux glyphes, vieillissement simulé (taches, bords brûlés, déchirures). |
| 2 | **Une matière par rôle** | Pierre = structure. Parchemin = lecture longue. Métal = navigation et mise en valeur. Cire = authentification. Écaille = dragons. | Deux matières sur un même composant. Une matière hors de son rôle (écailles en fond général, parchemin pour un menu). |
| 3 | **Le rouge se mérite** | Le rouge porte toujours un sens : lignée, rubrique, cire, cœur de flamme, état en cours. Il reste sous 8 % de la surface d'un écran, à l'estime. | Section entière en aplat rouge, bouton générique rouge, dégradé rouge vers noir, rouge utilisé pour « faire Targaryen ». |
| 4 | **Une seule source de lumière** | La lumière vient de la chandelle. Un écran ne compte qu'un seul élément lumineux (`--glow-*`). | Lueur au survol, effet verre, `backdrop-filter`, reflets, plusieurs halos simultanés. |
| 5 | **La typographie fait l'image** | Capitales lapidaires, chiffres, filets et blancs portent la composition. Les seules « images » sont des données dessinées. | Icône sans libellé, pictogramme décoratif, compteur animé, carte à vignette. |
| 6 | **Rien ne bouge sans cause** | Chaque mouvement a une cause physique nommée : masse, feuille, flamme, encre, souffle (section 7). | Parallaxe décorative, détournement du défilement, particules, agrandissement au survol, apparition en cascade de tout ce qui entre à l'écran. |
| 7 | **L'angle vif** | La pierre se taille, le parchemin se coupe. Rayon nul ; pans coupés quand un angle doit céder ; cercle parfait pour ce qui est rond. | `border-radius`, pastilles, ombres douces sur fond noir. |

---

## 2. Palette

Vingt-cinq couleurs en cinq familles. Les composants n'utilisent jamais les primitives : ils passent par les jetons sémantiques (`--surface-*`, `--ink-*`, `--line-*`), que le contexte `[data-surface="parchemin"]` redéfinit.

### 2.1 Couleurs

**Pierre — structure**

| Nom | Hex | Jeton | Rôle |
|---|---|---|---|
| Obsidienne | `#0B0A0A` | `--color-obsidienne` | Fond de page. Noir chaud, jamais `#000`. |
| Basalte | `#141211` | `--color-basalte` | Surface 1 : champ du sceau, stèles, panneaux. |
| Scorie | `#1E1A18` | `--color-scorie` | Surface 2 : élément levé, ligne survolée. |
| Cendre | `#2B2622` | `--color-cendre` | Surface 3 : cartouches. Limite haute pour le texte secondaire. |
| Tuf | `#3D3631` | `--color-tuf` | Filets d'ornement uniquement. |
| Fumée | `#6F675F` | `--color-fumee` | Texte éteint en grand corps seulement. |
| Ponce | `#9A9289` | `--color-ponce` | Texte secondaire. |
| Pierre claire | `#B9B1A6` | `--color-pierre-claire` | Texte courant atténué (longs passages sur sombre). |

**Sang — identité**

| Nom | Hex | Jeton | Rôle |
|---|---|---|---|
| Sang caillé | `#3A0A0E` | `--color-sang-caille` | Surface identitaire profonde (bandeau de volume). |
| Cramoisi | `#6B0D17` | `--color-cramoisi` | Cire, sélection de texte, surface identitaire. |
| Rouge Targaryen | `#C42230` | `--color-rouge-targaryen` | Aplats courts, fil de lignée, grands titres, cœur de flamme. |
| Braise | `#E8634C` | `--color-braise` | Seul rouge autorisé en petit texte sur sombre. |
| Rubrique | `#8E1420` | `--color-rubrique` | Encre rouge sur parchemin : années, renvois, liens. |

**Métal — mise en valeur**

| Nom | Hex | Jeton | Rôle |
|---|---|---|---|
| Bronze sombre | `#5E4826` | `--color-bronze-sombre` | Filets sur sombre. Jamais de texte. |
| Bronze vieilli | `#A8854D` | `--color-bronze` | Étiquettes, folios, contours de contrôles sur sombre. |
| Or ancien | `#C8A45A` | `--color-or-ancien` | Accent, liens sur sombre, traits du sceau. |
| Or pâle | `#E6CE96` | `--color-or-pale` | Rehaut, anneau de focus sur sombre. |

**Documents — surfaces claires**

| Nom | Hex | Jeton | Rôle |
|---|---|---|---|
| Ivoire | `#EFE7D6` | `--color-ivoire` | Texte principal sur sombre ; corps de la flamme. |
| Vélin | `#F3ECDC` | `--color-velin` | Document le plus clair (pièces rares, citations). |
| Parchemin | `#E5D6B5` | `--color-parchemin` | Surface de lecture. |
| Parchemin ombré | `#D2BF98` | `--color-parchemin-ombre` | Encarts, marges, tranche. |

**Encres — sur documents**

| Nom | Hex | Jeton | Rôle |
|---|---|---|---|
| Encre | `#1B1511` | `--color-encre` | Texte sur parchemin. |
| Sépia | `#4B3A29` | `--color-sepia` | Texte secondaire sur parchemin. |
| Bistre | `#624A30` | `--color-bistre` | Gloses, étiquettes, filets porteurs de sens. |
| Bronze d'encre | `#6B4C1C` | `--color-bronze-encre` | L'équivalent de l'or sur parchemin. |

### 2.2 Contrastes calculés — surfaces sombres

Lecture : nombre seul = conforme au texte courant (≥ 4,5:1). **(G)** = réservé au grand texte (≥ 24 px, ou ≥ 19 px gras) et aux éléments graphiques (≥ 3:1). **×** = paire interdite pour tout texte et tout signe porteur de sens.

| Texte \ Fond | Obsidienne | Basalte | Scorie | Cendre | Sang caillé | Cramoisi | Rouge Targaryen |
|---|---|---|---|---|---|---|---|
| Ivoire | 16,07 | 15,18 | 14,04 | 12,17 | 13,88 | 10,07 | 4,72 |
| Pierre claire | 9,32 | 8,81 | 8,14 | 7,06 | 8,05 | 5,84 | 2,74 × |
| Ponce | 6,45 | 6,09 | 5,63 | 4,88 | 5,57 | 4,04 (G) | 1,89 × |
| Fumée | 3,56 (G) | 3,36 (G) | 3,11 (G) | 2,69 × | 3,08 (G) | 2,23 × | 1,04 × |
| Or pâle | 12,84 | 12,13 | 11,21 | 9,72 | 11,09 | 8,04 | 3,77 (G) |
| Or ancien | 8,39 | 7,93 | 7,33 | 6,35 | 7,25 | 5,26 | 2,46 × |
| Bronze vieilli | 5,77 | 5,45 | 5,04 | 4,37 (G) | 4,98 | 3,61 (G) | 1,69 × |
| Bronze sombre | 2,29 × | 2,16 × | 2,00 × | 1,73 × | 1,98 × | 1,43 × | 1,49 × |
| Braise | 5,95 | 5,62 | 5,20 | 4,50 | 5,14 | 3,73 (G) | 1,75 × |
| Rouge Targaryen | 3,41 (G) | 3,22 (G) | 2,98 × | 2,58 × | 2,94 × | 2,13 × | — |
| Tuf | 1,67 × | 1,57 × | 1,46 × | 1,26 × | 1,44 × | 1,04 × | 2,04 × |

### 2.3 Contrastes calculés — surfaces parchemin

| Texte \ Fond | Vélin | Parchemin | Parchemin ombré | Ivoire |
|---|---|---|---|---|
| Encre | 15,36 | 12,58 | 10,02 | 14,69 |
| Sépia | 9,21 | 7,55 | 6,01 | 8,82 |
| Bistre | 7,02 | 5,75 | 4,58 | 6,72 |
| Rubrique | 7,86 | 6,44 | 5,13 | 7,52 |
| Cramoisi | 10,53 | 8,62 | 6,87 | 10,07 |
| Rouge Targaryen | 4,93 | 4,04 (G) | 3,22 (G) | 4,72 |
| Bronze d'encre | 6,67 | 5,46 | 4,35 (G) | 6,38 |
| Bronze vieilli | 2,91 × | 2,39 × | 1,90 × | 2,79 × |
| Or ancien | 2,00 × | 1,64 × | 1,31 × | 1,92 × |
| Fumée | 4,72 | 3,87 (G) | 3,08 (G) | 4,51 |

### 2.4 Contrastes mesurés sur matière

Une texture modifie le fond réel. Mesure faite sur un rendu Chromium, avec les opacités des jetons (`--texture-pierre-opacity: 0.22`, `--texture-parchemin-opacity: 0.35` en `multiply`). La colonne « défavorable » prend le 99ᵉ centile des pixels les plus clairs (pierre) ou le 1ᵉʳ centile des plus sombres (parchemin).

| Encre | Fond texturé | Médiane | Défavorable | Verdict |
|---|---|---|---|---|
| Ponce | Obsidienne | 6,37 | 5,82 | Conforme |
| Bronze vieilli | Obsidienne | 5,70 | 5,21 | Conforme |
| Braise | Obsidienne | 5,88 | 5,37 | Conforme |
| Rouge Targaryen | Obsidienne | 3,37 | 3,08 | Grand texte seulement, sans marge |
| Ponce | Basalte | 5,99 | 5,35 | Conforme |
| Bronze vieilli | Basalte | 5,36 | 4,79 | Conforme |
| Braise | Basalte | 5,53 | 4,94 | Conforme |
| Rouge Targaryen | Basalte | 3,16 | 2,83 | **Interdit sur basalte texturé** |
| Fumée | Basalte | 3,31 | 2,96 | **Interdit sur basalte texturé** |
| Sépia | Parchemin | 7,33 | 6,91 | Conforme |
| Bistre | Parchemin | 5,58 | 5,27 | Conforme |
| Rubrique | Parchemin | 6,25 | 5,89 | Conforme |
| Bronze d'encre | Parchemin | 5,30 | 5,00 | Conforme |

Ces mesures ont déjà corrigé la palette : le premier bronze (`#9A7844`) tombait à 4,02 sur basalte texturé, la première braise à 4,45, le premier bistre à 4,39 sur parchemin. Les trois valeurs ont été renforcées et l'opacité du grain de pierre ramenée de 0,40 à 0,22.

### 2.5 Paires interdites et règles d'emploi

1. **L'or ne s'écrit pas sur parchemin.** Or ancien et bronze vieilli y sont sous 3:1. Sur document clair, l'accent est la rubrique et le « métal » est le bronze d'encre.
2. **Le rouge Targaryen n'est jamais un texte courant.** Sur sombre : titres ≥ 24 px, sur obsidienne, ou sur basalte sans grain. Sur parchemin : grand texte seulement ; pour le petit, la rubrique.
3. **Le seul rouge lisible en petit sur sombre est la braise**, jusqu'à la cendre incluse (4,50, sans marge : y éviter les corps sous 16 px).
4. **Bronze sombre et tuf ne portent aucune information.** Ils dessinent des filets d'ornement. Une séparation qui a un sens (bord de champ, limite de tableau) prend le bronze vieilli.
5. **Fumée** : texte désactivé en grand corps, sur obsidienne, basalte sans grain ou scorie. Jamais sur cendre ni sur cramoisi.
6. **Ponce** s'arrête à la cendre (4,88). Sur cramoisi, passer à l'ivoire ou à l'or pâle.
7. **Sur rouge Targaryen en aplat**, seul l'ivoire passe (4,72). Pas d'or, pas de gris.
8. **Bronze d'encre sur parchemin ombré** : grand texte seulement (4,35). Bistre y passe de justesse (4,58) : pas sous 16 px.
9. **Grain de pierre** : uniquement sur obsidienne et basalte. Jamais sur scorie ni cendre, où le texte secondaire n'a plus de marge.
10. **Focus** : anneau or pâle de 2 px, décalé de 3 px, sur sombre (12,84 sur obsidienne, 9,72 sur cendre). Anneau encre sur parchemin (12,58). Jamais de focus signalé par la seule couleur de fond.
11. **États** : la palette n'a ni vert ni bleu, et n'en aura pas. Une erreur s'écrit en braise (ou rubrique), toujours avec un signe et un mot. Une réussite se marque par un sceau de cire et un mot.

Répartition indicative d'un écran sombre : pierre 80 %, texte ivoire et gris 10 %, métal 6 %, rouge 4 %. Un écran de lecture : parchemin 55 à 65 %, pierre visible autour, rouge sous 3 %.

---

## 3. Matières

Règle générale : une matière est une tuile statique ou un tracé vectoriel. Elle est rastérisée une fois et composée par le processeur graphique. On ne l'anime jamais, on ne lui applique jamais de filtre en direct, et on ne la pose jamais sous un texte sans avoir mesuré le contraste (section 2.4).

| Matière | Intention | Où | Interdit | Technique | Coût estimé |
|---|---|---|---|---|---|
| **Pierre volcanique** | Le lieu. Donne un grain au noir pour qu'il ne soit pas un vide d'écran. | Fond de page, stèles (obsidienne, basalte). | Scorie, cendre, tout élément interactif, tout document. | Tuile SVG 240 px en `data:` : `feTurbulence` fractal (0,85 ; 2 octaves ; `stitchTiles`), `feColorMatrix` vers un gris chaud à alpha faible. Posée en pseudo-élément, opacité 0,22. Jeton `--texture-pierre`. | Une rastérisation de 57 600 px par densité d'écran, puis nul. 0,6 Ko. |
| **Obsidienne taillée** | L'objet précieux et dangereux : la chandelle. | Sceau, chandelle de recherche. | Boutons, cartes, fonds. | Polygones à facettes en aplats nets (SVG). Aucun dégradé, aucun reflet. | Nul. |
| **Métal noirci** | Ce qui se manipule : rails, fermoirs, contours. | Navigation, contrôles, jauges. | Zones de lecture. | Bordure 1 px bronze + `--shadow-relief` (arête haute éclairée, arête basse noire). | Nul. |
| **Parchemin** | La lecture longue, le document sorti du rayonnage. | Folios, fiches longues, planches, citations. | Navigation, pied de page, fenêtres d'état, tout ce qui n'est pas un document. | Aplat `--color-parchemin` + tuile de marbrure (`feTurbulence` 0,022 × 0,034 ; 4 octaves) en `multiply` à 0,35 + `--shadow-bord-parchemin` (assombrissement interne statique). | Tuile 320 px rastérisée une fois. L'ombre interne large coûte à la peinture si l'élément est repeint : ne pas animer la taille d'un folio, seulement sa position (`transform`). |
| **Gravure (hachures)** | L'ombre et le remplissage, à la manière du burin. Remplace tout dégradé. | Fonds de figures, zones « inconnues » d'une carte ou d'une frise, lettrines ornées, champ du sceau. | Derrière du texte. Sur de grandes surfaces (> 40 % de l'écran). | `repeating-linear-gradient` à arrêts nets, pas de 3√2 px (soit 6 px à l'horizontale : un pas de 5 px produit un moiré, constaté au rendu). Couleur par `currentColor`. Jetons `--hachure`, `--hachure-croisee`. | Nul. |
| **Écailles** | Les dragons, et eux seuls. | Nuancier d'écailles des fiches de dragons, bandeau du volume qui leur est consacré, anneau du sceau. | Partout ailleurs. Jamais en fond de section générique. | Tuile SVG 28 × 24 px, ogives à deux courbes quadratiques, deux rangs décalés. Teinte par masque si la couleur doit varier (`mask-image` + `background-color`). Jeton `--texture-ecailles`. | Nul en statique. Ne pas animer `background-position` sur une grande zone. |
| **Inscription** | Le seuil et le titre : ce qui est gravé dure. | Titres de volume, écran d'ouverture, stèles, chiffres d'ère. | Corps de texte. Tout corps sous 14 px. Le parchemin (on n'y grave pas, on y écrit). | `--font-display` en capitales, `--tracking-inscription`, `--shadow-intaille` (deux ombres de 1 px : arête haute noire, arête basse claire). | Nul. Une ombre de texte nette de 1 px ne coûte rien de mesurable. |
| **Cire** | L'authentification : ce document est sourcé, ce passage est scellé. | Niveau de fiabilité d'une source, fin de document, bouton de réponse rituelle. | Badges, compteurs, décor. | Disque cramoisi, marque du sceau en ivoire, bord irrégulier dessiné une fois en tracé SVG (pas de filtre de déplacement à l'exécution). | Nul. |
| **Carte ancienne** | La géographie, seulement si un contenu la demande. | Une planche, pas un fond. | Fond d'accueil, décor. | SVG au trait : côte doublée de deux traits décalés, mer hachurée, rhumbs depuis une rose. Tracé original à produire, sans reprise d'une carte publiée. | Selon le nombre de nœuds ; viser moins de 40 Ko. |
| **Lueur** | La seule lumière : ce qui brûle. | Flamme du sceau, élément en cours (un seul). | Survols, cartes, titres. | `radial-gradient` unique ou `--glow-flamme` ; animation sur `opacity` seulement. | Faible si l'élément a sa propre couche. Jamais d'ombre floue animée. |

**Particules.** Interdites, à une exception documentée : la scène du Fléau de Valyria peut recevoir une chute de cendres (Canvas 2D, 60 particules au plus, 30 images par seconde, arrêt hors écran, absente en mouvement réduit). C'est le seul événement du récit qui la justifie. V1 ne l'utilise pas.

---

## 4. Ornement et iconographie

### 4.1 Cinq primitives

Tout ornement se compose de cinq formes, toutes présentes dans le sceau. Aucune autre forme décorative n'entre dans le système.

| Primitive | Construction | Emploi |
|---|---|---|
| **Losange** | Carré tourné de 45°. | Point d'ornement : puce, milieu de filet, fin de chapitre. Dans un texte gravé, le séparateur de mots reste un caractère, le point médian (U+00B7) retenu par l'agent 08 : le losange se dessine, il ne s'écrit pas. |
| **Goutte** | Pointe en haut, ventre bas, quatre courbes de Bézier symétriques. | Flamme : état actif, cran allumé. |
| **Amande** | Deux arcs de cercle de même rayon. | Ouverture, niche, cadre vertical d'un élément unique. |
| **Ogive** | Deux courbes quadratiques jointes en pointe. | Écaille. |
| **Filet** | Trait droit de 1, 2 ou 3 px. | Tout le reste. |

### 4.2 Icônes

| Règle | Valeur |
|---|---|
| Grille | 24 × 24, zone vive 20 × 20 (2 px de marge). |
| Gabarits | Cercle Ø 20 ; carré 18 ; rectangle debout 16 × 20 ; rectangle couché 20 × 16. |
| Trait | 1,5 px, centré, couleur `currentColor`. |
| Terminaisons | `stroke-linecap: butt`. Le trait est coupé net, comme au burin. |
| Jonctions | `stroke-linejoin: miter`, limite 4. Aucun arrondi. |
| Angles | 0°, 45°, 90° ; 30° et 60° en second choix. |
| Courbes | Arcs de cercle uniquement. Seule exception : la goutte. |
| Plein | Aucun, sauf un losange ou une goutte par icône, au plus. |
| Dessin optique 16 px | Tracé distinct, trait 1,25 px, détails intérieurs supprimés. Pas de réduction automatique du dessin 24. |
| Alignement | Coordonnées au demi-pixel pour les traits horizontaux et verticaux. |
| Libellé | Toute icône de navigation est accompagnée de son mot. L'icône seule n'existe que dans les tableaux denses, avec nom accessible. |

Partis pris d'icônes, pour éviter le vocabulaire d'interface standard :

- **Index** : le mot, en toutes lettres (terme fourni par l'agent 04). Pas de pictogramme à trois barres.
- **Chercher** : la chandelle (goutte sur un fût), pas la loupe. Toujours avec son libellé.
- **Langue** : les trois codes écrits, séparés par des points médians. Pas de globe.
- **Dragon** : une ogive seule. Jamais une tête ni une silhouette.
- **Source** : un cercle et un losange (le sceau réduit à son principe).
- **Lignée** : deux nœuds et un trait qui descend.
- **Annales** : une règle graduée verticale.
- **Règne** : un trait horizontal borné de deux traits courts (une durée). Pas de couronne.
- **Mort** : un fût sans goutte.
- **Fermer, précédent, suivant** : croix et chevrons à extrémités coupées.

### 4.3 Filets

| Filet | Composition | Emploi |
|---|---|---|
| Maigre | 1 px. | Séparation courante. |
| Double | 1 + 3 (blanc) + 1 px. Jeton `--rule-double`. | Tête et pied de tableau d'annales. |
| Gras-maigre | 3 + 3 (blanc) + 1 px. Jeton `--rule-gras-maigre`. | Ouverture de volume, tête de fiche. Le gras toujours du côté extérieur. |
| À losange | Maigre interrompu en son centre par un losange de 7 px. | Fin de chapitre, césure de section. |
| Graduation | Traits de 1 px tous les 8 px. Jeton `--rule-graduation`. | Marge des chronologies : chaque cran vaut une unité de temps déclarée. |

Un filet ne s'étend jamais sur toute la largeur de l'écran. Il s'arrête à la mesure du bloc qu'il sert.

### 4.4 Cartouches

1. **Tablette à queues d'aronde** (rectangle à deux poignées trapézoïdales, forme des tablettes d'inscription antiques) : titres de volume uniquement. Huit occurrences sur tout le site. Réalisation : `clip-path: polygon()` sur un pseudo-élément.
2. **Pan coupé** (`--clip-chamfer-2`, 10 px) : étiquettes et contrôles. `--clip-chamfer-1` (4 px) pour les petits contrôles.
3. **Cartouche d'identité** : tête de fiche. Aucun cadre. Un gras-maigre au-dessus, un maigre au-dessous, le nom en capitales lapidaires entre les deux.

`clip-path` rogne aussi le contour de focus : il s'applique à un pseudo-élément de fond, jamais à l'élément interactif.

### 4.5 Lettrines

- Trois lignes de hauteur, `--font-display`, en rubrique sur parchemin. `initial-letter: 3` avec repli en flottant. Le mot reste entier dans le balisage (`::first-letter`), donc lu normalement par les lecteurs d'écran.
- Une **lettrine ornée** par volume, au premier chapitre : cinq lignes, lettre réservée en clair dans un carré de hachures croisées, un losange aux quatre angles. Aucun rinceau, aucune enluminure imitée.
- Jamais de lettrine sur pierre : sur sombre, c'est l'inscription qui ouvre.

### 4.6 Intentions typographiques (pour l'agent 08)

| Jeton | Intention | Exigences |
|---|---|---|
| `--font-display` | Capitales lapidaires romaines, modèle de l'inscription gravée. | Macrons sur capitales, dont Ȳ (U+0232). Chiffres romains bien espacés. Tenir à 14 px comme à 240 px. |
| `--font-text` | Garalde de lecture, vraies italiques. | Macrons ā ē ī ō ū ȳ (U+0233). Chiffres elzéviriens, petites capitales réelles, bonne tenue en clair sur sombre. |
| `--font-label` | Petites capitales de la garalde, ou incise à faible contraste. | Lisible à 12 px en capitales espacées. Pas de troisième famille sans parenté avec les deux autres. |

La couverture de ȳ et Ȳ est le critère d'élimination : beaucoup de familles s'arrêtent à ū.

Raccord : l'étude de l'agent 08, livrée pendant la rédaction de ce cahier, retient Cormorant Garamond, Alegreya et Alegreya SC, et définit l'échelle des corps (`--fs-*`). `tokens.css` ne fixe pas les familles et ne duplique pas cette échelle ; il n'ajoute que `--fs-monument` (chiffres d'ère de V2) et reprend l'interlettrage des inscriptions à 0,24 em, valeur commune aux deux études.

---

## 5. Le sceau

Contrainte : un sceau original de la bibliothèque. Aucun des concepts ci-dessous ne figure de dragon ni n'emprunte à l'héraldique ; aucun ne part d'une image existante.

### 5.1 Trois concepts

**A — L'Œil de l'archive** (piste de l'orchestrateur). Un œil à pupille verticale dans un anneau d'écailles ; il s'ouvre pendant le chargement.

- Forces : compris en une seconde ; l'ouverture est une jauge naturelle ; l'anneau d'écailles est un beau motif.
- Faiblesses : l'œil reptilien qui s'ouvre et l'œil ardent à pupille fendue sont deux images de cinéma fantastique très connues. Le rapprochement sera fait, et il joue contre l'exigence d'originalité comme contre la prudence en matière de droits. En interface, un œil signifie « afficher / masquer ». À 24 px, c'est exactement ce pictogramme. Enfin, il fait de l'archive une créature qui regarde le visiteur, alors que le concept est une bibliothèque que le visiteur consulte.

**B — Le Fermoir.** Deux mâchoires de fermoir de reliure qui s'emboîtent en anneau autour d'un trou de serrure ; elles se déverrouillent au chargement.

- Forces : dit « livre interdit » sans un mot ; animation mécanique nette ; cohérent avec V1.
- Faiblesses : rien de valyrien. Le même sceau servirait à n'importe quel grimoire. À 24 px, il se lit comme une boucle ou un maillon. Il enferme les trois versions dans la métaphore du livre.

**C — La Chandelle de verre.** Une chandelle d'obsidienne torse, allumée, dans une amande verticale ; autour, un anneau d'écailles, puis quatorze flammes.

- Source : les chandelles de verre sont des objets valyriens décrits dans les livres. Hautes, torses, à arêtes vives, en obsidienne, elles auraient permis aux sorciers de Valyria de voir et de communiquer à distance, et leur lumière est décrite comme étrange. C'est, à la lettre, le concept du site : un savoir valyrien consulté de loin. Les Quatorze Flammes sont les volcans de Valyria.
- Forces : motif propre à cet univers, sans image de référence connue à l'écran, donc dessiné d'après un texte et non d'après une œuvre. Les quatorze flammes donnent une jauge de chargement à quatorze crans. La flamme donne l'état « allumé / éteint » réutilisable dans toute l'interface. La goutte tient à 16 px.
- Faiblesses : la référence échappe à qui ne connaît que les séries ; il faut une phrase d'explication au colophon. Une chandelle seule serait banale : c'est la lame torse, l'amande et le compte de quatorze qui la rendent propre au sujet.

### 5.2 Comparaison

Notes de 1 à 5, attribuées par moi, donc discutables : elles servent à exposer le raisonnement.

| Critère | A — Œil | B — Fermoir | C — Chandelle |
|---|---|---|---|
| Originalité, distance aux images existantes | 2 | 3 | 5 |
| Ancrage dans l'univers | 3 | 1 | 5 |
| Lisibilité à 24 px | 2 (pictogramme « afficher ») | 2 | 4 |
| Potentiel d'animation au chargement | 5 | 4 | 5 |
| Valeur d'usage dans l'interface | 2 | 2 | 5 (jauge, état actif, recherche) |
| Neutralité envers les trois versions | 4 | 2 | 5 |
| Compréhension immédiate par tous | 5 | 4 | 3 |

### 5.3 Recommandation

**Concept C, la Chandelle de verre**, en conservant le meilleur de A : l'ouverture. L'amande verticale s'ouvre comme une pupille se dilate, et l'anneau d'écailles l'entoure. La lecture « œil » existe donc en filigrane, sans être nommée ni dessinée : pas de paupières, pas d'iris ardent, et au centre un objet, pas un regard. Ce point est à connaître de l'orchestrateur : si la parenté avec un œil doit être nulle, il suffit de retirer l'anneau d'écailles ; le sceau tient sans lui.

### 5.4 Construction

Fichier `design/design-system/sceau.svg`. `viewBox="-256 -256 512 512"`, origine au centre : toute rotation et toute mise à l'échelle se font autour de (0, 0) sans calcul. 72 éléments, aucun texte, aucun bitmap, aucun filtre, un seul dégradé (le halo).

| Partie | Sélecteur | Géométrie |
|---|---|---|
| Fond | `#sceau-fond` | Disque r = 252, obsidienne. |
| Listel | `#sceau-listel` → `.listel-gras`, `.listel-maigre` | Cercles r = 247 (3 px, or ancien) et r = 239,5 (1 px, bronze). |
| Quatorze flammes | `#sceau-flammes` → `#flamme-01` … `#flamme-14`, classe `.flamme` | Gouttes de r = 198 à r = 234, demi-largeur 8, pointe vers l'extérieur, une tous les 25,714°. Numérotées comme un cadran : 14 en haut, sens horaire. |
| Filet | `#sceau-filet-ecailles` | Cercle r = 189, 1,5 px. |
| Écailles | `#sceau-ecailles` → `#ecailles-01` … `#ecailles-14`, classe `.secteur` | Deux rangs d'ogives pointées vers le centre : bases r = 187 et pointes r = 168, puis bases r = 168 et pointes r = 150, rangs décalés d'un demi-pas. 3 ogives par rang et par secteur, soit 84 ogives en 14 tracés. Chaque secteur est centré sur la flamme de même numéro. |
| Champ | `#sceau-champ` | Disque r = 146, basalte, bord 2,5 px or ancien. |
| Hachures | `#sceau-hachures` | Horizontales au pas de 8, de y = −120 à +120, rognées au disque r = 137 moins une amande élargie (réserve autour de l'ouverture). |
| Amande | `#sceau-amande` → `.amande-ouverture` | Deux arcs de rayon 193,26 ; pointes en (0, ±134), demi-largeur 54. Fond obsidienne, trait 2,5 px. |
| Halo | `#sceau-halo` | Disque r = 80 centré en (0, −70), dégradé radial or pâle de 34 % à 0 %, rogné à l'amande. |
| Chandelle | `#sceau-chandelle` → `.chandelle-fut`, `.chandelle-aretes`, `.chandelle-facettes`, `.chandelle-socle` | Lame de y = 92 (demi-largeur 12,5) à une pointe oblique en (6, −24) ; trois arêtes en hélice lente ; une facette sur deux en bronze à 50 %. Socle : barre 42 × 4,5. |
| Flamme | `#sceau-flamme` → `.flamme-corps`, `.flamme-coeur` | Goutte ivoire de y = −118 à −30, demi-largeur 17 ; cœur rouge Targaryen de y = −80 à −36, demi-largeur 7,5. |

La flamme est ivoire à cœur rouge, pas orange : c'est la lumière « étrange » du texte, et c'est ce qui la sépare de toutes les flammes d'interface.

Les couleurs sont des attributs de présentation : toute règle CSS les remplace. Version encre sur parchemin, vérifiée au rendu :

```css
.sceau--encre #sceau-fond, .sceau--encre #sceau-champ { fill: none; }
.sceau--encre [stroke] { stroke: var(--color-encre); }
.sceau--encre #sceau-flammes, .sceau--encre .chandelle-socle { fill: var(--color-encre); }
.sceau--encre .chandelle-facettes { fill: var(--color-encre); fill-opacity: .8; }
.sceau--encre .amande-ouverture { fill: var(--color-parchemin); }
.sceau--encre #sceau-halo { display: none; }
.sceau--encre .flamme-corps { fill: var(--color-rubrique); }
.sceau--encre .flamme-coeur { fill: var(--color-parchemin); }
```

### 5.5 Déclinaisons

| Déclinaison | Taille | Source | Dessin |
|---|---|---|---|
| **Grand sceau** | ≥ 120 px | Racine de `sceau.svg` | Complet. Zone de protection : 1/8 du diamètre. |
| **Marque** | 20 à 119 px | `<symbol id="sceau-marque">`, grille 24 | Dessin optique distinct, monochrome `currentColor` : cercle r = 11 (1,5 px), amande inscrite de pointe à pointe (1,25 px), goutte pleine, fût de 1,5 px. Pas d'écailles, pas de flammes. Contrôlée à 96, 48, 32, 24 et 20 px, en or, ivoire, encre et rubrique. |
| **Favicon** | 16 px | `<symbol id="sceau-favicon">`, grille 16 | Disque obsidienne, amande or de 1,1 px, goutte ivoire, fût or. Le disque plein garantit la tenue sur onglet clair ; sur onglet sombre, l'amande seule se détache. À extraire en fichier autonome par l'agent 09. |
| **Cire** | 32 à 64 px | Marque en ivoire sur disque cramoisi | Authentification de source. Ivoire sur cramoisi : 10,07:1. |

Le sceau ne porte aucune légende : il est muet, donc identique dans les trois langues. Les mots viennent dessous.

Usage :

```html
<svg class="marque" width="24" height="24" aria-hidden="true"><use href="/sceau.svg#sceau-marque"/></svg>
```

Pour l'écran d'ouverture, le grand sceau est collé en ligne dans le HTML (4,6 Ko en gzip) afin d'être animable sans requête.

### 5.6 Signature J.D.

Trois niveaux, du plus caché au plus lisible. Aucun n'apparaît dans la navigation, et aucun n'est rouge.

1. **Le chiffre (caché, permanent).** D est la 4ᵉ lettre de l'alphabet, J la 10ᵉ, et 4 + 10 = 14, le nombre des flammes. Sur le cadran du sceau, les flammes 4 et 10 sont donc symétriques par rapport à l'axe vertical. Elles portent une fente de 1,1 unité, écho de l'amande centrale. Le sceau reste symétrique ; la marque ne se voit que si l'on sait. Sélecteur : `.flamme-signee`.
2. **La marque de tâcheron (discrète, récurrente).** Les tailleurs de pierre signaient leurs blocs d'un petit signe. Monogramme `<symbol id="marque-jd">` : le J et le D partagent la haste, le crochet du J arrondit le pied du D, un losange dans la contre-forme. 12 à 16 px, `--line-metal`, sous le filet à losange qui clôt chaque volume. Huit occurrences. `aria-hidden`.
3. **Le colophon (lisible, unique).** Une page de fin dans la tradition du livre imprimé : monogramme à 48 px, initiales en clair, date, outils. C'est le seul endroit où le créateur est nommé. Au survol du monogramme, seules les flammes 4 et 10 du sceau voisin s'allument : la clé du chiffre est donnée à qui est allé jusque-là.

---

## 6. Écran d'ouverture

Séquence vérifiée sur un prototype jetable (huit états capturés dans Chromium avec les jetons du projet). Toutes les animations portent sur `opacity`, `transform`, `fill`, `stroke` et un seul `stroke-dashoffset`.

### 6.1 Principe

La salutation habite l'attente, la réponse ouvre la porte. « Valar morghulis » apparaît tôt et reste pendant le chargement. Quand l'archive est prête, la chandelle s'allume et la réponse rituelle « Valar dohaeris » s'offre au visiteur : c'est lui qui la prononce, par un geste.

Les quatorze flammes sont la jauge. Pas de roue, pas de barre, pas de pourcentage affiché.

### 6.2 Plan par plan (première visite de la session)

| Plan | Début (ms) | Durée | Courbe | Ce qui se passe |
|---|---|---|---|---|
| 0. Noir | 0 | — | — | Fond obsidienne peint par le CSS critique en ligne. Aucun éclair blanc. Le sceau est déjà dans le HTML, invisible. |
| 1. Le listel | 0 | 600 | `--ease-encre` | Le cercle extérieur se trace depuis le haut, dans le sens horaire (`stroke-dashoffset`). |
| 2. L'anneau éteint | 300 | 500 | linéaire | Filets, écailles et flammes paraissent en bronze sombre, flammes en simple contour. L'amande est une fente fermée (`scaleX(.03)`). |
| 3. La salutation | 500 | 900 | `--ease-braise` | « Valar morghulis » : opacité 0 → 1, interlettrage 0,5 em → 0,24 em. Les lettres se resserrent comme une inscription qu'on met au point. Pas d'apparition lettre à lettre. |
| 4. Les quatorze flammes | 600 | 14 × 70 au minimum | `--ease-braise`, 240 par flamme | Chaque flamme passe du contour au plein or ; son secteur d'écailles se réchauffe (bronze sombre → bronze, 420). Ordre : de 1 à 14 ; la quatorzième, en haut, s'allume la dernière. La cadence suit la progression réelle du chargement, sans jamais dépasser une flamme toutes les 70 ms. |
| 5. L'amande s'ouvre | fin du plan 4 (≥ 1 580) | 700 | `--ease-pierre` | `scaleX(.03)` → `scaleX(1)`. La fente devient niche. La chandelle paraît à mi-course (fondu 500). Les hachures du champ viennent après l'ouverture (fondu 400), pas pendant. |
| 6. La chandelle brûle | plan 5 + 570 | 420 | `--ease-braise` | La flamme naît de sa base (`scale(0)` → `scale(1)`, origine 0 −30). Le halo suit (600). Ensuite seulement, boucle de souffle : opacité du halo 0,85 ↔ 1, `--duration-souffle`. |
| 7. La réponse | plan 6 + 450 (≥ 2 600) | 420 | `--ease-braise` | « Valar dohaeris » paraît sous la salutation, en or ancien, souligné d'un filet. C'est un bouton. Sa place est réservée dès le plan 0 : rien ne se décale. |
| 8. Le passage | au geste | 900 à 1 200 | `--ease-pierre` | Selon la version (6.4). Le sceau finit toujours à sa place de marque dans la page : l'objet du seuil devient le bouton d'accueil. |

Durée minimale jusqu'à la réponse : environ 3,0 s. C'est long pour un chargement et court pour un rituel : il n'a lieu qu'une fois par session.

### 6.3 Cas limites

| Cas | Comportement |
|---|---|
| **Chargement très rapide** (tout est en cache) | La séquence joue à sa cadence minimale (3,0 s). Tout geste pendant les plans 1 à 6 saute à l'état du plan 7 : l'impatience est permise. |
| **Visite suivante dans la session** | Pas de rituel. Version brève de 900 ms : la marque paraît à sa place d'en-tête, sa goutte s'allume, la page est là. |
| **Arrivée directe sur une page intérieure** | Version brève. Le rituel est réservé à l'accueil. |
| **Chargement lent** | Les flammes suivent les jalons réels. Proposition de répartition, à fixer par l'agent 09 : polices 4, styles et scripts critiques 4, données du premier volume et langue 4, prêt à l'interaction 2. Entre deux jalons, la dernière flamme allumée respire (opacité 0,7 ↔ 1, 2 400 ms, `--ease-souffle`) : signe de vie, pas roue d'attente. |
| **Plus de 8 s** | Une ligne paraît sous la salutation, dans la langue du visiteur (texte à fournir par les agents 04 et 05), avec un lien « entrer sans attendre » si le contenu HTML est déjà lisible. |
| **Plus de 20 s, ou erreur** | L'entrée est offerte quoi qu'il arrive. Les flammes restent où elles en sont. Les ressources manquantes sont redemandées en arrière-plan. Le seuil ne retient jamais personne. |
| **Sans JavaScript** | Pas d'écran d'ouverture : il n'est créé que par script. Le contenu est directement lisible. |
| **Mouvement réduit** | Sceau complet, éteint, visible d'emblée (fondu de 160 ms). Les flammes changent d'état sans transition, ce qui reste une information et non un mouvement. À l'état prêt, chandelle allumée d'un coup. Passage : fondu enchaîné de 160 ms. Aucune boucle. |
| **Lecteur d'écran** | Région d'état avec `role="progressbar"`, `aria-valuemin="0"`, `aria-valuemax="14"`, `aria-valuetext` traduit. Les deux formules portent leur langue et leur traduction. Le fond est `inert` tant que le seuil est affiché. À l'entrée, le focus va au titre principal. |

**Langue.** Le site s'ouvre en haut valyrien. Un visiteur doit pouvoir changer de langue avant d'entrer : le sélecteur de langue (trois codes écrits) figure sur le seuil, sous la réponse, dès le plan 3. C'est une proposition à valider avec l'agent 06.

### 6.4 La réponse rituelle : évaluation

| Pour | Contre |
|---|---|
| La paire salutation / réponse est canonique : le rituel est juste. | Un geste de plus avant le contenu. |
| L'attente devient un acte. Le visiteur entre, il n'est pas déposé. | Irritant s'il se répète : d'où la limite à une fois par session. |
| Le geste autorise un éventuel son (les navigateurs l'exigent). | Doit rester utilisable au clavier et sans limite de temps. |
| Laisse du temps au chargement sans qu'il se voie. | Le cahier des charges ne demande que l'emblème et la salutation. |

Recommandation : la réponse est un vrai bouton (clic, toucher, Entrée, Espace ; un clic sur le sceau vaut aussi réponse). Pas d'entrée automatique quand elle est proposée. Le défilement ne vaut pas réponse : il est trop ambigu.

Par version :

- **V1** (fidèle) : pas de porte. La réponse s'affiche 1 200 ms comme sous-titre, puis le site s'ouvre seul. Passage : le sceau monte en tête de page pendant que le premier folio se lève (`--ease-page`, 700).
- **V2** : porte. Passage : la base de la flamme s'étire vers le bas et devient le fil de lignée ; la page se déroule dessous (1 200).
- **V3** : porte. Passage : on traverse l'amande. Elle sert de masque (`clip-path`) et s'agrandit jusqu'à couvrir l'écran (900), révélant la table.

---

## 7. Mouvement

Document de cadrage pour la bible du mouvement de l'agent 10 (tâche B8).

### 7.1 Cinq causes, sept courbes

Un mouvement n'existe que s'il relève d'une de ces causes. Chaque cause a sa courbe.

| Cause | Courbe | Valeur | Emploi |
|---|---|---|---|
| **Masse** | `--ease-pierre` | `cubic-bezier(0.7, 0, 0.2, 1)` | Ce qui est lourd : volumes, vantaux, amande. Départ lent, arrêt net. |
| **Feuille** | `--ease-page` | `cubic-bezier(0.22, 0.61, 0.21, 1)` | Ce qui est léger et posé : folio, feuillet, glose. Se lève vite, se pose longuement. |
| **Flamme** | `--ease-braise` | `cubic-bezier(0.16, 1, 0.3, 1)` | Ce qui s'allume ou paraît. Jaillit, se stabilise. |
| **Encre** | `--ease-encre` | `cubic-bezier(0.65, 0, 0.35, 1)` | Ce qui se trace : filets, fil de lignée, soulignements. |
| **Souffle** | `--ease-souffle` | `cubic-bezier(0.37, 0, 0.63, 1)` | Les boucles d'ambiance, en aller-retour. |
| (sortie) | `--ease-chute` | `cubic-bezier(0.55, 0, 1, 0.45)` | Tout ce qui quitte l'écran accélère. |
| (frappe) | `--ease-sceau` | `cubic-bezier(0.34, 1.4, 0.64, 1)` | Léger dépassement. Réservé à la pose d'un sceau de cire et aux confirmations. |

### 7.2 Durées

| Jeton | Valeur | Emploi |
|---|---|---|
| `--duration-instant` | 90 ms | Pression, bascule d'état. |
| `--duration-bref` | 160 ms | Survol, focus, soulignement. |
| `--duration-court` | 240 ms | Petit élément qui paraît ; sortie de contenu. |
| `--duration-moyen` | 420 ms | Feuillet qui se pose, panneau, allumage. |
| `--duration-long` | 700 ms | Page tournée, ouverture de l'amande. |
| `--duration-ceremonie` | 1 200 ms | Passage d'un volume à l'autre. |
| `--duration-rituel` | 2 400 ms | Ordre de grandeur de la séquence d'ouverture. |
| `--duration-souffle` | 4 800 ms | Boucle de la flamme au repos. |
| `--stagger-fin` / `--stagger` / `--stagger-large` | 18 / 40 / 70 ms | Écailles ; lignes d'une table ; flammes. |

Sous 600 px de large, les déplacements parcourent moins de distance : réduire de 30 % les durées de 420 ms et plus.

### 7.3 Passage entre volumes

Trois temps, 1 200 ms au total :

1. **Sortie** (0 à 240, `--ease-chute`) : le contenu courant s'efface (opacité, 8 px vers le haut).
2. **Seuil** (160 à 860, `--ease-pierre`) : le numéro et le titre du volume paraissent seuls, en capitales lapidaires ; un gras-maigre se trace dessous (`--ease-encre`, 420).
3. **Entrée** (780 à 1 200, `--ease-page`) : le contenu arrive, six éléments au plus en cascade de 40 ms ; le reste est déjà en place.

Propre à chaque version : en V1, le temps 2 est une page qui tourne (voile horizontal par `clip-path` et trait d'ombre qui le précède, 700 ms). En V2, il n'y a pas de passage : le défilement est continu, le chiffre d'ère change en fondu et le fil change de graisse. En V3, un document se pose sur la table (24 px vers le bas, l'ombre grandit, 420 ms).

### 7.4 Règles de sobriété

1. Une seule transition cérémonielle par navigation.
2. Aucune animation de plus de 240 ms sur un geste répété (survol, onglet, ligne de table).
3. Survol : couleur et soulignement tracé de gauche à droite, 160 ms. Jamais d'agrandissement, de levée ni d'ombre.
4. Propriétés animées : `opacity`, `transform`, `clip-path`, `stroke-dashoffset`, couleurs. Jamais `width`, `height`, `top`, `margin`, `filter`, `box-shadow`.
5. Trois tracés animés simultanément au plus.
6. Les éléments ne « paraissent pas au défilement » un par un. Seuls sont liés au défilement : le fil de lignée (V2), le titre courant et la jauge.
7. Aucun détournement du défilement. La molette et le doigt gardent leur vitesse native.
8. Une seule boucle d'ambiance à l'écran (la flamme), suspendue hors champ et dans un onglet inactif.
9. Mouvement réduit : les jetons de durée tombent à 1 ms, les décalages à 0, seul `--duration-fondu` (160 ms) subsiste. Les boucles s'arrêtent.
10. Budget : 60 images par seconde sur un téléphone de milieu de gamme. V1 sans WebGL ni Canvas. V2 avec Canvas 2D pour une seule scène. WebGL seulement si une mesure montre que Canvas ne suffit pas.

---

## 8. Trois directions

Socle commun : mêmes contenus, mêmes jetons, même sceau. Les trois versions diffèrent par la métaphore, la composition, la navigation, le rapport texte / image et le mouvement. Les noms sont des noms de travail en français ; les noms valyriens sont à demander à l'agent 04.

### 8.1 V1 — « Le Codex »

Fidèle au cahier des charges : un ouvrage, des chapitres, des pages.

| | |
|---|---|
| **Métaphore** | Un seul livre, ouvert sur un lutrin de pierre. |
| **Accueil** | Une page de titre architecturée, symétrique : sceau (120 px), titre en capitales lapidaires sur trois lignes, gras-maigre, puis la table des huit volumes composée comme une vraie table des matières : chiffre romain, titre valyrien, traduction en italique, points de conduite, bornes chronologiques. Aucune carte. À partir de 1 200 px, double page : frontispice au verso, table au recto. En dessous, une seule page. |
| **Composition** | Folio de parchemin au rapport 2:3, posé sur la pierre. Marges du canon médiéval : petit fond < tête < grand fond < pied. Symétrie axiale. Parchemin sur 55 à 65 % de l'écran. |
| **Navigation** | Tourner la page. Signets de tranche à droite (huit volumes, tablettes de bronze), titre courant et folio en tête, flèches du clavier. Sur mobile : titre courant et folio en barre basse. Une adresse par page. |
| **Fiches** | Un folio : cartouche d'identité, ligne de vie (naissance, règne, mort sur un trait gradué, unique par ses données), lettrine, corps en garalde, sources en gloses de marge. |
| **Chronologies** | Annales : table à deux colonnes, l'année en rubrique dans la marge, graduation, double filet en tête et en pied. |
| **Arbre** | Une planche dépliante hors-texte (`--width-planche`) : stemma gravé à traits orthogonaux, déplacement et zoom. Liste imbriquée équivalente pour le clavier et les lecteurs d'écran. |
| **Texte / image** | Le texte domine très largement. Les seules figures sont les planches. |
| **Mouvement** | 2 sur 5. Page tournée, encre des lettrines (une fois par chapitre). Rien au défilement. |
| **Ce qui la distingue** | Paginée, claire, symétrique, linéaire. On lit. |

### 8.2 V2 — « La Lignée »

Proposition alternative : une maison, c'est un sang. Le site est un fil que l'on descend.

| | |
|---|---|
| **Métaphore** | Un seul fil rouge, de la première génération à la dernière. Descendre la page, c'est descendre la lignée : le défilement et la descendance vont dans le même sens. |
| **Accueil** | Un écran noir presque vide, asymétrique. Le fil part de la flamme du sceau, au tiers gauche (à 24 px du bord sur mobile), et descend vers le premier nœud. À droite, le chiffre d'ère en capitales monumentales (`--fs-monument`), rogné par le bord. Aucun menu visible : une jauge de profondeur à huit strates. |
| **Composition** | Colonne unique et continue, ancrée à gauche sur le fil. Sombre à 95 %. Aucun parchemin. Les textes sont des stèles accrochées aux nœuds. |
| **Navigation** | Le défilement vertical continu. La jauge latérale (huit ères) saute de strate en strate. Les branches cadettes s'ouvrent latéralement depuis leur nœud. La recherche est une chandelle qu'on allume. |
| **Fiches** | Des stèles : elles s'ouvrent sur place, à côté du nœud, sans changer de page. Nom gravé, faits en table d'inscription, 120 mots au plus, puis la chronique longue en colonne sur scorie. |
| **Chronologies** | Le défilement est la chronologie. L'échelle (pixels par an) est déclarée dans la marge par la graduation ; quand elle change, une faille visible coupe le fil. |
| **Arbre** | Ce n'est pas une page, c'est l'épine dorsale du site. Vue d'ensemble : un zoom arrière sur le fil entier. |
| **Texte / image** | La donnée dessinée domine. Texte court, lapidaire. |
| **Mouvement** | 4 sur 5. Le fil se trace avec le défilement, le chiffre d'ère change en fondu, les stèles se posent. Canvas pour la scène du Fléau. |
| **Ce qui la distingue** | Continue, sombre, asymétrique, exploratoire. On parcourt. |
| **Fragilités** | Page très longue (performance, repérage). Une généalogie à unions multiples et à branches rivales résiste à l'idée d'un fil unique : à éprouver sur les données de l'agent 03 avant de s'engager. Accessibilité : fournir la même structure en liste hiérarchique avec ancres. |

### 8.3 V3 — « La Table d'étude » (hypothèse)

Fusion à confirmer après comparaison réelle de V1 et V2 (phase G). On ne lit plus un livre, on ne descend plus un fil : on travaille à une table où des documents ont été sortis des rayonnages.

| | |
|---|---|
| **Métaphore** | La table de pierre de l'archiviste : un codex ouvert, un ruban, une règle. |
| **Hérite de V1** | Le folio de parchemin pour toute lecture longue. |
| **Hérite de V2** | Le fil rouge, devenu le **signet** du livre : un ruban qui traverse tous les documents et reste la navigation permanente. |
| **Apporte** | Deux axes croisés : le ruban dit *qui* (vertical, lignée), la réglette dit *quand* (horizontale, temps). Choisir sur l'un filtre l'autre. |
| **Accueil** | Grille de douze colonnes, asymétrique : le codex ouvert à la page du moment (sept colonnes), le ruban de lignée (une colonne), la réglette du temps en pied (douze colonnes), le sceau. Sur mobile : le folio, le ruban replié en marge gauche, la réglette en barre basse. |
| **Fiches** | Des feuillets volants posés sur la table. Deux au plus côte à côte à partir de 1 200 px, pour comparer deux personnages. |
| **Chronologies** | La réglette, que l'on fait glisser ; les annales dans les folios. |
| **Arbre** | Arbre à focale : une personne au centre, deux générations au-dessus et au-dessous, le reste replié dans le ruban. |
| **Mouvement** | 3 sur 5. Cérémoniel aux seuils, immobile pendant la lecture. |
| **Ce qui la distingue** | Ni linéaire ni continue : croisée. On consulte. |
| **Critères de confirmation** | Temps pour atteindre une fiche donnée ; compréhension de la navigation sans aide ; tenue à 360 px ; ce que les testeurs retiennent de V1 et de V2. Si le ruban ne survit pas à l'épreuve de la généalogie réelle, V3 garde la réglette et abandonne le croisement. |

### 8.4 Tableau des écarts

| | V1 Le Codex | V2 La Lignée | V3 La Table |
|---|---|---|---|
| Unité | La page | Le nœud | Le document |
| Geste | Tourner | Descendre | Poser, croiser |
| Surface dominante | Parchemin | Pierre | Pierre, parchemin dessus |
| Axe | Symétrie centrale | Fil au tiers gauche | Grille asymétrique |
| Arbre | Planche | Épine dorsale | Focale |
| Temps | Annales | Défilement | Réglette |
| Entrée | Automatique | Réponse rituelle | Réponse rituelle |
| Mouvement | 2 / 5 | 4 / 5 | 3 / 5 |

---

## 9. Quinze décisions contre l'allure de modèle

1. **Pas de bandeau d'accueil** à titre, sous-titre et bouton. L'accueil est une page de titre composée (V1), un fil (V2) ou une table (V3).
2. **Les huit volumes forment une table des matières**, avec chiffres romains et points de conduite. Jamais une grille de cartes.
3. **Rayon nul partout.** Pans coupés quand un angle doit céder. Aucune pastille.
4. **Le bouton principal n'est pas rouge** : texte or sur pierre, filet de 1 px, soulignement qui se trace. Le rouge reste sous 8 % de l'écran.
5. **La flamme est ivoire à cœur rouge.** Aucun dégradé de feu orange.
6. **Une seule lueur par écran.** Aucun effet verre, aucun `backdrop-filter` : les superpositions sont opaques et bordées d'un filet.
7. **Aucun dragon dessiné.** Un dragon est représenté par son nuancier d'écailles (sa couleur attestée, en motif d'ogives) et par ses données.
8. **Aucun portrait.** Une personne est représentée par sa ligne de vie, dessinée par ses dates : chaque fiche a une tête unique sans illustration.
9. **Pas d'icône à trois barres, de loupe ni de globe.** Le mot « Index » en toutes lettres, la chandelle pour chercher, les trois codes de langue écrits.
10. **La jauge de chargement compte quatorze flammes.** Aucune roue, aucune barre, aucun pourcentage.
11. **Les dates sont composées**, en chiffres elzéviriens avec l'ère en petites capitales. Jamais en étiquettes colorées.
12. **Alinéas en retrait, sans ligne blanche**, sur parchemin. Sources en gloses de marge, pas en infobulles ni en notes de fin.
13. **Marges inégales** selon le canon de page. Jamais un bloc centré de 1 200 px à trois colonnes égales.
14. **Le survol écrit, il ne soulève pas** : un soulignement tracé en 160 ms. Aucune carte qui grossit, aucune ombre qui s'étale.
15. **Les hachures remplacent les dégradés.** Une ombre se grave, elle ne se fond pas. Les seuls dégradés du site sont le halo de la chandelle et l'assombrissement des marges du parchemin.

---

## 10. Points ouverts

Détaillés dans le rapport. En bref : graphie à macron de la salutation (agent 04), balise de langue du haut valyrien (agents 04 et 09), validation des faits d'univers (agent 02), tenue du fil unique face à la généalogie réelle (agent 03), sélecteur de langue sur le seuil (agent 06), porte rituelle ou entrée automatique (orchestrateur), recherche d'antériorité visuelle sur le sceau (orchestrateur ou commanditaire).
