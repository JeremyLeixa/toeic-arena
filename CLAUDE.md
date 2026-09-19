# TOEIC Arena — Project Conventions & Context

## Project Overview

TOEIC Arena is a gamified TOEIC exam preparation web application built by Jérémy Leixa, English trainer at IDRAC Business School (Lyon/Grenoble). Used by ~66 Bachelor 3 students (class code: `idrac2026`) and planned for deployment at other institutions (CESI, professional learners).

The app is a React application **split into modules since the 2026-09-15 refactor** (it was an 18,589-line monolith). `src/App.jsx` (~1,500 lines) holds the root component `App()` alone: global state, effects, XP pipeline, session, chest queue. `src/routes.jsx` is the `sp` → screen table, `src/lib/` the pure helpers (no JSX), `src/components/` the shared widgets, `src/features/<module>/` one folder per screen, `src/styles/appCss.js` the stylesheet. Full story and tooling in `REFACTOR_PLAN.md`. Jérémy is the sole developer; Claude is the technical partner.

**Live URL:** Deployed on Vercel
**Supabase project ref:** `huklmklwvwwhhrrcyytq`
**Current state:** See `CONTEXT.md` at project root for the living state (what's done, what's next).

---

## Tech Stack

- **Frontend:** React 19 + Vite 8 (build tool: Rolldown via Vite)
- **Layout:** `src/App.jsx` (root `App()` only) · `src/routes.jsx` · `src/lib/` (pure, no JSX) · `src/components/` (shared widgets) · `src/features/<module>/` (screens) · `src/styles/appCss.js` (CSS). See Project Structure.
- **Data files:** `src/data/*.js` — content separated by module
- **Backend:** Supabase (PostgreSQL, Realtime for duels, Edge Functions for cron)
- **Hosting:** Vercel (serverless functions at `api/`)
- **Audio:** Web Audio API (SFX/jingles in `src/sounds.js`), pre-generated MP3s via ElevenLabs (stored in `public/audio/`)
- **BGM:** 7 loops generated via Mureka AI (`public/audio/bgm/`)
- **PWA:** `manifest.json`, `sw.js` v3, VAPID push notifications
- **Haptic:** `navigator.vibrate()` progressive enhancement (Android; silent on iOS)

---

## Commands

| Command | Purpose |
|---------|---------|
| `npm run dev` | Vite dev server (localhost:5173) avec HMR |
| `npm run build` | Build production → `dist/` |
| `npm run lint` | ESLint (flat config) |
| `npm run preview` | Preview du build production en local |
| `npm run check:assets` | Vérifie que tout MP3/image référencé par le contenu existe **et** est tracké par git (exit 1 sinon) |
| `npm test` | Suite de tests (25 fichiers, ~9 s, hors ligne). Liste explicite dans `tests/run.cjs` |
| `npm run check:security` | Rejoue le balayage du chantier pentest : tables verrouillées, vecteurs destructeurs, RPC vivantes. **Réseau + `.env` requis**, d'où sa séparation de `npm test` |

**Pas de framework de test** — tout est en Node natif, zéro dépendance. Depuis le
découpage (2026-09-15), les tests **requièrent les modules purs de `src/lib/` en natif**
(`require(esm)` : Node 22 + `"type": "module"`) : `profileSchema.js`, `util.js`,
`endless.js`, `listeningShuffle.js`, `toeic.js`. Plus aucun découpage de texte. Un module
de `lib/` qui se met à importer Supabase casse le test qui le requiert : c'est voulu,
remettre le module pur plutôt que revenir au découpage. Deux gardes protègent la
structure elle-même : `check_symbol_census` (aucun symbole perdu ni dédoublé) et
`check_import_graph` (aucun cycle, sens des couches respecté).

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
- **`check_chest_drops`** — `open_pending_chest` ignore silencieusement tout type de
  récompense hors liste blanche.
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
  d'une source déclarée dans `DATA_SOURCES` : pastilles de Home, CECRL, fiches de grammaire,
  jauges du Profil, familles du Modal Council) sous 4,5:1 ; aucune variante orpheline ni hors
  clair ; `lg/ti/rarity….color` et `shopRarColor(…)` jamais bruts. Hors périmètre : Onboard,
  TeacherDash, Chests. Une couleur délavée ne casse pas le build, elle disparaît en clair.
- **`check_import_graph`** voit aussi les `import()` des écrans lazy : chemin, nom exporté,
  et absence d'import statique résiduel (sinon le chunk ne sort pas, en silence).

⚠️ **Un test qui échoue décrit un vrai problème.** Le corriger, ne pas l'ajuster pour le
faire passer. Et tout nouveau test doit être **prouvé mordant** : introduire l'erreur
qu'il doit attraper, vérifier qu'il rougit, annuler.

Déclenchement manuel pour l'instant : ni hook pre-commit, ni CI.

**À lancer après tout ajout de contenu listening.** Un MP3 manquant ne casse
rien à l'exécution : `playAudioFile()` résout silencieusement sur `onerror`,
l'exercice se contente d'être muet. C'est ce qui a rendu 15 items Part 1
(`p1_44-58`) inaudibles pendant 3 semaines — les images avaient été commitées,
pas l'audio. Le check couvre aussi les chemins **dérivés** dans App.jsx
(`/audio/p1/{id}_{0-3}.mp3`), que rien dans `src/data/` ne mentionne.

---

## Project Structure

```
src/
  App.jsx              — Root component App() only (~1,500 lines): state, effects, XP
                          pipeline (settleSession/sealSession, applyXpGates/addXp pour examens
                          et Duel), session (onboard/recover/logout),
                          chest queue, BGM control, pg() wrapper. BUILD_ID just above it.
  routes.jsx           — renderRoute(c): the 41 `sp` routes, context destructured from App().
                          Heavy screens are `lazyNamed(() => import(...), "Name")` (Phase 5)
  main.jsx             — React entry point + `vite:preloadError` → reload once (stale chunk)
  sounds.js            — Web Audio API synthesized SFX + jingles + BGM
  supabase.js          — Supabase client init
  auth.js              — Supabase Auth (synthetic email, password, reset)
  narrator.js          — Aldric moments · scanEngine.js — Battle Scan CAT
  lib/                 — PURE helpers, no JSX, importable by tests. util, device, audio,
                          listeningShuffle, access, toeic (estimateTOEICScore), league,
                          profileSchema (fresh/supaToLocal/buildSavePayload), persistence
                          (load/save), progress (recordModule, missions, unlocks), endless,
                          teacherSession, push, grimoireExport, feedbackModules,
                          chestLabels, shopCatalog, iconMaps, passageDocs, rarityStyles,
                          xp (gateXp/settleXp : les portes XP, pures — App.jsx n'orchestre
                          que les effets ; tests/check_xp_gates.cjs), festivals (thèmes
                          saisonniers : fenêtres, opt-out, forçage, theme-color),
                          sessionHud (combo, fil d'encre), learnerModel (maîtrise récente,
                          points en jeu, retournements), review (bestiaire des erreurs :
                          boîtes 1-3-7, force, chasse), reviewRefs (clé et catégorie des
                          erreurs des jeux et mini-modules), optionShuffle (options permutées
                          des questions de grammaire et d'examen), mimicXp (base d'XP de Mimic Hunt,
                          −3 par morsure), planner (plan du jour, composition
                          des sessions, semaine, allure, Chronique), mentorVoice (les
                          phrases d'Aldric, anglais, à côté de sessionText)
  components/          — shared widgets: icons (GIcon…), Bar, SpeakBtn, ListeningGraphic,
                          PassageDocs, avatar (renderAv, AvatarMedal), toasts, Tabs,
                          GrimoireReader, NextStepReco, TokenCTAs, legal, PasswordInput (œil),
                          MentorMemory (AldricBrief, AldricRemembers), GrammarSheet,
                          LoadingMark (+ LoadBoundary), lazyNamed (+ preloadLazyScreens)
  features/            — one folder per screen: train/ (grammar, reading, strategy),
                          home/ (Home, Train, Cards, Daily, DailyTip), gauntlet/, modals/,
                          games/, listening/, exams/ (Mock, Boss, Endless), mentor/,
                          league/, chests/, shop/, profile/, narrator/, onboarding/, teacher/
  styles/appCss.js     — the CSS template literal, injected by App.jsx via <style>{CSS}</style>
  data/
    vocab.js           — 920 flashcards, 18 domains
    grammar.js         — 456 Part 5 drill questions
    listening.js       — P1 (43), P2 (175), P3 (70 convos), P4 (60 talks)
    part6.js           — 40 texts, 160 blanks
    part7.js           — 61 passages
    mockTests.js       — Mock Tests 1-3
    bossTestFull.js    — The Final Arena (full TOEIC, 202Q, 7 parts)
    miniGames.js       — Word Families, Connectors, Preps, Ger/Inf, False Friends, Traps
    audioBlitz.js      — 60 Audio Blitz items
    clueHunter.js      — 80 Clue Hunter items
    mimicHunt.js       — 84 items Mimic Hunt (reformulation, 29 / 30 / 25 par palier ; 45 `spoken` pour le mode écoute)
                          + MIMIC_TIERS (3 paliers)
    sentences.js       — 50 Sentence Builder items
    phrasalVerbs.js    — 56 phrasal verbs
    placement.js       — 85 Battle Scan questions + tier levels + mission modules
    achievements.js    — 66 achievements (incl. 16 Gauntlet, 4 Word Tavern, 4 Duel, 4 Modal Council, 4 Mimic Hunt)
    leagues.js         — 7 league tiers + bot competitors
    avatarIcons.js     — Iconify SVG paths for game icons
    chests.js          — CHEST_TYPES, RARITIES, AVATARS, SKINS, trigger logic,
                          NOVICE/EPIC/LEGENDARY_ACHIEVEMENTS lists
    helpers.js         — getLevel(xp) utility
    grammarGauntlet.js — 270 Gauntlet items across 4 arrays:
                          IRREGULAR_VERBS (80), TENSE_CHRONOMANCER (70),
                          PASSIVE_FORGE (60), RELATIVE_WEAVER (60)
    grammarGauntletGrimoire.js — 4 Gauntlet grimoires (Chronomancer,
                          Passive Forge, Relative Weaver)
    gerundGrimoire.js      — GRIMOIRE_GERUND (replaces GerInf Study Mode)
    phrasalGrimoire.js     — GRIMOIRE_PHRASAL (replaces PhrasalDojo Study Mode)
    connectorsGrimoire.js  — GRIMOIRE_CONNECTORS (new, ConnSort intro)
    modals.js              — MODAL_MATCH_BOARDS (15 boards × 5 pairs) +
                          MODAL_SORT_ITEMS (50 sentences, 4 buckets)
    modalsGrimoire.js      — GRIMOIRE_MODALS (7 chapters FR)
    grammarSheets.js       — GRAMMAR_SHEETS (12 fiches Grammar Reference, aussi rendues en
                          place dans la revue de l'Exam Simulation via <GrammarSheet/>)
public/
  audio/
    bgm/               — bgm_home, bgm_speed, bgm_wfall, bgm_duel, bgm_clue,
                          bgm_build, bgm_final, bgm_endless, bgm_tavern,
                          bgm_crypt, bgm_chrono, bgm_forge, bgm_weaver
                          (4 Mureka tracks for Gauntlet sub-modules)
    p1/, p2/, p3/, p4/ — Training listening MP3s
    blitz/             — Audio Blitz MP3s
    boss/              — Boss Test MP3s (P1-P4)
  images/p1/           — Part 1 photos
  icon-192.png, icon-512.png
  manifest.json, sw.js
api/
  push-send.js         — Vercel serverless function for push notifications
supabase/
  functions/
    streak-reminder/   — Daily 20h CET push
    weekly-results/    — Monday 08h CET ranking push
    inactive-reminder/ — Every 3d 17h CET push for 7-30d inactive students
prototypes/
  chest-animations/    — HTML standalone design prototypes (not deployed)
scripts/refactor/      — outillage du découpage : extract.cjs (déplace des déclarations avec
                          imports calculés), review.cjs (prouve un déplacement pur), lintgate.cjs,
                          depgraph.cjs. Réutilisable pour tout déplacement futur.
```

