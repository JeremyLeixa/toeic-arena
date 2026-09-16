// Extrait de src/App.jsx le 2026-09-15 (refactor split-app, REFACTOR_PLAN.md). Code déplacé tel quel.
import { Bar } from "../../components/Bar.jsx";
import { ResultIcon, GIcon } from "../../components/icons.jsx";
import { ListeningGraphic } from "../../components/ListeningGraphic.jsx";
import { resumeAudioSession, stopListenAudio, playAudioFile, playLetteredOption } from "../../lib/audio.js";
import { haptic } from "../../lib/device.js";
import { generateEndlessTest, endlessAnsFitsTest, freshAnsFor } from "../../lib/endless.js";
import { estimateToeic } from "../../lib/toeic.js";
import { today } from "../../lib/util.js";
import { tone } from "../../lib/tone.js";
import { stopBGM } from "../../sounds.js";
import { useMemo, useState, useEffect, useRef } from "react";

// ─── ENDLESS ARENA ───
export function EndlessArena(p){
  // Le test etait regenere a chaque montage (useMemo), alors que la session ne
  // sauvegardait QUE les reponses et la position : reprendre une session
  // rebranchait donc les anciennes reponses sur un test entierement different.
  // Le test est desormais persiste avec la session, dans sa propre cle pour que
  // la sauvegarde toutes les 5 s n ait pas a re-serialiser ~80 Ko.
  var ENDLESS_TEST_KEY="endlessArenaTest";
  var savedTest=useMemo(function(){try{
    var rawT=localStorage.getItem(ENDLESS_TEST_KEY);if(!rawT)return null;
    var dT=JSON.parse(rawT);if(dT.date!==today())return null;
    if(!dT.test||!dT.test.p1||!dT.test.p7)return null;
    return dT.test;
  }catch(e){console.warn("[ENDLESS] test restore caught:",e&&e.message);return null;}},[]);
  var[test,setTest]=useState(function(){return savedTest||generateEndlessTest();});
  var LP1=test.p1,LP2=test.p2,LP3=test.p3,LP4=test.p4;
  var RP5=test.p5,RP6=test.p6,RP7=test.p7;
  var p3QC=0;LP3.forEach(function(c){p3QC+=c.qs.length;});
  var p4QC=0;LP4.forEach(function(t){p4QC+=t.qs.length;});
  var lisQ=LP1.length+LP2.length+p3QC+p4QC;
  var p6BC=0;RP6.forEach(function(t){t.parts.forEach(function(pt){if(pt.blank)p6BC++;});});
  var p7QC=0;RP7.forEach(function(ps){p7QC+=ps.questions.length;});
  var readQ=RP5.length+p6BC+p7QC;
  var totalQ=lisQ+readQ;
  var TOTAL_TIME=120*60;
  var ENDLESS_STORAGE_KEY="endlessArenaSession";

  // ── Audio path builder — detect training vs boss items ──
  function isBoss(id){return id&&id.charAt(0)==="b";}
  function bossIdx(id){return parseInt(id.replace(/^bp\d_/,""),10);}

  // ── Restore saved session ──
  var saved=useMemo(function(){try{
    // Sans le test d origine, les reponses enregistrees ne designent plus rien.
    if(!savedTest)return null;
    var raw=localStorage.getItem(ENDLESS_STORAGE_KEY);if(!raw)return null;
    var d=JSON.parse(raw);if(d.date!==today())return null;
    if(!d.ans||!d.sec||d.timeLeft==null)return null;
    if(!endlessAnsFitsTest(d.ans,savedTest))return null;
    return d;
  }catch(e){console.warn("[ENDLESS] session restore caught:",e&&e.message);return null;}},[]);

  var freshAns=function(){return freshAnsFor(test);};
  // Ecrit une seule fois, au demarrage d une session (pas dans la boucle des 5 s).
  // Si le quota localStorage refuse les ~80 Ko, on log et on continue : la partie
  // se joue normalement, seule la reprise est perdue. C est la bonne degradation.
  function persistTest(t){try{localStorage.setItem(ENDLESS_TEST_KEY,JSON.stringify({date:today(),test:t}));}
    catch(e){console.warn("[ENDLESS] test save caught:",e&&e.message);}}

  var[phase,setPhase]=useState(saved?"resume":"intro");
  var[sec,setSec]=useState(saved?saved.sec:"p1");
  var[qi,setQi]=useState(saved?saved.qi:0);
  var[sqi,setSqi]=useState(saved?saved.sqi:0);
  var[ans,setAns]=useState(function(){return saved?saved.ans:freshAns();});
  var[timeLeft,setTimeLeft]=useState(saved?saved.timeLeft:TOTAL_TIME);

  function saveSession(a,s,q,sq,tl){try{localStorage.setItem(ENDLESS_STORAGE_KEY,JSON.stringify({date:today(),ans:a,sec:s,qi:q,sqi:sq,timeLeft:tl}));}
    catch(e){console.warn("[ENDLESS] session save caught:",e&&e.message);}}
  function clearSession(){try{localStorage.removeItem(ENDLESS_STORAGE_KEY);localStorage.removeItem(ENDLESS_TEST_KEY);}
    catch(e){console.warn("[ENDLESS] session clear caught:",e&&e.message);}}
  useEffect(function(){resumeAudioSession();return stopListenAudio;},[]);
  var[result,setResult]=useState(null);
  var[doneInfo,setDoneInfo]=useState(null); // valeurs PB/attempts/XP figées au submit (voir GARDE dans doSubmit)
  var[aState,setAState]=useState("ready");
  var[curOpt,setCurOpt]=useState(-1);
  var timerRef=useRef(null);

  useEffect(function(){
    if(phase!=="test"||result)return;
    if(timeLeft<=0){doSubmit();return;}
    timerRef.current=setTimeout(function(){setTimeLeft(timeLeft-1);},1000);
    return function(){clearTimeout(timerRef.current);};
  });

  // ── Auto-save session ──
  var stateRef=useRef({ans:ans,sec:sec,qi:qi,sqi:sqi,timeLeft:timeLeft,phase:phase});
  stateRef.current={ans:ans,sec:sec,qi:qi,sqi:sqi,timeLeft:timeLeft,phase:phase};
  useEffect(function(){
    if(phase!=="test"||result)return;
    var id=setTimeout(function(){saveSession(ans,sec,qi,sqi,timeLeft);},5000);
    return function(){clearTimeout(id);};
  });
  useEffect(function(){
    function onUnload(){var s=stateRef.current;if(s.phase==="test")saveSession(s.ans,s.sec,s.qi,s.sqi,s.timeLeft);}
    window.addEventListener("beforeunload",onUnload);
    return function(){window.removeEventListener("beforeunload",onUnload);};
  },[]);

  function fmtT(s){var m=Math.floor(s/60);var sc2=s%60;return m+":"+(sc2<10?"0":"")+sc2;}

  // ── Audio — dynamic paths based on item origin ──
  // Lettres annoncees a part (playLetteredOption) : les clips d'options n'en contiennent plus
  // (2026-09-16), la permutation `aud` ne desaligne donc plus ce qu'on entend de ce qu'on clique.
  async function playP1(){if(aState!=="ready")return;setAState("playing");var it=LP1[qi];for(var i=0;i<it.opts.length;i++){setCurOpt(i);var ai=it.aud?it.aud[i]:i;if(isBoss(it.id)){await playLetteredOption("p1",it.id,i,"/audio/boss/p1_"+String(bossIdx(it.id)).padStart(2,"0")+"_"+ai+".mp3");}else{await playLetteredOption("p1",it.id,i,"/audio/p1/"+it.id+"_"+ai+".mp3");}await new Promise(function(r){setTimeout(r,400);});}setCurOpt(-1);setAState("done");}
  async function playP2(){if(aState!=="ready")return;setAState("playing");var it=LP2[qi];if(isBoss(it.id)){var bid=String(bossIdx(it.id)).padStart(2,"0");await playAudioFile("/audio/boss/p2_"+bid+"_q.mp3");await new Promise(function(r){setTimeout(r,400);});for(var i=0;i<3;i++){setCurOpt(i);await playLetteredOption("p2",it.id,i,"/audio/boss/p2_"+bid+"_"+(it.aud?it.aud[i]:i)+".mp3");await new Promise(function(r){setTimeout(r,300);});};}else{await playAudioFile("/audio/p2/"+it.id+"_q.mp3");await new Promise(function(r){setTimeout(r,400);});for(var i2=0;i2<3;i2++){setCurOpt(i2);await playLetteredOption("p2",it.id,i2,"/audio/p2/"+it.id+"_"+(it.aud?it.aud[i2]:i2)+".mp3");await new Promise(function(r){setTimeout(r,300);});}}setCurOpt(-1);setAState("done");}
  // P3/P4 Endless mode (2026-05-05 V2) : TOEIC-faithful per-question playback.
  // Talk plays once → 800ms pause → q1 audio → done state (q1 options revealed).
  // Subsequent qN audio fired by nxt() when sqi increments. Boss-origin items
  // (isBoss) keep talk-only playback — no per-question files in /audio/boss/* yet.
  async function playQ3(idx){var it=LP3[qi];if(isBoss(it.id))return;try{await playAudioFile("/audio/p3/"+it.id+"_q"+(idx+1)+".mp3");}catch(e){console.warn("[Endless P3] q audio failed:",e&&e.message);}}
  async function playQ4(idx){var it=LP4[qi];if(isBoss(it.id))return;try{await playAudioFile("/audio/p4/"+it.id+"_q"+(idx+1)+".mp3");}catch(e){console.warn("[Endless P4] q audio failed:",e&&e.message);}}
  async function playP3(){if(aState!=="ready")return;setAState("playing");var it=LP3[qi];if(isBoss(it.id)){await playAudioFile("/audio/boss/p3_"+String(bossIdx(it.id)).padStart(2,"0")+".mp3");}else{await playAudioFile("/audio/p3/"+it.id+".mp3");await new Promise(function(r){setTimeout(r,800);});await playQ3(0);}setAState("done");}
  async function playP4(){if(aState!=="ready")return;setAState("playing");var it=LP4[qi];if(isBoss(it.id)){await playAudioFile("/audio/boss/p4_"+String(bossIdx(it.id)).padStart(2,"0")+".mp3");}else{await playAudioFile("/audio/p4/"+it.id+".mp3");await new Promise(function(r){setTimeout(r,800);});await playQ4(0);}setAState("done");}

  // ── Answer & Navigate ──
  function pick(val){
    var a=JSON.parse(JSON.stringify(ans));
    if(sec==="p1")a.p1[qi]=val;
    else if(sec==="p2")a.p2[qi]=val;
    else if(sec==="p3")a.p3[qi][sqi]=val;
    else if(sec==="p4")a.p4[qi][sqi]=val;
    else if(sec==="p5")a.p5[qi]=val;
    else if(sec==="p6")a.p6[qi][sqi]=val;
    else if(sec==="p7")a.p7[qi][sqi]=val;
    setAns(a);setTimeout(nxt,300);
  }
  function nxt(){
    if(sec==="p1"){if(qi<LP1.length-1){setQi(qi+1);setAState("ready");setCurOpt(-1);}else{setSec("p2");setQi(0);setSqi(0);setAState("ready");setCurOpt(-1);}}
    else if(sec==="p2"){if(qi<LP2.length-1){setQi(qi+1);setAState("ready");setCurOpt(-1);}else{setSec("p3");setQi(0);setSqi(0);setAState("ready");}}
    else if(sec==="p3"){if(sqi<LP3[qi].qs.length-1){var ns3=sqi+1;setSqi(ns3);playQ3(ns3);}else if(qi<LP3.length-1){setQi(qi+1);setSqi(0);setAState("ready");}else{setSec("p4");setQi(0);setSqi(0);setAState("ready");}}
    else if(sec==="p4"){if(sqi<LP4[qi].qs.length-1){var ns4=sqi+1;setSqi(ns4);playQ4(ns4);}else if(qi<LP4.length-1){setQi(qi+1);setSqi(0);setAState("ready");}else{setSec("p5");setQi(0);setSqi(0);}}
    else if(sec==="p5"){if(qi<RP5.length-1)setQi(qi+1);else{setSec("p6");setQi(0);setSqi(0);}}
    else if(sec==="p6"){var bN=ans.p6[qi].length;if(sqi<bN-1)setSqi(sqi+1);else if(qi<RP6.length-1){setQi(qi+1);setSqi(0);}else{setSec("p7");setQi(0);setSqi(0);}}
    else if(sec==="p7"){if(sqi<RP7[qi].questions.length-1)setSqi(sqi+1);else if(qi<RP7.length-1){setQi(qi+1);setSqi(0);}else doSubmit();}
  }

  // ── Scoring ──
  function doSubmit(){
    clearTimeout(timerRef.current);clearSession();
    var p1s=0;LP1.forEach(function(q,i){if(ans.p1[i]===q.c)p1s++;});
    var p2s=0;LP2.forEach(function(q,i){if(ans.p2[i]===q.c)p2s++;});
    var p3s=0;LP3.forEach(function(c,i){c.qs.forEach(function(q,j){if(ans.p3[i][j]===q.c)p3s++;});});
    var p4s=0;LP4.forEach(function(t,i){t.qs.forEach(function(q,j){if(ans.p4[i][j]===q.c)p4s++;});});
    var lRaw=p1s+p2s+p3s+p4s;var lT=estimateToeic(lRaw,lisQ);
    var p5s=0;RP5.forEach(function(q,i){if(ans.p5[i]===q.c)p5s++;});
    var p6s=0;RP6.forEach(function(t,ti){var bi=0;t.parts.forEach(function(pt){if(pt.blank){if(ans.p6[ti][bi]===pt.correct)p6s++;bi++;}});});
    var p7s=0;RP7.forEach(function(ps,pi){ps.questions.forEach(function(q,qi2){if(ans.p7[pi][qi2]===q.correct)p7s++;});});
    var rRaw=p5s+p6s+p7s;var rT=estimateToeic(rRaw,readQ);

    // Per-part accuracy for weakest detection
    var partAcc={1:LP1.length>0?p1s/LP1.length:1,2:LP2.length>0?p2s/LP2.length:1,3:p3QC>0?p3s/p3QC:1,4:p4QC>0?p4s/p4QC:1,5:RP5.length>0?p5s/RP5.length:1,6:p6BC>0?p6s/p6BC:1,7:p7QC>0?p7s/p7QC:1};
    var weakestPart=1;var weakestAcc=partAcc[1];
    for(var pp=2;pp<=7;pp++){
      if(partAcc[pp]<weakestAcc||(partAcc[pp]===weakestAcc&&pp<=4&&weakestPart>4)){weakestPart=pp;weakestAcc=partAcc[pp];}
    }

    var toeicEst=lT+rT;
    var res={date:today(),score:lRaw+rRaw,total:totalQ,toeicEstimate:toeicEst,
      listening:{score:lRaw,total:lisQ,toeic:lT,p1:{score:p1s,total:LP1.length},p2:{score:p2s,total:LP2.length},p3:{score:p3s,total:p3QC},p4:{score:p4s,total:p4QC}},
      reading:{score:rRaw,total:readQ,toeic:rT,p5:{score:p5s,total:RP5.length},p6:{score:p6s,total:p6BC},p7:{score:p7s,total:p7QC}},
      weakestPart:weakestPart,weakestAccuracy:weakestAcc,timeUsed:TOTAL_TIME-timeLeft};
    // GARDE : persister IMMÉDIATEMENT le résultat (même bug que MockTest/Boss,
    // Yannou 2026-05-17 : persistance au clic = run perdu si fermeture depuis
    // l'écran de résultats). Les valeurs PB/attempts/XP sont FIGÉES ici AVANT
    // p.done : après la persistance, p.u.mockResults.endless est à jour et les
    // recalculer au render afficherait isNewPB=false et attempts décalé.
    // endlessDone ne navigue plus ; les boutons ne font que naviguer.
    var prevE=p.u.mockResults&&p.u.mockResults.endless;
    var prevBest=prevE&&prevE.best?prevE.best:0;
    var attempts=(prevE&&prevE.attempts?prevE.attempts:0)+1;
    var isNewPB=res.toeicEstimate>prevBest;
    var baseXp=Math.round(res.toeicEstimate*1.5*0.7);
    var pbBonus=isNewPB&&attempts>1?500:0;
    var history=prevE&&prevE.history?prevE.history.slice(-6):[];
    history.push({date:Date.now(),toeicEstimate:res.toeicEstimate,listening:lT,reading:rT,weakestPart:weakestPart,weakestAccuracy:weakestAcc});
    if(isNewPB&&attempts>1)haptic("pb");
    setDoneInfo({prevBest:prevBest,attempts:attempts,isNewPB:isNewPB,baseXp:baseXp,pbBonus:pbBonus,totalXp:baseXp+pbBonus,history:history});
    setResult(res);setPhase("done");
    try{p.done(res,baseXp+pbBonus,{history:history,attempts:attempts,isNewPB:isNewPB});}catch(e){console.warn("[Endless] persist failed:",e&&e.message);}
  }

  // ── Progress ──
  var answered=0;
  ans.p1.forEach(function(a){if(a>=0)answered++;});ans.p2.forEach(function(a){if(a>=0)answered++;});
  ans.p3.forEach(function(c){c.forEach(function(a){if(a>=0)answered++;});});ans.p4.forEach(function(t){t.forEach(function(a){if(a>=0)answered++;});});
  ans.p5.forEach(function(a){if(a>=0)answered++;});ans.p6.forEach(function(t){t.forEach(function(a){if(a>=0)answered++;});});
  ans.p7.forEach(function(ps){ps.forEach(function(a){if(a>=0)answered++;});});

  var secLabel=sec==="p1"?"Part 1 — Photos":sec==="p2"?"Part 2 — Q&R":sec==="p3"?"Part 3 — Conversations":sec==="p4"?"Part 4 — Talks":sec==="p5"?"Part 5 — Sentences":sec==="p6"?"Part 6 — Text Completion":"Part 7 — Reading";
  var isListening=sec==="p1"||sec==="p2"||sec==="p3"||sec==="p4";

  // ═══ RESUME ═══
  if(phase==="resume"&&saved){
    var rAnswered=0;
    saved.ans.p1.forEach(function(a){if(a>=0)rAnswered++;});saved.ans.p2.forEach(function(a){if(a>=0)rAnswered++;});
    saved.ans.p3.forEach(function(c){c.forEach(function(a){if(a>=0)rAnswered++;});});saved.ans.p4.forEach(function(t){t.forEach(function(a){if(a>=0)rAnswered++;});});
    saved.ans.p5.forEach(function(a){if(a>=0)rAnswered++;});saved.ans.p6.forEach(function(t){t.forEach(function(a){if(a>=0)rAnswered++;});});
    saved.ans.p7.forEach(function(ps){ps.forEach(function(a){if(a>=0)rAnswered++;});});
    return(<div className="enter" style={{padding:"20px 16px",minHeight:"100vh",display:"flex",flexDirection:"column",justifyContent:"center",textAlign:"center"}}>
      <div style={{marginBottom:12,display:"flex",justifyContent:"center"}}><ResultIcon e={"⏳"} size={54}/></div>
      <h1 className="out" style={{fontWeight:900,fontSize:24,marginBottom:8}}>Session in progress</h1>
      <p style={{color:"var(--t2)",fontSize:14,marginBottom:24}}>You have an unfinished Endless Arena attempt from today.</p>
      <div className="crd" style={{padding:16,marginBottom:24,textAlign:"left"}}>
        <div style={{display:"flex",justifyContent:"space-between",marginBottom:8}}><span style={{color:"var(--t2)",fontSize:13}}>Progress</span><span className="out" style={{fontWeight:700,color:"var(--endless)",fontSize:14}}>{rAnswered}/{totalQ} answered</span></div>
        <Bar value={rAnswered} max={totalQ} h={6} color="linear-gradient(90deg,#0a3a6e,#1B70CF)"/>
        <div style={{display:"flex",justifyContent:"space-between",marginTop:10}}><span style={{color:"var(--t2)",fontSize:13}}>Time remaining</span><span className="out" style={{fontWeight:700,color:saved.timeLeft>600?"var(--endless)":"var(--orange)",fontSize:14}}>{fmtT(saved.timeLeft)}</span></div>
      </div>
      <button className="btn1" style={{background:"linear-gradient(135deg,#1B70CF,#4a9fe0)",fontSize:16,padding:"14px 28px",marginBottom:12}} onClick={function(){stopBGM();setPhase("test");}}>Resume session</button>
      <button className="btn2" style={{marginBottom:8}} onClick={function(){var nt=generateEndlessTest();clearSession();setTest(nt);setAns(freshAnsFor(nt));setSec("p1");setQi(0);setSqi(0);setTimeLeft(TOTAL_TIME);setPhase("intro");}}>Start over</button>
      <button className="btn2" onClick={p.back}>Back</button>
    </div>);
  }

  // ═══ INTRO ═══
  if(phase==="intro"){
    return(<div className="enter" style={{padding:"20px 16px",minHeight:"100vh",display:"flex",flexDirection:"column",justifyContent:"center",textAlign:"center"}}>
      <div style={{marginBottom:12,display:"flex",justifyContent:"center",animation:"pulse 2s infinite"}}><ResultIcon e={"⏳"} size={60}/></div>
      <h1 className="out" style={{fontWeight:900,fontSize:28,background:"linear-gradient(90deg,#7fb8e8,#4a9fe0,#d4943a)",WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent",marginBottom:4}}>ENDLESS ARENA</h1>
      <p style={{color:"var(--t2)",fontSize:14,fontStyle:"italic",marginBottom:20}}>the arena never sleeps</p>
      <div className="crd" style={{textAlign:"left",padding:16,marginBottom:16}}>
        <div style={{fontSize:11,color:"var(--orange)",fontWeight:700,textTransform:"uppercase",letterSpacing:1,marginBottom:8}}>{"🔊"} Listening Section</div>
        <div style={{fontSize:13,color:"var(--t1)",lineHeight:1.8}}>
          <div style={{display:"flex",justifyContent:"space-between"}}><span>Part 1 — Photographs</span><span className="out" style={{color:"var(--endless)"}}>{LP1.length} Q</span></div>
          <div style={{display:"flex",justifyContent:"space-between"}}><span>Part 2 — Question-Response</span><span className="out" style={{color:"var(--endless)"}}>{LP2.length} Q</span></div>
          <div style={{display:"flex",justifyContent:"space-between"}}><span>Part 3 — Conversations</span><span className="out" style={{color:"var(--endless)"}}>{p3QC} Q</span></div>
          <div style={{display:"flex",justifyContent:"space-between"}}><span>Part 4 — Talks</span><span className="out" style={{color:"var(--endless)"}}>{p4QC} Q</span></div>
          <div style={{borderTop:"1px solid var(--bdr)",marginTop:6,paddingTop:6,display:"flex",justifyContent:"space-between",fontWeight:700}}><span>Subtotal</span><span style={{color:"var(--gold)"}}>{lisQ} Q</span></div>
        </div>
      </div>
      <div className="crd" style={{textAlign:"left",padding:16,marginBottom:16}}>
        <div style={{fontSize:11,color:"var(--green)",fontWeight:700,textTransform:"uppercase",letterSpacing:1,marginBottom:8}}>{"📖"} Reading Section</div>
        <div style={{fontSize:13,color:"var(--t1)",lineHeight:1.8}}>
          <div style={{display:"flex",justifyContent:"space-between"}}><span>Part 5 — Incomplete Sentences</span><span className="out" style={{color:"var(--endless)"}}>{RP5.length} Q</span></div>
          <div style={{display:"flex",justifyContent:"space-between"}}><span>Part 6 — Text Completion</span><span className="out" style={{color:"var(--endless)"}}>{p6BC} Q</span></div>
          <div style={{display:"flex",justifyContent:"space-between"}}><span>Part 7 — Reading Comprehension</span><span className="out" style={{color:"var(--endless)"}}>{p7QC} Q</span></div>
          <div style={{borderTop:"1px solid var(--bdr)",marginTop:6,paddingTop:6,display:"flex",justifyContent:"space-between",fontWeight:700}}><span>Subtotal</span><span style={{color:"var(--gold)"}}>{readQ} Q</span></div>
        </div>
      </div>
      <div className="crd glo" style={{padding:14,marginBottom:20}}>
        <div style={{display:"flex",justifyContent:"space-between",fontWeight:800,fontSize:15,color:"var(--t1)"}}><span>TOTAL</span><span className="out" style={{color:"var(--gold)"}}>{totalQ} questions {"·"} 120 min</span></div>
      </div>
      <div className="crd" style={{padding:14,marginBottom:24,borderColor:"rgba(27,112,207,.3)",background:"rgba(27,112,207,.06)"}}>
        <p style={{fontSize:12,color:"var(--endless)",lineHeight:1.6}}><GIcon name="sands-of-time" size={12} color="var(--endless)" style={{marginRight:4,verticalAlign:"-1px"}}/>Randomly generated from the full content pool. No feedback during test. Your score and weakest part will be analyzed.</p>
      </div>
      <button className="btn1" style={{background:"linear-gradient(135deg,#1B70CF,#4a9fe0)",fontSize:18,padding:"16px 32px"}} onClick={function(){stopBGM();persistTest(test);setPhase("test");}}><GIcon name="sands-of-time" size={16} color="#0f0c08" style={{marginRight:6,verticalAlign:"-2px"}}/>Enter the Sanctuary</button>
      <button className="btn2" onClick={p.back} style={{marginTop:12,width:"100%"}}>Not ready yet</button>
    </div>);
  }

  // ═══ TEST PHASE ═══
  if(phase==="test"&&!result){
    var timerCol=timeLeft>600?"var(--endless)":timeLeft>120?"var(--orange)":"var(--red)";
    var header=(<div style={{marginBottom:16}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:8}}>
        <div style={{fontSize:11,color:isListening?"var(--orange)":"var(--green)",fontWeight:700,textTransform:"uppercase",letterSpacing:1}}>{isListening?"🔊 Listening":"📖 Reading"}</div>
        <div className="out" style={{fontSize:14,fontWeight:800,color:timerCol}}>{fmtT(timeLeft)}</div>
      </div>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:8}}>
        <span className="out" style={{fontSize:13,fontWeight:700}}>{secLabel}</span>
        <span style={{fontSize:11,color:"var(--t3)"}}>{answered}/{totalQ} answered</span>
      </div>
      <Bar value={answered} max={totalQ} h={4} color={isListening?"linear-gradient(90deg,#f59e0b,#1B70CF)":"linear-gradient(90deg,#22c55e,#1B70CF)"}/>
    </div>);

    // ── P1 ──
    if(sec==="p1"){
      var it=LP1[qi];var selP1=ans.p1[qi];
      return(<div style={{padding:"20px 16px",minHeight:"100vh"}}>
        {header}
        <div style={{marginBottom:12,borderRadius:14,overflow:"hidden",border:"1px solid var(--bdr)"}}>
          <img src={it.img} alt="TOEIC photo" style={{width:"100%",display:"block",maxHeight:240,objectFit:"cover"}}/>
        </div>
        {aState==="ready"&&<div style={{textAlign:"center",marginBottom:16}}>
          <button onClick={playP1} style={{width:70,height:70,borderRadius:"50%",border:"none",background:"linear-gradient(135deg,#1B70CF,#4a9fe0)",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",margin:"0 auto"}}><span style={{fontSize:28}}>{"▶️"}</span></button>
          <p style={{color:"var(--t2)",fontSize:12,marginTop:8}}>Tap to play — listen and choose</p></div>}
        {(aState==="playing"||aState==="done")&&<div>
          {aState==="playing"&&<div style={{textAlign:"center",marginBottom:12}}>
            <p className="out" style={{color:"var(--orange)",fontSize:13,animation:"pulse 1.5s infinite"}}>{"🔊"} Playing statement {String.fromCharCode(65+(curOpt>=0?curOpt:0))}...</p></div>}
          {aState==="done"&&selP1<0&&<div style={{textAlign:"center",marginBottom:12}}>
            <p className="out" style={{color:"var(--green)",fontSize:13}}>Audio complete — choose your answer</p></div>}
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
            {["A","B","C","D"].map(function(lbl,i){var isCur=curOpt===i;var isSel=selP1===i;return(<button key={i} onClick={function(){if(aState==="done"||aState==="playing")pick(i);}} style={{padding:"14px 8px",borderRadius:12,border:"2px solid "+(isSel?"var(--endless)":isCur?"var(--orange)":"var(--bdr)"),background:isSel?"rgba(27,112,207,.15)":isCur?"rgba(245,158,11,.1)":"var(--bg2)",cursor:"pointer",fontSize:16,fontWeight:800,color:isSel?"var(--endless)":isCur?"var(--orange)":"var(--t1)",fontFamily:"'Cinzel','Outfit',serif",animation:isCur?"pulse 1s infinite":"none"}}>{lbl}</button>);})}
          </div>
        </div>}
      </div>);
    }

    // ── P2 ──
    if(sec==="p2"){
      var selP2=ans.p2[qi];
      return(<div style={{padding:"20px 16px",minHeight:"100vh"}}>
        {header}
        <div style={{fontSize:12,color:"var(--t2)",marginBottom:16}}>Question {qi+1}/{LP2.length}</div>
        {aState==="ready"&&<div style={{textAlign:"center",marginBottom:16}}>
          <button onClick={playP2} style={{width:70,height:70,borderRadius:"50%",border:"none",background:"linear-gradient(135deg,#1B70CF,#4a9fe0)",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",margin:"0 auto"}}><span style={{fontSize:28}}>{"▶️"}</span></button>
          <p style={{color:"var(--t2)",fontSize:12,marginTop:8}}>Tap to play</p></div>}
        {(aState==="playing"||aState==="done")&&<div>
          {aState==="playing"&&<div style={{textAlign:"center",marginBottom:16}}>
            <p className="out" style={{color:"var(--orange)",fontSize:13,animation:"pulse 1.5s infinite"}}>{"🔊"} Playing{curOpt>=0?" response "+String.fromCharCode(65+curOpt):""}...</p></div>}
          {aState==="done"&&selP2<0&&<p className="out" style={{color:"var(--green)",fontSize:13,textAlign:"center",marginBottom:12}}>Choose your answer</p>}
          <div style={{display:"flex",flexDirection:"column",gap:8}}>
            {["A","B","C"].map(function(lbl,i){var isCur=curOpt===i;var isSel=selP2===i;return(<button key={i} onClick={function(){if(aState==="done"||aState==="playing")pick(i);}} style={{display:"flex",alignItems:"center",gap:10,padding:"14px",borderRadius:12,border:"2px solid "+(isSel?"var(--endless)":isCur?"var(--orange)":"var(--bdr)"),background:isSel?"rgba(27,112,207,.15)":isCur?"rgba(245,158,11,.1)":"var(--bg2)",cursor:"pointer",fontSize:16,fontWeight:800,color:isSel?"var(--endless)":isCur?"var(--orange)":"var(--t1)",fontFamily:"'Cinzel','Outfit',serif",animation:isCur?"pulse 1s infinite":"none"}}>{lbl}</button>);})}
          </div>
        </div>}
      </div>);
    }

    // ── P3 ──
    if(sec==="p3"){
      var conv=LP3[qi];var q3=conv.qs[sqi];var sel3=ans.p3[qi][sqi];
      return(<div style={{padding:"20px 16px",minHeight:"100vh"}}>
        {header}
        {sqi===0&&aState==="ready"&&<div style={{textAlign:"center",marginBottom:16}}>
          <button onClick={playP3} style={{width:70,height:70,borderRadius:"50%",border:"none",background:"linear-gradient(135deg,#1B70CF,#4a9fe0)",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",margin:"0 auto"}}><span style={{fontSize:28}}>{"▶️"}</span></button>
          <p style={{color:"var(--t2)",fontSize:12,marginTop:8}}>Listen to the conversation</p></div>}
        {sqi===0&&aState==="playing"&&<p className="out" style={{color:"var(--orange)",fontSize:13,textAlign:"center",marginBottom:12,animation:"pulse 1.5s infinite"}}>{"🔊"} Playing conversation...</p>}
        {(aState==="done"||sqi>0)&&<div>
          <h3 className="out" style={{fontWeight:700,fontSize:15,lineHeight:1.5,marginBottom:16}}>Q{sqi+1}. {q3.q}</h3>
          {q3.graphic&&<ListeningGraphic g={q3.graphic}/>}
          <div style={{display:"flex",flexDirection:"column",gap:8}}>
            {q3.opts.map(function(opt,i){var isSel=sel3===i;return(<button key={i} onClick={function(){pick(i);}} style={{display:"flex",alignItems:"center",gap:10,padding:"12px 14px",background:isSel?"rgba(27,112,207,.15)":"var(--bg2)",border:"1px solid "+(isSel?"var(--endless)":"var(--bdr)"),borderRadius:12,cursor:"pointer",fontSize:13,color:"var(--t1)",textAlign:"left",fontFamily:"'DM Sans',sans-serif"}}>
              <div style={{width:26,height:26,borderRadius:"50%",border:"2px solid "+(isSel?"var(--endless)":"var(--t3)"),display:"flex",alignItems:"center",justifyContent:"center",fontSize:11,fontWeight:700,flexShrink:0,background:isSel?"var(--endless)":"transparent",color:isSel?"#fff":"var(--t3)"}}>{String.fromCharCode(65+i)}</div>
              <span>{opt}</span></button>);})}
          </div>
        </div>}
      </div>);
    }

    // ── P4 ──
    if(sec==="p4"){
      var talk=LP4[qi];var q4=talk.qs[sqi];var sel4=ans.p4[qi][sqi];
      return(<div style={{padding:"20px 16px",minHeight:"100vh"}}>
        {header}
        {sqi===0&&aState==="ready"&&<div style={{textAlign:"center",marginBottom:16}}>
          <button onClick={playP4} style={{width:70,height:70,borderRadius:"50%",border:"none",background:"linear-gradient(135deg,#1B70CF,#4a9fe0)",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",margin:"0 auto"}}><span style={{fontSize:28}}>{"▶️"}</span></button>
          <p style={{color:"var(--t2)",fontSize:12,marginTop:8}}>Listen to the {talk.type||"talk"}</p></div>}
        {sqi===0&&aState==="playing"&&<p className="out" style={{color:"var(--orange)",fontSize:13,textAlign:"center",marginBottom:12,animation:"pulse 1.5s infinite"}}>{"🔊"} Playing...</p>}
        {(aState==="done"||sqi>0)&&<div>
          <h3 className="out" style={{fontWeight:700,fontSize:15,lineHeight:1.5,marginBottom:16}}>Q{sqi+1}. {q4.q}</h3>
          {q4.graphic&&<ListeningGraphic g={q4.graphic}/>}
          <div style={{display:"flex",flexDirection:"column",gap:8}}>
            {q4.opts.map(function(opt,i){var isSel=sel4===i;return(<button key={i} onClick={function(){pick(i);}} style={{display:"flex",alignItems:"center",gap:10,padding:"12px 14px",background:isSel?"rgba(27,112,207,.15)":"var(--bg2)",border:"1px solid "+(isSel?"var(--endless)":"var(--bdr)"),borderRadius:12,cursor:"pointer",fontSize:13,color:"var(--t1)",textAlign:"left",fontFamily:"'DM Sans',sans-serif"}}>
              <div style={{width:26,height:26,borderRadius:"50%",border:"2px solid "+(isSel?"var(--endless)":"var(--t3)"),display:"flex",alignItems:"center",justifyContent:"center",fontSize:11,fontWeight:700,flexShrink:0,background:isSel?"var(--endless)":"transparent",color:isSel?"#fff":"var(--t3)"}}>{String.fromCharCode(65+i)}</div>
              <span>{opt}</span></button>);})}
          </div>
        </div>}
      </div>);
    }

    // ── P5 ──
    if(sec==="p5"){
      var q5=RP5[qi];var sel5=ans.p5[qi];
      return(<div style={{padding:"20px 16px",minHeight:"100vh"}}>
        {header}
        <h3 className="out" style={{fontWeight:700,fontSize:15,lineHeight:1.5,marginBottom:20}}>{q5.s}</h3>
        <div style={{display:"flex",flexDirection:"column",gap:8}}>
          {q5.o.map(function(opt,i){var isSel=sel5===i;return(<button key={i} onClick={function(){pick(i);}} style={{display:"flex",alignItems:"center",gap:10,padding:"12px 14px",background:isSel?"rgba(27,112,207,.15)":"var(--bg2)",border:"1px solid "+(isSel?"var(--endless)":"var(--bdr)"),borderRadius:12,cursor:"pointer",fontSize:13,color:"var(--t1)",textAlign:"left",fontFamily:"'DM Sans',sans-serif"}}>
            <div style={{width:26,height:26,borderRadius:"50%",border:"2px solid "+(isSel?"var(--endless)":"var(--t3)"),display:"flex",alignItems:"center",justifyContent:"center",fontSize:11,fontWeight:700,flexShrink:0,background:isSel?"var(--endless)":"transparent",color:isSel?"#fff":"var(--t3)"}}>{String.fromCharCode(65+i)}</div>
            <span>{opt}</span></button>);})}
        </div>
      </div>);
    }

    // ── P6 ──
    if(sec==="p6"){
      var t6=RP6[qi];var blanks6=[];var blankNum=0;
      t6.parts.forEach(function(pt){if(pt.blank){blanks6.push(pt);blankNum++;}});
      var bl6=blanks6[sqi];var sel6=ans.p6[qi][sqi];
      var renderedText=[];
      t6.parts.forEach(function(pt,pi){
        if(pt.blank){var bIdx=0;for(var bb=0;bb<pi;bb++)if(t6.parts[bb].blank)bIdx++;renderedText.push(<span key={pi} style={{background:bIdx===sqi?"rgba(27,112,207,.25)":"rgba(27,112,207,.1)",padding:"2px 8px",borderRadius:4,fontWeight:bIdx===sqi?700:400,color:bIdx===sqi?"var(--endless)":"var(--t2)"}}>{"[___]"}</span>);}
        else renderedText.push(<span key={pi}>{pt.text}</span>);
      });
      return(<div style={{padding:"20px 16px",minHeight:"100vh"}}>
        {header}
        <div style={{fontSize:11,color:"var(--t3)",marginBottom:8}}>{t6.type} — Blank {sqi+1}/{blankNum}</div>
        <div className="crd read-scroll" style={{padding:14,marginBottom:16,maxHeight:200,overflowY:"auto",lineHeight:1.7,fontSize:12,whiteSpace:"pre-wrap"}}>{renderedText}</div>
        <div style={{display:"flex",flexDirection:"column",gap:8}}>
          {bl6.options.map(function(opt,i){var isSel=sel6===i;return(<button key={i} onClick={function(){pick(i);}} style={{display:"flex",alignItems:"center",gap:10,padding:"12px 14px",background:isSel?"rgba(27,112,207,.15)":"var(--bg2)",border:"1px solid "+(isSel?"var(--endless)":"var(--bdr)"),borderRadius:12,cursor:"pointer",fontSize:13,color:"var(--t1)",textAlign:"left",fontFamily:"'DM Sans',sans-serif"}}>
            <div style={{width:26,height:26,borderRadius:"50%",border:"2px solid "+(isSel?"var(--endless)":"var(--t3)"),display:"flex",alignItems:"center",justifyContent:"center",fontSize:11,fontWeight:700,flexShrink:0,background:isSel?"var(--endless)":"transparent",color:isSel?"#fff":"var(--t3)"}}>{String.fromCharCode(65+i)}</div>
            <span>{opt}</span></button>);})}
        </div>
      </div>);
    }

    // ── P7 ──
    if(sec==="p7"){
      var ps7=RP7[qi];var pq7=ps7.questions[sqi];var sel7=ans.p7[qi][sqi];
      return(<div style={{padding:"20px 16px",minHeight:"100vh"}}>
        {header}
        <div style={{display:"flex",justifyContent:"space-between",marginBottom:8}}>
          <span style={{fontSize:11,color:"var(--t3)"}}>{ps7.type}</span>
          <span style={{fontSize:11,color:"var(--endless)"}}>Q {sqi+1}/{ps7.questions.length}</span>
        </div>
        <div className="crd read-scroll" style={{padding:14,marginBottom:16,maxHeight:200,overflowY:"auto",lineHeight:1.7,fontSize:12,whiteSpace:"pre-wrap"}}>{ps7.text}</div>
        <h3 className="out" style={{fontWeight:700,fontSize:15,lineHeight:1.5,marginBottom:16}}>{pq7.q}</h3>
        <div style={{display:"flex",flexDirection:"column",gap:8}}>
          {pq7.options.map(function(opt,i){var isSel=sel7===i;return(<button key={i} onClick={function(){pick(i);}} style={{display:"flex",alignItems:"center",gap:10,padding:"12px 14px",background:isSel?"rgba(27,112,207,.15)":"var(--bg2)",border:"1px solid "+(isSel?"var(--endless)":"var(--bdr)"),borderRadius:12,cursor:"pointer",fontSize:13,color:"var(--t1)",textAlign:"left",fontFamily:"'DM Sans',sans-serif"}}>
            <div style={{width:26,height:26,borderRadius:"50%",border:"2px solid "+(isSel?"var(--endless)":"var(--t3)"),display:"flex",alignItems:"center",justifyContent:"center",fontSize:11,fontWeight:700,flexShrink:0,background:isSel?"var(--endless)":"transparent",color:isSel?"#fff":"var(--t3)"}}>{String.fromCharCode(65+i)}</div>
            <span>{opt}</span></button>);})}
        </div>
      </div>);
    }
  }

  // ═══ RESULTS ═══
  if(phase==="done"&&result&&doneInfo){
    // Valeurs figées au submit (voir GARDE dans doSubmit) — ne PAS recalculer
    // depuis p.u ici : il a déjà été mis à jour par la persistance.
    var prevBest=doneInfo.prevBest;var attempts=doneInfo.attempts;var isNewPB=doneInfo.isNewPB;
    var baseXp=doneInfo.baseXp;var pbBonus=doneInfo.pbBonus;var totalXp=doneInfo.totalXp;

    // Part labels & icons for weakest recommendation
    var PART_MAP={1:{label:"Part 1 \xb7 Photos",icon:"\ud83d\uddbc\ufe0f",nav:"lisP1"},2:{label:"Part 2 \xb7 Q&R",icon:"\ud83c\udfa7",nav:"lisP2"},3:{label:"Part 3 \xb7 Conversations",icon:"\ud83d\udcac",nav:"lisP3"},4:{label:"Part 4 \xb7 Talks",icon:"\ud83d\udce2",nav:"lisP4"},5:{label:"Part 5 \xb7 Grammar",icon:"\ud83d\udcdd",nav:"drill"},6:{label:"Part 6 \xb7 Text completion",icon:"\ud83d\udcc4",nav:"p6"},7:{label:"Part 7 \xb7 Reading",icon:"\ud83d\udcd6",nav:"p7"}};
    var wp=PART_MAP[result.weakestPart]||PART_MAP[5];
    var wAcc=Math.round(result.weakestAccuracy*100);

    // History for progression chart (figé au submit)
    var history=doneInfo.history;

    return(<div className="enter" style={{padding:"20px 16px 100px",minHeight:"100vh"}}>
      {/* Breadcrumb */}
      {/* Résultat déjà persisté au submit (GARDE doSubmit) — les boutons ne font que naviguer. */}
      <div style={{fontSize:13,color:tone("#8a7e6a"),marginBottom:14,cursor:"pointer"}} onClick={p.back}>{"← ⏳ Endless Arena"}</div>

      {/* PB Banner or First Run */}
      {attempts===1?(<div style={{background:"linear-gradient(135deg,#3a2810 0%,#0a1e35 50%,#3a2810 100%)",border:"1.5px solid #f0c850",borderRadius:12,padding:"11px 14px",marginBottom:14,textAlign:"center"}}>
        <div style={{fontFamily:"'Cinzel','Outfit',serif",fontWeight:900,fontSize:13,color:/*fond local*/"#f0c850",letterSpacing:2}}>{"⭐"} FIRST RUN COMPLETE {"⭐"}</div>
        <div style={{fontSize:11,color:/*fond local*/"#7fb8e8",marginTop:3}}>Welcome to the Endless Arena</div>
      </div>)
      :isNewPB?(<div style={{background:"linear-gradient(135deg,#3a2810 0%,#0a1e35 50%,#3a2810 100%)",border:"1.5px solid #f0c850",borderRadius:12,padding:"11px 14px",marginBottom:14,textAlign:"center"}}>
        <div style={{fontFamily:"'Cinzel','Outfit',serif",fontWeight:900,fontSize:13,color:/*fond local*/"#f0c850",letterSpacing:2}}>{"⭐"} NEW PERSONAL BEST {"⭐"}</div>
        <div style={{fontSize:11,color:/*fond local*/"#7fb8e8",marginTop:3}}>+{result.toeicEstimate-prevBest} vs previous best</div>
      </div>)
      :null}

      {/* Score Hero Card */}
      <div style={{background:"linear-gradient(135deg,#1a1610,#0f1a2a)",border:"1px solid rgba(27,112,207,0.25)",borderRadius:16,padding:"22px 16px 18px",textAlign:"center",position:"relative",overflow:"hidden",marginBottom:14}}>
        <div style={{position:"absolute",top:-4,right:10,fontSize:46,opacity:.06}}>{"⏳"}</div>
        <div style={{fontFamily:"'Cinzel','Outfit',serif",fontSize:11,color:/*fond local*/"#8a7e6a",letterSpacing:2,marginBottom:6}}>RUN #{attempts} {"·"} COMPLETE</div>
        <div style={{position:"relative"}}>
          <span className="out" style={{fontWeight:900,fontSize:56,lineHeight:1,background:"linear-gradient(180deg,#f0c850,#d4943a)",WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent"}}>{result.toeicEstimate}</span>
          <span style={{fontFamily:"'Cinzel','Outfit',serif",fontSize:16,color:/*fond local*/"#8a7e6a",marginLeft:4}}>/ 990</span>
        </div>
        <div style={{display:"flex",gap:8,marginTop:16}}>
          <div style={{flex:1,background:"rgba(180,140,80,.08)",borderRadius:10,padding:"10px 8px",textAlign:"center"}}>
            <div style={{fontSize:11,color:/*fond local*/"#8a7e6a",letterSpacing:.5}}>LISTENING</div>
            <div style={{fontFamily:"'Cinzel','Outfit',serif",fontWeight:800,fontSize:18,color:/*fond local*/"#ede4d4"}}>{result.listening.toeic}<span style={{fontSize:11,color:"#5a5040"}}> / 495</span></div>
          </div>
          <div style={{flex:1,background:"rgba(180,140,80,.08)",borderRadius:10,padding:"10px 8px",textAlign:"center"}}>
            <div style={{fontSize:11,color:/*fond local*/"#8a7e6a",letterSpacing:.5}}>READING</div>
            <div style={{fontFamily:"'Cinzel','Outfit',serif",fontWeight:800,fontSize:18,color:/*fond local*/"#ede4d4"}}>{result.reading.toeic}<span style={{fontSize:11,color:"#5a5040"}}> / 495</span></div>
          </div>
        </div>
      </div>

      {/* XP Earned */}
      <div style={{background:"var(--bg2)",border:"1px solid rgba(180,140,80,.12)",borderRadius:12,padding:"12px 16px",marginBottom:14,display:"flex",justifyContent:"space-between",alignItems:"center"}}>
        <div>
          <div style={{fontSize:11,color:tone("#8a7e6a")}}>XP EARNED</div>
          <div style={{fontSize:11,color:"#5a5040"}}>{pbBonus>0?"base "+baseXp+" + PB bonus "+pbBonus:"base "+baseXp}</div>
        </div>
        <div style={{fontFamily:"'Cinzel','Outfit',serif",fontWeight:900,fontSize:22,color:tone("#f0c850")}}>+{totalXp}</div>
      </div>

      {/* Progression History */}
      <div style={{background:"var(--bg2)",border:"1px solid rgba(180,140,80,.12)",borderRadius:12,padding:"14px 16px",marginBottom:14}}>
        {history.length<=1?(<div>
          <div style={{fontFamily:"'Cinzel','Outfit',serif",fontSize:11,color:tone("#8a7e6a"),letterSpacing:2,marginBottom:8}}>PROGRESSION</div>
          <div style={{fontSize:12,color:tone("#7fb8e8"),fontStyle:"italic"}}>Your first Endless run {"·"} come back tomorrow to see your progress</div>
        </div>):(<div>
          <div style={{fontFamily:"'Cinzel','Outfit',serif",fontSize:11,color:tone("#8a7e6a"),letterSpacing:2,marginBottom:12}}>PROGRESSION {"·"} LAST {history.length} RUNS</div>
          {history.map(function(run,ri){
            var isLast=ri===history.length-1;
            var barW=Math.max(5,Math.min(100,((run.toeicEstimate-500)/(990-500))*100));
            var barCol=isLast?"linear-gradient(90deg,#0a3a6e,#1B70CF)":run.toeicEstimate>=750?"#a07028":run.toeicEstimate>=700?"#8b6020":"#5a4225";
            return(<div key={ri} style={{display:"flex",gap:10,alignItems:"center",marginBottom:4}}>
              <span style={{fontFamily:"'Cinzel','Outfit',serif",fontSize:11,width:38,color:isLast?tone("#7fb8e8"):"#5a5040",fontWeight:isLast?700:400}}>Run {ri+1}</span>
              <div style={{flex:1,height:8,borderRadius:99,background:isLast?"rgba(27,112,207,.15)":"rgba(180,140,80,.08)"}}>
                <div style={{width:barW+"%",height:"100%",borderRadius:99,background:barCol}}/>
              </div>
              <span style={{width:32,textAlign:"right",fontSize:11,fontWeight:isLast?700:600,color:isLast?tone("#7fb8e8"):tone("#8a7e6a")}}>{run.toeicEstimate}</span>
            </div>);
          })}
        </div>)}
      </div>

      {/* Weakest Recommendation */}
      <div style={{background:"linear-gradient(135deg,#0a1828,#0f2038)",border:"1.5px solid rgba(27,112,207,.35)",borderRadius:12,padding:"14px 16px",marginBottom:16}}>
        <div style={{fontFamily:"'Cinzel','Outfit',serif",fontSize:11,color:/*fond local*/"#4a9fe0",letterSpacing:2,marginBottom:10}}>WEAKEST THIS RUN</div>
        <div style={{display:"flex",gap:12,alignItems:"center"}}>
          <div style={{width:42,height:42,borderRadius:12,background:"rgba(27,112,207,.2)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:22}}>{wp.icon}</div>
          <div>
            <div style={{fontFamily:"'Cinzel','Outfit',serif",fontWeight:700,fontSize:14,color:/*fond local*/"#ede4d4"}}>{wp.label}</div>
            <div style={{fontSize:11,color:/*fond local*/"#e05252",fontWeight:600}}>{wAcc}% accuracy — train this next</div>
          </div>
        </div>
      </div>

      {/* Primary Button — Train weakest */}
      <button onClick={function(){p.nav(wp.nav);}}
        style={{width:"100%",padding:14,background:"linear-gradient(135deg,#d4943a,#8b6020)",border:"none",borderRadius:12,fontFamily:"'Cinzel','Outfit',serif",fontWeight:800,fontSize:13,color:"#0f0c08",letterSpacing:1,cursor:"pointer",marginBottom:10}}>
        {wp.icon} TRAIN PART {result.weakestPart} NOW {"→"}
      </button>

      {/* Secondary Button */}
      <button onClick={p.back}
        style={{width:"100%",padding:12,background:"transparent",border:"1px solid rgba(180,140,80,.25)",borderRadius:12,fontFamily:"'DM Sans',sans-serif",fontWeight:600,fontSize:13,color:tone("#8a7e6a"),cursor:"pointer",marginBottom:16}}>
        Back to the training grounds
      </button>

      {/* Cooldown hint */}
      <div style={{textAlign:"center",fontSize:11,color:"#5a5040",marginBottom:16}}>{"⏳"} Next Endless run available in 24h</div>
    </div>);
  }

  return null;
}
