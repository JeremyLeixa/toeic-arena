// Extrait de src/App.jsx le 2026-09-15 (refactor split-app, REFACTOR_PLAN.md). Code déplacé tel quel.
import { GrimoireReader } from "../../components/GrimoireReader.jsx";
import { GIcon } from "../../components/icons.jsx";
import { SessionResult } from "../../components/SessionResult.jsx";
import { SessionTop, ComboBanner, AnswerCard, NextBar } from "../../components/SessionHud.jsx";
import { useSessionTrack } from "../../components/useSessionTrack.js";
import { GAME_ICON_PATHS } from "../../data/avatarIcons.js";
import { IRREGULAR_VERBS, TENSE_CHRONOMANCER, PASSIVE_FORGE, RELATIVE_WEAVER } from "../../data/grammarGauntlet.js";
import { GRIMOIRE_CHRONOMANCER, GRIMOIRE_PASSIVE_FORGE, GRIMOIRE_RELATIVE_WEAVER } from "../../data/grammarGauntletGrimoire.js";
import { GRIMOIRE_CONNECTORS } from "../../data/connectorsGrimoire.js";
import { GRIMOIRE_GERUND } from "../../data/gerundGrimoire.js";
import { CONNECTORS, CONNECTOR_RULES, PREP_COLLOCATIONS, GERUND_INF } from "../../data/miniGames.js";
import { SpeakBtn } from "../../components/SpeakBtn.jsx";
import { haptic } from "../../lib/device.js";
import { gauntletModId } from "../../lib/gauntletTrials.js";
import { moduleRef } from "../../lib/reviewRefs.js";
import { shuffle, shuffleOpts } from "../../lib/util.js";
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
  var track=useSessionTrack(); // HUD de session (lot 6, 2026-09-20)
  var [paused,setPaused]=useState(false); // feuille « Leave this round? » : le minuteur s'arrête
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
    track.record(v2Ok&&v3Ok);
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
    if(phase!=="play"||paused)return;
    if(timeLeft<=0){submit();return;}
    var t=setTimeout(function(){setTimeLeft(timeLeft-1);},1000);
    return function(){clearTimeout(t);};
  },[timeLeft,phase,paused]);

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
  return(<>
    <SessionTop n={deck.length} cur={idx} results={track.results} streak={track.streak} onQuit={p.back} onSheet={setPaused}
      aside={phase==="play"
        ?<span className="out" style={{fontSize:18,fontWeight:800,color:timeLeft<5?"var(--red)":"var(--cyan)"}}>{timeLeft}</span>
        :<span className="out" style={{fontSize:13,color:"var(--t3)",fontWeight:600}}>{(idx+1)+"/"+deck.length}</span>}/>
    <ComboBanner combo={track.combo}/>
    <div className="enter" style={{padding:"4px 16px 0",maxWidth:480,margin:"0 auto"}}>
    <div style={{textAlign:"center",padding:"4px 0 22px"}}>
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
        <AnswerCard ok={revealData.v2Ok&&revealData.v3Ok} label="Meaning">
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
        </AnswerCard>
        <div style={{textAlign:"center",fontSize:11,color:"var(--t3)",opacity:.7,marginTop:10}}>Next in a moment...</div>
      </div>
    )}
    </div>
  </>);
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
  var track=useSessionTrack(); // HUD de session (lot 6, 2026-09-20)
  function startSession(){
    var shuffled=[].concat(TENSE_CHRONOMANCER).sort(function(){return Math.random()-0.5;});
    var d=shuffled.slice(0,Math.min(SESSION_SIZE,shuffled.length)).map(permuteQ);
    setDeck(d);setIdx(0);setResults([]);setPicked(null);setPhase("play");
  }
  function pickAnswer(optIdx){
    if(phase!=="play"||!deck)return;
    var q=deck[idx];
    var ok=optIdx===q.c;
    track.record(ok);
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
  return(<>
    <SessionTop n={deck.length} cur={idx} results={track.results} streak={track.streak} onQuit={p.back}/>
    <ComboBanner combo={track.combo}/>
    <div className="enter" style={{padding:"4px 16px 0",maxWidth:520,margin:"0 auto"}}>
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
    {phase==="reveal"&&<AnswerCard ok={!!(results[results.length-1]&&results[results.length-1].ok)}
      answer={String.fromCharCode(65+q.c)+". "+q.o[q.c]} why={q.x}/>}
    </div>
    {phase==="reveal"&&<NextBar onNext={nextQ} last={idx>=deck.length-1} label={idx>=deck.length-1?"See result":"Next question"}/>}
  </>);
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
  var track=useSessionTrack(); // HUD de session (lot 6, 2026-09-20)
  var [paused,setPaused]=useState(false); // feuille « Leave this round? » : le minuteur s'arrête
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
    track.record(ok);
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
    track.record(false);
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
    if(phase!=="play"||paused)return;
    if(timeLeft<=0){timeoutQ();return;}
    var t=setTimeout(function(){setTimeLeft(timeLeft-1);},1000);
    return function(){clearTimeout(t);};
  },[timeLeft,phase,paused]);

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
  var lastResult=results[results.length-1];
  var isTimedOut=phase==="reveal"&&picked===-1;
  return(<>
    <SessionTop n={deck.length} cur={idx} results={track.results} streak={track.streak} onQuit={p.back} onSheet={setPaused}
      aside={phase==="play"
        ?<span className="out" style={{fontSize:18,fontWeight:800,color:timeLeft<10?"var(--red)":"var(--orange)"}}>{timeLeft}</span>
        :<span className="out" style={{fontSize:13,color:"var(--t3)",fontWeight:600}}>{(idx+1)+"/"+deck.length}</span>}/>
    <ComboBanner combo={track.combo}/>
    <div className="enter" style={{padding:"4px 16px 0",maxWidth:520,margin:"0 auto"}}>
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
    {phase==="reveal"&&<AnswerCard ok={!!(lastResult&&lastResult.ok)} timeout={isTimedOut}
      answer={String.fromCharCode(65+q.c)+". "+q.o[q.c]} why={q.x}/>}
    </div>
    {phase==="reveal"&&<NextBar onNext={nextQ} last={idx>=deck.length-1} label={idx>=deck.length-1?"See result":"Next question"}/>}
  </>);
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
  var track=useSessionTrack(); // HUD de session (lot 6, 2026-09-20)
  function startSession(){
    var shuffled=[].concat(RELATIVE_WEAVER).sort(function(){return Math.random()-0.5;});
    var d=shuffled.slice(0,Math.min(SESSION_SIZE,shuffled.length)).map(permuteQ);
    setDeck(d);setIdx(0);setResults([]);setPicked(null);setPhase("play");
  }
  function pickAnswer(optIdx){
    if(phase!=="play"||!deck)return;
    var q=deck[idx];
    var ok=optIdx===q.c;
    track.record(ok);
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
  var lastResult=results[results.length-1];
  return(<>
    <SessionTop n={deck.length} cur={idx} results={track.results} streak={track.streak} onQuit={p.back}/>
    <ComboBanner combo={track.combo}/>
    <div className="enter" style={{padding:"4px 16px 0",maxWidth:520,margin:"0 auto"}}>
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
    {/* Le type de relative sert d'étiquette à l'explication (il n'est pas montré pendant la question). */}
    {phase==="reveal"&&<AnswerCard ok={!!(lastResult&&lastResult.ok)}
      answer={String.fromCharCode(65+q.c)+". "+q.o[q.c]} label={typeLabel(q.type)} why={q.x}/>}
    </div>
    {phase==="reveal"&&<NextBar onNext={nextQ} last={idx>=deck.length-1} label={idx>=deck.length-1?"See result":"Next question"}/>}
  </>);
}
// ═══ LES 3 ÉPREUVES DU 2026-09-25 ═══════════════════════════════════════════════════════════════════════
// Anciens modules seuls (Connectors Sorting, Preposition Collocations, Gerund vs Infinitive), entrés au Gauntlet
// avec son habit : 15 Q, barème B (15 + 5 par bonne réponse + 35 sans faute), écran de fin du hub, grimoire sur la
// carte. Ils comptent SOUS LEURS IDS D'ORIGINE (lib/gauntletTrials.js) : historique, estimateur, échelons et refs
// du bestiaire (moduleRef("connsort" | "prepdrill" | "gerinf", …), inchangées) continuent sans migration.
// Proto : prototypes/gauntlet-seven/ (noms choisis par Jérémy).

