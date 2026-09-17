// Extrait de src/App.jsx le 2026-09-15 (refactor split-app, REFACTOR_PLAN.md). Code déplacé tel quel.
import { Bar } from "../../components/Bar.jsx";
import { GIcon } from "../../components/icons.jsx";
import { SessionResult } from "../../components/SessionResult.jsx";
import { SpeakBtn } from "../../components/SpeakBtn.jsx";
import { SENTENCES } from "../../data/sentences.js";
import { shuffle } from "../../lib/util.js";
import { playCorrect, playWrong } from "../../sounds.js";
import { useState, useRef, useMemo, useEffect } from "react";

// ─── SENTENCE BUILDER — Drag & snap ───
// Drag a chunk from the bank or from the answer zone, drop in the answer
// zone at the computed insertion index (flex-wrap aware), or drop in the
// bank to remove. Tap-to-place still works (5px drag threshold).
// Class prefix .sbd- (sentence-builder-drag) to avoid global collisions.
var SBD_CSS = `
@keyframes sbd-pulse { 0%,100%{opacity:.7} 50%{opacity:1} }
.sbd-answer{min-height:84px;padding:12px;background:var(--bg2);border:2px dashed var(--bdr);border-radius:14px;display:flex;flex-wrap:wrap;gap:8px;align-content:flex-start;align-items:center;transition:border-color .18s,background .18s;position:relative}
.sbd-answer.sbd-active{border-color:var(--cyan);background:rgba(var(--cx),.04)}
.sbd-answer.sbd-ok{border-color:var(--green);background:rgba(0,230,118,.06);border-style:solid}
.sbd-answer.sbd-bad{border-color:var(--red);background:rgba(255,71,87,.06);border-style:solid}
.sbd-empty{color:var(--t3);font-size:13px;font-style:italic;width:100%;text-align:center}
.sbd-bank{min-height:48px;padding:10px;background:var(--bg2);border:1.5px solid var(--bdr);border-radius:14px;display:flex;flex-wrap:wrap;gap:8px;align-content:flex-start;justify-content:center;transition:border-color .18s,background .18s}
.sbd-bank.sbd-active{border-color:var(--cyan);background:rgba(var(--cx),.04)}
.sbd-chunk{display:inline-flex;align-items:center;padding:9px 14px;border-radius:10px;font-size:14px;font-weight:600;line-height:1.2;cursor:grab;touch-action:none;user-select:none;transition:transform .12s,opacity .15s,background .18s,border-color .18s;font-family:inherit}
.sbd-chunk.sbd-b{background:var(--bg3);border:1px solid var(--bdr);color:var(--t1)}
.sbd-chunk.sbd-p{background:rgba(var(--cx),.1);border:1px solid rgba(var(--cx),.35);color:var(--cyan)}
.sbd-chunk.sbd-p.sbd-correct{background:rgba(0,230,118,.15);border-color:var(--green);color:var(--green)}
.sbd-chunk.sbd-p.sbd-wrong{background:rgba(255,71,87,.15);border-color:var(--red);color:var(--red)}
.sbd-chunk:active{cursor:grabbing}
.sbd-indicator{display:inline-block;width:3px;align-self:stretch;min-height:30px;background:var(--cyan);border-radius:2px;box-shadow:0 0 0 3px rgba(var(--cx),.20);animation:sbd-pulse 1s ease-in-out infinite}
.sbd-ghost{position:fixed;top:0;left:0;z-index:1000;pointer-events:none;padding:9px 14px;border-radius:10px;font-size:14px;font-weight:600;line-height:1.2;background:rgba(var(--cx),.18);border:1px solid var(--cyan);color:var(--cyan);box-shadow:0 8px 24px rgba(0,0,0,.5),0 0 0 4px rgba(var(--cx),.15);white-space:nowrap}
`;
export function SentenceBuilder(p){
  var TOTAL=15;var TIMER_SEC=20;

  var[ci,sC]=useState(0);var[sc,sSc]=useState(0);var[ph,sP]=useState("intro");
  var[placed,setPlaced]=useState([]);var[remaining,setRemaining]=useState([]);
  var[timer,setTimer]=useState(TIMER_SEC);var[sk,sSk]=useState(false);
  var[dragTick,setDragTick]=useState(0);
  var timerRef=useRef(null);
  var dragRef=useRef(null); // {chunk, source:"bank"|"placed", startX, startY, x, y, insertIdx, zone:"answer"|"bank"|"outside", started, originalIdx}
  var answerRef=useRef(null);
  var bankRef=useRef(null);
  var mistakesRef=useRef([]);var sidRef=useRef(0);

  var items=useMemo(function(){return shuffle(SENTENCES.slice()).slice(0,TOTAL);},[]);

  // Init round
  useEffect(function(){
    if(ph==="q"){
      var it=items[ci];
      setPlaced([]);
      setRemaining(shuffle(it.chunks.map(function(c,i){
        var t=c;
        if(i===0)t=t.charAt(0).toLowerCase()+t.slice(1);
        if(i===it.chunks.length-1)t=t.replace(/[.?!]+$/,"");
        return{text:t,idx:i};
      })));
      setTimer(TIMER_SEC);
      timerRef.current=setInterval(function(){
        setTimer(function(t){
          if(t<=1){clearInterval(timerRef.current);sP("fb");return 0;}
          return t-1;
        });
      },1000);
    }
    return function(){clearInterval(timerRef.current);};
  },[ci,ph==="q"]);

  // Auto-check when all chunks placed
  useEffect(function(){
    if(ph!=="q")return;
    if(placed.length===items[ci].chunks.length){
      clearInterval(timerRef.current);
      var correct=true;
      for(var i=0;i<placed.length;i++){
        if(placed[i].idx!==i){correct=false;break;}
      }
      if(correct){sSc(sc+1);try{playCorrect();}catch(e){console.warn("[sbuild] sfx:",e&&e.message);}}
      else{try{playWrong();}catch(e){console.warn("[sbuild] sfx:",e&&e.message);}sSk(true);setTimeout(function(){sSk(false);},400);}
      sP("fb");
    }
  },[placed.length]);

  // Cancel any in-flight drag on phase transition (timer expiry, auto-check, back).
  useEffect(function(){
    if(ph!=="q"&&dragRef.current){
      dragRef.current=null;
      setDragTick(function(t){return t+1;});
    }
  },[ph]);

  // Erreur enregistrée au clic « Next » : phrase incomplète au temps écoulé ou ordre faux.
  function next(){
    var sit=items[ci];var ok=placed.length===sit.chunks.length&&placed.every(function(pc,k){return pc.idx===k;});
    if(!ok)mistakesRef.current.push({tag:"Sentence order"+(sit.cat?" · "+sit.cat:""),prompt:"Put the blocks in the right order",yours:placed.length?placed.map(function(pc){return pc.text;}).join(" "):"(time's up)",correct:sit.chunks.join(" ")});
    if(ci<items.length-1){sC(ci+1);sP("q");}
    else{sidRef.current=p.done(sc,TOTAL,20+sc*5);sP("done");}
  }

  // ── DRAG MECHANICS ───────────────────────────────────────────────
  function computeInsertIdx(clientX,clientY){
    if(!answerRef.current)return 0;
    var chunks=answerRef.current.querySelectorAll(".sbd-chunk");
    if(chunks.length===0)return 0;
    var bestIdx=chunks.length;
    for(var i=0;i<chunks.length;i++){
      var r=chunks[i].getBoundingClientRect();
      if(clientY<r.top-6)return i;
      if(clientY>=r.top-6&&clientY<=r.bottom+6){
        var centerX=r.left+r.width/2;
        if(clientX<centerX)return i;
        bestIdx=i+1;
      }
    }
    return bestIdx;
  }

  function startDrag(chunk,source,evt){
    if(ph!=="q")return;
    dragRef.current={
      chunk:chunk,source:source,
      startX:evt.clientX,startY:evt.clientY,
      x:evt.clientX,y:evt.clientY,
      insertIdx:null,zone:null,
      started:false,
      originalIdx:source==="placed"?placed.findIndex(function(c){return c.idx===chunk.idx;}):null
    };
    evt.preventDefault();

    function onMove(ev){
      var d=dragRef.current;if(!d)return;
      d.x=ev.clientX;d.y=ev.clientY;
      var dx=d.x-d.startX,dy=d.y-d.startY;
      if(!d.started&&Math.hypot(dx,dy)>5){
        d.started=true;
        // Remove from source array now (visual drag begins).
        if(d.source==="bank"){
          setRemaining(function(prev){return prev.filter(function(c){return c.idx!==d.chunk.idx;});});
        } else {
          setPlaced(function(prev){return prev.filter(function(c){return c.idx!==d.chunk.idx;});});
        }
      }
      if(d.started){
        // Zone detection
        var aRect=answerRef.current&&answerRef.current.getBoundingClientRect();
        var bRect=bankRef.current&&bankRef.current.getBoundingClientRect();
        if(aRect&&d.x>=aRect.left&&d.x<=aRect.right&&d.y>=aRect.top-6&&d.y<=aRect.bottom+6){
          d.zone="answer";d.insertIdx=computeInsertIdx(d.x,d.y);
        } else if(bRect&&d.x>=bRect.left&&d.x<=bRect.right&&d.y>=bRect.top-6&&d.y<=bRect.bottom+6){
          d.zone="bank";d.insertIdx=null;
        } else {
          d.zone="outside";d.insertIdx=null;
        }
        setDragTick(function(t){return t+1;});
        ev.preventDefault();
      }
    }
    function cleanup(){
      document.removeEventListener("pointermove",onMove);
      document.removeEventListener("pointerup",onUp);
      document.removeEventListener("pointercancel",onCancel);
    }
    function onUp(ev){
      var d=dragRef.current;
      if(!d){cleanup();return;}
      cleanup();
      if(!d.started){
        // Pure tap → tap-to-place from bank only.
        if(d.source==="bank"){
          setRemaining(function(prev){return prev.filter(function(c){return c.idx!==d.chunk.idx;});});
          setPlaced(function(prev){return prev.concat([d.chunk]);});
        }
        // Tap on a placed chunk = no-op (matches legacy behavior).
        dragRef.current=null;
        setDragTick(function(t){return t+1;});
        return;
      }
      // Drag commit
      if(d.zone==="answer"&&d.insertIdx!==null){
        var insertIdx=d.insertIdx;
        setPlaced(function(prev){return prev.slice(0,insertIdx).concat([d.chunk],prev.slice(insertIdx));});
      } else if(d.zone==="bank"){
        setRemaining(function(prev){return prev.concat([d.chunk]);});
      } else {
        // Outside both → restore to source
        if(d.source==="bank"){
          setRemaining(function(prev){return prev.concat([d.chunk]);});
        } else {
          var origIdx=d.originalIdx;
          setPlaced(function(prev){var i=Math.min(origIdx,prev.length);return prev.slice(0,i).concat([d.chunk],prev.slice(i));});
        }
      }
      dragRef.current=null;
      setDragTick(function(t){return t+1;});
    }
    function onCancel(){
      var d=dragRef.current;
      cleanup();
      if(d&&d.started){
        if(d.source==="bank"){
          setRemaining(function(prev){return prev.concat([d.chunk]);});
        } else {
          var origIdx=d.originalIdx;
          setPlaced(function(prev){var i=Math.min(origIdx,prev.length);return prev.slice(0,i).concat([d.chunk],prev.slice(i));});
        }
      }
      dragRef.current=null;
      setDragTick(function(t){return t+1;});
    }
    document.addEventListener("pointermove",onMove);
    document.addEventListener("pointerup",onUp);
    document.addEventListener("pointercancel",onCancel);
  }

  // ═══ INTRO ═══
  if(ph==="intro")return(<div className="enter" style={{padding:"20px 16px",minHeight:"100vh",display:"flex",flexDirection:"column",justifyContent:"center",textAlign:"center"}}>
    <div style={{marginBottom:16,display:"flex",justifyContent:"center"}}><GIcon name="brick-pile" size={60} color="var(--cyan)"/></div>
    <h1 className="out" style={{fontWeight:900,fontSize:26,marginBottom:8}}>Sentence Builder</h1>
    <p style={{color:"var(--t2)",fontSize:13,marginBottom:8,lineHeight:1.6}}>The sentence is scrambled — drag the blocks into the right order.</p>
    <p style={{color:"var(--gold)",fontWeight:600,fontSize:14,marginBottom:32}}>{TOTAL} sentences · {TIMER_SEC}s each</p>
    <button className="btn1" onClick={function(){sP("q");}}>Start</button>
    <button className="btn2" onClick={p.back} style={{marginTop:12,width:"100%"}}>Back</button>
  </div>);

  // ═══ DONE ═══
  if(ph==="done")return(<SessionResult session={p.session} sid={sidRef.current} name="Sentence Builder" mistakes={mistakesRef.current}
    onContinue={function(){p.closeSession();p.back();}} onReplay={p.replaySession}/>);

  // ═══ PLAY + FEEDBACK ═══
  var it=items[ci];
  var isCorrect=ph==="fb"&&placed.length===it.chunks.length&&placed.every(function(c,i){return c.idx===i;});
  var timerCol=timer<=5?"var(--red)":timer<=10?"var(--orange)":"var(--cyan)";
  var timerPct=timer/TIMER_SEC*100;
  var drag=dragRef.current;
  var dragOn=drag&&drag.started;

  // Answer zone classes
  var ansCls="sbd-answer";
  if(dragOn&&drag.zone==="answer")ansCls+=" sbd-active";
  if(ph==="fb")ansCls+=isCorrect?" sbd-ok":" sbd-bad";
  var bankCls="sbd-bank";
  if(dragOn&&drag.zone==="bank")bankCls+=" sbd-active";

  return(<div className={sk?"sk":""} style={{padding:"20px 16px",minHeight:"100vh"}}>
    <style>{SBD_CSS}</style>
    <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:8}}>
      <button className="back-btn" onClick={function(){clearInterval(timerRef.current);p.back();}}>{"←"} Back</button>
      <span className="out" style={{fontSize:13,color:"var(--t2)",fontWeight:600}}>{ci+1}/{TOTAL}</span>
    </div>
    {ph==="q"&&<div style={{textAlign:"left",marginBottom:8}}><span className="out" style={{fontSize:20,fontWeight:800,color:timerCol}}>{timer}s</span></div>}
    <Bar value={ci} max={TOTAL} h={4} color="linear-gradient(90deg,#3b82f6,#8b5cf6)"/>

    {ph==="q"&&<div style={{height:4,background:"var(--bg3)",borderRadius:2,marginTop:8,marginBottom:20,overflow:"hidden"}}>
      <div style={{height:"100%",width:timerPct+"%",background:timerCol,borderRadius:2,transition:"width 1s linear"}}/></div>}

    <div style={{marginTop:ph==="fb"?16:0}}>
      <span className="out" style={{fontSize:11,color:"var(--purple)",fontWeight:700,textTransform:"uppercase",letterSpacing:1,display:"block",marginBottom:8}}>{"🔀"} Build the sentence</span>
      <span style={{fontSize:11,color:"var(--t3)",display:"block",marginBottom:12}}>{it.cat}</span>
    </div>

    {/* Answer zone */}
    <div ref={answerRef} className={ansCls} style={{marginBottom:12}}>
      {placed.length===0&&!(dragOn&&drag.zone==="answer")&&<span className="sbd-empty">Drag or tap the blocks below in order...</span>}
      {placed.map(function(chunk,i){
        var showResult=ph==="fb";
        var posCorrect=chunk.idx===i;
        var cls="sbd-chunk sbd-p";
        if(showResult)cls+=posCorrect?" sbd-correct":" sbd-wrong";
        var prefixIndicator=dragOn&&drag.zone==="answer"&&drag.insertIdx===i;
        return[
          prefixIndicator?<span key={"ind-"+i} className="sbd-indicator"/>:null,
          <span key={"c-"+chunk.idx} className={cls} onPointerDown={function(e){startDrag(chunk,"placed",e);}}>{chunk.text}</span>
        ];
      })}
      {dragOn&&drag.zone==="answer"&&drag.insertIdx===placed.length&&<span className="sbd-indicator"/>}
    </div>

    {/* Bank zone */}
    {ph==="q"&&<div ref={bankRef} className={bankCls}>
      {remaining.map(function(chunk){
        return(<span key={chunk.idx} className="sbd-chunk sbd-b" onPointerDown={function(e){startDrag(chunk,"bank",e);}}>{chunk.text}</span>);
      })}
    </div>}

    {/* Ghost */}
    {dragOn&&<div className="sbd-ghost" style={{left:drag.x+"px",top:drag.y+"px",transform:"translate(-50%,-50%) scale(1.06)"}}>{drag.chunk.text}</div>}

    {/* Feedback */}
    {ph==="fb"&&<div style={{marginTop:16,animation:"fadeIn .3s"}}>
      {timer===0&&placed.length<it.chunks.length&&<div style={{textAlign:"center",marginBottom:12}}>
        <span className="out" style={{fontSize:16,fontWeight:700,color:"var(--red)"}}>{"⏰"} Time's up!</span></div>}
      <div className="crd" style={{padding:14,background:isCorrect?"rgba(0,230,118,.06)":"rgba(255,71,87,.06)",borderColor:isCorrect?"rgba(0,230,118,.15)":"rgba(255,71,87,.15)"}}>
        <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:8}}>
          <span style={{fontSize:16}}>{isCorrect?"✅":"❌"}</span>
          <span className="out" style={{fontWeight:700,fontSize:14,color:isCorrect?"var(--green)":"var(--red)"}}>{isCorrect?"Perfect!":"Correct order:"}</span>
        </div>
        <div style={{display:"flex",alignItems:"center",gap:8}}>
          <p style={{fontSize:14,color:"var(--t1)",lineHeight:1.6,fontWeight:500,flex:1}}>{it.s}</p>
          <SpeakBtn text={it.s} size={26} rate={0.85} audio={"/audio/sentences/sb_"+String(SENTENCES.indexOf(it)+1).padStart(2,"0")+".mp3"}/>
        </div>
      </div>
      <button className="btn1" onClick={next} style={{marginTop:12}}>{ci<items.length-1?"Next":"See Results"}</button>
    </div>}
  </div>);
}
