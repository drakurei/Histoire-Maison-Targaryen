# Version 2 : arbitrage

Agent 01, directeur de projet, avec l'agent 14, auditeur, en contradicteur. Le 22 novembre 2026. Pièces lues : `PRODUCT.md`, `DESIGN.md` (§0 et §7), `documentation/architecture/ARCHITECTURE.md`, `src/core/content/types.ts`, `documentation/design/v1-codex.md`, `reports/audits/audit-v1.md`, les trois propositions (`v2-proposition-A.md`, `-B.md`, `-C.md`), `documentation/design/ux-architecture.md` (§3.3 et §8.4), et les sources partagées dont la V2 dépendra (`@/core/timeline`, `@/core/genealogy`, `@/core/search`, `@/core/motion`, `@/shared/map`, `@/shared/gl`, `@/shared/dragon`, `src/app`). Les faits chiffrés ci-dessous ont été recalculés sur `src/content/generated/*.json` et sur les fonctions du cœur, pas recopiés des propositions.

Décision : **« Sable et gueules » (proposition B) l'emporte**, et reçoit huit greffes des propositions A et C, chacune réécrite dans sa langue. La spécification de réalisation est `documentation/design/v2-spec.md`.

## 1. Ce que les trois propositions ont en commun

Les trois agents ont fait la même lecture de la V1 et la même contestation de la piste donnée par la direction, chacun de son côté : la carte ne peut pas être l'entrée unique (la lignée, la langue et les sources n'ont pas de géographie ; 5 événements sur 125 n'ont aucun lieu, 15 batailles sur 51 n'ont pas de lieu identifié ; une carte à déplacer comme premier écran est un piège sur 390 px). Les trois font de **l'année** l'état principal du site, écrit dans l'adresse (`?an=129`), et de la courbe des dragons vivants le bord de l'instrument du temps. Les trois quittent le vélin, les lettrines et la page qui tourne. Cet accord n'est pas à arbitrer : il devient le socle de la V2.

Ce qui les sépare, c'est **ce qui porte l'identité** : la carte peinte et un volet de lecture (A), la fasce rouge des armes de la Maison (B), le plan continu d'une caméra au-dessus de la table (C).

## 2. Grille de notes

Notes sur 5. Pour le risque « IA », 5 veut dire un risque faible. Chaque note est justifiée par un fait vérifiable, pas par une impression.

