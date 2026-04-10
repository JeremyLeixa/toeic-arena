# Prompt — Implémentation des Random Practice Tests (TOEIC Arena)

## Objectif

Implémenter un mode **"Random Practice Test"** : des tests TOEIC complets de 2 heures (200 questions, 7 parts), générés aléatoirement à partir du pool de contenu existant. Ce mode est débloqué **après avoir battu le Boss Test** (The Final Arena).

L'objectif pédagogique : permettre aux étudiants à l'aise mais pas encore suffisamment de continuer à s'entraîner en conditions réelles, avec du contenu varié à chaque tentative.

---

## Architecture existante à connaître

### Stack & structure
- **Monolithique** : tout vit dans `src/App.jsx` (~9 400 lignes). Composants, state, CSS inline, routing — tout dans un seul fichier.
- **CSS** : variable `CSS` (template literal) en haut de App.jsx. Classes `.crd`, `.btn1`, `.btn2`, etc.
- **Routing** : variable `sp` (subpage). Ex: `if(sp==="boss"){playBGM("bgm_final");return pg(<BossTest .../>);}`
- **Data** : fichiers `src/data/*.js`, importés au build. Pas de fetch dynamique.

### Le Boss Test existant (modèle à suivre)
Le Random Practice Test doit reproduire **exactement le même flow** que le Boss Test, mais avec du contenu pioché aléatoirement.

**Composant** : `BossTest(p)` (ligne ~3384)
**Route** : `sp==="boss"`
**Flow** : Intro → P1 → P2 → P3 → P4 → P5 → P6 → P7 → Results
**Timer** : 120 min (7200s), auto-submit à 0
**Scoring** : Listening /495 + Reading /495 = /990 via `estimateToeic(raw, total)`
**XP** : `Math.round(toeicEstimate * 1.5)` + bonus (+200 si ≥800, +100 si ≥600)

**Data aliases dans BossTest** :
```js
var LP1 = BOSS_P1, LP2 = BOSS_P2, LP3 = BOSS_P3, LP4 = BOSS_P4;
var RP5 = BOSS_P5, RP6 = BOSS_P6, RP7 = BOSS_P7;
```

### Structure TOEIC (200 questions)
| Part | Nb items | Questions/item | Total Qs | Source data |
|------|----------|---------------|----------|-------------|
| P1 | 6 photos | 1 | 6 | `LISTENING_P1` (43 items) + `BOSS_P1` (6 items) |
| P2 | 25 items | 1 | 25 | `LISTENING_P2` (75 items) + `BOSS_P2` (25 items) |
| P3 | 13 convos | 3 | 39 | `LISTENING_P3` (30 items) + `BOSS_P3` (13 items) |
| P4 | 10 talks | 3 | 30 | `LISTENING_P4` (30 items) + `BOSS_P4` (10 items) |
| P5 | 30 phrases | 1 | 30 | `QUESTIONS` (grammar.js, 523 items) + `BOSS_P5` (30 items) |
| P6 | 4 textes | 4 blanks | 16 | `PART6_TEXTS` (20 items) + `BOSS_P6` (4 items) |
| P7 | ~8 passages | 3-4 | ~54 | `PART7_PASSAGES` (24 items) + `BOSS_P7` (15 items) |

### Pool de contenu (imports existants, ligne ~28 de App.jsx)
```js
import { LISTENING_P1, LISTENING_P2, LISTENING_P3, LISTENING_P4 } from "./data/listening.js";
import { QUESTIONS } from "./data/grammar.js";
import { PART6_TEXTS } from "./data/part6.js";
import { PART7_PASSAGES } from "./data/part7.js";
import { BOSS_P1, BOSS_P2, BOSS_P3, BOSS_P4, BOSS_P5, BOSS_P6, BOSS_P7 } from "./data/bossTestFull.js";
```

### Formats des données par part

**P1** (photo + 4 statements audio, blind) :
```js
{id:"p1_01", img:"/images/p1/p1_01.png", c:1, opts:["stmt A","stmt B","stmt C","stmt D"], x:"..."}
```

**P2** (audio question + 3 réponses, blind) :
```js
{id:"p2_01", audio:"/audio/p2/p2_01_q.mp3", opts:["A","B","C"], c:0, x:"..."}
```

**P3** (conversation + 3 questions écrites) :
```js
{id:"p3_01", lines:[{s:"W",t:"..."},{s:"M",t:"..."},...],
  qs:[{q:"...",opts:["A","B","C","D"],c:1}, ...]}
```

**P4** (monologue + 3 questions écrites) :
```js
{id:"p4_01", type:"Voicemail", voice:"W",
  text:"Full monologue...",
  qs:[{q:"...",opts:["A","B","C","D"],c:1}, ...]}
```

**P5** (grammar, format QUESTIONS) :
```js
{id:"g1", s:"The report _____ yesterday.", o:["was submitted","submitted","submitting","submit"], c:0, x:"...", cat:"Passive Voice"}
```
⚠️ Attention : champ `o` (pas `opts`), champ `s` (pas `q`)

