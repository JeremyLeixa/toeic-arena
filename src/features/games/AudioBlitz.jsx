// Extrait de src/App.jsx le 2026-09-15 (refactor split-app, REFACTOR_PLAN.md). Code déplacé tel quel.
import { GIcon } from "../../components/icons.jsx";
import { SessionResult } from "../../components/SessionResult.jsx";
import { SessionTop, ComboBanner, AnswerCard, NextBar, ListenDisc } from "../../components/SessionHud.jsx";
import { useSessionTrack } from "../../components/useSessionTrack.js";
import { AUDIO_BLITZ } from "../../data/audioBlitz.js";
import { stopCurrentListenAudio, setListenAudio, speak, stopListenAudio } from "../../lib/audio.js";
import { shuffle, shuffleOpts } from "../../lib/util.js";
import { moduleRef } from "../../lib/reviewRefs.js";
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
  var track=useSessionTrack(); // HUD de session (lot 5, 2026-09-20)
  // Le compte à rebours s'arrête pendant la feuille « Leave this round? » : sinon la question
  // expire sous une fenêtre modale, réponse perdue sans que l'élève ait rien pu faire.
  var pausedRef=useRef(false);

  // Options permutées par item (bonne réponse en B ou C 80 fois sur 90). L'audio ne lit que la
  // phrase (`text`), jamais les options : rien à transporter jusqu'au lecteur.
  var items=useMemo(function(){return shuffle(AUDIO_BLITZ.slice()).slice(0,TOTAL).map(function(it){var s=shuffleOpts(it.opts,it.c);return Object.assign({},it,{opts:s.opts,c:s.c});});},[]);

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
              if(pausedRef.current)return t;
              if(t<=1){
                clearInterval(timerRef.current);
                if(!answeredRef.current){answeredRef.current=true;track.record(false);sPk(-1);sP("fb");}
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
    sPk(i);track.record(i===items[ci].c);
    if(i===items[ci].c){sSc(sc+1);try{playCorrect();}catch(e){}}
    else{try{playWrong();}catch(e){}sSk(true);setTimeout(function(){sSk(false);},400);}
    sP("fb");
  }

  // Erreur enregistrée au clic « Next » : réponse fausse ou temps écoulé (pick=-1).
  function next(){
    var bq=items[ci];if(pick!==bq.c)mistakesRef.current.push({tag:"Audio Blitz",prompt:bq.q,yours:pick>=0?bq.opts[pick]:"(time's up)",correct:bq.opts[bq.c],why:"Transcript: “"+bq.text+"”",ref:moduleRef("ablitz",bq.id)});
    if(ci<items.length-1){sC(ci+1);sP("q");}
    else{sidRef.current=p.done(sc,TOTAL,25+sc*6,mistakesRef.current);sP("done");}
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
  var timerCol=timer<=3?"var(--red)":timer<=6?"var(--orange)":"var(--cyan)";

  return(<>
    <SessionTop n={TOTAL} cur={ci} results={track.results} streak={track.streak}
      onQuit={function(){clearInterval(timerRef.current);p.back();}}
      onSheet={function(open){pausedRef.current=open;}}
      aside={played>=2&&ph==="q"
        ?<span className="out" style={{fontSize:18,fontWeight:800,color:timerCol}}>{timer}</span>
        :<span className="out" style={{fontSize:13,color:"var(--t3)",fontWeight:600}}>{(ci+1)+"/"+TOTAL}</span>}/>
    <ComboBanner combo={track.combo}/>
    <div className={sk?"sk":""} style={{padding:"4px 16px 0"}}>

    {/* Écoute : même disque runique que le Listening (il porte aussi la réécoute unique). */}
    <div style={{marginTop:8,marginBottom:20}}>
      <ListenDisc playing={played<=1} onPlay={replay} disabled={played<2||replays>=1||ph!=="q"}
        playingLabel="Listening…"
        hint={replays>=1?"No more replays":"Tap to replay once"}/>
      {played>=2&&<p className="qstem" style={{fontWeight:700,fontSize:14,color:"var(--t1)",marginTop:16,textAlign:"center"}}>{it.q}</p>}
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

    {ph==="fb"&&<AnswerCard ok={pick===it.c} timeout={pick===-1} answer={String.fromCharCode(65+it.c)+". "+it.opts[it.c]}
      label="Transcript" why={"“"+it.text+"”"}/>}
    </div>
    {ph==="fb"&&<NextBar onNext={next} last={ci===items.length-1}/>}
  </>);
}
