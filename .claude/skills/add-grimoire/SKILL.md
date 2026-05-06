---
name: add-grimoire
description: Use this skill any time Jérémy creates, drafts, or extends a grimoire (the FR theory codex rendered via GrimoireReader) for TOEIC Arena. Trigger on phrases like "ajoute un grimoire", "écris la théorie de X", "crée le manuscrit de Y", "remplace le Study Mode par un grimoire", or whenever a G&V module needs theoretical content. The format is very specific (block types, FR-only theory, one-idea-per-chapter, page-num placement gotcha) and getting it wrong means the GrimoireReader renders broken or the content reads badly on mobile. Always use this skill before authoring grimoire content.
---

# Add Grimoire — TOEIC Arena

Grimoires are the in-game "theory codex" attached to G&V modules. They render via `<GrimoireReader/>` with parchment styling and CSS 3D flip. Format is rigid : missing field types or the wrong page-num CSS produces silent layout breaks.

## When to use

- New G&V module with theoretical content (Modal Council pattern)
- Replacing a Study Mode with a grimoire (Gerund/Inf, Phrasal Dojo pattern)
- Extending an existing grimoire with new chapters
- Authoring a Cheat Sheet (uses same block format, wrapped in GrimoireReader)

**Replacing Study Mode rule** : when a module has both a Study Mode and theoretical content, REPLACE the Study Mode entirely with a grimoire. Don't keep both. Pattern validated 2026-04-22 (GerInf, PhrasalDojo).

## File location & shape

Create `src/data/<modId>Grimoire.js` :

```js
export var GRIMOIRE_<MODID> = {
  id: "<modId>",
  title: "<Module Title> — Manuscrit des <Theme>",   // FR
  subtitle: "<one-line theme>",                       // FR
  readingTime: "<N> min",                             // estimated
  icon: "<emoji>",
  chapters: [
    {
      id: "ch1_<slug>",
      title: "I. <Chapter Title>",                    // Roman numeral prefix
      intro: "<1-2 phrases d'intro qui posent le problème>",
      blocks: [ /* see block types below */ ]
    },
    // …
  ]
};
```

## Block types — exhaustive list

`<GrimoireReader/>` only knows these. Anything else renders as nothing.

### `paragraph`
```js
{type:"paragraph", text:"Texte de prose en FR."}
```

### `heading`
```js
{type:"heading", text:"Sous-titre dans le chapitre"}
```

### `rule` — formula box
```js
{type:"rule", label:"Must", formula:"Obligation INTERNE. C'est moi qui décide."}
```
Use `label` for the modal/structure name, `formula` for the rule text.

### `example` — bilingual EN/FR + optional note
```js
{type:"example", en:"I must call my mother.", fr:"Je dois appeler ma mère.", note:"Obligation interne → must."}
```
EN and FR mandatory. `note` optional, used for explanation/connection back to the rule.

### `trap` — red warning box
```js
{type:"trap", text:"« Must » ne se conjugue PAS au passé. Au passé, on utilise « had to »."}
```
For TOEIC traps, faux-amis, common mistakes francophone learners make.

### `table`
```js
{type:"table",
 headers:["Modal","Force","Tonalité"],
 rows:[
   ["should","douce","conseil amical"],
   ["had better","forte","mise en garde"]
 ]}
```
Headers + rows arrays. Keep cells short (≤ 4 words) — mobile-readability.

### `list`
```js
{type:"list", items:["Premier item","Deuxième item","Troisième"]}
```

## Hard rules

### One idea per chapter
Mobile readability. Long chapters get split. If a chapter has more than ~6-8 blocks of varied content, repaginate. Better 12 short chapters than 5 dense ones.

### Theory in FR, chrome in EN
- All grimoire prose, rules, traps, intros : **French** (target audience = francophone learners).
- Examples have `en:` (English sentence) + `fr:` (French translation) + optional `note:` (FR explanation).
- App chrome (button labels, hub names) : English.

### Roman numerals in chapter titles
`I.`, `II.`, `III.` … as prefix. Existing grimoires follow this. Page numbers in the reader display roman too.

### No emoji escapes
Use real UTF-8 characters. Never `\uXXXX` (Windows / Vite encoding issues — see CLAUDE.md "Encoding").

### No trailing commas
Vite/Rolldown will throw a parse error.

## Page-number gotcha (CSS — past bug)

The `.grim-page-num` element MUST live INSIDE `.grim-page-content` with `margin-top:auto` (flex column with `min-height:100%`). Do NOT use `position:absolute; bottom:X` — it sticks to viewport, not to content, and breaks on shorter chapters.

This is in App.jsx CSS — only relevant if extending the GrimoireReader styling. Stay away unless you have a specific reason.

## Wiring into App.jsx

After creating the grimoire data file :

1. Import at top of App.jsx :
   ```js
   import { GRIMOIRE_<MODID> } from "./data/<modId>Grimoire.js";
   ```
2. Render via shared component :
   ```js
   <GrimoireReader grimoire={GRIMOIRE_<MODID>} back={function(){...}}/>
   ```
3. Entry point : usually a "📖 Read the grimoire" button on the module hub. Use `.gauntlet-btn-grim` class for consistent styling, or the module's hub-style buttons.

## Cheat Sheets (V2 chest reward)

Cheat Sheets use the same block format, wrapped via `GrimoireReader`. Stored under `CHEAT_SHEETS` in `chests.js`. 3 stubs exist; content authoring is deferred (low priority per CONTEXT.md).

## Reference grimoires (good examples)

Before writing a new one, read at least one of these end-to-end :
- `src/data/modalsGrimoire.js` — 7 chapters, the cleanest recent example
- `src/data/grammarGauntletGrimoire.js` — multi-grimoire bundle (Chronomancer / Passive Forge / Relative Weaver), each grimoire is a separate export from the same file
- `src/data/gerundGrimoire.js` — replaces a former Study Mode, denser content
- `src/data/connectorsGrimoire.js` — newest pattern (Modal Council era)

## Authoring tips

- **Start from the trap.** Most TOEIC G&V points have a contresens-piège for francophones (`mustn't` ≠ `don't have to`, `since` ≠ `for`, `bring` ≠ `take`). Lead each chapter with the misconception, then resolve.
- **Bilingual examples drive retention.** Always pair EN with FR. The `note:` field is where you tie back to the rule.
- **Don't over-explain.** Theory chapter = "le formateur en train d'expliquer au tableau", not a textbook. 1-2 paragraphs max per concept, then examples.
- **Estimate reading time honestly.** Round up. 12 chapters of 4-5 blocks = ~10-12 min. Students trust the estimate.
