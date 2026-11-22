# Version 2 : « Sable et gueules », spécification de réalisation

Complète `DESIGN.md`, qui fait autorité sur les jetons, les familles, les interdits et la liste des mouvements admis. Décision et raisons : `documentation/design/v2-arbitrage.md`. Code dans `src/versions/v2/`. Classe racine `.v2`. La V2 importe `@/core/*`, `@/shared/*` et `@/app` (`VLink`, `VNavLink`, `useVersionPath`) ; elle n'importe jamais un fichier de `src/versions/v1-codex/`, même un utilitaire.

## 1. L'idée

Les armes de la Maison : **de sable à la fasce de gueules**. Un champ noir, et en bas de chaque écran une bande rouge pleine qui le traverse de bord à bord. Son épaisseur est le nombre de dragons vivants, année par année : un fil en 114 av. C. (Balerion seul), trois à la Conquête, quinze en 130, l'effondrement de 131, le dernier dragon mort en 153, puis plus rien pendant un siècle et demi, et trois éclosions en 299. Avant le départ pour Peyredragon, Valyria est une masse hachurée sans contour, parce que personne n'a compté les dragons d'un empire ; elle s'arrête net au Fléau.

La fasce est à la fois **l'identité et l'instrument du temps**. On y règle l'année, et toute la V2 répond pour cette année : qui règne, quels dragons volent, quels lieux brûlent, qui est vivant et à quel âge. Elle ne se démonte jamais d'une vue à l'autre : c'est le plan continu de la version.

