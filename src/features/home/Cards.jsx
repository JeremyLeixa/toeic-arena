// Extrait de src/App.jsx le 2026-09-15 (refactor split-app, REFACTOR_PLAN.md). Code déplacé tel quel.
import { Bar } from "../../components/Bar.jsx";
import { ResultIcon } from "../../components/icons.jsx";
import { SpeakBtn } from "../../components/SpeakBtn.jsx";
import { VOCAB } from "../../data/vocab.js";
import { hasFullAccess, FREE_FLASHCARD_DOMAINS } from "../../lib/access.js";
import { speak } from "../../lib/audio.js";
import { dueCards } from "../../lib/progress.js";
import { shuffle } from "../../lib/util.js";
import { useState, useMemo, useRef } from "react";

// ─── CARDS PAGE ───
export function Cards(p){var isFree=!hasFullAccess(p.u, p.groupType);var visibleDomains=VOCAB;
var all=[];visibleDomains.forEach(function(d){d.cards.forEach(function(c){all.push(c);});});var dc=dueCards(p.u.cardStates,all);var mc=0;Object.keys(p.u.cardStates).forEach(function(k){if(p.u.cardStates[k].interval>=7)mc++;});
var[srsHelp,setSrsHelp]=useState(function(){return !localStorage.getItem("srsHelpSeen");});
function closeSrsHelp(){setSrsHelp(false);localStorage.setItem("srsHelpSeen","1");}
return(<div className="enter" style={{padding:"20px 16px 100px"}}>
{srsHelp&&<div style={{position:"fixed",inset:0,background:"rgba(0,0,0,.75)",zIndex:9999,display:"flex",alignItems:"center",justifyContent:"center",padding:20,animation:"fadeIn .2s"}} onClick={closeSrsHelp}>
<div style={{background:"linear-gradient(180deg,#1a1610,#0f0c08)",borderRadius:16,border:"1px solid rgba(180,140,80,.12)",padding:"28px 22px",maxWidth:380,width:"100%",animation:"fadeIn .3s ease-out",boxShadow:"0 12px 40px rgba(0,0,0,.5)"}} onClick={function(e){e.stopPropagation();}}>
<div style={{fontSize:32,textAlign:"center",marginBottom:12}}>{"🧠"}</div>
<h2 className="out" style={{fontWeight:800,fontSize:18,textAlign:"center",marginBottom:16,color:/*fond local*/"#ede4d4"}}>How do Flashcards work?</h2>
<p style={{fontSize:13,color:/*fond local*/"#b0a890",lineHeight:1.7,marginBottom:14}}>Flashcards use <b style={{color:/*fond local*/"#ede4d4"}}>spaced repetition</b>: you rate yourself after seeing each answer, and the app schedules your next review accordingly.</p>
<div style={{display:"flex",flexDirection:"column",gap:8,marginBottom:16}}>
<div style={{display:"flex",alignItems:"center",gap:10,padding:"8px 12px",borderRadius:10,background:"rgba(255,71,87,.08)"}}>
<span style={{fontWeight:700,color:/*fond local*/"#e05252",minWidth:52,fontSize:13}}>Again</span>
<span style={{fontSize:12,color:/*fond local*/"#b0a890"}}>I had no idea — show me again soon</span></div>
<div style={{display:"flex",alignItems:"center",gap:10,padding:"8px 12px",borderRadius:10,background:"rgba(255,140,66,.08)"}}>
<span style={{fontWeight:700,color:/*fond local*/"#c87a35",minWidth:52,fontSize:13}}>Hard</span>
<span style={{fontSize:12,color:/*fond local*/"#b0a890"}}>I struggled but eventually remembered</span></div>
<div style={{display:"flex",alignItems:"center",gap:10,padding:"8px 12px",borderRadius:10,background:"rgba(0,230,118,.08)"}}>
<span style={{fontWeight:700,color:/*fond local*/"#4abe60",minWidth:52,fontSize:13}}>Good</span>
<span style={{fontSize:12,color:/*fond local*/"#b0a890"}}>I remembered after a moment of thought</span></div>
<div style={{display:"flex",alignItems:"center",gap:10,padding:"8px 12px",borderRadius:10,background:"rgba(212,148,58,.08)"}}>
<span style={{fontWeight:700,color:/*fond local*/"#d4943a",minWidth:52,fontSize:13}}>Easy</span>
<span style={{fontSize:12,color:/*fond local*/"#b0a890"}}>Instant recall — I know this one well</span></div></div>
<p style={{fontSize:12,color:"#8a7e6a",lineHeight:1.6,marginBottom:18}}>Be honest! Cards you mark "Again" come back sooner, while "Easy" cards are spaced further apart. The goal is long-term memorisation, not a high score.</p>
<button className="btn1" onClick={closeSrsHelp} style={{width:"100%"}}>Got it!</button>
</div></div>}
<div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:4}}><h1 className="out" style={{fontWeight:800,fontSize:24,marginBottom:0}}>Flashcards</h1>
<button onClick={function(){setSrsHelp(true);}} style={{background:"var(--bg3)",border:"1px solid var(--bdr)",borderRadius:"50%",width:30,height:30,display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer",color:"var(--t2)",fontSize:14,fontWeight:700}} title="How do flashcards work?">?</button></div>
<p style={{color:"var(--t2)",fontSize:13,marginBottom:20}}>Spaced repetition vocabulary</p>
<div className="crd glo" style={{marginBottom:20,padding:16}}>
<div style={{display:"flex",justifyContent:"space-between",marginBottom:12}}>
<div><div style={{fontSize:11,color:"var(--t2)",textTransform:"uppercase",letterSpacing:.5}}>Mastered</div><div className="out" style={{fontWeight:800,fontSize:22,color:"var(--green)"}}>{mc}/{all.length}</div></div>
<div style={{textAlign:"center"}}><div style={{fontSize:11,color:"var(--t2)",textTransform:"uppercase",letterSpacing:.5}}>Due today</div><div className="out" style={{fontWeight:800,fontSize:22,color:dc.length>0?"var(--orange)":"var(--green)"}}>{dc.length}</div></div>
<div style={{textAlign:"right"}}><div style={{fontSize:11,color:"var(--t2)",textTransform:"uppercase",letterSpacing:.5}}>Reviews</div><div className="out" style={{fontWeight:800,fontSize:22,color:"var(--cyan)"}}>{p.u.stats.cardsRev||0}</div></div></div>
<Bar value={mc} max={all.length} h={6} color="linear-gradient(90deg,#4abe60,#3a9a70)"/></div>
{dc.length>0&&<button className="btn1" onClick={function(){p.nav("csess");}} style={{marginBottom:20}}>Review {dc.length} cards</button>}
<h2 className="out" style={{fontWeight:700,fontSize:15,color:"var(--t2)",marginBottom:12}}>Vocabulary Domains</h2>
<div style={{display:"flex",flexDirection:"column",gap:10}}>{VOCAB.map(function(dom){var vl=isFree&&FREE_FLASHCARD_DOMAINS.indexOf(dom.id)===-1;var ms=0;dom.cards.forEach(function(c){var s=p.u.cardStates[c.id];if(s&&s.interval>=7)ms++;});
return(<div key={dom.id} className="crd" onClick={function(){if(vl){p.onPremium(dom.name+" Flashcards");return;}p.nav("cdom",dom.id);}} style={{display:"flex",alignItems:"center",gap:14,cursor:vl?"default":"pointer",padding:"14px 16px",opacity:vl?.55:1}}>
<div style={{width:42,height:42,borderRadius:12,background:vl?"var(--bg3)":dom.col+"22",display:"flex",alignItems:"center",justifyContent:"center",fontSize:22,flexShrink:0}}>{dom.icon}</div>
<div style={{flex:1,minWidth:0}}><div className="out" style={{fontWeight:600,fontSize:14}}>{dom.name}</div><div style={{fontSize:11,color:vl?"var(--gold)":"var(--t2)"}}>{vl?"Arena Premium":ms+"/"+dom.cards.length+" mastered"}</div></div>
{vl?<ResultIcon e={"🔒"} size={14} color="var(--gold)"/>:<div style={{width:48}}><Bar value={ms} max={dom.cards.length} h={4} color={dom.col}/></div>}</div>);})}</div></div>);}
// ─── FLASHCARD SESSION ───
export function CardSess(p){var all=[];if(p.domId){var dom=VOCAB.find(function(d){return d.id===p.domId;});if(dom)all=dom.cards;}else{VOCAB.forEach(function(d){d.cards.forEach(function(c){all.push(c);});});}
// Domain-specific = show ALL cards (study mode). Global = SRS due only.
var rev=useMemo(function(){return p.domId?shuffle(all):dueCards(p.u.cardStates,all);},[]);var[ci,sC]=useState(0);var[fl,sF]=useState(false);var[done,sD]=useState(false);var[ok,sO]=useState(0);var[tot,sT]=useState(0);
// FR translation reveal: opt-in per card, never memorized across cards (validé 2026-05-11).
// Field card.fr is OPTIONAL — when absent, the toggle button is hidden so cards without
// a translation render exactly as before. Allows progressive content rollout by domain.
var[showFr,setShowFr]=useState(false);
var lastSpoken=useRef(-1);var isDomainMode=!!p.domId;

if(rev.length===0||done){
  return(<div className="enter" style={{padding:"20px 16px",minHeight:"100vh",display:"flex",flexDirection:"column",justifyContent:"center",textAlign:"center"}}>
<div style={{fontSize:48,marginBottom:16}}>{done?"✨":"🎉"}</div>
<h2 className="out" style={{fontWeight:800,fontSize:24,marginBottom:8}}>{done?"Session Complete!":"All caught up!"}</h2>
{done&&<div>
  <p style={{color:"var(--t2)",marginBottom:8}}>{ok}/{tot} rated Good or Easy</p>
  <p style={{fontSize:12,color:"var(--t3)",marginTop:4}}>Flashcards help you memorize — test your knowledge in Word Tavern to earn XP!</p>
</div>}
{!done&&<p style={{color:"var(--t2)",fontSize:13}}>No cards due for review right now. Tap a specific domain to study anyway.</p>}
<button className="btn1" onClick={function(){if(done)p.done(0,ok,tot);else p.back();}} style={{marginTop:32}}>{done?"Done":"Back"}</button></div>);}

var card=rev[ci];function rate(r){sO(ok+(r>=3?1:0));sT(tot+1);p.rate(card.id,r);if(ci<rev.length-1){sC(ci+1);sF(false);setShowFr(false);}else sD(true);}

// Auto-pronounce word when new card appears
if(card&&!fl&&lastSpoken.current!==ci){lastSpoken.current=ci;setTimeout(function(){speak(card.w,0.85,"/audio/vocab/"+card.id+".mp3");},400);}

return(<div style={{padding:"20px 16px",minHeight:"100vh"}}>
<div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:20}}>
<button className="back-btn" onClick={p.back}>{"\u2190"} Back</button>
<div style={{textAlign:"center"}}>
  <span className="out" style={{fontSize:13,color:"var(--t2)",fontWeight:600}}>{ci+1}/{rev.length}</span>
  {isDomainMode&&<div style={{fontSize:9,color:"var(--cyan)",textTransform:"uppercase",letterSpacing:.5,marginTop:2}} className="out">Study mode</div>}
