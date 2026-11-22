# Le haut valyrien dans les chaînes d'interface de la version 1

Agent 04 (linguiste), 22 novembre 2026. Fichiers touchés : `content/interface/ui.v1-bati.json`, `ui.v1-chroniques.json`, `ui.v1-lignee.json`, `ui.v1-registres.json`, `ui.v1-savoirs.json` (champs `hv`, `status`, `note` seulement ; clés, français et anglais inchangés). `ui.seuil.json` et `ui.core.json` ne sont pas modifiés.

## 1. Règle suivie

La règle du site : le haut valyrien tient la navigation, les titres, les étiquettes et les formules, **chacun glosé** dans la langue d'appui. Une forme valyrienne n'a donc été posée que si les deux conditions suivantes sont remplies.

1. **La langue permet de la bâtir honnêtement** : mot attesté (`atteste`), forme fléchie selon un paradigme publié (`derive`), ou composition prudente d'éléments attestés (`editorial`). Aucune forme n'a été retenue sans que sa fiche ait été lue.
2. **Le composant l'affiche avec sa glose.** En mode `hv`, `useT()` renvoie la forme valyrienne seule, sans glose ni attribut `lang` ; `<Gloss k>` et `<Rubric k>` affichent la forme et sa glose. J'ai relevé dans `src/versions/v1-codex` comment chaque clé est lue. Une forme posée sur une chaîne lue par `t()` apparaîtrait nue dans un titre visible, dans une phrase française ou dans un `aria-label` : elle enfreindrait la règle au lieu de la servir.

Toutes les formes posées ici sont donc lues par `<Rubric k>` (titres rubriqués), `<Gloss k>` (boutons de l'étagère, salles de la langue) ou les deux.

## 2. Vérification

- Chaque mot a été relu le 22 novembre 2026 sur wiki.languageinvention.com par l'API MediaWiki (`action=query&prop=revisions` pour l'en-tête `{{head|…}}` et les exemples, `action=parse` pour les tableaux de flexion de *jēnqa* et *bōsa*).
- Le pluriel de chaque nom est celui que donne l'en-tête de sa fiche (« nominative plural »), recopié lettre à lettre, macrons et ȳ compris. Aucune forme ne prend de macron ou de ȳ que la fiche ne donne pas.
- Le statut suit la convention de `ui.core.json` : le mot tel quel est `atteste` ; une forme fléchie ou un syntagme accordé selon les tableaux publiés est `derive`, comme *Vīlībāzmi* ou *Ēlī Dāryssy*.
- `node scripts/serial.mjs node scripts/build-content.mjs` : aucune erreur, aucun avertissement ; 697 chaînes d'interface, dont 80 avec forme valyrienne (59 dans `ui.core.json`, 21 ajoutées ici).

## 3. Formes ajoutées

21 chaînes reçoivent une forme : **7 attestées, 14 dérivées, 0 éditoriale.**

