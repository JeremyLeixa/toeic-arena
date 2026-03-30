// patch-progression-tab.cjs
//
// Ajoute un onglet "Progress" dans la League :
//   • Fetch des weekly_snapshots de la classe (module_scores_snapshot)
//   • Baseline = premier snapshot où TOEIC estimé > 200
//   • Progression = TOEIC actuel - TOEIC baseline
//   • Filtre : min 50 questions sur modules évalués (hors csess/Flashcards)
//   • Classement trié par gain décroissant
//   • C'est ce classement qui détermine la bonification
//   • "Teacher" filtré du classement (ghost mode)
//
// Usage : node patch-progression-tab.cjs

const fs = require("fs");
const path = require("path");

const FILE   = path.join(__dirname, "App.jsx");
const BACKUP = FILE + ".bak-progression-tab";

if (!fs.existsSync(FILE)) {
  console.error("❌ App.jsx introuvable dans le dossier courant.");
  process.exit(1);
}

let src = fs.readFileSync(FILE, "utf8");
const original = src;
let patchCount = 0;

function patch(label, oldStr, newStr) {
  if (!src.includes(oldStr)) {
    console.error(`❌ PATCH ${label} : cible introuvable.`);
    process.exit(1);
  }
  src = src.replace(oldStr, newStr);
  console.log(`✅ PATCH ${label} OK`);
  patchCount++;
}

// ════════════════════════════════════════════════════════════════
// PATCH 1 — Ajout state + fetch snapshots dans League
// ════════════════════════════════════════════════════════════════
patch(
  "1 — state progressionData + fetch snapshots",
  `var[showAllLeagues,setShowAllLeagues]=useState(false);`,
  `var[showAllLeagues,setShowAllLeagues]=useState(false);
var[progressionData,setProgressionData]=useState([]);
var[progLoading,setProgLoading]=useState(false);

// Charge les snapshots pour le tab Progression (lazy — uniquement quand on clique dessus)
function loadProgressionData(){
  if(progressionData.length>0)return; // déjà chargé
  setProgLoading(true);
  // On a besoin des students courants (module_scores) — déjà dans rivals
  // On fetch les snapshots pour retrouver le baseline de chaque étudiant
  supabase.from('weekly_snapshots')
    .select('student_name,week_start,module_scores_snapshot')
    .eq('class_code',leagueGroup)
    .order('week_start',{ascending:true})
    .limit(500)
    .then(function(res){
      setProgLoading(false);
      if(!res.data||res.data.length===0)return;
      // Groupe par étudiant
      var byStudent={};
      res.data.forEach(function(snap){
        var n=snap.student_name;
        if(n==="Teacher")return;
        if(!byStudent[n])byStudent[n]=[];
        byStudent[n].push(snap);
      });
      // Pour chaque étudiant dans rivals, calcule baseline + progression
      var rows=[];
      rivals.forEach(function(r){
        if(r.name==="Teacher")return;
        // Score TOEIC actuel
        var currentMs=r.module_scores||r.moduleScores||{};
        var currentToeic=estimateTOEICScore(currentMs).total;
        // Vérif min 50 questions évaluées (hors Flashcards)
        var assessedQ=0;
        var EXCLUDED=["csess"];
        Object.keys(currentMs).forEach(function(k){
          if(EXCLUDED.indexOf(k)===-1)assessedQ+=(currentMs[k].total||0);
        });
        if(assessedQ<50){
          rows.push({name:r.name,avatar:r.avatar||"⚔️",currentToeic:currentToeic,baseline:null,gain:null,assessedQ:assessedQ,me:r.name===u.name});
          return;
        }
        // Baseline : premier snapshot où TOEIC estimé > 200
        var snaps=byStudent[r.name]||[];
        var baseline=null;
        for(var i=0;i<snaps.length;i++){
          var ms=snaps[i].module_scores_snapshot||{};
          var t=estimateTOEICScore(ms).total;
          if(t>200){baseline=t;break;}
        }
        var gain=baseline!==null?(currentToeic-baseline):null;
        rows.push({name:r.name,avatar:r.avatar||"⚔️",currentToeic:currentToeic,baseline:baseline,gain:gain,assessedQ:assessedQ,me:r.name===u.name});
      });
      // Ajoute l'utilisateur courant s'il n'est pas dans rivals
      if(u.name!=="Teacher"&&!rows.find(function(r){return r.me;})){
        var currentMs=u.moduleScores||{};
        var currentToeic=estimateTOEICScore(currentMs).total;
        var assessedQ=0;
        Object.keys(currentMs).forEach(function(k){if(["csess"].indexOf(k)===-1)assessedQ+=(currentMs[k].total||0);});
        rows.push({name:u.name,avatar:u.avatar||"⚔️",currentToeic:currentToeic,baseline:null,gain:null,assessedQ:assessedQ,me:true});
      }
      // Tri : d'abord ceux avec un gain (décroissant), puis ceux sans données
      rows.sort(function(a,b){
        if(a.gain!==null&&b.gain!==null)return b.gain-a.gain;
        if(a.gain!==null)return -1;
        if(b.gain!==null)return 1;
        return b.currentToeic-a.currentToeic;
      });
      setProgressionData(rows);
    });
}`
);

