# Rapport de l'agent 03 — Généalogiste Targaryen

13 novembre 2026 · continuité : livres uniquement

## Résultat

Le graphe généalogique d'Aenar à Daenerys est livré et validé : **176 personnes, 69 unions, 132 filiations, 0 erreur** au script de validation. Huit filiations et deux unions sont marquées contestées ou incertaines ; aucune n'est présentée comme établie. Les prénoms et épithètes français n'ont pas pu être vérifiés en ligne.

| Livrable | Chemin |
|---|---|
| Graphe | `content/genealogy/genealogy.json` |
| Script de validation | `content/genealogy/validate-genealogy.mjs` |
| Table des successions | `content/genealogy/succession.json` |
| Note (incertitudes, homonymes, adaptations, analyse du « fil unique ») | `documentation/history/notes-genealogie.md` |
| Ce rapport | `reports/agent-reports/agent-03-genealogie.md` |

## Méthode

1. **Première saisie** de mémoire des ouvrages (F&B, TWOIAF, ASOIAF, Dunk et l'Œuf), dans un générateur jetable placé hors du projet (`/tmp`), qui calcule les générations et écrit le JSON. Le JSON livré est désormais la référence ; le générateur n'est pas conservé.
2. **Recoupement en ligne** fiche par fiche sur *A Wiki of Ice and Fire* (AWOIAF) : dates, parents, conjoints, enfants, formulation des rumeurs. Chaque écart avec la première saisie a été corrigé ou consigné.
3. **Validation** par script, puis onze essais négatifs (identifiant en double, référence absente, cycle, naissance avant le parent, naissance posthume tardive, règne hors de la vie, énumération invalide, JSON tronqué, fil principal rompu) : le script sort bien en erreur dans chaque cas.
4. **Analyse** demandée par le directeur artistique, entièrement tirée des sorties du script.

Choix de modélisation à connaître :

- `born` et `died` ne portent une année que si une source la donne. Sinon `null`, avec `bornRange` / `diedRange` quand AWOIAF fournit des bornes calculées. Aucune année médiane n'a été inventée.
- `king: true` seulement pour qui figure sur les listes officielles des rois. Rhaenyra, Viserys « III », Daenerys et les Feunoyr portent un champ `pretender`.
- Père officiel dans `father`, père allégué dans `allegedFather` : le graphe principal suit la filiation officielle, la contestation reste lisible.
- `generation` = 1 + la plus grande génération des parents. Daenerys est à la génération 19.
- Champs ajoutés au schéma demandé, tous optionnels : `verifiedOnline`, `bornRange`, `diedRange`, `pretender`, `alive`, `noteFr`, `mainThread`, `unions[].endYear`, `parentage[].allegedFather`, et un bloc `conventions` en tête de fichier. Dans `succession.json` : `order`, `official`, `parentChild`, `passedOver`.
- Robert Baratheon est inclus (`king: true`, maison Baratheon) pour clore la table des successions en 283. Tout comptage de « rois Targaryen » doit filtrer sur `house`.

## Ce qui a été vérifié en ligne, et ce qui ne l'a pas été

**Vérifié sur AWOIAF (un peu plus de 80 fiches lues)** : 160 personnes sur 176 portent `verifiedOnline: true`. Sont recoupés : la lignée de Peyredragon (par les fiches d'Aenar, Daenys, Aerys fils d'Aegon, Valaena, Visenya, Orys Baratheon), les rois d'Aenys Ier à Aerys II, les treize enfants de Jaehaerys Ier, la génération de la Danse, la branche Velaryon, les enfants d'Aegon III à Rhaegar, les Grands Bâtards, la maison Feunoyr.

**Limites de cette vérification, à ne pas surestimer :**

- L'outil de lecture renvoie un **résumé produit par un petit modèle**, pas la page brute. Plusieurs résumés étaient tronqués ou fautifs (plages d'années collées du type « 178183 », une date manifestement erronée pour Daeron fils d'Aerys II). Deux fiches se sont contredites sur la même date. Une relecture humaine des dates approximatives reste utile.
- **Les ouvrages eux-mêmes n'ont pas été consultés.** Le champ `sources` indique l'ouvrage auquel la relation est attribuée, sans chapitre ni page. L'attribution à *The Rise of the Dragon* repose sur le périmètre connu du livre (d'Aegon Ier à la régence d'Aegon III) et n'a pas été contrôlée entrée par entrée.

**Non vérifié :**

- **Fiches AWOIAF illisibles** (erreur du site à chaque essai) : Aegon Ier, Viserys II, Daemon Ier Feunoyr, Daeron Ier, Gaemon fils d'Aenar, la page « House Targaryen » sous son adresse principale et le gabarit de l'arbre de Peyredragon. Leurs dates ont été recoupées indirectement par les fiches des parents, conjoints et enfants, sauf la naissance d'Aegon Ier (27 av. C., de mémoire).
- **Accès direct par `curl`** : refusé par le proxy de la session (hôte non autorisé). Non contourné.
- **Site francophone La Garde de Nuit** : la lecture demandait une approbation que personne n'a donnée. **Aucun prénom, épithète ou toponyme français n'a donc été vérifié en ligne** ; ils viennent de ma mémoire des éditions françaises.
- **16 personnes à `verifiedOnline: false`** : aegon-i, alys-harroway, addam-velaryon, harwin-strong, mysaria, jaehaerys-fils-aegon-ii, corwyn-corbray, mya-rivers, gwenys-rivers, ormund-baratheon, daeron-fils-aerys-ii, lyanna-stark, drogo, rhaego, hizdahr-zo-loraq, daario-naharis. Leur existence et leur lien sont sûrs ; c'est une date ou le détail d'une fiche qui n'a pas été recoupé.
- **La liste des relations propres aux séries** (section 4 de la note) est dressée de mémoire, sauf l'épouse « Elaena » d'Aenar, signalée par AWOIAF.

## Statistiques du script (dernière exécution, code de sortie 0)

```
Personnes  : 176
  par maison      : targaryen 103 · velaryon 14 · aucune 11 · blackfyre 8 · baratheon 7 · penrose 6 · hightower 3 · arryn 3 · martell 3 · plumm 2 · blackwood 2 · 14 autres maisons à 1
  par sexe        : m 97 · f 79
  par légitimité  : legitime 164 · batard 4 · legitime-par-decret 8
  dates           : exacte 89 · approximative 43 · inconnue 44
  rois (king)     : 18 dont 17 Targaryen
  prétendants     : 8
  vérifiées en ligne : 160 / 176
Unions     : 69
  par type        : mariage 57 · liaison 11 · fiancailles 1
  par certitude   : etabli 67 · incertain 2
Filiations : 132
  par certitude   : etabli 124 · conteste 7 · incertain 1

Générations : 0 à 20
  largeur maximale : 18 personnes (génération 14) ; 15 nées dans l'arbre (génération 9)
  par génération   : 1, 2, 2, 2, 3, 2, 4, 9, 9, 16, 9, 11, 17, 15, 18, 14, 14, 9, 3, 13, 3

Unions entre proches parents (les deux conjoints dans l'arbre) : 23 sur 69
  frère-sœur 13 · demi-frère-demi-sœur 1 · oncle-nièce 1 · demi-oncle ou demi-tante 3 · cousins germains 5
Personnes ayant plusieurs unions : 16 (dont 12 plusieurs mariages)

Fil principal : 20 personnes, 19 liens ; 11 rois Targaryen sur 17 sur le fil ; 1 lien contesté (daeron-ii)

Successions : 20 entrées, dont 17 passages officiels (16 entre rois Targaryen)
  entre rois Targaryen : 9 de parent à enfant, 7 autrement
  en comptant 283 : 8 passages hors parent-enfant sur 17
  par mode (officiels) : hérédité directe 10 · guerre 4 · Grand Conseil 2 · usurpation 1
  passages contestés (officiels) : 6

Résultat : 0 erreur.
```

Contrôles effectués par le script : JSON valide ; identifiants uniques (personnes et unions) ; énumérations ; toute référence existe ; un seul enregistrement de filiation par enfant ; sexe cohérent du père et de la mère ; les parents sont bien partenaires de l'union citée ; aucun cycle d'ascendance ; enfant né après ses parents ; enfant né au plus un an après la mort du père et pas après celle de la mère ; union conclue du vivant des deux conjoints ; mort après la naissance ; règne et prétention compris dans la vie ; génération égale à 1 + le maximum des parents ; une seule racine ; aucune personne isolée ; toute filiation non établie porte une note ; fil principal continu ; cohérence de `succession.json` avec les règnes et les filiations. Les comparaisons de dates n'échouent que lorsque la violation est certaine compte tenu des bornes.

## Incertitudes principales

Détail et sources dans la note, section 2.

- **Contestées (père allégué nommé)** : Jacaerys, Lucerys et Joffrey Velaryon (Laenor ou Harwin Strong) ; Daeron II (Aegon IV ou Aemon le Chevalier-Dragon) ; Addam et Alyn Velaryon (Laenor ou Corlys) ; Viserys Plumm (Ossifer Plumm ou Aegon IV).
- **Incertaines** : Orys Baratheon, fils d'Aerion (rumeur) ; liaison Rhaenyra–Harwin Strong ; nature de la relation Rhaegar–Lyanna Stark.
- **Établies avec réserve** : paternité d'Aenys Ier (rumeur sans suite) ; mariage d'Aegon et Elaena de Peyredragon (déduit du texte) ; Aegor Rivers et Calla Feunoyr enregistrés comme fiançailles ; Aegon fils de Rhaegar (mort en 283 selon la version reçue, identité de « Griff le Jeune » non tranchée).
- **Exclus faute de nom ou de filiation vérifiable** : liste en section 2.4 de la note (bâtards de Saera, Maelys Feunoyr, enfants morts sans nom, cinq des neuf maîtresses d'Aegon IV, etc.).

## Divergences de dates à signaler à l'historien (agent 02)

À trancher ensemble avant que la chronologie ne reprenne ces années. La colonne « retenu » indique ce que porte `genealogy.json`.

| Sujet | Divergence constatée | Retenu |
|---|---|---|
| Début du règne d'Aegon Ier | La Conquête dure de 2 av. C. à 1 apr. C. ; le comput n'a pas d'an 0 | règne [1, 37] |
| Rhaenys, sœur du Conquérant | naissance 26 ou 25 av. C. ; mort en 10 « discutée » selon AWOIAF | −26 (approx.), 10 |
| Mariage de Jaehaerys Ier et Alysanne | mariage secret en 49, cérémonie publique ultérieure (51 selon la fiche lue) | 49 |
| Mariage d'Alyssa Velaryon et Rogar Baratheon | fin 49 (AWOIAF) ; parfois daté de 50 | 49 |
| Boremund Baratheon | naissance 52 (AWOIAF) ; je l'aurais placée en 50 de mémoire | 52 |
| Aegon, fils de Jaehaerys Ier | 51–51 sur sa fiche ; « mort en 52 » dans le résumé de la fiche du roi | 51–51 |
| Baelon, fils de Jaehaerys Ier | naissance 57 (sa fiche, fiche du roi) ou 58 (résumé de la fiche d'Alysanne) | 57 |
| Gaemon, fils de Jaehaerys Ier | mort en 73 (sa fiche) ou « début 74 » (fiche d'Alysanne) | 73 |
| Valerion | 77–78 (sa fiche) ; 76–77 dans un résumé | 77–78 |
| Mariage d'Aemon et Jocelyn Baratheon | fiançailles 68, mariage 70 | 70 |
| Aegon, fils de Baelon | mort « l'année suivante » ou « six mois plus tard » | 84–85 (approx.) |
| Laena Velaryon | naissance fin 92, et non 93 | 92 |
| Mariages de Baela et de Rhaena (filles de Daemon) | 132 selon AWOIAF ; 133 de mémoire | 132 |
| Mariage d'Aegon III et Jaehaera | 131, déduit (« morte deux ans après son mariage », en 133) | 131 |
| Aemon le Chevalier-Dragon | mort bornée à 178–183 ; TWOIAF le lie à l'affaire Toyne (178) | `null`, plage [178, 183] |
| Naerys | morte « un an après Aemon » : 179–184 | `null`, plage [179, 184] |
| Fils cadets de Daeron II | naissances connues par plages seulement : Aerys Ier 172–176, Rhaegel 173–178, Maekar Ier 174–179 | `null` + plages |
| Brynden Rivers | naissance 174 ou 175 | 175 (approx.) |
| Mariage de Daemon Feunoyr et Rohanne de Tyrosh | « à quatorze ans » : 184, déduit | 184 |
| Deuxième rébellion Feunoyr | 211 ou 212 selon les fiches | prétention datée de 212 |
| Daeron l'Ivrogne | naissance 190 ou 191 ; mort entre 221 et 233 | `null` + plages |
| Duncan, Rhaelle, Rhaella, Elia Martell | naissances connues par plages : 220–224, 229–234, 245–247, 256–257 | `null` + plages |
| Daeron, fils d'Aerys II | 269 de mémoire ; le résumé de la fiche affichait 279, incompatible avec l'ordre des naissances | 269 (approx.), **à revérifier** |
| Aegon, fils de Rhaegar | né « vers le nouvel an 282 » | `null`, plage [281, 282] |
| Mort de Rhaegar | 283 ; les premiers tirages de TWOIAF donnaient 282 | 283 |
| Steffon Baratheon | mort en 278 ou début 279 | 278 (approx.) |
| Rhaego | mort-né en 298 ou 299 | `null`, plage [298, 299] |
| Graphies | Myriah / Mariah Martell ; Tyanna « de la Tour » / « de Pentos » | Myriah ; Tyanna de la Tour |

## Français : ce qui reste à confirmer

Par l'agent chargé de la langue ou par la traduction française des ouvrages :

- **Épithètes laissées à `null`** faute de certitude : Aegon *the Uncrowned*, Rhaenyra *the Realm's Delight*, Daeron *the Daring*, Daena *the Defiant*, Harwin *Breakbones*, Mysaria *Lady Misery*, Betha *Black Betha*.
- **Épithètes renseignées mais non vérifiées**, par ordre de doute : « le Fléau des Dragons » (Aegon III), « le Prince Vaurien » (Daemon), « le Flamboyant » (Aerion), « le Brave » (Baelon), « Poing-de-Chêne » (Alyn Velaryon), « le Dragon noir » (Daemon Feunoyr), « la Bonne Reine » (Alysanne), « le Roi Gueux » (Viserys).
- **Noms** : « Marilda de Hull » (Hull a peut-être un nom français), « Shiera Astre-des-mers » (graphie reprise du cahier des charges), « Jenny de Vieilles-Pierres », « Tyanna de la Tour ».
- **Toponymes** laissés en anglais dans les notes quand je n'étais pas sûr : Starpike, Tumbleton, Whitewalls ; le dragon Quicksilver.

## Réponse sur le « fil vertical unique »

Tenable, à une condition : **le fil est la filiation, pas la couronne**. Développement et chiffres en section 5 de la note.

- La couronne quitte la filiation 7 fois sur 16 entre rois Targaryen, saute une génération en 103 et **remonte** d'une génération en 171 (de Baelor Ier à son oncle Viserys II).
- 23 unions sur 69 lient des proches parents, dont 13 mariages entre frère et sœur : il y a 640 chemins de filiation d'Aenar à Daenerys pour 37 ancêtres distincts.
- Un fil de 20 personnes, une par génération, relie Aenar à Daenerys en passant par Viserys Ier et Rhaenyra. Il porte 11 rois sur 17 ; les 6 autres sont tous sur la rangée d'un maillon du fil. Il est enregistré dans `mainThread.ids` et contrôlé par le script.
- Recommandation : fil = filiation ; couronne en seconde couche numérotée, qui s'écarte et revient ; union consanguine dessinée comme un nœud, jamais comme un doublon ; fratries repliées avec compteur ; branches rivales en rameaux latéraux ; traits différents selon la certitude.

## Propositions

1. **Agent 02 (historien)** : reprendre les identifiants de `genealogy.json` dans la chronologie, et trancher le tableau des divergences ci-dessus. Je propose que la chronologie ne duplique aucune date de naissance ou de mort, mais renvoie au graphe.
2. **Agent 13 (tests)** : brancher `node content/genealogy/validate-genealogy.mjs` dans la suite de tests ; il sort en code 1 à la moindre incohérence.
3. **Agent linguistique** : valider `nameFr` et `epithetFr` contre les éditions françaises, et remplir les sept épithètes laissées vides.
4. **Dragons** (`content/dragons`) : lier chaque dragon à son ou ses dragonniers par ces mêmes identifiants, pour que l'arbre puisse afficher les montures sans seconde base de noms.
5. **Références fines** : une seconde passe pourrait ajouter chapitre et page à chaque `sources`, avec les ouvrages en main. C'est le principal manque de cette première structure.
6. **Adaptations** : si une version du site veut montrer les écarts des séries, les placer dans un fichier séparé superposable, jamais dans `genealogy.json`.
7. **Extensions possibles**, à décider selon le besoin éditorial : les cinq autres maîtresses d'Aegon IV et leurs enfants, la descendance Martell de Daenerys (fille d'Aegon IV), les frères de Robert Baratheon, les fiançailles rompues des enfants d'Aegon V.
