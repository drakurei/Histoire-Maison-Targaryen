# Notes sur l'apparence des dragons

Agent 02, historien, registre des dragons. Version du 20 novembre 2026.

Fichier décrit : `content/dragons/looks.json` (28 éléments, un par dragon de `content/dragons/dragons.json`, dans le même ordre). Chaque élément a la forme `{ dragonId, look: DragonLook, hatched, sizeNote, colorNote }`, `DragonLook` étant le type de `src/core/content/types.ts`.

Cette note dit d'où vient chaque valeur, ce qui est écrit dans les livres, ce qui ne l'est pas, et ce que j'ai dû arbitrer.

---

## 1. Méthode

**Autorité.** Seul le texte des ouvrages de George R. R. Martin décide : *Fire & Blood* (F&B), *The World of Ice & Fire* (TWOIAF), les cinq romans (AGOT, ACOK, ASOS, AFFC, ADWD), *The Hedge Knight* (THK), *The Princess and the Queen* (P&Q). Les illustrations, y compris celles de *The Rise of the Dragon*, ne valent pas description. Les indications données hors texte par l'auteur ou son équipe à des artistes sont signalées dans `colorNote` (« hors texte ») et ne colorent jamais la planche. Les séries n'apparaissent que sous l'étiquette « Adaptation ».

**Contrôle.** Chaque dragon a été relu le 20 novembre 2026 sur sa page de *A Wiki of Ice and Fire* (awoiaf.westeros.org), sections « Appearance » ou « Description », avec la liste des références de la page pour retrouver le chapitre. Pages générales relues : « Dragon » et « Dragonflame ». Le wiki sert à contrôler et à localiser, il n'est pas cité comme source d'un fait. Je n'ai pas eu le texte des ouvrages sous les yeux : les renvois de chapitre sont ceux que le wiki attache à chaque affirmation.

**Pour l'adaptation**, une seule source extérieure a été lue : un entretien du responsable des effets visuels de la première saison de *House of the Dragon*, Angus Bickerton (Television Academy, « Enter the Dragons », 3 juillet 2023), pour Vhagar, Caraxes et Syrax. Les couleurs de Vermax dans la série reprennent ce que `dragons.json` consignait déjà (index officiel de HBO), confirmé par le wiki.

## 2. Conventions du fichier

### Couleurs et marque « attested »

`attested.body`, `.wing`, `.crest`, `.flame` valent `true` seulement si le texte donne la couleur de cette partie. Sinon la partie reçoit une teinte neutre, toujours la même, et `false` :

| Partie | Teinte neutre (non décrite) |
|---|---|
| `body` | `oklch(0.56 0.008 85)` |
| `wing` | `oklch(0.64 0.008 85)` |
| `crest` | `oklch(0.46 0.008 85)` |
| `flame` | `oklch(0.8 0.01 85)` |

Les quatre gris ne diffèrent que par la clarté, pour que le dessin reste lisible. Un dragon entièrement gris est un dragon que les livres ne décrivent pas : Vhagar, Vermax, Arrax, Tyraxes, Stormcloud, Morghul, Shrykos.

Règles appliquées, dans l'ordre :

1. Quand le texte qualifie l'animal entier d'une seule couleur (« rouge », « argentée », « noir de charbon »), elle va dans `body`. Les membranes (`wing`) restent neutres tant qu'elles ne sont pas décrites à part. C'est strict, et cela donne des planches à corps coloré et ailes grises (Caraxes, Syrax, le Cannibal) : le gris y signifie « non décrit », non « gris ».
2. `crest` couvre cornes, crêtes et épine dorsale. Les os des ailes, les griffes et le ventre n'ont pas de champ : ils sont dits dans `colorNote`.
3. Un nom n'est pas une description. Silverwing a le corps argent (le texte la dit « argentée ») et les ailes neutres ; Quicksilver reste grise, sauf son feu.
4. Deux gris sont des couleurs attestées et non des neutres : Seasmoke (gris argent pâle) et Grey Ghost (gris-blanc pâle). Ils sont plus clairs et légèrement bleutés (teinte 240) pour ne pas se confondre avec le neutre (teinte 85). La marque `attested` reste le seul critère sûr.
5. Les teintes exactes en `oklch()` sont mon interprétation d'un mot (« bronze », « cobalt », « rose pâle »). Toutes tiennent dans le gamut sRGB (vérifié par script).
6. Une flamme « noire » est codée très sombre (Balerion, Drogon). Sur fond noir elle ne se verra pas sans traitement graphique : c'est une question de dessin, pas de donnée.

