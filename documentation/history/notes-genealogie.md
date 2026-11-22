# Notes de généalogie — Maison Targaryen

Agent 03 (généalogiste) · 13 novembre 2026 · continuité : **livres uniquement**

Fichiers décrits : `content/genealogy/genealogy.json`, `content/genealogy/succession.json`, `content/genealogy/validate-genealogy.mjs`.
Tous les chiffres de cette note sortent du script de validation, exécuté sur les données livrées (0 erreur).

Abréviations des sources : **F&B** = *Fire & Blood* (`fab`) · **TWOIAF** = *The World of Ice & Fire* (`twoiaf`) · **ASOIAF** = romans du cycle (`asoiaf`) · **D&E** = nouvelles de Dunk et l'Œuf (`dunk-egg`) · **TROTD** = *The Rise of the Dragon* (`trotd`) · **AWOIAF** = *A Wiki of Ice and Fire*, utilisé comme outil de recoupement, jamais comme source primaire.

---

## 1. Ce que contient le graphe

| | Nombre |
|---|---|
| Personnes | 176 (103 Targaryen, 14 Velaryon, 8 Feunoyr, 7 Baratheon, 44 conjoints et alliés d'autres maisons) |
| Unions | 69 (57 mariages, 11 liaisons, 1 fiançailles) |
| Filiations | 132 (124 établies, 7 contestées, 1 incertaine) |
| Générations | 21, de 0 (Aenar) à 20 (enfants de Rhaegar, Rhaego) ; Daenerys est à la génération 19 |
| Rois du Trône de Fer | 18 (17 Targaryen + Robert Baratheon, inclus pour clore la table des successions) |
| Prétendants (champ `pretender`) | 8 |

Trois niveaux de certitude, appliqués aux unions et aux filiations :

- **etabli** — affirmé par les sources sans réserve sérieuse. Une rumeur restée sans suite est mentionnée dans `noteFr` sans changer le niveau (cas d'Aenys Ier).
- **conteste** — une filiation officielle existe, mais les sources nomment un autre père possible. Le père officiel reste dans `father` ; l'autre est dans `allegedFather`.
- **incertain** — la relation n'est rapportée que par la rumeur, ou les sources ne permettent pas de la qualifier.

Règle de calcul des générations : 1 + la plus grande génération des deux parents. Un enfant n'est donc jamais sur la même rangée qu'un de ses parents, même quand un oncle épouse sa nièce.

---

## 2. Filiations et unions incertaines ou contestées

### 2.1 Contestées (7 filiations, 4 dossiers)

| Enfant(s) | Père officiel | Père allégué | Ce que disent les sources |
|---|---|---|---|
| **Jacaerys, Lucerys, Joffrey Velaryon** | ser Laenor Velaryon | ser Harwin Strong | F&B : fils de Laenor selon Rhaenyra, Laenor, Corlys et le roi Viserys Ier, qui menace d'arracher la langue à quiconque dirait le contraire. La cour soupçonne Harwin Strong, bouclier lige de la princesse : les trois garçons ont cheveux et yeux bruns, leurs deux parents les traits valyriens. L'accusation est reprise par Aemond, par les Verts et par les cousins Velaryon. AWOIAF conclut que « la filiation réelle reste incertaine ». Enjeu : la légitimité de la descendance de Rhaenyra, donc la Danse. |
| **Daeron II** | Aegon IV | Aemon le Chevalier-Dragon (frère du roi) | TWOIAF, D&E : Aegon IV laisse entendre, à la fin de son règne, que Daeron serait né de la reine Naerys et d'Aemon. D'après mestre Kaeth (*Vies de quatre rois*), le roi a lui-même lancé la rumeur, d'abord par l'accusation de ser Morgil Hastwyck, qu'Aemon tue en duel judiciaire. Aegon IV ne désavoue jamais formellement son fils. Les partisans de Daemon Feunoyr traitent Daeron de « faux-né ». Ni prouvé ni réfuté. Enjeu : les cinq rébellions Feunoyr, et toute la lignée royale jusqu'à Daenerys, qui descend de Daeron II. |
| **Addam et Alyn Velaryon** (de Hull) | ser Laenor Velaryon | lord Corlys Velaryon | F&B : leur mère Marilda de Hull les déclare fils de Laenor. Le bouffon Champignon (Mushroom) affirme que le père est Corlys, qui les aurait tenus à l'écart du vivant de son épouse Rhaenys ; Gyldayn penche pour cette version. Légitimés par Rhaenyra à la demande de Corlys. Non tranché. |
| **Viserys Plumm** | lord Ossifer Plumm | Aegon IV (alors prince) | TWOIAF (« Les sœurs de Baelor Ier ») et *A Feast for Crows* (Cersei III) : la rumeur veut qu'Ossifer soit mort avant de consommer son mariage avec Elaena Targaryen et que l'enfant soit du cousin d'Elaena. Jamais établi. |

### 2.2 Incertaines

| Relation | Ce que disent les sources |
|---|---|
| **Orys Baratheon, fils d'Aerion Targaryen** (filiation) | TWOIAF, F&B, ASOIAF : demi-frère bâtard d'Aegon Ier *selon la rumeur*. Jamais confirmé ; mère inconnue. AWOIAF écrit « Aerion Targaryen (rumored) ». |
| **Rhaenyra et Harwin Strong** (liaison) | F&B : rapportée par la rumeur de cour et les chroniqueurs, jamais reconnue. |
| **Rhaegar et Lyanna Stark** (liaison) | ASOIAF, TWOIAF : Rhaegar la couronne reine d'amour et de beauté à Harrenhal (281) puis part avec elle. Enlèvement pour les Stark et Robert, amour partagé selon d'autres. Les livres parus n'établissent ni la nature exacte de la relation, ni un mariage, ni un enfant. |

### 2.3 Établies, mais accompagnées d'une rumeur ou d'une réserve

- **Aenys Ier, fils d'Aegon Ier et Rhaenys.** F&B rapporte une rumeur de cour : l'enfant, chétif, serait né d'un des chanteurs ou comédiens de l'entourage de Rhaenys. La rumeur s'éteint quand il se lie au dragon Quicksilver. Aucune source ne la reprend à son compte.
- **Daemon Feunoyr, fils d'Aegon IV et de Daena.** Daena refuse d'abord de nommer le père ; Aegon IV reconnaît l'enfant des années plus tard en lui remettant l'épée Feunoyr. Paternité admise par toutes les sources.
- **Aegon et Elaena de Peyredragon.** TWOIAF dit qu'ils « régnèrent ensemble » et parle de « leur fils Maegon » : l'union est établie par la filiation, la cérémonie n'est pas décrite.
- **Gaemon et Daenys.** Frère et sœur, enfants d'Aenar. Aenar ayant plusieurs épouses (non nommées), rien ne dit s'ils ont la même mère : le graphe les relie au seul père.
- **Aemond et Alys Rivers.** La liaison est établie (F&B). Alys se dit ensuite sa veuve et présente un garçon comme leur fils légitime : mariage et enfant non confirmés ; l'enfant, non nommé, n'est pas dans le graphe.
- **Aegor Rivers et Calla Feunoyr.** Enregistré comme **fiançailles** : le texte dit que Calla lui est promise. L'infobox d'AWOIAF la donne comme épouse ; la célébration n'est pas attestée.
- **Aegon, fils de Rhaegar.** Tué en 283 selon la version reçue. Dans *A Dance with Dragons*, « Griff le Jeune » est présenté comme ce prince, sauvé par substitution. Identité contestée, non tranchée : le graphe garde une seule personne, avec la réserve en note.
- **Brynden Rivers.** *A Dance with Dragons* l'identifie à la corneille à trois yeux, encore en vie en 300 (`alive: true`).

### 2.4 Prétentions de filiation volontairement exclues du graphe

Ces personnes ou ces enfants sont cités par les sources, mais sans nom ou sans filiation vérifiable. Ils ne sont pas enregistrés.

- Les trois fils bâtards de **Saera** présentés au Grand Conseil de 101 (non nommés, pères différents).
- La fille cadette de **Gaemon et Daenys**, mariée à un petit seigneur (non nommée).
- **Trystane Truefyre**, bâtard prétendu de Viserys Ier, et **Gaemon Palehair**, bâtard prétendu d'Aegon II (prétendants de l'année 130).
- Le fils prétendu d'**Aemond** et d'Alys Rivers.
- L'enfant que **Mysaria** attendait de Daemon (perdu en mer) ; l'enfant que **Nettles** aurait porté (simple allégation).
- Les enfants morts sans nom : fils de Viserys Ier et d'Aemma mort au berceau ; fils mort-né de Daemon et Laena (120) ; mort-nés de Maegor ; jumeaux de Naerys (161), jumeau mort-né de Daenerys (172), dernier enfant de Naerys ; fils mort-nés de Valarr et Kiera ; fausses couches et mort-né (270) de Rhaella.
- Les autres maîtresses d'**Aegon IV** (Falena Stokeworth, Megette, Cassella Vaith, Bellegere Otherys, Bethany Bracken, Jeyne Lothston) et leurs enfants : seules les quatre mères des enfants retenus sont dans le graphe. La paternité des enfants de Bellegere Otherys est elle-même douteuse.
- **Maelys Feunoyr** le Monstrueux et son cousin Daemon : « ascendance exacte inconnue » (AWOIAF). La branche Feunoyr s'arrête donc à Daemon III dans le graphe.
- Les six filles de **Rhaena** (fille de Daemon) et Garmund Hightower ; les enfants de **Daenerys** (fille d'Aegon IV) et Maron Martell ; les parents de **Daenaera Velaryon** (Daeron Velaryon et Hazel Harte) ; **Cassana Estermont**, Stannis et Renly Baratheon.

---

## 3. Homonymes dangereux et convention d'identifiants

### 3.1 Convention

1. **Monarque ayant régné sur le Trône de Fer** : prénom + numéro en chiffres romains minuscules — `aegon-i`, `jaehaerys-ii`. Un numéro ne désigne jamais un prétendant : Viserys « III » est `viserys-fils-aerys-ii`.
2. **Prénom unique dans la maison Targaryen du graphe** : prénom seul — `rhaenyra`, `daemon`, `alysanne`, `naerys`, `rhaegar`.
3. **Homonyme** : prénom + `fils`/`fille` + identifiant du père (de la mère si le père n'est pas Targaryen) — `aegon-fils-aenys-i`, `rhaena-fille-daemon`, `visenya-fille-rhaenyra`.
4. **Seigneurs de Peyredragon d'avant la Conquête** portant un prénom réutilisé : suffixe `-peyredragon` — `aegon-peyredragon`, `aerys-peyredragon`, `baelon-peyredragon`.
5. **Autres maisons et bâtards** : prénom + nom — `laena-velaryon`, `daemon-ii-blackfyre`, `aegor-rivers`, `shiera-seastar`. Les identifiants gardent le nom anglais (stable) ; le nom français est dans `nameFr` (Feunoyr, Astre-des-mers).
6. **Deux exceptions**, fixées par l'exemple du cahier des charges : `rhaenys` et `visenya` désignent les sœurs-épouses du Conquérant. Leurs homonymes sont toujours suffixés.
7. **Unions** : `u-` + les deux identifiants.

### 3.2 Les pièges

| Prénom | Nb | Identifiants | Risque |
|---|---|---|---|
| **Aegon** | 12 | `aegon-peyredragon`, `aegon-i`, `aegon-fils-aenys-i` (l'héritier évincé), `aegon-fils-jaehaerys-i` (mort à trois jours), `aegon-fils-baelon`, `aegon-ii`, `aegon-iii`, `aegon-iv`, `aegon-blackfyre`, `aegon-v`, `aegon-fils-aerys-ii`, `aegon-fils-rhaegar` | Le plus grave. Cinq rois, sept non-rois. « Aegon le Jeune » = Aegon III pendant la Danse ; « Aegon l'Aîné » = Aegon II. Griff le Jeune se dit `aegon-fils-rhaegar`. |
| **Daeron** | 6 | `daeron-fils-viserys-i`, `daeron-i`, `daeron-ii`, `daeron-fils-maekar-i` (l'Ivrogne), `daeron-fils-aegon-v`, `daeron-fils-aerys-ii` | Deux rois. Kiera de Tyrosh épouse le fils de Maekar, pas un roi. |
| **Viserys** | 5 | `viserys-fils-aenys-i`, `viserys-i`, `viserys-ii`, `viserys-plumm`, `viserys-fils-aerys-ii` | « Viserys III » n'a jamais régné. |
| **Aemon** | 4 | `aemon-fils-jaehaerys-i` (héritier mort en 92), `aemon-fils-viserys-ii` (le Chevalier-Dragon), `aemon-blackfyre`, `aemon-fils-maekar-i` (mestre Aemon) | Trois Aemon importants, aucun roi. |
| **Jaehaerys** | 4 | `jaehaerys-i`, `jaehaerys-fils-aegon-ii` (tué en 129), `jaehaerys-ii`, `jaehaerys-fils-aerys-ii` | Jaehaerys / Jaehaera sont jumeaux. |
| **Daemon** | 4 | `daemon`, `daemon-i-blackfyre`, `daemon-ii-blackfyre`, `daemon-iii-blackfyre` | Le prince Daemon (mort en 130) n'est pas un Feunoyr. |
| **Rhaenys** | 3 | `rhaenys` (sœur du Conquérant), `rhaenys-fille-aemon` (la Reine qui ne fut jamais), `rhaenys-fille-rhaegar` | |
| **Rhaena** | 3 | `rhaena-fille-aenys-i`, `rhaena-fille-daemon`, `rhaena-fille-aegon-iii` | |
| **Daenerys** | 3 | `daenerys-fille-jaehaerys-i`, `daenerys-fille-aegon-iv`, `daenerys-fille-aerys-ii` | Aucune n'a l'identifiant nu `daenerys`. |
| **Baelon** | 3 | `baelon-peyredragon`, `baelon-fils-jaehaerys-i`, `baelon-fils-viserys-i` | À ne pas confondre avec **Baelor** (`baelor-i`, `baelor-fils-daeron-ii`). |
| **Aerys** | 3 | `aerys-peyredragon`, `aerys-i`, `aerys-ii` | |
| **Laena** | 3 | `laena-velaryon`, `laena-velaryon-fille-alyn`, `laena-penrose` | |
| En double | 2 | Gaemon, Elaena, Aerion, Visenya, Aenys, Maegor, Alyssa, Vaella, Rhaella, Daella, Baelor, Jocelyn, Jeyne | |

Familles de prénoms voisins, à relire lettre à lettre dans tout texte :

- **Rhae-** : Rhaena, Rhaenys, Rhaenyra, Rhaella, Rhaelle, Rhae, Rhaegel, Rhaegar, Rhaego.
- **Dae-** : Daenys, Daena, Daenaera, Daenora, Daenerys, Daella, Daemon, Daemion, Daeron.
- **Ae-** : Aenar, Aenys, Aegon, Aegor, Aelyx, Aelor, Aelora, Aemon, Aemond, Aemma, Aerea, Aerion, Aerys.
- **Mae-** : Maegon, Maegor, Maegelle, Maekar, Maelor.
- **Va- / Vi-** : Vaella, Vaegon, Valerion, Valarr, Valaena, Visenya, Viserra, Viserys.
- **Al-** : Alyssa, Alysanne, Alys (trois), Alicent, Alyn.
- **Elaena / Helaena / Laena / Laenor** ; **Baelon / Baelor / Baela**.

---

## 4. Relations propres aux adaptations (hors graphe)

Liste dressée de mémoire des séries ; elle n'a pas été vérifiée en ligne pendant la session, sauf le premier point.

**House of the Dragon**

- **Elaena, épouse d'Aenar et mère de Daenys** : nom tiré d'un livre-accessoire de la série (signalé par AWOIAF). Les livres ne nomment aucune épouse d'Aenar.
- **Harwin Strong, père des trois fils aînés de Rhaenyra** : la série le montre sans ambiguïté. Les livres laissent la question ouverte (voir 2.1).
- **Addam et Alyn, fils de Corlys** : la série tranche. Les livres rapportent deux versions (voir 2.1).
- **Rhaenyra et Criston Cole** : liaison montrée à l'écran. Dans F&B, les récits de septon Eustace et de Champignon se contredisent et aucune liaison n'est établie.
- **Alicent Hightower et Criston Cole** : liaison propre à la série.
- **Maelor**, troisième enfant d'Aegon II et Helaena : absent des deux premières saisons.
- **Laenor Velaryon** : survit dans la série ; meurt en 120 dans les livres.
- Les âges sont décalés (Rhaenyra et Alicent ont le même âge à l'écran ; neuf ans d'écart dans les livres) : ne reprendre aucune date de la série.

**Game of Thrones**

- **Jon Snow, né Aegon Targaryen, fils de Rhaegar et de Lyanna Stark**, après annulation du mariage avec Elia et mariage secret : établi par la série seulement. Dans les livres parus, Jon est le fils bâtard d'Eddard Stark ; l'hypothèse n'y est ni confirmée ni infirmée.
- **Daenerys et Jon Snow** : liaison propre à la série.
- **Aerys II, fils d'Aegon V** : la série supprime Jaehaerys II. Dans les livres, Aerys II est le petit-fils d'Aegon V.
- **Daenerys et Hizdahr zo Loraq** : simples fiançailles à l'écran ; mariage célébré dans les livres (300).

---

## 5. Analyse : peut-on représenter la lignée comme un fil vertical unique ?

Question du directeur artistique : une des trois versions du site veut un seul fil continu que l'on descend, du premier ancêtre à Daenerys.

### 5.1 Les comptes

**La couronne ne suit pas la filiation.** Entre les 17 rois Targaryen, il y a 16 passages de couronne.

- 9 vont de parent à enfant.
- **7 ne vont pas de parent à enfant** : Aenys Ier → Maegor Ier (demi-frère), Maegor Ier → Jaehaerys Ier (neveu), Jaehaerys Ier → Viserys Ier (petit-fils), Aegon II → Aegon III (neveu), Daeron Ier → Baelor Ier (frère), Baelor Ier → Viserys II (oncle), Aerys Ier → Maekar Ier (frère).
- En comptant la chute de 283 (Aerys II → Robert Baratheon, cousin), 8 passages sur 17.
- S'y ajoute l'aller-retour de 130 (Aegon II → Rhaenyra → Aegon II), réel mais absent des listes officielles.
- Sur les 9 passages de parent à enfant, 4 seulement vont à un fils aîné ou unique sans contestation (Aenys Ier, Daeron Ier, Aegon IV, Aerys II). Les autres passent à un fils cadet (Aerys Ier, Aegon V, Jaehaerys II) ou sont disputés (Aegon II, Daeron II).
- 6 passages officiels sur 17 sont contestés par un prétendant nommé ; 2 sont réglés par un Grand Conseil, 4 par la guerre, 1 par usurpation.

La rangée de génération du roi, dans l'ordre des règnes : 6, 7, 7, 8, **10**, 11, 12, 13, 13, **12**, 13, 14, 15, 15, 16, 17, 18. La couronne saute une génération (de 8 à 10 en 103), stagne trois fois, et **remonte une fois** (de Baelor Ier, génération 13, à son oncle Viserys II, génération 12, en 171). Un fil vertical qui suivrait la couronne devrait donc repartir vers le haut.

**Les unions referment l'arbre sur lui-même.** Sur 69 unions, 23 lient deux proches parents présents dans l'arbre :

- **13 unions entre frère et sœur** (toutes des mariages) : Gaemon + Daenys, Aegon + Elaena de Peyredragon, Aegon Ier + Visenya, Aegon Ier + Rhaenys, Aegon + Rhaena (enfants d'Aenys Ier), Jaehaerys Ier + Alysanne, Baelon + Alyssa, Aegon II + Helaena, Baelor Ier + Daena (dissous), Aegon IV + Naerys, Aelor + Aelora, Jaehaerys II + Shaera, Aerys II + Rhaella.
- 1 liaison entre demi-frère et demi-sœur : Brynden Rivers + Shiera Astre-des-mers.
- **4 unions entre oncle ou tante et neveu ou nièce** : Daemon + Rhaenyra (oncle germain) ; puis, par demi-fratrie, Maegor Ier + Rhaena, Aemon + Jocelyn Baratheon (demi-tante), Aegor Rivers + Calla Feunoyr (fiançailles).
- 5 unions entre cousins germains : Viserys Ier + Aemma Arryn, Aegon III + Jaehaera, Baela + Alyn Velaryon, Aerion + Daenora, et la liaison Aegon IV + Daena.

Conséquence mesurée : il existe **640 chemins de filiation distincts d'Aenar à Daenerys**, longs de 18 ou 19 générations, pour seulement 37 ancêtres distincts dans le graphe. Ce n'est pas un arbre : c'est une tresse.

**Les unions multiples.** 16 personnes ont plusieurs unions, dont 12 plusieurs mariages : Maegor Ier (6), Aegon IV (5, dont 4 liaisons), Daemon (4), Elaena fille d'Aegon III (4), Rhaena fille d'Aenys Ier (3), Rhaenyra (3), Daenerys (3), puis Aegon Ier, Alyssa Velaryon, Viserys Ier, Rhaena fille de Daemon, Alyn Velaryon, Aegon III, Daena, Kiera de Tyrosh et Rhaegar (2 chacun).

**La largeur.** La génération la plus large compte **18 personnes** (génération 14 : Daeron II, sa sœur, les Grands Bâtards, les enfants d'Elaena, les conjoints). En ne gardant que les personnes nées dans l'arbre, le maximum est de **15** (génération 9 : les treize enfants de Jaehaerys Ier et Alysanne, plus Aerea et Rhaella). La plus grande fratrie est de 13. À l'inverse, les générations 0 à 5 comptent 1 à 3 personnes, et la génération 18 n'en compte que 3.

### 5.2 Verdict

**Le fil unique est tenable si le fil est la filiation, pas la couronne — et s'il est un axe, pas l'arbre entier.**

Il existe bien une ligne de filiation ininterrompue d'Aenar à Daenerys. Par les pères seuls, elle compte 19 personnes. Mais le mariage de Daemon avec sa nièce Rhaenyra lui fait enjamber deux rangées d'un coup. La variante que je recommande passe par Viserys Ier et Rhaenyra : **20 personnes, 19 liens, exactement une rangée par pas** :

> Aenar → Gaemon → Aegon → Aerys → Daemion → Aerion → **Aegon Ier** → **Aenys Ier** → **Jaehaerys Ier** → Baelon → **Viserys Ier** → Rhaenyra → **Viserys II** → **Aegon IV** → **Daeron II** → **Maekar Ier** → **Aegon V** → **Jaehaerys II** → **Aerys II** → Daenerys

Ce chemin est enregistré dans `genealogy.json` (champ `mainThread.ids`) et contrôlé par le script : chaque maillon est l'enfant du précédent et occupe la rangée suivante.

Ce fil porte 11 des 17 rois (en gras), plus Rhaenyra. Après la Conquête, il traverse deux personnes qui n'ont pas régné (Baelon ; Rhaenyra, que les listes officielles ne comptent pas) et se termine sur une troisième (Daenerys). Un seul de ses 19 liens est contesté dans les sources : Aegon IV → Daeron II (voir 2.1). Le site peut le dire à cet endroit ; c'est un fait de la lignée, pas un défaut du dessin.

Les **6 rois hors du fil** sont tous sur la même rangée qu'un maillon du fil : Maegor Ier (demi-frère d'Aenys Ier, rangée 7), Aegon II (demi-frère de Rhaenyra, rangée 11), Aegon III (frère de Viserys II, rangée 12), Daeron Ier et Baelor Ier (cousins germains d'Aegon IV, rangée 13), Aerys Ier (frère de Maekar Ier, rangée 15). La couronne ne s'éloigne donc jamais du fil de plus d'un écart latéral.

Ce qui n'est **pas** tenable : un fil unique qui prétendrait être à la fois la filiation et la succession, ou qui obligerait à afficher les 176 personnes le long d'une seule ligne.

### 5.3 Recommandation de dessin

1. **Fil principal = filiation**, sur le chemin de 20 personnes ci-dessus. Axe vertical = génération (champ `generation`), pas le temps. Une rangée par génération, un maillon par rangée.
2. **La couronne est une seconde couche**, dessinée par-dessus : un tracé d'or qui suit le fil quand le roi en fait partie, s'en écarte latéralement vers le frère, le demi-frère ou le cousin quand il n'en fait pas partie, puis revient. Chaque roi porte son numéro d'ordre (1 à 17), puisque l'ordre des règnes ne coïncide pas avec la descente : le numéro 10 (Viserys II) est une rangée au-dessus des numéros 8 et 9. Aux 7 ruptures, afficher le mode de `succession.json` (usurpation, Grand Conseil, guerre). L'épisode Rhaenyra de 130 se dessine comme un tracé d'or interrompu qui touche le fil sans s'y fixer.
3. **Une union consanguine est un nœud, jamais un doublon.** Aucune personne n'apparaît deux fois. Frère et sœur mariés sont sur la même rangée : les relier par une boucle horizontale fermée, et faire partir la descendance du nœud d'union, pas des personnes. Pour oncle et nièce (Daemon et Rhaenyra), placer le nœud sur la rangée de la plus jeune et y faire descendre un lien oblique depuis l'aîné. Les 13 mariages entre frère et sœur donnent au fil son motif : il se dédouble et se referme, comme une tresse. C'est fidèle aux données, et c'est plus juste qu'un arbre.
4. **Les fratries se replient.** Sur le fil, chaque maillon n'affiche que son conjoint et un compteur (« 13 enfants », « 6 unions »). L'ouverture déploie la fratrie en tiroir latéral. C'est indispensable sur mobile : 18 personnes de front ne tiennent pas dans 380 px, un fil avec tiroirs y tient.
5. **Les branches rivales sont des rameaux qui quittent le fil et que l'on voit s'éteindre ou revenir** :
   - les **Verts** (enfants d'Alicent) partent de Viserys Ier et s'éteignent à la rangée 12 avec Jaehaera (133) ;
   - les **Feunoyr** partent d'Aegon IV à la rangée 13, en teinte sombre, et se poursuivent jusqu'à Daemon III (236) ; au-delà, l'ascendance de Maelys est inconnue, le rameau doit s'effacer plutôt que se prolonger ;
   - les **Velaryon** entrent quatre fois par mariage (Valaena à la rangée 5, Alyssa à la 7, Corlys à la 10, Daenaera à la 12) : à dessiner comme un courant voisin qui rejoint le fil, pas comme une branche issue de lui ;
   - les **Baratheon** partent de Rhaelle (rangée 17) et prennent la couronne en 283 : le tracé d'or quitte alors définitivement le fil après Aerys II (rangée 18). Daenerys, à la rangée 19, termine le fil sans couronne.
6. **Les certitudes se voient.** Trait plein pour `etabli`, trait interrompu pour `conteste` (avec le père allégué en lien fantôme), pointillé pour `incertain`. Les liaisons se distinguent des mariages. Huit filiations et deux unions sont concernées ; une de ces filiations est sur le fil.
7. **Les dates manquantes ne se comblent pas.** 44 personnes n'ont aucune année, 43 n'ont que des années approchées ou bornées. Ne pas placer les personnes sur une échelle de temps continue : la rangée de génération suffit, et l'année s'affiche seulement quand elle existe.

Les deux autres versions du site peuvent adopter l'arbre large ou la frise chronologique ; pour celle-ci, le fil de filiation avec la couronne en surimpression est la forme qui ment le moins.