**P6** (texte à trous, 4 blanks par texte) :
```js
{id:"p6t1", type:"Email", from:"...", to:"...", subject:"...",
  parts:[
    {text:"paragraph..."},
    {blank:true, options:["correct","wrong1","wrong2","wrong3"], correct:0, x:"..."},
    ...
  ]}
```
⚠️ Champs `options` et `correct` (pas `opts`/`c`)

**P7** (passage + 3-4 questions) :
```js
{id:"p7p1", type:"Email", text:"Full passage...",
  questions:[{q:"...", options:["A","B","C","D"], correct:0, x:"..."}]}
```
⚠️ Champs `options` et `correct` (pas `opts`/`c`)

### Audio (P1-P4 uniquement)
```
P1 : public/audio/p1/{id}_{0-3}.mp3
P2 : public/audio/p2/{id}_q.mp3 + {id}_{0-2}.mp3
P3 : public/audio/p3/{id}.mp3 (stitched)
P4 : public/audio/p4/{id}.mp3
Boss : public/audio/boss/p1_XX_Y.mp3, p2_XX_q.mp3, p3_XX.mp3, p4_XX.mp3
```

### Shuffle des options (déjà en place)
- **P6** : `useMemo` avec Fisher-Yates shuffle sur les 4 options de chaque blank (ligne ~3112)
- **P7** : `useMemo` avec Fisher-Yates shuffle sur les 4 options de chaque question via `shuffledQMap` (ligne ~3222)
- **P5/grammar** : les options sont shufflées dans le composant Drill existant

Le Random Practice Test doit **aussi shuffler les options** pour toutes les parts.

---

## Ce qu'il faut implémenter

### 1. Fonction de génération aléatoire du test

Créer une fonction `generateRandomTest()` qui :
- Pioche aléatoirement dans **tout le pool** (training + boss) pour chaque part
- Respecte les quotas TOEIC : 6 P1, 25 P2, 13 P3, 10 P4, 30 P5, 4 P6, suffisamment de P7 pour ~54 questions
- Shuffle les items sélectionnés
- Shuffle les options de chaque question (Fisher-Yates)
- Retourne un objet structuré avec les 7 arrays

### 2. Composant `RandomTest(p)`

- **Copier la structure du `BossTest`** : même flow (intro → P1-P7 → results), même timer 120 min, même transitions entre parts
- Mais au lieu d'utiliser `BOSS_P1`, etc., utiliser les arrays générés par `generateRandomTest()`
- Même UI de scoring avec Listening /495 + Reading /495
- Même calcul XP (ou réduit, à voir — suggestion : même formule mais avec un coefficient 0.7 pour éviter le farming)

### 3. Conditions de déblocage

- **Prérequis** : `u.mockResults.boss` doit exister (avoir complété le Boss Test au moins une fois)
- **Cooldown** : 48h entre chaque tentative (pour encourager la révision entre les tests)
- Vérifier via une nouvelle clé dans `mockResults`, par ex. `mockResults.randomTest` avec `{date, score, toeicEstimate}`

### 4. Routing & navigation

- Route : `sp==="randomTest"`
- Ajouter une carte dans le Training Grounds (à côté du Boss Test), avec un visuel distinct
- Icône suggestion : 🎲 ou ♻️
- BGM : réutiliser `bgm_final.mp3`

### 5. Sauvegarde des résultats

- Sauvegarder dans `u.mockResults.randomTest` : `{date, score, toeicEstimate, listening, reading, attempts}`
- `date` : mis à jour à chaque tentative (pour le cooldown)
- `score` : meilleur score conservé
- `attempts` : compteur de tentatives
- Appeler `sv()` après sauvegarde

### 6. Points d'attention

- **Pas de nouvel import nécessaire** : tous les pools sont déjà importés dans App.jsx
- **Audio** : les items P1-P4 du training ont leurs MP3 dans `public/audio/p1/`, `p2/`, `p3/`, `p4/`. Les items du Boss ont les leurs dans `public/audio/boss/`. Le composant doit construire le bon path selon l'origine de l'item (vérifier le préfixe de l'id)
- **Pas de split de fichier** : tout dans App.jsx, comme le reste
- **Hooks React** : tous les `useState`/`useMemo` en haut du composant, avant tout `if`/`return`
- **`sv()` pour sauvegarder** : comme partout dans l'app
- **`applyXpGates()`** : l'XP doit passer par cette fonction (ne pas bypass)
- **Champs P5 vs P6/P7** : attention aux noms de champs différents (`o`/`c` vs `options`/`correct`)
- **Le Boss Test ne doit PAS être modifié** : le Random Test est un composant séparé qui coexiste

---

## Résumé des livrables

1. Fonction `generateRandomTest()` — pioche + shuffle dans tout le pool
2. Composant `RandomTest(p)` — clone du flow BossTest avec contenu aléatoire
3. Route `sp==="randomTest"` dans le router principal
4. Carte de navigation dans Training Grounds (débloquée post-boss, cooldown 48h)
5. Sauvegarde dans `mockResults.randomTest`
6. Shuffle des options sur toutes les parts