// Écran d'entrée commun aux trois (même gabarit que Chronomancer).
function TrialIntro(p){
  return(<div className="enter" style={{padding:"20px 16px 100px",maxWidth:520,margin:"0 auto"}}>
    <button className="back-btn" onClick={p.back}>{"←"} Back</button>
    <div style={{textAlign:"center",padding:"24px 16px"}}>
      <div style={{marginBottom:14,display:"flex",justifyContent:"center"}}><GIcon name={p.icon} size={64} color="var(--cyan)"/></div>
      <h2 className="out" style={{fontSize:24,fontWeight:800,marginBottom:8}}>{p.name}</h2>
      <p style={{color:"var(--t3)",fontSize:14,marginBottom:20,lineHeight:1.5}}>{p.lead}</p>
      <div className="crd" style={{maxWidth:340,margin:"0 auto 22px",padding:16,textAlign:"left",fontSize:13.5,color:"var(--t2)",lineHeight:1.7}}>
        {p.rules.map(function(r,i){return(<div key={i} style={{display:"flex",alignItems:"center",gap:8}}><GIcon name={r[0]} size={16} color="var(--cyan)"/><span>{r[1]}</span></div>);})}
      </div>
      <button className="btn1" style={{fontSize:16,padding:"14px 32px",fontWeight:800}} onClick={p.onStart}>Start</button>
    </div>
  </div>);
}
// Barème B des épreuves (voir CLAUDE.md du dossier).
function trialXp(sc,tot){return 15+5*sc+(tot>0&&sc===tot?35:0);}

