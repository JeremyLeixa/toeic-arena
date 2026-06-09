# TOEIC Arena — Project Conventions & Context

## Project Overview

TOEIC Arena is a gamified TOEIC exam preparation web application built by Jérémy Leixa, English trainer at IDRAC Business School (Lyon/Grenoble). Used by ~66 Bachelor 3 students (class code: `idrac2026`) and planned for deployment at other institutions (CESI, professional learners).

The app is a **monolithic React application** — all UI logic lives in `src/App.jsx` (~14,860 lines as of 2026-04-30). Jérémy is the sole developer; Claude is the technical partner.

**Live URL:** Deployed on Vercel
**Supabase project ref:** `huklmklwvwwhhrrcyytq`
**Current state:** See `CONTEXT.md` at project root for the living state (what's done, what's next).

---

## Tech Stack

- **Frontend:** React 19 + Vite 8 (build tool: Rolldown via Vite)
- **Main file:** `src/App.jsx` — monolithic, contains all components and inline CSS
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

No test framework integrated — testing is manual.

---

## Project Structure

```
src/
  App.jsx              — Main app (~10,700 lines, all components + inline CSS)
  main.jsx             — React entry point
  sounds.js            — Web Audio API synthesized SFX + jingles
  chests.js            — Loot/reward system (imported from src/data/chests.js)
  supabase.js          — Supabase client init
  data/
    vocab.js           — 870 flashcards, 18 domains
    grammar.js         — 410 Part 5 drill questions
    listening.js       — P1 (43), P2 (125), P3 (30 convos), P4 (31 talks)
    part6.js           — 30 texts, 120 blanks
    part7.js           — 39 passages
    mockTests.js       — Mock Tests 1-3
    bossTestFull.js    — The Final Arena (full TOEIC, 202Q, 7 parts)
    miniGames.js       — Word Families, Connectors, Preps, Ger/Inf, False Friends, Traps
    audioBlitz.js      — 60 Audio Blitz items
    clueHunter.js      — 80 Clue Hunter items
    sentences.js       — 50 Sentence Builder items
    phrasalVerbs.js    — 56 phrasal verbs
    placement.js       — 20 Battle Scan questions + tier levels + mission modules
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
  tts.js               — ElevenLabs TTS proxy
supabase/
  functions/
    streak-reminder/   — Daily 20h CET push
    weekly-results/    — Monday 08h CET ranking push
    inactive-reminder/ — Every 3d 17h CET push for 7-30d inactive students
prototypes/
  chest-animations/    — HTML standalone design prototypes (not deployed)
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

- **Use Plan Mode** (`/plan`) before any structural change to App.jsx (new module, refactor, new Supabase table).
- **Use `/compact`** after 3-4 exchanges or whenever Claude seems to lose context on App.jsx specifics.
- **Use `/clear`** when switching to a completely different topic.
- **Auto push + pull authorized**: after each commit, push to main and pull on user's main repo automatically. No confirmation needed.

---

## Critical Development Rules

### Architecture
- **App.jsx is monolithic.** All components, state, routing, and CSS live in one file. Do not attempt to split it without explicit instruction.
- **Inline CSS via template literal** at the top of App.jsx (the `CSS` variable). Class `.crd` has `background: var(--bg2)` which overrides inline styles.
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
  - **Reading élargi** (A.2) : drill .22, p6 .15, p7 .18, wordfam .06, connsort .06, prepdrill .05, gerinf .05, falsefr .04, pvdojo .04, sbuild .04, gauntlet(moy 4) .11.
  - **Listening** (A.3) : lisP1 .18, lisP2 .27, lisP3 .25, lisP4 .22, ablitz .08.
  - **A.5 pondération par confiance** : poids effectif × {q<10:0.3, <30:0.6, <100:0.85, ≥100:1}.
  - **Bonus mock asymétrique (Kamel-safe)** : `+(acc−0.60)×0.30` par mock >60% (cap +0.20). Ne pénalise jamais une mauvaise perf mock. Remplace l'ancien +5%/+5%.
  - **A.4 ancrage Boss** : si `opts.bossToeic` (= `mockResults.boss.toeicEstimate`, échelle 990) fourni → `0.60×bossToeic + 0.40×estim_modules`. Optionnel, câblé depuis les vues "score perso". Non validé numériquement (aucun Boss dans la cohorte IDRAC T2).
  - **Validation** : `tests/validate_toeic_estimation.cjs` (corrélation + cas-test sur CSV cohorte) et `tests/verify_patched_estimation.cjs` (égalité fonction patchée ↔ V2). Patch de prod : `scripts/patch_chantier_A_toeic_estimation.cjs` (idempotent, écrit `App_patched.jsx`).
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
- **User-initiated speak() must call resumeAudioSession() first**: `speak()` / `speakAndWait()` bail out early if `_audioAborted` is true. Components that play audio on click WITHOUT mounting a `resumeAudioSession` useEffect (SpeakBtn, Flashcards, Word Tavern) need to reset the flag themselves at click time — otherwise any prior Listen unmount leaves the flag set and they stay silent. `SpeakBtn.go()` handles this centrally.

### Icon system (2026-04-22)
- **`<GIcon name size color block style/>`** — inline SVG helper at top of `App.jsx` (~line 174). Renders an Iconify `game-icons:` path from `GAME_ICON_PATHS`. `color` defaults to `currentColor`. Use skin-aware `var(--cyan)` for module content; specific hex for signaling (e.g. gold for achievements).
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
Les setters dans `App.jsx` utilisent souvent des raccourcis : `sN` (setName), `sU` (setU), `sT` (setTab), `sSP` (setSp), `sL` (setLoading). Avant d'appeler un setter dans une fonction inline (notamment dans les composants Onboard, Home, Train, etc.), **grep** pour confirmer qu'il existe dans le scope. Les `ReferenceError` runtime sont invisibles à la compilation.

### 6. BUILD_ID synchronisé
Le `BUILD_ID` hardcodé en haut d'`App.jsx` (ligne ~369) doit refléter la date du dernier changement significatif. S'il est obsolète, les logs console sont trompeurs. À bumper à chaque session de modif critique.

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
- Works fine in JS string literals (array items, attribute values).

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
- **RLS on `push_subscriptions` and `weekly_snapshots`** was disabled after persistent cross-device anonymous auth issues.
- **Column `skin_id`** (not `equipped_skin`) stores the equipped skin.
- **Assets in `public/`** must be `git add`-ed or Vercel won't deploy them (silent 404). Past bug: `bgm_tavern.mp3` existed locally but not in git → silent playback failure.

### React
- **Hooks must be at component top level** before any conditional returns.
- **`useMemo` with empty deps `[]`** for shuffled question sets.

### CSS
- **`.crd` class** forces `background: var(--bg2)`. Override requires removing the class.
- **Skin animations:** use `background-image:` NOT `background:` shorthand when animated.
- **Shimmer overlays use `::after` pseudo-elements** with parent `position:relative!important;overflow:hidden!important`.
- **`.app:not(.onboard-shell)`** selector allows onboarding to skip the desktop 200px sidebar margin.

### PWA / Service Worker
- **`sw.js` v3** — network-first with `{cache:'no-cache'}` for HTML/JS.
- **`index.html`** registers SW with `{updateViaCache:'none'}`.
- **`controllerchange`** listener auto-reloads the page.
- **Build ID** logged on startup for deployment verification.

---

## Audio Conventions

### File naming
- **P1 training:** `public/audio/p1/{id}_{0-3}.mp3`
- **P2 training:** `public/audio/p2/{id}_q.mp3` + `{id}_{0-2}.mp3`
- **P3 training:** `public/audio/p3/{id}_line{0-3}.mp3` + `{id}.mp3` (stitched)
- **P4 training:** `public/audio/p4/{id}.mp3`
- **Boss test:** `public/audio/boss/p1_XX_Y.mp3`, etc.
- **Audio Blitz:** `public/audio/blitz/{id}.mp3`
- **BGM:** `public/audio/bgm/bgm_{name}.mp3`

### ElevenLabs
- Voices: Sarah (W) = `EXAVITQu4vr4xnSDxMaL`, Adam (M) = `pNInz6obpgDQGcFmaJgB`
- Model: `eleven_multilingual_v2`
- Settings: `stability: 0.55, similarity_boost: 0.75, speed: 0.85`
- Audio files are pre-generated. ElevenLabs credits for generating new content only, never runtime.

### BGM Wiring Pattern
```javascript
// In the router:
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
| `VAPID_PUBLIC_KEY` | App.jsx | Safe to expose client-side |
| `VAPID_PRIVATE_KEY` | Vercel only | Server-side push signing |
| `VITE_PUSH_SECRET` / `PUSH_SECRET` | `.env` + Vercel | Push endpoint auth (same value, 2 names) |
| Teacher dashboard password | Vercel env vars | Do not store in code |

---

## Companion Documentation

- `CONTEXT.md` (project root) — Living state: what's done, what's in progress, what's next
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
