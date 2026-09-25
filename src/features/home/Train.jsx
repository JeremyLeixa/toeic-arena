// Extrait de src/App.jsx le 2026-09-15 (refactor split-app, REFACTOR_PLAN.md). Code déplacé tel quel.
import { GIcon, ResultIcon } from "../../components/icons.jsx";
import { MockResetCTA, BossResetCTA, EndlessResetCTA } from "../../components/TokenCTAs.jsx";
import { HubTile, HubShelf } from "../../components/HubTile.jsx";
import { GAME_ICON_PATHS } from "../../data/avatarIcons.js";
import { hasFullAccess, isModuleLocked } from "../../lib/access.js";
import { canUnlockMock, canUnlockBoss, getEndlessState } from "../../lib/progress.js";
import { today } from "../../lib/util.js";
import { hubItemStatus, hubSummary } from "../../lib/hubStatus.js";
import { GAUNTLET_MODS } from "../../lib/gauntletTrials.js";
import { tone } from "../../lib/tone.js";
import { useState } from "react";

// ─── TRAIN PAGE ───
  export function Train(p){
  var[trainView,setTrainView]=useState(p.initialView!=null?p.initialView:null);
  var dd=p.u.daily&&p.u.daily.date===today()&&p.u.daily.done;

  // ── Section data (unchanged) ──
  var sections=[
    {key:"exercises",title:"Exercises",sub:"TOEIC Parts training",icon:"crossed-swords",count:"Parts 1-7",items:[
      {id:"daily",n:"Daily Challenge",d:dd?"Completed today ✓":"5 daily questions, timed",i:"sunrise",bg:dd?"var(--bg3)":"linear-gradient(135deg,var(--cx-hex),#8b5e83)",lock:dd},
      {id:"lis",n:"Listening Practice",d:"Parts 1-4 with audio",i:"ringing-bell",bg:"linear-gradient(135deg,#22c55e,#f59e0b)",subs:["lisP1","lisP2","lisP3","lisP4"],unit:"parts"},
      {id:"read",n:"Reading Practice",d:"Parts 5-7",i:"bookmarklet",bg:"linear-gradient(135deg,#5a7a9a,#7a5a80)",subs:["drill","timesim","p6","p7"],unit:"parts"},
    ]},
    {key:"grammar",title:"Grammar & Vocab",sub:"Build your foundations",icon:"bookshelf",count:"7 modules",items:[
      {id:"csess",n:"Flashcard Review",d:"SRS spaced repetition",i:"card-joker",bg:"linear-gradient(135deg,#ff8c42,#ff6b35)"},
      {id:"gauntlet",n:"Grammar Gauntlet",d:"7 trials · Tenses, Passive, Relatives, Connectors, Prepositions…",i:"gauntlet",bg:"linear-gradient(135deg,#7c3aed,#c026d3)",subs:GAUNTLET_MODS,unit:"trials"},
      {id:"modals",n:"Modal Council",d:"2 trials · Pair situations, classify verdicts",i:"throne-king",bg:"linear-gradient(135deg,#0891b2,#7c3aed)",subs:["modals_match","modals_sort"],unit:"trials"},
      {id:"wordfam",n:"Word Families",d:"Classify: Noun, Verb, Adj, Adv",i:"family-tree",bg:"linear-gradient(135deg,#f59e0b,#ef4444)"},
      {id:"falsefr",n:"False Friends",d:"FR/EN traps: actually ≠ actuellement",i:"duality-mask",bg:"linear-gradient(135deg,#ec4899,#f59e0b)"},
      {id:"bforge",n:"Linking Bridge",d:"Pick the connector that fits the logic & grammar",i:"stone-bridge",bg:"linear-gradient(135deg,#8b5e83,#06b6d4)",tag:"NEW"},
      {id:"pvdojo",n:"Phrasal Verb Dojo",d:"55 verbs · Study, Match & Speed",i:"shuriken",bg:"linear-gradient(135deg,#f97316,#dc2626)"},
    ]},
    {key:"mocks",title:"Mock Exams",sub:"Real conditions",icon:"scroll-unfurled",count:"3 tests",items:(function(){
      var items=[];
      var u1=canUnlockMock(p.u,1);
      items.push({id:"mock1",n:"Mock Test 1",d:u1.ok?"Reading Half-Test · 49 Q · 37 min":u1.reasons[0],i:"scroll-quill",bg:u1.ok?"linear-gradient(135deg,#ffd700,#ff8c42)":"var(--bg3)",lock:!u1.ok,mockId:1});
      var u2=canUnlockMock(p.u,2);
      items.push({id:"mock2",n:"Mock Test 2",d:u2.ok?"Reading Half-Test · 49 Q · 37 min":u2.reasons[0],i:"scroll-quill",bg:u2.ok?"linear-gradient(135deg,#8b5e83,#c4587a)":"var(--bg3)",lock:!u2.ok,mockId:2});
      var u3=canUnlockMock(p.u,3);
      items.push({id:"mock3",n:"Mock Test 3",d:u3.ok?"Reading Half-Test · 48 Q · 37 min":u3.reasons[0],i:"scroll-quill",bg:u3.ok?"linear-gradient(135deg,#22c55e,#06b6d4)":"var(--bg3)",lock:!u3.ok,mockId:3});
      // V2 — Mocks lock permanently after completion, UNLESS Mock Reset is armed.
      // The token bypasses the lock for any of the 3 mocks ; mockDone clears the flag
      // after the run so a single token = one replay.
      var mockArmed=!!(p.u.boosts&&p.u.boosts.mockResetArmed); // jeton Mock Reset, dans boosts (persisté)
      if(p.u.mockResults&&p.u.mockResults.mock1){items[0].d="Completed — TOEIC "+p.u.mockResults.mock1.toeicEstimate+"/495"+(mockArmed?" · 🎟️ Reset armed":"");if(!mockArmed){items[0].lock=true;items[0].bg="var(--bg3)";}}
      if(p.u.mockResults&&p.u.mockResults.mock2){items[1].d="Completed — TOEIC "+p.u.mockResults.mock2.toeicEstimate+"/495"+(mockArmed?" · 🎟️ Reset armed":"");if(!mockArmed){items[1].lock=true;items[1].bg="var(--bg3)";}}
      if(p.u.mockResults&&p.u.mockResults.mock3){items[2].d="Completed — TOEIC "+p.u.mockResults.mock3.toeicEstimate+"/495"+(mockArmed?" · 🎟️ Reset armed":"");if(!mockArmed){items[2].lock=true;items[2].bg="var(--bg3)";}}
      return items;
    })()},
    {key:"tips",title:"Tips & Strategy",sub:"Master the exam",icon:"treasure-map",count:"5 tools",items:[
      {id:"abouttoeic",n:"What is the TOEIC?",d:"Format, score, levels — the quick guide",i:"info",bg:"linear-gradient(135deg,#8b5e83,#5a7a9a)",plain:true},
      {id:"strats",n:"Strategy Cards",d:"63 expert tips, all Parts",i:"card-pick",bg:"linear-gradient(135deg,#6a8a50,#4a7a5a)",plain:true},
      {id:"stratquiz",n:"Strategy Quiz",d:"Test your exam IQ",i:"brain",bg:"linear-gradient(135deg,#8b5e83,#5a5c8a)"},
      {id:"traps",n:"TOEIC Traps Quiz",d:"Spot the 20 classic traps",i:"trap-mask",bg:"linear-gradient(135deg,#ef4444,#f59e0b)"},
      {id:"gramref",n:"Grammar Reference",d:"12 essential grammar sheets",i:"book-aura",bg:"linear-gradient(135deg,#5a7a9a,#7a5a80)",plain:true},
    ]},
  ];

  // ── Boss Test status ──
  var uBoss=canUnlockBoss(p.u);
  var bossCompleted=p.u.mockResults&&p.u.mockResults.boss;
  var bossLocked=!uBoss.ok;
  var mocksDone=[p.u.mockResults&&p.u.mockResults.mock1,p.u.mockResults&&p.u.mockResults.mock2,p.u.mockResults&&p.u.mockResults.mock3];

  // ── Endless Arena status ──
  var endlessState=getEndlessState(p.u);
  var endlessData=p.u.mockResults&&p.u.mockResults.endless;
  var endlessCooldownH=endlessData&&endlessData.lastAttempt?Math.max(0,Math.ceil((24*60*60*1000-(Date.now()-endlessData.lastAttempt))/3600000)):0;
  var endlessCooldownM=endlessData&&endlessData.lastAttempt?Math.max(0,Math.ceil(((24*60*60*1000-(Date.now()-endlessData.lastAttempt))%3600000)/60000)):0;

  // ── Grid sections (exercises, grammar, tips — NOT mocks) ──
  var gridSections=[sections[0],sections[1],sections[3]]; // exercises, grammar, tips
  var mocksSection=sections[2]; // mocks kept for sub-view

  // ── Visitor locking ──
  // Phase 4: lock premium modules for any user without full access (free/visitor).
  // Institutional users (school/pro) bypass this.
  if(!hasFullAccess(p.u, p.groupType)){
    sections.forEach(function(sec){sec.items.forEach(function(m){
      if(isModuleLocked(m.id,p.u,p.groupType))m.visitorLocked=true;
    });});
  }

  // ═══ SUB-VIEW — show items of selected section ═══
  if(trainView!==null){
    // trainView "mocks" = special sub-view with Ultimate Trials
    if(trainView==="mocks"){
      var animIdx2=0;
      return(<div className="enter" style={{padding:"20px 16px 100px"}}>
        <button onClick={function(){setTrainView(null);}} style={{background:"none",border:"none",color:"var(--t2)",cursor:"pointer",fontSize:14,marginBottom:16,padding:0}}>{"←"} Training Grounds</button>
        <h2 className="out" style={{fontWeight:800,fontSize:20,marginBottom:4}}>Mock Exams</h2>
        <p style={{color:"var(--t3)",fontSize:12,marginBottom:16}}>Real conditions {"·"} full tests</p>

        {/* Mock Test 1/2/3 cards */}
        <div className="rg-games" style={{display:"flex",flexDirection:"column",gap:8}}>
          {mocksSection.items.map(function(m){
            var ai=animIdx2++;
            return(
              <div key={m.id} className="crd" onClick={function(){if(!m.lock)p.nav(m.id);}}
                style={{display:"flex",alignItems:"center",gap:14,cursor:m.lock?"default":"pointer",opacity:m.lock?.4:1,padding:"14px 16px",animation:"fadeIn .3s ease-out",animationDelay:(ai*.04)+"s",animationFillMode:"both"}}>
                <div style={{width:42,height:42,borderRadius:12,background:"linear-gradient(135deg,rgba(var(--cx),.22),transparent)",border:"1.5px solid var(--cyan)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:20,flexShrink:0}}>{GAME_ICON_PATHS[m.i]?<GIcon name={m.i} size={22} color="var(--cyan)"/>:m.i}</div>
                <div style={{flex:1,minWidth:0}}>
                  <div className="out" style={{fontWeight:700,fontSize:14,marginBottom:1}}>{m.n}</div>
                  <div style={{fontSize:11,color:"var(--t3)"}}>{m.d}</div>
                </div>
                {m.lock?<ResultIcon e={"🔒"} size={15} color="var(--t3)"/>:<span style={{fontSize:16,color:"var(--cyan)"}}>{"→"}</span>}
              </div>);
          })}
        </div>

        {/* V2 — Mock Reset CTA shown when at least one Mock has been completed
            (Mocks lock permanently after completion, the token unlocks one replay). */}
        {(function(){
          var anyCompleted=p.u.mockResults&&(p.u.mockResults.mock1||p.u.mockResults.mock2||p.u.mockResults.mock3);
          return anyCompleted?<MockResetCTA u={p.u} setUser={p.setUser}/>:null;
        })()}

        {/* ── ULTIMATE TRIALS separator ── */}
        <div style={{display:"flex",alignItems:"center",gap:10,margin:"18px 0 12px"}}>
          <div style={{flex:1,height:1,background:"#3a2a15"}}/>
          <div style={{fontFamily:"'Cinzel','Outfit',serif",fontSize:11,color:tone("#8a7e6a"),letterSpacing:2}}>ULTIMATE TRIALS</div>
          <div style={{flex:1,height:1,background:"#3a2a15"}}/>
        </div>

        {/* ── Hero Final Arena ── */}
        <div onClick={function(){if(!bossLocked)p.nav("boss");}}
          style={{padding:0,overflow:"hidden",cursor:bossLocked?"default":"pointer",opacity:bossLocked?.55:1,borderRadius:16,border:"1px solid "+(bossLocked?"var(--bdr)":"rgba(220,38,38,.5)"),background:"linear-gradient(135deg,#1a0505,#2a0a0a)",marginBottom:10,animation:"fadeIn .4s ease-out",animationDelay:".15s",animationFillMode:"both"}}>
          <div style={{background:"linear-gradient(135deg,#2a0a0a,#3d1a00,#1a0800)",padding:"18px 16px",position:"relative",overflow:"hidden"}}>
            {!bossCompleted&&<div style={{position:"absolute",inset:0,background:"radial-gradient(ellipse at 30% 90%,rgba(255,100,20,0.35),transparent 55%)",animation:"final-ember-glow 3.5s ease-in-out infinite",pointerEvents:"none"}}/>}
            {!bossCompleted&&<div style={{position:"absolute",inset:0,background:"radial-gradient(ellipse at 70% 85%,rgba(220,38,38,0.25),transparent 50%)",animation:"final-ember-glow 4.5s ease-in-out infinite 0.8s",pointerEvents:"none"}}/>}
            {!bossCompleted&&<><div className="fx-ember sm" style={{left:"18%",bottom:10,animationDelay:"0s"}}/><div className="fx-ember" style={{left:"28%",bottom:8,animationDelay:"0.7s"}}/><div className="fx-ember lg" style={{left:"40%",bottom:12,animationDelay:"1.4s"}}/><div className="fx-ember sm" style={{left:"52%",bottom:6,animationDelay:"2.1s"}}/><div className="fx-ember" style={{left:"63%",bottom:10,animationDelay:"0.3s"}}/><div className="fx-ember sm" style={{left:"74%",bottom:8,animationDelay:"1.0s"}}/><div className="fx-ember" style={{left:"85%",bottom:12,animationDelay:"1.7s"}}/><div className="fx-ember lg" style={{left:"22%",bottom:14,animationDelay:"2.8s"}}/><div className="fx-ember sm" style={{left:"58%",bottom:6,animationDelay:"3.2s"}}/></>}
            {!bossLocked&&<div style={{position:"absolute",inset:0,background:"radial-gradient(ellipse at 80% 30%,rgba(245,158,11,.08),transparent 60%),radial-gradient(ellipse at 20% 70%,rgba(220,38,38,.06),transparent 50%)"}}/>}
            {!bossLocked&&<div style={{position:"absolute",top:-8,right:12,opacity:.1,transform:"scaleX(-1)"}}><GIcon name="dragon-spiral" size={54} color="currentColor"/></div>}
            <div style={{position:"relative",display:"flex",alignItems:"center",gap:14}}>
              <div style={{width:50,height:50,borderRadius:14,background:"linear-gradient(135deg,#dc2626,#f59e0b)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:24,flexShrink:0,boxShadow:bossLocked?"none":"0 0 20px rgba(220,38,38,.3)"}}><GIcon name="dragon-spiral" size={28} color="#fff"/></div>
              <div style={{flex:1}}>
                <div style={{marginBottom:2}}>
                  <span className="out" style={{fontWeight:900,fontSize:16,background:"linear-gradient(90deg,#ff4444,#ff8c42,#ffd700)",WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent"}}>THE FINAL ARENA</span>
                </div>
                {bossCompleted&&!bossLocked?<div style={{fontSize:12,color:/*fond local*/"#f0c850"}}>Best: TOEIC {p.u.mockResults.boss.toeicEstimate}/990 {"—"} Retake?</div>
                :bossLocked?<div style={{fontSize:11,color:/*fond local*/"#756b54"}}>{uBoss.reasons[0]}</div>
                :<div style={{fontSize:12,color:/*fond local*/"#cc8844"}}>Full TOEIC {"·"} 202 Q {"·"} 120 min</div>}
                <div style={{display:"flex",gap:4,marginTop:6}}>
                  {["Mock 1","Mock 2","Mock 3"].map(function(label,i){
                    var done=mocksDone[i];
                    return(<span key={i} style={{fontSize:9,padding:"2px 7px",borderRadius:99,fontWeight:600,
                      background:done?"rgba(34,197,94,.15)":"rgba(255,255,255,.06)",
                      color:done?/*fond local*/"#22c55e":/*fond local*/"#756b54"}}>{done?"✓ ":""}{label}</span>);
                  })}
                </div>
              </div>
              {bossLocked?<ResultIcon e={"🔒"} size={17} color={/*fond local*/"#756b54"}/>:<span style={{fontSize:18,color:"rgba(220,38,38,.6)"}}>{"➔"}</span>}
            </div>
          </div>
        </div>

        {/* V2 — Boss Reset token CTA (only when locked specifically by 24h cooldown) */}
        {bossLocked&&uBoss.reasons[0]&&uBoss.reasons[0].indexOf("24h cooldown")===0&&
          <BossResetCTA u={p.u} setUser={p.setUser}/>}

        {/* ── Hero Endless Arena (if visible) ── */}
        {endlessState!=="hidden"&&(function(){
          var isLocked=endlessState==="locked";
          var isCooldown=endlessState==="cooldown";
          var isReady=endlessState==="ready";
          var bossScore=bossCompleted?p.u.mockResults.boss.toeicEstimate:0;
          var progressPct=isLocked?Math.max(0,Math.min(100,((bossScore-200)/(650-200))*100)):0;

          return(<div onClick={function(){if(isReady)p.nav("endless");}}
            style={{padding:0,overflow:"hidden",cursor:isReady?"pointer":"default",opacity:isCooldown?.75:isLocked?.55:1,borderRadius:16,border:"1.5px solid rgba(27,112,207,0.4)",background:"linear-gradient(135deg,#081828,#0d2a45)",animation:"fadeIn .4s ease-out",animationDelay:".25s",animationFillMode:"both"}}>
            <div style={{background:"linear-gradient(135deg,#0a1e35,#102844,#081828)",padding:"18px 16px",position:"relative",overflow:"hidden"}}>
              <div style={{position:"absolute",inset:0,background:"radial-gradient(ellipse at 75% 20%,rgba(27,112,207,0.35),transparent 55%)",animation:"endless-halo-breathe 5s ease-in-out infinite",pointerEvents:"none"}}/>
              <div style={{position:"absolute",inset:0,background:"radial-gradient(ellipse at 15% 85%,rgba(74,159,224,0.18),transparent 45%)",animation:"endless-halo-breathe 6s ease-in-out infinite 1.5s",pointerEvents:"none"}}/>
              <div className="fx-star" style={{top:"14%",left:"8%",width:2,height:2,background:"#a8d4ff",animationDelay:"0s"}}/><div className="fx-star" style={{top:"22%",left:"18%",width:1.5,height:1.5,background:"#d4943a",animationDelay:"0.5s"}}/><div className="fx-star" style={{top:"10%",left:"32%",width:2.5,height:2.5,background:"#ffffff",animationDelay:"1.2s"}}/><div className="fx-star" style={{top:"28%",left:"45%",width:1.5,height:1.5,background:"#a8d4ff",animationDelay:"1.8s"}}/><div className="fx-star" style={{top:"18%",left:"58%",width:2,height:2,background:"#a8d4ff",animationDelay:"0.3s"}}/><div className="fx-star" style={{top:"8%",left:"72%",width:2,height:2,background:"#d4943a",animationDelay:"2.2s"}}/><div className="fx-star" style={{top:"24%",left:"85%",width:1.5,height:1.5,background:"#ffffff",animationDelay:"0.9s"}}/><div className="fx-star" style={{top:"35%",left:"28%",width:1.5,height:1.5,background:"#a8d4ff",animationDelay:"2.5s"}}/><div className="fx-star" style={{top:"40%",left:"62%",width:2,height:2,background:"#d4943a",animationDelay:"1.5s"}}/><div className="fx-star" style={{top:"48%",left:"15%",width:1.5,height:1.5,background:"#a8d4ff",animationDelay:"0.7s"}}/><div className="fx-star" style={{top:"55%",left:"78%",width:2,height:2,background:"#ffffff",animationDelay:"2.8s"}}/><div className="fx-star" style={{top:"65%",left:"38%",width:1.5,height:1.5,background:"#a8d4ff",animationDelay:"1.1s"}}/><div className="fx-star" style={{top:"72%",left:"88%",width:2,height:2,background:"#d4943a",animationDelay:"0.4s"}}/><div className="fx-star" style={{top:"80%",left:"22%",width:1.5,height:1.5,background:"#a8d4ff",animationDelay:"2.0s"}}/><div className="fx-star" style={{top:"85%",left:"55%",width:2,height:2,background:"#ffffff",animationDelay:"1.3s"}}/>
              <div style={{position:"absolute",top:-6,right:14,opacity:.08}}><GIcon name="infinity" size={52} color="currentColor"/></div>
              <div style={{position:"relative",display:"flex",alignItems:"center",gap:14}}>
                <div style={{width:50,height:50,borderRadius:14,background:"linear-gradient(135deg,#1B70CF,#0a3a6e)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:24,flexShrink:0,boxShadow:"0 0 20px rgba(27,112,207,0.35)"}}><GIcon name="infinity" size={28} color="#fff"/></div>
                <div style={{flex:1}}>
                  <div style={{marginBottom:2}}>
                    <span className="out" style={{fontWeight:900,fontSize:16,letterSpacing:.5,background:"linear-gradient(90deg,#7fb8e8,#4a9fe0,#d4943a)",WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent"}}>ENDLESS ARENA</span>
                  </div>
                  <div style={{fontFamily:"'Cinzel','Outfit',serif",fontStyle:"italic",fontSize:11,color:/*fond local*/"#8a7e6a"}}>the arena never sleeps</div>
                </div>
                {isReady?<span style={{fontSize:18,color:/*fond local*/"#7fb8e8"}}>{"→"}</span>:<ResultIcon e={"🔒"} size={17} color={/*fond local*/"#756b54"}/>}
              </div>

              {/* Locked: progress bar toward 650 gate */}
              {isLocked&&<div style={{marginTop:14}}>
                <div style={{display:"flex",justifyContent:"space-between",fontSize:11,color:/*fond local*/"#8a7e6a",marginBottom:4}}>
                  <span>Your score</span><span>Gate</span>
                </div>
                <div style={{display:"flex",justifyContent:"space-between",marginBottom:6}}>
                  <span style={{fontFamily:"'Cinzel','Outfit',serif",fontSize:14,color:/*fond local*/"#7fb8e8"}}>{bossScore}</span>
                  <span style={{fontFamily:"'Cinzel','Outfit',serif",fontSize:14,color:/*fond local*/"#d4943a"}}>650</span>
                </div>
                <div style={{height:6,background:"rgba(27,112,207,.18)",borderRadius:99}}>
                  <div style={{width:progressPct+"%",height:"100%",borderRadius:99,background:"linear-gradient(90deg,#0a3a6e,#1B70CF)"}}/>
                </div>
                <div style={{fontFamily:"'Cinzel','Outfit',serif",fontStyle:"italic",fontSize:11,color:/*fond local*/"#4a9fe0",textAlign:"center",marginTop:6}}>So close {"·"} {650-bossScore} points from glory</div>
              </div>}

              {/* Ready: stats line */}
              {isReady&&endlessData&&endlessData.attempts>0&&<div style={{borderTop:"1px solid rgba(27,112,207,.3)",marginTop:10,paddingTop:10}}>
                <div style={{fontSize:11,color:/*fond local*/"#8a7e6a"}}>Runs: <span style={{color:/*fond local*/"#7fb8e8"}}>{endlessData.attempts}</span>  {"·"}  Best: <span style={{color:/*fond local*/"#7fb8e8"}}>{endlessData.best}</span>  {"·"}  <span style={{color:/*fond local*/"#7fb8e8"}}>Ready to enter</span></div>
              </div>}
              {isReady&&(!endlessData||endlessData.attempts===0)&&<div style={{marginTop:10,textAlign:"center"}}>
                <div style={{fontFamily:"'Cinzel','Outfit',serif",fontStyle:"italic",fontSize:12,color:/*fond local*/"#7fb8e8"}}>First run awaits {"·"} enter the sanctuary</div>
              </div>}

              {/* Cooldown: stats with timer */}
              {isCooldown&&endlessData&&<div style={{borderTop:"1px solid rgba(27,112,207,.3)",marginTop:10,paddingTop:10}}>
                <div style={{fontSize:11,color:/*fond local*/"#8a7e6a"}}>Runs: <span style={{color:/*fond local*/"#7fb8e8"}}>{endlessData.attempts}</span>  {"·"}  Best: <span style={{color:/*fond local*/"#7fb8e8"}}>{endlessData.best}</span>  {"·"}  Ready in <span style={{color:/*fond local*/"#7fb8e8"}}>{endlessCooldownH}h {endlessCooldownM}m</span></div>
              </div>}
            </div>
          </div>);
        })()}

        {/* V2 — Endless Resurrect CTA (only when in cooldown) */}
        {endlessState==="cooldown"&&<EndlessResetCTA u={p.u} setUser={p.setUser}/>}
      </div>);
    }

    // Regular sub-view (exercises, grammar, tips)
    var sec=trainView==="mocks"?mocksSection:gridSections[trainView];
    if(sec){
      var animIdx=0;
      return(<div className="enter" style={{padding:"20px 16px 100px"}}>
        <button onClick={function(){setTrainView(null);}} style={{background:"none",border:"none",color:"var(--t2)",cursor:"pointer",fontSize:14,marginBottom:16,padding:0}}>{"←"} Training Grounds</button>
        <h2 className="out" style={{fontWeight:800,fontSize:20,marginBottom:4}}>{sec.title}</h2>
        <p style={{color:"var(--t3)",fontSize:12,marginBottom:16}}>{sec.sub}</p>
        {/* Hubs vivants (variante C « Coffre ») : étagère de coffres, puis tuiles avec dernier score,
            barre vers le coffre de maîtrise et tarif de la prochaine partie (lib/hubStatus.js). */}
        <HubShelf id={sec.key} summary={hubSummary(p.u,sec.items.filter(function(m){return !m.visitorLocked&&!m.lock;}),{events:p.events})}/>
        <div className="rg-games" style={{display:"flex",flexDirection:"column",gap:8}}>
          {sec.items.map(function(m){
            var ai=animIdx++;
            var vl=m.visitorLocked;
            return(<HubTile key={m.id} item={m} unit={m.unit} locked={vl} disabled={m.lock}
              status={vl||m.lock?null:hubItemStatus(p.u,m,{events:p.events})}
              onClick={function(){if(vl){p.onPremium(m.n);return;}if(!m.lock)p.nav(m.id);}}
              style={{animation:"fadeIn .3s ease-out",animationDelay:(ai*.04)+"s",animationFillMode:"both"}}/>);
          })}
        </div>
      </div>);
    }
  }

  // ═══ MAIN VIEW — Hero Mock Exams + 3 tiles grid ═══
  return(<div className="enter" style={{padding:"20px 16px 100px"}}>
    <h1 className="out" style={{fontWeight:800,fontSize:24,marginBottom:4}}>Training Grounds</h1>
    <p style={{color:"var(--t2)",fontSize:13,marginBottom:16}}>Choose your battle</p>

    {/* Hero Mock Exams */}
    <div className="crd" onClick={function(){setTrainView("mocks");}}
      style={{padding:16,marginBottom:14,cursor:"pointer",borderColor:"rgba(255,255,255,.06)"}}>
      <div style={{display:"flex",alignItems:"center",gap:14}}>
        <div style={{width:50,height:50,borderRadius:14,background:"linear-gradient(135deg,rgba(var(--cx),.22),transparent)",border:"1.5px solid var(--cyan)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:26,flexShrink:0}}><GIcon name="scroll-unfurled" size={28} color="var(--cyan)"/></div>
        <div style={{flex:1}}>
          <div className="out" style={{fontFamily:"'Cinzel','Outfit',serif",fontWeight:800,fontSize:16,letterSpacing:1.5,color:tone("#f0c850")}}>MOCK EXAMS</div>
          <div style={{fontSize:12,color:tone("#8a7e6a")}}>Real conditions {"·"} full tests</div>
        </div>
        <span style={{fontSize:16,color:tone("#d4943a")}}>{"→"}</span>
      </div>
      {/* Mock pills */}
      <div style={{display:"flex",gap:6,marginTop:14}}>
        {["Mock 1","Mock 2","Mock 3"].map(function(label,i){
          var done=mocksDone[i];
          return(<span key={i} style={{fontSize:11,padding:"3px 9px",borderRadius:99,fontWeight:600,
            background:done?"rgba(74,190,96,0.15)":"rgba(255,255,255,0.05)",
            color:done?tone("#4abe60"):"#5a5040"}}>{done?"\u2713 ":""}{label}</span>);
        })}
      </div>
      {/* Separator */}
      <div style={{height:1,background:"rgba(180,140,80,0.15)",margin:"10px -4px"}}/>
      {/* Event rows: Final Arena + Endless Arena */}
      <div style={{display:"flex",alignItems:"center",gap:11,padding:"7px 4px"}}>
        <span style={{width:22,textAlign:"center",display:"inline-flex",justifyContent:"center"}}><GIcon name="dragon-spiral" size={19} color={bossCompleted?tone("#4abe60"):bossLocked?tone("#8a7e6a"):tone("#e8c88a")}/></span>
        <span style={{fontFamily:"'Cinzel','Outfit',serif",fontSize:13,fontWeight:700,color:bossCompleted?tone("#4abe60"):bossLocked?tone("#8a7e6a"):tone("#e8c88a"),flex:1}}>Final Arena</span>
        <span style={{fontSize:11,color:bossCompleted?tone("#4abe60"):bossLocked?tone("#8a7e6a"):tone("#f0c850")}}>{bossCompleted?"conquered \xb7 "+(p.u.mockResults.boss.toeicEstimate||""):bossLocked?"awaiting \xb7 finish mocks":"unlocked \xb7 enter \u2192"}</span>
      </div>
      {endlessState!=="hidden"&&<div style={{display:"flex",alignItems:"center",gap:11,padding:"8px 4px 6px",background:"rgba(27,112,207,0.08)",borderRadius:8,margin:"2px -4px 0"}}>
        <span style={{width:22,textAlign:"center",display:"inline-flex",justifyContent:"center"}}><GIcon name="infinity" size={19} color={tone("#7fb8e8")}/></span>
        <span style={{fontFamily:"'Cinzel','Outfit',serif",fontSize:13,fontWeight:700,color:tone("#7fb8e8"),flex:1}}>Endless Arena</span>
        <span style={{fontSize:11,color:endlessState==="ready"?tone("#4a9fe0"):endlessState==="cooldown"?tone("#8a7e6a"):tone("#8a7e6a")}}>{endlessState==="locked"?"locked \xb7 requires 650+":endlessState==="ready"?"ready to enter":endlessState==="cooldown"?"ready in "+endlessCooldownH+"h":""}</span>
      </div>}
    </div>

    {/* Row 1 (2-col): Exercises + Grammar & Vocab */}
    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
      {[gridSections[0],gridSections[1]].map(function(sec,si){
        return(<div key={sec.key} className="crd" onClick={function(){setTrainView(si);}}
          style={{padding:"18px 14px",cursor:"pointer",borderColor:"rgba(255,255,255,.06)",animation:"fadeIn .4s ease-out",animationDelay:(si*.06)+"s",animationFillMode:"both"}}>
          <div>
            <div style={{fontSize:28,marginBottom:8}}>{GAME_ICON_PATHS[sec.icon]?<GIcon name={sec.icon} size={32} color="var(--cyan)" block={true}/>:sec.icon}</div>
            <div className="out" style={{fontWeight:700,fontSize:14,marginBottom:2}}>{sec.title}</div>
            <div style={{fontSize:11,color:"var(--t3)",marginBottom:8}}>{sec.sub}</div>
            <div style={{display:"flex",alignItems:"center",justifyContent:"space-between"}}>
              <span style={{fontSize:10,color:"var(--cyan)",fontWeight:600}}>{sec.count}</span>
              <span style={{fontSize:14,color:"var(--cyan)"}}>{"→"}</span>
            </div>
          </div>
        </div>);
      })}
    </div>

    {/* Row 2 full-width: Flashcards banner (between Grammar&Vocab and Tips&Strategy) */}
    <div className="crd" onClick={function(){if(p.tabGo)p.tabGo("cards");}}
      style={{marginTop:10,padding:"18px 14px",cursor:"pointer",borderColor:"rgba(255,255,255,.06)",animation:"fadeIn .4s ease-out",animationDelay:".12s",animationFillMode:"both"}}>
      <div style={{display:"flex",alignItems:"center",gap:14}}>
        <div style={{flexShrink:0}}><GIcon name="card-joker" size={34} color="var(--cyan)"/></div>
        <div style={{flex:1}}>
          <div className="out" style={{fontWeight:700,fontSize:14,marginBottom:2}}>Flashcards</div>
          <div style={{fontSize:11,color:"var(--t3)"}}>SRS spaced repetition {"\u00B7"} 21 domains</div>
        </div>
        <div style={{display:"flex",alignItems:"center",gap:6}}>
          <span style={{fontSize:10,color:"var(--cyan)",fontWeight:600}}>Browse</span>
          <span style={{fontSize:14,color:"var(--cyan)"}}>{"\u2192"}</span>
        </div>
      </div>
    </div>

    {/* Row 3 full-width: Tips & Strategy */}
    <div className="crd" onClick={function(){setTrainView(2);}}
      style={{marginTop:10,padding:"18px 14px",cursor:"pointer",borderColor:"rgba(255,255,255,.06)",animation:"fadeIn .4s ease-out",animationDelay:".18s",animationFillMode:"both"}}>
      <div style={{display:"flex",alignItems:"center",gap:14}}>
        <div style={{flexShrink:0}}><GIcon name={gridSections[2].icon} size={34} color="var(--cyan)"/></div>
        <div style={{flex:1}}>
          <div className="out" style={{fontWeight:700,fontSize:14,marginBottom:2}}>{gridSections[2].title}</div>
          <div style={{fontSize:11,color:"var(--t3)"}}>{gridSections[2].sub}</div>
        </div>
        <div style={{display:"flex",alignItems:"center",gap:6}}>
          <span style={{fontSize:10,color:"var(--cyan)",fontWeight:600}}>{gridSections[2].count}</span>
          <span style={{fontSize:14,color:"var(--cyan)"}}>{"\u2192"}</span>
        </div>
      </div>
    </div>
  </div>);
}
