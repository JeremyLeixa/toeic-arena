# Refactor du monolithe `src/App.jsx` — plan d'attaque

Rédigé le 2026-09-15 à partir d'une analyse AST du fichier (espree, script
`scripts/refactor/depgraph.cjs` à créer en Phase 0 à partir du prototype de session).
Ce document est la source de vérité du chantier. Le mettre à jour à chaque lot.

---

## 1. Constat (mesuré, pas estimé)

| Mesure | Valeur |
|---|---|
| Lignes | 18 589 (CRLF sur 100 % des lignes) |
| Déclarations top-level | 220 (187 fonctions, 33 `var`) + 34 `import` (138 symboles) |
| Composants React top-level | 94 |
| Helpers / constantes top-level (hors composants) | 126 |
| `App()` | l. 17125 → 18589 = 1 465 lignes, 23 `useState`, 20 `useEffect`, 6 `useRef`, 42 fonctions internes |
| CSS en template literal | 398 l. (`CSS`) + 26 (`DTL_CSS`) + 18 (`SBD_CSS`) |
| Build prod | 30,8 s, **un seul chunk** de 3,27 Mo (942 Ko gzip) |
| Lint | 330 problèmes dans App.jsx (151 `no-unused-vars`, 93 `no-empty`, 79 `exhaustive-deps`) — **déjà rouge** |
| Tests | 7/7 verts, 1,7 s ; **5 sur 7 découpent App.jsx par nom de fonction** |

### Le fait qui dé-risque tout

**Aucun composant ne référence l'intérieur de `App()`.** C'est lexicalement impossible
(ils sont déclarés au niveau module, `App()` aussi). Les 94 composants ne touchent que
(a) leurs props, (b) des helpers top-level, (c) des imports de données. Le graphe de
dépendances le confirme : la colonne « deps » de chaque composant ne contient que des
helpers purs (`shuffle`, `today`, `estimateTOEICScore`, `playAudioFile`…).

Donc : déplacer un composant dans un fichier = couper/coller + écrire ses imports.
Zéro changement de portée, zéro changement de comportement. Attention toutefois : un
import oublié ne sort **pas** au build. Rolldown laisse passer un identifiant inconnu
(il pourrait être un global) et c'est un `ReferenceError` au **rendu** qui le révèle.
D'où la règle : imports calculés par l'AST, lint du nouveau fichier, et smoke test
navigateur à chaque lot, pas seulement `npm run build`.

### Les 3 seuls endroits qui ne sont PAS du couper/coller

Une `var` mutable de niveau module devient, une fois exportée, une **liaison en lecture
seule** pour ses importateurs. Tout site qui l'**assigne** depuis un autre fichier casse.
Sites recensés (AST, `AssignmentExpression` sur un nom top-level) :

