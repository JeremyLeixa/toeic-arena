// Extrait de src/App.jsx le 2026-09-15 (refactor split-app, REFACTOR_PLAN.md). Code déplacé tel quel.

// Season emoji → game-icon. Seasons carry an emoji icon in data (🌱🔥⚔️🏆…); map to
// SVG so the banner/chips/hero match the rest of the chrome. (audit 2026-06-25)
export var SEASON_GI={0x1F331:"oak-leaf",0x1F525:"flame",0x2694:"crossed-swords",0x1F3C6:"trophy-cup",0x2B50:"star-formation",0x26A1:"lightning-storm"};
// Result-screen tier icon: maps the celebration emoji a screen already computes
// (🏆/⚔️/🛡️/👑/⚡…) to a tinted game-icon, emoji fallback for anything unmapped.
// Variation-selector (FE0F) stripped so ⚔️/🛡️/⚖️ match. (audit 2026-06-25)
export var RESULT_GI={0x1F3C6:["trophy-cup","var(--gold)"],0x1F451:["crown","var(--gold)"],0x2694:["crossed-swords","var(--cyan)"],0x1F6E1:["templar-shield","var(--t2)"],0x26A1:["lightning-storm","var(--gold)"],0x1F525:["flame","var(--orange)"],0x1F4AA:["biceps","var(--cyan)"],0x1F4D6:["spell-book","var(--t2)"],0x1F4DA:["bookshelf","var(--t2)"],0x1F9ED:["path-distance","var(--cyan)"],0x1F4DC:["scroll-unfurled","var(--t2)"],0x2696:["scales","var(--cyan)"],0x1F3AF:["bullseye","var(--cyan)"],0x2705:["check-mark","var(--green)"],0x1F512:["padlock","var(--t3)"],0x23F3:["sands-of-time","var(--endless)"],0x1F680:["rocket","var(--cyan)"]};

// Token de coffre → game-icon (ouverture v3, 2026-09-16). TOKEN_TYPES garde ses emojis en
// données (Collection, Shop) ; l'écran de révélation n'affiche que du SVG. Repli emoji si absent.
export var TOKEN_GI={diminishing_bypass:"padlock-open",streak_shield:"templar-shield",daily_reroll:"rolling-dices",mock_reset:"scroll-quill",boss_reset:"dragon-head",endless_resurrect:"infinity",insight_token:"crystal-ball"};
