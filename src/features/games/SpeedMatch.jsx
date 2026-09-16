// Extrait de src/App.jsx le 2026-09-15 (refactor split-app, REFACTOR_PLAN.md). Code déplacé tel quel.
import { GIcon, ResultIcon } from "../../components/icons.jsx";
import { VOCAB } from "../../data/vocab.js";
import { shuffle } from "../../lib/util.js";
import { tone } from "../../lib/tone.js";
import { playCorrect, playWrong } from "../../sounds.js";
import { useMemo, useState, useRef, useEffect } from "react";

export function SpeedMatch(p){
  var pairCount=p.mode==="hard"?8:6;
  var cols=p.mode==="hard"?4:3;
  var rows=p.mode==="hard"?4:4;

  // Build pairs from vocab
  var pairs=useMemo(function(){
    var all=[];
    VOCAB.forEach(function(dom){dom.cards.forEach(function(c){
      // Shorten definition to fit tiles
      all.push({word:c.w,def:c.d});
    });});
    var picked=shuffle(all).slice(0,pairCount);
    var tiles=[];
    picked.forEach(function(pair,i){
      tiles.push({id:i*2,pairId:i,content:pair.word,type:"word"});
      tiles.push({id:i*2+1,pairId:i,content:pair.def,type:"def"});
    });
    return shuffle(tiles);
  },[]);

  var[revealed,setRevealed]=useState([]);
  var[matched,setMatched]=useState([]);
  var[moves,setMoves]=useState(0);
  var[startTime,setStartTime]=useState(null);
  var[elapsed,setElapsed]=useState(0);
  var[phase,setPhase]=useState("intro");
  var[lastWrong,setLastWrong]=useState(false);
  var timerRef=useRef(null);

  // Timer
  useEffect(function(){
    if(phase!=="play")return;
    timerRef.current=setInterval(function(){
      setElapsed(function(prev){return Math.round((Date.now()-startTime)/100)/10;});
    },100);
    return function(){clearInterval(timerRef.current);};
  },[phase,startTime]);

  // Check for match when 2 tiles revealed
  useEffect(function(){
    if(revealed.length!==2)return;
    var a=pairs.find(function(t){return t.id===revealed[0];});
    var b=pairs.find(function(t){return t.id===revealed[1];});
    setMoves(moves+1);
    if(a.pairId===b.pairId){
      // Match!
      try{playCorrect();}catch(e){}
      setTimeout(function(){
        setMatched(function(prev){return prev.concat([a.pairId]);});
        setRevealed([]);
      },300);
    } else {
      // No match
      try{playWrong();}catch(e){}
      setLastWrong(true);
      setTimeout(function(){setRevealed([]);setLastWrong(false);},800);
    }
  },[revealed.length]);

  // Check win
  var won=matched.length===pairCount;
  useEffect(function(){
    if(won&&phase==="play"){
      clearInterval(timerRef.current);
      setPhase("done");
    }
  },[won]);

  function tapTile(id){
    if(phase!=="play")return;
    if(revealed.length>=2)return;
    if(revealed.indexOf(id)!==-1)return;
    var tile=pairs.find(function(t){return t.id===id;});
    if(matched.indexOf(tile.pairId)!==-1)return;
    setRevealed(function(prev){return prev.concat([id]);});
  }

  function startGame(){
    setStartTime(Date.now());
    setPhase("play");
  }

  // ── INTRO ──
  if(phase==="intro")return(<div className="enter" style={{padding:"20px 16px",minHeight:"100vh",display:"flex",flexDirection:"column",justifyContent:"center",textAlign:"center"}}>
    <div style={{marginBottom:16,display:"flex",justifyContent:"center"}}><GIcon name="chained-arrow-heads" size={60} color="var(--cyan)"/></div>
    <h1 className="out" style={{fontWeight:900,fontSize:26,marginBottom:8}}>Speed Match</h1>
    <p style={{color:"var(--t2)",fontSize:13,marginBottom:8}}>{p.mode==="hard"?"Hard":"Easy"} — {pairCount} pairs to match</p>
    <p style={{color:"var(--t3)",fontSize:12,marginBottom:32,lineHeight:1.6}}>Tap two tiles to reveal them. Match each word with its definition. Fastest time wins!</p>
    <button className="btn1" onClick={startGame}>Start!</button>
    <button className="btn2" onClick={p.back} style={{marginTop:12,width:"100%"}}>Back</button></div>);

  // ── DONE ──
  if(phase==="done"){
    var finalTime=elapsed;
    var stars=finalTime<(pairCount*4)?3:finalTime<(pairCount*7)?2:1;
    var xp=Math.round((pairCount*10)+(stars*15)+(pairCount*30/Math.max(1,finalTime))*10);
    var modeKey=p.mode==="hard"?"matchHard":"matchEasy";
    var prev=p.u.gameScores&&p.u.gameScores[modeKey];
    var isRecord=!prev||finalTime<prev.time;

    return(<div className="enter" style={{padding:"20px 16px",minHeight:"100vh",display:"flex",flexDirection:"column",justifyContent:"center",textAlign:"center"}}>
      <div style={{marginBottom:16,display:"flex",justifyContent:"center",animation:"countUp .6s"}}><ResultIcon e={stars===3?"⚡":stars===2?"🎯":"✅"} size={56}/></div>
      <h1 className="out" style={{fontWeight:900,fontSize:28,marginBottom:8}}>{stars===3?"Lightning Fast!":stars===2?"Well Done!":"Completed!"}</h1>
      {isRecord&&<div style={{fontSize:14,color:"var(--gold)",fontWeight:700,marginBottom:8,animation:"pulse 1s infinite"}}>🏅 NEW RECORD!</div>}
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginBottom:20,maxWidth:280,margin:"0 auto 20px"}}>
        <div className="crd" style={{padding:12,textAlign:"center"}}><div className="out" style={{fontSize:24,fontWeight:800,color:"var(--cyan)"}}>{finalTime}s</div><div style={{fontSize:10,color:"var(--t3)"}}>Time</div></div>
        <div className="crd" style={{padding:12,textAlign:"center"}}><div className="out" style={{fontSize:24,fontWeight:800,color:"var(--purple)"}}>{moves}</div><div style={{fontSize:10,color:"var(--t3)"}}>Moves</div></div>
      </div>
      <div style={{fontSize:28,marginBottom:4}}>{["","⭐","⭐⭐","⭐⭐⭐"][stars]}</div>
      <div className="out" style={{fontSize:20,fontWeight:800,color:"var(--gold)",marginBottom:24}}>+{xp} XP</div>
      <button className="btn1" onClick={function(){p.done(modeKey,{time:finalTime,moves:moves},xp);}}>Collect XP</button>
    </div>);
  }

