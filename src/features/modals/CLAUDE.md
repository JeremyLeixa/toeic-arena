# Modal Council

> Chargé quand on travaille dans `src/features/modals/`.

### Modal Council ⚖️ (S2 module, delivered 2026-04-30)
- Route `sp==="modals"` → `ModalCouncilHub` component.
- 2 sub-modules : `"match"` (ModalMatch — tap-to-pair, 3 boards × 5 pairs = 15 items) + `"sort"` (ModalSort — tap-to-bucket among 4 functions: Obligation / Advice / Possibility / Deduction).
- Same `onModuleDone(subId, sc, tot, xp)` pipeline as Gauntlet (session id returned, `SessionResult` in the sub-module) → `recordModule("modals_"+subId)`.
- **First app-wide use of the tap-to-pair UX pattern** (precedent for future drag/drop-style activities without HTML5 DnD lib — mobile-first, zero dependency).
- BGM **placeholder**: both sub-modules currently wired to `bgm_chrono`. Generate 2 dedicated Mureka tracks and replace in `ModalCouncilHub` `cards` config.
- Content pool: 15 boards × 5 pairs (75 Match items) + 50 Sort items in `src/data/modals.js`. Session: 15 items everywhere (Tier B XP).
- Single grimoire (`GRIMOIRE_MODALS`, 7 chapters FR) accessed from the hub.
- 4 achievements added (council_initiate / oracle_voice / verdict_sworn / council_crowned).
- TOEIC estimator: Reading support **0.04** (average of match + sort, wired in Chantier B, 2026-06-10 ; `lib/toeic.js` `rdParts`).
