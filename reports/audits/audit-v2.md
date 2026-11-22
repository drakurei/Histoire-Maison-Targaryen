# Audit de la version 2, « Sable et gueules »

Agent 14, auditeur indépendant, avec l'agent 12 (téléphone, accessibilité, performance), le 22 novembre 2026. Je n'ai pas lu les rapports des agents de construction. Chaque constat vient d'une capture que j'ai regardée, d'une mesure dans le navigateur ou d'une lecture du code de `src/versions/v2/`.

## Méthode

- **Captures** : les 22 vues demandées (portail, chroniques, `/chroniques/p5`, l'événement `p5-rhaenyra-heritiere`, lignée, personnages, `/personnages/rhaenyra`, dragons, `/dragons/balerion`, guerres, `/guerres/danse-des-dragons`, lieux, `/lieux/peyredragon`, langue et ses trois salles, sources, apprendre, le parcours `danse-des-dragons`, à propos, une adresse inexistante), chacune à 360x800, 390x844, 768x1024, 1280x800, 1440x900 et 1920x1080. Cela fait 132 captures, prises avec `tests/visual/shots.mjs` (seuil tenu pour vu, attente de 1500 ms) et toutes regardées. Elles sont rangées dans `tests/visual/out/v2/avant/`. Après correction : `apres/` (48 captures), `apres-portail/` (5 captures, avec une attente de 5,5 s pour laisser finir l'ouverture du portail), `apres2/` (18 captures), `en/` (12 captures en `?lang=en`), `en2/` (4) et `reduit/` (3, en `prefers-reduced-motion: reduce`). Les 90 recaptures ont toutes été regardées : aucun débordement, aucune erreur de console.
- **Débordement et console** : le script de captures mesure `scrollWidth` et relève les erreurs de console et les exceptions.
- **Audit DOM** (script jetable, à 1440x900 et 390x844 sur les 22 vues, puis à 1440x900 en `?lang=en`) : cibles interactives de moins de 44 px, clés d'interface non résolues ou entre crochets, nombre de `h1` et de `main`, contraste calculé sur les couleurs réellement rendues (opacités cumulées comprises), texte coupé, erreurs et avertissements de console.
- **Contrastes des jetons** : conversion OKLCH, puis OKLab, puis sRGB, et formule WCAG 2.x (tableau plus bas).
- **Liens** : `tests/functional/links.mjs http://127.0.0.1:5173/version-2` a été lancé, mais il est inutilisable sur la V2. Il garde la requête dans la clé de visite. Or l'année suit le lecteur (`?an=`), et chaque lien d'une page réglée sur 129 porte `?an=129` : le site se multiplie par chaque année visitée. Au bout de 375 adresses, la file d'attente comptait 1449 adresses et grossissait encore. Je l'ai arrêté, j'ai libéré le verrou qu'il tenait, puis j'ai fait le même audit par chemin, avec un script jetable : chaque chemin une fois, sans requête, la page introuvable, les erreurs et les ancres relevées. Résultat : **410 chemins visités, 4170 liens d'ancre vérifiés, aucun lien vers la page introuvable, aucune page d'erreur, aucune ancre absente, aucune erreur de console**. Le script signale 28 planches de dragon : c'est un faux positif de mon propre script, qui relève tout `data-ecran`. Or `PlancheDragon.tsx` emploie `data-ecran="ordinateur"` pour sa note d'échelle. `links.mjs`, lui, ne lit que `introuvable`, `erreur` et `construction`.
- **Code** : recherche des interdits de DESIGN.md §0 dans `src/versions/v2` (espacement positif, capitales forcées, rayons, bordure latérale, ombres floues, verre dépoli, dégradés, chasse fixe, noir et blanc purs, tirets cadratins, flèches, points médians, losanges), des chaînes visibles écrites en dur dans les TSX et des clés employées absentes de `ui.json`.
- **tsc** : `node scripts/serial.mjs npx tsc -b --noEmit`, sortie 0 après chaque série de corrections.