// ── PLAY ──
  return(<div style={{padding:"12px",height:"calc(100dvh - 64px - env(safe-area-inset-bottom, 0px))",display:"flex",flexDirection:"column"}}>
    <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12}}>
      <div/>
      <div style={{display:"flex",gap:16,alignItems:"center"}}>
        <span className="out" style={{fontSize:16,fontWeight:800,color:"var(--cyan)",fontVariantNumeric:"tabular-nums"}}>{elapsed}s</span>
        <span style={{fontSize:12,color:"var(--t3)"}}>{moves} moves</span>
      </div>
      <span style={{fontSize:12,color:"var(--t2)"}}>{matched.length}/{pairCount}</span>
    </div>
    <div style={{width:"100%",height:4,background:"var(--bg3)",borderRadius:2,marginBottom:20,overflow:"hidden"}}>
      <div style={{height:"100%",width:Math.round(matched.length/pairCount*100)+"%",background:"linear-gradient(90deg,var(--cx-hex),#8b5e83)",borderRadius:2,transition:"width .3s"}}/></div>

    <div style={{display:"grid",gridTemplateColumns:"repeat("+cols+",1fr)",gridTemplateRows:"repeat("+rows+",1fr)",gap:6,flex:1}}>
      {pairs.map(function(tile){
        var isRevealed=revealed.indexOf(tile.id)!==-1;
        var isMatched=matched.indexOf(tile.pairId)!==-1;
        var bgColor=isMatched?"rgba(0,230,118,.18)":isRevealed?(tile.type==="word"?"rgba(var(--cx),.2)":"rgba(27,112,207,.2)"):"var(--bg3)";
        var borderColor=isMatched?"var(--green)":isRevealed?(tile.type==="word"?"var(--cyan)":"var(--purple)"):"var(--bdr)";
        if(lastWrong&&isRevealed)borderColor="var(--red)";

        return(<div key={tile.id} onClick={function(){tapTile(tile.id);}}
          style={{
            minHeight:p.mode==="hard"?68:78,display:"flex",alignItems:"center",justifyContent:"center",
            background:isMatched?"rgba(0,230,118,.15)":bgColor,
            border:"1.5px solid "+borderColor,borderRadius:14,cursor:isMatched?"default":"pointer",
            opacity:isMatched?.4:1,transition:"all .25s",padding:"8px 6px",
            transform:isRevealed&&!isMatched?"scale(1.04)":"scale(1)"
          }}>
          {(isRevealed||isMatched)?(<span className="out" style={{
            fontSize:tile.type==="word"?14:11,fontWeight:tile.type==="word"?800:500,
            color:isMatched?tone("#059669"):tile.type==="word"?"var(--cyan)":"var(--t1)",
            textAlign:"center",lineHeight:1.35,wordBreak:"break-word"
          }}>{tile.content}</span>):(<span style={{fontSize:22,opacity:.25}}>?</span>)}
        </div>);
      })}
    </div>
    <button className="btn2" onClick={p.back} style={{marginTop:8,width:"100%",flexShrink:0}}>Back</button>
  </div>);
}
