---
name: design-tokens
description: Use this skill any time Jérémy is styling, tweaking colors, fixing CSS, designing a new tile/component, or asking about visual consistency in TOEIC Arena. Trigger on phrases like "couleur", "style", "tile", "card", "background", "skin", "light mode", "dark mode", "var(--", or whenever new inline-CSS or styled markup is being written. The app has a strict design system (CSS variables, skin-aware tokens, mode-aware rgba helpers, semantic signaling colors) and hardcoding hex values breaks skin-switching and light/dark modes silently. Always check this skill before introducing any color or background.
---

# Design Tokens — TOEIC Arena

Inline CSS sits at the top of `App.jsx` (`CSS` template literal, ~line 1095). The app supports 9 skins × 2 modes (light/dark) = 18 variants. Every style decision must use CSS variables, NOT hex values, otherwise skin/mode switching breaks silently.

## When to use

- Writing inline `style={{...}}` or adding to the CSS template
- Adding a new tile, card, button, badge
- Fixing a visual bug related to skin-switching or light mode
- Tweaking colors, gradients, borders

## Core token reference

Defined in `:root` (dark default) and overridden in `.light` and per-skin (`.skin-argent`, `.skin-emeraude`, …).

### Background & foreground
| Token | Dark default | Light | Use |
|-------|--------------|-------|-----|
| `--bg` | `#0f0c08` | `#f5f0e8` | App background |
| `--bg2` | `#1a1610` | `#fffcf5` | Cards (`.crd`), buttons (`.btn2`), tab bar |
| `--bg3` | `#28221a` | `#e8e0d2` | Elevated / inner panels, form borders |
| `--bg-rgb` | `15,12,8` | `245,240,232` | For `rgba()` mode-aware backgrounds |
| `--bg2-rgb` | `26,22,16` | `255,252,245` | Same, for `--bg2` |
| `--bg3-rgb` | `40,34,26` | `232,224,210` | Same, for `--bg3` |
| `--bdr` | `rgba(180,140,80,0.08)` | `rgba(120,90,50,0.1)` | Borders default |

### Text hierarchy
| Token | Dark | Light | Use |
|-------|------|-------|-----|
| `--t1` | `#ede4d4` | `#1a1510` | Primary text |
| `--t2` | `#8a7e6a` | `#5a5040` | Secondary / labels |
| `--t3` | `#5a5040` | `#8a7e6a` | Tertiary / muted / placeholders |

### Skin-aware accent (THE most important — changes per skin)
| Token | Default (Doré) | Use |
|-------|----------------|-----|
| `--cyan` | `#d4943a` | **Primary accent for module content.** All neutral module tiles, icons, buttons. |
| `--cx` | `212,148,58` | RGB triple for `rgba(var(--cx), .X)` gradient/tint patterns |
| `--cx-hex` | `#d4943a` | Hex form when `var(--cyan)` doesn't work (e.g. dynamic gradients) |
| `--cx-dark` | `#a06e20` | Darker variant for hover/border |
| `--orange` | `#c87a35` | Secondary accent (rarely used standalone) |

The `--cyan` name is legacy (V1 was cyan). Don't rename — it's everywhere. Treat it as "the skin's primary color".

### Semantic signaling (DO NOT use --cyan for these)
| Token | Hex | Use |
|-------|-----|-----|
| `--gold` | `#f0c850` | Achievements, league promotion, premium signals |
| `--green` | `#4abe60` | Correct answers, success states |
| `--red` | `#e05252` | Wrong answers, errors, **Boss Test** featured tile |
| `--purple` | `#8b5e83` | Rare cosmetics, special states |
| `--endless` | `#1B70CF` | **Endless Arena** featured tile (always blue regardless of skin) |
| `--endless-dark` / `-light` / `-mid` / `-muted` | various | Endless gradient palette |

## The rules

### 1. Never hardcode background or border hex
**Wrong:**
```js
style={{background:"#1a1610", border:"1px solid #28221a"}}
```
**Right:**
```js
style={{background:"var(--bg2)", border:"1px solid var(--bdr)"}}
```
Hardcoded hexes break light mode + skins.

