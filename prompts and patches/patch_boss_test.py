#!/usr/bin/env python3
"""
TOEIC Arena — Boss Test Integration Patch
Applies 6 patches to App.jsx + 1 to achievements.js

Usage:
  python patch_boss_test.py

Reads from: src/App.jsx, src/data/achievements.js
Writes to:  src/App.jsx, src/data/achievements.js
"""

import sys, os

APP = os.path.join("src", "App.jsx")
ACH = os.path.join("src", "data", "achievements.js")

def patch(content, anchor, replacement, mode="after"):
    if anchor not in content:
        print(f"  ❌ Anchor not found: {anchor[:60]}...")
        return content, False
    if mode == "after":
        content = content.replace(anchor, anchor + replacement, 1)
    elif mode == "before":
        content = content.replace(anchor, replacement + anchor, 1)
    elif mode == "replace":
        content = content.replace(anchor, replacement, 1)
    return content, True

# ═══════════════════════════════════════
# READ FILES
# ═══════════════════════════════════════
with open(APP, "r", encoding="utf-8") as f:
    app = f.read()
with open(ACH, "r", encoding="utf-8") as f:
    ach = f.read()

ok_count = 0
total = 7

# ═══════════════════════════════════════
# PATCH 1: Import Boss Test data
# ═══════════════════════════════════════
print("1/7 — Import Boss Test data...")
app, ok = patch(app,
    'import { MOCK1_P5, MOCK2_P5, MOCK3_P5, MOCK1_P6, MOCK2_P6, MOCK3_P6, MOCK1_P7, MOCK2_P7, MOCK3_P7} from "./data/mockTests.js";',
    '\nimport { BOSS_P1, BOSS_P2, BOSS_P3, BOSS_P4, BOSS_P5, BOSS_P6, BOSS_P7 } from "./data/bossTestFull.js";',
    "after")
if ok: ok_count += 1

# ═══════════════════════════════════════
# PATCH 2: canUnlockBoss function
# ═══════════════════════════════════════
print("2/7 — canUnlockBoss function...")
BOSS_UNLOCK = '''

function canUnlockBoss(u){
  if(!u||!u.stats)return{ok:false,reasons:[]};
  var reasons=[];
  if(!u.mockResults||!u.mockResults.mock1)reasons.push("Complete Mock Test 1 first");
  if(!u.mockResults||!u.mockResults.mock2)reasons.push("Complete Mock Test 2 first");
  if(!u.mockResults||!u.mockResults.mock3)reasons.push("Complete Mock Test 3 first");
  if(reasons.length===0&&u.mockResults&&u.mockResults.boss&&u.mockResults.boss.date===today()){
    reasons.push("24h cooldown \\u2014 come back tomorrow");
  }
  return{ok:reasons.length===0,reasons:reasons};
}
'''
app, ok = patch(app,
    "  return{ok:reasons.length===0,reasons:reasons};\n}",
    BOSS_UNLOCK,
    "after")
if ok: ok_count += 1

# ═══════════════════════════════════════
# PATCH 3: Menu entry for Boss Test
# ═══════════════════════════════════════
print("3/7 — Menu entry...")
MENU_ENTRY = '''
      // Boss Test — The Final Arena
      var uBoss=canUnlockBoss(p.u);
      var bossCompleted=p.u.mockResults&&p.u.mockResults.boss;
      var bossDesc=uBoss.ok?(bossCompleted?"Best: TOEIC "+p.u.mockResults.boss.toeicEstimate+"/990 \\u2014 Retake?":"Full TOEIC \\u00b7 202 Q \\u00b7 120 min"):uBoss.reasons[0];
      items.push({id:"boss",n:"\\u2694\\ufe0f The Final Arena",d:bossDesc,i:"\\ud83d\\udc09",bg:uBoss.ok?"linear-gradient(135deg,#dc2626,#f59e0b)":"var(--bg3)",lock:!uBoss.ok,mockId:"boss"});
'''
app, ok = patch(app,
    '      // Show completed badge',
    MENU_ENTRY,
    "before")
