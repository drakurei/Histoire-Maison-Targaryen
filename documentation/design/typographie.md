# Typographie — étude, mesures et système

Agent 08 — Typographie et identité. Tâche B2. Relevé du 13 novembre 2026.

Fichiers liés : `assets/fonts/` (polices, `fonts.css`, `LICENSES.md`), `reports/agent-reports/agent-08-typographie.md` (méthode et scripts de mesure).

---

## 1. Décision en bref

| Voix | `font-family` | Rôle | Fichiers | Poids |
|---|---|---|---|---|
| Affichage | `'Cormorant Garamond'` (variable, graisses 300–700, romain + italique) | Titres, épigraphes, inscriptions en capitales | 4 woff2 | 145 028 octets |
| Lecture | `'Alegreya'` (variable, graisses 400–900, romain + italique) | Textes longs, chapôs, notes, tableaux | 4 woff2 | 164 104 octets |
| Étiquettes | `'Alegreya SC'` (statique, graisse 500) | Étiquettes, surtitres, dates, navigation en petites capitales | 2 woff2 | 62 824 octets |
| **Total** | | | **10 woff2** | **371 956 octets (363 Kio)** |

- Les trois familles sont sous **SIL OFL 1.1**, sans nom réservé (détail et textes : `assets/fonts/LICENSES.md`).
- **ȳ et Ȳ (U+0233, U+0232) sont présents** dans les trois familles, romain et italique, dans le sous-ensemble `latin-ext`. Mesuré dans la table `cmap`, puis confirmé au rendu dans Chromium : 42 combinaisons famille × graisse × style × langue, aucun repli sur une police système.
- Les trois familles ont des **chiffres elzéviriens par défaut** (mesuré sur les contours), avec bascule vers des chiffres alignés (`lnum`) et tabulaires (`tnum`).
- **Il n'existe aucune écriture valyrienne exploitable légalement** (section 10). Le haut valyrien s'écrit ici en alphabet latin à macrons, et rien d'autre.

---

## 2. Méthode de mesure

1. Installation de 91 paquets `@fontsource/*` et `@fontsource-variable/*` (83 familles distinctes, certaines en version statique et variable ; version 5.3.0, sauf `gentium-basic` 4.5.7) dans un dossier temporaire, avec `npm install --ignore-scripts`. 395 fichiers woff2 mesurés.
2. Lecture de la table `cmap` de chaque fichier woff2 avec fontTools 4.67.0 (`TTFont(...).getBestCmap()`), sous-ensemble par sous-ensemble (`latin`, `latin-ext`), romain et italique.
3. Lecture de la liste des fonctionnalités `GSUB` (`onum`, `smcp`, `c2sc`, `lnum`, `tnum`, `pnum`) et, pour les polices retenues, vérification que la fonctionnalité substitue réellement les dix chiffres.
4. Style des chiffres par défaut déterminé sur les contours : un chiffre est elzévirien si 3, 4, 5, 7, 9 descendent sous la ligne de base de plus de 0,08 em.
5. Hauteur d'x, hauteur de capitale, chasse moyenne, sommet des capitales accentuées, mesurés sur les contours et la table `hmtx`.
6. Contrôle croisé sur les fichiers amont complets du dépôt `google/fonts` (Cinzel, Cinzel Decorative, Marcellus, Forum, IM Fell English, Source Serif 4, Alegreya, Cormorant Garamond, Literata, EB Garamond).
7. Rendu réel dans Chromium (Google Chrome sans interface, piloté par Playwright) : spécimens comparatifs sur fond noir, puis interrogation du moteur (`CSS.getPlatformFontsForNode`) pour savoir quelle police dessine chaque glyphe.

Les 36 signes français testés : `é è ê ë à â ç î ï ô û ù ü œ Œ æ É È Ê Ë À Â Ç Î Ï Ô Û Ù Ü Æ « » ’ – — …`.

---

## 3. Constats transversaux

Ces six constats valent pour tous les candidats et ont orienté la décision.

1. **Où sont les caractères.** Dans tous les paquets fontsource, `ñ Ñ`, tous les signes français (y compris `œ Œ`, `’ – — …`, `« »`) et les chiffres sont dans le sous-ensemble **`latin`**. Les dix voyelles à macron et `ȳ Ȳ` sont dans **`latin-ext`**, ainsi que `†` et `Ÿ`. Il faut donc embarquer les deux sous-ensembles pour chaque style. Une page française sans macron ne télécharge que les fichiers `latin` (vérifié : 3 fichiers chargés).
2. **`onum`, `smcp` et `c2sc` sont absents des 395 fichiers fontsource mesurés (91 paquets sur 91).** Les polices amont les contiennent pourtant (vérifié sur Alegreya, Cormorant Garamond, Literata, EB Garamond du dépôt `google/fonts`) : le découpage en sous-ensembles les supprime. Conséquence : pas de `font-variant-caps: small-caps` ni de `font-variant-numeric: oldstyle-nums` fiables. Les seules voies propres sont une famille « SC » dessinée à part, et des chiffres elzéviriens **par défaut**.
3. **`ȳ` est le caractère discriminant.** 38 familles sur 83 ne couvrent pas la paire `ȳ Ȳ`, dont Cinzel, Cinzel Decorative, Marcellus, Forum, les IM Fell et Source Serif 4. L'absence est confirmée dans les fichiers amont pour ces six-là : ce n'est pas un effet du découpage.
4. **Espace fine insécable (U+202F) absente des 35 polices de la sélection restreinte**, espace fine (U+2009) présente dans les polices retenues. Dans Chromium, U+202F est tout de même rendue par la police web, avec une largeur étroite (aucun repli signalé). Firefox et Safari n'ont pas été testés.
5. **Lettres supérieures `ᵉ ʳ`, `№`, `‡` absentes** d'Alegreya : elles tombent sur une police système (vérifié). Les ordinaux se composent avec `<sup>`.
6. **Aucun fleuron** (`❦ ❧ ☙ ⁂ ◆ ✦`) dans aucune police retenue : les ornements doivent être des dessins SVG, jamais des caractères.

---

## 4. Tableau de couverture mesurée

Une ligne par famille et par fichier romain mesuré (les italiques, quand ils existent, ont la même couverture ; seule exception, Almendra, dont l'italique n'a pas les macrons). « Poids » : fichier `latin` puis fichier `latin-ext` du style romain (graisse 400 pour les statiques, axe `wght` complet pour les variables). « RFN » : l'en-tête de licence déclare un nom réservé. Pour Alegreya SC, la ligne mesure la graisse 400 ; la graisse embarquée (500) figure dans le second tableau.

