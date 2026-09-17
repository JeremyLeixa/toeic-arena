# Hubs vivants — progression vers le coffre, dernier score, XP du jour

Proto de l'audit visuel du 2026-09-17 (lot 3). Hors build Vercel, rien dans `src/`.

**Constat de départ :** les hubs (Train → Grammar & Vocab, Games, Reading, Listening) sont des listes
statiques (nom, description, flèche). Rien ne dit où l'élève en est, ce qu'il a fait hier, ni qu'une
3e partie du jour ne rapporte presque plus rien. Le coffre de maîtrise (Champion + 50 Darics, une fois
par module) tombe sans prévenir.

## Ouvrir

Serveur `festival-proto` de `.claude/launch.json` (Vite à la racine du dépôt, port 5606), puis **par l'URL directe** :

- comparateur : `http://localhost:5606/prototypes/living-hubs/index.html`
- un hub seul en 375 px : lien « Ouvrir seul » au-dessus de chaque téléphone

Barre : hub (Grammar & Vocab, Games, Reading), profil (« En cours » à états variés, « Nouvel élève »),
mode clair/sombre, les 16 skins, mouvement réduit, taille.

## Les trois informations (toutes déjà dans le profil)

| Info | Source | Règle |
|---|---|---|
| Progression vers le coffre de maîtrise | `moduleScores[id].total/correct` | 50 Q et ≥ 80 % (`App.jsx`, watcher `mastery_<id>`, hors `mock1-3`, `boss`, `daily`, `csess`) |
| Dernier score | `moduleScores[id].history` (dernier élément) ; jeux sans précision : `gameScores` (record) | — |
| XP du jour | `dailyModSessions[id_<date>]` → `farmMult` (`lib/xp.js`) | 1re partie 100 %, 2e 50 %, 3e 15 %, puis 0 |

Hubs à épreuves (Gauntlet, Modal Council) : maîtrise = épreuves maîtrisées / total ; XP du jour = le
meilleur tarif encore disponible (une épreuve pas encore jouée aujourd'hui = plein tarif).
Flashcards : aucune des trois (0 XP, hors maîtrise).

## Variantes

| | Nom | Idée |
|---|---|---|
| A | Actuel | Rendu d'aujourd'hui, recopié à l'identique. |
| B | Anneau | Anneau autour de l'icône qui se remplit vers 50 Q ; éteint et pointillé si la précision est sous 80 %, or + coffre en médaillon une fois maîtrisé. Dernier score à la place de la description. Crans d'XP du jour à droite (vert, orange, rouge). |
| C | Coffre | Le coffre Champion à droite est l'objectif : terne avec son %, il brille et frétille une fois gagné. Barre fine sous le texte. Étiquette « ½ XP / Low XP / No XP » seulement quand l'XP est réduite. Étagère de coffres en tête de hub. |
| D | Registre | Tuile d'aujourd'hui intacte + une ligne de registre (dernier score, progression, XP du jour) et un liseré de progression au pied de la carte. Le plus discret. |

Profil « En cours » : Word Families en route (34/50, 85 %), False Friends bloqué par la précision
(58 Q, 71 %), Connectors maîtrisé, Linking Bridge jamais joué, Prepositions et Gerund joués 1 et 2 fois
aujourd'hui, Phrasal Dojo 3 fois (plus d'XP) ; Gauntlet 1 épreuve sur 4 maîtrisée.

## Fichiers

- `hubs.jsx` : contenu des hubs (copié de `src/`), profil fictif, `statusOf` (état d'un module ou d'un hub), tuiles A-D, résumés
- `living.css` : styles des variantes, en jetons (suivent skin et mode clair)
- `frame.jsx` / `frame.html` : un hub dans une variante ; `index.html` : comparateur

## Au câblage

`statusOf` part en fonction pure dans `src/lib/` (testée : seuils de maîtrise, `farmMult`, hubs à
épreuves), les tuiles dans `components/` pour être partagées par Train, GamesHub, Listening/ReadingHub.
Les constantes 50 / 0,8 remontent dans `lib/` et le watcher de `App.jsx` les lit aussi (une seule source).

## Décision (2026-09-17)

**C « Coffre »**, câblée dans `src/` : état pur `lib/hubStatus.js` (seuils partagés avec le watcher du
coffre de maîtrise d'`App.jsx`, `tests/check_hub_status.cjs`), tarif de la prochaine partie par
`nextRunMult` (`lib/xp.js`, bypass et événements compris), composants `components/HubTile.jsx`
(`HubTile`, `HubShelf`), CSS `.hub-*` dans `appCss.js`. Branchée sur Train (Exercises, Grammar & Vocab,
Tips), Games, Listening et Reading. Le Gauntlet et le Modal Council gardent leurs cartes internes.

Banc des vrais écrans câblés : `real.html?screen=gv|ex|tips|games|listening|reading&profile=mix|new&mode=dark|light&ev=flash`.
