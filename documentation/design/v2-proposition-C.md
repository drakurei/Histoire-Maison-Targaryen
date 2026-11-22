# Version 2, proposition C : « La Table peinte, en un seul plan »

Agent 10, motion design et 3D. Phase E (lecture critique de la V1) puis phase F (proposition). Le 22 novembre 2026. Fait suite à `DESIGN.md` §7, qui reste l'autorité sur les jetons, les familles, les interdits et la liste des mouvements admis.

Captures regardées : `tests/visual/out/v2/a10/v1-*.png` (portail, `/chroniques/p5`, `/lignee`, `/dragons/balerion`, `/lieux`, `/langue/lexique`, à 390x844 et 1440x900, plus deux pages entières : `v1-p5-1440-full.png` et `v1-portail-390-full.png`).

---

## 1. Ce que la V1 fait mal (phase E)

La V1 passe le test du §0 : on ne la confond pas avec un gabarit. Mais elle reste un livre affiché sur un écran, et c'est là qu'elle est faible.

1. **Le portail est une page d'accueil de produit déguisée.** Titre monumental, sous-titre, accroche, bouton principal rouge, lien secondaire souligné, grande illustration à droite : c'est le schéma de toutes les pages d'atterrissage. À 1440, l'emblème est coupé par le bord droit au milieu des ailes, sans intention lisible. À 390, il n'en reste qu'un fragment rouge en haut à droite et le premier écran est du texte pur. La courbe des dragons vivants, « pièce maîtresse » selon la spécification, n'arrive qu'à 900 px de défilement sur téléphone.
2. **La navigation des registres est illisible.** Les sept signets ne montrent au repos qu'une initiale gothique : Z, I, Z, V, Ā, V, G. Deux Z, deux V : Lignée et Dragons ne se distinguent pas sans survol, et le tactile n'a pas de survol. En face, les huit dos occupent 340 px en permanence (24 % de l'écran à 1440) pour une navigation qu'on touche rarement en lisant.
3. **Le volume de la Danse est un mur.** Environ 8 000 px de prose en colonne de 500 px, quatorze sections, et pas une figure entre la petite règle d'en-tête et les annales : ni carte des batailles, ni dragon, ni décompte. DESIGN.md demande des aplats rouges pour la Danse ; le vélin beige y est identique à celui de Valyria. À 1440, la colonne sous la lettrine reste vide sur toute la hauteur : le texte occupe un tiers de l'écran.
4. **La marge savante ne dit rien de neuf.** Elle répète les mêmes sigles section après section (« F&B Feu et Sang », « TWoIaF Les Origines de la saga »). C'est l'apparence de l'érudition, pas une note.
5. **La lignée ouvre sur ses commandes.** À 1440, le premier écran est un en-tête, un champ, quatre boutons noirs ; l'arbre commence à la génération VI avec des traits orphelins (Aerion), sort à droite (« Roga… »), et la colonne des générations touche encore « Farman ». Les rois sont des pastilles ovales beiges. À 390, l'en-tête prend plus de la moitié de l'écran.
6. **Balerion, la meilleure page, reste une planche immobile.** Trois des quatre carrés de couleur sont des noirs indiscernables. « Voir voler » joue un battement d'ailes sur place : le mouvement ne dit ni où le dragon a volé, ni quand, ni avec qui.
7. **La carte est un widget.** Sur `/lieux`, le premier écran est un titre, un paragraphe et des filtres ; la carte commence en bas, enfermée dans un cadre à filet fin, avec trois boutons noirs dans le coin comme une carte routière. Les 42 lieux sont allumés en même temps : la carte ne sait pas quand un lieu compte.
8. **Le lexique n'a pas de valyrien au premier écran.** À 390 comme à 1440, on voit un titre français, un paragraphe et la grille de 322 carrés ; le premier mot arrive après.
9. **Un seul gabarit d'ouverture.** Toutes les vues commencent pareil : titre rouge, glose, chapô. Au cinquième registre, l'œil ne s'attend plus à rien.
10. **Le téléphone est une réduction.** L'étagère de quatre libellés (dont deux sans forme valyrienne) recouvre le texte ; aucune vue n'est pensée pour le pouce.
11. **Le mouvement est pauvre et lent.** Tout repose sur la page qui tourne (620 ms à chaque changement de volume, un effet de matière qui ne dit rien de l'histoire) et sur l'ouverture du portail. Le travail WebGL de `src/shared/gl` est presque inemployé : `BurnTransition` ne sert nulle part, le basalte seulement au portail, et le détail caché « dracarys » de PRODUCT.md n'existe pas dans le code.
12. **Le temps n'est jamais un instrument.** Chaque vue a sa petite règle figée. On ne peut pas demander au site : « où en est-on en 129 ? qui règne, qui vit encore, quels dragons volent, où se bat-on ? »
13. **Technique.** `WorldMap` anime un recadrage en appelant `setView` à chaque image : React refait tout le SVG (environ 150 Ko de tracés) soixante fois par seconde, en interpolant linéairement centre et largeur. Sur un téléphone modeste, cela saccade, et un long déplacement glisse à ras de carte au lieu de prendre de la hauteur.

Non vérifié par moi : la page qui tourne et l'ouverture en mouvement (captures fixes), le mode de mouvement réduit.

---

## 2. L'idée

**Nom : « La Table peinte ».** Je garde la piste de la direction et je la transforme sur un point.

**Métaphore.** La chambre de la Table peinte à Peyredragon, la nuit : la table où Aegon a préparé la Conquête, une carte de Westeros taillée et peinte dans le bois. Le lecteur se tient devant elle. Sur le bord de la table est posée une règle de bronze : le temps. Tout le site est cette table vue en **un seul plan continu**, comme au cinéma un plan-séquence : la caméra ne coupe jamais, elle se déplace. Changer de vue, c'est déplacer la caméra et régler le temps, pas ouvrir une autre page.

La V1 est un objet qu'on feuillette (unités discrètes, volumes, feuillets). La V2 est un lieu qu'on parcourt (continuité, espace, durée). C'est l'opposition qui rend les deux versions comparables.

**Le principe moteur : le temps se projette sur l'espace, l'espace se projette sur le temps.**
- Régler une année allume sur la table les lieux où il se passe quelque chose cette année-là (110 des 125 événements ont un lieu identifié).
- Choisir un lieu inscrit sur la règle les années où ce lieu compte.
- Tout registre répond pour l'année réglée : qui règne, qui vit (et à quel âge), quels dragons volent et sous qui, quelle guerre est en cours.

**Ce que je conteste dans la piste.** « La carte et le temps comme entrée unique » ne tient pas pour tout. La lignée n'est pas géographique, la langue non plus. Les forcer sur la carte produirait des gadgets. Donc : la règle du temps est vraiment universelle (même la lignée lui obéit), la table reste toujours là, mais la lignée se dessine **sur** la table assombrie, et la langue, les sources, l'apprentissage et le colophon sont des **feuilles de lecture** posées sur la table, qui se met alors en pause.

---

## 3. Navigation

Trois instruments, toujours au même endroit, et rien d'autre.

**La règle (le temps).** En bas de l'écran, une barre de bronze sur toute la largeur. Son bord supérieur **est** la courbe des dragons vivants (`dragonsAlive`) : un relief, pas un graphique posé à côté. Sous la courbe, les huit périodes en bandes ; elles se chevauchent (p4 va jusqu'à 129, p5 commence en 105 ; p5 finit en 153, p6 commence en 131), donc deux couloirs, sans tricher sur les dates. L'échelle est celle de `createTimeScale` (temps légendaire compressé, approche ralentie, dynastie à pleine allure). Le règne en cours est le seul segment d'or de l'écran. Le curseur se tire ; un tap sur une bande saute au début de la période. L'année vit dans l'adresse (`?an=129`) : tout état se partage. Au clavier : flèches pour un an, Maj pour dix, `[` et `]` pour la période voisine. Pour les lecteurs d'écran : `role="slider"`, `aria-valuetext` qui dit « 129 apr. C., règne d'Aegon II, la Danse des Dragons ».

**Les calques (les registres).** En haut à gauche, sous le nom du site, une rangée de mots valyriens avec leur glose, écrits en entier, jamais réduits à une initiale : chroniques, lignée, dragons, guerres, lieux, puis, séparés par un blanc, langue, sources, apprendre. Les cinq premiers changent ce que la table montre pour la même année ; les trois derniers posent une feuille de lecture.

**La recherche : chercher, c'est s'y rendre.** Le champ est un mot souligné (« Korjās », touche `/`), pas une boîte noire. Il ouvre une colonne de résultats groupés par genre (`@/core/search`). Choisir un résultat déplace la caméra et règle l'année : une personne, vers son siège et l'année de son avènement ou de sa naissance ; un dragon, vers son repaire ; une bataille, vers son lieu et son année. Taper un nombre règle la règle (« 129 »). Taper « dracarys » déclenche le détail caché (§6).

**Le retour du navigateur** rejoue le mouvement de caméra à l'envers : chaque état est une adresse du plan d'`ARCHITECTURE.md`, aucune route n'est inventée.

---

## 4. Composition des pages clés

Bâti commun (ordinateur) : la table en plein écran derrière tout, la feuille de récit à gauche quand il y a du texte (7 colonnes sur 12, fond `--suie` opaque, jamais de transparence), la table visible à droite et cadrée sur ce dont parle le texte.

### Portail `/`

```
┌───────────────────────────────────────────────────────────────────────────┐
│ Targārio Lentro Vestriarja      calques…                 Korjās   HV FR EN│
│                                                                           │
│                    mer étroite          · Braavos                         │
│      Westeros          ◦ Peyredragon                                      │
│      (peint, sombre)        · Pentos                                      │
│                                                     Essos                 │
│  Kesīr Targārio Lentro…                                                   │
│  Ici se trouve l'histoire…                                  ● Valyria     │
│                                                                           │
│  1 apr. C.         < le grand nombre, Grenze Gotisch, --t6, ivoire        │
│  Aegon débarque à l'embouchure de la Néra.   < l'événement de l'année     │
│▁▁▂▃▅▆▆▅▃▂▂▁▁▁▁▁▁▂▂▃▄▅▅▆█▇▅▃▂▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁│ relief = dragons vivants
│ I  │ II      │III│ IV           │ V       │ VI          │ VII    │VIII   │ règle de bronze
└───────────────────────────────────────────────────────────────────────────┘
```

Pas de bouton « entrer ». La table est déjà l'entrée : on tire la règle, on touche un lieu, on choisit un calque. Le grand nombre de l'année est le seul mot monumental de l'écran. L'emblème n'est pas répété (le seuil l'a montré).

