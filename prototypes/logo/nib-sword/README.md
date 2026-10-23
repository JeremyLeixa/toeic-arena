# Verse Arena — kit logo Nib Sword (retenu le 2026-10-22)

**Idée** : une plume métallique dont la fente et le trou d'aération dessinent une épée en réserve.
La plume est plus forte que l'épée : le bec pour la langue, l'épée pour l'arène.

**Construction** : canvas 256, encre x 60-196 et y 20-236. Un seul contour : il entre par la fente du bec, fait le
tour de l'épée et ressort, sans trou ni `fill-rule`. Épée : pommeau r 11, garde aux quillons tombants (+6),
lame effilée de 20 à 12, fente de 4 jusqu'à la pointe. Les quillons tombants et la lame effilée évitent la lecture
« croix ». Coupe petite taille (≤ 24 px) : lame 32 → 24, garde 88 de large, pommeau r 16, fente de 8.

## Fichiers
| Fichier | Usage |
|---|---|
| `verse-arena-horizontal-<couleur>.svg` | Version principale (landing, docs, PPTX) |
| `verse-arena-stacked-<couleur>.svg` | Formats carrés, badge, kakemono |
| `verse-arena-symbol-<couleur>.svg` | Icône, avatar ; `symbol-small-*` sous 24 px |
| `verse-arena-wordmark-<couleur>.svg` | Nom seul (rare) |
| `png/*-1200.png` | PNG transparents pour PowerPoint / Word (or, nuit, blanc) |
| `web/` | favicon.ico (16/32/48, coupe petite taille, or), favicon.svg (nuit sur onglet clair, or sur sombre), apple-touch-icon, icon-192/512, maskable-512 (plume or sur tuile nuit), site.webmanifest, head-snippet.html |
| `board.html`, `slides/` | Présentation avec maquettes (icône, onglet, site, profil social, badge, t-shirt) |
| `verse-arena-guide.html/.png/.pdf` | Guide d'usage d'une page |

Couleurs : `gold` #D4943A (sur nuit) · `night` #0F0C08 (sur clair) · `deepgold` #6F5410 (or sur clair) ·
`parchment` #EDE4D4 · `black` / `white` pour les usages techniques.

## Régénérer
- `py -3 tools/wordmark.py` : tous les SVG (Cinzel 700 instancié et vectorisé ; nécessite `fonttools`, `brotli`, `skia-pathops`).
  `VA_MARK=tiered` régénère le kit Tiered V dans `final/`.
- `py -3 tools/guide.py` : le guide HTML (même variable `VA_MARK`).
- Icônes web : `export_variants.py` du skill logo-design, favicons depuis `symbol-small-gold`.

## Tests passés
Audit SVG 92/100 (symbole et coupe petite taille : seul l effilement de la lame, voulu, sort de la grille ; garde à 15° exacts) ; 16, 24, 32 et 64 px ; une couleur ; inversé ;
contraste or/nuit 7,5:1, or profond/parchemin 6,3:1.

## Ouvert
- Recherche d'antériorité INPI / EUIPO avant tout dépôt (non faite).
- Pantone et CMJN approchés : à valider sur nuancier.
- Intégré dans l'app le 2026-10-23 (e981c4a) et sur la landing verse-arena.fr (86fd601, uploadée sur Hostinger le même jour).
- `final/` contient encore le kit Tiered V : le dossier était verrouillé (synchro), à supprimer ou renommer à la main si on n'en veut plus.
