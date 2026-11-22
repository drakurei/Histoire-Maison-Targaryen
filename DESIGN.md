# DESIGN — Targārio Lentro Vestriarja

Ce document remplace `documentation/design/cahier-artistique.md` (première direction, rejetée par le commanditaire : « beaucoup trop IA »). Il fait autorité pour les trois versions. En cas de doute, relire `PRODUCT.md`.

## 0. Le test

Si un visiteur peut dire « une IA a fait ça » sans hésiter, la page est refusée. On doit se demander comment c'est fait, pas quel outil l'a produit.

### Interdits absolus (motif de refus en revue)

- Petites étiquettes en capitales espacées au-dessus des blocs (« eyebrows »). Aucune.
- `letter-spacing` positif sur des capitales pour « faire noble ». Les titres sont en bas de casse, serrés.
- Filets dorés d'un pixel, cadres dorés, boîtes à bordure fine sur fond noir.
- Cartes : aucune grille de cartes identiques, aucune carte dans une carte, aucun `border-radius` décoratif (rayon 0 partout, sauf formes rondes par nature).
- Losanges, fleurons, séparateurs d'ornement. Un blanc sépare ; sinon rien.
- Mise en page en pile centrée. La composition est asymétrique et alignée à gauche, sur grille.
- Texte en dégradé, verre dépoli, ombres grises douces, lueurs néon.
- Apparition « fondu + glissement vers le haut » sur chaque section au défilement.
- Chaînes de métadonnées jointes par des points médians ; tirets cadratins ; flèche « → » collée aux liens.
- Emojis, pictogrammes de bibliothèque d'icônes génériques, illustrations de stock.
- Police à chasse fixe pour « faire technique ».
- Bordure latérale colorée (`border-left` épais) comme accent.
- Noir pur `#000`, blanc pur `#fff`.
- Texte de remplissage, sections qui décrivent le site lui-même, phrases creuses (« Plongez dans… », « Découvrez… »).

## 1. Scène

Un lecteur, le soir, dans une pièce peu éclairée, devant un écran de 13 à 27 pouces ou un téléphone tenu près du visage. Il lit longtemps. Donc : fond sombre chaud pour l'architecture du lieu, et surfaces de lecture qui ne fatiguent pas (ivoire cendré en V1, cendre claire sur noir en V2), jamais de gris moyen sur noir.

## 2. Couleur (OKLCH, neutres teintés vers le rouge)

Stratégie : **engagée**. Le rouge porte l'identité et occupe des surfaces entières quand le récit l'exige (la Danse, le Fléau). L'or est rare.

| Jeton | Valeur | Rôle |
|---|---|---|
| `--obsidienne` | `oklch(0.14 0.012 25)` | fond d'architecture, jamais de noir pur |
| `--suie` | `oklch(0.19 0.014 28)` | surface posée sur l'obsidienne |
| `--basalte` | `oklch(0.27 0.012 35)` | pierre, traits de structure sur fond sombre |
| `--cendre` | `oklch(0.62 0.012 55)` | texte secondaire sur sombre (contraste ≥ 4.5 sur obsidienne) |
| `--ivoire` | `oklch(0.93 0.025 85)` | texte principal sur sombre |
| `--velin` | `oklch(0.90 0.035 84)` | surface de lecture claire (folio) |
| `--velin-ombre` | `oklch(0.84 0.045 80)` | marge, pli, verso |
| `--encre` | `oklch(0.24 0.02 40)` | texte sur vélin |
| `--encre-pale` | `oklch(0.42 0.025 45)` | texte secondaire sur vélin (≥ 4.5) |
| `--sang` | `oklch(0.50 0.19 25)` | rouge Targaryen : aplats, rubriques |
| `--cramoisi` | `oklch(0.36 0.14 22)` | rouge profond : fonds de section |
| `--braise` | `oklch(0.68 0.20 40)` | point le plus chaud : feu, état actif sur sombre |
| `--rubrique` | `oklch(0.44 0.17 25)` | rouge d'encre sur vélin (≥ 4.5 sur `--velin`) |
| `--or` | `oklch(0.76 0.11 84)` | ce qui est couronné : rois, lettrine d'ouverture |
| `--bronze` | `oklch(0.56 0.08 68)` | métal vieilli : instruments (carte, règle du temps) |

Règles : l'or ne sert jamais de bordure ni de filet courant. Un lien se signale par un soulignement épais décalé, pas par une couleur seule. Les cinq niveaux de fiabilité ont chacun une marque dessinée (forme + couleur), jamais la couleur seule.

## 3. Typographie

Quatre voix, quatre rôles, aucune permutation :

