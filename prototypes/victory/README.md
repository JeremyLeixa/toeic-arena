# Moments de victoire — écran de fin, montée de niveau, promotion de ligue

Proto de l'audit visuel du 2026-09-17 (lot 1, n°1 et n°2). Hors build Vercel, rien dans `src/`.

**Constat de départ :** 32 écrans de fin écrits à la main (icône, score, « +XP » figé, bouton), la recommandation du module suivant dans 6 seulement, le toast d'XP qui répète le « +XP » par-dessus ; la montée de niveau et la promotion de ligue ne montrent rien (un jingle et une vibration dans `addXp`).

## Ouvrir

Serveur Vite à la racine du dépôt (`festival-proto`, port 5606, ou `dev`), puis **par l'URL directe** :

- comparateur : `/prototypes/victory/index.html`
- un écran seul avec le son : lien « Ouvrir seul (son) ↗ » (un tap pour démarrer, Web Audio l'exige), bouton Replay en bas à gauche

## Ce qui est comparé

| | Écran de fin | Esprit |
|---|---|---|
| V1 | **Grand livre** | Dans le style de l'appli (jetons, cartes : suit skin et mode). Anneau de score, détail de l'XP ligne à ligne, total qui compte, barre de niveau, ligue, coffres, erreurs, recommandation. |
| V2 | **Arène** | Scène sombre plein écran façon coffre v3 : l'écusson tombe, score tamponné, gros compteur, pastilles du détail, anneau de niveau autour de l'écusson, panneau qui monte. |
| V3 | **Verdict d'Aldric** | Parchemin qui se déroule : verdict écrit (anglais), sceau de cire avec le score, XP à l'encre, niveau à la feuille d'or. |

Réglages : **montée de niveau** dans l'écran (la barre se remplit, marque une pause pleine, la médaille se retourne, éclat) ou **plein écran** (médaille, rayons, 2-3 s) ; **promotion** en « Ascension » (l'ancien écusson se fend, le nouveau descend dans une colonne de lumière), « Bannière » (bannière héraldique à la couleur de la ligue) ou « Carte seule » (pas de cérémonie). Tap n'importe où = tout afficher.

## Scénarios (chiffres réels)

Chaque scénario passe par `gateXp` puis `settleXp` de `src/lib/xp.js`. `explainXp` (`scenarios.js`) refait les étapes avec les fonctions pures exportées et vérifie qu'il retombe exactement dessus (sinon `console.warn`).

| Scénario | Ce qu'il montre |
|---|---|
| `solid` | Drill 8/10, streak ×1,2 : le cas courant |
| `perfect` | Drill 10/10, Today's Focus +25 %, passage du niveau 15 au 16 |
| `struggle` | Drill 2/10 : porte de précision ×0,1 (plancher 5 XP), 8 erreurs à revoir |
| `farming` | Word Tavern 12/15, 3e partie du jour ×0,15, avec l'explication |
| `promotion` | Drill 9/10, streak 7 jours (×1,5 + coffre Novice), +10 du jour, ligue Silver → Gold (coffre Warrior) |

## Fichiers

- `scenarios.js` : profils fictifs, scénarios, `explainXp`
- `parts.jsx` : étapes minutées, compteur, remplissage de niveau avec pause, anneau de score, détail d'XP, erreurs, coffres gagnés
- `variants.jsx` : `useDirector` (chef d'orchestre commun) + V1, V2, V3
- `ceremonies.jsx` : `LevelUpOverlay`, `LeaguePromotion` (ascension, bannière)
- `victory.css`, `frame.html/jsx` (un écran piloté par l'URL), `index.html` (comparateur)

Réutilise sans copie : `createChestFx` (particules du coffre v3), les sons de `src/sounds.js`, `TreasureChestSvg`, `.home-chest.tN`, `NextStepReco`, `getLevel`, `LEAGUES`.

## Au câblage (après choix)

- `gateXp` / `settleXp` rendent le **détail des étapes** (au lieu de le recalculer) + cas dans `tests/check_xp_gates.cjs`.
- `App()` garde le résultat de la dernière session (XP détaillée, niveau et ligue avant/après, coffres gagnés) ; les modules passent leurs erreurs dans `p.done` ; un composant `components/SessionResult.jsx` remplace les 32 écrans de fin, module par module.
- Le toast d'XP ne s'affiche plus quand l'écran de fin est là ; les coffres gagnés pendant la session s'affichent dans l'écran au lieu du toast (file et anti-interruption inchangées).
- Couleurs : V1 passe par les jetons et `tone()` (check_tones) ; V2, V3 et les cérémonies ont un fond fixe (`/*fond local*/`).
