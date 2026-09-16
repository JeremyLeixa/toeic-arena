// Extrait de src/App.jsx le 2026-09-15 (refactor split-app, REFACTOR_PLAN.md). Code déplacé tel quel.
import { GIcon } from "../../components/icons.jsx";
import { VOCAB } from "../../data/vocab.js";
import { shuffle } from "../../lib/util.js";
import { playCorrect, playWrong } from "../../sounds.js";
import { supabase } from "../../supabase.js";
import { useState, useRef, useMemo, useEffect } from "react";

// ─── VOCABULARY ARENA — Real-time multiplayer vocabulary game ───
export function DuelArena(p){
  var ROUNDS=10;var TIMER_SEC=12;
  var RANK_PTS=[100,80,60,50];var RANK_MIN=40;
  var MEDALS=["🥇","🥈","🥉"];

  var[phase,setPhase]=useState("hub"); // hub|pickAction|create|join|lobby|countdown|play|feedback|done
  var[roomCode,setRoomCode]=useState("");
  var[inputCode,setInputCode]=useState("");
  var[isHost,setIsHost]=useState(false);
  var[myName]=useState(p.u.name);
  var[questions,setQuestions]=useState([]);
  var[qi,setQi]=useState(0);
  var[myPick,setMyPick]=useState(-1);
  var[myScore,setMyScore]=useState(0);
  var[timer,setTimer]=useState(TIMER_SEC);
  var[countdown,setCountdown]=useState(3);
  var[error,setError]=useState(null);
  var[roundResults,setRoundResults]=useState([]); // [{qi, ranking:[{pid,name,pick,time,pts}], correct, myPts}]
  var[wager,setWager]=useState(0);
  var[customWager,setCustomWager]=useState("");
  var[wagerPopup,setWagerPopup]=useState(null);
  var[playerCount,setPlayerCount]=useState(1); // includes self
  var[answeredCount,setAnsweredCount]=useState(0); // how many answered this round
  var[roundRanking,setRoundRanking]=useState([]); // current round ranking for feedback
  var[finalRanking,setFinalRanking]=useState([]); // [{pid,name,score}]
  var[expectedPlayers,setExpectedPlayers]=useState(2);

  var channelRef=useRef(null);
  var timerRef=useRef(null);
  var countdownRef=useRef(null);
  var fallbackRef=useRef(null);
  var answeredRef=useRef(false);
  var myIdRef=useRef("p_"+Math.random().toString(36).substring(2,8));
  var hostRef=useRef(false);
  var myScoreRef=useRef(0);

  // Refs immune to stale closures
  var allAnswersRef=useRef({}); // {pid: {pick, time, name}}
  var playersRef=useRef({}); // {pid: {name}} — all players including self
  var questionsRef=useRef([]);
  var qiRef=useRef(0);
  var phaseRef=useRef("hub");
  var expectedRef=useRef(2);
  var scoresRef=useRef({}); // {pid: totalScore}

  // Keep refs in sync
  questionsRef.current=questions;
  qiRef.current=qi;
  phaseRef.current=phase;
  myScoreRef.current=myScore;
  hostRef.current=isHost;
  expectedRef.current=expectedPlayers;

  // Build question pool from VOCAB
  var allCards=useMemo(function(){
    var cards=[];
    VOCAB.forEach(function(dom){dom.cards.forEach(function(c){cards.push(c);});});
    return cards;
  },[]);

  function generateQuestions(){
    var picked=shuffle(allCards.slice()).slice(0,ROUNDS);
    return picked.map(function(card){
      var pool=allCards.filter(function(c){return c.id!==card.id;});
      var dists=shuffle(pool).slice(0,3).map(function(c){return c.d;});
      var opts=shuffle(dists.concat([card.d]));
      return{word:card.w,opts:opts,c:opts.indexOf(card.d),ex:card.e};
    });
  }

  function genCode(){return String(Math.floor(100000+Math.random()*900000));}

  // ── Compute ranking from all answers ──
  function computeRanking(answers,question){
    var correct=[];var wrong=[];
    var pids=Object.keys(answers);
    for(var i=0;i<pids.length;i++){
      var pid=pids[i];var a=answers[pid];
      if(a.pick===question.c)correct.push({pid:pid,name:a.name,pick:a.pick,time:a.time});
      else wrong.push({pid:pid,name:a.name,pick:a.pick,time:a.time,pts:0});
    }
    // Sort correct by time descending (more time remaining = faster)
    correct.sort(function(a,b){return b.time-a.time;});
    for(var j=0;j<correct.length;j++){
      correct[j].pts=j<RANK_PTS.length?RANK_PTS[j]:RANK_MIN;
    }
    return correct.concat(wrong);
  }

  // ── Check if all players answered → transition to feedback (host only) ──
  function checkAllDone(){
    if(phaseRef.current!=="play")return;
    var answers=allAnswersRef.current;
    var count=Object.keys(answers).length;
    if(count<expectedRef.current)return;
    clearTimeout(fallbackRef.current);

    var qs2=questionsRef.current;var qi2=qiRef.current;
    if(!qs2[qi2])return;
    var ranking=computeRanking(answers,qs2[qi2]);

    // Update scores
    for(var i=0;i<ranking.length;i++){
      var r=ranking[i];
      if(!scoresRef.current[r.pid])scoresRef.current[r.pid]=0;
      scoresRef.current[r.pid]+=r.pts;
    }

    // Find my points
    var myEntry=ranking.find(function(r){return r.pid===myIdRef.current;});
    var myPts=myEntry?myEntry.pts:0;
    var myCorrect=myEntry&&myEntry.pick===qs2[qi2].c;
    setMyScore(function(s){return s+myPts;});
    try{if(myCorrect)playCorrect();else playWrong();}catch(e){}

    setRoundRanking(ranking);
    setRoundResults(function(prev){return prev.concat([{qi:qi2,ranking:ranking,correct:qs2[qi2].c,myPts:myPts}]);});
    setPhase("feedback");

    // Host broadcasts authoritative result
    if(channelRef.current){
      channelRef.current.send({type:"broadcast",event:"round_result",payload:{
        ranking:ranking,scores:scoresRef.current,correct:qs2[qi2].c,qi:qi2,pid:myIdRef.current
      }});
    }
  }

  // ── Channel cleanup ──
  useEffect(function(){
    return function(){
      if(channelRef.current){supabase.removeChannel(channelRef.current);channelRef.current=null;}
      clearInterval(timerRef.current);clearInterval(countdownRef.current);clearTimeout(fallbackRef.current);
    };
  },[]);

  // ── Play timer ──
  useEffect(function(){
    if(phase!=="play")return;
    setTimer(TIMER_SEC);
    timerRef.current=setInterval(function(){
      setTimer(function(t){
        if(t<=1){
          clearInterval(timerRef.current);
          if(!answeredRef.current){
            answeredRef.current=true;
            var ans={pick:-1,time:0};
            allAnswersRef.current[myIdRef.current]={pick:-1,time:0,name:myName};
            setMyPick(-1);
            if(channelRef.current)channelRef.current.send({type:"broadcast",event:"answer",payload:{pick:-1,time:0,pid:myIdRef.current,name:myName}});
            if(hostRef.current)checkAllDone();
          }
          return 0;
        }
        return t-1;
      });
    },1000);
    return function(){clearInterval(timerRef.current);};
  },[phase,qi]);

  // ── Countdown ──
  useEffect(function(){
    if(phase!=="countdown")return;
    setCountdown(3);
    countdownRef.current=setInterval(function(){
      setCountdown(function(c){
        if(c<=1){clearInterval(countdownRef.current);setPhase("play");return 0;}
        return c-1;
      });
    },1000);
    return function(){clearInterval(countdownRef.current);};
  },[phase]);

  // ── Subscribe to channel ──
  function joinChannel(code,hosting){
    var myId=myIdRef.current;
    var ch=supabase.channel("arena-"+code);

    ch.on("broadcast",{event:"player_join"},function(msg){
      if(msg.payload.pid===myId)return;
      playersRef.current[msg.payload.pid]={name:msg.payload.name};
      // If we're the joiner, adopt the host's wager
      if(msg.payload.host&&msg.payload.wager!==undefined)setWager(msg.payload.wager);
      // Host re-broadcasts updated count
      if(hostRef.current){
        var cnt=Object.keys(playersRef.current).length;
        setPlayerCount(cnt);
        if(channelRef.current)channelRef.current.send({type:"broadcast",event:"player_count",payload:{count:cnt,pid:myId}});
      }
    });

    ch.on("broadcast",{event:"player_count"},function(msg){
      if(msg.payload.pid===myId)return;
      setPlayerCount(msg.payload.count);
    });

    ch.on("broadcast",{event:"game_start"},function(msg){
      if(msg.payload.pid===myId)return;
      if(msg.payload.wager!==undefined)setWager(msg.payload.wager);
      questionsRef.current=msg.payload.questions;
      allAnswersRef.current={};scoresRef.current={};
      setQuestions(msg.payload.questions);
      setExpectedPlayers(msg.payload.playerCount);expectedRef.current=msg.payload.playerCount;
      setQi(0);setMyScore(0);setRoundResults([]);setAnsweredCount(0);
      setTimer(TIMER_SEC);
      setPhase("countdown");
    });

    ch.on("broadcast",{event:"answer"},function(msg){
      if(msg.payload.pid===myId)return;
      allAnswersRef.current[msg.payload.pid]={pick:msg.payload.pick,time:msg.payload.time,name:msg.payload.name};
      setAnsweredCount(Object.keys(allAnswersRef.current).length);
      if(hostRef.current)checkAllDone();
    });

    ch.on("broadcast",{event:"round_result"},function(msg){
      if(msg.payload.pid===myId)return;
      // Non-host receives authoritative ranking
      var ranking=msg.payload.ranking;
      scoresRef.current=msg.payload.scores;
      // Find my score from authoritative scores
      var myNewScore=scoresRef.current[myId]||0;
      setMyScore(myNewScore);
      var myEntry=ranking.find(function(r){return r.pid===myId;});
      var myPts=myEntry?myEntry.pts:0;
      var myCorrect2=myEntry&&myEntry.pick===msg.payload.correct;
      try{if(myCorrect2)playCorrect();else playWrong();}catch(e){}
      setRoundRanking(ranking);
      setRoundResults(function(prev){return prev.concat([{qi:msg.payload.qi,ranking:ranking,correct:msg.payload.correct,myPts:myPts}]);});
      setPhase("feedback");
    });

    ch.on("broadcast",{event:"next_round"},function(msg){
      if(msg.payload.pid===myId)return;
      answeredRef.current=false;
      allAnswersRef.current={};
      setMyPick(-1);setAnsweredCount(0);
      setQi(msg.payload.qi);qiRef.current=msg.payload.qi;
      // Reset timer in the SAME batch as setPhase("play") to avoid a 1-frame
      // render with stale timer=0 from previous round's auto-timeout (which
      // would visually flash the progress bar to 0% before the play effect's
      // own setTimer commits). Timer "drop to 0 d'un coup" bug, 2026-04-30.
      setTimer(TIMER_SEC);
      setPhase("play");
    });

    ch.on("broadcast",{event:"game_done"},function(msg){
      if(msg.payload.pid===myId)return;
      setFinalRanking(msg.payload.finalRanking||[]);
      setPhase("done");
    });

    ch.subscribe(function(status){
      if(status==="SUBSCRIBED"){
        ch.send({type:"broadcast",event:"player_join",payload:{name:myName,host:hosting,pid:myId,wager:wager}});
      }
    });

    // Register self
    playersRef.current[myId]={name:myName};
    channelRef.current=ch;
  }

  // ── Answer handler ──
  function doAnswer(i){
    if(answeredRef.current)return;
    answeredRef.current=true;
    clearInterval(timerRef.current);clearTimeout(fallbackRef.current);
    var timeLeft=timer;
    allAnswersRef.current[myIdRef.current]={pick:i,time:timeLeft,name:myName};
    setMyPick(i);
    setAnsweredCount(Object.keys(allAnswersRef.current).length);
    if(channelRef.current){
      channelRef.current.send({type:"broadcast",event:"answer",payload:{pick:i,time:timeLeft,pid:myIdRef.current,name:myName}});
    }
    if(hostRef.current){
      checkAllDone();
      // Fallback: after 10s, fill missing players as timeout
      fallbackRef.current=setTimeout(function(){
        if(phaseRef.current!=="play")return;
        var pids=Object.keys(playersRef.current);
        for(var k=0;k<pids.length;k++){
          if(!allAnswersRef.current[pids[k]]){
            allAnswersRef.current[pids[k]]={pick:-1,time:0,name:playersRef.current[pids[k]].name};
          }
        }
        setAnsweredCount(Object.keys(allAnswersRef.current).length);
        checkAllDone();
      },10000);
    }
  }

  // ── Next round (host drives) ──
  function nextRound(){
    if(qi+1>=ROUNDS){
      // Build final ranking
      var pids=Object.keys(scoresRef.current);
      var fr=pids.map(function(pid){
        var pl=playersRef.current[pid];
        return{pid:pid,name:pl?pl.name:pid,score:scoresRef.current[pid]||0};
      }).sort(function(a,b){return b.score-a.score;});
      setFinalRanking(fr);
      if(channelRef.current)channelRef.current.send({type:"broadcast",event:"game_done",payload:{finalRanking:fr,pid:myIdRef.current}});
      setPhase("done");
    } else {
      answeredRef.current=false;
      allAnswersRef.current={};
      var next=qi+1;
      if(channelRef.current)channelRef.current.send({type:"broadcast",event:"next_round",payload:{qi:next,pid:myIdRef.current}});
      setMyPick(-1);setAnsweredCount(0);
      setQi(next);qiRef.current=next;
      // Same-batch timer reset (see "next_round" broadcast handler comment).
      setTimer(TIMER_SEC);
      setPhase("play");
    }
  }

  var WAGER_TIERS=[10,20,50,100];

  // ═══ HUB ═══
  if(phase==="hub")return(<div className="enter" style={{padding:"20px 16px 100px"}}>
    <div style={{textAlign:"center",marginBottom:16}}>
      <span className="out" style={{fontWeight:700,fontSize:15}}>Vocabulary Arena</span>
    </div>
    <div style={{textAlign:"center",marginBottom:20}}>
      <div style={{marginBottom:8,display:"flex",justifyContent:"center"}}><GIcon name="swords-emblem" size={60} color="var(--cyan)"/></div>
      <h1 className="out" style={{fontWeight:800,fontSize:24,marginBottom:4}}>Vocabulary Arena</h1>
      <p style={{color:"var(--t2)",fontSize:13,lineHeight:1.6}}>{ROUNDS} rounds, {TIMER_SEC}s per question. Fastest wins!</p>
      <div style={{marginTop:8,padding:"6px 16px",display:"inline-block",background:"rgba(var(--cx),.08)",borderRadius:20}}>
        <span style={{fontSize:13,color:"var(--cyan)",fontWeight:700}}>Weekly XP: {p.u.weeklyXp}</span>
      </div>
    </div>
    {error&&<div style={{padding:12,background:"rgba(255,71,87,.1)",border:"1px solid rgba(255,71,87,.2)",borderRadius:10,marginBottom:16,textAlign:"center"}}>
      <p style={{fontSize:12,color:"var(--red)"}}>{error}</p></div>}

    {wagerPopup&&<div style={{position:"fixed",top:0,left:0,right:0,bottom:0,background:"rgba(0,0,0,.75)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:9999,padding:20,animation:"fadeIn .2s"}} onClick={function(){setWagerPopup(null);}}>
      <div style={{background:"linear-gradient(180deg,#1a1610,#0f0c08)",border:"1px solid rgba(180,140,80,.12)",borderRadius:16,padding:24,maxWidth:340,width:"100%",textAlign:"center",boxShadow:"0 12px 40px rgba(0,0,0,.5)"}} onClick={function(e){e.stopPropagation();}}>
        <div style={{fontSize:36,marginBottom:12}}>{"⚠️"}</div>
        <div className="out" style={{fontWeight:700,fontSize:15,marginBottom:8,color:/*fond local*/"#e05252"}}>Wager denied</div>
        <p style={{fontSize:13,color:/*fond local*/"#b0a890",lineHeight:1.6,marginBottom:4}}>{wagerPopup}</p>
        <p style={{fontSize:11,color:"#8a7e6a",lineHeight:1.5,marginBottom:16}}>You can only bet XP you have earned this week. Keep training to increase your weekly XP!</p>
        <button className="btn1" onClick={function(){setWagerPopup(null);}} style={{width:"100%"}}>Got it</button>
      </div>
    </div>}

    <div className="crd" style={{padding:16,marginBottom:10,cursor:"pointer",borderColor:"rgba(var(--cx),.15)"}} onClick={function(){
      setWager(0);setError(null);setPhase("pickAction");
    }}>
      <div style={{display:"flex",alignItems:"center",gap:14}}>
        <div style={{width:48,height:48,borderRadius:14,background:"linear-gradient(135deg,#22c55e,#06b6d4)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:22,flexShrink:0}}>{"🤝"}</div>
        <div style={{flex:1}}>
          <div className="out" style={{fontWeight:700,fontSize:15}}>Friendly Arena</div>
          <div style={{fontSize:11,color:"var(--t3)"}}>Play for fun — earn XP based on performance</div>
        </div>
        <span style={{fontSize:16,color:"var(--cyan)"}}>{"→"}</span>
      </div>
    </div>

    <div className="crd" style={{padding:16,marginBottom:10,background:"linear-gradient(135deg,rgba(255,71,87,.05),rgba(27,112,207,.05))",borderColor:"rgba(255,71,87,.15)"}}>
      <div style={{display:"flex",alignItems:"center",gap:14,marginBottom:12}}>
        <div style={{width:48,height:48,borderRadius:14,background:"linear-gradient(135deg,#c84040,#8b5e83)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:22,flexShrink:0}}>{"🔥"}</div>
        <div style={{flex:1}}>
          <div className="out" style={{fontWeight:700,fontSize:15}}>Ranked Arena</div>
          <div style={{fontSize:11,color:"var(--t3)"}}>Wager XP — winner takes all!</div>
        </div>
      </div>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
        {WAGER_TIERS.map(function(w){
          var canAfford=p.u.weeklyXp>=w;
          return(<button key={w} onClick={function(){
            if(!canAfford){setWagerPopup("You only have "+p.u.weeklyXp+" XP this week. You need at least "+w+" weekly XP to wager this amount!");return;}
            setWager(w);setError(null);setCustomWager("");setPhase("pickAction");
          }} disabled={!canAfford}
            style={{padding:"12px 8px",background:canAfford?"rgba(255,71,87,.08)":"var(--bg3)",border:"1px solid "+(canAfford?"rgba(255,71,87,.2)":"var(--bg3)"),
              borderRadius:12,cursor:canAfford?"pointer":"not-allowed",opacity:canAfford?1:0.4,transition:"all .2s"}}>
            <div className="out" style={{fontWeight:800,fontSize:18,color:canAfford?"var(--red)":"var(--t3)"}}>{w} XP</div>
          </button>);
        })}
      </div>
      <div style={{marginTop:10,display:"flex",gap:8,alignItems:"center"}}>
        <input type="number" min="1" placeholder="Custom XP" value={customWager} onChange={function(e){setCustomWager(e.target.value);}}
          style={{flex:1,padding:"10px 12px",borderRadius:10,border:"1px solid rgba(255,71,87,.2)",background:"var(--bg3)",color:"var(--t1)",fontFamily:"'DM Sans',sans-serif",fontSize:15,fontWeight:700,outline:"none"}}/>
        <button onClick={function(){
          var v=parseInt(customWager,10);
          if(!v||v<1){setWagerPopup("Enter a valid amount (minimum 1 XP).");return;}
          if(v>p.u.weeklyXp){setWagerPopup("You only earned "+p.u.weeklyXp+" XP this week. Your wager cannot exceed your weekly XP!");return;}
          setWager(v);setError(null);setWagerPopup(null);setCustomWager("");setPhase("pickAction");
        }} style={{padding:"10px 18px",borderRadius:10,border:"none",background:"linear-gradient(135deg,#c84040,#8b5e83)",color:"#fff",fontWeight:800,fontSize:14,cursor:"pointer",whiteSpace:"nowrap"}}>Bet!</button>
      </div>
    </div>

    <div className="crd" style={{marginTop:16,padding:16}}>
      <p className="out" style={{fontWeight:700,fontSize:13,marginBottom:8}}>How it works</p>
      <div style={{fontSize:12,color:"var(--t2)",lineHeight:1.8}}>
        <div>{"🏠"} Host creates a room, others join with the code</div>
        <div>{"⚡"} Fastest correct answer = 100 pts, 2nd = 80, 3rd = 60...</div>
        <div>{"🔥"} Ranked: everyone wagers. Winner takes all!</div>
        <div>{"🤝"} Tie at 1st = pot split equally</div>
      </div>
    </div>
    <button className="btn2" onClick={p.back} style={{marginTop:16,width:"100%"}}>Back</button>
  </div>);

  // ═══ PICK ACTION ═══
  if(phase==="pickAction")return(<div className="enter" style={{padding:"20px 16px",minHeight:"100vh",display:"flex",flexDirection:"column",justifyContent:"center",textAlign:"center"}}>
    <div style={{fontSize:48,marginBottom:12}}>{wager>0?"🔥":"🤝"}</div>
    <h2 className="out" style={{fontWeight:800,fontSize:22,marginBottom:4}}>{wager>0?"Ranked Arena":"Friendly Arena"}</h2>
    {wager>0&&<div style={{marginBottom:16}}>
      <span style={{fontSize:28,fontWeight:900,color:"var(--red)"}}>{wager} XP</span>
      <span style={{fontSize:13,color:"var(--t3)",display:"block",marginTop:4}}>at stake per player</span>
    </div>}
    {!wager&&<p style={{color:"var(--t3)",fontSize:13,marginBottom:16}}>No XP at risk — play for fun!</p>}
    <div style={{display:"flex",flexDirection:"column",gap:12}}>
      <button className="btn1" onClick={function(){
        var code=genCode();setRoomCode(code);setIsHost(true);hostRef.current=true;setError(null);
        joinChannel(code,true);setPhase("create");
      }} style={{fontSize:16,padding:"18px 16px"}}>{"🏠"} Create a Room</button>
      <button className="btn2" onClick={function(){setError(null);setPhase("join");}} style={{fontSize:16,padding:"18px 16px"}}>{"🚪"} Join a Room</button>
    </div>
    <button className="btn2" onClick={function(){setPhase("hub");}} style={{marginTop:16,width:"100%"}}>Back</button>
  </div>);

  // ═══ CREATE ROOM ═══
  if(phase==="create")return(<div className="enter" style={{padding:"20px 16px",minHeight:"100vh",display:"flex",flexDirection:"column",justifyContent:"center",textAlign:"center"}}>
    <div style={{fontSize:48,marginBottom:16}}>{wager>0?"🔥":"🏠"}</div>
    <h2 className="out" style={{fontWeight:800,fontSize:22,marginBottom:8}}>{wager>0?"Ranked Arena":"Friendly Arena"}</h2>
    {wager>0&&<div style={{padding:"8px 20px",background:"rgba(255,71,87,.1)",borderRadius:20,display:"inline-block",marginBottom:12}}>
      <span style={{fontSize:16,fontWeight:800,color:"var(--red)"}}>Wager: {wager} XP</span></div>}
    <div style={{marginBottom:24}}>
      <div style={{fontSize:14,color:"var(--t2)",marginBottom:12}}>Share this code with your class:</div>
      <div className="out" style={{fontSize:44,fontWeight:900,letterSpacing:8,color:"var(--cyan)",animation:"pulse 2s infinite"}}>{roomCode}</div>
    </div>
    <div style={{padding:"12px 20px",background:"rgba(var(--cx),.08)",borderRadius:16,marginBottom:20}}>
      <span style={{fontSize:36,fontWeight:900,color:"var(--cyan)"}}>{playerCount}</span>
      <span style={{fontSize:14,color:"var(--t2)",marginLeft:8}}>{playerCount===1?"player (you)":"players"}</span>
    </div>
    {playerCount>=2?(<div style={{animation:"fadeIn .3s"}}>
      <button className="btn1" onClick={function(){
        var qs=generateQuestions();setQuestions(qs);questionsRef.current=qs;
        var pc=Object.keys(playersRef.current).length;
        setExpectedPlayers(pc);expectedRef.current=pc;
        scoresRef.current={};
        channelRef.current.send({type:"broadcast",event:"game_start",payload:{questions:qs,wager:wager,playerCount:pc,pid:myIdRef.current}});
        setQi(0);setMyScore(0);setRoundResults([]);setAnsweredCount(0);
        allAnswersRef.current={};
        setTimer(TIMER_SEC);
        setPhase("countdown");
      }}>{"⚔️"} Start Arena! ({playerCount} players)</button>
    </div>):(<div>
      <div style={{animation:"pulse 2s infinite",fontSize:14,color:"var(--t3)"}}>Waiting for players to join...</div>
    </div>)}
    <button className="btn2" onClick={function(){if(channelRef.current)supabase.removeChannel(channelRef.current);channelRef.current=null;setPhase("hub");}} style={{marginTop:24,width:"100%"}}>Cancel</button>
  </div>);

  // ═══ JOIN ROOM ═══
  if(phase==="join")return(<div className="enter" style={{padding:"20px 16px",minHeight:"100vh",display:"flex",flexDirection:"column",justifyContent:"center",textAlign:"center"}}>
    <div style={{fontSize:48,marginBottom:16}}>{"🚪"}</div>
    <h2 className="out" style={{fontWeight:800,fontSize:22,marginBottom:20}}>Enter Room Code</h2>
    <input type="text" inputMode="numeric" maxLength={6} value={inputCode}
      onChange={function(e){setInputCode(e.target.value.replace(/\D/g,""));}}
      placeholder="000000"
      style={{textAlign:"center",fontSize:40,fontWeight:900,letterSpacing:8,width:"100%",padding:"16px",
        background:"var(--bg2)",border:"2px solid var(--bdr)",borderRadius:16,color:"var(--cyan)",
        fontFamily:"'DM Sans',sans-serif",outline:"none",boxSizing:"border-box"}}/>
    <button className="btn1" onClick={function(){
      if(inputCode.length!==6){setError("Enter a 6-digit code");return;}
      setRoomCode(inputCode);setIsHost(false);hostRef.current=false;setError(null);
      joinChannel(inputCode,false);setPhase("lobby");
    }} style={{marginTop:20}} disabled={inputCode.length!==6}>Join Arena</button>
    <button className="btn2" onClick={function(){setPhase("hub");setInputCode("");}} style={{marginTop:12,width:"100%"}}>Back</button>
  </div>);

  // ═══ LOBBY ═══
  if(phase==="lobby")return(<div className="enter" style={{padding:"20px 16px",minHeight:"100vh",display:"flex",flexDirection:"column",justifyContent:"center",textAlign:"center"}}>
    <div style={{fontSize:48,marginBottom:16}}>{wager>0?"🔥":"⏳"}</div>
    <h2 className="out" style={{fontWeight:800,fontSize:22,marginBottom:8}}>Room {roomCode}</h2>
    {wager>0&&<div style={{padding:"8px 20px",background:"rgba(255,71,87,.1)",borderRadius:20,display:"inline-block",marginBottom:12}}>
      <span style={{fontSize:16,fontWeight:800,color:"var(--red)"}}>Wager: {wager} XP</span></div>}
    <div style={{padding:"12px 20px",background:"rgba(var(--cx),.08)",borderRadius:16,marginBottom:16}}>
      <span style={{fontSize:36,fontWeight:900,color:"var(--cyan)"}}>{playerCount}</span>
      <span style={{fontSize:14,color:"var(--t2)",marginLeft:8}}>players in room</span>
    </div>
    <p style={{color:"var(--t2)",fontSize:14,marginBottom:8}}>You joined as <strong style={{color:"var(--cyan)"}}>{myName}</strong></p>
    <div style={{animation:"pulse 2s infinite",fontSize:14,color:"var(--t3)"}}>Waiting for host to start...</div>
    <button className="btn2" onClick={function(){if(channelRef.current)supabase.removeChannel(channelRef.current);channelRef.current=null;setPhase("hub");}} style={{marginTop:32,width:"100%"}}>Leave</button>
  </div>);

  // ═══ COUNTDOWN ═══
  if(phase==="countdown")return(<div style={{minHeight:"100vh",display:"flex",flexDirection:"column",justifyContent:"center",alignItems:"center",textAlign:"center"}}>
    <div className="out" style={{fontSize:80,fontWeight:900,color:"var(--cyan)",animation:"countUp .5s"}}>{countdown}</div>
    <p style={{color:"var(--t2)",fontSize:16,marginTop:16}}>{expectedPlayers} players — Get ready!</p>
  </div>);

  // ═══ PLAY ═══
  if(phase==="play"&&questions[qi]){
    var q=questions[qi];
    var timerPct=timer/TIMER_SEC*100;
    var timerCol=timer<=3?"var(--red)":timer<=6?"var(--orange)":"var(--cyan)";

    return(<div style={{padding:"20px 16px",minHeight:"100vh"}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:8}}>
        <div style={{textAlign:"left"}}>
          <div style={{fontSize:11,color:"var(--cyan)",fontWeight:600}}>{myName}</div>
          <div className="out" style={{fontSize:20,fontWeight:900,color:"var(--cyan)"}}>{myScore}</div>
        </div>
        <div style={{textAlign:"center",padding:"0 12px"}}>
          <div style={{fontSize:11,color:"var(--t3)"}}>Round</div>
          <div className="out" style={{fontSize:18,fontWeight:800,color:"var(--t1)"}}>{qi+1}/{ROUNDS}</div>
          {wager>0&&<div style={{fontSize:9,color:"var(--red)",fontWeight:700,marginTop:2}}>{wager} XP</div>}
        </div>
        <div style={{textAlign:"right"}}>
          <div style={{fontSize:11,color:"var(--orange)",fontWeight:600}}>{answeredCount}/{expectedPlayers}</div>
          <div style={{fontSize:10,color:"var(--t3)"}}>answered</div>
        </div>
      </div>

      <div style={{height:5,background:"var(--bg3)",borderRadius:3,marginBottom:16,overflow:"hidden"}}>
        <div style={{height:"100%",width:timerPct+"%",background:timerCol,borderRadius:3,transition:"width 1s linear"}}/></div>

      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:20}}>
        <span className="out" style={{fontSize:24,fontWeight:900,color:timerCol}}>{timer}s</span>
        {answeredCount>0&&myPick!==-1&&<span style={{fontSize:12,color:"var(--orange)",fontWeight:600,animation:"fadeIn .3s"}}>{"⚡"} {answeredCount} answered</span>}
      </div>

      <div style={{textAlign:"center",marginBottom:24}}>
        <span className="out" style={{fontSize:11,color:"var(--purple)",fontWeight:700,textTransform:"uppercase",letterSpacing:1,display:"block",marginBottom:8}}>What does this word mean?</span>
        <span className="out" style={{fontSize:32,fontWeight:900,color:"var(--t1)"}}>{q.word}</span>
      </div>

      <div style={{display:"flex",flexDirection:"column",gap:8}}>
        {q.opts.map(function(opt,i){
          var picked=myPick===i;
          return(<button key={i} onClick={function(){doAnswer(i);}} disabled={myPick!==-1}
            style={{padding:"14px 16px",background:picked?"rgba(var(--cx),.1)":"var(--bg2)",
              border:picked?"2px solid var(--cyan)":"1px solid var(--bdr)",borderRadius:12,
              cursor:myPick!==-1?"default":"pointer",fontSize:14,color:picked?"var(--cyan)":"var(--t1)",
              textAlign:"left",fontFamily:"'DM Sans',sans-serif",transition:"all .15s",lineHeight:1.5,
              fontWeight:picked?600:400}}>
            <span style={{fontSize:12,color:"var(--t3)",marginRight:8,fontWeight:700}}>{String.fromCharCode(65+i)}</span>
            {opt}
          </button>);
        })}
      </div>
    </div>);
  }

  // ═══ FEEDBACK ═══
  if(phase==="feedback"&&questions[qi]){
    var q2=questions[qi];
    var myEntry2=roundRanking.find(function(r){return r.pid===myIdRef.current;});
    var myRank=roundRanking.indexOf(myEntry2)+1;
    // Show top 10 + my position if lower
    var top10=roundRanking.slice(0,10);
    var showMe=myRank>10;

    return(<div style={{padding:"20px 16px",minHeight:"100vh"}}>
      <div style={{textAlign:"center",marginBottom:12}}>
        <span className="out" style={{fontSize:14,fontWeight:800,color:"var(--t1)"}}>Round {qi+1} Results</span>
      </div>

      <div className="crd" style={{padding:16,marginBottom:16,borderColor:"rgba(0,230,118,.2)",background:"rgba(0,230,118,.06)"}}>
        <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:8}}>
          <span className="out" style={{fontWeight:800,fontSize:18,color:"var(--cyan)"}}>{q2.word}</span>
          <span style={{fontSize:13,color:"var(--green)",fontWeight:600}}>= {q2.opts[q2.c]}</span>
        </div>
        <p style={{fontSize:12,color:"var(--t3)",fontStyle:"italic"}}>"{q2.ex}"</p>
      </div>

      <div className="crd" style={{padding:14,marginBottom:16}}>
        <div className="read-scroll" style={{display:"flex",flexDirection:"column",gap:6,maxHeight:"46vh",overflowY:"auto"}}>
          {top10.map(function(r,i){
            var isMe=r.pid===myIdRef.current;
            var correct3=r.pick===q2.c;
            return(<div key={r.pid} style={{display:"flex",alignItems:"center",gap:8,padding:"6px 8px",borderRadius:10,background:isMe?"rgba(var(--cx),.08)":"transparent"}}>
              <span style={{width:24,fontSize:14,textAlign:"center"}}>{i<3?MEDALS[i]:(i+1)}</span>
              <span style={{flex:1,fontSize:13,fontWeight:isMe?700:400,color:isMe?"var(--cyan)":"var(--t1)"}}>{r.name}{isMe?" (you)":""}</span>
              <span style={{fontSize:11,color:correct3?"var(--green)":"var(--red)",fontWeight:600}}>{correct3?"✓":"✗"}</span>
              <span style={{width:40,textAlign:"right",fontSize:13,fontWeight:700,color:r.pts>0?"var(--green)":"var(--red)"}}>+{r.pts}</span>
            </div>);
          })}
          {showMe&&myEntry2&&<div>
            <div style={{textAlign:"center",color:"var(--t3)",fontSize:11,padding:"4px 0"}}>···</div>
            <div style={{display:"flex",alignItems:"center",gap:8,padding:"6px 8px",borderRadius:10,background:"rgba(var(--cx),.08)"}}>
              <span style={{width:24,fontSize:12,textAlign:"center",color:"var(--t3)"}}>{myRank}</span>
              <span style={{flex:1,fontSize:13,fontWeight:700,color:"var(--cyan)"}}>{myEntry2.name} (you)</span>
              <span style={{fontSize:11,color:myEntry2.pick===q2.c?"var(--green)":"var(--red)",fontWeight:600}}>{myEntry2.pick===q2.c?"✓":"✗"}</span>
              <span style={{width:40,textAlign:"right",fontSize:13,fontWeight:700,color:myEntry2.pts>0?"var(--green)":"var(--red)"}}>+{myEntry2.pts}</span>
            </div>
          </div>}
        </div>
      </div>

      {isHost?<button className="btn1" onClick={nextRound}>{qi+1<ROUNDS?"Next Round ("+(qi+2)+"/"+ROUNDS+")":"See Final Results"}</button>
      :<div style={{textAlign:"center",color:"var(--t3)",fontSize:13,animation:"pulse 2s infinite"}}>Waiting for next round...</div>}
    </div>);
  }

  // ═══ DONE ═══
  if(phase==="done"){
    var myFinal=finalRanking.find(function(r){return r.pid===myIdRef.current;});
    var myFinalRank=myFinal?finalRanking.indexOf(myFinal)+1:finalRanking.length;
    var iWon=myFinalRank===1;
    var pc=expectedPlayers;

    // Check for tie at 1st place
    var topScore=finalRanking.length>0?finalRanking[0].score:0;
    var tiedFirst=finalRanking.filter(function(r){return r.score===topScore;}).length;
    var tied=iWon&&tiedFirst>1;

    // XP
    var baseXp=Math.round((myScore/100)*3)+(myFinalRank===1?20:myFinalRank===2?15:myFinalRank===3?10:5);
    var wagerNet=0;
    if(wager>0){
      var pot=wager*pc;
      if(iWon&&!tied)wagerNet=pot-wager; // net gain = pot minus own wager
      else if(iWon&&tied)wagerNet=Math.floor(pot/tiedFirst)-wager;
      else wagerNet=-wager;
    }
    var totalXp=baseXp+wagerNet;
    if(p.u.xp+totalXp<0)totalXp=-p.u.xp;

    // Podium (top 3)
    var podium=finalRanking.slice(0,3);

    return(<div className="enter" style={{padding:"20px 16px 100px"}}>
      <div style={{textAlign:"center",marginBottom:24}}>
        <div style={{fontSize:56,marginBottom:12,animation:"countUp .6s"}}>{iWon?"🏆":myFinalRank<=3?"🎉":"😤"}</div>
        <h1 className="out" style={{fontWeight:900,fontSize:28,marginBottom:4}}>{iWon?(tied?"Tied for 1st!":"Victory!"):myFinalRank<=3?"Podium!":"#{"+myFinalRank+"}"}</h1>
        <p style={{color:"var(--t2)",fontSize:14}}>Room {roomCode} · {pc} players{wager>0?" · Ranked":""}</p>
      </div>

      {/* Podium */}
      <div style={{display:"flex",justifyContent:"center",gap:8,marginBottom:20,alignItems:"flex-end"}}>
        {podium.length>=2&&<div style={{textAlign:"center",flex:1}}>
          <div style={{fontSize:28,marginBottom:4}}>{"🥈"}</div>
          <div className="out" style={{fontSize:12,fontWeight:700,color:"var(--t2)"}}>{podium[1].name}</div>
          <div className="out" style={{fontSize:18,fontWeight:900,color:"var(--t2)"}}>{podium[1].score}</div>
        </div>}
        {podium.length>=1&&<div style={{textAlign:"center",flex:1}}>
          <div style={{fontSize:36,marginBottom:4,animation:"pulse 1.5s infinite"}}>{"🥇"}</div>
          <div className="out" style={{fontSize:14,fontWeight:800,color:"var(--gold)"}}>{podium[0].name}</div>
          <div className="out" style={{fontSize:24,fontWeight:900,color:"var(--gold)"}}>{podium[0].score}</div>
        </div>}
        {podium.length>=3&&<div style={{textAlign:"center",flex:1}}>
          <div style={{fontSize:24,marginBottom:4}}>{"🥉"}</div>
          <div className="out" style={{fontSize:12,fontWeight:700,color:"var(--t2)"}}>{podium[2].name}</div>
          <div className="out" style={{fontSize:18,fontWeight:900,color:"var(--t2)"}}>{podium[2].score}</div>
        </div>}
      </div>

      {/* My position if not podium */}
      {myFinalRank>3&&myFinal&&<div className="crd" style={{padding:14,marginBottom:16,textAlign:"center",borderColor:"rgba(var(--cx),.2)"}}>
        <div style={{fontSize:11,color:"var(--t3)",marginBottom:4}}>Your position</div>
        <div className="out" style={{fontSize:20,fontWeight:900,color:"var(--cyan)"}}>#{myFinalRank} — {myFinal.score} pts</div>
      </div>}

      {/* Wager result */}
      {wager>0&&<div className="crd" style={{padding:14,marginBottom:16,textAlign:"center",
        background:wagerNet>0?"rgba(0,230,118,.06)":wagerNet===0?"rgba(var(--cx),.06)":"rgba(255,71,87,.06)",
        borderColor:wagerNet>0?"rgba(0,230,118,.2)":wagerNet===0?"rgba(var(--cx),.2)":"rgba(255,71,87,.2)"}}>
        <div style={{fontSize:13,color:"var(--t2)",marginBottom:4}}>Pot: {wager*pc} XP ({pc} players × {wager})</div>
        <div className="out" style={{fontSize:24,fontWeight:900,color:wagerNet>0?"var(--green)":wagerNet===0?"var(--cyan)":"var(--red)"}}>
          {wagerNet>0?"+"+wagerNet+" XP won!":wagerNet===0?"XP returned":wagerNet+" XP lost"}
        </div>
      </div>}

      {/* Round breakdown (my points only) */}
      <div className="crd" style={{padding:14,marginBottom:20}}>
        <p className="out" style={{fontWeight:700,fontSize:13,color:"var(--t2)",marginBottom:10}}>Your Rounds</p>
        <div style={{display:"flex",flexDirection:"column",gap:4}}>
          {roundResults.map(function(r,i){
            var q3=questions[r.qi];
            return(<div key={i} style={{display:"flex",alignItems:"center",gap:8,padding:"6px 0",borderBottom:i<roundResults.length-1?"1px solid var(--bg3)":"none"}}>
              <span style={{width:20,fontSize:11,color:"var(--t3)",fontWeight:700}}>{i+1}</span>
              <span style={{flex:1,fontSize:12,color:"var(--t1)"}}>{q3?q3.word:""}</span>
              <span style={{fontSize:11,fontWeight:700,color:r.myPts>=100?"var(--green)":r.myPts>0?"var(--cyan)":"var(--red)",width:35,textAlign:"right"}}>+{r.myPts}</span>
            </div>);
          })}
        </div>
      </div>

      <div style={{textAlign:"center",marginBottom:20}}>
        <div style={{fontSize:12,color:"var(--t3)",marginBottom:4}}>Performance: +{baseXp} XP{wager>0?(wagerNet>=0?" · Wager: +"+wagerNet:" · Wager: "+wagerNet):""}</div>
        <div className="out" style={{fontSize:24,fontWeight:900,color:totalXp>=0?"var(--gold)":"var(--red)"}}>{totalXp>=0?"+":""}{totalXp} XP</div>
      </div>

      <button className="btn1" onClick={function(){
        if(channelRef.current){supabase.removeChannel(channelRef.current);channelRef.current=null;}
        var result={score:myScore,won:iWon,tied:tied,wager:wager,wagerWon:iWon?(wagerNet+wager):0};
        p.done("duel",result,totalXp);
      }}>Collect XP</button>
    </div>);
  }

  return null;
}
