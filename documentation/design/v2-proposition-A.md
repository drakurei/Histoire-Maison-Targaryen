# Version 2, proposition A : « La Table peinte, réglée par l'an »

Agent 06, architecte UX, le 22 novembre 2026. Phase E (analyse de la V1) puis phase F (proposition). Angle : l'expérience d'un lecteur qui apprend pendant des heures, téléphone d'abord. Fait autorité en dessous de `PRODUCT.md` et `DESIGN.md` ; ne touche à aucun fichier de code.

Captures de référence (regardées une à une) : `tests/visual/out/v2/a06/v1-*.png`, six vues à 390x844 et 1440x900, plus `v1-p5-390-full.png` et `v1-portail-1440-full.png`. Mesures prises dans le navigateur sur le serveur de développement (hauteur de page, position des titres).

## 1. Ce que la V1 fait mal, sans complaisance

La V1 est un bel objet. C'est aussi un livre, et le contenu n'en est pas un : 176 personnes, 125 événements datés, 28 dragons, 51 batailles, 42 lieux, trois siècles de chevauchements. Le Codex montre bien une page ; il ne dit jamais au lecteur *où il est dans le temps*, ni *ce qui se passe ailleurs au même moment*.

| # | Constat | Preuve |
|---|---|---|
| 1 | **Le volume est un mur.** Le volume V fait 31 694 px sur téléphone (37,6 écrans, 6 734 mots) et 22 333 px sur ordinateur. Quatorze sections, aucun sommaire de page, aucune position, aucune figure dans le récit. Les annales commencent au 23e écran du téléphone. | mesure DOM, `v1-p5-390-full.png` |
| 2 | **Le temps est découpé en livres qui se chevauchent** (IV : 1 à 129, V : 105 à 153, VI : 131 à 262) et rien ne dit l'année de ce qu'on lit. On ne peut pas voir ce qui est simultané d'un volume à l'autre. | `v1-p5-1440.png` |
| 3 | **Relier coûte une page entière.** Aller du roi à son dragon, puis à la bataille et au lieu, c'est trois navigations complètes, trois retours, et la position de lecture perdue à chaque fois. Aucun aperçu sur place. | parcours manuel |
| 4 | **Les dos de volumes mangent 340 px** (24 % d'un écran de 1440) sur toutes les pages, y compris l'arbre et la carte, qui manquent justement de largeur. Sous le premier écran du portail, cette colonne est un vide noir. | `v1-lignee-1440.png`, `v1-portail-1440-full.png` |
| 5 | **Les signets ne se lisent pas** : sept rubans qui ne montrent qu'une initiale valyrienne (Z, I, Z, V, Ā, V, G). Le sens n'apparaît qu'au survol, donc jamais au doigt. | `v1-balerion-1440.png` |
| 6 | **La lignée ouvre sur ses commandes** : 40 % du premier écran d'ordinateur est en-tête, champ et boutons ; l'arbre commence au milieu de la génération VI avec des traits orphelins. Sur téléphone, le fil donne des noms sans dates ni couronnes. 21 générations, et aucun axe du temps. | `v1-lignee-1440.png`, `v1-lignee-390.png` |
| 7 | **La carte est une annexe.** Elle commence sous le pli aux deux tailles, dans une boîte à filet fin, cadrée sur le Mur et Winterfell : Peyredragon, Port-Réal et Valyria sont hors champ. Sur téléphone, les boutons de zoom couvrent un tiers de la fenêtre. | `v1-lieux-1440.png`, `v1-lieux-390.png` |
| 8 | **Le lexique ne montre aucun mot** au premier écran, aux deux tailles : la grille des 322 carrés occupe l'écran du téléphone. Une figure pour la figure. | `v1-lexique-390.png` |
| 9 | **La planche de Balerion ne dit pas sa taille**, qui est son sujet : le dragon le plus grand est dessiné à la taille de la page, comme tous les autres. Ses cavaliers sont à 1 887 px sur téléphone. | `v1-balerion-390.png` |
| 10 | **L'étagère du téléphone** : quatre onglets texte, deux en valyrien, deux en français ; « Volumes » et « Registres » sont des catégories de bibliothécaire ; aucune indication du lieu ni de l'année où l'on se trouve. | `v1-portail-390.png` |
| 11 | **Le portail est un schéma convenu** : grand titre, phrase, bouton, emblème, puis une table des matières. La courbe des dragons vivants, la meilleure figure du site, est sous le pli et reste une image : on ne peut rien en faire. | `v1-portail-1440-full.png` |
| 12 | **La page qui se tourne coûte 620 ms** à chaque changement de volume. Charmant une fois, lent la dixième, quand on compare deux époques. | `v1-codex.md` §5 |

Ce qu'il faut garder de la V1 : la discipline du §0, la marque de fiabilité partout, la glose interlinéaire, les figures dessinées par le code. Ce qu'il faut quitter : le livre comme modèle de circulation.

## 2. La proposition

### 2.1 Nom et métaphore

**La Table peinte.** À Peyredragon, Aegon fit tailler une table immense à la forme de Westeros, peinte de ses forêts, de ses fleuves et de ses châteaux, sans aucune frontière : c'est là qu'il prépara la Conquête. La V2 en fait le lieu unique du musée : une table sombre où l'on pose l'histoire.

Je suis la piste de DESIGN.md §7, mais je la **transforme** sur un point décisif : la carte seule ne peut pas être l'entrée unique. Quinze événements sur 125 n'ont pas de lieu, la lignée et la langue n'ont pas de géographie, et une carte à déplacer comme seule porte d'entrée est un piège à doigt sur téléphone (réserves V1-6 et V3-4 de `ux-architecture.md`). L'entrée unique est donc **un couple : l'an et le lieu**. La table a un bord, et ce bord est une règle du temps. Régler l'an, c'est changer toute la table : qui règne, quels dragons volent, quelle guerre brûle, qui est vivant, ce qui vient d'arriver.

Le Codex répond à « que dit ce chapitre ? ». La Table répond à **« que se passe-t-il en l'an 129, et où ? »** C'est la question que se pose le lecteur perdu entre trois Aegon, quatre Viserys et deux Danse.

### 2.2 Navigation : l'an, la focale, la recherche

Trois commandes, partout les mêmes, et rien d'autre de fixe.

1. **L'an** (la Règle). Le bord bas de l'écran, sur ordinateur comme sur téléphone (zone du pouce). Elle porte l'année courante en grand chiffre gothique, les huit périodes en bandes, le ruban des règnes en or (ce qui est couronné), et sa crête est la courbe des dragons vivants : la figure maîtresse du portail V1 devient l'instrument de navigation. L'année vit dans l'adresse (`?an=129`) et suit le lecteur d'une page à l'autre : ouvrir Vhagar depuis la Danse montre Vhagar en 129, pas Vhagar en général.
   - On règle l'an au glisser (confort d'ordinateur) ou **par crans d'événement** : précédent et suivant sautent d'un événement daté au suivant, toutes périodes confondues (125 crans signifiants plutôt que 414 années dont la plupart sont vides). Cette alternative en simple pointage est la commande principale du téléphone (WCAG 2.5.7).
   - Un toucher sur le chiffre de l'année ouvre la feuille « L'état du royaume » (voir §4).
   - « Tout le temps » retire l'année en un geste. Une année posée est toujours écrite en clair, jamais un filtre silencieux (réserve V3-1).
