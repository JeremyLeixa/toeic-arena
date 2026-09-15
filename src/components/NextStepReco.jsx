// Extrait de src/App.jsx le 2026-09-15 (refactor split-app, REFACTOR_PLAN.md). Code déplacé tel quel.
import { bsScanParts, partAccuracies, partOfModule } from "../lib/toeic.js";
import { GIcon } from "./icons.jsx";

// ═══════════════════════════════════════════════════════════════════════
// NextStepReco — drop-in card for module done screens. Suggests the part
// where the user is currently weakest (excluding the one they just did).
// Used in Drill/Tavern/Listening done screens for V1, expandable later.
// ═══════════════════════════════════════════════════════════════════════
export function NextStepReco(p){
  var u=p.u,fromMod=p.fromMod,nav=p.nav;
  if(!u||!u.moduleScores)return null;
  var totalQ=(u.stats&&u.stats.totalQ)||0;
  var hasScan=!!bsScanParts(u);
  if(totalQ<20&&!hasScan)return null;
  var pa=partAccuracies(u.moduleScores,bsScanParts(u));
  var fromPart=partOfModule(fromMod);
  var labels={p1:"Part 1 — Photographs",p2:"Part 2 — Q&R",p3:"Part 3 — Conversations",p4:"Part 4 — Talks",p5:"Part 5 — Grammar & Vocab",p6:"Part 6 — Text Completion",p7:"Part 7 — Reading",vocab:"Vocabulary"};
  var reco={p1:"lisP1",p2:"lisP2",p3:"lisP3",p4:"lisP4",p5:"drill",p6:"p6",p7:"p7",vocab:"tavern"};
  var pickFrom=null;
  Object.keys(pa).forEach(function(k){
    if(k===fromPart)return; // suggest something different than what they just did
    var d=pa[k];if(!d)return;
    var minN=d.source==="scan"?5:10;
    if(d.n<minN)return;
    if(!pickFrom||d.acc<pickFrom.acc)pickFrom={partId:k,acc:d.acc};
  });
  if(!pickFrom||pickFrom.acc>=0.85)return null;
  var accPct=Math.round(pickFrom.acc*100);
  return(<button onClick={function(){if(nav)nav(reco[pickFrom.partId]);}}
    style={{width:"100%",marginTop:12,padding:"12px 14px",background:"rgba(139,92,246,.06)",border:"1px solid rgba(139,92,246,.25)",borderRadius:12,cursor:"pointer",display:"flex",alignItems:"center",gap:10,fontFamily:"'DM Sans',sans-serif",textAlign:"left"}}>
    <GIcon name="path-distance" size={18} color="var(--purple)"/>
    <div style={{flex:1,minWidth:0}}>
      <div className="out" style={{fontWeight:700,fontSize:12,color:"var(--purple)"}}>{"Next: "+labels[pickFrom.partId]}</div>
      <div style={{fontSize:10,color:"var(--t2)",marginTop:1}}>{"Your weakest remaining area ("+accPct+"%)"}</div>
    </div>
    <span style={{fontSize:14,color:"var(--purple)"}}>{"›"}</span>
  </button>);
}
