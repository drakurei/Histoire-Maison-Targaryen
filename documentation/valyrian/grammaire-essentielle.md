# Haut valyrien — grammaire essentielle pour le site

Synthèse rédigée par l'agent 04 (linguiste) pour les besoins de l'interface. Elle ne remplace pas les sources : elle résume ce qui a été **effectivement consulté en ligne le 13 novembre 2026** et renvoie à chaque fois à la page d'où vient l'exemple.

Le haut valyrien de l'écran est une langue construite par David J. Peterson à partir des quelques mots donnés par George R. R. Martin (*valar morghulis*, *valar dohaeris*, *valonqar*, *dracarys*). Tout ce qui suit décrit la langue de Peterson.

Abréviations des sources (URL complètes en fin de document) : **[G]** grammaire du wiki, **[P]** phonologie, **[D]** déclinaisons, **[C]** cas, **[A]** adjectifs, **[V]** conjugaison, **[Dict]** dictionnaire, **[Num]** billet « Valyrian Numerals », **[Infl]** billet « Some High Valyrian Inflection », **[Carte]** document de toponymes de Peterson. Les autres références sont des fiches de mots du wiki.

## 1. Sons et orthographe

**Voyelles.** Six timbres, chacun bref ou long : `i y u e o a` et `ī ȳ ū ē ō ā`. Le macron note la longueur et il est distinctif : *ānogar* (« sang », nominatif) n'est pas *ānogār* (locatif, ou forme coordonnée). Beaucoup de locuteurs tardifs prononcent *y* comme *i* [P].

**Diphtongues.** Quatre diphtongues descendantes (*ae, āe, ao, āo*), toujours lourdes pour l'accent, et des diphtongues montantes commençant par *i* ou *u* (*ia, io, ie, ua, ue*…) [P][Infl].

**Consonnes à connaître** [P] :

| Graphie | Valeur | Remarque |
|---|---|---|
| `ñ` | [ɲ] | comme *gn* de « agneau » ; s'écrit *n* devant *j* |
| `lj` | [ʎ] | parfois réalisé *l* devant *i* |
| `rh` | r sourd | *Rhaenys*, *Rhaenyra* |
| `gh` | [ɣ] | fricative vélaire : *morghūlis* |
| `q` | [q] | occlusive uvulaire, plus en arrière que *k* : *valonqar* |
| `j` | [ɟ] classique | aussi [j], [ʒ] ou [dʒ] selon les époques |
| `v` | [v] classique | parfois [w] |
| `th, kh` | — | uniquement dans les emprunts |

La romanisation de Peterson écrit `k` et `ks` là où Martin écrit *c* et *x* : *Karakses*, *Merakses*, *Syraks*, *drakarys* [Dict]. *Vhagar* est la graphie de Martin ; la forme classique est *Vagar* [P].

**Accent** [P]. Une syllabe est légère si elle se termine par une voyelle brève, lourde sinon. L'accent tombe sur l'avant-dernière syllabe, sauf si celle-ci est légère et que l'antépénultième est lourde : dans ce cas il remonte d'un rang. Deux exceptions utiles à l'interface : les **impératifs** sont accentués sur la dernière syllabe, de même que le dernier mot d'une **coordination par allongement** (§ 7).

## 2. Les quatre genres

Le genre n'a rien à voir avec le sexe. Il se devine souvent à la terminaison du nominatif singulier, avec de nombreuses exceptions [G].

| Genre | Terminaison typique | Contenu typique | Exemples attestés |
|---|---|---|---|
| lunaire | voyelle | humains, animaux nocturnes | *vala* « homme », *ābra* « femme », *muña* « mère » |
| solaire | -s | humains, métiers, parties du corps | *dārys* « roi », *zaldrīzes* « dragon », *ēngos* « langue » |
| terrestre | -n | aliments, plantes, métaux (et beaucoup de noms de lieux) | *dōron* « pierre », *dārion* « royaume », *Targārien* |
| aquatique | -r | liquides, étendues d'eau | *ānogar* « sang », *embar* « mer », *lentor* « maison (lignée) » |

