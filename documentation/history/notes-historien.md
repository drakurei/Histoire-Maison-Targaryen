# Notes de l'historien

Agent 02, historien de la dynastie. Version du 13 novembre 2026.

Fichiers liés : `content/sources/sources.json`, `content/timeline/timeline.json`, `content/timeline/sovereigns.json`, `content/dragons/dragons.json`, `reports/agent-reports/agent-02-chronologie.md`.

Cette note dit comment lire les données historiques du musée, ce qui y est solide, ce qui ne l'est pas, et répond à la vérification demandée par la direction artistique sur les chandelles de verre (section 7).

---

## 1. Ce que sont nos sources

Tout ce que le musée affirme vient des ouvrages de George R. R. Martin. Ils sont de deux natures, et la différence commande la confiance qu'on leur accorde.

**Les récits directs.** Les cinq romans parus et les trois nouvelles de Dunk et l'Œuf sont racontés à hauteur de personnage. Ce qu'un personnage voit est fiable. Ce qu'il raconte du passé est un souvenir, souvent intéressé, parfois un rêve : la rébellion de Robert, la tour de la Joie et l'enfance de Daenerys ne nous sont connues que de cette façon.

**Les chroniques fictives.** *Fire & Blood*, *The World of Ice & Fire* et les trois récits parus en anthologie se présentent comme l'œuvre de mestres de l'univers. L'archimestre Gyldayn écrit longtemps après la Danse et confronte trois témoins partiaux : le septon Eustace, le Grand Mestre Munkun (qui suit Orwyle) et le bouffon Champignon. Il signale ses doutes et laisse plusieurs morts sans version arrêtée. Le mestre Yandel, lui, écrit pour plaire au roi du moment. La trame de ces chroniques est constante d'un ouvrage à l'autre ; les détails, les motifs et parfois les dates ne le sont pas.

Un wiki de lecteurs, *A Wiki of Ice and Fire*, a servi à contrôler les dates et à retrouver les chapitres. Il n'est jamais cité comme source d'un fait.

## 2. Deux continuités, jamais mêlées

| Continuité | Ce qu'elle contient | Valeur |
|---|---|---|
| `livres` | Les ouvrages de l'auteur | Fait autorité |
| `adaptation` | *Game of Thrones*, *House of the Dragon*, *A Knight of the Seven Kingdoms* (HBO) | Continuité distincte, sans autorité sur les livres |

Dans la chronologie, huit événements portent `continuity: "adaptation"`. Leur identifiant commence par `tv-`, leur niveau de fiabilité est `adaptation`, ils ne citent que des séries et sont rangés en fin de période. Aucun événement des livres ne cite une série, et inversement : le script de validation le contrôle.

Divergences relevées, à garder en tête pour tout texte public :

- **Le rêve d'Aegon.** La prophétie d'un hiver venu du Nord, transmise de roi à héritier, n'existe que dans *House of the Dragon*. Les livres ne donnent aucun motif certain à la Conquête.
- **Laenor Velaryon** meurt en 120 dans la chronique ; il survit dans la série.
- **Rhaenys à Fossedragon** lors du couronnement d'Aegon II : série seulement.
- **Les versions multiples.** La série montre une seule version là où la chronique en donne plusieurs (mort de Beesbury, Sang et Fromage, mort de Lucerys). Montrer n'est pas trancher : pour les livres, ces points restent ouverts.
- **Les âges et les délais** sont resserrés dans la série. Nos dates sont celles des livres.
- **Les couleurs de dragons.** Quand le texte ne décrit pas un dragon, la série lui invente une robe. Ces couleurs ne figurent jamais dans `colorFr` (voir section 6).
- **Tout ce qui suit le cinquième tome** dans *Game of Thrones* (filiation de Jon Snow, mort de Viserion et de Rhaegal, incendie de Port-Réal, mort de Daenerys) est propre à la série. Les livres s'arrêtent avec Daenerys dans la mer Dothrak.

## 3. Les niveaux de fiabilité

Cinq niveaux, définis dans `sources.json` et portés par chaque événement et chaque dragon.