## Ce qui tient

La V2 est une vraie alternative à la V1, et non une variante de couleur. Il n'y a ni vélin, ni lettrine, ni dos de volumes, ni signets, ni page qui tourne. Tout s'organise autour d'un seul objet, la fasce : une bande de sang dont l'épaisseur est le nombre de dragons vivants, année par année. Elle est hachurée pour Valyria, qui n'a jamais compté ses dragons, et pour les dragons dont on perd la trace ; elle s'éteint en cramoisi sur les vues hors du temps. Le portail en majesté est la meilleure image du projet. On y lit d'un regard la Conquête, la Danse et son pic, le vide d'un siècle et demi, puis les trois éclosions, et cette image ne ressemble à aucun gabarit. Le même rouge revient comme donnée partout : profil soudé à la fasce, grand chiffre évidé dans le profil, pal de la lignée, ligne de vie des personnages, échelle des dragons. Le code est propre au regard du §0 : aucun espacement positif, aucune capitale forcée (seules les ères sont en vraies petites capitales, sans espacement), aucun rayon décoratif, aucune bordure latérale, aucune ombre floue, aucun tiret cadratin, aucune flèche, aucune chaîne en dur. Les 269 clés des cinq fichiers `ui.v2-*.json` existent toutes en français et en anglais, sans tiret cadratin ni point d'exclamation. Aucune erreur de console ni exception sur les 22 vues, en français à 390 et à 1440 px comme en anglais. Il y a un seul `h1` et un seul `main` par vue.

## Constats

