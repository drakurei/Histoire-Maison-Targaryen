# Rapport de l'agent 08 — Typographie et identité

Tâche B2 — Étude typographique : polices, licences, couverture des glyphes. 13 novembre 2026.

## 1. Résultat

| Voix | `font-family` | Fichiers | Octets |
|---|---|---|---|
| Affichage | `'Cormorant Garamond'` — variable 300–700, romain + italique | 4 | 145 028 |
| Lecture | `'Alegreya'` — variable 400–900, romain + italique | 4 | 164 104 |
| Étiquettes | `'Alegreya SC'` — statique 500 | 2 | 62 824 |
| **Total** | | **10** | **371 956 (363 Kio)** |

- Licence : SIL OFL 1.1 pour les trois, sans nom réservé.
- `ȳ` et `Ȳ` : présents dans les trois familles (sous-ensemble `latin-ext`), romain et italique ; rendu confirmé dans Chromium sans repli.
- Écritures valyriennes : rien d'exploitable légalement ; le site reste en alphabet latin à macrons.

## 2. Livrables

| Chemin | Contenu |
|---|---|
| `documentation/design/typographie.md` | Étude complète : tableau de couverture (91 paquets), décision, piles de repli, échelle fluide, règles d'usage, règles pour le valyrien, inscriptions, recherche sur les écritures valyriennes |
| `assets/fonts/*.woff2` | Dix fichiers, copiés sans modification depuis les paquets npm |
| `assets/fonts/fonts.css` | 10 règles `@font-face` (police web, `font-display: swap`, `unicode-range` de fontsource) + 6 règles de repli ajusté (`local()`) |
| `assets/fonts/LICENSES.md` | Version, auteur, licence, source, empreinte SHA-256 de chaque fichier |
| `assets/fonts/licenses/` | Trois textes OFL, tels que fournis dans les paquets |
| `reports/agent-reports/agent-08-typographie.md` | Ce rapport |

Rien d'autre n'a été écrit dans le projet. Le dossier temporaire `/tmp/agent08` a été supprimé ; les scripts de mesure sont reproduits en annexe.

## 3. Méthode

