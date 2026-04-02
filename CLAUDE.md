# TOEIC Arena — Project Conventions & Context

## Project Overview

TOEIC Arena is a gamified TOEIC exam preparation web application built by Jérémy Leixa, English trainer at IDRAC Business School (Lyon/Grenoble). Used by ~66 Bachelor 3 students (class code: `idrac2026`) and planned for deployment at other institutions (CESI, professional learners).

The app is a **monolithic React application** — all UI logic lives in `src/App.jsx` (~8,000 lines). Jérémy is the sole developer; Claude is the technical partner.

**Live URL:** Deployed on Vercel  
**Supabase project ref:** `huklmklwvwwhhrrcyytq`

---

## Tech Stack

- **Frontend:** React 18 + Vite (build tool: Rolldown via Vite)
- **Main file:** `src/App.jsx` — monolithic, contains all components and inline CSS
- **Data files:** `src/data/*.js` — content separated by module
- **Backend:** Supabase (PostgreSQL, Realtime for duels, Edge Functions for cron)
- **Hosting:** Vercel (serverless functions at `api/`)
- **Audio:** Web Audio API (SFX/jingles in `src/data/sounds.js`), pre-generated MP3s via ElevenLabs (stored in `public/audio/`)
- **BGM:** 5 loops generated via Mureka AI (`public/audio/bgm/`)
- **PWA:** `manifest.json`, `sw.js` v2, VAPID push notifications

---

## Project Structure

```
src/
  App.jsx              — Main app (~8,000 lines, all components + inline CSS)
  main.jsx             — React entry point
  data/
    vocab.js           — 390 flashcards, 18 domains
    grammar.js         — 202 Part 5 drill questions
    listening.js       — P1 (43), P2 (75), P3 (30 convos), P4 (30 talks)
    part6.js           — 20 texts, 80 blanks
    part7.js           — 24 passages, 87 questions
    mockTests.js       — Mock Tests 1-3 (P5+P6+P7 each)
    bossTestFull.js    — The Final Arena (full TOEIC, 202Q, 7 parts)
    miniGames.js       — Word Families, Connectors, Preps, Ger/Inf, False Friends, Traps, Strategy
    audioBlitz.js      — 60 Audio Blitz items
    clueHunter.js      — 80 Clue Hunter items
    sentences.js       — 50 Sentence Builder items
    phrasalVerbs.js    — 56 phrasal verbs
    placement.js       — 15 placement test Qs + levels + mission modules
    achievements.js    — 38 achievements
    leagues.js         — 7 league tiers + bot competitors
    helpers.js         — getLevel(xp) utility
    sounds.js          — Web Audio API synthesized SFX + jingles
    supabase.js        — Supabase client init
public/
  audio/
    bgm/               — bgm_speed.mp3, bgm_wfall.mp3, bgm_duel.mp3, bgm_clue.mp3, bgm_final.mp3
    p1/, p2/, p3/, p4/  — Training listening MP3s
    blitz/              — Audio Blitz MP3s
    boss/               — Boss Test MP3s (P1-P4)
  images/p1/            — Part 1 photos (.jpg, .webp, .png)
  icon-192.png, icon-512.png
  manifest.json, sw.js
api/
  push-send.js          — Vercel serverless function for push notifications
  tts.js                — ElevenLabs TTS proxy (used during audio generation)
```

---

## Supabase Tables

| Table | Purpose |
|-------|---------|
| `students` | All user data (profile, stats, XP, moduleScores, mockResults, etc.) |
| `push_subscriptions` | PWA push notification endpoints |
| `events` | Teacher-created events (Spotlight, Flash Hour, Underdog) |
| `weekly_snapshots` | Weekly stats snapshots for pedagogical reporting |
| `groups` | Multi-campus class codes and group metadata |

---

## Critical Development Rules

### Architecture
- **App.jsx is monolithic.** All components, state, routing, and CSS live in one file. Do not attempt to split it without explicit instruction.
- **Inline CSS via template literal** at the top of App.jsx (the `CSS` variable). Class `.crd` has `background: var(--bg2)` which overrides inline styles — if a component needs its own background, remove the `className="crd"` and set border-radius/border manually.
- **Data files are read-only at runtime.** All content is imported at build time. No dynamic fetching of question data.

