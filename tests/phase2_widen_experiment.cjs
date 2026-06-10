/*
 * Chantier B Phase 2 — expérience : estimateur ÉLARGI vs V2 actuelle.
 * Backbone V2 inchangé + modules-support en poids FAIBLE + Endless dans le
 * groupe mock (débloque + bonus). Testé contre la cohorte papier T2.
 *
 * node tests/phase2_widen_experiment.cjs
 */
'use strict';
const fs = require('fs');
const path = require('path');
const V = require('./validate_toeic_estimation.cjs');

const CSV = path.join(__dirname, 'data', 'toeic_arena_export_idrac2026_2026-06-10.csv');

function meanRec(ms, ids) {
  function rec(id){var d=ms[id];if(!d||!d.total)return null;return{acc:d.correct/d.total,q:d.total};}
  var rs = ids.map(rec).filter(Boolean);
  if (!rs.length) return null;
  return { acc: rs.reduce((a,b)=>a+b.acc,0)/rs.length, q: rs.reduce((a,b)=>a+b.q,0) };
}

// ── Estimateur ÉLARGI (futur prod V3) ──
function v3(ms, opts){
  ms=ms||{};opts=opts||{};
  function rec(id){var d=ms[id];if(!d||!d.total)return null;return{acc:d.correct/d.total,q:d.total};}
  function confW(q){if(q<10)return 0.3;if(q<30)return 0.6;if(q<100)return 0.85;return 1;}
  function sumQ(ids){var s=0;ids.forEach(function(id){var r=rec(id);if(r)s+=r.q;});return s;}
  var gaunt=meanRec(ms,["gauntlet_irregular","gauntlet_tense","gauntlet_passive","gauntlet_relative"]);
  var modals=meanRec(ms,["modals_match","modals_sort"]);
  // Backbone (poids V2) + support (poids faible).
  var rdParts=[
    {id:"drill",w:0.22},{id:"p6",w:0.15},{id:"p7",w:0.18},
    {id:"wordfam",w:0.06},{id:"connsort",w:0.06},{id:"prepdrill",w:0.05},{id:"gerinf",w:0.05},
    {id:"falsefr",w:0.04},{id:"pvdojo",w:0.04},{id:"sbuild",w:0.04},{val:gaunt,w:0.11},
    // support (Chantier B) — poids faibles, garde-fou validité :
    {id:"tavern",w:0.05},{id:"clue",w:0.04},{id:"traps",w:0.04},{val:modals,w:0.04},
    {id:"bforge",w:0.03},{id:"timesim",w:0.03},{id:"stratquiz",w:0.02},{id:"daily",w:0.03}
  ];
  var lisParts=[{id:"lisP1",w:0.18},{id:"lisP2",w:0.27},{id:"lisP3",w:0.25},{id:"lisP4",w:0.22},{id:"ablitz",w:0.08}];
  var READING_MODS=["drill","p6","p7","wordfam","connsort","prepdrill","gerinf","falsefr","pvdojo","sbuild","gauntlet_irregular","gauntlet_tense","gauntlet_passive","gauntlet_relative","tavern","clue","traps","modals_match","modals_sort","bforge","timesim","stratquiz","daily"];
  var LIS_MODS=["lisP1","lisP2","lisP3","lisP4","ablitz"];
  var readingQ=sumQ(READING_MODS),listeningQ=sumQ(LIS_MODS);
  var m1=rec("mock1"),m2=rec("mock2"),mb=rec("boss"),me=rec("endless");
  var bossToeic=(opts.bossToeic!=null&&isFinite(opts.bossToeic))?opts.bossToeic:null;
  var mocksList=[m1,m2,mb,me].filter(Boolean);
  var hasMock=mocksList.length>0||bossToeic!==null;
  var evidence={listeningQ:listeningQ,readingQ:readingQ,mocksDone:mocksList.length};
  var readingOK=readingQ>=80||hasMock;
  var listeningOK=listeningQ>=40||hasMock;
  function section(parts){var w=0,t=0,has=false;parts.forEach(function(p){var r=p.val!==undefined?p.val:rec(p.id);if(r){var ew=p.w*confW(r.q);w+=r.acc*ew;t+=ew;has=true;}});return has?w/t:null;}
  var rawLis=section(lisParts),rawRd=section(rdParts);
  var mockAcc=null;if(mocksList.length){var sa=0,qa=0;mocksList.forEach(function(m){sa+=m.acc*m.q;qa+=m.q;});mockAcc=qa?sa/qa:null;}
  if(hasMock&&mockAcc!==null){if(rawRd===null)rawRd=mockAcc;if(rawLis===null)rawLis=mockAcc;}
  var lisScore=rawLis!==null?Math.round(Math.max(5,Math.min(495,5+rawLis*490))):null;
  var rdScore=rawRd!==null?Math.round(Math.max(5,Math.min(495,5+rawRd*490))):null;
  if(!readingOK&&!listeningOK)return{total:null,listening:null,reading:null,estimable:false,evidence:evidence,reason:"insufficient_data"};
  var both=lisScore!==null&&rdScore!==null;
  if(readingOK&&listeningOK&&both){
    var total=lisScore+rdScore;var bonus=0;mocksList.forEach(function(m){if(m.acc>0.60)bonus+=(m.acc-0.60)*0.30;});bonus=Math.min(0.20,bonus);
    if(bonus>0)total=total*(1+bonus);
    if(bossToeic!==null)total=0.60*bossToeic+0.40*total;
    total=Math.max(200,Math.min(990,total));
    return{total:Math.round(total/5)*5,listening:lisScore,reading:rdScore,estimable:true,evidence:evidence};
  }
  return{total:null,listening:(listeningOK&&lisScore!==null)?lisScore:null,reading:(readingOK&&rdScore!==null)?rdScore:null,estimable:"partial",evidence:evidence};
}

