# Audit Results — TOEIC Arena

Ce répertoire contient les rapports d'audit post-déploiement. Chaque fichier est généré par un script Node.js et complété manuellement par Jérémy.

---

## Audit P2 batch 3 (`p2-batch3-YYYY-MM-DD.md`)

### Contexte

Le **2026-04-29**, 50 nouveaux items P2 (`p2_76` → `p2_125`) ont été ajoutés, doublant le pool de 75 à 125 items. Ce batch est le **premier à utiliser 2 nouvelles voix ElevenLabs non-US** :

- `VOICE_A = 4yye0QE5YPsKbMOCGGlj` — items dont l'ID numérique est **pair** (76, 78, ..., 124)
- `VOICE_B = rfkTsdZrVWEVhDycUYn9` — items dont l'ID numérique est **impair** (77, 79, ..., 125)

L'accents et le sexe précis de ces 2 voix restent à documenter (Jérémy a les infos dans son compte ElevenLabs).

**Déployé en même temps** qu'un module mastery chest trigger. Commit de référence : `432b3ca`.

### Lancer le script

```bash
# Prérequis : Node.js 18+, .env à la racine du projet avec :
#   VITE_SUPABASE_URL=https://xxxx.supabase.co
#   SUPABASE_SERVICE_ROLE_KEY=eyJhbGci... (préféré, bypass RLS)
#   ou VITE_SUPABASE_ANON_KEY (fallback — peut être bloqué par RLS sur students)
#
# Optionnel : cibler une autre classe
#   AUDIT_CLASS_CODE=autre_code node scripts/audit-p2-batch3.cjs

node scripts/audit-p2-batch3.cjs
```

Le rapport est écrit dans `audit-results/p2-batch3-YYYY-MM-DD.md` (date du jour).

### Ce que mesure le script

| Donnée | Source | Disponible |
|--------|--------|-----------|
| Accuracy globale P2 (pré vs post 2026-04-29) | `students.module_scores.lisP2.history[].date` | ✅ |
| Sessions jouées post-batch3 | `history[].date ≥ 2026-04-29` | ✅ |
| Étudiants actifs post-batch3 | Filtrage history | ✅ |
| Tendance hebdomadaire | `weekly_snapshots.module_scores_snapshot.lisP2` | ✅ |
| Accuracy per-item (p2_76, p2_77, ...) | — | ❌ **impossible** |
| Items jamais vus / shuffle uniforme | — | ❌ **impossible** |

### Limitations critiques

**Le tracking per-item n'existe pas.** `ListenP2` sélectionne 10 items aléatoires via `shuffle(LISTENING_P2).slice(0, 10)` (App.jsx ~l.12703) et appelle `miniDone(sc, tot, xp)` en fin de session. `recordModule` ne reçoit que `{correct, total}` — les IDs des items joués ne sont jamais persistés.

Conséquence : on ne peut **pas** déterminer si un item spécifique est difficile, rarement exposé, ou jamais vu.

### Confounding factor : bug des préfixes audio

Les items batch 3 (`p2_76` → `p2_125`) ont été générés **sans** les préfixes "A. ", "B. ", "C. " dans le texte lu oralement. L'étudiant entend les 3 réponses mais ne sait pas (à l'oral) si c'est la réponse A, B, ou C qu'il vient d'entendre.

Ce bug a été corrigé au **batch 4** (`p2_126` → `p2_175`) via le script `generate-audio-p2-batch4.mjs` (préfixe inclus dès la génération). Avant de conclure que les accents non-US causent une baisse d'accuracy, il faut comparer avec batch 4 une fois qu'il y a suffisamment de sessions batch 4.

### Comment lire les résultats

1. **Tableau "Accuracy globale"** : Si `post < pré - 5%`, c'est un signal. Moins de 5% de différence → normal (variance statistique sur petits échantillons).
2. **Tableau "Par étudiant"** : Cherche des outliers — un étudiant avec post-accuracy très basse indique peut-être un problème audio sur son appareil, pas nécessairement les accents.
3. **Tendance hebdo** : Une baisse nette la semaine du 2026-04-29 puis remontée = adaptation. Baisse persistante = problème structurel.

---

## Future Work — Tracking per-item (non implémenté)

Pour débloquer les analyses per-item dans un prochain audit, il faudrait modifier `recordModule` dans `App.jsx` pour accepter une liste d'item IDs par session :

```js
// Dans ListenP2.nxt() — au moment de p.done() :
// Actuellement : p.done(sc, items.length, 25 + sc*6)
// Avec tracking : p.done(sc, items.length, 25 + sc*6, { itemIds: items.map(i => i.id), answers: [...] })

// Dans recordModule(u, modId, sc, tot, catStats) :
// Ajouter un champ optionnel `itemResults: [{id, correct}]` dans chaque entrée history
// → hist.push({ date: today(), correct: sc, total: tot, items: itemResults })
```

Ce changement est backward-compatible (le champ `items` est optionnel dans history). Il permettrait :
- Accuracy per-item après 30+ sessions
- Détection des items jamais exposés (shuffle bias)
- A/B test voix précis (accuracy VOICE_A vs VOICE_B)

**Estimation** : ~30 min de dev. À planifier avant le batch 5.