| Clé | hv | Glose (fr) | Statut | Justification |
|---|---|---|---|---|
| `page.bati.shelf.volumes` | Tembyri | Volumes | derive | Nominatif pluriel de *tembyr*, « livre, tome » (2e/6e déclinaison lunaire, pluriel *tembyri* donné par la fiche). Même forme que le titre « Sources » de la navigation : la glose distingue les deux emplois. |
| `page.bati.shelf.registers` | Sōlutti | Registres | derive | Nominatif pluriel de *sōlutty*, « rouleau ; carte, registre, comptes » (2e déclinaison lunaire, pluriel donné par la fiche). |
| `page.portal.registers.title` | Sōlutti | Les registres | derive | Même forme ; le haut valyrien n'a pas d'article. |
| `page.sources.register.title` | Sōlutty | Le registre | atteste | Le mot tel quel ; le registre des sources est une liste d'ouvrages. |
| `page.portal.volumes.title` | Jēnqi Tembyri | Les huit volumes | derive | *jēnqa*, « huit », numéral de classe I, prend devant le nom la forme prépositive du nominatif pluriel lunaire *jēnqi* (tableau de la fiche) ; *tembyr* est lunaire. Le numéral précède un nom au pluriel, comme dans *Izulyz Ampā Perzyssy*, « les Quatorze Flammes ». |
| `page.bati.title.lexicon` | Udra | Lexique | derive | Nominatif pluriel de *udir*, « mot » (5e déclinaison aquatique, pluriel donné par la fiche) : le lexique est nommé par ses mots. Sert aussi de nom de salle sur la page de la langue. |
| `page.bati.title.phrases` | Udrini | Expressions | derive | Nominatif pluriel de *udrin*, « phrase, dicton, aphorisme », ancien paucal de *udir* devenu mot autonome (pluriel donné par la fiche). |
| `page.grammar.lessons.title` | Gūrēnilagja | Les leçons | derive | Nominatif pluriel de *gūrēnilaksir*, « leçon » (5e déclinaison aquatique, radical alterné *gūrēnilaks-* / *gūrēnilagj-*) ; la fiche cite *Gūrēnilaksir Ēlior*, « Première leçon ». |
| `page.path.quiz.title` | Epvossa | Questions | derive | Nominatif pluriel de *epvos*, « question, demande » (3e déclinaison solaire). |
| `page.person.life.heading` | Glaeson | Ligne de vie | atteste | *glaeson*, « vie » (3e déclinaison terrestre), employé dans *Game of Thrones* (6.02) et *House of the Dragon* (1.04). La rubrique nomme la vie ; la ligne est la figure qui suit. |
| `page.person.dragons.one` | Kiptys Zaldrīzes | Dragon monté | derive | *kipta*, participe parfait de *kipagon*, « chevaucher », se décline comme un adjectif de classe I ; devant *zaldrīzes*, nom solaire, forme prépositive du nominatif singulier solaire *-ys* (comme *bōsys bantis*, « la longue nuit »). Littéralement « dragon chevauché ». |
| `page.person.dragons.many` | Kiptyz Zaldrīzesse | Dragons montés | derive | *zaldrīzesse*, pluriel de *zaldrīzes* ; participe à la forme prépositive du nominatif pluriel solaire *-yz* (variante *-ys*), d'après le tableau de classe I de *bōsa* (*bōsyz/bōsys*). |
| `page.dragon.riders.heading` | Kipia | Cavaliers | derive | Nominatif pluriel de *kipio*, « cavalier » (3e déclinaison lunaire), le mot qui nomme ailleurs le dragonnier. |
| `page.dragon.origin.heading` | Asiñon | Origine | atteste | *asiñon*, « origine » (3e déclinaison terrestre). |
| `page.dragon.appearance.heading` | Sȳndrilla | Robe | atteste | *sȳndrilla*, « couleur, teinte » (1re déclinaison aquatique) : la robe d'un dragon est sa couleur. |
| `page.dragon.battles.heading` | Vīlībāzmi | Batailles | derive | Nominatif pluriel de *vīlībāzma*, « guerre ; bataille, combat ». Même forme que le titre « Guerres » de la navigation : le mot couvre les deux sens. |
| `page.war.battles.heading` | Vīlībāzmi | Les batailles | derive | Même forme. |
| `page.dragon.fate.heading` | Vējes | Sort | atteste | *vējes*, « destin, sort » (4e déclinaison solaire), employé dans *Game of Thrones* (3.07) ; comme nom propre, le même mot désigne le Fléau de Valyria. |
| `page.war.causes.heading` | Indiraria | Les causes | derive | Nominatif pluriel de *indirarion*, « raison, motif, cause » (3e déclinaison terrestre) ; le singulier est employé dans *House of the Dragon* (1.02). |
| `page.about.why.title` | Skorȳso | Pourquoi | atteste | *skorȳso*, adverbe interrogatif « pourquoi », employé seul comme titre. |
| `page.about.mark.title` | Kīvo | Le poinçon | atteste | *kīvo*, « empreinte, marque, sceau » (3e déclinaison lunaire). À ne pas confondre avec *kīvio*, « serment ». |

Fiches lues : Tembyr, Sōlutty, Jēnqa, Bōsa, Udir, Udrin, Gūrēnilaksir, Epvos, Glaeson, Kipagon, Zaldrīzes, Kipio, Asiñon, Sȳndrilla, Vīlībāzma, Vējes, Indirarion, Skorȳso, Kīvo (adresse : `https://wiki.languageinvention.com/<titre>`).

## 4. Chaînes laissées sans valyrien

