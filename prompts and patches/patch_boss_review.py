#!/usr/bin/env python3
"""
TOEIC Arena — Boss Test Review Mode
Adds review answers functionality to BossTest component

Usage: python patch_boss_review.py
"""

import os

APP = os.path.join("src", "App.jsx")

with open(APP, "r", encoding="utf-8") as f:
    app = f.read()

ok = 0

# ═══════════════════════════════════════
# PATCH 1: Add Review button in results screen
# ═══════════════════════════════════════
print("1/2 — Adding Review button...")

OLD_SAVE = '''      <button className="btn2" onClick={function(){result.mockId="boss";p.done(result,xp);}} style={{width:"100%",fontSize:16,padding:"14px 24px"}}>Save & Exit</button>'''

NEW_SAVE = '''      <button className="btn1" onClick={function(){setRevMode(true);setRevSec("p1");setRevIdx(0);}}>\\ud83d\\udcd6 Review Answers</button>
      <button className="btn2" onClick={function(){result.mockId="boss";p.done(result,xp);}} style={{marginTop:10,width:"100%",fontSize:16,padding:"14px 24px"}}>Save & Exit</button>'''

if OLD_SAVE in app:
    app = app.replace(OLD_SAVE, NEW_SAVE, 1)
    ok += 1
    print("  ✅ Review button added")
else:
    print("  ❌ Could not find Save & Exit button")

# ═══════════════════════════════════════
# PATCH 2: Add full review mode rendering
# ═══════════════════════════════════════
print("2/2 — Adding review mode rendering...")

# We insert the review mode block just before `return null;` at the end of BossTest
# Find the specific `return null;` that closes BossTest (before MockTest)
OLD_END = '''  return null;
}

function MockTest(p){'''