| Identifiant | Libellé | Quand l'employer |
|---|---|---|
| `etabli` | Établi | Donné sans contradiction, le plus souvent par plusieurs ouvrages |
| `recit-unique` | Récit unique | Un seul ouvrage, un seul témoin ou la parole d'un seul personnage |
| `contradictoire` | Récits contradictoires | Les sources ou les témoins divergent ; on expose, on ne tranche pas |
| `legende` | Tradition ou légende | Passé lointain, prophétie, rumeur, spéculation d'un auteur de l'univers |
| `adaptation` | Propre à une adaptation | N'existe que dans une série |

Deux précisions de méthode.

Le niveau qualifie **le fait**, pas la date. Un fait peut être établi alors que sa date est approximative (les batailles de la Conquête) : la date a son propre champ, `dateCertainty`.

Un événement classé `etabli` peut contenir une part incertaine (un motif, un coupable). Elle est alors dite dans `reliabilityNoteFr`. Quand la part incertaine est le cœur de l'événement, il est classé `contradictoire`.

## 4. Conventions de datation

- Les années sont comptées depuis le sacre d'Aegon à Villevieille, et non depuis son débarquement, survenu deux ans plus tôt. « Après la Conquête » est donc une appellation commode plus qu'exacte.
- Il n'y a pas d'an 0. L'an 1 av. C. est suivi de l'an 1 AC.
- `year` est un nombre, négatif avant la Conquête, ou `null` quand aucune date n'existe. Dans ce cas, `sortYear` ne sert qu'à ranger l'événement à une place plausible.
- **Les romans principaux ne donnent aucune année.** Toutes les dates de 298 à 300 AC sont des reconstitutions de lecteurs. Elles sont marquées « approximative » sans exception. Il en va de même pour la naissance de Daenerys (284) et celle d'Aerys II (244).
- Les dates antérieures au Fléau sont des ordres de grandeur tirés de formules comme « il y a quelque cinq mille ans ».

## 5. Points contestés ou incertains

### Dates

| Point | État |
|---|---|
| Batailles de la Conquête (Harrenhal, Dernière Tempête, Champ de Feu, soumissions) | Situées en 2–1 av. C., sans date par bataille. Seuls le débarquement (2 av. C.) et le sacre (1 AC) sont datés. |
| Bataille du Gosier | 5e jour de 130 selon *Fire & Blood*, 129 selon *The World of Ice & Fire*. Nous suivons le premier et signalons l'écart. |
| Bataille du Trident | 283. Les premières impressions de *The World of Ice & Fire* donnaient 282 ; corrigé ensuite. |
| Tournoi de Harrenhal | 281, l'année du Printemps trompeur. Un résumé de fiche évoquait 280 ; la fiche consacrée au tournoi donne 281 et dit qu'il fut annoncé en 280. |
| Mariage de Jaehaerys et d'Alysanne | Mariage secret en 49, cérémonie publique vers 51 : deux dates pour un même mariage, selon ce que l'on compte. |
| Naissance de Vhagar (v. 52 av. C.) | Calcul de lecteurs, non une date écrite. |
| Naissance d'Aerys Ier et de Maekar Ier | Non données. Laissées à `null`. |
| Naissance de Rhaenys, sœur d'Aegon | Non contrôlée ; non inscrite. |
| Fin du Siècle de sang | « Environ un siècle » après 102 av. C. ; aucune date de fin. |

### Morts dont les récits divergent

| Qui | Ce qui est établi | Ce qui ne l'est pas |
|---|---|---|
| Aenys Ier (42) | Mort à Peyredragon | Maladie, ou poison de Visenya selon une rumeur |
| Maegor Ier (48) | Trouvé mort sur le Trône de Fer | Suicide ou meurtre, et par qui |
| Lyman Beesbury (129) | Mort lors du conseil vert | Gorge tranchée, défenestration ou cachot : trois versions |
| Helaena Targaryen (130) | Chute mortelle | Suicide ou meurtre |
| Daeron, fils de Viserys Ier (130) | Mort à la seconde bataille de Tumbleton | Trois versions |
| Syrax (130) | Tuée dans l'émeute de Port-Réal | Par qui : au moins cinq versions |
| Daemon Targaryen (130) | Tombé au-dessus de l'Œildieu | Corps jamais retrouvé ; survie dans les chansons |
| Aegon II (131) | Empoisonné | Par qui |
| Jaehaera Targaryen (133) | Chute d'une fenêtre | Suicide officiel, meurtre soupçonné |
| Baelor Ier (171), Viserys II (172) | Morts de jeûne et de maladie soudaine | Rumeurs d'empoisonnement |
| Le dernier dragon (153) | Date et description | Cause : rumeur visant Aegon III, accusation de Marwyn contre les mestres |
| Aegon, fils de Rhaegar (283) | Tenu pour tué lors du sac | Un personnage du cinquième tome affirme être lui |