Les 593 autres chaînes restent sans `hv`, et c'est voulu. Elles se répartissent ainsi.

### 4.1 Titres rubriqués que la langue ne permet pas de dire (26)

Ces titres sont affichés avec glose, mais aucune forme honnête n'existe.

| Clé | Français | Raison |
|---|---|---|
| `page.bati.title.grammar` | Grammaire | Aucun mot au dictionnaire ; *iōros* est le cas grammatical, *verdilla* un système. Composer « système de la langue » serait une invention. |
| `page.chronicles.list.title` | Table des volumes | Pas de mot pour une table des matières (*qurdon* est le meuble). |
| `page.period.annals.title` | Annales | Pas de mot ; *vestriarzir* sert déjà aux « Chroniques ». |
| `page.period.questions.title` | Questions ouvertes | *epvossa* dit « questions » ; « ouvertes », au sens de non tranchées, n'a pas d'équivalent simple, et la forme partielle trahirait la rubrique. |
| `page.person.kin.heading` | Parenté | Pas de mot pour la parenté en général ; *lentor* nomme déjà la Maison sur la même fiche, *muñar* veut dire « les parents ». |
| `page.person.notice.heading` | Notice | Pas de mot pour une notice biographique. |
| `page.dragon.span.heading` | Envergure | Pas de mot ; *tīkun* est l'aile. |
| `page.war.camps.heading` | Les camps | Aucun mot générique pour un camp ou un parti ; *Kasty* et *Zōbrys* ne nomment que les Verts et les Noirs. |
| `page.path.steps.title` | Les étapes | *dekuros* est le pas comme mesure, *deks* le pied ; rien pour l'étape d'un parcours. |
| `page.grammar.frame.title` | Le cadre du nom | Métalangue grammaticale sans terme publié. |
| `page.language.status.title` | Lire les statuts | Consigne à l'infinitif : ce serait une phrase, non une étiquette. |
| `page.place.battles.heading` | Batailles livrées ici | « Ici » demande une relative ; *Vīlībāzmi* seul dirait autre chose. |
| `page.about.type.title` | Polices et licences | Notions typographiques et juridiques modernes. |
| `page.person.doubt.heading`, `page.person.adaptation.heading`, `page.dragon.adaptation.heading`, `page.place.role.heading`, `page.place.events.heading`, `page.war.consequences.heading`, `page.language.origin.title`, `page.language.forbid.title`, `page.sources.levels.title`, `page.sources.separate.title`, `page.learn.volumes.title`, `page.about.how.title`, `page.about.debt.title` | titres en forme de phrase (« Ce que l'adaptation change », « D'où vient cette langue »…) | Relatives, verbes conjugués, questions : il faudrait écrire des phrases entières, ce que le site réserve à la langue d'appui. |

### 4.2 Chaînes courtes lues par `t()`, donc affichées sans glose (231)

