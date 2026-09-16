# Chest opening v3 — « Crack & Cards » (directions A + C)

Prototype autonome, hors build Vercel. Remplace l'animation Boss Loot de `src/features/chests/Chests.jsx`.

## Ouvrir

- Double-clic sur `index.html` (scripts classiques, marche en `file://`), ou
- serveur `chest-v3-proto` de `.claude/launch.json` → `http://localhost:5607/prototypes/chest-animations-v3/`

Passer le navigateur en vue mobile (375 px). Le son démarre au clic sur « Open now » (déblocage Web Audio).

## Déroulé

1. **Toast** « Treasure earned » (le vrai point d'entrée) → Open now.
2. **Chute** du coffre du bon niveau, impact, poussière.
3. **3 taps** : le coffre tremble, la lumière passe par les jointures, la note monte. **La couleur annonce la meilleure rareté du contenu** et peut sauter d'un coup (ex. Rare, Rare, Legendary). Le coffre Légendaire trace son cercle runique, un tiers par tap. Appui long = ouverture immédiate.
4. **Ouverture** : charge, serrure qui saute, couvercle qui bascule sur ses charnières, colonne de lumière, rayons.
5. **Cartes face cachée** en éventail. Le dos d'une carte Epic pulse, celui d'une Legendary a une bordure d'or tournante.
6. Tap sur une carte → elle monte, battement de cœur si Epic+, retournement 3D, compteur qui défile pour Darics/XP, reflet holo qui suit le doigt sur Epic/Legendary. Tap → retour dans l'éventail.
7. **Récap** quand tout est retourné : le meilleur cosmétique en vedette, puis le reste → Collect all.

## Barre du proto

| Contrôle | Pour voir |
|---|---|
| Novice / Warrior / Champion / Legendary | les 4 coffres et leurs tables de drop |
| Best (Warrior, Champion) | forcer la rareté du cosmétique pour voir chaque montée de couleur |
| Slow network | S2 : le coffre « résiste » (3,4 s) au lieu d'exploser puis d'attendre |
| Reduced motion | S9 : coffre fixe, un tap, récap direct |
| Replay | relance sans repasser par le toast |

Bouton **Skip** en haut à droite pendant toute la séquence (S5).

## Correspondance avec le socle proposé

| # | Où dans le proto |
|---|---|
| S1 coffres par niveau | `chest-art.js` (`chestSvg(tier)`, même géométrie que `TreasureChestSvg`) |
| S2 requête au montage | `open.js` `P.start` (`resultP`), boucle « The lock resists… » |
| S3 regroupement + crescendo | `loot.js` `groupRewards` (pure, destinée à `src/lib/`) |
| S4 rareté honnête | `cards.js` : badge seulement sur les cosmétiques, rareté de l'objet |
| S5 récap + skip | `reveal.js` `showRecap`, Reveal all, Skip |
| S6 son | `sfx.js` (Web Audio, Ré majeur, portable dans `src/sounds.js`) |
| S7 haptique | `P.haptic` aux temps forts (Android) |
| S8 SVG au lieu d'emojis | `icons.js` (généré depuis `GAME_ICON_PATHS` + 3 icônes Iconify) |
| S9 mouvement réduit | `open.js` `reducedIntro` / `reducedOpen` |

## Techniques utilisées

`@property` (`--tell` typée `<color>` qui se fond jusque dans les dégradés SVG, bordure conique, balayage holo), easing `linear()` pour les ressorts, Web Animations API (`animation.finished`) pour séquencer, un seul `<canvas>` de particules (DPR ≤ 2, quantités ÷2 sur ≤ 4 cœurs), `color-mix()`, `overflow: clip`.

## Pièges relevés en construisant

- **`overflow: hidden` reste défilable par programme** : les rayons (1000 px) débordent, un `scrollIntoView` / focus faisait glisser toute la scène de ~190 px. D'où `overflow: clip` sur `.stage`. Le modal de l'app a la même structure : à reprendre au câblage.
- **`mix-blend-mode: color-dodge` pour le reflet holo noie la carte** dans l'orange sur fond sombre : `screen` + bandes fines séparées de vide.
- Cadres et titres n'existent qu'à partir de Rare dans le catalogue : le cosmétique d'un coffre Warrior est donc toujours Rare, Epic ou Legendary (la simulation respecte ça).

## Simulé, pas branché

Contenu tiré au sort côté client avec les montants de `DROP_TABLES` et un échantillon du vrai catalogue ; aucun appel Supabase, aucun doublon, pas de BGM à baisser.