### Filiations et motifs

- **Les trois fils aînés de Rhaenyra.** Fils de Laenor Velaryon en droit ; fils de Harwin Strong selon une rumeur que la chronique ne peut ni prouver ni écarter.
- **Daeron II.** Dit bâtard par les partisans des Feunoyr ; rien ne l'établit.
- **Orys Baratheon.** Demi-frère bâtard d'Aegon selon la rumeur.
- **Rhaegar et Lyanna.** La disparition est établie. Sa nature, rapt ou fuite consentie, ne l'est pas : les personnages se contredisent.
- **Jon Snow.** Sa filiation n'est pas révélée dans les livres. L'hypothèse Rhaegar et Lyanna est une théorie de lecteurs, confirmée dans la série seulement. Elle figure dans `openQuestions`, pas dans les événements des livres.
- **La Conquête.** Les raisons d'Aegon sont débattues par la chronique elle-même.
- **La lettre de Dorne (13 AC).** Son contenu est inconnu ; la chronique énumère des hypothèses.
- **Lestival (259).** L'incendie et ses morts sont établis. Sa cause est tenue secrète par les ouvrages.
- **Aerea et Balerion (54–56).** La destination du dragon, Valyria, est une déduction du septon Barth.
- **Le Fléau.** L'événement et sa date sont établis ; sa cause ne l'est pas.

### Sorts inconnus

Orties et Sheepstealer (vus pour la dernière fois en 134), le Cannibal, Silverwing et Morning (morte avant 153, sans date). Leur champ `died` est `null`.

### Noms français

Les noms de lieux et de personnes suivent les traductions françaises telles que l'agent les connaît (Peyredragon, Port-Réal, Feunoyr, Accalmie, Fossedragon, Lancehélion, Villevieille…). **Ils n'ont pas été contrôlés en ligne.** Trois catégories demandent une relecture par quelqu'un qui a les éditions françaises sous la main :

1. les noms de dragons traduits (`nameFrCandidate` dans `dragons.json`) ;
2. les épithètes royales, en particulier celle d'Aegon III ;
3. quelques lieux de la Danse : Tumbleton a été laissé en anglais, et « Repos-des-Freux » est à confirmer.

Dans les listes `dragons` de la chronologie, les dragons portent leur nom anglais, qui sert de clé.

## 6. Les couleurs de dragons

`colorFr` ne contient que ce que le texte des livres décrit. Sur 28 dragons, 20 ont une couleur d'écailles écrite, 1 n'a que la couleur de ses flammes (Quicksilver) et 7 n'ont rien : Vhagar, Vermax, Arrax, Tyraxes, Stormcloud, Morghul et Shrykos.

Pour ces sept-là, `colorFr` vaut `null`. Ce qui circule à leur sujet vient d'ailleurs et est rangé à part :

- `extraTextualNoteFr` : indication donnée hors texte par l'équipe de l'auteur à un illustrateur (Vhagar, Arrax), ou illustration de *The Rise of the Dragon* (Morghul, Shrykos) ;
- `adaptationNoteFr` : couleur ou destin propres à une série (Vermax, et les trois dragons de Daenerys pour leur fin télévisée).

Pour Quicksilver, le texte décrit les flammes (blanc pâle) mais pas les écailles. `colorFr` le dit, et `colorKey` reste `null`.

Conséquence pour le design : le nuancier d'écailles ne peut pas prétendre à l'exhaustivité. Un dragon sans couleur écrite doit recevoir un traitement visuel qui dise « non décrit », par exemple la hachure prévue au cahier artistique pour les zones inconnues.

## 7. Vérification demandée : les chandelles de verre

### Où il en est question

Cinq passages, tous dans les romans principaux. Aucune mention n'a été trouvée dans *Fire & Blood* ni dans *The World of Ice & Fire*.