### 2. Module content uses `var(--cyan)` (skin-aware)
A new tile, training-module icon, neutral primary button : use `var(--cyan)`. It will swap correctly to silver/emerald/sapphire/etc. when the user picks a skin.

### 3. Featured tiles keep their semantic color
Boss Test = red, Endless Arena = blue, Achievements = gold. These are NOT skin-aware on purpose — they signal something specific. Don't var(--cyan)-ify them.

### 4. Mode-aware rgba uses `--bg-rgb` family
For overlays and gradients that need transparency in BOTH modes :
```js
background: `linear-gradient(135deg, rgba(var(--bg3-rgb), .8), rgba(var(--bg2-rgb), .4))`
```
Never write `rgba(15,12,8,.5)` — that's dark-mode hardcoded and looks wrong in light mode.

### 5. Skin-aware tints use `--cx`
For colored overlays / gradients tied to the skin :
```js
background: "linear-gradient(135deg, rgba(var(--cx),.22), transparent)"
border: "1px solid rgba(var(--cx),.3)"
```

## Unified tile design (V10 tint — 2026-04-22)

Standard module tile across Train / Games / Listen-Reading hub :

```js
{
  background: "linear-gradient(135deg, rgba(var(--cx),.22), transparent)",
  border: "1.5px solid var(--cyan)",
  // …
}
// icon
<GIcon name="<icon>" size={42} color="var(--cyan)"/>
```

**Visitor-locked variant** (premium module on free account) :
```js
{
  background: "transparent",
  border: "1.5px solid var(--bdr)",
}
// icon
<GIcon name="lock" size={42} color="var(--t3)"/>
```

**Featured tile** (Boss / Endless / Daily) — keep semantic color :
```js
{
  background: "linear-gradient(135deg, rgba(224,82,82,.22), transparent)",  // Boss
  border: "1.5px solid var(--red)",
}
<GIcon name="dragon" size={42} color="var(--red)"/>
```

## CSS class shortcuts

### `.crd` — standard card
`background: var(--bg2); border: 1px solid var(--bdr); border-radius: 16px; padding: 20px;`
**Gotcha:** `.crd` forces `background: var(--bg2)`. To override, REMOVE the class — don't try to override via inline style (specificity battles).

### `.btn2` — secondary button
`background: var(--bg2); border: 1px solid var(--bdr); color: var(--t1); border-radius: 12px;`

### `.back-btn` — top-left back navigation
Single canonical pattern. `← Back` label. 40px min-height. Never re-inline `style={{background:"none",border:"none"...}}`. Use the class.

### `.tab-bar` — desktop sidebar
Fixed 200px left sidebar on desktop. Don't touch unless you're refactoring the navigation.

### `.app` — root wrapper
Centers content max-width 430px. `.app:not(.onboard-shell)` allows onboarding to skip the desktop sidebar margin.

### `.onboard-shell` — onboarding override
Required on wrapper AND every Onboard phase div to skip the desktop sidebar margin.

## Skin list (for testing)

When making a visual change, mentally test on these :
- `default` (Doré, dark) — orange/gold
- `argent` — silver
- `emeraude` — emerald green
- `saphir` — sapphire blue
- `rubis` — ruby red
- `amethyste` — amethyst purple
- `corail` — coral
- `jade` — teal
- `obsidienne` — purple-tinted dark (overrides --bg/--bg2/--bg3)
- `aurore` — turquoise (overrides --bg/--bg2/--bg3)
- All of the above × `.light` mode

If you used `var(--cyan)` and `var(--bg2)` correctly, all 18 variants Just Work.

## Past bugs to avoid

- **CSS animation + `!important` + shorthand** : never use `background:` shorthand with `!important` on animated elements. Use `background-image:` longhand. (`feedback_css_animation_important.md`)
- **Hardcoded `rgba(15,12,8,...)`** in gradient overlays → broken in light mode. Use `rgba(var(--bg-rgb),...)`.
- **Hardcoded `#d4943a`** anywhere → broken on every non-default skin. Use `var(--cyan)`.
- **Shimmer overlays** use `::after` pseudo-elements with `position:relative!important; overflow:hidden!important` on parent.
