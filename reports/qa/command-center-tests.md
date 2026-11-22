# Tests du Command Center

Campagne du 13 novembre 2026 — Chromium (Playwright 1.63), sur une copie isolée du dossier `command-center` (l'état réel du projet n'est pas modifié par les tests).

Commande : `node tests/functional/command-center.test.mjs`

Résultat : **38 vérifications réussies sur 38** (après correction de deux défauts trouvés au premier passage).

## Ce qui est vérifié

- Sécurité du serveur : en-tête Host étranger refusé, origine étrangère refusée, type de contenu non JSON refusé, commandes inconnues refusées, corps trop volumineux refusé, traversée de chemin refusée, fichiers hors liste blanche introuvables, politique CSP présente.
- Véracité : les 13 sous-agents apparaissent « jamais exécutés » tant qu'aucun n'a tourné ; une pause demandée n'est pas affichée comme effective avant le checkpoint.
- Commandes réellement implémentées : pause et reprise d'un agent, réévaluation avec motif obligatoire, validation d'une décision, pause et reprise du projet. En pause, l'orchestrateur refuse de démarrer une tâche ou de lancer un agent (vérifié par code de sortie).
- Rapports : rendu Markdown avec contenu HTML échappé.
- Historique : filtre par agent.
- Responsive : aucune barre de défilement horizontale à 360, 390, 768, 1024, 1280 et 1920 px sur les sept vues ; boutons d'au moins 44 px de haut ; aucune erreur dans la console.

## Défauts trouvés et corrigés

1. Vue Historique : débordement horizontal de 96 px à 360 px (listes déroulantes des filtres). Corrigé dans `styles.css`, test rejoué.
2. Test de la fiche agent sensible à la casse (titres en capitales par CSS). Test corrigé.

## Limite connue

Le serveur a été testé sous Linux (Node 22). Le lanceur Windows `Ouvrir-Command-Center.cmd` n'a pas pu être exécuté depuis la session : son premier lancement sur votre ordinateur fait partie de la validation.

Captures : `tests/visual/command-center/`.
