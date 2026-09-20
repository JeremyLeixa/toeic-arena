// Extrait de src/App.jsx le 2026-09-15 (refactor split-app, REFACTOR_PLAN.md). Code déplacé tel quel.
import { Bar } from "../../components/Bar.jsx";
import { ResultIcon } from "../../components/icons.jsx";
import { ListeningGraphic } from "../../components/ListeningGraphic.jsx";
import { SessionTop } from "../../components/SessionHud.jsx";
import { BOSS_P1, BOSS_P3, BOSS_P4, BOSS_P5, BOSS_P6, BOSS_P7 } from "../../data/bossTestFull.js";
import { resumeAudioSession, stopListenAudio, playAudioFile, playLetteredOption } from "../../lib/audio.js";
import { BOSS_P2_SHUF, seedFromId } from "../../lib/listeningShuffle.js";
import { shufQs, shufP5, shufP6, shufP7 } from "../../lib/optionShuffle.js";
import { estimateToeic } from "../../lib/toeic.js";
import { today } from "../../lib/util.js";
import { stopBGM } from "../../sounds.js";
import { useMemo, useState, useEffect, useRef } from "react";

// Options des Parts 3 à 7 permutées de façon FIGÉE par item (lib/optionShuffle.js, graine = identifiant),
// comme la Part 2 : la reprise d'une session relit des réponses rangées par index, un tirage par ouverture
// les désalignerait. Les Parts 3 et 4 ne mettaient jamais la bonne réponse en A. La Part 1 reste dans
// l'ordre de ses clips (réponses déjà réparties, 2/2/2/0 sur 6).
var BOSS_P3_SHUF=BOSS_P3.map(function(c){return shufQs(c,seedFromId);}),BOSS_P4_SHUF=BOSS_P4.map(function(c){return shufQs(c,seedFromId);});
var BOSS_P5_SHUF=BOSS_P5.map(function(q){return shufP5(q,seedFromId);}),BOSS_P6_SHUF=BOSS_P6.map(function(t){return shufP6(t,seedFromId);}),BOSS_P7_SHUF=BOSS_P7.map(function(ps){return shufP7(ps,seedFromId);});