if ok: ok_count += 1

# ═══════════════════════════════════════
# PATCH 4: BossTest component
# ═══════════════════════════════════════
print("4/7 — BossTest component (big one)...")
BOSS_COMPONENT = r'''
// ─── BOSS TEST — The Final Arena (Full TOEIC 200Q) ───
function BossTest(p){
  var LP1=BOSS_P1,LP2=BOSS_P2,LP3=BOSS_P3,LP4=BOSS_P4;
  var RP5=BOSS_P5,RP6=BOSS_P6,RP7=BOSS_P7;
  var p3QC=0;LP3.forEach(function(c){p3QC+=c.qs.length;});
  var p4QC=0;LP4.forEach(function(t){p4QC+=t.qs.length;});
  var lisQ=LP1.length+LP2.length+p3QC+p4QC;
  var p6BC=0;RP6.forEach(function(t){t.parts.forEach(function(pt){if(pt.blank)p6BC++;});});
  var p7QC=0;RP7.forEach(function(ps){p7QC+=ps.questions.length;});
  var readQ=RP5.length+p6BC+p7QC;
  var totalQ=lisQ+readQ;
  var TOTAL_TIME=120*60;

  var[phase,setPhase]=useState("intro");
  var[sec,setSec]=useState("p1");
  var[qi,setQi]=useState(0);
  var[sqi,setSqi]=useState(0);
  var[ans,setAns]=useState(function(){return{
    p1:LP1.map(function(){return -1;}),p2:LP2.map(function(){return -1;}),
    p3:LP3.map(function(c){return c.qs.map(function(){return -1;});}),
    p4:LP4.map(function(t){return t.qs.map(function(){return -1;});}),
    p5:RP5.map(function(){return -1;}),
    p6:RP6.map(function(t){var n=0;t.parts.forEach(function(pt){if(pt.blank)n++;});return Array(n).fill(-1);}),
    p7:RP7.map(function(ps){return ps.questions.map(function(){return -1;});})
  };});
  var[timeLeft,setTimeLeft]=useState(TOTAL_TIME);
  var[result,setResult]=useState(null);
  var[aState,setAState]=useState("ready");
  var[curOpt,setCurOpt]=useState(-1);
  var[revMode,setRevMode]=useState(false);
  var[revSec,setRevSec]=useState("p1");
  var[revIdx,setRevIdx]=useState(0);
  var timerRef=useRef(null);

  useEffect(function(){
    if(phase!=="test"||result)return;
    if(timeLeft<=0){doSubmit();return;}
    timerRef.current=setTimeout(function(){setTimeLeft(timeLeft-1);},1000);
    return function(){clearTimeout(timerRef.current);};
  });

  function fmtT(s){var m=Math.floor(s/60);var sc2=s%60;return m+":"+(sc2<10?"0":"")+sc2;}
  function pad(n){return String(n).padStart(2,"0");}

  // ── Audio ──
  async function playP1(){if(aState!=="ready")return;setAState("playing");for(var i=0;i<LP1[qi].opts.length;i++){setCurOpt(i);await playAudioFile("/audio/boss/p1_"+pad(qi+1)+"_"+i+".mp3");await new Promise(function(r){setTimeout(r,400);});}setCurOpt(-1);setAState("done");}
  async function playP2(){if(aState!=="ready")return;setAState("playing");var id=pad(qi+1);await playAudioFile("/audio/boss/p2_"+id+"_q.mp3");await new Promise(function(r){setTimeout(r,400);});for(var i=0;i<3;i++){setCurOpt(i);await playAudioFile("/audio/boss/p2_"+id+"_"+i+".mp3");await new Promise(function(r){setTimeout(r,300);});}setCurOpt(-1);setAState("done");}
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
    clearTimeout(timerRef.current);
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
  }

  // ── Progress ──
  var answered=0;
  ans.p1.forEach(function(a){if(a>=0)answered++;});ans.p2.forEach(function(a){if(a>=0)answered++;});
  ans.p3.forEach(function(c){c.forEach(function(a){if(a>=0)answered++;});});ans.p4.forEach(function(t){t.forEach(function(a){if(a>=0)answered++;});});
  ans.p5.forEach(function(a){if(a>=0)answered++;});ans.p6.forEach(function(t){t.forEach(function(a){if(a>=0)answered++;});});
  ans.p7.forEach(function(ps){ps.forEach(function(a){if(a>=0)answered++;});});

  // ── Section labels ──
  var secLabel=sec==="p1"?"Part 1 \u2014 Photos":sec==="p2"?"Part 2 \u2014 Q&R":sec==="p3"?"Part 3 \u2014 Conversations":sec==="p4"?"Part 4 \u2014 Talks":sec==="p5"?"Part 5 \u2014 Sentences":sec==="p6"?"Part 6 \u2014 Text Completion":"Part 7 \u2014 Reading";
  var isListening=sec==="p1"||sec==="p2"||sec==="p3"||sec==="p4";

  // ═══ INTRO ═══
  if(phase==="intro"){
    return(<div className="enter" style={{padding:"20px 16px",minHeight:"100vh",display:"flex",flexDirection:"column",justifyContent:"center",textAlign:"center"}}>
      <div style={{fontSize:64,marginBottom:12,animation:"pulse 2s infinite"}}>&#x1F409;</div>
      <h1 className="out" style={{fontWeight:900,fontSize:28,background:"linear-gradient(135deg,#dc2626,#f59e0b)",WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent",marginBottom:4}}>THE FINAL ARENA</h1>
      <p style={{color:"var(--t2)",fontSize:14,marginBottom:20}}>Full TOEIC Simulation</p>
      <div className="crd" style={{textAlign:"left",padding:16,marginBottom:16}}>
        <div style={{fontSize:11,color:"var(--orange)",fontWeight:700,textTransform:"uppercase",letterSpacing:1,marginBottom:8}}>&#x1F50A; Listening Section</div>
        <div style={{fontSize:13,color:"var(--t1)",lineHeight:1.8}}>
          <div style={{display:"flex",justifyContent:"space-between"}}><span>Part 1 \u2014 Photographs</span><span className="out" style={{color:"var(--cyan)"}}>{LP1.length} Q</span></div>
          <div style={{display:"flex",justifyContent:"space-between"}}><span>Part 2 \u2014 Question-Response</span><span className="out" style={{color:"var(--cyan)"}}>{LP2.length} Q</span></div>
          <div style={{display:"flex",justifyContent:"space-between"}}><span>Part 3 \u2014 Conversations</span><span className="out" style={{color:"var(--cyan)"}}>{p3QC} Q</span></div>
          <div style={{display:"flex",justifyContent:"space-between"}}><span>Part 4 \u2014 Talks</span><span className="out" style={{color:"var(--cyan)"}}>{p4QC} Q</span></div>
          <div style={{borderTop:"1px solid var(--bdr)",marginTop:6,paddingTop:6,display:"flex",justifyContent:"space-between",fontWeight:700}}><span>Subtotal</span><span style={{color:"var(--gold)"}}>{lisQ} Q</span></div>
        </div>
      </div>
      <div className="crd" style={{textAlign:"left",padding:16,marginBottom:16}}>
        <div style={{fontSize:11,color:"var(--green)",fontWeight:700,textTransform:"uppercase",letterSpacing:1,marginBottom:8}}>&#x1F4D6; Reading Section</div>
        <div style={{fontSize:13,color:"var(--t1)",lineHeight:1.8}}>
          <div style={{display:"flex",justifyContent:"space-between"}}><span>Part 5 \u2014 Incomplete Sentences</span><span className="out" style={{color:"var(--cyan)"}}>{RP5.length} Q</span></div>
          <div style={{display:"flex",justifyContent:"space-between"}}><span>Part 6 \u2014 Text Completion</span><span className="out" style={{color:"var(--cyan)"}}>{p6BC} Q</span></div>
          <div style={{display:"flex",justifyContent:"space-between"}}><span>Part 7 \u2014 Reading Comprehension</span><span className="out" style={{color:"var(--cyan)"}}>{p7QC} Q</span></div>
          <div style={{borderTop:"1px solid var(--bdr)",marginTop:6,paddingTop:6,display:"flex",justifyContent:"space-between",fontWeight:700}}><span>Subtotal</span><span style={{color:"var(--gold)"}}>{readQ} Q</span></div>
        </div>
      </div>
      <div className="crd glo" style={{padding:14,marginBottom:20}}>
        <div style={{display:"flex",justifyContent:"space-between",fontWeight:800,fontSize:15,color:"var(--t1)"}}><span>TOTAL</span><span className="out" style={{color:"var(--gold)"}}>{totalQ} questions \u00b7 120 min</span></div>
      </div>
      <div className="crd" style={{padding:14,marginBottom:24,borderColor:"rgba(220,38,38,.3)",background:"rgba(220,38,38,.06)"}}>
        <p style={{fontSize:12,color:"var(--red)",lineHeight:1.6}}>\u26a0\ufe0f Real TOEIC conditions. No feedback. No going back. Audio plays ONCE. Your score is saved. Rejouable after 24h cooldown.</p>
      </div>
      <button className="btn1" style={{background:"linear-gradient(135deg,#dc2626,#f59e0b)",fontSize:18,padding:"16px 32px"}} onClick={function(){setPhase("test");}}>&#x2694;\ufe0f Enter the Arena</button>
      <button className="btn2" onClick={p.back} style={{marginTop:12,width:"100%"}}>Not ready yet</button>
    </div>);
  }

  // ═══ TEST PHASE ═══
  if(phase==="test"&&!result){
    var timerCol=timeLeft>600?"var(--cyan)":timeLeft>120?"var(--orange)":"var(--red)";

    // Common header
    var header=(<div style={{marginBottom:16}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:8}}>
        <div style={{fontSize:11,color:isListening?"var(--orange)":"var(--green)",fontWeight:700,textTransform:"uppercase",letterSpacing:1}}>{isListening?"\ud83d\udd0a Listening":"\ud83d\udcd6 Reading"}</div>
        <div className="out" style={{fontSize:14,fontWeight:800,color:timerCol}}>{fmtT(timeLeft)}</div>
      </div>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:8}}>
        <span className="out" style={{fontSize:13,fontWeight:700}}>{secLabel}</span>
        <span style={{fontSize:11,color:"var(--t3)"}}>{answered}/{totalQ} answered</span>
      </div>
      <Bar value={answered} max={totalQ} h={4} color={isListening?"linear-gradient(90deg,#f59e0b,#ef4444)":"linear-gradient(90deg,#22c55e,#06b6d4)"}/>
    </div>);

    // ── P1: Photos ──
    if(sec==="p1"){
      var it=LP1[qi];
      return(<div style={{padding:"20px 16px",minHeight:"100vh"}}>
        {header}
        <div style={{marginBottom:12,borderRadius:14,overflow:"hidden",border:"1px solid var(--bdr)"}}>
          <img src={it.img} alt="TOEIC photo" style={{width:"100%",display:"block",maxHeight:240,objectFit:"cover"}}/>
        </div>
        {aState==="ready"&&<div style={{textAlign:"center",marginBottom:16}}>
          <button onClick={playP1} style={{width:70,height:70,borderRadius:"50%",border:"none",background:"linear-gradient(135deg,#f59e0b,#ef4444)",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",margin:"0 auto"}}><span style={{fontSize:28}}>&#x25b6;\ufe0f</span></button>
          <p style={{color:"var(--t2)",fontSize:12,marginTop:8}}>Tap to play statements</p></div>}
        {aState==="playing"&&<div style={{textAlign:"center",marginBottom:16}}>
          <div style={{fontSize:40,animation:"pulse 1.5s infinite"}}>&#x1F50A;</div>
          <p className="out" style={{color:"var(--orange)",fontSize:13,marginTop:8}}>Playing statement {String.fromCharCode(65+(curOpt>=0?curOpt:0))}...</p></div>}
        {aState==="done"&&<div style={{display:"flex",flexDirection:"column",gap:8}}>
          {it.opts.map(function(opt,i){var sel=ans.p1[qi]===i;return(<button key={i} onClick={function(){pick(i);}} style={{display:"flex",alignItems:"center",gap:10,padding:"12px 14px",background:sel?"rgba(212,148,58,.15)":"var(--bg2)",border:"1px solid "+(sel?"var(--cyan)":"var(--bdr)"),borderRadius:12,cursor:"pointer",fontSize:13,color:"var(--t1)",textAlign:"left",fontFamily:"'DM Sans',sans-serif"}}>
            <div style={{width:26,height:26,borderRadius:"50%",border:"2px solid "+(sel?"var(--cyan)":"var(--t3)"),display:"flex",alignItems:"center",justifyContent:"center",fontSize:11,fontWeight:700,flexShrink:0,background:sel?"var(--cyan)":"transparent",color:sel?"#fff":"var(--t3)"}}>{String.fromCharCode(65+i)}</div>
            <span>{opt}</span></button>);})}
        </div>}
      </div>);
    }

    // ── P2: Q&R ──
    if(sec==="p2"){
      var it2=LP2[qi];
      return(<div style={{padding:"20px 16px",minHeight:"100vh"}}>
        {header}
        <div style={{textAlign:"center",marginTop:20}}>
          {aState==="ready"&&<div>
            <button onClick={playP2} style={{width:70,height:70,borderRadius:"50%",border:"none",background:"linear-gradient(135deg,#f59e0b,#ef4444)",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",margin:"0 auto"}}><span style={{fontSize:28}}>&#x25b6;\ufe0f</span></button>
            <p style={{color:"var(--t2)",fontSize:12,marginTop:8}}>Tap to play question + responses</p></div>}
          {aState==="playing"&&<div>
            <div style={{fontSize:40,animation:"pulse 1.5s infinite"}}>&#x1F50A;</div>
            <p className="out" style={{color:"var(--orange)",fontSize:13,marginTop:8}}>{curOpt>=0?"Playing response "+String.fromCharCode(65+curOpt)+"...":"Playing question..."}</p></div>}
          {aState==="done"&&<div style={{textAlign:"left",animation:"fadeIn .3s"}}>
            <p className="out" style={{color:"var(--green)",fontSize:13,fontWeight:600,marginBottom:16,textAlign:"center"}}>Choose the best response</p>
            <div style={{display:"flex",flexDirection:"column",gap:8}}>
              {it2.opts.map(function(opt,i){var sel=ans.p2[qi]===i;return(<button key={i} onClick={function(){pick(i);}} style={{display:"flex",alignItems:"center",gap:10,padding:"12px 14px",background:sel?"rgba(212,148,58,.15)":"var(--bg2)",border:"1px solid "+(sel?"var(--cyan)":"var(--bdr)"),borderRadius:12,cursor:"pointer",fontSize:13,color:"var(--t1)",textAlign:"left",fontFamily:"'DM Sans',sans-serif"}}>
                <div style={{width:26,height:26,borderRadius:"50%",border:"2px solid "+(sel?"var(--cyan)":"var(--t3)"),display:"flex",alignItems:"center",justifyContent:"center",fontSize:11,fontWeight:700,flexShrink:0,background:sel?"var(--cyan)":"transparent",color:sel?"#fff":"var(--t3)"}}>{String.fromCharCode(65+i)}</div>
                <span>{opt}</span></button>);})}
            </div></div>}
        </div>
      </div>);
    }

    // ── P3: Conversations ──
    if(sec==="p3"){
      var c3=LP3[qi];var q3=c3.qs[sqi];
      return(<div style={{padding:"20px 16px",minHeight:"100vh"}}>
        {header}
        <div style={{fontSize:11,color:"var(--t3)",marginBottom:8}}>Conversation {qi+1}/{LP3.length} \u2014 Question {sqi+1}/{c3.qs.length}</div>
        {aState==="ready"&&<div style={{textAlign:"center",marginTop:20,marginBottom:20}}>
          <div className="crd" style={{padding:12,marginBottom:16,textAlign:"left"}}>
            <div style={{fontSize:11,color:"var(--t3)",marginBottom:6}}>Preview questions:</div>
            {c3.qs.map(function(qq,i){return(<div key={i} style={{fontSize:12,color:"var(--t2)",lineHeight:1.6}}>{i+1}. {qq.q}</div>);})}
          </div>
          <button onClick={playP3} style={{width:70,height:70,borderRadius:"50%",border:"none",background:"linear-gradient(135deg,#8b5cf6,#ec4899)",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",margin:"0 auto"}}><span style={{fontSize:28}}>&#x25b6;\ufe0f</span></button>
          <p style={{color:"var(--t2)",fontSize:12,marginTop:8}}>Play conversation</p></div>}
        {aState==="playing"&&<div style={{textAlign:"center",marginTop:30}}><div style={{fontSize:40,animation:"pulse 1.5s infinite"}}>&#x1F5E3;\ufe0f</div><p className="out" style={{color:"var(--purple)",fontSize:13,marginTop:8}}>Listening to conversation...</p></div>}
        {aState==="done"&&<div style={{animation:"fadeIn .3s"}}>
          <h3 className="out" style={{fontWeight:700,fontSize:15,lineHeight:1.5,marginBottom:16}}>{q3.q}</h3>
          <div style={{display:"flex",flexDirection:"column",gap:8}}>
            {q3.opts.map(function(opt,i){var sel=ans.p3[qi][sqi]===i;return(<button key={i} onClick={function(){pick(i);}} style={{display:"flex",alignItems:"center",gap:10,padding:"12px 14px",background:sel?"rgba(212,148,58,.15)":"var(--bg2)",border:"1px solid "+(sel?"var(--cyan)":"var(--bdr)"),borderRadius:12,cursor:"pointer",fontSize:13,color:"var(--t1)",textAlign:"left",fontFamily:"'DM Sans',sans-serif"}}>
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
        <div style={{fontSize:11,color:"var(--t3)",marginBottom:8}}>Talk {qi+1}/{LP4.length} ({t4.type}) \u2014 Question {sqi+1}/{t4.qs.length}</div>
        {aState==="ready"&&<div style={{textAlign:"center",marginTop:20,marginBottom:20}}>
          <div className="crd" style={{padding:12,marginBottom:16,textAlign:"left"}}>
            <div style={{fontSize:11,color:"var(--t3)",marginBottom:6}}>Preview questions:</div>
            {t4.qs.map(function(qq,i){return(<div key={i} style={{fontSize:12,color:"var(--t2)",lineHeight:1.6}}>{i+1}. {qq.q}</div>);})}
          </div>
          <button onClick={playP4} style={{width:70,height:70,borderRadius:"50%",border:"none",background:"linear-gradient(135deg,#06b6d4,#3b82f6)",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",margin:"0 auto"}}><span style={{fontSize:28}}>&#x25b6;\ufe0f</span></button>
          <p style={{color:"var(--t2)",fontSize:12,marginTop:8}}>Play talk</p></div>}
        {aState==="playing"&&<div style={{textAlign:"center",marginTop:30}}><div style={{fontSize:40,animation:"pulse 1.5s infinite"}}>&#x1F3A4;</div><p className="out" style={{color:"var(--cyan)",fontSize:13,marginTop:8}}>Listening to talk...</p></div>}
        {aState==="done"&&<div style={{animation:"fadeIn .3s"}}>
          <h3 className="out" style={{fontWeight:700,fontSize:15,lineHeight:1.5,marginBottom:16}}>{q4.q}</h3>
          <div style={{display:"flex",flexDirection:"column",gap:8}}>
            {q4.opts.map(function(opt,i){var sel=ans.p4[qi][sqi]===i;return(<button key={i} onClick={function(){pick(i);}} style={{display:"flex",alignItems:"center",gap:10,padding:"12px 14px",background:sel?"rgba(212,148,58,.15)":"var(--bg2)",border:"1px solid "+(sel?"var(--cyan)":"var(--bdr)"),borderRadius:12,cursor:"pointer",fontSize:13,color:"var(--t1)",textAlign:"left",fontFamily:"'DM Sans',sans-serif"}}>
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
          {q5.o.map(function(opt,i){var isSel=sel5===i;return(<button key={i} onClick={function(){pick(i);}} style={{display:"flex",alignItems:"center",gap:12,padding:"14px 16px",background:isSel?"rgba(212,148,58,.15)":"var(--bg2)",border:"1px solid "+(isSel?"var(--cyan)":"var(--bdr)"),borderRadius:12,cursor:"pointer",fontSize:14,color:"var(--t1)",textAlign:"left",fontFamily:"'DM Sans',sans-serif"}}>
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
        if(pt.blank){var bIdx=blanks6.indexOf(pt)+1;renderedText.push(<span key={pi} style={{padding:"2px 8px",borderRadius:4,background:bIdx-1===sqi?"rgba(212,148,58,.2)":"rgba(100,100,100,.15)",fontWeight:700,color:bIdx-1===sqi?"var(--cyan)":"var(--t2)"}}>{"["+bIdx+"]"}</span>);}
        else renderedText.push(<span key={pi}>{pt.text}</span>);
      });
      return(<div style={{padding:"20px 16px",minHeight:"100vh"}}>
        {header}
        <div style={{fontSize:11,color:"var(--t3)",marginBottom:8}}>{t6.type} \u2014 Blank {sqi+1}/{blankNum}</div>
        <div className="crd" style={{padding:14,marginBottom:16,maxHeight:200,overflowY:"auto",lineHeight:1.7,fontSize:12,whiteSpace:"pre-wrap"}}>{renderedText}</div>
        <div style={{display:"flex",flexDirection:"column",gap:8}}>
          {bl6.options.map(function(opt,i){var isSel=sel6===i;return(<button key={i} onClick={function(){pick(i);}} style={{display:"flex",alignItems:"center",gap:10,padding:"12px 14px",background:isSel?"rgba(212,148,58,.15)":"var(--bg2)",border:"1px solid "+(isSel?"var(--cyan)":"var(--bdr)"),borderRadius:12,cursor:"pointer",fontSize:13,color:"var(--t1)",textAlign:"left",fontFamily:"'DM Sans',sans-serif"}}>
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
        <div className="crd" style={{padding:14,marginBottom:16,maxHeight:200,overflowY:"auto",lineHeight:1.7,fontSize:12,whiteSpace:"pre-wrap"}}>{ps7.text}</div>
        <h3 className="out" style={{fontWeight:700,fontSize:15,lineHeight:1.5,marginBottom:16}}>{pq7.q}</h3>
        <div style={{display:"flex",flexDirection:"column",gap:8}}>
          {pq7.options.map(function(opt,i){var isSel=sel7===i;return(<button key={i} onClick={function(){pick(i);}} style={{display:"flex",alignItems:"center",gap:10,padding:"12px 14px",background:isSel?"rgba(212,148,58,.15)":"var(--bg2)",border:"1px solid "+(isSel?"var(--cyan)":"var(--bdr)"),borderRadius:12,cursor:"pointer",fontSize:13,color:"var(--t1)",textAlign:"left",fontFamily:"'DM Sans',sans-serif"}}>
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
    var gradeIcon=result.toeicEstimate>=800?"\ud83d\udc51":result.toeicEstimate>=600?"\u2694\ufe0f":result.toeicEstimate>=400?"\ud83d\udee1\ufe0f":"\ud83d\udcd6";
    var gradeCol=result.toeicEstimate>=800?"var(--gold)":result.toeicEstimate>=600?"var(--green)":result.toeicEstimate>=400?"var(--orange)":"var(--red)";
    var xp=100+result.score*3+(result.toeicEstimate>=800?100:result.toeicEstimate>=600?50:0);

    return(<div className="enter" style={{padding:"20px 16px 100px",minHeight:"100vh",textAlign:"center"}}>
      <div style={{fontSize:64,marginBottom:12,animation:"countUp .6s"}}>{gradeIcon}</div>
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

      <button className="btn2" onClick={function(){result.mockId="boss";p.done(result,xp);}} style={{width:"100%",fontSize:16,padding:"14px 24px"}}>Save & Exit</button>
    </div>);
  }

  return null;
}

'''

