// Extrait de src/App.jsx le 2026-09-15 (refactor split-app, REFACTOR_PLAN.md). Code déplacé tel quel.

// ─── MOCK TEST HELPERS ───
export function estimateToeic(raw,total){
  var pct=raw/total;
  // Piecewise curve: harder to gain points at the top, like real TOEIC
  var est;
  if(pct<0.4)est=5+pct*2.5*155;      // 5-160
  else if(pct<0.7)est=160+(pct-0.4)/0.3*180; // 160-340
  else if(pct<0.9)est=340+(pct-0.7)/0.2*110; // 340-450
  else est=450+(pct-0.9)/0.1*45;              // 450-495
  est=Math.round(est/5)*5;
  return Math.max(5,Math.min(495,est));
}
// ─── HOME ───
// ═══════════════════════════════════════════════════════════════════════
// Personalization Phase 1 commit 4 (2026-05-05) — Today's Focus + reco
// Maps a module id to a "part bucket" (p1-p7 + vocab), used by:
//   - lib/xp.js → applies the +25% Focus boost when modId maps to the part of today's
//     « stake » quest (lib/planner.js, since 2026-09-18 ; computeTodayFocus is gone).
//   - lib/learnerModel.js → partSeries, the dated series behind the plan of the day.
// Modules that don't fit a single part (mocks, boss, daily, games) are not
// mapped and therefore not boosted — those have their own incentive layers.
// ═══════════════════════════════════════════════════════════════════════
// ═══════════════════════════════════════════════════════════════════════
// MODULE_TOEIC_MAP — SOURCE UNIQUE DE VÉRITÉ : module id → câblage TOEIC.
//   part    : bucket radar Mentor / Today's Focus (p1-p7 | vocab | null).
//   section : section de l'estimateur (listening | reading | null).
//   score   : compte AUJOURD'HUI dans estimateTOEICScore (jeu Chantier A).
// Chantier B Phase 1 (2026-06-10) : consommée par partOfModule + partAccuracies
// pour tuer les mismatches falsefr/pvdojo/ablitz (la route enregistre "falsefr"
// et "pvdojo", mais l'ancien partOfModule cherchait "falsefriends" et ignorait
// pvdojo/ablitz → ces modules étaient invisibles au Mentor et au boost Focus).
// Les listes pondérées de l'estimateur rejoindront cette map en Phase 2
// (élargissement + recalibration). NE PAS dupliquer ce mapping ailleurs.
// ═══════════════════════════════════════════════════════════════════════
export var MODULE_TOEIC_MAP={
  lisP1:{part:"p1",section:"listening",score:true},
  lisP2:{part:"p2",section:"listening",score:true},
  lisP3:{part:"p3",section:"listening",score:true},
  lisP4:{part:"p4",section:"listening",score:true},
  ablitz:{part:"p2",section:"listening",score:true},   // FIX : était absent de partOfModule
  p6:{part:"p6",section:"reading",score:true},
  p7:{part:"p7",section:"reading",score:true},
  drill:{part:"p5",section:"reading",score:true},
  wordfam:{part:"p5",section:"reading",score:true},
  connsort:{part:"p5",section:"reading",score:true},
  prepdrill:{part:"p5",section:"reading",score:true},
  gerinf:{part:"p5",section:"reading",score:true},
  falsefr:{part:"p5",section:"reading",score:true},     // FIX : était "falsefriends"
  pvdojo:{part:"p5",section:"reading",score:true},      // FIX : était absent
  sbuild:{part:"p5",section:"reading",score:true},
  gauntlet_irregular:{part:"p5",section:"reading",score:true},
  gauntlet_tense:{part:"p5",section:"reading",score:true},
  gauntlet_passive:{part:"p5",section:"reading",score:true},
  gauntlet_relative:{part:"p5",section:"reading",score:true},
  // Donnent de l'XP + vus par le Mentor, PAS encore dans le score (Phase 2) :
  bforge:{part:"p5",section:"reading",score:false},
  modals_match:{part:"p5",section:"reading",score:false},
  modals_sort:{part:"p5",section:"reading",score:false},
  tavern:{part:"vocab",section:"reading",score:false},
  csess:{part:"vocab",section:null,score:false},        // flashcards : 0 XP, jamais dans le score
  cdom:{part:"vocab",section:null,score:false},
  phrasalpicker:{part:"vocab",section:null,score:false},
  clue:{part:null,section:null,score:false},
  // Mimic Hunt : compte dans le Reading (poids support .04) mais part:null — la reformulation
  // sert P3/P4/P7 à la fois, la ranger dans p7 fausserait le diagnostic du Mentor sur la Part 7.
  mimic:{part:null,section:"reading",score:true},
  // Mimic Hunt à l'oreille (2026-09-19) : la source s'entend, le piège est celui des Parts 3 et 4. Listening,
  // poids support .04 (comme la lecture en Reading), part:null pour la même raison.
  mimic_listen:{part:null,section:"listening",score:true},
  traps:{part:null,section:null,score:false},
  stratquiz:{part:null,section:null,score:false},
  timesim:{part:null,section:null,score:false}
};
export function partOfModule(modId){
  if(!modId)return null;
  var e=MODULE_TOEIC_MAP[modId];
  return e?e.part:null;
}
// Per-part accuracy + sample size from u.moduleScores. Returns object keyed by part.
// Phase D (scan-v2): when a part has no real moduleScores data and bsParts has a Battle Scan
// baseline for it, fall back to the scan accuracy with synthetic n=5 + source:"scan" so callers
// can distinguish baseline-from-scan vs measured. This bootstraps Mentor / TodayFocus / NextStepReco
// from day 1 of the post-onboarding journey.
export function partAccuracies(ms,bsParts){
  function get(id){var d=ms&&ms[id];return d&&d.total?{acc:d.correct/d.total,n:d.total,source:"trained"}:null;}
  function fallback(partId){if(!bsParts||typeof bsParts[partId]!=="number")return null;return{acc:bsParts[partId],n:5,source:"scan"};}
  function getOrFallback(modId,partId){return get(modId)||fallback(partId);}
  function avg(arr){var f=arr.filter(function(x){return x!==null;});if(f.length===0)return null;var sa=0,sn=0;f.forEach(function(x){sa+=x.acc*x.n;sn+=x.n;});return{acc:sa/sn,n:sn};}
  // Chantier B : dérivés de MODULE_TOEIC_MAP (source unique) — falsefr + pvdojo
  // entrent désormais dans le radar p5, qui les ignorait à cause du mismatch d'id.
  var p5Mods=Object.keys(MODULE_TOEIC_MAP).filter(function(k){return MODULE_TOEIC_MAP[k].part==="p5";});
  var vocabMods=Object.keys(MODULE_TOEIC_MAP).filter(function(k){return MODULE_TOEIC_MAP[k].part==="vocab";});
  return{
    p1:getOrFallback("lisP1","p1"),p2:getOrFallback("lisP2","p2"),p3:getOrFallback("lisP3","p3"),p4:getOrFallback("lisP4","p4"),
    p5:avg(p5Mods.map(get)),p6:getOrFallback("p6","p6"),p7:getOrFallback("p7","p7"),vocab:avg(vocabMods.map(get))
  };
}
// Helper: get the scan parts baseline from a user. Returns null if no scan ran.
export function bsScanParts(u){return u&&u.battleScan&&u.battleScan.subScores&&u.battleScan.subScores.parts||null;}
// ─── PROFILE ───
// ── Battle Scan → TOEIC baseline ──
// Converts the 20-Q diagnostic Battle Scan into an approximate initial
// TOEIC score. Used by the League "Progrès" tab to anchor each student's
// progression baseline to their TRUE starting point (not the first weekly
// snapshot that happened to fire after onboarding). A student who skipped
// the scan, or who existed before the scan system, falls back to 200 —
// same as a brand-new student with empty moduleScores.
//
// Linear mapping total(0-20) → TOEIC(200-600). The scan only samples 20
// items so we cap the high end at 600 to reflect its diagnostic nature:
// a genuinely strong starter will exceed this once real module training
// bumps their currentToeic up.
export function battleScanToToeic(bs){
  if(!bs)return 200;
  // Defense: some older Supabase clients return jsonb as a string. Try to
  // parse before giving up.
  if(typeof bs==="string"){
    try{bs=JSON.parse(bs);}catch(e){console.warn("[battleScan] parse failed:",e&&e.message);return 200;}
  }
  // Fallback: if total is missing but scores object is there, recompute it.
  // Older scan payloads in the wild may lack a top-level total.
  var t=null;
  if(typeof bs.total==="number")t=bs.total;
  else if(bs.scores&&typeof bs.scores==="object"){
    var s=bs.scores;
    var g=+s.grammar||0,v=+s.vocab||0,r=+s.reading||0,l=+s.listening||0;
    t=g+v+r+l;
  }
  if(t===null||isNaN(t))return 200;
  t=Math.max(0,Math.min(20,t));
  return Math.round(200+(t/20)*400);
}
// ── TOEIC Score Estimator (global — used by Profile + TeacherDash) ──
export function estimateTOEICScore(ms){
  // CHANTIER-A v2 (2026-06-09) — refonte calibree sur la cohorte IDRAC T2.
  // Changements clefs vs V1 :
  //  - Normalisation PROPORTIONNELLE des sections (wSum/wTot) au lieu du hack
  //    "wSum+=(1-wTot)*0.01" qui ecrasait le Reading des profils a couverture
  //    partielle (defaut #2 "Reading 8/495"). NE PAS revenir en arriere.
  //  - Gating A.1 : retourne {total:null,estimable:false|"partial"} tant que la
  //    preuve est insuffisante, au lieu d'un cold-start trompeur a 200.
  //  - Assiette Reading elargie aux modules transverses (A.2).
  //  - A.5 ponderation par confiance (volume de questions par module).
  //    /!\ Cette version A.5 etait INOPERANTE : le facteur se simplifiait dans
  //    wSum/wTot. Remplacee le 2026-09-15 par une retenue bayesienne (voir plus bas).
  //  - Bonus mock ASYMETRIQUE (Kamel-safe) : recompense la sur-perf mock,
  //    ne penalise jamais une mauvaise perf mock.
  //  - A.4 ancrage Boss (60% du score Boss) RETIRE le 2026-09-24 : jamais appele depuis juin, jamais
  //    valide sur des Boss reels. Le Boss compte deja dans le groupe mock (deblocage + bonus additif).
  // CHANTIER-B (2026-06-10) — principe "tout ce qui fait de l'XP bouge le score" :
  //  - Modules-support versés dans le Reading en POIDS FAIBLE (garde-fou validité :
  //    le backbone Part5/6/7+Gauntlet reste dominant) : tavern, clue, traps,
  //    modals (moy 2), bforge, timesim, stratquiz, daily.
  //  - Endless Arena rejoint le groupe mock (full TOEIC : débloque + bonus).
  //  - Exceptions assumées hors-score : Flashcards (0 XP) + jeux d'arcade (pas de précision).
  ms=ms||{};
  function rec(id){var d=ms[id];if(!d||!d.total)return null;return{acc:d.correct/d.total,q:d.total};}
  // A.5 v2 (2026-09-15) — RETENUE BAYESIENNE, en remplacement de confW().
  // confW ponderait les poids par le volume : ew = w*confW(q), puis la section
  // renvoyait wSum/wTot. Le facteur apparaissait donc au numerateur ET au
  // denominateur : il se SIMPLIFIAIT. Consequences mesurees avant correctif :
  //   - 4 questions justes sur 4 donnaient le meme score que 300 questions a 100% ;
  //   - un seul module sur les 23 du Reading suffisait a afficher 495/495.
  // Desormais la masse de preuve ne disparait plus : elle est confrontee a une
  // masse de prior. Peu de couverture ou peu de volume -> le score est tire vers
  // PRIOR_ACC ; couverture large et volume eleve -> le prior s efface.
  // Signale par un etudiant iabd2627 le 2026-09-15 (estimation a 990 sans etre
  // a 100% partout).
  var EVID_HALF=30;    // questions donnant une demi-confiance sur un module
  var PRIOR_K=0.12;    // masse du prior, exprimee en poids de section
  var PRIOR_ACC=0.60;  // precision supposee d un profil sans preuve
  var MOCK_BONUS_MAX=40; // plafond du bonus mock, EN POINTS
  function evidW(q){return q/(q+EVID_HALF);}
  function sumQ(ids){var s=0;ids.forEach(function(id){var r=rec(id);if(r)s+=r.q;});return s;}
  var READING_MODS=["drill","p6","p7","wordfam","connsort","prepdrill","gerinf","falsefr","pvdojo","sbuild","gauntlet_irregular","gauntlet_tense","gauntlet_passive","gauntlet_relative","tavern","clue","traps","modals_match","modals_sort","bforge","timesim","stratquiz","daily","mimic"];
  var LIS_MODS=["lisP1","lisP2","lisP3","lisP4","ablitz","mimic_listen"];
  var readingQ=sumQ(READING_MODS),listeningQ=sumQ(LIS_MODS);
  var m1=rec("mock1"),m2=rec("mock2"),m3=rec("mock3"),mbR=rec("boss"),meR=rec("endless");
  // Mock 3 (même format que 1 et 2, demi-test Reading) était oublié jusqu'au 2026-09-24 : il ne débloquait
  // pas l'estimation et ne donnait pas de bonus.
  var mocksList=[m1,m2,m3,mbR,meR].filter(Boolean); // CHANTIER-B : Endless = full TOEIC, compte comme un mock
  var hasMock=mocksList.length>0;
  var mocksDone=mocksList.length;
  var evidence={listeningQ:listeningQ,readingQ:readingQ,mocksDone:mocksDone};
  // A.1 seuils (decision produit — ne pas modifier sans validation) : 80 Reading, 40 Listening, ou >=1 mock.
  var readingOK=readingQ>=80||hasMock;
  var listeningOK=listeningQ>=40||hasMock;
  // Sections, normalisation proportionnelle (A.2/A.3).
  function meanRec(ids){var rs=ids.map(rec).filter(Boolean);if(!rs.length)return null;return{acc:rs.reduce(function(a,b){return a+b.acc;},0)/rs.length,q:rs.reduce(function(a,b){return a+b.q;},0)};}
  var gauntAvg=meanRec(["gauntlet_irregular","gauntlet_tense","gauntlet_passive","gauntlet_relative"]);
  var modalsAvg=meanRec(["modals_match","modals_sort"]);
  // CHANTIER-B : backbone (poids V2) DOMINANT + modules-support en poids FAIBLE.
  var rdParts=[{id:"drill",w:0.22},{id:"p6",w:0.15},{id:"p7",w:0.18},{id:"wordfam",w:0.06},{id:"connsort",w:0.06},{id:"prepdrill",w:0.05},{id:"gerinf",w:0.05},{id:"falsefr",w:0.04},{id:"pvdojo",w:0.04},{id:"sbuild",w:0.04},{val:gauntAvg,w:0.11},{id:"tavern",w:0.05},{id:"clue",w:0.04},{id:"traps",w:0.04},{val:modalsAvg,w:0.04},{id:"bforge",w:0.03},{id:"timesim",w:0.03},{id:"stratquiz",w:0.02},{id:"daily",w:0.03},{id:"mimic",w:0.04}];
  var lisParts=[{id:"lisP1",w:0.18},{id:"lisP2",w:0.27},{id:"lisP3",w:0.25},{id:"lisP4",w:0.22},{id:"ablitz",w:0.08},{id:"mimic_listen",w:0.04}];
  function section(parts){
    var wSum=0,wTot=0,has=false;
    parts.forEach(function(p){var r=p.val!==undefined?p.val:rec(p.id);if(r){var ew=p.w*evidW(r.q);wSum+=r.acc*ew;wTot+=ew;has=true;}});
    if(!has)return null;
    // NE PAS revenir a wSum/wTot : c est ce qui rendait la ponderation par
    // confiance inoperante (elle se simplifie). Le +PRIOR_K est ce qui fait
    // que la couverture et le volume comptent vraiment.
    return (wSum+PRIOR_K*PRIOR_ACC)/(wTot+PRIOR_K);
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
    // Bonus mock ADDITIF plafonne en points. Il etait multiplicatif (+20% max)
    // applique au total : +18% sur 843 donnait 995, donc 990 apres plafonnement.
    // Autrement dit 82,5% de precision suffisaient a afficher un 990. En points,
    // la sur-performance mock reste recompensee sans jamais saturer l echelle.
    // Toujours ASYMETRIQUE (Kamel-safe) : une mauvaise perf mock ne retire rien.
    var bonusPts=0;mocksList.forEach(function(m){if(m.acc>0.60)bonusPts+=(m.acc-0.60)*100;});
    bonusPts=Math.min(MOCK_BONUS_MAX,bonusPts);
    if(bonusPts>0)total=total+bonusPts;
    total=Math.max(200,Math.min(990,total));
    return{total:Math.round(total/5)*5,listening:lisScore,reading:rdScore,estimable:true,evidence:evidence};
  }
  // A.1 — cas partiel : une seule section calculable.
  return{total:null,listening:(listeningOK&&lisScore!==null)?lisScore:null,reading:(readingOK&&rdScore!==null)?rdScore:null,estimable:"partial",evidence:evidence};
}
