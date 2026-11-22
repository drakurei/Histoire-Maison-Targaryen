# Version 2, proposition B : « Sable et gueules »

Agent 07, directeur artistique, 22 novembre 2026. Angle : l'identité. Phase E (analyse de la V1) puis phase F (proposition). Complète `DESIGN.md`, qui reste l'autorité sur les jetons, les familles et les interdits.

Sable et gueules sont les deux émaux des armes de la Maison : de sable au dragon à trois têtes de gueules, c'est-à-dire du noir et du rouge. La V1 a choisi le vélin, couleur du livre. La V2 rend à la Maison ses propres couleurs.

## 1. La V1 regardée sans indulgence

Captures faites pour cette analyse, à 390x844 et 1440x900 : `tests/visual/out/v2/a07-v1-{portail,p5,lignee,balerion,lieux,lexique}-{390,1440}.png`, toutes regardées.

Ce qui tient : l'objet est cohérent et ne fait pas « IA ». Les dos de cuir, la rubrication, la planche de Balerion avec ses couleurs « décrites » ou « non décrites » sont de vraies trouvailles. Le reste est moins fort qu'il n'en a l'air.

1. **Le parchemin est le cliché du genre.** Vélin, lettrines gothiques, signets, livre ancien : c'est ce qu'on attend d'un site de fans de fantasy. Personne ne dira « une IA a fait ça », mais beaucoup diront « j'ai déjà vu ça ». Et l'ivoire n'est pas une couleur de la Maison.
2. **Une seule composition pour toutes les pages.** Titre rouge en haut à gauche, glose italique, chapeau, puis contenu. Volume V, lignée, Balerion, lieux, lexique : à 1440 px, les cinq premiers écrans ont la même silhouette (`a07-v1-p5-1440`, `-lieux-1440`, `-lexique-1440`).
3. **Le bâti mange l'écran.** Les huit dos prennent 340 px, la barre haute 56 px, les signets 80 px. À 1440 px, le récit du volume V commence à 715 px du bord gauche et laisse 330 px de vélin vide à sa gauche. L'arbre de la lignée est coupé à droite et en bas avant d'avoir montré deux générations entières.
4. **La matière arrive trop tard.** Sur les premiers écrans du volume V, des lieux et du lexique, on ne voit que du texte. La carte commence sous le pli, dans un cadre à filet, cadrée sur le Mur et Winterfell, loin de toute l'histoire Targaryen (Peyredragon, Port-Réal, Valyria). Le lexique ouvre sur 322 carrés noirs et aucun mot.
5. **La navigation se devine.** Les signets ne montrent qu'une initiale gothique (Z, I, Z, V, Ā, V, G) : impossible de savoir lequel mène aux dragons sans survoler. Les années des dos sont verticales et minuscules. On ne sait jamais où l'on est dans quatre siècles.
6. **Le rouge reste une encre.** DESIGN demande des aplats entiers quand le récit l'exige : la Danse, la période la plus sanglante, s'ouvre sur un vélin calme, exactement comme les premiers rois.
7. **Le portail est une page d'accueil de produit.** Grand titre à gauche, image à droite, bouton plein, lien secondaire. L'emblème en aplat rouge est coupé par le bord sans raison, et sur téléphone il n'en reste qu'un fragment dans un coin.
8. **L'échelle des dragons ne se sent pas.** Balerion, le plus grand dragon de l'histoire, fait 560 px de large au milieu d'une feuille. Il a l'air d'un spécimen de muséum, pas d'une terreur.
9. **La lignée ressemble à un organigramme.** Traits orthogonaux, petits nœuds, barre d'outils (+, −, Recentrer, Tout l'arbre) de logiciel de gestion. Les boucles du sang, idée maîtresse, ne se voient pas.
10. **Le téléphone perd la métaphore.** Les dos disparaissent au profit d'une barre de quatre mots (Volumes, Registres, Korjās, Ēngos), une barre d'onglets ordinaire. Le portail devient titre, paragraphe, bouton.
11. **C'est lent à la première visite.** Le seuil occupe encore l'écran à 5,2 s (`tests/visual/out/seuil-390-5200.png`), l'ouverture du Codex ajoute jusqu'à 3,2 s, chaque changement de volume coûte 620 ms de page tournée.

