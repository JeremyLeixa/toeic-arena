# Tests : ce que chaque garde protège, et pourquoi

> Chargé quand on travaille dans `tests/`. La liste exécutée et une phrase par test : `tests/run.cjs`. Règles générales (test mordant, CI) : `CLAUDE.md` racine, section Commands.

Ce que la suite protège, et pourquoi :

- **`check_rpc_contracts`** — depuis le verrou du 2026-09-15, tout passe par des RPC, et
  le client et le SQL vivent dans deux fichiers que rien ne relie. Une clé de paramètre
  invalide fait refuser l'appel **entier** par PostgREST.
- **`check_profile_roundtrip`** — la règle « fresh() ET supaToLocal ET payload », plus la
  liste blanche de `save_student`. Une colonne hors liste est ignorée **en silence**. Et **aucun champ lu sur
  le profil (`u.X`, `p.u.X` dans `src/`) hors de `fresh()`** : il vivrait en mémoire et en localStorage, jamais
  dans Supabase, et disparaîtrait au premier rechargement (cas vécu jusqu'au 2026-09-19 : les jetons armés,
  brûlés côté serveur puis perdus au retour sur l'onglet). Exceptions listées : propriétés de l'énoncé de
  synthèse vocale (`u` dans `lib/audio.js`), drapeau passager `_shieldPending`.
- **`check_chest_drops`** — `open_chest` ignore silencieusement tout type de
  récompense hors liste blanche.
- **`check_economy_parity`** — le SQL généré (`scripts/gen-economy-sql.mjs`) = les données de `chestCatalog.js`,
  octet pour octet ; le client n'envoie que des identifiants (`buy_item`, `open_chest`), toute source de coffre et de
  Darics émise par le client est connue du serveur, listes de jetons des conversions, et `save_student` toujours
  plafonnée (`_xp_guard`, colonnes `xp_day_*` hors liste blanche). Un prix changé sans régénérer ne casse rien au
  build : la boutique affiche un prix, le serveur en débite un autre.
- **`check_weekly_snapshot`** — l'instantané de fin de semaine part avec la semaine FINIE et son XP. Lues dans un
  `.then()` après la remise à zéro, les valeurs partaient à 0 sous l'étiquette suivante (398 instantanés à 0,
  podium et rapport formateur faussés, jusqu'au 2026-09-24).
- **`check_push_offer`** — la demande de notifications (`lib/pushOffer.js`) : jamais avant la 1re session ni pour un
  visiteur, jamais après un refus du navigateur (définitif : insister épuise), iPhone hors appli à part (sinon trois
  « Got it » privent de la vraie demande), reports 5 j × 3, et le câblage : dernière du budget, après la lettre.
- **`check_identity`** — `normNameForEmail` décide de l'adresse du compte Auth,
  recalculée à chaque connexion. La changer enferme dehors les élèves déjà migrés.
- **`check_fresher_local`** — la garde stale-remote (`lib/staleRemote.js`) : quand la copie
  locale gagne sur Supabase (XP strictement supérieure et actif au moins aussi récemment), avec
  les champs serveur (`class_code`, `access_level`, `access_expires_at`, `email`) toujours pris
  au distant, et jamais pour un autre élève (`fresherLocalFor`). Trop stricte, une progression
  jouée pendant une panne est écrasée ; trop large, un payant repasse free.
- **`check_xp_gates`** — les portes XP (`lib/xp.js` : seuil d'accuracy, trois courbes
  anti-farming, bypass, événements, Focus, boosts, streak, +10, planchers, ligue, coffres)
  sont celles de « XP System » ci-dessous. Un `<` devenu `<=` ne casse pas le build.
- **`check_learner_model`** — le modèle de l'apprenant (`lib/learnerModel.js`) : maîtrise **récente**
  (demi-vie 14 j + prior 6 Q à 60 %), priorité aux **points en jeu** (6 questions de Part 1 contre 54 de
  Part 7) et non à la précision la plus basse, retournement prouvé (deux fenêtres mesurables + 10 jours
  d'écart), chasse exclue de la maîtrise, `cs` posées par `recordModule`. Revenir à `correct/total` à vie
  remet Today's Focus sur une faiblesse déjà corrigée, sans rien casser au build.
- **`check_review`** — le bestiaire (`lib/review.js`) : intervalles 1-3-7 et mort à la 3e réussite
  espacée, force qui ne monte que sur une retombée (sinon l'assiduité est punie), repos des questions
  ratées 3 fois, regroupement par support (un passage Part 7 lu une fois), XP de chasse toujours sous le
  coût d'une erreur volontaire, et **le module `hunt` jamais dans l'estimation TOEIC**.
- **`check_review_lookup`** — les références des 16 autres modules (`lib/reviewRefs.js`, `lib/reviewLookup.js`) :
  chaque item de chaque banque se relit avec la réponse que le module compte juste, même catégorie à la
  capture et à la résolution, options permutées, énoncé qui ne dit pas la réponse, et le câblage (`ref`,
  `mistakesRef.current` jusqu'à `recordMisses`) lu dans le source. Une clé que la chasse ne sait pas relire
  laisse une créature « due » pour toujours, sans erreur nulle part.
- **`check_option_shuffle`** — les QCM des modules (3 épreuves du Gauntlet, Clue Hunter, Audio Blitz, False
  Friends, Traps, Strategy, Gerund/Infinitive) permutent leurs options au montage du deck par
  `lib/util.js shuffleOpts`, sous les clés que le module lit (`o/c`, `opts/ans`, `options/correct`…), et
  GerInf retire son deck à chaque partie. Aucun texte de ces banques ne désigne une option par sa lettre
  ou par « of the above » (exceptions listées avec les lettres permises). Les banques mettent la bonne
  réponse en B ou C huit fois sur dix : un module qui ne permute pas s'apprend par la position. Nouveau
  module QCM → l'ajouter à `MODULES` du test. Section 2b : la banque de grammaire (Drill, Daily, Exam
  Simulation, Word Fall — bonne réponse en B 61 %, en D 4 %), les Mock Tests (Part 6 en A 7 fois sur 8) et
  le Boss (Parts 3-4 jamais en A) passent par `lib/optionShuffle.js` (`shufP5/P6/P7/Qs`) ; leurs explications
  ne citent aucune lettre (exceptions : noms comme « Lot C », « Vitamin D »).
- **`check_planner`** — le plan du jour (`lib/planner.js`) : seuil de la chasse (4 échéances), démarrage
  à froid (< 5 sessions → Battle Scan), quête d'enjeu réservée aux parties mesurées, composition du Drill
  (catégorie visée, catégorie méritée allégée, erreurs dues glissées, **aucune créature tirée au hasard**),
  tendances hebdomadaires seulement au-dessus de 10 questions par semaine, et la **journée figée** (`u.mission` : mission sur la quête 1, série gardée, +25 % sur l'enjeu figé, re-tirage).
- **`check_festivals`** — fenêtres des thèmes saisonniers (`lib/festivals.js`) : bornes
  incluses en heure locale, Pâques, déc → jan, disjonction jour par jour, opt-out > forçage ;
  un paquet `.fest-<id>` + `.light.fest-<id>` par fête dans `appCss.js`, animations existantes,
  `themeColor` = `--bg` du CSS. Une fenêtre fausse change le thème de tous les élèves.
- **`check_skins_light`** — les 9 skins qui forcent un fond sombre sur `.crd` (règle de tokens
  `.skin-X:not(.light),.light.skin-X .crd`, présence dans `.light:where(…) .crd`, tout token de
  `.light` reposé dans la carte, `.btn2` et fonds translucides corrigés en clair). Un oubli ne
  casse pas le build : les cartes deviennent illisibles pour les élèves en mode clair.
- **`check_tones`** — **aucune couleur hex en dur sous 4,5:1 (AA) sur les fonds clairs** dans une
  expression `color:` / `color=` du JSX, sauf passée par `tone()`, sur un fond posé sur la même
  ligne qui la rend lisible à 4,5:1 (ternaires et jetons résolus en clair), ou précédée de
  `/*fond local*/` (fond sombre ou fixe en dur posé ailleurs : tuiles Boss/Endless, parchemin du
  narrateur). Plus : une variante `.light{--tone-<hex>}` (≥ 4,5:1) pour
  chaque couleur de ligue, titre, rareté et chaque couleur passée à `tone()` (littérale ou issue
  d'une source déclarée dans `DATA_SOURCES` : CECRL, fiches de grammaire,
  jauges du Profil, familles du Modal Council) sous 4,5:1 ; aucune variante orpheline ni hors
  clair ; `lg/ti/rarity….color` et `shopRarColor(…)` jamais bruts. Hors périmètre : Onboard,
  TeacherDash, Chests. Une couleur délavée ne casse pas le build, elle disparaît en clair.
- **`check_interruptions`** — le budget d'interruptions (`lib/interruptions.js`) : priorité retournement > promotion
  > Aldric (paliers) > lettre, moments contextuels jamais reportés, et le câblage de `SessionResult` et d'`App()`
  (moment verrouillé une fois affiché, rediffusion hors budget, lettre derrière le budget).
- **`check_listening_items`** — P3/P4 : réplique citée par une question d'intention (« What does the woman mean
  when she says, '…' », « Why does the speaker say, '…' ») présente dans la conversation ou le monologue, locuteurs
  W/M/W2/M2, `voice` P4, graphiques. Réécrire une réplique = **regénérer son MP3** (les scripts sautent un fichier
  existant : le supprimer d'abord). Lot 6 : `generate-audio-p{3,4}-batch6.mjs` (`ONLY=<id>` pour l'échantillon).
- **`check_part7_items`** — la banque Part 7 : mot cité par une question de vocabulaire (« the word 'X' … closest
  in meaning ») et réplique citée par une question d'intention présents dans le passage, insertions de phrase
  (« positions marked [1]… ») avec leurs 4 marqueurs, options `[1]`-`[4]` et `keep:true`, et les **quatre**
  permutations de Part 7 (`shufP7`, `reading.jsx`, `endless.js`, `reviewLookup.js`) qui respectent `keep`.
  Relire un lot neuf : `prototypes/sessions/real.html?sc=p7&p7only=p7p68,p7p71`.
- **`check_import_graph`** voit aussi les `import()` des écrans lazy : chemin, nom exporté,
  et absence d'import statique résiduel (sinon le chunk ne sort pas, en silence).
- **`check_office_day`** — The Waygates (`lib/officeDay.js`, `lib/officeGrades.js`, `lib/worlds.js`). Jet Lag : bulletin
  à 9:00, une seule perturbation après au moins une P3, vivier validé seul, sujets génériques, `travel` dans les mêmes
  listes qu'`office` et trophées qui ne croisent pas les mondes. Front Desk : point du matin à 9:00, un seul client
  mécontent jamais le premier et dont aucune bonne réponse ne dit « complain » (le toast la soufflerait), P3 client /
  collègues habillés selon leur groupe, pas de « Dear … » en objet, libellés et trophées. Règle « prévu = paré »
  générique : écran sans aucun cas particulier par monde, chaque monde déclare tous les textes que l'écran lit. Nine to Five : des centaines de journées tirées
  par grade, chacune dans 9:00-17:00 (un direct finit de sonner avant 17:00, une échéance tombe après l'arrivée), sans
  item en double, au format P7 du grade (double à Associate, triple à Team Lead, et garanti le jour du déblocage),
  sujet de P3 générique (un sujet tiré du contenu trahit la Q1) ; horloge jamais plus clémente en montant ; réputation
  jamais négative et bornée ; XP au palier des 15 Q. Câblage : réponses versées dans lisP3/lisP4/p7 **sans**
  `trackModSession` sur ces clés (sinon une journée taxe les tuiles et coche les quêtes), refs relues par la chasse,
  `office` en liste noire de maîtrise et hors tables de poids, CSS sans couleur en dur (skins), horloge gelée par
  « Leave », App.jsx et la tuile Games jamais sur `officeDay.js` (il importe les banques du chunk lazy).
- **`check_usage_stats`** — l'onglet Usage du formateur (`lib/usageStats.js`, `lib/sessionQuit.js`) : fenêtres
  7/30 j bornes incluses, abandons jamais comptés comme parties, épreuves des hubs ramenées au hub (sinon
  100 % d'abandon), rien d'avant `CAPTURE_START` dans les taux, `doneDays` borné, et le câblage : « Leave »
  confirmé signale l'abandon, le départ sans réponse non. Faux, ces chiffres font retirer un module joué.
