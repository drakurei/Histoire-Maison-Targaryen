# Construction des contenus

Rapport écrit par `node scripts/build-content.mjs`. Ne pas le modifier à la main : il est réécrit à chaque exécution.

État : aucune erreur bloquante. Avertissements : 3.

## Résumé chiffré

| Jeu | Nombre |
|---|---|
| Périodes | 8 |
| Événements | 125 |
| &nbsp;&nbsp;dont propres à une adaptation | 8 |
| Sections de récit long | 83 |
| Questions ouvertes | 6 |
| Personnes | 176 |
| Unions | 69 |
| Filiations | 132 |
| Souverains | 18 |
| Successions | 20 |
| Biographies | 80 |
| Dragons | 28 |
| Guerres | 12 |
| Batailles | 51 |
| Lieux | 42 |
| Carte | 1 |
| Mots du lexique | 322 |
| Expressions | 59 |
| Leçons de grammaire | 12 |
| Parcours | 5 |
| Chaînes d’interface | 1006 |
| &nbsp;&nbsp;dont avec forme valyrienne | 80 |
| Sources | 20 |
| Entrées de recherche | 769 |

## Références par nom

| Champ | Avec identifiant | Sans identifiant |
|---|---|---|
| Personnes citées par les événements | 316 | 163 |
| Dragons cités par les événements | 109 | 1 |
| Lieux cités par les événements | 170 | 52 |
| Dragonniers | 31 | 3 |

## Ce que le script valide

- Forme : chaque jeu nouveau est comparé champ par champ au contrat de `src/core/content/types.ts` (champ manquant, type, valeur hors liste : erreur ; champ inconnu : avertissement).
- Identifiants uniques : sources, entrées du lexique, personnes, unions, filiations (une par enfant), souverains, successions, périodes, événements, questions ouvertes, dragons, guerres, belligérants d’une guerre, batailles, lieux, couches de la carte, expressions, leçons, parcours, étapes et questions d’un parcours, sections d’un récit, clés d’interface (une clé en double entre deux fichiers est une erreur), entrées de recherche.
- Références : toute source citée existe ; partenaires, parents, père allégué, fil principal, souverains, prédécesseurs, successeurs, écartés et contestataires existent dans la généalogie ; un parent appartient à l’union citée ; dragons, événements, périodes, guerres, batailles et lieux cités par les biographies, les guerres, les lieux, les apparences et les parcours existent ; les chemins internes des parcours suivent le plan des routes.
- Textes traduits : tout objet qui porte `fr` ou `en` porte les deux, non vides ; `hv` n’est jamais vide ; une forme valyrienne porte toujours son statut.
- Années : pas d’an 0 ; naissance avant la mort ; règne compris dans la vie ; `king` et `reign` concordants ; règnes et dates de vie identiques entre la généalogie et la liste des souverains ; chaîne prédécesseur et successeur cohérente ; union datée du vivant des deux partenaires ; enfant né après ses parents, du vivant de sa mère et au plus un an après la mort de son père ; événement daté dans les bornes de sa période ; `year` nul si et seulement si la date est inconnue ; `yearEnd` après `year` ; dragonnier actif du vivant du cavalier et du dragon ; bataille datée dans sa guerre ; dragon vivant à la date de la bataille.
- Cohérence : continuité et fiabilité « adaptation » vont ensemble ; vainqueur et camps d’une bataille appartiennent aux belligérants ; coordonnées des lieux dans le cadre de la carte ; bonne réponse d’une question parmi ses choix ; chaîne d’interface reprise du lexique identique à son entrée.
- Écriture : tiret cadratin, point d’exclamation et notes de travail (qui parlent du procédé de vérification ou citent des noms de champs) sont signalés en avertissement.

## Avertissements

### interface (3)

- content/interface/ui.v2-savoirs.json « v2.lexicon.theme.feu-et-dragons » : clé hors de la convention domaine.nom.
- content/interface/ui.v2-savoirs.json « v2.lexicon.theme.lieux-et-peuples » : clé hors de la convention domaine.nom.
- content/interface/ui.v2-savoirs.json « v2.lexicon.theme.religion-et-magie » : clé hors de la convention domaine.nom.

## Références non résolues

### Personnes absentes de la généalogie (95 noms)

Elles restent des `EntityRef` sans identifiant. Le nombre entre parenthèses compte les citations.

