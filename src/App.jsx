import { useState, useEffect, useRef, useMemo } from "react";
import { playCorrect, playWrong, playXP, playLevelUp, playCombo, playStreak, playTimer, playClick, playArenaCall, playJingleEnter, playJingleAchieve, playJingleLeague, playJingleMock, playJingleMockOk, playJingleDaily, playBGM, stopBGM, setSoundEnabled, isSoundEnabled } from "./sounds.js";
import { BarChart, Bar as RBar, LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Cell } from "recharts";

/* ═══════════════════════════════════════════
   TOEIC ARENA — MVP v2.0
   Mobile-first TOEIC training platform
   ═══════════════════════════════════════════ */


// ─── DATA IMPORTS ───
import { LEAGUES, COMPETITORS } from "./data/leagues.js";
import { ACHIEVEMENTS } from "./data/achievements.js";
import { VOCAB } from "./data/vocab.js";
import { QUESTIONS, WORD_FAMILIES } from "./data/grammar.js";
import { CONNECTORS, PREP_COLLOCATIONS, GERUND_INF, TOEIC_TRAPS, FALSE_FRIENDS, STRATEGIES, STRAT_QUIZ } from "./data/miniGames.js";
import { PART6_TEXTS } from "./data/part6.js";
import { PART7_PASSAGES } from "./data/part7.js";
import { LISTENING_P1, LISTENING_P2, LISTENING_P3, LISTENING_P4 } from "./data/listening.js";
import { PLACEMENT_TEST, PLACEMENT_LEVELS, MISSION_MODULES } from "./data/placement.js";
import { PHRASAL_VERBS } from "./data/phrasalVerbs.js";
import { SENTENCES } from "./data/sentences.js";
import { AUDIO_BLITZ } from "./data/audioBlitz.js";
import { CLUE_HUNTER } from "./data/clueHunter.js";
import { MOCK1_P5, MOCK2_P5, MOCK3_P5, MOCK1_P6, MOCK2_P6, MOCK3_P6, MOCK1_P7, MOCK2_P7, MOCK3_P7} from "./data/mockTests.js";


function today(){return new Date().toISOString().split("T")[0];}

// ─── TTS ENGINE (swap to ElevenLabs when migrated) ───
var _voices=null;
function getEnVoice(){
  if(_voices)return _voices;
  var all=window.speechSynthesis?window.speechSynthesis.getVoices():[];
  // Prefer: US English > UK English > any English
  var pref=["en-US","en-GB","en-AU","en"];
  for(var p=0;p<pref.length;p++){
    for(var i=0;i<all.length;i++){
      if(all[i].lang&&all[i].lang.indexOf(pref[p])===0){_voices=all[i];return _voices;}
    }
  }
  return all[0]||null;
}
var _audioCache={};
async function speak(text,rate){
  var key=text.toLowerCase().trim();
  // Check cache first
  if(_audioCache[key]){
    var a=_audioCache[key].cloneNode();
    a.playbackRate=rate||0.9;
    a.play().catch(function(){});
    return;
  }
  // ElevenLabs disabled for live TTS — use browser speechSynthesis instead
  // (ElevenLabs is only used for pre-generated Listening audio files)
  var isLocal=true;
  if(!isLocal)try{
    var res=await fetch('/api/tts',{
      method:'POST',
      headers:{'Content-Type':'application/json'},
      body:JSON.stringify({text:text,voice:'us_female'})
    });
    if(res.ok){
      var blob=await res.blob();
      var url=URL.createObjectURL(blob);
      var audio=new Audio(url);
      audio.playbackRate=rate||0.9;
      _audioCache[key]=audio;
      audio.play().catch(function(){});
      return;
    }
  }catch(e){}
  // Fallback to browser TTS if ElevenLabs fails
  if(!window.speechSynthesis)return;
  window.speechSynthesis.cancel();
  var u=new SpeechSynthesisUtterance(text);
  u.rate=rate||0.9;u.pitch=1;u.volume=1;
  var v=getEnVoice();if(v)u.voice=v;u.lang="en-US";
  window.speechSynthesis.speak(u);
}
function speakAndWait(text,rate){
  return new Promise(function(resolve){
    var isLocal=window.location.hostname==='localhost'||window.location.hostname==='127.0.0.1';
    if(!isLocal&&_audioCache[text.toLowerCase().trim()]){
      var a=_audioCache[text.toLowerCase().trim()].cloneNode();
      a.playbackRate=rate||0.9;
      a.onended=resolve;
      a.onerror=resolve;
      a.play().catch(resolve);
      return;
    }
    if(false){
      fetch('/api/tts',{
        method:'POST',headers:{'Content-Type':'application/json'},
        body:JSON.stringify({text:text,voice:'us_female'})
      }).then(function(res){
        if(res.ok)return res.blob();
        throw new Error('tts failed');
      }).then(function(blob){
        var url=URL.createObjectURL(blob);
        var audio=new Audio(url);
        audio.playbackRate=rate||0.9;
        _audioCache[text.toLowerCase().trim()]=audio;
        audio.onended=resolve;
        audio.onerror=resolve;
        audio.play().catch(resolve);
      }).catch(function(){
        speakBrowserTTS(text,rate,resolve);
      });
      return;
    }
    speakBrowserTTS(text,rate,resolve);
  });
}
function speakBrowserTTS(text,rate,cb){
  if(!window.speechSynthesis){cb();return;}
  window.speechSynthesis.cancel();
  var u=new SpeechSynthesisUtterance(text);
  u.rate=rate||0.9;u.pitch=1;u.volume=1;
  var v=getEnVoice();if(v)u.voice=v;u.lang="en-US";
  u.onend=cb;u.onerror=cb;
  window.speechSynthesis.speak(u);
}

function playAudioFile(url){
  return new Promise(function(resolve){
    var audio=new Audio(url);
    audio.onended=resolve;
    audio.onerror=function(){console.warn("Audio not found: "+url);resolve();};
    audio.play().catch(resolve);
  });
}
// Preload voices (some browsers need this)
if(window.speechSynthesis){window.speechSynthesis.onvoiceschanged=function(){_voices=null;getEnVoice();};}

// ─── AUDIO BUTTON COMPONENT ───
function SpeakBtn(p){
  var[playing,sP]=useState(false);
  function go(){
    sP(true);
    speak(p.text,p.rate||0.9);
    setTimeout(function(){sP(false);},Math.max(1000,p.text.length*80));
  }
  return(<button onClick={function(e){e.stopPropagation();go();}}
    style={{display:"inline-flex",alignItems:"center",justifyContent:"center",width:p.size||36,height:p.size||36,borderRadius:"50%",
      background:playing?"rgba(212,148,58,.2)":"var(--bg3)",border:"1px solid "+(playing?"var(--cyan)":"var(--bdr)"),
      cursor:"pointer",transition:"all .2s",flexShrink:0}}>
    <span style={{fontSize:p.size?p.size*0.5:18,lineHeight:1}}>{playing?"🔊":"🔈"}</span>
  </button>);
}
function weekId(){var d=new Date();var day=d.getDay();var diff=d.getDate()-day+(day===0?-6:1);var mon=new Date(d);mon.setDate(diff);mon.setHours(0,0,0,0);var jan1=new Date(mon.getFullYear(),0,1);var wk=Math.floor((mon-jan1)/(7*864e5))+1;return mon.getFullYear()+"-W"+wk;}
function shuffle(a){var b=a.slice();for(var i=b.length-1;i>0;i--){var j=Math.floor(Math.random()*(i+1));var t=b[i];b[i]=b[j];b[j]=t;}return b;}
function srand(s){var x=Math.sin(s)*10000;return x-Math.floor(x);}
import { getLevel } from "./data/helpers.js";
function getLeague(wxp){var l=LEAGUES[0];for(var i=0;i<LEAGUES.length;i++)if(wxp>=LEAGUES[i].min)l=LEAGUES[i];return l;}
function dailyQs(date,u){
  var seed=0;for(var i=0;i<date.length;i++)seed+=date.charCodeAt(i);

  // Seeded shuffle helper (deterministic per day)
  function seededPick(arr,s){
    var b=arr.slice();
    for(var i=b.length-1;i>0;i--){var j=Math.floor(srand(s+i)*(i+1));var t=b[i];b[i]=b[j];b[j]=t;}
    return b;
  }

  // Group QUESTIONS by category
  var catMap={};
  QUESTIONS.forEach(function(q){if(!catMap[q.cat])catMap[q.cat]=[];catMap[q.cat].push(q);});
  var allCats=Object.keys(catMap);

  // Map specific modules to grammar categories for weakness detection
  var modToCat={
    "wordfam":"Word Families","connsort":"Connectors","prepdrill":"Prepositions",
    "gerinf":"Gerunds vs Infinitives","falsefr":"False Friends"
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

  // Fallback: if still < 5, fill with unused questions
  if(picked.length<5){
    var usedIds={};picked.forEach(function(q){usedIds[q.id]=true;});
    var filler=seededPick(QUESTIONS.filter(function(q){return!usedIds[q.id];}),seed+200);
    while(picked.length<5&&filler.length>0)picked.push(filler.shift());
  }

  return seededPick(picked,seed+300);
}
function compScores(wk){var seed=0;for(var i=0;i<wk.length;i++)seed+=wk.charCodeAt(i);return COMPETITORS.map(function(c,idx){return{name:c.n,avatar:c.a,xp:Math.floor(srand(seed+idx*137)*600+50+srand(seed+idx*53+Math.floor(Date.now()/864e5))*100)};});}
function srsUp(st,r){var e=st.ease||2.5,iv=st.interval||0;if(r===1){iv=1;e=Math.max(1.3,e-0.2);}else if(r===2){iv=Math.max(1,Math.ceil(iv*1.2));e=Math.max(1.3,e-0.15);}else if(r===3){iv=iv===0?1:Math.ceil(iv*e);}else{iv=iv===0?3:Math.ceil(iv*e*1.3);e+=0.15;}var nx=new Date();nx.setDate(nx.getDate()+iv);return{ease:e,interval:iv,nextReview:nx.toISOString().split("T")[0],correct:(st.correct||0)+(r>=3?1:0),total:(st.total||0)+1};}
function dueCards(states,cards){var t=today(),due=[],nw=[];for(var i=0;i<cards.length;i++){var s=states[cards[i].id];if(!s)nw.push(cards[i]);else if(s.nextReview<=t)due.push(cards[i]);}return due.concat(nw.slice(0,Math.max(0,10-due.length))).slice(0,15);}

var SK="toeic-arena-v2";
import { supabase } from './supabase.js'

async function load() {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  // 1) Try by auth ID (fast path — same device)
  var res = await supabase.from('students').select('*').eq('id', user.id).maybeSingle();

  // 2) Fallback: try by cached name (different device, different auth ID)
  if (!res.data) {
    var cachedName = null;
    try { cachedName = localStorage.getItem('toeic-arena-name'); } catch(e) {}
    if (cachedName) {
      var cachedClass = null;
      try { cachedClass = localStorage.getItem('toeic-arena-class'); } catch(e) {}
      var res2 = await supabase.from('students').select('*').eq('name', cachedName).eq('class_code', cachedClass || 'idrac2026').order('xp', {ascending:false}).limit(1);
      if (res2.data && res2.data.length > 0) {
        res = { data: res2.data[0] };
      }
    }
  }

  if (!res.data) return null;
  var data = res.data;
  try { localStorage.setItem('toeic-arena-name', data.name); } catch(e) {}
  try { localStorage.setItem('toeic-arena-class', data.class_code || 'idrac2026'); } catch(e) {}

  return {
    name: data.name,
    classCode: data.class_code || 'idrac2026',
    xp: data.xp,
    weeklyXp: data.weekly_xp,
    weekId: data.week_id,
    streak: data.streak,
    lastActive: data.last_active,
    cardStates: data.card_states || {},
    daily: data.daily_challenge || {date:null,done:false,score:0,xpE:0},
    stats: data.stats,
    moduleScores: data.module_scores,
    mockResults: data.mock_results || {},
    gameScores: data.game_scores || {},
    mission: data.mission,
    unlockedAch: data.unlocked_ach || [],
    avatar: data.avatar || "⚔️",
    theme: data.theme || "dark",
    totalTime: data.total_time || 0,
    weeklyHistory: data.weekly_history || [],
    dailyModSessions: data.daily_mod_sessions || {},
  };
}

async function save(d) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;
  try { localStorage.setItem('toeic-arena-name', d.name); } catch(e) {}
  try { localStorage.setItem('toeic-arena-class', d.classCode || 'idrac2026'); } catch(e) {}

  // Single upsert that conflicts on (name, class_code) — NOT on id
  // This means: if a row with this name+class exists, UPDATE it. Otherwise INSERT.
  // Works regardless of which device/auth ID is saving.
  var { error } = await supabase.from('students').upsert({
    id: user.id,
    name: d.name,
    class_code: d.classCode || 'idrac2026',
    xp: d.xp,
    weekly_xp: d.weeklyXp,
    week_id: d.weekId,
    streak: d.streak,
    last_active: d.lastActive,
    card_states: d.cardStates,
    daily_challenge: d.daily,
    stats: d.stats,
    module_scores: d.moduleScores,
    mock_results: d.mockResults,
    game_scores: d.gameScores,
    mission: d.mission,
    avatar: d.avatar || "⚔️",
    theme: d.theme || "dark",
    unlocked_ach: d.unlockedAch || [],
    total_time: d.totalTime || 0,
    weekly_history: d.weeklyHistory || [],
    daily_mod_sessions: d.dailyModSessions || {},
  }, { onConflict: 'name,class_code' });
  if(error) console.error("SAVE ERROR:", error.message, error.details);
}
function fresh(name,classCode){return{name:name,classCode:classCode||'idrac2026',xp:0,streak:0,lastActive:null,weeklyXp:0,weekId:weekId(),weeklyHistory:[],cardStates:{},daily:{date:null,done:false,score:0,xpE:0},stats:{totalQ:0,correct:0,sessions:0,cardsRev:0,perfects:0,drills:0},moduleScores:{},mockResults:{},gameScores:{},mission:{date:null,actId:null,done:false},unlockedAch:[],avatar:"⚔️",theme:"dark",totalTime:0,dailyModSessions:{}};}

// ─── MODULE SCORE TRACKING ───
function recordModule(u,modId,sc,tot){
  if(!u.moduleScores)u.moduleScores={};
  var prev=u.moduleScores[modId]||{correct:0,total:0,sessions:0,lastDate:null,history:[]};
  var hist=prev.history||[];
  hist.push({date:today(),correct:sc,total:tot});
  if(hist.length>100)hist=hist.slice(-100);
  u.moduleScores[modId]={correct:prev.correct+sc,total:prev.total+tot,sessions:prev.sessions+1,lastDate:today(),history:hist};
  return u;
}
function checkMission(u,modId){
  if(!u.mission)return u;
  if(u.mission.date===today()&&u.mission.actId===modId&&!u.mission.done){
    u.mission.done=true;
    u.xp+=15;u.weeklyXp+=15; // Mission bonus
  }
  return u;
}
function getModuleAccuracy(u,modId){
  if(!u.moduleScores||!u.moduleScores[modId])return null;
  var m=u.moduleScores[modId];
  if(m.total===0)return null;
  return Math.round(m.correct/m.total*100);
}

// ─── RECOMMENDATION ENGINE ───
var MISSION_THRESHOLD=10; // min sessions before recommending
function getDailyMission(u){
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
  // Add some variety: pick from top 3 using day seed
  var seed=0;var d=today();for(var j=0;j<d.length;j++)seed+=d.charCodeAt(j);
  var pick=candidates[seed%Math.min(3,candidates.length)];
  return{status:"new",actId:pick.mod.id,mod:pick.mod,reason:pick.reason};
}

// ─── MOCK TEST HELPERS ───
function estimateToeic(raw,total){
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
function canUnlockMock(u,mockId){
  if(!u||!u.stats)return{ok:false,reasons:[]};
  var reasons=[];
  if((u.stats.totalQ||0)<50)reasons.push("Answer 50+ questions ("+(u.stats.totalQ||0)+"/50)");
  var modCount=u.moduleScores?Object.keys(u.moduleScores).length:0;
  if(modCount<5)reasons.push("Try 5+ different modules ("+modCount+"/5)");
  if(!u.moduleScores||!u.moduleScores.drill)reasons.push("Complete at least 1 Part 5 Drill");
  if(mockId===2&&(!u.mockResults||!u.mockResults.mock1))reasons.push("Complete Mock Test 1 first");
  if(mockId===3&&(!u.mockResults||!u.mockResults.mock2))reasons.push("Complete Mock Test 2 first");
  return{ok:reasons.length===0,reasons:reasons};
}

// ─── TEACHER DASHBOARD CONFIG ───
var TEACHER_CODE="arena-teacher-2026";
var PUSH_SECRET="toeic-push-2026-xyz";
var PUSH_SECRET="toeic-push-2026-xyz";

// ─── PUSH NOTIFICATIONS ───
var VAPID_PUBLIC_KEY="BGiKomKxy1j081qd5ZaZnp7EUAYXIGRPWu8ePQySLGhQ0T45-m3oKTqgj-teqm2l5RoR0jnamCWHZ6pMYjrPVy4";

function urlBase64ToUint8Array(base64String){
  var padding="=".repeat((4-base64String.length%4)%4);
  var base64=(base64String+padding).replace(/-/g,"+").replace(/_/g,"/");
  var rawData=window.atob(base64);var outputArray=new Uint8Array(rawData.length);
  for(var i=0;i<rawData.length;++i)outputArray[i]=rawData.charCodeAt(i);
  return outputArray;
}

async function subscribePush(userName,userClassCode){
  try{
    if(!("serviceWorker" in navigator)||!("PushManager" in window))return null;
    var reg=await navigator.serviceWorker.ready;
var existing=await reg.pushManager.getSubscription();
    var sub=existing||await reg.pushManager.subscribe({
      userVisibleOnly:true,
      applicationServerKey:urlBase64ToUint8Array(VAPID_PUBLIC_KEY)
    });
// Store in Supabase — one row per device (keyed by endpoint)
    var subJson=sub.toJSON();
    await supabase.from("push_subscriptions").delete().eq("student_name",userName).eq("class_code","idrac2026").eq("endpoint",subJson.endpoint);
    await supabase.from("push_subscriptions").insert({
      student_name:userName,
      class_code:"idrac2026",
      subscription:subJson,
      endpoint:subJson.endpoint
    });
    return sub;
  }catch(e){console.log("Push subscription failed:",e);return null;}
}

async function unsubscribePush(userName,userClassCode){
  try{
    if(!("serviceWorker" in navigator))return;
    var reg=await navigator.serviceWorker.ready;
    var sub=await reg.pushManager.getSubscription();
    if(sub){
      await sub.unsubscribe();
      await supabase.from("push_subscriptions").delete().eq("student_name",userName).eq("class_code","idrac2026").eq("endpoint",sub.endpoint);
    }
  }catch(e){console.log("Push unsubscribe failed:",e);}
}

async function isPushSubscribed(){
  try{
    if(!("serviceWorker" in navigator)||!("PushManager" in window))return false;
    var reg=await navigator.serviceWorker.ready;
    var sub=await reg.pushManager.getSubscription();
    return!!sub;
  }catch(e){return false;}
}

// ─── CSS ───
var CSS=`@import url('https://fonts.googleapis.com/css2?family=Cinzel:wght@600;700;800;900&family=Outfit:wght@400;500;600;700;800;900&family=DM+Sans:wght@400;500;600;700&display=swap');
*{box-sizing:border-box;margin:0;padding:0;-webkit-tap-highlight-color:transparent}
:root{--bg:#0f0c08;--bg2:#1a1610;--bg3:#28221a;--bdr:rgba(180,140,80,0.08);--cyan:#d4943a;--orange:#c87a35;--gold:#f0c850;--green:#4abe60;--red:#e05252;--purple:#8b5e83;--t1:#ede4d4;--t2:#8a7e6a;--t3:#5a5040}
.light{--bg:#f5f0e8;--bg2:#fffcf5;--bg3:#e8e0d2;--bdr:rgba(120,90,50,0.1);--cyan:#8b6914;--orange:#a05a10;--gold:#a67c00;--green:#15803d;--red:#b82020;--purple:#6b3d62;--t1:#1a1510;--t2:#5a5040;--t3:#8a7e6a}
body{background:var(--bg);font-family:'DM Sans',sans-serif;color:var(--t1)}
@keyframes fadeIn{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:translateY(0)}}
@keyframes pulse{0%,100%{transform:scale(1)}50%{transform:scale(1.05)}}
@keyframes glow{0%,100%{filter:brightness(1)}50%{filter:brightness(1.3)}}
@keyframes shake{0%,100%{transform:translateX(0)}20%{transform:translateX(-8px)}40%{transform:translateX(8px)}60%{transform:translateX(-4px)}80%{transform:translateX(4px)}}
@keyframes flame{0%,100%{transform:scale(1) rotate(-2deg)}25%{transform:scale(1.1) rotate(2deg)}50%{transform:scale(1.05) rotate(-1deg)}75%{transform:scale(1.12) rotate(1deg)}}
@keyframes achPop{0%{transform:translateY(30px) scale(.7);opacity:0}10%{transform:translateY(-5px) scale(1.05);opacity:1}15%{transform:translateY(0) scale(1);opacity:1}85%{transform:translateY(0) scale(1);opacity:1}100%{transform:translateY(-20px) scale(.95);opacity:0}}
@keyframes xpPop{0%{transform:translateY(0) scale(.5);opacity:0}15%{transform:translateY(-10px) scale(1.1);opacity:1}75%{transform:translateY(-10px) scale(1);opacity:1}100%{transform:translateY(-30px) scale(.95);opacity:0}}
@keyframes flip{0%{transform:rotateY(90deg);opacity:0}100%{transform:rotateY(0);opacity:1}}
@keyframes countUp{from{opacity:0;transform:scale(.5)}to{opacity:1;transform:scale(1)}}
.app{max-width:430px;margin:0 auto;min-height:100vh;background:var(--bg);color:var(--t1);position:relative;overflow-x:hidden}
.enter{animation:fadeIn .3s ease-out}
.crd{background:var(--bg2);border:1px solid var(--bdr);border-radius:16px;padding:20px;box-shadow:inset 0 1px 0 rgba(180,140,80,.04)}
.glo{box-shadow:0 0 30px rgba(212,148,58,.06)}
.btn1{background:linear-gradient(135deg,#d4943a,#a06e20);color:#0f0c08;border:none;border-radius:12px;padding:14px 28px;font-family:'Cinzel','Outfit',serif;font-weight:700;font-size:16px;cursor:pointer;width:100%;transition:all .2s}
.btn1:active{transform:scale(.97)}
.btn2{background:var(--bg2);border:1px solid var(--bdr);color:var(--t1);border-radius:12px;padding:12px 24px;font-family:'Cinzel','Outfit',serif;font-weight:600;font-size:14px;cursor:pointer}
.fl{animation:flame 1.5s ease-in-out infinite;display:inline-block}
.sk{animation:shake .4s ease-in-out}
.out{font-family:'Cinzel','Outfit',serif;letter-spacing:0.5px}`;

// ─── SMALL COMPONENTS ───
function Bar(p){var pct=p.max>0?Math.min(100,p.value/p.max*100):0;return(<div style={{width:"100%",height:p.h||8,background:"var(--bg3)",borderRadius:99,overflow:"hidden"}}><div style={{width:pct+"%",height:"100%",background:p.color||"linear-gradient(90deg,#d4943a,#c87a35)",borderRadius:99,transition:"width .8s cubic-bezier(.4,0,.2,1)"}}/></div>);}

function AchToast(p){if(!p.v)return null;
  return(<div style={{position:"fixed",top:60,left:"50%",transform:"translateX(-50%)",zIndex:250,animation:"achPop 3.5s ease-out forwards",pointerEvents:"none",textAlign:"center"}}>
    <div style={{background:"linear-gradient(135deg,#1a1610,#201a12)",border:"1px solid rgba(255,215,0,.3)",padding:"16px 28px",borderRadius:20,boxShadow:"0 8px 40px rgba(255,215,0,.25)",minWidth:220}}>
      <div style={{fontSize:40,marginBottom:6,animation:"pulse 1s infinite"}}>{p.v.icon}</div>
      <div className="out" style={{fontSize:10,fontWeight:700,color:"var(--gold)",textTransform:"uppercase",letterSpacing:2,marginBottom:4}}>Achievement Unlocked!</div>
      <div className="out" style={{fontWeight:800,fontSize:18,color:"var(--t1)",marginBottom:2}}>{p.v.name}</div>
      <div style={{fontSize:12,color:"var(--t2)"}}>{p.v.desc}</div>
    </div>
  </div>);}

function XpToast(p){if(!p.v)return null;
  var info=typeof p.v==="object"?p.v:{total:p.v,base:p.v,bonuses:[]};
  return(<div style={{position:"fixed",top:70,left:"50%",transform:"translateX(-50%)",zIndex:200,animation:"xpPop 3.5s ease-out forwards",pointerEvents:"none",textAlign:"center"}}>
    <div style={{background:"linear-gradient(135deg,#ffd700,#ff8c42)",color:"#000",padding:"10px 24px",borderRadius:99,fontWeight:800,fontSize:22,boxShadow:"0 4px 20px rgba(255,215,0,.4)"}} className="out">+{info.total} XP</div>
    {info.bonuses&&info.bonuses.length>0&&info.total!==info.base&&<div style={{fontSize:11,color:"var(--gold)",marginTop:4,fontWeight:600}} className="out">{info.base} base → {info.total} with bonuses</div>}
    {info.bonuses&&info.bonuses.length>0&&<div style={{marginTop:6,display:"flex",flexDirection:"column",gap:3,alignItems:"center"}}>
      {info.bonuses.map(function(b,i){return (<div key={i} style={{background:"rgba(0,0,0,.7)",padding:"3px 12px",borderRadius:99,fontSize:11,fontWeight:600,color:b.color||"var(--gold)"}} className="out">{b.label}</div>);})}
    </div>}
  </div>);}

function Tabs(p){var tabs=[{id:"home",l:"Home",i:"⚡"},{id:"train",l:"Train",i:"🎯"},{id:"cards",l:"Cards",i:"🃏"},{id:"games",l:"Games",i:"🎲"},{id:"league",l:"League",i:"🏆"},{id:"profile",l:"Profile",i:"👤"}];
return(<div style={{position:"fixed",bottom:0,left:"50%",transform:"translateX(-50%)",width:"100%",maxWidth:430,background:"linear-gradient(180deg,rgba(15,12,8,0) 0%,rgba(15,12,8,.95) 20%,#0f0c08 100%)",padding:"8px 12px 12px",zIndex:100,display:"flex",justifyContent:"space-around"}}>
{tabs.map(function(t){var a=p.cur===t.id;return(<button key={t.id} onClick={function(){p.go(t.id);}} style={{display:"flex",flexDirection:"column",alignItems:"center",gap:2,background:"none",border:"none",cursor:"pointer",padding:"6px 12px",borderRadius:12,color:a?"var(--cyan)":"var(--t3)",transform:a?"scale(1.05)":"scale(1)",transition:"all .2s"}}>
<span style={{fontSize:22,lineHeight:1}}>{t.i}</span><span style={{fontSize:10,fontWeight:a?700:500,letterSpacing:.5}} className="out">{t.l}</span>{a&&<div style={{width:4,height:4,borderRadius:"50%",background:"var(--cyan)",marginTop:1}}/>}</button>);})}</div>);}

// ─── ONBOARDING ───
function Onboard(p){
var[step,sSt]=useState("name");
  var[name,sN]=useState("");
  var[ci,sC]=useState(0);var[sel,sS]=useState(-1);var[sc,sSc]=useState(0);var[ph,sP]=useState("q");
  var[teacherCode,sTC]=useState("");
  var[classCode,setClassCode]=useState("");var[classValid,setClassValid]=useState(null);var[classChecking,setClassChecking]=useState(false);var[classGroupName,setClassGroupName]=useState("");
  var[recName,setRecName]=useState("");var[recCode,setRecCode]=useState("");var[recMsg,setRecMsg]=useState(null);var[recLoading,setRecLoading]=useState(false);
  var[foundAccounts,setFoundAccounts]=useState([]);var[lookingUp,setLookingUp]=useState(false);var[visitorConfirm,setVisitorConfirm]=useState(false);

  async function lookupName(n){
    setLookingUp(true);
    try{
      // Ensure anon auth exists before querying
      var sess=await supabase.auth.getSession();
      if(!sess.data.session){
        var authRes=await supabase.auth.signInAnonymously();
        if(!authRes.data.user){setLookingUp(false);sSt("classcode");return;}
      }
      var res=await supabase.from('students').select('name,class_code,xp').eq('name',n.trim());
      if(res.data&&res.data.length>0){
        var groupRes=await supabase.from('groups').select('code,name,type');
        var groupMap={};
        if(groupRes.data)groupRes.data.forEach(function(g){groupMap[g.code]={name:g.name,type:g.type};});
        var accounts=res.data.map(function(s){
          var g=groupMap[s.class_code];
          return{class_code:s.class_code,xp:s.xp||0,
            groupName:g?g.name:(s.class_code==="visitor"?"Visitor / Free Access":s.class_code),
            groupType:g?g.type:"visitor",
            typeIcon:g?(g.type==="school"?"🏫":g.type==="pro"?"💼":"🌍"):"🌍"};
        });
        setFoundAccounts(accounts);
        sSt("recognize");
      } else {
        setFoundAccounts([]);
        sSt("classcode");
      }
    }catch(e){sSt("classcode");}
    setLookingUp(false);
  }

  async function checkGroupCode(code){
    if(!code.trim()){setClassValid(null);setClassGroupName("");return;}
    setClassChecking(true);
    var res=await supabase.from('groups').select('name,type').eq('code',code.trim().toLowerCase()).maybeSingle();
    if(res.data){setClassValid(true);setClassGroupName(res.data.name);}
    else{setClassValid(false);setClassGroupName("");}
    setClassChecking(false);
  }

  function startTest(){sSt("test");}
  function doAns(i){sS(i);if(i===PLACEMENT_TEST[ci].c){sSc(sc+1);try{playCorrect();}catch(e){}}sP("fb");}
  function nxt(){if(ci<PLACEMENT_TEST.length-1){sC(ci+1);sS(-1);sP("q");}else sSt("results");}

  var lvl=PLACEMENT_LEVELS.find(function(l){return sc>=l.min&&sc<=l.max;})||PLACEMENT_LEVELS[0];

  // ─ Name entry ─
  if(step==="name")return(
    <div className="app" style={{display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",minHeight:"100vh",padding:32,textAlign:"center"}}>
      <div style={{animation:"fadeIn .8s ease-out"}}>
        <div style={{fontSize:64,marginBottom:16}}>⚔️</div>
        <h1 className="out" style={{fontWeight:900,fontSize:36,background:"linear-gradient(135deg,#d4943a,#8b5e83)",WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent",marginBottom:8}}>TOEIC ARENA</h1>
        <p style={{color:"var(--t2)",fontSize:15,marginBottom:40,lineHeight:1.5}}>Train smarter. Climb the ranks.<br/>Conquer the TOEIC.</p>
        <div style={{marginBottom:20,textAlign:"left"}}>
          <label className="out" style={{fontSize:12,fontWeight:600,color:"var(--t2)",textTransform:"uppercase",letterSpacing:1,marginBottom:8,display:"block"}}>Your arena name</label>
          <input type="text" value={name} onChange={function(e){sN(e.target.value);}} placeholder="Enter your name..."
            style={{width:"100%",padding:"14px 18px",background:"var(--bg2)",border:"1px solid var(--bdr)",borderRadius:12,color:"var(--t1)",fontSize:16,fontFamily:"'DM Sans',sans-serif",outline:"none"}}/>
        </div>
        <button className="btn1" onClick={function(){if(name.trim()&&!lookingUp)lookupName(name);}} disabled={lookingUp}
          style={{opacity:name.trim()&&!lookingUp?1:.4,pointerEvents:name.trim()&&!lookingUp?"auto":"none",fontSize:18,padding:"16px 32px"}}>{lookingUp?"Checking...":"Next"}</button>
        <div style={{display:"flex",justifyContent:"center",gap:16,marginTop:20}}>
          <button onClick={function(){sSt("teacher");}} style={{background:"none",border:"none",color:"var(--t3)",fontSize:12,cursor:"pointer",fontFamily:"'DM Sans',sans-serif"}}>Teacher access</button>
        </div>
      </div>
    </div>);

  // ─ Account recognition ─
  if(step==="recognize")return(
    <div className="app" style={{display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",minHeight:"100vh",padding:32,textAlign:"center"}}>
      <div style={{animation:"fadeIn .5s",width:"100%",maxWidth:380}}>
        <div style={{fontSize:48,marginBottom:12}}>👋</div>
        <h2 className="out" style={{fontWeight:800,fontSize:24,marginBottom:6}}>Welcome back, {name.trim()}!</h2>
        <p style={{color:"var(--t2)",fontSize:13,marginBottom:24,lineHeight:1.5}}>We found your account. Select your group to continue:</p>
        <div style={{display:"flex",flexDirection:"column",gap:10,marginBottom:24}}>
          {foundAccounts.map(function(acc){
            return(<button key={acc.class_code} onClick={async function(){
              var ok=await p.recover(name.trim(),acc.class_code);
              if(!ok){sSt("classcode");}
            }} className="crd" style={{display:"flex",alignItems:"center",gap:14,padding:"16px 18px",cursor:"pointer",
              border:"1px solid var(--bdr)",background:"var(--bg2)",borderRadius:16,textAlign:"left",
              transition:"all .2s",fontFamily:"'DM Sans',sans-serif"}}>
              <div style={{width:44,height:44,borderRadius:12,
                background:acc.groupType==="school"?"rgba(212,148,58,.1)":acc.groupType==="pro"?"rgba(200,122,53,.1)":"rgba(139,94,131,.1)",
                display:"flex",alignItems:"center",justifyContent:"center",fontSize:22,flexShrink:0}}>{acc.typeIcon}</div>
              <div style={{flex:1,minWidth:0}}>
                <div className="out" style={{fontWeight:700,fontSize:15,color:"var(--t1)",marginBottom:2}}>{acc.groupName}</div>
                <div style={{fontSize:11,color:"var(--t3)"}}>{acc.class_code} · {acc.xp} XP</div>
              </div>
              <div style={{color:"var(--cyan)",fontSize:16}}>→</div>
            </button>);
          })}
        </div>
        <div style={{position:"relative",margin:"16px 0",display:"flex",alignItems:"center",gap:12}}>
          <div style={{flex:1,height:1,background:"var(--bdr)"}}/>
          <span style={{fontSize:11,color:"var(--t3)",textTransform:"uppercase",letterSpacing:1}} className="out">not you?</span>
          <div style={{flex:1,height:1,background:"var(--bdr)"}}/>
        </div>
        <button className="btn2" onClick={function(){setFoundAccounts([]);sSt("classcode");}}
          style={{width:"100%",fontSize:14,padding:"12px 24px"}}>I'm new — create an account</button>
        <button onClick={function(){sSt("name");}} style={{marginTop:16,background:"none",border:"none",color:"var(--t3)",fontSize:13,cursor:"pointer"}}>← Back</button>
      </div>
    </div>);

  // ─ Class code selection ─
  if(step==="classcode")return(
    <div className="app" style={{display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",minHeight:"100vh",padding:32,textAlign:"center"}}>
      <div style={{animation:"fadeIn .5s"}}>
        <div style={{fontSize:48,marginBottom:16}}>🏫</div>
        <h2 className="out" style={{fontWeight:800,fontSize:24,marginBottom:8}}>Join a Group</h2>
        <p style={{color:"var(--t2)",fontSize:13,marginBottom:24,lineHeight:1.5}}>Enter the class code given by your teacher, or join as a visitor.</p>
        <div style={{marginBottom:16,textAlign:"left"}}>
          <label className="out" style={{fontSize:12,fontWeight:600,color:"var(--t2)",textTransform:"uppercase",letterSpacing:1,marginBottom:8,display:"block"}}>Class code</label>
          <input type="text" value={classCode} onChange={function(e){var v=e.target.value.toLowerCase().replace(/\s/g,'');setClassCode(v);setClassValid(null);setClassGroupName("");}} onBlur={function(){checkGroupCode(classCode);}} placeholder="e.g. idrac2026"
            style={{width:"100%",padding:"14px 18px",background:"var(--bg2)",border:"1px solid "+(classValid===true?"var(--green)":classValid===false?"var(--red)":"var(--bdr)"),borderRadius:12,color:"var(--t1)",fontSize:16,fontFamily:"'DM Sans',sans-serif",outline:"none",transition:"border .2s"}}/>
          {classChecking&&<p style={{fontSize:11,color:"var(--t3)",marginTop:6}}>Checking...</p>}
          {classValid===true&&<p style={{fontSize:12,color:"var(--green)",marginTop:6,fontWeight:600}}>✓ {classGroupName}</p>}
          {classValid===false&&<p style={{fontSize:12,color:"var(--red)",marginTop:6}}>Code not found. Check with your teacher.</p>}
        </div>
        <button className="btn1" onClick={function(){if(classValid)startTest();}}
          style={{opacity:classValid?1:.4,pointerEvents:classValid?"auto":"none",fontSize:16,padding:"14px 28px",marginBottom:12}}>Next — Take Placement Test</button>
        <div style={{position:"relative",margin:"16px 0",display:"flex",alignItems:"center",gap:12}}>
          <div style={{flex:1,height:1,background:"var(--bdr)"}}/>
          <span style={{fontSize:11,color:"var(--t3)",textTransform:"uppercase",letterSpacing:1}} className="out">or</span>
          <div style={{flex:1,height:1,background:"var(--bdr)"}}/>
        </div>
        {!visitorConfirm?<button className="btn2" onClick={function(){setVisitorConfirm(true);}}
          style={{width:"100%",fontSize:14,padding:"12px 24px",borderColor:"rgba(139,94,131,.3)",color:"var(--purple)"}}>🌍 Join as Visitor</button>
        :<div style={{animation:"fadeIn .3s",padding:16,background:"rgba(139,94,131,.08)",border:"1px solid rgba(139,94,131,.2)",borderRadius:14}}>
          <p style={{fontSize:13,color:"var(--t1)",lineHeight:1.6,marginBottom:12}}>⚠️ If your teacher gave you a class code, use it above — otherwise your progress won't appear in your group!</p>
          <div style={{display:"flex",gap:8}}>
            <button className="btn2" onClick={function(){setVisitorConfirm(false);}} style={{flex:1,fontSize:12,padding:"10px 8px"}}>Cancel</button>
            <button className="btn2" onClick={function(){setClassCode("visitor");setClassValid(true);setClassGroupName("Visitor / Free Access");setVisitorConfirm(false);}}
              style={{flex:1,fontSize:12,padding:"10px 8px",borderColor:"rgba(139,94,131,.3)",color:"var(--purple)"}}>Continue as Visitor</button>
          </div>
        </div>}
        <button onClick={function(){sSt("name");}} style={{marginTop:16,background:"none",border:"none",color:"var(--t3)",fontSize:13,cursor:"pointer"}}>← Back</button>
      </div>
    </div>);

// ─ Account recovery ─
  if(step==="recover")return(
    <div className="app" style={{display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",minHeight:"100vh",padding:32,textAlign:"center"}}>
      <div style={{animation:"fadeIn .5s"}}>
        <div style={{fontSize:48,marginBottom:16}}>🔑</div>
        <h2 className="out" style={{fontWeight:800,fontSize:24,marginBottom:8}}>Recover My Account</h2>
        <p style={{color:"var(--t2)",fontSize:13,marginBottom:24,lineHeight:1.5}}>Enter your exact name and class code to recover your progress.</p>
        <div style={{marginBottom:16,textAlign:"left"}}>
          <label className="out" style={{fontSize:12,fontWeight:600,color:"var(--t2)",textTransform:"uppercase",letterSpacing:1,marginBottom:8,display:"block"}}>Your name (exact)</label>
          <input type="text" value={recName} onChange={function(e){setRecName(e.target.value);setRecMsg(null);}} placeholder="Enter your name..."
            style={{width:"100%",padding:"14px 18px",background:"var(--bg2)",border:"1px solid var(--bdr)",borderRadius:12,color:"var(--t1)",fontSize:16,fontFamily:"'DM Sans',sans-serif",outline:"none"}}/>
        </div>
        <div style={{marginBottom:20,textAlign:"left"}}>
          <label className="out" style={{fontSize:12,fontWeight:600,color:"var(--t2)",textTransform:"uppercase",letterSpacing:1,marginBottom:8,display:"block"}}>Class code</label>
          <input type="text" value={recCode} onChange={function(e){setRecCode(e.target.value);setRecMsg(null);}} placeholder="idrac2026"
            style={{width:"100%",padding:"14px 18px",background:"var(--bg2)",border:"1px solid var(--bdr)",borderRadius:12,color:"var(--t1)",fontSize:16,fontFamily:"'DM Sans',sans-serif",outline:"none"}}/>
        </div>
        <button className="btn1" onClick={async function(){
          if(!recName.trim())return;
          setRecLoading(true);setRecMsg(null);
          var ok=await p.recover(recName.trim(),recCode.trim());
          setRecLoading(false);
          if(!ok)setRecMsg("No account found with that name and class code. Check spelling and try again.");
        }} disabled={recLoading}
          style={{opacity:recName.trim()&&!recLoading?1:.4,pointerEvents:recName.trim()&&!recLoading?"auto":"none"}}>
          {recLoading?"Searching...":"Recover Account"}</button>
        {recMsg&&<p style={{color:"var(--red)",fontSize:12,marginTop:12,lineHeight:1.5}}>{recMsg}</p>}
        <button onClick={function(){sSt("name");}} style={{marginTop:16,background:"none",border:"none",color:"var(--t3)",fontSize:13,cursor:"pointer"}}>Back to sign up</button>
      </div>
    </div>);
  // ─ Teacher login ─
  if(step==="teacher")return(
    <div className="app" style={{display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",minHeight:"100vh",padding:32,textAlign:"center"}}>
      <div style={{animation:"fadeIn .5s"}}>
        <div style={{fontSize:48,marginBottom:16}}>👨‍🏫</div>
        <h2 className="out" style={{fontWeight:800,fontSize:24,marginBottom:20}}>Teacher Dashboard</h2>
        <div style={{marginBottom:20,textAlign:"left"}}>
          <label className="out" style={{fontSize:12,fontWeight:600,color:"var(--t2)",textTransform:"uppercase",letterSpacing:1,marginBottom:8,display:"block"}}>Access code</label>
          <input type="password" value={teacherCode} onChange={function(e){sTC(e.target.value);}} placeholder="Enter teacher code..."
            style={{width:"100%",padding:"14px 18px",background:"var(--bg2)",border:"1px solid var(--bdr)",borderRadius:12,color:"var(--t1)",fontSize:16,fontFamily:"'DM Sans',sans-serif",outline:"none"}}/>
        </div>
        <button className="btn1" onClick={function(){if(teacherCode===TEACHER_CODE)p.goTeacher();}}
          style={{opacity:teacherCode?1:.4,pointerEvents:teacherCode?"auto":"none"}}>Access Dashboard</button>
        {teacherCode&&teacherCode!==TEACHER_CODE&&teacherCode.length>=4&&<p style={{color:"var(--red)",fontSize:12,marginTop:8}}>Invalid code</p>}
        <button onClick={function(){sSt("name");}} style={{marginTop:16,background:"none",border:"none",color:"var(--t3)",fontSize:13,cursor:"pointer"}}>Back to student login</button>
      </div>
    </div>);

  // ─ Results ─
  if(step==="results")return(
    <div className="app" style={{display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",minHeight:"100vh",padding:32,textAlign:"center"}}>
      <div style={{animation:"fadeIn .5s"}}>
        <div style={{fontSize:56,marginBottom:12,animation:"countUp .6s"}}>{sc>=13?"🏆":sc>=9?"⚔️":sc>=5?"🛡️":"📚"}</div>
        <h2 className="out" style={{fontWeight:900,fontSize:28,marginBottom:4}}>Placement Result</h2>
        <div className="out" style={{fontSize:48,fontWeight:900,color:"var(--cyan)",marginBottom:8,animation:"countUp .8s"}}>{sc}/15</div>
        <div style={{display:"inline-block",padding:"6px 16px",borderRadius:99,background:"rgba(212,148,58,.1)",border:"1px solid rgba(212,148,58,.2)",marginBottom:12}}>
          <span className="out" style={{fontWeight:800,fontSize:16,color:"var(--cyan)"}}>{lvl.label}</span>
        </div>
        <p style={{color:"var(--t2)",fontSize:14,lineHeight:1.6,marginBottom:8}}>{lvl.msg}</p>
        <p style={{color:"var(--gold)",fontSize:13,fontWeight:600,marginBottom:32}}>Starting with {lvl.startXp} XP in {lvl.league.charAt(0).toUpperCase()+lvl.league.slice(1)} League</p>
        <button className="btn1" onClick={function(){playArenaCall();p.go(name.trim(),classCode||'visitor',sc,lvl);}} style={{fontSize:18,padding:"16px 32px"}}>Enter the Arena</button>
      </div>
    </div>);

  // ─ Placement Test ─
  var q=PLACEMENT_TEST[ci];
  return(
    <div className="app" style={{padding:"20px 16px",minHeight:"100vh"}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:20}}>
        <div><p className="out" style={{fontWeight:700,fontSize:14,color:"var(--t1)"}}>Placement Test</p>
          <p style={{fontSize:11,color:"var(--t3)"}}>Question {ci+1} of 15</p></div>
        <div style={{display:"flex",alignItems:"center",gap:3}}>
          {PLACEMENT_TEST.map(function(q,i){
            var col=i<ci?"var(--green)":i===ci?"var(--cyan)":"var(--t3)";
            return (<div key={i} style={{width:i===ci?14:6,height:5,borderRadius:3,background:col,transition:"all .3s"}}/>);
          })}
        </div>
      </div>
      <Bar value={ci} max={15} h={4} color="linear-gradient(90deg,#d4943a,#8b5e83)"/>

      <div style={{display:"flex",gap:4,marginTop:12,marginBottom:4}}>
        {[1,2,3,4,5].map(function(d){
          var active=q.diff===d;
          return (<div key={d} style={{width:8,height:8,borderRadius:"50%",background:active?"var(--gold)":"var(--t3)",opacity:active?1:.3}}/>);
        })}
        <span style={{fontSize:10,color:"var(--t3)",marginLeft:4}} className="out">Difficulty {q.diff}/5</span>
      </div>

      <h2 className="out" style={{fontWeight:700,fontSize:19,lineHeight:1.5,marginBottom:24,marginTop:16}}>{q.s}</h2>

      <div style={{display:"flex",flexDirection:"column",gap:8}}>
        {q.o.map(function(opt,i){
          var isCor=i===q.c;var isPick=sel===i;var show=ph==="fb";
          var bg="var(--bg2)";var bd="var(--bdr)";
          if(show&&isCor){bg="rgba(0,230,118,.12)";bd="var(--green)";}
          else if(show&&isPick&&!isCor){bg="rgba(255,71,87,.12)";bd="var(--red)";}
          return(<button key={i} onClick={function(){if(ph==="q")doAns(i);}} disabled={show}
            style={{display:"flex",alignItems:"center",gap:12,padding:"14px 16px",background:bg,border:"1px solid "+bd,borderRadius:12,cursor:ph==="q"?"pointer":"default",fontSize:15,color:"var(--t1)",textAlign:"left",fontFamily:"'DM Sans',sans-serif",transition:"all .2s"}}>
            <div style={{width:28,height:28,borderRadius:"50%",border:"2px solid "+(show&&isCor?"var(--green)":show&&isPick?"var(--red)":"var(--t3)"),display:"flex",alignItems:"center",justifyContent:"center",fontSize:12,fontWeight:700,flexShrink:0,background:show&&isCor?"var(--green)":show&&isPick&&!isCor?"var(--red)":"transparent",color:show&&(isCor||isPick)?"#fff":"var(--t3)"}}>
              {show&&isCor?"✓":show&&isPick?"✗":String.fromCharCode(65+i)}</div>
            <span>{opt}</span></button>);})}
      </div>

      {ph==="fb"&&<div style={{marginTop:16,animation:"fadeIn .3s"}}>
        <div className="crd" style={{background:"rgba(212,148,58,.06)",borderColor:"rgba(212,148,58,.15)",padding:14}}>
          <p style={{fontSize:13,color:"var(--t2)",lineHeight:1.6}}>{q.x}</p></div>
        <button className="btn1" onClick={nxt} style={{marginTop:14}}>{ci<14?"Next":"See Results"}</button>
      </div>}
    </div>);
}
// ─── HOME ───
function Home(p){var u=p.u,lv=getLevel(u.xp),lg=getLeague(u.weeklyXp),dd=u.daily.date===today()&&u.daily.done;return(
<div className="enter" style={{padding:"20px 16px 100px"}}>
<div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:24}}>
<div><p style={{color:"var(--t2)",fontSize:13,marginBottom:2}}>Welcome back</p><h1 className="out" style={{fontWeight:800,fontSize:24}}>{u.name} {u.avatar||"⚔️"}</h1></div>
<div style={{textAlign:"center"}}><span className="fl" style={{fontSize:28}}>{u.streak>0?"🔥":"❄️"}</span><div className="out" style={{fontSize:13,fontWeight:700,color:u.streak>0?"var(--orange)":"var(--t3)"}}>{u.streak}</div></div></div>

{/* Active bonus indicators */}
{function(){
  var pills=[];var dow=new Date().getDay();
  if(dow===0||dow===6)pills.push({label:"x2 Weekend",col:"#ff6bff",icon:"🎉"});
  if(u.streak>=7)pills.push({label:"x1.5 Streak",col:"#ff8c42",icon:"🔥"});
  else if(u.streak>=3)pills.push({label:"x1.2 Streak",col:"#ff8c42",icon:"🔥"});
  if(u.lastActive!==today())pills.push({label:"+10 Login bonus",col:"#00e676",icon:"🎁"});
  if(p.events)p.events.forEach(function(ev){
    var cfg=ev.config||{};var m=cfg.multiplier||2;
    if(ev.type==="spotlight")pills.push({label:"x"+m+" "+((cfg.module||"").charAt(0).toUpperCase()+(cfg.module||"").slice(1)),col:"#d4943a",icon:"🎯"});
    if(ev.type==="flash_hour")pills.push({label:"x"+m+" Flash",col:"#f0c850",icon:"⚡"});
    if(ev.type==="underdog"&&p.u.xp<(p.medianXp||0))pills.push({label:"x"+m+" Underdog",col:"#4abe60",icon:"💪"});
  });
  if(pills.length===0)return null;
  return(<div style={{display:"flex",gap:6,marginBottom:14,flexWrap:"wrap"}}>
    {pills.map(function(p,i){return (<div key={i} style={{display:"flex",alignItems:"center",gap:4,padding:"4px 10px",borderRadius:99,background:p.col+"15",border:"1px solid "+p.col+"30",fontSize:11,fontWeight:600,color:p.col}} className="out"><span style={{fontSize:12}}>{p.icon}</span>{p.label}</div>);})}
  </div>);
}()}

{/* Active Events Banner */}
{p.events&&p.events.length>0&&p.events.map(function(ev,ei){
  var cfg=ev.config||{};var m=cfg.multiplier||2;
  var end=new Date(ev.end_at);var now=new Date();var hoursLeft=Math.max(0,Math.round((end-now)/36e5));
  var timeLabel=hoursLeft>=24?Math.floor(hoursLeft/24)+"d "+hoursLeft%24+"h left":hoursLeft+"h left";
  var icon=ev.type==="spotlight"?"🎯":ev.type==="flash_hour"?"⚡":"💪";
  var bg=ev.type==="spotlight"?"rgba(212,148,58,.1)":ev.type==="flash_hour"?"rgba(240,200,80,.12)":"rgba(74,190,96,.1)";
  var bd=ev.type==="spotlight"?"rgba(212,148,58,.25)":ev.type==="flash_hour"?"rgba(240,200,80,.3)":"rgba(74,190,96,.25)";
  var col=ev.type==="spotlight"?"var(--cyan)":ev.type==="flash_hour"?"var(--gold)":"var(--green)";
  var isUnderdog=ev.type==="underdog";
  var qualifies=!isUnderdog||p.u.xp<(p.medianXp||0);
  return(<div key={ei} className="crd" style={{marginBottom:12,padding:14,background:bg,border:"1px solid "+bd,animation:"pulse 3s infinite"}}>
    <div style={{display:"flex",alignItems:"center",gap:10}}>
      <span style={{fontSize:24}}>{icon}</span>
      <div style={{flex:1}}>
        <div className="out" style={{fontWeight:700,fontSize:14,color:col}}>{ev.title}</div>
        <div style={{fontSize:11,color:"var(--t2)",marginTop:2}}>{ev.description||(ev.type==="spotlight"?"x"+m+" XP on "+cfg.module:ev.type==="flash_hour"?"x"+m+" XP on everything":"x"+m+" XP if below class median")}</div>
        {isUnderdog&&!qualifies&&<div style={{fontSize:10,color:"var(--t3)",marginTop:2}}>You are above the median</div>}
      </div>
      <div style={{textAlign:"right"}}><div className="out" style={{fontSize:12,fontWeight:700,color:col}}>{timeLabel}</div></div>
    </div>
  </div>);
})}

<div className="crd glo" style={{marginBottom:16}}>
<div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10}}>
<div style={{display:"flex",alignItems:"center",gap:10}}>
<div style={{width:40,height:40,borderRadius:"50%",background:"linear-gradient(135deg,#d4943a,#a06e20)",display:"flex",alignItems:"center",justifyContent:"center",fontWeight:900,fontSize:16}} className="out">{lv.level}</div>
<div><div className="out" style={{fontSize:13,fontWeight:700}}>Level {lv.level}</div><div style={{fontSize:11,color:"var(--t2)"}}>{lv.cur} / {lv.next} XP</div></div></div>
<div style={{display:"flex",alignItems:"center",gap:6,padding:"4px 12px",background:"var(--bg3)",borderRadius:99}}>
<span style={{fontSize:16}}>{lg.icon}</span><span className="out" style={{fontSize:12,fontWeight:600,color:lg.color}}>{lg.name}</span></div></div>
<Bar value={lv.cur} max={lv.next} h={6}/></div>

<div className="crd" onClick={function(){if(!dd)p.nav("daily");}} style={{marginBottom:16,cursor:dd?"default":"pointer",background:dd?"var(--bg2)":"linear-gradient(135deg,rgba(212,148,58,.12),rgba(139,94,131,.12))",border:dd?"1px solid var(--bdr)":"1px solid rgba(212,148,58,.2)"}}>
<div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
<div><div style={{display:"flex",alignItems:"center",gap:8,marginBottom:6}}><span style={{fontSize:20}}>{dd?"✅":"⚡"}</span><span className="out" style={{fontWeight:700,fontSize:16}}>Daily Challenge</span></div>
{dd?<p style={{color:"var(--green)",fontSize:13,fontWeight:600}}>Completed! +{u.daily.xpE} XP</p>:<p style={{color:"var(--t2)",fontSize:13}}>5 questions · 30s each · Bonus XP</p>}</div>
{!dd&&<div style={{fontSize:24,color:"var(--cyan)"}}>{"→"}</div>}</div></div>

{/* Daily Mission — adaptive recommendation */}
{function(){
  var mission=getDailyMission(u);
  if(!mission)return null;

  if(mission.status==="calibrating"){
    return(<div className="crd" style={{marginBottom:16,padding:14,background:"var(--bg3)"}}>
      <div style={{display:"flex",alignItems:"center",gap:10}}>
        <span style={{fontSize:20}}>🎯</span>
        <div><div className="out" style={{fontWeight:700,fontSize:14,color:"var(--t3)"}}>Daily Mission</div>
          <div style={{fontSize:12,color:"var(--t3)"}}>Complete {mission.remaining} more sessions to unlock personalized missions</div></div>
      </div>
      <div style={{marginTop:8}}><Bar value={u.stats.sessions||0} max={MISSION_THRESHOLD} h={4} color="var(--t3)"/></div>
    </div>);
  }

  // Initialize mission in userData if new
  if(mission.status==="new"&&u.mission.date!==today()){
    u.mission={date:today(),actId:mission.actId,done:false};
    save(u);
  }

  var m=mission.mod;
  if(!m)return null;
  var isDone=mission.status==="completed"||mission.done;

  return(<div className="crd" onClick={function(){if(!isDone)p.nav(mission.actId);}}
    style={{marginBottom:16,cursor:isDone?"default":"pointer",padding:0,overflow:"hidden",
      background:isDone?"var(--bg2)":"linear-gradient(135deg,rgba(255,215,0,.06),rgba(255,140,66,.06))",
      border:isDone?"1px solid var(--bdr)":"1px solid rgba(255,215,0,.15)"}}>
    <div style={{padding:"14px 16px"}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
        <div style={{display:"flex",alignItems:"center",gap:10}}>
          <span style={{fontSize:20}}>{isDone?"✅":m.icon}</span>
          <div>
            <div style={{display:"flex",alignItems:"center",gap:6}}>
              <span className="out" style={{fontWeight:700,fontSize:14,color:isDone?"var(--green)":"var(--t1)"}}>Daily Mission</span>
              {!isDone&&<span style={{fontSize:9,padding:"2px 6px",borderRadius:4,background:"rgba(255,215,0,.12)",color:"var(--gold)",fontWeight:700}} className="out">+15 XP</span>}
            </div>
            <div style={{fontSize:12,color:isDone?"var(--green)":"var(--t2)",marginTop:2}}>
              {isDone?"Mission complete! +15 XP bonus":m.name+" — "+mission.reason}
            </div>
          </div>
        </div>
        {!isDone&&<span style={{fontSize:18,color:"var(--gold)"}}>{"→"}</span>}
      </div>
    </div>
  </div>);
}()}

<div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:10,marginBottom:16}}>
{[{l:"Total XP",v:u.xp,i:"⭐",c:"var(--gold)"},{l:"This week",v:u.weeklyXp,i:"📈",c:"var(--cyan)"},{l:"Sessions",v:u.stats.sessions,i:"🎯",c:"var(--purple)"}].map(function(s){return(
<div key={s.l} className="crd" style={{padding:14,textAlign:"center"}}><div style={{fontSize:20,marginBottom:4}}>{s.i}</div><div className="out" style={{fontSize:20,fontWeight:800,color:s.c}}>{s.v}</div><div style={{fontSize:10,color:"var(--t2)",textTransform:"uppercase",letterSpacing:.5}}>{s.l}</div></div>);})}</div>

<h2 className="out" style={{fontWeight:700,fontSize:16,marginBottom:12,color:"var(--t2)"}}>Quick Start</h2>
<div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
<div className="crd" style={{cursor:"pointer",padding:16}} onClick={function(){p.nav("csess");}}><div style={{fontSize:28,marginBottom:8}}>🃏</div><div className="out" style={{fontWeight:700,fontSize:14}}>Review Cards</div><div style={{fontSize:11,color:"var(--t2)",marginTop:4}}>SRS flashcards</div></div>
<div className="crd" style={{cursor:"pointer",padding:16}} onClick={function(){p.nav("drill");}}><div style={{fontSize:28,marginBottom:8}}>📝</div><div className="out" style={{fontWeight:700,fontSize:14}}>Grammar Drill</div><div style={{fontSize:11,color:"var(--t2)",marginTop:4}}>Part 5 practice</div></div></div>

{/* Strategy Tip of the Day */}
{function(){
  var allTips=[];STRATEGIES.forEach(function(s){s.tips.forEach(function(t){allTips.push({tip:t,part:s.part,icon:s.icon});});});
  var dayIndex=0;var d=today();for(var i=0;i<d.length;i++)dayIndex+=d.charCodeAt(i);
  var todayTip=allTips[dayIndex%allTips.length];
  return(<div style={{marginTop:20}}>
    <div className="crd" style={{padding:0,overflow:"hidden",border:"1px solid rgba(180,140,80,.12)",background:"linear-gradient(160deg,rgba(180,140,80,.06) 0%,rgba(139,94,131,.04) 100%)"}}>
      <div style={{padding:"16px 18px 14px"}}>
        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:12}}>
          <div style={{display:"flex",alignItems:"center",gap:8}}>
            <span style={{fontSize:16}}>{todayTip.icon}</span>
            <span className="out" style={{fontSize:10,fontWeight:700,color:"var(--cyan)",textTransform:"uppercase",letterSpacing:1}}>Tip of the day — {todayTip.part}</span>
          </div>
          <span style={{fontSize:10,color:"var(--t3)"}}>💡</span>
        </div>
        <p className="out" style={{fontWeight:700,fontSize:14,color:"var(--t1)",lineHeight:1.5,marginBottom:6}}>{todayTip.tip.t}</p>
        <p style={{fontSize:12,color:"var(--t2)",lineHeight:1.5}}>{todayTip.tip.d}</p>
      </div>
      <button onClick={function(){p.nav("strats");}}
        style={{width:"100%",padding:"10px 18px",background:"rgba(180,140,80,.06)",borderTop:"1px solid rgba(180,140,80,.08)",border:"none",borderTop:"1px solid rgba(180,140,80,.08)",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",gap:6}}>
        <span style={{fontSize:12,color:"var(--cyan)",fontWeight:600}} className="out">All 54 strategies</span>
        <span style={{fontSize:12,color:"var(--cyan)"}}>{"→"}</span>
      </button>
    </div>
  </div>);
}()}

</div>);}

// ─── DAILY CHALLENGE ───
function Daily(p){
var qs=useMemo(function(){return dailyQs(today(),p.u);},[]);var[ci,sC]=useState(0);var[sel,sS]=useState(-1);var[sc,sSc]=useState(0);var[ph,sP]=useState("intro");var[tl,sT]=useState(30);var[sk,sSk]=useState(false);var tr=useRef(null);var answered=useRef(false);
// Guard: only block if daily was ALREADY done when component mounted (not if completed during this session)
var wasAlreadyDone=useRef(p.u.daily&&p.u.daily.date===today()&&p.u.daily.done);
if(wasAlreadyDone.current)return(<div className="enter" style={{padding:"20px 16px",minHeight:"100vh",display:"flex",flexDirection:"column",justifyContent:"center",textAlign:"center"}}>
<div style={{fontSize:64,marginBottom:20}}>✅</div><h1 className="out" style={{fontWeight:900,fontSize:28,marginBottom:8}}>Already completed!</h1>
<p style={{color:"var(--t2)",marginBottom:8}}>Your daily challenge is done. Come back tomorrow!</p>
<p style={{color:"var(--gold)",fontWeight:600,marginBottom:40,fontSize:14}}>Score: {p.u.daily.score}/5 · +{p.u.daily.xpE} XP</p>
<button className="btn1" onClick={p.back}>Back</button></div>);
useEffect(function(){
  if(ph==="q"&&tl>0){tr.current=setTimeout(function(){sT(tl-1);},1000);return function(){clearTimeout(tr.current);};}
  if(ph==="q"&&tl===0&&!answered.current){answered.current=true;clearTimeout(tr.current);sS(-1);sSk(true);setTimeout(function(){sSk(false);},500);sP("fb");}
});
function doAns(i){answered.current=true;clearTimeout(tr.current);sS(i);if(i===qs[ci].c){sSc(sc+1);try{playCorrect();}catch(e){}}else{try{playWrong();}catch(e){}sSk(true);setTimeout(function(){sSk(false);},500);}sP("fb");}
function nxt(){answered.current=false;if(ci<qs.length-1){sC(ci+1);sS(-1);sT(30);sP("q");}else{sP("done");var xp=30+sc*14+(sc===5?20:0);p.done(sc,xp);}}

if(ph==="intro")return(<div className="enter" style={{padding:"20px 16px",minHeight:"100vh",display:"flex",flexDirection:"column",justifyContent:"center",textAlign:"center"}}>
<div style={{fontSize:64,marginBottom:20,animation:"pulse 2s infinite"}}>⚡</div><h1 className="out" style={{fontWeight:900,fontSize:28,marginBottom:8}}>Daily Challenge</h1>
<p style={{color:"var(--t2)",marginBottom:8}}>5 grammar questions · 30 seconds each</p><p style={{color:"var(--gold)",fontWeight:600,marginBottom:40,fontSize:14}}>Up to 100 XP + Perfect Bonus!</p>
<button className="btn1" onClick={function(){sP("q");}}>Start Challenge</button><button className="btn2" onClick={p.back} style={{marginTop:12,width:"100%"}}>Back</button></div>);

if(ph==="done"){var fx=30+sc*14+(sc===5?20:0);return(<div className="enter" style={{padding:"20px 16px",minHeight:"100vh",display:"flex",flexDirection:"column",justifyContent:"center",textAlign:"center"}}>
<div style={{fontSize:64,marginBottom:16,animation:"countUp .6s"}}>{sc===5?"👑":sc>=3?"⚔️":"🛡️"}</div><h1 className="out" style={{fontWeight:900,fontSize:32,marginBottom:8}}>{sc===5?"FLAWLESS!":sc>=4?"Great fight!":sc>=3?"Not bad!":"Keep training!"}</h1>
<div className="out" style={{fontSize:48,fontWeight:900,color:"var(--cyan)",marginBottom:4,animation:"countUp .8s"}}>{sc}/5</div>
<div className="out" style={{fontSize:22,fontWeight:800,color:"var(--gold)",marginBottom:32}}>+{fx} XP</div>
{sc===5&&<p style={{color:"var(--gold)",marginBottom:16,fontWeight:600}}>Perfect bonus: +20 XP!</p>}<button className="btn1" onClick={p.back}>Back to Home</button></div>);}

var q=qs[ci],tc=tl>15?"var(--cyan)":tl>5?"var(--orange)":"var(--red)";
return(<div className={sk?"sk":""} style={{padding:"20px 16px",minHeight:"100vh"}}>
<div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:24}}>
<button onClick={p.back} style={{background:"none",border:"none",color:"var(--t2)",fontSize:14,cursor:"pointer"}}>Quit</button>
<div style={{display:"flex",gap:6}}>{[0,1,2,3,4].map(function(i){return (<div key={i} style={{width:i===ci?24:8,height:8,borderRadius:4,background:i<ci?"var(--green)":i===ci?"var(--cyan)":"var(--t3)",transition:"all .3s"}}/>);})}</div>
<div className="out" style={{fontSize:20,fontWeight:800,color:tc,minWidth:32,textAlign:"right"}}>{tl}</div></div>
<div style={{width:"100%",height:3,background:"var(--bg3)",borderRadius:2,marginBottom:32,overflow:"hidden"}}><div style={{width:(tl/30*100)+"%",height:"100%",background:tc,borderRadius:2,transition:"width 1s linear"}}/></div>
<span className="out" style={{fontSize:11,fontWeight:600,color:"var(--cyan)",textTransform:"uppercase",letterSpacing:1}}>{q.cat}</span>
<h2 className="out" style={{fontWeight:700,fontSize:20,lineHeight:1.5,marginBottom:28,marginTop:8}}>{q.s}</h2>
<div style={{display:"flex",flexDirection:"column",gap:10}}>{q.o.map(function(opt,i){var iS=sel===i,iC=i===q.c,sr=ph==="fb",bg="var(--bg2)",bd="var(--bdr)";
if(sr&&iC){bg="rgba(0,230,118,.12)";bd="var(--green)";}else if(sr&&iS&&!iC){bg="rgba(255,71,87,.12)";bd="var(--red)";}
return(<button key={i} onClick={function(){if(ph==="q")doAns(i);}} disabled={ph==="fb"} style={{display:"flex",alignItems:"center",gap:12,padding:"14px 16px",background:bg,border:"1px solid "+bd,borderRadius:12,cursor:ph==="q"?"pointer":"default",fontSize:15,color:"var(--t1)",textAlign:"left",transition:"all .2s",fontFamily:"'DM Sans',sans-serif"}}>
<div style={{width:28,height:28,borderRadius:"50%",border:"2px solid "+(sr&&iC?"var(--green)":sr&&iS?"var(--red)":"var(--t3)"),display:"flex",alignItems:"center",justifyContent:"center",fontSize:12,fontWeight:700,flexShrink:0,background:sr&&iC?"var(--green)":sr&&iS&&!iC?"var(--red)":"transparent",color:sr&&(iC||iS)?"#fff":"var(--t3)"}}>
{sr&&iC?"✓":sr&&iS?"✗":String.fromCharCode(65+i)}</div><span>{opt}</span></button>);})}</div>
{ph==="fb"&&<div style={{marginTop:20,animation:"fadeIn .3s ease-out"}}><div className="crd" style={{background:"rgba(212,148,58,.06)",borderColor:"rgba(212,148,58,.15)",padding:16}}><p style={{fontSize:13,color:"var(--t2)",lineHeight:1.6}}>{q.x}</p></div>
<button className="btn1" onClick={nxt} style={{marginTop:16}}>{ci<qs.length-1?"Next Question":"See Results"}</button></div>}</div>);}

// ─── TRAIN PAGE ───
  function Train(p){
  var dd=p.u.daily&&p.u.daily.date===today()&&p.u.daily.done;
  var sections=[
    {title:"Exercises",sub:"TOEIC Parts training",items:[
      {id:"daily",n:"Daily Challenge",d:dd?"Completed today ✓":"5 daily questions, timed",i:"⚡",bg:dd?"var(--bg3)":"linear-gradient(135deg,#d4943a,#8b5e83)",lock:dd},
      {id:"lis",n:"Listening Practice",d:"Parts 1-4 with audio",i:"👂",bg:"linear-gradient(135deg,#22c55e,#f59e0b)"},
      {id:"read",n:"Reading Practice",d:"Parts 5-7",i:"📖",bg:"linear-gradient(135deg,#5a7a9a,#7a5a80)"},
    ]},
    {title:"Grammar & Vocabulary",sub:"Build your foundations",items:[
      {id:"csess",n:"Flashcard Review",d:"SRS spaced repetition",i:"🃏",bg:"linear-gradient(135deg,#ff8c42,#ff6b35)"},
      {id:"wordfam",n:"Word Families",d:"Classify: Noun, Verb, Adj, Adv",i:"🧩",bg:"linear-gradient(135deg,#f59e0b,#ef4444)"},
      {id:"connsort",n:"Connectors Sorting",d:"Clause, Noun, or New sentence?",i:"🔀",bg:"linear-gradient(135deg,#8b5e83,#c4587a)"},
      {id:"prepdrill",n:"Preposition Collocations",d:"Study + Drill mode",i:"🎯",bg:"linear-gradient(135deg,#06b6d4,#22c55e)"},
      {id:"gerinf",n:"Gerund vs Infinitive",d:"4 patterns · Study + Context Quiz",i:"⚖️",bg:"linear-gradient(135deg,#e11d48,#f59e0b)"},
      {id:"falsefr",n:"False Friends",d:"FR/EN traps: actually ≠ actuellement",i:"🎭",bg:"linear-gradient(135deg,#ec4899,#f59e0b)"},
      {id:"pvdojo",n:"Phrasal Verb Dojo",d:"55 verbs · Study, Match & Speed",i:"⚔️",bg:"linear-gradient(135deg,#f97316,#dc2626)"},
    ]},
    {title:"Mock Exam",sub:"Test yourself under real conditions",items:(function(){
      var items=[];
      var u1=canUnlockMock(p.u,1);
      items.push({id:"mock1",n:"Mock Test 1",d:u1.ok?"Reading Half-Test · 49 Q · 37 min":u1.reasons[0],i:"📜",bg:u1.ok?"linear-gradient(135deg,#ffd700,#ff8c42)":"var(--bg3)",lock:!u1.ok,mockId:1});
      var u2=canUnlockMock(p.u,2);
      items.push({id:"mock2",n:"Mock Test 2",d:u2.ok?"Reading Half-Test · 49 Q · 37 min":u2.reasons[0],i:"📜",bg:u2.ok?"linear-gradient(135deg,#8b5e83,#c4587a)":"var(--bg3)",lock:!u2.ok,mockId:2});
	  var u3=canUnlockMock(p.u,3);
	  items.push({id:"mock3",n:"Mock Test 3",d:u3.ok?"Reading Half-Test · 48 Q · 37 min":u3.reasons[0],i:"📜",bg:u3.ok?"linear-gradient(135deg,#22c55e,#06b6d4)":"var(--bg3)",lock:!u3.ok,mockId:3});
      // Show completed badge
      if(p.u.mockResults&&p.u.mockResults.mock1){items[0].d="Completed — TOEIC "+p.u.mockResults.mock1.toeicEstimate+"/495";items[0].lock=true;items[0].bg="var(--bg3)";}
      if(p.u.mockResults&&p.u.mockResults.mock2){items[1].d="Completed — TOEIC "+p.u.mockResults.mock2.toeicEstimate+"/495";items[1].lock=true;items[1].bg="var(--bg3)";}
      return items;
    })()},
    {title:"Tips & Strategies",sub:"Master the exam itself",items:[
      {id:"strats",n:"Strategy Cards",d:"54 expert tips, all Parts",i:"🗺️",bg:"linear-gradient(135deg,#6a8a50,#4a7a5a)"},
      {id:"stratquiz",n:"Strategy Quiz",d:"Test your exam IQ",i:"🧠",bg:"linear-gradient(135deg,#8b5e83,#5a5c8a)"},
      {id:"traps",n:"TOEIC Traps Quiz",d:"Spot the 20 classic traps",i:"🪤",bg:"linear-gradient(135deg,#ef4444,#f59e0b)"},
      {id:"gramref",n:"Grammar Reference",d:"12 essential grammar sheets",i:"📖",bg:"linear-gradient(135deg,#5a7a9a,#7a5a80)"},
    ]},
  ];
  var animIdx=0;
  return(<div className="enter" style={{padding:"20px 16px 100px"}}>
    <h1 className="out" style={{fontWeight:800,fontSize:24,marginBottom:4}}>Training Grounds</h1>
    <p style={{color:"var(--t2)",fontSize:13,marginBottom:20}}>Choose your battle</p>

    {sections.map(function(sec,si){
      return (<div key={si} style={{marginBottom:24}}>
        <div style={{display:"flex",alignItems:"baseline",gap:8,marginBottom:10}}>
          <h2 className="out" style={{fontWeight:800,fontSize:15,color:"var(--t1)"}}>{sec.title}</h2>
          <span style={{fontSize:11,color:"var(--t3)"}}>{sec.sub}</span>
        </div>
        <div style={{display:"flex",flexDirection:"column",gap:8}}>
          {sec.items.map(function(m){
            var ai=animIdx++;
            return (
              <div key={m.id} className="crd" onClick={function(){if(!m.lock)p.nav(m.id);}}
                style={{display:"flex",alignItems:"center",gap:14,cursor:m.lock?"default":"pointer",opacity:m.lock?.4:1,padding:"14px 16px",animation:"fadeIn .3s ease-out",animationDelay:(ai*.04)+"s",animationFillMode:"both"}}>
                <div style={{width:42,height:42,borderRadius:12,background:m.bg,display:"flex",alignItems:"center",justifyContent:"center",fontSize:20,flexShrink:0}}>{m.i}</div>
                <div style={{flex:1,minWidth:0}}>
                  <div className="out" style={{fontWeight:700,fontSize:14,marginBottom:1}}>{m.n}</div>
                  <div style={{fontSize:11,color:"var(--t3)"}}>{m.d}</div>
                </div>
                {m.lock?<span style={{fontSize:16}}>🔒</span>:<span style={{fontSize:16,color:"var(--cyan)"}}>{"→"}</span>}
              </div>);
          })}
        </div>
      </div>);
    })}
  </div>);
}

// ─── CARDS PAGE ───
function Cards(p){var all=[];VOCAB.forEach(function(d){d.cards.forEach(function(c){all.push(c);});});var dc=dueCards(p.u.cardStates,all);var mc=0;Object.keys(p.u.cardStates).forEach(function(k){if(p.u.cardStates[k].interval>=7)mc++;});
return(<div className="enter" style={{padding:"20px 16px 100px"}}><h1 className="out" style={{fontWeight:800,fontSize:24,marginBottom:4}}>Flashcards</h1><p style={{color:"var(--t2)",fontSize:13,marginBottom:20}}>Spaced repetition vocabulary</p>
<div className="crd glo" style={{marginBottom:20,padding:16}}>
<div style={{display:"flex",justifyContent:"space-between",marginBottom:12}}>
<div><div style={{fontSize:11,color:"var(--t2)",textTransform:"uppercase",letterSpacing:.5}}>Mastered</div><div className="out" style={{fontWeight:800,fontSize:22,color:"var(--green)"}}>{mc}/{all.length}</div></div>
<div style={{textAlign:"center"}}><div style={{fontSize:11,color:"var(--t2)",textTransform:"uppercase",letterSpacing:.5}}>Due today</div><div className="out" style={{fontWeight:800,fontSize:22,color:dc.length>0?"var(--orange)":"var(--green)"}}>{dc.length}</div></div>
<div style={{textAlign:"right"}}><div style={{fontSize:11,color:"var(--t2)",textTransform:"uppercase",letterSpacing:.5}}>Reviews</div><div className="out" style={{fontWeight:800,fontSize:22,color:"var(--cyan)"}}>{p.u.stats.cardsRev||0}</div></div></div>
<Bar value={mc} max={all.length} h={6} color="linear-gradient(90deg,#4abe60,#3a9a70)"/></div>
{dc.length>0&&<button className="btn1" onClick={function(){p.nav("csess");}} style={{marginBottom:20}}>Review {dc.length} cards</button>}
<h2 className="out" style={{fontWeight:700,fontSize:15,color:"var(--t2)",marginBottom:12}}>Vocabulary Domains</h2>
<div style={{display:"flex",flexDirection:"column",gap:10}}>{VOCAB.map(function(dom){var ms=0;dom.cards.forEach(function(c){var s=p.u.cardStates[c.id];if(s&&s.interval>=7)ms++;});
return(<div key={dom.id} className="crd" onClick={function(){p.nav("cdom",dom.id);}} style={{display:"flex",alignItems:"center",gap:14,cursor:"pointer",padding:"14px 16px"}}>
<div style={{width:42,height:42,borderRadius:12,background:dom.col+"22",display:"flex",alignItems:"center",justifyContent:"center",fontSize:22,flexShrink:0}}>{dom.icon}</div>
<div style={{flex:1,minWidth:0}}><div className="out" style={{fontWeight:600,fontSize:14}}>{dom.name}</div><div style={{fontSize:11,color:"var(--t2)"}}>{ms}/{dom.cards.length} mastered</div></div>
<div style={{width:48}}><Bar value={ms} max={dom.cards.length} h={4} color={dom.col}/></div></div>);})}</div></div>);}

// ─── FLASHCARD SESSION ───
function CardSess(p){var all=[];if(p.domId){var dom=VOCAB.find(function(d){return d.id===p.domId;});if(dom)all=dom.cards;}else{VOCAB.forEach(function(d){d.cards.forEach(function(c){all.push(c);});});}
// Domain-specific = show ALL cards (study mode). Global = SRS due only.
var rev=useMemo(function(){return p.domId?shuffle(all):dueCards(p.u.cardStates,all);},[]);var[ci,sC]=useState(0);var[fl,sF]=useState(false);var[done,sD]=useState(false);var[ok,sO]=useState(0);var[tot,sT]=useState(0);
var lastSpoken=useRef(-1);var isDomainMode=!!p.domId;

if(rev.length===0||done){var xp=Math.max(10,tot*3+ok*2);return(<div className="enter" style={{padding:"20px 16px",minHeight:"100vh",display:"flex",flexDirection:"column",justifyContent:"center",textAlign:"center"}}>
<div style={{fontSize:48,marginBottom:16}}>{done?"✨":"🎉"}</div><h2 className="out" style={{fontWeight:800,fontSize:24,marginBottom:8}}>{done?"Session Complete!":"All caught up!"}</h2>
{done&&<div><p style={{color:"var(--t2)",marginBottom:4}}>{ok}/{tot} rated Good or Easy</p><p className="out" style={{color:"var(--gold)",fontWeight:700,fontSize:18}}>+{xp} XP</p></div>}
{!done&&<p style={{color:"var(--t2)",fontSize:13}}>No cards due for review right now. Tap a specific domain to study anyway.</p>}
<button className="btn1" onClick={function(){if(done)p.done(xp,tot);else p.back();}} style={{marginTop:32}}>{done?"Collect XP":"Back"}</button></div>);}

var card=rev[ci];function rate(r){sO(ok+(r>=3?1:0));sT(tot+1);p.rate(card.id,r);if(ci<rev.length-1){sC(ci+1);sF(false);}else sD(true);}

// Auto-pronounce word when new card appears
if(card&&!fl&&lastSpoken.current!==ci){lastSpoken.current=ci;setTimeout(function(){speak(card.w,0.85);},400);}

return(<div style={{padding:"20px 16px",minHeight:"100vh"}}>
<div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:20}}>
<button onClick={p.back} style={{background:"none",border:"none",color:"var(--t2)",cursor:"pointer",fontSize:14}}>Quit</button>
<div style={{textAlign:"center"}}>
  <span className="out" style={{fontSize:13,color:"var(--t2)",fontWeight:600}}>{ci+1}/{rev.length}</span>
  {isDomainMode&&<div style={{fontSize:9,color:"var(--cyan)",textTransform:"uppercase",letterSpacing:.5,marginTop:2}} className="out">Study mode</div>}
</div>
<div style={{width:40}}/></div>
<Bar value={ci} max={rev.length} h={4} color="linear-gradient(90deg,#c87a35,#f0c850)"/>
<div onClick={function(){sF(!fl);}} style={{marginTop:40,cursor:"pointer",minHeight:280}}>
<div className="crd glo" style={{padding:32,textAlign:"center",display:"flex",flexDirection:"column",justifyContent:"center",minHeight:280,animation:fl?"flip .3s ease-out":"none"}}>
{!fl?<div><div className="out" style={{fontSize:11,color:"var(--cyan)",textTransform:"uppercase",letterSpacing:1,fontWeight:600,marginBottom:16}}>WHAT DOES THIS MEAN?</div>
<div style={{display:"flex",alignItems:"center",justifyContent:"center",gap:12,marginBottom:16}}>
  <div className="out" style={{fontWeight:800,fontSize:32}}>{card.w}</div>
  <SpeakBtn text={card.w} size={36}/></div>
<div style={{fontSize:13,color:"var(--t3)"}}>Tap to reveal</div></div>
:<div><div style={{display:"flex",alignItems:"center",justifyContent:"center",gap:10,marginBottom:12}}>
  <div className="out" style={{fontWeight:700,fontSize:20,color:"var(--cyan)"}}>{card.w}</div>
  <SpeakBtn text={card.w} size={30}/></div>
<div style={{fontSize:16,lineHeight:1.6,marginBottom:16}}>{card.d}</div>
<div style={{fontSize:13,color:"var(--t2)",fontStyle:"italic",lineHeight:1.5,padding:"12px 16px",background:"var(--bg3)",borderRadius:10,position:"relative"}}>
  <div style={{display:"flex",alignItems:"flex-start",gap:8}}>
    <span style={{flex:1}}>"{card.e}"</span>
    <SpeakBtn text={card.e} size={28} rate={0.85}/>
  </div>
</div></div>}</div></div>
{fl&&<div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr 1fr",gap:8,marginTop:24,animation:"fadeIn .3s ease-out"}}>
{[{r:1,l:"Again",c:"var(--red)",b:"rgba(255,71,87,.12)"},{r:2,l:"Hard",c:"var(--orange)",b:"rgba(255,140,66,.12)"},{r:3,l:"Good",c:"var(--green)",b:"rgba(0,230,118,.12)"},{r:4,l:"Easy",c:"var(--cyan)",b:"rgba(212,148,58,.12)"}].map(function(b){
return(<button key={b.r} onClick={function(e){e.stopPropagation();rate(b.r);}} style={{padding:"12px 8px",background:b.b,border:"1px solid "+b.c+"33",borderRadius:12,cursor:"pointer",color:b.c,fontWeight:700,fontSize:13}} className="out">{b.l}</button>);})}</div>}</div>);}

// ─── DRILL SESSION ───
function Drill(p){var qs=useMemo(function(){return shuffle(QUESTIONS).slice(0,10);},[]);var[ci,sC]=useState(0);var[sel,sS]=useState(-1);var[sc,sSc]=useState(0);var[ph,sP]=useState("q");var[sk,sSk]=useState(false);
function doAns(i){sS(i);if(i===qs[ci].c){sSc(sc+1);try{playCorrect();}catch(e){}}else{try{playWrong();}catch(e){}sSk(true);setTimeout(function(){sSk(false);},500);}sP("fb");}
function nxt(){if(ci<qs.length-1){sC(ci+1);sS(-1);sP("q");}else{sP("done");p.done(sc,qs.length,20+sc*7);}}

if(ph==="done"){var fx=20+sc*7;return(<div className="enter" style={{padding:"20px 16px",minHeight:"100vh",display:"flex",flexDirection:"column",justifyContent:"center",textAlign:"center"}}>
<div style={{fontSize:48,marginBottom:16,animation:"countUp .6s"}}>{sc>=8?"🏆":sc>=5?"⚔️":"🛡️"}</div><h1 className="out" style={{fontWeight:900,fontSize:28,marginBottom:8}}>Drill Complete</h1>
<div className="out" style={{fontSize:44,fontWeight:900,color:sc>=8?"var(--green)":sc>=5?"var(--cyan)":"var(--orange)",marginBottom:4,animation:"countUp .8s"}}>{sc}/{qs.length}</div>
<div className="out" style={{fontSize:20,fontWeight:800,color:"var(--gold)",marginBottom:32}}>+{fx} XP</div><button className="btn1" onClick={p.back}>Back to Training</button></div>);}

var q=qs[ci];return(<div className={sk?"sk":""} style={{padding:"20px 16px",minHeight:"100vh"}}>
<div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:20}}>
<button onClick={p.back} style={{background:"none",border:"none",color:"var(--t2)",cursor:"pointer",fontSize:14}}>Quit</button>
<span className="out" style={{fontSize:13,color:"var(--t2)",fontWeight:600}}>{ci+1}/{qs.length}</span></div>
<Bar value={ci} max={qs.length} h={4}/>
<span className="out" style={{fontSize:11,fontWeight:600,color:"var(--purple)",textTransform:"uppercase",letterSpacing:1,marginTop:8,display:"block"}}>{q.cat}</span>
<h2 className="out" style={{fontWeight:700,fontSize:19,lineHeight:1.5,marginBottom:24,marginTop:8}}>{q.s}</h2>
<div style={{display:"flex",flexDirection:"column",gap:10}}>{q.o.map(function(opt,i){var iS=sel===i,iC=i===q.c,sr=ph==="fb",bg="var(--bg2)",bd="var(--bdr)";
if(sr&&iC){bg="rgba(0,230,118,.12)";bd="var(--green)";}else if(sr&&iS&&!iC){bg="rgba(255,71,87,.12)";bd="var(--red)";}
return(<button key={i} onClick={function(){if(ph==="q")doAns(i);}} disabled={ph==="fb"} style={{display:"flex",alignItems:"center",gap:12,padding:"14px 16px",background:bg,border:"1px solid "+bd,borderRadius:12,cursor:ph==="q"?"pointer":"default",fontSize:15,color:"var(--t1)",textAlign:"left",fontFamily:"'DM Sans',sans-serif"}}>
<div style={{width:28,height:28,borderRadius:"50%",border:"2px solid "+(sr&&iC?"var(--green)":sr&&iS?"var(--red)":"var(--t3)"),display:"flex",alignItems:"center",justifyContent:"center",fontSize:12,fontWeight:700,flexShrink:0,background:sr&&iC?"var(--green)":sr&&iS&&!iC?"var(--red)":"transparent",color:sr&&(iC||iS)?"#fff":"var(--t3)"}}>
{sr&&iC?"✓":sr&&iS?"✗":String.fromCharCode(65+i)}</div><span>{opt}</span></button>);})}</div>
{ph==="fb"&&<div style={{marginTop:20,animation:"fadeIn .3s"}}><div className="crd" style={{background:"rgba(212,148,58,.06)",borderColor:"rgba(212,148,58,.15)",padding:16}}><p style={{fontSize:13,color:"var(--t2)",lineHeight:1.6}}>{q.x}</p></div>
<button className="btn1" onClick={nxt} style={{marginTop:16}}>{ci<qs.length-1?"Next":"See Results"}</button></div>}</div>);}

// ─── WORD FAMILIES CLASSIFIER ───
function WordFam(p){
  var items=useMemo(function(){
    // Known English homographs that can serve as multiple POS
    // (beyond what the family structure captures)
    var HOMOGRAPHS={
      "permit":["Verb","Noun"],    // a permit / to permit
      "produce":["Verb","Noun"],   // fresh produce / to produce
      "record":["Verb","Noun"],    // a record / to record
      "project":["Verb","Noun"],   // a project / to project
      "conduct":["Verb","Noun"],   // conduct (behavior) / to conduct
      "estimate":["Verb","Noun"],  // an estimate / to estimate
      "increase":["Verb","Noun"],  // an increase / to increase
      "decrease":["Verb","Noun"],  // a decrease / to decrease
      "research":["Verb","Noun"],  // research (n) / to research
      "export":["Verb","Noun"],    // an export / to export
      "import":["Verb","Noun"],    // an import / to import
      "transfer":["Verb","Noun"],  // a transfer / to transfer
      "report":["Verb","Noun"],    // a report / to report
      "update":["Verb","Noun"],    // an update / to update
      "supply":["Verb","Noun"],    // a supply / to supply
      "demand":["Verb","Noun"],    // a demand / to demand
      "offer":["Verb","Noun"],     // an offer / to offer
      "plan":["Verb","Noun"],      // a plan / to plan
      "risk":["Verb","Noun"],      // a risk / to risk
      "process":["Verb","Noun"],   // a process / to process
      "review":["Verb","Noun"],    // a review / to review
      "result":["Verb","Noun"],    // a result / to result
      "profit":["Verb","Noun"],    // a profit / to profit
      "finance":["Verb","Noun"],   // finance (n) / to finance
      "work":["Verb","Noun"],      // work (n) / to work
      "display":["Verb","Noun"],   // a display / to display
    };

    var pool=[];
    var seen={};
    WORD_FAMILIES.forEach(function(f){
      var forms=[
        {word:f.v,pos:"Verb"},{word:f.n,pos:"Noun"},
        {word:f.adj,pos:"Adjective"},{word:f.adv,pos:"Adverb"}
      ];
      forms.forEach(function(fr){
        if(!fr.word)return;
        var key=fr.word.toLowerCase();
        if(seen[key])return;
        seen[key]=true;

        // Collect valid POS: from family structure + homograph map
        var valid=[fr.pos];
        forms.forEach(function(other){
          if(other.word&&other.word.toLowerCase()===key&&valid.indexOf(other.pos)===-1)valid.push(other.pos);
        });
        // Check homograph map
        var extra=HOMOGRAPHS[key];
        if(extra){extra.forEach(function(pos){if(valid.indexOf(pos)===-1)valid.push(pos);});}

        pool.push({word:fr.word,answer:fr.pos,validAnswers:valid,family:f});
      });
    });
    return shuffle(pool).slice(0,15);
  },[]);
  var cats=["Noun","Verb","Adjective","Adverb"];
  var catColors={Noun:"var(--cyan)",Verb:"var(--green)",Adjective:"var(--orange)",Adverb:"var(--purple)"};
  var[ci,sC]=useState(0);var[sc,sSc]=useState(0);var[ph,sP]=useState("q");var[pick,sPk]=useState(null);var[sk,sSk]=useState(false);

  function doAns(cat){
    sPk(cat);
    // Accept any valid POS for this word (handles homographs)
    if(items[ci].validAnswers.indexOf(cat)!==-1){sSc(sc+1);try{playCorrect();}catch(e){}}
    else{try{playWrong();}catch(e){}sSk(true);setTimeout(function(){sSk(false);},400);}
    sP("fb");
  }
  function nxt(){if(ci<items.length-1){sC(ci+1);sPk(null);sP("q");}else{sP("done");p.done(sc,items.length,15+sc*5);}}

  if(ph==="done"){var xp=15+sc*5;return(<div className="enter" style={{padding:"20px 16px",minHeight:"100vh",display:"flex",flexDirection:"column",justifyContent:"center",textAlign:"center"}}>
    <div style={{fontSize:48,marginBottom:16,animation:"countUp .6s"}}>{sc>=12?"🏆":sc>=8?"⚔️":"🛡️"}</div>
    <h1 className="out" style={{fontWeight:900,fontSize:28,marginBottom:8}}>Classifier Complete</h1>
    <div className="out" style={{fontSize:44,fontWeight:900,color:sc>=12?"var(--green)":sc>=8?"var(--cyan)":"var(--orange)",marginBottom:4,animation:"countUp .8s"}}>{sc}/{items.length}</div>
    <div className="out" style={{fontSize:20,fontWeight:800,color:"var(--gold)",marginBottom:32}}>+{xp} XP</div>
    <button className="btn1" onClick={p.back}>Back to Training</button></div>);}

  var it=items[ci];var fam=it.family;var isMulti=it.validAnswers.length>1;
  return(<div className={sk?"sk":""} style={{padding:"20px 16px",minHeight:"100vh"}}>
    <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:20}}>
      <button onClick={p.back} style={{background:"none",border:"none",color:"var(--t2)",cursor:"pointer",fontSize:14}}>Quit</button>
      <span className="out" style={{fontSize:13,color:"var(--t2)",fontWeight:600}}>{ci+1}/{items.length}</span></div>
    <Bar value={ci} max={items.length} h={4} color="linear-gradient(90deg,#f59e0b,#ef4444)"/>
    <div style={{textAlign:"center",marginTop:32,marginBottom:24}}>
      <div className="out" style={{fontSize:11,color:"var(--orange)",textTransform:"uppercase",letterSpacing:1,fontWeight:600,marginBottom:16}}>CLASSIFY THIS WORD</div>
      <div style={{display:"flex",alignItems:"center",justifyContent:"center",gap:12,marginBottom:8}}>
        <div className="out" style={{fontWeight:800,fontSize:36}}>{it.word}</div>
        <SpeakBtn text={it.word} size={36}/></div>
      <div style={{fontSize:13,color:"var(--t3)"}}>Is it a Noun, Verb, Adjective or Adverb?</div></div>
    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
      {cats.map(function(cat){
        var isValid=it.validAnswers.indexOf(cat)!==-1;var isPick=pick===cat;var show=ph==="fb";
        var bg="var(--bg2)";var bd="var(--bdr)";
        if(show&&isValid){bg="rgba(0,230,118,.12)";bd="var(--green)";}
        else if(show&&isPick&&!isValid){bg="rgba(255,71,87,.12)";bd="var(--red)";}
        return(<button key={cat} onClick={function(){if(ph==="q")doAns(cat);}} disabled={show}
          style={{padding:"18px 12px",background:bg,border:"1px solid "+bd,borderRadius:14,cursor:ph==="q"?"pointer":"default",transition:"all .2s"}}>
          <div className="out" style={{fontWeight:700,fontSize:16,color:show&&isValid?"var(--green)":show&&isPick?"var(--red)":catColors[cat]}}>{cat}</div>
        </button>);})}
    </div>
    {ph==="fb"&&<div style={{marginTop:20,animation:"fadeIn .3s"}}>
      {isMulti&&<div style={{padding:"8px 14px",background:"rgba(255,215,0,.08)",border:"1px solid rgba(255,215,0,.2)",borderRadius:10,marginBottom:10}}>
        <p style={{fontSize:12,color:"var(--gold)",fontWeight:600}}>This word can be both: {it.validAnswers.join(" & ")}</p>
      </div>}
      <div className="crd" style={{background:"rgba(212,148,58,.06)",borderColor:"rgba(212,148,58,.15)",padding:16}}>
        <p style={{fontSize:13,color:"var(--t2)",lineHeight:1.8}}>
          <strong style={{color:"var(--t1)"}}>Word family:</strong><br/>
          {fam.v&&<span>Verb: <strong style={{color:"var(--green)"}}>{fam.v}</strong> &nbsp;</span>}
          {fam.n&&<span>Noun: <strong style={{color:"var(--cyan)"}}>{fam.n}</strong> &nbsp;</span>}
          {fam.adj&&<span>Adj: <strong style={{color:"var(--orange)"}}>{fam.adj}</strong> &nbsp;</span>}
          {fam.adv&&<span>Adv: <strong style={{color:"var(--purple)"}}>{fam.adv}</strong></span>}
        </p></div>
      <button className="btn1" onClick={nxt} style={{marginTop:16}}>{ci<items.length-1?"Next":"See Results"}</button></div>}
  </div>);
}

// ─── CONNECTORS SORTING ───
function ConnSort(p){
  var items=useMemo(function(){return shuffle(CONNECTORS).slice(0,12);},[]);
  var rules=[{id:"clause",label:"+ Clause",desc:"subject + verb",col:"var(--cyan)"},{id:"noun",label:"+ Noun / -ing",desc:"no subject + verb",col:"var(--orange)"},{id:"sentence",label:"New sentence",desc:"after . or ;",col:"var(--purple)"}];
  var[ci,sC]=useState(0);var[sc,sSc]=useState(0);var[ph,sP]=useState("q");var[pick,sPk]=useState(null);var[sk,sSk]=useState(false);

  function doAns(rule){sPk(rule);if(rule===items[ci].rule){sSc(sc+1);try{playCorrect();}catch(e){}}else{try{playWrong();}catch(e){}sSk(true);setTimeout(function(){sSk(false);},400);}sP("fb");}
  function nxt(){if(ci<items.length-1){sC(ci+1);sPk(null);sP("q");}else{sP("done");p.done(sc,items.length,15+sc*5);}}

  if(ph==="done"){var xp=15+sc*5;return(<div className="enter" style={{padding:"20px 16px",minHeight:"100vh",display:"flex",flexDirection:"column",justifyContent:"center",textAlign:"center"}}>
    <div style={{fontSize:48,marginBottom:16,animation:"countUp .6s"}}>{sc>=10?"🏆":sc>=7?"⚔️":"🛡️"}</div>
    <h1 className="out" style={{fontWeight:900,fontSize:28,marginBottom:8}}>Sorting Complete</h1>
    <div className="out" style={{fontSize:44,fontWeight:900,color:sc>=10?"var(--green)":sc>=7?"var(--cyan)":"var(--orange)",marginBottom:4,animation:"countUp .8s"}}>{sc}/{items.length}</div>
    <div className="out" style={{fontSize:20,fontWeight:800,color:"var(--gold)",marginBottom:32}}>+{xp} XP</div>
    <button className="btn1" onClick={p.back}>Back to Training</button></div>);}

  var it=items[ci];
  return(<div className={sk?"sk":""} style={{padding:"20px 16px",minHeight:"100vh"}}>
    <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:20}}>
      <button onClick={p.back} style={{background:"none",border:"none",color:"var(--t2)",cursor:"pointer",fontSize:14}}>Quit</button>
      <span className="out" style={{fontSize:13,color:"var(--t2)",fontWeight:600}}>{ci+1}/{items.length}</span></div>
    <Bar value={ci} max={items.length} h={4} color="linear-gradient(90deg,#8b5e83,#c4587a)"/>
    <div style={{textAlign:"center",marginTop:32,marginBottom:28}}>
      <div className="out" style={{fontSize:11,color:"var(--purple)",textTransform:"uppercase",letterSpacing:1,fontWeight:600,marginBottom:16}}>THIS CONNECTOR IS FOLLOWED BY...</div>
      <div className="out" style={{fontWeight:800,fontSize:30,marginBottom:4}}>{it.word}</div></div>
    <div style={{display:"flex",flexDirection:"column",gap:10}}>
      {rules.map(function(r){
        var isCor=r.id===it.rule;var isPick=pick===r.id;var show=ph==="fb";
        var bg="var(--bg2)";var bd="var(--bdr)";
        if(show&&isCor){bg="rgba(0,230,118,.12)";bd="var(--green)";}
        else if(show&&isPick&&!isCor){bg="rgba(255,71,87,.12)";bd="var(--red)";}
        return(<button key={r.id} onClick={function(){if(ph==="q")doAns(r.id);}} disabled={show}
          style={{display:"flex",alignItems:"center",gap:14,padding:"16px",background:bg,border:"1px solid "+bd,borderRadius:14,cursor:ph==="q"?"pointer":"default",textAlign:"left",transition:"all .2s"}}>
          <div style={{width:10,height:10,borderRadius:"50%",background:r.col,flexShrink:0}}/>
          <div><div className="out" style={{fontWeight:700,fontSize:15,color:show&&isCor?"var(--green)":show&&isPick?"var(--red)":"var(--t1)"}}>{r.label}</div>
            <div style={{fontSize:11,color:"var(--t3)"}}>{r.desc}</div></div></button>);})}
    </div>
    {ph==="fb"&&<div style={{marginTop:20,animation:"fadeIn .3s"}}>
      <div className="crd" style={{background:"rgba(212,148,58,.06)",borderColor:"rgba(212,148,58,.15)",padding:16}}>
        <p style={{fontSize:13,color:"var(--t2)",lineHeight:1.6}}>{it.tip}</p>
        <p style={{fontSize:12,color:"var(--t3)",fontStyle:"italic",marginTop:8}}>"{it.ex}"</p></div>
      <button className="btn1" onClick={nxt} style={{marginTop:16}}>{ci<items.length-1?"Next":"See Results"}</button></div>}
  </div>);
}

// ─── PREPOSITION COLLOCATIONS ───
function PrepDrill(p){
  var items=useMemo(function(){return shuffle(PREP_COLLOCATIONS).slice(0,12);},[]);
  var allPreps=useMemo(function(){var s={};PREP_COLLOCATIONS.forEach(function(c){s[c.prep]=true;});return Object.keys(s);},[]);
  var[ci,sC]=useState(0);var[sc,sSc]=useState(0);var[ph,sP]=useState("menu");var[pick,sPk]=useState(null);var[sk,sSk]=useState(false);

  // Group collocations by preposition for Study Mode
  var groups=useMemo(function(){
    var g={};PREP_COLLOCATIONS.forEach(function(c){if(!g[c.prep])g[c.prep]=[];g[c.prep].push(c);});
    return Object.keys(g).sort().map(function(pr){return{prep:pr,items:g[pr]};});
  },[]);
  var prepLabels={for:"Responsibility, eligibility, purpose",in:"Involvement, interest, results",with:"Compliance, familiarity, association",on:"Dependence, reliance",of:"Composition, charge, capability",to:"Relation, addition, attribution"};

  function doAns(pr){sPk(pr);if(pr===items[ci].prep){sSc(sc+1);try{playCorrect();}catch(e){}}else{try{playWrong();}catch(e){}sSk(true);setTimeout(function(){sSk(false);},400);}sP("fb");}
  function nxt(){if(ci<items.length-1){sC(ci+1);sPk(null);sP("q");}else{sP("done");p.done(sc,items.length,15+sc*5);}}

  if(ph==="menu")return(<div className="enter" style={{padding:"20px 16px",minHeight:"100vh",display:"flex",flexDirection:"column",justifyContent:"center",textAlign:"center"}}>
    <div style={{fontSize:48,marginBottom:16}}>🎯</div>
    <h1 className="out" style={{fontWeight:900,fontSize:26,marginBottom:8}}>Preposition Collocations</h1>
    <p style={{color:"var(--t2)",fontSize:13,marginBottom:32,lineHeight:1.5}}>Master the prepositions that go with common business words</p>
    <button className="btn1" onClick={function(){sP("q");}} style={{marginBottom:12}}>Start Drill (12 Qs)</button>
    <button className="btn2" onClick={function(){sP("study");}} style={{width:"100%",marginBottom:12}}>📖 Study Mode</button>
    <button className="btn2" onClick={p.back} style={{width:"100%"}}>Back</button></div>);

  if(ph==="study")return(<div className="enter" style={{padding:"20px 16px 100px"}}>
    <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:20}}>
      <button onClick={function(){sP("menu");}} style={{background:"none",border:"none",color:"var(--t2)",cursor:"pointer",fontSize:14}}>Back</button>
      <span className="out" style={{fontWeight:700,fontSize:15}}>Study Mode</span>
      <div style={{width:40}}/></div>
    <p style={{color:"var(--t2)",fontSize:13,marginBottom:20,lineHeight:1.5}}>Collocations grouped by preposition. Tap a group to expand.</p>
    <div style={{display:"flex",flexDirection:"column",gap:12}}>
      {groups.map(function(g){
        return(<StudyGroup key={g.prep} prep={g.prep} items={g.items} hint={prepLabels[g.prep]||""}/>);
      })}
    </div>
    <button className="btn1" onClick={function(){sP("q");}} style={{marginTop:24}}>Ready! Start Drill</button></div>);

  if(ph==="done"){var xp=15+sc*5;return(<div className="enter" style={{padding:"20px 16px",minHeight:"100vh",display:"flex",flexDirection:"column",justifyContent:"center",textAlign:"center"}}>
    <div style={{fontSize:48,marginBottom:16,animation:"countUp .6s"}}>{sc>=10?"🏆":sc>=7?"⚔️":"🛡️"}</div>
    <h1 className="out" style={{fontWeight:900,fontSize:28,marginBottom:8}}>Prep Drill Complete</h1>
    <div className="out" style={{fontSize:44,fontWeight:900,color:sc>=10?"var(--green)":sc>=7?"var(--cyan)":"var(--orange)",marginBottom:4,animation:"countUp .8s"}}>{sc}/{items.length}</div>
    <div className="out" style={{fontSize:20,fontWeight:800,color:"var(--gold)",marginBottom:32}}>+{xp} XP</div>
    <button className="btn1" onClick={p.back}>Back to Training</button></div>);}

  var it=items[ci];
  return(<div className={sk?"sk":""} style={{padding:"20px 16px",minHeight:"100vh"}}>
    <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:20}}>
      <button onClick={p.back} style={{background:"none",border:"none",color:"var(--t2)",cursor:"pointer",fontSize:14}}>Quit</button>
      <span className="out" style={{fontSize:13,color:"var(--t2)",fontWeight:600}}>{ci+1}/{items.length}</span></div>
    <Bar value={ci} max={items.length} h={4} color="linear-gradient(90deg,#06b6d4,#22c55e)"/>
    <div style={{textAlign:"center",marginTop:32,marginBottom:28}}>
      <div className="out" style={{fontSize:11,color:"var(--cyan)",textTransform:"uppercase",letterSpacing:1,fontWeight:600,marginBottom:16}}>COMPLETE THE COLLOCATION</div>
      <div style={{display:"flex",alignItems:"center",justifyContent:"center",gap:10}}>
        <div className="out" style={{fontWeight:800,fontSize:30}}>{it.base} <span style={{color:"var(--cyan)"}}>_____</span></div>
        <SpeakBtn text={it.base} size={32}/></div>
      <div style={{fontSize:12,color:"var(--t3)",marginTop:6}}>({it.type==="verb"?"verb":it.type==="adj"?"adjective":"expression"} + preposition)</div></div>
    <div style={{display:"grid",gridTemplateColumns:"repeat("+Math.min(allPreps.length,4)+", 1fr)",gap:8}}>
      {allPreps.map(function(pr){
        var isCor=pr===it.prep;var isPick=pick===pr;var show=ph==="fb";
        var bg="var(--bg2)";var bd="var(--bdr)";var col="var(--t1)";
        if(show&&isCor){bg="rgba(0,230,118,.12)";bd="var(--green)";col="var(--green)";}
        else if(show&&isPick&&!isCor){bg="rgba(255,71,87,.12)";bd="var(--red)";col="var(--red)";}
        return(<button key={pr} onClick={function(){if(ph==="q")doAns(pr);}} disabled={show}
          style={{padding:"14px 8px",background:bg,border:"1px solid "+bd,borderRadius:12,cursor:ph==="q"?"pointer":"default",transition:"all .2s"}}>
          <div className="out" style={{fontWeight:700,fontSize:16,color:col,textTransform:"uppercase"}}>{pr}</div></button>);})}
    </div>
    {ph==="fb"&&<div style={{marginTop:20,animation:"fadeIn .3s"}}>
      <div className="crd" style={{background:"rgba(212,148,58,.06)",borderColor:"rgba(212,148,58,.15)",padding:16}}>
        <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:6}}>
          <p style={{fontSize:14,color:"var(--t1)"}}><strong>{it.base} {it.prep}</strong></p>
          <SpeakBtn text={it.base+" "+it.prep} size={26}/></div>
        <div style={{display:"flex",alignItems:"flex-start",gap:8}}>
          <p style={{fontSize:13,color:"var(--t2)",fontStyle:"italic",flex:1}}>"{it.ex}"</p>
          <SpeakBtn text={it.ex} size={24} rate={0.85}/></div></div>
      <button className="btn1" onClick={nxt} style={{marginTop:16}}>{ci<items.length-1?"Next":"See Results"}</button></div>}
  </div>);
}

// Study Mode collapsible group sub-component
function StudyGroup(p){
  var[open,sO]=useState(false);
  var prepColors={for:"#22c55e",in:"#f59e0b",with:"#8b5e83",on:"#ef4444",of:"#06b6d4",to:"#ec4899"};
  var col=prepColors[p.prep]||"var(--cyan)";
  return(<div className="crd" style={{padding:0,overflow:"hidden",borderColor:open?col+"44":"var(--bdr)",transition:"all .3s"}}>
    <button onClick={function(){sO(!open);}} style={{width:"100%",display:"flex",alignItems:"center",justifyContent:"space-between",padding:"16px 18px",background:"none",border:"none",cursor:"pointer",textAlign:"left"}}>
      <div><div className="out" style={{fontWeight:800,fontSize:20,color:col,textTransform:"uppercase",letterSpacing:1}}>{p.prep}</div>
        <div style={{fontSize:11,color:"var(--t3)",marginTop:2}}>{p.hint}</div></div>
      <div style={{display:"flex",alignItems:"center",gap:8}}>
        <span className="out" style={{fontSize:12,color:"var(--t3)",fontWeight:600}}>{p.items.length}</span>
        <span style={{fontSize:14,color:"var(--t3)",transform:open?"rotate(180deg)":"rotate(0)",transition:"transform .2s"}}>{"▼"}</span></div>
    </button>
    {open&&<div style={{padding:"0 18px 16px",animation:"fadeIn .2s"}}>
      {p.items.map(function(it,i){return(
        <div key={i} style={{display:"flex",alignItems:"baseline",gap:8,padding:"8px 0",borderTop:i>0?"1px solid var(--bdr)":"none"}}>
          <span className="out" style={{fontWeight:700,fontSize:14,color:"var(--t1)",minWidth:100}}>{it.base}</span>
          <span style={{fontSize:12,color:"var(--t3)",flex:1}}>{it.ex}</span>
        </div>);})}
    </div>}
  </div>);
}

// ─── GERUND VS INFINITIVE BATTLE ───
function GerInf(p){
  var[mode,setMode]=useState("hub"); // hub | study | quiz
  var[ci,sC]=useState(0);var[sc,sSc]=useState(0);var[ph,sP]=useState("q");var[pick,sPk]=useState(-1);var[sk,sSk]=useState(false);
  var[studyTab,setStudyTab]=useState("ing");

  // Group by pattern for Study Mode
  var groups=useMemo(function(){
    var g={ing:[],to:[],both:[],prep:[]};
    GERUND_INF.forEach(function(v){if(g[v.pattern])g[v.pattern].push(v);});
    return g;
  },[]);

  // Quiz items — context sentences, shuffled
  var quizItems=useMemo(function(){return shuffle(GERUND_INF.slice());},[]);

  function resetQuiz(){sC(0);sSc(0);sPk(-1);sP("q");}

  // Pattern labels
  var patternInfo={
    ing:{label:"Always -ING",icon:"🔶",color:"var(--orange)",desc:"These verbs ALWAYS take the gerund (-ing form)."},
    to:{label:"Always TO",icon:"🔷",color:"var(--cyan)",desc:"These verbs ALWAYS take the infinitive (to + verb)."},
    both:{label:"Both (meaning changes!)",icon:"⚠️",color:"var(--red)",desc:"These verbs take EITHER form — but the meaning changes!"},
    prep:{label:"After preposition = -ING",icon:"🎯",color:"var(--purple)",desc:"After ANY preposition (to, in, of, for...), ALWAYS use -ING. This is the #1 TOEIC trap."}
  };

  // ═══ HUB ═══
  if(mode==="hub")return(<div className="enter" style={{padding:"20px 16px 100px"}}>
    <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16}}>
      <button onClick={p.back} style={{background:"none",border:"none",color:"var(--t2)",cursor:"pointer",fontSize:14}}>Back</button>
      <span className="out" style={{fontWeight:700,fontSize:15}}>Gerund vs Infinitive</span>
      <div style={{width:40}}/>
    </div>
    <div style={{textAlign:"center",marginBottom:24}}>
      <div style={{fontSize:48,marginBottom:8}}>{"⚖️"}</div>
      <p style={{color:"var(--t2)",fontSize:13,lineHeight:1.6}}>{GERUND_INF.length} verbs · 4 patterns to master</p>
    </div>
    <div style={{display:"flex",flexDirection:"column",gap:10}}>
      <div className="crd" onClick={function(){setMode("study");}} style={{cursor:"pointer",display:"flex",alignItems:"center",gap:14,padding:"16px"}}>
        <div style={{width:48,height:48,borderRadius:14,background:"linear-gradient(135deg,#5a7a9a,#7a5a80)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:22,flexShrink:0}}>{"📚"}</div>
        <div style={{flex:1}}><div className="out" style={{fontWeight:700,fontSize:15}}>Study the Patterns</div>
          <div style={{fontSize:11,color:"var(--t3)"}}>Learn WHY before you guess</div></div>
        <span style={{fontSize:16,color:"var(--cyan)"}}>{"→"}</span></div>
      <div className="crd" onClick={function(){resetQuiz();setMode("quiz");}} style={{cursor:"pointer",display:"flex",alignItems:"center",gap:14,padding:"16px"}}>
        <div style={{width:48,height:48,borderRadius:14,background:"linear-gradient(135deg,#e11d48,#f59e0b)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:22,flexShrink:0}}>{"📝"}</div>
        <div style={{flex:1}}><div className="out" style={{fontWeight:700,fontSize:15}}>Context Quiz</div>
          <div style={{fontSize:11,color:"var(--t3)"}}>TOEIC-style sentences — no more guessing</div></div>
        <span style={{fontSize:16,color:"var(--cyan)"}}>{"→"}</span></div>
    </div>
  </div>);

  // ═══ STUDY MODE ═══
  if(mode==="study"){
    var tabs=[
      {id:"ing",label:"-ING",col:"var(--orange)"},
      {id:"to",label:"TO",col:"var(--cyan)"},
      {id:"both",label:"Both",col:"var(--red)"},
      {id:"prep",label:"Prep",col:"var(--purple)"}
    ];
    var curGroup=groups[studyTab]||[];
    var info=patternInfo[studyTab];

    return(<div className="enter" style={{padding:"20px 16px 100px"}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16}}>
        <button onClick={function(){setMode("hub");}} style={{background:"none",border:"none",color:"var(--t2)",cursor:"pointer",fontSize:14}}>Back</button>
        <span className="out" style={{fontWeight:700,fontSize:15}}>Study Patterns</span>
        <div style={{width:40}}/>
      </div>

      {/* Pattern tabs */}
      <div style={{display:"flex",gap:4,marginBottom:16,background:"var(--bg2)",borderRadius:12,padding:3}}>
        {tabs.map(function(t){
          var active=studyTab===t.id;
          return(<button key={t.id} onClick={function(){setStudyTab(t.id);}}
            style={{flex:1,padding:"10px 6px",borderRadius:10,border:"none",cursor:"pointer",
              background:active?"var(--bg3)":"transparent",color:active?t.col:"var(--t3)",
              fontWeight:active?700:500,fontSize:12,fontFamily:"'DM Sans',sans-serif",transition:"all .2s"}}
            className="out">{t.label}</button>);
        })}
      </div>

      {/* Pattern description */}
      <div style={{padding:"12px 16px",background:info.color+"10",border:"1px solid "+info.color+"25",borderRadius:12,marginBottom:16}}>
        <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:6}}>
          <span style={{fontSize:18}}>{info.icon}</span>
          <span className="out" style={{fontWeight:700,fontSize:14,color:info.color}}>{info.label}</span>
          <span style={{fontSize:11,color:"var(--t3)"}}>{curGroup.length} verbs</span>
        </div>
        <p style={{fontSize:12,color:"var(--t2)",lineHeight:1.5}}>{info.desc}</p>
      </div>

      {/* Verb list */}
      <div style={{display:"flex",flexDirection:"column",gap:8}}>
        {curGroup.map(function(v,i){
          return(<div key={i} className="crd" style={{padding:14}}>
            <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:6}}>
              <span className="out" style={{fontWeight:800,fontSize:16,color:info.color}}>{v.verb}</span>
              <span style={{fontSize:12,color:"var(--t3)",fontWeight:600}}>+ {v.takes==="ing"?"-ING":v.takes==="to"?"TO":"-ING / TO"}</span>
            </div>
            <p style={{fontSize:13,color:"var(--t2)",fontStyle:"italic",lineHeight:1.5,marginBottom:6}}>"{v.ex}"</p>
            <div style={{padding:"8px 12px",background:"rgba(212,148,58,.06)",borderRadius:8,border:"1px solid rgba(212,148,58,.1)"}}>
              <p style={{fontSize:11,color:"var(--cyan)",lineHeight:1.5}}>{v.tip}</p>
            </div>
          </div>);
        })}
      </div>

      <button className="btn1" onClick={function(){resetQuiz();setMode("quiz");}} style={{marginTop:20,width:"100%"}}>Ready? Take the Quiz</button>
    </div>);
  }

  // ═══ CONTEXT QUIZ ═══
  if(mode==="quiz"){
    var q=quizItems[ci];

    if(ph==="done"){var xp=20+sc*4;return(<div className="enter" style={{padding:"20px 16px",minHeight:"100vh",display:"flex",flexDirection:"column",justifyContent:"center",textAlign:"center"}}>
      <div style={{fontSize:48,marginBottom:16,animation:"countUp .6s"}}>{sc>=25?"🏆":sc>=18?"⚔️":"🛡️"}</div>
      <h1 className="out" style={{fontWeight:900,fontSize:28,marginBottom:8}}>Quiz Complete</h1>
      <div className="out" style={{fontSize:44,fontWeight:900,color:sc>=25?"var(--green)":sc>=18?"var(--cyan)":"var(--orange)",marginBottom:4}}>{sc}/{quizItems.length}</div>
      <div className="out" style={{fontSize:20,fontWeight:800,color:"var(--gold)",marginBottom:32}}>+{xp} XP</div>
      <button className="btn1" onClick={function(){resetQuiz();sP("q");}}>Play Again</button>
      <button className="btn2" onClick={function(){setMode("study");}} style={{marginTop:10,width:"100%"}}>Review Patterns</button>
      <button className="btn2" onClick={function(){setMode("hub");}} style={{marginTop:10,width:"100%"}}>Back</button>
    </div>);}

    var info2=patternInfo[q.pattern];

    return(<div className={sk?"sk":""} style={{padding:"20px 16px",minHeight:"100vh"}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12}}>
        <button onClick={function(){setMode("hub");}} style={{background:"none",border:"none",color:"var(--t2)",cursor:"pointer",fontSize:14}}>Quit</button>
        <span className="out" style={{fontSize:13,color:"var(--t2)",fontWeight:600}}>{ci+1}/{quizItems.length}</span></div>
      <Bar value={ci} max={quizItems.length} h={4} color="linear-gradient(90deg,#e11d48,#f59e0b)"/>

      <div style={{marginTop:20,marginBottom:24}}>
        <span className="out" style={{fontSize:11,color:"var(--purple)",fontWeight:700,textTransform:"uppercase",letterSpacing:1,display:"block",marginBottom:12}}>Choose the correct form</span>
        <p className="out" style={{fontSize:17,fontWeight:700,lineHeight:1.6,color:"var(--t1)"}}>{q.ctx.split("_____")[0]}<span style={{color:"var(--cyan)",fontWeight:900}}>_____</span>{q.ctx.split("_____")[1]}</p>
      </div>

      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
        {q.opts.map(function(opt,i){
          var show=ph==="fb";var isCor=i===q.c;var isPick=i===pick;
          var bg="var(--bg2)";var bd="var(--bdr)";var col="var(--t1)";
          if(show&&isCor){bg="rgba(0,230,118,.15)";bd="var(--green)";col="var(--green)";}
          else if(show&&isPick&&!isCor){bg="rgba(255,71,87,.15)";bd="var(--red)";col="var(--red)";}
          return(<button key={i} onClick={function(){
            if(ph!=="q")return;sPk(i);
            if(i===q.c){sSc(sc+1);try{playCorrect();}catch(e){}}else{try{playWrong();}catch(e){}sSk(true);setTimeout(function(){sSk(false);},400);}
            sP("fb");
          }} disabled={show}
            style={{padding:"18px 14px",background:bg,border:"2px solid "+bd,borderRadius:14,cursor:ph==="q"?"pointer":"default",
              fontSize:16,fontWeight:700,color:col,fontFamily:"'DM Sans',sans-serif",transition:"all .15s",textAlign:"center"}}>
            {opt}
          </button>);
        })}
      </div>

      {ph==="fb"&&<div style={{marginTop:16,animation:"fadeIn .3s"}}>
        <div className="crd" style={{padding:14,background:"rgba(212,148,58,.06)",borderColor:"rgba(212,148,58,.15)"}}>
          <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:6,flexWrap:"wrap"}}>
            <span className="out" style={{fontWeight:700,fontSize:15,color:"var(--cyan)"}}>{q.verb}</span>
            <span style={{fontSize:11,fontWeight:600,padding:"2px 8px",borderRadius:99,
              background:q.pattern==="ing"?"rgba(255,140,66,.1)":q.pattern==="to"?"rgba(212,148,58,.1)":q.pattern==="both"?"rgba(255,71,87,.1)":"rgba(139,94,131,.1)",
              color:info2.color}}>{q.pattern==="ing"?"always -ING":q.pattern==="to"?"always TO":q.pattern==="both"?"depends on meaning":"preposition → -ING"}</span>
          </div>
          <p style={{fontSize:12,color:"var(--t2)",lineHeight:1.6,marginBottom:4}}>{q.tip}</p>
          <p style={{fontSize:12,color:"var(--t3)",fontStyle:"italic"}}>"{q.ex}"</p>
        </div>
        <button className="btn1" onClick={function(){
          sPk(-1);
          if(ci<quizItems.length-1){sC(ci+1);sP("q");}
          else{sP("done");p.done(sc,quizItems.length,20+sc*4);}
        }} style={{marginTop:12}}>{ci<quizItems.length-1?"Next":"See Results"}</button>
      </div>}
    </div>);
  }

  return null;
}

// ─── TOEIC TRAPS QUIZ ───
function TrapsQuiz(p){
  var traps=useMemo(function(){return shuffle(TOEIC_TRAPS).slice(0,10);},[]);
  var[ci,sC]=useState(0);var[sc,sSc]=useState(0);var[ph,sP]=useState("intro");var[pick,sPk]=useState(-1);var[sk,sSk]=useState(false);

  function doAns(i){sPk(i);if(i===traps[ci].correct){sSc(sc+1);try{playCorrect();}catch(e){}}else{try{playWrong();}catch(e){}sSk(true);setTimeout(function(){sSk(false);},400);}sP("fb");}
  function nxt(){if(ci<traps.length-1){sC(ci+1);sPk(-1);sP("q");}else{sP("done");p.done(sc,traps.length,25+sc*6);}}

  if(ph==="intro")return(<div className="enter" style={{padding:"20px 16px",minHeight:"100vh",display:"flex",flexDirection:"column",justifyContent:"center",textAlign:"center"}}>
    <div style={{fontSize:56,marginBottom:16}}>🪤</div>
    <h1 className="out" style={{fontWeight:900,fontSize:26,marginBottom:8}}>TOEIC Traps Quiz</h1>
    <p style={{color:"var(--t2)",fontSize:13,marginBottom:8,lineHeight:1.6}}>The 20 most common mistakes students make on the TOEIC.</p>
    <p style={{color:"var(--gold)",fontWeight:600,fontSize:14,marginBottom:32}}>Can you spot the traps before they catch you?</p>
    <button className="btn1" onClick={function(){sP("q");}}>Start Quiz</button>
    <button className="btn2" onClick={p.back} style={{marginTop:12,width:"100%"}}>Back</button></div>);

  if(ph==="done"){var xp=25+sc*6;return(<div className="enter" style={{padding:"20px 16px",minHeight:"100vh",display:"flex",flexDirection:"column",justifyContent:"center",textAlign:"center"}}>
    <div style={{fontSize:48,marginBottom:16,animation:"countUp .6s"}}>{sc>=8?"🏆":sc>=5?"⚔️":"🛡️"}</div>
    <h1 className="out" style={{fontWeight:900,fontSize:28,marginBottom:8}}>Traps Mastered!</h1>
    <div className="out" style={{fontSize:44,fontWeight:900,color:sc>=8?"var(--green)":sc>=5?"var(--cyan)":"var(--orange)",marginBottom:4,animation:"countUp .8s"}}>{sc}/{traps.length}</div>
    <div className="out" style={{fontSize:20,fontWeight:800,color:"var(--gold)",marginBottom:32}}>+{xp} XP</div>
    <button className="btn1" onClick={p.back}>Back to Training</button></div>);}

  var t=traps[ci];
  return(<div className={sk?"sk":""} style={{padding:"20px 16px",minHeight:"100vh"}}>
    <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:20}}>
      <button onClick={p.back} style={{background:"none",border:"none",color:"var(--t2)",cursor:"pointer",fontSize:14}}>Quit</button>
      <span className="out" style={{fontSize:13,color:"var(--t2)",fontWeight:600}}>Trap {ci+1}/{traps.length}</span></div>
    <Bar value={ci} max={traps.length} h={4} color="linear-gradient(90deg,#e11d48,#f59e0b)"/>

    <div style={{marginTop:16,marginBottom:8}}>
      <span className="out" style={{fontSize:11,fontWeight:600,color:"var(--red)",textTransform:"uppercase",letterSpacing:1}}>Trap #{t.id} — {t.part}</span></div>
    <h2 className="out" style={{fontWeight:800,fontSize:20,marginBottom:12,color:"var(--orange)"}}>{t.name}</h2>
    <p style={{fontSize:13,color:"var(--t2)",lineHeight:1.6,marginBottom:20}}>{t.trap}</p>

    <div className="crd" style={{padding:16,marginBottom:20,background:"rgba(255,140,66,.06)",borderColor:"rgba(255,140,66,.15)"}}>
      <p className="out" style={{fontSize:12,fontWeight:600,color:"var(--orange)",textTransform:"uppercase",letterSpacing:.5,marginBottom:8}}>Scenario</p>
      <p style={{fontSize:14,color:"var(--t1)",lineHeight:1.6,whiteSpace:"pre-line"}}>{t.scenario}</p></div>

    <div style={{display:"flex",flexDirection:"column",gap:8}}>
      {t.options.map(function(opt,i){
        var isCor=i===t.correct;var isPick=pick===i;var show=ph==="fb";
        var bg="var(--bg2)";var bd="var(--bdr)";
        if(show&&isCor){bg="rgba(0,230,118,.12)";bd="var(--green)";}
        else if(show&&isPick&&!isCor){bg="rgba(255,71,87,.12)";bd="var(--red)";}
        return(<button key={i} onClick={function(){if(ph==="q")doAns(i);}} disabled={show}
          style={{display:"flex",alignItems:"center",gap:12,padding:"12px 14px",background:bg,border:"1px solid "+bd,borderRadius:12,cursor:ph==="q"?"pointer":"default",fontSize:14,color:"var(--t1)",textAlign:"left",fontFamily:"'DM Sans',sans-serif",transition:"all .2s"}}>
          <div style={{width:24,height:24,borderRadius:"50%",border:"2px solid "+(show&&isCor?"var(--green)":show&&isPick?"var(--red)":"var(--t3)"),display:"flex",alignItems:"center",justifyContent:"center",fontSize:11,fontWeight:700,flexShrink:0,background:show&&isCor?"var(--green)":show&&isPick&&!isCor?"var(--red)":"transparent",color:show&&(isCor||isPick)?"#fff":"var(--t3)"}}>
            {show&&isCor?"✓":show&&isPick?"✗":String.fromCharCode(65+i)}</div>
          <span>{opt}</span></button>);})}
    </div>

    {ph==="fb"&&<div style={{marginTop:16,animation:"fadeIn .3s"}}>
      <div className="crd" style={{background:"rgba(212,148,58,.06)",borderColor:"rgba(212,148,58,.15)",padding:16}}>
        <p className="out" style={{fontSize:12,fontWeight:700,color:"var(--cyan)",textTransform:"uppercase",marginBottom:6}}>Pro Tip</p>
        <p style={{fontSize:13,color:"var(--t2)",lineHeight:1.6}}>{t.tip}</p></div>
      <button className="btn1" onClick={nxt} style={{marginTop:16}}>{ci<traps.length-1?"Next Trap":"See Results"}</button></div>}
  </div>);
}

// ─── GRAMMAR REFERENCE SHEETS ───
var GRAMMAR_SHEETS = [
  {id:"tenses",title:"Tenses",icon:"⏰",color:"#3b82f6",
    rule:"The TOEIC tests your ability to choose the correct tense based on time markers and context.",
    patterns:[
      {p:"Simple Present",d:"Facts, habits, schedules. Markers: always, usually, every + time",ex:"The factory produces 500 units daily."},
      {p:"Present Continuous",d:"Action in progress NOW or temporary situation. Markers: right now, currently, at the moment",ex:"We are currently reviewing the proposal."},
      {p:"Simple Past",d:"Completed action. Markers: yesterday, last week, in 2019, ago",ex:"The CEO announced the merger last Friday."},
      {p:"Present Perfect",d:"Past action connected to present. Markers: since, for, already, yet, recently, just",ex:"Sales have increased significantly since January."},
      {p:"Future (will / be going to)",d:"Decisions, predictions, scheduled plans",ex:"The board will vote on the budget next Monday."},
    ],
    traps:"Watch for 'since' (= present perfect, NOT past) and 'for + duration' (= present perfect if still true). 'Last year' = simple past. 'Over the past year' = present perfect."},
  {id:"passive",title:"Passive Voice",icon:"🔄",color:"#8b5cf6",
    rule:"Passive shifts focus from WHO does it to WHAT is done. Structure: be + past participle.",
    patterns:[
      {p:"Present passive",d:"is/are + V3",ex:"Invoices are sent at the end of each month."},
      {p:"Past passive",d:"was/were + V3",ex:"The contract was signed yesterday."},
      {p:"Present perfect passive",d:"has/have been + V3",ex:"All employees have been notified of the change."},
      {p:"Modal passive",d:"modal + be + V3",ex:"This issue must be resolved before Friday."},
      {p:"Being + V3 (in progress)",d:"is/are being + V3",ex:"The office is being renovated this week."},
    ],
    traps:"'Being renovated' = in progress NOW. 'Been renovated' = completed. The TOEIC loves testing this distinction with photos (Part 1) and sentences (Part 5)."},
  {id:"subjverb",title:"Subject-Verb Agreement",icon:"🤝",color:"#06b6d4",
    rule:"The verb must agree in number with its subject — not with the nearest noun.",
    patterns:[
      {p:"Trap: prepositional phrase",d:"Ignore the words between subject and verb",ex:"The list of candidates HAS been reviewed. (list = singular)"},
      {p:"Each / Every / Anyone",d:"Always singular",ex:"Each department IS responsible for its own budget."},
      {p:"Both / Several / Many",d:"Always plural",ex:"Several employees HAVE requested training."},
      {p:"Uncountable nouns",d:"Always singular: information, equipment, furniture, advice, news",ex:"The equipment IS ready for installation."},
      {p:"Neither...nor / Either...or",d:"Verb agrees with the CLOSEST subject",ex:"Neither the manager nor the assistants WERE available."},
    ],
    traps:"The TOEIC inserts long phrases between subject and verb to confuse you: 'The results of the survey conducted last month SHOW...' Focus on the true subject."},
  {id:"wordform",title:"Word Families",icon:"🧩",color:"#f59e0b",
    rule:"Choose the correct form: noun, verb, adjective, or adverb based on position in the sentence.",
    patterns:[
      {p:"After article/possessive → NOUN",d:"the _____ / a _____ / his _____",ex:"The development of the product took six months."},
      {p:"Before a noun → ADJECTIVE",d:"the _____ report / a _____ meeting",ex:"We need a comprehensive review of the process."},
      {p:"After a verb → ADVERB",d:"increased _____ / works _____",ex:"Revenue increased significantly in Q3."},
      {p:"Common suffixes",d:"-tion/-ment/-ness = noun | -ive/-able/-ful = adj | -ly = adverb | -ize/-fy = verb",ex:"The implementation (N) was effective (adj) and completed efficiently (adv)."},
    ],
    traps:"Look at what comes BEFORE and AFTER the blank. 'The _____ of' = noun. '_____ increase' before a noun = adjective. '_____ly' after a verb = adverb. The suffix is your best friend."},
  {id:"connectors",title:"Connectors & Linking Words",icon:"🔗",color:"#8b5e83",
    rule:"Connectors join ideas. The TOEIC tests whether you know if a connector introduces a clause, a noun phrase, or a new sentence.",
    patterns:[
      {p:"Clause connectors (+ subject + verb)",d:"although, because, while, if, unless, since, when, before, after",ex:"Although sales declined, profits remained stable."},
      {p:"Noun phrase connectors (+ noun/gerund)",d:"despite, in spite of, due to, because of, instead of",ex:"Despite the delay, the project was completed on time."},
      {p:"Transition adverbs (new sentence)",d:"however, therefore, moreover, nevertheless, consequently",ex:"The budget was cut. However, the team adapted quickly."},
      {p:"Contrast pairs",d:"although/though/even though (clause) vs despite/in spite of (noun)",ex:"Even though it rained ≠ Despite the rain"},
    ],
    traps:"'Although' + clause. 'Despite' + noun. NEVER 'Despite that it rained' or 'Although the rain'. Also: 'However' needs a period or semicolon before it, not a comma splice."},
  {id:"prepositions",title:"Prepositions",icon:"📍",color:"#22c55e",
    rule:"Preposition choice in English is largely fixed — you must memorize common collocations.",
    patterns:[
      {p:"Time prepositions",d:"at + time, on + day/date, in + month/year/period, by + deadline, during + event",ex:"The meeting is at 3 PM on Monday in July."},
      {p:"Place prepositions",d:"at + address/place, in + city/country/room, on + street/floor",ex:"She works at HQ in London on the 5th floor."},
      {p:"Common verb + prep",d:"comply WITH, depend ON, result IN, respond TO, apply FOR, consist OF",ex:"The outcome depends on several factors."},
      {p:"Common adj + prep",d:"responsible FOR, interested IN, capable OF, familiar WITH, eligible FOR",ex:"All employees are eligible for the program."},
    ],
    traps:"'By Friday' = deadline. 'Until Friday' = duration. 'During the meeting' (event) NOT 'during 3 hours'. 'For 3 hours' = duration."},
  {id:"gerinf",title:"Gerund vs Infinitive",icon:"⚖️",color:"#e11d48",
    rule:"Some verbs take -ING (gerund), some take TO (infinitive), some take both with a change in meaning.",
    patterns:[
      {p:"Gerund verbs (-ING)",d:"enjoy, avoid, consider, suggest, recommend, postpone, risk, mind, finish, keep, deny, admit",ex:"We considered postponing the launch."},
      {p:"Infinitive verbs (TO)",d:"decide, plan, agree, offer, refuse, promise, expect, hope, manage, afford, want, need",ex:"The team agreed to extend the deadline."},
      {p:"Both (no change)",d:"begin, start, continue, prefer, like, love, hate",ex:"She began working / began to work at 8."},
      {p:"Both (meaning changes!)",d:"remember, forget, stop, try, regret",ex:"I stopped smoking (quit) vs I stopped to smoke (paused to have one)"},
      {p:"Preposition + gerund",d:"After ALL prepositions, use -ING",ex:"She's interested in attending the conference."},
    ],
    traps:"After a preposition, ALWAYS gerund: 'look forward TO meeting' (not 'to meet'). 'Used to + infinitive' (past habit) vs 'be used to + gerund' (accustomed to)."},
  {id:"conditionals",title:"Conditionals",icon:"🔀",color:"#14b8a6",
    rule:"Conditionals express hypothetical or real situations. The tense in the IF clause determines the type.",
    patterns:[
      {p:"Zero conditional (facts)",d:"If + present, present",ex:"If you heat water to 100°C, it boils."},
      {p:"First conditional (likely future)",d:"If + present, will + base verb",ex:"If sales increase, we will hire more staff."},
      {p:"Second conditional (unlikely/hypothetical)",d:"If + past, would + base verb",ex:"If we had more budget, we would expand."},
      {p:"Third conditional (impossible past)",d:"If + had + V3, would have + V3",ex:"If we had started earlier, we would have finished on time."},
    ],
    traps:"TOEIC favorite: mixing tenses. 'If the report is completed...' (first) vs 'If the report were completed...' (second). Also: 'Unless' = 'if not'. 'Provided that' = 'if'."},
  {id:"relatives",title:"Relative Pronouns",icon:"🔗",color:"#ec4899",
    rule:"Relative pronouns (who, which, that, whose, where, when) connect clauses to nouns.",
    patterns:[
      {p:"Who/That",d:"For people (subject)",ex:"The employee who submitted the report was promoted."},
      {p:"Which/That",d:"For things (subject or object)",ex:"The proposal which was submitted last week has been approved."},
      {p:"Whose",d:"Possession (= of whom / of which)",ex:"The client whose order was delayed received a discount."},
      {p:"Where",d:"For places",ex:"The office where we held the meeting is on the 3rd floor."},
      {p:"When / In which",d:"For times",ex:"Monday is the day when the report is due."},
    ],
    traps:"'That' can replace 'who' or 'which' in defining clauses. But after a comma (non-defining clause), only 'who' or 'which' — NEVER 'that'. 'The CEO, who leads the company...' NOT 'that'."},
  {id:"comparatives",title:"Comparatives & Superlatives",icon:"📊",color:"#f59e0b",
    rule:"Comparing two things: comparative (-er / more). Comparing three or more: superlative (-est / most).",
    patterns:[
      {p:"Short adj (1 syllable)",d:"-er / -est",ex:"Sales were higher this quarter. This is the fastest route."},
      {p:"Long adj (2+ syllables)",d:"more / most",ex:"This approach is more efficient. It's the most comprehensive report."},
      {p:"Irregular forms",d:"good→better→best, bad→worse→worst, far→further→furthest",ex:"This quarter's results are better than expected."},
      {p:"As...as (equality)",d:"as + adjective + as",ex:"The new model is as reliable as the previous one."},
      {p:"Comparative + and + comparative",d:"Shows increasing trend",ex:"Demand is getting higher and higher."},
    ],
    traps:"NEVER 'more faster' or 'most easiest' (double comparative). 'Than' follows comparatives, not superlatives. 'Farther' = distance, 'further' = additional."},
  {id:"articles",title:"Articles (a/an/the/∅)",icon:"📝",color:"#64748b",
    rule:"Articles determine whether a noun is specific (the), non-specific (a/an), or generic (no article).",
    patterns:[
      {p:"The (definite)",d:"Both speaker and listener know which one",ex:"The report you requested is ready."},
      {p:"A/An (indefinite)",d:"One of many, first mention, not specific",ex:"We need to hire a new accountant."},
      {p:"No article",d:"Plural/uncountable in general statements",ex:"Employees must attend training sessions."},
      {p:"The + superlative",d:"Always use 'the' before superlatives",ex:"This is the most important decision of the year."},
      {p:"A = one of many, The = we both know which",d:"Compare these two",ex:"I had a meeting (some meeting). I had the meeting (the one we discussed)."},
    ],
    traps:"No article with uncountable nouns in general: 'Information is available' NOT 'The information is available' (unless specific info). Job titles after 'as': 'She works as a manager' (with article)."},
  {id:"collocations",title:"Collocations & Fixed Expressions",icon:"🧲",color:"#6a8a50",
    rule:"Some word combinations are fixed in English. The TOEIC tests common business collocations.",
    patterns:[
      {p:"Make vs Do",d:"make: a decision, a profit, an offer, progress | do: business, research, damage, a favor",ex:"The company made significant progress last quarter."},
      {p:"Take vs Get",d:"take: action, measures, effect, a break, responsibility | get: approval, permission, a refund",ex:"Management decided to take immediate action."},
      {p:"High frequency TOEIC collocations",d:"place an order, meet a deadline, attend a meeting, reach an agreement, conduct a survey",ex:"We need to place an order before the deadline."},
      {p:"Adjective collocations",d:"heavy traffic/rain, strong demand/growth, sharp increase/decline, steady improvement",ex:"There has been a sharp increase in demand."},
    ],
    traps:"'Make a decision' NOT 'do a decision'. 'Do research' NOT 'make research'. 'Heavy rain' NOT 'strong rain'. These are pure memorization — no rule to apply."},
];

function GrammarRef(p){
  var[open,sO]=useState(p.initial||null);
  return(<div className="enter" style={{padding:"20px 16px 100px"}}>
    <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16}}>
      <button onClick={p.back} style={{background:"none",border:"none",color:"var(--t2)",cursor:"pointer",fontSize:14}}>Back</button>
      <span className="out" style={{fontWeight:700,fontSize:15}}>Grammar Reference</span>
      <div style={{width:40}}/>
    </div>
    <p style={{color:"var(--t2)",fontSize:13,marginBottom:20,lineHeight:1.5}}>Tap a topic to review the key rules, patterns, and TOEIC traps.</p>

    <div style={{display:"flex",flexDirection:"column",gap:8}}>
      {GRAMMAR_SHEETS.map(function(g,i){
        var isOpen=open===g.id;
        return(<div key={g.id} style={{animation:"fadeIn .3s ease-out",animationDelay:(i*.03)+"s",animationFillMode:"both"}}>
          <div className="crd" onClick={function(){sO(isOpen?null:g.id);}}
            style={{cursor:"pointer",padding:"14px 16px",borderColor:isOpen?g.color+"40":"var(--bdr)",background:isOpen?g.color+"08":"var(--bg2)",transition:"all .2s"}}>
            <div style={{display:"flex",alignItems:"center",gap:12}}>
              <div style={{width:38,height:38,borderRadius:10,background:g.color+"20",display:"flex",alignItems:"center",justifyContent:"center",fontSize:18,flexShrink:0}}>{g.icon}</div>
              <div style={{flex:1}}>
                <div className="out" style={{fontWeight:700,fontSize:14}}>{g.title}</div>
                <div style={{fontSize:11,color:"var(--t3)"}}>{g.patterns.length} patterns</div>
              </div>
              <span style={{fontSize:14,color:"var(--t3)",transition:"transform .2s",transform:isOpen?"rotate(90deg)":"rotate(0)"}}>{"›"}</span>
            </div>
          </div>

          {isOpen&&<div style={{padding:"12px 16px 16px",animation:"fadeIn .2s"}}>
            {/* Rule summary */}
            <div style={{padding:"10px 14px",background:"rgba(212,148,58,.06)",border:"1px solid rgba(212,148,58,.12)",borderRadius:10,marginBottom:12}}>
              <p style={{fontSize:13,color:"var(--t1)",lineHeight:1.6,fontWeight:500}}>{g.rule}</p>
            </div>

            {/* Patterns */}
            {g.patterns.map(function(pt,j){
              return(<div key={j} style={{marginBottom:10,paddingLeft:12,borderLeft:"3px solid "+g.color+"40"}}>
                <div className="out" style={{fontSize:13,fontWeight:700,color:g.color,marginBottom:2}}>{pt.p}</div>
                <div style={{fontSize:12,color:"var(--t2)",lineHeight:1.5,marginBottom:4}}>{pt.d}</div>
                <div style={{fontSize:12,color:"var(--t3)",fontStyle:"italic",lineHeight:1.5}}>"{pt.ex}"</div>
              </div>);
            })}

            {/* TOEIC Traps */}
            <div style={{marginTop:8,padding:"10px 14px",background:"rgba(255,71,87,.06)",border:"1px solid rgba(255,71,87,.12)",borderRadius:10}}>
              <p style={{fontSize:11,fontWeight:700,color:"var(--red)",textTransform:"uppercase",letterSpacing:.5,marginBottom:4}}>TOEIC Traps</p>
              <p style={{fontSize:12,color:"var(--t2)",lineHeight:1.6}}>{g.traps}</p>
            </div>
          </div>}
        </div>);
      })}
    </div>
  </div>);
}


// ─── PHRASAL VERB DOJO (3 modes) ───
function PhrasalDojo(p){
  var[mode,setMode]=useState("hub");
  var[ci,sC]=useState(0);var[sc,sSc]=useState(0);var[pick,sPk]=useState(-1);var[ph,sP]=useState("q");
  var[timer,setTimer]=useState(0);var[streak,setStreak]=useState(0);var[bestStreak,setBest]=useState(0);
  var[studyOpen,setStudyOpen]=useState(null);
  var timerRef=useRef(null);

  var grouped=useMemo(function(){
    var g={};
    PHRASAL_VERBS.forEach(function(pv){if(!g[pv.v])g[pv.v]=[];g[pv.v].push(pv);});
    return Object.keys(g).sort().map(function(k){return{verb:k,items:g[k]};});
  },[]);

  var matchQs=useMemo(function(){return shuffle(PHRASAL_VERBS.slice()).slice(0,15);},[]);
  var pickerQs=useMemo(function(){return shuffle(PHRASAL_VERBS.slice()).slice(0,15);},[]);

  var allParticles=useMemo(function(){
    var s={};PHRASAL_VERBS.forEach(function(pv){s[pv.p]=true;});return Object.keys(s);
  },[]);

  // Precompute all options for both quiz modes
  var matchAllOpts=useMemo(function(){
    return matchQs.map(function(mq){
      var pool=PHRASAL_VERBS.filter(function(pv){return pv.pv!==mq.pv;});
      var dists=shuffle(pool).slice(0,3).map(function(d){return d.m;});
      var opts=shuffle(dists.concat([mq.m]));
      return{opts:opts,c:opts.indexOf(mq.m)};
    });
  },[]);

  var pickerAllOpts=useMemo(function(){
    return pickerQs.map(function(pq){
      var pool=allParticles.filter(function(pt){return pt!==pq.p;});
      var dists=shuffle(pool).slice(0,3);
      var opts=shuffle(dists.concat([pq.p]));
      return{opts:opts,c:opts.indexOf(pq.p)};
    });
  },[]);

  // Particle Picker timer (runs in picker mode only)
  useEffect(function(){
    if(mode!=="picker"||ph!=="q")return;
    setTimer(8);
    timerRef.current=setInterval(function(){
      setTimer(function(t){
        if(t<=1){
          clearInterval(timerRef.current);
          setStreak(0);sPk(-1);sP("fb");
          return 0;
        }
        return t-1;
      });
    },1000);
    return function(){clearInterval(timerRef.current);};
  },[ci,mode,ph]);

  function resetQuiz(){sC(0);sSc(0);sPk(-1);sP("q");setTimer(0);setStreak(0);setBest(0);clearInterval(timerRef.current);}

  // ═══ HUB ═══
  if(mode==="hub")return(<div className="enter" style={{padding:"20px 16px 100px"}}>
    <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16}}>
      <button onClick={p.back} style={{background:"none",border:"none",color:"var(--t2)",cursor:"pointer",fontSize:14}}>Back</button>
      <span className="out" style={{fontWeight:700,fontSize:15}}>Phrasal Verb Dojo</span>
      <div style={{width:40}}/>
    </div>
    <div style={{textAlign:"center",marginBottom:24}}>
      <div style={{fontSize:48,marginBottom:8}}>{"⚔️"}</div>
      <p style={{color:"var(--t2)",fontSize:13,lineHeight:1.6}}>{PHRASAL_VERBS.length} essential business phrasal verbs<br/>3 training modes</p>
    </div>
    <div style={{display:"flex",flexDirection:"column",gap:10}}>
      <div className="crd" onClick={function(){setMode("study");}} style={{cursor:"pointer",display:"flex",alignItems:"center",gap:14,padding:"16px"}}>
        <div style={{width:48,height:48,borderRadius:14,background:"linear-gradient(135deg,#5a7a9a,#7a5a80)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:22,flexShrink:0}}>{"📚"}</div>
        <div style={{flex:1}}><div className="out" style={{fontWeight:700,fontSize:15}}>Study Mode</div>
          <div style={{fontSize:11,color:"var(--t3)"}}>Browse by verb family</div></div>
        <span style={{fontSize:16,color:"var(--cyan)"}}>{"→"}</span></div>
      <div className="crd" onClick={function(){resetQuiz();setMode("match");}} style={{cursor:"pointer",display:"flex",alignItems:"center",gap:14,padding:"16px"}}>
        <div style={{width:48,height:48,borderRadius:14,background:"linear-gradient(135deg,#22c55e,#06b6d4)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:22,flexShrink:0}}>{"🧠"}</div>
        <div style={{flex:1}}><div className="out" style={{fontWeight:700,fontSize:15}}>Meaning Match</div>
          <div style={{fontSize:11,color:"var(--t3)"}}>Phrasal verb → pick the definition</div></div>
        <span style={{fontSize:16,color:"var(--cyan)"}}>{"→"}</span></div>
      <div className="crd" onClick={function(){resetQuiz();setMode("picker");}} style={{cursor:"pointer",display:"flex",alignItems:"center",gap:14,padding:"16px"}}>
        <div style={{width:48,height:48,borderRadius:14,background:"linear-gradient(135deg,#f59e0b,#ef4444)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:22,flexShrink:0}}>{"⚡"}</div>
        <div style={{flex:1}}><div className="out" style={{fontWeight:700,fontSize:15}}>Particle Picker</div>
          <div style={{fontSize:11,color:"var(--t3)"}}>Speed round — 8s per question!</div></div>
        <span style={{fontSize:16,color:"var(--cyan)"}}>{"→"}</span></div>
    </div>
  </div>);

  // ═══ STUDY MODE ═══
  if(mode==="study")return(<div className="enter" style={{padding:"20px 16px 100px"}}>
    <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16}}>
      <button onClick={function(){setMode("hub");}} style={{background:"none",border:"none",color:"var(--t2)",cursor:"pointer",fontSize:14}}>Back</button>
      <span className="out" style={{fontWeight:700,fontSize:15}}>Study — {PHRASAL_VERBS.length} verbs</span>
      <div style={{width:40}}/>
    </div>
    <p style={{color:"var(--t2)",fontSize:12,marginBottom:16}}>Tap a verb to see all its phrasal forms.</p>
    <div style={{display:"flex",flexDirection:"column",gap:6}}>
      {grouped.map(function(grp){
        var isOpen=studyOpen===grp.verb;
        return(<div key={grp.verb}>
          <div className="crd" onClick={function(){setStudyOpen(isOpen?null:grp.verb);}}
            style={{cursor:"pointer",padding:"12px 16px",borderColor:isOpen?"rgba(212,148,58,.3)":"var(--bdr)",background:isOpen?"rgba(212,148,58,.04)":"var(--bg2)",transition:"all .2s"}}>
            <div style={{display:"flex",alignItems:"center",justifyContent:"space-between"}}>
              <div style={{display:"flex",alignItems:"center",gap:10}}>
                <span className="out" style={{fontWeight:800,fontSize:16,color:"var(--cyan)",textTransform:"uppercase",minWidth:70}}>{grp.verb}</span>
                <span style={{fontSize:11,color:"var(--t3)"}}>{grp.items.length} form{grp.items.length>1?"s":""}</span>
              </div>
              <span style={{fontSize:14,color:"var(--t3)",transition:"transform .2s",transform:isOpen?"rotate(90deg)":"rotate(0)"}}>{"›"}</span>
            </div>
          </div>
          {isOpen&&<div style={{padding:"8px 0",animation:"fadeIn .2s"}}>
            {grp.items.map(function(pv,j){
              return(<div key={j} style={{padding:"10px 16px 10px 28px",borderLeft:"3px solid var(--cyan)",marginBottom:6,marginLeft:12}}>
                <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:4,flexWrap:"wrap"}}>
                  <span className="out" style={{fontWeight:700,fontSize:14,color:"var(--t1)"}}>{pv.pv}</span>
                  <span style={{fontSize:11,color:"var(--purple)",fontWeight:600,padding:"2px 8px",background:"rgba(139,94,131,.1)",borderRadius:99}}>{pv.fr}</span>
                </div>
                <p style={{fontSize:13,color:"var(--t2)",lineHeight:1.5,marginBottom:4}}>{pv.m}</p>
                <p style={{fontSize:12,color:"var(--t3)",fontStyle:"italic"}}>"{pv.ex}"</p>
              </div>);
            })}
          </div>}
        </div>);
      })}
    </div>
  </div>);

  // ═══ MEANING MATCH ═══
  if(mode==="match"){
    var mq=matchQs[ci];var mOpts=matchAllOpts[ci];

    if(ph==="done"){var mxp=20+sc*4;return(<div className="enter" style={{padding:"20px 16px",minHeight:"100vh",display:"flex",flexDirection:"column",justifyContent:"center",textAlign:"center"}}>
      <div style={{fontSize:48,marginBottom:16,animation:"countUp .6s"}}>{sc>=12?"🏆":sc>=8?"⚔️":"🛡️"}</div>
      <h1 className="out" style={{fontWeight:900,fontSize:28,marginBottom:8}}>Meaning Match</h1>
      <div className="out" style={{fontSize:44,fontWeight:900,color:sc>=12?"var(--green)":sc>=8?"var(--cyan)":"var(--orange)",marginBottom:4}}>{sc}/{matchQs.length}</div>
      <div className="out" style={{fontSize:20,fontWeight:800,color:"var(--gold)",marginBottom:32}}>+{mxp} XP</div>
      <button className="btn1" onClick={function(){resetQuiz();sP("q");}}>Play Again</button>
      <button className="btn2" onClick={function(){setMode("hub");}} style={{marginTop:10,width:"100%"}}>Back to Dojo</button>
    </div>);}

    return(<div style={{padding:"20px 16px",minHeight:"100vh"}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12}}>
        <button onClick={function(){setMode("hub");}} style={{background:"none",border:"none",color:"var(--t2)",cursor:"pointer",fontSize:14}}>Quit</button>
        {streak>=2&&<span className="out" style={{fontSize:12,fontWeight:700,color:"var(--gold)",animation:"pulse .6s infinite"}}>{"🔥"} x{streak}</span>}
        <span className="out" style={{fontSize:13,color:"var(--t2)",fontWeight:600}}>{ci+1}/{matchQs.length}</span></div>
      <Bar value={ci} max={matchQs.length} h={4} color="linear-gradient(90deg,#22c55e,#06b6d4)"/>
      <div style={{textAlign:"center",marginTop:24,marginBottom:24}}>
        <span className="out" style={{fontSize:11,color:"var(--purple)",fontWeight:700,textTransform:"uppercase",letterSpacing:1,display:"block",marginBottom:8}}>What does this mean?</span>
        <span className="out" style={{fontSize:28,fontWeight:900,color:"var(--cyan)"}}>{mq.pv}</span>
      </div>
      <div style={{display:"flex",flexDirection:"column",gap:8}}>
        {mOpts.opts.map(function(opt,i){
          var show=ph==="fb";var isCor=i===mOpts.c;var isPick=i===pick;
          var bg="var(--bg2)";var bd="var(--bdr)";
          if(show&&isCor){bg="rgba(0,230,118,.12)";bd="var(--green)";}
          else if(show&&isPick&&!isCor){bg="rgba(255,71,87,.12)";bd="var(--red)";}
          return(<button key={i} onClick={function(){if(ph!=="q")return;sPk(i);if(i===mOpts.c){sSc(sc+1);setStreak(streak+1);if(streak+1>bestStreak)setBest(streak+1);try{playCorrect();}catch(e){}}else{setStreak(0);try{playWrong();}catch(e){}}sP("fb");}} disabled={show}
            style={{padding:"14px 16px",background:bg,border:"1px solid "+bd,borderRadius:12,cursor:ph==="q"?"pointer":"default",
              fontSize:14,color:"var(--t1)",textAlign:"left",fontFamily:"'DM Sans',sans-serif",transition:"all .2s",lineHeight:1.5}}>
            {opt}</button>);
        })}
      </div>
      {ph==="fb"&&<div style={{marginTop:16,animation:"fadeIn .3s"}}>
        <div className="crd" style={{padding:14,background:"rgba(212,148,58,.06)",borderColor:"rgba(212,148,58,.15)"}}>
          <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:6,flexWrap:"wrap"}}>
            <span className="out" style={{fontWeight:700,fontSize:14,color:"var(--cyan)"}}>{mq.pv}</span>
            <span style={{fontSize:11,color:"var(--purple)",fontWeight:600,padding:"2px 8px",background:"rgba(139,94,131,.1)",borderRadius:99}}>{mq.fr}</span>
          </div>
          <p style={{fontSize:12,color:"var(--t3)",fontStyle:"italic",lineHeight:1.5}}>"{mq.ex}"</p>
        </div>
        <button className="btn1" onClick={function(){sPk(-1);if(ci<matchQs.length-1){sC(ci+1);sP("q");}else{sP("done");p.done(sc,matchQs.length,20+sc*4);}}} style={{marginTop:12}}>{ci<matchQs.length-1?"Next":"See Results"}</button>
      </div>}
    </div>);
  }

  // ═══ PARTICLE PICKER ═══
  if(mode==="picker"){
    var pq=pickerQs[ci];var pOpts=pickerAllOpts[ci];

    if(ph==="done"){var pxp=25+sc*5;return(<div className="enter" style={{padding:"20px 16px",minHeight:"100vh",display:"flex",flexDirection:"column",justifyContent:"center",textAlign:"center"}}>
      <div style={{fontSize:48,marginBottom:16,animation:"countUp .6s"}}>{sc>=12?"⚡":sc>=8?"🔥":"💪"}</div>
      <h1 className="out" style={{fontWeight:900,fontSize:28,marginBottom:8}}>Particle Picker</h1>
      <div className="out" style={{fontSize:44,fontWeight:900,color:sc>=12?"var(--green)":sc>=8?"var(--cyan)":"var(--orange)",marginBottom:4}}>{sc}/{pickerQs.length}</div>
      {bestStreak>=3&&<div style={{fontSize:14,color:"var(--gold)",fontWeight:700,marginBottom:8}}>Best streak: {bestStreak} {"🔥"}</div>}
      <div className="out" style={{fontSize:20,fontWeight:800,color:"var(--gold)",marginBottom:32}}>+{pxp} XP</div>
      <button className="btn1" onClick={function(){resetQuiz();sP("q");}}>Play Again</button>
      <button className="btn2" onClick={function(){setMode("hub");}} style={{marginTop:10,width:"100%"}}>Back to Dojo</button>
    </div>);}

    var timerPct=timer/8*100;
    var timerCol=timer<=2?"var(--red)":timer<=4?"var(--orange)":"var(--cyan)";

    return(<div style={{padding:"20px 16px",minHeight:"100vh"}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12}}>
        <button onClick={function(){clearInterval(timerRef.current);setMode("hub");}} style={{background:"none",border:"none",color:"var(--t2)",cursor:"pointer",fontSize:14}}>Quit</button>
        <div style={{display:"flex",alignItems:"center",gap:8}}>
          {streak>=2&&<span className="out" style={{fontSize:12,fontWeight:700,color:"var(--gold)",animation:"pulse .6s infinite"}}>{"🔥"} x{streak}</span>}
          <span className="out" style={{fontSize:16,fontWeight:800,color:timerCol}}>{timer}s</span>
        </div>
        <span className="out" style={{fontSize:13,color:"var(--t2)",fontWeight:600}}>{ci+1}/{pickerQs.length}</span></div>
      <div style={{height:4,background:"var(--bg3)",borderRadius:2,marginBottom:20,overflow:"hidden"}}>
        <div style={{height:"100%",width:timerPct+"%",background:timerCol,borderRadius:2,transition:"width 1s linear"}}/></div>
      <div style={{textAlign:"center",marginBottom:8}}>
        <span className="out" style={{fontSize:11,color:"var(--red)",fontWeight:700,textTransform:"uppercase",letterSpacing:1}}>Pick the particle!</span>
      </div>
      <div style={{textAlign:"center",marginBottom:12}}>
        <span className="out" style={{fontSize:32,fontWeight:900,color:"var(--t1)"}}>{pq.v} </span>
        <span className="out" style={{fontSize:32,fontWeight:900,color:"var(--cyan)"}}>_____</span>
      </div>
      <div style={{textAlign:"center",marginBottom:24}}>
        <span style={{fontSize:13,color:"var(--t2)",fontStyle:"italic"}}>= {pq.m}</span>
      </div>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
        {pOpts.opts.map(function(opt,i){
          var show=ph==="fb";var isCor=i===pOpts.c;var isPick=i===pick;
          var bg="var(--bg2)";var bd="var(--bdr)";var col="var(--t1)";
          if(show&&isCor){bg="rgba(0,230,118,.15)";bd="var(--green)";col="var(--green)";}
          else if(show&&isPick&&!isCor){bg="rgba(255,71,87,.15)";bd="var(--red)";col="var(--red)";}
          return(<button key={i} onClick={function(){if(ph!=="q")return;clearInterval(timerRef.current);sPk(i);if(i===pOpts.c){sSc(sc+1);setStreak(streak+1);if(streak+1>bestStreak)setBest(streak+1);try{playCorrect();}catch(e){}}else{setStreak(0);try{playWrong();}catch(e){}}sP("fb");}} disabled={show}
            style={{padding:"18px 12px",background:bg,border:"2px solid "+bd,borderRadius:14,cursor:ph==="q"?"pointer":"default",
              fontSize:20,fontWeight:800,color:col,fontFamily:"'DM Sans',sans-serif",transition:"all .15s",textAlign:"center"}}>
            {opt}</button>);
        })}
      </div>
      {ph==="fb"&&<div style={{marginTop:16,animation:"fadeIn .2s"}}>
        {pick===-1&&<div style={{textAlign:"center",marginBottom:12}}>
          <span className="out" style={{fontSize:16,fontWeight:700,color:"var(--red)"}}>{"⏰"} Time's up!</span></div>}
        <div className="crd" style={{padding:14,background:"rgba(212,148,58,.06)",borderColor:"rgba(212,148,58,.15)"}}>
          <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:6,flexWrap:"wrap"}}>
            <span className="out" style={{fontWeight:700,fontSize:15,color:"var(--cyan)"}}>{pq.pv}</span>
            <span style={{fontSize:11,color:"var(--purple)",fontWeight:600,padding:"2px 8px",background:"rgba(139,94,131,.1)",borderRadius:99}}>{pq.fr}</span>
          </div>
          <p style={{fontSize:12,color:"var(--t3)",fontStyle:"italic"}}>"{pq.ex}"</p>
        </div>
        <button className="btn1" onClick={function(){sPk(-1);if(ci<pickerQs.length-1){sC(ci+1);sP("q");}else{sP("done");p.done(sc,pickerQs.length,25+sc*5);}}} style={{marginTop:12}}>{ci<pickerQs.length-1?"Next":"See Results"}</button>
      </div>}
    </div>);
  }

  return null;
}

// ─── STRATEGY CARDS (enriched) ───
function StratCards(p){
  var[open,sO]=useState(null);
  var[filter,sF]=useState("all");
  var filtered=STRATEGIES.filter(function(s){return filter==="all"||s.section===filter||s.section==="Both";});
  var totalTips=0;STRATEGIES.forEach(function(s){totalTips+=s.tips.length;});

  return(<div className="enter" style={{padding:"20px 16px 100px"}}>
    <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16}}>
      <button onClick={p.back} style={{background:"none",border:"none",color:"var(--t2)",cursor:"pointer",fontSize:14}}>Back</button>
      <span className="out" style={{fontWeight:700,fontSize:15}}>Strategy Cards</span>
      <div style={{width:40}}/></div>

    <div className="crd" style={{padding:14,marginBottom:16,textAlign:"center",background:"rgba(212,148,58,.04)",borderColor:"rgba(212,148,58,.12)"}}>
      <span className="out" style={{fontWeight:800,fontSize:22,color:"var(--cyan)"}}>{totalTips}</span>
      <span style={{fontSize:13,color:"var(--t2)",marginLeft:6}}>expert strategies across all TOEIC Parts</span></div>

    <div style={{display:"flex",gap:8,marginBottom:16}}>
      {[{id:"all",l:"All"},{id:"Listening",l:"👂 Listening"},{id:"Reading",l:"📖 Reading"}].map(function(f){
        var act=filter===f.id;return(
        <button key={f.id} onClick={function(){sF(f.id);sO(null);}}
          style={{flex:1,padding:"8px 4px",borderRadius:10,border:act?"1px solid var(--cyan)":"1px solid var(--bdr)",background:act?"rgba(212,148,58,.1)":"var(--bg2)",cursor:"pointer"}}>
          <span className="out" style={{fontSize:12,fontWeight:act?700:500,color:act?"var(--cyan)":"var(--t3)"}}>{f.l}</span></button>);})}
    </div>

    <div style={{display:"flex",flexDirection:"column",gap:10}}>
      {filtered.map(function(s,idx){
        var isOpen=open===idx;
        var tipCount=s.tips.length;
        return(<div key={idx} className="crd" style={{padding:0,overflow:"hidden",borderColor:isOpen?"var(--cyan)44":"var(--bdr)",transition:"all .3s"}}>
          <button onClick={function(){sO(isOpen?null:idx);}} style={{width:"100%",display:"flex",alignItems:"center",gap:14,padding:"14px 16px",background:"none",border:"none",cursor:"pointer",textAlign:"left"}}>
            <div style={{fontSize:26,flexShrink:0}}>{s.icon}</div>
            <div style={{flex:1}}>
              <div className="out" style={{fontWeight:700,fontSize:15,color:"var(--t1)"}}>{s.part} {"—"} {s.title}</div>
              <div style={{display:"flex",gap:8,marginTop:3}}>
                {s.qs>0&&<span style={{fontSize:10,color:"var(--t3)",background:"var(--bg3)",padding:"2px 6px",borderRadius:4}}>{s.qs} Qs</span>}
                <span style={{fontSize:10,color:"var(--cyan)",background:"rgba(212,148,58,.06)",padding:"2px 6px",borderRadius:4}}>{tipCount} tips</span>
              </div></div>
            <span style={{fontSize:12,color:"var(--t3)",transform:isOpen?"rotate(180deg)":"rotate(0)",transition:"transform .2s"}}>{"▼"}</span>
          </button>
          {isOpen&&<div style={{padding:"0 16px 16px",animation:"fadeIn .2s"}}>
            <div style={{padding:"8px 12px",background:"rgba(255,215,0,.05)",borderRadius:10,marginBottom:14}}>
              <p className="out" style={{fontSize:12,fontWeight:700,color:"var(--gold)"}}>{s.points}</p></div>
            {s.tips.map(function(tip,ti){return(
              <div key={ti} style={{padding:"12px 0",borderTop:ti>0?"1px solid var(--bdr)":"none"}}>
                <div style={{display:"flex",gap:8,alignItems:"baseline",marginBottom:4}}>
                  <span className="out" style={{color:"var(--cyan)",fontWeight:800,fontSize:12,flexShrink:0}}>{ti+1}</span>
                  <span className="out" style={{fontWeight:700,fontSize:13,color:"var(--t1)"}}>{tip.t}</span></div>
                <p style={{fontSize:12,color:"var(--t2)",lineHeight:1.6,paddingLeft:20}}>{tip.d}</p>
              </div>);})}
          </div>}
        </div>);
      })}
    </div>

    <div className="crd" style={{marginTop:16,background:"rgba(255,71,87,.06)",borderColor:"rgba(255,71,87,.12)",padding:16,textAlign:"center"}}>
      <p className="out" style={{fontSize:13,fontWeight:700,color:"var(--red)",marginBottom:4}}>Golden Rule</p>
      <p style={{fontSize:13,color:"var(--t2)",lineHeight:1.5}}>If you don't know after 30 seconds on Part 5, GUESS and move on. Time saved = points earned on Part 7.</p>
    </div>
  </div>);
}

// ─── STRATEGY QUIZ ───
function StratQuizPage(p){
  var qs=useMemo(function(){return shuffle(STRAT_QUIZ).slice(0,10);},[]);
  var[ci,sC]=useState(0);var[sc,sSc]=useState(0);var[ph,sP]=useState("intro");var[pick,sPk]=useState(-1);var[sk,sSk]=useState(false);

  function doAns(i){sPk(i);if(i===qs[ci].correct){sSc(sc+1);try{playCorrect();}catch(e){}}else{try{playWrong();}catch(e){}sSk(true);setTimeout(function(){sSk(false);},400);}sP("fb");}
  function nxt(){if(ci<qs.length-1){sC(ci+1);sPk(-1);sP("q");}else{sP("done");p.done(sc,qs.length,20+sc*5);}}

  if(ph==="intro")return(<div className="enter" style={{padding:"20px 16px",minHeight:"100vh",display:"flex",flexDirection:"column",justifyContent:"center",textAlign:"center"}}>
    <div style={{fontSize:56,marginBottom:16}}>🧠</div>
    <h1 className="out" style={{fontWeight:900,fontSize:26,marginBottom:8}}>Strategy Quiz</h1>
    <p style={{color:"var(--t2)",fontSize:13,marginBottom:8,lineHeight:1.6}}>{qs.length} real TOEIC situations.<br/>Do you know the right strategy?</p>
    <p style={{color:"var(--gold)",fontWeight:600,fontSize:14,marginBottom:32}}>Test your exam IQ, not just your English!</p>
    <button className="btn1" onClick={function(){sP("q");}}>Start Quiz</button>
    <button className="btn2" onClick={p.back} style={{marginTop:12,width:"100%"}}>Back</button></div>);

  if(ph==="done"){var xp=20+sc*5;return(<div className="enter" style={{padding:"20px 16px",minHeight:"100vh",display:"flex",flexDirection:"column",justifyContent:"center",textAlign:"center"}}>
    <div style={{fontSize:48,marginBottom:16,animation:"countUp .6s"}}>{sc>=13?"🏆":sc>=9?"⚔️":"🛡️"}</div>
    <h1 className="out" style={{fontWeight:900,fontSize:28,marginBottom:8}}>Quiz Complete!</h1>
    <div className="out" style={{fontSize:44,fontWeight:900,color:sc>=13?"var(--green)":sc>=9?"var(--cyan)":"var(--orange)",marginBottom:4,animation:"countUp .8s"}}>{sc}/{qs.length}</div>
    <div className="out" style={{fontSize:20,fontWeight:800,color:"var(--gold)",marginBottom:12}}>+{xp} XP</div>
    <p style={{fontSize:13,color:"var(--t2)",marginBottom:32}}>Strategy knowledge is just as important as English skills for the TOEIC!</p>
    <button className="btn1" onClick={p.back}>Back to Training</button></div>);}

  var q=qs[ci];
  var partColors={"Part 1":"#22c55e","Part 2":"#f59e0b","Part 3":"#06b6d4","Part 4":"#8b5cf6","Part 5":"#ef4444","Part 6":"#ec4899","Part 7":"#3b82f6","General":"#64748b"};
  var pc=partColors[q.part]||"var(--cyan)";

  return(<div className={sk?"sk":""} style={{padding:"20px 16px",minHeight:"100vh"}}>
    <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:20}}>
      <button onClick={p.back} style={{background:"none",border:"none",color:"var(--t2)",cursor:"pointer",fontSize:14}}>Quit</button>
      <span className="out" style={{fontSize:13,color:"var(--t2)",fontWeight:600}}>{ci+1}/{qs.length}</span></div>
    <Bar value={ci} max={qs.length} h={4} color="linear-gradient(90deg,#b07830,#8b5e83)"/>

    <div style={{marginTop:16,marginBottom:20}}>
      <span className="out" style={{fontSize:10,fontWeight:700,color:pc,textTransform:"uppercase",letterSpacing:1,padding:"3px 8px",background:pc+"18",borderRadius:6}}>{q.part}</span></div>

    <div className="crd" style={{padding:16,marginBottom:20,background:"rgba(139,94,131,.05)",borderColor:"rgba(139,94,131,.12)"}}>
      <p className="out" style={{fontSize:11,fontWeight:600,color:"var(--purple)",textTransform:"uppercase",letterSpacing:.5,marginBottom:8}}>Situation</p>
      <p style={{fontSize:15,color:"var(--t1)",lineHeight:1.6}}>{q.scenario}</p></div>

    <div style={{display:"flex",flexDirection:"column",gap:8}}>
      {q.options.map(function(opt,i){
        var isCor=i===q.correct;var isPick=pick===i;var show=ph==="fb";
        var bg="var(--bg2)";var bd="var(--bdr)";
        if(show&&isCor){bg="rgba(0,230,118,.12)";bd="var(--green)";}
        else if(show&&isPick&&!isCor){bg="rgba(255,71,87,.12)";bd="var(--red)";}
        return(<button key={i} onClick={function(){if(ph==="q")doAns(i);}} disabled={show}
          style={{display:"flex",alignItems:"center",gap:12,padding:"12px 14px",background:bg,border:"1px solid "+bd,borderRadius:12,cursor:ph==="q"?"pointer":"default",fontSize:14,color:"var(--t1)",textAlign:"left",fontFamily:"'DM Sans',sans-serif",transition:"all .2s"}}>
          <div style={{width:24,height:24,borderRadius:"50%",border:"2px solid "+(show&&isCor?"var(--green)":show&&isPick?"var(--red)":"var(--t3)"),display:"flex",alignItems:"center",justifyContent:"center",fontSize:11,fontWeight:700,flexShrink:0,background:show&&isCor?"var(--green)":show&&isPick&&!isCor?"var(--red)":"transparent",color:show&&(isCor||isPick)?"#fff":"var(--t3)"}}>
            {show&&isCor?"✓":show&&isPick?"✗":String.fromCharCode(65+i)}</div>
          <span>{opt}</span></button>);})}
    </div>

    {ph==="fb"&&<div style={{marginTop:16,animation:"fadeIn .3s"}}>
      <div className="crd" style={{background:"rgba(212,148,58,.06)",borderColor:"rgba(212,148,58,.15)",padding:16}}>
        <p className="out" style={{fontSize:12,fontWeight:700,color:"var(--cyan)",textTransform:"uppercase",marginBottom:6}}>Why this works</p>
        <p style={{fontSize:13,color:"var(--t2)",lineHeight:1.6}}>{q.explain}</p></div>
      <button className="btn1" onClick={nxt} style={{marginTop:16}}>{ci<qs.length-1?"Next":"See Results"}</button></div>}
  </div>);
}

// ─── TIME MANAGEMENT SIMULATOR ───
function TimeSim(p){
  var qs=useMemo(function(){return shuffle(QUESTIONS).slice(0,30);},[]);
  var[ci,sC]=useState(0);var[sel,sS]=useState(-1);var[sc,sSc]=useState(0);var[ph,sP]=useState("intro");
  var[elapsed,sEl]=useState(0);var[answers,sAn]=useState([]);var timerRef=useRef(null);
  var[showReview,setShowReview]=useState(false);var[revIdx,setRevIdx]=useState(null);
  var TARGET=600; // 10 minutes = 600 seconds
  var perQ=TARGET/30; // 20s per question target

  useEffect(function(){
    if(ph==="q"){timerRef.current=setInterval(function(){sEl(function(e){return e+1;});},1000);return function(){clearInterval(timerRef.current);};}
  },[ph]);

  function doAns(i){sS(i);var correct=i===qs[ci].c;if(correct){sSc(sc+1);try{playCorrect();}catch(e){}}else{try{playWrong();}catch(e){}}sAn(answers.concat([{q:ci,pick:i,correct:correct,time:elapsed}]));sP("next");}
  function nxt(){if(ci<qs.length-1){sC(ci+1);sS(-1);sP("q");}else{clearInterval(timerRef.current);sP("done");p.done(sc,qs.length,30+sc*5);}}

  function fmtTime(s){var m=Math.floor(s/60);var sec=s%60;return m+":"+(sec<10?"0":"")+sec;}
  var paceStatus=ph==="q"?elapsed/(ci+1):0;
  var ahead=paceStatus<=perQ;

  if(ph==="intro")return(<div className="enter" style={{padding:"20px 16px",minHeight:"100vh",display:"flex",flexDirection:"column",justifyContent:"center",textAlign:"center"}}>
    <div style={{fontSize:56,marginBottom:16}}>⏱️</div>
    <h1 className="out" style={{fontWeight:900,fontSize:26,marginBottom:8}}>Part 5 Exam Simulation</h1>
    <p style={{color:"var(--t2)",fontSize:13,marginBottom:8,lineHeight:1.6}}>30 questions. 10 minutes. Just like the real TOEIC.</p>
    <div className="crd" style={{padding:16,marginBottom:20,textAlign:"left"}}>
      <p style={{fontSize:13,color:"var(--t2)",lineHeight:1.6,marginBottom:8}}>Target pace: <strong style={{color:"var(--cyan)"}}>{Math.round(perQ)}s per question</strong></p>
      <p style={{fontSize:13,color:"var(--t2)",lineHeight:1.6}}>A pace indicator will show if you're on track, ahead, or behind. No feedback during the exam — just like the real thing.</p></div>
    <button className="btn1" onClick={function(){sP("q");}}>Start Exam</button>
    <button className="btn2" onClick={p.back} style={{marginTop:12,width:"100%"}}>Back</button></div>);

  if(ph==="done"){var xp=30+sc*5;var totalTime=elapsed;

    return(<div className="enter" style={{padding:"20px 16px 100px"}}>
    <div style={{textAlign:"center",marginBottom:24}}>
      <div style={{fontSize:48,marginBottom:12,animation:"countUp .6s"}}>{sc>=25?"🏆":sc>=18?"⚔️":"🛡️"}</div>
      <h1 className="out" style={{fontWeight:900,fontSize:28,marginBottom:8}}>Exam Complete</h1>
      <div className="out" style={{fontSize:44,fontWeight:900,color:sc>=25?"var(--green)":sc>=18?"var(--cyan)":"var(--orange)",marginBottom:4,animation:"countUp .8s"}}>{sc}/30</div>
      <div className="out" style={{fontSize:20,fontWeight:800,color:"var(--gold)",marginBottom:8}}>+{xp} XP</div>
      <div style={{fontSize:14,color:"var(--t2)"}}>Total time: <strong style={{color:totalTime<=TARGET?"var(--green)":"var(--red)"}}>{fmtTime(totalTime)}</strong> / {fmtTime(TARGET)}</div>
      <div style={{fontSize:14,color:"var(--t2)",marginTop:4}}>Avg per question: <strong>{(totalTime/30).toFixed(1)}s</strong> (target: {Math.round(perQ)}s)</div>
    </div>
    <div className="crd" style={{padding:16,marginBottom:16}}>
      <p className="out" style={{fontSize:13,fontWeight:700,color:"var(--t1)",marginBottom:8}}>Performance Breakdown</p>
      <div style={{display:"flex",justifyContent:"space-between",marginBottom:8}}>
        <span style={{fontSize:13,color:"var(--t2)"}}>Accuracy</span>
        <span className="out" style={{fontWeight:700,color:"var(--cyan)"}}>{Math.round(sc/30*100)}%</span></div>
      <Bar value={sc} max={30} h={6} color={sc>=25?"var(--green)":sc>=18?"var(--cyan)":"var(--orange)"}/>
      <div style={{display:"flex",justifyContent:"space-between",marginTop:12,marginBottom:8}}>
        <span style={{fontSize:13,color:"var(--t2)"}}>Time Management</span>
        <span className="out" style={{fontWeight:700,color:totalTime<=TARGET?"var(--green)":"var(--red)"}}>{totalTime<=TARGET?"On target":"Over time"}</span></div>
      <Bar value={Math.min(TARGET,TARGET-(totalTime-TARGET))} max={TARGET} h={6} color={totalTime<=TARGET?"var(--green)":"var(--red)"}/>
    </div>

    {/* Answer grid toggle */}
    <button className={showReview?"btn1":"btn2"} onClick={function(){setShowReview(!showReview);setRevIdx(null);}}
      style={{width:"100%",marginBottom:16,fontSize:13}}>{showReview?"Hide Answer Grid":"📋 Review Answers"}</button>

    {showReview&&<div style={{marginBottom:20}}>
      {/* Grid overview */}
      <div style={{display:"grid",gridTemplateColumns:"repeat(10,1fr)",gap:4,marginBottom:16}}>
        {answers.map(function(a,i){
          return(<div key={i} onClick={function(){setRevIdx(revIdx===i?null:i);}}
            style={{padding:"8px 0",textAlign:"center",borderRadius:8,cursor:"pointer",fontSize:12,fontWeight:700,
              background:a.correct?"rgba(0,230,118,.15)":"rgba(255,71,87,.15)",
              border:revIdx===i?"2px solid var(--cyan)":"1.5px solid "+(a.correct?"rgba(0,230,118,.3)":"rgba(255,71,87,.3)"),
              color:a.correct?"var(--green)":"var(--red)",transition:"all .15s"}}>
            {i+1}
          </div>);
        })}
      </div>

      {/* Summary by category */}
      {function(){
        var cats={};
        answers.forEach(function(a,i){
          var cat=qs[a.q].cat;
          if(!cats[cat])cats[cat]={ok:0,total:0};
          cats[cat].total++;
          if(a.correct)cats[cat].ok++;
        });
        var catArr=Object.keys(cats).map(function(k){return{cat:k,ok:cats[k].ok,total:cats[k].total,pct:Math.round(cats[k].ok/cats[k].total*100)};});
        catArr.sort(function(a,b){return a.pct-b.pct;});
        return(<div className="crd" style={{padding:14,marginBottom:16}}>
          <p className="out" style={{fontSize:12,fontWeight:700,color:"var(--t2)",marginBottom:10}}>Score by Category</p>
          {catArr.map(function(c){
            var col=c.pct>=80?"var(--green)":c.pct>=50?"var(--orange)":"var(--red)";
            return(<div key={c.cat} style={{display:"flex",alignItems:"center",gap:8,marginBottom:6}}>
              <span style={{fontSize:11,color:"var(--t2)",flex:1,minWidth:0}}>{c.cat}</span>
              <span className="out" style={{fontSize:12,fontWeight:700,color:col,width:50,textAlign:"right"}}>{c.ok}/{c.total}</span>
              <div style={{width:60,height:5,background:"var(--bg3)",borderRadius:3,overflow:"hidden"}}>
                <div style={{height:"100%",width:c.pct+"%",background:col,borderRadius:3}}/></div>
            </div>);
          })}
        </div>);
      }()}

      {/* Detailed review for selected question */}
      {revIdx!==null&&function(){
        var a=answers[revIdx];var q=qs[a.q];
        var catToSheet={"Tenses":"tenses","Passive Voice":"passive","Subject-Verb Agreement":"subjverb","Word Families":"wordform","Connectors":"connectors","Prepositions":"prepositions","Gerunds vs Infinitives":"gerinf","Conditionals":"conditionals","Relative Pronouns":"relatives","Collocations":"collocations","Comparatives":"comparatives","Articles":"articles"};
        var sheetId=catToSheet[q.cat]||null;
        return(<div className="crd" style={{padding:16,animation:"fadeIn .2s",borderColor:a.correct?"rgba(0,230,118,.2)":"rgba(255,71,87,.2)"}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10}}>
            <span className="out" style={{fontSize:12,fontWeight:700,color:"var(--purple)",textTransform:"uppercase",letterSpacing:1}}>{q.cat}</span>
            <span style={{fontSize:11,color:a.correct?"var(--green)":"var(--red)",fontWeight:700}}>{a.correct?"Correct":"Wrong"} — Q{revIdx+1}</span>
          </div>
          <p className="out" style={{fontSize:15,fontWeight:700,lineHeight:1.5,marginBottom:14,color:"var(--t1)"}}>{q.s}</p>
          <div style={{display:"flex",flexDirection:"column",gap:6}}>
            {q.o.map(function(opt,i){
              var isCor=i===q.c;var isPick=i===a.pick;
              var bg="var(--bg2)";var bd="var(--bdr)";var txt="var(--t1)";
              if(isCor){bg="rgba(0,230,118,.1)";bd="var(--green)";txt="var(--green)";}
              else if(isPick&&!isCor){bg="rgba(255,71,87,.1)";bd="var(--red)";txt="var(--red)";}
              return(<div key={i} style={{display:"flex",alignItems:"center",gap:10,padding:"10px 12px",background:bg,border:"1px solid "+bd,borderRadius:10,fontSize:13,color:txt}}>
                <div style={{width:22,height:22,borderRadius:"50%",border:"2px solid "+(isCor?"var(--green)":isPick?"var(--red)":"var(--t3)"),
                  display:"flex",alignItems:"center",justifyContent:"center",fontSize:10,fontWeight:700,flexShrink:0,
                  background:isCor?"var(--green)":isPick&&!isCor?"var(--red)":"transparent",
                  color:isCor||isPick?"#fff":"var(--t3)"}}>
                  {isCor?"✓":isPick?"✗":String.fromCharCode(65+i)}</div>
                <span style={{fontWeight:isCor||isPick?600:400}}>{opt}</span>
              </div>);
            })}
          </div>
          {q.x&&<div style={{marginTop:10,padding:10,background:"rgba(212,148,58,.06)",borderRadius:8,border:"1px solid rgba(212,148,58,.12)"}}>
            <p style={{fontSize:12,color:"var(--t2)",lineHeight:1.6}}>{q.x}</p>
          </div>}
          {sheetId&&<button onClick={function(){p.nav("gramref",sheetId);}}
            style={{marginTop:10,width:"100%",padding:"10px 14px",background:"rgba(59,130,246,.08)",border:"1px solid rgba(59,130,246,.2)",borderRadius:10,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",gap:8,fontFamily:"'DM Sans',sans-serif"}}>
            <span style={{fontSize:14}}>📖</span>
            <span className="out" style={{fontSize:12,fontWeight:600,color:"#3b82f6"}}>Review: {q.cat}</span>
          </button>}
          <div style={{display:"flex",gap:8,marginTop:12}}>
            {revIdx>0&&<button className="btn2" onClick={function(){setRevIdx(revIdx-1);}} style={{flex:1,fontSize:12}}>← Prev</button>}
            {revIdx<answers.length-1&&<button className="btn2" onClick={function(){setRevIdx(revIdx+1);}} style={{flex:1,fontSize:12}}>Next →</button>}
          </div>
        </div>);
      }()}
    </div>}

    <button className="btn1" onClick={p.back}>Back to Training</button></div>);}

  // Active quiz (no feedback, exam mode)
  var q=qs[ci];var timeColor=elapsed>TARGET?"var(--red)":elapsed>TARGET*0.8?"var(--orange)":"var(--t2)";
  return(<div style={{padding:"20px 16px",minHeight:"100vh"}}>
    <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12}}>
      <button onClick={function(){clearInterval(timerRef.current);p.back();}} style={{background:"none",border:"none",color:"var(--t2)",cursor:"pointer",fontSize:14}}>Quit</button>
      <div className="out" style={{fontSize:18,fontWeight:800,color:timeColor}}>{fmtTime(elapsed)}</div>
      <span className="out" style={{fontSize:13,color:"var(--t2)",fontWeight:600}}>{ci+1}/30</span></div>
    <Bar value={ci} max={30} h={4}/>

    {/* Pace indicator */}
    <div style={{display:"flex",alignItems:"center",justifyContent:"center",gap:8,marginTop:8,marginBottom:20}}>
      <div style={{width:8,height:8,borderRadius:"50%",background:ahead?"var(--green)":"var(--red)"}}/>
      <span style={{fontSize:11,color:ahead?"var(--green)":"var(--red)",fontWeight:600}} className="out">{ahead?"On pace":"Behind pace"} — {(elapsed/(ci+1)).toFixed(0)}s/q (target: {Math.round(perQ)}s)</span>
    </div>

    {ph==="next"?
      <div style={{textAlign:"center",padding:"40px 0"}}>
        <button className="btn1" onClick={nxt}>{ci<qs.length-1?"Next Question ("+(ci+2)+"/30)":"Finish Exam"}</button></div>
    :<div>
      <span className="out" style={{fontSize:11,fontWeight:600,color:"var(--purple)",textTransform:"uppercase",letterSpacing:1}}>{q.cat}</span>
      <h2 className="out" style={{fontWeight:700,fontSize:19,lineHeight:1.5,marginBottom:24,marginTop:8}}>{q.s}</h2>
      <div style={{display:"flex",flexDirection:"column",gap:10}}>
        {q.o.map(function(opt,i){
          return(<button key={i} onClick={function(){doAns(i);}}
            style={{display:"flex",alignItems:"center",gap:12,padding:"14px 16px",background:"var(--bg2)",border:"1px solid var(--bdr)",borderRadius:12,cursor:"pointer",fontSize:15,color:"var(--t1)",textAlign:"left",fontFamily:"'DM Sans',sans-serif",transition:"all .2s"}}>
            <div style={{width:28,height:28,borderRadius:"50%",border:"2px solid var(--t3)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:12,fontWeight:700,flexShrink:0,color:"var(--t3)"}}>
              {String.fromCharCode(65+i)}</div>
            <span>{opt}</span></button>);})}
      </div>
    </div>}
  </div>);
}

// ─── PART 6 TEXT COMPLETION ───
function Part6Drill(p){
  var texts=useMemo(function(){return shuffle(PART6_TEXTS).slice(0,6);},[]);
  var[ti,sTi]=useState(0);var[bi,sBi]=useState(0);var[sc,sSc]=useState(0);var[totalB,sTB]=useState(0);
  var[ph,sP]=useState("intro");var[pick,sPk]=useState(-1);var[sk,sSk]=useState(false);

  // Count total blanks
  var totalBlanks=useMemo(function(){var c=0;texts.forEach(function(t){t.parts.forEach(function(p){if(p.blank)c++;});});return c;},[]);

  // Get current text and its blanks
  var curText=texts[ti];
  var blanks=curText?curText.parts.filter(function(p){return p.blank;}):[];
  // Shuffle options for each blank — keep track of correct answer
  var shuffledBlanks=useMemo(function(){
    var all=[];
    texts.forEach(function(t){
      t.parts.forEach(function(p){
        if(!p.blank)return;
        var indices=[0,1,2,3];
        for(var i=indices.length-1;i>0;i--){var j=Math.floor(Math.random()*(i+1));var tmp=indices[i];indices[i]=indices[j];indices[j]=tmp;}
        all.push({options:indices.map(function(k){return p.options[k];}),correct:indices.indexOf(p.correct),x:p.x});
      });
    });
    return all;
  },[]);
  var blankOffset=useMemo(function(){var c=0;for(var i=0;i<ti;i++){texts[i].parts.forEach(function(p){if(p.blank)c++;});}return c;},[ti]);
  var curBlank=shuffledBlanks[blankOffset+bi];

  function doAns(i){
    sPk(i);
    if(i===curBlank.correct){sSc(sc+1);try{playCorrect();}catch(e){}}
    else{try{playWrong();}catch(e){}sSk(true);setTimeout(function(){sSk(false);},400);}
    sTB(totalB+1);sP("fb");
  }
  function nxt(){
    sPk(-1);
    if(bi<blanks.length-1){sBi(bi+1);sP("q");}
    else if(ti<texts.length-1){sTi(ti+1);sBi(0);sP("text");}
    else{sP("done");p.done(sc,totalBlanks,25+sc*5);}
  }

  if(ph==="intro")return(<div className="enter" style={{padding:"20px 16px",minHeight:"100vh",display:"flex",flexDirection:"column",justifyContent:"center",textAlign:"center"}}>
    <div style={{fontSize:56,marginBottom:16}}>📜</div>
    <h1 className="out" style={{fontWeight:900,fontSize:26,marginBottom:8}}>Part 6 — Text Completion</h1>
    <p style={{color:"var(--t2)",fontSize:13,marginBottom:8,lineHeight:1.6}}>{texts.length} business texts with 4 blanks each.<br/>Read the full text, then complete the blanks.</p>
    <p style={{color:"var(--gold)",fontWeight:600,fontSize:14,marginBottom:32}}>Context is everything here!</p>
    <button className="btn1" onClick={function(){sP("text");}}>Start</button>
    <button className="btn2" onClick={p.back} style={{marginTop:12,width:"100%"}}>Back</button></div>);

  if(ph==="done"){var xp=25+sc*5;return(<div className="enter" style={{padding:"20px 16px",minHeight:"100vh",display:"flex",flexDirection:"column",justifyContent:"center",textAlign:"center"}}>
    <div style={{fontSize:48,marginBottom:16,animation:"countUp .6s"}}>{sc>=totalBlanks*0.8?"🏆":sc>=totalBlanks*0.5?"⚔️":"🛡️"}</div>
    <h1 className="out" style={{fontWeight:900,fontSize:28,marginBottom:8}}>Part 6 Complete</h1>
    <div className="out" style={{fontSize:44,fontWeight:900,color:sc>=totalBlanks*0.8?"var(--green)":sc>=totalBlanks*0.5?"var(--cyan)":"var(--orange)",marginBottom:4,animation:"countUp .8s"}}>{sc}/{totalBlanks}</div>
    <div className="out" style={{fontSize:20,fontWeight:800,color:"var(--gold)",marginBottom:32}}>+{xp} XP</div>
    <button className="btn1" onClick={p.back}>Back to Training</button></div>);}

  // Build text display with blanks highlighted
  function renderText(){
    var blankIdx=0;
    return curText.parts.map(function(part,i){
      if(part.blank){
        var thisIdx=blankIdx;blankIdx++;
        var isCurrent=thisIdx===bi;
        var answered=thisIdx<bi;
        var label=answered?blanks[thisIdx].options[blanks[thisIdx].correct]:"____("+(thisIdx+1)+")____";
        return <span key={i} style={{padding:"2px 6px",borderRadius:4,fontWeight:700,
          background:isCurrent?"rgba(212,148,58,.2)":answered?"rgba(0,230,118,.1)":"var(--bg3)",
          color:isCurrent?"var(--cyan)":answered?"var(--green)":"var(--t3)",
          border:isCurrent?"1px solid var(--cyan)":"1px solid transparent"}}>{label}</span>;
      }
      return <span key={i}>{part.text}</span>;
    });
  }

  if(ph==="text")return(<div className="enter" style={{padding:"20px 16px",minHeight:"100vh"}}>
    <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16}}>
      <button onClick={p.back} style={{background:"none",border:"none",color:"var(--t2)",cursor:"pointer",fontSize:14}}>Quit</button>
      <span className="out" style={{fontSize:13,color:"var(--t2)",fontWeight:600}}>Text {ti+1}/{texts.length}</span></div>
    <div style={{display:"flex",gap:6,marginBottom:12}}>
      <span style={{fontSize:10,padding:"3px 8px",background:"rgba(139,94,131,.1)",color:"var(--purple)",borderRadius:6,fontWeight:600}} className="out">{curText.type}</span>
      <span style={{fontSize:10,padding:"3px 8px",background:"var(--bg3)",color:"var(--t3)",borderRadius:6}} className="out">From: {curText.from}</span></div>
    <div className="out" style={{fontWeight:700,fontSize:14,marginBottom:12,color:"var(--t1)"}}>Subject: {curText.subject}</div>
    <div className="crd" style={{padding:16,marginBottom:20}}>
      <p style={{fontSize:13,color:"var(--t2)",lineHeight:2,whiteSpace:"pre-line"}}>{renderText()}</p></div>
    <p style={{fontSize:12,color:"var(--t3)",textAlign:"center",marginBottom:16}}>Read the full text, then tap below to fill in the blanks.</p>
    <button className="btn1" onClick={function(){sP("q");}}>Fill in the blanks</button></div>);

  // Question mode
  return(<div className={sk?"sk":""} style={{padding:"20px 16px",minHeight:"100vh"}}>
    <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16}}>
      <button onClick={p.back} style={{background:"none",border:"none",color:"var(--t2)",cursor:"pointer",fontSize:14}}>Quit</button>
      <span className="out" style={{fontSize:13,color:"var(--t2)",fontWeight:600}}>Blank {totalB+1}/{totalBlanks}</span></div>
    <Bar value={totalB} max={totalBlanks} h={4} color="linear-gradient(90deg,#c4587a,#8b5e83)"/>
    <div style={{marginTop:12,marginBottom:6}}>
      <span style={{fontSize:10,padding:"3px 8px",background:"rgba(139,94,131,.1)",color:"var(--purple)",borderRadius:6,fontWeight:600}} className="out">{curText.type}: {curText.subject}</span></div>
    <div className="crd" style={{padding:14,marginBottom:20,background:"var(--bg3)"}}>
      <p style={{fontSize:12,color:"var(--t2)",lineHeight:1.9,whiteSpace:"pre-line"}}>{renderText()}</p></div>
    <p className="out" style={{fontWeight:700,fontSize:14,marginBottom:12,color:"var(--cyan)"}}>Fill blank ({bi+1}):</p>
    <div style={{display:"flex",flexDirection:"column",gap:8}}>
      {curBlank.options.map(function(opt,i){
        var isCor=i===curBlank.correct;var isPick=pick===i;var show=ph==="fb";
        var bg="var(--bg2)";var bd="var(--bdr)";
        if(show&&isCor){bg="rgba(0,230,118,.12)";bd="var(--green)";}
        else if(show&&isPick&&!isCor){bg="rgba(255,71,87,.12)";bd="var(--red)";}
        return(<button key={i} onClick={function(){if(ph==="q")doAns(i);}} disabled={show}
          style={{padding:"12px 14px",background:bg,border:"1px solid "+bd,borderRadius:12,cursor:ph==="q"?"pointer":"default",fontSize:14,color:"var(--t1)",textAlign:"left",fontFamily:"'DM Sans',sans-serif",transition:"all .2s"}}>
          {opt}</button>);})}
    </div>
    {ph==="fb"&&<div style={{marginTop:16,animation:"fadeIn .3s"}}>
      <div className="crd" style={{background:"rgba(212,148,58,.06)",borderColor:"rgba(212,148,58,.15)",padding:14}}>
        <p style={{fontSize:13,color:"var(--t2)",lineHeight:1.6}}>{curBlank.x}</p></div>
      <button className="btn1" onClick={nxt} style={{marginTop:14}}>{bi<blanks.length-1?"Next Blank":(ti<texts.length-1?"Next Text":"See Results")}</button></div>}
  </div>);
}

// ─── PART 7 READING COMPREHENSION ───
function Part7Read(p){
  var passages=useMemo(function(){return shuffle(PART7_PASSAGES).slice(0,7);},[]);
  var[pi,sPi]=useState(0);var[qi,sQi]=useState(0);var[sc,sSc]=useState(0);var[totalQ,sTQ]=useState(0);
  var[ph,sP]=useState("intro");var[pick,sPk]=useState(-1);var[sk,sSk]=useState(false);
  var[showQPreview,setShowQPreview]=useState(false);var[showText,setShowText]=useState(false);

  var totalQs=useMemo(function(){var c=0;passages.forEach(function(p){c+=p.questions.length;});return c;},[]);
  var curPass=passages[pi];
  var curQ=curPass?curPass.questions[qi]:null;

  function doAns(i){
    sPk(i);
    if(i===curQ.correct){sSc(sc+1);try{playCorrect();}catch(e){}}
    else{try{playWrong();}catch(e){}sSk(true);setTimeout(function(){sSk(false);},400);}
    sTQ(totalQ+1);sP("fb");
  }
  function nxt(){
    sPk(-1);
    if(qi<curPass.questions.length-1){sQi(qi+1);sP("q");}
    else if(pi<passages.length-1){sPi(pi+1);sQi(0);sP("read");}
    else{sP("done");p.done(sc,totalQs,30+sc*5);}
  }

  if(ph==="intro")return(<div className="enter" style={{padding:"20px 16px",minHeight:"100vh",display:"flex",flexDirection:"column",justifyContent:"center",textAlign:"center"}}>
    <div style={{fontSize:56,marginBottom:16}}>📖</div>
    <h1 className="out" style={{fontWeight:900,fontSize:26,marginBottom:8}}>Part 7 — Reading</h1>
    <p style={{color:"var(--t2)",fontSize:13,marginBottom:8,lineHeight:1.6}}>{passages.length} passages with 3-4 questions each.<br/>Read the questions FIRST, then scan for answers!</p>
    <p style={{color:"var(--gold)",fontWeight:600,fontSize:14,marginBottom:32}}>Strategy: Questions first, then scan!</p>
    <button className="btn1" onClick={function(){sP("read");}}>Start</button>
    <button className="btn2" onClick={p.back} style={{marginTop:12,width:"100%"}}>Back</button></div>);

  if(ph==="done"){var xp=30+sc*5;return(<div className="enter" style={{padding:"20px 16px",minHeight:"100vh",display:"flex",flexDirection:"column",justifyContent:"center",textAlign:"center"}}>
    <div style={{fontSize:48,marginBottom:16,animation:"countUp .6s"}}>{sc>=totalQs*0.8?"🏆":sc>=totalQs*0.5?"⚔️":"🛡️"}</div>
    <h1 className="out" style={{fontWeight:900,fontSize:28,marginBottom:8}}>Reading Complete</h1>
    <div className="out" style={{fontSize:44,fontWeight:900,color:sc>=totalQs*0.8?"var(--green)":sc>=totalQs*0.5?"var(--cyan)":"var(--orange)",marginBottom:4,animation:"countUp .8s"}}>{sc}/{totalQs}</div>
    <div className="out" style={{fontSize:20,fontWeight:800,color:"var(--gold)",marginBottom:32}}>+{xp} XP</div>
    <button className="btn1" onClick={p.back}>Back to Training</button></div>);}

// Reading view — show passage with question preview toggle
  if(ph==="read")return(<div className="enter" style={{padding:"20px 16px 100px"}}>
    <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16}}>
      <button onClick={p.back} style={{background:"none",border:"none",color:"var(--t2)",cursor:"pointer",fontSize:14}}>Quit</button>
      <span className="out" style={{fontSize:13,color:"var(--t2)",fontWeight:600}}>Passage {pi+1}/{passages.length}</span></div>
    <Bar value={totalQ} max={totalQs} h={4} color="linear-gradient(90deg,#3b82f6,#06b6d4)"/>
    <div style={{display:"flex",gap:6,marginTop:12,marginBottom:12}}>
      <span style={{fontSize:10,padding:"3px 8px",background:"rgba(59,130,246,.1)",color:"#3b82f6",borderRadius:6,fontWeight:600}} className="out">{curPass.type}</span>
      <button onClick={function(){setShowQPreview(!showQPreview);}} style={{fontSize:10,padding:"3px 8px",background:showQPreview?"rgba(139,94,131,.15)":"var(--bg3)",color:showQPreview?"var(--purple)":"var(--t3)",borderRadius:6,border:"none",cursor:"pointer",fontWeight:600}} className="out">{showQPreview?"Hide questions ▲":"Preview questions ▼"} ({curPass.questions.length})</button></div>
    {showQPreview&&<div className="crd" style={{padding:12,marginBottom:12,borderColor:"rgba(139,94,131,.2)",background:"rgba(139,94,131,.04)"}}>
      <div style={{fontSize:10,color:"var(--purple)",fontWeight:700,textTransform:"uppercase",letterSpacing:1,marginBottom:8}}>Read these first!</div>
      {curPass.questions.map(function(q,i){return(<div key={i} style={{fontSize:12,color:"var(--t2)",lineHeight:1.6,padding:"4px 0",borderBottom:i<curPass.questions.length-1?"1px solid var(--bdr)":"none"}}><span style={{color:"var(--purple)",fontWeight:700}}>Q{i+1}.</span> {q.q}</div>);})}</div>}
    <div className="crd" style={{padding:16,marginBottom:16}}>
      <p style={{fontSize:13,color:"var(--t2)",lineHeight:1.8,whiteSpace:"pre-line"}}>{curPass.text}</p></div>
    <button className="btn1" onClick={function(){sP("q");setShowQPreview(false);setShowText(false);}}>Answer Questions</button></div>);

// Question mode
  return(<div className={sk?"sk":""} style={{padding:"20px 16px",minHeight:"100vh"}}>
    <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16}}>
      <button onClick={p.back} style={{background:"none",border:"none",color:"var(--t2)",cursor:"pointer",fontSize:14}}>Quit</button>
      <span className="out" style={{fontSize:13,color:"var(--t2)",fontWeight:600}}>Q {totalQ+1}/{totalQs}</span></div>
    <Bar value={totalQ} max={totalQs} h={4} color="linear-gradient(90deg,#3b82f6,#06b6d4)"/>
    <div style={{display:"flex",gap:6,marginTop:12,marginBottom:6}}>
      <span style={{fontSize:10,padding:"3px 8px",background:"rgba(59,130,246,.1)",color:"#3b82f6",borderRadius:6,fontWeight:600}} className="out">{curPass.type} — Passage {pi+1}</span>
      <button onClick={function(){setShowText(!showText);}} style={{fontSize:10,padding:"3px 8px",background:showText?"rgba(6,182,212,.15)":"var(--bg3)",color:showText?"var(--cyan)":"var(--t3)",borderRadius:6,border:"none",cursor:"pointer",fontWeight:600}} className="out">{showText?"Hide text ▲":"Show text ▼"}</button></div>
    {showText&&<div className="crd" style={{padding:14,marginBottom:12,maxHeight:200,overflowY:"auto",borderColor:"rgba(6,182,212,.2)"}}>
      <p style={{fontSize:12,color:"var(--t2)",lineHeight:1.7,whiteSpace:"pre-line"}}>{curPass.text}</p></div>}

    <h2 className="out" style={{fontWeight:700,fontSize:17,lineHeight:1.5,marginBottom:20,marginTop:12}}>{curQ.q}</h2>
    <div style={{display:"flex",flexDirection:"column",gap:8}}>
      {curQ.options.map(function(opt,i){
        var isCor=i===curQ.correct;var isPick=pick===i;var show=ph==="fb";
        var bg="var(--bg2)";var bd="var(--bdr)";
        if(show&&isCor){bg="rgba(0,230,118,.12)";bd="var(--green)";}
        else if(show&&isPick&&!isCor){bg="rgba(255,71,87,.12)";bd="var(--red)";}
        return(<button key={i} onClick={function(){if(ph==="q")doAns(i);}} disabled={show}
          style={{display:"flex",alignItems:"center",gap:12,padding:"12px 14px",background:bg,border:"1px solid "+bd,borderRadius:12,cursor:ph==="q"?"pointer":"default",fontSize:14,color:"var(--t1)",textAlign:"left",fontFamily:"'DM Sans',sans-serif",transition:"all .2s"}}>
          <div style={{width:24,height:24,borderRadius:"50%",border:"2px solid "+(show&&isCor?"var(--green)":show&&isPick?"var(--red)":"var(--t3)"),display:"flex",alignItems:"center",justifyContent:"center",fontSize:11,fontWeight:700,flexShrink:0,background:show&&isCor?"var(--green)":show&&isPick&&!isCor?"var(--red)":"transparent",color:show&&(isCor||isPick)?"#fff":"var(--t3)"}}>
            {show&&isCor?"✓":show&&isPick?"✗":String.fromCharCode(65+i)}</div>
          <span>{opt}</span></button>);})}
    </div>
    {ph==="fb"&&<div style={{marginTop:16,animation:"fadeIn .3s"}}>
      <div className="crd" style={{background:"rgba(212,148,58,.06)",borderColor:"rgba(212,148,58,.15)",padding:14}}>
        <p style={{fontSize:13,color:"var(--t2)",lineHeight:1.6}}>{curQ.x}</p></div>
      <button className="btn1" onClick={nxt} style={{marginTop:14}}>{qi<curPass.questions.length-1?"Next Question":(pi<passages.length-1?"Next Passage":"See Results")}</button></div>}
  </div>);
}

// ─── FALSE FRIENDS ───
function FalseFriends(p){
  var items=useMemo(function(){return shuffle(FALSE_FRIENDS).slice(0,12);},[]);
  var[ci,sC]=useState(0);var[sc,sSc]=useState(0);var[ph,sP]=useState("intro");var[pick,sPk]=useState(-1);var[sk,sSk]=useState(false);

  function doAns(i){
    sPk(i);
    if(i===items[ci].correct){sSc(sc+1);try{playCorrect();}catch(e){}}
    else{try{playWrong();}catch(e){}sSk(true);setTimeout(function(){sSk(false);},400);}
    sP("fb");
  }
  function nxt(){if(ci<items.length-1){sC(ci+1);sPk(-1);sP("q");}else{sP("done");p.done(sc,items.length,20+sc*5);}}

  if(ph==="intro")return(<div className="enter" style={{padding:"20px 16px",minHeight:"100vh",display:"flex",flexDirection:"column",justifyContent:"center",textAlign:"center"}}>
    <div style={{fontSize:56,marginBottom:16}}>🎭</div>
    <h1 className="out" style={{fontWeight:900,fontSize:26,marginBottom:8}}>False Friends</h1>
    <p style={{color:"var(--t2)",fontSize:13,marginBottom:8,lineHeight:1.6}}>These English words LOOK like French words but mean something completely different!</p>
    <p style={{color:"var(--gold)",fontWeight:600,fontSize:14,marginBottom:32}}>Can you avoid the francophone traps?</p>
    <button className="btn1" onClick={function(){sP("q");}}>Start</button>
    <button className="btn2" onClick={p.back} style={{marginTop:12,width:"100%"}}>Back</button></div>);

  if(ph==="done"){var xp=20+sc*5;return(<div className="enter" style={{padding:"20px 16px",minHeight:"100vh",display:"flex",flexDirection:"column",justifyContent:"center",textAlign:"center"}}>
    <div style={{fontSize:48,marginBottom:16,animation:"countUp .6s"}}>{sc>=10?"🏆":sc>=7?"⚔️":"🛡️"}</div>
    <h1 className="out" style={{fontWeight:900,fontSize:28,marginBottom:8}}>False Friends Defeated!</h1>
    <div className="out" style={{fontSize:44,fontWeight:900,color:sc>=10?"var(--green)":sc>=7?"var(--cyan)":"var(--orange)",marginBottom:4,animation:"countUp .8s"}}>{sc}/{items.length}</div>
    <div className="out" style={{fontSize:20,fontWeight:800,color:"var(--gold)",marginBottom:32}}>+{xp} XP</div>
    <button className="btn1" onClick={p.back}>Back to Training</button></div>);}

  var it=items[ci];

  return(<div className={sk?"sk":""} style={{padding:"20px 16px",minHeight:"100vh"}}>
    <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:20}}>
      <button onClick={p.back} style={{background:"none",border:"none",color:"var(--t2)",cursor:"pointer",fontSize:14}}>Quit</button>
      <span className="out" style={{fontSize:13,color:"var(--t2)",fontWeight:600}}>{ci+1}/{items.length}</span></div>
    <Bar value={ci} max={items.length} h={4} color="linear-gradient(90deg,#ec4899,#f59e0b)"/>

    <div style={{marginTop:20,marginBottom:20}}>
      <div className="out" style={{fontSize:11,color:"var(--purple)",textTransform:"uppercase",letterSpacing:1,fontWeight:600,marginBottom:16}}>What does the underlined word mean here?</div>
      <div className="crd" style={{padding:16,background:"rgba(139,94,131,.05)",borderColor:"rgba(139,94,131,.12)"}}>
        <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:10}}>
          <SpeakBtn text={it.ex} size={28} rate={0.85}/>
          <p style={{fontSize:15,color:"var(--t1)",lineHeight:1.6}}>
            {it.ex.split(new RegExp("("+it.en+")","i")).map(function(part,i){
              if(part.toLowerCase()===it.en.toLowerCase()) return (<span key={i} style={{color:"var(--gold)",fontWeight:800,textDecoration:"underline",textDecorationColor:"var(--gold)",textUnderlineOffset:3}}>{part}</span>);
              return (<span key={i}>{part}</span>);
            })}
          </p>
        </div>
      </div>
    </div>

    <div style={{display:"flex",flexDirection:"column",gap:8}}>
      {it.opts.map(function(opt,i){
        var isCor=i===it.correct;var isPick=pick===i;var show=ph==="fb";
        var bg="var(--bg2)";var bd="var(--bdr)";
        if(show&&isCor){bg="rgba(0,230,118,.12)";bd="var(--green)";}
        else if(show&&isPick&&!isCor){bg="rgba(255,71,87,.12)";bd="var(--red)";}
        return(<button key={i} onClick={function(){if(ph==="q")doAns(i);}} disabled={show}
          style={{display:"flex",alignItems:"center",gap:12,padding:"14px 16px",background:bg,border:"1px solid "+bd,borderRadius:12,cursor:ph==="q"?"pointer":"default",fontSize:14,color:"var(--t1)",textAlign:"left",fontFamily:"'DM Sans',sans-serif",transition:"all .2s"}}>
          <div style={{width:26,height:26,borderRadius:"50%",border:"2px solid "+(show&&isCor?"var(--green)":show&&isPick?"var(--red)":"var(--t3)"),display:"flex",alignItems:"center",justifyContent:"center",fontSize:11,fontWeight:700,flexShrink:0,background:show&&isCor?"var(--green)":show&&isPick&&!isCor?"var(--red)":"transparent",color:show&&(isCor||isPick)?"#fff":"var(--t3)"}}>
            {show&&isCor?"✓":show&&isPick?"✗":String.fromCharCode(65+i)}</div>
          <span>{opt}</span></button>);})}
    </div>

    {ph==="fb"&&<div style={{marginTop:16,animation:"fadeIn .3s"}}>
      <div className="crd" style={{background:"rgba(212,148,58,.06)",borderColor:"rgba(212,148,58,.15)",padding:16}}>
        <div style={{display:"flex",alignItems:"center",gap:6,marginBottom:8}}>
          <span style={{fontSize:14}}>🎭</span>
          <span className="out" style={{fontWeight:700,fontSize:13,color:"var(--orange)"}}>False Friend Alert</span></div>
        <p style={{fontSize:13,color:"var(--t2)",lineHeight:1.6,marginBottom:8}}>{it.trap}</p>
        <div style={{borderTop:"1px solid var(--bdr)",paddingTop:8,marginTop:4}}>
          <span style={{fontSize:12,color:"var(--t3)"}}>FR translation: </span>
          <span className="out" style={{fontSize:12,fontWeight:600,color:"var(--cyan)"}}>{it.realFr}</span>
        </div>
      </div>
      <button className="btn1" onClick={nxt} style={{marginTop:16}}>{ci<items.length-1?"Next":"See Results"}</button></div>}
  </div>);
}

// ─── MOCK TEST ───
function MockTest(p){
  var mockId=p.mockId;
  var data=mockId===1?{p5:MOCK1_P5,p6:MOCK1_P6,p7:MOCK1_P7}:mockId===2?{p5:MOCK2_P5,p6:MOCK2_P6,p7:MOCK2_P7}:{p5:MOCK3_P5,p6:MOCK3_P6,p7:MOCK3_P7};
  var TOTAL_TIME=37*60; // 37 minutes

  // Build flat question map for scoring
  var p5Qs=data.p5;
  var p6Texts=data.p6;
  var p7Passages=data.p7;
  var p6BlankCount=0;p6Texts.forEach(function(t){t.parts.forEach(function(pt){if(pt.blank)p6BlankCount++;});});
  var p7QCount=0;p7Passages.forEach(function(ps){p7QCount+=ps.questions.length;});
  var totalQ=p5Qs.length+p6BlankCount+p7QCount;

  var[phase,setPhase]=useState("intro");
  var[section,setSection]=useState("p5");
  var[qi,setQi]=useState(0); // question index (p5) / text index (p6) / passage index (p7)
  var[bi,setBi]=useState(0); // blank index within p6 text
  var[pqi,setPqi]=useState(0); // question index within p7 passage
  var[ans,setAns]=useState({p5:p5Qs.map(function(){return -1;}),p6:p6Texts.map(function(t){var n=0;t.parts.forEach(function(pt){if(pt.blank)n++;});return Array(n).fill(-1);}),p7:p7Passages.map(function(ps){return ps.questions.map(function(){return -1;});})});
  var[timeLeft,setTimeLeft]=useState(TOTAL_TIME);
  var[result,setResult]=useState(null);
  var[reviewMode,setReviewMode]=useState(false);
  var[reviewSection,setReviewSection]=useState("p5");
  var[reviewIdx,setReviewIdx]=useState(0);
  var timerRef=useRef(null);

  // Timer
  useEffect(function(){
    if(phase!=="test"||result)return;
    if(timeLeft<=0){submitTest();return;}
    timerRef.current=setTimeout(function(){setTimeLeft(timeLeft-1);},1000);
    return function(){clearTimeout(timerRef.current);};
  });

  function formatTime(s){var m=Math.floor(s/60);var sec=s%60;return m+":"+(sec<10?"0":"")+sec;}

  // ── Submit & Scoring ──
  function submitTest(){
    clearTimeout(timerRef.current);
    var p5Score=0;p5Qs.forEach(function(q,i){if(ans.p5[i]===q.c)p5Score++;});
    var p6Score=0;var bIdx=0;
    p6Texts.forEach(function(t,ti){
      var localB=0;
      t.parts.forEach(function(pt){
        if(pt.blank){if(ans.p6[ti][localB]===pt.correct)p6Score++;localB++;}
      });
    });
    var p7Score=0;p7Passages.forEach(function(ps,pi){ps.questions.forEach(function(q,qii){if(ans.p7[pi][qii]===q.correct)p7Score++;});});
    var totalScore=p5Score+p6Score+p7Score;
    var toeic=estimateToeic(totalScore,totalQ);
    var timeUsed=TOTAL_TIME-timeLeft;
    var res={date:today(),score:totalScore,total:totalQ,p5:{score:p5Score,total:p5Qs.length},p6:{score:p6Score,total:p6BlankCount},p7:{score:p7Score,total:p7QCount},toeicEstimate:toeic,timeUsed:timeUsed};
    setResult(res);setPhase("done");
  }

  // ── Navigation ──
  function pickAnswer(val){
    var a=JSON.parse(JSON.stringify(ans));
    if(section==="p5"){a.p5[qi]=val;setAns(a);setTimeout(nextItem,300);}
    else if(section==="p6"){a.p6[qi][bi]=val;setAns(a);setTimeout(nextItem,300);}
    else if(section==="p7"){a.p7[qi][pqi]=val;setAns(a);setTimeout(nextItem,300);}
  }
  function nextItem(){
    if(section==="p5"){
      if(qi<p5Qs.length-1){setQi(qi+1);}
      else{setSection("p6");setQi(0);setBi(0);}
    }else if(section==="p6"){
      var blanksInText=ans.p6[qi].length;
      if(bi<blanksInText-1){setBi(bi+1);}
      else if(qi<p6Texts.length-1){setQi(qi+1);setBi(0);}
      else{setSection("p7");setQi(0);setPqi(0);}
    }else if(section==="p7"){
      if(pqi<p7Passages[qi].questions.length-1){setPqi(pqi+1);}
      else if(qi<p7Passages.length-1){setQi(qi+1);setPqi(0);}
      else{submitTest();}
    }
  }

  // ── Progress calc ──
  var answered=0;
  ans.p5.forEach(function(a){if(a>=0)answered++;});
  ans.p6.forEach(function(t){t.forEach(function(a){if(a>=0)answered++;});});
  ans.p7.forEach(function(ps){ps.forEach(function(a){if(a>=0)answered++;});});
  var progressPct=Math.round(answered/totalQ*100);

  // ════════════════ INTRO ════════════════
  if(phase==="intro"){
    return(<div className="enter" style={{padding:"20px 16px",minHeight:"100vh",display:"flex",flexDirection:"column",justifyContent:"center",textAlign:"center"}}>
      <div style={{fontSize:56,marginBottom:16}}>📜</div>
      <h1 className="out" style={{fontWeight:900,fontSize:26,marginBottom:8}}>Mock Test {mockId}</h1>
      <p style={{color:"var(--t2)",fontSize:14,marginBottom:24,lineHeight:1.6}}>Reading Section — Half Test</p>
      <div className="crd" style={{textAlign:"left",padding:16,marginBottom:20}}>
        <div style={{fontSize:13,color:"var(--t1)",lineHeight:1.8}}>
          <div style={{display:"flex",justifyContent:"space-between",marginBottom:4}}><span>Part 5 — Incomplete Sentences</span><span className="out" style={{color:"var(--cyan)"}}>{p5Qs.length} Q</span></div>
          <div style={{display:"flex",justifyContent:"space-between",marginBottom:4}}><span>Part 6 — Text Completion</span><span className="out" style={{color:"var(--cyan)"}}>{p6BlankCount} Q</span></div>
          <div style={{display:"flex",justifyContent:"space-between",marginBottom:4}}><span>Part 7 — Reading Comprehension</span><span className="out" style={{color:"var(--cyan)"}}>{p7QCount} Q</span></div>
          <div style={{borderTop:"1px solid var(--bdr)",marginTop:8,paddingTop:8,display:"flex",justifyContent:"space-between",fontWeight:700}}><span>Total</span><span className="out" style={{color:"var(--gold)"}}>{totalQ} questions · 37 min</span></div>
        </div>
      </div>
      <div className="crd" style={{padding:14,marginBottom:24,borderColor:"rgba(255,140,66,.2)"}}>
        <p style={{fontSize:12,color:"var(--orange)",lineHeight:1.6}}>⚠️ Exam conditions: no feedback during the test, no going back. Timer stops for no one. Your score will be saved permanently.</p>
      </div>
      <button className="btn1" onClick={function(){setPhase("test");}}>Start Exam</button>
      <button className="btn2" onClick={p.back} style={{marginTop:12,width:"100%"}}>Not ready yet</button>
    </div>);
  }

  // ════════════════ TEST ════════════════
  if(phase==="test"){
    var timerCol=timeLeft>300?"var(--cyan)":timeLeft>60?"var(--orange)":"var(--red)";
    var sectionLabel=section==="p5"?"Part 5":section==="p6"?"Part 6":"Part 7";

    // Header bar (always visible)
    var header=(<div style={{position:"sticky",top:0,background:"var(--bg)",zIndex:10,padding:"12px 0 8px",borderBottom:"1px solid var(--bdr)"}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:8}}>
        <span className="out" style={{fontSize:12,fontWeight:700,color:"var(--purple)",textTransform:"uppercase",letterSpacing:1}}>{sectionLabel}</span>
        <span className="out" style={{fontSize:18,fontWeight:800,color:timerCol,fontVariantNumeric:"tabular-nums"}}>{formatTime(timeLeft)}</span>
      </div>
      <div style={{width:"100%",height:4,background:"var(--bg3)",borderRadius:2,overflow:"hidden"}}>
        <div style={{height:"100%",width:progressPct+"%",background:"linear-gradient(90deg,#d4943a,#8b5e83)",borderRadius:2,transition:"width .3s"}}/>
      </div>
      <div style={{fontSize:10,color:"var(--t3)",marginTop:4,textAlign:"right"}}>{answered}/{totalQ}</div>
    </div>);

    // ── PART 5 RENDER ──
    if(section==="p5"){
      var q=p5Qs[qi];var selected=ans.p5[qi];
      return(<div style={{padding:"0 16px 40px"}}>{header}
        <div style={{marginTop:16}}>
          <span style={{fontSize:11,color:"var(--t3)"}}>{qi+1} / {p5Qs.length}</span>
          <h2 className="out" style={{fontWeight:700,fontSize:18,lineHeight:1.5,marginTop:8,marginBottom:24}}>{q.s}</h2>
          <div style={{display:"flex",flexDirection:"column",gap:10}}>
            {q.o.map(function(opt,i){
              var bg=selected===i?"rgba(212,148,58,.15)":"var(--bg2)";
              var bd=selected===i?"var(--cyan)":"var(--bdr)";
              return(<button key={i} onClick={function(){pickAnswer(i);}} style={{display:"flex",alignItems:"center",gap:12,padding:"14px 16px",background:bg,border:"1px solid "+bd,borderRadius:12,cursor:"pointer",fontSize:15,color:"var(--t1)",textAlign:"left",fontFamily:"'DM Sans',sans-serif",transition:"all .15s"}}>
                <div style={{width:28,height:28,borderRadius:"50%",border:"2px solid "+(selected===i?"var(--cyan)":"var(--t3)"),display:"flex",alignItems:"center",justifyContent:"center",fontSize:12,fontWeight:700,flexShrink:0,background:selected===i?"var(--cyan)":"transparent",color:selected===i?"#fff":"var(--t3)"}}>{String.fromCharCode(65+i)}</div>
                <span>{opt}</span></button>);
            })}
          </div>
        </div>
      </div>);
    }

    // ── PART 6 RENDER ──
    if(section==="p6"){
      var txt=p6Texts[qi];
      var blanks=[];var displayParts=[];
      txt.parts.forEach(function(pt){
        if(pt.text!==undefined)displayParts.push({type:"text",content:pt.text});
        else if(pt.blank){var bx=blanks.length;blanks.push(pt);displayParts.push({type:"blank",index:bx});}
      });
      var currentBlank=blanks[bi];var selected6=ans.p6[qi][bi];

      return(<div style={{padding:"0 16px 40px"}}>{header}
        <div style={{marginTop:16}}>
          <div style={{display:"flex",justifyContent:"space-between",marginBottom:8}}>
            <span style={{fontSize:11,color:"var(--t3)"}}>Text {qi+1}/{p6Texts.length}</span>
            <span style={{fontSize:11,color:"var(--cyan)"}}>Blank {bi+1}/{blanks.length}</span>
          </div>
          <div style={{fontSize:11,color:"var(--t2)",textTransform:"uppercase",letterSpacing:.5,marginBottom:6}}>{txt.type}: {txt.subject}</div>
          <div className="crd" style={{padding:14,marginBottom:16,maxHeight:220,overflowY:"auto",lineHeight:1.7,fontSize:13}}>
            {displayParts.map(function(dp,i){
              if(dp.type==="text")return(<span key={i}>{dp.content}</span>);
              var isCurrent=dp.index===bi;
              var hasAnswer=ans.p6[qi][dp.index]>=0;
              return(<span key={i} className="out" style={{display:"inline",padding:"2px 8px",borderRadius:6,fontWeight:700,background:isCurrent?"rgba(212,148,58,.2)":hasAnswer?"rgba(0,230,118,.12)":"var(--bg3)",color:isCurrent?"var(--cyan)":hasAnswer?"var(--green)":"var(--t3)",border:"1px solid "+(isCurrent?"var(--cyan)":hasAnswer?"var(--green)":"var(--bdr)"),fontSize:12}}>{("["+String.fromCharCode(65+dp.index)+"]")}{hasAnswer&&!isCurrent?" ✓":""}</span>);
            })}
          </div>
          <div style={{display:"flex",flexDirection:"column",gap:10}}>
            {currentBlank.options.map(function(opt,i){
              var bg=selected6===i?"rgba(212,148,58,.15)":"var(--bg2)";
              var bd=selected6===i?"var(--cyan)":"var(--bdr)";
              return(<button key={i} onClick={function(){pickAnswer(i);}} style={{display:"flex",alignItems:"center",gap:12,padding:"14px 16px",background:bg,border:"1px solid "+bd,borderRadius:12,cursor:"pointer",fontSize:14,color:"var(--t1)",textAlign:"left",fontFamily:"'DM Sans',sans-serif",transition:"all .15s"}}>
                <div style={{width:26,height:26,borderRadius:"50%",border:"2px solid "+(selected6===i?"var(--cyan)":"var(--t3)"),display:"flex",alignItems:"center",justifyContent:"center",fontSize:11,fontWeight:700,flexShrink:0,background:selected6===i?"var(--cyan)":"transparent",color:selected6===i?"#fff":"var(--t3)"}}>{String.fromCharCode(65+i)}</div>
                <span>{opt}</span></button>);
            })}
          </div>
        </div>
      </div>);
    }

    // ── PART 7 RENDER ──
    if(section==="p7"){
      var passage=p7Passages[qi];var pq=passage.questions[pqi];var selected7=ans.p7[qi][pqi];

      return(<div style={{padding:"0 16px 40px"}}>{header}
        <div style={{marginTop:16}}>
          <div style={{display:"flex",justifyContent:"space-between",marginBottom:8}}>
            <span style={{fontSize:11,color:"var(--t3)"}}>Passage {qi+1}/{p7Passages.length}</span>
            <span style={{fontSize:11,color:"var(--cyan)"}}>Q {pqi+1}/{passage.questions.length}</span>
          </div>
          <div style={{fontSize:11,color:"var(--t2)",textTransform:"uppercase",letterSpacing:.5,marginBottom:6}}>{passage.type}</div>
          <div className="crd" style={{padding:14,marginBottom:16,maxHeight:200,overflowY:"auto",lineHeight:1.7,fontSize:12,whiteSpace:"pre-wrap"}}>{passage.text}</div>
          <h3 className="out" style={{fontWeight:700,fontSize:15,lineHeight:1.5,marginBottom:16}}>{pq.q}</h3>
          <div style={{display:"flex",flexDirection:"column",gap:10}}>
            {pq.options.map(function(opt,i){
              var bg=selected7===i?"rgba(212,148,58,.15)":"var(--bg2)";
              var bd=selected7===i?"var(--cyan)":"var(--bdr)";
              return(<button key={i} onClick={function(){pickAnswer(i);}} style={{display:"flex",alignItems:"center",gap:12,padding:"14px 16px",background:bg,border:"1px solid "+bd,borderRadius:12,cursor:"pointer",fontSize:14,color:"var(--t1)",textAlign:"left",fontFamily:"'DM Sans',sans-serif",transition:"all .15s"}}>
                <div style={{width:26,height:26,borderRadius:"50%",border:"2px solid "+(selected7===i?"var(--cyan)":"var(--t3)"),display:"flex",alignItems:"center",justifyContent:"center",fontSize:11,fontWeight:700,flexShrink:0,background:selected7===i?"var(--cyan)":"transparent",color:selected7===i?"#fff":"var(--t3)"}}>{String.fromCharCode(65+i)}</div>
                <span>{opt}</span></button>);
            })}
          </div>
        </div>
      </div>);
    }
  }

  // ════════════════ RESULTS ════════════════
  if(phase==="done"&&result&&!reviewMode){
    var pct=Math.round(result.score/result.total*100);
    var grade=pct>=80?"Excellent!":pct>=65?"Good job!":pct>=50?"Keep going!":"More training needed";
    var gradeIcon=pct>=80?"👑":pct>=65?"⚔️":pct>=50?"🛡️":"📖";
    var gradeCol=pct>=80?"var(--gold)":pct>=65?"var(--green)":pct>=50?"var(--orange)":"var(--red)";
    var xp=50+result.score*5+(pct>=80?50:0);

    return(<div className="enter" style={{padding:"20px 16px",minHeight:"100vh",textAlign:"center"}}>
      <div style={{fontSize:56,marginBottom:12,animation:"countUp .6s"}}>{gradeIcon}</div>
      <h1 className="out" style={{fontWeight:900,fontSize:26,marginBottom:4}}>Mock Test {mockId} Complete</h1>
      <p style={{color:gradeCol,fontWeight:700,fontSize:16,marginBottom:20}}>{grade}</p>

      <div className="crd glo" style={{padding:20,marginBottom:16,textAlign:"center"}}>
        <div style={{fontSize:11,color:"var(--t3)",textTransform:"uppercase",letterSpacing:1,marginBottom:4}}>Estimated TOEIC Reading Score</div>
        <div className="out" style={{fontSize:48,fontWeight:900,color:"var(--cyan)",lineHeight:1}}>{result.toeicEstimate}</div>
        <div style={{fontSize:12,color:"var(--t2)",marginTop:4}}>/ 495</div>
      </div>

      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginBottom:16}}>
        <div className="crd" style={{padding:12,textAlign:"center"}}><div className="out" style={{fontSize:22,fontWeight:800,color:pct>=60?"var(--green)":"var(--orange)"}}>{result.score}/{result.total}</div><div style={{fontSize:10,color:"var(--t3)"}}>Correct ({pct}%)</div></div>
        <div className="crd" style={{padding:12,textAlign:"center"}}><div className="out" style={{fontSize:22,fontWeight:800,color:"var(--purple)"}}>{formatTime(result.timeUsed)}</div><div style={{fontSize:10,color:"var(--t3)"}}>Time used</div></div>
      </div>

      <div className="crd" style={{padding:14,marginBottom:16,textAlign:"left"}}>
        <div style={{fontSize:12,fontWeight:700,color:"var(--t2)",marginBottom:8}}>Breakdown by Part</div>
        {[{label:"Part 5",data:result.p5},{label:"Part 6",data:result.p6},{label:"Part 7",data:result.p7}].map(function(s){
          var sPct=s.data.total>0?Math.round(s.data.score/s.data.total*100):0;
          var sCol=sPct>=70?"var(--green)":sPct>=50?"var(--orange)":"var(--red)";
          return(<div key={s.label} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"6px 0",borderBottom:"1px solid var(--bdr)"}}>
            <span style={{fontSize:13,color:"var(--t1)"}}>{s.label}</span>
            <div style={{display:"flex",alignItems:"center",gap:8}}>
              <span style={{fontSize:12,color:"var(--t3)"}}>{s.data.score}/{s.data.total}</span>
              <span className="out" style={{fontWeight:800,fontSize:14,color:sCol}}>{sPct}%</span>
            </div>
          </div>);
        })}
      </div>

      <div className="out" style={{fontSize:20,fontWeight:800,color:"var(--gold)",marginBottom:20}}>+{xp} XP</div>

      <button className="btn1" onClick={function(){setReviewMode(true);setReviewSection("p5");setReviewIdx(0);}}>📖 Review Answers</button>
      <button className="btn2" onClick={function(){result.mockId=mockId;p.done(result,xp);}} style={{marginTop:10,width:"100%"}}>Save & Exit</button>
    </div>);
  }

  // ════════════════ REVIEW MODE ════════════════
  if(reviewMode&&result){
    var rItem=null;var rAnswer=-1;var rCorrect=-1;var rExpl="";var rTotal=0;var rLabel="";

    if(reviewSection==="p5"){
      rTotal=p5Qs.length;var q=p5Qs[reviewIdx];
      rLabel="Part 5 — Q"+(reviewIdx+1);rAnswer=ans.p5[reviewIdx];rCorrect=q.c;rExpl=q.x;
      rItem=(<div>
        <h3 className="out" style={{fontWeight:700,fontSize:16,lineHeight:1.5,marginBottom:16}}>{q.s}</h3>
        <div style={{display:"flex",flexDirection:"column",gap:8}}>
          {q.o.map(function(opt,i){
            var isCorrect=i===q.c;var isPicked=i===rAnswer;
            var bg=isCorrect?"rgba(0,230,118,.12)":isPicked?"rgba(255,71,87,.12)":"var(--bg2)";
            var bd=isCorrect?"var(--green)":isPicked?"var(--red)":"var(--bdr)";
            return(<div key={i} style={{display:"flex",alignItems:"center",gap:10,padding:"10px 14px",background:bg,border:"1px solid "+bd,borderRadius:10,fontSize:14}}>
              <span style={{fontWeight:700,color:isCorrect?"var(--green)":isPicked?"var(--red)":"var(--t3)",fontSize:12}}>{isCorrect?"✓":isPicked?"✗":String.fromCharCode(65+i)}</span>
              <span style={{color:"var(--t1)"}}>{opt}</span></div>);
          })}
        </div>
      </div>);
    } else if(reviewSection==="p6"){
      var tIdx=Math.floor(reviewIdx/4);var bIdx2=reviewIdx%4;
      rTotal=p6BlankCount;
      var t=p6Texts[tIdx];var blanksR=[];t.parts.forEach(function(pt){if(pt.blank)blanksR.push(pt);});
      var bl=blanksR[bIdx2];if(!bl){setReviewSection("p7");setReviewIdx(0);return null;}
      rLabel="Part 6 — Text "+(tIdx+1)+", Blank "+(bIdx2+1);rAnswer=ans.p6[tIdx][bIdx2];rCorrect=bl.correct;rExpl=bl.x;
      rItem=(<div>
        <div style={{fontSize:12,color:"var(--t2)",marginBottom:12}}>{t.type}: {t.subject}</div>
        <div style={{display:"flex",flexDirection:"column",gap:8}}>
          {bl.options.map(function(opt,i){
            var isCorrect=i===bl.correct;var isPicked=i===rAnswer;
            var bg=isCorrect?"rgba(0,230,118,.12)":isPicked?"rgba(255,71,87,.12)":"var(--bg2)";
            var bd=isCorrect?"var(--green)":isPicked?"var(--red)":"var(--bdr)";
            return(<div key={i} style={{display:"flex",alignItems:"center",gap:10,padding:"10px 14px",background:bg,border:"1px solid "+bd,borderRadius:10,fontSize:14}}>
              <span style={{fontWeight:700,color:isCorrect?"var(--green)":isPicked?"var(--red)":"var(--t3)",fontSize:12}}>{isCorrect?"✓":isPicked?"✗":String.fromCharCode(65+i)}</span>
              <span style={{color:"var(--t1)"}}>{typeof opt==="string"&&opt.length>60?opt.substring(0,57)+"…":opt}</span></div>);
          })}
        </div>
      </div>);
    } else if(reviewSection==="p7"){
      // Map flat index to passage + question
      var flatIdx=reviewIdx;var pi=0;var pqIdx=0;
      for(var pp=0;pp<p7Passages.length;pp++){
        if(flatIdx<p7Passages[pp].questions.length){pi=pp;pqIdx=flatIdx;break;}
        flatIdx-=p7Passages[pp].questions.length;
      }
      rTotal=p7QCount;
      var ps=p7Passages[pi];var pqr=ps.questions[pqIdx];
      rLabel="Part 7 — Passage "+(pi+1)+", Q"+(pqIdx+1);rAnswer=ans.p7[pi][pqIdx];rCorrect=pqr.correct;rExpl=pqr.x;
      rItem=(<div>
        <div style={{fontSize:11,color:"var(--t2)",marginBottom:8}}>{ps.type}</div>
        <h3 className="out" style={{fontWeight:700,fontSize:15,lineHeight:1.5,marginBottom:16}}>{pqr.q}</h3>
        <div style={{display:"flex",flexDirection:"column",gap:8}}>
          {pqr.options.map(function(opt,i){
            var isCorrect=i===pqr.correct;var isPicked=i===rAnswer;
            var bg=isCorrect?"rgba(0,230,118,.12)":isPicked?"rgba(255,71,87,.12)":"var(--bg2)";
            var bd=isCorrect?"var(--green)":isPicked?"var(--red)":"var(--bdr)";
            return(<div key={i} style={{display:"flex",alignItems:"center",gap:10,padding:"10px 14px",background:bg,border:"1px solid "+bd,borderRadius:10,fontSize:14}}>
              <span style={{fontWeight:700,color:isCorrect?"var(--green)":isPicked?"var(--red)":"var(--t3)",fontSize:12}}>{isCorrect?"✓":isPicked?"✗":String.fromCharCode(65+i)}</span>
              <span style={{color:"var(--t1)"}}>{opt}</span></div>);
          })}
        </div>
      </div>);
    }

    var allTotals={p5:p5Qs.length,p6:p6BlankCount,p7:p7QCount};
    function reviewNext(){
      var curTotal=reviewSection==="p5"?allTotals.p5:reviewSection==="p6"?allTotals.p6:allTotals.p7;
      if(reviewIdx<curTotal-1){setReviewIdx(reviewIdx+1);}
      else if(reviewSection==="p5"){setReviewSection("p6");setReviewIdx(0);}
      else if(reviewSection==="p6"){setReviewSection("p7");setReviewIdx(0);}
      else{setReviewMode(false);}
    }
    function reviewPrev(){
      if(reviewIdx>0){setReviewIdx(reviewIdx-1);}
      else if(reviewSection==="p7"&&p6BlankCount>0){setReviewSection("p6");setReviewIdx(p6BlankCount-1);}
      else if(reviewSection==="p6"){setReviewSection("p5");setReviewIdx(p5Qs.length-1);}
    }
    var isFirst=reviewSection==="p5"&&reviewIdx===0;
    var isLast=reviewSection==="p7"&&reviewIdx>=p7QCount-1;

    return(<div style={{padding:"20px 16px 40px"}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16}}>
        <button onClick={function(){setReviewMode(false);}} style={{background:"none",border:"none",color:"var(--t2)",cursor:"pointer",fontSize:14}}>← Results</button>
        <span className="out" style={{fontWeight:700,fontSize:13,color:"var(--purple)"}}>{rLabel}</span>
        <div style={{width:40}}/>
      </div>
      {rItem}
      {rExpl&&<div className="crd" style={{marginTop:16,padding:14,background:rAnswer===rCorrect?"rgba(0,230,118,.06)":"rgba(255,71,87,.06)",borderColor:rAnswer===rCorrect?"rgba(0,230,118,.15)":"rgba(255,71,87,.15)"}}>
        <p style={{fontSize:13,color:"var(--t2)",lineHeight:1.6}}>{rExpl}</p>
      </div>}
      <div style={{display:"flex",gap:10,marginTop:20}}>
        {!isFirst&&<button className="btn2" onClick={reviewPrev} style={{flex:1}}>← Prev</button>}
        <button className="btn1" onClick={reviewNext} style={{flex:1}}>{isLast?"Back to Results":"Next →"}</button>
      </div>
    </div>);
  }

  return null;
}

// ─── GAMES HUB ───
function GamesHub(p){
  var bestM=p.u.gameScores&&p.u.gameScores.matchEasy?p.u.gameScores.matchEasy:null;
  var bestMH=p.u.gameScores&&p.u.gameScores.matchHard?p.u.gameScores.matchHard:null;
  var bestF=p.u.gameScores&&p.u.gameScores.wordFall?p.u.gameScores.wordFall:null;
  return(<div className="enter" style={{padding:"20px 16px 100px"}}>
    <h1 className="out" style={{fontWeight:800,fontSize:24,marginBottom:4}}>Arena Games</h1>
    <p style={{color:"var(--t2)",fontSize:13,marginBottom:20}}>Train your reflexes, earn XP</p>
    <div style={{display:"flex",flexDirection:"column",gap:12}}>
      <div className="crd" onClick={function(){p.nav("smatch");}} style={{cursor:"pointer",display:"flex",alignItems:"center",gap:14,padding:"16px"}}>
        <div style={{width:48,height:48,borderRadius:14,background:"linear-gradient(135deg,#d4943a,#8b5e83)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:24,flexShrink:0}}>🎯</div>
        <div style={{flex:1}}><div className="out" style={{fontWeight:700,fontSize:15}}>Speed Match</div>
          <div style={{fontSize:11,color:"var(--t3)"}}>Match words with definitions!</div>
          {(bestM||bestMH)&&<div style={{fontSize:10,color:"var(--gold)",marginTop:2}}>{bestM?"Easy: "+bestM.time+"s":""}{bestM&&bestMH?" · ":""}{bestMH?"Hard: "+bestMH.time+"s":""}</div>}</div>
        <span style={{fontSize:16,color:"var(--cyan)"}}>→</span></div>
      <div className="crd" onClick={function(){p.nav("wfall");}} style={{cursor:"pointer",display:"flex",alignItems:"center",gap:14,padding:"16px"}}>
        <div style={{width:48,height:48,borderRadius:14,background:"linear-gradient(135deg,#ef4444,#f59e0b)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:24,flexShrink:0}}>⬇️</div>
        <div style={{flex:1}}><div className="out" style={{fontWeight:700,fontSize:15}}>Word Fall</div>
          <div style={{fontSize:11,color:"var(--t3)"}}>Catch the falling sentences!</div>
          {bestF&&<div style={{fontSize:10,color:"var(--gold)",marginTop:2}}>Best: {bestF.score} pts · x{bestF.maxCombo} combo</div>}</div>
        <span style={{fontSize:16,color:"var(--cyan)"}}>→</span></div>
      <div className="crd" onClick={function(){p.nav("sbuild");}} style={{cursor:"pointer",display:"flex",alignItems:"center",gap:14,padding:"16px"}}>
        <div style={{width:48,height:48,borderRadius:14,background:"linear-gradient(135deg,#5a7a9a,#7a5a80)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:24,flexShrink:0}}>🔀</div>
        <div style={{flex:1}}><div className="out" style={{fontWeight:700,fontSize:15}}>Sentence Builder</div>
          <div style={{fontSize:11,color:"var(--t3)"}}>Tap blocks in the right order!</div></div>
        <span style={{fontSize:16,color:"var(--cyan)"}}>→</span></div>
      <div className="crd" onClick={function(){p.nav("ablitz");}} style={{cursor:"pointer",display:"flex",alignItems:"center",gap:14,padding:"16px"}}>
        <div style={{width:48,height:48,borderRadius:14,background:"linear-gradient(135deg,#f59e0b,#ef4444)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:24,flexShrink:0}}>🎵</div>
        <div style={{flex:1}}><div className="out" style={{fontWeight:700,fontSize:15}}>Audio Blitz</div>
          <div style={{fontSize:11,color:"var(--t3)"}}>Listen once, answer fast!</div></div>
        <span style={{fontSize:16,color:"var(--cyan)"}}>{"→"}</span></div>
      <div className="crd" onClick={function(){p.nav("clue");}} style={{cursor:"pointer",display:"flex",alignItems:"center",gap:14,padding:"16px"}}>
        <div style={{width:48,height:48,borderRadius:14,background:"linear-gradient(135deg,#d4943a,#4abe60)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:24,flexShrink:0}}>{"🧭"}</div>
        <div style={{flex:1}}>
          <div className="out" style={{fontWeight:700,fontSize:15}}>Clue Hunter</div>
          <div style={{fontSize:11,color:"var(--t3)"}}>Find the clue, fill the blank!</div>
        </div>
        <span style={{fontSize:16,color:"var(--cyan)"}}>{"→"}</span></div>
      <div className="crd" onClick={function(){p.nav("duel");}} style={{cursor:"pointer",display:"flex",alignItems:"center",gap:14,padding:"16px"}}>
        <div style={{width:48,height:48,borderRadius:14,background:"linear-gradient(135deg,#c84040,#8b5e83)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:24,flexShrink:0}}>⚔️</div>
        <div style={{flex:1}}><div className="out" style={{fontWeight:700,fontSize:15}}>Vocabulary Duel</div>
          <div style={{fontSize:11,color:"var(--t3)"}}>Real-time 1v1 — challenge a classmate!</div>
          <div style={{fontSize:10,color:"var(--gold)",marginTop:2}}>NEW</div></div>
        <span style={{fontSize:16,color:"var(--cyan)"}}>→</span></div>
    </div>
  </div>);
}




// ─── DAILY TIP POPUP ───
function DailyTip(p){
  var[tipIdx,setTipIdx]=useState(0);
  var u=p.u;

  // Flatten all tips with their part/section metadata
  var allTips=useMemo(function(){
    var flat=[];
    STRATEGIES.forEach(function(s){
      s.tips.forEach(function(tip){
        flat.push({t:tip.t,d:tip.d,part:s.part,section:s.section,icon:s.icon});
      });
    });
    return flat;
  },[]);

  // Map parts to moduleScore keys for weakness detection
  var partToModules={
    "Part 1":["lisP1"],"Part 2":["lisP2"],"Part 3":["lisP3"],"Part 4":["lisP4"],
    "Part 5":["drill","daily","timesim"],"Part 6":["part6"],"Part 7":["part7"],
    "General":[]
  };

  // Compute tips sorted by relevance (weakest area first)
  var sortedTips=useMemo(function(){
    // Score each part by accuracy (lower = weaker = show first)
    var partScores={};
    Object.keys(partToModules).forEach(function(part){
      var mods=partToModules[part];
      var total=0;var correct=0;
      mods.forEach(function(modId){
        var ms=u.moduleScores?u.moduleScores[modId]:null;
        if(ms&&ms.total>0){total+=ms.total;correct+=ms.correct;}
      });
      partScores[part]=total>0?correct/total:0.5; // default 50% if no data
    });

    // Sort tips: weakest part first, then never-practiced, then strong
    var scored=allTips.map(function(tip,i){
      var acc=partScores[tip.part];
      if(acc===undefined)acc=0.5;
      return{tip:tip,origIdx:i,acc:acc};
    });
    scored.sort(function(a,b){return a.acc-b.acc;});
    return scored.map(function(s){return s.tip;});
  },[]);

  // Which tip to show today (sequential through sorted list, stored in localStorage)
  var startIdx=useMemo(function(){
    try{
      var stored=localStorage.getItem("toeic-tip-idx");
      return stored?parseInt(stored)||0:0;
    }catch(e){return 0;}
  },[]);

  var currentTip=sortedTips[(startIdx+tipIdx)%sortedTips.length];

  function dismiss(){
    // Save next index for tomorrow
    try{
      localStorage.setItem("toeic-tip-idx",String((startIdx+tipIdx+1)%sortedTips.length));
      localStorage.setItem("toeic-tip-date",today());
    }catch(e){}
    p.close();
  }

  function nextTip(){
    setTipIdx(tipIdx+1);
  }

  function disableStartup(){
    try{localStorage.setItem("toeic-tip-disabled","1");}catch(e){}
    dismiss();
  }

  var sectionCol=currentTip.section==="Listening"?"var(--cyan)":currentTip.section==="Reading"?"var(--purple)":"var(--gold)";

  return(<div style={{position:"fixed",top:0,left:0,right:0,bottom:0,background:"rgba(0,0,0,.7)",backdropFilter:"blur(6px)",WebkitBackdropFilter:"blur(6px)",
    display:"flex",alignItems:"center",justifyContent:"center",zIndex:9999,padding:20,animation:"fadeIn .3s"}}>
    <div style={{width:"100%",maxWidth:420,background:"var(--bg2)",borderRadius:20,border:"1px solid var(--bdr)",overflow:"hidden",boxShadow:"0 20px 60px rgba(0,0,0,.5)"}}>

      {/* Header */}
      <div style={{padding:"20px 20px 12px",background:"linear-gradient(135deg,rgba(212,148,58,.08),rgba(139,94,131,.08))"}}>
        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:12}}>
          <div style={{display:"flex",alignItems:"center",gap:8}}>
            <span style={{fontSize:22}}>{"💡"}</span>
            <span className="out" style={{fontWeight:800,fontSize:16}}>Daily TOEIC Tip</span>
          </div>
          <span style={{fontSize:11,color:sectionCol,fontWeight:700,padding:"4px 10px",background:sectionCol+"15",borderRadius:20}}>{currentTip.icon} {currentTip.part}</span>
        </div>
        <div style={{height:1,background:"var(--bdr)"}}/>
      </div>

      {/* Tip content */}
      <div style={{padding:"16px 20px 20px"}}>
        <h3 className="out" style={{fontWeight:800,fontSize:18,color:"var(--t1)",marginBottom:10,lineHeight:1.4}}>{currentTip.t}</h3>
        <p style={{fontSize:14,color:"var(--t2)",lineHeight:1.7}}>{currentTip.d}</p>

        {/* Section badge */}
        <div style={{marginTop:16,display:"flex",alignItems:"center",gap:6}}>
          <div style={{width:8,height:8,borderRadius:4,background:sectionCol}}/>
          <span style={{fontSize:11,color:"var(--t3)"}}>{currentTip.section} Section</span>
        </div>
      </div>

      {/* Actions */}
      <div style={{padding:"0 20px 20px",display:"flex",flexDirection:"column",gap:8}}>
        <button className="btn1" onClick={dismiss} style={{width:"100%",fontSize:15}}>Got it!</button>
        <div style={{display:"flex",gap:8}}>
          <button className="btn2" onClick={nextTip} style={{flex:1,fontSize:12}}>{"→"} Next tip</button>
          <button onClick={disableStartup} style={{flex:1,padding:"10px 12px",background:"none",border:"1px solid var(--bdr)",borderRadius:12,
            cursor:"pointer",fontSize:11,color:"var(--t3)",fontFamily:"'DM Sans',sans-serif"}}>Don't show at startup</button>
        </div>
      </div>
    </div>
  </div>);
}

// ─── SENTENCE BUILDER — Tap to reorder ───
function SentenceBuilder(p){
  var TOTAL=15;var TIMER_SEC=20;

  var[ci,sC]=useState(0);var[sc,sSc]=useState(0);var[ph,sP]=useState("intro");
  var[placed,setPlaced]=useState([]);var[remaining,setRemaining]=useState([]);
  var[timer,setTimer]=useState(TIMER_SEC);var[sk,sSk]=useState(false);
  var timerRef=useRef(null);

  var items=useMemo(function(){return shuffle(SENTENCES.slice()).slice(0,TOTAL);},[]);

  // Init round
  useEffect(function(){
    if(ph==="q"){
      var it=items[ci];
      setPlaced([]);
      setRemaining(shuffle(it.chunks.map(function(c,i){return{text:c,idx:i};})));
      setTimer(TIMER_SEC);
      timerRef.current=setInterval(function(){
        setTimer(function(t){
          if(t<=1){clearInterval(timerRef.current);sP("fb");return 0;}
          return t-1;
        });
      },1000);
    }
    return function(){clearInterval(timerRef.current);};
  },[ci,ph==="q"]);

  function tapChunk(chunk){
    if(ph!=="q")return;
    setPlaced(function(prev){return prev.concat([chunk]);});
    setRemaining(function(prev){return prev.filter(function(c){return c.idx!==chunk.idx;});});
  }

  function undoLast(){
    if(placed.length===0)return;
    var last=placed[placed.length-1];
    setPlaced(function(prev){return prev.slice(0,-1);});
    setRemaining(function(prev){return prev.concat([last]);});
  }

  // Auto-check when all chunks placed
  useEffect(function(){
    if(ph!=="q")return;
    if(placed.length===items[ci].chunks.length){
      clearInterval(timerRef.current);
      var correct=true;
      for(var i=0;i<placed.length;i++){
        if(placed[i].idx!==i){correct=false;break;}
      }
      if(correct){sSc(sc+1);try{playCorrect();}catch(e){}}
      else{try{playWrong();}catch(e){}sSk(true);setTimeout(function(){sSk(false);},400);}
      sP("fb");
    }
  },[placed.length]);

  function next(){
    if(ci<items.length-1){sC(ci+1);sP("q");}
    else{sP("done");p.done(sc,TOTAL,20+sc*5);}
  }

  // ═══ INTRO ═══
  if(ph==="intro")return(<div className="enter" style={{padding:"20px 16px",minHeight:"100vh",display:"flex",flexDirection:"column",justifyContent:"center",textAlign:"center"}}>
    <div style={{fontSize:56,marginBottom:16}}>{"🔀"}</div>
    <h1 className="out" style={{fontWeight:900,fontSize:26,marginBottom:8}}>Sentence Builder</h1>
    <p style={{color:"var(--t2)",fontSize:13,marginBottom:8,lineHeight:1.6}}>The sentence is scrambled — tap the blocks in the right order!</p>
    <p style={{color:"var(--gold)",fontWeight:600,fontSize:14,marginBottom:32}}>{TOTAL} sentences · {TIMER_SEC}s each</p>
    <button className="btn1" onClick={function(){sP("q");}}>Start</button>
    <button className="btn2" onClick={p.back} style={{marginTop:12,width:"100%"}}>Back</button>
  </div>);

  // ═══ DONE ═══
  if(ph==="done"){var xp=20+sc*5;return(<div className="enter" style={{padding:"20px 16px",minHeight:"100vh",display:"flex",flexDirection:"column",justifyContent:"center",textAlign:"center"}}>
    <div style={{fontSize:48,marginBottom:16,animation:"countUp .6s"}}>{sc>=12?"🏆":sc>=8?"⚔️":"🛡️"}</div>
    <h1 className="out" style={{fontWeight:900,fontSize:28,marginBottom:8}}>Builder Complete</h1>
    <div className="out" style={{fontSize:44,fontWeight:900,color:sc>=12?"var(--green)":sc>=8?"var(--cyan)":"var(--orange)",marginBottom:4}}>{sc}/{TOTAL}</div>
    <div className="out" style={{fontSize:20,fontWeight:800,color:"var(--gold)",marginBottom:32}}>+{xp} XP</div>
    <button className="btn1" onClick={p.back}>Back</button>
  </div>);}

  // ═══ PLAY + FEEDBACK ═══
  var it=items[ci];
  var isCorrect=ph==="fb"&&placed.length===it.chunks.length&&placed.every(function(c,i){return c.idx===i;});
  var timerCol=timer<=5?"var(--red)":timer<=10?"var(--orange)":"var(--cyan)";
  var timerPct=timer/TIMER_SEC*100;

  return(<div className={sk?"sk":""} style={{padding:"20px 16px",minHeight:"100vh"}}>
    <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12}}>
      {ph==="q"&&<span className="out" style={{fontSize:20,fontWeight:800,color:timerCol}}>{timer}s</span>}
	  <div/>
      <span className="out" style={{fontSize:13,color:"var(--t2)",fontWeight:600}}>{ci+1}/{TOTAL}</span>
    </div>
    <Bar value={ci} max={TOTAL} h={4} color="linear-gradient(90deg,#3b82f6,#8b5cf6)"/>

    {ph==="q"&&<div style={{height:4,background:"var(--bg3)",borderRadius:2,marginTop:8,marginBottom:20,overflow:"hidden"}}>
      <div style={{height:"100%",width:timerPct+"%",background:timerCol,borderRadius:2,transition:"width 1s linear"}}/></div>}

    <div style={{marginTop:ph==="fb"?16:0}}>
      <span className="out" style={{fontSize:11,color:"var(--purple)",fontWeight:700,textTransform:"uppercase",letterSpacing:1,display:"block",marginBottom:12}}>{"🔀"} Build the sentence</span>
      <span style={{fontSize:11,color:"var(--t3)",display:"block",marginBottom:16}}>{it.cat}</span>
    </div>

    {/* Placed chunks (answer zone) */}
    <div style={{minHeight:80,padding:12,background:"var(--bg2)",borderRadius:14,border:"2px dashed "+(ph==="fb"?(isCorrect?"var(--green)":"var(--red)"):"var(--bdr)"),marginBottom:16,display:"flex",flexWrap:"wrap",gap:6,alignContent:"flex-start"}}>
      {placed.length===0&&<span style={{color:"var(--t3)",fontSize:13,fontStyle:"italic"}}>Tap the blocks below in order...</span>}
      {placed.map(function(chunk,i){
        var showResult=ph==="fb";
        var posCorrect=chunk.idx===i;
        return(<span key={i} style={{padding:"8px 14px",borderRadius:10,fontSize:14,fontWeight:600,
          background:showResult?(posCorrect?"rgba(0,230,118,.15)":"rgba(255,71,87,.15)"):"rgba(212,148,58,.1)",
          color:showResult?(posCorrect?"var(--green)":"var(--red)"):"var(--cyan)",
          border:"1px solid "+(showResult?(posCorrect?"var(--green)":"var(--red)"):"rgba(212,148,58,.2)"),
          transition:"all .2s"}}>{chunk.text}</span>);
      })}
    </div>

    {/* Undo button */}
    {ph==="q"&&placed.length>0&&<div style={{textAlign:"right",marginBottom:12}}>
      <button onClick={undoLast} style={{background:"none",border:"1px solid var(--bdr)",borderRadius:8,padding:"6px 14px",
        color:"var(--t2)",fontSize:12,cursor:"pointer",fontFamily:"'DM Sans',sans-serif"}}>{"↩"} Undo</button>
    </div>}

    {/* Remaining chunks (pick zone) */}
    {ph==="q"&&<div style={{display:"flex",flexWrap:"wrap",gap:8,justifyContent:"center"}}>
      {remaining.map(function(chunk){
        return(<button key={chunk.idx} onClick={function(){tapChunk(chunk);}}
          style={{padding:"10px 16px",background:"var(--bg3)",border:"1px solid var(--bdr)",borderRadius:10,
            cursor:"pointer",fontSize:14,fontWeight:600,color:"var(--t1)",fontFamily:"'DM Sans',sans-serif",
            transition:"all .15s"}}>
          {chunk.text}
        </button>);
      })}
    </div>}

    {/* Feedback */}
    {ph==="fb"&&<div style={{marginTop:16,animation:"fadeIn .3s"}}>
      {timer===0&&placed.length<it.chunks.length&&<div style={{textAlign:"center",marginBottom:12}}>
        <span className="out" style={{fontSize:16,fontWeight:700,color:"var(--red)"}}>{"⏰"} Time's up!</span></div>}
      <div className="crd" style={{padding:14,background:isCorrect?"rgba(0,230,118,.06)":"rgba(255,71,87,.06)",borderColor:isCorrect?"rgba(0,230,118,.15)":"rgba(255,71,87,.15)"}}>
        <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:8}}>
          <span style={{fontSize:16}}>{isCorrect?"✅":"❌"}</span>
          <span className="out" style={{fontWeight:700,fontSize:14,color:isCorrect?"var(--green)":"var(--red)"}}>{isCorrect?"Perfect!":"Correct order:"}</span>
        </div>
        <p style={{fontSize:14,color:"var(--t1)",lineHeight:1.6,fontWeight:500}}>{it.s}</p>
      </div>
      <button className="btn1" onClick={next} style={{marginTop:12}}>{ci<items.length-1?"Next":"See Results"}</button>
    </div>}
	<button className="btn2" onClick={function(){clearInterval(timerRef.current);p.back();}} style={{marginTop:12,width:"100%"}}>Back</button>
  </div>);
}

// ─── AUDIO BLITZ — Listen & answer ───
function AudioBlitz(p){
  var TOTAL=12;var TIMER_SEC=15;

  var[ci,sC]=useState(0);var[sc,sSc]=useState(0);var[ph,sP]=useState("intro");
  var[pick,sPk]=useState(-1);var[sk,sSk]=useState(false);
  var[timer,setTimer]=useState(TIMER_SEC);var[played,setPlayed]=useState(0); // 0=not yet, 1=playing, 2=ready
  var[replays,setReplays]=useState(0);
  var timerRef=useRef(null);var answeredRef=useRef(false);var bufferRef=useRef(null);

  var items=useMemo(function(){return shuffle(AUDIO_BLITZ.slice()).slice(0,TOTAL);},[]);

  // Auto-play audio when entering question phase
  useEffect(function(){
    if(ph!=="q")return;
    // Reset state for new question
    clearInterval(timerRef.current);clearTimeout(bufferRef.current);
    answeredRef.current=false;
    setPlayed(0);setReplays(0);sPk(-1);setTimer(TIMER_SEC);

    // Small delay before playing to let the screen render
    var playTimeout=setTimeout(function(){
      setPlayed(1);
      var it=items[ci];
      var audio=new Audio(it.audio);
      var usedTTS=false;

      function afterAudio(){
        // 2-second buffer after audio ends before showing options + starting timer
        bufferRef.current=setTimeout(function(){
          setPlayed(2);
          timerRef.current=setInterval(function(){
            setTimer(function(t){
              if(t<=1){
                clearInterval(timerRef.current);
                if(!answeredRef.current){answeredRef.current=true;sPk(-1);sP("fb");}
                return 0;
              }
              return t-1;
            });
          },1000);
        },1500);
      }

      audio.onerror=function(){
        if(!usedTTS){usedTTS=true;speak(it.text,0.85);setTimeout(afterAudio,3000);}
      };
      audio.onended=function(){afterAudio();};
      audio.playbackRate=0.9;
      audio.play().catch(function(){
        if(!usedTTS){usedTTS=true;speak(it.text,0.85);setTimeout(afterAudio,3000);}
      });
    },500);

    return function(){clearInterval(timerRef.current);clearTimeout(bufferRef.current);clearTimeout(playTimeout);};
  },[ci,ph]);

  function replay(){
    if(replays>=1||played<2)return;
    setReplays(1);
    var it=items[ci];
    var audio=new Audio(it.audio);
    audio.onerror=function(){speak(it.text,0.85);};
    audio.playbackRate=0.9;
    audio.play().catch(function(){speak(it.text,0.85);});
  }

  function doAnswer(i){
    if(answeredRef.current||played<2)return;
    answeredRef.current=true;
    clearInterval(timerRef.current);
    sPk(i);
    if(i===items[ci].c){sSc(sc+1);try{playCorrect();}catch(e){}}
    else{try{playWrong();}catch(e){}sSk(true);setTimeout(function(){sSk(false);},400);}
    sP("fb");
  }

  function next(){
    if(ci<items.length-1){sC(ci+1);sP("q");}
    else{sP("done");p.done(sc,TOTAL,25+sc*6);}
  }

  // ═══ INTRO ═══
  if(ph==="intro")return(<div className="enter" style={{padding:"20px 16px",minHeight:"100vh",display:"flex",flexDirection:"column",justifyContent:"center",textAlign:"center"}}>
    <div style={{fontSize:56,marginBottom:16}}>{"🎵"}</div>
    <h1 className="out" style={{fontWeight:900,fontSize:26,marginBottom:8}}>Audio Blitz</h1>
    <p style={{color:"var(--t2)",fontSize:13,marginBottom:8,lineHeight:1.6}}>Listen to a short audio clip, then answer the question.<br/>The audio plays automatically — focus!</p>
    <div style={{display:"flex",justifyContent:"center",gap:16,marginBottom:32}}>
      <div style={{textAlign:"center"}}><div style={{fontSize:24}}>{"🔊"}</div><div style={{fontSize:11,color:"var(--t3)"}}>Auto-play</div></div>
      <div style={{textAlign:"center"}}><div style={{fontSize:24}}>{"🔁"}</div><div style={{fontSize:11,color:"var(--t3)"}}>1 replay</div></div>
      <div style={{textAlign:"center"}}><div style={{fontSize:24}}>{"⚡"}</div><div style={{fontSize:11,color:"var(--t3)"}}>{TIMER_SEC}s to answer</div></div>
    </div>
    <button className="btn1" onClick={function(){sP("q");}}>Start</button>
    <button className="btn2" onClick={p.back} style={{marginTop:12,width:"100%"}}>Back</button>
  </div>);

  // ═══ DONE ═══
  if(ph==="done"){var xp=25+sc*6;return(<div className="enter" style={{padding:"20px 16px",minHeight:"100vh",display:"flex",flexDirection:"column",justifyContent:"center",textAlign:"center"}}>
    <div style={{fontSize:48,marginBottom:16,animation:"countUp .6s"}}>{sc>=10?"🏆":sc>=7?"⚔️":"🛡️"}</div>
    <h1 className="out" style={{fontWeight:900,fontSize:28,marginBottom:8}}>Blitz Complete</h1>
    <div className="out" style={{fontSize:44,fontWeight:900,color:sc>=10?"var(--green)":sc>=7?"var(--cyan)":"var(--orange)",marginBottom:4}}>{sc}/{TOTAL}</div>
    <div className="out" style={{fontSize:20,fontWeight:800,color:"var(--gold)",marginBottom:32}}>+{xp} XP</div>
    <button className="btn1" onClick={p.back}>Back</button>
  </div>);}

  // ═══ PLAY ═══
  var it=items[ci];
  var timerPct=played>=2?timer/TIMER_SEC*100:100;
  var timerCol=timer<=3?"var(--red)":timer<=6?"var(--orange)":"var(--cyan)";

  return(<div className={sk?"sk":""} style={{padding:"20px 16px",minHeight:"100vh"}}>
    <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12}}>
      <div/>
      {played>=2&&ph==="q"&&<span className="out" style={{fontSize:20,fontWeight:800,color:timerCol}}>{timer}s</span>}
      <span className="out" style={{fontSize:13,color:"var(--t2)",fontWeight:600}}>{ci+1}/{TOTAL}</span>
    </div>
    <Bar value={ci} max={TOTAL} h={4} color="linear-gradient(90deg,#f59e0b,#ef4444)"/>

    {played>=2&&ph==="q"&&<div style={{height:4,background:"var(--bg3)",borderRadius:2,marginTop:8,marginBottom:16,overflow:"hidden"}}>
      <div style={{height:"100%",width:timerPct+"%",background:timerCol,borderRadius:2,transition:"width 1s linear"}}/></div>}

    {/* Audio status */}
    <div style={{textAlign:"center",marginTop:16,marginBottom:20}}>
      {played<=1&&<div style={{animation:"pulse 1.5s infinite"}}>
        <div style={{fontSize:48,marginBottom:8}}>{"🔊"}</div>
        <p className="out" style={{fontWeight:700,fontSize:16,color:"var(--cyan)"}}>Listening...</p>
      </div>}
      {played>=2&&ph==="q"&&<div>
        <p className="out" style={{fontWeight:700,fontSize:14,color:"var(--t1)",marginBottom:12}}>{it.q}</p>
        {replays===0&&<button onClick={replay} style={{background:"rgba(139,94,131,.1)",border:"1px solid rgba(139,94,131,.2)",
          borderRadius:10,padding:"8px 20px",cursor:"pointer",fontSize:12,color:"var(--purple)",fontWeight:600,fontFamily:"'DM Sans',sans-serif"}}>
          {"🔁"} Replay once</button>}
        {replays>=1&&<span style={{fontSize:11,color:"var(--t3)"}}>No more replays</span>}
      </div>}
    </div>

    {/* Options (only show after audio) */}
    {played>=2&&<div style={{display:"flex",flexDirection:"column",gap:8}}>
      {it.opts.map(function(opt,i){
        var show=ph==="fb";var isCor=i===it.c;var isPick=i===pick;
        var bg="var(--bg2)";var bd="var(--bdr)";
        if(show&&isCor){bg="rgba(0,230,118,.12)";bd="var(--green)";}
        else if(show&&isPick&&!isCor){bg="rgba(255,71,87,.12)";bd="var(--red)";}
        else if(ph==="q"&&isPick){bg="rgba(212,148,58,.1)";bd="var(--cyan)";}
        return(<button key={i} onClick={function(){doAnswer(i);}} disabled={show}
          style={{padding:"14px 16px",background:bg,border:"1px solid "+bd,borderRadius:12,
            cursor:ph==="q"?"pointer":"default",fontSize:14,color:"var(--t1)",textAlign:"left",
            fontFamily:"'DM Sans',sans-serif",transition:"all .2s",lineHeight:1.5}}>
          <span style={{fontSize:12,color:"var(--t3)",marginRight:8,fontWeight:700}}>{String.fromCharCode(65+i)}</span>
          {opt}
        </button>);
      })}
    </div>}

    {/* Feedback */}
    {ph==="fb"&&<div style={{marginTop:16,animation:"fadeIn .3s"}}>
      {pick===-1&&<div style={{textAlign:"center",marginBottom:12}}>
        <span className="out" style={{fontSize:16,fontWeight:700,color:"var(--red)"}}>{"⏰"} Time's up!</span></div>}
      <div className="crd" style={{padding:14,background:"rgba(212,148,58,.06)",borderColor:"rgba(212,148,58,.15)"}}>
        <p className="out" style={{fontWeight:700,fontSize:13,color:"var(--cyan)",marginBottom:6}}>Transcript:</p>
        <p style={{fontSize:13,color:"var(--t1)",lineHeight:1.6,fontStyle:"italic"}}>"{it.text}"</p>
      </div>
      <button className="btn1" onClick={next} style={{marginTop:12}}>{ci<items.length-1?"Next":"See Results"}</button>
    </div>}
	<button className="btn2" onClick={function(){clearInterval(timerRef.current);p.back();}} style={{marginTop:12,width:"100%"}}>Back</button>
  </div>);
}

// ─── DUEL ARENA — Real-time vocabulary duel ───
function DuelArena(p){
  var ROUNDS=10;var TIMER_SEC=12;

  var[phase,setPhase]=useState("hub"); // hub|create|join|lobby|countdown|play|feedback|done
  var[roomCode,setRoomCode]=useState("");
  var[inputCode,setInputCode]=useState("");
  var[isHost,setIsHost]=useState(false);
  var[myName,setMyName]=useState(p.u.name);
  var[oppName,setOppName]=useState(null);
  var[questions,setQuestions]=useState([]);
  var[qi,setQi]=useState(0);
  var[myPick,setMyPick]=useState(-1);
  var[oppPick,setOppPick]=useState(-1);
  var[myTime,setMyTime]=useState(null);
  var[oppTime,setOppTime]=useState(null);
  var[myScore,setMyScore]=useState(0);
  var[oppScore,setOppScore]=useState(0);
  var[timer,setTimer]=useState(TIMER_SEC);
  var[countdown,setCountdown]=useState(3);
  var[error,setError]=useState(null);
  var[roundResults,setRoundResults]=useState([]);
  var[dbg,setDbg]=useState("");
  var[wager,setWager]=useState(0); // 0=friendly, 10/20/50/100=ranked

  var channelRef=useRef(null);
  var timerRef=useRef(null);
  var countdownRef=useRef(null);
  var answeredRef=useRef(false);
  var myIdRef=useRef("p_"+Math.random().toString(36).substring(2,8)); // unique per session

  // Build question pool from VOCAB
  var allCards=useMemo(function(){
    var cards=[];
    VOCAB.forEach(function(dom){dom.cards.forEach(function(c){cards.push(c);});});
    return cards;
  },[]);

  // Generate duel questions (host only, then broadcast)
  function generateQuestions(){
    var picked=shuffle(allCards.slice()).slice(0,ROUNDS);
    return picked.map(function(card){
      var pool=allCards.filter(function(c){return c.id!==card.id;});
      var dists=shuffle(pool).slice(0,3).map(function(c){return c.d;});
      var opts=shuffle(dists.concat([card.d]));
      return{word:card.w,opts:opts,c:opts.indexOf(card.d),ex:card.e};
    });
  }

  // Refs for answer tracking (immune to closure/stale state issues)
  var myAnswerRef=useRef(null);   // {pick, time}
  var oppAnswerRef=useRef(null);  // {pick, time}
  var questionsRef=useRef([]);
  var qiRef=useRef(0);
  var phaseRef=useRef("hub");

  // Keep refs in sync
  questionsRef.current=questions;
  qiRef.current=qi;
  phaseRef.current=phase;

  // Generate room code
  function genCode(){return String(Math.floor(1000+Math.random()*9000));}

  // ── Check if both answered → transition to feedback ──
  function checkBothDone(){
    console.log("[DUEL] checkBothDone: phase="+phaseRef.current+" my="+JSON.stringify(myAnswerRef.current)+" opp="+JSON.stringify(oppAnswerRef.current));
    if(phaseRef.current!=="play"){console.log("[DUEL] → skip: phase is "+phaseRef.current);return;}
    if(!myAnswerRef.current){console.log("[DUEL] → skip: my answer is null");return;}
    if(!oppAnswerRef.current){console.log("[DUEL] → skip: opp answer is null");return;}
    console.log("[DUEL] → BOTH DONE! transitioning to feedback");
    var ma=myAnswerRef.current;var oa=oppAnswerRef.current;
    var qs2=questionsRef.current;var qi2=qiRef.current;
    if(!qs2[qi2])return;

    var q=qs2[qi2];
    var myCorrect=ma.pick===q.c;
    var oppCorrect=oa.pick===q.c;
    var myPts=0;var oppPts=0;

    if(myCorrect&&oppCorrect){
      if(ma.time>oa.time){myPts=100;oppPts=50;}
      else if(oa.time>ma.time){oppPts=100;myPts=50;}
      else{myPts=75;oppPts=75;}
    } else if(myCorrect){myPts=100;}
    else if(oppCorrect){oppPts=100;}

    setMyPick(ma.pick);setOppPick(oa.pick);
    setMyTime(ma.time);setOppTime(oa.time);
    setMyScore(function(s){return s+myPts;});
    setOppScore(function(s){return s+oppPts;});
    try{if(myCorrect)playCorrect();else playWrong();}catch(e){}
    setRoundResults(function(prev){return prev.concat([{qi:qi2,myPick:ma.pick,oppPick:oa.pick,myPts:myPts,oppPts:oppPts,correct:q.c}]);});
    setPhase("feedback");
  }

  // ── Channel cleanup ──
  useEffect(function(){
    return function(){
      if(channelRef.current){
        supabase.removeChannel(channelRef.current);
        channelRef.current=null;
      }
      clearInterval(timerRef.current);
      clearInterval(countdownRef.current);
    };
  },[]);

  // ── Play timer ──
  useEffect(function(){
    if(phase!=="play")return;
    setTimer(TIMER_SEC);
    timerRef.current=setInterval(function(){
      setTimer(function(t){
        if(t<=1){
          clearInterval(timerRef.current);
          if(!answeredRef.current){
            console.log("[DUEL] timer expired, auto-submitting");
            answeredRef.current=true;
            myAnswerRef.current={pick:-1,time:0};
            setMyPick(-1);setMyTime(0);
            setDbg("Timeout! auto-submitted");
            if(channelRef.current)channelRef.current.send({type:"broadcast",event:"answer",payload:{pick:-1,time:0,pid:myIdRef.current}});
            checkBothDone();
          }
          return 0;
        }
        return t-1;
      });
    },1000);
    return function(){clearInterval(timerRef.current);};
  },[phase,qi]);

  // ── Countdown ──
  useEffect(function(){
    if(phase!=="countdown")return;
    setCountdown(3);
    countdownRef.current=setInterval(function(){
      setCountdown(function(c){
        if(c<=1){
          clearInterval(countdownRef.current);
          setPhase("play");
          return 0;
        }
        return c-1;
      });
    },1000);
    return function(){clearInterval(countdownRef.current);};
  },[phase]);

  // ── Subscribe to channel ──
  function joinChannel(code,hosting){
    var myId=myIdRef.current;
    var ch=supabase.channel("duel-"+code);

    ch.on("broadcast",{event:"player_join"},function(msg){
      if(msg.payload.pid===myId)return;
      console.log("[DUEL] opponent joined:",msg.payload.name);
      setOppName(msg.payload.name);
      // If we're the joiner, adopt the host's wager
      if(msg.payload.host&&msg.payload.wager!==undefined)setWager(msg.payload.wager);
    });

    ch.on("broadcast",{event:"game_start"},function(msg){
      if(msg.payload.pid===myId)return;
      console.log("[DUEL] game_start received, Qs:",msg.payload.questions.length,"wager:",msg.payload.wager);
      if(msg.payload.wager!==undefined)setWager(msg.payload.wager);
      questionsRef.current=msg.payload.questions;
      myAnswerRef.current=null;oppAnswerRef.current=null;
      setQuestions(msg.payload.questions);
      setQi(0);setMyScore(0);setOppScore(0);setRoundResults([]);
      setPhase("countdown");
    });

    ch.on("broadcast",{event:"answer"},function(msg){
      if(msg.payload.pid===myId)return;
      console.log("[DUEL] opp answer:",msg.payload);
      oppAnswerRef.current={pick:msg.payload.pick,time:msg.payload.time};
      setOppPick(msg.payload.pick);setOppTime(msg.payload.time);
      setDbg("Opp: pick="+msg.payload.pick+" t="+msg.payload.time);
      checkBothDone();
    });

    ch.on("broadcast",{event:"next_round"},function(msg){
      if(msg.payload.pid===myId)return;
      console.log("[DUEL] next_round:",msg.payload.qi);
      answeredRef.current=false;
      myAnswerRef.current=null;oppAnswerRef.current=null;
      setMyPick(-1);setOppPick(-1);setMyTime(null);setOppTime(null);
      setQi(msg.payload.qi);qiRef.current=msg.payload.qi;
      setDbg("");
      setPhase("play");
    });

    ch.on("broadcast",{event:"game_done"},function(msg){
      if(msg.payload.pid===myId)return;
      console.log("[DUEL] game_done");
      setPhase("done");
    });

    ch.subscribe(function(status){
      console.log("[DUEL] channel:",status);
      if(status==="SUBSCRIBED"){
        ch.send({type:"broadcast",event:"player_join",payload:{name:myName,host:hosting,pid:myId,wager:wager}});
      }
    });

    channelRef.current=ch;
  }

  // ── Answer handler ──
  function doAnswer(i){
    if(answeredRef.current)return;
    answeredRef.current=true;
    clearInterval(timerRef.current);
    var timeLeft=timer;
    myAnswerRef.current={pick:i,time:timeLeft};
    setMyPick(i);setMyTime(timeLeft);
    setDbg("Me: pick="+i+" t="+timeLeft);
    console.log("[DUEL] doAnswer: pick="+i+" time="+timeLeft);
    if(channelRef.current){
      channelRef.current.send({type:"broadcast",event:"answer",payload:{pick:i,time:timeLeft,pid:myIdRef.current}});
    }
    checkBothDone();
  }

  // ── Next round (host drives) ──
  function nextRound(){
    if(qi+1>=ROUNDS){
      if(channelRef.current)channelRef.current.send({type:"broadcast",event:"game_done",payload:{pid:myIdRef.current}});
      setPhase("done");
    } else {
      answeredRef.current=false;
      myAnswerRef.current=null;oppAnswerRef.current=null;
      var next=qi+1;
      console.log("[DUEL] next_round:",next);
      if(channelRef.current)channelRef.current.send({type:"broadcast",event:"next_round",payload:{qi:next,pid:myIdRef.current}});
      setMyPick(-1);setOppPick(-1);setMyTime(null);setOppTime(null);
      setQi(next);qiRef.current=next;
      setDbg("");
      setPhase("play");
    }
  }

  // Also handle next_round for non-host (already in channel listener above)
  // Non-host auto-advances via broadcast event

  // Available wager tiers (filtered by user's XP)
  var WAGER_TIERS=[10,20,50,100];

  // ═══ HUB ═══
  if(phase==="hub")return(<div className="enter" style={{padding:"20px 16px 100px"}}>
    <div style={{textAlign:"center",marginBottom:16}}>
      <span className="out" style={{fontWeight:700,fontSize:15}}>Duel Arena</span>
    </div>
    <div style={{textAlign:"center",marginBottom:20}}>
      <div style={{fontSize:56,marginBottom:8}}>{"⚔️"}</div>
      <h1 className="out" style={{fontWeight:800,fontSize:24,marginBottom:4}}>Vocabulary Duel</h1>
      <p style={{color:"var(--t2)",fontSize:13,lineHeight:1.6}}>{ROUNDS} rounds, {TIMER_SEC}s per question. Fastest wins!</p>
      <div style={{marginTop:8,padding:"6px 16px",display:"inline-block",background:"rgba(212,148,58,.08)",borderRadius:20}}>
        <span style={{fontSize:13,color:"var(--cyan)",fontWeight:700}}>Your XP: {p.u.xp}</span>
      </div>
    </div>
    {error&&<div style={{padding:12,background:"rgba(255,71,87,.1)",border:"1px solid rgba(255,71,87,.2)",borderRadius:10,marginBottom:16,textAlign:"center"}}>
      <p style={{fontSize:12,color:"var(--red)"}}>{error}</p></div>}

    {/* Friendly mode */}
    <div className="crd" style={{padding:16,marginBottom:10,cursor:"pointer",borderColor:"rgba(212,148,58,.15)"}} onClick={function(){
      setWager(0);setError(null);setPhase("pickAction");
    }}>
      <div style={{display:"flex",alignItems:"center",gap:14}}>
        <div style={{width:48,height:48,borderRadius:14,background:"linear-gradient(135deg,#22c55e,#06b6d4)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:22,flexShrink:0}}>{"🤝"}</div>
        <div style={{flex:1}}>
          <div className="out" style={{fontWeight:700,fontSize:15}}>Friendly Duel</div>
          <div style={{fontSize:11,color:"var(--t3)"}}>Play for fun — earn XP based on performance</div>
        </div>
        <span style={{fontSize:16,color:"var(--cyan)"}}>{"→"}</span>
      </div>
    </div>

    {/* Ranked mode */}
    <div className="crd" style={{padding:16,marginBottom:10,background:"linear-gradient(135deg,rgba(255,71,87,.05),rgba(139,94,131,.05))",borderColor:"rgba(255,71,87,.15)"}}>
      <div style={{display:"flex",alignItems:"center",gap:14,marginBottom:12}}>
        <div style={{width:48,height:48,borderRadius:14,background:"linear-gradient(135deg,#c84040,#8b5e83)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:22,flexShrink:0}}>{"🔥"}</div>
        <div style={{flex:1}}>
          <div className="out" style={{fontWeight:700,fontSize:15}}>Ranked Duel</div>
          <div style={{fontSize:11,color:"var(--t3)"}}>Wager XP — winner takes all!</div>
        </div>
      </div>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
        {WAGER_TIERS.map(function(w){
          var canAfford=p.u.xp>=w;
          return(<button key={w} onClick={function(){
            if(!canAfford){setError("You need at least "+w+" XP to wager this amount!");return;}
            setWager(w);setError(null);setPhase("pickAction");
          }} disabled={!canAfford}
            style={{padding:"12px 8px",background:canAfford?"rgba(255,71,87,.08)":"var(--bg3)",border:"1px solid "+(canAfford?"rgba(255,71,87,.2)":"var(--bg3)"),
              borderRadius:12,cursor:canAfford?"pointer":"not-allowed",opacity:canAfford?1:0.4,transition:"all .2s"}}>
            <div className="out" style={{fontWeight:800,fontSize:18,color:canAfford?"var(--red)":"var(--t3)"}}>{w} XP</div>
          </button>);
        })}
      </div>
    </div>

    <div className="crd" style={{marginTop:16,padding:16}}>
      <p className="out" style={{fontWeight:700,fontSize:13,marginBottom:8}}>How it works</p>
      <div style={{fontSize:12,color:"var(--t2)",lineHeight:1.8}}>
        <div>{"🤝"} Friendly: earn XP from performance alone</div>
        <div>{"🔥"} Ranked: both wager the same XP. Winner takes all!</div>
        <div>{"🤝"} Tie = both get their wager back</div>
        <div>{"⚡"} Fastest correct answer = 100 pts, slower = 50 pts</div>
      </div>
    </div>
	<button className="btn2" onClick={p.back} style={{marginTop:16,width:"100%"}}>Back</button>
  </div>);

  // ═══ PICK ACTION (create or join) ═══
  if(phase==="pickAction")return(<div className="enter" style={{padding:"20px 16px",minHeight:"100vh",display:"flex",flexDirection:"column",justifyContent:"center",textAlign:"center"}}>
    <div style={{fontSize:48,marginBottom:12}}>{wager>0?"🔥":"🤝"}</div>
    <h2 className="out" style={{fontWeight:800,fontSize:22,marginBottom:4}}>{wager>0?"Ranked Duel":"Friendly Duel"}</h2>
    {wager>0&&<div style={{marginBottom:16}}>
      <span style={{fontSize:28,fontWeight:900,color:"var(--red)"}}>{wager} XP</span>
      <span style={{fontSize:13,color:"var(--t3)",display:"block",marginTop:4}}>at stake per player</span>
    </div>}
    {!wager&&<p style={{color:"var(--t3)",fontSize:13,marginBottom:16}}>No XP at risk — play for fun!</p>}
    <div style={{display:"flex",flexDirection:"column",gap:12}}>
      <button className="btn1" onClick={function(){
        var code=genCode();setRoomCode(code);setIsHost(true);setError(null);
        joinChannel(code,true);setPhase("create");
      }} style={{fontSize:16,padding:"18px 16px"}}>{"🏠"} Create a Room</button>
      <button className="btn2" onClick={function(){setError(null);setPhase("join");}} style={{fontSize:16,padding:"18px 16px"}}>{"🚪"} Join a Room</button>
    </div>
    <button className="btn2" onClick={function(){setPhase("hub");}} style={{marginTop:16,width:"100%"}}>Back</button>
  </div>);

  // ═══ CREATE ROOM (waiting for opponent) ═══
  if(phase==="create")return(<div className="enter" style={{padding:"20px 16px",minHeight:"100vh",display:"flex",flexDirection:"column",justifyContent:"center",textAlign:"center"}}>
    <div style={{fontSize:48,marginBottom:16}}>{wager>0?"🔥":"🏠"}</div>
    <h2 className="out" style={{fontWeight:800,fontSize:22,marginBottom:8}}>{wager>0?"Ranked Room":"Friendly Room"}</h2>
    {wager>0&&<div style={{padding:"8px 20px",background:"rgba(255,71,87,.1)",borderRadius:20,display:"inline-block",marginBottom:12}}>
      <span style={{fontSize:16,fontWeight:800,color:"var(--red)"}}>Wager: {wager} XP</span></div>}
    <div style={{marginBottom:24}}>
      <div style={{fontSize:14,color:"var(--t2)",marginBottom:12}}>Share this code with your opponent:</div>
      <div className="out" style={{fontSize:56,fontWeight:900,letterSpacing:12,color:"var(--cyan)",animation:"pulse 2s infinite"}}>{roomCode}</div>
    </div>
    {oppName?(<div style={{animation:"fadeIn .3s"}}>
      <div style={{fontSize:18,marginBottom:8}}>{"🎲"}</div>
      <p className="out" style={{fontWeight:700,fontSize:16,color:"var(--green)",marginBottom:16}}>{oppName} joined!</p>
      <button className="btn1" onClick={function(){
        var qs=generateQuestions();setQuestions(qs);questionsRef.current=qs;
        channelRef.current.send({type:"broadcast",event:"game_start",payload:{questions:qs,wager:wager,pid:myIdRef.current}});
        setQi(0);setMyScore(0);setOppScore(0);setRoundResults([]);
        myAnswerRef.current=null;oppAnswerRef.current=null;
        setPhase("countdown");
      }}>Start Duel!</button>
    </div>):(<div>
      <div style={{animation:"pulse 2s infinite",fontSize:14,color:"var(--t3)"}}>Waiting for opponent...</div>
    </div>)}
    <button className="btn2" onClick={function(){if(channelRef.current)supabase.removeChannel(channelRef.current);channelRef.current=null;setPhase("hub");}} style={{marginTop:24,width:"100%"}}>Cancel</button>
  </div>);

  // ═══ JOIN ROOM ═══
  if(phase==="join")return(<div className="enter" style={{padding:"20px 16px",minHeight:"100vh",display:"flex",flexDirection:"column",justifyContent:"center",textAlign:"center"}}>
    <div style={{fontSize:48,marginBottom:16}}>{"🚪"}</div>
    <h2 className="out" style={{fontWeight:800,fontSize:22,marginBottom:20}}>Enter Room Code</h2>
    <input type="text" inputMode="numeric" maxLength={4} value={inputCode}
      onChange={function(e){setInputCode(e.target.value.replace(/\D/g,""));}}
      placeholder="0000"
      style={{textAlign:"center",fontSize:48,fontWeight:900,letterSpacing:12,width:"100%",padding:"16px",
        background:"var(--bg2)",border:"2px solid var(--bdr)",borderRadius:16,color:"var(--cyan)",
        fontFamily:"'DM Sans',sans-serif",outline:"none",boxSizing:"border-box"}}/>
    <button className="btn1" onClick={function(){
      if(inputCode.length!==4){setError("Enter a 4-digit code");return;}
      setRoomCode(inputCode);setIsHost(false);setError(null);
      joinChannel(inputCode,false);setPhase("lobby");
    }} style={{marginTop:20}} disabled={inputCode.length!==4}>Join Room</button>
    <button className="btn2" onClick={function(){setPhase("hub");setInputCode("");}} style={{marginTop:12,width:"100%"}}>Back</button>
  </div>);

  // ═══ LOBBY (non-host waiting for start) ═══
  if(phase==="lobby")return(<div className="enter" style={{padding:"20px 16px",minHeight:"100vh",display:"flex",flexDirection:"column",justifyContent:"center",textAlign:"center"}}>
    <div style={{fontSize:48,marginBottom:16}}>{wager>0?"🔥":"⏳"}</div>
    <h2 className="out" style={{fontWeight:800,fontSize:22,marginBottom:8}}>Room {roomCode}</h2>
    {wager>0&&<div style={{padding:"8px 20px",background:"rgba(255,71,87,.1)",borderRadius:20,display:"inline-block",marginBottom:12}}>
      <span style={{fontSize:16,fontWeight:800,color:"var(--red)"}}>Wager: {wager} XP</span></div>}
    <p style={{color:"var(--t2)",fontSize:14,marginBottom:8}}>You joined as <strong style={{color:"var(--cyan)"}}>{myName}</strong></p>
    <div style={{animation:"pulse 2s infinite",fontSize:14,color:"var(--t3)"}}>Waiting for host to start...</div>
    <button className="btn2" onClick={function(){if(channelRef.current)supabase.removeChannel(channelRef.current);channelRef.current=null;setPhase("hub");}} style={{marginTop:32,width:"100%"}}>Leave</button>
  </div>);

  // ═══ COUNTDOWN ═══
  if(phase==="countdown")return(<div style={{minHeight:"100vh",display:"flex",flexDirection:"column",justifyContent:"center",alignItems:"center",textAlign:"center"}}>
    <div className="out" style={{fontSize:80,fontWeight:900,color:"var(--cyan)",animation:"countUp .5s"}}>{countdown}</div>
    <p style={{color:"var(--t2)",fontSize:16,marginTop:16}}>Get ready!</p>
  </div>);

  // ═══ PLAY ═══
  if(phase==="play"&&questions[qi]){
    var q=questions[qi];
    var timerPct=timer/TIMER_SEC*100;
    var timerCol=timer<=3?"var(--red)":timer<=6?"var(--orange)":"var(--cyan)";
    var oppAnswered=oppPick!==-1||oppTime!==null;

    return(<div style={{padding:"20px 16px",minHeight:"100vh"}}>
      {/* Header: scores + round */}
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:8}}>
        <div style={{textAlign:"center",flex:1}}>
          <div style={{fontSize:11,color:"var(--cyan)",fontWeight:600}}>{myName}</div>
          <div className="out" style={{fontSize:20,fontWeight:900,color:"var(--cyan)"}}>{myScore}</div>
        </div>
        <div style={{textAlign:"center",padding:"0 12px"}}>
          <div style={{fontSize:11,color:"var(--t3)"}}>Round</div>
          <div className="out" style={{fontSize:18,fontWeight:800,color:"var(--t1)"}}>{qi+1}/{ROUNDS}</div>
          {wager>0&&<div style={{fontSize:9,color:"var(--red)",fontWeight:700,marginTop:2}}>{wager} XP</div>}
        </div>
        <div style={{textAlign:"center",flex:1}}>
          <div style={{fontSize:11,color:"var(--orange)",fontWeight:600}}>{oppName||"Opponent"}</div>
          <div className="out" style={{fontSize:20,fontWeight:900,color:"var(--orange)"}}>{oppScore}</div>
        </div>
      </div>

      {/* Timer bar */}
      <div style={{height:5,background:"var(--bg3)",borderRadius:3,marginBottom:16,overflow:"hidden"}}>
        <div style={{height:"100%",width:timerPct+"%",background:timerCol,borderRadius:3,transition:"width 1s linear"}}/></div>

      {/* Timer + opponent status */}
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:20}}>
        <span className="out" style={{fontSize:24,fontWeight:900,color:timerCol}}>{timer}s</span>
        {oppAnswered&&<span style={{fontSize:12,color:"var(--orange)",fontWeight:600,animation:"fadeIn .3s"}}>{"⚡"} {oppName} answered!</span>}
      </div>

      {/* Question */}
      <div style={{textAlign:"center",marginBottom:24}}>
        <span className="out" style={{fontSize:11,color:"var(--purple)",fontWeight:700,textTransform:"uppercase",letterSpacing:1,display:"block",marginBottom:8}}>What does this word mean?</span>
        <span className="out" style={{fontSize:32,fontWeight:900,color:"var(--t1)"}}>{q.word}</span>
      </div>

      {/* Options */}
      <div style={{display:"flex",flexDirection:"column",gap:8}}>
        {q.opts.map(function(opt,i){
          var picked=myPick===i;
          return(<button key={i} onClick={function(){doAnswer(i);}} disabled={myPick!==-1}
            style={{padding:"14px 16px",background:picked?"rgba(212,148,58,.1)":"var(--bg2)",
              border:picked?"2px solid var(--cyan)":"1px solid var(--bdr)",borderRadius:12,
              cursor:myPick!==-1?"default":"pointer",fontSize:14,color:picked?"var(--cyan)":"var(--t1)",
              textAlign:"left",fontFamily:"'DM Sans',sans-serif",transition:"all .15s",lineHeight:1.5,
              fontWeight:picked?600:400}}>
            <span style={{fontSize:12,color:"var(--t3)",marginRight:8,fontWeight:700}}>{String.fromCharCode(65+i)}</span>
            {opt}
          </button>);
        })}
      </div>
    </div>);
  }

  // ═══ FEEDBACK (after both answer) ═══
  if(phase==="feedback"&&questions[qi]){
    var q2=questions[qi];
    var lastResult=roundResults[roundResults.length-1];
    var myCorrect=lastResult&&lastResult.myPick===q2.c;
    var oppCorrect=lastResult&&lastResult.oppPick===q2.c;

    return(<div style={{padding:"20px 16px",minHeight:"100vh"}}>
      {/* Scores */}
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16}}>
        <div style={{textAlign:"center",flex:1}}>
          <div style={{fontSize:11,color:"var(--cyan)",fontWeight:600}}>{myName}</div>
          <div className="out" style={{fontSize:22,fontWeight:900,color:"var(--cyan)"}}>{myScore}</div>
          {lastResult&&<div style={{fontSize:12,fontWeight:700,color:lastResult.myPts>0?"var(--green)":"var(--red)",animation:"fadeIn .3s"}}>+{lastResult.myPts}</div>}
        </div>
        <div style={{fontSize:28,animation:"countUp .3s"}}>{myCorrect&&oppCorrect?"⚔️":myCorrect?"✅":oppCorrect?"💥":"😬"}</div>
        <div style={{textAlign:"center",flex:1}}>
          <div style={{fontSize:11,color:"var(--orange)",fontWeight:600}}>{oppName||"Opponent"}</div>
          <div className="out" style={{fontSize:22,fontWeight:900,color:"var(--orange)"}}>{oppScore}</div>
          {lastResult&&<div style={{fontSize:12,fontWeight:700,color:lastResult.oppPts>0?"var(--green)":"var(--red)",animation:"fadeIn .3s"}}>+{lastResult.oppPts}</div>}
        </div>
      </div>

      {/* Correct answer */}
      <div className="crd" style={{padding:16,marginBottom:16,borderColor:"rgba(0,230,118,.2)",background:"rgba(0,230,118,.06)"}}>
        <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:8}}>
          <span className="out" style={{fontWeight:800,fontSize:18,color:"var(--cyan)"}}>{q2.word}</span>
          <span style={{fontSize:13,color:"var(--green)",fontWeight:600}}>= {q2.opts[q2.c]}</span>
        </div>
        <p style={{fontSize:12,color:"var(--t3)",fontStyle:"italic"}}>"{q2.ex}"</p>
      </div>

      {/* Who answered what */}
      <div style={{display:"flex",gap:8,marginBottom:20}}>
        <div className="crd" style={{flex:1,padding:12,borderColor:myCorrect?"rgba(0,230,118,.2)":"rgba(255,71,87,.2)",textAlign:"center"}}>
          <div style={{fontSize:11,color:"var(--t3)",marginBottom:4}}>You picked</div>
          <div className="out" style={{fontWeight:700,fontSize:13,color:myCorrect?"var(--green)":"var(--red)"}}>{myPick>=0?String.fromCharCode(65+myPick):"⏰ Timeout"}</div>
        </div>
        <div className="crd" style={{flex:1,padding:12,borderColor:oppCorrect?"rgba(0,230,118,.2)":"rgba(255,71,87,.2)",textAlign:"center"}}>
          <div style={{fontSize:11,color:"var(--t3)",marginBottom:4}}>{oppName} picked</div>
          <div className="out" style={{fontWeight:700,fontSize:13,color:oppCorrect?"var(--green)":"var(--red)"}}>{oppPick>=0?String.fromCharCode(65+oppPick):"⏰ Timeout"}</div>
        </div>
      </div>

      {/* Next button (host controls, or auto after timeout for both) */}
      {isHost?<button className="btn1" onClick={nextRound}>{qi+1<ROUNDS?"Next Round ("+(qi+2)+"/"+ROUNDS+")":"See Final Results"}</button>
      :<div style={{textAlign:"center",color:"var(--t3)",fontSize:13,animation:"pulse 2s infinite"}}>Waiting for next round...</div>}
    </div>);
  }

  // ═══ DONE ═══
  if(phase==="done"){
    var iWon=myScore>oppScore;var tied=myScore===oppScore;

    // Base XP from performance (always earned)
    var baseXp=Math.round((myScore/100)*5)+(iWon?15:tied?10:5);

    // Wager outcome
    var wagerNet=0;
    if(wager>0){
      if(iWon)wagerNet=wager;       // win opponent's wager
      else if(tied)wagerNet=0;       // get your wager back
      else wagerNet=-wager;          // lose your wager
    }

    var totalXp=baseXp+wagerNet;
    // Floor: never go below 0 total XP
    if(p.u.xp+totalXp<0)totalXp=-p.u.xp;

    return(<div className="enter" style={{padding:"20px 16px 100px"}}>
      <div style={{textAlign:"center",marginBottom:24}}>
        <div style={{fontSize:56,marginBottom:12,animation:"countUp .6s"}}>{iWon?"🏆":tied?"🤝":"😤"}</div>
        <h1 className="out" style={{fontWeight:900,fontSize:28,marginBottom:4}}>{iWon?"Victory!":tied?"It's a Tie!":"Defeat"}</h1>
        <p style={{color:"var(--t2)",fontSize:14}}>Room {roomCode}{wager>0?" · Ranked":"  · Friendly"}</p>
      </div>

      {/* Final scores */}
      <div style={{display:"flex",gap:12,marginBottom:20}}>
        <div className="crd" style={{flex:1,padding:20,textAlign:"center",borderColor:iWon?"rgba(0,230,118,.3)":"var(--bdr)",background:iWon?"rgba(0,230,118,.06)":"var(--bg2)"}}>
          <div style={{fontSize:11,color:"var(--cyan)",fontWeight:600,marginBottom:4}}>{myName}</div>
          <div className="out" style={{fontSize:36,fontWeight:900,color:"var(--cyan)"}}>{myScore}</div>
        </div>
        <div className="crd" style={{flex:1,padding:20,textAlign:"center",borderColor:!iWon&&!tied?"rgba(255,71,87,.3)":"var(--bdr)",background:!iWon&&!tied?"rgba(255,71,87,.06)":"var(--bg2)"}}>
          <div style={{fontSize:11,color:"var(--orange)",fontWeight:600,marginBottom:4}}>{oppName||"Opponent"}</div>
          <div className="out" style={{fontSize:36,fontWeight:900,color:"var(--orange)"}}>{oppScore}</div>
        </div>
      </div>

      {/* Wager result */}
      {wager>0&&<div className="crd" style={{padding:14,marginBottom:16,textAlign:"center",
        background:iWon?"rgba(0,230,118,.06)":tied?"rgba(212,148,58,.06)":"rgba(255,71,87,.06)",
        borderColor:iWon?"rgba(0,230,118,.2)":tied?"rgba(212,148,58,.2)":"rgba(255,71,87,.2)"}}>
        <div style={{fontSize:13,color:"var(--t2)",marginBottom:4}}>Wager: {wager} XP per player</div>
        <div className="out" style={{fontSize:24,fontWeight:900,color:iWon?"var(--green)":tied?"var(--cyan)":"var(--red)"}}>
          {iWon?"+"+wager+" XP won!":tied?"XP returned":"-"+wager+" XP lost"}
        </div>
      </div>}

      {/* Round breakdown */}
      <div className="crd" style={{padding:14,marginBottom:20}}>
        <p className="out" style={{fontWeight:700,fontSize:13,color:"var(--t2)",marginBottom:10}}>Round Breakdown</p>
        <div style={{display:"flex",flexDirection:"column",gap:4}}>
          {roundResults.map(function(r,i){
            var q3=questions[r.qi];
            return(<div key={i} style={{display:"flex",alignItems:"center",gap:8,padding:"6px 0",borderBottom:i<roundResults.length-1?"1px solid var(--bg3)":"none"}}>
              <span style={{width:20,fontSize:11,color:"var(--t3)",fontWeight:700}}>{i+1}</span>
              <span style={{flex:1,fontSize:12,color:"var(--t1)"}}>{q3.word}</span>
              <span style={{fontSize:11,fontWeight:700,color:r.myPts>=100?"var(--green)":r.myPts>0?"var(--cyan)":"var(--red)",width:35,textAlign:"right"}}>+{r.myPts}</span>
              <span style={{fontSize:11,color:"var(--t3)",width:8,textAlign:"center"}}>|</span>
              <span style={{fontSize:11,fontWeight:700,color:r.oppPts>=100?"var(--green)":r.oppPts>0?"var(--orange)":"var(--red)",width:35,textAlign:"right"}}>+{r.oppPts}</span>
            </div>);
          })}
        </div>
      </div>

      {/* XP summary */}
      <div style={{textAlign:"center",marginBottom:20}}>
        <div style={{fontSize:12,color:"var(--t3)",marginBottom:4}}>Performance: +{baseXp} XP{wager>0?(wagerNet>=0?" · Wager: +"+wagerNet:" · Wager: "+wagerNet):""}</div>
        <div className="out" style={{fontSize:24,fontWeight:900,color:totalXp>=0?"var(--gold)":"var(--red)"}}>{totalXp>=0?"+":""}{totalXp} XP</div>
      </div>

      <button className="btn1" onClick={function(){
        if(channelRef.current){supabase.removeChannel(channelRef.current);channelRef.current=null;}
        var result={score:myScore,won:iWon,tied:tied,wager:wager,wagerWon:iWon?wager:0};
        p.done("duel",result,totalXp);
      }}>Collect XP</button>
    </div>);
  }

  return null;
}


// ─── CLUE HUNTER ───
function ClueHunter(p){
  var TOTAL=10;
  var[phase,sP]=useState("intro");
  var[ci,sC]=useState(0);
  var[items]=useState(function(){return shuffle(CLUE_HUNTER.slice()).slice(0,TOTAL);});
  var[selected,setSel]=useState([]);
  var[pick,sPk]=useState(-1);
  var[scores,setSc]=useState([]);
 
  function toggleChip(idx){
    if(phase!=="q")return;
    setSel(function(prev){return prev.includes(idx)?prev.filter(function(i){return i!==idx;}):prev.concat([idx]);});
  }
 
  function confirmClues(){if(selected.length===0)return;sP("clue_fb");}
  function goAnswer(){sP("ans");}
 
  function pickAnswer(i){
    if(phase!=="ans")return;
    var item=items[ci];
    var clueOK=selected.length>0&&selected.every(function(s){return item.chips[s].c;})&&selected.some(function(s){return item.chips[s].c;});
    var ansOK=i===item.ans;
    var pts=clueOK&&ansOK?10:clueOK&&!ansOK?4:!clueOK&&ansOK?3:0;
    setSc(function(prev){return prev.concat([{clue:clueOK,ans:ansOK,pts:pts}]);});try{if(ansOK)playCorrect();else playWrong();}catch(e){}
    sPk(i);sP("ans_fb");
  }
 
  function next(){
    if(ci<items.length-1){sC(ci+1);setSel([]);sPk(-1);sP("q");}
    else sP("done");
  }
 
  // ── shared sentence renderer ──
  function SentenceCard({item,answerWord,isCorrect}){
    var parts=item.sentence.split("___");
    return(
      <div className="crd" style={{padding:"28px 24px",marginBottom:24,background:"rgba(212,148,58,.04)",borderColor:"rgba(212,148,58,.12)"}}>
        <p style={{fontSize:20,lineHeight:1.8,color:"var(--t1)",fontFamily:"'DM Sans',sans-serif"}}>
          {parts.map(function(part,i){return(<span key={i}>{part}
            {i<parts.length-1&&(answerWord
              ?<span style={{color:isCorrect?"var(--green)":"var(--red)",fontWeight:700,borderBottom:"3px solid "+(isCorrect?"var(--green)":"var(--red)"),padding:"0 4px"}}>{answerWord}</span>
              :<span style={{display:"inline-block",minWidth:88,borderBottom:"3px solid var(--cyan)",margin:"0 6px",verticalAlign:"bottom",opacity:.6}}>{"\u00a0\u00a0\u00a0\u00a0\u00a0\u00a0\u00a0\u00a0"}</span>)}
          </span>);})}
        </p>
      </div>
    );
  }
 
  function Header(){
    return(<>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:20}}>
        <div/>
        <span className="out" style={{fontSize:13,color:"var(--t2)",fontWeight:600}}>{ci+1} / {TOTAL}</span>
      </div>
      <Bar value={phase==="ans_fb"?ci+1:ci} max={TOTAL} h={4} color="linear-gradient(90deg,#d4943a,#8b5e83)"/>
      <div style={{marginTop:20,marginBottom:12}}>
        <span className="out" style={{fontSize:11,fontWeight:700,color:"var(--cyan)",textTransform:"uppercase",letterSpacing:1}}>{"🧭"} {phase==="clue_fb"||phase==="ans_fb"?items[ci].cat:"Find the clue..."}</span>
      </div>
    </>);
  }
 
  // ── INTRO ──
  if(phase==="intro")return(
    <div className="enter" style={{padding:"32px 24px",minHeight:"100vh",display:"flex",flexDirection:"column",justifyContent:"center"}}>
      <div style={{textAlign:"center",marginBottom:36}}>
        <div style={{fontSize:72,marginBottom:16}}>{"🧭"}</div>
        <h1 className="out" style={{fontWeight:900,fontSize:32,marginBottom:10}}>Clue Hunter</h1>
        <p style={{color:"var(--t2)",fontSize:15,lineHeight:1.7}}>Spot the grammatical clue in the sentence.<br/>Then fill in the blank.</p>
      </div>
      <div className="crd" style={{marginBottom:24,padding:22}}>
        <p className="out" style={{fontSize:11,fontWeight:700,color:"var(--cyan)",textTransform:"uppercase",letterSpacing:1,marginBottom:16}}>How it works</p>
        <div style={{display:"flex",flexDirection:"column",gap:16}}>
          {[
            {n:"1",t:"Read the sentence",d:"A key word (or words) will tell you which form is correct."},
            {n:"2",t:"Tap your clue(s)",d:"Select what's guiding your answer — before you see the options."},
            {n:"3",t:"Fill the blank",d:"Right clue + right answer = max XP."},
          ].map(function(s){return(
            <div key={s.n} style={{display:"flex",gap:14,alignItems:"flex-start"}}>
              <div style={{width:30,height:30,borderRadius:"50%",background:"linear-gradient(135deg,#d4943a,#8b5e83)",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
                <span className="out" style={{fontSize:13,fontWeight:800,color:"#fff"}}>{s.n}</span>
              </div>
              <div><div className="out" style={{fontWeight:700,fontSize:14,color:"var(--t1)"}}>{s.t}</div>
                <div style={{fontSize:13,color:"var(--t2)",marginTop:3,lineHeight:1.5}}>{s.d}</div></div>
            </div>);})}
        </div>
      </div>
      <div className="crd" style={{marginBottom:28,background:"rgba(255,215,0,.06)",borderColor:"rgba(255,215,0,.15)",padding:"14px 18px"}}>
        <p className="out" style={{fontSize:11,fontWeight:700,color:"var(--gold)",textTransform:"uppercase",letterSpacing:1,marginBottom:6}}>Scoring</p>
        <p style={{fontSize:13,color:"var(--t2)",lineHeight:1.5}}>Right clue + right answer <span style={{color:"var(--gold)",fontWeight:700}}>10 pts</span> &nbsp;·&nbsp; Right clue only <span style={{color:"var(--cyan)",fontWeight:700}}>4 pts</span> &nbsp;·&nbsp; Right answer only <span style={{color:"var(--orange)",fontWeight:700}}>3 pts</span></p>
      </div>
      <button className="btn1" onClick={function(){sP("q");}}>Start — {TOTAL} Questions</button>
      <button className="btn2" onClick={p.back} style={{marginTop:12,width:"100%"}}>Back</button>
    </div>);
 
  // ── DONE ──
  if(phase==="done"){
    var total=scores.reduce(function(s,x){return s+x.pts;},0);
    var xp=20+Math.round(total*2.5);
    var perfect=scores.filter(function(s){return s.clue&&s.ans;}).length;
    var clueOnly=scores.filter(function(s){return s.clue&&!s.ans;}).length;
    var ansOnly=scores.filter(function(s){return !s.clue&&s.ans;}).length;
    var pct=Math.round(total/(TOTAL*10)*100);
    var emoji=pct>=80?"🏆":pct>=60?"⚔️":pct>=40?"🧭":"📚";
    return(
      <div className="enter" style={{padding:"32px 24px",minHeight:"100vh",display:"flex",flexDirection:"column",justifyContent:"center",textAlign:"center"}}>
        <div style={{fontSize:64,marginBottom:16}}>{emoji}</div>
        <h1 className="out" style={{fontWeight:900,fontSize:28,marginBottom:6}}>Case Closed!</h1>
        <div className="out" style={{fontSize:52,fontWeight:900,color:pct>=70?"var(--green)":pct>=40?"var(--cyan)":"var(--orange)",marginBottom:4,animation:"countUp .8s"}}>{pct}%</div>
        <div className="out" style={{fontSize:22,fontWeight:800,color:"var(--gold)",marginBottom:36}}>+{xp} XP</div>
        <div className="crd" style={{marginBottom:28,padding:24}}>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:8}}>
            <div><div className="out" style={{fontSize:32,fontWeight:900,color:"var(--green)"}}>{perfect}</div><div style={{fontSize:12,color:"var(--t2)",marginTop:4}}>Perfect{"\n"}(clue + answer)</div></div>
            <div><div className="out" style={{fontSize:32,fontWeight:900,color:"var(--cyan)"}}>{clueOnly}</div><div style={{fontSize:12,color:"var(--t2)",marginTop:4}}>Clue only{"\n"}(right clue)</div></div>
            <div><div className="out" style={{fontSize:32,fontWeight:900,color:"var(--orange)"}}>{ansOnly}</div><div style={{fontSize:12,color:"var(--t2)",marginTop:4}}>Answer only{"\n"}(lucky!)</div></div>
          </div>
        </div>
        <button className="btn1" onClick={function(){p.done(perfect,TOTAL,xp);}}>Collect XP</button>
      </div>);
  }
 
  var item=items[ci];
  var lastScore=scores[scores.length-1];
 
  // ── Q : CLUE HUNT ──
  if(phase==="q")return(
    <div style={{padding:"20px 20px 100px",minHeight:"100vh",display:"flex",flexDirection:"column"}}>
      <Header/>
      <SentenceCard item={item}/>
      <p className="out" style={{fontSize:13,fontWeight:600,color:"var(--t2)",marginBottom:18,textAlign:"center"}}>
        Which word(s) tell you the correct form?
      </p>
      <div style={{display:"flex",flexWrap:"wrap",gap:10,marginBottom:32,justifyContent:"center"}}>
        {item.chips.map(function(chip,idx){
          var isSel=selected.includes(idx);
          return(
            <button key={idx} onClick={function(){toggleChip(idx);}}
              style={{padding:"11px 20px",borderRadius:28,border:"2px solid "+(isSel?"var(--cyan)":"var(--bdr)"),background:isSel?"rgba(212,148,58,.12)":"var(--bg2)",color:isSel?"var(--cyan)":"var(--t1)",fontSize:15,fontFamily:"'DM Sans',sans-serif",fontWeight:isSel?700:500,cursor:"pointer",transition:"all .15s",transform:isSel?"scale(1.05)":"scale(1)"}}>
              {chip.w}
            </button>);
        })}
      </div>
      <div style={{marginTop:"auto"}}>
        <button className="btn1" onClick={confirmClues}
          style={{opacity:selected.length>0?1:.3,pointerEvents:selected.length>0?"auto":"none",fontSize:16}}>
          Confirm my clue{selected.length>1?"s":""} →
        </button>
        <button className="btn2" onClick={p.back} style={{marginTop:12,width:"100%"}}>Back</button>
      </div>
    </div>);
 
  // ── CLUE FEEDBACK ──
  if(phase==="clue_fb")return(
    <div className="enter" style={{padding:"20px 20px 100px",minHeight:"100vh",display:"flex",flexDirection:"column"}}>
      <Header/>
      <SentenceCard item={item}/>
      <p className="out" style={{fontSize:11,fontWeight:700,color:"var(--t2)",textTransform:"uppercase",letterSpacing:1,marginBottom:14,textAlign:"center"}}>Your clues</p>
      <div style={{display:"flex",flexWrap:"wrap",gap:10,marginBottom:28,justifyContent:"center"}}>
        {item.chips.map(function(chip,idx){
          var isSel=selected.includes(idx);
          var isReal=chip.c;
          var col=!isSel?"var(--t3)":isReal?"var(--green)":"var(--red)";
          var bg=!isSel?"transparent":isReal?"rgba(0,230,118,.12)":"rgba(255,71,87,.12)";
          var bd=!isSel?"var(--bdr)":isReal?"var(--green)":"var(--red)";
          return(
            <div key={idx} style={{padding:"11px 20px",borderRadius:28,border:"2px solid "+bd,background:bg,color:col,fontSize:15,fontWeight:isSel?700:400,display:"flex",alignItems:"center",gap:6}}>
              {chip.w}{isSel&&<span style={{fontSize:14}}>{isReal?"✓":"✗"}</span>}
            </div>);
        })}
      </div>
      <div className="crd" style={{padding:20,background:"rgba(212,148,58,.06)",borderColor:"rgba(212,148,58,.15)",marginBottom:28}}>
        <p className="out" style={{fontSize:11,fontWeight:700,color:"var(--cyan)",textTransform:"uppercase",letterSpacing:1,marginBottom:10}}>{"💡"} Clue analysis</p>
        <p style={{fontSize:14,color:"var(--t2)",lineHeight:1.65}}>{item.clue}</p>
      </div>
      <div style={{marginTop:"auto"}}>
        <button className="btn1" onClick={goAnswer} style={{fontSize:16}}>Now answer →</button>
        <button className="btn2" onClick={p.back} style={{marginTop:12,width:"100%"}}>Back</button>
      </div>
    </div>);
 
  // ── ANSWER ──
  if(phase==="ans")return(
    <div className="enter" style={{padding:"20px 20px 100px",minHeight:"100vh",display:"flex",flexDirection:"column"}}>
      <Header/>
      <SentenceCard item={item}/>
      <p className="out" style={{fontSize:13,fontWeight:600,color:"var(--t2)",marginBottom:18,textAlign:"center"}}>Choose the correct form:</p>
      <div style={{display:"flex",flexDirection:"column",gap:10}}>
        {item.opts.map(function(opt,i){
          return(
            <button key={i} onClick={function(){pickAnswer(i);}}
              style={{padding:"16px 20px",borderRadius:14,border:"1px solid var(--bdr)",background:"var(--bg2)",color:"var(--t1)",fontSize:16,fontFamily:"'DM Sans',sans-serif",fontWeight:500,cursor:"pointer",textAlign:"left",display:"flex",alignItems:"center",gap:14,transition:"all .15s"}}>
              <span className="out" style={{width:30,height:30,borderRadius:"50%",border:"2px solid var(--t3)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:13,fontWeight:700,flexShrink:0,color:"var(--t3)"}}>
                {String.fromCharCode(65+i)}
              </span>
              {opt}
            </button>);
        })}
      </div>
      <button className="btn2" onClick={p.back} style={{marginTop:16,width:"100%"}}>Back</button>
    </div>);
 
  // ── ANSWER FEEDBACK ──
  if(phase==="ans_fb"){
    var isCorrect=pick===item.ans;
    return(
      <div className={"enter"+(isCorrect?"":" sk")} style={{padding:"20px 20px 100px",minHeight:"100vh",display:"flex",flexDirection:"column"}}>
        <Header/>
        <SentenceCard item={item} answerWord={item.opts[item.ans]} isCorrect={isCorrect}/>
        {lastScore&&<div style={{textAlign:"center",marginBottom:20}}>
          <div className="out" style={{fontSize:24,fontWeight:900,color:lastScore.pts>=10?"var(--gold)":lastScore.pts>=4?"var(--cyan)":lastScore.pts>0?"var(--orange)":"var(--t3)"}}>
            {lastScore.pts>0?"+"+lastScore.pts+" pts":"No points"}{lastScore.pts>=10&&" 🔥"}
          </div>
          <div style={{fontSize:12,color:"var(--t3)",marginTop:4}}>
            {lastScore.clue&&lastScore.ans?"Perfect — clue + answer ✓":lastScore.clue?"Right clue, wrong answer":lastScore.ans?"Right answer, but what was the clue?":"Keep practising!"}
          </div>
        </div>}
        <div style={{display:"flex",flexDirection:"column",gap:8,marginBottom:20}}>
          {item.opts.map(function(opt,i){
            var isCor=i===item.ans;var isPk=i===pick;
            var bg=isCor?"rgba(0,230,118,.12)":isPk&&!isCor?"rgba(255,71,87,.12)":"var(--bg2)";
            var bd=isCor?"var(--green)":isPk&&!isCor?"var(--red)":"var(--bdr)";
            return(
              <div key={i} style={{padding:"14px 20px",borderRadius:14,border:"1px solid "+bd,background:bg,display:"flex",alignItems:"center",gap:14}}>
                <span className="out" style={{width:30,height:30,borderRadius:"50%",border:"2px solid "+(isCor?"var(--green)":isPk?"var(--red)":"var(--bdr)"),display:"flex",alignItems:"center",justifyContent:"center",fontSize:13,fontWeight:700,flexShrink:0,background:isCor?"var(--green)":isPk&&!isCor?"var(--red)":"transparent",color:(isCor||isPk)?"#fff":"var(--t3)"}}>
                  {isCor?"✓":isPk?"✗":String.fromCharCode(65+i)}
                </span>
                <span style={{fontSize:15,color:"var(--t1)"}}>{opt}</span>
              </div>);
          })}
        </div>
        <div className="crd" style={{padding:18,background:"rgba(212,148,58,.06)",borderColor:"rgba(212,148,58,.15)",marginBottom:24}}>
          <p style={{fontSize:14,color:"var(--t2)",lineHeight:1.65}}>{item.exp}</p>
        </div>
        <div style={{marginTop:"auto"}}>
          <button className="btn1" onClick={next} style={{fontSize:16}}>
            {ci<items.length-1?"Next Question →":"See Results"}
          </button>
          <button className="btn2" onClick={p.back} style={{marginTop:12,width:"100%"}}>Back</button>
        </div>
      </div>);
  }
 
  return null;
}

// ─── SPEED MATCH ───
function SpeedMatchHub(p){
  var bestE=p.u.gameScores&&p.u.gameScores.matchEasy;
  var bestH=p.u.gameScores&&p.u.gameScores.matchHard;
  return(<div className="enter" style={{padding:"20px 16px",minHeight:"100vh",display:"flex",flexDirection:"column",justifyContent:"center",textAlign:"center"}}>
    <div style={{fontSize:56,marginBottom:16}}>{"🎯"}</div>
    <h1 className="out" style={{fontWeight:900,fontSize:26,marginBottom:8}}>Speed Match</h1>
    <p style={{color:"var(--t2)",fontSize:13,marginBottom:32,lineHeight:1.6}}>Match each word with its definition.<br/>Flip tiles, find pairs, beat the clock!</p>
    <div style={{display:"flex",flexDirection:"column",gap:12,maxWidth:320,margin:"0 auto",width:"100%"}}>
      <div className="crd" onClick={function(){p.nav("matchE");}} style={{cursor:"pointer",padding:20,textAlign:"center"}}>
        <div className="out" style={{fontWeight:800,fontSize:18,color:"var(--cyan)",marginBottom:4}}>Easy Mode</div>
        <div style={{fontSize:12,color:"var(--t3)"}}>6 pairs · 4x3 grid</div>
        {bestE&&<div style={{fontSize:11,color:"var(--gold)",marginTop:6}}>{"🏅"} Best: {bestE.time}s · {bestE.moves} moves</div>}
      </div>
      <div className="crd" onClick={function(){p.nav("matchH");}} style={{cursor:"pointer",padding:20,textAlign:"center"}}>
        <div className="out" style={{fontWeight:800,fontSize:18,color:"var(--purple)",marginBottom:4}}>Hard Mode</div>
        <div style={{fontSize:12,color:"var(--t3)"}}>8 pairs · 4x4 grid</div>
        {bestH&&<div style={{fontSize:11,color:"var(--gold)",marginTop:6}}>{"🏅"} Best: {bestH.time}s · {bestH.moves} moves</div>}
      </div>
    </div>
    <button className="btn2" onClick={p.back} style={{marginTop:24,width:"100%",maxWidth:320,margin:"24px auto 0"}}>Back</button>
  </div>);
}

function SpeedMatch(p){
  var pairCount=p.mode==="hard"?8:6;
  var cols=p.mode==="hard"?4:3;
  var rows=p.mode==="hard"?4:4;

  // Build pairs from vocab
  var pairs=useMemo(function(){
    var all=[];
    VOCAB.forEach(function(dom){dom.cards.forEach(function(c){
      // Shorten definition to fit tiles
      all.push({word:c.w,def:c.d});
    });});
    var picked=shuffle(all).slice(0,pairCount);
    var tiles=[];
    picked.forEach(function(pair,i){
      tiles.push({id:i*2,pairId:i,content:pair.word,type:"word"});
      tiles.push({id:i*2+1,pairId:i,content:pair.def,type:"def"});
    });
    return shuffle(tiles);
  },[]);

  var[revealed,setRevealed]=useState([]);
  var[matched,setMatched]=useState([]);
  var[moves,setMoves]=useState(0);
  var[startTime,setStartTime]=useState(null);
  var[elapsed,setElapsed]=useState(0);
  var[phase,setPhase]=useState("intro");
  var[lastWrong,setLastWrong]=useState(false);
  var timerRef=useRef(null);

  // Timer
  useEffect(function(){
    if(phase!=="play")return;
    timerRef.current=setInterval(function(){
      setElapsed(function(prev){return Math.round((Date.now()-startTime)/100)/10;});
    },100);
    return function(){clearInterval(timerRef.current);};
  },[phase,startTime]);

  // Check for match when 2 tiles revealed
  useEffect(function(){
    if(revealed.length!==2)return;
    var a=pairs.find(function(t){return t.id===revealed[0];});
    var b=pairs.find(function(t){return t.id===revealed[1];});
    setMoves(moves+1);
    if(a.pairId===b.pairId){
      // Match!
      try{playCorrect();}catch(e){}
      setTimeout(function(){
        setMatched(function(prev){return prev.concat([a.pairId]);});
        setRevealed([]);
      },300);
    } else {
      // No match
      try{playWrong();}catch(e){}
      setLastWrong(true);
      setTimeout(function(){setRevealed([]);setLastWrong(false);},800);
    }
  },[revealed.length]);

  // Check win
  var won=matched.length===pairCount;
  useEffect(function(){
    if(won&&phase==="play"){
      clearInterval(timerRef.current);
      setPhase("done");
    }
  },[won]);

  function tapTile(id){
    if(phase!=="play")return;
    if(revealed.length>=2)return;
    if(revealed.indexOf(id)!==-1)return;
    var tile=pairs.find(function(t){return t.id===id;});
    if(matched.indexOf(tile.pairId)!==-1)return;
    setRevealed(function(prev){return prev.concat([id]);});
  }

  function startGame(){
    setStartTime(Date.now());
    setPhase("play");
  }

  // ── INTRO ──
  if(phase==="intro")return(<div className="enter" style={{padding:"20px 16px",minHeight:"100vh",display:"flex",flexDirection:"column",justifyContent:"center",textAlign:"center"}}>
    <div style={{fontSize:56,marginBottom:16}}>🎯</div>
    <h1 className="out" style={{fontWeight:900,fontSize:26,marginBottom:8}}>Speed Match</h1>
    <p style={{color:"var(--t2)",fontSize:13,marginBottom:8}}>{p.mode==="hard"?"Hard":"Easy"} — {pairCount} pairs to match</p>
    <p style={{color:"var(--t3)",fontSize:12,marginBottom:32,lineHeight:1.6}}>Tap two tiles to reveal them. Match each word with its definition. Fastest time wins!</p>
    <button className="btn1" onClick={startGame}>Start!</button>
    <button className="btn2" onClick={p.back} style={{marginTop:12,width:"100%"}}>Back</button></div>);

  // ── DONE ──
  if(phase==="done"){
    var finalTime=elapsed;
    var stars=finalTime<(pairCount*4)?3:finalTime<(pairCount*7)?2:1;
    var xp=Math.round((pairCount*10)+(stars*15)+(pairCount*30/Math.max(1,finalTime))*10);
    var modeKey=p.mode==="hard"?"matchHard":"matchEasy";
    var prev=p.u.gameScores&&p.u.gameScores[modeKey];
    var isRecord=!prev||finalTime<prev.time;

    return(<div className="enter" style={{padding:"20px 16px",minHeight:"100vh",display:"flex",flexDirection:"column",justifyContent:"center",textAlign:"center"}}>
      <div style={{fontSize:56,marginBottom:16,animation:"countUp .6s"}}>{stars===3?"⚡":stars===2?"🎯":"✅"}</div>
      <h1 className="out" style={{fontWeight:900,fontSize:28,marginBottom:8}}>{stars===3?"Lightning Fast!":stars===2?"Well Done!":"Completed!"}</h1>
      {isRecord&&<div style={{fontSize:14,color:"var(--gold)",fontWeight:700,marginBottom:8,animation:"pulse 1s infinite"}}>🏅 NEW RECORD!</div>}
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginBottom:20,maxWidth:280,margin:"0 auto 20px"}}>
        <div className="crd" style={{padding:12,textAlign:"center"}}><div className="out" style={{fontSize:24,fontWeight:800,color:"var(--cyan)"}}>{finalTime}s</div><div style={{fontSize:10,color:"var(--t3)"}}>Time</div></div>
        <div className="crd" style={{padding:12,textAlign:"center"}}><div className="out" style={{fontSize:24,fontWeight:800,color:"var(--purple)"}}>{moves}</div><div style={{fontSize:10,color:"var(--t3)"}}>Moves</div></div>
      </div>
      <div style={{fontSize:28,marginBottom:4}}>{["","⭐","⭐⭐","⭐⭐⭐"][stars]}</div>
      <div className="out" style={{fontSize:20,fontWeight:800,color:"var(--gold)",marginBottom:24}}>+{xp} XP</div>
      <button className="btn1" onClick={function(){p.done(modeKey,{time:finalTime,moves:moves},xp);}}>Collect XP</button>
    </div>);
  }

// ── PLAY ──
  return(<div style={{padding:"12px",height:"100vh",display:"flex",flexDirection:"column"}}>
    <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12}}>
      <div/>
      <div style={{display:"flex",gap:16,alignItems:"center"}}>
        <span className="out" style={{fontSize:16,fontWeight:800,color:"var(--cyan)",fontVariantNumeric:"tabular-nums"}}>{elapsed}s</span>
        <span style={{fontSize:12,color:"var(--t3)"}}>{moves} moves</span>
      </div>
      <span style={{fontSize:12,color:"var(--t2)"}}>{matched.length}/{pairCount}</span>
    </div>
    <div style={{width:"100%",height:4,background:"var(--bg3)",borderRadius:2,marginBottom:20,overflow:"hidden"}}>
      <div style={{height:"100%",width:Math.round(matched.length/pairCount*100)+"%",background:"linear-gradient(90deg,#d4943a,#8b5e83)",borderRadius:2,transition:"width .3s"}}/></div>

    <div style={{display:"grid",gridTemplateColumns:"repeat("+cols+",1fr)",gridTemplateRows:"repeat("+rows+",1fr)",gap:6,flex:1}}>
      {pairs.map(function(tile){
        var isRevealed=revealed.indexOf(tile.id)!==-1;
        var isMatched=matched.indexOf(tile.pairId)!==-1;
        var bgColor=isMatched?"rgba(0,230,118,.18)":isRevealed?(tile.type==="word"?"rgba(212,148,58,.2)":"rgba(139,94,131,.2)"):"var(--bg3)";
        var borderColor=isMatched?"var(--green)":isRevealed?(tile.type==="word"?"var(--cyan)":"var(--purple)"):"var(--bdr)";
        if(lastWrong&&isRevealed)borderColor="var(--red)";

        return(<div key={tile.id} onClick={function(){tapTile(tile.id);}}
          style={{
            minHeight:p.mode==="hard"?68:78,display:"flex",alignItems:"center",justifyContent:"center",
            background:isMatched?"rgba(0,230,118,.15)":bgColor,
            border:"1.5px solid "+borderColor,borderRadius:14,cursor:isMatched?"default":"pointer",
            opacity:isMatched?.4:1,transition:"all .25s",padding:"8px 6px",
            transform:isRevealed&&!isMatched?"scale(1.04)":"scale(1)"
          }}>
          {(isRevealed||isMatched)?(<span className="out" style={{
            fontSize:tile.type==="word"?14:11,fontWeight:tile.type==="word"?800:500,
            color:isMatched?"#059669":tile.type==="word"?"var(--cyan)":"var(--t1)",
            textAlign:"center",lineHeight:1.35,wordBreak:"break-word"
          }}>{tile.content}</span>):(<span style={{fontSize:22,opacity:.25}}>?</span>)}
        </div>);
      })}
    </div>
    <button className="btn2" onClick={p.back} style={{marginTop:8,width:"100%",flexShrink:0}}>Back</button>
  </div>);
}

// ─── WORD FALL ───
function WordFall(p){
  var allQs=useMemo(function(){return shuffle(QUESTIONS);},[]);
  var MAX_LIVES=3;
  var SPEED_TIERS=[
    {from:0,dur:8000},
    {from:5,dur:6000},
    {from:10,dur:4500},
    {from:15,dur:3500},
  ];

  var[qi,setQi]=useState(0);
  var[lives,setLives]=useState(MAX_LIVES);
  var[score,setScore]=useState(0);
  var[combo,setCombo]=useState(0);
  var[maxCombo,setMaxCombo]=useState(0);
  var[phase,setPhase]=useState("intro");
  //var[fallPct,setFallPct]=useState(0);
  var[feedback,setFeedback]=useState(null); // {type:"ok"|"miss",text:""}
  var[shake,setShake]=useState(false);
  var[dangerZone,setDangerZone]=useState(false);
  var fallRef=useRef(null);
  var startRef=useRef(null);
  var durRef=useRef(8000);
  var answeredRef=useRef(false);
  var falDivRef = useRef(null);
var progressBarRef = useRef(null);

  function getDuration(idx){
    var d=SPEED_TIERS[0].dur;
    for(var i=SPEED_TIERS.length-1;i>=0;i--){
      if(idx>=SPEED_TIERS[i].from){d=SPEED_TIERS[i].dur;break;}
    }
    return d;
  }

  function startFall(){
  answeredRef.current = false;
  durRef.current = getDuration(qi);
  startRef.current = Date.now();
  if(falDivRef.current) falDivRef.current.style.top = "0%";
  if(progressBarRef.current) progressBarRef.current.style.height = "0%";
  setFeedback(null);
  fallRef.current = requestAnimationFrame(animateFall);
}

function animateFall(){
  if(answeredRef.current)return;
  var elapsed = Date.now() - startRef.current;
  var pct = Math.min(elapsed / durRef.current, 1);
  // ← Direct DOM, pas de setState
  if(falDivRef.current) falDivRef.current.style.top = Math.round(pct * 80) + "%";
  if(pct >= 0.7 && !dangerZone) setDangerZone(true);
  if(progressBarRef.current) progressBarRef.current.style.height = Math.round(pct * 100) + "%";
  if(pct >= 1){
    answeredRef.current = true;
    handleMiss();
  } else {
    fallRef.current = requestAnimationFrame(animateFall);
  }
}

  function handleAnswer(i){
    if(answeredRef.current||phase!=="play")return;
    answeredRef.current=true;
    cancelAnimationFrame(fallRef.current);
    var q=allQs[qi];
    if(i===q.c){
      var newCombo=combo+1;
      setCombo(newCombo);
      if(newCombo>maxCombo)setMaxCombo(newCombo);
      var mult=newCombo>=6?3:newCombo>=3?2:1;
      setScore(score+mult);
      try{playCorrect();}catch(e){}
      setFeedback({type:"ok",text:mult>1?"x"+mult+" COMBO!":"Correct!"});
      setTimeout(nextQuestion,600);
    } else {
      handleMiss();
    }
  }

  function handleMiss(){
    var newLives=lives-1;
    setLives(newLives);
    setCombo(0);
    try{playWrong();}catch(e){}
    setShake(true);
    setTimeout(function(){setShake(false);},400);
    var q=allQs[qi];
    setFeedback({type:"miss",text:q.x||"The answer was: "+q.o[q.c]});
    if(newLives<=0){
      setTimeout(function(){setPhase("done");},1500);
    } else {
      setTimeout(nextQuestion,1500);
    }
  }

  function nextQuestion(){
  setQi(function(prev){
    var next = prev + 1;
    if(next >= allQs.length){ setPhase("done"); return prev; }
    setFeedback(null);
    answeredRef.current = false;
    durRef.current = getDuration(next);
    startRef.current = Date.now();
    if(falDivRef.current) falDivRef.current.style.top = "0%";
  setDangerZone(false);
    if(progressBarRef.current) progressBarRef.current.style.height = "0%";
    fallRef.current = requestAnimationFrame(animateFall);
    return next;
  });
}

  // Cleanup
  useEffect(function(){return function(){cancelAnimationFrame(fallRef.current);};}, []);

  // ── INTRO ──
  if(phase==="intro")return(<div className="enter" style={{padding:"20px 16px",minHeight:"100vh",display:"flex",flexDirection:"column",justifyContent:"center",textAlign:"center"}}>
    <div style={{fontSize:56,marginBottom:16}}>⬇️</div>
    <h1 className="out" style={{fontWeight:900,fontSize:26,marginBottom:8}}>Word Fall</h1>
    <p style={{color:"var(--t2)",fontSize:13,marginBottom:8,lineHeight:1.6}}>Sentences fall from the sky.<br/>Tap the correct answer before they hit the ground!</p>
    <div style={{display:"flex",justifyContent:"center",gap:16,marginBottom:8}}>
      <span style={{fontSize:13,color:"var(--red)"}}>♥♥♥ 3 lives</span>
      <span style={{fontSize:13,color:"var(--orange)"}}>Gets faster!</span>
    </div>
    <div className="crd" style={{padding:12,marginBottom:24,textAlign:"left"}}>
      <div style={{fontSize:11,color:"var(--t3)",lineHeight:1.7}}>
        <div>• Q1-5: 8 seconds per question</div>
        <div>• Q6-10: 6 seconds</div>
        <div>• Q11-15: 4.5 seconds</div>
        <div>• Q16+: 3.5 seconds — survival mode!</div>
        <div style={{marginTop:6,color:"var(--gold)"}}>• Build combos for bonus XP!</div>
      </div>
    </div>
    <button className="btn1" onClick={function(){setPhase("play");setTimeout(startFall,300);}}>Start!</button>
    <button className="btn2" onClick={p.back} style={{marginTop:12,width:"100%"}}>Back</button></div>);

  // ── DONE ──
  if(phase==="done"){
    var xp=score*8+(maxCombo>=6?30:maxCombo>=3?15:0);
    var grade=score>=20?"Legendary!":score>=12?"Great run!":score>=6?"Not bad!":"Keep practicing!";
    var gradeIcon=score>=20?"👑":score>=12?"⚔️":score>=6?"🛡️":"📖";
    var prev=p.u.gameScores&&p.u.gameScores.wordFall;
    var isRecord=!prev||score>prev.score;

    return(<div className="enter" style={{padding:"20px 16px",minHeight:"100vh",display:"flex",flexDirection:"column",justifyContent:"center",textAlign:"center"}}>
      <div style={{fontSize:56,marginBottom:12,animation:"countUp .6s"}}>{gradeIcon}</div>
      <h1 className="out" style={{fontWeight:900,fontSize:28,marginBottom:8}}>{grade}</h1>
      {isRecord&&<div style={{fontSize:14,color:"var(--gold)",fontWeight:700,marginBottom:8,animation:"pulse 1s infinite"}}>🏅 NEW RECORD!</div>}
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:8,marginBottom:20,maxWidth:320,margin:"0 auto 20px"}}>
        <div className="crd" style={{padding:12,textAlign:"center"}}><div className="out" style={{fontSize:24,fontWeight:800,color:"var(--cyan)"}}>{score}</div><div style={{fontSize:10,color:"var(--t3)"}}>Score</div></div>
        <div className="crd" style={{padding:12,textAlign:"center"}}><div className="out" style={{fontSize:24,fontWeight:800,color:"var(--orange)"}}>{qi+1}</div><div style={{fontSize:10,color:"var(--t3)"}}>Questions</div></div>
        <div className="crd" style={{padding:12,textAlign:"center"}}><div className="out" style={{fontSize:24,fontWeight:800,color:"var(--purple)"}}>{maxCombo>1?"x"+maxCombo:"—"}</div><div style={{fontSize:10,color:"var(--t3)"}}>Max combo</div></div>
      </div>
      <div className="out" style={{fontSize:20,fontWeight:800,color:"var(--gold)",marginBottom:24}}>+{xp} XP</div>
      <button className="btn1" onClick={function(){p.done("wordFall",{score:score,maxCombo:maxCombo,questions:qi+1},xp);}}>Collect XP</button>
    </div>);
  }

  // ── PLAY ──
  var q=allQs[qi];
  var tierLabel=qi>=15?"SURVIVAL":qi>=10?"FAST":qi>=5?"MEDIUM":"WARM-UP";
  var tierCol=qi>=15?"var(--red)":qi>=10?"var(--orange)":qi>=5?"var(--cyan)":"var(--green)";
  var comboMult=combo>=6?3:combo>=3?2:1;

  return(<div className={shake?"sk":""} style={{height:"100vh",display:"flex",flexDirection:"column",background:"var(--bg)",overflow:"hidden"}}>
    {/* Header */}
    <div style={{padding:"12px 16px 0",flexShrink:0}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:8}}>
        <div style={{display:"flex",gap:4}}>
          {[0,1,2].map(function(i){return(<span key={i} style={{fontSize:20,transition:"all .3s",opacity:i<lives?1:.15,transform:i>=lives?"scale(0.7)":"scale(1)"}}>{i<lives?"❤️":"🖤"}</span>);})}
        </div>
        <div style={{textAlign:"center"}}>
          {comboMult>1&&<div className="out" style={{fontSize:11,fontWeight:800,color:"var(--gold)",animation:"pulse .6s infinite"}}>COMBO x{comboMult} 🔥</div>}
          <span style={{fontSize:10,color:tierCol,fontWeight:700,textTransform:"uppercase",letterSpacing:1}} className="out">{tierLabel}</span>
        </div>
        <div className="out" style={{fontSize:20,fontWeight:800,color:"var(--cyan)"}}>{score}</div>
      </div>
    </div>

    {/* Fall zone */}
    <div style={{flex:1,position:"relative",padding:"0 16px",display:"flex",flexDirection:"column",justifyContent:"flex-start",overflow:"hidden"}}>
      {/* The falling sentence */}
      <div ref={falDivRef} style={{
  position:"absolute",left:16,right:16,
  top:"0%",
  opacity:feedback?0:1,
}}>
        <div className="crd" style={{
          padding:"16px 20px",textAlign:"center",
          borderColor:dangerZone?"rgba(255,71,87,.4)":"var(--bdr)",
          background:dangerZone?"rgba(255,71,87,.06)":"var(--bg2)",
          transition:"border-color .3s, background .3s",
        }}>
          <span style={{fontSize:10,color:"var(--purple)",fontWeight:700,textTransform:"uppercase",letterSpacing:1,display:"block",marginBottom:6}} className="out">{q.cat}</span>
          <span className="out" style={{fontSize:16,fontWeight:700,lineHeight:1.5,color:"var(--t1)"}}>{q.s}</span>
        </div>
      </div>

      {/* Feedback overlay */}
      {feedback&&<div style={{position:"absolute",left:16,right:16,top:"30%",textAlign:"center",animation:"fadeIn .2s",zIndex:5}}>
        {feedback.type==="ok"?(<div>
          <div style={{fontSize:48,marginBottom:8}}>✅</div>
          <div className="out" style={{fontSize:18,fontWeight:800,color:comboMult>1?"var(--gold)":"var(--green)"}}>{feedback.text}</div>
        </div>):(<div>
          <div style={{fontSize:48,marginBottom:8}}>💥</div>
          <div className="crd" style={{padding:12,background:"rgba(255,71,87,.08)",borderColor:"rgba(255,71,87,.2)"}}>
            <p style={{fontSize:12,color:"var(--t2)",lineHeight:1.5}}>{feedback.text}</p>
          </div>
        </div>)}
      </div>}

      {/* Fall progress bar (right side) */}
      <div style={{position:"absolute",right:4,top:16,bottom:16,width:3,background:"var(--bg3)",borderRadius:2}}>
        <div ref={progressBarRef} style={{position:"absolute",top:0,width:"100%",height:"0%",background:dangerZone?"var(--red)":"var(--cyan)",borderRadius:2}}/>
      </div>
    </div>

    {/* Answer buttons — fixed 2x2 grid at bottom */}
    <div style={{padding:"12px 16px 24px",flexShrink:0}}>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
        {q.o.map(function(opt,i){
          var isDisabled=!!feedback;
          return(<button key={qi+"-"+i} onClick={function(){handleAnswer(i);}} disabled={isDisabled}
            style={{
              padding:"16px 12px",background:"var(--bg2)",border:"1.5px solid var(--bdr)",
              borderRadius:14,cursor:isDisabled?"default":"pointer",fontSize:15,fontWeight:600,
              color:"var(--t1)",fontFamily:"'DM Sans',sans-serif",
              transition:"all .15s",textAlign:"center",minHeight:54,
              opacity:isDisabled?.5:1,
            }}>
            <span style={{fontSize:11,color:"var(--t3)",display:"block",marginBottom:2}}>{String.fromCharCode(65+i)}</span>
            {opt}
          </button>);
        })}
      </div>
    </div>
  </div>);
}


// ═══════════════════════════════════════════════════════════════
// TeacherDash v2.0 — Stats avancées + Export CSV
// REPLACES the existing TeacherDash function (lines 3124-3250)
// ═══════════════════════════════════════════════════════════════

function TeacherDash(p){
  function fmtTime(sec){
    if(!sec||sec<60)return"<1m";
    var h=Math.floor(sec/3600);var m=Math.floor((sec%3600)/60);
    return h>0?h+"h"+String(m).padStart(2,"0"):m+"m";
  }
  var[students,setStudents]=useState([]);var[loading,setLoad]=useState(true);
  var[detail,setDetail]=useState(null);var[classCode,setClassCode]=useState(function(){try{return localStorage.getItem('toeic-dash-group')||"idrac2026";}catch(e){return"idrac2026";}});
  var[dashTab,setDashTab]=useState("overview"); // "overview" | "analytics"
  var[chartMod,setChartMod]=useState("all"); // for student detail time chart
  var[groups,setGroups]=useState([]);
  var[dashPhase,setDashPhase]=useState("picker"); // "picker" | "dashboard"
  var[dashEvents,setDashEvents]=useState([]);var[evForm,setEvForm]=useState({type:"spotlight",title:"",desc:"",module:"drill",multiplier:2,hours:24,classTarget:"all"});var[evSaving,setEvSaving]=useState(false);var[evPushResult,setEvPushResult]=useState(null);

  function loadEvents(){
    supabase.from('events').select('*').order('start_at',{ascending:false}).limit(20)
      .then(function(res){if(res.data)setDashEvents(res.data);});
  }
  async function sendEventPush(title,body,targetClass){
    try{
      // 1. Fetch subscriptions from Supabase
      var query=supabase.from('push_subscriptions').select('subscription,student_name,class_code');
      if(targetClass&&targetClass!=='all')query=query.eq('class_code',targetClass);
      var subRes=await query;
      var subs=(subRes.data||[]).map(function(s){return s.subscription;}).filter(Boolean);
      if(subs.length===0){setEvPushResult({error:"No push subscribers found",total:0});setTimeout(function(){setEvPushResult(null);},5000);return;}
      // 2. Call existing /api/push-send
      var res=await fetch('/api/push-send',{
        method:'POST',
        headers:{'Content-Type':'application/json','x-push-secret':PUSH_SECRET},
        body:JSON.stringify({subscriptions:subs,title:title,body:body,tag:'toeic-event'})
      });
      var data=await res.json();
      // 3. Clean stale subscriptions from Supabase
      var staleCount=0;
      if(data.errors){
        for(var i=0;i<data.errors.length;i++){
          if(data.errors[i].expired){
            var staleEndpoint=data.errors[i].endpoint;
            var staleSub=subRes.data.find(function(s){return s.subscription&&s.subscription.endpoint===staleEndpoint;});
            if(staleSub){
              await supabase.from('push_subscriptions').delete().eq('student_name',staleSub.student_name).eq('class_code',staleSub.class_code);
              staleCount++;
            }
          }
        }
      }
      setEvPushResult({sent:data.sent||0,total:subs.length,staleCount:staleCount});
      setTimeout(function(){setEvPushResult(null);},5000);
    }catch(e){console.log('Push failed:',e);setEvPushResult({error:"Push send failed"});setTimeout(function(){setEvPushResult(null);},5000);}
  }
  var[dashEvents,setDashEvents]=useState([]);var[evForm,setEvForm]=useState({type:"spotlight",title:"",desc:"",module:"drill",multiplier:2,hours:24,classTarget:"all"});var[evSaving,setEvSaving]=useState(false);var[evPushResult,setEvPushResult]=useState(null);

  function loadEvents(){
    supabase.from('events').select('*').order('start_at',{ascending:false}).limit(20)
      .then(function(res){if(res.data)setDashEvents(res.data);});
  }
  async function sendEventPush(title,body,targetClass){
    try{
      // 1. Fetch subscriptions from Supabase
      var query=supabase.from('push_subscriptions').select('subscription,student_name,class_code');
      if(targetClass&&targetClass!=='all')query=query.eq('class_code',targetClass);
      var subRes=await query;
      var subs=(subRes.data||[]).map(function(s){return s.subscription;}).filter(Boolean);
      if(subs.length===0){setEvPushResult({error:"No push subscribers found",total:0});setTimeout(function(){setEvPushResult(null);},5000);return;}
      // 2. Call existing /api/push-send
      var res=await fetch('/api/push-send',{
        method:'POST',
        headers:{'Content-Type':'application/json','x-push-secret':PUSH_SECRET},
        body:JSON.stringify({subscriptions:subs,title:title,body:body,tag:'toeic-event'})
      });
      var data=await res.json();
      // 3. Clean stale subscriptions from Supabase
      var staleCount=0;
      if(data.errors){
        for(var i=0;i<data.errors.length;i++){
          if(data.errors[i].expired){
            var staleEndpoint=data.errors[i].endpoint;
            var staleSub=subRes.data.find(function(s){return s.subscription&&s.subscription.endpoint===staleEndpoint;});
            if(staleSub){
              await supabase.from('push_subscriptions').delete().eq('student_name',staleSub.student_name).eq('class_code',staleSub.class_code);
              staleCount++;
            }
          }
        }
      }
      setEvPushResult({sent:data.sent||0,total:subs.length,staleCount:staleCount});
      setTimeout(function(){setEvPushResult(null);},5000);
    }catch(e){console.log('Push failed:',e);setEvPushResult({error:"Push send failed"});setTimeout(function(){setEvPushResult(null);},5000);}
  }

  function loadGroups(){
    supabase.from('groups').select('*').order('type',{ascending:true}).order('name',{ascending:true})
      .then(function(res){if(res.data)setGroups(res.data);});
  }
  useEffect(function(){loadGroups();loadEvents();},[]);

  function loadStudents(){
    supabase.from('students').select('*').eq('class_code',classCode).order('xp',{ascending:false}).limit(200)
      .then(function(res){setStudents(res.data||[]);setLoad(false);})
      .catch(function(){setLoad(false);});
  }
  useEffect(function(){loadStudents();},[classCode])

  // ── Chart colors matching app theme ──
  var CHART_COLORS=["#d4943a","#8b5e83","#c87a35","#f0c850","#4abe60","#e05252","#c4587a","#5a7a9a","#2a9a8a","#d4943a","#7a5a80","#3a9080"];

  // ── Compute class-wide module accuracy data ──
  function getClassModuleData(){
    var modData={};
    MISSION_MODULES.forEach(function(m){modData[m.id]={name:m.name,icon:m.icon,totalCorrect:0,totalQ:0,studentCount:0};});
    students.forEach(function(s){
      var ms=s.module_scores||s.moduleScores||{};
      MISSION_MODULES.forEach(function(m){
        var d=ms[m.id];
        if(d&&d.total>0){
          modData[m.id].totalCorrect+=d.correct;
          modData[m.id].totalQ+=d.total;
          modData[m.id].studentCount+=1;
        }
      });
    });
    return MISSION_MODULES.map(function(m){
      var d=modData[m.id];
      var acc=d.totalQ>0?Math.round(d.totalCorrect/d.totalQ*100):0;
      return{name:m.name.length>12?m.name.substring(0,11)+"…":m.name,fullName:m.name,icon:m.icon,accuracy:acc,students:d.studentCount,questions:d.totalQ,id:m.id};
    }).filter(function(d){return d.questions>0;});
  }

  // ── Build time-series data for a student ──
  function getStudentTimeline(s,modFilter){
    var ms=s.module_scores||s.moduleScores||{};
    var allEntries=[];
    
    if(modFilter==="all"){
      // Aggregate all modules
      Object.keys(ms).forEach(function(modId){
        var hist=(ms[modId]&&ms[modId].history)||[];
        hist.forEach(function(h){allEntries.push({date:h.date,correct:h.correct,total:h.total});});
      });
    } else {
      var hist=(ms[modFilter]&&ms[modFilter].history)||[];
      hist.forEach(function(h){allEntries.push({date:h.date,correct:h.correct,total:h.total});});
    }
    
    if(allEntries.length===0)return[];
    
    // Group by date, compute daily accuracy
    var byDate={};
    allEntries.forEach(function(e){
      if(!byDate[e.date])byDate[e.date]={correct:0,total:0};
      byDate[e.date].correct+=e.correct;
      byDate[e.date].total+=e.total;
    });
    
    var timeline=Object.keys(byDate).sort().map(function(date){
      var d=byDate[date];
      return{date:date.substring(5),fullDate:date,accuracy:d.total>0?Math.round(d.correct/d.total*100):0,questions:d.total};
    });
    
    return timeline;
  }

  // ── CSV Export ──
  function exportCSV(){
    var headers=["Name","XP","Level","League","Streak","Sessions","Time (min)","Total Questions","Correct","Accuracy %"];
    MISSION_MODULES.forEach(function(m){headers.push(m.name+" (%)");});
    
    var rows=students.map(function(s){
      var stats=s.stats||{totalQ:0,correct:0,sessions:0};
      var acc=stats.totalQ>0?Math.round(stats.correct/stats.totalQ*100):0;
      var lvl=getLevel(s.xp||0);
      var lg=LEAGUES.slice().reverse().find(function(l){return(s.xp||0)>=l.min;});
      
      var row=[
        '"'+s.name+'"',s.xp||0,lvl.level,lg?lg.name:"Bronze",s.streak||0,
        stats.sessions,Math.round((s.total_time||0)/60),stats.totalQ,stats.correct,acc
      ];
      
      var ms=s.module_scores||s.moduleScores||{};
      MISSION_MODULES.forEach(function(m){
        var d=ms[m.id];
        var modAcc=d&&d.total>0?Math.round(d.correct/d.total*100):"—";
        row.push(modAcc);
      });
      
      return row.join(",");
    });
    
    var csv=headers.join(",")+"\n"+rows.join("\n");
    var blob=new Blob(["\ufeff"+csv],{type:"text/csv;charset=utf-8;"});
    var url=URL.createObjectURL(blob);
    var a=document.createElement("a");
    a.href=url;a.download="toeic_arena_class_"+classCode+"_"+today()+".csv";
    document.body.appendChild(a);a.click();document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  // ── Custom Recharts Tooltip ──
  function ChartTip(props){
    if(!props.active||!props.payload||!props.payload[0])return null;
    var data=props.payload[0].payload;
    return(<div style={{background:"var(--bg2)",border:"1px solid var(--bdr)",borderRadius:10,padding:"8px 12px",fontSize:12}}>
      <div className="out" style={{fontWeight:700,color:"var(--t1)",marginBottom:2}}>{data.fullName||data.fullDate||props.label}</div>
      {props.payload.map(function(entry,i){
        return(<div key={i} style={{color:entry.color||"var(--cyan)",fontSize:11}}>{entry.name}: {entry.value}{entry.name==="accuracy"||entry.dataKey==="accuracy"?"%":""}</div>);
      })}
      {data.questions!==undefined&&<div style={{color:"var(--t3)",fontSize:10,marginTop:2}}>{data.questions} questions{data.students!==undefined?" · "+data.students+" students":""}</div>}
    </div>);
  }

  if(loading)return(<div className="app" style={{display:"flex",alignItems:"center",justifyContent:"center",minHeight:"100vh"}}><p className="out" style={{color:"var(--t2)"}}>Loading dashboard...</p></div>);

  // ═══════════════════════════════════
  // STUDENT DETAIL VIEW
  // ═══════════════════════════════════
  if(detail!==null&&students[detail]){
    var s=students[detail];var acc=s.stats&&s.stats.totalQ>0?Math.round(s.stats.correct/s.stats.totalQ*100):0;
    var modules=s.module_scores||s.moduleScores||{};
    
    // Module accuracy data for bar chart
    var studentModData=MISSION_MODULES.map(function(m,i){
      var ms=modules[m.id];
      var modAcc=ms&&ms.total>0?Math.round(ms.correct/ms.total*100):0;
      return{name:m.name.length>10?m.name.substring(0,9)+"…":m.name,fullName:m.name,accuracy:modAcc,sessions:ms?ms.sessions:0,questions:ms?ms.total:0,color:CHART_COLORS[i%CHART_COLORS.length],id:m.id,hasData:!!(ms&&ms.total>0)};
    }).filter(function(d){return d.hasData;});
    
    // Timeline data
    var timeline=getStudentTimeline(s,chartMod);
    
    // Modules that have history (for filter dropdown)
    var modsWithHistory=MISSION_MODULES.filter(function(m){
      var ms=modules[m.id];
      return ms&&ms.history&&ms.history.length>0;
    });

    return(<div className="app enter" style={{padding:"20px 16px 40px"}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:20}}>
        <button onClick={function(){setDetail(null);setChartMod("all");}} style={{background:"none",border:"none",color:"var(--t2)",cursor:"pointer",fontSize:14}}>← Back</button>
        <span className="out" style={{fontWeight:700,fontSize:15}}>Student Detail</span>
        <div style={{width:40}}/>
      </div>

      {/* Student header */}
      <div style={{textAlign:"center",marginBottom:24}}>
        <div style={{width:56,height:56,borderRadius:"50%",background:"linear-gradient(135deg,#d4943a,#8b5e83)",display:"flex",alignItems:"center",justifyContent:"center",margin:"0 auto 10px",fontSize:24,fontWeight:900}} className="out">{s.name.charAt(0).toUpperCase()}</div>
        <h2 className="out" style={{fontWeight:800,fontSize:20}}>{s.name}</h2>
        <div style={{display:"flex",justifyContent:"center",gap:12,marginTop:6}}>
          <span style={{fontSize:12,color:"var(--t2)"}}>Level {getLevel(s.xp||0).level}</span>
          <span style={{fontSize:12,color:"var(--gold)"}}>{(LEAGUES.slice().reverse().find(function(l){return(s.xp||0)>=l.min;})||{name:"Bronze"}).name}</span>
          <span style={{fontSize:12,color:"var(--orange)"}}>{s.streak||0} streak</span>
        </div>
      </div>

      {/* KPI cards */}
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr 1fr",gap:8,marginBottom:20}}>
        <div className="crd" style={{padding:10,textAlign:"center"}}><div className="out" style={{fontSize:16,fontWeight:800,color:"var(--gold)"}}>{s.xp||0}</div><div style={{fontSize:10,color:"var(--t3)"}}>XP</div></div>
        <div className="crd" style={{padding:10,textAlign:"center"}}><div className="out" style={{fontSize:16,fontWeight:800,color:acc>=60?"var(--cyan)":"var(--orange)"}}>{acc}%</div><div style={{fontSize:10,color:"var(--t3)"}}>Accuracy</div></div>
        <div className="crd" style={{padding:10,textAlign:"center"}}><div className="out" style={{fontSize:16,fontWeight:800,color:"var(--purple)"}}>{s.stats?s.stats.sessions:0}</div><div style={{fontSize:10,color:"var(--t3)"}}>Sessions</div></div>
        <div className="crd" style={{padding:10,textAlign:"center"}}><div className="out" style={{fontSize:16,fontWeight:800,color:"var(--orange)"}}>{fmtTime(s.total_time||0)}</div><div style={{fontSize:10,color:"var(--t3)"}}>Time</div></div>
      </div>

      {/* ── BAR CHART: Accuracy per module ── */}
      {studentModData.length>0&&(<div className="crd" style={{padding:"16px 8px 8px",marginBottom:16}}>
        <h3 className="out" style={{fontWeight:700,fontSize:13,marginBottom:12,color:"var(--t2)",paddingLeft:8}}>📊 Accuracy by Module</h3>
        <ResponsiveContainer width="100%" height={Math.max(180,studentModData.length*32)}>
          <BarChart data={studentModData} layout="vertical" margin={{top:0,right:16,left:4,bottom:0}}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--bdr)" horizontal={false}/>
            <XAxis type="number" domain={[0,100]} tick={{fill:"var(--t3)",fontSize:10}} axisLine={{stroke:"var(--bdr)"}} tickLine={false}/>
            <YAxis type="category" dataKey="name" width={85} tick={{fill:"var(--t2)",fontSize:10}} axisLine={false} tickLine={false}/>
            <Tooltip content={ChartTip}/>
            <RBar dataKey="accuracy" radius={[0,6,6,0]} barSize={18}>
              {studentModData.map(function(entry,i){
                var col=entry.accuracy>=70?"#00e676":entry.accuracy>=50?"#ff8c42":"#ff4757";
                return(<Cell key={i} fill={col}/>);
              })}
            </RBar>
          </BarChart>
        </ResponsiveContainer>
      </div>)}

      {/* ── LINE CHART: Accuracy evolution over time ── */}
      {(timeline.length>1||modsWithHistory.length>0)&&(<div className="crd" style={{padding:"16px 8px 8px",marginBottom:16}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",paddingLeft:8,paddingRight:8,marginBottom:12}}>
          <h3 className="out" style={{fontWeight:700,fontSize:13,color:"var(--t2)",margin:0}}>📈 Evolution</h3>
          <select value={chartMod} onChange={function(e){setChartMod(e.target.value);}} 
            style={{background:"var(--bg3)",border:"1px solid var(--bdr)",borderRadius:8,color:"var(--t1)",fontSize:11,padding:"4px 8px",fontFamily:"'DM Sans',sans-serif"}}>
            <option value="all">All modules</option>
            {modsWithHistory.map(function(m){return(<option key={m.id} value={m.id}>{m.icon} {m.name}</option>);})}
          </select>
        </div>
        {timeline.length>1?(<ResponsiveContainer width="100%" height={200}>
          <LineChart data={timeline} margin={{top:5,right:16,left:4,bottom:5}}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--bdr)"/>
            <XAxis dataKey="date" tick={{fill:"var(--t3)",fontSize:9}} axisLine={{stroke:"var(--bdr)"}} tickLine={false}/>
            <YAxis domain={[0,100]} tick={{fill:"var(--t3)",fontSize:10}} axisLine={{stroke:"var(--bdr)"}} tickLine={false} width={30}/>
            <Tooltip content={ChartTip}/>
            <Line type="monotone" dataKey="accuracy" stroke="#d4943a" strokeWidth={2} dot={{fill:"#d4943a",r:4}} activeDot={{r:6,fill:"#8b5e83"}}/>
          </LineChart>
        </ResponsiveContainer>):(<div style={{textAlign:"center",padding:"20px 8px"}}><p style={{fontSize:12,color:"var(--t3)"}}>📉 Not enough data points yet. History builds from new sessions.</p></div>)}
      </div>)}

      {/* ── MODULE BREAKDOWN TABLE ── */}
      <h3 className="out" style={{fontWeight:700,fontSize:14,marginBottom:10,color:"var(--t2)"}}>Module Breakdown</h3>
      <div style={{display:"flex",flexDirection:"column",gap:6,marginBottom:16}}>
        {MISSION_MODULES.map(function(m){
          var ms=modules[m.id];
          if(!ms)return(<div key={m.id} className="crd" style={{padding:"10px 14px",display:"flex",alignItems:"center",gap:10,opacity:.4}}>
            <span style={{fontSize:16}}>{m.icon}</span><span style={{fontSize:13,color:"var(--t3)"}}>{m.name}</span>
            <span style={{marginLeft:"auto",fontSize:11,color:"var(--t3)"}}>Not started</span></div>);
          var modAcc=ms.total>0?Math.round(ms.correct/ms.total*100):0;
          var col=modAcc>=70?"var(--green)":modAcc>=50?"var(--orange)":"var(--red)";
          var histLen=(ms.history||[]).length;
          return(<div key={m.id} className="crd" style={{padding:"10px 14px",display:"flex",alignItems:"center",gap:10}}>
            <span style={{fontSize:16}}>{m.icon}</span>
            <div style={{flex:1,minWidth:0}}><div style={{fontSize:13,color:"var(--t1)"}} className="out">{m.name}</div>
              <div style={{fontSize:10,color:"var(--t3)"}}>{ms.sessions} sessions · Last: {ms.lastDate||"?"}{histLen>0?" · "+histLen+" data pts":""}</div></div>
            <div style={{textAlign:"right"}}><div className="out" style={{fontWeight:800,fontSize:15,color:col}}>{modAcc}%</div>
              <div style={{fontSize:10,color:"var(--t3)"}}>{ms.correct}/{ms.total}</div></div>
          </div>);
        })}
      </div>
      
      {/* Delete student */}
      <button className="btn2" onClick={function(){
        if(prompt("Type DELETE to confirm removing "+s.name)!=="DELETE")return;
        supabase.from('students').delete().eq('id',s.id).then(function(){
          setDetail(null);loadStudents();
        });
      }} style={{fontSize:12,color:"var(--red)",borderColor:"rgba(255,71,87,.2)",width:"100%",marginBottom:20}}>🗑️ Delete this student</button>
    </div>);
  }

  // ═══════════════════════════════════
  // MAIN DASHBOARD VIEW
  // ═══════════════════════════════════
  var classAcc=0;var totalSess=0;var activeCnt=0;var totalClassTime=0;
  students.forEach(function(s){
    if(s.stats&&s.stats.totalQ>0){classAcc+=s.stats.correct/s.stats.totalQ;activeCnt++;}
    totalSess+=(s.stats?s.stats.sessions:0);
    totalClassTime+=(s.total_time||0);
  });
  classAcc=activeCnt>0?Math.round(classAcc/activeCnt*100):0;

  // Class module data for analytics chart
  var classModData=getClassModuleData();

  // ─── PROMO PICKER PHASE ───
  if(dashPhase==="picker")return(<div className="app enter" style={{display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",minHeight:"100vh",padding:32}}>
    <div style={{width:"100%",maxWidth:380,animation:"fadeIn .5s"}}>
      <div style={{textAlign:"center",marginBottom:32}}>
        <div style={{fontSize:48,marginBottom:12}}>👨‍🏫</div>
        <h1 className="out" style={{fontWeight:800,fontSize:24,marginBottom:6}}>Teacher Dashboard</h1>
        <p style={{color:"var(--t2)",fontSize:13}}>Select a group to manage</p>
      </div>
      {groups.length===0&&<div style={{textAlign:"center",padding:20}}><p style={{color:"var(--t3)",fontSize:13}}>Loading groups...</p></div>}
      <div style={{display:"flex",flexDirection:"column",gap:10}}>
        {groups.map(function(g){
          var typeIcon=g.type==="school"?"🏫":g.type==="pro"?"💼":"🌍";
          var typeLabel=g.type==="school"?"School":g.type==="pro"?"Professional":"Visitor";
          return(<button key={g.code} onClick={function(){
            setClassCode(g.code);
            try{localStorage.setItem('toeic-dash-group',g.code);}catch(e){}
            setLoad(true);setDetail(null);setDashPhase("dashboard");
            supabase.from('students').select('*').eq('class_code',g.code).order('xp',{ascending:false}).limit(200)
              .then(function(res){setStudents(res.data||[]);setLoad(false);})
              .catch(function(){setLoad(false);});
          }} className="crd" style={{display:"flex",alignItems:"center",gap:16,padding:"18px 20px",cursor:"pointer",
            border:"1px solid var(--bdr)",background:"var(--bg2)",borderRadius:16,textAlign:"left",
            transition:"all .2s",fontFamily:"'DM Sans',sans-serif"}}>
            <div style={{width:48,height:48,borderRadius:14,
              background:g.type==="school"?"rgba(212,148,58,.1)":g.type==="pro"?"rgba(255,140,66,.1)":"rgba(139,94,131,.1)",
              display:"flex",alignItems:"center",justifyContent:"center",fontSize:24,flexShrink:0}}>{typeIcon}</div>
            <div style={{flex:1,minWidth:0}}>
              <div className="out" style={{fontWeight:700,fontSize:15,color:"var(--t1)",marginBottom:2}}>{g.name}</div>
              <div style={{fontSize:11,color:"var(--t3)"}}>{typeLabel} · {g.code}</div>
            </div>
            <div style={{color:"var(--t3)",fontSize:16}}>→</div>
          </button>);
        })}
      </div>
      <button onClick={p.back} style={{display:"block",margin:"28px auto 0",background:"none",border:"none",color:"var(--t3)",fontSize:13,cursor:"pointer"}}>← Exit</button>
    </div>
  </div>);

  // ─── DASHBOARD PHASE ───
  return(<div className="app enter" style={{padding:"20px 16px 40px"}}>
    <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:20}}>
      <button onClick={function(){setDashPhase("picker");}} style={{background:"none",border:"none",color:"var(--t2)",cursor:"pointer",fontSize:14}}>← Groups</button>
      <span className="out" style={{fontWeight:700,fontSize:15}}>Teacher Dashboard</span>
      <div style={{width:40}}/>
    </div>

    {/* ── Tab switcher ── */}
    <div style={{display:"flex",gap:4,marginBottom:16,background:"var(--bg2)",borderRadius:12,padding:3}}>
      {[{id:"overview",label:"👥 Students"},{id:"analytics",label:"📊 Analytics"},{id:"events",label:"🎪 Events"}].map(function(t){
        var active=dashTab===t.id;
        return(<button key={t.id} onClick={function(){setDashTab(t.id);}} style={{
          flex:1,padding:"10px 8px",borderRadius:10,border:"none",cursor:"pointer",
          background:active?"var(--bg3)":"transparent",color:active?"var(--t1)":"var(--t3)",
          fontWeight:active?700:500,fontSize:13,fontFamily:"'DM Sans',sans-serif",
          transition:"all .2s"
        }} className="out">{t.label}</button>);
      })}
    </div>

 {/* Current group indicator */}
    {function(){var g=groups.find(function(x){return x.code===classCode;});
      var typeIcon=g?(g.type==="school"?"🏫":g.type==="pro"?"💼":"🌍"):"📋";
      return(<div style={{display:"flex",alignItems:"center",gap:8,marginBottom:12,padding:"8px 14px",background:"rgba(212,148,58,.06)",borderRadius:12,border:"1px solid rgba(212,148,58,.12)"}}>
        <span style={{fontSize:16}}>{typeIcon}</span>
        <span className="out" style={{fontWeight:700,fontSize:13,color:"var(--cyan)",flex:1}}>{g?g.name:classCode}</span>
        <button onClick={function(){setDashPhase("picker");}} style={{background:"none",border:"none",color:"var(--t3)",fontSize:11,cursor:"pointer",fontFamily:"'DM Sans',sans-serif"}} className="out">Change ›</button>
      </div>);
    }()}

    {/* Class KPI cards */}
    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr 1fr",gap:8,marginBottom:16}}>
      <div className="crd" style={{padding:12,textAlign:"center"}}><div className="out" style={{fontSize:20,fontWeight:800,color:"var(--cyan)"}}>{students.length}</div><div style={{fontSize:10,color:"var(--t3)"}}>Students</div></div>
      <div className="crd" style={{padding:12,textAlign:"center"}}><div className="out" style={{fontSize:20,fontWeight:800,color:classAcc>=60?"var(--green)":"var(--orange)"}}>{classAcc}%</div><div style={{fontSize:10,color:"var(--t3)"}}>Accuracy</div></div>
      <div className="crd" style={{padding:12,textAlign:"center"}}><div className="out" style={{fontSize:20,fontWeight:800,color:"var(--purple)"}}>{totalSess}</div><div style={{fontSize:10,color:"var(--t3)"}}>Sessions</div></div>
      <div className="crd" style={{padding:12,textAlign:"center"}}><div className="out" style={{fontSize:20,fontWeight:800,color:"var(--orange)"}}>{fmtTime(totalClassTime)}</div><div style={{fontSize:10,color:"var(--t3)"}}>Total time</div></div>
    </div>

    {/* ═══ OVERVIEW TAB ═══ */}
    {dashTab==="overview"&&(<div>
      {/* Action buttons */}
      <div style={{display:"flex",gap:8,marginBottom:16}}>
        <button className="btn1" onClick={function(){setLoad(true);loadStudents();}} style={{flex:1,fontSize:13}}>🔄 Refresh</button>
        <button className="btn2" onClick={exportCSV} style={{flex:1,fontSize:13,borderColor:"rgba(212,148,58,.3)",color:"var(--cyan)"}}>📥 Export CSV</button>
      </div>

      {/* Student list */}
      <h3 className="out" style={{fontWeight:700,fontSize:14,marginBottom:10,color:"var(--t2)"}}>Students ({students.length})</h3>
      {students.length===0&&<div className="crd" style={{padding:20,textAlign:"center"}}>
        <p style={{color:"var(--t3)",fontSize:13}}>No students yet. Students appear automatically after onboarding.</p>
      </div>}
      <div style={{display:"flex",flexDirection:"column",gap:6}}>
        {students.sort(function(a,b){return(b.xp||0)-(a.xp||0);}).map(function(s,i){
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
      </div>

      {students.length>0&&<div style={{textAlign:"center",marginTop:20}}>
        <p style={{fontSize:11,color:"var(--t3)"}}>Data syncs automatically from student devices</p>
      </div>}
    </div>)}

    {/* ═══ ANALYTICS TAB ═══ */}
    {dashTab==="analytics"&&(<div>
      {/* Class-wide module accuracy bar chart */}
      {classModData.length>0?(<div className="crd" style={{padding:"16px 8px 8px",marginBottom:16}}>
        <h3 className="out" style={{fontWeight:700,fontSize:13,marginBottom:4,color:"var(--t2)",paddingLeft:8}}>📊 Class Accuracy by Module</h3>
        <p style={{fontSize:10,color:"var(--t3)",paddingLeft:8,marginBottom:12}}>Average accuracy across all students per module</p>
        <ResponsiveContainer width="100%" height={Math.max(200,classModData.length*34)}>
          <BarChart data={classModData} layout="vertical" margin={{top:0,right:20,left:4,bottom:0}}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--bdr)" horizontal={false}/>
            <XAxis type="number" domain={[0,100]} tick={{fill:"var(--t3)",fontSize:10}} axisLine={{stroke:"var(--bdr)"}} tickLine={false} unit="%"/>
            <YAxis type="category" dataKey="name" width={90} tick={{fill:"var(--t2)",fontSize:10}} axisLine={false} tickLine={false}/>
            <Tooltip content={ChartTip}/>
            <RBar dataKey="accuracy" radius={[0,8,8,0]} barSize={20}>
              {classModData.map(function(entry,i){
                var col=entry.accuracy>=70?"#00e676":entry.accuracy>=50?"#ff8c42":"#ff4757";
                return(<Cell key={i} fill={col}/>);
              })}
            </RBar>
          </BarChart>
        </ResponsiveContainer>
      </div>):(<div className="crd" style={{padding:24,textAlign:"center",marginBottom:16}}>
        <p style={{fontSize:13,color:"var(--t3)"}}>📊 Not enough data yet. Charts appear once students start training.</p>
      </div>)}

      {/* ── Weakest modules callout ── */}
      {classModData.length>2&&(<div className="crd" style={{padding:16,marginBottom:16,borderColor:"rgba(255,71,87,.15)"}}>
        <h3 className="out" style={{fontWeight:700,fontSize:13,marginBottom:10,color:"var(--red)"}}>⚠️ Needs Attention</h3>
        <div style={{display:"flex",flexDirection:"column",gap:6}}>
          {classModData.slice().sort(function(a,b){return a.accuracy-b.accuracy;}).slice(0,3).map(function(m,i){
            return(<div key={i} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"6px 0"}}>
              <span style={{fontSize:12,color:"var(--t2)"}}>{MISSION_MODULES.find(function(mm){return mm.id===m.id;})?MISSION_MODULES.find(function(mm){return mm.id===m.id;}).icon:""} {m.fullName}</span>
              <span className="out" style={{fontWeight:700,fontSize:13,color:m.accuracy>=50?"var(--orange)":"var(--red)"}}>{m.accuracy}%</span>
            </div>);
          })}
        </div>
        <p style={{fontSize:10,color:"var(--t3)",marginTop:8}}>These 3 modules have the lowest class accuracy — consider focused review sessions.</p>
      </div>)}

      {/* ── Top performers ── */}
      {students.length>2&&(<div className="crd" style={{padding:16,marginBottom:16}}>
        <h3 className="out" style={{fontWeight:700,fontSize:13,marginBottom:10,color:"var(--gold)"}}>🏆 Top Performers</h3>
        <div style={{display:"flex",flexDirection:"column",gap:6}}>
          {students.slice().sort(function(a,b){
            var aAcc=a.stats&&a.stats.totalQ>0?a.stats.correct/a.stats.totalQ:0;
            var bAcc=b.stats&&b.stats.totalQ>0?b.stats.correct/b.stats.totalQ:0;
            return bAcc-aAcc;
          }).slice(0,5).map(function(s,i){
            var sAcc=s.stats&&s.stats.totalQ>0?Math.round(s.stats.correct/s.stats.totalQ*100):0;
            var medal=i===0?"🥇":i===1?"🥈":i===2?"🥉":"";
            return(<div key={i} style={{display:"flex",alignItems:"center",gap:8,padding:"4px 0"}}>
              <span style={{fontSize:14,width:22,textAlign:"center"}}>{medal||"#"+(i+1)}</span>
              <span style={{flex:1,fontSize:13,color:"var(--t1)"}} className="out">{s.name}</span>
              <span className="out" style={{fontWeight:700,fontSize:13,color:sAcc>=70?"var(--green)":"var(--orange)"}}>{sAcc}%</span>
              <span style={{fontSize:10,color:"var(--t3)"}}>{s.stats?s.stats.sessions:0} sess</span>
            </div>);
          })}
        </div>
      </div>)}

      {/* ── Activity distribution ── */}
      {students.length>0&&(<div className="crd" style={{padding:16,marginBottom:16}}>
        <h3 className="out" style={{fontWeight:700,fontSize:13,marginBottom:10,color:"var(--cyan)"}}>📅 Student Activity</h3>
        <div style={{display:"flex",flexDirection:"column",gap:4}}>
          {students.sort(function(a,b){return(b.stats?b.stats.sessions:0)-(a.stats?a.stats.sessions:0);}).map(function(s,i){
            var sess=s.stats?s.stats.sessions:0;
            var maxSess=Math.max.apply(null,students.map(function(st){return st.stats?st.stats.sessions:0;}))||1;
            var pct=Math.round(sess/maxSess*100);
            return(<div key={i} style={{display:"flex",alignItems:"center",gap:8}}>
              <span style={{width:70,fontSize:11,color:"var(--t2)",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}} className="out">{s.name.split(" ")[0]}</span>
              <div style={{flex:1,height:14,background:"var(--bg3)",borderRadius:7,overflow:"hidden"}}>
                <div style={{height:"100%",width:pct+"%",background:"linear-gradient(90deg,#d4943a,#8b5e83)",borderRadius:7,transition:"width .4s ease"}}/>
              </div>
              <span style={{fontSize:10,color:"var(--t3)",width:40,textAlign:"right"}}>{sess} sess</span>
            </div>);
          })}
        </div>
      </div>)}

      {/* ── League History ── */}
      {function(){
        // Aggregate weekly history from all students
        var weekMap={};
        students.forEach(function(s){
          var hist=s.weekly_history||[];
          hist.forEach(function(h){
            if(!weekMap[h.week])weekMap[h.week]=[];
            weekMap[h.week].push({name:s.name,xp:h.xp});
          });
          // Also include current week if they have XP and week_id is current
          var currentWk=weekId();
          if((s.weekly_xp||0)>0&&s.week_id===currentWk){
            var cw=s.week_id;
            if(cw){
              if(!weekMap[cw])weekMap[cw]=[];
              // Avoid duplicates
              var exists=weekMap[cw].find(function(e){return e.name===s.name;});
              if(!exists)weekMap[cw].push({name:s.name,xp:s.weekly_xp});
            }
          }
        });

        var weeks=Object.keys(weekMap).sort().reverse();
        if(weeks.length===0)return(<div className="crd" style={{padding:20,textAlign:"center",marginBottom:16}}>
          <p style={{fontSize:13,color:"var(--t3)"}}>🏆 League history will appear after the first weekly reset.</p>
        </div>);

        return(<div style={{marginBottom:16}}>
          <h3 className="out" style={{fontWeight:700,fontSize:13,marginBottom:12,color:"var(--t2)"}}>🏆 League History — Top 10</h3>
          <div style={{display:"flex",flexDirection:"column",gap:12}}>
            {weeks.slice(0,8).map(function(wk){
              var ranking=weekMap[wk].slice().sort(function(a,b){return b.xp-a.xp;}).slice(0,10);
              var weekLabel=wk;
              // Parse week label: "2026-W11" → "Week 11 — Mar 2026"
              var wMatch=wk.match(/(\d{4})-W(\d+)/);
              if(wMatch){
                var yr=parseInt(wMatch[1]);var wn=parseInt(wMatch[2]);
                var jan1=new Date(yr,0,1);var mondayMs=jan1.getTime()+((wn-1)*7-((jan1.getDay()+6)%7))*864e5;
                var mon=new Date(mondayMs);
                var months=["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
                weekLabel="Week "+wn+" — "+months[mon.getMonth()]+" "+mon.getDate();
              }
              var isCurrentWeek=wk===(students[0]&&students[0].week_id);

              return(<div key={wk} className="crd" style={{padding:14,borderColor:isCurrentWeek?"rgba(212,148,58,.2)":"var(--bdr)"}}>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10}}>
                  <span className="out" style={{fontWeight:700,fontSize:13,color:isCurrentWeek?"var(--cyan)":"var(--t1)"}}>{weekLabel}{isCurrentWeek?" (current)":""}</span>
                  <span style={{fontSize:11,color:"var(--t3)"}}>{weekMap[wk].length} students</span>
                </div>
                <div style={{display:"flex",flexDirection:"column",gap:4}}>
                  {ranking.map(function(r,i){
                    var medal=i===0?"🥇":i===1?"🥈":i===2?"🥉":null;
                    var lg=LEAGUES.slice().reverse().find(function(l){return r.xp>=l.min;})||LEAGUES[0];
                    return(<div key={i} style={{display:"flex",alignItems:"center",gap:8,padding:"4px 0"}}>
                      <span style={{width:20,textAlign:"center",fontSize:medal?14:11,fontWeight:700,color:medal?"var(--gold)":"var(--t3)"}}>{medal||i+1}</span>
                      <span style={{flex:1,fontSize:12,color:"var(--t1)"}}>{r.name}</span>
                      <span style={{fontSize:10,color:lg.color,fontWeight:600}}>{lg.icon}</span>
                      <span className="out" style={{fontSize:12,fontWeight:700,color:"var(--t2)",width:55,textAlign:"right"}}>{r.xp} XP</span>
                    </div>);
                  })}
                </div>
              </div>);
            })}
          </div>
        </div>);
      }()}

      {/* CSV export in analytics too */}
      <button className="btn2" onClick={exportCSV} style={{width:"100%",fontSize:13,borderColor:"rgba(212,148,58,.3)",color:"var(--cyan)",marginBottom:16}}>📥 Export class data (CSV)</button>
    </div>)}

    {/* ═══ EVENTS TAB ═══ */}
    {dashTab==="events"&&(<div>
      <h3 className="out" style={{fontWeight:700,fontSize:14,marginBottom:16,color:"var(--t2)"}}>🎪 Create Event</h3>
      <div className="crd" style={{padding:16,marginBottom:16}}>
        <div style={{marginBottom:12}}>
          <label className="out" style={{fontSize:11,fontWeight:600,color:"var(--t3)",display:"block",marginBottom:6}}>Type</label>
          <div style={{display:"flex",gap:6}}>
            {[{id:"spotlight",l:"🎯 Spotlight",c:"var(--cyan)"},{id:"flash_hour",l:"⚡ Flash Hour",c:"var(--gold)"},{id:"underdog",l:"💪 Underdog",c:"var(--green)"}].map(function(t){
              return(<button key={t.id} onClick={function(){setEvForm(function(f){return Object.assign({},f,{type:t.id});});}}
                style={{flex:1,padding:"10px 6px",borderRadius:10,border:"1px solid "+(evForm.type===t.id?t.c:"var(--bdr)"),
                  background:evForm.type===t.id?"rgba(212,148,58,.08)":"var(--bg3)",color:evForm.type===t.id?t.c:"var(--t3)",
                  fontSize:11,fontWeight:700,cursor:"pointer",fontFamily:"'DM Sans',sans-serif"}} className="out">{t.l}</button>);
            })}
          </div>
        </div>
        <div style={{marginBottom:12}}>
          <label className="out" style={{fontSize:11,fontWeight:600,color:"var(--t3)",display:"block",marginBottom:6}}>Title</label>
          <input value={evForm.title} onChange={function(e){setEvForm(function(f){return Object.assign({},f,{title:e.target.value});});}}
            placeholder={evForm.type==="spotlight"?"Part 5 Drill Weekend":evForm.type==="flash_hour"?"Friday Night Flash":"Underdog Boost"}
            style={{width:"100%",padding:"10px 14px",background:"var(--bg3)",border:"1px solid var(--bdr)",borderRadius:10,color:"var(--t1)",fontSize:14,fontFamily:"'DM Sans',sans-serif",outline:"none"}}/>
        </div>
        <div style={{marginBottom:12}}>
          <label className="out" style={{fontSize:11,fontWeight:600,color:"var(--t3)",display:"block",marginBottom:6}}>Description (shown to students + push notification)</label>
          <input value={evForm.desc} onChange={function(e){setEvForm(function(f){return Object.assign({},f,{desc:e.target.value});});}}
            placeholder="x2 XP on Part 5 all weekend!"
            style={{width:"100%",padding:"10px 14px",background:"var(--bg3)",border:"1px solid var(--bdr)",borderRadius:10,color:"var(--t1)",fontSize:14,fontFamily:"'DM Sans',sans-serif",outline:"none"}}/>
        </div>
        {evForm.type==="spotlight"&&<div style={{marginBottom:12}}>
          <label className="out" style={{fontSize:11,fontWeight:600,color:"var(--t3)",display:"block",marginBottom:6}}>Target Module</label>
          <select value={evForm.module} onChange={function(e){setEvForm(function(f){return Object.assign({},f,{module:e.target.value});});}}
            style={{width:"100%",padding:"10px 14px",background:"var(--bg3)",border:"1px solid var(--bdr)",borderRadius:10,color:"var(--t1)",fontSize:14,fontFamily:"'DM Sans',sans-serif"}}>
            {MISSION_MODULES.map(function(m){return(<option key={m.id} value={m.id}>{m.icon} {m.name}</option>);})}
          </select>
        </div>}
        <div style={{display:"flex",gap:12,marginBottom:12}}>
          <div style={{flex:1}}>
            <label className="out" style={{fontSize:11,fontWeight:600,color:"var(--t3)",display:"block",marginBottom:6}}>Multiplier</label>
            <select value={evForm.multiplier} onChange={function(e){setEvForm(function(f){return Object.assign({},f,{multiplier:parseInt(e.target.value)});});}}
              style={{width:"100%",padding:"10px 14px",background:"var(--bg3)",border:"1px solid var(--bdr)",borderRadius:10,color:"var(--t1)",fontSize:14,fontFamily:"'DM Sans',sans-serif"}}>
              <option value={2}>x2</option><option value={3}>x3</option><option value={4}>x4</option><option value={5}>x5</option>
            </select>
          </div>
          <div style={{flex:1}}>
            <label className="out" style={{fontSize:11,fontWeight:600,color:"var(--t3)",display:"block",marginBottom:6}}>Duration</label>
            <select value={evForm.hours} onChange={function(e){setEvForm(function(f){return Object.assign({},f,{hours:parseInt(e.target.value)});});}}
              style={{width:"100%",padding:"10px 14px",background:"var(--bg3)",border:"1px solid var(--bdr)",borderRadius:10,color:"var(--t1)",fontSize:14,fontFamily:"'DM Sans',sans-serif"}}>
              <option value={1}>1 hour</option><option value={2}>2 hours</option><option value={4}>4 hours</option>
              <option value={12}>12 hours</option><option value={24}>24 hours</option><option value={48}>48 hours</option><option value={72}>3 days</option><option value={168}>7 days</option>
            </select>
          </div>
        </div>
        <div style={{marginBottom:16}}>
          <label className="out" style={{fontSize:11,fontWeight:600,color:"var(--t3)",display:"block",marginBottom:6}}>Target group</label>
          <select value={evForm.classTarget} onChange={function(e){setEvForm(function(f){return Object.assign({},f,{classTarget:e.target.value});});}}
            style={{width:"100%",padding:"10px 14px",background:"var(--bg3)",border:"1px solid var(--bdr)",borderRadius:10,color:"var(--t1)",fontSize:14,fontFamily:"'DM Sans',sans-serif"}}>
            <option value="all">All groups</option>
            {groups.map(function(g){return(<option key={g.code} value={g.code}>{g.name} ({g.code})</option>);})}
          </select>
        </div>
        <button className="btn1" disabled={evSaving||!evForm.title.trim()} onClick={async function(){
          setEvSaving(true);setEvPushResult(null);
          var startAt=new Date().toISOString();
          var endAt=new Date(Date.now()+evForm.hours*36e5).toISOString();
          var config={multiplier:evForm.multiplier};
          if(evForm.type==="spotlight")config.module=evForm.module;
          var ins={type:evForm.type,title:evForm.title.trim(),description:evForm.desc.trim()||null,
            start_at:startAt,end_at:endAt,config:config,class_code:evForm.classTarget,active:true};
          var res=await supabase.from('events').insert(ins);
          if(!res.error){
            var icon=evForm.type==="spotlight"?"🎯":evForm.type==="flash_hour"?"⚡":"💪";
            var pushTitle=icon+" "+evForm.title.trim();
            var pushBody=evForm.desc.trim()||(evForm.type==="spotlight"?"x"+evForm.multiplier+" XP on "+evForm.module+" — go train!":evForm.type==="flash_hour"?"x"+evForm.multiplier+" XP on everything for "+evForm.hours+"h!":"x"+evForm.multiplier+" XP boost for those catching up!");
            sendEventPush(pushTitle,pushBody,evForm.classTarget);
            setEvForm({type:"spotlight",title:"",desc:"",module:"drill",multiplier:2,hours:24,classTarget:"all"});
            loadEvents();
          }
          setEvSaving(false);
        }} style={{opacity:evForm.title.trim()&&!evSaving?1:.4}}>
          {evSaving?"Creating...":"🎪 Launch Event + Notify Students"}</button>
        {evPushResult&&<div style={{marginTop:12,padding:10,background:evPushResult.error?"rgba(224,82,82,.08)":"rgba(74,190,96,.08)",border:"1px solid "+(evPushResult.error?"rgba(224,82,82,.2)":"rgba(74,190,96,.2)"),borderRadius:10,fontSize:12,color:evPushResult.error?"var(--red)":"var(--green)"}}>
          {evPushResult.error?("⚠️ "+evPushResult.error):("📬 Push sent to "+evPushResult.sent+"/"+evPushResult.total+" students"+(evPushResult.staleCount>0?" ("+evPushResult.staleCount+" expired cleaned)":""))}</div>}
      </div>
      <h3 className="out" style={{fontWeight:700,fontSize:14,marginBottom:12,color:"var(--t2)"}}>Event History</h3>
      {dashEvents.length===0&&<div className="crd" style={{padding:20,textAlign:"center"}}><p style={{fontSize:13,color:"var(--t3)"}}>No events yet. Create your first one above!</p></div>}
      <div style={{display:"flex",flexDirection:"column",gap:8}}>
        {dashEvents.map(function(ev){
          var now=new Date();var isActive=ev.active&&new Date(ev.start_at)<=now&&new Date(ev.end_at)>=now;
          var isPast=new Date(ev.end_at)<now;
          var icon=ev.type==="spotlight"?"🎯":ev.type==="flash_hour"?"⚡":"💪";
          var cfg=ev.config||{};
          return(<div key={ev.id} className="crd" style={{padding:14,opacity:isPast?.5:1,borderColor:isActive?"rgba(212,148,58,.3)":"var(--bdr)"}}>
            <div style={{display:"flex",alignItems:"center",gap:10}}>
              <span style={{fontSize:20}}>{icon}</span>
              <div style={{flex:1}}>
                <div className="out" style={{fontWeight:700,fontSize:13,color:isActive?"var(--cyan)":"var(--t2)"}}>{ev.title}{isActive&&<span style={{fontSize:10,color:"var(--green)",marginLeft:8}}>● LIVE</span>}</div>
                <div style={{fontSize:10,color:"var(--t3)"}}>{ev.type} · x{cfg.multiplier||2} · {ev.class_code==="all"?"All groups":ev.class_code}{cfg.module?" · "+cfg.module:""}</div>
                <div style={{fontSize:10,color:"var(--t3)"}}>{new Date(ev.start_at).toLocaleDateString()} → {new Date(ev.end_at).toLocaleDateString()}</div>
              </div>
              <div style={{display:"flex",gap:6}}>
                {isActive&&<button onClick={async function(){
                  var ic=ev.type==="spotlight"?"🎯":ev.type==="flash_hour"?"⚡":"💪";
                  sendEventPush(ic+" Reminder: "+ev.title,ev.description||"Event still active!",ev.class_code);
                }} style={{background:"none",border:"1px solid var(--cyan)",borderRadius:8,padding:"4px 8px",fontSize:10,color:"var(--cyan)",cursor:"pointer",fontFamily:"'DM Sans',sans-serif"}}>📬</button>}
                {isActive&&<button onClick={async function(){
                  await supabase.from('events').update({active:false}).eq('id',ev.id);
                  loadEvents();
                }} style={{background:"none",border:"1px solid var(--red)",borderRadius:8,padding:"4px 8px",fontSize:10,color:"var(--red)",cursor:"pointer",fontFamily:"'DM Sans',sans-serif"}}>Stop</button>}
              </div>
            </div>
          </div>);
        })}
      </div>
    </div>)}

  </div>);
}
// ─── LISTENING HUB ───
function ListenHub(p){
  return(<div className="enter" style={{padding:"20px 16px",minHeight:"100vh",display:"flex",flexDirection:"column",justifyContent:"center",textAlign:"center"}}>
    <div style={{fontSize:56,marginBottom:16}}>👂</div>
    <h1 className="out" style={{fontWeight:900,fontSize:26,marginBottom:8}}>Listening Practice</h1>
    <p style={{color:"var(--t2)",fontSize:13,marginBottom:32,lineHeight:1.6}}>Train your ear for the TOEIC Listening section</p>
    <div style={{display:"flex",flexDirection:"column",gap:12,textAlign:"left"}}>
      <div className="crd" onClick={function(){p.nav("lisP1");}} style={{cursor:"pointer",display:"flex",alignItems:"center",gap:14,padding:"14px 16px"}}>
        <div style={{width:42,height:42,borderRadius:12,background:"linear-gradient(135deg,#22c55e,#06b6d4)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:20,flexShrink:0}}>🖼️</div>
        <div style={{flex:1}}><div className="out" style={{fontWeight:700,fontSize:14}}>Part 1 — Photographs</div><div style={{fontSize:11,color:"var(--t3)"}}>10 random / {LISTENING_P1.length}</div></div>
        <span style={{fontSize:16,color:"var(--cyan)"}}>{"\u2192"}</span></div>
      <div className="crd" onClick={function(){p.nav("lisP2");}} style={{cursor:"pointer",display:"flex",alignItems:"center",gap:14,padding:"14px 16px"}}>
        <div style={{width:42,height:42,borderRadius:12,background:"linear-gradient(135deg,#f59e0b,#ef4444)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:20,flexShrink:0}}>❓</div>
        <div style={{flex:1}}><div className="out" style={{fontWeight:700,fontSize:14}}>Part 2 — Question-Response</div><div style={{fontSize:11,color:"var(--t3)"}}>10 random / {LISTENING_P2.length}</div></div>
        <span style={{fontSize:16,color:"var(--cyan)"}}>{"\u2192"}</span></div>
		<div className="crd" onClick={function(){p.nav("lisP3");}} style={{cursor:"pointer",display:"flex",alignItems:"center",gap:14,padding:"14px 16px"}}>
        <div style={{width:42,height:42,borderRadius:12,background:"linear-gradient(135deg,#8b5cf6,#ec4899)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:20,flexShrink:0}}>👥</div>
        <div style={{flex:1}}><div className="out" style={{fontWeight:700,fontSize:14}}>Part 3 — Conversations</div><div style={{fontSize:11,color:"var(--t3)"}}>10 random / {LISTENING_P3.length}</div></div>
        <span style={{fontSize:16,color:"var(--cyan)"}}>{"\u2192"}</span></div>
      <div className="crd" onClick={function(){p.nav("lisP4");}} style={{cursor:"pointer",display:"flex",alignItems:"center",gap:14,padding:"14px 16px"}}>
        <div style={{width:42,height:42,borderRadius:12,background:"linear-gradient(135deg,#06b6d4,#3b82f6)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:20,flexShrink:0}}>📜</div>
        <div style={{flex:1}}><div className="out" style={{fontWeight:700,fontSize:14}}>Part 4 — Talks</div><div style={{fontSize:11,color:"var(--t3)"}}>10 random / {LISTENING_P4.length}</div></div>
        <span style={{fontSize:16,color:"var(--cyan)"}}>{"\u2192"}</span></div>
    </div>
    <button className="btn2" onClick={p.back} style={{marginTop:24,width:"100%"}}>Back</button>
  </div>);
}

// ─── PART 2 LISTENING ───
function ListenP2(p){
  var items=useMemo(function(){return shuffle(LISTENING_P2).slice(0,10);},[]);
  var[ci,sC]=useState(0);var[sc,sSc]=useState(0);var[ph,sP]=useState("intro");var[pick,sPk]=useState(-1);
  var[playing,setPlaying]=useState(false);var[played,setPlayed]=useState(false);

  async function playQuestion(){
    if(playing)return;
    setPlaying(true);
    var it=items[ci];
    await playAudioFile("/audio/p2/"+it.id+"_q.mp3");
    await new Promise(function(r){setTimeout(r,400);});
    await playAudioFile("/audio/p2/"+it.id+"_0.mp3");
    await new Promise(function(r){setTimeout(r,300);});
    await playAudioFile("/audio/p2/"+it.id+"_1.mp3");
    await new Promise(function(r){setTimeout(r,300);});
    await playAudioFile("/audio/p2/"+it.id+"_2.mp3");
    await new Promise(function(r){setTimeout(r,200);});
    setPlaying(false);setPlayed(true);
  }

  function doAns(i){sPk(i);if(i===items[ci].c){sSc(sc+1);try{playCorrect();}catch(e){}}sP("fb");}
  function nxt(){if(ci<items.length-1){sC(ci+1);sPk(-1);setPlayed(false);sP("listen");}else{sP("done");p.done(sc,items.length,25+sc*6);}}

  if(ph==="intro")return(<div className="enter" style={{padding:"20px 16px",minHeight:"100vh",display:"flex",flexDirection:"column",justifyContent:"center",textAlign:"center"}}>
    <div style={{fontSize:56,marginBottom:16}}>❓</div>
    <h1 className="out" style={{fontWeight:900,fontSize:26,marginBottom:8}}>Part 2 — Question-Response</h1>
    <p style={{color:"var(--t2)",fontSize:13,marginBottom:8,lineHeight:1.6}}>You will hear a question followed by 3 responses.<br/>Choose the best response.</p>
    <p style={{color:"var(--gold)",fontWeight:600,fontSize:14,marginBottom:32}}>Listen carefully — audio plays once!</p>
    <button className="btn1" onClick={function(){sP("listen");}}>Start Listening</button>
    <button className="btn2" onClick={p.back} style={{marginTop:12,width:"100%"}}>Back</button></div>);

  if(ph==="done"){var xp=25+sc*6;return(<div className="enter" style={{padding:"20px 16px",minHeight:"100vh",display:"flex",flexDirection:"column",justifyContent:"center",textAlign:"center"}}>
    <div style={{fontSize:48,marginBottom:16,animation:"countUp .6s"}}>{sc>=8?"🏆":sc>=5?"⚔️":"🛡️"}</div>
    <h1 className="out" style={{fontWeight:900,fontSize:28,marginBottom:8}}>Listening Complete</h1>
    <div className="out" style={{fontSize:44,fontWeight:900,color:sc>=8?"var(--green)":sc>=5?"var(--cyan)":"var(--orange)",marginBottom:4,animation:"countUp .8s"}}>{sc}/{items.length}</div>
    <div className="out" style={{fontSize:20,fontWeight:800,color:"var(--gold)",marginBottom:32}}>+{xp} XP</div>
    <button className="btn1" onClick={p.back}>Back</button></div>);}

  var it=items[ci];

  if(ph==="listen")return(<div style={{padding:"20px 16px",minHeight:"100vh"}}>
    <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:20}}>
      <button onClick={p.back} style={{background:"none",border:"none",color:"var(--t2)",cursor:"pointer",fontSize:14}}>Quit</button>
      <span className="out" style={{fontSize:13,color:"var(--t2)",fontWeight:600}}>{ci+1}/{items.length}</span></div>
    <Bar value={ci} max={items.length} h={4} color="linear-gradient(90deg,#f59e0b,#ef4444)"/>
    <div style={{textAlign:"center",marginTop:40}}>
      <div className="out" style={{fontSize:11,color:"var(--orange)",textTransform:"uppercase",letterSpacing:1,fontWeight:600,marginBottom:24}}>Part 2 — Question-Response</div>
      {!played?<div>
        <button onClick={playQuestion} disabled={playing}
          style={{width:80,height:80,borderRadius:"50%",border:"none",background:playing?"rgba(255,140,66,.2)":"linear-gradient(135deg,#f59e0b,#ef4444)",
            cursor:playing?"default":"pointer",display:"flex",alignItems:"center",justifyContent:"center",margin:"0 auto 20px",
            animation:playing?"pulse 1.5s infinite":"none"}}>
          <span style={{fontSize:32}}>{playing?"🔊":"▶️"}</span>
        </button>
        <p className="out" style={{color:playing?"var(--orange)":"var(--t2)",fontSize:14,fontWeight:600}}>
          {playing?"Listening...":"Tap to play audio"}</p>
      </div>
      :<div style={{animation:"fadeIn .3s"}}>
        <p className="out" style={{color:"var(--green)",fontSize:14,fontWeight:600,marginBottom:24}}>Audio complete — choose your answer</p>
        <div style={{display:"flex",flexDirection:"column",gap:10,textAlign:"left"}}>
          {it.opts.map(function(opt,i){
            return(<button key={i} onClick={function(){doAns(i);}}
              style={{display:"flex",alignItems:"center",gap:12,padding:"14px 16px",background:"var(--bg2)",border:"1px solid var(--bdr)",borderRadius:12,cursor:"pointer",fontSize:14,color:"var(--t1)",textAlign:"left",fontFamily:"'DM Sans',sans-serif"}}>
              <div style={{width:28,height:28,borderRadius:"50%",border:"2px solid var(--t3)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:12,fontWeight:700,flexShrink:0,color:"var(--t3)"}}>
                {String.fromCharCode(65+i)}</div>
              <span>{opt}</span></button>);
          })}
        </div>
        <button onClick={function(){setPlayed(false);}} className="btn2" style={{marginTop:12,width:"100%",fontSize:12}}>🔄 Replay audio</button>
      </div>}
    </div>
  </div>);

  return(<div style={{padding:"20px 16px",minHeight:"100vh"}}>
    <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:20}}>
      <button onClick={p.back} style={{background:"none",border:"none",color:"var(--t2)",cursor:"pointer",fontSize:14}}>Quit</button>
      <span className="out" style={{fontSize:13,color:"var(--t2)",fontWeight:600}}>{ci+1}/{items.length}</span></div>
    <Bar value={ci} max={items.length} h={4} color="linear-gradient(90deg,#f59e0b,#ef4444)"/>
    <div className="crd" style={{marginTop:16,padding:14,background:"rgba(139,94,131,.05)",borderColor:"rgba(139,94,131,.12)"}}>
      <p className="out" style={{fontSize:12,fontWeight:600,color:"var(--purple)",marginBottom:6}}>Question</p>
      <p style={{fontSize:14,color:"var(--t1)",lineHeight:1.5}}>{it.q}</p></div>
    <div style={{display:"flex",flexDirection:"column",gap:8,marginTop:16}}>
      {it.opts.map(function(opt,i){
        var isCor=i===it.c;var isPick=pick===i;
        var bg="var(--bg2)";var bd="var(--bdr)";
        if(isCor){bg="rgba(0,230,118,.12)";bd="var(--green)";}
        else if(isPick&&!isCor){bg="rgba(255,71,87,.12)";bd="var(--red)";}
        return(<div key={i} style={{display:"flex",alignItems:"center",gap:12,padding:"12px 14px",background:bg,border:"1px solid "+bd,borderRadius:12,fontSize:14,color:"var(--t1)"}}>
          <div style={{width:24,height:24,borderRadius:"50%",border:"2px solid "+(isCor?"var(--green)":isPick?"var(--red)":"var(--t3)"),display:"flex",alignItems:"center",justifyContent:"center",fontSize:11,fontWeight:700,flexShrink:0,background:isCor?"var(--green)":isPick&&!isCor?"var(--red)":"transparent",color:(isCor||isPick)?"#fff":"var(--t3)"}}>
            {isCor?"✓":isPick?"✗":String.fromCharCode(65+i)}</div>
          <span>{opt}</span></div>);
      })}
    </div>
    <div className="crd" style={{marginTop:16,background:"rgba(212,148,58,.06)",borderColor:"rgba(212,148,58,.15)",padding:14,animation:"fadeIn .3s"}}>
      <p style={{fontSize:13,color:"var(--t2)",lineHeight:1.6}}>{it.x}</p></div>
    <button className="btn1" onClick={nxt} style={{marginTop:16}}>{ci<items.length-1?"Next":"See Results"}</button>
  </div>);
}

// ─── PART 1 LISTENING ───
function ListenP1(p){
  var items=useMemo(function(){return shuffle(LISTENING_P1).slice(0,10);},[]);
  var[ci,sC]=useState(0);var[sc,sSc]=useState(0);var[ph,sP]=useState("intro");var[pick,sPk]=useState(-1);
  var[playing,setPlaying]=useState(false);var[played,setPlayed]=useState(false);var[curOpt,setCurOpt]=useState(-1);

  async function playStatements(){
    if(playing)return;
    setPlaying(true);
    var it=items[ci];
    for(var i=0;i<it.opts.length;i++){
      setCurOpt(i);
      await playAudioFile("/audio/p1/"+it.id+"_"+i+".mp3");
      await new Promise(function(r){setTimeout(r,400);});
    }
    setCurOpt(-1);setPlaying(false);setPlayed(true);
  }

  function doAns(i){sPk(i);if(i===items[ci].c){sSc(sc+1);try{playCorrect();}catch(e){}}sP("fb");}
  function nxt(){if(ci<items.length-1){sC(ci+1);sPk(-1);setPlayed(false);setCurOpt(-1);sP("listen");}else{sP("done");p.done(sc,items.length,20+sc*5);}}

  if(ph==="intro")return(<div className="enter" style={{padding:"20px 16px",minHeight:"100vh",display:"flex",flexDirection:"column",justifyContent:"center",textAlign:"center"}}>
    <div style={{fontSize:56,marginBottom:16}}>🖼️</div>
    <h1 className="out" style={{fontWeight:900,fontSize:26,marginBottom:8}}>Part 1 — Photographs</h1>
    <p style={{color:"var(--t2)",fontSize:13,marginBottom:8,lineHeight:1.6}}>Look at the photograph, then listen to 4 statements.<br/>Choose the one that best describes the image.</p>
    <p style={{color:"var(--gold)",fontWeight:600,fontSize:14,marginBottom:32}}>Listen carefully to each statement!</p>
    <button className="btn1" onClick={function(){sP("listen");}}>Start Listening</button>
    <button className="btn2" onClick={p.back} style={{marginTop:12,width:"100%"}}>Back</button></div>);

  if(ph==="done"){var xp=20+sc*5;return(<div className="enter" style={{padding:"20px 16px",minHeight:"100vh",display:"flex",flexDirection:"column",justifyContent:"center",textAlign:"center"}}>
    <div style={{fontSize:48,marginBottom:16,animation:"countUp .6s"}}>{sc>=8?"🏆":sc>=5?"⚔️":"🛡️"}</div>
    <h1 className="out" style={{fontWeight:900,fontSize:28,marginBottom:8}}>Part 1 Complete</h1>
    <div className="out" style={{fontSize:44,fontWeight:900,color:sc>=8?"var(--green)":sc>=5?"var(--cyan)":"var(--orange)",marginBottom:4,animation:"countUp .8s"}}>{sc}/{items.length}</div>
    <div className="out" style={{fontSize:20,fontWeight:800,color:"var(--gold)",marginBottom:32}}>+{xp} XP</div>
    <button className="btn1" onClick={p.back}>Back</button></div>);}

  var it=items[ci];

  if(ph==="listen")return(<div style={{padding:"20px 16px",minHeight:"100vh"}}>
    <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16}}>
      <button onClick={p.back} style={{background:"none",border:"none",color:"var(--t2)",cursor:"pointer",fontSize:14}}>Quit</button>
      <span className="out" style={{fontSize:13,color:"var(--t2)",fontWeight:600}}>{ci+1}/{items.length}</span></div>
    <Bar value={ci} max={items.length} h={4} color="linear-gradient(90deg,#22c55e,#06b6d4)"/>

    <div style={{marginTop:12,marginBottom:16,borderRadius:14,overflow:"hidden",border:"1px solid var(--bdr)"}}>
      <img src={it.img} alt="TOEIC photograph" style={{width:"100%",display:"block",maxHeight:260,objectFit:"cover"}}/>
    </div>

    {!played?<div style={{textAlign:"center"}}>
      <button onClick={playStatements} disabled={playing}
        style={{width:72,height:72,borderRadius:"50%",border:"none",background:playing?"rgba(34,197,94,.2)":"linear-gradient(135deg,#22c55e,#06b6d4)",
          cursor:playing?"default":"pointer",display:"flex",alignItems:"center",justifyContent:"center",margin:"0 auto 16px",
          animation:playing?"pulse 1.5s infinite":"none"}}>
        <span style={{fontSize:28}}>{playing?"🔊":"▶️"}</span>
      </button>
      {playing&&curOpt>=0&&<p className="out" style={{color:"var(--cyan)",fontSize:14,fontWeight:600}}>Playing statement {String.fromCharCode(65+curOpt)}...</p>}
      {!playing&&<p className="out" style={{color:"var(--t2)",fontSize:13}}>Tap to hear the 4 statements</p>}
    </div>
    :<div style={{animation:"fadeIn .3s"}}>
      <p className="out" style={{color:"var(--green)",fontSize:13,fontWeight:600,textAlign:"center",marginBottom:16}}>Which statement best describes the photograph?</p>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
        {["A","B","C","D"].map(function(letter,i){
          return(<button key={i} onClick={function(){doAns(i);}}
            style={{padding:"16px 12px",background:"var(--bg2)",border:"1px solid var(--bdr)",borderRadius:12,cursor:"pointer",textAlign:"center"}}>
            <div className="out" style={{fontWeight:800,fontSize:20,color:"var(--cyan)"}}>{letter}</div>
          </button>);
        })}
      </div>
      <button onClick={function(){setPlayed(false);setCurOpt(-1);}} className="btn2" style={{marginTop:12,width:"100%",fontSize:12}}>🔄 Replay statements</button>
    </div>}
  </div>);

  // Feedback — show image + all statements + explanation
  return(<div style={{padding:"20px 16px",minHeight:"100vh"}}>
    <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16}}>
      <button onClick={p.back} style={{background:"none",border:"none",color:"var(--t2)",cursor:"pointer",fontSize:14}}>Quit</button>
      <span className="out" style={{fontSize:13,color:"var(--t2)",fontWeight:600}}>{ci+1}/{items.length}</span></div>
    <Bar value={ci} max={items.length} h={4} color="linear-gradient(90deg,#22c55e,#06b6d4)"/>

    <div style={{marginTop:8,marginBottom:12,borderRadius:12,overflow:"hidden",border:"1px solid var(--bdr)"}}>
      <img src={it.img} alt="TOEIC photograph" style={{width:"100%",display:"block",maxHeight:200,objectFit:"cover"}}/>
    </div>

    <div style={{display:"flex",flexDirection:"column",gap:6}}>
      {it.opts.map(function(opt,i){
        var isCor=i===it.c;var isPick=pick===i;
        var bg="var(--bg2)";var bd="var(--bdr)";
        if(isCor){bg="rgba(0,230,118,.12)";bd="var(--green)";}
        else if(isPick&&!isCor){bg="rgba(255,71,87,.12)";bd="var(--red)";}
        return(<div key={i} style={{display:"flex",alignItems:"center",gap:10,padding:"10px 12px",background:bg,border:"1px solid "+bd,borderRadius:10,fontSize:13,color:"var(--t1)"}}>
          <div style={{width:22,height:22,borderRadius:"50%",border:"2px solid "+(isCor?"var(--green)":isPick?"var(--red)":"var(--t3)"),display:"flex",alignItems:"center",justifyContent:"center",fontSize:10,fontWeight:700,flexShrink:0,background:isCor?"var(--green)":isPick&&!isCor?"var(--red)":"transparent",color:(isCor||isPick)?"#fff":"var(--t3)"}}>
            {isCor?"✓":isPick?"✗":String.fromCharCode(65+i)}</div>
          <span>{opt}</span></div>);
      })}
    </div>

    <div className="crd" style={{marginTop:12,background:"rgba(212,148,58,.06)",borderColor:"rgba(212,148,58,.15)",padding:12,animation:"fadeIn .3s"}}>
      <p style={{fontSize:13,color:"var(--t2)",lineHeight:1.6}}>{it.x}</p></div>
    <button className="btn1" onClick={nxt} style={{marginTop:14}}>{ci<items.length-1?"Next":"See Results"}</button>
  </div>);
}

// ═══════════════════════════════════════════
// COMPOSANTS Part 3 & Part 4
// ═══════════════════════════════════════════
// À coller AVANT "// ─── LEAGUE ───"


// ─── PART 3 CONVERSATIONS ───
function ListenP3(p){
  var items=useMemo(function(){return shuffle(LISTENING_P3).slice(0,10);},[]);
  var[ci,sC]=useState(0);var[qi,sQi]=useState(0);var[sc,sSc]=useState(0);var[totalQ,sTQ]=useState(0);
  var[ph,sP]=useState("intro");var[pick,sPk]=useState(-1);
  var[playing,setPlaying]=useState(false);var[played,setPlayed]=useState(false);var[curLine,setCurLine]=useState(-1);

  var totalQs=useMemo(function(){var c=0;items.forEach(function(it){c+=it.qs.length;});return c;},[]);

  async function playConversation(){
    if(playing)return;
    setPlaying(true);
    var it=items[ci];
    for(var i=0;i<it.lines.length;i++){
      setCurLine(i);
      await playAudioFile("/audio/p3/"+it.id+"_line"+i+".mp3");
      await new Promise(function(r){setTimeout(r,300);});
    }
    setCurLine(-1);setPlaying(false);setPlayed(true);
  }

  function doAns(i){
    sPk(i);if(i===items[ci].qs[qi].c){sSc(sc+1);try{playCorrect();}catch(e){}}else{try{playWrong();}catch(e){}}sTQ(totalQ+1);sP("fb");
  }
  function nxt(){
    sPk(-1);
    if(qi<items[ci].qs.length-1){sQi(qi+1);sP("q");}
    else if(ci<items.length-1){sC(ci+1);sQi(0);setPlayed(false);setCurLine(-1);sP("listen");}
    else{sP("done");p.done(sc,totalQ+1,30+sc*5);}
  }

  if(ph==="intro")return(<div className="enter" style={{padding:"20px 16px",minHeight:"100vh",display:"flex",flexDirection:"column",justifyContent:"center",textAlign:"center"}}>
    <div style={{fontSize:56,marginBottom:16}}>👥</div>
    <h1 className="out" style={{fontWeight:900,fontSize:26,marginBottom:8}}>Part 3 — Conversations</h1>
    <p style={{color:"var(--t2)",fontSize:13,marginBottom:8,lineHeight:1.6}}>Listen to short conversations between 2 people.<br/>Answer 3 questions about each conversation.</p>
    <p style={{color:"var(--gold)",fontWeight:600,fontSize:14,marginBottom:32}}>Read the questions BEFORE listening!</p>
    <button className="btn1" onClick={function(){sP("listen");}}>Start Listening</button>
    <button className="btn2" onClick={p.back} style={{marginTop:12,width:"100%"}}>Back</button></div>);

  if(ph==="done"){var xp=30+sc*5;return(<div className="enter" style={{padding:"20px 16px",minHeight:"100vh",display:"flex",flexDirection:"column",justifyContent:"center",textAlign:"center"}}>
    <div style={{fontSize:48,marginBottom:16,animation:"countUp .6s"}}>{sc>=totalQs*0.8?"🏆":sc>=totalQs*0.5?"⚔️":"🛡️"}</div>
    <h1 className="out" style={{fontWeight:900,fontSize:28,marginBottom:8}}>Part 3 Complete</h1>
    <div className="out" style={{fontSize:44,fontWeight:900,color:sc>=totalQs*0.8?"var(--green)":sc>=totalQs*0.5?"var(--cyan)":"var(--orange)",marginBottom:4,animation:"countUp .8s"}}>{sc}/{totalQs}</div>
    <div className="out" style={{fontSize:20,fontWeight:800,color:"var(--gold)",marginBottom:32}}>+{xp} XP</div>
    <button className="btn1" onClick={p.back}>Back</button></div>);}

  var it=items[ci];

  // Listen phase — show questions preview + play button
  if(ph==="listen")return(<div style={{padding:"20px 16px",minHeight:"100vh"}}>
    <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16}}>
      <button onClick={p.back} style={{background:"none",border:"none",color:"var(--t2)",cursor:"pointer",fontSize:14}}>Quit</button>
      <span className="out" style={{fontSize:13,color:"var(--t2)",fontWeight:600}}>Conversation {ci+1}/{items.length}</span></div>
    <Bar value={totalQ} max={totalQs} h={4} color="linear-gradient(90deg,#8b5cf6,#ec4899)"/>

    <div className="out" style={{fontSize:11,color:"var(--purple)",textTransform:"uppercase",letterSpacing:1,fontWeight:600,marginTop:16,marginBottom:12}}>Preview the questions first</div>
    <div style={{display:"flex",flexDirection:"column",gap:6,marginBottom:20}}>
      {it.qs.map(function(q,i){return(<div key={i} className="crd" style={{padding:"10px 14px",background:"rgba(139,92,246,.04)",borderColor:"rgba(139,92,246,.1)"}}>
        <span style={{fontSize:12,color:"var(--t2)"}}>{(i+1)+". "+q.q}</span></div>);})}
    </div>

    {!played?<div style={{textAlign:"center"}}>
      <button onClick={playConversation} disabled={playing}
        style={{width:80,height:80,borderRadius:"50%",border:"none",background:playing?"rgba(139,92,246,.2)":"linear-gradient(135deg,#8b5cf6,#ec4899)",
          cursor:playing?"default":"pointer",display:"flex",alignItems:"center",justifyContent:"center",margin:"0 auto 16px",
          animation:playing?"pulse 1.5s infinite":"none"}}>
        <span style={{fontSize:32}}>{playing?"🔊":"▶️"}</span>
      </button>
      {playing&&curLine>=0&&<p className="out" style={{color:"var(--purple)",fontSize:13,fontWeight:600}}>
        {it.lines[curLine].s==="M"?"👨 Man speaking...":"👩 Woman speaking..."}</p>}
      {!playing&&!played&&<p className="out" style={{color:"var(--t2)",fontSize:13}}>Tap to hear the conversation</p>}
    </div>
    :<div style={{textAlign:"center",animation:"fadeIn .3s"}}>
      <p className="out" style={{color:"var(--green)",fontSize:14,fontWeight:600,marginBottom:12}}>Conversation complete</p>
      <button className="btn1" onClick={function(){sP("q");}}>Answer Questions</button>
      <button onClick={function(){setPlayed(false);setCurLine(-1);}} className="btn2" style={{marginTop:8,width:"100%",fontSize:12}}>🔄 Replay conversation</button>
    </div>}
  </div>);

  // Question phase
  var curQ=it.qs[qi];
  return(<div style={{padding:"20px 16px",minHeight:"100vh"}}>
    <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16}}>
      <button onClick={p.back} style={{background:"none",border:"none",color:"var(--t2)",cursor:"pointer",fontSize:14}}>Quit</button>
      <span className="out" style={{fontSize:13,color:"var(--t2)",fontWeight:600}}>Q {totalQ+1}/{totalQs}</span></div>
    <Bar value={totalQ} max={totalQs} h={4} color="linear-gradient(90deg,#8b5cf6,#ec4899)"/>
    <div style={{fontSize:10,color:"var(--purple)",marginTop:8,marginBottom:4}} className="out">Conversation {ci+1} — Question {qi+1}/3</div>
    <h2 className="out" style={{fontWeight:700,fontSize:17,lineHeight:1.5,marginBottom:20,marginTop:8}}>{curQ.q}</h2>
    <div style={{display:"flex",flexDirection:"column",gap:8}}>
      {curQ.opts.map(function(opt,i){
        var isCor=i===curQ.c;var isPick=pick===i;var show=ph==="fb";
        var bg="var(--bg2)";var bd="var(--bdr)";
        if(show&&isCor){bg="rgba(0,230,118,.12)";bd="var(--green)";}
        else if(show&&isPick&&!isCor){bg="rgba(255,71,87,.12)";bd="var(--red)";}
        return(<button key={i} onClick={function(){if(ph==="q")doAns(i);}} disabled={show}
          style={{display:"flex",alignItems:"center",gap:12,padding:"14px 16px",background:bg,border:"1px solid "+bd,borderRadius:12,cursor:ph==="q"?"pointer":"default",fontSize:14,color:"var(--t1)",textAlign:"left",fontFamily:"'DM Sans',sans-serif",transition:"all .2s"}}>
          <div style={{width:26,height:26,borderRadius:"50%",border:"2px solid "+(show&&isCor?"var(--green)":show&&isPick?"var(--red)":"var(--t3)"),display:"flex",alignItems:"center",justifyContent:"center",fontSize:11,fontWeight:700,flexShrink:0,background:show&&isCor?"var(--green)":show&&isPick&&!isCor?"var(--red)":"transparent",color:show&&(isCor||isPick)?"#fff":"var(--t3)"}}>
            {show&&isCor?"✓":show&&isPick?"✗":String.fromCharCode(65+i)}</div>
          <span>{opt}</span></button>);})}
    </div>
    {ph==="fb"&&<div style={{marginTop:16,animation:"fadeIn .3s"}}>
      <button className="btn1" onClick={nxt} style={{marginTop:8}}>{qi<it.qs.length-1?"Next Question":(ci<items.length-1?"Next Conversation":"See Results")}</button>
    </div>}
  </div>);
}

// ─── PART 4 TALKS ───
function ListenP4(p){
  var items=useMemo(function(){return shuffle(LISTENING_P4).slice(0,10);},[]);
  var[ci,sC]=useState(0);var[qi,sQi]=useState(0);var[sc,sSc]=useState(0);var[totalQ,sTQ]=useState(0);
  var[ph,sP]=useState("intro");var[pick,sPk]=useState(-1);
  var[playing,setPlaying]=useState(false);var[played,setPlayed]=useState(false);

  var totalQs=useMemo(function(){var c=0;items.forEach(function(it){c+=it.qs.length;});return c;},[]);

  async function playTalk(){
    if(playing)return;
    setPlaying(true);
    await playAudioFile("/audio/p4/"+items[ci].id+".mp3");
    setPlaying(false);setPlayed(true);
  }

  function doAns(i){
    sPk(i);if(i===items[ci].qs[qi].c){sSc(sc+1);try{playCorrect();}catch(e){}}else{try{playWrong();}catch(e){}}sTQ(totalQ+1);sP("fb");
  }
  function nxt(){
    sPk(-1);
    if(qi<items[ci].qs.length-1){sQi(qi+1);sP("q");}
    else if(ci<items.length-1){sC(ci+1);sQi(0);setPlayed(false);sP("listen");}
    else{sP("done");p.done(sc,totalQ+1,30+sc*5);}
  }

  if(ph==="intro")return(<div className="enter" style={{padding:"20px 16px",minHeight:"100vh",display:"flex",flexDirection:"column",justifyContent:"center",textAlign:"center"}}>
    <div style={{fontSize:56,marginBottom:16}}>📜</div>
    <h1 className="out" style={{fontWeight:900,fontSize:26,marginBottom:8}}>Part 4 — Talks</h1>
    <p style={{color:"var(--t2)",fontSize:13,marginBottom:8,lineHeight:1.6}}>Listen to short talks: announcements, voicemails, reports.<br/>Answer 3 questions about each talk.</p>
    <p style={{color:"var(--gold)",fontWeight:600,fontSize:14,marginBottom:32}}>Read the questions BEFORE listening!</p>
    <button className="btn1" onClick={function(){sP("listen");}}>Start Listening</button>
    <button className="btn2" onClick={p.back} style={{marginTop:12,width:"100%"}}>Back</button></div>);

  if(ph==="done"){var xp=30+sc*5;return(<div className="enter" style={{padding:"20px 16px",minHeight:"100vh",display:"flex",flexDirection:"column",justifyContent:"center",textAlign:"center"}}>
    <div style={{fontSize:48,marginBottom:16,animation:"countUp .6s"}}>{sc>=totalQs*0.8?"🏆":sc>=totalQs*0.5?"⚔️":"🛡️"}</div>
    <h1 className="out" style={{fontWeight:900,fontSize:28,marginBottom:8}}>Part 4 Complete</h1>
    <div className="out" style={{fontSize:44,fontWeight:900,color:sc>=totalQs*0.8?"var(--green)":sc>=totalQs*0.5?"var(--cyan)":"var(--orange)",marginBottom:4,animation:"countUp .8s"}}>{sc}/{totalQs}</div>
    <div className="out" style={{fontSize:20,fontWeight:800,color:"var(--gold)",marginBottom:32}}>+{xp} XP</div>
    <button className="btn1" onClick={p.back}>Back</button></div>);}

  var it=items[ci];

  if(ph==="listen")return(<div style={{padding:"20px 16px",minHeight:"100vh"}}>
    <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16}}>
      <button onClick={p.back} style={{background:"none",border:"none",color:"var(--t2)",cursor:"pointer",fontSize:14}}>Quit</button>
      <span className="out" style={{fontSize:13,color:"var(--t2)",fontWeight:600}}>Talk {ci+1}/{items.length}</span></div>
    <Bar value={totalQ} max={totalQs} h={4} color="linear-gradient(90deg,#06b6d4,#3b82f6)"/>

    <div style={{display:"flex",gap:6,marginTop:12,marginBottom:12}}>
      <span style={{fontSize:10,padding:"3px 8px",background:"rgba(6,182,212,.1)",color:"#06b6d4",borderRadius:6,fontWeight:600}} className="out">{it.type}</span></div>

    <div className="out" style={{fontSize:11,color:"var(--cyan)",textTransform:"uppercase",letterSpacing:1,fontWeight:600,marginBottom:12}}>Preview the questions first</div>
    <div style={{display:"flex",flexDirection:"column",gap:6,marginBottom:20}}>
      {it.qs.map(function(q,i){return(<div key={i} className="crd" style={{padding:"10px 14px",background:"rgba(6,182,212,.04)",borderColor:"rgba(6,182,212,.1)"}}>
        <span style={{fontSize:12,color:"var(--t2)"}}>{(i+1)+". "+q.q}</span></div>);})}
    </div>

    {!played?<div style={{textAlign:"center"}}>
      <button onClick={playTalk} disabled={playing}
        style={{width:80,height:80,borderRadius:"50%",border:"none",background:playing?"rgba(6,182,212,.2)":"linear-gradient(135deg,#06b6d4,#3b82f6)",
          cursor:playing?"default":"pointer",display:"flex",alignItems:"center",justifyContent:"center",margin:"0 auto 16px",
          animation:playing?"pulse 1.5s infinite":"none"}}>
        <span style={{fontSize:32}}>{playing?"🔊":"▶️"}</span>
      </button>
      {playing&&<p className="out" style={{color:"var(--cyan)",fontSize:13,fontWeight:600}}>Listening...</p>}
      {!playing&&<p className="out" style={{color:"var(--t2)",fontSize:13}}>Tap to hear the talk</p>}
    </div>
    :<div style={{textAlign:"center",animation:"fadeIn .3s"}}>
      <p className="out" style={{color:"var(--green)",fontSize:14,fontWeight:600,marginBottom:12}}>Talk complete</p>
      <button className="btn1" onClick={function(){sP("q");}}>Answer Questions</button>
      <button onClick={function(){setPlayed(false);}} className="btn2" style={{marginTop:8,width:"100%",fontSize:12}}>🔄 Replay talk</button>
    </div>}
  </div>);

  var curQ=it.qs[qi];
  return(<div style={{padding:"20px 16px",minHeight:"100vh"}}>
    <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16}}>
      <button onClick={p.back} style={{background:"none",border:"none",color:"var(--t2)",cursor:"pointer",fontSize:14}}>Quit</button>
      <span className="out" style={{fontSize:13,color:"var(--t2)",fontWeight:600}}>Q {totalQ+1}/{totalQs}</span></div>
    <Bar value={totalQ} max={totalQs} h={4} color="linear-gradient(90deg,#06b6d4,#3b82f6)"/>
    <div style={{fontSize:10,color:"var(--cyan)",marginTop:8,marginBottom:4}} className="out">{it.type} — Question {qi+1}/3</div>
    <h2 className="out" style={{fontWeight:700,fontSize:17,lineHeight:1.5,marginBottom:20,marginTop:8}}>{curQ.q}</h2>
    <div style={{display:"flex",flexDirection:"column",gap:8}}>
      {curQ.opts.map(function(opt,i){
        var isCor=i===curQ.c;var isPick=pick===i;var show=ph==="fb";
        var bg="var(--bg2)";var bd="var(--bdr)";
        if(show&&isCor){bg="rgba(0,230,118,.12)";bd="var(--green)";}
        else if(show&&isPick&&!isCor){bg="rgba(255,71,87,.12)";bd="var(--red)";}
        return(<button key={i} onClick={function(){if(ph==="q")doAns(i);}} disabled={show}
          style={{display:"flex",alignItems:"center",gap:12,padding:"14px 16px",background:bg,border:"1px solid "+bd,borderRadius:12,cursor:ph==="q"?"pointer":"default",fontSize:14,color:"var(--t1)",textAlign:"left",fontFamily:"'DM Sans',sans-serif",transition:"all .2s"}}>
          <div style={{width:26,height:26,borderRadius:"50%",border:"2px solid "+(show&&isCor?"var(--green)":show&&isPick?"var(--red)":"var(--t3)"),display:"flex",alignItems:"center",justifyContent:"center",fontSize:11,fontWeight:700,flexShrink:0,background:show&&isCor?"var(--green)":show&&isPick&&!isCor?"var(--red)":"transparent",color:show&&(isCor||isPick)?"#fff":"var(--t3)"}}>
            {show&&isCor?"✓":show&&isPick?"✗":String.fromCharCode(65+i)}</div>
          <span>{opt}</span></button>);})}
    </div>
    {ph==="fb"&&<div style={{marginTop:16,animation:"fadeIn .3s"}}>
      <button className="btn1" onClick={nxt} style={{marginTop:8}}>{qi<it.qs.length-1?"Next Question":(ci<items.length-1?"Next Talk":"See Results")}</button>
    </div>}
  </div>);
}

// ─── READING HUB ───
function ReadingHub(p){
  return(<div className="enter" style={{padding:"20px 16px",minHeight:"100vh",display:"flex",flexDirection:"column",justifyContent:"center",textAlign:"center"}}>
    <div style={{fontSize:56,marginBottom:16}}>📖</div>
    <h1 className="out" style={{fontWeight:900,fontSize:26,marginBottom:8}}>Reading Practice</h1>
    <p style={{color:"var(--t2)",fontSize:13,marginBottom:32,lineHeight:1.6}}>Train for the TOEIC Reading section</p>
    <div style={{display:"flex",flexDirection:"column",gap:12,textAlign:"left"}}>
      <div className="crd" onClick={function(){p.nav("drill");}} style={{cursor:"pointer",display:"flex",alignItems:"center",gap:14,padding:"14px 16px"}}>
        <div style={{width:42,height:42,borderRadius:12,background:"linear-gradient(135deg,#00e676,#00bfa5)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:20,flexShrink:0}}>📜</div>
        <div style={{flex:1}}><div className="out" style={{fontWeight:700,fontSize:14}}>Part 5 — Sentence Completion</div><div style={{fontSize:11,color:"var(--t3)"}}>10 random questions from 100</div></div>
        <span style={{fontSize:16,color:"var(--cyan)"}}>{"\u2192"}</span></div>
      <div className="crd" onClick={function(){p.nav("timesim");}} style={{cursor:"pointer",display:"flex",alignItems:"center",gap:14,padding:"14px 16px"}}>
        <div style={{width:42,height:42,borderRadius:12,background:"linear-gradient(135deg,#8b5cf6,#6366f1)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:20,flexShrink:0}}>🏁</div>
        <div style={{flex:1}}><div className="out" style={{fontWeight:700,fontSize:14}}>Part 5 — Exam Simulation</div><div style={{fontSize:11,color:"var(--t3)"}}>30 Qs in 10 min, real pace</div></div>
        <span style={{fontSize:16,color:"var(--cyan)"}}>{"\u2192"}</span></div>
      <div className="crd" onClick={function(){p.nav("p6");}} style={{cursor:"pointer",display:"flex",alignItems:"center",gap:14,padding:"14px 16px"}}>
        <div style={{width:42,height:42,borderRadius:12,background:"linear-gradient(135deg,#c4587a,#8b5e83)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:20,flexShrink:0}}>📜</div>
        <div style={{flex:1}}><div className="out" style={{fontWeight:700,fontSize:14}}>Part 6 — Text Completion</div><div style={{fontSize:11,color:"var(--t3)"}}>Business texts with blanks</div></div>
        <span style={{fontSize:16,color:"var(--cyan)"}}>{"\u2192"}</span></div>
      <div className="crd" onClick={function(){p.nav("p7");}} style={{cursor:"pointer",display:"flex",alignItems:"center",gap:14,padding:"14px 16px"}}>
        <div style={{width:42,height:42,borderRadius:12,background:"linear-gradient(135deg,#3b82f6,#06b6d4)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:20,flexShrink:0}}>📖</div>
        <div style={{flex:1}}><div className="out" style={{fontWeight:700,fontSize:14}}>Part 7 — Reading Comprehension</div><div style={{fontSize:11,color:"var(--t3)"}}>Passages + questions</div></div>
        <span style={{fontSize:16,color:"var(--cyan)"}}>{"\u2192"}</span></div>
    </div>
    <button className="btn2" onClick={p.back} style={{marginTop:24,width:"100%"}}>Back</button>
  </div>);
}
// ─── LEAGUE ───
var SEASONS=[
  {id:1,name:"Awakening",icon:"🌱",color:"var(--green)",weeks:["2026-W12","2026-W13","2026-W14"],start:"Mar 23",end:"Apr 12",endDate:"2026-04-12"},
  {id:2,name:"Rising",icon:"🔥",color:"var(--orange)",weeks:["2026-W15","2026-W16","2026-W17"],start:"Apr 13",end:"May 3",endDate:"2026-05-03"},
  {id:3,name:"Clash",icon:"⚔️",color:"var(--red)",weeks:["2026-W18","2026-W19","2026-W20"],start:"May 4",end:"May 24",endDate:"2026-05-24"},
  {id:4,name:"Final Push",icon:"🏆",color:"var(--gold)",weeks:["2026-W21","2026-W22","2026-W23","2026-W24","2026-W25"],start:"May 25",end:"Jun 28",endDate:"2026-06-28"},
];
function getCurrentSeason(){var cw=weekId();for(var i=0;i<SEASONS.length;i++){if(SEASONS[i].weeks.indexOf(cw)!==-1)return SEASONS[i];}return SEASONS[SEASONS.length-1];}
function getSeasonEndCountdown(season){
  var parts=season.endDate.split("-");
  var endSunday=new Date(parseInt(parts[0]),parseInt(parts[1])-1,parseInt(parts[2]),23,59,59);
  var now=new Date();
  var diff=Math.ceil((endSunday-now)/(864e5));
  return diff>0?diff+" days left":"Ended";
}

function computeRankings(students,cw,weeks){
  // Build weekly XP map: {weekId: [{name, xp}]}
  var weekMap={};
  students.forEach(function(s){
    var hist=s.weekly_history||[];
    hist.forEach(function(h){
      if(!weekMap[h.week])weekMap[h.week]=[];
      weekMap[h.week].push({name:s.name,xp:h.xp||0});
    });
    // Include current week
    if(s.week_id===cw&&(s.weekly_xp||0)>0){
      if(!weekMap[cw])weekMap[cw]=[];
      var exists=weekMap[cw].find(function(e){return e.name===s.name;});
      if(!exists)weekMap[cw].push({name:s.name,xp:s.weekly_xp});
    }
  });

  // Compute ranking points per student
  var pointsMap={};
  students.forEach(function(s){pointsMap[s.name]=0;});

  var filteredWeeks=weeks?weeks:Object.keys(weekMap);
  filteredWeeks.forEach(function(wk){
    var entries=weekMap[wk]||[];
    // Filter only active (xp > 0)
    var active=entries.filter(function(e){return e.xp>0;}).sort(function(a,b){return b.xp-a.xp;});
    var N=active.length;
    active.forEach(function(entry,rank){
      if(!pointsMap[entry.name])pointsMap[entry.name]=0;
      pointsMap[entry.name]+=(N-rank); // 1st = N pts, 2nd = N-1, ...
    });
  });

  // Convert to sorted array
  var result=Object.keys(pointsMap).map(function(name){
    var s=students.find(function(st){return st.name===name;});
    return{name:name,pts:pointsMap[name],avatar:s?s.avatar||"⚔️":"⚔️"};
  });
  result.sort(function(a,b){return b.pts-a.pts;});
  return result;
}

function League(p){var u=p.u,lg=getLeague(u.weeklyXp);
var[rivals,setRivals]=useState([]);
var[tab,setTab]=useState("week"); // week | season | overall
var cw=weekId();
var curSeason=getCurrentSeason();

var viewGroup=u.classCode||'idrac2026';
try{var dg=localStorage.getItem('toeic-dash-group');if(dg)viewGroup=dg;}catch(e){}
var[leagueGroup,setLeagueGroup]=useState(viewGroup);

useEffect(function(){
  supabase.from('students').select('name,weekly_xp,week_id,avatar,weekly_history').eq('class_code',leagueGroup).limit(50)
    .then(function(res){if(res.data)setRivals(res.data.filter(function(r){return r.name!=="Teacher";}));});
},[u.weeklyXp,leagueGroup]);

// Auto-refresh leaderboard every 30s when on League tab
useEffect(function(){
  var iv=setInterval(function(){
    supabase.from('students').select('name,weekly_xp,week_id,avatar,weekly_history').eq('class_code',leagueGroup).limit(50)
      .then(function(res){if(res.data)setRivals(res.data.filter(function(r){return r.name!=="Teacher";}));});
  },30000);
  return function(){clearInterval(iv);};
},[leagueGroup]);

// ── WEEK VIEW data ──
var weekAll=rivals.map(function(r){var xp=r.week_id===cw?(r.weekly_xp||0):0;return{name:r.name===u.name?r.name+" (You)":r.name,avatar:r.avatar||"⚔️",xp:xp,me:r.name===u.name};});
if(u.name!=="Teacher"&&!weekAll.find(function(a){return a.me;}))weekAll.push({name:u.name+" (You)",avatar:u.avatar||"⚔️",xp:u.weeklyXp,me:true});
weekAll.sort(function(a,b){return b.xp-a.xp;});

// ── SEASON VIEW data ──
var seasonRanking=useMemo(function(){
  if(rivals.length===0)return[];
  return computeRankings(rivals,cw,curSeason.weeks);
},[rivals,cw]);

// ── OVERALL VIEW data ──
var allSeasonWeeks=useMemo(function(){var w=[];SEASONS.forEach(function(s){s.weeks.forEach(function(wk){w.push(wk);});});return w;},[]);
var overallRanking=useMemo(function(){
  if(rivals.length===0)return[];
  return computeRankings(rivals,cw,allSeasonWeeks);
},[rivals,cw]);

var nx=LEAGUES.find(function(l){return l.min>u.weeklyXp;});
var weekRank=weekAll.findIndex(function(pl){return pl.me;})+1;
var seasonRank=(seasonRanking.findIndex(function(pl){return pl.name===u.name;})+1)||"-";
var overallRank=(overallRanking.findIndex(function(pl){return pl.name===u.name;})+1)||"-";
var countdown=getSeasonEndCountdown(curSeason);

// ── Render helpers ──
function RankRow(props){var pl=props.pl,rank=props.rank,isMe=props.isMe,unit=props.unit||"XP";
  return(<div style={{display:"flex",alignItems:"center",gap:12,padding:"12px 14px",background:isMe?"rgba(212,148,58,.08)":"var(--bg2)",border:isMe?"1.5px solid rgba(212,148,58,.25)":"1px solid var(--bdr)",borderRadius:12}}>
    <div className="out" style={{width:28,textAlign:"center",fontWeight:800,fontSize:14,color:rank<=3?"var(--gold)":"var(--t3)"}}>{rank<=3?(rank===1?"🥇":rank===2?"🥈":"🥉"):rank}</div>
    <div style={{fontSize:20,width:28,textAlign:"center"}}>{pl.avatar}</div>
    <div style={{flex:1}}><div className="out" style={{fontWeight:isMe?700:500,fontSize:14,color:isMe?"var(--cyan)":"var(--t1)"}}>{isMe?pl.name+" (You)":pl.name}</div></div>
    <div className="out" style={{fontWeight:700,fontSize:14,color:isMe?"var(--cyan)":"var(--t2)"}}>{pl.pts!==undefined?pl.pts:pl.xp} {unit}</div>
  </div>);
}

return(<div className="enter" style={{padding:"20px 16px 100px"}}>
<h1 className="out" style={{fontWeight:800,fontSize:24,marginBottom:4}}>League</h1>
{leagueGroup!==u.classCode&&<div style={{textAlign:"center",marginBottom:8}}>
  <span style={{fontSize:11,padding:"4px 12px",borderRadius:99,background:"rgba(139,94,131,.12)",border:"1px solid rgba(139,94,131,.25)",color:"var(--purple)"}} className="out">👁️ Viewing: {leagueGroup}</span>
</div>}

{/* Season banner */}
<div className="crd" style={{padding:"14px 18px",marginBottom:16,background:"linear-gradient(135deg,rgba(212,148,58,.06),rgba(139,94,131,.06))",borderColor:"rgba(212,148,58,.15)"}}>
  <div style={{display:"flex",alignItems:"center",justifyContent:"space-between"}}>
    <div style={{display:"flex",alignItems:"center",gap:8}}>
      <span style={{fontSize:22}}>{curSeason.icon}</span>
      <div>
        <div className="out" style={{fontWeight:800,fontSize:15,color:curSeason.color}}>Season {curSeason.id}: {curSeason.name}</div>
        <div style={{fontSize:11,color:"var(--t3)"}}>{curSeason.start} → {curSeason.end}</div>
      </div>
    </div>
    <div style={{textAlign:"right"}}>
      <div style={{fontSize:12,fontWeight:700,color:countdown==="Ended"?"var(--red)":"var(--cyan)"}}>{countdown}</div>
    </div>
  </div>
</div>

{/* Tab bar */}
<div style={{display:"flex",gap:4,marginBottom:16,background:"var(--bg2)",borderRadius:10,padding:3}}>
  {[{k:"week",l:"Week"},{k:"season",l:"Season "+curSeason.id},{k:"overall",l:"Overall"}].map(function(t){
    var active=tab===t.k;
    return(<button key={t.k} onClick={function(){setTab(t.k);}} style={{flex:1,padding:"8px 0",borderRadius:8,border:"none",cursor:"pointer",fontFamily:"'DM Sans',sans-serif",fontSize:13,fontWeight:active?700:500,background:active?"var(--cyan)":"transparent",color:active?"#000":"var(--t3)",transition:"all .2s"}}>{t.l}</button>);
  })}
</div>

{/* Stats summary */}
{u.name==="Teacher"?
<div className="crd" style={{padding:"12px 16px",marginBottom:16,display:"flex",alignItems:"center",gap:10,background:"linear-gradient(135deg,rgba(245,158,11,.06),rgba(139,94,131,.06))",borderColor:"rgba(245,158,11,.15)"}}>
  <span style={{fontSize:18}}>{"👁️"}</span>
  <div><div className="out" style={{fontWeight:700,fontSize:13,color:"var(--gold)"}}>Observer mode</div>
  <div style={{fontSize:11,color:"var(--t3)"}}>Your stats are hidden from the leaderboard</div></div>
</div>
:
<div style={{display:"flex",gap:8,marginBottom:16}}>
  <div className="crd" style={{flex:1,padding:12,textAlign:"center"}}><div className="out" style={{fontSize:20,fontWeight:800,color:"var(--cyan)"}}>{u.weeklyXp}</div><div style={{fontSize:10,color:"var(--t3)"}}>Week XP</div></div>
  <div className="crd" style={{flex:1,padding:12,textAlign:"center"}}><div className="out" style={{fontSize:20,fontWeight:800,color:curSeason.color}}>#{seasonRank}</div><div style={{fontSize:10,color:"var(--t3)"}}>Season</div></div>
  <div className="crd" style={{flex:1,padding:12,textAlign:"center"}}><div className="out" style={{fontSize:20,fontWeight:800,color:"var(--gold)"}}>#{overallRank}</div><div style={{fontSize:10,color:"var(--t3)"}}>Overall</div></div>
</div>}

{/* ── WEEK TAB ── */}
{tab==="week"&&(<div>
  {u.name!=="Teacher"&&<div className="crd glo" style={{textAlign:"center",marginBottom:16,padding:20}}>
    <div style={{fontSize:40,marginBottom:6,animation:"glow 3s infinite"}}>{lg.icon}</div>
    <div className="out" style={{fontWeight:800,fontSize:20,color:lg.color}}>{lg.name} League</div>
    <div style={{fontSize:12,color:"var(--t2)",marginTop:4}}>Rank #{weekRank} this week</div>
    {nx&&<div style={{marginTop:10}}><div style={{fontSize:10,color:"var(--t3)",marginBottom:4}}>{nx.min-u.weeklyXp} XP to {nx.name}</div><Bar value={u.weeklyXp-lg.min} max={nx.min-lg.min} h={4} color={nx.color}/></div>}
  </div>}
  <div style={{display:"flex",flexDirection:"column",gap:6}}>
    {weekAll.map(function(pl,i){return(<RankRow key={i} pl={pl} rank={i+1} isMe={pl.me} unit="XP"/>);})}
  </div>
  <p style={{textAlign:"center",fontSize:11,color:"var(--t3)",marginTop:16}}>Resets every Monday · Ranking determines Season points</p>
</div>)}

{/* ── SEASON TAB ── */}
{tab==="season"&&(<div>
  <div className="crd" style={{textAlign:"center",marginBottom:16,padding:20,background:"linear-gradient(135deg,rgba(212,148,58,.04),rgba(139,94,131,.04))"}}>
    <div style={{fontSize:36,marginBottom:6}}>{curSeason.icon}</div>
    <div className="out" style={{fontWeight:800,fontSize:20,color:curSeason.color}}>Season {curSeason.id}: {curSeason.name}</div>
    <div style={{fontSize:12,color:"var(--t2)",marginTop:4}}>{curSeason.weeks.length} weeks · {countdown}</div>
    <div style={{fontSize:11,color:"var(--t3)",marginTop:8,lineHeight:1.5}}>Each week, 1st place gets N pts, 2nd gets N-1, ...<br/>Consistency wins over one big week!</div>
  </div>
  <div style={{display:"flex",flexDirection:"column",gap:6}}>
    {seasonRanking.filter(function(pl){return pl.pts>0;}).map(function(pl,i){return(<RankRow key={i} pl={pl} rank={i+1} isMe={pl.name===u.name} unit="pts"/>);})}
    {seasonRanking.filter(function(pl){return pl.pts>0;}).length===0&&<div className="crd" style={{padding:20,textAlign:"center"}}><p style={{fontSize:13,color:"var(--t3)"}}>No season data yet — start training!</p></div>}
  </div>
</div>)}

{/* ── OVERALL TAB ── */}
{tab==="overall"&&(<div>
  <div className="crd" style={{textAlign:"center",marginBottom:16,padding:20,background:"linear-gradient(135deg,rgba(245,158,11,.04),rgba(139,94,131,.04))"}}>
    <div style={{fontSize:36,marginBottom:6}}>{"🏆"}</div>
    <div className="out" style={{fontWeight:800,fontSize:20,color:"var(--gold)"}}>Overall Ranking</div>
    <div style={{fontSize:12,color:"var(--t2)",marginTop:4}}>Cumulative ranking points across all seasons</div>
    <div style={{fontSize:11,color:"var(--t3)",marginTop:8}}>Top 3 + Top 10 = bonus points on your final grade</div>
  </div>
  {/* Season breakdown mini-bar */}
  <div style={{display:"flex",gap:6,marginBottom:16}}>
    {SEASONS.map(function(s){
      var isCurrent=s.id===curSeason.id;var isPast=s.weeks[s.weeks.length-1]<cw;
      return(<div key={s.id} className="crd" style={{flex:1,padding:"8px 4px",textAlign:"center",borderColor:isCurrent?"rgba(212,148,58,.3)":"var(--bdr)",opacity:(!isCurrent&&!isPast)?0.4:1}}>
        <div style={{fontSize:16}}>{s.icon}</div>
        <div style={{fontSize:9,color:isCurrent?"var(--cyan)":"var(--t3)",fontWeight:isCurrent?700:400}}>S{s.id}</div>
        <div style={{fontSize:8,color:"var(--t3)"}}>{isPast?"Done":isCurrent?"Active":"Soon"}</div>
      </div>);
    })}
  </div>
  <div style={{display:"flex",flexDirection:"column",gap:6}}>
    {overallRanking.filter(function(pl){return pl.pts>0;}).map(function(pl,i){return(<RankRow key={i} pl={pl} rank={i+1} isMe={pl.name===u.name} unit="pts"/>);})}
    {overallRanking.filter(function(pl){return pl.pts>0;}).length===0&&<div className="crd" style={{padding:20,textAlign:"center"}}><p style={{fontSize:13,color:"var(--t3)"}}>No data yet — Season 1 starts March 24!</p></div>}
  </div>
</div>)}

</div>);}

// ─── PROFILE ───
function Profile(p){var u=p.u,lv=getLevel(u.xp),lg=getLeague(u.weeklyXp),acc=u.stats.totalQ>0?Math.round(u.stats.correct/u.stats.totalQ*100):0;
var[pushOn,setPushOn]=useState(false);
useEffect(function(){isPushSubscribed().then(function(v){setPushOn(v);});},[]);
var uC=Object.assign({},u);var ea=ACHIEVEMENTS.filter(function(a){return a.check(uC);});var la=ACHIEVEMENTS.filter(function(a){return!a.check(uC);});
return(<div className="enter" style={{padding:"20px 16px 100px"}}>
<div style={{textAlign:"center",marginBottom:24}}>
<div style={{width:72,height:72,borderRadius:"50%",background:"linear-gradient(135deg,#d4943a,#8b5e83)",display:"flex",alignItems:"center",justifyContent:"center",margin:"0 auto 12px",fontSize:38}}>{u.avatar||"⚔️"}</div>
<h1 className="out" style={{fontWeight:800,fontSize:22}}>{u.name}</h1>
<div style={{display:"flex",justifyContent:"center",gap:16,marginTop:8,flexWrap:"wrap"}}>
<span style={{fontSize:13,color:"var(--t2)"}}>Level {lv.level}</span><span style={{fontSize:13,color:lg.color}}>{lg.icon} {lg.name}</span><span style={{fontSize:13,color:"var(--orange)"}}>🔥 {u.streak}</span></div></div>

<div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:24}}>
{[{l:"Total XP",v:u.xp,i:"⭐"},{l:"Accuracy",v:acc+"%",i:"🎯"},{l:"Sessions",v:u.stats.sessions,i:"📊"},{l:"Cards Reviewed",v:u.stats.cardsRev||0,i:"🃏"},{l:"Drills Done",v:u.stats.drills||0,i:"📝"},{l:"Perfect Dailies",v:u.stats.perfects||0,i:"✨"}].map(function(s){return(
<div key={s.l} className="crd" style={{padding:14,textAlign:"center"}}><div style={{fontSize:18,marginBottom:4}}>{s.i}</div><div className="out" style={{fontSize:20,fontWeight:800}}>{s.v}</div><div style={{fontSize:10,color:"var(--t2)",textTransform:"uppercase",letterSpacing:.5}}>{s.l}</div></div>);})}</div>

<button className="btn2" onClick={function(){
  var code=prompt("Teacher code:");
  if(code===TEACHER_CODE)p.goTeacher();
}} style={{fontSize:13,width:"100%",marginBottom:20,padding:"14px 24px",borderColor:"rgba(212,148,58,.2)",color:"var(--cyan)"}}>👨‍🏫 Teacher Dashboard</button>

<div className="crd" style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:16,marginBottom:20}}>
  <div><div className="out" style={{fontWeight:700,fontSize:14}}>Appearance</div>
    <div style={{fontSize:12,color:"var(--t2)"}}>{u.theme==="light"?"Light mode":"Dark mode"}</div></div>
  <button onClick={function(){var c=JSON.parse(JSON.stringify(u));c.theme=c.theme==="light"?"dark":"light";p.setAvatar(c);}}
    style={{width:52,height:28,borderRadius:14,border:"none",cursor:"pointer",position:"relative",
      background:u.theme==="light"?"var(--cyan)":"var(--t3)",transition:"background .3s"}}>
    <div style={{width:22,height:22,borderRadius:11,background:"#fff",position:"absolute",top:3,
      left:u.theme==="light"?27:3,transition:"left .3s",boxShadow:"0 1px 3px rgba(0,0,0,.2)"}}/>
  </button>
</div>

{/* Sound toggle */}
{function(){
  var soundOn=isSoundEnabled();
  return(<div className="crd" style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:16,marginBottom:20}}>
  <div><div className="out" style={{fontWeight:700,fontSize:14}}>Sound Effects</div>
    <div style={{fontSize:12,color:"var(--t2)"}}>{soundOn?"Sounds on":"Sounds off"}</div></div>
  <button onClick={function(){
    var cur=isSoundEnabled();
    setSoundEnabled(!cur);
    if(!cur)try{playCorrect();}catch(e){}
    if(cur)stopBGM();
    var c=JSON.parse(JSON.stringify(u));p.setAvatar(c);
  }}
    style={{width:52,height:28,borderRadius:14,border:"none",cursor:"pointer",position:"relative",
      background:soundOn?"var(--cyan)":"var(--t3)",transition:"background .3s"}}>
    <div style={{width:22,height:22,borderRadius:11,background:"#fff",position:"absolute",top:3,
      left:soundOn?27:3,transition:"left .3s",boxShadow:"0 1px 3px rgba(0,0,0,.2)"}}/>
  </button>
</div>);}()}

{/* Push Notifications toggle */}
{("PushManager" in window)&&<div className="crd" style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:16,marginBottom:20}}>
  <div><div className="out" style={{fontWeight:700,fontSize:14}}>Notifications</div>
    <div style={{fontSize:12,color:"var(--t2)"}}>{pushOn?"Streak reminders & weekly results":"Disabled"}</div></div>
  <button onClick={function(){
    if(pushOn){unsubscribePush(u.name,u.classCode).then(function(){setPushOn(false);});}
    else{subscribePush(u.name,u.classCode).then(function(sub){if(sub)setPushOn(true);});}
  }}
    style={{width:52,height:28,borderRadius:14,border:"none",cursor:"pointer",position:"relative",
      background:pushOn?"var(--cyan)":"var(--t3)",transition:"background .3s"}}>
    <div style={{width:22,height:22,borderRadius:11,background:"#fff",position:"absolute",top:3,
      left:pushOn?27:3,transition:"left .3s",boxShadow:"0 1px 3px rgba(0,0,0,.2)"}}/>
  </button>
</div>}

{/* Daily Tips toggle */}
{function(){
  var tipOff=false;try{tipOff=localStorage.getItem("toeic-tip-disabled")==="1";}catch(e){}
  return(<div className="crd" style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:16,marginBottom:20}}>
  <div><div className="out" style={{fontWeight:700,fontSize:14}}>Daily Tips</div>
    <div style={{fontSize:12,color:"var(--t2)"}}>Show a TOEIC tip at startup</div></div>
  <button onClick={function(){
    try{
      var cur=localStorage.getItem("toeic-tip-disabled")==="1";
      if(cur){localStorage.removeItem("toeic-tip-disabled");localStorage.removeItem("toeic-tip-date");}
      else{localStorage.setItem("toeic-tip-disabled","1");}
      var c=JSON.parse(JSON.stringify(u));p.setAvatar(c);
    }catch(e){}
  }}
    style={{width:52,height:28,borderRadius:14,border:"none",cursor:"pointer",position:"relative",
      background:tipOff?"var(--t3)":"var(--cyan)",transition:"background .3s"}}>
    <div style={{width:22,height:22,borderRadius:11,background:"#fff",position:"absolute",top:3,
      left:tipOff?3:27,transition:"left .3s",boxShadow:"0 1px 3px rgba(0,0,0,.2)"}}/>
  </button>
</div>);}()}

<h2 className="out" style={{fontWeight:700,fontSize:16,marginBottom:12}}>Avatar</h2>
<div style={{display:"flex",gap:8,flexWrap:"wrap",marginBottom:24}}>
  {["⚔️","🧙","🦊","🐉","🎯","🏆","🦅","💎","🔥","🌟","🎭","🐺","🦁","🎪","👤","🧠","🎲","🦉","🐲","🗡️","🏴‍☠️","⚡","🦈","🌀","🎸"].map(function(av){
    var sel=av===(u.avatar||"⚔️");
    return(<button key={av} onClick={function(){var c=JSON.parse(JSON.stringify(u));c.avatar=av;p.setAvatar(c);}}
      style={{width:44,height:44,borderRadius:12,border:sel?"2px solid var(--cyan)":"2px solid var(--bdr)",
        background:sel?"rgba(212,148,58,.1)":"var(--bg2)",cursor:"pointer",fontSize:22,
        display:"flex",alignItems:"center",justifyContent:"center",transition:"all .2s"}}>
      {av}</button>);
  })}
  {/* Exclusive Game Master avatar — teacher only */}
  {u.name==="Teacher"&&function(){
    var sel=u.avatar==="🗝️";
    return(<button onClick={function(){var c=JSON.parse(JSON.stringify(u));c.avatar="🗝️";p.setAvatar(c);}}
      style={{width:44,height:44,borderRadius:12,border:sel?"2px solid var(--gold)":"2px solid rgba(255,215,0,.3)",
        background:sel?"rgba(255,215,0,.15)":"rgba(255,215,0,.05)",cursor:"pointer",fontSize:22,
        display:"flex",alignItems:"center",justifyContent:"center",transition:"all .2s",
        boxShadow:sel?"0 0 12px rgba(255,215,0,.3)":"none"}}>
      {"🗝️"}</button>);
  }()}
</div>
{u.name==="Teacher"&&<div style={{fontSize:11,color:"var(--gold)",marginTop:-20,marginBottom:20,fontStyle:"italic"}}>{"🗝️"} Game Master — exclusive avatar</div>}
<h2 className="out" style={{fontWeight:700,fontSize:16,marginBottom:12}}>Achievements</h2>
<div style={{display:"flex",flexDirection:"column",gap:8}}>
{ea.map(function(a){return(<div key={a.id} className="crd" style={{display:"flex",alignItems:"center",gap:14,padding:14,background:"rgba(255,215,0,.05)",borderColor:"rgba(255,215,0,.15)"}}>
<div style={{fontSize:24}}>{a.icon}</div><div style={{flex:1}}><div className="out" style={{fontWeight:700,fontSize:14,color:"var(--gold)"}}>{a.name}</div><div style={{fontSize:12,color:"var(--t2)"}}>{a.desc}</div></div></div>);})}
{la.map(function(a){return(<div key={a.id} className="crd" style={{display:"flex",alignItems:"center",gap:14,padding:14,opacity:.4}}>
<div style={{fontSize:24}}>🔒</div><div style={{flex:1}}><div className="out" style={{fontWeight:700,fontSize:14}}>{a.name}</div><div style={{fontSize:12,color:"var(--t2)"}}>{a.desc}</div></div></div>);})}</div>
<div style={{textAlign:"center",marginTop:32}}>
  <button className="btn2" onClick={function(){
    var code=prompt("Enter teacher code to reset:");
    if(code===TEACHER_CODE)p.reset();
  }} style={{fontSize:12,color:"var(--red)",borderColor:"rgba(255,71,87,.2)",width:"100%"}}>Reset all data</button>
</div></div>);}

// ═══════════════════════════════════════════

// ═══════════════════════════════════════════
// MAIN APP
// ═══════════════════════════════════════════
export default function App(){
  var[u,sU]=useState(null);var[ld,sL]=useState(true);var[tab,sT]=useState("home");var[sp,sSP]=useState(null);var[spA,sSPA]=useState(null);var[xpt,sXpt]=useState(null);var[teacherMode,setTeacher]=useState(false);var[achToast,setAchToast]=useState(null);
  var[showTip,setShowTip]=useState(false);
  useEffect(function(){
    if(!xpt||sp)return;
    var t=setTimeout(function(){sXpt(null);},4000);
    return function(){clearTimeout(t);};
  },[xpt,sp]);
  var[activeEvents,setActiveEvents]=useState([]);
  var[classMedianXp,setClassMedianXp]=useState(0);
  var[activeEvents,setActiveEvents]=useState([]);
  var[classMedianXp,setClassMedianXp]=useState(0);

useEffect(function(){
    var loaded=false;
    var sub=supabase.auth.onAuthStateChange(function(event,session){
      if(event==="TOKEN_REFRESHED"){return;} // Skip token refresh — state is already in memory
      if(session&&!loaded){
        load().then(function(d){
          if(d){
            var td=today(),yd=new Date();yd.setDate(yd.getDate()-1);var ys=yd.toISOString().split("T")[0];
            if(d.lastActive!==td&&d.lastActive!==ys)d.streak=0;
            var cw=weekId();if(d.weekId!==cw){
              if(!d.weeklyHistory)d.weeklyHistory=[];
              if(d.weeklyXp>0&&d.weekId){d.weeklyHistory.push({week:d.weekId,xp:d.weeklyXp});if(d.weeklyHistory.length>20)d.weeklyHistory=d.weeklyHistory.slice(-20);}
              d.weeklyXp=0;d.weekId=cw;
            }
            if(!d.moduleScores)d.moduleScores={};
            if(!d.mission)d.mission={date:null,actId:null,done:false};
            if(!d.dailyModSessions)d.dailyModSessions={};
			if(!d.unlockedAch)d.unlockedAch=[];
			if(!d.avatar)d.avatar="⚔️";
			if(!d.theme)d.theme="dark";
            sU(d);
            // Show daily tip if not disabled and not already shown today
            try{
              var tipDisabled=localStorage.getItem("toeic-tip-disabled")==="1";
              var tipDate=localStorage.getItem("toeic-tip-date");
              if(!tipDisabled&&tipDate!==today())setShowTip(true);
            }catch(e){}
            loaded=true;
          }
          sL(false);
        });
      }else if(!session){
        sL(false);
      }
    });
    // Also check immediately in case session is already restored
    supabase.auth.getSession().then(function(res){
      if(!res.data.session)sL(false);
    });
    return function(){sub.data.subscription.unsubscribe();};
  },[]);
  
  // ── Load active events from Supabase (once + every 5 min) ──
  useEffect(function(){
    if(!u)return;
    function loadEvents(){
      var now=new Date().toISOString();
      supabase.from('events').select('*').eq('active',true).lte('start_at',now).gte('end_at',now)
        .then(function(res){
          var evts=(res.data||[]).filter(function(e){
            return e.class_code==='all'||e.class_code===(u.classCode||'idrac2026');
          });
          setActiveEvents(evts);
        });
      supabase.from('students').select('xp').eq('class_code',u.classCode||'idrac2026')
        .then(function(res){
          if(!res.data||res.data.length<3){setClassMedianXp(0);return;}
          var xps=res.data.map(function(s){return s.xp||0;}).sort(function(a,b){return a-b;});
          var mid=Math.floor(xps.length/2);
          setClassMedianXp(xps.length%2?xps[mid]:Math.round((xps[mid-1]+xps[mid])/2));
        });
    }
    loadEvents();
    var iv=setInterval(loadEvents,300000); // refresh every 5 min
    return function(){clearInterval(iv);};
  },[u&&u.name]);

  // ── Auto-start Home BGM on first user interaction ──
  var bgmStarted=useRef(false);
  useEffect(function(){
    if(ld||!u||bgmStarted.current)return;
    function startBGM(){bgmStarted.current=true;if(tab==="home")playBGM("bgm_home");document.removeEventListener("click",startBGM);document.removeEventListener("touchstart",startBGM);}
    document.addEventListener("click",startBGM,{once:true});
    document.addEventListener("touchstart",startBGM,{once:true});
    return function(){document.removeEventListener("click",startBGM);document.removeEventListener("touchstart",startBGM);};
  },[ld]);

  // ── Time tracking: increment every 60s, save every 5 min ──
  var timeRef=useRef({ticks:0});
  useEffect(function(){
    if(!u)return;
    var iv=setInterval(function(){
      sU(function(prev){
        if(!prev)return prev;
        var c=JSON.parse(JSON.stringify(prev));
        c.totalTime=(c.totalTime||0)+60;
        timeRef.current.ticks+=1;
        if(timeRef.current.ticks%5===0) save(c); // save every 5 min
        return c;
      });
    },60000);
    function onVis(){
      if(document.visibilityState==="hidden"){
        sU(function(prev){
          if(!prev)return prev;
          save(prev);
          return prev;
        });
      }
    }
    document.addEventListener("visibilitychange",onVis);
    return function(){clearInterval(iv);document.removeEventListener("visibilitychange",onVis);};
  },[!!u]);

  var saveTimer=useRef(null);
  function sv(d){
    // Check for new achievements
    if(d&&d.unlockedAch){
      ACHIEVEMENTS.forEach(function(a){
        if(a.check(d)&&d.unlockedAch.indexOf(a.id)===-1){
          d.unlockedAch.push(a.id);
          try{playJingleAchieve();}catch(e){}
          setAchToast({name:a.name,icon:a.icon,desc:a.desc});
          setTimeout(function(){setAchToast(null);},3500);
        }
      });
    }
    sU(d); // instant local update
    // Debounce Supabase write — batches rapid actions into one save
    if(saveTimer.current)clearTimeout(saveTimer.current);
    saveTimer.current=setTimeout(function(){save(d);},1500);
  }
  function applyXpGates(baseXp,sc,tot,modId){
    // ── PILIER 1 : seuil d'accuracy ──
    var gatedXp=baseXp;
    if(tot>0){
      var acc=sc/tot;
      if(acc<0.30)gatedXp=Math.max(5,Math.round(baseXp*0.10));
      else if(acc<0.50)gatedXp=Math.round(baseXp*0.50);
      // ≥50% : formule normale, pas de pénalité
    }
    // ── PILIER 2 : diminishing returns anti-farming ──
    if(modId){
      var dms=u.dailyModSessions||{};
      var key=modId+"_"+today();
      var sessionCount=dms[key]||0;
      // 1ère session : 100% — 2ème : 50% — 3ème : 15% — 4ème+ : 0 XP
      var farmMult=sessionCount===0?1:sessionCount===1?0.5:sessionCount===2?0.15:0;
      gatedXp=Math.round(gatedXp*farmMult);
    }
    return Math.max(0,gatedXp);
  }
  function addXp(baseAmt){if(baseAmt>0)try{playXP();}catch(e){}
    var c=JSON.parse(JSON.stringify(u));var td=today();var bonuses=[];var isFirstToday=c.lastActive!==td;

    // Update streak
    if(isFirstToday){var yd=new Date();yd.setDate(yd.getDate()-1);c.streak=c.lastActive===yd.toISOString().split("T")[0]?c.streak+1:1;c.lastActive=td;}

    // Calculate multipliers (only on positive XP — losses are never multiplied)
    var mult=1;var amt=baseAmt;

    if(baseAmt>0){
      // Weekend bonus (Saturday=6, Sunday=0)
      var dow=new Date().getDay();
      if(dow===0||dow===6){mult*=2;bonuses.push({label:"Weekend x2",color:"#ff6bff"});}

      // Streak multiplier
      if(c.streak>=7){mult*=1.5;bonuses.push({label:"Streak x1.5 ("+c.streak+"d)",color:"#ff8c42"});}
      else if(c.streak>=3){mult*=1.2;bonuses.push({label:"Streak x1.2 ("+c.streak+"d)",color:"#ff8c42"});}

      console.log("EVENT_DEBUG:",JSON.stringify(activeEvents),activeEvents&&activeEvents.length);
      // Event multipliers
      console.log("MULT_BEFORE:", mult);
      if(activeEvents&&activeEvents.length>0){
        activeEvents.forEach(function(ev){
          var cfg=ev.config||{};var m=cfg.multiplier||2;
          console.log("EV_CHECK:", ev.type, "m=", m, "type===flash_hour?", ev.type==="flash_hour");
          if(ev.type==="flash_hour"){mult*=m;bonuses.push({label:"\u26A1 Flash Hour x"+m,color:"#f0c850"});}
          if(ev.type==="underdog"&&c.xp<classMedianXp){mult*=m;bonuses.push({label:"\uD83D\uDCAA Underdog x"+m,color:"#4abe60"});}
        });
      }
      console.log("MULT_AFTER:", mult, "bonuses:", JSON.stringify(bonuses));


      amt=Math.round(baseAmt*mult);

      // Daily login bonus (first activity of the day)
      if(isFirstToday){amt+=10;bonuses.push({label:"+10 daily login",color:"#00e676"});}
    }

var prevLeague=getLeague(c.weeklyXp);
    c.xp+=amt;c.weeklyXp+=amt;
    // Floor: never go below 0 XP
    if(c.xp<0)c.xp=0;
    if(c.weeklyXp<0)c.weeklyXp=0;
    var newLeague=getLeague(c.weeklyXp);
    if(newLeague.id!==prevLeague.id&&c.weeklyXp>prevLeague.min)try{playJingleLeague();}catch(e){}
    var toastInfo={total:amt,base:baseAmt,bonuses:bonuses};
    sXpt(toastInfo);
    return c;
  }
  function getSpotlightMult(modId){
    if(!activeEvents)return 1;
    var m=1;
    activeEvents.forEach(function(ev){
      if(ev.type==="spotlight"&&ev.config&&ev.config.module===modId)m=ev.config.multiplier||2;
    });
    return m;
  }
  function getSpotlightMult(modId){
    if(!activeEvents)return 1;
    var m=1;
    activeEvents.forEach(function(ev){
      if(ev.type==="spotlight"&&ev.config&&ev.config.module===modId)m=ev.config.multiplier||2;
    });
    return m;
  }
  function nav(pg,arg){stopBGM();sSP(pg);sSPA(arg||null);}
  async function onboard(name,classCode,placementScore,lvl){
    classCode=classCode||'idrac2026';
    // Check if student already exists (use limit(1) — safe even with duplicates)
    var existing=await supabase.from('students').select('*').eq('name',name).eq('class_code',classCode).order('xp',{ascending:false}).limit(1);
    if(existing.data&&existing.data.length>0){
      // Student exists — recover instead of creating duplicate
      var recovered=await recover(name,classCode);
      if(recovered)return;
    }

    // Get or create auth session
    var sess=await supabase.auth.getSession();
    var userId=sess.data.session?sess.data.session.user.id:null;
    if(!userId){
      var authRes=await supabase.auth.signInAnonymously();
      if(!authRes.data.user)return;
      userId=authRes.data.user.id;
    }

    var u=fresh(name,classCode);
    if(lvl){u.xp=lvl.startXp;u.weeklyXp=lvl.startXp;}
    if(placementScore!==undefined){
      u.stats.totalQ=15;u.stats.correct=placementScore;u.stats.sessions=1;
      PLACEMENT_TEST.forEach(function(q,i){
        var answered=i<15;
        if(answered){
          var cat=q.cat;var modMap={"Tenses":"drill","Passive Voice":"drill","Prepositions":"prepdrill","Word Families":"wordfam","Connectors":"connsort","Subject-Verb Agreement":"drill","Gerunds vs Infinitives":"gerinf","Conditionals":"drill","Relative Pronouns":"drill","Collocations":"drill","Comparatives":"drill","Articles":"drill"};
          var modId=modMap[cat]||"drill";
          if(!u.moduleScores[modId])u.moduleScores[modId]={correct:0,total:0,sessions:1,lastDate:today()};
          u.moduleScores[modId].total+=1;
        }
      });
    }
    sU(u);
    try { localStorage.setItem('toeic-arena-name', name); } catch(e) {}
    try { localStorage.setItem('toeic-arena-class', classCode); } catch(e) {}
    // save() handles insert-by-name or update-by-name — no duplicate possible
    save(u);
  }
  async function recover(name,classCode){
    // Find the best row (highest XP) for this student
    var res=await supabase.from('students').select('*').eq('name',name).eq('class_code',classCode).order('xp',{ascending:false}).limit(1);
    if(!res.data||res.data.length===0)return false;
    var d=res.data[0];

    // Get or create auth session
    var sess=await supabase.auth.getSession();
    var userId=sess.data.session?sess.data.session.user.id:null;
    if(!userId){
      var authRes=await supabase.auth.signInAnonymously();
      if(!authRes.data.user)return false;
    }

    try { localStorage.setItem('toeic-arena-name', name); } catch(e) {}
    try { localStorage.setItem('toeic-arena-class', classCode); } catch(e) {}
    var u={name:d.name,classCode:classCode||d.class_code||'idrac2026',xp:d.xp||0,weeklyXp:d.weekly_xp||0,weekId:d.week_id,streak:d.streak||0,
      lastActive:d.last_active,cardStates:d.card_states||{},daily:d.daily_challenge||{date:null,done:false,score:0,xpE:0},
      stats:d.stats||{totalQ:0,correct:0,sessions:0,cardsRev:0,perfects:0,drills:0},
      moduleScores:d.module_scores||{},mockResults:d.mock_results||{},gameScores:d.game_scores||{},mission:d.mission||{date:null,actId:null,done:false},
      unlockedAch:d.unlocked_ach||[],avatar:d.avatar||"⚔️",theme:d.theme||"dark",totalTime:d.total_time||0,weeklyHistory:d.weekly_history||[]};
    if(!u.moduleScores)u.moduleScores={};
    if(!u.mission)u.mission={date:null,actId:null,done:false};
    if(!u.unlockedAch)u.unlockedAch=[];
    sU(u);
    // save() will update by name — handles duplicates automatically
    save(u);
    return true;
  }
 
  function goTeacher(){setTeacher(true);}
  function mockDone(result,xp){var c=addXp(xp);c.stats.totalQ+=result.total;c.stats.correct+=result.score;c.stats.sessions+=1;if(!c.mockResults)c.mockResults={};c.mockResults["mock"+result.mockId]=result;recordModule(c,"mock"+result.mockId,result.score,result.total);try{if(result.total>0&&result.score/result.total>=0.7)playJingleMock();else playJingleMockOk();}catch(e){}sv(c);}
  function gameDone(modeKey,result,xp){var c=addXp(xp);if(!c.gameScores)c.gameScores={};
    if(modeKey==="duel"){
      // Accumulate duel stats instead of overwriting
      var prev=c.gameScores.duel||{wins:0,played:0,wagerWon:0};
      c.gameScores.duel={wins:prev.wins+(result.won?1:0),played:prev.played+1,wagerWon:(prev.wagerWon||0)+(result.wagerWon||0)};
    } else {
      var prev2=c.gameScores[modeKey];var dominated=!prev2||(result.time!==undefined?result.time<prev2.time:(result.score>prev2.score||(result.score===prev2.score&&result.maxCombo>(prev2.maxCombo||0))));if(dominated){c.gameScores[modeKey]=result;}else if(prev2&&result.maxCombo!==undefined&&result.maxCombo>(prev2.maxCombo||0)){c.gameScores[modeKey]=Object.assign({},prev2,{maxCombo:result.maxCombo});}
    }
    c.stats.sessions+=1;sv(c);sSP(null);sT("games");}
  function trackModSession(c,modId){if(!c.dailyModSessions)c.dailyModSessions={};var key=modId+"_"+today();c.dailyModSessions[key]=(c.dailyModSessions[key]||0)+1;}
  function dailyDone(sc,xp){var gxp=applyXpGates(xp,sc,5,"daily");var c=addXp(gxp);c.daily={date:today(),done:true,score:sc,xpE:gxp};c.stats.totalQ+=5;c.stats.correct+=sc;c.stats.sessions+=1;if(sc===5)c.stats.perfects=(c.stats.perfects||0)+1;trackModSession(c,"daily");recordModule(c,"daily",sc,5);checkMission(c,"daily");try{playJingleDaily();}catch(e){}sv(c);}
  function drillDone(sc,tot,xp){var gxp=applyXpGates(xp,sc,tot,"drill");var c=addXp(gxp);c.stats.totalQ+=tot;c.stats.correct+=sc;c.stats.sessions+=1;c.stats.drills=(c.stats.drills||0)+1;trackModSession(c,"drill");recordModule(c,"drill",sc,tot);checkMission(c,"drill");sv(c);}
  function miniDone(sc,tot,xp){var modId=sp||"unknown";var gxp=applyXpGates(xp,sc,tot,modId);gxp=Math.round(gxp*getSpotlightMult(modId));var c=addXp(gxp);c.stats.totalQ+=tot;c.stats.correct+=sc;c.stats.sessions+=1;trackModSession(c,modId);recordModule(c,modId,sc,tot);checkMission(c,modId);sv(c);}
  function rateCard(id,r){var c=JSON.parse(JSON.stringify(u));var ex=c.cardStates[id]||{ease:2.5,interval:0,nextReview:today(),correct:0,total:0};c.cardStates[id]=srsUp(ex,r);c.stats.cardsRev=(c.stats.cardsRev||0)+1;sv(c);}
  function cardsDone(xp){var modId=sp==="cdom"?"csess":sp;var c=addXp(xp);c.stats.sessions+=1;recordModule(c,"csess",1,1);checkMission(c,"csess");sv(c);sSP(null);}
  async function reset(){
    var sess=await supabase.auth.getSession();
    if(sess.data.session){
      await supabase.from('students').delete().eq('id',sess.data.session.user.id);
      await supabase.auth.signOut();
    }
    sU(null);sSP(null);sT("home");
  }

  var lc="app"+(u&&u.theme==="light"?" light":"");
  if(ld)return(<div className={lc}><style>{CSS}</style><div style={{display:"flex",alignItems:"center",justifyContent:"center",minHeight:"100vh"}}><div style={{textAlign:"center"}}><div style={{fontSize:48,animation:"pulse 1.5s infinite"}}>⚔️</div><p className="out" style={{color:"var(--t2)",marginTop:12}}>Loading Arena...</p></div></div></div>);
  if(teacherMode)return(<div className={lc}><style>{CSS}</style><TeacherDash back={function(){setTeacher(false);}}/></div>);
  if(!u)return(<div className={lc}><style>{CSS}</style><Onboard go={onboard} goTeacher={goTeacher} recover={recover}/></div>);
  if(sp==="daily")return(<div className={lc}><style>{CSS}</style><Daily u={u} done={dailyDone} back={function(){sSP(null);}}/></div>);
  if(sp==="csess"||sp==="cdom")return(<div className={lc}><style>{CSS}</style><CardSess u={u} domId={spA} rate={rateCard} done={cardsDone} back={function(){sSP(null);}}/></div>);
  if(sp==="drill")return(<div className={lc}><style>{CSS}</style><Drill u={u} done={drillDone} back={function(){sSP(null);sT("train");}}/></div>);
  if(sp==="wordfam")return(<div className={lc}><style>{CSS}</style><WordFam u={u} done={miniDone} back={function(){sSP(null);sT("train");}}/></div>);
  if(sp==="connsort")return(<div className={lc}><style>{CSS}</style><ConnSort u={u} done={miniDone} back={function(){sSP(null);sT("train");}}/></div>);
  if(sp==="prepdrill")return(<div className={lc}><style>{CSS}</style><PrepDrill u={u} done={miniDone} back={function(){sSP(null);sT("train");}}/></div>);
  if(sp==="gerinf")return(<div className={lc}><style>{CSS}</style><GerInf u={u} done={miniDone} back={function(){sSP(null);sT("train");}}/></div>);
  if(sp==="traps")return(<div className={lc}><style>{CSS}</style><TrapsQuiz u={u} done={miniDone} back={function(){sSP(null);sT("train");}}/></div>);
  if(sp==="falsefr")return(<div className={lc}><style>{CSS}</style><FalseFriends u={u} done={miniDone} back={function(){sSP(null);sT("train");}}/></div>);
  if(sp==="pvdojo")return(<div className={lc}><style>{CSS}</style><PhrasalDojo u={u} done={miniDone} back={function(){sSP(null);sT("train");}}/></div>);
  if(sp==="mock1")return(<div className={lc}><style>{CSS}</style><MockTest mockId={1} u={u} done={mockDone} back={function(){sSP(null);sT("train");}}/></div>);
  if(sp==="mock2")return(<div className={lc}><style>{CSS}</style><MockTest mockId={2} u={u} done={mockDone} back={function(){sSP(null);sT("train");}}/></div>);
  if(sp==="mock3")return(<div className={lc}><style>{CSS}</style><MockTest mockId={3} u={u} done={mockDone} back={function(){sSP(null);sT("train");}}/></div>);
  if(sp==="smatch")return(<div className={lc}><style>{CSS}</style><SpeedMatchHub u={u} nav={nav} back={function(){sSP(null);sT("games");}}/></div>);
if(sp==="matchE"){playBGM("bgm_speed");return(<div className={lc}><style>{CSS}</style><SpeedMatch mode="easy" u={u} done={function(mk,res,xp){stopBGM();gameDone(mk,res,xp);}} back={function(){stopBGM();sSP("smatch");}}/></div>);}
  if(sp==="matchH"){playBGM("bgm_speed");return(<div className={lc}><style>{CSS}</style><SpeedMatch mode="hard" u={u} done={function(mk,res,xp){stopBGM();gameDone(mk,res,xp);}} back={function(){stopBGM();sSP("smatch");}}/></div>);}
 if(sp==="wfall"){playBGM("bgm_wfall");return(<div className={lc}><style>{CSS}</style><WordFall u={u} done={function(mk,res,xp){stopBGM();gameDone(mk,res,xp);}} back={function(){stopBGM();sSP(null);sT("games");}}/></div>);}
if(sp==="duel"){playBGM("bgm_duel");return(<div className={lc}><style>{CSS}</style><DuelArena u={u} done={function(mk,res,xp){stopBGM();gameDone(mk,res,xp);}} back={function(){stopBGM();sSP(null);sT("games");}}/></div>);}
  if(sp==="sbuild"){playBGM("bgm_speed");return(<div className={lc}><style>{CSS}</style><SentenceBuilder u={u} done={function(sc,tot,xp){stopBGM();var c=addXp(xp);c.stats.totalQ+=tot;c.stats.correct+=sc;c.stats.sessions+=1;recordModule(c,"sbuild",sc,tot);sv(c);sSP(null);sT("games");}} back={function(){stopBGM();sSP(null);sT("games");}}/></div>);}
  if(sp==="clue"){playBGM("bgm_clue");return(<div className={lc}><style>{CSS}</style><ClueHunter u={u} done={function(sc,tot,xp){stopBGM();var c=addXp(xp);c.stats.totalQ+=tot;c.stats.correct+=sc;c.stats.sessions+=1;recordModule(c,"clue",sc,tot);checkMission(c,"clue");sv(c);sSP(null);sT("games");}} back={function(){stopBGM();sSP(null);sT("games");}}/></div>);}
  if(sp==="ablitz")return(<div className={lc}><style>{CSS}</style><AudioBlitz u={u} done={function(sc,tot,xp){var c=addXp(xp);c.stats.totalQ+=tot;c.stats.correct+=sc;c.stats.sessions+=1;recordModule(c,"ablitz",sc,tot);sv(c);sSP(null);sT("games");}} back={function(){sSP(null);sT("games");}}/></div>);
  if(sp==="strats")return(<div className={lc}><style>{CSS}</style><StratCards back={function(){sSP(null);}}/></div>);
  if(sp==="gramref")return(<div className={lc}><style>{CSS}</style><GrammarRef initial={spA} back={function(){sSP(null);sSPA(null);}}/></div>);
  if(sp==="stratquiz")return(<div className={lc}><style>{CSS}</style><StratQuizPage u={u} done={miniDone} back={function(){sSP(null);sT("train");}}/></div>);
  if(sp==="timesim")return(<div className={lc}><style>{CSS}</style><TimeSim u={u} done={miniDone} nav={nav} back={function(){sSP(null);sT("train");}}/></div>);
  if(sp==="p6")return(<div className={lc}><style>{CSS}</style><Part6Drill u={u} done={miniDone} back={function(){sSP(null);sT("train");}}/></div>);
  if(sp==="p7")return(<div className={lc}><style>{CSS}</style><Part7Read u={u} done={miniDone} back={function(){sSP(null);sT("train");}}/></div>);
  if(sp==="lis")return(<div className={lc}><style>{CSS}</style><ListenHub nav={nav} back={function(){sSP(null);sT("train");}}/></div>);
  if(sp==="lisP1")return(<div className={lc}><style>{CSS}</style><ListenP1 u={u} done={miniDone} back={function(){sSP("lis");}}/></div>);
  if(sp==="read")return(<div className={lc}><style>{CSS}</style><ReadingHub nav={nav} back={function(){sSP(null);sT("train");}}/></div>);
  if(sp==="lisP2")return(<div className={lc}><style>{CSS}</style><ListenP2 u={u} done={miniDone} back={function(){sSP("lis");}}/></div>);
  if(sp==="lisP3")return(<div className={lc}><style>{CSS}</style><ListenP3 u={u} done={miniDone} back={function(){sSP("lis");}}/></div>);
  if(sp==="lisP4")return(<div className={lc}><style>{CSS}</style><ListenP4 u={u} done={miniDone} back={function(){sSP("lis");}}/></div>);

  return(<div className={"app"+(u&&u.theme==="light"?" light":"")}><style>{CSS}</style>{xpt&&<XpToast v={xpt}/>}{achToast&&<AchToast v={achToast}/>}
    {showTip&&u&&<DailyTip u={u} close={function(){setShowTip(false);}}/>}
    {tab==="home"&&<Home u={u} nav={nav} events={activeEvents} medianXp={classMedianXp} onMount={function(){playBGM("bgm_home");}} onLeave={function(){stopBGM();}}/>}{tab==="train"&&<Train u={u} nav={nav}/>}{tab==="cards"&&<Cards u={u} nav={nav}/>}{tab==="games"&&<GamesHub u={u} nav={nav}/>}{tab==="league"&&<League u={u}/>}{tab==="profile"&&<Profile u={u} reset={reset} setAvatar={function(c){sv(c);}} goTeacher={function(){setTeacher(true);}}/>}
    <Tabs cur={tab} go={function(t){if(t==="home"||t==="league"||t==="profile")playBGM("bgm_home");else stopBGM();sT(t);sSP(null);}}/></div>);
}