### Période `/chroniques/:periodId`

```
┌──────────────────────────────────────┬────────────────────────────────────┐
│ ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓ │                                    │
│ ▓ Zaldrīzoti Lilion   (aplat --sang, ▓ │   table cadrée sur le Conflans,    │
│ ▓ La Danse des Dragons  pour p2, p5) ▓ │   Port-Réal, Peyredragon           │
│ ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓ │                                    │
│ récit, ivoire sur suie, 66 car.      │   ◉ Freux-Repos   (section en cours│
│ Un précédent contre un serment       │   ◦ Harrenhal      allumée en sang)│
│ ...                                  │   ◦ Tumbleton                      │
│ ¹ ² appels : la note se déplie       │                                    │
│   sous le paragraphe                 │   129  < année de la section       │
│ Annales : une ligne par événement,   │                                    │
│ survol = le lieu s'allume à droite   │                                    │
│▁▁▂▃▅▆▆▅▃▂▂▁▁▁▁▁▂▂▃▄▅▅▆█▇▅▃▂▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁│
│ … │ IV            [ V ══════ ]│ VI …                                     │
└───────────────────────────────────────────────────────────────────────────┘
```

**Le récit pilote la table.** Le défilement reste natif et libre ; la table suit : quand une section passe au premier plan, la caméra recadre et le curseur de la règle glisse à son année. Ce n'est pas une apparition au défilement, c'est un instrument qui suit la lecture. Pour la Danse et le Fléau, l'en-tête est un aplat `--sang` pleine largeur, et la table elle-même vire au `--cramoisi` sur les années de guerre (uniforme `u_heat` du basalte, et un lavis rouge peint sur la carte). Les sigles de sources quittent la marge pour un pied de section unique : la marge ne garde que de vraies notes.

