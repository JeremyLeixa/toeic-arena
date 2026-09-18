// Extrait de src/App.jsx le 2026-09-15 (refactor split-app, REFACTOR_PLAN.md). Code déplacé tel quel.
import { ResultIcon } from "../../components/icons.jsx";
import { MOCK1_P5, MOCK1_P6, MOCK1_P7, MOCK2_P5, MOCK2_P6, MOCK2_P7, MOCK3_P5, MOCK3_P6, MOCK3_P7 } from "../../data/mockTests.js";
import { estimateToeic } from "../../lib/toeic.js";
import { today } from "../../lib/util.js";
import { shufP5, shufP6, shufP7 } from "../../lib/optionShuffle.js";
import { farmMult } from "../../lib/xp.js";
import { useMemo, useState, useRef, useEffect } from "react";

export function MockTest(p){
  var mockId=p.mockId;
  var TOTAL_TIME=37*60; // 37 minutes

  // Build flat question map for scoring
  // Options permutées une fois par passage (Part 6 des mocks : bonne réponse en A 7 fois sur 8). Tout le
  // test (score, revue) lit ces copies ; aucune reprise de session, donc un tirage neuf suffit.
  var deck=useMemo(function(){
    var data=mockId===1?{p5:MOCK1_P5,p6:MOCK1_P6,p7:MOCK1_P7}:mockId===2?{p5:MOCK2_P5,p6:MOCK2_P6,p7:MOCK2_P7}:{p5:MOCK3_P5,p6:MOCK3_P6,p7:MOCK3_P7};
    return{p5:data.p5.map(shufP5),p6:data.p6.map(shufP6),p7:data.p7.map(shufP7)};
  },[mockId]);
  var p5Qs=deck.p5;
  var p6Texts=deck.p6;
  var p7Passages=deck.p7;
  var p6BlankCount=0;p6Texts.forEach(function(t){t.parts.forEach(function(pt){if(pt.blank)p6BlankCount++;});});
  var p7QCount=0;p7Passages.forEach(function(ps){p7QCount+=ps.questions.length;});
  var totalQ=p5Qs.length+p6BlankCount+p7QCount;

  var[phase,setPhase]=useState("intro");
  var[section,setSection]=useState("p5");
  var[qi,setQi]=useState(0); // question index (p5) / text index (p6) / passage index (p7)
  var[bi,setBi]=useState(0); // blank index within p6 text
  var[pqi,setPqi]=useState(0); // question index within p7 passage
  var[ans,setAns]=useState({p5:p5Qs.map(function(){return -1;}),p6:p6Texts.map(function(t){var n=0;t.parts.forEach(function(pt){if(pt.blank)n++;});return Array(n).fill(-1);}),p7:p7Passages.map(function(ps){return ps.questions.map(function(){return -1;});})});
  var[timeLeft,setTimeLeft]=useState(TOTAL_TIME);
  var[result,setResult]=useState(null);
  var[xpGrant,setXpGrant]=useState(null); // {gxp,mult,timeGateOk} figés au submit
  var[reviewMode,setReviewMode]=useState(false);
  var[reviewSection,setReviewSection]=useState("p5");
  var[reviewIdx,setReviewIdx]=useState(0);
  var timerRef=useRef(null);
  useEffect(function(){if(reviewMode)window.scrollTo(0,0);},[reviewMode,reviewSection,reviewIdx]);

  // Timer
  useEffect(function(){
    if(phase!=="test"||result)return;
    if(timeLeft<=0){submitTest();return;}
    timerRef.current=setTimeout(function(){setTimeLeft(timeLeft-1);},1000);
    return function(){clearTimeout(timerRef.current);};
  });

  function formatTime(s){var m=Math.floor(s/60);var sec=s%60;return m+":"+(sec<10?"0":"")+sec;}

  // ── Submit & Scoring ──
  function submitTest(){
    clearTimeout(timerRef.current);
    var p5Score=0;p5Qs.forEach(function(q,i){if(ans.p5[i]===q.c)p5Score++;});
    var p6Score=0;var bIdx=0;
    p6Texts.forEach(function(t,ti){
      var localB=0;
      t.parts.forEach(function(pt){
        if(pt.blank){if(ans.p6[ti][localB]===pt.correct)p6Score++;localB++;}
      });
    });
    var p7Score=0;p7Passages.forEach(function(ps,pi){ps.questions.forEach(function(q,qii){if(ans.p7[pi][qii]===q.correct)p7Score++;});});
    var totalScore=p5Score+p6Score+p7Score;
    var toeic=estimateToeic(totalScore,totalQ);
    var timeUsed=TOTAL_TIME-timeLeft;
    var res={date:today(),score:totalScore,total:totalQ,p5:{score:p5Score,total:p5Qs.length},p6:{score:p6Score,total:p6BlankCount},p7:{score:p7Score,total:p7QCount},toeicEstimate:toeic,timeUsed:timeUsed,mockId:mockId};
    setResult(res);setPhase("done");
    // GARDE : persister IMMÉDIATEMENT le résultat, pas au clic "Save & Exit".
    // Avant ce fix, un élève qui consultait la révision puis fermait l'app
    // perdait tout son Mock Test (bug Yannou esgi2527, 2026-05-17).
    var pctV=totalQ>0?Math.round(totalScore/totalQ*100):0;
    var resXp=50+totalScore*5+(pctV>=80?50:0);
    // Fige les valeurs XP d'affichage AVANT la persistance : p.done incrémente
    // dailyModSessions, donc lire ce compteur après fausserait l'affichage.
    var tgOk=timeUsed>=300;
    var dms0=p.u.dailyModSessions||{};
    var sc0=dms0["mock"+mockId+"_"+today()]||0;
    // Même courbe que la porte réelle (lib/xp.js), au lieu d'une copie locale à maintenir.
    var mult0=farmMult("mock"+mockId,sc0);
    setXpGrant({gxp:tgOk?Math.round(resXp*mult0):0,mult:mult0,timeGateOk:tgOk});
    try{p.done(res,resXp);}catch(e){console.warn("[MockTest] persist failed:",e&&e.message);}
  }

  // ── Navigation ──
  function pickAnswer(val){
    var a=JSON.parse(JSON.stringify(ans));
    if(section==="p5"){a.p5[qi]=val;setAns(a);setTimeout(nextItem,300);}
    else if(section==="p6"){a.p6[qi][bi]=val;setAns(a);setTimeout(nextItem,300);}
    else if(section==="p7"){a.p7[qi][pqi]=val;setAns(a);setTimeout(nextItem,300);}
  }
  function nextItem(){
    if(section==="p5"){
      if(qi<p5Qs.length-1){setQi(qi+1);}
      else{setSection("p6");setQi(0);setBi(0);}
    }else if(section==="p6"){
      var blanksInText=ans.p6[qi].length;
      if(bi<blanksInText-1){setBi(bi+1);}
      else if(qi<p6Texts.length-1){setQi(qi+1);setBi(0);}
      else{setSection("p7");setQi(0);setPqi(0);}
    }else if(section==="p7"){
      if(pqi<p7Passages[qi].questions.length-1){setPqi(pqi+1);}
      else if(qi<p7Passages.length-1){setQi(qi+1);setPqi(0);}
      else{submitTest();}
    }
  }

  // ── Progress calc ──
  var answered=0;
  ans.p5.forEach(function(a){if(a>=0)answered++;});
  ans.p6.forEach(function(t){t.forEach(function(a){if(a>=0)answered++;});});
  ans.p7.forEach(function(ps){ps.forEach(function(a){if(a>=0)answered++;});});
  var progressPct=Math.round(answered/totalQ*100);

  // ════════════════ INTRO ════════════════
  if(phase==="intro"){
    return(<div className="enter" style={{padding:"20px 16px",minHeight:"100vh",display:"flex",flexDirection:"column",justifyContent:"center",textAlign:"center"}}>
      <div style={{fontSize:56,marginBottom:16}}>📜</div>
      <h1 className="out" style={{fontWeight:900,fontSize:26,marginBottom:8}}>Mock Test {mockId}</h1>
      <p style={{color:"var(--t2)",fontSize:14,marginBottom:24,lineHeight:1.6}}>Reading Section — Half Test</p>
      <div className="crd" style={{textAlign:"left",padding:16,marginBottom:20}}>
        <div style={{fontSize:13,color:"var(--t1)",lineHeight:1.8}}>
          <div style={{display:"flex",justifyContent:"space-between",marginBottom:4}}><span>Part 5 — Incomplete Sentences</span><span className="out" style={{color:"var(--cyan)"}}>{p5Qs.length} Q</span></div>
          <div style={{display:"flex",justifyContent:"space-between",marginBottom:4}}><span>Part 6 — Text Completion</span><span className="out" style={{color:"var(--cyan)"}}>{p6BlankCount} Q</span></div>
          <div style={{display:"flex",justifyContent:"space-between",marginBottom:4}}><span>Part 7 — Reading Comprehension</span><span className="out" style={{color:"var(--cyan)"}}>{p7QCount} Q</span></div>
          <div style={{borderTop:"1px solid var(--bdr)",marginTop:8,paddingTop:8,display:"flex",justifyContent:"space-between",fontWeight:700}}><span>Total</span><span className="out" style={{color:"var(--gold)"}}>{totalQ} questions · 37 min</span></div>
        </div>
      </div>
      <div className="crd" style={{padding:14,marginBottom:24,borderColor:"rgba(255,140,66,.2)"}}>
        <p style={{fontSize:12,color:"var(--orange)",lineHeight:1.6}}>⚠️ Exam conditions: no feedback during the test, no going back. Timer stops for no one. Your score will be saved permanently.</p>
      </div>
      <button className="btn1" onClick={function(){setPhase("test");}}>Start Exam</button>
      <button className="btn2" onClick={p.back} style={{marginTop:12,width:"100%"}}>Not ready yet</button>
    </div>);
  }

  // ════════════════ TEST ════════════════
  if(phase==="test"){
    var timerCol=timeLeft>300?"var(--cyan)":timeLeft>60?"var(--orange)":"var(--red)";
    var sectionLabel=section==="p5"?"Part 5":section==="p6"?"Part 6":"Part 7";

    // Header bar (always visible)
    var header=(<div style={{position:"sticky",top:0,background:"var(--bg)",zIndex:10,padding:"12px 0 8px",borderBottom:"1px solid var(--bdr)"}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:8}}>
        <span className="out" style={{fontSize:12,fontWeight:700,color:"var(--purple)",textTransform:"uppercase",letterSpacing:1}}>{sectionLabel}</span>
        <span className="out" style={{fontSize:18,fontWeight:800,color:timerCol,fontVariantNumeric:"tabular-nums"}}>{formatTime(timeLeft)}</span>
      </div>
      <div style={{width:"100%",height:4,background:"var(--bg3)",borderRadius:2,overflow:"hidden"}}>
        <div style={{height:"100%",width:progressPct+"%",background:"linear-gradient(90deg,var(--cx-hex),#8b5e83)",borderRadius:2,transition:"width .3s"}}/>
      </div>
      <div style={{fontSize:10,color:"var(--t3)",marginTop:4,textAlign:"right"}}>{answered}/{totalQ}</div>
    </div>);

    // ── PART 5 RENDER ──
    if(section==="p5"){
      var q=p5Qs[qi];var selected=ans.p5[qi];
      return(<div style={{padding:"0 16px 40px"}}>{header}
        <div style={{marginTop:16}}>
          <span style={{fontSize:11,color:"var(--t3)"}}>{qi+1} / {p5Qs.length}</span>
          <h2 className="qstem" style={{fontWeight:700,fontSize:18,lineHeight:1.5,marginTop:8,marginBottom:24}}>{q.s}</h2>
          <div style={{display:"flex",flexDirection:"column",gap:10}}>
            {q.o.map(function(opt,i){
              var bg=selected===i?"rgba(var(--cx),.15)":"var(--bg2)";
              var bd=selected===i?"var(--cyan)":"var(--bdr)";
              return(<button key={i} onClick={function(){pickAnswer(i);}} style={{display:"flex",alignItems:"center",gap:12,padding:"14px 16px",background:bg,border:"1px solid "+bd,borderRadius:12,cursor:"pointer",fontSize:15,color:"var(--t1)",textAlign:"left",fontFamily:"'DM Sans',sans-serif",transition:"all .15s"}}>
                <div style={{width:28,height:28,borderRadius:"50%",border:"2px solid "+(selected===i?"var(--cyan)":"var(--t3)"),display:"flex",alignItems:"center",justifyContent:"center",fontSize:12,fontWeight:700,flexShrink:0,background:selected===i?"var(--cyan)":"transparent",color:selected===i?"#fff":"var(--t3)"}}>{String.fromCharCode(65+i)}</div>
                <span>{opt}</span></button>);
            })}
          </div>
        </div>
      </div>);
    }

    // ── PART 6 RENDER ──
    if(section==="p6"){
      var txt=p6Texts[qi];
      var blanks=[];var displayParts=[];
      txt.parts.forEach(function(pt){
        if(pt.text!==undefined)displayParts.push({type:"text",content:pt.text});
        else if(pt.blank){var bx=blanks.length;blanks.push(pt);displayParts.push({type:"blank",index:bx});}
      });
      var currentBlank=blanks[bi];var selected6=ans.p6[qi][bi];

      return(<div style={{padding:"0 16px 40px"}}>{header}
        <div style={{marginTop:16}}>
          <div style={{display:"flex",justifyContent:"space-between",marginBottom:8}}>
            <span style={{fontSize:11,color:"var(--t3)"}}>Text {qi+1}/{p6Texts.length}</span>
            <span style={{fontSize:11,color:"var(--cyan)"}}>Blank {bi+1}/{blanks.length}</span>
          </div>
          <div style={{fontSize:11,color:"var(--t2)",textTransform:"uppercase",letterSpacing:.5,marginBottom:6}}>{txt.type}: {txt.subject}</div>
          <div className="crd read-scroll" style={{padding:14,marginBottom:16,maxHeight:220,overflowY:"auto",lineHeight:1.7,fontSize:13}}>
            {displayParts.map(function(dp,i){
              if(dp.type==="text")return(<span key={i}>{dp.content}</span>);
              var isCurrent=dp.index===bi;
              var hasAnswer=ans.p6[qi][dp.index]>=0;
              return(<span key={i} className="out" style={{display:"inline",padding:"2px 8px",borderRadius:6,fontWeight:700,background:isCurrent?"rgba(var(--cx),.2)":hasAnswer?"rgba(0,230,118,.12)":"var(--bg3)",color:isCurrent?"var(--cyan)":hasAnswer?"var(--green)":"var(--t3)",border:"1px solid "+(isCurrent?"var(--cyan)":hasAnswer?"var(--green)":"var(--bdr)"),fontSize:12}}>{("["+String.fromCharCode(65+dp.index)+"]")}{hasAnswer&&!isCurrent?" ✓":""}</span>);
            })}
          </div>
          <div style={{display:"flex",flexDirection:"column",gap:10}}>
            {currentBlank.options.map(function(opt,i){
              var bg=selected6===i?"rgba(var(--cx),.15)":"var(--bg2)";
              var bd=selected6===i?"var(--cyan)":"var(--bdr)";
              return(<button key={i} onClick={function(){pickAnswer(i);}} style={{display:"flex",alignItems:"center",gap:12,padding:"14px 16px",background:bg,border:"1px solid "+bd,borderRadius:12,cursor:"pointer",fontSize:14,color:"var(--t1)",textAlign:"left",fontFamily:"'DM Sans',sans-serif",transition:"all .15s"}}>
                <div style={{width:26,height:26,borderRadius:"50%",border:"2px solid "+(selected6===i?"var(--cyan)":"var(--t3)"),display:"flex",alignItems:"center",justifyContent:"center",fontSize:11,fontWeight:700,flexShrink:0,background:selected6===i?"var(--cyan)":"transparent",color:selected6===i?"#fff":"var(--t3)"}}>{String.fromCharCode(65+i)}</div>
                <span>{opt}</span></button>);
            })}
          </div>
        </div>
      </div>);
    }

    // ── PART 7 RENDER ──
    if(section==="p7"){
      var passage=p7Passages[qi];var pq=passage.questions[pqi];var selected7=ans.p7[qi][pqi];

      return(<div style={{padding:"0 16px 40px"}}>{header}
        <div style={{marginTop:16}}>
          <div style={{display:"flex",justifyContent:"space-between",marginBottom:8}}>
            <span style={{fontSize:11,color:"var(--t3)"}}>Passage {qi+1}/{p7Passages.length}</span>
            <span style={{fontSize:11,color:"var(--cyan)"}}>Q {pqi+1}/{passage.questions.length}</span>
          </div>
          <div style={{fontSize:11,color:"var(--t2)",textTransform:"uppercase",letterSpacing:.5,marginBottom:6}}>{passage.type}</div>
          <div className="crd read-scroll" style={{padding:14,marginBottom:16,maxHeight:200,overflowY:"auto",lineHeight:1.7,fontSize:12,whiteSpace:"pre-wrap"}}>{passage.text}</div>
          <h3 className="qstem" style={{fontWeight:700,fontSize:15,lineHeight:1.5,marginBottom:16}}>{pq.q}</h3>
          <div style={{display:"flex",flexDirection:"column",gap:10}}>
            {pq.options.map(function(opt,i){
              var bg=selected7===i?"rgba(var(--cx),.15)":"var(--bg2)";
              var bd=selected7===i?"var(--cyan)":"var(--bdr)";
              return(<button key={i} onClick={function(){pickAnswer(i);}} style={{display:"flex",alignItems:"center",gap:12,padding:"14px 16px",background:bg,border:"1px solid "+bd,borderRadius:12,cursor:"pointer",fontSize:14,color:"var(--t1)",textAlign:"left",fontFamily:"'DM Sans',sans-serif",transition:"all .15s"}}>
                <div style={{width:26,height:26,borderRadius:"50%",border:"2px solid "+(selected7===i?"var(--cyan)":"var(--t3)"),display:"flex",alignItems:"center",justifyContent:"center",fontSize:11,fontWeight:700,flexShrink:0,background:selected7===i?"var(--cyan)":"transparent",color:selected7===i?"#fff":"var(--t3)"}}>{String.fromCharCode(65+i)}</div>
                <span>{opt}</span></button>);
            })}
          </div>
        </div>
      </div>);
    }
  }

  // ════════════════ RESULTS ════════════════
  if(phase==="done"&&result&&!reviewMode){
    var pct=Math.round(result.score/result.total*100);
    var grade=pct>=80?"Excellent!":pct>=65?"Good job!":pct>=50?"Keep going!":"More training needed";
    var gradeIcon=pct>=80?"👑":pct>=65?"⚔️":pct>=50?"🛡️":"📖";
    var gradeCol=pct>=80?"var(--gold)":pct>=65?"var(--green)":pct>=50?"var(--orange)":"var(--red)";

    return(<div className="enter" style={{padding:"20px 16px",minHeight:"100vh",textAlign:"center"}}>
      <div style={{marginBottom:12,display:"flex",justifyContent:"center",animation:"countUp .6s"}}><ResultIcon e={gradeIcon} size={56}/></div>
      <h1 className="out" style={{fontWeight:900,fontSize:26,marginBottom:4}}>Mock Test {mockId} Complete</h1>
      <p style={{color:gradeCol,fontWeight:700,fontSize:16,marginBottom:20}}>{grade}</p>

      <div className="crd glo" style={{padding:20,marginBottom:16,textAlign:"center"}}>
        <div style={{fontSize:11,color:"var(--t3)",textTransform:"uppercase",letterSpacing:1,marginBottom:4}}>Estimated TOEIC Reading Score</div>
        <div className="out" style={{fontSize:48,fontWeight:900,color:"var(--cyan)",lineHeight:1}}>{result.toeicEstimate}</div>
        <div style={{fontSize:12,color:"var(--t2)",marginTop:4}}>/ 495</div>
      </div>

      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginBottom:16}}>
        <div className="crd" style={{padding:12,textAlign:"center"}}><div className="out" style={{fontSize:22,fontWeight:800,color:pct>=60?"var(--green)":"var(--orange)"}}>{result.score}/{result.total}</div><div style={{fontSize:10,color:"var(--t3)"}}>Correct ({pct}%)</div></div>
        <div className="crd" style={{padding:12,textAlign:"center"}}><div className="out" style={{fontSize:22,fontWeight:800,color:"var(--purple)"}}>{formatTime(result.timeUsed)}</div><div style={{fontSize:10,color:"var(--t3)"}}>Time used</div></div>
      </div>

      <div className="crd" style={{padding:14,marginBottom:16,textAlign:"left"}}>
        <div style={{fontSize:12,fontWeight:700,color:"var(--t2)",marginBottom:8}}>Breakdown by Part</div>
        {[{label:"Part 5",data:result.p5},{label:"Part 6",data:result.p6},{label:"Part 7",data:result.p7}].map(function(s){
          var sPct=s.data.total>0?Math.round(s.data.score/s.data.total*100):0;
          var sCol=sPct>=70?"var(--green)":sPct>=50?"var(--orange)":"var(--red)";
          return(<div key={s.label} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"6px 0",borderBottom:"1px solid var(--bdr)"}}>
            <span style={{fontSize:13,color:"var(--t1)"}}>{s.label}</span>
            <div style={{display:"flex",alignItems:"center",gap:8}}>
              <span style={{fontSize:12,color:"var(--t3)"}}>{s.data.score}/{s.data.total}</span>
              <span className="out" style={{fontWeight:800,fontSize:14,color:sCol}}>{sPct}%</span>
            </div>
          </div>);
        })}
      </div>

      {(function(){
        var timeGateOk=xpGrant?xpGrant.timeGateOk:(result.timeUsed||0)>=300;
        var mult=xpGrant?xpGrant.mult:1;
        var gxp=xpGrant?xpGrant.gxp:0;
        if(!timeGateOk)return(<div style={{marginBottom:20}}>
          <div className="out" style={{fontSize:16,fontWeight:700,color:"var(--t3)"}}>+0 XP</div>
          <div style={{fontSize:11,color:"var(--red)",marginTop:2}}>Completed in under 5 min — XP not counted</div>
          <div style={{fontSize:10,color:"var(--t3)",marginTop:2}}>Your TOEIC results are saved</div>
        </div>);
        if(mult===1)return(<div className="out" style={{fontSize:20,fontWeight:800,color:"var(--gold)",marginBottom:20}}>+{gxp} XP</div>);
        if(mult>0)return(<div style={{marginBottom:20}}>
          <div className="out" style={{fontSize:18,fontWeight:800,color:"var(--orange)"}}>+{gxp} XP</div>
          <div style={{fontSize:11,color:"var(--t3)",marginTop:2}}>Reduced XP — 2nd attempt today</div>
        </div>);
        return(<div style={{marginBottom:20}}>
          <div className="out" style={{fontSize:16,fontWeight:700,color:"var(--t3)"}}>+0 XP</div>
          <div style={{fontSize:11,color:"var(--red)",marginTop:2}}>Daily limit reached — come back tomorrow!</div>
          <div style={{fontSize:10,color:"var(--t3)",marginTop:2}}>Your TOEIC results are saved</div>
        </div>);
      })()}

      <button className="btn1" onClick={function(){setReviewMode(true);setReviewSection("p5");setReviewIdx(0);}}>📖 Review Answers</button>
      <button className="btn2" onClick={p.back} style={{marginTop:10,width:"100%"}}>Exit</button>
    </div>);
  }

  // ════════════════ REVIEW MODE ════════════════
  if(reviewMode&&result){
    var rItem=null;var rAnswer=-1;var rCorrect=-1;var rExpl="";var rTotal=0;var rLabel="";

    if(reviewSection==="p5"){
      rTotal=p5Qs.length;var q=p5Qs[reviewIdx];
      rLabel="Part 5 — Q"+(reviewIdx+1);rAnswer=ans.p5[reviewIdx];rCorrect=q.c;rExpl=q.x;
      rItem=(<div>
        <h3 className="qstem" style={{fontWeight:700,fontSize:16,lineHeight:1.5,marginBottom:16}}>{q.s}</h3>
        <div style={{display:"flex",flexDirection:"column",gap:8}}>
          {q.o.map(function(opt,i){
            var isCorrect=i===q.c;var isPicked=i===rAnswer;
            var bg=isCorrect?"rgba(0,230,118,.12)":isPicked?"rgba(255,71,87,.12)":"var(--bg2)";
            var bd=isCorrect?"var(--green)":isPicked?"var(--red)":"var(--bdr)";
            return(<div key={i} style={{display:"flex",alignItems:"center",gap:10,padding:"10px 14px",background:bg,border:"1px solid "+bd,borderRadius:10,fontSize:14}}>
              <span style={{fontWeight:700,color:isCorrect?"var(--green)":isPicked?"var(--red)":"var(--t3)",fontSize:12}}>{isCorrect?"✓":isPicked?"✗":String.fromCharCode(65+i)}</span>
              <span style={{color:"var(--t1)"}}>{opt}</span></div>);
          })}
        </div>
      </div>);
    } else if(reviewSection==="p6"){
      var tIdx=Math.floor(reviewIdx/4);var bIdx2=reviewIdx%4;
      rTotal=p6BlankCount;
      var t=p6Texts[tIdx];var blanksR=[];t.parts.forEach(function(pt){if(pt.blank)blanksR.push(pt);});
      var bl=blanksR[bIdx2];if(!bl){setReviewSection("p7");setReviewIdx(0);return null;}
      rLabel="Part 6 — Text "+(tIdx+1)+", Blank "+(bIdx2+1);rAnswer=ans.p6[tIdx][bIdx2];rCorrect=bl.correct;rExpl=bl.x;
      rItem=(<div>
        <div style={{fontSize:12,color:"var(--t2)",marginBottom:12}}>{t.type}: {t.subject}</div>
        <div style={{display:"flex",flexDirection:"column",gap:8}}>
          {bl.options.map(function(opt,i){
            var isCorrect=i===bl.correct;var isPicked=i===rAnswer;
            var bg=isCorrect?"rgba(0,230,118,.12)":isPicked?"rgba(255,71,87,.12)":"var(--bg2)";
            var bd=isCorrect?"var(--green)":isPicked?"var(--red)":"var(--bdr)";
            return(<div key={i} style={{display:"flex",alignItems:"center",gap:10,padding:"10px 14px",background:bg,border:"1px solid "+bd,borderRadius:10,fontSize:14}}>
              <span style={{fontWeight:700,color:isCorrect?"var(--green)":isPicked?"var(--red)":"var(--t3)",fontSize:12}}>{isCorrect?"✓":isPicked?"✗":String.fromCharCode(65+i)}</span>
              <span style={{color:"var(--t1)"}}>{typeof opt==="string"&&opt.length>60?opt.substring(0,57)+"…":opt}</span></div>);
          })}
        </div>
      </div>);
    } else if(reviewSection==="p7"){
      // Map flat index to passage + question
      var flatIdx=reviewIdx;var pi=0;var pqIdx=0;
      for(var pp=0;pp<p7Passages.length;pp++){
        if(flatIdx<p7Passages[pp].questions.length){pi=pp;pqIdx=flatIdx;break;}
        flatIdx-=p7Passages[pp].questions.length;
      }
      rTotal=p7QCount;
      var ps=p7Passages[pi];var pqr=ps.questions[pqIdx];
      rLabel="Part 7 — Passage "+(pi+1)+", Q"+(pqIdx+1);rAnswer=ans.p7[pi][pqIdx];rCorrect=pqr.correct;rExpl=pqr.x;
      rItem=(<div>
        <div style={{fontSize:11,color:"var(--t2)",marginBottom:8}}>{ps.type}</div>
        <h3 className="qstem" style={{fontWeight:700,fontSize:15,lineHeight:1.5,marginBottom:16}}>{pqr.q}</h3>
        <div style={{display:"flex",flexDirection:"column",gap:8}}>
          {pqr.options.map(function(opt,i){
            var isCorrect=i===pqr.correct;var isPicked=i===rAnswer;
            var bg=isCorrect?"rgba(0,230,118,.12)":isPicked?"rgba(255,71,87,.12)":"var(--bg2)";
            var bd=isCorrect?"var(--green)":isPicked?"var(--red)":"var(--bdr)";
            return(<div key={i} style={{display:"flex",alignItems:"center",gap:10,padding:"10px 14px",background:bg,border:"1px solid "+bd,borderRadius:10,fontSize:14}}>
              <span style={{fontWeight:700,color:isCorrect?"var(--green)":isPicked?"var(--red)":"var(--t3)",fontSize:12}}>{isCorrect?"✓":isPicked?"✗":String.fromCharCode(65+i)}</span>
              <span style={{color:"var(--t1)"}}>{opt}</span></div>);
          })}
        </div>
      </div>);
    }

    var allTotals={p5:p5Qs.length,p6:p6BlankCount,p7:p7QCount};
    function reviewNext(){
      var curTotal=reviewSection==="p5"?allTotals.p5:reviewSection==="p6"?allTotals.p6:allTotals.p7;
      if(reviewIdx<curTotal-1){setReviewIdx(reviewIdx+1);}
      else if(reviewSection==="p5"){setReviewSection("p6");setReviewIdx(0);}
      else if(reviewSection==="p6"){setReviewSection("p7");setReviewIdx(0);}
      else{setReviewMode(false);}
    }
    function reviewPrev(){
      if(reviewIdx>0){setReviewIdx(reviewIdx-1);}
      else if(reviewSection==="p7"&&p6BlankCount>0){setReviewSection("p6");setReviewIdx(p6BlankCount-1);}
      else if(reviewSection==="p6"){setReviewSection("p5");setReviewIdx(p5Qs.length-1);}
    }
    var isFirst=reviewSection==="p5"&&reviewIdx===0;
    var isLast=reviewSection==="p7"&&reviewIdx>=p7QCount-1;

    return(<div style={{padding:"20px 16px 40px"}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16}}>
        <button onClick={function(){setReviewMode(false);}} style={{background:"none",border:"none",color:"var(--t2)",cursor:"pointer",fontSize:14}}>← Results</button>
        <span className="out" style={{fontWeight:700,fontSize:13,color:"var(--purple)"}}>{rLabel}</span>
        <div style={{width:40}}/>
      </div>
      {rItem}
      {rExpl&&<div className="crd" style={{marginTop:16,padding:14,background:rAnswer===rCorrect?"rgba(0,230,118,.06)":"rgba(255,71,87,.06)",borderColor:rAnswer===rCorrect?"rgba(0,230,118,.15)":"rgba(255,71,87,.15)"}}>
        <p style={{fontSize:13,color:"var(--t2)",lineHeight:1.6}}>{rExpl}</p>
      </div>}
      <div className="rev-nav-spacer"/>
      <div className="rev-nav">
        <button className={"btn2"+(isFirst?" rev-nav-ghost":"")} onClick={reviewPrev} disabled={isFirst}>← Prev</button>
        <button className="btn1" onClick={reviewNext}>{isLast?"Back to Results":"Next →"}</button>
      </div>
    </div>);
  }

  return null;
}
