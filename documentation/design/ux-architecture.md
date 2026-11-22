# Architecture UX et de l'information — Targaryen Chronicles

Agent 06, architecte UX / information. Tâche B4. Version du 13 novembre 2026.

Fichiers liés : `design/wireframes/wireframes.md` (wireframes annotés, bureau et mobile), `reports/agent-reports/agent-06-ux-architecture.md` (décisions, désaccords, besoins de données).

Documents lus avant d'écrire : `documentation/design/cahier-artistique.md` (agent 07), `content/glossary/lexicon.json` et son rapport (agent 04), `documentation/design/typographie.md` (agent 08), `documentation/valyrian/grammaire-essentielle.md`, `design/design-system/tokens.css`.

Documents lus en fin de travail, parce qu'ils ont été livrés pendant sa rédaction : `content/timeline/timeline.json`, `content/timeline/sovereigns.json`, `content/dragons/dragons.json`, `content/sources/sources.json` (agent 02) ; `content/genealogy/genealogy.json`, `content/genealogy/succession.json`, `documentation/history/notes-genealogie.md` (agent 03). Ils m'ont fait corriger huit points, listés en section 12.3.

## 0. Statut de ce qui est écrit ici

| Nature | Ce que cela couvre | Comment le lire |
|---|---|---|
| **Décidé** | Plan du site, schéma d'URL, modèle de navigation, règle de langue, modèle de contenu. | Fait foi pour les agents 09 (technique), 11 (données) et la maquette C1, sauf arbitrage contraire de l'orchestrateur. |
| **Mesuré sur les données** | Comptes de personnes, d'unions, d'événements, de dragons, de sources. | Les fichiers des agents 02 et 03 (`timeline.json`, `dragons.json`, `sources.json`, `genealogy.json`, `succession.json`) ont été livrés pendant ce travail. Je les ai lus à la fin et j'ai réaligné mes chiffres et mes exemples sur eux. La section 12 liste les écarts entre ce que je demande et ce qu'ils contiennent. |
| **Estimé** | Nombre de guerres, de mots du lexique complet, de parcours ; poids de l'index de recherche ; budgets de défilement. | Hypothèses de dimensionnement : ces contenus n'existent pas encore. |
| **À vérifier** | Comportements de navigateur en ouverture locale (`file://`), restitution du valyrien par les lecteurs d'écran. | Je ne les ai pas testés : aucun prototype n'a été construit pour ce document. Chaque point est signalé. |
| **Exemples d'univers** | Dates, parentés, titres d'événements cités en exemple. | Repris des fichiers de données quand ils y figurent. Les agents 02 et 03 signalent eux-mêmes que leurs noms français n'ont pas été vérifiés dans les éditions françaises. Ce qui reste de ma mémoire est signalé. |
| **Valyrien** | Toutes les formes valyriennes de ce document et des wireframes. | Copiées de `lexicon.json`. Aucune n'est de moi. Quand le lexique n'a pas la forme, j'écris la chaîne en français et je la signale comme manquante. |

---

## 1. Cinq règles d'architecture