Étiquettes, boutons, colonnes, filtres, marques de règle et libellés de catégories dont le rôle appellerait le valyrien, mais que les composants lisent avec `t()`. Une forme posée s'afficherait nue. **À signaler à l'agent de la version 1** : passer ces chaînes par `<Gloss k>` ou `ui(key)` avant d'y poser une forme. Liste : `page.bati.search.trigger`, `page.bati.search.count.one`, `page.bati.search.kind.*` (9), `page.bati.sources.unlisted`, `page.bati.time.zone.*` (3), `page.bati.filter.clear`, `page.bati.filter.text`, `page.bati.support.label`, `page.portal.open_first`, `page.portal.all_volumes`, `page.portal.skip`, `page.portal.curve.title`, `page.portal.curve.axis`, `page.portal.curve.readout.none`, `page.portal.curve.readout.one`, `page.portal.curve.annot.*` (5), `page.portal.curve.valyria`, `page.chronicles.ribbon.dragons`, `page.chronicles.ribbon.volumes`, `page.chronicles.ribbon.reigns`, `page.chronicles.volume.annals`, `page.period.filter.label`, `page.period.filter.people`, `page.period.filter.dragons`, `page.period.filter.reliability`, `page.period.consequence`, `page.period.q.*` (3), `page.period.nav.label`, `page.period.prev`, `page.period.next`, `page.period.adaptation`, `page.event.date.*` (2), `page.event.people`, `page.event.dragons`, `page.event.places`, `page.event.reliability`, `page.event.sources`, `page.event.rule.label`, `page.event.nav.label`, `page.event.prev`, `page.event.next`, `page.lignee.zoom.recenter`, `page.lignee.zoom.all`, `page.lignee.loops`, `page.lignee.mode.thread`, `page.lignee.mode.tree`, `page.lignee.panel.parents`, `page.lignee.panel.unions`, `page.lignee.panel.unknownPartner`, `page.lignee.panel.siblings`, `page.lignee.key.title`, `page.lignee.key.filiation`, `page.lignee.key.doubt`, `page.lignee.key.union`, `page.lignee.key.liaison`, `page.lignee.key.crowned`, `page.lignee.key.alliance`, `page.people.sign.*` (3), `page.people.sort.*` (4), `page.people.filter.roles`, `page.people.filter.houses`, `page.people.role.*` (5), `page.person.alive.m`, `page.person.alive.f`, `page.person.inTree`, `page.person.rule.*` (5), `page.person.kin.issue`, `page.person.kin.siblings`, `page.dragons.epoch.one`, `page.dragons.years.unknownAlive`, `page.dragon.part.*` (4), `page.dragon.described`, `page.dragon.undescribed`, `page.dragon.fly`, `page.dragon.flying`, `page.dragon.rule.hatched`, `page.dragon.rule.died`, `page.dragon.previous`, `page.dragon.next`, `page.dragon.back`, `page.places.filter.kind`, `page.places.kind.*` (7), `page.places.kinds.*` (7), `page.place.near`, `page.wars.battle`, `page.war.undecided`, `page.war.date.*` (2), `page.war.previous`, `page.war.next`, `page.war.back`, `page.savoirs.status.label`, `page.savoirs.status.atteste`, `page.savoirs.status.derive`, `page.savoirs.status.editorial`, `page.savoirs.status.adaptation`, `page.language.specimen.valar.*` (3), `page.language.specimen.morghulis.lemma`, `page.language.specimen.morghulis.sense`, `page.language.status.count.one`, `page.language.status.example`, `page.language.rooms.title`, `page.language.rooms.pending`, `page.lexicon.filter.*` (3), `page.lexicon.col.*` (3), `page.lexicon.entry.grammar`, `page.lexicon.entry.note`, `page.lexicon.entry.refs`, `page.lexicon.entry.link`, `page.lexicon.theme.*` (11), `page.grammar.genders.title`, `page.grammar.gender.*` (5), `page.grammar.numbers.title`, `page.grammar.number.*` (8), `page.grammar.cases.title`, `page.grammar.case.*` (16), `page.grammar.lessons.empty.action`, `page.phrases.literal`, `page.phrases.meaning`, `page.phrases.context`, `page.phrases.analysis`, `page.sources.levels.count.one`, `page.sources.entry.cited.one`, `page.sources.entry.cited.none`, `page.sources.entry.members`, `page.sources.type.*` (5), `page.sources.separate.books`, `page.sources.separate.screen`, `page.learn.progress.none`, `page.path.retain`, `page.path.links`, `page.path.quiz.yours`, `page.path.quiz.correct`, `page.path.quiz.next`, `page.path.quiz.finish`, `page.path.quiz.mistakes`, `page.path.quiz.retryMistakes`, `page.path.quiz.restart`, `page.path.next`, `page.path.previous`.

Beaucoup restent d'ailleurs sans forme possible même glosés (catégories grammaticales, genres de lieux, types d'ouvrages, boutons du questionnaire). Pour celles qui ont un équivalent sûr, voici les formes déjà vérifiées, **non posées**, prêtes pour le jour où le composant glosera :