| Critère | A « La Table peinte, réglée par l'an » | B « Sable et gueules » | C « La Table peinte, en un seul plan » |
|---|---|---|---|
| **Distinction réelle avec la V1** | **3** : quitte le livre, mais garde le schéma d'une table sombre avec un plan de lecture posé dessus, proche de la table de basalte et du folio de la V1 vus de loin. | **4** : autre métaphore (les émaux de la Maison, non le livre), autres couleurs (sable et gueules, aucun vélin), autre composition. Retenue d'un point : la masse des dragons vivants est parente de la courbe du portail de la V1. | **4,5** : un lieu qu'on parcourt contre un objet qu'on feuillette ; le mouvement de caméra n'a aucun équivalent en V1. |
| **Force de l'identité** | **2,5** : carte, frise en bas, volet à droite : c'est la silhouette d'une application de données. Rien ne dit « Targaryen » avant qu'on lise. | **5** : une seule image, tirée des données, qui n'appartient qu'à cette histoire et se reconnaît au premier regard : un champ noir traversé d'une fasce rouge dont l'épaisseur est le nombre de dragons. C'est littéralement le blason. | **3,5** : la règle de bronze et la table la nuit sont évocatrices, mais la table est partagée avec A, et une carte sombre aux lieux allumés se lit d'abord comme un jeu de stratégie. |
| **Apprentissage de l'histoire** | **5** : aperçu sur place en quatre liens (sang, dragon, guerre, lieu) qui ne fait pas perdre la lecture, état du royaume à l'année, lien de parenté entre deux personnes, sommaire de période, reprise de lecture. C'est la proposition qui pense le plus au lecteur de longues heures. | **3** : l'état du monde à l'année, les deux noms et un fil, les encoches qui séparent les six Aegon d'un regard. Moins sur la circulation entre fiches. | **4** : l'année partagée par tous les registres, les âges à l'année dans la lignée, les années d'un lieu sur la règle, rejouer une guerre bataille par bataille. |
| **Téléphone** | **4,5** : la règle au pouce, des crans d'événement en simple pointage (WCAG 2.5.7), l'aperçu en feuille avec son entrée d'historique, aucune zone à glisser dans une page qui défile. | **3,5** : la lignée verticale et le dragon mesuré au défilement sont justes ; la fenêtre glissante de 60 ans doublée d'un aperçu de 4 px est une commande difficile au doigt. | **3,5** : trois couches empilées sur 390 px (table à 42 svh, règle, feuille à trois crans) ; le texte n'a de place qu'au cran plein. |
| **Performance** | **3,5** : basalte figé, carte SVG, mais un recadrage par `viewBox` à chaque image, qui refait tout le SVG (150 Ko de tracés) à 60 images par seconde dans `WorldMap` actuel. | **5** : aucun WebGL permanent, une seule forme SVG calculée une fois, le réglage du temps ne touche qu'une variable CSS et une quarantaine d'opacités. | **2,5** : un canvas WebGL monté en permanence (basalte à 30 images par seconde), des déplacements de caméra sur toute la carte ; le risque mémoire sur un téléphone modeste est réel (moins de 2 Go libres sur la machine de référence elle-même). |
| **Faisabilité dans le code existant** | **3** : l'aperçu est un vrai chantier mais tout repose sur des fonctions qui existent (`focusOn`, `kinship`, `lineBetween`, `reignRibbons`, `dragonsAlive`). En revanche, trois idées supposent des données absentes : les « terres du royaume par année » et le « théâtre de guerre en aplat » (aucun contour de région dans `map.json`, seulement des points d'étiquette), et « l'ombre suit un vrai vol » (aucun lieu de départ n'est enregistré pour une bataille). | **4** : SVG, variables CSS, `BurnTransition` et `DragonShadow` tels qu'ils sont. Une dépendance vraie dans le cœur (voir §4, objection 1) et une facultative dans la carte (intensité par lieu). | **2** : demande un mode de déplacement nouveau dans `WorldMap` (trajet de van Wijk, transformation pendant le geste), un canvas persistant entre routes, `Flip` dans la lignée, des années par section de récit qui n'existent pas, et « une personne vers son siège, un dragon vers son repaire » alors que ni `Person` ni `Dragon` n'ont de siège ou de repaire dans le contrat. |
| **Risque « IA » (5 = faible)** | **2** : le gabarit carte, frise, volet est exactement celui que produisent les outils de génération pour « une chronologie interactive ». | **4** : une forme tirée des données ne se génère pas par défaut. Le danger existe : de grands aplats rouges sur noir et une Texturina maigre peuvent virer à l'affiche éditoriale passe-partout si le rouge devient décoratif. | **3** : la carte sombre et ses points lumineux ressemblent à un tableau de bord ou à un jeu ; la parade (pigment, pas de lueur) est juste mais fragile. |
| **Total sur 35** | **23,5** | **28,5** | **23** |

Deux critères sont éliminatoires pour ce commanditaire, qui a refusé une maquette parce qu'elle « faisait IA » : l'identité et le risque « IA ». B est en tête sur les deux, de loin. A est en tête sur l'apprentissage et le téléphone, C sur la distinction : ce sont ces avantages qu'on greffe.

## 3. Le choix : « Sable et gueules », avec huit greffes

### 3.1 Pourquoi B