Le haut valyrien n'a **pas d'article** : *dārys* vaut « roi », « un roi » ou « le roi » [G]. Les étiquettes du site sont donc des noms nus.

## 3. Les quatre nombres

Singulier et pluriel fonctionnent comme en français. S'y ajoutent [G] :

- le **paucal** (finale *-n*), « quelques » : *valun* « quelques hommes » ;
- le **collectif** (finale *-r*), « l'ensemble des » : *valar* « tous les hommes », *azantyr* « armée » (de *azantys* « soldat »).

Série complète attestée : *vala, vali, valun, valar* [D]. Certains collectifs et paucals sont devenus des mots à part entière : *muñar* « parents », *udrir* « langue » (de *udir* « mot »), *tembyr* « livre », *tīkun* « aile » (de *tīkos* « plume ») [G][D][Num].

Pour l'accord, il n'existe que deux valeurs : **le collectif s'accorde au singulier, le paucal au pluriel** [G]. C'est la clé de *valar morghūlis* (§ 8).

## 4. Les huit cas

| Cas | Emploi principal | Exemple attesté (source) |
|---|---|---|
| nominatif | sujet, attribut | *Dārys morghūltas.* « Le roi est mort. » (fiche *dārys*) |
| accusatif | objet direct | *Āeksia ossēnātās.* « Tuez les maîtres. » [C] |
| génitif | possession, « de » ; régime des postpositions | *Zaldrīzo ānogar* « le sang du dragon » (fiche *ānogar*) |
| datif | destinataire | *Voktys Eglie aōt gaomilaksir teptas.* « Le Grand Prêtre t'a confié une mission. » [C] |
| locatif | lieu, moment | *Kesȳ tubī* « en ce jour » [C] |
| instrumental | moyen, manière, complément du comparatif | *Quptenkos Ēngoso ȳdrassia?* « Parles-tu la Langue commune ? » [C] |
| comitatif | accompagnement | *zaldrīzesse Daeneromy ēdrusi* « les dragons dorment avec Daenerys » [C] |
| vocatif | adresse | *Muñus jorrāeliarzus* « Mère bien-aimée » [C] |

Les six déclinaisons se classent par voyelle thématique (*a, y, o, e, i*, puis une sixième pour les emprunts et les mots réanalysés) [G][D]. Formes les plus utiles pour le site :

| Modèle (déclinaison, genre) | Nom. sg. | Gén. sg. | Nom. pl. | Gén. pl. |
|---|---|---|---|---|
| *vala* (1re, lunaire) | vala | valo | vali | valoti |
| *dāria* (1re, type -ia) | dāria | dārio | dārī | dārȳti |
| *dārys* (2e, solaire) | dārys | dāro | dāryssy | dāroti |
| *ēngos* (3e, solaire) | ēngos | ēngo | ēngossa | ēngoti |
| *dārion* (3e, terrestre -ion) | dārion | dārio | dāria | dārȳti |
| *lentor* (3e, aquatique) | lentor | lentro | lentra | lentroti |
| *zaldrīzes* (4e, solaire) | zaldrīzes | zaldrīzo | zaldrīzesse | zaldrīzoti |
| *Targārien* (4e, terrestre) | Targārien | Targārio | Targārī | Targārȳti |
| *udir* (5e, aquatique) | udir | udrio | udra | udrȳti |

Source : paradigmes de [D] et fiches *dārys*, *lentor*, *udir*. Certaines cases des tableaux du wiki sont des reconstitutions signalées comme telles : une forme absente d'un exemple réel doit rester classée « dérivée ».

## 5. Le génitif et la formation des titres

C'est la construction dont le site a le plus besoin.

**Ordre non marqué : le génitif précède le nom-tête** [C].