| Clé(s) | Forme proposée | Statut | Appui |
|---|---|---|---|
| `page.event.dragons`, `page.period.filter.dragons`, `page.bati.search.kind.dragon`, `page.chronicles.ribbon.dragons` | Zaldrīzesse | atteste | `nav.dragons` |
| `page.event.people`, `page.period.filter.people`, `page.bati.search.kind.person` | Issarossa | derive | `nav.characters` |
| `page.event.places`, `page.bati.search.kind.place` | Ālia | derive | `nav.places` |
| `page.event.sources` | Tembyri | editorial | `nav.sources` |
| `page.bati.search.kind.war`, `page.bati.search.kind.battle` | Vīlībāzmi | derive | `nav.wars` |
| `page.bati.search.kind.event` | Massina | derive | pluriel de *massinon*, « événement » (fiche) |
| `page.event.reliability`, `page.period.filter.reliability` | Sīlāves | atteste | *sīlāves*, « certitude » (fiche) |
| `page.person.rule.born` | Siñon | atteste | *siñon*, « naissance » (fiche) |
| `page.person.rule.died`, `page.dragon.rule.died` | Morghon | atteste | *morghon*, « la mort » (fiche, lexique étendu) |
| `page.lexicon.col.meaning`, `page.phrases.meaning` | Nūmāzma | atteste | `label.meaning` |
| `page.savoirs.status.label`, `page.lexicon.filter.status` | Iōros | atteste | *iōros*, « état, condition, statut » (fiche) |
| `page.lignee.panel.parents` | Muñar | atteste | lexique étendu |
| `page.dragon.part.flame` | Perzys | atteste | `label.fire` |

### 4.3 Libellés d'accessibilité et attributs (29)

Lus par `t()` dans `aria-label`, `title`, `placeholder` ou un texte réservé aux lecteurs d'écran : comme les clés `a11y.*`, ils doivent rester dans une langue que le lecteur d'écran sait prononcer. `page.bati.spines.label`, `page.bati.ribbons.label`, `page.bati.shelf.label`, `page.bati.search.title`, `page.bati.search.placeholder`, `page.bati.colophon.hallmark`, `page.bati.filter.label`, `page.lignee.stage.role`, `page.lignee.zoom.in`, `page.lignee.zoom.out`, `page.lignee.mode.label`, `page.lignee.search.label`, `page.lignee.search.placeholder`, `page.lignee.panel.close`, `page.lignee.zoom.label`, `page.people.legend`, `page.dragons.scale.human`, `page.dragon.pager`, `page.map.zoomIn`, `page.map.zoomOut`, `page.map.reset`, `page.places.index.label`, `page.place.back`, `page.wars.chart.label`, `page.war.dragons`, `page.war.pager`, `page.language.wall.label`, `page.path.quiz.choices`, `page.path.all`.

### 4.4 Fragments insérés dans une phrase de la langue d'appui (56)

Mots de parenté, signes d'union, conjonctions et adverbes que `useKinWords` ou les composants insèrent dans une phrase française ou anglaise (« l'un est pour l'autre {kin} », « A contre B ») : une forme valyrienne y casserait la phrase. Plusieurs mots existent pourtant (*kepa*, *muña*, *trēsy*, *tala*, *eglia*, *valzȳrys*, *ābrazȳrys*), et la langue distingue ce que le français confond (*kekepa* et *kepāzma* pour « grand-père ») : à reprendre si la lignée affiche un jour ces liens comme étiquettes glosées. `page.event.approx`, `page.lignee.crowned`, `page.lignee.and`, `page.lignee.union.*` (4), `page.lignee.coefficient`, `page.lignee.sonOf`, `page.lignee.daughterOf`, `page.lignee.kin.*` (44), `page.dragons.riders.and`, `page.war.versus`.

### 4.5 Chaînes à variable (83)

