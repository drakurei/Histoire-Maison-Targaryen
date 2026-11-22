# Architecture

Contrat technique du projet. Fait autorité avec `PRODUCT.md`, `DESIGN.md` et `src/core/content/types.ts`.

## Pile

Vite 8, React 19, TypeScript 6 strict, React Router 7 (mode déclaratif, `BrowserRouter`), GSAP 3 avec `@gsap/react`, WebGL brut (pas de three.js), CSS Modules et propriétés personnalisées (pas de Tailwind, pas de bibliothèque de composants). Polices `@fontsource`. Tests : Vitest (logique pure), scripts Playwright sur le Chrome installé (`playwright-core`, `channel: 'chrome'`). Aucun backend, aucun service externe à l'exécution.

## Arborescence

```
content/                      source de vérité, JSON rédigé par les agents de contenu
  timeline/  genealogy/  dragons/  glossary/  sources/     (existant, champs suffixés Fr/En)
  translations/*.en.json      traductions anglaises des champs qui n'existaient qu'en français
  timeline/essays/p1…p8.json  récits longs des périodes
  characters/biographies/*.json
  battles/wars-*.json
  locations/map.json  locations/places.json
  dragons/looks.json
  valyrian/lexicon-extended.json  grammar.json  phrases.json
  learning/paths.json
  interface/ui.json           chaînes d'interface hv/fr/en
scripts/build-content.mjs     valide, résout les références, normalise vers src/content/generated/
scripts/render.mjs            rend un fichier HTML/SVG ou une URL en PNG (contrôle visuel)
src/
  main.tsx  app/              amorçage, routeur, garde d'erreur
  core/                       AUCUNE présentation, aucun import de CSS ni de version
    content/   types.ts (contrat), index.ts et un module d'accès par jeu de données
    i18n/      langue d'affichage, langue d'appui, gloses, formats de dates
    genealogy/ graphe, parenté, mise en page de l'arbre (fonctions pures)
    timeline/  échelles, séries (dragons vivants par année), rubans de règnes
    search/    index et requête
    quiz/      moteur de questionnaire
    dragons/   géométrie procédurale du dragon (fonctions pures -> tracés)
    motion/    réglages GSAP, mouvement réduit
  shared/                     présentation commune aux trois versions, pilotée par jetons CSS
    emblem/  seuil/  dragon/  gl/  map/  marks/
  content/generated/          sortie du script (versionnée, ne pas éditer à la main)
  versions/
    v1-codex/   theme.css  Layout.tsx  pages/  components/
    v2-…/       v3-…/
  compare/                    espace de comparaison des trois versions
tests/  functional/  visual/  responsive/  linguistic/  performance/
```

Frontières : `core` n'importe ni `shared` ni `versions`. `shared` n'importe pas `versions`. Une version n'importe jamais une autre version. Alias d'import : `@/` = `src/`.

## Routes

