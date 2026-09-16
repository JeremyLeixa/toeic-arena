// Extrait de src/App.jsx le 2026-09-15 (refactor split-app, REFACTOR_PLAN.md). Code déplacé tel quel.
import { GrimoireReader } from "../../components/GrimoireReader.jsx";
import { GIcon, ResultIcon } from "../../components/icons.jsx";
import { GAME_ICON_PATHS } from "../../data/avatarIcons.js";
import { MODAL_MATCH_BOARDS, MODAL_SORT_ITEMS } from "../../data/modals.js";
import { GRIMOIRE_MODALS } from "../../data/modalsGrimoire.js";
import { haptic } from "../../lib/device.js";
import { shuffle } from "../../lib/util.js";
import { tone } from "../../lib/tone.js";
import { playCorrect, playWrong, playBGM, stopBGM } from "../../sounds.js";
import { useState, useRef, useEffect } from "react";

// ═══════════════════════════════════════════════════════════
// MODAL COUNCIL — global module mirroring Grammar Gauntlet
// ═══════════════════════════════════════════════════════════
// Two sub-modules (Modal Match + Modal Sort) + complete grimoire.
// Module score keys: modals_match, modals_sort.
// Tier B XP (15 + 5×correct + 35 perfect = 125 max), aligned with Gauntlet.
// Tap-to-pair / tap-to-bucket UX (mobile-first, no native HTML5 drag).