Elles insèrent un nombre, une date, un nom ou une plage d'années mis en forme dans la langue d'appui (« Volume {n} », « {n} dragons », « de {from} à {to} ») ; le valyrien n'a pas de sigle d'ère attesté (`format.ts`) et beaucoup sont des phrases. `page.bati.volume.numbered`, `page.bati.search.none`, `page.bati.search.count.many`, `page.bati.search.more`, `page.bati.folio.leaf`, `page.bati.folio.volume`, `page.bati.note.ref`, `page.bati.time.label`, `page.bati.figure.number`, `page.bati.filter.count`, `page.portal.curve.span`, `page.portal.curve.lead`, `page.portal.curve.caption`, `page.portal.curve.uncounted`, `page.portal.curve.readout.many`, `page.portal.curve.readout.doubt`, `page.portal.reg.dragons`, `page.chronicles.ribbon.label`, `page.chronicles.ribbon.caption`, `page.chronicles.volume.events`, `page.chronicles.volume.essay`, `page.event.in_volume`, `page.lignee.intro`, `page.lignee.rail.circa`, `page.lignee.search.count`, `page.lignee.panel.reign`, `page.lignee.panel.parentsKin`, `page.lignee.panel.alleged`, `page.lignee.panel.childrenOf`, `page.lignee.panel.read`, `page.lignee.panel.centerOn`, `page.people.lead`, `page.people.generation`, `page.person.house`, `page.person.reign`, `page.person.claim`, `page.person.life.label`, `page.person.notice.body`, `page.dragons.lead`, `page.dragons.epoch.count`, `page.dragons.years.since`, `page.dragons.years.until`, `page.dragon.plate.title`, `page.dragon.span.ruler`, `page.dragon.span.value`, `page.dragon.compare.title`, `page.dragon.riders.rule`, `page.place.map.title`, `page.place.map.caption`, `page.wars.lead`, `page.wars.volume`, `page.wars.sides`, `page.wars.moreSides`, `page.wars.battles`, `page.war.map.title`, `page.war.between`, `page.war.victor`, `page.language.wall.caption`, `page.language.status.count`, `page.language.rooms.lexicon`, `page.lexicon.tally.caption`, `page.grammar.decl`, `page.grammar.lesson.number`, `page.sources.levels.caption`, `page.sources.levels.count`, `page.sources.entry.cited`, `page.sources.entry.titleFr`, `page.sources.entry.span`, `page.sources.entry.since`, `page.sources.separate.figure`, `page.learn.meta`, `page.learn.progress.ongoing`, `page.learn.progress.done`, `page.path.number`, `page.path.quiz.intro`, `page.path.quiz.counter`, `page.path.quiz.wrong`, `page.path.quiz.result`, `page.path.quiz.given`, `page.path.quiz.answer`, `page.about.figure.caption`, `page.about.figure.title`, `page.about.justification`.

### 4.6 Phrases, textes explicatifs, messages d'aide et d'état (128)

Introductions, légendes de figures, définitions, consignes, états vides, réponses du questionnaire : le récit et l'explication restent dans la langue d'appui, parce que le lexique publié ne permet pas de les écrire sans inventer la langue. Toutes les clés `*.lead`, `*.intro`, `*.caption`, `*.body`, `*.hint`, `*.help`, `*.empty*`, `*.def`, les notes de la page de la langue, les rôles des polices et les messages de `page.path.quiz.*` qui sont des phrases. Liste complète : `page.bati.search.idle`, `page.bati.search.keys`, `page.bati.colophon.unofficial`, `page.bati.colophon.credits`, `page.bati.colophon.type`, `page.portal.curve.label`, `page.portal.curve.hint`, `page.portal.reg.lignee`, `page.portal.reg.personnages`, `page.portal.reg.guerres`, `page.portal.reg.lieux`, `page.portal.reg.langue`, `page.portal.reg.apprendre`, `page.portal.reg.sources`, `page.chronicles.lead`, `page.period.essay.pending`, `page.period.rule.label`, `page.period.annals.lead`, `page.period.annals.empty`, `page.period.annals.emptyBody`, `page.period.questions.lead`, `page.event.continuity.adaptation`, `page.lignee.stage.label`, `page.lignee.thread.label`, `page.lignee.search.none`, `page.lignee.panel.noParents`, `page.lignee.panel.noChildren`, `page.lignee.key.ruling`, `page.lignee.key.blood`, `page.lignee.key.loop`, `page.people.ribbon.label`, `page.people.ribbon.caption`, `page.people.empty.title`, `page.people.empty.body`, `page.person.datesUnknown`, `page.person.life.noEvents`, `page.person.kin.alleged`, `page.person.doubt.datesApprox`, `page.person.doubt.datesUnknown`, `page.dragons.scale.region`, `page.dragons.scale.title`, `page.dragons.scale.caption`, `page.dragons.order`, `page.dragons.riders.one`, `page.dragons.riders.many`, `page.dragons.riders.none`, `page.dragon.plate.caption`, `page.dragon.span.standard`, `page.dragon.span.attested`, `page.dragon.span.estimated`, `page.dragon.appearance.none`, `page.dragon.extra`, `page.map.help`, `page.places.lead`, `page.places.map.title`, `page.places.map.caption`, `page.places.map.missing`, `page.places.map.missingBody`, `page.places.empty`, `page.places.registryMissing`, `page.places.registryMissingBody`, `page.place.nothing`, `page.wars.chart.caption`, `page.war.map.caption`, `page.war.losses`, `page.savoirs.status.*.def` (4), `page.language.lead`, `page.language.origin.martin`, `page.language.origin.peterson`, `page.language.origin.shape`, `page.language.note.martin`, `page.language.note.peterson`, `page.language.note.refs`, `page.language.specimen.caption`, `page.language.specimen.morghulis.grammar`, `page.language.forbid.*` (6), `page.language.status.intro`, `page.language.rooms.grammar`, `page.language.rooms.phrases`, `page.lexicon.lead`, `page.lexicon.entry.unverified`, `page.lexicon.empty.title`, `page.lexicon.empty.body`, `page.lexicon.none.title`, `page.lexicon.none.body`, `page.grammar.lead`, `page.grammar.frame.caption`, `page.grammar.genders.note`, `page.grammar.numbers.note`, `page.grammar.lessons.empty.title`, `page.grammar.lessons.empty.body`, `page.phrases.lead`, `page.phrases.interim.title`, `page.phrases.interim.body`, `page.phrases.empty.title`, `page.phrases.empty.body`, `page.sources.lead`, `page.sources.levels.intro`, `page.sources.register.intro`, `page.sources.separate.body`, `page.sources.separate.caption`, `page.learn.lead`, `page.learn.empty.title`, `page.learn.empty.body`, `page.path.quiz.round`, `page.path.quiz.right`, `page.path.quiz.perfect`, `page.path.quiz.empty`, `page.about.lead`, `page.about.why.body`, `page.about.how.data`, `page.about.how.figures`, `page.about.type.intro`, `page.about.type.*.role` (4), `page.about.debt.martin`, `page.about.debt.peterson`, `page.about.mark.body`.

