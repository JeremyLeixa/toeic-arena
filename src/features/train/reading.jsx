// Extrait de src/App.jsx le 2026-09-15 (refactor split-app, REFACTOR_PLAN.md). Code déplacé tel quel.
import { Bar } from "../../components/Bar.jsx";
import { GIcon } from "../../components/icons.jsx";
import { NextStepReco } from "../../components/NextStepReco.jsx";
import { SessionResult } from "../../components/SessionResult.jsx";
import { SessionTop, ComboBanner, AnswerCard, NextBar } from "../../components/SessionHud.jsx";
import { useSessionTrack } from "../../components/useSessionTrack.js";
import { PassageDocs } from "../../components/PassageDocs.jsx";
import { QUESTIONS } from "../../data/grammar.js";
import { PART6_TEXTS } from "../../data/part6.js";
import { PART7_PASSAGES } from "../../data/part7.js";
import { shuffle } from "../../lib/util.js";
import { shufP5 } from "../../lib/optionShuffle.js";
import { tone } from "../../lib/tone.js";
import { playCorrect, playWrong } from "../../sounds.js";
import { useMemo, useState, useRef, useEffect } from "react";
import { GrammarSheet } from "../../components/GrammarSheet.jsx";
import { GRAMMAR_SHEETS, CAT_SHEET } from "../../data/grammarSheets.js";

