/**
 * patch-toeic-score.cjs
 * ─────────────────────────────────────────────────────────────────
 * 4 changements dans TeacherDash + StudentDetail :
 *
 *  1. Fonction estimateTOEIC(s) — formule pondérée Listening/Reading
 *  2. État sortBy (défaut: "toeic") + contrôles de tri dans Overview
 *  3. Student list remplacée : tri dynamique + score TOEIC affiché
 *  4. StudentDetail : carte TOEIC dans les KPIs
 *  5. CSV export : colonne TOEIC Score ajoutée
 *
 * Usage : node patch-toeic-score.cjs  (racine du projet)
 * ─────────────────────────────────────────────────────────────────
 */

'use strict';
const fs   = require('fs');
const path = require('path');

const APP_PATH = path.resolve(__dirname, 'src/App.jsx');
if (!fs.existsSync(APP_PATH)) { console.error('❌  src/App.jsx introuvable'); process.exit(1); }

const buf      = fs.readFileSync(APP_PATH);
const original = buf.toString('utf8');
let   patched  = original;

const backupPath = APP_PATH + '.bak-toeic-score';
fs.writeFileSync(backupPath, buf);
console.log(`📦  Backup : ${path.basename(backupPath)}`);

function apply(label, oldStr, newStr) {
  if (!patched.includes(oldStr)) {
    console.error(`\n❌  [${label}] Pattern introuvable. Déjà patché ou fichier divergé.`);
    process.exit(1);
  }
  const n = patched.split(oldStr).length - 1;
  if (n > 1) { console.error(`❌  [${label}] Ambigu (${n} occurrences).`); process.exit(1); }
  patched = patched.replace(oldStr, newStr);
  console.log(`✅  [${label}]`);
}

// ─────────────────────────────────────────────────────────────────
// PATCH 1 — Ajouter estimateTOEIC() juste avant exportCSV()
// ─────────────────────────────────────────────────────────────────
apply(
  'PATCH 1 — estimateTOEIC function',

  `  // ── CSV Export ──`,

  `  // ── TOEIC Score Estimator ──
  function estimateTOEIC(s){
    var ms=s.module_scores||s.moduleScores||{};
    function acc(id){var d=ms[id];if(!d||!d.total)return null;return d.correct/d.total;}
    // Listening : P1×0.20 + P2×0.30 + P3×0.25 + P4×0.25
    var lisParts=[{id:"lisP1",w:0.20},{id:"lisP2",w:0.30},{id:"lisP3",w:0.25},{id:"lisP4",w:0.25}];
    // Reading : P5×0.35 + P6×0.25 + P7×0.30 + vocab×0.10
    var vocabVals=[acc("wordfam"),acc("connsort"),acc("prepdrill"),acc("gerinf")].filter(function(v){return v!==null;});
    var vocabAvg=vocabVals.length>0?vocabVals.reduce(function(a,b){return a+b;},0)/vocabVals.length:null;
    var rdParts=[{id:"drill",w:0.35},{id:"p6",w:0.25},{id:"p7",w:0.30},{val:vocabAvg,w:0.10}];
    function section(parts){
      var wSum=0,wTot=0,hasData=false;
      parts.forEach(function(p){var v=p.val!==undefined?p.val:acc(p.id);if(v!==null){wSum+=v*p.w;wTot+=p.w;hasData=true;}});
      if(!hasData)return null;
      wSum+=(1-wTot)*0.01; // sections non testées = score minimum
      return wSum;
    }
    var lis=section(lisParts);var rd=section(rdParts);
    var lisScore=lis!==null?Math.round(5+lis*490):5;
    var rdScore=rd!==null?Math.round(5+rd*490):5;
    var total=lisScore+rdScore;
    // Mock bonus : +5% par mock >= 60%, cappé à 990
    var m1=acc("mock1"),m2=acc("mock2"),bonus=0;
    if(m1!==null&&m1>=0.60)bonus+=0.05;
    if(m2!==null&&m2>=0.60)bonus+=0.05;
    if(bonus>0)total=Math.min(990,Math.round(total*(1+bonus)));
    total=Math.max(200,Math.min(990,total));
    total=Math.round(total/5)*5; // arrondi à la dizaine comme le vrai TOEIC
    return{total:total,listening:lisScore,reading:rdScore};
  }

  // ── CSV Export ──`
);