2. **La focale.** Tout nom de personne, de dragon, de lieu, de bataille est un lien qui ouvre d'abord un **aperçu sur place**, pas une nouvelle page : une feuille qui monte du bas (téléphone) ou un volet à droite (ordinateur), avec quatre liens fixes dans le même ordre partout : *sang* (parents, unions, enfants), *dragon*, *guerre*, *lieu*. Un second geste ouvre la fiche entière. L'aperçu a son entrée d'historique (`?voir=person:rhaenyra`) : Retour le ferme, le texte n'a pas bougé.
3. **Chercher.** Le champ comprend les noms (`@/core/search`) et **les années** : « 129 », « 130 apr », « -114 » règlent l'an au lieu de chercher. Les résultats sont groupés par genre, en `aria-live`.

Les registres (lignée, personnages, dragons, guerres, lieux, langue, sources, apprendre, à propos) sont dans l'**Index**, une feuille plein écran à un geste de partout, avec les huit périodes. Clés existantes : `nav.*`. La règle des trois interactions de `ux-architecture.md` §3.3 tient : le portail donne les huit périodes (sur la Règle) et les neuf registres (Index ouvert par défaut sous la table sur téléphone).

**Chorégraphie de circulation : le plan-séquence.** La table ne se démonte jamais entre deux vues. Passer de Rhaenyra à Syrax, puis à Peyredragon, ne coupe pas : la scène reste, la carte se recadre, la Règle glisse, seul le plan de lecture change (fondu de 160 ms). La V1 coupe et tourne ; la V2 ne coupe pas.