// ════════════════════════════════════════════════════════════════
// PATCH 2 — Reset progressionData quand on change de groupe
// ════════════════════════════════════════════════════════════════
patch(
  "2 — reset progressionData on group change",
  `useEffect(function(){
  supabase.from('students').select('name,weekly_xp,week_id,avatar,weekly_history').eq('class_code',leagueGroup).order('weekly_xp',{ascending:false}).limit(150)
    .then(function(res){if(res.data)setRivals(res.data.filter(function(r){return r.name!=="Teacher";}));});
},[u.weeklyXp,leagueGroup]);`,
  `useEffect(function(){
  supabase.from('students').select('name,weekly_xp,week_id,avatar,weekly_history,module_scores').eq('class_code',leagueGroup).order('weekly_xp',{ascending:false}).limit(150)
    .then(function(res){if(res.data){setRivals(res.data.filter(function(r){return r.name!=="Teacher";}));setProgressionData([]);}});
},[u.weeklyXp,leagueGroup]);`
);

// ════════════════════════════════════════════════════════════════
// PATCH 3 — Ajout tab "Progress" dans la tab bar
// ════════════════════════════════════════════════════════════════
patch(
  "3 — tab bar Progress",
  `{[{k:"week",l:"Week"},{k:"season",l:"Season "+curSeason.id},{k:"overall",l:"Overall"}].map(function(t){`,
  `{[{k:"week",l:"Week"},{k:"season",l:"Season "+curSeason.id},{k:"overall",l:"Overall"},{k:"progress",l:"📈 Progress"}].map(function(t){`
);

// ════════════════════════════════════════════════════════════════
// PATCH 4 — Déclenchement du fetch au clic sur l'onglet Progress
// ════════════════════════════════════════════════════════════════
patch(
  "4 — trigger loadProgressionData on tab click",
  `return(<button key={t.k} onClick={function(){setTab(t.k);}} style={{flex:1,padding:"8px 0",borderRadius:8,border:"none",cursor:"pointer",fontFamily:"'DM Sans',sans-serif",fontSize:13,fontWeight:active?700:500,background:active?"var(--cyan)":"transparent",color:active?"#000":"var(--t3)",transition:"all .2s"}}>{t.l}</button>);`,
  `return(<button key={t.k} onClick={function(){setTab(t.k);if(t.k==="progress")loadProgressionData();}} style={{flex:1,padding:"8px 0",borderRadius:8,border:"none",cursor:"pointer",fontFamily:"'DM Sans',sans-serif",fontSize:13,fontWeight:active?700:500,background:active?"var(--cyan)":"transparent",color:active?"#000":"var(--t3)",transition:"all .2s"}}>{t.l}</button>);`
);

