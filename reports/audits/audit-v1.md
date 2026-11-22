# Audit de la version 1, « Le Codex »

Agent 14, auditeur indépendant (red team qualité), le 22 novembre 2026. Je n'ai pas lu les rapports des agents de construction : chaque constat ci-dessous vient d'une capture regardée, d'une mesure dans le navigateur ou d'une lecture du code.

## Méthode

- **Captures** : les 22 vues demandées à 6 largeurs (360x800, 390x844, 768x1024, 1280x800, 1440x900, 1920x1080), soit 132 captures, avec `tests/visual/shots.mjs` (seuil tenu pour vu, attente 1800 ms). Toutes regardées. Rangées dans `tests/visual/out/v1/audit14/avant/`. Après correction : 32 recaptures et 6 pages entières dans `tests/visual/out/v1/audit14/apres/`, regardées aussi.
- **Débordement et console** : le script de captures mesure `scrollWidth` et relève erreurs de console et exceptions. Résultat : 132 captures, aucun débordement horizontal, aucune erreur de console, aucune exception.
- **Liens** : `tests/functional/links.mjs http://127.0.0.1:5173/version-1`. 586 adresses visitées, aucun lien mort, aucune ancre absente.
- **Audit DOM** (script jetable, 390 et 1440 px, les 22 vues) : cibles interactives de moins de 44 px, texte à macrons hors balise `lang="art-x-valyrian"`, clés d'interface non résolues, un seul `h1`, contour de focus sur les 14 premiers arrêts de tabulation.
- **Contrastes** : calculés depuis les jetons OKLCH (conversion OKLab vers sRGB, formule WCAG 2.x), pour toutes les paires texte et fond réellement employées dans les feuilles de style.
- **Code** : recherche des interdits de DESIGN.md §0 dans `src/versions/v1-codex` et `src/shared` (espacement positif des lettres, capitales forcées, rayons d'angle, bordure latérale, ombres floues, verre dépoli, texte en dégradé, chasse fixe, noir et blanc purs, tirets cadratins, flèches, points médians, losanges) et des chaînes visibles écrites en dur dans les composants.
- **tsc** : `node scripts/serial.mjs npx tsc -b --noEmit`, sortie 0, lancé après chaque série de corrections (trois fois).

## Ce qui tient

Avant les défauts, ce qui m'a convaincu. La V1 n'a pas l'air faite par une IA. Les huit dos de cuir avec leurs titres verticaux, les signets en queue d'aronde, le vélin à bord irrégulier sur la pierre, les lettrines gothiques et la rubrication forment un objet cohérent, et chaque page montre une vraie matière : la courbe des dragons vivants, le ruban du temps, l'arbre du sang, la planche de Balerion avec ses couleurs « décrites » ou « non décrites par les livres », la carte gravée, la grille des 322 formes du lexique, la glose interlinéaire mot à mot de « Valar morghūlis ». Le code est propre au regard du §0 : aucun espacement positif, aucune capitale forcée, aucun rayon décoratif, aucune bordure latérale, aucun tiret cadratin, aucune flèche, aucune chaîne en dur. Les ombres sont dures et teintées (seule `DragonShadow` est floue, et c'est voulu : c'est une ombre portée de dragon). Les filets des tableaux (grammaire, sources, apprendre) sont des filets de tableau de livre, à l'encre et non à l'or : je les accepte.

## Constats

Gravité : **bloquant** (motif de refus selon DESIGN.md), **majeur** (défaut visible ou norme d'accessibilité ratée), **mineur**.

| # | Gravité | Page | Constat | Capture | État |
|---|---|---|---|---|---|
| 1 | bloquant | lignée | Les souverains sont cerclés d'un **double médaillon d'or** (ellipse à trait d'or de 1,6 px doublée d'un filet de 0,8 px), répété dans la légende. C'est le cadre doré à filet fin que le §0 interdit, et l'or y sert de bordure, ce que le §2 interdit aussi. | `avant/lignee-1440.png` | corrigé |
| 2 | majeur | fiche, lignée (volet) | Texte de règne en or sombre `oklch(0.52 0.10 75)` sur vélin, à 0,9 rem : **4,16:1**, sous le seuil AA de 4,5:1. | `avant/personnages-rhaenyra-1440.png` (« règne 129–130 apr. C. ») | corrigé |
| 3 | majeur | personnages | Ruban des règnes : chiffres gothiques de vélin sur les bandes d'or, **4,16:1** et **2,96:1** (bandes claires) à 16 px. | `avant/personnages-1440.png` | corrigé |
| 4 | majeur | toutes les pages de récit | **Typographie française** : les textes arrivent avec des espaces ordinaires devant « ; : ! ? » et dans les guillemets. Un « » » tombe seul en tête de ligne (« noirs / » » au volume V à 1280 px), un « ; » ouvre une ligne (fiche de Rhaenyra à 360 px). Apostrophes droites et courbes mêlées (« l'Orage » à côté de « l’an »). | `avant/chroniques-p5-1280.png`, `avant/personnages-rhaenyra-360.png` | corrigé (affichage V1) |
| 5 | majeur | portail | Sous 1024 px, le premier écran n'a **aucune marge** : titre, incipit et bouton sont à 4 px du bord de l'écran, alors que le folio en dessous est à 20 px. | `avant/racine-360.png`, `avant/racine-768.png` | corrigé |
| 6 | majeur | portail | À 360 et 390 px, la queue de l'emblème rouge passe **sous la glose** « Les Chroniques de la Maison Targaryen » (cendre sur sang, environ 1,6:1 localement). | `avant/racine-360.png` | corrigé |
| 7 | majeur | adresse inexistante | La V1 affiche l'écran générique de l'enveloppe : texte nu sur la pierre, sans folio, sans la formule « Kesir ilos daor. » prévue par la spécification (v1-codex.md §3), sans aucune matière ; à 390 px la glose du bouton passe sous l'étagère. La page la plus faible du site. | `avant/page-inexistante-1280.png`, `avant/page-inexistante-390.png` | corrigé |
| 8 | majeur | parcours | Sous 1024 px, le chiffre du parcours occupe une colonne et repousse le lien de retour, le titre et la mention dans une colonne étroite décalée de 50 px. | `avant/apprendre-danse-des-dragons-390.png` | corrigé |
| 9 | majeur | partout (téléphone) | **Cibles tactiles sous 44 px** dans les listes : sources (28 px), liens des étapes de parcours (32 px), références des expressions (29 px), sigles des ouvrages (29 px), titres des parcours (43 px), champ de recherche de la barre haute (40 px). | audit DOM à 390 px | corrigé |
| 10 | mineur | chroniques, lieu | Valyrien non balisé : noms de volumes dans le ruban du temps (SVG) et nom du lieu dans la légende de la carte (« recadrée sur Zaldrīzdōron »). | audit DOM | corrigé |
| 11 | mineur | figures | Cibles de 21 à 23 px dans les figures denses : étiquettes de l'échelle des dragons, du graphique des guerres, signes de la carte (22 px), formes de la grammaire, frise des parutions. | audit DOM | restant |
| 12 | mineur | langue, grammaire, expressions | Mots valyriens dans les notes de contenu (« kepa, « père » », « valar : tous les hommes ») sans balise de langue. | audit DOM | restant (contenu) |
| 13 | majeur | fiche de Rhaenyra | La note de marge contient « traduction de l'agent » : une mention du procédé de fabrication, interdite par DESIGN.md §8. Vient de `content/timeline/sovereigns.json`, hors de mon périmètre. | `avant/personnages-rhaenyra-1440.png` | restant (contenu) |
| 14 | mineur | étagère du téléphone | « Volumes » et « Registres » n'ont pas de forme valyrienne alors que « Korjās » et « Ēngos » en ont : la rangée n'est pas homogène en mode valyrien. | `avant/racine-390.png` | restant (linguiste) |
| 15 | mineur | lignée | La colonne des générations chevauche les premiers noms à gauche (« v. 36 apr. C. » touche « Farman »). | `avant/lignee-1440.png` | restant |
| 16 | mineur | personnages | Dans le ruban des règnes, les traits de rappel traversent certaines étiquettes (« Aerys Ier »). | `avant/personnages-1440.png` | restant |
| 17 | mineur | langue (sous-pages) | Les titres de Lexique, Grammaire et Expressions sont en français seul et d'un corps plus petit que les autres registres. La hiérarchie (salle et sous-salle) se défend ; l'absence de valyrien attend le linguiste. | `avant/langue-grammaire-1280.png` | restant |
| 18 | mineur | volume | Le chiffre du volume est rendu à environ `--t4`, et non au `--t6` géant de la spécification. | `avant/chroniques-p5-1280.png` | restant |

Contrastes vérifiés et conformes : encre sur vélin 12,3:1 ; encre pâle sur vélin 6,3:1 ; rubrique sur vélin 6,3:1 ; ivoire sur obsidienne 16,2:1 ; cendre sur obsidienne 5,5:1 ; braise sur obsidienne 6,4:1 ; ivoire sur sang 5,4:1 ; or sur obsidienne 9,2:1 ; marques de fiabilité en bronze sur vélin 3,5:1 (objet graphique, seuil de 3:1). Focus : les signalements de l'audit DOM sur la table des volumes, le ruban des règnes, l'arbre et la carte étaient des faux positifs. Le contour y est porté par un pseudo-élément, un anneau SVG ou un changement de bande, et je l'ai vérifié dans les feuilles de style. Les appels de note de `/langue` (8x13 px) ont une zone de pression de 44 px en `::before` : conformes.

## Corrections faites

Toutes dans `src/versions/v1-codex/**`. Aucune chaîne d'interface ajoutée : les clés employées existaient déjà (`phrase.not_found`, `error.notFound.body`, `nav.portal`, `nav.chronicles`).

1. **Lignée, souverains** (`pages/lineage/TreeDrawing.tsx`, `TreeDrawing.module.css`, `TreeKey.module.css`) : double médaillon d'or supprimé. Un souverain porte maintenant un aplat d'ombre de vélin sans trait, la couronne et un nom plus appuyé ; la légende suit. Vérifié dans `apres/lignee-1440.png`.
2. **Or de texte** (`theme.css`) : nouveau jeton `--v1-or-encre: oklch(0.47 0.09 72)`, à 5,15:1 sur vélin, employé pour la ligne de règne de la fiche (`PersonPage.module.css`) et du volet de la lignée (`KinPanel.module.css`). L'or sombre de la spécification reste pour la lettrine et les grandes initiales (texte large, seuil de 3:1).
3. **Ruban des règnes** (`pages/people/ReignRibbon.module.css`) : bandes à `oklch(0.49 0.10 75)` et `oklch(0.43 0.085 70)`, chiffres de vélin à 4,7:1 et 6,1:1. Vérifié dans `apres/personnages-1440.png`.
4. **Typographie fine** (`components/typo.ts`, nouveau) : `fineTypo()` met une apostrophe typographique entre deux lettres et, en français, une espace insécable dans les guillemets et une espace fine insécable devant « ; : ! ? ». Le crochet `useTxTypo()` remplace `useTx()` dans les 21 composants qui n'affichent le texte que pour la lecture (Prose, annales, fiches, planches, guerres, sources, parcours, questionnaire, etc.). Je l'ai écarté de `PlacesPage` et `PlacePage`, qui se servent du texte comme clé de tri et de regroupement. Vérifié : « « noirs » » ne se coupe plus (`apres/p5-1280.png`), « Ier ; » reste lié (`apres/personnages-rhaenyra-360.png`), apostrophes courbes partout dans ces vues.
5. **Portail sur téléphone** (`pages/PortalPage.module.css`) : retrait de 1,25 rem, aligné sur le texte du folio ; sous 640 px, emblème réduit à `min(64vw, 40svh)` et décalé, sa queue sort du cadre. Vérifié dans `apres/racine-360.png`, `apres/racine-390.png` et `apres/racine-768.png`.
6. **Page introuvable du Codex** (`components/NotFound.tsx` et `NotFound.module.css`, nouveaux ; branchés dans `index.tsx` et les sept pages à identifiant) : feuille de vélin, « Kesir ilos daor. » rubriqué avec sa glose, la phrase d'explication, le retour au portail en aplat de sang (avec la glose ivoire), puis la table des huit volumes dans la même rangée que sur les chroniques. `data-ecran="introuvable"` est conservé pour l'audit des liens. Vérifié dans `apres/404-full-1440.png` et `apres/page-inexistante-390.png`. Un premier essai décalait les chiffres des volumes sur les années : je l'ai vu sur la capture et corrigé avant de recapturer.
7. **En-tête du parcours** (`pages/PathPage.module.css`) : sous 1024 px, le retour passe en tête sur toute la largeur et le chiffre se range contre le titre seul. Vérifié dans `apres/apprendre-danse-des-dragons-390.png`.
8. **Cibles tactiles** : 44 px pour les liens de sources (`components/SourceList.module.css`), des étapes de parcours (`PathPage.module.css`), des références d'expressions (`language/PhraseEntry.module.css`), des titres de parcours (`LearnPage.module.css`), des sigles d'ouvrages (`SourcesPage.module.css`) et pour le champ de recherche (`components/TopBar.module.css`).
9. **Balisage du valyrien** : `lang` sur les noms de volumes du ruban (`chronicles/TimeRibbon.tsx`) et sur le nom du lieu dans la légende de la carte (`PlacePage.tsx`, composant `MapCaption`).

Après les corrections : tsc sort à 0, et les 32 recaptures ne montrent ni débordement ni erreur de console.

## Défauts restants

- **Contenu, hors de mon périmètre** : « traduction de l'agent » dans la note de Rhaenyra (`content/timeline/sovereigns.json`, constat 13, à retirer) ; mots valyriens non balisés dans les notes de langue (constat 12, il faudrait un balisage dans `content/valyrian/*.json`) ; « Ier », « 3e » au lieu des exposants « Iᵉʳ », « 3ᵉ ».
- **Typographie dans le cœur** : la correction du point 4 vit dans la V1. Elle devrait aller dans `resolveText` (`src/core/i18n`) ou dans `scripts/build-content.mjs`, pour que les versions 2 et 3 en profitent. À décider par l'orchestrateur.
- **Cibles des figures** (constat 11) : sous 44 px, mais chaque figure a son équivalent en liste juste à côté (registre des dragons, liste des guerres, liste des lieux, lexique). Je les laisse : les grossir casserait la gravure.
- Constats 14 à 18 : mineurs, détaillés dans le tableau.
- **Non vérifié** : la marge basse sous l'étagère du téléphone sur toutes les pages longues (la capture pleine page fige l'étagère au milieu, elle ne prouve rien), l'animation d'ouverture et le tour de page (captures fixes seulement), le mode `prefers-reduced-motion`, l'anglais (toutes les captures en `fr-FR` avec valyrien par défaut).

## Verdict

**Accepté avec réserves.**

La V1 passe le test du §0 : on se demande comment c'est fait, pas quel outil l'a produit. Le seul motif de refus formel, le médaillon d'or de l'arbre, est corrigé. Les défauts d'accessibilité mesurables qui restaient (contrastes de l'or, cibles des listes, marge du portail) sont corrigés et vérifiés sur capture. Il reste deux réserves avant de prendre la V1 pour référence de la phase F :

1. retirer « traduction de l'agent » du contenu ;
2. remonter la typographie française dans le cœur, pour qu'elle ne dépende pas d'une version.

Les autres restes sont mineurs ou attendent le linguiste.