- *Va oktio remȳti vale jikās.* « Envoie un homme aux portes de la cité. » [C]
- *Zaldrīzdōro Dārilaros* « prince(sse) de Peyredragon » (fiche *Zaldrīzdōron*, *House of the Dragon* 102)
- *Dāro Vilinion* « Port-Réal », littéralement « port du roi » [Dict]
- *Valyrio Hygyrion* « la péninsule valyrienne » [Carte]

**Dans les titres solennels, le génitif peut suivre** [C] :

- *Muña Zaldrīzoti* « Mère des Dragons »
- *Dāria Sīkudo Dārȳti Vestero* « reine des Sept Couronnes de Westeros » (fiche *Vesteros*, *Game of Thrones* 310)

**Nom de maison.** La formule attestée est *hen Targārio Lentrot*, « de la Maison Targaryen » (*Game of Thrones* 304, fiche *lentor*) : la préposition *hen* (« de, issu de ») régit ici la forme *lentrot* (datif et locatif se confondent à la 3e déclinaison), et le nom de famille est au génitif devant *lentor*. On en tire le nominatif *Targārio Lentor*, puis, par emboîtement de génitifs, *Targārio Lentro Vestriarja* (« les récits de la Maison Targaryen »).

**Règles retenues pour le site.** (1) Génitif devant le nom dans les titres de section. (2) Génitif postposé réservé aux titulatures de personnes. (3) Le nom-tête reste au nominatif dans un titre isolé. (4) Les postpositions suivent un génitif : *ono toliot* « enfin », littéralement « après l'aube » [Dict], *udir Drogo bē* « des nouvelles de Drogon » (fiche *udir*).

## 6. L'adjectif

L'adjectif s'accorde en genre, en nombre et en cas. Il existe trois classes [A][G] :

| Classe | Lunaire | Solaire | Terrestre | Aquatique | Exemple |
|---|---|---|---|---|---|
| I | -a | -ys | -on | -or | *kasta, kastys, kaston, kastor* « bleu-vert » |
| II | -e | -e | -ior | -ior | *kirine* « heureux » |
| III | -ie | -ie | -ior | -ior | *ēlie* « premier », *eglie* « haut » |

Pour les classes II et III, le lunaire et le solaire partagent leurs formes, de même que le terrestre et l'aquatique : classe II d'après [V] (participes en *-re* / *-rior*), classe III d'après la fiche *ēlie* (singulier *ēlie* / *ēlior*, pluriel *ēlī* / *ēliar*) et [Num] ; le résumé automatique de [A] obtenu pendant cette session présentait ces colonnes de façon incohérente, il n'a donc pas été retenu sur ce point.

**Place.** L'adjectif se met avant ou après le nom. Antéposé, il prend des terminaisons abrégées ; postposé, il garde ses terminaisons pleines et sonne plus solennel ou emphatique [A][G].

- *ēlie vala* « le premier homme », *ēlī vali* « les premiers hommes » [Num] — d'où *Ēlī Dāryssy* « les premiers rois ».
- *Valyrio Uēpo* « de l'ancienne Valyria » (*Game of Thrones* 304, fiche *lentor*) : adjectif postposé, accordé au génitif.
- *vala kirine* « un homme heureux » [A].
- *Biare Arlie Jēdari!* « Bonne année ! » [C] : deux adjectifs antéposés, à l'accusatif d'exclamation.

Les démonstratifs précèdent presque toujours le nom : *kesȳ tubī* « en ce jour », *keso glaesot* « cette vie » (datif) [C].

## 7. Ordre des mots et coordination

**Verbe en fin de proposition (SOV).** La langue est très fléchie et place en général le déterminant avant le déterminé [G].

- *Zaldrīzes buzdari iksos daor.* « Un dragon n'est pas un esclave. » (fiche *zaldrīzes*, *Game of Thrones* 304) : sujet, attribut, verbe, négation.
- *Hembār Yunkaihot istan.* « Ensuite je suis allée à Yunkai. » (fiche *hembār*) : adverbe, complément, verbe.

