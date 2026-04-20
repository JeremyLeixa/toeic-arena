# TOEIC Arena — Current State

> **Living document.** Updated at the end of each working session. Captures the snapshot of where the project stands, what's just been shipped, and what's queued.
> For permanent conventions (architecture, code rules), see `CLAUDE.md`.
> For the full S2 backlog tracker, see `.claude/projects/.../memory/project_todo_s2_progress.md`.

---

## Last session: 2026-04-20 (session "intelligent-blackburn" — monetization build-out marathon)

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

_Last updated: 2026-04-20 soir · session "intelligent-blackburn" (Phases 1-4 monétisation livrées, debug Phase 4 visitor à reprendre)_
