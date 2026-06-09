/*
 * Chantier A — Patch de production de l'estimateur TOEIC.
 *
 * Lit src/App.jsx, applique des remplacements ancres (idempotents), ecrit
 * src/App_patched.jsx A COTE. Jeremy verifie puis renomme en App.jsx.
 *
 * NE MODIFIE PAS App.jsx directement.
 *
 * Usage : node scripts/patch_chantier_A_toeic_estimation.cjs
 *
 * La fonction estimateTOEICScore injectee ici est STRICTEMENT la config V2
 * validee dans tests/validate_toeic_estimation.cjs (A.5 ON + bonus mock
 * asymetrique, normalisation wSum/wTot, gating A.1, ancrage Boss A.4 optionnel).
 */
'use strict';
const fs = require('fs');
const path = require('path');

// SRC/OUT surchargeables par env (utile pour test d'idempotence). Defaut :
// lit App.jsx, ecrit App_patched.jsx (Jeremy renomme apres verification).
const SRC = process.env.PATCH_SRC || path.join(__dirname, '..', 'src', 'App.jsx');
const OUT = process.env.PATCH_OUT || path.join(__dirname, '..', 'src', 'App_patched.jsx');

// ─────────────────────────────────────────────────────────────────────────
// Nouvelle fonction estimateTOEICScore (config V2 validee)
// ─────────────────────────────────────────────────────────────────────────
const NEW_FUNC = `function estimateTOEICScore(ms,opts){
  // CHANTIER-A v2 (2026-06-09) — refonte calibree sur la cohorte IDRAC T2.
  // Changements clefs vs V1 :
  //  - Normalisation PROPORTIONNELLE des sections (wSum/wTot) au lieu du hack
  //    "wSum+=(1-wTot)*0.01" qui ecrasait le Reading des profils a couverture
  //    partielle (defaut #2 "Reading 8/495"). NE PAS revenir en arriere.
  //  - Gating A.1 : retourne {total:null,estimable:false|"partial"} tant que la
  //    preuve est insuffisante, au lieu d'un cold-start trompeur a 200.
  //  - Assiette Reading elargie aux modules transverses (A.2).
  //  - A.5 ponderation par confiance (volume de questions par module).
  //  - Bonus mock ASYMETRIQUE (Kamel-safe) : recompense la sur-perf mock,
  //    ne penalise jamais une mauvaise perf mock.
  //  - A.4 ancrage Boss 60% via opts.bossToeic (echelle 990, optionnel).
  ms=ms||{};opts=opts||{};
  function rec(id){var d=ms[id];if(!d||!d.total)return null;return{acc:d.correct/d.total,q:d.total};}
  function confW(q){if(q<10)return 0.3;if(q<30)return 0.6;if(q<100)return 0.85;return 1;}
  function sumQ(ids){var s=0;ids.forEach(function(id){var r=rec(id);if(r)s+=r.q;});return s;}
  var READING_MODS=["drill","p6","p7","wordfam","connsort","prepdrill","gerinf","falsefr","pvdojo","sbuild","gauntlet_irregular","gauntlet_tense","gauntlet_passive","gauntlet_relative"];
  var LIS_MODS=["lisP1","lisP2","lisP3","lisP4","ablitz"];
  var readingQ=sumQ(READING_MODS),listeningQ=sumQ(LIS_MODS);
  var m1=rec("mock1"),m2=rec("mock2"),mbR=rec("boss");
  var bossToeic=(opts.bossToeic!=null&&isFinite(opts.bossToeic))?opts.bossToeic:null;
  var mocksList=[m1,m2,mbR].filter(Boolean);
  var hasMock=mocksList.length>0||bossToeic!==null;
  var mocksDone=mocksList.length+((bossToeic!==null&&!mbR)?1:0);
  var evidence={listeningQ:listeningQ,readingQ:readingQ,mocksDone:mocksDone};
  // A.1 seuils (decision produit — ne pas modifier sans validation) : 80 Reading, 40 Listening, ou >=1 mock.
  var readingOK=readingQ>=80||hasMock;
  var listeningOK=listeningQ>=40||hasMock;
  // Sections, normalisation proportionnelle (A.2/A.3).
  var gaunt=[rec("gauntlet_irregular"),rec("gauntlet_tense"),rec("gauntlet_passive"),rec("gauntlet_relative")].filter(Boolean);
  var gauntAvg=gaunt.length?{acc:gaunt.reduce(function(a,b){return a+b.acc;},0)/gaunt.length,q:gaunt.reduce(function(a,b){return a+b.q;},0)}:null;
  var rdParts=[{id:"drill",w:0.22},{id:"p6",w:0.15},{id:"p7",w:0.18},{id:"wordfam",w:0.06},{id:"connsort",w:0.06},{id:"prepdrill",w:0.05},{id:"gerinf",w:0.05},{id:"falsefr",w:0.04},{id:"pvdojo",w:0.04},{id:"sbuild",w:0.04},{val:gauntAvg,w:0.11}];
  var lisParts=[{id:"lisP1",w:0.18},{id:"lisP2",w:0.27},{id:"lisP3",w:0.25},{id:"lisP4",w:0.22},{id:"ablitz",w:0.08}];
  function section(parts){
    var wSum=0,wTot=0,has=false;
    parts.forEach(function(p){var r=p.val!==undefined?p.val:rec(p.id);if(r){var ew=p.w*confW(r.q);wSum+=r.acc*ew;wTot+=ew;has=true;}});
    if(!has)return null;
    return wSum/wTot;
  }
  var rawLis=section(lisParts),rawRd=section(rdParts);
  // Anti-trou : une section debloquee par un mock mais sans module propre est derivee de l'acc mock.
  var mockAcc=null;
  if(mocksList.length){var sa=0,qa=0;mocksList.forEach(function(m){sa+=m.acc*m.q;qa+=m.q;});mockAcc=qa?sa/qa:null;}
  if(hasMock&&mockAcc!==null){if(rawRd===null)rawRd=mockAcc;if(rawLis===null)rawLis=mockAcc;}
  var lisScore=rawLis!==null?Math.round(Math.max(5,Math.min(495,5+rawLis*490))):null;
  var rdScore=rawRd!==null?Math.round(Math.max(5,Math.min(495,5+rawRd*490))):null;
  // A.1 — aucune preuve : non estimable.
  if(!readingOK&&!listeningOK){
    return{total:null,listening:null,reading:null,estimable:false,evidence:evidence,reason:"insufficient_data"};
  }
  var bothShown=lisScore!==null&&rdScore!==null;
  if(readingOK&&listeningOK&&bothShown){
    var total=lisScore+rdScore;
    var bonus=0;mocksList.forEach(function(m){if(m.acc>0.60)bonus+=(m.acc-0.60)*0.30;});bonus=Math.min(0.20,bonus);
    if(bonus>0)total=total*(1+bonus);
    if(bossToeic!==null)total=0.60*bossToeic+0.40*total; // A.4
    total=Math.max(200,Math.min(990,total));
    return{total:Math.round(total/5)*5,listening:lisScore,reading:rdScore,estimable:true,evidence:evidence};
  }
  // A.1 — cas partiel : une seule section calculable.
  return{total:null,listening:(listeningOK&&lisScore!==null)?lisScore:null,reading:(readingOK&&rdScore!==null)?rdScore:null,estimable:"partial",evidence:evidence};
}`;