app, ok = patch(app,
    "function MockTest(p){",
    BOSS_COMPONENT,
    "before")
if ok: ok_count += 1

# ═══════════════════════════════════════
# PATCH 5: bossDone handler
# ═══════════════════════════════════════
print("5/7 — bossDone handler...")
BOSS_DONE = '''
  function bossDone(result,xp){var c=addXp(xp);c.stats.totalQ+=result.total;c.stats.correct+=result.score;c.stats.sessions+=1;if(!c.mockResults)c.mockResults={};var prev=c.mockResults.boss;if(!prev||result.toeicEstimate>=prev.toeicEstimate){c.mockResults.boss=result;}else{c.mockResults.boss=Object.assign({},prev,{date:result.date});}recordModule(c,"boss",result.score,result.total);try{if(result.total>0&&result.score/result.total>=0.7)playJingleMock();else playJingleMockOk();}catch(e){}sv(c);}'''

app, ok = patch(app,
    '  function mockDone(result,xp){',
    BOSS_DONE + '\n',
    "before")
if ok: ok_count += 1

# ═══════════════════════════════════════
# PATCH 6: Route for Boss Test
# ═══════════════════════════════════════
print("6/7 — Route...")
BOSS_ROUTE = '\n  if(sp==="boss")return(<div className={lc}><style>{CSS}</style><BossTest u={u} done={bossDone} back={function(){sSP(null);sT("train");}}/></div>);'