### 4.7 Noms propres, codes et crédits (35)

Noms de maisons de Westeros sans forme valyrienne publiée (*Targārien* existe au lexique, mais la clé `page.people.house.targaryen` est lue par `t()` dans une liste de filtres où les autres maisons resteraient en français), codes de langue `HV`, `FR`, `EN`, prénom d'exemple de la clé du rouleau, nom de Balerion sur la règle d'envergure (lu par `t()`), crédits des polices. `page.people.house.*` (26), `page.bati.lang.short.*` (3), `page.lignee.key.allianceSample`, `page.dragon.span.balerion`, `page.about.type.*.credit` (4).

### 4.8 Ouverture et tiroirs (5)

- `seuil.skip` est lu par `uiByKey.get(…)[reading]`, donc toujours dans la langue d'appui ; `seuil.replay` par `t()` dans le colophon. Le bouton de l'ouverture doit se comprendre au premier regard.
- `page.bati.shelf.drawerVolumes`, `page.bati.shelf.drawerRegisters`, `page.bati.shelf.drawerLanguage` : titres de tiroir affichés par `ui(titleKey).primary` sans glose (`Shelf.tsx`, fonction `Drawer`). Ce sont en outre des groupes nominaux longs (« Les huit volumes de la chronique »). Si le tiroir affiche un jour la glose, *Jēnqi Tembyri* et *Sōlutti* conviendraient aux deux premiers.

## 5. Ce qui reste douteux

- *Kiptys Zaldrīzes* et *Kiptyz Zaldrīzesse* reposent sur la règle générale « le participe parfait se décline comme un adjectif de classe I » (grammaire du wiki, § 8 de `grammaire-essentielle.md`) et sur le tableau des formes prépositives de *bōsa* ; aucune réplique ne montre *kipta* accordé. Statut `derive`, à relire si un emploi paraît.
- *Tembyri* sert désormais à « Volumes » et, depuis la première version, à « Sources » (`nav.sources`, éditorial). La glose lève l'ambiguïté, mais un choix différent pour les sources (le sens premier de *tembyr* est « livre ») mériterait d'être discuté.
- Les fiches du wiki sont rédigées par une communauté avec la participation de Peterson ; elles font autorité pour sa langue sans être son texte ligne à ligne.