1. **L'image est une donnée.** La fasce de gueules n'est pas un ornement qu'on justifie après coup : son épaisseur est `dragonsAlive`, année par année. Elle dit toute l'intrigue (la Maison vaut ce que valent ses dragons) et elle sert d'instrument. C'est PRODUCT, principe 1 (« la matière avant l'ornement ») et principe 3 (« la structure dit quelque chose ») en un seul objet.
2. **Elle est héraldique, donc juste.** De sable au dragon de gueules : ce sont les émaux de la Maison. La V1 a choisi la couleur du livre ; la V2 rend à la Maison les siennes. Aucune des deux autres propositions n'a d'argument aussi court.
3. **Elle tient sur toutes les pages.** La carte de A et C devient muette sur la langue, les sources et l'apprentissage ; la fasce y reste vraie (elle s'éteint quand le temps ne s'applique pas, ce qui est encore une information).
4. **Elle est la moins chère à faire et à faire tourner** : une forme SVG, une variable CSS, aucun WebGL permanent.
5. **Elle se compose en grammaire.** L'héraldique a ses partitions (fasce, parti, pal, champ plein). La V2 en tire quatre compositions de page, chacune justifiée par une donnée (spec §2.4), au lieu du gabarit unique que les trois agents reprochent à la V1.

### 3.2 Ce qu'on greffe, et sous quelle forme

Une greffe n'est admise que si elle s'écrit dans la langue de B : elle passe par la fasce, par une partition, ou par le noir et le rouge. Sinon c'est du collage.

| # | Greffe | Origine | Forme dans « Sable et gueules » |
|---|---|---|---|
| G1 | **L'aperçu en quatre liens** (sang, dragon, guerre, lieu) avec son entrée d'historique | A | Le cartel : une feuille de suie qui monte de la fasce sur téléphone, se pose à droite sur ordinateur, et tient la vie de l'entité sur la fasce pendant qu'il est ouvert. Paramètre `?voir=`. |
| G2 | **L'état du royaume** à l'année | A et B | S'ouvre en touchant l'année dans le cartel de la fasce. Calculé par le cœur. |
| G3 | **Les crans d'année** : précédent, suivant, d'une année datée à la suivante | A | Deux commandes « ‹ » et « › » dans le cartel de la fasce. 60 crans, pas 125 (il n'y a que 60 années distinctes parmi les 104 événements datés : correction de A). |
| G4 | **L'espace se projette sur le temps** (un lieu inscrit ses années ; une année allume ses lieux) | C, et la stratigraphie de A | Les années d'un lieu, d'une personne, d'un dragon, d'un résultat de recherche deviennent des **encoches** dans la fasce ; une année allume ses lieux sur le champ (la carte). |
| G5 | **Les âges à l'année** dans la lignée | C | Écrits le long du pal, approximatifs signalés, morts éteints. |
| G6 | **Rejouer une guerre** bataille par bataille | C | Sur la page de guerre en parti : le récit à gauche, le champ à droite, l'encoche avance d'une bataille à l'autre. |
| G7 | **Le plan continu** | A et C | Appliqué à la fasce, pas à la carte : la fasce ne se démonte jamais entre deux vues ; le champ (la carte) ne persiste qu'entre les vues qui le montrent. |
| G8 | **Le détail caché « dracarys »** et le **modèle clavier** du curseur | C | Le feu part du pointeur et révèle le colophon au poinçon JD ; flèches, Maj, `[` et `]` sur la fasce. |

S'y ajoutent, plus petites : le sommaire de période (A), la reprise de lecture en stockage local (A, C), l'échelle commune des dragons avec contour pointillé quand la taille n'est pas décrite (A, greffée sur le cadrage de B), les notes dépliées sous le paragraphe et les sigles de sources en pied de section plutôt qu'en marge (C), la technique du temps réglé par magasin externe et `gsap.quickTo` (C).

### 3.3 Ce qu'on corrige dans B lui-même

- **La règle « part de rouge proportionnelle au pic de dragons »** donnerait autant de rouge aux premiers rois qu'à la Danse : la période IV va jusqu'en 129, où 14 dragons vivent. Remplacée par la règle exacte que B énonce ailleurs : le rouge d'une période est **son profil**, à l'échelle commune (15 dragons, le maximum de 130, valent toute la hauteur utile). La Danse monte au plein puis s'effondre ; la Chute (262 à 298) n'a aucun rouge du tout, ce qui est la vérité et une image plus forte.
- **La fenêtre glissante de 60 ans sur téléphone** est remplacée par la fasce entière (échelle `createTimeScale`) plus les crans G3. Un doigt ne règle pas une année à 0,8 px près ; il n'en a pas besoin s'il saute d'événement en événement.
- **L'écran plein de `--sang` pour les registres** est remplacé par une feuille d'obsidienne où chaque période porte son propre profil rouge. Règle nouvelle, qui sert de parade au risque « IA » de B : **en V2, le rouge est toujours une donnée** (dragons vivants, sang de la lignée, feu d'un lieu). Aucun aplat rouge décoratif, aucun bouton rouge.
- **La braise qui refroidit sur la carte** reste, mais conditionnée à une intensité par lieu dans `WorldMap` (dépendance D6, facultative) ; sans elle, les lieux de l'année sont allumés et les autres éteints, rien de plus.

## 4. La contradiction de l'auditeur

L'agent 14 a lu la décision et les trois propositions et a posé ses objections. Chacune reçoit une décision.

1. **« L'image centrale ment après 131. »** Vérifié : `dragonsAlive` compte 3 dragons vivants de 131 à 298 (Silverwing, Sheepstealer, Morning), parce que leur sort est inconnu et qu'ils portent `alive: true`. Et il ne compte pas le dernier dragon, mort en 153, faute d'année d'éclosion (`dernier-dragon` est dans `unknown`). La fasce dessinerait donc un fil continu sur un siècle et demi où les livres disent qu'il n'y a plus de dragons. **Décision : bloquant, prérequis de la V2.** Le cœur doit rendre trois états par dragon et par année (vivant attesté, sort inconnu après la dernière mention, inconnu) ; la dernière mention se calcule déjà à partir des années des événements et batailles de chaque dragon, sans toucher au contenu. Dépendance D1 de la spec. Tant qu'elle n'est pas faite, la fasce n'est pas publiée.
2. **« La masse rouge est la courbe du portail de la V1. »** Exact pour la donnée, faux pour l'objet : la V1 trace une fois une ligne d'encre sur vélin, figure du portail ; la V2 en fait une masse pleine, permanente, manipulable, qui distingue l'attesté du supposé par la hachure, et qui sert de navigation sur toutes les pages. **Décision : risque accepté**, à juger sur deux captures côte à côte au premier jalon. La V3 décidera laquelle des deux garde la figure.
3. **« Fond noir : c'est la maquette refusée. »** La maquette refusée, c'était le noir avec des filets d'or, des capitales espacées, des cartes encadrées et aucune image. La V2 n'a ni or en filet, ni capitale, ni cadre, et chaque écran porte une figure tirée des données. **Décision : critère d'acceptation ajouté** : une vue sans figure est refusée en revue, et le rouge n'est jamais décoratif (§3.3).
4. **« L'aperçu est une fenêtre modale qui ne dit pas son nom. »** Non s'il garde trois propriétés : une entrée d'historique (Retour le ferme, `?voir=`), un vrai lien vers la fiche (clic du milieu et Ctrl+clic ouvrent la page entière), et sur ordinateur aucun piège de focus (il est à côté du texte, pas dessus). Sur téléphone, c'est un `dialog` qui rend le focus au nom touché. **Décision : retenu avec ces trois conditions.**
5. **« Un état global de l'année va surprendre. »** Retenu des trois propositions : l'année est toujours écrite dans le cartel de la fasce, jamais un filtre silencieux, « tout le temps » la retire en un geste, et une vue qui masque ce qui n'est pas de l'année le dit en clair avec le compte.
6. **« Les partitions vont tourner au procédé. »** Quatre seulement (fasce, parti, pal, champ), chacune liée à une donnée ; aucune vue n'en invente une cinquième. **Décision : retenu**, contrôle en revue.
7. **« Trois idées des propositions inventent des données. »** Les terres du royaume et les théâtres de guerre en aplat (A), l'ombre sur le trajet réel d'un vol (A), la caméra vers le siège d'une personne ou le repaire d'un dragon (C). **Décision : écartées** (§5). La V2 montre à la place la suite des lieux où un dragon paraît, numérotée et nommée comme telle, jamais comme un vol attesté.
8. **« La typographie française vit dans la V1. »** Réserve de l'audit V1 : `fineTypo` est dans `src/versions/v1-codex/components/typo.ts`, et une version n'importe jamais une autre. **Décision : dépendance D9**, à remonter dans `@/core/i18n` avant d'écrire la première vue de récit de la V2. Pas de copie dans la V2.
9. **« Le recadrage de la carte saccadera sur téléphone. »** Vérifié dans `WorldMap.tsx` : le recadrage animé appelle `setView` à chaque image. **Décision :** la V2 recadre peu (une fois par navigation, jamais au défilement continu), et demande une transformation pendant le geste dans `@/shared/map` (D6, facultative). Mesure de l'INP au premier jalon.

## 5. Ce qui est écarté, et pourquoi

| Idée | Origine | Raison |
|---|---|---|
| La carte comme scène permanente de toutes les vues, avec un plan de lecture posé dessus | A, C | Gabarit d'application de données, risque « IA » le plus fort ; la carte n'a rien à dire sur la langue, les sources, l'apprentissage. Elle devient une partition (le champ) parmi quatre. |
| Terres du royaume en aplat par année, théâtre de guerre dissous en cramoisi | A | `map.json` ne contient aucun contour de région ; aucune source ne fixe ces frontières année par année. Les peindre serait inventer, ce qu'ARCHITECTURE interdit. |
| `BurnTransition` qui dissout une région de la carte | A | Le composant est une surcouche plein écran ; il ne sait pas brûler une région, et il n'y a pas de région à brûler. |
| L'ombre sur le trajet réel d'un vol, du départ à la bataille | A | Aucun lieu de départ n'est enregistré. Remplacé par l'ombre qui passe sur le rouge seul (B). |
| La traversée de Valyria à Peyredragon (2,8 s) | C | S'ajoute à un seuil qui occupe encore l'écran à 5,2 s ; demande un moteur de caméra qui n'existe pas. L'ouverture de la V2 est la masse qui se dépose (700 ms). |
| Le canvas de basalte permanent, `u_heat` pendant les années de guerre | C | Animation d'ambiance permanente (DESIGN §5 l'interdit), coût mémoire, et le basalte est la matière de la V1. Le sable de la V2 est plat. |
| Les calques qui transforment chaque registre en vue de la table | C | Même raison que la scène permanente. |
| La recherche qui emmène la caméra au siège ou au repaire | C | Ni siège ni repaire dans le contrat. La recherche pose des encoches et ouvre la fiche. |
| Le raccord de caméra en van Wijk, durée selon la distance | C | Remis à plus tard : dépend d'un mode de déplacement dans `WorldMap` (D6). En attendant, le recadrage existant (700 ms, `expo.out`). |
| La feuille à trois crans avec la table repliée en bandeau | C | Trop de couches sur 390 px ; le récit occupe la largeur et la carte est une figure dans le flux. |
| La couronne (axe vertical des 18 souverains) comme vue par défaut de la lignée | A | L'axe de la lignée est la filiation (`mainThread`, 20 personnes), conclusion de l'agent 03 et de `ux-architecture.md` §8.4. La couronne devient une marque d'or le long du pal. |
| Les annales insérées dans le récit à leur place chronologique | A | `EssaySection` n'a ni année ni lieu. Remis à la dépendance D8 (champ facultatif `span`). Les annales restent une partie de la page de période, à un saut du sommaire. |
| « Suivre le temps » (lecture guidée de bout en bout), « Remettre dans l'ordre » | A | Utiles mais pas nécessaires à la direction ; le second demande une extension de `@/core/quiz`. Proposés à la V3. |
| La fenêtre de 60 ans sur téléphone, l'écran plein de sang des registres, la part de rouge au pic | B | Voir §3.3. |

## 6. Conditions de réussite

La V2 sera jugée sur ces points, dans cet ordre, au premier jalon (fasce, portail, période V, aperçu) :

1. Captures à 390x844 et 1440x900 du portail et de `/chroniques/p5`, à côté des mêmes vues de la V1 : la différence doit se voir sans légende.
2. Revue du §0 de DESIGN.md sur capture, plus deux critères propres : aucune vue sans figure, aucun rouge qui ne soit pas une donnée.
3. La fasce ne ment pas : de 154 à 298, aucun rouge plein.
4. Au téléphone, l'année se règle au pouce en simple pointage, et la recherche atteint n'importe quelle fiche en deux interactions (`ux-architecture.md` §3.3).
5. INP sous 200 ms pendant qu'on tire la fasce, aucune tâche de plus de 50 ms, mesurés sur Chrome avec processeur ralenti quatre fois.

Dépendances hors de la V2, à décider par l'orchestrateur : voir `v2-spec.md` §9 (D1 et D9 sont bloquantes).
