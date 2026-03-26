/**
 * patch-profile-toeic.cjs
 * ─────────────────────────────────────────────────────────────────
 * Ajoute le score TOEIC estimé sur la page Profile étudiant,
 * sous forme d'un encadré pleine largeur avant la grille de stats.
 *
 * Prérequis : patch-toeic-score.cjs déjà appliqué
 * (la fonction estimateTOEIC doit exister dans TeacherDash)
 *
 * Usage : node patch-profile-toeic.cjs  (racine du projet)
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

const backupPath = APP_PATH + '.bak-profile-toeic';
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
// PATCH 1 — Ajouter estimateTOEIC dans le scope global
// (hors TeacherDash, accessible par Profile)
// On place la fonction standalone juste avant "function Profile"
// ─────────────────────────────────────────────────────────────────
apply(
  'PATCH 1 — estimateTOEIC global scope',
  `function Profile(p){`,
  `// ── TOEIC Score Estimator (global — used by Profile + TeacherDash) ──
function estimateTOEICScore(ms){
  function acc(id){var d=ms[id];if(!d||!d.total)return null;return d.correct/d.total;}
  var lisParts=[{id:"lisP1",w:0.20},{id:"lisP2",w:0.30},{id:"lisP3",w:0.25},{id:"lisP4",w:0.25}];
  var vocabVals=[acc("wordfam"),acc("connsort"),acc("prepdrill"),acc("gerinf")].filter(function(v){return v!==null;});
  var vocabAvg=vocabVals.length>0?vocabVals.reduce(function(a,b){return a+b;},0)/vocabVals.length:null;
  var rdParts=[{id:"drill",w:0.35},{id:"p6",w:0.25},{id:"p7",w:0.30},{val:vocabAvg,w:0.10}];
  function section(parts){
    var wSum=0,wTot=0,hasData=false;
    parts.forEach(function(p){var v=p.val!==undefined?p.val:acc(p.id);if(v!==null){wSum+=v*p.w;wTot+=p.w;hasData=true;}});
    if(!hasData)return null;
    wSum+=(1-wTot)*0.01;
    return wSum;
  }
  var lis=section(lisParts);var rd=section(rdParts);
  var lisScore=lis!==null?Math.round(5+lis*490):5;
  var rdScore=rd!==null?Math.round(5+rd*490):5;
  var total=lisScore+rdScore;
  var m1=acc("mock1"),m2=acc("mock2"),bonus=0;
  if(m1!==null&&m1>=0.60)bonus+=0.05;
  if(m2!==null&&m2>=0.60)bonus+=0.05;
  if(bonus>0)total=Math.min(990,Math.round(total*(1+bonus)));
  total=Math.max(200,Math.min(990,total));
  return{total:Math.round(total/5)*5,listening:lisScore,reading:rdScore};
}

function Profile(p){`
);

// ─────────────────────────────────────────────────────────────────
// PATCH 2 — Ajouter le bandeau TOEIC dans Profile, avant la grille
// On cible le début du grid de stats (unique dans Profile)
// ─────────────────────────────────────────────────────────────────
apply(
  'PATCH 2 — TOEIC card before stats grid in Profile',
  `<div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:24}}>
{[{l:"Total XP",v:u.xp,i:"⭐"}`,
  `{(function(){
  var toeic=estimateTOEICScore(u.moduleScores||{});
  var toeicCol=toeic.total>=750?"var(--green)":toeic.total>=500?"var(--orange)":"var(--red)";
  var hasData=toeic.total>200;
  return(<div className="crd" style={{padding:"14px 18px",marginBottom:16,
    background:"linear-gradient(135deg,rgba(212,148,58,.06),rgba(139,94,131,.06))",
    borderColor:"rgba(212,148,58,.15)"}}>
    <div style={{display:"flex",alignItems:"center",justifyContent:"space-between"}}>
      <div>
        <div style={{fontSize:10,color:"var(--t3)",fontWeight:600,letterSpacing:1,textTransform:"uppercase",marginBottom:4}}>Est. TOEIC Score</div>
        <div className="out" style={{fontWeight:900,fontSize:32,color:hasData?toeicCol:"var(--t3)",lineHeight:1}}>
          {toeic.total}<span style={{fontSize:14,color:"var(--t3)",fontWeight:400}}>/990</span>
        </div>
        {!hasData&&<div style={{fontSize:10,color:"var(--t3)",marginTop:4}}>Complete more modules to refine</div>}
      </div>
      <div style={{textAlign:"right"}}>
        <div style={{display:"flex",gap:16,marginBottom:4}}>
          <div style={{textAlign:"center"}}>
            <div className="out" style={{fontWeight:700,fontSize:16,color:"var(--cyan)"}}>{toeic.listening}</div>
            <div style={{fontSize:9,color:"var(--t3)"}}>Listening</div>
          </div>
          <div style={{textAlign:"center"}}>
            <div className="out" style={{fontWeight:700,fontSize:16,color:"var(--purple)"}}>{toeic.reading}</div>
            <div style={{fontSize:9,color:"var(--t3)"}}>Reading</div>
          </div>
        </div>
        <div style={{fontSize:9,color:"var(--t3)"}}>Based on your training</div>
      </div>
    </div>
  </div>);
})()}

<div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:24}}>
{[{l:"Total XP",v:u.xp,i:"⭐"}`
);

// ─────────────────────────────────────────────────────────────────
// PATCH 3 — Mettre à jour estimateTOEIC dans TeacherDash pour
// appeler estimateTOEICScore (la version globale) à la place
// ─────────────────────────────────────────────────────────────────
apply(
  'PATCH 3 — TeacherDash estimateTOEIC delegates to global',
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
  }`,

  `  // ── TOEIC Score Estimator (délègue à la fonction globale) ──
  function estimateTOEIC(s){
    return estimateTOEICScore(s.module_scores||s.moduleScores||{});
  }`
);

// ─────────────────────────────────────────────────────────────────
// Écriture
// ─────────────────────────────────────────────────────────────────
fs.writeFileSync(APP_PATH, patched, 'utf8');
console.log('');
console.log('🎉  Patch appliqué — src/App.jsx mis à jour.');
console.log('    npm run dev  →  onglet Profile  →  score TOEIC visible');
console.log(`    Rollback : copy "${path.basename(backupPath)}" src\\App.jsx`);
