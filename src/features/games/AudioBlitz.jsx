// Extrait de src/App.jsx le 2026-09-15 (refactor split-app, REFACTOR_PLAN.md). Code déplacé tel quel.
import { Bar } from "../../components/Bar.jsx";
import { GIcon } from "../../components/icons.jsx";
import { SessionResult } from "../../components/SessionResult.jsx";
import { AUDIO_BLITZ } from "../../data/audioBlitz.js";
import { stopCurrentListenAudio, setListenAudio, speak, stopListenAudio } from "../../lib/audio.js";
import { shuffle } from "../../lib/util.js";
import { playCorrect, playWrong } from "../../sounds.js";
import { useState, useRef, useMemo, useEffect } from "react";

// ─── AUDIO BLITZ — Listen & answer ───
export function AudioBlitz(p){
  var TOTAL=12;var TIMER_SEC=15;

  var[ci,sC]=useState(0);var[sc,sSc]=useState(0);var[ph,sP]=useState("intro");
  var[pick,sPk]=useState(-1);var[sk,sSk]=useState(false);
  var[timer,setTimer]=useState(TIMER_SEC);var[played,setPlayed]=useState(0); // 0=not yet, 1=playing, 2=ready
  var[replays,setReplays]=useState(0);
  var timerRef=useRef(null);var answeredRef=useRef(false);var bufferRef=useRef(null);
  var mistakesRef=useRef([]);var sidRef=useRef(0);

  var items=useMemo(function(){return shuffle(AUDIO_BLITZ.slice()).slice(0,TOTAL);},[]);

  // Auto-play audio when entering question phase
  useEffect(function(){
    if(ph!=="q")return;
    // Reset state for new question
    clearInterval(timerRef.current);clearTimeout(bufferRef.current);
    answeredRef.current=false;
    setPlayed(0);setReplays(0);sPk(-1);setTimer(TIMER_SEC);

    // Small delay before playing to let the screen render
    var playTimeout=setTimeout(function(){
      setPlayed(1);
      var it=items[ci];
      stopCurrentListenAudio();
      var audio=new Audio(it.audio);
      setListenAudio(audio);
      var usedTTS=false;
      var afterCalled=false;

      function afterAudio(){
        if(afterCalled)return;
        afterCalled=true;
        clearInterval(timerRef.current);
        bufferRef.current=setTimeout(function(){
          setPlayed(2);
          clearInterval(timerRef.current);
          timerRef.current=setInterval(function(){
            setTimer(function(t){
              if(t<=1){
                clearInterval(timerRef.current);
                if(!answeredRef.current){answeredRef.current=true;sPk(-1);sP("fb");}
                return 0;
              }
              return t-1;
            });
          },1000);
        },1500);
      }

      audio.onerror=function(){
        if(!usedTTS&&!afterCalled){usedTTS=true;speak(it.text,0.85);setTimeout(afterAudio,3000);}
      };
      audio.onended=function(){afterAudio();};
      audio.playbackRate=0.9;
      audio.play().catch(function(){
        if(!usedTTS&&!afterCalled){usedTTS=true;speak(it.text,0.85);setTimeout(afterAudio,3000);}
      });
    },500);

    return function(){clearInterval(timerRef.current);clearTimeout(bufferRef.current);clearTimeout(playTimeout);stopListenAudio();};
  },[ci,ph]);

  function replay(){
    if(replays>=1||played<2)return;
    setReplays(1);
    var it=items[ci];
    stopCurrentListenAudio();
    var audio=new Audio(it.audio);
    setListenAudio(audio);
    audio.onerror=function(){speak(it.text,0.85);};
    audio.playbackRate=0.9;
    audio.play().catch(function(){speak(it.text,0.85);});
  }

  function doAnswer(i){
    if(answeredRef.current||played<2)return;
    answeredRef.current=true;
    clearInterval(timerRef.current);
    sPk(i);
    if(i===items[ci].c){sSc(sc+1);try{playCorrect();}catch(e){}}
    else{try{playWrong();}catch(e){}sSk(true);setTimeout(function(){sSk(false);},400);}
    sP("fb");
  }

  // Erreur enregistrée au clic « Next » : réponse fausse ou temps écoulé (pick=-1).
  function next(){
    var bq=items[ci];if(pick!==bq.c)mistakesRef.current.push({tag:"Audio Blitz",prompt:bq.q,yours:pick>=0?bq.opts[pick]:"(time's up)",correct:bq.opts[bq.c],why:"Transcript: “"+bq.text+"”"});
    if(ci<items.length-1){sC(ci+1);sP("q");}
    else{sidRef.current=p.done(sc,TOTAL,25+sc*6);sP("done");}
  }

  // ═══ INTRO ═══
  if(ph==="intro")return(<div className="enter" style={{padding:"20px 16px",minHeight:"100vh",display:"flex",flexDirection:"column",justifyContent:"center",textAlign:"center"}}>
    <div style={{marginBottom:16,display:"flex",justifyContent:"center"}}><GIcon name="lyre" size={60} color="var(--cyan)"/></div>
    <h1 className="out" style={{fontWeight:900,fontSize:26,marginBottom:8}}>Audio Blitz</h1>
    <p style={{color:"var(--t2)",fontSize:13,marginBottom:8,lineHeight:1.6}}>Listen to a short audio clip, then answer the question.<br/>The audio plays automatically — focus!</p>
    <div style={{display:"flex",justifyContent:"center",gap:16,marginBottom:32}}>
      <div style={{textAlign:"center"}}><div style={{fontSize:24}}>{"🔊"}</div><div style={{fontSize:11,color:"var(--t3)"}}>Auto-play</div></div>
      <div style={{textAlign:"center"}}><div style={{fontSize:24}}>{"🔁"}</div><div style={{fontSize:11,color:"var(--t3)"}}>1 replay</div></div>
      <div style={{textAlign:"center"}}><div style={{fontSize:24}}>{"⚡"}</div><div style={{fontSize:11,color:"var(--t3)"}}>{TIMER_SEC}s to answer</div></div>
    </div>
    <button className="btn1" onClick={function(){sP("q");}}>Start</button>
    <button className="btn2" onClick={p.back} style={{marginTop:12,width:"100%"}}>Back</button>
  </div>);

  // ═══ DONE ═══
  if(ph==="done")return(<SessionResult session={p.session} sid={sidRef.current} name="Audio Blitz" mistakes={mistakesRef.current}
    onContinue={function(){p.closeSession();p.back();}} onReplay={p.replaySession}/>);

  // ═══ PLAY ═══
  var it=items[ci];
  var timerPct=played>=2?timer/TIMER_SEC*100:100;
  var timerCol=timer<=3?"var(--red)":timer<=6?"var(--orange)":"var(--cyan)";

  return(<div className={sk?"sk":""} style={{padding:"20px 16px",minHeight:"100vh"}}>
    <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12}}>
      <div/>
      {played>=2&&ph==="q"&&<span className="out" style={{fontSize:20,fontWeight:800,color:timerCol}}>{timer}s</span>}
      <span className="out" style={{fontSize:13,color:"var(--t2)",fontWeight:600}}>{ci+1}/{TOTAL}</span>
    </div>
    <Bar value={ci} max={TOTAL} h={4} color="linear-gradient(90deg,#f59e0b,#ef4444)"/>

    {played>=2&&ph==="q"&&<div style={{height:4,background:"var(--bg3)",borderRadius:2,marginTop:8,marginBottom:16,overflow:"hidden"}}>
      <div style={{height:"100%",width:timerPct+"%",background:timerCol,borderRadius:2,transition:"width 1s linear"}}/></div>}

    {/* Audio status */}
    <div style={{textAlign:"center",marginTop:16,marginBottom:20}}>
      {played<=1&&<div style={{animation:"pulse 1.5s infinite"}}>
        <div style={{fontSize:48,marginBottom:8}}>{"🔊"}</div>
        <p className="out" style={{fontWeight:700,fontSize:16,color:"var(--cyan)"}}>Listening...</p>
      </div>}
      {played>=2&&ph==="q"&&<div>
        <p className="qstem" style={{fontWeight:700,fontSize:14,color:"var(--t1)",marginBottom:12}}>{it.q}</p>
        {replays===0&&<button onClick={replay} style={{background:"rgba(27,112,207,.1)",border:"1px solid rgba(27,112,207,.2)",
          borderRadius:10,padding:"8px 20px",cursor:"pointer",fontSize:12,color:"var(--purple)",fontWeight:600,fontFamily:"'DM Sans',sans-serif"}}>
          {"🔁"} Replay once</button>}
        {replays>=1&&<span style={{fontSize:11,color:"var(--t3)"}}>No more replays</span>}
      </div>}
    </div>

    {/* Options (only show after audio) */}
    {played>=2&&<div style={{display:"flex",flexDirection:"column",gap:8}}>
      {it.opts.map(function(opt,i){
        var show=ph==="fb";var isCor=i===it.c;var isPick=i===pick;
        var bg="var(--bg2)";var bd="var(--bdr)";
        if(show&&isCor){bg="rgba(0,230,118,.12)";bd="var(--green)";}
        else if(show&&isPick&&!isCor){bg="rgba(255,71,87,.12)";bd="var(--red)";}
        else if(ph==="q"&&isPick){bg="rgba(var(--cx),.1)";bd="var(--cyan)";}
        return(<button key={i} onClick={function(){doAnswer(i);}} disabled={show}
          style={{padding:"14px 16px",background:bg,border:"1px solid "+bd,borderRadius:12,
            cursor:ph==="q"?"pointer":"default",fontSize:14,color:"var(--t1)",textAlign:"left",
            fontFamily:"'DM Sans',sans-serif",transition:"all .2s",lineHeight:1.5}}>
          <span style={{fontSize:12,color:"var(--t3)",marginRight:8,fontWeight:700}}>{String.fromCharCode(65+i)}</span>
          {opt}
        </button>);
      })}
    </div>}

    {/* Feedback */}
    {ph==="fb"&&<div style={{marginTop:16,animation:"fadeIn .3s"}}>
      {pick===-1&&<div style={{textAlign:"center",marginBottom:12}}>
        <span className="out" style={{fontSize:16,fontWeight:700,color:"var(--red)"}}>{"⏰"} Time's up!</span></div>}
      <div className="crd" style={{padding:14,background:"rgba(var(--cx),.06)",borderColor:"rgba(var(--cx),.15)"}}>
        <p className="out" style={{fontWeight:700,fontSize:13,color:"var(--cyan)",marginBottom:6}}>Transcript:</p>
        <p style={{fontSize:13,color:"var(--t1)",lineHeight:1.6,fontStyle:"italic"}}>"{it.text}"</p>
      </div>
      <button className="btn1" onClick={next} style={{marginTop:12}}>{ci<items.length-1?"Next":"See Results"}</button>
    </div>}
	<button className="btn2" onClick={function(){clearInterval(timerRef.current);p.back();}} style={{marginTop:12,width:"100%"}}>Back</button>
  </div>);
}
