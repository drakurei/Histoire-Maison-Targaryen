# Version 3, « le Codex armorié »

Spécification : `documentation/design/v3-spec.md` (DESIGN.md §7). Classe racine `.v3`, couche CSS `v3` (`theme.css`).

## Bâti

- `index.tsx` : plan complet des routes ; `lieux` est le parent de `lieux/:placeId` (la notice d'un lieu se rend dans l'`Outlet` de `PlacesPage`).
- `Layout.tsx` : ligne des registres (V2), couche de la vue (V2 `PageLayer`), `Colophon3`, `Fasce3`, cartel (V2 `CartelHost`), `Index3`, recherche (V2 `SearchSheet`), feu et « dracarys » (V2), `useSeuilReady()`. Le contexte `SheetsContext` est celui de la V2 : `useSheets()` y fonctionne.
- `components/frame/` : `Fasce3` (datée, éteinte, portail), `FasceCartel3`, `Index3`, `Colophon3`.
- `components/common/` : `useVue` (à appeler dans chaque vue), `useMajeste` (portail), `Vue` (le `main`), `TitreChamp`, `Feuillet`, `Parti3`, `Colonne`, `Nom`, `Dos`, `useMedia`.

## Règles

- Une vue appelle `useVue({ etat, span, reign, marks })` : `etat` vaut `datee` (défaut), `eteinte` (langue, sources, à propos, introuvable) ou `portail`.
- Le portail pose sa masse en majesté dans sa page et appelle `useMajeste(ref)` : la fasce ne montre que sa rangée tant qu'elle est visible.
- Importations de la V1 et de la V2 : modules feuilles seulement, jamais un `index.tsx`, un `Layout` ou un `theme.css` ; aucun fichier de la V1 ou de la V2 n'est modifié.
- Chaînes : `content/interface/ui.v3-*.json`, puis `node scripts/serial.mjs node scripts/build-content.mjs`.