Chaque version monte le même plan sous son préfixe (`/version-1`, `/version-2`, `/version-3`). `/` redirige vers `/version-3` (vers `/version-1` tant que la 3 n'existe pas). `/comparer` : espace de comparaison.

| Chemin (sans préfixe) | Vue |
|---|---|
| `/` | portail |
| `/chroniques` | les huit périodes, ruban du temps |
| `/chroniques/:periodId` | une période : récit, événements, filtres |
| `/chroniques/:periodId/:eventId` | un événement |
| `/lignee` | arbre du sang (`?p=<personId>` pour centrer) |
| `/personnages` , `/personnages/:personId` | encyclopédie, fiche |
| `/dragons` , `/dragons/:dragonId` | registre, planche |
| `/guerres` , `/guerres/:warId` | conflits, batailles (`#<battleId>`) |
| `/lieux` , `/lieux/:placeId` | carte, lieu |
| `/langue` , `/langue/lexique` , `/langue/grammaire` , `/langue/expressions` | bibliothèque linguistique |
| `/sources` | registre des sources et niveaux de fiabilité |
| `/apprendre` , `/apprendre/:pathId` | parcours, questionnaire |
| `/a-propos` | fabrication, colophon, signature |
| `*` | page introuvable |

Les liens internes s'écrivent sans préfixe et passent par `useVersionPath()` ou `<VLink to="/dragons/balerion">` (`src/app/version.tsx`).

## Langues (`src/core/i18n`)

- `Lang = 'hv' | 'fr' | 'en'`, défaut `hv`. `SupportLang = 'fr' | 'en'` : langue du récit et des gloses en mode `hv` (défaut : `fr` si le navigateur est francophone, sinon `en`).
- Persistance `localStorage` (`tlv.lang`, `tlv.support`), paramètre `?lang=` prioritaire, attribut `lang` de `<html>` tenu à jour, changement sans rechargement.
- API :
  - `useLang()` -> `{ lang, support, reading, setLang, setSupport }` où `reading` = `support` si `lang === 'hv'`, sinon `lang`.
  - `useUi()` -> `ui(key, vars?)` : objet `{ primary, gloss?, status?, note?, isHv }`. En `hv` : `primary` = forme valyrienne si elle existe, `gloss` = langue d'appui ; sinon `primary` = langue d'appui.
  - `useT()` -> `t(key, vars?)` : la chaîne principale seule (pour `aria-label`, `title`, attributs).
  - `useTx()` -> `tx(loc)` : texte de récit, toujours dans `reading`.
  - `useTitle()` -> `title(loc)` : `{ primary, gloss?, isHv }` pour un `Localized` qui peut porter `hv`.
  - `<Gloss k="nav.dragons" />` ou `<Gloss text={loc} />` : structure sans style `span.gloss > span.gloss__hv[lang="art-x-valyrian"] + span.gloss__tr`, classes surchargeables par version.
  - `formatYear(y, lang)`, `formatSpan(a, b, lang)` : « 114 av. C. », « 42 apr. C. », "114 BC", "42 AC" ; `null` -> « date inconnue ».
- Aucune chaîne visible en dur dans un composant : toute chaîne d'interface a une clé dans `content/interface/ui.json` (`{ key, fr, en, hv?, status?, note? }`). Clés en `domaine.nom` (`nav.*`, `action.*`, `label.*`, `phrase.*`, `page.<vue>.*`, `error.*`, `a11y.*`).
- Texte valyrien : toujours balisé `lang="art-x-valyrian"`.

## Contenus

- Les jeux **existants** gardent leur forme (suffixes `Fr`/`En`, noms français comme références). `build-content.mjs` les convertit vers les types de `types.ts`, fusionne `content/translations/*.en.json`, et résout les noms en identifiants (`EntityRef`).
- Les jeux **nouveaux** sont écrits directement à la forme de `types.ts`, dans une enveloppe `{ "schema": 1, "generatedBy": "agent-NN", "items": [ … ] }`.
- Tout texte est original. Aucune phrase recopiée des ouvrages. Aucune date, filiation ou bataille inventée : ce qui est incertain est dit incertain (`reliability`, `dateCertainty`, `disputed`). Livres et adaptation télévisée sont tenus séparés (`continuity`, `adaptation`).
- Chaque élément porte ses `sources` (identifiants de `content/sources/sources.json`).
- Écriture : sobre, précise, sans emphase ; pas de point d'exclamation ; **aucun tiret cadratin** (ni « — » ni « -- ») ; guillemets français « » en français, anglais “ ” en anglais ; noms français des traductions publiées (Peyredragon, Port-Réal, Feunoyr, Accalmie…).

## Qualité de code

- TypeScript strict, pas de `any`, pas de `// @ts-ignore`. Fonctions courtes. Aucune logique métier dans un composant : elle vit dans `core` et se teste avec Vitest.
- Composants : fonctions, props typées, un fichier par composant, CSS Module voisin (`Nom.module.css`). Tout sélecteur d'une version est sous sa classe racine (`.v1`, `.v2`, `.v3`).
- Accessibilité : HTML sémantique, un seul `h1` par vue, ordre de tabulation logique, `:focus-visible` net, cibles ≥ 44 px, `aria-live` pour les résultats de recherche et de filtre, `prefers-reduced-motion` respecté partout.
- Performance : chaque version est un bloc chargé à la demande ; chaque jeu de données lourd aussi ; WebGL démarré seulement si visible, mis en pause hors écran, plafonné à `devicePixelRatio` 1.5 ; pas de dépendance ajoutée sans accord de l'orchestrateur.
- GSAP : toujours via `useGSAP` avec `scope`, nettoyage automatique ; `gsap.matchMedia()` pour le mouvement réduit.

## Règles de travail pour les agents

1. **Périmètre de fichiers** : n'écrire que dans le périmètre donné par le brief. Un besoin hors périmètre se signale dans le rapport final, il ne se règle pas en éditant le fichier d'un autre.
2. **Machine fragile** (moins de 1 Go de mémoire libre) : ne lancer ni `npm install`, ni `vite`, ni `vite build`, ni `tsc`, ni `vitest`, ni serveur, sauf si le brief l'autorise explicitement. L'orchestrateur lance ces commandes lui-même, une à la fois. Le contrôle visuel autorisé passe par `node scripts/render.mjs`, qui ouvre et referme Chrome aussitôt.
3. **Garde-fou ECC (GateGuard)** : la première écriture dans un nouveau dossier est refusée par un hook qui demande d'énoncer quelques faits (qui appelle le fichier, absence de doublon, consigne de l'utilisateur). C'est voulu : répondre honnêtement aux questions posées (en une ou deux lignes), puis relancer l'appel. Consigne de l'utilisateur à citer : « rendre mon site vraiment parfait ».
4. Pas de dossier `.claude` dans le projet, aucune configuration globale touchée, aucun dépôt distant, rien hors de `TARGARYEN-CHRONICLES/`.
5. **Rapport final** : fichiers créés ou modifiés, ce qui a été vérifié et comment, ce qui reste douteux. Jamais « terminé » sans vérification.