// ════════════════════════════════════════════════════════════════
// PATCH 5 — Rendu du tab Progress (inséré avant la fermeture de League)
// ════════════════════════════════════════════════════════════════
patch(
  "5 — Progress tab rendering",
  `</div>);}

// ─── PROFILE ───`,
  `</div>)}

{/* ── PROGRESSION TAB ── */}
{tab==="progress"&&(<div>
  <div className="crd" style={{textAlign:"center",marginBottom:16,padding:20,
    background:"linear-gradient(135deg,rgba(74,190,96,.04),rgba(139,94,131,.04))",
    borderColor:"rgba(74,190,96,.15)"}}>
    <div style={{fontSize:36,marginBottom:6}}>📈</div>
    <div className="out" style={{fontWeight:800,fontSize:20,color:"var(--green)"}}>Classement Progression</div>
    <div style={{fontSize:12,color:"var(--t2)",marginTop:4}}>Gain de score TOEIC estimé depuis la première semaine de données</div>
    <div style={{fontSize:11,color:"var(--gold)",marginTop:8,fontWeight:600}}>🏆 Top 3 → +2 pts · Top 10 → +1 pt sur la note finale</div>
  </div>

  {progLoading&&<div style={{textAlign:"center",padding:40}}>
    <div style={{fontSize:24,marginBottom:8}}>⏳</div>
    <p style={{fontSize:13,color:"var(--t3)"}}>Calcul en cours...</p>
  </div>}

  {!progLoading&&progressionData.length===0&&<div className="crd" style={{padding:20,textAlign:"center"}}>
    <p style={{fontSize:13,color:"var(--t3)"}}>Pas encore assez de données. Reviens dans quelques semaines !</p>
  </div>}

  {!progLoading&&progressionData.length>0&&(function(){
    var eligible=progressionData.filter(function(r){return r.gain!==null;});
    var pending=progressionData.filter(function(r){return r.gain===null;});
    return(<div>
      {eligible.length>0&&<>
        <div style={{fontSize:10,color:"var(--t3)",fontWeight:600,letterSpacing:1,textTransform:"uppercase",marginBottom:10}}>
          Classés ({eligible.length})
        </div>
        <div style={{display:"flex",flexDirection:"column",gap:6,marginBottom:20}}>
          {eligible.map(function(pl,i){
            var rank=i+1;
            var isTop3=rank<=3;var isTop10=rank<=10;
            var gainCol=pl.gain>100?"var(--green)":pl.gain>0?"var(--orange)":"var(--red)";
            var gainSign=pl.gain>0?"+":"";
            var bonusLabel=isTop3?"🏆 +2pts":isTop10?"⭐ +1pt":"";
            return(<div key={pl.name} style={{
              display:"flex",alignItems:"center",gap:12,padding:"12px 14px",
              background:pl.me?"rgba(212,148,58,.08)":"var(--bg2)",
              border:pl.me?"1.5px solid rgba(212,148,58,.25)":isTop3?"1px solid rgba(74,190,96,.25)":"1px solid var(--bdr)",
              borderRadius:12}}>
              <div className="out" style={{width:28,textAlign:"center",fontWeight:800,fontSize:14,
                color:rank===1?"var(--gold)":rank===2?"#c0c0c0":rank===3?"#cd7f32":"var(--t3)"}}>
                {rank===1?"🥇":rank===2?"🥈":rank===3?"🥉":rank}
              </div>
              <div style={{width:28,display:"flex",justifyContent:"center"}}>{renderAv(pl.avatar,28)}</div>
              <div style={{flex:1}}>
                <div className="out" style={{fontWeight:pl.me?700:500,fontSize:14,
                  color:pl.me?"var(--cyan)":"var(--t1)"}}>
                  {pl.me?pl.name+" (You)":pl.name}
                </div>
                <div style={{fontSize:10,color:"var(--t3)",marginTop:1}}>
                  {pl.baseline} → {pl.currentToeic} pts TOEIC
                  {bonusLabel&&<span style={{marginLeft:6,color:"var(--gold)",fontWeight:700}}>{bonusLabel}</span>}
                </div>
              </div>
              <div className="out" style={{fontWeight:800,fontSize:16,color:gainCol,minWidth:48,textAlign:"right"}}>
                {gainSign}{pl.gain}
              </div>
            </div>);
          })}
        </div>
      </>}

      {pending.length>0&&<>
        <div style={{fontSize:10,color:"var(--t3)",fontWeight:600,letterSpacing:1,textTransform:"uppercase",marginBottom:10}}>
          En attente de données ({pending.length})
        </div>
        <div style={{display:"flex",flexDirection:"column",gap:6}}>
          {pending.map(function(pl){
            var reason=pl.assessedQ<50
              ?("Modules évalués : "+pl.assessedQ+"/50 questions min")
              :"Pas encore de baseline (semaine de référence manquante)";
            return(<div key={pl.name} style={{
              display:"flex",alignItems:"center",gap:12,padding:"12px 14px",
              background:"var(--bg2)",border:"1px solid var(--bdr)",
              borderRadius:12,opacity:0.5}}>
              <div style={{width:28,textAlign:"center",fontSize:14,color:"var(--t3)"}}>—</div>
              <div style={{width:28,display:"flex",justifyContent:"center"}}>{renderAv(pl.avatar,28)}</div>
              <div style={{flex:1}}>
                <div className="out" style={{fontWeight:pl.me?700:500,fontSize:14,
                  color:pl.me?"var(--cyan)":"var(--t1)"}}>
                  {pl.me?pl.name+" (You)":pl.name}
                </div>
                <div style={{fontSize:10,color:"var(--t3)",marginTop:1}}>{reason}</div>
              </div>
              <div style={{fontSize:12,color:"var(--t3)"}}>⏳</div>
            </div>);
          })}
        </div>
      </>}

      <p style={{textAlign:"center",fontSize:11,color:"var(--t3)",marginTop:16,lineHeight:1.6}}>
        Baseline = premier snapshot avec TOEIC estimé &gt; 200 · Min. 50 questions évaluées (hors Flashcards)
      </p>
    </div>);
  })()}
</div>)}

</div>);}

// ─── PROFILE ───`
);

// ════════════════════════════════════════════════════════════════
// WRITE
// ════════════════════════════════════════════════════════════════
if (src === original) {
  console.warn("⚠️  Aucun changement détecté — le patch a peut-être déjà été appliqué.");
  process.exit(0);
}

fs.writeFileSync(BACKUP, original, "utf8");
console.log(`\n📦 Backup : App.jsx.bak-progression-tab`);
fs.writeFileSync(FILE, src, "utf8");
console.log(`🎉 ${patchCount}/5 patches appliqués.\n`);
console.log("Onglet Progress dans League :");
console.log("  • Fetch lazy des snapshots (uniquement au premier clic sur l'onglet)");
console.log("  • Baseline = premier snapshot avec TOEIC estimé > 200 par étudiant");
console.log("  • Filtre : min 50 questions évaluées hors Flashcards pour apparaître");
console.log("  • Gain affiché en points TOEIC (+/- coloré)");
console.log("  • Badges 🏆 +2pts (Top 3) et ⭐ +1pt (Top 10) visibles inline");
console.log("  • Étudiants sans baseline ou sans assez de données → section 'En attente'");
console.log("  • Fetch students enrichi avec module_scores (nécessaire pour TOEIC actuel)");
