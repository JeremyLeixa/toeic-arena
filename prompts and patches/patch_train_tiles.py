#!/usr/bin/env python3
"""
TOEIC Arena — Train Screen Refactor
Replaces flat list with 2x2 tile grid + Boss Test banner

Usage: python patch_train_tiles.py
"""

import os

APP = os.path.join("src", "App.jsx")

with open(APP, "r", encoding="utf-8") as f:
    app = f.read()

# ═══════════════════════════════════════
# Find and replace the entire Train function
# ═══════════════════════════════════════
OLD_START = "// ─── TRAIN PAGE ───\n  function Train(p){"
OLD_END = "  </div>);\n}\n\n// ─── CARDS PAGE ───"
NEW_END_MARKER = "// ─── CARDS PAGE ───"

si = app.find(OLD_START)
ei = app.find(NEW_END_MARKER, si)

if si == -1 or ei == -1:
    print("❌ Could not find Train function boundaries")
    print(f"   START found: {si != -1}")
    print(f"   END found: {ei != -1}")
    exit(1)

NEW_TRAIN = r'''// ─── TRAIN PAGE ───
  function Train(p){
  var[trainView,setTrainView]=useState(null);
  var dd=p.u.daily&&p.u.daily.date===today()&&p.u.daily.done;

  // ── Section data (unchanged) ──
  var sections=[
    {key:"exercises",title:"Exercises",sub:"TOEIC Parts training",icon:"\u2694\ufe0f",count:"Parts 1-7",items:[
      {id:"daily",n:"Daily Challenge",d:dd?"Completed today \u2713":"5 daily questions, timed",i:"\u26a1",bg:dd?"var(--bg3)":"linear-gradient(135deg,#d4943a,#8b5e83)",lock:dd},
      {id:"lis",n:"Listening Practice",d:"Parts 1-4 with audio",i:"\ud83d\udc42",bg:"linear-gradient(135deg,#22c55e,#f59e0b)"},
      {id:"read",n:"Reading Practice",d:"Parts 5-7",i:"\ud83d\udcd6",bg:"linear-gradient(135deg,#5a7a9a,#7a5a80)"},
    ]},
    {key:"grammar",title:"Grammar & Vocab",sub:"Build your foundations",icon:"\ud83e\udde9",count:"7 modules",items:[
      {id:"csess",n:"Flashcard Review",d:"SRS spaced repetition",i:"\ud83c\udccf",bg:"linear-gradient(135deg,#ff8c42,#ff6b35)"},
      {id:"wordfam",n:"Word Families",d:"Classify: Noun, Verb, Adj, Adv",i:"\ud83e\udde9",bg:"linear-gradient(135deg,#f59e0b,#ef4444)"},
      {id:"connsort",n:"Connectors Sorting",d:"Clause, Noun, or New sentence?",i:"\ud83d\udd00",bg:"linear-gradient(135deg,#8b5e83,#c4587a)"},
      {id:"prepdrill",n:"Preposition Collocations",d:"Study + Drill mode",i:"\ud83c\udfaf",bg:"linear-gradient(135deg,#06b6d4,#22c55e)"},
      {id:"gerinf",n:"Gerund vs Infinitive",d:"4 patterns \u00b7 Study + Context Quiz",i:"\u2696\ufe0f",bg:"linear-gradient(135deg,#e11d48,#f59e0b)"},
      {id:"falsefr",n:"False Friends",d:"FR/EN traps: actually \u2260 actuellement",i:"\ud83c\udfad",bg:"linear-gradient(135deg,#ec4899,#f59e0b)"},
      {id:"pvdojo",n:"Phrasal Verb Dojo",d:"55 verbs \u00b7 Study, Match & Speed",i:"\u2694\ufe0f",bg:"linear-gradient(135deg,#f97316,#dc2626)"},
    ]},
    {key:"mocks",title:"Mock Exams",sub:"Real conditions",icon:"\ud83d\udcdc",count:"3 tests",items:(function(){
      var items=[];
      var u1=canUnlockMock(p.u,1);
      items.push({id:"mock1",n:"Mock Test 1",d:u1.ok?"Reading Half-Test \u00b7 49 Q \u00b7 37 min":u1.reasons[0],i:"\ud83d\udcdc",bg:u1.ok?"linear-gradient(135deg,#ffd700,#ff8c42)":"var(--bg3)",lock:!u1.ok,mockId:1});
      var u2=canUnlockMock(p.u,2);
      items.push({id:"mock2",n:"Mock Test 2",d:u2.ok?"Reading Half-Test \u00b7 49 Q \u00b7 37 min":u2.reasons[0],i:"\ud83d\udcdc",bg:u2.ok?"linear-gradient(135deg,#8b5e83,#c4587a)":"var(--bg3)",lock:!u2.ok,mockId:2});
      var u3=canUnlockMock(p.u,3);
      items.push({id:"mock3",n:"Mock Test 3",d:u3.ok?"Reading Half-Test \u00b7 48 Q \u00b7 37 min":u3.reasons[0],i:"\ud83d\udcdc",bg:u3.ok?"linear-gradient(135deg,#22c55e,#06b6d4)":"var(--bg3)",lock:!u3.ok,mockId:3});
      if(p.u.mockResults&&p.u.mockResults.mock1){items[0].d="Completed \u2014 TOEIC "+p.u.mockResults.mock1.toeicEstimate+"/495";items[0].lock=true;items[0].bg="var(--bg3)";}
      if(p.u.mockResults&&p.u.mockResults.mock2){items[1].d="Completed \u2014 TOEIC "+p.u.mockResults.mock2.toeicEstimate+"/495";items[1].lock=true;items[1].bg="var(--bg3)";}
      if(p.u.mockResults&&p.u.mockResults.mock3){items[2].d="Completed \u2014 TOEIC "+p.u.mockResults.mock3.toeicEstimate+"/495";items[2].lock=true;items[2].bg="var(--bg3)";}
      return items;
    })()},
    {key:"tips",title:"Tips & Strategy",sub:"Master the exam",icon:"\ud83d\uddfa\ufe0f",count:"4 tools",items:[
      {id:"strats",n:"Strategy Cards",d:"54 expert tips, all Parts",i:"\ud83d\uddfa\ufe0f",bg:"linear-gradient(135deg,#6a8a50,#4a7a5a)"},
      {id:"stratquiz",n:"Strategy Quiz",d:"Test your exam IQ",i:"\ud83e\udde0",bg:"linear-gradient(135deg,#8b5e83,#5a5c8a)"},
      {id:"traps",n:"TOEIC Traps Quiz",d:"Spot the 20 classic traps",i:"\ud83e\udea4",bg:"linear-gradient(135deg,#ef4444,#f59e0b)"},
      {id:"gramref",n:"Grammar Reference",d:"12 essential grammar sheets",i:"\ud83d\udcd6",bg:"linear-gradient(135deg,#5a7a9a,#7a5a80)"},
    ]},
  ];

  // ── Boss Test status ──
  var uBoss=canUnlockBoss(p.u);
  var bossCompleted=p.u.mockResults&&p.u.mockResults.boss;
  var bossLocked=!uBoss.ok;
  var mocksDone=[p.u.mockResults&&p.u.mockResults.mock1,p.u.mockResults&&p.u.mockResults.mock2,p.u.mockResults&&p.u.mockResults.mock3];

  // ═══ SUB-VIEW — show items of selected section ═══
  if(trainView!==null){
    var sec=sections[trainView];
    var animIdx=0;
    return(<div className="enter" style={{padding:"20px 16px 100px"}}>
      <button onClick={function(){setTrainView(null);}} style={{background:"none",border:"none",color:"var(--t2)",cursor:"pointer",fontSize:14,marginBottom:16,padding:0}}>{"\u2190"} Training Grounds</button>
      <h2 className="out" style={{fontWeight:800,fontSize:20,marginBottom:4}}>{sec.title}</h2>
      <p style={{color:"var(--t3)",fontSize:12,marginBottom:16}}>{sec.sub}</p>
      <div style={{display:"flex",flexDirection:"column",gap:8}}>
        {sec.items.map(function(m){
          var ai=animIdx++;
          return(
            <div key={m.id} className="crd" onClick={function(){if(!m.lock)p.nav(m.id);}}
              style={{display:"flex",alignItems:"center",gap:14,cursor:m.lock?"default":"pointer",opacity:m.lock?.4:1,padding:"14px 16px",animation:"fadeIn .3s ease-out",animationDelay:(ai*.04)+"s",animationFillMode:"both"}}>
              <div style={{width:42,height:42,borderRadius:12,background:m.bg,display:"flex",alignItems:"center",justifyContent:"center",fontSize:20,flexShrink:0}}>{m.i}</div>
              <div style={{flex:1,minWidth:0}}>
                <div className="out" style={{fontWeight:700,fontSize:14,marginBottom:1}}>{m.n}</div>
                <div style={{fontSize:11,color:"var(--t3)"}}>{m.d}</div>
              </div>
              {m.lock?<span style={{fontSize:16}}>{"\ud83d\udd12"}</span>:<span style={{fontSize:16,color:"var(--cyan)"}}>{"\u2192"}</span>}
            </div>);
        })}
      </div>
    </div>);
  }

  // ═══ MAIN GRID VIEW — 2x2 tiles + Boss banner ═══
  return(<div className="enter" style={{padding:"20px 16px 100px"}}>
    <h1 className="out" style={{fontWeight:800,fontSize:24,marginBottom:4}}>Training Grounds</h1>
    <p style={{color:"var(--t2)",fontSize:13,marginBottom:16}}>Choose your battle</p>

    {/* 2x2 Tile Grid */}
    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:16}}>
      {sections.map(function(sec,si){
        return(<div key={sec.key} className="crd" onClick={function(){setTrainView(si);}}
          style={{padding:"18px 14px",cursor:"pointer",borderColor:"rgba(255,255,255,.06)",animation:"fadeIn .4s ease-out",animationDelay:(si*.06)+"s",animationFillMode:"both"}}>
          <div style={{fontSize:28,marginBottom:8}}>{sec.icon}</div>
          <div className="out" style={{fontWeight:700,fontSize:14,marginBottom:2}}>{sec.title}</div>
          <div style={{fontSize:11,color:"var(--t3)",marginBottom:8}}>{sec.sub}</div>
          <div style={{display:"flex",alignItems:"center",justifyContent:"space-between"}}>
            <span style={{fontSize:10,color:"var(--cyan)",fontWeight:600}}>{sec.count}</span>
            <span style={{fontSize:14,color:"var(--cyan)"}}>{"\u2192"}</span>
          </div>
        </div>);
      })}
    </div>

    {/* Boss Test Banner */}
    <div className="crd" onClick={function(){if(!bossLocked)p.nav("boss");}}
      style={{padding:0,overflow:"hidden",cursor:bossLocked?"default":"pointer",opacity:bossLocked?.55:1,borderColor:bossLocked?"var(--bdr)":"rgba(220,38,38,.35)",animation:"fadeIn .5s ease-out",animationDelay:".3s",animationFillMode:"both"}}>
      <div style={{background:bossLocked?"var(--bg2)":"linear-gradient(135deg,#2a0a0a,#3d1a00,#1a0800)",padding:"18px 16px",position:"relative",overflow:"hidden"}}>
        {!bossLocked&&<div style={{position:"absolute",inset:0,background:"radial-gradient(ellipse at 80% 30%,rgba(245,158,11,.08),transparent 60%),radial-gradient(ellipse at 20% 70%,rgba(220,38,38,.06),transparent 50%)"}}/>}
        {!bossLocked&&<div style={{position:"absolute",top:-8,right:12,fontSize:48,opacity:.1,transform:"scaleX(-1)"}}>{"\ud83d\udc09"}</div>}
        <div style={{position:"relative",display:"flex",alignItems:"center",gap:14}}>
          <div style={{width:50,height:50,borderRadius:14,background:bossLocked?"var(--bg3)":"linear-gradient(135deg,#dc2626,#f59e0b)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:24,flexShrink:0,boxShadow:bossLocked?"none":"0 0 20px rgba(220,38,38,.3)"}}>{"\ud83d\udc09"}</div>
          <div style={{flex:1}}>
            <div style={{marginBottom:2}}>
              {bossLocked?<span className="out" style={{fontWeight:900,fontSize:16,color:"var(--t3)"}}>THE FINAL ARENA</span>
              :<span className="out" style={{fontWeight:900,fontSize:16,background:"linear-gradient(90deg,#ff4444,#ff8c42,#ffd700)",WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent"}}>THE FINAL ARENA</span>}
            </div>
            {bossCompleted&&!bossLocked?<div style={{fontSize:12,color:"var(--gold)"}}>Best: TOEIC {p.u.mockResults.boss.toeicEstimate}/990 {"\u2014"} Retake?</div>
            :bossLocked?<div style={{fontSize:11,color:"var(--t3)"}}>{uBoss.reasons[0]}</div>
            :<div style={{fontSize:12,color:"#cc8844"}}>Full TOEIC {"\u00b7"} 202 Q {"\u00b7"} 120 min</div>}
            {/* Mock completion pills */}
            <div style={{display:"flex",gap:4,marginTop:6}}>
              {["Mock 1","Mock 2","Mock 3"].map(function(label,i){
                var done=mocksDone[i];
                return(<span key={i} style={{fontSize:9,padding:"2px 7px",borderRadius:99,fontWeight:600,
                  background:done?"rgba(34,197,94,.15)":"rgba(255,255,255,.06)",
                  color:done?"#22c55e":"var(--t3)"}}>{done?"\u2713 ":""}{label}</span>);
              })}
            </div>
          </div>
          {bossLocked?<span style={{fontSize:18}}>{"\ud83d\udd12"}</span>:<span style={{fontSize:18,color:"rgba(220,38,38,.6)"}}>{"\u2794"}</span>}
        </div>
      </div>
    </div>
  </div>);
}

'''

app = app[:si] + NEW_TRAIN + NEW_END_MARKER + app[ei + len(NEW_END_MARKER):]

with open(APP, "w", encoding="utf-8") as f:
    f.write(app)

print("=" * 40)
print("\u2705 Train screen refactored!")
print("   \u2022 2\u00d72 tile grid (Exercises, Grammar & Vocab, Mock Exams, Tips & Strategy)")
print("   \u2022 Boss Test banner with dramatic styling")
print("   \u2022 Sub-views preserve all existing items and colors")
print("   \u2022 Mock 3 completed badge added (was missing)")
print("=" * 40)
