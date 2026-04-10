# Data Files — Conventions & Patterns

All content is imported at build time. No dynamic fetching. Files use `export var`.

---

## Field Name Reference

| Field | Type | Meaning | Used in |
|-------|------|---------|---------|
| `id` | string | Unique identifier | All gamified content |
| `s` / `sentence` | string | Sentence or prompt (with `_____` blank) | grammar, placement, clueHunter |
| `o` / `opts` / `options` | string[] | Answer choices (3 or 4) | All question files |
| `c` / `correct` / `ans` | number | Correct answer index (0-based) | All question files |
| `x` / `exp` | string | Teaching explanation | All question files |
| `cat` | string | Grammar category | grammar, clueHunter, sentences |
| `q` | string | Question text | audioBlitz, part7 |
| `audio` | string | Path to MP3 (relative to `public/`) | audioBlitz, listening |
| `text` | string | Transcript or passage body | part6, part7, audioBlitz |
| `w` | string | Word/phrase | vocab, clueHunter chips |

---

## ID Conventions per File

| File | Format | Example | Notes |
|------|--------|---------|-------|
| vocab.js | `[prefix][N]` | f1, m2 | Prefix = category initial |
| grammar.js | `g[N]` | g1, g523 | Sequential, no gaps |
| listening.js | `p[part]_[NN]` | p1_01, p2_15 | 2-digit with leading zero |
| part6.js | `p6t[N]` | p6t1, p6t20 | No leading zero |
| part7.js | `p7p[N]` | p7p1, p7p24 | No leading zero |
| audioBlitz.js | `ab_[NN]` | ab_01, ab_60 | 2-digit with leading zero |
| clueHunter.js | `ch[NN]` | ch01, ch80 | 2-digit with leading zero |
| placement.js | `bs_[type][N]` | bs_g1, bs_v5 | Type: g/v/r/l |
| achievements.js | snake_case | first_blood | Descriptive |
| leagues.js | snake_case | bronze, silver | Tier name |
| sentences.js | *(none)* | — | Position-based |
| phrasalVerbs.js | *(none)* | — | Reference data |

---

## File Structures

### vocab.js — `VOCAB`
```js
{ id: "finance", name: "💰 Finance", icon: "💰", col: "#hex",
  cards: [{ id: "f1", w: "word", d: "definition", e: "example sentence" }] }
```
390 cards, 18 domains. No audio. SRS self-evaluation (not right/wrong).

### grammar.js — `QUESTIONS`
```js
{ id: "g1", s: "The report _____ yesterday.", o: ["was submitted","submitted","submitting","submit"], c: 0, x: "Passive voice...", cat: "Passive Voice" }
```
523 questions, 14 categories.

### listening.js — `LISTENING_P1`, `LISTENING_P2`, `LISTENING_P3`, `LISTENING_P4`
```js
// P1: photo + 4 blind options
{ id: "p1_01", img: "/images/p1/p1_01.png", opts: [...4], c: 0, x: "..." }
// P2: audio question + 3 blind options
{ id: "p2_01", audio: "/audio/p2/p2_01_q.mp3", opts: [...3], c: 0, x: "..." }
// P3/P4: audio conversation + written questions
{ id: "p3_01", audio: "/audio/p3/p3_01.mp3", questions: [{ s, opts, c, x }] }
```

### part6.js — `PART6_TEXTS`
```js
{ id: "p6t1", type: "Email", from: "...", to: "...", subject: "...",
  parts: [
    { text: "paragraph...", blank: false },
    { text: "___", blank: true, options: [...4], correct: 0, x: "..." }
  ] }
```
20 texts. Types: Email, Memo, Notice, Letter, Instructions.

### part7.js — `PART7_PASSAGES`
```js
{ id: "p7p1", type: "Email", text: "full passage...",
  questions: [{ q: "What is implied?", options: [...4], correct: 0, x: "..." }] }
```
24 passages (single or double). Double passages use `--- DOCUMENT 1/2 ---` separator.

### audioBlitz.js — `AUDIO_BLITZ`
```js
{ id: "ab_01", text: "transcript", q: "question", opts: [...4], c: 0, audio: "/audio/blitz/ab_01.mp3" }
```
60 items.

### clueHunter.js — `CLUE_HUNTER`
```js
{ id: "ch01", sentence: "..._____...",
  chips: [{ w: "word", c: true/false }],  // c: true = real clue
  opts: [...4], ans: 0, cat: "Present Perfect", exp: "...", clue: "...", ref: "tenses" }
```
80 items. Category label hidden until after answer (pedagogical rule).

### sentences.js — `SENTENCES`
```js
{ s: "The manager has approved the budget.", chunks: ["The manager","has approved","the budget."], cat: "Tenses" }
```
50 items. No IDs — position in array.

### phrasalVerbs.js — `PHRASAL_VERBS`
```js
{ v: "carry", p: "out", pv: "carry out", m: "to complete", fr: "réaliser", ex: "..." }
```
56 items. Reference data, no IDs.

### achievements.js — `ACHIEVEMENTS`
```js
{ id: "first_blood", name: "First Blood", desc: "...", icon: "⚔️", check: (s) => s.xp > 0 }
```
38 achievements. `check` is a predicate function on student profile.

### leagues.js — `LEAGUES`, `COMPETITORS`
```js
{ id: "bronze", name: "Bronze", icon: "🥉", color: "#cd7f32", min: 0 }
```
7 tiers (Bronze→Légende). 12 bot competitors (`{ n: "Léa M.", a: "🦊" }`).

---

## Audio Path Conventions

```
public/audio/
  p1/{id}_0.mp3 ... {id}_3.mp3    — 4 statements per photo
  p2/{id}_q.mp3, {id}_0..2.mp3    — question + 3 response options
  p3/{id}.mp3                      — stitched conversation
  p4/{id}.mp3                      — stitched talk
  blitz/{id}.mp3                   — short utterance
  boss/p1_XX_Y.mp3, p2_XX_q.mp3   — Boss Test audio
  bgm/bgm_{name}.mp3              — background music loops
  vocab/{id}.mp3                   — vocabulary pronunciation
  phrasal/{id}.mp3                 — phrasal verb pronunciation
  sentences/{id}.mp3               — sentence audio
```

---

## Rules for Adding Content

1. **IDs must be unique within each file** — follow the existing prefix/numbering pattern
2. **Correct answer index is 0-based** — `c: 0` means first option
3. **Always include an explanation** (`x` or `exp`) — pedagogical requirement
4. **Audio paths are relative to `public/`** — files must exist before referencing them
5. **Use real emoji characters** — never `\uXXXX` escapes (Windows encoding issues)
6. **No trailing commas** after the last item in arrays (Vite parse errors)
7. **Nested quotes** — use `String.fromCharCode(34)` if needed inside template strings