// ─── KNOTBINDER — connecteurs : ce qui suit (proposition, nom / -ing, nouvelle phrase). Module connsort ───
export function Knotbinder(p){
  var SESSION_SIZE=15;
  var [deck]=useState(function(){return shuffle(CONNECTORS).slice(0,SESSION_SIZE);});
  var [phase,setPhase]=useState("intro"); // intro | play | reveal | end
  var [idx,setIdx]=useState(0);var [picked,setPicked]=useState(null);var [sc,setSc]=useState(0);var [sk,setSk]=useState(false);
  var mistakesRef=useRef([]);var sentRef=useRef(false);var sidRef=useRef(0);
  var track=useSessionTrack();
  var rules=CONNECTOR_RULES;
  function lab(id){var r=rules.find(function(x){return x.id===id;});return r?r.label:id;}
  function pick(rule){
    if(phase!=="play")return;
    var it=deck[idx],ok=rule===it.rule;
    track.record(ok);
    if(!ok)mistakesRef.current.push({tag:"Connectors",prompt:it.word,noBlank:true,yours:lab(rule),correct:lab(it.rule),why:it.tip+(it.ex?" — “"+it.ex+"”":""),ref:moduleRef("connsort",it.word)});
    if(ok){setSc(sc+1);try{playCorrect();}catch(e){console.warn("[knot] sfx:",e&&e.message);}}
    else{try{playWrong();}catch(e){console.warn("[knot] sfx:",e&&e.message);}setSk(true);setTimeout(function(){setSk(false);},400);}
    setPicked(rule);setPhase("reveal");
  }
  function nextQ(){if(idx>=deck.length-1)setPhase("end");else{setIdx(idx+1);setPicked(null);setPhase("play");}}
  useEffect(function(){
    if(phase!=="end"||sentRef.current)return;
    sentRef.current=true;
    sidRef.current=p.done(sc,deck.length,trialXp(sc,deck.length),mistakesRef.current);
  },[phase]); // eslint-disable-line react-hooks/exhaustive-deps

  if(phase==="intro")return(<TrialIntro icon="knot" name="Knotbinder" back={p.back} onStart={function(){setPhase("play");}}
    lead="Tie every idea with the right knot. What must follow each connector?"
    rules={[["knot","15 connectors, no timer"],["scroll-unfurled","A clause, a noun / -ing, or a new sentence"],["trophy-cup","Perfect run: +35 XP bonus"]]}/>);
  if(phase==="end")return(<SessionResult session={p.session} sid={sidRef.current} name="Knotbinder" mistakes={mistakesRef.current} onContinue={p.onContinue} onReplay={p.onReplay}/>);

  var it=deck[idx],show=phase==="reveal";
  return(<>
    <SessionTop n={deck.length} cur={idx} results={track.results} streak={track.streak} onQuit={p.back}/>
    <ComboBanner combo={track.combo}/>
    <div className={sk?"sk":""} style={{padding:"4px 16px 0",maxWidth:520,margin:"0 auto"}}>
      <div style={{textAlign:"center",marginTop:12,marginBottom:28}}>
        <div className="out" style={{fontSize:11,color:"var(--purple)",textTransform:"uppercase",letterSpacing:1,fontWeight:600,marginBottom:16}}>THIS CONNECTOR IS FOLLOWED BY...</div>
        <div className="out" style={{fontWeight:800,fontSize:30,marginBottom:4}}>{it.word}</div>
      </div>
      <div style={{display:"flex",flexDirection:"column",gap:10}}>
        {rules.map(function(r){
          var isCor=r.id===it.rule,isPick=picked===r.id,bg="var(--bg2)",bd="var(--bdr)";
          if(show&&isCor){bg="rgba(0,230,118,.12)";bd="var(--green)";}
          else if(show&&isPick){bg="rgba(255,71,87,.12)";bd="var(--red)";}
          return(<button key={r.id} onClick={function(){pick(r.id);}} disabled={show}
            style={{display:"flex",alignItems:"center",gap:14,padding:"16px",background:bg,border:"1px solid "+bd,borderRadius:14,cursor:show?"default":"pointer",textAlign:"left",transition:"all .2s"}}>
            <div style={{width:10,height:10,borderRadius:"50%",background:r.col,flexShrink:0}}/>
            <div><div className="out" style={{fontWeight:700,fontSize:15,color:show&&isCor?"var(--green)":show&&isPick?"var(--red)":"var(--t1)"}}>{r.label}</div>
              <div style={{fontSize:11,color:"var(--t3)"}}>{r.desc}</div></div></button>);})}
      </div>
      {show&&<AnswerCard ok={picked===it.rule} answer={lab(it.rule)}>
        <p className="ss-why">{it.tip}</p>
        {it.ex&&<p className="ss-why" style={{color:"var(--t2)",fontStyle:"italic",marginTop:8}}>{"“"+it.ex+"”"}</p>}
      </AnswerCard>}
    </div>
    {show&&<NextBar onNext={nextQ} last={idx>=deck.length-1} label={idx>=deck.length-1?"See result":"Next question"}/>}
  </>);
}

