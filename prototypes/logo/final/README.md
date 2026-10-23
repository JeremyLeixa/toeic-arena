# Verse Arena — kit logo (Tiered V, 2026-10-22)

**Idée** : le V de Verse est une arène vue en coupe ; ses gradins montent comme des niveaux.
**Construction** : canvas 256, flancs à 60° exacts, 3 gradins (contremarche 28, giron 18), piste de 32, un seul aplat
de 16 points. Coupe petite taille (≤ 24 px) : 2 gradins (contremarche 42), piste de 56.

## Fichiers
| Fichier | Usage |
|---|---|
| `verse-arena-horizontal-<couleur>.svg` | Version principale (landing, docs, PPTX) |
| `verse-arena-stacked-<couleur>.svg` | Formats carrés, badge, kakemono |
| `verse-arena-symbol-<couleur>.svg` | Icône, avatar ; `symbol-small-*` sous 24 px |
| `verse-arena-wordmark-v-<couleur>.svg` | Wordmark où le V est le symbole : en-tête de l'app |
| `verse-arena-wordmark-<couleur>.svg` | Nom seul, sans symbole (usage rare) |
| `png/*-1200.png` | PNG transparents pour PowerPoint / Word |
| `web/` | favicon.ico (16/32/48, coupe petite taille, or), favicon.svg (nuit/or selon le thème), apple-touch-icon, icon-192/512, maskable-512, site.webmanifest, head-snippet.html |
| `verse-arena-guide.html/.png/.pdf` | Guide d'usage d'une page |

Couleurs : `gold` #D4943A (sur nuit) · `night` #0F0C08 (sur clair) · `deepgold` #6F5410 (or sur clair) ·
`parchment` #EDE4D4 · `black` / `white` pour les usages techniques.

## Régénérer
- `py -3 tools/wordmark.py` : tous les SVG (Cinzel 700 instancié et vectorisé ; nécessite `fonttools`, `brotli`, `skia-pathops`).
- `py -3 tools/guide.py` : le guide HTML.
- Icônes web : `export_variants.py` du skill logo-design (voir l'historique de session).

## Tests passés
Audit SVG 100/100 (symboles) ; 16, 24, 32 et 64 px ; une couleur ; inversé ; contraste or/nuit 7,5:1, or profond/parchemin 6,3:1.

## Ouvert
- Recherche d'antériorité INPI / EUIPO avant tout dépôt (non faite).
- Pantone et CMJN approchés : à valider sur nuancier.
- Intégration dans l'app (favicon, icônes PWA, manifest, wordmark de l'en-tête et de la sidebar) et sur la landing : pas encore faite.
- Le wordmark garde les A de Cinzel tels quels : le seul signe propre à la marque est le symbole.
