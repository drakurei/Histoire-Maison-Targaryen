# Rapport de l'agent 04 — lexique d'interface en haut valyrien

Date d'exécution : 13 novembre 2026.

## Résultat en bref

Le lexique d'interface compte **87 entrées**, toutes pourvues d'une forme valyrienne, d'une traduction française et anglaise, d'un niveau de fiabilité et de références. **Aucun néologisme** n'a été créé. Onze formes n'ont pas pu être confirmées telles quelles en ligne et sont signalées (`verifie_en_ligne: false`).

Trois fichiers ont été écrits, et rien d'autre n'a été modifié :

- `content/glossary/lexicon.json` (JSON validé avec `node`) ;
- `documentation/valyrian/grammaire-essentielle.md` ;
- ce rapport.

## Statistiques

| Niveau | Entrées | Part |
|---|---|---|
| `atteste` | 56 | 64 % |
| `derive` | 15 | 17 % |
| `editorial` | 15 | 17 % |
| `adaptation` | 1 | 1 % |
| `neologisme` | 0 | 0 % |
| **Total** | **87** | |

Répartition par famille : 11 navigation, 12 actions, 26 étiquettes, 9 expressions et titres, 8 périodes, 20 noms propres, 1 texte.

Vérification en ligne : 76 entrées `true`, 11 `false`.

## Méthode

1. **Collecte.** Lecture des pages de référence du wiki de David J. Peterson, puis des fiches de mots une à une, et de deux billets de son blog. Aucun traducteur automatique n'a été utilisé.
2. **Choix du mot.** Pour chaque sens voulu, j'ai retenu un mot dont la définition couvre ce sens. Quand aucun mot ne convenait, j'ai pris le mot attesté le plus proche et je l'ai dit dans la note, plutôt que d'inventer.
3. **Flexion.** Les formes fléchies suivent les paradigmes relevés sur la page des déclinaisons et sur la page de conjugaison. Chaque note donne la classe, le cas et le nombre.
4. **Classement.** Règles appliquées :
   - `atteste` : le mot figure comme entrée du dictionnaire, ou la forme apparaît dans une phrase citée ;
   - `derive` : forme fléchie régulière, y compris quand elle ne figure que dans un tableau de paradigme du wiki (ces tableaux sont en partie générés) ;
   - `editorial` : syntagme ou phrase composés pour le site, **ou** mot attesté employé dans un sens élargi (« livres » pour « sources », « choix » pour « menu ») ;
   - `adaptation` : nom propre laissé dans la graphie de Martin faute de forme valyrienne confirmée.
5. **`verifie_en_ligne`.** `true` signifie que **chaque forme de mot** de la chaîne a été vue sur une source consultée pendant cette exécution. Cela ne veut pas dire que le syntagme entier est attesté : c'est le champ `status` qui le dit.

## Sources effectivement consultées

Toutes via l'outil de lecture de pages, qui restitue un résumé du contenu et non le texte brut.

Wiki « The Languages of David J. Peterson » :

- Grammaire — https://wiki.languageinvention.com/index.php?title=High_Valyrian_Grammar
- Dictionnaire — https://wiki.languageinvention.com/High_Valyrian_Dictionary
- Déclinaisons — https://wiki.languageinvention.com/High_Valyrian_Noun_Declensions
- Cas — https://wiki.languageinvention.com/High_Valyrian_Noun_Cases
- Adjectifs — https://wiki.languageinvention.com/High_Valyrian_Adjectives
- Conjugaison — https://wiki.languageinvention.com/High_Valyrian_Verb_Conjugation
- Phonologie — https://wiki.languageinvention.com/High_Valyrian_Phonology
- Groupes de mots (parenté, titres) — https://wiki.languageinvention.com/index.php?title=High_Valyrian_Word_Groups
- Corpus des romans — https://wiki.languageinvention.com/High_Valyrian_Corpus
- Dialogues de la saison 3 de *House of the Dragon* — https://wiki.languageinvention.com/Season_3_House_of_the_Dragon_Dialogue (texte valyrien absent de l'extrait obtenu, page inexploitable)
- Fiches de mots lues (54) : aena, lua, valar, dohaeragon, morghūljagon, tembyr, udir, zaldrīzes, Targārien, Valyria, vīlībāzma, lentor, perzys, ānogar, Zaldrīzdōron, Dāro Vilinion, Vesteros, se, dārilaros, riña, valzȳrys, jēda, tegon, nūmāzma, remio, majēbagon, korigon, gūrēñagon, drāmmagon, bēmagon, āmāzigon, jumbagon, hembār, sikagon, ilagon, umbagon, daorun, ropagon, ainsi que Rhaenyra, Visenia, Rhaenys, Viserys, Syraks, Vagar, Āegon, ēlie, uēpa, dārys, daor, tolī, belmor, hāedar, tala, lēkia. Les adresses figurent dans le champ `refs` du lexique.