## 2. L'image : la bande de gueules

Une seule image, partout, qui n'appartient qu'à cette histoire : **une bande rouge pleine, qui traverse tout l'écran en bas, et dont l'épaisseur est le nombre de dragons vivants, année par année.**

Elle naît fine en 114 av. C. (Balerion seul), gonfle à la Conquête, enfle jusqu'à quinze dragons en 130 (`dragonsAlive` du cœur), se rompt en 131, s'amincit jusqu'à n'être qu'un fil hachuré pendant un siècle et demi, puis se regonfle à peine en 298 avec trois éclosions. Avant 114 av. C., Valyria : une masse hachurée sans contour, parce qu'on ne compte pas les dragons d'un empire légendaire. Ce profil se reconnaît au premier regard une fois qu'on l'a vu, il dit toute l'intrigue (la Maison vaut ce que valent ses dragons) et il n'est pas décoratif : c'est la règle du temps qui pilote tout le site.

En héraldique, une bande horizontale qui traverse l'écu s'appelle une fasce. Le site entier est un écu de sable traversé d'une fasce de gueules. C'est l'identité.

**Distinct de la V1** : la V1 trace cette courbe une fois, à l'encre, comme une figure du portail. La V2 en fait une masse pleine, permanente, manipulable, qui sert de navigation.

## 3. La piste « Table peinte » : suivie, transformée, contestée

- **Suivie** : scène sombre plein écran, rouge en aplats, le temps comme entrée. La carte devient la Table peinte de Peyredragon, noire et laquée.
- **Transformée** : le rouge en aplat suit une règle. **La part de rouge à l'ouverture d'une période est proportionnelle au pic de dragons vivants pendant cette période.** La Danse s'ouvre sur un écran presque entièrement rouge ; « Après la Danse » sur un fil. La structure dit quelque chose (PRODUCT, principe 3).
- **Contestée** : la carte ne peut pas être l'entrée unique. La lignée, la langue, les sources n'ont pas de géographie ; une carte comme premier écran est la pire interface sur 390 px ; et l'histoire de cette Maison est d'abord une succession, donc du temps. **L'entrée unique est l'année.** La carte est une des faces de l'année, comme la lignée et le registre des dragons. Je renonce aussi à peindre en rouge le domaine de la Maison sur la carte : `map.json` ne contient pas les contours des régions (seulement des points d'étiquette) et aucune source ne fixe ces frontières année par année. Les peindre serait inventer.

## 4. Navigation

Trois axes, trois gestes.

- **Le temps : la bande, en bas.** Glisser sur la bande règle l'année courante (encoche noire taillée dans le rouge, année en Grenze au-dessus). Toucher ou cliquer un nom de période l'ouvre. L'année courante est un état global dans l'adresse (`?an=129`) : la carte allume les lieux de cette année, le registre des dragons montre les vivants, la lignée éclaire les vivants, une période fait défiler ses annales jusqu'à cette année. Sur une page de période, l'inverse est vrai aussi : faire défiler les annales déplace l'encoche.
- **Les registres : une ligne de mots, en haut.** Les huit registres (`nav.*`, valyrien et glose) écrits en bas de casse sur une seule ligne, alignés à gauche, sans fond ni cadre ; l'actif porte le soulignement épais `--braise`. Rien d'autre en haut : pas de boîte de recherche noire.
- **La recherche : une touche, un champ qui accepte une année.** `/` ou la touche « Korjās » ouvre un champ pleine largeur au-dessus de la bande. Un nom donne des résultats groupés ; **chaque résultat est aussi posé comme une encoche sur la bande**, ce qui sépare d'un coup d'œil les six Aegon et les quatre Viserys. Une année (« 129 », « 114 av ») règle directement la bande.

Les périodes se chevauchent (V : 105 à 153, IV : 1 à 129, VI : 131 à 262) et certaines sont minuscules à l'échelle (III et VIII durent deux à quatre ans). La masse suit l'échelle vraie de `createTimeScale` ; les huit noms de période forment sous elle une rangée de cibles d'au moins 44 px, chacune reliée à son étendue réelle par un crochet.