// ─── MODAL MATCH — sub-module 1/2 of Modal Council ───
// 3 boards × 5 pairs per session = 15 scored items.
// Tap a situation (left), then tap a modal (right) → pairs them with a
// numbered badge. Auto-checks when 5 pairs are placed; reveals correct
// mapping; manual "Next board" cycles to the next of 3.
// ─── DRAW-THE-LINE styles (injected once for ModalMatch) ───
// Anchors, SVG paths, gutter decor, animations. Class prefix .dtl- (draw-the-line)
// to avoid collisions with the rest of App.jsx.
var DTL_CSS = `
@keyframes dtl-drawon { from{stroke-dashoffset:var(--len)} to{stroke-dashoffset:0} }
@keyframes dtl-shake { 0%,100%{transform:translateX(0)} 25%{transform:translateX(-3px)} 75%{transform:translateX(3px)} }
.dtl-board{position:relative}
.dtl-board::before{content:"";position:absolute;top:8px;bottom:8px;left:50%;width:0;border-left:1.5px dashed var(--bdr);transform:translateX(-1px);z-index:1;opacity:.7;pointer-events:none}
.dtl-board::after{content:"";position:absolute;top:0;bottom:0;left:calc(50% - 40px);width:80px;background:linear-gradient(90deg,transparent,rgba(var(--cx),.025) 20%,rgba(var(--cx),.04) 50%,rgba(var(--cx),.025) 80%,transparent);z-index:0;pointer-events:none;border-radius:4px}
@media (max-width:480px){.dtl-board::after{left:calc(50% - 32px);width:64px}}
.dtl-anchor{position:absolute;top:50%;transform:translateY(-50%);width:22px;height:22px;border-radius:50%;background:var(--bg3);border:2px solid var(--bdr);cursor:grab;touch-action:none;display:flex;align-items:center;justify-content:center;transition:background .15s,border-color .15s,transform .15s,box-shadow .15s;z-index:3}
.dtl-anchor::after{content:"";width:6px;height:6px;border-radius:50%;background:var(--t3);transition:background .15s,transform .15s}
.dtl-card-s .dtl-anchor{right:-11px}
.dtl-card-m .dtl-anchor{left:-11px}
.dtl-anchor.busy{border-color:var(--cyan);background:rgba(var(--cx),.18)}
.dtl-anchor.busy::after{background:var(--cyan);transform:scale(1.4)}
.dtl-anchor.dragging{cursor:grabbing;transform:translateY(-50%) scale(1.25);box-shadow:0 0 0 4px rgba(var(--cx),.20);border-color:var(--cyan)}
.dtl-anchor.snap{transform:translateY(-50%) scale(1.35);box-shadow:0 0 0 6px rgba(var(--cx),.28);border-color:var(--cyan)}
.dtl-anchor.ok{border-color:#22c55e;background:rgba(34,197,94,.18)}
.dtl-anchor.ok::after{background:#22c55e}
.dtl-anchor.bad{border-color:#ef4444;background:rgba(239,68,68,.18)}
.dtl-anchor.bad::after{background:#ef4444}
.dtl-lines{position:absolute;inset:0;width:100%;height:100%;pointer-events:none;z-index:4;overflow:visible}
.dtl-lines path.dtl-stroke{fill:none;stroke-width:3;stroke-linecap:round;pointer-events:none;transition:opacity .2s}
.dtl-lines path.dtl-hit{fill:none;stroke-width:16;stroke:transparent;cursor:pointer;pointer-events:stroke}
.dtl-lines path.dtl-draft{stroke-dasharray:6 5;opacity:.7}
.dtl-lines path.dtl-justlocked{stroke-dasharray:var(--len);stroke-dashoffset:var(--len);animation:dtl-drawon .28s ease-out forwards}
.dtl-lines path.dtl-bad{animation:dtl-shake .25s ease-in-out 2}
`;
export function ModalMatch(p){
  var BOARDS_PER_SESSION=3;
  var PAIRS_PER_BOARD=5;
  var LINE_COLORS=["#22d3ee","#a78bfa","#f59e0b","#ec4899","#84cc16"];
  var [phase,setPhase]=useState("intro"); // intro | play | reveal | end
  var [boards,setBoards]=useState(null);
  var [boardIdx,setBoardIdx]=useState(0);
  var [pairs,setPairs]=useState([]); // [{sIdx,mIdx,color,justLocked?}]
  var [allResults,setAllResults]=useState([]); // [{boardId, correct, total}]
  var [tick,setTick]=useState(0); // bump on draftRef mutations + resize
  var draftRef=useRef(null); // {sIdx, x, y, color, hit}
  var boardRef=useRef(null);
  var activeAnchorRef=useRef(null);

  function startSession(){
    var picked=shuffle(MODAL_MATCH_BOARDS.slice()).slice(0,BOARDS_PER_SESSION);
    var prepared=picked.map(function(b){
      var modalsShuf=shuffle(b.pairs.map(function(pp,i){return{text:pp.modal,originalIdx:i};}));
      return{id:b.id,theme:b.theme,situations:b.pairs.map(function(pp){return pp.situation;}),modals:modalsShuf};
    });
    setBoards(prepared);setBoardIdx(0);setPairs([]);setAllResults([]);setPhase("play");
  }

  function nextBoard(){
    if(boardIdx>=BOARDS_PER_SESSION-1){setPhase("end");return;}
    setBoardIdx(boardIdx+1);setPairs([]);setPhase("play");
  }

  function finishSession(){
    var totalCorrect=allResults.reduce(function(s,r){return s+r.correct;},0);
    var totalQ=BOARDS_PER_SESSION*PAIRS_PER_BOARD;
    var baseXp=15+totalCorrect*5;
    if(totalCorrect===totalQ)baseXp+=35;
    p.done(totalCorrect,totalQ,baseXp);
  }

  function commitLock(){
    if(pairs.length!==PAIRS_PER_BOARD)return;
    var board=boards[boardIdx];var correct=0;
    pairs.forEach(function(pp){if(board.modals[pp.mIdx].originalIdx===pp.sIdx)correct++;});
    if(correct===PAIRS_PER_BOARD){try{playCorrect();}catch(e){console.warn("[mmatch] sfx:",e&&e.message);}}
    else{try{playWrong();}catch(e){console.warn("[mmatch] sfx:",e&&e.message);}}
    setAllResults(allResults.concat([{boardId:board.id,correct:correct,total:PAIRS_PER_BOARD}]));
    setPhase("reveal");
  }

  // Anchor center in board-local coordinates (queried fresh each call — handles resize/scroll).
  function anchorCenter(side,idx){
    if(!boardRef.current)return null;
    var el=boardRef.current.querySelector('.dtl-anchor[data-side="'+side+'"][data-idx="'+idx+'"]');
    if(!el)return null;
    var r=el.getBoundingClientRect();
    var br=boardRef.current.getBoundingClientRect();
    return{x:r.left-br.left+r.width/2,y:r.top-br.top+r.height/2};
  }

  function pathD(p1,p2){
    var dx=p2.x-p1.x,dy=p2.y-p1.y;
    var sag=Math.min(28,Math.abs(dy)*0.15);
    var c1x=p1.x+dx*0.45,c1y=p1.y+dy*0.05+(dy>=0?-sag:sag);
    var c2x=p1.x+dx*0.55,c2y=p2.y-dy*0.05+(dy>=0?-sag:sag);
    return"M "+p1.x.toFixed(1)+" "+p1.y.toFixed(1)+" C "+c1x.toFixed(1)+" "+c1y.toFixed(1)+", "+c2x.toFixed(1)+" "+c2y.toFixed(1)+", "+p2.x.toFixed(1)+" "+p2.y.toFixed(1);
  }

  function hitTestModal(clientX,clientY){
    if(!boardRef.current)return null;
    var slop=24;
    var anchors=boardRef.current.querySelectorAll('.dtl-anchor[data-side="m"]');
    var best=null,bestDist=Infinity;
    anchors.forEach(function(a){
      var r=a.getBoundingClientRect();
      var cx=r.left+r.width/2,cy=r.top+r.height/2;
      var dist=Math.hypot(clientX-cx,clientY-cy);
      var inRect=clientX>=r.left-slop&&clientX<=r.right+slop&&clientY>=r.top-slop&&clientY<=r.bottom+slop;
      if(inRect&&dist<bestDist){bestDist=dist;best=parseInt(a.dataset.idx,10);}
    });
    return best;
  }

  function startDrag(sIdx,e){
    if(phase!=="play")return;
    // Release any existing pair on this situation (re-draw scenario).
    var existing=pairs.findIndex(function(pp){return pp.sIdx===sIdx;});
    var basePairs=pairs;
    if(existing>=0){
      basePairs=pairs.slice();basePairs.splice(existing,1);
      setPairs(basePairs);
    }
    var c=anchorCenter("s",sIdx);
    if(!c)return;
    var anchor=e.currentTarget;
    activeAnchorRef.current=anchor;
    anchor.classList.add("dragging");
    draftRef.current={sIdx:sIdx,x:c.x,y:c.y,color:LINE_COLORS[basePairs.length%LINE_COLORS.length],hit:null};
    setTick(function(t){return t+1;});

    function onMove(ev){
      if(!draftRef.current)return;
      var br=boardRef.current&&boardRef.current.getBoundingClientRect();
      if(!br)return;
      var x=ev.clientX-br.left,y=ev.clientY-br.top;
      var hit=hitTestModal(ev.clientX,ev.clientY);
      if(hit!==null){
        var ac=anchorCenter("m",hit);
        if(ac){x=ac.x;y=ac.y;}
      }
      draftRef.current.x=x;draftRef.current.y=y;draftRef.current.hit=hit;
      setTick(function(t){return t+1;});
      ev.preventDefault();
    }
    function cleanup(){
      document.removeEventListener("pointermove",onMove);
      document.removeEventListener("pointerup",onUp);
      document.removeEventListener("pointercancel",onCancel);
      if(activeAnchorRef.current){activeAnchorRef.current.classList.remove("dragging");activeAnchorRef.current=null;}
    }
    function onUp(ev){
      var hit=hitTestModal(ev.clientX,ev.clientY);
      var dr=draftRef.current;
      draftRef.current=null;
      cleanup();
      setTick(function(t){return t+1;});
      if(hit===null||!dr)return;
      // Commit pair, evicting any conflicting one on either side.
      setPairs(function(prev){
        var filtered=prev.filter(function(pp){return pp.mIdx!==hit&&pp.sIdx!==dr.sIdx;});
        return filtered.concat([{sIdx:dr.sIdx,mIdx:hit,color:LINE_COLORS[filtered.length%LINE_COLORS.length],justLocked:true}]);
      });
      setTimeout(function(){
        setPairs(function(prev){return prev.map(function(pp){return pp.justLocked?Object.assign({},pp,{justLocked:false}):pp;});});
      },360);
    }
    function onCancel(){
      draftRef.current=null;
      cleanup();
      setTick(function(t){return t+1;});
    }
    document.addEventListener("pointermove",onMove);
    document.addEventListener("pointerup",onUp);
    document.addEventListener("pointercancel",onCancel);
    e.preventDefault();
  }

  function removePair(i){
    if(phase!=="play")return;
    var np=pairs.slice();np.splice(i,1);setPairs(np);
  }

  // Re-render lines on viewport resize (anchor positions shift).
  useEffect(function(){
    function onResize(){setTick(function(t){return t+1;});}
    window.addEventListener("resize",onResize);
    return function(){window.removeEventListener("resize",onResize);};
  },[]);

  // ── INTRO ──────────────────────────────────────────────────────────
  if(phase==="intro"){
    return(<div className="enter" style={{padding:"20px 16px 100px",maxWidth:480,margin:"0 auto"}}>
      <button className="back-btn" onClick={p.back}>{"←"} Back</button>
      <div style={{textAlign:"center",padding:"24px 16px"}}>
        <div style={{marginBottom:14,display:"flex",justifyContent:"center"}}><GIcon name="spell-book" size={64} color="var(--cyan)"/></div>
        <h2 className="out" style={{fontSize:24,fontWeight:800,marginBottom:8}}>The Oracle</h2>
        <p style={{color:"var(--t3)",fontSize:14,marginBottom:20,lineHeight:1.5}}>Pair each situation with the right modal response. Three boards of five pairs each.</p>
        <div className="crd" style={{maxWidth:340,margin:"0 auto 22px",padding:16,textAlign:"left",fontSize:13.5,color:"var(--t2)",lineHeight:1.7}}>
          <div>{"✋"} <strong>Drag</strong> from a situation anchor to a response anchor</div>
          <div>{"↩️"} <strong>Tap</strong> a line to delete it</div>
          <div>{"🔢"} <strong>3 boards</strong> of 5 pairs · 15 items total</div>
          <div>{"🏆"} <strong>5 XP</strong> per correct pair · perfect bonus</div>
        </div>
        <button className="btn1" style={{fontSize:16,padding:"14px 32px",fontWeight:800}} onClick={startSession}>{"⚖️ Consult the Oracle"}</button>
      </div>
    </div>);
  }

  // ── END ────────────────────────────────────────────────────────────
  if(phase==="end"){
    var totalCorrect=allResults.reduce(function(s,r){return s+r.correct;},0);
    var totalQ=BOARDS_PER_SESSION*PAIRS_PER_BOARD;
    var isPerfect=totalCorrect===totalQ;
    var isGood=totalCorrect>=Math.ceil(totalQ*0.7);
    return(<div className="enter" style={{padding:"20px 16px 100px",maxWidth:480,margin:"0 auto"}}>
      <div style={{textAlign:"center",padding:"20px 16px"}}>
        <div style={{marginBottom:14,display:"flex",justifyContent:"center"}}><ResultIcon e={isPerfect?"👑":isGood?"🏆":"📜"} size={58}/></div>
        <h2 className="out" style={{fontSize:22,fontWeight:800,marginBottom:6}}>{isPerfect?"PERFECT ORACLE":isGood?"Oracle answers":"Audience adjourned"}</h2>
        <div style={{fontSize:44,fontWeight:800,color:"var(--cyan)",margin:"14px 0 2px"}}>{totalCorrect}<span style={{color:"var(--t3)",fontSize:24,fontWeight:600}}> / {totalQ}</span></div>
        <p style={{color:"var(--t3)",fontSize:13,marginBottom:18}}>pairs correctly matched</p>
        <div className="crd" style={{maxWidth:340,margin:"8px auto 20px",padding:14,textAlign:"left"}}>
          <div style={{fontSize:11,color:"var(--t3)",marginBottom:8,fontWeight:700,letterSpacing:1,textTransform:"uppercase"}}>Boards</div>
          {allResults.map(function(r,i){return(
            <div key={i} style={{display:"flex",justifyContent:"space-between",fontSize:13,marginBottom:4,color:"var(--t2)"}}>
              <span>Board {i+1}</span>
              <strong style={{color:r.correct===r.total?tone("#22c55e"):r.correct>=3?tone("#f59e0b"):tone("#ef4444")}}>{r.correct} / {r.total}</strong>
            </div>
          );})}
        </div>
        <button className="btn1" style={{fontSize:16,padding:"14px 32px",fontWeight:800}} onClick={finishSession}>OK, back</button>
      </div>
    </div>);
  }

  // ── PLAY / REVEAL ─────────────────────────────────────────────────
  var board=boards[boardIdx];
  var draft=draftRef.current;
  function isCorrectPair(pp){return board.modals[pp.mIdx].originalIdx===pp.sIdx;}
  function findPairForSit(i){return pairs.find(function(pp){return pp.sIdx===i;});}
  function findPairForModal(i){return pairs.find(function(pp){return pp.mIdx===i;});}

  return(<div className="enter" style={{padding:"12px 12px 14px",maxWidth:720,margin:"0 auto",display:"flex",flexDirection:"column",minHeight:"calc(100dvh - 50px)"}}>
    <style>{DTL_CSS}</style>
    <button className="back-btn" onClick={p.back} style={{flexShrink:0}}>{"←"} Back</button>
    <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",margin:"4px 0",flexShrink:0}}>
      <span style={{fontSize:11,color:"var(--t3)",fontWeight:700,letterSpacing:1.2,textTransform:"uppercase"}}>Board {boardIdx+1} / {BOARDS_PER_SESSION}</span>
      <span style={{fontSize:11,color:"var(--cyan)",fontWeight:700,letterSpacing:.8}}>{pairs.length} / {PAIRS_PER_BOARD} paired</span>
    </div>
    <div style={{textAlign:"center",fontSize:13,color:"var(--t2)",fontStyle:"italic",margin:"2px 0 8px",flexShrink:0}}>{board.theme}</div>

    <div style={{display:"grid",gridTemplateColumns:"1fr 80px 1fr",marginBottom:2,flexShrink:0}}>
      <div style={{fontSize:10,color:"var(--t3)",fontWeight:800,letterSpacing:1.2,textTransform:"uppercase",paddingLeft:2}}>Situation</div>
      <div></div>
      <div style={{fontSize:10,color:"var(--t3)",fontWeight:800,letterSpacing:1.2,textTransform:"uppercase",paddingRight:2,textAlign:"right"}}>Response</div>
    </div>

    <div ref={boardRef} className="dtl-board" style={{display:"grid",gridTemplateColumns:"1fr 80px 1fr",gridTemplateRows:"repeat(5,1fr)",rowGap:10,columnGap:0,alignItems:"stretch",touchAction:"pan-y",flex:"1 1 auto",minHeight:0}}>
      {board.situations.map(function(sit,i){
        var pair=findPairForSit(i);
        var pairOk=phase==="reveal"&&pair?isCorrectPair(pair):null;
        var bdr="var(--bdr)";var bg="var(--bg2)";
        if(phase==="reveal"){
          if(pairOk===true){bdr="#22c55e";bg="rgba(34,197,94,.10)";}
          else if(pairOk===false){bdr="#ef4444";bg="rgba(239,68,68,.10)";}
        } else if(pair){bdr="var(--cyan)";bg="rgba(var(--cx),.06)";}
        var anchorCls="dtl-anchor";
        if(phase==="reveal"&&pair){anchorCls+=pairOk?" ok":" bad";}
        else if(pair){anchorCls+=" busy";}
        return(<div key={i} className="dtl-card-s" style={{gridColumn:1,gridRow:i+1,position:"relative",background:bg,border:"1.5px solid "+bdr,borderRadius:11,padding:"11px 18px 11px 13px",fontSize:13,lineHeight:1.4,color:"var(--t1)",minHeight:60,display:"flex",alignItems:"center",transition:"border-color .18s,background .18s,opacity .25s",zIndex:2,opacity:phase==="reveal"&&!pair?.5:1}}>
          <span style={{flex:1}}>{sit}</span>
          <div className={anchorCls} data-side="s" data-idx={i} onPointerDown={function(e){startDrag(i,e);}}></div>
        </div>);
      })}
      {board.modals.map(function(m,i){
        var pair=findPairForModal(i);
        var pairOk=phase==="reveal"&&pair?isCorrectPair(pair):null;
        var bdr="var(--bdr)";var bg="var(--bg2)";
        if(phase==="reveal"){
          if(pairOk===true){bdr="#22c55e";bg="rgba(34,197,94,.10)";}
          else if(pairOk===false){bdr="#ef4444";bg="rgba(239,68,68,.10)";}
        } else if(pair){bdr="var(--cyan)";bg="rgba(var(--cx),.06)";}
        var isSnap=draft&&draft.hit===i;
        var anchorCls="dtl-anchor";
        if(phase==="reveal"&&pair){anchorCls+=pairOk?" ok":" bad";}
        else if(pair){anchorCls+=" busy";}
        if(isSnap)anchorCls+=" snap";
        return(<div key={i} className="dtl-card-m" style={{gridColumn:3,gridRow:i+1,position:"relative",background:bg,border:"1.5px solid "+bdr,borderRadius:11,padding:"11px 13px 11px 18px",fontSize:13,lineHeight:1.4,color:"var(--t1)",minHeight:60,display:"flex",alignItems:"center",transition:"border-color .18s,background .18s,opacity .25s",zIndex:2,opacity:phase==="reveal"&&!pair?.5:1}}>
          <div className={anchorCls} data-side="m" data-idx={i}></div>
          <span style={{flex:1}}>{m.text}</span>
        </div>);
      })}
      <svg className="dtl-lines" xmlns="http://www.w3.org/2000/svg">
        {pairs.map(function(pp,i){
          var a=anchorCenter("s",pp.sIdx);
          var b=anchorCenter("m",pp.mIdx);
          if(!a||!b)return null;
          var color=pp.color;var strokeCls="dtl-stroke";
          if(phase==="reveal"){
            var ok=isCorrectPair(pp);
            color=ok?"#22c55e":"#ef4444";
            if(!ok)strokeCls+=" dtl-bad";
          } else if(pp.justLocked) strokeCls+=" dtl-justlocked";
          var len=Math.hypot(b.x-a.x,b.y-a.y)*1.15;
          var d=pathD(a,b);
          var mx=(a.x+b.x)/2,my=(a.y+b.y)/2;
          return(<g key={i}>
            <path d={d} className="dtl-hit" onClick={function(){removePair(i);}} style={{pointerEvents:phase==="play"?"stroke":"none"}}/>
            <path d={d} className={strokeCls} stroke={color} style={{"--len":len.toFixed(0)}}/>
            {phase==="reveal"&&(<g pointerEvents="none">
              <circle cx={mx} cy={my} r="10" fill={color}/>
              <text x={mx} y={my} textAnchor="middle" dominantBaseline="central" fontSize="13" fontWeight="800" fill="#0f0c08">{isCorrectPair(pp)?"✓":"✗"}</text>
            </g>)}
          </g>);
        })}
        {draft&&(function(){
          var a=anchorCenter("s",draft.sIdx);
          if(!a)return null;
          return(<path d={pathD(a,{x:draft.x,y:draft.y})} className="dtl-stroke dtl-draft" stroke={draft.color}/>);
        })()}
      </svg>
    </div>

    <div style={{marginTop:10,flexShrink:0}}>
      {phase==="play"&&(
        <button className="btn1" disabled={pairs.length<PAIRS_PER_BOARD} style={{width:"100%",background:"linear-gradient(135deg,#0891b2,#7c3aed)",fontSize:15,padding:"13px",fontWeight:800,opacity:pairs.length===PAIRS_PER_BOARD?1:.5,cursor:pairs.length===PAIRS_PER_BOARD?"pointer":"not-allowed"}} onClick={commitLock}>
          {pairs.length===PAIRS_PER_BOARD?"Lock answers":"Lock answers ("+pairs.length+"/"+PAIRS_PER_BOARD+")"}
        </button>
      )}
      {phase==="reveal"&&(
        <button className="btn1" style={{width:"100%",background:"linear-gradient(135deg,#0891b2,#7c3aed)",fontSize:15,padding:"13px",fontWeight:800}} onClick={nextBoard}>{boardIdx>=BOARDS_PER_SESSION-1?"See result":"Next board →"}</button>
      )}
    </div>
  </div>);
}
// ─── MODAL SORT — sub-module 2/2 of Modal Council ───
// 15 phrases drawn from MODAL_SORT_ITEMS. For each, the student taps one
// of 4 buckets (Obligation / Advice / Possibility / Deduction). Reveal
// shows the correct bucket + a short FR explanation. Manual nextQ.
export function ModalSort(p){
  var SESSION_SIZE=15;
  var BUCKETS=[
    {id:"obligation",label:"Obligation",icon:"templar-shield",color:"#dc2626"},
    {id:"advice",label:"Advice",icon:"quill-ink",color:"#0891b2"},
    {id:"possibility",label:"Possibility",icon:"ink-swirl",color:"#7c3aed"},
    {id:"deduction",label:"Deduction",icon:"spyglass",color:"#f59e0b"}
  ];
  var [deck,setDeck]=useState(null);
  var [phase,setPhase]=useState("intro");
  var [idx,setIdx]=useState(0);
  var [picked,setPicked]=useState(null);
  var [results,setResults]=useState([]);

  function startSession(){
    var shuffled=shuffle(MODAL_SORT_ITEMS.slice()).slice(0,SESSION_SIZE);
    setDeck(shuffled);setIdx(0);setResults([]);setPicked(null);setPhase("play");
  }

  function pickBucket(bid){
    if(phase!=="play"||!deck)return;
    var item=deck[idx];var ok=bid===item.bucket;
    if(ok){try{playCorrect();}catch(e){console.warn("[msort] sfx:",e&&e.message);}}
    else{try{playWrong();}catch(e){console.warn("[msort] sfx:",e&&e.message);}}
    setPicked(bid);
    setResults(results.concat([{item:item,picked:bid,ok:ok}]));
    setPhase("reveal");
  }

  function nextQ(){
    if(!deck)return;
    if(idx>=deck.length-1){setPhase("end");}
    else{setIdx(idx+1);setPicked(null);setPhase("play");}
  }

  function finishSession(){
    var correct=results.filter(function(r){return r.ok;}).length;
    var baseXp=15+correct*5;
    if(correct===deck.length)baseXp+=35;
    p.done(correct,deck.length,baseXp);
  }

  if(phase==="intro"){
    return(<div className="enter" style={{padding:"20px 16px 100px",maxWidth:520,margin:"0 auto"}}>
      <button className="back-btn" onClick={p.back}>{"←"} Back</button>
      <div style={{textAlign:"center",padding:"24px 16px"}}>
        <div style={{marginBottom:14,display:"flex",justifyContent:"center"}}><GIcon name="stone-tablet" size={64} color="var(--cyan)"/></div>
        <h2 className="out" style={{fontSize:24,fontWeight:800,marginBottom:8}}>The Verdict</h2>
        <p style={{color:"var(--t3)",fontSize:14,marginBottom:20,lineHeight:1.5}}>Classify each modal sentence into one of four functions. Speed matters — but accuracy more.</p>
        <div className="crd" style={{maxWidth:380,margin:"0 auto 16px",padding:14,textAlign:"left",fontSize:13,color:"var(--t2)",lineHeight:1.7}}>
          <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:4}}><GIcon name="templar-shield" size={18} color="#dc2626"/><strong style={{color:"#dc2626"}}>Obligation</strong> · must, have to, need to</div>
          <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:4}}><GIcon name="quill-ink" size={18} color={tone("#0891b2")}/><strong style={{color:tone("#0891b2")}}>Advice</strong> · should, ought to, had better</div>
          <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:4}}><GIcon name="ink-swirl" size={18} color="#7c3aed"/><strong style={{color:"#7c3aed"}}>Possibility</strong> · can, could, may, might</div>
          <div style={{display:"flex",alignItems:"center",gap:8}}><GIcon name="spyglass" size={18} color={tone("#f59e0b")}/><strong style={{color:tone("#f59e0b")}}>Deduction</strong> · must be, can't be, must have V3</div>
        </div>
        <div className="crd" style={{maxWidth:340,margin:"0 auto 22px",padding:14,textAlign:"left",fontSize:13,color:"var(--t2)",lineHeight:1.7}}>
          <div>{"📜"} <strong>15 sentences</strong> per session</div>
          <div>{"🏆"} <strong>5 XP</strong> per correct verdict · perfect bonus</div>
        </div>
        <button className="btn1" style={{fontSize:16,padding:"14px 32px",fontWeight:800}} onClick={startSession}>{"⚖️ Take the bench"}</button>
      </div>
    </div>);
  }

  if(phase==="end"){
    var correct=results.filter(function(r){return r.ok;}).length;
    var isPerfect=correct===deck.length;
    var isGood=correct>=Math.ceil(deck.length*0.7);
    var missed=results.filter(function(r){return!r.ok;});
    return(<div className="enter" style={{padding:"20px 16px 100px",maxWidth:480,margin:"0 auto"}}>
      <div style={{textAlign:"center",padding:"20px 16px"}}>
        <div style={{marginBottom:14,display:"flex",justifyContent:"center"}}><ResultIcon e={isPerfect?"👑":isGood?"🏆":"⚖️"} size={58}/></div>
        <h2 className="out" style={{fontSize:22,fontWeight:800,marginBottom:6}}>{isPerfect?"FLAWLESS VERDICT":isGood?"Verdict delivered":"Bench adjourned"}</h2>
        <div style={{fontSize:44,fontWeight:800,color:"var(--cyan)",margin:"14px 0 2px"}}>{correct}<span style={{color:"var(--t3)",fontSize:24,fontWeight:600}}> / {deck.length}</span></div>
        <p style={{color:"var(--t3)",fontSize:13,marginBottom:18}}>verdicts upheld</p>
        {missed.length>0&&<div className="crd" style={{maxWidth:380,margin:"8px auto 20px",padding:14,textAlign:"left"}}>
          <div style={{fontSize:11,color:"var(--t3)",marginBottom:10,fontWeight:700,letterSpacing:1,textTransform:"uppercase"}}>To review</div>
          {missed.slice(0,8).map(function(r,i){
            var correctBucket=BUCKETS.find(function(b){return b.id===r.item.bucket;});
            return(<div key={i} style={{fontSize:12.5,marginBottom:8,color:"var(--t2)",lineHeight:1.5}}>
              <div style={{color:"var(--t1)"}}>{r.item.s}</div>
              <div style={{fontSize:11,color:tone(correctBucket.color),marginTop:2}}>{"→ "}{correctBucket.label}</div>
            </div>);
          })}
        </div>}
        <button className="btn1" style={{fontSize:16,padding:"14px 32px",fontWeight:800}} onClick={finishSession}>OK, back</button>
      </div>
    </div>);
  }

  // phase === "play" or "reveal"
  var item=deck[idx];
  var correctBucket=BUCKETS.find(function(b){return b.id===item.bucket;});
  return(<div className="enter" style={{padding:"16px 16px 100px",maxWidth:520,margin:"0 auto"}}>
    <button className="back-btn" onClick={p.back}>{"←"} Back</button>
    <div style={{fontSize:12,color:"var(--t3)",textAlign:"center",marginBottom:6}}>Sentence {idx+1} / {deck.length}</div>
    <div style={{width:"100%",height:4,background:"var(--bg3)",borderRadius:99,overflow:"hidden",marginBottom:18}}>
      <div style={{width:((idx+(phase==="reveal"?1:0))/deck.length*100)+"%",height:"100%",background:"linear-gradient(90deg,#f59e0b,#dc2626)",transition:"width .4s ease"}}/>
    </div>

    <div className="crd" style={{padding:"22px 18px",marginBottom:18,fontSize:17,fontWeight:600,color:"var(--t1)",lineHeight:1.5,textAlign:"center"}}>
      "{item.s}"
    </div>

    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:14}}>
      {BUCKETS.map(function(b){
        var isPicked=picked===b.id;var isCorrect=b.id===item.bucket;
        var bdr=b.color;var bg="rgba(var(--bg2-rgb),1)";var col=b.color;
        if(phase==="reveal"){
          if(isCorrect){bg="rgba(34,197,94,.12)";bdr="#22c55e";col="#22c55e";}
          else if(isPicked){bg="rgba(239,68,68,.12)";bdr="#ef4444";col="#ef4444";}
          else{bg="var(--bg2)";bdr="var(--bdr)";col="var(--t3)";}
        }
        return(<button key={b.id} disabled={phase==="reveal"} onClick={function(){pickBucket(b.id);}} style={{padding:"14px 10px",background:bg,border:"2px solid "+bdr,borderRadius:14,cursor:phase==="play"?"pointer":"default",display:"flex",flexDirection:"column",alignItems:"center",gap:6,fontFamily:"'DM Sans',sans-serif",color:col,opacity:phase==="reveal"&&!isCorrect&&!isPicked?.5:1,transition:"all .2s"}}>
          <GIcon name={b.icon} size={26} color={col}/>
          <span style={{fontSize:13,fontWeight:800,letterSpacing:.3}}>{b.label}</span>
        </button>);
      })}
    </div>

    {phase==="reveal"&&(<div className="crd enter" style={{padding:14,marginBottom:12,borderLeft:"3px solid "+correctBucket.color}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:6,gap:8,flexWrap:"wrap"}}>
        <span style={{fontSize:11,color:"var(--t3)",fontWeight:700,letterSpacing:.8,textTransform:"uppercase"}}>{results[results.length-1].ok?"✓ Correct verdict":"Explanation"}</span>
        <span style={{fontSize:10,color:tone(correctBucket.color),padding:"2px 8px",background:"rgba(0,0,0,.18)",border:"1px solid "+correctBucket.color,borderRadius:99,fontWeight:700,letterSpacing:.3}}>{correctBucket.label}</span>
      </div>
      <div style={{fontSize:12.5,color:"var(--t3)",fontStyle:"italic",marginBottom:6}}>Modal: <strong style={{color:"var(--t1)",fontStyle:"normal"}}>{item.modal}</strong></div>
      <div style={{fontSize:13.5,color:"var(--t2)",lineHeight:1.6}}>{item.x}</div>
    </div>)}

    {phase==="reveal"&&(
      <button className="btn1" style={{width:"100%",background:"linear-gradient(135deg,#f59e0b,#dc2626)",fontSize:14,padding:"12px",fontWeight:800}} onClick={nextQ}>{idx>=deck.length-1?"See result":"Next sentence →"}</button>
    )}
  </div>);
}
// ─── MODAL COUNCIL HUB — entry point for the 2 sub-modules ───
// Mirror of GauntletHub. Internal state `subMode` switches between hub
// and sub-module. Single grimoire (GRIMOIRE_MODALS) accessible from both
// cards (no per-card grimoire — there's only one for the whole module).
// Module score keys: modals_match, modals_sort.
export function ModalCouncilHub(p){
  var [openGrim,setOpenGrim]=useState(null);
  var [subMode,setSubMode]=useState(null); // null | "match" | "sort"
  var scores=(p.u&&p.u.moduleScores)||{};
  var cards=[
    {id:"match",name:"The Oracle",icon:"spell-book",desc:"Pair situations with the right modal response. 3 boards × 5 pairs per session.",accent:"linear-gradient(90deg,#0891b2,#7c3aed)",bgm:"bgm_oracle",stats:scores["modals_match"],ready:true},
    {id:"sort",name:"The Verdict",icon:"stone-tablet",desc:"Classify modal sentences into 4 functions: Obligation, Advice, Possibility, Deduction.",accent:"linear-gradient(90deg,#f59e0b,#dc2626)",bgm:"bgm_verdict",stats:scores["modals_sort"],ready:true}
  ];
  function fmtAcc(s){if(!s||!s.total)return"—";return Math.round((s.correct/s.total)*100)+"%";}
  function enterSub(card){
    if(!card.ready){alert("Sub-module under development.");return;}
    try{playBGM(card.bgm);}catch(e){console.warn("[council] bgm:",e&&e.message);}
    setSubMode(card.id);
  }
  function subDone(sc,tot,xp){
    try{stopBGM();}catch(e){console.warn("[council] bgm stop:",e&&e.message);}
    try{haptic("complete");}catch(e){console.warn("[council] haptic:",e&&e.message);}
    if(p.onModuleDone)p.onModuleDone(subMode,sc,tot,xp);
    setSubMode(null);
  }
  function subAbort(){
    try{stopBGM();}catch(e){console.warn("[council] bgm stop:",e&&e.message);}
    setSubMode(null);
  }
  if(subMode==="match")return(<ModalMatch u={p.u} done={subDone} back={subAbort}/>);
  if(subMode==="sort")return(<ModalSort u={p.u} done={subDone} back={subAbort}/>);

  return(<div className="gauntlet-hub enter">
    <button className="back-btn" onClick={p.back}>{"←"} Back</button>
    <div className="gauntlet-header">
      <div style={{marginBottom:6,filter:"drop-shadow(0 4px 14px rgba(8,145,178,.45))",display:"flex",justifyContent:"center"}}><GIcon name="throne-king" size={52} color="var(--cyan)"/></div>
      <h2 className="gauntlet-title">MODAL COUNCIL</h2>
      <div className="gauntlet-sub">Two trials. One verdict.</div>
    </div>
    <div style={{display:"flex",justifyContent:"center",marginBottom:18}}>
      <button className="gauntlet-btn-grim" style={{padding:"10px 18px"}} onClick={function(){setOpenGrim(GRIMOIRE_MODALS);}}><GIcon name="bookmarklet" size={16} color="currentColor" style={{marginRight:6}}/>Open the Grimoire</button>
    </div>
    {cards.map(function(c){return(
      <div key={c.id} className="gauntlet-card">
        <div className="gauntlet-card-accent" style={{background:c.accent}}/>
        <div className="gauntlet-card-head">
          <div className="gauntlet-card-icon">{GAME_ICON_PATHS[c.icon]?<GIcon name={c.icon} size={32} color="currentColor"/>:c.icon}</div>
          <div style={{flex:1,minWidth:0}}>
            <div className="gauntlet-card-name">{c.name}</div>
          </div>
        </div>
        <div className="gauntlet-card-desc">{c.desc}</div>
        <div className="gauntlet-card-stats">
          <span>{(c.stats&&c.stats.sessions)||0} session{c.stats&&c.stats.sessions>1?"s":""}</span>
          <span>{"·"}</span>
          <span>Accuracy: {fmtAcc(c.stats)}</span>
        </div>
        <div className="gauntlet-card-actions">
          <button className="gauntlet-btn-enter" onClick={function(){enterSub(c);}}><GIcon name="dungeon-gate" size={16} color="currentColor" style={{marginRight:6}}/>Entrer</button>
        </div>
      </div>
    );})}
    {openGrim&&<GrimoireReader grimoire={openGrim} back={function(){setOpenGrim(null);}}/>}
  </div>);
}
