# Mentor qui se souvient

> Chargé quand on travaille dans `src/features/mentor/` (la chasse `features/hunt/` renvoie ici). La logique pure vit dans `lib/planner.js`, `lib/review.js`, `lib/learnerModel.js`, `lib/mentorVoice.js`.

### Mentor qui se souvient : bestiaire, chasse, plan du jour, narration, lettre, Chronique (2026-09-17/18, lots 1-6)
Proto `prototypes/mentor-memory/` (storyboard des 8 moments, décisions de Jérémy dans son README) ; banc de
la VRAIE chasse `prototypes/mentor-memory/hunt.html` (port 5608 : `box=2` la prochaine réussite tue, `empty=1`).
- **Colonne `students.review` jsonb** (`2026-09-17_mentor_memory.sql`, avec `letter_seen`) :
  `{items:[{k,cat,part,first,last,miss,fails,box,due}], slain, log}`. Des **références**, jamais le texte des
  questions. Bornée à l'écriture (`boundReview` : 120 créatures, 60 lignes), jamais dans `supaToLocal`.
- **Références** : `drill:<id>` pour toute la banque de grammaire (Drill, Daily, Exam Simulation : ratée ici
  ou là, même créature), `lisP1:<id>`, `lisP2:<id>`, `lisP3:<id>:<qi>`, `lisP4:<id>:<qi>`, `p6:<texte>:<trou>`,
  `p7:<passage>:<qi>`. **Jamais un indice d'option** (toutes les options sont permutées), jamais l'index d'un
  tableau. Une référence que `lib/reviewLookup.js` ne sait pas résoudre est sautée par la chasse : un module qui
  se met à poser des `ref` y ajoute sa résolution. Couverts : Drill, Daily, Exam Simulation, Word Fall (mauvaise
  réponse seulement, pas une phrase tombée), Part 6, Part 7, Listening P1-P4.