### State & Data
- **Supabase data is cumulative, not time-series.** Weekly deltas require the `weekly_snapshots` mechanism. Never assume you can compute "this week's progress" from current data alone.
- **`cardsDone()` must go through `applyXpGates()`.** Bypassing it breaks diminishing returns entirely. This was a critical bug.
- **Upsert on `{onConflict: 'name,class_code'}`** prevents multi-device duplicate profiles. Never upsert by anonymous auth ID.
- **`fresh()` function** initializes a new student profile. Any new field must be added here AND in the Supabase load mapping AND the save mapping.
- **`mockResults`** stores results as `mock1`, `mock2`, `mock3`, `boss`. The Boss Test saves best score but updates `date` on every attempt (for cooldown).

### XP System
- **No daily XP cap.** Students who invest heavily should be rewarded. Diminishing returns per module per day are the anti-farming mechanism.
- **Diminishing returns:** Flashcards 100/60/30/0% per day. Mock tests 100/40/0% per day. Other modules follow standard gates.
- **Accuracy gate:** <30% accuracy → 10% XP, 30-49% → 50%, ≥50% → 100%.
- **TOEIC Progression ranking is the primary bonification metric.** XP Overall is secondary. Both are cumulable (max +3 bonus points).

### TOEIC Score Estimator
- `estimateToeic(raw, total)` — piecewise curve, harder to gain at the top.
- `estimateTOEICScore(u)` — weighted by module accuracy: Listening (P1×0.20, P2×0.30, P3×0.25, P4×0.25 → 5-495) + Reading (drill×0.35, P6×0.25, P7×0.30, vocab×0.10 → 5-495). Mock test bonus +5% per mock ≥60%. Clamped 200-990, rounded to nearest 5.

### Flashcards
- **Flashcard accuracy is NOT a performance metric.** It reflects SRS self-evaluation (Hard/Good/Easy), not right/wrong answers. Never treat low flashcard accuracy as a problem.

### Ghost Mode
- The `Teacher` account (pseudo: "Teacher") has ghost mode. Test sessions from this account must not pollute student statistics.

### Listening (Boss Test — TOEIC Faithful)
- **P1:** Photo displayed + blind A/B/C/D buttons (no text). Student can answer DURING audio. Currently playing statement highlights in orange.
- **P2:** Blind A/B/C buttons (no text). Student can answer DURING audio.
- **P3:** Preview questions + written options BEFORE audio plays. Answer after listening.
- **P4:** Same as P3 — preview questions, then listen, then answer.
- **P5-P7:** Text + options, no audio, at student's own pace.

### Boss Test — The Final Arena
- Unlocked after completing Mock Tests 1, 2, and 3.
- 202 questions, 120 min timer, Listening first then Reading.
- Rejouable with 24h cooldown (checks `mockResults.boss.date === today()`).
- Scoring: Listening /495 + Reading /495 = Total /990.
- XP: 100 base + 3 per correct + bonus at 600+ and 800+.
- Best score preserved; date updated on every attempt.
- Achievements: "Arena Conqueror" 🐉 (complete) + "Dragon Slayer" 🔥 (800+).
- BGM: `bgm_final.mp3` plays on intro, stops when exam starts (`stopBGM()` on Enter the Arena).

### League System
- 7 tiers: Bronze (0) → Silver (200) → Gold (600) → Platinum (1500) → Diamond (5000) → Champion (10000) → Légende (30000).
- `getEffectiveLeague()` requires TOEIC estimated score ≥ 400 to display Légende.
- Season structure S1-S4, weekly snapshots, 3 tabs: Semaine, Général, Progrès.

---

## Known Gotchas & Past Bugs

### Encoding
- **Python raw strings (`r'''`) double-escape unicode.** Never use `r'''` for JSX content containing `\u` sequences. Use regular strings or build line-by-line.
- **Surrogate pairs** (emoji like 🐉 = `\uD83D\uDC09`) must be written as real characters in Python, not as `\ud83d\udc09` in string literals which creates orphan surrogates on Windows.
- **Always validate UTF-8 before writing:** `app.encode('utf-8')` in Python before `open(..., 'w', encoding='utf-8')`.

### Vite/Rolldown
- **Nested quotes in helper functions** cause parse errors. Use `String.fromCharCode(34)` for double-quote generation inside template strings.
- **Unicode characters (──) in search anchors** for patch scripts fail on Windows (encoding mismatch). Use unique content strings as anchors instead.

### Supabase
- **Anon key must NEVER be hardcoded** in App.jsx. Use `import.meta.env.VITE_SUPABASE_ANON_KEY`. Hardcoding triggered a GitGuardian alert.
- **`fetch({ keepalive: true })` with auth headers** replaces `sendBeacon` for unload saves (RLS blocks unauthenticated beacon calls).
- **Realtime:** Avoid `self:false`; use unique session PIDs for message filtering instead of name-based filters.
- **RLS on `push_subscriptions`** was ultimately disabled after persistent auth issues.