### Lignée `/lignee`

```
┌───────────────────────────────────────────────────────────────────────────┐
│ (table assombrie à 15 %, carte à peine visible)                           │
│                 Viserys Ier †129        Aemma Arryn †105                  │
│                          ╲                ╱                               │
│     Alicent ─────── Viserys ──┬─ Aemma                                    │
│                               │                                           │
│  Aegon II, 22 ans ♔   Helaena   [ RHAENYRA, 32 ans ]   ═══ Daemon (oncle) │
│                                        │      boucle du sang en --sang    │
│                    Jacaerys  Lucerys  Joffrey  Aegon  Viserys             │
│ en 129 : 41 vivants, 9 cavaliers, règne d'Aegon II          Vhagar, Syrax │
│▁▁▂▃▅▆▆▅▃▂▂▁▁▁▁▁▂▂▃▄▅▅▆█▇▅▃▂▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁│
└───────────────────────────────────────────────────────────────────────────┘
```

Pas l'arbre entier en premier : **le fil à l'année**. Une personne au centre (`focusOn` : grands-parents, parents, fratrie, unions, enfants), les âges calculés pour l'année réglée (approximatifs signalés comme tels), les morts estompés, le souverain en or, les unions consanguines fermées en boucle rouge, le dragon monté nommé à côté. Tirer la règle fait vieillir la famille sous les yeux du lecteur ; c'est la meilleure façon de comprendre la Danse (qui a quel âge, qui est déjà mort). L'arbre complet (`layoutTree`) reste disponible comme vue d'ensemble dézoomée, d'où l'on choisit un centre.

