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
// TREASURE CHEST SVG — reusable wooden chest (scales to any size)
// Used in both ChestEarnedToast (small, wiggling) and ChestOpenModal (large, exploding)
// ═══════════════════════════════════════════════════════════════
export function TreasureChestSvg(p){
  var size=p.size||180;
  var animationClass=p.animationClass||"";
  return(
  <svg viewBox="0 0 180 150" width={size} height={size*150/180} style={{overflow:"visible"}} aria-hidden="true">
    <defs>
      <linearGradient id={"woodLid_"+(p.idSuffix||"def")} x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stopColor="#8b5a2b"/><stop offset="60%" stopColor="#6b3f1a"/><stop offset="100%" stopColor="#4a2a10"/>
      </linearGradient>
      <linearGradient id={"woodBody_"+(p.idSuffix||"def")} x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stopColor="#6b3f1a"/><stop offset="100%" stopColor="#3a1f0a"/>
      </linearGradient>
      <linearGradient id={"metalBand_"+(p.idSuffix||"def")} x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stopColor="#6a4e20"/><stop offset="50%" stopColor="#4a3614"/><stop offset="100%" stopColor="#2e2008"/>
      </linearGradient>
      <linearGradient id={"goldLock_"+(p.idSuffix||"def")} x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stopColor="#f0c850"/><stop offset="50%" stopColor="#d4943a"/><stop offset="100%" stopColor="#8b5e20"/>
      </linearGradient>
    </defs>
    {/* Body (bottom half) */}
    <g className={"chest-body-group "+(animationClass==="explode"?"chest-v2-body-explode":"")}>
      <rect x="10" y="65" width="160" height="80" rx="3" fill={"url(#woodBody_"+(p.idSuffix||"def")+")"} stroke="#2a1509" strokeWidth="1.5"/>
      <line x1="50" y1="68" x2="50" y2="142" stroke="#2a1509" strokeWidth="1" opacity="0.7"/>
      <line x1="90" y1="68" x2="90" y2="142" stroke="#2a1509" strokeWidth="1" opacity="0.7"/>
      <line x1="130" y1="68" x2="130" y2="142" stroke="#2a1509" strokeWidth="1" opacity="0.7"/>
      <rect x="8" y="63" width="164" height="6" fill={"url(#metalBand_"+(p.idSuffix||"def")+")"} stroke="#1a1005" strokeWidth="0.5"/>
      <rect x="8" y="100" width="164" height="4" fill={"url(#metalBand_"+(p.idSuffix||"def")+")"} stroke="#1a1005" strokeWidth="0.5"/>
      <rect x="8" y="138" width="164" height="5" fill={"url(#metalBand_"+(p.idSuffix||"def")+")"} stroke="#1a1005" strokeWidth="0.5"/>
      <circle cx="14" cy="66" r="1.8" fill="#8b6a30"/><circle cx="166" cy="66" r="1.8" fill="#8b6a30"/>
      <circle cx="14" cy="141" r="1.8" fill="#8b6a30"/><circle cx="166" cy="141" r="1.8" fill="#8b6a30"/>
      <rect x="12" y="138" width="18" height="8" rx="1" fill={"url(#metalBand_"+(p.idSuffix||"def")+")"}/>
      <rect x="150" y="138" width="18" height="8" rx="1" fill={"url(#metalBand_"+(p.idSuffix||"def")+")"}/>
      <rect x="78" y="78" width="24" height="22" rx="2" fill={"url(#goldLock_"+(p.idSuffix||"def")+")"} stroke="#5a3c10" strokeWidth="1"/>
      <circle cx="90" cy="86" r="3" fill="#1a1005"/>
      <path d="M 88.5 86 L 91.5 86 L 91 94 L 89 94 Z" fill="#1a1005"/>
      <rect x="80" y="79" width="20" height="3" rx="1" fill="rgba(255,240,180,0.5)"/>
    </g>
    {/* Lid (top half) */}
    <g className={"chest-lid-group "+(animationClass==="explode"?"chest-v2-lid-fly":"")}>
      <path d="M 10 65 Q 10 15 90 15 Q 170 15 170 65 Z" fill={"url(#woodLid_"+(p.idSuffix||"def")+")"} stroke="#2a1509" strokeWidth="1.5"/>
      <path d="M 10 65 Q 10 15 90 15 Q 170 15 170 65" fill="none" stroke="rgba(0,0,0,0.3)" strokeWidth="1"/>
      <path d="M 50 65 Q 55 25 65 20" fill="none" stroke="#2a1509" strokeWidth="1" opacity="0.6"/>
      <path d="M 90 65 L 90 15" stroke="#2a1509" strokeWidth="1" opacity="0.6"/>
      <path d="M 130 65 Q 125 25 115 20" fill="none" stroke="#2a1509" strokeWidth="1" opacity="0.6"/>
      <path d="M 10 65 Q 10 15 90 15 Q 170 15 170 65" fill="none" stroke={"url(#metalBand_"+(p.idSuffix||"def")+")"} strokeWidth="5"/>
      <rect x="87" y="16" width="6" height="49" fill={"url(#metalBand_"+(p.idSuffix||"def")+")"}/>
      <circle cx="90" cy="19" r="2" fill="#d4943a" stroke="#5a3c10" strokeWidth="0.5"/>
      <rect x="85" y="60" width="10" height="10" fill={"url(#goldLock_"+(p.idSuffix||"def")+")"} stroke="#5a3c10" strokeWidth="1"/>
    </g>
  </svg>);
}
