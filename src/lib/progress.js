// Extrait de src/App.jsx le 2026-09-15 (refactor split-app, REFACTOR_PLAN.md). Code déplacé tel quel.
import { QUESTIONS } from "../data/grammar.js";
import { srand, today } from "./util.js";

export function dailyQs(date,u){
  var seed=0;for(var i=0;i<date.length;i++)seed+=date.charCodeAt(i);

  // Seeded shuffle helper (deterministic per day)
  function seededPick(arr,s){
    var b=arr.slice();
    for(var i=b.length-1;i>0;i--){var j=Math.floor(srand(s+i)*(i+1));var t=b[i];b[i]=b[j];b[j]=t;}
    return b;
  }

  // Filter out questions seen in the last 30 days
  var recentIds={};
  if(u&&u.dailySeen){
    var cutoff=new Date();cutoff.setDate(cutoff.getDate()-30);
    var cutoffStr=cutoff.toISOString().slice(0,10);
    u.dailySeen.forEach(function(entry){if(entry.date>=cutoffStr)recentIds[entry.id]=true;});
  }

  // Group QUESTIONS by category, excluding recently seen
  var catMap={};
  QUESTIONS.forEach(function(q){if(!recentIds[q.id]){if(!catMap[q.cat])catMap[q.cat]=[];catMap[q.cat].push(q);}});
  // Fallback: if filtering empties a category, include all for that cat
  QUESTIONS.forEach(function(q){if(!catMap[q.cat]||catMap[q.cat].length===0){if(!catMap[q.cat])catMap[q.cat]=[];catMap[q.cat].push(q);}});
  var allCats=Object.keys(catMap);

  // Map specific modules to grammar categories for weakness detection
  var modToCat={
    "wordfam":"Word Families","connsort":"Connectors","prepdrill":"Prepositions",
    "gerinf":"Gerunds vs Infinitives","falsefr":"False Friends",
    "pvdojo":"Phrasal Verbs","csess":"Vocabulary"
  };

  // Score each category by weakness (lower = weaker = higher priority)
  var catScores={};
  allCats.forEach(function(cat){catScores[cat]={acc:0.5,total:0};});

  if(u&&u.moduleScores&&(u.stats.sessions||0)>=5){
    // 1) Use specific module scores where they map to a category
    Object.keys(modToCat).forEach(function(modId){
      var ms=u.moduleScores[modId];
      var cat=modToCat[modId];
      if(ms&&ms.total>0&&catScores[cat]){
        catScores[cat]={acc:ms.correct/ms.total,total:ms.total};
      }
    });

    // 2) Use overall drill/daily accuracy as proxy for categories without specific modules
    var drillAcc=null;
    ["drill","daily","timesim"].forEach(function(modId){
      var ms=u.moduleScores[modId];
      if(ms&&ms.total>=10){
        drillAcc=drillAcc!==null?((drillAcc+ms.correct/ms.total)/2):(ms.correct/ms.total);
      }
    });

    // Categories without a specific module get the drill average (or 0.5 default)
    allCats.forEach(function(cat){
      if(catScores[cat].total===0){
        catScores[cat].acc=drillAcc!==null?drillAcc:0.5;
      }
    });
  }

  // Sort categories: lowest accuracy first, then least practiced
  var ranked=allCats.map(function(cat){return{cat:cat,acc:catScores[cat].acc,total:catScores[cat].total};});
  ranked.sort(function(a,b){return a.acc===b.acc?a.total-b.total:a.acc-b.acc;});

  var picked=[];
  var usedCats={};

  // Pick 3 from the weakest categories (1 question per cat)
  for(var w=0;w<ranked.length&&picked.length<3;w++){
    var cat=ranked[w].cat;
    if(usedCats[cat])continue;
    var pool=seededPick(catMap[cat],seed+w*7);
    if(pool.length>0){picked.push(pool[0]);usedCats[cat]=true;}
  }

  // Pick 2 random from remaining categories (variety)
  var remainCats=seededPick(allCats.filter(function(c){return!usedCats[c];}),seed+99);
  for(var r=0;r<remainCats.length&&picked.length<5;r++){
    var cat2=remainCats[r];
    if(usedCats[cat2])continue;
    var pool2=seededPick(catMap[cat2],seed+50+r*13);
    if(pool2.length>0){picked.push(pool2[0]);usedCats[cat2]=true;}
  }

  // Bias: ensure PV or Vocab appears if neither was picked via weakness/random
  var hasNewCat=picked.some(function(q){return q.cat==="Phrasal Verbs"||q.cat==="Vocabulary";});
  if(!hasNewCat&&picked.length<5){
    var newCats=["Phrasal Verbs","Vocabulary"].filter(function(c){return catMap[c]&&catMap[c].length>0&&!usedCats[c];});
    if(newCats.length>0){
      var forceCat=newCats[Math.floor(srand(seed+777)*newCats.length)];
      var forcePool=seededPick(catMap[forceCat],seed+888);
      if(forcePool.length>0){picked.push(forcePool[0]);usedCats[forceCat]=true;}
    }
  }

  // Fallback: if still < 5, fill with unused questions
  if(picked.length<5){
    var usedIds={};picked.forEach(function(q){usedIds[q.id]=true;});
    var filler=seededPick(QUESTIONS.filter(function(q){return!usedIds[q.id];}),seed+200);
    while(picked.length<5&&filler.length>0)picked.push(filler.shift());
  }

  return seededPick(picked,seed+300);
}
export function srsUp(st,r){var e=st.ease||2.5,iv=st.interval||0;if(r===1){iv=1;e=Math.max(1.3,e-0.2);}else if(r===2){iv=Math.max(1,Math.ceil(iv*1.2));e=Math.max(1.3,e-0.15);}else if(r===3){iv=iv===0?1:Math.ceil(iv*e);}else{iv=iv===0?3:Math.ceil(iv*e*1.3);e+=0.15;}var nx=new Date();nx.setDate(nx.getDate()+iv);return{ease:e,interval:iv,nextReview:nx.toISOString().split("T")[0],correct:(st.correct||0)+(r>=3?1:0),total:(st.total||0)+1};}
export function dueCards(states,cards){var t=today(),due=[],nw=[];for(var i=0;i<cards.length;i++){var s=states[cards[i].id];if(!s)nw.push(cards[i]);else if(s.nextReview<=t)due.push(cards[i]);}return due.concat(nw.slice(0,Math.max(0,10-due.length))).slice(0,15);}
// ─── MODULE SCORE TRACKING ───
// `more` : champs propres au module ajoutés à l'entrée d'history (Mimic Hunt : `bites`, lu par le
// trophée « Unbitten » ; une partie sans morsure ne se déduit ni du score ni du cumul).
export function recordModule(u,modId,sc,tot,catStats,more){
  if(!u.moduleScores)u.moduleScores={};
  var prev=u.moduleScores[modId]||{correct:0,total:0,sessions:0,lastDate:null,history:[],catStats:{}};
  var hist=prev.history||[];
  var entry=Object.assign({date:today(),correct:sc,total:tot},more||{});
  // Les catStats DE LA SESSION, en plus du cumul (2026-09-17, lib/learnerModel.js) : sans elles, on ne
  // peut dire « 6 sur tes 13 dernières » ni dater un retournement, seulement une moyenne à vie. Format
  // compact {cat:{c,t}} : l'history est déjà bornée à 100 entrées, donc le jsonb ne dérive pas.
  if(catStats){
    var cs={},any=false;
    Object.keys(catStats).forEach(function(c){var s=catStats[c];if(!s||!s.total)return;cs[c]={c:s.correct||0,t:s.total};any=true;});
    if(any)entry.cs=cs;
  }
  hist.push(entry);
  if(hist.length>100)hist=hist.slice(-100);
  // Personalization Phase 2 (2026-05-06) — merge per-category stats when provided.
  // Used by the Drill composition (lib/planner.js : repli sur le cumul quand la série récente manque)
  // and the Mentor's grammar deep dive. Backward compatible : catStats arg is optional.
  var mergedCats=Object.assign({},prev.catStats||{});
  if(catStats){
    Object.keys(catStats).forEach(function(c){
      var p=mergedCats[c]||{correct:0,total:0};
      mergedCats[c]={correct:p.correct+(catStats[c].correct||0),total:p.total+(catStats[c].total||0)};
    });
  }
  u.moduleScores[modId]={correct:prev.correct+sc,total:prev.total+tot,sessions:prev.sessions+1,lastDate:today(),history:hist,catStats:mergedCats};
  // Échelon de maîtrise atteint (lib/hubStatus.js tierStatus, posé par le watcher d'App.jsx) : l'objet est
  // reconstruit ci-dessus avec des clés fixes, sans cette recopie chaque partie effacerait l'échelon et le
  // watcher retenterait le coffre (le serveur refuse, mais le délai de 7 jours repartirait de zéro).
  if(prev.mt)u.moduleScores[modId].mt=prev.mt;
  // V2 — Bypass Token consumed once a round of the armed module lands. Clearing here
  // (rather than in each Done handler) keeps the contract central and consistent.
  if(u.boosts&&u.boosts.bypassArmedModule===modId)u.boosts.bypassArmedModule=null;
  if(u.boosts&&u.boosts.moduleBoostArmed===modId)u.boosts.moduleBoostArmed=null; // P2.5 — consume Module Booster
  return u;
}
export function checkMission(u,modId){
  if(!u.mission)return u;
  if(u.mission.date===today()&&u.mission.actId===modId&&!u.mission.done){
    u.mission.done=true;
    u.xp+=15;u.weeklyXp+=15; // Mission bonus
    // V2 chest redesign — track consecutive-days streak (drives Mission Streak 7 chest).
    // We store the streak in the existing mission jsonb to avoid a Supabase migration.
    var prev=u.mission.lastDoneDate||null;
    var ydDate=new Date();ydDate.setDate(ydDate.getDate()-1);
    var ysIso=ydDate.toISOString().split("T")[0];
    if(prev===ysIso)u.mission.streak=(u.mission.streak||0)+1;
    else if(prev!==today())u.mission.streak=1; // gap or first time → restart at 1
    u.mission.lastDoneDate=today();
    // Jours de mission faite (onglet Usage du formateur, taux sur les jours actifs). Borné : dayMission
    // recopie la mission de la veille (Object.assign), le tableau traverse donc les jours tout seul.
    var dd=(u.mission.doneDays||[]).filter(function(d){return d!==today();});dd.push(today());
    u.mission.doneDays=dd.slice(-35);
  }
  return u;
}
export function canUnlockMock(u,mockId){
  if(!u||!u.stats)return{ok:false,reasons:[]};
  var reasons=[];
  if((u.stats.totalQ||0)<50)reasons.push("Answer 50+ questions ("+(u.stats.totalQ||0)+"/50)");
  var modCount=u.moduleScores?Object.keys(u.moduleScores).length:0;
  if(modCount<5)reasons.push("Try 5+ different modules ("+modCount+"/5)");
  if(!u.moduleScores||!u.moduleScores.drill)reasons.push("Complete at least 1 Part 5 Drill");
  if(mockId===2&&(!u.mockResults||!u.mockResults.mock1))reasons.push("Complete Mock Test 1 first");
  if(mockId===3&&(!u.mockResults||!u.mockResults.mock2))reasons.push("Complete Mock Test 2 first");
  // V2 — Note : Mocks lock permanently AFTER completion (see Train.mocksSection
  // override at line ~3601), not via canUnlockMock. Mock Reset token bypasses
  // that override directly. We don't add a 24h cooldown reason here because the
  // override would re-lock anyway.
  return{ok:reasons.length===0,reasons:reasons};
}
export function canUnlockBoss(u){
  if(!u||!u.stats)return{ok:false,reasons:[]};
  var reasons=[];
  if(!u.mockResults||!u.mockResults.mock1)reasons.push("Complete Mock Test 1 first");
  if(!u.mockResults||!u.mockResults.mock2)reasons.push("Complete Mock Test 2 first");
  if(!u.mockResults||!u.mockResults.mock3)reasons.push("Complete Mock Test 3 first");
  // V2 — Boss Reset token bypasses the 24h cooldown when armed.
  if(reasons.length===0&&u.mockResults&&u.mockResults.boss&&u.mockResults.boss.date===today()&&!(u.boosts&&u.boosts.bossResetArmed)){
    reasons.push("24h cooldown — come back tomorrow");
  }
  return{ok:reasons.length===0,reasons:reasons};
}
// ─── SEASON & MOCK NUDGE ───
export var SEASON_START="2026-09-01";
export function needsMockNudge(u){
  if(!u||!u.name)return false;
  if(u.mockResults&&(u.mockResults.mock1||u.mockResults.mock2||u.mockResults.mock3))return false;
  var joined=u.joinedAt?new Date(u.joinedAt):null;
  if(joined&&(Date.now()-joined.getTime())>=3*24*60*60*1000)return true;
  if(today()>=SEASON_START)return true;
  return false;
}
// ─── ENDLESS ARENA HELPERS ───
export function getEndlessState(u){
  if(!u.mockResults||!u.mockResults.boss)return"hidden";
  if((u.mockResults.boss.toeicEstimate||0)<650)return"locked";
  var last=u.mockResults.endless&&u.mockResults.endless.lastAttempt;
  // V2 — Endless Resurrect token bypasses the 24h cooldown when armed.
  if(last&&(Date.now()-last)<24*60*60*1000&&!(u.boosts&&u.boosts.endlessResetArmed))return"cooldown";
  return"ready";
}