### Dragon `/dragons/:dragonId`

```
┌──────────────────────────────────────┬────────────────────────────────────┐
│ Balerion                             │                                    │
│ la Terreur noire                     │      (dragon dessiné en négatif :  │
│ 114 av. C. à 94 apr. C.  ● établi    │       ivoire et bronze sur suie,   │
│                                      │       planche annotée 1 à 4)       │
│ cavaliers sur la règle :             │                                    │
│ Aegon Ier ████  Maegor ██  (aucun)   │   Valyria ·····> Peyredragon       │
│ récit, origine, batailles, sort      │   ·····> Harrenhal ·····> Port-Réal│
│ couleurs : décrite / non décrite     │   (le vol attesté, en pointillé)   │
│ « Qui vole encore en 94 » : silhouettes superposées à l'échelle          │
│▁▁▂▃▅▆▆▅▃▂▂▁▁▁▁▁▂▂▃▄▅▅▆█▇▅▃▂▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁│
│ ░░░░░░░░[══════ vie de Balerion ══════]░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░ │
└───────────────────────────────────────────────────────────────────────────┘
```

Le spécimen est rendu en négatif (trait clair sur fond sombre), ce qui le distingue de la gravure sur vélin de la V1 et règle le problème des noirs indiscernables : les couleurs attestées sont posées en pastilles sur fond `--basalte` avec leur mention. La vie du dragon s'inscrit sur la règle. Sur la table, la suite chronologique de ses lieux (événements et batailles) forme un trajet, que l'ombre du dragon parcourt une fois (§5, moment 4). Le comparatif d'échelle montre les dragons vivants à l'année réglée, pas tous les dragons de l'histoire.

### Carte `/lieux` et lieu `/lieux/:placeId`

