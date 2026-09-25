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
| `npm test` | Suite de tests (34 fichiers, ~15 s, hors ligne). Liste explicite dans `tests/run.cjs` |
| `npm run check:security` | Rejoue le balayage du chantier pentest : tables verrouillées, vecteurs destructeurs, RPC vivantes. **Réseau + `.env` requis**, d'où sa séparation de `npm test` |

**Pas de framework de test** — tout est en Node natif, zéro dépendance. Depuis le
découpage (2026-09-15), les tests **requièrent les modules purs de `src/lib/` en natif**
(`require(esm)` : Node 22 + `"type": "module"`) : `profileSchema.js`, `util.js`,
`endless.js`, `listeningShuffle.js`, `toeic.js`. Plus aucun découpage de texte. Un module
de `lib/` qui se met à importer Supabase casse le test qui le requiert : c'est voulu,
remettre le module pur plutôt que revenir au découpage. Deux gardes protègent la
structure elle-même : `check_symbol_census` (aucun symbole perdu ni dédoublé) et
`check_import_graph` (aucun cycle, sens des couches respecté).

La liste exécutée, avec une phrase par test : `tests/run.cjs`. **Le pourquoi détaillé de chaque garde**
(ce qu'elle protège, ce qui casserait en silence) : `tests/CLAUDE.md`, chargé quand on travaille dans `tests/`.

⚠️ **Un test qui échoue décrit un vrai problème.** Le corriger, ne pas l'ajuster pour le
faire passer. Et tout nouveau test doit être **prouvé mordant** : introduire l'erreur
qu'il doit attraper, vérifier qu'il rougit, annuler.

**CI GitHub Actions** (`.github/workflows/ci.yml`, 2026-09-23) à chaque push sur `main` et chaque PR :
`npm ci` → `npm test` → `lintgate` (pas `npm run lint`, rouge par héritage) → `check:assets` → `build`
sans `.env`. Pas de hook pre-commit. Pièges : `npm ci` refuse un lock désynchronisé de `package.json`
(toujours commiter le lock avec une dépendance) ; le checkout est en `fetch-depth: 0` parce que
`validate_toeic_shrinkage` relit une révision passée. Un test en échec sort en annotation `::error`
(`tests/run.cjs`), lisible sur la page du run sans connexion. La CI ne bloque PAS Vercel, qui déploie
chaque push indépendamment : un run rouge est un signal, pas une barrière.

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
                          phrases d'Aldric, anglais, à côté de sessionText), officeDay (journées
                          de Nine to Five composées depuis P3/P4/P7) + officeGrades (grades,
                          réputation, SANS données : lu par App.jsx et la tuile Games)
  components/          — shared widgets: icons (GIcon…), Bar, SpeakBtn, ListeningGraphic,
                          PassageDocs, avatar (renderAv, AvatarMedal), toasts, Tabs,
                          GrimoireReader, NextStepReco, TokenCTAs, legal, PasswordInput (œil),
                          MentorMemory (AldricBrief, AldricRemembers), GrammarSheet,
                          LoadingMark (+ LoadBoundary), lazyNamed (+ preloadLazyScreens)
  features/            — one folder per screen: train/ (grammar, reading, strategy),
                          home/ (Home, Train, Cards, Daily, DailyTip), gauntlet/, modals/,
                          games/, listening/, exams/ (Mock, Boss, Endless), mentor/,
                          league/, chests/, shop/, profile/, narrator/, onboarding/, teacher/,
                          waygates/ (hub des modules thématiques The Waygates + Nine to Five)
  styles/appCss.js     — the CSS template literal, injected by App.jsx via <style>{CSS}</style>
  data/
    vocab.js           — 920 flashcards, 18 domains
    grammar.js         — 456 Part 5 drill questions
    listening.js       — P1 (43), P2 (175), P3 (96 convos), P4 (102 talks)
    part6.js           — 40 texts, 160 blanks
    part7.js           — 75 passages, 289 Q (insertion de phrase `keep:true`, voir check_part7_items)
    mockTests.js       — Mock Tests 1-3
    bossTestFull.js    — The Final Arena (full TOEIC, 202Q, 7 parts)
    miniGames.js       — Word Families, Connectors, Preps, Ger/Inf, False Friends, Traps (Connectors, Preps, Ger/Inf
                          = épreuves Knotbinder, Anchor Hall, Twin Paths du Gauntlet ; False Friends = type de Word Tavern)
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
    connectorsGrimoire.js  — GRIMOIRE_CONNECTORS (Knotbinder + Linking Bridge)
    prepositionsGrimoire.js — GRIMOIRE_PREPOSITIONS (Anchor Hall, 10 chapitres ; brouillon en relecture)
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

