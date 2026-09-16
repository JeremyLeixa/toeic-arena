// Extrait de src/App.jsx le 2026-09-15 (refactor split-app, REFACTOR_PLAN.md). Code déplacé tel quel.
import { GAME_ICON_PATHS } from "../data/avatarIcons.js";
import { AVATARS, FRAMES } from "../data/chests.js";
import { RARITY_STYLES } from "../lib/rarityStyles.js";

// ─── Avatar renderer — handles both emoji and base64 photo ───
export function renderAv(avatar,size,frameId){
  var s=size||32;
  // ── 2 visual tiers (revised 2026-05-12) ────────────────────────────────────────
  //   Blason — AVATARS chest unlocks → SVG shield via <AvatarMedal>, SVG frame.
  //   Circle — everything else (emoji defaults + pixel art exclusives via data:/
  //            /av/* URIs) → circular crop. Emojis get a subtle skin-tinted
  //            background, pixel art gets image-rendering: pixelated. Frame =
  //            circle outline + glow, with optional gradient/animation.
  // Earlier square-rounded experiment for emojis (commit 21f90a3) was rejected
  // — the rounded square didn't sit well next to the blason in dense lists.
  if(avatar&&AVATARS[avatar]){
    return(<AvatarMedal avatarId={avatar} size={s} frameId={frameId||null}/>);
  }
  // /av/* paths = curated pixel art (image-rendering: pixelated).
  // data: URIs = user-uploaded photos (kept smooth, NO pixelated rendering — fix
  // 2026-05-12 after a student photo was mangled by the default pixel treatment).
  var hasUriPrefix=!!(avatar&&avatar.startsWith);
  var isPixelArt=hasUriPrefix&&avatar.startsWith("/av/");
  var isImage=hasUriPrefix&&(isPixelArt||avatar.startsWith("data:"));
  var inner;
  if(isImage){
    var imgStyle={width:s,height:s,borderRadius:"50%",objectFit:"cover",objectPosition:"center top",display:"inline-block",verticalAlign:"middle",flexShrink:0};
    if(isPixelArt)imgStyle.imageRendering="pixelated";
    inner=(<img src={avatar} style={imgStyle}/>);
  }else{
    inner=(<span style={{fontSize:s*0.55,lineHeight:1,display:"inline-flex",alignItems:"center",justifyContent:"center",width:s,height:s,borderRadius:"50%",background:"linear-gradient(135deg,rgba(var(--cx),.18),rgba(var(--cx),.06))",border:"1px solid var(--bdr)",boxSizing:"border-box",flexShrink:0}}>{avatar||"⚔️"}</span>);
  }
  // ── Frame application (circle) ──────────────────────────────────────────────
  // Use filter: drop-shadow (NOT box-shadow) so the glow intensity matches the
  // AvatarMedal blason rendering, which also uses drop-shadow. With box-shadow,
  // the same numeric glow value produced a much more saturated halo, making
  // circle frames feel artificially stronger than blason ones (fix 2026-05-13).
  if(frameId&&FRAMES[frameId]){
    var fr=FRAMES[frameId];
    var glowColor=fr.gradient?fr.gradient[0]:fr.color;
    var pad=Math.max(2,Math.round(s*0.06));
    var bgGrad=fr.gradient?"linear-gradient(var(--bg2),var(--bg2)),linear-gradient(135deg,"+fr.gradient.join(",")+")":null;
    var wrap={display:"inline-block",borderRadius:"50%",padding:pad,boxSizing:"content-box",verticalAlign:"middle",border:(fr.strokeWidth||3)+"px solid "+(fr.gradient?"transparent":fr.color),filter:"drop-shadow(0 0 "+(fr.glow||12)+"px "+glowColor+")"};
    if(bgGrad){wrap.backgroundImage=bgGrad;wrap.backgroundOrigin="border-box";wrap.backgroundClip="padding-box,border-box";}
    if(fr.anim)wrap.animation="frame-"+fr.anim+" 2.5s ease-in-out infinite";
    return(<span style={wrap}>{inner}</span>);
  }
  return inner;
}
export function AvatarMedal(p){
  var avatarId=p.avatarId;var size=p.size||48;var frameId=p.frameId;
  var av=AVATARS[avatarId];
  if(!av)return(<div style={{width:size,height:size,borderRadius:size*.35,background:"var(--bg3)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:size*.5}}>{"?"}</div>);
  // V3 — pixel art exclusives: delegate to renderAv() which knows how to render
  // circle crop + image-rendering: pixelated + circle frame. Keeps a single source
  // of truth for pixel rendering across all surfaces (leaderboard, profile,
  // chest reveal modal, inventory tiles, reward cards).
  if(av.type==="pixel"&&av.src)return renderAv(av.src,size,frameId);
  var rs=RARITY_STYLES[av.rarity]||RARITY_STYLES.common;
  var iconPath=GAME_ICON_PATHS[av.icon]||"";
  var frame=frameId&&FRAMES[frameId];
  // Arena Shop P2 — `css:true` frames are rendered as a circular CSS overlay (.aframe-*)
  // around the shield medal (conic rings, orbiting dots, glows) instead of an SVG stroke.
  var cssFrame=frame&&frame.css;
  var svgStyle={overflow:"visible",flexShrink:0,display:"inline-block",verticalAlign:"middle"};
  // V2 — Frame styling (drop-shadow glow + optional pulse animation) takes precedence
  // over the rarity glow, since the user-equipped frame is the explicit cosmetic choice.
  if(cssFrame){
    // inner medal stays clean — the .aframe overlay carries all the frame visuals
  }else if(frame){
    var glowColor=frame.gradient?frame.gradient[0]:frame.color;
    // Single drop-shadow keeps the outer-shield outline crisp ; double-stacking
    // softened the path into a halo that masked the shape.
    svgStyle.filter="drop-shadow(0 0 "+frame.glow+"px "+glowColor+")";
    if(frame.anim)svgStyle.animation="frame-"+frame.anim+" 2.5s ease-in-out infinite";
  }else if(rs.anim){
    svgStyle.animation=rs.anim;
  }else if(rs.glow){
    svgStyle.filter=rs.glow;
  }
  // Outer shield path for frames — slightly larger than the avatar shield (5px halo).
  var FRAME_PATH="M 50,1 L 95,16 L 95,58 C 95,80 75,93 50,102 C 25,93 5,80 5,58 L 5,16 Z";
  // Unique gradient id per render to avoid clashes across multiple AvatarMedal instances.
  var gradId=frame&&frame.gradient&&!cssFrame?("frmg-"+(frameId||"x")+"-"+Math.floor(Math.random()*1e6)):null;
  var medalSvg=(<svg viewBox="0 -3 100 110" width={size} height={size*1.10} style={svgStyle}>
    {frame&&frame.gradient&&!cssFrame&&<defs>
      <linearGradient id={gradId} x1="0%" y1="0%" x2="100%" y2="100%">
        {frame.gradient.map(function(c,i){return(<stop key={i} offset={(i/Math.max(1,frame.gradient.length-1)*100)+"%"} stopColor={c}/>);})}
      </linearGradient>
    </defs>}
    {frame&&!cssFrame&&<path d={FRAME_PATH} fill="none" stroke={frame.gradient?("url(#"+gradId+")"):frame.color} strokeWidth={frame.strokeWidth||2.5} strokeLinejoin="round"/>}
    <path d="M 50,7 L 90,20 L 90,56 C 90,76 72,88 50,96 C 28,88 10,76 10,56 L 10,20 Z" fill={rs.bg} stroke={rs.stroke} strokeWidth="1.5"/>
    <path d="M 50,13 L 84,24 L 84,54 C 84,72 67,83 50,90 C 33,83 16,72 16,54 L 16,24 Z" fill="none" stroke={rs.stroke} strokeWidth="0.7" opacity="0.35"/>
    <svg x="16" y="18" width="68" height="65" viewBox="0 0 512 512" style={{color:rs.icon}}>
      <g fill={rs.icon} dangerouslySetInnerHTML={{__html:iconPath}}/>
    </svg>
  </svg>);
  if(cssFrame){
    var wsz=Math.round(size*1.18);
    return(<span style={{position:"relative",display:"inline-flex",alignItems:"center",justifyContent:"center",width:wsz,height:wsz,flexShrink:0,verticalAlign:"middle"}}>
      <span className={"aframe aframe-"+frameId} style={{position:"absolute",inset:0,borderRadius:"50%",pointerEvents:"none"}}/>
      {medalSvg}
    </span>);
  }
  return medalSvg;
}
// ═══════════════════════════════════════════════════════════════
// TREASURE CHEST SVG — un coffre par niveau (ouverture v3, 2026-09-16)
// tier 0 Novice (bois clair, cordage) · 1 Warrior (acier bleui) · 2 Champion (bronze,
// runes gravées) · 3 Legendary (obsidienne, or, gemme, runes vivantes).
// Calques pilotés par l'animation de Chests.jsx (classes chx-* d'appCss.js) :
// chx-lid (couvercle), chx-lid-int (intérieur du couvercle ouvert), chx-mouth (lumière du
// coffre ouvert), chx-seam (fuites de lumière, couleur --chx-tell), chx-lock (serrure).
// Au repos, seuls corps et couvercle sont visibles : le même SVG sert au toast.
// ═══════════════════════════════════════════════════════════════
var CHEST_PAL=[
  {lid:["#a8743f","#7a4f26","#553518"],body:["#80552c","#4a2e14"],line:"#2e1a0a",band:["#c9a66b","#9a7a44","#6b5028"],lock:["#b8b8b8","#7a7a7a","#404040"],stud:"#8a8a8a",int:["#1a0e04","#3a2410"]},
  {lid:["#6b3f1a","#4a2a10","#2e1a08"],body:["#553015","#2a1606"],line:"#1a0d04",band:["#9ab8d2","#56769a","#2b3f55"],lock:["#dce8f4","#8aa2ba","#3a4a5c"],stud:"#c0d4e6",int:["#0e0804","#2a1a0c"]},
  {lid:["#8a4226","#5e2a18","#3a160a"],body:["#662e1a","#2e1208"],line:"#1e0a04",band:["#eab45a","#b07830","#5e3c12"],lock:["#ffe596","#e0a830","#8a5a10"],stud:"#f0c060",int:["#140804","#34180c"]},
  {lid:["#453a58","#261d36","#120c1a"],body:["#2e2640","#0e0a14"],line:"#07040c",band:["#ffe690","#e3ad35","#7a5010"],lock:["#fff0b0","#f0bc40","#8a5a10"],stud:"#ffd870",int:["#07040c","#221a30"]},
];
function chestGrad(id,cols){
  return(<linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
    {cols.map(function(c,i){return <stop key={i} offset={Math.round(i/(cols.length-1)*100)+"%"} stopColor={c}/>;})}
  </linearGradient>);
}
var CHEST_RAYS=[[20,-26],[55,-10],[90,0],[125,10],[160,26]];
var CHEST_BODY_RUNES=["M 28 112 l 6 -8 l 6 8 M 34 104 v 14","M 68 110 h 10 M 73 104 v 14 l 5 -4","M 104 104 l 8 14 M 112 104 l -8 14","M 142 104 v 14 l 8 -7 l -8 -7"];
export function TreasureChestSvg(p){
  var size=p.size||180;
  var tier=Math.max(0,Math.min(3,p.tier||0));
  var P=CHEST_PAL[tier], u="chx"+(p.idSuffix||"def");
  function url(k){return "url(#"+u+k+")";}
  var tellStop={stopColor:"var(--chx-tell,#ffdca8)"};
  return(
  <svg className="chx-svg" viewBox="-10 -30 200 200" width={size} height={size} style={{overflow:"visible"}} aria-hidden="true">
    <defs>
      {chestGrad(u+"l",P.lid)}{chestGrad(u+"b",P.body)}{chestGrad(u+"m",P.band)}{chestGrad(u+"k",P.lock)}{chestGrad(u+"i",P.int)}
      <radialGradient id={u+"mouth"} cx="50%" cy="80%" r="70%"><stop offset="0%" stopColor="#fff"/><stop offset="35%" style={tellStop}/><stop offset="100%" style={tellStop} stopOpacity="0.15"/></radialGradient>
      <linearGradient id={u+"ray"} x1="0" y1="1" x2="0" y2="0"><stop offset="0%" style={tellStop} stopOpacity="0.95"/><stop offset="100%" style={tellStop} stopOpacity="0"/></linearGradient>
      <filter id={u+"blur"} x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="2.6"/></filter>
      {tier===3&&<linearGradient id={u+"gem"} x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stopColor="#fff6c8"/><stop offset="45%" stopColor="#ffc020"/><stop offset="100%" stopColor="#9a5a00"/></linearGradient>}
    </defs>
    <ellipse cx="90" cy="148" rx="82" ry="9" fill="#000" opacity="0.55"/>
    {/* Intérieur du couvercle, visible une fois ouvert (pivot sur l'arrière) */}
    <g className="chx-lid-int">
      <path d="M 16 55 Q 16 18 90 18 Q 164 18 164 55 Z" fill={url("i")} stroke={P.line} strokeWidth="1.5"/>
      <path d="M 16 55 Q 16 18 90 18 Q 164 18 164 55" fill="none" stroke={url("m")} strokeWidth="4"/>
      <path d="M 24 55 Q 26 30 90 28 Q 154 30 156 55 Z" style={{fill:"var(--chx-tell,#ffdca8)"}} opacity="0.35"/>
    </g>
    <path className="chx-mouth" d="M 10 66 L 20 52 L 160 52 L 170 66 Z" fill={url("mouth")}/>
    {/* Corps */}
    <g>
      <rect x="10" y="65" width="160" height="80" rx="3" fill={url("b")} stroke={P.line} strokeWidth="1.5"/>
      {[50,90,130].map(function(x){return <line key={x} x1={x} y1="68" x2={x} y2="142" stroke={P.line} strokeWidth="1" opacity="0.7"/>;})}
      {[[63,6],[100,4],[138,5]].map(function(b){return(<g key={b[0]}>
        <rect x="8" y={b[0]} width="164" height={b[1]} fill={url("m")} stroke={P.line} strokeWidth="0.5"/>
        {tier===0&&<line x1="8" y1={b[0]+b[1]/2} x2="172" y2={b[0]+b[1]/2} stroke="#5a3e1c" strokeWidth="1.4" strokeDasharray="3 2.5"/>}
      </g>);})}
      {[[14,66],[166,66],[14,141],[166,141]].map(function(q){return <circle key={q[0]+"_"+q[1]} cx={q[0]} cy={q[1]} r="1.9" fill={P.stud}/>;})}
      <rect x="12" y="138" width="18" height="8" rx="1" fill={url("m")}/><rect x="150" y="138" width="18" height="8" rx="1" fill={url("m")}/>
      {tier===1&&<>
        <path d="M 10 69 L 30 69 L 10 89 Z M 170 69 L 150 69 L 170 89 Z" fill={url("m")} stroke={P.line} strokeWidth="0.6"/>
        {[22,38,54,70,86,102,118,134,150,166].map(function(x){return <circle key={x} cx={x} cy="102" r="1.1" fill={P.stud}/>;})}
      </>}
      {tier===2&&[30,150].map(function(cx){return(<g key={cx}>
        <circle cx={cx} cy="120" r="8" fill="none" stroke={url("m")} strokeWidth="2"/>
        <path d={"M "+(cx-4)+" 120 L "+cx+" 114 L "+(cx+4)+" 120 L "+cx+" 126 Z"} fill={P.stud} opacity="0.8"/>
      </g>);})}
      {tier===3&&<>
        {CHEST_BODY_RUNES.map(function(d){return <path key={d} className="chx-rune" d={d} fill="none" stroke="#ffd060" strokeWidth="1.6" strokeLinecap="round"/>;})}
        <path d="M 10 69 q 16 2 18 16 q -8 -6 -18 -4 Z M 170 69 q -16 2 -18 16 q 8 -6 18 -4 Z" fill={url("m")}/>
      </>}
      <g className="chx-lock">
        <rect x="77" y="77" width="26" height="24" rx="2" fill={url("k")} stroke={P.line} strokeWidth="1"/>
        {tier===3?<>
          <path d="M 90 80 L 99 89 L 90 99 L 81 89 Z" fill={url("gem")} stroke="#6a3c00" strokeWidth="0.8"/>
          <path d="M 90 80 L 94 89 L 90 99 M 81 89 H 99" stroke="#fff6c8" strokeWidth="0.5" opacity="0.7" fill="none"/>
        </>:<>
          <circle cx="90" cy="86" r="3" fill="#120a04"/><path d="M 88.5 86 L 91.5 86 L 91 94 L 89 94 Z" fill="#120a04"/>
        </>}
        <rect x="79" y="78" width="22" height="3" rx="1" fill="rgba(255,250,220,0.45)"/>
      </g>
    </g>
    {/* Couvercle */}
    <g className="chx-lid">
      <path d="M 10 65 Q 10 15 90 15 Q 170 15 170 65 Z" fill={url("l")} stroke={P.line} strokeWidth="1.5"/>
      <path d="M 50 65 Q 55 25 65 20 M 130 65 Q 125 25 115 20" fill="none" stroke={P.line} strokeWidth="1" opacity="0.6"/>
      <path d="M 10 65 Q 10 15 90 15 Q 170 15 170 65" fill="none" stroke={url("m")} strokeWidth="5"/>
      <rect x="86" y="16" width="8" height="49" fill={url("m")}/>
      {tier>=2&&<path className={tier===3?"chx-rune":undefined} d="M 38 44 l 5 -7 l 5 7 M 60 32 v 10 l 5 -5 M 115 32 v 10 l -5 -5 M 132 44 l 5 -7 l 5 7" fill="none" stroke={tier===3?"#ffd060":"#e8b060"} strokeWidth="1.5" strokeLinecap="round" opacity={tier===3?1:0.55}/>}
      {tier===3&&<path d="M 90 4 L 97 15 L 90 13 L 83 15 Z" fill={url("m")} stroke={P.line} strokeWidth="0.6"/>}
      <circle cx="90" cy="19" r="2.2" fill={P.stud} stroke={P.line} strokeWidth="0.5"/>
      <rect x="84" y="58" width="12" height="12" rx="1" fill={url("k")} stroke={P.line} strokeWidth="1"/>
    </g>
    {/* Fuites de lumière (opacité pilotée par les classes chx-lvl1..3 du parent) */}
    <g className="chx-seam">
      {CHEST_RAYS.map(function(r){return <path key={r[0]} className="chx-ray" d={"M "+(r[0]-3)+" 65 L "+(r[0]+r[1]-9)+" -20 L "+(r[0]+r[1]+9)+" -20 L "+(r[0]+3)+" 65 Z"} fill={url("ray")}/>;})}
      <path d="M 12 65 L 168 65" style={{stroke:"var(--chx-tell,#ffdca8)"}} strokeWidth="5" filter={url("blur")}/>
      <path d="M 14 65 L 166 65" stroke="#fff" strokeWidth="1.3" opacity="0.9"/>
      <circle cx="90" cy="89" r="7" style={{fill:"var(--chx-tell,#ffdca8)"}} filter={url("blur")}/>
    </g>
  </svg>);
}