**Sujet sous-entendu.** Le pronom sujet est d'ordinaire omis : *iksan* « je suis » [G].

**Négation.** *daor* suit le verbe, qui passe au **subjonctif** : *iksos daor* (et non *issa daor*) ; *Keso glaesot iderēptōt daor* « Tu n'as pas choisi cette vie » [C][Infl]. D'où, pour le site, *Kesir ilos daor* « Ceci n'existe pas ».

**« Et ».** Deux procédés :

1. la conjonction *se* : *Gryves se Riña Litse* « L'Ours et la Belle » ; *bantis zōbrie issa se ossȳngnoti lēdys* « la nuit est sombre et pleine de terreurs » (fiche *se*) ;
2. la **juxtaposition avec allongement** : la voyelle finale du dernier terme s'allonge et l'accent passe sur la dernière syllabe. Peterson la décrit comme le procédé normal de coordination à propos des numéraux : *mēre ampā* « onze », de *ampa* « dix » [Num]. C'est la construction de la devise ***Perzys Ānogār*** « Feu et Sang » (fiche *perzys*) et de *valzȳrys belmōr* « époux et consort » (fiche *belmor*, *House of the Dragon* 107).

## 8. Le verbe

Le verbe se conjugue en personne, nombre, temps, voix et mode. La forme du dictionnaire est l'infinitif présent actif en *-agon* (parfois *-egon, -igon, -ugon*), qui peut aussi servir de nom : *gūrēñagon* « apprendre ; le fait d'apprendre » [G][V]. Deux grandes classes : radical **consonantique** et radical **vocalique** ; quelques irréguliers sont bâtis sur *jagon* « aller » [G].

**Sept temps** [G] : présent, aoriste (vérités générales), futur, imparfait, parfait, plus-que-parfait, passé d'habitude. Désinences actives de l'indicatif pour un radical consonantique, modèle *jaelagon* « vouloir » [V] :

| | Présent | Aoriste | Futur | Parfait (sur radical de parfait) |
|---|---|---|---|---|
| 1 sg. | jaelan | jaelin | jaelinna | -an |
| 2 sg. | jaelā | jaelia | jaelilā | -ā |
| 3 sg. | jaelza | **jaelis** | jaelilza | **-as** |
| 1 pl. | jaeli | jaelī | jaelili | -i |
| 2 pl. | jaelāt | jaeliat | jaelilāt | -āt |
| 3 pl. | jaelzi | jaelisi | jaelilzi | -is |

Exemples attestés : *issa* « il/elle est », *iksan* « je suis » [G] ; *morghūltas* « il est mort » (parfait, fiche *dārys*) ; *āmāzīli* « nous reviendrons » (futur, fiche *āmāzigon*, *House of the Dragon* 107) ; *masti* « nous sommes venus » (même phrase).

**Analyse de *Valar morghūlis* et *Valar dohaeris*.**

- *valar* : nominatif **collectif** de *vala* → « tous les hommes » (fiche *valar*).
- *morghūlis* : 3e personne du **singulier** de l'**aoriste** de *morghūljagon* « mourir » (radical *morghūlj-* + *-is*). *dohaeris* : même forme pour *dohaeragon* « servir ».
- Le singulier s'explique par l'accord du collectif (§ 3), l'aoriste par la valeur de vérité générale. Littéralement : « tous les hommes meurent / servent ». Le « doivent » de la traduction consacrée n'est porté par aucun mot ; d'après les explications de Peterson rapportées en commentaire de [Infl], l'aoriste associé à un collectif prend cette valeur d'obligation. La fiche *valar* confirme que Peterson n'a pas cherché une correspondance mot à mot avec l'anglais.
- Martin écrit *morghulis* ; le *ū* long relève de la romanisation de Peterson.

