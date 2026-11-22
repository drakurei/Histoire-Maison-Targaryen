# Tests de la maquette interactive

Campagne du 13 novembre 2026 — Chromium (Playwright 1.63), fichier `design/prototypes/maquette.html` ouvert en `file://`, comme par double-clic.

Commande : `node tests/functional/maquette.test.mjs`

Résultat : **45 vérifications réussies sur 45**, après correction des défauts ci-dessous.

## Ce qui est vérifié

- Écran d'ouverture : affiché à la première visite, page inerte derrière ; salutation tirée du lexique ; les 14 flammes allumées avant la réponse ; jauge accessible ; entrée par le bouton ; entrée automatique sans geste ; un geste pendant la séquence saute à l'état prêt ; mouvement réduit (sceau complet d'emblée) ; pas d'écran d'ouverture sur un lien profond.
- Langues : valyrien glosé par défaut ; `lang` du document = langue de lecture ; mention « texte en français » ; toute chaîne valyrienne référence une entrée du lexique ; bascule vers l'anglais et le français sans rechargement ; aucune rubrique valyrienne résiduelle en français ; glose masquable mais toujours accessible.
- Interactions : filtres des annales (adaptations, fiabilité), annale dépliable avec ses sources, note de glose au clic, recherche tolérante aux macrons (« aegon » trouve « Āegon »), arbre à focale avec recherche et recentrage, filiation contestée signalée, Index (8 volumes, 9 registres).
- Responsive : aucune barre de défilement horizontale sur 20 vues à 360, 375, 390, 430, 768, 1024, 1280, 1440 et 1920 px ; paysage mobile ; cibles tactiles d'au moins 44 px de haut à 360 px ; aucune erreur dans la console.

## Défauts trouvés par les tests et corrigés

1. Barre d'outils : débordement de 13 px à 360 px sur toutes les vues.
2. Arbre généalogique : débordement de plus de 1 200 px sous 430 px (fil de filiation non contraint).
3. Navigation : deux rendus successifs de la même adresse lors de navigations rapprochées (le second effaçait une saisie en cours).

## Défauts relevés sur les captures et corrigés

4. Écran d'ouverture : anneau de focus doublant le filet du bouton de réponse.
5. Soulignement pointillé permanent sur chaque mot valyrien (page transformée en suite d'avertissements) : il ne paraît plus qu'au survol.
6. Fiche de personne : rubriques « époux » et « enfants » collées.

## Limites

- Chromium seulement : Firefox et Safari ne sont pas installés dans l'environnement de test.
- Les interactions tactiles sont vérifiées par dimensions et par clics simulés, pas sur un téléphone réel.
- Aucune mesure Lighthouse à ce stade : elle porte sur le site construit (phase D), pas sur la maquette.
- Aucun test avec des lecteurs humains.

Captures : `tests/visual/maquette/`.

## Après l'audit indépendant (agent 14)

L'auditeur a refusé ce rapport comme preuve des cibles tactiles et de la couverture des langues. Il avait raison sur les deux points : le premier test ne mesurait que la hauteur de sept sélecteurs sur quatre vues, et les textes restés en français en mode anglais n'étaient pas signalés.

Corrections apportées, puis campagne rejouée — **53 vérifications réussies sur 53** :

- Cibles tactiles : tous les éléments interactifs de neuf vues sont désormais mesurés en largeur et en hauteur (44 × 44 px). Seuls sont exemptés les liens insérés dans une phrase ou une liste de noms. Pied de page, fil d'Ariane, fil de filiation, sélecteur de langue, marque et noms de dragons corrigés.
- Barre mobile ramenée sur une seule ligne à 360 px (test ajouté) ; la bascule de glose est dans l'Index sur mobile.
- La glose d'un titre de volume est la traduction du lexique (test ajouté).
- Une seule convention d'ère en français (test ajouté).
- Textes disponibles en français seulement : balisés `lang="fr"` et signalés en mode anglais.

Ce qui reste vrai et non corrigé : **le mode anglais n'est pas intégral** tant que les données n'ont pas leurs champs anglais (constat A14-001, problème ouvert). Aucun test ne garantit encore « zéro texte de l'autre langue » : c'est la tâche C6 de l'agent 13.
