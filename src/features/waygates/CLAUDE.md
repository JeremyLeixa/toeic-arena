# The Waygates : les modules thématiques (Nine to Five, Jet Lag)

> Chargé quand on travaille dans `src/features/waygates/`. Protos : `prototypes/office-day/` (README : le constat
> chiffré et les variantes comparées), `prototypes/travel-day/` (monde voyage, météo W1/W2, relecture du vivier).
> Test : `tests/check_office_day.cjs`.

**Pourquoi** (2026-09-24, exports CSV `tests/data/`) : les formats longs du TOEIC étaient fuis. Sur toute la campagne
IDRAC, P3 = 14 sessions, P4 = 14, P7 = 38, contre 1 491 pour les flashcards. Or P3 + P4 font près de la moitié du
Listening et la P7 la plus grosse part du Reading. Un module thématique **habille les vraies Parts dans une situation**
(« faire bosser sans en donner l'air », Jérémy) : les questions restent celles du TOEIC, texte, options et explications
**tels quels**. Tout le jeu est autour, jamais à leur place.

## Le hub (`Waygates.jsx`, route `waygates`)
- Les portails d'Aldric vers le monde réel : ça fait le pont entre la fantasy de l'appli et un monde moderne assumé
  (choix de Jérémy). Tuile en tête du hub Games (`plain` : ni coffre ni tarif propres). Transition « Plongée » + son
  (`portal.js`, `playPortal`).

## Un moteur, plusieurs mondes (2026-09-25)
**Règle de Jérémy : ne pas complexifier chaque monde.** Un monde = le même moteur (horloge, grades, réputation,
réponses versées dans les Parts), un autre décor et un autre vivier. Jamais un écran copié.
- **`lib/worlds.js`** (pur, SANS données, lu par `App.jsx`, le hub et la tuile Games) : `WORLD_META[id]` déclare
  `modId` (clé XP / historique), `repKey` (`gameScores.<repKey>`), `name`, `company`, `person` (clé de `PEOPLE`),
  `desk` / `wait` (libellés du bureau et de l'attente), `weather` (règle W2 active). `worldRep(u, id)`.
- **`lib/officeDay.js composeDay(rep, rnd, world)`** : `office` = composition d'origine, **inchangée** ; `travel` =
  `composeTravel` depuis `TRAVEL_POOL`.
- **`WorldDay.jsx`** (ex-`NineToFive.jsx`) : prop `world`, tout ce qui dépend du monde vient de `worldMeta`.
- **`App.jsx worldDone(world, …)`** (ex-`officeDone`) et une route par monde dans `routes.jsx`
  (`<WorldDay key=… world=…>`, `done=worldDone("<id>",…)`).
- **Ajouter un monde** = une entrée dans `WORLD_META`, sa composition dans `officeDay.js`, sa carte dans `WORLDS`
  (`Waygates.jsx`), sa route, puis les listes du lot 3 : `MASTERY_BLACKLIST`, `MODULE_TOEIC_MAP` (ni part ni
  section), libellés (`usageStats`, `chestLabels`, `feedbackModules`, `TeacherDash`), trophées. Le test réclame
  chacune pour `office` et `travel` ; l'étendre au monde suivant.

## Nine to Five (module `office`)
Une journée chez Meridian Harbor Group (entreprise fictive), de 9:00 à 17:00. Variante **V3** du proto (horloge +
réputation), **horloge clémente aux grades bas**.
- **Composition** : tirée à chaque partie depuis les banques. Grades, clémence, nombre de tâches et formats débloqués
  (Part 7 double à Associate, triple à Team Lead) : `lib/officeGrades.js`, communs à tous les mondes.
  L'habillage des P3 est **générique** (machine à café, appel, réunion) : un sujet tiré du contenu trahirait la Q1.
- **P3/P4** : questions et options lisibles avant et pendant l'écoute, réponses verrouillées jusqu'à la fin (consigne
  réelle du TOEIC : l'anticipation s'entraîne sans être nommée). Une réécoute, qui coûte 15 min de jeu.
- **HUD commun** : `SessionTop` pendant toute la journée (horloge en `aside`, grade en `sub`), et `onSheet` **gèle
  l'horloge** (ref lue dans le tick). Bandeau d'appel seulement **pendant une autre tâche**.
- **Couleurs : jetons du thème uniquement** (question de Jérémy : les skins s'appliquent). `NF_CSS` / `WG_CSS` sans
  aucun hex, la garde le refuse. Le « bureau moderne » passe par la forme (boîte de réception, appel, horloge).

## Jet Lag (module `travel`, 2026-09-25)
Déplacement professionnel, coordonné par Maya Ortiz. Vivier **validé par Jérémy tel quel** (`TRAVEL_POOL`) :
6 P3, 4 bulletins météo P4 (chacun son étiquette), 4 perturbations P4, 6 P7. Mince : du contenu neuf (~10 P3 avec
audio, 6 à 8 P7) est prévu, rédigé par Claude et relu par Jérémy avant d'entrer au vivier.
- **Journée** : bulletin en direct à 9:00, puis P3/P7 selon le grade (4 tâches → 1 P3 + 1 P7, 5 → 1 + 2, 6 → 2 + 2),
  et **une seule** perturbation en direct, toujours après au moins une P3.
- **Météo W2 « prévu = paré »** : bulletin compris en entier → +`WEATHER_BONUS` (15) de réputation à l'arrivée de la
  perturbation ; sinon l'horloge saute de `WEATHER_DELAY` (45) min. Une seule fois par journée, ligne dans le bilan,
  `prepared` rangé dans l'historique du module (trophée Weather-wise).
- **Les messages parlent d'anticipation, jamais d'orage** : seule p4_02 est causée par la météo (p4_47 et p4_32 =
  panne de signalisation, p4_97 = nettoyage).
- **Habillage des P3 et annonces générique** (« Two travellers », « On speaker ») : des questions demandent
  « Where are the speakers? », un décor « At the airport » donnerait la réponse.

## Les invariants qui cassent sans bruit (tous les mondes)
- **Les réponses comptent dans lisP3 / lisP4 / p7** (`worldDone`, `App.jsx`, choix de Jérémy : poids plein dans
  l'estimateur et le Mentor), **mais JAMAIS de `trackModSession` sur ces clés**. Sinon une journée taxe les tuiles
  Listening/Reading (`farmMult`) et coche les quêtes du plan (`questDone` lit `dailyModSessions`). XP, anti-farming et
  historique restent sous le `modId` du monde.
- **Le `modId` hors des tables de poids** de l'estimateur (`MODULE_TOEIC_MAP.<modId>` : ni part ni section) : il
  compterait deux fois.
- **Le `modId` en `MASTERY_BLACKLIST`** : ses réponses font déjà avancer les coffres de maîtrise des Parts.
- **Réputation dans `gameScores.<repKey>`** `{rep, days, bestStars}` (jsonb déjà synchronisé, pas de colonne). Elle
  **ne baisse jamais** (une tâche manquée ne rapporte rien) et un gain est borné à `REP_MAX_GAIN`. Chaque monde a la
  sienne : les trophées d'un monde ne lisent jamais l'autre.
- **`App.jsx`, le hub et la tuile Games lisent `worlds.js` / `officeGrades.js`, jamais `officeDay.js`** : ce dernier
  importe les banques P3/P4/P7, qui doivent rester dans le chunk chargé à la demande.
- **Refs d'erreurs = celles des modules d'origine** (`lisP3:<id>:<qi>`, `lisP4:…`, `p7:…`) : la chasse les rejoue
  sans code neuf. `qi` = l'index d'origine de la question (seules les options sont permutées).
- **Pas de BGM** : `office`, `travel` et `waygates` hors `SELF_MANAGED`, l'effet central coupe la musique (écoute).
- **Trophées sans coffre** (Darics seuls) : pas de SQL. Un trophée qui recevrait un coffre passerait par
  `chestCatalog.js` + `gen-economy-sql.mjs` + SQL en prod AVANT le code.

## Banc sans compte
`prototypes/sessions/real.html?sc=office` (`sc=travel`, `sc=waygates`) ; `rep=300` pose la réputation des deux mondes
(grade, formats) ; `mode=light`, `skin=<id>`. Le banc journalise ce que la fin de journée envoie à `p.done`
(`[bench] done`).