**Impératif** [V]. Seulement à la 2e personne, accentué sur la dernière syllabe.

| | Radical consonantique | Radical vocalique |
|---|---|---|
| singulier | *-ās* : *jaelās* | voyelle longue + *s* : *ōrēs*, *sindīs* |
| pluriel | *-ātās* : *jaelātās* | voyelle longue + *tās/tēs/tīs* : *ōrētēs* |

Impératifs attestés ou donnés par les fiches : *Umbās!* « Attends ! » (*House of the Dragon* 101 et 106), *derēbās* « rassemble » (fiche *majēbagon*), *gūrēñās* « apprends », *āmāzīs* « reviens », *korjās* « cherche » (verbe irrégulier), *ossēnātās* « tuez » [C]. Les boutons du site (*Majēbās*, *Pikībās*, *Drāmmās*, *Bēmās*) suivent ce modèle mais restent des formes **dérivées** tant qu'elles n'ont pas été relevées dans une source. L'ordre négatif se forme avec l'infinitif suivi de *daor* [V].

**Participes** [V]. Le participe parfait est un adjectif de classe I formé sur le radical de parfait : *morghūlta* « mort », *sitta* « né » (de *sikagon* « enfanter »), *Dorzālty* « l'Imbrûlée » (de *zālty* « brûlé » avec préfixe négatif) [G]. Le passif fini se marque par *-ks* : *pryjataks* « (ils) ont été détruits » (fiche *udir*).

## 9. Ce que cette synthèse ne couvre pas

Subjonctif en détail, applicatifs verbaux (*i-*, *u-*), propositions relatives, comparatif et superlatif, numéraux au-delà de dix. Ces points ne sont pas nécessaires à la maquette et devront être documentés avant toute rédaction de textes longs.

## Sources consultées pour ce document

- [G] High Valyrian Grammar — https://wiki.languageinvention.com/index.php?title=High_Valyrian_Grammar
- [P] Appendix: High Valyrian pronunciation — https://wiki.languageinvention.com/High_Valyrian_Phonology
- [D] High Valyrian Noun Declensions — https://wiki.languageinvention.com/High_Valyrian_Noun_Declensions
- [C] High Valyrian Noun Cases — https://wiki.languageinvention.com/High_Valyrian_Noun_Cases
- [A] High Valyrian Adjectives — https://wiki.languageinvention.com/High_Valyrian_Adjectives
- [V] High Valyrian Verb Conjugation — https://wiki.languageinvention.com/High_Valyrian_Verb_Conjugation
- [Dict] High Valyrian Dictionary (lettres A à Q seulement, voir le rapport) — https://wiki.languageinvention.com/High_Valyrian_Dictionary
- [Num] D. J. Peterson, « Valyrian Numerals », 14 août 2013 — https://dothraki.com/2013/08/valyrian-numerals
- [Infl] D. J. Peterson, « Some High Valyrian Inflection » — https://dothraki.com/?p=1227
- [Carte] D. J. Peterson, « Valyrian Geography » (document de travail, *House of the Dragon*) — https://dedalvs.com/work/house-of-the-dragon/misc/map_request.pdf
- Fiches de mots du wiki citées dans le texte : *valar*, *dārys*, *lentor*, *udir*, *perzys*, *ānogar*, *zaldrīzes*, *Zaldrīzdōron*, *Vesteros*, *ēlie*, *hembār*, *se*, *belmor*, *āmāzigon*, *majēbagon*, *umbagon* (adresses dans le lexique, champ `refs`).

Plusieurs de ces pages sont des brouillons d'utilisateurs du wiki (espace « User:Najahho »), non des textes signés par Peterson ; elles compilent ses déclarations et le corpus des séries. Les pages ont été lues par l'intermédiaire d'un outil qui en restitue un résumé : une relecture directe des tableaux par un humain reste souhaitable avant publication.