| Passage | Qui parle | Ce qui est dit |
|---|---|---|
| *A Clash of Kings*, Daenerys V (ch. 63) | Xaro Xhoan Daxos, à Qarth | On raconte que des chandelles de verre, éteintes depuis cent ans, brûlent chez un mage de la ville. Ouï-dire. |
| *A Feast for Crows*, Prologue | Des acolytes de la Citadelle | La Citadelle en possède quatre, une verte et trois noires, apportées de Valyria mille ans avant le Fléau. La veille de ses vœux, le futur mestre passe une nuit dans le noir avec l'une d'elles et doit tenter de l'allumer ; il n'y parvient pas. Un acolyte y voit une leçon sur les limites du savoir. Un autre rapporte que Marwyn en fait brûler une. |
| *A Feast for Crows*, Samwell IV (ch. 35) | Mestre Aemon, mourant | Brève allusion à une chandelle qu'on ne pouvait pas allumer. Passage non relu en détail lors de ce contrôle. |
| *A Feast for Crows*, Samwell V (ch. 45) | Samwell (témoin), Marwyn | Samwell en voit une brûler. Marwyn explique à quoi elles servaient. |
| *A Dance with Dragons*, Daenerys II (ch. 11) | Quaithe, à Meereen | Elle annonce à Daenerys que les chandelles de verre brûlent. |

### Ce qui est établi

- **L'objet existe** et il est en obsidienne, que Marwyn appelle verredragon.
- **Sa forme.** Les chandelles de la Citadelle sont hautes, torses, à arêtes vives. Celle de Marwyn mesure environ trois pieds ; elle est mince comme une épée, striée, torse, d'un noir luisant. Les acolytes s'y coupent les mains.
- **Sa lumière**, vue par Samwell : pâle, d'un éclat désagréable, parfaitement fixe (elle ne vacille pas même quand une porte claque). Elle fausse les couleurs : les blancs, les jaunes et les rouges deviennent plus vifs, et les ombres sont si noires qu'elles ressemblent à des trous.
- **Une chandelle brûle chez Marwyn** à Villevieille, vers 300 AC.
- **Elles viennent de Valyria** : les deux personnages qui parlent de leur origine, un acolyte et Marwyn, le disent, et rien ne les contredit.

### Ce qui est affirmé par un seul personnage

- **Leurs pouvoirs.** Selon Marwyn seul, les sorciers des Possessions s'en servaient pour voir par-delà les montagnes, les mers et les déserts, pour entrer dans les rêves d'un homme et lui donner des visions, et pour se parler d'un bout du monde à l'autre. Le texte ne montre aucun de ces usages. Il les suggère une fois : Marwyn et son élève savaient que Samwell arrivait, et l'élève désigne la chandelle.
- **« Elle brûle sans se consumer »** : mot de Marwyn.
- **Leur nombre et leur arrivée à la Citadelle** : dire d'acolytes dans une taverne.

### Ce qui relève de la rumeur ou de la déduction

- Que des chandelles brûlent à Qarth : « on raconte ».
- Que leur réveil soit lié au retour des dragons : le rapprochement s'impose au lecteur, par la durée (un siècle d'extinction) et par le moment, mais **aucun personnage ne l'affirme en ces termes**.
- Que les mestres ne veuillent pas de cette magie : opinion de Marwyn.

Sont à écarter : les éléments tirés de brouillons non publiés de l'auteur, qui circulent en ligne (allumage quotidien, immortalité). Ils ne font pas partie des livres.

### Aucun lien avec la Maison Targaryen

**Aucun texte n'attribue une chandelle de verre à un Targaryen.** Dans les livres, ces objets sont à la Citadelle de Villevieille et à Qarth. Daenerys en entend parler deux fois ; elle n'en voit pas. La chandelle est un objet valyrien, pas un emblème de la Maison.

### L'usage du sceau est-il fidèle ?

**Oui pour l'essentiel, avec trois réserves.**

Ce qui est fidèle :