## 5. Composition des pages clés

Grille de 12 colonnes de DESIGN §6. Fond `--obsidienne` partout. La bande occupe les 72 derniers pixels de l'écran (masse de 56 px au plus, plus la rangée des noms).

### Portail : la bande en grand

```
┌────────────────────────────────────────────────────────────────────────────┐
│ Targārio Lentro Vestriarja          Zaldrīzo Ānogar  Zaldrīzes  Ālia …  /  │
│                                                                            │
│  Targārio                                                                  │
│  Lentro Vestriarja             Texturina 300, --t6, ivoire, gauche        │
│  Les Chroniques de la Maison Targaryen                                     │
│                                                                            │
│  Kesīr Targārio Lentro vestriarzir ilza.        la Danse, 130 : 15 dragons │
│  Ici se trouve l'histoire…  (glose)                          ▄▄▆█▄         │
│                                    la Conquête         ▃▄▅▆▇███████▂       │
│ ░░░░░░░░░░░░▁▁▂▂▂▃▃▃▃▃▃▃▃▃▃▄▄▄▄▅▅▅▆▆▆▇▇██████████▇▂▁┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄▂▃▃  │
│ ░░░░░░░░░░░░▃▃▃▃▃▃▃▃▄▄▄▄▄▄▅▅▅▆▆▆▆▆▆▇▇██████████████▇▄▁┄┄┄┄┄┄┄┄┄┄┄┄┄┄▄▅▅  │ masse 45 vh
│  Valyria  II     III    IV              V           VI          VII  VIII  │
└────────────────────────────────────────────────────────────────────────────┘
   ░ hachures : Valyria, non comptée      ┄ fil hachuré : sort inconnu
```

Aucun bouton. Le titre et l'incipit en haut à gauche ; en dessous, sur toute la largeur, la masse rouge des dragons vivants, quatre annotations en cartel au-dessus des reliefs (la Conquête, la Danse, 153, 298). Survoler la masse donne l'année et le compte ; cliquer une période l'ouvre. Pas d'emblème ici : il a été vu au seuil, et la masse est le nouvel emblème.

### Période : la masse de la période, à droite

```
┌──────────────────────────────────────────────┬─────────────────────────────┐
│ registres                                    │█████████████████████████████│
│                                              │███████████████  ███  ███████│
│  Zaldrīzoti Lilion           Texturina --t4  │█████████████  █   █ █   ████│ 129 en Grenze --t6,
│  la Danse des Dragons        glose           │█████████████  ███  ████ ████│ évidé dans le rouge
│  105 à 153 apr. C.                           │██████████████████████████████
│                                              │████ l'ombre de Vermithor ███│ (passe sur le rouge seul)
│  chapeau, --t1, ivoire, 7 colonnes           │█████████████████████████████│
│                                              │▇▇▇▇▇▆▆▆▅▅▃▂▁┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄│ profil 105 à 153
├──────────────────────────────────────────────┴─────────────────────────────┤
│ ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓[██ V ██]▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓ bande        │
└────────────────────────────────────────────────────────────────────────────┘
 sous le pli :
   récit (7 col., Alegreya ivoire, 1,68)          │ notes et sources (3 col.)
   annales : un fil rouge vertical à gauche, une encoche par événement ;
   le défilement déplace l'encoche de la bande
```

La partie droite est le profil de la bande sur les années de la période, agrandi, qui monte du bas de l'écran et se soude à la bande. Sa hauteur suit la règle du §3 : presque tout l'écran pour la Danse, un fil pour « Après la Danse », une masse hachurée pour Valyria. L'année ou le chiffre de la période est évidé dans le rouge (le noir du fond apparaît à travers), seul `--t6` de la page.

### Lignée : le pal