## 3. Composition des pages clés

Bâti commun (ordinateur ≥ 1024 px) : barre haute de 48 px sans filet (emblème vers le portail, titre courant, Chercher, Index, langue) ; la **scène** (carte peinte sur obsidienne) occupe tout le fond ; le **plan de lecture** (surface `--suie`, texte `--ivoire`) se pose dessus à gauche sur 6 colonnes et défile seul ; la **Règle** de 72 px tient le bas. Sur téléphone, une barre haute de 48 px, la Règle en bas (64 px plus la zone sûre), et entre les deux le texte en pleine largeur. La scène s'ouvre en feuille à 88 % de la hauteur. Une seule barre fixe en haut, une seule en bas (réserve V3-6).

### Portail `/`

```
ordinateur 1440x900 : un seul écran, pas de défilement
┌────────────────────────────────────────────────────────────────────────┐
│ ◈                                         Chercher   Index   HV FR EN  │
│                                                                        │
│  Targārio Lentro          .-~~-.                                       │
│  Vestriarja              /Nord  \                  ~ mer étroite ~     │
│  les Chroniques de la   |        |                        Pentos ·     │
│  Maison Targaryen        \  ▓▓▓  |  ▓ = terres du royaume en l'an,     │
│                           | ▓▓▓▓▓|      aplat --cramoisi                │
│  Kesīr Targārio Lentro…   | ▓▓▓▓●| ● Peyredragon (point --braise)       │
│  ici se trouve…           |▓▓▓▓▓ |                       · Valyria ──> │
│                            \Dorne/                                     │
│  [ Commencer en 114 av. C. ]   [ Reprendre : la Danse, an 130 ]        │
├────────────────────────────────────────────────────────────────────────┤
│     ╭╮  crête : dragons vivants                ╭──╮                    │
│ ▁▁▁▁╯╰▁▁▁▁▁▁▁▁▁▁▂▂▃▃▄▄▅▅▆▇█▇▆│▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁╯  ╰▁   Règle           │
│ I    II      III  IV         V│VI           VII    VIII                │
│ ═══ or ═ ═══ ════ ══ ═══ ════ │  ← règnes       ‹ événement   1 ›      │
└───────────────────────────────┴────────────────────────────────────────┘
```

L'ouverture choisit l'an 1, la Conquête. Les deux actions sont deux manières d'apprendre : depuis le début (la lecture guidée du §4) ou là où l'on s'était arrêté. Sur téléphone, la carte devient le fond du premier écran (Westeros entier, recadré à la verticale, Valyria indiquée par un renvoi au bord), le titre en haut à gauche, les deux actions au pouce au-dessus de la Règle ; sous le premier écran, l'Index déplié (huit périodes, neuf registres), puis le colophon.

### Période `/chroniques/:periodId`