// ─────────────────────────────────────────────────────────────────
// PATCH 2 — Ajouter état sortBy après dashTab
// ─────────────────────────────────────────────────────────────────
apply(
  'PATCH 2 — sortBy state',
  `var[dashTab,setDashTab]=useState("overview"); // "overview" | "analytics"`,
  `var[dashTab,setDashTab]=useState("overview"); // "overview" | "analytics"
  var[sortBy,setSortBy]=useState("toeic"); // "toeic"|"xp"|"accuracy"|"time"|"last_active"`
);

// ─────────────────────────────────────────────────────────────────
// PATCH 3 — Remplacer la student list avec tri dynamique + TOEIC
// ─────────────────────────────────────────────────────────────────
apply(
  'PATCH 3 — student list with sort + TOEIC',

  // OLD
  `students.sort(function(a,b){return(b.xp||0)-(a.xp||0);}).map(function(s,i){
          var sAcc=s.stats&&s.stats.totalQ>0?Math.round(s.stats.correct/s.stats.totalQ*100):0;
          var accCol=sAcc>=70?"var(--green)":sAcc>=50?"var(--orange)":"var(--red)";
          return(<div key={i} className="crd" style={{display:"flex",alignItems:"center",gap:12,padding:"12px 14px",cursor:"pointer"}}
            onClick={function(){setDetail(i);}}>
            <div style={{width:32,height:32,borderRadius:"50%",background:"linear-gradient(135deg,#d4943a,#8b5e83)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:14,fontWeight:800,flexShrink:0}} className="out">{s.name.charAt(0).toUpperCase()}</div>
            <div style={{flex:1,minWidth:0}}>
              <div className="out" style={{fontWeight:700,fontSize:14}}>{s.name}</div>
              <div style={{display:"flex",gap:8,marginTop:2}}>
                <span style={{fontSize:10,color:"var(--gold)"}}>Lv {getLevel(s.xp||0).level}</span>
                <span style={{fontSize:10,color:"var(--t3)"}}>{s.stats?s.stats.sessions:0} sess</span>
                <span style={{fontSize:10,color:"var(--orange)"}}>{s.streak||0} streak</span>
                <span style={{fontSize:10,color:"var(--t2)"}}>⏱ {fmtTime(s.total_time||0)}</span>
              </div>
            </div>
            <div style={{textAlign:"right"}}>
              <div className="out" style={{fontWeight:800,fontSize:16,color:accCol}}>{sAcc}%</div>
              <div style={{fontSize:10,color:"var(--t3)"}}>{s.xp||0} XP</div>
            </div>
            <span style={{fontSize:14,color:"var(--cyan)",marginLeft:4}}>{"→"}</span>
          </div>);
        })}
      </div>`,

  // NEW
  `(function(){
          // ── Sort controls ──
          var SORT_OPTS=[
            {id:"toeic",label:"TOEIC Score"},
            {id:"xp",label:"XP Total"},
            {id:"accuracy",label:"Accuracy"},
            {id:"time",label:"Time"},
            {id:"last_active",label:"Last Active"},
          ];
          var sorted=students.slice().sort(function(a,b){
            if(sortBy==="toeic"){return estimateTOEIC(b).total-estimateTOEIC(a).total;}
            if(sortBy==="xp"){return(b.xp||0)-(a.xp||0);}
            if(sortBy==="accuracy"){
              var aa=a.stats&&a.stats.totalQ>0?a.stats.correct/a.stats.totalQ:0;
              var ba=b.stats&&b.stats.totalQ>0?b.stats.correct/b.stats.totalQ:0;
              return ba-aa;
            }
            if(sortBy==="time"){return(b.total_time||0)-(a.total_time||0);}
            if(sortBy==="last_active"){
              var al=a.last_active||"0",bl=b.last_active||"0";
              return bl>al?1:bl<al?-1:0;
            }
            return 0;
          });
          return(<div>
            {/* Sort pills */}
            <div style={{display:"flex",gap:4,marginBottom:12,flexWrap:"wrap"}}>
              {SORT_OPTS.map(function(o){
                var active=sortBy===o.id;
                return(<button key={o.id} onClick={function(){setSortBy(o.id);}}
                  style={{padding:"5px 10px",borderRadius:99,border:"1px solid "+(active?"var(--cyan)":"var(--bdr)"),
                    background:active?"rgba(0,212,255,.1)":"transparent",color:active?"var(--cyan)":"var(--t3)",
                    fontSize:11,fontWeight:active?700:400,cursor:"pointer",fontFamily:"'DM Sans',sans-serif"}} className="out">{o.label}</button>);
              })}
            </div>
            {/* Student rows */}
            {sorted.map(function(s,i){
              var origIdx=students.indexOf(s);
              var sAcc=s.stats&&s.stats.totalQ>0?Math.round(s.stats.correct/s.stats.totalQ*100):0;
              var accCol=sAcc>=70?"var(--green)":sAcc>=50?"var(--orange)":"var(--red)";
              var toeic=estimateTOEIC(s);
              var toeicCol=toeic.total>=750?"var(--green)":toeic.total>=500?"var(--orange)":"var(--red)";
              var lastSeen=s.last_active?s.last_active.substring(5):"—";
              return(<div key={i} className="crd" style={{display:"flex",alignItems:"center",gap:10,padding:"11px 14px",cursor:"pointer"}}
                onClick={function(){setDetail(origIdx);}}>
                <div style={{width:32,height:32,borderRadius:"50%",background:"linear-gradient(135deg,#d4943a,#8b5e83)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:13,fontWeight:800,flexShrink:0}} className="out">{s.name.charAt(0).toUpperCase()}</div>
                <div style={{flex:1,minWidth:0}}>
                  <div className="out" style={{fontWeight:700,fontSize:13}}>{s.name}</div>
                  <div style={{display:"flex",gap:6,marginTop:2,flexWrap:"wrap"}}>
                    <span style={{fontSize:10,color:"var(--t3)"}}>{s.stats?s.stats.sessions:0} sess</span>
                    <span style={{fontSize:10,color:"var(--t3)"}}>⏱{fmtTime(s.total_time||0)}</span>
                    <span style={{fontSize:10,color:"var(--t3)"}}>📅{lastSeen}</span>
                  </div>
                </div>
                <div style={{textAlign:"right",flexShrink:0}}>
                  <div className="out" style={{fontWeight:800,fontSize:15,color:toeicCol}}>{toeic.total}</div>
                  <div style={{fontSize:9,color:"var(--t3)"}}>est. TOEIC</div>
                </div>
                <div style={{textAlign:"right",flexShrink:0,marginLeft:6}}>
                  <div className="out" style={{fontWeight:700,fontSize:13,color:accCol}}>{sAcc}%</div>
                  <div style={{fontSize:9,color:"var(--t3)"}}>{s.xp||0} XP</div>
                </div>
                <span style={{fontSize:12,color:"var(--cyan)",marginLeft:2}}>{"→"}</span>
              </div>);
            })}
          </div>);
        })()}
      </div>`
);