- Barristan Selmy (7)
- Duncan le Grand (6), en anglais : Duncan the Tall
- Septon Barth (6)
- Criston Cole (5)
- Eddard Stark (5)
- Larys Strong (5)
- Tywin Lannister (5)
- Hugh le Marteau (4), en anglais : Hugh Hammer
- Jon Snow (4)
- Jorah Mormont (4)
- Orties (Nettles) (4), en anglais : Nettles
- Otto Hightower (4)
- Ulf le Blanc (4), en anglais : Ulf the White
- Illyrio Mopatis (3)
- Marwyn (3)
- Alfred Broome (2)
- Argilac Durrandon (2)
- Arthur Dayne (2)
- Benjicot Nerbosc (2), en anglais : Benjicot Blackwood
- Borros Baratheon (2)
- Cregan Stark (2)
- Harren le Noir (2), en anglais : Harren the Black
- Jaime Lannister (2)
- Jon Arryn (2)
- Jon Connington (2)
- Meria Martell (2)
- Oswell Whent (2)
- Quaithe (2)
- Roderick Dustin (2)
- Samwell Tarly (2)
- Stannis Baratheon (2)
- Willem Darry (2)
- Aegon (« Griff le Jeune ») (1), en anglais : Aegon (“Young Griff”)
- Alaric Stark (1)
- Amory Lorch (1)
- Argella Durrandon (1)
- Aurion (1)
- Brandon Stark (1)
- Cersei Lannister (1)
- Daemon Velaryon (1)
- Damon Morrigen (1)
- Denys Darklyn (1)
- Deria Martell (1)
- Edmyn Tully (1)
- Euron Greyjoy (1)
- Gaemon Cheveux-Pâles (1), en anglais : Gaemon Palehair
- Garin le Grand (1), en anglais : Garin the Great
- Gerold Hightower (1)
- Gormon Peake (1)
- Gregor Clegane (1)
- Harlan Tyrell (1)
- Harren le Rouge (1), en anglais : Harren the Red
- Hazzea (1)
- Hobert Hightower (1)
- Hoster Tully (1)
- Howland Reed (1)
- Jaenara Belaerys (1)
- Jeyne Arryn (1)
- Jhaqo (1)
- Kermit Tully (1)
- Kraznys mo Nakloz (1)
- le Berger (1), en anglais : the Shepherd
- Lewyn Martell (1)
- Loren Ier Lannister (1), en anglais : Loren I Lannister
- Lyman Beesbury (1)
- Lyonel Baratheon (1)
- Lyonel Strong (1)
- Lyonel Tyrell (1)
- Mace Tyrell (1)
- Maelys Feunoyr (1), en anglais : Maelys Blackfyre
- Manfred Hightower (1)
- Mern IX Jardinier (1), en anglais : Mern IX Gardener
- Mirri Maz Duur (1)
- Missandei (1)
- Nymeria (1)
- Nymor Martell (1)
- Ormund Hightower (1)
- Pyat Pree (1)
- Quentyn Martell (1)
- Randyll Tarly (1)
- Rickard Stark (1)
- Ronnel Arryn (1)
- Sharako Lohar (1)
- Sharra Arryn (1)
- Simon Strong (1)
- Steffon Darklyn (1)
- Torrhen Stark (1)
- Trystane Truefyre (1)
- Tyland Lannister (1)
- Tyrion Lannister (1)
- Unwin Peake (1)
- Varys (1)
- Vickon Greyjoy (1)
- Walter Whent (1)
- Xaro Xhoan Daxos (1)

### Dragons absents du registre (1)

- Terrax (1)

### Lieux sans fiche (26)

- Dorne (9)
- Donjon Rouge (6)
- le Conflans (5)
- le Bief (3)
- le Val (3)
- Qohor (3)
- mer Dothrak (2)
- Qarth (2)
- Westeros (2)
- baie des Naufrageurs (1)
- Ghis (l'antique) (1)
- îles de Fer (1)
- la Néra (1)
- La Treille (1)
- Lorath (1)
- mer d’Été (1)
- mer Fumante (1)
- Murs-Blancs (1)
- Norvos (1)
- Pierremoûtier (1)
- Pyk (1)
- Rhoyne (1)
- route Royale (1)
- Sothoryos (1)
- terres de l’Orage (1)
- Torth (1)

## Noms résolus par la table d’alias

- Rhaenys Targaryen (sœur d’Aegon Ier) -> rhaenys (9)
- Brynden Rivers (Freuxsanglant) -> brynden-rivers (6)
- Robert Baratheon -> robert-i-baratheon (5)
- Aegor Rivers (Aigracier) -> aegor-rivers (4)
- Aemon Targaryen (mestre) -> aemon-fils-maekar-i (3)
- Rhaella Targaryen -> rhaella-fille-jaehaerys-ii (3)
- Aemon le Chevalier-Dragon -> aemon-fils-viserys-ii (2)
- Aerion Targaryen -> aerion-peyredragon (2)
- Baelon Targaryen -> baelon-fils-jaehaerys-i (2)
- Baelor Targaryen (Briselance) -> baelor-fils-daeron-ii (2)
- Daemon Feunoyr -> daemon-i-blackfyre (2)
- Duncan Targaryen (prince des Libellules) -> duncan (2)
- Aerion Targaryen (le Flamboyant) -> aerion-fils-maekar-i (1)
- Aerys Targaryen (seigneur de Peyredragon) -> aerys-peyredragon (1)
- Baelon Targaryen (seigneur de Peyredragon) -> baelon-peyredragon (1)
- Elaena Targaryen -> elaena-peyredragon (1)
- Elaena Targaryen (sœur de Baelor) -> elaena-fille-aegon-iii (1)
- Haegon Feunoyr -> haegon-blackfyre (1)
- Mariah Martell -> myriah-martell (1)
- Rhaena Targaryen (sœur de Baelor) -> rhaena-fille-aegon-iii (1)

## Traductions anglaises manquantes

0 champ(s) français sans anglais : dans les fichiers générés, l’anglais reprend le français. Détail, au format des fichiers attendus, dans `reports/qa/content-missing-en.json`.

## Transformations appliquées

- Certitude des unions et des filiations : « etabli » devient « etabli », « conteste » devient « contradictoire », « incertain » devient « legende ».
- Certitude de date « contestee » rendue par « approximative ».

## Notes

- Événement « p5-gosier » : dateCertainty « contestee » rendue par « approximative » (le contrat n'a pas cette valeur) ; la divergence reste dite dans dateNote.
- Événements qui citent une personne hors des années de sa vie (mention posthume ou anticipée, à relire) :
  - p2-naissance-aegon (-27) cite « Rhaenys Targaryen » (-26 à 10)
  - p4-mort-maegor (48) cite « Visenya Targaryen » (-29 à 44)
  - p5-mariage-laenor (114) cite « Lucerys Velaryon » (115 à 129)
  - p5-mariage-laenor (114) cite « Joffrey Velaryon » (117 à 130)
  - p8-qarth (299) cite « Rhaegar Targaryen » (259 à 283)