Gravité : **bloquant** (motif de refus selon DESIGN.md), **majeur** (défaut visible ou norme d'accessibilité ratée), **mineur**.

| # | Gravité | Page | Constat | Capture | État |
|---|---|---|---|---|---|
| 1 | majeur | période, événement (ordinateur) | Le **profil rouge monte sur la carte** dès l'arrivée. La colonne collante calcule le profil sur toute la fenêtre, alors qu'elle commence sous l'en-tête (environ 240 px). À 1280x800, le profil couvre presque toute la carte : noms coupés (« Fo… », « …Vilinion »), Harrenhal et la baie de la Néra masqués. | `avant/chroniques-p5-1280.png`, `avant/chroniques-p5-p5-rhaenyra-heritiere-1440.png` | corrigé |
| 2 | majeur | portail (1920x1080) | Le titre est plus court que la fenêtre, si bien que le **colophon remonte sous la masse en majesté** et s'y montre coupé à mi-ligne. | `avant/portail-1920.png` | corrigé |
| 3 | majeur | portail (1280x800) | La **glose du titre** (« Les Chroniques de la Maison Targaryen ») passe sous la masse en majesté et se lit coupée. | `avant/portail-1280.png` | corrigé |
| 4 | majeur | lignée (`/lignee`, sans `?p=`) | La vue s'ouvre **défilée jusqu'à Aegon Ier** : ni le titre, ni la ligne des registres, ni le lien vers l'arbre ne sont visibles. Cause : StrictMode rejoue l'effet de montage, et le second passage est pris pour un changement de centre. Le défaut n'existe qu'en développement, mais c'est là qu'on juge le site. | `avant/lignee-1440.png`, `avant/lignee-360.png` | corrigé |
| 5 | majeur | lieux, lieu | Le **nom du lieu choisi** (et du lieu survolé) est écrit en `--sang` sur les terres de suie : **2,79:1** pour un texte de 13 px. | `avant/lieux-peyredragon-1440.png` (« Zaldrīzdōron ») | corrigé |
| 6 | majeur | lieux | **Cadrage par défaut** : la carte décale son centre sous la colonne opaque, alors que `WorldMap` borne le cadre au monde dessiné. La baie de la Néra est collée à la colonne, Harrenhal, Tumbleton et la Joie sont coupés au bord (« rrenhal », « bleton »), et Valyria est hors de l'écran, contre ce que demande la spec §5.12. | `avant/lieux-1440.png`, `apres/lieux-1280.png` (premier essai) | corrigé |
| 7 | majeur | partout | **Cibles sous 44 px** : noms d'entités (`NomEntite`, de 13 px pour les cavaliers de Balerion à 43 px), sommaires (41 px), noms du pal (28 px), références de la langue (31 px), titres d'événements de la fiche (22 px), lien de période de l'événement (27 px), périodes du parcours (27 px). | audit DOM, 1440 et 390 px | corrigé |
| 8 | majeur | dragons (360 px) | **Débordement horizontal** de 6 px : la légende « qui vole » met le nom et l'envergure estimée sur une seule ligne. | `avant/dragons-360.png` (signalé par le script) | corrigé |
| 9 | majeur (§0) | fiche d'une personne | Le fragment du pal est une **barre rouge de 6 px sur toute la hauteur du bloc**, lien compris. À l'œil, c'est exactement la bordure latérale colorée qu'interdit le §0, et rien ne la rattache à la personne. | `avant/personnages-rhaenyra-1440.png` | corrigé |
| 10 | mineur (§0) | lexique | « Spécimen », petite étiquette au-dessus du bloc de droite : un *eyebrow*. | `avant/langue-lexique-1440.png` | corrigé |
| 11 | mineur | toutes les vues à titre de récit | Sous un titre en `--t5` à interlignage de 0,95, les **jambages traversent la glose** (« Valyrio » sur « La langue valyrienne », « jāelio » sur « À propos… »). | `avant/langue-1440.png`, `avant/a-propos-1440.png` | corrigé |
| 12 | mineur | planche, fiche, lieu | **Glose qui répète le nom** : « Balerion / Balerion », parce que la forme valyrienne et la traduction sont identiques. | `avant/dragons-balerion-1440.png`, `avant/dragons-balerion-390.png` | corrigé |
| 13 | mineur | expressions | L'index des 59 formules : des **liens sans soulignement** (soulignement transparent), signalés par rien. DESIGN §2 l'interdit : un lien se signale par son soulignement. | `avant/langue-expressions-1440.png` | corrigé |
| 14 | majeur | guerre, et toute vue à `Colonne` (ordinateur) | Même cause que le n° 1, dans l'autre colonne collante (`pages/registres/Colonne.tsx`) : à l'arrivée, le bas de la colonne est sous la fasce. Le grand nombre « 129 » est **coupé à mi-hauteur** et le profil de la guerre est invisible tant qu'on n'a pas défilé de 240 px. | `avant/guerres-danse-des-dragons-1440.png` | restant |
| 15 | mineur | lignée | L'ordinal de règne en Grenze suit le nom : « Viserys II 10 », « Jaehaerys Ier 4 », « Maegor Ier 3 ». Il se lit comme un second numéro de roi, à côté de la colonne des générations, qui numérote déjà. Une forme comme « 10e souverain » ou une place hors du nom serait plus claire. | `avant/lignee-1920.png` | restant (arbitrage) |
| 16 | mineur | lignée, fiche, personnages | La **couronne** (`@/shared/marks`), au corps des noms, se réduit à un petit rectangle d'or à trois points : on ne la reconnaît pas. | `avant/lignee-1920.png` | restant (hors périmètre : `src/shared/marks`) |
| 17 | mineur | carte (toutes vues) | Signes des lieux de **22 x 22 px** (zone de pression de `WorldMap`), sous les 44 px demandés par la spec §8. Un lieu au bord du cadre a son nom coupé (« hamp d'Herberouge »). | audit DOM | restant (hors périmètre : `src/shared/map`) |
| 18 | mineur | téléphone | La masse de la fasce fait 20 px de haut, d'où une cible de 20 px. C'est voulu par la spec §2.3, et l'alternative au doigt existe : « ‹ » et « › », de 44 px. | audit DOM à 390 px | accepté |
| 19 | mineur | lexique (téléphone) | Les mots du spécimen ont 44 px de haut mais 18 à 23 px de large (« lo », « se »). | audit DOM à 390 px | restant |
| 20 | mineur | à propos (téléphone) | L'emblème rouge passe avant le `h1` et pousse le titre sous la ligne de flottaison. Il est aligné à gauche, ce n'est donc pas le « sceau centré » refusé, mais le titre devrait venir d'abord. | `avant/a-propos-360.png` | restant |
| 21 | mineur | personnages, guerres, apprendre | Trois légendes décrivent la mécanique du site (« sur l'échelle même de la fasce », « la fasce en miniature… à l'échelle exacte de la fasce du bas de l'écran »). Ce sont des légendes de figure, donc utiles, mais elles frôlent l'interdit des phrases sur le site lui-même. | `avant/personnages-1440.png`, `avant/guerres-1440.png` | restant (rédaction) |
| 22 | mineur | grammaire, expressions | Les titres n'ont pas de forme valyrienne (« Grammaire » seul en mode `hv`), alors que le lexique en a une (« Udra »). | `avant/langue-grammaire-360.png` | restant (linguiste) |
| 23 | mineur | toutes (téléphone, anglais) | Le nom du site, dans la ligne haute, est **coupé en points de suspension** : « The Chronicles of House Targar… » à 390 px. | `en/personnages-rhaenyra-lang-en-390.png` | corrigé |
| 24 | mineur | fasce (anglais) | « all of time » pour « tout le temps » : tournure fautive en anglais. | `en/chroniques-p5-lang-en-1440.png` | corrigé |
| 25 | mineur | récit anglais | Guillemets droits dans le récit (« 'greens' against the 'blacks' ») au lieu des guillemets anglais “ ”. Vient du contenu. | `en/chroniques-p5-lang-en-1440.png` | restant (contenu) |
| 26 | mineur | lexique | `build-content` avertit que trois clés (`v2.lexicon.theme.feu-et-dragons`, `…lieux-et-peuples`, `…religion-et-magie`) sortent de la convention `domaine.nom` : elles reprennent l'identifiant du thème. Sans effet à l'affichage. | sortie de `build-content` | restant |

**Faux positifs écartés** : le « V » évidé de la période donne un contraste mesuré de 1,00. C'est le texte transparent du masque SVG, et l'évidement donne en réalité 3,0:1 à 200 px, conforme. Les `sr-only` de la rangée des périodes sont « coupés » par construction. « CLES » dans la grammaire vient de la transcription phonétique entre crochets (`[ɟ]`), pas d'une clé. L'audit DOM signalait des appels de note de 7 à 10 px : ils ont déjà une zone de pression de 47 x 28 px en `::after` (`components/Notes.module.css`). Les `outline: none` de la feuille du cartel, du champ de recherche, de l'arbre entier et du questionnaire ont chacun leur substitut visible (soulignement de braise, anneau SVG, ou focus programmatique d'un conteneur), vérifiés dans les feuilles.

**Pendant les captures** : l'ouverture du portail (rideau de 3,2 s qui découvre la masse) était encore en cours à 1,5 s, d'où, dans `avant/portail-*.png`, une masse à moitié couverte, deux repères seulement et « la Conquête » à demi écrite. Ce n'est pas un défaut. Recapturé à 5,5 s dans `apres-portail/` : les cinq repères sont posés.

### Contrastes (depuis les jetons)

| Paire | Rapport | Emploi | Verdict |
|---|---|---|---|
| ivoire sur obsidienne | 16,22:1 | récit, titres | AAA |
| ivoire sur suie | 15,07:1 | cartel, carte | AAA |
| cendre sur obsidienne | 5,46:1 | appareil, gloses | AA |
| cendre sur suie | 5,07:1 | noms de la carte | AA |
| braise sur obsidienne | 6,38:1 | état actif, focus | AA |
| braise sur suie | 5,93:1 | lieux de l'année | AA |
| ivoire sur sang | 5,39:1 | (non employé pour du récit) | AA |
| or sur obsidienne | 9,23:1 | couronnes, règnes | AAA |
| vert des Verts sur obsidienne | 4,85:1 | marque de camp | AA |
| sang sur obsidienne | 3,01:1 | masse, profil, pal (objet graphique) | conforme (3:1) |
| **sang sur suie** | **2,79:1** | nom du lieu choisi sur la carte | **échec, corrigé** (n° 5) |
| bronze sur obsidienne | 4,21:1 | graduations en trait seulement | conforme (objet graphique) |
| cendre sur cramoisi | 3,19:1 | non employé (la spec l'interdit) | sans objet |
| basalte sur obsidienne | 1,32:1 | crans « ‹ › » désactivés | exempté (commande inactive) |

## Corrections faites

Toutes dans `src/versions/v2/**`. Aucune chaîne d'interface ajoutée : les clés employées existaient.

1. **Colonne du parti** (`pages/entree/TempsVue.tsx`, `TempsVue.module.css`) : le haut de la colonne est mesuré une fois (puis au redimensionnement et quand les polices sont prêtes), et borné au tiers de la fenêtre. Le profil vaut 45 % de la colonne telle qu'on la voit en arrivant, et non plus de toute la fenêtre. La carte colle à la hauteur où elle est arrivée et s'arrête au profil : les deux ne se recouvrent plus jamais. Vérifié dans `apres/chroniques-p5-1280.png` et `apres/chroniques-p5-1440.png` : carte entière (Harrenhal, Repos-du-Freux, Fossedragon lisibles), profil soudé à la fasce, « V » évidé.
2. **Portail** (`pages/PortalPage.module.css`) : sur ordinateur, la page tient un écran entre la ligne des registres et la masse en majesté, ce qui garde le colophon au défilement. Sous 900 px de haut, le titre suit la hauteur de la fenêtre (`min(--t5, 10,5svh)`) et l'en-tête se resserre. Vérifié dans `apres-portail/portail-1920.png` et `portail-1440.png` ; le cas 1280x800 est dans `apres2/`.
3. **Lignée** (`pages/lignee/Pal.tsx`) : le centre déjà traité est gardé par son identifiant. Le second passage de StrictMode reste « l'arrivée » et ne fait plus défiler. Vérifié dans `apres/lignee-1440.png` : la vue s'ouvre en haut.
4. **Carte** (`components/Carte.module.css`) : le nom du lieu choisi, survolé ou focalisé passe en ivoire (15:1). Le signe du lieu reste rouge.
5. **Lieux** (`pages/registres/LieuxScene.tsx`, `LieuxScene.module.css`) : sur ordinateur, la carte commence au bord de la colonne au lieu de passer dessous. Le cadre n'est plus décalé et ne sort plus du monde dessiné. Le cadre par défaut va de l'ouest de Harrenhal au sud de Valyria. Vérifié dans `apres2/lieux-1280.png` et `apres2/lieux-1440.png`.
6. **Cibles de 44 px**, par une zone de pression en `::after` qui déborde du texte sans le déplacer : `components/NomEntite.module.css` (tous les noms d'entités du site), `pages/lignee/Pal.module.css`, `pages/savoirs/Refs.module.css`, `pages/PersonPage.module.css`, `pages/PathPage.module.css`, `pages/EventPage.module.css`. Le sommaire (`components/Sommaire.module.css`) passe à 44 px de haut.
7. **Légende « qui vole »** (`pages/registres/QuiVole.module.css`) : la rangée passe à la ligne au lieu de déborder. Recapture à 360 px sans débordement.
8. **Fragment du pal** (`pages/lignee/FragmentPal.tsx`, `FragmentPal.module.css`) : bande de 12 px, comme le pal de la lignée. Elle va des parents aux enfants, s'arrête avant le lien, et une branche de sang pose la personne sur elle. On y lit une filiation dessinée et non plus un filet d'accent. Vérifié dans `apres/personnages-rhaenyra-1440.png`.
9. **Titres** (`components/Titre.tsx`, `Titre.module.css`) : la glose s'écarte de `max(--e3, 0,2 × --t5)`, et les jambages ne la touchent plus. Une glose identique au nom se tait. Vérifié dans `apres/langue-1440.png` et `apres/dragons-balerion-1440.png`.
10. **Lexique** (`pages/LexiconPage.tsx`, `LexiconPage.module.css`) : « Spécimen » n'est plus dit qu'au lecteur d'écran (`sr-only`, dans la région `aria-live`).
11. **Expressions** (`pages/PhrasesPage.module.css`) : soulignement de cendre à 55 % sur l'index, braise au survol.
12. **Ligne haute au téléphone** (`components/RegisterLine.module.css`) : le nom du site suit la largeur (`min(1.2rem, 4.6vw)`) puis passe à la ligne, au lieu de se couper. Vérifié dans `en2/personnages-rhaenyra-lang-en-360.png`.
13. **Chaîne anglaise** (`content/interface/ui.v2-bati.json`) : `v2.fasce.all_time` devient « all time ». Contenu reconstruit par le verrou (`build-content`, 12 fichiers écrits, aucune erreur).

**Anglais et mouvement réduit** : les 22 vues en `?lang=en` (audit DOM à 1440 px) ne montrent aucune clé non résolue, aucune chaîne française dans l'interface et aucune erreur de console. En mouvement réduit, le portail est posé d'emblée, sans rideau, avec ses cinq repères, et la période et la lignée sont complètes à 800 ms (`reduit/`).

## Restes

Les n° 14 à 22, puis 25 et 26 du tableau. Le seul qui compte vraiment est le **n° 14**. La colonne des registres (`Colonne.tsx`) empile carte, commandes, grand nombre et profil dans une hauteur pensée pour une colonne déjà collée en haut. À l'arrivée, le bas passe sous la fasce. J'ai écarté la correction du n° 1, qui fige la colonne sous l'en-tête : à 1280x800, il ne resterait que 70 à 160 px de carte. Deux voies existent, et il faut trancher : (a) quand le nombre n'est pas évidé (guerres courtes), l'écrire en `--t5` au lieu de `--t6` ; (b) poser le nombre sur le pied de la carte plutôt qu'au-dessus du profil.

Les n° 16 et 17 sont hors de mon périmètre (`src/shared/marks`, `src/shared/map`) : je les signale à l'orchestrateur. Le n° 22 attend le linguiste.

Audit des liens : le script du projet ne convient pas à la V2 (méthode). Il faudrait lui apprendre à ignorer `an`, `voir` et les filtres dans la clé de visite. C'est à l'orchestrateur d'en décider, car je n'écris pas dans `tests/`.

## Verdict

**La V2 est recevable, et c'est la plus singulière des deux.** Elle ne fait pas « IA ». Aucune grille de cartes, aucun *eyebrow* après correction, aucun ornement : chaque surface rouge est un nombre de dragons, une durée ou une filiation, et la composition est asymétrique et alignée à gauche partout. Face à la V1, c'est une autre idée, pas un autre habillage : le livre devient un blason qu'on règle, la page tournée devient le temps qu'on fait glisser.

Ce qui l'empêchait d'être parfaite était surtout de la mise en place à l'arrivée sur la page : un profil qui mangeait la carte, un colophon et une glose coupés sous la masse, une lignée ouverte au mauvais endroit, une carte des lieux mal cadrée. Ce sont exactement les défauts que le commanditaire verrait dans les cinq premières secondes. Ils sont corrigés et vérifiés sur capture.

Avant de la déclarer achevée, il reste le n° 14 (la colonne des guerres et des planches à l'arrivée), qui relève de la même famille, et les deux reprises de `src/shared` (couronne lisible, signes de carte de 44 px).