### Envergure (`span`) et `attested.size`

Balerion vaut 1. Les livres ne donnent aucune mesure de lui ; l'échelle est donc relative, et ce sont des ordres de grandeur. Chaque valeur représente le dragon à sa plus grande taille connue (le plus souvent à sa mort).

Les rapports du texte (« quatre fois plus grand », « le tiers de la taille ») sont appliqués tels quels à l'envergure. C'est une convention : le texte parle de « taille » sans dire s'il s'agit de longueur ou de masse. Elle conserve l'ordre et les écarts que le lecteur a en tête.

`attested.size` vaut `true` quand le texte compare explicitement le dragon à un autre dragon nommé, à une mesure, ou lui donne un rang : Balerion, Vhagar, Quicksilver, Vermithor, Caraxes, Seasmoke, Tessarion, Arrax, Moondancer, le Cannibal, Drogon. Pour les autres, la valeur est une estimation fondée sur l'âge, la liberté (un dragon enfermé grandit moins, disent les romans) et les adjectifs du texte.

Chaîne des rapports écrits :

| Rapport | Source | Valeurs |
|---|---|---|
| Vhagar presque aussi grande que Balerion | P&Q ; F&B, « The Dying of the Dragons » | 0.92 |
| Balerion quatre fois plus grand que Quicksilver (43) | F&B, « The Sons of the Dragon » | 0.25 |
| Vermithor, le plus grand après Balerion et Vhagar | TWOIAF, « Jaehaerys I » | 0.72 |
| Caraxes, environ la moitié de Vhagar | F&B, « The Blacks and the Greens » | 0.46 |
| Tessarion, le tiers de Vermithor | F&B, « Rhaenyra Overthrown » | 0.24 |
| Vermithor mesuré à Seasmoke et Tessarion réunis | F&B, « Rhaenyra Overthrown » | Seasmoke 0.42 |
| Vhagar cinq fois plus grande qu'Arrax | F&B, « A Son for a Son » | 0.18 |
| Moondancer pas plus grande qu'un cheval de guerre | F&B, « Rhaenyra Triumphant » | 0.14 |

Le plancher imposé (0.12) écrase le bas de l'échelle : un dragonneau de l'âge de Morghul serait en réalité bien plus petit par rapport à Balerion.

### Cou et queue (`neck`, `tail`)

0.5 par défaut. Seules trois familles de cas s'en écartent :

- Les dragons que le texte dit minces : Dreamfyre et Moondancer (« slender »), Caraxes (« lean »). Le modèle n'a pas de paramètre de corpulence ; j'ai rendu la minceur par une silhouette un peu plus étirée (0.6 et 0.6). C'est une convention de dessin, pas un fait.
- Les trois dragons de Daenerys, décrits jeunes comme presque tout en cou, en queue et en ailes (ACOK, ch. 12) : 0.6 et 0.6.
- Rhaegal : ADWD, ch. 68, montre son cou qui n'en finit pas de se dérouler devant Quentyn Martell. Cou à 0.65.

**Caraxes.** Le brief et le commentaire de `types.ts` lui prêtent un « cou très long ». Je n'ai trouvé aucun passage des livres qui le dise : la chronique le dit rouge, immense et maigre, rien de plus. Le cou démesuré est le dessin de *House of the Dragon* (« very long », selon le responsable des effets visuels, qui le compare à un dragon chinois). J'ai donc laissé 0.6, comme pour les autres dragons minces, et placé le trait de la série dans les notes, étiqueté. Si l'orchestrateur veut le cou de la série sur la planche, il faut le décider en connaissance de cause et le marquer comme adaptation.

### Cornes (`horns`)

Les livres ne comptent jamais les cornes. Convention :

- 1 : valeur par défaut, parce que les romans donnent des cornes aux dragons en général (ACOK, ch. 12).
- 2 : le texte nomme pour ce dragon une crête en plus des cornes, ou des crêtes : Dreamfyre, Meleys, Tessarion, Moondancer, Morning, Drogon, Viserion.
- 0 et 3 : jamais employés, faute de texte.

### Éclosion (`hatched`)

