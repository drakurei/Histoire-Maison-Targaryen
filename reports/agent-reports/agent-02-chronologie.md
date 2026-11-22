# Rapport de l'agent 02 — chronologie de la dynastie

Date d'exécution : 13 novembre 2026.

## Résultat en bref

La chronologie de référence compte **125 événements** en huit périodes : 117 dans la continuité des livres, 8 propres aux séries et tenus à part. S'y ajoutent **18 souverains** (17 rois et Rhaenyra, hors numérotation), **28 dragons**, **20 sources** enregistrées (dont deux entrées collectives) et **6 questions ouvertes**.

Les quatre fichiers JSON se parsent avec `node`. Les 418 références de source qu'ils contiennent renvoient toutes à une entrée du registre.

Aucun ouvrage n'a été consulté directement : les faits viennent de la connaissance qu'a l'agent des livres, contrôlée en ligne sur un wiki de lecteurs. 108 événements sur 125 ont été recoupés ainsi ; 17 ne l'ont pas été et sont marqués.

Six fichiers ont été écrits, et rien d'autre n'a été modifié :

- `content/sources/sources.json`
- `content/timeline/timeline.json`
- `content/timeline/sovereigns.json`
- `content/dragons/dragons.json`
- `documentation/history/notes-historien.md`
- ce rapport.

## Statistiques

### Événements par période et par niveau de fiabilité

| Période | Bornes | Établi | Récit unique | Contradictoire | Légende | Adaptation | Total | Non recoupés |
|---|---|---|---|---|---|---|---|---|
| I. La civilisation valyrienne | … → 102 av. C. | 5 | 4 | 0 | 3 | 0 | 12 | 2 |
| II. Les origines de la Maison | 114 → 2 av. C. | 8 | 3 | 0 | 0 | 0 | 11 | 4 |
| III. La Conquête | 2 av. C. → 2 AC | 12 | 0 | 0 | 0 | 1 | 13 | 3 |
| IV. Les premiers règnes | 1 → 129 | 13 | 1 | 1 | 0 | 0 | 15 | 0 |
| V. La Danse des Dragons | 105 → 153 | 18 | 0 | 8 | 0 | 3 | 29 | 3 |
| VI. Les générations suivantes | 131 → 262 | 12 | 3 | 0 | 0 | 0 | 15 | 2 |
| VII. La fin de la dynastie | 262 → 298 | 10 | 2 | 1 | 0 | 0 | 13 | 0 |
| VIII. L'héritage | 298 → 300 | 10 | 2 | 1 | 0 | 4 | 17 | 3 |
| **Total** | | **88** | **15** | **11** | **3** | **8** | **125** | **17** |

La Danse compte 26 événements des livres, au-dessus de la fourchette demandée (18 à 24). Les périodes IV et VI en comptent 15, une de plus que la cible haute. J'ai préféré ne pas fusionner des faits distincts ; l'orchestrateur peut en retirer.

### Certitude des dates

| `dateCertainty` | Événements |
|---|---|
| exacte | 70 |
| approximative | 33 |
| inconnue | 21 |
| contestée | 1 |

Les 21 dates inconnues se répartissent ainsi : 13 événements anciens que les ouvrages ne datent pas (périodes I et II), et les 8 événements de séries, qui n'ont pas de place dans la chronologie des livres.

### Souverains et dragons

- Souverains : 16 fiches sur 18 recoupées en ligne. Daeron Ier et Viserys II ne l'ont pas été directement.
- Dragons : 28 fiches, toutes recoupées. 20 ont une couleur d'écailles écrite dans les livres, 1 n'a que la couleur de ses flammes, 7 n'ont aucune couleur écrite.

## Méthode

1. **Rédaction à partir des ouvrages.** Chaque événement cite l'ouvrage et, quand il est connu, la section ou le chapitre. Les résumés sont originaux, en français et en anglais ; aucune phrase n'est reprise d'un livre, d'un wiki ou d'une série.
2. **Contrôle en ligne.** Dates, noms et renvois de chapitres ont été comparés aux fiches de *A Wiki of Ice and Fire*, qui cite les ouvrages chapitre par chapitre. Le wiki n'apparaît dans aucun champ `sources` d'événement.
3. **Deux champs distincts pour deux questions.** `reliability` dit si le fait est solide ; `dateCertainty` dit si sa date l'est. Un fait établi peut avoir une date approximative.
4. **Ne pas trancher.** Quand la chronique donne plusieurs versions d'une mort ou d'une filiation, l'événement est classé `contradictoire` et sa note énumère les versions.
5. **Séparation des continuités.** Les événements de séries ont un identifiant en `tv-`, le niveau `adaptation`, et ne citent que des séries. Le script de génération refuse tout mélange.
6. **Génération et validation.** Les JSON sont produits par un script gardé hors du dossier du projet. Il contrôle : identifiants uniques, sources et niveaux existants, absence d'an 0, cohérence entre `year` et `dateCertainty`, événements dans les bornes de leur période, dragons et lieux présents dans leurs listes de référence, continuité des règnes d'un roi au suivant.

