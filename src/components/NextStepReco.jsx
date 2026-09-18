// Extrait de src/App.jsx le 2026-09-15 (refactor split-app, REFACTOR_PLAN.md). Code déplacé tel quel.
import { todayMission, thawQuest, questDone } from "../lib/planner.js";
import { questView } from "../lib/mentorVoice.js";
import { GIcon } from "./icons.jsx";

// ═══════════════════════════════════════════════════════════════════════
// NextStepReco — drop-in card for module done screens (Drill, Tavern, Listening…).
// Depuis le lot 4 du Mentor (2026-09-18) : la prochaine quête NON FAITE du plan figé du jour (u.mission,
// lib/planner.js), autre que le module qu'on vient de jouer. La même réponse que le Mentor, au lieu d'un
// 4e recommandeur (« ta partie la plus faible », en précision cumulée) qui pouvait le contredire. Rien
// quand le plan du jour est bouclé : l'élève a fait ce qu'Aldric demandait.
// À l'écran de fin, p.u est déjà le profil APRÈS la session (sv() a relancé le rendu) : la quête qu'on
// vient de finir est cochée.
// ═══════════════════════════════════════════════════════════════════════
export function NextStepReco(p){
  var u=p.u,now=new Date(),m=u&&todayMission(u,now);
  if(!m)return null;
  var i=m.quests.findIndex(function(q,k){return q.mod!==p.fromMod&&!questDone(u,m,k,now);});
  if(i<0)return null;
  var q=thawQuest(m.quests[i],u,now),v=questView(q,u,i===m.pick);
  return(<button onClick={function(){if(p.nav)p.nav(q.mod);}}
    style={{width:"100%",marginTop:12,padding:"12px 14px",background:"rgba(139,92,246,.06)",border:"1px solid rgba(139,92,246,.25)",borderRadius:12,cursor:"pointer",display:"flex",alignItems:"center",gap:10,fontFamily:"'DM Sans',sans-serif",textAlign:"left"}}>
    <GIcon name={v.icon} size={18} color="var(--purple)"/>
    <div style={{flex:1,minWidth:0}}>
      <div className="out" style={{fontWeight:700,fontSize:12,color:"var(--purple)"}}>{"Next quest: "+v.title}</div>
      <div style={{fontSize:10,color:"var(--t2)",marginTop:1}}>{"Today's path · "+v.tag}</div>
    </div>
    <span style={{fontSize:14,color:"var(--purple)"}}>{"›"}</span>
  </button>);
}
