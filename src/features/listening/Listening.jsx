// Extrait de src/App.jsx le 2026-09-15 (refactor split-app, REFACTOR_PLAN.md). Code déplacé tel quel.
import { GIcon, ResultIcon } from "../../components/icons.jsx";
import { ListeningGraphic } from "../../components/ListeningGraphic.jsx";
import { NextStepReco } from "../../components/NextStepReco.jsx";
import { HubTile, HubShelf } from "../../components/HubTile.jsx";
import { SessionResult } from "../../components/SessionResult.jsx";
import { SessionTop, ComboBanner, AnswerCard, NextBar, ListenDisc } from "../../components/SessionHud.jsx";
import { useSessionTrack } from "../../components/useSessionTrack.js";
import { GAME_ICON_PATHS } from "../../data/avatarIcons.js";
import { LISTENING_P1, LISTENING_P2, LISTENING_P3, LISTENING_P4 } from "../../data/listening.js";
import { isModuleLocked } from "../../lib/access.js";
import { hubItemStatus, hubSummary } from "../../lib/hubStatus.js";
import { resumeAudioSession, stopListenAudio, playAudioFile, playLetteredOption } from "../../lib/audio.js";
import { shufListeningItem } from "../../lib/listeningShuffle.js";
import { shuffle } from "../../lib/util.js";
import { playCorrect, playWrong } from "../../sounds.js";
import { useMemo, useState, useEffect, useRef } from "react";