### Champs ajoutés au schéma demandé

Tous sont additifs ; aucun champ demandé n'a été retiré ni renommé.

| Champ | Où | Pourquoi |
|---|---|---|
| `sortYear` | événements | Toujours numérique, pour trier même quand `year` vaut `null` |
| `yearLabelFr`, `yearLabelEn` | événements | Libellé prêt à afficher (« v. 300 av. C. », « date inconnue ») |
| `dateNoteFr`, `reliabilityNoteFr` | événements | Ce qui est incertain, en une phrase |
| `verifiedOnline` | événements, souverains, dragons | Recoupé en ligne pendant cette exécution, ou non |
| `gazetteer` | chronologie | Correspondance des noms de lieux français et anglais |
| `openQuestions` | période VIII | Six questions non résolues : établi, hypothèse, adaptation |
| `ordinal`, `claimantsNotCounted` | souverains | Numéro d'ordre officiel ; prétendants non comptés |
| `colorKey`, `extraTextualNoteFr`, `nameFrCandidate` | dragons | Clé de couleur pour le design ; couleurs hors texte ; nom français à confirmer |

**Point d'attention pour les consommateurs :** `year` vaut `null` pour 21 événements. Utiliser `sortYear` pour trier et `yearLabel*` pour afficher.

## Ce qui a été vérifié en ligne

Environ 75 pages de *A Wiki of Ice and Fire* ont été lues, via un outil qui restitue un résumé de la page et non son texte.

