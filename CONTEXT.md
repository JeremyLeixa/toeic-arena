# TOEIC Arena — Current State

> **Living document.** Updated at the end of each working session. Captures the snapshot of where the project stands, what's just been shipped, and what's queued.
> For permanent conventions (architecture, code rules), see `CLAUDE.md`.
> For the full S2 backlog tracker, see `.claude/projects/.../memory/project_todo_s2_progress.md`.

---

## Last session: 2026-04-23 → 2026-04-24 (narrator Aldric + League baseline + Stripe hardening + incident cleanup)

**Trois jours de travail condensés. ~25 commits.** Chantier narratif Aldric complet, fix baseline League pour Idrac, onboarding Stripe en conditions de conformité légale FR (CGV v1.0, médiateur MED60239, persistance consentement), test E2E avec découverte de 2 bugs de dédup de profils, et **un incident majeur** (row Teacher/teacher-internal supprimée par accident durant le cleanup — restaurée).

### Narrator / Aldric — chantier complet (2026-04-23→24)
- 8 moments narratifs, voix off ElevenLabs + illustrations Leonardo
- Overlay parchemin full-screen, Chronicles replay dans Profile, toggle mute
- Sous-titres FR timés sur les vrais timestamps audio (ffprobe-mesurés)
- Fade-from/to-black symétrique ouverture/fermeture
- Mask rectangulaire pour l'illustration (fade sur 4 bords au lieu d'ellipse)
- Bootstrap auto pour étudiants existants (pas de spam de popup rétroactif)
- Integration dans Supabase via colonne `narrator` jsonb ({heard:[], muted:false})