// ─── ANCHOR HALL — prépositions qui vont avec le mot (interested in, depend on…). Module prepdrill ───
export function AnchorHall(p){
  var SESSION_SIZE=15;
  var [deck]=useState(function(){return shuffle(PREP_COLLOCATIONS).slice(0,SESSION_SIZE);});
  // La grille : toutes les prépositions de la banque (8), dans un ordre fixe : la place ne dit rien.
  var preps=useState(function(){var s={};PREP_COLLOCATIONS.forEach(function(c){s[c.prep]=true;});return Object.keys(s).sort();})[0];
  var [phase,setPhase]=useState("intro");
  var [idx,setIdx]=useState(0);var [picked,setPicked]=useState(null);var [sc,setSc]=useState(0);var [sk,setSk]=useState(false);
  var mistakesRef=useRef([]);var sentRef=useRef(false);var sidRef=useRef(0);
  var track=useSessionTrack();
  function isRight(it,pr){return pr===it.prep||!!(it.alts&&it.alts.indexOf(pr)>=0);}
  function pick(pr){
    if(phase!=="play")return;
    var it=deck[idx],ok=isRight(it,pr);
    track.record(ok);
    if(!ok)mistakesRef.current.push({tag:"Prepositions",prompt:it.base+" _____",yours:pr,correct:it.prep+(it.alts&&it.alts.length?" / "+it.alts.join(" / "):""),why:it.ex,ref:moduleRef("prepdrill",it.base)});
    if(ok){setSc(sc+1);try{playCorrect();}catch(e){console.warn("[anchor] sfx:",e&&e.message);}}
    else{try{playWrong();}catch(e){console.warn("[anchor] sfx:",e&&e.message);}setSk(true);setTimeout(function(){setSk(false);},400);}
    setPicked(pr);setPhase("reveal");
  }
  function nextQ(){if(idx>=deck.length-1)setPhase("end");else{setIdx(idx+1);setPicked(null);setPhase("play");}}
  useEffect(function(){
    if(phase!=="end"||sentRef.current)return;
    sentRef.current=true;
    sidRef.current=p.done(sc,deck.length,trialXp(sc,deck.length),mistakesRef.current);
  },[phase]); // eslint-disable-line react-hooks/exhaustive-deps

  if(phase==="intro")return(<TrialIntro icon="anchor" name="Anchor Hall" back={p.back} onStart={function(){setPhase("play");}}
    lead="Every word drops its own anchor. Find the preposition that holds it."
    rules={[["anchor","15 words, no timer"],["linked-rings","Adjectives, verbs and set expressions"],["trophy-cup","Perfect run: +35 XP bonus"]]}/>);
  if(phase==="end")return(<SessionResult session={p.session} sid={sidRef.current} name="Anchor Hall" mistakes={mistakesRef.current} onContinue={p.onContinue} onReplay={p.onReplay}/>);

  var it=deck[idx],show=phase==="reveal",ok=picked!=null&&isRight(it,picked);
  return(<>
    <SessionTop n={deck.length} cur={idx} results={track.results} streak={track.streak} onQuit={p.back}/>
    <ComboBanner combo={track.combo}/>
    <div className={sk?"sk":""} style={{padding:"4px 16px 0",maxWidth:520,margin:"0 auto"}}>
      <div style={{textAlign:"center",marginTop:12,marginBottom:28}}>
        <div className="out" style={{fontSize:11,color:"var(--cyan)",textTransform:"uppercase",letterSpacing:1,fontWeight:600,marginBottom:16}}>COMPLETE THE COLLOCATION</div>
        <div style={{display:"flex",alignItems:"center",justifyContent:"center",gap:10}}>
          <div className="out" style={{fontWeight:800,fontSize:30}}>{it.base} <span style={{color:"var(--cyan)"}}>_____</span></div>
          <SpeakBtn text={it.base} size={32}/></div>
        <div style={{fontSize:12,color:"var(--t3)",marginTop:6}}>({it.type==="verb"?"verb":it.type==="adj"?"adjective":"expression"} + preposition)</div>
      </div>
      <div style={{display:"grid",gridTemplateColumns:"repeat(4, 1fr)",gap:8}}>
        {preps.map(function(pr){
          var isCor=isRight(it,pr),isPick=picked===pr,bg="var(--bg2)",bd="var(--bdr)",col="var(--t1)";
          if(show&&isCor){bg="rgba(0,230,118,.12)";bd="var(--green)";col="var(--green)";}
          else if(show&&isPick){bg="rgba(255,71,87,.12)";bd="var(--red)";col="var(--red)";}
          return(<button key={pr} onClick={function(){pick(pr);}} disabled={show}
            style={{padding:"14px 8px",background:bg,border:"1px solid "+bd,borderRadius:12,cursor:show?"default":"pointer",transition:"all .2s"}}>
            <div className="out" style={{fontWeight:700,fontSize:16,color:col,textTransform:"uppercase"}}>{pr}</div></button>);})}
      </div>
      {show&&<AnswerCard ok={ok} answer={it.base+" "+it.prep} label="Example">
        <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:6,flexWrap:"wrap"}}>
          <p className="ss-why"><strong>{it.base} {it.prep}</strong>{it.alts&&it.alts.length?<span style={{color:"var(--t2)",fontWeight:500}}>{" / "}<strong style={{color:"var(--t1)"}}>{it.base} {it.alts.join(" / ")}</strong>{" (both accepted)"}</span>:null}</p>
          <SpeakBtn text={it.base+" "+it.prep} size={26}/></div>
        <div style={{display:"flex",alignItems:"flex-start",gap:8}}>
          <p className="ss-why" style={{color:"var(--t2)",fontStyle:"italic",flex:1}}>{"“"+it.ex+"”"}</p>
          <SpeakBtn text={it.ex} size={24} rate={0.85}/></div>
      </AnswerCard>}
    </div>
    {show&&<NextBar onNext={nextQ} last={idx>=deck.length-1} label={idx>=deck.length-1?"See result":"Next question"}/>}
  </>);
}