```
┌────────────────────────────────────────────────────────────────────────────┐
│ registres                                    Deux noms : [ Aegon II ][ … ] │
│                    Viserys Ier (couronne)    Aemma Arryn                   │
│                              █╲_____________╱                              │
│                              █                                             │
│  Laenor Velaryon  ───────────█  Rhaenyra (couronne)                        │
│                              █  97 à 130 apr. C.                           │
│                         ╭────█────╮   ◯ boucle fermée : Daemon est         │
│  Daemon  ───────────────╯    █    ╰── l'oncle de Rhaenyra et son époux     │
│                              █                                             │
│   Jacaerys  Lucerys  Joffrey █ Aegon III   Viserys II                      │
│                              ▼                                             │
│ ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓ bande : la vie de Rhaenyra en sang plein ▓▓▓▓▓▓▓▓▓▓▓▓▓▓  │
└────────────────────────────────────────────────────────────────────────────┘
```

Un pal (bande verticale) de `--sang` descend l'écran : c'est la lignée régnante (`layoutThread`, fil principal). La personne au centre (`focusOn`) : parents au-dessus, conjoints sur les côtés, enfants dessous, en ivoire. Les unions consanguines sont des anneaux rouges fermés, avec la parenté écrite en clair. On descend les générations en faisant défiler, ce qui marche tel quel sur téléphone. L'arbre entier reste accessible comme une seconde vue, mais ce n'est plus l'entrée. Le pal est une figure SVG tirée des données, jamais une bordure CSS.

### Dragon : l'échelle par le cadre

```
┌────────────────────────────────────────────────────────────────────────────┐
│ registres                                                                  │
│╲                                   ▲                                     ╱│
│ ╲    Balerion                     ███                                   ╱ │ ailes coupées par
│  ╲   la Terreur noire            █████                                 ╱  │ les bords : Balerion
│   ╲  114 av. C. à 94 apr. C.  ▄▄███████▄▄                             ╱   │ est plus grand
│    ╲▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▄███████████████▄▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁╱    │ que l'écran
│   écailles : décrite           █████████                cartel         │
│   ailes : décrite               ███████                 cavaliers      │
│   cornes : non décrite (réserve) █████                  batailles      │
│                                   ███    ┈┈ contour du dragon vu avant │
│ ▓▓▓▓▓▓▓▓▓▓▓▓[███ vie de Balerion ███]▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓  │
└────────────────────────────────────────────────────────────────────────────┘
```

Une échelle fixe pour toutes les planches : Balerion vaut 1,6 largeur d'écran. Il déborde ; Syrax tient dans le cadre. On sent l'échelle en passant d'une planche à l'autre, et le contour du dragon vu juste avant reste tracé en `--cendre` pour comparer. Les couleurs non décrites par les livres restent en réserve (contour seul). Sur la bande, la vie du dragon en sang plein, le reste éteint en `--cramoisi`.

### Carte : la Table peinte

```
┌────────────────────────────────────────────────────────────────────────────┐
│ registres                                                                  │
│  Ālia                ░░ Westeros en --suie, mer --obsidienne sans hachure  │
│  Lieux               ░░░░░░░░░░░                                           │
│                      ░░░░░░░░░░░░░░                                        │
│  129 apr. C.         ░░░░░ ● Port-Réal ░░     ● Peyredragon               │
│  (Grenze, --t5)      ░░░░░░░░░░░░░░░░░░░  ◉ le Gosier (braise : cette année)│
│                      ░░░░ ◉ Repos-des-Freux ░                              │
│  cette année :       ░░░░░░░░░░░░░░░░░░░░░░         ░ Essos, Valyria       │
│  le Gosier           ░░░░░░░░░░░░░░░░░░░░░                                 │
│  Repos-des-Freux …   ● lieu  ◉ feu récent (braise, refroidit en cramoisi)  │
│ ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓ la bande règle la carte ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓  │
└────────────────────────────────────────────────────────────────────────────┘
```

Carte pleine page, cadrée par défaut sur la baie de la Néra et Peyredragon, Valyria visible à droite. Pas de cadre, pas de hachures de mer (`--map-hatch` transparent). En réglant l'année, les lieux où quelque chose arrive s'allument en `--braise` et refroidissent en `--cramoisi` au fil des années suivantes ; les lieux de bataille où un dragon a craché le feu gardent une brûlure permanente. La liste des lieux de l'année, à gauche, est l'équivalent accessible de la carte.

## 6. Palette : mêmes jetons, autre répartition