// ─────────────────────────────────────────────────────────────────────────
// Ancien corps de fonction (cible R1) — copie EXACTE du code de prod
// ─────────────────────────────────────────────────────────────────────────
const OLD_FUNC = `function estimateTOEICScore(ms){
  function acc(id){var d=ms[id];if(!d||!d.total)return null;return d.correct/d.total;}
  var lisParts=[{id:"lisP1",w:0.20},{id:"lisP2",w:0.30},{id:"lisP3",w:0.25},{id:"lisP4",w:0.25}];
  var vocabVals=[acc("wordfam"),acc("connsort"),acc("prepdrill"),acc("gerinf")].filter(function(v){return v!==null;});
  var vocabAvg=vocabVals.length>0?vocabVals.reduce(function(a,b){return a+b;},0)/vocabVals.length:null;
  // Grammar Gauntlet — average across the 4 sub-modules (morpho-syntaxe verbale deep dive)
  var gauntletVals=[acc("gauntlet_irregular"),acc("gauntlet_tense"),acc("gauntlet_passive"),acc("gauntlet_relative")].filter(function(v){return v!==null;});
  var gauntletAvg=gauntletVals.length>0?gauntletVals.reduce(function(a,b){return a+b;},0)/gauntletVals.length:null;
  var rdParts=[{id:"drill",w:0.30},{id:"p6",w:0.20},{id:"p7",w:0.25},{val:vocabAvg,w:0.10},{val:gauntletAvg,w:0.15}];
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
}`;

