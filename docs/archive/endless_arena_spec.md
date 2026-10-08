# Endless Arena — Spec d'implémentation

**Feature** : nouveau mode de test blanc rejouable post-Boss (remplace le concept "Random Practice Test" du prompt initial, nom finalisé "Endless Arena").

**Objectif pédagogique** : permettre aux étudiants qui ont vaincu The Final Arena de continuer à s'entraîner en conditions réelles TOEIC, avec du contenu pioché aléatoirement à chaque run et une **boucle pédagogique fermée** qui les renvoie automatiquement vers leur point faible après chaque run.

**Statut de ce document** : décisions UX, business et pédagogiques validées avec Jérémy. Claude Code a la main sur les détails d'implémentation (naming exact des composants/routes, structure précise du refactor Train, intégration avec `applyXpGates` selon les conventions existantes du code). Tous les mockups visuels ont été validés.

---

## 1. Contexte et architecture globale

### 1.1 Ce que fait l'Endless Arena

- Un test TOEIC complet de **200 questions sur 120 minutes**, généré aléatoirement depuis tout le pool existant (training + Boss)
- Parcours identique au Boss Test (Intro → P1 → P2 → P3 → P4 → P5 → P6 → P7 → Results)
- Scoring identique : Listening /495 + Reading /495 = /990 via `estimateToeic`
- **Débloqué uniquement après avoir vaincu The Final Arena avec un score ≥ 650/990**
- **Cooldown dur de 24h** entre deux tentatives
- Historique complet des runs conservé (pas seulement le best)
- Écran de résultats dédié avec recommandation pédagogique active

### 1.2 Placement dans la navigation

L'Endless Arena vit **dans le sous-écran Mock Exams**, aux côtés de Mock 1/2/3 et The Final Arena. Elle n'apparaît pas ailleurs dans l'app.

**Important** : dans la refacto Train, **The Final Arena migre depuis la main view de Train vers le sous-écran Mock Exams**. La page Train principale n'a plus de hero Boss Test en bas. À la place, elle a une hero Mock Exams en haut qui sert de porte d'entrée vers tout ce qui est "test blanc" (Mock 1/2/3 + Final Arena + Endless Arena).

### 1.3 Signature visuelle

L'Endless Arena utilise **le violet** (`var(--purple)` = `#8b5e83`, déjà dans le root CSS) comme couleur signature, en complément du brun/or de la DA existante. Le choix du violet répond à deux contraintes :

1. Différencier visuellement l'Endless Arena de The Final Arena (rouge dramatique) sans casser la DA
2. Éviter tout télescopage avec les skins cosmétiques existants (saphir, obsidienne, etc.) qui portent déjà leurs propres couleurs

**Lecture narrative** : si la Final Arena est le combat contre le dragon (rouge/conquête), l'Endless Arena est le sanctuaire post-combat (violet/mystique/récompense). C'est un "au-delà" accessible seulement aux vainqueurs.

