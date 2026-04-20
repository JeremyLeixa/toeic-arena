# TOEIC Arena — Current State

> **Living document.** Updated at the end of each working session. Captures the snapshot of where the project stands, what's just been shipped, and what's queued.
> For permanent conventions (architecture, code rules), see `CLAUDE.md`.
> For the full S2 backlog tracker, see `.claude/projects/.../memory/project_todo_s2_progress.md`.

---

## Last session: 2026-04-17 (session "intelligent-blackburn")

Session split en deux temps :
1. **Matin (session "brave-bardeen")** : Major S2 pedagogical cycle — app passée de "MVP fonctionnel" à "expérience polie production-grade" (chest UX V2, weekly report, push campaigns).
2. **Après-midi (session actuelle)** : **Kickoff chantier Monétisation**. Décisions business tranchées, migration Teacher, draft CGV, checklist exhaustive.

---

## 💰 Monetization chantier — ACTIF (démarré 2026-04-17)

**Décisions business verrouillées :**
- **B2C pur** — pas d'architecture institutionnelle (écoles gérées cas par cas manuellement)
- **Tarification (révisée 2026-04-20)** : **9,99€/mois** recurring OU **22,99€ TOEIC Pass 3 mois** one-shot (pas d'annuel). Rationale : le TOEIC est un produit d'intention ponctuelle, pas de consommation continue. Le Pass 3 mois matche la durée réelle d'usage.
- **Pas de période d'essai** — freemium permanent conservé (resserré plus tard en Phase 4)
- **Cutoff IDRAC 2026-06-28** (date réelle, pas juillet) → étudiants peuvent continuer en souscrivant, leur progression reste sur le même compte
- **Statut éditeur** : micro-entreprise, franchise TVA art. 293 B CGI
- **Jérémy (Teacher)** : migré sur `class_code='teacher-internal'` (permanent, end_date=NULL), insulé du cutoff IDRAC

**Artefacts produits cette session :**
- [`CGV_draft.md`](CGV_draft.md) — draft 20 articles, placeholders [À COMPLÉTER] pour SIRET/médiateur, franchise TVA active
- [`MONETIZATION_CHECKLIST.md`](MONETIZATION_CHECKLIST.md) — 13 sections / ~90 items, timeline jusqu'au 28 juin 2026
- Teacher migration SQL exécutée en prod Supabase (9 coffres, 3 push_subs, 3 snapshots migrés, 24195 XP préservés)
- `CLAUDE.md` mis à jour (section Teacher Account)

**Plan d'exécution (7-8 sessions) :**

| Phase | Statut | Owner |
|-------|--------|-------|
| 0a. Teacher class code standalone | ✅ DONE | 🤖 |
| 0b. Stripe setup + CGV + GDPR policy update | 🟡 in_progress (homework Jérémy) | 👤 |
| 1. Magic link auth | ⏳ NEXT — peut démarrer en parallèle du 0b | 🤖 |
| 2. Data model subs | ⏳ | 🤖 |
| 3. Stripe Checkout B2C | ⏳ | 🤖 |
| 4. Gating premium + resserrement freemium | ⏳ | 🤖 |
| 5. Cutoff IDRAC | ⏳ | 🤖 |

**Timeline cibles :**
- 2026-05-15 : Stripe test mode validé
- 2026-06-10 : Stripe LIVE
- 2026-06-28 : Cutoff IDRAC

**Points d'attention prochaine session :**
- Vérifier où en est Jérémy côté business (SIRET, compte pro, Stripe, médiateur)
- Option recommandée : démarrer Phase 1 (magic link auth) en parallèle de sa prep business, c'est indépendant

---

## What's shipped (cumulative, current production)

### Gameplay & Content
- **Endless Arena** ⏳ — unlocked post-Boss ≥650, random full TOEIC, weakness reco on results
- **Word Tavern** 🍺 — 15Q vocab quiz, 3 types (def→word, word→def, fill-in-blank), failed words reset in SRS
- **Flashcards give 0 XP** — memorization tool only, XP earned via Word Tavern
- **SpeedMatch Hard removed** — one mode only
- **Content pools expanded**: P3:50, P4:45, P6:30, P7:39

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
- **English uniformization** — UI, push messages, chests.js. FR kept only where needed (onboarding prefix, privacy, TeacherDash)
- **BGM bleed fix** — `bgm_home` no longer continues into Listening exercises
- **Coach tips removed entirely** — onboarding + Mock nudge cover the role
- **Event pills on Home removed** — redundant with banners
- **Explorer achievement bug fix** — onboarding no longer pollutes `moduleScores`
- **Push subscription fix** — explicit `Notification.requestPermission()`
- **4 new Word Tavern achievements** — Tavern Visitor, Silver Tongue, Wordsmith, Tavern Regular
- **Supabase columns added**: `joined_at`, `tutorial_pending`, `inactivity_push_sent`

---

## What's next (not started)

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

_Last updated: 2026-04-17 · session "intelligent-blackburn" (monetization kickoff)_