</div>
<div style={{width:40}}/></div>
<Bar value={ci} max={rev.length} h={4} color="linear-gradient(90deg,#c87a35,#f0c850)"/>
<div onClick={function(){sF(!fl);setShowFr(false);}} style={{marginTop:40,cursor:"pointer",minHeight:280}}>
<div className="crd glo" style={{padding:32,textAlign:"center",display:"flex",flexDirection:"column",justifyContent:"center",minHeight:280,animation:fl?"flip .3s ease-out":"none"}}>
{!fl?<div><div className="out" style={{fontSize:11,color:"var(--cyan)",textTransform:"uppercase",letterSpacing:1,fontWeight:600,marginBottom:16}}>WHAT DOES THIS MEAN?</div>
<div style={{display:"flex",alignItems:"center",justifyContent:"center",gap:12,marginBottom:16}}>
  <div className="out" style={{fontWeight:800,fontSize:32}}>{card.w}</div>
  <SpeakBtn text={card.w} size={36} audio={"/audio/vocab/"+card.id+".mp3"}/></div>
<div style={{fontSize:13,color:"var(--t3)"}}>Tap to reveal</div></div>
:<div><div style={{display:"flex",alignItems:"center",justifyContent:"center",gap:10,marginBottom:12}}>
  <div className="out" style={{fontWeight:700,fontSize:20,color:"var(--cyan)"}}>{card.w}</div>
  <SpeakBtn text={card.w} size={30} audio={"/audio/vocab/"+card.id+".mp3"}/></div>
<div style={{fontSize:16,lineHeight:1.6,marginBottom:16}}>{card.d}</div>
<div style={{fontSize:13,color:"var(--t2)",fontStyle:"italic",lineHeight:1.5,padding:"12px 16px",background:"var(--bg3)",borderRadius:10,position:"relative"}}>
  <div style={{display:"flex",alignItems:"flex-start",gap:8}}>
    <span style={{flex:1}}>"{card.e}"</span>
    <SpeakBtn text={card.e} size={28} rate={0.85} audio={"/audio/vocab/"+card.id+"_ex.mp3"}/>
  </div>
</div>
{card.fr&&<div style={{marginTop:14,textAlign:"left"}}>
  <button onClick={function(e){e.stopPropagation();setShowFr(!showFr);}} style={{background:"transparent",border:"1px solid var(--bdr)",color:showFr?"var(--cyan)":"var(--t2)",fontFamily:"inherit",fontSize:11,fontWeight:600,letterSpacing:.5,textTransform:"uppercase",padding:"8px 14px",borderRadius:8,cursor:"pointer",display:"inline-flex",alignItems:"center",gap:8}}>{"🇫🇷"} <span>{showFr?"Masquer la traduction":"Voir la traduction"}</span> <span style={{fontSize:9,opacity:.6,display:"inline-block",transform:showFr?"rotate(180deg)":"none",transition:"transform .2s"}}>{"▼"}</span></button>
  {showFr&&<div onClick={function(e){e.stopPropagation();}} style={{marginTop:10,padding:"10px 14px",background:"rgba(74,190,96,.05)",border:"1px solid rgba(74,190,96,.18)",borderLeft:"3px solid var(--green)",borderRadius:8,fontSize:13,lineHeight:1.5,color:"var(--t1)",animation:"fadeIn .25s ease-out"}}>
    <span style={{display:"inline-block",background:"rgba(74,190,96,.18)",color:"var(--green)",fontSize:9,fontWeight:700,letterSpacing:1,textTransform:"uppercase",padding:"2px 6px",borderRadius:3,marginRight:8,verticalAlign:"1px"}}>FR</span>
    <span style={{fontWeight:700,color:"var(--green)"}}>{card.fr}</span>
  </div>}
</div>}
</div>}</div></div>
{fl&&<div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr 1fr",gap:8,marginTop:24,animation:"fadeIn .3s ease-out"}}>
{[{r:1,l:"Again",c:"var(--red)",b:"rgba(255,71,87,.12)"},{r:2,l:"Hard",c:"var(--orange)",b:"rgba(255,140,66,.12)"},{r:3,l:"Good",c:"var(--green)",b:"rgba(0,230,118,.12)"},{r:4,l:"Easy",c:"var(--cyan)",b:"rgba(var(--cx),.12)"}].map(function(b){
return(<button key={b.r} onClick={function(e){e.stopPropagation();rate(b.r);}} style={{padding:"12px 8px",background:b.b,border:"1px solid "+b.c+"33",borderRadius:12,cursor:"pointer",color:b.c,fontWeight:700,fontSize:13}} className="out">{b.l}</button>);})}</div>}</div>);}