```
┌───────────────────────────────────────────────────────────────────────────┐
│ Ālia  Lieux                  à l'année ● tous ○      genres : cités, …    │
│                                                                           │
│        (la table entière, sans cadre, sans filet, côtes peintes)          │
│              · le Mur                                                     │
│          ◦ Winterfell                 lieux de l'année : pigment sang     │
│                       ◉ Harrenhal     autres : pigment cendre             │
│                                                                           │
│                                    ┌─────────── notice (feuille suie) ──┐ │
│                                    │ Harrenhal, forteresse, le Conflans │ │
│                                    │ description, rôle, événements      │ │
│                                    └────────────────────────────────────┘ │
│▁▁▂▃▅▆▆▅▃▂▂▁▁▁▁▁▂▂▃▄▅▅▆█▇▅▃▂▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁│
│   │    │      ┃ -2   ┃ 1                    ┃ 130 ┃ 133           < années│
└───────────────────────────────────────────────────────────────────────────┘     où Harrenhal compte
```

La carte n'est plus dans une boîte : elle est le fond. Le zoom se fait au geste ; les commandes « plus, moins, recadrer » deviennent trois mots dans la rangée de la règle. Les lieux sont des marques de pigment (les cinq marques de fiabilité de `@/shared/marks`), jamais des points lumineux qui pulsent. Choisir un lieu inscrit ses années sur la règle : la dualité espace et temps devient visible en un geste.

### Téléphone (aussi soigné que l'ordinateur)

```
┌──────────────────────────┐
│ Targārio…   Korjās  HV ▾ │ 44 px
│ chroniques lignée drag…  │ calques, défilement horizontal
│                          │
│   (table, 42 svh,        │
│    cadrée sur le sujet)  │
│                     129  │ grand nombre, coin bas droit
│▁▂▅▆▅▂▁▁▂▃▅█▇▃▁▁▁▁▁▁▁▁▁▁▁│ règle 56 px, pilotée au pouce
│ ═══ poignée ════════════ │
│ Zaldrīzoti Lilion        │ feuille : trois crans
│ La Danse des Dragons     │ (aperçu, moitié, plein)
│ récit…                   │
└──────────────────────────┘
```