```
ordinateur                                         téléphone 390
┌──────────────────────────┬───────────────────────┐ ┌──────────────────┐
│ plan de lecture (6 col.) │ scène (6 col., fixe)  │ │ ◈ V la Danse  ⌕ ≡│
│  V                       │                       │ ├──────────────────┤
│  Zaldrīzoti Lilion       │   carte recadrée sur  │ │ 129   ← chiffre   │
│  la Danse des Dragons    │   la section lue :    │ │ gothique, l'an    │
│                          │   le Gosier, 130      │ │ de la section     │
│  sommaire, 14 sections   │      ● ← braise       │ │ Le Gosier         │
│  ┃ Un précédent… 101     │   ✕ batailles de la   │ │ récit…            │
│  ┃ Deux familles… 105    │     section, numérot. │ │ … la flotte de    │
│  ▶ Le Gosier… 130        │   ombre de dragon qui │ │ [Corlys]¹ passe…  │
│                          │   passe à l'entrée    │ │                   │
│  130  Le Gosier          │                       │ │ ¹ aperçu : sang,  │
│  récit, 62 à 68 signes,  │  ▓▓ théâtre de guerre │ │ dragon, guerre,   │
│  noms = liens d'aperçu,  │     aplat cramoisi    │ │ lieu (feuille)    │
│  année en marge gauche   │                       │ │                   │
├──────────────────────────┴───────────────────────┤ ├──────────────────┤
│ Règle : V en sang, curseur braise sur 130        │ │ 130 ‹ › ▁▃▆█▂ Carte│
└──────────────────────────────────────────────────┘ └──────────────────┘
```

Le récit défile normalement ; rien n'est détourné. Quand le titre d'une section franchit la ligne de lecture, la scène se règle sur son année et ses lieux (§5, mouvement 1). Le sommaire de page, avec l'année de chaque section, résout le mur des 37 écrans : on saute, on sait où l'on est. Les **annales ne sont plus reléguées en fin de page** : chaque événement daté s'insère dans le récit à sa place chronologique, en marge (ordinateur) ou en appel dépliable (téléphone), et la vue « annales seules » reste à un geste pour qui révise. Sur téléphone, l'année de la section courante reste dans la Règle ; « Carte » ouvre la scène en feuille sur la section lue.

### Lignée `/lignee`

```
ordinateur : la couronne à gauche, le lien à droite
┌──────────────────────────────┬────────────────────────────────────────┐
│ axe : années (vertical)      │ Le lien entre deux personnes           │
│   1  ♔ Aegon Ier ── Rhaenys  │ [ Rhaenyra      ] et [ Aegon II     ]  │
│      │  (Visenya)            │                                        │
│  37  ♔ Aenys Ier   fils      │        Viserys Ier  ← ancêtre commun   │
│  42  ♔ Maegor Ier  demi-frère│         ╱       ╲   (tracé §5, mvt 4)  │
│  48  ♔ Jaehaerys Ier neveu   │  Rhaenyra       Aegon II               │
│ 103  ♔ Viserys Ier petit-fils│  demi-frère et demi-sœur ; rivaux      │
│ 129  ♔ Aegon II ┄┄ ♔ Rhaenyra│  pour le trône de 129 à 131            │
│      │ contestée             │                                        │
│ 131  ♔ Aegon III  neveu      │  consanguinité des unions : boucles    │
│  …   (18 souverains)         │  [ voir l'arbre entier, plein écran ]  │
└──────────────────────────────┴────────────────────────────────────────┘
```

La vue d'ensemble n'est plus l'arbre des 176, illisible d'un coup d'œil, mais **la couronne** : les 18 souverains sur un axe vertical en années (leurs règnes sont tous datés, contrairement aux 57 personnes sans aucune année), chaque passage écrit avec sa relation (`Succession.relation`), les 11 passages qui ne vont pas de parent à enfant marqués comme tels, les règnes contestés en double trait. Le second outil est **le lien** : deux noms, et `kinship()` avec `lineBetween()` de `@/core/genealogy` tracent la filiation par l'ancêtre commun et l'écrivent en toutes lettres, union comprise (« oncle et nièce, et époux »). L'arbre complet reste là, en plein écran, sur bouton explicite. L'an réglé grise les personnes pas encore nées ou déjà mortes ; une personne sans date est hachurée, jamais placée à une date inventée.

