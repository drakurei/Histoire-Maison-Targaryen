# Version 2, « Sable et gueules » : bâti, pour les auteurs de pages

Spécification : `documentation/design/v2-spec.md` (elle fait foi). Interdits : `DESIGN.md` §0. La V2 n'importe jamais `src/versions/v1-codex/`.

## Le contrat d'une page

- Un fichier `pages/<Nom>.tsx`, export par défaut, déjà branché dans `index.tsx` (chargé à la demande). Le squelette pose le `main` et le `h1` : garder les deux.
- `<Page partition="parti | pal | fasce | champ">` rend le seul `main` (`MAIN_ID`) avec les marges et la grille de 12 colonnes. La partition est celle de la spec §2.4, jamais une cinquième.
- `<Titre k="nav.dragons" />` ou `<Titre text={period.title} />` : le seul `h1`, glose comprise. `children` = ce qui suit dans l'en-tête.
- Identifiant inconnu (`getPerson(id)` vide) : `return <Introuvable />`.
- Aucune chaîne en dur : `content/interface/ui.v2-<domaine>.json` puis `node scripts/serial.mjs node scripts/build-content.mjs`. Réutiliser `nav.*`, `label.*`, `action.*`, `page.bati.*` quand le sens est le même. Le bâti a déjà `v2.year.outside.unborn` et `v2.year.outside.dead` ({year}, {name}, {n}), `v2.map.fullscreen`, `v2.cartel.none`.

## Ce que la page donne à la fasce : `useFasce()` (`state/fasce.ts`)

- `useFasce({ span: [105, 153] })` : la durée de la vue, en sang, le reste en cramoisi, trait ivoire au-dessus. `reign: [from, to]` ajoute le trait d'or.
- `useFasce({ off: true })` : fasce éteinte (langue, sources, à propos).
- `useFasce({ marks: [{ year: 130 }, { year: 131, active: true }] })` : encoches d'entité (années d'un lieu, survol d'une rangée).
- `useFasce({ majesty: 45 })` : la fasce en majesté, en `svh` (portail 45, introuvable 30), ordinateur seulement.
- Plusieurs appels se composent ; passer des valeurs simples (la couche est comparée par contenu).

## L'année, le cartel, les liens

- `useYear()` : l'année réglée (glisser compris), `null` pour « tout le temps ». `useSetYear()(129)` l'écrit dans `?an=` en `replace`, sans défilement. Ne pas tenir d'autre état d'année.
- `<Lien to="/dragons">` remplace `VLink` : il garde `?an=`. Vers un événement ou une bataille datés : `year={event.year}`. `useLienHref()` pour un `href` calculé.
- `<NomEntite kind="person" id="rhaenyra" name={person.name} />` : tout nom de personne, dragon, lieu, guerre, bataille, événement. Lien vers la fiche, clic simple qui ouvre le cartel, couronne d'or pour un souverain. `onActive` pour poser l'entité sur la fasce au survol.
- `useVoir()` lit et écrit `?voir=` si une page doit ouvrir le cartel elle-même. `useSheets()` ouvre la recherche ou l'Index.

## Mouvement

- `useFeu().passer(href, { year })` : le feu part de cette année sur la fasce, puis navigue. Seulement en changeant de période ou en entrant dans un conflit depuis une autre vue.
- `<Ombre once="ombre:p5" look={dragon.look} />` : une fois par session, rien en mouvement réduit.
- GSAP uniquement depuis `@/core/motion`, par `useGSAP` avec `scope`. Aucune apparition au défilement.

## Composants communs (`components/`)

| Besoin | Composant |
|---|---|
| parti : récit à gauche, temps et espace collants à droite | `Parti({ entete, recit, temps })` + `TempsEspace({ span, placeIds, highlightIds, marks, mapTitle })` |
| figure alignée au pixel sur la fasce (fascé) | `useFasceGeometry()` (bord gauche, largeur) + `fasceScale(width)` + `yearEdges` de `model/geometry` |
| segment de la fasce agrandi | `Profil({ from, to, width, height, full, span, off })` ; largeur mesurée par `useElementWidth()` |
| le grand nombre `--t6` (un par vue) | `GrandNombre({ value, era, hollow })` |
| carte peinte | `Carte({ title, placeIds, highlightIds, selectedId, marks, frame })` |
| récit, chapeau | `Prose({ text, variant })` (typographie fine du cœur) ; chaîne seule : `useTypo()` |
| notes dépliées sous le paragraphe | `useNotes()`, `NoteRef`, `Note` |
| sources en pied de section | `SourcesPied({ sources })` |
| sommaire numéroté | `Sommaire({ entries, label })` |
| filtres dans l'adresse | `Filtres({ param, options, count, total, label })`, `useFiltre(param)` |
| fiabilité | `Fiabilite({ level, compact })` |
| état vide | `Vide({ children, action })` |

## Données calculées (`model/`, testées par Vitest)

`dragonPresence`, `datedYears`, `stepYear`, `reignsAt`, `periodsAt`, `parseYearQuery` (`model/presence.ts`), `relationsOf`, `placeYears`, `ageAt` (`model/relations.ts`) : ce sont les dépendances D1 à D5 et D11 de la spec, écrites ici faute de mieux, à remonter telles quelles dans `@/core`. Les lire, ne pas les recopier. Instances prêtes : `state/scene.ts` (présence, périodes, souverains, crans), `state/registry.ts` (registres indexés, à charger avec la vue qui en a besoin).

## Restent aux auteurs

Annotations de la masse du portail (`v2.portal.note.*`), listes des périodes et registres du portail au téléphone, `PlacesShell` (les deux routes des lieux peuvent devenir filles d'un même parent dans `index.tsx` ; `PageLayer` garde déjà la même couche pour `/lieux/*`), reprise de lecture (`writeResume` de `state/storage.ts`), lieux de l'année pour `TempsEspace`.