app, ok = patch(app,
    '  if(sp==="mock3")',
    BOSS_ROUTE,
    "before")
if ok: ok_count += 1

# ═══════════════════════════════════════
# PATCH 7: Achievement
# ═══════════════════════════════════════
print("7/7 — Achievement...")
BOSS_ACH = '''
  // ─── BOSS TEST ───
  {id:"boss_complete",name:"Arena Conqueror",desc:"Complete The Final Arena",icon:"\\ud83d\\udc09",check:function(s){return s.mockResults&&s.mockResults.boss;}},
  {id:"boss_800",name:"Dragon Slayer",desc:"Score 800+ on The Final Arena",icon:"\\ud83d\\udd25",check:function(s){return s.mockResults&&s.mockResults.boss&&s.mockResults.boss.toeicEstimate>=800;}},'''

ach, ok = patch(ach,
    '  // ─── GAME DIVERSITY ───',
    BOSS_ACH + '\n',
    "before")
if ok: ok_count += 1

# ═══════════════════════════════════════
# WRITE FILES
# ═══════════════════════════════════════
with open(APP, "w", encoding="utf-8") as f:
    f.write(app)
with open(ACH, "w", encoding="utf-8") as f:
    f.write(ach)

print(f"\n{'='*40}")
print(f"✅ {ok_count}/{total} patches applied")
if ok_count < total:
    print("⚠️ Some patches failed — check anchors above")
else:
    print("🐉 Boss Test integration complete!")
print(f"{'='*40}")
