# Rapport de l'agent 06 — Architecture UX et de l'information (tâche B4)

13 novembre 2026.

## 1. Livrables

| Fichier | Contenu |
|---|---|
| `documentation/design/ux-architecture.md` | Plan du site et schéma d'URL, navigation, règle des trois interactions, modèle de contenu, stratégie de langue, recherche et filtres, six parcours avec critères mesurables, analyse des trois directions, accessibilité et mobile, réponses aux points ouverts, seize assertions pour l'agent QA, raccord avec les données livrées. |
| `design/wireframes/wireframes.md` | 50 cadres ASCII pour 16 écrans (W00 à W15), bureau et mobile, annotés ; trois annexes (jeu d'essai de la recherche, rubriques sans forme valyrienne, part de valyrien par écran). |
| `reports/agent-reports/agent-06-ux-architecture.md` | Ce rapport. |

Aucun autre fichier du projet n'a été créé ni modifié. Le petit script qui aligne les cadres des wireframes est resté dans `/tmp`.

## 2. Ce qui a été vérifié, et ce qui ne l'a pas été

| Vérification | Méthode | Résultat |
|---|---|---|
| Alignement des wireframes | Script : chaque ligne d'un cadre a la largeur de sa première bordure et commence et finit par un bord. | 50 cadres, aucune ligne hors gabarit. |
| Valyrien employé | Script : tout mot portant un macron ou un ñ dans mes deux documents, et tout mot placé devant une glose dans les wireframes, est recherché dans `lexicon.json`. | Aucun mot absent. Une faute corrigée en cours de route : j'avais abrégé le nom de la langue en « Valyrio », qui veut dire « de Valyria » ; le sélecteur porte maintenant *Valyrio Ēngos*, forme du lexique. |
| Comptes du lexique | Relus dans le fichier et dans le rapport de l'agent 04 (87 entrées ; 56 / 15 / 15 / 1 ; 11 non revérifiées). | Conformes. |
| Exemples et volumétrie | Les données des agents 02 et 03 ont été livrées pendant ce travail. Je les ai interrogées par script en fin de travail et j'ai réaligné mes exemples et mes chiffres : 176 personnes, 69 unions, 125 événements, 28 dragons, 20 sources, 66 noms de lieux. | Huit erreurs ou approximations de ma part corrigées (liste en section 12.3 du document d'architecture). |

Ce qui **n'a pas** été fait :

