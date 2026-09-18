// Extrait de src/App.jsx le 2026-09-15 (refactor split-app, REFACTOR_PLAN.md). Code déplacé tel quel.
import { GrimoireReader } from "../../components/GrimoireReader.jsx";
import { GIcon } from "../../components/icons.jsx";
import { SessionResult } from "../../components/SessionResult.jsx";
import { GAME_ICON_PATHS } from "../../data/avatarIcons.js";
import { IRREGULAR_VERBS, TENSE_CHRONOMANCER, PASSIVE_FORGE, RELATIVE_WEAVER } from "../../data/grammarGauntlet.js";
import { GRIMOIRE_CHRONOMANCER, GRIMOIRE_PASSIVE_FORGE, GRIMOIRE_RELATIVE_WEAVER } from "../../data/grammarGauntletGrimoire.js";
import { haptic } from "../../lib/device.js";
import { moduleRef } from "../../lib/reviewRefs.js";
import { shuffleOpts } from "../../lib/util.js";
import { tone } from "../../lib/tone.js";
import { playCorrect, playWrong, playBGM, stopBGM } from "../../sounds.js";
import { useState, useEffect, useRef } from "react";

// ─── IRREGULAR CRYPT — sub-module 1/4 of Grammar Gauntlet ───
// Speed drill: 15 verbs per session, V2 + V3 text input, 15s per question.
// Scoring: 1 point per fully correct verb (V2 AND V3). Partial = 0 points
// but +1 XP bonus. Session completes -> p.done(sc, total, xp).
export function IrregularCrypt(p){
  var SESSION_SIZE=15;
  var TIME_PER_Q=15;
  var [deck,setDeck]=useState(null);
  var [phase,setPhase]=useState("intro"); // intro | play | reveal | end
  var [idx,setIdx]=useState(0);
  var [v2In,setV2In]=useState("");
  var [v3In,setV3In]=useState("");
  var [revealData,setRevealData]=useState(null);
  var [results,setResults]=useState([]);
  var [timeLeft,setTimeLeft]=useState(TIME_PER_Q);

  var mistakesRef=useRef([]);var sentRef=useRef(false);var sidRef=useRef(0);
  function startSession(){
    var shuffled=[].concat(IRREGULAR_VERBS).sort(function(){return Math.random()-0.5;});
    var d=shuffled.slice(0,Math.min(SESSION_SIZE,shuffled.length));
    setDeck(d);setIdx(0);setResults([]);setV2In("");setV3In("");
    setTimeLeft(TIME_PER_Q);setPhase("play");
  }
  function normalize(s){return(s||"").toLowerCase().trim();}
  function submit(){
    if(phase!=="play"||!deck)return;
    var verb=deck[idx];
    var v2Ok=normalize(v2In)===normalize(verb.past);
    var v3Ok=normalize(v3In)===normalize(verb.pp);
    if(!(v2Ok&&v3Ok))mistakesRef.current.push({tag:"Irregular verbs",prompt:verb.base,noBlank:true,yours:(v2In.trim()||"—")+" · "+(v3In.trim()||"—"),correct:verb.past+" · "+verb.pp,why:verb.fr+(verb.ex?" — "+verb.ex:""),ref:moduleRef("gauntlet",verb.id)});
    if(v2Ok&&v3Ok){try{playCorrect();}catch(e){console.warn("[icrypt] sfx:",e&&e.message);}}
    else{try{playWrong();}catch(e){console.warn("[icrypt] sfx:",e&&e.message);}}
    var newResults=results.concat([{v2Ok:v2Ok,v3Ok:v3Ok,verb:verb}]);
    setRevealData({v2Ok:v2Ok,v3Ok:v3Ok,verb:verb,v2Input:v2In,v3Input:v3In});
    setResults(newResults);
    setPhase("reveal");
    setTimeout(function(){
      if(idx>=deck.length-1){setPhase("end");}
      else{setIdx(idx+1);setV2In("");setV3In("");setRevealData(null);setTimeLeft(TIME_PER_Q);setPhase("play");}
    },3500);
  }
  // Timer — reset is handled in startSession + the next-question setTimeout above.
  // Do NOT add a useEffect that resets timeLeft on [idx,phase] : if the previous
  // question ended on a 0-timer auto-submit, timeLeft stays at 0 across the reveal,
  // and on the next "play" commit Effect 1 fires before the reset effect → submit()
  // is called immediately on Q N+1 (timer "drops to 0 d'un coup" bug, 2026-04-30).
  useEffect(function(){
    if(phase!=="play")return;
    if(timeLeft<=0){submit();return;}
    var t=setTimeout(function(){setTimeLeft(timeLeft-1);},1000);
    return function(){clearTimeout(t);};
  },[timeLeft,phase]);

  function finishSession(){
    var totalFull=results.filter(function(r){return r.v2Ok&&r.v3Ok;}).length;
    var totalPartial=results.filter(function(r){return(r.v2Ok||r.v3Ok)&&!(r.v2Ok&&r.v3Ok);}).length;
    // Gauntlet XP tier B: base 15 + 5 per full + 2 per partial + 35 perfect bonus.
    // Aligned with the other 3 Gauntlet sub-modules and the 15 Q tier at large.
    // Preserves the partial-credit granularity unique to Irregular Crypt.
    var baseXp=totalFull*5+totalPartial*2+15;
    if(totalFull===deck.length)baseXp+=35;
    return p.done(totalFull,deck.length,baseXp,mistakesRef.current);
  }

  // Fin du raid (souvent depuis le minuteur du dernier verbe) : l'XP part ici, avec l'état du dernier rendu, au lieu d'attendre « OK, back »
  // (quitter l'écran la perdait). Un seul envoi.
  useEffect(function(){
    if(phase!=="end"||sentRef.current)return;
    sentRef.current=true;
    sidRef.current=finishSession();
  },[phase]);

  if(phase==="intro"){
    return(<div className="enter" style={{padding:"20px 16px 100px",maxWidth:480,margin:"0 auto"}}>
      <button className="back-btn" onClick={p.back}>{"\u2190"} Back</button>
      <div style={{textAlign:"center",padding:"24px 16px"}}>
        <div style={{marginBottom:14,display:"flex",justifyContent:"center"}}><GIcon name="tombstone" size={64} color="var(--cyan)"/></div>
        <h2 className="out" style={{fontSize:24,fontWeight:800,marginBottom:8}}>Irregular Crypt</h2>
        <p style={{color:"var(--t3)",fontSize:14,marginBottom:20,lineHeight:1.5}}>Exhume 15 irregular verbs from the tombs of the past.</p>
        <div className="crd" style={{maxWidth:340,margin:"0 auto 22px",padding:16,textAlign:"left",fontSize:13.5,color:"var(--t2)",lineHeight:1.7}}>
          <div>{"\u23F1\uFE0F"} <strong>15 seconds</strong> per verb</div>
          <div>{"\u270D\uFE0F"} Type <strong>V2</strong> (past) and <strong>V3</strong> (past participle)</div>
          <div>{"\uD83C\uDFC6"} <strong>2 XP</strong> per mastered verb · perfect bonus</div>
        </div>
        <button className="btn1" style={{fontSize:16,padding:"14px 32px",fontWeight:800}} onClick={startSession}>{"\u2694\uFE0F Start the raid"}</button>
      </div>
    </div>);
  }

  if(phase==="end"){
    var totalPartial=results.filter(function(r){return(r.v2Ok||r.v3Ok)&&!(r.v2Ok&&r.v3Ok);}).length;
    return(<SessionResult session={p.session} sid={sidRef.current} name="Irregular Crypt" mistakes={mistakesRef.current} onContinue={p.onContinue} onReplay={p.onReplay}>
      {totalPartial>0&&<div className="crd" style={{padding:14,textAlign:"center",fontSize:13,color:"var(--t2)"}}>{totalPartial+" verb"+(totalPartial>1?"s":"")+" half right (V2 or V3 only)"}</div>}
    </SessionResult>);
  }

  // phase === "play" or "reveal"
  var verb=deck[idx];
  var pct=timeLeft/TIME_PER_Q*100;
  return(<div className="enter" style={{padding:"16px 16px 100px",maxWidth:480,margin:"0 auto"}}>
    <button className="back-btn" onClick={p.back}>{"\u2190"} Back</button>
    <div style={{fontSize:12,color:"var(--t3)",textAlign:"center",marginBottom:4}}>Verb {idx+1} / {deck.length}</div>
    <div style={{width:"100%",height:6,background:"var(--bg3)",borderRadius:99,overflow:"hidden",marginBottom:20}}>
      <div style={{width:pct+"%",height:"100%",background:phase==="play"?(timeLeft<5?"#ef4444":"linear-gradient(90deg,#7c3aed,#c026d3)"):"#6b7280",transition:"width 1s linear"}}/>
    </div>
    <div style={{textAlign:"center",padding:"14px 0 22px"}}>
      <div style={{fontSize:11,color:"var(--t3)",marginBottom:6,letterSpacing:2,textTransform:"uppercase"}}>Base</div>
      <div style={{fontSize:38,fontWeight:800,color:"var(--t1)",letterSpacing:.5}}>{verb.base}</div>
    </div>
    {phase==="play"?(
      <div style={{maxWidth:360,margin:"0 auto"}}>
        <label style={{display:"block",fontSize:11,color:"var(--t3)",marginBottom:6,letterSpacing:1.2,textTransform:"uppercase"}}>V2 (past)</label>
        <input type="text" value={v2In} onChange={function(e){setV2In(e.target.value);}} autoFocus autoComplete="off" autoCapitalize="none" spellCheck="false" onKeyDown={function(e){if(e.key==="Enter"&&v2In){var n=document.getElementById("icrypt-v3");if(n)n.focus();}}} className="icrypt-input" style={{width:"100%",padding:"12px 14px",fontSize:17,background:"var(--bg2)",border:"2px solid var(--bg3)",borderRadius:10,color:"var(--t1)",marginBottom:14,fontFamily:"inherit",outline:"none",boxSizing:"border-box"}}/>
        <label style={{display:"block",fontSize:11,color:"var(--t3)",marginBottom:6,letterSpacing:1.2,textTransform:"uppercase"}}>V3 (past participle)</label>
        <input id="icrypt-v3" type="text" value={v3In} onChange={function(e){setV3In(e.target.value);}} autoComplete="off" autoCapitalize="none" spellCheck="false" onKeyDown={function(e){if(e.key==="Enter")submit();}} className="icrypt-input" style={{width:"100%",padding:"12px 14px",fontSize:17,background:"var(--bg2)",border:"2px solid var(--bg3)",borderRadius:10,color:"var(--t1)",marginBottom:18,fontFamily:"inherit",outline:"none",boxSizing:"border-box"}}/>
        <button className="btn1" style={{width:"100%",background:"linear-gradient(135deg,#7c3aed,#c026d3)",fontSize:15,padding:"13px",fontWeight:800}} onClick={submit}>Submit</button>
      </div>
    ):(
      <div style={{maxWidth:360,margin:"0 auto"}}>
        <div className="crd" style={{padding:14,marginBottom:12}}>
          <div style={{display:"flex",gap:12,marginBottom:12}}>
            <div style={{flex:1,minWidth:0}}>
              <div style={{fontSize:10,color:"var(--t3)",marginBottom:3,letterSpacing:1,textTransform:"uppercase"}}>V2</div>
              <div style={{fontSize:16,fontWeight:700,color:revealData.v2Ok?tone("#22c55e"):tone("#ef4444"),wordBreak:"break-word"}}>{revealData.verb.past} {revealData.v2Ok?"\u2713":"\u2717"}</div>
              {!revealData.v2Ok&&revealData.v2Input&&<div style={{fontSize:12,color:"var(--t3)",textDecoration:"line-through",marginTop:3,wordBreak:"break-word"}}>{revealData.v2Input}</div>}
            </div>
            <div style={{flex:1,minWidth:0}}>
              <div style={{fontSize:10,color:"var(--t3)",marginBottom:3,letterSpacing:1,textTransform:"uppercase"}}>V3</div>
              <div style={{fontSize:16,fontWeight:700,color:revealData.v3Ok?tone("#22c55e"):tone("#ef4444"),wordBreak:"break-word"}}>{revealData.verb.pp} {revealData.v3Ok?"\u2713":"\u2717"}</div>
              {!revealData.v3Ok&&revealData.v3Input&&<div style={{fontSize:12,color:"var(--t3)",textDecoration:"line-through",marginTop:3,wordBreak:"break-word"}}>{revealData.v3Input}</div>}
            </div>
          </div>
          <div style={{fontSize:12.5,color:"var(--t2)",fontStyle:"italic",marginBottom:8}}>{revealData.verb.fr}</div>
          <div style={{fontSize:13,color:"var(--t2)",lineHeight:1.55,borderLeft:"2px solid var(--bg3)",paddingLeft:10}}>{revealData.verb.ex}</div>
        </div>
        <div style={{textAlign:"center",fontSize:11,color:"var(--t3)",opacity:.7}}>Next in a moment...</div>
      </div>
    )}
  </div>);
}
// Chronomancer, Passive Forge, Relative Weaver : options permutées au montage du deck (la bonne
// réponse était en B ou C pour 156 items sur 190). Tout se lit ensuite sur la copie : q.o, q.c.
function permuteQ(q){var s=shuffleOpts(q.o,q.c);return Object.assign({},q,{o:s.opts,c:s.c});}
// ─── CHRONOMANCER — sub-module 2/4 of Grammar Gauntlet ───
// Contextual QCM: 15 tense questions, no timer (reflection). Temporal
// marker highlighted in the sentence when a literal match is found, and
// shown as a hint pill above the sentence regardless. Manual "Continue"
// after reveal to encourage reading the explanation.
export function Chronomancer(p){
  var SESSION_SIZE=15;
  var [deck,setDeck]=useState(null);
  var [phase,setPhase]=useState("intro"); // intro | play | reveal | end
  var [idx,setIdx]=useState(0);
  var [picked,setPicked]=useState(null);
  var [results,setResults]=useState([]);

  var mistakesRef=useRef([]);var sentRef=useRef(false);var sidRef=useRef(0);
  function startSession(){
    var shuffled=[].concat(TENSE_CHRONOMANCER).sort(function(){return Math.random()-0.5;});
    var d=shuffled.slice(0,Math.min(SESSION_SIZE,shuffled.length)).map(permuteQ);
    setDeck(d);setIdx(0);setResults([]);setPicked(null);setPhase("play");
  }
  function pickAnswer(optIdx){
    if(phase!=="play"||!deck)return;
    var q=deck[idx];
    var ok=optIdx===q.c;
    if(!ok)mistakesRef.current.push({tag:"Tenses · "+String(q.tense||"").replace(/_/g," "),prompt:q.s,yours:q.o[optIdx],correct:q.o[q.c],why:q.x,ref:moduleRef("gauntlet",q.id)});
    if(ok){try{playCorrect();}catch(e){console.warn("[chrono] sfx:",e&&e.message);}}
    else{try{playWrong();}catch(e){console.warn("[chrono] sfx:",e&&e.message);}}
    setPicked(optIdx);
    setResults(results.concat([{q:q,picked:optIdx,ok:ok}]));
    setPhase("reveal");
  }
  function nextQ(){
    if(!deck)return;
    if(idx>=deck.length-1){setPhase("end");}
    else{setIdx(idx+1);setPicked(null);setPhase("play");}
  }
  function finishSession(){
    var correct=results.filter(function(r){return r.ok;}).length;
    // Gauntlet XP tier B: base 15 + 5 per correct + 35 perfect bonus.
    // Aligned with Word Tavern / SentenceBuilder / Phrasal Picker (15 Q tier)
    // to match the difficulty of the module (typed answers, strict timer).
    var baseXp=correct*5+15;
    if(correct===deck.length)baseXp+=35;
    return p.done(correct,deck.length,baseXp,mistakesRef.current);
  }

  // Render sentence: highlight marker if literal substring match; replace blank with styled span
  function renderSentence(s,marker){
    var cleanMarker=(marker||"").replace(/\s*\([^)]*\)\s*/g,"").trim();
    var parts=[];
    var working=s;
    var highlighted=false;
    if(cleanMarker){
      var lower=working.toLowerCase();
      var pos=lower.indexOf(cleanMarker.toLowerCase());
      if(pos!==-1){
        var before=working.substring(0,pos);
        var match=working.substring(pos,pos+cleanMarker.length);
        var after=working.substring(pos+cleanMarker.length);
        parts=[{t:"text",v:before},{t:"marker",v:match},{t:"text",v:after}];
        highlighted=true;
      }
    }
    if(!highlighted)parts=[{t:"text",v:working}];
    // Now render each part, replacing _____ (5 underscores) with a styled blank
    return parts.map(function(part,i){
      if(part.t==="marker")return(<span key={i} className="chrono-marker">{part.v}</span>);
      var segs=part.v.split(/_{3,}/);
      return(<span key={i}>{segs.map(function(seg,j){
        return(<span key={j}>{seg}{j<segs.length-1&&<span className="chrono-blank">_____</span>}</span>);
      })}</span>);
    });
  }

  // Fin de session : l'XP part ici, avec l'état du dernier rendu, au lieu d'attendre « OK, back »
  // (quitter l'écran la perdait). Un seul envoi.
  useEffect(function(){
    if(phase!=="end"||sentRef.current)return;
    sentRef.current=true;
    sidRef.current=finishSession();
  },[phase]);

  if(phase==="intro"){
    return(<div className="enter" style={{padding:"20px 16px 100px",maxWidth:520,margin:"0 auto"}}>
      <button className="back-btn" onClick={p.back}>{"\u2190"} Back</button>
      <div style={{textAlign:"center",padding:"24px 16px"}}>
        <div style={{marginBottom:14,display:"flex",justifyContent:"center"}}><GIcon name="clockwork" size={64} color="var(--cyan)"/></div>
        <h2 className="out" style={{fontSize:24,fontWeight:800,marginBottom:8}}>Chronomancer</h2>
        <p style={{color:"var(--t3)",fontSize:14,marginBottom:20,lineHeight:1.5}}>Master the storm of verb tenses. Each question hides a temporal clue.</p>
        <div className="crd" style={{maxWidth:340,margin:"0 auto 22px",padding:16,textAlign:"left",fontSize:13.5,color:"var(--t2)",lineHeight:1.7}}>
          <div>{"\uD83D\uDD2E"} <strong>15 questions</strong>, no timer</div>
          <div>{"\uD83D\uDD8D\uFE0F"} Temporal marker in <span style={{color:tone("#c026d3"),fontWeight:700}}>purple</span></div>
          <div>{"\uD83C\uDFC6"} <strong>3 XP</strong> per correct answer · perfect bonus</div>
        </div>
        <button className="btn1" style={{fontSize:16,padding:"14px 32px",fontWeight:800}} onClick={startSession}>{"\u2694\uFE0F Start"}</button>
      </div>
    </div>);
  }

  if(phase==="end"){
    return(<SessionResult session={p.session} sid={sidRef.current} name="Chronomancer" mistakes={mistakesRef.current} onContinue={p.onContinue} onReplay={p.onReplay}/>);
  }

  // phase "play" or "reveal"
  var q=deck[idx];
  var pct=(idx+1)/deck.length*100;
  return(<div className="enter" style={{padding:"16px 16px 100px",maxWidth:520,margin:"0 auto"}}>
    <button className="back-btn" onClick={p.back}>{"\u2190"} Back</button>
    <div style={{fontSize:12,color:"var(--t3)",textAlign:"center",marginBottom:4}}>Question {idx+1} / {deck.length}</div>
    <div style={{width:"100%",height:5,background:"var(--bg3)",borderRadius:99,overflow:"hidden",marginBottom:18}}>
      <div style={{width:pct+"%",height:"100%",background:"linear-gradient(90deg,#7c3aed,#c026d3)",transition:"width .3s ease"}}/>
    </div>
    {/* Marker hint badge */}
    {q.marker&&<div style={{textAlign:"center",marginBottom:14}}>
      <span style={{display:"inline-block",padding:"4px 12px",background:"rgba(124,58,237,.15)",border:"1px solid rgba(192,38,211,.4)",borderRadius:99,color:tone("#d8b4fe"),fontSize:12,fontWeight:700,letterSpacing:.3}}>{"\uD83D\uDD2E  Clue: "}<span style={{color:tone("#e9d5ff")}}>{q.marker}</span></span>
    </div>}
    {/* Sentence */}
    <div className="crd" style={{padding:"18px 16px",marginBottom:14,fontSize:16.5,lineHeight:1.7,color:"var(--t1)"}}>
      {renderSentence(q.s,q.marker)}
    </div>
    {/* Options */}
    <div>
      {q.o.map(function(opt,i){
        var cls="chrono-opt";
        if(phase==="reveal"){
          if(i===q.c)cls+=" correct";
          else if(i===picked)cls+=" wrong";
          else cls+=" faded";
        }
        return(<button key={i} className={cls} disabled={phase==="reveal"} onClick={function(){pickAnswer(i);}}>
          <span style={{display:"inline-block",width:22,fontWeight:800,color:phase==="reveal"&&i===q.c?tone("#22c55e"):phase==="reveal"&&i===picked?tone("#ef4444"):"var(--t3)"}}>{String.fromCharCode(65+i)}.</span>{opt}
        </button>);
      })}
    </div>
    {/* Reveal card */}
    {phase==="reveal"&&<div className="crd enter" style={{padding:14,marginTop:14,borderLeft:"3px solid "+(results[results.length-1]&&results[results.length-1].ok?"#22c55e":"#f59e0b")}}>
      <div style={{fontSize:11,color:"var(--t3)",marginBottom:6,fontWeight:700,letterSpacing:.8,textTransform:"uppercase"}}>{results[results.length-1]&&results[results.length-1].ok?"\u2713 Correct":"Explanation"}</div>
      <div style={{fontSize:13.5,color:"var(--t2)",lineHeight:1.6,marginBottom:10}}>{q.x}</div>
      <button className="btn1" style={{width:"100%",background:"linear-gradient(135deg,#7c3aed,#c026d3)",fontSize:14,padding:"11px",fontWeight:800}} onClick={nextQ}>{idx>=deck.length-1?"See result":"Next question \u2192"}</button>
    </div>}
  </div>);
}
// ─── PASSIVE FORGE — sub-module 3/4 of Grammar Gauntlet ───
// QCM 2-modes (transform vs fill-in). 15 questions per session.
// Timer 30s per question (validated spec): auto-miss on expiry. The timer
// rewards fluency in passive construction — 30s is enough to mentally
// conjugate be + V3, but short enough to discourage guessing-then-reading.
export function PassiveForge(p){
  var SESSION_SIZE=15;
  var TIME_PER_Q=30;
  var [deck,setDeck]=useState(null);
  var [phase,setPhase]=useState("intro"); // intro | play | reveal | end
  var [idx,setIdx]=useState(0);
  var [picked,setPicked]=useState(null); // null | number | -1 (timed out)
  var [results,setResults]=useState([]);
  var [timeLeft,setTimeLeft]=useState(TIME_PER_Q);

  var mistakesRef=useRef([]);var sentRef=useRef(false);var sidRef=useRef(0);
  function startSession(){
    var shuffled=[].concat(PASSIVE_FORGE).sort(function(){return Math.random()-0.5;});
    var d=shuffled.slice(0,Math.min(SESSION_SIZE,shuffled.length)).map(permuteQ);
    setDeck(d);setIdx(0);setResults([]);setPicked(null);
    setTimeLeft(TIME_PER_Q);setPhase("play");
  }
  function pickAnswer(optIdx){
    if(phase!=="play"||!deck)return;
    var q=deck[idx];
    var ok=optIdx===q.c;
    if(!ok)mistakesRef.current.push({tag:"Passive voice",prompt:q.prompt,yours:q.o[optIdx],correct:q.o[q.c],why:(q.active?"Active: “"+q.active+"” — ":"")+q.x,ref:moduleRef("gauntlet",q.id)});
    if(ok){try{playCorrect();}catch(e){console.warn("[forge] sfx:",e&&e.message);}}
    else{try{playWrong();}catch(e){console.warn("[forge] sfx:",e&&e.message);}}
    setPicked(optIdx);
    setResults(results.concat([{q:q,picked:optIdx,ok:ok,timedOut:false}]));
    setPhase("reveal");
  }
  function timeoutQ(){
    if(phase!=="play"||!deck)return;
    try{playWrong();}catch(e){console.warn("[forge] sfx:",e&&e.message);}
    var q=deck[idx];
    mistakesRef.current.push({tag:"Passive voice",prompt:q.prompt,yours:"(time's up)",correct:q.o[q.c],why:(q.active?"Active: “"+q.active+"” — ":"")+q.x,ref:moduleRef("gauntlet",q.id)});
    setPicked(-1);
    setResults(results.concat([{q:q,picked:-1,ok:false,timedOut:true}]));
    setPhase("reveal");
  }
  function nextQ(){
    if(!deck)return;
    if(idx>=deck.length-1){setPhase("end");}
    else{setIdx(idx+1);setPicked(null);setTimeLeft(TIME_PER_Q);setPhase("play");}
  }
  function finishSession(){
    var correct=results.filter(function(r){return r.ok;}).length;
    // Gauntlet XP tier B: base 15 + 5 per correct + 35 perfect bonus.
    // Aligned with Word Tavern / SentenceBuilder / Phrasal Picker (15 Q tier)
    // to match the difficulty of the module (typed answers, strict timer).
    var baseXp=correct*5+15;
    if(correct===deck.length)baseXp+=35;
    return p.done(correct,deck.length,baseXp,mistakesRef.current);
  }
  // Timer — reset is handled in startSession + nextQ (above). Do NOT add a
  // useEffect that resets timeLeft on [idx,phase] : if the previous question
  // ended on a 0-timer auto-timeout, timeLeft stays at 0 across the reveal,
  // and on the next "play" commit Effect 1 fires before the reset effect →
  // timeoutQ() called immediately on Q N+1 (timer "drops to 0" bug, 2026-04-30).
  useEffect(function(){
    if(phase!=="play")return;
    if(timeLeft<=0){timeoutQ();return;}
    var t=setTimeout(function(){setTimeLeft(timeLeft-1);},1000);
    return function(){clearTimeout(t);};
  },[timeLeft,phase]);

  function renderWithBlank(s){
    var segs=s.split(/_{3,}/);
    return segs.map(function(seg,j){
      return(<span key={j}>{seg}{j<segs.length-1&&<span className="chrono-blank">_____</span>}</span>);
    });
  }

  // Fin de session : l'XP part ici, avec l'état du dernier rendu, au lieu d'attendre « OK, back »
  // (quitter l'écran la perdait). Un seul envoi.
  useEffect(function(){
    if(phase!=="end"||sentRef.current)return;
    sentRef.current=true;
    sidRef.current=finishSession();
  },[phase]);

  if(phase==="intro"){
    return(<div className="enter" style={{padding:"20px 16px 100px",maxWidth:520,margin:"0 auto"}}>
      <button className="back-btn" onClick={p.back}>{"\u2190"} Back</button>
      <div style={{textAlign:"center",padding:"24px 16px"}}>
        <div style={{marginBottom:14,display:"flex",justifyContent:"center"}}><GIcon name="anvil-impact" size={64} color="var(--cyan)"/></div>
        <h2 className="out" style={{fontSize:24,fontWeight:800,marginBottom:8}}>Passive Forge</h2>
        <p style={{color:"var(--t3)",fontSize:14,marginBottom:20,lineHeight:1.5}}>Transform active into passive. Forge the right structure in 30 seconds.</p>
        <div className="crd" style={{maxWidth:340,margin:"0 auto 22px",padding:16,textAlign:"left",fontSize:13.5,color:"var(--t2)",lineHeight:1.7}}>
          <div>{"\u2699\uFE0F"} <strong>15 questions</strong>, 2 modes: transform + fill-in</div>
          <div>{"\u23F1\uFE0F"} <strong>30 seconds</strong> per question</div>
          <div>{"\uD83C\uDFC6"} <strong>3 XP</strong> per correct answer · perfect bonus</div>
        </div>
        <button className="btn1" style={{fontSize:16,padding:"14px 32px",fontWeight:800}} onClick={startSession}>{"\u2694\uFE0F Start"}</button>
      </div>
    </div>);
  }

  if(phase==="end"){
    return(<SessionResult session={p.session} sid={sidRef.current} name="Passive Forge" mistakes={mistakesRef.current} onContinue={p.onContinue} onReplay={p.onReplay}/>);
  }

  // phase "play" or "reveal"
  var q=deck[idx];
  var progPct=(idx+1)/deck.length*100;
  var timePct=timeLeft/TIME_PER_Q*100;
  var lastResult=results[results.length-1];
  var isTimedOut=phase==="reveal"&&picked===-1;
  return(<div className="enter" style={{padding:"16px 16px 100px",maxWidth:520,margin:"0 auto"}}>
    <button className="back-btn" onClick={p.back}>{"\u2190"} Back</button>
    <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",fontSize:12,color:"var(--t3)",marginBottom:4}}>
      <span>Question {idx+1} / {deck.length}</span>
      {phase==="play"&&<span style={{fontWeight:700,color:timeLeft<10?tone("#ef4444"):tone("#f59e0b")}}>{"\u23F1\uFE0F "+timeLeft+"s"}</span>}
    </div>
    {/* progress bar */}
    <div style={{width:"100%",height:5,background:"var(--bg3)",borderRadius:99,overflow:"hidden",marginBottom:8}}>
      <div style={{width:progPct+"%",height:"100%",background:"linear-gradient(90deg,#dc2626,#f59e0b)",transition:"width .3s ease"}}/>
    </div>
    {/* timer bar */}
    {phase==="play"&&<div style={{width:"100%",height:4,background:"var(--bg3)",borderRadius:99,overflow:"hidden",marginBottom:16}}>
      <div style={{width:timePct+"%",height:"100%",background:timeLeft<10?"#ef4444":"#f59e0b",transition:"width 1s linear"}}/>
    </div>}
    {phase==="reveal"&&<div style={{marginBottom:16}}/>}
    {/* Mode badge */}
    <div style={{textAlign:"center",marginBottom:12}}>
      <span style={{display:"inline-block",padding:"3px 11px",background:q.mode==="transform"?"rgba(220,38,38,.15)":"rgba(245,158,11,.15)",border:"1px solid "+(q.mode==="transform"?"rgba(220,38,38,.4)":"rgba(245,158,11,.4)"),borderRadius:99,color:q.mode==="transform"?tone("#fca5a5"):tone("#fcd34d"),fontSize:11,fontWeight:700,letterSpacing:.5,textTransform:"uppercase"}}>{q.mode==="transform"?"\uD83D\uDD04 Transform":"\u270D\uFE0F Fill in the blank"}</span>
    </div>
    {/* Active sentence (transform mode only) */}
    {q.mode==="transform"&&q.active&&<div style={{padding:"12px 14px",marginBottom:8,background:"rgba(255,255,255,.04)",border:"1px dashed var(--bg3)",borderRadius:10,fontSize:14,color:"var(--t3)",lineHeight:1.55}}>
      <div style={{fontSize:10,color:"var(--t3)",opacity:.7,marginBottom:3,letterSpacing:1,textTransform:"uppercase",fontWeight:700}}>Active</div>
      {q.active}
    </div>}
    {q.mode==="transform"&&<div style={{textAlign:"center",fontSize:18,color:"var(--t3)",marginBottom:6}}>{"\u2193"}</div>}
    {/* Prompt */}
    <div className="crd" style={{padding:"16px",marginBottom:14,fontSize:16,lineHeight:1.7,color:"var(--t1)"}}>
      {q.mode==="transform"&&<div style={{fontSize:10,color:"var(--t3)",opacity:.7,marginBottom:4,letterSpacing:1,textTransform:"uppercase",fontWeight:700}}>Passive</div>}
      {renderWithBlank(q.prompt)}
    </div>
    {/* Options */}
    <div>
      {q.o.map(function(opt,i){
        var cls="chrono-opt";
        if(phase==="reveal"){
          if(i===q.c)cls+=" correct";
          else if(i===picked&&picked!==-1)cls+=" wrong";
          else cls+=" faded";
        }
        return(<button key={i} className={cls} disabled={phase==="reveal"} onClick={function(){pickAnswer(i);}}>
          <span style={{display:"inline-block",width:22,fontWeight:800,color:phase==="reveal"&&i===q.c?tone("#22c55e"):phase==="reveal"&&i===picked&&picked!==-1?tone("#ef4444"):"var(--t3)"}}>{String.fromCharCode(65+i)}.</span>{opt}
        </button>);
      })}
    </div>
    {/* Reveal card */}
    {phase==="reveal"&&<div className="crd enter" style={{padding:14,marginTop:14,borderLeft:"3px solid "+(lastResult&&lastResult.ok?"#22c55e":isTimedOut?"#ef4444":"#f59e0b")}}>
      <div style={{fontSize:11,color:isTimedOut?tone("#fca5a5"):"var(--t3)",marginBottom:6,fontWeight:700,letterSpacing:.8,textTransform:"uppercase"}}>{lastResult&&lastResult.ok?"\u2713 Correct":isTimedOut?"\u23F1 Time's up":"Explanation"}</div>
      <div style={{fontSize:13.5,color:"var(--t2)",lineHeight:1.6,marginBottom:10}}>{q.x}</div>
      <button className="btn1" style={{width:"100%",background:"linear-gradient(135deg,#dc2626,#f59e0b)",fontSize:14,padding:"11px",fontWeight:800}} onClick={nextQ}>{idx>=deck.length-1?"See result":"Next question \u2192"}</button>
    </div>}
  </div>);
}
// ─── RELATIVE WEAVER — sub-module 4/4 of Grammar Gauntlet ───
// QCM reflection: 15 questions per session, no timer. Mixes defining/
// non-defining, reduced relatives, possession (whose), place/time.
// The item `type` is NOT shown during play (would spoil the answer) but
// shown on the end screen to help the student map weaknesses.
export function RelativeWeaver(p){
  var SESSION_SIZE=15;
  var [deck,setDeck]=useState(null);
  var [phase,setPhase]=useState("intro");
  var [idx,setIdx]=useState(0);
  var [picked,setPicked]=useState(null);
  var [results,setResults]=useState([]);

  var mistakesRef=useRef([]);var sentRef=useRef(false);var sidRef=useRef(0);
  function startSession(){
    var shuffled=[].concat(RELATIVE_WEAVER).sort(function(){return Math.random()-0.5;});
    var d=shuffled.slice(0,Math.min(SESSION_SIZE,shuffled.length)).map(permuteQ);
    setDeck(d);setIdx(0);setResults([]);setPicked(null);setPhase("play");
  }
  function pickAnswer(optIdx){
    if(phase!=="play"||!deck)return;
    var q=deck[idx];
    var ok=optIdx===q.c;
    if(!ok)mistakesRef.current.push({tag:"Relative clauses · "+typeLabel(q.type),prompt:q.s,yours:q.o[optIdx],correct:q.o[q.c],why:q.x,ref:moduleRef("gauntlet",q.id)});
    if(ok){try{playCorrect();}catch(e){console.warn("[weaver] sfx:",e&&e.message);}}
    else{try{playWrong();}catch(e){console.warn("[weaver] sfx:",e&&e.message);}}
    setPicked(optIdx);
    setResults(results.concat([{q:q,picked:optIdx,ok:ok}]));
    setPhase("reveal");
  }
  function nextQ(){
    if(!deck)return;
    if(idx>=deck.length-1){setPhase("end");}
    else{setIdx(idx+1);setPicked(null);setPhase("play");}
  }
  function finishSession(){
    var correct=results.filter(function(r){return r.ok;}).length;
    // Gauntlet XP tier B: base 15 + 5 per correct + 35 perfect bonus.
    // Aligned with Word Tavern / SentenceBuilder / Phrasal Picker (15 Q tier)
    // to match the difficulty of the module (typed answers, strict timer).
    var baseXp=correct*5+15;
    if(correct===deck.length)baseXp+=35;
    return p.done(correct,deck.length,baseXp,mistakesRef.current);
  }
  function renderWithBlank(s){
    var segs=s.split(/_{3,}/);
    return segs.map(function(seg,j){
      return(<span key={j}>{seg}{j<segs.length-1&&<span className="chrono-blank">_____</span>}</span>);
    });
  }
  function typeLabel(t){
    if(!t)return"";
    if(t.indexOf("reduced_relative_active")===0)return"Reduced relative (active)";
    if(t.indexOf("reduced_relative_passive")===0)return"Reduced relative (passive)";
    if(t.indexOf("reduced_relative")===0)return"Reduced relative";
    if(t.indexOf("non_defining")===0)return"Non-defining";
    if(t.indexOf("defining")===0)return"Defining";
    if(t.indexOf("possession")===0)return"Possession (whose)";
    if(t==="place")return"Place (where)";
    if(t==="time")return"Time (when)";
    if(t==="formal_object_person")return"Formal (whom)";
    return t.replace(/_/g," ");
  }

  // Fin de session : l'XP part ici, avec l'état du dernier rendu, au lieu d'attendre « OK, back »
  // (quitter l'écran la perdait). Un seul envoi.
  useEffect(function(){
    if(phase!=="end"||sentRef.current)return;
    sentRef.current=true;
    sidRef.current=finishSession();
  },[phase]);

  if(phase==="intro"){
    return(<div className="enter" style={{padding:"20px 16px 100px",maxWidth:520,margin:"0 auto"}}>
      <button className="back-btn" onClick={p.back}>{"\u2190"} Back</button>
      <div style={{textAlign:"center",padding:"24px 16px"}}>
        <div style={{marginBottom:14,display:"flex",justifyContent:"center"}}><GIcon name="spider-web" size={64} color="var(--cyan)"/></div>
        <h2 className="out" style={{fontSize:24,fontWeight:800,marginBottom:8}}>Relative Weaver</h2>
        <p style={{color:"var(--t3)",fontSize:14,marginBottom:20,lineHeight:1.5}}>Weave the relative clauses. Mind the commas — they change everything.</p>
        <div className="crd" style={{maxWidth:340,margin:"0 auto 22px",padding:16,textAlign:"left",fontSize:13.5,color:"var(--t2)",lineHeight:1.7}}>
          <div>{"\uD83D\uDD78\uFE0F"} <strong>15 questions</strong>, no timer</div>
          <div>{"\uD83D\uDD0D"} Defining, non-defining, reduced, whose</div>
          <div>{"\uD83C\uDFC6"} <strong>3 XP</strong> per correct answer · perfect bonus</div>
        </div>
        <button className="btn1" style={{fontSize:16,padding:"14px 32px",fontWeight:800}} onClick={startSession}>{"\u2694\uFE0F Start"}</button>
      </div>
    </div>);
  }

  if(phase==="end"){
    return(<SessionResult session={p.session} sid={sidRef.current} name="Relative Weaver" mistakes={mistakesRef.current} onContinue={p.onContinue} onReplay={p.onReplay}/>);
  }

  // play / reveal
  var q=deck[idx];
  var progPct=(idx+1)/deck.length*100;
  var lastResult=results[results.length-1];
  return(<div className="enter" style={{padding:"16px 16px 100px",maxWidth:520,margin:"0 auto"}}>
    <button className="back-btn" onClick={p.back}>{"\u2190"} Back</button>
    <div style={{fontSize:12,color:"var(--t3)",textAlign:"center",marginBottom:4}}>Question {idx+1} / {deck.length}</div>
    <div style={{width:"100%",height:5,background:"var(--bg3)",borderRadius:99,overflow:"hidden",marginBottom:18}}>
      <div style={{width:progPct+"%",height:"100%",background:"linear-gradient(90deg,#0891b2,#7c3aed)",transition:"width .3s ease"}}/>
    </div>
    {/* Sentence */}
    <div className="crd" style={{padding:"18px 16px",marginBottom:14,fontSize:16.5,lineHeight:1.7,color:"var(--t1)"}}>
      {renderWithBlank(q.s)}
    </div>
    {/* Options */}
    <div>
      {q.o.map(function(opt,i){
        var cls="chrono-opt";
        if(phase==="reveal"){
          if(i===q.c)cls+=" correct";
          else if(i===picked)cls+=" wrong";
          else cls+=" faded";
        }
        return(<button key={i} className={cls} disabled={phase==="reveal"} onClick={function(){pickAnswer(i);}}>
          <span style={{display:"inline-block",width:22,fontWeight:800,color:phase==="reveal"&&i===q.c?tone("#22c55e"):phase==="reveal"&&i===picked?tone("#ef4444"):"var(--t3)"}}>{String.fromCharCode(65+i)}.</span>{opt}
        </button>);
      })}
    </div>
    {/* Reveal card */}
    {phase==="reveal"&&<div className="crd enter" style={{padding:14,marginTop:14,borderLeft:"3px solid "+(lastResult&&lastResult.ok?"#22c55e":"#f59e0b")}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",gap:8,marginBottom:6,flexWrap:"wrap"}}>
        <span style={{fontSize:11,color:"var(--t3)",fontWeight:700,letterSpacing:.8,textTransform:"uppercase"}}>{lastResult&&lastResult.ok?"\u2713 Correct":"Explanation"}</span>
        <span style={{fontSize:10,color:tone("#d8b4fe"),padding:"2px 8px",background:"rgba(124,58,237,.15)",border:"1px solid rgba(124,58,237,.3)",borderRadius:99,fontWeight:700,letterSpacing:.3}}>{typeLabel(q.type)}</span>
      </div>
      <div style={{fontSize:13.5,color:"var(--t2)",lineHeight:1.6,marginBottom:10}}>{q.x}</div>
      <button className="btn1" style={{width:"100%",background:"linear-gradient(135deg,#0891b2,#7c3aed)",fontSize:14,padding:"11px",fontWeight:800}} onClick={nextQ}>{idx>=deck.length-1?"See result":"Next question \u2192"}</button>
    </div>}
  </div>);
}
// ─── GAUNTLET HUB — entry point for the 4 sub-modules ───
// Internal state `subMode` decides whether to render the hub or a sub-module.
// Passes onModuleDone (from App) the modId when a sub-module completes, so the
// app-level XP/stats recording goes through the standard pipeline
// (applyXpGates, recordModule, trackModSession).
// Flat moduleScores keys used: gauntlet_irregular, gauntlet_tense,
// gauntlet_passive, gauntlet_relative.
export function GauntletHub(p){
  var [openGrim,setOpenGrim]=useState(null);
  var [subMode,setSubMode]=useState(null); // null | "irregular" | "tense" | "passive" | "relative"
  var [subRun,setSubRun]=useState(0); // Play again : remonte l'épreuve par sa clé
  var scores=(p.u&&p.u.moduleScores)||{};
  var cards=[
    {id:"irregular",name:"Irregular Crypt",icon:"tombstone",desc:"Exhume the sleeping irregular verbs. 15 items per raid, type V2 and V3 by hand.",accent:"linear-gradient(90deg,#6b7280,#9ca3af)",bgm:"bgm_crypt",grimoire:null,stats:scores["gauntlet_irregular"],ready:true},
    {id:"tense",name:"Chronomancer",icon:"clockwork",desc:"Master the storm of verb tenses. Markers, contexts, francophone traps.",accent:"linear-gradient(90deg,#7c3aed,#c026d3)",bgm:"bgm_chrono",grimoire:GRIMOIRE_CHRONOMANCER,stats:scores["gauntlet_tense"],ready:true},
    {id:"passive",name:"Passive Forge",icon:"anvil-impact",desc:"Transform active into passive. 13 tenses covered, double-object traps.",accent:"linear-gradient(90deg,#dc2626,#f59e0b)",bgm:"bgm_forge",grimoire:GRIMOIRE_PASSIVE_FORGE,stats:scores["gauntlet_passive"],ready:true},
    {id:"relative",name:"Relative Weaver",icon:"spider-web",desc:"Weave relative clauses. Defining, non-defining, reduced relatives.",accent:"linear-gradient(90deg,#0891b2,#7c3aed)",bgm:"bgm_weaver",grimoire:GRIMOIRE_RELATIVE_WEAVER,stats:scores["gauntlet_relative"],ready:true}
  ];
  function fmtAcc(s){if(!s||!s.total)return"\u2014";return Math.round((s.correct/s.total)*100)+"%";}
  function enterSub(card){
    if(!card.ready){alert("Sub-module under development. Coming in the next step!");return;}
    try{playBGM(card.bgm);}catch(e){console.warn("[gauntlet] bgm:",e&&e.message);}
    setSubMode(card.id);
  }
  // `mistakes` : la liste de l'épreuve, ses `ref` entrent au bestiaire (route, onModuleDone).
  function subDone(sc,tot,xp,mistakes){
    try{stopBGM();}catch(e){console.warn("[gauntlet] bgm stop:",e&&e.message);}
    try{haptic("complete");}catch(e){console.warn("[gauntlet] haptic:",e&&e.message);}
    // L'épreuve reste affichée : elle montre l'écran de fin commun, dont Continue ramène au hub.
    return p.onModuleDone?p.onModuleDone(subMode,sc,tot,xp,mistakes):0;
  }
  function subContinue(){p.closeSession();setSubMode(null);}
  function subReplay(){
    p.closeSession();
    var card=cards.find(function(c){return c.id===subMode;});
    if(card){try{playBGM(card.bgm);}catch(e){console.warn("[gauntlet] bgm:",e&&e.message);}}
    setSubRun(function(k){return k+1;});
  }
  function subAbort(){
    try{stopBGM();}catch(e){console.warn("[gauntlet] bgm stop:",e&&e.message);}
    setSubMode(null);
  }
  // ── Sub-module rendering ──
  var subKey=subMode+":"+subRun;
  if(subMode==="irregular")return(<IrregularCrypt key={subKey} u={p.u} done={subDone} back={subAbort} session={p.session} onContinue={subContinue} onReplay={subReplay}/>);
  if(subMode==="tense")return(<Chronomancer key={subKey} u={p.u} done={subDone} back={subAbort} session={p.session} onContinue={subContinue} onReplay={subReplay}/>);
  if(subMode==="passive")return(<PassiveForge key={subKey} u={p.u} done={subDone} back={subAbort} session={p.session} onContinue={subContinue} onReplay={subReplay}/>);
  if(subMode==="relative")return(<RelativeWeaver key={subKey} u={p.u} done={subDone} back={subAbort} session={p.session} onContinue={subContinue} onReplay={subReplay}/>);

  return(<div className="gauntlet-hub enter">
    <button className="back-btn" onClick={p.back}>{"\u2190"} Back</button>
    <div className="gauntlet-header">
      <div style={{marginBottom:6,filter:"drop-shadow(0 4px 14px rgba(124,58,237,.45))",display:"flex",justifyContent:"center"}}><GIcon name="gauntlet" size={52} color="var(--cyan)"/></div>
      <h2 className="gauntlet-title">GRAMMAR GAUNTLET</h2>
      <div className="gauntlet-sub">Four trials. One crown.</div>
    </div>
    {cards.map(function(c){return(
      <div key={c.id} className="gauntlet-card">
        <div className="gauntlet-card-accent" style={{background:c.accent}}/>
        <div className="gauntlet-card-head">
          <div className="gauntlet-card-icon">{GAME_ICON_PATHS[c.icon]?<GIcon name={c.icon} size={32} color="currentColor"/>:c.icon}</div>
          <div style={{flex:1,minWidth:0}}>
            <div className="gauntlet-card-name">{c.name}{!c.ready&&<span style={{fontSize:10,marginLeft:8,padding:"2px 7px",background:"rgba(245,223,170,.12)",color:tone("#f5dfaa"),borderRadius:99,fontWeight:700,letterSpacing:.3,verticalAlign:"middle"}}>soon</span>}</div>
          </div>
        </div>
        <div className="gauntlet-card-desc">{c.desc}</div>
        <div className="gauntlet-card-stats">
          <span>{(c.stats&&c.stats.sessions)||0} session{c.stats&&c.stats.sessions>1?"s":""}</span>
          <span>{"\u00b7"}</span>
          <span>Accuracy: {fmtAcc(c.stats)}</span>
        </div>
        <div className="gauntlet-card-actions">
          <button className="gauntlet-btn-enter" style={c.ready?{}:{opacity:.55}} onClick={function(){enterSub(c);}}><GIcon name="dungeon-gate" size={16} color="currentColor" style={{marginRight:6}}/>Entrer</button>
          {c.grimoire&&<button className="gauntlet-btn-grim" onClick={function(){setOpenGrim(c.grimoire);}}><GIcon name="bookmarklet" size={16} color="currentColor" style={{marginRight:6}}/>Grimoire</button>}
        </div>
      </div>
    );})}
    {openGrim&&<GrimoireReader grimoire={openGrim} back={function(){setOpenGrim(null);}}/>}
  </div>);
}