---

## Supabase Tables

| Table | Purpose | Key Columns |
|-------|---------|-------------|
| `students` | All user data | profile, stats, XP, moduleScores, mockResults, `joined_at` (text), `tutorial_pending` (bool), `inactivity_push_sent` (timestamptz) |
| `push_subscriptions` | PWA push endpoints | `student_name`, `class_code`, `subscription` (jsonb), `endpoint` |
| `events` | Teacher-created events | Spotlight, Flash Hour, Underdog |
| `weekly_snapshots` | Weekly stats snapshots | For pedagogical reporting + weekly progression tracking |
| `groups` | Multi-campus class codes | `code`, `name`, `type` (school/pro/visitor), `start_date`, `end_date`, `teacher_code` |
| `chest_log` | History of opened chests | `user_name`, `class_code`, `trigger_source`, `opened_at` |
| `pending_chests` | Unopened chests queue | `user_name`, `class_code`, `chest_type`, `trigger_source` |

---

## Workflow Guidelines

- **Use Plan Mode** (`/plan`) before any structural change (new module, refactor, new Supabase table, anything touching `App()` state or the layering).
- **Use `/compact`** after 3-4 exchanges or whenever Claude seems to lose context on the codebase.
- **Use `/clear`** when switching to a completely different topic.
- **Auto push + pull authorized**: after each commit, push to main and pull on user's main repo automatically. No confirmation needed.

---

## Critical Development Rules

### Architecture (découpage du 2026-09-15)
- **Couches, dans un seul sens** : `data/` → `lib/` → `components/` → `features/` → `App.jsx` / `routes.jsx`. `lib/` n'importe jamais de JSX ; `components/` n'importe jamais `features/` ; une feature n'importe que son propre dossier. `tests/check_import_graph.cjs` refuse tout cycle et tout sens interdit (un cycle ESM donne `undefined` à l'init d'une constante, sans casser le build).
- **`App()` reste le seul détenteur de l'état global** : 28 `useState`, 26 effets, une quarantaine de fonctions internes (`sv`, `settleSession`, `addXp`, `grantChestLocal`, `onboard`, `recover`, `logout`…). Les écrans sont **prop-driven** : ils reçoivent `u`, `done`, `back`, `nav`, `gate`… et ne touchent jamais l'état d'`App()` directement. Pas de contexte React, pas d'extraction des hooks (Phase 4b non retenue) sans décision explicite.
- **Nouveau module = nouveau fichier** dans `src/features/<module>/`, route dans `src/routes.jsx` (voir le skill `add-module`). Ne pas remettre de composant dans `App.jsx`.
- **Écrans chargés à la demande** (Phase 5, 2026-09-16 — bundle principal 3,28 → 1,15 Mo) : un écran lourd s'écrit `var X=lazyNamed(function(){return import("./features/…/X.jsx");},"X");` (`components/lazyNamed.js`), **jamais** avec un import statique à côté (le chunk ne sortirait pas, en silence : `check_import_graph` le refuse, comme un chemin ou un nom exporté faux). Dans `routes.jsx`, même nom local qu'avant (exempt du recensement de symboles) ; dans `App.jsx`, alias `XLazy` (le recensement refuse un `Profile` déclaré deux fois). Le fallback est fourni par `pg()` (`<Suspense fallback={<LoadingMark inline/>}>` + `LoadBoundary` à `key` = route) et par le shell Onboard ; ne pas en poser d'autre. Restent eager : Home (onglet par défaut), les onglets, NarratorOverlay, Chests, `train/grammar.jsx`. `main.jsx` recharge une fois sur `vite:preloadError` (chunk périmé après déploiement) ; `preloadLazyScreens` recharge tous les chunks à l'idle pour la parité hors-ligne.
- **Un fichier `.jsx` n'exporte que des composants** (`react-refresh/only-export-components`, en erreur ici) : constantes → `lib/`, helper de rendu → privé au fichier. Exception connue, comptée à part par `lintgate` : `renderAv` dans `components/avatar.jsx`.
- **Une `var` de niveau module exportée est en lecture seule pour ses importateurs.** Écrire via un accesseur (`setSyncDirty`, `setCachedUserId`, `setListenAudio`, `isAudioAborted`), jamais assigner un import : Rolldown refuse au build.
- **CSS dans `src/styles/appCss.js`** (le `CSS` template literal), toujours injecté par `<style>{CSS}</style>` dans App.jsx : cascade inchangée. Deux CSS locaux privés : `DTL_CSS` (ModalCouncil.jsx), `SBD_CSS` (SentenceBuilder.jsx). Class `.crd` has `background: var(--bg2)` which overrides inline styles.
- **`.onboard-shell` class** overrides the desktop `.app` sidebar margin during onboarding/loading. Required on wrapper and on every Onboard phase div.
- **Data files are read-only at runtime.** All content is imported at build time. No dynamic fetching of question data.

### State & Data
- **Supabase is always the source of truth on load.** `load()` always fetches from Supabase when online.
- **`sv()` calls `save(d)` immediately** on every state change. No delayed sync.
- **Cross-device sync:** Background tabs don't sync to cloud. When visible again, reload from Supabase.
- **Supabase data is cumulative, not time-series.** Weekly deltas require the `weekly_snapshots` mechanism.
- **Upsert on `{onConflict: 'name,class_code'}`** prevents multi-device duplicate profiles.
- **`fresh()` function** initializes a new student profile. Any new field must be added here AND in `supaToLocal` AND `save()` payload. Column names must match Supabase exactly.
- **`mockResults`** stores `mock1`, `mock2`, `mock3`, `boss`. Boss Test saves best score but updates `date` on every attempt.

### XP System
- **Le calcul des portes vit dans `src/lib/xp.js`** (pur : `accuracyGate`, `farmMult`, `isBoostedByEvents`, `spotlightMult`, `gateSteps`, `gateXp`, `settleXp`), testé par `tests/check_xp_gates.cjs`. `settleSession`, `applyXpGates` / `addXp` dans `App.jsx` ne font qu'injecter l'état (`u`, événements, médiane, instant) et exécuter les effets rendus (Darics du Focus, jingles, haptique, toast, coffres). Toute règle ci-dessous se change **dans `xp.js` et dans le test**, jamais dans App.jsx. La table des ligues est injectée (`ctx.leagueOf`) : `lib/league.js` importe Supabase et n'est pas requérable en Node.
- **No daily XP cap.** Diminishing returns per module per day are the anti-farming mechanism.
- **Flashcards give 0 XP.** Reframed as memorization-only tool. Students earn XP on vocabulary via Word Tavern (15Q quiz) instead.
- **Diminishing returns:** Mock tests 100/40/0% per day. Other modules follow standard gates.
- **Accuracy gate:** <30% accuracy → 10% XP, 30-49% → 50%, ≥50% → 100%.
- **TOEIC Progression ranking is the primary bonification metric.** XP Overall is secondary.

### Écran de fin de session commun (`SessionResult`, 2026-09-17)
Proto `prototypes/victory/`, choix de Jérémy **V3 « Verdict d'Aldric »** (tient en mode clair), niveau
dans le parchemin, promotion de ligue en cérémonie « Ascension », examens gardés + cérémonies.
Tous les modules à score (hors Duel, Flashcards, Battle Scan) finissent sur
`components/SessionResult.jsx` ; le skill `add-module` en tient la liste de contrôle.
- **Chiffres réellement versés, étape par étape.** `lib/xp.js` : `gateSteps(base,sc,tot,modId,ctx)` rend
  `{xp, focusHit, steps}` et `gateXp` lui délègue (même calcul, testé : dernière étape = XP versée) ;
  `settleXp` rend aussi ses `steps` (weekend, streak, flash hour, underdog, daily doubler, +10). Libellés,
  verdict et épilogue d'Aldric dans `lib/sessionText.js` (pur). Avant, les écrans rappelaient
  `p.gate()` au rendu, après l'incrément des compteurs du jour : XP affichée ≠ versée.
- **Chaîne dans `App()`** : `settleSession(modId,sc,tot,baseXp,{spotlight})` (portes + settleXp + coffres,
  sans toast ni son, pose `lastSession` et ouvre la session) → stats, `recordModule`, `checkMission`… →
  `sealSession(c,sid)` (ajoute la mission du jour, recalcule niveau et ligue) → `sv(c)` → rend le `sid`.
  Handlers : `miniSession` (mini-modules, Spotlight compris), `drillDone`, `dailyDone`, `gameSession`
  (Speed Match, Word Fall : record et coffres dans `recordGame`, partagé avec `gameDone` du Duel), et
  les handlers en ligne de `routes.jsx` (sbuild, ablitz, clue, hubs Gauntlet/Modal). **Base XP** en
  entrée : les portes ne s'appliquent qu'une fois (bforge, tavern et clue les appliquaient deux fois).