| Police — fichier mesuré (romain ; paquet fontsource 5.3.0 sauf mention) | Macrons ā ē ī ō ū Ā Ē Ī Ō Ū | ȳ Ȳ (U+0233/0232) | ñ Ñ | Français (36 signes) | onum (GSUB) | smcp (GSUB) | Chiffres par défaut | Poids latin / latin-ext (Kio) | Licence | Verdict |
|---|---|---|---|---|---|---|---|---|---|---|
| aboreto (statique 400) | 10/10 (latin-ext) | **oui** (latin-ext) | oui (latin) | 36/36 | non | non | alignés | 15.0 / 7.6 | OFL 1.1 | Écartée : capitales seules, une graisse, trop légère |
| alegreya (variable wght, + italique) | 10/10 (latin-ext) | **oui** (latin-ext) | oui (latin) | 36/36 | non | non | elzéviriens (+lnum) | 42.5 / 37.0 | OFL 1.1 | **RETENUE (lecture)** |
| alegreya-sans (statique 400, + italique) | 10/10 (latin-ext) | **oui** (latin-ext) | oui (latin) | 36/36 | non | non | elzéviriens (+lnum) | 23.2 / 20.8 | OFL 1.1 | Écartée : linéale, hors ambiance (réserve éventuelle pour l'interface) |
| alegreya-sans-sc (statique 400, + italique) | 10/10 (latin-ext) | **oui** (latin-ext) | oui (latin) | 36/36 | non | non | elzéviriens (+lnum) | 22.6 / 23.9 | OFL 1.1 | Écartée : linéale, hors ambiance |
| alegreya-sc (statique 400, + italique) | 10/10 (latin-ext) | **oui** (latin-ext) | oui (latin) | 36/36 | non | non | elzéviriens (+lnum) | 28.4 / 29.6 | OFL 1.1 | **RETENUE (étiquettes)** |
| andada-pro (variable wght, + italique) | 10/10 (latin-ext) | **oui** (latin-ext) | oui (latin) | 36/36 | non | non | elzéviriens | 34.6 / 28.3 | OFL 1.1 | Écartée : mécane discrète, moins littéraire |
| bona-nova (statique 400, + italique) | 10/10 (latin-ext) | **oui** (latin-ext) | oui (latin) | 36/36 | non | non | elzéviriens (+lnum) | 26.3 / 37.1 | OFL 1.1 | Écartée : statique, latin-ext de 37 Ko par style |
| bona-nova-sc (statique 400, + italique) | 10/10 (latin-ext) | **oui** (latin-ext) | oui (latin) | 36/36 | non | non | elzéviriens (+lnum) | 32.9 / 38.7 | OFL 1.1 | Écartée : alternative possible pour inscriptions, moins noble que Cormorant |
| brygada-1918 (variable wght, + italique) | 10/10 (latin-ext) | **oui** (latin-ext) | oui (latin) | 36/36 | non | non | alignés | 23.0 / 32.1 | OFL 1.1 | Écartée : chiffres alignés, pas de famille SC |
| cardo (statique 400, + italique) | 10/10 (latin-ext) | **oui** (latin-ext) | oui (latin) | 36/36 | non | non | alignés | 15.1 / 32.6 | OFL 1.1 | Écartée : statique, 3 styles seulement, sans italique gras |
| caudex (statique 400, + italique) | 10/10 (latin-ext) | **oui** (latin-ext) | oui (latin) | 36/36 | non | non | alignés | 15.7 / 30.8 | OFL 1.1 | Écartée : sans GSUB, dessin daté |
| charis-sil (statique 400, + italique) | 10/10 (latin-ext) | **oui** (latin-ext) | oui (latin) | 36/36 | non | non | alignés | 22.0 / 68.1 | OFL 1.1 | Écartée : latin-ext de 68 Ko par style, ton universitaire |
| cormorant (statique 400, + italique) | 10/10 (latin-ext) | **oui** (latin-ext) | oui (latin) | 36/36 | non | non | elzéviriens (+lnum) | 21.9 / 19.1 | OFL 1.1 | Version statique ; voir la ligne variable |
| cormorant (variable wght, + italique) | 10/10 (latin-ext) | **oui** (latin-ext) | oui (latin) | 36/36 | non | non | elzéviriens (+lnum) | 34.5 / 29.6 | OFL 1.1 | Écartée : doublon de Cormorant Garamond (formes plus maniérées) |
| cormorant-garamond (statique 400, + italique) | 10/10 (latin-ext) | **oui** (latin-ext) | oui (latin) | 36/36 | non | non | elzéviriens (+lnum) | 22.3 / 19.4 | OFL 1.1 | Version statique non embarquée (la version variable est retenue) |
| cormorant-garamond (variable wght, + italique) | 10/10 (latin-ext) | **oui** (latin-ext) | oui (latin) | 36/36 | non | non | elzéviriens (+lnum) | 36.8 / 32.9 | OFL 1.1 | **RETENUE (affichage)** |
| cormorant-infant (statique 400, + italique) | 10/10 (latin-ext) | **oui** (latin-ext) | oui (latin) | 36/36 | non | non | alignés | 21.1 / 17.7 | OFL 1.1 | Version statique ; voir la ligne variable |
| cormorant-infant (variable wght, + italique) | 10/10 (latin-ext) | **oui** (latin-ext) | oui (latin) | 36/36 | non | non | alignés | 34.8 / 29.7 | OFL 1.1 | Écartée : a/g « scolaires », chiffres alignés |
| cormorant-sc (statique 400) | 10/10 (latin-ext) | **oui** (latin-ext) | oui (latin) | 36/36 | non | non | elzéviriens (+lnum) | 20.4 / 18.8 | OFL 1.1 | Écartée : déliés trop fins pour des étiquettes de 12–13 px (essai visuel) |
| cormorant-unicase (statique 400) | 10/10 (latin-ext) | **oui** (latin-ext) | oui (latin) | 36/36 | non | non | elzéviriens (+lnum) | 20.6 / 19.3 | OFL 1.1 | Écartée : effet trop discret pour ~40 Ko de plus (essai visuel) |
| cormorant-upright (statique 400) | 10/10 (latin-ext) | **oui** (latin-ext) | oui (latin) | 36/36 | non | non | elzéviriens (+lnum) | 33.9 / 26.0 | OFL 1.1 | Écartée : pas de version variable, dessin trop fantaisie |
| crimson-pro (variable wght, + italique) | 10/10 (latin-ext) | **oui** (latin-ext) | oui (latin) | 36/36 | non | non | alignés | 47.1 / 37.1 | OFL 1.1 | Écartée : chiffres alignés seuls, pas de famille SC |
| crimson-text (statique 400, + italique) | 10/10 (latin-ext) | **oui** (latin-ext) | oui (latin) | 36/36 | non | non | alignés | 24.6 / 19.7 | OFL 1.1 | Écartée : remplacée par Crimson Pro |
| eb-garamond (statique 400, + italique) | 10/10 (latin-ext) | **oui** (latin-ext) | oui (latin) | 36/36 | non | non | alignés | 23.3 / 55.6 | OFL 1.1 | Version statique ; voir la ligne variable |
| eb-garamond (variable wght, + italique) | 10/10 (latin-ext) | **oui** (latin-ext) | oui (latin) | 36/36 | non | non | alignés | 43.3 / 111.3 | OFL 1.1 | Écartée : latin-ext de 111 Ko, chiffres alignés tabulaires, hauteur d'x faible (0,405) |
| faustina (variable wght, + italique) | 10/10 (latin-ext) | **oui** (latin-ext) | oui (latin) | 36/36 | non | non | alignés | 26.1 / 23.7 | OFL 1.1 | Écartée : éditoriale contemporaine |
| fraunces (variable wght, + italique) | 10/10 (latin-ext) | **oui** (latin-ext) | oui (latin) | 36/36 | non | non | alignés | 35.8 / 32.8 | OFL 1.1 | Écartée : ton « wonky » contemporain |
| gelasio (variable wght, + italique) | 10/10 (latin-ext) | **oui** (latin-ext) | oui (latin) | 36/36 | non | non | elzéviriens (+lnum) | 34.0 / 39.6 | OFL 1.1 | Écartée : clone métrique de Georgia ; sert de référence de repli |
| gentium-basic (statique 400, + italique) | 10/10 (latin-ext) | **oui** (latin-ext) | oui (latin) | 36/36 | non | non | alignés | 21.8 / 20.0 | non jointe au paquet (npm : MIT) | Écartée : version ancienne (paquet 4.5.7), sans GSUB |
| gentium-book-basic (statique 400, + italique) | 10/10 (latin-ext) | **oui** (latin-ext) | oui (latin) | 36/36 | non | non | alignés | 22.3 / 20.6 | OFL 1.1 | Écartée : version ancienne, sans GSUB |
| gentium-book-plus (statique 400, + italique) | 10/10 (latin-ext) | **oui** (latin-ext) | oui (latin) | 36/36 | non | non | alignés | 21.1 / 56.5 | OFL 1.1 | Écartée : latin-ext de 57 Ko par style, statique, U+0304 absent |
| gentium-plus (statique 400, + italique) | 10/10 (latin-ext) | **oui** (latin-ext) | oui (latin) | 36/36 | non | non | alignés | 22.2 / 67.0 | OFL 1.1 | Écartée : latin-ext de 67 Ko par style, statique |
| grenze-gotisch (variable wght) | 10/10 (latin-ext) | **oui** (latin-ext) | oui (latin) | 36/36 | non | non | elzéviriens (+lnum) | 41.3 / 30.6 | OFL 1.1 | Écartée : fraktur, lisibilité faible, connotation germanique |
| libertinus-serif (statique 400, + italique) | 10/10 (latin-ext) | **oui** (latin-ext) | oui (latin) | 36/36 | non | non | alignés | 22.9 / 62.7 | OFL 1.1 | Écartée : latin-ext de 63 Ko par style, sans GSUB |
| libre-baskerville (statique 400, + italique) | 10/10 (latin-ext) | **oui** (latin-ext) | oui (latin) | 36/36 | non | non | alignés | 19.6 / 20.8 | OFL 1.1 | Version statique ; voir la ligne variable |
| libre-baskerville (variable wght, + italique) | 10/10 (latin-ext) | **oui** (latin-ext) | oui (latin) | 36/36 | non | non | alignés | 33.1 / 34.6 | OFL 1.1 | Écartée : très large (peu de signes par ligne) |
| literata (variable wght, + italique) | 10/10 (latin-ext) | **oui** (latin-ext) | oui (latin) | 36/36 | non | non | alignés | 51.3 / 41.7 | OFL 1.1 | Solution de rechange pour la lecture (meilleure hauteur d'x ; mais chiffres alignés seuls, pas de famille SC) |
| newsreader (variable wght, + italique) | 10/10 (latin-ext) | **oui** (latin-ext) | oui (latin) | 36/36 | non | non | alignés | 56.7 / 35.4 | OFL 1.1 | Écartée : chiffres alignés tabulaires, espace fine absente |
| noto-serif (variable wght, + italique) | 10/10 (latin-ext) | **oui** (latin-ext) | oui (latin) | 36/36 | non | non | alignés | 35.9 / 182.2 | OFL 1.1 | Écartée : latin-ext de 182 Ko |
| old-standard-tt (statique 400, + italique) | 10/10 (latin-ext) | **oui** (latin-ext) | oui (latin) | 36/36 | non | non | alignés | 23.1 / 26.1 | OFL 1.1 | Écartée : Didone savante, trop frêle sur fond sombre |
| petrona (variable wght, + italique) | 10/10 (latin-ext) | **oui** (latin-ext) | oui (latin) | 36/36 | non | non | alignés | 42.9 / 34.0 | OFL 1.1 | Écartée : contemporaine, chiffres alignés |
| piazzolla (variable wght, + italique) | 10/10 (latin-ext) | **oui** (latin-ext) | oui (latin) | 36/36 | non | non | alignés | 31.1 / 24.4 | OFL 1.1 | Écartée : contemporaine, chiffres alignés |
| playfair (variable wght, + italique) | 10/10 (latin-ext) | **oui** (latin-ext) | oui (latin) | 36/36 | non | non | elzéviriens (+lnum) | 54.6 / 57.3 | OFL 1.1 | Écartée : contraste Didot, hors ambiance |
| roboto-serif (variable wght, + italique) | 10/10 (latin-ext) | **oui** (latin-ext) | oui (latin) | 36/36 | non | non | alignés (+lnum) | 64.6 / 48.7 | OFL 1.1 | Écartée : ton d'interface |
| spectral (statique 400, + italique) | 10/10 (latin-ext) | **oui** (latin-ext) | oui (latin) | 36/36 | non | non | alignés | 21.2 / 19.8 | OFL 1.1 | Écartée : statique seulement (6 fichiers pour 3 styles), chiffres alignés tabulaires |
| spectral-sc (statique 400, + italique) | 10/10 (latin-ext) | **oui** (latin-ext) | oui (latin) | 36/36 | non | non | alignés (+lnum) | 26.9 / 24.3 | OFL 1.1 | Écartée avec Spectral |
| texturina (variable wght, + italique) | 10/10 (latin-ext) | **oui** (latin-ext) | oui (latin) | 36/36 | non | non | elzéviriens (+lnum) | 49.9 / 34.5 | OFL 1.1 | Écartée : gothique de texte, lisibilité moindre |
| tinos (statique 400, + italique) | 10/10 (latin-ext) | **oui** (latin-ext) | oui (latin) | 36/36 | non | non | alignés | 17.4 / 74.6 | OFL 1.1 | Écartée : clone de Times ; sert de référence de repli |
| vollkorn (variable wght, + italique) | 10/10 (latin-ext) | **oui** (latin-ext) | oui (latin) | 36/36 | non | non | elzéviriens (+lnum) | 45.3 / 36.7 | OFL 1.1 | Écartée : gris de texte très sombre, « 1 » elzévirien confondu avec I (essai visuel) |
| vollkorn-sc (statique 400) | 10/10 (latin-ext) | **oui** (latin-ext) | oui (latin) | 36/36 | non | non | alignés | 22.9 / 26.0 | OFL 1.1 | Écartée : † et § absents |
| almendra (statique 400, + italique) | 10/10 (latin-ext) | **NON** | oui (latin) | 36/36 | non | non | elzéviriens | 11.9 / 6.6 | OFL 1.1 (RFN) | ÉLIMINÉE : ȳ/Ȳ absents du cmap |
| almendra-sc (statique 400) | 0/10 | **NON** | oui (latin) | 35/36 (manque …) | non | non | alignés | 11.2 / — | OFL 1.1 | ÉLIMINÉE : ȳ/Ȳ absents du cmap |
| baskervville (statique 400, + italique) | 10/10 (latin-ext) | **NON** | oui (latin) | 36/36 | non | non | elzéviriens (+lnum) | 17.7 / 9.3 | OFL 1.1 | ÉLIMINÉE : ȳ/Ȳ absents du cmap |
| baskervville (variable wght, + italique) | 10/10 (latin-ext) | **NON** | oui (latin) | 36/36 | non | non | elzéviriens (+lnum) | 30.7 / 15.3 | OFL 1.1 | ÉLIMINÉE : ȳ/Ȳ absents du cmap |
| baskervville-sc (statique 400) | 10/10 (latin-ext) | **NON** | oui (latin) | 36/36 | non | non | elzéviriens (+lnum) | 22.7 / 12.4 | OFL 1.1 | ÉLIMINÉE : ȳ/Ȳ absents du cmap |
| bellefair (statique 400) | 10/10 (latin-ext) | **NON** | oui (latin) | 36/36 | non | non | alignés | 16.1 / 11.1 | OFL 1.1 | ÉLIMINÉE : ȳ/Ȳ absents du cmap |
| bodoni-moda (variable wght, + italique) | 10/10 (latin-ext) | **NON** | oui (latin) | 36/36 | non | non | alignés | 25.3 / 13.8 | OFL 1.1 | ÉLIMINÉE : ȳ/Ȳ absents du cmap |
| castoro (statique 400, + italique) | 10/10 (latin-ext) | **NON** | oui (latin) | 36/36 | non | non | elzéviriens (+lnum) | 26.5 / 17.6 | OFL 1.1 | ÉLIMINÉE : ȳ/Ȳ absents du cmap |
| castoro-titling (statique 400) | 10/10 (latin-ext) | **NON** | oui (latin) | 36/36 | non | non | alignés | 18.1 / 10.2 | OFL 1.1 | ÉLIMINÉE : ȳ/Ȳ absents du cmap |
| cinzel (statique 400) | 10/10 (latin-ext) | **NON** | oui (latin) | 36/36 | non | non | alignés | 13.8 / 7.7 | OFL 1.1 | ÉLIMINÉE : ȳ/Ȳ absents du cmap |
| cinzel (variable wght) | 10/10 (latin-ext) | **NON** | oui (latin) | 36/36 | non | non | alignés | 25.3 / 14.2 | OFL 1.1 | ÉLIMINÉE : ȳ/Ȳ absents du cmap |
| cinzel-decorative (statique 400) | 10/10 (latin-ext) | **NON** | oui (latin) | 36/36 | non | non | elzéviriens | 14.1 / 7.8 | OFL 1.1 (RFN) | ÉLIMINÉE : ȳ/Ȳ absents du cmap |
| della-respira (statique 400) | 0/10 | **NON** | oui (latin) | 34/36 (manque ’…) | non | non | alignés | 15.9 / — | OFL 1.1 (RFN) | ÉLIMINÉE : ȳ/Ȳ absents du cmap |
| forum (statique 400) | 10/10 (latin-ext) | **NON** | oui (latin) | 36/36 | non | non | alignés | 23.3 / 20.1 | OFL 1.1 | ÉLIMINÉE : ȳ/Ȳ absents du cmap |
| gfs-didot (statique 400) | 0/10 | **NON** | oui (latin) | 36/36 | non | non | alignés (+lnum) | 14.2 / — | OFL 1.1 | ÉLIMINÉE : ȳ/Ȳ absents du cmap |
| goudy-bookletter-1911 (statique 400) | 0/10 | **NON** | oui (latin) | 36/36 | non | non | elzéviriens | 25.9 / — | OFL 1.1 | ÉLIMINÉE : ȳ/Ȳ absents du cmap |
| ibm-plex-serif (statique 400, + italique) | 10/10 (latin-ext) | **NON** | oui (latin) | 36/36 | non | non | alignés | 19.1 / 15.1 | OFL 1.1 | ÉLIMINÉE : ȳ/Ȳ absents du cmap |
| im-fell-double-pica (statique 400, + italique) | 0/10 | **NON** | oui (latin) | 36/36 | non | non | elzéviriens | 58.7 / — | OFL 1.1 | ÉLIMINÉE : ȳ/Ȳ absents du cmap |
| im-fell-dw-pica (statique 400, + italique) | 0/10 | **NON** | oui (latin) | 36/36 | non | non | elzéviriens | 61.1 / — | OFL 1.1 | ÉLIMINÉE : ȳ/Ȳ absents du cmap |
| im-fell-english (statique 400, + italique) | 0/10 | **NON** | oui (latin) | 36/36 | non | non | elzéviriens | 58.5 / — | OFL 1.1 | ÉLIMINÉE : ȳ/Ȳ absents du cmap |
| im-fell-english-sc (statique 400) | 0/10 | **NON** | oui (latin) | 36/36 | non | non | elzéviriens | 55.6 / — | OFL 1.1 | ÉLIMINÉE : ȳ/Ȳ absents du cmap |
| im-fell-french-canon (statique 400, + italique) | 0/10 | **NON** | oui (latin) | 36/36 | non | non | elzéviriens | 36.1 / — | OFL 1.1 | ÉLIMINÉE : ȳ/Ȳ absents du cmap |
| im-fell-great-primer (statique 400, + italique) | 0/10 | **NON** | oui (latin) | 36/36 | non | non | elzéviriens | 60.9 / — | OFL 1.1 | ÉLIMINÉE : ȳ/Ȳ absents du cmap |
| imbue (variable wght) | 10/10 (latin-ext) | ȳ seul | oui (latin) | 36/36 | non | non | alignés | 27.0 / 22.7 | OFL 1.1 | ÉLIMINÉE : ȳ présent mais Ȳ absent |
| italiana (statique 400) | 0/10 | **NON** | oui (latin) | 35/36 (manque œ) | non | non | elzéviriens | 9.9 / — | OFL 1.1 | ÉLIMINÉE : ȳ/Ȳ absents du cmap |
| jacquard-24 (statique 400) | 10/10 (latin-ext) | **NON** | oui (latin) | 36/36 | non | non | elzéviriens | 34.5 / 28.1 | OFL 1.1 | ÉLIMINÉE : ȳ/Ȳ absents du cmap |
| libre-caslon-display (statique 400) | 10/10 (latin-ext) | **NON** | oui (latin) | 36/36 | non | non | alignés | 23.7 / 15.9 | OFL 1.1 | ÉLIMINÉE : ȳ/Ȳ absents du cmap |
| libre-caslon-text (statique 400, + italique) | 10/10 (latin-ext) | **NON** | oui (latin) | 36/36 | non | non | alignés | 24.4 / 14.0 | OFL 1.1 | ÉLIMINÉE : ȳ/Ȳ absents du cmap |
| lora (variable wght, + italique) | 10/10 (latin-ext) | **NON** | oui (latin) | 36/36 | non | non | alignés | 36.9 / 19.6 | OFL 1.1 (RFN) | ÉLIMINÉE : ȳ/Ȳ absents du cmap |
| marcellus (statique 400) | 10/10 (latin-ext) | **NON** | oui (latin) | 36/36 | non | non | elzéviriens | 14.2 / 8.7 | OFL 1.1 (RFN) | ÉLIMINÉE : ȳ/Ȳ absents du cmap |
| marcellus-sc (statique 400) | 10/10 (latin-ext) | **NON** | oui (latin) | 36/36 | non | non | elzéviriens | 14.2 / 8.7 | OFL 1.1 (RFN) | ÉLIMINÉE : ȳ/Ȳ absents du cmap |
| metamorphous (statique 400) | 10/10 (latin-ext) | **NON** | oui (latin) | 36/36 | non | non | elzéviriens | 22.6 / 17.9 | OFL 1.1 (RFN) | ÉLIMINÉE : ȳ/Ȳ absents du cmap |
| pirata-one (statique 400) | 10/10 (latin-ext) | **NON** | oui (latin) | 36/36 | non | non | alignés | 8.7 / 6.2 | OFL 1.1 (RFN) | ÉLIMINÉE : ȳ/Ȳ absents du cmap |
| playfair-display (variable wght, + italique) | 10/10 (latin-ext) | **NON** | oui (latin) | 36/36 | non | non | elzéviriens (+lnum) | 37.5 / 20.6 | OFL 1.1 (RFN) | ÉLIMINÉE : ȳ/Ȳ absents du cmap |
| playfair-display-sc (statique 400, + italique) | 10/10 (latin-ext) | **NON** | oui (latin) | 36/36 | non | non | elzéviriens (+lnum) | 24.4 / 14.9 | OFL 1.1 (RFN) | ÉLIMINÉE : ȳ/Ȳ absents du cmap |
| sorts-mill-goudy (statique 400, + italique) | 10/10 (latin-ext) | **NON** | oui (latin) | 36/36 | non | non | elzéviriens (+lnum) | 22.3 / 10.0 | OFL 1.1 | ÉLIMINÉE : ȳ/Ȳ absents du cmap |
| source-serif-4 (variable wght, + italique) | 10/10 (latin-ext) | **NON** | oui (latin) | 36/36 | non | non | alignés | 49.7 / 41.2 | OFL 1.1 | ÉLIMINÉE : ȳ/Ȳ absents du cmap |
| stix-two-text (statique 400, + italique) | 10/10 (latin-ext) | **NON** | oui (latin) | 36/36 | non | non | alignés | 16.4 / 30.7 | OFL 1.1 | ÉLIMINÉE : ȳ/Ȳ absents du cmap |
| stix-two-text (variable wght, + italique) | 10/10 (latin-ext) | **NON** | oui (latin) | 36/36 | non | non | alignés | 27.9 / 53.8 | OFL 1.1 | ÉLIMINÉE : ȳ/Ȳ absents du cmap |
| trirong (statique 400, + italique) | 10/10 (latin-ext) | **NON** | oui (latin) | 36/36 | non | non | alignés | 20.2 / 21.2 | OFL 1.1 | ÉLIMINÉE : ȳ/Ȳ absents du cmap |
| uncial-antiqua (statique 400) | 10/10 (latin-ext) | **NON** | oui (latin) | 36/36 | non | non | elzéviriens | 19.4 / 9.8 | OFL 1.1 (RFN) | ÉLIMINÉE : ȳ/Ȳ absents du cmap |

Hors fontsource :

| Police | Résultat |
|---|---|
| Junicode | Absente de fontsource (`@fontsource/junicode` et `@fontsource-variable/junicode` : introuvables). Le seul paquet npm trouvé, `@typopro/web-junicode` 3.7.5, contient une version 0.7.8 tronquée : macrons, `ȳ`, `œ`, `’`, `—`, `…` absents, ni `onum` ni `smcp`, nom réservé. **Éliminée.** Junicode 2 (dépôt amont) n'a pas été mesurée. |

### Fichiers retenus, un par un

| Fichier | Macrons | ȳ Ȳ | ñ Ñ | Français | Chiffres | onum / smcp (GSUB) | lnum / tnum | Octets |
|---|---|---|---|---|---|---|---|---|
| `cormorant-garamond-latin-wght-normal.woff2` | — | — | oui | 36/36 | elzéviriens | non / non | 10/10 / 10/10 | 37 640 |
| `cormorant-garamond-latin-ext-wght-normal.woff2` | 10/10 | oui | — | — | — | non / non | — | 33 736 |
| `cormorant-garamond-latin-wght-italic.woff2` | — | — | oui | 36/36 | elzéviriens | non / non | 10/10 / 10/10 | 39 260 |
| `cormorant-garamond-latin-ext-wght-italic.woff2` | 10/10 | oui | — | — | — | non / non | — | 34 392 |
| `alegreya-latin-wght-normal.woff2` | — | — | oui | 36/36 | elzéviriens | non / non | 10/10 / 10/10 | 43 476 |
| `alegreya-latin-ext-wght-normal.woff2` | 10/10 | oui | — | — | — | non / non | — | 37 856 |
| `alegreya-latin-wght-italic.woff2` | — | — | oui | 36/36 | elzéviriens | non / non | 10/10 / 10/10 | 44 456 |
| `alegreya-latin-ext-wght-italic.woff2` | 10/10 | oui | — | — | — | non / non | — | 38 316 |
| `alegreya-sc-latin-500-normal.woff2` | — | — | oui | 36/36 | elzéviriens | non / non | 10/10 / 10/10 | 30 880 |
| `alegreya-sc-latin-ext-500-normal.woff2` | 10/10 | oui | — | — | — | non / non | — | 31 944 |

Tous les fichiers contiennent le crénage (`kern`) et le positionnement des diacritiques (`mark`, `mkmk`), ainsi que le macron combinant U+0304.

---

## 5. Décision argumentée

### 5.1 Affichage : Cormorant Garamond

- **Pourquoi.** Dessin de Garamond poussé vers le titrage : contraste fort, empattements en lame, capitales larges. En or sur noir, à grande taille, c'est la voix la plus noble du lot. L'italique est assez beau pour porter une épigraphe à lui seul.
- **Mesures.** Hauteur d'x 0,386 em, capitales 0,625 em, chasse moyenne 0,39 em. Chiffres elzéviriens par défaut, `lnum` et `tnum` actifs. Un fichier variable couvre les graisses 300 à 700 pour 37 Kio, contre 22 Kio par graisse en statique.
- **Limite assumée.** Petite hauteur d'x et déliés très fins : cette police ne descend **jamais sous 22 px** en bas de casse, et ne sert jamais au texte courant.
- **Cinzel, pourtant candidate naturelle, est éliminée** : `ȳ` et `Ȳ` sont absents du `cmap`, dans le sous-ensemble comme dans le fichier amont (version 2.000). Dans Chromium, le moteur recompose `Ȳ` à partir de `Y` et du macron combinant de Cinzel, et le résultat est correct ; mais ce comportement n'a pas pu être vérifié dans Firefox ni Safari, et il ne constitue donc pas un repli garanti. Même verdict pour Marcellus (repli visible sur une police système) et Forum (macron mal placé).
- **Variantes Cormorant écartées.** Cormorant SC : déliés trop fins à 12–13 px. Cormorant Unicase : effet trop discret pour environ 40 Kio de plus. Cormorant, Infant, Upright : doublons.

### 5.2 Lecture : Alegreya

- **Pourquoi.** Police conçue pour la littérature : rythme calligraphique, contraste modéré, italique franc. Elle tient sur fond sombre sans que les déliés disparaissent, et son caractère « manuscrit humaniste » sert l'ambiance de bibliothèque mieux qu'une police de liseuse.
- **Mesures.** Hauteur d'x 0,456 em (rapport x/capitale 0,71), chasse moyenne 0,41 em, soit environ 68 signes par ligne pleine pour une colonne de 29 em. Chiffres elzéviriens par défaut ; `lnum` et `tnum` actifs. Variable de 400 à 900 : le gras (700) ne coûte aucun fichier de plus.
- **Ce qui l'a départagée de Literata.** Literata a la meilleure hauteur d'x mesurée (0,507 em) et reste la solution de rechange si des tests de lecture le réclament. Mais ses fichiers fontsource n'offrent que des chiffres alignés et aucune famille de petites capitales, et le couple pèse 93 Kio en romain contre 79 Kio. Alegreya donne un système complet avec les seuls fichiers disponibles.
- **Compensation.** La hauteur d'x plus modeste d'Alegreya se compense par le corps : 18 px au minimum sur mobile, 21 px sur grand écran.

### 5.3 Étiquettes : Alegreya SC

- **Pourquoi.** Vraies petites capitales dessinées, de la même main que le texte, assez robustes à 12–13 px (comparaison visuelle avec Cormorant SC, nettement trop maigre à ce corps). Hauteur des petites capitales : 0,504 em.
- **Une seule graisse (500), pas d'italique** : c'est une voix d'étiquetage, pas de texte.
- Chiffres elzéviriens par défaut, à la hauteur des petites capitales : les dates (`129–131 AC`) se fondent dans l'étiquette.

### 5.4 Budget

371 956 octets pour dix fichiers, soit 62 % du plafond de 600 Ko. Chemin critique d'une page en valyrien : quatre fichiers (Alegreya romain et Cormorant Garamond romain, `latin` + `latin-ext`), 152 708 octets. Les italiques et Alegreya SC ne sont téléchargés que si la page les emploie.

---

## 6. Piles de repli

```css
:root {
  --font-display: 'Cormorant Garamond', 'Cormorant Garamond Fallback', 'Times New Roman', Times, serif;
  --font-text:    'Alegreya', 'Alegreya Fallback', 'Alegreya Fallback Times', Georgia, 'Times New Roman', serif;
  --font-label:   'Alegreya SC', 'Alegreya', 'Alegreya Fallback', Georgia, serif;
}
```

- Les familles « Fallback » sont déclarées dans `fonts.css`. Elles pointent vers une police du système (`local()`) et en corrigent la chasse et les métriques verticales, pour que le passage à la police web ne déplace pas le texte.
- Coefficients mesurés dans Chromium sur un même texte de 440 signes (valyrien, français, anglais) :

| Famille de repli | Police locale | `size-adjust` | `ascent-override` | `descent-override` | Écart de largeur restant |
|---|---|---|---|---|---|
| `Cormorant Garamond Fallback` | Times New Roman (mesuré sur Liberation Serif) | 96,8 % | 95,5 % | 29,6 % | 0,03 % |
| `Alegreya Fallback Times` | Times New Roman (mesuré sur Liberation Serif) | 100,4 % | 101,2 % | 34,4 % | −0,05 % |
| `Alegreya Fallback` | Georgia (estimé sur Gelasio) | 91,7 % | 110,8 % | 37,6 % | non mesurable ici |

- **Pas de repli silencieux pour `ȳ`.** Les polices retenues contiennent tous les caractères obligatoires : le repli ne joue que pendant le chargement ou si un fichier manque. La présence de `ȳ` dans Georgia et Times New Roman n'a pas été vérifiée.
- `--font-label` retombe sur Alegreya (bas de casse ordinaire) : l'étiquette reste lisible, sans petites capitales.

---

## 7. Échelle typographique

Tailles fluides entre 360 px et 1440 px de largeur de fenêtre (1 rem = 16 px). Chaque formule garde une part en `rem` : le zoom du navigateur continue d'agir, et aucun rapport maximum/minimum ne dépasse 2,5.

```css
:root {
  --fs-label:       clamp(0.75rem,  0.7292rem + 0.0926vw, 0.8125rem);  /* 12 → 13 px  */
  --fs-small:       clamp(0.875rem, 0.8438rem + 0.1389vw, 0.9688rem);  /* 14 → 15,5 px */
  --fs-body:        clamp(1.125rem, 1.0625rem + 0.2778vw, 1.3125rem);  /* 18 → 21 px  */
  --fs-lead:        clamp(1.3125rem, 1.2083rem + 0.463vw, 1.625rem);   /* 21 → 26 px  */
  --fs-h4:          clamp(1.375rem, 1.25rem + 0.5556vw, 1.75rem);      /* 22 → 28 px  */
  --fs-h3:          clamp(1.625rem, 1.4167rem + 0.9259vw, 2.25rem);    /* 26 → 36 px  */
  --fs-h2:          clamp(2rem,     1.5833rem + 1.8519vw, 3.25rem);    /* 32 → 52 px  */
  --fs-h1:          clamp(2.5rem,   1.75rem + 3.3333vw, 4.75rem);      /* 40 → 76 px  */
  --fs-hero:        clamp(3rem,     1.5rem + 6.6667vw, 7.5rem);        /* 48 → 120 px */
  --fs-inscription: clamp(0.875rem, 0.7917rem + 0.3704vw, 1.125rem);   /* 14 → 18 px  */
}
```

| Niveau | Police | Taille | Graisse | Interlignage | Interlettrage | Remarques |
|---|---|---|---|---|---|---|
| Héros (ouverture, portail) | Cormorant Garamond | `--fs-hero` | 400 (300 au-dessus de 96 px) | 1,02 | −0,012 em | `text-wrap: balance` |
| Titre 1 | Cormorant Garamond | `--fs-h1` | 500 | 1,08 | −0,008 em | or ancien |
| Titre 2 | Cormorant Garamond | `--fs-h2` | 500 | 1,12 | 0 | |
| Titre 3 | Cormorant Garamond | `--fs-h3` | 600 | 1,2 | 0 | |
| Titre 4 | Cormorant Garamond | `--fs-h4` | 700 | 1,25 | 0 | plancher de la police d'affichage |
| Épigraphe | Cormorant Garamond italique | `--fs-h3` | 500 | 1,3 | 0 | devises, citations |
| Inscription | Cormorant Garamond, capitales | `--fs-inscription` | 600 | 1,5 | 0,24 em | chiffres alignés, ligatures coupées |
| Chapô | Alegreya | `--fs-lead` | 400 | 1,5 | 0 | 30 em au plus |
| Texte courant | Alegreya | `--fs-body` | 400 (gras : 700) | 1,6 | 0 | 29 em au plus |
| Notes, légendes, tableaux | Alegreya | `--fs-small` | 400 | 1,5 | 0 | |
| Étiquette | Alegreya SC | `--fs-label` | 500 | 1,4 | 0,12 em | `text-transform: lowercase` pour tout mettre en petites capitales |

Résultat mesuré au rendu avec ces valeurs : à 1440 px, texte de 21 px, colonne de 609 px, 68 signes par ligne pleine ; à 360 px, texte de 18 px, colonne de 320 px, environ 40 signes par ligne, aucun débordement horizontal.

### Longueur de ligne

- Texte courant : `max-inline-size: 29em` (cible 60 à 70 signes). Ne pas raisonner en `ch` : l'unité `ch` vaut 0,533 em dans Alegreya (chasse du zéro), bien plus que la chasse moyenne (0,41 em) ; `66ch` donnerait des lignes de 85 signes.
- Chapô : 30 em. Notes : 34 em. Titres : 18 em, avec `text-wrap: balance`.
- Sur mobile, marges latérales de 20 px au moins.

### Interlignage

- Sommet des capitales accentuées et bas des descendantes mesurés : Alegreya de +0,846 em (`Ê`) à −0,242 em (`g`) ; Cormorant Garamond de +0,788 em à −0,281 em. Capitales à macron : +0,778 em (Alegreya), +0,750 em (Cormorant Garamond).
- **Planchers** : jamais moins de 1,02 pour un titre d'une ligne, 1,08 pour un titre sur plusieurs lignes en bas de casse, 1,15 pour tout bloc en Alegreya. En dessous, un macron de capitale touche une descendante de la ligne précédente.

### Réglages communs

```css
html { font-synthesis-small-caps: none; text-size-adjust: 100%; }
body {
  font-family: var(--font-text); font-size: var(--fs-body); line-height: 1.6; font-weight: 400;
  font-kerning: normal; font-variant-ligatures: common-ligatures;
  font-variant-numeric: oldstyle-nums proportional-nums;
}
.label { font: 500 var(--fs-label)/1.4 var(--font-label); letter-spacing: .12em; text-transform: lowercase; font-synthesis: none; }
.inscription {
  font: 600 var(--fs-inscription)/1.5 var(--font-display); text-transform: uppercase; letter-spacing: .24em;
  margin-inline-end: -.24em; font-variant-numeric: lining-nums; font-feature-settings: "liga" 0, "calt" 0;
}
table { font-variant-numeric: lining-nums tabular-nums; }
sup { font-size: .7em; line-height: 0; vertical-align: baseline; position: relative; top: -.42em; }
```

---

## 8. Règles d'usage

### Capitales et interlettrage

- Les capitales composées en ligne (inscriptions, surtitres) sont **toujours interlettrées** : 0,2 à 0,3 em pour Cormorant Garamond, 0,08 à 0,14 em pour Alegreya SC. Compenser l'espace final par une marge négative de même valeur.
- Le bas de casse n'est **jamais** interlettré, sauf le resserrement léger des très grands titres (−0,008 à −0,012 em).
- Pas plus de deux lignes en capitales. Jamais de paragraphe en capitales.
- Ligatures coupées dès qu'un texte est interlettré.
- Accents et macrons obligatoires sur les capitales, en français comme en valyrien (`É`, `À`, `Ç`, `Œ`, `Ā`, `Ȳ`).

### Graisses de la police d'affichage

- 300 : réservé au-dessus de 96 px. 400–500 : de 40 à 96 px. 600 : de 26 à 40 px et capitales interlettrées. 700 : de 22 à 26 px.
- Sous 22 px, passer à Alegreya ou Alegreya SC.
- Sur fond sombre, ne pas descendre sous un contraste de 4,5:1 pour le texte et 3:1 pour les titres de plus de 24 px. Les effets (dégradé d'or, lueur) sont réservés aux titres de 32 px et plus, et ne doivent pas faire disparaître les déliés.

### Chiffres

- Texte courant, étiquettes, titres en bas de casse : elzéviriens (réglage par défaut des trois familles).
- Tableaux, chronologies alignées, compteurs : `font-variant-numeric: lining-nums tabular-nums`.
- Texte tout en capitales : `lining-nums`.
- Numéros de règne en capitales romaines (`Aegon II`) ; siècles en petites capitales (`.label` ou Alegreya SC).
- Ordinaux avec `<sup>` (`I<sup>er</sup>`), jamais avec `ᵉ ʳ`.

### Petites capitales

- Uniquement par la famille `'Alegreya SC'`. `font-variant-caps: small-caps` est interdit : la fonctionnalité `smcp` est absente des fichiers et le navigateur fabriquerait des capitales réduites, plus maigres. `font-synthesis-small-caps: none` sur `html` neutralise l'erreur (vérifié dans Chromium).
- `font-synthesis: none` sur tout élément en Alegreya SC : une seule graisse, pas d'italique, donc pas de faux gras ni de faux italique.

### Français

- Apostrophe typographique `’`, guillemets `« »`, points de suspension `…`, tiret d'incise `—`, tiret d'intervalle `–` (`129–131`).
- Espace insécable (U+00A0) avant `:` et à l'intérieur des guillemets ; espace fine insécable (U+202F) avant `;`, `!`, `?` et comme séparateur de milliers. U+202F n'a pas de glyphe dans les polices, mais Chromium la rend correctement ; à contrôler dans Firefox et Safari, et à remplacer par U+00A0 en cas de défaut.
- `lang="fr"` et `lang="en"` sur les blocs traduits, avec `hyphens: auto` (césure vérifiée en français dans Chromium).

---

## 9. Règles pour le haut valyrien

1. **Alphabet** (d'après l'article « Valyrian languages » de Wikipédia ; l'agent 04 fait foi). Latin à macrons : voyelles `a e i o u y`, longues `ā ē ī ō ū ȳ` ; consonnes `b d g gh h j k l lj m n ñ p q r rh s t v z`. Les digrammes `gh`, `rh`, `lj` sont deux lettres ordinaires (aucune ligature).
2. **Codage.** Caractères précomposés, forme NFC : `ȳ` = U+0233, `Ȳ` = U+0232, `ā` = U+0101, etc. Normaliser tout contenu importé (`texte.normalize('NFC')`). Les suites décomposées (`y` + U+0304) s'affichent correctement dans Chromium, mais ne doivent pas entrer dans les données.
3. **Interdits.** Remplacer `ȳ` par `ÿ`, `ý` ou `ŷ` ; remplacer `ñ` par `n` ; supprimer les macrons « pour simplifier » : la longueur vocalique distingue des mots.
4. **Capitales.** Le macron se conserve toujours : `Ā Ē Ī Ō Ū Ȳ`. `text-transform: uppercase` les produit correctement (`Sȳz` devient `SȲZ`, vérifié). Les six capitales existent dans les trois familles, y compris en italique.
5. **Petites capitales.** Alegreya SC contient les douze caractères à macron ; `ȳ` y a une forme de petite capitale sans descendante.
6. **Interlignage.** Respecter les planchers de la section 7 : les macrons de capitales montent à 0,75–0,78 em.
7. **Langue.** Il n'existe pas de code ISO pour le haut valyrien : utiliser `lang="art-x-valyrian"` (langue construite, sous-étiquette privée). Pas de dictionnaire de césure : `hyphens: manual`, et `overflow-wrap: break-word` comme filet de sécurité sur mobile.
8. **Italique.** Dans un texte français ou anglais, un mot valyrien cité est en italique et porte `lang="art-x-valyrian"`. Quand l'interface entière est en valyrien, il est en romain.
9. **Recherche et tri.** L'affichage garde toujours les macrons ; la recherche doit en revanche accepter une saisie sans macron (comparaison sur une forme décomposée privée de U+0304). À traiter par les agents 09 et 11.
10. **Exactitude.** Les phrases valyriennes des spécimens de test ne sont pas validées : seul le lexique de l'agent 04 fait foi.

---

## 10. Inscriptions décoratives, sans faux glyphes

- Une inscription est **toujours un vrai texte** : du haut valyrien validé par l'agent 04, en alphabet latin, composé en capitales Cormorant Garamond (graisse 600, interlettrage 0,2 à 0,3 em), mots séparés par un point médian `·` (U+00B7, présent dans les polices) à la manière de l'épigraphie romaine.
- Le texte reste sélectionnable, lisible par un lecteur d'écran et porte son attribut `lang`.
- **Les ornements sont des dessins SVG** (filets, fleurons, sceau, motifs de bordure), marqués `aria-hidden="true"`. Aucun caractère de fleuron : les polices n'en contiennent pas et le navigateur irait chercher un glyphe système.
- **Sont interdits** : toute pseudo-écriture (traits imitant des lettres ou des idéogrammes), tout glyphe « valyrien » inventé, toute reprise des glyphes dessinés pour la série télévisée, toute police « fantasy » imitant un logo.
- Un motif abstrait (écailles, flammes, géométrie) est permis s'il ne peut pas être pris pour une écriture.
- L'effet de gravure ou de dorure s'obtient par la couleur, un dégradé, une ombre portée légère : jamais en déformant les lettres.

---

## 11. Écritures « valyriennes » : résultat de la recherche

**Conclusion : rien n'est exploitable légalement. Le site n'emploie aucune écriture valyrienne.**

Ce qui a été établi :

- **Dans les romans**, le valyrien s'écrit en « glyphes ». David J. Peterson écrivait en 2015 que ce système est « clairement fondé sur des glyphes (comme le chinois) d'après les textes de GRRM », et qu'il n'avait « pas encore de nouvelles » sur la création d'une écriture (commentaires du billet « Valahd? », dothraki.com, 15 juin 2015).
- **Pour *Game of Thrones***, aucune écriture n'a été créée : les accessoires montrent du valyrien en alphabet latin (article « Valyrian languages » de Wikipédia, qui cite Peterson).
- **Pour *House of the Dragon***, Peterson a créé un système d'écriture, annoncé sur Instagram le 21 août 2022 selon Wikipédia. C'est une écriture mixte : glyphes logographiques, glyphes « paradigmatiques » (flexion) et glyphes alphabétiques.
- **Ce qui est public** : des glyphes isolés montrés par Peterson sur Instagram, par exemple celui de « vague » (*pelar*) relayé par Wiki of Thrones. Aucune source consultée ne mentionne de police officielle, de tableau complet ni de licence.
- **Omniglot** présente un tableau « High Valyrian script » repris d'un wiki de fans et renvoie vers une « High Valyrian font » : provenance et licence non indiquées, lien non vérifié. Inutilisable.
- **Les polices « House of the Dragon »** des sites de polices gratuites sont des alphabets latins imitant le logo. Celle de FontSpace (Måns Grebäck) est marquée « Freeware, Non-Commercial », « PERSONAL USE ONLY ». Inutilisables.

Ce qui n'a pas été vérifié : la publication Instagram d'origine (non consultée directement) ; l'identité du titulaire des droits sur les glyphes de la série (vraisemblablement le studio, sans confirmation) ; l'existence d'une police non officielle sous licence libre, dont aucune trace n'a été trouvée.

Sources consultées le 13 novembre 2026 :

- https://en.wikipedia.org/wiki/Valyrian_languages
- https://dothraki.com/?p=1716
- https://wikiofthrones.com/game-of-thrones-language-creator-reveals-a-new-high-valyrian-symbol
- https://omniglot.com/conscripts/highvalyrian.htm
- https://gameofthrones.fandom.com/wiki/High_Valyrian
- https://www.fontspace.com/house-of-the-dragon-font-f71074

---

## 12. Chargement

- Lier `assets/fonts/fonts.css` avant les autres feuilles de style. `font-display: swap` : le texte s'affiche tout de suite dans la police de repli ajustée.
- Précharger les quatre fichiers du chemin critique :

```html
<link rel="preload" as="font" type="font/woff2" crossorigin href="assets/fonts/alegreya-latin-wght-normal.woff2">
<link rel="preload" as="font" type="font/woff2" crossorigin href="assets/fonts/alegreya-latin-ext-wght-normal.woff2">
<link rel="preload" as="font" type="font/woff2" crossorigin href="assets/fonts/cormorant-garamond-latin-wght-normal.woff2">
<link rel="preload" as="font" type="font/woff2" crossorigin href="assets/fonts/cormorant-garamond-latin-ext-wght-normal.woff2">
```

- Hors ligne : les polices se chargent depuis `file://` dans Chromium sans option particulière, même depuis un autre dossier que la page (vérifié). Firefox restreint par défaut les fichiers locaux au dossier de la page et à ses sous-dossiers : non testé ici, à contrôler si le site est ouvert par double-clic plutôt que par un serveur local.

---

## 13. Limites

- Rendu vérifié dans **Chromium seulement** (Linux). Firefox, Safari, Windows (ClearType) et macOS ne sont pas testés.
- Les coefficients de repli pour Georgia sont estimés sur Gelasio, et ceux de Times New Roman mesurés sur Liberation Serif.
- La lisibilité a été jugée sur spécimens par l'agent, sans test de lecture avec des personnes.
- La mesure porte sur les paquets fontsource 5.3.0 du jour. Une mise à jour peut changer les sous-ensembles.
- Les contrastes de couleur dépendent de la palette de l'agent 07 et n'ont pas été mesurés.
- Junicode 2 n'a pas été mesurée.

## 14. Propositions

1. **Sous-ensembles sur mesure.** Les fichiers amont d'Alegreya et de Cormorant Garamond contiennent `smcp`, `c2sc` et `onum`. Un découpage maison (`pyftsubset`) limité aux caractères utiles rétablirait de vraies petites capitales dans la famille de texte et rendrait Alegreya SC inutile. L'OFL le permet, sans changement de nom puisqu'aucun nom n'est réservé. Gain estimé de 30 à 40 Kio, non mesuré.
2. **Test de lecture** Alegreya contre Literata sur un chapitre long, sur téléphone, avant la version 1.
3. **Contrôle multi-navigateur** (Firefox, Safari) de `ȳ`, de U+202F et du chargement en `file://`.
4. **Sceau et ornements en SVG** à dessiner par l'agent 07, dans le respect de la section 10.
5. **Contrôle automatique des contenus** : refuser tout texte valyrien non NFC ou contenant `ÿ`, `ý`, `ŷ` (agent 11).
