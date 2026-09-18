// Extrait de src/App.jsx le 2026-09-15 (refactor split-app, REFACTOR_PLAN.md). Code déplacé tel quel.
import { ResultIcon } from "../../components/icons.jsx";
import { SessionResult } from "../../components/SessionResult.jsx";
import { dailyQs } from "../../lib/progress.js";
import { today } from "../../lib/util.js";
import { playCorrect, playWrong } from "../../sounds.js";
import { useMemo, useState, useRef, useEffect } from "react";

// ─── DAILY CHALLENGE ───
export function Daily(p){
var qs=useMemo(function(){return dailyQs(today(),p.u);},[]);var[ci,sC]=useState(0);var[sel,sS]=useState(-1);var[sc,sSc]=useState(0);var[ph,sP]=useState("intro");var[tl,sT]=useState(30);var[sk,sSk]=useState(false);var tr=useRef(null);var answered=useRef(false);var mistakesRef=useRef([]);var sidRef=useRef(0);
// Guard: only block if daily was ALREADY done when component mounted (not if completed during this session)
var wasAlreadyDone=useRef(p.u.daily&&p.u.daily.date===today()&&p.u.daily.done);
// Timer des questions. AVANT le return anticipé ci-dessous (règle des hooks) : il était placé
// après, ce qui ne tenait que parce que la condition est un ref figé au montage. Sur l'écran
// « Already completed », ph reste "intro" et l'effet ne fait rien.
useEffect(function(){
  if(ph==="q"&&tl>0){tr.current=setTimeout(function(){sT(tl-1);},1000);return function(){clearTimeout(tr.current);};}
  if(ph==="q"&&tl===0&&!answered.current){answered.current=true;clearTimeout(tr.current);sS(-1);sSk(true);setTimeout(function(){sSk(false);},500);sP("fb");}
});
if(wasAlreadyDone.current)return(<div className="enter" style={{padding:"20px 16px",minHeight:"100vh",display:"flex",flexDirection:"column",justifyContent:"center",textAlign:"center"}}>
<div style={{fontSize:64,marginBottom:20}}>✅</div><h1 className="out" style={{fontWeight:900,fontSize:28,marginBottom:8}}>Already completed!</h1>
<p style={{color:"var(--t2)",marginBottom:8}}>Your daily challenge is done. Come back tomorrow!</p>
<p style={{color:"var(--gold)",fontWeight:600,marginBottom:40,fontSize:14}}>Score: {p.u.daily.score}/5 · +{p.u.daily.xpE} XP</p>
<button className="btn1" onClick={p.back}>Back</button></div>);
function doAns(i){answered.current=true;clearTimeout(tr.current);sS(i);if(i===qs[ci].c){sSc(sc+1);try{playCorrect();}catch(e){}}else{try{playWrong();}catch(e){}sSk(true);setTimeout(function(){sSk(false);},500);}sP("fb");}
// Erreur enregistrée au clic (couvre la réponse fausse ET le temps écoulé, sel=-1).
// ref : la question entre au bestiaire, sous la même référence que dans le Drill (même banque).
function nxt(){var dq=qs[ci];if(sel!==dq.c)mistakesRef.current.push({tag:dq.cat,prompt:dq.s,yours:sel>=0?dq.o[sel]:"(time's up)",correct:dq.o[dq.c],why:dq.x,ref:{k:"drill:"+dq.id,cat:dq.cat,part:"p5"}});answered.current=false;if(ci<qs.length-1){sC(ci+1);sS(-1);sT(30);sP("q");}else{var xp=30+sc*14+(sc===5?20:0);sidRef.current=p.done(sc,xp,mistakesRef.current);sP("done");}}

if(ph==="intro")return(<div className="enter" style={{padding:"20px 16px",minHeight:"100vh",display:"flex",flexDirection:"column",justifyContent:"center",textAlign:"center"}}>
<div style={{marginBottom:20,display:"flex",justifyContent:"center",animation:"pulse 2s infinite"}}><ResultIcon e={"⚡"} size={60}/></div><h1 className="out" style={{fontWeight:900,fontSize:28,marginBottom:8}}>Daily Challenge</h1>
<p style={{color:"var(--t2)",marginBottom:8}}>5 grammar questions · 30 seconds each</p><p style={{color:"var(--gold)",fontWeight:600,marginBottom:40,fontSize:14}}>Up to 100 XP + Perfect Bonus!</p>
<button className="btn1" onClick={function(){sP("q");}}>Start Challenge</button><button className="btn2" onClick={p.back} style={{marginTop:12,width:"100%"}}>Back</button></div>);

if(ph==="done")return(<SessionResult session={p.session} sid={sidRef.current} name="Daily Challenge" mistakes={mistakesRef.current}
  onContinue={function(){p.closeSession();p.back();}}/>);

var q=qs[ci],tc=tl>15?"var(--cyan)":tl>5?"var(--orange)":"var(--red)";
return(<div className={sk?"sk":""} style={{padding:"20px 16px",minHeight:"100vh"}}>
<div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:24}}>
<button className="back-btn" onClick={p.back}>{"\u2190"} Back</button>
<div style={{display:"flex",gap:6}}>{[0,1,2,3,4].map(function(i){return (<div key={i} style={{width:i===ci?24:8,height:8,borderRadius:4,background:i<ci?"var(--green)":i===ci?"var(--cyan)":"var(--t3)",transition:"all .3s"}}/>);})}</div>
<div className="out" style={{fontSize:20,fontWeight:800,color:tc,minWidth:32,textAlign:"right"}}>{tl}</div></div>
<div style={{width:"100%",height:3,background:"var(--bg3)",borderRadius:2,marginBottom:32,overflow:"hidden"}}><div style={{width:(tl/30*100)+"%",height:"100%",background:tc,borderRadius:2,transition:"width 1s linear"}}/></div>
<span className="out" style={{fontSize:11,fontWeight:600,color:"var(--cyan)",textTransform:"uppercase",letterSpacing:1}}>{q.cat}</span>
<h2 className="qstem" style={{fontWeight:700,fontSize:20,lineHeight:1.5,marginBottom:28,marginTop:8}}>{q.s}</h2>
<div style={{display:"flex",flexDirection:"column",gap:10}}>{q.o.map(function(opt,i){var iS=sel===i,iC=i===q.c,sr=ph==="fb",bg="var(--bg2)",bd="var(--bdr)";
if(sr&&iC){bg="rgba(0,230,118,.12)";bd="var(--green)";}else if(sr&&iS&&!iC){bg="rgba(255,71,87,.12)";bd="var(--red)";}
return(<button key={i} onClick={function(){if(ph==="q")doAns(i);}} disabled={ph==="fb"} style={{display:"flex",alignItems:"center",gap:12,padding:"14px 16px",background:bg,border:"1px solid "+bd,borderRadius:12,cursor:ph==="q"?"pointer":"default",fontSize:15,color:"var(--t1)",textAlign:"left",transition:"all .2s",fontFamily:"'DM Sans',sans-serif"}}>
<div style={{width:28,height:28,borderRadius:"50%",border:"2px solid "+(sr&&iC?"var(--green)":sr&&iS?"var(--red)":"var(--t3)"),display:"flex",alignItems:"center",justifyContent:"center",fontSize:12,fontWeight:700,flexShrink:0,background:sr&&iC?"var(--green)":sr&&iS&&!iC?"var(--red)":"transparent",color:sr&&(iC||iS)?"#fff":"var(--t3)"}}>
{sr&&iC?"✓":sr&&iS?"✗":String.fromCharCode(65+i)}</div><span>{opt}</span></button>);})}</div>
{ph==="fb"&&<div style={{marginTop:20,animation:"fadeIn .3s ease-out"}}><div className="crd" style={{background:"rgba(var(--cx),.06)",borderColor:"rgba(var(--cx),.15)",padding:16}}><p style={{fontSize:13,color:"var(--t2)",lineHeight:1.6}}>{q.x}</p></div>
<button className="btn1" onClick={nxt} style={{marginTop:16}}>{ci<qs.length-1?"Next Question":"See Results"}</button></div>}</div>);}