Téléphone : la focale (`focusOn`) par défaut : la personne au centre, parents au-dessus, unions puis enfants groupés en dessous, années et couronne sur chaque nom ; toucher un parent recentre et retrace les fils. « Le lien » et « la couronne » sont deux onglets au-dessus.

### Dragon `/dragons/:dragonId`

```
┌──────────────────────────────────────────────────────────────────────┐
│ aplat --sang pleine largeur, un seul écran                           │
│                                                                      │
│  Balerion          ┌ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ┐ échelle fixe │
│  la Terreur noire     silhouette noire de Balerion       commune à   │
│  114 av. C.          (span 1 : remplit le gabarit)        toutes les │
│  à 94 apr. C.      └ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ┘ planches   │
│  ● établi           (Syrax, span 0,4, n'en occupe que deux cinquièmes ;   │
│                      le contour de Balerion reste en filigrane)      │
├──────────────────────────────────────────────────────────────────────┤
│ cavaliers sur la Règle :  Aegon Ier ████  Maegor ██  Viserys ██      │
│ batailles sur la carte : ① Harrenhal ② le Champ de Feu …             │
└──────────────────────────────────────────────────────────────────────┘
```

Le dragon est posé sur un aplat rouge (la couleur, pas l'accent), à **une échelle commune à toutes les planches** : le contour de Balerion reste en filigrane derrière chaque dragon, et l'on voit enfin que Vhagar (0,92, taille décrite par les livres) approche Balerion. Quand la taille n'est pas décrite (Syrax, Meraxes), le contour du dragon est en pointillé et la légende le dit : l'échelle commune ne doit pas faire passer une estimation pour un fait. Les cavaliers deviennent des segments sur la Règle (liés à leur fiche par aperçu) ; les batailles, des points numérotés sur la carte. Couleurs « décrite » ou « non décrite par les livres » : légende sous la figure, comme en V1, parce que c'est juste.

### Carte `/lieux` et lieu `/lieux/:placeId`

La scène elle-même, sans plan de lecture : carte pleine fenêtre cadrée d'abord sur la Baie de la Néra (Peyredragon, Port-Réal, Accalmie), la Règle en bas, les lieux du temps réglé allumés (événements de l'année ou de la période), les autres à demi. La liste des 42 lieux, groupés par région, est une colonne à gauche sur ordinateur et une feuille au pouce sur téléphone, avec les filtres par genre. Le lieu ajoute la **stratigraphie** : ce qui s'y est passé, de bas en haut, sur la Règle (Harrenhal : construit, brûlé par Balerion, pris par Daemon, et la suite).

## 4. Fonctionnalités nouvelles, réellement utiles

1. **L'état du royaume en l'an X.** Une feuille qui répond, pour l'année réglée : qui règne et depuis quand, l'héritier, les dragons vivants (nombre et noms), les guerres en cours, les événements de l'année, les personnes de la Maison en vie. Tout se calcule dans `@/core/timeline` (`dragonsAlive`, `lifeSpans`, `reignRibbons`, `eventsByYear`). C'est l'outil d'orientation qui manque à la V1.
2. **L'aperçu en quatre liens** (sang, dragon, guerre, lieu) sur chaque nom, sans quitter la lecture.
3. **Le lien de parenté** entre deux personnes, tracé et écrit, avec la consanguinité de l'union quand il y en a une.
4. **Reprendre.** Position de lecture par période et fil des douze dernières fiches vues, gardés dans le navigateur du lecteur (confort individuel : `localStorage` sous try/catch, page correcte sans lui).
5. **Lecture guidée de bout en bout** : « suivre le temps » fait avancer d'événement en événement à travers les huit périodes, le récit et la scène suivent. Les parcours d'apprentissage s'ouvrent dans ce mode, leurs liens en aperçus.
6. **Recherche par année** dans le champ commun.
7. **Remettre dans l'ordre** (option, à valider) : exercice de mémoire où l'on place quatre événements sur la Règle. Exige une petite fonction pure dans `@/core/quiz` ; le moteur actuel ne fait que des questions à choix.

