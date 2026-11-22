# Lexique étendu du haut valyrien : notes de travail

Agent 04 (linguiste), 21 novembre 2026. Fichier produit : `content/valyrian/lexicon-extended.json` (235 entrées au type `LexiconEntry`, plus un thème pour chacune des 87 entrées de `content/glossary/lexicon.json`).

## 1. Source et critère d'attestation

Toutes les entrées viennent du wiki **The Languages of David J. Peterson** (wiki.languageinvention.com ; c'est le nom que le site se donne dans ses métadonnées MediaWiki). Lecture faite le 21 novembre 2026 par l'API MediaWiki (`action=parse` et `action=query&prop=revisions`), avec curl :

1. la page « High Valyrian Dictionary » rendue en HTML (2 822 lignes de définition), pour repérer les candidats par le sens ;
2. le wikitexte de chaque page de mot retenue (280 pages lues), pour la forme exacte, le genre, la déclinaison ou la classe verbale, l'étymologie, les exemples sourcés et la catégorie « Appears on Duolingo ».

Une entrée reçoit `status: "atteste"` et `verified: true` lorsque :

- la page du mot existe dans la section « High Valyrian » du wiki (et non dans une autre langue de Peterson portée par la même page : plusieurs titres, comme *Tala*, *Kara*, *Se* ou *Hen*, existent aussi en valyrien d'Astapor, en irathient, etc. ; seule la section haut valyrien a été lue) ;
- aucune mention de canonicité incertaine n'y figure (le seul mot du dictionnaire marqué ainsi, *uēpys*, a été écarté) ;
- la forme `hv` est identique, macrons et ȳ compris, au titre de la page (minuscule initiale pour les noms communs). Ce contrôle a été fait par programme sur les 235 entrées.

Le champ `refs` donne l'URL de la page du mot ; les 4 URL testées répondent 200.

**Contrôle de reprise (22 novembre 2026).** Après l'interruption du travail, les 235 pages citées dans `refs` ont été relues d'un bloc par l'API (`action=query&prop=revisions`, cinq requêtes de 50 titres) : aucune page manquante, aucune redirection, chaque titre identique à la forme `hv`. Le genre, la déclinaison, le pluriel nominatif, la classe d'adjectif et le participe parfait de chaque entrée ont été comparés aux gabarits `{{head|…}}` et `{{hv-adj|…}}` de la page, et la glose française et anglaise à la définition `<onlyinclude>` : aucun écart. Le fichier se parse, chaque identifiant suit `lex.<thème>.<forme sans diacritiques>`, aucun texte ne contient de tiret cadratin ni de point d'exclamation, les 87 entrées d'origine ont toutes un thème. `node scripts/serial.mjs node scripts/build-content.mjs` sort sans erreur bloquante ni avertissement (322 mots au lexique : 87 + 235).

## 2. Ce que disent les notes au lecteur

Chaque note comporte une phrase originale (sens, nuance, étymologie, emploi notable), puis, générés à partir de la page du mot :

- « Employé dans Game of Thrones / House of the Dragon (saison, épisode) » lorsque la page cite une réplique datée (trois épisodes au plus par série) ;
- « Fait partie du vocabulaire du cours de haut valyrien de Duolingo » si la page porte la catégorie correspondante ;
- sinon « Mot du lexique publié par Peterson, sans emploi signalé dans les séries ».

Aucune réplique des séries n'est recopiée ; seuls l'épisode et la nature de l'emploi sont indiqués.

## 3. Grammaire

Le champ `grammar` est dérivé de l'en-tête de la page (`{{head|…}}`, `{{Type|…}}`, `{{hv-adj|…}}`) :

- noms : genre (lunaire, solaire, terrestre, aquatique), déclinaison, pluriel nominatif ; pour les mots de 6e déclinaison issus d'un collectif ou d'un paucal (*muñar*, *mīsior*, *sytiotāpior*, *azantyr*, *tīkun*, *jēdrar*, *guēsin*, *sōnar*, *jēdun*), le mot de base est nommé d'après le gabarit `hv-inf` de la page ;
- verbes : radical consonantique, vocalique ou irrégulier, participe parfait ;
- adjectifs et numéraux : classe I, II ou III et formes de citation par genre ;
- pronoms, conjonctions, particules, adverbes et postpositions : rédigés à la main d'après la définition.

## 4. Répartition par thème

| Thème | Entrées |
|---|---|
| parente | 17 |
| royaute | 16 |
| guerre | 17 |
| feu-et-dragons | 16 |
| nature | 19 |
| animaux | 11 |
| corps | 13 |
| temps | 12 |
| nombres | 13 (1 à 10, 20, 100, 1000) |
| couleurs | 9 |
| verbes | 24 |
| adjectifs | 16 |
| grammaire | 20 |
| religion-et-magie | 13 |
| lieux-et-peuples | 19 |

Identifiants : `lex.<thème>.<forme sans diacritiques>` ; les espaces deviennent des tirets (*lex.feu-et-dragons.zirtys-perzys*). Aucun doublon, aucune forme déjà présente dans le lexique d'origine (*Valyria*, déjà `name.valyria`, a été retiré pour cette raison).

## 5. Thèmes donnés aux 87 entrées d'origine

- `nav.*`, `action.*` et les étiquettes purement fonctionnelles (`label.born`, `label.died`, `label.word`, `label.meaning`, `label.source`) : `interface` ;
- `phrase.*`, `text.*`, `title.*` : `formules` ;
- `period.*` : `temps` (comme le faisait déjà le préfixe par défaut du script) ;
- `name.*` : `noms`, sauf les quatre noms de lieux (`name.dragonstone`, `name.kings_landing`, `name.westeros`, `name.valyria`) rangés en `lieux-et-peuples` ;
- étiquettes porteuses d'un mot plein, rangées avec le vocabulaire du même champ : roi, reine, prince, princesse, règne en `royaute` ; dragon, dragonnier, feu en `feu-et-dragons` ; père, mère, enfants, époux, frère, sœur, maison en `parente` ; année, époque en `temps` ; bataille, guerre en `guerre` ; lieu en `lieux-et-peuples` ; sang en `corps`.

## 6. Points à signaler hors de mon périmètre

1. **Libellés de thèmes.** `content/interface/ui.v1-savoirs.json` ne connaît que `corps, feu, formules, guerre, interface, nature, nombres, noms, parente, royaute, temps`. Les thèmes demandés `feu-et-dragons`, `animaux`, `couleurs`, `verbes`, `adjectifs`, `grammaire`, `religion-et-magie`, `lieux-et-peuples` s'affichent donc avec la valeur brute capitalisée (« Feu-et-dragons ») jusqu'à l'ajout des clés `page.lexicon.theme.*` correspondantes par l'agent chargé de l'interface. La clé `feu` n'a plus d'entrée.
2. **Péninsule valyrienne.** `grammaire-essentielle.md` (§ 5) cite *Valyrio Hygyrion* d'après le document de cartographie de Peterson ; le dictionnaire du wiki donne *hyngirion* (« péninsule », de *hyngagon*, « faire saillie »). Le lexique étendu suit le dictionnaire ; la graphie du document de travail mérite d'être relue.
3. **Étiquettes de l'interface.** `kipio`, employé pour « dragonnier », signifie au dictionnaire « cavalier » au sens général ; le terme spécifique est *zaldrīzāeksio* (« seigneur des dragons, dragonnier »), désormais au lexique étendu.

## 7. Ce qui reste douteux

- Le wiki est rédigé par une communauté avec la participation de Peterson (notes signées « djpnotes »). Il fait autorité pour la langue de Peterson, mais n'est pas un texte de Peterson ligne à ligne.
- « Sans emploi signalé dans les séries » signifie que la page du mot ne cite aucune réplique ; un emploi non relevé par le wiki reste possible.
- Les épisodes de la saison 3 de *House of the Dragon* cités par le wiki (par exemple pour *āeksion*, *pyrys*, *uēpa*, *volpilla*) n'ont pas été contrôlés à l'image.
- La mention « cours Duolingo conçu avec Peterson » repose sur la catégorie du wiki ; le contenu exact du cours n'a pas été consulté.
- Pour *valonqar* et *drakarys*, l'origine chez Martin est indiquée par les notes de Peterson sur le wiki ; pour *maegi*, l'emploi chez Martin (Mirri Maz Duur) est un fait des livres, la page du wiki ne donne pas d'étymologie.
- Candidats vérifiés mais non retenus pour rester sous 240 entrées : *mandia-zȳrys*, *iāpa*, *qȳbor*, *dārior*, *ondor*, *azandy*, *obo*, *egros*, *tīkos*, *sambar*, *rizmon*, *parmon*, *rūklon*, *nāvar*, *daomio*, *āegion*, *sōna*, *vaokses*, *lāra*, *klios*, *jaos*, *kēli*, *pungos*, *eleks*, *kris*, *kiōs*, *iosrūlirion*, *drūr*, *zān*, *kisagon*, *mōzugon*, *raqagon*, *rhēdegon*, *emagon*, *byka*, *litse*, *quba*, *kōz*, *kessa*, *bona*, *qrimbrōzvos*, *hīlivos*, *geralbar*, *qīzalbar*. Ils peuvent compléter une version ultérieure sans nouvelle recherche.
