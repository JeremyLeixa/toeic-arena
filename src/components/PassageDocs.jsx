// Extrait de src/App.jsx le 2026-09-15 (refactor split-app, REFACTOR_PLAN.md). Code déplacé tel quel.
import { parsePassageDocs } from "../lib/passageDocs.js";
import { useState } from "react";

export function PassageDocs(p){
  var docs=parsePassageDocs(p.text);
  var[tab,setTab]=useState(0);
  var fs=p.fontSize||13,lh=p.lineHeight||1.8;
  if(!docs)return(<p className="read-text" style={{fontSize:fs,color:"var(--t2)",lineHeight:lh,whiteSpace:"pre-line"}}>{p.text}</p>);
  var ti=Math.min(tab,docs.length-1);
  return(<div>
    <div style={{display:"flex",gap:6,marginBottom:8}}>
      {docs.map(function(d,i){var on=i===ti;
        return(<button key={i} onClick={function(){setTab(i);}} className="out" style={{flex:1,minWidth:0,fontSize:12,fontWeight:on?700:600,padding:"6px 4px",borderRadius:8,border:"1px solid "+(on?"var(--cyan)":"var(--bdr)"),background:on?"rgba(var(--cx),.1)":"var(--bg2)",color:on?"var(--cyan)":"var(--t3)",cursor:"pointer",whiteSpace:"nowrap"}}>{"Doc "+(i+1)}</button>);})}
    </div>
    {docs[ti].label&&<div className="out" style={{fontSize:10,color:"var(--t3)",fontWeight:700,marginBottom:8,textTransform:"uppercase",letterSpacing:1}}>{docs[ti].label}</div>}
    <p className="read-text" style={{fontSize:fs,color:"var(--t2)",lineHeight:lh,whiteSpace:"pre-line"}}>{docs[ti].body}</p>
  </div>);
}