| Variable | Écrite par | Lue par (hors module d'origine) | Action |
|---|---|---|---|
| `_listenAudio` | `speak`, `speakAndWait`, `playAudioFile`, `stopListenAudio`, **`AudioBlitz` (l. 10203-10248, 2 sites)** | — | ajouter `registerListenAudio(audio)` dans `lib/audio.js`, AudioBlitz l'appelle |
| `_audioAborted` | `stopListenAudio`, `resumeAudioSession` | **`Onboard`** (lecture directe) | ajouter `isAudioAborted()` ; Onboard l'appelle |
| `_cachedUserId`, `_syncDirty` | `load`, `save`, `saveLocal` | `App()` (lecture seule) | `export var` suffit (liaison vivante), accesseurs optionnels |
| `_voices`, `_audioCache`, `_mp3Failed`, `_lastSync` | uniquement dans leur groupe | — | partent avec le groupe, rien à faire |

Tout le reste du fichier est déplaçable tel quel.

### Ce qui n'est PAS un obstacle (vérifié)

- Les 4 `no-redeclare` du lint (`ctrl`, `it`, `q`, `rows`) sont des variables **internes** à
  des fonctions, pas des doublons top-level. Aucun risque de « déplacer la mauvaise copie ».
- Le hook conditionnel (`rules-of-hooks`, l. 5898, dans `Daily`) est préexistant et ne
  bouge pas avec le refactor.
- `public/sw.js` ne référence aucun nom d'asset en dur → le code-splitting ne le casse pas.
- `tests/check_rpc_contracts.cjs` parcourt `src/` récursivement → suit les nouveaux fichiers seul.

---

## 2. Principes (non négociables pendant le chantier)

1. **Déplacer, jamais réécrire.** Pas de renommage, pas de reformatage, pas de « tant que
   j'y suis ». Le seul moyen de prouver l'équivalence est que `git diff --color-moved`
   ne montre que des blocs déplacés + des lignes `import`/`export`.
2. **Un lot = un commit = build vert + tests verts + smoke navigateur.** Les tests qui
   découpent App.jsx sont ré-orientés **dans le même commit** que la fonction qu'ils lisent.
3. **Sens des dépendances imposé** : `data/` → `lib/` → `components/` → `features/` → `App.jsx`.
   `lib/` n'importe jamais de JSX. `components/` n'importe jamais `features/`. Un test
   (`check_import_graph.cjs`) vérifie l'absence de cycle et le sens des flèches.
4. **Une `var` mutable migre avec tous ses sites d'écriture** (tableau ci-dessus). Sinon
   on scinde un singleton en deux copies : bug silencieux.
5. **Rien ne part sur `main` en milieu de phase.** Vercel déploie `main` → un état
   intermédiaire cassé touche les étudiants. Branche `refactor/split-app`, merge par phase.
6. **Aucun travail de fonctionnalité sur App.jsx en parallèle.** Les ajouts de contenu
   dans `src/data/` restent possibles (aucun conflit).
7. **CRLF conservé.** Les nouveaux fichiers sont écrits en CRLF (autocrlf=true, mais un
   arbre mixte rend `git diff` illisible).

---

## 3. Cible

```
src/
  main.jsx
  App.jsx                    App() seul (≈1 500 l. après Phase 3, ≈750 après 4a)
  routes.jsx                 Phase 4a — la table sp → écran (45 lignes de if)
  styles/appCss.js           CSS (398 l.). DTL_CSS et SBD_CSS restent avec leur composant.

  lib/                       zéro JSX, zéro React. Importable en natif par les tests.
    util.js                  today, weekId, shuffle, srand, normalizeName
    device.js                isStandalonePWA, isIOSDevice, haptic, HAPTICS
    audio.js                 getEnVoice, speak, speakAndWait, speakBrowserTTS, playAudioFile,
                             stopListenAudio, resumeAudioSession, _voices/_audioCache/_mp3Failed/
                             _listenAudio/_audioAborted + registerListenAudio(), isAudioAborted()
    listeningShuffle.js      shufListeningOpts, remapOptLetters, A_IS_OPT_LABEL, shufListeningItem,
                             seedFromId, BOSS_SHUF_STEP, detShufListeningItem, BOSS_P2_SHUF
    access.js                FREE_MODULES, FREE_FLASHCARD_DOMAINS, hasFullAccess, isModuleLocked,
                             PREMIUM_UPGRADE_ENABLED, GHOST_NAME, isGhost, optIcon
    toeic.js                 estimateToeic, MODULE_TOEIC_MAP, partOfModule, partAccuracies,
                             bsScanParts, computeTodayFocus, battleScanToToeic,
                             estimateTOEICScore, generateInsight
    league.js                getLeague, getEffectiveLeague, generateSeasons, SEASONS,
                             getCurrentSeason, getSeasonEndCountdown, computeRankings,
                             pushWeeklySnapshot, applyWeekTransition
    profileSchema.js         fresh, supaToLocal, buildSavePayload   ← PUR (pas d'import supabase)
    persistence.js           SK, BUILD_ID, loadLocal, saveLocal, getAccessTokenSync, load,
                             ensureAuthSession, save, syncToCloud, _cachedUserId, _syncDirty, _lastSync
    progress.js              recordModule, pickAdaptive, checkMission, getModuleAccuracy,
                             MISSION_THRESHOLD, getDailyMission, canUnlockMock, canUnlockBoss,
                             SEASON_START, needsMockNudge, getEndlessState, dailyQs, compScores,
                             srsUp, dueCards
    endless.js               generateEndlessTest, freshAnsFor, endlessAnsFitsTest
    teacherSession.js        getDashTeacher, getDashRole, setDashSession, clearDashSession,
                             isDashAdmin, teacherAuth, BIOMETRIC_KEY, biometricAvailable,
                             getBioCredId, storeBioCredId, bioRegister, bioAuthenticate
    push.js                  VAPID_PUBLIC_KEY, urlBase64ToUint8Array, subscribePush,
                             unsubscribePush, isPushSubscribed
    grimoireExport.js        escHtml, renderGrimoireBlockHtml, downloadGrimoire
    feedbackModules.js       FEEDBACK_MODULES, findModuleLabel
    chestLabels.js           getTriggerLabel, parseInlineStyle
    shopCatalog.js           SHOP_SECTIONS, shopRarColor, shopItemName, shopItemDesc

  components/                widgets rendus par ≥ 2 features
    icons.jsx                GIcon, LeagueIcon, SeasonIcon, ResultIcon, BrandMark, SEASON_GI, RESULT_GI
    Bar.jsx · SpeakBtn.jsx · ListeningGraphic.jsx · PassageDocs.jsx (+ parsePassageDocs)
    avatar.jsx               renderAv, AvatarMedal, RARITY_STYLES, TreasureChestSvg
    toasts.jsx               XpToast, AchToast, MarksToast, DaricPill
    Tabs.jsx · NextStepReco.jsx
    GrimoireReader.jsx       + renderGrimoireBlock
    TokenCTAs.jsx            TokenContextCTA, BossResetCTA, EndlessResetCTA, MockResetCTA
    legal.jsx                PrivacyPolicy, MediationInfo, CGVPage

  features/                  un dossier par écran/module, un composant racine par fichier
    onboarding/Onboard.jsx                       (1 263 l., 48 useState)
    home/Home.jsx · Train.jsx · Cards.jsx (Cards+CardSess) · Daily.jsx · DailyTip.jsx
    mentor/Mentor.jsx        Mentor, MentorGoalCard, MentorMap, MentorSheet, MentorDailyMission, TodayFocusBanner
    train/grammar.jsx        Drill, WordFam, ConnSort, LinkingBridge, PrepDrill+StudyGroup, GerInf,
                             TrapsQuiz, FalseFriends, PhrasalDojo, GrammarRef+GRAMMAR_SHEETS
    train/reading.jsx        Part6Drill, Part7Read, TimeSim
    train/strategy.jsx       AboutToeic, StratCards, StratQuizPage
    gauntlet/                IrregularCrypt, Chronomancer, PassiveForge, RelativeWeaver, GauntletHub
    modals/                  ModalMatch (+DTL_CSS), ModalSort, ModalCouncilHub
    listening/               ListenHub, ListenP1, ListenP2, ListenP3, ListenP4, ReadingHub
    exams/                   MockTest.jsx, BossTest.jsx, EndlessArena.jsx
    games/                   GamesHub, SentenceBuilder (+SBD_CSS), AudioBlitz, DuelArena (695 l.),
                             ClueHunter, WordTavern, SpeedMatch, WordFall
    league/League.jsx        League, RankRow, loadProgressionData
    chests/                  ChestEarnedToast, ChestRewardCard, ChestOpenModal
    shop/                    Shop, ShopItemVisual, ConversionsView, UpgradeScreen
    profile/                 Profile (1 254 l.), FeedbackForm, ResetPasswordView
    narrator/NarratorOverlay.jsx
    teacher/                 TeacherDash (1 385 l.), WeeklyReport
```

≈ 45 fichiers. Le plus gros (`TeacherDash.jsx`) fait 1 400 lignes ; la médiane ≈ 150.

---

## 4. Mécanique : l'outil avant les mains

Déplacer 15 000 lignes à la main est le meilleur moyen d'introduire l'erreur qu'on
essaye d'éviter. **Phase 0 construit un script d'extraction**, ensuite chaque lot est une
commande + une relecture.

`scripts/refactor/extract.cjs <manifest.json>` :

1. Parse `src/App.jsx` avec espree (JSX activé, déjà dans `node_modules`).
2. Pour chaque `"cible.js": ["nom", …]` du manifeste : localise les plages de lignes
   top-level, **copie le texte brut** (CRLF inclus), préfixe chaque déclaration par
   `export`.
3. Calcule les imports du nouveau fichier à partir des identifiants réellement référencés :
   - symbole déjà extrait → `import { x } from "<registry[x]>"`
   - symbole importé par App.jsx (données, sounds, supabase, React) → recopie l'import
   - symbole **encore dans App.jsx** → **refus** avec la liste (« déplace-le d'abord »).
     C'est ce qui impose l'ordre feuilles → racine et interdit les cycles.
4. Retire les plages d'App.jsx, ajoute `import { … }` pour ce qu'App.jsx utilise encore.
5. Met à jour `scripts/refactor/registry.json` (nom → module).

Deux tests de garde, ajoutés à `npm test` en Phase 0 et conservés après :

- **`check_symbol_census.cjs`** — chaque nom top-level présent dans App.jsx au commit de
  départ existe **exactement une fois** dans `src/` (ni perdu, ni dupliqué). Liste figée
  depuis `git show <commit-départ>:src/App.jsx`.
- **`check_import_graph.cjs`** — aucun cycle d'import dans `src/`, et sens
  `data → lib → components → features → App` respecté.

Relecture d'un lot : `git diff --color-moved=dimmed-zebra --color-moved-ws=allow-indentation-change`.
Les blocs déplacés apparaissent grisés ; seules les lignes `import`/`export` et les 3
retouches manuelles (§1) doivent ressortir en couleur. `git diff --stat` doit montrer
lignes retirées d'App.jsx ≈ lignes ajoutées ailleurs.

---

## 5. Phases

### Phase 0 — Filet (1 session, 0 ligne déplacée)

- [ ] Décision sur `claude/keen-wozniak-68adc4` (4 commits sur App.jsx, 2026-07-31,
      homonymes). Après le découpage cette branche ne se merge plus. Merger avant, ou
      l'abandonner si le chantier auth de septembre l'a rendue caduque. **Décision Jérémy.**
- [ ] `git worktree prune` des 6 worktrees `.claude/worktrees/*` obsolètes.
- [ ] Branche `refactor/split-app` depuis `main`.
- [ ] `scripts/refactor/depgraph.cjs` (prototype de session) + `extract.cjs` + `registry.json`.
- [ ] `tests/check_symbol_census.cjs` + `tests/check_import_graph.cjs`, ajoutés à `tests/run.cjs`.
      Prouvés mordants (dupliquer un nom → rouge ; créer un cycle → rouge).
- [ ] Baselines notées ici : build 30,8 s / 3 272 Ko ; lint 330 (App.jsx) ; tests 7/7.

### Phase 1 — `lib/` : sortir tout ce qui n'est pas React (1 session, ~14 commits)

Ordre = ordre des dépendances (le script refuse sinon) :
`util` → `device` → `audio` (+ les 3 retouches §1, même commit) → `listeningShuffle` →
`access` → `toeic` → `league` → `profileSchema` → `persistence` → `progress` → `endless` →
`teacherSession` → `push` → `grimoireExport`, `feedbackModules`, `chestLabels`, `shopCatalog`
→ `styles/appCss.js`.

Tests ré-orientés dans le même commit, et **désormais en import natif** (plus de
`sliceFunction` / `new Function`) :

| Test | Aujourd'hui | Après |
|---|---|---|
| `check_profile_roundtrip` | slice `today, weekId, fresh, buildSavePayload, supaToLocal` | `import("../src/lib/profileSchema.js")` |
| `check_identity` | slice `normalizeName` | `import("../src/lib/util.js")` |
| `validate_endless_resume` | slice bloc `generateEndlessTest…endlessAnsFitsTest` | `import("../src/lib/endless.js")` |
| `validate_listening_shuffle` | bloc par marqueurs texte | `import("../src/lib/listeningShuffle.js")` |
| `validate_toeic_shrinkage` | `git show 26c1f80:src/App.jsx` vs working tree App.jsx | côté OLD inchangé (commit figé) ; côté NEW lit `lib/toeic.js` |

C'est pour ça que `profileSchema.js` est séparé de `persistence.js` : `fresh/supaToLocal/
buildSavePayload` sont purs, `load/save` importent supabase. Le test importe le pur.

Sortie de phase : App.jsx ≈ 17 000 l. Merge sur `main`.

### Phase 2 — `components/` : les widgets partagés (½ session, ~6 commits)

`icons` → `Bar`, `SpeakBtn`, `ListeningGraphic`, `PassageDocs` → `avatar` → `toasts`,
`Tabs` → `GrimoireReader` → `NextStepReco`, `TokenCTAs`, `legal`.

Sortie de phase : App.jsx ≈ 16 300 l. Merge sur `main`.

### Phase 3 — `features/` : les écrans (2 sessions, ~14 commits, du plus simple au plus gros)

1. `train/` (grammar, reading, strategy) + `home/Cards.jsx`, `Daily.jsx`, `DailyTip.jsx`
2. `gauntlet/`, `modals/`
3. `games/`
4. `listening/`
5. `exams/`
6. `mentor/`, `home/Home.jsx`, `home/Train.jsx`
7. `league/`
8. `chests/`
9. `shop/` + `UpgradeScreen`
10. `profile/`
11. `narrator/`
12. `onboarding/`
13. `teacher/`

Sortie de phase : **App.jsx ≈ 1 550 l.** (≈ 90 lignes d'imports + `App()`). Merge sur `main`.
**Mise à jour obligatoire** de `CLAUDE.md` (« App.jsx is monolithic » → nouvelle carte),
des skills `add-module`, `fix-css`, `add-supabase-field`, et de `CONTEXT.md`.

### Phase 4a — `routes.jsx` (½ session, 1 commit)

Les 45 `if(sp==="…")return pg(<…/>)` (l. 18525-18566) deviennent une fonction
`renderRoute(sp, ctx)` dans `routes.jsx`, `ctx` = l'objet des setters/callbacks qu'elles
utilisent (`u, spA, nav, sSP, sSPA, sT, applyXpGates, miniDone, gameDone, mockDone, …`).
Déplacement de JSX pur, aucun état ne bouge. App.jsx ≈ 750 l.

**On s'arrête là par défaut.** Le corps de `App()` avec ses 23 états et 20 effets reste
lisible à cette taille, et les 42 fonctions internes referment sur `u`/`sU` d'une façon qui
rend leur extraction en hooks (`useChests`, `useXp`, `useSession`…) **non mécanique** :
l'ordre des `useEffect` doit être préservé au hook près, et c'est le seul endroit du
chantier où une erreur serait un bug logique silencieux plutôt qu'un crash au rendu.

### Phase 5 — Dividendes (à la demande, après stabilisation)

- `React.lazy` sur `teacher/` (1 750 l. + recharts), `onboarding/`, `exams/`, `games/DuelArena`.
  Note : `Profile` utilise aussi recharts (l. 15989) → recharts ne sort du chunk principal
  que si le graphe de Profile est lui aussi différé.
- `applyXpGates` / `addXp` → `lib/xp.js` en fonctions pures (état en argument) : rend les
  portes XP testables, seule mécanique critique hors filet aujourd'hui.
- Code mort à confirmer puis supprimer : `speakAndWait`, `compScores`, `getModuleAccuracy`,
  `parseInlineStyle`, `_lastSync`, `SK`.
- Dette lint : la règle devient « la somme des problèmes sur `src/` ne monte pas ». Un
  `no-unused-vars` dans un nouveau fichier est un import inutile → à corriger.

---

## 6. Risques et parades

| Risque | Probabilité | Parade |
|---|---|---|
| Import manquant → `ReferenceError` au rendu (pas au build) | haute sans outil | imports calculés par l'AST, pas à la main ; lint du nouveau fichier ; smoke navigateur par lot |
| Cycle d'import → `undefined` à l'init d'une `const` (`BOSS_P2_SHUF`, `SEASONS`) | moyenne | `check_import_graph` + ordre feuilles → racine imposé par le script |
| Singleton scindé (`_listenAudio` etc.) | certaine si oubliée | tableau §1, 3 retouches identifiées, même commit que `lib/audio.js` |
| Conflit avec une branche ouverte sur App.jsx | certaine pour keen-wozniak | décision en Phase 0 |
| État intermédiaire déployé sur Vercel | — | branche, merge par phase uniquement |
| Arbre CRLF/LF mixte → diff illisible | haute | script écrit en CRLF |
| « Tant que j'y suis » qui masque une régression | haute | principe 1 ; `--color-moved` à la relecture |
| Tests ne trouvant plus leur fonction | certaine (5/7) | ré-orientés dans le commit du déplacement |

Ce que le refactor **ne change pas** : le déploiement (Vite → Vercel), le SW, Supabase,
les RPC, le CSS (toujours injecté via `<style>{CSS}</style>`, cascade identique).

---

## 6 bis. Invisibilité pour les utilisateurs (objectif n°1 de Jérémy)

Ce que voit un étudiant = le bundle de `main` déployé par Vercel. Le refactor ne touche
ni Supabase, ni les RPC, ni la forme du profil, ni `localStorage`, ni `sw.js`, ni le CSS.
Il n'y a donc que **deux canaux** par lesquels il pourrait le remarquer : un déploiement
cassé, ou une régression sur un écran. Parades, par ordre de force :

1. **Rien ne part sur `main` en cours de phase.** Entre deux merges, l'étudiant exécute
   le code d'aujourd'hui, octet pour octet. Un merge = un déploiement ordinaire, du même
   type que chaque commit actuel.
2. **Le déploiement ne force aucun rechargement.** Le `controllerchange` d'`index.html` ne
   se déclenche que si `sw.js` change, et le refactor n'y touche pas. Un onglet ouvert
   (Mock en cours, Endless…) continue sur l'ancien bundle jusqu'au prochain rechargement
   volontaire. Vérifié dans `index.html` l. 43-47 et `public/sw.js` l. 21/34.
3. **Rollback = un `git revert` du commit de merge**, un push, 30 s de build. Aucune
   migration SQL, aucun format de données, donc aucun « filet brûlé » : le retour arrière
   est toujours possible, à tout moment, sans effet de bord.
4. **Validation sur le build de production, pas seulement en dev** : `npm run build` puis
   `npm run preview` exposé en LAN pour le téléphone (PWA, audio, haptique). Évite la
   Preview Protection Vercel (401) et teste exactement ce qui sera déployé.
5. **Diff des littéraux de chaîne entre les deux bundles** (`main` vs branche) : un
   composant oublié à l'import disparaît du bundle par tree-shaking, et ses libellés avec
   lui. Extraire, trier, diff : seuls les chemins de modules doivent différer.
6. **Smoke navigateur par lot**, console ouverte : chaque écran déplacé est ouvert au
   moins une fois. Points d'attention spécifiques aux 3 retouches manuelles : Audio Blitz
   (lecture + navigation en plein clip), Listen P1-P4 (stop à la sortie), Battle Scan de
   l'onboarding (audio).
7. **Fenêtre de merge** : matin, hors créneau d'usage étudiant. 3 à 4 merges sur tout le
   chantier, chacun annoncé nulle part : ce sont des déploiements sans changement visible.

Le seul risque réellement visible pour un utilisateur est confiné à la **Phase 5**
(code-splitting) : un onglet ouvert sur l'ancien `index.html` qui charge à la demande un
chunk dont le hash n'existe plus après un déploiement. Parade connue (écouter
`vite:preloadError` et recharger), à mettre en place **avant** d'activer le lazy loading.
Tant qu'on est en un seul chunk (Phases 0 à 4a), ce risque n'existe pas.

## 7. Ce que ça rapporte

- **Maintenance** : un bug de Word Tavern se lit dans `features/games/WordTavern.jsx`
  (139 l.), pas en grep dans 18 589 lignes. Même chose pour Claude : lire un fichier
  entier au lieu de le trancher.
- **HMR** : Vite ne re-parse que le module touché, plus 1,3 Mo à chaque sauvegarde.
- **Tests** : import natif des modules purs, fin des `new Function` sur du texte découpé.
  Les portes XP deviennent testables (Phase 5).
- **Bundle** : le code-splitting devient possible (Phase 5). Cible plausible : −35 à 40 %
  de JS initial pour un étudiant (Teacher + Onboarding + exams différés).
- **Revue** : `git diff` par feature au lieu d'un fichier unique où tout se mélange.

---

## 8. Décisions à prendre (Jérémy)

1. Branche `claude/keen-wozniak-68adc4` : merger avant, ou abandonner ?
2. Arborescence §3 : OK, ou préférence pour du plat (`src/components/*.jsx` sans `features/`) ?
3. S'arrêter à la Phase 4a (recommandé) ou aller jusqu'aux hooks de `App()` ?
4. Cadence de merge : par phase sur `main` (recommandé) ou un seul merge à la fin ?
5. Test téléphone (audio, PWA) sur les previews Vercel : la Preview Protection bloque
   en 401 (vu pendant Stripe). La désactiver le temps du chantier, ou tester en LAN ?

## 9. Journal

- 2026-09-15 — plan rédigé, rien déplacé. Baselines : build 30,8 s / 3 272 Ko (942 gzip) ;
  lint 330 App.jsx ; tests 7/7 en 1,7 s.
- 2026-09-15 — décisions : branche homonymes `claude/keen-wozniak-68adc4` **abandonnée**
  (caduque : requêtes directes à `students` interdites depuis le verrou RPC, `main` traite
  le cas autrement) ; arborescence §3 validée ; arrêt à la Phase 4a ; merge par phase ;
  Preview Protection Vercel désactivée par Jérémy le temps du chantier.
- 2026-09-15 — **Phase 0 livrée** sur `refactor/split-app` : `scripts/refactor/`
  (`astTools.cjs`, `depgraph.cjs`, `extract.cjs`), `tests/check_symbol_census.cjs` +
  `tests/check_import_graph.cjs` (prouvés mordants : doublon exporté, symbole disparu,
  cycle, sens interdit), baseline de 221 symboles figée (`tests/appjsx_symbols_baseline.json`,
  pas dans `tests/data/` qui est gitignoré).
  Deux exceptions préexistantes documentées dans les tests : le `shuffle` privé de
  `scanEngine.js` (un helper non exporté n'est pas une copie) et `data/chests.js` rangé en
  couche 1 (il importe Supabase). App.jsx contient aussi 3 instructions top-level hors
  déclaration (`onvoiceschanged` l.195, `console.warn` BUILD_ID l.773, nettoyage
  localStorage l.784) : l'extracteur les adresse par `"stmt:<préfixe>"`.