// ─── LISTENING HUB ───
export function ListenHub(p){
  var parts=[
    {id:"lisP1",n:"Part 1 — Photographs",d:"10 random / "+LISTENING_P1.length,i:"eye-target",bg:"linear-gradient(135deg,#22c55e,#06b6d4)"},
    {id:"lisP2",n:"Part 2 — Question-Response",d:"10 random / "+LISTENING_P2.length,i:"chat-bubble",bg:"linear-gradient(135deg,#f59e0b,#ef4444)"},
    {id:"lisP3",n:"Part 3 — Conversations",d:"6 random / "+LISTENING_P3.length,i:"conversation",bg:"linear-gradient(135deg,#8b5cf6,#ec4899)"},
    {id:"lisP4",n:"Part 4 — Talks",d:"6 random / "+LISTENING_P4.length,i:"public-speaker",bg:"linear-gradient(135deg,#06b6d4,#3b82f6)"},
  ];
  return(<div className="enter" style={{padding:"20px 16px",minHeight:"100vh",display:"flex",flexDirection:"column",justifyContent:"center",textAlign:"center"}}>
    <div style={{marginBottom:16,display:"flex",justifyContent:"center"}}><GIcon name="ringing-bell" size={60} color="var(--cyan)"/></div>
    <h1 className="out" style={{fontWeight:900,fontSize:26,marginBottom:8}}>Listening Practice</h1>
    <p style={{color:"var(--t2)",fontSize:13,marginBottom:32,lineHeight:1.6}}>Train your ear for the TOEIC Listening section</p>
    <div style={{display:"flex",flexDirection:"column",gap:12,textAlign:"left"}}>
      <HubShelf id={"listening"} summary={hubSummary(p.u,parts.filter(function(m){return !isModuleLocked(m.id,p.u,p.groupType);}),{events:p.events})}/>
      {parts.map(function(m){var vl=isModuleLocked(m.id,p.u,p.groupType);return(
        <HubTile key={m.id} item={m} locked={vl} status={vl?null:hubItemStatus(p.u,m,{events:p.events})}
          onClick={function(){if(vl){p.onPremium(m.n);return;}p.nav(m.id);}}/>);})}
    </div>
    <button className="btn2" onClick={p.back} style={{marginTop:24,width:"100%"}}>Back</button>
  </div>);
}
// ─── PART 2 LISTENING ───
export function ListenP2(p){
  var items=useMemo(function(){return shuffle(LISTENING_P2).slice(0,10).map(shufListeningItem);},[]);
  var[ci,sC]=useState(0);var[sc,sSc]=useState(0);var[ph,sP]=useState("intro");var[pick,sPk]=useState(-1);
  var[playing,setPlaying]=useState(false);var[played,setPlayed]=useState(false);
  useEffect(function(){resumeAudioSession();return stopListenAudio;},[]);

  async function playQuestion(){
    if(playing)return;
    setPlaying(true);
    var it=items[ci];
    await playAudioFile("/audio/p2/"+it.id+"_q.mp3");
    await new Promise(function(r){setTimeout(r,400);});
    // it.aud[i] : la reponse jouee en position i est celle que l'UI affiche en
    // position i. Remettre "_"+i+" ici desaligne l'audio et le scoring. La lettre
    // (« A. », « B. »…) est un clip a part, joue avant l'option, dans la voix de l'item :
    // les clips d'options n'en contiennent plus (2026-09-16), l'ordre entendu est donc
    // toujours A, B, C, quelle que soit la permutation.
    for(var i=0;i<3;i++){
      await playLetteredOption("p2",it.id,i,"/audio/p2/"+it.id+"_"+it.aud[i]+".mp3");
      await new Promise(function(r){setTimeout(r,i<2?300:200);});
    }
    setPlaying(false);setPlayed(true);
  }

  var mistakesRef=useRef([]);var sidRef=useRef(0);
  var track=useSessionTrack(); // HUD de session (lot 3, 2026-09-20)
  function doAns(i){sPk(i);track.record(i===items[ci].c);if(i!==items[ci].c){var q2=items[ci];mistakesRef.current.push({tag:"Part 2 — Question-Response",prompt:q2.q,yours:q2.opts[i],correct:q2.opts[q2.c],why:q2.xq,ref:{k:"lisP2:"+q2.id,part:"p2"}});}if(i===items[ci].c){sSc(sc+1);try{playCorrect();}catch(e){}}sP("fb");}
  function nxt(){if(ci<items.length-1){sC(ci+1);sPk(-1);setPlayed(false);sP("listen");}else{sidRef.current=p.done(sc,items.length,25+sc*6,mistakesRef.current);sP("done");}}

  if(ph==="intro")return(<div className="enter" style={{padding:"20px 16px",minHeight:"100vh",display:"flex",flexDirection:"column",justifyContent:"center",textAlign:"center"}}>
    <div style={{marginBottom:16,display:"flex",justifyContent:"center"}}><GIcon name="chat-bubble" size={60} color="var(--cyan)"/></div>
    <h1 className="out" style={{fontWeight:900,fontSize:26,marginBottom:8}}>Part 2 — Question-Response</h1>
    <p style={{color:"var(--t2)",fontSize:13,marginBottom:8,lineHeight:1.6}}>You will hear a question followed by 3 responses.<br/>Choose the best response.</p>
    <p style={{color:"var(--gold)",fontWeight:600,fontSize:14,marginBottom:32}}>Listen carefully — audio plays once!</p>
    <button className="btn1" onClick={function(){sP("listen");}}>Start Listening</button>
    <button className="btn2" onClick={p.back} style={{marginTop:12,width:"100%"}}>Back</button></div>);

  if(ph==="done")return(<SessionResult session={p.session} sid={sidRef.current} name="Listening · Part 2" mistakes={mistakesRef.current}
    onContinue={function(){p.closeSession();p.back();}} onReplay={p.replaySession}/>);

  var it=items[ci];

  if(ph==="listen")return(<>
    <SessionTop n={items.length} cur={ci} results={track.results} streak={track.streak} onQuit={p.back}/>
    <ComboBanner combo={track.combo}/>
    <div style={{padding:"4px 16px 0"}}>
      <div className="out" style={{fontSize:11,color:"var(--orange)",textTransform:"uppercase",letterSpacing:1,fontWeight:600,marginBottom:8,textAlign:"center"}}>Part 2 — Question-Response</div>
      <ListenDisc playing={playing} onPlay={playQuestion} hint={played?"Tap to hear it again":"Tap to play audio"}/>
      {played&&<div style={{animation:"fadeIn .3s",marginTop:8}}>
        <p className="out" style={{color:"var(--green)",fontSize:13,fontWeight:600,textAlign:"center",marginBottom:16}}>Choose your answer</p>
        <div style={{display:"flex",flexDirection:"column",gap:10,textAlign:"left"}}>
          {it.opts.map(function(opt,i){
            return(<button key={i} onClick={function(){doAns(i);}}
              style={{display:"flex",alignItems:"center",gap:12,padding:"14px 16px",background:"var(--bg2)",border:"1px solid var(--bdr)",borderRadius:12,cursor:"pointer",fontSize:14,color:"var(--t1)",textAlign:"left",fontFamily:"'DM Sans',sans-serif"}}>
              <div style={{width:28,height:28,borderRadius:"50%",border:"2px solid var(--t3)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:12,fontWeight:700,flexShrink:0,color:"var(--t3)"}}>
                {String.fromCharCode(65+i)}</div>
              <span>{opt}</span></button>);
          })}
        </div>
      </div>}
    </div>
  </>);

  return(<>
    <SessionTop n={items.length} cur={ci} results={track.results} streak={track.streak} onQuit={p.back}/>
    <ComboBanner combo={track.combo}/>
    <div style={{padding:"4px 16px 0"}}>
      <div className="crd" style={{padding:14,background:"rgba(27,112,207,.05)",borderColor:"rgba(27,112,207,.12)"}}>
        <p className="out" style={{fontSize:12,fontWeight:600,color:"var(--purple)",marginBottom:6}}>Question</p>
        <p style={{fontSize:14,color:"var(--t1)",lineHeight:1.5}}>{it.q}</p></div>
      <div style={{display:"flex",flexDirection:"column",gap:8,marginTop:16}}>
        {it.opts.map(function(opt,i){
          var isCor=i===it.c;var isPick=pick===i;
          var bg="var(--bg2)";var bd="var(--bdr)";
          if(isCor){bg="rgba(0,230,118,.12)";bd="var(--green)";}
          else if(isPick&&!isCor){bg="rgba(255,71,87,.12)";bd="var(--red)";}
          return(<div key={i} style={{display:"flex",alignItems:"center",gap:12,padding:"12px 14px",background:bg,border:"1px solid "+bd,borderRadius:12,fontSize:14,color:"var(--t1)"}}>
            <div style={{width:24,height:24,borderRadius:"50%",border:"2px solid "+(isCor?"var(--green)":isPick?"var(--red)":"var(--t3)"),display:"flex",alignItems:"center",justifyContent:"center",fontSize:11,fontWeight:700,flexShrink:0,background:isCor?"var(--green)":isPick&&!isCor?"var(--red)":"transparent",color:(isCor||isPick)?"#fff":"var(--t3)"}}>
              {isCor?"\u2713":isPick?"\u2717":String.fromCharCode(65+i)}</div>
            <span>{opt}</span></div>);
        })}
      </div>
      <AnswerCard ok={pick===it.c} answer={String.fromCharCode(65+it.c)+". "+it.opts[it.c]} why={it.x}/>
    </div>
    <NextBar onNext={nxt} last={ci===items.length-1}/>
  </>);
}
// ─── PART 1 LISTENING ───
export function ListenP1(p){
  var items=useMemo(function(){return shuffle(LISTENING_P1).slice(0,10).map(shufListeningItem);},[]);
  var[ci,sC]=useState(0);var[sc,sSc]=useState(0);var[ph,sP]=useState("intro");var[pick,sPk]=useState(-1);
  var[playing,setPlaying]=useState(false);var[played,setPlayed]=useState(false);var[curOpt,setCurOpt]=useState(-1);
  useEffect(function(){resumeAudioSession();return stopListenAudio;},[]);

  async function playStatements(){
    if(playing)return;
    setPlaying(true);
    var it=items[ci];
    for(var i=0;i<it.opts.length;i++){
      setCurOpt(i);
      // Lettre a part puis enonce (clips sans lettre depuis le 2026-09-16, voir playLetteredOption).
      await playLetteredOption("p1",it.id,i,"/audio/p1/"+it.id+"_"+it.aud[i]+".mp3");
      await new Promise(function(r){setTimeout(r,400);});
    }
    setCurOpt(-1);setPlaying(false);setPlayed(true);
  }

  var mistakesRef=useRef([]);var sidRef=useRef(0);
  var track=useSessionTrack(); // HUD de session (lot 3, 2026-09-20)
  function doAns(i){sPk(i);track.record(i===items[ci].c);if(i!==items[ci].c){var q1=items[ci];mistakesRef.current.push({tag:"Part 1 — Photographs",prompt:"Photo "+(ci+1)+": which statement describes it?",yours:q1.opts[i],correct:q1.opts[q1.c],why:q1.xq,ref:{k:"lisP1:"+q1.id,part:"p1"}});}if(i===items[ci].c){sSc(sc+1);try{playCorrect();}catch(e){}}sP("fb");}
  function nxt(){if(ci<items.length-1){sC(ci+1);sPk(-1);setPlayed(false);setCurOpt(-1);sP("listen");}else{sidRef.current=p.done(sc,items.length,20+sc*5,mistakesRef.current);sP("done");}}

  if(ph==="intro")return(<div className="enter" style={{padding:"20px 16px",minHeight:"100vh",display:"flex",flexDirection:"column",justifyContent:"center",textAlign:"center"}}>
    <div style={{marginBottom:16,display:"flex",justifyContent:"center"}}><GIcon name="eye-target" size={60} color="var(--cyan)"/></div>
    <h1 className="out" style={{fontWeight:900,fontSize:26,marginBottom:8}}>Part 1 — Photographs</h1>
    <p style={{color:"var(--t2)",fontSize:13,marginBottom:8,lineHeight:1.6}}>Look at the photograph, then listen to 4 statements.<br/>Choose the one that best describes the image.</p>
    <p style={{color:"var(--gold)",fontWeight:600,fontSize:14,marginBottom:32}}>Listen carefully to each statement!</p>
    <button className="btn1" onClick={function(){sP("listen");}}>Start Listening</button>
    <button className="btn2" onClick={p.back} style={{marginTop:12,width:"100%"}}>Back</button></div>);

  if(ph==="done")return(<SessionResult session={p.session} sid={sidRef.current} name="Listening · Part 1" mistakes={mistakesRef.current}
    onContinue={function(){p.closeSession();p.back();}} onReplay={p.replaySession}/>);

  var it=items[ci];

  // Le disque d'écoute remplace le bouton play en dégradé, et sert de « rejouer » une fois les énoncés
  // entendus (le bouton séparé disparaît).
  if(ph==="listen")return(<>
    <SessionTop n={items.length} cur={ci} results={track.results} streak={track.streak} onQuit={p.back}/>
    <ComboBanner combo={track.combo}/>
    <div style={{padding:"4px 16px 0"}}>
      <div style={{marginBottom:16,borderRadius:14,overflow:"hidden",border:"1px solid var(--bdr)"}}>
        <img className="p1-photo" src={it.img} alt="TOEIC photograph" style={{width:"100%",display:"block",objectFit:"contain"}}/>
      </div>
      <ListenDisc playing={playing} onPlay={playStatements}
        playingLabel={curOpt>=0?("Statement "+String.fromCharCode(65+curOpt)+"\u2026"):"Listening\u2026"}
        hint={played?"Tap to hear them again":"Tap to hear the 4 statements"}/>
      {played&&<div style={{animation:"fadeIn .3s",marginTop:8}}>
        <p className="out" style={{color:"var(--green)",fontSize:13,fontWeight:600,textAlign:"center",marginBottom:16}}>Which statement best describes the photograph?</p>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
          {["A","B","C","D"].map(function(letter,i){
            return(<button key={i} onClick={function(){doAns(i);}}
              style={{padding:"16px 12px",background:"var(--bg2)",border:"1px solid var(--bdr)",borderRadius:12,cursor:"pointer",textAlign:"center"}}>
              <div className="out" style={{fontWeight:800,fontSize:20,color:"var(--cyan)"}}>{letter}</div>
            </button>);
          })}
        </div>
      </div>}
    </div>
  </>);

  // Retour : photo, les 4 énoncés et l'explication dans la carte du HUD.
  return(<>
    <SessionTop n={items.length} cur={ci} results={track.results} streak={track.streak} onQuit={p.back}/>
    <ComboBanner combo={track.combo}/>
    <div style={{padding:"4px 16px 0"}}>
      <div style={{marginBottom:12,borderRadius:12,overflow:"hidden",border:"1px solid var(--bdr)"}}>
        <img className="p1-photo-sm" src={it.img} alt="TOEIC photograph" style={{width:"100%",display:"block",objectFit:"contain"}}/>
      </div>
      <div style={{display:"flex",flexDirection:"column",gap:6}}>
        {it.opts.map(function(opt,i){
          var isCor=i===it.c;var isPick=pick===i;
          var bg="var(--bg2)";var bd="var(--bdr)";
          if(isCor){bg="rgba(0,230,118,.12)";bd="var(--green)";}
          else if(isPick&&!isCor){bg="rgba(255,71,87,.12)";bd="var(--red)";}
          return(<div key={i} style={{display:"flex",alignItems:"center",gap:10,padding:"10px 12px",background:bg,border:"1px solid "+bd,borderRadius:10,fontSize:13,color:"var(--t1)"}}>
            <div style={{width:22,height:22,borderRadius:"50%",border:"2px solid "+(isCor?"var(--green)":isPick?"var(--red)":"var(--t3)"),display:"flex",alignItems:"center",justifyContent:"center",fontSize:10,fontWeight:700,flexShrink:0,background:isCor?"var(--green)":isPick&&!isCor?"var(--red)":"transparent",color:(isCor||isPick)?"#fff":"var(--t3)"}}>
              {isCor?"\u2713":isPick?"\u2717":String.fromCharCode(65+i)}</div>
            <span>{opt}</span></div>);
        })}
      </div>
      <AnswerCard ok={pick===it.c} answer={String.fromCharCode(65+it.c)+". "+it.opts[it.c]} why={it.x}/>
    </div>
    <NextBar onNext={nxt} last={ci===items.length-1}/>
  </>);
}
// ─── PART 3 CONVERSATIONS ───
export function ListenP3(p){
  var items=useMemo(function(){return shuffle(LISTENING_P3).slice(0,6).map(function(cv){return Object.assign({},cv,{qs:cv.qs.map(shufListeningItem)});});},[]);
  var[ci,sC]=useState(0);var[qi,sQi]=useState(0);var[sc,sSc]=useState(0);var[totalQ,sTQ]=useState(0);
  var[ph,sP]=useState("intro");var[pick,sPk]=useState(-1);
  var[playing,setPlaying]=useState(false);var[played,setPlayed]=useState(false);var[curLine,setCurLine]=useState(-1);
  var mistakesRef=useRef([]);var sidRef=useRef(0);
  useEffect(function(){resumeAudioSession();return stopListenAudio;},[]);

  var totalQs=useMemo(function(){var c=0;items.forEach(function(it){c+=it.qs.length;});return c;},[]);
  // Coupures du fil d'encre : une conversation = un groupe de questions. Et totalQ est incrémenté
  // au clic de réponse (c'est le compteur du score) : pendant le retour il désigne déjà la suivante,
  // d'où le -1 passé à cur, sinon le compteur saute une question sous les yeux de l'élève.
  var groups=items.map(function(x){return x.qs.length;});
  var track=useSessionTrack(); // HUD de session (lot 3, 2026-09-20)

  async function playConversation(){
    if(playing)return;
    setPlaying(true);
    var it=items[ci];
    for(var i=0;i<it.lines.length;i++){
      setCurLine(i);
      await playAudioFile("/audio/p3/"+it.id+"_line"+i+".mp3");
      await new Promise(function(r){setTimeout(r,300);});
    }
    setCurLine(-1);setPlaying(false);setPlayed(true);
  }
  // Play a single spoken question on demand (TOEIC-faithful per-question playback).
  // Files: {id}_q1.mp3 / _q2.mp3 / _q3.mp3 generated by scripts/generate-questions-p3p4.mjs.
  async function playQuestion(idx){try{await playAudioFile("/audio/p3/"+items[ci].id+"_q"+(idx+1)+".mp3");}catch(e){console.warn("[P3] question audio failed:",e&&e.message);}}

  function doAns(i){
    sPk(i);track.record(i===items[ci].qs[qi].c);if(i!==items[ci].qs[qi].c){var q34=items[ci].qs[qi];mistakesRef.current.push({tag:"Part 3 — Conversation"+" "+(ci+1),prompt:q34.q,yours:q34.opts[i],correct:q34.opts[q34.c],why:q34.x,ref:{k:"lisP3:"+items[ci].id+":"+qi,part:"p3"}});}if(i===items[ci].qs[qi].c){sSc(sc+1);try{playCorrect();}catch(e){}}else{try{playWrong();}catch(e){}}sTQ(totalQ+1);sP("fb");
  }
  function nxt(){
    sPk(-1);
    if(qi<items[ci].qs.length-1){var ni=qi+1;sQi(ni);sP("q");playQuestion(ni);}
    else if(ci<items.length-1){sC(ci+1);sQi(0);setPlayed(false);setCurLine(-1);sP("listen");}
    // totalQ est déjà incrémenté au clic de réponse : +1 comptait une question de trop (2026-09-17).
    else{sidRef.current=p.done(sc,totalQ,30+sc*5,mistakesRef.current);sP("done");}
  }

  if(ph==="intro")return(<div className="enter" style={{padding:"20px 16px",minHeight:"100vh",display:"flex",flexDirection:"column",justifyContent:"center",textAlign:"center"}}>
    <div style={{marginBottom:16,display:"flex",justifyContent:"center"}}><GIcon name="conversation" size={60} color="var(--cyan)"/></div>
    <h1 className="out" style={{fontWeight:900,fontSize:26,marginBottom:8}}>Part 3 — Conversations</h1>
    <p style={{color:"var(--t2)",fontSize:13,marginBottom:8,lineHeight:1.6}}>Listen to short conversations between 2 people.<br/>Answer 3 questions about each conversation.</p>
    <p style={{color:"var(--gold)",fontWeight:600,fontSize:14,marginBottom:32}}>Read the questions BEFORE listening!</p>
    <button className="btn1" onClick={function(){sP("listen");}}>Start Listening</button>
    <button className="btn2" onClick={p.back} style={{marginTop:12,width:"100%"}}>Back</button></div>);

  if(ph==="done")return(<SessionResult session={p.session} sid={sidRef.current} name="Listening · Part 3" mistakes={mistakesRef.current}
    onContinue={function(){p.closeSession();p.back();}} onReplay={p.replaySession}>
    <NextStepReco u={p.u} fromMod="lisP3" nav={function(m,a){p.closeSession();p.nav(m,a);}}/>
  </SessionResult>);

  var it=items[ci];

  // Listen phase — show questions preview + play button
  if(ph==="listen")return(<>
    <SessionTop n={totalQs} cur={ph==="fb"?Math.max(0,totalQ-1):totalQ} groups={groups} results={track.results} streak={track.streak} onQuit={p.back}
      sub={"Conversation "+(ci+1)+"/"+items.length}/>
    <ComboBanner combo={track.combo}/>
    <div style={{padding:"4px 16px 0"}}>
      <div className="out" style={{fontSize:11,color:"var(--purple)",textTransform:"uppercase",letterSpacing:1,fontWeight:600,marginBottom:12}}>Preview the questions first</div>
      <div style={{display:"flex",flexDirection:"column",gap:6,marginBottom:20}}>
        {it.qs.map(function(q,i){return(<div key={i} className="crd" style={{padding:"10px 14px",background:"rgba(139,92,246,.04)",borderColor:"rgba(139,92,246,.1)"}}>
          <span style={{fontSize:12,color:"var(--t2)"}}>{(i+1)+". "+q.q}</span>{q.graphic&&<ListeningGraphic g={q.graphic}/>}</div>);})}
      </div>
      <ListenDisc playing={playing} onPlay={playConversation}
        playingLabel={curLine>=0?((it.lines[curLine].s.charAt(0)==="M"?"Man":"Woman")+" speaking\u2026"):"Listening\u2026"}
        hint={played?"Tap to hear it again":"Tap to hear the conversation"}/>
    </div>
    {played&&<NextBar onNext={function(){sP("q");playQuestion(0);}} label="Answer questions"/>}
  </>);

  // Question phase
  var curQ=it.qs[qi];
  return(<>
    <SessionTop n={totalQs} cur={ph==="fb"?Math.max(0,totalQ-1):totalQ} groups={groups} results={track.results} streak={track.streak} onQuit={p.back}
      sub={"Conversation "+(ci+1)+"/"+items.length+" \u00b7 Question "+(qi+1)+"/"+it.qs.length}/>
    <ComboBanner combo={track.combo}/>
    <div style={{padding:"4px 16px 0"}}>
      <h2 className="out" style={{fontWeight:700,fontSize:17,lineHeight:1.5,marginBottom:20,marginTop:4}}>{curQ.q}</h2>
      {curQ.graphic&&<ListeningGraphic g={curQ.graphic}/>}
      <div style={{display:"flex",flexDirection:"column",gap:8}}>
        {curQ.opts.map(function(opt,i){
          var isCor=i===curQ.c;var isPick=pick===i;var show=ph==="fb";
          var bg="var(--bg2)";var bd="var(--bdr)";
          if(show&&isCor){bg="rgba(0,230,118,.12)";bd="var(--green)";}
          else if(show&&isPick&&!isCor){bg="rgba(255,71,87,.12)";bd="var(--red)";}
          return(<button key={i} onClick={function(){if(ph==="q")doAns(i);}} disabled={show}
            style={{display:"flex",alignItems:"center",gap:12,padding:"14px 16px",background:bg,border:"1px solid "+bd,borderRadius:12,cursor:ph==="q"?"pointer":"default",fontSize:14,color:"var(--t1)",textAlign:"left",fontFamily:"'DM Sans',sans-serif",transition:"all .2s"}}>
            <div style={{width:26,height:26,borderRadius:"50%",border:"2px solid "+(show&&isCor?"var(--green)":show&&isPick?"var(--red)":"var(--t3)"),display:"flex",alignItems:"center",justifyContent:"center",fontSize:11,fontWeight:700,flexShrink:0,background:show&&isCor?"var(--green)":show&&isPick&&!isCor?"var(--red)":"transparent",color:show&&(isCor||isPick)?"#fff":"var(--t3)"}}>
              {show&&isCor?"\u2713":show&&isPick?"\u2717":String.fromCharCode(65+i)}</div>
            <span>{opt}</span></button>);})}
      </div>
      {/* Les questions de Part 3 n'ont pas d'explication : bandeau seul. */}
      {ph==="fb"&&<AnswerCard ok={pick===curQ.c} answer={String.fromCharCode(65+curQ.c)+". "+curQ.opts[curQ.c]}/>}
    </div>
    {ph==="fb"&&<NextBar onNext={nxt} last={qi===it.qs.length-1&&ci===items.length-1}
      label={qi<it.qs.length-1?"Next question":(ci<items.length-1?"Next conversation":undefined)}/>}
  </>);
}
// ─── PART 4 TALKS ───
export function ListenP4(p){
  var items=useMemo(function(){return shuffle(LISTENING_P4).slice(0,6).map(function(tk){return Object.assign({},tk,{qs:tk.qs.map(shufListeningItem)});});},[]);
  var[ci,sC]=useState(0);var[qi,sQi]=useState(0);var[sc,sSc]=useState(0);var[totalQ,sTQ]=useState(0);
  var[ph,sP]=useState("intro");var[pick,sPk]=useState(-1);
  var[playing,setPlaying]=useState(false);var[played,setPlayed]=useState(false);
  var mistakesRef=useRef([]);var sidRef=useRef(0);
  useEffect(function(){resumeAudioSession();return stopListenAudio;},[]);

  var totalQs=useMemo(function(){var c=0;items.forEach(function(it){c+=it.qs.length;});return c;},[]);
  // Coupures du fil d'encre : un talk = un groupe de questions. Et totalQ est incrémenté
  // au clic de réponse (c'est le compteur du score) : pendant le retour il désigne déjà la suivante,
  // d'où le -1 passé à cur, sinon le compteur saute une question sous les yeux de l'élève.
  var groups=items.map(function(x){return x.qs.length;});
  var track=useSessionTrack(); // HUD de session (lot 3, 2026-09-20)

  async function playTalk(){
    if(playing)return;
    setPlaying(true);
    await playAudioFile("/audio/p4/"+items[ci].id+".mp3");
    setPlaying(false);setPlayed(true);
  }
  // Play a single spoken question on demand (TOEIC-faithful per-question playback).
  // Files: {id}_q1.mp3 / _q2.mp3 / _q3.mp3 generated by scripts/generate-questions-p3p4.mjs.
  async function playQuestion(idx){try{await playAudioFile("/audio/p4/"+items[ci].id+"_q"+(idx+1)+".mp3");}catch(e){console.warn("[P4] question audio failed:",e&&e.message);}}

  function doAns(i){
    sPk(i);track.record(i===items[ci].qs[qi].c);if(i!==items[ci].qs[qi].c){var q34=items[ci].qs[qi];mistakesRef.current.push({tag:"Part 4 — Talk"+" "+(ci+1),prompt:q34.q,yours:q34.opts[i],correct:q34.opts[q34.c],why:q34.x,ref:{k:"lisP4:"+items[ci].id+":"+qi,part:"p4"}});}if(i===items[ci].qs[qi].c){sSc(sc+1);try{playCorrect();}catch(e){}}else{try{playWrong();}catch(e){}}sTQ(totalQ+1);sP("fb");
  }
  function nxt(){
    sPk(-1);
    if(qi<items[ci].qs.length-1){var ni=qi+1;sQi(ni);sP("q");playQuestion(ni);}
    else if(ci<items.length-1){sC(ci+1);sQi(0);setPlayed(false);sP("listen");}
    // totalQ est déjà incrémenté au clic de réponse : +1 comptait une question de trop (2026-09-17).
    else{sidRef.current=p.done(sc,totalQ,30+sc*5,mistakesRef.current);sP("done");}
  }

  if(ph==="intro")return(<div className="enter" style={{padding:"20px 16px",minHeight:"100vh",display:"flex",flexDirection:"column",justifyContent:"center",textAlign:"center"}}>
    <div style={{marginBottom:16,display:"flex",justifyContent:"center"}}><GIcon name="public-speaker" size={60} color="var(--cyan)"/></div>
    <h1 className="out" style={{fontWeight:900,fontSize:26,marginBottom:8}}>Part 4 — Talks</h1>
    <p style={{color:"var(--t2)",fontSize:13,marginBottom:8,lineHeight:1.6}}>Listen to short talks: announcements, voicemails, reports.<br/>Answer 3 questions about each talk.</p>
    <p style={{color:"var(--gold)",fontWeight:600,fontSize:14,marginBottom:32}}>Read the questions BEFORE listening!</p>
    <button className="btn1" onClick={function(){sP("listen");}}>Start Listening</button>
    <button className="btn2" onClick={p.back} style={{marginTop:12,width:"100%"}}>Back</button></div>);

  if(ph==="done")return(<SessionResult session={p.session} sid={sidRef.current} name="Listening · Part 4" mistakes={mistakesRef.current}
    onContinue={function(){p.closeSession();p.back();}} onReplay={p.replaySession}>
    <NextStepReco u={p.u} fromMod="lisP4" nav={function(m,a){p.closeSession();p.nav(m,a);}}/>
  </SessionResult>);

  var it=items[ci];

  if(ph==="listen")return(<>
    <SessionTop n={totalQs} cur={ph==="fb"?Math.max(0,totalQ-1):totalQ} groups={groups} results={track.results} streak={track.streak} onQuit={p.back}
      sub={it.type+" "+(ci+1)+"/"+items.length}/>
    <ComboBanner combo={track.combo}/>
    <div style={{padding:"4px 16px 0"}}>
      <div className="out" style={{fontSize:11,color:"var(--cyan)",textTransform:"uppercase",letterSpacing:1,fontWeight:600,marginBottom:12}}>Preview the questions first</div>
      <div style={{display:"flex",flexDirection:"column",gap:6,marginBottom:20}}>
        {it.qs.map(function(q,i){return(<div key={i} className="crd" style={{padding:"10px 14px",background:"rgba(6,182,212,.04)",borderColor:"rgba(6,182,212,.1)"}}>
          <span style={{fontSize:12,color:"var(--t2)"}}>{(i+1)+". "+q.q}</span>{q.graphic&&<ListeningGraphic g={q.graphic}/>}</div>);})}
      </div>
      <ListenDisc playing={playing} onPlay={playTalk} hint={played?"Tap to hear it again":"Tap to hear the talk"}/>
    </div>
    {played&&<NextBar onNext={function(){sP("q");playQuestion(0);}} label="Answer questions"/>}
  </>);

  var curQ=it.qs[qi];
  return(<>
    <SessionTop n={totalQs} cur={ph==="fb"?Math.max(0,totalQ-1):totalQ} groups={groups} results={track.results} streak={track.streak} onQuit={p.back}
      sub={it.type+" "+(ci+1)+"/"+items.length+" \u00b7 Question "+(qi+1)+"/"+it.qs.length}/>
    <ComboBanner combo={track.combo}/>
    <div style={{padding:"4px 16px 0"}}>
      <h2 className="out" style={{fontWeight:700,fontSize:17,lineHeight:1.5,marginBottom:20,marginTop:4}}>{curQ.q}</h2>
      {curQ.graphic&&<ListeningGraphic g={curQ.graphic}/>}
      <div style={{display:"flex",flexDirection:"column",gap:8}}>
        {curQ.opts.map(function(opt,i){
          var isCor=i===curQ.c;var isPick=pick===i;var show=ph==="fb";
          var bg="var(--bg2)";var bd="var(--bdr)";
          if(show&&isCor){bg="rgba(0,230,118,.12)";bd="var(--green)";}
          else if(show&&isPick&&!isCor){bg="rgba(255,71,87,.12)";bd="var(--red)";}
          return(<button key={i} onClick={function(){if(ph==="q")doAns(i);}} disabled={show}
            style={{display:"flex",alignItems:"center",gap:12,padding:"14px 16px",background:bg,border:"1px solid "+bd,borderRadius:12,cursor:ph==="q"?"pointer":"default",fontSize:14,color:"var(--t1)",textAlign:"left",fontFamily:"'DM Sans',sans-serif",transition:"all .2s"}}>
            <div style={{width:26,height:26,borderRadius:"50%",border:"2px solid "+(show&&isCor?"var(--green)":show&&isPick?"var(--red)":"var(--t3)"),display:"flex",alignItems:"center",justifyContent:"center",fontSize:11,fontWeight:700,flexShrink:0,background:show&&isCor?"var(--green)":show&&isPick&&!isCor?"var(--red)":"transparent",color:show&&(isCor||isPick)?"#fff":"var(--t3)"}}>
              {show&&isCor?"\u2713":show&&isPick?"\u2717":String.fromCharCode(65+i)}</div>
            <span>{opt}</span></button>);})}
      </div>
      {/* Les questions de Part 4 n'ont pas d'explication : bandeau seul. */}
      {ph==="fb"&&<AnswerCard ok={pick===curQ.c} answer={String.fromCharCode(65+curQ.c)+". "+curQ.opts[curQ.c]}/>}
    </div>
    {ph==="fb"&&<NextBar onNext={nxt} last={qi===it.qs.length-1&&ci===items.length-1}
      label={qi<it.qs.length-1?"Next question":(ci<items.length-1?"Next talk":undefined)}/>}
  </>);
}
// ─── READING HUB ───
export function ReadingHub(p){
  var parts=[
    {id:"drill",n:"Part 5 — Sentence Completion",d:"10 random questions from 100",i:"quill-ink",bg:"linear-gradient(135deg,#00e676,#00bfa5)"},
    {id:"timesim",n:"Part 5 — Exam Simulation",d:"30 Qs in 10 min, real pace",i:"sands-of-time",bg:"linear-gradient(135deg,#8b5cf6,#6366f1)"},
    {id:"p6",n:"Part 6 — Text Completion",d:"Business texts with blanks",i:"stone-tablet",bg:"linear-gradient(135deg,#c4587a,#8b5e83)"},
    {id:"p7",n:"Part 7 — Reading Comprehension",d:"Passages + questions",i:"bookmark",bg:"linear-gradient(135deg,#3b82f6,#06b6d4)"},
  ];
  return(<div className="enter" style={{padding:"20px 16px",minHeight:"100vh",display:"flex",flexDirection:"column",justifyContent:"center",textAlign:"center"}}>
    <div style={{marginBottom:16,display:"flex",justifyContent:"center"}}><GIcon name="bookmarklet" size={60} color="var(--cyan)"/></div>
    <h1 className="out" style={{fontWeight:900,fontSize:26,marginBottom:8}}>Reading Practice</h1>
    <p style={{color:"var(--t2)",fontSize:13,marginBottom:32,lineHeight:1.6}}>Train for the TOEIC Reading section</p>
    <div style={{display:"flex",flexDirection:"column",gap:12,textAlign:"left"}}>
      <HubShelf id={"reading"} summary={hubSummary(p.u,parts.filter(function(m){return !isModuleLocked(m.id,p.u,p.groupType);}),{events:p.events})}/>
      {parts.map(function(m){var vl=isModuleLocked(m.id,p.u,p.groupType);return(
        <HubTile key={m.id} item={m} locked={vl} status={vl?null:hubItemStatus(p.u,m,{events:p.events})}
          onClick={function(){if(vl){p.onPremium(m.n);return;}p.nav(m.id);}}/>);})}
    </div>
    <button className="btn2" onClick={p.back} style={{marginTop:24,width:"100%"}}>Back</button>
  </div>);
}