- **Aucun prototype, aucun rendu.** Les wireframes sont des dessins en texte. Les largeurs, les hauteurs de ligne et la tenue de la barre à 360 px sont des intentions.
- **Aucun test avec des personnes.** La stratégie de langue repose sur un raisonnement, pas sur une observation. Le test qui la validerait est décrit (UX 5.10).
- **Aucun essai en ouverture locale.** Les contraintes `file://` (stockage, réécriture d'adresse, chargement de données) viennent de ma connaissance des navigateurs, pas d'un essai.
- **Aucun essai de lecteur d'écran** sur du texte balisé `art-x-valyrian`.
- **Deux écrans gardent un contenu de mémoire**, faute de données : la composition des camps d'une guerre (W08) et la position et la nature des lieux (W09). C'est signalé sur place.
- **Les comptes de mots du lexique complet** (W10) sont fictifs : seul le lexique d'interface existe.

## 3. Décisions

### 3.1 Langue

1. **Le mode valyrien est une édition rubriquée, pas une traduction.** Le valyrien tient les rubriques (navigation, étiquettes, titres validés, formules, incipit) ; la langue du visiteur porte le récit. Règle : « le valyrien rubrique, la langue du visiteur raconte ».
2. **Cinq classes de texte** décident de la langue, sans arbitrage au cas par cas : formules, rubriques, titres et noms, incipit, récit. Le récit n'est jamais en valyrien.
3. **Glose visible par défaut.** Chaque rubrique valyrienne est suivie de sa traduction en petit italique. Une bascule (*Nūmāzma*) la masque. L'Index reste toujours glosé.
4. **Langue de lecture** en mode valyrien : dernier choix explicite, sinon langue du navigateur. La détection du navigateur ne sert qu'à cela ; elle ne change jamais la langue d'affichage.
5. **Sélecteur à trois positions** sur le seuil et dans la barre de toute page. Noms entiers là où la place existe, codes dans la barre.
6. **Mention d'édition** (« texte en français · pourquoi ? ») en tête de tout récit en mode valyrien, et **note sur la langue** au colophon avec les comptes d'attestation.
7. **Niveau d'attestation à la demande** (note de glose, glossaire de page, fiche de mot), et en permanence sur les phrases composées et dans le lexique.
8. **Cinq garde-fous vérifiables** : aucun valyrien tapé dans un gabarit ; pas de valyrianisation maison ; pas de repli silencieux ; un groupe d'étiquettes ne mélange pas les langues ; formes non revérifiées signalées.
9. **`<html lang>` vaut toujours la langue de lecture** ; le valyrien est balisé `art-x-valyrian` ; tout contrôle à libellé valyrien a un nom accessible bilingue.
10. **Une adresse pour les trois langues** ; paramètre `?l=` facultatif ; le choix mémorisé du visiteur l'emporte sur le paramètre.

### 3.2 Architecture et navigation

11. **Fichiers HTML réels, liens relatifs, noms de fichier explicites.** Aucune dépendance à un serveur.
12. **Même chemin relatif sous `/version-1/`, `/version-2/`, `/version-3/`.**
13. **L'identifiant d'une fiche est celui de sa donnée**, tel que livré (`aegon-i`, `p5-accalmie`, `vhagar`).
14. **L'état d'une page s'écrit après `?`** (langue, filtres, centre de l'arbre, panneau ouvert), jamais dans le chemin.
15. **Barre commune aux trois versions** : sceau, Index, Chercher, langue. Toujours visible, toujours nommée.
16. **Le portail donne tous les espaces** : huit périodes et neuf registres.
17. **La page d'un espace est son registre.** Pas de page-carrefour.
18. **Une bataille est un événement** de type bataille : une seule fiche, deux chemins.
19. **Les maisons autres que Targaryen sont des facettes**, pas des objets à fiche.
20. **Fiabilité à l'échelle du fait** : je reprends les cinq niveaux et les deux continuités de l'agent 02 plutôt que d'en inventer. Les adaptations ont leur bloc sur une fiche et leur onglet sur une période ; elles n'entrent jamais dans les annales.
21. **Registre des personnages classé par période**, pas par alphabet.
22. **Arbre à focale** (parents, fratrie, unions, enfants par union) comme vue par défaut et comme alternative accessible, dans les trois versions. Il épouse la structure de `genealogy.json`.
23. **Liste d'abord, instrument ensuite** : la carte, la frise et la planche sont des vues d'une liste toujours présente.
24. **Parcours sans mécanique de jeu** : pas de points, pas de chronomètre ; résultat en une phrase ; progression locale et effaçable.

## 4. Alternatives écartées

