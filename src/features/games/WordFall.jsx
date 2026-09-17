// Extrait de src/App.jsx le 2026-09-15 (refactor split-app, REFACTOR_PLAN.md). Code déplacé tel quel.
import { GIcon } from "../../components/icons.jsx";
import { SessionResult } from "../../components/SessionResult.jsx";
import { QUESTIONS } from "../../data/grammar.js";
import { shuffle } from "../../lib/util.js";
import { playCorrect, playWrong } from "../../sounds.js";
import { useMemo, useState, useRef, useEffect } from "react";

// ─── WORD FALL ───
export function WordFall(p){
  var allQs=useMemo(function(){return shuffle(QUESTIONS);},[]);
  var MAX_LIVES=3;
  var SPEED_TIERS=[
    {from:0,dur:8000},
    {from:5,dur:6000},
    {from:10,dur:4500},
    {from:15,dur:3500},
  ];

  var[qi,setQi]=useState(0);
  var[lives,setLives]=useState(MAX_LIVES);
  var[score,setScore]=useState(0);
  var[combo,setCombo]=useState(0);
  var[maxCombo,setMaxCombo]=useState(0);
  var[phase,setPhase]=useState("intro");
  //var[fallPct,setFallPct]=useState(0);
  var[feedback,setFeedback]=useState(null); // {type:"ok"|"miss",text:""}
  var[shake,setShake]=useState(false);
  var[dangerZone,setDangerZone]=useState(false);
  var fallRef=useRef(null);
  var startRef=useRef(null);
  var durRef=useRef(8000);
  var answeredRef=useRef(false);
  var falDivRef = useRef(null);
var progressBarRef = useRef(null);
  // La chute (animateFall) tourne dans la closure du rendu qui l'a lancée, celui de la réponse
  // PRÉCÉDENTE : son handleMiss lisait lives et qi d'un coup en retard (une vie perdue juste avant
  // revenait, et l'explication affichée était celle de la question d'avant). La ref pointe
  // toujours sur le handleMiss du dernier rendu.
  var missRef = useRef(null);
  missRef.current = handleMiss;
  var mistakesRef=useRef([]);var sentRef=useRef(false);var sidRef=useRef(0);var[result,setResult]=useState(null);

  function getDuration(idx){
    var d=SPEED_TIERS[0].dur;
    for(var i=SPEED_TIERS.length-1;i>=0;i--){
      if(idx>=SPEED_TIERS[i].from){d=SPEED_TIERS[i].dur;break;}
    }
    return d;
  }

  function startFall(){
  answeredRef.current = false;
  durRef.current = getDuration(qi);
  startRef.current = Date.now();
  if(falDivRef.current) falDivRef.current.style.top = "0%";
  if(progressBarRef.current) progressBarRef.current.style.height = "0%";
  setFeedback(null);
  fallRef.current = requestAnimationFrame(animateFall);
}

function animateFall(){
  if(answeredRef.current)return;
  var elapsed = Date.now() - startRef.current;
  var pct = Math.min(elapsed / durRef.current, 1);
  // ← Direct DOM, pas de setState
  if(falDivRef.current) falDivRef.current.style.top = Math.round(pct * 80) + "%";
  if(pct >= 0.7 && !dangerZone) setDangerZone(true);
  if(progressBarRef.current) progressBarRef.current.style.height = Math.round(pct * 100) + "%";
  if(pct >= 1){
    answeredRef.current = true;
    missRef.current(-1);
  } else {
    fallRef.current = requestAnimationFrame(animateFall);
  }
}

  function handleAnswer(i){
    if(answeredRef.current||phase!=="play")return;
    answeredRef.current=true;
    cancelAnimationFrame(fallRef.current);
    var q=allQs[qi];
    if(i===q.c){
      var newCombo=combo+1;
      setCombo(newCombo);
      if(newCombo>maxCombo)setMaxCombo(newCombo);
      var mult=newCombo>=6?3:newCombo>=3?2:1;
      setScore(score+mult);
      try{playCorrect();}catch(e){}
      setFeedback({type:"ok",text:newCombo>=3?newCombo+"-combo! x"+mult:"Correct!"});
      setTimeout(nextQuestion,600);
    } else {
      handleMiss(i);
    }
  }

  // pickIdx : option choisie, -1 si la phrase est tombée.
  function handleMiss(pickIdx){
    var newLives=lives-1;
    setLives(newLives);
    setCombo(0);
    try{playWrong();}catch(e){}
    setShake(true);
    setTimeout(function(){setShake(false);},400);
    var q=allQs[qi];
    mistakesRef.current.push({tag:q.cat,prompt:q.s,yours:pickIdx>=0?q.o[pickIdx]:"(too slow)",correct:q.o[q.c],why:q.x});
    setFeedback({type:"miss",text:q.x||"The answer was: "+q.o[q.c]});
    if(newLives<=0){
      setTimeout(function(){setPhase("done");},1500);
    } else {
      setTimeout(nextQuestion,1500);
    }
  }

  function nextQuestion(){
  setQi(function(prev){
    var next = prev + 1;
    if(next >= allQs.length){ setPhase("done"); return prev; }
    setFeedback(null);
    answeredRef.current = false;
    durRef.current = getDuration(next);
    startRef.current = Date.now();
    if(falDivRef.current) falDivRef.current.style.top = "0%";
  setDangerZone(false);
    if(progressBarRef.current) progressBarRef.current.style.height = "0%";
    fallRef.current = requestAnimationFrame(animateFall);
    return next;
  });
}

  // Cleanup
  useEffect(function(){return function(){cancelAnimationFrame(fallRef.current);};}, []);

  // Fin de partie (dernière vie ou plus de questions, depuis un minuteur) : l'XP part ici avec l'état
  // du dernier rendu, au lieu d'attendre « Collect XP ». Record lu avant l'envoi (sv() l'écrit).
  useEffect(function(){
    if(phase!=="done"||sentRef.current)return;
    sentRef.current=true;
    cancelAnimationFrame(fallRef.current);
    var xp=score*8+(maxCombo>=6?30:maxCombo>=3?15:0);
    var prev=p.u.gameScores&&p.u.gameScores.wordFall;
    setResult({record:!prev||prev.score==null||score>prev.score});
    sidRef.current=p.done("wordFall",{score:score,maxCombo:maxCombo,questions:qi+1},xp);
  },[phase]);

  // ── INTRO ──
  if(phase==="intro")return(<div className="enter" style={{padding:"20px 16px",minHeight:"100vh",display:"flex",flexDirection:"column",justifyContent:"center",textAlign:"center"}}>
    <div style={{marginBottom:16,display:"flex",justifyContent:"center"}}><GIcon name="meteor-impact" size={60} color="var(--cyan)"/></div>
    <h1 className="out" style={{fontWeight:900,fontSize:26,marginBottom:8}}>Word Fall</h1>
    <p style={{color:"var(--t2)",fontSize:13,marginBottom:8,lineHeight:1.6}}>Sentences fall from the sky.<br/>Tap the correct answer before they hit the ground!</p>
    <div style={{display:"flex",justifyContent:"center",gap:16,marginBottom:8}}>
      <span style={{fontSize:13,color:"var(--red)"}}>♥♥♥ 3 lives</span>
      <span style={{fontSize:13,color:"var(--orange)"}}>Gets faster!</span>
    </div>
    <div className="crd" style={{padding:12,marginBottom:24,textAlign:"left"}}>
      <div style={{fontSize:11,color:"var(--t3)",lineHeight:1.7}}>
        <div>• Q1-5: 8 seconds per question</div>
        <div>• Q6-10: 6 seconds</div>
        <div>• Q11-15: 4.5 seconds</div>
        <div>• Q16+: 3.5 seconds — survival mode!</div>
        <div style={{marginTop:6,color:"var(--gold)"}}>• Build combos for bonus XP!</div>
      </div>
    </div>
    <button className="btn1" onClick={function(){setPhase("play");setTimeout(startFall,300);}}>Start!</button>
    <button className="btn2" onClick={p.back} style={{marginTop:12,width:"100%"}}>Back</button></div>);

  // ── DONE ──
  if(phase==="done")return(<SessionResult session={p.session} sid={sidRef.current} name="Word Fall" mode="points" points={score} pointsLabel="points"
    mistakes={mistakesRef.current} onContinue={function(){p.closeSession();p.back();}} onReplay={p.replaySession}>
    <div className="crd" style={{padding:14}}>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,textAlign:"center"}}>
        <div><div className="out" style={{fontSize:24,fontWeight:800,color:"var(--orange)"}}>{qi+1}</div><div style={{fontSize:11,color:"var(--t2)"}}>Questions</div></div>
        <div><div className="out" style={{fontSize:24,fontWeight:800,color:"var(--purple)"}}>{maxCombo>1?"x"+maxCombo:"—"}</div><div style={{fontSize:11,color:"var(--t2)"}}>Max combo</div></div>
      </div>
      {result&&result.record&&<div className="out" style={{fontSize:14,fontWeight:700,color:"var(--gold)",textAlign:"center",marginTop:10}}>New record!</div>}
    </div>
  </SessionResult>);

  // ── PLAY ──
  var q=allQs[qi];
  var tierLabel=qi>=15?"SURVIVAL":qi>=10?"FAST":qi>=5?"MEDIUM":"WARM-UP";
  var tierCol=qi>=15?"var(--red)":qi>=10?"var(--orange)":qi>=5?"var(--cyan)":"var(--green)";
  var comboMult=combo>=6?3:combo>=3?2:1;

  return(<div className={shake?"sk":""} style={{height:"calc(100dvh - 64px - env(safe-area-inset-bottom, 0px))",display:"flex",flexDirection:"column",background:"var(--bg)",overflow:"hidden"}}>
    {/* Header */}
    <div style={{padding:"12px 16px 0",flexShrink:0}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:8}}>
        <div style={{display:"flex",gap:4}}>
          {[0,1,2].map(function(i){return(<span key={i} style={{fontSize:20,transition:"all .3s",opacity:i<lives?1:.15,transform:i>=lives?"scale(0.7)":"scale(1)"}}>{i<lives?"❤️":"🖤"}</span>);})}
        </div>
        <div style={{textAlign:"center"}}>
          {comboMult>1&&<div className="out" style={{fontSize:11,fontWeight:800,color:"var(--gold)",animation:"pulse .6s infinite"}}>COMBO x{comboMult} 🔥</div>}
          <span style={{fontSize:10,color:tierCol,fontWeight:700,textTransform:"uppercase",letterSpacing:1}} className="out">{tierLabel}</span>
        </div>
        <div className="out" style={{fontSize:20,fontWeight:800,color:"var(--cyan)"}}>{score}</div>
      </div>
    </div>

    {/* Fall zone */}
    <div style={{flex:1,position:"relative",padding:"0 16px",display:"flex",flexDirection:"column",justifyContent:"flex-start",overflow:"hidden"}}>
      {/* The falling sentence */}
      <div ref={falDivRef} style={{
  position:"absolute",left:16,right:16,
  top:"0%",
  opacity:feedback?0:1,
}}>
        <div className="crd" style={{
          padding:"16px 20px",textAlign:"center",
          borderColor:dangerZone?"rgba(255,71,87,.4)":"var(--bdr)",
          background:dangerZone?"rgba(255,71,87,.06)":"var(--bg2)",
          transition:"border-color .3s, background .3s",
        }}>
          <span style={{fontSize:10,color:"var(--purple)",fontWeight:700,textTransform:"uppercase",letterSpacing:1,display:"block",marginBottom:6}} className="out">{q.cat}</span>
          <span className="qstem" style={{fontSize:16,fontWeight:700,lineHeight:1.5,color:"var(--t1)"}}>{q.s}</span>
        </div>
      </div>

      {/* Feedback overlay */}
      {feedback&&<div style={{position:"absolute",left:16,right:16,top:"30%",textAlign:"center",animation:"fadeIn .2s",zIndex:5}}>
        {feedback.type==="ok"?(<div>
          <div style={{fontSize:48,marginBottom:8}}>✅</div>
          <div className="out" style={{fontSize:18,fontWeight:800,color:comboMult>1?"var(--gold)":"var(--green)"}}>{feedback.text}</div>
        </div>):(<div>
          <div style={{fontSize:48,marginBottom:8}}>💥</div>
          <div className="crd" style={{padding:12,background:"rgba(255,71,87,.08)",borderColor:"rgba(255,71,87,.2)"}}>
            <p style={{fontSize:12,color:"var(--t2)",lineHeight:1.5}}>{feedback.text}</p>
          </div>
        </div>)}
      </div>}

      {/* Fall progress bar (right side) */}
      <div style={{position:"absolute",right:4,top:16,bottom:16,width:3,background:"var(--bg3)",borderRadius:2}}>
        <div ref={progressBarRef} style={{position:"absolute",top:0,width:"100%",height:"0%",background:dangerZone?"var(--red)":"var(--cyan)",borderRadius:2}}/>
      </div>
    </div>

    {/* Answer buttons — fixed 2x2 grid at bottom */}
    <div style={{padding:"12px 16px 24px",flexShrink:0}}>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
        {q.o.map(function(opt,i){
          var isDisabled=!!feedback;
          return(<button key={qi+"-"+i} onClick={function(){handleAnswer(i);}} disabled={isDisabled}
            style={{
              padding:"16px 12px",background:"var(--bg2)",border:"1.5px solid var(--bdr)",
              borderRadius:14,cursor:isDisabled?"default":"pointer",fontSize:15,fontWeight:600,
              color:"var(--t1)",fontFamily:"'DM Sans',sans-serif",
              transition:"all .15s",textAlign:"center",minHeight:54,
              opacity:isDisabled?.5:1,
            }}>
            <span style={{fontSize:11,color:"var(--t3)",display:"block",marginBottom:2}}>{String.fromCharCode(65+i)}</span>
            {opt}
          </button>);
        })}
      </div>
    </div>
  </div>);
}
