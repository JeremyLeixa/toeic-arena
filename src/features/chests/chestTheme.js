// ═══════════════════════════════════════════════════════════════
// Couleurs de l'ouverture de coffre v3, partagées par Chests.jsx et ChestCards.jsx
// (un .jsx n'exporte que des composants). Fond sombre fixe : hex bruts voulus, jamais
// tone() — une variante « mode clair » foncée serait illisible sur ce fond.
// ═══════════════════════════════════════════════════════════════
import { RARITIES } from "../../data/chests.js";

// Lumière (tell, halo, particules) : version claire de chaque rareté ; -1 = neutre (Novice)
export var TELL_LIGHT = ["#e4e4e4", "#7dffb0", "#78bcff", "#e094ff", "#ffd65a"];
export var TELL_NEUTRAL = "#ffdca8";
export function tellColor(tier) { return tier >= 0 ? TELL_LIGHT[tier] : TELL_NEUTRAL; }

// Bordure et lueur d'une carte : rareté de l'objet, ou or neutre pour monnaies et tokens
export var NEUTRAL_BORDER = "#8a6a3a";
export var NEUTRAL_GLOW = "#e8c890";
export function rarityInfo(tier) { return tier === null || tier === undefined || tier < 0 ? null : RARITIES[tier]; }
export function groupBorder(g) { var r = rarityInfo(g.rarity); return r ? r.color : NEUTRAL_BORDER; }
export function groupGlow(g) { return g.rarity === null || g.rarity === undefined ? NEUTRAL_GLOW : TELL_LIGHT[g.rarity]; }

// Rareté affichée du coffre fermé, dans le toast
export var CHEST_TOAST_COLOR = { novice: "#909090", guerrier: "#3a8ee0", champion: "#d4943a", legendaire: "#ffc020" };
export var CHEST_TIER = { novice: 0, guerrier: 1, champion: 2, legendaire: 3 };

export function fmtNum(n) { return Number(n || 0).toLocaleString("en-US"); }
