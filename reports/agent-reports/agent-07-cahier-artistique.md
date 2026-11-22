# Rapport de l'agent 07 — Cahier artistique (tâche B3)

13 novembre 2026.

## 1. Livrables

| Fichier | Contenu |
|---|---|
| `documentation/design/cahier-artistique.md` | Vision, sept principes, palette et contrastes, matières, ornement, sceau, écran d'ouverture, mouvement, trois directions, quinze décisions. |
| `design/design-system/tokens.css` | 147 propriétés : 25 couleurs primitives, jetons sémantiques pour deux contextes (sombre, parchemin), mesures, espacements, pans coupés, filets, ombres, matières, mouvement, plans. Familles de police nommées, non fixées. |
| `design/design-system/sceau.svg` | Grand sceau (72 éléments, 15,8 Ko, 4,6 Ko en gzip) et trois symboles : marque 24 px, favicon 16 px, monogramme J.D. |
| `reports/agent-reports/agent-07-cahier-artistique.md` | Ce rapport. |

Aucun autre fichier du projet n'a été créé ni modifié. Les scripts de calcul et les rendus de contrôle sont restés dans `/tmp`.

## 2. Ce qui a été vérifié, et comment

| Vérification | Méthode | Résultat |
|---|---|---|
| Contrastes de la palette | Script Python, formule WCAG de luminance relative, toutes les paires texte / fond prévues. | Tables dans le cahier (sections 2.2 et 2.3). |
| Contrastes sur matière | Rendu Chromium des textures aux opacités des jetons, lecture des pixels, 1ᵉʳ et 99ᵉ centiles. | Trois couleurs corrigées, opacité du grain réduite (voir 3.2). |
| Validité de `tokens.css` | Chargement dans Chromium ; 126 valeurs testées avec `CSS.supports` sur la propriété visée. | Aucune valeur rejetée. Quatre règles, accolades équilibrées. |
| Validité de `sceau.svg` | Analyse XML ; identifiants uniques (47) ; absence de texte, de bitmap, de style et de script. | Conforme. |
| Dessin du sceau | Rendus Chromium à 900, 640, 200, 96, 48, 32, 24 et 16 px, sur obsidienne, basalte et parchemin ; agrandissement pixel à pixel des petites tailles. | Quatre itérations (voir 3.1). |
| Version encre du sceau | Rendu avec les règles CSS de remplacement données au cahier. | Fonctionne sans retoucher le fichier. |
| Séquence d'ouverture | Prototype jetable avec les jetons réels ; huit états capturés de 150 à 3 100 ms. | La séquence est réalisable en CSS seul. Deux corrections reportées au storyboard (voir 3.4). |
| Cohérence entre fichiers | Script : tous les hex des jetons figurent au cahier, le sceau n'emploie que des couleurs de la palette, 21 rapports cités en commentaire recalculés. | Aucun écart. |

Ce qui n'a **pas** été vérifié : la performance sur un appareil réel (les coûts des matières sont des estimations) ; le chargement du symbole par `<use href>` externe sur un serveur ; l'antériorité visuelle du sceau ; les faits d'univers, cités de mémoire.

## 3. Décisions prises

### 3.1 Le sceau

- **Concept retenu : la Chandelle de verre**, avec l'ouverture de l'amande reprise au concept de l'œil. Justification complète au cahier, section 5.
- Itérations du dessin :
  1. Flammes en amandes : elles se lisaient comme des feuilles de laurier. Remplacées par des gouttes.
  2. Marque de signature par un point dans les flammes 4 et 10 : elle formait deux petits yeux. Remplacée par une fente fine.
  3. Chandelle à cinq bandes et socle à deux degrés : elle se lisait comme un phare. Redessinée en lame torse à trois arêtes lentes, pointe oblique, socle réduit à une barre.
  4. Halo débordant sur les hachures : rogné à l'amande. Hachures retirées près des pointes, où elles laissaient des traits orphelins.
- **Marque 24 px dessinée à part**, et non réduite : le grand sceau devient illisible sous 120 px. Premier essai trop serré (amande étroite, socle) ; second essai avec amande inscrite de pointe à pointe, retenu.
- **Favicon** : deux variantes comparées à 16 px (anneau ou amande). L'amande est retenue, cohérente avec la marque.
- **Monogramme J.D.** : premier dessin lu comme un « P » à queue. Redessiné avec haste commune et crochet du J qui arrondit le pied du D.
- **Sceau sans légende** : pas de texte dans le fichier, donc aucune dépendance aux polices ni aux trois langues.

