# Audit de la version 3, « le Codex armorié »

Agent 14, auditeur indépendant (regard téléphone, accessibilité, performance de l'agent 12), le 22 novembre 2026. Jugé sur captures, mesures du DOM et code, sans lire les rapports des bâtisseurs.

## Méthode

- Outil : `tests/visual/audit-v3.mjs` (une seule page Chrome, lancé par `scripts/serial.mjs`). Il découvre un identifiant réel pour chaque vue de détail depuis sa vue liste (p1, p1-dragons-quatorze-flammes, aenar, balerion, conquete, port-real, origines), puis capture les 22 routes de ARCHITECTURE.md sous `/version-3` (dont une adresse introuvable) à 360x800, 390x844, 768x1024, 1280x800, 1440x900, 1920x1080, en anglais (`?lang=en`) à 390 et 1440, et en mouvement réduit pour le portail, la période et la lignée. 1024x800 en plus, pour l'en-tête. Le stockage local est vidé entre deux captures (la langue choisie persiste par conception et faussait un premier passage).
- Mesures à chaque capture : débordement horizontal, erreurs et exceptions de console, clés d'interface non résolues (`[a.b]` dans le texte), nombre de `h1` et de `main`, cibles tactiles sous 44 px (largeurs < 768), contraste rendu des textes (couleur calculée composée sur le fond réel, AA 4,5 et 3).
- Contraste des jetons calculé à part (OKLCH vers sRGB) : le folio de vélin porte une image de fond et échappe à la mesure rendue.
- Liens : parcours de tous les liens internes depuis `/version-3`, dédoublonnés par chemin (la requête `?an=` multiplie les adresses).
- Seuil et racine : `tests/visual/seuil-v3.mjs` (« / » puis « /?seuil », captures à 0,6, 2, 4 et 8 s).
- Code : recherche des interdits du §0 de DESIGN.md dans `src/versions/v3`, des chaînes visibles écrites en dur, des `<a href>` internes sans `withBase()`.
- Captures : `tests/visual/out/v3/audit/`, planche de contrôle `tests/visual/out/v3/sheet1440.png`.

## Ce qui tient

- Aucun débordement horizontal, aucune erreur de console, aucune clé non résolue, exactement un `h1` et un `main`, sur les 22 routes, aux 7 largeurs, en français comme en anglais et en mouvement réduit.
- « / » redirige vers `/version-3` ; « /?seuil » joue l'emblème et « Passer l'ouverture », puis rend la V3 (h1 présent, plus d'`aria-busy` à 8 s).
- Interdits du §0 : aucun tiret cadratin, point médian, flèche ou emoji dans le code ni dans les chaînes `ui.v3-*` ; aucun `letter-spacing` positif, aucune capitale transformée, aucun rayon décoratif (seule la pastille ronde de braise), aucun dégradé décoratif (les deux nerfs du dos sont des bandes nettes), aucun verre ni ombre douce, aucune police à chasse fixe, aucune bordure latérale. Les fondus restants sont des fondus d'opacité sans glissement (fasce, Index, pal), réduits en mouvement réduit.
- Pas de chaîne visible écrite en dur : tout passe par `useT`/`Gloss`/`useTx` ; le seul littéral est le spécimen valyrien « Valar » de la salle de la langue.
- Les liens internes bruts passent par `withBase()` ; les autres sont des ancres `#`.
- Liens : 87 chemins uniques visités à deux sauts du portail (registres puis fiches), aucun introuvable, aucune exception, aucun lien hors du préfixe `/version-`. Un parcours complet sans limite de profondeur s'est arrêté sans résultat au bout de 40 minutes sur cette machine : à relancer sur une machine moins chargée (`--links` sans `--depth`).
- `npx tsc -b --noEmit` : code de sortie 0.
- Contraste : textes rendus sur le champ à 5,44:1 au pire (cendre sur obsidienne) ; jetons sur vélin conformes (encre pâle 6,33, rubrique 6,30, sang 4,92). L'or ne se pose pas sur le vélin : la couronne y prend `--v3-or-encre`.
- Cibles tactiles : la plupart des signalements sont couverts par une zone élargie en pseudo-élément (noms d'entité `Nom` à 44 px de haut, appels de note `NoteRef` de 44x44).
- Composition : la V3 se lit comme un objet unique. Le champ d'obsidienne, la fasce de gueules réglée par l'année, la masse des dragons en majesté au portail et le folio de vélin rubriqué pour chaque texte long forment un système reconnaissable d'une vue à l'autre ; rien n'y ressemble à un gabarit (pas de cartes, pas de pile centrée, titres en bas de casse serrés, glose interlinéaire). C'est bien le livre posé sur le blason annoncé par la spécification.

## Constats

| N° | Gravité | Constat | Lieu | État |
|---|---|---|---|---|
| 1 | Bloquant | À 1280 px, l'en-tête forcé sur une rangée faisait chevaucher le nom du site et « Vestriarja », et la langue « HV » et « Gūrēñagon » ; à 1440, 6 px seulement entre le nom et le premier registre, et en anglais « The Bloodline », « The Valyrian Tongue » cassés sur deux lignes avec de grands blancs. | `src/versions/v3/Layout.module.css` | Corrigé : une rangée à partir de 1600 px ; de 1024 à 1599, registres sous le nom sur une rangée sans retour. Recapturé à 1024, 1280, 1440 : plus de chevauchement. |
| 2 | Mineur | La masse de la fasce, réglage de l'année au doigt, ne fait que 16 px de haut au téléphone. AA tenu par l'équivalent (crans précédent et suivant de 44 px), mais le geste annoncé « Pressez la bande » est difficile. | `Fasce3`, `--v3-fasce-masse` | Reste |
| 3 | Mineur | Rangées de l'index des personnages de 20 px au téléphone : les zones de 44 px des noms se recouvrent, le doigt peut ouvrir le voisin. | `PeoplePage`, `Nom` | Reste |
| 4 | Mineur | Lien « Tembyri, Sources » du colophon à 41 px de large, « ao » du lexique à 23 px (AA 24 px tenu de justesse). | `Colophon3`, `Lexique` | Reste |
| 5 | Mineur | La salle du lexique garde à droite une grille de 322 carrés ivoire identiques, défaut que la spécification reprochait à la V1 : seul élément qui se lit comme un motif générique. | `LexiconPage` | Reste |
| 6 | Mineur | Personnages : « 132 vies » dans la phrase et « 176 personnes » en grand nombre, sans dire ce qui sépare les deux. | `PeoplePage`, chaînes | Reste |
| 7 | Mineur | Au téléphone, sur `/chroniques`, les profils de périodes courtes deviennent des bandes rouges pleine largeur qui se lisent comme des filets. | `ChroniclesPage` | Reste |
| 8 | Info | La mesure de contraste rendu ne couvre pas le folio (image de fond) : jugé par les jetons. | méthode | Noté |

## Restes

Constats 2 à 7, tous mineurs ; aucun ne bloque la mise en ligne. Reste aussi le parcours des liens sans limite de profondeur (seuls deux sauts ont été vérifiés).

## Verdict

La V3 est cohérente et paraît faite par quelqu'un : elle prend à la V2 le lieu et l'instrument (champ, fasce, masse, cartel) et à la V1 la page de lecture (vélin, rubrique, lettrine, marge), sans ressembler à un gabarit. Les mesures sont propres sur toutes les routes et toutes les largeurs. Le seul défaut grave, l'en-tête qui se chevauchait entre 1280 et 1599 px, est corrigé et vérifié. Recevable, avec six restes mineurs.