1. **Une adresse par objet, la même dans les trois versions.** `people/rhaenyra.html` désigne Rhaenyra sous `/version-1/`, `/version-2/` et `/version-3/`. La comparaison des versions se fait donc page pour page.
2. **La langue n'est pas un lieu.** Une fiche a une seule adresse pour les trois langues. La langue est un état d'affichage, porté par un paramètre facultatif et mémorisé.
3. **La page d'un espace est déjà son registre.** Aucune page-carrefour qui ne ferait que proposer des portes. Entrer dans « Dragons » montre les dragons.
4. **Tout lien est réciproque.** Si la fiche de Vhagar cite Aemond, la fiche d'Aemond cite Vhagar. Les liens retour sont engendrés à partir d'une relation stockée une seule fois (demande à l'agent 11).
5. **Rien d'essentiel n'existe que dans un instrument.** L'arbre, la frise et la carte sont des vues d'une liste. La liste est toujours là, au clavier, au lecteur d'écran et à 360 px.

---

## 2. Plan du site et schéma d'URL

### 2.1 Contraintes de l'ouverture en statique

Le site doit s'ouvrir sans serveur. Cela impose quatre choses, que l'agent 09 doit confirmer dans son ADR :

| Contrainte | Conséquence sur les adresses et la navigation |
|---|---|
| En ouverture locale, un dossier n'affiche pas son `index.html`. | Tout lien interne nomme le fichier : `chronicles/index.html`, jamais `chronicles/`. |
| Les chemins absolus (`/version-1/…`) cassent hors de la racine d'un domaine. | Tous les liens internes sont **relatifs**. |
| Pas de réécriture d'adresse côté serveur. | Chaque fiche est un **fichier HTML réel**, pré-rendu. Pas d'application à page unique dont les adresses « propres » exigeraient un serveur. |
| En `file://`, `fetch()` et les modules ES sont refusés par les navigateurs courants (à vérifier par l'agent 09). | L'index de recherche et les données d'arbre se chargent par balise `<script>` classique, ou sont incorporés. Sans cela, la recherche et l'arbre seraient morts en ouverture locale. |

Conséquence positive : sans JavaScript, chaque fiche reste lisible, ce que le cahier artistique demande déjà (section 6.3).

### 2.2 Arborescence

`N` vaut 1, 2 ou 3. La colonne « Lettre » renvoie aux espaces du cahier des charges.

```
/index.html                          Aiguillage (voir 2.5)
/versions/index.html                 Espace de comparaison des trois versions
/404.html                            Page d'erreur hors version
/version-N/
    index.html                       A   Portail (porte le seuil à la première visite)
    search.html                          Résultats de recherche            ?q=
    chronicles/
        index.html                   B   Les huit périodes
        valyria.html                     I    L'ancienne Valyria
        origins.html                     II   Les origines de la Maison
        conquest.html                    III  La Conquête
        first-reigns.html                IV   Les premiers règnes
        dance-of-the-dragons.html        V    La Danse des Dragons
        later-generations.html           VI   Les générations suivantes
        fall.html                        VII  La fin de la dynastie
        legacy.html                      VIII L'héritage
    events/
        <evenement>.html             B/F Fiche d'événement (une bataille est un événement)
    genealogy/
        index.html                   C   Arbre                              ?focus=<personne>
    people/
        index.html                   D   Registre des personnages
        <personne>.html                  Fiche de personnage
    dragons/
        index.html                   E   Registre des dragons
        <dragon>.html                    Fiche de dragon
    wars/
        index.html                   F   Les guerres
        <guerre>.html                    Fiche de guerre : camps, batailles, issue
    places/
        index.html                   G   Lieux : liste et carte             ?view=map
        <lieu>.html                      Fiche de lieu
    language/
        index.html                   H   Lexique (vue par défaut de l'espace)
        phrases.html                     Expressions
        grammar.html                     Grammaire (un chapitre par ancre)
        words/<mot>.html                 Fiche de mot
    sources/
        index.html                   I   Registre des sources
        <source>.html                    Fiche de source
    learn/
        index.html                   J   Les parcours
        <parcours>/index.html            Présentation d'un parcours
        <parcours>/<n>.html              Étape n (lecture + questionnaire)
    about/
        index.html                       Création de la bibliothèque, colophon, note sur la langue
```

Le classement thématique du lexique n'a pas de page : c'est une facette (`language/index.html?theme=kinship`). Les « maisons » autres que la Maison Targaryen ne sont pas des objets à fiche : ce sont des facettes du registre des personnages (`people/index.html?house=velaryon`) et des attributs des camps d'une guerre. Le musée porte sur une maison ; ouvrir une fiche par maison alliée doublerait le périmètre sans contenu pour le remplir.

### 2.3 Règles d'adresse

| Règle | Détail |
|---|---|
| **Identifiants** | Minuscules ASCII, tirets. Ils sont aussi les identifiants des données (demande à l'agent 11) : `aegon-i`, `rhaenyra`, `vhagar`, `dragonstone`, `fire-and-blood`. |
| **Identifiants des fiches** | Ce sont ceux des fichiers de données, sans transformation : `aegon-i`, `rhaenyra`, `baelon-fils-jaehaerys-i` (`genealogy.json`), `vhagar` (`dragons.json`), `p5-accalmie` (`timeline.json`). Une fiche a pour nom de fichier l'identifiant de sa donnée ; rien n'est à maintenir en double. |
| **Langue des identifiants** | Je recommandais l'anglais, langue des clés du lexique et des dossiers de contenu. Les données livrées mêlent la graphie de Martin et une désambiguïsation en français (`-fils-`, `-fille-`, `-peyredragon`). Ce n'est pas un défaut d'usage : l'adresse est une cote, pas un texte. Ce qui compte est qu'elle soit unique et stable. Les noms des espaces (`chronicles`, `people`…) restent en anglais. Deux cas à régler par l'agent 11 : les sources (`fab`, `twoiaf` sont opaques dans une adresse) et les périodes (`p5`), pour lesquelles je demande un identifiant lisible. |
| **Mots valyriens** | L'identifiant est la forme sans macron (`zaldrizes`). C'est une cote, pas une graphie : la fiche affiche toujours *zaldrīzes*. En cas de collision entre deux mots que seule la longueur distingue, suffixe `-2`. |
| **Homonymes** | Réglés dans les identifiants par l'agent 03 : numéro de règne quand il existe (`aegon-i`, `aegon-ii`), filiation sinon (`aegon-fils-baelon`, `visenya-fille-rhaenyra`). Douze personnes du graphe s'appellent Aegon, six Daeron, cinq Viserys. |
| **État dans la requête** | Ce qui est un état d'une page s'écrit après `?` et jamais dans le chemin : langue (`l`), recherche (`q`), filtres (`type`, `person`, `place`, `theme`…), personne au centre de l'arbre (`focus`), vue (`view`), second document comparé en V3 (`with`), fiche ouverte sur place en V2 (`open`). |
| **Ancres** | `#` est réservé aux sections d'une fiche (`#lignee`, `#sources`) et aux chapitres de grammaire. |
| **Écriture de l'état** | Par `history.replaceState` pour les filtres et la langue (pas d'entrée d'historique), par `pushState` pour ce que le bouton Retour doit défaire : recentrage de l'arbre, ouverture d'un panneau ou d'une stèle. À vérifier en `file://`, où seuls la requête et le fragment peuvent être réécrits. |
| **Lien canonique** | Un panneau ou une stèle ouverts sur place sont des états. Leur lien `<a href>` pointe toujours vers la fiche canonique : sans script, le lien navigue ; avec script, il ouvre sur place. « Copier le lien » donne toujours l'adresse canonique. |

### 2.4 Volumétrie

Comptes relevés dans les fichiers livrés le 13 novembre 2026, et estimations pour ce qui n'existe pas encore.

| Type | Compte | Origine | Ce que cela impose |
|---|---|---|---|
| Périodes | 8, dont trois se chevauchent à dessein (IV : 1–129 ; V : 105–153 ; VI : 131–262) | `timeline.json` | Table, jamais de filtre. Les bornes ne forment pas huit tranches jointives : aucun instrument ne doit le laisser croire. |
| Événements | 125 : 117 dans la continuité des livres, 8 propres aux séries. De 11 à 29 par période ; la Danse en a 29, dont 10 pour la seule année 130. | `timeline.json` | Annales par période, rail d'années. Aucun groupe ne dépasse 30. |
| Personnes | 176, dont 103 de la Maison Targaryen | `genealogy.json` | Registre groupé, filtre par nom, jamais une liste alphabétique nue (voir 6.3). |
| Unions | 69 ; 16 personnes en ont plusieurs (jusqu'à six) | `genealogy.json` | Enfants groupés par union dans l'arbre. |
| Souverains | 17 rois, plus Rhaenyra hors numérotation | `sovereigns.json` | Série « règne précédent / suivant ». |
| Dragons | 28 | `dragons.json` | Une table lisible d'un seul tenant. |
| Lieux | 66 noms, sans autre information | répertoire de `timeline.json` | Liste par région dès que la région existe ; carte en second. |
| Sources | 20 | `sources.json` | Registre groupé par nature. |
| Guerres | 8 à 12 (estimation) | à produire | Table, pas de filtre. |
| Mots et expressions | 87 chaînes d'interface aujourd'hui ; 300 à 600 pour un lexique complet (estimation) | `lexicon.json` | Lexique filtré par thème, rail alphabétique. |
| Parcours | 5 à 8, de 5 à 10 étapes (estimation) | à produire | Liste. |

Soit environ 450 fiches par version avec les données actuelles, et de l'ordre de 1 000 avec un lexique complet. Index de recherche estimé à 200 octets par entrée, donc 100 à 200 Ko bruts ; à mesurer par l'agent 09.

### 2.5 La racine

`/index.html` est un aiguillage. Pendant la phase de comparaison, il affiche l'espace de comparaison (identique à `/versions/index.html`). Après l'arbitrage, il renvoie vers le portail de la version retenue, et l'espace de comparaison reste à `/versions/index.html`. Le visiteur public n'a pas à choisir entre trois états d'un même ouvrage ; le commanditaire, lui, en a besoin.

---

## 3. Navigation

### 3.1 Navigation globale : trois étages

| Étage | Contenu | Présence |
|---|---|---|
| **1. La barre** | Marque du sceau (retour au portail) · titre courant (fil d'Ariane de trois niveaux au plus) · **Index** · **Chercher** · **langue** (trois positions) · bascule de glose (en mode valyrien seulement). | Sur toute page, dans les trois versions. Sa forme change avec la version, pas son contenu. |
| **2. L'Index** | Fenêtre plein écran, deux listes : les huit périodes (chiffre romain, titre, bornes) et les neuf registres (Lignée, Personnages, Dragons, Guerres, Lieux, Langue, Sources, Apprendre, À propos). En pied : comparaison des versions. | À un geste de toute page. Toujours glosé, quel que soit l'état de la glose. |
| **3. Le pied** | Colophon, note sur la langue, sources, versions (« voir cette page dans une autre version »), mention d'œuvre non officielle. | Bas de toute page. |

Mots employés : en mode valyrien, l'Index s'appelle *Iderenna* et la recherche *Korjās* (lexique). Sur mobile, la barre garde les quatre contrôles ; le titre courant passe sur une seconde ligne qui défile avec la page.

Le portail donne accès à **tous les espaces**, pas seulement aux huit périodes : c'est la condition de la règle des trois interactions (3.3), et c'est une réserve sur l'accueil de V1 tel que le cahier artistique le décrit (table des huit volumes seule).

### 3.2 Navigation locale

| Objet | Séquence (précédent / suivant) | Onglets ou sommaire | Bloc « voir aussi » |
|---|---|---|---|
| Période | Période précédente / suivante. | En bref · Annales · Figures · Guerres. | Parcours liés. |
| Événement | Par défaut, dans les annales de sa période. Si l'on vient d'une guerre, d'une personne ou d'un dragon, dans cette série-là : le contexte est porté par `?ctx=war:dance-of-the-dragons` et affiché en clair (« Suite : batailles de la Danse »). | Faits · Causes · Conséquences · Sources. | Personnes, dragons, lieu, guerre. |
| Personne | Pour un monarque : règne précédent / suivant. Pour les autres : aucune (le voisin alphabétique n'a pas de sens). | Identité · Vie · Lignée · Dragons · Événements · Sources. | « Voir dans la lignée » en tête. |
| Dragon | Aucune. | Identité · Dragonniers · Combats · Sources. | Dragonniers, lieux. |
| Guerre | Guerre précédente / suivante. | En bref · Camps · Batailles · Issue et conséquences · Sources. | Période, lieux. |
| Lieu | Aucune. | Identité · Ce qui s'y est passé · Qui y a vécu. | Région, lieux voisins. |
| Mot | Aucune. | Sens · Forme · Exemples · Où le lire dans la bibliothèque · Source. | Mots de la même famille, du même thème. |
| Source | Aucune. | Notice · Fiabilité · Fiches qui la citent. | Sources en désaccord. |
| Étape de parcours | Étape précédente / suivante, toujours libres. | Lecture · Question. | Fiche complète de l'objet étudié. |

L'ordre des blocs « voir aussi » est fixe sur toutes les fiches : Personnes · Dragons · Événements · Guerres · Lieux · Mots · Sources. Un visiteur qui a appris à lire une fiche sait lire les autres.

### 3.3 Règle des trois interactions

**Définition.** Une interaction est une activation (clic, toucher, Entrée) ou une saisie validée. Le défilement n'en est pas une, mais il est borné : après chaque interaction, la cible suivante doit se trouver à moins de deux hauteurs d'écran sur mobile (1 280 px à 360 × 640). Une liste qui dépasse ce budget doit offrir un saut (rail d'années, de périodes ou de lettres), et ce saut compte pour une interaction. La réponse rituelle du seuil n'est pas comptée : la règle part du portail affiché.

| # | Cible | Chemin depuis le portail | Interactions |
|---|---|---|---|
| 1 | Fiche de **Rhaenyra** (personnage de premier plan) | Portail → *Issarossa* (Personnages) → groupe « V · La Danse » visible par le rail des périodes → Rhaenyra | 3 (2 si le groupe est déjà à l'écran) |
| 2 | Fiche de **Daenaera Velaryon** (personnage mineur, `daenaera-velaryon`) | Portail → champ de recherche, saisie « daenaera » → suggestion | 2 |
| 3 | Fiche de **Vhagar** (dragon) | Portail → *Zaldrīzesse* (Dragons) → Vagar | 2 |
| 4 | **Bataille au-dessus de l'Œildieu** (événement de type bataille) | Portail → *Vīlībāzmi* (Guerres) → La Danse des Dragons → la bataille dans la liste ordonnée | 3 |
| 5 | **Mort de Lucerys à Accalmie** (événement `p5-accalmie`) | Portail → volume V dans la table → rail d'années « 129 » → l'événement, troisième de son groupe | 3 (2 sur bureau, où il est visible sans saut) |
| 6 | Mot ***zaldrīzes*** | Portail → *Valyrio Ēngos* (Langue) → rail alphabétique « Z » → zaldrīzes | 3 |
| 7 | Source ***Fire & Blood*** | Portail → *Tembyri* (Sources) → Fire & Blood | 2 |
| 8 | **Étape 7** du parcours « La Danse en sept étapes » | Portail → *Gūrēñagon* (Apprendre) → le parcours → étape 7 dans son sommaire | 3 |
| 9 | Fiche de **Peyredragon** (lieu) | Portail → *Ālia* (Lieux) → Zaldrīzdōron | 2 |

La recherche atteint n'importe quelle fiche en deux interactions depuis n'importe quelle page (ouvrir, puis saisir et choisir), et en une saisie plus un choix depuis le portail, où le champ est déjà ouvert.

**Ce que la règle impose à la conception** (ce sont des exigences, pas des souhaits) :

1. Le portail donne un accès direct aux huit périodes et aux neuf registres.
2. La page d'un espace est son registre (règle 3 de la section 1). Si l'espace Langue ouvrait sur un carrefour « Lexique / Expressions / Grammaire », le mot serait à quatre interactions.
3. Tout registre de plus de 60 entrées a un rail de saut, et aucun groupe du rail ne dépasse 30 entrées. Pour les personnages, cela oblige à subdiviser la période IV par règne.
4. Les batailles d'une guerre sont listées sur la fiche de la guerre, pas derrière un onglet fermé.
5. Un parcours affiche le sommaire de toutes ses étapes sur sa page de présentation.

**Critère de contrôle (agent QA).** Parcours automatique en largeur depuis `index.html` de chaque version, en ne suivant que les liens et contrôles visibles : toute page de fiche doit être atteinte à une profondeur ≤ 3. Toute page à profondeur 4 ou plus est un défaut.

---

## 4. Modèle de contenu vu par le visiteur

### 4.1 Neuf types d'objets

| Type | Ce que le visiteur y trouve | Titre en mode valyrien |
|---|---|---|
| **Période** | Bornes, résumé « en bref » (120 mots au plus), annales, figures, guerres. | Forme du lexique (`period.1` à `period.8`). |
| **Événement** | Date et son degré de certitude, type, lieu, faits, participants et leur rôle, causes, conséquences, sources. Pour une bataille : camps, forces, dragons engagés, issue. | Langue de lecture, sauf titre validé par l'agent 04. |
| **Guerre** | Bornes, camps et alliés, chefs, batailles dans l'ordre, issue, conséquences. | Langue de lecture, sauf titre validé (la Danse l'a : *Zaldrīzoti Lilion*). |
| **Personne** | Nom, titres, ligne de vie (naissance, règne, mort), maison, père, mère, fratrie, unions, enfants par union, dragons, événements, sources. | Graphie valyrienne si elle est au lexique (*Āegon*, *Visenia*), sinon graphie de Martin. |
| **Dragon** | Nom, couleur attestée (nuancier d'écailles), éclosion, mort, dragonniers successifs avec leurs dates, combats, sources. | Idem (*Vagar*, *Karakses*, *Syraks*). |
| **Lieu** | Nom, région, nature, ce qui s'y est passé, qui y est né, mort ou y a régné, position sur la carte. | Forme du lexique si elle existe (*Zaldrīzdōron*, *Dāro Vilinion*). |
| **Mot / expression** | Forme, sens, classe, genre, flexions utiles, niveau d'attestation, exemple, source linguistique, endroits du site où il est écrit. | Le mot lui-même. |
| **Source** | Notice (auteur, date, nature), narrateur interne s'il y en a un, fiabilité, fiches qui la citent. | Titre original, jamais traduit en valyrien. |
| **Parcours** | Intention, durée, étapes ; chaque étape : une lecture courte tirée d'une fiche, une à quatre questions. | Langue de lecture, sauf titre validé. |

Une **bataille** n'est pas un dixième type : c'est un événement de type « bataille » rattaché à une guerre. Elle a une seule fiche, atteinte par les Chroniques comme par les Guerres. Le lexique confirme ce choix : *vīlībāzma* vaut pour « guerre » et pour « bataille », et l'agent 04 demande que la distinction se fasse par la présentation.

### 4.2 Qui renvoie vers quoi

Lecture : la ligne renvoie vers la colonne. Tout lien existe aussi dans l'autre sens (règle 4).

| De ↓ vers → | Période | Événement | Guerre | Personne | Dragon | Lieu | Mot | Source | Parcours |
|---|---|---|---|---|---|---|---|---|---|
| **Période** | précédente, suivante | ses annales | celles qui s'y déroulent | figures (8 au plus en tête) | ceux qui y vivent | — | son nom valyrien | — | ceux qui la traitent |
| **Événement** | la sienne | causes, conséquences, précédent, suivant | la sienne | participants et rôles | engagés | où il a lieu | termes cités | par assertion | — |
| **Guerre** | la ou les siennes | ses batailles, causes, conséquences | précédente, suivante | chefs, camps | engagés par camp | théâtres | — | par assertion | — |
| **Personne** | celles de sa vie | ceux où elle agit | camp tenu | père, mère, fratrie, conjoints, enfants | montés | naissance, mort, sièges | ses titres (*dārys*, *dāria*) | par assertion | — |
| **Dragon** | celles de sa vie | combats | camp servi | dragonniers successifs | — | éclosion, mort | étymologie du nom si elle est sourcée | par assertion | — |
| **Lieu** | — | ce qui s'y passe | celles qui le touchent | nés, morts, seigneurs | éclos, morts | région, voisins | son nom valyrien | par assertion | — |
| **Mot** | — | — | — | — | — | — | famille, thème, expressions | source linguistique | ceux qui l'enseignent |
| **Source** | — | — | — | — | — | — | — | sources en désaccord | — |
| **Parcours** | — | étapes | étapes | étapes | étapes | étapes | étapes | — | parcours suivant |

Trois liens méritent une explication :

- **Mot → partout.** Chaque fiche de mot liste les endroits de la bibliothèque où ce mot est écrit (« *Zaldrīzes* : registre des dragons, titre de la période V, étiquette de fiche »). C'est le lien qui transforme l'interface valyrienne en matière d'apprentissage.
- **Source → fiches qui la citent.** Engendré, jamais saisi. Il permet le parcours « d'où vient cette information » dans les deux sens.
- **Événement → causes et conséquences.** Ce sont des liens typés vers d'autres événements, pas un paragraphe : « comprendre les conséquences » devient une navigation.

### 4.3 Nature des sources : trois encres, jamais mélangées

Le cahier des charges demande de distinguer livres, interprétations et adaptations. La distinction se fait à l'échelle du **fait**, pas de la fiche. Les données de l'agent 02 portent déjà ce qu'il faut, sous deux champs : la **continuité** (livres ou adaptation) et le **niveau de fiabilité** du fait (cinq niveaux). Je les reprends tels quels plutôt que d'en inventer d'autres.

| Ce que demande le cahier des charges | Dans les données | Affichage |
|---|---|---|
| **Livres** | Continuité « livres » ; fiabilité *établi* ou *récit unique*. | Récit principal de toute fiche. Le niveau est écrit en toutes lettres en tête du fait. |
| **Interprétations** | Fiabilité *récits contradictoires* (les narrateurs des livres divergent) ou *tradition ou légende* (rumeur, prophétie, spéculation d'un auteur de l'univers). S'y ajoutent les années calculées et non écrites. | *Récits contradictoires* : bloc titré « Versions », chaque récit avec sa source. *Légende* : le mot en tête, jamais au présent de vérité. Année calculée : précédée de « vers » et marquée comme telle. |
| **Adaptations** | Continuité « adaptation », identifiant préfixé `tv-`. Huit événements dans le fonds. | Jamais dans le récit principal ni dans les annales. Bloc séparé et titré (« Dans l'adaptation télévisée ») sur la fiche concernée ; onglet séparé sur une période. |
| *(Lacune)* | Année `null`, couleur `null`, parent absent. | Dit en clair : « non documenté ». Rien n'est comblé. Sur une ligne de vie ou un nuancier, la zone est hachurée (matière « gravure » du cahier artistique). |

Trois précisions :

- La **nature du témoignage** d'une source (récit direct, chronique fictive, adaptation, outil de vérification) est un champ de la source, affiché dans les gloses de marge et au registre.
- Le niveau de fiabilité est toujours écrit en mots, jamais porté par la seule couleur ni par le seul sceau de cire.
- La **certitude d'une filiation** (établie, contestée, incertaine), tenue par l'agent 03, suit la même logique dans l'arbre : en mots, avec une note qui nomme ce qui est contesté.

---

## 5. Stratégie de langue

### 5.1 Le problème, posé sans détour

Le site s'ouvre en haut valyrien. Presque personne ne le lit. Et le rapport de l'agent 04 établit un second fait, plus contraignant : dans ce qu'il a pu consulter (son dictionnaire s'arrêtait à la lettre Q), il n'a trouvé **aucun mot** pour « histoire », « bibliothèque », « source », « origine », « page » ou « menu », et aucun nom pour « conquête » ni « chute ». Sur 87 chaînes d'interface, 15 ont dû être composées pour le site. On peut écrire un menu en valyrien ; on ne peut pas y écrire honnêtement le récit de la Danse des Dragons.

Le parti pris est donc menacé de deux côtés : d'un côté le mur (un visiteur qui ne comprend rien repart), de l'autre le faux (remplir les pages d'un valyrien fabriqué pour « faire immersif »).

### 5.2 Solutions étudiées

| Solution | Verdict | Raison |
|---|---|---|
| A. Valyrien intégral, sans aide | Écartée | C'est le mur. Et c'est impossible pour les textes longs. |
| B. Bascule automatique vers la langue du navigateur | Écartée comme langue d'affichage | Elle annule le parti pris : aucun visiteur ne verrait le valyrien. **Retenue pour un seul usage** : choisir la langue des gloses. |
| C. Sélecteur de langue sur le seuil seulement | Insuffisante | Les arrivées par lien profond ne passent pas par le seuil (version brève, cahier artistique 6.3). Le sélecteur doit être sur chaque page. |
| D. Traduction au survol | Insuffisante | Rien au toucher, rien au clavier. |
| E. Appui long sur un mot | Écartée | Indécouvrable ; sur un lien, l'appui long ouvre le menu du système. |
| F. Glose interlinéaire visible (la traduction sous le mot valyrien) | **Retenue, état par défaut** | Le visiteur lit le valyrien en premier et n'est jamais perdu. Le cahier artistique la prescrit déjà pour la table des volumes (« titre valyrien, traduction en italique »). |
| G. Glose à la demande (toucher un mot révèle sens et attestation) | **Retenue en complément** | Pour le niveau d'attestation, le sens littéral, le lien vers la fiche du mot. |
| H. Textes historiques traduits en valyrien | Écartée | Le lexique ne le permet pas sans invention. |
| I. Une arborescence par langue (`/fr/…`, `/en/…`) | Écartée | Triple les pages, impose un rechargement au changement de langue, casse la règle « une adresse par objet ». |

### 5.3 Décision : une édition à deux voix

Le « mode valyrien » n'est pas une traduction du site en valyrien, qui ne peut pas exister. C'est une **édition rubriquée** : le valyrien tient les rubriques, la langue du visiteur porte le récit. Le modèle est celui du manuscrit médiéval, où les rubriques sont dans la langue savante et le texte dans la langue du lecteur, avec des gloses entre les lignes. Il s'accorde avec la couleur « rubrique » et les gloses de marge du cahier artistique.

Deux voix, donc, sur tout écran :

- la **voix valyrienne** : toute chaîne validée par l'agent 04. Romain, porte `lang="art-x-valyrian"` ;
- la **voix de lecture** : français ou anglais. Sous forme de glose (petit corps, italique) quand elle traduit une rubrique ; en texte courant quand elle porte le récit.

Le sélecteur a **trois positions** : *Valyrio Ēngos* · Français · English.

| Position | Rubriques (navigation, étiquettes, titres validés) | Récit (textes longs) | Glose |
|---|---|---|---|
| ***Valyrio Ēngos*** (par défaut) | Valyrien | Langue de lecture | Visible sous chaque rubrique ; peut être masquée. |
| **Français** | Français | Français | Sans objet. Les titres qui ont une forme valyrienne la citent en italique (« La Danse des Dragons — *Zaldrīzoti Lilion* »). |
| **English** | Anglais | Anglais | Idem. |

**Langue de lecture en mode valyrien** : le dernier choix explicite de Français ou d'English ; à défaut, la langue du navigateur (français si une des langues préférées commence par `fr`, anglais sinon). Aucun réglage supplémentaire n'est montré : qui veut des gloses en français choisit « Français », puis revient à « *Valyrio Ēngos* ».

Ce que cela donne à la première visite d'un francophone : un écran dont tous les titres et toutes les étiquettes sont en valyrien, chacun accompagné de son sens en petit italique, et dont les textes longs sont en français. Le parti pris est tenu et personne n'est arrêté.

### 5.4 Règle éditoriale : « le valyrien rubrique, la langue du visiteur raconte »

Cinq classes de texte. La classe décide de la langue ; personne ne décide au cas par cas.

| Classe | Exemples | En mode valyrien | En français / anglais |
|---|---|---|---|
| **1. Formules** | *Valar morghūlis*, *Valar dohaeris*, *Perzys Ānogār*. | Valyrien, glosé. | **Valyrien aussi**, glosé. Une formule ne se remplace pas, elle se traduit dessous. |
| **2. Rubriques** | Navigation, actions, étiquettes de champ (*Sitta*, *Morghūltas*, *Kepa*, *Muña*). | Valyrien si le lexique a l'entrée. Sinon langue de lecture, et la chaîne est portée au rapport de construction. | Langue choisie. |
| **3. Titres et noms propres** | Titres des périodes, noms de personnes, de dragons, de lieux. | Forme valyrienne si elle est validée. Sinon graphie de Martin (noms) ou langue de lecture (titres). | Graphie de Martin ; la forme valyrienne validée est citée en italique en tête de fiche. |
| **4. Incipit et légendes** | Une à trois phrases courtes en tête d'un volume ou d'une grande fiche, sur le modèle de `text.portal_intro`. | Valyrien, avec glose mot à mot et traduction, et la mention visible « composition de la bibliothèque ». **Facultatif** : pas d'incipit validé, pas d'incipit. | Même bloc, la traduction passant en premier. |
| **5. Récit** | Résumés, biographies, faits, causes, conséquences, notices de sources, leçons de grammaire, explications de questionnaire. | **Jamais en valyrien.** Langue de lecture, sous la mention d'édition (5.5). | Langue choisie. |

Cinq garde-fous rendent la règle vérifiable :

1. **Aucun valyrien n'est tapé dans un gabarit.** Toute chaîne valyrienne affichée vient de `lexicon.json` (ou d'un fichier d'incipit de l'agent 04) par son identifiant. Contrôle : tout élément `[lang="art-x-valyrian"]` porte un `data-lex` qui se résout dans le lexique, avec un statut différent de `neologisme`.
2. **Pas de valyrianisation maison.** Un nom sans forme validée reste dans la graphie de Martin et ne porte pas `lang="art-x-valyrian"` (cas de *Aemond*, statut `adaptation`). On n'ajoute pas de macron au jugé.
3. **Pas de repli silencieux vers du faux.** Une rubrique sans entrée s'affiche dans la langue de lecture. La liste de ces chaînes est produite à chaque construction et adressée à l'agent 04. Elle vaut mieux qu'une interface à 100 % valyrienne dont un quart serait inventé.
4. **Un groupe d'étiquettes ne mélange pas les langues.** Onglets d'un espace, facettes d'un filtre, en-têtes d'une table, rubriques d'une table d'identité : si une seule étiquette du groupe n'a pas de forme au lexique, tout le groupe s'affiche dans la langue de lecture. Une rangée « En bref · Annales · *Vīlībāzmi* » serait pire que trois mots français. Chaque groupe ainsi rabattu figure au rapport de construction, avec l'étiquette manquante : la demande à l'agent 04 est précise.
5. **Les formes non revérifiées** (`verifie_en_ligne: false`, onze entrées ce jour, dont *Issarossa*, *Ālia*, *Majēbās* et le titre de la période VI) sont affichées, mais leur fiche de mot et leur note de glose portent la mention « forme à confirmer ». Je recommande qu'elles soient revérifiées avant toute mise en ligne publique, comme le demande l'agent 04.

### 5.5 Dire ce qui n'existe qu'en traduction

En mode valyrien, tout texte de classe 5 est précédé d'une **mention d'édition** d'une ligne, en petites capitales, dans la langue de lecture :

> TEXTE EN FRANÇAIS · *pourquoi ?*

Le lien « pourquoi ? » mène à la **note sur la langue** (`about/index.html#langue`), qui dit sans détour : le haut valyrien est une langue construite par David J. Peterson ; son lexique publié ne contient pas le vocabulaire d'un historien ; cette bibliothèque écrit en valyrien ce qui peut l'être avec certitude et donne le reste dans la langue du visiteur ; chaque forme valyrienne affichée porte son niveau d'attestation ; la répartition actuelle est de 56 formes attestées, 15 dérivées, 15 composées pour le site et 1 nom laissé dans la graphie de Martin (chiffres du rapport de l'agent 04).

La mention paraît une fois par document, en tête du texte, jamais sur chaque paragraphe. Elle est absente en français et en anglais, où elle n'aurait pas d'objet.

### 5.6 La glose

**Glose visible (état par défaut du mode valyrien).** Chaque rubrique valyrienne est suivie de sa traduction : dessous pour un titre ou une entrée de navigation, à la suite pour une étiquette de champ (« *Sitta* · née »). La glose est dans le DOM dans tous les cas ; quand elle est masquée, elle l'est visuellement et reste dans le nom accessible.

**Bascule.** Un contrôle à deux états dans la barre, présent en mode valyrien seulement. Son libellé est *Nūmāzma* (« sens », attesté). Glose masquée : valyrien seul, pour qui veut l'immersion ou s'exerce. L'Index reste glosé dans les deux états : c'est le filet de sécurité.

**Note de glose (à la demande).** Toucher ou cliquer une chaîne valyrienne qui n'est pas elle-même un lien ouvre une note ancrée, non modale :

| Champ | Exemple pour *Zaldrīzoti Lilion* |
|---|---|
| Traduction | La Danse des Dragons |
| Sens littéral | « danse des dragons » : *zaldrīzoti*, génitif pluriel de *zaldrīzes* ; *lilion*, « danse » |
| Niveau d'attestation, en toutes lettres | Composition de la bibliothèque (mots attestés, assemblés pour ce titre) |
| Lien | Voir les mots dans la bibliothèque linguistique |

**Glose mot à mot.** Les incipit (classe 4) s'affichent sur trois lignes : le valyrien, le mot à mot aligné sous chaque mot, la traduction. C'est là que la lecture devient apprentissage. Cela demande à l'agent 04 une analyse par mot de chaque phrase (forme, lemme, glose).

**Glossaire de page.** Un bouton en pied de page, « Mots valyriens de cette page », ouvre la liste de toutes les chaînes valyriennes de l'écran avec traduction et niveau d'attestation. C'est l'équivalent au clavier et au lecteur d'écran de la note de glose : les chaînes ne deviennent pas vingt arrêts de tabulation supplémentaires par page.

**Ce qui n'est pas retenu.** L'appui long ; l'infobulle `title` ; une marque permanente sur chaque chaîne dérivée ou composée. Sur ce dernier point je m'écarte de la proposition 3 de l'agent 04 : onze des vingt-deux chaînes valyriennes du portail (par mon compte dans le lexique) sont de statut `editorial`, et autant de marques feraient du portail une page d'avertissements, d'autant que le losange est déjà un ornement du cahier artistique. Le niveau d'attestation est donné à la demande (note, glossaire de page, fiche de mot) et de façon permanente là où le risque de méprise est réel : sur les phrases composées (classe 4), qui ressemblent à des citations et n'en sont pas.

### 5.7 Le sélecteur, le seuil, la mémoire

| Point | Décision |
|---|---|
| **Présence** | Sur le seuil et dans la barre de toute page. |
| **Libellés** | Les noms des langues dans leur propre langue là où la place existe (seuil, Index, pied) : *Valyrio Ēngos* · Français · English. Le premier est l'entrée `nav.language` du lexique, composition de la bibliothèque ; « Valyrio » seul voudrait dire « de Valyria » et n'est pas employé. Les codes `HV · FR · EN` dans la barre. « HV » n'est un code pour personne : il n'est acceptable que parce que FR et EN sont à côté. |
| **Balises** | Chaque position porte l'attribut `lang` de sa langue et un nom accessible complet (« Français », pas « FR »). Groupe de trois boutons à bascule (`aria-pressed`), pas une liste déroulante. |
| **Effet sur le seuil** | Choisir une langue sur le seuil ne fait pas entrer. Cela change les gloses (« Tous les hommes doivent mourir » / « All men must die ») et le mot d'action du bouton. Les deux formules restent en valyrien dans les trois positions. |
| **Changement en cours de lecture** | Sans rechargement, en moins de 200 ms, sans requête bloquante : les trois langues de la page sont présentes dès son chargement. Le premier titre visible reste dans la fenêtre. Annonce par région `aria-live` (« Langue : français »). |
| **Mémoire** | Stockage local, commun aux trois versions : langue d'affichage, langue de lecture, état de la glose. Aucun cookie, aucun compte. |
| **Priorité** | 1. Choix explicite mémorisé. 2. À défaut, paramètre `?l=` de l'adresse. 3. À défaut, mode valyrien glosé. Le choix du visiteur l'emporte toujours sur le lien qu'on lui envoie. |
| **Arrivée profonde, première visite** | Pas de seuil. Une **note de seuil** d'une ligne paraît en tête du contenu, dans la langue de lecture : « Cette bibliothèque s'ouvre en haut valyrien. Lire en français · Read in English · Continuer ainsi ». Elle se ferme au premier choix et ne revient pas. |
| **Stockage indisponible** | Le paramètre `l` est propagé de lien en lien par script. Sans script ni stockage : état par défaut à chaque page, sélecteur fonctionnel si l'agent 09 retient une bascule en CSS seul. |

### 5.8 États d'interface

| État | Déclencheur | `<html lang>` | Ce que voit le visiteur |
|---|---|---|---|
| **L0 — Première visite** | Ni préférence, ni paramètre. | Langue de lecture déduite du navigateur. | Mode valyrien glosé. Seuil complet sur le portail, note de seuil ailleurs. |
| **L1 — Valyrien glosé** | Position *Valyrio Ēngos*, glose visible. | Langue de lecture. | Rubriques valyriennes et leur traduction ; récit dans la langue de lecture, sous mention d'édition. |
| **L2 — Valyrien nu** | Bascule *Nūmāzma* désactivée. | Langue de lecture. | Rubriques valyriennes seules. Note de glose au toucher, Index toujours glosé, noms accessibles toujours bilingues. |
| **L3 — Français** | Position Français. | `fr` | Tout en français. Formules et formes valyriennes citées en italique. |
| **L4 — English** | Position English. | `en` | Idem en anglais. |
| **E1 — Rubrique sans valyrien** | Entrée absente du lexique. | — | La rubrique s'affiche dans la langue de lecture, sans marque. Portée au rapport de construction. |
| **E2 — Traduction manquante** | Un récit existe en français, pas encore en anglais (ou l'inverse). | — | Le texte s'affiche dans l'autre langue, précédé de « Not yet translated — shown in French ». Jamais de bloc vide, jamais de traduction automatique. |
| **E3 — Forme à confirmer** | `verifie_en_ligne: false`. | — | Affichée ; mention « forme à confirmer » dans la note de glose et la fiche de mot. |
| **E4 — Paramètre inconnu** | `?l=de`. | — | Ignoré ; état par défaut. |

### 5.9 Attributs de langue

- `<html lang>` vaut toujours la **langue de lecture** (`fr` ou `en`), y compris en mode valyrien. C'est la langue du récit, donc de la majorité du texte, et c'est elle qui règle la voix du lecteur d'écran et la césure. Déclarer `art-x-valyrian` sur la page priverait de voix correcte tout le contenu réellement lu.
- Toute chaîne valyrienne porte `lang="art-x-valyrian"` (étiquette retenue par l'agent 08 ; je la reprends et clos ainsi, pour ma part, le point ouvert du cahier artistique). Aucun lecteur d'écran n'a de voix pour cette étiquette : le valyrien sera prononcé avec la voix courante. **À tester** sur NVDA et VoiceOver par l'agent QA.
- Conséquence : tout élément interactif dont le libellé visible est valyrien a un nom accessible **bilingue** (« Vestriarja, Chroniques »), que la glose soit visible ou non.
- Dans le sélecteur, chaque nom de langue porte son propre `lang`.
- Un nom dans la graphie de Martin ne porte pas `lang="art-x-valyrian"`.
- Le tri alphabétique range Ā avec A, ñ avec n : clé de tri sans diacritique, l'affichage gardant les macrons.

### 5.10 Comment vérifier que le mur est tombé

Aucun des points ci-dessus n'a été éprouvé sur des visiteurs. Je propose un test simple dès la maquette C1 : cinq personnes qui ne lisent pas le valyrien, première visite, une seule consigne (« trouvez qui a tué Lucerys Velaryon »). Réussite si cinq sur cinq y parviennent en moins de deux minutes sans quitter le mode valyrien. En cas d'échec, le premier levier est la taille de la glose, le second l'état par défaut de la bascule ; changer la langue par défaut n'est pas sur la table.

---

## 6. Recherche et filtres

### 6.1 Recherche globale

| Aspect | Décision |
|---|---|
| **Périmètre** | Tous les objets à fiche : personnes, dragons, événements, guerres, lieux, mots, sources, parcours, périodes. Pas le texte intégral des récits : l'index reste léger et les résultats restent des fiches. |
| **Champs indexés** | Titre dans les trois langues ; variantes et surnoms (« le Conquérant », « the Conqueror », « Aegon Ier », « Aegon I ») ; résumé d'une ligne (français, anglais) ; années ; type ; période. Pour un mot : forme, lemme, traductions. |
| **Indépendance de la langue** | Un seul index. « dragon » trouve en mode valyrien ; « zaldrīzes » trouve en mode français ; « Vhagar » trouve la fiche affichée « Vagar ». Quand la correspondance ne porte pas sur le titre affiché, le résultat le dit : « Vagar — correspond à *Vhagar* ». |
| **Accès** | Champ ouvert sur le portail. Ailleurs, *Korjās* dans la barre ouvre une fenêtre de recherche. Raccourci `/`. |
| **Suggestions** | Dès deux caractères, cinq au plus par type, type écrit en toutes lettres, avec ce qui distingue les homonymes : « Aegon II · personne · 107–131 · fils de Viserys Ier ». |
| **Page de résultats** | `search.html?q=…`, résultats groupés par type dans l'ordre fixe Personnes · Dragons · Événements · Guerres · Lieux · Mots · Sources · Parcours, avec compte par groupe et facette de type. |
| **Année** | Une saisie numérique cherche aussi dans les dates : « 129 » propose les événements de l'an 129. |
| **Adresse** | La requête est écrite telle que saisie. La langue n'y figure que par `l`. Un lien de recherche partagé donne les mêmes résultats dans toute langue. |

### 6.2 Tolérance de saisie

Requête et index sont comparés sur une **forme pliée**. L'affichage n'est jamais plié.

| Transformation | Effet |
|---|---|
| Décomposition, suppression des signes diacritiques | « Aegon » trouve *Āegon* ; « zaldrizes » trouve *zaldrīzes* ; « gurenagon » trouve *gūrēñagon* ; « port real » trouve Port-Réal. |
| Minuscules ; `œ` → `oe`, `æ` → `ae` | « oeildieu » trouve l'Œildieu. |
| Apostrophes, tirets et espaces multiples ramenés à une espace | « kings landing » trouve King's Landing. |
| Chiffres romains et arabes équivalents en fin de nom | « aegon 2 » trouve Aegon II. |
| Graphies de Martin et de Peterson réunies par les variantes | « Vhagar » = *Vagar*, « Caraxes » = *Karakses*, « Syrax » = *Syraks*, « Meraxes » = *Merakses*. |
| Une faute tolérée (insertion, omission, substitution ou inversion) sur les mots de cinq lettres et plus | « Rhaenrya » trouve Rhaenyra ; « Danaerys » trouve Daenerys. Les correspondances exactes passent devant. |

Critère de contrôle : jeu d'essai de vingt requêtes fautives ou sans macron, fourni avec les wireframes ; la fiche attendue doit figurer dans les trois premières suggestions.

### 6.3 Facettes par espace

| Espace | Facettes | Tri | Rail de saut |
|---|---|---|---|
| **Chroniques** (une période) | Fiabilité du fait (cinq niveaux) · personne · lieu · dragon · date incertaine. Les faits propres aux adaptations ne sont pas une facette : ils ont leur onglet. À ajouter quand le champ existera : type d'événement (naissance, mort, couronnement, union, bataille, concile ou traité, catastrophe) et guerre. | Chronologique, sans autre choix : ce sont des annales. | Années. |
| **Arbre** | Recherche d'une personne (recentre). Affichage : unions sans descendance, enfants illégitimes, branches cadettes. | — | Générations. |
| **Personnages** | Filtre par nom (saisie) · période · rôle (roi ou reine, prince ou princesse, dragonnier, consort) · maison de naissance · « a monté un dragon ». | Par période puis naissance (défaut) ; alphabétique. | Périodes, et règnes dans la période IV. |
| **Dragons** | Période · sort (mort au combat, de vieillesse, disparu) · dragonnier connu ou non. | Par éclosion (défaut) ; alphabétique. | Aucun. |
| **Guerres** | Aucune au niveau de la liste. Dans une guerre : année, camp, nature (terre, mer, dragons). | Chronologique. | Aucun. |
| **Lieux** | Région · nature (château, cité, île, champ de bataille) · période. | Par région (défaut) ; alphabétique. | Régions. |
| **Langue** | Thème (parenté, feu et dragons, royauté, guerre, temps…) · classe (nom, verbe, adjectif) · niveau d'attestation · « écrit dans l'interface ». | Alphabétique sur forme pliée. | Lettres. |
| **Sources** | Nature (livres, adaptations, travaux linguistiques, interprétations) · décennie. | Par nature puis date. | Aucun. |
| **Parcours** | Niveau (découverte, approfondissement) · durée. | Ordre conseillé. | Aucun. |

**Pourquoi le registre des personnages n'est pas alphabétique par défaut.** Chez les Targaryen, les prénoms se répètent et se ressemblent : dans `genealogy.json`, 42 personnes sur 176 ont un nom en A, 24 en D, 21 en R ; douze s'appellent Aegon, six Daeron, cinq Viserys. Une liste alphabétique range côte à côte des homonymes séparés de deux siècles. Le classement par période, puis par naissance, sépare ce que l'alphabet confond ; chaque ligne porte en plus ce qui distingue (dates, filiation, titre). L'alphabet reste disponible comme tri.

### 6.4 Comportement des filtres

- Effet immédiat sur bureau. Sur mobile, feuillet de filtres avec un bouton « Voir N résultats ».
- Le compte de résultats est toujours affiché et annoncé (`aria-live="polite"`).
- Une valeur de facette qui mènerait à zéro résultat est désactivée et affiche « 0 » : on ne peut pas s'enfermer.
- Les filtres actifs sont rappelés en tête de liste, chacun avec sa croix de retrait, plus « tout retirer ». Forme : étiquettes à pan coupé du cahier artistique, pas de pastilles.
- L'état est écrit dans l'adresse : un filtre se partage et survit au bouton Retour.

### 6.5 États vides

| Situation | Ce qui s'affiche |
|---|---|
| Recherche sans résultat | La requête rappelée ; jusqu'à trois propositions proches (« Vouliez-vous dire Rhaenyra ? ») ; rappel que les macrons sont facultatifs ; liens vers les registres. Jamais une page blanche avec un seul mot. |
| Filtres sans résultat (cas limite, puisque les valeurs nulles sont désactivées) | « Aucun événement ne correspond. » puis le filtre dont le retrait rend le plus de résultats : « Sans "Lieu : Harrenhal" : 12 événements ». |
| Registre encore vide (contenu non livré) | « Ce registre est en cours de constitution. » avec la date de l'état du fonds. Pas de faux contenu. |
| Fiche sans événement, sans dragon, etc. | La section est supprimée, pas affichée vide. Exception : « Sources », toujours présente, quitte à dire « non documenté ». |
| Index de recherche non chargé | « La recherche n'a pas pu être chargée. » avec « Réessayer » et le lien vers l'Index. |

En mode valyrien, les messages d'état vide sont des textes de classe 5 : ils sont dans la langue de lecture. Seul l'intitulé peut être valyrien s'il existe au lexique.

---

## 7. Six parcours utilisateurs

Chaque parcours donne son contexte, ses étapes et ses critères de réussite. Les critères notés **[auto]** sont vérifiables par script (Playwright est disponible dans l'environnement) ; ceux notés **[test]** demandent des personnes.

### P1 — « Je ne connais rien, je veux comprendre la Danse des Dragons »

Contexte : bureau 1280 × 720, première visite, navigateur en français, aucune préférence.

1. **Seuil.** Lit « Valar morghūlis » et sa glose. Active « Valar dohaeris — entrer ».
2. **Portail**, valyrien glosé. Dans la table, repère « V · Zaldrīzoti Lilion · *La Danse des Dragons* · 105–153 ». L'active. *(interaction 1)*
3. **Page de la période.** En tête, le bloc « En bref » (120 mots au plus, en français ; c'est le champ `summaryFr` de la période) : qui s'affronte, pourquoi, comment cela finit. Deux camps nommés. Un lien vers le parcours « La Danse en sept étapes ».
4. **Annales.** Active le premier événement. *(interaction 2)*
5. **Fiche d'événement.** Lit les faits, puis « Conséquences », qui sont des liens. Active « Suivant ». *(interaction 3, puis une par événement)*
6. À tout moment, « Camps et batailles » ouvre la fiche de la guerre.

Critères de réussite :

- **C1.1 [auto]** Depuis le portail, le bloc « En bref » de la Danse est affiché après une seule activation.
- **C1.2 [auto]** À 1280 × 720, le bas de ce bloc est à moins de 720 px du haut de la page. À 360 × 640, son premier mot est dans le premier écran.
- **C1.3 [auto]** En suivant « Suivant » depuis le premier événement de la période, on atteint le dernier en N − 1 activations, sans repasser par la liste.
- **C1.4 [auto]** Chaque fiche d'événement a une section « Conséquences » contenant au moins un lien, ou la phrase « Aucune conséquence documentée ».
- **C1.5 [test]** Cinq personnes sur cinq qui ne lisent pas le valyrien atteignent le bloc « En bref » en moins de 60 secondes après l'apparition du seuil, sans changer de langue. Après trois minutes, quatre sur cinq nomment les deux camps.

### P2 — « Je cherche les parents de tel personnage sur mon téléphone »

Contexte : 360 × 640, portrait, visite de retour, mode valyrien glosé. Personnage : Aemond.

1. **Portail.** Touche le champ *Korjās* et saisit « aemond ». *(interaction 1)*
2. **Suggestions.** « Aemond · personne · 110–130 · fils de Viserys Ier ». La touche. *(interaction 2)*
3. **Fiche.** Dans le cartouche d'identité, sous la ligne de vie : « *Kepa* · père — Viserys I » et « *Muña* · mère — Alicent Hightower ». Les deux sont des liens.
4. Facultatif : « Voir dans la lignée » ouvre l'arbre centré sur Aemond, parents au-dessus. *(interaction 3)*

Critères de réussite :

- **C2.1 [auto]** Les noms du père et de la mère sont affichés après deux interactions au plus depuis le portail.
- **C2.2 [auto]** À 360 × 640, le bloc des parents est entièrement à moins de 960 px du haut de la fiche (un écran et demi).
- **C2.3 [auto]** Chaque lien de parent a une zone active d'au moins 44 × 44 px.
- **C2.4 [auto]** Aucun défilement horizontal : `scrollWidth ≤ clientWidth` sur la fiche et sur l'arbre.
- **C2.5 [auto]** « aemond », « AEMOND », « aémond » et « aemnod » placent la fiche dans les trois premières suggestions.
- **C2.6 [auto]** Chemin de secours sans recherche : Portail → Lignée → champ « chercher une personne » → Aemond, parents visibles sans défilement dans l'arbre à focale.

### P3 — « Je veux apprendre dix mots de valyrien »

Contexte : tout écran, toute langue.

1. **Portail** → *Gūrēñagon* (Apprendre). *(1)*
2. **Parcours.** « Dix mots de valyrien · 10 étapes · environ 10 minutes ». L'ouvre. *(2)*
3. **Présentation.** Sommaire des dix étapes. « Commencer » ouvre l'étape 1. *(3)*
4. **Étape.** Le mot, son sens, sa prononciation écrite, un exemple attesté, « où le lire dans la bibliothèque ». Une question à choix unique. « Répondre », puis l'explication, puis « Suivant ».
5. **Fin.** Récapitulatif des dix mots avec lien vers chaque fiche, résultat en une phrase.

Critères de réussite :

- **C3.1 [auto]** Le premier mot est affiché en trois activations au plus depuis le portail.
- **C3.2 [auto]** Les dix mots du parcours ont le statut `atteste` dans `lexicon.json` et `verifie_en_ligne: true`.
- **C3.3 [auto]** Le parcours entier se fait au clavier seul (Tab, flèches dans le groupe de choix, Entrée).
- **C3.4 [auto]** Aucune minuterie, aucun compte à rebours, aucune animation de plus de 420 ms.
- **C3.5 [auto]** Après rechargement de la page, l'étape en cours et les réponses données sont retrouvées. Une commande « Recommencer » efface tout.
- **C3.6 [auto]** On peut passer à l'étape suivante sans répondre.
- **C3.7 [auto]** Le résultat est un texte (« 8 réponses justes sur 10 »), sans note sur vingt, sans étoile, sans classement.

### P4 — « Je veux vérifier d'où vient une information »

Contexte : fiche de Rhaenyra, en français, bureau puis mobile.

1. **Fiche.** Chaque assertion datée porte un appel de source. Sur bureau, la glose de marge est visible en regard : titre abrégé, nature, passage. Sur mobile, toucher l'appel ouvre un feuillet bas avec les mêmes informations. *(interaction 1 sur mobile, 0 sur bureau)*
2. **« Voir la source »** ouvre la fiche de la source : notice, nature, narrateur interne, fiabilité, liste des fiches qui la citent. *(interaction 2)*
3. **Retour** du navigateur : même fiche, même position.
4. Autre chemin : en bas de toute fiche, « Sources de cette fiche », groupées par nature.

Critères de réussite :

- **C4.1 [auto]** Sur une fiche, 100 % des assertions marquées (`data-assertion`) ont au moins une source (`data-source`).
- **C4.2 [auto]** De l'assertion à la notice complète de la source : deux activations au plus.
- **C4.3 [auto]** La nature de la source est un mot dans le texte accessible (« Livre », « Adaptation », « Interprétation »).
- **C4.4 [auto]** Tout contenu issu des seules adaptations se trouve dans un bloc dont le titre contient le mot « adaptation » (ou son équivalent anglais).
- **C4.5 [auto]** Toute fiche a une section « Sources » non vide.
- **C4.6 [auto]** Après Retour, la position de défilement est restituée à 100 px près.
- **C4.7 [auto]** La fiche d'une source liste toutes les fiches qui la citent (compte égal au nombre de fiches portant cette source).

### P5 — « On m'envoie un lien ; je ne lis pas le valyrien et je veux garder ma langue »

Contexte : première visite, lien `…/version-1/dragons/vhagar.html` sans paramètre, navigateur en anglais.

1. **Arrivée.** Version brève de l'ouverture. La fiche est en valyrien glosé, gloses en anglais. En tête du contenu, la note de seuil : « This library opens in High Valyrian. Read in English · Lire en français · Keep it this way ».
2. **Choix.** Active « Read in English ». *(interaction 1)* La page passe en anglais sans rechargement ; l'adresse devient `…/vhagar.html?l=en`.
3. **Suite.** Ouvre la fiche d'un dragonnier : elle est en anglais. Ferme le navigateur, revient le lendemain : anglais.
4. **Partage.** Copie l'adresse. Un destinataire sans préférence la voit en anglais ; un destinataire qui a choisi le français la voit en français.

Critères de réussite :

- **C5.1 [auto]** Le changement de langue ne déclenche aucune navigation (même document, aucun événement `load`) et s'achève en moins de 200 ms.
- **C5.2 [auto]** Après le changement, `document.documentElement.lang` vaut `en`, et le premier titre qui était visible l'est encore.
- **C5.3 [auto]** La préférence survit au rechargement et vaut dans `/version-2/` et `/version-3/`.
- **C5.4 [auto]** Sans préférence mémorisée, `?l=fr` affiche le français. Avec une préférence `en`, `?l=fr` affiche l'anglais.
- **C5.5 [auto]** Le sélecteur de langue est atteint en six tabulations au plus depuis le haut de la page (lien d'évitement, sceau, Index, Chercher, puis la première position du sélecteur).
- **C5.6 [auto]** En mode valyrien, aucun élément interactif n'a un nom accessible uniquement valyrien.
- **C5.7 [auto]** La note de seuil n'apparaît plus après un choix.

### P6 — « Au clavier et au lecteur d'écran, je descends d'Aegon Ier à ses petits-enfants »

Contexte : clavier seul, lecteur d'écran, toute version.

1. **Portail.** Lien d'évitement, puis l'entrée « Zaldrīzo Ānogar, La lignée » de la table. *(1)*
2. **Arbre.** Le focus va au titre. La vue est structurée par titres : la personne au centre (niveau 2), puis « Parents », « Fratrie », « Unions et enfants » (niveau 3), avec une sous-section par union. Recherche « aegon », choix de « Aegon I ». *(2)*
3. **Recentrage.** Dans la première union, active « Aenys I, fils, 7–42 ». L'arbre se recentre ; le focus va au nouveau titre, annoncé : « Aenys I au centre ». *(3)*
4. Active un enfant d'Aenys : même mécanisme.
5. « Ouvrir la fiche » mène à la fiche canonique.

Critères de réussite :

- **C6.1 [auto]** Recentrer, chercher, changer de génération et ouvrir une fiche sont faisables au clavier seul, sans piège de focus.
- **C6.2 [auto]** Chaque personne de l'arbre est un lien dont le nom accessible contient le nom, la relation avec la personne centrale et les dates.
- **C6.3 [auto]** Après un recentrage, le focus est sur le titre de la personne centrale et une région `aria-live` l'annonce.
- **C6.4 [auto]** D'un ancêtre à un petit-enfant : deux activations.
- **C6.5 [auto]** Retour du navigateur revient au centre précédent.
- **C6.6 [auto]** Les enfants sont rangés sous l'union dont ils sont issus ; une personne à deux unions présente deux groupes d'enfants distincts et titrés.
- **C6.7 [test]** Une personne utilisant un lecteur d'écran décrit correctement les deux unions de Rhaenyra et les enfants de chacune.

---

## 8. Les trois directions : ce qui est commun, ce qui diffère, ce qui inquiète

### 8.1 Le socle commun

| Commun aux trois versions | Détail |
|---|---|
| Adresses | Même chemin relatif sous chaque préfixe. Le pied de page offre « cette page dans une autre version ». |
| Contenus | Mêmes fiches, mêmes champs, mêmes liens croisés. |
| Langue | Même sélecteur, mêmes cinq classes de texte, même glose, même mémoire (partagée). |
| Barre | Sceau, Index, Chercher, langue : toujours visibles, toujours nommés. |
| Recherche | Même index, mêmes règles de tolérance, même page de résultats. |
| Alternatives | Arbre à focale en liste, annales en table, lieux en liste : identiques partout. |
| Critères QA | Les critères C1 à C6 s'appliquent aux trois versions sans adaptation. |

### 8.2 Ce qui diffère

| | V1 Le Codex | V2 La Lignée | V3 La Table d'étude |
|---|---|---|---|
| **Portail** | Page de titre et table : huit volumes, puis neuf registres. | Tête du fil ; les registres dans l'Index et dans une table sobre sous le premier nœud. | Codex ouvert, ruban, réglette ; table des registres dans le codex. |
| **Passer d'une fiche à l'autre** | Page suivante ou précédente dans les séries qui ont un ordre. | Descendre le fil ; stèle ouverte sur place. | Poser un second document à côté du premier. |
| **Période** | Un chapitre : annales en table. | Annales en stèles ; renvois vers les maillons du fil concernés. | Annales dans un folio, réglette réglée sur la période. |
| **Fiche** | Un folio, une page. | Une stèle ouverte sur place (`?open=`), plus la page canonique. | Un feuillet ; deux au plus (`?with=`). |
| **Arbre** | Planche à déplacer et agrandir, plus focale. | Le fil de filiation (vingt maillons) comme vue d'ensemble, plus focale. | Focale comme vue principale. |
| **Repère de temps** | Folio et titre courant. | Jauge des huit ères. | Réglette. |
| **Geste propre** | Tourner. | Descendre les générations. | Croiser. |

### 8.3 Réserves sur V1 — Le Codex

Gravité : **bloquant** (casse un parcours), **majeur** (dégrade nettement), **mineur**.

| # | Réserve | Gravité | Ce que je demande |
|---|---|---|---|
| V1-1 | **Les huit signets ne sont que les Chroniques.** La navigation permanente décrite (signets de tranche) ne couvre que les Chroniques : huit des dix espaces n'y figurent pas, et l'accueil décrit ne liste que les huit volumes. | Bloquant pour la règle des trois interactions | La table du portail a deux parties : volumes, puis registres. L'Index est dans la barre. |
| V1-2 | **« Tourner la page » n'a de sens que dans une série.** Les deux tiers du musée sont des registres à accès direct. Le voisin alphabétique de Rhaenyra n'est pas ce que cherche le visiteur. | Majeur | Précédent / suivant réservés aux séries ordonnées (3.2). Ailleurs, pas de flèche. |
| V1-3 | **« Une adresse par page » et pagination.** Si un texte long est découpé en pages au gabarit 2:3, la coupe dépend de la fenêtre : la page 3 d'un téléphone n'est pas celle d'un écran large. L'adresse devient instable, la recherche du navigateur dans la page s'arrête au pli, le lecteur d'écran lit des morceaux. | Bloquant si retenu | Une page est une unité logique (un chapitre, une fiche) qui défile verticalement. Le folio est un numéro d'ordre, pas une découpe physique. |
| V1-4 | **Flèches du clavier.** Elles déplacent déjà le curseur de lecture des lecteurs d'écran, le point d'insertion des champs et la planche de l'arbre. | Majeur | Raccourci actif hors champ, hors planche, et toujours doublé d'un lien visible. |
| V1-5 | **Double page à partir de 1 200 px.** Deux colonnes de folio posent une question d'ordre de lecture. | Mineur | Réservée au portail et aux ouvertures de volume. |
| V1-6 | **Planche de l'arbre sur mobile.** Une zone à déplacer dans une page qui défile piège le doigt. | Majeur | Sur mobile, la focale par défaut ; la planche s'ouvre en plein écran par un bouton explicite. |
| V1-7 | **Barre basse mobile** (titre courant et folio). | Mineur | Y loger aussi précédent / suivant ; respecter la zone sûre du bas ; une seule barre fixe en paysage. |

V1 est la direction la plus sûre pour l'usage. Son risque n'est pas l'échec, c'est de traiter en livre ce qui est un fichier.

### 8.4 Réserves sur V2 — La Lignée

C'est la direction la plus forte visuellement et la plus fragile à l'usage. Je la détaille.

| # | Réserve | Gravité | Ce que je demande |
|---|---|---|---|
| V2-1 | **Aucun menu visible, une jauge de huit strates sans libellé.** C'est une navigation à deviner, dans une interface en langue inconnue : deux murs l'un sur l'autre. Cela contredit le principe du cahier lui-même (pas d'icône sans libellé). | Bloquant | Barre commune toujours visible. La strate courante de la jauge est nommée en permanence ; les autres le sont au survol, au focus et au toucher. |
| V2-2 | **Le cahier donne au fil deux sens incompatibles** : « descendre la page, c'est descendre la lignée », et « le défilement est la chronologie », avec une échelle en pixels par an. Un fil unique doit choisir entre trois ordres, le temps, la succession et la filiation, et les données de l'agent 03 montrent qu'ils ne coïncident pas. Sur les 16 passages de couronne entre les 17 rois, 7 ne vont pas de parent à enfant ; la couronne remonte même une fois d'une génération (de Baelor Ier à son oncle Viserys II). 23 unions sur 69 lient deux proches parents : il existe 640 chemins de filiation d'Aenar à Daenerys pour 37 ancêtres. Et le temps manque : 44 personnes sur 176 n'ont aucune année, 43 n'ont que des années approchées. | Bloquant pour le fil tel que le cahier le décrit | **Je me range à l'analyse de l'agent 03** (`documentation/history/notes-genealogie.md`, section 5). Le fil est la **filiation**, sur les vingt personnes de son `mainThread`, une par génération. L'axe vertical est la génération, pas le temps. La couronne est une seconde couche numérotée, qui s'écarte du fil et y revient. L'échelle en années et la « faille » de changement d'échelle disparaissent du fil. J'avais d'abord recommandé un fil du temps et des règnes : je retire cette recommandation. Les dates manquantes la rendent impraticable, et la filiation est le seul des trois ordres à avoir une ossature complète, vérifiée par script. |
| V2-3 | **Largeur à 360 px.** Avec le fil à 24 px du bord, il reste 312 px. La génération la plus large compte 18 personnes, la plus grande fratrie 13, et Maegor Ier a six unions. L'agent 03 propose de replier les fratries dans un « tiroir latéral » et de dessiner une union entre proches comme une boucle fermée sur la rangée. La boucle tient (deux nœuds côte à côte). Le tiroir, lui, n'a pas de côté où s'ouvrir. | Bloquant sur mobile si le tiroir reste latéral | Sur mobile, le tiroir d'un maillon est un feuillet qui s'ouvre **vers le bas** : conjoint, puis enfants groupés par union. C'est l'arbre à focale (wireframe W05). Autant le dire et le dessiner ainsi : le fil est la vue d'ensemble, la focale est le détail. |
| V2-4 | **Où vivent les 125 événements ?** Si le fil est la filiation, la page d'accueil compte vingt rangées et n'est plus « très longue » : ce risque tombe. Mais les événements sont datés par année, les rangées sont des générations, et un événement de 129 concerne trois générations à la fois. Les huit périodes se chevauchent (IV : 1–129, V : 105–153, VI : 131–262) : la jauge de huit strates ne peut pas indiquer une profondeur de défilement. | Majeur | Les événements restent dans les **annales de leur période**, huit pages aux adresses communes. Sur le fil, chaque maillon porte un compteur (« 14 événements ») qui mène aux annales filtrées sur cette personne. La jauge est un sommaire des huit périodes, nommées, pas un indicateur de position. |
| V2-5 | **Stèles ouvertes « sans changer de page ».** Sur mobile, une stèle « à côté du nœud » n'a pas de côté : elle couvre l'écran. Si elle n'a pas d'entrée d'historique, le bouton Retour fait quitter le site. | Bloquant sur mobile | L'ouverture crée une entrée d'historique (`?open=`). Retour ferme la stèle. Le lien pointe vers la fiche canonique. |
| V2-6 | **Les espaces sans rapport avec la lignée** (Langue, Sources, Apprendre, Lieux) n'ont aucune place dans la métaphore. Le cahier n'en dit rien. Risque : un accueil remarquable et sept espaces traités en annexe. | Majeur | Les décrire dès la conception : registres en stèles, sur pierre, avec la jauge d'ères quand le temps a un sens (Guerres, Dragons) et sans elle ailleurs. |
| V2-7 | **Jauge latérale en paysage.** Huit cibles de 44 px font 352 px ; un téléphone couché offre environ 300 px utiles. | Majeur | En paysage, la jauge devient un seul contrôle (*Elēdris*, « époque ») ouvrant la liste des huit ères. |
| V2-8 | **Capitales lapidaires en nombre.** Fatigue de lecture ; les macrons de capitales demandent de l'interlignage (planchers de l'agent 08). | Mineur | Capitales pour le nom seul. Faits et texte en bas de casse. |
| V2-9 | **Fil tracé au défilement et mouvement réduit.** | Mineur | Fil entièrement tracé d'emblée en mouvement réduit. |

**L'épreuve que je propose avant de s'engager sur V2**, plus précise que celle du cahier : prototyper à 360 px, sur `genealogy.json`, les seules rangées 10 à 12 du fil (Viserys Ier, Rhaenyra, Viserys II). Elles contiennent deux lits, une union entre oncle et nièce qui enjambe deux rangées, trois filiations contestées, une liaison incertaine, et la couronne qui quitte le fil pour Aegon II, y touche pour Rhaenyra sans s'y fixer, passe à Aegon III puis revient. Si ce passage se lit sans légende, V2 tient. Sinon, V2 garde le fil comme sommaire de vingt noms et laisse la généalogie à la focale.

### 8.5 Réserves sur V3 — La Table d'étude

| # | Réserve | Gravité | Ce que je demande |
|---|---|---|---|
| V3-1 | **Filtrage croisé silencieux.** « Choisir sur l'un filtre l'autre » : le visiteur choisit une personne sur le ruban, la réglette se vide de trois quarts de ses événements, et dix minutes plus tard il ne sait plus pourquoi. | Majeur | Tout filtre posé par un axe est écrit en clair (« Limité à : Rhaenyra ») avec son retrait en un geste. |
| V3-2 | **Le ruban sur une colonne** ne peut pas porter une généalogie (voir V2-2). Il peut porter le fil principal de l'agent 03 : vingt noms. | Majeur | Le ruban est le `mainThread`, avec les numéros de règne en marque. Le reste de la lignée est dans l'arbre à focale. |
| V3-3 | **Ruban « replié en marge gauche » sur mobile.** Une bande de 24 px n'est pas une cible de 44 px, et le bord gauche est la zone du geste Retour des systèmes mobiles. De plus, une marge permanente de 44 px ramène la colonne de texte à environ 276 px, soit 34 signes par ligne, sous les 40 mesurés par l'agent 08. | Bloquant sur mobile | Pas de bande active au bord. Le ruban s'ouvre par un bouton de la barre basse. |
| V3-4 | **Réglette « que l'on fait glisser », en barre basse.** Trois siècles sur 360 px : un pixel par an, aucun événement ne se vise. Le glissement horizontal en bas d'écran croise les gestes du système. Et tout glissement doit avoir une alternative en simple pointage (WCAG 2.2, critère 2.5.7). | Majeur | À 360 px, la réglette a huit crans (les périodes) et deux boutons. Le glissement est un confort de grand écran. |
| V3-5 | **Documents « posés sur la table ».** Une métaphore de bureau appelle la gestion de fenêtres : combien, où, comment fermer. | Majeur | Deux documents au plus, placement fixe, pas de déplacement libre. Sous 1 200 px, deux onglets. |
| V3-6 | **Quatre systèmes de navigation à la fois sur le portail mobile** (barre, ruban, réglette, codex). | Majeur | Un seul fixe en haut, un seul fixe en bas. |

V3 a la meilleure idée pour l'arbre (la focale) et la meilleure idée d'usage (comparer deux fiches). Je recommande de les verser au socle commun dès V1 plutôt que de les réserver à V3.

---

## 9. Accessibilité et mobile

Cible : WCAG 2.2, niveau AA. Rien ci-dessous n'a été testé ; ce sont des spécifications.

### 9.1 Ordre de focus

Sur toute page, dans l'ordre du DOM, identique à l'ordre visuel :

1. Lien d'évitement « Aller au contenu » (dans la langue de lecture).
2. Marque du sceau (retour au portail).
3. Index.
4. Chercher.
5. Sélecteur de langue (trois boutons), puis bascule de glose en mode valyrien.
6. Titre courant (fil d'Ariane).
7. Contenu : titre de niveau 1, puis sommaire de fiche, puis sections.
8. Navigation de série (précédent / suivant).
9. Bouton « Mots valyriens de cette page ».
10. Pied.

| Composant | Comportement du focus |
|---|---|
| **Seuil** | Arrière-plan `inert`. Ordre : bouton de réponse, puis sélecteur de langue. Le bouton est dans le DOM et actif dès le début ; l'activer pendant l'animation entre immédiatement. À l'entrée, le focus va au titre principal du portail. |
| **Index** | Fenêtre modale : focus piégé, Échap ferme, le focus revient au bouton Index. |
| **Recherche** | Fenêtre modale ; motif de liste de suggestions (`combobox`) ; flèches dans la liste, Entrée ouvre, Échap ferme. |
| **Note de glose** | Non modale. Échap ferme. Ne prend pas le focus à l'ouverture par pointeur. |
| **Feuillet de source (mobile)** | Modal ; le focus revient à l'appel de source. |
| **Panneau de personne de l'arbre** | Région complémentaire non modale sur bureau ; feuillet modal sur mobile. |
| **Filtres (mobile)** | Feuillet modal ; « Voir N résultats » ferme et place le focus sur le compte de résultats. |

Anneau de focus : celui du cahier artistique (or pâle 2 px décalé de 3 px sur sombre, encre sur parchemin). Attention au `clip-path` des pans coupés, déjà signalée par l'agent 07.

### 9.2 Alternatives pour l'arbre, la frise et la carte

| Instrument | Base toujours présente | Ce que l'instrument ajoute | Clavier | Lecteur d'écran |
|---|---|---|---|---|
| **Arbre** | **Vue à focale en listes** : personne centrale, parents, fratrie, unions, enfants par union. Ce sont des listes de liens sous des titres. C'est la vue par défaut sur mobile dans les trois versions. | Planche (V1), fil de filiation (V2) : vue d'ensemble dessinée. | Tab et Entrée suffisent. Pas de rôle `tree` ARIA : des listes titrées sont plus robustes. Sur la planche : boutons +, −, recentrer. | Navigation par titres. Chaque lien dit nom, relation, dates. Recentrage annoncé. Le dessin est `aria-hidden` : il ne dit rien de plus que les listes. |
| **Frise / annales** | **Table d'annales** : une ligne par événement, année en en-tête de groupe. | Réglette (V3). Pas de frise à l'échelle des années pour les personnes : la moitié n'a pas de dates complètes. | Rail d'années en liens. | Table avec en-têtes ; le groupe d'année est un titre. |
| **Carte** | **Liste des lieux par région.** | Planche cartographique avec repères. | La liste se parcourt ; choisir un lieu met son repère en évidence. Les repères ne sont pas des arrêts de tabulation : ce serait doubler la liste. Boutons +, − pour l'échelle. | La carte est une image décrite en une phrase (« Carte schématique : positions relatives des lieux de la liste »). Toute l'information est dans la liste. |

### 9.3 Cibles, gestes, orientation

| Sujet | Règle |
|---|---|
| **Cibles** | 44 × 44 px au moins pour tout contrôle et tout lien de liste ; 8 px au moins entre deux cibles. Exception : liens dans une phrase. Les appels de source, petits par nature, ont une zone active étendue à 44 px. |
| **Gestes requis** | Toucher et défilement natif, rien d'autre. |
| **Gestes de confort** | Balayage pour tourner la page (V1), pincement sur la planche et la carte, glissement de la réglette (V3) : toujours doublés d'un bouton. |
| **Gestes exclus** | Appui long, double toucher, balayage depuis un bord. |
| **Bords** | Aucun contrôle actif dans les 16 px des bords gauche et droit. Barre basse au-dessus de la zone sûre (`safe-area-inset-bottom`). |
| **Paysage** | Aucun verrouillage d'orientation. À 640 × 360 : une seule barre fixe, de 48 px au plus ; seuil en deux colonnes (sceau à gauche, formules et bouton à droite) ; jauge V2 repliée ; focale de l'arbre en trois colonnes (parents, centre, unions). |
| **Recomposition** | Aucun défilement horizontal à 320 px de large, sauf la planche de l'arbre et la carte, qui ont leur alternative. |
| **Agrandissement** | Texte à 200 % sans perte ; les tailles de l'agent 08 gardent une part en `rem`. |
| **Sans script** | Fiches lisibles, liens actifs, sélecteur de langue si la bascule en CSS seul est retenue. Recherche, arbre dessiné et seuil absents, remplacés par l'Index et les listes. |

### 9.4 Mouvement

Je reprends les règles du cahier artistique (7.4, 6.3) et j'ajoute quatre points.

1. **Boucle de la flamme.** Le cahier autorise une boucle d'ambiance permanente. Une animation qui dure plus de cinq secondes à côté d'un contenu doit pouvoir être arrêtée par le visiteur (WCAG 2.2.2), même sans réglage système. Demande : sur les pages de contenu, la flamme est allumée et immobile ; la boucle est réservée au seuil. À arbitrer avec les agents 07 et 10.
2. **Changement de langue** : instantané, sans fondu de tout l'écran.
3. **Recentrage de l'arbre** : en mouvement réduit, remplacement sans déplacement.
4. **Chute de cendres de V2** : à côté d'elle, un contrôle « arrêter » visible, pas seulement le réglage système.

### 9.5 Ce qu'il faudra tester et que personne n'a encore testé

- Restitution de `lang="art-x-valyrian"` par NVDA, JAWS et VoiceOver.
- Stockage local et réécriture d'adresse en ouverture `file://` sur Chrome, Firefox et Safari.
- Lisibilité de la glose à 12–13 px (`--fs-label`) sur un téléphone en extérieur.
- Tenue du portail glosé à 360 px : chaque entrée de la table occupe deux lignes.

---

## 10. Réponses aux points ouverts du cahier artistique

### 10.1 Sélecteur de langue sur le seuil

**Oui, avec cinq conditions.**

1. **Noms entiers, pas codes** : *Valyrio Ēngos* · Français · English. « HV » ne dit rien à un visiteur qui arrive.
2. **Actif immédiatement.** Il peut paraître au plan 3 comme le propose le cahier, mais il est dans le DOM et utilisable dès le plan 0 ; changer de langue pendant la séquence ne la relance pas.
3. **Séparé du bouton de réponse** : 24 px au moins entre eux, en bas de l'écran sur mobile, dans la zone du pouce.
4. **Il ne fait pas entrer.** Il change les gloses et le mot d'action. On entre par la réponse.
5. **Il ne suffit pas.** Sans gloses, le seuil reste un mur : sous « Valar morghūlis » paraît sa traduction, et sous « Valar dohaeris » sa traduction et le mot « entrer ». Un bouton dont le libellé est une formule rituelle en langue inconnue n'est pas reconnu comme un bouton d'entrée.

Les deux formules restent en valyrien dans les trois langues. Elles sont le seul texte que le cahier des charges cite mot pour mot.

Sur la graphie : le lexique donne *Valar morghūlis*, avec macron ; le commanditaire écrit « Valar morghulis ». Ce n'est pas à moi de trancher. Du point de vue de l'usage, les deux fonctionnent, et la recherche les confond (6.2). J'emploie la forme du lexique dans les wireframes.

### 10.2 Porte rituelle ou entrée automatique

Le cahier propose l'entrée automatique en V1 et la porte en V2 et V3. **Je recommande la porte dans les trois versions, et le rituel complet à la première visite seulement.**

Trois arguments :

1. **L'entrée automatique annule le sélecteur du seuil.** En V1, le site s'ouvre seul 1 200 ms après la réponse. Le visiteur qui tend la main vers « Français » voit la cible disparaître. Soit V1 a la porte, soit V1 n'a pas de sélecteur sur le seuil. La porte est la seule forme qui donne au visiteur le temps de choisir sa langue.
2. **Un mouvement non demandé qui remplace l'écran** est ce que les règles du cahier interdisent partout ailleurs (« rien ne bouge sans cause »). La cause, ici, c'est le geste du visiteur.
3. **La comparaison des versions doit porter sur la navigation**, pas sur le seuil. Un seuil identique retire une variable.

Et une divergence sur la fréquence. Le cahier prévoit le rituel une fois par session. Une bibliothèque se consulte : qui revient chaque jour vérifier une parenté paie chaque jour trois secondes et un geste. Je propose :

| Situation | Ouverture |
|---|---|
| Première visite sur cet appareil, arrivée par le portail | Rituel complet et porte. |
| Visites suivantes | Version brève de 900 ms, sans porte. |
| Arrivée par lien profond | Version brève, comme le prévoit le cahier ; note de seuil à la première visite. |
| À la demande | « Rejouer l'ouverture » au colophon. |

Si l'orchestrateur maintient « une fois par session », je demande au moins que la durée minimale de trois secondes ne s'applique qu'à la première visite.

### 10.3 Balise de langue

`art-x-valyrian`, comme l'agent 08. Emploi détaillé en 5.9.

### 10.4 Tenue du fil unique face à la généalogie réelle

Le cahier adressait la question à l'agent 03, qui y a répondu pendant ce travail, chiffres à l'appui : le fil tient **s'il est la filiation et non la couronne, et s'il est un axe et non l'arbre entier**. Je m'y range (V2-2), et j'ajoute trois conditions d'usage :

1. le cahier renonce à l'échelle en années le long du fil ;
2. sur mobile, le tiroir d'un maillon s'ouvre vers le bas et c'est la focale (V2-3) ;
3. les événements restent dans les annales des périodes, et la jauge des huit ères devient un sommaire (V2-4).

---

## 11. Récapitulatif pour l'agent QA

| Réf. | Assertion vérifiable | Section |
|---|---|---|
| Q-01 | Toute fiche est à une profondeur ≤ 3 depuis le portail. | 3.3 |
| Q-02 | Tout lien interne est relatif et nomme un fichier `.html`. | 2.1 |
| Q-03 | Le même chemin relatif existe sous les trois préfixes de version. | 1, 8.1 |
| Q-04 | Tout lien entre deux fiches a son réciproque. | 1, 4.2 |
| Q-05 | Tout élément `[lang="art-x-valyrian"]` se résout dans le lexique. | 5.4 |
| Q-06 | En mode valyrien, aucun nom accessible d'élément interactif n'est uniquement valyrien. | 5.9 |
| Q-07 | Le changement de langue ne recharge pas la page et tient en 200 ms. | 5.7 |
| Q-08 | `<html lang>` vaut `fr` ou `en`, jamais autre chose. | 5.9 |
| Q-09 | Le jeu de vingt requêtes fautives trouve sa cible dans les trois premières suggestions. | 6.2 |
| Q-10 | Aucune valeur de facette active ne mène à zéro résultat. | 6.4 |
| Q-11 | Toute cible tactile mesure au moins 44 × 44 px (hors liens en ligne). | 9.3 |
| Q-12 | Aucun défilement horizontal à 320 px, hors planche et carte. | 9.3 |
| Q-13 | Chaque instrument (arbre, frise, carte) a sa liste équivalente dans la même page. | 9.2 |
| Q-14 | Critères C1.1 à C6.6 des six parcours. | 7 |
| Q-15 | Toute fiche a une section « Sources » ; tout contenu d'adaptation est dans un bloc titré. | 4.3 |
| Q-16 | Retour du navigateur ferme un panneau ou une stèle ouverts sur place et défait un recentrage d'arbre. | 2.3 |

---

## 12. Raccord avec les données livrées pendant ce travail

Les fichiers des agents 02 et 03 sont arrivés alors que ce document était écrit. Je les ai lus en fin de travail. Ce tableau dit ce qui s'accorde déjà avec l'architecture, ce qui manque pour la servir, et ce que les données m'ont fait corriger.

### 12.1 Ce qui s'accorde déjà

| Besoin de l'architecture | Dans les données |
|---|---|
| Unions comme objets, enfants rattachés à une union | `unions[]` et `parentage[].union` (`genealogy.json`). C'est exactement ce que demande l'arbre à focale. |
| Certitude d'une filiation ou d'une union | `certainty` : établi, contesté (avec `allegedFather`), incertain. |
| Fil principal pour la navigation par génération | `mainThread.ids`, vingt personnes, contrôlé par script. |
| Succession des règnes | `succession.json` (mode, contestation, lien de parenté) et `sovereigns.json`. |
| Homonymes distingués | Dans les identifiants. |
| Fiabilité à l'échelle du fait, adaptations tenues à part | `reliability`, `continuity`, identifiants `tv-`. |
| Résumé de période de 120 mots | `summaryFr` : celui de la Danse fait 120 mots. |
| Sources avec passage | `sources[].locator`. |
| Dates absentes non comblées | `null`, `dateCertainty`, `bornRange`. |
| Couleur de dragon limitée au texte des livres | `colorFr` et `colorKey`, `null` sinon. |

### 12.2 Ce qui manque pour servir l'architecture

| # | Manque | Conséquence à l'écran | À qui |
|---|---|---|---|
| 1 | **Les événements citent des noms, pas des identifiants** (`people`, `dragons`, `places`). Les dragonniers de `dragons.json` aussi. | Aucun lien croisé ne peut être engendré, ni aucun lien retour. La règle 4 (tout lien est réciproque) est hors d'atteinte. | 02, 11 |
| 2 | **Pas de type d'événement.** | Pas de facette « type », pas de moyen de savoir quels événements sont des batailles, donc pas de liste de batailles sur une fiche de guerre. | 02 |
| 3 | **Pas d'objet « guerre ».** | L'espace F (grandes guerres : camps, alliances, antagonistes, batailles) n'a aucune donnée. | 02 |
| 4 | **Conséquences en texte libre** (`consequenceFr`), sans renvoi vers d'autres événements. | « Passer d'un événement à l'autre » ne se fait que par précédent / suivant, pas par la cause. | 02 |
| 5 | **Lieux réduits à 66 noms.** | Pas de fiche de lieu, pas de région, pas de carte. | 02, 11 |
| 6 | **Pas de rôle par participant.** | « Qui » est une liste de noms sans fonction. | 02 |
| 7 | **Travaux linguistiques absents de `sources.json`.** | Une fiche de mot ne peut pas renvoyer à une fiche de source. | 02, 04 |
| 8 | **Pas de libellé court de désambiguïsation** par personne (il est dans l'identifiant ou entre parenthèses dans le nom). | Les suggestions de recherche et les listes devront le reconstruire. | 03 |
| 9 | **Identifiants opaques** pour les sources (`fab`) et les périodes (`p5`). | Adresses illisibles pour ces deux types. | 11 |
| 10 | **Deux notations d'ère** en français : « AC » (agent 02), « apr. C. » (agent 03). | Incohérence visible entre l'arbre et les annales. | 05 |
| 11 | **Titres français des périodes** (agent 02) différents des gloses du lexique (agent 04) pour quatre volumes sur huit. | Le mode valyrien et le mode français ne nomment pas le même volume de la même façon. | 05 |
| 12 | **Pas de traduction anglaise** des notes de généalogie ni des destins de dragons (`fateFr` seul). | État E2 (« not yet translated ») sur ces blocs en anglais. | 05 |

### 12.3 Ce que les données m'ont fait corriger

| Ce que j'avais écrit | Ce que disent les données | Correction |
|---|---|---|
| Le fil de V2 doit être celui du temps et des règnes. | 87 personnes sur 176 sans dates exactes ; un fil de filiation complet existe. | Recommandation retirée ; alignement sur l'agent 03 (8.4, 10.4). |
| Vhagar : nuancier bronze. | Les livres ne décrivent pas sa couleur ; 8 dragons sur 28 sont dans ce cas. | Le nuancier « non décrit » devient un état de premier rang (wireframe W07). |
| La ligne de vie ouvre chaque fiche de personne. | 70 personnes sur 176 ont naissance et mort ; 57 n'ont ni l'une ni l'autre. | Trois états de la ligne de vie : complète, bornée, absente (wireframe W06). |
| La Danse va de 129 à 131. | La période va de 105 à 153 ; la guerre, de 129 à 131. | Les deux bornes sont affichées (wireframe W03). |
| 200 à 300 événements, 30 à 60 sources. | 125 et 20. | Volumétrie refaite (2.4). |
| Rhaenyra, « reine ». | Prétendante, hors de la liste officielle des rois. | Libellé corrigé dans l'arbre (wireframe W05). |
| Le Fléau en 114 av. C. | Aenar quitte Valyria en 114 av. C. ; le Fléau a lieu en 102 av. C. | Bornes du portail corrigées (wireframe W02). |
| Identifiants en anglais. | Graphie de Martin et désambiguïsation en français. | Les identifiants livrés font foi (2.3). |

Deux réserves sur le cahier artistique sortent de ce raccord et sont reprises au rapport : la décision 7 (un dragon se représente par son nuancier) et la décision 8 (une personne se représente par sa ligne de vie) supposent des données que les livres ne donnent pas pour une part importante du fonds.
