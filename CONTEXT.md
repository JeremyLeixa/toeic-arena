# TOEIC Arena — Current State

> **Living document.** Updated at the end of each working session. Captures the snapshot of where the project stands, what's just been shipped, and what's queued.
> For permanent conventions (architecture, code rules), see `CLAUDE.md`.
> For the full S2 backlog tracker, see `.claude/projects/.../memory/project_todo_s2_progress.md`.

---

## État au 2026-09-24 (à lire en premier)

Entre le 15 et le 23 septembre, ~300 commits. Les conventions de chaque chantier vivent dans `CLAUDE.md` et, depuis le 24/09, dans
les `CLAUDE.md` de sous-dossier listés par son « Index des fonctionnalités » ; ici, seulement ce qui est livré, ce qui reste à voir en prod, et ce qui attend
une décision.

### Livré en prod (15 → 23/09)
- **Découpage d'App.jsx** (15-16/09) : 18 589 → ~1 500 lignes, `lib/` pur testé, écrans lazy (−65 % de bundle).
- **Verrou Supabase** (15-16/09) : plus aucun privilège de table côté client, tout en RPC ; audit identité F1-F6.
- **Mode clair** (16/09) et **thèmes saisonniers** (16/09) ; **coffre v3 « Crack & Cards »** (16/09).
- **Écran de fin commun « Verdict d'Aldric »** (17/09) sur tous les modules à score ; **hubs vivants** (17/09).
- **Mentor qui se souvient** (17-18/09) : bestiaire, chasse aux erreurs, plan du jour figé, lettre du lundi, Chronique.
- **Options permutées partout** (18/09) : grammaire, Mock, Boss figé (`BOSS_LAYOUT_V` 3), 9 modules.
- **Mimic Hunt** (17-19/09) : 84 items dont 45 parlés, mode écoute, morsures, trophées.
- **Échelons de maîtrise** (19/09, `9c28837`) ; **HUD de session** sur ~25 modules (17-20/09, clos `32688e8`).
- **23/09** : CI GitHub Actions (`8f38a21`) ; onglet **Usage** du TeacherDash + RPC `teacher_usage` en prod (`8d1fac0`) ;
  **Home « une porte »** (`64aa490`) ; contenu **Part 7** +8 passages (`4c7c1a5`) et **P3/P4** +16 items audio (`b6cb5fa`),
  types de questions TOEIC comblés (insertion, vocabulaire en contexte, intention).
- **24/09 : économie côté serveur** (lots 1-3, `5c842e7` → `98c9a60`) : catalogues générés depuis `chestCatalog.js`,
  achat `buy_item`, coffres tirés et crédités par `open_chest`, types et délais imposés par `grant_pending_chest`,
  conversions serveur, `grant_marks` limité aux sources du jeu, garde-fou XP +20 000/jour dans `save_student`
  (journal nommé dans l'onglet Usage). Anciennes RPC supprimées, `check:security` vert.
- **24/09 : instantanés hebdomadaires** (`a35de59`) : `xp_this_week` partait à 0 sous l'étiquette de la semaine
  suivante depuis toujours ; podium à 0 XP exclu. Premier lundi juste : **28/09**. Anciens instantanés réétiquetés le 24/09
  depuis `weekly_history` (366 semaines retrouvent leur XP, 17 doublons supprimés, 33 laissés à 0 faute de preuve ;
  `daily_completions` perdu), `week_start` = lundi local partout (c'était le dimanche 8 jours avant). Sauvegarde :
  `weekly_snapshots_backup_2026_09_24` (verrouillée), à supprimer quand le rapport formateur aura été relu.

### À voir en prod (pas encore observé sur de vrais élèves)
- Vague de coffres **Mastery II** à partir du **26/09** (échelons I datés du 19/09 + 7 jours) : garde anti-boucle.
- Première cérémonie **« faiblesse devenue force »** possible vers le **27/09**.
- Home « une porte », Part 7 et P3/P4 neufs, mode écoute de Mimic Hunt, sessions en mode clair.
- **Onglet Usage** : abandons et taux de mission n'ont de sens qu'une à deux semaines après le 23/09 → relire
  **début octobre** avant de ranger ou retirer un module (premier aperçu iabd2627 : 45 créatures créées, 0 vaincue).

### En attente d'une décision de Jérémy
- ~~A.4 ancrage Boss~~ : **retiré le 24/09** (décision de Jérémy).
- ~~Cérémonies qui s'enchaînent~~ : **faites le 24/09** (variante B, `lib/interruptions.js`, `check_interruptions`) : une
  seule cérémonie par écran de fin (retournement > promotion), au plus un plein écran non demandé par entrée sur Home.
- ~~Économie côté serveur~~ : **faite le 24/09** (voir « Livré »). Garde-fou XP en deux seuils (`eb2e181`) : journée
  notée à +20 000, plafonnée à +40 000 (des semaines réelles montent à 44 365). **cyril** (iabd2627) ramené de 102 900 à
  2 901 XP le 24/09 (XP écrite à la main le 11/09 ; last_active posé au 24/09 pour que sa copie locale perde au
  prochain chargement ; ancien last_active 14/09, streak 3). Ses coffres et Darics gagnés sur cette XP restent.
  DanielC, Noé, Kamel : XP par question 8 à 60 fois la médiane, mais sur des mois d'activité réelle et la semaine de
  lancement W12 : pas de preuve de triche, rien touché. Cron `weekly-teacher-report` (clé factice) retiré le 24/09.
- ~~Rotation de `PUSH_SECRET`~~ : faite le 24/09 (Vercel + secrets Supabase, `VITE_PUSH_SECRET` retiré des `.env`) ;
  l'ancienne valeur (encore dans l'historique git) est refusée par `/api/push-send` (401 vérifié), envoi réel testé
  via `streak-reminder`.
- **Phase C sécurité** (lot 1 LIVRÉ le 24/09, `e88c26e`) : règle unique `_owner_ok`, mode strict par promo
  (`identity_strict_classes`, vide), essai de bout en bout validé sur une promo de test (sécurisation depuis l'appli,
  copie locale gardée), suivi « Comptes sécurisés » dans l'onglet Usage. 5 comptes sécurisés sur 163. **Bascule programmée le 15/10 à 4 h** (tâche pg_cron
  `phase-c-bascule-2026-10-15`, qui se retire seule) pour TOUTES les promos (ligne `*` : iabd2627 et mpqse2527 annoncées en cours,
  plus les dormantes, choix de Jérémy) ; visiteurs toujours tolérés. Annuler avant :
  `SELECT cron.unschedule('phase-c-bascule-2026-10-15')`.
- ~~`CLAUDE.md` à alléger~~ : découpé le 24/09 (racine + 13 `CLAUDE.md` de sous-dossier).
- ~~Restes d'audit~~ traités le 24/09 : Mock 3 dans l'estimateur, coffre du Boss, trophées Mock 3, RGPD (feedback
  purgé, refus plus jamais silencieux), CSV Mock 3 + Boss, flags de `MODULE_TOEIC_MAP`, bornes de la monnaie ; alerte
  Disk IO close (compteur figé à 231 Go depuis le 16/09). `/api/feedback-send` exige une session depuis le 24/09
  (`5f8ba77`) ; classement de la Ligue : pas un vrai problème (monté seulement sur son onglet). Reste : `daily` absent de `MODULE_TOEIC_MAP` (décision : l'ajouter
  ferait entrer le Daily dans la maîtrise Part 5 du Mentor).

