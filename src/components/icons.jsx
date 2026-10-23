// Extrait de src/App.jsx le 2026-09-15 (refactor split-app, REFACTOR_PLAN.md). Code déplacé tel quel.
import { GAME_ICON_PATHS } from "../data/avatarIcons.js";
import { SEASON_GI, RESULT_GI } from "../lib/iconMaps.js";
import { tone } from "../lib/tone.js";

// ─── BRAND MARK ───
// Verse Arena logo « Nib Sword » (2026-10-23, kit prototypes/logo/nib-sword) : une plume métallique dont
// la fente et le trou d'aération dessinent une épée en réserve. Même tracé que les icônes d'app et le
// favicon (public/icon-*.png, favicon.svg) : le changer = régénérer le kit (tools/wordmark.py) et public/.
// Couleur FIXE de marque (or #D4943A, or profond #6F5410 en mode clair), posée par `.brand-mark` dans
// app.css : jamais teintée par un skin, pour ne pas se désynchroniser de l'icône installée.
// Un seul contour qui entre par la fente du bec : aucun fill-rule, aucune pièce fragile.
var NIB_SWORD="M88 20 L168 20 L168 40 C186 52 196 76 196 110 C196 158 164 196 130 236 L130 210 L134 198 L138 105.74 L158.97 111.36 L162 100.04 L132 92 L132 74.25 A11 11 0 1 0 124 74.25 L124 92 L94 100.04 L97.03 111.36 L118 105.74 L122 198 L126 210 L126 236 C92 196 60 158 60 110 C60 76 70 52 88 40 Z";
export function BrandMark(p){
  var s=p.size||94;
  return(<svg className="brand-mark" width={s} height={s} viewBox="0 0 256 256" style={Object.assign({display:"block"},p.style||{})} aria-hidden="true"><path d={NIB_SWORD}/></svg>);
}
// Le nom de marque, sur deux lignes : VERSE, puis ARENA justifié sur la même largeur (comme le logo
// horizontal du kit). Texte en Cinzel 700 (police des titres, déjà chargée) plutôt que des tracés : même
// dessin que le logo vectorisé, sans 15 Ko de chemins. `size` = corps de VERSE en px.
export function BrandName(p){
  return(<span className="brand-name" role="img" aria-label="Verse Arena" style={Object.assign({fontSize:p.size||32},p.style||{})}>
    <span className="brand-name-1" aria-hidden="true">VERSE</span>
    <span className="brand-name-2" aria-hidden="true"><span>A</span><span>R</span><span>E</span><span>N</span><span>A</span></span>
  </span>);
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
