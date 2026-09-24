# Composants partagés : HUD de session, écran de fin, cérémonies, icônes, grimoires

> Chargé quand on travaille dans `src/components/`. Le skill `add-module` renvoie ici pour le HUD et l'écran de fin.

### HUD de session (variante E, 2026-09-17/20)
Proto `prototypes/sessions/`, choix de Jérémy **E** (environnement de C + fil d'encre de D).
Pendant une manche : barre du haut (retour avec confirmation, fil d'encre, compteur ou minuteur),
bannière de combo, carte de réponse, bouton Next fixé en bas. Banc des vrais écrans :
`prototypes/sessions/real.html?sc=<module>` (voir son README pour la liste).
- **Pur** : `lib/sessionHud.js` (`COMBO_AT` 3·5·7·10·15·20, `streakOf`, `comboAt`, `segMarks`,
  `segDensity` : cases ≤ 15 Q, serrées ≤ 30, **barre continue au-delà** — les examens),
  testé par `tests/check_session_hud.cjs`. Hook `components/useSessionTrack.js`
  (`{results, record(ok|null), streak, combo, reset}`) : `record` s'appelle **depuis le
  gestionnaire de réponse** (un événement, donc un seul son en StrictMode).
- **Composants** (`components/SessionHud.jsx`) : `SessionTop {n, cur, results, groups?, aside?,
  sub?, count?, streak, onQuit, quitCopy?, onSheet?}`, `ComboBanner`, `AnswerCard {ok, answer?,
  timeout?, label?, why?, children}`, `NextBar {onNext, last?, label?, disabled?}`, `ListenDisc`.
- ⚠️ **Barre et pied sont en `position:fixed`** : ne JAMAIS les rendre dans un `.enter` ou un `.sk`
  (ils animent `transform`, et un `fixed` suit alors le bloc au lieu de l'écran). Les rendre à côté
  du contenu animé, dans un fragment ; une garde de dev l'avertit en console. `sticky` ne marche pas
  non plus sous `.app` (`overflow-y:auto`) — c'est ce qui rendait l'en-tête du Mock Test inerte.
- La présence de `.ss-top` **masque la tab bar** sur mobile (`.app:has(.ss-top)`, CSS pur, aucun
  état dans `App()`) : ne rendre `SessionTop` que pendant les questions, jamais sur une intro ni un
  écran de fin. Sur bureau (≥ 768 px) la barre latérale reste, et le HUD est décalé de `left:200px`.
- **Un module à minuteur** met le chrono dans `aside` (le compteur passe alors dans `sub`) et **fige**
  le décompte pendant la feuille « Leave this round? » via `onSheet` — sinon la question expire sous
  une fenêtre modale. Deux façons : `useState` + `paused` dans les deps de l'effet quand le minuteur
  est une chaîne de `setTimeout` (Irregular Crypt, Passive Forge), ou une **ref** lue dans le tick
  quand l'effet remet le minuteur à son maximum en se relançant (Audio Blitz, Sentence Builder,
  Particle Picker). Se tromper de façon remet le minuteur à neuf à chaque ouverture de la feuille.
- **Le compteur reste sur la question affichée.** Un module dont le compteur avance au clic (c'est le
  compteur du score : P3/P4, Part 6, Part 7) passe `cur={ph==="fb"?Math.max(0,n-1):n}`, sinon il saute
  une question sous les yeux de l'élève pendant le retour.
- **Groupes** : un module à conteneurs passe `groups` (tailles) — conversation P3/P4, talk, texte
  Part 6, passage Part 7, plateau de Modal Match — et le fil montre une coupure entre chacun.
- **Examens** (Mock, Boss, Endless) : marques **neutres**, pas de `useSessionTrack` du tout
  (`results={new Array(answered).fill(null)}`) — un examen ne dit rien avant la fin, et un combo
  sonore en plein Boss n'a aucun sens. Section dans `sub`, chrono en `aside`, `quitCopy` qui dit la
  vérité de l'épreuve (Boss et Endless reprennent dans la journée, un Mock non).
- **Clavier iOS** : un pied fixe passe derrière le clavier, qu'iOS ne déplace pas. Un module à saisie
  (Irregular Crypt) garde son bouton de validation **dans le flux**, sous les champs.
- **Rejouer sans remonter** (GerInf, Phrasal Dojo) : le `resetQuiz` interne appelle `track.reset()`,
  sinon le fil garde la manche précédente.
- **Fin sur minuteur** (temps écoulé) : la marque se pose dans un `useEffect([phase])` avec une ref
  garde, pas dans le tick (Sentence Builder ne marquait rien du tout avant le 2026-09-20).
- **Couvert** : Drill, chasse, 8 quiz, Listening P1-P4, Part 6, Part 7, Exam Simulation, Word Tavern,
  Audio Blitz, Clue Hunter, Sentence Builder, les 4 épreuves du Gauntlet, Modal Match et Sort, GerInf,
  les 2 modes de Phrasal Dojo, Mock, Boss, Endless. **Hors périmètre** : Speed Match et Word Fall (HUD
  et boucle d'animation propres), Duel, Flashcards, Battle Scan.

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

### Budget d'interruptions (2026-09-24)
Proto `prototypes/ceremony-budget/`, choix de Jérémy **B « une par retour »** (avant : jusqu'à 6 plein écran et
7 taps après une manche). `lib/interruptions.js` (pur, `tests/check_interruptions.cjs`) :
- **Écran de fin** : un seul plein écran, `sessionFullscreen(s)` = retournement > promotion. Avec les deux, la
  promotion devient une ligne du parchemin (`inlineLeague`), son coffre reste dans la liste. Le retournement
  n'attend l'Ascension que si elle a lieu (sinon il ne s'afficherait jamais). Jingle des trophées tu quand le
  retournement joue le sien.
- **`App()`** : une *entrée* = chaque arrivée sur Home racine (`homeEntry`). Au plus un plein écran non demandé par
  entrée : moment d'Aldric **de palier** (`MILESTONE_MOMENTS` : ligue, série, niveau, examens), puis la lettre du
  lundi. Une session à cérémonie (ou un examen à cérémonies) consomme l'entrée suivante (`spentNextRef`). Moments
  **contextuels** (Shop, Mentor, verdict, premier coffre) et **rediffusions** (`replayNarratorMoment`) hors budget.
  Le moment affiché est verrouillé (`narratorActive`) et la lettre aussi (`letterEntry`) : sans verrou, le budget
  qu'ils consomment les retirerait aussitôt. Compteurs doublés en refs (effets du même commit).
- Banc : `prototypes/victory/real.html?sc=promotion&turn=1`.

### Grimoire pattern (applies to Gauntlet + G&V grimoires)
- **Data format** per grimoire: `{id, title, subtitle, readingTime, icon, chapters: [{id, title, intro, blocks: [...]}]}`.
- **Block types** consumed by `<GrimoireReader/>`: `paragraph`, `heading`, `rule` (formula/label), `example` (en/fr/note), `trap` (red warning), `table` (headers+rows), `list`.
- **One idea per chapter** — mobile-readability rule. Repaginate dense chapters into short ones.
- **Grimoires stay in FR** (language policy: theory = FR for francophone learners, chrome = EN).
- **Replacing Study Mode**: when a G&V module has a Study Mode and theoretical content, replace the Study Mode entirely with a grimoire (GerInf + PhrasalDojo pattern). Don't keep both.
- **Reader component**: shared `<GrimoireReader grimoire={...} back={...}/>` + `renderGrimoireBlock` helpers. Parchment styling, CSS 3D flip animation, TOC drawer, roman numeral page numbers.
- **Page number placement**: the `.grim-page-num` must live INSIDE `.grim-page-content` with `margin-top:auto` (flex column with `min-height:100%`). Avoid `position:absolute;bottom:X` — it sticks to viewport, not content.

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