---

## Earlier session: 2026-07-07 (MULTI-CAMPUS — teacher scoping + cross-campus admin view)

**Mise en place de la stratégie multi-campus** (argument de déploiement en école). Avant, un seul `teacher_code` (`arena-teacher-2026`) donnait accès à TOUS les groupes : `loadGroups()` chargeait tout sans filtre. Objectif : 1 campus = 1 formateur voyant SES cohortes.

### Soft scoping V1 (commit `30ff411`, validé live)
- Cloisonnement **côté UI** par `teacher_code` (colonne déjà par-groupe dans `groups`). Helpers module-level `ADMIN_TEACHER_CODE` (env `VITE_ADMIN_TEACHER_CODE`, fallback `arena-teacher-2026`), `getDashTeacher()`, `isDashAdmin()`. **Code vide = admin** (backward-compat + biométrie sur l'appareil de Jérémy).
- `localStorage['toeic-dash-teacher']` stocké aux 2 entrées login. `loadGroups()` filtre `.eq('teacher_code',code)` sauf admin. Garde-fou : snap du groupe sélectionné dans le set scopé. Formulaire création : `teacher_code` prérempli + verrouillé (non-admin), stamp forcé au save.
- ⚠️ **Garde CLIENT only** (RLS off sur students) — OK formateurs de bonne foi. Isolation « hard » (Auth + RLS) = deferred, à déclencher si un établissement l'exige.

### Vue Cross-Campus super-admin (commit `a62961f`, validé live)
- Bouton admin-only « 🏫 Vue tous campus » sur le picker → `dashPhase==="campus"`. Une ligne/campus (nb élèves, actifs 7j %, TOEIC médian, accuracy) + bandeau récap global. Triable (TOEIC médian/actifs/taille), clic → plonge dans le campus. Un seul read agrégé (`.in('class_code',codes)`), zéro schéma. Réutilise `estimateTOEICScore` + `isGhost`.
- Fix bug d'interaction : reset `teacher_code:""` du bouton « Créer un groupe » bloquait la création pour non-admin → préremplit `getDashTeacher()`.

### Chantier EN PAUSE (demande Jérémy). Restes possibles
- **#2 onboarding formateur** : script `scripts/create-groups.cjs` (batch de groupes réutilisant `generateSeasons`) — proposé, pas écrit.
- **Version hard Auth+RLS** — en réserve.
- Détail : mémoire `project_multicampus_teacher_scoping.md`.

---

## Earlier session: 2026-05-29 → 2026-06-02 (ARENA SHOP — full build P1→P4, ~14 commits)

**Nouveau gros chantier S2 : la boutique Daric.** Une étudiante a proposé un shop pour dépenser doublons + une monnaie ; on a conçu puis livré de bout en bout. Idée centrale : **sanctuariser l'XP** (métrique de classement) et introduire une **monnaie dérivée**, le **Daric** (D), gagnée via progression (coffres, mastery, podium, Mentor focus, achievements, daily, login). Tout est en prod, Vercel deployed. Détail complet : mémoire `project_shop_design.md`.

### P1 — Infra monnaie (commit `ca21df6`, validé prod `2026-06-01`)
- `students.arena_marks` **server-authoritative** : muté UNIQUEMENT par RPC `grant_marks(user,class,delta,source,detail,unique)` (increment atomique + log `marks_log`). **Exclu du payload `save()`** (commentaire de garde) → pas de lost-update. Mirror read-only dans `supaToLocal`.
- Wrapper client `grantMarks()` idempotent (skip toast si RPC renvoie 0). Drop Daric **garanti** dans chaque coffre (30/90/250/700, slot séparé). 7 sources de progression câblées. Pastille `DaricPill` + `MarksToast` + SVG sceau perse. Idempotence validée (stable au reload — neutralise la classe de bug +37k XP).

### P2a — Boutique + achat (commit `ea321fc`)
- SQL `2026-06-01_shop_p2.sql` : table `shop_purchases` + RPC **`spend_marks`** (transaction atomique : check solde + ownership/cap, décrément, grant player_rewards OU grant_token, log). Renvoie jsonb {ok,balance,error}.
- `SHOP_CATALOG` **hardcodé** dans chests.js (pas de table). Composant `Shop` (sous-page `sp==="shop"`), flow d'achat avec **confirm anti-achat-accidentel** (pas de refund-30s), sous-vue Conversions réutilisant `ConversionsView`. Sections **collapsables** (commit `2f7c5f5`).

### P2cos — Cosmétiques inspirés (commits `c065031`, `c8ea9f0`, `10abbfc`, `1d8531a`, `4ca0bc7`)
- **Workflow proto-first** : protos `prototypes/shop-cosmetics/` (index.html frames + skins-global.html). Je screenshote le proto (py http.server via preview MCP) ; **l'app live hang l'outil de screenshot** → Jérémy valide en prod.
- **7 skins GLOBAUX** (thèmes d'appli comme aurore/obsidienne, pas habillage d'avatar — modèle `.skin-<id>` qui override les vars CSS + anime `.crd/.btn1/.bar-fill/.tab-bar`) : Frostbite, Abyssal, Emberheart, Cosmic Void, Molten Gold, Heraldic, **Aldric's Chamber** (flagship B&W+or). Tous `exclusive:true`.
- **6 frames** = overlay CSS circulaire (`.aframe-<id>`) autour du blason via extension `AvatarMedal` (les frames proto étaient circulaires, l'avatar app est un blason) : Arc Pulse, Orbit, Inferno Ring, Tempest, Gilded Halo, Prismatic.
- Passe **polish particules** (neige Frostbite, braises Emberheart, motes Aldric/Molten, Abyssal adouci, Inferno/Tempest/Prismatic en halos fondus). Titres renommés EN. Icônes XP-boost rendues théma-cohérentes (⚗️🔱⏳, fini la fusée).

### P2b — Refonte Profil (commit `a176524`, net -113 lignes)
- **Fusion Style+Collection** en un onglet `view==="style"` (équip + badges doublons + consommables + cheat sheets + lien Convert→Shop + thème). Tuiles : Stats / Achievements / Style / **Shop**. Conversions vivent désormais DANS le Shop. Méthode : transformer la vue inventory en place (garder la machinerie tokens), swapper catalogue→équip, supprimer les vues avatar+conversions.

### P2.5 — XP Boosts + Bottomless Purse (commit `b0dd9df`)
- SQL `2026-06-02_xp_boosts.sql` : colonne `students.boosts` jsonb (**client-authoritative**, dans save()).
- 3 boosts = **tokens** (section "XP Boosts" via `group:"boost"`) : Module Booster 120D (+50% module au choix), Mock Multiplier 220D (×1.5 mock **ET Boss** — extension `daec0bf`), Daily Doubler 400D (×2 tout 24h, cap 2/sem). Armés depuis Consommables (3 flux `useTokenAsk`).
- **Décision** : boosts scalent l'XP PARTOUT (xp + weeklyXp/Ligue + XP Overall) ; la métrique PRIMAIRE TOEIC Progression (accuracy) est **immunisée**. Hooks : applyXpGates (module+mock) consommés dans recordModule/mockDone/bossDone, addXp (daily doubler 24h).
- **Bottomless Purse** : titre Légendaire auto-granté à 10 000 Darics dépensés cumulés (`boosts.spent`).

### P4 — Ambiance Shop (commit `5935c03`)
- **Chronique d'Aldric** à la 1re visite du Shop : narrator.js `shop_intro` (Side Chronicle, "The Merchant's Counter"). Voix-off EN Old Wizard + sous-titres FR parchemin, jouée **une fois** (gaté `narrator.heard`). Timings recalés sur le MP3 réel (ffmpeg silencedetect). `bgm_shop` câblée (SELF_MANAGED + duck sous la chronique).
- **Assets** : Jérémy génère (ElevenLabs voix, Mureka BGM, image). Image : Leonardo refusait le N&B → **converti via Pillow** (gris neutre carré 1536², matche les 9 chroniques existantes). ffprobe + ffmpeg + Pillow dispos sur la machine de Jérémy.

### État final
- Shop **complet end-to-end** (P1→P4). 14 commits sur main, en sync, Vercel deployed.
- **Restes** : avatars Anaïs (attente designs graphiques — ajout trivial via SHOP_CATALOG) · Mock Multiplier→Boss FAIT · refacto App.jsx **FAIT le 2026-09-15** (ci-dessous).

## Découpage d'App.jsx — 2026-09-15 (voir `REFACTOR_PLAN.md`)

- Le monolithe de 18 589 lignes est devenu `App.jsx` (1 493 lignes, `App()` seul) +
  `routes.jsx` + `src/lib/` (20 modules purs) + `src/components/` (12 widgets) +
  `src/features/` (16 dossiers d'écrans) + `src/styles/appCss.js`. Phases 1 à 3 mergées
  sur `main` (`da011e1`, `2bdc963`), Phase 4a (routes + commentaires) sur
  `refactor/split-app`, à merger après un smoke de navigation.
- 44 lots, tous prouvés « déplacement pur » par `scripts/refactor/review.cjs` ; 4 retouches
  manuelles connues (accesseurs audio et persistance, contexte des routes, commentaires).
  Tests 9/9 en import natif, lint inchangé, bundle identique, **aucun impact étudiant**.
- Règles nouvelles dans `CLAUDE.md` (Architecture) : sens des couches, `App()` seul
  détenteur d'état, un `.jsx` n'exporte que des composants, jamais assigner un import.
- Hors refactor, repéré pendant le smoke et **corrigé le soir même** : régression `groups`
  de la migration d'hygiène (`2026-09-15_p2d3`, appliqué) ; piège du claim de mot de passe
  (`2026-09-15_p2d4`, appliqué, + client : marquage à la connexion, refus d'entrer si la
  liaison échoue — diagnostic : 158 legacy libres, 0 lié sans date, 4 sécurisés sains) ;
  toggle œil sur les 11 champs mot de passe (`components/PasswordInput.jsx`) ; fiche de
  cours en place dans la revue de l'Exam Simulation (retour de Noah, iabd2627).
- Tout est mergé sur `main`, branche `refactor/split-app` supprimée. `npm run
  check:security` dérive désormais ses chemins légitimes du source.

## Session 2026-09-16 — `groups` par RPC (P2-D5), fin de l'exception « grant colonne + policy »

- Les 5 lectures directes de `groups` (fenêtre d'accès au chargement du profil, saisons de
  la League, « Join a Group », picker d'homonymes, « ce code existe déjà » du dashboard)
  passent par `group_public(p_code)` : une ligne par code exact, 7 colonnes figées (code,
  name, type, start_date, end_date, seasons, grade_bonus_enabled), jamais
  `teacher_code` / `teacher_email`. Le picker d'homonymes ne liste plus toutes les promos
  pour en nommer une. Chaque site logue `res.error` (zéro catch muet).
- Deux migrations : `2026-09-16_p2d5_group_public_rpc.sql` (additif) puis
  `2026-09-16_p2d5_lock_groups_full.sql` (REVOKE des 7 privilèges + DROP de la policy).
  **Ordre** : SQL 1 → déploiement client → `check:security` + login + Join a Group → SQL 2.
- `check:security` exige désormais un 401 sur `groups?select=code` (table fermée jusqu'à
  la dernière colonne) et sonde `group_public` (READ_ONLY). CLAUDE.md : deux objets
  lisibles en direct (`students_public`, `events`), plus d'exception `groups`.
- `BUILD_ID` = `2026-09-16-groups-rpc`.
- **Livré et vérifié le 2026-09-16** : SQL 1 appliqué → push (`45658fb` SQL, `503fd70`
  client) → « Join a Group » en prod (code valide et code inconnu) + login + League avec
  saisons résolues par la RPC → SQL 2 appliqué → `check:security` au vert (19 tables
  verrouillées, `groups` refuse chaque colonne, 39 RPC vivantes). Il reste exactement une
  policy dans le schéma : « Events visible ».

## Session 2026-09-16 (suite) — Phase 5 du découpage : code mort, `lib/xp.js`, lazy chunks

Branche `refactor/phase5`, 15 commits, plan `.claude/plans/moonlit-roaming-sketch.md`.
- **A — code mort** (`cbe5857`) : 6 symboles + `COMPETITORS` supprimés ; bundle identique à
  l'octet (le tree-shaking les éliminait déjà). Lint 375 → 368, référence refigée.
- **B — `lib/xp.js`** (`8f695c9`, `ea79bd8`, `df79fe6`) : les portes XP en fonctions pures
  (`gateXp`, `settleXp`…), `tests/check_xp_gates.cjs` (79 vérifications, prouvé mordant ×5),
  App.jsx n'orchestre que les effets. **Équivalence prouvée** par
  `scripts/refactor/xp_equivalence.cjs` : 2 000 profils seedés, 2 000 identiques, 8 813 effets
  dans le même ordre. MockTest affiche la courbe via `farmMult`. `isModuleBoosted` → `removed`.
- **C — lazy** (`9f66bc6` → `f99bfa0`) : filets d'abord (`check_import_graph` voit les
  `import()` : chemin, nom exporté, non-joignabilité statique ; `vite:preloadError` → reload
  une fois ; `LoadingMark`/`LoadBoundary` ; `lazyNamed`), puis TeacherDash + Onboard, exams,
  Listening + Reading, jeux + Gauntlet + Modal Council, graphique Profil (recharts sort), et
  préchauffage à l'idle (décision Jérémy : parité hors-ligne). **Principal 3 278 477 →
  1 147 880 o (−65 %)**, 32 chunks, 3 293 131 o au total (+0,4 % de colle). Littéraux de chaîne
  : rien de perdu (1 fragment de template renommé, 36 `import{}from`).
- Restent eager : Home, onglets, NarratorOverlay, Chests, grammar.jsx (vocab/grammar/
  avatarIcons/miniGames/chests.js sont le plancher du principal).
- Hors Phase 5, à décider : Profile.jsx:696 → `farmMult(m.id,cnt)` corrigerait la ligne
  Flashcards du sélecteur Bypass (60/30 % au lieu de 50/15 %) — visible.
- Abandonnés (décision 2026-09-16) : avatars Anaïs (« sauf cas exceptionnel »), backlog S2.

- **Mergé sur `main` le 2026-09-16** : A+B (`d7dcddb`) puis C (`f019187`) après smoke de
  Jérémy sur `vite preview` ; en prod, principal 1 147 883 o, 31 chunks référencés.

## Session 2026-09-16 (fin) — Listening P1/P2 : lettres à part, clips regénérés sans lettre

- **Bug** (signalé par Jérémy sur Train → Part 2) : les clips d'options P1/P2 avaient la
  lettre cuite dedans (« B. It's on Thursday… », tous les scripts P2, le script d'origine
  P1) ; la permutation des options du 15/09 jouait donc les clips dans l'ordre affiché et
  l'élève entendait « B. » en première position. Dans l'Endless (P1/P2 en aveugle, items
  d'entraînement mélangés aux items du Boss), cliquer la lettre entendue était compté faux.
  Le Boss était sain (clips sans lettre). Biais réel des pools : P2 A 76 / B 100 / C 54.
- **Décision Jérémy** : regénérer plutôt que corriger (300 000 crédits ElevenLabs). Clips
  d'options P1 (232) et P2 (920, question comprise : deux locuteurs différents, comme au
  TOEIC, ce que les lots précédents ne faisaient pas) **sans lettre** ; 24 clips de lettres
  (6 voix × A-D) joués à part, dans la voix de l'item, à la position affichée
  (`playLetteredOption`, `lib/audio.js`). La permutation `aud` est conservée et devient juste ;
  le Boss gagne l'annonce des lettres qu'il n'avait jamais eue en aveugle.
- Règle de voix unique app + script : `lib/listeningVoices.js` (numéro d'item → voix ; Voice A
  = non-US masculine, Voice B = non-US féminine, confirmé à l'écoute). Script
  `scripts/regen-listening-letterless.mjs` (reprenable). Lettres en `eleven_turbo_v2`
  (anglais seul : le multilingue lisait « A » à la française), stabilité 0,75 (souffles sur
  Voice B à 0,5). Échantillon validé à l'oreille par Jérémy avant le lot complet.
- `check:assets` vérifie les 24 lettres ; `check_listening_voices` (test) garde la règle Q≠R
  et la forme des URL de lettres. `BUILD_ID` = `2026-09-16-letters`.

### Pour la prochaine session
- Vérifier en prod, après déploiement : Train → Part 2 (lettres dans l'ordre, texte affiché
  = réponse entendue à la même lettre), Part 1, un Boss P2 (lettres annoncées), un Endless.
- Hors périmètre, à décider : Profile.jsx:696 → `farmMult(m.id,cnt)` (ligne Flashcards du
  sélecteur Bypass, visible).

---

## Session 2026-09-16 (soir) — Thèmes saisonniers (festivals), lots 0 à 3 en prod

- **Idée Jérémy, proto validé le matin** (`prototypes/festival-themes/`) : Halloween, Noël,
  Pâques, été prennent le pas sur le skin équipé pendant une fenêtre, sans le modifier.
  Objectif : Halloween (24/10) en prod avec de la marge.
- **Lot 0** `01d1f61` : proto commité. **Lot 1** `51a996f` : `lib/festivals.js` (pur :
  fenêtres locales, Meeus, wrap déc → jan, opt-out, forçage `?fest=`), `tests/check_festivals.cjs`,
  `fest-<id>` remplace `skin-<id>` dans la ligne `lc`, tick horaire. **Lot 2** `bbaa389` :
  `festivals.css` collé tel quel dans `appCss.js` + garde CSS du test. **Lot 3** `1a38195` :
  message d'accueil + bandeau Home (Turn off), bandeau + toggle Profil → Style, `theme-color`.
- Décisions de session : l'opt-out gagne toujours (forçage compris) ; `?fest=none` retire la
  fête ; `theme-color` hors fête = `#0f0c08` sombre / `#f5f0e8` clair (avant : toujours sombre).
- Vérifié en dev sur le compte Teacher : 4 fêtes en sombre et en clair (Home, Train, Profil,
  Style, Drill, modale Daily Tip), Turn off + toggle, skin Aurora équipé masqué puis rendu,
  `theme-color` sur les 3 meta. Compte remis dans son état (sombre, sans skin, fêtes actives).
  Tests prouvés mordants (9 cassures). `BUILD_ID` = `2026-09-16-festivals`.
- **Bugs antérieurs repérés en passant** : skin Aurora en mode clair = toutes les `.crd`
  illisibles (**corrigé**, session suivante : « cartes-nuit ») ; titre équipé et pastille de
  ligue délavés en clair (couleurs codées en dur, **corrigé** : `tone()`, voir plus bas). Escapes unicode affichés en
  littéral (texte ou attribut JSX) : 5 cas corrigés, `de9b46a` (Game Master, Profil → Style),
  `dd9fe16` (bandeau Accès expiré, lien CGV), puis infobulle du grimoire et « Final score
  10–990 ». Règle et vérification sur le bundle dans CLAUDE.md → « JSX encoding rule ».

### Pour la prochaine session
- Lot 4 à décider : BGM `bgm_home_<fest>` (helper `homeTrack()`), coffre `fest_<id>_<année>`,
  titre/frame exclusif filtré dans `pickRewards`, mention dans la fiche Shop.
- Le 24/10 : vérifier en prod que Halloween s'applique seul, sans `?fest=`.

---

## Session 2026-09-16 (nuit) — Skins à cartes sombres lisibles en mode clair (« cartes-nuit »)

- **Deux bugs, une cause** : l'ordre des règles de tokens dans `appCss.js`. 9 skins forcent un
  fond sombre sur `.crd`. Aurora et Obsidian, déclarés **avant** `.light` : page claire, cartes
  sombres, texte sombre (1,05:1). Les 7 skins du Shop, déclarés **après** : appli entière sombre
  en clair, avec l'accent retinté foncé (2,3:1), vert/rouge/or, `--t3` et `--bg*-rgb` du clair
  (barre d'onglets à moitié pâle). Le commentaire « bg stays light via .light » était faux.
- **Décision Jérémy** (comparatif dans le proto des fêtes) : cartes-nuit sur les 9, plutôt que
  cartes pâles façon fêtes. Page claire, palette sombre du skin **dans** ses cartes, aucune
  couleur nouvelle. `bcb4494` Aurora/Obsidian, `b766325` Shop (+ fond opaque sous les cartes
  translucides abyssal/molten_gold/heraldic), `f5b589b` test `check_skins_light` (rouge sur la
  feuille d'avant : 41 problèmes, et sur 5 mutations).
- **Vérifié** : ancienne vs nouvelle feuille sur 17 skins × 2 modes (8 976 valeurs calculées),
  0 écart en sombre, 0 écart en clair hors des 9. En dev sur le compte Teacher (mode clair +
  Aurora par l'UI, 8 autres par classe) : Home, Profil, Profil → Style ; textes de carte en clair
  = en sombre (Molten Gold, Heraldic < 5 % d'écart, fond `--bg2`), rien de pire que sans skin.
  Compte remis sombre, sans skin, relu après rechargement.
- **Reste, préexistant, non traité** : couleurs codées en dur délavées en clair hors skin
  (« Convert duplicates », `+10 Login bonus`, « 990 » `#c9a23a` du Profil, « Premium » et
  quantités premium des Consommables ; les noms de rareté sont corrigés, voir plus bas) ; les skins du Shop n'ont pas de `--cx-hex`
  propre (Doré partout où il sert, en sombre comme dans les cartes-nuit) ; `theme-color` ignore
  le skin.

### Suite : titre équipé et pastille de ligue lisibles en clair (`tone`)
- Les hex de `data/leagues.js` et `TITLES` sont pensés pour le sombre : en clair, Aldric's Chosen
  à 1,28:1, pastille Gold à 1,07:1 (Home, Profil). `lib/tone.js` : `tone(hex)` →
  `var(--tone-<hex>,<hex>)`. En sombre rien ne change ; en clair, 13 variantes de même teinte
  (≥ 4,6:1 sur `--bg/--bg2/--bg3`, jaunes ramenés vers 43° pour éviter l'olive) dans
  `.light{--tone-…}`, remises à `initial` dans les cartes-nuit. `545f2e0` (titre Home/Profil/
  Ligue/Style, pastille et icône de ligue, en-tête Ligue, ✦ des doublons du Shop ; carte de coffre
  et vignette du Shop gardent le hex, fond sombre fixe), `a7a84ac` test `check_tones` (4 mutations).
- **Vérifié en dev** (compte Teacher, classes basculées, compte relu après rechargement : sombre,
  sans skin) : en sombre hex d'origine inchangés ; en clair titre 5,45:1, pastille Gold 4,65-4,73:1
  (icône 4,7), liste des titres de Style 4,8-6:1 ; en clair + Aurora la pastille dans la carte-nuit
  reprend `#ffd700` (11,7:1) ; fête Halloween en clair 4,7-5,4:1. **Pas vu** : lignes de la Ligue
  (Teacher en mode observateur, aucun joueur affiché), même appel `tone()`.
- Piège : le basculement Mode par l'UI dans le panneau navigateur masqué est écrasé par le
  rechargement Supabase à chaque retour « visible » (`App.jsx` `onVis`) ; mesurer par classe.
- **Noms de rareté** (`9a49ea7`) : Profil → Style (noms d'avatar/skin/cadre, « Tap to read » des
  cheat sheets, bordures de rareté des vignettes et des cheat sheets) et bordure de rareté des
  vignettes de skin du Shop passent par `tone()`. Deux variantes en plus : Common `#909090` →
  `#626262`, Uncommon `#3ecc78` → `#1e703f`. Avant, en clair : Legendary 1,25:1, Uncommon 1,58:1,
  Common 2,44:1. Mesuré en dev sur les 89 éléments de Style : texte 4,73-5,98:1, bordures
  5,4-6:1 (clair, clair + Aurora, clair + Halloween) ; sombre inchangé. `check_tones` couvre
  `RARITIES`, `rarity.color`, `shopRarColor()` (3 mutations). **Pas vu** : la vignette du Shop
  (même appel). Coffres (`Chests.jsx`, variable `rarityColor`) : fonds sombres fixes, inchangés.

### Balayage du mode clair + lots A et B (même jour)
- **Balayage** : 49 écrans mesurés en dev (contraste sombre vs clair par élément, fonds composés,
  opacité ; compte Teacher, aucune écriture) + inventaire statique. Faux positifs écartés : glyphes
  des médailles d'avatar (bouclier `#0a0608`). Onboarding hors périmètre (toujours sombre).
- **Lot A** (palettes choisies par Jérémy, variantes B) : `c130645` jeton `--on-cx` (texte des
  `.btn1` en clair : 1,6-3,8:1 → 6-12:1 ; médaille de niveau 2,66 → 4,41 sombre / 6,94 clair) ;
  `0f5ec95` `--gold` clair `#a67c00` → `#7c5d0e` (83 usages, noms de succès…) ; `02cf262` accent
  Doré clair `#8b6914` → `#6f5410` (+ `--cx`, `--cx-hex`, `--cx-dark` `#55400c`).
- **Lot B** : `6061292` couleurs en dur via `tone()` (34 variantes, 109 littéraux + 6 rendus de
  données ; textes clairs sur fonds sombres en dur marqués `/*fond local*/`) et `check_tones` étendu
  à toute couleur hex du JSX (5 mutations) ; `67b5048` jetons figés dans les tuiles Boss/Endless (la
  tuile Boss affichait « Best TOEIC » à 2,93:1 après le lot A).
- **Vérifié en dev après coup** : Home, Shop, Strategy Cards, fiche Tenses, Grammar & Vocab →
  Modal Council à 0 défaut propre au clair ; Profil, Train, What is the TOEIC? : seuls restent des
  jetons limites. **Pas vu en live** (sessions et résultats : Gauntlet en jeu, résultats Endless,
  session Flashcards, Duel) : couverts par la garde statique seulement.
- **Jetons limites** : `a271495` `--orange` clair `#a05a10` → `#834a0d`, `--green` clair `#15803d` →
  `#106430` (≥ 4,6:1 même sur encart teinté de leur couleur ; « Lv. 79 » 4,05 → 5,44, « Listening »
  4,24 → 6,14). `34d930b` toasts de succès et de coffre : cartes sombres en dur dont les textes
  suivaient les jetons clairs (illisibles en clair, invisibles au balayage car éphémères), figés
  sur les valeurs du sombre.
- **Gris en dur** : `3135826` `#8a7e6a` (le `--t2` du sombre écrit en dur, 3,0-3,9:1 en clair) via
  `tone()`, variante = `--t2` clair `#5a5040` (6,0-7,7:1) ; Train (« ULTIMATE TRIALS », Mock Exams,
  lignes Final Arena/Endless) et résultats Endless sur `var(--bg2)`. Blocs sombres en dur (tuile
  Endless, carte de score Endless, aide Cards, popup Duel) marqués `/*fond local*/`.
- **Garde AA** : `2de1f3f` `check_tones` refuse toute couleur en dur sous **4,5:1** en clair (au lieu
  de 3:1), fond de même ligne compris. 12 cas corrigés : scores et marqueur du Gauntlet
  (`#c026d3` → variante `#a421b5`, `#7c3aed`), Obligation/Possibility du Modal Council, icône Reading
  des Strategy Cards (`#c4587a` → `#a83b5e`) ; parchemin du narrateur marqué `/*fond local*/`.
  5 mutations qui passaient à 3:1.
- **Reste, non traité** : onglets inactifs grisés (3,8). Parchemin du narrateur : `#8a6530` y tient
  2,8-3,6:1 dans **les deux** modes (fond fixe), choix de palette. Grisés voulus dans les deux modes
  (succès verrouillés, Owned, mocks faits) laissés tels quels.

---

## Session 2026-09-16 (nuit, suite) — Lint, catch muets, audit identité, F1 + F2 (session perdue)

- **Lint** : override ESLint Node pour `api/` et service worker pour `public/sw.js` (`aa7a717`,
  −40 `no-undef` fictifs) ; catch muets loggés (`5f4c5d6` auth, `7f9fcfc` saveLocal, `988d58f`
  onUnload) ; hook du timer de `Daily.jsx` avant le `return` anticipé (`635d2ba`). `src/` 368 → 359.
  `pollEmailConfirmation` (auth.js) n'a plus d'appelant depuis le 2026-04-27 : code mort.
- **Audit identité (lecture seule)** après un `[SAVE] refused: not_owner` en boucle sur l'onglet
  Teacher. Le piège : session anonyme sur un compte sécurisé → `load()` rendait la copie locale,
  `save()` échouait en console seulement. Portes d'entrée : session perdue (`signOut()` global
  par défaut, rafraîchissement refusé → `ensureAuthSession` crée une session anonyme) ; lien
  « Continuer sans pour l'instant » de l'écran mot de passe (`recover()` sans connexion) ; picker
  d'homonymes. **Fuite en lecture** : `recover_student_row` rend la ligne complète d'un compte
  sécurisé sur prénom + code (C4 fermé en écriture, pas en lecture).
- **Livré** : `dc8c979` garde stale-remote extraite (`lib/staleRemote.js` + `check_fresher_local`) ;
  `12fc02e` la reconnexion garde la progression locale plus fraîche (`fresherLocalFor`) ; `75dc790`
  F1 (refus au chargement → écran mot de passe + bandeau FR, BUILD_ID `2026-09-16-reauth`) ;
  `166d932` F2 (refus de sauvegarde → bandeau EN « Session expired » + « Log in again »).
- **Vérifié en dev** : l'onglet est retombé seul dans le piège → F1 a affiché l'écran mot de passe ;
  puis session de l'onglet fermée (portée locale) en pleine utilisation → `[AUTH] recovered via
  new anon session` → `[SAVE] refused` → bandeau ; Daily joué (+154 XP locales) → Log in again →
  `[recover] local is fresher` → `[SAVE] OK` → rechargement `[LOAD] got remote — xp: 102837`.
- **Hypothèse non prouvée** sur la perte spontanée de session : verrous d'auth « volés » (deux
  onglets, et l'effet de sync d'email en deps `[u]` qui rappelle `getSession()` à chaque `sv()`)
  → deux rafraîchissements parallèles → jeton invalidé. À confirmer par des logs d'événements d'auth.
  Nouvel indice pendant F3 : trois « Lock … not released within 5000ms … Forcefully acquiring »
  lors d'une simple connexion par mot de passe.
- **F3 livré** : `3e2c37e` `recover()` lit par `load_student` (gardée) ; `4671b91` onboarding sans
  entrée sans mot de passe (« Continuer sans » → « demande à ton formateur », `claimLater`,
  sélecteur d'homonymes et écran mort « Recover My Account » retirés, −157 lignes, BUILD_ID
  `2026-09-16-f3`) ; `28c0e22` migration DROP + sonde `RETIRED` (404) dans check-security ;
  `e20b979` pas de `load()` en plein onboarding quand le démarrage n'avait pas de session (trouvé
  en vérifiant : faux bandeau d'expiration, détournement possible sur appareil partagé).
  Vérifié en dev (prénom → code → mot de passe → entrée par `load_student`, `[SAVE] OK` ; démarrage
  sans session : aucun `load()` parasite), BUILD_ID vérifié en prod, **SQL appliqué par Jérémy**,
  `check:security` vert (19 tables, 38 RPC, `recover_student_row` en 404). Non testé en direct :
  claim d'un compte legacy, doublon de nom dans une promo.
- **F5 livré** (`9322f65`) : effet de sync d'email d'`App.jsx` en deps primitives (nom, promo,
  email) + `sU` fonctionnel à la réponse de `sync_my_student_email` (recopiait un `u` périmé).
  Mesuré en dev avec des compteurs posés sur le client Supabase, sur un aller-retour du toggle
  Narrator : avant 4 `getSession` + 2 abonnements par sauvegarde, après 1 + 0 ; `[SAVE] OK`.
  Chemin de synchro d'email lui-même non rejoué (email Teacher déjà synchronisé).
- **F4 livré** (`7dbc371`) : « Déconnexion complète » en `signOut({scope:'local'})` (vérifié dans
  auth-js : `POST /logout?scope=local`, seule la session courante est révoquée) ; `deleteAccount` et
  `reset` restent globaux (commentaires de garde) ; texte de confirmation réécrit (plus de lien
  magique). **Non testé en direct** : le bouton passe par `confirm()`, bloqué dans le navigateur
  intégré ; `scope:\`local\`` vérifié dans le bundle. **F6 livré** (`55a7f30`) : commentaires faux de
  `ensureAuthSession` (« la ligne reste atteignable ») et de `logout()` (« accès RLS au lookup »)
  réécrits. BUILD_ID `2026-09-16-f4f6` (`10ff6a9`).
- **« Changer de profil » ferme la session** (`8e6a21f`) : `logout()` fait aussi
  `signOut({scope:'local'})` ; un refus de sauvegarde arrivé après la déconnexion est ignoré (pas de
  reprise vers l'ancien compte). **Vérifié en dev** (`confirm()` remplacé pour le seul clic) :
  jeton supprimé, profil vidé, `[AUTH] session removed from storage`, et après rechargement l'app
  reste sur l'écran d'accueil (avant : ré-entrée sur Teacher). **Traces de pertes de session**
  (`55cdc24`) : `authTrace` (option `debug` d'auth-js, `src/supabase.js`) + échecs
  d'`ensureAuthSession` loggés avec leur raison ; aucun bruit en fonctionnement normal. BUILD_ID
  `2026-09-16-logout` (`c6c9e2f`).

### Pour la prochaine session (décisions de Jérémy)
- **Lire les traces `[AUTH]`** en usage réel (élèves, onglets multiples, PWA + navigateur) : un
  `[AUTH] refresh token failed: Invalid Refresh Token: Already Used` suivi de `session removed`
  confirmerait l'hypothèse des verrous ; une autre raison l'écarterait. Pas encore observé.
- Supabase Logs Explorer : `load_student refused (not_owner)` pour compter les élèves touchés.
- Détail visuel : le bandeau F2 recouvre le haut de l'écran (« ← Back », timer du Daily).

---

## Session 2026-09-17 — Audit visuel, puis ambiance « Parchemin » et coffre SVG sur Home

- **Audit visuel** (lecture seule, écrans parcourus sur le compte Teacher en 375 px + code) : 15
  propositions en 6 lots — moments de victoire (montée de niveau/ligue sans rien à l'écran, 32
  écrans de fin écrits à la main), ambiance, hubs vivants (progression vers le coffre mastery),
  sessions (tab bar visible, retour de réponse, `playCombo` jamais appelé), cohérence (League en
  français, Profil mixte, 62 trophées en emoji), Shop/League/trophées. **Règle posée par Jérémy :
  tout le chantier visuel passe par des protos**, variantes côte à côte.
- **Proto `prototypes/ambiance/`** (`496f614`) : vrais Home/Train/Drill avec un profil fictif local,
  5 fonds (Avant, Torche, Parchemin, Braises, Fresque), 16 skins, 4 fêtes, clair/sombre, 3 styles
  de coffre. Choix de Jérémy : **C « Parchemin » + coffre SVG teinté du palier**.
- **Câblé** : `e2b5e8a` fond (`.app::before/::after`, `isolation:isolate`, règle dans CLAUDE.md →
  CSS) ; `86390a2` bouton de Home (`pendingChestTier` dans `App()`, `.home-chest.tN`, règle dans
  CLAUDE.md → Chest System) ; `c0b61c2` banc aligné ; BUILD_ID `2026-09-17-ambiance` (`fa8a5ef`).
  16/16 tests, lintgate 347/368, build OK. Vérifié sur le banc (sombre/clair, Novice → Legendary,
  ×N, Halloween) et sur l'onboarding du serveur de dev ; **Home connecté pas vu en live** (session
  du panneau fermée), bureau ≥ 768 px pas vu.

### Pour la prochaine session
- Proto **moments de victoire** (lot 1 de l'audit) : cérémonie de montée de niveau/ligue sur le
  moteur du coffre v3 + écran de fin commun (`<SessionResult>`), puis hubs vivants.
- ~~Question ouverte : la League en français côté élève~~ → voulu (réponse de Jérémy, 2026-09-17).
- Contenu : le conseil du jour « When guessing, pick B or C » est faux depuis le mélange des options.

## Session 2026-09-17 (après-midi) — Écran de fin commun « Verdict d'Aldric », lots 0 à 5

- **Proto `prototypes/victory/`** (`c961ce8`), choix de Jérémy : **V3 « Verdict d'Aldric »**, niveau dans le
  parchemin, promotion « Ascension », examens gardés + cérémonies. Plan en lots, un commit par
  changement logique, vérification en vrai sur le compte Teacher à chaque lot (dev = base de prod).
- **Lot 0-1** : `gateSteps` + `settleXp.steps` + test (`02d9d23`), `lib/sessionText.js`, particules →
  `components/particles.js`, `SessionResult` + `Ceremonies` + CSS `sr-`/`cer-`, banc
  `prototypes/victory/real.html`, infra `App()` (sessions, diversion des coffres/Darics/trophées), pilote Drill.
- **Lot 2 (bugs)** : XP réduite deux fois sur bforge/tavern/clue (`1d8ea56`), total +1 sur P3/P4 (`e59678f`).
- **Lot 3** (BUILD_ID `2026-09-17-session-lot3`) : mini-modules grammaire, GerInf, PhrasalDojo, Listening
  P1-P4, P6, P7, Strategy Quiz, Daily, Sentence Builder, Audio Blitz.
- **Lot 4** (BUILD_ID `2026-09-17-session-lot4`) : Word Tavern, Clue Hunter, Speed Match, Word Fall
  (`gameSession`), Gauntlet (4 épreuves), Modal Council, Part 5 Exam Simulation ; `miniDone` et
  `getSpotlightMult` retirés. Correctifs : XP de Clue Hunter / Speed Match / Word Fall / Gauntlet / Modal
  versée à la fin et plus derrière « Collect XP » / « OK, back » ; Word Fall lisait vies et question du
  coup précédent sur une chute (`148da1d`) ; leçons à deux trous ; sceau de Clue Hunter en points.
- **Lot 5** : cérémonies niveau/ligue par-dessus Mock/Boss/Endless (`fdeccb9`), vérifiées en posant l'état
  localement (aucun examen joué par script : `mockResults`, estimation TOEIC, cooldown du Boss).
- **Explications P1/P2** : les leçons citent le texte des options (`xq`, `4235065`) ; l'exercice gardait
  des lettres justes, mais la carte de leçon ne les montre pas.
- **Vérifié en vrai sur Teacher** : chaque famille jouée (souvent par script, pane masqué : ticks
  MessageChannel, stub audio), XP affichée = profil = `load_student`, coffres et trophées dans le
  parchemin, Continue / Play again. Effet de bord : Speed Match fini en 2,6 s par script → 956 XP
  (formule en 1/temps), niveau 81 et Diamond sur Teacher (masqué des classements).
- Décision : **la League reste en français** (voulu).

### Pour la prochaine session
- Jérémy joue un **Mock** pour valider les cérémonies d'examen en vrai.
- Audit visuel, lot suivant : hubs vivants (anneau vers le coffre mastery, dernier score, XP du jour).
- Contenu : le conseil du jour « When guessing, pick B or C » est faux depuis le mélange des options.
- Speed Match : la formule d'XP en 1/temps se farme par script (plancher 1 s), à borner si besoin.

## Session 2026-09-17 (suite) — Dashboard formateur bloqué sur « Loading groups... » (smartphone)

- **Symptôme** : sur le téléphone de Jérémy, le sélecteur de groupes restait sur « Loading
  groups... » ; sur le laptop, rien à signaler.
- **Cause** : le déverrouillage biométrique (WebAuthn) ne vérifie que l'empreinte, en local, puis
  rouvre le code formateur gardé en localStorage (`toeic-dash-teacher`). Tout logout le purge
  (`clearDashSession` : « Changer de profil », « Déconnexion complète », reset), mais la clé
  biométrique (`toeic-teacher-bio`) survit. L'empreinte ouvrait donc le dashboard avec un code vide :
  `teacherAuth("")` refuse sans appeler le serveur, liste vide, et le sélecteur affichait
  « Loading groups... » pour **toute** liste vide, refus compris. Le laptop passait par la saisie du
  code. Rendu visible par les déconnexions des 16-17/09 (F4, « Changer de profil »). Le verrou
  d'auth n'y était pour rien.
- **Livré** : `6c0ac43` biométrie proposée seulement si un code est mémorisé (`hasDashSession()`
  dans `lib/teacherSession.js`, Onboard + Profil), sinon saisie du code avec « Enter your code once:
  biometric unlock will work again afterwards. » ; `bb67f11` le sélecteur distingue chargement /
  code refusé (saisie du code sur place) / panne (Réessayer) / 12 s sans réponse (« Toujours en
  cours : réessayer ») ; BUILD_ID `2026-09-17-teacher-bio` (`4e5840b`).
- **Vérifié** : 16/16 tests, lint sans nouvelle erreur (lintgate 346/368). En dev : clé biométrique
  factice sans code → plus de bouton biométrique ; code bidon + empreinte simulée → écran « Code
  formateur absent ou refusé », nouvelle saisie → « Code invalide ». **Confirmé en prod par
  Jérémy** sur son téléphone : code redemandé une fois, groupes affichés immédiatement.

---

## Earlier session: 2026-04-27 → 2026-04-28 (Chest redesign V2 — full sprint, ~30 commits)

**Le plus gros sprint mono-chantier de S2.** Refonte complète du système de coffres + token actions + cosmétiques cohérents avec la DA shield + League extension + 5 cheat sheets pédagogiques inédites + 3 mémoires post-mortem capturées.

### Chest redesign V2 — chantier complet
Plan validé en pause créative 2026-04-27 (mémoire `project_chest_redesign.md`), puis exécuté en 5 steps + extensions.

- **Step 1 — Data foundation** (`ff7fdf8`) : 8 nouveaux types d'items (FRAMES×8, TITLES×12, TOKEN_TYPES×7, CHEAT_SHEETS×3 puis ×8), DROP_TABLES segmentées par tier de coffre, `pickRewards()` parallèle. SQL migration `2026-04-27_chest_redesign_v2.sql` : table `player_tokens` + helpers `grant_token` / `consume_token`.
- **Step 2 — 5 recurring chest sources** (`17ebcbb`) : daily login (refondu en `streak_login` palier %3), weekly TOEIC progression (+25 pts), league podium (top 3 weekly_snapshots), mission streak 7, module mastery (≥50Q ≥80%). Triggers ID embed date/wkId/modId pour unicité native via `hasUniqueTrigger`.
- **Step 3 — Sequential chest opening** (`f2e7483`) : `ChestOpenModal` cycle reveal multi-items via `revealIdx`, Next/Collect button. `openChestFromPending` refondu pour persister chaque reward dans la bonne table (player_rewards / player_tokens).
- **Step 4 — Profile Collection / Style refonte** (`4ad28a7` + Consommables `cade637`) : sub-views étendues avec Frames, Titles, Cheat Sheets (cliquable → GrimoireReader inline), Consommables (8 tokens avec progress bars). SQL : `students.frame_id`, `students.title_id`. Collection en bannières dépliables (commit `5809777`).
- **Step 5 — Conversions doublons** (`bfb92c7` puis floor `9d15a16`) : 3 dups → 1 token (seuil ≥4 pour préserver l'original — voir bug ci-dessous), 5 tokens non-premium → 1 premium. Sub-view dédiée Profile.

### Token actions A/B/C — 2026-04-28
- **A** (`e96966f`) — Streak Shield (passif, auto-consume sur gap 1 jour) + Daily Reroll (clic Collection, modal confirm + reset u.mission + bumprerollCount pour shifter le seed déterministe).
- **B** (`04ee2ea`) — Boss Reset / Endless Resurrect en in-context CTAs sous cards locked. Arment des flags (`bossResetArmed`, `endlessResetArmed`) consommés dans `bossDone` / `endlessDone`. Mock Reset livré séparément (`86a3b34` + fix override `d1c8170` — les Mocks sont locked permanently post-completion, pas en cooldown 24h).
- **C** (`5141e6e`) — Bypass Token ciblé module (Option B : sélecteur top-3 sessions today, applyXpGates skip si match) + Insight Token (heuristique `generateInsight`, modal gold/violet, sauvegarde `u.insights[]`).

### Bug en cascade et 3 fixes critiques
Pendant le sprint, 3 bugs successifs ont mis à mal Teacher account (et 8 students) avant d'être stabilisés. Chacun a généré une mémoire post-mortem :

1. **Module Mastery loop** (`f419f97`) — useEffect avec dep `[u && u.moduleScores]` re-firait à chaque `sv()` (JSON.parse change la référence) → 10+ `grantChestLocal` parallèles → race contre `hasUniqueTrigger` async → +37k XP fantômes pour Teacher en quelques minutes (cleanup SQL UPDATE pour ramener au bon montant). **Mémoire :** `feedback_useeffect_dep_by_ref.md`.
2. **CHECK constraints silencieuses** (`97bf21b` + `b918f2f`) — V1 avait `CHECK (reward_type IN ('xp','avatar','skin'))` sur chest_log et player_rewards. V2 introduit `multi`, `frame`, `title`, `cheat_sheet`, `token` sans relâcher les CHECK → INSERT silencieusement bloqués → audit trail cassé → re-grants en chaîne. **Mémoire :** `feedback_supabase_check_constraints.md`.
3. **Conversions destructive sans floor** (`9d15a16`) — `convertCosmeticDups` consommait 3 rows quand `count >= 3`, ce qui wipait l'original quand l'user avait pile 3 instances. Teacher a perdu ~25 avatars/skins avant fix (SQL restore appliqué). Seuil corrigé à `>= 4` pour préserver 1 minimum. **Mémoire :** `feedback_destructive_action_safety.md`.

### Cosmétiques V2.4 — 2026-04-28
- **5 nouvelles cheat sheets pédagogiques inédites** (Part 5 word pairs, Listening reductions, Part 5 modals, business false cognates, Part 7 inference) — angles non couverts par STRATEGIES, en français per grimoire policy.
- **Frames refondus comme outer-shield outline** (`00efaec` + `70d5bbc`) : abandon du wrap CSS cercle, AvatarMedal SVG accepte un `frameId` et dessine un 2e shield path autour de l'avatar shield. Stroke 3-4px + drop-shadow simple + animation CSS `frame-cosmic` / `frame-dragon` pour Legendaires.
- **Aldric's Chosen** (`7282a24`) : titre exclusif Teacher only (`exclusive:true` flag dans TITLES, jamais dropé en chest, granted via SQL).
- **League rankings** (`9f76941`) : RankRow rend frame + titre des rivals (Week / Season / Overall tabs). Bots fictifs sans frame/title = rendu standard, pas de glitch.
- **Strategy Cards icons** (`9f9c166`) : 8 emojis section migrés vers game-icons SVG (spyglass / chat-bubble / conversation / public-speaker / scroll-quill / stone-tablet / spell-book / swords-emblem) cohérents avec la tab bar archetype. Filter tabs Listening/Reading idem.
- **i18n EN cohérente** (`e7f3072`) : Profile/Collection/Style/Conversions/Tokens/CTAs en anglais. Cheat Sheets restent FR (grimoire policy). Auth security flow Profile→Account reste FR (trust policy).

### Profile reorder + Conversions migration UX (`be1b277`)
- Chronicles card AU-DESSUS de Teacher Dashboard (étudiant-facing avant teacher-tool)
- Conversions card retirée de Profile home, déplacée DANS la Collection sub-view (en bas après les bannières) — destination naturelle après les badges ×N

### 3-day streak login chest (`3a5825e`)
- Daily login chest (1×/jour si streak ≥1) → trop généreux côté étudiants
- Refondu en `streak_login_<date>` Novice à streak=3,6,9,12... (palier %3). Si streak break, on recommence (la date du trigger ID change). Pas de double-counting avec streak_7/30/100 qui restent séparés.

### État final (fin de session)
- 30+ commits sur main, Vercel deployed
- Teacher account restauré (XP rollback manuel -37k + SQL restore avatars/skins/frames/titles + Aldric's Chosen attribué)
- Tous les pending_chests dupliqués nettoyés via DISTINCT ON
- Chest log audit trail intègre, `hasUniqueTrigger` opérationnel
- 5 cheat sheets en production (3 stubs initiaux + 5 inédites)
- 3 mémoires post-mortem capturées pour ne pas refaire les mêmes erreurs

### Pour la prochaine session
Backlog S2 simplifié à 3 items ouverts (cf. `project_todo_s2_progress.md`) :
- 🔴 Re-engagement event S2 (cible septembre 2026 — Season 2 Chest + XP×2 semaine 1 + reset partiel + welcome push)
- 🟠 Magic Link Phase 3 (interception migration des 113 students existants — Phases 0+1+2 déjà DONE)
- 🟠 Stripe Checkout full flow (sandbox + CGV DONE, validation E2E à finir avant cutoff IDRAC 2026-06-28)

Duel Arena bilan + Multi-campus retirés du backlog 2026-04-28.

---

## Previous session: 2026-04-23 → 2026-04-24 (narrator Aldric + League baseline + Stripe hardening + incident cleanup)

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
4. Before any structural change (App() state, layering, new module), use Plan Mode
5. A new module goes in `src/features/<module>/` + a line in `src/routes.jsx` — see the `add-module` skill

---

_Last updated: 2026-09-16 · Phase 5 du découpage en prod (code mort, `lib/xp.js` pur + test + équivalence 2 000/2 000, lazy chunks : principal −65 %, préchauffage à l'idle). Listening P1/P2 : clips regénérés sans lettre + lettres à part dans la voix de l'item (permutation des options enfin juste, Endless corrigé). `groups` fermée au client (P2-D5). Next: vérif prod listening. Avatars Anaïs et backlog S2 abandonnés._
