// Extrait de src/App.jsx le 2026-09-15 (refactor split-app, REFACTOR_PLAN.md). Code déplacé tel quel.
import { STRATEGIES } from "../../data/miniGames.js";
import { today } from "../../lib/util.js";
import { useState, useMemo } from "react";

// ─── DAILY TIP POPUP ───
export function DailyTip(p){
  var[tipIdx,setTipIdx]=useState(0);
  var u=p.u;

  // Flatten all tips with their part/section metadata
  var allTips=useMemo(function(){
    var flat=[];
    STRATEGIES.forEach(function(s){
      s.tips.forEach(function(tip){
        flat.push({t:tip.t,d:tip.d,part:s.part,section:s.section,icon:s.icon});
      });
    });
    return flat;
  },[]);

  // Map parts to moduleScore keys for weakness detection
  var partToModules={
    "Part 1":["lisP1"],"Part 2":["lisP2"],"Part 3":["lisP3"],"Part 4":["lisP4"],
    "Part 5":["drill","daily","timesim"],"Part 6":["part6"],"Part 7":["part7"],
    "General":[]
  };

  // Compute tips sorted by relevance (weakest area first)
  var sortedTips=useMemo(function(){
    // Score each part by accuracy (lower = weaker = show first)
    var partScores={};
    Object.keys(partToModules).forEach(function(part){
      var mods=partToModules[part];
      var total=0;var correct=0;
      mods.forEach(function(modId){
        var ms=u.moduleScores?u.moduleScores[modId]:null;
        if(ms&&ms.total>0){total+=ms.total;correct+=ms.correct;}
      });
      partScores[part]=total>0?correct/total:0.5; // default 50% if no data
    });

    // Sort tips: weakest part first, then never-practiced, then strong
    var scored=allTips.map(function(tip,i){
      var acc=partScores[tip.part];
      if(acc===undefined)acc=0.5;
      return{tip:tip,origIdx:i,acc:acc};
    });
    scored.sort(function(a,b){return a.acc-b.acc;});
    return scored.map(function(s){return s.tip;});
  },[]);

  // Which tip to show today (sequential through sorted list, stored in localStorage)
  var startIdx=useMemo(function(){
    try{
      var stored=localStorage.getItem("toeic-tip-idx");
      return stored?parseInt(stored)||0:0;
    }catch(e){return 0;}
  },[]);

  var currentTip=sortedTips[(startIdx+tipIdx)%sortedTips.length];

  function dismiss(){
    // Save next index for tomorrow
    try{
      localStorage.setItem("toeic-tip-idx",String((startIdx+tipIdx+1)%sortedTips.length));
      localStorage.setItem("toeic-tip-date",today());
    }catch(e){}
    p.close();
  }

  function nextTip(){
    setTipIdx(tipIdx+1);
  }

  function disableStartup(){
    try{localStorage.setItem("toeic-tip-disabled","1");}catch(e){}
    dismiss();
  }

  var sectionCol=currentTip.section==="Listening"?"var(--cyan)":currentTip.section==="Reading"?"var(--purple)":"var(--gold)";

  return(<div style={{position:"fixed",top:0,left:0,right:0,bottom:0,background:"rgba(0,0,0,.7)",backdropFilter:"blur(6px)",WebkitBackdropFilter:"blur(6px)",
    display:"flex",alignItems:"center",justifyContent:"center",zIndex:9999,padding:20,animation:"fadeIn .3s"}}>
    <div style={{width:"100%",maxWidth:420,background:"var(--bg2)",borderRadius:20,border:"1px solid var(--bdr)",overflow:"hidden",boxShadow:"0 20px 60px rgba(0,0,0,.5)"}}>

      {/* Header */}
      <div style={{padding:"20px 20px 12px",background:"linear-gradient(135deg,rgba(var(--cx),.08),rgba(27,112,207,.08))"}}>
        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:12}}>
          <div style={{display:"flex",alignItems:"center",gap:8}}>
            <span style={{fontSize:22}}>{"💡"}</span>
            <span className="out" style={{fontWeight:800,fontSize:16}}>Daily TOEIC Tip</span>
          </div>
          <span style={{fontSize:11,color:sectionCol,fontWeight:700,padding:"4px 10px",background:sectionCol+"15",borderRadius:20}}>{currentTip.icon} {currentTip.part}</span>
        </div>
        <div style={{height:1,background:"var(--bdr)"}}/>
      </div>

      {/* Tip content */}
      <div style={{padding:"16px 20px 20px"}}>
        <h3 className="out" style={{fontWeight:800,fontSize:18,color:"var(--t1)",marginBottom:10,lineHeight:1.4}}>{currentTip.t}</h3>
        <p style={{fontSize:14,color:"var(--t2)",lineHeight:1.7}}>{currentTip.d}</p>

        {/* Section badge */}
        <div style={{marginTop:16,display:"flex",alignItems:"center",gap:6}}>
          <div style={{width:8,height:8,borderRadius:4,background:sectionCol}}/>
          <span style={{fontSize:11,color:"var(--t3)"}}>{currentTip.section} Section</span>
        </div>
      </div>

      {/* Actions */}
      <div style={{padding:"0 20px 20px",display:"flex",flexDirection:"column",gap:8}}>
        <button className="btn1" onClick={dismiss} style={{width:"100%",fontSize:15}}>Got it!</button>
        <div style={{display:"flex",gap:8}}>
          <button className="btn2" onClick={nextTip} style={{flex:1,fontSize:12}}>{"→"} Next tip</button>
          <button onClick={disableStartup} style={{flex:1,padding:"10px 12px",background:"none",border:"1px solid var(--bdr)",borderRadius:12,
            cursor:"pointer",fontSize:11,color:"var(--t3)",fontFamily:"'DM Sans',sans-serif"}}>Don't show at startup</button>
        </div>
      </div>
    </div>
  </div>);
}