## 5. Mouvements signature (quatre, et une règle)

1. **Le temps se règle.** Au changement d'année, chaque chiffre de l'an roule dans un masque (`clip-path`), les marques de la carte s'allument ou s'éteignent, le curseur glisse sur la crête. 240 ms par cran, `expo.out`. Raison : c'est le geste qui fait comprendre cause et conséquence ; il doit être sensible, jamais décoratif. En mouvement réduit : l'année change, sans roulement.
2. **Le feu gagne la carte.** À l'entrée d'une guerre (et pour le Fléau de Valyria), `BurnTransition` dissout la région du théâtre en aplat `--cramoisi`, à partir du lieu de la première bataille. Une fois par page de guerre. Raison : une guerre de dragons est un feu qui s'étend sur un territoire ; DESIGN §5 « le feu efface et révèle ».
3. **L'ombre suit un vrai vol.** `DragonShadow` traverse la carte sur la trajectoire réelle, du lieu de départ au lieu de la bataille (Peyredragon vers Repos-du-Freux, Harrenhal vers l'Œildieu), quand on ouvre une bataille où un dragon combat. Une fois par page. Raison : elle relie littéralement le dragon, le lieu et l'événement.
4. **La lignée se déploie.** Dans « le lien », la filiation monte de la première personne à l'ancêtre commun puis descend vers la seconde (`DrawSVGPlugin`, 90 ms par génération). Raison : rendre visible la consanguinité, ce que la liste ne peut pas.

La règle : **le plan-séquence** (§2.2). La scène ne se démonte pas entre deux vues ; le recadrage de la carte (tween du `viewBox`, 600 ms) est la seule transition entre pages. Pas de page qui tourne, pas de fondu de section au défilement.

## 6. Palette et typographie

**Palette, autre répartition des mêmes jetons.** Aucun vélin : la V2 est sombre de bout en bout, comme le veut DESIGN §1 (« cendre claire sur noir »). Scène : mer `--obsidienne`, terres `--suie` en relief plat avec une ombre courte et dure (bois peint, pas gravure), côtes et fleuves `--basalte`, noms de lieux `--cendre`. Plan de lecture : `--suie`, texte `--ivoire`, secondaire `--cendre`. Rouge en surfaces : bande de la période courante en `--sang`, théâtres de guerre et terres du royaume en `--cramoisi`, aplat pleine page des planches de dragon et des pages de la Danse et du Fléau. `--braise` pour un seul point par écran : l'an courant (curseur, lieu sélectionné). `--or` pour le ruban des règnes et les couronnes, en aplats, jamais en filet. `--bronze` pour l'instrument (graduations de la Règle, échelle de la carte). Réglage de la carte par les variables `--map-*` de `WorldMap.module.css` : même carte, autre peinture.

**Typographie, mêmes familles, autre traitement.** La V1 rubrique (titres rouges, lettrines). La V2 **compte** : Grenze Gotisch ne sert qu'aux nombres, et le mot monumental de chaque page (`--t6`) est **l'année** ; ordinaux des rois en Grenze aussi ; aucune lettrine. Texturina en ivoire, maigre (`wght` 300 à 380, `opsz` haut) pour les grands titres, italique pour les noms de lieux sur la carte et pour le valyrien ; serrée, bas de casse, comme partout. Alegreya pour le récit, interlignage 1.68. Alegreya Sans à chiffres tabulaires pour la Règle, l'état du royaume et toutes les données. Glose interlinéaire inchangée dans sa structure.

## 7. Téléphone