- La feuille a trois crans (aperçu, moitié, plein), faits en défilement natif avec `scroll-snap`, sans bibliothèque de glisser. Au cran plein, la table se replie en un bandeau de 64 px qui reste vivant (le lieu en cours s'y lit) : on lit des heures sans perdre où l'on est.
- La règle est au-dessus de la feuille, à portée du pouce, `touch-action: none` sur elle seule ; la feuille garde `pan-y` : pas de conflit de gestes.
- Le pincement agit sur la table seulement quand la feuille est à l'aperçu.
- Lignée sur téléphone : le fil à l'année en colonne (parents en haut, enfants en éventail en bas), la personne au centre occupe la largeur.
- Cibles de 44 px partout, y compris les marques de la carte (zone de pression invisible de 44 px autour de chaque signe) : la V1 avait laissé 22 px.

---

## 5. Palette et typographie

**Palette** (jetons de DESIGN.md, autre répartition).
- `--obsidienne` et `--suie` portent presque tout : la table et la feuille de récit. **Aucun vélin** dans la V2 (DESIGN.md §1 le prévoit : « cendre claire sur noir en V2 »). Récit en `--ivoire`, interlignage 1,68 ; secondaire en `--cendre`.
- `--basalte` : terres peintes de la table ; la mer reste `--obsidienne`, hachurée à peine.
- `--sang` en aplats : en-têtes de la Danse et du Fléau, lieux actifs de l'année, boucles du sang. `--cramoisi` : la table entière pendant les années de guerre. `--braise` : l'état actif sur sombre (curseur de la règle, focus).
- `--bronze` : la règle et ses graduations, les trajets sur la carte (instruments, comme le prévoit le jeton).
- `--or` : une seule chose par écran, le souverain régnant (segment de la règle, nom dans la lignée).

**Typographie** (mêmes familles, autre traitement).
- **Grenze Gotisch** ne fait plus de lettrines (c'est la V1) : elle porte l'année, en très grand (`--t6`), seul mot monumental, et les ordinaux des rois. Le chiffre change quand on tire la règle, par translation verticale des chiffres qui changent seulement (pas de compteur qui défile).
- **Texturina** en graisse légère (300 à 400) et grand `opsz` pour les titres, ivoire sur suie : la lame fine sur le noir, là où la V1 met une rubrique rouge épaisse sur vélin. Italique Texturina pour les noms de la carte.
- **Alegreya** pour le récit, **Alegreya Sans** en chiffres tabulaires pour la règle, les âges et les notices.
- Aucune lettrine, aucune rubrique rouge en corps de texte : la V2 se reconnaît à son noir et à son grand nombre, la V1 à son vélin et à ses lettrines.

---

## 6. Cinq mouvements signature

Chacun a sa raison (DESIGN.md §5), sa technique, et son équivalent en mouvement réduit.

| # | Mouvement | Raison | Technique | Mouvement réduit |
|---|---|---|---|---|
| 1 | **La traversée** (première visite du portail, après le seuil, 2,8 s, passable) | Raconter l'origine de la dynastie en un geste : de Valyria à Peyredragon, de 114 av. C. à la Conquête. | La caméra part de Valyria (1372, 1312 dans le repère de la carte), prend de la hauteur, traverse vers Peyredragon (607, 699) ; l'année défile de −114 à 1 au même rythme ; le relief de la règle se remplit. Trajet en interpolation de van Wijk et Nuij (zoom arrière puis avant, vitesse perçue constante). | Image finale directe. |
| 2 | **Le temps se règle** | Rendre le temps manipulable et montrer que tout en dépend. | Une seule année « source » dans un magasin externe ; le curseur la suit par `gsap.quickTo` (`expo.out`, 280 ms). Les consommateurs lisent l'année arrondie et ne se rendent qu'au changement d'année : marques de la carte par attribut `data-actif` et transition CSS, uniforme `u_heat` du basalte, chiffres de l'année, âges de la lignée. Au plus un rendu React par image. | L'année saute, rien ne glisse. |
| 3 | **Le feu part de l'endroit** | DESIGN.md : « le feu efface et révèle ». Ici l'origine du feu a un sens : il part du lieu de la période suivante. | `BurnTransition` (déjà écrite, inemployée) entre deux périodes ou deux calques, avec `u_origin` = position à l'écran du lieu d'arrivée (Harrenhal pour la Conquête, Peyredragon pour la Danse). Pas plus d'une fois par navigation, jamais entre deux sous-vues. | Fondu de 150 ms. |
| 4 | **Le raccord** | Le lecteur garde son orientation dans l'espace : on ne coupe jamais, on se déplace. Sur une planche de dragon, l'ombre suit le vol attesté. | Déplacement de caméra en van Wijk, durée proportionnelle à la distance (0,6 à 1,4 s), interruptible. Pendant le geste, on anime une `transform` sur le groupe SVG (composition GPU) ; on ne réécrit le `viewBox` qu'à l'arrêt, pour retrouver la netteté. `DragonShadow` le long du trajet des lieux du dragon, une fois par page. | Saut de cadre, pas d'ombre. |
| 5 | **Le fil du sang** | DESIGN.md : « la lignée se déploie ». | Changement de centre dans la lignée par `Flip` : l'enfant touché monte au centre, les parents glissent, les autres sortent ; puis les fils se retracent du parent vers l'enfant (`DrawSVG`, 400 ms), boucles du sang en dernier. | Nouvelle disposition directe, fils pleins. |

Retirés exprès : la page qui tourne (V1), toute apparition au défilement, toute particule permanente (les braises n'apparaissent que sur le front du feu du moment 3).

**Détail caché.** Taper « dracarys » hors d'un champ : le feu du moment 3 part du pointeur (ou du centre sur tactile) et révèle le colophon avec le poinçon JD.

---

## 7. Performance

- **Un seul canvas WebGL**, monté une fois dans le gabarit de la version et jamais démonté entre les routes (c'est ce qui permet le plan continu). Basalte à 0,5 de définition, 30 images par seconde, densité plafonnée à 1,5 (`createShaderCanvas` le permet déjà). Mis en pause quand la feuille est au cran plein, quand l'onglet est caché, et figé en mouvement réduit. `BurnTransition` ne vit que pendant le passage du feu.
- **La carte reste en SVG** (`@/shared/map`), animée par transformation pendant les gestes et réécrite à l'arrêt. Cela demande un mode de déplacement dans `WorldMap` (voir §9).
- **Budgets** à mesurer sur un profil Chrome avec processeur ralenti quatre fois : LCP < 2,5 s sur téléphone moyen, INP < 200 ms pendant qu'on tire la règle, aucune tâche > 50 ms pendant un raccord, bloc JavaScript de la V2 < 120 Ko compressé hors GSAP, jeux de données lourds (lignée, lexique) chargés à la demande du calque.
- **Repli** : sans WebGL, la table est une image figée du basalte (même rendu, une image) ; tout reste utilisable.

---

## 8. Fonctionnalités nouvelles, réellement utiles

1. **L'année partagée** (`?an=129`) : un seul réglage répond dans tous les registres. Une adresse dit « la cour en 129 » et se transmet.
2. **Les âges à l'année** dans la lignée : comprendre une succession demande de savoir qui avait quel âge ; la V1 ne le dit nulle part.
3. **Les années d'un lieu** projetées sur la règle, et **les lieux d'une année** allumés sur la carte.
4. **Rejouer une guerre** : sur `/guerres/:warId`, les batailles dans l'ordre, numérotées sur la carte (`mark` de `WorldMap`), avancées par le lecteur (précédent, suivant), jamais en lecture automatique.
5. **La recherche qui emmène** : un résultat est un déplacement, pas une liste de liens.
6. **Reprendre la lecture** : la feuille retient, par période, la dernière section lue (stockage local, simple confort, avec repli silencieux).
7. **« dracarys »**, demandé par PRODUCT.md et absent de la V1.

---

## 9. Risques et dépendances

1. **Effet « tableau de bord » ou « carte de jeu ».** Une carte sombre plein écran avec des points allumés peut faire penser à un outil d'analyse ou à un jeu de stratégie, deux anti-références. Parade : une carte **peinte** (pigment, hachure, pas de lueur), aucune jauge, aucun pictogramme, aucune pulsation ; le récit garde la place principale dès qu'il y a du texte. À juger sur capture avant tout le reste.
2. **Lisibilité sur une scène vivante.** Feuille de récit opaque (le verre dépoli est interdit), table en pause quand on lit. AAA à vérifier pour ivoire sur suie.
3. **Données inégales.** 15 événements sans lieu, 21 sans année, 15 batailles sur 51 sans lieu, et des périodes qui se chevauchent. La table doit dire « lieu inconnu » et « date inconnue » comme le reste du site, pas cacher ces événements.
4. **Le récit qui pilote la table** suppose de savoir de quels lieux et de quelle année parle chaque section. `EssaySection` ne le dit pas. Deux voies : un champ facultatif `focus` (année, lieux) ajouté par les agents de contenu, ou une fonction de `core` qui retrouve les noms de lieux et les années dans le texte (testée, plus fragile). À arbitrer par l'orchestrateur.
5. **Dépendances hors V2**, à demander et non à faire soi-même : un mode de déplacement pour `WorldMap` (trajet van Wijk, transformation pendant le geste, durée selon la distance, interruptible) ; dans `core/timeline`, `periodsAt(year)`, `aliveAt(year)` avec âges et `placeYears(placeId)` (logique pure, à tester). Le plugin Draggable de GSAP n'est pas enregistré : je propose de s'en passer (`scroll-snap` pour la feuille, événements de pointeur pour la règle).
6. **Mémoire des téléphones modestes** et perte de contexte WebGL : le repli statique doit être testé, pas supposé.
7. **Accessibilité d'une interface spatiale.** Tout ce que montre la table existe en liste dans la feuille ; la règle est un curseur clavier ; les déplacements de caméra ne volent jamais le focus. Le retour du navigateur doit rester prévisible.
8. **Ambition et délai.** Le plan continu est plus difficile qu'un jeu de pages. Ordre de réalisation proposé, chaque étape montrable : règle et année partagée, puis table et raccord, puis feuille et téléphone, puis lignée à l'année, puis feu et traversée.
