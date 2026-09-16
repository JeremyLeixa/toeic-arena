// Extrait de src/App.jsx le 2026-09-15 (refactor split-app, REFACTOR_PLAN.md). Code déplacé tel quel.
import { GIcon } from "./icons.jsx";
import { tone } from "../lib/tone.js";

export function AchToast(p){if(!p.v)return null;
  return(<div style={{position:"fixed",top:60,left:"50%",transform:"translateX(-50%)",zIndex:250,animation:"achPop 3.5s ease-out forwards",pointerEvents:"none",textAlign:"center"}}>
    <div style={{background:"linear-gradient(135deg,#1a1610,#201a12)",border:"1px solid rgba(255,215,0,.3)",padding:"16px 28px",borderRadius:20,boxShadow:"0 8px 40px rgba(255,215,0,.25)",minWidth:220}}>
      <div style={{fontSize:40,marginBottom:6,animation:"pulse 1s infinite"}}>{p.v.icon}</div>
      <div className="out" style={{fontSize:10,fontWeight:700,color:/*fond local*/"#f0c850",textTransform:"uppercase",letterSpacing:2,marginBottom:4}}>Achievement Unlocked!</div>
      <div className="out" style={{fontWeight:800,fontSize:18,color:/*fond local*/"#ede4d4",marginBottom:2}}>{p.v.name}</div>
      <div style={{fontSize:12,color:/*fond local*/"#8a7e6a"}}>{p.v.desc}</div>
    </div>
  </div>);}
// Arena Shop P1 (2026-05-29) — Daric grant toast. Sits below XpToast (top:118)
// so both can coexist when a chest open or focus completion fires alongside XP.
export function MarksToast(p){if(!p.v)return null;
  return(<div style={{position:"fixed",top:118,left:"50%",transform:"translateX(-50%)",zIndex:200,animation:"xpPop 3.5s ease-out forwards",pointerEvents:"none",textAlign:"center"}}>
    <div style={{background:"linear-gradient(135deg,#e8c45a,#a8801f)",color:"#1a1208",padding:"8px 20px",borderRadius:99,fontWeight:800,fontSize:18,boxShadow:"0 4px 20px rgba(232,196,90,.4)",display:"inline-flex",alignItems:"center",gap:7}} className="out"><GIcon name="daric" size={18} color="#1a1208"/> +{p.v} Darics</div>
  </div>);}
// Arena Shop P1 (2026-05-29) — Daric wallet pill. Reusable in Profil hero now,
// Shop sticky-header in P2. Gold palette, NOT skin-aware (currency is a fixed
// brand element, like the XP gold, independent of equipped skin).
export function DaricPill(p){
  return(<span style={{fontSize:12,display:"inline-flex",alignItems:"center",gap:5,background:"rgba(232,196,90,.1)",color:tone("#c9a23a"),padding:"3px 10px",borderRadius:20,border:"1px solid rgba(232,196,90,.25)",fontWeight:700}}><GIcon name="daric" size={13} color={tone("#c9a23a")}/> {p.marks||0}</span>);
}
export function XpToast(p){if(!p.v)return null;
  var info=typeof p.v==="object"?p.v:{total:p.v,base:p.v,bonuses:[]};
  return(<div style={{position:"fixed",top:70,left:"50%",transform:"translateX(-50%)",zIndex:200,animation:"xpPop 3.5s ease-out forwards",pointerEvents:"none",textAlign:"center"}}>
    <div style={{background:"linear-gradient(135deg,#ffd700,#ff8c42)",color:"#000",padding:"10px 24px",borderRadius:99,fontWeight:800,fontSize:22,boxShadow:"0 4px 20px rgba(255,215,0,.4)"}} className="out">+{info.total} XP</div>
    {info.bonuses&&info.bonuses.length>0&&info.total!==info.base&&<div style={{fontSize:11,color:"var(--gold)",marginTop:4,fontWeight:600}} className="out">{info.base} base → {info.total} with bonuses</div>}
    {info.bonuses&&info.bonuses.length>0&&<div style={{marginTop:6,display:"flex",flexDirection:"column",gap:3,alignItems:"center"}}>
      {info.bonuses.map(function(b,i){return (<div key={i} style={{background:"rgba(0,0,0,.7)",padding:"3px 12px",borderRadius:99,fontSize:11,fontWeight:600,color:b.color||/*fond local*/"#f0c850"}} className="out">{b.label}</div>);})}
    </div>}
  </div>);}
