# Échelons de maîtrise : le coffre des hubs qui revient

Proto du 2026-09-19. Hors build Vercel, rien dans `src/`.

**Constat.** Le coffre de maîtrise des tuiles de hub (Champion + 50 Darics à 50 Q et 80 %) tombe une
seule fois par module, pour toujours : déclencheur unique `mastery_<mod>`, refusé ensuite par
`grant_pending_chest`. Quand tout est gagné, chaque tuile affiche « Won » et l'étagère se fige
(« 5 of 5 »). Plus rien ne pousse à rejouer un module pour un coffre. Jérémy veut garder une
récurrence : choix des **échelons** (plutôt qu'une remise à zéro par saison).

## Ouvrir

Serveur `festival-proto` de `.claude/launch.json` (Vite à la racine du dépôt, port 5606), puis :

- comparateur : `http://localhost:5606/prototypes/mastery-tiers/index.html`
- un écran seul : `frame.html?v=A|B|C|D&screen=games|gv&profile=mix|new&mode=dark|light&skin=<id>&rm=1`

## La règle proposée (`tiers.js`, pure)

| Échelon | Volume cumulé | Précision | Coffre | Déclencheur |
|---|---|---|---|---|
| I | 50 Q | 80 % sur le cumul (règle d'aujourd'hui) | Champion | `mastery_<mod>` (inchangé) |
| II | 150 Q | 85 % sur les ~50 dernières | Champion | `mastery_<mod>_2` |
| III | 300 Q | 85 % sur les ~50 dernières | **Légendaire** | `mastery_<mod>_3` |
| IV, V… | +150 Q chacun (450, 600…) | 85 % sur les ~50 dernières | Champion | `mastery_<mod>_4`… |

- **Précision récente au-delà de I** : sessions entières en partant de la fin de `history` (bornée à
  100 sessions), jusqu'à 50 questions. Sur le cumul, 150 questions à 78 % ne remontent presque plus :
  l'élève qui progresse n'atteindrait jamais 85 %. Même principe que `lib/learnerModel.js`.
- **7 jours au moins entre deux échelons d'un même module** (dès II). Le volume compte même quand la
  partie ne rapporte plus d'XP (4e partie du jour) : sans cet écart, 150 questions jouées en un
  week-end donneraient deux coffres d'affilée. Sur la tuile : « III opens in 5 d ».
- **Échelon I inchangé** : les coffres déjà gagnés restent l'échelon I, sans migration.
- **Serveur** : rien à changer. `grant_pending_chest` accepte tout déclencheur et les types
  `champion` / `legendaire` ; l'unicité par déclencheur fait déjà le travail.
- **Hubs à épreuves** (Gauntlet, Modal Council, Listening et Reading dans Exercises) : un coffre par
  épreuve, comme aujourd'hui. La tuile vise l'échelon suivant de l'épreuve la moins avancée
  (« 1/4 trials at II »).

## Variantes (la règle est la même, seul l'affichage change)

| | Nom | Idée |
|---|---|---|
| A | Actuel | Les vrais `HubTile` / `HubShelf` de `src/`, sur le même profil : « Won » pour toujours. |
| B | Coffre suivant | La tuile d'aujourd'hui. Le coffre de droite est toujours le **prochain**, avec son chiffre romain (III en Légendaire, obsidienne et or). « Mastery I » en or devant la ligne de stats. Écart le plus faible avec l'actuel. |
| C | Échelle | La barre devient une échelle I · II · III, segments proportionnels aux questions à jouer (50, 100, 150) : on voit tout le chemin. Au-delà de III : « I–III » replié, puis IV. |
| D | Médailles | Un sceau par échelon gagné devant la ligne de stats (III plein, Légendaire ; +1, +2 au-delà). Barre et coffre numéroté visent le suivant. |

**Étagère (B, C, D)** : un coffre par tuile au palier de son dernier échelon gagné, avec son chiffre ;
« 7 mastery chests won » (plus de « of N » : la série ne finit pas) ; « Next: Mimic Hunt I · 20 Q to
go », le coffre le plus proche. Nouvel élève : « Mastery chests at 50, 150, 300 questions, then one
every 150. »

Profil « En cours » : Word Tavern I gagné vers II ; Sentence Builder III gagné vers IV ; Audio Blitz
au volume de II mais 83 % récents ; Clue Hunter II gagné il y a 2 jours, III en attente 5 jours ;
Mimic Hunt vers I. Grammar & Vocab : Gauntlet (4 épreuves à I, une à II), Connectors à 10 Q de II,
Gerund en attente 4 jours, False Friends bloqué par la précision dès I.

## Décisions à prendre

1. **La variante** d'affichage.
2. **Les seuils** : 150 / 300 / +150 et 85 % récents ? Le 3e échelon en Légendaire (1 000-1 500 XP,
   cosmétique légendaire, cheat sheet) : un par module, soit une vingtaine au plus par élève.
3. **Les Darics** : 50 à chaque échelon (`mastery_marks_<mod>_<n>`) ou seulement au I ?
4. **Le rattrapage au déploiement** : un élève qui a déjà 150 Q à 85 % récents recevrait l'échelon II
   de chacun de ces modules dès sa première connexion, soit jusqu'à une dizaine de coffres Champion
   d'un coup. On l'accepte (récompense du travail passé) ou on date l'échelon I hérité du jour du
   déploiement (tout le monde attend 7 jours, puis ça s'étale) ?

## Au câblage

- `lib/hubStatus.js` : `TIERS`, `tierDef`, `recentAcc`, `tierStatus`, `hubTierStatus` (depuis
  `tiers.js`) ; `MASTERY_Q` / `MASTERY_ACC` restent l'échelon I. `hubItemStatus` / `hubSummary`
  rendent l'échelon.
- **Mémoire de l'échelon** : `moduleScores[mod].mt = {n, date}`. ⚠️ `recordModule`
  (`lib/progress.js`) reconstruit l'objet avec des clés fixes : il faut y recopier `mt`, sinon chaque
  session l'efface.
- **Watcher d'`App.jsx`** : `tierStatus(m).state === "ready"` → `grantChestLocal("mastery_"+mod
  (+"_"+n au-delà de I), champion|legendaire)`, puis `mt = {n, date: today()}` par `sU(prev => …)`
  (pas une recopie du `u` capturé). Aussi sur une réponse « already » : sinon un `mt` perdu bloque
  le module sur un échelon déjà servi. Garde `useRef` par module **et** par échelon (le patron
  anti-boucle du 2026-04-27 reste obligatoire).
- `getTriggerLabel` : `mastery_tavern_2` → « Mastery II: Word Tavern » (aujourd'hui l'id brut :
  « Module mastery: tavern »).
- Tests : `check_hub_status` (seuils, précision récente, écart de 7 jours, I hérité sans `mt`,
  agrégat des hubs à épreuves), à prouver mordants.
- **Défaut vu en passant, déjà en prod** : sous le coffre, « 71% acc » devrait être rouge
  (`hub-warn`) mais `.hub-chest small{color:var(--t3)}` gagne en spécificité. Il reste gris.

## Fichiers

- `tiers.js` : la règle (pure, destinée à `lib/hubStatus.js`)
- `hubs.jsx` : listes des hubs (copiées de `src/`), profil fictif, tuiles A-D, étagère
- `tiers.css` : ajouts aux `.hub-*` réels, en jetons (skin, fête, mode clair)
- `frame.html` / `frame.jsx` : un hub dans une variante ; `index.html` : comparateur