// ─────────────────────────────────────────────────────────────────
// PATCH 4 — Student detail : ajouter carte TOEIC dans les KPIs
// On remplace le grid 4 colonnes par un grid 2×2 + bande TOEIC
// ─────────────────────────────────────────────────────────────────
apply(
  'PATCH 4 — student detail TOEIC card',

  `      {/* KPI cards */}
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr 1fr",gap:8,marginBottom:20}}>
        <div className="crd" style={{padding:10,textAlign:"center"}}><div className="out" style={{fontSize:16,fontWeight:800,color:"var(--gold)"}}>{s.xp||0}</div><div style={{fontSize:10,color:"var(--t3)"}}>XP</div></div>
        <div className="crd" style={{padding:10,textAlign:"center"}}><div className="out" style={{fontSize:16,fontWeight:800,color:acc>=60?"var(--cyan)":"var(--orange)"}}>{acc}%</div><div style={{fontSize:10,color:"var(--t3)"}}>Accuracy</div></div>
        <div className="crd" style={{padding:10,textAlign:"center"}}><div className="out" style={{fontSize:16,fontWeight:800,color:"var(--purple)"}}>{s.stats?s.stats.sessions:0}</div><div style={{fontSize:10,color:"var(--t3)"}}>Sessions</div></div>
        <div className="crd" style={{padding:10,textAlign:"center"}}><div className="out" style={{fontSize:16,fontWeight:800,color:"var(--orange)"}}>{fmtTime(s.total_time||0)}</div><div style={{fontSize:10,color:"var(--t3)"}}>Time</div></div>
      </div>`,

  `      {/* KPI cards */}
      {(function(){
        var toeic=estimateTOEIC(s);
        var toeicCol=toeic.total>=750?"var(--green)":toeic.total>=500?"var(--orange)":"var(--red)";
        return(<div style={{marginBottom:20}}>
          {/* TOEIC Score — full width banner */}
          <div className="crd" style={{padding:"12px 16px",marginBottom:8,background:"linear-gradient(135deg,rgba(212,148,58,.06),rgba(139,94,131,.06))",borderColor:"rgba(212,148,58,.15)",display:"flex",alignItems:"center",justifyContent:"space-between"}}>
            <div>
              <div className="out" style={{fontWeight:800,fontSize:11,color:"var(--t3)",letterSpacing:1,textTransform:"uppercase",marginBottom:2}}>Est. TOEIC Score</div>
              <div className="out" style={{fontWeight:900,fontSize:28,color:toeicCol,lineHeight:1}}>{toeic.total}<span style={{fontSize:13,color:"var(--t3)",fontWeight:400}}>/990</span></div>
            </div>
            <div style={{textAlign:"right"}}>
              <div style={{display:"flex",gap:12}}>
                <div style={{textAlign:"center"}}>
                  <div className="out" style={{fontWeight:700,fontSize:14,color:"var(--cyan)"}}>{toeic.listening}</div>
                  <div style={{fontSize:9,color:"var(--t3)"}}>Listening</div>
                </div>
                <div style={{textAlign:"center"}}>
                  <div className="out" style={{fontWeight:700,fontSize:14,color:"var(--purple)"}}>{toeic.reading}</div>
                  <div style={{fontSize:9,color:"var(--t3)"}}>Reading</div>
                </div>
              </div>
              <div style={{fontSize:9,color:"var(--t3)",marginTop:4}}>Based on training data</div>
            </div>
          </div>
          {/* 4 KPIs */}
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr 1fr",gap:8}}>
            <div className="crd" style={{padding:10,textAlign:"center"}}><div className="out" style={{fontSize:16,fontWeight:800,color:"var(--gold)"}}>{s.xp||0}</div><div style={{fontSize:10,color:"var(--t3)"}}>XP</div></div>
            <div className="crd" style={{padding:10,textAlign:"center"}}><div className="out" style={{fontSize:16,fontWeight:800,color:acc>=60?"var(--cyan)":"var(--orange)"}}>{acc}%</div><div style={{fontSize:10,color:"var(--t3)"}}>Accuracy</div></div>
            <div className="crd" style={{padding:10,textAlign:"center"}}><div className="out" style={{fontSize:16,fontWeight:800,color:"var(--purple)"}}>{s.stats?s.stats.sessions:0}</div><div style={{fontSize:10,color:"var(--t3)"}}>Sessions</div></div>
            <div className="crd" style={{padding:10,textAlign:"center"}}><div className="out" style={{fontSize:16,fontWeight:800,color:"var(--orange)"}}>{fmtTime(s.total_time||0)}</div><div style={{fontSize:10,color:"var(--t3)"}}>Time</div></div>
          </div>
        </div>);
      })()}`
);