- **Le module** : `mistakesRef` (erreurs à la réponse : `{tag, prompt, yours, correct, why, noBlank?, ref?}`,
  `_____` dans `prompt` pour le trou, « … » dans `correct` pour deux trous). **`ref:{k,cat,part}`** fait
  entrer l'erreur au bestiaire (voir « Mentor qui se souvient ») : le module passe alors `mistakesRef.current`
  en **dernier argument** de `p.done` (`drillDone` 5e, `dailyDone` 3e, `miniSession` 4e, `gameSession` 4e,
  `onModuleDone` des hubs 5e), suivi au plus d'un `extra` posé sur la session (`miniSession` 5e : morsures de
  Mimic Hunt). `sidRef.current=p.done(…)`
  **à la fin de la manche, jamais derrière un bouton** (« Collect XP » perdait l'XP si l'élève quittait),
  puis `<SessionResult session sid name mistakes onContinue onReplay>{extras}</SessionResult>` (`memory` :
  la carte « Aldric remembers », rendue AVANT les leçons ; `session.turn` : cérémonie, voir « Mentor qui se souvient »). Le
  composant n'affiche QUE `session.id===sid` (sinon parchemin « sealing », Continue au bout de 2 s).
  Fin sur minuteur (dernière vie, auto-submit) : envoi dans `useEffect([phase])` + `sentRef`, **placé
  avant tout `return`** (`lintgate` ne fait pas échouer un rules-of-hooks : `npx eslint <fichier>`).
  Record lu dans `p.u` AVANT `p.done` (`sv()` l'écrit tout de suite). Jeux au score : `mode="points"`
  ou `"time"` + `points`/`pointsLabel` ; sans liste d'erreurs (Speed Match), ne pas passer `mistakes`.
- **Hubs internes** (Gauntlet, Modal Council) : `subDone` RENVOIE `onModuleDone(...)` et ne ferme plus
  l'épreuve ; Continue = `closeSession` + retour au hub, Play again = `closeSession` + `playBGM` + `subRun++`
  (clé de l'épreuve). GerInf / PhrasalDojo : Continue → mode hub, Play again → reset (erreurs comprises).
  Ailleurs, Play again = `replaySession` (`runKey` dans la clé du `LoadBoundary` de `pg()`).
- **Tant qu'une session est ouverte** (`openSessionRef`, capturé à l'octroi) : coffres confirmés
  (`deliverChest`), Darics (`grantMarks`) et trophées (`sv`) vont **dans le parchemin**, pas en toast
  (le toast n'est rendu que sur les onglets) ; Aldric attend (`pg()`) ; la route ne relance pas sa
  musique (`if(!lastSession)playBGM(…)`). Quitter la route autrement que par Continue ferme la session
  (effet sur `[sp]`). Plein écran fixe z 150, **jamais dans un `.enter`** (translateY).
- **Examens** (Mock, Boss, Endless) : gardent leur écran de résultats et le toast d'XP ;
  `addXp(gxp,{ceremony:true})` pose une file `examCeremony` (niveau puis ligue, coffre de promotion)
  que `ExamCeremonies` (`components/Ceremonies.jsx`) affiche 1,4 s après, avec son propre jingle.
- Banc sans base : `prototypes/victory/real.html` (vrai composant, scénarios, clair/sombre).

### Hubs vivants (tuiles « Coffre », 2026-09-17)
Proto `prototypes/living-hubs/`, choix de Jérémy **C « Coffre »**. Les listes de Train (Exercises,
Grammar & Vocab, Tips), Games, Listening et Reading rendent `HubTile` + `HubShelf` (`components/HubTile.jsx`).
- **État pur** `lib/hubStatus.js` (`hubItemStatus`, `hubSummary`, `tests/check_hub_status.cjs`) : dernier score
  (`moduleScores[id].history`), progression vers le coffre de maîtrise (50 Q à 80 %), tarif de la prochaine
  partie par `nextRunMult` (`lib/xp.js` : Bypass Token, événements, `farmMult`, testé égal à l'étape « farm »
  de `gateSteps`). Étiquette « ½ XP / Low XP / No XP » seulement quand le tarif baisse.
- **Déclarer l'item** dans la liste du hub : module simple = son `id` suffit ; hub à épreuves = `subs:[…]` +
  `unit:"trials"|"parts"` (Gauntlet, Modal, Listening et Reading dans Exercises : maîtrise agrégée, meilleur
  tarif encore disponible) ; jeu sans précision = `game:"matchEasy"|"wordFall"|"duel"` (record, pas de coffre) ;
  outil sans score = `plain:true`. Liste noire (mocks, boss, daily, csess) → tuile simple.
- Les hubs reçoivent `events` (`activeEvents` d'`App()`, via le contexte des routes pour Listening/Reading) :
  sans, un Flash Hour afficherait « ½ XP » à tort. Étagère à partir de 3 coffres. Précision sous 80 % en gris
  pointillé (l'orange se confond avec l'accent du skin Doré). Banc des vrais écrans : `prototypes/living-hubs/real.html`.

### TOEIC Score Estimator (Chantier A — refonte V2, 2026-06-09)
- `estimateToeic(raw, total)` — piecewise curve, harder to gain at the top. Échelle **section** (5-495), pas un total.
- `estimateTOEICScore(ms, opts)` — **retour structuré** `{total, listening, reading, estimable, evidence, reason?}`.
  - **`estimable`** : `true` (chiffre complet), `"partial"` (une seule section calculable → `total:null`), ou `false` (`total/listening/reading:null` + `reason:"insufficient_data"`). **`total` peut être `null`** : tout call site doit le gérer (un cold-start à 200 trompeur n'existe plus).
  - **Gating A.1** (seuils = décision produit, ne pas toucher sans validation) : Reading exige ≥80 Q cumulées sur les modules contribuant au Reading, Listening ≥40 Q, **OU** ≥1 Mock complété (débloque + sert d'ancrage).
  - **Sections normalisées proportionnellement** (`wSum/wTot`). ⚠️ NE PAS revenir au hack `wSum+=(1-wTot)*0.01` : il écrasait le Reading des profils à couverture partielle (défaut historique "Reading 8/495").
  - **Reading backbone** (A.2) : drill .22, p6 .15, p7 .18, wordfam .06, connsort .06, prepdrill .05, gerinf .05, falsefr .04, pvdojo .04, sbuild .04, gauntlet(moy 4) .11.
  - **Reading support (Chantier B, 2026-06-10)** — poids FAIBLE, garde-fou validité (backbone dominant) : tavern .05, clue .04, traps .04, modals(moy match+sort) .04, bforge .03, timesim .03, stratquiz .02, daily .03. Principe : tout module à précision réelle qui donne de l'XP bouge le score (exceptions : Flashcards 0 XP + jeux d'arcade sans précision).
  - **Listening** (A.3) : lisP1 .18, lisP2 .27, lisP3 .25, lisP4 .22, ablitz .08 ; support **mimic_listen .04** (Mimic Hunt à l'oreille, 2026-09-19).
  - **Groupe mock** (débloque l'estimation + bonus asymétrique) : mock1, mock2, boss, **endless** (Endless = full TOEIC, ajouté Chantier B).
  - **`MODULE_TOEIC_MAP`** (juste avant `partOfModule`) = source unique module→{part,section,score}, consommée par partOfModule + partAccuracies (Mentor/Focus). Fix Chantier B des ids falsefr/pvdojo/ablitz qui étaient invisibles au Mentor.
  - **Export CSV** : itère `EXPORT_MODULES` (superset, PAS `MISSION_MODULES`) → toutes les colonnes modules présentes depuis le 2026-06-10.
  - **A.5 v2 — retenue bayésienne** (2026-09-15, remplace `confW`) : `section = (wSum + PRIOR_K×PRIOR_ACC) / (wTot + PRIOR_K)` avec `ew = w × q/(q+EVID_HALF)`, `EVID_HALF=30`, `PRIOR_K=0.12`, `PRIOR_ACC=0.60`. ⚠️ **NE PAS revenir à `wSum/wTot`** : l'ancien `confW` apparaissait au numérateur ET au dénominateur, donc il se **simplifiait** — 4 questions justes sur 4 valaient 300 questions à 100%, et 1 module sur 23 suffisait à afficher Reading 495/495. C'est le `+PRIOR_K` qui fait que couverture et volume comptent. Effet : au-dessus du prior un profil mince descend, en dessous il monte.
  - **Bonus mock asymétrique (Kamel-safe)** : `+(acc−0.60)×100` **points** par mock >60%, cap **+40 pts** (`MOCK_BONUS_MAX`). ⚠️ Il était **multiplicatif** (`×(1+bonus)`, cap +20%) : +18% sur un total de 843 donnait 995 → plafonné à 990, donc **82,5% de précision suffisaient à afficher 990** (signalé par un étudiant iabd2627 le 2026-09-15). Additif, la sur-perf mock reste récompensée sans saturer l'échelle. Ne pénalise toujours jamais une mauvaise perf mock.
  - **Validation vivante** : `tests/validate_toeic_shrinkage.cjs` compare l'estimateur de `HEAD` à celui du working tree (aucune copie de l'algo maintenue dans le test) sur les pathologies + la cohorte réelle. ⚠️ `validate_toeic_estimation.cjs`, lui, embarque **sa propre copie** de l'algo Chantier A : c'est un artefact de calibration historique, il ne teste PAS le code de prod.
  - **A.4 ancrage Boss** : si `opts.bossToeic` (= `mockResults.boss.toeicEstimate`, échelle 990) fourni → `0.60×bossToeic + 0.40×estim_modules`. ⚠️ **DORMANT (audit 2026-06-10)** : aucun call site ne passe `opts.bossToeic` — à câbler depuis les vues "score perso" ou à retirer. Non validé numériquement (aucun Boss dans la cohorte IDRAC T2).
  - **Validation** : `tests/validate_toeic_estimation.cjs` (corrélation + cas-test sur CSV cohorte). (`verify_patched_estimation.cjs` supprimé 2026-06-10 — il lisait `src/App_patched.jsx` qui n'existe plus.) Patch de prod : `scripts/patch_chantier_A_toeic_estimation.cjs` (idempotent, écrit `App_patched.jsx`).
  - **Critère d'évidence** : porte sur les **questions alimentant une section TOEIC**, PAS sur toutes les questions hors-flashcards (le Clue Hunter, par ex., ne donne aucun signal de section → ne débloque pas l'estimation).

### Flashcards
- **Flashcard accuracy is NOT a performance metric.** SRS self-evaluation, not right/wrong.
- **Flashcards give 0 XP.** Reward for vocabulary knowledge happens in Word Tavern.
- **Battle Scan does NOT populate moduleScores.** Only `u.battleScan` holds placement results. The old code that wrote scan answers to moduleScores triggered false "Explorer" achievement — removed 2026-04-17.

### Word Tavern 🍺
- Route `sp==="tavern"`. 15 questions per session, 3 types (def→word, word→def, fill-in-blank).
- Distractors picked from SAME vocabulary domain as the correct card.
- **Failed words auto-reset in SRS** (`cardStates[id] = {ease:2.5, interval:0, nextReview:today()}`) → they come back in next flashcard review.
- BGM: `bgm_tavern.mp3`.

### Chest System
- **`ChestEarnedToast`** at grant moment (bottom-center, above tab bar). Queue (FIFO) + anti-interruption during tests (boss/endless/mock) + queue dispatcher useEffect. **Exception** : un coffre gagné pendant qu'un écran de fin est ouvert s'affiche dans le parchemin (`deliverChest`, voir « Écran de fin de session commun »).
- **`ChestOpenModal` v3 « Crack & Cards »** (2026-09-16, proto `prototypes/chest-animations-v3/`) — chute du coffre, **3 taps** (appui long = ouverture directe) dont la lumière annonce la **meilleure rareté du butin** (peut sauter d'un palier), couvercle qui bascule, puis récompenses en **cartes face cachée** à retourner (inspection + flip 3D, reflet holo Epic/Legendary), « Reveal all », **récap** (meilleur objet en vedette) → Collect all. Skip à tout moment.
  - **Découpage** : `Chests.jsx` rend le squelette et relaie les événements ; `chestSequence.js` = moteur impératif (Web Animations API sur refs, garde `gen` contre les séquences périmées) ; `ChestCards.jsx` (cartes, tuiles) ; `components/particles.js` (particules canvas `createChestFx`, une instance par modal ; partagé avec l'écran de fin de session) ; `chestTheme.js` (couleurs, fond sombre fixe : hex bruts + marqueurs `/*fond local*/`, jamais `tone()`) ; sons `playChest*/playCard*/playLoot*` + `duckBGM` dans `sounds.js`.
  - **Ordre et regroupement** dans `lib/chestReveal.js` (pur, `tests/check_chest_reveal.cjs`) : monnaies sur une carte, tokens sur une carte, puis chaque objet à rareté seul, du moins au plus rare. Badge = rareté de l'**objet** (les cheat sheets en ont une), jamais celle du coffre.
  - ⚠️ **`onOpen` part au montage** (la V2 attendait 2 s), **une seule fois** (`openedRef` : StrictMode remonte le modal en dev, un second `doOpenChest` retaperait la RPC). Si les 3 taps précèdent le résultat, le coffre « résiste ». `result.ok!==true` → message d'erreur, aucune carte (rien n'a été crédité, voir `doOpenChest`) ; 15 s sans réponse → message provisoire.
  - ⚠️ `.chx-stage` en **`overflow:clip`** : les rayons (1000 px) débordent et un conteneur `hidden` reste défilable par programme (la scène glissait de ~190 px). `linear()` passé à `animate()` lève une TypeError sur Safari < 17.2 : détection + repli `cubic-bezier` dans `chestSequence.js`.
  - Banc de test sans base ni compte : `prototypes/chest-animations-v3/app-harness.html` (serveur Vite `festival-proto`, port 5606), vrais composants en StrictMode, réseau normal/lent/muet/échec, mouvement réduit, mode clair.
- **`TreasureChestSvg tier`** (0 Novice bois et corde · 1 Warrior acier bleui · 2 Champion bronze runique · 3 Legendary obsidienne et or) : même SVG pour le toast, le modal et le bouton de Home, calques `chx-lid/chx-lid-int/chx-mouth/chx-seam/chx-lock` animés par le modal.
- **Bouton « Treasure Chest Available » de Home** (2026-09-17) : montre le coffre du palier le **plus élevé** de la file (`pendingChestTier`, calculé dans `App()` sur `chestPending` via `CHEST_TIER` : Home ne peut pas importer `features/chests/`), teinte du palier dans `.home-chest.tN` (`appCss.js`, triplets rgb = `CHEST_TOAST_COLOR`), pastille ×N. L'ouverture reste FIFO (`chestPending[0]`).
- **`getTriggerLabel(trigger)`** converts trigger IDs to human FR/EN labels (e.g. `mock_1` → "Mock Test 1 completed", `daily_login_2026-04-27` → "Daily login reward", `mastery_drill` → "Module mastery: drill").
- **Legendary differentiation**: 400ms gold radial flash before toast + shimmer sweep on toast + 12s display.
- **Teacher account CAN receive chests** (GHOST_NAME filter is only for TeacherDash student list — NOT for chest grants, despite older CLAUDE.md wording).

#### V2 reward types (since 2026-04-27)
- **Avatars / Skins** : V1 cosmetics (player_rewards table, equipped via `students.skin_id` / `u.avatar`)
- **Frames** : avatar borders/glow CSS (player_rewards `reward_type='frame'`, equipped via `students.frame_id` / `u.equippedFrame`). 8 entries in FRAMES.
- **Titles** : text label under name (player_rewards `reward_type='title'`, equipped via `students.title_id` / `u.equippedTitle`). 12 entries in TITLES.
- **Cheat Sheets** : codex pages rendered via GrimoireReader wrapping (player_rewards `reward_type='cheat_sheet'`). 3 stubs in CHEAT_SHEETS V1, more content authoring deferred.
- **Tokens** (stackable consumables) : 7 types in TOKEN_TYPES, stored in dedicated `player_tokens` table (composite PK user×class×type, qty, cap-aware via `grant_token` / `consume_token` SQL helpers). `diminishing_bypass` (cap 5), `streak_shield` (cap 3, **passive auto-consume** at load if 1-day gap detected), `daily_reroll` (cap 1, clickable from Collection → moves the mission to the next quest of the frozen plan, see « Mentor qui se souvient »), `mock_reset` (cap 2 — semantic deferred), `boss_reset` (cap 1, in-context CTA on Train Mocks → arms `u.boosts.bossResetArmed` → bypasses canUnlockBoss 24h cooldown), `endless_resurrect` (cap 2, in-context CTA → arms `u.boosts.endlessResetArmed` → bypasses getEndlessState cooldown). **Tout jeton armé vit dans `u.boosts`** (jsonb persisté, depuis le 2026-09-19 : `bypassArmedModule`, `bossResetArmed`, `endlessResetArmed`, `mockResetArmed`, comme les boosts Daric) : au haut du profil, le drapeau n'allait dans aucune colonne et le jeton, déjà consommé par `consume_token`, était perdu au rechargement, `insight_token` (cap 3, drops 30% on Légendaire ; consumed from Collection → `insightText`, stored in `review.insights`, reread in the Mentor's Chronicle).

#### V2 segmented drop tables (DROP_TABLES in chests.js)
- **Novice** : 50-150 XP + 1 token (Bypass/Shield/Reroll)
- **Guerrier** : 200-400 XP + 1 cosmetic (frame OR title) + 2 tokens (non-premium)
- **Champion** : 500-800 XP + 1 cosmetic (avatar/skin/frame/title min rare) + 3 tokens (Bypass/Reroll/Mock/Endless)
- **Légendaire** : 1000-1500 XP + 1 cosmetic legend (avatar OR skin) + 1 cosmetic epic+ (frame OR title) + 3 tokens (Bypass/Reroll/Mock/Boss/Endless) + Cheat Sheet guaranteed + 30% Insight Token

#### V2 anti-frustration system (Conversions)
- When the user owns the full pool of a cosmetic type, `pickRewards` drops a **duplicate** instead of the XP fallback (`{type, id, rarity, duplicate:true}`).
- Profile → **Conversions** sub-view exposes : "3 doublons → 1 token" (requires count ≥ 4 and only deletes 3 rows so the original is **always preserved** — see `feedback_destructive_action_safety.md`) and "5 tokens non-premium → 1 token premium". Helpers : `convertCosmeticDups`, `convertTokensToPremium`.

#### V2 recurring chest sources (5 triggers added 2026-04-27 step 2)
- `daily_login_<today>` (Novice) — streak ≥ 1, anti-spam via unique trigger (date in id)
- `weekly_toeic_<wkId>` (Guerrier) — +25 pts TOEIC vs last weekly_snapshot (recomputed via `estimateTOEICScore`)
- `podium_<prevWk>` (Guerrier) — top 3 of class_code on the just-finished week (from `weekly_snapshots.xp_this_week`)
- `mission_streak_<n>` (Guerrier) — when `u.mission.streak` (in jsonb) crosses a multiple of 7. Reset on missed day at load.
- `mastery_<modId>` (Champion) — once per module at total ≥ 50 Q && correct/total ≥ 0.8. **Blacklist** : `mock1/2/3, boss, daily, csess` (already covered by other triggers or non-progressive activities). Seuils et liste noire vivent dans `lib/hubStatus.js` (`MASTERY_Q`, `MASTERY_ACC`, `MASTERY_BLACKLIST`, `isMastered`), lus par le watcher d'`App.jsx` ET par les tuiles des hubs : ne jamais les recopier ailleurs.

#### V2 useEffect anti-loop pattern (CRITICAL — see `feedback_useeffect_dep_by_ref.md`)
The Module Mastery watcher used `[u && u.moduleScores]` as deps, which changes reference on every `sv()` (because `u` is JSON-cloned each save). Each chest opening triggered `sv` → re-fire → 10+ parallel `grantChestLocal` calls → race against `hasUniqueTrigger` before `chest_log` writes were visible → duplicate `pending_chests` rows, runaway loop, +37k phantom XP. **Fix** : per-modId `useRef` guard so each module is attempted at most once per mount. Apply this pattern to any V2 watcher that depends on a JSON-cloned object.

#### V2 schema migrations
SQL applied in production via `supabase/migrations/2026-04-27_chest_redesign_v2.sql` :
- New table `player_tokens` (composite UNIQUE on user×class×type, RLS off in line with siblings)
- `grant_token(user, class, type, amount, cap)` SQL function : cap-aware UPSERT
- `consume_token(user, class, type, amount)` SQL function : decrement with sufficiency check
- `students.frame_id`, `students.title_id` columns (mirror skin_id pattern)
- `chest_log.reward_type CHECK` relaxed to allow `multi/frame/title/cheat_sheet/token`
- `player_rewards.reward_type CHECK` relaxed to allow `frame/title/cheat_sheet`

### Teacher Account
- The `Teacher` account syncs to Supabase but is **hidden from all leaderboards** (League, TeacherDash student list).
- `GHOST_NAME="Teacher"` filter is applied in: TeacherDash student list queries, League rankings. NOT applied to chest grants.
- **Teacher student row lives on `class_code='teacher-internal'`** (permanent group, `end_date=NULL`) — decoupled from any student cohort since 2026-04-17. This insulates Jérémy's account from cohort cutoffs (e.g. `idrac2026` ending 2026-06-28).
- Teacher dashboard login still uses `groups.teacher_code` (currently `arena-teacher-2026` on `idrac2026`). This is independent of the Teacher student row's class_code.

### Listening (Boss Test — TOEIC Faithful)
- **P1:** Photo + blind A/B/C/D. Student can answer DURING audio.
- **P2:** Blind A/B/C. Student can answer DURING audio.
- **P3/P4:** Preview questions BEFORE audio. Answer after.
- **P5-P7:** Text + options, no audio.

### Boss Test — The Final Arena
- **Options permutées de façon FIGÉE par item** (Part 2 : `BOSS_P2_SHUF` ; Parts 3 à 7 depuis le 2026-09-18 :
  `lib/optionShuffle.js` avec `seedFromId`, `seededShuffleOpts` au pas 0.67) : la reprise de session relit des
  réponses rangées par index, un tirage par ouverture les désalignerait. Toute nouvelle disposition → bumper
  `BOSS_LAYOUT_V` (3 depuis le 2026-09-18), sinon une session reprise lit ses réponses de travers. Mock Tests :
  tirage neuf à chaque passage (pas de reprise). Part 1 laissée dans l'ordre de ses clips (déjà répartie).
- Unlocked after completing Mock Tests 1, 2, and 3.
- 202 questions, 120 min timer, Listening first then Reading.
- 24h cooldown. Best score preserved.
- XP: 100 base + 3 per correct + bonus at 600+ and 800+.
- Achievements: "Arena Conqueror" 🐉 (complete) + "Dragon Slayer" 🔥 (800+).
- BGM: `bgm_final.mp3`.

### Endless Arena ⏳
- Unlocked after Boss Test with ≥650 TOEIC. 24h cooldown.
- Random full TOEIC test generated from all content pools.
- Results screen shows weakness reco + suggested next module.
- BGM: `bgm_endless.mp3`.

### League System
- 7 tiers: Bronze (0) → Silver (200) → Gold (600) → Platinum (1500) → Diamond (5000) → Champion (10000) → Légende (30000).
- `getEffectiveLeague()` requires TOEIC estimated score ≥ 400 to display Légende.
- Season structure S1-S4, weekly snapshots, 3 tabs: Semaine, Général, Progrès.

### Festival themes 🎃 (2026-09-16)
- **Mécanisme** : pendant une fenêtre, `App.jsx` pose `fest-<id>` **à la place** de `skin-<id>` sur `.app` (ligne `lc`). `u.equippedSkin` / `skin_id` jamais touchés, le skin revient seul. Jamais de superposition : 13 skins sur 16 tiennent `.crd::before/::after` en `!important`. Gardé par `u` comme le skin → l'onboarding reste canonique. Avatar, frame, titre intacts.
- **Nom `festival`, jamais `season`** (la Ligue S1-S4 et `seasons` jsonb l'ont déjà).
- **4 fêtes** (`FESTIVALS`, `src/lib/festivals.js`) : `halloween` 24/10→2/11 · `yule` 14/12→4/1 · `spring` Pâques −5→+1 (Meeus) · `solstice` 19→28/6. Dates **locales**, bornes incluses (pas `today()`, qui est UTC). `festId` (état primitif d'`App()`) relu par un tick horaire : la bascule arrive sans rechargement.
- **CSS** : paquets `.fest-<id>` / `.light.fest-<id>` après les `.skin-*` dans `appCss.js`, collés tels quels depuis `prototypes/festival-themes/festivals.css` (palettes validées par Jérémy, ne pas les retoucher sans son feu vert). Aucun keyframe propre. En clair, fond pâle propre à la fête (contrairement aux skins).
- **Opt-out** localStorage `toeic-festivals` = `off` (patron `toeic-sound`), pas de colonne Supabase. **L'opt-out gagne toujours**, forçage compris. Surfaces : lien « Turn off » du bandeau Home, toggle « Seasonal themes » dans Profil → Style (visible pendant la fenêtre même désactivé). `setFestivals(on)` dans `App()` relit tout de suite.
- **Forçage de test** : `?fest=<id>` (ou localStorage `toeic-fest-force`) lève la fenêtre de dates ; `?fest=none` retire la fête pendant une vraie fenêtre. Hors fenêtre, dates et jours restants sont ceux de la prochaine occurrence.
- **Surfaces** (anglais) : message d'accueil `greeting` au lieu de « Welcome back », bandeau Home sous les pastilles (fin, jours restants, Turn off), bandeau Profil → Style. `meta[name=theme-color]` (les 3 d'index.html) suit la fête et le mode, hors fête `#0f0c08` / `#f5f0e8` : `themeColor` recopie le `--bg` du CSS, le test vérifie l'égalité.
- **Ajouter une fête** = une entrée `FESTIVALS` (icône dans `GAME_ICON_PATHS`, `themeColor`) + ses deux paquets CSS ; `check_festivals` refuse tout oubli et tout chevauchement. Lot 4 non décidé : BGM `bgm_home_<fest>`, coffre `fest_<id>_<année>`, cosmétique exclusif, mention Shop (un skin acheté pendant une fenêtre ne se voit qu'après).

### Haptic Feedback
- `haptic(key)` dispatches to `navigator.vibrate()`. Silent on iOS.
- Patterns: chest, chestOpen, levelUp, achieve, league, pb, streak, complete.
- Triggered at: achievement unlock, league promotion, level up, streak milestones, chest open, mock/boss/endless completion, Endless PB.

### BGM Control (centralized)
- Central useEffect in main App watches `sp` and `tab`. Stops BGM on entry to audio routes (lis, lisP1-P4, ablitz). Restores `bgm_home` on return to home/league/profile without subpage.
- `SELF_MANAGED` routes that handle their own BGM: boss, endless, matchE, wfall, duel, sbuild, clue, tavern, **gauntlet**, modals, bforge, shop, **mimic**. These are excluded from centralized control. `npm run check:assets` vérifie depuis le 2026-09-19 que chaque `"bgm_x"` nommé dans `src/` existe et est suivi par git.
- Routes à écran de fin commun : `if(!lastSession)playBGM(…)`, sinon la musique repart sous le parchemin à chaque rendu.
- Auto-start on first user interaction: only triggers `bgm_home` if `tab==="home" && !sp`.

### Grammar Gauntlet 🛡️ (S2 major feature, delivered 2026-04-22)
- Route `sp==="gauntlet"` → `GauntletHub` component.
- 4 sub-modules rendered via internal `subMode` state: `"irregular"` (IrregularCrypt), `"tense"` (Chronomancer), `"passive"` (PassiveForge), `"relative"` (RelativeWeaver).
- `onModuleDone(subId, sc, tot, xp)` prop bubbles completion to App, which runs `settleSession("gauntlet_"+subId, …, {spotlight:true})` → stats → `recordModule` → `checkMission` → `grantWeeklyChest` if perfect → `sealSession` → `sv`, and **returns the session id**. The sub-module shows `SessionResult` itself (Continue → hub, Play again → `subRun` key).
- Each sub-module has its own BGM: `bgm_crypt` / `bgm_chrono` / `bgm_forge` / `bgm_weaver`.
- Content pool: 270 items total (80/70/60/60). Session size 15 everywhere.
- TOEIC estimator: reading section has a new `gauntlet` weight of 0.15 (avg accuracy across the 4 sub-modules).

### Modal Council ⚖️ (S2 module, delivered 2026-04-30)
- Route `sp==="modals"` → `ModalCouncilHub` component.
- 2 sub-modules : `"match"` (ModalMatch — tap-to-pair, 3 boards × 5 pairs = 15 items) + `"sort"` (ModalSort — tap-to-bucket among 4 functions: Obligation / Advice / Possibility / Deduction).
- Same `onModuleDone(subId, sc, tot, xp)` pipeline as Gauntlet (session id returned, `SessionResult` in the sub-module) → `recordModule("modals_"+subId)`.
- **First app-wide use of the tap-to-pair UX pattern** (precedent for future drag/drop-style activities without HTML5 DnD lib — mobile-first, zero dependency).
- BGM **placeholder**: both sub-modules currently wired to `bgm_chrono`. Generate 2 dedicated Mureka tracks and replace in `ModalCouncilHub` `cards` config.
- Content pool: 15 boards × 5 pairs (75 Match items) + 50 Sort items in `src/data/modals.js`. Session: 15 items everywhere (Tier B XP).
- Single grimoire (`GRIMOIRE_MODALS`, 7 chapters FR) accessed from the hub.
- 4 achievements added (council_initiate / oracle_voice / verdict_sworn / council_crowned).
- TOEIC estimator: NOT wired in yet (deliberate — no rebalance until next pass).

### Mimic Hunt 🪤 (2026-09-17)
Route `sp==="mimic"` (Games). Entraîne **la reformulation** : la bonne réponse dit la même chose avec
d'autres mots, le **Mimic** recopie des mots de la source pour dire autre chose. Le Traps Quiz et une
Strategy Card énonçaient déjà la règle ; aucun module ne l'entraînait, alors qu'elle porte les Parts 3,
4 et 7 (123 questions sur 200) — et la Part 7 n'avait aucun jeu. Proto et comparateur des mécaniques :
`prototypes/mimic-hunt/` ; banc du vrai module sans compte : `prototypes/mimic-hunt/real.html`.
- **Une manche = un tap** (variante 3 « révélation », choix de Jérémy le 2026-09-18 ; la variante 2
  « double marque », réponse ET Mimic puis Check, livrée le 2026-09-17, était trop lente) : la réponse
  part au tap, les Mimics se démasquent d'office au retour.
- **Au retour, sobre** (variante C « au tap », choix de Jérémy le 2026-09-19, proto
  `prototypes/mimic-hunt/calm.html` ; l'écran d'avant disait tout trois fois, avec fonds, ondulations,
  bordures pointillées et une icône par Mimic) : **rien n'est souligné** — juste, faux, un mot « Mimic »,
  l'icône seulement sur celui qui a mordu. Un tap sur une option souligne ses liens dans la source ET
  dans cette option seulement (vert plein = même sens, pointillé rouge = mots recopiés, tirets gris = mot
  gardé), un second tap efface. « The paraphrase » garde l'explication et le piège ; les reformulations
  sont repliées (« Show the rewordings »). Soulignés seulement, jamais de fond coloré.
- **Paliers** annoncés avant leurs items (I Synonyms → II Reshaped → III Big picture) : la progression
  est la pédagogie, elle ne se mélange pas. Les items sont mélangés **dans** leur palier (5 tirés par
  palier au plus, `PER_TIER` : 15 par partie quand la banque le permet) et les 4 options permutées à
  chaque partie (sinon on rejoue « la réponse C ») — donc **aucun texte ne cite une lettre** : les pièges
  citent l'option (`check_option_shuffle` scanne `MIMIC_ITEMS` depuis que 11 pièges disaient « A recycles… »).
- **Rédaction des items** (`src/data/mimicHunt.js`, gardée par `tests/check_mimic_items.cjs`) : tout tient
  sur des **fragments** retrouvés en mots entiers, sans casse (`bridge`, `echo`, `mimics`) — un mot réécrit
  et le surlignage disparaît en silence. **84 items** (29 / 30 / 25 par palier : 12 pilotes + 48 relus par Jérémy
  le 2026-09-19 + le lot 4 « parlé », 24 items relus le même jour), bonne réponse 21 fois en A, B, C et D. 2 Mimics par item sauf cinq (un seul), des
  distracteurs neutres qui ressemblent à des reformulations, et **cinq items gardent un mot de la source
  dans la bonne réponse** (mh12, mh18, mh22, mh35, mh59, mh72) : la règle n'est pas « mot repris = faux » mais
  « mot repris qui dit autre chose ».
- **XP** : `15 + 5×bonne réponse`, +25 sans faute (115 pour 15 items, palier des 15 Q ; le `+2×Mimic
  démasqué` de la variante 2 a disparu avec elle), **−3 par morsure** (choix de Jérémy du 2026-09-19,
  `lib/mimicXp.js`) : la morsure coûte, pas l'erreur neutre (mordre = associer des mots sans lire le sens,
  le réflexe visé). Le coût reste dans la partie : base jamais sous les 15 de participation, rien de repris
  sur l'XP acquise (un compteur qui baisse fait lâcher le module). Morsures et retenue **réelle** (plancher
  compris) voyagent par l'`extra` de `miniSession` (5e argument → `settleSession` → session) jusqu'au
  parchemin : « 9 correct · 5 bites −15 » (`sessionText.stepDetail`) — une base réduite sans la mention
  passe pour une erreur de calcul. Gardé par `check_mimic_items` (formule, plancher, libellé, câblage). **Estimateur** : Reading support `.04`, `part:null` dans `MODULE_TOEIC_MAP` (la reformulation sert
  P3/P4/P7 : la ranger dans p7 fausserait le diagnostic du Mentor).
- **Coffre de maîtrise lié à la taille de la banque** : exclu (`MASTERY_BLACKLIST.mimic`) du 2026-09-18 au
  2026-09-19, quand chaque partie rejouait les 12 items (5 parties apprises par cœur donnaient le coffre
  Champion), rendu à 60 items. `check_mimic_items` exige l'exclusion sous 45 items et son absence au-delà.
- **Nouveaux items : toujours relus par Jérémy avant d'entrer au jeu.** Lot en projet dans
  `prototypes/mimic-hunt/drafts/`, contrôlé par `node tests/check_mimic_items.cjs <lot.js>…` (mêmes
  contrôles par item, identifiants distincts de la banque), relu sur `prototypes/mimic-hunt/review.html`
  (tout visible : pont, recopies, mot gardé ; `?tier=2`), puis versé dans `src/data/mimicHunt.js`.
- **Trophées** (2026-09-19, sans coffre, comme Word Tavern et Modal Council ; 30 Darics chacun) : Mimic
  Spotter (1re partie), **Unbitten** (une partie de 15 sans morsure : la compétence du module, erreurs neutres
  permises), Paraphrase Master (15/15), Mimic Slayer (80 % sur 60 Q). Unbitten lit `bites` dans l'entrée
  d'history, posé par `recordModule` (6e argument `more`) depuis l'`extra` de `miniSession` : les parties
  d'avant ne comptent pas. Mimic compte aussi dans « Game Master ».
- **BGM `bgm_mimic`** (piste Mureka du 2026-09-19, prompt archivé dans la mémoire des BGM). Module **SELF_MANAGED** :
  il joue la piste lui-même (effet sur la phase), la route n'y touche pas. Hors de la liste, l'effet central d'App()
  coupait la musique juste après que la route l'avait lancée (silence, puis retour au rendu suivant). Coupée en mode écoute.
- **Mode écoute** (variante A « aperçu », choix de Jérémy du 2026-09-19, proto `prototypes/mimic-hunt/listen.html`) : la
  source d'un item `spoken` s'ENTEND (en Parts 3 et 4, le distracteur classique reprend un mot de l'enregistrement).
  Deux portes sur l'intro (Read / Listen). Question et réponses lisibles avant l'écoute (consigne des Parts 3 et 4) mais
  **verrouillées jusqu'à la fin de l'enregistrement** (répondre au premier mot reconnu, c'est mordre), une réécoute
  (`REPLAYS`), puis la transcription et le retour habituel. **Module `mimic_listen`** (même route : `extra.modId`, lu par
  `miniSession`) : Listening `.04`, ses propres stats et courbe anti-farming, coffre de maîtrise exclu sous 45 sources
  parlées (`check_mimic_items`) et rendu depuis le lot 4 ; au-delà, le test exige aussi la tuile Games en
  `subs:["mimic","mimic_listen"]` (`unit:"modes"`, « 1/2 modes mastered »). Trophées et « Game Master » comptent
  les deux modes ; les erreurs gardent la `ref` `mimic:<id>` (la chasse les repose à l'écrit). « Play again » repart
  dans le même mode (`replayMode`). Clips `public/audio/mimic/<id>.mp3` (`node scripts/gen-mimic-audio.mjs --all`,
  voix `mimicVoice` de `lib/listeningVoices.js` : genre de `voice` / `speaker`) ; `check:assets` et `check_mimic_items`
  exigent chaque clip — un clip absent ne se voit pas, les réponses se déverrouilleraient sans rien faire entendre.
  **45 sources parlées** (15 par palier) depuis le lot 4 « parlé » (mh61-mh84, relu et versé le 2026-09-19).

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
  2026-09-17). Home : un seul bandeau d'une ligne sous la carte Niveau/Ligue (créneau `path` de `pulseSlot`),
  qui ouvre la feuille (`openPath` → `sSPA("path")` → `Mentor initialSheet`). `Tabs badge="mentor"` tant que la
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

### Grimoire pattern (applies to Gauntlet + G&V grimoires)
- **Data format** per grimoire: `{id, title, subtitle, readingTime, icon, chapters: [{id, title, intro, blocks: [...]}]}`.
- **Block types** consumed by `<GrimoireReader/>`: `paragraph`, `heading`, `rule` (formula/label), `example` (en/fr/note), `trap` (red warning), `table` (headers+rows), `list`.
- **One idea per chapter** — mobile-readability rule. Repaginate dense chapters into short ones.
- **Grimoires stay in FR** (language policy: theory = FR for francophone learners, chrome = EN).
- **Replacing Study Mode**: when a G&V module has a Study Mode and theoretical content, replace the Study Mode entirely with a grimoire (GerInf + PhrasalDojo pattern). Don't keep both.
- **Reader component**: shared `<GrimoireReader grimoire={...} back={...}/>` + `renderGrimoireBlock` helpers. Parchment styling, CSS 3D flip animation, TOC drawer, roman numeral page numbers.
- **Page number placement**: the `.grim-page-num` must live INSIDE `.grim-page-content` with `margin-top:auto` (flex column with `min-height:100%`). Avoid `position:absolute;bottom:X` — it sticks to viewport, not content.

### UX harmonization (back buttons)
- **Single back button convention**: `.back-btn` CSS class + `← Back` label. Top-left, 40px min-height for mobile tap.
- Never re-inline back buttons with `style={{background:"none",border:"none"...}}`. Use the class.
- Centered flex intro screens: wrap with `position:relative` and set the back-btn to `position:absolute;top:16;left:16;marginBottom:0`.
- The secondary full-width `.btn2` "Back" CTAs at the bottom of intro/done pages remain — they're bottom CTAs paired with primary actions, not nav.

### Audio abort flag (listening modules)
- Multi-clip async sequences (Listen P1/P2/P3/P4, Boss Test, Endless Arena) MUST use the module-level `_audioAborted` flag to abort in-flight chains on unmount.
- `playAudioFile(url)` checks `_audioAborted` at entry and resolves immediately if true.
- `stopListenAudio()` sets the flag + pauses current audio + cancels `speechSynthesis` (audio-leak fix 2026-04-22).
- `resumeAudioSession()` clears the flag. Call it on component mount: `useEffect(function(){resumeAudioSession();return stopListenAudio;},[]);`.
- Without this pattern, the async sequence keeps creating new Audio objects after the user navigates away (bug fixed 2026-04-22, regression risk).
- **User-initiated speak() must call resumeAudioSession() first**: `speak()` bails out early if `_audioAborted` is true. Components that play audio on click WITHOUT mounting a `resumeAudioSession` useEffect (SpeakBtn, Flashcards, Word Tavern) need to reset the flag themselves at click time — otherwise any prior Listen unmount leaves the flag set and they stay silent. `SpeakBtn.go()` handles this centrally.

### Icon system (2026-04-22)
- **`<GIcon name size color block style/>`** — inline SVG helper in `src/components/icons.jsx` (with LeagueIcon, SeasonIcon, ResultIcon, BrandMark). Renders an Iconify `game-icons:` path from `GAME_ICON_PATHS`. `color` defaults to `currentColor`. Use skin-aware `var(--cyan)` for module content; specific hex for signaling (e.g. gold for achievements).
- **`GAME_ICON_PATHS`** in `src/data/avatarIcons.js` — 60+ entries, format `"name":"<path fill=\"currentColor\" d=\"...\"/>"`. ViewBox is always `0 0 512 512` (game-icons standard). Add new paths via the Iconify API: `https://api.iconify.design/game-icons/NAME.svg`.
- **Fallback-friendly render pattern**: `{GAME_ICON_PATHS[m.i]?<GIcon name={m.i} ...\/>:m.i}`. This lets modules migrate incrementally — any item still on emoji renders as emoji. Used everywhere data arrays use `i:` for an icon key.
- **Unified tile design** (Games 48×48, Train sub-view 42×42, Listen/Reading Hub 42×42, Mock sub-view, Mock Exams hero):
  - `background: linear-gradient(135deg, rgba(var(--cx),.22), transparent)` (V10 tint — picked in `prototypes/tile-bg-nuances/`)
  - `border: 1.5px solid var(--cyan)`
  - Icon `color="var(--cyan)"` (skin-aware)
  - Visitor-locked: transparent bg + `var(--bdr)` border + `var(--t3)` icon
  - Featured tiles kept colored for signal: Boss red / Endless blue / Home stats pills.
- **Mode-aware bg gradients**: `rgba(var(--bg3-rgb), alpha)` works in both dark and light. `--bg-rgb`, `--bg2-rgb`, `--bg3-rgb` are defined in both `:root` and `.light`. Prefer these over hardcoded `rgba(15,12,8,...)`.
- **Bulk emoji→SVG migration rule** — never use Python string literals with `\uXXXX` escapes to match emojis across the codebase. The source encodes emojis inconsistently (literal codepoint vs surrogate-pair escape `\\uD83D\\uDC09` vs with/without `\uFE0F`). Use regex keyed on **structural anchors** (`{id:"X"}`, `{key:"X"}`, distinctive surrounding text) that are independent of the emoji bytes. And verify via grep AFTER the script reports success — "Applied: 36/42" can be technically true while most of the 36 were trivial and the critical patterns silently missed.

### XP toast rendering in sub-pages
- `<XpToast>` and `<AchToast>` MUST be rendered inside `pg()` (the wrapper for `sp===X` sub-page routes), not only in the main return.
- Rationale: if a module earns XP without navigating back to the main return (e.g. Gauntlet sub-module → GauntletHub stays on `sp==="gauntlet"`), the toast is set by `addXp()` but never reaches the DOM until the user manually navigates home, by which time the 4s timer has expired.
- The fix landed 2026-04-22 alongside the icon refactor.
- Since 2026-09-17 only exams, Duel and Flashcards still raise `XpToast` (via `addXp`) : modules on `SessionResult` show their XP in the parchment, never as a toast.

### Gauntlet XP tier (2026-04-22 rebalance)
- 15 Q per sub-module, base 15 + 5 × correct + 35 perfect bonus → max 125 XP per run.
- Irregular Crypt keeps partial-credit granularity: `15 + 5×full + 2×partial` + 35 perfect.
- The other 3 (Chronomancer / Passive Forge / Relative Weaver): `15 + 5×correct` + 35 perfect.
- Rationale: old formulas (Irregular 60 max, others 80) under-paid the Gauntlet vs peer 15 Q modules (Word Tavern 110, Phrasal Picker 100, SentenceBuilder 95) despite being harder (typed answers, 30s timer, complex transforms). New tier B puts Gauntlet at the top of the 15 Q bracket.

---

## Modèle d'accès Supabase — verrou complet du 2026-09-15

**Le client n'a plus AUCUN privilège de table**, à deux exceptions près. `anon` et
`authenticated` ne peuvent lire que : la vue `students_public` (classement) et la table
`events` (événements en cours). Tout le reste passe par des RPC `SECURITY DEFINER` —
`groups` comprise depuis P2-D5 (2026-09-16) : la fiche publique d'une promo s'obtient par
`group_public(p_code)`, une ligne par code exact, 7 colonnes figées (code, name, type,
start_date, end_date, seasons, grade_bonus_enabled), jamais `teacher_code` /
`teacher_email`.

⚠️ Une lecture directe tient sur **deux mécanismes à la fois** : le privilège (GRANT) et
une policy SELECT. Un grant sans policy donne `200 []` sur une table pleine (RLS active,
zéro ligne). C'est ce qui a cassé « Join a Group » pour toutes les promos le 2026-09-15,
quand la migration d'hygiène a supprimé la policy de `groups` en la croyant inerte.
L'exception a été supprimée plutôt que documentée (P2-D5 : RPC, puis REVOKE + DROP
POLICY) ; `events` reste la seule table dans ce régime (`GRANT SELECT` + policy « Events
visible »), et `npm run check:security` sonde les deux mécanismes.

Conséquence pour tout nouveau code : **un `supabase.from("<table>")` dans `src/` est un
bug** hors ces deux objets, il renverra `42501 permission denied`. Écrire une RPC et
l'ajouter à `supabase/migrations/`.

### Les trois patrons d'autorisation

| Patron | Garde | Exemples |
|---|---|---|
| Données perso | `student_guard(p_name, p_class_code)` | `load_student`, `save_student`, `my_rewards`, `my_tokens`, `my_pending_chests`, `my_weekly_snapshots`, `upsert_push_subscription`, `open_pending_chest` |
| Lecture publique (classement, fiche de promo) | aucune, mais **bornée** : colonnes figées, limite dure, `Teacher` exclu en SQL | `students_public`, `class_median_xp`, `class_weekly_progress`, `class_week_podium`, `group_public` |
| Dashboard formateur | `teacher_role_of(p_code)` + propriété de cohorte | `teacher_students`, `teacher_weekly_snapshots`, `teacher_feedback`, `teacher_create_event` |

`student_guard` a une **tolérance legacy** : une ligne sans `user_id` passe, faute de
preuve à exiger. Chaque compte migré se protège tout seul. Le durcissement final de la
Phase C = retirer cette branche, une ligne.

**Deux marqueurs d'identité sur `students`, deux lecteurs différents** (piège vécu le
2026-09-15, P2-D4) : le **routage du login** (`find_students_by_name` → Onboard) lit
`password_set_at` (NULL → écran « choisis un mot de passe », sinon « entre ton mot de
passe ») ; la **garde** (`student_guard`, donc load/save) lit `user_id`. Toute liaison
après une connexion réussie doit poser les deux (`bind_student_user_id` avec
`p_mark_password=true`), sinon la ligne est « liée sans date » et revoit l'écran claim à
chaque login. `bind_student_user_id` n'oppose `not_owner` qu'à une ligne **sécurisée**
(`password_set_at` posé) appartenant à quelqu'un d'autre ; un `user_id` résiduel sur une
ligne non sécurisée n'est la preuve de rien et se laisse relier. Le client refuse d'entrer
si la liaison est refusée : sinon `student_guard` refuserait ensuite chaque sauvegarde en
silence.

**Session perdue = ligne illisible, pas « hors ligne »** (F1/F2, 2026-09-16, audit identité).
Une session qui n'est pas celle d'un compte sécurisé (session révoquée par un `signOut()` —
**portée `global` par défaut** dans supabase-js, donc sur tous les appareils —, rafraîchissement
refusé, entrée sans mot de passe) : `ensureAuthSession()` recrée une session **anonyme**, puis
`load_student` / `save_student` refusent (`not_owner`). Avant, `load()` rendait alors la copie
locale et `save()` se contentait d'un `console.error` : l'élève jouait sans qu'aucune sauvegarde
ne passe. Désormais :
- `load()` distingue « la ligne n'existe pas » de « cette session ne peut pas la lire » par
  `find_students_by_name` (seulement si les deux lectures ont répondu **sans erreur**) → rend
  `null` et notifie `onAuthLost` ; hors ligne ou ligne absente → copie locale comme avant.
- `save()` sur `not_owner` → `onAuthLost`.
- `App()` : état `authLost` ; sans profil → `Onboard reauth` rejoue le lookup (écran « entre ton
  mot de passe » + bandeau FR) ; en cours de session → bandeau EN « Session expired » + « Log in
  again » (dans `pg()` et le retour principal), sans éjecter d'un exercice.
- **La copie locale n'est jamais effacée** : `recover()` / `recoverByEmail()` la gardent via
  `fresherLocalFor` si elle est plus fraîche et la repoussent. Ne pas remettre un
  `supaToLocal(d)` direct à la reconnexion : ce qui a été joué pendant la panne serait perdu.
- **Démarrage sans session** (`App.jsx`, gestionnaire `onAuthStateChange`) : `loaded=true` dès le
  premier événement sans session. Sinon la session anonyme que `lookupName` ouvre pour sa
  recherche lance `load()` en plein onboarding, sur le profil local d'un AUTRE élève d'un
  appareil partagé (détournement vers son écran mot de passe, ou entrée directe avant F1).
- **Aucun effet qui appelle l'auth avec `[u]` en deps** (F5) : l'effet de sync d'email relançait
  `getSession()` et se réabonnait à l'auth à chaque `sv()` (4 `getSession` + 2 abonnements par
  sauvegarde, 1 + 0 après ; le `getSession` restant est celui que supabase-js fait pour chaque
  requête). Chaque appel prend le verrou d'auth. Deps primitives, et `sU(prev => …)` quand une
  réponse asynchrone modifie le profil (recopier le `u` capturé écrase les `sv()` intermédiaires).
- **Portées de déconnexion** (F4) : « Déconnexion complète » du Profil = `signOut({scope:'local'})`
  (`auth.js` `signOutCompletely`, cet appareil seulement) ; `deleteAccount` et `reset` restent
  `global` (compte supprimé ou vidé). Tout nouvel appel à `signOut()` choisit sa portée
  explicitement : le défaut `global` coupe les autres appareils de l'élève. Appareil perdu →
  « Réinitialiser l'accès » côté formateur. « Changer de profil » (`logout()`) ferme aussi la
  session de l'appareil (portée locale, préférences locales gardées, pas de rechargement) :
  l'ancienne version la gardait, et un compte sécurisé ré-entrait au rechargement
  (`load_student_by_uid`), donc l'élève suivant d'un appareil partagé retombait sur le compte du
  précédent. Un refus de sauvegarde arrivé après la déconnexion est ignoré (plus de
  `toeic-arena-name` en local → pas de reprise vers l'ancien compte).
- **Trace des pertes de session** : auth-js supprime la session **en silence** quand un
  rafraîchissement est refusé. `src/supabase.js` branche l'option `debug` sur `authTrace`, qui ne
  logge que `[AUTH] refresh token failed: <raison>` et `[AUTH] session removed from storage` ;
  `ensureAuthSession` logge chaque échec avec sa raison. Ne jamais logger le nom du message debug
  tel quel (il contient le début du refresh token). But : confirmer ou écarter l'hypothèse des
  verrous d'auth (« Already Used » attendu si deux rafraîchissements se chevauchent).
Vérifié en dev le 2026-09-16 : session de l'onglet fermée en pleine utilisation, Daily joué
(+154 XP locales, sauvegardes refusées), bandeau, reconnexion, XP relue depuis Supabase.

**Aucune entrée sans mot de passe sur un compte sécurisé** (F3, 2026-09-16). `recover()` lit par
`load_student` (gardée), jamais par une lecture sans garde : ligne sécurisée → seul son
propriétaire, d'où l'ordre `signInStudent` → `bind_student_user_id` → `recover()` ; ligne
legacy/visitor → tolérance. Retirés : « Continuer sans pour l'instant » (remplacé par « demande à
ton formateur de réinitialiser ton accès », `api/teacher-reset-student.js`), `claimLater`, le
sélecteur d'homonymes (plusieurs lignes au même nom normalisé dans une promo partagent l'email
synthétique : on suit l'XP la plus haute, comme `student_guard`), l'écran mort « Recover My
Account ». `recover_student_row` (ligne complète sur prénom + code promo) est **supprimée** en
prod (`2026-09-16_f3_drop_recover_student_row.sql`) ; `check:security` exige un 404 sur la liste
`RETIRED` : toute fonction retirée pour fuite s'y ajoute, et ne doit jamais revenir par un vieux
`CREATE OR REPLACE`.

### Règles à ne pas enfreindre

- **Toute vue exposée** : `REVOKE ALL` **puis** `GRANT SELECT`. Jamais un GRANT seul —
  une vue mono-table est auto-modifiable et tourne avec les droits de son propriétaire
  (piège vécu sur `students_public`, écriture possible à travers elle jusqu'au 2026-09-14).
- **Tout REVOKE liste les 7 privilèges** : `SELECT, INSERT, UPDATE, DELETE, TRUNCATE,
  REFERENCES, TRIGGER`. Un REVOKE partiel a laissé `TRUNCATE` à `anon` sur `events`
  pendant des mois — et **TRUNCATE ignore la RLS**.
- **Les policies PERMISSIVE sont OR'ées.** Une policy `USING true` à côté d'une policy
  de propriété annule la seconde. C'est pourquoi les 12 policies legacy ont été
  supprimées : la protection vient des privilèges, pas de la RLS. La seule policy
  restante est « Events visible » sur `events` (lecture directe voulue : elle va avec le
  `GRANT SELECT`, retirer l'un des deux coupe la lecture — régression vécue sur `groups`
  le 2026-09-15). `groups` a quitté ce régime le 2026-09-16 (P2-D5) : plus de grant
  colonne, plus de policy, RPC `group_public`.
- **Ordre de déploiement** : fichier SQL 1 (les RPC, purement additif) → code déployé →
  vérification en prod → fichier SQL 2 (le REVOKE). Le SQL 2 brûle le filet : tant qu'il
  n'est pas passé, reverter le commit client suffit.
- **Après TOUTE migration qui touche un GRANT, un REVOKE ou une POLICY** : `npm run
  check:security` (ses chemins légitimes sont dérivés du source, pas d'une liste) **et**
  un login + un « Join a Group » sur la prod. La migration d'hygiène du 2026-09-15 est
  passée sans ni l'un ni l'autre : aucune inscription par code de promo pendant des heures.
- `api/*.js` et les Edge Functions tournent en `service_role` → insensibles à tout ceci.

---

## Hardened Rules — post-crisis 2026-04-21

Ces règles s'appliquent à tout changement touchant : auth, sessions, save/load, identity binding, Supabase RLS, Onboarding, routing (sp/tab). Elles ont été durcies après la crise du 20-21 avril 2026 où un typo `setName` (au lieu de `sN`) caché par un `catch(e){}` muet a cassé le flow "Welcome back" pour tous les étudiants pendant 13 jours, suivi de 8 commits correctifs mal orientés. Voir `AUDIT_2026-04-21.md` pour le rapport complet.

### 1. Zéro catch silencieux
Tous les `catch(e){}` sur un chemin critique DOIVENT logger au minimum un `console.warn("[CTX] caught:", e&&e.message)`. Les catch muets ont caché le bug `setName` 13 jours.

```js
// NON
try { risky(); } catch(e) {}

// OUI
try { risky(); } catch(e) { console.warn("[CTX] caught:", e&&e.message); }
```

### 2. Audit avant le 1er patch sur sous-système critique
Avant de modifier un flow auth/sync/identity/routing, lire TOUTES les fonctions impliquées de bout en bout. Ne pas patcher symptôme par symptôme.

### 3. Un commit = un changement logique
Sur auth/sync/identity, ne jamais batcher plusieurs fixes corrélés. Chaque commit doit être revertable indépendamment. Si le message de commit nécessite plus d'une phrase d'action, splitter.

### 4. Vérifier l'infra avant de théoriser
Une hypothèse sur une RLS policy, un schema DB, un env var, une config serveur doit être **confirmée** (screenshot/SQL/dashboard) avant d'être utilisée comme base de raisonnement. Ne pas supposer — demander ou aller chercher.

### 5. Setters React — grep d'abord
Les setters dans `App()` et dans les écrans (`features/onboarding/Onboard.jsx` surtout) utilisent souvent des raccourcis : `sN` (setName), `sU` (setU), `sT` (setTab), `sSP` (setSp), `sL` (setLoading). Avant d'appeler un setter dans une fonction inline, **grep** pour confirmer qu'il existe dans le scope du fichier. Dans `routes.jsx`, les noms d'`App()` n'existent que s'ils sont dans le contexte `c` (eslint `no-undef` le vérifie). Les `ReferenceError` runtime sont invisibles à la compilation.

### 6. BUILD_ID synchronisé
Le `BUILD_ID` hardcodé dans `App.jsx` (ligne ~62, juste avant `App()`) doit refléter la date du dernier changement significatif. S'il est obsolète, les logs console sont trompeurs. À bumper à chaque session de modif critique.

### 7. Logs diagnostiques avant fix mystérieux
Face à un bug dont le symptôme n'est pas reproductible via la logique visible, **ajouter des logs aux points de décision du flow et dans tous les catch du chemin d'exécution suspect, push, demander à l'utilisateur de reproduire, analyser**. C'est ce qui a débloqué la crise du 21 avril.

### 8. Commentaires de garde sur zones critiques
Quand un fix corrige un bug subtil d'interaction (ex : Teacher stuck en visitor, ou INSERT sans id), laisser un commentaire inline qui explique POURQUOI ce choix et ce que le renvoyer en arrière casserait. Pas seulement le WHAT.

---

## Language Policy

- **Onboarding** (name, classcode, GDPR, Battle Scan, push opt-in): **French** — trust/consent flow, students need native language
- **Battle Report**: **English** (except explicit French labels like "Notification push" in privacy section)
- **langBridge transition screen**: **English** — signals language shift to students
- **Main app** (Home, Train, Games, Profile, modules): **English**
- **League** : **French** where it already is (tabs Semaine / Général / Progrès, labels) — **voulu**, confirmé par Jérémy le 2026-09-17 ; ne pas « corriger » en anglais
- **Push notifications** (all 3 Edge Functions): **English**
- **Chests** (labels, rarities, avatar/skin names in chests.js): **English** (keys unchanged for DB compat)
- **Privacy Policy**: **French** (legal document, FR audience)
- **Teacher Dashboard**: **French** (Jérémy's own UI)
- **Weekly Report**: **French** (document for pedagogical director)

### JSX encoding rule
- Unicode escapes (`\u00e9`, etc.) in JSX TEXT content don't decode — render as literal `\u00e9`.
- **Fix**: wrap in `{"..."}` JS string expression, OR use real UTF-8 characters.
- **Same trap in JSX attribute strings**: `title="T\u00e9l\u00e9charger"` renders the literal too (JSX attribute strings are HTML-like, no JS escapes). Write `title={"T\u00e9l\u00e9charger"}`.
- Works fine in real JS string literals: array items, object values, `{"..."}` expressions.
- **Check that catches every case** (source greps miss mixed lines): after `npm run build`, `grep -oE '.{3}\\\\u[0-9A-Fa-f]{4}.{3}' dist/assets/*.js` — a doubly escaped `\\u00e9` in the bundle is a literal on screen. Only library regex ranges (`\\u00C0-\\u00D6`…) should remain. Last full sweep: 2026-09-16, 5 cases fixed.

---

## Known Gotchas & Past Bugs

### Encoding
- **Python raw strings (`r'''`) double-escape unicode.** Never use `r'''` for JSX content with `\u`.
- **Surrogate pairs** (emoji like 🐉) must be written as real characters in Python, not as `\uD83D\uDC09`.
- **Always validate UTF-8 before writing:** `app.encode('utf-8')` in Python.

### Vite/Rolldown
- **Nested quotes in helper functions** cause parse errors. Use `String.fromCharCode(34)` for double-quote generation inside template strings.
- **Unicode characters (──) in search anchors** for patch scripts fail on Windows. Use unique content strings as anchors.

### Supabase
- **Anon key must NEVER be hardcoded** in App.jsx. Use `import.meta.env.VITE_SUPABASE_ANON_KEY`.
- **`fetch({ keepalive: true })` with auth headers** replaces `sendBeacon` for unload saves.
- **Realtime:** Avoid `self:false`; use unique session PIDs.
- **Aucune table n'est accessible en direct depuis le client** (verrou du 2026-09-15, voir ci-dessous). Un `supabase.from("<table>")` dans du code client renverra `42501 permission denied` — utiliser une RPC.
- **Column `skin_id`** (not `equipped_skin`) stores the equipped skin.
- **Assets in `public/`** must be `git add`-ed or Vercel won't deploy them (silent 404). Past bug: `bgm_tavern.mp3` existed locally but not in git → silent playback failure.

### React
- **Hooks must be at component top level** before any conditional returns.
- **`useMemo` with empty deps `[]`** for shuffled question sets.

### CSS
- **`.crd` class** forces `background: var(--bg2)`. Override requires removing the class.
- **Skin animations:** use `background-image:` NOT `background:` shorthand when animated.
- **Skin à cartes sombres = cartes-nuit en clair** (2026-09-16) : un skin qui force un fond sombre sur `.crd` écrit sa règle de tokens `.skin-X:not(.light),.light.skin-X .crd{…}` (page claire, palette sombre dans les cartes), s'ajoute à `.light:where(…) .crd` et à la liste `.light.skin-X .btn2`, et remet un `background-color` opaque si son fond de carte est translucide. Jamais `.skin-X{…}` seul : selon sa place par rapport à `.light`, texte sombre sur carte sombre ou appli entière sombre avec les restes du clair. `check_skins_light` refuse l'oubli.
- **Toute couleur de texte ou d'icône écrite en dur = `tone("#rrggbb")`** (`lib/tone.js`, 2026-09-16) : ligues, titres, raretés, mais aussi les couleurs d'accent en dur du JSX et des données (pastilles de Home, CECRL, fiches de grammaire, Gauntlet…). Pensées pour le sombre, elles tombaient à 1,0-2,9:1 en clair. `tone(hex)` → `var(--tone-<hex>,<hex>)` : en sombre le hex s'applique, en clair la variante de `.light{--tone-…}` dans `appCss.js` (même teinte, ≥ 4,6:1), remise à `initial` dans les cartes-nuit. Nouvelle couleur = sa variante + son `initial` (la garde les réclame). Couleur rendue depuis des données (`color:x.col`) : `tone(x.col)` + déclarer la source dans `DATA_SOURCES` du test. Texte clair **sur un fond sombre écrit en dur** (fenêtre, bannière, tuile Boss/Endless) : garder le hex et le préfixer `/*fond local*/` ; **jamais de jeton de thème (`var(--gold)`, `--t3`…) dans un tel bloc**, il suit le mode clair alors que le fond ne change pas (régression vécue sur la tuile Boss : figer la valeur du sombre). `check_tones` refuse l'oubli.
- **Texte posé sur un aplat d'accent = `var(--on-cx)`** (2026-09-16) : sombre en sombre, `#fffcf5` en clair (l'accent y est assombri), remis sombre dans les cartes-nuit. `.btn1`, `.gauntlet-btn-enter`, médaille de niveau, pastille ✎. Jamais `#0f0c08` en dur sur `--cx-hex` / `--cyan` : 1,6 à 2,5:1 en clair.
- **Shimmer overlays use `::after` pseudo-elements** with parent `position:relative!important;overflow:hidden!important`.
- **Ambiance de fond « Parchemin »** (2026-09-17, proto `prototypes/ambiance/`) : `.app::before` (halo `--cx` en haut + vignettage) et `.app::after` (grain SVG en data-URI) sont des calques `position:fixed` à `z-index` négatif, **réservés** : ne pas réutiliser ces pseudo-éléments de `.app`. `.app{isolation:isolate}` est ce qui les fait passer devant le fond de `.app` et derrière le contenu ; le retirer les efface en silence. Conséquence : un enfant de `.app` à `z-index` négatif sans contexte propre s'affiche désormais au-dessus du fond. Tout en jetons, rien à ajouter pour un nouveau skin ou une nouvelle fête.
- **`.app:not(.onboard-shell)`** selector allows onboarding to skip the desktop 200px sidebar margin.

### PWA / Service Worker
- **`sw.js` v3** — network-first with `{cache:'no-cache'}` for HTML/JS.
- **`index.html`** registers SW with `{updateViaCache:'none'}`.
- **`controllerchange`** listener auto-reloads the page.
- **Build ID** logged on startup for deployment verification.
- **Chunks lazy (Phase 5)** : `main.jsx` écoute `vite:preloadError` (chunk dont le hash n'existe plus après un déploiement) → un reload, garde 60 s en sessionStorage ; au-delà, `LoadBoundary` affiche un bouton Reload. Hors ligne, un écran jamais visité depuis le dernier build n'a pas son chunk en cache : `preloadLazyScreens` (appelé une fois par App.jsx, à l'idle, 3 s après le premier affichage, sauté si `saveData`) recharge tous les chunks pour retrouver la parité du bundle unique.

---

## Audio Conventions

### File naming
- **P1 training:** `public/audio/p1/{id}_{0-3}.mp3`
- **P2 training:** `public/audio/p2/{id}_q.mp3` + `{id}_{0-2}.mp3`
- **Lettres (depuis le 2026-09-16) :** `public/audio/letters/{voix}_{A|B|C|D}.mp3`, 6 voix × 4 lettres. **Les clips d'options P1/P2 ne contiennent plus la lettre** : `playLetteredOption(part,id,pos,url)` (`lib/audio.js`) joue « B. » dans la voix de l'item puis l'option **affichée** en position `pos`. C'est ce qui rend la permutation des options (`aud`, `lib/listeningShuffle.js`) libre : l'élève entend toujours A, B, C(, D) dans l'ordre. La voix d'un item se déduit de son numéro (`lib/listeningVoices.js`, règle partagée avec le script) ; **ne jamais regénérer un clip d'option avec sa lettre dedans**, et ne pas changer la règle de voix sans regénérer les clips concernés.
- **Explications P1/P2 et leurs lettres** : l'exercice affiche `x` remappé aux lettres affichées (`remapOptLetters`) ; les leçons de l'écran de fin, qui ne montrent pas les lettres, affichent `xq` (`quoteOptLetters` : chaque lettre devient le texte de l'option cité), calculé sur l'item **d'origine** au moment de la permutation. Un `x` déjà remappé ne se relit pas (« and A trap » passe pour un article). Test `validate_listening_shuffle` (I2, I3).
- **P3 training:** `public/audio/p3/{id}_line{0-3}.mp3` + `{id}.mp3` (stitched)
- **P4 training:** `public/audio/p4/{id}.mp3`
- **Boss test:** `public/audio/boss/p1_XX_Y.mp3`, etc.
- **Audio Blitz:** `public/audio/blitz/{id}.mp3`
- **Mimic Hunt (mode écoute):** `public/audio/mimic/{id}.mp3` — items `spoken`, une voix par item (`mimicVoice`)
- **BGM:** `public/audio/bgm/bgm_{name}.mp3`

### ElevenLabs
- Voices: Sarah (W) = `EXAVITQu4vr4xnSDxMaL`, Adam (M) = `pNInz6obpgDQGcFmaJgB`
- Model: `eleven_multilingual_v2` pour les phrases. **Pour un clip d'une syllabe (les lettres), `eleven_turbo_v2` (anglais seul, `stability: 0.75`)** : le multilingue devine la langue sur un caractère isolé et lit « A » à la française (/a/), constaté le 2026-09-16.
- Settings: `stability: 0.5, similarity_boost: 0.75, speed: 0.92` (lots P1/P2 2026-09-16 et précédents ; `0.55 / 0.85` sur les tout premiers lots).
- 6 voix en rotation pour P1/P2 (`lib/listeningVoices.js`) : Sarah US-F, Adam US-M, Canadienne F, Britannique M, Voice A (non-US, M), Voice B (non-US, F). P2 : question et réponses par **deux locuteurs différents** (TOEIC), à trois pas d'écart dans le cycle.
- Script de (re)génération P1/P2 : `scripts/regen-listening-letterless.mjs` (`--letters | --p1 | --p2 | --sample | --all`, reprenable : saute les fichiers existants ; **déplacer les anciens clips hors de `public/` avant un lot complet**, sinon tout est sauté).
- Audio files are pre-generated. ElevenLabs credits for generating new content only, never runtime.

### BGM Wiring Pattern
```javascript
// In the router (src/routes.jsx, renderRoute — les noms d'App() viennent du contexte c) :
if(sp==="moduleName"){if(!lastSession)playBGM("bgm_name");return pg(<Component u={u} done={function(sc,tot,xp){stopBGM();return miniSession(sc,tot,xp);}} session={lastSession} closeSession={closeSession} replaySession={replaySession} back={function(){stopBGM();sSP(null);sT("tab");}}/>);}
```

---

## Pedagogical Principles

- **TOEIC score estimator as a pedagogical lever.**
- **Anti-farming through module XP gates**, never a hard daily cap.
- **Clue Hunter:** Clue identification phase distinct from answer. Category label hidden until post-answer.
- **Weekly snapshots are necessary** — Supabase data is cumulative.
- **Flashcards = learn, Word Tavern = prove (and earn XP).** Feedback loop: failed words in tavern → reset SRS → come back in next review.
- **Onboarding enforces the right habits:** push opt-in prompt, English-only transition, 3-step Home tutorial, persistent Mock Test nudge.

---

## Credentials & Secrets (DO NOT COMMIT)

All secrets in `.env` (local) and Vercel environment variables. **Never hardcode in source files.**

| Secret | Location | Notes |
|--------|----------|-------|
| `VITE_SUPABASE_URL` | `.env` + Vercel | Supabase project URL |
| `VITE_SUPABASE_ANON_KEY` | `.env` + Vercel | Use `import.meta.env`, never hardcode |
| `ELEVENLABS_API_KEY` | `.env` | Audio generation scripts only |
| `VAPID_PUBLIC_KEY` | `src/lib/push.js` | Safe to expose client-side |
| `VAPID_PRIVATE_KEY` | Vercel only | Server-side push signing |
| `VITE_PUSH_SECRET` / `PUSH_SECRET` | `.env` + Vercel | Push endpoint auth (same value, 2 names) |
| Teacher dashboard password | Vercel env vars | Do not store in code |

---

## Companion Documentation

- `CONTEXT.md` (project root) — Living state: what's done, what's in progress, what's next
- `REFACTOR_PLAN.md` — le découpage d'App.jsx (2026-09-15) : plan, journal lot par lot, bilan, outillage `scripts/refactor/`
- `CLAUDE_chest.md` — Loot system deep-dive (chest types, rarities, drop tables)
- `DAILY_CHALLENGE_BRIEF.md` — Daily Challenge specs
- `TODO_S2.md` — Season 2 backlog (tracked in `.claude/projects/.../memory/project_todo_s2_progress.md`)

---

## Freemium System

```javascript
FREE_MODULES = ["daily","drill","csess","sbuild","lisP2","stratquiz","strats","gramref","wfall","tavern"]
FREE_FLASHCARD_DOMAINS = ["finance","travel","office"]
```

Visitor mode (no class code) locks premium modules. All content unlocks with a valid class code.

---

## Push Notification Infrastructure

3 Edge Functions deployed, all in English:

| Function | Schedule | Target |
|----------|----------|--------|
| `streak-reminder` | Daily 20h CET | Streak ≥ 2, inactive today |
| `weekly-results` | Monday 08h CET | Personalized weekly ranking + teaser of Aldric's Monday letter (computed client-side) |
| `inactive-reminder` | Every 3d 17h CET | Inactive 7-30d, active classes only |

Anti-spam on `inactive-reminder` via `students.inactivity_push_sent` (max 1 per 14d).