- **Chronologie générale** : frise des grands événements, années avant la Conquête, années 129, 130 et 131.
- **Valyria** : Possessions, Fléau, Siècle de sang, Aenar Targaryen.
- **Rois** : Aegon Ier (par l'adresse de redirection), Aenys Ier, Maegor Ier, Jaehaerys Ier, Viserys Ier, Aegon II, Rhaenyra, Aegon III, Baelor Ier, Aegon IV, Daeron II, Aerys Ier, Maekar Ier, Aegon V, Jaehaerys II, Aerys II.
- **Événements** : Conquête, Champ de Feu, Première Guerre dornienne, soulèvement de la Foi Militante, Grand Conseil de 101, Danse des Dragons, assaut de Fossedragon, seconde bataille de Tumbleton, régence d'Aegon III, rébellions Feunoyr, tragédie de Lestival, tournoi de Harrenhal, rébellion de Robert, tour de la Joie.
- **Personnages** : Rhaegar, Daenerys, mestre Aemon, Aegon fils de Rhaegar, théories sur Jon Snow.
- **Dragons** : la page générale et 28 fiches individuelles.
- **Chandelles de verre** : la fiche, lue deux fois avec des questions différentes.

## Ce qui n'a pas été vérifié

- **Pages illisibles** malgré plusieurs essais : fiche générale de la Maison Targaryen, Daeron Ier, Viserys II, années 27 et 29 av. C., une page de catégorie. Je n'ai pas cherché à contourner ces échecs. Les dates de Daeron Ier et de Viserys II sont déduites des fiches voisines : Aegon III (successeur âgé de quatorze ans en 157), Baelor Ier (avènement en 161, mort en 171), Rhaenyra (Viserys né en 122), Aegon IV (avènement en 172).
- **Dix événements des livres** : liste des seigneurs de Peyredragon, double mariage d'Aegon, Table peinte, offre d'Argilac, proclamation d'Aegon, forge du Trône de Fer, prophétie sur l'or de Castral Roc, vol de Jaenara Belaerys, conquête de Dorne par Daeron Ier, règne de Viserys II.
- **Sept événements de séries** sur huit. Les numéros d'épisode sont donnés de mémoire.
- **Les noms français.** Lieux, épithètes royales et noms de dragons traduits viennent de la mémoire de l'agent. Aucun n'a été contrôlé en ligne.
- **Les titres français** de plusieurs ouvrages (`titleFrVerified: false`).
- **Les ouvrages eux-mêmes.** Aucun n'a été ouvert. Un renvoi de chapitre peut être faux d'une unité.

L'outil de lecture a produit deux résumés erronés, repérés par recoupement : la bataille du Gosier placée en 129 sans mention de l'écart, et le tournoi de Harrenhal daté de 280 sur une fiche alors que la fiche du tournoi donne 281. D'autres erreurs de ce type ont pu passer.

## Cohérence avec la généalogie (agent 03)

Contrôle fait en fin d'exécution, en lecture seule sur les fichiers de l'agent 03.

- Les 18 identifiants de `sovereigns.json` existent dans `content/genealogy/genealogy.json`, avec les mêmes années de naissance et de mort.
- Les fichiers de généalogie citent deux identifiants de source collectifs, `asoiaf` et `dunk-egg`, qui manquaient au registre. Je les ai ajoutés à `sources.json` comme entrées collectives (`collective: true`, avec la liste de leurs membres). Les 1 170 références de source des cinq fichiers de données renvoient désormais toutes au registre.

## Incertitudes principales

1. **Les années des romans (298–300) sont des reconstitutions.** Le texte ne donne aucune année. Elles sont toutes marquées approximatives. La naissance de Daenerys (284) et celle d'Aerys II (244) sont dans le même cas.
2. **La Conquête n'a que deux dates sûres** : le débarquement et le sacre. Les batailles sont placées en 2–1 av. C. sans plus.
3. **Les morts de la Danse.** Huit événements sur vingt-six sont classés contradictoires : la mort de Beesbury, celles d'Helaena et de Syrax, celle de Daeron, l'empoisonneur d'Aegon II, la paternité des fils de Rhaenyra, les commanditaires du Printemps rouge, la date du Gosier, la cause de la mort du dernier dragon.
4. **La fin de la dynastie repose sur des souvenirs.** La nature de la disparition de Lyanna, le combat de la tour de la Joie (connu par un rêve) et la mort du petit Aegon ne sont pas établis au même degré que les batailles.
5. **Ce qui n'est pas dans les livres.** La filiation de Jon Snow et l'identité de « Griff le Jeune » sont des questions ouvertes. Elles figurent dans `openQuestions`, jamais dans les faits.

Viennent ensuite : la cause du Fléau, celle de l'incendie de Lestival, celle de la mort du dernier dragon ; les naissances non données d'Aerys Ier et de Maekar Ier ; le sort d'Orties et des dragons survivants.

## Réponse à la direction artistique : les chandelles de verre

Détail en section 7 de `documentation/history/notes-historien.md`. En résumé :

- Elles apparaissent dans cinq passages des romans, surtout dans *A Feast for Crows* (prologue et chapitre 45).
- **Établi** : objets d'obsidienne venus de Valyria, hauts, torses, à arêtes vives ; la Citadelle en garde quatre ; l'une brûle chez l'archimestre Marwyn, d'une lumière pâle, fixe, qui fausse les couleurs.
- **Parole d'un seul personnage** : leurs pouvoirs (voir au loin, entrer dans les rêves, se parler à distance).
- **Rumeur ou déduction** : qu'elles brûlent à Qarth ; que leur réveil soit lié au retour des dragons.
- **Aucun texte ne les relie aux Targaryen.**

L'usage du sceau est fidèle pour la forme et pour le sens, avec trois réserves : c'est un objet valyrien et non targaryen ; le halo qui « respire » contredit la lumière immobile que décrit le roman ; le socle est une addition du dessin.

## Propositions

1. **Rendre le halo du sceau fixe.** C'est la seule correction de fidélité que je recommande sur le dessin. Le reste relève de la licence.
2. **Adopter la phrase de colophon proposée** dans la note, ou une autre qui garde le conditionnel et ne nomme pas les Targaryen.
3. **Marquer visuellement les trois états du savoir.** Les niveaux `contradictoire`, `legende` et `adaptation` méritent chacun un signe distinct ; le cahier artistique prévoit déjà la cire pour le niveau de fiabilité.
4. **Donner aux dragons sans couleur écrite un traitement « non décrit »** (hachure), plutôt qu'une couleur empruntée à une série.
5. **Faire relire les noms français** par quelqu'un qui dispose des éditions françaises : noms de dragons traduits, épithètes royales, lieux de la Danse.
6. **Confier à l'agent de généalogie** les identifiants de `sovereigns.json` comme clés communes, et la liste `claimantsNotCounted` pour les branches rivales.
7. **Ne pas afficher une année seule pour les romans.** Préférer le libellé « v. 299 AC », ou le tome et le chapitre.
8. **Prévoir un second passage de vérification** sur les 17 événements non recoupés et sur les numéros de chapitres, de préférence avec les ouvrages.