// ─────────────────────────────────────────────────────────────────
// PATCH 5 — CSV : ajouter colonne TOEIC Score (après Accuracy %)
// ─────────────────────────────────────────────────────────────────
apply(
  'PATCH 5a — CSV headers TOEIC',
  `var headers=["Name","XP","Level","League","Streak","Sessions","Time (min)","Total Questions","Correct","Accuracy %"];`,
  `var headers=["Name","XP","Level","League","Streak","Sessions","Time (min)","Total Questions","Correct","Accuracy %","Est. TOEIC Score","TOEIC Listening","TOEIC Reading"];`
);

apply(
  'PATCH 5b — CSV row TOEIC values',
  `        stats.sessions,Math.round((s.total_time||0)/60),stats.totalQ,stats.correct,acc
      ];`,
  `        stats.sessions,Math.round((s.total_time||0)/60),stats.totalQ,stats.correct,acc,
        (function(){var t=estimateTOEIC(s);return t.total+","+t.listening+","+t.reading;})()
      ];`
);

// ─────────────────────────────────────────────────────────────────
// Écriture
// ─────────────────────────────────────────────────────────────────
fs.writeFileSync(APP_PATH, patched, 'utf8');
console.log('');
console.log('🎉  Patch appliqué — src/App.jsx mis à jour.');
console.log('    npm run dev  →  Teacher Dashboard > Overview');
console.log(`    Rollback : copy "${path.basename(backupPath)}" src\\App.jsx`);
