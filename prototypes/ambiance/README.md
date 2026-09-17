# Ambiance de fond + coffre en attente sur Home

Proto de l'audit visuel du 2026-09-17 (lot 2, n°3 et n°11). Hors build Vercel.

## Ouvrir

Serveur `festival-proto` de `.claude/launch.json` (Vite à la racine du dépôt, port 5606), puis **par l'URL directe** :

- comparateur : `http://localhost:5606/prototypes/ambiance/index.html`
- un seul écran en 375 px : lien « Ouvrir seul » au-dessus de chaque téléphone (passer le navigateur en vue mobile)

Les écrans sont les **vrais composants** de `src/` (Home, Train → Grammar & Vocab, Drill, Tabs) avec un profil fictif local. Ces écrans ne font aucun appel réseau : rien n'est lu ni écrit en base.

## Variantes de fond

| | Nom | Contenu | Animé |
|---|---|---|---|
| A | Actuel | fond uni `--bg` | non |
| B | Torche | halo de la couleur du skin (`--cx`) en haut + vignettage | non |
| C | Parchemin | B + grain de papier (bruit SVG en data-URI, 6 % sombre / 9 % clair) | non |
| D | Braises | C + 12 braises qui montent (transform/opacity seulement) | oui, coupé en mouvement réduit |
| E | Fresque | C + `images/mentor/map.jpg` en filigrane, fondu vers le bas | non |

Barre du comparateur : écran, mode clair/sombre, les 16 skins, les 4 fêtes, mouvement réduit simulé, taille ajustée ou 100 %.

## Coffre en attente (Home)

Le bouton « Treasure Chest Available » affiche aujourd'hui un emoji 📦 alors que le toast et le modal utilisent `TreasureChestSvg`.

- **SVG simple** : le coffre du palier à la place de l'emoji, bouton inchangé.
- **SVG + teinte du palier** : bordure et lueur à la couleur du palier (`CHEST_TOAST_COLOR`), coffre plus grand qui déborde et frétille toutes les 3,4 s, pastille ×N quand il y en a plusieurs.

Dans le proto, le SVG est greffé dans le vrai bouton par le DOM (`ChestSwap` dans `frame.jsx`). Au câblage, Home recevra le palier le plus élevé de `chestPending` (déjà dans `App()`).

## Mécanique (à reporter dans `src/styles/appCss.js`)

Calques `position:fixed` en `::before` / `::after` de `.app`, avec `isolation:isolate` sur `.app` : un `z-index` négatif passe devant le fond de `.app` mais derrière les cartes. `isolation` ne crée pas de bloc conteneur, donc tab bar, toasts et modals fixes restent calés sur l'écran. Tout est en jetons : le fond suit le skin, la fête et le mode clair sans règle par skin.

À vérifier au câblage : mode clair des cartes-nuit, bureau (sidebar 200 px), perf sur un Android d'entrée de gamme pour D.