### 3.2 La palette

- 25 couleurs en cinq familles. Ni vert ni bleu : les états passent par un signe et un mot.
- Trois corrections imposées par la mesure sur matière : bronze `#9A7844` → `#A8854D`, braise `#E55B45` → `#E8634C`, bistre `#6A5237` → `#624A30`. Rouge Targaryen relevé de `#B01724` à `#C42230` pour atteindre 3:1 sur obsidienne tout en gardant l'ivoire lisible dessus (4,72).
- Opacité du grain de pierre fixée à 0,22 par la mesure, et non au jugé.
- Le rouge Targaryen n'est pas une couleur de texte courant. Deux rouges de service l'encadrent : braise sur sombre, rubrique sur parchemin.

### 3.3 Les jetons

- Préfixes de catégorie en anglais, alignés sur `--font-display`, `--font-text`, `--font-label` ; noms de valeur en français.
- Couleurs de texte nommées `--ink-*` pour ne pas entrer en collision avec les tailles `--text-*`.
- Contexte `[data-surface="parchemin"]` : les mêmes jetons sémantiques changent de valeur ; un composant n'a pas de variante claire.
- Rayon nul, pans coupés par `clip-path`, cercle pour ce qui est rond.
- Les trois familles de police ont un repli générique `serif`, sans choix de famille.
- **Raccord avec l'agent 08**, dont l'étude est arrivée pendant ce travail : j'avais écrit une échelle de corps provisoire ; je l'ai retirée pour ne pas doubler ses jetons `--fs-*`. Il reste `--fs-monument` (chiffres d'ère de V2) et deux interlettrages alignés sur ses plages (0,24 em pour les inscriptions, 0,09 em pour les petites capitales). Ses piles de polices sont citées en commentaire, pas déclarées.
- En mouvement réduit, les durées tombent à 1 ms ; seul un fondu de 160 ms subsiste.

### 3.4 L'ouverture

- La salutation accompagne l'attente ; la réponse rituelle ouvre. Les quatorze flammes sont la jauge.
- Le prototype a montré deux défauts, corrigés dans le storyboard : les hachures du champ doivent paraître après l'ouverture de l'amande, et la place du bouton de réponse doit être réservée dès le départ pour éviter un décalage du sceau.
- Rituel complet une fois par session, sur l'accueil seulement. Version brève de 900 ms ailleurs.

### 3.5 Les trois directions

- V1 « Le Codex » (page, symétrie, parchemin), V2 « La Lignée » (fil continu, pierre, asymétrie), V3 « La Table d'étude » (ruban et réglette croisés). V3 est donnée comme hypothèse, avec ses critères de confirmation et sa solution de repli.

## 4. Alternatives écartées

| Alternative | Raison |
|---|---|
| Sceau « Œil de l'archive » tel quel | Trop proche de deux images de cinéma fantastique ; pictogramme « afficher » à 24 px ; fait de l'archive une créature. |
| Sceau « Fermoir » | Rien de propre à l'univers ; enferme les trois versions dans la métaphore du livre. |
| Un œuf écailleux qui se fend | Trop associé à une image précise des séries ; illisible à 24 px. |
| Une légende circulaire sur le sceau | Dépendance aux polices, trois langues à gérer, concurrence avec les quatorze flammes. |
| Parchemin à fibres horizontales | Rendu proche d'un bois brossé. Remplacé par une marbrure de peau. |
| Hachures au pas de 5 px | Moiré visible à 45°. Pas porté à 3√2 px. |
| Grain de pierre à 0,40 | Faisait passer bronze et braise sous 4,5:1 sur basalte. |
| Rouge sombre en texte sur noir | 1,60:1 pour le cramoisi : illisible. |
| V2 en « observatoire » à cadran tournant | Les quatorze crans ne correspondent pas aux huit périodes ; métaphore plaquée. |
| V2 fondée sur une carte | Demande un tracé géographique original lourd, avec une question de droits sur les cartes publiées. |
| Signature par message dans la console ou par séquence de touches | Procédés d'usage courant, sans lien avec le sujet. |
| Apparition de la salutation lettre à lettre | Effet de machine à écrire, déjà vu partout. |

## 5. Risques

### Lisibilité

1. **Rouge Targaryen sur sombre** : 3,41:1 sur obsidienne, 3,08 dans le cas défavorable avec grain. Aucune marge. Il doit rester un grand titre ou un trait, jamais un texte courant, et il est interdit sur basalte texturé.
2. **Paires limites** : braise sur cendre (4,50), bistre sur parchemin ombré (4,58), ponce sur cendre (4,88). Tout changement de valeur les fait tomber.
3. **Capitales lapidaires espacées** : fatigantes au-delà de quelques mots. Le cahier les réserve aux titres, mais la tentation sera forte en V2.
4. **Haut valyrien par défaut** : le visiteur ne comprend pas l'interface à l'arrivée. D'où la proposition d'un sélecteur de langue sur le seuil.

### Performance

5. **V2** : page très longue, tracé lié au défilement, chiffres monumentaux. Risque réel sur téléphone de milieu de gamme. À prototyper avant de s'engager.
6. **Ombre interne du parchemin** (`--shadow-bord-parchemin`, flou de 72 px) : coûteuse si le folio est repeint. Ne jamais animer ses dimensions.
7. **Textures en `data:`** : rastérisées à la densité de l'écran. Coût estimé négligeable, non mesuré.
8. **Écran d'ouverture** : environ 3 s incompressibles à la première visite. Acceptable une fois par session, pénalisant si la limite n'est pas respectée.

### Droits et justesse

9. **Lecture « œil » du sceau** : l'amande dans l'anneau d'écailles l'évoque en filigrane. Assumé, mais réversible : sans l'anneau d'écailles, le sceau tient.
10. **Antériorité** : aucune recherche d'images n'a été faite. Le sceau est dessiné d'après une description textuelle, sans modèle graphique, mais je ne peux pas garantir l'absence de ressemblance fortuite avec un visuel existant.
11. **Faits d'univers** : la description des chandelles de verre et leur usage sont cités de mémoire. Si l'agent 02 les nuance, le texte du colophon change ; le dessin, lui, ne dépend que de trois traits (haute, torse, obsidienne).
12. **V2 et la généalogie réelle** : unions multiples et branches rivales contredisent le fil unique.

## 6. Points à arbitrer par l'orchestrateur

1. **Sceau** : valider la Chandelle de verre, et dire si la parenté lointaine avec un œil est acceptée (garder l'anneau d'écailles) ou non (le retirer).
2. **Réponse rituelle** : porte avec geste (recommandé pour V2 et V3) ou entrée automatique (recommandé pour V1).
3. **Graphie de la salutation** : le commanditaire écrit « Valar morghulis ». L'orthographe à macrons de la langue construite porte à ma connaissance un ū. La règle du projet (macrons) et la citation du commanditaire divergent : à trancher avec l'agent 04.
4. **Sélecteur de langue sur le seuil** : avec l'agent 06.
5. **Signature J.D.** : valider les trois niveaux, en particulier la marque de tâcheron en fin de chaque volume (huit occurrences).
6. **Déclaration des familles de police** : `tokens.css` laisse `serif` en repli. L'agent 08 recommande ses piles « à déclarer dans les jetons ». À faire à l'intégration (tâche C2), en veillant à l'ordre de chargement : une seule déclaration, dans un seul fichier.
7. **Scène du Fléau** : accepter ou non l'unique exception à l'interdiction des particules.
8. **Noms des trois versions** : noms de travail en français ; équivalents valyriens à demander à l'agent 04.

## 7. Propositions

1. **Faire valider par l'agent 02** les trois faits qui fondent le sceau (chandelles de verre, Quatorze Flammes, formule et réponse), avant toute rédaction du colophon.
2. **Prototyper V2 tôt**, sur les données de l'agent 03, avec un seul critère : le fil tient-il sur une génération à unions multiples, à 360 px, à 60 images par seconde.
3. **Tester la couverture de ȳ et Ȳ en premier** dans l'étude typographique : c'est le critère qui élimine le plus de familles.
4. **Nuancier d'écailles** : demander à l'agent 02 la couleur attestée de chaque dragon, avec sa source. C'est la seule « image » des fiches de dragons.
5. **Ligne de vie** : demander à l'agent 11 que le modèle de données porte naissance, début et fin de règne, mort, avec un indicateur d'incertitude par date. La tête de chaque fiche en dépend.
6. **Extraire le favicon** en fichier autonome (agent 09), avec une variante PNG de 32 px pour les navigateurs qui ignorent le SVG.
7. **Mesurer sur appareil** (agent 13) : coût de peinture du folio de parchemin au défilement, et tenue de la séquence d'ouverture sur un téléphone de milieu de gamme.
8. **Suite pour la tâche C2** : dessiner le jeu d'icônes selon les règles de la section 4.2, les trois cartouches et les cinq filets en composants, à partir de ces jetons.