1. **Installation** de 91 paquets fontsource (83 familles distinctes) dans `/tmp/agent08/pkgs`, sans exécution de scripts d'installation. Six paquets demandés n'existent pas : `@fontsource/junicode`, `@fontsource-variable/junicode`, `@fontsource-variable/cormorant-sc`, `@fontsource-variable/cormorant-unicase`, `@fontsource-variable/alegreya-sans`, `@fontsource/trajan-pro`.
2. **Mesure du `cmap` et du `GSUB`** de 395 fichiers woff2 avec fontTools 4.67.0 (script `measure.py`).
3. **Mesure des contours** pour la sélection restreinte de 35 polices : style des chiffres par défaut, hauteur d'x, hauteur de capitale, chasse moyenne, caractères complémentaires (script `metrics.py`).
4. **Contrôle amont** : téléchargement de dix fichiers TTF complets depuis `raw.githubusercontent.com/google/fonts` pour distinguer « absent de la police » et « supprimé par le découpage ».
5. **Spécimens** rendus dans Google Chrome sans interface, sur fond noir, avec du valyrien, du français et de l'anglais ; lecture des captures.
6. **Vérification du livrable** : une page de test liée au vrai `fonts.css` du projet, pilotée par Playwright 1.63 ; pour chaque nœud, la commande `CSS.getPlatformFontsForNode` du protocole de débogage indique quelle police dessine réellement les glyphes.
7. **Licences** : lecture du fichier `LICENSE` de chaque paquet, comparaison avec `OFL.txt` du dépôt `google/fonts`.
8. **Recherche** sur les écritures valyriennes : six pages consultées (liste dans l'étude, section 11).

## 4. Commandes de mesure

```bash
# Préparation
mkdir -p /tmp/agent08/pkgs /tmp/agent08/scripts && cd /tmp/agent08/pkgs && npm init -y
pip install fonttools brotli --break-system-packages
npm install --ignore-scripts --no-audit --no-fund @fontsource-variable/cormorant-garamond @fontsource-variable/alegreya @fontsource/alegreya-sc   # … et 88 autres paquets

# Couverture cmap et fonctionnalités GSUB de tous les paquets
python3 -I scripts/measure.py pkgs/node_modules --json measure.json > measure.txt

# Chiffres par défaut, hauteur d'x, chasse, caractères complémentaires
python3 -I scripts/metrics.py pkgs/node_modules @fontsource-variable/cormorant-garamond @fontsource-variable/alegreya @fontsource/alegreya-sc …

# Vérification détaillée des dix fichiers retenus (couverture, lnum/tnum, métriques verticales, SHA-256)
python3 -I scripts/verify_retained.py /home/claude/TARGARYEN-CHRONICLES/assets/fonts

# Tableau Markdown de l'étude
python3 -I scripts/table.py measure.json pkgs/node_modules > table.md

# Contrôle amont (exemple)
curl -sS -o cinzel.ttf 'https://raw.githubusercontent.com/google/fonts/main/ofl/cinzel/Cinzel%5Bwght%5D.ttf'

# Rendu et interrogation du moteur
google-chrome --headless=new --no-sandbox --screenshot=display.png file:///tmp/agent08/specimen/display.html
node run.mjs    # Playwright + CDP : CSS.getPlatformFontsForNode sur chaque cas de test
```

Vérification minimale, sans les scripts :

```python
from fontTools.ttLib import TTFont
f = TTFont("assets/fonts/alegreya-latin-ext-wght-normal.woff2")
cmap = f.getBestCmap()
print(0x0233 in cmap, 0x0232 in cmap)          # ȳ, Ȳ → True True
print(sorted({r.FeatureTag for r in f["GSUB"].table.FeatureList.FeatureRecord}))
```

## 5. Résultats

### 5.1 Couverture

- **`ȳ Ȳ`** : 45 familles sur 83 couvrent la paire ; 38 non. Toujours dans `latin-ext`.
- **Macrons `ā ē ī ō ū` et capitales** : dans `latin-ext` ; absents des IM Fell, de Della Respira, d'Italiana, de Goudy Bookletter 1911, de GFS Didot et d'Almendra SC, qui n'ont pas de sous-ensemble `latin-ext`.
- **`ñ Ñ`, français, chiffres** : dans `latin` pour tous. Manques : `œ` dans Italiana ; `’` et `…` dans Della Respira ; `…` dans Almendra SC.
- **`onum`, `smcp`, `c2sc`** : absents des 395 fichiers. Présents dans les fichiers amont d'Alegreya 2.009, Cormorant Garamond 4.001, Literata 3.103 et EB Garamond 1.003.
- **Chiffres par défaut elzéviriens** : familles Cormorant (sauf Infant), Alegreya, Alegreya SC, Vollkorn, Gelasio, Bona Nova SC, Playfair, IM Fell, entre autres. Alignés : Literata, Spectral, EB Garamond, Crimson Pro, Newsreader, Source Serif 4, Cinzel.

### 5.2 Fichiers retenus (sortie de `verify_retained.py`, résumée)

| Fichier | Glyphes | Macrons | ȳ Ȳ | ñ Ñ | Français | `lnum` | `tnum` | Octets |
|---|---|---|---|---|---|---|---|---|
| cormorant-garamond-latin-wght-normal | 373 | 0 | — | 2/2 | 36/36 | 10/10 | 10/10 | 37 640 |
| cormorant-garamond-latin-ext-wght-normal | 350 | 10/10 | 2/2 | — | — | — | — | 33 736 |
| cormorant-garamond-latin-wght-italic | 374 | 0 | — | 2/2 | 36/36 | 10/10 | 10/10 | 39 260 |
| cormorant-garamond-latin-ext-wght-italic | 342 | 10/10 | 2/2 | — | — | — | — | 34 392 |
| alegreya-latin-wght-normal | 349 | 0 | — | 2/2 | 36/36 | 10/10 | 10/10 | 43 476 |
| alegreya-latin-ext-wght-normal | 450 | 10/10 | 2/2 | — | — | — | — | 37 856 |
| alegreya-latin-wght-italic | 349 | 0 | — | 2/2 | 36/36 | 10/10 | 10/10 | 44 456 |
| alegreya-latin-ext-wght-italic | 458 | 10/10 | 2/2 | — | — | — | — | 38 316 |
| alegreya-sc-latin-500-normal | 340 | 0 | — | 2/2 | 36/36 | 10/10 | 10/10 | 30 880 |
| alegreya-sc-latin-ext-500-normal | 406 | 10/10 | 2/2 | — | — | — | — | 31 944 |

Métriques : Cormorant Garamond — hauteur d'x 0,386 em, capitale 0,625 em, ascendante/descendante 0,924/−0,287 ; Alegreya — hauteur d'x 0,456 em, capitale 0,646 em, 1,016/−0,345 ; Alegreya SC — petite capitale 0,504 em.

### 5.3 Vérification au rendu (Chromium)

| Test | Résultat |
|---|---|
| 42 cas : 3 familles × graisses × styles × (valyrien, français) | 42 rendus par la seule police web, 0 repli |
| Fichiers chargés par la page de test complète | les 10, aucun échec |
| Page française sans macron | 3 fichiers `latin` seulement |
| `lining-nums` | actif sur les trois familles (contrôle visuel) |
| `tabular-nums` | `1111111111` et `0000000000` de même largeur (Alegreya 180 px, Cormorant Garamond 196,4 px à 40 px) |
| `text-transform: uppercase` sur `Sȳz Ȳdragon` | `SȲZ ȲDRAGON`, macrons conservés |
| U+202F (espace fine insécable) | rendue par la police web, plus étroite que U+2009 et U+00A0 |
| `ᵉ ʳ № ‡ ❦` en Alegreya | repli sur Liberation Serif et DejaVu Sans : à proscrire |
| `font-variant-caps: small-caps` sur Alegreya | petites capitales synthétisées ; neutralisées par `font-synthesis-small-caps: none` |
| Repli ajusté, écart de largeur sur 440 signes | Alegreya / Times : −0,05 % ; Cormorant Garamond / Times : 0,03 % |
| Échelle fluide | 1440 px : texte 21 px, 68 signes par ligne pleine ; 360 px : texte 18 px, environ 40 signes, pas de débordement |
| Chargement en `file://` sans option | les 10 polices chargées |

### 5.4 Licences

Les trois textes `LICENSE` des paquets ont un corps identique à l'`OFL.txt` amont. Aucun nom réservé dans les en-têtes. Onze paquets parmi les candidats déclarent un nom réservé (Almendra, Cinzel Decorative, Della Respira, Lora, Marcellus, Marcellus SC, Metamorphous, Pirata One, Playfair Display, Playfair Display SC, Uncial Antiqua) : aucun n'est retenu.

## 6. Polices éliminées et pourquoi

**Éliminées pour absence de `ȳ` ou `Ȳ` (38 familles)** : Almendra, Almendra SC, Baskervville, Baskervville SC, Bellefair, Bodoni Moda, Castoro, Castoro Titling, Cinzel, Cinzel Decorative, Della Respira, Forum, GFS Didot, Goudy Bookletter 1911, IBM Plex Serif, IM Fell (Double Pica, DW Pica, English, English SC, French Canon, Great Primer), Imbue (`ȳ` sans `Ȳ`), Italiana, Jacquard 24, Libre Caslon Display, Libre Caslon Text, Lora, Marcellus, Marcellus SC, Metamorphous, Pirata One, Playfair Display, Playfair Display SC, Sorts Mill Goudy, Source Serif 4, STIX Two Text, Trirong, Uncial Antiqua.

Précisions sur les candidats imposés :

| Police | Constat | Verdict |
|---|---|---|
| Cinzel | `ȳ Ȳ` absents du sous-ensemble et du fichier amont 2.000. Chromium recompose le glyphe avec le macron combinant de la police (rendu correct), comportement non vérifié ailleurs. | Éliminée |
| Cinzel Decorative | `ȳ Ȳ` absents (amont compris), pas de U+0304, nom réservé. Repli visible. | Éliminée |
| Marcellus, Marcellus SC | `ȳ Ȳ` absents (amont compris). Repli visible sur une police système. | Éliminées |
| Forum | `ȳ Ȳ` absents (amont compris). Macron recomposé mais mal placé. | Éliminée |
| IM Fell | Pas de `latin-ext` : aucun macron. 36 à 61 Kio par fichier. | Éliminées |
| Source Serif 4 | `ȳ Ȳ` absents du sous-ensemble et du fichier amont 4.004. | Éliminée |
| Junicode | Absente de fontsource ; paquet TypoPRO en version 0.7.8 tronquée. | Éliminée (Junicode 2 non mesurée) |
| EB Garamond | Couvre tout ; `latin-ext` de 111 Kio en variable, chiffres alignés tabulaires, hauteur d'x 0,405. | Écartée |
| Spectral | Couvre tout ; statique seulement, chiffres alignés tabulaires. | Écartée |
| Literata | Couvre tout ; meilleure hauteur d'x (0,507) ; chiffres alignés seuls, pas de famille SC. | Solution de rechange |
| Newsreader | Couvre tout ; chiffres alignés tabulaires, U+2009 absente. | Écartée |
| Crimson Pro | Couvre tout ; chiffres alignés, pas de famille SC. | Écartée |
| Gentium Plus / Book Plus | Couvrent tout ; 57 à 67 Kio pour le seul `latin-ext` d'un style. | Écartées |
| Cormorant SC | Couvre tout ; trop maigre à 12–13 px. | Écartée |
| Cormorant Unicase | Couvre tout ; effet trop discret pour environ 40 Kio. | Écartée |
| Cormorant Infant | Couvre tout ; chiffres alignés, formes scolaires. | Écartée |

Le verdict de chaque famille figure dans le tableau de l'étude (section 4).

## 7. Écritures valyriennes

David J. Peterson a créé pour *House of the Dragon* une écriture mixte (logographique, paradigmatique, alphabétique), annoncée en août 2022 d'après Wikipédia. Seuls des glyphes isolés ont été montrés. Aucune police officielle, aucun tableau complet, aucune licence n'ont été trouvés. Le tableau d'Omniglot vient d'un wiki de fans et sa « police » n'a ni provenance ni licence indiquées. Les polices « House of the Dragon » des sites gratuits sont des alphabets latins à usage personnel. **Conclusion : aucun glyphe valyrien dans le site.** Détail et sources : étude, section 11.

## 8. Limites

1. Rendu vérifié dans Chromium sous Linux uniquement. Firefox, Safari, Windows et macOS non testés.
2. La recomposition de `ȳ` par macron combinant (Cinzel, Source Serif 4) n'est observée que dans Chromium ; elle n'a pas servi à la décision.
3. Repli Georgia estimé sur Gelasio ; repli Times New Roman mesuré sur Liberation Serif.
4. Lisibilité jugée sur captures par l'agent, sans test avec des lecteurs.
5. Le choix entre Alegreya et Literata repose en partie sur un jugement d'ambiance ; Literata a la meilleure hauteur d'x mesurée.
6. Les phrases valyriennes des spécimens ne sont pas validées linguistiquement.
7. La publication Instagram de Peterson n'a pas été consultée directement ; le titulaire des droits sur les glyphes de la série n'est pas confirmé.
8. Auteurs des polices (Christian Thalmann, Juan Pablo del Peral) cités de mémoire ; les avis de droit d'auteur, eux, sont copiés des fichiers.
9. Contrastes de couleur non mesurés (palette de l'agent 07 non disponible).
10. Firefox restreint par défaut les polices en `file://` au dossier de la page : non testé.

## 9. Propositions

1. Sous-ensembles sur mesure depuis les fichiers amont, pour rétablir `smcp`, `c2sc`, `onum` et supprimer Alegreya SC (gain estimé 30 à 40 Kio, non mesuré).
2. Test de lecture Alegreya contre Literata sur téléphone avant la version 1.
3. Contrôle Firefox et Safari : `ȳ`, U+202F, `file://`.
4. Agent 07 : reprendre les trois piles et l'échelle `--fs-*` dans `tokens.css` ; dessiner les ornements en SVG.
5. Agent 11 : valider que tout texte valyrien est en NFC et ne contient ni `ÿ`, ni `ý`, ni `ŷ`.
6. Agents 04 et 05 : `lang="art-x-valyrian"` sur tout texte valyrien, `lang="fr"` / `lang="en"` sur les traductions.

---

## Annexe — scripts de mesure

Le dossier temporaire ayant été supprimé, les trois scripts principaux sont reproduits ici.

### `measure.py`

```python
#!/usr/bin/env python3
"""Mesure de couverture cmap / GSUB des fichiers woff2 fontsource.

Usage : python3 -I measure.py <racine node_modules> [--json sortie.json]
Pour chaque paquet @fontsource*/<id>, inspecte les fichiers woff2 (un style
representatif : 400 normal ou wght normal, + italique s'il existe) de tous les
sous-ensembles latins, et indique dans quel sous-ensemble se trouve chaque
caractere obligatoire.
"""
import sys, os, re, json, glob
from fontTools.ttLib import TTFont

VALY_MACRON = "āēīōūĀĒĪŌŪ"
VALY_Y = "ȳȲ"
VALY_N = "ñÑ"
FRENCH = "éèêëàâçîïôûùüœŒæÉÈÊËÀÂÇÎÏÔÛÙÜÆ«»’–—…"
DIGITS = "0123456789"
EXTRA = "   ÿŸ‹›“”‘·†‡№"  # espaces fines, guillemets, etc. (informatif)
SUBSETS = ["latin", "latin-ext", "vietnamese", "latin-ext-additional"]


def cmap_of(path):
    f = TTFont(path, lazy=True)
    cm = set(f.getBestCmap().keys())
    return f, cm


def gsub_features(f):
    feats = set()
    if "GSUB" in f:
        t = f["GSUB"].table
        if t.FeatureList:
            for fr in t.FeatureList.FeatureRecord:
                feats.add(fr.FeatureTag)
    return feats


def gpos_features(f):
    feats = set()
    if "GPOS" in f:
        t = f["GPOS"].table
        if t.FeatureList:
            for fr in t.FeatureList.FeatureRecord:
                feats.add(fr.FeatureTag)
    return feats


def feature_covers(f, tag, chars):
    """Retourne les caracteres de `chars` dont le glyphe est reellement
    substitue par la fonctionnalite `tag` (lookups simples type 1, ou
    extension vers type 1)."""
    if "GSUB" not in f:
        return ""
    t = f["GSUB"].table
    cm = f.getBestCmap()
    idx = set()
    for fr in t.FeatureList.FeatureRecord:
        if fr.FeatureTag == tag:
            idx.update(fr.Feature.LookupListIndex)
    covered = set()
    for i in idx:
        lk = t.LookupList.Lookup[i]
        for st in lk.SubTable:
            if hasattr(st, "ExtSubTable"):
                st = st.ExtSubTable
            m = getattr(st, "mapping", None)
            if m:
                covered.update(m.keys())
            alt = getattr(st, "alternates", None)
            if alt:
                covered.update(alt.keys())
    out = ""
    for ch in chars:
        g = cm.get(ord(ch))
        if g and g in covered:
            out += ch
    return out


def analyse_pkg(pkgdir):
    files_dir = os.path.join(pkgdir, "files")
    name = os.path.basename(pkgdir)
    scope = os.path.basename(os.path.dirname(pkgdir))
    variable = scope == "@fontsource-variable"
    woffs = sorted(glob.glob(os.path.join(files_dir, "*.woff2")))
    res = {"pkg": f"{scope}/{name}", "variable": variable, "files": {}, "all_files": len(woffs)}
    try:
        res["version"] = json.load(open(os.path.join(pkgdir, "package.json")))["version"]
        meta = json.load(open(os.path.join(pkgdir, "package.json")))
        res["license"] = meta.get("license")
        res["fontVersion"] = meta.get("fontVersion") or (meta.get("fontsource") or {}).get("version")
    except Exception as e:
        res["version"] = "?"
    # pick representative styles
    picks = []
    for sub in SUBSETS:
        if variable:
            cands = [w for w in woffs if re.search(rf"-{re.escape(sub)}-wght-normal\.woff2$", w)]
            if not cands:
                cands = [w for w in woffs if re.search(rf"-{re.escape(sub)}-(opsz|full|standard)-normal\.woff2$", w)]
            ital = [w for w in woffs if re.search(rf"-{re.escape(sub)}-wght-italic\.woff2$", w)]
            if not ital:
                ital = [w for w in woffs if re.search(rf"-{re.escape(sub)}-(opsz|full|standard)-italic\.woff2$", w)]
        else:
            cands = [w for w in woffs if re.search(rf"-{re.escape(sub)}-400-normal\.woff2$", w)]
            ital = [w for w in woffs if re.search(rf"-{re.escape(sub)}-400-italic\.woff2$", w)]
        for c in cands[:1]:
            picks.append((sub, "normal", c))
        for c in ital[:1]:
            picks.append((sub, "italic", c))
    for sub, style, path in picks:
        try:
            f, cm = cmap_of(path)
        except Exception as e:
            res["files"][os.path.basename(path)] = {"error": str(e)}
            continue
        gs = gsub_features(f)
        info = {
            "subset": sub,
            "style": style,
            "bytes": os.path.getsize(path),
            "macrons": "".join(c for c in VALY_MACRON if ord(c) in cm),
            "ymacron": "".join(c for c in VALY_Y if ord(c) in cm),
            "ntilde": "".join(c for c in VALY_N if ord(c) in cm),
            "french_missing": "".join(c for c in FRENCH if ord(c) not in cm),
            "french_present": sum(1 for c in FRENCH if ord(c) in cm),
            "digits": all(ord(c) in cm for c in DIGITS),
            "extra_present": "".join(("NBSP" if c == " " else "NNBSP" if c == " " else "THIN" if c == " " else c) + " " for c in EXTRA if ord(c) in cm).strip(),
            "combining_macron": 0x0304 in cm,
            "onum": "onum" in gs,
            "smcp": "smcp" in gs,
            "c2sc": "c2sc" in gs,
            "lnum": "lnum" in gs,
            "tnum": "tnum" in gs,
            "pnum": "pnum" in gs,
            "liga": "liga" in gs,
            "features": sorted(gs),
            "gpos": sorted(gpos_features(f)),
            "nglyphs": f["maxp"].numGlyphs,
            "ncmap": len(cm),
        }
        if "smcp" in gs:
            info["smcp_covers"] = feature_covers(f, "smcp", "aāēīōūȳñéèêçœæ")
        if "onum" in gs:
            info["onum_covers"] = feature_covers(f, "onum", DIGITS)
        if "fvar" in f:
            info["axes"] = {a.axisTag: [a.minValue, a.defaultValue, a.maxValue] for a in f["fvar"].axes}
        try:
            nm = f["name"]
            info["family"] = nm.getDebugName(16) or nm.getDebugName(1)
            info["fontver"] = nm.getDebugName(5)
            lic = nm.getDebugName(13) or ""
            info["name_license"] = lic[:160]
            info["name_license_url"] = nm.getDebugName(14)
            info["copyright"] = (nm.getDebugName(0) or "")[:200]
        except Exception:
            pass
        res["files"][os.path.basename(path)] = info
    return res


def main():
    root = sys.argv[1]
    out = None
    if "--json" in sys.argv:
        out = sys.argv[sys.argv.index("--json") + 1]
    pkgs = sorted(glob.glob(os.path.join(root, "@fontsource", "*"))) + sorted(glob.glob(os.path.join(root, "@fontsource-variable", "*")))
    allres = []
    for p in pkgs:
        r = analyse_pkg(p)
        allres.append(r)
    if out:
        json.dump(allres, open(out, "w"), ensure_ascii=False, indent=1)
    # compact report
    for r in allres:
        print(f"## {r['pkg']} v{r.get('version')} lic={r.get('license')} ({r['all_files']} woff2)")
        for fn, i in r["files"].items():
            if "error" in i:
                print(f"   {fn}: ERROR {i['error']}")
                continue
            print(
                f"   {fn:58s} {i['bytes']/1024:6.1f}K mac={len(i['macrons'])}/10 y={i['ymacron'] or '-':2s} n={i['ntilde'] or '-':2s} fr={i['french_present']}/{len(FRENCH)} miss[{i['french_missing']}] dig={'Y' if i['digits'] else 'n'} onum={'Y' if i['onum'] else '-'} smcp={'Y' if i['smcp'] else '-'} c2sc={'Y' if i['c2sc'] else '-'} U+0304={'Y' if i['combining_macron'] else '-'}"
            )


if __name__ == "__main__":
    main()
```

### `metrics.py`

```python
#!/usr/bin/env python3
"""Metriques mesurees : style des chiffres par defaut, hauteur d'x, capitales,
chasse moyenne, caracteres complementaires (espaces fines, fleurons...).

Usage : python3 -I metrics.py <racine node_modules> pkg1 pkg2 ...
(pkg sous la forme @fontsource/xxx ou @fontsource-variable/xxx)
"""
import sys, os, glob, re
from fontTools.ttLib import TTFont
from fontTools.pens.boundsPen import BoundsPen

EXTRA = {
    "NBSP": 0x00A0, "NNBSP": 0x202F, "THIN": 0x2009, "HAIR": 0x200A,
    "‹": 0x2039, "›": 0x203A, "“": 0x201C, "”": 0x201D, "‘": 0x2018, "„": 0x201E,
    "·": 0x00B7, "†": 0x2020, "‡": 0x2021, "§": 0x00A7, "¶": 0x00B6, "№": 0x2116,
    "×": 0x00D7, "−": 0x2212, "°": 0x00B0, "ᵉ": 0x1D49, "ʳ": 0x02B3, "ˢ": 0x02E2,
    "❦": 0x2766, "❧": 0x2767, "☙": 0x2619, "⁂": 0x2042, "◆": 0x25C6, "◊": 0x25CA,
    "✦": 0x2726, "•": 0x2022, "‑": 0x2011, "ÿ": 0x00FF, "Ÿ": 0x0178,
    "U+0304": 0x0304, "U+0303": 0x0303, "ǖ": 0x01D6,
}
# frequences approximatives des lettres (francais/anglais melanges) pour une chasse moyenne
SAMPLE = "the quick brown fox jumps over the lazy dog valar morghulis zaldrizes buzdari iksos daor la maison targaryen regna sur les sept couronnes"


def bounds(gs, name):
    bp = BoundsPen(gs)
    gs[name].draw(bp)
    return bp.bounds


def pick(root, pkg):
    files = os.path.join(root, pkg, "files")
    out = {}
    for sub in ("latin", "latin-ext"):
        for style in ("normal", "italic"):
            c = sorted(glob.glob(os.path.join(files, f"*-{sub}-wght-{style}.woff2")))
            if not c:
                c = sorted(glob.glob(os.path.join(files, f"*-{sub}-400-{style}.woff2")))
            if not c:
                c = sorted(glob.glob(os.path.join(files, f"*-{sub}-opsz-{style}.woff2")))
            if c:
                out[(sub, style)] = c[0]
    return out


def main():
    root = sys.argv[1]
    for pkg in sys.argv[2:]:
        files = pick(root, pkg)
        lat = files.get(("latin", "normal"))
        if not lat:
            print(pkg, "no latin file")
            continue
        f = TTFont(lat)
        upm = f["head"].unitsPerEm
        cm = f.getBestCmap()
        gs = f.getGlyphSet()
        dig = {}
        for d in "0123456789":
            b = bounds(gs, cm[ord(d)])
            dig[d] = (round(b[1] / upm, 3), round(b[3] / upm, 3)) if b else None
        desc = [d for d, b in dig.items() if b and b[0] < -0.08]
        tops = sorted(set(b[1] for b in dig.values() if b))
        xb = bounds(gs, cm[ord("x")]); Hb = bounds(gs, cm[ord("H")])
        xh = xb[3] / upm; ch = Hb[3] / upm
        style = "elzeviriens (oldstyle)" if len(desc) >= 3 else "alignes (lining)"
        adv = sum(f["hmtx"][cm[ord(c)]][0] for c in SAMPLE if ord(c) in cm) / len(SAMPLE) / upm
        widths = set(f["hmtx"][cm[ord(d)]][0] for d in "0123456789")
        hhea = f["hhea"]
        allcm = set(cm)
        for k, p in files.items():
            if k != ("latin", "normal"):
                allcm |= set(TTFont(p, lazy=True).getBestCmap())
        extra = " ".join(k for k, cp in EXTRA.items() if cp in allcm)
        missing = " ".join(k for k, cp in EXTRA.items() if cp not in allcm)
        # where is each extra char
        ext_only = []
        if ("latin-ext", "normal") in files:
            cme = set(TTFont(files[("latin-ext", "normal")], lazy=True).getBestCmap())
            ext_only = [k for k, cp in EXTRA.items() if cp in cme and cp not in cm]
        print(f"## {pkg}")
        print(f"   UPM={upm} x-height={xh:.3f}em cap={ch:.3f}em x/cap={xh/ch:.2f} asc={hhea.ascent/upm:.2f} desc={hhea.descent/upm:.2f} gap={hhea.lineGap/upm:.2f} chasse moy.={adv:.3f}em (~{1/adv:.1f} car/em)")
        print(f"   chiffres par defaut : {style} ; descendants={''.join(desc) or '-'} ; hauteurs={tops} ; chasses distinctes={len(widths)} ({'tabulaires' if len(widths)==1 else 'proportionnels'})")
        print(f"   complements presents : {extra}")
        print(f"   complements absents  : {missing}")
        print(f"   dont latin-ext seulement : {' '.join(ext_only)}")


if __name__ == "__main__":
    main()
```

### `verify_retained.py`

```python
#!/usr/bin/env python3
"""Verification detaillee des fichiers retenus. Usage : python3 -I verify_retained.py <dossier woff2>"""
import sys, os, glob, hashlib
from fontTools.ttLib import TTFont
from fontTools.pens.boundsPen import BoundsPen
REQ = {"macrons": "āēīōūĀĒĪŌŪ", "ȳȲ": "ȳȲ", "ñÑ": "ñÑ", "français": "éèêëàâçîïôûùüœŒæÉÈÊËÀÂÇÎÏÔÛÙÜÆ«»’–—…", "chiffres": "0123456789", "divers": "  ·†“”‘‹›§×−°"}
def feat_map(f, tag):
    out = {}
    if "GSUB" not in f: return out
    t = f["GSUB"].table
    idx = set()
    for fr in t.FeatureList.FeatureRecord:
        if fr.FeatureTag == tag: idx.update(fr.Feature.LookupListIndex)
    for i in idx:
        for st in t.LookupList.Lookup[i].SubTable:
            st = getattr(st, "ExtSubTable", st)
            out.update(getattr(st, "mapping", {}) or {})
    return out
d = sys.argv[1]
total = 0
fams = {}
for p in sorted(glob.glob(os.path.join(d, "*.woff2"))):
    f = TTFont(p); cm = f.getBestCmap(); gs = f.getGlyphSet(); upm = f["head"].unitsPerEm
    size = os.path.getsize(p); total += size
    nm = f["name"]
    gsub = sorted({r.FeatureTag for r in f["GSUB"].table.FeatureList.FeatureRecord}) if "GSUB" in f else []
    gpos = sorted({r.FeatureTag for r in f["GPOS"].table.FeatureList.FeatureRecord}) if "GPOS" in f else []
    print(f"== {os.path.basename(p)}  {size} o ({size/1024:.1f} Ko)  sha256={hashlib.sha256(open(p,'rb').read()).hexdigest()[:16]}")
    print(f"   famille='{nm.getDebugName(16) or nm.getDebugName(1)}' version='{nm.getDebugName(5)}' glyphes={f['maxp'].numGlyphs} cmap={len(cm)} axes={ {a.axisTag:(a.minValue,a.defaultValue,a.maxValue) for a in f['fvar'].axes} if 'fvar' in f else '-'}")
    for k, chars in REQ.items():
        have = [c for c in chars if ord(c) in cm]; miss = [c for c in chars if ord(c) not in cm]
        print(f"   {k:9s}: {len(have)}/{len(chars)}" + (f"  absents: {' '.join('U+%04X'%ord(c) for c in miss)}" if miss and have else ""))
    print(f"   GSUB={','.join(gsub)}  GPOS={','.join(gpos)}  U+0304={'oui' if 0x304 in cm else 'non'}")
    for tag in ("lnum", "tnum", "pnum"):
        m = feat_map(f, tag)
        if m:
            cov = [c for c in "0123456789" if cm.get(ord(c)) in m]
            print(f"   {tag}: substitue {len(cov)}/10 chiffres")
    # hauteur max des capitales a macron et profondeur des descendantes
    ys = []
    for c in "ĀĒĪŌŪȲÉÊÑ":
        if ord(c) in cm:
            bp = BoundsPen(gs); gs[cm[ord(c)]].draw(bp); ys.append((c, bp.bounds[3] / upm))
    lo = []
    for c in "gpqyȳç":
        if ord(c) in cm:
            bp = BoundsPen(gs); gs[cm[ord(c)]].draw(bp); lo.append((c, bp.bounds[1] / upm))
    if ys: print("   sommet capitales accentuées (em): " + " ".join(f"{c}={v:.3f}" for c, v in ys))
    if lo: print("   bas des descendantes (em): " + " ".join(f"{c}={v:.3f}" for c, v in lo))
    if ord("0") in cm:
        print(f"   chasse du zéro (unité ch) = {f['hmtx'][cm[ord('0')]][0]/upm:.3f} em ; hhea asc/desc/gap = {f['hhea'].ascent/upm:.3f}/{f['hhea'].descent/upm:.3f}/{f['hhea'].lineGap/upm:.3f} ; OS/2 typo = {f['OS/2'].sTypoAscender/upm:.3f}/{f['OS/2'].sTypoDescender/upm:.3f}/{f['OS/2'].sTypoLineGap/upm:.3f} useTypo={bool(f['OS/2'].fsSelection & 128)}")
print(f"TOTAL : {total} octets = {total/1024:.1f} Kio = {total/1000:.1f} ko")
```
