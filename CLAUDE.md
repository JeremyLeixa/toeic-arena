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
| `npm test` | Suite de tests (15 fichiers, ~7 s, hors ligne). Liste explicite dans `tests/run.cjs` |
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
  liste blanche de `save_student`. Une colonne hors liste est ignorée **en silence**.
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
                          pipeline (applyXpGates/addXp), session (onboard/recover/logout),
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
                          saisonniers : fenêtres, opt-out, forçage, theme-color)
  components/          — shared widgets: icons (GIcon…), Bar, SpeakBtn, ListeningGraphic,
                          PassageDocs, avatar (renderAv, AvatarMedal), toasts, Tabs,
                          GrimoireReader, NextStepReco, TokenCTAs, legal, PasswordInput (œil),
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
    sentences.js       — 50 Sentence Builder items
    phrasalVerbs.js    — 56 phrasal verbs
    placement.js       — 85 Battle Scan questions + tier levels + mission modules
    achievements.js    — 58 achievements (incl. 16 Gauntlet, 4 Word Tavern, 4 Duel)
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
- **`App()` reste le seul détenteur de l'état global** : 25 `useState`, 24 effets, 43 fonctions internes (`sv`, `addXp`, `applyXpGates`, `grantChestLocal`, `onboard`, `recover`, `logout`…). Les écrans sont **prop-driven** : ils reçoivent `u`, `done`, `back`, `nav`, `gate`… et ne touchent jamais l'état d'`App()` directement. Pas de contexte React, pas d'extraction des hooks (Phase 4b non retenue) sans décision explicite.
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
- **Le calcul des portes vit dans `src/lib/xp.js`** (pur : `accuracyGate`, `farmMult`, `isBoostedByEvents`, `spotlightMult`, `gateXp`, `settleXp`), testé par `tests/check_xp_gates.cjs`. `applyXpGates` / `addXp` dans `App.jsx` ne font qu'injecter l'état (`u`, événements, médiane, instant) et exécuter les effets rendus (Darics du Focus, jingles, haptique, toast, coffres). Toute règle ci-dessous se change **dans `xp.js` et dans le test**, jamais dans App.jsx. La table des ligues est injectée (`ctx.leagueOf`) : `lib/league.js` importe Supabase et n'est pas requérable en Node.
- **No daily XP cap.** Diminishing returns per module per day are the anti-farming mechanism.
- **Flashcards give 0 XP.** Reframed as memorization-only tool. Students earn XP on vocabulary via Word Tavern (15Q quiz) instead.
- **Diminishing returns:** Mock tests 100/40/0% per day. Other modules follow standard gates.
- **Accuracy gate:** <30% accuracy → 10% XP, 30-49% → 50%, ≥50% → 100%.
- **TOEIC Progression ranking is the primary bonification metric.** XP Overall is secondary.