**Icône signature** : emoji sablier `⏳` (évoque le temps suspendu, l'épreuve continue, et le timer 120min).

---

## 2. Règles métier

### 2.1 États de visibilité de l'Endless Arena

Fonction utility à créer (nom au choix, parallèle à `canUnlockBoss` / `canUnlockMock`) :

```js
// Retourne l'un de : "hidden" | "locked" | "cooldown" | "ready"
function getEndlessState(u) {
  // Pas de Boss complété → totalement cachée (pas même mentionnée dans l'UI)
  if (!u.mockResults || !u.mockResults.boss) return "hidden";

  // Boss complété mais score insuffisant → visible mais locked
  if (u.mockResults.boss.toeicEstimate < 650) return "locked";

  // Boss ≥ 650, check cooldown 24h
  var lastAttempt = u.mockResults.endless && u.mockResults.endless.lastAttempt;
  if (lastAttempt && (Date.now() - lastAttempt) < 24 * 60 * 60 * 1000) {
    return "cooldown";
  }

  return "ready";
}
```

Les 4 états correspondent à des rendus UI différents (cf. spec visuel).

### 2.2 Formule XP

**Jérémy a validé les règles suivantes, non négociables :**

1. **Base** : `Math.round(toeicEstimate * 1.5 * 0.7)` — le 0.7 est un coefficient anti-farming propre à l'Endless (l'Endless étant rejouable, on n'applique pas la même générosité que pour le Boss one-shot)
2. **Pas de diminishing returns par jour** — le cooldown 24h suffit comme anti-farming. Un étudiant ne fera pas 2 tests de 2h dans la même journée.
3. **Bonus New Personal Best** : **+500 XP flat** quand la run actuelle dépasse le best précédent. Généreux et volontaire : le PB est une milestone rare qui mérite d'être célébrée.

**Question ouverte pour Claude Code** : est-ce que le calcul XP passe par `applyXpGates` (avec `"endless"` comme module ID) ou est-il calculé manuellement en fin de run ? Dépend de la convention actuelle du code. Pas de diminishing returns pour l'Endless — juste le coefficient 0.7 et le cooldown 24h.

Exemple concret :
- Étudiant score 810 en 1ère run du jour, nouveau PB (précédent 785)
- Base : 810 × 1.5 × 0.7 = 850 (arrondi)
- PB bonus : +500
- **Total affiché : 1350 XP**

### 2.3 Personal Best

Le PB est **le meilleur score TOEIC /990 jamais atteint en Endless Arena**. Il est stocké dans `mockResults.endless.best` et mis à jour à chaque fin de run si dépassé.

Le PB bonus (+500 XP) s'applique uniquement si le score de la run actuelle est **strictement supérieur** au best précédent. En cas d'égalité, pas de bonus.

### 2.4 Cooldown

**24h glissantes** depuis la dernière tentative terminée (pas depuis le début de la run). Basé sur `mockResults.endless.lastAttempt` (timestamp ms).

Pendant le cooldown, l'Endless Arena est **visible** dans le sous-écran Mock Exams mais non cliquable, avec affichage du temps restant (ex: `ready in 14h`).

### 2.5 Gate message post-Boss

Quand le Boss est complété avec un score < 650, l'Endless Arena s'affiche en état `locked` avec le message :

> `Defeat the Final Arena with 650+ to unlock`

Et une **barre de progression** qui montre la position du score actuel par rapport au gate 650.

**Scaling de la barre** : utiliser la plage `(score - 200) / (650 - 200) * 100%` plutôt que `score / 650` pour éviter de surestimer la proximité du gate. Un étudiant avec 200 (minimum TOEIC) est à 0% de progression vers 650, pas à 31%.

Exemple : score Boss 580 → barre à `(580-200)/(650-200) = 380/450 = 84%`.

Message sous la barre : `So close · 70 points from glory` (ou variante dynamique : `X points from glory` où X = 650 - score_actuel).

---

## 3. Data model

### 3.1 Structure proposée pour `u.mockResults.endless`

```js
u.mockResults.endless = {
  attempts: 7,              // compteur total de runs terminées
  best: 810,                // meilleur score TOEIC /990
  bestDate: 1712745600000,  // timestamp du PB
  lastAttempt: 1712745600000, // pour le cooldown 24h (dernière run terminée)
  history: [                // array ordonné chronologiquement, oldest → newest
    {
      date: 1712659200000,    // timestamp de fin de run
      toeicEstimate: 810,     // score final /990
      listening: 420,         // score Listening /495
      reading: 390,           // score Reading /495
      weakestPart: 3,         // int 1-7, part avec l'accuracy la plus faible
      weakestAccuracy: 0.54   // float 0-1, pour affichage "54%"
    },
    // ... autres runs
  ]
}
```

**Décisions importantes** :

- `weakestPart` et `weakestAccuracy` sont **calculés en fin de run et stockés**, pas recalculés à l'affichage. Ça évite de stocker les réponses détaillées de chaque run (storage bloat pour 30+ runs).
- `history` est **ordonné du plus ancien au plus récent** (push à chaque fin de run).
- L'affichage de l'historique sur l'écran de résultats utilise les **7 dernières runs** (`history.slice(-7)`).
- Si l'étudiant a 20+ runs, les anciennes restent dans `history` pour le compteur `attempts` mais ne s'affichent pas. On pourra ajouter un bouton "view all runs" dans une future iteration.

### 3.2 Sauvegarde

Appel à `sv()` (pattern existant du projet) après chaque mise à jour de `mockResults.endless`.

---

## 4. Refactor du composant Train

### 4.1 Main view (page Train principale)

**Avant** : grille 2×2 de 4 tuiles (Exercises, Grammar & Vocab, Mock Exams, Tips & Strategy) + hero Boss Test en bas pleine largeur.

**Après** : hero Mock Exams pleine largeur en haut + grille Exercises/Grammar & Vocab/Tips & Strategy en dessous. **Plus de hero Boss Test en bas de Train** — elle migre dans le sous-écran Mock Exams.

**Changements précis** :

1. **Supprimer** la tuile "Mock Exams" de la grille (il en reste 3)
2. **Supprimer** tout le bloc hero Boss Test en bas de main view
3. **Ajouter** une nouvelle hero Mock Exams au-dessus de la grille (spec visuel §5)
4. **Réorganiser la grille** : Exercises + Grammar & Vocab côte à côte (row 1), Tips & Strategy en full-width (row 2, `grid-column: 1 / -1`)

### 4.2 Sub-view Mock Exams

**Avant** : liste verticale des 3 Mock Tests (Mock 1, 2, 3) avec cadenas de progression.

**Après** : les 3 Mock Tests suivis d'un séparateur "ULTIMATE TRIALS", puis la hero Final Arena (migrée depuis main view), puis la hero Endless Arena (si visible selon `getEndlessState`).

**Changements précis** :

1. **Garder** la liste des 3 Mock Tests telle quelle
2. **Ajouter** un séparateur "ULTIMATE TRIALS" (spec visuel §6)
3. **Ajouter** la hero Final Arena (reprendre le code existant de la main view de Train, le déplacer ici, aucun changement au rendu)
4. **Ajouter** la hero Endless Arena en dessous, **uniquement si** `getEndlessState(u) !== "hidden"`

### 4.3 Ce qu'il ne faut PAS toucher

- Les sub-views Exercises, Grammar & Vocab, Tips & Strategy : aucun changement
- Le composant `BossTest` : aucun changement (on crée un nouveau composant séparé pour l'Endless, on ne dérive pas du BossTest existant — bien qu'on puisse partager de la logique si Claude Code juge ça propre)
- Les routes existantes (sauf ajout de la nouvelle route Endless)
- La grille et le rendu des 3 Mock Tests dans le sub-view

---

## 5. Spec visuel — Écran 1 : Train tab (main view refactorée)

### 5.1 Structure globale

```
Training Grounds
Choose your battle

[Hero Mock Exams]  ← NOUVEAU, pleine largeur

[Exercises]  [Grammar & Vocab]  ← row 1 de la grille
[Tips & Strategy — full width]  ← row 2 de la grille
```

### 5.2 Hero Mock Exams — spec détaillée

**Conteneur** :
- Background : `linear-gradient(135deg, #1a1610, #28221a)`
- Border : `1.5px solid rgba(212,148,58,0.35)` (or à 35% alpha)
- Border-radius : 16px
- Padding : 16px
- Margin-bottom : 14px

**Header row** (icon + titre + flèche) :
- Badge icône 50×50 :
  - `border-radius: 14px`
  - `background: linear-gradient(135deg, #d4943a, #8b6020)`
  - Emoji `📜` en `font-size: 26px`
- Titre `MOCK EXAMS` :
  - Police : Cinzel, font-weight 800
  - `font-size: 16px`, `letter-spacing: 1.5px`
  - Couleur : `#f0c850` (var `--gold`)
- Sous-titre : `Real conditions · full tests` en 12px `#8a7e6a` (var `--t2`)
- Flèche `→` à droite en `#d4943a` (var `--cyan`)

**Pills row** (3 Mock Tests compacts) :
- Margin-top : 14px du header row
- Gap entre pills : 6px
- Chaque pill :
  - `font-size: 11px`, `padding: 3px 9px`, `border-radius: 99px`, `font-weight: 600`
  - État `completed` : `background: rgba(74,190,96,0.15)`, `color: #4abe60`, texte `✓ Mock N`
  - État `not done` : `background: rgba(255,255,255,0.05)`, `color: #5a5040`, texte `Mock N`

**Séparateur** (entre pills et event rows) :
- `height: 1px`
- `background: rgba(180,140,80,0.15)`
- Marges : `margin: 0 -4px 10px` (extend légèrement au-delà du padding pour effet "full-width")

**Event rows** (2 lignes pour Final Arena + Endless Arena) :

Chaque row a la structure :
- `display: flex; align-items: center; gap: 11px; padding: 7px 4px`
- Icône 19px (width 22px, text-align center)
- Titre en Cinzel 13px font-weight 700, couleur dépend de l'état
- Status à droite en 11px, couleur dépend de l'état

**Row Final Arena** :
- Icône : `🐉`
- Titre `Final Arena` en `#e8c88a` (crème dorée)
- Status text dynamique selon état :
  - Non complété : `awaiting · finish mocks` en `#8a7e6a`
  - Mocks faits, Final unlocked, pas jouée : `unlocked · enter →` en `#f0c850`
  - Complétée : `conquered · 785` (ou score réel) en `#4abe60` (vert)

**Row Endless Arena** (uniquement si `getEndlessState(u) !== "hidden"`) :
- Background row : `rgba(139,94,131,0.08)` (léger wash violet pour la différencier)
- Border-radius : 8px
- Margin : `2px -4px 0` (extend pour matcher le séparateur)
- Padding : `8px 4px 6px`
- Icône : `⏳`
- Titre `Endless Arena` en `#c8a8d4` (lavande)
- Status text dynamique selon état :
  - `locked` : `locked · requires 650+` en `#8a7e6a`
  - `ready` : `ready to enter` en `#b08aa8` (violet clair)
  - `cooldown` : `ready in Xh` en `#8a7e6a` (où X = heures restantes)

### 5.3 Grille 3 tuiles

Les 3 tuiles Exercises + Grammar & Vocab + Tips & Strategy gardent **strictement le style des tuiles existantes** (`className="crd"`, icon emoji 28px, titre en Cinzel out, etc.). La seule différence est la disposition :

```css
grid-template-columns: 1fr 1fr;
```

- Row 1 : Exercises (col 1) + Grammar & Vocab (col 2)
- Row 2 : Tips & Strategy avec `grid-column: 1 / -1` pour prendre toute la largeur

Note : sur la row 2 en full-width, on peut soit garder la hauteur d'une tuile normale (carrée) et laisser de l'espace vide à droite, soit passer sur un layout horizontal (icône grosse à gauche, titre + sub + count empilés). **Recommandation** : layout horizontal pour éviter l'effet "case qui traîne", avec icon 32px à gauche, titre + sub au milieu, count + flèche à droite. Claude Code juge selon ce qui rend le mieux dans le contexte du reste de Train.

---

## 6. Spec visuel — Écran 2 : Sub-view Mock Exams

### 6.1 Structure globale

```
← Training Grounds  (back button)

Mock Exams
Real conditions · full tests

[Mock Test 1 card]
[Mock Test 2 card]
[Mock Test 3 card]

─── ULTIMATE TRIALS ───

[Hero Final Arena]
[Hero Endless Arena]  ← si visible
```

### 6.2 Mock Test cards

**Aucun changement** par rapport au rendu actuel. Continuer d'utiliser le même pattern que dans le code existant (icon 42×42, bg gradient selon état, titre + description, cadenas/flèche à droite, opacity 0.4 si lock).

### 6.3 Séparateur "ULTIMATE TRIALS"

```
<div style="display: flex; align-items: center; gap: 10px; margin: 18px 0 12px;">
  <div style="flex: 1; height: 1px; background: #3a2a15;"></div>
  <div style="font-family: 'Cinzel', serif; font-size: 11px;
              color: #8a7e6a; letter-spacing: 2px;">ULTIMATE TRIALS</div>
  <div style="flex: 1; height: 1px; background: #3a2a15;"></div>
</div>
```

### 6.4 Hero Final Arena

**Reprendre intégralement le code existant** de la hero Boss Test actuellement en bas de main view Train, sans modification. Juste la déplacer ici dans le sub-view Mock Exams.

Pour rappel, son rendu :
- Border `1px solid rgba(220,38,38,0.5)`
- Background outer `linear-gradient(135deg, #1a0505, #2a0a0a)`
- Padding inner avec `linear-gradient(135deg, #2a0a0a, #3d1a00, #1a0800)`
- Dragon watermark `🐉` en fond (opacity 0.1, scaleX(-1))
- Badge 50×50 `linear-gradient(135deg, #dc2626, #f59e0b)` avec `🐉`
- Titre "THE FINAL ARENA" en text-gradient `#ff4444 → #ff8c42 → #ffd700`
- Pills Mock 1/2/3 avec colorisation verte selon completion
- Cadenas 🔒 ou flèche ➔ selon état

### 6.5 Hero Endless Arena

**Quatre états visuels** selon `getEndlessState(u)` :

**État `hidden`** : la hero n'est pas rendue du tout (return null). L'étudiant ne sait pas qu'elle existe.

**État `locked`** (Boss complété mais score < 650) :

Structure :
- Border : `1.5px solid rgba(139,94,131,0.4)`
- Background outer : `linear-gradient(135deg, #150f18, #1f1525)`
- Border-radius : 16px
- Padding inner avec `linear-gradient(135deg, #1f1528, #2a1a32, #15101c)`
- Padding : 18px 16px
- Sablier `⏳` watermark en fond (opacity 0.08, top: -6px, right: 14px, font-size 46px)

Header row :
- Badge 50×50 :
  - `border-radius: 14px`
  - `background: linear-gradient(135deg, #8b5e83, #5a3a5a)`
  - Emoji `⏳` en 24px, `opacity: 0.9`
- Titre `ENDLESS ARENA` :
  - Cinzel 900, `font-size: 16px`, `letter-spacing: 0.5px`
  - Text-gradient : `linear-gradient(90deg, #c8a8d4, #a878a0, #d4943a)` avec `-webkit-background-clip: text` + `background-clip: text` + `color: transparent`
- Sous-titre : `the arena never sleeps` en Cinzel italic 11px `#8a7e6a`
- Cadenas `🔒` à droite en 18px

Progress bar (dans le même conteneur, sous le header) :
- Margin-top : 14px
- Ligne labels `Your score` / `Gate` en 11px `#8a7e6a` (flex space-between)
- Ligne valeurs : score étudiant en Cinzel 14px `#c8a8d4` (lavande) / `650` en Cinzel 14px `#d4943a` (or)
- Barre : height 6px, background `rgba(139,94,131,0.18)`, border-radius 99px
- Fill : `linear-gradient(90deg, #8b5e83, #c8a8d4)`, width calculée = `((score - 200) / (650 - 200)) * 100%`
- Sous la barre : texte centré `So close · X points from glory` où X = 650 - score, en Cinzel italic 11px `#a878a0`

**État `ready`** (Boss ≥ 650, pas en cooldown) :

Structure identique à `locked` mais :
- Opacity globale de la carte : pas de réduction
- Remplacer le cadenas 🔒 par une flèche → en `#c8a8d4`
- **Supprimer la progress bar et le message "so close"**
- **Remplacer** par une ligne de stats compacte en dessous du header :
  - Format : `Runs: 7  ·  Best: 810  ·  Ready to enter`
  - Style : 11px, color `#8a7e6a` pour les labels et `#c8a8d4` pour les valeurs
  - Border-top séparateur `1px solid rgba(139,94,131,0.3)` au-dessus
  - Padding-top : 10px
- **Edge case first run** : si `attempts === 0`, afficher à la place `First run awaits · enter the sanctuary` en Cinzel italic 12px `#c8a8d4` centré

**État `cooldown`** (Boss ≥ 650, mais < 24h depuis dernière run) :

Identique à `ready` mais :
- La flèche à droite redevient un 🔒 (ou `⏳`) pour signaler non cliquable
- La ligne de stats devient : `Runs: 7  ·  Best: 810  ·  Ready in 14h 22m` (avec décompte dynamique)
- Opacity légèrement réduite : 0.75

---

## 7. Spec visuel — Écran 3 : Écran de résultats post-run

### 7.1 Route et navigation

Nouvelle phase dans le composant Endless Arena, affichée à la fin de la run (après le calcul du score et la sauvegarde dans `mockResults.endless`).

### 7.2 Structure globale

```
← ⏳ Endless Arena  (breadcrumb retour)

⭐ NEW PERSONAL BEST ⭐         (banner, si applicable)
+25 vs previous best

[Big Score Card]
RUN #7 · COMPLETE
    810
   / 990
[Listening 420/495]  [Reading 390/495]

[XP Earned Card]
XP EARNED              +1350
base 850 + PB bonus 500

[Progression History Card]
PROGRESSION · LAST 7 RUNS
Run 1 ████░░ 640
Run 2 █████░ 720
Run 3 █████░ 715
Run 4 ██████ 765
Run 5 █████░ 740
Run 6 ██████ 765
Run 7 ██████ 810 ← highlighted violet

[Weakest Recommendation Card]
WEAKEST THIS RUN
🎧 Part 3 · Conversations
54% accuracy — train this next

[Primary button — violet-free, doré]
🎧 TRAIN PART 3 NOW →

[Secondary button — outline neutre]
Back to the training grounds

[Cooldown hint — discret sous secondary]
⏳ Next Endless run available in 24h
```

### 7.3 Edge cases d'affichage

**Première run (`attempts === 1`, pas d'historique préalable)** :

- **Pas de PB banner** (pas de "previous best" à battre)
- **À la place, affiche** un banner similaire mais avec wording différent :
  ```
  ⭐ FIRST RUN COMPLETE ⭐
  Welcome to the Endless Arena
  ```
- **Pas de bloc "PROGRESSION · LAST 7 RUNS"** (il n'y a qu'une seule run)
- **À la place**, un bloc minimaliste :
  ```
  PROGRESSION
  Your first Endless run · come back tomorrow to see your progress
  ```
- Tout le reste (score hero, XP, weakest recommendation, boutons) reste identique

**PB bonus +500 non applicable** (score ≤ best précédent) :

- **Pas de banner PB** (conteneur invisible)
- XP Earned affiche juste la base sans breakdown PB : `XP EARNED +850 base`
- Le reste identique

**Weakness tie-breaker** (deux parts à égalité parfaite d'accuracy) :

Appliquer la règle **Listening first** : si Part 3 et Part 5 sont toutes deux à 54% pile, on recommande Part 3. La raison est documentée dans la mémoire projet : *"Listening module engagement is chronically near-zero and requires active intervention"*. La reco doit pousser vers la Listening en priorité.

Implémentation concrète du tie-breaker :

```js
var partAccuracies = { 1: acc1, 2: acc2, 3: acc3, 4: acc4, 5: acc5, 6: acc6, 7: acc7 };
var weakestPart = Object.keys(partAccuracies).reduce(function(a, b) {
  // Si égalité d'accuracy, prioriser la Listening (parts 1-4) sur la Reading (parts 5-7)
  if (partAccuracies[a] === partAccuracies[b]) {
    if (a <= 4 && b > 4) return a;
    if (b <= 4 && a > 4) return b;
    return a; // égalité dans le même groupe, prendre le plus petit numéro
  }
  return partAccuracies[a] < partAccuracies[b] ? a : b;
});
```

### 7.4 Spec visuel détaillée par bloc

**Breadcrumb retour** :
- `font-size: 13px`, color `#8a7e6a`, `margin-bottom: 14px`
- Contenu : `← ⏳ Endless Arena` (le ← en icon et l'Endless Arena en Cinzel)

**PB Banner** (visible si `isNewPB === true`) :
- Background : `linear-gradient(135deg, #3a2810 0%, #2a1a2a 50%, #3a2810 100%)` (or → violet → or pour célébrer l'union des deux univers)
- Border : `1.5px solid #f0c850`
- Border-radius : 12px
- Padding : 11px 14px
- Margin-bottom : 14px
- Text-align : center
- Ligne 1 : `⭐ NEW PERSONAL BEST ⭐` en Cinzel 900, 13px, `#f0c850`, letter-spacing 2px
- Ligne 2 : `+25 vs previous best` (delta dynamique) en 11px `#c8a8d4`, margin-top 3px

**Score Hero Card** :
- Background : `linear-gradient(135deg, #1a1610, #221a26)`
- Border : `1px solid rgba(139,94,131,0.25)`
- Border-radius : 16px
- Padding : 22px 16px 18px
- Text-align : center
- Watermark `⏳` en fond : position absolute, top -4px, right 10px, font-size 46px, opacity 0.06
- Label `RUN #7 · COMPLETE` en Cinzel 11px `#8a7e6a`, letter-spacing 2px, margin-bottom 6px
- Score énorme :
  - Cinzel 900, `font-size: 56px`, `line-height: 1`
  - Text-gradient : `linear-gradient(180deg, #f0c850, #d4943a)` (or brillant en haut, or sombre en bas)
  - `-webkit-background-clip: text` + fallback
- À droite du score, `/ 990` en Cinzel 16px `#8a7e6a` (aligné baseline)
- En dessous, deux mini-cards split L/R :
  - Flex row, gap 8px, margin-top 16px
  - Chaque card : background `rgba(180,140,80,0.08)`, border-radius 10px, padding 10px 8px
  - Label `LISTENING` / `READING` en 11px `#8a7e6a`, letter-spacing 0.5px
  - Valeur en Cinzel 800, 18px `#ede4d4`, avec suffix `/ 495` en 11px `#5a5040`

**XP Earned Card** :
- Background : `#1a1610` (var `--bg2`)
- Border : `1px solid rgba(180,140,80,0.12)`
- Border-radius : 12px
- Padding : 12px 16px
- Margin-bottom : 14px
- Layout : flex row space-between
- Gauche : label `XP EARNED` en 11px `#8a7e6a` + breakdown `base 850 + PB bonus 500` en 11px `#5a5040`
- Droite : `+1350` en Cinzel 900, 22px `#f0c850`

**Progression History Card** :
- Background : `#1a1610`
- Border : `1px solid rgba(180,140,80,0.12)`
- Border-radius : 12px
- Padding : 14px 16px
- Margin-bottom : 14px
- Titre `PROGRESSION · LAST 7 RUNS` en Cinzel 11px `#8a7e6a`, letter-spacing 2px, margin-bottom 12px

Rows (une par run, `display: flex; gap: 10px; align-items: center`) :
- Label `Run N` en Cinzel 11px, width 38px :
  - Run actuelle (la plus récente) : color `#c8a8d4` font-weight 700
  - Runs précédentes : color `#5a5040`
- Barre (flex: 1, height: 8px, border-radius: 99px) :
  - Background track : `rgba(180,140,80,0.08)` pour runs passées, `rgba(139,94,131,0.15)` pour run actuelle
  - Fill width : `((score - 500) / (990 - 500)) * 100%` (scaling sur 500-990 pour éviter écrasement)
  - Fill color :
    - Runs passées : couleur or dégradée selon le score (`#5a4225` pour score < 700, `#8b6020` pour 700-749, `#a07028` pour 750+)
    - Run actuelle : `linear-gradient(90deg, #8b5e83, #c8a8d4)` (dégradé violet)
- Score à droite, width 32px, text-align right, 11px font-weight 600 :
  - Runs passées : color `#8a7e6a`
  - Run actuelle : color `#c8a8d4` font-weight 700

**Weakest Recommendation Card** :
- Background : `linear-gradient(135deg, #1a1420, #221828)`
- Border : `1.5px solid rgba(139,94,131,0.35)`
- Border-radius : 12px
- Padding : 14px 16px
- Margin-bottom : 16px
- Titre `WEAKEST THIS RUN` en Cinzel 11px `#a878a0`, letter-spacing 2px, margin-bottom 10px
- Body row (flex, gap 12px, align-items center) :
  - Badge 42×42, border-radius 12px, background `rgba(139,94,131,0.2)`, font-size 22px, icon emoji selon part (cf. §9)
  - Texte :
    - Ligne 1 : `Part 3 · Conversations` en Cinzel 700, 14px `#ede4d4`
    - Ligne 2 : `54% accuracy — train this next` en 11px `#e05252` (var `--red`) font-weight 600

**Primary Button** :
- Width 100%, padding 14px
- Background : `linear-gradient(135deg, #d4943a, #8b6020)` (doré standard app)
- Border : none
- Border-radius : 12px
- Font-family : Cinzel 800
- Font-size : 13px
- Color : `#0f0c08` (brun très foncé, contraste avec l'or)
- Letter-spacing : 1px
- Margin-bottom : 10px
- Texte dynamique : `🎧 TRAIN PART 3 NOW →` où l'icône et le numéro changent selon la weakest part. Voir §9 pour le mapping.

**Secondary Button** :
- Width 100%, padding 12px
- Background : transparent
- Border : `1px solid rgba(180,140,80,0.25)`
- Border-radius : 12px
- Font-family : DM Sans 600
- Font-size : 13px
- Color : `#8a7e6a` (var `--t2`)
- Margin-bottom : 16px
- Texte : `Back to the training grounds`
- Action : retour à la page Train principale (navigate to `train` tab / sub-view racine)

**Cooldown Hint** (discret, sous le secondary button) :
- Text-align : center
- Font-size : 11px
- Color : `#5a5040` (var `--t3`)
- Margin-bottom : 16px
- Contenu : `⏳ Next Endless run available in 24h`
- Note : toujours affiché après une run (le cooldown est automatiquement activé par la fin de la run)

---

## 8. Génération aléatoire du test

Cette partie reprend le contenu technique du prompt initial `prompt_random_practice_tests.md` de Jérémy, adapté à l'Endless Arena.

### 8.1 Structure TOEIC à respecter

| Part | Nb items | Q/item | Total Q | Pool source |
|------|----------|--------|---------|-------------|
| P1 | 6 photos | 1 | 6 | `LISTENING_P1` (43 items) + `BOSS_P1` (6 items) |
| P2 | 25 items | 1 | 25 | `LISTENING_P2` (75 items) + `BOSS_P2` (25 items) |
| P3 | 13 convos | 3 | 39 | `LISTENING_P3` (30 items) + `BOSS_P3` (13 items) |
| P4 | 10 talks | 3 | 30 | `LISTENING_P4` (30 items) + `BOSS_P4` (10 items) |
| P5 | 30 phrases | 1 | 30 | `QUESTIONS` (grammar.js, 523 items) + `BOSS_P5` (30 items) |
| P6 | 4 textes | 4 blanks | 16 | `PART6_TEXTS` (20 items) + `BOSS_P6` (4 items) |
| P7 | 15 passages | 3-4 | ~54 | `PART7_PASSAGES` (24 items) + `BOSS_P7` (15 items) |

**Total visé : ~200 questions**, identique au Boss Test.

### 8.2 Fonction `generateEndlessTest()`

Doit :

1. **Merger training + boss pour chaque part** (spread ou concat, peu importe)
2. **Piocher aléatoirement** le nombre d'items requis pour chaque part (Fisher-Yates shuffle puis slice)
3. **Shuffler les options** de chaque question via un passage second par Fisher-Yates (en préservant la correspondance `correct` index)
4. **Retourner un objet structuré** avec les 7 arrays, prêt à être consommé par le composant `EndlessArena`

**⚠️ Attention aux formats de données divergents entre parts** :

- **P1, P2** : champ `opts` + `c` (index de la bonne réponse), champ `x` pour l'explication
- **P3, P4** : structure imbriquée avec `lines`/`text` + array `qs` de questions, chaque question ayant `opts` + `c`
- **P5 (grammar.js)** : champ `o` (PAS `opts`) + `c`, champ `s` (PAS `q`), champ `cat` pour la catégorie
- **P6** : structure `parts` avec alternance `{text}` et `{blank: true, options, correct}`. Champ **`options`** et **`correct`** (PAS `opts`/`c`)
- **P7** : champ `text` + array `questions` avec **`options`** et **`correct`** (PAS `opts`/`c`)

Le shuffling des options doit gérer ces variations de naming.

### 8.3 Audio paths

Les items P1-P4 ont leurs MP3 dans deux emplacements selon leur origine :

- Items training : `/audio/p1/`, `/audio/p2/`, `/audio/p3/`, `/audio/p4/`
- Items boss : `/audio/boss/p1_XX_Y.mp3`, `/audio/boss/p2_XX_q.mp3`, etc.

**Le composant `EndlessArena` doit construire le bon path selon le préfixe de l'id** de l'item (ex: `bp1_` préfixe boss vs `p1_` préfixe training).

### 8.4 Composant `EndlessArena`

**Approche recommandée** : cloner la structure du composant `BossTest` existant (mêmes phases, même timer, même flow) mais :

- Utiliser les arrays générés par `generateEndlessTest()` au lieu de `BOSS_P1` etc.
- Écran de résultats customisé (cf. §7)
- Formule XP différente (cf. §2.2)
- Sauvegarde dans `mockResults.endless` (cf. §3.1) au lieu de `mockResults.boss`
- Ajouter le calcul `weakestPart` / `weakestAccuracy` en fin de run
- Ajouter la gestion du PB et du bonus XP

**Le composant `BossTest` ne doit PAS être modifié**. L'Endless vit en parallèle.

**Session persistence** : comme le `BossTest` a déjà une logique de restauration de session via localStorage (`BOSS_STORAGE_KEY`), l'Endless devrait avoir son propre équivalent (`ENDLESS_STORAGE_KEY`) pour permettre à un étudiant de reprendre une run interrompue (ex: fermeture accidentelle de l'app). Ça matche le pattern existant.

---

## 9. Mapping part faible → module de recommandation

Tableau validé par Jérémy, à utiliser pour :
- Le texte du bloc "Weakest This Run" sur l'écran de résultats
- L'action du bouton primary "TRAIN PART X NOW →"

| Part | Label affiché | Icône | Module cible | ID nav |
|------|--------------|-------|--------------|--------|
| 1 | `Part 1 · Photos` | 🖼️ | Listening Part 1 | `lisP1` |
| 2 | `Part 2 · Q&R` | 🎧 | Listening Part 2 | `lisP2` |
| 3 | `Part 3 · Conversations` | 💬 | Listening Part 3 | `lisP3` |
| 4 | `Part 4 · Talks` | 📢 | Listening Part 4 | `lisP4` |
| 5 | `Part 5 · Grammar` | 📝 | Part 5 Drill | `drill` |
| 6 | `Part 6 · Text completion` | 📄 | Part 6 | `p6` |
| 7 | `Part 7 · Reading` | 📖 | Part 7 Reading | `p7` |

**Action du bouton primary** : appel à `nav(ID)` (pattern existant dans le code) qui route vers le module correspondant.

**Wording du bouton primary** : `{icône} TRAIN PART {N} NOW →` où `{icône}` et `{N}` sont dynamiques. Exemples :
- Part 3 faible : `💬 TRAIN PART 3 NOW →`
- Part 5 faible : `📝 TRAIN PART 5 NOW →`

Note : les IDs de navigation (`lisP1`, `drill`, etc.) sont ceux que j'ai retrouvés dans l'audit du code actuel. Claude Code doit **vérifier** qu'ils correspondent aux routes `sp` actuelles et corriger si besoin.

---

## 10. Edge cases à gérer

### 10.1 Génération random qui retombe sur un item avec le même id entre training et boss

Peu probable (les préfixes sont différents : `p1_01` vs `bp1_01`) mais vérifier que le merge des pools ne cause pas de collision d'id. Si collision, préférer la version boss (généralement de meilleure qualité).

### 10.2 Étudiant avec 0 run qui voit l'écran de résultats

Impossible puisque l'écran de résultats n'apparaît qu'après une run terminée. Mais la **première run** elle-même doit afficher le bloc "FIRST RUN COMPLETE" (cf. §7.3).

### 10.3 Étudiant avec 50+ runs

Le champ `mockResults.endless.history` continue de grossir. Pour éviter le storage bloat, on peut **tronquer à 50 runs** (garder les 50 dernières). Le compteur `attempts` reste le total absolu, non tronqué. L'affichage continue de montrer les 7 dernières.

### 10.4 Cooldown et changement de timezone

Un étudiant qui change de fuseau horaire (ou manipule la date de son device) pourrait bypasser le cooldown 24h. Comme le cooldown est basé sur `Date.now()` (UTC timestamp), c'est robuste au changement de timezone mais pas à la manipulation de l'horloge système. **Acceptable** : si un étudiant va jusqu'à trafiquer son horloge pour farmer de l'XP Endless, le coefficient 0.7 limite déjà le gain. Le jeu n'en vaut pas la chandelle pour 2h de test.

### 10.5 Run interrompue (app fermée avant la fin)

Gérée via le storage de session comme pour le Boss Test (cf. §8.4). La reprise de run doit fonctionner au réveil de l'app.

### 10.6 Score pile 650 au Boss Test

Le gate est `>= 650`. Donc 650 pile = unlock. Le message "So close" ne doit jamais s'afficher pour un étudiant à 650 ou plus.

### 10.7 Égalité parfaite entre plusieurs parts pour le weakest

Cf. §7.3, appliquer la règle Listening first.

### 10.8 Étudiant en groupe visitor (freemium)

L'Endless Arena doit respecter la logique `visitorLocked` existante si applicable. **Question à Claude Code** : est-ce que l'Endless Arena fait partie du tier premium (donc lockée pour les visiteurs freemium) ou est-ce qu'elle est accessible à tout étudiant qui a vaincu le Boss ? **Décision par défaut** : premium uniquement. Un visiteur freemium qui réussirait miraculeusement à vaincre le Boss verrait quand même l'Endless comme locked avec message "Arena Premium" (pattern existant).

---

## 11. Out of scope (ce qu'on ne code PAS dans cette itération)

- ❌ **Animation de déblocage de l'Endless Arena** quand le Boss est vaincu avec ≥ 650 pour la première fois (discutée dans la conversation mais reportée à plus tard)
- ❌ **Page dédiée "View all runs"** avec l'historique complet (on se contente des 7 dernières dans l'écran de résultats)
- ❌ **Achievements liés à l'Endless Arena** (ex: "Complete 10 Endless runs", "Score 850+ in Endless") — à ajouter dans un second temps
- ❌ **Leaderboard Endless** spécifique (le XP total suit déjà la league générale, suffisant pour l'instant)
- ❌ **Notifications push** de rappel "Endless ready" après les 24h de cooldown (peut-être plus tard)
- ❌ **IA Arena** (projet sibling, sans rapport avec cette feature)

---

## Appendix A — Palette couleurs utilisée

### Variables CSS existantes à réutiliser
- `--bg` = `#0f0c08` (fond page)
- `--bg2` = `#1a1610` (surface cartes)
- `--bg3` = `#28221a` (hover/locked)
- `--cyan` = `#d4943a` (or principal, malgré le nom)
- `--gold` = `#f0c850` (or clair highlights)
- `--green` = `#4abe60`
- `--red` = `#e05252`
- `--purple` = `#8b5e83` ← **signature Endless Arena**
- `--t1` = `#ede4d4` (crème texte principal)
- `--t2` = `#8a7e6a` (taupe texte secondaire)
- `--t3` = `#5a5040` (brun texte muet)
- `--bdr` = `rgba(180,140,80,0.08)` (border subtile or)

### Couleurs additionnelles spécifiques à l'Endless (hex inline, pas de var)
- **Lavande clair** : `#c8a8d4` (titre Endless Arena, valeurs highlighted dans historique et progress)
- **Violet moyen** : `#a878a0` (sous-titres italic "so close", "first run", etc.)
- **Violet sombre borders** : `rgba(139,94,131,0.35)` à `rgba(139,94,131,0.4)`
- **Violet wash subtil** : `rgba(139,94,131,0.08)` (row Endless dans hero Mock Exams)
- **Violet progress bar track** : `rgba(139,94,131,0.15)` à `rgba(139,94,131,0.18)`
- **Gradients backgrounds Endless hero** : `linear-gradient(135deg, #150f18, #1f1525)` outer, `linear-gradient(135deg, #1f1528, #2a1a32, #15101c)` inner
- **Gradient badge Endless** : `linear-gradient(135deg, #8b5e83, #5a3a5a)`
- **Gradient titre Endless Arena** : `linear-gradient(90deg, #c8a8d4, #a878a0, #d4943a)`
- **Gradient PB banner** : `linear-gradient(135deg, #3a2810 0%, #2a1a2a 50%, #3a2810 100%)` (or → violet → or)
- **Gradient fill run actuelle dans historique** : `linear-gradient(90deg, #8b5e83, #c8a8d4)`

---

## Appendix B — Wording exact (à reproduire à la lettre)

### Titres et labels
- Hero Mock Exams titre : `MOCK EXAMS`
- Hero Mock Exams sous-titre : `Real conditions · full tests`
- Séparateur sub-view : `ULTIMATE TRIALS`
- Titre Endless Arena : `ENDLESS ARENA`
- Tagline Endless Arena : `the arena never sleeps`
- Label post-run score : `RUN #N · COMPLETE`
- Label XP : `XP EARNED`
- Label historique : `PROGRESSION · LAST 7 RUNS`
- Label weakness : `WEAKEST THIS RUN`

### Messages d'état Endless
- État locked (sub-view Mock Exams) : progress bar labels `Your score` / `Gate`, message `So close · X points from glory` où X = 650 - score
- État ready : ligne stats `Runs: N  ·  Best: NNN  ·  Ready to enter`
- État ready first run : `First run awaits · enter the sanctuary`
- État cooldown : `Ready in Xh Ym`
- Gate lock requirement : `locked · requires 650+`

### Messages hero Mock Exams (row Final + row Endless)
Cf. §5.2 pour la liste complète des états dynamiques.

### Boutons écran de résultats
- Primary : `{icône} TRAIN PART {N} NOW →`
- Secondary : `Back to the training grounds`
- Cooldown hint sous secondary : `⏳ Next Endless run available in 24h`

### Banners
- PB banner : `⭐ NEW PERSONAL BEST ⭐` + sous-titre `+N vs previous best` (N = delta)
- First run banner : `⭐ FIRST RUN COMPLETE ⭐` + sous-titre `Welcome to the Endless Arena`
- First run history bloc : `Your first Endless run · come back tomorrow to see your progress`

### Weakness recommendation
- Ligne 1 : `Part N · {label}` (cf. tableau §9)
- Ligne 2 : `X% accuracy — train this next`

---

## Priorité d'implémentation suggérée

Si Claude Code doit fragmenter le travail en plusieurs commits ou sessions, voici un ordre recommandé :

1. **Fonctions utilities** : `getEndlessState(u)`, `generateEndlessTest()`, `calculateWeakestPart(partAccuracies)` avec tie-breaker Listening-first
2. **Data model** : migration éventuelle de la structure `mockResults` pour accueillir `.endless`, fonction de hydratation si pas encore présent
3. **Composant `EndlessArena`** : clone fonctionnel du `BossTest` avec le bon pool, bonne formule XP, bonne sauvegarde
4. **Écran de résultats post-run** : nouvelle phase dans le composant `EndlessArena`, avec tous les blocs de §7
5. **Refactor `Train` main view** : suppression tuile Mock Exams, ajout hero Mock Exams, réorganisation grille, suppression hero Boss Test du bas
6. **Refactor `Train` sub-view Mock Exams** : ajout séparateur, ajout hero Final Arena (migrée), ajout hero Endless Arena (4 états)
7. **Routing** : nouvelle route `sp === "endless"` (ou nom équivalent) qui rend `<EndlessArena />`
8. **Tests manuels** : vérifier les 4 états de l'Endless, vérifier la recommandation weakness pour chaque part, vérifier le PB bonus, vérifier le cooldown

---

## Checklist de validation (pour Jérémy post-implémentation)

- [ ] L'Endless Arena est totalement invisible tant que le Boss n'est pas complété
- [ ] Après Boss complété avec score < 650 : Endless visible en locked avec progress bar 84% et message "So close · X points from glory"
- [ ] Après Boss complété avec score ≥ 650, première fois : Endless visible en ready avec tagline "First run awaits · enter the sanctuary"
- [ ] Après première run Endless : écran de résultats avec banner "FIRST RUN COMPLETE", pas d'historique, mais tout le reste présent
- [ ] Après 2+ runs : historique des N dernières runs affiché avec la run actuelle highlighted en violet, scaling barres sur 500-990
- [ ] PB banner apparaît uniquement si score strictement > best précédent
- [ ] XP formula : `toeic × 1.5 × 0.7` + `+500 si PB` + diminishing returns daily
- [ ] Bouton primary "TRAIN PART X NOW" route vers le bon module selon weakest part
- [ ] Tie-breaker : égalité parfaite entre Part 3 et Part 5 → reco Part 3 (Listening first)
- [ ] Cooldown 24h : après fin d'une run, Endless en état cooldown pendant 24h dans sub-view Mock Exams, avec décompte
- [ ] Cooldown hint visible en petit sous le secondary button de l'écran de résultats
- [ ] Refactor Train : plus de hero Boss Test dans main view, hero Mock Exams ajoutée en haut, Tips & Strategy en row full-width
- [ ] Sub-view Mock Exams : les 3 Mocks + séparateur "ULTIMATE TRIALS" + Final Arena + Endless Arena (selon état)
- [ ] Aucune modification sur `BossTest`, sub-views Exercises/Grammar/Tips, ou structures data existantes autres que `mockResults.endless`

---

**Fin du spec. Bonne implémentation à toi, Claude Code.** 🗡️