// ─── TWIN PATHS — gérondif ou infinitif, en contexte. Module gerinf ───
// 15 phrases tirées parmi 45 (l'ancien module les jouait toutes à chaque partie), options permutées.
function permuteGI(it){var s=shuffleOpts(it.opts,it.c);return Object.assign({},it,{opts:s.opts,c:s.c});}
var GI_PATTERN={ing:"always -ING",to:"always TO",both:"depends on meaning",prep:"preposition → -ING"};
export function TwinPaths(p){
  var SESSION_SIZE=15;
  var [deck]=useState(function(){return shuffle(GERUND_INF).slice(0,SESSION_SIZE).map(permuteGI);});
  var [phase,setPhase]=useState("intro");
  var [idx,setIdx]=useState(0);var [picked,setPicked]=useState(null);var [sc,setSc]=useState(0);var [sk,setSk]=useState(false);
  var mistakesRef=useRef([]);var sentRef=useRef(false);var sidRef=useRef(0);
  var track=useSessionTrack();
  function pick(i){
    if(phase!=="play")return;
    var q=deck[idx],ok=i===q.c;
    track.record(ok);
    if(!ok)mistakesRef.current.push({tag:"Gerund vs infinitive · "+q.verb,prompt:q.ctx,yours:q.opts[i],correct:q.opts[q.c],why:q.tip+(q.ex?" — “"+q.ex+"”":""),ref:moduleRef("gerinf",q.verb)});
    if(ok){setSc(sc+1);try{playCorrect();}catch(e){console.warn("[twin] sfx:",e&&e.message);}}
    else{try{playWrong();}catch(e){console.warn("[twin] sfx:",e&&e.message);}setSk(true);setTimeout(function(){setSk(false);},400);}
    setPicked(i);setPhase("reveal");
  }
  function nextQ(){if(idx>=deck.length-1)setPhase("end");else{setIdx(idx+1);setPicked(null);setPhase("play");}}
  useEffect(function(){
    if(phase!=="end"||sentRef.current)return;
    sentRef.current=true;
    sidRef.current=p.done(sc,deck.length,trialXp(sc,deck.length),mistakesRef.current);
  },[phase]); // eslint-disable-line react-hooks/exhaustive-deps

  if(phase==="intro")return(<TrialIntro icon="split-arrows" name="Twin Paths" back={p.back} onStart={function(){setPhase("play");}}
    lead="Two roads after every verb: -ing or to. Only one leads on."
    rules={[["split-arrows","15 sentences, no timer"],["scales","Always -ing, always to, or it depends"],["trophy-cup","Perfect run: +35 XP bonus"]]}/>);
  if(phase==="end")return(<SessionResult session={p.session} sid={sidRef.current} name="Twin Paths" mistakes={mistakesRef.current} onContinue={p.onContinue} onReplay={p.onReplay}/>);

  var q=deck[idx],show=phase==="reveal",parts=q.ctx.split("_____");
  return(<>
    <SessionTop n={deck.length} cur={idx} results={track.results} streak={track.streak} onQuit={p.back}/>
    <ComboBanner combo={track.combo}/>
    <div className={sk?"sk":""} style={{padding:"4px 16px 0",maxWidth:520,margin:"0 auto"}}>
      <div style={{marginBottom:24}}>
        <span className="out" style={{fontSize:11,color:"var(--purple)",fontWeight:700,textTransform:"uppercase",letterSpacing:1,display:"block",marginBottom:12}}>Choose the correct form</span>
        <p className="out" style={{fontSize:17,fontWeight:700,lineHeight:1.6,color:"var(--t1)"}}>{parts[0]}<span style={{color:"var(--cyan)",fontWeight:900}}>_____</span>{parts[1]}</p>
      </div>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
        {q.opts.map(function(opt,i){
          var isCor=i===q.c,isPick=i===picked,bg="var(--bg2)",bd="var(--bdr)",col="var(--t1)";
          if(show&&isCor){bg="rgba(0,230,118,.15)";bd="var(--green)";col="var(--green)";}
          else if(show&&isPick){bg="rgba(255,71,87,.15)";bd="var(--red)";col="var(--red)";}
          return(<button key={i} onClick={function(){pick(i);}} disabled={show}
            style={{padding:"18px 14px",background:bg,border:"2px solid "+bd,borderRadius:14,cursor:show?"default":"pointer",fontSize:16,fontWeight:700,color:col,fontFamily:"'DM Sans',sans-serif",transition:"all .15s",textAlign:"center"}}>{opt}</button>);
        })}
      </div>
      {show&&<AnswerCard ok={picked===q.c} answer={q.opts[q.c]} label="Why">
        <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:6,flexWrap:"wrap"}}>
          <span className="out" style={{fontWeight:700,fontSize:15,color:"var(--cyan)"}}>{q.verb}</span>
          <span style={{fontSize:11,fontWeight:600,padding:"2px 8px",borderRadius:99,
            background:q.pattern==="ing"?"rgba(255,140,66,.1)":q.pattern==="to"?"rgba(var(--cx),.1)":q.pattern==="both"?"rgba(255,71,87,.1)":"rgba(27,112,207,.1)",
            color:q.pattern==="ing"?"var(--orange)":q.pattern==="to"?"var(--cyan)":q.pattern==="both"?"var(--red)":"var(--purple)"}}>{GI_PATTERN[q.pattern]||q.pattern}</span>
        </div>
        <p style={{fontSize:12,color:"var(--t2)",lineHeight:1.6,marginBottom:4}}>{q.tip}</p>
        <p style={{fontSize:12,color:"var(--t3)",fontStyle:"italic"}}>{"“"+q.ex+"”"}</p>
      </AnswerCard>}
    </div>
    {show&&<NextBar onNext={nextQ} last={idx>=deck.length-1} label={idx>=deck.length-1?"See result":"Next question"}/>}
  </>);
}