Sites de Peterson :

- « Valyrian Numerals » (14 août 2013) — https://dothraki.com/2013/08/valyrian-numerals
- « Some High Valyrian Inflection » — https://dothraki.com/?p=1227
- « Valyrian Geography », document de toponymes pour *House of the Dragon* — https://dedalvs.com/work/house-of-the-dragon/misc/map_request.pdf

Source secondaire :

- Wikipédia, « Valyrian languages » — https://en.wikipedia.org/wiki/Valyrian_languages (uniquement pour la phrase de *Game of Thrones* 304 et la règle d'accord du collectif).

### Ce qui n'a pas pu être lu

- **Le dictionnaire au-delà de la lettre Q.** Le texte reçu s'arrête à l'entrée *Qrillāetty*. Les mots en R, S, T, U, V et Z n'ont donc été vérifiés que par leur fiche individuelle ou par une autre page. Une recherche « introuvable » dans le dictionnaire ne prouve pas que le mot n'existe pas.
- **La page « High Valyrian Vocabulary »** (l'adresse renvoyait une autre fiche), l'ancien domaine wiki.dothraki.org (erreur) et la page « High Valyrian language » (refusée par le site).
- **Fiches en échec** (erreur du site ou accès refusé) : kipio, kipagon, pikībagon, elēdris, ālion, gōnka, vestriarzir, lilion, ērinnon, udrir, jokorigon, Aemond, hen siñot dāez, Perzys Ānogār. Conformément à la consigne, je n'ai tenté aucun contournement. Pour ces mots, le sens vient du dictionnaire et la flexion est inférée de la terminaison.
- Les pages de grammaire détaillée sont pour la plupart des brouillons d'un contributeur du wiki (espace « User:Najahho »), pas des textes signés par Peterson.

## Limites lexicales et solution retenue

| Sens voulu | Constat | Solution retenue | Niveau |
|---|---|---|---|
| histoire, chronique | aucun mot trouvé | *vestriarzir* « récit », pluriel *Vestriarja* | derive |
| bibliothèque | aucun mot trouvé | *jāelion* « trésorerie, dépôt » ; *Tembyroti Jāelion Valyrio* « dépôt des livres de Valyria » | editorial |
| source (documentaire) | aucun mot trouvé | *tembyr* « livre », pluriel *Tembyri* | editorial |
| menu | aucun mot trouvé | *Iderenna* « choix » (pluriel attesté) | editorial |
| page (« cette page n'existe pas ») | aucun mot trouvé | *Kesir ilos daor.* « Ceci n'existe pas. » | editorial |
| bataille, distinct de guerre | *vīlībāzma* couvre les deux sens | même mot pour `label.battle` et `label.war` | atteste |
| règne (nom) | seulement le verbe | infinitif *Jemēbagon* employé comme nom | atteste |
| né / née | pas d'adjectif « né » relevé | *Sitta*, participe parfait de *sikagon* « enfanter » | derive |
| conquête (nom) | seulement *ērinnon* « victoire » | *Āego Ērinnon* « la victoire d'Aegon » | editorial |
| chute (nom) | verbe *ropagon* sans nom dérivé | *Lentro Mōris* « la fin de la Maison » | editorial |
| origines | pas de mot « origine » | *Lentro Prānon* « le commencement de la Maison » | editorial |
| les rois d'après | pas d'adjectif « suivant » vérifié | reformulé : *Lilio Toliot* « après la Danse » | editorial |
| seigneurs dragons | non attesté dans ce qui a été lu | phrase d'accueil avec « dragons » | editorial |
| à propos de | pas de préposition dédiée | génitif + *bē*, d'après un seul exemple | editorial |
| fermer (une fenêtre) | *bēmagon* = verrouiller, sceller, fermer les yeux | *Bēmās*, approximation | derive |
| époux / épouse, neutre | termes sexués, ou *belmor* « consort royal » | *Belmor*, sexués donnés en note | atteste |
| frère, sœur, sans âge relatif | la langue distingue aîné et cadet | *Lēkia*, *Hāedar* (glosés aussi au sens général) | atteste |
| enfants (descendance) | *riña* = enfant, fille | collectif *Riñar*, glosé « children » dans la parenté | atteste |
| prince / princesse | un seul mot épicène | *Dārilaros* pour les deux clés | atteste |
| Aemond | aucune entrée trouvée | graphie de Martin conservée | adaptation |

Des néologismes réguliers étaient possibles (par exemple *tembyr* + suffixe de lieu *-lion* pour « bibliothèque », ou un nom d'action tiré de *ropagon* pour « chute »). Je les ai écartés : ils auraient l'air canoniques sans l'être.

## Points d'incertitude

1. **Cinq impératifs de boutons** (*Majēbās, Jokorjās, Pikībās, Bēmās, Drāmmās* ; *Majēbās* sert aussi dans la phrase d'accueil) sont formés selon la règle mais n'ont pas été vus. La classe de conjugaison de *pikībagon* et l'irrégularité exacte de *jokorigon* restent à confirmer.
2. **Génitifs et pluriels inférés** : *jāelio*, *lilio*, *Ālia*, *Issarossa*. Ils suivent des modèles vérifiés, mais les fiches étaient inaccessibles.
3. **Fiabilité des tableaux.** L'outil de lecture a parfois mal restitué des tableaux (colonnes décalées pour les adjectifs de classes II et III, cases ambiguës pour *lentor* et *tembyr*). J'ai recoupé avec une seconde source quand c'était possible ; les formes concernées sont notées.
4. **Analyse de *Valar morghūlis*.** La lecture retenue (collectif + aoriste 3e singulier) est celle des fiches du wiki. La valeur d'obligation vient de commentaires de Peterson sous un billet, rapportés par l'outil : à citer avec prudence. Le même fil évoque une lecture concurrente de *-is* comme 3e personne du pluriel.
5. **Exemples « exégétiques ».** Plusieurs appuis (*Zaldrīzo ānogar*, *Dārys morghūltas*, *Tolī rhūqo lōtinti*) sont des exemples rédigés pour le wiki, non des répliques des séries. Leur auteur n'est pas indiqué.
6. **Noms propres.** La flexion de *Daemon*, *Jaehaerys*, *Balerion*, *Merakses* et *Karakses* n'a pas été vérifiée ; seules leurs formes de citation le sont.
7. **Sens de *Sitta*** (« né ») : déduit du verbe, sans exemple en contexte.

## Propositions

1. **Relecture humaine ciblée** des 11 entrées non vérifiées et des tableaux de flexion, directement sur le wiki, avant toute mise en production.
2. **Compléter le dictionnaire R–Z** lors d'une prochaine exécution (lecture par catégories ou fiche par fiche), en priorité pour chercher : histoire, bataille, source, suivant, origine.
3. **Afficher le niveau de fiabilité dans le site.** Une marque discrète sur les chaînes `editorial` et `derive`, avec la note en infobulle, conviendrait à un musée et protège le projet du reproche d'invention.
4. **Parenté dépendante de l'âge.** Prévoir dans les données généalogiques l'ordre de naissance, afin de choisir entre *lēkia* et *valonqar*, *mandia* et *hāedar*.
5. **Accord des participes.** Si « né » et « mort » sont affichés à côté d'un nom, préférer les formes verbales invariables (*morghūltas*) ou accorder *sitta* au genre grammatical du nom (*sittys* après *dārys*).
6. **Distinguer bataille et guerre par la présentation** (icône ou catégorie), puisque la langue ne les sépare pas.
7. **Conserver la double graphie des noms.** Montrer *Vagar*, *Visenia*, *Karakses*, *Merakses*, *Syraks*, *Āegon* en valyrien et les graphies de Martin en français et en anglais.
8. **Ne pas décliner *Aemond*** dans les textes tant qu'aucune forme n'est confirmée.
9. **Glossaire de syntagmes réutilisables.** Ajouter au lexique les formules attestées utiles aux fiches de personnages : *Muña Zaldrīzoti*, *Dāria Sīkudo Dārȳti Vestero*, *Zaldrīzdōro Dārilaros*, *Valyrio Ezīmillion*.