// ─── TIME MANAGEMENT SIMULATOR ───
export function TimeSim(p){
  var qs=useMemo(function(){return shuffle(QUESTIONS).slice(0,30).map(shufP5);},[]);
  var[ci,sC]=useState(0);var[sel,sS]=useState(-1);var[sc,sSc]=useState(0);var[ph,sP]=useState("intro");
  var[elapsed,sEl]=useState(0);var[answers,sAn]=useState([]);var timerRef=useRef(null);
  var mistakesRef=useRef([]);var sidRef=useRef(0);
  var[showReview,setShowReview]=useState(false);var[revIdx,setRevIdx]=useState(null);
  // Fiche de cours ouverte EN PLACE sous l'erreur relue (retour étudiant 2026-09-15) : avant,
  // « Review » naviguait vers Grammar Reference, ce qui démontait cette revue, et « Back »
  // renvoyait au menu Train — impossible de revenir aux autres erreurs.
  var[sheetOpen,setSheetOpen]=useState(false);
  var track=useSessionTrack(); // HUD de session (lot 4, 2026-09-20)
  var TARGET=600; // 10 minutes = 600 seconds
  var perQ=TARGET/30; // 20s per question target

  useEffect(function(){
    if(ph==="q"){timerRef.current=setInterval(function(){sEl(function(e){return e+1;});},1000);return function(){clearInterval(timerRef.current);};}
  },[ph]);

  function doAns(i){sS(i);var correct=i===qs[ci].c;track.record(null);if(!correct){var tq=qs[ci];mistakesRef.current.push({tag:tq.cat,prompt:tq.s,yours:tq.o[i],correct:tq.o[tq.c],why:tq.x,ref:{k:"drill:"+tq.id,cat:tq.cat,part:"p5"}});}if(correct){sSc(sc+1);try{playCorrect();}catch(e){}}else{try{playWrong();}catch(e){}}sAn(answers.concat([{q:ci,pick:i,correct:correct,time:elapsed}]));sP("next");}
  function nxt(){if(ci<qs.length-1){sC(ci+1);sS(-1);sP("q");}else{clearInterval(timerRef.current);sidRef.current=p.done(sc,qs.length,30+sc*5,mistakesRef.current);sP("done");}}

  function fmtTime(s){var m=Math.floor(s/60);var sec=s%60;return m+":"+(sec<10?"0":"")+sec;}
  var paceStatus=ph==="q"?elapsed/(ci+1):0;
  var ahead=paceStatus<=perQ;

  if(ph==="intro")return(<div className="enter" style={{padding:"20px 16px",minHeight:"100vh",display:"flex",flexDirection:"column",justifyContent:"center",textAlign:"center"}}>
    <div style={{marginBottom:16,display:"flex",justifyContent:"center"}}><GIcon name="sands-of-time" size={60} color="var(--cyan)"/></div>
    <h1 className="out" style={{fontWeight:900,fontSize:26,marginBottom:8}}>Part 5 Exam Simulation</h1>
    <p style={{color:"var(--t2)",fontSize:13,marginBottom:8,lineHeight:1.6}}>30 questions. 10 minutes. Just like the real TOEIC.</p>
    <div className="crd" style={{padding:16,marginBottom:20,textAlign:"left"}}>
      <p style={{fontSize:13,color:"var(--t2)",lineHeight:1.6,marginBottom:8}}>Target pace: <strong style={{color:"var(--cyan)"}}>{Math.round(perQ)}s per question</strong></p>
      <p style={{fontSize:13,color:"var(--t2)",lineHeight:1.6}}>A pace indicator will show if you're on track, ahead, or behind. No feedback during the exam — just like the real thing.</p></div>
    <button className="btn1" onClick={function(){sP("q");}}>Start Exam</button>
    <button className="btn2" onClick={p.back} style={{marginTop:12,width:"100%"}}>Back</button></div>);

  // Écran de fin commun ; l'analyse de l'examen (temps, grille, fiches) reste dessous en extra.
  if(ph==="done"){var totalTime=elapsed;

    return(<SessionResult session={p.session} sid={sidRef.current} name="Part 5 Exam Simulation" mistakes={mistakesRef.current}
      onContinue={function(){p.closeSession();p.back();}} onReplay={p.replaySession}>
    <div className="crd" style={{padding:16,marginBottom:16}}>
      <div style={{fontSize:14,color:"var(--t2)"}}>Total time: <strong style={{color:totalTime<=TARGET?"var(--green)":"var(--red)"}}>{fmtTime(totalTime)}</strong> / {fmtTime(TARGET)}</div>
      <div style={{fontSize:14,color:"var(--t2)",marginTop:4,marginBottom:14}}>Avg per question: <strong>{(totalTime/30).toFixed(1)}s</strong> (target: {Math.round(perQ)}s)</div>
      <p className="out" style={{fontSize:13,fontWeight:700,color:"var(--t1)",marginBottom:8}}>Performance Breakdown</p>
      <div style={{display:"flex",justifyContent:"space-between",marginBottom:8}}>
        <span style={{fontSize:13,color:"var(--t2)"}}>Accuracy</span>
        <span className="out" style={{fontWeight:700,color:"var(--cyan)"}}>{Math.round(sc/30*100)}%</span></div>
      <Bar value={sc} max={30} h={6} color={sc>=25?"var(--green)":sc>=18?"var(--cyan)":"var(--orange)"}/>
      <div style={{display:"flex",justifyContent:"space-between",marginTop:12,marginBottom:8}}>
        <span style={{fontSize:13,color:"var(--t2)"}}>Time Management</span>
        <span className="out" style={{fontWeight:700,color:totalTime<=TARGET?"var(--green)":"var(--red)"}}>{totalTime<=TARGET?"On target":"Over time"}</span></div>
      <Bar value={Math.min(TARGET,TARGET-(totalTime-TARGET))} max={TARGET} h={6} color={totalTime<=TARGET?"var(--green)":"var(--red)"}/>
    </div>

    {/* Answer grid toggle */}
    <button className={showReview?"btn1":"btn2"} onClick={function(){setShowReview(!showReview);setRevIdx(null);}}
      style={{width:"100%",marginBottom:16,fontSize:13}}>{showReview?"Hide Answer Grid":"📋 Review Answers"}</button>

    {showReview&&<div style={{marginBottom:20}}>
      {/* Grid overview */}
      <div style={{display:"grid",gridTemplateColumns:"repeat(10,1fr)",gap:4,marginBottom:16}}>
        {answers.map(function(a,i){
          return(<div key={i} onClick={function(){setSheetOpen(false);setRevIdx(revIdx===i?null:i);}}
            style={{padding:"8px 0",textAlign:"center",borderRadius:8,cursor:"pointer",fontSize:12,fontWeight:700,
              background:a.correct?"rgba(0,230,118,.15)":"rgba(255,71,87,.15)",
              border:revIdx===i?"2px solid var(--cyan)":"1.5px solid "+(a.correct?"rgba(0,230,118,.3)":"rgba(255,71,87,.3)"),
              color:a.correct?"var(--green)":"var(--red)",transition:"all .15s"}}>
            {i+1}
          </div>);
        })}
      </div>

      {/* Summary by category */}
      {function(){
        var cats={};
        answers.forEach(function(a,i){
          var cat=qs[a.q].cat;
          if(!cats[cat])cats[cat]={ok:0,total:0};
          cats[cat].total++;
          if(a.correct)cats[cat].ok++;
        });
        var catArr=Object.keys(cats).map(function(k){return{cat:k,ok:cats[k].ok,total:cats[k].total,pct:cats[k].total>0?Math.round(cats[k].ok/cats[k].total*100):0};});
        catArr.sort(function(a,b){return a.pct-b.pct;});
        return(<div className="crd" style={{padding:14,marginBottom:16}}>
          <p className="out" style={{fontSize:12,fontWeight:700,color:"var(--t2)",marginBottom:10}}>Score by Category</p>
          {catArr.map(function(c){
            var col=c.pct>=80?"var(--green)":c.pct>=50?"var(--orange)":"var(--red)";
            return(<div key={c.cat} style={{display:"flex",alignItems:"center",gap:8,marginBottom:6}}>
              <span style={{fontSize:11,color:"var(--t2)",flex:1,minWidth:0}}>{c.cat}</span>
              <span className="out" style={{fontSize:12,fontWeight:700,color:col,width:50,textAlign:"right"}}>{c.ok}/{c.total}</span>
              <div style={{width:60,height:5,background:"var(--bg3)",borderRadius:3,overflow:"hidden"}}>
                <div style={{height:"100%",width:c.pct+"%",background:col,borderRadius:3}}/></div>
            </div>);
          })}
        </div>);
      }()}

      {/* Detailed review for selected question */}
      {revIdx!==null&&function(){
        var a=answers[revIdx];var q=qs[a.q];
        
        var sheetId=CAT_SHEET[q.cat]||null;
        return(<div className="crd" style={{padding:16,animation:"fadeIn .2s",borderColor:a.correct?"rgba(0,230,118,.2)":"rgba(255,71,87,.2)"}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10}}>
            <span className="out" style={{fontSize:12,fontWeight:700,color:"var(--purple)",textTransform:"uppercase",letterSpacing:1}}>{q.cat}</span>
            <span style={{fontSize:11,color:a.correct?"var(--green)":"var(--red)",fontWeight:700}}>{a.correct?"Correct":"Wrong"} — Q{revIdx+1}</span>
          </div>
          <p className="qstem" style={{fontSize:15,fontWeight:700,lineHeight:1.5,marginBottom:14,color:"var(--t1)"}}>{q.s}</p>
          <div style={{display:"flex",flexDirection:"column",gap:6}}>
            {q.o.map(function(opt,i){
              var isCor=i===q.c;var isPick=i===a.pick;
              var bg="var(--bg2)";var bd="var(--bdr)";var txt="var(--t1)";
              if(isCor){bg="rgba(0,230,118,.1)";bd="var(--green)";txt="var(--green)";}
              else if(isPick&&!isCor){bg="rgba(255,71,87,.1)";bd="var(--red)";txt="var(--red)";}
              return(<div key={i} style={{display:"flex",alignItems:"center",gap:10,padding:"10px 12px",background:bg,border:"1px solid "+bd,borderRadius:10,fontSize:13,color:txt}}>
                <div style={{width:22,height:22,borderRadius:"50%",border:"2px solid "+(isCor?"var(--green)":isPick?"var(--red)":"var(--t3)"),
                  display:"flex",alignItems:"center",justifyContent:"center",fontSize:10,fontWeight:700,flexShrink:0,
                  background:isCor?"var(--green)":isPick&&!isCor?"var(--red)":"transparent",
                  color:isCor||isPick?/*fond local*/"#fff":"var(--t3)"}}>
                  {isCor?"✓":isPick?"✗":String.fromCharCode(65+i)}</div>
                <span style={{fontWeight:isCor||isPick?600:400}}>{opt}</span>
              </div>);
            })}
          </div>
          {q.x&&<div style={{marginTop:10,padding:10,background:"rgba(var(--cx),.06)",borderRadius:8,border:"1px solid rgba(var(--cx),.12)"}}>
            <p style={{fontSize:12,color:"var(--t2)",lineHeight:1.6}}>{q.x}</p>
          </div>}
          {sheetId&&<button onClick={function(){setSheetOpen(!sheetOpen);}} aria-expanded={sheetOpen}
            style={{marginTop:10,width:"100%",padding:"10px 14px",background:"rgba(59,130,246,.08)",border:"1px solid rgba(59,130,246,.2)",borderRadius:10,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",gap:8,fontFamily:"'DM Sans',sans-serif"}}>
            <span style={{fontSize:14}}>📖</span>
            <span className="out" style={{fontSize:12,fontWeight:600,color:tone("#3b82f6")}}>{sheetOpen?"Hide the lesson":"Review: "+q.cat}</span>
            <span style={{fontSize:12,color:tone("#3b82f6"),transition:"transform .2s",transform:sheetOpen?"rotate(90deg)":"rotate(0)"}}>{"›"}</span>
          </button>}
          {sheetId&&sheetOpen&&(function(){
            var g=GRAMMAR_SHEETS.find(function(s){return s.id===sheetId;});
            if(!g)return null;
            return(<div style={{marginTop:10,padding:"12px 14px",background:"var(--bg2)",border:"1px solid var(--bdr)",borderRadius:10,animation:"fadeIn .2s"}}>
              <div className="out" style={{fontSize:13,fontWeight:700,marginBottom:10}}>{g.icon} {g.title}</div>
              <GrammarSheet g={g}/>
              <button className="btn2" onClick={function(){p.closeSession();p.nav("gramref",sheetId);}} style={{width:"100%",marginTop:10,fontSize:12}}>Open the full Grammar Reference</button>
            </div>);
          })()}
          <div style={{display:"flex",gap:8,marginTop:12}}>
            <button className="btn2" onClick={function(){setSheetOpen(false);setRevIdx(revIdx-1);}} disabled={revIdx===0}
              style={{flex:1,fontSize:12,visibility:revIdx===0?"hidden":"visible"}}>← Prev</button>
            <button className="btn2" onClick={function(){setSheetOpen(false);setRevIdx(revIdx+1);}} disabled={revIdx>=answers.length-1}
              style={{flex:1,fontSize:12,visibility:revIdx>=answers.length-1?"hidden":"visible"}}>Next →</button>
          </div>
        </div>);
      }()}
    </div>}

    </SessionResult>);}

  // Active quiz (no feedback, exam mode) : marques NEUTRES dans le fil d'encre (track.record(null)),
  // chrono en aside, ni bannière de combo ni carte de réponse — l'examen ne dit rien avant la fin.
  var q=qs[ci];var timeColor=elapsed>TARGET?"var(--red)":elapsed>TARGET*0.8?"var(--orange)":"var(--t2)";
  var show=ph==="next";
  return(<>
    <SessionTop n={qs.length} cur={ci} results={track.results} onQuit={function(){clearInterval(timerRef.current);p.back();}}
      aside={<span className="out" style={{fontSize:16,fontWeight:800,color:timeColor}}>{fmtTime(elapsed)}</span>}
      sub={"Part 5 \u00b7 Question "+(ci+1)+"/"+qs.length}/>
    <div style={{padding:"4px 16px 0"}}>
      <div style={{display:"flex",alignItems:"center",justifyContent:"center",gap:8,marginBottom:20}}>
        <div style={{width:8,height:8,borderRadius:"50%",background:ahead?"var(--green)":"var(--red)"}}/>
        <span style={{fontSize:11,color:ahead?"var(--green)":"var(--red)",fontWeight:600}} className="out">{ahead?"On pace":"Behind pace"} — {(elapsed/(ci+1)).toFixed(0)}s/q (target: {Math.round(perQ)}s)</span>
      </div>
      <span className="out" style={{fontSize:11,fontWeight:600,color:"var(--purple)",textTransform:"uppercase",letterSpacing:1}}>{q.cat}</span>
      <h2 className="qstem" style={{fontWeight:700,fontSize:19,lineHeight:1.5,marginBottom:24,marginTop:8}}>{q.s}</h2>
      <div style={{display:"flex",flexDirection:"column",gap:10}}>
        {q.o.map(function(opt,i){
          // Aucun verdict : seule la réponse choisie est rappelée, en accent neutre.
          var isPick=show&&sel===i;
          return(<button key={i} onClick={function(){if(ph==="q")doAns(i);}} disabled={show}
            style={{display:"flex",alignItems:"center",gap:12,padding:"14px 16px",background:isPick?"rgba(var(--cx),.12)":"var(--bg2)",border:"1px solid "+(isPick?"var(--cyan)":"var(--bdr)"),borderRadius:12,cursor:ph==="q"?"pointer":"default",fontSize:15,color:"var(--t1)",textAlign:"left",fontFamily:"'DM Sans',sans-serif",transition:"all .2s"}}>
            <div style={{width:28,height:28,borderRadius:"50%",border:"2px solid "+(isPick?"var(--cyan)":"var(--t3)"),display:"flex",alignItems:"center",justifyContent:"center",fontSize:12,fontWeight:700,flexShrink:0,color:isPick?"var(--cyan)":"var(--t3)"}}>
              {String.fromCharCode(65+i)}</div>
            <span>{opt}</span></button>);})}
      </div>
    </div>
    {show&&<NextBar onNext={nxt} last={ci===qs.length-1} label={ci<qs.length-1?"Next question":"Finish exam"}/>}
  </>);
}
// ─── PART 6 TEXT COMPLETION ───
export function Part6Drill(p){
  var texts=useMemo(function(){return shuffle(PART6_TEXTS).slice(0,4);},[]);
  var[ti,sTi]=useState(0);var[bi,sBi]=useState(0);var[sc,sSc]=useState(0);var[totalB,sTB]=useState(0);
  var[ph,sP]=useState("intro");var[pick,sPk]=useState(-1);var[sk,sSk]=useState(false);
  var mistakesRef=useRef([]);var sidRef=useRef(0);

  // Count total blanks
  var totalBlanks=useMemo(function(){var c=0;texts.forEach(function(t){t.parts.forEach(function(p){if(p.blank)c++;});});return c;},[]);
  // Coupures du fil d'encre : un texte = un groupe de trous.
  var groups=texts.map(function(t){var c=0;t.parts.forEach(function(x){if(x.blank)c++;});return c;});
  var track=useSessionTrack(); // HUD de session (lot 4, 2026-09-20)

  // Get current text and its blanks
  var curText=texts[ti];
  var blanks=curText?curText.parts.filter(function(p){return p.blank;}):[];
  // Shuffle options for each blank — keep track of correct answer
  var shuffledBlanks=useMemo(function(){
    var all=[];
    texts.forEach(function(t){
      t.parts.forEach(function(p){
        if(!p.blank)return;
        var indices=[0,1,2,3];
        for(var i=indices.length-1;i>0;i--){var j=Math.floor(Math.random()*(i+1));var tmp=indices[i];indices[i]=indices[j];indices[j]=tmp;}
        all.push({options:indices.map(function(k){return p.options[k];}),correct:indices.indexOf(p.correct),x:p.x});
      });
    });
    return all;
  },[]);
  var blankOffset=useMemo(function(){var c=0;for(var i=0;i<ti;i++){texts[i].parts.forEach(function(p){if(p.blank)c++;});}return c;},[ti]);
  var curBlank=shuffledBlanks[blankOffset+bi];

  function doAns(i){
    sPk(i);track.record(i===curBlank.correct);
    if(i!==curBlank.correct){var bIdx=curText.parts.map(function(pt,k){return pt.blank?k:-1;}).filter(function(k){return k>=0;})[bi];var bef=((curText.parts[bIdx-1]||{}).text||"").slice(-90);var aft=((curText.parts[bIdx+1]||{}).text||"").slice(0,70);mistakesRef.current.push({tag:"Part 6 — "+(curText.type||"Text"),prompt:"…"+bef+"_____"+aft+"…",yours:curBlank.options[i],correct:curBlank.options[curBlank.correct],why:curBlank.x,ref:{k:"p6:"+curText.id+":"+bi,part:"p6"}});}
    if(i===curBlank.correct){sSc(sc+1);try{playCorrect();}catch(e){}}
    else{try{playWrong();}catch(e){}sSk(true);setTimeout(function(){sSk(false);},400);}
    sTB(totalB+1);sP("fb");
  }
  function nxt(){
    sPk(-1);
    if(bi<blanks.length-1){sBi(bi+1);sP("q");}
    else if(ti<texts.length-1){sTi(ti+1);sBi(0);sP("text");}
    else{sidRef.current=p.done(sc,totalBlanks,25+sc*5,mistakesRef.current);sP("done");}
  }

  if(ph==="intro")return(<div className="enter" style={{padding:"20px 16px",minHeight:"100vh",display:"flex",flexDirection:"column",justifyContent:"center",textAlign:"center"}}>
    <div style={{marginBottom:16,display:"flex",justifyContent:"center"}}><GIcon name="stone-tablet" size={60} color="var(--cyan)"/></div>
    <h1 className="out" style={{fontWeight:900,fontSize:26,marginBottom:8}}>Part 6 — Text Completion</h1>
    <p style={{color:"var(--t2)",fontSize:13,marginBottom:8,lineHeight:1.6}}>{texts.length} business texts with 4 blanks each.<br/>Read the full text, then complete the blanks.</p>
    <p style={{color:"var(--gold)",fontWeight:600,fontSize:14,marginBottom:32}}>Context is everything here!</p>
    <button className="btn1" onClick={function(){sP("text");}}>Start</button>
    <button className="btn2" onClick={p.back} style={{marginTop:12,width:"100%"}}>Back</button></div>);

  if(ph==="done")return(<SessionResult session={p.session} sid={sidRef.current} name="Part 6 — Text Completion" mistakes={mistakesRef.current}
    onContinue={function(){p.closeSession();p.back();}} onReplay={p.replaySession}>
    <NextStepReco u={p.u} fromMod="p6" nav={function(m,a){p.closeSession();p.nav(m,a);}}/>
  </SessionResult>);

  // Build text display with blanks highlighted
  function renderText(){
    var blankIdx=0;
    return curText.parts.map(function(part,i){
      if(part.blank){
        var thisIdx=blankIdx;blankIdx++;
        var isCurrent=thisIdx===bi;
        var answered=thisIdx<bi;
        var label=answered?blanks[thisIdx].options[blanks[thisIdx].correct]:"____("+(thisIdx+1)+")____";
        return <span key={i} style={{padding:"2px 6px",borderRadius:4,fontWeight:700,
          background:isCurrent?"rgba(var(--cx),.2)":answered?"rgba(0,230,118,.1)":"var(--bg3)",
          color:isCurrent?"var(--cyan)":answered?"var(--green)":"var(--t3)",
          border:isCurrent?"1px solid var(--cyan)":"1px solid transparent"}}>{label}</span>;
      }
      return <span key={i}>{part.text}</span>;
    });
  }

  // La barre reste posée sur la phase texte (elle fait partie de la manche), rendue hors du .enter.
  if(ph==="text")return(<>
    <SessionTop n={totalBlanks} cur={totalB} groups={groups} results={track.results} streak={track.streak} onQuit={p.back}
      sub={"Text "+(ti+1)+"/"+texts.length}/>
    <div className="enter" style={{padding:"4px 16px 0"}}>
    <div style={{display:"flex",gap:6,marginBottom:12}}>
      <span style={{fontSize:10,padding:"3px 8px",background:"rgba(27,112,207,.1)",color:"var(--purple)",borderRadius:6,fontWeight:600}} className="out">{curText.type}</span>
      <span style={{fontSize:10,padding:"3px 8px",background:"var(--bg3)",color:"var(--t3)",borderRadius:6}} className="out">From: {curText.from}</span></div>
    <div className="out" style={{fontWeight:700,fontSize:14,marginBottom:12,color:"var(--t1)"}}>Subject: {curText.subject}</div>
    <div className="crd" style={{padding:16,marginBottom:20}}>
      <p className="read-text" style={{fontSize:13,color:"var(--t2)",lineHeight:2,whiteSpace:"pre-line"}}>{renderText()}</p></div>
    <p style={{fontSize:12,color:"var(--t3)",textAlign:"center",marginBottom:16}}>Read the full text, then tap below to fill in the blanks.</p>
    </div>
    <NextBar onNext={function(){sP("q");}} label="Fill in the blanks"/>
  </>);

  // Question mode
  return(<>
    <SessionTop n={totalBlanks} cur={ph==="fb"?Math.max(0,totalB-1):totalB} groups={groups} results={track.results} streak={track.streak} onQuit={p.back}
      sub={"Text "+(ti+1)+"/"+texts.length+" \u00b7 Blank "+(bi+1)+"/"+blanks.length}/>
    <ComboBanner combo={track.combo}/>
    <div className={sk?"sk":""} style={{padding:"4px 16px 0"}}>
    <div style={{marginBottom:6}}>
      <span style={{fontSize:10,padding:"3px 8px",background:"rgba(27,112,207,.1)",color:"var(--purple)",borderRadius:6,fontWeight:600}} className="out">{curText.type}: {curText.subject}</span></div>
    <div className="crd" style={{padding:14,marginBottom:20,background:"var(--bg3)"}}>
      <p className="read-text" style={{fontSize:12,color:"var(--t2)",lineHeight:1.9,whiteSpace:"pre-line"}}>{renderText()}</p></div>
    <p className="out q-heading" style={{fontWeight:700,fontSize:14,marginBottom:12,color:"var(--cyan)"}}>Fill blank ({bi+1}):</p>
    <div className="read-opts" style={{display:"flex",flexDirection:"column",gap:8}}>
      {curBlank.options.map(function(opt,i){
        var isCor=i===curBlank.correct;var isPick=pick===i;var show=ph==="fb";
        var bg="var(--bg2)";var bd="var(--bdr)";
        if(show&&isCor){bg="rgba(0,230,118,.12)";bd="var(--green)";}
        else if(show&&isPick&&!isCor){bg="rgba(255,71,87,.12)";bd="var(--red)";}
        return(<button key={i} onClick={function(){if(ph==="q")doAns(i);}} disabled={show}
          style={{padding:"12px 14px",background:bg,border:"1px solid "+bd,borderRadius:12,cursor:ph==="q"?"pointer":"default",fontSize:14,color:"var(--t1)",textAlign:"left",fontFamily:"'DM Sans',sans-serif",transition:"all .2s"}}>
          {opt}</button>);})}
    </div>
    {ph==="fb"&&<AnswerCard ok={pick===curBlank.correct} answer={curBlank.options[curBlank.correct]} why={curBlank.x}/>}
    </div>
    {ph==="fb"&&<NextBar onNext={nxt} last={bi===blanks.length-1&&ti===texts.length-1}
      label={bi<blanks.length-1?"Next blank":(ti<texts.length-1?"Next text":null)}/>}
  </>);
}
export function Part7Read(p){
  var passages=useMemo(function(){return shuffle(PART7_PASSAGES).filter(function(p){return p&&p.questions&&p.questions.length>0;}).slice(0,4);},[]);
  var[pi,sPi]=useState(0);var[qi,sQi]=useState(0);var[sc,sSc]=useState(0);var[totalQ,sTQ]=useState(0);
  var[ph,sP]=useState("intro");var[pick,sPk]=useState(-1);var[sk,sSk]=useState(false);
  var[showQPreview,setShowQPreview]=useState(false);var[showText,setShowText]=useState(false);
  var mistakesRef=useRef([]);var sidRef=useRef(0);

  var totalQs=useMemo(function(){var c=0;passages.forEach(function(p){if(p&&p.questions)c+=p.questions.length;});return c;},[]);
  // Coupures du fil d'encre : un passage = un groupe de questions.
  var groups=passages.map(function(ps){return ps.questions.length;});
  var track=useSessionTrack(); // HUD de session (lot 4, 2026-09-20)
  var shuffledQMap=useMemo(function(){var m={};passages.forEach(function(ps){if(!ps||!ps.questions)return;m[ps.id]=ps.questions.map(function(q){var idx=[0,1,2,3];for(var i=idx.length-1;i>0;i--){var j=Math.floor(Math.random()*(i+1));var tmp=idx[i];idx[i]=idx[j];idx[j]=tmp;}return{options:idx.map(function(k){return q.options[k];}),correct:idx.indexOf(q.correct),x:q.x,q:q.q};});});return m;},[]);
  var curPass=passages[pi];
  var curQ=curPass&&shuffledQMap[curPass.id]?shuffledQMap[curPass.id][qi]:null;

  function doAns(i){
    sPk(i);track.record(i===curQ.correct);
    // ref : l'index de la question dans son passage (l'ordre n'est jamais permuté, seules les options le sont).
    if(i!==curQ.correct)mistakesRef.current.push({tag:"Part 7 — "+(curPass.type||"Passage"),prompt:curQ.q,yours:curQ.options[i],correct:curQ.options[curQ.correct],why:curQ.x,ref:{k:"p7:"+curPass.id+":"+qi,part:"p7"}});
    if(i===curQ.correct){sSc(sc+1);try{playCorrect();}catch(e){}}
    else{try{playWrong();}catch(e){}sSk(true);setTimeout(function(){sSk(false);},400);}
    sTQ(totalQ+1);sP("fb");
  }
  function nxt(){
    sPk(-1);
    if(qi<curPass.questions.length-1){sQi(qi+1);sP("q");}
    else if(pi<passages.length-1){sPi(pi+1);sQi(0);sP("read");}
    else{sidRef.current=p.done(sc,totalQs,30+sc*5,mistakesRef.current);sP("done");}
  }

  if(ph==="intro")return(<div className="enter" style={{padding:"20px 16px",minHeight:"100vh",display:"flex",flexDirection:"column",justifyContent:"center",textAlign:"center"}}>
    <div style={{marginBottom:16,display:"flex",justifyContent:"center"}}><GIcon name="bookmark" size={60} color="var(--cyan)"/></div>
    <h1 className="out" style={{fontWeight:900,fontSize:26,marginBottom:8}}>Part 7 — Reading</h1>
    <p style={{color:"var(--t2)",fontSize:13,marginBottom:8,lineHeight:1.6}}>{passages.length} passages with 3-4 questions each.<br/>Read the questions FIRST, then scan for answers!</p>
    <p style={{color:"var(--gold)",fontWeight:600,fontSize:14,marginBottom:32}}>Strategy: Questions first, then scan!</p>
    <button className="btn1" onClick={function(){sP("read");}}>Start</button>
    <button className="btn2" onClick={p.back} style={{marginTop:12,width:"100%"}}>Back</button></div>);

  if(ph==="done")return(<SessionResult session={p.session} sid={sidRef.current} name="Part 7 — Reading" mistakes={mistakesRef.current}
    onContinue={function(){p.closeSession();p.back();}} onReplay={p.replaySession}>
    <NextStepReco u={p.u} fromMod="p7" nav={function(m,a){p.closeSession();p.nav(m,a);}}/>
  </SessionResult>);

// Reading view — show passage with question preview toggle
  // La barre de session reste posée sur la phase de lecture : le passage fait partie de la manche.
  // SessionTop est rendu HORS du .enter (un fixed suit un parent qui anime transform).
  if(ph==="read")return(<>
    <SessionTop n={totalQs} cur={totalQ} groups={groups} results={track.results} streak={track.streak} onQuit={p.back}
      sub={"Passage "+(pi+1)+"/"+passages.length}/>
    <div className="enter" style={{padding:"4px 16px 0"}}>
    <div style={{display:"flex",gap:6,marginBottom:12}}>
      <span style={{fontSize:10,padding:"3px 8px",background:"rgba(59,130,246,.1)",color:tone("#3b82f6"),borderRadius:6,fontWeight:600}} className="out">{curPass.type}</span>
      <button onClick={function(){setShowQPreview(!showQPreview);}} style={{fontSize:10,padding:"3px 8px",background:showQPreview?"rgba(27,112,207,.15)":"var(--bg3)",color:showQPreview?"var(--purple)":"var(--t3)",borderRadius:6,border:"none",cursor:"pointer",fontWeight:600}} className="out">{showQPreview?"Hide questions \u25b2":"Preview questions \u25bc"} ({curPass.questions.length})</button></div>
    {showQPreview&&<div className="crd" style={{padding:12,marginBottom:12,borderColor:"rgba(27,112,207,.2)",background:"rgba(27,112,207,.04)"}}>
      <div style={{fontSize:10,color:"var(--purple)",fontWeight:700,textTransform:"uppercase",letterSpacing:1,marginBottom:8}}>Read these first!</div>
      {(shuffledQMap[curPass.id]||curPass.questions).map(function(q,i){return(<div key={i} style={{fontSize:12,color:"var(--t2)",lineHeight:1.6,padding:"4px 0",borderBottom:i<curPass.questions.length-1?"1px solid var(--bdr)":"none"}}><span style={{color:"var(--purple)",fontWeight:700}}>Q{i+1}.</span> {q.q}</div>);})}</div>}
    <div className="crd" style={{padding:16,marginBottom:16}}>
      <PassageDocs key={curPass.id} text={curPass.text} fontSize={13} lineHeight={1.8}/></div>
    </div>
    <NextBar onNext={function(){sP("q");setShowQPreview(false);setShowText(false);}} label="Answer questions"/>
  </>);

// Question mode
  return(<>
    <SessionTop n={totalQs} cur={ph==="fb"?Math.max(0,totalQ-1):totalQ} groups={groups} results={track.results} streak={track.streak} onQuit={p.back}
      sub={"Passage "+(pi+1)+"/"+passages.length+" \u00b7 Question "+(qi+1)+"/"+curPass.questions.length}/>
    <ComboBanner combo={track.combo}/>
    <div className={sk?"sk":""} style={{padding:"4px 16px 0"}}>
    <div style={{display:"flex",gap:6,marginBottom:6}}>
      <span style={{fontSize:10,padding:"3px 8px",background:"rgba(59,130,246,.1)",color:tone("#3b82f6"),borderRadius:6,fontWeight:600}} className="out">{curPass.type}</span>
      <button onClick={function(){setShowText(!showText);}} style={{fontSize:10,padding:"3px 8px",background:showText?"rgba(6,182,212,.15)":"var(--bg3)",color:showText?"var(--cyan)":"var(--t3)",borderRadius:6,border:"none",cursor:"pointer",fontWeight:600}} className="out">{showText?"Hide text \u25b2":"Show text \u25bc"}</button></div>
    {showText&&<div className="crd read-scroll" style={{padding:14,marginBottom:12,maxHeight:200,overflowY:"auto",borderColor:"rgba(6,182,212,.2)"}}>
      <PassageDocs key={curPass.id+"-q"} text={curPass.text} fontSize={12} lineHeight={1.7}/></div>}

    <h2 className="out q-heading" style={{fontWeight:700,fontSize:17,lineHeight:1.5,marginBottom:20,marginTop:4}}>{curQ.q}</h2>
    <div className="read-opts" style={{display:"flex",flexDirection:"column",gap:8}}>
      {curQ.options.map(function(opt,i){
        var isCor=i===curQ.correct;var isPick=pick===i;var show=ph==="fb";
        var bg="var(--bg2)";var bd="var(--bdr)";
        if(show&&isCor){bg="rgba(0,230,118,.12)";bd="var(--green)";}
        else if(show&&isPick&&!isCor){bg="rgba(255,71,87,.12)";bd="var(--red)";}
        return(<button key={i} onClick={function(){if(ph==="q")doAns(i);}} disabled={show}
          style={{display:"flex",alignItems:"center",gap:12,padding:"12px 14px",background:bg,border:"1px solid "+bd,borderRadius:12,cursor:ph==="q"?"pointer":"default",fontSize:14,color:"var(--t1)",textAlign:"left",fontFamily:"'DM Sans',sans-serif",transition:"all .2s"}}>
          <div style={{width:24,height:24,borderRadius:"50%",border:"2px solid "+(show&&isCor?"var(--green)":show&&isPick?"var(--red)":"var(--t3)"),display:"flex",alignItems:"center",justifyContent:"center",fontSize:11,fontWeight:700,flexShrink:0,background:show&&isCor?"var(--green)":show&&isPick&&!isCor?"var(--red)":"transparent",color:show&&(isCor||isPick)?"#fff":"var(--t3)"}}>
            {show&&isCor?"\u2713":show&&isPick?"\u2717":String.fromCharCode(65+i)}</div>
          <span>{opt}</span></button>);})}
    </div>
    {ph==="fb"&&<AnswerCard ok={pick===curQ.correct} answer={String.fromCharCode(65+curQ.correct)+". "+curQ.options[curQ.correct]} why={curQ.x}/>}
    </div>
    {ph==="fb"&&<NextBar onNext={nxt} last={qi===curPass.questions.length-1&&pi===passages.length-1}
      label={qi<curPass.questions.length-1?"Next question":(pi<passages.length-1?"Next passage":null)}/>}
  </>);
}