| Alternative | Raison |
|---|---|
| Une arborescence par langue (`/fr/`, `/en/`) | Triple les pages, impose un rechargement, casse « une adresse par objet ». |
| Routage par fragment dans une page unique (`index.html#/people/…`) | Rien à lire sans script ; contredit le cahier artistique (6.3). |
| Identifiants traduits par langue, ou en valyrien | Trois adresses pour un objet ; ou macrons retirés d'une forme visible. |
| Bascule automatique vers la langue du navigateur | Personne ne verrait plus le valyrien. |
| Valyrien sans glose par défaut | Le mur. |
| Appui long ou infobulle pour la traduction | Indécouvrable au toucher, inaccessible au clavier. |
| Marque permanente sur chaque chaîne dérivée ou composée (proposition 3 de l'agent 04) | Onze des vingt-deux chaînes du portail en porteraient une ; le losange est déjà un ornement. Remplacée par l'attestation à la demande et par une mention permanente sur les seules phrases composées. |
| Titres d'événements traduits en valyrien un par un | Liste où certains titres seraient valyriens et d'autres non ; forte incitation à composer du valyrien douteux pour combler. Un titre valyrien n'est affiché que s'il est validé. |
| Chaque rubrique rendue cliquable pour sa glose | Vingt arrêts de tabulation de plus par page. Remplacé par le glossaire de page. |
| **Fil de V2 suivant le temps et les règnes** (ma première recommandation) | Retirée après lecture des données : 87 personnes sur 176 n'ont pas de dates exactes, et l'agent 03 a établi un fil de filiation complet et vérifié. |
| Une catégorie de sources « interprétations » | Dans les données, l'interprétation est un niveau de fiabilité du fait, pas une source. Le registre le dit au lieu de fabriquer une catégorie. |
| Une fiche par maison alliée | Hors périmètre ; pas de contenu prévu. |
| Batailles comme type distinct des événements | Deux fiches pour un même fait. |
| Rôle ARIA `tree` pour l'arbre | Fragile, mal restitué ; des listes titrées font mieux. |
| Repères de carte dans l'ordre de tabulation | Doublent la liste. |
| Comparaison des versions côte à côte par cadres incorporés | Montrerait deux mises en page de tablette. |
| Registre des personnages alphabétique | 42 noms en A sur 176, douze Aegon. |

## 5. Désaccords avec le directeur artistique

Le cahier artistique est solide et je reprends l'essentiel : la table des volumes glosée, l'absence de portraits, les gloses de marge, la chandelle pour la recherche, la cire pour la fiabilité, les règles de mouvement. Les désaccords ci-dessous portent sur l'usage, pas sur le goût. Ils sont classés par gravité.

### D1 — V2 : pas de menu visible, une jauge muette (bloquant)

Le cahier décrit l'accueil de V2 sans menu, avec une jauge de huit strates. Dans une interface en langue inconnue, c'est demander deux fois au visiteur de deviner. Cela contredit aussi la règle du cahier lui-même sur les icônes sans libellé. **Demande :** la barre commune dans les trois versions ; la jauge nommée.

### D2 — V2 : le fil ne peut pas être à la fois la lignée et la chronologie (bloquant pour le fil tel que décrit)

Le cahier dit du même fil que le descendre, c'est descendre la lignée, et que le défilement est la chronologie, avec une échelle en pixels par an. Les données de l'agent 03 tranchent : 7 passages de couronne sur 16 ne vont pas de parent à enfant, la couronne remonte une fois d'une génération, 23 unions sur 69 lient des proches, et la moitié des personnes n'a pas de dates exactes. **Je me range à la réponse de l'agent 03** : le fil est la filiation (vingt personnes, une par génération), la couronne une seconde couche. Il en découle trois demandes au cahier : renoncer à l'échelle en années le long du fil ; ouvrir le tiroir d'un maillon vers le bas sur mobile, ce qui en fait l'arbre à focale ; laisser les 125 événements dans les annales des périodes et faire de la jauge un sommaire. J'avais d'abord recommandé un fil du temps et des règnes ; les données m'ont donné tort. **Épreuve proposée :** prototyper à 360 px les rangées 10 à 12 du fil (Viserys Ier, Rhaenyra, Viserys II).

### D3 — Entrée automatique en V1, et fréquence du rituel (majeur)

L'entrée automatique de V1 retire au visiteur le temps d'utiliser le sélecteur de langue que le cahier propose de mettre sur le seuil : les deux propositions se contredisent. **Demande :** la même porte dans les trois versions. Et le rituel complet à la première visite seulement, non à chaque session : une bibliothèque se consulte, et qui revient chaque jour ne doit pas payer trois secondes et un geste chaque jour. Le rituel se rejoue au colophon.

### D4 — V1 : navigation par page (majeur)

Trois points. Les signets de tranche ne couvrent que les Chroniques, alors que huit espaces sur dix sont ailleurs. « Tourner la page » n'a de sens que dans une série ordonnée, et la plupart des fiches n'en ont pas. Enfin, si « une adresse par page » signifie une pagination au gabarit du folio, l'adresse dépend de la taille de la fenêtre. **Demande :** une page est une unité logique qui défile ; précédent et suivant sont réservés aux séries ; le portail liste les registres.

### D5 — Le nuancier et la ligne de vie supposent des données que les livres ne donnent pas (majeur)

Les décisions 7 et 8 du cahier font du nuancier d'écailles la seule image d'un dragon, et de la ligne de vie la tête unique de chaque fiche de personne. Or les livres ne décrivent aucune couleur pour 8 dragons sur 28, dont Vhagar ; et 70 personnes sur 176 seulement ont une année de naissance et une année de mort, quand 57 n'ont ni l'une ni l'autre. Ce ne sont pas des cas limites. **Demande :** dessiner l'état « non décrit » du nuancier et les trois états de la ligne de vie (complète, bornée, absente) avec le même soin que l'état plein, et prévoir ce qui ouvre une fiche quand il n'y a ni couleur ni dates : la rangée de génération, la filiation.

### D6 — Sources « en gloses de marge, pas en notes de fin » (majeur)

D'accord sur bureau. Mais à 360 px il n'y a pas de marge, et un lecteur d'écran ou une impression ont besoin d'une liste. **Demande :** sur mobile, un appel de source ouvrant un feuillet bas ; et sur tous les écrans, une section « Sources de cette fiche » en fin de fiche, groupée par nature. Elle s'ajoute aux gloses, elle ne les remplace pas.

### D7 — V3 : ruban en marge gauche et réglette à glisser sur mobile (majeur)

Une bande de 24 px au bord gauche n'est pas une cible et occupe la zone du geste Retour. Une marge active de 44 px ramène le texte sous la mesure fixée par l'agent 08. Trois siècles sur 360 px font un pixel par an. **Demande :** ruban ouvert par un bouton ; réglette à huit crans avec deux boutons ; le glissement comme confort de grand écran. Le ruban peut porter le fil de vingt noms de l'agent 03.

### D8 — Huit périodes ne font pas huit tranches (mineur, mais structurant)

Les périodes IV, V et VI se chevauchent à dessein dans les données. Toute figure qui les montre comme huit strates empilées (jauge de V2, réglette de V3, signets de V1) dit quelque chose de faux. **Demande :** les présenter comme huit volumes, avec leurs bornes écrites, pas comme une échelle.

### D9 — Boucle de la flamme sur les pages de contenu (mineur, mais normatif)

Une animation de plus de cinq secondes à côté d'un contenu doit pouvoir être arrêtée par le visiteur (WCAG 2.2.2), indépendamment du réglage système. **Demande :** flamme allumée et immobile hors du seuil. À voir avec les agents 07 et 10.

### D10 — Codes de langue (mineur)

« HV » n'est un code pour personne. **Demande :** noms entiers sur le seuil, dans l'Index et en pied ; codes dans la barre seulement.

### Accords à signaler

- Sélecteur de langue sur le seuil : oui, avec cinq conditions (UX 10.1).
- Balise `art-x-valyrian` : reprise telle que l'agent 08 la propose.
- La focale de V3 et la comparaison de deux fiches sont les deux meilleures idées d'usage du cahier. Je propose de les verser au socle commun.

## 6. Risques

| # | Risque | Gravité | Parade |
|---|---|---|---|
| 1 | **La glose ne suffit pas** : des visiteurs repartent quand même devant un écran valyrien. | Élevée, non mesurée | Test à cinq personnes dès la maquette. Leviers : corps de la glose, état par défaut de la bascule. |
| 2 | **Les liens croisés ne peuvent pas être engendrés** : événements et dragons citent des noms, pas des identifiants. Sans eux, pas de « qui renvoie vers quoi », et la moitié de l'architecture reste sur le papier. | Élevée | Demande aux agents 02 et 11 (section 7). C'est le premier besoin de données. |
| 3 | **Le mode valyrien paraît « peu valyrien »** sur les fiches, où le récit domine (annexe C des wireframes). Déception possible du commanditaire. | Moyenne | Le dire tôt. Le seul remède honnête est d'enrichir le lexique validé, pas d'assouplir la règle. |
| 4 | **Groupes rabattus en français** par la règle d'homogénéité : beaucoup d'onglets et d'en-têtes de table ne seront pas valyriens tant que l'agent 04 n'aura pas répondu. | Moyenne | Liste priorisée en annexe B des wireframes. |
| 5 | **Gloses et titres français divergents** : quatre volumes sur huit n'ont pas le même nom français chez l'agent 02 et dans la glose de l'agent 04. | Moyenne | Arbitrage de l'agent 05. |
| 6 | **Deux graphies sur un même écran** (*Vagar* en rubrique, « Vhagar » dans le récit). | Moyenne | Glose du champ ; à observer en test. Repli possible : graphie de Martin partout hors des titres. |
| 7 | **Onze formes non revérifiées** dont trois entrées de navigation (*Issarossa*, *Ālia*, *Keso jāelio bē*) et le bouton *Majēbās*. | Moyenne | Revérification avant mise en ligne, déjà demandée par l'agent 04. |
| 8 | **Ouverture locale** : stockage, réécriture d'adresse et chargement de données peuvent se comporter autrement que prévu selon le navigateur. | Moyenne | Essai par l'agent 09 avant son ADR. Repli prévu : paramètre de langue propagé de lien en lien. |
| 9 | **Barre mobile** : environ 336 px sur 360, sans marge. | Moyenne | À rendre dès la maquette. Repli : la recherche réduite à son pictogramme, avec nom accessible. |
| 10 | **Espace « Guerres » sans données** : ni camps, ni alliances, ni liste de batailles. | Moyenne | Demande à l'agent 02. D'ici là, l'espace ne peut montrer que les événements d'une période. |
| 11 | **Lecteur d'écran** : le valyrien prononcé avec une voix française ou anglaise. | Faible, grâce aux noms accessibles bilingues | Essai NVDA et VoiceOver. |
| 12 | **Trois versions, un socle** : la contrainte « même adresse, même barre » réduit la liberté de V2. | Assumé | C'est le prix d'une comparaison honnête. |

## 7. Besoins de données

Les fichiers livrés couvrent déjà une bonne part de ce que demande l'architecture (détail en section 12.1 du document). Ce qui suit est ce qui manque, par ordre d'importance.

### Agent 02 — historien

1. **Des identifiants à la place des noms** dans `people`, `dragons`, `places` des événements et dans `riders` des dragons (identifiants de `genealogy.json` pour les personnes). Sans cela, aucun lien croisé.
2. **Un type par événement**, dans un vocabulaire fermé : naissance, mort, couronnement, union, bataille, concile ou traité, catastrophe, autre.
3. **Un objet « guerre »** : bornes, camps, chefs, maisons alliées, dragons par camp, batailles dans l'ordre avec leur issue en quelques mots, issue, conséquences.
4. **Causes et conséquences comme renvois** vers d'autres événements, en plus du texte `consequenceFr`.
5. **Lieux** : par lieu, un identifiant, une région, une nature, deux coordonnées sur un schéma original.
6. **Un rôle par participant** d'un événement.
7. **Les travaux linguistiques** dans `sources.json`.
8. **Les traductions anglaises** manquantes (`fateFr`, `hatchedOrFirstKnown`, `colorFr` des dragons).

### Agent 03 — généalogie

1. **Un libellé court de désambiguïsation** par personne (« fils de Baelon »), distinct du nom et de l'identifiant.
2. **Les parentés doubles calculées** : sœur et épouse, oncle et époux.
3. **L'ordre de naissance explicite** dans une fratrie quand les années manquent (aussi utile à l'agent 04 pour les mots de parenté).
4. **Les notes en anglais** (`noteFr` seul aujourd'hui sur 57 personnes).
5. **Un avis sur l'épreuve proposée en D2** : les rangées 10 à 12 du fil à 360 px.

### Agent 11 — modèle de données

1. **Relations stockées une fois, liens retour engendrés** ; contrôle d'intégrité : tout lien a son réciproque.
2. **Champ multilingue** de la forme `{ fr, en, hv? }`, où `hv` est une **référence à une entrée du lexique**, jamais une chaîne libre. Les données actuelles emploient `nameFr` / `nameEn` : à unifier.
3. **Identifiants lisibles** pour les sources et les périodes, ou un champ d'adresse distinct.
4. **Assertions sourcées** dans les récits longs, quand ils existeront : un texte découpé en assertions, chacune avec ses sources.
5. **Index de recherche** engendré : formes pliées, variantes, surnoms, graphies de Martin et de Peterson, années.
6. **Rapport de construction** : rubriques sans forme valyrienne, groupes rabattus, traductions manquantes, fiches à plus de trois interactions, liens sans réciproque.
7. **Incipit** : phrase, analyse mot à mot (forme, lemme, glose), traduction, statut.
8. Données chargeables **sans requête réseau** en ouverture locale.

### Autres agents

- **Agent 04** : les rubriques de l'annexe B des wireframes, par priorité ; un incipit par période avec analyse mot à mot ; la confirmation de *Valyrio Ēngos* comme nom de la langue dans le sélecteur ; la traduction des exemples des fiches de mots ; la prononciation écrite ; les noms valyriens des trois versions ; la revérification des onze formes.
- **Agent 05** : une seule notation d'ère en français (« AC » chez l'agent 02, « apr. C. » chez l'agent 03) ; l'accord entre titres français des périodes et gloses du lexique ; les noms français des lieux, que l'agent 02 déclare non vérifiés ; le libellé de la mention d'œuvre non officielle.
- **Agent 09** : confirmation des contraintes d'ouverture locale (UX 2.1) ; bascule de langue sans requête ; liens de la page 404 ; favicon.
- **Agents 07 et 10** : D5 et D9 ; forme mobile de la glose de source ; dessin des états d'un nœud d'arbre (au centre, lié, contesté, incertain, non documenté).
- **Agent QA** : les seize assertions Q-01 à Q-16 et les critères C1 à C6.

## 8. Propositions d'amélioration

1. **Tester le mur dès la maquette C1.** Cinq personnes, une consigne, deux minutes. C'est le test le moins cher du projet et il porte sur son plus grand risque.
2. **Verser la focale et la comparaison de deux fiches au socle commun** dès V1, au lieu de les réserver à V3.
3. **« Mes mots ».** Un carnet local des mots valyriens dont le visiteur a ouvert la note de glose, lisible depuis l'espace Langue. Sans score : une liste personnelle. Il relie l'interface valyrienne à l'apprentissage sans rien ajouter de ludique.
4. **Un mot par page.** Chaque fiche peut mettre en avant un mot attesté lié à son sujet (*zaldrīzes* sur les dragons, *dārys* sur un roi), avec lien vers sa fiche. Coût faible, puisque le lien « où le lire » existe déjà dans l'autre sens.
5. **Une page « Comment la bibliothèque qualifie un fait »**, qui explique les cinq niveaux de fiabilité de l'agent 02 et les trois degrés de certitude de l'agent 03 avec un exemple de chacun. Elle répond à la demande du cahier des charges sur les interprétations mieux qu'une catégorie de sources.
6. **« Citer cette fiche ».** Un bouton qui copie une référence propre (titre, adresse canonique, date de l'état du fonds, sources principales). Utile aux étudiants, cohérent avec un musée.
7. **Feuille d'impression.** Un codex qui s'imprime mal serait un contresens. Gloses de marge remises en notes, liens écrits en clair.
8. **Archive téléchargeable.** Puisque le site s'ouvre sans serveur, l'offrir en un fichier depuis le colophon.
9. **« Cette page dans une autre version »** en pied de toute page, tant que dure la comparaison.
10. **Rapport de construction lisible par l'orchestrateur** : nombre de rubriques valyriennes, de groupes rabattus, de traductions manquantes, de liens sans réciproque. Il donne chaque jour la mesure réelle du « tout valyrien » et de l'intégrité du fonds.

## 9. Points à arbitrer par l'orchestrateur

1. **La règle de langue** : accepter que le récit ne soit jamais en valyrien et que le mode valyrien soit une édition rubriquée et glosée. Tout le reste en dépend.
2. **Glose visible par défaut** : oui (ma recommandation) ou non.
3. **D3** : porte dans les trois versions ; rituel à la première visite seulement ou à chaque session.
4. **D1 et D2** : barre commune imposée à V2 ; fil de filiation sans échelle en années, comme le propose l'agent 03.
5. **D5** : ce qui ouvre une fiche quand il n'y a ni couleur ni dates.
6. **Priorité des données** : identifiants dans les événements et les dragons d'abord, puis type d'événement, puis guerres, puis lieux.
7. **Graphie de la salutation** : *morghūlis* (lexique) ou *morghulis* (commanditaire). Sans incidence sur l'usage.
8. **Racine du site** : espace de comparaison pendant la phase G, version retenue ensuite.
9. **Mention d'œuvre non officielle** : texte et emplacement.