// ─── BOSS TEST — The Final Arena (Full TOEIC 200Q) ───
export function BossTest(p){
  var LP1=BOSS_P1,LP2=BOSS_P2_SHUF,LP3=BOSS_P3_SHUF,LP4=BOSS_P4_SHUF;
  var RP5=BOSS_P5_SHUF,RP6=BOSS_P6_SHUF,RP7=BOSS_P7_SHUF;
  var p3QC=0;LP3.forEach(function(c){p3QC+=c.qs.length;});
  var p4QC=0;LP4.forEach(function(t){p4QC+=t.qs.length;});
  var lisQ=LP1.length+LP2.length+p3QC+p4QC;
  var p6BC=0;RP6.forEach(function(t){t.parts.forEach(function(pt){if(pt.blank)p6BC++;});});
  var p7QC=0;RP7.forEach(function(ps){p7QC+=ps.questions.length;});
  var readQ=RP5.length+p6BC+p7QC;
  var totalQ=lisQ+readQ;
  var TOTAL_TIME=120*60;
  var BOSS_STORAGE_KEY="bossTestSession";
  // 3 depuis le 2026-09-18 (Parts 3 à 7 permutées) : une session sauvegardée avec l'ancienne disposition
  // est écartée plutôt que relue de travers.
  var BOSS_LAYOUT_V=3; // bumper des que la disposition des options du Boss change

  // ── Restore saved session if any ──
  var saved=useMemo(function(){try{var raw=localStorage.getItem(BOSS_STORAGE_KEY);if(!raw)return null;var d=JSON.parse(raw);if(d.date!==today())return null;if(d.lay!==BOSS_LAYOUT_V)return null;if(!d.ans||!d.sec||d.timeLeft==null)return null;return d;}catch(e){console.warn("[BOSS] session restore caught:",e&&e.message);return null;}},[]);

  var freshAns=function(){return{
    p1:LP1.map(function(){return -1;}),p2:LP2.map(function(){return -1;}),
    p3:LP3.map(function(c){return c.qs.map(function(){return -1;});}),
    p4:LP4.map(function(t){return t.qs.map(function(){return -1;});}),
    p5:RP5.map(function(){return -1;}),
    p6:RP6.map(function(t){var n=0;t.parts.forEach(function(pt){if(pt.blank)n++;});return Array(n).fill(-1);}),
    p7:RP7.map(function(ps){return ps.questions.map(function(){return -1;});})
  };};

  var[phase,setPhase]=useState(saved?"resume":"intro");
  var[sec,setSec]=useState(saved?saved.sec:"p1");
  var[qi,setQi]=useState(saved?saved.qi:0);
  var[sqi,setSqi]=useState(saved?saved.sqi:0);
  var[ans,setAns]=useState(function(){return saved?saved.ans:freshAns();});
  var[timeLeft,setTimeLeft]=useState(saved?saved.timeLeft:TOTAL_TIME);

  function saveBossSession(a,s,q,sq,tl){try{localStorage.setItem(BOSS_STORAGE_KEY,JSON.stringify({date:today(),lay:BOSS_LAYOUT_V,ans:a,sec:s,qi:q,sqi:sq,timeLeft:tl}));}catch(e){console.warn("[BOSS] session save caught:",e&&e.message);}}
  function clearBossSession(){try{localStorage.removeItem(BOSS_STORAGE_KEY);}catch(e){}}
  var[result,setResult]=useState(null);
  var[aState,setAState]=useState("ready");
  var[curOpt,setCurOpt]=useState(-1);
  var[revMode,setRevMode]=useState(false);
  var[revSec,setRevSec]=useState("p1");
  var[revIdx,setRevIdx]=useState(0);
  useEffect(function(){resumeAudioSession();return stopListenAudio;},[]);
  useEffect(function(){if(revMode)window.scrollTo(0,0);},[revMode,revSec,revIdx]);
  var timerRef=useRef(null);

  useEffect(function(){
    if(phase!=="test"||result)return;
    if(timeLeft<=0){doSubmit();return;}
    timerRef.current=setTimeout(function(){setTimeLeft(timeLeft-1);},1000);
    return function(){clearTimeout(timerRef.current);};
  });

  // ── Auto-save session every 5 seconds + on page unload ──
  var bossStateRef=useRef({ans:ans,sec:sec,qi:qi,sqi:sqi,timeLeft:timeLeft,phase:phase});
  bossStateRef.current={ans:ans,sec:sec,qi:qi,sqi:sqi,timeLeft:timeLeft,phase:phase};
  useEffect(function(){
    if(phase!=="test"||result)return;
    var id=setTimeout(function(){saveBossSession(ans,sec,qi,sqi,timeLeft);},5000);
    return function(){clearTimeout(id);};
  });
  useEffect(function(){
    function onUnload(){var s=bossStateRef.current;if(s.phase==="test")saveBossSession(s.ans,s.sec,s.qi,s.sqi,s.timeLeft);}
    window.addEventListener("beforeunload",onUnload);
    // Sauvegarde AU DÉMONTAGE aussi : quitter par la barre (ou par la tab bar) coupait la
    // sauvegarde périodique de 5 s, donc la dernière poignée de réponses était perdue. La feuille
    // « Leave » promet une reprise : elle doit être vraie.
    return function(){window.removeEventListener("beforeunload",onUnload);onUnload();};
  },[]);

  function fmtT(s){var m=Math.floor(s/60);var sc2=s%60;return m+":"+(sc2<10?"0":"")+sc2;}
  function pad(n){return String(n).padStart(2,"0");}

  // ── Audio ──
  // Les lettres sont annoncees a part (playLetteredOption, voix Sarah pour le Boss) : les
  // clips du Boss n'en ont jamais eu, et l'eleve en aveugle doit savoir ou il en est.
  async function playP1(){if(aState!=="ready")return;setAState("playing");for(var i=0;i<LP1[qi].opts.length;i++){setCurOpt(i);await playLetteredOption("p1",LP1[qi].id,i,"/audio/boss/p1_"+pad(qi+1)+"_"+i+".mp3");await new Promise(function(r){setTimeout(r,400);});}setCurOpt(-1);setAState("done");}
  async function playP2(){if(aState!=="ready")return;setAState("playing");var id=pad(qi+1);var au=LP2[qi]&&LP2[qi].aud;await playAudioFile("/audio/boss/p2_"+id+"_q.mp3");await new Promise(function(r){setTimeout(r,400);});for(var i=0;i<3;i++){setCurOpt(i);await playLetteredOption("p2",LP2[qi].id,i,"/audio/boss/p2_"+id+"_"+(au?au[i]:i)+".mp3");await new Promise(function(r){setTimeout(r,300);});}setCurOpt(-1);setAState("done");}
  async function playP3(){if(aState!=="ready")return;setAState("playing");await playAudioFile("/audio/boss/p3_"+pad(qi+1)+".mp3");setAState("done");}
  async function playP4(){if(aState!=="ready")return;setAState("playing");await playAudioFile("/audio/boss/p4_"+pad(qi+1)+".mp3");setAState("done");}

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
    else if(sec==="p3"){if(sqi<LP3[qi].qs.length-1)setSqi(sqi+1);else if(qi<LP3.length-1){setQi(qi+1);setSqi(0);setAState("ready");}else{setSec("p4");setQi(0);setSqi(0);setAState("ready");}}
    else if(sec==="p4"){if(sqi<LP4[qi].qs.length-1)setSqi(sqi+1);else if(qi<LP4.length-1){setQi(qi+1);setSqi(0);setAState("ready");}else{setSec("p5");setQi(0);setSqi(0);}}
    else if(sec==="p5"){if(qi<RP5.length-1)setQi(qi+1);else{setSec("p6");setQi(0);setSqi(0);}}
    else if(sec==="p6"){var bN=ans.p6[qi].length;if(sqi<bN-1)setSqi(sqi+1);else if(qi<RP6.length-1){setQi(qi+1);setSqi(0);}else{setSec("p7");setQi(0);setSqi(0);}}
    else if(sec==="p7"){if(sqi<RP7[qi].questions.length-1)setSqi(sqi+1);else if(qi<RP7.length-1){setQi(qi+1);setSqi(0);}else doSubmit();}
  }

  // ── Scoring ──
  function doSubmit(){
    clearTimeout(timerRef.current);clearBossSession();
    var p1s=0;LP1.forEach(function(q,i){if(ans.p1[i]===q.c)p1s++;});
    var p2s=0;LP2.forEach(function(q,i){if(ans.p2[i]===q.c)p2s++;});
    var p3s=0;LP3.forEach(function(c,i){c.qs.forEach(function(q,j){if(ans.p3[i][j]===q.c)p3s++;});});
    var p4s=0;LP4.forEach(function(t,i){t.qs.forEach(function(q,j){if(ans.p4[i][j]===q.c)p4s++;});});
    var lRaw=p1s+p2s+p3s+p4s;var lT=estimateToeic(lRaw,lisQ);
    var p5s=0;RP5.forEach(function(q,i){if(ans.p5[i]===q.c)p5s++;});
    var p6s=0;RP6.forEach(function(t,ti){var bi=0;t.parts.forEach(function(pt){if(pt.blank){if(ans.p6[ti][bi]===pt.correct)p6s++;bi++;}});});
    var p7s=0;RP7.forEach(function(ps,pi){ps.questions.forEach(function(q,qi2){if(ans.p7[pi][qi2]===q.correct)p7s++;});});
    var rRaw=p5s+p6s+p7s;var rT=estimateToeic(rRaw,readQ);
    var res={date:today(),mockId:"boss",score:lRaw+rRaw,total:totalQ,
      listening:{score:lRaw,total:lisQ,toeic:lT,p1:{score:p1s,total:LP1.length},p2:{score:p2s,total:LP2.length},p3:{score:p3s,total:p3QC},p4:{score:p4s,total:p4QC}},
      reading:{score:rRaw,total:readQ,toeic:rT,p5:{score:p5s,total:RP5.length},p6:{score:p6s,total:p6BC},p7:{score:p7s,total:p7QC}},
      toeicEstimate:lT+rT,timeUsed:TOTAL_TIME-timeLeft};
    setResult(res);setPhase("done");
    // GARDE : persister IMMÉDIATEMENT le résultat, pas au clic "Save & Exit".
    // Même bug que MockTest (Yannou 2026-05-17) : réviser puis fermer l'app
    // perdait le run entier (2h) — la session de reprise est déjà effacée par
    // clearBossSession() ci-dessus. bossDone ne navigue plus (l'écran de
    // résultats reste affiché) ; le bouton Exit ne fait que naviguer.
    var resXp=Math.round(res.toeicEstimate*1.5)+(res.toeicEstimate>=800?200:res.toeicEstimate>=600?100:0);
    try{p.done(res,resXp);}catch(e){console.warn("[BossTest] persist failed:",e&&e.message);}
  }

  // ── Progress ──
  var answered=0;
  ans.p1.forEach(function(a){if(a>=0)answered++;});ans.p2.forEach(function(a){if(a>=0)answered++;});
  ans.p3.forEach(function(c){c.forEach(function(a){if(a>=0)answered++;});});ans.p4.forEach(function(t){t.forEach(function(a){if(a>=0)answered++;});});
  ans.p5.forEach(function(a){if(a>=0)answered++;});ans.p6.forEach(function(t){t.forEach(function(a){if(a>=0)answered++;});});
  ans.p7.forEach(function(ps){ps.forEach(function(a){if(a>=0)answered++;});});

  // ── Section labels ──
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
      <div style={{marginBottom:12,display:"flex",justifyContent:"center"}}><ResultIcon e={"🛡️"} size={56}/></div>
      <h1 className="out" style={{fontWeight:900,fontSize:24,marginBottom:8}}>Session in progress</h1>
      <p style={{color:"var(--t2)",fontSize:14,marginBottom:24}}>You have an unfinished Final Arena attempt from today.</p>
      <div className="crd" style={{padding:16,marginBottom:24,textAlign:"left"}}>
        <div style={{display:"flex",justifyContent:"space-between",marginBottom:8}}><span style={{color:"var(--t2)",fontSize:13}}>Progress</span><span className="out" style={{fontWeight:700,color:"var(--cyan)",fontSize:14}}>{rAnswered}/{totalQ} answered</span></div>
        <Bar value={rAnswered} max={totalQ} h={6} color="linear-gradient(90deg,#f59e0b,#ef4444)"/>
        <div style={{display:"flex",justifyContent:"space-between",marginTop:10}}><span style={{color:"var(--t2)",fontSize:13}}>Time remaining</span><span className="out" style={{fontWeight:700,color:saved.timeLeft>600?"var(--cyan)":"var(--orange)",fontSize:14}}>{fmtT(saved.timeLeft)}</span></div>
        <div style={{display:"flex",justifyContent:"space-between",marginTop:6}}><span style={{color:"var(--t2)",fontSize:13}}>Current section</span><span className="out" style={{fontWeight:600,fontSize:13}}>{saved.sec==="p1"?"Part 1":saved.sec==="p2"?"Part 2":saved.sec==="p3"?"Part 3":saved.sec==="p4"?"Part 4":saved.sec==="p5"?"Part 5":saved.sec==="p6"?"Part 6":"Part 7"}</span></div>
      </div>
      <button className="btn1" style={{background:"linear-gradient(135deg,#22c55e,#06b6d4)",fontSize:16,padding:"14px 28px",marginBottom:12}} onClick={function(){stopBGM();setPhase("test");}}>Resume session</button>
      <button className="btn2" style={{marginBottom:8}} onClick={function(){clearBossSession();setAns(freshAns());setSec("p1");setQi(0);setSqi(0);setTimeLeft(TOTAL_TIME);setPhase("intro");}}>Start over</button>
      <button className="btn2" onClick={p.back}>Back</button>
    </div>);
  }

  // ═══ INTRO ═══
  if(phase==="intro"){
    return(<div className="enter" style={{padding:"20px 16px",minHeight:"100vh",display:"flex",flexDirection:"column",justifyContent:"center",textAlign:"center"}}>
      <div style={{fontSize:64,marginBottom:12,animation:"pulse 2s infinite"}}>🐉</div>
      <h1 className="out" style={{fontWeight:900,fontSize:28,background:"linear-gradient(135deg,#dc2626,#f59e0b)",WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent",marginBottom:4}}>THE FINAL ARENA</h1>
      <p style={{color:"var(--t2)",fontSize:14,marginBottom:20}}>Full TOEIC Simulation</p>
      <div className="crd" style={{textAlign:"left",padding:16,marginBottom:16}}>
        <div style={{fontSize:11,color:"var(--orange)",fontWeight:700,textTransform:"uppercase",letterSpacing:1,marginBottom:8}}>🔊 Listening Section</div>
        <div style={{fontSize:13,color:"var(--t1)",lineHeight:1.8}}>
          <div style={{display:"flex",justifyContent:"space-between"}}><span>Part 1 — Photographs</span><span className="out" style={{color:"var(--cyan)"}}>{LP1.length} Q</span></div>
          <div style={{display:"flex",justifyContent:"space-between"}}><span>Part 2 — Question-Response</span><span className="out" style={{color:"var(--cyan)"}}>{LP2.length} Q</span></div>
          <div style={{display:"flex",justifyContent:"space-between"}}><span>Part 3 — Conversations</span><span className="out" style={{color:"var(--cyan)"}}>{p3QC} Q</span></div>
          <div style={{display:"flex",justifyContent:"space-between"}}><span>Part 4 — Talks</span><span className="out" style={{color:"var(--cyan)"}}>{p4QC} Q</span></div>
          <div style={{borderTop:"1px solid var(--bdr)",marginTop:6,paddingTop:6,display:"flex",justifyContent:"space-between",fontWeight:700}}><span>Subtotal</span><span style={{color:"var(--gold)"}}>{lisQ} Q</span></div>
        </div>
      </div>
      <div className="crd" style={{textAlign:"left",padding:16,marginBottom:16}}>
        <div style={{fontSize:11,color:"var(--green)",fontWeight:700,textTransform:"uppercase",letterSpacing:1,marginBottom:8}}>📖 Reading Section</div>
        <div style={{fontSize:13,color:"var(--t1)",lineHeight:1.8}}>
          <div style={{display:"flex",justifyContent:"space-between"}}><span>Part 5 — Incomplete Sentences</span><span className="out" style={{color:"var(--cyan)"}}>{RP5.length} Q</span></div>
          <div style={{display:"flex",justifyContent:"space-between"}}><span>Part 6 — Text Completion</span><span className="out" style={{color:"var(--cyan)"}}>{p6BC} Q</span></div>
          <div style={{display:"flex",justifyContent:"space-between"}}><span>Part 7 — Reading Comprehension</span><span className="out" style={{color:"var(--cyan)"}}>{p7QC} Q</span></div>
          <div style={{borderTop:"1px solid var(--bdr)",marginTop:6,paddingTop:6,display:"flex",justifyContent:"space-between",fontWeight:700}}><span>Subtotal</span><span style={{color:"var(--gold)"}}>{readQ} Q</span></div>
        </div>
      </div>
      <div className="crd glo" style={{padding:14,marginBottom:20}}>
        <div style={{display:"flex",justifyContent:"space-between",fontWeight:800,fontSize:15,color:"var(--t1)"}}><span>TOTAL</span><span className="out" style={{color:"var(--gold)"}}>{totalQ} questions · 120 min</span></div>
      </div>
      <div className="crd" style={{padding:14,marginBottom:24,borderColor:"rgba(220,38,38,.3)",background:"rgba(220,38,38,.06)"}}>
        <p style={{fontSize:12,color:"var(--red)",lineHeight:1.6}}>⚠️ Real TOEIC conditions. No feedback. No going back. Audio plays ONCE. Your score is saved. Rejouable after 24h cooldown.</p>
      </div>
      <button className="btn1" style={{background:"linear-gradient(135deg,#dc2626,#f59e0b)",fontSize:18,padding:"16px 32px"}} onClick={function(){stopBGM();setPhase("test");}}>⚔️ Enter the Arena</button>
      <button className="btn2" onClick={p.back} style={{marginTop:12,width:"100%"}}>Not ready yet</button>
    </div>);
  }

  // ═══ TEST PHASE ═══
  if(phase==="test"&&!result){
    var timerCol=timeLeft>600?"var(--cyan)":timeLeft>120?"var(--orange)":"var(--red)";

    // Barre de session : marques neutres (aucun verdict avant la fin), chrono en aside.
    var NEUTRAL=new Array(answered).fill(null);
    var header=(<SessionTop n={totalQ} cur={answered} results={NEUTRAL} onQuit={p.back}
      sub={(isListening?"Listening":"Reading")+" \u00b7 "+secLabel+" \u00b7 "+answered+"/"+totalQ}
      quitCopy={{title:"Leave the exam?",body:"Your progress is saved — you can resume today.",stay:"Keep going",leave:"Leave"}}
      aside={<span className="out" style={{fontSize:16,fontWeight:800,color:timerCol}}>{fmtT(timeLeft)}</span>}/>);

    // ── P1: Photos (TOEIC: blind A/B/C/D, answer during audio) ──
    if(sec==="p1"){
      var it=LP1[qi];var selP1=ans.p1[qi];
      return(<div style={{padding:"20px 16px",minHeight:"100vh"}}>
        {header}
        <div style={{marginBottom:12,borderRadius:14,overflow:"hidden",border:"1px solid var(--bdr)"}}>
          <img src={it.img} alt="TOEIC photo" style={{width:"100%",display:"block",maxHeight:240,objectFit:"cover"}}/>
        </div>
        {aState==="ready"&&<div style={{textAlign:"center",marginBottom:16}}>
          <button onClick={playP1} style={{width:70,height:70,borderRadius:"50%",border:"none",background:"linear-gradient(135deg,#f59e0b,#ef4444)",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",margin:"0 auto"}}><span style={{fontSize:28}}>{"▶️"}</span></button>
          <p style={{color:"var(--t2)",fontSize:12,marginTop:8}}>Tap to play — listen and choose</p></div>}
        {(aState==="playing"||aState==="done")&&<div>
          {aState==="playing"&&<div style={{textAlign:"center",marginBottom:12}}>
            <p className="out" style={{color:"var(--orange)",fontSize:13,animation:"pulse 1.5s infinite"}}>🔊 Playing statement {String.fromCharCode(65+(curOpt>=0?curOpt:0))}...</p></div>}
          {aState==="done"&&selP1<0&&<div style={{textAlign:"center",marginBottom:12}}>
            <p className="out" style={{color:"var(--green)",fontSize:13}}>Audio complete — choose your answer</p></div>}
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
            {["A","B","C","D"].map(function(letter,i){var sel=selP1===i;var playing2=aState==="playing"&&curOpt===i;return(<button key={i} onClick={function(){if(selP1<0)pick(i);}} style={{padding:"18px 10px",background:sel?"rgba(var(--cx),.2)":playing2?"rgba(245,158,11,.1)":"var(--bg2)",border:"2px solid "+(sel?"var(--cyan)":playing2?"var(--orange)":"var(--bdr)"),borderRadius:14,cursor:selP1<0?"pointer":"default",textAlign:"center",fontFamily:"'Cinzel','Outfit',serif",transition:"all .15s"}}>
              <div className="out" style={{fontSize:24,fontWeight:900,color:sel?"var(--cyan)":playing2?"var(--orange)":"var(--t2)"}}>{letter}</div>
            </button>);})}
          </div>
        </div>}
      </div>);
    }

    // ── P2: Q&R (TOEIC: blind A/B/C, answer during audio) ──
    if(sec==="p2"){
      var selP2=ans.p2[qi];
      return(<div style={{padding:"20px 16px",minHeight:"100vh"}}>
        {header}
        {aState==="ready"&&<div style={{textAlign:"center",marginTop:40}}>
          <button onClick={playP2} style={{width:70,height:70,borderRadius:"50%",border:"none",background:"linear-gradient(135deg,#f59e0b,#ef4444)",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",margin:"0 auto"}}><span style={{fontSize:28}}>{"▶️"}</span></button>
          <p style={{color:"var(--t2)",fontSize:12,marginTop:8}}>Tap to play — listen and choose</p></div>}
        {(aState==="playing"||aState==="done")&&<div>
          {aState==="playing"&&<div style={{textAlign:"center",marginBottom:16}}>
            <p className="out" style={{color:"var(--orange)",fontSize:13,animation:"pulse 1.5s infinite"}}>🔊 {curOpt>=0?"Response "+String.fromCharCode(65+curOpt)+"...":"Question..."}</p></div>}
          {aState==="done"&&selP2<0&&<div style={{textAlign:"center",marginBottom:16}}>
            <p className="out" style={{color:"var(--green)",fontSize:13}}>Audio complete — choose your answer</p></div>}
          <div style={{display:"flex",flexDirection:"column",gap:12,maxWidth:280,margin:"20px auto 0"}}>
            {["A","B","C"].map(function(letter,i){var sel=selP2===i;var playing2=aState==="playing"&&curOpt===i;return(<button key={i} onClick={function(){if(selP2<0)pick(i);}} style={{padding:"20px",background:sel?"rgba(var(--cx),.2)":playing2?"rgba(245,158,11,.1)":"var(--bg2)",border:"2px solid "+(sel?"var(--cyan)":playing2?"var(--orange)":"var(--bdr)"),borderRadius:14,cursor:selP2<0?"pointer":"default",textAlign:"center",fontFamily:"'Cinzel','Outfit',serif",transition:"all .15s"}}>
              <div className="out" style={{fontSize:28,fontWeight:900,color:sel?"var(--cyan)":playing2?"var(--orange)":"var(--t2)"}}>{letter}</div>
            </button>);})}
          </div>
        </div>}
      </div>);
    }

    // ── P3: Conversations ──
    if(sec==="p3"){
      var c3=LP3[qi];var q3=c3.qs[sqi];
      return(<div style={{padding:"20px 16px",minHeight:"100vh"}}>
        {header}
        <div style={{fontSize:11,color:"var(--t3)",marginBottom:8}}>Conversation {qi+1}/{LP3.length} — Question {sqi+1}/{c3.qs.length}</div>
        {aState==="ready"&&<div style={{textAlign:"center",marginTop:20,marginBottom:20}}>
          <div className="crd" style={{padding:12,marginBottom:16,textAlign:"left"}}>
            <div style={{fontSize:11,color:"var(--t3)",marginBottom:6}}>Preview questions:</div>
            {c3.qs.map(function(qq,i){return(<div key={i} style={{fontSize:12,color:"var(--t2)",lineHeight:1.6}}>{i+1}. {qq.q}</div>);})}
          </div>
          <button onClick={playP3} style={{width:70,height:70,borderRadius:"50%",border:"none",background:"linear-gradient(135deg,#8b5cf6,#ec4899)",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",margin:"0 auto"}}><span style={{fontSize:28}}>▶️</span></button>
          <p style={{color:"var(--t2)",fontSize:12,marginTop:8}}>Play conversation</p></div>}
        {aState==="playing"&&<div style={{textAlign:"center",marginTop:30}}><div style={{fontSize:40,animation:"pulse 1.5s infinite"}}>🗣️</div><p className="out" style={{color:"var(--purple)",fontSize:13,marginTop:8}}>Listening to conversation...</p></div>}
        {aState==="done"&&<div style={{animation:"fadeIn .3s"}}>
          <h3 className="out" style={{fontWeight:700,fontSize:15,lineHeight:1.5,marginBottom:16}}>{q3.q}</h3>
          {q3.graphic&&<ListeningGraphic g={q3.graphic}/>}
          <div style={{display:"flex",flexDirection:"column",gap:8}}>
            {q3.opts.map(function(opt,i){var sel=ans.p3[qi][sqi]===i;return(<button key={i} onClick={function(){pick(i);}} style={{display:"flex",alignItems:"center",gap:10,padding:"12px 14px",background:sel?"rgba(var(--cx),.15)":"var(--bg2)",border:"1px solid "+(sel?"var(--cyan)":"var(--bdr)"),borderRadius:12,cursor:"pointer",fontSize:13,color:"var(--t1)",textAlign:"left",fontFamily:"'DM Sans',sans-serif"}}>
              <div style={{width:26,height:26,borderRadius:"50%",border:"2px solid "+(sel?"var(--cyan)":"var(--t3)"),display:"flex",alignItems:"center",justifyContent:"center",fontSize:11,fontWeight:700,flexShrink:0,background:sel?"var(--cyan)":"transparent",color:sel?"#fff":"var(--t3)"}}>{String.fromCharCode(65+i)}</div>
              <span>{opt}</span></button>);})}
          </div></div>}
      </div>);
    }

    // ── P4: Talks ──
    if(sec==="p4"){
      var t4=LP4[qi];var q4=t4.qs[sqi];
      return(<div style={{padding:"20px 16px",minHeight:"100vh"}}>
        {header}
        <div style={{fontSize:11,color:"var(--t3)",marginBottom:8}}>Talk {qi+1}/{LP4.length} ({t4.type}) — Question {sqi+1}/{t4.qs.length}</div>
        {aState==="ready"&&<div style={{textAlign:"center",marginTop:20,marginBottom:20}}>
          <div className="crd" style={{padding:12,marginBottom:16,textAlign:"left"}}>
            <div style={{fontSize:11,color:"var(--t3)",marginBottom:6}}>Preview questions:</div>
            {t4.qs.map(function(qq,i){return(<div key={i} style={{fontSize:12,color:"var(--t2)",lineHeight:1.6}}>{i+1}. {qq.q}</div>);})}
          </div>
          <button onClick={playP4} style={{width:70,height:70,borderRadius:"50%",border:"none",background:"linear-gradient(135deg,#06b6d4,#3b82f6)",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",margin:"0 auto"}}><span style={{fontSize:28}}>▶️</span></button>
          <p style={{color:"var(--t2)",fontSize:12,marginTop:8}}>Play talk</p></div>}
        {aState==="playing"&&<div style={{textAlign:"center",marginTop:30}}><div style={{fontSize:40,animation:"pulse 1.5s infinite"}}>🎤</div><p className="out" style={{color:"var(--cyan)",fontSize:13,marginTop:8}}>Listening to talk...</p></div>}
        {aState==="done"&&<div style={{animation:"fadeIn .3s"}}>
          <h3 className="out" style={{fontWeight:700,fontSize:15,lineHeight:1.5,marginBottom:16}}>{q4.q}</h3>
          {q4.graphic&&<ListeningGraphic g={q4.graphic}/>}
          <div style={{display:"flex",flexDirection:"column",gap:8}}>
            {q4.opts.map(function(opt,i){var sel=ans.p4[qi][sqi]===i;return(<button key={i} onClick={function(){pick(i);}} style={{display:"flex",alignItems:"center",gap:10,padding:"12px 14px",background:sel?"rgba(var(--cx),.15)":"var(--bg2)",border:"1px solid "+(sel?"var(--cyan)":"var(--bdr)"),borderRadius:12,cursor:"pointer",fontSize:13,color:"var(--t1)",textAlign:"left",fontFamily:"'DM Sans',sans-serif"}}>
              <div style={{width:26,height:26,borderRadius:"50%",border:"2px solid "+(sel?"var(--cyan)":"var(--t3)"),display:"flex",alignItems:"center",justifyContent:"center",fontSize:11,fontWeight:700,flexShrink:0,background:sel?"var(--cyan)":"transparent",color:sel?"#fff":"var(--t3)"}}>{String.fromCharCode(65+i)}</div>
              <span>{opt}</span></button>);})}
          </div></div>}
      </div>);
    }

    // ── P5: Incomplete Sentences ──
    if(sec==="p5"){
      var q5=RP5[qi];var sel5=ans.p5[qi];
      return(<div style={{padding:"20px 16px",minHeight:"100vh"}}>
        {header}
        <h3 className="out" style={{fontWeight:700,fontSize:16,lineHeight:1.5,marginBottom:20}}>{q5.s}</h3>
        <div style={{display:"flex",flexDirection:"column",gap:10}}>
          {q5.o.map(function(opt,i){var isSel=sel5===i;return(<button key={i} onClick={function(){pick(i);}} style={{display:"flex",alignItems:"center",gap:12,padding:"14px 16px",background:isSel?"rgba(var(--cx),.15)":"var(--bg2)",border:"1px solid "+(isSel?"var(--cyan)":"var(--bdr)"),borderRadius:12,cursor:"pointer",fontSize:14,color:"var(--t1)",textAlign:"left",fontFamily:"'DM Sans',sans-serif"}}>
            <div style={{width:26,height:26,borderRadius:"50%",border:"2px solid "+(isSel?"var(--cyan)":"var(--t3)"),display:"flex",alignItems:"center",justifyContent:"center",fontSize:11,fontWeight:700,flexShrink:0,background:isSel?"var(--cyan)":"transparent",color:isSel?"#fff":"var(--t3)"}}>{String.fromCharCode(65+i)}</div>
            <span>{opt}</span></button>);})}
        </div>
      </div>);
    }

    // ── P6: Text Completion ──
    if(sec==="p6"){
      var t6=RP6[qi];var blanks6=[];var blankNum=0;
      t6.parts.forEach(function(pt){if(pt.blank){blanks6.push(pt);blankNum++;}});
      var bl6=blanks6[sqi];var sel6=ans.p6[qi][sqi];
      var renderedText=[];t6.parts.forEach(function(pt,pi){
        if(pt.blank){var bIdx=blanks6.indexOf(pt)+1;renderedText.push(<span key={pi} style={{padding:"2px 8px",borderRadius:4,background:bIdx-1===sqi?"rgba(var(--cx),.2)":"rgba(100,100,100,.15)",fontWeight:700,color:bIdx-1===sqi?"var(--cyan)":"var(--t2)"}}>{"["+bIdx+"]"}</span>);}
        else renderedText.push(<span key={pi}>{pt.text}</span>);
      });
      return(<div style={{padding:"20px 16px",minHeight:"100vh"}}>
        {header}
        <div style={{fontSize:11,color:"var(--t3)",marginBottom:8}}>{t6.type} — Blank {sqi+1}/{blankNum}</div>
        <div className="crd read-scroll" style={{padding:14,marginBottom:16,maxHeight:200,overflowY:"auto",lineHeight:1.7,fontSize:12,whiteSpace:"pre-wrap"}}>{renderedText}</div>
        <div style={{display:"flex",flexDirection:"column",gap:8}}>
          {bl6.options.map(function(opt,i){var isSel=sel6===i;return(<button key={i} onClick={function(){pick(i);}} style={{display:"flex",alignItems:"center",gap:10,padding:"12px 14px",background:isSel?"rgba(var(--cx),.15)":"var(--bg2)",border:"1px solid "+(isSel?"var(--cyan)":"var(--bdr)"),borderRadius:12,cursor:"pointer",fontSize:13,color:"var(--t1)",textAlign:"left",fontFamily:"'DM Sans',sans-serif"}}>
            <div style={{width:26,height:26,borderRadius:"50%",border:"2px solid "+(isSel?"var(--cyan)":"var(--t3)"),display:"flex",alignItems:"center",justifyContent:"center",fontSize:11,fontWeight:700,flexShrink:0,background:isSel?"var(--cyan)":"transparent",color:isSel?"#fff":"var(--t3)"}}>{String.fromCharCode(65+i)}</div>
            <span>{opt}</span></button>);})}
        </div>
      </div>);
    }

    // ── P7: Reading Comprehension ──
    if(sec==="p7"){
      var ps7=RP7[qi];var pq7=ps7.questions[sqi];var sel7=ans.p7[qi][sqi];
      return(<div style={{padding:"20px 16px",minHeight:"100vh"}}>
        {header}
        <div style={{display:"flex",justifyContent:"space-between",marginBottom:8}}>
          <span style={{fontSize:11,color:"var(--t3)"}}>{ps7.type}</span>
          <span style={{fontSize:11,color:"var(--cyan)"}}>Q {sqi+1}/{ps7.questions.length}</span>
        </div>
        <div className="crd read-scroll" style={{padding:14,marginBottom:16,maxHeight:200,overflowY:"auto",lineHeight:1.7,fontSize:12,whiteSpace:"pre-wrap"}}>{ps7.text}</div>
        <h3 className="out" style={{fontWeight:700,fontSize:15,lineHeight:1.5,marginBottom:16}}>{pq7.q}</h3>
        <div style={{display:"flex",flexDirection:"column",gap:8}}>
          {pq7.options.map(function(opt,i){var isSel=sel7===i;return(<button key={i} onClick={function(){pick(i);}} style={{display:"flex",alignItems:"center",gap:10,padding:"12px 14px",background:isSel?"rgba(var(--cx),.15)":"var(--bg2)",border:"1px solid "+(isSel?"var(--cyan)":"var(--bdr)"),borderRadius:12,cursor:"pointer",fontSize:13,color:"var(--t1)",textAlign:"left",fontFamily:"'DM Sans',sans-serif"}}>
            <div style={{width:26,height:26,borderRadius:"50%",border:"2px solid "+(isSel?"var(--cyan)":"var(--t3)"),display:"flex",alignItems:"center",justifyContent:"center",fontSize:11,fontWeight:700,flexShrink:0,background:isSel?"var(--cyan)":"transparent",color:isSel?"#fff":"var(--t3)"}}>{String.fromCharCode(65+i)}</div>
            <span>{opt}</span></button>);})}
        </div>
      </div>);
    }
  }

  // ═══ RESULTS ═══
  if(phase==="done"&&result&&!revMode){
    var pct=Math.round(result.score/result.total*100);
    var grade=result.toeicEstimate>=800?"Legendary!":result.toeicEstimate>=600?"Excellent!":result.toeicEstimate>=400?"Good effort!":"Keep training!";
    var gradeIcon=result.toeicEstimate>=800?"👑":result.toeicEstimate>=600?"⚔️":result.toeicEstimate>=400?"🛡️":"📖";
    var gradeCol=result.toeicEstimate>=800?"var(--gold)":result.toeicEstimate>=600?"var(--green)":result.toeicEstimate>=400?"var(--orange)":"var(--red)";
    var xp=Math.round(result.toeicEstimate*1.5)+(result.toeicEstimate>=800?200:result.toeicEstimate>=600?100:0);

    return(<div className="enter" style={{padding:"20px 16px 100px",minHeight:"100vh",textAlign:"center"}}>
      <div style={{marginBottom:12,display:"flex",justifyContent:"center",animation:"countUp .6s"}}><ResultIcon e={gradeIcon} size={60}/></div>
      <h1 className="out" style={{fontWeight:900,fontSize:26,background:"linear-gradient(135deg,#dc2626,#f59e0b)",WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent",marginBottom:4}}>THE FINAL ARENA</h1>
      <p style={{color:gradeCol,fontWeight:700,fontSize:16,marginBottom:20}}>{grade}</p>

      <div className="crd glo" style={{padding:20,marginBottom:16,textAlign:"center"}}>
        <div style={{fontSize:11,color:"var(--t3)",textTransform:"uppercase",letterSpacing:1,marginBottom:4}}>Estimated TOEIC Score</div>
        <div className="out" style={{fontSize:52,fontWeight:900,color:"var(--gold)",lineHeight:1}}>{result.toeicEstimate}</div>
        <div style={{fontSize:13,color:"var(--t2)",marginTop:4}}>/ 990</div>
      </div>

      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginBottom:16}}>
        <div className="crd" style={{padding:14,textAlign:"center"}}>
          <div style={{fontSize:11,color:"var(--orange)",fontWeight:600,marginBottom:4}}>Listening</div>
          <div className="out" style={{fontSize:28,fontWeight:900,color:"var(--orange)"}}>{result.listening.toeic}</div>
          <div style={{fontSize:10,color:"var(--t3)"}}>{result.listening.score}/{result.listening.total} ({Math.round(result.listening.score/result.listening.total*100)}%)</div>
        </div>
        <div className="crd" style={{padding:14,textAlign:"center"}}>
          <div style={{fontSize:11,color:"var(--green)",fontWeight:600,marginBottom:4}}>Reading</div>
          <div className="out" style={{fontSize:28,fontWeight:900,color:"var(--green)"}}>{result.reading.toeic}</div>
          <div style={{fontSize:10,color:"var(--t3)"}}>{result.reading.score}/{result.reading.total} ({Math.round(result.reading.score/result.reading.total*100)}%)</div>
        </div>
      </div>

      <div className="crd" style={{padding:14,marginBottom:16,textAlign:"left"}}>
        <div style={{fontSize:12,fontWeight:700,color:"var(--t2)",marginBottom:8}}>Breakdown</div>
        {[{l:"P1 Photos",d:result.listening.p1},{l:"P2 Q&R",d:result.listening.p2},{l:"P3 Convos",d:result.listening.p3},{l:"P4 Talks",d:result.listening.p4},{l:"P5 Sentences",d:result.reading.p5},{l:"P6 Text",d:result.reading.p6},{l:"P7 Reading",d:result.reading.p7}].map(function(s){
          var sp=s.d.total>0?Math.round(s.d.score/s.d.total*100):0;
          var sc=sp>=70?"var(--green)":sp>=50?"var(--orange)":"var(--red)";
          return(<div key={s.l} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"5px 0",borderBottom:"1px solid var(--bdr)"}}>
            <span style={{fontSize:12,color:"var(--t1)"}}>{s.l}</span>
            <div style={{display:"flex",alignItems:"center",gap:8}}>
              <span style={{fontSize:11,color:"var(--t3)"}}>{s.d.score}/{s.d.total}</span>
              <span className="out" style={{fontWeight:800,fontSize:13,color:sc}}>{sp}%</span>
            </div></div>);
        })}
      </div>

      <div style={{display:"flex",gap:8,marginBottom:16}}>
        <div className="crd" style={{flex:1,padding:12,textAlign:"center"}}><div className="out" style={{fontSize:18,fontWeight:800,color:"var(--purple)"}}>{fmtT(result.timeUsed)}</div><div style={{fontSize:10,color:"var(--t3)"}}>Time used</div></div>
        <div className="crd" style={{flex:1,padding:12,textAlign:"center"}}><div className="out" style={{fontSize:18,fontWeight:800,color:"var(--cyan)"}}>{pct}%</div><div style={{fontSize:10,color:"var(--t3)"}}>Overall</div></div>
      </div>

      <div className="out" style={{fontSize:22,fontWeight:800,color:"var(--gold)",marginBottom:20}}>+{xp} XP</div>

      <button className="btn1" onClick={function(){setRevMode(true);setRevSec("p1");setRevIdx(0);}}>📖 Review Answers</button>
      {/* Résultat déjà persisté au submit (voir GARDE dans doSubmit) — ce bouton ne fait que naviguer. */}
      <button className="btn2" onClick={p.back} style={{marginTop:10,width:"100%",fontSize:16,padding:"14px 24px"}}>Exit</button>
    </div>);
  }


  // ═══ REVIEW MODE ═══
  if(revMode&&result){
    var rItem=null;var rAnswer=-1;var rCorrect=-1;var rExpl="";var rLabel="";

    // ── Build flat index totals for navigation ──
    var secOrder=["p1","p2","p3","p4","p5","p6","p7"];
    var secTotals={p1:LP1.length,p2:LP2.length,p3:p3QC,p4:p4QC,p5:RP5.length,p6:p6BC,p7:p7QC};

    // Helper to render option list with correct/wrong highlighting
    function revOpts(options,correct,picked){
      return(<div style={{display:"flex",flexDirection:"column",gap:8}}>
        {options.map(function(opt,i){
          var isC=i===correct;var isP=i===picked;
          var bg=isC?"rgba(0,230,118,.12)":isP?"rgba(255,71,87,.12)":"var(--bg2)";
          var bd=isC?"var(--green)":isP?"var(--red)":"var(--bdr)";
          return(<div key={i} style={{display:"flex",alignItems:"center",gap:10,padding:"10px 14px",background:bg,border:"1px solid "+bd,borderRadius:10,fontSize:13}}>
            <span style={{fontWeight:700,color:isC?"var(--green)":isP?"var(--red)":"var(--t3)",fontSize:12}}>{isC?"✓":isP?"✗":String.fromCharCode(65+i)}</span>
            <span style={{color:"var(--t1)"}}>{typeof opt==="string"&&opt.length>80?opt.substring(0,77)+"…":opt}</span></div>);
        })}
      </div>);
    }

    // ── P1: Photos ──
    if(revSec==="p1"){
      var it=LP1[revIdx];rAnswer=ans.p1[revIdx];rCorrect=it.c;rExpl=it.x;
      rLabel="Part 1 — Photo "+(revIdx+1);
      rItem=(<div>
        <div style={{marginBottom:12,borderRadius:14,overflow:"hidden",border:"1px solid var(--bdr)"}}>
          <img src={it.img} alt="TOEIC photo" style={{width:"100%",display:"block",maxHeight:200,objectFit:"cover"}}/>
        </div>
        {revOpts(it.opts,it.c,rAnswer)}
      </div>);
    }

    // ── P2: Q&R ──
    else if(revSec==="p2"){
      var it2=LP2[revIdx];rAnswer=ans.p2[revIdx];rCorrect=it2.c;rExpl=it2.x;
      rLabel="Part 2 — Q"+(revIdx+1);
      rItem=(<div>
        <div className="crd" style={{padding:12,marginBottom:12,background:"rgba(var(--cx),.06)",borderColor:"rgba(var(--cx),.15)"}}>
          <p className="out" style={{fontWeight:700,fontSize:13,color:"var(--cyan)",marginBottom:4}}>Question:</p>
          <p style={{fontSize:13,color:"var(--t1)",lineHeight:1.5,fontStyle:"italic"}}>{it2.q}</p>
        </div>
        {revOpts(it2.opts,it2.c,rAnswer)}
      </div>);
    }

    // ── P3: Conversations ──
    else if(revSec==="p3"){
      var flatP3=revIdx;var ci3=0;var qi3=0;
      for(var pp3=0;pp3<LP3.length;pp3++){
        if(flatP3<LP3[pp3].qs.length){ci3=pp3;qi3=flatP3;break;}
        flatP3-=LP3[pp3].qs.length;
      }
      var conv=LP3[ci3];var q3r=conv.qs[qi3];
      rAnswer=ans.p3[ci3][qi3];rCorrect=q3r.c;rExpl="";
      rLabel="Part 3 — Convo "+(ci3+1)+", Q"+(qi3+1);
      rItem=(<div>
        <div className="crd" style={{padding:12,marginBottom:12,maxHeight:140,overflowY:"auto"}}>
          {conv.lines.map(function(ln,i){return(<div key={i} style={{fontSize:12,color:"var(--t1)",lineHeight:1.6,marginBottom:4}}>
            <span style={{fontWeight:700,color:ln.s.charAt(0)==="M"?"var(--cyan)":"var(--purple)",marginRight:6}}>{ln.s}:</span>{ln.t}
          </div>);})}
        </div>
        <h3 className="out" style={{fontWeight:700,fontSize:14,lineHeight:1.5,marginBottom:12}}>{q3r.q}</h3>
        {revOpts(q3r.opts,q3r.c,rAnswer)}
      </div>);
    }

    // ── P4: Talks ──
    else if(revSec==="p4"){
      var flatP4=revIdx;var ti4=0;var qi4=0;
      for(var pp4=0;pp4<LP4.length;pp4++){
        if(flatP4<LP4[pp4].qs.length){ti4=pp4;qi4=flatP4;break;}
        flatP4-=LP4[pp4].qs.length;
      }
      var talk=LP4[ti4];var q4r=talk.qs[qi4];
      rAnswer=ans.p4[ti4][qi4];rCorrect=q4r.c;rExpl="";
      rLabel="Part 4 — Talk "+(ti4+1)+" ("+talk.type+"), Q"+(qi4+1);
      rItem=(<div>
        <div className="crd" style={{padding:12,marginBottom:12,maxHeight:140,overflowY:"auto",fontSize:12,lineHeight:1.6,color:"var(--t1)",fontStyle:"italic"}}>
          {talk.text}
        </div>
        <h3 className="out" style={{fontWeight:700,fontSize:14,lineHeight:1.5,marginBottom:12}}>{q4r.q}</h3>
        {revOpts(q4r.opts,q4r.c,rAnswer)}
      </div>);
    }

    // ── P5: Incomplete Sentences ──
    else if(revSec==="p5"){
      var q5r=RP5[revIdx];rAnswer=ans.p5[revIdx];rCorrect=q5r.c;rExpl=q5r.x;
      rLabel="Part 5 — Q"+(revIdx+1);
      rItem=(<div>
        <h3 className="out" style={{fontWeight:700,fontSize:15,lineHeight:1.5,marginBottom:16}}>{q5r.s}</h3>
        {revOpts(q5r.o,q5r.c,rAnswer)}
      </div>);
    }

    // ── P6: Text Completion ──
    else if(revSec==="p6"){
      var tIdx6=0;var bIdx6=revIdx;
      for(var tt=0;tt<RP6.length;tt++){var bc=0;RP6[tt].parts.forEach(function(pt){if(pt.blank)bc++;});if(bIdx6<bc){tIdx6=tt;break;}bIdx6-=bc;}
      var t6r=RP6[tIdx6];var blanks6r=[];t6r.parts.forEach(function(pt){if(pt.blank)blanks6r.push(pt);});
      var bl6r=blanks6r[bIdx6];
      rAnswer=ans.p6[tIdx6][bIdx6];rCorrect=bl6r.correct;rExpl=bl6r.x;
      rLabel="Part 6 — Text "+(tIdx6+1)+", Blank "+(bIdx6+1);
      rItem=(<div>
        <div style={{fontSize:12,color:"var(--t2)",marginBottom:12}}>{t6r.type}: {t6r.subject||""}</div>
        {revOpts(bl6r.options,bl6r.correct,rAnswer)}
      </div>);
    }

    // ── P7: Reading Comprehension ──
    else if(revSec==="p7"){
      var flatP7=revIdx;var pi7=0;var qi7=0;
      for(var pp7=0;pp7<RP7.length;pp7++){
        if(flatP7<RP7[pp7].questions.length){pi7=pp7;qi7=flatP7;break;}
        flatP7-=RP7[pp7].questions.length;
      }
      var ps7r=RP7[pi7];var pq7r=ps7r.questions[qi7];
      rAnswer=ans.p7[pi7][qi7];rCorrect=pq7r.correct;rExpl=pq7r.x;
      rLabel="Part 7 — Passage "+(pi7+1)+", Q"+(qi7+1);
      rItem=(<div>
        <div style={{fontSize:11,color:"var(--t2)",marginBottom:8}}>{ps7r.type}</div>
        <h3 className="out" style={{fontWeight:700,fontSize:14,lineHeight:1.5,marginBottom:12}}>{pq7r.q}</h3>
        {revOpts(pq7r.options,pq7r.correct,rAnswer)}
      </div>);
    }

    // ── Navigation ──
    function revNext(){
      var curTotal=secTotals[revSec];
      if(revIdx<curTotal-1){setRevIdx(revIdx+1);}
      else{
        var si=secOrder.indexOf(revSec);
        if(si<secOrder.length-1){setRevSec(secOrder[si+1]);setRevIdx(0);}
        else{setRevMode(false);}
      }
    }
    function revPrev(){
      if(revIdx>0){setRevIdx(revIdx-1);}
      else{
        var si=secOrder.indexOf(revSec);
        if(si>0){var prevSec=secOrder[si-1];setRevSec(prevSec);setRevIdx(secTotals[prevSec]-1);}
      }
    }
    var isFirst=revSec==="p1"&&revIdx===0;
    var isLast=revSec==="p7"&&revIdx>=p7QC-1;

    // Section tabs for quick jump
    var secNames={p1:"P1",p2:"P2",p3:"P3",p4:"P4",p5:"P5",p6:"P6",p7:"P7"};

    return(<div style={{padding:"20px 16px 40px"}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12}}>
        <button onClick={function(){setRevMode(false);}} style={{background:"none",border:"none",color:"var(--t2)",cursor:"pointer",fontSize:14}}>{"←"} Results</button>
        <span className="out" style={{fontWeight:700,fontSize:12,color:"var(--purple)"}}>{rLabel}</span>
        <div style={{width:40}}/>
      </div>

      {/* Section jump tabs */}
      <div style={{display:"flex",gap:4,marginBottom:16,overflowX:"auto"}}>
        {secOrder.map(function(sk){
          var active=sk===revSec;
          var isLis=sk==="p1"||sk==="p2"||sk==="p3"||sk==="p4";
          return(<button key={sk} onClick={function(){setRevSec(sk);setRevIdx(0);}}
            style={{padding:"4px 10px",borderRadius:99,border:"1px solid "+(active?"var(--cyan)":"var(--bdr)"),
              background:active?(isLis?"rgba(245,158,11,.15)":"rgba(0,212,255,.15)"):"transparent",
              color:active?"var(--cyan)":"var(--t3)",fontSize:11,fontWeight:active?700:500,cursor:"pointer",
              fontFamily:"'Cinzel','Outfit',serif",flexShrink:0}}>
            {secNames[sk]}</button>);
        })}
      </div>

      {rItem}

      {rExpl&&<div className="crd" style={{marginTop:14,padding:12,background:rAnswer===rCorrect?"rgba(0,230,118,.06)":"rgba(255,71,87,.06)",borderColor:rAnswer===rCorrect?"rgba(0,230,118,.15)":"rgba(255,71,87,.15)"}}>
        <p style={{fontSize:12,color:"var(--t2)",lineHeight:1.6}}>{rExpl}</p>
      </div>}

      <div className="rev-nav-spacer"/>
      <div className="rev-nav">
        <button className={"btn2"+(isFirst?" rev-nav-ghost":"")} onClick={revPrev} disabled={isFirst}>{"←"} Prev</button>
        <button className="btn1" onClick={revNext}>{isLast?"Back to Results":"Next →"}</button>
      </div>
    </div>);
  }

  return null;
}