- **Les 16 autres modules** (2026-09-18) : la `ref` vient de `lib/reviewRefs.js moduleRef(mod, id, sub, label)`,
  **une table** lue à la capture ET par `reviewLookup` (même catégorie dans le Lair et dans la chasse). Clés :
  `gauntlet:<id>` (irr/td/pf/rw), `clue:<id>`, `ablitz:<id>`, `mimic:<id>`, `bforge:<id>`, `traps:<id>`,
  `stratquiz:<id>`, `modals_sort:<id>`, `modals_match:<plateau>:<paire>`, `tavern:<carte>:<type>`,
  `connsort:<mot>`, `prepdrill:<base>`, `gerinf:<verbe>`, `falsefr:<mot>`, `pvdojo:<verbe>:match|picker`,
  `wordfam:<mot>:<nature>`. Catégories = celles de la banque de grammaire quand elles existent (Gauntlet
  Chronomancer → Tenses, Clue ramené par `clueCat`, Linking Bridge → Connectors…) : la fiche de grammaire
  s'ouvre au 3e échec. **Toute `ref` à sous-partie porte une catégorie**, sinon `groupKey` la range comme un
  passage (« Part 4 » dans le Lair). Tout revient en **QCM permuté** (ces banques mettent la bonne réponse en
  B ou C huit fois sur dix ; seules les grilles natures / règles / fonctions gardent l'ordre du module) ;
  Irregular Crypt (tapé) revient en QCM « prétérit · participe » avec les confusions classiques. Hors
  bestiaire : Sentence Builder, l'indice du Clue Hunter, le Mimic manqué, les mots à deux natures, Speed Match.
  Transport : `miniSession` 4e argument, `onModuleDone` 5e (hubs Gauntlet / Modal Council, `subDone` le relaie),
  `gameSession` 4e, handlers en ligne de `routes.jsx` (clue, ablitz). Test : `check_review_lookup` (chaque item
  de chaque banque se relit avec la bonne réponse, catégories, permutation, câblage lu dans le source).
  Banc : `hunt.html?mods=1`.
- **Chasse** `sp==="hunt"` (`features/hunt/MistakeHunt.jsx`, lazy, gratuite, sans coffre de maîtrise, hors
  estimateur) : file figée au montage (`huntQueue`, 10 au plus, un passage Part 7 d'un seul tenant), vrai HUD.
  Écoute : P1/P2 se répondent pendant l'audio (la réponse coupe la chaîne : génération `genRef`), P3/P4
  montrent question et options avant l'audio mais ne se répondent qu'après. XP `5 + 5 × vaincues` **sans
  porte de précision** (courbe anti-farming gardée), 1 Daric par vaincue (`grantMarks`, unique par jour).
  `huntDone` reçoit le bestiaire mis à jour : le module travaille sur une copie.
- `lib/reviewLookup.js` importe listening, part6, part7 et les banques des jeux : **jamais d'import statique hors d'un écran lazy**
  (le bundle principal les tirerait) ; `lib/review.js`, lui, reste sans données.
- **Plan du jour FIGÉ dans `u.mission`** (lot 4, 2026-09-18 ; jsonb existant, aucune migration) : `App()` le
  pose une fois par jour dans un effet (`lib/planner.js dayMission`, deps primitives, jamais pendant le
  chargement), avec `quests` (primitives, `thawQuest` réhydrate catégorie et macro), `pick` (la quête qui
  porte la mission, 0 sauf re-tirage), `actId = quests[pick].mod`, et garde `streak`/`lastDoneDate` (coffre
  `mission_streak`). Recalculé à chaque ouverture, le plan bougeait sous les yeux de l'élève. **Tout le lit** :
  feuille « Today's Path » (quêtes cochées par `questDone` : la quête-mission quand `mission.done`, les autres
  quand leur module a été joué aujourd'hui), bandeau de Home (`homeStrip`), pastille de l'onglet Mentor,
  `NextStepReco` (prochaine quête non faite), et le **+25 % du Focus** : `stakePart` → `ctx.focusPart` de
  `gateSteps` (`computeTodayFocus`, précision la plus basse, est supprimé). `checkMission` inchangé.
- **Mentor** : cinq repères (Peak, Path, Lair, Camp, Aldric). « The Crossroads » disparaît (le Focus est la quête
  « enjeu »). Le **Lair** est une vue pleine page du Mentor (pas de route) qui charge `reviewLookup.js` par
  `import()` ; `lookupRef(k).title` = la ligne du bestiaire (question entendue en P2, extrait autour du trou en
  P6 coupé aux mots entiers par `aroundBlank`, numéro de photo en P1 — jamais la bonne réponse) ; un groupe de
  document porte son nom (`docName` : sujet en P6, objet ou titre en P7, première réplique en P3/P4 sans la
  formule d'accueil), sinon deux « Part 6 · Article » se confondaient ; pastilles de réussites espacées en
  anneau `--t3` (3,4:1 en sombre). Le Camp montre la maîtrise **récente** par partie, triée
  par points en jeu ; la liste de grammaire garde les `catStats` cumulées (la série `cs` n'existe que depuis le
  2026-09-17). Home montre le plan depuis le 2026-09-23 (voir « Home une porte ») ; son lien « Today's path »
  ouvre la feuille (`openPath` → `sSPA("path")` → `Mentor initialSheet`). `Tabs badge="mentor"` tant que la
  mission attend ; jamais un verrou.
- **Jeton `daily_reroll`** : `rerollMission` déplace la mission sur la quête suivante (l'ordre ne bouge pas) ;
  mission faite ou quête unique → le jeton n'est pas consommé.
- Banc des vrais écrans : `prototypes/mentor-memory/app.html` (Home, Mentor, onglets ; `p=lea|karim|ines`,
  `v=home|mentor|path|camp`, `done=1`, `reroll=1`, `mode=light`), horloge figée au 21/09/2026 (`clock.js`).
- **Drill composé par le plan** (lot 5, 2026-09-18 ; `lib/planner.js drillComposition`, `pickAdaptive`
  supprimé) : 4 questions sur la catégorie visée (quête Part 5 du plan figé, sinon `weakestCat` récente, sinon
  **`weakestLifetimeCat`** sur les `catStats` cumulées ≥ 5 Q — sans ce repli le Drill serait aléatoire pour
  presque tous, la série `cs` datant du 2026-09-17), 2 sur une catégorie « méritée », jusqu'à 2 échéances
  glissées (quand il y en a moins de 4, sinon la chasse les prend), le reste mêlé, **jamais une créature tirée
  au hasard**. Les échéances ne comptent pas dans les `catStats` de la manche ; battues, elles remontent en
  6e argument de `p.done` → `drillDone` → `recordHits`.
- **Narration de session** (Drill et chasse) : briefing en parchemin (`components/MentorMemory.jsx AldricBrief`,
  `mentorVoice.briefing` — sur le cumul il dit « so far », jamais « your last N »), mémoire de la question due
  dans `SessionTop sub`, conséquence d'Aldric dans les `children` d'`AnswerCard` (pas de slot à ajouter au
  HUD), et au **3e échec** la fiche de grammaire en place (`data/grammarSheets.js CAT_SHEET`,
  `components/GrammarSheet.jsx`, déplacé de `features/train/` pour la chasse) — seulement si la fiche existe
  (`hasSheet`). Fin : `SessionResult memory={<AldricRemembers/>}`, rendu **avant** « Lessons to keep ».
- **Cérémonie « faiblesse devenue force »** (`Ceremonies.jsx TurnCeremony`) : `sealSession` appelle
  `celebrateTurn` (retournement `eligible` de `learnerModel.turnaround`, jamais célébré) → marque
  `review.celebrated` (une fois par catégorie) et pose `session.turn`. L'écran de fin l'ouvre après une
  éventuelle promotion de ligue, **même si l'élève a passé l'animation** (moment unique). Symbolique.
  Impossible avant ~le 27/09 : la règle exige 10 jours entre deux fenêtres de la série `cs`.
- Bancs : `prototypes/mentor-memory/drill.html` (vrai Drill ; `p=lea|karim|ines`, `fold=1` deux échéances
  glissées dont un 3e échec, `turn=1` cérémonie de démonstration).
- **Lettre du lundi** (lot 6, 2026-09-18 ; `features/mentor/MondayLetter.jsx`, `mentorVoice.mondayLetter`) :
  calculée **côté client**, rendue par `App()` au premier passage sur Home de la semaine (`planner.letterDue` :
  `letterSeen` ≠ le lundi courant, et inscrit avant ce lundi ; jamais par-dessus une session, un coffre, Aldric,
  une session perdue). Datée du lundi même lue un mercredi, elle raconte la semaine lundi → dimanche d'avant
  (`weekFacts`, compteurs `review.weeks` : le journal borné à 60 lignes ne tient pas une semaine active),
  l'allure vers l'objectif depuis les instantanés (`useWeeklySnaps` → RPC `my_weekly_snapshots` →
  `snapshotSeries` ; échec loggé, la lettre part sans au bout de 2,5 s) et les buts du plan figé. « Later » ou
  « See today's plan » → `letterSeen` = le lundi (colonne `letter_seen`). Le push `weekly-results` n'en est
  que l'**accroche** (titre « Aldric's Monday letter ») : ne jamais recalculer la lettre en Deno.
- **Chronique** (repère Aldric ; la rediffusion de son chapitre passe au pied de la feuille, avec « This
  week's letter ») : jalons datés **rangés par `sealSession`** (`recordChronicle` → `review.chronicle`, 60)
  avant que `history`, bornée à 100 sessions, ne les efface ; la vue (`planner.chronicle`) fusionne rangés et
  recalculés (la date rangée gagne), les insights, puis « The next page ». Créatures vaincues par le compteur
  total (`review.slain`), pas par le journal.
- **Jeton Insight** : `mentorVoice.insightText` (points en jeu, catégorie la plus faible, bestiaire) rangé par
  `addInsight` dans `review.insights` (10), relu dans la Chronique. `generateInsight` (précision cumulée) et
  `u.insights` (mappé dans aucune colonne, perdu au rechargement) sont supprimés.
- Bancs : `prototypes/mentor-memory/app.html?v=letter` et `?v=chronicle`.
- `weekly-results` déployée le 2026-09-18 (version 19, JWT vérifié) : elle portait encore les textes français
  d'avant la passe anglaise du 2026-04-17, jamais déployée.
