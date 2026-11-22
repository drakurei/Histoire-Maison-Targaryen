# Audit de l'environnement — 13 novembre 2026

Toutes les valeurs ci-dessous ont été relevées par des commandes réellement exécutées. Ce qui n'a pas pu être mesuré est indiqué comme tel.

## 1. Session et modèle

| Point | Constat |
|---|---|
| Produit | Claude en mode Cowork (session cloud liée à l'ordinateur « jonathan »). Ce n'est pas une session Claude Code en ligne de commande. |
| Modèle | `claude-fable-5-2` (Claude Fable 5.2), confirmé par l'environnement de la session. |
| CLI Claude Code | Présent dans l'espace cloud, version 2.1.323. Non utilisé directement : l'orchestration passe par les outils de la session. |
| Sous-agents | Outil Agent disponible : de vrais sous-agents peuvent être lancés, chacun avec son propre contexte. Ils ne peuvent pas être interrompus en cours d'exécution. |

## 2. Deux machines, deux rôles

| | Espace de travail cloud | Ordinateur « jonathan » |
|---|---|---|
| Système | Ubuntu 24.04, x86_64 | Windows x64, application Claude 5.11492.2 |
| Processeur | 2 cœurs | non mesurable depuis la session (la VM locale voit 2 cœurs) |
| Mémoire | 7,8 Gio (7,4 Gio libres) | non mesurable ; la VM locale dispose de 3,8 Gio |
| Disque | 31 Go libres | **12 Go libres sur 476 Go (98 % occupé)** |
| Outils | Node 22.23.4, npm 10.9.9, pnpm 10.28, bun 1.4.4, Python 3.13, git 2.43, TypeScript, Playwright 1.63 + Chromium | VM locale : Node 22.23.4, npm, Python 3.10, git. Node côté Windows : non vérifiable depuis la session (les dossiers `.npm` et `.bun` du profil suggèrent qu'il est installé). |

Conséquences retenues :

- Les travaux lourds (sous-agents, builds, tests navigateur) tournent dans le cloud. L'ordinateur ne reçoit que les fichiers finis.
- Le disque de l'ordinateur est presque plein : aucun `node_modules` ni cache n'est copié sur le Bureau sans nécessité ; le poids du dossier projet est suivi.
- Vite et Lighthouse ne sont pas installés globalement : ils seront des dépendances locales du projet (phase D), jamais des installations globales.

## 3. Skills et plugins réellement disponibles

Mécanisme de recherche utilisé : recherche de skills du compte (aucun résultat supplémentaire) et lecture des fichiers `SKILL.md` synchronisés dans la session.

| Skill | Usage retenu pour le projet |
|---|---|
| `design:design-system` | Structure des jetons (couleurs, typographie, espacements, mouvement) et documentation des composants — phase C. |
| `design:accessibility-review` | Grille WCAG 2.1 AA (contrastes 4,5:1, cibles 44 px, focus visible) — agent 12. |
| `design:design-critique` | Grille de critique (première impression, hiérarchie, cohérence) — agents 07 et 14. |
| `design:design-handoff`, `design:ux-copy` | Spécifications de composants et micro-textes — phases C et D. |
| `engineering:architecture`, `engineering:system-design` | Format ADR pour chaque décision structurante — agent 09. |
| `engineering:testing-strategy`, `engineering:code-review` | Pyramide de tests, revue sécurité/performance — agents 13 et 14. |
| `engineering:documentation` | README, guide de projet, guide de reprise. |
| `claude-security` | Analyse de sécurité du code avant livraison — phase I. |
| `figma:*` | Disponible, non retenu à ce stade : la maquette est codée pour être testable dans un navigateur. |

Aucun skill dédié à l'animation ou au motion design n'est disponible : ce travail repose sur l'agent 10 et sur la documentation officielle des outils retenus.

## 4. Everything Claude Code (ECC)

**ECC n'est pas disponible dans cette session.** Aucun agent, skill, commande ou hook ECC n'est chargé. Les dossiers de configuration de Claude sur l'ordinateur sont protégés et ne peuvent pas être inspectés depuis la session : je ne peux donc ni confirmer ni infirmer qu'ECC est installé dans votre Claude Code local.

Conformément à la consigne, rien n'a été installé ni téléchargé. Procédure officielle si vous souhaitez l'utiliser : ECC s'installe comme plugin de Claude Code depuis son dépôt officiel (`affaan-m/everything-claude-code`), en suivant le README du dépôt, dans une session Claude Code en ligne de commande. Un plugin installé dans Claude Code local n'est pas automatiquement chargé dans une session Cowork.

Le projet ne dépend pas d'ECC : les 14 agents sont définis dans `command-center/orchestration/registry.json` et exécutés par l'outil Agent de la session.

## 5. Sécurité

- Seul le Bureau a été connecté à la session ; seul le dossier `TARGARYEN-CHRONICLES` y est écrit.
- Aucun dossier `.claude` n'est créé dans le projet. Aucune configuration globale n'est modifiée.
- Le Command Center écoute uniquement sur `127.0.0.1` et ne contient aucun secret.