| Voix | Famille | Emploi |
|---|---|---|
| La chronique (titres) | **Texturina** variable (`opsz` 12 à 72, `wght` 100 à 900, romain et italique) | tout titre, tout mot valyrien mis en avant. Terminaisons en lame : c'est le verre-dragon. |
| La lettrine | **Grenze Gotisch** variable | uniquement lettrines, chiffres de volume, ordinaux des rois, grands nombres. Jamais une phrase. |
| Le récit | **Alegreya** variable (romain, italique) | texte courant, gloses, citations |
| Le musée (cartels) | **Alegreya Sans** 400, 500, 700 | appareil : notes de marge, sources, légendes de figures, commandes, formulaires, données |

Toutes couvrent ā ē ī ō ū ȳ ñ (vérifié sur les fichiers). Polices auto-hébergées via `@fontsource`, licence OFL.

Échelle (rapport 1.333, fluide) : `--t-1: 0.8rem` (cartel) ; `--t0: clamp(1.06rem, 0.98rem + 0.3vw, 1.2rem)` (récit) ; `--t1: 1.333×` ; `--t2` ; `--t3` ; `--t4` ; `--t5: clamp(3.2rem, 2rem + 6vw, 7.5rem)` ; `--t6: clamp(4rem, 1rem + 13vw, 15rem)` (un mot monumental par page, pas plus).

Règles : titres en bas de casse, `letter-spacing` de −0.01 à −0.03em, interlignage 0.92 à 1.05 ; récit en 62 à 72 caractères par ligne, interlignage 1.6 (1.68 en clair sur sombre) ; chiffres elzéviriens dans le récit, tabulaires dans les données ; vraies petites capitales (`font-variant-caps`) seulement pour les sigles d'ère (av. C., apr. C.). Aucune capitale espacée. L'italique sert aux gloses et aux titres d'ouvrages.

### La glose interlinéaire (composant d'identité)

Le valyrien s'affiche en première ligne (Texturina), sa traduction dessous en Alegreya italique plus petite, alignée à gauche, comme dans une édition savante. Au survol ou au focus : statut de la forme (attestée, dérivée, éditoriale) et note du linguiste. En mode français ou anglais, la glose disparaît et la langue choisie prend la première ligne ; le valyrien reste visible là où il est le sujet (lexique, devises).

## 4. Matière et images (obligatoires)

Aucune illustration générée, aucun visuel de la franchise. Tout est dessiné par le code du projet :

1. **L'emblème** (`src/shared/emblem`) : dragon tricéphale original, héraldique, SVG. Sert d'écran d'ouverture avec « Valar morghūlis ».
2. **Les dragons** (`src/core/dragons`, `src/shared/dragon`) : générateur procédural vu du dessus (crâne, cou, torse, queue, deux ailes à doigts et membranes), paramétré par dragon (envergure relative, longueur du cou, cornes, couleurs attestées par les livres). Il sert de planche de spécimen, d'échelle comparée, et d'**ombre portée qui traverse la page**.
3. **Le feu et la pierre** (`src/shared/gl`) : shaders WebGL maison (basalte fissuré de lave, braises, dissolution par le feu). Toujours avec repli statique.
4. **La carte** (`src/shared/map`) : Westeros et l'ouest d'Essos, tracé original gravé, lieux cliquables.
5. **Les figures de données** : courbe des dragons vivants par année ; ruban des règnes ; arbre du sang (unions consanguines en boucles fermées) ; ordre de bataille.
6. **Les marques** : cinq marques de fiabilité, marque de continuité (livres, adaptation), couronne, poinçon JD. Dessinées à la main en SVG, trait de 1.5, même grille de 16.

## 5. Mouvement

GSAP 3 (ScrollTrigger, SplitText, Flip, DrawSVG au besoin) et WebGL brut. Courbes : `expo.out`, `power4.out` ; aucune élasticité, aucun rebond. On n'anime que `transform`, `opacity`, `clip-path`, et des uniformes de shader.

Mouvements autorisés, chacun avec sa raison :
- **Seuil** : l'emblème se trace, « Valar morghūlis » s'inscrit lettre à lettre pendant le chargement réel, la réponse « Valar dohaeris » arrive, le site s'ouvre seul. Passable d'un clic ou d'une touche. Une seule fois par session.
- **Le feu efface et révèle** : transition entre grandes sections.
- **L'ombre d'un dragon passe** : à l'entrée d'une période où un dragon compte. Rare (une fois par page au plus).
- **La page se tourne** (V1) : changement de volume.
- **La lignée se déploie** : les fils du sang se tracent du parent à l'enfant.
- **Le temps se règle** : la règle du temps entraîne carte, courbes et rubans.
- Réponses aux gestes (ouvrir, filtrer, sélectionner) : 160 à 280 ms.