// ─────────────────────────────────────────────────────────────────────────
// Definition des remplacements
// ─────────────────────────────────────────────────────────────────────────
const EDITS = [
  // ===== TIER 1 — correctness (null casserait la logique) =====
  {
    tier: 1, label: 'R1  estimateTOEICScore (coeur)',
    find: OLD_FUNC, replace: NEW_FUNC,
    appliedMarker: 'CHANTIER-A v2 (2026-06-09)',
  },
  {
    tier: 1, label: 'R2  getEffectiveLeague — total null ne debloque pas Legende',
    find:
`  if(l.id==="legend"){
    var toeic=estimateTOEICScore(ms||{});
    if(toeic.total<400){
      var champ=LEAGUES.find(function(lg){return lg.id==="champion";});
      return Object.assign({},champ||l,{locked:true,lockedScore:toeic.total});
    }
  }`,
    replace:
`  if(l.id==="legend"){
    var toeic=estimateTOEICScore(ms||{});
    // CHANTIER-A : total peut etre null (non estimable / partiel). null<400 vaut
    // false en JS -> debloquerait Legende a tort. On lock tant qu'aucune preuve >=400.
    if(toeic.total===null){
      var champN=LEAGUES.find(function(lg){return lg.id==="champion";});
      return Object.assign({},champN||l,{locked:true,lockedScore:null,lockReason:"need_estimation"});
    }
    if(toeic.total<400){
      var champ=LEAGUES.find(function(lg){return lg.id==="champion";});
      return Object.assign({},champ||l,{locked:true,lockedScore:toeic.total});
    }
  }`,
    appliedMarker: 'lockReason:"need_estimation"',
  },
  {
    tier: 1, label: 'R3  TeacherDash buckets — init + sNA',
    find: `  var buckets={s0:0,s400:0,s500:0,s600:0,s700:0,s800:0};`,
    replace: `  var buckets={s0:0,s400:0,s500:0,s600:0,s700:0,s800:0,sNA:0}; // CHANTIER-A : sNA = non estimables`,
    appliedMarker: 'sNA:0}; // CHANTIER-A',
  },
  {
    tier: 1, label: 'R4  TeacherDash buckets — comptage null',
    find:
`    var t=estimateTOEICScore(s.module_scores||{}).total;
    if(t<400)buckets.s0++;`,
    replace:
`    var t=estimateTOEICScore(s.module_scores||{}).total;
    if(t===null){buckets.sNA++;}
    else if(t<400)buckets.s0++;`,
    appliedMarker: 'buckets.sNA++;',
  },
  {
    tier: 1, label: 'R5  TeacherDash buckets — denominateur exclut sNA',
    find: `            var tot=Object.keys(buckets).reduce(function(a,k){return a+buckets[k];},0);var pct=tot>0?Math.round(buckets[b.k]/tot*100):0;`,
    replace: `            var tot=Object.keys(buckets).reduce(function(a,k){return k==="sNA"?a:a+buckets[k];},0);var pct=tot>0?Math.round(buckets[b.k]/tot*100):0;`,
    appliedMarker: 'return k==="sNA"?a:a+buckets[k];',
  },
  {
    tier: 1, label: 'R6  TeacherDash buckets — ligne "Non estime"',
    find:
`              <div style={{width:60,fontSize:11,fontWeight:700,textAlign:"right"}}>{buckets[b.k]} ({pct}%)</div>
            </div>);
          })}
        </div>
      </div>`,
    replace:
`              <div style={{width:60,fontSize:11,fontWeight:700,textAlign:"right"}}>{buckets[b.k]} ({pct}%)</div>
            </div>);
          })}
          {buckets.sNA>0&&<div style={{marginTop:8,paddingTop:8,borderTop:"1px dashed #ddd",fontSize:11,color:"#888",fontStyle:"italic"}}>{"Non estim\\u00e9 (donn\\u00e9es insuffisantes) : "+buckets.sNA+" \\u00e9l\\u00e8ve"+(buckets.sNA>1?"s":"")}</div>}
        </div>
      </div>`,
    appliedMarker: 'Non estim\\u00e9 (donn\\u00e9es insuffisantes)',
  },
  {
    tier: 1, label: 'R7  League Progress — gain null-safe',
    find: `        var gain=assessedQ>=50?(currentToeic-baseline):null;`,
    replace: `        var gain=(assessedQ>=50&&currentToeic!==null)?(currentToeic-baseline):null;`,
    appliedMarker: '(assessedQ>=50&&currentToeic!==null)',
  },
  {
    tier: 1, label: 'R8  League Progress — tri currentToeic null-safe',
    find: `        return b.currentToeic-a.currentToeic;`,
    replace: `        return (b.currentToeic||0)-(a.currentToeic||0);`,
    appliedMarker: 'return (b.currentToeic||0)-(a.currentToeic||0);',
  },
  {
    tier: 1, label: 'R9  Chest weekly_toeic — garde null avant delta',
    find: `      if(currentToeic-prevToeic>=25){`,
    replace: `      if(currentToeic!==null&&prevToeic!==null&&currentToeic-prevToeic>=25){`,
    appliedMarker: 'if(currentToeic!==null&&prevToeic!==null&&currentToeic-prevToeic>=25)',
  },
  {
    tier: 1, label: 'R10 Roster sort "toeic" — null en bas',
    find: `            if(sortBy==="toeic"){return estimateTOEIC(b).total-estimateTOEIC(a).total;}`,
    replace: `            if(sortBy==="toeic"){return (estimateTOEIC(b).total||-1)-(estimateTOEIC(a).total||-1);}`,
    appliedMarker: '(estimateTOEIC(b).total||-1)',
  },

  // ===== TIER 2 — affichages mandates par le brief =====
  {
    tier: 2, label: 'R11 Export CSV — "non estime" si null',
    find: `        na(toeic.total),na(toeic.listening),na(toeic.reading),`,
    replace: `        toeic.total===null?"non estim\\u00e9":na(toeic.total),toeic.listening===null?"non estim\\u00e9":na(toeic.listening),toeic.reading===null?"non estim\\u00e9":na(toeic.reading),`,
    appliedMarker: `toeic.total===null?"non estim\\u00e9":na(toeic.total)`,
  },
  {
    tier: 2, label: 'R12 Profil eleve — vars NA + reste avant seuil',
    find: `  var toeicCol=toeic.total>=750?"var(--green)":toeic.total>=500?"var(--orange)":toeic.total>200?"var(--red)":"var(--t3)";`,
    replace:
`  var toeicCol=toeic.total>=750?"var(--green)":toeic.total>=500?"var(--orange)":toeic.total>200?"var(--red)":"var(--t3)";
  // CHANTIER-A : etat non estimable / partiel pour la carte score.
  var toeicNA=toeic.total===null;
  var toeicRemain=null;
  if(toeic.estimable===false&&toeic.evidence){
    var gapR=80-(toeic.evidence.readingQ||0),gapL=40-(toeic.evidence.listeningQ||0);
    var gaps=[gapR,gapL].filter(function(g){return g>0;});
    toeicRemain=gaps.length?Math.min.apply(null,gaps):null;
  }`,
    appliedMarker: 'var toeicNA=toeic.total===null;',
  },
  {
    tier: 2, label: 'R13 Profil eleve — affichage total + sous-textes',
    find:
`            <div className="out" style={{fontWeight:900,fontSize:36,color:toeicCol,lineHeight:1}}>
              {toeic.total}<span style={{fontSize:14,color:"var(--t3)",fontWeight:400}}>/990</span>
            </div>
            {toeic.total<=200&&<div style={{fontSize:10,color:"var(--t3)",marginTop:4}}>{"Complete more modules to refine your score"}</div>}`,
    replace:
`            <div className="out" style={{fontWeight:900,fontSize:36,color:toeicCol,lineHeight:1}}>
              {toeicNA?<span style={{color:"var(--t3)"}}>{"\\u2014"}</span>:<span>{toeic.total}<span style={{fontSize:14,color:"var(--t3)",fontWeight:400}}>/990</span></span>}
            </div>
            {toeic.estimable===false&&<div style={{fontSize:10,color:"var(--t3)",marginTop:4}}>{toeicRemain!==null?("Estimation available after ~"+toeicRemain+" more questions or a Mock test."):"Estimation available after a Mock test or more training."}</div>}
            {toeic.estimable==="partial"&&<div style={{fontSize:10,color:"var(--t3)",marginTop:4}}>{"Total score available after activity in the other section."}</div>}
            {toeic.estimable===true&&toeic.total<=200&&<div style={{fontSize:10,color:"var(--t3)",marginTop:4}}>{"Complete more modules to refine your score"}</div>}`,
    appliedMarker: 'Estimation available after ~',
  },
  {
    tier: 2, label: 'R14 Profil eleve — sections L/R null-safe',
    find:
`              <div style={{textAlign:"center"}}><div className="out" style={{fontWeight:700,fontSize:18,color:"var(--cyan)"}}>{toeic.listening}</div><div style={{fontSize:9,color:"var(--t3)"}}>Listening</div></div>
              <div style={{textAlign:"center"}}><div className="out" style={{fontWeight:700,fontSize:18,color:"var(--purple)"}}>{toeic.reading}</div><div style={{fontSize:9,color:"var(--t3)"}}>Reading</div></div>`,
    replace:
`              <div style={{textAlign:"center"}}><div className="out" style={{fontWeight:700,fontSize:18,color:"var(--cyan)"}}>{toeic.listening!==null?toeic.listening:"\\u2014"}</div><div style={{fontSize:9,color:"var(--t3)"}}>Listening</div></div>
              <div style={{textAlign:"center"}}><div className="out" style={{fontWeight:700,fontSize:18,color:"var(--purple)"}}>{toeic.reading!==null?toeic.reading:"\\u2014"}</div><div style={{fontSize:9,color:"var(--t3)"}}>Reading</div></div>`,
    appliedMarker: 'fontSize:18,color:"var(--cyan)"}}>{toeic.listening!==null',
  },

  // ===== TIER 3 — polish d'affichage (blanc -> tiret) =====
  {
    tier: 3, label: 'R15 MentorGoalCard — carte cold-state si non estimable',
    find:
`  // ── View mode : progress + ETA. Whole card is clickable → enter edit. ──
  var current=estimateTOEICScore(u.moduleScores||{}).total;
  var target=u.targetToeic;`,
    replace:
`  // ── View mode : progress + ETA. Whole card is clickable → enter edit. ──
  var current=estimateTOEICScore(u.moduleScores||{}).total;
  var target=u.targetToeic;
  // CHANTIER-A : pas d'estimation -> pas de tracking, carte sobre (toujours editable).
  if(current===null){
    return(<div className="crd" onClick={function(){setEditing(true);}}
      style={{marginBottom:16,padding:"14px 16px",background:"linear-gradient(135deg,rgba(139,92,246,.08),rgba(var(--cx),.04))",border:"1px solid rgba(139,92,246,.25)",cursor:"pointer"}}>
      <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:6}}>
        <GIcon name="path-distance" size={18} color="var(--purple)"/>
        <div className="out" style={{fontWeight:800,fontSize:13,color:"var(--purple)"}}>{"Goal: "+target+" TOEIC"}</div>
      </div>
      <div style={{fontSize:12,color:"var(--t2)",lineHeight:1.5}}>{"Your TOEIC estimate isn't available yet — complete more modules or a Mock test to start tracking progress toward your goal."}</div>
    </div>);
  }`,
    appliedMarker: "Your TOEIC estimate isn't available yet",
  },
  {
    tier: 3, label: 'R16 MentorGoalCard — series filtre les snapshots null',
    find: `  var series=(snaps||[]).slice().reverse().map(function(s){return{toeic:estimateTOEICScore(s.module_scores_snapshot||{}).total};});`,
    replace: `  var series=(snaps||[]).slice().reverse().map(function(s){return{toeic:estimateTOEICScore(s.module_scores_snapshot||{}).total};}).filter(function(x){return x.toeic!==null;});`,
    appliedMarker: '.filter(function(x){return x.toeic!==null;});',
  },
  {
    tier: 3, label: 'R17 MentorMap — hotspot "Camp" null-safe (x2)',
    all: true,
    find: `     value:current+" TOEIC",`,
    replace: `     value:(current!==null?current+" TOEIC":"\\u2014 TOEIC"),`,
    appliedMarker: `value:(current!==null?current+" TOEIC"`,
  },
  {
    tier: 3, label: 'R18 MentorMap — sheet "Your Camp" null-safe',
    find: `        <div className="out" style={{fontSize:30,fontWeight:900,color:"var(--cyan)"}}>{estimateTOEICScore(u.moduleScores||{}).total}</div>`,
    replace: `        <div className="out" style={{fontSize:30,fontWeight:900,color:"var(--cyan)"}}>{(function(){var tt=estimateTOEICScore(u.moduleScores||{}).total;return tt!==null?tt:"\\u2014";})()}</div>`,
    appliedMarker: 'var tt=estimateTOEICScore(u.moduleScores||{}).total;return tt!==null?tt',
  },
  {
    tier: 3, label: 'R19 TeacherDash detail + roster — toeicCol null-safe (x2)',
    all: true,
    find: `var toeicCol=toeic.total>=750?"var(--green)":toeic.total>=500?"var(--orange)":"var(--red)";`,
    replace: `var toeicCol=toeic.total===null?"var(--t3)":toeic.total>=750?"var(--green)":toeic.total>=500?"var(--orange)":"var(--red)";`,
    appliedMarker: 'var toeicCol=toeic.total===null?"var(--t3)":toeic.total>=750',
  },
  {
    tier: 3, label: 'R20 TeacherDash detail — total /990 null-safe',
    find: `color:toeicCol,lineHeight:1}}>{toeic.total}<span style={{fontSize:13,color:"var(--t3)",fontWeight:400}}>/990</span>`,
    replace: `color:toeicCol,lineHeight:1}}>{toeic.total!==null?toeic.total:"\\u2014"}<span style={{fontSize:13,color:"var(--t3)",fontWeight:400}}>/990</span>`,
    appliedMarker: '>{toeic.total!==null?toeic.total:"\\u2014"}<span style={{fontSize:13,',
  },
  {
    tier: 3, label: 'R21 TeacherDash detail — L/R null-safe',
    find:
`                  <div className="out" style={{fontWeight:700,fontSize:14,color:"var(--cyan)"}}>{toeic.listening}</div>`,
    replace:
`                  <div className="out" style={{fontWeight:700,fontSize:14,color:"var(--cyan)"}}>{toeic.listening!==null?toeic.listening:"\\u2014"}</div>`,
    appliedMarker: 'fontSize:14,color:"var(--cyan)"}}>{toeic.listening!==null',
  },
  {
    tier: 3, label: 'R22 TeacherDash detail — Reading null-safe',
    find:
`                  <div className="out" style={{fontWeight:700,fontSize:14,color:"var(--purple)"}}>{toeic.reading}</div>`,
    replace:
`                  <div className="out" style={{fontWeight:700,fontSize:14,color:"var(--purple)"}}>{toeic.reading!==null?toeic.reading:"\\u2014"}</div>`,
    appliedMarker: 'fontSize:14,color:"var(--purple)"}}>{toeic.reading!==null',
  },
  {
    tier: 3, label: 'R23 Roster — total null-safe',
    find: `                  <div className="out" style={{fontWeight:800,fontSize:15,color:toeicCol}}>{toeic.total}</div>`,
    replace: `                  <div className="out" style={{fontWeight:800,fontSize:15,color:toeicCol}}>{toeic.total!==null?toeic.total:"\\u2014"}</div>`,
    appliedMarker: 'fontSize:15,color:toeicCol}}>{toeic.total!==null?toeic.total',
  },
  {
    tier: 3, label: 'R24 League Progress — affichage currentToeic null-safe',
    find: `                  {pl.baseline} → {pl.currentToeic} pts TOEIC`,
    replace: `                  {pl.baseline} → {pl.currentToeic!==null?pl.currentToeic:"\\u2014"} pts TOEIC`,
    appliedMarker: '{pl.currentToeic!==null?pl.currentToeic:"\\u2014"} pts TOEIC',
  },
  {
    tier: 1, label: 'R25 BUILD_ID bump (regle durcie #6)',
    find: `var BUILD_ID="2026-06-02-shop-p4";`,
    replace: `var BUILD_ID="2026-06-09-toeic-estimation-v2";`,
    appliedMarker: `var BUILD_ID="2026-06-09-toeic-estimation-v2";`,
  },
  {
    tier: 2, label: 'R26 Badge Legende lockee — message si lockedScore null',
    find: `>Legend tier: reach TOEIC {lg.lockedScore}</span>}`,
    replace: `>{lg.lockReason==="need_estimation"?"Legend tier: complete more modules or a Mock test":("Legend tier: reach TOEIC "+lg.lockedScore)}</span>}`,
    appliedMarker: `lg.lockReason==="need_estimation"?"Legend tier: complete more modules or a Mock test"`,
  },
];