### League Progress — fix baseline TOEIC (2026-04-23→24)
- **Problème** : étudiants inscrits en cours de saison (cas Anaïs) pénalisés car le système prenait le premier snapshot hebdo > 200 comme baseline au lieu de leur vrai point de départ
- **Fix** : hiérarchie `battle_scan → first_snapshot>200 → 200`. Nouvelle fonction `battleScanToToeic(bs)` avec mapping linéaire 0-20 → 200-600
- **Idrac cohort** : conserve le fallback snapshot (la plupart n'ont pas de Battle Scan)
- **Follow-up post-Idrac noté** : refonte Battle Scan en vrai test de positionnement

### Monétisation / Stripe sandbox (2026-04-24)
**Livré** :
- CGV v1.0 finalisée (SIRET 830 200 556 00025, APE 85.59B, entrée en vigueur 24/04/2026)
- Archivage snapshot `docs/cgv/v1.0-2026-04-24.md`. Règle commentée : chaque bump CGV_VERSION duplique avant modif
- Médiateur MED60239 (MÉDIATION CONSOMMATION DÉVELOPPEMENT, St-Étienne) — bloc verbatim imposé intégré dans CGV + page `<MediationInfo/>` in-app
- `<PrivacyPolicy/>` mise à jour avec Stripe sous-traitant + finalités paiement + 10 ans pièces comptables
- Double checkbox obligatoire UpgradeScreen : CGV (L.221-5) + renonciation rétractation (L.221-28 13°). Boutons désactivés tant que non cochés
- Persistance `cgvAcceptedAt`, `cgvVersion`, `retractationWaivedAt` côté client (save) + server (webhook via Stripe metadata)
- Bouton `✕ Résilier` distinct de `🔧 Gérer` pour Premium Mensuel (L.215-1-1)
- Edge Function `pass3m-expiration-reminder` : rappel J-7 avant expiration du Pass
- Bouton "🚪 Déconnexion complète" dans Profile → Gestion du compte → Actions critiques (hard logout)
- Feature flag `PREMIUM_UPGRADE_ENABLED = false` — bouton Premium grisé en attendant validation E2E propre

**Bug dédup + fix structurel** :
- En sandbox, checkout sur Jaytest2 updatait la row Teacher (legacy id = auth_user_id)
- **Fix** : `updateStudentAccess` match par clé naturelle `(name, class_code)` en priorité (via Stripe metadata), fallback id, fallback email avec warn

### Incident 2026-04-24 : cleanup trop large → restauration manuelle
Durant les manips de nettoyage des profils test post-sandbox, mon SQL `DELETE FROM students WHERE email LIKE 'leixa.jeremy+test%'` a emporté la row Teacher / teacher-internal (email `+test25@gmail.com` utilisé comme alias de sécurisation).

**Restauration** : via les weekly_snapshots (W16 du 2026-04-20, xp=24411) + la row idrac2026 legacy (id=baf51c1f) transformée en teacher-internal. UPDATE SQL direct. narrator.heard re-filled manually avec les 8 moments.

**Règle gravée en mémoire** (feedback_no_delete_by_email_pattern.md) : plus jamais de DELETE sur students par pattern d'email. Toujours SELECT d'abord avec verdict par row, DELETE par id IN (...) après validation humaine.

### État actuel (fin de session)
- Premium flow : feature flag OFF en prod, bouton "Bientôt disponible"
- Teacher / teacher-internal restauré, premium_pass jusqu'au 2026-07-19, 8 chroniques débloquées
- Tous les commits sur origin/main (HEAD ≈ 1781b62 + 2e71758 + patches suivants), Vercel deployed
- **Chantier ouvert reporté next session** : refonte en profondeur du flow Magic Link (sécurité alias email, dédup profils par email, flow "Welcome back" vs hard logout, auth user lifecycle)

---

## Previous session: 2026-04-22 evening (session "focused-chaum" — Icon refactor + XP rebalance)

**21 commits.** Complete cosmetic refactor of the icon system (emojis → SVG game-icons), plus two gameplay fixes surfaced along the way.

### Icon refactor — 60 SVG game-icons migrated from emoji

**Infra**
- New `<GIcon name size color block style/>` helper in `App.jsx` (line ~174) for inline SVG rendering.
- `GAME_ICON_PATHS` in `src/data/avatarIcons.js` extended to **60 entries** (from 1 to 60).
- All game-icons.net SVGs fetched via a Python script (Iconify API), stripped to just the `<path fill="currentColor" d="..."/>`, stored as JS string values.

**Zones migrated**
- **Tab bar** (5 icons): castle / bullseye / coliseum / laurel-crown / visored-helm. V5 bg style: gradient fade to `var(--bg3)` + skin-tinted top border; inactive icons `var(--t1)` @ .55 opacity for legibility in both light and dark modes.
- **Home** (6 icons): star-formation · progression · path-distance (stats) · card-joker · ink-swirl (quick start) · candle-flame (tip).
- **Train sections & items** (~30 icons): crossed-swords / bookshelf / scroll-unfurled / treasure-map (sections) · sunrise / ringing-bell / bookmarklet (exercises) · card-joker / gauntlet / family-tree / duality-mask / knot / linked-rings / scales / shuriken (G&V) · scroll-quill (mocks) · info / card-pick / brain / trap-mask / book-aura (tips).
- **Boss + Endless**: dragon-spiral + infinity (main cards + decorative bg + nav pills).
- **Games** (7 icons): beer-stein / chained-arrow-heads / meteor-impact / brick-pile / lyre / spyglass / swords-emblem.
- **Listening / Reading hubs + intros** (8 icons): ringing-bell / bookmarklet (heroes) · eye-target (P1) · conversation (P2 & P3) · public-speaker (P4) · quill-ink (P5 drill) · sands-of-time (P5 sim) · stone-tablet (P6) · bookmark (P7).
- **Module intros (G&V)**: knot (ConnSort) · linked-rings (PrepDrill) · scales (GerInf) · shuriken (PhrasalDojo) · duality-mask (FalseFriends) · gauntlet (Gauntlet hub).
- **Mode tiles**: bookmarklet (Grimoire) · quill-ink (Context Quiz) · puzzle (Meaning Match) · lightning-bow (Particle Picker) · dungeon-gate (Entrer Gauntlet).
- **Gauntlet sub-module data + intros**: tombstone / clockwork / anvil-impact / spider-web.
- **Profile tiles** (3 icons): rune-stone (Stats) · trophy-cup (Achievements) · gem-necklace (Collection). Style tile keeps avatar preview.

### Tile design pattern (unified)
Module-item tiles (Games 48×48, Train sub-view 42×42, Listen/Reading Hub 42×42, Mock sub-view, Mock Exams hero) unified to:
- `background: linear-gradient(135deg, rgba(var(--cx),.22), transparent)` (V10 diagonal skin tint)
- `border: 1.5px solid var(--cyan)` (skin-aware)
- Icon color `var(--cyan)`
- Visitor-locked state: transparent bg + `var(--bdr)` border + `var(--t3)` icon

**Kept distinctive** (signal value): Boss red, Endless blue, Home stats pills (gold/cyan/purple), Style avatar tile.

### CSS tokens added
- `--bg-rgb` / `--bg2-rgb` / `--bg3-rgb` in both `:root` and `.light` → lets any `rgba(var(--bgN-rgb), alpha)` gradient follow the mode.
- `.gauntlet-btn-grim` migrated from hardcoded beige to `rgba(var(--cx),...)` / `var(--cyan)` so Grimoire buttons are readable on light mode.

### Two fixes along the way

**1. XP toast silent on Gauntlet** — `pg()` wrapper (`sp===X` routes) did not render `<XpToast>` / `<AchToast>`. Most modules masked the bug because their done-button navigates to Train (sp=null) where the toast IS rendered. The Gauntlet stays on `sp==="gauntlet"` after a sub-module ends → toast never hits the DOM. **Fix**: render both toasts inside `pg()`.

**2. TTS silent on Flashcards after a Listen session** — regression from 737c780 + 54375c0 audio-leak commits: `speak()` checks `_audioAborted` at entry, and Flashcards / Word Tavern / SpeakBtn don't mount the `resumeAudioSession()` useEffect that resets it. **Fix**: `SpeakBtn.go()` calls `resumeAudioSession()` before `speak()` — user click implies any prior abort chain is done.

### Gauntlet XP rebalance — tier B

Jérémy flagged the feeling that Gauntlet pays less than peers. Verified: Irregular was 4 XP/Q (60 max), the 3 others 5.33 XP/Q (80 max), vs Word Tavern 7.33 (110), SentenceBuilder 6.33 (95), Phrasal Picker 6.67 (100) — all 15 Q peers paid more despite being easier. **New formula** applied to all 4 sub-modules:
- Chronomancer / Passive Forge / Relative Weaver: `15 + 5×correct` +35 perfect → **max 125**
- Irregular Crypt: `15 + 5×full + 2×partial` +35 perfect → **max 125** (keeps partial-credit)

Now the Gauntlet is the best-paying 15 Q module (reflects actual difficulty: typed answers, 30s timer, complex transforms).

### Prototypes produced (all in `prototypes/`)
`tab-icons/` · `home-icons/` · `train-games-icons/` · `module-intro-icons/` · `parts-icons/` · `profile-icons/` · `tile-bg-nuances/` · `tabbar-style/` — standalone HTML with Iconify CDN + skin/mode toggles used to pick each icon set.

### Key learnings
- **Python string escapes for emoji ≠ JSX source encoding**: the same emoji can appear as literal codepoint (`\U0001F409`), as a surrogate-pair escape inside the JS source (`\\uD83D\\uDC09`), or with / without `\uFE0F` variation selector. First pass of the Train+Games swap silently failed on ~30 patterns for this reason. Solution: regex keyed on structural anchors (`{id:"X"}` / `{key:"X"}`), independent of the emoji bytes.
- **Always verify via grep after a bulk script reports "OK"** — the script returning "Applied: 36/42" was technically accurate but misleading: most of the 36 were the trivially-matching ones; the real critical patterns didn't match.

### Previous session wrap-up (2026-04-22 afternoon)
Session "loving-merkle" — see archive section below. Gauntlet build complete (270 items, 4 sub-modules, 16 achievements) + G&V overhaul (3 grimoires, menu reorder, back button unification, audio leak flag).

---

## Earlier session: 2026-04-22 afternoon (session "loving-merkle" — Grammar Gauntlet build + G&V overhaul)

Session majeure S2 consacrée au **chantier Grammar Gauntlet** (nouveau module morpho-syntaxe) et à l'**harmonisation G&V** (grimoires, back buttons, reorder, i18n). **22 commits**. Tous livrés, buildés, pushés, stables en prod. Teacher Dashboard et Onboarding inchangés. Monetization en pause (bug visitor de la session précédente reste à débugger — voir section archive ci-dessous).

### Gauntlet — livraison finale
- **4 sous-modules** jouables : Irregular Crypt 🪦 (input V2/V3, 15s timer), Chronomancer ⏳ (QCM tenses, marker hint), Passive Forge ⚒️ (QCM transform+fillin, 30s timer), Relative Weaver 🕸️ (QCM relatives)
- **270 items** au total (80+70+60+60), session size 15 = pool ratio ≥4x
- **4 grimoires Gauntlet** (FR, parchemin + CSS 3D flip) : Chronomancer, Passive Forge, Relative Weaver, Champion meta
- **16 achievements** : 5 Tier 1 Discovery (Novice) + 4 Tier 0 Mastery (Guerrier) + 4 Tier 2 Perfect (Guerrier Epic) + 2 Tier 3 Consistency (Légendaire) + 1 Meta (Légendaire)
- **4 BGM Mureka** dédiés : bgm_crypt / bgm_chrono / bgm_forge / bgm_weaver
- **TOEIC estimator rebalancé** : reading weights 0.30/0.20/0.25/0.10/**0.15** (nouveau poids Gauntlet)

### G&V overhaul (au-delà du Gauntlet)
- **3 grimoires G&V** ajoutés : GerInf (remplace Study Mode), PhrasalDojo (remplace Study Mode), ConnSort (nouveau + intro screen)
- **Menu G&V reorderé** (pédagogique) : Flashcard → Gauntlet → WordFam → FalseFriends → ConnSort → PrepDrill → GerInf → PhrasalDojo
- **Back button harmonisé** (~30 boutons refactorés) : classe `.back-btn` + `← Back` label, min-height 40px mobile
- **PrepDrill + FalseFriends** : back-btn top-left absolute ajouté aux intros centrées
- **CardSess route split** : csess retourne au G&V menu, cdom garde le back minimal

### Fixes techniques
- **Audio leak fix** : nouveau flag `_audioAborted` + `resumeAudioSession()` — les séquences async de Listen P1/P2/P3/P4 + Boss Test + Endless Arena ne laissent plus d'audio en fuite après unmount
- **Grimoire page number** : numéro romain passé de `position:absolute` (viewport-fixed) à `margin-top:auto` (flow-aware) — n'overlap plus le contenu
- **i18n Gauntlet** : 100% chrome EN (hub, intros, end screens, reveal labels, buttons) ; grimoires restent FR
- **Encoding** : tous les `\uXXXX` en JSX text converted to real UTF-8 (incluant le fix Daily Quest "Mission complete —")

### Prochaine cible (nouvelle session)
**Chantier icons identity** — Jérémy a flaggé l'incohérence emoji à la clôture de session :
- Audit complet des emojis actuels
- Direction : medieval-fantasy-adventure (cohérent avec Gauntlet/grimoires)
- Possiblement migration Iconify SVG (pattern déjà existant dans `src/data/avatarIcons.js`)
- Voir `memory/project_next_chantier_icons.md`

---

## Archive session 2026-04-20 ("intelligent-blackburn" — monetization marathon)

Session démarrée le 17 avril (kickoff monétisation, CGV draft, migration Teacher) et **poursuivie sur le 20 avril** en grosse séance de construction + debug. À la clôture du 20 avril au soir : **Phases 1→4 code-complete**, **Phase 3 validée end-to-end** sur le compte Teacher, **Phase 4 bloquée sur un bug de propagation** détecté en test visitor (jay_test) en fin de session.

---

## 💰 Monetization chantier — PHASES 1 à 4 livrées

### Décisions business verrouillées
- **B2C pur** — pas d'architecture institutionnelle (écoles gérées cas par cas manuellement)
- **Tarification (révisée 2026-04-20)** : **9,99€/mois** recurring OU **22,99€ TOEIC Pass 3 mois** one-shot (pas d'annuel)
- **Pas de période d'essai** — freemium permanent conservé (9 modules gratuits depuis retrait de `sbuild` le 2026-04-20)
- **Cutoff IDRAC 2026-06-28** (date réelle)
- **Statut éditeur** : micro-entreprise, franchise TVA art. 293 B CGI
- **Jérémy (Teacher)** : migré sur `class_code='teacher-internal'` (permanent, end_date=NULL)
- **Système PIN supprimé** le 2026-04-20 (commit 28450f4 + fix 24cdbce) — magic link auth remplace

### Phases — état au 2026-04-20 soir

| Phase | Statut | Détails |
|-------|--------|---------|
| 0a. Teacher class code standalone | ✅ DONE | Migration SQL exécutée (24195 XP Teacher préservés) |
| 0b. Stripe setup + CGV + médiateur | 🟡 partiel | Compte Stripe test actif, produits créés, webhook configuré, env vars Vercel OK. CGV relecture juriste reportée. Adhésion CNPM soumise (attente validation). |
| 1. Magic link auth | ✅ DONE (Sessions 1-3) | Profile email button + onboarding email step + Home banner + "Log in with email" pour cross-device |
| 2. Data model subs | ✅ DONE | Tables `subscriptions`, `passes`, `stripe_events` créées en prod Supabase avec RLS |
| 3. Stripe Checkout B2C | ✅ DONE + tested | 3 endpoints Vercel livrés. Testé end-to-end sur compte Teacher avec Pass 3m (webhook → passes row → students.access_level sync via email fallback). **14 commits de debug** pour arriver à stable. |
| 4. Premium gating | 🟡 code livré, **bug bloquant** | `hasFullAccess()` helper + paywall redesigné avec CTA direct vers UpgradeScreen. Testé en Teacher (groupType=school, full access). **Test visitor jay_test pas concluant** : paiement Stripe validé mais `students.access_level` reste "free" côté app — voir section debug ci-dessous. |
| 5. Cutoff IDRAC 2026-06-28 | ⏳ | À démarrer après Phase 4 stabilisée |

### Artefacts produits

- [`CGV_draft.md`](CGV_draft.md) — 20 articles, pricing 9,99 + 22,99, franchise TVA, CNPM en attente
- [`MONETIZATION_CHECKLIST.md`](MONETIZATION_CHECKLIST.md) — checklist exhaustive 13 sections
- [`BUSINESS_SETUP_GUIDE.md`](BUSINESS_SETUP_GUIDE.md) — guide step-by-step Stripe/SIRET/médiateur (8 étapes)
- `public/cgv.md` — copie statique accessible à `/cgv.md` pour le lien UI
- `src/auth.js` — helpers magic link + Stripe checkout/portal (createCheckout, openCustomerPortal, requestMagicLink, linkEmailToAnonymous, getSession, signOutCompletely, onAuthChange)
- 3 endpoints Vercel : `api/stripe-checkout-create.js`, `api/stripe-webhook.js` (avec id→email fallback), `api/stripe-portal-create.js`

### Stripe TEST mode IDs enregistrés (production IDs à régénérer côté live)

- Monthly price : `price_1TOEMo1D3Hu5MKuqEhw58nx7` (prod `prod_UMyJgqYoNnQAkM`)
- Pass 3m price : `price_1TOETE1D3Hu5MKuqne7WsPvt` (prod `prod_UMyQt12EhBQgBW`)
- Env vars Vercel : STRIPE_MODE=test, STRIPE_SECRET_KEY_TEST, STRIPE_WEBHOOK_SECRET_TEST, STRIPE_PRICE_MONTHLY, STRIPE_PRICE_PASS (valeurs test présentes)

### Bug en cours — à débugger demain matin

**Contexte** : fin de session 2026-04-20, Jérémy teste en navigation privée avec un nouveau compte visitor `jay_test`. Il passe par le checkout Stripe, paiement validé côté Stripe, mais `students.access_level` reste "free" côté app.

**Hypothèses à vérifier** :
1. jay_test a-t-il un email confirmé (`email_confirmed_at` non-null) ? Si skip email ou pending, l'endpoint checkout devrait avoir rejeté avec `email_required`.
2. Webhook reçu en 200 ? Vérifier Stripe Dashboard → Webhooks → Recent deliveries pour la session jay_test.
3. Row insérée dans `passes` ? (requête SQL à lancer)
4. `students.access_level` pour jay_test ?
5. `students.id` vs `auth.users.id` pour jay_test ? (mismatch possible si visitor a eu plusieurs anon upgrades)

**Queries de diagnostic à lancer demain matin** (reprendre dans cet ordre) :
```sql
SELECT id, name, class_code, email, access_level, access_expires_at FROM students WHERE name = 'jay_test';
SELECT id, user_id, stripe_customer_id, amount_paid, purchased_at FROM passes ORDER BY purchased_at DESC LIMIT 3;
SELECT id, type, processed_at FROM stripe_events ORDER BY processed_at DESC LIMIT 5;
SELECT id, email, is_anonymous, email_confirmed_at FROM auth.users ORDER BY created_at DESC LIMIT 5;
```

Plus : Stripe Dashboard → Events → filtrer récents `checkout.session.completed` → vérifier livraisons webhook + status.

Si le problème est l'email non confirmé : affiner le flow visitor pour forcer la confirmation email avant permettre checkout. Actuellement l'emailPrompt step dans onboarding advance 1.8s après envoi du link, sans attendre confirmation — possiblement prématuré pour un visitor qui veut payer.

### Timeline cibles

- 2026-05-15 : Stripe test mode validé (bug visitor à fixer avant)
- 2026-06-10 : Stripe LIVE (récupérer nouveaux price_ids en live mode, env vars live)
- 2026-06-28 : Cutoff IDRAC (Phase 5 à implémenter)

---

## What's shipped (cumulative, current production)

### Gameplay & Content
- **Grammar Gauntlet 🛡️** (S2 major) — 4 sub-modules × trials, 270 items, 4 BGM, 16 achievements, 4 grimoires — morpho-syntax pillar complete
- **Endless Arena** ⏳ — unlocked post-Boss ≥650, random full TOEIC, weakness reco on results
- **Word Tavern** 🍺 — 15Q vocab quiz, 3 types (def→word, word→def, fill-in-blank), failed words reset in SRS
- **Flashcards give 0 XP** — memorization tool only, XP earned via Word Tavern
- **SpeedMatch Hard removed** — one mode only
- **Content pools expanded**: P3:50, P4:45, P6:30, P7:39
- **7 grimoires** (4 Gauntlet + GerInf + PhrasalDojo + ConnSort) — parchment reader with CSS 3D page flip, FR theory content, 7 block types

### Onboarding
- **Battle Scan placement test** with TOEIC estimate (200-990 mapping) in Battle Report
- **Push notification opt-in phase** — explicit permission request, 3 reasons listed
- **English "langBridge" transition screen** — signals shift from FR onboarding to EN app
- **3-step Home tutorial tour** — shown once per new student via `tutorialPending` flag
- **Persistent Mock Test nudge** — banner on Home if no Mock after 3 days
- **Desktop layout fix** — `.onboard-shell` CSS centers content (was pushed right by sidebar margin)

### Reward Loop (Chest UX)
- **ChestEarnedToast** at grant moment — queue FIFO, anti-interruption during tests, Legendary gold flash
- **ChestOpenModal V2** — Boss Loot cinematic: SVG wooden chest, screen flash, lid flies + body collapses, wood/metal/magic shards, vertical beam, reward card falls from top with impact ring
- **TreasureChestSvg** component — reusable inline SVG (54px toast, 180px modal)
- **`getTriggerLabel()`** — human-friendly trigger labels (e.g. "Mock Test 1 completed")
- **Haptic feedback** on 10 event types

### Teacher Tools
- **Ghost students filter** — 5th KPI tile + toggle pill + 👻 badges in TeacherDash
- **Weekly Report** — FR print-to-PDF page with 4 sections (Synthèse, Engagement, Progression, Alertes & reco auto)

### Automated Push Campaigns (all EN)
- **`streak-reminder`** — Daily 20h CET for streak ≥ 2 inactive today
- **`weekly-results`** — Monday 08h CET personalized ranking
- **`inactive-reminder`** — Every 3d 17h CET for 7-30d inactive students, excludes expired classes

### Technical polish
- **English uniformization** — UI, push messages, chests.js, Gauntlet chrome. FR kept only where needed (onboarding prefix, privacy, TeacherDash, grimoires)
- **BGM bleed fix** — `bgm_home` no longer continues into Listening exercises
- **Audio leak fix** (2026-04-22) — listening async sequences (P1-P4, Boss, Endless) properly abort on unmount via `_audioAborted` flag
- **Back button harmonized** (2026-04-22) — single `.back-btn` class + `← Back` label across all ~30 training module back buttons
- **Coach tips removed entirely** — onboarding + Mock nudge cover the role
- **Event pills on Home removed** — redundant with banners
- **Explorer achievement bug fix** — onboarding no longer pollutes `moduleScores`
- **Push subscription fix** — explicit `Notification.requestPermission()`
- **4 new Word Tavern achievements** — Tavern Visitor, Silver Tongue, Wordsmith, Tavern Regular
- **16 new Grammar Gauntlet achievements** (5 Discovery + 4 Mastery + 4 Perfect + 2 Consistency + 1 Meta) — EPIC_ACHIEVEMENTS + NOVICE_ACHIEVEMENTS lists added to chests.js
- **Supabase columns added**: `joined_at`, `tutorial_pending`, `inactivity_push_sent`

---

## What's next (not started)

### ✅ Icons identity chantier (COMPLETE 2026-04-22 evening)
60 SVG game-icons migrated from emoji across the whole app — tab bar, Home, Train, Games, Listening, Reading, Gauntlet, Profile. See latest session section above for details. `<GIcon/>` helper + `GAME_ICON_PATHS` infra is now ready for any future icon addition.

### ✅ Decisions resolved (2026-04-17)
- **Reset leaderboard S1→S2** — **reset partiel** (modalités précises à définir)
- **Streaks S1→S2** — **conservés** (ne pas punir les étudiants assidus entre saisons)
- **BDD cleanup** — **pas de cleanup** : les comptes fantômes peuvent être des étudiants peu motivés qui reviendront. On les garde.

### 🔴 September 2026 (for S2 launch)
- **Re-engagement event S2** — décisions de reset tranchées (cf. ci-dessus). Needs:
  - Season 2 Chest exclusive (drop table TBD)
  - XP×2 boost first week
  - **League reset SQL partiel** (modalités à définir : rétrogradation d'un tier ? conservation des XP totaux mais reset ranking hebdo ? à trancher avant septembre)
  - **Streaks preserved** → pas de SQL à écrire pour ça
  - Welcome back push campaign

### 🟠 Monetization (chantier actif — cf. section dédiée ci-dessus)
- Plan détaillé dans [`MONETIZATION_CHECKLIST.md`](MONETIZATION_CHECKLIST.md)
- Draft CGV dans [`CGV_draft.md`](CGV_draft.md)
- Phase 1 (magic link) prête à démarrer au prochain go

### 🟡 Product decisions
- **Duel Arena bilan** — quasi-unused in S1. Decide: keep / simplify / sunset.
- **Multi-campus rollout** — CESI + professional learners. Requires group management UI improvements.

---

## Open questions / context for next session

- **Teacher dashboard language**: currently FR. Should it become EN when multi-campus rollout happens with non-FR teachers? (Not urgent.)
- **Weekly Report automation**: could a Supabase Edge Function generate and email the PDF to director weekly? (Would require server-side PDF gen — big detour.)
- **Legendary chest experience**: current V2 is strong but we could add audio (jingle specific to legendaries) or a brief slow-mo on the impact ring. Feedback-dependent.

---

## Recent notable decisions (2026-04-17)

- Chose **Option C (Boss Loot)** for chest opening animation over Runic Invocation / Tarot Flip
- **SVG wooden chest** replaces emoji 📦 — custom inline SVG with wood/metal/gold details
- **French for director report**, English for student-facing notifications
- **0 XP on flashcards** (removed entirely, not reduced) — radical anti-farming
- **S1→S2 transition rules** — streaks conservés, leaderboard reset partiel (modalités TBD), pas de cleanup BDD (les comptes peu actifs peuvent revenir)

---

## How to resume efficiently

1. Read this `CONTEXT.md` first
2. Check `project_todo_s2_progress.md` in memory for fine-grained backlog state
3. If diving into code, read `CLAUDE.md` for conventions
4. Before any structural change to App.jsx, use Plan Mode

---

_Last updated: 2026-04-22 evening · session "focused-chaum" (icon refactor complete — 60 game-icons, tile design unification, tab bar V5 light/dark, Gauntlet XP rebalance tier B, 2 bugs fixed: TTS silent after Listen + XP toast missing on sp routes). Next: open — chantier cosmétique icônes bouclé._
