// Extrait de src/App.jsx le 2026-09-15 (refactor split-app, REFACTOR_PLAN.md). Code déplacé tel quel.
import { QUESTIONS } from "../data/grammar.js";
import { MISSION_MODULES } from "../data/placement.js";
import { srand, today, shuffle } from "./util.js";

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
export function recordModule(u,modId,sc,tot,catStats){
  if(!u.moduleScores)u.moduleScores={};
  var prev=u.moduleScores[modId]||{correct:0,total:0,sessions:0,lastDate:null,history:[],catStats:{}};
  var hist=prev.history||[];
  hist.push({date:today(),correct:sc,total:tot});
  if(hist.length>100)hist=hist.slice(-100);
  // Personalization Phase 2 (2026-05-06) — merge per-category stats when provided.
  // Used by the adaptive picker (pickAdaptive) to weight question selection toward
  // the user's weakest sub-topics. Backward compatible : catStats arg is optional.
  var mergedCats=Object.assign({},prev.catStats||{});
  if(catStats){
    Object.keys(catStats).forEach(function(c){
      var p=mergedCats[c]||{correct:0,total:0};
      mergedCats[c]={correct:p.correct+(catStats[c].correct||0),total:p.total+(catStats[c].total||0)};
    });
  }
  u.moduleScores[modId]={correct:prev.correct+sc,total:prev.total+tot,sessions:prev.sessions+1,lastDate:today(),history:hist,catStats:mergedCats};
  // V2 — Bypass Token consumed once a round of the armed module lands. Clearing here
  // (rather than in each Done handler) keeps the contract central and consistent.
  if(u.bypassArmedModule===modId)u.bypassArmedModule=null;
  if(u.boosts&&u.boosts.moduleBoostArmed===modId)u.boosts.moduleBoostArmed=null; // P2.5 — consume Module Booster
  return u;
}
// ═══════════════════════════════════════════════════════════════════════
// pickAdaptive — Personalization Phase 2 (2026-05-06)
// Weighted question selection driven by per-category accuracy stored in
// u.moduleScores[modId].catStats. Hybrid 60/40 formula (validated by
// Jérémy) : 60% picks weighted by category weakness, 40% pure random.
// Cold start (no cat with ≥5 samples) falls back to pure shuffle so new
// users aren't penalized by a biased pool.
// ═══════════════════════════════════════════════════════════════════════
export function pickAdaptive(u,all,modId,target){
  if(!target)target=10;
  var cs=(u&&u.moduleScores&&u.moduleScores[modId]&&u.moduleScores[modId].catStats)||{};
  var hasData=Object.keys(cs).some(function(k){return cs[k]&&cs[k].total>=5;});
  if(!hasData)return shuffle(all).slice(0,target);

  // Bucket items by cat (fall back to "Other" if missing)
  var byCat={};
  all.forEach(function(q){var c=q.cat||"Other";if(!byCat[c])byCat[c]=[];byCat[c].push(q);});

  // Weight per cat : weakness = 1 - accuracy, floor 0.1 to keep some chance of being picked
  // even for mastered topics. Cats with insufficient data get a neutral 0.5 weight.
  var weights={};
  Object.keys(byCat).forEach(function(c){
    var s=cs[c];
    if(!s||s.total<5)weights[c]=0.5;
    else weights[c]=Math.max(0.1,1-(s.correct/s.total));
  });

  // 60% weighted picks : sample a cat by weights, then a random item in that cat.
  // Each picked item is removed from the pool so we don't repeat.
  var weightedN=Math.round(target*0.6);
  var randomN=target-weightedN;
  var available=JSON.parse(JSON.stringify(byCat));
  var picked=[],pickedIds={};
  for(var i=0;i<weightedN;i++){
    var cats=Object.keys(available).filter(function(c){return available[c].length>0;});
    if(cats.length===0)break;
    var totalW=0;cats.forEach(function(c){totalW+=weights[c];});
    var r=Math.random()*totalW,sumW=0,chosenCat=cats[0];
    for(var j=0;j<cats.length;j++){sumW+=weights[cats[j]];if(r<=sumW){chosenCat=cats[j];break;}}
    var pool=available[chosenCat];
    var idx=Math.floor(Math.random()*pool.length);
    var q=pool.splice(idx,1)[0];
    picked.push(q);pickedIds[q.id]=true;
  }
  // 40% random picks from remaining items
  var remaining=all.filter(function(q){return !pickedIds[q.id];});
  var randomPicks=shuffle(remaining).slice(0,randomN);
  return shuffle(picked.concat(randomPicks));
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
  }
  return u;
}
// ─── RECOMMENDATION ENGINE ───
export var MISSION_THRESHOLD=10; // min sessions before recommending
export function getDailyMission(u){
  if(!u.moduleScores)return null;
  if((u.stats.sessions||0)<MISSION_THRESHOLD)return{status:"calibrating",remaining:MISSION_THRESHOLD-(u.stats.sessions||0)};

  // Already have a mission for today?
  if(u.mission&&u.mission.date===today())return{status:u.mission.done?"completed":"active",actId:u.mission.actId,mod:MISSION_MODULES.find(function(m){return m.id===u.mission.actId;}),done:u.mission.done};

  // Generate new mission: find weakest module
  var candidates=[];
  for(var i=0;i<MISSION_MODULES.length;i++){
    var m=MISSION_MODULES[i];
    var ms=u.moduleScores[m.id];
    if(!ms){
      // Never tried — high priority
      candidates.push({mod:m,priority:100,reason:"You haven't tried this yet!"});
    } else {
      var acc=ms.total>0?ms.correct/ms.total:0;
      var daysSince=ms.lastDate?Math.floor((new Date()-new Date(ms.lastDate))/(864e5)):999;
      // Score: lower accuracy + more days since last = higher priority
      var score=((1-acc)*70)+(Math.min(daysSince,14)*2);
      var reasonText=acc<0.5?"Accuracy is low — let's improve!":acc<0.7?"Room for improvement here.":daysSince>5?"It's been a while — keep it fresh!":"Maintain your level.";
      candidates.push({mod:m,priority:score,reason:reasonText});
    }
  }
  // Sort by priority descending, pick top
  candidates.sort(function(a,b){return b.priority-a.priority;});
  // Add some variety: pick from top 3 using day seed + reroll counter (so Daily Reroll
  // tokens actually change the pick instead of re-selecting the same deterministic slot).
  var seed=0;var d=today();for(var j=0;j<d.length;j++)seed+=d.charCodeAt(j);
  seed+=(u.mission&&u.mission.rerollCount)||0;
  var pick=candidates[seed%Math.min(3,candidates.length)];
  return{status:"new",actId:pick.mod.id,mod:pick.mod,reason:pick.reason};
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
  if(reasons.length===0&&u.mockResults&&u.mockResults.boss&&u.mockResults.boss.date===today()&&!u.bossResetArmed){
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
  if(last&&(Date.now()-last)<24*60*60*1000&&!u.endlessResetArmed)return"cooldown";
  return"ready";
}
