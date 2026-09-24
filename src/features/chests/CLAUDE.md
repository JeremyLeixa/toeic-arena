# Coffres, récompenses, jetons, échelons de maîtrise

> Chargé quand on travaille dans `src/features/chests/`. Règles de maîtrise lues aussi par `lib/hubStatus.js` ; plafonds des jetons côté serveur : `supabase/CLAUDE.md`.

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
- `mastery_<modId>` (Champion) — **échelons de maîtrise depuis le 2026-09-19** (proto `prototypes/mastery-tiers/`, variante B « coffre suivant ») : I = 50 Q à 80 % sur le cumul (`mastery_<mod>`, inchangé), II = 150 Q, III = 300 Q (**Légendaire**), puis un échelon tous les +150 Q (`mastery_<mod>_<n>`, Champion) ; au-delà de I, 85 % sur les ~50 dernières questions (`recentAcc`), et **7 jours au moins entre deux échelons** d'un module. 50 Darics par échelon (`mastery_marks_<mod>[_<n>]`). Échelon atteint = `moduleScores[mod].mt = {n, date}`, posé par le watcher d'`App.jsx` (`markTier`, `sU(prev => …)` + save) sur **toute** réponse du serveur : accordé → daté du jour ; déjà servi à l'échelon I = coffre d'avant les échelons → daté `TIERS_EPOCH` (2026-09-19 : rattrapage choisi par Jérémy, tout le monde attend 7 jours au lieu d'une avalanche de coffres II). **Sans `mt`, rien n'est acquis** (supposer l'échelon I gagné priverait de coffre tout module maîtrisé après la mise en ligne). `recordModule` recopie `mt` (il reconstruit l'objet). Garde anti-boucle par module ET par échelon. **Blacklist** : `mock1/2/3, boss, daily, csess, hunt`. Règle, seuils et liste noire dans `lib/hubStatus.js` (`TIERS`, `tierStatus`, `hubTierStatus`, `tierTrigger`, `MASTERY_BLACKLIST`), lus par le watcher ET par les tuiles : ne jamais les recopier ailleurs. Libellé : « Mastery II: Word Tavern » (`chestLabels`). Tests : `check_hub_status` (section 8).

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
