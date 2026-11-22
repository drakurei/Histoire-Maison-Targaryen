# Guide du projet

## 1. Comment le projet est conduit

- **Agent 01, l'orchestrateur**, est la session principale Claude (Cowork). Il n'agit que pendant une session ouverte.
- **Les agents 02 à 14** sont de vrais sous-agents, lancés un par un par l'orchestrateur avec leur brief (`command-center/orchestration/registry.json`). Trois au plus tournent en même temps. Un sous-agent en cours ne peut pas être interrompu.
- **Les travaux lourds tournent dans le cloud**, pas sur l'ordinateur : sous-agents, builds, tests navigateur. Le dossier du Bureau reçoit les fichiers finis.
- **Checkpoint** : avant chaque lancement d'agent et après chaque tâche, l'orchestrateur lit les demandes déposées par le Command Center (`orchestration/inbox/commands.jsonl`), les applique et en accuse réception (`inbox/acks.jsonl`). Une pause demandée prend donc effet au checkpoint suivant, jamais instantanément.
- **Une tâche n'est close** que si elle était en cours, si ses dépendances sont closes et si une note de vérification est fournie (règles appliquées par `orchestrate.mjs`).

## 2. Qui a réellement travaillé jusqu'ici

| Agent | Exécutions réelles | Livrable |
|---|---|---|
| 01 Orchestrateur | session principale | Audit, registre, Command Center, maquette, tests |
| 02 Historien | 1 | 125 événements, 18 souverains, 28 dragons, 20 sources |
| 03 Généalogiste | 1 | 176 personnes, 69 unions, 132 filiations, script de validation |
| 04 Linguiste | 1 | Lexique de 87 entrées classées, grammaire essentielle |
| 06 Architecte UX | 1 | Architecture de l'information, règle de langue, 50 wireframes |
| 07 Directeur artistique | 1 | Cahier artistique, jetons, sceau original |
| 08 Typographe | 1 | Étude mesurée, trois familles sous licence libre |
| 14 Auditeur | 1 | Audit indépendant : 28 constats |
| 05, 09, 10, 11, 12, 13 | 0 | Pas encore exécutés : première mission à la reprise |

## 3. Plan

| Phase | Contenu | État |
|---|---|---|
| A Préparation | Audit, agents, Command Center, plan | Faite |
| B Recherche | Lexique, typographie, cahier artistique, UX, chronologie, généalogie | Faites. Restent : ADR technique (09), bible du mouvement (10), modèle de données (11), corpus complet (02), terminologie et traductions (05) |
| C Conception | Maquette, design system, audit | Présentée. Restent : contre-vérifications par les agents 13 et 12 |
| D Version 1 | « Le Codex », fidèle au cahier des charges | En attente de validation |
| E à J | Audit V1, version 2, comparaison, version 3, audit complet, livraison | À venir ; découpées en tâches à leur lancement |

Le détail vivant est dans le Command Center (vue Tâches).

## 4. Décisions qui vous attendent

1. **V-001 — Règle de langue.** Le lexique publié du haut valyrien ne permet pas d'écrire le récit historique sans inventer la langue. Proposition : le valyrien tient la navigation, les titres, les étiquettes, les formules et de courts incipit, chacun avec sa traduction ; le récit est en français ou en anglais. Mesure de l'auditeur : 2,4 % des caractères affichés sont valyriens en mode par défaut (26 % sur le portail).
2. **V-002 — Dispositif de contrôle.**
3. **V-003 — Maquette et lancement de la version 1.**
4. **S-001 — Aucun dragon figuré ni portrait** (nuanciers d'écailles et lignes de vie à la place).
5. **S-002 — Réponse « Valar dohaeris » à l'entrée.**
6. **S-003 — Graphie « Valar morghūlis »** en haut valyrien.

## 5. Ce que la maquette ne montre pas

Guerres, Lieux et carte, Parcours d'apprentissage et fiche d'événement autonome sont spécifiés en wireframes, pas maquettés. Les directions 2 et 3 sont décrites, pas construites. Les biographies ne sont pas rédigées. Le mode anglais n'est pas intégral (constat critique A14-001). Aucune mesure Lighthouse : elle portera sur le site construit.

## 6. Reprise après interruption

1. Ouvrir une session liée à l'ordinateur et connecter le dossier `TARGARYEN-CHRONICLES`.
2. L'orchestrateur recopie le dossier dans son espace de travail, lit `command-center/orchestration/state.json` et la fin de `command-center/events/events.jsonl`.
3. `node command-center/orchestration/orchestrate.mjs session start`, puis `checkpoint` pour lire vos demandes.
4. Prochaines actions dans l'ordre : appliquer vos décisions ; B7 à B12 (agents 09, 10, 11, 02, 05) ; C6 et C7 (agents 13 et 12) ; découpage de la phase D.

Rejouer les tests (dans un environnement où Playwright et Chromium sont installés) :
`node tests/functional/command-center.test.mjs` et `node tests/functional/maquette.test.mjs`.
Reconstruire la maquette : `node design/prototypes/build-maquette.mjs`.

## 7. Règles de sécurité tenues

Aucun dossier `.claude` dans le projet ; aucune configuration globale modifiée ; aucune installation sur l'ordinateur ; aucun `node_modules` sur le Bureau ; Command Center lié à `127.0.0.1` seulement ; aucune connexion à un dépôt distant.
