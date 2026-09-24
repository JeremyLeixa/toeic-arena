# Grammar Gauntlet

> Chargé quand on travaille dans `src/features/gauntlet/`. Le skill `add-module` renvoie ici pour le palier XP.

### Grammar Gauntlet 🛡️ (S2 major feature, delivered 2026-04-22)
- Route `sp==="gauntlet"` → `GauntletHub` component.
- 4 sub-modules rendered via internal `subMode` state: `"irregular"` (IrregularCrypt), `"tense"` (Chronomancer), `"passive"` (PassiveForge), `"relative"` (RelativeWeaver).
- `onModuleDone(subId, sc, tot, xp)` prop bubbles completion to App, which runs `settleSession("gauntlet_"+subId, …, {spotlight:true})` → stats → `recordModule` → `checkMission` → `grantWeeklyChest` if perfect → `sealSession` → `sv`, and **returns the session id**. The sub-module shows `SessionResult` itself (Continue → hub, Play again → `subRun` key).
- Each sub-module has its own BGM: `bgm_crypt` / `bgm_chrono` / `bgm_forge` / `bgm_weaver`.
- Content pool: 270 items total (80/70/60/60). Session size 15 everywhere.
- TOEIC estimator: reading backbone `gauntlet` weight **0.11** (avg accuracy across the 4 sub-modules, `lib/toeic.js` `rdParts` ; the 0.15 of the first delivery was rebalanced in Chantier A.2).

### Gauntlet XP tier (2026-04-22 rebalance)
- 15 Q per sub-module, base 15 + 5 × correct + 35 perfect bonus → max 125 XP per run.
- Irregular Crypt keeps partial-credit granularity: `15 + 5×full + 2×partial` + 35 perfect.
- The other 3 (Chronomancer / Passive Forge / Relative Weaver): `15 + 5×correct` + 35 perfect.
- Rationale: old formulas (Irregular 60 max, others 80) under-paid the Gauntlet vs peer 15 Q modules (Word Tavern 110, Phrasal Picker 100, SentenceBuilder 95) despite being harder (typed answers, 30s timer, complex transforms). New tier B puts Gauntlet at the top of the 15 Q bracket.

---
