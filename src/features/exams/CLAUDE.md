# Examens : Boss, Endless, écoute fidèle au TOEIC

> Chargé quand on travaille dans `src/features/exams/`.

### Listening (Boss Test — TOEIC Faithful)
- **P1:** Photo + blind A/B/C/D. Student can answer DURING audio.
- **P2:** Blind A/B/C. Student can answer DURING audio.
- **P3/P4:** Preview questions BEFORE audio. Answer after.
- **P5-P7:** Text + options, no audio.

### Boss Test — The Final Arena
- **Options permutées de façon FIGÉE par item** (Part 2 : `BOSS_P2_SHUF` ; Parts 3 à 7 depuis le 2026-09-18 :
  `lib/optionShuffle.js` avec `seedFromId`, `seededShuffleOpts` au pas 0.67) : la reprise de session relit des
  réponses rangées par index, un tirage par ouverture les désalignerait. Toute nouvelle disposition → bumper
  `BOSS_LAYOUT_V` (3 depuis le 2026-09-18), sinon une session reprise lit ses réponses de travers. Mock Tests :
  tirage neuf à chaque passage (pas de reprise). Part 1 laissée dans l'ordre de ses clips (déjà répartie).
- Unlocked after completing Mock Tests 1, 2, and 3.
- 202 questions, 120 min timer, Listening first then Reading.
- 24h cooldown. Best score preserved.
- XP: 100 base + 3 per correct + bonus at 600+ and 800+.
- Achievements: "Arena Conqueror" 🐉 (complete) + "Dragon Slayer" 🔥 (800+).
- BGM: `bgm_final.mp3`.

### Endless Arena ⏳
- Unlocked after Boss Test with ≥650 TOEIC. 24h cooldown.
- Random full TOEIC test generated from all content pools.
- Results screen shows weakness reco + suggested next module.
- BGM: `bgm_endless.mp3`.