Au-dessus de la fasce, chaque vue compose le champ selon une **partition héraldique** tirée de sa donnée : le parti (le récit d'un côté, le temps et l'espace de l'autre), le pal (la lignée qui descend), le fascé (des vies et des durées alignées sur l'échelle même de la fasce), le champ plein (la carte, le dragon à l'échelle, le portail).

Ce qui rend la version reconnaissable : (1) la fasce et son encoche ; (2) le noir et le rouge, sans vélin, sans or en filet ; (3) **le rouge est toujours une donnée** (dragons vivants, sang de la lignée, feu d'un lieu), jamais un ornement ni un bouton ; (4) un seul grand nombre en Grenze Gotisch par vue, le plus souvent l'année, évidé dans le rouge quand le rouge est assez haut ; (5) le cartel qui monte de la fasce pour montrer une personne, un dragon, un lieu sans quitter la lecture.

La V1 est un livre qu'on feuillette, volume par volume. La V2 est un blason qu'on règle : une seule question, « que se passe-t-il en l'an 129, et où ? ».

## 2. Bâti

### 2.1 Ordinateur (1024 px et plus)

```
 ┌──────────────────────────────────────────────────────────────────────────────────────┐
 │ Targārio Lentro Vestriarja   nav.chronicles  nav.genealogy  nav.characters  …  HV FR EN │ ligne des registres, 64 px,
 │                              (glose)         (glose)        (glose)                    │ défile avec la page
 │                                                                                        │
 │                                                                                        │
 │      CHAMP DE LA VUE : une partition (parti, pal, fascé, champ plein)                  │
 │      sur le sable (--obsidienne), grille de 12 colonnes de DESIGN §6                   │
 │                                                                                        │
 │                                                                                        │
 ├──────────────────────────────────────────────────────────────────────┬─────────────────┤
 │░░░░░░░░░░░▁▁▂▂▂▃▃▄▄▅▅▆▇██▌██▇▂ ┄┄┄┄┄┄┄┄                       ▁▂▂ │ ‹   129     ›   │ masse, 44 px
 │ ══════════  ═ ═ ══════════════ ═════════                       ═ ═ │   Aegon II      │
 │ I Valyria   II III IV            V      VI                  VII VIII│ Korjās Registres│ rangée, 44 px
 └──────────────────────────────────────────────────────────────────────┴─────────────────┘
   la fasce : fixe, 88 px, de bord à bord jusqu'au cartel     le cartel : 15rem, à droite
```

- **Ligne des registres** (`RegisterLine.tsx`) : 64 px, sans fond propre ni filet, **non fixe** (elle part au défilement ; la fasce reste). À gauche le nom du site en Texturina 400, `--t1`, `--ivoire`. Puis les neuf registres, écrits en entier en bas de casse, jamais réduits à une initiale : chroniques, lignée, personnages, dragons, guerres, lieux, langue, sources, apprendre (`nav.*`), chacun en glose interlinéaire (valyrien en Texturina 400, glose en Alegreya italique `--t-1` `--cendre`). Le registre actif porte le soulignement épais de `--braise` (3 px, décalé de 6 px). À droite : langue (HV FR EN, trois boutons texte, l'actif souligné) et, en mode `hv`, la langue de glose. À-propos est dans le colophon et dans l'Index. Entre 1024 et 1279 px : le nom sur sa propre rangée, les registres dessous.
- **La fasce** (`Fasce.tsx`) : seul élément fixe du bâti, 88 px, fond `--obsidienne`, collée au bas de la fenêtre. Détail au §2.2.
- **Le cartel de la fasce** (`FasceCartel.tsx`) : 15rem à droite de la fasce, sur deux rangées de 44 px. Rangée haute : « ‹ » (année datée précédente), l'année en Grenze Gotisch `--t2` `--ivoire` suivie de l'ère en vraies petites capitales, et sous elle le règne de l'année en Alegreya Sans `--t-1` `--cendre` (« Aegon II, Rhaenyra » pendant la Danse), puis « › ». Toucher l'année ouvre l'état du royaume (§5.3). Rangée basse : « Korjās » (recherche) et « Registres » (l'Index), en glose. Sans année réglée : le cartel écrit « tout le temps » (`v2.fasce.all_time`) à la place du nombre.
- **Le champ** : tout ce qui est au-dessus de la fasce. Marges de page de DESIGN §6. Le bas du contenu garde une réserve de `calc(88px + var(--e6))` pour que rien ne passe sous la fasce.

### 2.2 La fasce, en détail

**Échelle.** `createTimeScale({ domain: [-2000, 300], range: [0, largeur] })` de `@/core/timeline`. Avec la déformation par défaut, le temps légendaire prend environ 18 % de la longueur, l'approche (114 av. C. à la Conquête) 13 %, la dynastie 69 %. À 1440 px (1200 px de fasce), une année de la dynastie fait 2,8 px ; à 390 px, 0,9 px. L'échelle est la même dans toutes les figures « fascé » de la version (§2.4), pour que tout s'aligne verticalement sur la fasce.

**Hauteur.** Quinze dragons, le maximum (130), valent les 44 px de la masse : 2,93 px par dragon. Un dragon seul reste visible. La forme est un seul tracé SVG en escalier (une marche par année), calculé une fois et mémorisé.

**Trois états, trois écritures** (d'après la série D1 du cœur, voir §9) :

| État | Écriture | Exemple |
|---|---|---|
| vivant attesté | aplat `--sang` | Vhagar de 129 à 130 |
| sort inconnu après la dernière mention | hachure `--sang` à 45°, pas de 4 px, posée sur la masse | Silverwing après 131 |
| non compté (Valyria) | hachure `--sang` sans contour, pleine hauteur, qui s'efface vers le bord gauche et s'arrête net en 102 av. C. (le Fléau) | avant 114 av. C. |

Entre 114 et 102 av. C., la masse hachurée de Valyria et le fil plein des dragons des Targaryen coexistent : les deux sont vrais en même temps.

**L'encoche** (`Encoche.tsx`) : l'année réglée est une entaille verticale de 3 px de large, couleur `--obsidienne`, qui traverse toute la masse, surmontée d'un trait `--braise` de 8 px posé au-dessus de la masse (sur le noir, 6,4:1). Pas d'année réglée, pas d'encoche.

**La vie de la vue.** Une vue qui porte une durée (une période, une guerre, la vie d'une personne ou d'un dragon, les années d'un lieu) la donne à la fasce : la masse est en `--sang` dans cette durée et en `--cramoisi` hors d'elle. Le rouge contre le cramoisi ne fait que 1,76:1 : la durée est donc aussi marquée par un trait `--ivoire` de 2 px au-dessus de la masse, sur toute son étendue. Jamais la couleur seule.

**Les encoches d'entité.** Des années ponctuelles (les années d'un lieu, les résultats d'une recherche, les événements d'une personne) sont des traits `--ivoire` de 2 px sur 8 px, posés au-dessus de la masse. Celui qu'on survole ou qui a le focus passe en `--braise`.

**Fasce éteinte.** Sur les vues où le temps ne s'applique pas (langue, sources, à propos, page introuvable), toute la masse passe en `--cramoisi`, l'encoche disparaît ; l'année reste dans l'adresse et le cartel la garde en `--cendre`.

**Rangée des périodes** (ordinateur et tablette). Sous la masse, 44 px. Chaque période a un crochet : un trait `--sang` de 2 px qui court de son début à sa fin, à l'échelle vraie ; quand deux périodes se chevauchent (IV et V, V et VI), deuxième couloir 4 px plus bas. Sous le crochet, une cible d'au moins 44 x 44 px : le chiffre de la période en Grenze, puis à partir de 1280 px son titre valyrien en Texturina `--t-1`. Les cibles sont rangées au centre de leur étendue et écartées quand elles se gênent (la Conquête dure quatre ans, l'Héritage deux) ; le crochet garde la vraie étendue. Survol ou focus d'une période : le cartel écrit sa glose et ses années à la place du règne. Activation : la vue de la période, avec le feu (§6).

**Gestes.**
- Presser ou glisser sur la masse règle l'année (`touch-action: none` sur la masse seule ; la rangée et le cartel gardent le comportement normal). Pendant le glisser, l'année s'aimante sur l'année datée la plus proche si elle est à moins de 4 px.
- « ‹ » et « › » sautent d'une année datée à la suivante : 60 années distinctes parmi les 104 événements datés (`D3`). C'est la commande principale au doigt et l'alternative en simple pointage du glisser (WCAG 2.5.7).
- Clavier, la masse ayant le focus : flèches gauche et droite, une année ; Maj + flèche, dix ans ; Page précédente et suivante, année datée précédente et suivante ; `[` et `]`, début de la période voisine ; Origine et Fin ; Retour arrière ou Suppr, « tout le temps ».
- Lecteur d'écran : la masse est un `role="slider"` avec `aria-valuemin`, `aria-valuemax`, `aria-valuenow` et `aria-valuetext` (`v2.fasce.valuetext` : « {year}, règne de {reign}, {period}, {count} dragons vivants »). La rangée des périodes est une `nav` de liens ordinaires.

**État.** L'année vit dans l'adresse (`?an=129`, négatif avant la Conquête, jamais 0). Elle suit le lecteur d'une vue à l'autre (§2.6). Pendant un glisser, l'adresse n'est réécrite qu'au relâcher (`replace`, jamais d'entrée d'historique pour un réglage d'année).

### 2.3 Téléphone et tablette (moins de 1024 px)

```
 ┌──────────────────────────────┐
 │ Targārio Lentro…      HV ▾   │ 48 px, défile avec la page
 │                              │
 │  CHAMP DE LA VUE             │
 │  une colonne, marges 20 px   │
 │  40 à 44 signes par ligne    │
 │                              │
 │                              │
 │                              │
 ├──────────────────────────────┤
 │░▁▂▃▅██▌▇▂┄┄┄┄┄┄┄┄┄┄┄┄┄▁▂     │ masse, 20 px (zone de glisser)
 │ ‹  129 apr. C.  ›  Korjās  Registres │ rangée, 44 px
 │    Aegon II                  │
 └──────────────────────────────┘
   la fasce : 64 px plus la zone sûre du bas
```

- La ligne des registres se réduit au nom du site (lien vers le portail) et à la langue. Les registres sont dans l'Index (« Registres »).
- La fasce : masse de 20 px sur toute la largeur (quinze dragons valent 20 px), rangée de 44 px : « ‹ », l'année et le règne, « › », « Korjās », « Registres ». Sous 360 px, le règne n'est écrit que dans l'état du royaume. Retrait de 16 px aux deux bords pour les commandes (le geste Retour du système vit au bord) ; la masse, elle, va de bord à bord mais ne réagit qu'entre 16 px et la largeur moins 16 px.
- Pas de rangée des périodes sur téléphone ; entre 768 et 1023 px, une rangée de huit chiffres (8 x 44 px) au-dessus de la rangée des commandes, la fasce passant à 108 px.
- En paysage sous 480 px de haut : masse de 12 px, rangée de 44 px, règne masqué.
- Le cartel (aperçu, état du royaume) est une feuille qui monte et se pose sur la fasce (§5.2). L'Index et la recherche sont plein écran.
- Aucune zone à glisser au milieu d'une page qui défile : sur téléphone, la carte est une figure fixe dans le flux, avec un bouton « plein écran » qui l'ouvre en `dialog` où les gestes sont permis.

### 2.4 Les quatre partitions

Une vue en choisit une, et la raison est toujours une donnée. Aucune vue n'en invente une cinquième.

```
   PARTI                          PAL                            FASCÉ                          CHAMP PLEIN
 ┌──────────────┬──────────┐   ┌────────────────────────┐    ┌────────────────────────┐    ┌────────────────────────┐
 │ récit        │ temps    │   │        █  parents      │    │ nom    ───────         │    │                        │
 │ 7 colonnes   │ et       │   │ union ─█─ centre       │    │ nom        ─────────   │    │   la carte, le dragon  │
 │              │ espace   │   │        █  enfants      │    │ nom          ──        │    │   à l'échelle, ou la   │
 │              │ 4 col.   │   │        █               │    │ nom   ──────────────   │    │   fasce en majesté     │
 │              │ (collant)│   │        ▼               │    │ (aligné sur la fasce)  │    │                        │
 ├──────────────┴──────────┤   ├────────────────────────┤    ├────────────────────────┤    ├────────────────────────┤
 │ fasce                   │   │ fasce                  │    │ fasce                  │    │ fasce                  │
```

| Partition | Vues | Donnée qui la justifie |
|---|---|---|
| **Parti** | période, événement, personne, guerre, langue, lexique, sources, parcours | un texte qui se lit, et ce dont il parle dans le temps et l'espace |
| **Pal** | lignée | la filiation descend de génération en génération |
| **Fascé** | chroniques, personnages, registre des dragons, guerres, apprendre | des durées qu'on compare, alignées sur l'échelle même de la fasce |
| **Champ plein** | portail, lieux, lieu, planche de dragon, arbre entier, à propos, introuvable | une seule figure qui prend tout le champ |

**La colonne du temps et de l'espace** (`TempsEspace.tsx`), réservée au parti : colonnes 9 à 12, collante (`position: sticky; top: 0`, hauteur `calc(100svh - 88px)`). En bas, **le profil** : le segment de la fasce qui correspond à la durée de la vue, agrandi, posé sur la fasce et soudé à elle (même couleur, même hachure, aucun espace entre les deux). Sa hauteur suit l'échelle commune : quinze dragons valent 45 % de la colonne. Au-dessus du profil, **la carte** (`WorldMap`) cadrée sur les lieux de la vue, qui allume les lieux de l'année réglée. Si la durée n'a aucun dragon (la Chute), il n'y a pas de profil et la carte prend toute la colonne : c'est voulu, et c'est l'image la plus juste de cette période.

**Le grand nombre.** Un seul `--t6` par vue, en Grenze Gotisch. Dans le parti, c'est l'année réglée si elle tombe dans la durée de la vue, sinon le chiffre de la vue (période, ordinal du roi). Il est **évidé** dans le profil (le noir du sable apparaît à travers le rouge, 3,0:1, suffisant pour un texte de cette taille) quand le profil est plus haut que le nombre à cet endroit ; sinon il est écrit en `--ivoire` au-dessus du profil. Évidement : un `mask` SVG, pas un texte en dégradé.

### 2.5 Couches, défilement, focus

- **Le document défile**, pas un conteneur interne : la fasce et les feuilles sont `position: fixed`, tout le reste est dans le flux. C'est ce qui garde le contrat de `src/app/ScrollManager.tsx` (haut de page et focus sur `main` à chaque nouvelle vue, position retrouvée au Retour, ancres, rien quand seuls les paramètres changent : `?an=` et `?voir=` ne déplacent donc jamais la page).
- Ordre des couches, de bas en haut : le champ ; la colonne collante du parti ; la fasce ; le cartel (aperçu, état du royaume) ; la recherche ; l'Index ; l'ombre du dragon ; le feu.
- **La couche de la vue** (`PageLayer.tsx`) enveloppe `<Outlet />` : fondu de 160 ms entre deux vues, rien d'autre. La fasce, le cartel et la surcouche du feu sont dans `Layout.tsx`, hors de la couche de la vue : ils ne se démontent jamais.
- **Persistance de la carte entre vues** : `/lieux` et `/lieux/:placeId` sont des routes filles d'un même élément parent (`PlacesShell.tsx`) qui porte la carte ; passer d'un lieu à l'autre recadre la carte au lieu de la remonter (§5.12).

### 2.6 Ce que dit l'adresse

Tous les états partageables sont dans la requête ; aucune route n'est ajoutée au plan d'ARCHITECTURE.

| Paramètre | Sens | Historique |
|---|---|---|
| `an` | année réglée (`?an=129`, `?an=-114`) | `replace` |
| `voir` | cartel ouvert : `person:rhaenyra`, `dragon:vhagar`, `place:harrenhal`, `war:danse-des-dragons`, `battle:<id>`, `event:<id>`, `etat` (état du royaume) | `push` à l'ouverture : Retour le ferme |
| `p` | personne au centre de la lignée (ARCHITECTURE) | `push` |
| `avec` | seconde personne du lien de parenté (`/lignee?p=rhaenyra&avec=aegon-ii`) | `replace` |
| `vue` | `arbre` pour l'arbre entier de la lignée | `push` |
| `genre`, `theme`, `statut`, `filtre` | filtres des registres | `replace` |
| `#<battleId>` | une bataille sur la page de sa guerre (ARCHITECTURE) | `replace` pendant qu'on rejoue |

**L'année suit le lecteur.** Un lien interne garde `?an=` tel qu'il est. Exception : un lien vers un événement ou une bataille datés porte leur année (aller à l'événement, c'est aller à son année). Un lien vers une personne ou un dragon ne change pas l'année ; si elle tombe hors de leur vie, la vue le dit (« en 200, Vhagar est morte depuis 70 ans », `v2.year.outside`). La recherche et l'Index conservent l'année.

## 3. Couleur et typographie de la version

### 3.1 Répartition des jetons

| Jeton | Rôle en V2 | Ne sert jamais à |
|---|---|---|
| `--obsidienne` | le sable : fond de tout le site, encoche, réserves | |
| `--suie` | surfaces posées : cartel, Index, recherche, bloc « adaptation » ; terres de la carte | fond de lecture du récit |
| `--basalte` | reliefs de la carte | texte |
| `--ivoire` | récit, titres, grand nombre hors du rouge, traits de durée et d'encoches | |
| `--cendre` | appareil, gloses, noms de la carte, côtes, fantôme du dragon | texte sur cramoisi (3,2:1) |
| `--sang` | **données seulement** : masse et profil (dragons vivants), pal et boucles du sang (lignée), crochets des périodes, soulignement des noms d'entités | bouton, fond décoratif, bordure |
| `--cramoisi` | la même donnée, éteinte (hors de la durée de la vue, fasce éteinte) | une information qui ne serait portée que par lui (1,7:1 sur le sable) |
| `--braise` | l'état actif : trait de l'encoche, lieux de l'année, encoche survolée, focus, registre actif | grande surface |
| `--or` | ce qui est couronné : couronnes et règnes, en aplat | filet, cadre, texte courant |
| `--bronze` | graduations de la fasce et de l'échelle des dragons, en trait | petit texte (4,2:1) |

Jetons propres à la V2, déclarés sous `.v2` dans `theme.css` : `--v2-fasce: 5.5rem`, `--v2-fasce-masse: 2.75rem`, `--v2-cartel: 15rem`, `--v2-hachure: 4px`, `--v2-vert: oklch(0.58 0.09 150)` (la marque du camp des Verts, et rien d'autre ; le camp des Noirs prend `--ivoire` avec une marque pleine), `--v2-reserve: var(--obsidienne)`.

Contrastes vérifiés depuis les jetons (formule WCAG 2.x) : ivoire sur obsidienne 16,2:1 ; ivoire sur suie 15,1:1 ; cendre sur obsidienne 5,5:1 ; cendre sur suie 5,1:1 ; ivoire sur sang 5,4:1 ; braise sur obsidienne 6,4:1 ; sang sur obsidienne 3,0:1 (objet graphique) ; or sur obsidienne 9,2:1. Le récit n'est jamais posé sur le rouge : le rouge ouvre, le noir fait lire.

**La carte peinte** (variables `--map-*` de `WorldMap.module.css`, sous `.v2`) : mer `--obsidienne` sans hachure (`--map-hatch: transparent`, la V1 hachure la mer), terres `--suie`, côtes `--cendre` (c'est la côte qui dessine la terre, le fond seul ne s'en distingue pas), fleuves `--cendre` à 60 %, reliefs `--basalte`, noms Texturina italique `--cendre`, lieux `--cendre`, lieu choisi `--sang` à anneau `--ivoire`, lieux de l'année `--braise`, commandes en texte Alegreya Sans `--ivoire` sur `--obsidienne`.

### 3.2 Typographie

- **Grenze Gotisch** ne fait aucune lettrine. Elle porte les nombres : l'année du cartel, le grand nombre de la vue, les chiffres des périodes, les ordinaux des rois, les numéros d'ordre des batailles et des parcours. Jamais une phrase.
- **Texturina** en graisse 300 à 400, `opsz` haut, `--ivoire`, bas de casse, `letter-spacing: -0.02em`, interlignage 0.95 : tous les titres. Le titre `h1` d'une vue est en `--t5`, sur deux lignes au plus. Italique pour les noms de la carte et le valyrien cité dans le récit. Aucun titre rouge : la V1 rubrique, la V2 non.
- **Alegreya** pour le récit : `--t0`, `--ivoire` sur `--obsidienne`, interlignage 1.68, 64 caractères par ligne, chiffres elzéviriens, césure.
- **Alegreya Sans** pour l'appareil : la fasce, le cartel, les notices, les listes, les filtres, les données, en chiffres tabulaires.
- **La glose interlinéaire** garde la structure de DESIGN §3 (`Gloss` de `@/core/i18n`) ; la V2 n'en change que les couleurs.
- **Liens.** Soulignement de 2 px décalé de 3 px. Nom d'entité (personne, dragon, lieu, guerre, bataille, événement) : soulignement `--sang`, il ouvre le cartel. Lien de navigation : soulignement `--cendre`. Survol et focus : `--braise`. Le texte ne change pas de couleur.
- **Boutons.** Texte en Alegreya Sans 500, `--ivoire`, souligné au survol ; angles vifs ; 44 px de haut ; aucun fond plein, aucune icône sauf les deux guillemets simples « ‹ » « › » des crans d'année, qui sont des signes typographiques.

## 4. Composants (dossier `components/`)

| Composant | Rôle |
|---|---|
| `RegisterLine` | ligne des registres (§2.1) |
| `Fasce`, `FasceMasse`, `Encoche`, `PeriodRow`, `FasceCartel`, `YearNumeral` | la fasce (§2.2) ; `FasceMasse` rend le tracé en escalier et les hachures (motif SVG) ; `YearNumeral` fait rouler les chiffres qui changent |
| `IndexSheet` | « Registres » : feuille plein écran sur `--obsidienne` ; les huit périodes (chiffre en Grenze, titre valyrien et glose, années, et le petit profil rouge de chacune à l'échelle commune), puis les neuf registres en Texturina `--t3` avec glose, puis à propos, langue, langue de glose, reprise de lecture. `dialog` natif, Échap et `action.close` |
| `SearchSheet` | « Korjās » ou `/` : champ pleine largeur posé sur la fasce, résultats au-dessus, groupés par genre (`search`, `groupHits` de `@/core/search`), compte en `aria-live`. Chaque résultat pose une encoche d'entité sur la fasce (§5.2). Une requête d'année (`D4`) propose en premier « régler sur 129 apr. C. ». Index chargé à la première ouverture (plus de 300 Ko) |
| `Cartel` | la surface du cartel : volet de droite sur ordinateur (`min(28rem, 34vw)`, `--suie`, de la ligne haute à la fasce, la colonne du parti qu'il recouvre s'éteint à 40 %), feuille posée sur la fasce sur téléphone (62 svh, défilement interne, `dialog`) |
| `Apercu` | contenu du cartel pour une entité (§5.2) |
| `EtatDuRoyaume` | contenu du cartel pour l'année (§5.3) |
| `PageLayer` | fondu de 160 ms entre deux vues |
| `TempsEspace` | colonne collante du parti : carte et profil soudé à la fasce (§2.4) |
| `Profil` | segment agrandi de la fasce, réutilisé par `TempsEspace`, l'Index, le portail, la page introuvable |
| `GrandNombre` | le `--t6` de la vue, évidé ou non (§2.4) |
| `Titre` | `h1` en Texturina avec glose interlinéaire |
| `Prose` | rend un `Localized` en paragraphes, passe par la typographie fine du cœur (`D9`) |
| `Note`, `NoteRef` | appel numéroté ; la note se déplie sous son paragraphe, sur tous les écrans (pas de marge savante : c'est la V1) |
| `SourcesPied` | sources d'une section, une seule fois, en pied de section : sigle, titre en italique, emplacement, lien vers `/sources#id` |
| `Fiabilite` | marque dessinée (`@/shared/marks`) et libellé du niveau |
| `NomEntite` | lien d'entité : `href` vers la fiche canonique, clic simple qui ouvre le cartel (`?voir=`), clic du milieu et Ctrl+clic qui ouvrent la fiche ; couronne pour un souverain |
| `EncocheEntite` | pose des encoches d'entité sur la fasce le temps d'un survol, d'un focus ou d'un cartel ouvert |
| `Sommaire` | sommaire numéroté d'une vue longue, liens d'ancre |
| `Annales` | les événements d'une période, groupés par année (`eventsByYear`) ; année en Alegreya Sans tabulaire dans une colonne suspendue ; un fil `--sang` vertical de 3 px à gauche porte une entaille par année ; règle l'année au défilement (§5.4) |
| `Pal`, `FocusBlock`, `LienParente` | la lignée (§5.6) |
| `ViesFascees` | figure fascé : une rangée par personne, dragon, guerre ou parcours, la durée tracée à l'échelle de la fasce |
| `DragonEchelle` | le dragon à l'échelle commune, avec son fantôme (§5.10) |
| `PlacesShell`, `Notice` | carte persistante des lieux, notice posée sur la carte |
| `Filtres` | boutons bascule en texte, compteur en `aria-live`, état dans l'adresse |
| `Rail` | rail de saut (périodes, règnes, lettres) pour les registres de plus de 60 entrées (`ux-architecture.md` §3.3) |
| `Feu` | hôte de `BurnTransition` et fonction `useFeu().passer(to, originYear)` (§6) |
| `Ombre` | enveloppe de `DragonShadow` en `mix-blend-mode: multiply` (§6) |
| `Dracarys` | écoute « dracarys » tapé hors d'un champ (§6) |
| `Colophon`, `Vide`, `Introuvable` | pied de page, états vides, page introuvable |

Dossier `state/` : `year.ts` (magasin externe de l'année, `useSyncExternalStore`, synchronisé avec `?an=`), `useVoir.ts` (lecture et écriture de `?voir=`), `resume.ts` (reprise de lecture, `localStorage` sous `try/catch`, la page reste correcte sans lui), `once.ts` (gestes déjà joués dans la session, `sessionStorage` sous `try/catch`). Aucune logique métier dans ces fichiers : ce que la V2 calcule sur les données vient du cœur (§9).

## 5. Les vues

### 5.1 Portail `/` (champ plein)

```
ordinateur 1440x900, un seul écran
┌────────────────────────────────────────────────────────────────────────────────┐
│ Targārio Lentro Vestriarja   registres…                              HV FR EN  │
│                                                                                │
│  Targārio                              Texturina 300, --t5, ivoire             │
│  Lentro Vestriarja                                                             │
│  les Chroniques de la Maison Targaryen          (glose)                        │
│                                                                                │
│  Kesīr Targārio Lentro vestriarzir ilza.        incipit, --t2, et sa glose     │
│  Reprendre : la Danse des Dragons, an 130       (si une lecture est en cours)  │
│                                          130 : quinze dragons                  │
│                                                 ▄▆█▄                           │
│        la Conquête              ▂▃▄▅▅▆▆▇▇█████▌                 299 : trois    │
│  ░░░░░░░░░░░▁▁▂▂▂▃▃▃▃▄▄▄▅▅▆▆▇▇██████████▌▁ 153 : le dernier dragon   ▂▂ éclosions│
│  ░░░░░░░░░░░▃▃▃▃▃▄▄▄▄▄▅▅▅▆▆▆▇▇██████████▌▁ meurt                    ▂▂          │ masse en majesté, 45 svh
│  ══════════  ═ ═ ══════════════ ═════════                       ═ ═ │ ‹  1  › │
│  I Valyria   II III IV            V      VI                  VII VIII│ Korjās… │
└────────────────────────────────────────────────────────────────────────────────┘
```

- La fasce est **en majesté** : la même fasce que partout, haute de 45 svh, soudée à sa rangée des périodes et à son cartel. Pas d'emblème (il a été vu au seuil, et la masse est l'emblème de la V2), pas de bouton « entrer ».
- Cinq annotations en cartel au-dessus des reliefs, chacune un `NomEntite` vers son événement : le Fléau (102 av. C., au bord de la masse hachurée), la Conquête, « 130 : quinze dragons », « 153 : le dernier dragon meurt » (`p5-dernier-dragon`), « 299 : trois éclosions » (`p8-eclosion`). Le texte des annotations : `v2.portal.note.*`.
- L'année par défaut du portail : aucune (« tout le temps »). Survoler la masse écrit l'année et le compte dans le cartel sans régler l'année ; presser la règle.
- Accès directs (règle des trois interactions) : les huit périodes dans la rangée, les neuf registres dans la ligne haute, la recherche dans le cartel.
- **Téléphone** : titre et incipit en haut, puis la masse en majesté sur toute la largeur (34 svh, deux annotations seulement : la Danse et 153), puis la liste des huit périodes (une rangée de 56 px chacune : chiffre, titre valyrien, glose, années, petit profil), puis les neuf registres en Texturina `--t2`, puis le colophon. La fasce fixe est présente dès le portail.
- Mouvement : la masse se dépose au premier départ du portail (§6, mouvement 1).

### 5.2 Le cartel : aperçu d'une entité (`?voir=<genre>:<id>`)

```
ordinateur : volet de droite                     téléphone : feuille posée sur la fasce
┌─────────────────────────────┐                  ┌──────────────────────────────┐
│ Rhaenyra            fermer  │                  │ ▁▁▁ (zone de prise)   fermer │
│ la Moitié-d'un-Roi          │                  │ Rhaenyra                     │
│ 97 à 130 apr. C.  ● établi  │                  │ la Moitié-d'un-Roi           │
│ ♔ règne contesté, 129 à 130 │                  │ 97 à 130 apr. C.  ● établi   │
│ en 129 : 32 ans             │                  │ en 129 : 32 ans              │
│                             │                  │                              │
│ sang      Viserys Ier, …  6 │                  │ sang     6                   │
│ dragon    Syrax           1 │                  │ dragon   Syrax               │
│ guerre    la Danse        1 │                  │ guerre   la Danse            │
│ lieu      Peyredragon, …  4 │                  │ lieu     4                   │
│                             │                  │                              │
│ ouvrir la fiche             │                  │ ouvrir la fiche              │
└─────────────────────────────┘                  ├──────────────────────────────┤
  la vie de Rhaenyra est tenue sur la fasce      │ fasce                        │
```

- **Tête** : nom (Texturina `--t3`) en glose si une forme valyrienne existe, épithète en italique, années (avec « vers » et la fourchette quand la date est approchée, « date inconnue » sinon), marque de fiabilité, couronne et règne pour un souverain, âge à l'année réglée (`D11`). Pour un dragon, sa silhouette (`DragonFigure`, `tone="specimen"`, `ground="dark"`, `detail="plain"`) ; pour un lieu, une petite carte fixe cadrée sur lui ; pour une bataille, une petite carte et les deux camps.
- **Les quatre rangées**, toujours dans cet ordre : *sang* (personnes), *dragon* (dragons), *guerre* (guerres et batailles), *lieu* (lieux). Elles viennent d'une seule fonction du cœur (`relationsOf`, `D5`). Chaque rangée donne les trois premiers noms en `NomEntite` (un nom ouvre son propre cartel, avec sa propre entrée d'historique) et le compte ; une rangée vide écrit « aucun » en `--cendre`, elle ne disparaît pas.
- **Sur la fasce**, tant que le cartel est ouvert : la durée de l'entité (vie, règne en trait `--or` au-dessus du trait ivoire, années d'un lieu en encoches).
- **Pied** : « ouvrir la fiche » (lien vers la page canonique).
- Fermeture : `action.close`, Échap, Retour. Sur ordinateur, le volet n'emprisonne pas le focus (il est à côté du texte) ; le focus y entre à l'ouverture et revient au nom à la fermeture. Sur téléphone, `dialog` modal, même retour du focus.

### 5.3 Le cartel : état du royaume (`?voir=etat`)

Ouvert en touchant l'année du cartel de la fasce. Tout vient de `yearState(year)` (`D2`).

- En tête, l'année en Grenze `--t4` et l'ère, la période (ou les deux périodes qui se chevauchent), « ‹ » et « › ».
- *Règne* : le ou les souverains, ordinal en Grenze, épithète, depuis quelle année ; règne contesté dit comme tel.
- *Dragons* : le compte des vivants attestés, leurs noms (`NomEntite`) ; à part, en hachure, ceux dont le sort est inconnu.
- *Guerres en cours*, *cette année* (les événements de l'année, liens vers leur page), *la Maison* : nombre de personnes en vie connues, nombre de cavaliers.
- « tout le temps » (`v2.fasce.all_time`) retire l'année.
- Sans année réglée : « réglez une année sur la fasce » (`v2.state.empty`) et le cartel propose les cinq années annotées du portail.

### 5.4 Chroniques `/chroniques` (fascé)

```
┌────────────────────────────────────────────────────────────────────────────────┐
│ Vestriarja (glose : chroniques, nav.chronicles)   Texturina --t5              │
│                                                                                │
│ règnes        ▬▬▬ ▬ ▬▬▬▬ ▬▬ ▬▬▬▬▬ ▬▬ ▬ ▬▬▬▬ ▬▬▬ ▬▬    (aplats --or, couloirs)    │
│ guerres         ▌  ▌  ▌     ▌    ▌ ▌ ▌ ▌  ▌   ▌  ▌    (aplats --sang)          │
│ I   Valyria   ░░░░░░░░░░░░░                                                    │
│ II  …                      ▁▁▂▂                                                │
│ III …                         ▂                                                │
│ IV  …                          ▂▃▄▄▅▅▆▇                                        │
│ V   …                                 ▅▆▇██▌▁                                  │
│ VI  …                                        ┄┄┄┄┄                             │
│ VII …                                                    (rien : aucun dragon) │
│ VIII…                                                           ▂▂             │
├────────────────────────────────────────────────────────────────────────────────┤
│ fasce (même échelle, alignée au pixel)                                         │
└────────────────────────────────────────────────────────────────────────────────┘
```

- Chaque période est une rangée de 64 px : à gauche (colonnes 1 à 3), chiffre en Grenze, titre valyrien et glose, années ; à droite, son profil rouge à sa place exacte sur l'échelle de la fasce. Au-dessus, la rangée des règnes (`reignRibbons`, aplats `--or` en couloirs, nom au survol et en liste accessible) et celle des guerres (aplats `--sang`, au moins 6 px de large).
- Sous la figure, la liste des huit périodes, une par ligne : titre, années, une phrase (`summary`), le maximum de dragons vivants pendant la période. Pas de cartes.
- Activer une rangée : la période, avec le feu parti de son abscisse sur la fasce.
- Téléphone : rangées de 72 px, titre au-dessus du profil, profil sur toute la largeur.

### 5.5 Période `/chroniques/:periodId` (parti)

```
┌────────────────────────────────────────────────┬──────────────────────────────┐
│ Zaldrīzoti Lilion              Texturina --t5  │  carte cadrée sur les lieux  │
│ la Danse des Dragons           (glose)         │  de la période ; lieux de    │
│ 105 à 153 apr. C.  ● (marques des niveaux)     │  l'année en braise           │
│                                                │      ◉ le Gosier             │
│ chapeau, --t1                                  │   ◦ Port-Réal  ◦ Peyredragon │
│                                                │                              │
│ 1 Un précédent contre un serment               │██████████████████████████████│
│ 2 Deux familles sous un même toit   (sommaire) │██████████  ███  ██  █████████│ profil de 105 à 153
│ …                                              │██████████  █ █  ██  █████████│ 130 évidé, --t6
│ récit, 64 caractères, ivoire sur sable         │█████████████████████████▅▃▁┄┄│
├────────────────────────────────────────────────┴──────────────────────────────┤
│ fasce : 105 à 153 en sang, le reste en cramoisi, encoche sur 130               │
└───────────────────────────────────────────────────────────────────────────────┘
```

- **Gauche** (colonnes 1 à 7) : `Titre`, années, chapeau (`summary`, `--t1`), `Sommaire` numéroté (sections du récit, puis « annales », puis « questions ouvertes »), le récit en sections (`h2` en Texturina 400 `--t2` `--ivoire`, appels de note dépliables, `SourcesPied` en fin de section), les `Annales`, les questions ouvertes, puis la période précédente et la suivante.
- **Droite** : `TempsEspace` avec le profil de la période et la carte cadrée sur ses lieux. Le grand nombre est l'année réglée si elle tombe dans la période, sinon le chiffre de la période.
- **Le récit ne pilote pas l'année** tant que les sections n'ont pas d'années (`D8`) ; la carte montre alors tous les lieux de la période, ceux de l'année réglée en braise.
- **Les annales règlent l'année.** Quand le groupe d'une année franchit la ligne de lecture (40 % de la hauteur de la fenêtre), l'année est réglée (`replace`) : l'encoche glisse, la carte allume les lieux, le profil se met à jour. Dans l'autre sens, régler l'année sur la fasce pendant que les annales sont à l'écran fait défiler jusqu'au groupe de cette année (saut direct en mouvement réduit) ; si les annales ne sont pas à l'écran, la page ne bouge pas. Le défilement programmé n'est pas relu par l'observateur (pas de boucle).
- **Annales** : filtres (personne, dragon, fiabilité, texte) en `Filtres`, compte en `aria-live`. Chaque événement : année, titre (`h3`, lien vers sa page), résumé, « ce que cela change », personnes, dragons, lieux en `NomEntite`, marque de fiabilité. Un événement sans date est rangé à sa place de `sortYear` avec « date inconnue ».
- **Ombre** : à la première visite de la période dans la session, l'ombre du dragon qui compte le plus dans la période (`leadingDragon`, `D5`) passe sur le profil (§6, mouvement 4).
- **Valyria** (`p1`) : le profil est la masse hachurée, coupée net au Fléau. **La Chute** (`p7`) : aucun profil, la carte seule, le chiffre VII en ivoire.
- **Téléphone** : titre, puis le profil sur toute la largeur (28 svh) avec le grand nombre évidé, puis chapeau, sommaire, récit ; en tête des annales, la carte fixe (40 svh, bouton « plein écran ») qui suit l'année des annales.
- Reprise de lecture : la dernière section atteinte est gardée par période (`resume.ts`).

### 5.6 Événement `/chroniques/:periodId/:eventId` (parti)

- **Gauche** : l'année en grand nombre (`--t6`, ou « date inconnue » en Texturina `--t3`), `Titre`, période (lien), résumé, « ce que cela change » (`consequence`), note de date s'il y en a une, personnes, dragons, lieux en listes de `NomEntite`, fiabilité et sa note, continuité (livres ou adaptation), `SourcesPied`, puis l'événement précédent et le suivant dans le fil du temps de toute la chronique (`sortYear`), avec leur année.
- **Droite** : `TempsEspace` cadré sur les lieux de l'événement, profil de sa période, encoche sur son année.
- Ouvrir un événement règle l'année sur la sienne (§2.6).
- Pas de feu entre deux événements d'une même période ; feu si l'on change de période par « suivant ».

### 5.7 Lignée `/lignee` (pal)

```
┌────────────────────────────────────────────────────────────────────────────────┐
│ Zaldrīzo Ānogar (glose, nav.genealogy)     le lien : [Rhaenyra] et [Aegon II]│
│                                                                                │
│               █  Jaehaerys Ier ♔  I    48 à 103                                │
│               █                                                                │
│               █  Baelon                                                        │
│  Alicent ─────█─── Viserys Ier ♔ ── Aemma Arryn   en 129 : mort                │
│               █         │                                                      │
│               █  [ Rhaenyra ♔, 32 ans ]  ◯═══ Daemon, 48 ans                   │
│               █         │      oncle de Rhaenyra, et son époux                 │
│   Jacaerys  Lucerys  Joffrey   Aegon III  Viserys II                           │
│               █  Viserys II  (le fil continue)                                 │
│               ▼                                                                │
│  en 129 : 41 vivants connus, 9 cavaliers, règne d'Aegon II et de Rhaenyra       │
├────────────────────────────────────────────────────────────────────────────────┤
│ fasce : la vie de la personne au centre en sang                                 │
└────────────────────────────────────────────────────────────────────────────────┘
```

- **Le pal** : une bande verticale `--sang` de 12 px (colonne 3 sur ordinateur, à 28 px du bord sur téléphone) qui descend toute la page. C'est le fil de filiation (`mainThread`, 20 personnes, une par génération : l'axe est la génération, pas le temps, conclusion de l'agent 03 reprise par `ux-architecture.md` §8.4). Les vingt noms sont posés à droite du pal ; un souverain porte sa couronne `--or` et son ordinal en Grenze. Le pal est un tracé SVG tiré des données, jamais une bordure CSS.
- **Le centre** (`?p=`, par défaut le souverain de l'année réglée, sinon Aegon Ier) : `focusOn` de `@/core/genealogy`. Grands-parents et parents au-dessus, conjoints sur les côtés, enfants dessous groupés par union, fratrie en ligne. Une union entre proches parents est un anneau `--sang` fermé qui relie les deux noms, avec la parenté écrite en clair (`kinship`, `consanguinity`). Une personne hors du fil est dessinée à la hauteur de sa génération, reliée au pal par un trait `--cendre` qui suit `lineBetween` jusqu'à son ancêtre sur le fil.
- **À l'année réglée** (`D11`) : l'âge après chaque nom (« vers 32 ans » si la date est approchée), les morts en `--cendre` avec l'année de leur mort, les personnes pas encore nées à 40 % d'opacité, une personne sans date avec « date inconnue » (jamais un âge inventé). Sous le bloc, la ligne de l'année : vivants connus, cavaliers, règne (`yearState`).
- **Le lien** (`LienParente`, colonnes 9 à 12, ou sous le bloc sur téléphone) : deux champs (`?p=` et `?avec=`, listes déroulantes accessibles), puis la parenté en toutes lettres et le chemin tracé en `--braise` par l'ancêtre commun (`lineBetween`, `kinship`), union comprise (« oncle et nièce, et époux »).
- **L'arbre entier** (`?vue=arbre`, champ plein) : `layoutTree` en SVG, déplacement au glisser, zoom au pincement et aux touches + et −, unions consanguines en boucles. Choisir une personne revient au pal centré sur elle. Sur téléphone, plein écran en `dialog`.
- Équivalent accessible : le centre est aussi une liste titrée (parents, conjoints, enfants par union, fratrie) ; le dessin est `aria-hidden`.
- Mouvement : la lignée se déploie au changement de centre (§6, mouvement 5).
- Épreuve à passer avant de construire le reste (`ux-architecture.md` §8.4) : à 360 px, les rangées de Viserys Ier, Rhaenyra et Viserys II doivent se lire sans légende.

### 5.8 Personnages `/personnages` (fascé)

- Chaque personne est une rangée : à gauche (colonnes 1 à 3) le nom, l'épithète en italique, les années, la couronne ; à droite sa ligne de vie à l'échelle exacte de la fasce (`lifeSpans` : trait `--ivoire` de 3 px pour la part sûre, pointillé pour l'étendue incertaine, règne en aplat `--or` par-dessus). L'encoche de l'année réglée se prolonge en entaille verticale `--obsidienne` de 2 px à travers toutes les lignes, ce qui montre d'un regard qui vit cette année-là.
- Ordre : par naissance (ordre de `lifeSpans`) ; groupes par période, la période IV subdivisée par règne ; `Rail` de saut sur ces groupes (aucun groupe de plus de 30 personnes). Les 44 personnes sans aucune année sont à la fin, sous « sans date », avec une courte hachure.
- Filtres (`Filtres`) : rois et reines, prétendants, cavaliers de dragon, bâtards, maison. Survol ou focus d'une rangée : la vie se pose aussi sur la fasce.
- Le nom est un `NomEntite` (cartel) ; la rangée entière n'est pas cliquable.
- Téléphone : nom et années sur une ligne, ligne de vie dessous sur toute la largeur, alignée sur la fasce du téléphone.

### 5.9 Fiche `/personnages/:personId` (parti)

- **Gauche** : `Titre` (nom, épithète), titres portés, la phrase qui situe (`lead`), parenté écrite (fils ou fille de, unions, enfants, en `NomEntite`), biographie en sections, ce que les sources ne tranchent pas, puis **ce que l'adaptation change** dans un bloc distinct sur `--suie`, ouvert par la marque de continuité (`label.continuity.show`). Sans biographie rédigée : la note, la parenté, les événements où la personne paraît.
- **Droite**, collante : la vie agrandie (naissance, règne en `--or`, mort, événements en encoches), le fragment du pal (parents, unions, enfants, lien « voir dans la lignée » vers `/lignee?p=`), les dragons montés en petites silhouettes à l'échelle commune. Le grand nombre est l'ordinal pour un souverain ; aucun pour les autres.
- Sur la fasce : la vie de la personne en sang.

### 5.10 Dragons `/dragons` (fascé) et planche `/dragons/:dragonId` (champ plein)

**Registre.** En tête, `DragonScale` des dragons vivants à l'année réglée (« qui vole en 129 », `v2.dragons.flying`), ou de tous si aucune année n'est réglée, sur le sable (`tone="specimen"`, `ground="dark"`), graduations en `--bronze`, la figure humaine pour l'échelle. Puis une rangée par dragon : petite silhouette, nom (`NomEntite`), alias, et sa vie à l'échelle de la fasce (plein, puis hachure pour le sort inconnu), les cavaliers en segments `--ivoire` sur la vie. Groupes par époque. Les dragons qu'on ne peut pas dater (`unknown` de la série D1) sont à la fin, sous « non datés ».

**Planche.**

```
┌────────────────────────────────────────────────────────────────────────────────┐
│╲ ┌────────────────────┐            ▲                                         ╱│
│ ╲│ Balerion           │           ███          réserves d'obsidienne         ╱ │
│  │ la Terreur noire   │          █████         autour du texte              ╱  │
│  │ 114 av. C. à 94    │      ▄▄███████▄▄                                   ╱   │ les ailes de Balerion
│  └────────────────────┘▁▁▁▄███████████████▄▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁╱    │ sortent du cadre
│                            █████████          ┈┈ fantôme : Syrax, vue juste    │
│                             ███████              avant, même échelle           │
├────────────────────────────────────────────────────────────────────────────────┤
│ fasce : la vie de Balerion en sang                                              │
└────────────────────────────────────────────────────────────────────────────────┘
```

- **L'échelle par le cadre** : une seule échelle pour toutes les planches. Balerion (`span: 1`) vaut 1,6 largeur de fenêtre : ses ailes sortent du cadre ; Syrax (0,4) tient dans l'écran. On sent la taille en passant d'une planche à l'autre. `DragonFigure` en `tone="specimen"`, `ground="dark"`, `detail="fine"`.
- **Le fantôme** : le contour du dragon vu juste avant (gardé dans la session ; Balerion par défaut) reste tracé en `--cendre`, pointillé, à la même échelle et au même centre.
- **L'honnêteté de l'échelle** : si la taille n'est pas décrite par les livres (`attested.size` faux), le contour du dragon est en pointillé et une légende le dit (`v2.dragon.size_estimated`). Les couleurs non décrites restent en réserve (contour seul, `unattested="bare"`).
- **Réserves** : le nom, l'alias, les années et la fiabilité sont dans une réserve d'`--obsidienne` opaque en haut à gauche, qui coupe le dessin comme une gravure laisse un blanc. Jamais de transparence.
- **Sous le premier écran**, en parti : à gauche l'apparence, l'origine, les batailles (`NomEntite`, avec le sort du dragon), le sort, la note d'adaptation, les sources ; à droite, collants, les cavaliers sur la vie agrandie et **la suite des lieux où le dragon paraît** (lieux de ses événements et batailles, dans l'ordre du temps, numérotés sur une petite carte avec `mark`). La légende dit « lieux où il paraît » (`v2.dragon.places`) : ce n'est pas un vol attesté, et la figure ne trace aucune ligne entre les lieux.
- **Ombre** : à la première visite de la planche dans la session, l'ombre de ce dragon passe ; elle n'assombrit que la fasce et les rouges qu'elle traverse (§6).
- **Téléphone** : le dragon tête en haut, mesuré au défilement : Balerion fait 2,4 hauteurs d'écran de la tête au bout de la queue, Syrax une ; la réserve du nom en tête ; le reste dessous en une colonne.

### 5.11 Guerres `/guerres` (fascé) et `/guerres/:warId` (parti)

**Liste.** Une rangée par conflit (douze) : titre valyrien et glose, années, les deux camps et leur marque, nombre de batailles, dragons perdus ; à droite, sa place sur l'échelle de la fasce (aplat `--sang` d'au moins 6 px, la Danse de 129 à 131 fait 8 px à 1440). Groupes par période.

**Conflit.**
- **Gauche** : `Titre`, années, les deux camps face à face sur deux colonnes (marque pleine `--ivoire` pour les Noirs, marque `--v2-vert` pour les Verts, marque neutre sinon ; chefs en `NomEntite`), causes, puis **les batailles dans l'ordre** : numéro d'ordre en Grenze dans la colonne suspendue, année en chiffres tabulaires, nom (`h3`, ancre `#<battleId>`), lieu (`NomEntite`, ou « lieu inconnu »), vainqueur, dragons engagés et leur sort, récit, pertes, fiabilité. Puis conséquences, événements liés, sources.
- **Droite** : `TempsEspace` avec la carte où chaque bataille située porte son numéro (`mark`), le profil de la durée de la guerre.
- **Rejouer** : sous la carte, « bataille précédente » et « bataille suivante » (jamais de lecture automatique). Chaque pas recadre la carte sur le lieu, fait défiler la colonne gauche jusqu'à la bataille, règle l'année et met à jour l'ancre (`replace`). Une bataille sans lieu garde le cadre précédent et le dit.
- Entrer dans un conflit depuis une autre vue : le feu part de son année sur la fasce (§6).
- Téléphone : la carte fixe en tête (40 svh, numéros, « plein écran »), puis les batailles ; précédente et suivante en pied de chaque bataille.

### 5.12 Lieux `/lieux` et `/lieux/:placeId` (champ plein, carte persistante)

```
┌────────────────────────────────────────────────────────────────────────────────┐
│ ┌──────────────────┐                                                           │
│ │ Ālia             │        Westeros (terres --suie, côtes --cendre)           │
│ │ (glose : lieux)  │              ◦ Winterfell                                 │
│ │                  │                     ◉ Harrenhal        ◦ Peyredragon       │
│ │ en 130 :         │               ◉ Repos-du-Freux  ◦ Port-Réal                │
│ │ le Gosier        │                                                           │
│ │ Harrenhal …      │                                              ◦ Valyria    │
│ │ tous les lieux ▾ │                                                           │
│ │ cités  forteresses│                                                          │
│ └──────────────────┘                                                           │
├────────────────────────────────────────────────────────────────────────────────┤
│ fasce                                                                          │
└────────────────────────────────────────────────────────────────────────────────┘
```

- `PlacesShell` porte la carte (`WorldMap`) sur tout le champ, entre la ligne haute et la fasce ; ses deux routes filles changent la colonne gauche. La carte ne se remonte jamais entre `/lieux` et un lieu, ni entre deux lieux : elle se recadre (`frame`, 700 ms, `expo.out`).
- **Cadre par défaut** : la baie de la Néra (Peyredragon, Port-Réal, Accalmie) avec Valyria visible au bord, pas le Nord.
- **Colonne gauche** (colonnes 1 à 3, réserve d'`--obsidienne` opaque) : sur `/lieux`, le titre, puis les lieux de l'année réglée (lieux de ses événements et batailles) en tête, puis tous les lieux groupés par région, filtres par genre (`?genre=`). C'est l'équivalent accessible de la carte : tout ce que la carte montre y est en liste.
- **Lieux de l'année** en `--braise` (`highlightIds`) ; les autres à demi. Si la carte reçoit une intensité par lieu (`D6`), les lieux d'une année passée refroidissent de la braise au cramoisi sur dix ans et ceux où un dragon a brûlé gardent une marque ; sinon, allumé ou non, rien de plus.
- **Lieu** : la carte se recadre sur lui ; la colonne devient la notice (nom valyrien et glose, genre, région, description, rôle, événements et batailles avec leurs années). **Les années du lieu sont des encoches sur la fasce** (`D5`) : Harrenhal, bâti, brûlé par Balerion, pris par Daemon, et la suite, se lit d'un regard sur le temps.
- Téléphone : la carte fixe en tête (55 svh, sans geste, bouton « plein écran »), puis la liste ou la notice.

### 5.13 Langue `/langue`, `/langue/lexique`, `/langue/grammaire`, `/langue/expressions` (parti, fasce éteinte)

- **Accueil** : à gauche, ce qu'est le haut valyrien, d'où vient ce qu'on en sait (Peterson), ce que le site s'interdit (aucune écriture inventée), les statuts des formes avec leurs marques, puis les trois salles avec leur compte. À droite, collante, **la figure est une glose** : « Valar morghūlis » en Texturina `--t5`, mot à mot dessous, statut et note du linguiste.
- **Lexique** : le premier écran montre des mots (la V1 ne le faisait pas). À gauche, la table : forme valyrienne en Texturina `--t1`, sens, nature grammaticale, marque de statut, thème ; recherche tolérante aux macrons (`normalize` de `@/core/search`), filtres par thème et par statut, `Rail` alphabétique. À droite, collant, **le spécimen** du mot survolé ou choisi : la forme en `--t5`, sa glose, son statut, sa note, ses références. Téléphone : toucher un mot déplie sa note et son spécimen (`--t3`) sous la rangée.
- **Grammaire** : leçons dans l'ordre (numérotées : c'est une suite) ; tableaux sans filet vertical ni cadre, un seul trait `--cendre` de 1 px sous la rangée d'en-tête, rangées séparées par l'espace. À droite, le sommaire des leçons.
- **Expressions** : la formule en Texturina `--t2`, le mot à mot en glose interlinéaire, le sens, le contexte, les références.

### 5.14 Sources `/sources` (parti, fasce éteinte)

À gauche, le registre des ouvrages par nature (livres, nouvelles, encyclopédie de l'univers, série, outils de vérification), chacun avec sa note de fiabilité ; la séparation des livres et de l'adaptation expliquée. À droite, collante, **la figure est l'échelle des cinq marques** de fiabilité (`@/shared/marks`, à 48 px), chacune avec son libellé et sa définition. Ancres `#<sourceId>` pour les liens des `SourcesPied`.

### 5.15 Apprendre `/apprendre` (fascé) et `/apprendre/:pathId` (parti)

- **Liste** : les cinq parcours numérotés en Grenze (c'est une vraie suite), une rangée chacun : titre, durée de lecture, et à droite la durée historique qu'il couvre, tracée à l'échelle de la fasce (d'après les périodes de ses liens, `D5`).
- **Parcours** : à gauche, l'introduction, le sommaire de toutes les étapes (`ux-architecture.md` §3.3, exigence 5), les étapes dans l'ordre (titre, texte, liens en `NomEntite` ou vers les vues, « à retenir »), puis le questionnaire : une question à la fois (`@/core/quiz`), réponse expliquée et sourcée, bilan avec les erreurs à revoir, progression gardée en local (`@/core/quiz` storage). Aucune médaille, aucun score mis en scène. À droite, collants, le profil de la période de l'étape en cours et la position dans le questionnaire.

### 5.16 À propos `/a-propos` (champ plein, fasce éteinte)

Le colophon : pourquoi cette bibliothèque, comment elle est faite (polices et licences, figures dessinées par le code, ce qu'est la fasce et comment elle est comptée, ce qu'elle ne compte pas), ce qu'elle doit à George R. R. Martin et à David J. Peterson, la mention non officielle. La figure : l'emblème (`@/shared/emblem`) en `--sang` sur le sable, et au dos le poinçon JD (ancre `#poincon`, cible du détail caché).

### 5.17 Page introuvable `*` (champ plein, fasce éteinte)

« Kesir ilos daor. » (`phrase.not_found`) en Texturina `--t5` avec sa glose, la phrase d'explication (`error.notFound.body`), un lien vers le portail (`nav.portal`) et « Registres ». La figure : la fasce en majesté à 30 svh, sans encoche, toute en cramoisi : on est hors du temps. Garder `data-ecran="introuvable"` pour l'audit des liens.

## 6. Mouvement

GSAP depuis `@/core/motion` uniquement, toujours par `useGSAP` avec `scope`, et `gsap.matchMedia()` avec `MOTION_CONDITIONS`. Courbes `expo.out` et `power4.out` seulement. On n'anime que `transform`, `opacity`, `clip-path` et des uniformes de shader. Rien ne bouge au défilement en dehors de l'encoche que règlent les annales (un instrument qui suit la lecture, pas une apparition).

| # | Mouvement | Raison | Technique | Mouvement réduit |
|---|---|---|---|---|
| 1 | **La masse se dépose** (ordinateur, premier départ du portail, une fois par session) | Montrer que la navigation est l'histoire elle-même ; c'est l'ouverture de la V2, 2,5 s plus courte que celle du Codex | La fasce en majesté (45 svh) s'écrase en `scaleY`, origine en bas, jusqu'à 44 px, 700 ms, `expo.out`, pendant que la nouvelle vue arrive en fondu de 160 ms. La masse déborde vers le haut pendant le geste, sans prise sur les clics. Sur téléphone, rien : la fasce est déjà là | La fasce est posée |
| 2 | **Le temps se règle** | Rendre visible que tout dépend de l'année | Une seule année source dans `state/year.ts`. L'encoche suit le pointeur par `gsap.quickTo` sur `x` (280 ms, `expo.out`). Les consommateurs ne lisent que l'année entière et ne se rendent qu'à son changement, au plus un rendu React par image : lieux de la carte (`highlightIds`, transition d'opacité), profil, âges, cartel. Dans le cartel, seuls les chiffres qui changent roulent dans un masque (`clip-path`), 240 ms, `expo.out` | L'année saute, rien ne roule |
| 3 | **Le feu part de la fasce** | « Le feu efface et révèle », et il part du moment de l'histoire que le lecteur a désigné | `BurnTransition` monté une fois dans `Layout.tsx` (shader compilé pendant un temps mort). `useFeu().passer(to, year)` joue le feu avec `origin` = (abscisse de `year` sur la fasce rapportée à la largeur, hauteur de la fasce rapportée à la hauteur de la fenêtre), puis navigue dans `onCovered`. Déclenché en changeant de période (rangée des périodes, chroniques, période suivante ou précédente, événement suivant qui change de période) et en entrant dans un conflit depuis une autre vue. Une fois par navigation au plus, jamais entre deux vues d'une même période ou d'un même registre | Le voile d'obsidienne de 150 ms du composant |
| 4 | **L'ombre passe sur le rouge seul** | Le dragon couvre la couleur de la Maison | `DragonShadow` avec la silhouette du dragon (`look`), dans `Ombre.tsx`, enveloppe fixe en `mix-blend-mode: multiply` : invisible sur le sable, elle assombrit le profil, la fasce, le pal qu'elle traverse. Une fois par page et par session (`state/once.ts`), à l'ouverture d'une période (dragon qui compte, `D5`) et d'une planche de dragon. Le fondu par multiplication d'un enfant fixe est à vérifier dès le premier prototype ; à défaut, l'ombre passe seulement sur la fasce, découpée par un `clip-path` | Pas d'ombre |
| 5 | **La lignée se déploie** | Rendre visible la filiation et le sang refermé sur lui-même | Au changement de centre, `Flip` : la personne touchée monte au centre, les parents glissent, les autres sortent en fondu (400 ms, `expo.out`) ; le pal se retrace du parent à l'enfant (`clip-path`, 500 ms) ; les fils du bloc se tracent avec `DrawSVGPlugin` (400 ms) ; les anneaux du sang se ferment en dernier (280 ms). Le chemin du lien de parenté monte jusqu'à l'ancêtre commun puis descend, 90 ms par génération | La nouvelle disposition, tout tracé |
| 6 | **Gestes** | Ouvrir, fermer, sélectionner | Cartel : 280 ms (`translateY` sur téléphone, `translateX` sur ordinateur), `expo.out`. Index et recherche : fondu de 160 ms. Couche de la vue : fondu de 160 ms. Recadrage de la carte : `frame` de `WorldMap` (700 ms) | Fondus de 150 ms |

**Détail caché.** « dracarys » tapé hors d'un champ : le feu part du pointeur (du centre sur un écran tactile) et révèle le colophon au poinçon JD (`/a-propos#poincon`). Une fois par session ; en mouvement réduit, le voile de 150 ms.

**Retirés exprès** : la page qui tourne (V1), toute apparition au défilement, toute animation permanente (aucun shader de fond, aucune particule), la traversée de caméra.

## 7. Performance

- **Aucun WebGL permanent.** Le seul canvas est celui de `BurnTransition`, qui ne fait qu'un pixel au repos et ne vit que pendant un passage du feu ; densité plafonnée à 1,5.
- **La fasce** : un tracé calculé une fois (environ 420 marches), mémorisé ; les hachures sont un motif SVG. Le réglage du temps ne déplace qu'une transformation et ne change que des attributs de données et des opacités.
- **Données** : la fasce a besoin des périodes, des années et lieux des événements, de la présence des dragons et des règnes. Sans l'index de scène (`D7`), le bâti tirerait `timeline.json` (660 Ko, à cause des récits), `people.json` et `dragons.json` dans le premier bloc. Avec lui, une trentaine de kilo-octets. Récits, biographies, langue, parcours, recherche : blocs chargés à la demande de la vue.
- **La carte** : un `WorldMap` par vue qui en a besoin, chargé avec la vue ; persistant entre les lieux (§2.5). Le recadrage actuel réécrit tout le SVG à chaque image : la V2 recadre au plus une fois par geste du lecteur, jamais en continu au défilement.
- **Budgets**, mesurés sur Chrome avec processeur ralenti quatre fois : premier affichage utile du portail sous 2 s sur un téléphone moyen ; LCP sous 2,5 s ; INP sous 200 ms pendant qu'on tire la fasce ; aucune tâche de plus de 50 ms pendant un réglage d'année ou un recadrage ; bloc JavaScript de la V2 sous 120 Ko compressés, hors GSAP et hors données.

## 8. Accessibilité

- Un seul `h1` par vue ; `main` est la couche de la vue ; la fasce est dans un `footer` qui n'est pas un `contentinfo` du récit (`aria-label` : `v2.fasce.label`).
- La masse est un curseur (§2.2) ; la rangée des périodes, l'Index et chaque figure ont leur équivalent en liste de liens. Les figures denses (`DragonScale`, arbre entier, carte) sont `aria-hidden` quand la liste voisine dit la même chose ; sinon `role="img"` et une légende.
- Après un réglage d'année, une région `aria-live="polite"` annonce, au plus toutes les 500 ms, ce qui a changé dans la vue (« 130 apr. C., 9 lieux allumés », `v2.year.live`).
- Cibles de 44 px partout, y compris les crans d'année, les périodes, les lieux de la carte (zone de pression de `WorldMap`) et les rangées des registres. Focus : contour 2 px `--braise` décalé de 3 px.
- Jamais la couleur seule : durée de la vue doublée d'un trait ivoire, sort inconnu en hachure, fiabilité en marque dessinée, camps en marques de formes différentes.
- Tout texte valyrien porte `lang="art-x-valyrian"`, y compris dans les SVG (titres des périodes de la rangée, noms de la carte).
- `prefers-reduced-motion` : §6, colonne de droite.

## 9. Dépendances hors de la V2

À décider et à faire par l'orchestrateur, ou par l'agent qu'il désigne ; la V2 ne les règle pas en éditant ces fichiers. Toute logique ajoutée au cœur est une fonction pure testée par Vitest.

| # | Où | Quoi | Statut |
|---|---|---|---|
| **D1** | `@/core/timeline/series.ts` | `dragonPresence(dragons, events, battles, from, to)` : par année, les dragons **vivants attestés**, ceux au **sort inconnu** et ceux qu'on ne peut situer. Début : éclosion, sinon première monte datée, sinon première année d'un de ses événements ou batailles. Fin : mort ; sinon, pour un dragon dit vivant, dernière année attestée (événements, batailles, fin de monte) puis « sort inconnu » jusqu'à `NARRATIVE_END`, sauf s'il est attesté jusqu'à la fin du récit. Effet attendu : Silverwing, Sheepstealer et Morning en plein jusqu'à leur dernière mention (131) puis en hachure, le dernier dragon compté à sa mort en 153 (sa seule mention dans les données ; si les agents de contenu datent son éclosion, il sera compté plus tôt), aucun rouge plein de 154 à 298, trois dragons en 299 | **bloquant** pour la fasce |
| D2 | `@/core/timeline` | `yearState(year, données)` : période(s), souverain(s) régnant(s), dragons (attestés, sort inconnu), guerres en cours, événements de l'année, nombre de personnes connues en vie et de cavaliers | requis (état du royaume, lignée) |
| D3 | `@/core/timeline` | `datedYears(events)` et `stepYear(years, year, sens)` : les 60 crans | requis |
| D4 | `@/core/search` | `parseYearQuery(query)` : « 129 », « 130 apr », « -114 », « 114 av », « 114 BC », « 42 AC » vers une année, sinon `null` | requis |
| D5 | `@/core/timeline` ou `@/core/content` | projections : `relationsOf(genre, id)` (les quatre rangées du cartel), `entityYears(genre, id)` (encoches d'un lieu, d'une personne), `leadingDragon(periodId)`, `dragonPlaces(dragonId)` (lieux dans l'ordre du temps), `pathSpan(path)` | requis |
| D6 | `@/shared/map/WorldMap.tsx` | facultatif, rétrocompatible : (a) `controls?: boolean` pour masquer les boutons ; (b) `heat?: ReadonlyMap<string, number>` exposé en variable CSS sur chaque lieu ; (c) recadrage par transformation du groupe pendant le geste, `viewBox` réécrit à l'arrêt ; (d) `gestures?: boolean` pour une carte fixe dont les lieux restent des liens. Sans lui : boutons habillés par les variables, lieux allumés ou non, `touch-action: pan-y` sur le conteneur au téléphone | recommandé |
| D7 | `scripts/build-content.mjs` | `src/content/generated/scene.json` : périodes (id, bornes, titres), événements (id, année, `sortYear`, période, lieux, dragons), présence des dragons, règnes ; une trentaine de kilo-octets | recommandé (performance) |
| D8 | contenu et `types.ts` | `EssaySection.span?: [Year, Year]` et `placeIds?: string[]`, rédigés par les agents de contenu, pour que le récit règle l'année et la carte | facultatif |
| **D9** | `@/core/i18n` | remonter `fineTypo` (aujourd'hui dans la V1, réserve de l'audit V1) pour que `Prose` de la V2 en profite | **bloquant** pour les vues de récit |
| D10 | `src/app/routes.tsx` | `'version-2': lazy(() => import('@/versions/v2'))`, au premier jalon montrable | requis |
| D11 | `@/core/genealogy` ou `@/core/timeline` | `ageAt(person, year)` : âge et caractère approché, `null` si rien ne permet de le dire | requis (lignée, cartel) |

## 10. Écriture

- Aucune chaîne visible en dur. Les chaînes nouvelles vont dans `content/interface/ui.v2-<domaine>.json`, enveloppe `{ "schema": 1, "generatedBy": "agent-NN", "items": [ { "key": "v2.<vue>.<nom>", "fr": "…", "en": "…" } ] }`, puis `node scripts/serial.mjs node scripts/build-content.mjs`. Le valyrien de ces chaînes est ajouté ensuite par le linguiste : ne pas en inventer.
- **Réutiliser d'abord** : `nav.*` (registres, portail), `action.previous`, `action.next`, `action.close`, `action.search`, `action.open`, `action.back`, `action.menu`, `label.year`, `label.reign`, `label.born`, `label.died`, `label.age`, `label.dragon`, `label.rider`, `label.war`, `label.battle`, `label.place`, `label.blood`, `label.fire`, `label.sources`, `label.reliability`, `label.unknownDate`, `label.continuity.*`, `phrase.not_found`, `phrase.valar_morghulis`, `phrase.valar_dohaeris`, `a11y.*`, `error.notFound.body`.
- Domaines et clés à créer (liste de départ, à compléter vue par vue) :
  - `ui.v2-bati.json` : `v2.fasce.label`, `v2.fasce.valuetext`, `v2.fasce.all_time`, `v2.fasce.step_previous`, `v2.fasce.step_next`, `v2.fasce.periods`, `v2.index.title`, `v2.index.periods`, `v2.index.registers`, `v2.search.placeholder`, `v2.search.set_year`, `v2.search.count`, `v2.cartel.open_page`, `v2.cartel.none`, `v2.cartel.rows.blood`, `v2.cartel.rows.dragon`, `v2.cartel.rows.war`, `v2.cartel.rows.place`, `v2.state.title`, `v2.state.empty`, `v2.state.reign`, `v2.state.dragons`, `v2.state.unknown_fate`, `v2.state.wars`, `v2.state.this_year`, `v2.state.house`, `v2.year.outside`, `v2.year.live`, `v2.resume.label`, `v2.map.fullscreen`.
  - `ui.v2-chroniques.json` : `v2.portal.note.doom`, `v2.portal.note.conquest`, `v2.portal.note.peak`, `v2.portal.note.last_dragon`, `v2.portal.note.hatching`, `v2.chronicles.reigns`, `v2.chronicles.wars`, `v2.chronicles.peak`, `v2.period.contents`, `v2.period.annals`, `v2.period.open_questions`, `v2.event.previous`, `v2.event.next`, `v2.event.consequence`.
  - `ui.v2-lignee.json` : `v2.lineage.link`, `v2.lineage.first`, `v2.lineage.second`, `v2.lineage.year_line`, `v2.lineage.age`, `v2.lineage.age_approx`, `v2.lineage.dead_since`, `v2.lineage.unborn`, `v2.lineage.whole_tree`, `v2.lineage.back_to_line`, `v2.people.undated`, `v2.person.adaptation`.
  - `ui.v2-registres.json` : `v2.dragons.flying`, `v2.dragons.undated`, `v2.dragon.size_estimated`, `v2.dragon.ghost`, `v2.dragon.places`, `v2.dragon.colours_described`, `v2.dragon.colours_not_described`, `v2.wars.battles_count`, `v2.wars.dragons_lost`, `v2.war.replay_previous`, `v2.war.replay_next`, `v2.war.place_unknown`, `v2.places.this_year`, `v2.places.all`, `v2.place.years`.
  - `ui.v2-savoirs.json` : `v2.language.rooms`, `v2.lexicon.specimen`, `v2.sources.scale`, `v2.learn.span`, `v2.path.contents`, `v2.about.fasce`.
- Exemples de ton (français) : `v2.fasce.valuetext` « {year}, règne de {reign}, {period}, {count} dragons vivants » ; `v2.year.outside` « En {year}, {name} n'est pas encore né. » ou « … est mort depuis {n} ans. » (deux clés) ; `v2.state.empty` « Réglez une année sur la fasce pour voir qui règne, qui vole et où l'on se bat. » ; `v2.dragon.places` « Lieux où il paraît, dans l'ordre du temps. Ce n'est pas un trajet attesté. »
- Écriture de DESIGN §8 et de PRODUCT : phrases courtes, casse de phrase, aucun point d'exclamation, aucun tiret cadratin, guillemets français « » en français et anglais “ ” en anglais, noms des traductions publiées. Aucune phrase qui décrit le site ou son procédé, sauf au colophon.

## 11. Ordre de réalisation et contrôle

Chaque jalon est montrable, capturé (`node scripts/serial.mjs node scripts/render.mjs http://127.0.0.1:5173/version-2/<chemin> tests/visual/out/v2/<nom>.png <largeur> <hauteur> --wait=1800`), regardé et critiqué avant le suivant. Largeurs : 360x800, 390x844, 768x1024, 1280x800, 1440x900.

1. **Fasce, année, portail** (après D1, D3, D10) : la fasce ne ment pas (aucun rouge plein de 154 à 298), le curseur au clavier et au doigt, `?an=`, le cartel, la masse en majesté. Capture du portail à côté de celui de la V1.
2. **Période V** (après D9) : parti, profil évidé, carte, annales qui règlent l'année, sommaire. À 360 px avec le Gosier.
3. **Cartel** : aperçu et état du royaume (après D2, D5, D11), Retour qui ferme, focus rendu.
4. **Lieux** : carte persistante, lieux de l'année, encoches d'un lieu.
5. **Lignée** : l'épreuve des rangées Viserys Ier, Rhaenyra, Viserys II à 360 px, puis le lien et l'arbre entier.
6. **Dragons** : échelle par le cadre, fantôme, échelle honnête, téléphone mesuré au défilement.
7. **Guerres** : rejouer, ancres.
8. **Feu, ombre, masse qui se dépose, « dracarys »**, et le mouvement réduit de chacun.
9. **Personnages, chroniques, langue, sources, apprendre, à propos, introuvable.**
10. **Revue** : interdits de DESIGN §0 dans le code et sur capture ; aucune vue sans figure ; aucun rouge qui ne soit une donnée ; liens (`tests/functional/links.mjs http://127.0.0.1:5173/version-2`) ; règle des trois interactions ; contrastes ; `tsc` (`node scripts/serial.mjs npx tsc -b --noEmit`) ; budgets du §7.
