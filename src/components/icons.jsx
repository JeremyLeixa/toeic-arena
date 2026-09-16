// Extrait de src/App.jsx le 2026-09-15 (refactor split-app, REFACTOR_PLAN.md). Code déplacé tel quel.
import { GAME_ICON_PATHS } from "../data/avatarIcons.js";
import { SEASON_GI, RESULT_GI } from "../lib/iconMaps.js";
import { tone } from "../lib/tone.js";

// ─── BRAND MARK ───
// Verse Arena logo ("plume & épée"): steel sword crossed with a gold quill.
// Single source of truth for the launch identity — loading screen + onboarding hero,
// and matches the app icon / favicon (public/icon-*.png, favicon.svg) exactly.
// Colors are brand-FIXED (gold/steel), deliberately NOT skin-tinted, so the mark
// stays constant across skins and never desyncs from the installed app icon.
export function BrandMark(p){
  var s=p.size||94;
  return(<svg width={s} height={s} viewBox="0 0 100 100" style={Object.assign({display:"block"},p.style||{})} aria-hidden="true">
    <defs>
      <linearGradient id="bmGold" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#f9dd84"/><stop offset="1" stopColor="#dca02e"/></linearGradient>
      <linearGradient id="bmSteel" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#efe3c6"/><stop offset="1" stopColor="#a89878"/></linearGradient>
    </defs>
    <g transform="rotate(-45 50 50)">
      <path d="M50 8 L53 15 L53 57 L47 57 L47 15 Z" fill="url(#bmSteel)"/>
      <path d="M50 13 L50 55" fill="none" stroke="#c9bfa6" strokeWidth="1" opacity="0.55"/>
      <path d="M36 57 L64 57 L61 63 L39 63 Z" fill="url(#bmGold)"/>
      <rect x="47.5" y="63" width="5" height="13" rx="1.5" fill="#6e4a24"/>
      <path d="M48 66.5 L52 66.5 M48 69.5 L52 69.5 M48 72.5 L52 72.5" fill="none" stroke="#3f2a14" strokeWidth="1"/>
      <circle cx="50" cy="79" r="3.6" fill="url(#bmGold)"/>
    </g>
    <g transform="rotate(45 50 50)">
      <path d="M50 9 C43 19 41 33 43 44 C44 51 46 57 48 61 L50 63 L52 61 C54 57 56 51 57 44 C59 33 57 19 50 9 Z" fill="url(#bmGold)"/>
      <path d="M50 20 L44.5 17 M50 28 L43.5 26 M50 37 L44 36 M50 46 L45 46" fill="none" stroke="#b9791a" strokeWidth="1.2" strokeLinecap="round"/>
      <path d="M50 20 L55.5 17 M50 28 L56.5 26 M50 37 L56 36 M50 46 L55 46" fill="none" stroke="#b9791a" strokeWidth="1.2" strokeLinecap="round"/>
      <path d="M50 13 L50 78" fill="none" stroke="#8f5f16" strokeWidth="1.7" strokeLinecap="round"/>
      <path d="M50 72 L47.4 78 L50 76 L52.6 78 Z" fill="url(#bmGold)"/>
    </g>
  </svg>);
}
// ─── GAME-ICON SVG HELPER ───
// Renders an Iconify game-icons SVG by name. Use: <GIcon name="castle" size={26} color="var(--cyan)"/>
export function GIcon(p){
  var pth=GAME_ICON_PATHS[p.name]||"";
  var sz=p.size||20;
  var sty=Object.assign({color:p.color||"currentColor",display:p.block?"block":"inline-block",verticalAlign:"middle",flexShrink:0},p.style||{});
  return(<svg viewBox="0 0 512 512" width={sz} height={sz} style={sty}><g fill="currentColor" dangerouslySetInnerHTML={{__html:pth}}/></svg>);
}
// Tier badge for a league object {gi,icon,color}: SVG medal/gem/crown tinted by tier
// color, with emoji fallback if the icon is missing. (audit 2026-06-25 — replaces the
// 🥇🥈🥉💎👑🏆⚡ tier emojis app-wide.)
export function LeagueIcon(p){
  var lg=p.lg||{};var sz=p.size||20;
  if(GAME_ICON_PATHS[lg.gi])return(<GIcon name={lg.gi} size={sz} color={p.color||tone(lg.color)||"var(--gold)"} style={p.style}/>);
  return(<span style={Object.assign({fontSize:sz,lineHeight:1},p.style||{})}>{lg.icon}</span>);
}
export function SeasonIcon(p){
  var sz=p.size||20;var gi=SEASON_GI[(p.icon||" ").codePointAt(0)];
  if(gi&&GAME_ICON_PATHS[gi])return(<GIcon name={gi} size={sz} color={p.color||"var(--gold)"} style={p.style}/>);
  return(<span style={Object.assign({fontSize:sz,lineHeight:1},p.style||{})}>{p.icon}</span>);
}
export function ResultIcon(p){
  var m=RESULT_GI[(p.e||" ").codePointAt(0)];var sz=p.size||52;
  if(m&&GAME_ICON_PATHS[m[0]])return(<GIcon name={m[0]} size={sz} color={p.color||m[1]}/>);
  return(<span style={{fontSize:sz,lineHeight:1}}>{p.e}</span>);
}
