// Extrait de src/App.jsx le 2026-09-15 (refactor split-app, REFACTOR_PLAN.md). Code déplacé tel quel.
import { HubTile, HubShelf } from "../../components/HubTile.jsx";
import { hubItemStatus, hubSummary } from "../../lib/hubStatus.js";
import { GHOST_NAME, isModuleLocked } from "../../lib/access.js";
import { supabase } from "../../supabase.js";
import { useState, useEffect } from "react";

// ─── GAMES HUB ───
export function GamesHub(p){
  // Class leaderboard (top 1 per game, current class only, Teacher filtered out).
  // Fetched once at mount — lightweight JSONB read on ~tens of rows. Computes
  // single-session bests from moduleScores history for sbuild/ablitz/clue/tavern
  // (which only store cumulative correct/total, not a per-session best).
  var[classBests,setClassBests]=useState({});
  useEffect(function(){
    var cc=p.u&&p.u.classCode;
    if(!cc||cc==="visitor")return;
    // B3 : lecture des lignes des CAMARADES → passe par la vue restreinte
    // `students_public` (colonnes publiques uniquement, ligne Teacher déjà exclue
    // côté serveur). Ne pas revenir à `from("students")` : la Phase C y posera une
    // policy auth.uid()=user_id qui rendrait cette requête vide.
    supabase.from("students_public").select("name,class_code,game_scores,module_scores")
      .eq("class_code",cc)
      .neq("name",GHOST_NAME)
      .then(function(res){
        if(res.error||!res.data){console.warn("[games-leaderboard]",res.error&&res.error.message);return;}
        // Race-proofing 2026-05-26 : the fetch on mount can race the save() triggered
        // by gameDone() (sv() awaits sU but save() is fire-and-forget). Result : the
        // student's own row in res.data may be stale by a few hundred ms. Substitute
        // the current user's row with the in-memory state so the leaderboard reflects
        // their latest record immediately on hub return.
        var myName=p.u&&p.u.name;
        var rows=res.data;
        if(myName){
          rows=res.data.map(function(r){
            if(r.name!==myName)return r;
            return Object.assign({},r,{
              game_scores:(p.u.gameScores&&Object.keys(p.u.gameScores).length)?p.u.gameScores:r.game_scores,
              module_scores:(p.u.moduleScores&&Object.keys(p.u.moduleScores).length)?p.u.moduleScores:r.module_scores,
            });
          });
        }
        function bestSessionFromHistory(ms,modId){
          var m=ms&&ms[modId];if(!m||!m.history||!m.history.length)return null;
          var best=null;
          m.history.forEach(function(h){if(!h||!h.total)return;if(!best||h.correct>best.correct||(h.correct===best.correct&&h.total<best.total))best=h;});
          return best;
        }
        function pick(rows,getter,dir){
          var winner=null;var winVal=null;
          rows.forEach(function(r){
            var v=getter(r);if(v==null)return;
            if(winVal==null||(dir==="max"?v>winVal:v<winVal)){winVal=v;winner={name:r.name};}
          });
          return winner&&winVal!=null?{name:winner.name,val:winVal}:null;
        }
        var bests={};
        var tav=pick(rows,function(r){var b=bestSessionFromHistory(r.module_scores,"tavern");return b?b.correct:null;},"max");
        var tavTot=null;if(tav){rows.forEach(function(r){if(r.name===tav.name){var b=bestSessionFromHistory(r.module_scores,"tavern");if(b)tavTot=b.total;}});}
        if(tav)bests.tavern={name:tav.name,label:tav.val+"/"+(tavTot||15)};
        var sm=pick(rows,function(r){return r.game_scores&&r.game_scores.matchEasy?r.game_scores.matchEasy.time:null;},"min");
        if(sm)bests.matchE={name:sm.name,label:sm.val+"s"};
        var wf=pick(rows,function(r){return r.game_scores&&r.game_scores.wordFall?r.game_scores.wordFall.score:null;},"max");
        if(wf)bests.wfall={name:wf.name,label:wf.val+" pts"};
        var sb=pick(rows,function(r){var b=bestSessionFromHistory(r.module_scores,"sbuild");return b?b.correct:null;},"max");
        var sbTot=null;if(sb){rows.forEach(function(r){if(r.name===sb.name){var b=bestSessionFromHistory(r.module_scores,"sbuild");if(b)sbTot=b.total;}});}
        if(sb)bests.sbuild={name:sb.name,label:sb.val+"/"+(sbTot||10)};
        var ab=pick(rows,function(r){var b=bestSessionFromHistory(r.module_scores,"ablitz");return b?b.correct:null;},"max");
        var abTot=null;if(ab){rows.forEach(function(r){if(r.name===ab.name){var b=bestSessionFromHistory(r.module_scores,"ablitz");if(b)abTot=b.total;}});}
        if(ab)bests.ablitz={name:ab.name,label:ab.val+"/"+(abTot||10)};
        var cl=pick(rows,function(r){var b=bestSessionFromHistory(r.module_scores,"clue");return b?b.correct:null;},"max");
        var clTot=null;if(cl){rows.forEach(function(r){if(r.name===cl.name){var b=bestSessionFromHistory(r.module_scores,"clue");if(b)clTot=b.total;}});}
        if(cl)bests.clue={name:cl.name,label:cl.val+"/"+(clTot||10)};
        var du=pick(rows,function(r){return r.game_scores&&r.game_scores.duel?r.game_scores.duel.wins:null;},"max");
        if(du&&du.val>0)bests.duel={name:du.name,label:du.val+" win"+(du.val>1?"s":"")};
        setClassBests(bests);
      });
  },[p.u&&p.u.classCode]);

  var games=[
    // The Waygates (2026-09-24) : hub des modules thématiques, en tête. `plain` : pas de coffre ni de tarif propre
    // (Nine to Five compte dans lisP3/lisP4/p7) ; la ligne dit le grade du joueur dans le premier monde.
    {id:"waygates",n:"The Waygates",d:"4 worlds · Nine to Five, Jet Lag, Front Desk, Opening Night",i:"magic-portal",bg:"linear-gradient(135deg,var(--cx-hex),#1B70CF)",tag:"NEW",plain:true},
    {id:"tavern",n:"Word Tavern",d:"Prove your vocabulary — and dodge the false friends!",i:"beer-stein",bg:"linear-gradient(135deg,#c87a35,#8b5e83)",tag:"NEW"},
    {id:"matchE",n:"Speed Match",d:"Match words with definitions!",i:"chained-arrow-heads",bg:"linear-gradient(135deg,var(--cx-hex),#8b5e83)",game:"matchEasy"},
    {id:"wfall",n:"Word Fall",d:"Catch the falling sentences!",i:"meteor-impact",bg:"linear-gradient(135deg,#ef4444,#f59e0b)",game:"wordFall"},
    {id:"sbuild",n:"Sentence Builder",d:"Tap blocks in the right order!",i:"brick-pile",bg:"linear-gradient(135deg,#5a7a9a,#7a5a80)"},
    {id:"ablitz",n:"Audio Blitz",d:"Listen once, answer fast!",i:"lyre",bg:"linear-gradient(135deg,#f59e0b,#ef4444)"},
    {id:"clue",n:"Clue Hunter",d:"Find the clue, fill the blank!",i:"spyglass",bg:"linear-gradient(135deg,var(--cx-hex),#4abe60)"},
    // Deux modes (lecture, écoute) : maîtrise agrégée et meilleur tarif restant, comme un hub à épreuves.
    {id:"mimic",n:"Mimic Hunt",d:"Same meaning — or just the same words?",i:"mimic-chest",bg:"linear-gradient(135deg,#8b5e83,#c84040)",tag:"NEW",subs:["mimic","mimic_listen"],unit:"modes"},
    {id:"duel",n:"Vocabulary Arena",d:"Real-time 1v1 — challenge a classmate!",i:"swords-emblem",bg:"linear-gradient(135deg,#c84040,#8b5e83)",tag:"NEW",game:"duel"},
  ];
  return(<div className="enter" style={{padding:"20px 16px 100px"}}>
    <h1 className="out" style={{fontWeight:800,fontSize:24,marginBottom:4}}>Arena Games</h1>
    <p style={{color:"var(--t2)",fontSize:13,marginBottom:20}}>Train your reflexes, earn XP</p>
    <HubShelf id="games" summary={hubSummary(p.u,games.filter(function(m){return !isModuleLocked(m.id,p.u,p.groupType);}),{events:p.events})}/>
    <div className="rg-games" style={{display:"flex",flexDirection:"column",gap:12}}>
      {games.map(function(m){var vl=isModuleLocked(m.id,p.u,p.groupType);var lb=classBests[m.id];return(
        <HubTile key={m.id} item={m} size="lg" unit={m.unit} locked={vl} status={vl?null:hubItemStatus(p.u,m,{events:p.events})}
          onClick={function(){if(vl){p.onPremium(m.n);return;}p.nav(m.id);}}>
          {lb&&<div style={{fontSize:10,color:"var(--gold)",marginTop:2,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{"🏆 "}{lb.name}{" · "}{lb.label}</div>}
          {m.tag&&<div style={{fontSize:10,color:"var(--gold)",marginTop:2}}>{m.tag}</div>}
        </HubTile>);})}
    </div>
  </div>);
}