const students = V.buildStudents(V.parseCSV(fs.readFileSync(CSV,'utf8')));

function counts(fn){var f=0,p=0,n=0;students.forEach(function(s){var e=fn(s.ms,{});if(e.estimable===true)f++;else if(e.estimable==="partial")p++;else n++;});return f+" estimables / "+p+" partiels / "+n+" non estimables";}
console.log('\n=== Répartition cohorte (66 élèves) ===');
console.log('  V2 actuel :', counts(function(ms){return V.newEstimate(ms,{},V.V2_CFG);}));
console.log('  V3 élargi :', counts(v3));

console.log('\n=== Cohorte papier T2 — V2 vs V3 ===');
console.log('Nom              Papier   V2      V3     L(v3) R(v3)  estimable(v3)');
console.log('-'.repeat(78));
var pairs=[];
Object.keys(V.PAPER_T2).forEach(function(key){
  var s=students.find(function(x){return V.norm(x.name)===key;});
  if(!s)return;
  var paper=V.PAPER_T2[key];
  var e2=V.newEstimate(s.ms,{},V.V2_CFG);
  var e3=v3(s.ms,{});
  console.log(s.name.padEnd(16)+String(paper).padStart(6)+String(e2.total==null?'—':e2.total).padStart(8)+String(e3.total==null?'—':e3.total).padStart(8)+String(e3.listening==null?'—':e3.listening).padStart(6)+String(e3.reading==null?'—':e3.reading).padStart(6)+'   '+e3.estimable);
  if(e3.total!=null)pairs.push([paper,e3.total]);
});
var p2pairs=[];Object.keys(V.PAPER_T2).forEach(function(key){var s=students.find(function(x){return V.norm(x.name)===key;});if(!s)return;var e2=V.newEstimate(s.ms,{},V.V2_CFG);if(e2.total!=null)p2pairs.push([V.PAPER_T2[key],e2.total]);});
console.log('\n  Corrélation V2 (n='+p2pairs.length+') : Pearson '+V.pearson(p2pairs.map(x=>x[0]),p2pairs.map(x=>x[1])).toFixed(3)+'  Spearman '+V.spearman(p2pairs.map(x=>x[0]),p2pairs.map(x=>x[1])).toFixed(3));
console.log('  Corrélation V3 (n='+pairs.length+') : Pearson '+V.pearson(pairs.map(x=>x[0]),pairs.map(x=>x[1])).toFixed(3)+'  Spearman '+V.spearman(pairs.map(x=>x[0]),pairs.map(x=>x[1])).toFixed(3));