| | V1 « Le Codex » | V2 « Sable et gueules » |
|---|---|---|
| Surface dominante | `--velin` (60 %) | `--obsidienne` (70 %), aucun vélin |
| Rouge | encre : `--rubrique`, dos, signets (10 %) | aplats : `--sang` pour la bande et les masses, `--cramoisi` pour ce qui est éteint (15 à 25 %, jusqu'à 90 % à l'ouverture de la Danse) |
| Texte | `--encre` sur vélin | `--ivoire` sur obsidienne (récit), `--cendre` (appareil) ; `--ivoire` sur `--sang` pour les textes courts posés sur un aplat (5,4:1) |
| Or | lettrine d'ouverture, règnes | seulement la couronne des souverains sur le pal, rien d'autre |
| Braise | focus | l'encoche de l'année courante, les lieux de l'année, le focus |
| Bronze | instruments | graduations de la bande, échelle de la carte |

Le récit long n'est jamais posé sur le rouge : le rouge ouvre, le noir fait lire.

## 7. Typographie : mêmes familles, autre traitement

- **Grenze Gotisch** n'est plus une lettrine. Elle devient le chiffre monumental évidé dans le rouge : l'année, le numéro de période. Aucune lettrine en V2.
- **Texturina** en graisse légère (300 à 400) et très grande pour les titres, ivoire sur noir, serrée (−0,02em) : la lame du verre-dragon plutôt que la rubrique du manuscrit.
- **Alegreya** pour le récit en ivoire sur obsidienne, interlignage 1,68, 64 caractères par ligne.
- **Alegreya Sans** pour la bande (chiffres tabulaires), les cartels, la liste des lieux, les compteurs.

## 8. Mouvements signature

1. **La masse se dépose** (portail vers une page, une fois par session). Le portail montre la masse en grand ; au premier clic, elle s'écrase verticalement (`scaleY`, origine en bas) jusqu'à devenir la bande de 72 px. 700 ms, `expo.out`. Raison : montrer que la navigation est l'histoire elle-même. Après le seuil partagé, c'est la seule ouverture : on gagne 2,5 s sur le Codex.
2. **Le temps se règle.** Glisser sur la bande déplace l'encoche ; la carte, les vivants, les annales suivent sans délai. On n'anime qu'une variable CSS et des opacités. Raison : DESIGN §5, « le temps se règle ».
3. **Le feu part de l'année choisie.** Entre deux périodes, `BurnTransition` avec pour origine le point de la bande qu'on a touché. Raison : le feu efface et révèle, et il part du moment de l'histoire qu'on a désigné.
4. **L'ombre passe sur le rouge seul.** À l'ouverture d'une période où un dragon compte, ou d'une planche, `DragonShadow` avec la silhouette de ce dragon, en `mix-blend-mode: multiply` : invisible sur le noir, elle assombrit le rouge en passant. Raison : le dragon couvre la couleur de la Maison. Une fois par page au plus.
5. **Le pal se trace.** Quand on centre une personne, le pal descend du parent à l'enfant (`clip-path`, 500 ms) et les anneaux de consanguinité se ferment. Raison : la lignée se déploie.

Mouvement réduit : la masse est posée, le feu devient un fondu de 150 ms, l'ombre ne passe pas, le pal est déjà tracé.

## 9. Téléphone, lecteur de premier rang

- **La bande sous le pouce.** 64 px en bas (plus la zone sûre), une fenêtre d'environ 60 ans qu'on fait glisser, la bande entière en 4 px au-dessus pour se situer. Retrait de 16 px des bords, pour ne pas lutter avec le geste de retour du système. À droite de la bande, la touche « Registres » ouvre un écran plein de `--sang` avec les huit registres en Texturina `--t3`, ivoire.
- **La lignée est verticale par nature** : le pal descend, on fait défiler les générations.
- **Le dragon se mesure au défilement** : la tête en haut, le corps descend ; Balerion occupe plusieurs écrans de défilement, Syrax un seul.
- **La carte** s'ouvre cadrée sur Peyredragon, se pince, ses lieux ont 44 px de zone de pression ; la liste de l'année est dessous.
- **Le portail** : titre et incipit, puis la masse sur toute la largeur, haute de 38 vh. Pas de bouton : on touche une période.

