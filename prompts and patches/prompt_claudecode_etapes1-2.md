# Prompt Claude Code — Intégration chests.js dans App.jsx
## Étapes 1 et 2 : Import + Hooks déclencheurs

---

## Contexte

Le fichier `chests.js` est maintenant à la racine du projet (même niveau qu'App.jsx).
Il expose les fonctions : `checkAndGrantChest`, `openChest`, `getPendingChests`,
`getInventory`, `equipItem`, `CHEST_TYPES`, `RARITIES`, `LEGENDARY_ACHIEVEMENTS`.

L'objectif de cette session est uniquement d'**importer ce fichier dans App.jsx**
et d'**accrocher les déclencheurs aux bons endroits**.
Ne pas modifier la logique existante. Ne pas créer de composants UI.
Toutes les modifications sont chirurgicales.

---

## Modification 1 — Import

En tête de App.jsx, ajouter avec les autres imports :

```js
import {
  checkAndGrantChest,
  getPendingChests,
  LEGENDARY_ACHIEVEMENTS,
} from './chests.js';
```

---

## Modification 2 — Nouveau state : pendingChests

Dans le composant principal Arena (celui qui contient `addXp`, `sv`, `mockDone`, etc.),
ajouter un state pour tracker les coffres en attente :

```js
const [pendingChests, setPendingChests] = useState([]);
```

Et un useEffect pour les charger au montage (quand `u` est disponible) :

```js
useEffect(function() {
  if (!u || !u.name) return;
  getPendingChests(u).then(function(chests) {
    setPendingChests(chests);
  });
}, [u && u.name]);
```

---

## Modification 3 — Fonction helper grantChest

Ajouter cette fonction helper juste avant `addXp` (vers ligne 6446).
Elle appelle `checkAndGrantChest` et rafraîchit le state si un coffre est accordé.
Elle est appelée en **fire-and-forget** (sans await) depuis les fonctions synchrones.

```js
function grantChest(trigger, chestType) {
  checkAndGrantChest(trigger, chestType, u).then(function(granted) {
    if (granted) {
      getPendingChests(u).then(function(chests) {
        setPendingChests(chests);
      });
    }
  });
}
```

---

## Modification 4 — Hooks dans addXp

Dans la fonction `addXp`, **après** la ligne `c.xp += amt; c.weeklyXp += amt;`
et **après** le calcul de `newLeague`, ajouter les vérifications suivantes.

Localiser exactement cette section (vers ligne 6488) :
```js
c.xp+=amt;c.weeklyXp+=amt;
if(c.xp<0)c.xp=0;
if(c.weeklyXp<0)c.weeklyXp=0;
var newLeague=getLeague(c.weeklyXp);
if(newLeague.id!==prevLeague.id&&c.weeklyXp>prevLeague.min)try{playJingleLeague();}catch(e){}
```

Ajouter **juste après** cette section :

```js
// ── Coffres : paliers XP ──
if(amt > 0) {
  var prevXp = c.xp - amt;
  var xpMilestones = [
    [1000,'novice'], [3000,'novice'], [5000,'novice'],
    [10000,'guerrier'], [20000,'guerrier'],
    [30000,'champion'], [50000,'champion'],
  ];
  xpMilestones.forEach(function(m) {
    if (prevXp < m[0] && c.xp >= m[0]) {
      grantChest('xp_' + (m[0] >= 1000 ? (m[0]/1000) + 'k' : m[0]), m[1]);
    }
  });
}

// ── Coffres : streaks ──
if (isFirstToday) {
  if (c.streak === 7)   grantChest('streak_7',   'novice');
  if (c.streak === 30)  grantChest('streak_30',  'guerrier');
  if (c.streak === 100) grantChest('streak_100', 'champion');
}

// ── Coffres : passage de league ──
if (newLeague.id !== prevLeague.id && c.weeklyXp > prevLeague.min) {
  grantChest('league_up_' + newLeague.id, 'guerrier');
}
```

---

## Modification 5 — Hook dans sv() pour achievements légendaires

Dans la fonction `sv` (vers ligne 6412), dans la boucle `ACHIEVEMENTS.forEach`,
juste après la ligne `d.unlockedAch.push(a.id)` :

Localiser :
```js
if(a.check(d)&&d.unlockedAch.indexOf(a.id)===-1){
  d.unlockedAch.push(a.id);
  try{playJingleAchieve();}catch(e){}
  setAchToast({name:a.name,icon:a.icon,desc:a.desc});
  setTimeout(function(){setAchToast(null);},3500);
}
```

Modifier en ajoutant le coffre légendaire :
```js
if(a.check(d)&&d.unlockedAch.indexOf(a.id)===-1){
  d.unlockedAch.push(a.id);
  try{playJingleAchieve();}catch(e){}
  setAchToast({name:a.name,icon:a.icon,desc:a.desc});
  setTimeout(function(){setAchToast(null);},3500);
  // Coffre légendaire pour les achievements rares
  if(LEGENDARY_ACHIEVEMENTS.indexOf(a.id) !== -1) {
    grantChest('ach_legendary_' + a.id, 'legendaire');
  }
}
```

---

## Modification 6 — Hook dans mockDone

La fonction `mockDone` est vers ligne 6582 :
```js
function mockDone(result,xp){var c=addXp(xp);...sv(c);}
```

Ajouter **avant** `sv(c)` à la fin de mockDone :

```js
// Coffres : Mock Tests
if (result.mockId === 1) grantChest('mock_1', 'champion');
if (result.mockId === 2) grantChest('mock_2', 'champion');
if (result.mockId === 3) grantChest('mock_3', 'champion');
// Boss Test (mockId 4 ou identifié par result.isBoss)
if (result.mockId === 4 || result.isBoss) grantChest('boss_test', 'legendaire');
```

> ⚠️ Vérifier comment le Boss Test est identifié dans le code existant
> (result.mockId, result.isBoss, ou autre flag) et adapter la condition.

---

## Modification 7 — Hooks dans gameDone

La fonction `gameDone` est vers ligne 6583 :
```js
function gameDone(modeKey,result,xp){...sv(c);}
```

Ajouter **avant** `sv(c)` à la fin de gameDone :

```js
// Coffres : jeux — déclencheurs hebdomadaires
var totalQ = result.total || 1;
var scorePct = totalQ > 0 ? (result.score || 0) / totalQ : 0;

if (modeKey === 'wfall') {
  var combo = result.maxCombo || 0;
  if (combo >= 10) grantChest('wfall_combo10', 'novice');
  if (combo >= 20) grantChest('wfall_combo20', 'guerrier');
  if (combo >= 30) grantChest('wfall_combo30', 'champion');
}
if (modeKey === 'matchEasy' && scorePct >= 0.8) {
  grantChest('smatch_easy_80', 'novice');
}
if (modeKey === 'matchHard' && scorePct >= 0.8) {
  grantChest('smatch_hard_80', 'guerrier');
}
if (modeKey === 'duel') {
  if (result.won) {
    grantChest('duel_win', 'guerrier');
    // Coffre champion tous les 3 victoires
    var totalWins = (c.gameScores && c.gameScores.duel && c.gameScores.duel.wins) || 0;
    if (totalWins > 0 && totalWins % 3 === 0) {
      grantChest('duel_win3', 'champion');
    }
  }
}
```

---

## Modification 8 — Hooks dans les callbacks done des autres jeux

Ces jeux passent par leurs propres callbacks inline dans le JSX (vers lignes 6629-6631).
Il faut les modifier pour ajouter les déclencheurs.

### AudioBlitz (ligne ~6631)
Localiser :
```js
if(sp==="ablitz")return(...<AudioBlitz u={u} done={function(sc,tot,xp){var c=addXp(xp);...sv(c);sSP(null);sT("games");}} .../>)
```

Ajouter avant `sv(c)` dans le done callback :
```js
var ablitzPct = tot > 0 ? sc / tot : 0;
if (ablitzPct >= 0.7) grantChest('ablitz_70', 'novice');
if (ablitzPct >= 0.9) grantChest('ablitz_90', 'guerrier');
```

### ClueHunter (ligne ~6630)
Localiser le done callback de ClueHunter.
Ajouter avant `sv(c)` :
```js
// Coffre si partie parfaite (aucune erreur = sc === tot)
if (sc === tot && tot > 0) grantChest('clue_perfect', 'guerrier');
```

### SentenceBuilder (ligne ~6629)
Localiser le done callback de SentenceBuilder.
Ajouter avant `sv(c)` :
```js
var sbPct = tot > 0 ? sc / tot : 0;
if (sbPct >= 0.9) grantChest('sbuild_90', 'novice');
```

---

## Modification 9 — Exposer pendingChests

Pour que les futurs composants UI puissent accéder aux coffres en attente,
s'assurer que `pendingChests` et `setPendingChests` sont accessibles là où
ils seront utilisés (dans le même scope que les autres states).

Pas de modification supplémentaire nécessaire si le state est déclaré
dans le composant principal Arena — il sera disponible pour les futurs
composants `ChestOpenModal` et `ChestNotification`.

---

## Vérification post-modifications

Après avoir appliqué toutes les modifications :

1. `npm run dev` — vérifier qu'il n'y a pas d'erreurs de compilation
2. Ouvrir la console — vérifier qu'il n'y a pas d'erreurs au chargement
3. Compléter une session rapide (ex: Daily Challenge) — vérifier dans
   la console que `[chests] Coffre accordé : novice (streak_7)` apparaît
   si la condition est remplie
4. Vérifier dans Supabase Table Editor > `pending_chests` qu'une ligne est insérée

---

## Ce qui N'est PAS dans ce prompt

- Le composant `ChestOpenModal` (étape 3 — session suivante)
- La migration CSS skins (étape 4)
- La page inventaire (étape 5)
- L'appel à `openChest()` (sera dans ChestOpenModal)
