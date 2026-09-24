# Home et hubs (Train, Games, Listening, Reading)

> Chargé quand on travaille dans `src/features/home/`.

### Home « une porte » (2026-09-23)
Proto `prototypes/home-focus/`, choix de Jérémy **B** ; la décision du 17/09 (« le plan ne va pas sur Home »)
est **assouplie** : le plan figé s'y affiche. Un seul grand bouton = la prochaine chose à faire, calculée par
`lib/homeAgenda.js` (pur, `tests/check_home_agenda.cjs`) : **coffre > premier Mock > mission du jour (`pick`,
re-tirage compris) > autres quêtes du plan**. Puis « Also today » (2 lignes), un lien « Today's path » (+N),
le **Daily Challenge en bloc à part** (jamais dans l'agenda), évènements et fête en lignes de texte (« Turn off »
reste là : surface d'opt-out), astuce repliée. Niveau/ligue en une ligne fine (garde « this week »). Bonus en
une ligne `bonusLine` (les pastilles colorées ont disparu). **Quick Start supprimé** (doublon de Train). Seule
animation : le pulse du coffre quand il est le bouton. Journée finie → « Today's path complete ». Mêmes props
qu'avant, aucun état dans `App()`. Styles `.hm-*` dans `appCss.js`. Banc : `frame.html?v=A&sc=busy|typical|done|new`.

### Hubs vivants (tuiles « Coffre », 2026-09-17)
Proto `prototypes/living-hubs/`, choix de Jérémy **C « Coffre »**. Les listes de Train (Exercises,
Grammar & Vocab, Tips), Games, Listening et Reading rendent `HubTile` + `HubShelf` (`components/HubTile.jsx`).
- **État pur** `lib/hubStatus.js` (`hubItemStatus`, `hubSummary`, `tests/check_hub_status.cjs`) : dernier score
  (`moduleScores[id].history`), progression vers le **prochain échelon** de maîtrise (`s.tier`, voir « Chest System » :
  la tuile montre le coffre suivant avec son chiffre romain, « Mastery I » en or une fois un échelon gagné, et
  l'étagère le total des coffres gagnés puis le prochain, sans « of N »), tarif de la prochaine
  partie par `nextRunMult` (`lib/xp.js` : Bypass Token, événements, `farmMult`, testé égal à l'étape « farm »
  de `gateSteps`). Étiquette « ½ XP / Low XP / No XP » seulement quand le tarif baisse.
- **Déclarer l'item** dans la liste du hub : module simple = son `id` suffit ; hub à épreuves = `subs:[…]` +
  `unit:"trials"|"parts"` (Gauntlet, Modal, Listening et Reading dans Exercises : maîtrise agrégée, meilleur
  tarif encore disponible) ; jeu sans précision = `game:"matchEasy"|"wordFall"|"duel"` (record, pas de coffre) ;
  outil sans score = `plain:true`. Liste noire (mocks, boss, daily, csess) → tuile simple.
- Les hubs reçoivent `events` (`activeEvents` d'`App()`, via le contexte des routes pour Listening/Reading) :
  sans, un Flash Hour afficherait « ½ XP » à tort. Étagère à partir de 3 coffres. Précision sous 80 % en gris
  pointillé (l'orange se confond avec l'accent du skin Doré). Banc des vrais écrans : `prototypes/living-hubs/real.html`.