Interdits : apparitions au défilement en série, parallaxe décorative, particules d'ambiance permanentes, curseur personnalisé, défilement détourné qui gêne la lecture. `prefers-reduced-motion: reduce` : tout devient fondu de 150 ms ou rien ; les shaders se figent sur une image.

## 6. Composition

Grille de 12 colonnes, gouttière `clamp(1rem, 2vw, 2rem)`, marges de page `clamp(1.25rem, 5vw, 6rem)`. Le récit occupe 7 colonnes, sa marge de notes 3 ; le reste respire. Sur téléphone : une colonne, les notes de marge deviennent des appels numérotés qui se déplient sous le paragraphe (pas de fenêtre modale).

Rythme d'espacement : `--e1: 0.25rem`, `0.5`, `0.75`, `1`, `1.5`, `2.5`, `4`, `6.5`, `10.5rem`. Jamais le même espace partout : serré dans un groupe, large entre deux idées.

Cibles tactiles ≥ 44 px. Focus visible : contour de 2 px `--braise` décalé de 3 px. Contrastes AA au minimum, AAA pour le récit.

## 7. Les trois versions

Elles partagent `src/core` (données, langues, logique) et `src/shared` (emblème, dragons, shaders, carte). Elles ne partagent ni mise en page, ni composants de page, ni chorégraphie.

### Version 1 : « Le Codex » (fidèle au cahier des charges)

Un livre posé sur une table de basalte. Huit volumes.
- **Table** : fond `--obsidienne`, grain de pierre (shader figé ou SVG), lumière chaude venant d'en bas à gauche.
- **Folio** : la surface de lecture est une feuille de vélin (`--velin`) aux bords irréguliers (clip-path), encre `--encre`. Rubriques rouges (`--rubrique`) comme dans un manuscrit : le titre de chapitre et les incipit sont rouges, c'est la tradition de la rubrication et non un accent.
- **Navigation par tranches** : les huit volumes sont huit dos de livre verticaux sur le bord gauche (chiffre en Grenze Gotisch, titre valyrien vertical). Les registres (lignée, dragons, guerres, lieux, langue, sources, apprendre) sont des signets de tissu rouge dépassant en haut du folio. Sur téléphone : une étagère en bas d'écran qui s'ouvre.
- **Marge savante** : sources et notes en marge du récit, reliées au mot par un appel.
- **Lettrines** en Grenze Gotisch, 4 lignes, rouge ; celle d'ouverture de volume est dorée.
- **Transition** : la feuille se tourne (rotation 3D sur la reliure, ombre portée).
- **Ouverture** (après le seuil) : noir, la pierre apparaît, une lueur rouge la traverse, l'ombre d'un dragon passe, l'emblème se pose, le titre s'inscrit, les dos de volumes se lèvent.
- Mouvement surtout SVG et CSS ; WebGL limité à l'ouverture.

### Version 2 : « Sable et gueules »

Les armes de la Maison : un champ de sable traversé d'une fasce de gueules. Arbitrage : `documentation/design/v2-arbitrage.md` ; spécification : `documentation/design/v2-spec.md`.
- **La fasce** : bande rouge fixe en bas de chaque écran, dont l'épaisseur est le nombre de dragons vivants année par année (plein si attesté, hachuré si le sort est inconnu, masse hachurée pour Valyria). Elle est l'identité et l'instrument du temps : on y règle l'année (`?an=`), et toute la version répond pour cette année.
- **Navigation** : la fasce (encoche, crans d'année, périodes), une ligne de registres en toutes lettres, la recherche qui accepte une année, et un cartel qui ouvre une personne, un dragon ou un lieu sans quitter la lecture (sang, dragon, guerre, lieu).
- **Composition** : quatre partitions héraldiques tirées des données (parti, pal, fascé, champ plein). Aucun vélin, aucune lettrine ; Grenze ne porte que les nombres, un seul grand nombre par vue, souvent l'année évidée dans le rouge.
- **Le rouge est toujours une donnée** (dragons, sang de la lignée, feu d'un lieu), jamais un ornement. Mouvements : la masse se dépose, le temps se règle, le feu part de la fasce, l'ombre passe sur le rouge seul, la lignée se déploie. Aucun WebGL permanent.

### Version 3 : édition ultime

Arbitrage entre 1 et 2 (phase G). S'ouvre par défaut.

## 8. Écriture d'interface

Phrases courtes, verbes simples, casse de phrase. Un bouton dit ce qu'il fait. Une erreur dit ce qui s'est passé et quoi faire. Un écran vide invite à agir. Aucune mention du procédé de fabrication. Les trois langues sont intégrales : aucune chaîne en dur dans un composant.