Un nombre seulement quand le texte donne l'année, permet de la calculer, ou la borne de près. Sinon `null`. La nature de chaque valeur :

| Dragon | `hatched` | Nature | Bornes tirées du texte |
|---|---|---|---|
| Balerion | -114 | borne haute | vivant quand Aenar quitte Valyria (114 av. C.) ; « environ deux cents ans » à sa mort en 94 |
| Vhagar | -52 | calculée | 181 ans à sa mort en 130 |
| Meraxes | null | | éclose à Peyredragon après 114 av. C., avant la Conquête |
| Quicksilver | 7 | écrite | dragonneau lié à Aenys nourrisson, né en 7 |
| Dreamfyre | 32 | borne haute | dragonneau en 32, éclose sous Aegon Ier |
| Vermithor | 34 | tradition | œuf placé dans le berceau de Jaehaerys (né en 34) ; grand dragon en 48 |
| Silverwing | 36 | tradition | œuf placé dans le berceau d'Alysanne (née en 36) |
| Caraxes | null | | jeune dragon montable en 72 |
| Meleys | null | | à Fossedragon, jamais montée, en 75 |
| Syrax | null | | jeune dragon en 104 |
| Seasmoke | null | | jeune dragon en 101 |
| Sunfyre | null | | jeune en 120 ; éclos à Peyredragon |
| Tessarion | null | | attestée en 120 ; plus jeune que Sunfyre |
| Vermax | 114 | borne basse | œuf de berceau de Jacaerys (né en 114) ; éclos au plus tard vers 120 |
| Arrax | 115 | borne basse | œuf de berceau de Lucerys (né en 115) ; au plus tard vers 120 |
| Tyraxes | 117 | borne basse | œuf de berceau de Joffrey (né en 117) ; au plus tard vers 120 |
| Moondancer | null | | trop petite pour être montée en 129 |
| Stormcloud | null | | lié à Aegon le Jeune (né en 120) ; jeune dragon en 129 |
| Morghul | null | | jeune dragon en 129 |
| Shrykos | null | | jeune dragon en 129 |
| Sheepstealer | null | | éclos « quand le Vieux Roi était encore jeune » |
| Grey Ghost | null | | sauvage, âge inconnu ; vivant en 129 |
| Cannibal | null | | la rumeur le dit antérieur à 114 av. C. ; les chroniqueurs en doutent |
| Morning | 130 | borne basse | éclose fin 130 ou début 131 |
| Dernier dragon | null | | née sous Aegon III (131 à 157), morte en 153 |
| Drogon, Rhaegal, Viserion | 299 | reconstituée | les romans ne donnent pas d'années ; même valeur que l'événement `p8-eclosion` |

Le champ est un nombre seul : il ne dit pas s'il s'agit d'une date ou d'une borne. Quand ce n'est pas une date écrite, je l'ai dit en clair dans `sizeNote`, pour que la planche ne puisse pas afficher l'année sans sa réserve. Pour une courbe des dragons vivants par année, la dernière colonne du tableau donne, pour chaque `null`, l'année à partir de laquelle le dragon est attesté.

Les œufs de berceau : la chronique dit que les œufs des trois fils aînés de Rhaenyra ont éclos, l'un après l'autre, sans donner d'année. J'ai retenu l'année de naissance de l'enfant, qui est la plus ancienne possible. Pour Stormcloud, rien ne dit quand l'œuf a éclos entre 120 et 129 : `null`.

---

## 3. Dragon par dragon

Pour chacun : ce que disent les livres, où, et ce que j'en ai fait.

### Balerion

