# Grammar Gauntlet

> Chargé quand on travaille dans `src/features/gauntlet/`. Le skill `add-module` renvoie ici pour le palier XP.

### Grammar Gauntlet 🛡️ (S2 major feature, delivered 2026-04-22)
- Route `sp==="gauntlet"` → `GauntletHub` component.
- 4 sub-modules rendered via internal `subMode` state: `"irregular"` (IrregularCrypt), `"tense"` (Chronomancer), `"passive"` (PassiveForge), `"relative"` (RelativeWeaver).
- `onModuleDone(subId, sc, tot, xp)` prop bubbles completion to App, which runs `settleSession("gauntlet_"+subId, …, {spotlight:true})` → stats → `recordModule` → `checkMission` → `grantWeeklyChest` if perfect → `sealSession` → `sv`, and **returns the session id**. The sub-module shows `SessionResult` itself (Continue → hub, Play again → `subRun` key).
- Each sub-module has its own BGM: `bgm_crypt` / `bgm_chrono` / `bgm_forge` / `bgm_weaver`.
- Content pool: 270 items total (80/70/60/60). Session size 15 everywhere.
- TOEIC estimator: reading backbone `gauntlet` weight **0.11** (avg accuracy across the 4 sub-modules, `lib/toeic.js` `rdParts` ; the 0.15 of the first delivery was rebalanced in Chantier A.2).

### Sept épreuves (2026-09-25)
Knotbinder (connecteurs), Anchor Hall (prépositions) et Twin Paths (gérondif / infinitif) sont les anciens modules seuls
Connectors Sorting, Preposition Collocations et Gerund vs Infinitive, entrés au Gauntlet avec son habit (proto
`prototypes/gauntlet-seven/`, noms choisis par Jérémy). Constat : essayés par ~60 élèves, gardés par ≤ 11 ; le Gauntlet retient.
- **Ils comptent SOUS LEURS IDS D'ORIGINE** : `connsort`, `prepdrill`, `gerinf` (table `lib/gauntletTrials.js`, lue par la
  route `gauntlet`, le hub, la tuile Train et `usageStats.familyOf`). Historique, poids de l'estimateur (.06 / .05 / .05,
  séparés de `gauntAvg`), échelons de maîtrise, jetons armés et refs du bestiaire (`moduleRef("connsort", word)`…)
  continuent sans migration. **Ne jamais les renommer en `gauntlet_…`** : tout repartirait de zéro (`check_review_lookup`).
- Même gabarit que les autres épreuves : 15 Q (Twin Paths tire 15 phrases sur 45, l'ancien module les jouait toutes),
  barème B, `sentRef` + `useEffect([phase])`, écran d'entrée commun `TrialIntro` (privé au fichier). Options de Twin
  Paths permutées (`permuteGI`) ; Knotbinder et Anchor Hall ont une grille fixe (3 règles, 8 prépositions en ordre alpha).
- Musiques réutilisées : `bgm_bridge` (partagée avec Linking Bridge), `bgm_clue`, `bgm_verdict` (Modal Council).
- Grimoires : `GRIMOIRE_CONNECTORS` (aussi celui de Linking Bridge), `GRIMOIRE_GERUND`, `GRIMOIRE_PREPOSITIONS`
  (`data/prepositionsGrimoire.js`, 10 chapitres, relu par Jérémy et accroché le 2026-09-25 ; il remplace le Study Mode
  de l'ancien PrepDrill). Relecture d'un grimoire dans le vrai lecteur : `prototypes/gauntlet-seven/grimoire.html`.
- Coffre sans faute : `<modId>_perfect` (`connsort_perfect`…), déclenchés dans `scripts/gen-economy-sql.mjs`.
- Trophées de tout le hub (Champion, Explorer, Grinder, Scholar) : `GAUNTLET_KEYS` dans `data/achievements.js`, 7 clés.
- Pas d'alias pour les anciennes routes `connsort` / `prepdrill` / `gerinf` : rien n'y naviguait hors des tuiles retirées
  (les quêtes du plan ne mènent qu'aux Parts, `drill` et `hunt`).

### Gauntlet XP tier (2026-04-22 rebalance)
- 15 Q per sub-module, base 15 + 5 × correct + 35 perfect bonus → max 125 XP per run.
- Irregular Crypt keeps partial-credit granularity: `15 + 5×full + 2×partial` + 35 perfect.
- The other 3 (Chronomancer / Passive Forge / Relative Weaver): `15 + 5×correct` + 35 perfect.
- Rationale: old formulas (Irregular 60 max, others 80) under-paid the Gauntlet vs peer 15 Q modules (Word Tavern 110, Phrasal Picker 100, SentenceBuilder 95) despite being harder (typed answers, 30s timer, complex transforms). New tier B puts Gauntlet at the top of the 15 Q bracket.

---