### TOEIC Score Estimator (Chantier A — refonte V2, 2026-06-09)
- `estimateToeic(raw, total)` — piecewise curve, harder to gain at the top. Échelle **section** (5-495), pas un total.
- `estimateTOEICScore(ms, opts)` — **retour structuré** `{total, listening, reading, estimable, evidence, reason?}`.
  - **`estimable`** : `true` (chiffre complet), `"partial"` (une seule section calculable → `total:null`), ou `false` (`total/listening/reading:null` + `reason:"insufficient_data"`). **`total` peut être `null`** : tout call site doit le gérer (un cold-start à 200 trompeur n'existe plus).
  - **Gating A.1** (seuils = décision produit, ne pas toucher sans validation) : Reading exige ≥80 Q cumulées sur les modules contribuant au Reading, Listening ≥40 Q, **OU** ≥1 Mock complété (débloque + sert d'ancrage).
  - **Sections normalisées proportionnellement** (`wSum/wTot`). ⚠️ NE PAS revenir au hack `wSum+=(1-wTot)*0.01` : il écrasait le Reading des profils à couverture partielle (défaut historique "Reading 8/495").
  - **Reading backbone** (A.2) : drill .22, p6 .15, p7 .18, wordfam .06, connsort .06, prepdrill .05, gerinf .05, falsefr .04, pvdojo .04, sbuild .04, gauntlet(moy 4) .11.
  - **Reading support (Chantier B, 2026-06-10)** — poids FAIBLE, garde-fou validité (backbone dominant) : tavern .05, clue .04, traps .04, modals(moy match+sort) .04, bforge .03, timesim .03, stratquiz .02, daily .03. Principe : tout module à précision réelle qui donne de l'XP bouge le score (exceptions : Flashcards 0 XP + jeux d'arcade sans précision).
  - **Listening** (A.3) : lisP1 .18, lisP2 .27, lisP3 .25, lisP4 .22, ablitz .08.
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
- **`ChestEarnedToast`** at grant moment (bottom-center, above tab bar). Queue (FIFO) + anti-interruption during tests (boss/endless/mock) + queue dispatcher useEffect.
- **`ChestOpenModal` V2 sequential** (since 2026-04-27 step 3) — chests now drop **2-5 items** instead of 1. Phase reveal cycles through `result.rewards` via `revealIdx` ; each card remounts (key on revealIdx) so the fall+settle anim replays. Bottom button toggles "Next" → "Collect" on the last item, with a "n / total" indicator. New `ChestRewardCard` helper centralizes per-type rendering (xp/avatar/skin/frame/title/cheat_sheet/token).
- **`TreasureChestSvg`** = reusable inline SVG wooden chest with gold lock. Scales from 54px (toast) to 180px (modal).
- **`getTriggerLabel(trigger)`** converts trigger IDs to human FR/EN labels (e.g. `mock_1` → "Mock Test 1 completed", `daily_login_2026-04-27` → "Daily login reward", `mastery_drill` → "Module mastery: drill").
- **Legendary differentiation**: 400ms gold radial flash before toast + shimmer sweep on toast + 12s display.
- **Teacher account CAN receive chests** (GHOST_NAME filter is only for TeacherDash student list — NOT for chest grants, despite older CLAUDE.md wording).

#### V2 reward types (since 2026-04-27)
- **Avatars / Skins** : V1 cosmetics (player_rewards table, equipped via `students.skin_id` / `u.avatar`)
- **Frames** : avatar borders/glow CSS (player_rewards `reward_type='frame'`, equipped via `students.frame_id` / `u.equippedFrame`). 8 entries in FRAMES.
- **Titles** : text label under name (player_rewards `reward_type='title'`, equipped via `students.title_id` / `u.equippedTitle`). 12 entries in TITLES.
- **Cheat Sheets** : codex pages rendered via GrimoireReader wrapping (player_rewards `reward_type='cheat_sheet'`). 3 stubs in CHEAT_SHEETS V1, more content authoring deferred.
- **Tokens** (stackable consumables) : 7 types in TOKEN_TYPES, stored in dedicated `player_tokens` table (composite PK user×class×type, qty, cap-aware via `grant_token` / `consume_token` SQL helpers). `diminishing_bypass` (cap 5), `streak_shield` (cap 3, **passive auto-consume** at load if 1-day gap detected), `daily_reroll` (cap 1, clickable from Collection → resets `u.mission`), `mock_reset` (cap 2 — semantic deferred), `boss_reset` (cap 1, in-context CTA on Train Mocks → arms `u.bossResetArmed` → bypasses canUnlockBoss 24h cooldown), `endless_resurrect` (cap 2, in-context CTA → arms `u.endlessResetArmed` → bypasses getEndlessState cooldown), `insight_token` (cap 3, parking slot — drops 30% on Légendaire only, no consumption logic yet).

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
- `mastery_<modId>` (Champion) — once per module at total ≥ 50 Q && correct/total ≥ 0.8. **Blacklist** : `mock1/2/3, boss, daily, csess` (already covered by other triggers or non-progressive activities).

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
- `SELF_MANAGED` routes that handle their own BGM: boss, endless, matchE, wfall, duel, sbuild, clue, tavern, **gauntlet**. These are excluded from centralized control.
- Auto-start on first user interaction: only triggers `bgm_home` if `tab==="home" && !sp`.

### Grammar Gauntlet 🛡️ (S2 major feature, delivered 2026-04-22)
- Route `sp==="gauntlet"` → `GauntletHub` component.
- 4 sub-modules rendered via internal `subMode` state: `"irregular"` (IrregularCrypt), `"tense"` (Chronomancer), `"passive"` (PassiveForge), `"relative"` (RelativeWeaver).
- `onModuleDone(subId, sc, tot, xp)` prop bubbles completion to App, which runs the standard XP pipeline: `applyXpGates` → `addXp` → `recordModule("gauntlet_"+subId)` → `grantWeeklyChest` if perfect.
- Each sub-module has its own BGM: `bgm_crypt` / `bgm_chrono` / `bgm_forge` / `bgm_weaver`.
- Content pool: 270 items total (80/70/60/60). Session size 15 everywhere.
- TOEIC estimator: reading section has a new `gauntlet` weight of 0.15 (avg accuracy across the 4 sub-modules).

### Modal Council ⚖️ (S2 module, delivered 2026-04-30)
- Route `sp==="modals"` → `ModalCouncilHub` component.
- 2 sub-modules : `"match"` (ModalMatch — tap-to-pair, 3 boards × 5 pairs = 15 items) + `"sort"` (ModalSort — tap-to-bucket among 4 functions: Obligation / Advice / Possibility / Deduction).
- Same `onModuleDone(subId, sc, tot, xp)` pipeline as Gauntlet → `recordModule("modals_"+subId)`.
- **First app-wide use of the tap-to-pair UX pattern** (precedent for future drag/drop-style activities without HTML5 DnD lib — mobile-first, zero dependency).
- BGM **placeholder**: both sub-modules currently wired to `bgm_chrono`. Generate 2 dedicated Mureka tracks and replace in `ModalCouncilHub` `cards` config.
- Content pool: 15 boards × 5 pairs (75 Match items) + 50 Sort items in `src/data/modals.js`. Session: 15 items everywhere (Tier B XP).
- Single grimoire (`GRIMOIRE_MODALS`, 7 chapters FR) accessed from the hub.
- 4 achievements added (council_initiate / oracle_voice / verdict_sworn / council_crowned).
- TOEIC estimator: NOT wired in yet (deliberate — no rebalance until next pass).

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
- **Main app** (Home, Train, Games, League, Profile, modules): **English**
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
- **P3 training:** `public/audio/p3/{id}_line{0-3}.mp3` + `{id}.mp3` (stitched)
- **P4 training:** `public/audio/p4/{id}.mp3`
- **Boss test:** `public/audio/boss/p1_XX_Y.mp3`, etc.
- **Audio Blitz:** `public/audio/blitz/{id}.mp3`
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
if(sp==="moduleName"){playBGM("bgm_name");return pg(<Component done={function(...){stopBGM();handler(...);}} back={function(){stopBGM();sSP(null);sT("tab");}}/>);}
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
| `weekly-results` | Monday 08h CET | Personalized weekly ranking |
| `inactive-reminder` | Every 3d 17h CET | Inactive 7-30d, active classes only |

Anti-spam on `inactive-reminder` via `students.inactivity_push_sent` (max 1 per 14d).
