# Wireframes — Targaryen Chronicles

Agent 06, architecte UX / information. Tâche B4. Version du 13 novembre 2026.

Document lié : `documentation/design/ux-architecture.md`, dont les numéros de section sont cités ici (« UX 5.4 »).

## Comment lire ces wireframes

**Ce qu'ils montrent.** Le squelette commun aux trois versions : quelles informations, dans quel ordre, avec quels contrôles. Ils ne montrent ni la matière, ni la couleur, ni le mouvement, qui relèvent du cahier artistique. La disposition dessinée est la plus neutre, proche de V1 ; quand V2 ou V3 changent la navigation d'un écran, une ligne « Variantes » le dit.

**Ce qu'ils ne sont pas.** Aucun n'a été rendu dans un navigateur. Les largeurs sont des intentions : un caractère vaut environ 13 px sur le cadre de bureau (100 caractères pour 1 280 px) et 9 px sur le cadre mobile (40 caractères pour 360 px).

**État de langue dessiné.** Sauf mention contraire : mode valyrien glosé, langue de lecture française (état L1 ; c'est aussi ce que voit un francophone à sa première visite). C'est l'état le plus exigeant pour la mise en page, puisque chaque rubrique occupe deux lignes.

**Valyrien.** Toutes les formes viennent de `content/glossary/lexicon.json`. Là où le lexique n'a pas la forme, la chaîne est en français et l'annotation le signale : ce sont les demandes adressées à l'agent 04.

**Exemples d'univers.** Les données des agents 02 et 03 (`timeline.json`, `dragons.json`, `sources.json`, `genealogy.json`) ont été livrées pendant ce travail. Les écrans ont été réalignés sur elles : titres d'événements, dates, bornes des périodes, unions, dragonniers, sources et comptes en viennent, sauf mention « fictif ». Ce qui reste de ma mémoire, faute de données : la composition des camps d'une guerre (W08) et la position des lieux (W09). Les noms français des lieux sont ceux de l'agent 02, qui les déclare lui-même non vérifiés dans les éditions françaises.

**Notation d'ère.** J'emploie celle des libellés de `timeline.json` : « 129 AC », « 27 av. C. ». L'agent 03 écrit « apr. C. » : à unifier par l'agent 05.

| Signe | Sens |
|---|---|
| `*texte*` | Glose : seconde voix, petit corps, italique. Traduit la rubrique valyrienne qui précède. |
| `[ texte ]` | Bouton ou contrôle. |
| `texte >` | Lien de navigation. |
| `(o)` `( )` | Choix unique, coché ou non. |
| `[x]` `[ ]` | Bascule ou case, active ou non. |
| `==` sous un mot, ou `[HV]` | Position active (onglet, langue). |
| `##` | Nuancier d'écailles d'un dragon, toujours suivi du nom de la couleur. |
| `<1>` | Repère numéroté sur la carte. |
| `( cire )` | Sceau de cire : marque de nature d'une source. |
| `{S}` | Marque du sceau (retour au portail). |
| `{c}` | Chandelle : pictogramme de la recherche, toujours suivi de son mot. |
| `¹ ²` | Appel de source. |
| `(1) (2)` | Renvoi à une annotation. |
| `:::::` | Zone hachurée : non documenté. |
| `~52` | Année approchée ou calculée, non écrite dans les livres. |
| `~~~~` | Suite d'un texte courant. |

---

## W00 — Éléments communs : barre, Index, recherche, glose

### Bureau (≥ 1 280 px)

**La barre et le titre courant**

```text
+--------------------------------------------------------------------------------------------------+
| {S} Tembyroti Jāelion Valyrio          Iderenna     {c} Korjās      HV · FR · EN     Nūmāzma [x] |
|     *La Bibliothèque de Valyria*       *index*          *chercher*  ==               *sens*      |
+--------------------------------------------------------------------------------------------------+
| Vestriarja       >   Zaldrīzoti Lilion        >   Mort de Lucerys à Accalmie                 (1) |
| *Chroniques*         *La Danse des Dragons*                                                      |
+--------------------------------------------------------------------------------------------------+
```

**L'Index (fenêtre plein écran)**

```text
+--------------------------------------------------------------------------------------------------+
| {S}                                                                           [ Bēmās *fermer* ] |
+------------------------------------------------------+-------------------------------------------+
| VESTRIARJA  *Chroniques*                         (2) |  (liste sans titre visible)           (3) |
|                                                      |                                           |
| I     Valyria Uēpa       *L'ancienne Valyria*        |  Zaldrīzo Ānogar   *La lignée*            |
| II    Lentro Prānon      *Les origines de la Maison* |  Issarossa         *Personnages*          |
| III   Āego Ērinnon       *La Conquête*               |  Zaldrīzesse       *Dragons*              |
| IV    Ēlī Dāryssy        *Les premiers rois*         |  Vīlībāzmi         *Guerres*              |
| V     Zaldrīzoti Lilion  *La Danse des Dragons*      |  Ālia              *Lieux*                |
| VI    Lilio Toliot       *Après la Danse*            |  Valyrio Ēngos     *La langue valyrienne* |
| VII   Lentro Mōris       *La chute*                  |  Tembyri           *Sources*              |
| VIII  Irūdion            *L'héritage*                |  Gūrēñagon         *Apprendre*            |
|                                                      |  Keso jāelio bē    *À propos*             |
+------------------------------------------------------+-------------------------------------------+
|  Valyrio Ēngos  ·  Français  ·  English        Les trois versions de cet ouvrage >           (4) |
|  =============                                                                                   |
+--------------------------------------------------------------------------------------------------+
```

**La recherche (fenêtre) et la note de glose**

```text
+--------------------------------------------------------------------------------------------------+
| {c} [ aegon_                                      ]      |  NOTE DE GLOSE                    (6) |
|     *chercher un nom, un lieu, une année*                |  ancrée à la chaîne touchée           |
|                                                          |  -------------------------------------|
| PERSONNES                                            (5) |  Zaldrīzoti Lilion                    |
| Āegon I     · 27 av. C. – 37 AC · le Conquérant        > |                                       |
| Aegon II    · 107–131 · fils de Viserys Ier            > |  La Danse des Dragons                 |
| Aegon III   · 120–157 · fils de Rhaenyra               > |                                       |
| 9 autres personnes nommées Aegon                       > |  Mot à mot : « danse des dragons ».   |
|                                                          |  zaldrīzoti, génitif pluriel de       |
| ÉVÉNEMENTS                                               |  zaldrīzes ; lilion, « danse ».       |
| Deux couronnements · 129 AC                            > |                                       |
| Aegon II empoisonné · 131 AC                           > |  COMPOSITION DE LA BIBLIOTHÈQUE       |
|                                                          |  Mots attestés, assemblés pour ce     |
| MOTS                                                     |  titre. Aucune traduction officielle  |
| Āegon · nom propre · attesté                           > |  connue.                              |
|                                                          |                                       |
| Tout voir : 15 résultats >                               |  Voir les mots >           [ Bēmās ]  |
+--------------------------------------------------------------------------------------------------+
```

**La note de seuil (arrivée par lien profond, première visite) et le glossaire de page**

```text
+--------------------------------------------------------------------------------------------------+
|  Cette bibliothèque s'ouvre en haut valyrien.                                                (7) |
|  [ Lire en français ]      [ Read in English ]      [ Continuer ainsi ]                          |
+--------------------------------------------------------------------------------------------------+
```

```text
+--------------------------------------------------------------------------------------------------+
|  MOTS VALYRIENS DE CETTE PAGE · 31                                      [ Bēmās *fermer* ]   (8) |
+------------------------------+----------------------------------+--------------------------------+
| Vestriarja                   | Chroniques                       | dérivé                         |
| Zaldrīzo Ānogar              | La lignée                        | attesté                        |
| Issarossa                    | Personnages                      | dérivé  ·  forme à confirmer   |
| Valyrio Ēngos                | La langue valyrienne             | composition de la bibliothèque |
| Tembyri                      | Sources (littéralement : livres) | composition de la bibliothèque |
| ~~~~ (26 autres)             |                                  |                                |
+--------------------------------------------------------------------------------------------------+
|  Chaque mot mène à sa fiche.                            Comment lire les niveaux d'attestation > |
+--------------------------------------------------------------------------------------------------+
```

- **Hiérarchie.** La barre porte cinq choses et pas une de plus : sceau, Index, Chercher, langue, glose. Le titre courant est une seconde ligne, plus discrète.
- **(1) Titre courant.** Trois niveaux au plus : espace, groupe, objet. Les deux premiers sont des liens. Un titre sans forme valyrienne (ici le nom de l'événement) est dans la langue de lecture et n'a donc pas de glose.
- **(2) (3) Index.** La première liste a un titre visible, *Vestriarja*, qui existe au lexique. La seconde n'en a pas : le lexique n'a pas de mot pour « registres ». Elle porte un nom accessible dans la langue de lecture (`aria-label="Registres"`), sans texte visible. L'Index est glosé même quand la glose est désactivée.
- **(4)** Sélecteur de langue en toutes lettres, chaque nom balisé dans sa langue. Lien vers l'espace de comparaison.
- **(5) Recherche.** « aegon » trouve *Āegon* (UX 6.2). Douze personnes s'appellent Aegon dans `genealogy.json` : les homonymes sont distingués par dates et filiation, les rois d'abord. Les groupes suivent l'ordre fixe des types. Flèches pour parcourir, Entrée pour ouvrir, Échap pour fermer.
- **(6) Note de glose.** Ouverte en touchant une chaîne valyrienne qui n'est pas un lien. Non modale. Le niveau d'attestation est écrit en toutes lettres. « Voir les mots » mène au lexique.
- **(7) Note de seuil.** Une ligne en tête du contenu, dans la langue de lecture déduite du navigateur, pour qui arrive sans passer par le seuil. Les deux langues y sont nommées chacune dans la sienne. Elle disparaît au premier choix et ne revient pas (UX 5.7). Sur mobile : la phrase, puis trois boutons empilés de 44 px.
- **(8) Glossaire de page.** Ouvert par « Mots valyriens de cette page », en pied de toute page. C'est l'équivalent au clavier et au lecteur d'écran de la note de glose : tout le valyrien de l'écran, son sens, son niveau d'attestation en toutes lettres. Fenêtre modale, focus rendu au bouton à la fermeture.
- **Langue.** En français ou en anglais : la barre perd ses gloses et la bascule *Nūmāzma*, et tient sur une ligne. Les intitulés de groupe de la recherche (« Personnes », « Événements ») sont dans la langue de lecture dans tous les états : le lexique n'a pas ces pluriels, et un groupe d'étiquettes est homogène (UX 5.4).
- **Variantes.** V1 : la barre est le titre courant du livre ; huit signets de tranche à droite doublent la première liste de l'Index. V2 : même barre, sur pierre, plus la jauge des huit ères au bord droit. V3 : même barre ; la réglette est en pied.

### Mobile (360 px)

```text
+--------------------------------------+
| {S} Iderenna  {c} Korjās  [HV]·FR·EN |
|     *index*       *chercher*         |
+--------------------------------------+
| Vestriarja > Zaldrīzoti Lilion   (1) |
| *Chroniques > La Danse des Dragons*  |
+--------------------------------------+
```

```text
+--------------------------------------+
|     NOTE DE GLOSE (feuillet bas)     |
+--------------------------------------+
| Zaldrīzoti Lilion                    |
| La Danse des Dragons                 |
|                                      |
| Mot à mot : « danse des dragons ».   |
|                                      |
| COMPOSITION DE LA BIBLIOTHÈQUE       |
| Mots attestés, assemblés pour ce     |
| titre.                               |
|                                      |
| Voir les mots >            [ Bēmās ] |
+--------------------------------------+
```

- **Hiérarchie.** Les quatre contrôles restent visibles : la langue n'est jamais cachée dans un menu. Chacun fait 44 px de haut. Le titre courant défile avec la page ; seule la première ligne est fixe.
- **(1)** Sur mobile, le titre courant s'arrête au groupe : le nom de l'objet est le titre de la page, juste dessous.
- **Comportement.** La bascule *Nūmāzma* passe dans l'Index, sous le sélecteur de langue. L'Index devient une seule colonne : les huit périodes, puis les neuf registres, soit dix-sept lignes de 48 px. La note de glose est un feuillet bas qui ne couvre pas plus de la moitié de l'écran.
- **Risque.** La première ligne mesure environ 336 px sur 360. Elle tient avec les codes, pas avec les noms entiers. À vérifier au rendu avec la police d'étiquette.

---

## W01 — Seuil (écran d'ouverture)

État dessiné : plan 7 du cahier artistique (la réponse est offerte), première visite.

### Bureau

```text
+--------------------------------------------------------------------------------------------------+
|                                                                                                  |
|                                          .  '  '  '  .                                           |
|                                         '   .-----.   '                                          |
|                                       '   /  ( | )  \   '                                    (1) |
|                                       '   \    |    /   '                                        |
|                                         '   '-----'   '                                          |
|                                          '  .  .  .  '                                           |
|                                                                                                  |
|                                  V A L A R   M O R G H Ū L I S                               (2) |
|                                 *Tous les hommes doivent mourir*                                 |
|                                                                                                  |
|                                       [  Valar dohaeris  ]                                   (3) |
|                            *Tous les hommes doivent servir · entrer*                             |
|                                                                                                  |
|                                                                                                  |
|                            Valyrio Ēngos   ·   Français   ·   English                        (4) |
|                            =============                                                         |
|                                                                                                  |
+--------------------------------------------------------------------------------------------------+
```

### Mobile (portrait)

```text
+--------------------------------------+
|                                      |
|              .  '  '  .              |
|             '  .----.  '             |
|            '  / (|) \  '             |
|             '  '----'  '             |
|              '  .  .  '              |
|                                      |
|           VALAR  MORGHŪLIS           |
|   *Tous les hommes doivent mourir*   |
|                                      |
|        [   Valar dohaeris   ]        |
|   *Tous les hommes doivent servir*   |
|               *entrer*               |
|                                      |
|                                      |
|                                      |
|  Valyrio Ēngos · Français · English  |
|  =============                       |
+--------------------------------------+
```

### Mobile (paysage, 640 × 360)

```text
+---------------------------------------------------------------------+
|                            |                                        |
|      .  '  '  .            |   VALAR  MORGHŪLIS                     |
|    '  .----.  '            |   *Tous les hommes doivent mourir*     |
|    '  / (|) \  '           |                                        |
|    '  '----'  '            |   [  Valar dohaeris  ]  *entrer*       |
|      '  .  .  '            |                                        |
|                            |   Valyrio Ēngos · Français · English   |
+---------------------------------------------------------------------+
```

- **Hiérarchie.** 1. le sceau ; 2. la salutation ; 3. la réponse, seul bouton ; 4. la langue, en retrait.
- **(1) Sceau.** Les quatorze flammes sont la jauge de chargement (cahier artistique 6.2). Un clic sur le sceau vaut réponse.
- **(2) Salutation.** Elle reste en valyrien dans les trois langues ; seule sa glose change. Graphie du lexique (avec macron) ; le choix entre *morghūlis* et *morghulis* revient à l'orchestrateur.
- **(3) Réponse.** Bouton réel, présent et actif dès le début de la séquence. Sa glose ajoute le mot « entrer » : sans lui, rien ne dit que cette formule est une porte. Nom accessible : « Valar dohaeris — entrer dans la bibliothèque ». L'activer pendant l'animation entre sans attendre.
- **(4) Langue.** Noms entiers, chacun balisé dans sa langue. Le nom valyrien est *Valyrio Ēngos* (`nav.language`), composition de la bibliothèque : le lexique n'a pas de nom plus court pour la langue, et « Valyrio » seul voudrait dire « de Valyria ». **Demande à l'agent 04** : confirmer ce libellé pour le sélecteur. Choisir une langue ne fait pas entrer : cela change les deux gloses. Séparé de la réponse d'au moins 24 px ; sur mobile, dans le bas de l'écran, à portée de pouce, au-dessus de la zone sûre.
- **Comportement.** Rituel complet à la première visite seulement (UX 10.2). Visites suivantes et arrivées profondes : version brève, sans cet écran. Arrière-plan `inert`. Ordre de focus : réponse, puis les trois langues. À l'entrée, le focus va au titre du portail.
- **Chargement lent.** Après 8 secondes, une ligne dans la langue de lecture paraît sous la réponse : « La bibliothèque s'ouvre lentement. Entrer sans attendre > ». Le seuil ne retient personne.
- **Mouvement réduit.** Sceau complet d'emblée, aucune boucle.
- **Langue.** En français ou en anglais, l'écran est identique à la langue des gloses près. C'est voulu : le seuil est le seul écran qui ne change presque pas.
- **Variantes.** Le passage après la réponse diffère (page qui se lève, fil qui descend, amande traversée). Je recommande la même porte dans les trois versions ; le cahier artistique prévoit l'entrée automatique en V1 (désaccord exposé en UX 10.2).

---

## W02 — Portail

### Bureau

```text
+--------------------------------------------------------------------------------------------------+
| {S}                                    Iderenna     {c} Korjās      HV · FR · EN     Nūmāzma [x] |
|                                        *index*          *chercher*  ==               *sens*      |
+--------------------------------------------------------------------------------------------------+
|                                         |                                                        |
|            .  '  '  .                   |  VESTRIARJA  *Chroniques*                          (3) |
|          '  .----.  '                   |  ======================================================|
|          '  / (|) \  '                  |  I     Valyria Uēpa  . . . . . . . . .  … – 102 av. C. |
|          '  '----'  '                   |        *L'ancienne Valyria*                            |
|            '  .  .  '                   |  II    Lentro Prānon . . . . . . . . .  114 – 2 av. C. |
|                                         |        *Les origines de la Maison*                     |
|   T A R G Ā R I O                       |  III   Āego Ērinnon  . . . . . . . . . 2 av. C. – 2 AC |
|   L E N T R O                    (1)    |        *La Conquête*                                   |
|   V E S T R I A R J A                   |  IV    Ēlī Dāryssy . . . . . . . . . . . .  1 – 129 AC |
|   *Les Chroniques de la Maison          |        *Les premiers rois*                             |
|    Targaryen*                           |  V     Zaldrīzoti Lilion . . . . . . . .  105 – 153 AC |
|   ----------<>----------                |        *La Danse des Dragons*                          |
|   Kesīr Targārio Lentro vestriarzir     |  VI    Lilio Toliot  . . . . . . . . . .  131 – 262 AC |
|   ilza. Dāryssy se zaldrīzesse kesīr    |        *Après la Danse*                                |
|   ilzi. Umbās, se gūrēñās.       (2)    |  VII   Lentro Mōris  . . . . . . . . . .  262 – 298 AC |
|   *Ici se trouve l'histoire de la       |        *La chute*                                      |
|    Maison Targaryen. Des rois et des    |  VIII  Irūdion . . . . . . . . . . . . .  298 – 300 AC |
|    dragons sont ici. Reste, et          |        *L'héritage*                                    |
|    apprends.*                           |  ------------------------<>------------------------    |
|   COMPOSITION DE LA BIBLIOTHÈQUE        |                                                    (4) |
|                                         |  Zaldrīzo Ānogar *La lignée*  Valyrio Ēngos *La langue*|
|   {c} [ Korjās                     ]    |  Issarossa *Personnages*      Tembyri *Sources*        |
|       *un nom, un lieu, une année* (5)  |  Zaldrīzesse *Dragons*        Gūrēñagon *Apprendre*    |
|                                         |  Vīlībāzmi *Guerres*          Keso jāelio bē *À propos*|
|                                         |  Ālia *Lieux*                                          |
+-----------------------------------------+--------------------------------------------------------+
|  Perzys Ānogār *Feu et Sang*     Mots valyriens de cette page (31) >     Colophon >   Versions > |
+--------------------------------------------------------------------------------------------------+
```

### Mobile

```text
+--------------------------------------+
| {S} Iderenna  {c} Korjās  [HV]·FR·EN |
|     *index*       *chercher*         |
+--------------------------------------+
|           TARGĀRIO LENTRO            |
|              VESTRIARJA              |
|        *Les Chroniques de la*        |
|          *Maison Targaryen*          |
|                                      |
| {c} [ Korjās                        ]|
|     *un nom, un lieu, une année*     |
|                                      |
| VESTRIARJA  *Chroniques*             |
| ==================================== |
| I    Valyria Uēpa      … – 102 av. C.|
|      *L'ancienne Valyria*          > |
| II   Lentro Prānon     114 – 2 av. C.|
|      *Les origines de la Maison*   > |
| III  Āego Ērinnon     2 av. C. – 2 AC|
|      *La Conquête*                 > |
| IV   Ēlī Dāryssy           1 – 129 AC|
|      *Les premiers rois*           > |
| V    Zaldrīzoti Lilion   105 – 153 AC|
|      *La Danse des Dragons*        > |
| VI   Lilio Toliot        131 – 262 AC|
|      *Après la Danse*              > |
| VII  Lentro Mōris        262 – 298 AC|
|      *La chute*                    > |
| VIII Irūdion             298 – 300 AC|
|      *L'héritage*                  > |
| ----------------<>------------------ |
| Zaldrīzo Ānogar  *La lignée*       > |
| Issarossa  *Personnages*           > |
| Zaldrīzesse  *Dragons*             > |
| Vīlībāzmi  *Guerres*               > |
| Ālia  *Lieux*                      > |
| Valyrio Ēngos  *La langue*         > |
| Tembyri  *Sources*                 > |
| Gūrēñagon  *Apprendre*             > |
| Keso jāelio bē  *À propos*         > |
+--------------------------------------+
| Kesīr Targārio Lentro vestriarzir    |
| ilza. (…)  *Ici se trouve l'histoire |
| de la Maison Targaryen. (…)*         |
+--------------------------------------+
```

- **Hiérarchie.** 1. le titre ; 2. la table des huit volumes ; 3. les neuf registres ; 4. la recherche ; 5. l'incipit. Sur mobile, la recherche remonte en deuxième position et l'incipit descend en pied : à 360 px, ce qui sert à agir passe avant ce qui sert à s'imprégner.
- **(1) Titre.** `title.site`, trois lignes de capitales, glose dessous. C'est le titre de niveau 1 de la page.
- **(2) Incipit.** `text.portal_intro`, seul texte valyrien de plusieurs phrases du lexique. Glose en regard. La mention « composition de la bibliothèque » est permanente : ces phrases ressemblent à une citation et n'en sont pas une (UX 5.6). Toucher l'incipit ouvre la glose mot à mot.
- **(3) Table des volumes.** Une vraie table des matières (cahier artistique, décision 2) : chiffre romain, titre, points de conduite, bornes. Chaque entrée est un seul lien de deux lignes, 56 px de haut. Les bornes sont celles de `timeline.json` (agent 02). Les périodes IV, V et VI **se chevauchent à dessein** : la Danse part des origines de la querelle (105) et va jusqu'à la mort du dernier dragon (153). La table l'affiche tel quel ; elle ne doit pas laisser croire à huit tranches jointives.
- **Gloses et titres français.** Les gloses sont les traductions du lexique (agent 04). Les titres français de la chronologie (agent 02) diffèrent pour quatre volumes : I « La civilisation valyrienne », IV « Les premiers règnes », VI « Les générations suivantes », VII « La fin de la dynastie ». Tant que ce n'est pas harmonisé, le mode valyrien et le mode français ne donnent pas le même sens au même volume. À trancher par l'agent 05 : soit le titre français suit le valyrien, soit le valyrien est recomposé.
- **(4) Registres.** Les huit autres espaces et la page « À propos ». Ils sont **sur** le portail, pas derrière l'Index : sans eux, huit espaces sur dix ne s'atteindraient que par l'Index, et leurs fiches passeraient à quatre interactions dès qu'un saut dans une liste est nécessaire (UX 3.3). C'est un ajout par rapport à l'accueil de V1 décrit au cahier artistique.
- **(5) Recherche.** Un champ visible, avec sa forme de champ. Ni la chandelle ni le mot *Korjās* ne sont reconnaissables par un nouveau venu : c'est la forme du champ et sa glose qui disent « on écrit ici ».
- **Comportement.** Dix-neuf destinations plus la recherche : toute fiche est à trois interactions au plus. Sur mobile, les dix-sept lignes de table font environ 1 000 px, soit un écran et demi sous le titre.
- **Langue.** En français : « Les Chroniques de la Maison Targaryen » devient le titre ; *Targārio Lentro Vestriarja* passe dessous, en italique. Les entrées de la table sont en français, la forme valyrienne en italique à la suite pour les huit volumes seulement. L'incipit reste, traduction en premier.
- **Variantes.** V1 : double page, frontispice à gauche, table à droite, comme dessiné. V2 : le fil part de la flamme du sceau ; la table des volumes devient la jauge des huit ères, **nommées** ; les registres sont une table sobre sous le premier nœud. V3 : le codex ouvert occupe sept colonnes et contient cette table ; la réglette en pied reprend les huit volumes.

---

À partir d'ici, la barre est dessinée sur une seule ligne, sans ses gloses. C'est celle de W00.

## W03 — Une période des Chroniques : annales et filtres

Exemple : période V, la Danse des Dragons. Adresse : `chronicles/dance-of-the-dragons.html`. Titres, dates, lieux et comptes viennent de `timeline.json`.

### Bureau

```text
+--------------------------------------------------------------------------------------------------+
| {S}                                      Iderenna    {c} Korjās    [HV] · FR · EN    Nūmāzma [x] |
+--------------------------------------------------------------------------------------------------+
| Vestriarja *Chroniques*  >  V                  < IV  Ēlī Dāryssy        VI  Lilio Toliot >   (1) |
|                                                                                                  |
|                                                V                                                 |
|                                Z A L D R Ī Z O T I   L I L I O N                             (2) |
|                                      *La Danse des Dragons*                                      |
|                             105 – 153 AC   ·   la guerre : 129 – 131                             |
|                                                                                                  |
|  TEXTE EN FRANÇAIS · pourquoi ? >                                                            (3) |
|  Viserys Ier désigne sa fille Rhaenyra pour héritière, puis se remarie et a des fils. À sa mort  |
|  en 129, le conseil couronne Aegon II ; Rhaenyra se fait couronner à Peyredragon. Deux ans de    |
|  guerre opposent les « verts » aux « noirs », dragons contre dragons. Les deux prétendants y     |
|  meurent, avec la plupart des princes et presque tous les dragons de la Maison. ~~~~~~~      (4) |
|                                                                                                  |
|  Camps et batailles >            Parcours : la Danse en sept étapes >                            |
+--------------------------------------------------------------------------------------------------+
|  [ En bref ]   [ Annales · 26 ]   [ Figures · 53 ]   [ Guerres · 1 ]   [ Adaptation · 3 ]    (5) |
|                ================                                                                  |
+------------------------+-------------------------------------------------------------------------+
| FILTRER            (6) | 26 événements     105 · 111 · 114 · 120 · [129] · 130 · 131 · 153   (7) |
|                        | ======================================================================= |
| Fiabilité              | JĒDA *année*  105 – 120                                                 |
| [ ] établi          18 |   105      Rhaenyra désignée héritière     Dāro Vilinion *Port-Réal*  > |
| [ ] récits             |   106–114  Le remariage du roi             Dāro Vilinion *Port-Réal*  > |
|     contradictoires  8 |   111      Les verts et les noirs          Dāro Vilinion *Port-Réal*  > |
|                        |   114      Rhaenyra épouse Laenor Velaryon    récits contradictoires  > |
| Personne               |   120      L'année du Printemps rouge         récits contradictoires  > |
| [ toutes          v ]  | ----------------------------------------------------------------------- |
|                        | JĒDA *année*  129                                                       |
| Lieu                   |   Mort de Viserys Ier et conseil vert         récits contradictoires  > |
| [ tous            v ]  |   Deux couronnements                                     Fossedragon  > |
|                        |   Mort de Lucerys à Accalmie                                Accalmie  > |
| Dragon                 |   Sang et Fromage                                       Donjon Rouge  > |
| [ tous            v ]  |   Daemon prend Harrenhal                                   Harrenhal  > |
|                        |   Rook's Rest (Repos-des-Freux)                      Repos-des-Freux  > |
| [ ] date contestée   1 |   Les Semailles                           Zaldrīzdōron *Peyredragon*  > |
|                        | ----------------------------------------------------------------------- |
| Tout retirer           | JĒDA *année*  130                                         10 événements |
|                        |   La bataille du Gosier                       récits contradictoires  > |
|                        |   ~~~~ (9 autres)                                                       |
|                        | ----------------------------------------------------------------------- |
|                        | JĒDA *année*  131 – 153                                    4 événements |
|                        |   ~~~~                                                                  |
|                        | ======================================================================= |
+--------------------------------------------------------------------------------------------------+
|  < IV  Ēlī Dāryssy *Les premiers rois*                       VI  Lilio Toliot *Après la Danse* > |
+--------------------------------------------------------------------------------------------------+
```

### Mobile

```text
+--------------------------------------+
| {S} Iderenna  {c} Korjās  [HV]·FR·EN |
+--------------------------------------+
| Vestriarja *Chroniques* >            |
|                                      |
|                  V                   |
|          ZALDRĪZOTI LILION           |
|        *La Danse des Dragons*        |
|             105 – 153 AC             |
|                                      |
| TEXTE EN FRANÇAIS · pourquoi ? >     |
| Viserys Ier désigne sa fille         |
| Rhaenyra pour héritière, puis se     |
| remarie et a des fils. À sa mort en  |
| 129, le conseil couronne ~~~~~~~~~~  |
| Lire la suite v                      |
| Camps et batailles >                 |
| Parcours : la Danse en 7 étapes >    |
+--------------------------------------+
| [ En bref    ]  [ Annales · 26 ]     |
|                 ================     |
| [ Figures·53 ]  [ Guerres · 1  ]     |
| [ Adaptation · 3 ]                   |
+--------------------------------------+
| [ Filtrer ]            26 événements |
| 105 · 111 · 114 · 120 · [129] · 130 ~|
| ==================================== |
| JĒDA *année*  129                (8) |
| Mort de Viserys Ier et conseil vert  |
| récits contradictoires             > |
| ------------------------------------ |
| Deux couronnements                 > |
| Fossedragon                          |
| ------------------------------------ |
| Mort de Lucerys à Accalmie         > |
| Accalmie                             |
| ------------------------------------ |
| ~~~~ (4 autres en 129) ~~~~          |
+--------------------------------------+
| < IV Ēlī Dāryssy   VI Lilio Toliot > |
+--------------------------------------+
```

- **Hiérarchie.** 1. le titre du volume ; 2. le bloc « En bref », qui répond à « de quoi s'agit-il ? » avant toute liste ; 3. les onglets ; 4. les annales ; 5. les filtres, qui servent les annales et restent en retrait.
- **(1)** Titre courant à gauche, volume précédent et suivant à droite. Rappelés en pied.
- **(2) Titre.** Forme valyrienne du lexique (`period.5`), glosée. Sous le titre, les bornes de la période **et** celles de la guerre : la période va de 105 à 153, la guerre de 129 à 131, et le visiteur qui cherche « la Danse » pense à la guerre.
- **(3) Mention d'édition.** Dit que le texte qui suit n'existe pas en valyrien et mène à la note sur la langue (UX 5.5). Une fois par document.
- **(4) En bref.** C'est le champ `summaryFr` de l'agent 02 : 120 mots, la limite que je fixais. Il doit tenir dans le premier écran à 1 280 × 720 (critère C1.2) ; sur mobile, les quatre premières lignes puis « lire la suite ». Pas d'incipit valyrien : aucun n'est validé pour cette période.
- **(5) Onglets.** Le compte est écrit. Les trois écarts propres aux séries ont **leur onglet** : ils ne paraissent jamais dans les annales (consigne de l'agent 02, et UX 4.3). Les libellés sont en français bien que *Vīlībāzmi* existe : un groupe de contrôles ne mélange pas les langues (UX 5.4). **Demande à l'agent 04.**
- **(6) Filtres.** Ceux que les données permettent aujourd'hui : fiabilité du fait, personne, lieu, dragon, date contestée. Effet immédiat ; compte par valeur ; une valeur à zéro est désactivée. « Personne », « Lieu » et « Dragon » sont des listes à saisie filtrante (53 personnes sont citées dans cette période). **Le filtre par type d'événement (bataille, mort, couronnement…) manque** : `timeline.json` n'a pas ce champ. Demande à l'agent 02.
- **(7) Rail d'années.** Liens d'ancre vers les groupes. Avec dix événements, l'an 130 est le groupe le plus long ; aucun ne dépasse trente.
- **Annales.** Une ligne par événement, groupée par année, l'année en rubrique. Une ligne est un seul lien. À droite : le premier lieu, ou, quand le fait n'est pas « établi », son niveau de fiabilité en toutes lettres. Les lieux qui ont une forme valyrienne la portent, avec leur nom français en glose. L'ordre est chronologique et ne se change pas.
- **(8) Mobile.** L'en-tête d'année reste collé en haut pendant le défilement de son groupe. Une ligne fait deux niveaux. « Filtrer » ouvre un feuillet plein écran, qui se ferme par « Voir N événements ».
- **Comportement.** Filtres et onglet actif sont écrits dans l'adresse (`?tab=annals&reliability=contradictoire`). Aucun résultat : voir UX 6.5.
- **Langue.** En français : titre « La Danse des Dragons », *Zaldrīzoti Lilion* dessous en italique ; la mention d'édition disparaît ; « Jēda » devient « Année » ; les lieux s'écrivent Port-Réal, Peyredragon.
- **Variantes.** V1 : annales en table sur parchemin, année en marge, comme dessiné. V2 : les événements s'attachent à la rangée de génération concernée ; cette table reste la vue « liste », offerte par un bouton en tête. V3 : la réglette est calée sur 105–153, les annales sont dans un folio, un événement choisi se pose en second document.

---

## W04 — Fiche d'événement

Exemple : mort de Lucerys à Accalmie. Adresse : `events/p5-accalmie.html` (identifiant de `timeline.json`). Texte, lieux, fiabilité et sources viennent de ce fichier.

### Bureau

```text
+--------------------------------------------------------------------------------------------------+
| {S}                                      Iderenna    {c} Korjās    [HV] · FR · EN    Nūmāzma [x] |
+--------------------------------------------------------------------------------------------------+
| Vestriarja *Chroniques*  >  V · Zaldrīzoti Lilion *La Danse des Dragons*  >                      |
+-------------------------------------------------------------------+------------------------------+
| Jēda *année*  129 AC                                          (1) |  GLOSES DE MARGE         (5) |
| Ālion *lieu*  Accalmie >   ·   baie des Naufrageurs               |                              |
| Vīlībāzma *guerre*  Zaldrīzoti Lilion >                           |                              |
|                                                                   |                              |
| M O R T   D E   L U C E R Y S   À   A C C A L M I E           (2) |                              |
| ================================================================  |                              |
| ( cire )  ÉTABLI                                              (6) |                              |
| L'issue est établie ; les détails de la poursuite varient         |                              |
| selon les récits.                                                 |                              |
|                                                                   |                              |
| TEXTE EN FRANÇAIS · pourquoi ? >                                  |  ¹ Fire & Blood              |
| Envoyé en messager auprès de Borros Baratheon, le jeune Lucerys   |    LIVRE · chronique fictive |
| y trouve Aemond, arrivé avant lui. Au départ, sous l'orage,       |    « The Dying of the        |
| Vhagar rattrape le petit Arrax au-dessus de la baie des           |    Dragons — A Son for a     |
| Naufrageurs et le tue. Les restes du dragon s'échouent trois      |    Son »                     |
| jours plus tard ; le corps du prince n'est pas retrouvé.¹ ²       |    Voir la source >          |
|                                                                   |                              |
| QUI                                                           (3) |  ² The Princess and the      |
| Lucerys Velaryon >    ·    Aemond >    ·    Borros Baratheon      |    Queen                     |
| Zaldrīzesse *dragons*   Arrax >  ·  Vagar >                       |    NOUVELLE · chronique      |
|                                                                   |    fictive                   |
| CONSÉQUENCE                                                   (4) |    Voir la source >          |
| Le premier sang princier est versé : la guerre des corbeaux       |                              |
| devient une guerre de feu.                                        |                              |
| Avant :   < Deux couronnements                                    |                              |
| Ensuite :   Sang et Fromage >                                     |                              |
|                                                                   |                              |
| SOURCES DE CETTE FICHE                                        (7) |                              |
| Livres : Fire & Blood >   ·   The Princess and the Queen >        |                              |
+-------------------------------------------------------------------+------------------------------+
|  < Gōnka *précédent*  Deux couronnements               Sang et Fromage  Hembār *suivant* >   (8) |
|  Suite : annales de la Danse des Dragons                                                         |
+--------------------------------------------------------------------------------------------------+
```

**Le bloc « adaptation »**, tel qu'il paraît sur une fiche qui en a un. Exemple tiré de `timeline.json` (`tv-p5-laenor`), sur la fiche « L'année du Printemps rouge ».

```text
+--------------------------------------------------------------------------------------------------+
|  DANS L'ADAPTATION TÉLÉVISÉE                                                                 (9) |
+--------------------------------------------------------------------------------------------------+
|  Dans House of the Dragon, la mort de Laenor est une mise en scène : il quitte Westeros vivant,  |
|  avec la complicité de Rhaenyra et de Daemon. Dans la chronique, il est bel et bien tué à        |
|  Lamarck.³                                                                                       |
|                ³ House of the Dragon  ·  ADAPTATION  ·  saison 1, épisode 7  ·  Voir la source > |
+--------------------------------------------------------------------------------------------------+
```

### Mobile

```text
+--------------------------------------+
| {S} Iderenna  {c} Korjās  [HV]·FR·EN |
+--------------------------------------+
| Vestriarja > V · Zaldrīzoti Lilion > |
|                                      |
| Jēda *année*  129 AC                 |
| Ālion *lieu*  Accalmie >             |
| Vīlībāzma *guerre*                   |
|   Zaldrīzoti Lilion >                |
|                                      |
|           MORT DE LUCERYS            |
|              À ACCALMIE              |
| ==================================== |
| ( cire )  ÉTABLI                     |
| L'issue est établie ; les détails    |
| de la poursuite varient selon les    |
| récits.                              |
|                                      |
| TEXTE EN FRANÇAIS · pourquoi ? >     |
| Envoyé en messager auprès de Borros  |
| Baratheon, le jeune Lucerys y trouve |
| Aemond, arrivé avant lui. ~~~~~~~~~  |
| ~~~~~~~~~~~~~~~~~~~~~~~~~~~ [¹] [²]  |
+--------------------------------------+
| QUI                                  |
| Lucerys Velaryon                   > |
| Aemond                             > |
| Borros Baratheon                     |
| Zaldrīzesse *dragons*                |
| Arrax                              > |
| Vagar                              > |
+--------------------------------------+
| CONSÉQUENCE                          |
| Le premier sang princier est versé : |
| la guerre des corbeaux devient une   |
| guerre de feu.                       |
| Avant : Deux couronnements         > |
| Ensuite : Sang et Fromage          > |
+--------------------------------------+
| SOURCES DE CETTE FICHE               |
| Fire & Blood                       > |
| The Princess and the Queen         > |
+--------------------------------------+
| [ < Gōnka ]   annales   [ Hembār > ] |
+--------------------------------------+
```

```text
+--------------------------------------+
|       SOURCE ¹  (feuillet bas)       |
+--------------------------------------+
| Fire & Blood                         |
| LIVRE · chronique fictive            |
| « The Dying of the Dragons — A Son   |
| for a Son »                          |
|                                      |
| Voir la source >           [ Bēmās ] |
+--------------------------------------+
```

- **Hiérarchie.** 1. quand, où, dans quelle guerre (trois lignes de rubriques) ; 2. le titre ; 3. le niveau de fiabilité du fait ; 4. le récit ; 5. qui ; 6. la conséquence et les liens vers l'avant et l'après ; 7. les sources.
- **(1) Tête.** Année, lieux, guerre. Le type d'événement (bataille, mort…) y figurerait en premier s'il existait dans les données ; il n'y est pas (voir W03).
- **(2) Titre.** En français : aucun titre valyrien n'est validé pour cet événement. Pas de glose, pas de repli.
- **(3) Qui.** Une personne sans fiche (ici Borros Baratheon, extérieur à la Maison) est écrite sans lien : on ne promet pas une page qui n'existe pas. Aujourd'hui `timeline.json` donne des **noms**, pas des identifiants : les liens ne peuvent pas être engendrés. Demande aux agents 02 et 11. Un rôle par personne (« messager de Rhaenyra ») serait utile et manque aussi.
- **(4) Conséquence.** Le texte est le champ `consequenceFr` de l'agent 02. Les deux liens « avant » et « ensuite » sont ce que je demande **en plus** : des renvois vers d'autres événements, pour que « comprendre les conséquences » soit aussi une navigation. Sans eux, ce bloc reste lisible ; il n'est simplement pas cliquable.
- **(5) Gloses de marge.** Sur bureau, la source est en regard du texte, toujours visible : titre, nature (livre, nouvelle, série), type de témoignage (récit direct, chronique fictive), passage. Ce sont les champs de `sources.json`. Sur mobile, il n'y a pas de marge : l'appel `[¹]`, étendu à 44 px, ouvre un feuillet bas.
- **(6) Fiabilité.** Un des cinq niveaux de l'agent 02 (établi, récit unique, récits contradictoires, tradition ou légende, propre à une adaptation), en toutes lettres, avec le sceau de cire prévu par le cahier artistique, suivi de la note de fiabilité quand il y en a une. Pour « récits contradictoires », un bloc titré « Versions » expose chaque récit avec sa source.
- **(7) Sources de cette fiche.** Liste complète, groupée par nature, sur tous les écrans. Elle double les gloses de marge : c'est elle que lit un lecteur d'écran, et elle que l'on imprime.
- **(8) Série.** Précédent et suivant dans les annales de la période. Si l'on vient de la fiche de la guerre, la série devient « batailles de la Danse » et la ligne du dessous le dit.
- **(9) Adaptation.** Bloc séparé et titré, placé après le récit. Rien de ce qui vient d'une série n'entre dans le récit principal (UX 4.3). Les données en comptent huit pour tout le fonds ; aucune ne concerne la mort de Lucerys, et la fiche dessinée n'a donc pas ce bloc.
- **Deux graphies sur un même écran.** Le champ « dragons » écrit *Vagar* (voix valyrienne) et le récit écrit « Vhagar » (voix de lecture, graphie de Martin). C'est la règle des deux voix appliquée telle quelle. Risque de trouble ; la glose du champ (« Vagar · *Vhagar* ») le lève. À observer en test.
- **Langue.** En français : les rubriques deviennent « Année », « Lieu », « Guerre », « Dragons », « Précédent », « Suivant » ; la mention d'édition disparaît.
- **Variantes.** V2 : la fiche est une stèle ouverte à côté du nœud (`?open=`), 120 mots au plus, avec « lire la chronique » vers cette page. V3 : feuillet posé à droite des annales.

---

## W05 — Arbre généalogique, avec panneau de personne

Exemple : Rhaenyra au centre. Adresse : `genealogy/index.html?focus=rhaenyra`. Vue dessinée : la **focale**, commune aux trois versions. Personnes, dates, unions et degrés de certitude viennent de `genealogy.json`.

### Bureau

```text
+--------------------------------------------------------------------------------------------------+
| {S}                                      Iderenna    {c} Korjās    [HV] · FR · EN    Nūmāzma [x] |
+--------------------------------------------------------------------------------------------------+
| Zaldrīzo Ānogar *La lignée*                  Vue :  (o) focale   ( ) planche   ( ) liste     (1) |
+----------------------------------------------------------------+---------------------------------+
| {c} [ chercher une personne          ]                     (2) |  R H A E N Y R A            (6) |
| Fil principal : [ < ] Viserys I · RHAENYRA · Viserys II [ > ]  |  ===========================    |
|                                                                |  Prétendante au trône,          |
| PARENTS                                                    (3) |  « Rhaenyra Ire », 129 – 130.   |
|   Kepa *père*                    Muña *mère*                   |                                 |
|   [ Viserys I · 77–129 ] ======= [ Aemma Arryn · 82–105 ]      |  Sitta *née*  97                |
|                          |                                     |  Morghūltas *morte*  130        |
| FRATRIE                  |                                 (4) |  Lentor *maison*  Targārien     |
|   [ Baelon · 105 ]       |                                     |  Zaldrīzes *dragon*  Syraks >   |
|   Second lit de son père (Alicent Hightower) :  [ + 4 ]        |                                 |
|                          |                                     |  [ Drāmmās *ouvrir la fiche* > ]|
|              +-----------------------+                         |                                 |
|              |  R H A E N Y R A      |                         |  ---------------------------    |
|              |  97 – 130             |                         |  2 mariages, 1 liaison rapportée|
|              +-----------------------+                         |  6 enfants                      |
|                   |               |                            |  5 frères et sœurs              |
| UNIONS ET ENFANTS |               |                        (5) |                                 |
|   Mariage · 114                  Mariage · 120                 |  Copier le lien de cette vue    |
|   Belmor *époux*                 Belmor *époux*                |                                 |
|   [ Laenor Velaryon · 94–120 ]   [ Daemon · 81–130 ]           |                                 |
|                                  oncle et époux                |                                 |
|   Riñar *enfants*                Riñar *enfants*               |                                 |
|   [ Jacaerys · 114–130 ]  (c)    [ Aegon III · 120–157 ]       |                                 |
|   [ Lucerys · 115–129 ]   (c)    [ Viserys II · 122–172 ]      |                                 |
|   [ Joffrey · 117–130 ]   (c)    [ Visenya · 129 ]             |                                 |
|   (c) filiation contestée : lire la note >                 (7) |                                 |
|                                                                |                                 |
|   Liaison rapportée, non établie : Harwin Strong   [ afficher ]|                                 |
+--------------------------------------------------------------------------------------------------+
```

### Mobile

```text
+--------------------------------------+
| {S} Iderenna  {c} Korjās  [HV]·FR·EN |
+--------------------------------------+
| Zaldrīzo Ānogar *La lignée*          |
| {c} [ chercher une personne        ] |
| (o) focale   ( ) liste   planche >   |
+--------------------------------------+
| PARENTS                              |
| Kepa *père*                          |
| [ Viserys I · 77–129             > ] |
| Muña *mère*                          |
| [ Aemma Arryn · 82–105           > ] |
| ==================================== |
|           R H A E N Y R A            |
|               97 – 130               |
| Sitta *née*  97                      |
| Morghūltas *morte*  130              |
| Zaldrīzes *dragon*  Syraks >         |
| [ Drāmmās *ouvrir la fiche*      > ] |
| ==================================== |
| FRATRIE                              |
| [ Baelon · 105                   > ] |
| [ + 4, par Alicent Hightower     v ] |
+--------------------------------------+
| MARIAGE · 114                        |
| Belmor *époux*                       |
| [ Laenor Velaryon · 94–120       > ] |
| Riñar *enfants* · filiation contestée|
| [ Jacaerys · 114–130             > ] |
| [ Lucerys · 115–129              > ] |
| [ Joffrey · 117–130              > ] |
| Lire la note >                       |
+--------------------------------------+
| MARIAGE · 120                        |
| Belmor *époux* · oncle et époux      |
| [ Daemon · 81–130                > ] |
| Riñar *enfants*                      |
| [ Aegon III · 120–157            > ] |
| [ Viserys II · 122–172           > ] |
| [ Visenya · 129                  > ] |
+--------------------------------------+
| [ + 1 liaison rapportée          v ] |
+--------------------------------------+
```

- **Hiérarchie.** 1. la personne au centre ; 2. ses parents au-dessus ; 3. ses unions et ses enfants au-dessous, **un groupe par union** ; 4. sa fratrie ; 5. les contrôles.
- **(1) Trois vues.** *Focale* : par défaut partout. *Planche* : vue d'ensemble dessinée, à déplacer et agrandir (V1), ou fil de filiation (V2) ; sur mobile elle s'ouvre en plein écran par un lien, elle n'est jamais logée dans la page. *Liste* : toutes les générations en liste imbriquée, pour imprimer ou parcourir d'un trait.
- **(2) Recherche et fil principal.** La recherche recentre l'arbre sur la personne choisie. Les deux flèches montent et descendent le long du **fil principal** de l'agent 03 (`mainThread` : vingt personnes d'Aenar à Daenerys, chacune enfant de la précédente). Rhaenyra y est entre Viserys Ier et Viserys II. Pour une personne hors du fil, les flèches mènent à son parent et à son premier enfant.
- **(3) Parents.** Deux, nommés par leur rubrique. Parent inconnu : la case est hachurée et dit « non documenté ».
- **(4) Fratrie.** Dans l'ordre des naissances quand les années sont connues. Les demi-frères et demi-sœurs sont repliés sous une ligne qui dit de quel lit ils viennent. Les rubriques « frère » et « sœur » ne sont pas employées : en valyrien elles dépendent de l'âge relatif (rapport de l'agent 04), et 44 personnes du graphe n'ont aucune année.
- **(5) Unions et enfants.** C'est la réponse aux unions multiples : chaque union a sa nature (mariage, liaison), sa date, son conjoint et **ses** enfants. C'est exactement la structure de `genealogy.json` (unions comme objets, filiation rattachée à une union). Une parenté double est écrite en mots sous le nom (« oncle et époux », « sœur et épouse »), jamais suggérée par un trait de plus.
- **(6) Panneau.** Décrit toujours la personne au centre. Un seul modèle sur tous les écrans : **toucher une personne la met au centre** ; « ouvrir la fiche » quitte l'arbre. Rhaenyra n'est pas « reine » dans les données : elle est prétendante, et le panneau le dit dans ces termes.
- **(7) Trois degrés de certitude.** Ceux de l'agent 03, toujours en mots. *Établi* : rien de particulier. *Contesté* : une marque sur chaque enfant concerné et une note qui nomme le père allégué et dit qui conteste. *Incertain* (une liaison connue par la seule rumeur) : repliée par défaut, jamais dessinée au même rang qu'un mariage, ouverte par un geste explicite. Huit filiations et deux unions du graphe sont contestées ou incertaines.
- **Comportement.** Chaque recentrage ajoute une entrée d'historique : Retour revient au centre précédent. Le focus va au nom central, annoncé (« Rhaenyra au centre »). Chaque case est un lien dont le nom accessible dit nom, relation, certitude et dates : « Jacaerys, fils, mariage de 114, filiation contestée, 114 à 130 ».
- **Mobile.** Les traits disparaissent, les titres font le travail. Les parents sont au-dessus de la personne, comme dans l'arbre. Chaque case fait 48 px de haut. Aucun défilement horizontal. La plus grande fratrie du graphe compte treize enfants : treize lignes de 48 px, un écran, sans rien replier.
- **Paysage (640 × 360).** Trois colonnes : parents et fratrie, personne, unions.
- **Langue.** En français : « Père », « Mère », « Époux », « Enfants », « Née », « Morte », « Ouvrir la fiche ».
- **Ce qui manque encore aux données (agent 03).** Un libellé court de désambiguïsation par personne (il est aujourd'hui dans l'identifiant et entre parenthèses dans certains noms) ; les parentés doubles calculées ; l'ordre de naissance explicite quand les années manquent.
- **Variantes.** V1 : la planche gravée est l'attraction, la focale est son double. V2 : le fil de filiation tient lieu de planche ; chaque maillon ouvre cette focale. V3 : la focale est la vue principale, le reste est replié dans le ruban.

---

## W06 — Fiche de personnage

Exemple : Aegon Ier. Adresse : `people/aegon-i.html` (identifiant de `genealogy.json`). Dates et parentés viennent de ce fichier ; les événements, de `timeline.json`.

### Bureau

```text
+--------------------------------------------------------------------------------------------------+
| {S}                                      Iderenna    {c} Korjās    [HV] · FR · EN    Nūmāzma [x] |
+--------------------------------------------------------------------------------------------------+
| Issarossa *Personnages*  >  III · Āego Ērinnon *La Conquête*  >                                  |
+--------------------------------------------------------------------------------------------------+
|  DĀRYS *roi*                                                                                 (1) |
|  Ā E G O N   I                                                                                   |
|  *Aegon Ier, dit le Conquérant*                                                                  |
+--------------------------------------------------------------------------------------------------+
|  27 av. C.  |·······[=============  Jemēbagon *règne*  1 – 37  =============]|  37 AC        (2) |
|             naissance                                                       mort                 |
+--------------------------------------------------------------------------------------------------+
| Sitta *né*           | 27 av. C.  ·  Zaldrīzdōron *Peyredragon* >                            (3) |
| Morghūltas *mort*    | 37 AC  ·  Zaldrīzdōron *Peyredragon* >                                    |
| Jemēbagon *règne*    | 1 – 37 AC                                                                 |
| Lentor *maison*      | Targārien                                                                 |
| Kepa *père*          | Aerion Targaryen, fils de Daemion >                                       |
| Muña *mère*          | Valaena Velaryon >                                                        |
| Belmor *épouses*     | Visenia >  ·  Rhaenys >      toutes deux ses sœurs                    (4) |
| Riñar *enfants*      | Aenys I >  (de Rhaenys)  ·  Maegor I >  (de Visenia)                      |
| Zaldrīzes *dragon*   | Balerion >                                                                |
|  [ Voir dans la lignée > ]                                                                   (5) |
+--------------------------------------------------------------------------------------------------+
|  Vie  ·  Lignée  ·  Dragons  ·  Événements  ·  Sources                                       (6) |
+-------------------------------------------------------------------+------------------------------+
| VIE                                                               |                              |
| TEXTE EN FRANÇAIS · pourquoi ? >                                  |                              |
| Seigneur de Peyredragon, Aegon entreprend avec ses sœurs          |  ¹ Fire & Blood              |
| Visenya et Rhaenys la conquête des royaumes de Westeros. Il       |    LIVRE                     |
| est couronné à Villevieille et règne jusqu'à sa mort.¹            |    Voir la source >          |
| ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~    |                              |
|                                                                   |                              |
| ÉVÉNEMENTS                                                    (7) |                              |
| 2 av. C.        Le débarquement et le premier couronnement      > |                              |
| v. 2–1 av. C.   Le Champ de Feu                                 > |                              |
| 1 AC            Le sacre de Villevieille                        > |                              |
|                                                                   |                              |
| SOURCES DE CETTE FICHE                                            |                              |
| Livres : Fire & Blood >  ·  The World of Ice & Fire >             |                              |
+--------------------------------------------------------------------------------------------------+
|  Règne précédent : aucun, premier roi                   Aenys I   Hembār *règne suivant* >   (8) |
+--------------------------------------------------------------------------------------------------+
```

### Mobile

```text
+--------------------------------------+
| {S} Iderenna  {c} Korjās  [HV]·FR·EN |
+--------------------------------------+
| Issarossa > III · Āego Ērinnon >     |
|                                      |
| DĀRYS *roi*                          |
|            Ā E G O N   I             |
|    *Aegon Ier, dit le Conquérant*    |
+--------------------------------------+
| 27 av. C. |···[==== 1 – 37 ====]| 37 |
|           Jemēbagon *règne*          |
+--------------------------------------+
| Sitta *né*                           |
| 27 av. C. · Zaldrīzdōron           > |
| Morghūltas *mort*                    |
| 37 AC · Zaldrīzdōron               > |
| Kepa *père*                          |
| Aerion Targaryen                   > |
| Muña *mère*                          |
| Valaena Velaryon                   > |
| Belmor *épouses* · ses sœurs         |
| Visenia                            > |
| Rhaenys                            > |
| Riñar *enfants*                      |
| Aenys I · de Rhaenys               > |
| Maegor I · de Visenia              > |
| Zaldrīzes *dragon*                   |
| Balerion                           > |
| [ Voir dans la lignée            > ] |
+--------------------------------------+
| [ Vie v ] sommaire de la fiche       |
| TEXTE EN FRANÇAIS · pourquoi ? >     |
| Seigneur de Peyredragon, Aegon       |
| entreprend avec ses sœurs ~~~~~ [¹]  |
| ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~ |
+--------------------------------------+
```

- **Hiérarchie.** 1. le cartouche d'identité : titre, nom, nom d'usage ; 2. la ligne de vie ; 3. la table d'identité, où se trouvent les parents ; 4. le récit ; 5. les événements ; 6. les sources.
- **(1) Nom.** Graphie valyrienne du lexique (*Āegon*), avec le nom d'usage français en glose. Pour un nom sans forme validée (Aemond), la graphie de Martin est le titre et il n'y a pas de glose.
- **(2) Ligne de vie.** Naissance, règne, mort sur un trait à l'échelle (cahier artistique, décision 8). Elle tient lieu de portrait. Elle est doublée par la table qui suit : le dessin n'est pas la seule source de l'information. **Réserve mesurée sur les données :** sur 176 personnes, 70 seulement ont à la fois une année de naissance et une année de mort ; 57 n'ont ni l'une ni l'autre. La ligne de vie ne peut donc pas être la tête de *chaque* fiche. Trois états à dessiner : complète ; bornée (un intervalle hachuré, « née entre 26 et 25 av. C. ») ; absente (pas de trait, la mention « années non documentées », et la rangée de génération à la place).
- **(3) Table d'identité.** Rubriques valyriennes glosées à gauche, valeurs à droite. Les parents sont ici, dans le premier écran sur bureau et à moins d'un écran et demi sur mobile (critère C2.2). Le lieu porte sa forme valyrienne quand elle existe.
- **(4) Unions.** Deux épouses : deux liens, et la parenté double écrite en clair. Les enfants disent de quelle union ils viennent.
- **(5)** Ouvre l'arbre centré sur cette personne (W05).
- **(6) Sommaire.** Ancres vers les sections. Sur mobile : une liste déroulante collée sous la barre.
- **(7) Événements.** Table datée ; chaque ligne est un lien.
- **(8) Série.** Seuls les monarques ont un précédent et un suivant : le règne. Les autres personnes n'en ont pas (UX 3.2).
- **Rubriques au singulier.** *Belmor* et *Sitta* restent à leur forme de citation quel que soit le nombre ou le genre, comme le recommande l'agent 04 pour une étiquette isolée. La glose française, elle, s'accorde (« épouses », « né »).
- **Langue.** En français : « Aegon Ier » devient le titre, *Āegon* passe dessous en italique avec la mention « forme valyrienne, attestée » ; les rubriques sont en français.
- **Variantes.** V2 : stèle ; le cartouche et la table d'identité d'abord, « lire la chronique » ensuite. V3 : feuillet ; un second personnage peut être posé à côté (`?with=`), tables d'identité alignées ligne à ligne.

---

## W07 — Registre des dragons, et une fiche de dragon

Adresses : `dragons/index.html`, `dragons/vhagar.html`. Dragons, couleurs, dragonniers et dates viennent de `dragons.json`.

### Registre — bureau

```text
+--------------------------------------------------------------------------------------------------+
| {S}                                      Iderenna    {c} Korjās    [HV] · FR · EN    Nūmāzma [x] |
+--------------------------------------------------------------------------------------------------+
|                                      Z A L D R Ī Z E S S E                                   (1) |
|                                            *Dragons*                                             |
+--------------------------------------------------------------------------------------------------+
|  28 dragons        Période [ toutes v ]    Couleur [ toutes v ]    [ ] dragonnier connu      (2) |
|  Tri :  (o) par ancienneté   ( ) par nom                                                         |
+-----------+-----------------+---------------------------------------+---------------+------------+
| Nom       | Écailles        | Dragonniers                           | Éclosion–mort | Fin    (3) |
+-----------+-----------------+---------------------------------------+---------------+------------+
| Balerion >| ## noir         | Āegon I · Maegor I · Aerea · Viserys I| :::::: – 94   | vieillesse |
| Vagar >   | :: non décrite  | Visenia · Baelon · Laena V. · Aemond  | ~52 av. C.–130| au combat  |
| Merakses >| ## argent       | Rhaenys, sœur d'Aegon Ier             | :::::: – 10   | au combat  |
| Karakses >| ## rouge        | Aemon · Daemon                        | :::::: – 130  | au combat  |
| Syraks >  | ## jaune        | Rhaenyra                              | :::::: – 130  | 5 versions |
| Drogon >  | ## noir         | Daenerys                              | ~299 – …      | vivant     |
| ~~~~      | ~~~~            | ~~~~ (22 autres lignes)               | ~~~~          | ~~~~       |
+--------------------------------------------------------------------------------------------------+
```

### Registre — mobile

```text
+--------------------------------------+
| {S} Iderenna  {c} Korjās  [HV]·FR·EN |
+--------------------------------------+
|        Z A L D R Ī Z E S S E         |
|              *Dragons*               |
| [ Filtrer ]               28 dragons |
| Tri : (o) ancienneté  ( ) nom        |
| ==================================== |
| Balerion                           > |
| ## noir · :::::: – 94                |
| Āegon I · Maegor I · Aerea ·         |
| Viserys I                            |
| ------------------------------------ |
| Vagar                              > |
| :: non décrite · ~52 av. C. – 130    |
| Visenia · Baelon · Laena Velaryon ·  |
| Aemond                               |
| ------------------------------------ |
| Merakses                           > |
| ## argent · :::::: – 10              |
| Rhaenys, sœur d'Aegon Ier            |
| ------------------------------------ |
| ~~~~ (25 autres dragons) ~~~~        |
+--------------------------------------+
```

### Fiche de dragon — bureau

```text
+--------------------------------------------------------------------------------------------------+
| {S}                                      Iderenna    {c} Korjās    [HV] · FR · EN    Nūmāzma [x] |
+--------------------------------------------------------------------------------------------------+
| Zaldrīzesse *Dragons*  >                                                                         |
+--------------------------------------------------------------------------------------------------+
|  ZALDRĪZES *dragon*                                                                              |
|  V A G A R                                                                                   (4) |
|  *Vhagar — graphie de George R. R. Martin*                                                       |
+--------------------------------------------------------------------------------------------------+
|  ::::::::::::::::  Couleur non décrite par les livres.                                       (5) |
|  Une indication hors texte parle de bronze à reflets bleu-vert : ce n'est pas un texte publié.   |
+--------------------------------------------------------------------------------------------------+
|  ~52 av. C. |== Visenia ==|::::::|== Baelon ==|::::|== Laena Velaryon ==|= Aemond =| 130 AC  (6) |
|             éclosion      44     73           101                       120        mort          |
+----------------------+---------------------------------------------------------------------------+
| Éclosion             | vers 52 av. C., année calculée  ·  Zaldrīzdōron *Peyredragon* >       (7) |
| Mort                 | 130 AC, 22e jour de la 5e lune  ·  l'Œildieu >                            |
| Dragonniers          | Visenia >                                jusqu'en 44                      |
|                      | Baelon, fils de Jaehaerys Ier >          73 – 101                         |
|                      | Laena Velaryon >                         jusqu'en 120                     |
|                      | Aemond >                                 120 – 130                        |
| Dans les annales     | Le Champ de Feu >   ·   Mort de Lucerys à Accalmie >   ·   Rook's Rest >  |
|                      | La bataille au-dessus de l'Œildieu >   ·   9 autres >                     |
+-------------------------------------------------------------------+------------------------------+
| TEXTE EN FRANÇAIS · pourquoi ? >                                  |  ¹ Fire & Blood              |
| Plus vieux et plus grand dragon vivant au temps de la Danse, elle |    LIVRE · chronique fictive |
| tue Arrax puis Meleys. Elle meurt avec Aemond au-dessus de        |    Voir la source >          |
| l'Œildieu, en tuant Caraxès.¹                                     |                              |
|                                                                   |                              |
| SOURCES DE CETTE FICHE                                            |                              |
| Livres : Fire & Blood >  ·  The World of Ice & Fire >             |                              |
+--------------------------------------------------------------------------------------------------+
```

### Fiche de dragon — mobile

```text
+--------------------------------------+
| {S} Iderenna  {c} Korjās  [HV]·FR·EN |
+--------------------------------------+
| Zaldrīzesse *Dragons* >              |
|                                      |
| ZALDRĪZES *dragon*                   |
|              V A G A R               |
|     *Vhagar — graphie de Martin*     |
+--------------------------------------+
| ::::::::::  Couleur non décrite      |
|             par les livres.          |
+--------------------------------------+
| ~52 av. C. |==|::|==|:|===|=| 130 AC |
+--------------------------------------+
| Éclosion                             |
| vers 52 av. C. · Zaldrīzdōron      > |
| Mort                                 |
| 130 AC · l'Œildieu                 > |
| Dragonniers                          |
| Visenia · jusqu'en 44              > |
| Baelon · 73 – 101                  > |
| Laena Velaryon · jusqu'en 120      > |
| Aemond · 120 – 130                 > |
| Dans les annales                     |
| Le Champ de Feu                    > |
| Mort de Lucerys à Accalmie         > |
| ~~~~ (11 autres) ~~~~                |
+--------------------------------------+
| TEXTE EN FRANÇAIS · pourquoi ? >     |
| Plus vieux et plus grand dragon      |
| vivant au temps de la Danse ~~ [¹]   |
+--------------------------------------+
```

- **Hiérarchie du registre.** 1. le titre ; 2. la table ; 3. les filtres. Vingt-huit lignes : aucune pagination, aucun rail.
- **(1) Titre.** *Zaldrīzesse*, forme attestée.
- **(2) Filtres.** Trois, sur une ligne. Sur mobile, un feuillet.
- **(3) En-têtes en français.** *Kipio* (« dragonnier ») existe au lexique, mais « écailles », « éclosion » et « fin » n'y sont pas. Un groupe d'étiquettes ne mélange pas les langues (UX 5.4) : la ligne d'en-tête est donc dans la langue de lecture. **Demande à l'agent 04** : ces trois mots, ou la confirmation qu'ils n'existent pas.
- **Lignes.** Le nom est le lien. `##` figure le nuancier d'écailles : un petit rectangle au motif d'ogives, teinté de la couleur écrite dans les livres, **toujours suivi du mot** qui la nomme. `::` : couleur non décrite. `::::::` : date non documentée. `~` : année calculée. Les noms qui ont une forme valyrienne la portent (*Vagar*, *Merakses*, *Karakses*, *Syraks*, *Āegon*, *Visenia*).
- **(4) Nom.** La glose donne la graphie de Martin : c'est elle que le visiteur connaît et cherche.
- **(5) Nuancier, et son état vide.** Le cahier artistique fait du nuancier la seule « image » d'un dragon. Or `dragons.json` ne donne **aucune couleur écrite pour 8 dragons sur 28**, dont Vhagar, le plus cherché. L'état « non décrit » n'est donc pas un cas limite : c'est un cas sur trois ou quatre, et il doit être dessiné avec le même soin que l'état plein. Proposition : nuancier hachuré, la phrase « couleur non décrite par les livres », et, quand elle existe, l'indication hors texte donnée comme telle, en clair, sans jamais teinter le nuancier. Une couleur venue d'une série ne s'y affiche pas davantage (proposition 4 de l'agent 02).
- **(6) Ligne de vie.** Les dragonniers successifs sont des segments ; un intervalle sans dragonnier connu est hachuré. La même information est dans la table dessous.
- **(7) Table d'identité.** En français, pour la raison donnée en (3). « Dans les annales » liste les événements où le dragon est cité (treize pour Vhagar).
- **Comportement.** Chaque dragonnier, lieu et événement est un lien ; la fiche de chaque dragonnier renvoie ici (réciprocité, UX 4.2). Aujourd'hui les dragonniers sont des noms dans `dragons.json`, pas des identifiants de `genealogy.json` : le lien ne peut pas encore être engendré (l'agent 03 fait la même demande).
- **Langue.** En français : « Dragons », « Vhagar » en titre et *Vagar* dessous en italique, « forme valyrienne, attestée ».
- **Variantes.** V2 : les dragons sont des attaches sur le fil, à côté de leurs dragonniers ; ce registre reste la vue d'ensemble, en stèles. V3 : le registre est un folio ; choisir un dragon cale la réglette sur ses années.

---

## W08 — Une guerre, et le bloc « bataille » d'une fiche d'événement

Adresses : `wars/dance-of-the-dragons.html`, `events/p5-oeildieu.html`. Les batailles et le bloc « bataille » viennent de `timeline.json`. **Aucune donnée de guerre n'existe encore** : la composition des camps est donnée de mémoire et ne fait pas foi.

### Guerre — bureau

```text
+--------------------------------------------------------------------------------------------------+
| {S}                                      Iderenna    {c} Korjās    [HV] · FR · EN    Nūmāzma [x] |
+--------------------------------------------------------------------------------------------------+
| Vīlībāzmi *Guerres*  >                              < guerre précédente        guerre suivante > |
+--------------------------------------------------------------------------------------------------+
|  VĪLĪBĀZMA *guerre*                                                                          (1) |
|  Z A L D R Ī Z O T I   L I L I O N                                                               |
|  *La Danse des Dragons*  ·  129 – 131 AC                                                         |
+--------------------------------------------------------------------------------------------------+
|  TEXTE EN FRANÇAIS · pourquoi ? >                                                                |
|  Guerre de succession entre deux enfants de Viserys Ier. ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~ |
|  ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~ |
+--------------------------------------------------------------------------------------------------+
|  En bref  ·  Camps  ·  Batailles  ·  Issue et conséquences  ·  Sources                           |
+------------------------------------------------+-------------------------------------------------+
| LES NOIRS                                  (2) | LES VERTS                                       |
| Prétendante                                    | Prétendant                                      |
|   Rhaenyra >                                   |   Aegon II >                                    |
| Chefs                                          | Chefs                                           |
|   Daemon >  ·  Jacaerys >                      |   Aemond >  ·  Alicent Hightower                |
|   Rhaenys, fille d'Aemon >                 (3) |   Otto Hightower  ·  Criston Cole               |
| Maisons alliées                                | Maisons alliées                                 |
|   Velaryon · Arryn · Stark · Tully             |   Hightower · Lannister · Baratheon             |
| Dragons                                        | Dragons                                         |
|   Syraks > · Karakses > · Meleys >             |   Vagar > · Sunfyre > · Dreamfyre >             |
|   Vermax > · Arrax >  · 6 autres >             |   Tessarion >                                   |
+--------------------------------------------------------------------------------------------------+
|  BATAILLES                                                                                   (4) |
|  129 AC    Rook's Rest (Repos-des-Freux)                                              dragons  > |
|  130 AC    La bataille du Gosier                           récits contradictoires  ·  dragons  > |
|  130 AC    Le Conflans en feu : la Rive du Lac et le Bal du Boucher                            > |
|  130 AC    Première bataille de Tumbleton : les Deux Traîtres                         dragons  > |
|  130 AC    La bataille au-dessus de l'Œildieu                                         dragons  > |
|  130 AC    Seconde bataille de Tumbleton                   récits contradictoires  ·  dragons  > |
+--------------------------------------------------------------------------------------------------+
|  ISSUE ET CONSÉQUENCES                                                                       (5) |
|  Les deux prétendants meurent. Aegon III, fils de Rhaenyra, monte sur le trône. La plupart des   |
|  dragons sont morts.¹                                                                            |
|  Avènement d'Aegon III >            Période suivante : VI · Lilio Toliot *Après la Danse* >      |
+--------------------------------------------------------------------------------------------------+
```

### Guerre — mobile

```text
+--------------------------------------+
| {S} Iderenna  {c} Korjās  [HV]·FR·EN |
+--------------------------------------+
| Vīlībāzmi *Guerres* >                |
|                                      |
| VĪLĪBĀZMA *guerre*                   |
|          ZALDRĪZOTI LILION           |
|        *La Danse des Dragons*        |
|             129 – 131 AC             |
|                                      |
| TEXTE EN FRANÇAIS · pourquoi ? >     |
| Guerre de succession entre deux      |
| enfants de Viserys Ier. ~~~~~~~~~~~  |
+--------------------------------------+
| [ Les Noirs  ]   [ Les Verts ]   (6) |
|  ============                        |
| Prétendante                          |
| Rhaenyra                           > |
| Chefs                                |
| Daemon                             > |
| Jacaerys                           > |
| Rhaenys, fille d'Aemon             > |
| Maisons alliées                      |
| Velaryon · Arryn · Stark · Tully     |
| Dragons                              |
| Syraks                             > |
| Karakses                           > |
| ~~~~ (9 autres) ~~~~                 |
+--------------------------------------+
| BATAILLES                            |
| 129  Rook's Rest                   > |
|      dragons                         |
| 130  La bataille du Gosier         > |
|      récits contradictoires · dragons|
| 130  Au-dessus de l'Œildieu        > |
|      dragons                         |
| ~~~~ (3 autres) ~~~~                 |
+--------------------------------------+
| ISSUE ET CONSÉQUENCES                |
| Les deux prétendants meurent. ~~ [¹] |
| Avènement d'Aegon III              > |
+--------------------------------------+
```

### Bloc « bataille » d'une fiche d'événement — bureau

```text
+--------------------------------------------------------------------------------------------------+
|  Vīlībāzma *bataille*                                                                        (7) |
|  Jēda *année*  130 AC, 22e jour de la 5e lune        Ālion *lieu*  l'Œildieu >  ·  Harrenhal >   |
|  Vīlībāzma *guerre*  Zaldrīzoti Lilion >                                                         |
|                                                                                                  |
|  L A   B A T A I L L E   A U - D E S S U S   D E   L ' Œ I L D I E U                             |
+------------------------------------------------+-------------------------------------------------+
| LES NOIRS                                      | LES VERTS                                       |
|   Daemon >                                     |   Aemond >                                      |
|   sur Karakses >                               |   sur Vagar >                                   |
+--------------------------------------------------------------------------------------------------+
|  ( cire )  ÉTABLI  ·  L'issue est établie ; la survie de Daemon relève de la chanson.        (8) |
|                                                                                                  |
|  TEXTE EN FRANÇAIS · pourquoi ? >                                                                |
|  Daemon attend Aemond à Harrenhal et le défie. Au-dessus du lac, Caraxès s'accroche à la gorge   |
|  de Vhagar, et Daemon saute d'une selle à l'autre pour planter son épée dans l'œil de son neveu. |
|  Les deux dragons s'abîment. Le corps de Daemon n'est jamais retrouvé, ce qui nourrit des        |
|  chansons où il survit.¹                                                                         |
+--------------------------------------------------------------------------------------------------+
|  < Gōnka *précédent*  (bataille précédente)              (bataille suivante)  Hembār *suivant* > |
|  Suite : batailles de la Danse des Dragons                                                   (9) |
+--------------------------------------------------------------------------------------------------+
```

- **Hiérarchie de la guerre.** 1. le titre et les bornes ; 2. le résumé ; 3. les deux camps, face à face ; 4. les batailles dans l'ordre ; 5. l'issue.
- **(1)** *Vīlībāzma* sert de rubrique à « guerre » ici et à « bataille » sur une fiche de bataille : la langue ne les distingue pas. La glose et le type écrit en toutes lettres font la différence.
- **(2) Camps.** Deux colonnes égales. Les intitulés de lignes sont en français (pas de forme au lexique pour « prétendant », « chef », « allié »). Une personne ou une maison sans fiche est écrite sans lien.
- **(3) Homonyme.** Deux Rhaenys existent dans la Maison : la filiation fait partie du nom affiché partout où il y a doute (**demande à l'agent 03** : un champ de désambiguïsation par personne).
- **(4) Batailles.** Listées sur la fiche même, pas derrière un onglet : la règle des trois interactions l'exige (UX 3.3). Chaque ligne : année, titre de l'événement, signal de fiabilité s'il n'est pas « établi », présence de dragons, lien. Une issue en quelques mots (« victoire des Verts ») serait précieuse ici ; elle n'est pas dans les données et je ne l'invente pas. Savoir **quels événements sont des batailles** suppose le champ de type qui manque (W03) : la liste dessinée est mon choix parmi les titres de l'agent 02.
- **(5) Issue et conséquences.** Les conséquences sont des liens : vers l'événement qui suit, vers la période qui s'ouvre.
- **(6) Mobile.** Les deux camps ne tiennent pas côte à côte à 360 px. Deux onglets, « Les Noirs » et « Les Verts ». Défaut assumé : on ne voit plus les deux camps ensemble. La première ligne du résumé doit donc les nommer tous les deux.
- **(7) Bloc bataille.** C'est une fiche d'événement (W04) à laquelle s'ajoutent les deux camps, face à face. Une bataille n'a qu'une fiche, atteinte par les Chroniques comme par les Guerres. La rubrique *Vīlībāzma* vaut ici « bataille » et, deux lignes plus bas, « guerre » : même mot, deux gloses.
- **(8) Fiabilité.** Niveau et note de l'agent 02, en toutes lettres. Ici le fait est établi et la note dit ce qui relève de la légende. Pour les onze événements du fonds classés « récits contradictoires », un bloc titré « Versions » expose chaque récit avec sa source ; il est distinct du bloc « adaptation ».
- **(9) Série.** On est venu par la guerre : précédent et suivant parcourent ses batailles, et la ligne le dit.
- **Langue.** En français : « Guerre », « La Danse des Dragons » en titre, *Zaldrīzoti Lilion* dessous.
- **Variantes.** V2 : la guerre est un épaississement du fil entre 129 et 131, les deux camps de part et d'autre ; à 360 px, retour à cette liste. V3 : les batailles se posent sur la réglette ; la fiche de guerre est un folio.
- **Données à produire (agent 02).** Un objet « guerre » : bornes, camps, chefs, maisons alliées, dragons par camp, liste ordonnée de ses batailles, issue, conséquences. Rien de cela n'existe encore, et tout ce que la colonne « camps » affiche ici vient de ma mémoire.

---

## W09 — Lieux : liste et carte

Adresse : `places/index.html?view=map&period=dance-of-the-dragons`.

### Bureau

```text
+--------------------------------------------------------------------------------------------------+
| {S}                                      Iderenna    {c} Korjās    [HV] · FR · EN    Nūmāzma [x] |
+--------------------------------------------------------------------------------------------------+
|                                             Ā L I A                                          (1) |
|                                             *Lieux*                                              |
+--------------------------------------------------------------------------------------------------+
|  7 lieux sur 66       Région [ toutes v ]     Période [ V · La Danse v ]     Nature [ toutes v ] |
|  Vue :  (o) carte et liste   ( ) liste seule                                                 (2) |
+--------------------------------------+-----------------------------------------------------------+
| 1  Zaldrīzdōron                    > |                              N                            |
|    *Peyredragon* · île, château      |                              |                            |
| -----------------------------------  |     <4>                                   ~  ~  ~  ~      |
| 2  Dāro Vilinion                   > |     .----.                <3> .          ~  ~  ~          |
|    *Port-Réal* · cité                |    ( <5>  )                 /     <1>     ~  ~  ~         |
| -----------------------------------  |     '----'                 /                ~  ~          |
| 3  Repos-des-Freux                 > |                      <2> __/      <7>     ~  ~  ~         |
|    château                           |                         /                  ~  ~           |
| -----------------------------------  |                        |      ~  ~  ~  ~  ~  ~            |
| 4  Harrenhal                       > |                         \         ~  ~  ~  ~              |
|    château                           |                          \__ <6>     ~  ~  ~              |
| -----------------------------------  |                                                           |
| 5  l'Œildieu                       > |   [ + ]  [ − ]  [ recentrer ]                         (4) |
|    lac                               |                                                           |
| -----------------------------------  |   Carte schématique. Positions relatives, tracé           |
| 6  Accalmie                        > |   original de la bibliothèque.                        (5) |
|    château                           |                                                           |
| -----------------------------------  |   Hors carte :  Valyria >  (à l'est, au-delà du           |
| 7  le Gosier                       > |   détroit)                                                |
|    détroit                       (3) |                                                           |
+--------------------------------------------------------------------------------------------------+
```

### Mobile

```text
+--------------------------------------+
| {S} Iderenna  {c} Korjās  [HV]·FR·EN |
+--------------------------------------+
|               Ā L I A                |
|               *Lieux*                |
| [ Filtrer · 1 ]        7 lieux sur 66|
| (o) liste   ( ) carte            (6) |
| ==================================== |
| 1  Zaldrīzdōron                    > |
|    *Peyredragon* · île, château      |
| ------------------------------------ |
| 2  Dāro Vilinion                   > |
|    *Port-Réal* · cité                |
| ------------------------------------ |
| 3  Repos-des-Freux                 > |
|    château                           |
| ------------------------------------ |
| 4  Harrenhal                       > |
|    château                           |
| ------------------------------------ |
| ~~~~ (3 autres lieux) ~~~~           |
+--------------------------------------+
```

```text
+--------------------------------------+
|     VUE « CARTE » (plein écran)      |
+--------------------------------------+
|                  N                   |
|   <4>            |                   |
|  .----.     <3>.      <1>   ~ ~      |
| ( <5>  )      /            ~ ~ ~     |
|  '----'  <2>_/    <7>     ~ ~        |
|            /          ~ ~ ~ ~        |
|            \_ <6>   ~ ~ ~            |
| [ + ] [ − ]             [ liste ]    |
+--------------------------------------+
| 2  Dāro Vilinion *Port-Réal* · cité  |
| Ouvrir la fiche                    > |
+--------------------------------------+
```

- **Hiérarchie.** 1. la liste ; 2. la carte. La liste est le contenu, la carte en est une vue : c'est l'inverse d'un site de cartographie, et c'est ce qui rend l'espace utilisable au clavier et au lecteur d'écran.
- **(1) Titre.** *Ālia* : forme dérivée, non revérifiée par l'agent 04 (état E3 ; la note de glose le dit).
- **(2) Vue.** « Carte et liste » sur bureau, « liste seule » pour qui ne veut pas de carte. Le choix est mémorisé.
- **(3) Liste.** Numérotée ; le numéro est celui du repère. Nom valyrien quand il existe, nom français en glose, nature du lieu. Groupée par région quand aucun filtre de période n'est posé.
- **(4) Carte.** Les repères sont cliquables au pointeur, mais ne sont pas des arrêts de tabulation : la liste suffit, et la doubler ferait quatorze arrêts pour sept lieux. Choisir une ligne met son repère en évidence, et inversement. Échelle par boutons ; le pincement est un confort.
- **(5) Honnêteté de la carte.** Une ligne dit ce qu'elle est : un schéma de positions relatives, dessiné pour la bibliothèque, sans reprise d'une carte publiée (cahier artistique, section 3). Elle n'a ni échelle ni frontières.
- **(6) Mobile.** Liste par défaut. La carte est une vue plein écran, avec un bandeau bas qui nomme le repère choisi et mène à sa fiche. Elle ne se trouve jamais dans une page qui défile.
- **Lecteur d'écran.** La carte est une image avec une alternative d'une phrase ; toute l'information est dans la liste.
- **Langue.** En français : « Lieux », « Peyredragon », « Port-Réal », avec la forme valyrienne en italique sur la fiche de chaque lieu.
- **Si la carte n'est pas livrée.** L'espace fonctionne sans elle : le sélecteur de vue disparaît. C'est pourquoi le cahier des charges peut la dire « éventuelle ».
- **Demande de données (agents 02 et 11).** `timeline.json` contient un répertoire de 66 noms de lieux, en français et en anglais, sans rien d'autre. Il faut par lieu : un identifiant, une région, une nature, et deux coordonnées sur un schéma original. Les positions dessinées ici viennent de ma mémoire. Les natures aussi.
- **Variantes.** V1 : la carte est une planche hors-texte, comme l'arbre. V2 : pas de carte dans le fil ; cet espace est une table de stèles et la carte une planche à part. V3 : la carte est un document que l'on pose ; la réglette la filtre par période, filtre affiché en clair.

---

## W10 — Bibliothèque linguistique : lexique et fiche de mot

Adresses : `language/index.html`, `language/words/zaldrizes.html`. Les comptes sont fictifs.

### Lexique — bureau

```text
+--------------------------------------------------------------------------------------------------+
| {S}                                      Iderenna    {c} Korjās    [HV] · FR · EN    Nūmāzma [x] |
+--------------------------------------------------------------------------------------------------+
|                                    V A L Y R I O   Ē N G O S                                 (1) |
|                                      *La langue valyrienne*                                      |
+--------------------------------------------------------------------------------------------------+
|  [ Lexique · 412 ]      [ Expressions · 38 ]      [ Grammaire ]                              (2) |
|  =================                                                                               |
+------------------------+-------------------------------------------------------------------------+
| FILTRER                | {c} [ filtrer par forme ou par sens           ]        412 mots     (3) |
|                        | A  B  D  E  G  H  I  J  K  L  M  N  O  P  Q  R  S  T  U  V  Y  Z    (4) |
| Thème                  | ======================================================================= |
| [ ] parenté         31 | Mot              Sens                 Classe             Attestation    |
| [ ] feu et dragons  24 | ----------------------------------------------------------------------- |
| [ ] royauté         40 | ānogar           sang                 nom · aquatique    attesté      > |
| [ ] guerre          52 | dārys            roi                  nom · solaire      attesté      > |
| [ ] temps           18 | gūrēñagon        apprendre            verbe              attesté      > |
|                        | kepa             père                 nom                attesté      > |
| Classe                 | muña             mère                 nom · lunaire      attesté      > |
| [ ] nom            260 | perzys           feu, flamme          nom · solaire      attesté      > |
| [ ] verbe           95 | tembyr           livre                nom                attesté      > |
| [ ] adjectif        41 | udir             mot                  nom                attesté      > |
|                        | zaldrīzes        dragon               nom · solaire      attesté      > |
| Attestation        (5) | ~~~~                                                                    |
| [ ] attesté        301 |                                                                         |
| [ ] dérivé          74 | Ces formes viennent des travaux de David J. Peterson.               (6) |
| [ ] composé ici     37 | Comment lire les niveaux d'attestation >                                |
|                        |                                                                         |
| [ ] dans l'interface   |                                                                         |
+--------------------------------------------------------------------------------------------------+
```

### Lexique — mobile

```text
+--------------------------------------+
| {S} Iderenna  {c} Korjās  [HV]·FR·EN |
+--------------------------------------+
|            VALYRIO ĒNGOS             |
|        *La langue valyrienne*        |
| [ Lexique ] [ Expressions ] [ Gram. ]|
|  =========                           |
| {c} [ forme ou sens                ] |
| [ Filtrer ]                 412 mots |
| A B D E G H I J K L M N O P Q R S …  |
| ==================================== |
| ānogar                             > |
| sang · nom · attesté                 |
| ------------------------------------ |
| dārys                              > |
| roi · nom · attesté                  |
| ------------------------------------ |
| gūrēñagon                          > |
| apprendre · verbe · attesté          |
| ------------------------------------ |
| ~~~~                                 |
+--------------------------------------+
```

### Fiche de mot — bureau

```text
+--------------------------------------------------------------------------------------------------+
| {S}                                      Iderenna    {c} Korjās    [HV] · FR · EN    Nūmāzma [x] |
+--------------------------------------------------------------------------------------------------+
| Valyrio Ēngos *La langue valyrienne*  >  Lexique  >                                              |
+--------------------------------------------------------------------------------------------------+
|  UDIR *mot*                                                                                  (7) |
|  Z A L D R Ī Z E S                                                                               |
|  dragon                                                                                          |
+----------------------+---------------------------------------------------------------------------+
| Nūmāzma *sens*       | dragon                                                                    |
| Classe               | nom, genre solaire, 4e déclinaison                                        |
| Formes utiles        | génitif singulier  zaldrīzo    ·    pluriel  zaldrīzesse                  |
|                      | génitif pluriel  zaldrīzoti                                               |
| Prononciation        | zal · DRĪ · zes  — accent sur l'avant-dernière syllabe, longue        (8) |
| Attestation          | ATTESTÉ                                                               (9) |
|                      | « Zaldrīzes buzdari iksos daor. »  Game of Thrones, saison 3, épisode 4   |
| Source               | Dictionnaire de haut valyrien, wiki de David J. Peterson >                |
+--------------------------------------------------------------------------------------------------+
|  OÙ LE LIRE DANS LA BIBLIOTHÈQUE                                                            (10) |
|  Zaldrīzesse  ·  titre du registre des dragons  >                                                |
|  Zaldrīzoti Lilion  ·  titre de la période V et de la guerre  >                                  |
|  Zaldrīzo Ānogar  ·  titre de la lignée  >                                                       |
|  Zaldrīzdōron  ·  nom de Peyredragon  >                                                          |
+--------------------------------------------------------------------------------------------------+
|  MÊME THÈME : feu et dragons                          PARCOURS                                   |
|  perzys >   ·   kipio >                               Dix mots de valyrien, étape 1 >            |
+--------------------------------------------------------------------------------------------------+
```

### Fiche de mot — mobile

```text
+--------------------------------------+
| {S} Iderenna  {c} Korjās  [HV]·FR·EN |
+--------------------------------------+
| Valyrio Ēngos > Lexique >            |
|                                      |
| UDIR *mot*                           |
|          Z A L D R Ī Z E S           |
|                dragon                |
+--------------------------------------+
| Classe                               |
| nom, genre solaire, 4e déclinaison   |
| Formes utiles                        |
| génitif singulier   zaldrīzo         |
| pluriel             zaldrīzesse      |
| génitif pluriel     zaldrīzoti       |
| Prononciation                        |
| zal · DRĪ · zes                      |
| Attestation                          |
| ATTESTÉ                              |
| « Zaldrīzes buzdari iksos daor. »    |
| Game of Thrones, saison 3, ép. 4     |
| Source                               |
| Wiki de David J. Peterson          > |
+--------------------------------------+
| OÙ LE LIRE DANS LA BIBLIOTHÈQUE      |
| Zaldrīzesse                        > |
| registre des dragons                 |
| Zaldrīzoti Lilion                  > |
| période V                            |
| ~~~~                                 |
+--------------------------------------+
```

- **Hiérarchie du lexique.** 1. les trois onglets de l'espace ; 2. le champ de filtre ; 3. la table ; 4. les facettes. La page de l'espace **est** le lexique : pas de page d'aiguillage (UX 3.3).
- **(1)** *Valyrio Ēngos* : composition de la bibliothèque (statut `editorial`).
- **(2) Onglets.** Trois pages réelles (`index.html`, `phrases.html`, `grammar.html`), donc trois liens qui fonctionnent sans script.
- **(3) Filtre.** Cherche dans la forme et dans le sens, avec la même tolérance que la recherche globale : « zaldrizes » suffit.
- **(4) Rail alphabétique.** Lettres de base. Ā se range avec A, ñ avec n.
- **(5) Attestation.** C'est une facette : on peut n'afficher que l'attesté. La colonne est toujours visible, en toutes lettres. Dans cet espace, contrairement au reste du site, le niveau d'attestation est permanent : on y vient pour cela.
- **(6)** Une ligne de provenance et un lien vers la note sur la langue.
- **(7) Fiche de mot.** *Udir* (« mot ») en rubrique, la forme en titre, le sens dessous. Les autres intitulés de la table sont en français, sauf *Nūmāzma*, seul à avoir une forme ; d'après la règle d'homogénéité, toute la table devrait donc être en français. Je laisse l'écart visible sur ce dessin pour montrer à quoi ressemble un groupe mêlé : il est à corriger, dans un sens ou dans l'autre, quand l'agent 04 aura répondu.
- **(8) Prononciation.** Écrite, d'après la règle d'accent de la grammaire de l'agent 04. Pas d'audio : aucune source licite n'est identifiée. À confirmer par l'agent 04.
- **(9) Attestation.** Le niveau, puis l'exemple et sa référence, tirés de `lexicon.json`. La traduction de l'exemple reste à fournir par l'agent 04.
- **(10) Où le lire.** Le lien qui fait du site un terrain d'exercice : chaque mot renvoie aux endroits de l'interface où il est écrit (UX 4.2).
- **Langue.** En mode valyrien, cet espace est le plus « français » du site : presque tout y est explication, donc récit (classe 5). C'est normal et il faut le dire : on n'explique pas une langue dans cette langue à qui ne la lit pas.
- **Variantes.** Faibles : c'est un registre. V1 : folio à deux colonnes de dictionnaire. V2 : stèles, sans jauge d'ères (le temps n'a pas de sens ici). V3 : la fiche de mot se pose à côté de la fiche où on l'a rencontré.

---

## W11 — Archives documentaires : registre des sources, et une source

Adresses : `sources/index.html`, `sources/fab.html` (identifiant de `sources.json`). Les vingt sources, leur nature et leurs comptes de citations viennent des fichiers de données.

### Registre — bureau

```text
+--------------------------------------------------------------------------------------------------+
| {S}                                      Iderenna    {c} Korjās    [HV] · FR · EN    Nūmāzma [x] |
+--------------------------------------------------------------------------------------------------+
|                                          T E M B Y R I                                       (1) |
|                                            *Sources*                                             |
+--------------------------------------------------------------------------------------------------+
|  20 sources          Nature [ toutes v ]          Tri :  (o) par nature   ( ) par date           |
+--------------------------------------------+-----------+-----------------------+-----------------+
| Titre                                      | Date      | Témoignage            | Citée par       |
+--------------------------------------------+-----------+-----------------------+-----------------+
| LIVRES · 16                            (2) |           |                       |                 |
| Fire & Blood                             > | 2018      | chronique fictive     | 65 événements   |
|   *Feu et Sang* · George R. R. Martin      |           |                       | 88 personnes    |
| The World of Ice & Fire                  > | 2014      | chronique fictive     | 76 événements   |
|   encyclopédie d'univers                   |           |                       | 172 personnes   |
| A Song of Ice and Fire (cinq tomes)      > | 1996 – …  | récit direct          | 51 personnes    |
| The Princess and the Queen               > | 2013      | chronique fictive     | 16 événements   |
|   nouvelle                                 |           |                       |                 |
| ~~~~ (12 autres : romans, nouvelles)       |           |                       |                 |
+--------------------------------------------+-----------+-----------------------+-----------------+
| ADAPTATIONS · 3                        (3) |           |                       |                 |
| Game of Thrones                          > | 2011      | adaptation            | 4 événements    |
| House of the Dragon                      > | 2022      | adaptation            | 4 événements    |
| A Knight of the Seven Kingdoms           > | 2026      | adaptation            | —               |
+--------------------------------------------+-----------+-----------------------+-----------------+
| OUTILS ET TRAVAUX                      (4) |           |                       |                 |
| A Wiki of Ice and Fire                   > | —         | outil de vérification | jamais citée    |
| Travaux de David J. Peterson (valyrien)  > | —         | travail linguistique  | 87 mots         |
+--------------------------------------------------------------------------------------------------+
|  Les interprétations ne sont pas des sources. Elles sont marquées sur chaque fait :         (10) |
|  établi · récit unique · récits contradictoires · tradition ou légende · propre à une adaptation |
|  Comment la bibliothèque qualifie un fait >                                                      |
+--------------------------------------------------------------------------------------------------+
```

### Registre — mobile

```text
+--------------------------------------+
| {S} Iderenna  {c} Korjās  [HV]·FR·EN |
+--------------------------------------+
|            T E M B Y R I             |
|              *Sources*               |
| [ Nature : toutes v ]     20 sources |
| ==================================== |
| LIVRES · 16                          |
| Fire & Blood                       > |
| *Feu et Sang* · 2018                 |
| chronique fictive                    |
| 65 événements · 88 personnes         |
| ------------------------------------ |
| The World of Ice & Fire            > |
| 2014 · chronique fictive             |
| 76 événements · 172 personnes        |
| ------------------------------------ |
| ~~~~ (14 autres) ~~~~                |
| ==================================== |
| ADAPTATIONS · 3                      |
| House of the Dragon                > |
| 2022 · adaptation                    |
| 4 événements                         |
| ------------------------------------ |
| ~~~~                                 |
+--------------------------------------+
```

### Une source — bureau

```text
+--------------------------------------------------------------------------------------------------+
| {S}                                      Iderenna    {c} Korjās    [HV] · FR · EN    Nūmāzma [x] |
+--------------------------------------------------------------------------------------------------+
| Tembyri *Sources*  >  Livres  >                                                                  |
+--------------------------------------------------------------------------------------------------+
|  TEMBYR *source*                                                                             (5) |
|  F I R E   &   B L O O D                                                                         |
|  *Feu et Sang*, titre de la traduction française (non vérifié)                                   |
|  ( cire )  LIVRE  ·  CHRONIQUE FICTIVE                                                       (6) |
+----------------------+---------------------------------------------------------------------------+
| Auteur               | George R. R. Martin                                                       |
| Parution             | 2018                                                                      |
| Continuité           | Livres                                                                    |
| Témoignage           | Chronique fictive : le livre se présente comme l'œuvre de             (7) |
|                      | l'archimestre Gyldayn, qui écrit bien après les faits et compile des      |
|                      | témoins partiaux (le septon Eustace, le Grand Mestre Munkun, le bouffon   |
|                      | Champignon).                                                              |
| Fiabilité            | Source principale pour les années 114 av. C. – 136 AC. Il signale lui-même|
|                      | ses doutes et laisse plusieurs morts sans version arrêtée. En cas de      |
|                      | désaccord de date avec The World of Ice & Fire, on le suit en signalant   |
|                      | l'écart.                                                                  |
+--------------------------------------------------------------------------------------------------+
|  FICHES QUI CITENT CETTE SOURCE                                                              (8) |
|  Événements · 65 >          Personnes · 88 >          Dragons >                                  |
|  Mort de Lucerys à Accalmie >   ·   Rhaenyra >   ·   Vagar >   ·   ~~~~   ·   Tout voir >        |
+--------------------------------------------------------------------------------------------------+
|  SOURCES EN DÉSACCORD                                                                        (9) |
|  The World of Ice & Fire  ·  livre  ·  écarts de date signalés  >                                |
|  House of the Dragon  ·  adaptation  ·  3 écarts relevés dans la période V  >                    |
+--------------------------------------------------------------------------------------------------+
```

### Une source — mobile

```text
+--------------------------------------+
| {S} Iderenna  {c} Korjās  [HV]·FR·EN |
+--------------------------------------+
| Tembyri *Sources* > Livres >         |
|                                      |
| TEMBYR *source*                      |
|             FIRE & BLOOD             |
|            *Feu et Sang*             |
| ( cire )  LIVRE · CHRONIQUE FICTIVE  |
+--------------------------------------+
| Auteur                               |
| George R. R. Martin                  |
| Parution                             |
| 2018                                 |
| Témoignage                           |
| Chronique fictive : le livre se      |
| présente comme l'œuvre de            |
| l'archimestre Gyldayn ~~~~~~~~~~~~~  |
| Fiabilité                            |
| Source principale pour les années    |
| 114 av. C. – 136 AC. ~~~~~~~~~~~~~~  |
+--------------------------------------+
| FICHES QUI CITENT CETTE SOURCE       |
| Événements · 65                    > |
| Personnes · 88                     > |
| Dragons                            > |
+--------------------------------------+
| SOURCES EN DÉSACCORD                 |
| The World of Ice & Fire            > |
| House of the Dragon                > |
+--------------------------------------+
```

- **Hiérarchie du registre.** 1. la nature, qui fait les groupes ; 2. le titre ; 3. la date, le type de témoignage, l'usage. Le classement par nature est le défaut : c'est la distinction que le cahier des charges demande, elle doit sauter aux yeux.
- **(1)** *Tembyri* : littéralement « livres », employé par extension (statut `editorial`). La glose dit « Sources ».
- **(2) (3) (4) Trois groupes.** Livres (seize, dont deux entrées collectives), adaptations (trois), outils et travaux. Toujours dans cet ordre. Le nom de chaque groupe est en toutes lettres et sert de titre de niveau 2. Le wiki de vérification est montré pour ce qu'il est : un outil, que l'agent 02 ne cite dans aucun fait. Les travaux linguistiques ne sont **pas** dans `sources.json` : à ajouter, à partir des références du lexique.
- **Colonne « témoignage ».** Les quatre natures de `sources.json` : récit direct, chronique fictive, adaptation, outil. C'est une information rare et utile : elle dit comment lire la source avant de la lire.
- **Colonne « citée par ».** Comptée dans les fichiers de données (UX 4.2). Elle dit le poids réel de chaque source dans le fonds.
- **(5) Titre.** Le titre d'une source reste dans sa langue d'origine dans les trois modes. Il n'est jamais traduit en valyrien. Le titre français est donné en glose, avec sa mention quand il n'a pas été vérifié.
- **(6) Nature.** Sceau de cire et mots (cahier artistique : la cire authentifie). Les mots suffisent sans le sceau.
- **(7) Témoignage et fiabilité.** Ce sont les champs de l'agent 02, repris tels quels. Ils expliquent d'avance les blocs « versions » des fiches.
- **(8) Fiches qui citent.** Compte par type, premiers liens, « tout voir » vers une liste complète. Critère C4.7.
- **(9) Désaccords.** Liens vers les sources qui racontent autrement.
- **(10) Les interprétations.** Le cahier des charges demande de distinguer livres, interprétations et adaptations. Dans les données, l'interprétation n'est pas une source : c'est un **niveau de fiabilité du fait** (« tradition ou légende », « récits contradictoires »). Le registre le dit et renvoie à l'explication des cinq niveaux, plutôt que d'inventer une fausse catégorie de sources.
- **Langue.** Presque tout est en langue de lecture : ce sont des notices. En mode valyrien, seuls *Tembyri* et *Tembyr* sont valyriens.
- **Adresse.** `sources/fab.html` est opaque. Je demande à l'agent 11 un identifiant lisible par source (`fire-and-blood`), ou un champ d'adresse distinct de l'identifiant.
- **Variantes.** Faibles. V1 : bibliographie composée sur parchemin. V2 : stèles. V3 : une source se pose à côté de la fiche qui la cite.

---

## W12 — Parcours d'apprentissage : une étape et son questionnaire

Exemple : « Dix mots de valyrien », étape 2. Adresse : `learn/ten-words/2.html`.

### Bureau — avant la réponse

```text
+--------------------------------------------------------------------------------------------------+
| {S}                                      Iderenna    {c} Korjās    [HV] · FR · EN    Nūmāzma [x] |
+--------------------------------------------------------------------------------------------------+
| Gūrēñagon *Apprendre*  >  Dix mots de valyrien  >                                                |
+--------------------------------------------------------------------------------------------------+
|  ÉTAPE 2 SUR 10      [ 1 ]  [ 2 ]  [ 3 ]  [ 4 ]  [ 5 ]  [ 6 ]  [ 7 ]  [ 8 ]  [ 9 ]  [ 10 ]   (1) |
|                                                                                       vue    === |
+------------------------------------------------+-------------------------------------------------+
| LIRE                                       (2) | RÉPONDRE                                    (4) |
|                                                |                                                 |
| P E R Z Y S                                    | Que veut dire « perzys » ?                      |
| feu, flamme                                    |                                                 |
|                                                |   ( )  sang                                     |
| Prononciation   PER · zys                      |   ( )  feu                                      |
| Classe          nom, genre solaire             |   ( )  roi                                      |
| Attestation     ATTESTÉ                        |   ( )  année                                    |
|                                                |                                                 |
| Où le lire dans la bibliothèque                |   [ Répondre ]                                  |
| La devise de la Maison :                       |                                                 |
| Perzys Ānogār  *Feu et Sang*               (3) |   Vous pouvez passer cette question.            |
|                                                |                                                 |
| Voir la fiche du mot >                         |                                                 |
+--------------------------------------------------------------------------------------------------+
|  < Gōnka *précédent*  zaldrīzes                                       ānogar  Hembār *suivant* > |
+--------------------------------------------------------------------------------------------------+
```

### Bureau — après la réponse (colonne de droite seule)

```text
+--------------------------------------------------+
| RÉPONDRE                                         |
|                                                  |
| Que veut dire « perzys » ?                       |
|                                                  |
|   ( )  sang                                      |
|   (o)  feu         ·  votre réponse              |
|   ( )  roi                                       |
|   ( )  année                                     |
|                                                  |
| JUSTE.                                       (5) |
| « Perzys » veut dire « feu ». On le lit dans la  |
| devise Perzys Ānogār, « Feu et Sang ».           |
| Source : fiche du mot >                          |
|                                                  |
| [ Hembār *suivant* > ]                           |
+--------------------------------------------------+
```

### Mobile

```text
+--------------------------------------+
| {S} Iderenna  {c} Korjās  [HV]·FR·EN |
+--------------------------------------+
| Gūrēñagon > Dix mots de valyrien >   |
| ÉTAPE 2 SUR 10                       |
| [1] [2] [3] [4] [5] [6] [7] [8] ~    |
| vue ===                              |
+--------------------------------------+
|             P E R Z Y S              |
|             feu, flamme              |
|                                      |
| Prononciation   PER · zys            |
| Classe          nom, solaire         |
| Attestation     ATTESTÉ              |
|                                      |
| Où le lire dans la bibliothèque      |
| Perzys Ānogār  *Feu et Sang*         |
| Voir la fiche du mot               > |
+--------------------------------------+
| QUESTION                             |
| Que veut dire « perzys » ?           |
|                                      |
| (  )  sang                           |
| (  )  feu                            |
| (  )  roi                            |
| (  )  année                          |
|                                      |
| [           Répondre           ]     |
| Vous pouvez passer cette question.   |
+--------------------------------------+
| [ < Gōnka ]   2 / 10   [ Hembār > ]  |
+--------------------------------------+
```

### Fin du parcours (bureau)

```text
+--------------------------------------------------------------------------------------------------+
|  DIX MOTS DE VALYRIEN — FIN DU PARCOURS                                                      (6) |
|  8 réponses justes sur 10.                                                                       |
|                                                                                                  |
|  zaldrīzes  dragon >     perzys  feu >      ānogar  sang >       dārys  roi >      dāria  reine >|
|  muña  mère >            kepa  père >       lentor  maison >     jēda  année >     udir  mot >   |
|                                                                                                  |
|  À revoir :  lentor >  ·  jēda >                                                                 |
|  Recommencer             Parcours suivant : La Danse en sept étapes >                            |
|  Mémorisé sur cet appareil seulement.   Effacer ma progression                               (7) |
+--------------------------------------------------------------------------------------------------+
```

- **Hiérarchie.** 1. où l'on en est ; 2. ce qu'il y a à lire ; 3. la question ; 4. la suite. Lire avant de répondre : la question vérifie une lecture, elle ne piège pas.
- **(1) Sommaire d'étapes.** Dix liens numérotés. Toutes les étapes sont libres, dans n'importe quel ordre. L'étape en cours est soulignée, une étape vue porte le mot « vue ». Pas de barre de progression animée.
- **(2) Lecture.** Un extrait de la fiche du mot (W10), pas un contenu à part : le parcours réutilise le musée et y renvoie.
- **(3)** Le mot est montré là où le visiteur l'a déjà vu, ici dans la devise.
- **(4) Question.** Un groupe de choix natif (`fieldset`, `legend`, boutons radio). Rien ne se passe au choix ; la réponse part au bouton. On peut passer.
- **(5) Retour.** Un mot (« Juste. » ou « La réponse est : feu. »), une phrase d'explication, un lien vers la source. Ni son, ni couleur seule, ni animation de plus de 420 ms. Une réponse fausse n'est pas mise en scène.
- **(6) Fin.** Le résultat est une phrase. La liste des mots renvoie aux fiches. « À revoir » liste les mots manqués, sans commentaire.
- **(7) Mémoire.** Locale, dite comme telle, effaçable. Pas de compte.
- **Ce que le parcours n'a pas.** Ni points, ni niveaux, ni séries, ni insignes, ni chronomètre, ni classement, ni confettis. C'est une visite guidée avec des questions, pas un jeu.
- **Les dix mots.** *zaldrīzes, perzys, ānogar, dārys, dāria, muña, kepa, lentor, jēda, udir* : tous de statut `atteste` et `verifie_en_ligne: true` dans `lexicon.json` (critère C3.2).
- **Langue.** Tout le texte d'explication est en langue de lecture. Les rubriques « étape », « question », « répondre », « juste » n'ont pas de forme au lexique (**demande à l'agent 04**). *Gōnka* et *Hembār* existent.
- **Variantes.** V1 : une étape par page, on tourne. V2 : un parcours est une descente guidée du fil, les questions sur des stèles. V3 : lecture à gauche, question à droite, comme dessiné.

---

## W13 — Création de la bibliothèque et colophon

Adresse : `about/index.html`.

### Bureau

```text
+--------------------------------------------------------------------------------------------------+
| {S}                                      Iderenna    {c} Korjās    [HV] · FR · EN    Nūmāzma [x] |
+--------------------------------------------------------------------------------------------------+
|                                   K E S O   J Ā E L I O   B Ē                                (1) |
|                                 *À propos de cette bibliothèque*                                 |
+------------------------+-------------------------------------------------------------------------+
| SOMMAIRE           (2) | LA BIBLIOTHÈQUE                                                         |
|                        | TEXTE EN FRANÇAIS · pourquoi ? >                                        |
| La bibliothèque        | Un fonds valyrien consulté à distance. ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~ |
| Le sceau               | ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~   |
| Note sur la langue     | ----------------------------------------------------------------------- |
| Méthode et sources     | LE SCEAU                                                                |
| Les trois versions     | La chandelle de verre, l'amande, les quatorze flammes. ~~~~~~~~~~~~~~~~ |
| Fabrication            | ----------------------------------------------------------------------- |
| Colophon               | NOTE SUR LA LANGUE                                                  (3) |
|                        | Le haut valyrien est une langue construite par David J. Peterson. Son   |
|                        | lexique publié ne contient pas le vocabulaire d'un historien. Cette     |
|                        | bibliothèque écrit en valyrien ce qui peut l'être avec certitude et     |
|                        | donne le reste dans votre langue.                                       |
|                        |                                                                         |
|                        |   ATTESTÉ      56    mot ou forme relevés dans une source               |
|                        |   DÉRIVÉ       15    flexion régulière d'un mot attesté                 |
|                        |   COMPOSÉ ICI  15    assemblé ou étendu pour cette bibliothèque         |
|                        |   GRAPHIE DE MARTIN  1    nom laissé tel quel                           |
|                        |   À CONFIRMER  11    formes non revérifiées, signalées une à une        |
|                        |                                                                         |
|                        | Le lexique complet >        Les sources linguistiques >                 |
|                        | ----------------------------------------------------------------------- |
|                        | MÉTHODE ET SOURCES     Livres, adaptations, interprétations ~~~~~~~~ >  |
|                        | LES TROIS VERSIONS     Voir la comparaison >                            |
|                        | FABRICATION            Polices, licences, outils ~~~~~~~~~~~~~~~~~~~~~~~|
|                        | ----------------------------------------------------------------------- |
|                        | COLOPHON                                                            (4) |
|                        |          ( monogramme J.D., 48 px )        ( grand sceau )              |
|                        |          Composé par J. D.  ·  2026                                     |
|                        |                                                                         |
|                        | [ Rejouer l'ouverture ]                                             (5) |
|                        | Œuvre non officielle, sans lien avec l'auteur, ses éditeurs ou les      |
|                        | producteurs des adaptations.                                        (6) |
+--------------------------------------------------------------------------------------------------+
```

### Mobile

```text
+--------------------------------------+
| {S} Iderenna  {c} Korjās  [HV]·FR·EN |
+--------------------------------------+
|            KESO JĀELIO BĒ            |
|   *À propos de cette bibliothèque*   |
| [ Sommaire v ]                       |
+--------------------------------------+
| LA BIBLIOTHÈQUE                      |
| TEXTE EN FRANÇAIS · pourquoi ? >     |
| Un fonds valyrien consulté à         |
| distance. ~~~~~~~~~~~~~~~~~~~~~~~~~  |
+--------------------------------------+
| NOTE SUR LA LANGUE                   |
| Le haut valyrien est une langue      |
| construite par David J. Peterson.    |
| ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~  |
| ATTESTÉ                           56 |
| DÉRIVÉ                            15 |
| COMPOSÉ ICI                       15 |
| GRAPHIE DE MARTIN                  1 |
| À CONFIRMER                       11 |
| Le lexique complet                 > |
+--------------------------------------+
| COLOPHON                             |
|         ( monogramme J.D. )          |
|       Composé par J. D. · 2026       |
| [ Rejouer l'ouverture ]              |
| Œuvre non officielle. ~~~~~~~~~~~~~  |
+--------------------------------------+
```

- **Hiérarchie.** 1. ce qu'est la bibliothèque ; 2. le sceau ; 3. la note sur la langue ; 4. la méthode ; 5. la fabrication ; 6. le colophon, en dernier, comme dans un livre.
- **(1)** *Keso jāelio bē* : composition de la bibliothèque, forme non revérifiée (état E3).
- **(2) Sommaire.** Liens d'ancre. Collé sur bureau, liste déroulante sur mobile.
- **(3) Note sur la langue.** C'est la page où mène chaque « pourquoi ? » des mentions d'édition (UX 5.5). Ancre `#langue`. Les comptes viennent de `lexicon.json` à la construction, ils ne sont pas saisis à la main. Les onze formes à confirmer sont un sous-ensemble des 87, pas une cinquième catégorie.
- **(4) Colophon.** Seul endroit où le créateur est nommé (cahier artistique 5.6). Le nom complet et la formule sont à fournir par le commanditaire ; je n'écris que les initiales données.
- **(5)** Le rituel d'ouverture se rejoue ici, à la demande (UX 10.2).
- **(6) Mention.** Texte à valider par l'orchestrateur ; présent aussi en pied de toute page.
- **Langue.** Page presque entièrement en langue de lecture. Le monogramme est décoratif (`aria-hidden`) ; le nom est en texte.
- **Variantes.** V1 : dernière page du codex. V2 : dernière stèle, sous la huitième ère. V3 : un feuillet glissé dans le codex.

---

## W14 — Page d'erreur

Adresses : `/404.html` à la racine, et l'état « introuvable » à l'intérieur d'une page.

### Bureau

```text
+--------------------------------------------------------------------------------------------------+
| {S}                                      Iderenna    {c} Korjās    [HV] · FR · EN    Nūmāzma [x] |
+--------------------------------------------------------------------------------------------------+
|                                                                                                  |
|                              ( marque du sceau, chandelle éteinte )                              |
|                                                                                                  |
|                                 K E S I R   I L O S   D A O R .                              (1) |
|                                       *Ceci n'existe pas.*                                       |
|                                                                                                  |
|                         La page demandée n'est pas dans la bibliothèque.                     (2) |
|                        Adresse demandée : version-1/people/aegon-vii.html                        |
|                                                                                                  |
|                        {c} [ Korjās  *chercher*                        ]                     (3) |
|                                                                                                  |
|                 Fiches proches :   Āegon I >   ·   Aegon II >   ·   Aegon III >              (4) |
|                                                                                                  |
|             Remio *Portail* >          Iderenna *Index* >          Page précédente >             |
|                                                                                                  |
+--------------------------------------------------------------------------------------------------+
```

### Mobile

```text
+--------------------------------------+
| {S} Iderenna  {c} Korjās  [HV]·FR·EN |
+--------------------------------------+
|                                      |
|        ( chandelle éteinte )         |
|                                      |
|           KESIR ILOS DAOR.           |
|         *Ceci n'existe pas.*         |
|                                      |
| La page demandée n'est pas dans la   |
| bibliothèque.                        |
|                                      |
| {c} [ Korjās  *chercher*           ] |
|                                      |
| Fiches proches                       |
| Āegon I                            > |
| Aegon II                           > |
| Aegon III                          > |
+--------------------------------------+
| Remio *Portail*                    > |
| Iderenna *Index*                   > |
| Page précédente                    > |
+--------------------------------------+
```

- **Hiérarchie.** 1. le constat ; 2. la recherche ; 3. les fiches proches ; 4. les sorties.
- **(1)** `phrase.not_found`, composition de la bibliothèque. Glosée. C'est le titre de niveau 1 de la page.
- **(2)** La phrase d'explication est en langue de lecture, et l'adresse demandée est rappelée : le visiteur peut y repérer sa faute de frappe.
- **(3)** Le champ de recherche est ouvert et reçoit le focus.
- **(4) Fiches proches.** Calculées à partir du dernier segment de l'adresse, avec la tolérance de la recherche. Absentes si rien ne ressemble.
- **Chandelle éteinte.** L'état « éteint » du sceau dit l'absence sans dessin d'erreur. Elle s'accompagne toujours du texte.
- **Sans serveur.** En ouverture locale, il n'y a pas de page 404 : le navigateur affiche sa propre erreur. Cette page ne sert que sur un hébergement statique, et l'agent 09 doit régler ses liens (elle peut être servie à n'importe quelle profondeur).
- **Autres états d'erreur, dans la page et non sur une page à part :**

| Situation | Affichage |
|---|---|
| `?focus=` ou `?open=` inconnu | L'arbre s'ouvre sur son centre par défaut, avec une ligne : « Personne introuvable : *xyz*. » |
| Données de l'arbre ou index de recherche non chargés | Dans la zone : « L'arbre n'a pas pu être chargé. » · Réessayer · Voir la liste. La liste, en HTML, est toujours là. |
| Hors ligne | Les pages déjà chargées restent lisibles ; la recherche le dit si son index manque. |
| Script désactivé | Aucun message d'erreur : la page est lisible. Une ligne en pied : « Recherche et arbre dessiné demandent JavaScript. L'Index et les listes fonctionnent sans. » |
| Traduction manquante | « Not yet translated — shown in French. » au-dessus du texte (état E2). |

- **Langue.** En français : « Ceci n'existe pas. » en titre, *Kesir ilos daor.* dessous.

---

## W15 — Espace de comparaison des trois versions

Adresse : `/versions/index.html` (et `/index.html` tant que l'arbitrage n'est pas rendu). Hors des trois versions : page de travail, en langue de lecture.

### Bureau

```text
+--------------------------------------------------------------------------------------------------+
| {S}  Targārio Lentro Vestriarja  *Les Chroniques de la Maison Targaryen* Français · English  (1) |
+--------------------------------------------------------------------------------------------------+
|                                LES TROIS VERSIONS DE CET OUVRAGE                                 |
|            Mêmes contenus, mêmes adresses, même langue. Trois façons de s'y déplacer.        (2) |
+--------------------------------+--------------------------------+--------------------------------+
| VERSION 1                      | VERSION 2                      | VERSION 3                      |
| L E   C O D E X                | L A   L I G N É E              | L A   T A B L E   D ' É T U D E|
| On lit.                        | On parcourt.                   | On consulte.                   |
|                                |                                |                                |
| Unité      la page             | Unité      le nœud             | Unité      le document         |
| Geste      tourner             | Geste      descendre           | Geste      poser, croiser      |
| Arbre      planche             | Arbre      le fil              | Arbre      focale              |
| Temps      annales             | Temps      défilement          | Temps      réglette            |
| Surface    parchemin           | Surface    pierre              | Surface    les deux            |
|                                |                                |                                |
| [ Entrer dans la version 1 > ] | [ Entrer dans la version 2 > ] | [ Entrer dans la version 3 > ] |
| version-1/index.html           | version-2/index.html           | version-3/index.html           |
+--------------------------------------------------------------------------------------------------+
|  LA MÊME PAGE DANS LES TROIS VERSIONS                                                        (3) |
| Portail                                          | V1 >          | V2 >          | V3 >          |
| Période V, la Danse des Dragons                  | V1 >          | V2 >          | V3 >          |
| Fiche d'événement : mort de Lucerys Velaryon     | V1 >          | V2 >          | V3 >          |
| Arbre centré sur Rhaenyra                        | V1 >          | V2 >          | V3 >          |
| Fiche de personnage : Aegon Ier                  | V1 >          | V2 >          | V3 >          |
| Fiche de dragon : Vhagar                         | V1 >          | V2 >          | V3 >          |
| Lexique                                          | V1 >          | V2 >          | V3 >          |
| Une étape de parcours                            | V1 >          | V2 >          | V3 >          |
+--------------------------------------------------------------------------------------------------+
|  GRILLE DE COMPARAISON                                                                       (4) |
|  1. Atteindre une fiche donnée : gestes, temps.        3. Tenue à 360 px.                        |
|  2. Comprendre la navigation sans aide.                4. Ce que l'on retient après dix minutes. |
|  Imprimer la grille >                                                                            |
+--------------------------------------------------------------------------------------------------+
```

### Mobile

```text
+--------------------------------------+
| {S} Targārio Lentro Vestriarja       |
|     Français · English               |
+--------------------------------------+
|          LES TROIS VERSIONS          |
|            DE CET OUVRAGE            |
| Mêmes contenus, mêmes adresses.      |
| Trois façons de s'y déplacer.        |
| ==================================== |
| VERSION 1 · LE CODEX                 |
| On lit.                              |
| Unité : la page · Geste : tourner    |
| Arbre : planche · Temps : annales    |
| [ Entrer dans la version 1       > ] |
| ------------------------------------ |
| VERSION 2 · LA LIGNÉE                |
| On parcourt.                         |
| Unité : le nœud · Geste : descendre  |
| Arbre : le fil                       |
| [ Entrer dans la version 2       > ] |
| ------------------------------------ |
| VERSION 3 · LA TABLE D'ÉTUDE         |
| On consulte.                         |
| Unité : le document                  |
| Geste : poser, croiser               |
| [ Entrer dans la version 3       > ] |
| ==================================== |
| LA MÊME PAGE DANS LES 3 VERSIONS     |
| Portail             V1 >  V2 >  V3 > |
| Période V           V1 >  V2 >  V3 > |
| Mort de Lucerys     V1 >  V2 >  V3 > |
| Arbre : Rhaenyra    V1 >  V2 >  V3 > |
| Aegon Ier           V1 >  V2 >  V3 > |
| Vhagar              V1 >  V2 >  V3 > |
| Lexique             V1 >  V2 >  V3 > |
+--------------------------------------+
```

- **Hiérarchie.** 1. les trois versions côte à côte, à égalité ; 2. les mêmes pages dans chacune ; 3. la grille.
- **(1) Langue.** Deux positions seulement : cette page est un document de travail, hors de la bibliothèque. Seul le titre du site est en valyrien. Le choix fait ici vaut ensuite dans les trois versions (mémoire commune).
- **(2)** Une phrase dit ce qui ne change pas. Elle évite au lecteur de chercher des différences de contenu qui n'existent pas.
- **Les trois colonnes.** Même gabarit, même longueur, même bouton. Aucune n'est mise en avant. Les noms sont les noms de travail du cahier artistique ; leurs équivalents valyriens restent à demander à l'agent 04. Sous chaque bouton, l'adresse en clair.
- **(3) La même page dans les trois versions.** C'est l'outil de comparaison réel : huit pages de référence, un lien par version. Il n'existe que parce que les trois versions partagent leurs adresses (UX 1). Je recommande de comparer en ouvrant deux onglets ou deux fenêtres ; je n'ai pas retenu l'affichage côte à côte par cadres incorporés, qui montrerait deux mises en page de tablette au lieu de deux mises en page de bureau.
- **(4) Grille.** Les critères de confirmation du cahier artistique (8.3), imprimables. Pas de formulaire : le site n'a pas de serveur pour le recevoir.
- **Dans chaque version.** Le pied de toute page porte « Cette page dans : V1 · V2 · V3 », qui garde le chemin et change le préfixe.
- **Mobile.** Les trois versions sont empilées, dans l'ordre 1, 2, 3 ; le tableau des pages garde une ligne par page.
- **Après l'arbitrage.** La racine du site mène à la version retenue ; cette page reste à `/versions/`.

---

## Annexe A — Jeu d'essai de la recherche (critère Q-09)

La fiche attendue doit figurer dans les trois premières suggestions, quelle que soit la langue affichée.

| # | Saisie | Fiche attendue | Ce qui est éprouvé |
|---|---|---|---|
| 1 | `aegon` | Aegon Ier (affiché *Āegon I*) | Macron absent ; premier des homonymes |
| 2 | `AEGON 2` | Aegon II | Casse ; chiffre arabe pour romain |
| 3 | `rhaenrya` | Rhaenyra | Inversion de deux lettres |
| 4 | `danaerys` | Daenerys | Inversion de deux lettres |
| 5 | `vhagar` | Vhagar (affiché *Vagar*) | Graphie de Martin vers graphie valyrienne |
| 6 | `vagar` | Vhagar | Graphie valyrienne |
| 7 | `caraxes` | Caraxes (affiché *Karakses*) | c et x pour k et ks |
| 8 | `syrax` | Syrax (affiché *Syraks*) | Idem |
| 9 | `zaldrizes` | Mot *zaldrīzes* | Macron absent |
| 10 | `gurenagon` | Mot *gūrēñagon* | Macrons et tilde absents |
| 11 | `valar morghulis` | Expression *Valar morghūlis* | Macron absent, deux mots |
| 12 | `port real` | Port-Réal | Tiret et accent absents |
| 13 | `kings landing` | Port-Réal | Nom anglais, apostrophe absente |
| 14 | `peyredragon` | Peyredragon (affiché *Zaldrīzdōron*) | Nom français vers forme valyrienne |
| 15 | `dragonstone` | Peyredragon | Nom anglais |
| 16 | `oeildieu` | L'Œildieu (lieu) et la bataille | Ligature absente |
| 17 | `feu et sang` | *Fire & Blood* (source) et la devise | Titre français d'une source |
| 18 | `fire and blood` | *Fire & Blood* | « and » pour « & » |
| 19 | `129` | Les sept événements de l'an 129 AC | Recherche par année |
| 20 | `conquerant` | Aegon Ier | Surnom, accent absent |

## Annexe B — Rubriques sans forme valyrienne relevées sur ces écrans

Demande à l'agent 04. La consigne est celle de son propre rapport : une forme attestée ou régulière si elle existe, sinon rien. Une rubrique sans forme reste dans la langue de lecture ; aucune ne doit être inventée pour remplir cette liste.

| Priorité | Rubriques | Où |
|---|---|---|
| **1 — sur presque tous les écrans** | Notation d'ère (avant / après la Conquête ; les agents 02 et 03 n'emploient pas la même en français : « AC » et « apr. C. ») · « filtrer » · « résultats » · « sources de cette fiche » · « texte en français » · « mots valyriens de cette page » | W00, W03 à W11 |
| **2 — navigation d'un espace** | « en bref », « annales », « figures » · « lexique », « expressions », « grammaire » · « carte », « liste » · « registres » | W00, W03, W09, W10 |
| **3 — rubriques de fiche** | « faits », « qui », « causes », « conséquences » · « parents », « fratrie », « union », « génération » · « écailles », « éclosion », « fin », « combats » · « prétendant », « chefs », « alliés », « issue » · « auteur », « nature », « fiabilité » | W04 à W08, W11 |
| **4 — parcours** | « étape », « question », « répondre », « juste », « recommencer » | W12 |
| **5 — titres** | Noms valyriens des trois versions · un incipit par période (une à trois phrases, avec analyse mot à mot) | W03, W15 |

Deux besoins liés, déjà signalés par l'agent 04 lui-même : l'ordre des naissances, pour choisir entre les mots « frère aîné » et « frère cadet » ; et la traduction des exemples cités dans les fiches de mots.

## Annexe C — Part de valyrien par écran, en mode valyrien

Estimation à l'œil sur ces dessins, pour donner la mesure de ce que voit réellement le visiteur. Ce n'est pas un comptage.

| Écran | Ce qui est valyrien | Ce qui ne l'est pas |
|---|---|---|
| Seuil | Tout, sauf les gloses et les noms des langues. | — |
| Portail | Titre, incipit, dix-sept entrées de table, barre. | Bornes chronologiques. |
| Période | Titre, barre, « Jēda », noms de lieux validés. | Résumé, onglets, filtres, titres d'événements. |
| Fiche d'événement | Rubriques de tête, noms de dragons validés, précédent / suivant. | Titre, récit, intitulés de sections. |
| Arbre | Rubriques de parenté, noms validés. | Intitulés « parents », « fratrie », « union ». |
| Fiche de personnage | Titre, nom, neuf rubriques d'identité. | Récit, intitulés de sections. |
| Dragons | Titre, noms validés. | En-têtes de table (tant qu'ils ne sont pas tous traduisibles). |
| Guerre | Rubrique, titre. | Camps, batailles, issue. |
| Lieux | Titre, noms validés. | Natures, filtres. |
| Langue | Titre, les mots eux-mêmes. | Toutes les explications. |
| Sources | Titre. | Tout le reste. |
| Parcours | Les mots étudiés, précédent / suivant. | Consignes, questions. |

Lecture : le valyrien domine le seuil et le portail, tient les têtes de fiche, et s'efface dans les espaces d'explication. C'est la conséquence directe de la règle « le valyrien rubrique, la langue du visiteur raconte ». Si l'orchestrateur attend davantage de valyrien à l'écran, le seul moyen honnête est d'enrichir le lexique validé (annexe B), pas d'assouplir la règle.