- Texte : écailles noires et feu noir (ACOK, ch. 12) ; ailes noires, flammes noires mêlées de volutes rouges (F&B, « Aegon's Conquest » ; « The Sons of the Dragon » ; TWOIAF, « The Conquest »). Le plus grand des dragons targaryens ; aurait avalé un aurochs (AGOT, ch. 13). A cessé de grandir vers 93, peine à voler (F&B, « The Long Reign »).
- Décision : corps, ailes et feu attestés ; crête neutre. Envergure 1, référence de l'échelle.

### Vhagar

- Texte : aucune couleur. Presque aussi grande que Balerion au temps de la Danse, la plus vieille et la plus grande des dragons vivants (P&Q). On aurait pu descendre son gosier à cheval (AGOT, ch. 13).
- Hors texte : bronze à reflets bleu-vert, yeux verts, indication de l'équipe de l'auteur à l'artiste du calendrier 2021 (Sam Hogg).
- Adaptation : vert forêt sombre (Bickerton, 2023).
- Décision : tout neutre ; envergure 0.92, attestée.

### Meraxes

- Texte : écailles d'argent, yeux d'or (TWOIAF, « The Conquest »). Avale des chevaux entiers (ACOK, ch. 12). Tyrion, devant les crânes, la dit plus grande encore que Vhagar et plus petite que Balerion (AGOT, ch. 13).
- Contradiction : la chronique, écrite après le premier roman, ne dit que de Vhagar qu'elle approcha Balerion, et Meraxes est morte en 10. Le crâne de Vhagar que Tyrion a pu voir est celui d'un dragon de 181 ans.
- Décision : corps attesté. Envergure 0.6, `attested.size` à `false` : la valeur ne satisfait pas les deux textes, c'est un arbitrage. La planche doit montrer `sizeNote`.

### Quicksilver

- Texte : boules de feu d'un blanc pâle ; Balerion quatre fois plus grand qu'elle en 43 (F&B, « The Sons of the Dragon »). Aucune couleur d'écailles.
- Hors texte : une illustration de *The Rise of the Dragon* la montre argentée ; le wiki la dit « probablement » argent.
- Décision : seule la flamme est attestée. Envergure 0.25, attestée.

### Dreamfyre

- Texte : mince, bleu pâle marqué d'argent (F&B, « The Sons of the Dragon ») ; crêtes d'argent et ailes bleu pâle (F&B, « Birth, Death, and Betrayal Under King Jaehaerys I »). Plus jeune et plus petite que Quicksilver en 43.
- Décision : corps, ailes et crête attestés ; flamme neutre. Envergure 0.58, estimée (au-dessous de Vermithor, que TWOIAF classe juste après Vhagar).

### Vermithor

- Texte : bronze, grandes ailes fauves (P&Q). Le plus grand après Balerion et Vhagar (TWOIAF, « Jaehaerys I »). Trois fois Tessarion ; Seasmoke ne peut lui résister (F&B, « Rhaenyra Overthrown »).
- Flamme : au Gosier, cinq dragons crachent des feux « bleus et orange, rouges et or » sans attribution (F&B, « The Red Dragon and the Gold »). Le wiki en tire des couleurs « possibles » pour Vermithor, Silverwing, Seasmoke, Sheepstealer et Vermax. Je ne les retiens pas.
- Décision : corps et ailes attestés. Envergure 0.72, attestée.

### Silverwing

- Texte : « argentée » (F&B, « Birth, Death, and Betrayal » ; « The Short, Sad Reign of Aegon II »). Rien sur la taille, sinon qu'elle est un dragon adulte après la Danse.
- Décision : corps attesté, ailes neutres malgré le nom. Envergure 0.66, estimée.

### Caraxes

- Texte : rouge, immense et maigre ; environ la moitié de Vhagar (F&B, « The Blacks and the Greens »). Surnommé the Blood Wyrm par les gardiens de Fossedragon (F&B, « The Long Reign »).
- Adaptation : très long, d'allure serpentine (Bickerton, 2023). Voir la section 2.
- Décision : corps attesté. Envergure 0.46, attestée. Cou et queue 0.6 pour la maigreur.

### Meleys

- Texte : écailles écarlates, membranes roses, crête, cornes et griffes de cuivre (F&B, « The Red Dragon and the Gold »). Très rapide en 75 (F&B, « The Long Reign »).
- Décision : corps, ailes et crête attestés ; flamme neutre. Envergure 0.48, estimée.

### Syrax

- Texte : écailles jaunes ; grande et redoutable (F&B, « The Blacks and the Greens »). Enchaînée et bien nourrie (F&B, « Rhaenyra Triumphant »).
- Adaptation : jaune éteint (Bickerton, 2023).
- Décision : corps attesté. Envergure 0.4, estimée.

### Seasmoke

- Texte : gris argent pâle (F&B, « Heirs of the Dragon »). Jeune, de taille à combattre, agile.
- Taille : le wiki lit dans « Rhaenyra Overthrown » que Vermithor vaut Seasmoke et Tessarion réunis, donc Seasmoke le double de Tessarion. N'ayant pas la phrase exacte, j'ai écrit dans la note que la chronique « mesure » Vermithor aux deux autres réunis, et retenu 0.42, un peu sous le double (0.48).
- Décision : corps attesté ; envergure attestée par comparaison, valeur approchée.

### Sunfyre

- Texte : écailles d'or, membranes rose pâle (F&B, « The Blacks and the Greens ») ; flammes dorées (F&B, « The Red Dragon and the Gold » ; « Rhaenyra Overthrown »). Jeune, mais grand et lourd.
- Décision : corps, ailes et flamme attestés ; crête neutre. Envergure 0.34, estimée (plus âgé que Tessarion, plus grand que Moondancer).

### Tessarion

- Texte : dragonne bleue (F&B, « Heirs of the Dragon ») ; ailes cobalt sombre, griffes, crête et ventre de cuivre battu (F&B, « The Blacks and the Greens ») ; flammes cobalt (F&B, « The Red Dragon and the Gold »). Le tiers de Vermithor (F&B, « Rhaenyra Overthrown »).
- Décision : les quatre couleurs attestées. Le bleu du corps n'a pas de nuance écrite : je l'ai pris dans la gamme du cobalt des ailes, un peu plus clair. Envergure 0.24, attestée.

### Vermax

- Texte : aucune couleur. Jeune, fort, grandit chaque année.
- Hors texte : vert dans *The Rise of the Dragon*.
- Adaptation : vert olive, membranes orange pâle.
- Décision : tout neutre. Envergure 0.2, estimée.

### Arrax

- Texte : aucune couleur. Vhagar est cinq fois plus grande (F&B, « A Son for a Son »).
- Hors texte : blanc nacré, poitrail et yeux dorés, flamme jaune (indication de l'équipe de l'auteur, calendrier 2021).
- Décision : tout neutre. Envergure 0.18, attestée.

### Tyraxes

- Texte : aucune couleur. Le wiki le dit « un peu plus petit » que Vermax et Arrax ; je n'ai pas pu rattacher cette phrase à un passage précis, je ne l'ai donc pas reprise.
- Hors texte : violet pâle, cornes pourpre sombre, flammes pourpres (indication de l'auteur rapportée par l'illustrateur Rudolf Hima, octobre 2024).
- Décision : tout neutre. Envergure 0.16, estimée.

### Moondancer

- Texte : mince, vert pâle, cornes, crête et os des ailes couleur de perle (F&B, « The Blacks and the Greens » ; « Rhaenyra Overthrown »). Pas plus grande qu'un cheval de guerre en 130.
- Décision : corps et crête attestés ; membranes neutres (seuls les os sont décrits). Envergure 0.14, attestée.

### Stormcloud

- Texte : aucune couleur, aucune taille.
- Hors texte : turquoise, cornes et griffes noires (Rudolf Hima, octobre 2024).
- Décision : tout neutre. Envergure 0.13, estimée.

### Morghul et Shrykos

- Texte : rien sur l'apparence.
- Hors texte : noir pour Morghul, cuivré pour Shrykos, dans une illustration de *The Rise of the Dragon* (confirmé par l'illustrateur).
- Décision : tout neutre. Envergure 0.12, la plus petite du registre.

### Sheepstealer

- Texte : brun de boue, laid (F&B, « The Red Dragon and the Gold »). « Maigre » selon Munkun, qui n'a jamais vu sa cavalière (F&B, « Rhaenyra Triumphant »).
- Décision : corps attesté. Envergure 0.48, estimée. La maigreur, de seconde main, n'a pas été traduite dans la silhouette.

### Grey Ghost

- Texte : gris-blanc pâle, couleur de brume matinale (F&B, « The Red Dragon and the Gold »).
- Décision : corps attesté. Envergure 0.3, estimée sans appui : c'est la valeur la moins fondée du fichier.

### Cannibal

- Texte : noir de charbon, yeux verts ; le plus grand et le plus vieux des trois dragons sauvages (F&B, « The Red Dragon and the Gold »).
- Décision : corps attesté. `attested.size` à `true` pour le superlatif, mais la position sur l'échelle (0.62, sous Vermithor) est une déduction, dite dans la note.

### Morning

- Texte : écailles rose pâle, cornes et crête noires (F&B, « The Short, Sad Reign of Aegon II »). Montée pour la première fois en 135 (F&B, « The Lysene Spring and the End of Regency »).
- Décision : corps et crête attestés. Envergure 0.14, estimée.

### Dernier dragon

- Texte : femelle verte, petite, chétive, ailes atrophiées, vue par ser Arlan enfant (THK). Née sous Aegon III (TWOIAF, « Aegon III »).
- Décision : corps attesté. Envergure 0.12. `attested.size` à `false` : « petite » est une description, non une comparaison.

### Drogon

- Texte : jeune, écailles noires striées d'écarlate, cornes et ailes écarlates (ACOK, ch. 12). Adulte, écailles noires, cornes et plaques dorsales rouge sang, yeux rouges, ailes de vingt pieds, noires (ADWD, ch. 52). Feu noir traversé de rouge (ASOS, ch. 42). Le plus grand des trois (ASOS, ch. 27).
- Décision : la planche montre l'état du cinquième tome ; les quatre couleurs attestées. Envergure 0.16, attestée (mesure et rang), sans équivalence écrite avec Balerion.

### Rhaegal

- Texte : « vert et bronze » (ACOK, ch. 27 ; ASOS, ch. 71) ; écailles vert sombre, yeux de bronze, feu orange et jaune veiné de vert (ADWD, ch. 68) ; ailes vert jade (ACOK, ch. 40).
- Le bronze : aucune partie du corps n'est nommée, sauf les yeux. Par analogie avec ses frères (noir et écarlate, crème et or), on pourrait le placer sur les cornes ; je ne l'ai pas fait.
- Décision : corps, ailes et flamme attestés ; crête neutre. Envergure 0.13, estimée.

### Viserion

- Texte : écailles crème, cornes, os des ailes et crête dorsale dorés (ACOK, ch. 12 ; ASOS, ch. 8) ; ailes crème (ACOK, ch. 27) ; yeux d'or fondu, feu or pâle mêlé de rouge et d'orange (ADWD, ch. 68).
- Décision : les quatre couleurs attestées. Envergure 0.13, estimée.

---

## 4. Ce qui reste douteux

1. **Renvois de chapitre.** Ils viennent des notes du wiki, non d'une relecture des ouvrages. Les faits eux-mêmes concordent avec `dragons.json`.
2. **Meraxes.** Contradiction réelle entre AGOT et la chronique. La valeur 0.6 est un choix.
3. **Seasmoke, le Cannibal.** Comparaison écrite, mais chiffre approché.
4. **Grey Ghost, Sheepstealer, Silverwing, Meleys, Syrax, Sunfyre, Dreamfyre.** Envergures estimées, sans rapport écrit.
5. **Rhaegal.** La crête grise est fidèle au texte et pauvre à l'œil. Si l'orchestrateur préfère un bronze sur les cornes, il faut garder `attested.crest` à `false` et le dire.
6. **Ailes neutres sur corps coloré** (règle 1 de la section 2) : fidèle, mais à vérifier au rendu.
7. **`hatched` des œufs de berceau** (Vermax, Arrax, Tyraxes) et de Balerion : ce sont des bornes. Une planche qui afficherait « éclos en 114 » sans réserve dirait plus que le texte.
8. **Adaptation.** Seuls Vhagar, Caraxes, Syrax et Vermax ont une mention de série, parce que ce sont les seuls que j'ai pu vérifier à une source. Les autres dragons de *House of the Dragon* et ceux de *Game of Thrones* n'ont pas été contrôlés.

## 5. Signalements hors périmètre

- `src/core/content/types.ts`, commentaire de `DragonLook.neck` : « Caraxes est décrit comme ayant un cou très long ». Ce n'est pas dans les livres, à ma connaissance ; c'est le dessin de la série.
- `content/dragons/dragons.json` : les indications hors texte pour Tyraxes et Stormcloud (2024) n'y figurent pas ; `extraTextualNoteFr` de Vhagar dit « un illustrateur », celui d'Arrax « une illustratrice », pour la même personne.
- `content/dragons/dragons.json` et `content/timeline/timeline.json` écrivent « Rook's Rest » dans des textes français ; le brief demande « Repos-du-Freux », que j'ai employé.
- `looks.json` nomme les dragons comme le champ `name` de `dragons.json` (formes d'origine), les formes françaises n'étant pas vérifiées.