Aussi soigné que l'ordinateur, et pensé d'abord : tout ce qui s'actionne souvent est au pouce (Règle, crans d'événement, Carte, aperçus), la lecture occupe toute la largeur (20 px de marge, environ 40 à 44 signes par ligne). La scène n'est jamais une zone à glisser dans une page qui défile : elle s'ouvre en feuille, avec Retour pour la fermer. Aucun geste horizontal près des bords (geste Retour du système). En paysage, la Règle se réduit au chiffre de l'année et à ses deux crans. Cibles de 44 px partout, y compris les crans et les lieux de la carte (zone de pression élargie, comme les appels de note de la V1).

## 8. Performance

- La scène est un SVG (`WorldMap`) rendu une fois ; le recadrage ne touche que le `viewBox`. Sur téléphone, elle n'est montée qu'à la première ouverture de la feuille.
- Fond de basalte : une image figée du shader, calculée une fois ; WebGL ne tourne que pendant `BurnTransition`, à `devicePixelRatio` 1,5 au plus. Aucune animation permanente.
- **Un index de scène léger** est nécessaire : `timeline.json` pèse 660 Ko parce qu'il porte les récits. La Règle et la carte n'ont besoin que de (année, lieux, dragons, personnes) pour 125 événements, soit une vingtaine de kilo-octets. À produire par `build-content.mjs` (hors de mon périmètre, à décider par l'orchestrateur).
- Récits, biographies, langue et parcours restent des blocs chargés à la demande. Objectif : premier affichage utile du portail en moins de 2 s sur un téléphone moyen, aucune tâche de plus de 50 ms au réglage de l'an.

## 9. Risques

| Risque | Parade |
|---|---|
| **L'air d'un tableau de bord** (carte, frise, volet : le gabarit d'application de données, qui peut « faire IA »). | Pas de panneaux bordés ni de cartes ; terres peintes en relief, rouge en aplats, chiffre gothique monumental ; le récit reste le premier plan. Revue §0 sur capture dès la première maquette. |
| **Sections du récit sans année ni lieu** dans le contrat (`EssaySection` n'a ni `span` ni `refs`). | Proposer à l'orchestrateur un champ facultatif `span` et `refs` pour les 83 sections, rédigé par les agents de contenu ; en attendant, détection des noms de lieux et de dragons dans le texte par une fonction pure de `@/core/search`, et une scène qui reste sur la période quand rien n'est trouvé. |
| **Terres du royaume par année** : aucune donnée aujourd'hui. | Un jeu de quatre ou cinq états sourcés (Peyredragon seul, puis six royaumes, Dorne en 187…), ou à défaut l'aplat sert seulement aux théâtres de guerre. |
| **Données sans date** (57 personnes sans année, 15 dragons sans éclosion). | Hachure « date inconnue », jamais une position inventée ; « Tout le temps » les montre toutes. |
| **Filtre de l'année incompris.** | L'an toujours écrit en clair, « Tout le temps » à un geste, aucun contenu masqué sans le dire. |
| **Lecture sombre pendant des heures.** | Ivoire sur suie au-delà de 12:1, interlignage 1.68, corps `--t0` ; aucun gris moyen sur noir. |
| **Langue, sources, à propos** n'ont pas de géographie. | La scène se retire (carte à demi effacée derrière un plan de lecture plus large) ; la Règle se réduit au chiffre de l'année. |
| **Doublon avec la V3** (la Table d'étude prévoyait réglette et comparaison). | La V3 arbitre ; la V2 assume le temps comme navigation, à elle de garder ou non. |

## 10. Ce qui reste à décider ou à vérifier

- Chaînes nouvelles (Règle, état du royaume, aperçu, lien, reprendre) : à ajouter dans `content/interface/ui.v2-<domaine>.json` au moment de la construction, en réutilisant d'abord `nav.*`, `label.*`, `action.*`. Formes valyriennes : au linguiste.
- Extension du contrat `EssaySection` et index de scène : décision de l'orchestrateur.
- Non vérifié ici : le comportement réel d'une scène persistante entre routes avec `React Router` (montage dans le `Layout` de la V2) ; à prototyper sur la seule page du volume V avant tout le reste, à 360 px, avec la section du Gosier.
