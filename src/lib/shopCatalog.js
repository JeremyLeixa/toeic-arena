// Extrait de src/App.jsx le 2026-09-15 (refactor split-app, REFACTOR_PLAN.md). Code déplacé tel quel.
import { RARITIES, SKINS, FRAMES, TITLES, CHEAT_SHEETS, TOKEN_TYPES } from "../data/chests.js";

// V2 step 5 — Conversions sub-view : trade duplicate cosmetics for tokens, or 5 non-premium
// tokens for 1 premium. Mounted from the Shop (P2b) ; was a Profile sub-view pre-P2b.
// ═══ ARENA SHOP (P2a, 2026-06-01) ═══
// Spend Darics on shop-exclusive cosmetics, tokens, and cheat sheets. Conversions
// (dups → token, tokens → premium) reachable via the in-shop Conversions sub-view
// (reuses ConversionsView). Buying is atomic server-side (spend_marks RPC, via
// p.buy → shopBuy). Owned one-shots grey out (anti-rebuy), tokens grey at cap. A
// confirm step guards accidental spends (no refund on cosmetics by design). The
// Shop entry point is visitor-blocked (currency never accrues for visitors).
export var SHOP_SECTIONS=[
  {key:"skin",label:"Skins"},
  {key:"frame",label:"Frames"},
  {key:"title",label:"Titles"},
  {key:"boost",label:"XP Boosts"},
  {key:"token",label:"Tokens"},
  {key:"cheat_sheet",label:"Cheat Sheets"},
];
export function shopRarColor(rid){for(var i=0;i<RARITIES.length;i++){if(RARITIES[i].id===rid)return RARITIES[i].color;}return "var(--bdr)";}
export function shopItemName(item){
  var m=item.cat==="skin"?SKINS:item.cat==="frame"?FRAMES:item.cat==="title"?TITLES:item.cat==="cheat_sheet"?CHEAT_SHEETS:item.cat==="token"?TOKEN_TYPES:null;
  return (m&&m[item.ref]&&m[item.ref].name)||item.ref;
}
export function shopItemDesc(item){
  if(item.cat==="token")return (TOKEN_TYPES[item.ref]||{}).desc||"";
  if(item.cat==="cheat_sheet")return "Cheat sheet — unlocks in your codex";
  var r=item.rarity||"";return r.charAt(0).toUpperCase()+r.slice(1)+" · shop exclusive";
}
