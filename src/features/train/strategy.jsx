// Extrait de src/App.jsx le 2026-09-15 (refactor split-app, REFACTOR_PLAN.md). Code déplacé tel quel.
import { Bar } from "../../components/Bar.jsx";
import { GIcon, ResultIcon } from "../../components/icons.jsx";
import { GAME_ICON_PATHS } from "../../data/avatarIcons.js";
import { STRATEGIES, STRAT_QUIZ } from "../../data/miniGames.js";
import { shuffle } from "../../lib/util.js";
import { tone } from "../../lib/tone.js";
import { playCorrect, playWrong } from "../../sounds.js";
import { useState, useMemo } from "react";

// ─── STRATEGY CARDS (enriched) ───
// ─── ABOUT TOEIC (info page for newcomers) ───
export function AboutToeic(p){
  var cefrBands=[
    {band:"120-220",cefr:"A1",label:"Basic user",col:"#888888"},
    {band:"225-545",cefr:"A2",label:"Elementary",col:"#c87a35"},
    {band:"550-780",cefr:"B1",label:"Intermediate",col:"#d4943a"},
    {band:"785-940",cefr:"B2",label:"Upper-intermediate \u2014 common pro target",col:"#4abe60"},
    {band:"945-990",cefr:"C1",label:"Advanced",col:"#f0c850"},
  ];
  return(<div className="enter" style={{padding:"20px 16px 100px"}}>
    <button className="back-btn" onClick={p.back}>{"\u2190"} Back</button>

    <div style={{textAlign:"center",marginBottom:24}}>
      <div style={{fontSize:56,marginBottom:8}}>{"\uD83C\uDF93"}</div>
      <h1 className="out" style={{fontWeight:800,fontSize:24,marginBottom:4}}>What is the TOEIC?</h1>
      <p style={{color:"var(--t2)",fontSize:13}}>A quick guide to the exam you're training for</p>
    </div>

    {/* What & Who */}
    <div className="crd" style={{marginBottom:14,padding:18}}>
      <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:10}}>
        <span style={{fontSize:26}}>{"\uD83D\uDCDC"}</span>
        <h3 className="out" style={{fontWeight:700,fontSize:16,margin:0}}>The exam</h3>
      </div>
      <p style={{fontSize:13,color:"var(--t1)",lineHeight:1.6,marginBottom:8}}>
        <strong>TOEIC</strong> stands for <em>Test of English for International Communication</em>. Published by <strong>ETS</strong>, it measures your ability to use English in professional and everyday contexts.
      </p>
      <p style={{fontSize:12,color:"var(--t2)",lineHeight:1.5}}>
        It is the most widely recognized English certification in France for universities, recruiters and career moves {"\u2014"} over 7 million tests are taken worldwide each year.
      </p>
    </div>

    {/* Structure */}
    <h3 className="out" style={{fontWeight:700,fontSize:12,color:"var(--t2)",marginBottom:10,marginTop:20,textTransform:"uppercase",letterSpacing:1.5}}>Exam structure</h3>
    <div className="crd" style={{marginBottom:10,padding:16,background:"linear-gradient(135deg,rgba(34,197,94,.06),rgba(245,158,11,.06))",borderColor:"rgba(34,197,94,.18)"}}>
      <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:10}}>
        <span style={{fontSize:26}}>{"\uD83D\uDC42"}</span>
        <div>
          <div className="out" style={{fontWeight:800,fontSize:15,color:"var(--green)"}}>Listening</div>
          <div style={{fontSize:11,color:"var(--t3)"}}>45 minutes {"\u00B7"} 100 questions {"\u00B7"} Score 5-495</div>
        </div>
      </div>
      <div style={{fontSize:12,color:"var(--t2)",lineHeight:1.7,paddingLeft:2}}>
        <div>{"\u00B7"} <strong>Part 1</strong> {"\u2014"} Photographs (6 Q)</div>
        <div>{"\u00B7"} <strong>Part 2</strong> {"\u2014"} Question-Response (25 Q)</div>
        <div>{"\u00B7"} <strong>Part 3</strong> {"\u2014"} Conversations (39 Q)</div>
        <div>{"\u00B7"} <strong>Part 4</strong> {"\u2014"} Short talks (30 Q)</div>
      </div>
    </div>
    <div className="crd" style={{marginBottom:10,padding:16,background:"linear-gradient(135deg,rgba(90,122,154,.08),rgba(122,90,128,.08))",borderColor:"rgba(127,164,212,.25)"}}>
      <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:10}}>
        <span style={{fontSize:26}}>{"\uD83D\uDCD6"}</span>
        <div>
          <div className="out" style={{fontWeight:800,fontSize:15,color:tone("#7fa4d4")}}>Reading</div>
          <div style={{fontSize:11,color:"var(--t3)"}}>75 minutes {"\u00B7"} 100 questions {"\u00B7"} Score 5-495</div>
        </div>
      </div>
      <div style={{fontSize:12,color:"var(--t2)",lineHeight:1.7,paddingLeft:2}}>
        <div>{"\u00B7"} <strong>Part 5</strong> {"\u2014"} Incomplete Sentences (30 Q)</div>
        <div>{"\u00B7"} <strong>Part 6</strong> {"\u2014"} Text Completion (16 Q)</div>
        <div>{"\u00B7"} <strong>Part 7</strong> {"\u2014"} Reading Passages (54 Q)</div>
      </div>
    </div>
    <div style={{fontSize:11,color:"var(--t3)",textAlign:"center",marginBottom:18,fontStyle:"italic"}}>
      Total: 200 multiple-choice questions {"\u00B7"} 2 hours {"\u00B7"} Final score {"10\u2013990"}
    </div>

    {/* CEFR Scoring */}
    <div className="crd" style={{marginBottom:14,padding:18}}>
      <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:12}}>
        <span style={{fontSize:26}}>{"\uD83C\uDFAF"}</span>
        <h3 className="out" style={{fontWeight:700,fontSize:16,margin:0}}>What your score means</h3>
      </div>
      <div style={{display:"flex",flexDirection:"column",gap:6}}>
        {cefrBands.map(function(r,i){return(<div key={i} style={{display:"flex",alignItems:"center",gap:10,padding:"8px 10px",background:"var(--bg3)",borderRadius:8}}>
          <div className="out" style={{fontWeight:800,fontSize:12,color:tone(r.col),minWidth:62}}>{r.band}</div>
          <div className="out" style={{fontWeight:700,fontSize:11,color:tone(r.col),minWidth:22,padding:"2px 6px",background:"rgba(255,255,255,.04)",borderRadius:4,textAlign:"center"}}>{r.cefr}</div>
          <div style={{fontSize:11,color:"var(--t2)",flex:1,minWidth:0}}>{r.label}</div>
        </div>);})}
      </div>
      <p style={{fontSize:11,color:"var(--t3)",lineHeight:1.5,marginTop:12,fontStyle:"italic"}}>
        Most French business schools target <strong style={{color:"var(--green)"}}>B2 (785+)</strong>. Many companies list "TOEIC 750" as a hiring bar.
      </p>
    </div>

    {/* Why & Validity */}
    <div className="crd" style={{marginBottom:14,padding:18}}>
      <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:12}}>
        <span style={{fontSize:26}}>{"\uD83C\uDF0D"}</span>
        <h3 className="out" style={{fontWeight:700,fontSize:16,margin:0}}>Why people take it</h3>
      </div>
      <div style={{fontSize:12,color:"var(--t2)",lineHeight:1.8}}>
        <div><span style={{fontSize:15}}>{"\uD83C\uDF93"}</span> <strong>Universities</strong> {"\u2014"} graduation requirement in many French business schools and engineering curricula</div>
        <div><span style={{fontSize:15}}>{"\uD83D\uDCBC"}</span> <strong>Employers</strong> {"\u2014"} HR uses it as a quick English-level benchmark for hiring</div>
        <div><span style={{fontSize:15}}>{"\u2708\uFE0F"}</span> <strong>International roles</strong> {"\u2014"} proof of working English for mobility, expat moves, internships abroad</div>
      </div>
      <div style={{borderTop:"1px solid var(--bdr)",marginTop:14,paddingTop:12,fontSize:11,color:"var(--t3)",lineHeight:1.5}}>
        <strong>Validity:</strong> scores are officially valid for 2 years from the test date (ETS recommendation). Some employers accept older scores, most do not.
      </div>
    </div>

    {/* Your roadmap */}
    <div className="crd" style={{padding:18,background:"linear-gradient(135deg,rgba(var(--cx),.08),rgba(139,94,131,.08))",borderColor:"rgba(var(--cx),.25)"}}>
      <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:12}}>
        <span style={{fontSize:26}}>{"\u2694\uFE0F"}</span>
        <h3 className="out" style={{fontWeight:700,fontSize:16,margin:0,color:"var(--cx-hex)"}}>How Verse Arena trains you</h3>
      </div>
      <div style={{fontSize:12,color:"var(--t2)",lineHeight:1.9}}>
        <div><span style={{fontSize:15}}>{"\uD83C\uDFA7"}</span> <strong>Listening Practice</strong> {"\u2014"} all 4 parts, real audio, escalating difficulty</div>
        <div><span style={{fontSize:15}}>{"\uD83D\uDCD6"}</span> <strong>Reading Practice</strong> {"\u2014"} Parts 5 to 7, from grammar drills to long passages</div>
        <div><span style={{fontSize:15}}>{"\uD83D\uDCDC"}</span> <strong>3 Mock Tests</strong> {"\u2014"} exam-like half-tests to measure your real level</div>
        <div><span style={{fontSize:15}}>{"\uD83D\uDC09"}</span> <strong>The Final Arena</strong> {"\u2014"} the full 200-question Boss Test</div>
        <div><span style={{fontSize:15}}>{"\u23F3"}</span> <strong>Endless Arena</strong> {"\u2014"} unlimited replay once you hit 650+</div>
        <div><span style={{fontSize:15}}>{"\uD83C\uDF7A"}</span> <strong>Word Tavern</strong> {"\u2014"} 1,070 business vocab across 21 domains</div>
      </div>
      <div style={{marginTop:14,paddingTop:12,borderTop:"1px solid rgba(var(--cx),.15)",fontSize:11,color:"var(--t3)",textAlign:"center",fontStyle:"italic",lineHeight:1.5}}>
        Every module you play feeds your <strong style={{color:"var(--cx-hex)"}}>TOEIC score estimate</strong>, visible in your Profile.
      </div>
    </div>
  </div>);
}
export function StratCards(p){
  var[open,sO]=useState(null);
  var[filter,sF]=useState("all");
  var filtered=STRATEGIES.filter(function(s){return filter==="all"||s.section===filter||s.section==="Both";});
  var totalTips=0;STRATEGIES.forEach(function(s){totalTips+=s.tips.length;});

  return(<div className="enter" style={{padding:"20px 16px 100px"}}>
    <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16}}>
      <button className="back-btn" onClick={p.back}>{"\u2190"} Back</button>
      <span className="out" style={{fontWeight:700,fontSize:15}}>Strategy Cards</span>
      <div style={{width:40}}/></div>

    <div className="crd" style={{padding:14,marginBottom:16,textAlign:"center",background:"rgba(var(--cx),.04)",borderColor:"rgba(var(--cx),.12)"}}>
      <span className="out" style={{fontWeight:800,fontSize:22,color:"var(--cyan)"}}>{totalTips}</span>
      <span style={{fontSize:13,color:"var(--t2)",marginLeft:6}}>expert strategies across all TOEIC Parts</span></div>

    <div style={{display:"flex",gap:8,marginBottom:16}}>
      {[{id:"all",l:"All",i:null},{id:"Listening",l:"Listening",i:"ringing-bell"},{id:"Reading",l:"Reading",i:"book-aura"}].map(function(f){
        var act=filter===f.id;
        var col=act?"var(--cyan)":"var(--t3)";
        return(
        <button key={f.id} onClick={function(){sF(f.id);sO(null);}}
          style={{flex:1,padding:"8px 4px",borderRadius:10,border:act?"1px solid var(--cyan)":"1px solid var(--bdr)",background:act?"rgba(var(--cx),.1)":"var(--bg2)",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",gap:6}}>
          {f.i&&GAME_ICON_PATHS[f.i]&&<GIcon name={f.i} size={14} color={col}/>}
          <span className="out" style={{fontSize:12,fontWeight:act?700:500,color:col}}>{f.l}</span></button>);})}
    </div>

    <div style={{display:"flex",flexDirection:"column",gap:10}}>
      {filtered.map(function(s,idx){
        var isOpen=open===idx;
        var tipCount=s.tips.length;
        return(<div key={idx} className="crd" style={{padding:0,overflow:"hidden",borderColor:isOpen?"var(--cyan)44":"var(--bdr)",transition:"all .3s"}}>
          <button onClick={function(){sO(isOpen?null:idx);}} style={{width:"100%",display:"flex",alignItems:"center",gap:14,padding:"14px 16px",background:"none",border:"none",cursor:"pointer",textAlign:"left"}}>
            <div style={{flexShrink:0,width:34,height:34,display:"flex",alignItems:"center",justifyContent:"center",fontSize:26}}>{GAME_ICON_PATHS[s.icon]?<GIcon name={s.icon} size={28} color={s.section==="Listening"?tone("#7fb8e8"):s.section==="Reading"?tone("#c4587a"):"var(--cyan)"}/>:s.icon}</div>
            <div style={{flex:1}}>
              <div className="out" style={{fontWeight:700,fontSize:15,color:"var(--t1)"}}>{s.part} {"—"} {s.title}</div>
              <div style={{display:"flex",gap:8,marginTop:3}}>
                {s.qs>0&&<span style={{fontSize:10,color:"var(--t3)",background:"var(--bg3)",padding:"2px 6px",borderRadius:4}}>{s.qs} Qs</span>}
                <span style={{fontSize:10,color:"var(--cyan)",background:"rgba(var(--cx),.06)",padding:"2px 6px",borderRadius:4}}>{tipCount} tips</span>
              </div></div>
            <span style={{fontSize:12,color:"var(--t3)",transform:isOpen?"rotate(180deg)":"rotate(0)",transition:"transform .2s"}}>{"▼"}</span>
          </button>
          {isOpen&&<div style={{padding:"0 16px 16px",animation:"fadeIn .2s"}}>
            <div style={{padding:"8px 12px",background:"rgba(255,215,0,.05)",borderRadius:10,marginBottom:14}}>
              <p className="out" style={{fontSize:12,fontWeight:700,color:"var(--gold)"}}>{s.points}</p></div>
            {s.tips.map(function(tip,ti){return(
              <div key={ti} style={{padding:"12px 0",borderTop:ti>0?"1px solid var(--bdr)":"none"}}>
                <div style={{display:"flex",gap:8,alignItems:"baseline",marginBottom:4}}>
                  <span className="out" style={{color:"var(--cyan)",fontWeight:800,fontSize:12,flexShrink:0}}>{ti+1}</span>
                  <span className="out" style={{fontWeight:700,fontSize:13,color:"var(--t1)"}}>{tip.t}</span></div>
                <p style={{fontSize:12,color:"var(--t2)",lineHeight:1.6,paddingLeft:20}}>{tip.d}</p>
              </div>);})}
          </div>}
        </div>);
      })}
    </div>

    <div className="crd" style={{marginTop:16,background:"rgba(255,71,87,.06)",borderColor:"rgba(255,71,87,.12)",padding:16,textAlign:"center"}}>
      <p className="out" style={{fontSize:13,fontWeight:700,color:"var(--red)",marginBottom:4}}>Golden Rule</p>
      <p style={{fontSize:13,color:"var(--t2)",lineHeight:1.5}}>If you don't know after 30 seconds on Part 5, GUESS and move on. Time saved = points earned on Part 7.</p>
    </div>
  </div>);
}
// ─── STRATEGY QUIZ ───
export function StratQuizPage(p){
  var qs=useMemo(function(){return shuffle(STRAT_QUIZ).slice(0,10);},[]);
  var[ci,sC]=useState(0);var[sc,sSc]=useState(0);var[ph,sP]=useState("intro");var[pick,sPk]=useState(-1);var[sk,sSk]=useState(false);

  function doAns(i){sPk(i);if(i===qs[ci].correct){sSc(sc+1);try{playCorrect();}catch(e){}}else{try{playWrong();}catch(e){}sSk(true);setTimeout(function(){sSk(false);},400);}sP("fb");}
  function nxt(){if(ci<qs.length-1){sC(ci+1);sPk(-1);sP("q");}else{sP("done");p.done(sc,qs.length,20+sc*5);}}

  if(ph==="intro")return(<div className="enter" style={{padding:"20px 16px",minHeight:"100vh",display:"flex",flexDirection:"column",justifyContent:"center",textAlign:"center"}}>
    <div style={{fontSize:56,marginBottom:16}}>🧠</div>
    <h1 className="out" style={{fontWeight:900,fontSize:26,marginBottom:8}}>Strategy Quiz</h1>
    <p style={{color:"var(--t2)",fontSize:13,marginBottom:8,lineHeight:1.6}}>{qs.length} real TOEIC situations.<br/>Do you know the right strategy?</p>
    <p style={{color:"var(--gold)",fontWeight:600,fontSize:14,marginBottom:32}}>Test your exam IQ, not just your English!</p>
    <button className="btn1" onClick={function(){sP("q");}}>Start Quiz</button>
    <button className="btn2" onClick={p.back} style={{marginTop:12,width:"100%"}}>Back</button></div>);

  if(ph==="done"){var xp=20+sc*5;if(p.gate)xp=p.gate(xp,sc,qs.length);return(<div className="enter" style={{padding:"20px 16px",minHeight:"100vh",display:"flex",flexDirection:"column",justifyContent:"center",textAlign:"center"}}>
    <div style={{fontSize:48,marginBottom:16,animation:"countUp .6s"}}>{(<ResultIcon e={sc>=13?"🏆":sc>=9?"⚔️":"🛡️"} size={52}/>)}</div>
    <h1 className="out" style={{fontWeight:900,fontSize:28,marginBottom:8}}>Quiz Complete!</h1>
    <div className="out" style={{fontSize:44,fontWeight:900,color:sc>=13?"var(--green)":sc>=9?"var(--cyan)":"var(--orange)",marginBottom:4,animation:"countUp .8s"}}>{sc}/{qs.length}</div>
    <div className="out" style={{fontSize:20,fontWeight:800,color:"var(--gold)",marginBottom:12}}>+{xp} XP</div>
    <p style={{fontSize:13,color:"var(--t2)",marginBottom:32}}>Strategy knowledge is just as important as English skills for the TOEIC!</p>
    <button className="btn1" onClick={p.back}>Back to Training</button></div>);}

  var q=qs[ci];
  var partColors={"Part 1":"#22c55e","Part 2":"#f59e0b","Part 3":"#06b6d4","Part 4":"#8b5cf6","Part 5":"#ef4444","Part 6":"#ec4899","Part 7":"#3b82f6","General":"#64748b"};
  var pc=partColors[q.part]||"var(--cyan)";

  return(<div className={sk?"sk":""} style={{padding:"20px 16px",minHeight:"100vh"}}>
    <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:20}}>
      <button className="back-btn" onClick={p.back}>{"\u2190"} Back</button>
      <span className="out" style={{fontSize:13,color:"var(--t2)",fontWeight:600}}>{ci+1}/{qs.length}</span></div>
    <Bar value={ci} max={qs.length} h={4} color="linear-gradient(90deg,#b07830,#8b5e83)"/>

    <div style={{marginTop:16,marginBottom:20}}>
      <span className="out" style={{fontSize:10,fontWeight:700,color:pc,textTransform:"uppercase",letterSpacing:1,padding:"3px 8px",background:pc+"18",borderRadius:6}}>{q.part}</span></div>

    <div className="crd" style={{padding:16,marginBottom:20,background:"rgba(27,112,207,.05)",borderColor:"rgba(27,112,207,.12)"}}>
      <p className="out" style={{fontSize:11,fontWeight:600,color:"var(--purple)",textTransform:"uppercase",letterSpacing:.5,marginBottom:8}}>Situation</p>
      <p style={{fontSize:15,color:"var(--t1)",lineHeight:1.6}}>{q.scenario}</p></div>

    <div style={{display:"flex",flexDirection:"column",gap:8}}>
      {q.options.map(function(opt,i){
        var isCor=i===q.correct;var isPick=pick===i;var show=ph==="fb";
        var bg="var(--bg2)";var bd="var(--bdr)";
        if(show&&isCor){bg="rgba(0,230,118,.12)";bd="var(--green)";}
        else if(show&&isPick&&!isCor){bg="rgba(255,71,87,.12)";bd="var(--red)";}
        return(<button key={i} onClick={function(){if(ph==="q")doAns(i);}} disabled={show}
          style={{display:"flex",alignItems:"center",gap:12,padding:"12px 14px",background:bg,border:"1px solid "+bd,borderRadius:12,cursor:ph==="q"?"pointer":"default",fontSize:14,color:"var(--t1)",textAlign:"left",fontFamily:"'DM Sans',sans-serif",transition:"all .2s"}}>
          <div style={{width:24,height:24,borderRadius:"50%",border:"2px solid "+(show&&isCor?"var(--green)":show&&isPick?"var(--red)":"var(--t3)"),display:"flex",alignItems:"center",justifyContent:"center",fontSize:11,fontWeight:700,flexShrink:0,background:show&&isCor?"var(--green)":show&&isPick&&!isCor?"var(--red)":"transparent",color:show&&(isCor||isPick)?"#fff":"var(--t3)"}}>
            {show&&isCor?"✓":show&&isPick?"✗":String.fromCharCode(65+i)}</div>
          <span>{opt}</span></button>);})}
    </div>

    {ph==="fb"&&<div style={{marginTop:16,animation:"fadeIn .3s"}}>
      <div className="crd" style={{background:"rgba(var(--cx),.06)",borderColor:"rgba(var(--cx),.15)",padding:16}}>
        <p className="out" style={{fontSize:12,fontWeight:700,color:"var(--cyan)",textTransform:"uppercase",marginBottom:6}}>Why this works</p>
        <p style={{fontSize:13,color:"var(--t2)",lineHeight:1.6}}>{q.explain}</p></div>
      <button className="btn1" onClick={nxt} style={{marginTop:16}}>{ci<qs.length-1?"Next":"See Results"}</button></div>}
  </div>);
}