### React
- **Hooks must be at component top level** before any conditional returns.
- **`useMemo` with empty deps `[]`** for shuffled question sets — ensures stable order within a session.

### CSS
- **`.crd` class** forces `background: var(--bg2)`. To override background on a card-like element, remove the class and add `borderRadius:16, border:"1px solid var(--bdr)"` manually.
- **Light/dark mode:** CSS variables `--bg`, `--bg2`, `--bg3`, `--t1`, `--t2`, `--t3`, `--bdr`, `--cyan`, `--gold`, `--green`, `--red`, `--orange`, `--purple` are defined at top of the CSS block in App.jsx.

---

## Audio Conventions

### File naming
- **P1 training:** `public/audio/p1/{id}_{0-3}.mp3` (4 statements per photo)
- **P2 training:** `public/audio/p2/{id}_q.mp3` + `{id}_{0-2}.mp3`
- **P3 training:** `public/audio/p3/{id}_line{0-3}.mp3` (individual) + `{id}.mp3` (stitched)
- **P4 training:** `public/audio/p4/{id}.mp3`
- **Boss test:** `public/audio/boss/p1_XX_Y.mp3`, `p2_XX_q.mp3`, `p2_XX_Y.mp3`, `p3_XX.mp3`, `p4_XX.mp3`
- **Audio Blitz:** `public/audio/blitz/{id}.mp3`
- **BGM:** `public/audio/bgm/bgm_{name}.mp3`

### ElevenLabs
- Voices: Sarah (W) = `EXAVITQu4vr4xnSDxMaL`, Adam (M) = `pNInz6obpgDQGcFmaJgB`
- Model: `eleven_multilingual_v2`
- Settings: `stability: 0.55, similarity_boost: 0.75, speed: 0.85`
- Budget: started at 100,000 chars, ~81,400 remaining before Boss Test audio.
- Audio files are pre-generated and stored locally. ElevenLabs credits are ONLY for generating new content, never for runtime playback.

### BGM Wiring Pattern
```javascript
// In the router (around line 6770+):
if(sp==="moduleName"){playBGM("bgm_name");return(<div className={lc}><style>{CSS}</style>
  <Component u={u} done={function(...){stopBGM();handler(...);}} back={function(){stopBGM();sSP(null);sT("tab");}}/>
</div>);}
```

---

## Pedagogical Principles

- **TOEIC score estimator as a pedagogical lever:** Shows students which sections they're neglecting (e.g., high accuracy but zero Listening = capped estimated score).
- **Entire class had zero activity on Listening, P6, P7, Audio Blitz, TOEIC Traps** — identified via CSV analysis. Structural blind spot addressed in class sessions.
- **Some students farm XP** with low TOEIC scores. Diminishing returns + accuracy gates are the countermeasure. Never add a hard daily cap.
- **Clue Hunter:** Clue identification phase must be genuinely distinct from the answer phase. Category label in header spoils the exercise — only appears post-answer.
- **Weekly snapshots are necessary** because Supabase data is cumulative. True weekly deltas require explicit snapshot mechanism.

---

## Credentials & Secrets (DO NOT COMMIT)

These are in Vercel environment variables and `.env`:
- `VITE_SUPABASE_URL` / `VITE_SUPABASE_ANON_KEY`
- `ELEVENLABS_API_KEY` (for audio generation scripts only)
- `VAPID_PUBLIC_KEY` (in App.jsx, public)
- `PUSH_SECRET="toeic-push-2026-xyz"` (in App.jsx, for push endpoint auth)
- Teacher dashboard password: `arena-teacher-2026`

---

## Communication Style

Jérémy prefers: direct, informal, technically precise. French for conversation, English for code/TOEIC content. Responses can be long. Opinions welcome. He applies patches manually and reports build errors precisely.

---

## Current Status (March 2026)

### Completed
- Full app with 2000+ content items across 20+ modules
- 4 mock tests including The Final Arena (full TOEIC simulation)
- Medieval fantasy sonic identity (5 BGM loops, synthesized SFX)
- Train screen refactored into 2×2 tile grid + Boss Test banner
- Multi-campus architecture (groups table, class code selection)
- Events system (Spotlight, Flash Hour, Underdog Boost)
- Push notifications (PWA, VAPID)
- CSV export (~108 columns)
- Weekly snapshots for pedagogical reporting foundation

### On the Horizon
- Weekly pedagogical report (Word/PDF) for the pedagogical director
- Visual redesign toward medieval fantasy aesthetic (DA session planned)
- Multi-campus operational rollout
- Institutional compensation discussion (hybrid licensing model)