## Index des fonctionnalités (détail dans des `CLAUDE.md` de sous-dossier)

Depuis le 2026-09-24, le détail de chaque fonctionnalité vit à côté de son code : Claude Code charge un
`CLAUDE.md` de sous-dossier **quand on lit un fichier de ce dossier**. Avant de modifier une fonctionnalité dont
le code vit ailleurs (un `lib/` utilisé par un écran, par exemple), **lire son fichier de détail**. Ici, seulement
l'invariant qui casse sans bruit.

| Fonctionnalité | Détail | À ne jamais oublier |
|---|---|---|
| Tests (le pourquoi de chaque garde) | `tests/CLAUDE.md` | Tout nouveau test est prouvé mordant. |
| HUD de session, écran de fin commun, budget d'interruptions, icônes, grimoires | `src/components/CLAUDE.md` | Barre et pied du HUD en `position:fixed`, jamais dans un `.enter` ; `p.done(…)` à la fin de la manche, jamais derrière un bouton ; un seul plein écran par entrée sur Home (`lib/interruptions.js`). |
| Home « une porte », hubs vivants | `src/features/home/CLAUDE.md` | Ordre du bouton dans `lib/homeAgenda.js` ; le Daily reste un bloc à part. |
| Estimateur TOEIC, thèmes saisonniers | `src/lib/CLAUDE.md` | Ne jamais revenir à `wSum/wTot` (retenue bayésienne) ; `total` peut être `null` ; fenêtres de fête en heure locale. |
| Mentor qui se souvient (bestiaire, chasse, plan figé, lettre, Chronique) | `src/features/mentor/CLAUDE.md` | Une `ref` que `lib/reviewLookup.js` ne sait pas relire laisse une créature due pour toujours ; `reviewLookup.js` jamais importé hors d'un écran lazy. |
| The Waygates, Nine to Five (modules thématiques) | `src/features/waygates/CLAUDE.md` | Réponses versées dans lisP3/lisP4/p7 **sans** `trackModSession` sur ces clés ; `office` hors tables de poids et en liste noire de maîtrise ; jetons du thème seulement. |
| Mimic Hunt, Word Tavern | `src/features/games/CLAUDE.md` | Nouveaux items Mimic toujours relus par Jérémy avant d'entrer au jeu ; aucun texte ne cite une lettre d'option. |
| Coffres, jetons, échelons de maîtrise | `src/features/chests/CLAUDE.md` | Watchers sur objet JSON cloné = garde `useRef` (boucle de +37 k XP vécue) ; **prix, cosmétiques, jetons, tables de tirage et sources de coffre vivent dans `chestCatalog.js` : les changer = `node scripts/gen-economy-sql.mjs` + passer le SQL généré en prod** (le serveur décide sur ses copies). |
| Boss, Endless, écoute fidèle au TOEIC | `src/features/exams/CLAUDE.md` | Toute nouvelle disposition du Boss → bumper `BOSS_LAYOUT_V`. |
| Grammar Gauntlet, Modal Council | `src/features/gauntlet/CLAUDE.md`, `src/features/modals/CLAUDE.md` | Palier XP B des modules à 15 questions ; Knotbinder / Anchor Hall / Twin Paths comptent sous `connsort` / `prepdrill` / `gerinf` (`lib/gauntletTrials.js`), jamais renommés. |
| Audio (nommage, ElevenLabs, génération) | `scripts/CLAUDE.md` | Clips d'options P1/P2 sans lettre ; `npm run check:assets` après tout ajout ; réécrire une réplique = supprimer son MP3 avant de regénérer. |
| Edge Functions, push | `supabase/CLAUDE.md` | Les textes de push sont en anglais ; la lettre du lundi n'est jamais recalculée en Deno. |
| Contenu (formats, identifiants) | `src/data/CLAUDE.md` | Chaque question porte une explication ; identifiants continus. |

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
- **Onglet Usage du formateur** (2026-09-23) : RPC `teacher_usage` → `lib/usageStats.js`. Parties = clés `<modId>_<date>`
  de `dailyModSessions` (rétroactif). **Abandons** = « Leave this round » confirmé après ≥ 1 réponse, rangés dans le MÊME
  objet sous `quit:<route>_<date>` (puits `setQuitSink` posé par `App()`, `reportQuit` dans `SessionTop.leave()` ; Boss et
  Endless exemptés). Tout lecteur de `dailyModSessions` lit une clé **exacte**, ne jamais sommer les clés d'un jour.
  **Jours de mission** : `mission.doneDays` (35, posé par `checkMission`). Ces deux captures datent du 2026-09-23
  (`CAPTURE_START`) : les taux ne comptent rien avant. Retour matériel et fermeture d'onglet ne sont pas des abandons.