- Les trois traits qui fondent le dessin (haute, torse, en obsidienne, à arêtes vives) sont exactement ceux du texte.
- L'idée de « voir et communiquer à distance » correspond à ce que dit Marwyn. Le conditionnel du cahier artistique (« auraient permis ») est juste et doit être conservé.
- « Lumière étrange » est exact.
- Le concept du site, un savoir valyrien consulté de loin, s'accorde avec cet usage supposé.
- La chandelle de recherche est un clin d'œil cohérent : voir au loin, c'est chercher. Allumer une chandelle de verre est par ailleurs, dans les livres, ce que personne ne réussit ; le geste a donc une valeur.
- Les Quatorze Flammes sont bien les volcans de Valyria.

Les réserves :

1. **Le sceau est valyrien, non targaryen.** Le colophon ne doit pas laisser entendre que la Maison possédait ou utilisait ces chandelles. « Objet de la sorcellerie valyrienne » est exact ; « chandelle des Targaryen » serait une invention.
2. **La flamme dessinée s'écarte du texte sur deux points.** Le sceau montre une flamme en goutte à cœur rouge, avec un halo doré qui « respire ». Le texte décrit une lumière pâle et surtout **immobile**. Une boucle de souffle, même discrète, contredit le seul détail sur lequel le roman insiste. La couleur chaude et le cœur rouge sont une licence de dessin, défendable. Le mouvement l'est moins : un halo fixe serait plus fidèle, et plus étrange.
3. **Le socle** n'est décrit nulle part. C'est une addition du dessin, sans conséquence, à ne pas présenter comme tirée des livres.

Formulation proposée pour le colophon, en une phrase :

> Le sceau figure une chandelle de verre, l'un de ces fûts d'obsidienne torse venus de Valyria que conserve la Citadelle de Villevieille, et dont un archimestre affirme, dans les romans, qu'ils permettaient aux sorciers des Possessions de voir et de se parler au loin.

À éviter dans tout texte public : « les Targaryen utilisaient », « les chandelles se sont rallumées à la naissance des dragons » (présenté comme un fait), et toute mention des pouvoirs sans leur source.

Le nom français « chandelle de verre » et le mot « verredragon » sont ceux que l'agent connaît des traductions ; ils n'ont pas été contrôlés en ligne.

### Les deux autres faits du sceau

La direction artistique demandait aussi une validation des Quatorze Flammes et de la formule rituelle. Ce n'était pas dans ma commande ; voici ce que je peux en dire.

- **Quatorze Flammes** : confirmé. Ce sont les volcans de la péninsule valyrienne, berceau des dragons selon la tradition et lieu des mines.
- **« Valar morghulis » / « Valar dohaeris »** : *de mémoire, non recontrôlé*. La formule est en haut valyrien, mais les romans l'associent à Braavos et aux Sans-Visage, non aux Targaryen, dont la devise est « Feu et Sang ». Braavos a été fondée par des esclaves échappés de Valyria. L'emploi est défendable pour une bibliothèque valyrienne ; il faut seulement savoir d'où vient la formule avant de l'expliquer au visiteur. À faire contrôler si un texte public la commente.

## 8. Ce qui n'a pas pu être vérifié en ligne

- Six pages du wiki sont restées illisibles malgré plusieurs essais : la fiche générale de la Maison, celles de Daeron Ier et de Viserys II, deux pages d'années et une page de catégorie. La fiche d'Aegon Ier n'a pu être lue que par son adresse de redirection. Les dates de Daeron Ier et de Viserys II sont recoupées par les fiches de leurs voisins (voir `sovereigns.json`) et marquées `verifiedOnline: false`.
- Dix-sept événements portent `verifiedOnline: false`. Dix sont des événements des livres connus de l'agent mais non recoupés (liste des seigneurs de Peyredragon, double mariage d'Aegon, Table peinte, offre d'Argilac, proclamation, forge du trône, prophétie sur l'or du Roc, vol de Jaenara Belaerys, conquête de Dorne, règne de Viserys II). Sept sont des événements de séries ; le huitième, la filiation de Jon Snow à l'écran, a été recoupé.
- L'outil de lecture ne restitue pas le texte brut des pages mais un résumé. Deux résumés se sont révélés fautifs et ont été corrigés par recoupement (année du Gosier, année du tournoi de Harrenhal). D'autres erreurs de ce type peuvent subsister.
- Aucun ouvrage n'a été consulté directement. Les renvois aux chapitres viennent du wiki ou de la mémoire de l'agent.