## 10. Performance

- Aucun WebGL permanent : pas de fond de basalte, le noir est plat. Le shader de feu est chargé à la demande, seulement pour les passages entre périodes.
- La masse est un seul tracé SVG calculé une fois (`dragonsAlive`, simplifié à environ 400 points), mémorisé. Le réglage du temps ne touche qu'une propriété personnalisée `--an` et les opacités d'une quarantaine de lieux, dans une boucle `requestAnimationFrame`.
- Grenze chargée seulement avec la première vue qui l'emploie. Aucun filtre SVG, aucun `backdrop-filter`.
- Budgets : bloc V2 sous 120 Ko compressés hors données, premier affichage utile sous 2 s sur un téléphone moyen, interaction de la bande sous 16 ms par image.

## 11. Fonctionnalités nouvelles, réellement utiles

1. **L'état du monde à une année.** Maintenir l'encoche (ou Entrée sur la bande) ouvre un cartel : roi régnant, dragons vivants et leurs noms, guerres en cours, événements de l'année. Tout vient du cœur (`reignRibbons`, `dragonLives`, `eventsByYear`, `lifeSpans`). Répond à la question qu'on se pose sans cesse dans cette dynastie : « en 129, qui est encore là ».
2. **L'année dans l'adresse.** `?an=129` se partage et se garde d'une vue à l'autre.
3. **La recherche posée dans le temps** et qui accepte une année : désambiguïse les homonymes d'un regard.
4. **Deux noms, un fil.** Dans la lignée, choisir deux personnes trace le chemin de sang qui les relie et le dit en clair (« Daemon est l'oncle de Rhaenyra, et son époux »). Le cœur le sait déjà : `lineBetween`, `kinship`, `kinshipCoefficient`.
5. **Le fantôme de comparaison** sur les planches de dragons.

## 12. Risques

- **Le compte des dragons est incertain.** `dragonsAlive` compte comme vivants jusqu'en 300 trois dragons au sort inconnu (Silverwing, Sheepstealer, Morning), et en écarte cinq non datés. Si la bande les dessinait en plein, elle ne s'effondrerait jamais en 153 et mentirait. Elle doit distinguer le vivant attesté (sang plein) du sort inconnu (fil hachuré), ce qui demande un drapeau dans la série du cœur. Sans cette distinction, l'image centrale est fausse : c'est le risque principal.
- **Proximité avec la V1** : la courbe existe en figure sur le portail du Codex. La différence (masse pleine, permanente, manipulable) doit être nette ; si l'orchestrateur la juge trop proche, la V1 peut garder une autre pièce maîtresse.
- **Trop de rouge fatigue.** Règle stricte : aplats à l'ouverture et sur la bande, jamais sous le récit.
- **Les partitions de l'écran peuvent tourner au procédé.** Quatre compositions seulement, chacune justifiée par une donnée.
- **Accessibilité de la bande** : c'est un vrai curseur (`role="slider"`, `aria-valuetext` « 129 apr. C., la Danse des Dragons, 14 dragons vivants »), flèches à l'année, Page à la décennie, Origine et Fin ; les périodes existent aussi en liste de liens.
- **État global de l'année** : il peut surprendre. L'année est toujours affichée sur la bande, et une touche la remet à zéro.
- **Lecture longue sur fond sombre** : DESIGN §1 l'anticipe pour la V2 ; à vérifier sur capture à chaque vue de récit.

## 13. Hors de mon périmètre, à décider par l'orchestrateur

- `src/core/timeline/series.ts` : distinguer dans `dragonsAlive` les dragons au sort inconnu des vivants attestés.
- `src/shared/map/WorldMap.tsx` : une intensité par lieu (`heat` de 0 à 1) pour la braise qui refroidit ; aujourd'hui seuls `selectedId` et `highlightIds` existent.
- `src/core/search` : reconnaître une requête d'année.
- Chaînes à créer dans `content/interface/ui.v2-*.json` (état du monde, deux noms, remise à zéro de l'année, aides de la bande), en réutilisant d'abord `nav.*`, `label.*`, `action.*`.