### XP System
- **Le calcul des portes vit dans `src/lib/xp.js`** (pur : `accuracyGate`, `farmMult`, `isBoostedByEvents`, `spotlightMult`, `gateSteps`, `gateXp`, `settleXp`), testé par `tests/check_xp_gates.cjs`. `settleSession`, `applyXpGates` / `addXp` dans `App.jsx` ne font qu'injecter l'état (`u`, événements, médiane, instant) et exécuter les effets rendus (Darics du Focus, jingles, haptique, toast, coffres). Toute règle ci-dessous se change **dans `xp.js` et dans le test**, jamais dans App.jsx. La table des ligues est injectée (`ctx.leagueOf`) : `lib/league.js` importe Supabase et n'est pas requérable en Node.
- **No daily XP cap.** Diminishing returns per module per day are the anti-farming mechanism.
- **Flashcards give 0 XP.** Reframed as memorization-only tool. Students earn XP on vocabulary via Word Tavern (15Q quiz) instead.
- **Diminishing returns:** Mock tests 100/40/0% per day. Other modules follow standard gates.
- **Accuracy gate:** <30% accuracy → 10% XP, 30-49% → 50%, ≥50% → 100%.
- **TOEIC Progression ranking is the primary bonification metric.** XP Overall is secondary.

### Flashcards
- **Flashcard accuracy is NOT a performance metric.** SRS self-evaluation, not right/wrong.
- **Flashcards give 0 XP.** Reward for vocabulary knowledge happens in Word Tavern.
- **Battle Scan does NOT populate moduleScores.** Only `u.battleScan` holds placement results. The old code that wrote scan answers to moduleScores triggered false "Explorer" achievement — removed 2026-04-17.

### Teacher Account
- The `Teacher` account syncs to Supabase but is **hidden from all leaderboards** (League, TeacherDash student list).
- `GHOST_NAME="Teacher"` filter is applied in: TeacherDash student list queries, League rankings. NOT applied to chest grants.
- **Teacher student row lives on `class_code='teacher-internal'`** (permanent group, `end_date=NULL`) — decoupled from any student cohort since 2026-04-17. This insulates Jérémy's account from cohort cutoffs (e.g. `idrac2026` ending 2026-06-28).
- Teacher dashboard login still uses `groups.teacher_code` (code formateur géré en env, voir Vercel). This is independent of the Teacher student row's class_code.

### League System
- 7 tiers: Bronze (0) → Silver (200) → Gold (600) → Platinum (1500) → Diamond (5000) → Champion (10000) → Légende (30000).
- `getEffectiveLeague()` requires TOEIC estimated score ≥ 400 to display Légende.
- Season structure S1-S4, weekly snapshots, 3 tabs: Semaine, Général, Progrès.

### Haptic Feedback
- `haptic(key)` dispatches to `navigator.vibrate()`. Silent on iOS.
- Patterns: chest, chestOpen, levelUp, achieve, league, pb, streak, complete.
- Triggered at: achievement unlock, league promotion, level up, streak milestones, chest open, mock/boss/endless completion, Endless PB.

### BGM Control (centralized)
- Central useEffect in main App watches `sp` and `tab`. Stops BGM on entry to audio routes (lis, lisP1-P4, ablitz). Restores `bgm_home` on return to home/league/profile without subpage.
- `SELF_MANAGED` routes that handle their own BGM: boss, endless, matchE, wfall, duel, sbuild, clue, tavern, **gauntlet**, modals, bforge, shop, **mimic**. These are excluded from centralized control. `npm run check:assets` vérifie depuis le 2026-09-19 que chaque `"bgm_x"` nommé dans `src/` existe et est suivi par git.
- Routes à écran de fin commun : `if(!lastSession)playBGM(…)`, sinon la musique repart sous le parchemin à chaque rendu.
- Auto-start on first user interaction: only triggers `bgm_home` if `tab==="home" && !sp`.

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

### XP toast rendering in sub-pages
- `<XpToast>` and `<AchToast>` MUST be rendered inside `pg()` (the wrapper for `sp===X` sub-page routes), not only in the main return.
- Rationale: if a module earns XP without navigating back to the main return (e.g. Gauntlet sub-module → GauntletHub stays on `sp==="gauntlet"`), the toast is set by `addXp()` but never reaches the DOM until the user manually navigates home, by which time the 4s timer has expired.
- The fix landed 2026-04-22 alongside the icon refactor.
- Since 2026-09-17 only exams, Duel and Flashcards still raise `XpToast` (via `addXp`) : modules on `SessionResult` show their XP in the parchment, never as a toast.

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
| Dashboard formateur | `teacher_role_of(p_code)` + propriété de cohorte | `teacher_students`, `teacher_weekly_snapshots`, `teacher_feedback`, `teacher_create_event`, `teacher_usage` (anonyme : ni nom ni id) |