// ─── GAUNTLET HUB — entry point for the 7 trials ───
// Internal state `subMode` decides whether to render the hub or a sub-module.
// Passes onModuleDone (from App) the modId when a sub-module completes, so the
// app-level XP/stats recording goes through the standard pipeline
// (applyXpGates, recordModule, trackModSession).
// Flat moduleScores keys: gauntlet_irregular, gauntlet_tense, gauntlet_passive, gauntlet_relative, puis connsort,
// prepdrill, gerinf pour les 3 épreuves du 2026-09-25 (table dans lib/gauntletTrials.js, lue aussi par la route).
export function GauntletHub(p){
  var [openGrim,setOpenGrim]=useState(null);
  var [subMode,setSubMode]=useState(null); // null | un id de GAUNTLET_SUBS (lib/gauntletTrials.js)
  var [subRun,setSubRun]=useState(0); // Play again : remonte l'épreuve par sa clé
  var scores=(p.u&&p.u.moduleScores)||{};
  var cards=[
    {id:"irregular",name:"Irregular Crypt",icon:"tombstone",desc:"Exhume the sleeping irregular verbs. 15 items per raid, type V2 and V3 by hand.",accent:"linear-gradient(90deg,#6b7280,#9ca3af)",bgm:"bgm_crypt",grimoire:null,stats:scores["gauntlet_irregular"],ready:true},
    {id:"tense",name:"Chronomancer",icon:"clockwork",desc:"Master the storm of verb tenses. Markers, contexts, francophone traps.",accent:"linear-gradient(90deg,#7c3aed,#c026d3)",bgm:"bgm_chrono",grimoire:GRIMOIRE_CHRONOMANCER,stats:scores["gauntlet_tense"],ready:true},
    {id:"passive",name:"Passive Forge",icon:"anvil-impact",desc:"Transform active into passive. 13 tenses covered, double-object traps.",accent:"linear-gradient(90deg,#dc2626,#f59e0b)",bgm:"bgm_forge",grimoire:GRIMOIRE_PASSIVE_FORGE,stats:scores["gauntlet_passive"],ready:true},
    {id:"relative",name:"Relative Weaver",icon:"spider-web",desc:"Weave relative clauses. Defining, non-defining, reduced relatives.",accent:"linear-gradient(90deg,#0891b2,#7c3aed)",bgm:"bgm_weaver",grimoire:GRIMOIRE_RELATIVE_WEAVER,stats:scores["gauntlet_relative"],ready:true},
    // 2026-09-25 : musiques réutilisées (choix de Jérémy), bgm_bridge est aussi celle de Linking Bridge.
    {id:"connectors",name:"Knotbinder",icon:"knot",desc:"Tie every idea with the right knot. Clause, noun, or a brand-new sentence?",accent:"linear-gradient(90deg,#8b5e83,#c4587a)",bgm:"bgm_bridge",grimoire:GRIMOIRE_CONNECTORS,stats:scores[gauntletModId("connectors")],ready:true},
    {id:"prepositions",name:"Anchor Hall",icon:"anchor",desc:"Every word drops its own anchor. Interested in, depend on, responsible for: find it.",accent:"linear-gradient(90deg,#1d4ed8,#06b6d4)",bgm:"bgm_clue",grimoire:null,stats:scores[gauntletModId("prepositions")],ready:true},
    {id:"gerund",name:"Twin Paths",icon:"split-arrows",desc:"Two roads after every verb: -ing or to. Only one leads on.",accent:"linear-gradient(90deg,#e11d48,#f59e0b)",bgm:"bgm_verdict",grimoire:GRIMOIRE_GERUND,stats:scores[gauntletModId("gerund")],ready:true}
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
  if(subMode==="connectors")return(<Knotbinder key={subKey} u={p.u} done={subDone} back={subAbort} session={p.session} onContinue={subContinue} onReplay={subReplay}/>);
  if(subMode==="prepositions")return(<AnchorHall key={subKey} u={p.u} done={subDone} back={subAbort} session={p.session} onContinue={subContinue} onReplay={subReplay}/>);
  if(subMode==="gerund")return(<TwinPaths key={subKey} u={p.u} done={subDone} back={subAbort} session={p.session} onContinue={subContinue} onReplay={subReplay}/>);

  return(<div className="gauntlet-hub enter">
    <button className="back-btn" onClick={p.back}>{"\u2190"} Back</button>
    <div className="gauntlet-header">
      <div style={{marginBottom:6,filter:"drop-shadow(0 4px 14px rgba(124,58,237,.45))",display:"flex",justifyContent:"center"}}><GIcon name="gauntlet" size={52} color="var(--cyan)"/></div>
      <h2 className="gauntlet-title">GRAMMAR GAUNTLET</h2>
      <div className="gauntlet-sub">Seven trials. One crown.</div>
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
