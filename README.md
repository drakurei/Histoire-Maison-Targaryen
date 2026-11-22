# Histoire-Maison-Targaryen

**Targārio Lentro Vestriarja** : musée numérique consacré à l'histoire, à la langue et à l'héritage de la Maison Targaryen, en haut valyrien, français et anglais. Œuvre de passionné, non officielle : l'univers est celui de George R. R. Martin, le haut valyrien est la langue construite par David J. Peterson.

## Lancer le site

Il faut Node.js 20 ou plus récent.

```
npm install
npm run dev        # http://127.0.0.1:4173
npm run build      # construit dist/ (données, vérification TypeScript, Vite)
npm test           # tests unitaires (Vitest)
```

Sous Windows, `Ouvrir-le-site.cmd` construit puis ouvre le site. `Ouvrir-Command-Center.cmd` ouvre le tableau de supervision des agents sur http://127.0.0.1:4714 (local uniquement).

## Ce qu'il y a dedans

| Dossier | Contenu |
|---|---|
| `src/core/` | Données typées, langues, logique pure (arbre généalogique, échelle du temps, recherche, questionnaires, géométrie des dragons). Aucune présentation. |
| `src/shared/` | Ce que les trois versions partagent : emblème, écran d'ouverture, dragons dessinés par le code, shaders, carte, marques. |
| `src/versions/` | Les trois versions du site (`v1-codex`, puis v2 et v3), chacune avec sa mise en page et ses pages. |
| `content/` | Source de vérité des contenus : chronologie, généalogie, dragons, guerres, lieux, lexique et grammaire du haut valyrien, sources, parcours, chaînes d'interface. Compilée vers `src/content/generated/` par `scripts/build-content.mjs`. |
| `command-center/` | Supervision des 14 agents : registre, état, journal, interface locale. |
| `documentation/` | Architecture, direction artistique, notes d'historien et de linguiste. |
| `reports/` | Rapports des agents, audits, contrôles qualité. |
| `tests/` | Tests fonctionnels et visuels (Playwright sur Chrome). |

Références de conception : `PRODUCT.md` (le projet, sa voix, ses principes), `DESIGN.md` (couleurs, typographie, mouvement, interdits), `documentation/architecture/ARCHITECTURE.md` (contrat technique), `PROJECT_GUIDE.md` (organisation et reprise).

## Sources et droits

Les textes du musée sont des résumés originaux, sourcés ouvrage par ouvrage ; les livres et l'adaptation télévisée sont tenus séparés. Polices sous licence SIL OFL (`assets/fonts/licenses`, paquets `@fontsource`). Toutes les figures (emblème, dragons, carte) sont dessinées par le code du projet.