// ─────────────────────────────────────────────────────────────────────────
// Application
// ─────────────────────────────────────────────────────────────────────────
function countOccurrences(hay, needle) {
  let n = 0, i = 0;
  while ((i = hay.indexOf(needle, i)) !== -1) { n++; i += needle.length; }
  return n;
}
function replaceAll(hay, needle, repl) { return hay.split(needle).join(repl); }

function main() {
  let src = fs.readFileSync(SRC, 'utf8');
  // App.jsx est en CRLF sous Windows ; nos templates utilisent \n. On convertit
  // les ancres a l'EOL du fichier pour que les finds multi-lignes matchent.
  const EOL = src.indexOf('\r\n') !== -1 ? '\r\n' : '\n';
  const toEol = s => EOL === '\n' ? s : s.split('\n').join(EOL);
  const log = [];
  let missing = 0, applied = 0, alreadyDone = 0;

  for (const raw of EDITS) {
    const e = { ...raw, find: toEol(raw.find), replace: toEol(raw.replace) };
    const done = e.appliedMarker && src.indexOf(e.appliedMarker) !== -1;
    const present = src.indexOf(e.find) !== -1;
    // Marqueur d'abord : les edits "append apres l'ancre" (R12/R15) gardent le
    // find dans leur replace -> sans cette priorite, une 2e passe dupliquerait.
    if (done) {
      log.push(`  [T${e.tier}] deja fait — ${e.label}`);
      alreadyDone++;
    } else if (present) {
      const occ = countOccurrences(src, e.find);
      if (!e.all && occ > 1) {
        log.push(`  [T${e.tier}] AMBIGU (${occ} occurrences) — ${e.label}  >> ANCRE NON UNIQUE, ignore`);
        missing++;
        continue;
      }
      src = e.all ? replaceAll(src, e.find, e.replace) : src.replace(e.find, e.replace);
      log.push(`  [T${e.tier}] OK${e.all ? ' x' + occ : ''}     — ${e.label}`);
      applied++;
    } else {
      log.push(`  [T${e.tier}] !! ANCRE INTROUVABLE — ${e.label}`);
      missing++;
    }
  }

  fs.writeFileSync(OUT, src, 'utf8');

  console.log('\n=== Patch Chantier A — estimateTOEICScore ===\n');
  console.log(log.join('\n'));
  console.log(`\n  Applique: ${applied} | deja fait: ${alreadyDone} | introuvable/ambigu: ${missing}`);
  console.log(`\n  -> ecrit : ${OUT}`);
  if (missing > 0) {
    console.log('\n  ⚠️  AU MOINS UNE ANCRE MANQUE OU EST AMBIGUE. Ne pas renommer en App.jsx avant de corriger.');
    process.exitCode = 1;
  } else {
    console.log('\n  Toutes les ancres ont ete traitees. Verifier App_patched.jsx puis renommer en App.jsx.');
  }
}

main();