REVIEW_MODE = r'''
  // ═══ REVIEW MODE ═══
  if(revMode&&result){
    var rItem=null;var rAnswer=-1;var rCorrect=-1;var rExpl="";var rLabel="";

    // ── Build flat index totals for navigation ──
    var secOrder=["p1","p2","p3","p4","p5","p6","p7"];
    var secTotals={p1:LP1.length,p2:LP2.length,p3:p3QC,p4:p4QC,p5:RP5.length,p6:p6BC,p7:p7QC};

    // Helper to render option list with correct/wrong highlighting
    function revOpts(options,correct,picked){
      return(<div style={{display:"flex",flexDirection:"column",gap:8}}>
        {options.map(function(opt,i){
          var isC=i===correct;var isP=i===picked;
          var bg=isC?"rgba(0,230,118,.12)":isP?"rgba(255,71,87,.12)":"var(--bg2)";
          var bd=isC?"var(--green)":isP?"var(--red)":"var(--bdr)";
          return(<div key={i} style={{display:"flex",alignItems:"center",gap:10,padding:"10px 14px",background:bg,border:"1px solid "+bd,borderRadius:10,fontSize:13}}>
            <span style={{fontWeight:700,color:isC?"var(--green)":isP?"var(--red)":"var(--t3)",fontSize:12}}>{isC?"\u2713":isP?"\u2717":String.fromCharCode(65+i)}</span>
            <span style={{color:"var(--t1)"}}>{typeof opt==="string"&&opt.length>80?opt.substring(0,77)+"\u2026":opt}</span></div>);
        })}
      </div>);
    }

    // ── P1: Photos ──
    if(revSec==="p1"){
      var it=LP1[revIdx];rAnswer=ans.p1[revIdx];rCorrect=it.c;rExpl=it.x;
      rLabel="Part 1 \u2014 Photo "+(revIdx+1);
      rItem=(<div>
        <div style={{marginBottom:12,borderRadius:14,overflow:"hidden",border:"1px solid var(--bdr)"}}>
          <img src={it.img} alt="TOEIC photo" style={{width:"100%",display:"block",maxHeight:200,objectFit:"cover"}}/>
        </div>
        {revOpts(it.opts,it.c,rAnswer)}
      </div>);
    }

    // ── P2: Q&R ──
    else if(revSec==="p2"){
      var it2=LP2[revIdx];rAnswer=ans.p2[revIdx];rCorrect=it2.c;rExpl=it2.x;
      rLabel="Part 2 \u2014 Q"+(revIdx+1);
      rItem=(<div>
        <div className="crd" style={{padding:12,marginBottom:12,background:"rgba(212,148,58,.06)",borderColor:"rgba(212,148,58,.15)"}}>
          <p className="out" style={{fontWeight:700,fontSize:13,color:"var(--cyan)",marginBottom:4}}>Question:</p>
          <p style={{fontSize:13,color:"var(--t1)",lineHeight:1.5,fontStyle:"italic"}}>{it2.q}</p>
        </div>
        {revOpts(it2.opts,it2.c,rAnswer)}
      </div>);
    }

    // ── P3: Conversations ──
    else if(revSec==="p3"){
      var flatP3=revIdx;var ci3=0;var qi3=0;
      for(var pp3=0;pp3<LP3.length;pp3++){
        if(flatP3<LP3[pp3].qs.length){ci3=pp3;qi3=flatP3;break;}
        flatP3-=LP3[pp3].qs.length;
      }
      var conv=LP3[ci3];var q3r=conv.qs[qi3];
      rAnswer=ans.p3[ci3][qi3];rCorrect=q3r.c;rExpl="";
      rLabel="Part 3 \u2014 Convo "+(ci3+1)+", Q"+(qi3+1);
      rItem=(<div>
        <div className="crd" style={{padding:12,marginBottom:12,maxHeight:140,overflowY:"auto"}}>
          {conv.lines.map(function(ln,i){return(<div key={i} style={{fontSize:12,color:"var(--t1)",lineHeight:1.6,marginBottom:4}}>
            <span style={{fontWeight:700,color:ln.s==="M"?"var(--cyan)":"var(--purple)",marginRight:6}}>{ln.s}:</span>{ln.t}
          </div>);})}
        </div>
        <h3 className="out" style={{fontWeight:700,fontSize:14,lineHeight:1.5,marginBottom:12}}>{q3r.q}</h3>
        {revOpts(q3r.opts,q3r.c,rAnswer)}
      </div>);
    }

    // ── P4: Talks ──
    else if(revSec==="p4"){
      var flatP4=revIdx;var ti4=0;var qi4=0;
      for(var pp4=0;pp4<LP4.length;pp4++){
        if(flatP4<LP4[pp4].qs.length){ti4=pp4;qi4=flatP4;break;}
        flatP4-=LP4[pp4].qs.length;
      }
      var talk=LP4[ti4];var q4r=talk.qs[qi4];
      rAnswer=ans.p4[ti4][qi4];rCorrect=q4r.c;rExpl="";
      rLabel="Part 4 \u2014 Talk "+(ti4+1)+" ("+talk.type+"), Q"+(qi4+1);
      rItem=(<div>
        <div className="crd" style={{padding:12,marginBottom:12,maxHeight:140,overflowY:"auto",fontSize:12,lineHeight:1.6,color:"var(--t1)",fontStyle:"italic"}}>
          {talk.text}
        </div>
        <h3 className="out" style={{fontWeight:700,fontSize:14,lineHeight:1.5,marginBottom:12}}>{q4r.q}</h3>
        {revOpts(q4r.opts,q4r.c,rAnswer)}
      </div>);
    }

    // ── P5: Incomplete Sentences ──
    else if(revSec==="p5"){
      var q5r=RP5[revIdx];rAnswer=ans.p5[revIdx];rCorrect=q5r.c;rExpl=q5r.x;
      rLabel="Part 5 \u2014 Q"+(revIdx+1);
      rItem=(<div>
        <h3 className="out" style={{fontWeight:700,fontSize:15,lineHeight:1.5,marginBottom:16}}>{q5r.s}</h3>
        {revOpts(q5r.o,q5r.c,rAnswer)}
      </div>);
    }

    // ── P6: Text Completion ──
    else if(revSec==="p6"){
      var tIdx6=0;var bIdx6=revIdx;
      for(var tt=0;tt<RP6.length;tt++){var bc=0;RP6[tt].parts.forEach(function(pt){if(pt.blank)bc++;});if(bIdx6<bc){tIdx6=tt;break;}bIdx6-=bc;}
      var t6r=RP6[tIdx6];var blanks6r=[];t6r.parts.forEach(function(pt){if(pt.blank)blanks6r.push(pt);});
      var bl6r=blanks6r[bIdx6];
      rAnswer=ans.p6[tIdx6][bIdx6];rCorrect=bl6r.correct;rExpl=bl6r.x;
      rLabel="Part 6 \u2014 Text "+(tIdx6+1)+", Blank "+(bIdx6+1);
      rItem=(<div>
        <div style={{fontSize:12,color:"var(--t2)",marginBottom:12}}>{t6r.type}: {t6r.subject||""}</div>
        {revOpts(bl6r.options,bl6r.correct,rAnswer)}
      </div>);
    }

    // ── P7: Reading Comprehension ──
    else if(revSec==="p7"){
      var flatP7=revIdx;var pi7=0;var qi7=0;
      for(var pp7=0;pp7<RP7.length;pp7++){
        if(flatP7<RP7[pp7].questions.length){pi7=pp7;qi7=flatP7;break;}
        flatP7-=RP7[pp7].questions.length;
      }
      var ps7r=RP7[pi7];var pq7r=ps7r.questions[qi7];
      rAnswer=ans.p7[pi7][qi7];rCorrect=pq7r.correct;rExpl=pq7r.x;
      rLabel="Part 7 \u2014 Passage "+(pi7+1)+", Q"+(qi7+1);
      rItem=(<div>
        <div style={{fontSize:11,color:"var(--t2)",marginBottom:8}}>{ps7r.type}</div>
        <h3 className="out" style={{fontWeight:700,fontSize:14,lineHeight:1.5,marginBottom:12}}>{pq7r.q}</h3>
        {revOpts(pq7r.options,pq7r.correct,rAnswer)}
      </div>);
    }

    // ── Navigation ──
    function revNext(){
      var curTotal=secTotals[revSec];
      if(revIdx<curTotal-1){setRevIdx(revIdx+1);}
      else{
        var si=secOrder.indexOf(revSec);
        if(si<secOrder.length-1){setRevSec(secOrder[si+1]);setRevIdx(0);}
        else{setRevMode(false);}
      }
    }
    function revPrev(){
      if(revIdx>0){setRevIdx(revIdx-1);}
      else{
        var si=secOrder.indexOf(revSec);
        if(si>0){var prevSec=secOrder[si-1];setRevSec(prevSec);setRevIdx(secTotals[prevSec]-1);}
      }
    }
    var isFirst=revSec==="p1"&&revIdx===0;
    var isLast=revSec==="p7"&&revIdx>=p7QC-1;

    // Section tabs for quick jump
    var secNames={p1:"P1",p2:"P2",p3:"P3",p4:"P4",p5:"P5",p6:"P6",p7:"P7"};

    return(<div style={{padding:"20px 16px 40px"}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12}}>
        <button onClick={function(){setRevMode(false);}} style={{background:"none",border:"none",color:"var(--t2)",cursor:"pointer",fontSize:14}}>{"\u2190"} Results</button>
        <span className="out" style={{fontWeight:700,fontSize:12,color:"var(--purple)"}}>{rLabel}</span>
        <div style={{width:40}}/>
      </div>

      {/* Section jump tabs */}
      <div style={{display:"flex",gap:4,marginBottom:16,overflowX:"auto"}}>
        {secOrder.map(function(sk){
          var active=sk===revSec;
          var isLis=sk==="p1"||sk==="p2"||sk==="p3"||sk==="p4";
          return(<button key={sk} onClick={function(){setRevSec(sk);setRevIdx(0);}}
            style={{padding:"4px 10px",borderRadius:99,border:"1px solid "+(active?"var(--cyan)":"var(--bdr)"),
              background:active?(isLis?"rgba(245,158,11,.15)":"rgba(0,212,255,.15)"):"transparent",
              color:active?"var(--cyan)":"var(--t3)",fontSize:11,fontWeight:active?700:500,cursor:"pointer",
              fontFamily:"'Cinzel','Outfit',serif",flexShrink:0}}>
            {secNames[sk]}</button>);
        })}
      </div>

      {rItem}

      {rExpl&&<div className="crd" style={{marginTop:14,padding:12,background:rAnswer===rCorrect?"rgba(0,230,118,.06)":"rgba(255,71,87,.06)",borderColor:rAnswer===rCorrect?"rgba(0,230,118,.15)":"rgba(255,71,87,.15)"}}>
        <p style={{fontSize:12,color:"var(--t2)",lineHeight:1.6}}>{rExpl}</p>
      </div>}

      <div style={{display:"flex",gap:10,marginTop:16}}>
        {!isFirst&&<button className="btn2" onClick={revPrev} style={{flex:1}}>{"\u2190"} Prev</button>}
        <button className="btn1" onClick={revNext} style={{flex:1}}>{isLast?"Back to Results":"Next \u2192"}</button>
      </div>
    </div>);
  }

'''

NEW_END = REVIEW_MODE + '''  return null;
}

function MockTest(p){'''

if OLD_END in app:
    app = app.replace(OLD_END, NEW_END, 1)
    ok += 1
    print("  ✅ Review mode added (7 parts)")
else:
    print("  ❌ Could not find BossTest closing boundary")

# ═══════════════════════════════════════
# WRITE
# ═══════════════════════════════════════
with open(APP, "w", encoding="utf-8") as f:
    f.write(app)

print(f"\n{'='*40}")
print(f"✅ {ok}/2 patches applied")
if ok == 2:
    print("📖 Boss Test Review Mode complete!")
    print("   • Review button on results screen")
    print("   • 7 section tabs (P1-P7) for quick navigation")
    print("   • Photo display for P1 review")
    print("   • Conversation transcript for P3 review")
    print("   • Talk transcript for P4 review")
    print("   • Green/red highlighting + explanations")
print(f"{'='*40}")
