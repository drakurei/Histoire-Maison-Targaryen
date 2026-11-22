# Version 1, « Le Codex » : écrire une page

Spécification : `documentation/design/v1-codex.md`. Interdits : `DESIGN.md` §0 (relire avant de livrer).

## Ce que le bâti fait déjà (ne pas le refaire)

`Layout.tsx` pose la table (`.v1`), la barre haute, les huit dos de volumes, l'étagère du téléphone, la recherche (touche `/`), le tour de page entre deux volumes (`PageTurn`) et le colophon. Une page ne rend que son `<main>`.

## Squelette d'une page

```tsx
import { MAIN_ID } from '@/app/a11y';
import { Folio } from '../components/Folio';
import { col } from '../components/grid';
import { Rubric } from '../components/Rubric';

export default function DragonsPage() {
  return (
    <main id={MAIN_ID}>
      <Folio>                                   {/* volume={n} leaf={n} : foliotation ; wide : rouleau */}
        <Rubric as="h1" k="nav.dragons" />      {/* un seul h1 par vue */}
        <p className={col.marge}>…</p>
      </Folio>
    </main>
  );
}
```

- Export **par défaut**, nom de fichier imposé (`pages/<Nom>.tsx`, déjà branché dans `index.tsx`).
- Identifiant inconnu (`useParams`) : `return <NotFound />` (`@/app/NotFound`).
- Le portail peut poser un premier écran sur la table (avant le `Folio`, dans le même `<main>`) : c'est la seule page sombre en tête.

## Grille du folio

10 colonnes au-dessus de 1024 px, une seule au-dessous. Tout enfant direct du `Folio` occupe le récit (colonnes 1 à 7). Classes de `../components/grid` : `col.recit`, `col.marge` (8 à 10), `col.large` (1 à 9), `col.pleine` (toute la largeur), `col.rangee` (sous-grille). Pour un récit avec notes de marge : `Passage`.

## Composants (`components/`, une ligne d'en-tête dans chaque fichier)

| Besoin | Composant |
|---|---|
| Titre rouge et sa glose | `Rubric` (`k`, `text` ou enfants ; `size` monumental, titre, section, sous) |
| Récit en paragraphes | `Prose` (`text: Localized`, `lettrine`, `variant="chapeau"`) ; `Lettrine` seule |
| Marge savante | `Passage notes={<MarginNote id n>…</MarginNote>}` + `<NoteRef target n />` dans le texte |
| Sources | `SourceList sources={item.sources}` (`variant` marge ou bloc) |
| Fiabilité | `ReliabilityMark level` (`compact` : glyphe seul) |
| Temps | `YearRule from to marks spans` (repères et durées déjà traduits) |
| Figure et légende | `Figure caption number?` (numéro seulement s'il y a plusieurs figures) |
| Lien d'entité | `EntityLink kind id name king? periodId? warId?` |
| Filtres | `FilterBar groups onToggle shown total onClear? text?` (logique de filtre : `@/core/timeline`) |
| Rien à montrer | `EmptyState titleKey bodyKey? action?` |

Boutons de page : Alegreya Sans 500, fond `--encre` sur vélin (ou `--sang` pour l'action principale), angles vifs, 44 px de haut, sans icône.

## Couleurs : jetons de surface, jamais de couleur de texte en dur

Lire `--v1-texte`, `--v1-texte-2`, `--v1-rubrique`, `--v1-or`, `--v1-trait`, `--v1-actif`. Ils valent encre et rubrique sur le vélin (`data-surface="velin"`, posé par `Folio`), ivoire et braise sur la table. Un composant se lit donc sur les deux surfaces. L'or (`--v1-or`) ne sert qu'à ce qui est couronné.

## Conventions

- CSS Module voisin (`Nom.module.css`), sélecteurs de classe simples ; `theme.css` est en couche `v1`, un module l'emporte toujours.
- Aucun `position: fixed` dans le `Folio` (sa découpe le rognerait) ; un volet ou un tiroir passe par `<dialog>`.
- Mouvement : GSAP depuis `@/core/motion`, `useGSAP` avec `scope`, `gsap.matchMedia(MOTION_CONDITIONS)` ; rien au défilement sauf ce que la spécification nomme.
- Chaînes : aucune en dur. Fichier `content/interface/ui.v1-<vue>.json`, clés `page.<vue>.<nom>`, français et anglais, sans tiret cadratin ni point d'exclamation, puis `node scripts/serial.mjs node scripts/build-content.mjs`. Clés déjà disponibles : `nav.*`, `action.*`, `label.*`, `page.bati.*` (voir `content/interface/ui.v1-bati.json`).
- Dates : `formatYear`, `formatSpan` avec `reading` de `useLang()`. Valyrien : toujours `lang={VALYRIAN_TAG}` (ou `Gloss`, `Rubric`, qui le font).
- Contrôle : `node scripts/serial.mjs node scripts/render.mjs http://127.0.0.1:5173/version-1/<chemin> tests/visual/out/v1/<nom>.png <l> <h> --wait=1800` à 390, 1024 et 1440 de large ; regarder chaque capture.