**Règle de propriété unique : `_owner_ok(owner, promo)`** (Phase C, 2026-09-24). Les 7 portes (`student_guard`,
`save_student`, `grant_marks`, `consume_token`, `buy_item`, `claim_bourse_title`, `grant_token`) l'appellent ; elles
avaient chacune leur copie de la tolérance legacy. Ligne liée → seul son propriétaire ; ligne sans `user_id` →
tolérée **sauf si sa promo est en mode strict** (`identity_strict_classes`, `'*'` = toutes), visiteurs toujours
tolérés. Refus = `not_owner` → session perdue côté client → écran « Sécurise ton compte » (bandeau « Nouveau… »),
copie locale gardée. **Basculer une promo** : `INSERT INTO identity_strict_classes VALUES ('<code>')` ; revenir :
`DELETE`. Suivi dans l'onglet Usage (« Comptes sécurisés », actifs sans mot de passe). ⚠️ Toujours `IS NOT DISTINCT
FROM auth.uid()`, jamais `=` : sans session, `auth.uid()` est NULL et `IF NOT NULL` ne refuse rien (écrit ainsi, le
lot 1 ouvrait les comptes sécurisés aux appels anonymes ; attrapé par l'essai en transaction). `check_owner_rule`
refuse ce retour et toute nouvelle copie de la tolérance.

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
- **Monnaie et jetons : bornes serveur** (`2026-09-24_currency_bounds.sql`, mitigation). Ces RPC vérifiaient QUI,
  jamais COMBIEN (un prix négatif créditait, une consommation négative ajoutait des jetons). Désormais : gain de
  Darics 1 à 1000 par appel et 3000 sur 24 h glissantes (hors boutique et dons du formateur, record réel 1795),
  prix ≥ 1, jetons de types connus au plafond serveur `token_cap()`, 1 à 3 par octroi, 1 à 5 par consommation. Un
  don de formateur au-delà passe par le SQL Editor.
- **Économie côté serveur** (2026-09-24, lots 1-3) : le serveur **possède les catalogues et décide**, le client
  demande et affiche. Catalogues **générés** depuis `src/data/chestCatalog.js` par `node scripts/gen-economy-sql.mjs`
  → `2026-09-24_economy_catalog_data.sql` (`shop_catalog`, `reward_catalog`, `token_catalog` que lit `token_cap()`,
  `chest_drop_tables`, `rarity_catalog`, `chest_triggers`) ; **jamais édité à la main**, et tout changement de
  prix, cosmétique, jeton, table de tirage ou source de coffre = relancer le script ET passer le fichier en prod
  (`check_economy_parity` rougit sinon). Achat `buy_item(item_id)` ; titre Bottomless Purse `claim_bourse_title` ;
  coffre : `grant_pending_chest` impose type et délai (`chest_triggers` ou motifs datés : un déclencheur inconnu est
  refusé, **toute nouvelle source de coffre s'ajoute au générateur**), `open_chest` tire (`_roll_chest`, port de
  `pickRewards`) et crédite cosmétiques, jetons et Darics ; le client ne crédite que l'XP. Conversions
  `convert_dups_to_token` / `convert_tokens_premium`. `grant_token` n'est plus appelable par le client ;
  `grant_marks` n'accepte que les sources du jeu (`achievement, daily, focus, hunt, login, mastery, podium,
  toeic_weekly` : une nouvelle source de Darics s'ajoute à `2026-09-24_economy_lot2_close.sql`, le test la réclame).
  Retirées (404 exigé par `check:security`) : `spend_marks`, `grant_reward_once`, `open_pending_chest`,
  `convert_cosmetic_dups`.
- **Garde-fou XP dans `save_student`** (lots 3 et 3b) : au-dessus des valeurs de `xp` et `weekly_xp` du premier
  enregistrement du jour (heure de Paris ; colonnes serveur `xp_day_*`, **hors liste blanche** : le client ne doit
  jamais pouvoir remettre sa base), **+20 000 = journée notée** dans `xp_clamp_log` sans rien retirer, **+40 000 =
  plafond** (jamais un refus). Des semaines réelles montent à 44 365 : ne pas redescendre le plafond sans relire
  `weekly_history`. Affiché nommé dans l'onglet Usage (`teacher_xp_clamps`). L'XP d'une manche reste calculée
  par le client.

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

Nommage des fichiers, voix ElevenLabs et scripts de génération : `scripts/CLAUDE.md`.

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
