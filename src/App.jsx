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
import { BATTLE_SCAN, SCAN_STATS, FIRST_MISSIONS, MISSION_MODULES } from "./data/placement.js";
import { PHRASAL_VERBS } from "./data/phrasalVerbs.js";
import { SENTENCES } from "./data/sentences.js";
import { AUDIO_BLITZ } from "./data/audioBlitz.js";
import { CLUE_HUNTER } from "./data/clueHunter.js";
import { CHEST_TYPES, RARITIES, AVATARS, SKINS, UNIQUE_TRIGGERS, LEGENDARY_ACHIEVEMENTS, EPIC_ACHIEVEMENTS, NOVICE_ACHIEVEMENTS, rollRarity, pickReward, hasUniqueTrigger, isWeeklyCooldown, grantChest, getPendingChests, getOwnedRewards, openChestFromPending } from "./data/chests.js";
import { GAME_ICON_PATHS, GAME_ICON_VIEWBOX } from "./data/avatarIcons.js";
import { MOCK1_P5, MOCK2_P5, MOCK3_P5, MOCK1_P6, MOCK2_P6, MOCK3_P6, MOCK1_P7, MOCK2_P7, MOCK3_P7} from "./data/mockTests.js";
import { BOSS_P1, BOSS_P2, BOSS_P3, BOSS_P4, BOSS_P5, BOSS_P6, BOSS_P7 } from "./data/bossTestFull.js";
import { IRREGULAR_VERBS, TENSE_CHRONOMANCER, PASSIVE_FORGE, RELATIVE_WEAVER } from "./data/grammarGauntlet.js";
import { GRIMOIRE_CHRONOMANCER, GRIMOIRE_PASSIVE_FORGE, GRIMOIRE_RELATIVE_WEAVER } from "./data/grammarGauntletGrimoire.js";
import { GRIMOIRE_GERUND } from "./data/gerundGrimoire.js";
import { GRIMOIRE_PHRASAL } from "./data/phrasalGrimoire.js";
import { GRIMOIRE_CONNECTORS } from "./data/connectorsGrimoire.js";


function today(){return new Date().toISOString().split("T")[0];}

// ─── TTS ENGINE (pre-generated MP3 → browser TTS fallback) ───
var _voices=null;
function getEnVoice(){
  if(_voices)return _voices;
  var all=window.speechSynthesis?window.speechSynthesis.getVoices():[];
  // Safari on macOS/iOS returns lang codes like "en-US", "en_US", "en_us" inconsistently.
  // Normalize to lowercase and accept both separators.
  function isEn(v){
    if(!v||!v.lang)return false;
    var l=v.lang.toLowerCase().replace(/_/g,"-");
    return l.indexOf("en")===0&&(l.length===2||l.charAt(2)==="-");
  }
  // Prefer high-quality voices on Safari (Enhanced/Premium in voice name).
  // Then en-US > en-GB > en-AU > any en.
  var enVoices=all.filter(isEn);
  if(enVoices.length===0){
    // NEVER fall back to non-English. Returning null lets the browser pick based on u.lang,
    // which is safer than explicitly assigning a French voice on a FR-locale device.
    return null;
  }
  var pref=["en-us","en-gb","en-au"];
  for(var p=0;p<pref.length;p++){
    for(var i=0;i<enVoices.length;i++){
      var lg=enVoices[i].lang.toLowerCase().replace(/_/g,"-");
      if(lg===pref[p]){_voices=enVoices[i];return _voices;}
    }
  }
  // Any English voice
  _voices=enVoices[0];return _voices;
}
var _audioCache={};
var _mp3Failed={};
async function speak(text,rate,audioPath){
  // Respect abort flag — if component unmounted, don't start new audio.
  if(_audioAborted)return;
  // If an explicit MP3 path is given, try it first
  if(audioPath&&!_mp3Failed[audioPath]){
    if(_audioCache[audioPath]){
      var a=_audioCache[audioPath].cloneNode();
      a.playbackRate=rate||0.9;
      // Track so stopListenAudio can kill it on unmount.
      if(_listenAudio){try{_listenAudio.pause();_listenAudio.src="";}catch(e){}}
      _listenAudio=a;
      a.play().catch(function(){});
      return;
    }
    try{
      var audio=new Audio(audioPath);
      await new Promise(function(resolve,reject){
        audio.oncanplaythrough=resolve;
        audio.onerror=reject;
        audio.load();
      });
      if(_audioAborted)return;
      audio.playbackRate=rate||0.9;
      _audioCache[audioPath]=audio;
      if(_listenAudio){try{_listenAudio.pause();_listenAudio.src="";}catch(e){}}
      _listenAudio=audio;
      audio.play().catch(function(){});
      return;
    }catch(e){_mp3Failed[audioPath]=true;}
  }
  // Fallback to browser TTS
  if(!window.speechSynthesis)return;
  if(_audioAborted)return;
  window.speechSynthesis.cancel();
  var u=new SpeechSynthesisUtterance(text);
  u.rate=rate||0.9;u.pitch=1;u.volume=1;
  // Set lang BEFORE voice — Safari bug: voice assignment can override/lock language otherwise
  u.lang="en-US";
  var v=getEnVoice();if(v)u.voice=v;
  window.speechSynthesis.speak(u);
}
function speakAndWait(text,rate,audioPath){
  return new Promise(function(resolve){
    if(_audioAborted){resolve();return;}
    if(audioPath&&!_mp3Failed[audioPath]){
      if(_audioCache[audioPath]){
        var a=_audioCache[audioPath].cloneNode();
        a.playbackRate=rate||0.9;
        a.onended=resolve;a.onerror=resolve;
        if(_listenAudio){try{_listenAudio.pause();_listenAudio.src="";}catch(e){}}
        _listenAudio=a;
        a.play().catch(resolve);
        return;
      }
      var audio=new Audio(audioPath);
      audio.oncanplaythrough=function(){
        if(_audioAborted){resolve();return;}
        audio.playbackRate=rate||0.9;
        _audioCache[audioPath]=audio;
        audio.onended=resolve;audio.onerror=resolve;
        if(_listenAudio){try{_listenAudio.pause();_listenAudio.src="";}catch(e){}}
        _listenAudio=audio;
        audio.play().catch(resolve);
      };
      audio.onerror=function(){_mp3Failed[audioPath]=true;speakBrowserTTS(text,rate,resolve);};
      audio.load();
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
  // Set lang BEFORE voice — Safari bug: voice assignment can override/lock language otherwise
  u.lang="en-US";
  var v=getEnVoice();if(v)u.voice=v;
  u.onend=cb;u.onerror=cb;
  window.speechSynthesis.speak(u);
}

// Track the currently-playing listening audio so we can stop it on unmount/Quit.
// Otherwise audio keeps playing in background after the user exits a listening exercise.
//
// GUARD: _audioAborted flag is essential to kill in-flight async sequences.
// Before this fix, stopListenAudio stopped the CURRENT audio but the async
// playQuestion()/playP1()/etc sequences kept running their await chain and
// started the NEXT audio clip after the user had already navigated away
// (Part 2 bug reported 2026-04-22). Each audio-exercise component must call
// resumeAudioSession() on mount (via useEffect) to reset the flag, and
// stopListenAudio() on unmount to abort in-flight sequences.
var _listenAudio=null;
var _audioAborted=false;
function playAudioFile(url){
  return new Promise(function(resolve){
    // Sequence was aborted (component unmounted) — bail out immediately,
    // don't create a new Audio object for the next clip in the chain.
    if(_audioAborted){resolve();return;}
    // Abort any previous audio still playing from this helper
    if(_listenAudio){try{_listenAudio.pause();_listenAudio.src="";}catch(e){}_listenAudio=null;}
    var audio=new Audio(url);
    _listenAudio=audio;
    function cleanup(){if(_listenAudio===audio)_listenAudio=null;resolve();}
    audio.onended=cleanup;
    audio.onerror=function(){console.warn("Audio not found: "+url);cleanup();};
    audio.play().catch(cleanup);
  });
}
function stopListenAudio(){
  _audioAborted=true;
  if(_listenAudio){try{_listenAudio.pause();_listenAudio.src="";}catch(e){}_listenAudio=null;}
  // Also cancel any active browser TTS (speechSynthesis) — speak() fallback
  // uses window.speechSynthesis which has its own queue, distinct from _listenAudio.
  try{if(window.speechSynthesis)window.speechSynthesis.cancel();}catch(e){console.warn("[audio] tts cancel:",e&&e.message);}
}
function resumeAudioSession(){_audioAborted=false;}
// Preload voices (some browsers need this)
if(window.speechSynthesis){window.speechSynthesis.onvoiceschanged=function(){_voices=null;getEnVoice();};}

// ─── GAME-ICON SVG HELPER ───
// Renders an Iconify game-icons SVG by name. Use: <GIcon name="castle" size={26} color="var(--cyan)"/>
function GIcon(p){
  var pth=GAME_ICON_PATHS[p.name]||"";
  var sz=p.size||20;
  var sty=Object.assign({color:p.color||"currentColor",display:p.block?"block":"inline-block",verticalAlign:"middle",flexShrink:0},p.style||{});
  return(<svg viewBox="0 0 512 512" width={sz} height={sz} style={sty}><g fill="currentColor" dangerouslySetInnerHTML={{__html:pth}}/></svg>);
}

// ─── AUDIO BUTTON COMPONENT ───
function SpeakBtn(p){
  var[playing,sP]=useState(false);
  function go(){
    // User-initiated play: reset the abort flag left behind by any prior
    // Listen/Boss/AudioBlitz unmount. Without this, speak() silently returns
    // if abort was still set when the user reaches Flashcards/Tavern/SpeakBtn.
    resumeAudioSession();
    sP(true);
    speak(p.text,p.rate||0.9,p.audio||null);
    setTimeout(function(){sP(false);},Math.max(1000,p.text.length*80));
  }
  return(<button onClick={function(e){e.stopPropagation();go();}}
    style={{display:"inline-flex",alignItems:"center",justifyContent:"center",width:p.size||36,height:p.size||36,borderRadius:"50%",
      background:playing?"rgba(var(--cx),.2)":"var(--bg3)",border:"1px solid "+(playing?"var(--cyan)":"var(--bdr)"),
      cursor:"pointer",transition:"all .2s",flexShrink:0}}>
    <span style={{fontSize:p.size?p.size*0.5:18,lineHeight:1}}>{playing?"🔊":"🔈"}</span>
  </button>);
}
function weekId(){var d=new Date();var day=d.getDay();var diff=d.getDate()-day+(day===0?-6:1);var mon=new Date(d);mon.setDate(diff);mon.setHours(0,0,0,0);var jan1=new Date(mon.getFullYear(),0,1);var wk=Math.floor((mon-jan1)/(7*864e5))+1;return mon.getFullYear()+"-W"+wk;}
// Push a weekly_snapshots row for the week that just ended. Fire-and-forget.
// Called from both load-time and mid-session week transitions so that snapshots
// are never missed regardless of when the transition is detected.
function pushWeeklySnapshot(snap){
  try{
    supabase.auth.getUser().then(function(r){
      if(!r.data||!r.data.user)return;
      var parts=(snap.weekId||"").split('-W');
      if(parts.length!==2)return;
      var yr=parseInt(parts[0]),wk=parseInt(parts[1]);
      var jan1=new Date(yr,0,1);
      var ws=new Date(jan1.getTime()+(wk-1)*7*86400000);
      var dy=ws.getDay();ws.setDate(ws.getDate()+(dy===0?-6:1-dy));
      supabase.from('weekly_snapshots').upsert({
        user_id:r.data.user.id,
        student_name:snap.name,
        class_code:snap.classCode||'visitor',
        week_id:snap.weekId,
        week_start:ws.toISOString().split('T')[0],
        xp_this_week:snap.weeklyXp,
        xp_cumulative:snap.xp,
        daily_completions:snap.weeklyDailyCount||0,
        streak_at_end:snap.streak,
        stats_snapshot:snap.stats,
        module_scores_snapshot:snap.moduleScores,
        mock_results_snapshot:snap.mockResults||{},
        achievements_count:(snap.unlockedAch||[]).length
      },{onConflict:'student_name,class_code,week_id'})
      .then(function(res){if(res.error)console.error('Snapshot error:',res.error.message);});
    });
  }catch(e){}
}

// Applies a week transition if the stored weekId is outdated. Mutates `d` in place
// and returns true if a transition occurred. Used both at load time and periodically
// during a session (in case the tab stays open across a week boundary — common on
// mobile PWAs). Snapshots the weekly_xp to weeklyHistory + Supabase before reset.
function applyWeekTransition(d){
  if(!d||!d.weekId)return false;
  var cw=weekId();
  if(d.weekId===cw)return false;
  if(!d.weeklyHistory)d.weeklyHistory=[];
  if(d.weeklyXp>0){
    // Push Supabase snapshot BEFORE we reset so the old week's XP is preserved there too
    pushWeeklySnapshot(d);
    d.weeklyHistory.push({week:d.weekId,xp:d.weeklyXp});
    if(d.weeklyHistory.length>20)d.weeklyHistory=d.weeklyHistory.slice(-20);
  }
  d.weeklyXp=0;d.weeklyDailyCount=0;d.weekId=cw;
  return true;
}
function shuffle(a){var b=a.slice();for(var i=b.length-1;i>0;i--){var j=Math.floor(Math.random()*(i+1));var t=b[i];b[i]=b[j];b[j]=t;}return b;}
function srand(s){var x=Math.sin(s)*10000;return x-Math.floor(x);}
import { getLevel } from "./data/helpers.js";
function getLeague(wxp){var l=LEAGUES[0];for(var i=0;i<LEAGUES.length;i++)if(wxp>=LEAGUES[i].min)l=LEAGUES[i];return l;}
// Légende est conditionnelle : TOEIC estimé >= 400 requis
// Si non atteint, on affiche Champion avec un badge "locked"
function getEffectiveLeague(wxp,ms){
  var l=getLeague(wxp);
  if(l.id==="legend"){
    var toeic=estimateTOEICScore(ms||{});
    if(toeic.total<400){
      var champ=LEAGUES.find(function(lg){return lg.id==="champion";});
      return Object.assign({},champ||l,{locked:true,lockedScore:toeic.total});
    }
  }
  return l;
}
// ─── FREEMIUM: modules available in visitor/free mode ───
var FREE_MODULES = ["daily","drill","csess","lisP2","stratquiz","strats","gramref","wfall","tavern"];
var FREE_FLASHCARD_DOMAINS = ["finance","travel","office"];

// Returns true if the user has unrestricted access to all premium modules.
// Reasons: active Stripe subscription, active 3-month pass, or active institutional group.
function hasFullAccess(u, gType) {
  if (!u) return false;
  if (u.accessLevel === "premium_monthly") return true;
  if (u.accessLevel === "premium_pass" && u.accessExpiresAt && new Date(u.accessExpiresAt) > new Date()) return true;
  // Institutional (school/pro) users get full access until their group's end_date
  // (expired groups are handled upstream — user is redirected to the expired screen before reaching module gates)
  if (gType === "school" || gType === "pro") return true;
  return false;
}

function isModuleLocked(moduleId, u, gType) {
  if (hasFullAccess(u, gType)) return false;
  return FREE_MODULES.indexOf(moduleId) === -1;
}

function dailyQs(date,u){
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
function compScores(wk){var seed=0;for(var i=0;i<wk.length;i++)seed+=wk.charCodeAt(i);return COMPETITORS.map(function(c,idx){return{name:c.n,avatar:c.a,xp:Math.floor(srand(seed+idx*137)*600+50+srand(seed+idx*53+Math.floor(Date.now()/864e5))*100)};});}
function srsUp(st,r){var e=st.ease||2.5,iv=st.interval||0;if(r===1){iv=1;e=Math.max(1.3,e-0.2);}else if(r===2){iv=Math.max(1,Math.ceil(iv*1.2));e=Math.max(1.3,e-0.15);}else if(r===3){iv=iv===0?1:Math.ceil(iv*e);}else{iv=iv===0?3:Math.ceil(iv*e*1.3);e+=0.15;}var nx=new Date();nx.setDate(nx.getDate()+iv);return{ease:e,interval:iv,nextReview:nx.toISOString().split("T")[0],correct:(st.correct||0)+(r>=3?1:0),total:(st.total||0)+1};}
function dueCards(states,cards){var t=today(),due=[],nw=[];for(var i=0;i<cards.length;i++){var s=states[cards[i].id];if(!s)nw.push(cards[i]);else if(s.nextReview<=t)due.push(cards[i]);}return due.concat(nw.slice(0,Math.max(0,10-due.length))).slice(0,15);}

var SK="toeic-arena-v2";
var BUILD_ID="2026-04-22-p2-chat-bubble";
import { supabase } from './supabase.js'
import { requestMagicLink, linkEmailToAnonymous, getAuthUser, signOutCompletely, onAuthChange, createCheckout, openCustomerPortal, pollEmailConfirmation } from './auth.js'
console.warn("[TOEIC ARENA] Build:",BUILD_ID);

// ─── Name normalization (accent-insensitive + lowercase) ───
function normalizeName(s){return s.normalize("NFD").replace(/[\u0300-\u036f]/g,"").toLowerCase().trim();}

// ─── localStorage-first persistence layer ───
var _cachedUserId=null;
var _syncDirty=false;
var _lastSync=0;

// Clean up dirty flag — no longer used, was causing cross-device overwrites
try{localStorage.removeItem("toeic-arena-dirty");}catch(e){}

function loadLocal(){
  try{
    var raw=localStorage.getItem("toeic-arena-profile");
    if(raw){var d=JSON.parse(raw);if(d&&d.name)return d;}
  }catch(e){}
  return null;
}

function saveLocal(d){
  try{
    localStorage.setItem("toeic-arena-profile",JSON.stringify(d));
    localStorage.setItem("toeic-arena-name",d.name);
    localStorage.setItem("toeic-arena-class",d.classCode||"visitor");
    _syncDirty=true;
  }catch(e){}
}

function supaToLocal(data){
  return{
    name:data.name,classCode:data.class_code||"visitor",
    xp:data.xp,weeklyXp:data.weekly_xp,weekId:data.week_id,
    streak:data.streak,lastActive:data.last_active,
    cardStates:data.card_states||{},
    daily:data.daily_challenge||{date:null,done:false,score:0,xpE:0},
    stats:data.stats||{totalQ:0,correct:0,sessions:0,cardsRev:0,perfects:0,drills:0},
    moduleScores:data.module_scores||{},mockResults:data.mock_results||{},
    gameScores:data.game_scores||{pityCount:0},mission:data.mission||{date:null,actId:null,done:false},
    unlockedAch:data.unlocked_ach||[],avatar:data.avatar||"⚔️",theme:data.theme||"dark",
    equippedSkin:data.skin_id||null,
    totalTime:data.total_time||0,weeklyHistory: data.weekly_history || [],
    dailyModSessions: data.daily_mod_sessions || {},
    weeklyDailyCount: data.weekly_daily_count || 0,
    battleScan: data.battle_scan || null,
    tipsShown: data.tips_shown || [],
    dailySeen: data.daily_seen || [],
    gdprConsent: data.gdpr_consent || null,
    joinedAt: data.joined_at || null,
    tutorialPending: data.tutorial_pending===true,
    email: data.email || null,
    accessLevel: data.access_level || 'free',
    accessExpiresAt: data.access_expires_at || null,
    narrator: data.narrator || {heard:[], muted:false},
  };
}

// load() — always fetch from Supabase when online, use localStorage as fallback
async function load(userId){
  var local=loadLocal();
  console.warn("[LOAD] start — userId:",userId?"yes":"no","local:",local?local.name:"null");
  if(userId)_cachedUserId=userId;
  // Try to fetch the freshest data from Supabase
  if(userId){
    try{
      var cn=local?local.name:null;
      if(!cn)try{cn=localStorage.getItem("toeic-arena-name");}catch(e){}
      var cc=local?local.classCode:null;
      if(!cc)try{cc=localStorage.getItem("toeic-arena-class");}catch(e){}
      console.warn("[LOAD] querying Supabase for:",cn,cc);
      var remote=null;
      // Primary: lookup by (name, class_code) — works cross-device
      if(cn){
        var res=await supabase.from("students").select("*").ilike("name",cn).eq("class_code",cc||"visitor").order("xp",{ascending:false}).limit(1);
        if(res.error)console.error("[LOAD] SELECT error:",res.error.message);
        if(res.data&&res.data.length>0)remote=res.data[0];
      }
      // Fallback: lookup by auth ID
      if(!remote){
        console.warn("[LOAD] primary miss, trying fallback by auth ID");
        var res2=await supabase.from("students").select("*").eq("id",userId).maybeSingle();
        if(res2.data)remote=res2.data;
      }
      if(remote){
        console.warn("[LOAD] got remote — xp:",remote.xp,"weekly_xp:",remote.weekly_xp,"streak:",remote.streak);
        // ── Stale-remote guard ──
        // Heuristic: if local has strictly more XP than remote AND was active more recently,
        // the saves were probably failing (e.g. schema mismatch) and local holds the truth.
        // Use local and mark _syncDirty so the next save() pushes it to Supabase.
        // XP is monotonic (cumulative, never decreases), so local.xp > remote.xp is a
        // reliable signal that local has progress that never reached Supabase.
        var localXp=(local&&local.xp)||0;
        var remoteXp=remote.xp||0;
        var localLA=(local&&local.lastActive)||"";
        var remoteLA=remote.last_active||"";
        if(local&&localXp>remoteXp&&localLA>=remoteLA){
          console.warn("[LOAD] local is fresher (xp "+localXp+">"+remoteXp+", lastActive "+localLA+">="+remoteLA+") — merging with remote server-side fields");
          // CRITICAL: server-side fields (classCode, access_level, email) can be changed
          // by Stripe webhooks, admin SQL, or group migration — never by client activity.
          // Always trust remote for these, even when local is fresher for XP/streak/etc.
          // Without this merge, a downgrade bug could flip a paying student or school member
          // to visitor/free just because their local had more XP.
          if(remote.class_code)local.classCode=remote.class_code;
          if(remote.access_level)local.accessLevel=remote.access_level;
          if(remote.access_expires_at!==undefined)local.accessExpiresAt=remote.access_expires_at;
          if(remote.email)local.email=remote.email;
          _syncDirty=true;
          saveLocal(local); // persist the merged classCode/accessLevel so subsequent saves don't regress
          // Fire-and-forget: push local to Supabase immediately so device-switching works.
          save(local);
          return local;
        }
        var d=supaToLocal(remote);
        saveLocal(d);
        _syncDirty=false;
        return d;
      }else{console.warn("[LOAD] no remote data found");}
    }catch(e){/* Supabase unreachable — fall through to local */}
  }
  // Offline or no userId: use localStorage
  return local||null;
}

// save() — localStorage + Supabase (UPDATE first, INSERT if no row)
var GHOST_NAME="Teacher"; // Teacher is hidden from leaderboards but DOES sync to Supabase
// A "ghost student" is a registered student (non-visitor) who barely engaged with the app
function isGhost(s){if(!s)return false;if(s.class_code==="visitor")return false;var tq=(s.stats&&s.stats.totalQ)||0;var cr=(s.stats&&s.stats.cardsRev)||0;return tq<=15&&cr<=10;}
// Recover an auth session if the current one has been lost (refresh token expired,
// tab backgrounded too long, etc). Returns a user object or null if recovery failed.
async function ensureAuthSession(){
  try{
    var sess=await supabase.auth.getUser();
    if(sess.data&&sess.data.user)return sess.data.user;
  }catch(e){/* session missing — fall through to recovery */}
  // Try to refresh first (session may exist in storage but JWT expired)
  try{
    var refreshed=await supabase.auth.refreshSession();
    if(refreshed.data&&refreshed.data.user){console.warn("[AUTH] recovered via refreshSession");return refreshed.data.user;}
  }catch(e){/* refresh failed — need a new session */}
  // Last resort: new anonymous session. save()'s UPDATE matches by (name, class_code)
  // not id, so the row stays reachable even though the user_id changed.
  try{
    var anon=await supabase.auth.signInAnonymously();
    if(anon.data&&anon.data.user){console.warn("[AUTH] recovered via new anon session");return anon.data.user;}
  }catch(e){/* fully stuck */}
  return null;
}

async function save(d){
  saveLocal(d);
  if(!d||!d.name){console.warn("[SAVE] skip: no data or name");return;}
  // Safety rail: never let a missing classCode fall through to the "visitor" fallback
  // during an UPDATE — this could match (name, visitor) and either overwrite another
  // student's row or create a phantom. Refuse to save instead; local keeps the state.
  if(!d.classCode){console.error("[SAVE] BLOCKED: missing classCode for",d.name,"— refusing to sync to avoid corruption");return;}
  // Teacher now syncs to Supabase (hidden from leaderboards via League/TeacherDash filters)
  var user=await ensureAuthSession();
  if(!user){console.error("[SAVE] BLOCKED: could not establish auth session");return;}
  _cachedUserId=user.id;
  var payload={
    xp:d.xp,weekly_xp:d.weeklyXp,week_id:d.weekId,
    streak:d.streak,last_active:d.lastActive,
    card_states:d.cardStates,daily_challenge:d.daily,
    stats:d.stats,module_scores:d.moduleScores,
    mock_results:d.mockResults,game_scores:d.gameScores,
    mission:d.mission,avatar:d.avatar||"⚔️",theme:d.theme||"dark",
    skin_id:d.equippedSkin||null,
    unlocked_ach:d.unlockedAch||[],total_time:d.totalTime||0,
    weekly_history:d.weeklyHistory||[],
    daily_mod_sessions:d.dailyModSessions||{},
    weekly_daily_count:d.weeklyDailyCount||0,
    battle_scan:d.battleScan||null,
    tips_shown:d.tipsShown||[],
    daily_seen:d.dailySeen||[],
    gdpr_consent:d.gdprConsent||null,
    joined_at:d.joinedAt||null,
    tutorial_pending:d.tutorialPending===true,
    email:d.email||null,
    access_level:d.accessLevel||'free',
    access_expires_at:d.accessExpiresAt||null,
    narrator:d.narrator||{heard:[],muted:false},
  };
  var cc=d.classCode||"visitor";
  try{
    // Step 1: UPDATE by (name, class_code) — cross-device safe, never mutates PK
    var upd=await supabase.from("students").update(payload).ilike("name",d.name).eq("class_code",cc).select("id");
    if(upd.error){console.error("[SAVE] UPDATE error:",upd.error.message);return;}
    if(!upd.data||upd.data.length===0){
      console.warn("[SAVE] UPDATE matched 0 rows for",d.name,cc,"— checking for phantom duplicate before INSERT...");
      // Phantom guard: before creating a new row, check if this student already exists
      // in ANOTHER class_code. If yes, refuse to INSERT a duplicate (this is how the
      // visitor phantoms got created — local classCode drifted to "visitor" but the
      // student had a legit row in idrac2026/famille2026/cesi2026/etc).
      var dup=await supabase.from("students").select("class_code").ilike("name",d.name).neq("class_code",cc);
      if(dup.data&&dup.data.length>0){
        console.error("[SAVE] BLOCKED: would create phantom — "+d.name+" already exists in class "+dup.data[0].class_code+" (attempted cc="+cc+")");
        return;
      }
      // Clean INSERT — student is genuinely new.
      // Do NOT set id: user.id — the same auth user may already own another students row
      // (Teacher/student on same device, multi-profile family accounts, etc.), which would
      // trigger a PK conflict. Let Postgres auto-generate a fresh UUID; identity is tracked
      // via the natural key (name, class_code) for UPDATEs and via lookupName for recovery.
      var ins=await supabase.from("students").insert({name:d.name,class_code:cc,...payload});
      if(ins.error)console.error("[SAVE] INSERT error:",ins.error.message);
      else console.warn("[SAVE] OK —",d.name,cc,"inserted");
    }else{console.warn("[SAVE] OK —",d.name,cc,"updated");}
    _syncDirty=false;
  }catch(e){console.warn("[SAVE] Exception:",e);}
}

// syncToCloud() — replaced by save(), kept as no-op for existing call sites
async function syncToCloud(d){
  if(!d||!d.name||!_syncDirty)return;
  return save(d);
}
// ─── BIOMETRIC AUTH (WebAuthn) for Teacher Dashboard ───
var BIOMETRIC_KEY="toeic-teacher-bio";
async function biometricAvailable(){try{if(!window.PublicKeyCredential)return false;return await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();}catch(e){return false;}}
function getBioCredId(){try{var v=localStorage.getItem(BIOMETRIC_KEY);return v?Uint8Array.from(atob(v),function(c){return c.charCodeAt(0);}):null;}catch(e){return null;}}
function storeBioCredId(rawId){try{var b=btoa(String.fromCharCode.apply(null,new Uint8Array(rawId)));localStorage.setItem(BIOMETRIC_KEY,b);}catch(e){}}
async function bioRegister(){
  var challenge=crypto.getRandomValues(new Uint8Array(32));
  var userId=crypto.getRandomValues(new Uint8Array(16));
  var opts={publicKey:{
    challenge:challenge,rp:{name:"TOEIC Arena"},
    user:{id:userId,name:"teacher",displayName:"Teacher"},
    pubKeyCredParams:[{alg:-7,type:"public-key"},{alg:-257,type:"public-key"}],
    authenticatorSelection:{authenticatorAttachment:"platform",userVerification:"required"},
    timeout:120000
  }};
  var cred=await navigator.credentials.create(opts);
  storeBioCredId(cred.rawId);return true;
}
async function bioAuthenticate(){
  var credId=getBioCredId();if(!credId)return false;
  var challenge=crypto.getRandomValues(new Uint8Array(32));
  await navigator.credentials.get({publicKey:{
    challenge:challenge,allowCredentials:[{id:credId,type:"public-key",transports:["internal"]}],
    userVerification:"required",timeout:120000
  }});
  return true;
}

function fresh(name,classCode){return{name:name,classCode:classCode||'visitor',xp:0,streak:0,lastActive:null,weeklyXp:0,weekId:weekId(),weeklyHistory:[],cardStates:{},daily:{date:null,done:false,score:0,xpE:0},stats:{totalQ:0,correct:0,sessions:0,cardsRev:0,perfects:0,drills:0},moduleScores:{},mockResults:{},gameScores:{pityCount:0},mission:{date:null,actId:null,done:false},unlockedAch:[],avatar:"⚔️",theme:"dark",equippedSkin:null,totalTime:0,dailyModSessions:{},weeklyDailyCount:0,battleScan:null,tipsShown:[],dailySeen:[],gdprConsent:null,joinedAt:today(),tutorialPending:true,email:null,accessLevel:'free',accessExpiresAt:null,narrator:{heard:[],muted:false}};}

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

function canUnlockBoss(u){
  if(!u||!u.stats)return{ok:false,reasons:[]};
  var reasons=[];
  if(!u.mockResults||!u.mockResults.mock1)reasons.push("Complete Mock Test 1 first");
  if(!u.mockResults||!u.mockResults.mock2)reasons.push("Complete Mock Test 2 first");
  if(!u.mockResults||!u.mockResults.mock3)reasons.push("Complete Mock Test 3 first");
  if(reasons.length===0&&u.mockResults&&u.mockResults.boss&&u.mockResults.boss.date===today()){
    reasons.push("24h cooldown — come back tomorrow");
  }
  return{ok:reasons.length===0,reasons:reasons};
}


// ─── SEASON & MOCK NUDGE ───
var SEASON_START="2026-09-01";
function needsMockNudge(u){
  if(!u||!u.name)return false;
  if(u.mockResults&&(u.mockResults.mock1||u.mockResults.mock2||u.mockResults.mock3))return false;
  var joined=u.joinedAt?new Date(u.joinedAt):null;
  if(joined&&(Date.now()-joined.getTime())>=3*24*60*60*1000)return true;
  if(today()>=SEASON_START)return true;
  return false;
}

// ─── HAPTIC FEEDBACK ───
var HAPTICS={chest:[100,50,100],chestOpen:[50,30,50,30,150],levelUp:[100,50,200],achieve:[80,40,80,40,80],league:[200,100,300],pb:[100,50,100,50,200],streak:[80,60,120],complete:[150],pageturn:[10]};
function haptic(k){try{if(navigator.vibrate&&HAPTICS[k])navigator.vibrate(HAPTICS[k]);}catch(e){}}

// ─── ENDLESS ARENA HELPERS ───
function getEndlessState(u){
  if(!u.mockResults||!u.mockResults.boss)return"hidden";
  if((u.mockResults.boss.toeicEstimate||0)<650)return"locked";
  var last=u.mockResults.endless&&u.mockResults.endless.lastAttempt;
  if(last&&(Date.now()-last)<24*60*60*1000)return"cooldown";
  return"ready";
}

function generateEndlessTest(){
  // Merge training + boss pools
  var allP1=LISTENING_P1.concat(BOSS_P1);
  var allP2=LISTENING_P2.concat(BOSS_P2);
  var allP3=LISTENING_P3.concat(BOSS_P3);
  var allP4=LISTENING_P4.concat(BOSS_P4);
  var allP5=QUESTIONS.concat(BOSS_P5);
  var allP6=PART6_TEXTS.concat(BOSS_P6);
  var allP7=PART7_PASSAGES.concat(BOSS_P7);

  // Fisher-Yates shuffle helper
  function fy(arr){var a=arr.slice();for(var i=a.length-1;i>0;i--){var j=Math.floor(Math.random()*(i+1));var t=a[i];a[i]=a[j];a[j]=t;}return a;}

  // Shuffle options for a 4-option question, return {options, correct}
  function shufOpts4(opts,correct){
    var idx=[0,1,2,3];idx=fy(idx);
    return{options:idx.map(function(k){return opts[k];}),correct:idx.indexOf(correct)};
  }
  function shufOpts3(opts,correct){
    var idx=[0,1,2];idx=fy(idx);
    return{options:idx.map(function(k){return opts[k];}),correct:idx.indexOf(correct)};
  }

  // Pick & shuffle items, then shuffle their options
  var ep1=fy(allP1).slice(0,6).map(function(q){var s=shufOpts4(q.opts,q.c);return Object.assign({},q,{opts:s.options,c:s.correct});});
  var ep2=fy(allP2).slice(0,25).map(function(q){var s=shufOpts3(q.opts,q.c);return Object.assign({},q,{opts:s.options,c:s.correct});});
  var ep3=fy(allP3).slice(0,13).map(function(conv){return Object.assign({},conv,{qs:conv.qs.map(function(q){var s=shufOpts4(q.opts,q.c);return Object.assign({},q,{opts:s.options,c:s.correct});})});});
  var ep4=fy(allP4).slice(0,10).map(function(talk){return Object.assign({},talk,{qs:talk.qs.map(function(q){var s=shufOpts4(q.opts,q.c);return Object.assign({},q,{opts:s.options,c:s.correct});})});});
  var ep5=fy(allP5).slice(0,30).map(function(q){var s=shufOpts4(q.o,q.c);return Object.assign({},q,{o:s.options,c:s.correct});});
  var ep6=fy(allP6).slice(0,4).map(function(t){return Object.assign({},t,{parts:t.parts.map(function(pt){if(!pt.blank)return pt;var s=shufOpts4(pt.options,pt.correct);return Object.assign({},pt,{options:s.options,correct:s.correct});})});});
  // P7: pick enough passages for ~54 questions
  var p7Shuffled=fy(allP7);var ep7=[];var p7qCount=0;
  for(var i=0;i<p7Shuffled.length&&p7qCount<54;i++){
    var ps=p7Shuffled[i];if(!ps||!ps.questions||!ps.questions.length)continue;
    ep7.push(Object.assign({},ps,{questions:ps.questions.map(function(q){var s=shufOpts4(q.options,q.correct);return Object.assign({},q,{options:s.options,correct:s.correct});})}));
    p7qCount+=ps.questions.length;
  }
  return{p1:ep1,p2:ep2,p3:ep3,p4:ep4,p5:ep5,p6:ep6,p7:ep7};
}

// ─── TEACHER DASHBOARD CONFIG ───
var PUSH_SECRET=import.meta.env.VITE_PUSH_SECRET||"";

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
    // Explicit permission request (some browsers don't auto-prompt on subscribe)
    if("Notification" in window&&Notification.permission!=="granted"){
      var perm=await Notification.requestPermission();
      if(perm!=="granted"){console.log("Push permission denied:",perm);return null;}
    }
    var reg=await navigator.serviceWorker.ready;
    var existing=await reg.pushManager.getSubscription();
    var sub=existing||await reg.pushManager.subscribe({
      userVisibleOnly:true,
      applicationServerKey:urlBase64ToUint8Array(VAPID_PUBLIC_KEY)
    });
    var subJson=sub.toJSON();
    await supabase.from("push_subscriptions").delete().eq("student_name",userName).eq("class_code",userClassCode).eq("endpoint",subJson.endpoint);
    var res=await supabase.from("push_subscriptions").insert({
      student_name:userName,
      class_code:userClassCode,
      subscription:subJson,
      endpoint:subJson.endpoint
    });
    if(res.error){console.error("Push DB insert failed:",res.error.message);return null;}
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
      await supabase.from("push_subscriptions").delete().eq("student_name",userName).eq("class_code",userClassCode).eq("endpoint",sub.endpoint);
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

// ─── PLATFORM DETECTION ─── (used for install prompts, haptic, etc.)
function isStandalonePWA(){
  try{
    if(window.matchMedia&&window.matchMedia('(display-mode: standalone)').matches)return true;
    if(window.navigator&&window.navigator.standalone===true)return true;
  }catch(e){}
  return false;
}
function isIOSDevice(){
  try{
    var ua=navigator.userAgent||"";
    if(/iPad|iPhone|iPod/.test(ua))return true;
    // iPadOS 13+ masquerades as Mac — detect via touch points
    if(navigator.platform==="MacIntel"&&navigator.maxTouchPoints>1)return true;
  }catch(e){}
  return false;
}

// ─── CSS ───
var CSS=`
@font-face{font-family:'Cinzel';font-style:normal;font-weight:600 900;font-display:swap;src:url('/fonts/cinzel-latin-ext.woff2') format('woff2');unicode-range:U+0100-02BA,U+02BD-02C5,U+02C7-02CC,U+02CE-02D7,U+02DD-02FF,U+0304,U+0308,U+0329,U+1D00-1DBF,U+1E00-1E9F,U+1EF2-1EFF,U+2020,U+20A0-20AB,U+20AD-20C0,U+2113,U+2C60-2C7F,U+A720-A7FF}
@font-face{font-family:'Cinzel';font-style:normal;font-weight:600 900;font-display:swap;src:url('/fonts/cinzel-latin.woff2') format('woff2');unicode-range:U+0000-00FF,U+0131,U+0152-0153,U+02BB-02BC,U+02C6,U+02DA,U+02DC,U+0304,U+0308,U+0329,U+2000-206F,U+20AC,U+2122,U+2191,U+2193,U+2212,U+2215,U+FEFF,U+FFFD}
@font-face{font-family:'DM Sans';font-style:normal;font-weight:400 700;font-display:swap;src:url('/fonts/dmsans-latin-ext.woff2') format('woff2');unicode-range:U+0100-02BA,U+02BD-02C5,U+02C7-02CC,U+02CE-02D7,U+02DD-02FF,U+0304,U+0308,U+0329,U+1D00-1DBF,U+1E00-1E9F,U+1EF2-1EFF,U+2020,U+20A0-20AB,U+20AD-20C0,U+2113,U+2C60-2C7F,U+A720-A7FF}
@font-face{font-family:'DM Sans';font-style:normal;font-weight:400 700;font-display:swap;src:url('/fonts/dmsans-latin.woff2') format('woff2');unicode-range:U+0000-00FF,U+0131,U+0152-0153,U+02BB-02BC,U+02C6,U+02DA,U+02DC,U+0304,U+0308,U+0329,U+2000-206F,U+20AC,U+2122,U+2191,U+2193,U+2212,U+2215,U+FEFF,U+FFFD}
@font-face{font-family:'Outfit';font-style:normal;font-weight:400 900;font-display:swap;src:url('/fonts/outfit-latin-ext.woff2') format('woff2');unicode-range:U+0100-02BA,U+02BD-02C5,U+02C7-02CC,U+02CE-02D7,U+02DD-02FF,U+0304,U+0308,U+0329,U+1D00-1DBF,U+1E00-1E9F,U+1EF2-1EFF,U+2020,U+20A0-20AB,U+20AD-20C0,U+2113,U+2C60-2C7F,U+A720-A7FF}
@font-face{font-family:'Outfit';font-style:normal;font-weight:400 900;font-display:swap;src:url('/fonts/outfit-latin.woff2') format('woff2');unicode-range:U+0000-00FF,U+0131,U+0152-0153,U+02BB-02BC,U+02C6,U+02DA,U+02DC,U+0304,U+0308,U+0329,U+2000-206F,U+20AC,U+2122,U+2191,U+2193,U+2212,U+2215,U+FEFF,U+FFFD}
*{box-sizing:border-box;margin:0;padding:0;-webkit-tap-highlight-color:transparent}
:root{--bg:#0f0c08;--bg2:#1a1610;--bg3:#28221a;--bg-rgb:15,12,8;--bg2-rgb:26,22,16;--bg3-rgb:40,34,26;--bdr:rgba(180,140,80,0.08);--cyan:#d4943a;--orange:#c87a35;--gold:#f0c850;--green:#4abe60;--red:#e05252;--purple:#8b5e83;--t1:#ede4d4;--t2:#8a7e6a;--t3:#5a5040;--cx:212,148,58;--cx-hex:#d4943a;--cx-dark:#a06e20;--endless:#1B70CF;--endless-dark:#0a3a6e;--endless-light:#7fb8e8;--endless-mid:#4a9fe0;--endless-muted:#7a9ac0}
.skin-argent{--cx:180,180,200;--cx-hex:#b4b4c8;--cx-dark:#888898;--cyan:#b4b4c8;--orange:#888898}
.skin-emeraude{--cx:46,180,100;--cx-hex:#2eb464;--cx-dark:#1a8a46;--cyan:#2eb464;--orange:#1a8a46}
.skin-saphir{--cx:58,148,220;--cx-hex:#3a94dc;--cx-dark:#1a6aaa;--cyan:#3a94dc;--orange:#1a6aaa}
.skin-rubis{--cx:220,58,80;--cx-hex:#dc3a50;--cx-dark:#c01830;--cyan:#dc3a50;--orange:#c01830}
.skin-amethyste{--cx:160,90,220;--cx-hex:#a05adc;--cx-dark:#7030aa;--cyan:#a05adc;--orange:#7030aa}
.skin-corail{--cx:220,100,50;--cx-hex:#dc6432;--cx-dark:#c03018;--cyan:#dc6432;--orange:#c03018}
.skin-jade{--cx:20,180,170;--cx-hex:#14b4aa;--cx-dark:#0a8880;--cyan:#14b4aa;--orange:#0a8880}
.skin-obsidienne{--cx:180,160,220;--cx-hex:#b4a0dc;--cx-dark:#8870b0;--cyan:#b4a0dc;--orange:#8870b0;--bg:#080810;--bg2:#12101c;--bg3:#1c1a28;--t1:#e8e4f4;--t2:#807898;--bdr:rgba(160,128,224,.08)}
.skin-aurore{--cx:64,208,192;--cx-hex:#40d0c0;--cx-dark:#3a9870;--cyan:#40d0c0;--orange:#3a9870;--bg:#08090e;--bg2:#10121c;--bg3:#18202c;--t1:#d8f0e8;--t2:#5898a0;--bdr:rgba(64,208,192,.08)}
.light{--bg:#f5f0e8;--bg2:#fffcf5;--bg3:#e8e0d2;--bg-rgb:245,240,232;--bg2-rgb:255,252,245;--bg3-rgb:232,224,210;--bdr:rgba(120,90,50,0.1);--cyan:#8b6914;--orange:#a05a10;--gold:#a67c00;--green:#15803d;--red:#b82020;--purple:#6b3d62;--t1:#1a1510;--t2:#5a5040;--t3:#8a7e6a;--cx:139,105,20;--cx-hex:#8b6914;--cx-dark:#6a4e10}
.light.skin-argent{--cx:80,80,110;--cx-hex:#505070;--cx-dark:#383848;--cyan:#505070;--orange:#383848}
.light.skin-emeraude{--cx:18,110,52;--cx-hex:#126e34;--cx-dark:#0c5228;--cyan:#126e34;--orange:#0c5228}
.light.skin-saphir{--cx:20,80,150;--cx-hex:#145096;--cx-dark:#0e3a78;--cyan:#145096;--orange:#0e3a78}
.light.skin-rubis{--cx:160,20,40;--cx-hex:#a01428;--cx-dark:#780e1e;--cyan:#a01428;--orange:#780e1e}
.light.skin-amethyste{--cx:100,40,160;--cx-hex:#6428a0;--cx-dark:#4a1878;--cyan:#6428a0;--orange:#4a1878}
.light.skin-corail{--cx:160,55,20;--cx-hex:#a03714;--cx-dark:#7a2408;--cyan:#a03714;--orange:#7a2408}
.light.skin-jade{--cx:10,110,105;--cx-hex:#0a6e69;--cx-dark:#085250;--cyan:#0a6e69;--orange:#085250}
.light.skin-obsidienne{--cx:80,60,140;--cx-hex:#503c8c;--cx-dark:#382868;--cyan:#503c8c;--orange:#382868}
.light.skin-aurore{--cx:20,120,90;--cx-hex:#147858;--cx-dark:#0c5a40;--cyan:#147858;--orange:#0c5a40}
/* ── SHIMMER OVERLAY via ::after (immune to inline style overrides) ── */
/* ── EPIC SKINS — ::after shimmer overlay ── */
.skin-rubis .btn1,.skin-amethyste .btn1,.skin-corail .btn1,.skin-jade .btn1{position:relative!important;overflow:hidden!important;box-shadow:0 4px 20px rgba(var(--cx),.4),0 0 0 1px rgba(var(--cx),.2)!important}
.skin-rubis .btn1::after,.skin-amethyste .btn1::after,.skin-corail .btn1::after,.skin-jade .btn1::after{content:''!important;position:absolute!important;inset:0!important;background-image:linear-gradient(105deg,transparent 35%,rgba(255,255,255,.2) 50%,transparent 65%)!important;background-size:300%!important;animation:skinShimmer 2.5s ease-in-out infinite!important;pointer-events:none!important;border-radius:inherit!important}
.skin-rubis .bar-fill,.skin-amethyste .bar-fill,.skin-corail .bar-fill,.skin-jade .bar-fill{position:relative!important;overflow:hidden!important}
.skin-rubis .bar-fill::after,.skin-amethyste .bar-fill::after,.skin-corail .bar-fill::after,.skin-jade .bar-fill::after{content:''!important;position:absolute!important;inset:0!important;background-image:linear-gradient(90deg,transparent 35%,rgba(255,255,255,.25) 50%,transparent 65%)!important;background-size:300%!important;animation:skinShimmer 2s ease-in-out infinite!important;pointer-events:none!important;border-radius:inherit!important}
.skin-rubis .crd,.skin-amethyste .crd,.skin-corail .crd,.skin-jade .crd{border-color:rgba(var(--cx),.18)!important;box-shadow:0 0 12px rgba(var(--cx),.08),inset 0 1px 0 rgba(var(--cx),.08)!important}
.skin-rubis .glo,.skin-amethyste .glo,.skin-corail .glo,.skin-jade .glo{box-shadow:0 0 30px rgba(var(--cx),.12)!important}
.skin-rubis .btn2,.skin-amethyste .btn2,.skin-corail .btn2,.skin-jade .btn2{border-color:rgba(var(--cx),.3)!important;color:var(--cyan)!important}
/* ── OBSIDIENNE — violet+or pulsation + shimmer overlay ── */
/* NOTE: box-shadow sans !important pour permettre à obsidianPulse de l'animer */
.skin-obsidienne .btn1{position:relative!important;overflow:hidden!important;background-image:linear-gradient(135deg,#b090f0,#8060c0,#c0a030,#8060c0,#b090f0)!important;background-color:transparent!important;background-size:300%!important;animation:obsidianPulse 3s ease-in-out infinite!important;transition:none!important;filter:brightness(1.1)!important;color:#080810!important;box-shadow:0 4px 28px rgba(160,130,255,.45),0 0 50px rgba(192,160,48,.15),0 0 0 1px rgba(160,130,255,.25)}
.skin-obsidienne .btn1::after{content:''!important;position:absolute!important;inset:0!important;background-image:linear-gradient(105deg,transparent 30%,rgba(200,180,255,.25) 45%,rgba(255,220,120,.15) 55%,transparent 70%)!important;background-size:300%!important;animation:skinShimmer 3s ease-in-out infinite!important;pointer-events:none!important;border-radius:inherit!important}
.skin-obsidienne .bar-fill{position:relative!important;overflow:hidden!important;background-image:linear-gradient(90deg,#b090f0,#8060c0,#c0a030,#b090f0)!important;background-color:transparent!important;background-size:200%!important;animation:obsidianPulse 4s ease-in-out infinite!important;transition:none!important;box-shadow:0 0 12px rgba(var(--cx),.5)}
.skin-obsidienne .bar-fill::after{content:''!important;position:absolute!important;inset:0!important;background-image:linear-gradient(90deg,transparent 30%,rgba(200,180,255,.3) 45%,rgba(255,220,120,.18) 55%,transparent 70%)!important;background-size:300%!important;animation:skinShimmer 2.5s ease-in-out infinite!important;pointer-events:none!important;border-radius:inherit!important}
.skin-obsidienne .crd{border-color:rgba(160,128,224,.2)!important;background-image:linear-gradient(135deg,rgba(160,128,224,.10),rgba(192,160,48,.06),rgba(128,96,192,.08))!important;animation:obsidianPulse 4s ease-in-out infinite!important;transition:none!important}
.skin-obsidienne .glo{animation:obsidianPulse 3s ease-in-out infinite!important}
.skin-obsidienne .btn2{border-color:rgba(160,128,224,.3)!important;color:#b090f0!important;box-shadow:0 0 12px rgba(160,130,255,.12)}
.skin-argent .tab-bar,.skin-emeraude .tab-bar,.skin-saphir .tab-bar{box-shadow:0 -30px 50px rgba(var(--cx),.07)!important}
.skin-rubis .tab-bar,.skin-amethyste .tab-bar,.skin-corail .tab-bar,.skin-jade .tab-bar{box-shadow:0 -40px 60px rgba(var(--cx),.10)!important}
.skin-obsidienne .tab-bar,.skin-aurore .tab-bar{box-shadow:0 -50px 80px rgba(var(--cx),.14)}
.skin-obsidienne .tab-bar{animation:obsidianPulse 5s ease-in-out infinite!important}
.skin-obsidienne .out{text-shadow:0 0 16px rgba(160,130,255,.12)}
/* ── AURORE BORÉALE — 4-color aurora gradient animation + shimmer ── */
/* NOTE: background-image (pas background shorthand) pour ne pas verrouiller background-position en !important */
.skin-aurore .btn1{position:relative!important;overflow:hidden!important;background-image:linear-gradient(135deg,#40d0c0,#6060e8,#c040a0,#40d0c0)!important;background-color:transparent!important;background-size:300%!important;animation:aurora 2.5s ease infinite!important;transition:none!important;color:#08090e!important;box-shadow:0 4px 32px rgba(64,208,192,.5),0 0 60px rgba(96,96,232,.2),0 0 0 1px rgba(64,208,192,.3)!important}
.skin-aurore .btn1::after{content:''!important;position:absolute!important;inset:0!important;background-image:linear-gradient(105deg,transparent 30%,rgba(180,255,240,.22) 45%,rgba(160,140,255,.15) 55%,transparent 70%)!important;background-size:300%!important;animation:skinShimmer 2.5s ease-in-out infinite!important;pointer-events:none!important;border-radius:inherit!important}
.skin-aurore .bar-fill{position:relative!important;overflow:hidden!important;background-image:linear-gradient(90deg,#40d0c0,#6060e8,#c040a0,#40c8a0,#40d0c0)!important;background-color:transparent!important;background-size:300%!important;animation:aurora 3s ease infinite!important;transition:none!important}
.skin-aurore .bar-fill::after{content:''!important;position:absolute!important;inset:0!important;background-image:linear-gradient(90deg,transparent 30%,rgba(180,255,240,.28) 45%,rgba(160,140,255,.18) 55%,transparent 70%)!important;background-size:300%!important;animation:skinShimmer 2s ease-in-out infinite!important;pointer-events:none!important;border-radius:inherit!important}
.skin-aurore .crd{border-color:rgba(64,208,192,.2)!important;background-image:linear-gradient(135deg,rgba(64,208,192,.08),rgba(96,96,232,.07),rgba(192,64,160,.06))!important;background-size:300% 100%!important;animation:aurora 4s ease infinite!important;transition:none!important;box-shadow:0 0 16px rgba(64,208,192,.1),inset 0 1px 0 rgba(64,208,192,.1)!important}
.skin-aurore .glo{box-shadow:0 0 40px rgba(64,208,192,.2)!important;background-image:linear-gradient(135deg,rgba(64,208,192,.08),rgba(96,96,232,.06),rgba(192,64,160,.05))!important;background-size:300%!important;animation:aurora 4s ease infinite!important}
.skin-aurore .btn2{border-color:rgba(64,208,192,.3)!important;color:#40d0c0!important;box-shadow:0 0 16px rgba(64,208,192,.12)!important}
.skin-aurore .tab-bar{animation:aurora 4s ease infinite!important}
.skin-aurore .out{text-shadow:0 0 20px rgba(64,208,192,.12)}
.light.skin-rubis .btn1,.light.skin-amethyste .btn1,.light.skin-corail .btn1,.light.skin-jade .btn1{box-shadow:0 4px 16px rgba(var(--cx),.3)!important}
.light.skin-obsidienne .btn1{box-shadow:0 4px 20px rgba(80,60,140,.35),0 0 30px rgba(80,60,140,.12)!important}
.light.skin-aurore .btn1{box-shadow:0 4px 20px rgba(20,120,90,.4)!important}
body{background:var(--bg);font-family:'DM Sans',sans-serif;color:var(--t1)}
@keyframes fadeIn{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:translateY(0)}}
@keyframes pulse{0%,100%{transform:scale(1)}50%{transform:scale(1.05)}}
@keyframes glow{0%,100%{filter:brightness(1)}50%{filter:brightness(1.3)}}
@keyframes shake{0%,100%{transform:translateX(0)}20%{transform:translateX(-8px)}40%{transform:translateX(8px)}60%{transform:translateX(-4px)}80%{transform:translateX(4px)}}
@keyframes flame{0%,100%{transform:scale(1) rotate(-2deg)}25%{transform:scale(1.1) rotate(2deg)}50%{transform:scale(1.05) rotate(-1deg)}75%{transform:scale(1.12) rotate(1deg)}}
@keyframes achPop{0%{transform:translateY(30px) scale(.7);opacity:0}10%{transform:translateY(-5px) scale(1.05);opacity:1}15%{transform:translateY(0) scale(1);opacity:1}85%{transform:translateY(0) scale(1);opacity:1}100%{transform:translateY(-20px) scale(.95);opacity:0}}
@keyframes xpPop{0%{transform:translateY(0) scale(.5);opacity:0}15%{transform:translateY(-10px) scale(1.1);opacity:1}75%{transform:translateY(-10px) scale(1);opacity:1}100%{transform:translateY(-30px) scale(.95);opacity:0}}
@keyframes legendGlow{0%,100%{filter:drop-shadow(0 0 5px #ffc020bb) drop-shadow(0 0 12px #ffc02055)}50%{filter:drop-shadow(0 0 10px #ffc020dd) drop-shadow(0 0 24px #ffc02088)}}
@keyframes epicGlow{0%,100%{filter:drop-shadow(0 0 3px #c060f099)}50%{filter:drop-shadow(0 0 8px #c060f0cc)}}
@keyframes rareGlow{0%,100%{filter:drop-shadow(0 0 2px #3a8ee066)}50%{filter:drop-shadow(0 0 6px #3a8ee0aa)}}
@keyframes skinShimmer{0%{background-position:-100% 50%}100%{background-position:200% 50%}}
@keyframes aurora{0%,100%{background-position:0% 50%}50%{background-position:100% 50%}}
@keyframes obsidianPulse{0%,100%{box-shadow:0 0 12px rgba(160,130,255,.20),inset 0 0 24px rgba(80,50,180,.08)}50%{box-shadow:0 0 32px rgba(160,130,255,.45),inset 0 0 40px rgba(80,50,180,.18)}}
@keyframes legendCardPulse{0%,100%{box-shadow:0 0 16px rgba(var(--cx),.1),inset 0 1px 0 rgba(var(--cx),.1)}50%{box-shadow:0 0 28px rgba(var(--cx),.2),inset 0 1px 0 rgba(var(--cx),.18)}}
@keyframes chestShake{0%,100%{transform:rotate(0)}10%{transform:rotate(-8deg)}20%{transform:rotate(8deg)}30%{transform:rotate(-6deg)}40%{transform:rotate(6deg)}50%{transform:rotate(-3deg)}60%{transform:rotate(3deg)}70%{transform:rotate(-1deg)}80%{transform:rotate(1deg)}}
@keyframes chestFlash{0%{opacity:0;transform:scale(.5)}50%{opacity:1;transform:scale(1.3)}100%{opacity:0;transform:scale(2)}}
@keyframes endless-star-twinkle{0%,100%{opacity:0.15;transform:scale(0.8)}50%{opacity:0.95;transform:scale(1.1)}}
@keyframes endless-halo-breathe{0%,100%{opacity:0.25}50%{opacity:0.55}}
@keyframes final-ember-rise{0%{transform:translateY(0) scale(0.6);opacity:0}15%{opacity:0.85}100%{transform:translateY(-55px) scale(0.2);opacity:0}}
@keyframes final-ember-glow{0%,100%{opacity:0.4}50%{opacity:0.75}}
.fx-ember{position:absolute;width:3px;height:3px;border-radius:50%;background:#ff8c42;animation:final-ember-rise 4s ease-out infinite;pointer-events:none;will-change:transform,opacity}
.fx-ember.sm{width:2px;height:2px;background:#ffaa66}
.fx-ember.lg{width:4px;height:4px;background:#ff6020}
.fx-star{position:absolute;border-radius:50%;animation:endless-star-twinkle 3s ease-in-out infinite;pointer-events:none;will-change:transform,opacity}
@media(prefers-reduced-motion:reduce){.fx-ember,.fx-star{animation:none}.fx-ember{opacity:0}}
@keyframes chestReveal{0%{opacity:0;transform:translateY(30px) scale(.6)}60%{opacity:1;transform:translateY(-8px) scale(1.05)}100%{opacity:1;transform:translateY(0) scale(1)}}
@keyframes chestParticle{0%{opacity:1;transform:translateY(0) scale(1)}100%{opacity:0;transform:translateY(-80px) scale(0)}}
@keyframes flip{0%{transform:rotateY(90deg);opacity:0}100%{transform:rotateY(0);opacity:1}}
@keyframes countUp{from{opacity:0;transform:scale(.5)}to{opacity:1;transform:scale(1)}}
@keyframes tipSlide{from{opacity:0;transform:translateY(20px)}to{opacity:1;transform:translateY(0)}}
@keyframes tipFade{from{opacity:1;transform:translateY(0)}to{opacity:0;transform:translateY(20px)}}
/* ── Chest V2 (Boss Loot) animations ── */
@keyframes chestV2Zoom{0%{opacity:0;transform:scale(.3)}60%{transform:scale(1.15)}100%{opacity:1;transform:scale(1)}}
@keyframes chestV2Trembor{0%,100%{transform:translate(0,0) rotate(0)}25%{transform:translate(-5px,-3px) rotate(-4deg)}75%{transform:translate(5px,-3px) rotate(4deg)}}
@keyframes chestV2LidFly{0%{transform:translateY(0) rotate(0deg);opacity:1}40%{transform:translateY(-80px) rotate(-30deg);opacity:1}100%{transform:translateY(-200px) rotate(-80deg);opacity:0}}
@keyframes chestV2BodyCollapse{0%{transform:scale(1,1) translateY(0);opacity:1;filter:brightness(1)}40%{transform:scale(1.1,.85) translateY(8px);filter:brightness(2)}100%{transform:scale(.4,.2) translateY(30px);opacity:0;filter:brightness(4)}}
@keyframes chestV2ScreenFlash{0%,100%{opacity:0}50%{opacity:.85}}
@keyframes chestV2BurstExpand{0%{opacity:1;transform:scale(1)}100%{opacity:0;transform:scale(80)}}
@keyframes chestV2DustExpand{0%{opacity:0;transform:translate(-50%,-50%) scale(0)}30%{opacity:1}100%{opacity:0;transform:translate(-50%,-50%) scale(3.5)}}
@keyframes chestV2ShardFly{0%{opacity:1;transform:translate(-50%,-50%) rotate(var(--angle,0deg)) translateY(0) rotate(0deg)}100%{opacity:0;transform:translate(-50%,-50%) rotate(var(--angle,0deg)) translateY(var(--dist,200px)) rotate(720deg)}}
@keyframes chestV2BeamGrow{0%{height:0;opacity:.4}100%{height:100vh;opacity:1}}
@keyframes chestV2BeamShrink{to{opacity:0}}
@keyframes chestV2RewardFall{0%{opacity:0;transform:translateY(-220px) scale(.6) rotate(-8deg)}30%{opacity:1}100%{transform:translateY(0) scale(1) rotate(0deg);opacity:1}}
@keyframes chestV2RewardSettle{0%{transform:translateY(0) scale(1)}40%{transform:translateY(-10px) scale(1.05)}100%{transform:translateY(0) scale(1)}}
@keyframes chestV2ImpactRing{0%{opacity:1;transform:translate(-50%,-50%) scaleY(.4) scaleX(.3)}100%{opacity:0;transform:translate(-50%,-50%) scaleY(.4) scaleX(2.5)}}
@keyframes chestV2SpeedLine{0%{opacity:0;transform:translateY(-100px)}30%{opacity:1}100%{opacity:0;transform:translateY(200px)}}
@keyframes chestV2IconFloat{0%,100%{transform:translateY(0)}50%{transform:translateY(-6px)}}
/* ── Chest Earned Toast ── */
@keyframes toastSlideUp{from{opacity:0;transform:translate(-50%,40px)}to{opacity:1;transform:translate(-50%,0)}}
@keyframes toastFadeOut{from{opacity:1;transform:translate(-50%,0)}to{opacity:0;transform:translate(-50%,-10px)}}
@keyframes chestWiggle{0%,100%{transform:rotate(0deg)}15%{transform:rotate(-6deg)}30%{transform:rotate(6deg)}45%{transform:rotate(-4deg)}60%{transform:rotate(4deg)}75%{transform:rotate(-2deg)}90%{transform:rotate(2deg)}}
@keyframes legendGoldFlash{0%,100%{opacity:0}35%{opacity:.6}}
@keyframes legendShimmer{0%{background-position:-150% 50%}50%{background-position:250% 50%}100%{background-position:-150% 50%}}
.app{max-width:430px;margin:0 auto;min-height:100vh;background:var(--bg);color:var(--t1);position:relative;overflow-x:hidden}
@supports(height:100dvh){.app{min-height:100dvh}}
.pg-wrap{padding-bottom:calc(64px + env(safe-area-inset-bottom, 0px))}
.enter{animation:fadeIn .3s ease-out}
.crd{background:var(--bg2);border:1px solid var(--bdr);border-radius:16px;padding:20px;box-shadow:inset 0 1px 0 rgba(180,140,80,.04)}
.glo{box-shadow:0 0 30px rgba(var(--cx),.06)}
.btn1{background:linear-gradient(135deg,var(--cx-hex),var(--cx-dark));color:#0f0c08;border:none;border-radius:12px;padding:14px 28px;font-family:'Cinzel','Outfit',serif;font-weight:700;font-size:16px;cursor:pointer;width:100%;transition:all .2s}
.btn1:active{transform:scale(.97)}
.btn2{background:var(--bg2);border:1px solid var(--bdr);color:var(--t1);border-radius:12px;padding:12px 24px;font-family:'Cinzel','Outfit',serif;font-weight:600;font-size:14px;cursor:pointer}
.fl{animation:flame 1.5s ease-in-out infinite;display:inline-block}
.sk{animation:shake .4s ease-in-out}
.out{font-family:'Cinzel','Outfit',serif;letter-spacing:0.5px}
@media(min-width:768px){
.app:not(.onboard-shell){max-width:none;margin:0 0 0 200px;padding:0 32px}
.app.onboard-shell{max-width:480px;margin:0 auto;padding:0 16px}
.tab-bar{position:fixed!important;left:0!important;top:0!important;bottom:0!important;right:auto!important;transform:none!important;width:200px!important;max-width:200px!important;height:100vh!important;flex-direction:column!important;justify-content:flex-start!important;padding:24px 12px!important;background:var(--bg2)!important;border-right:1px solid var(--bdr)!important;gap:4px!important}
.light .tab-bar{background:var(--bg2)!important}
.tab-bar button{flex-direction:row!important;gap:10px!important;padding:12px 14px!important;border-radius:10px!important;justify-content:flex-start!important;width:100%!important}
.sidebar-brand{display:flex!important;align-items:center;gap:10px;padding:8px 14px 20px;margin-bottom:8px;border-bottom:1px solid var(--bdr)}
.tab-bar button span:first-child{font-size:18px!important}
.tab-bar button span:nth-child(2){font-size:13px!important;font-weight:600!important}
.tab-bar button div{display:none!important}
.enter{padding-bottom:32px!important}
.crd{padding:24px}
.crd:hover{border-color:rgba(180,140,80,.18);box-shadow:0 2px 12px rgba(var(--cx),.06)}
.btn1{width:auto;padding:14px 36px}
.btn2{padding:12px 28px}
.rg2{grid-template-columns:1fr 1fr 1fr!important}
.rg3{grid-template-columns:repeat(4,1fr)!important}
.rg-games{display:grid!important;grid-template-columns:1fr 1fr!important;gap:10px!important}
.p1-photo,.p1-photo-sm{max-height:500px!important}
.read-text{font-size:15px!important;line-height:2!important}
.read-opts button{font-size:15px!important;padding:14px 16px!important}
.q-heading{font-size:19px!important}
}

/* ═══ GRAMMAR GAUNTLET — HUB ═══ */
.gauntlet-hub{padding:20px 16px 100px;max-width:640px;margin:0 auto}
.gauntlet-header{text-align:center;margin-bottom:24px}
.gauntlet-title{font-family:'Cinzel','Outfit',serif;font-size:26px;font-weight:800;color:var(--t1);margin-bottom:6px;letter-spacing:1px}
.gauntlet-sub{color:var(--t3);font-size:13px;font-style:italic}
.gauntlet-card{position:relative;background:linear-gradient(135deg,var(--bg2),var(--bg3));border:1px solid rgba(255,255,255,.06);border-radius:18px;padding:18px 16px;margin-bottom:14px;overflow:hidden}
.gauntlet-card-accent{position:absolute;top:0;left:0;right:0;height:4px}
.gauntlet-card-head{display:flex;align-items:center;gap:14px;margin-bottom:8px}
.gauntlet-card-icon{font-size:36px;line-height:1;filter:drop-shadow(0 2px 6px rgba(0,0,0,.35));flex-shrink:0}
.gauntlet-card-name{font-family:'Cinzel','Outfit',serif;font-size:17px;font-weight:800;color:var(--t1);letter-spacing:.3px}
.gauntlet-card-desc{font-size:13px;color:var(--t3);margin-bottom:10px;line-height:1.5}
.gauntlet-card-stats{display:flex;gap:10px;font-size:11px;color:var(--t3);margin-bottom:12px;opacity:.85}
.gauntlet-card-actions{display:flex;gap:8px}
.gauntlet-btn-enter{flex:1;background:linear-gradient(135deg,#7c3aed,#c026d3);color:#fff;border:none;border-radius:12px;padding:12px;font-family:'Cinzel','Outfit',serif;font-weight:700;font-size:14px;cursor:pointer;letter-spacing:.3px}
.gauntlet-btn-grim{background:rgba(var(--cx),.1);color:var(--cyan);border:1px solid rgba(var(--cx),.3);border-radius:12px;padding:12px 14px;font-family:'Cinzel','Outfit',serif;font-weight:600;font-size:13px;cursor:pointer;white-space:nowrap}
.gauntlet-btn-grim:active{background:rgba(var(--cx),.22)}
.icrypt-input:focus{border-color:#c026d3!important;box-shadow:0 0 0 3px rgba(192,38,211,.2)}
.icrypt-input::placeholder{color:var(--t3);opacity:.5}
/* ═══ BACK BUTTON — standardized top-left navigation across all training modules ═══ */
.back-btn{background:none;border:none;color:var(--t2);cursor:pointer;font-size:14px;padding:8px 2px;min-height:40px;display:inline-flex;align-items:center;gap:4px;font-weight:600;font-family:inherit;margin-bottom:12px;transition:color .15s;letter-spacing:.2px}
.back-btn:hover{color:var(--t1)}
.back-btn:active{opacity:.7}
.chrono-marker{display:inline-block;padding:1px 8px;background:linear-gradient(135deg,rgba(124,58,237,.25),rgba(192,38,211,.25));border:1px solid rgba(192,38,211,.5);border-radius:6px;color:#e9d5ff;font-weight:700;margin:0 2px;letter-spacing:.2px}
.chrono-blank{display:inline-block;min-width:60px;border-bottom:2px solid #c026d3;margin:0 3px;vertical-align:middle;color:transparent;user-select:none}
.chrono-opt{display:block;width:100%;text-align:left;padding:13px 16px;margin-bottom:9px;background:var(--bg2);border:1.5px solid var(--bg3);border-radius:12px;color:var(--t1);font-size:15px;font-weight:600;cursor:pointer;transition:all .15s ease;font-family:inherit}
.chrono-opt:hover:not(:disabled){border-color:#7c3aed;background:rgba(124,58,237,.08)}
.chrono-opt:disabled{cursor:default}
.chrono-opt.correct{border-color:#22c55e;background:rgba(34,197,94,.12);color:#86efac}
.chrono-opt.wrong{border-color:#ef4444;background:rgba(239,68,68,.1);color:#fca5a5}
.chrono-opt.faded{opacity:.45}

/* ═══ GRIMOIRE READER ═══ */
.grim-overlay{position:fixed;inset:0;background:#0a0604;z-index:9000;display:flex;flex-direction:column;animation:grim-fade-in .3s ease}
@keyframes grim-fade-in{from{opacity:0}to{opacity:1}}
.grim-topbar{display:flex;align-items:center;gap:8px;padding:10px 12px;background:rgba(0,0,0,.7);border-bottom:1px solid rgba(245,223,170,.15);flex-shrink:0}
.grim-title{color:#f5dfaa;font-family:'Cinzel','Outfit',serif;font-size:14px;font-weight:600;letter-spacing:.4px;flex:1;text-align:center;padding:0 4px;line-height:1.25}
.grim-btn-close,.grim-btn-toc{background:rgba(245,223,170,.08);color:#f5dfaa;border:1px solid rgba(245,223,170,.2);border-radius:10px;padding:8px 12px;font-size:12px;cursor:pointer;font-weight:700;flex-shrink:0}
.grim-book{flex:1;perspective:2500px;display:flex;justify-content:center;align-items:stretch;padding:12px;overflow:hidden;position:relative}
.grim-page-wrap{position:relative;width:100%;max-width:560px;height:100%;transform-style:preserve-3d}
.grim-page{position:absolute;inset:0;background:radial-gradient(ellipse at center,#f4e8cc 0%,#e8d5a8 92%,#d9c288 100%);border-radius:6px;box-shadow:0 12px 40px rgba(0,0,0,.65),inset 0 0 50px rgba(139,90,40,.1);padding:26px 22px 40px;overflow-y:auto;filter:sepia(6%);-webkit-overflow-scrolling:touch}
.grim-page::before{content:"";position:absolute;inset:6px;border:1px solid rgba(139,90,40,.22);border-radius:3px;pointer-events:none}
.grim-flip-anim{transform-origin:left center;transition:transform 700ms cubic-bezier(.42,0,.2,1);backface-visibility:hidden;box-shadow:0 12px 40px rgba(0,0,0,.65),inset 0 0 50px rgba(139,90,40,.1)}
.grim-flip-next{animation:grim-flip-next 700ms cubic-bezier(.42,0,.2,1) forwards}
.grim-flip-prev{animation:grim-flip-prev 700ms cubic-bezier(.42,0,.2,1) forwards;transform-origin:right center}
@keyframes grim-flip-next{from{transform:rotateY(0);box-shadow:0 12px 40px rgba(0,0,0,.65)}to{transform:rotateY(-170deg);box-shadow:-20px 12px 40px rgba(0,0,0,.75)}}
@keyframes grim-flip-prev{from{transform:rotateY(0)}to{transform:rotateY(170deg)}}
/* Typography inside page */
.grim-page-content{font-family:'DM Sans',sans-serif;color:#3d2817;font-size:15px;line-height:1.65;display:flex;flex-direction:column;min-height:100%;box-sizing:border-box}
.grim-chapter-title{font-family:'Cinzel','Outfit',serif;font-size:21px;font-weight:700;text-align:center;margin-bottom:6px;color:#6b3410;letter-spacing:1.2px;text-transform:uppercase;padding-bottom:8px;border-bottom:1px solid rgba(107,52,16,.28)}
.grim-chapter-intro{font-style:italic;text-align:center;color:#6b4820;margin-bottom:18px;font-size:13.5px;line-height:1.55}
.grim-heading{font-family:'Cinzel','Outfit',serif;font-size:16px;font-weight:700;color:#6b3410;margin:18px 0 8px;letter-spacing:.3px;border-left:3px solid #8b5a28;padding-left:10px}
.grim-paragraph{margin-bottom:11px}
.grim-rule{background:rgba(139,90,40,.08);border-left:3px solid #8b5a28;border-radius:4px;padding:9px 13px;margin:11px 0}
.grim-rule-label{font-family:'Cinzel','Outfit',serif;font-weight:800;color:#6b3410;font-size:11px;text-transform:uppercase;letter-spacing:.8px;margin-bottom:3px}
.grim-rule-formula{font-family:'Courier New',monospace;font-size:13.5px;color:#3d2817;font-style:italic}
.grim-example{background:rgba(255,255,255,.38);border-radius:6px;padding:9px 12px;margin:9px 0;border-left:2px solid rgba(139,90,40,.4)}
.grim-example-en{font-weight:600;color:#2a1a08;font-size:14.5px}
.grim-example-fr{color:#6b4820;font-size:12.5px;margin-top:3px;font-style:italic}
.grim-example-note{color:#8b5a28;font-size:11.5px;margin-top:5px;padding-top:5px;border-top:1px dashed rgba(139,90,40,.25);line-height:1.5}
.grim-trap{background:rgba(200,50,50,.1);border:1px solid rgba(200,50,50,.32);border-radius:6px;padding:10px 13px;margin:12px 0;color:#6b1a1a;font-size:13px;line-height:1.5}
.grim-trap::before{content:"⚠  ";font-weight:800;color:#b02020;margin-right:2px}
.grim-table{width:100%;border-collapse:collapse;margin:10px 0;font-size:12.5px}
.grim-table th{background:rgba(139,90,40,.18);color:#3d2817;font-weight:800;padding:7px 8px;border:1px solid rgba(139,90,40,.3);text-align:left;font-size:11px;text-transform:uppercase;letter-spacing:.3px}
.grim-table td{padding:6px 8px;border:1px solid rgba(139,90,40,.22);color:#3d2817;background:rgba(255,255,255,.22)}
.grim-list{margin:6px 0 12px 18px;padding:0}
.grim-list li{margin-bottom:5px;line-height:1.55}
.grim-page-num{margin-top:auto;padding-top:24px;text-align:center;font-family:'Cinzel','Outfit',serif;color:#6b4820;font-size:11px;opacity:.65;letter-spacing:2px;pointer-events:none}
.grim-nav{display:flex;justify-content:space-between;align-items:center;gap:10px;padding:10px 12px;background:rgba(0,0,0,.7);border-top:1px solid rgba(245,223,170,.15);flex-shrink:0}
.grim-nav-btn{background:linear-gradient(135deg,#8b5a28,#6b3410);color:#f5dfaa;border:1px solid rgba(245,223,170,.3);border-radius:12px;padding:11px 14px;font-weight:700;font-size:13px;cursor:pointer;min-width:80px;touch-action:manipulation}
.grim-nav-btn:disabled{opacity:.3;cursor:not-allowed}
.grim-nav-info{color:#f5dfaa;font-family:'DM Sans',sans-serif;font-size:12px;flex:1;text-align:center;letter-spacing:.4px}
.grim-toc{position:absolute;inset:0;background:rgba(10,6,4,.97);z-index:20;padding:20px 18px;overflow-y:auto;animation:grim-fade-in .2s ease}
.grim-toc-title{color:#f5dfaa;font-family:'Cinzel','Outfit',serif;font-size:18px;font-weight:700;text-align:center;margin-bottom:16px;letter-spacing:1px}
.grim-toc-item{display:block;width:100%;background:rgba(245,223,170,.06);color:#f5dfaa;border:1px solid rgba(245,223,170,.15);border-radius:10px;padding:12px 14px;margin-bottom:7px;text-align:left;cursor:pointer;font-family:'DM Sans',sans-serif;font-size:14px;line-height:1.35}
.grim-toc-item.active{background:rgba(245,223,170,.18);border-color:rgba(245,223,170,.45)}
@media(max-width:480px){
  .grim-page{padding:22px 18px 38px;border-radius:4px}
  .grim-chapter-title{font-size:18px;letter-spacing:1px}
  .grim-heading{font-size:15px}
  .grim-page-content{font-size:14px;line-height:1.6}
  .grim-paragraph{margin-bottom:10px}
  .grim-example-en{font-size:13.5px}
  .grim-table{font-size:11.5px}
  .grim-table th,.grim-table td{padding:5px 6px}
  .gauntlet-card{padding:14px 13px}
  .gauntlet-card-icon{font-size:32px}
  .gauntlet-card-name{font-size:15.5px}
  .grim-nav-btn{padding:10px 12px;font-size:12.5px;min-width:72px}
  .grim-btn-close,.grim-btn-toc{padding:7px 10px;font-size:11.5px}
  .grim-title{font-size:13px}
}
`;

// ─── GRIMOIRE RENDERER (block-based pedagogical manuscript) ───
// Consumes blocks from data/grammarGauntletGrimoire.js.
// Mobile-first: single page, swipe left/right, CSS 3D flip animation.
function renderGrimoireBlock(b,i){
  if(b.type==="paragraph")return(<p key={i} className="grim-paragraph">{b.text}</p>);
  if(b.type==="heading")return(<h4 key={i} className="grim-heading">{b.text}</h4>);
  if(b.type==="rule")return(<div key={i} className="grim-rule">{b.label&&<div className="grim-rule-label">{b.label}</div>}<div className="grim-rule-formula">{b.formula}</div></div>);
  if(b.type==="example")return(<div key={i} className="grim-example"><div className="grim-example-en">{b.en}</div>{b.fr&&<div className="grim-example-fr">{b.fr}</div>}{b.note&&<div className="grim-example-note">{b.note}</div>}</div>);
  if(b.type==="trap")return(<div key={i} className="grim-trap">{b.text}</div>);
  if(b.type==="table")return(<table key={i} className="grim-table"><thead><tr>{b.headers.map(function(h,j){return(<th key={j}>{h}</th>);})}</tr></thead><tbody>{b.rows.map(function(r,j){return(<tr key={j}>{r.map(function(c,k){return(<td key={k}>{c}</td>);})}</tr>);})}</tbody></table>);
  if(b.type==="list")return(<ul key={i} className="grim-list">{b.items.map(function(it,j){return(<li key={j}>{it}</li>);})}</ul>);
  return null;
}

function GrimoireReader(p){
  var grim=p.grimoire;
  var [chIdx,setChIdx]=useState(0);
  var [flipDir,setFlipDir]=useState(null); // null | "next" | "prev"
  var [showToc,setShowToc]=useState(false);
  var touchStart=useRef(0);
  var ch=grim.chapters[chIdx];
  var total=grim.chapters.length;
  var romans=["I","II","III","IV","V","VI","VII","VIII","IX","X","XI","XII"];
  function go(dir){
    if(flipDir)return;
    var nxt=dir==="next"?chIdx+1:chIdx-1;
    if(nxt<0||nxt>=total)return;
    try{haptic("pageturn");}catch(e){console.warn("[Grim] haptic:",e&&e.message);}
    setFlipDir(dir);
    setTimeout(function(){setChIdx(nxt);setFlipDir(null);},680);
  }
  function onTouchStart(e){touchStart.current=e.touches[0].clientX;}
  function onTouchEnd(e){
    var dx=e.changedTouches[0].clientX-touchStart.current;
    if(dx<-50)go("next");
    else if(dx>50)go("prev");
  }
  function pickTocItem(i){setChIdx(i);setShowToc(false);}
  return(<div className="grim-overlay">
    <div className="grim-topbar">
      <button className="grim-btn-toc" onClick={function(){setShowToc(true);}}>{"\u2630"} Chapitres</button>
      <div className="grim-title">{grim.title}</div>
      <button className="grim-btn-close" onClick={p.back}>{"\u2715"}</button>
    </div>
    <div className="grim-book" onTouchStart={onTouchStart} onTouchEnd={onTouchEnd}>
      <div className="grim-page-wrap">
        <div className={"grim-page"+(flipDir==="next"?" grim-flip-anim grim-flip-next":flipDir==="prev"?" grim-flip-anim grim-flip-prev":"")}>
          <div className="grim-page-content">
            <div className="grim-chapter-title">{ch.title}</div>
            {ch.intro&&<div className="grim-chapter-intro">{ch.intro}</div>}
            {ch.blocks.map(function(b,i){return renderGrimoireBlock(b,i);})}
            <div className="grim-page-num">{"\u2014 "+(romans[chIdx]||(chIdx+1))+" \u2014"}</div>
          </div>
        </div>
      </div>
    </div>
    <div className="grim-nav">
      <button className="grim-nav-btn" disabled={chIdx===0||flipDir} onClick={function(){go("prev");}}>{"\u25C0 Prev"}</button>
      <div className="grim-nav-info">{"Chapitre "+(chIdx+1)+" / "+total}</div>
      <button className="grim-nav-btn" disabled={chIdx>=total-1||flipDir} onClick={function(){go("next");}}>{"Next \u25B6"}</button>
    </div>
    {showToc&&<div className="grim-toc">
      <div className="grim-toc-title">Table des Chapitres</div>
      {grim.chapters.map(function(c,i){return(
        <button key={i} className={"grim-toc-item"+(i===chIdx?" active":"")} onClick={function(){pickTocItem(i);}}>{c.title}</button>
      );})}
      <button className="grim-btn-close" style={{display:"block",margin:"18px auto 0",padding:"10px 20px"}} onClick={function(){setShowToc(false);}}>Fermer</button>
    </div>}
  </div>);
}

// ─── IRREGULAR CRYPT — sub-module 1/4 of Grammar Gauntlet ───
// Speed drill: 15 verbs per session, V2 + V3 text input, 15s per question.
// Scoring: 1 point per fully correct verb (V2 AND V3). Partial = 0 points
// but +1 XP bonus. Session completes -> p.done(sc, total, xp).
function IrregularCrypt(p){
  var SESSION_SIZE=15;
  var TIME_PER_Q=15;
  var [deck,setDeck]=useState(null);
  var [phase,setPhase]=useState("intro"); // intro | play | reveal | end
  var [idx,setIdx]=useState(0);
  var [v2In,setV2In]=useState("");
  var [v3In,setV3In]=useState("");
  var [revealData,setRevealData]=useState(null);
  var [results,setResults]=useState([]);
  var [timeLeft,setTimeLeft]=useState(TIME_PER_Q);

  function startSession(){
    var shuffled=[].concat(IRREGULAR_VERBS).sort(function(){return Math.random()-0.5;});
    var d=shuffled.slice(0,Math.min(SESSION_SIZE,shuffled.length));
    setDeck(d);setIdx(0);setResults([]);setV2In("");setV3In("");
    setTimeLeft(TIME_PER_Q);setPhase("play");
  }
  function normalize(s){return(s||"").toLowerCase().trim();}
  function submit(){
    if(phase!=="play"||!deck)return;
    var verb=deck[idx];
    var v2Ok=normalize(v2In)===normalize(verb.past);
    var v3Ok=normalize(v3In)===normalize(verb.pp);
    if(v2Ok&&v3Ok){try{playCorrect();}catch(e){console.warn("[icrypt] sfx:",e&&e.message);}}
    else{try{playWrong();}catch(e){console.warn("[icrypt] sfx:",e&&e.message);}}
    var newResults=results.concat([{v2Ok:v2Ok,v3Ok:v3Ok,verb:verb}]);
    setRevealData({v2Ok:v2Ok,v3Ok:v3Ok,verb:verb,v2Input:v2In,v3Input:v3In});
    setResults(newResults);
    setPhase("reveal");
    setTimeout(function(){
      if(idx>=deck.length-1){setPhase("end");}
      else{setIdx(idx+1);setV2In("");setV3In("");setRevealData(null);setPhase("play");}
    },3500);
  }
  // Timer
  useEffect(function(){
    if(phase!=="play")return;
    if(timeLeft<=0){submit();return;}
    var t=setTimeout(function(){setTimeLeft(timeLeft-1);},1000);
    return function(){clearTimeout(t);};
  },[timeLeft,phase]);
  useEffect(function(){if(phase==="play")setTimeLeft(TIME_PER_Q);},[idx,phase]);

  function finishSession(){
    var totalFull=results.filter(function(r){return r.v2Ok&&r.v3Ok;}).length;
    var totalPartial=results.filter(function(r){return(r.v2Ok||r.v3Ok)&&!(r.v2Ok&&r.v3Ok);}).length;
    // Gauntlet XP tier B: base 15 + 5 per full + 2 per partial + 35 perfect bonus.
    // Aligned with the other 3 Gauntlet sub-modules and the 15 Q tier at large.
    // Preserves the partial-credit granularity unique to Irregular Crypt.
    var baseXp=totalFull*5+totalPartial*2+15;
    if(totalFull===deck.length)baseXp+=35;
    p.done(totalFull,deck.length,baseXp);
  }

  if(phase==="intro"){
    return(<div className="enter" style={{padding:"20px 16px 100px",maxWidth:480,margin:"0 auto"}}>
      <button className="back-btn" onClick={p.back}>{"\u2190"} Back</button>
      <div style={{textAlign:"center",padding:"24px 16px"}}>
        <div style={{marginBottom:14,display:"flex",justifyContent:"center"}}><GIcon name="tombstone" size={64} color="var(--cyan)"/></div>
        <h2 className="out" style={{fontSize:24,fontWeight:800,marginBottom:8}}>Irregular Crypt</h2>
        <p style={{color:"var(--t3)",fontSize:14,marginBottom:20,lineHeight:1.5}}>Exhume 15 irregular verbs from the tombs of the past.</p>
        <div className="crd" style={{maxWidth:340,margin:"0 auto 22px",padding:16,textAlign:"left",fontSize:13.5,color:"var(--t2)",lineHeight:1.7}}>
          <div>{"\u23F1\uFE0F"} <strong>15 seconds</strong> per verb</div>
          <div>{"\u270D\uFE0F"} Type <strong>V2</strong> (past) and <strong>V3</strong> (past participle)</div>
          <div>{"\uD83C\uDFC6"} <strong>2 XP</strong> per mastered verb · perfect bonus</div>
        </div>
        <button className="btn1" style={{background:"linear-gradient(135deg,#7c3aed,#c026d3)",fontSize:16,padding:"14px 32px",fontWeight:800}} onClick={startSession}>{"\u2694\uFE0F Start the raid"}</button>
      </div>
    </div>);
  }

  if(phase==="end"){
    var totalFull=results.filter(function(r){return r.v2Ok&&r.v3Ok;}).length;
    var totalPartial=results.filter(function(r){return(r.v2Ok||r.v3Ok)&&!(r.v2Ok&&r.v3Ok);}).length;
    var isPerfect=totalFull===deck.length;
    var isGood=totalFull>=Math.ceil(deck.length*0.7);
    var missed=results.filter(function(r){return!(r.v2Ok&&r.v3Ok);});
    return(<div className="enter" style={{padding:"20px 16px 100px",maxWidth:480,margin:"0 auto"}}>
      <div style={{textAlign:"center",padding:"20px 16px"}}>
        <div style={{fontSize:60,marginBottom:14}}>{isPerfect?"\uD83D\uDC51":isGood?"\uD83C\uDFC6":"\uD83E\uDEA6"}</div>
        <h2 className="out" style={{fontSize:22,fontWeight:800,marginBottom:6}}>{isPerfect?"PERFECT RAID":isGood?"Raid victorious":"Raid complete"}</h2>
        <div style={{fontSize:44,fontWeight:800,color:"#c026d3",margin:"14px 0 2px"}}>{totalFull}<span style={{color:"var(--t3)",fontSize:24,fontWeight:600}}> / {deck.length}</span></div>
        <p style={{color:"var(--t3)",fontSize:13,marginBottom:6}}>verbs mastered (V2 + V3)</p>
        {totalPartial>0&&<p style={{color:"var(--t3)",fontSize:12,marginBottom:18}}>{totalPartial} partially correct</p>}
        {missed.length>0&&<div className="crd" style={{maxWidth:380,margin:"8px auto 20px",padding:14,textAlign:"left"}}>
          <div style={{fontSize:11,color:"var(--t3)",marginBottom:10,fontWeight:700,letterSpacing:1,textTransform:"uppercase"}}>{"To review"}</div>
          {missed.slice(0,10).map(function(r,i){return(
            <div key={i} style={{fontSize:13,marginBottom:6,color:"var(--t2)",lineHeight:1.5}}>
              <strong style={{color:"var(--t1)"}}>{r.verb.base}</strong> {"\u2192"} <span style={{color:"#22c55e"}}>{r.verb.past}</span> / <span style={{color:"#22c55e"}}>{r.verb.pp}</span> <span style={{color:"var(--t3)",fontSize:12,fontStyle:"italic"}}>({r.verb.fr})</span>
            </div>
          );})}
        </div>}
        <button className="btn1" style={{background:"linear-gradient(135deg,#7c3aed,#c026d3)",fontSize:16,padding:"14px 32px",fontWeight:800}} onClick={finishSession}>OK, back</button>
      </div>
    </div>);
  }

  // phase === "play" or "reveal"
  var verb=deck[idx];
  var pct=timeLeft/TIME_PER_Q*100;
  return(<div className="enter" style={{padding:"16px 16px 100px",maxWidth:480,margin:"0 auto"}}>
    <button className="back-btn" onClick={p.back}>{"\u2190"} Back</button>
    <div style={{fontSize:12,color:"var(--t3)",textAlign:"center",marginBottom:4}}>Verb {idx+1} / {deck.length}</div>
    <div style={{width:"100%",height:6,background:"var(--bg3)",borderRadius:99,overflow:"hidden",marginBottom:20}}>
      <div style={{width:pct+"%",height:"100%",background:phase==="play"?(timeLeft<5?"#ef4444":"linear-gradient(90deg,#7c3aed,#c026d3)"):"#6b7280",transition:"width 1s linear"}}/>
    </div>
    <div style={{textAlign:"center",padding:"14px 0 22px"}}>
      <div style={{fontSize:11,color:"var(--t3)",marginBottom:6,letterSpacing:2,textTransform:"uppercase"}}>Base</div>
      <div style={{fontSize:38,fontWeight:800,color:"var(--t1)",letterSpacing:.5}}>{verb.base}</div>
    </div>
    {phase==="play"?(
      <div style={{maxWidth:360,margin:"0 auto"}}>
        <label style={{display:"block",fontSize:11,color:"var(--t3)",marginBottom:6,letterSpacing:1.2,textTransform:"uppercase"}}>V2 (past)</label>
        <input type="text" value={v2In} onChange={function(e){setV2In(e.target.value);}} autoFocus autoComplete="off" autoCapitalize="none" spellCheck="false" onKeyDown={function(e){if(e.key==="Enter"&&v2In){var n=document.getElementById("icrypt-v3");if(n)n.focus();}}} className="icrypt-input" style={{width:"100%",padding:"12px 14px",fontSize:17,background:"var(--bg2)",border:"2px solid var(--bg3)",borderRadius:10,color:"var(--t1)",marginBottom:14,fontFamily:"inherit",outline:"none",boxSizing:"border-box"}}/>
        <label style={{display:"block",fontSize:11,color:"var(--t3)",marginBottom:6,letterSpacing:1.2,textTransform:"uppercase"}}>V3 (past participle)</label>
        <input id="icrypt-v3" type="text" value={v3In} onChange={function(e){setV3In(e.target.value);}} autoComplete="off" autoCapitalize="none" spellCheck="false" onKeyDown={function(e){if(e.key==="Enter")submit();}} className="icrypt-input" style={{width:"100%",padding:"12px 14px",fontSize:17,background:"var(--bg2)",border:"2px solid var(--bg3)",borderRadius:10,color:"var(--t1)",marginBottom:18,fontFamily:"inherit",outline:"none",boxSizing:"border-box"}}/>
        <button className="btn1" style={{width:"100%",background:"linear-gradient(135deg,#7c3aed,#c026d3)",fontSize:15,padding:"13px",fontWeight:800}} onClick={submit}>Submit</button>
      </div>
    ):(
      <div style={{maxWidth:360,margin:"0 auto"}}>
        <div className="crd" style={{padding:14,marginBottom:12}}>
          <div style={{display:"flex",gap:12,marginBottom:12}}>
            <div style={{flex:1,minWidth:0}}>
              <div style={{fontSize:10,color:"var(--t3)",marginBottom:3,letterSpacing:1,textTransform:"uppercase"}}>V2</div>
              <div style={{fontSize:16,fontWeight:700,color:revealData.v2Ok?"#22c55e":"#ef4444",wordBreak:"break-word"}}>{revealData.verb.past} {revealData.v2Ok?"\u2713":"\u2717"}</div>
              {!revealData.v2Ok&&revealData.v2Input&&<div style={{fontSize:12,color:"var(--t3)",textDecoration:"line-through",marginTop:3,wordBreak:"break-word"}}>{revealData.v2Input}</div>}
            </div>
            <div style={{flex:1,minWidth:0}}>
              <div style={{fontSize:10,color:"var(--t3)",marginBottom:3,letterSpacing:1,textTransform:"uppercase"}}>V3</div>
              <div style={{fontSize:16,fontWeight:700,color:revealData.v3Ok?"#22c55e":"#ef4444",wordBreak:"break-word"}}>{revealData.verb.pp} {revealData.v3Ok?"\u2713":"\u2717"}</div>
              {!revealData.v3Ok&&revealData.v3Input&&<div style={{fontSize:12,color:"var(--t3)",textDecoration:"line-through",marginTop:3,wordBreak:"break-word"}}>{revealData.v3Input}</div>}
            </div>
          </div>
          <div style={{fontSize:12.5,color:"var(--t2)",fontStyle:"italic",marginBottom:8}}>{revealData.verb.fr}</div>
          <div style={{fontSize:13,color:"var(--t2)",lineHeight:1.55,borderLeft:"2px solid var(--bg3)",paddingLeft:10}}>{revealData.verb.ex}</div>
        </div>
        <div style={{textAlign:"center",fontSize:11,color:"var(--t3)",opacity:.7}}>Next in a moment...</div>
      </div>
    )}
  </div>);
}

// ─── CHRONOMANCER — sub-module 2/4 of Grammar Gauntlet ───
// Contextual QCM: 15 tense questions, no timer (reflection). Temporal
// marker highlighted in the sentence when a literal match is found, and
// shown as a hint pill above the sentence regardless. Manual "Continue"
// after reveal to encourage reading the explanation.
function Chronomancer(p){
  var SESSION_SIZE=15;
  var [deck,setDeck]=useState(null);
  var [phase,setPhase]=useState("intro"); // intro | play | reveal | end
  var [idx,setIdx]=useState(0);
  var [picked,setPicked]=useState(null);
  var [results,setResults]=useState([]);

  function startSession(){
    var shuffled=[].concat(TENSE_CHRONOMANCER).sort(function(){return Math.random()-0.5;});
    var d=shuffled.slice(0,Math.min(SESSION_SIZE,shuffled.length));
    setDeck(d);setIdx(0);setResults([]);setPicked(null);setPhase("play");
  }
  function pickAnswer(optIdx){
    if(phase!=="play"||!deck)return;
    var q=deck[idx];
    var ok=optIdx===q.c;
    if(ok){try{playCorrect();}catch(e){console.warn("[chrono] sfx:",e&&e.message);}}
    else{try{playWrong();}catch(e){console.warn("[chrono] sfx:",e&&e.message);}}
    setPicked(optIdx);
    setResults(results.concat([{q:q,picked:optIdx,ok:ok}]));
    setPhase("reveal");
  }
  function nextQ(){
    if(!deck)return;
    if(idx>=deck.length-1){setPhase("end");}
    else{setIdx(idx+1);setPicked(null);setPhase("play");}
  }
  function finishSession(){
    var correct=results.filter(function(r){return r.ok;}).length;
    // Gauntlet XP tier B: base 15 + 5 per correct + 35 perfect bonus.
    // Aligned with Word Tavern / SentenceBuilder / Phrasal Picker (15 Q tier)
    // to match the difficulty of the module (typed answers, strict timer).
    var baseXp=correct*5+15;
    if(correct===deck.length)baseXp+=35;
    p.done(correct,deck.length,baseXp);
  }

  // Render sentence: highlight marker if literal substring match; replace blank with styled span
  function renderSentence(s,marker){
    var cleanMarker=(marker||"").replace(/\s*\([^)]*\)\s*/g,"").trim();
    var parts=[];
    var working=s;
    var highlighted=false;
    if(cleanMarker){
      var lower=working.toLowerCase();
      var pos=lower.indexOf(cleanMarker.toLowerCase());
      if(pos!==-1){
        var before=working.substring(0,pos);
        var match=working.substring(pos,pos+cleanMarker.length);
        var after=working.substring(pos+cleanMarker.length);
        parts=[{t:"text",v:before},{t:"marker",v:match},{t:"text",v:after}];
        highlighted=true;
      }
    }
    if(!highlighted)parts=[{t:"text",v:working}];
    // Now render each part, replacing _____ (5 underscores) with a styled blank
    return parts.map(function(part,i){
      if(part.t==="marker")return(<span key={i} className="chrono-marker">{part.v}</span>);
      var segs=part.v.split(/_{3,}/);
      return(<span key={i}>{segs.map(function(seg,j){
        return(<span key={j}>{seg}{j<segs.length-1&&<span className="chrono-blank">_____</span>}</span>);
      })}</span>);
    });
  }

  if(phase==="intro"){
    return(<div className="enter" style={{padding:"20px 16px 100px",maxWidth:520,margin:"0 auto"}}>
      <button className="back-btn" onClick={p.back}>{"\u2190"} Back</button>
      <div style={{textAlign:"center",padding:"24px 16px"}}>
        <div style={{marginBottom:14,display:"flex",justifyContent:"center"}}><GIcon name="clockwork" size={64} color="var(--cyan)"/></div>
        <h2 className="out" style={{fontSize:24,fontWeight:800,marginBottom:8}}>Chronomancer</h2>
        <p style={{color:"var(--t3)",fontSize:14,marginBottom:20,lineHeight:1.5}}>Master the storm of verb tenses. Each question hides a temporal clue.</p>
        <div className="crd" style={{maxWidth:340,margin:"0 auto 22px",padding:16,textAlign:"left",fontSize:13.5,color:"var(--t2)",lineHeight:1.7}}>
          <div>{"\uD83D\uDD2E"} <strong>15 questions</strong>, no timer</div>
          <div>{"\uD83D\uDD8D\uFE0F"} Temporal marker in <span style={{color:"#c026d3",fontWeight:700}}>purple</span></div>
          <div>{"\uD83C\uDFC6"} <strong>3 XP</strong> per correct answer · perfect bonus</div>
        </div>
        <button className="btn1" style={{background:"linear-gradient(135deg,#7c3aed,#c026d3)",fontSize:16,padding:"14px 32px",fontWeight:800}} onClick={startSession}>{"\u2694\uFE0F Start"}</button>
      </div>
    </div>);
  }

  if(phase==="end"){
    var correctCount=results.filter(function(r){return r.ok;}).length;
    var isPerfect=correctCount===deck.length;
    var isGood=correctCount>=Math.ceil(deck.length*0.7);
    var missed=results.filter(function(r){return!r.ok;});
    return(<div className="enter" style={{padding:"20px 16px 100px",maxWidth:520,margin:"0 auto"}}>
      <div style={{textAlign:"center",padding:"20px 16px"}}>
        <div style={{fontSize:60,marginBottom:14}}>{isPerfect?"\uD83D\uDC51":isGood?"\uD83C\uDFC6":"\u231B"}</div>
        <h2 className="out" style={{fontSize:22,fontWeight:800,marginBottom:6}}>{isPerfect?"TIME MASTERED":isGood?"Chronomancer victorious":"Session complete"}</h2>
        <div style={{fontSize:44,fontWeight:800,color:"#c026d3",margin:"14px 0 2px"}}>{correctCount}<span style={{color:"var(--t3)",fontSize:24,fontWeight:600}}> / {deck.length}</span></div>
        <p style={{color:"var(--t3)",fontSize:13,marginBottom:18}}>correct answers</p>
        {missed.length>0&&<div className="crd" style={{maxWidth:420,margin:"8px auto 20px",padding:14,textAlign:"left"}}>
          <div style={{fontSize:11,color:"var(--t3)",marginBottom:10,fontWeight:700,letterSpacing:1,textTransform:"uppercase"}}>{"To review"}</div>
          {missed.slice(0,8).map(function(r,i){return(
            <div key={i} style={{fontSize:12.5,marginBottom:10,color:"var(--t2)",lineHeight:1.5,paddingBottom:8,borderBottom:i<Math.min(missed.length,8)-1?"1px dashed var(--bg3)":"none"}}>
              <div style={{marginBottom:3}}>{renderSentence(r.q.s,r.q.marker)}</div>
              <div style={{fontSize:11.5,color:"#86efac",marginTop:3}}>{"\u2192 "}<strong>{r.q.o[r.q.c]}</strong></div>
            </div>
          );})}
        </div>}
        <button className="btn1" style={{background:"linear-gradient(135deg,#7c3aed,#c026d3)",fontSize:16,padding:"14px 32px",fontWeight:800}} onClick={finishSession}>OK, back</button>
      </div>
    </div>);
  }

  // phase "play" or "reveal"
  var q=deck[idx];
  var pct=(idx+1)/deck.length*100;
  return(<div className="enter" style={{padding:"16px 16px 100px",maxWidth:520,margin:"0 auto"}}>
    <button className="back-btn" onClick={p.back}>{"\u2190"} Back</button>
    <div style={{fontSize:12,color:"var(--t3)",textAlign:"center",marginBottom:4}}>Question {idx+1} / {deck.length}</div>
    <div style={{width:"100%",height:5,background:"var(--bg3)",borderRadius:99,overflow:"hidden",marginBottom:18}}>
      <div style={{width:pct+"%",height:"100%",background:"linear-gradient(90deg,#7c3aed,#c026d3)",transition:"width .3s ease"}}/>
    </div>
    {/* Marker hint badge */}
    {q.marker&&<div style={{textAlign:"center",marginBottom:14}}>
      <span style={{display:"inline-block",padding:"4px 12px",background:"rgba(124,58,237,.15)",border:"1px solid rgba(192,38,211,.4)",borderRadius:99,color:"#d8b4fe",fontSize:12,fontWeight:700,letterSpacing:.3}}>{"\uD83D\uDD2E  Clue: "}<span style={{color:"#e9d5ff"}}>{q.marker}</span></span>
    </div>}
    {/* Sentence */}
    <div className="crd" style={{padding:"18px 16px",marginBottom:14,fontSize:16.5,lineHeight:1.7,color:"var(--t1)"}}>
      {renderSentence(q.s,q.marker)}
    </div>
    {/* Options */}
    <div>
      {q.o.map(function(opt,i){
        var cls="chrono-opt";
        if(phase==="reveal"){
          if(i===q.c)cls+=" correct";
          else if(i===picked)cls+=" wrong";
          else cls+=" faded";
        }
        return(<button key={i} className={cls} disabled={phase==="reveal"} onClick={function(){pickAnswer(i);}}>
          <span style={{display:"inline-block",width:22,fontWeight:800,color:phase==="reveal"&&i===q.c?"#22c55e":phase==="reveal"&&i===picked?"#ef4444":"var(--t3)"}}>{String.fromCharCode(65+i)}.</span>{opt}
        </button>);
      })}
    </div>
    {/* Reveal card */}
    {phase==="reveal"&&<div className="crd enter" style={{padding:14,marginTop:14,borderLeft:"3px solid "+(results[results.length-1]&&results[results.length-1].ok?"#22c55e":"#f59e0b")}}>
      <div style={{fontSize:11,color:"var(--t3)",marginBottom:6,fontWeight:700,letterSpacing:.8,textTransform:"uppercase"}}>{results[results.length-1]&&results[results.length-1].ok?"\u2713 Correct":"Explanation"}</div>
      <div style={{fontSize:13.5,color:"var(--t2)",lineHeight:1.6,marginBottom:10}}>{q.x}</div>
      <button className="btn1" style={{width:"100%",background:"linear-gradient(135deg,#7c3aed,#c026d3)",fontSize:14,padding:"11px",fontWeight:800}} onClick={nextQ}>{idx>=deck.length-1?"See result":"Next question \u2192"}</button>
    </div>}
  </div>);
}

// ─── PASSIVE FORGE — sub-module 3/4 of Grammar Gauntlet ───
// QCM 2-modes (transform vs fill-in). 15 questions per session.
// Timer 30s per question (validated spec): auto-miss on expiry. The timer
// rewards fluency in passive construction — 30s is enough to mentally
// conjugate be + V3, but short enough to discourage guessing-then-reading.
function PassiveForge(p){
  var SESSION_SIZE=15;
  var TIME_PER_Q=30;
  var [deck,setDeck]=useState(null);
  var [phase,setPhase]=useState("intro"); // intro | play | reveal | end
  var [idx,setIdx]=useState(0);
  var [picked,setPicked]=useState(null); // null | number | -1 (timed out)
  var [results,setResults]=useState([]);
  var [timeLeft,setTimeLeft]=useState(TIME_PER_Q);

  function startSession(){
    var shuffled=[].concat(PASSIVE_FORGE).sort(function(){return Math.random()-0.5;});
    var d=shuffled.slice(0,Math.min(SESSION_SIZE,shuffled.length));
    setDeck(d);setIdx(0);setResults([]);setPicked(null);
    setTimeLeft(TIME_PER_Q);setPhase("play");
  }
  function pickAnswer(optIdx){
    if(phase!=="play"||!deck)return;
    var q=deck[idx];
    var ok=optIdx===q.c;
    if(ok){try{playCorrect();}catch(e){console.warn("[forge] sfx:",e&&e.message);}}
    else{try{playWrong();}catch(e){console.warn("[forge] sfx:",e&&e.message);}}
    setPicked(optIdx);
    setResults(results.concat([{q:q,picked:optIdx,ok:ok,timedOut:false}]));
    setPhase("reveal");
  }
  function timeoutQ(){
    if(phase!=="play"||!deck)return;
    try{playWrong();}catch(e){console.warn("[forge] sfx:",e&&e.message);}
    var q=deck[idx];
    setPicked(-1);
    setResults(results.concat([{q:q,picked:-1,ok:false,timedOut:true}]));
    setPhase("reveal");
  }
  function nextQ(){
    if(!deck)return;
    if(idx>=deck.length-1){setPhase("end");}
    else{setIdx(idx+1);setPicked(null);setPhase("play");}
  }
  function finishSession(){
    var correct=results.filter(function(r){return r.ok;}).length;
    // Gauntlet XP tier B: base 15 + 5 per correct + 35 perfect bonus.
    // Aligned with Word Tavern / SentenceBuilder / Phrasal Picker (15 Q tier)
    // to match the difficulty of the module (typed answers, strict timer).
    var baseXp=correct*5+15;
    if(correct===deck.length)baseXp+=35;
    p.done(correct,deck.length,baseXp);
  }
  // Timer
  useEffect(function(){
    if(phase!=="play")return;
    if(timeLeft<=0){timeoutQ();return;}
    var t=setTimeout(function(){setTimeLeft(timeLeft-1);},1000);
    return function(){clearTimeout(t);};
  },[timeLeft,phase]);
  useEffect(function(){if(phase==="play")setTimeLeft(TIME_PER_Q);},[idx,phase]);

  function renderWithBlank(s){
    var segs=s.split(/_{3,}/);
    return segs.map(function(seg,j){
      return(<span key={j}>{seg}{j<segs.length-1&&<span className="chrono-blank">_____</span>}</span>);
    });
  }

  if(phase==="intro"){
    return(<div className="enter" style={{padding:"20px 16px 100px",maxWidth:520,margin:"0 auto"}}>
      <button className="back-btn" onClick={p.back}>{"\u2190"} Back</button>
      <div style={{textAlign:"center",padding:"24px 16px"}}>
        <div style={{marginBottom:14,display:"flex",justifyContent:"center"}}><GIcon name="anvil-impact" size={64} color="var(--cyan)"/></div>
        <h2 className="out" style={{fontSize:24,fontWeight:800,marginBottom:8}}>Passive Forge</h2>
        <p style={{color:"var(--t3)",fontSize:14,marginBottom:20,lineHeight:1.5}}>Transform active into passive. Forge the right structure in 30 seconds.</p>
        <div className="crd" style={{maxWidth:340,margin:"0 auto 22px",padding:16,textAlign:"left",fontSize:13.5,color:"var(--t2)",lineHeight:1.7}}>
          <div>{"\u2699\uFE0F"} <strong>15 questions</strong>, 2 modes: transform + fill-in</div>
          <div>{"\u23F1\uFE0F"} <strong>30 seconds</strong> per question</div>
          <div>{"\uD83C\uDFC6"} <strong>3 XP</strong> per correct answer · perfect bonus</div>
        </div>
        <button className="btn1" style={{background:"linear-gradient(135deg,#dc2626,#f59e0b)",fontSize:16,padding:"14px 32px",fontWeight:800}} onClick={startSession}>{"\u2694\uFE0F Start"}</button>
      </div>
    </div>);
  }

  if(phase==="end"){
    var correctCount=results.filter(function(r){return r.ok;}).length;
    var isPerfect=correctCount===deck.length;
    var isGood=correctCount>=Math.ceil(deck.length*0.7);
    var missed=results.filter(function(r){return!r.ok;});
    return(<div className="enter" style={{padding:"20px 16px 100px",maxWidth:520,margin:"0 auto"}}>
      <div style={{textAlign:"center",padding:"20px 16px"}}>
        <div style={{fontSize:60,marginBottom:14}}>{isPerfect?"\uD83D\uDC51":isGood?"\uD83C\uDFC6":"\u2692\uFE0F"}</div>
        <h2 className="out" style={{fontSize:22,fontWeight:800,marginBottom:6}}>{isPerfect?"FORGE MASTERED":isGood?"Forge victorious":"Session complete"}</h2>
        <div style={{fontSize:44,fontWeight:800,color:"#f59e0b",margin:"14px 0 2px"}}>{correctCount}<span style={{color:"var(--t3)",fontSize:24,fontWeight:600}}> / {deck.length}</span></div>
        <p style={{color:"var(--t3)",fontSize:13,marginBottom:18}}>correct answers</p>
        {missed.length>0&&<div className="crd" style={{maxWidth:420,margin:"8px auto 20px",padding:14,textAlign:"left"}}>
          <div style={{fontSize:11,color:"var(--t3)",marginBottom:10,fontWeight:700,letterSpacing:1,textTransform:"uppercase"}}>{"To review"}</div>
          {missed.slice(0,8).map(function(r,i){return(
            <div key={i} style={{fontSize:12.5,marginBottom:10,color:"var(--t2)",lineHeight:1.5,paddingBottom:8,borderBottom:i<Math.min(missed.length,8)-1?"1px dashed var(--bg3)":"none"}}>
              <div style={{marginBottom:3}}>{renderWithBlank(r.q.prompt)}</div>
              <div style={{fontSize:11.5,color:"#86efac",marginTop:3}}>{"\u2192 "}<strong>{r.q.o[r.q.c]}</strong></div>
            </div>
          );})}
        </div>}
        <button className="btn1" style={{background:"linear-gradient(135deg,#dc2626,#f59e0b)",fontSize:16,padding:"14px 32px",fontWeight:800}} onClick={finishSession}>OK, back</button>
      </div>
    </div>);
  }

  // phase "play" or "reveal"
  var q=deck[idx];
  var progPct=(idx+1)/deck.length*100;
  var timePct=timeLeft/TIME_PER_Q*100;
  var lastResult=results[results.length-1];
  var isTimedOut=phase==="reveal"&&picked===-1;
  return(<div className="enter" style={{padding:"16px 16px 100px",maxWidth:520,margin:"0 auto"}}>
    <button className="back-btn" onClick={p.back}>{"\u2190"} Back</button>
    <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",fontSize:12,color:"var(--t3)",marginBottom:4}}>
      <span>Question {idx+1} / {deck.length}</span>
      {phase==="play"&&<span style={{fontWeight:700,color:timeLeft<10?"#ef4444":"#f59e0b"}}>{"\u23F1\uFE0F "+timeLeft+"s"}</span>}
    </div>
    {/* progress bar */}
    <div style={{width:"100%",height:5,background:"var(--bg3)",borderRadius:99,overflow:"hidden",marginBottom:8}}>
      <div style={{width:progPct+"%",height:"100%",background:"linear-gradient(90deg,#dc2626,#f59e0b)",transition:"width .3s ease"}}/>
    </div>
    {/* timer bar */}
    {phase==="play"&&<div style={{width:"100%",height:4,background:"var(--bg3)",borderRadius:99,overflow:"hidden",marginBottom:16}}>
      <div style={{width:timePct+"%",height:"100%",background:timeLeft<10?"#ef4444":"#f59e0b",transition:"width 1s linear"}}/>
    </div>}
    {phase==="reveal"&&<div style={{marginBottom:16}}/>}
    {/* Mode badge */}
    <div style={{textAlign:"center",marginBottom:12}}>
      <span style={{display:"inline-block",padding:"3px 11px",background:q.mode==="transform"?"rgba(220,38,38,.15)":"rgba(245,158,11,.15)",border:"1px solid "+(q.mode==="transform"?"rgba(220,38,38,.4)":"rgba(245,158,11,.4)"),borderRadius:99,color:q.mode==="transform"?"#fca5a5":"#fcd34d",fontSize:11,fontWeight:700,letterSpacing:.5,textTransform:"uppercase"}}>{q.mode==="transform"?"\uD83D\uDD04 Transform":"\u270D\uFE0F Fill in the blank"}</span>
    </div>
    {/* Active sentence (transform mode only) */}
    {q.mode==="transform"&&q.active&&<div style={{padding:"12px 14px",marginBottom:8,background:"rgba(255,255,255,.04)",border:"1px dashed var(--bg3)",borderRadius:10,fontSize:14,color:"var(--t3)",lineHeight:1.55}}>
      <div style={{fontSize:10,color:"var(--t3)",opacity:.7,marginBottom:3,letterSpacing:1,textTransform:"uppercase",fontWeight:700}}>Active</div>
      {q.active}
    </div>}
    {q.mode==="transform"&&<div style={{textAlign:"center",fontSize:18,color:"var(--t3)",marginBottom:6}}>{"\u2193"}</div>}
    {/* Prompt */}
    <div className="crd" style={{padding:"16px",marginBottom:14,fontSize:16,lineHeight:1.7,color:"var(--t1)"}}>
      {q.mode==="transform"&&<div style={{fontSize:10,color:"var(--t3)",opacity:.7,marginBottom:4,letterSpacing:1,textTransform:"uppercase",fontWeight:700}}>Passive</div>}
      {renderWithBlank(q.prompt)}
    </div>
    {/* Options */}
    <div>
      {q.o.map(function(opt,i){
        var cls="chrono-opt";
        if(phase==="reveal"){
          if(i===q.c)cls+=" correct";
          else if(i===picked&&picked!==-1)cls+=" wrong";
          else cls+=" faded";
        }
        return(<button key={i} className={cls} disabled={phase==="reveal"} onClick={function(){pickAnswer(i);}}>
          <span style={{display:"inline-block",width:22,fontWeight:800,color:phase==="reveal"&&i===q.c?"#22c55e":phase==="reveal"&&i===picked&&picked!==-1?"#ef4444":"var(--t3)"}}>{String.fromCharCode(65+i)}.</span>{opt}
        </button>);
      })}
    </div>
    {/* Reveal card */}
    {phase==="reveal"&&<div className="crd enter" style={{padding:14,marginTop:14,borderLeft:"3px solid "+(lastResult&&lastResult.ok?"#22c55e":isTimedOut?"#ef4444":"#f59e0b")}}>
      <div style={{fontSize:11,color:isTimedOut?"#fca5a5":"var(--t3)",marginBottom:6,fontWeight:700,letterSpacing:.8,textTransform:"uppercase"}}>{lastResult&&lastResult.ok?"\u2713 Correct":isTimedOut?"\u23F1 Time's up":"Explanation"}</div>
      <div style={{fontSize:13.5,color:"var(--t2)",lineHeight:1.6,marginBottom:10}}>{q.x}</div>
      <button className="btn1" style={{width:"100%",background:"linear-gradient(135deg,#dc2626,#f59e0b)",fontSize:14,padding:"11px",fontWeight:800}} onClick={nextQ}>{idx>=deck.length-1?"See result":"Next question \u2192"}</button>
    </div>}
  </div>);
}

// ─── RELATIVE WEAVER — sub-module 4/4 of Grammar Gauntlet ───
// QCM reflection: 15 questions per session, no timer. Mixes defining/
// non-defining, reduced relatives, possession (whose), place/time.
// The item `type` is NOT shown during play (would spoil the answer) but
// shown on the end screen to help the student map weaknesses.
function RelativeWeaver(p){
  var SESSION_SIZE=15;
  var [deck,setDeck]=useState(null);
  var [phase,setPhase]=useState("intro");
  var [idx,setIdx]=useState(0);
  var [picked,setPicked]=useState(null);
  var [results,setResults]=useState([]);

  function startSession(){
    var shuffled=[].concat(RELATIVE_WEAVER).sort(function(){return Math.random()-0.5;});
    var d=shuffled.slice(0,Math.min(SESSION_SIZE,shuffled.length));
    setDeck(d);setIdx(0);setResults([]);setPicked(null);setPhase("play");
  }
  function pickAnswer(optIdx){
    if(phase!=="play"||!deck)return;
    var q=deck[idx];
    var ok=optIdx===q.c;
    if(ok){try{playCorrect();}catch(e){console.warn("[weaver] sfx:",e&&e.message);}}
    else{try{playWrong();}catch(e){console.warn("[weaver] sfx:",e&&e.message);}}
    setPicked(optIdx);
    setResults(results.concat([{q:q,picked:optIdx,ok:ok}]));
    setPhase("reveal");
  }
  function nextQ(){
    if(!deck)return;
    if(idx>=deck.length-1){setPhase("end");}
    else{setIdx(idx+1);setPicked(null);setPhase("play");}
  }
  function finishSession(){
    var correct=results.filter(function(r){return r.ok;}).length;
    // Gauntlet XP tier B: base 15 + 5 per correct + 35 perfect bonus.
    // Aligned with Word Tavern / SentenceBuilder / Phrasal Picker (15 Q tier)
    // to match the difficulty of the module (typed answers, strict timer).
    var baseXp=correct*5+15;
    if(correct===deck.length)baseXp+=35;
    p.done(correct,deck.length,baseXp);
  }
  function renderWithBlank(s){
    var segs=s.split(/_{3,}/);
    return segs.map(function(seg,j){
      return(<span key={j}>{seg}{j<segs.length-1&&<span className="chrono-blank">_____</span>}</span>);
    });
  }
  function typeLabel(t){
    if(!t)return"";
    if(t.indexOf("reduced_relative_active")===0)return"Reduced relative (active)";
    if(t.indexOf("reduced_relative_passive")===0)return"Reduced relative (passive)";
    if(t.indexOf("reduced_relative")===0)return"Reduced relative";
    if(t.indexOf("non_defining")===0)return"Non-defining";
    if(t.indexOf("defining")===0)return"Defining";
    if(t.indexOf("possession")===0)return"Possession (whose)";
    if(t==="place")return"Place (where)";
    if(t==="time")return"Time (when)";
    if(t==="formal_object_person")return"Formal (whom)";
    return t.replace(/_/g," ");
  }

  if(phase==="intro"){
    return(<div className="enter" style={{padding:"20px 16px 100px",maxWidth:520,margin:"0 auto"}}>
      <button className="back-btn" onClick={p.back}>{"\u2190"} Back</button>
      <div style={{textAlign:"center",padding:"24px 16px"}}>
        <div style={{marginBottom:14,display:"flex",justifyContent:"center"}}><GIcon name="spider-web" size={64} color="var(--cyan)"/></div>
        <h2 className="out" style={{fontSize:24,fontWeight:800,marginBottom:8}}>Relative Weaver</h2>
        <p style={{color:"var(--t3)",fontSize:14,marginBottom:20,lineHeight:1.5}}>Weave the relative clauses. Mind the commas — they change everything.</p>
        <div className="crd" style={{maxWidth:340,margin:"0 auto 22px",padding:16,textAlign:"left",fontSize:13.5,color:"var(--t2)",lineHeight:1.7}}>
          <div>{"\uD83D\uDD78\uFE0F"} <strong>15 questions</strong>, no timer</div>
          <div>{"\uD83D\uDD0D"} Defining, non-defining, reduced, whose</div>
          <div>{"\uD83C\uDFC6"} <strong>3 XP</strong> per correct answer · perfect bonus</div>
        </div>
        <button className="btn1" style={{background:"linear-gradient(135deg,#0891b2,#7c3aed)",fontSize:16,padding:"14px 32px",fontWeight:800}} onClick={startSession}>{"\u2694\uFE0F Start"}</button>
      </div>
    </div>);
  }

  if(phase==="end"){
    var correctCount=results.filter(function(r){return r.ok;}).length;
    var isPerfect=correctCount===deck.length;
    var isGood=correctCount>=Math.ceil(deck.length*0.7);
    var missed=results.filter(function(r){return!r.ok;});
    return(<div className="enter" style={{padding:"20px 16px 100px",maxWidth:520,margin:"0 auto"}}>
      <div style={{textAlign:"center",padding:"20px 16px"}}>
        <div style={{fontSize:60,marginBottom:14}}>{isPerfect?"\uD83D\uDC51":isGood?"\uD83C\uDFC6":"\uD83D\uDD78\uFE0F"}</div>
        <h2 className="out" style={{fontSize:22,fontWeight:800,marginBottom:6}}>{isPerfect?"WEB MASTERED":isGood?"Weaver victorious":"Session complete"}</h2>
        <div style={{fontSize:44,fontWeight:800,color:"#7c3aed",margin:"14px 0 2px"}}>{correctCount}<span style={{color:"var(--t3)",fontSize:24,fontWeight:600}}> / {deck.length}</span></div>
        <p style={{color:"var(--t3)",fontSize:13,marginBottom:18}}>correct answers</p>
        {missed.length>0&&<div className="crd" style={{maxWidth:420,margin:"8px auto 20px",padding:14,textAlign:"left"}}>
          <div style={{fontSize:11,color:"var(--t3)",marginBottom:10,fontWeight:700,letterSpacing:1,textTransform:"uppercase"}}>{"To review"}</div>
          {missed.slice(0,8).map(function(r,i){return(
            <div key={i} style={{fontSize:12.5,marginBottom:10,color:"var(--t2)",lineHeight:1.5,paddingBottom:8,borderBottom:i<Math.min(missed.length,8)-1?"1px dashed var(--bg3)":"none"}}>
              <div style={{marginBottom:3}}>{renderWithBlank(r.q.s)}</div>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",gap:8,marginTop:4,flexWrap:"wrap"}}>
                <span style={{fontSize:11.5,color:"#86efac"}}>{"\u2192 "}<strong>{r.q.o[r.q.c]}</strong></span>
                <span style={{fontSize:10,color:"var(--t3)",padding:"2px 7px",background:"rgba(124,58,237,.12)",borderRadius:99,fontWeight:700,letterSpacing:.3}}>{typeLabel(r.q.type)}</span>
              </div>
            </div>
          );})}
        </div>}
        <button className="btn1" style={{background:"linear-gradient(135deg,#0891b2,#7c3aed)",fontSize:16,padding:"14px 32px",fontWeight:800}} onClick={finishSession}>OK, back</button>
      </div>
    </div>);
  }

  // play / reveal
  var q=deck[idx];
  var progPct=(idx+1)/deck.length*100;
  var lastResult=results[results.length-1];
  return(<div className="enter" style={{padding:"16px 16px 100px",maxWidth:520,margin:"0 auto"}}>
    <button className="back-btn" onClick={p.back}>{"\u2190"} Back</button>
    <div style={{fontSize:12,color:"var(--t3)",textAlign:"center",marginBottom:4}}>Question {idx+1} / {deck.length}</div>
    <div style={{width:"100%",height:5,background:"var(--bg3)",borderRadius:99,overflow:"hidden",marginBottom:18}}>
      <div style={{width:progPct+"%",height:"100%",background:"linear-gradient(90deg,#0891b2,#7c3aed)",transition:"width .3s ease"}}/>
    </div>
    {/* Sentence */}
    <div className="crd" style={{padding:"18px 16px",marginBottom:14,fontSize:16.5,lineHeight:1.7,color:"var(--t1)"}}>
      {renderWithBlank(q.s)}
    </div>
    {/* Options */}
    <div>
      {q.o.map(function(opt,i){
        var cls="chrono-opt";
        if(phase==="reveal"){
          if(i===q.c)cls+=" correct";
          else if(i===picked)cls+=" wrong";
          else cls+=" faded";
        }
        return(<button key={i} className={cls} disabled={phase==="reveal"} onClick={function(){pickAnswer(i);}}>
          <span style={{display:"inline-block",width:22,fontWeight:800,color:phase==="reveal"&&i===q.c?"#22c55e":phase==="reveal"&&i===picked?"#ef4444":"var(--t3)"}}>{String.fromCharCode(65+i)}.</span>{opt}
        </button>);
      })}
    </div>
    {/* Reveal card */}
    {phase==="reveal"&&<div className="crd enter" style={{padding:14,marginTop:14,borderLeft:"3px solid "+(lastResult&&lastResult.ok?"#22c55e":"#f59e0b")}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",gap:8,marginBottom:6,flexWrap:"wrap"}}>
        <span style={{fontSize:11,color:"var(--t3)",fontWeight:700,letterSpacing:.8,textTransform:"uppercase"}}>{lastResult&&lastResult.ok?"\u2713 Correct":"Explanation"}</span>
        <span style={{fontSize:10,color:"#d8b4fe",padding:"2px 8px",background:"rgba(124,58,237,.15)",border:"1px solid rgba(124,58,237,.3)",borderRadius:99,fontWeight:700,letterSpacing:.3}}>{typeLabel(q.type)}</span>
      </div>
      <div style={{fontSize:13.5,color:"var(--t2)",lineHeight:1.6,marginBottom:10}}>{q.x}</div>
      <button className="btn1" style={{width:"100%",background:"linear-gradient(135deg,#0891b2,#7c3aed)",fontSize:14,padding:"11px",fontWeight:800}} onClick={nextQ}>{idx>=deck.length-1?"See result":"Next question \u2192"}</button>
    </div>}
  </div>);
}

// ─── GAUNTLET HUB — entry point for the 4 sub-modules ───
// Internal state `subMode` decides whether to render the hub or a sub-module.
// Passes onModuleDone (from App) the modId when a sub-module completes, so the
// app-level XP/stats recording goes through the standard pipeline
// (applyXpGates, recordModule, trackModSession).
// Flat moduleScores keys used: gauntlet_irregular, gauntlet_tense,
// gauntlet_passive, gauntlet_relative.
function GauntletHub(p){
  var [openGrim,setOpenGrim]=useState(null);
  var [subMode,setSubMode]=useState(null); // null | "irregular" | "tense" | "passive" | "relative"
  var scores=(p.u&&p.u.moduleScores)||{};
  var cards=[
    {id:"irregular",name:"Irregular Crypt",icon:"tombstone",desc:"Exhume the sleeping irregular verbs. 15 items per raid, type V2 and V3 by hand.",accent:"linear-gradient(90deg,#6b7280,#9ca3af)",bgm:"bgm_crypt",grimoire:null,stats:scores["gauntlet_irregular"],ready:true},
    {id:"tense",name:"Chronomancer",icon:"clockwork",desc:"Master the storm of verb tenses. Markers, contexts, francophone traps.",accent:"linear-gradient(90deg,#7c3aed,#c026d3)",bgm:"bgm_chrono",grimoire:GRIMOIRE_CHRONOMANCER,stats:scores["gauntlet_tense"],ready:true},
    {id:"passive",name:"Passive Forge",icon:"anvil-impact",desc:"Transform active into passive. 13 tenses covered, double-object traps.",accent:"linear-gradient(90deg,#dc2626,#f59e0b)",bgm:"bgm_forge",grimoire:GRIMOIRE_PASSIVE_FORGE,stats:scores["gauntlet_passive"],ready:true},
    {id:"relative",name:"Relative Weaver",icon:"spider-web",desc:"Weave relative clauses. Defining, non-defining, reduced relatives.",accent:"linear-gradient(90deg,#0891b2,#7c3aed)",bgm:"bgm_weaver",grimoire:GRIMOIRE_RELATIVE_WEAVER,stats:scores["gauntlet_relative"],ready:true}
  ];
  function fmtAcc(s){if(!s||!s.total)return"\u2014";return Math.round((s.correct/s.total)*100)+"%";}
  function enterSub(card){
    if(!card.ready){alert("Sub-module under development. Coming in the next step!");return;}
    try{playBGM(card.bgm);}catch(e){console.warn("[gauntlet] bgm:",e&&e.message);}
    setSubMode(card.id);
  }
  function subDone(sc,tot,xp){
    try{stopBGM();}catch(e){console.warn("[gauntlet] bgm stop:",e&&e.message);}
    try{haptic("complete");}catch(e){console.warn("[gauntlet] haptic:",e&&e.message);}
    if(p.onModuleDone)p.onModuleDone(subMode,sc,tot,xp);
    setSubMode(null);
  }
  function subAbort(){
    try{stopBGM();}catch(e){console.warn("[gauntlet] bgm stop:",e&&e.message);}
    setSubMode(null);
  }
  // ── Sub-module rendering ──
  if(subMode==="irregular")return(<IrregularCrypt u={p.u} done={subDone} back={subAbort}/>);
  if(subMode==="tense")return(<Chronomancer u={p.u} done={subDone} back={subAbort}/>);
  if(subMode==="passive")return(<PassiveForge u={p.u} done={subDone} back={subAbort}/>);
  if(subMode==="relative")return(<RelativeWeaver u={p.u} done={subDone} back={subAbort}/>);

  return(<div className="gauntlet-hub enter">
    <button className="back-btn" onClick={p.back}>{"\u2190"} Back</button>
    <div className="gauntlet-header">
      <div style={{marginBottom:6,filter:"drop-shadow(0 4px 14px rgba(124,58,237,.45))",display:"flex",justifyContent:"center"}}><GIcon name="gauntlet" size={52} color="var(--cyan)"/></div>
      <h2 className="gauntlet-title">GRAMMAR GAUNTLET</h2>
      <div className="gauntlet-sub">Four trials. One crown.</div>
    </div>
    {cards.map(function(c){return(
      <div key={c.id} className="gauntlet-card">
        <div className="gauntlet-card-accent" style={{background:c.accent}}/>
        <div className="gauntlet-card-head">
          <div className="gauntlet-card-icon">{GAME_ICON_PATHS[c.icon]?<GIcon name={c.icon} size={32} color="currentColor"/>:c.icon}</div>
          <div style={{flex:1,minWidth:0}}>
            <div className="gauntlet-card-name">{c.name}{!c.ready&&<span style={{fontSize:10,marginLeft:8,padding:"2px 7px",background:"rgba(245,223,170,.12)",color:"#f5dfaa",borderRadius:99,fontWeight:700,letterSpacing:.3,verticalAlign:"middle"}}>soon</span>}</div>
          </div>
        </div>
        <div className="gauntlet-card-desc">{c.desc}</div>
        <div className="gauntlet-card-stats">
          <span>{(c.stats&&c.stats.sessions)||0} session{c.stats&&c.stats.sessions>1?"s":""}</span>
          <span>{"\u00b7"}</span>
          <span>Accuracy: {fmtAcc(c.stats)}</span>
        </div>
        <div className="gauntlet-card-actions">
          <button className="gauntlet-btn-enter" style={c.ready?{}:{opacity:.55}} onClick={function(){enterSub(c);}}><GIcon name="dungeon-gate" size={16} color="currentColor" style={{marginRight:6}}/>Entrer</button>
          {c.grimoire&&<button className="gauntlet-btn-grim" onClick={function(){setOpenGrim(c.grimoire);}}><GIcon name="bookmarklet" size={16} color="currentColor" style={{marginRight:6}}/>Grimoire</button>}
        </div>
      </div>
    );})}
    {openGrim&&<GrimoireReader grimoire={openGrim} back={function(){setOpenGrim(null);}}/>}
  </div>);
}

// ─── SMALL COMPONENTS ───
function Bar(p){var pct=p.max>0?Math.min(100,p.value/p.max*100):0;return(<div style={{width:"100%",height:p.h||8,background:"var(--bg3)",borderRadius:99,overflow:"hidden"}}><div className="bar-fill" style={{width:pct+"%",height:"100%",background:p.color||"linear-gradient(90deg,var(--cx-hex),var(--cx-dark))",borderRadius:99,transition:"width .8s cubic-bezier(.4,0,.2,1)"}}/></div>);}
// ─── Avatar renderer — handles both emoji and base64 photo ───
function renderAv(avatar,size){
  var s=size||32;
  if(avatar&&avatar.startsWith&&avatar.startsWith("data:")){
    return(<img src={avatar} style={{width:s,height:s,borderRadius:"50%",objectFit:"cover",display:"inline-block",verticalAlign:"middle",flexShrink:0}}/>);
  }
  // Check if avatar is a chest system avatar ID
  if(avatar&&AVATARS[avatar]){
    return(<AvatarMedal avatarId={avatar} size={s}/>);
  }
  return(<span style={{fontSize:s*0.6,lineHeight:1,display:"inline-flex",alignItems:"center",justifyContent:"center",width:s,height:s,flexShrink:0}}>{avatar||"⚔️"}</span>);
}

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

// ─── TUTORIAL TOUR (shown once on first Home visit for new students) ───
var TUTORIAL_STEPS=[
  {icon:"\u26A1",title:"Daily Challenge",body:"Your daily reflex: 5 questions a day, 30 seconds each. Short, fast, and it keeps your streak alive. Start here every single day.",pos:"top"},
  {icon:"\uD83C\uDFC6",title:"Progress & League",body:"Your level and class rank show up right here. Every XP brings you closer to the next level. The League tab reveals who's leading the race this week.",pos:"middle"},
  {icon:"\u2694\uFE0F",title:"Train tab",body:"All your TOEIC modules live in the Train tab below: Part 1 to 7, Mock Tests, Boss Arena, Word Tavern... Your first Mock Test is due within 7 days.",pos:"bottom"}
];
function TutorialTour(p){
  var[i,setI]=useState(0);
  var step=TUTORIAL_STEPS[i];
  var isLast=i===TUTORIAL_STEPS.length-1;
  function next(){if(isLast)p.onDone();else setI(i+1);}
  return(
    <div style={{position:"fixed",inset:0,zIndex:300,background:"rgba(0,0,0,.7)",backdropFilter:"blur(3px)",display:"flex",alignItems:"center",justifyContent:"center",padding:"20px 16px",animation:"fadeIn .3s"}}>
      <div style={{background:"var(--bg2)",border:"1.5px solid rgba(var(--cx),.3)",borderRadius:18,padding:"22px 20px",maxWidth:380,width:"100%",boxShadow:"0 20px 60px rgba(0,0,0,.5)",textAlign:"center"}}>
        <div style={{display:"flex",justifyContent:"center",gap:6,marginBottom:18}}>
          {TUTORIAL_STEPS.map(function(_,idx){return(<div key={idx} style={{width:idx===i?24:8,height:6,borderRadius:99,background:idx<=i?"var(--cx-hex)":"var(--bg3)",transition:"all .3s"}}/>);})}
        </div>
        <div style={{fontSize:48,marginBottom:10,animation:"fadeIn .4s"}} key={i}>{step.icon}</div>
        <h3 className="out" style={{fontFamily:"'Cinzel',serif",fontWeight:900,fontSize:20,color:"var(--t1)",marginBottom:10}}>{step.title}</h3>
        <p style={{fontSize:13,color:"var(--t2)",lineHeight:1.6,marginBottom:20}}>{step.body}</p>
        <button className="btn1" onClick={next} style={{width:"100%",padding:"12px 20px",fontSize:14}}>{isLast?"Let's go \u2694\uFE0F":"Got it \u2192"}</button>
        {!isLast&&<button onClick={p.onDone} style={{background:"none",border:"none",color:"var(--t3)",fontSize:11,cursor:"pointer",marginTop:10,padding:4,fontFamily:"'DM Sans',sans-serif"}}>Skip tour</button>}
      </div>
    </div>);
}

function Tabs(p){var tabs=[{id:"home",l:"Home",i:"castle"},{id:"train",l:"Train",i:"bullseye"},{id:"games",l:"Games",i:"coliseum"},{id:"league",l:"League",i:"laurel-crown"},{id:"profile",l:"Profile",i:"visored-helm"}];
var blocked=p.blocked||[];
return(<div className="tab-bar" style={{position:"fixed",bottom:0,left:"50%",transform:"translateX(-50%)",width:"100%",maxWidth:430,background:"linear-gradient(180deg,rgba(var(--bg3-rgb),0) 0%,rgba(var(--bg3-rgb),.8) 15%,var(--bg3) 100%)",borderTop:"1px solid rgba(var(--cx),.15)",padding:"8px 12px calc(12px + env(safe-area-inset-bottom, 0px))",zIndex:100,display:"flex",justifyContent:"space-around"}}>
<div className="sidebar-brand" style={{display:"none"}}><span style={{fontSize:20}}>{"⚔️"}</span><span className="out" style={{fontWeight:800,fontSize:14,background:"linear-gradient(135deg,var(--cx-hex),#8b5e83)",WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent"}}>TOEIC ARENA</span></div>
{tabs.map(function(t){var a=p.cur===t.id;var dis=blocked.indexOf(t.id)!==-1;return(<button key={t.id} onClick={function(){if(!dis)p.go(t.id);}} style={{display:"flex",flexDirection:"column",alignItems:"center",gap:3,background:"none",border:"none",cursor:dis?"not-allowed":"pointer",padding:"8px 14px",borderRadius:14,color:dis?"var(--bg3)":a?"var(--cyan)":"var(--t1)",transform:a&&!dis?"scale(1.06)":"scale(1)",opacity:dis?.35:a?1:.55,transition:"all .2s"}}>
<svg viewBox="0 0 512 512" width="26" height="26" style={{display:"block",filter:a&&!dis?"drop-shadow(0 0 6px rgba(var(--cx),.55))":"none",transition:"filter .2s"}}><g fill="currentColor" dangerouslySetInnerHTML={{__html:GAME_ICON_PATHS[t.i]||""}}/></svg><span style={{fontSize:11,fontWeight:a?700:500,letterSpacing:.5}} className="out">{t.l}</span>{a&&!dis&&<div style={{width:4,height:4,borderRadius:"50%",background:"var(--cyan)",marginTop:2}}/>}</button>);})}</div>);}

// ─── PRIVACY POLICY ───
function PrivacyPolicy(p){
  var sections=[
    {t:"1. Responsable du traitement",c:"J\u00e9r\u00e9my Leixa, formateur en anglais. Contact\u00a0: jeremy.leixa@mail-formateur.net"},
    {t:"2. Donn\u00e9es collect\u00e9es",c:"Pr\u00e9nom ou pseudonyme (pas de nom de famille obligatoire), code classe, scores et progression par module, temps d'entra\u00eenement cumul\u00e9, \u00e9tats de r\u00e9vision des flashcards, r\u00e9sultats aux tests blancs, avatar choisi, pr\u00e9f\u00e9rence de th\u00e8me (sombre/clair). Aucun e-mail, aucun mot de passe, aucune donn\u00e9e de localisation."},
    {t:"3. Base l\u00e9gale",c:"Int\u00e9r\u00eat l\u00e9gitime p\u00e9dagogique (article 6.1.f du RGPD) pour le suivi de la progression des apprenants dans le cadre d'une formation. Consentement explicite recueilli lors de la cr\u00e9ation du profil."},
    {t:"4. Finalit\u00e9s",c:"Suivi p\u00e9dagogique individuel et collectif, classements et gamification, personnalisation des exercices et recommandations, rapport hebdomadaire au responsable p\u00e9dagogique."},
    {t:"5. Destinataires",c:"Votre formateur (acc\u00e8s au tableau de bord enseignant), le responsable p\u00e9dagogique (rapports agr\u00e9g\u00e9s). Aucune donn\u00e9e n'est vendue ou transmise \u00e0 des tiers \u00e0 des fins commerciales."},
    {t:"6. Sous-traitants",c:"Supabase Inc. (h\u00e9bergement base de donn\u00e9es, authentification \u2014 serveurs UE/US), Vercel Inc. (h\u00e9bergement de l'application), Google Fonts (polices de caract\u00e8res \u2014 votre navigateur contacte les serveurs Google pour t\u00e9l\u00e9charger les polices)."},
    {t:"7. Dur\u00e9e de conservation",c:"Donn\u00e9es conserv\u00e9es pendant la dur\u00e9e de la formation, puis supprim\u00e9es \u00e0 la fin de l'ann\u00e9e scolaire ou sur demande. Les snapshots hebdomadaires sont conserv\u00e9s 12 mois maximum pour le suivi p\u00e9dagogique."},
    {t:"8. Vos droits (RGPD Art. 15-20)",c:"Acc\u00e8s\u00a0: consultez votre profil \u00e0 tout moment.\nPortabilit\u00e9\u00a0: exportez vos donn\u00e9es en JSON depuis votre profil.\nRectification\u00a0: modifiez votre avatar et pr\u00e9f\u00e9rences dans le profil.\nEffacement\u00a0: supprimez votre compte et toutes vos donn\u00e9es depuis le profil.\nPour toute demande\u00a0: jeremy.leixa@mail-formateur.net"},
    {t:"9. Stockage local",c:"L'application stocke une copie de votre profil dans le localStorage de votre navigateur pour un acc\u00e8s hors-ligne. Ces donn\u00e9es sont supprim\u00e9es lorsque vous supprimez votre compte."},
    {t:"10. Cookies",c:"TOEIC Arena n'utilise aucun cookie publicitaire ni traqueur. Seul le stockage local du navigateur (localStorage) est utilis\u00e9 pour la persistance de session."},
    {t:"11. Notifications push",c:"Optionnelles. Vous pouvez les activer ou d\u00e9sactiver \u00e0 tout moment dans votre profil. L'abonnement push est stock\u00e9 c\u00f4t\u00e9 serveur et supprim\u00e9 lors de la d\u00e9sactivation ou de la suppression du compte."},
    {t:"12. Mise \u00e0 jour",c:"Cette politique peut \u00eatre mise \u00e0 jour. La date de derni\u00e8re modification est indiqu\u00e9e ci-dessous. Derni\u00e8re mise \u00e0 jour\u00a0: 3 avril 2026."},
  ];
  return(<div style={{maxWidth:480,margin:"0 auto",padding:"24px 16px",maxHeight:"85vh",overflow:"auto"}}>
    <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:20}}>
      <h2 className="out" style={{fontWeight:800,fontSize:20,margin:0}}>{"Politique de confidentialit\u00e9"}</h2>
      {p.onClose&&<button onClick={p.onClose} style={{background:"none",border:"none",color:"var(--t3)",fontSize:22,cursor:"pointer",padding:4,lineHeight:1}}>{"\u00d7"}</button>}
    </div>
    {sections.map(function(s,i){return(<div key={i} style={{marginBottom:18}}>
      <h3 className="out" style={{fontWeight:700,fontSize:14,color:"var(--cyan)",marginBottom:6}}>{s.t}</h3>
      <p style={{fontSize:13,color:"var(--t2)",lineHeight:1.7,margin:0,whiteSpace:"pre-line"}}>{s.c}</p>
    </div>);})}
    {p.onClose&&<button className="btn2" onClick={p.onClose} style={{width:"100%",fontSize:14,marginTop:8,marginBottom:24}}>{"\u2190 Retour"}</button>}
  </div>);
}

// ─── ONBOARDING ───
function Onboard(p){
var[step,sSt]=useState("name");
  var[name,sN]=useState("");
  var[ci,sC]=useState(0);var[sel,sS]=useState(-1);var[sc,sSc]=useState(0);var[ph,sP]=useState("q");
  var[scanSec,setScanSec]=useState(0);var[scanScores,setScanScores]=useState({grammar:0,vocab:0,reading:0,listening:0});var[scanPhase,setScanPhase]=useState("intro");var[scanCorrect,setScanCorrect]=useState([]);
  var[ttsPlaying,setTtsPlaying]=useState(false);var ttsUtter=useRef(null);
  function speakQ(text){if(!window.speechSynthesis)return;window.speechSynthesis.cancel();var u=new SpeechSynthesisUtterance(text);u.lang="en-US";u.rate=0.9;var v=getEnVoice();if(v)u.voice=v;u.onstart=function(){setTtsPlaying(true);};u.onend=function(){setTtsPlaying(false);};u.onerror=function(){setTtsPlaying(false);};ttsUtter.current=u;window.speechSynthesis.speak(u);}
  function stopTts(){if(window.speechSynthesis)window.speechSynthesis.cancel();setTtsPlaying(false);}
  var[showPrivacy,setShowPrivacy]=useState(false);
  var[teacherCode,sTC]=useState("");var[teacherChecking,setTeacherChecking]=useState(false);var[teacherErr,setTeacherErr]=useState(false);
  var[bioAvail,setBioAvail]=useState(false);var[bioRegistered,setBioRegistered]=useState(!!getBioCredId());
  useEffect(function(){biometricAvailable().then(function(v){setBioAvail(v);});},[]);
  var[classCode,setClassCode]=useState("");var[classValid,setClassValid]=useState(null);var[classChecking,setClassChecking]=useState(false);var[classGroupName,setClassGroupName]=useState("");
  var[recName,setRecName]=useState("");var[recCode,setRecCode]=useState("");var[recMsg,setRecMsg]=useState(null);var[recLoading,setRecLoading]=useState(false);
  var[foundAccounts,setFoundAccounts]=useState([]);var[lookingUp,setLookingUp]=useState(false);var[visitorConfirm,setVisitorConfirm]=useState(false);
  // PIN state removed 2026-04-20 — auth is now handled via Supabase magic link
  var[pendingNav,setPendingNav]=useState(null);var[pushBusy,setPushBusy]=useState(false);
  var[emailInput,setEmailInput]=useState("");var[emailBusy,setEmailBusy]=useState(false);var[emailErr,setEmailErr]=useState("");var[emailSent,setEmailSent]=useState(false);
  // Poll for email confirmation while the user is on the emailPrompt step and email was sent.
  // Catches the mobile case where the magic link was clicked in another browser (Gmail app →
  // default browser). Without this poll, the current PWA session would never detect the confirmation.
  useEffect(function(){
    if(step!=="emailPrompt"||!emailSent)return;
    var cancel=pollEmailConfirmation(function(){
      // Email confirmed server-side — advance immediately
      sSt("langBridge");
    });
    return cancel;
  },[step,emailSent]);
  function goAfterPushStep(firstNav){
    // If browser lacks Push API, skip the opt-in phase entirely
    var hasPush=("serviceWorker" in navigator)&&("PushManager" in window);
    if(!hasPush){p.go(name.trim(),classCode||"visitor",scanScores,scanCorrect,firstNav);return;}
    setPendingNav(firstNav||null);sSt("pushPrompt");
  }

  async function lookupName(n){
    setLookingUp(true);
    try{
      // Ensure anon auth exists before querying
      var sess=await supabase.auth.getSession();
      if(!sess.data.session){
        var authRes=await supabase.auth.signInAnonymously();
        if(!authRes.data.user){setLookingUp(false);sSt("classcode");return;}
      }
      // Fetch students and filter by normalized name (accent + case insensitive).
      // Use ilike('name', n) to minimize RLS surface — broader SELECT without filter
      // has historically returned 0 rows on some RLS configs for new anon users.
      var norm=normalizeName(n);
      var res=await supabase.from('students').select('name,class_code,xp').ilike('name',n);
      console.warn("[LOOKUP]",n,"→ rows:",(res.data||[]).length,"error:",res.error?res.error.message:"none");
      var matches=(res.data||[]).filter(function(s){return normalizeName(s.name)===norm;});
      // Fallback: if the ilike query returned nothing, try a broader select
      // (may be blocked by RLS but worth a shot before giving up)
      if(matches.length===0){
        var res2=await supabase.from('students').select('name,class_code,xp');
        console.warn("[LOOKUP] fallback broader select → rows:",(res2.data||[]).length);
        matches=(res2.data||[]).filter(function(s){return normalizeName(s.name)===norm;});
      }
      console.warn("[LOOKUP] matches filtered:",matches.length);
      if(matches.length>0){
        // Use the DB name (original casing) so recovery works with the exact stored name.
        // setter is `sN` not setName (this was broken for 13 days and silently killed the
        // Welcome back path via the outer catch — origin of the "everyone re-onboards" crisis).
        sN(matches[0].name);
        // Isolated try/catch: groups query failure must NOT kill the Welcome back path.
        // If it throws or errors, we fall through with empty groupMap — cards show raw
        // class_code instead of pretty group names, but the user can still proceed.
        var groupMap={};
        try {
          var groupRes=await supabase.from('groups').select('code,name,type');
          if(groupRes.error)console.warn("[LOOKUP] groups query error:",groupRes.error.message);
          if(groupRes.data)groupRes.data.forEach(function(g){groupMap[g.code]={name:g.name,type:g.type};});
        } catch(e) {
          console.warn("[LOOKUP] groups query threw:",e&&e.message);
        }
        var accounts=matches.map(function(s){
          var g=groupMap[s.class_code];
          return{class_code:s.class_code,xp:s.xp||0,
            groupName:g?g.name:(s.class_code==="visitor"?"Visitor / Free Access":s.class_code),
            groupType:g?g.type:"visitor",
            typeIcon:g?(g.type==="school"?"🏫":g.type==="pro"?"💼":"🌍"):"🌍"};
        });
        console.warn("[LOOKUP] → recognize step, accounts:",accounts.length);
        setFoundAccounts(accounts);
        sSt("recognize");
      } else {
        console.warn("[LOOKUP] no match → classcode step");
        setFoundAccounts([]);
        sSt("classcode");
      }
    }catch(e){
      console.warn("[LOOKUP] outer catch → classcode, err:",e&&e.message);
      sSt("classcode");
    }
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

  function startTest(){sSt("scan");setScanSec(0);setScanScores({grammar:0,vocab:0,reading:0,listening:0});setScanPhase("intro");sC(0);sS(-1);setScanCorrect([]);}
  function doScanAns(i){
    sS(i);var sec=BATTLE_SCAN[scanSec];var q=sec.questions[ci];var correct=i===q.c;
    if(correct){var ns=Object.assign({},scanScores);ns[sec.id]=(ns[sec.id]||0)+1;setScanScores(ns);try{playCorrect();}catch(e){}}
    else{try{playWrong();}catch(e){}}
    setScanCorrect(function(prev){return prev.concat([correct]);});
    setScanPhase("fb");
  }
  function nxtScan(){
    stopTts();var sec=BATTLE_SCAN[scanSec];
    if(ci<sec.questions.length-1){var ni=ci+1;sC(ni);sS(-1);setScanPhase("q");if(sec.id==="listening"&&sec.questions[ni])setTimeout(function(){speakQ(sec.questions[ni].s);},400);}
    else if(scanSec<BATTLE_SCAN.length-1){setScanPhase("done");}
    else{sSt("results");}
  }
  function nxtSection(){stopTts();setScanSec(scanSec+1);sC(0);sS(-1);setScanPhase("intro");}

  // ─ Name entry ─
  if(step==="name")return(
    <div className="app onboard-shell" style={{display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",minHeight:"100vh",padding:32,textAlign:"center"}}>
      <div style={{animation:"fadeIn .8s ease-out"}}>
        <div style={{fontSize:64,marginBottom:16}}>⚔️</div>
        <h1 className="out" style={{fontWeight:900,fontSize:36,background:"linear-gradient(135deg,var(--cx-hex),#8b5e83)",WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent",marginBottom:8}}>TOEIC ARENA</h1>
        <p style={{color:"var(--t2)",fontSize:15,marginBottom:40,lineHeight:1.5}}>Train smarter. Climb the ranks.<br/>Conquer the TOEIC.</p>
        <div style={{marginBottom:20,textAlign:"left"}}>
          <label className="out" style={{fontSize:12,fontWeight:600,color:"var(--t2)",textTransform:"uppercase",letterSpacing:1,marginBottom:8,display:"block"}}>Your arena name</label>
          <input type="text" value={name} onChange={function(e){sN(e.target.value);}} placeholder="Enter your name..."
            style={{width:"100%",padding:"14px 18px",background:"var(--bg2)",border:"1px solid var(--bdr)",borderRadius:12,color:"var(--t1)",fontSize:16,fontFamily:"'DM Sans',sans-serif",outline:"none"}}/>
        </div>
        <button className="btn1" onClick={function(){if(name.trim()&&!lookingUp)lookupName(name);}} disabled={lookingUp}
          style={{opacity:name.trim()&&!lookingUp?1:.4,pointerEvents:name.trim()&&!lookingUp?"auto":"none",fontSize:18,padding:"16px 32px"}}>{lookingUp?"Checking...":"Next"}</button>
        <div style={{display:"flex",justifyContent:"center",gap:16,marginTop:20}}>
          <button onClick={function(){sSt("emailLogin");setEmailInput("");setEmailErr("");setEmailSent(false);}} style={{background:"none",border:"none",color:"var(--cyan)",fontSize:12,cursor:"pointer",fontFamily:"'DM Sans',sans-serif",textDecoration:"underline"}}>{"D\u00e9j\u00e0 un compte ? Me connecter"}</button>
          <button onClick={function(){sSt("teacher");}} style={{background:"none",border:"none",color:"var(--t3)",fontSize:12,cursor:"pointer",fontFamily:"'DM Sans',sans-serif"}}>Teacher access</button>
        </div>
      </div>
    </div>);

  // ─ Email login (cross-device) ─ Phase 1 Session 3 ─
  if(step==="emailLogin"){
    async function doLogin(){
      if(emailBusy)return;
      var e=(emailInput||"").trim().toLowerCase();
      if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e)){setEmailErr("Adresse email invalide");return;}
      setEmailErr("");setEmailBusy(true);
      try{
        await requestMagicLink(e);
        setEmailSent(true);
      }catch(err){
        setEmailErr((err&&err.message)||"Erreur");
      }finally{setEmailBusy(false);}
    }
    return(
    <div className="app onboard-shell" style={{display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",minHeight:"100vh",padding:"24px 16px",textAlign:"center"}}>
      <div style={{animation:"fadeIn .6s",width:"100%",maxWidth:380}}>
        <div style={{fontSize:56,marginBottom:16}}>{emailSent?"\u2709\uFE0F":"\uD83D\uDD11"}</div>
        <h2 className="out" style={{fontFamily:"'Cinzel',serif",fontWeight:900,fontSize:24,color:"var(--t1)",marginBottom:10}}>
          {emailSent?"V\u00e9rifie ta bo\u00eete":"Me connecter avec mon email"}
        </h2>
        {!emailSent&&<p style={{color:"var(--t2)",fontSize:14,lineHeight:1.6,marginBottom:20}}>
          {"Entre l'email que tu avais li\u00e9 \u00e0 ton compte. On t'envoie un lien magique pour te reconnecter sur ce device."}
        </p>}
        {emailSent&&<p style={{color:"var(--green)",fontSize:14,lineHeight:1.6,marginBottom:20}}>
          {"\u2709\uFE0F Lien envoy\u00e9 \u00e0 "+emailInput+".\n\nClique le lien dans ta bo\u00eete (check aussi les spams). Ta session sera restaur\u00e9e sur ce device. Tu peux fermer cet onglet ou attendre ici."}
        </p>}
        {!emailSent&&<>
          <input type="email" value={emailInput} onChange={function(ev){setEmailInput(ev.target.value);setEmailErr("");}} placeholder="ton@email.com" autoComplete="email" disabled={emailBusy}
            style={{width:"100%",padding:"12px 14px",fontSize:14,borderRadius:10,border:"1.5px solid "+(emailErr?"var(--red)":"rgba(var(--cx),.25)"),background:"var(--bg2)",color:"var(--t1)",marginBottom:emailErr?4:14,textAlign:"center",fontFamily:"'DM Sans',sans-serif"}}/>
          {emailErr&&<div style={{fontSize:11,color:"var(--red)",marginBottom:10,textAlign:"left"}}>{emailErr}</div>}
          <button className="btn1" onClick={doLogin} disabled={emailBusy||!emailInput}
            style={{fontSize:15,padding:"14px 28px",width:"100%",marginBottom:10,opacity:(emailBusy||!emailInput)?0.5:1}}>
            {emailBusy?"\u2026":"Recevoir le lien magique"}</button>
          <button className="btn2" onClick={function(){sSt("name");}} disabled={emailBusy}
            style={{fontSize:13,padding:"12px 28px",width:"100%"}}>{"\u2190 Retour"}</button>
          <p style={{color:"var(--t3)",fontSize:10,marginTop:16,lineHeight:1.5}}>{"Pas encore de compte ? Retourne en arri\u00e8re et cr\u00e9e-en un avec ton nom."}</p>
        </>}
      </div>
    </div>);
  }

  // ─ Account recognition ─
  if(step==="recognize")return(
    <div className="app onboard-shell" style={{display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",minHeight:"100vh",padding:32,textAlign:"center"}}>
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
                background:acc.groupType==="school"?"rgba(var(--cx),.1)":acc.groupType==="pro"?"rgba(200,122,53,.1)":"rgba(27,112,207,.1)",
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
    <div className="app onboard-shell" style={{display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",minHeight:"100vh",padding:32,textAlign:"center"}}>
      <div style={{animation:"fadeIn .5s"}}>
        <div style={{fontSize:48,marginBottom:16}}>🏫</div>
        <h2 className="out" style={{fontWeight:800,fontSize:24,marginBottom:8}}>Join a Group</h2>
        <p style={{color:"var(--t2)",fontSize:13,marginBottom:24,lineHeight:1.5}}>Enter the class code given by your teacher to unlock all modules, or discover TOEIC Arena for free.</p>
        <div style={{marginBottom:16,textAlign:"left"}}>
          <label className="out" style={{fontSize:12,fontWeight:600,color:"var(--t2)",textTransform:"uppercase",letterSpacing:1,marginBottom:8,display:"block"}}>Class code</label>
          <input type="text" value={classCode} onChange={function(e){var v=e.target.value.toLowerCase().replace(/\s/g,'');setClassCode(v);setClassValid(null);setClassGroupName("");}} onBlur={function(){checkGroupCode(classCode);}} placeholder="Code from your teacher"
            style={{width:"100%",padding:"14px 18px",background:"var(--bg2)",border:"1px solid "+(classValid===true?"var(--green)":classValid===false?"var(--red)":"var(--bdr)"),borderRadius:12,color:"var(--t1)",fontSize:16,fontFamily:"'DM Sans',sans-serif",outline:"none",transition:"border .2s"}}/>
          {classChecking&&<p style={{fontSize:11,color:"var(--t3)",marginTop:6}}>Checking...</p>}
          {classValid===true&&<p style={{fontSize:12,color:"var(--green)",marginTop:6,fontWeight:600}}>✓ {classGroupName}</p>}
          {classValid===false&&<p style={{fontSize:12,color:"var(--red)",marginTop:6}}>Code not found. Check with your teacher.</p>}
        </div>
        <button className="btn1" onClick={function(){if(classValid)sSt("consent");}}
          style={{opacity:classValid?1:.4,pointerEvents:classValid?"auto":"none",fontSize:16,padding:"14px 28px",marginBottom:12}}>Next</button>
        <div style={{position:"relative",margin:"16px 0",display:"flex",alignItems:"center",gap:12}}>
          <div style={{flex:1,height:1,background:"var(--bdr)"}}/>
          <span style={{fontSize:11,color:"var(--t3)",textTransform:"uppercase",letterSpacing:1}} className="out">or</span>
          <div style={{flex:1,height:1,background:"var(--bdr)"}}/>
        </div>
        {!visitorConfirm?<button className="btn2" onClick={function(){setVisitorConfirm(true);}}
          style={{width:"100%",fontSize:14,padding:"12px 24px",borderColor:"rgba(27,112,207,.3)",color:"var(--purple)"}}>{"🌍 Discover for Free"}</button>
        :<div style={{animation:"fadeIn .3s",padding:16,background:"rgba(27,112,207,.08)",border:"1px solid rgba(27,112,207,.2)",borderRadius:14}}>
          <p style={{fontSize:13,color:"var(--t1)",lineHeight:1.6,marginBottom:12}}>{"\u26A0\uFE0F Free access includes 9 training modules. Unlock everything with a class code from your teacher, or with Arena Premium (9,99\u20AC/mo or 22,99\u20AC Pass 3m)."}</p>
          <div style={{display:"flex",gap:8}}>
            <button className="btn2" onClick={function(){setVisitorConfirm(false);}} style={{flex:1,fontSize:12,padding:"10px 8px"}}>Cancel</button>
            <button className="btn2" onClick={function(){setClassCode("visitor");setClassValid(true);setClassGroupName("Visitor / Free Access");setVisitorConfirm(false);sSt("consent");}}
              style={{flex:1,fontSize:12,padding:"10px 8px",borderColor:"rgba(27,112,207,.3)",color:"var(--purple)"}}>Start Free Discovery</button>
          </div>
        </div>}
        <button onClick={function(){sSt("name");}} style={{marginTop:16,background:"none",border:"none",color:"var(--t3)",fontSize:13,cursor:"pointer"}}>← Back</button>
      </div>
    </div>);

  // ─ GDPR Consent ─
  if(step==="consent")return(
    <div className="app onboard-shell" style={{display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",minHeight:"100vh",padding:32,textAlign:"center"}}>
      {showPrivacy?<PrivacyPolicy onClose={function(){setShowPrivacy(false);}}/>:
      <div style={{animation:"fadeIn .5s",width:"100%",maxWidth:420}}>
        <div style={{fontSize:48,marginBottom:16}}>{"🛡️"}</div>
        <h2 className="out" style={{fontWeight:800,fontSize:22,marginBottom:8}}>{"Protection de vos donn\u00e9es"}</h2>
        <p style={{color:"var(--t2)",fontSize:13,marginBottom:20,lineHeight:1.6}}>{"Avant de commencer, voici comment TOEIC Arena utilise vos donn\u00e9es :"}</p>
        <div style={{textAlign:"left",padding:"16px 18px",background:"var(--bg2)",border:"1px solid var(--bdr)",borderRadius:14,marginBottom:20}}>
          <div style={{display:"flex",flexDirection:"column",gap:12}}>
            <div style={{display:"flex",gap:10,alignItems:"flex-start"}}>
              <span style={{fontSize:18,lineHeight:1.2,flexShrink:0}}>{"📊"}</span>
              <div><div className="out" style={{fontWeight:700,fontSize:13,color:"var(--t1)",marginBottom:2}}>{"Donn\u00e9es collect\u00e9es"}</div>
              <p style={{fontSize:12,color:"var(--t2)",margin:0,lineHeight:1.5}}>{"Votre pr\u00e9nom, code classe, scores, progression, temps d\u2019entra\u00eenement. Aucun e-mail, aucun mot de passe."}</p></div>
            </div>
            <div style={{display:"flex",gap:10,alignItems:"flex-start"}}>
              <span style={{fontSize:18,lineHeight:1.2,flexShrink:0}}>{"🎯"}</span>
              <div><div className="out" style={{fontWeight:700,fontSize:13,color:"var(--t1)",marginBottom:2}}>{"Finalit\u00e9"}</div>
              <p style={{fontSize:12,color:"var(--t2)",margin:0,lineHeight:1.5}}>{"Suivi p\u00e9dagogique, classements, et personnalisation de l\u2019entra\u00eenement. Donn\u00e9es accessibles \u00e0 votre formateur."}</p></div>
            </div>
            <div style={{display:"flex",gap:10,alignItems:"flex-start"}}>
              <span style={{fontSize:18,lineHeight:1.2,flexShrink:0}}>{"🔒"}</span>
              <div><div className="out" style={{fontWeight:700,fontSize:13,color:"var(--t1)",marginBottom:2}}>{"Vos droits"}</div>
              <p style={{fontSize:12,color:"var(--t2)",margin:0,lineHeight:1.5}}>{"Vous pouvez \u00e0 tout moment exporter, modifier ou supprimer vos donn\u00e9es depuis votre profil."}</p></div>
            </div>
            <div style={{display:"flex",gap:10,alignItems:"flex-start"}}>
              <span style={{fontSize:18,lineHeight:1.2,flexShrink:0}}>{"🌐"}</span>
              <div><div className="out" style={{fontWeight:700,fontSize:13,color:"var(--t1)",marginBottom:2}}>{"H\u00e9bergement"}</div>
              <p style={{fontSize:12,color:"var(--t2)",margin:0,lineHeight:1.5}}>{"Donn\u00e9es stock\u00e9es chez Supabase (UE/US) et Vercel. Aucune revente \u00e0 des tiers."}</p></div>
            </div>
          </div>
        </div>
        <button className="btn1" onClick={function(){startTest();}}
          style={{fontSize:16,padding:"14px 28px",width:"100%",marginBottom:10}}>{"J\u2019accepte \u2014 Continuer"}</button>
        <button onClick={function(){setShowPrivacy(true);}}
          style={{background:"none",border:"none",color:"var(--cyan)",fontSize:12,cursor:"pointer",fontFamily:"'DM Sans',sans-serif",textDecoration:"underline",marginBottom:10}}>{"Lire la politique de confidentialit\u00e9 compl\u00e8te"}</button>
        <br/>
        <button onClick={function(){sSt("classcode");}} style={{background:"none",border:"none",color:"var(--t3)",fontSize:13,cursor:"pointer"}}>{"\u2190 Retour"}</button>
      </div>}
    </div>);

// ─ Account recovery ─
  if(step==="recover")return(
    <div className="app onboard-shell" style={{display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",minHeight:"100vh",padding:32,textAlign:"center"}}>
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
          <input type="text" value={recCode} onChange={function(e){setRecCode(e.target.value);setRecMsg(null);}} placeholder="Class code"
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
    <div className="app onboard-shell" style={{display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",minHeight:"100vh",padding:32,textAlign:"center"}}>
      <div style={{animation:"fadeIn .5s"}}>
        <div style={{fontSize:48,marginBottom:16}}>👨‍🏫</div>
        <h2 className="out" style={{fontWeight:800,fontSize:24,marginBottom:20}}>Teacher Dashboard</h2>
        {bioAvail&&bioRegistered&&<button className="btn1" style={{marginBottom:20,display:"flex",alignItems:"center",justifyContent:"center",gap:10,width:"100%"}} onClick={async function(){
          try{var ok=await bioAuthenticate();if(ok)p.goTeacher();}catch(e){setTeacherErr(true);}
        }}>{"🔒"} Unlock with biometrics</button>}
        {bioAvail&&bioRegistered&&<div style={{fontSize:12,color:"var(--t3)",marginBottom:16}}>or enter code manually</div>}
        <div style={{marginBottom:20,textAlign:"left"}}>
          <label className="out" style={{fontSize:12,fontWeight:600,color:"var(--t2)",textTransform:"uppercase",letterSpacing:1,marginBottom:8,display:"block"}}>Access code</label>
          <input type="password" value={teacherCode} onChange={function(e){sTC(e.target.value);}} placeholder="Enter teacher code..."
            style={{width:"100%",padding:"14px 18px",background:"var(--bg2)",border:"1px solid var(--bdr)",borderRadius:12,color:"var(--t1)",fontSize:16,fontFamily:"'DM Sans',sans-serif",outline:"none"}}/>
        </div>
        <button className="btn1" onClick={function(){
          if(!teacherCode||teacherChecking)return;
          setTeacherChecking(true);setTeacherErr(false);
          supabase.from('groups').select('code').eq('teacher_code',teacherCode).limit(1)
            .then(function(res){
              setTeacherChecking(false);
              if(res.data&&res.data.length>0){
                try{localStorage.setItem('toeic-dash-group',res.data[0].code);}catch(e){}
                p.goTeacher();
              }else{setTeacherErr(true);}
            });
        }} style={{opacity:teacherCode&&!teacherChecking?1:.4,pointerEvents:teacherCode&&!teacherChecking?"auto":"none"}}>
          {teacherChecking?"V\u00e9rification...":"Access Dashboard"}
        </button>
        {teacherErr&&<p style={{color:"var(--red)",fontSize:12,marginTop:8}}>Invalid code</p>}
        <button onClick={function(){sSt("name");}} style={{marginTop:16,background:"none",border:"none",color:"var(--t3)",fontSize:13,cursor:"pointer"}}>Back to student login</button>
      </div>
    </div>);

  // (PIN steps removed 2026-04-20 — replaced by magic link auth. See auth.js.)

  // ─ Battle Report ─
  if(step==="results"){
    var cx=150,cy=150,rad=110;
    var statOrder=["grammar","vocab","reading","listening"];
    var statMeta={grammar:{icon:"\u2694\uFE0F",label:"Grammar",arena:"Blade Precision",color:"var(--cx-hex)"},vocab:{icon:"\uD83D\uDCDA",label:"Vocabulary",arena:"Arcane Lore",color:"#8b5cf6"},reading:{icon:"\uD83D\uDD0D",label:"Reading",arena:"Tactical Sight",color:"#22c55e"},listening:{icon:"\uD83D\uDC42",label:"Listening",arena:"Battle Sense",color:"#3b82f6"}};
    var dxArr=[0,1,0,-1],dyArr=[-1,0,1,0];
    function gridDiam(s){return cx+","+(cy-rad*s)+" "+(cx+rad*s)+","+cy+" "+cx+","+(cy+rad*s)+" "+(cx-rad*s)+","+cy;}
    var playerPts=statOrder.map(function(st,i){var v=Math.max(scanScores[st],0.15)/5;return(cx+dxArr[i]*rad*v)+","+(cy+dyArr[i]*rad*v);}).join(" ");
    var totalSc=scanScores.grammar+scanScores.vocab+scanScores.reading+scanScores.listening;
    var weakest=statOrder.reduce(function(a,b){return scanScores[a]<=scanScores[b]?a:b;});
    var mission=FIRST_MISSIONS.find(function(m){return m.stat===weakest;});
    var tierLabel=totalSc>=16?"Battle-Ready":totalSc>=12?"Skilled Fighter":totalSc>=8?"Apprentice":"Recruit";
    var tierIcon=totalSc>=16?"\uD83C\uDFC6":totalSc>=12?"\u2694\uFE0F":totalSc>=8?"\uD83D\uDEE1\uFE0F":"\uD83D\uDCDA";
    // Map Battle Scan score (0-20) to estimated TOEIC score (200-990, rounded to 5)
    var toeicEst=Math.round((200+(totalSc/20)*790)/5)*5;
    var toeicColor=toeicEst>=750?"var(--green)":toeicEst>=500?"var(--gold)":"var(--orange)";
    return(
    <div className="app onboard-shell" style={{display:"flex",flexDirection:"column",alignItems:"center",minHeight:"100vh",padding:"24px 16px",textAlign:"center",overflow:"auto"}}>
      <div style={{animation:"fadeIn .6s",width:"100%",maxWidth:380}}>
        <div style={{fontSize:10,fontWeight:700,color:"var(--t3)",textTransform:"uppercase",letterSpacing:3,marginBottom:8}} className="out">Battle Report</div>
        <h2 className="out" style={{fontFamily:"'Cinzel',serif",fontWeight:900,fontSize:26,background:"linear-gradient(135deg,var(--cx-hex),#8b5e83)",WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent",marginBottom:4}}>Warrior Assessment</h2>
        <div style={{display:"inline-flex",alignItems:"center",gap:6,padding:"5px 14px",borderRadius:99,background:"rgba(var(--cx),.1)",border:"1px solid rgba(var(--cx),.2)",marginBottom:20}}>
          <span style={{fontSize:16}}>{tierIcon}</span>
          <span className="out" style={{fontWeight:700,fontSize:14,color:"var(--cyan)"}}>{tierLabel}</span>
          <span style={{fontSize:12,color:"var(--t3)"}}>{totalSc}/20</span>
        </div>

        {/* ── TOEIC ESTIMATE ── */}
        <div className="crd" style={{padding:"14px 16px",marginBottom:20,background:"linear-gradient(135deg,rgba(var(--cx),.08),rgba(240,200,80,.06))",border:"1px solid rgba(240,200,80,.2)"}}>
          <div className="out" style={{fontSize:10,fontWeight:700,color:"var(--t3)",textTransform:"uppercase",letterSpacing:1.5,marginBottom:6}}>{"\uD83C\uDFAF"} Estimated TOEIC</div>
          <div className="out" style={{fontFamily:"'Cinzel',serif",fontSize:32,fontWeight:900,color:toeicColor,lineHeight:1}}>{toeicEst}<span style={{fontSize:14,color:"var(--t3)",fontWeight:400,marginLeft:6}}>{"/ 990"}</span></div>
          <p style={{fontSize:11,color:"var(--t2)",lineHeight:1.5,margin:"8px 0 0",textAlign:"left"}}>Real TOEIC is 50% <b style={{color:"#3b82f6"}}>Listening</b> + 50% <b style={{color:"#22c55e"}}>Reading</b>. Train both to make progress.</p>
        </div>

        {/* ── RADAR SVG ── */}
        <div style={{position:"relative",width:280,height:280,margin:"0 auto 8px"}}>
          <svg viewBox="0 0 300 300" width="280" height="280" style={{display:"block"}}>
            <defs>
              <radialGradient id="radarGlow" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="var(--cx-hex)" stopOpacity="0.08"/>
                <stop offset="100%" stopColor="var(--cx-hex)" stopOpacity="0"/>
              </radialGradient>
            </defs>
            <circle cx={cx} cy={cy} r={rad+10} fill="url(#radarGlow)"/>
            {[0.2,0.4,0.6,0.8,1.0].map(function(s,i){return(<polygon key={i} points={gridDiam(s)} fill="none" stroke={"rgba(180,140,80,"+(s===1?0.25:0.1)+")"} strokeWidth={s===1?"1.5":"0.7"}/>);})}
            {statOrder.map(function(st,i){return(<line key={st} x1={cx} y1={cy} x2={cx+dxArr[i]*rad} y2={cy+dyArr[i]*rad} stroke="rgba(180,140,80,0.15)" strokeWidth="1"/>);})}
            <polygon points={playerPts} fill="rgba(var(--cx),0.18)" stroke="var(--cx-hex)" strokeWidth="2.5" strokeLinejoin="round" style={{filter:"drop-shadow(0 0 10px rgba(var(--cx),0.3))",animation:"fadeIn .8s"}}/>
            {statOrder.map(function(st,i){var v=Math.max(scanScores[st],0.15)/5;return(<circle key={st} cx={cx+dxArr[i]*rad*v} cy={cy+dyArr[i]*rad*v} r="5" fill={statMeta[st].color} stroke="var(--bg)" strokeWidth="2" style={{animation:"fadeIn 1s"}}/>);})}
          </svg>
          {/* Axis labels positioned around the radar */}
          <div style={{position:"absolute",top:0,left:"50%",transform:"translateX(-50%) translateY(-4px)",textAlign:"center"}}>
            <div style={{fontSize:16}}>{statMeta.grammar.icon}</div>
            <div className="out" style={{fontSize:10,fontWeight:700,color:statMeta.grammar.color}}>{scanScores.grammar}/5</div>
          </div>
          <div style={{position:"absolute",top:"50%",right:0,transform:"translateY(-50%) translateX(4px)",textAlign:"center"}}>
            <div style={{fontSize:16}}>{statMeta.vocab.icon}</div>
            <div className="out" style={{fontSize:10,fontWeight:700,color:statMeta.vocab.color}}>{scanScores.vocab}/5</div>
          </div>
          <div style={{position:"absolute",bottom:0,left:"50%",transform:"translateX(-50%) translateY(4px)",textAlign:"center"}}>
            <div style={{fontSize:16}}>{statMeta.reading.icon}</div>
            <div className="out" style={{fontSize:10,fontWeight:700,color:statMeta.reading.color}}>{scanScores.reading}/5</div>
          </div>
          <div style={{position:"absolute",top:"50%",left:0,transform:"translateY(-50%) translateX(-4px)",textAlign:"center"}}>
            <div style={{fontSize:16}}>{statMeta.listening.icon}</div>
            <div className="out" style={{fontSize:10,fontWeight:700,color:statMeta.listening.color}}>{scanScores.listening}/5</div>
          </div>
        </div>

        {/* ── STAT BARS ── */}
        <div style={{display:"flex",flexDirection:"column",gap:8,marginBottom:24,textAlign:"left"}}>
          {statOrder.map(function(st){var m=statMeta[st];var pct=scanScores[st]/5*100;return(
            <div key={st} style={{display:"flex",alignItems:"center",gap:10}}>
              <span style={{fontSize:18,width:28,textAlign:"center"}}>{m.icon}</span>
              <div style={{flex:1}}>
                <div style={{display:"flex",justifyContent:"space-between",marginBottom:3}}>
                  <span className="out" style={{fontSize:11,fontWeight:700,color:"var(--t1)"}}>{m.arena}</span>
                  <span className="out" style={{fontSize:11,fontWeight:700,color:m.color}}>{scanScores[st]}/5</span>
                </div>
                <div style={{height:6,background:"var(--bg3)",borderRadius:99,overflow:"hidden"}}>
                  <div style={{width:pct+"%",height:"100%",background:m.color,borderRadius:99,transition:"width 1s cubic-bezier(.4,0,.2,1)"}}/>
                </div>
              </div>
            </div>);
          })}
        </div>

        {/* ── FIRST MISSION ── */}
        {mission&&<div className="crd" onClick={function(){stopTts();playArenaCall();var navTarget=mission.modules&&mission.modules[0]||"drill";goAfterPushStep(navTarget);}}
          style={{background:"rgba(var(--cx),.06)",borderColor:"rgba(var(--cx),.15)",padding:16,marginBottom:24,textAlign:"left",cursor:"pointer",transition:"all .2s"}}>
          <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:8}}>
            <span style={{fontSize:20}}>📜</span>
            <span className="out" style={{fontFamily:"'Cinzel',serif",fontWeight:800,fontSize:14,color:"var(--cyan)"}}>First Quest</span>
          </div>
          <div style={{display:"flex",alignItems:"center",gap:10}}>
            <span style={{fontSize:28}}>{mission.icon}</span>
            <div>
              <div className="out" style={{fontWeight:700,fontSize:14,color:"var(--t1)",marginBottom:2}}>{mission.label}</div>
              <p style={{fontSize:12,color:"var(--t2)",lineHeight:1.5,margin:0}}>{mission.msg}</p>
            </div>
          </div>
        </div>}

        {mission&&<button className="btn1" onClick={function(){stopTts();playArenaCall();var navTarget=mission.modules&&mission.modules[0]||"drill";goAfterPushStep(navTarget);}}
          style={{fontSize:16,padding:"14px 32px",width:"100%",marginBottom:10,background:"linear-gradient(135deg,var(--cx-hex),#8b5e83)"}}>
          Start Your Quest — {mission.label}</button>}
        <button className="btn2" onClick={function(){stopTts();playArenaCall();goAfterPushStep(null);}}
          style={{fontSize:14,padding:"12px 28px",width:"100%"}}>Enter the Arena</button>
        <p style={{color:"var(--t3)",fontSize:11,marginTop:12,lineHeight:1.5}}>Your stats will evolve as you train. This is just the beginning.</p>
      </div>
    </div>);}

  // ─ Push notification opt-in ─
  if(step==="pushPrompt"){
    function finishOnb(){sSt("emailPrompt");}
    async function enableAndGo(){
      if(pushBusy)return;
      setPushBusy(true);
      try{await subscribePush(name.trim(),classCode||"visitor");}catch(e){console.warn("[push] subscribe failed:",e);}
      setPushBusy(false);
      finishOnb();
    }
    return(
    <div className="app onboard-shell" style={{display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",minHeight:"100vh",padding:"24px 16px",textAlign:"center"}}>
      <div style={{animation:"fadeIn .6s",width:"100%",maxWidth:380}}>
        <div style={{fontSize:64,marginBottom:16}}>{"\uD83D\uDD14"}</div>
        <h2 className="out" style={{fontFamily:"'Cinzel',serif",fontWeight:900,fontSize:24,color:"var(--t1)",marginBottom:10}}>Stay connected to your quest</h2>
        <p style={{color:"var(--t2)",fontSize:14,lineHeight:1.6,marginBottom:24}}>
          {"Active les rappels pour ne pas perdre ta série, rester informé de tes progrès hebdomadaires, et recevoir des encouragements de ton prof."}
        </p>
        <div className="crd" style={{padding:"14px 16px",marginBottom:20,textAlign:"left",background:"rgba(var(--cx),.06)",borderColor:"rgba(var(--cx),.15)"}}>
          <div style={{display:"flex",gap:10,marginBottom:8}}>
            <span style={{fontSize:20}}>{"\uD83D\uDD25"}</span>
            <div><div className="out" style={{fontSize:12,fontWeight:700,color:"var(--t1)"}}>Streak reminder</div><div style={{fontSize:11,color:"var(--t2)"}}>20h tous les soirs, si tu n'as rien fait</div></div>
          </div>
          <div style={{display:"flex",gap:10,marginBottom:8}}>
            <span style={{fontSize:20}}>{"\uD83D\uDCCA"}</span>
            <div><div className="out" style={{fontSize:12,fontWeight:700,color:"var(--t1)"}}>Weekly results</div><div style={{fontSize:11,color:"var(--t2)"}}>Lundi matin, ton classement</div></div>
          </div>
          <div style={{display:"flex",gap:10}}>
            <span style={{fontSize:20}}>{"\u2694\uFE0F"}</span>
            <div><div className="out" style={{fontSize:12,fontWeight:700,color:"var(--t1)"}}>Re-engagement</div><div style={{fontSize:11,color:"var(--t2)"}}>{"Rappels doux après quelques jours d'absence"}</div></div>
          </div>
        </div>
        {!isStandalonePWA()&&(
          <div className="crd" style={{padding:"12px 14px",marginBottom:16,background:"rgba(240,200,80,.06)",borderColor:"rgba(240,200,80,.2)",textAlign:"left"}}>
            <div style={{display:"flex",gap:10,alignItems:"flex-start"}}>
              <span style={{fontSize:20,flexShrink:0}}>{"\uD83D\uDCF2"}</span>
              <div>
                <div className="out" style={{fontSize:12,fontWeight:700,color:"var(--gold)",marginBottom:4}}>{"Installe l'app sur ton écran d'accueil"}</div>
                <div style={{fontSize:11,color:"var(--t2)",lineHeight:1.5}}>
                  {isIOSDevice()
                    ? "Sur iPhone, les notifications ne marchent que si l'app est installée. Dans Safari : touche le bouton Partager (\u2B06\uFE0F en bas) puis « Sur l\u2019écran d\u2019accueil »."
                    : "Pour recevoir les rappels même sans le navigateur ouvert : menu du navigateur puis « Installer l\u2019app » ou « Ajouter à l\u2019écran d\u2019accueil »."}
                </div>
              </div>
            </div>
          </div>
        )}
        <button className="btn1" onClick={enableAndGo} disabled={pushBusy}
          style={{fontSize:15,padding:"14px 28px",width:"100%",marginBottom:10,opacity:pushBusy?0.6:1}}>
          {pushBusy?"\u2026":"Activer les rappels"}</button>
        <button className="btn2" onClick={finishOnb} disabled={pushBusy}
          style={{fontSize:13,padding:"12px 28px",width:"100%"}}>Plus tard</button>
        <p style={{color:"var(--t3)",fontSize:10,marginTop:12,lineHeight:1.5}}>{"Tu peux changer d'avis à tout moment depuis ton Profil."}</p>
      </div>
    </div>);}

  // ─ Email security (Phase 1 Session 2): optional step to link an email ─
  if(step==="emailPrompt"){
    function skipEmail(){sSt("langBridge");}
    async function submitEmail(){
      if(emailBusy)return;
      var e=(emailInput||"").trim().toLowerCase();
      if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e)){setEmailErr("Adresse email invalide");return;}
      setEmailErr("");setEmailBusy(true);
      try{
        await linkEmailToAnonymous(e);
        setEmailSent(true);
        // No auto-advance: the user needs time to check the email and we poll for
        // confirmation (see useEffect above). An explicit "Continuer" button is shown.
      }catch(err){
        var msg=(err&&err.message)||"Impossible d'envoyer l'email";
        setEmailErr(msg);
      }finally{setEmailBusy(false);}
    }
    return(
    <div className="app onboard-shell" style={{display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",minHeight:"100vh",padding:"24px 16px",textAlign:"center"}}>
      <div style={{animation:"fadeIn .6s",width:"100%",maxWidth:380}}>
        <div style={{fontSize:56,marginBottom:16}}>{emailSent?"\u2709\uFE0F":"\uD83D\uDD12"}</div>
        <h2 className="out" style={{fontFamily:"'Cinzel',serif",fontWeight:900,fontSize:24,color:"var(--t1)",marginBottom:10}}>
          {emailSent?"V\u00e9rifie ta bo\u00eete":"S\u00e9curise ton compte"}
        </h2>
        {!emailSent&&<p style={{color:"var(--t2)",fontSize:14,lineHeight:1.6,marginBottom:20}}>
          {"Lie un email pour retrouver ta progression depuis n'importe quel appareil et recevoir tes r\u00e9sultats hebdomadaires."}
        </p>}
        {emailSent&&<>
          <p style={{color:"var(--green)",fontSize:14,lineHeight:1.6,marginBottom:12}}>
            {"\u2709\uFE0F Lien de confirmation envoy\u00e9 \u00e0 "+emailInput+"."}
          </p>
          <div className="crd" style={{padding:"12px 14px",marginBottom:14,background:"rgba(255,193,7,.06)",borderColor:"rgba(255,193,7,.2)",textAlign:"left"}}>
            <div style={{fontSize:12,color:"var(--t1)",lineHeight:1.5}}>
              <strong>{"\uD83D\uDCF1 Sur mobile :"}</strong>{" ouvre le lien dans le navigateur o\u00f9 tu utilises l'app (m\u00eame navigateur, m\u00eame appareil). Si tu cliques depuis Gmail, le lien peut s'ouvrir ailleurs et la confirmation ne remonte pas ici."}
            </div>
          </div>
          <p style={{color:"var(--t3)",fontSize:11,lineHeight:1.5,marginBottom:14}}>
            {"Cette page d\u00e9tectera automatiquement la confirmation. Tu peux aussi continuer sans attendre \u2014 tu pourras terminer plus tard."}
          </p>
          <button className="btn1" onClick={function(){sSt("langBridge");}}
            style={{fontSize:15,padding:"14px 28px",width:"100%",marginBottom:10}}>{"Continuer"}</button>
        </>}
        {!emailSent&&<div className="crd" style={{padding:"14px 16px",marginBottom:14,textAlign:"left",background:"rgba(var(--cx),.06)",borderColor:"rgba(var(--cx),.15)"}}>
          <div style={{display:"flex",gap:10,marginBottom:8}}>
            <span style={{fontSize:18}}>{"\uD83D\uDD04"}</span>
            <div><div className="out" style={{fontSize:12,fontWeight:700,color:"var(--t1)"}}>Sync multi-appareils</div><div style={{fontSize:11,color:"var(--t2)"}}>{"Retrouve ta progression sur ton t\u00e9l\u00e9phone et ton PC"}</div></div>
          </div>
          <div style={{display:"flex",gap:10,marginBottom:8}}>
            <span style={{fontSize:18}}>{"\uD83D\uDCCA"}</span>
            <div><div className="out" style={{fontSize:12,fontWeight:700,color:"var(--t1)"}}>{"R\u00e9sultats hebdo"}</div><div style={{fontSize:11,color:"var(--t2)"}}>{"Ton classement chaque lundi matin par email"}</div></div>
          </div>
          <div style={{display:"flex",gap:10}}>
            <span style={{fontSize:18}}>{"\uD83D\uDD10"}</span>
            <div><div className="out" style={{fontSize:12,fontWeight:700,color:"var(--t1)"}}>Ton compte t'appartient</div><div style={{fontSize:11,color:"var(--t2)"}}>{"N\u00e9cessaire pour souscrire Premium plus tard"}</div></div>
          </div>
        </div>}
        {!emailSent&&<>
          <input type="email" value={emailInput} onChange={function(ev){setEmailInput(ev.target.value);setEmailErr("");}} placeholder="ton@email.com" autoComplete="email" disabled={emailBusy}
            style={{width:"100%",padding:"12px 14px",fontSize:14,borderRadius:10,border:"1.5px solid "+(emailErr?"var(--red)":"rgba(var(--cx),.25)"),background:"var(--bg2)",color:"var(--t1)",marginBottom:emailErr?4:14,textAlign:"center",fontFamily:"'DM Sans',sans-serif"}}/>
          {emailErr&&<div style={{fontSize:11,color:"var(--red)",marginBottom:10,textAlign:"left"}}>{emailErr}</div>}
          <button className="btn1" onClick={submitEmail} disabled={emailBusy||!emailInput}
            style={{fontSize:15,padding:"14px 28px",width:"100%",marginBottom:10,opacity:(emailBusy||!emailInput)?0.5:1}}>
            {emailBusy?"\u2026":"Recevoir le lien magique"}</button>
          <button className="btn2" onClick={skipEmail} disabled={emailBusy}
            style={{fontSize:13,padding:"12px 28px",width:"100%"}}>Plus tard</button>
          <p style={{color:"var(--t3)",fontSize:10,marginTop:12,lineHeight:1.5}}>{"Tu pourras l'ajouter quand tu veux depuis ton Profil."}</p>
        </>}
      </div>
    </div>);
  }

  // ─ Language bridge: transition to English ─
  if(step==="langBridge"){
    function enterArena(){p.go(name.trim(),classCode||"visitor",scanScores,scanCorrect,pendingNav||undefined);}
    return(
    <div className="app onboard-shell" style={{display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",minHeight:"100vh",padding:"24px 16px",textAlign:"center"}}>
      <div style={{animation:"fadeIn .6s",width:"100%",maxWidth:380}}>
        <div style={{fontSize:64,marginBottom:18}}>{"\u2694\uFE0F"}</div>
        <h2 className="out" style={{fontFamily:"'Cinzel',serif",fontWeight:900,fontSize:26,background:"linear-gradient(135deg,var(--cx-hex),#8b5e83)",WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent",marginBottom:12}}>Welcome, Warrior</h2>
        <p style={{color:"var(--t1)",fontSize:15,lineHeight:1.6,marginBottom:16,fontWeight:600}}>From here, your adventure continues in English.</p>
        <p style={{color:"var(--t2)",fontSize:13,lineHeight:1.6,marginBottom:28}}>Every screen, every question, every feedback — English only. This is immersion. Trust the process.</p>
        <div className="crd" style={{padding:"12px 16px",marginBottom:24,background:"rgba(var(--cx),.06)",borderColor:"rgba(var(--cx),.15)"}}>
          <p style={{fontSize:12,color:"var(--t2)",lineHeight:1.5,margin:0,fontStyle:"italic"}}>{"\u201C"}The best way to learn a language is to live in it.{"\u201D"}</p>
        </div>
        <button className="btn1" onClick={enterArena}
          style={{fontSize:16,padding:"14px 32px",width:"100%",background:"linear-gradient(135deg,var(--cx-hex),#8b5e83)"}}>
          Enter the Arena {"\u2192"}</button>
      </div>
    </div>);}

  // ─ Battle Scan ─
  var sec=BATTLE_SCAN[scanSec]||BATTLE_SCAN[0];
  var scanQs=sec.questions;
  var scanQ=scanQs[ci]||scanQs[0];

  // Section Intro
  if(scanPhase==="intro")return(
    <div className="app onboard-shell" style={{display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",minHeight:"100vh",padding:32,textAlign:"center"}}>
      <div style={{animation:"fadeIn .5s",width:"100%",maxWidth:360}}>
        <div style={{display:"flex",gap:6,justifyContent:"center",marginBottom:24}}>
          {BATTLE_SCAN.map(function(s,i){return(
            <div key={i} style={{display:"flex",alignItems:"center",gap:4}}>
              <div style={{width:i===scanSec?32:10,height:10,borderRadius:5,background:i<scanSec?s.color:i===scanSec?s.color:"var(--bg3)",opacity:i<=scanSec?1:.4,transition:"all .4s"}}/>
            </div>);})}
        </div>
        <div className="out" style={{fontSize:11,fontWeight:700,color:"var(--t3)",textTransform:"uppercase",letterSpacing:2,marginBottom:16}}>Section {scanSec+1} of 4</div>
        <div style={{fontSize:72,marginBottom:12,animation:"countUp .6s"}}>{sec.icon}</div>
        <h2 className="out" style={{fontFamily:"'Cinzel',serif",fontWeight:900,fontSize:28,color:sec.color,marginBottom:4}}>{sec.name}</h2>
        <p className="out" style={{color:"var(--t2)",fontSize:14,fontWeight:500,marginBottom:8}}>{sec.subtitle}</p>
        <p style={{color:"var(--t3)",fontSize:13,lineHeight:1.6,marginBottom:8,maxWidth:300,margin:"0 auto 24px"}}>{sec.desc}</p>
        {sec.note&&<p style={{color:"var(--t3)",fontSize:11,fontStyle:"italic",marginBottom:16,lineHeight:1.5}}>{sec.note}</p>}
        <div style={{display:"flex",alignItems:"center",justifyContent:"center",gap:6,marginBottom:24}}>
          <span style={{fontSize:13,color:"var(--t2)"}}>5 questions</span>
          <span style={{color:"var(--t3)"}}>·</span>
          <span style={{fontSize:13,color:"var(--t2)"}}>{"\u223C"}2 min</span>
        </div>
        <button className="btn1" onClick={function(){setScanPhase("q");sC(0);sS(-1);var s=BATTLE_SCAN[scanSec];if(s.id==="listening"&&s.questions[0])setTimeout(function(){speakQ(s.questions[0].s);},400);}} style={{fontSize:16,padding:"14px 32px"}}>Begin</button>
      </div>
    </div>);

  // Section Done
  if(scanPhase==="done")return(
    <div className="app onboard-shell" style={{display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",minHeight:"100vh",padding:32,textAlign:"center"}}>
      <div style={{animation:"fadeIn .5s",width:"100%",maxWidth:360}}>
        <div style={{fontSize:56,marginBottom:12,animation:"countUp .5s"}}>{sec.icon}</div>
        <h3 className="out" style={{fontFamily:"'Cinzel',serif",fontWeight:800,fontSize:22,color:sec.color,marginBottom:4}}>{sec.name}</h3>
        <p style={{color:"var(--t2)",fontSize:13,marginBottom:16}}>{sec.subtitle} — Complete</p>
        <div style={{display:"inline-block",padding:"12px 28px",borderRadius:16,background:"rgba(var(--cx),.08)",border:"1px solid rgba(var(--cx),.15)",marginBottom:24}}>
          <div className="out" style={{fontSize:42,fontWeight:900,color:sec.color,animation:"countUp .6s"}}>{scanScores[sec.id]}<span style={{fontSize:20,color:"var(--t3)"}}>/5</span></div>
        </div>
        <div style={{display:"flex",gap:4,justifyContent:"center",marginBottom:32}}>
          {[0,1,2,3,4].map(function(i){return(
            <div key={i} style={{width:36,height:8,borderRadius:4,background:i<scanScores[sec.id]?sec.color:"var(--bg3)",transition:"background .3s "+(i*0.1)+"s"}}/>);})}
        </div>
        {scanSec<BATTLE_SCAN.length-1?
          <button className="btn1" onClick={nxtSection} style={{fontSize:16,padding:"14px 32px"}}>Next Section</button>
          :<button className="btn1" onClick={function(){sSt("results");}} style={{fontSize:16,padding:"14px 32px",background:"linear-gradient(135deg,var(--cx-hex),#8b5e83)"}}>See Your Battle Report</button>}
      </div>
    </div>);

  // Questions
  var isReading=sec.id==="reading"&&sec.passage;
  return(
    <div className="app onboard-shell" style={{padding:"20px 16px",minHeight:"100vh"}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16}}>
        <div>
          <div style={{display:"flex",alignItems:"center",gap:6}}>
            <span style={{fontSize:18}}>{sec.icon}</span>
            <p className="out" style={{fontWeight:700,fontSize:14,color:sec.color}}>{sec.name}</p>
          </div>
          <p style={{fontSize:11,color:"var(--t3)"}}>Question {ci+1} of {scanQs.length}</p>
        </div>
        <div style={{display:"flex",alignItems:"center",gap:3}}>
          {scanQs.map(function(q,i){
            var col=i<ci?sec.color:i===ci?"var(--cyan)":"var(--t3)";
            return(<div key={i} style={{width:i===ci?16:8,height:5,borderRadius:3,background:col,transition:"all .3s"}}/>);})}
        </div>
      </div>
      <Bar value={ci+1} max={scanQs.length} h={4} color={sec.color}/>

      {/* Reading passage */}
      {isReading&&ci===0&&<div className="crd" style={{marginTop:16,padding:14,maxHeight:200,overflowY:"auto",fontSize:13,lineHeight:1.7,color:"var(--t2)",borderColor:"rgba(34,197,94,.15)",background:"rgba(34,197,94,.04)"}}>
        <div className="out" style={{fontWeight:700,fontSize:12,color:sec.color,marginBottom:8,textTransform:"uppercase",letterSpacing:1}}>{sec.passage.title}</div>
        {sec.passage.text.split("\n").map(function(line,li){return(<p key={li} style={{margin:li===0?"0":"6px 0 0",fontWeight:line.match(/^(TO|FROM|DATE|RE):/)?600:400,color:line.match(/^(TO|FROM|DATE|RE):/)?sec.color:"var(--t2)"}}>{line}</p>);})}
      </div>}
      {isReading&&ci>0&&<details style={{marginTop:12,marginBottom:4}}>
        <summary style={{fontSize:12,color:"var(--t3)",cursor:"pointer",marginBottom:4}}>Show passage</summary>
        <div className="crd" style={{padding:12,maxHeight:160,overflowY:"auto",fontSize:12,lineHeight:1.6,color:"var(--t2)",borderColor:"rgba(34,197,94,.15)",background:"rgba(34,197,94,.04)"}}>
          {sec.passage.text.split("\n").map(function(line,li){return(<p key={li} style={{margin:li===0?"0":"4px 0 0"}}>{line}</p>);})}
        </div>
      </details>}

      {/* Prompt for listening */}
      {scanQ.prompt&&<p style={{fontSize:12,color:"var(--t3)",fontStyle:"italic",marginTop:12,marginBottom:4}}>{scanQ.prompt}</p>}

      {sec.id==="listening"&&<div style={{display:"flex",alignItems:"center",gap:8,marginTop:12,marginBottom:8}}>
        <button onClick={function(){speakQ(scanQ.s);}} disabled={ttsPlaying}
          style={{display:"flex",alignItems:"center",gap:6,padding:"8px 16px",background:ttsPlaying?"rgba(59,130,246,.15)":"var(--bg2)",border:"1px solid "+(ttsPlaying?"rgba(59,130,246,.3)":"var(--bdr)"),borderRadius:10,cursor:ttsPlaying?"default":"pointer",fontSize:13,fontWeight:600,color:ttsPlaying?"#3b82f6":"var(--t2)",fontFamily:"'DM Sans',sans-serif",transition:"all .3s"}}>
          <span style={{fontSize:18}}>{ttsPlaying?"\uD83D\uDD0A":"\uD83D\uDD09"}</span>{ttsPlaying?"Playing...":"Listen again"}
        </button>
      </div>}

      {sec.id==="listening"&&scanPhase==="q"?(
        <div style={{textAlign:"center",padding:"24px 0",marginTop:12,marginBottom:20}}>
          <div style={{fontSize:48,marginBottom:12,animation:ttsPlaying?"pulse 1.5s infinite":"none"}}>{ttsPlaying?"\uD83D\uDD0A":"\uD83D\uDD09"}</div>
          <p className="out" style={{fontSize:14,fontWeight:600,color:ttsPlaying?"#3b82f6":"var(--t3)",transition:"color .3s"}}>{ttsPlaying?"Listen carefully...":"Press play to listen"}</p>
        </div>
      ):sec.id==="listening"&&scanPhase==="fb"?(
        <div style={{marginTop:12,marginBottom:20}}>
          <p style={{fontSize:11,color:"var(--t3)",textTransform:"uppercase",letterSpacing:1,marginBottom:4}}>You heard:</p>
          <h2 className="out" style={{fontWeight:700,fontSize:18,lineHeight:1.5,color:"var(--t2)"}}>{scanQ.s}</h2>
        </div>
      ):(
        <h2 className="out" style={{fontWeight:700,fontSize:18,lineHeight:1.5,marginBottom:20,marginTop:isReading?12:16}}>{scanQ.s}</h2>
      )}

      <div style={{display:"flex",flexDirection:"column",gap:8}}>
        {scanQ.o.map(function(opt,i){
          var isCor=i===scanQ.c;var isPick=sel===i;var show=scanPhase==="fb";
          var bg="var(--bg2)";var bd="var(--bdr)";
          if(show&&isCor){bg="rgba(0,230,118,.12)";bd="var(--green)";}
          else if(show&&isPick&&!isCor){bg="rgba(255,71,87,.12)";bd="var(--red)";}
          return(<button key={i} onClick={function(){if(scanPhase==="q")doScanAns(i);}} disabled={show}
            style={{display:"flex",alignItems:"center",gap:12,padding:"14px 16px",background:bg,border:"1px solid "+bd,borderRadius:12,cursor:scanPhase==="q"?"pointer":"default",fontSize:15,color:"var(--t1)",textAlign:"left",fontFamily:"'DM Sans',sans-serif",transition:"all .2s"}}>
            <div style={{width:28,height:28,borderRadius:"50%",border:"2px solid "+(show&&isCor?"var(--green)":show&&isPick?"var(--red)":"var(--t3)"),display:"flex",alignItems:"center",justifyContent:"center",fontSize:12,fontWeight:700,flexShrink:0,background:show&&isCor?"var(--green)":show&&isPick&&!isCor?"var(--red)":"transparent",color:show&&(isCor||isPick)?"#fff":"var(--t3)"}}>
              {show&&isCor?"\u2713":show&&isPick?"\u2717":String.fromCharCode(65+i)}</div>
            <span>{opt}</span></button>);})}
      </div>

      {scanPhase==="fb"&&<div style={{marginTop:16,animation:"fadeIn .3s"}}>
        <div className="crd" style={{background:"rgba(var(--cx),.06)",borderColor:"rgba(var(--cx),.15)",padding:14}}>
          <p style={{fontSize:13,color:"var(--t2)",lineHeight:1.6}}>{scanQ.x}</p></div>
        <button className="btn1" onClick={nxtScan} style={{marginTop:14}}>{ci<scanQs.length-1?"Next":(scanSec<BATTLE_SCAN.length-1?"Section Complete":"See Your Battle Report")}</button>
      </div>}
    </div>);
}
// ─── HOME ───
function Home(p){
var u=p.u,lv=getLevel(u.xp),lg=getEffectiveLeague(u.weeklyXp,u.moduleScores),dd=u.daily&&u.daily.date===today()&&u.daily.done;
// ── Secure email banner dismissal state (Phase 1 Session 2) ──
// Visible if u has no email and is not a visitor. Dismissible for 7 days via localStorage.
var[secureBannerHidden,setSecureBannerHidden]=useState(function(){
  try{
    var dismissedAt=parseInt(localStorage.getItem("secureEmailDismissedAt")||"0",10);
    return Date.now()-dismissedAt<7*86400000;
  }catch(e){return false;}
});
// ── Single-pulse priority (UX focus): chest > mock > daily > event ──
// Only ONE CTA animates at a time so the eye isn't pulled in multiple directions.
var _missionHome=getDailyMission(u);
var _missionReady=_missionHome&&_missionHome.status!=="calibrating"&&_missionHome.mod;
var _isMissionDoneHome=_missionReady&&(_missionHome.status==="completed"||_missionHome.done);
// Smart Daily Quest: active if Mission pending, OR if Challenge still pending (sequential reveal)
var _dailyQuestActive=(_missionReady&&!_isMissionDoneHome)||!dd;
var pulseSlot=p.pendingChests>0?"chest":needsMockNudge(u)?"mock":_dailyQuestActive?"daily":(p.events&&p.events.length>0)?"event":null;
return(
<div className="enter" style={{padding:"20px 16px 100px"}}>
<div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:24}}>
<div><p style={{color:"var(--t2)",fontSize:13,marginBottom:2}}>Welcome back</p><h1 className="out" style={{fontWeight:800,fontSize:24,display:"flex",alignItems:"center",gap:8}}>{u.name} {renderAv(u.avatar,28)}</h1></div>
<div style={{textAlign:"center"}}><span className="fl" style={{fontSize:28}}>{u.streak>0?"🔥":"❄️"}</span><div className="out" style={{fontSize:13,fontWeight:700,color:u.streak>0?"var(--orange)":"var(--t3)"}}>{u.streak}</div></div></div>

{/* Active bonus indicators */}
{function(){
  var pills=[];var dow=new Date().getDay();
  if(dow===0||dow===6)pills.push({label:"x2 Weekend",col:"#ff6bff",icon:"🎉"});
  if(u.streak>=7)pills.push({label:"x1.5 Streak",col:"#ff8c42",icon:"🔥"});
  else if(u.streak>=3)pills.push({label:"x1.2 Streak",col:"#ff8c42",icon:"🔥"});
  if(u.lastActive!==today())pills.push({label:"+10 Login bonus",col:"#00e676",icon:"🎁"});
  // Event pills removed — each event has its own banner below, no need to duplicate
  if(pills.length===0)return null;
  return(<div style={{display:"flex",gap:6,marginBottom:14,flexWrap:"wrap"}}>
    {pills.map(function(p,i){return (<div key={i} style={{display:"flex",alignItems:"center",gap:4,padding:"4px 10px",borderRadius:99,background:p.col+"15",border:"1px solid "+p.col+"30",fontSize:11,fontWeight:600,color:p.col}} className="out"><span style={{fontSize:12}}>{p.icon}</span>{p.label}</div>);})}
  </div>);
}()}

{/* Pending Chests */}
{p.pendingChests>0&&<button onClick={function(){p.onOpenChest();}} style={{width:"100%",marginBottom:14,padding:"14px 18px",background:"linear-gradient(135deg,rgba(255,192,32,.12),rgba(var(--cx),.08))",border:"1px solid rgba(255,192,32,.3)",borderRadius:14,cursor:"pointer",display:"flex",alignItems:"center",gap:12,fontFamily:"'DM Sans',sans-serif",animation:pulseSlot==="chest"?"pulse 2s infinite":"none"}}>
  <span style={{fontSize:28}}>{"\uD83D\uDCE6"}</span>
  <div style={{flex:1,textAlign:"left"}}><div className="out" style={{fontWeight:800,fontSize:14,color:"var(--gold)"}}>Treasure Chest{p.pendingChests>1?"s":""} Available!</div>
  <div style={{fontSize:11,color:"var(--t2)"}}>{p.pendingChests} chest{p.pendingChests>1?"s":""} waiting to be opened</div></div>
  <span style={{fontSize:20,color:"var(--gold)"}}>{">"}</span>
</button>}

{/* Mock Test Nudge */}
{needsMockNudge(p.u)&&<button onClick={function(){p.nav("mock1");}} style={{width:"100%",marginBottom:14,padding:"14px 18px",background:"linear-gradient(135deg,rgba(var(--cx),.12),rgba(var(--cx),.06))",border:"1.5px solid rgba(var(--cx),.35)",borderRadius:14,cursor:"pointer",display:"flex",alignItems:"center",gap:12,fontFamily:"'DM Sans',sans-serif"}}>
  <span style={{fontSize:28}}>{"\uD83D\uDCDC"}</span>
  <div style={{flex:1,textAlign:"left"}}><div className="out" style={{fontWeight:800,fontSize:14,color:"var(--cx-hex)"}}>Take Your First Mock Test</div>
  <div style={{fontSize:11,color:"var(--t2)"}}>Measure your real TOEIC level — unlocks score tracking</div></div>
  <span style={{fontSize:18,color:"var(--cx-hex)"}}>{">"}</span>
</button>}

{/* Active Events Banner */}
{p.events&&p.events.length>0&&p.events.map(function(ev,ei){
  var cfg=ev.config||{};var m=cfg.multiplier||2;
  var end=new Date(ev.end_at);var now=new Date();var hoursLeft=Math.max(0,Math.round((end-now)/36e5));
  var timeLabel=hoursLeft>=24?Math.floor(hoursLeft/24)+"d "+hoursLeft%24+"h left":hoursLeft+"h left";
  var icon=ev.type==="spotlight"?"🎯":ev.type==="flash_hour"?"⚡":"💪";
  var bg=ev.type==="spotlight"?"rgba(var(--cx),.1)":ev.type==="flash_hour"?"rgba(240,200,80,.12)":"rgba(74,190,96,.1)";
  var bd=ev.type==="spotlight"?"rgba(var(--cx),.25)":ev.type==="flash_hour"?"rgba(240,200,80,.3)":"rgba(74,190,96,.25)";
  var col=ev.type==="spotlight"?"var(--cyan)":ev.type==="flash_hour"?"var(--gold)":"var(--green)";
  var isUnderdog=ev.type==="underdog";
  var qualifies=!isUnderdog||p.u.xp<(p.medianXp||0);
  return(<div key={ei} className="crd" style={{marginBottom:12,padding:14,background:bg,border:"1px solid "+bd,animation:(pulseSlot==="event"&&ei===0)?"pulse 3s infinite":"none"}}>
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

{/* Secure email banner — Phase 1 Session 2 */}
{!u.email&&u.classCode!=="visitor"&&!secureBannerHidden&&(function(){
  var isIDRAC=u.classCode==="idrac2026";
  async function secureNow(){
    var email=prompt("Entre ton email pour s\u00e9curiser ton compte.\n\nTu recevras un lien de confirmation. Une fois cliqu\u00e9, ta progression sera li\u00e9e \u00e0 cet email et retrouvable sur tous tes appareils.");
    if(email===null)return;
    email=email.trim().toLowerCase();
    if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)){alert("Adresse email invalide.");return;}
    try{
      await linkEmailToAnonymous(email);
      try{sessionStorage.setItem("awaitingEmailConfirm","1");}catch(e){}
      alert("\u2709\uFE0F Email envoy\u00e9 \u00e0 "+email+".\n\n\uD83D\uDCF1 Sur mobile : ouvre le lien depuis le navigateur o\u00f9 tu utilises l'app (pas depuis l'app Gmail). Si le lien s'ouvre dans un autre navigateur, la confirmation ne sera pas d\u00e9tect\u00e9e ici.\n\nUne fois le lien cliqu\u00e9, reviens dans l'app \u2014 ta s\u00e9curisation sera d\u00e9tect\u00e9e automatiquement.");
      setSecureBannerHidden(true);
    }catch(e){
      alert("Erreur : "+((e&&e.message)||"impossible d'envoyer l'email."));
    }
  }
  function dismiss(){
    try{localStorage.setItem("secureEmailDismissedAt",Date.now().toString());}catch(e){}
    setSecureBannerHidden(true);
  }
  return(<div className="crd" style={{marginBottom:14,padding:"14px 16px",background:"linear-gradient(135deg,rgba(var(--cx),.10),rgba(27,112,207,.08))",border:"1px solid rgba(var(--cx),.25)"}}>
    <div style={{display:"flex",alignItems:"flex-start",gap:10,marginBottom:10}}>
      <span style={{fontSize:22,flexShrink:0}}>{"\uD83D\uDD12"}</span>
      <div style={{flex:1,minWidth:0}}>
        <div className="out" style={{fontWeight:800,fontSize:14,color:"var(--cx-hex)",marginBottom:3}}>Secure your account</div>
        <div style={{fontSize:11,color:"var(--t2)",lineHeight:1.5}}>
          {isIDRAC
            ?"Link an email before the course ends on 2026-06-28 to keep your progress and continue training afterwards."
            :"Link an email to sync your progress across devices and unlock Premium features later."}
        </div>
      </div>
    </div>
    <div style={{display:"flex",gap:8}}>
      <button className="btn1" style={{flex:1,fontSize:12,padding:"9px 12px"}} onClick={secureNow}>Secure now</button>
      <button className="btn2" style={{flex:"0 0 auto",fontSize:12,padding:"9px 16px"}} onClick={dismiss}>Later</button>
    </div>
  </div>);
})()}

<div className="crd glo" style={{marginBottom:16}}>
<div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10}}>
<div style={{display:"flex",alignItems:"center",gap:10}}>
<div style={{width:40,height:40,borderRadius:"50%",background:"linear-gradient(135deg,var(--cx-hex),var(--cx-dark))",display:"flex",alignItems:"center",justifyContent:"center",fontWeight:900,fontSize:16}} className="out">{lv.level}</div>
<div><div className="out" style={{fontSize:13,fontWeight:700}}>Level {lv.level}</div><div style={{fontSize:11,color:"var(--t2)"}}>{lv.cur} / {lv.next} XP</div></div></div>
<div style={{display:"flex",alignItems:"center",gap:6,padding:"4px 12px",background:"var(--bg3)",borderRadius:99}}>
<span style={{fontSize:16}}>{lg.icon}</span><span className="out" style={{fontSize:12,fontWeight:600,color:lg.color}}>{lg.name}</span></div></div>
<Bar value={lv.cur} max={lv.next} h={6}/></div>

{/* ═══ Smart Daily Quest — sequential reveal: Mission → Bonus Challenge → Rest ═══ */}
{function(){
  var mission=getDailyMission(u);
  var missionReady=mission&&mission.status!=="calibrating"&&mission.mod;
  var isMissionDone=missionReady&&(mission.status==="completed"||mission.done);

  // Initialize mission in userData if new
  if(missionReady&&mission.status==="new"&&(!u.mission||u.mission.date!==today())){
    u.mission={date:today(),actId:mission.actId,done:false};
    save(u);
  }

  // ROUTE A — Calibrated user, Mission pending: show adaptive Daily Mission
  if(missionReady&&!isMissionDone){
    var m=mission.mod;
    return(<div className="crd" onClick={function(){p.nav(mission.actId);}}
      style={{marginBottom:16,cursor:"pointer",padding:"14px 16px",
        background:"linear-gradient(135deg,rgba(255,215,0,.08),rgba(var(--cx),.08))",
        border:"1px solid rgba(255,215,0,.2)"}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
        <div style={{display:"flex",alignItems:"center",gap:10,flex:1,minWidth:0}}>
          <span style={{fontSize:22}}>{m.icon}</span>
          <div style={{minWidth:0,flex:1}}>
            <div style={{display:"flex",alignItems:"center",gap:6,marginBottom:2}}>
              <span className="out" style={{fontWeight:800,fontSize:15,color:"var(--t1)"}}>Daily Quest</span>
              <span style={{fontSize:9,padding:"2px 6px",borderRadius:4,background:"rgba(255,215,0,.15)",color:"var(--gold)",fontWeight:700}} className="out">+15 XP</span>
            </div>
            <div style={{fontSize:12,color:"var(--t2)",lineHeight:1.4,overflow:"hidden",textOverflow:"ellipsis"}}>
              {m.name+" \u2014 "+mission.reason}
            </div>
          </div>
        </div>
        <span style={{fontSize:20,color:"var(--gold)",marginLeft:8}}>{"\u2192"}</span>
      </div>
    </div>);
  }

  // ROUTE B — Calibrated user, Mission DONE but Daily Challenge still pending: BONUS QUEST unlocked
  if(missionReady&&isMissionDone&&!dd){
    return(<div className="crd" onClick={function(){p.nav("daily");}}
      style={{marginBottom:16,cursor:"pointer",padding:"14px 16px",
        background:"linear-gradient(135deg,rgba(var(--cx),.12),rgba(27,112,207,.12))",
        border:"1px solid rgba(var(--cx),.25)"}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
        <div style={{display:"flex",alignItems:"center",gap:10,flex:1,minWidth:0}}>
          <span style={{fontSize:22}}>{"\u26A1"}</span>
          <div style={{minWidth:0,flex:1}}>
            <div style={{display:"flex",alignItems:"center",gap:6,marginBottom:2,flexWrap:"wrap"}}>
              <span className="out" style={{fontWeight:800,fontSize:15,color:"var(--t1)"}}>Daily Quest</span>
              <span style={{fontSize:9,padding:"2px 6px",borderRadius:4,background:"rgba(255,215,0,.18)",color:"var(--gold)",fontWeight:700,letterSpacing:.5}} className="out">BONUS</span>
              <span style={{fontSize:9,padding:"2px 6px",borderRadius:4,background:"rgba(var(--cx),.15)",color:"var(--cyan)",fontWeight:700}} className="out">+100 XP</span>
            </div>
            <div style={{fontSize:12,color:"var(--t2)",lineHeight:1.4}}>
              Mission complete — bonus round unlocked: 5 grammar questions · 30s each
            </div>
          </div>
        </div>
        <span style={{fontSize:20,color:"var(--cyan)",marginLeft:8}}>{"\u2192"}</span>
      </div>
    </div>);
  }

  // ROUTE C — Calibrated user, BOTH done: visual rest state
  if(missionReady&&isMissionDone&&dd){
    return(<div className="crd" style={{marginBottom:16,padding:"14px 16px",background:"var(--bg2)",border:"1px solid var(--bdr)"}}>
      <div style={{display:"flex",alignItems:"center",gap:10}}>
        <span style={{fontSize:22}}>{"\u2705"}</span>
        <div style={{flex:1}}>
          <div className="out" style={{fontWeight:800,fontSize:15,color:"var(--green)",marginBottom:2}}>Daily Quest</div>
          <div style={{fontSize:12,color:"var(--green)",lineHeight:1.4}}>
            All daily quests complete. See you tomorrow!
          </div>
        </div>
      </div>
    </div>);
  }

  // ROUTE D — Uncalibrated / no mission: show Daily Challenge with optional calibration hint
  var remaining=mission&&mission.status==="calibrating"?mission.remaining:null;
  return(<div className="crd" onClick={function(){if(!dd)p.nav("daily");}}
    style={{marginBottom:16,cursor:dd?"default":"pointer",padding:"14px 16px",
      background:dd?"var(--bg2)":"linear-gradient(135deg,rgba(var(--cx),.12),rgba(27,112,207,.12))",
      border:dd?"1px solid var(--bdr)":"1px solid rgba(var(--cx),.2)"}}>
    <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
      <div style={{display:"flex",alignItems:"center",gap:10,flex:1,minWidth:0}}>
        <span style={{fontSize:22}}>{dd?"\u2705":"\u26A1"}</span>
        <div style={{minWidth:0,flex:1}}>
          <div style={{display:"flex",alignItems:"center",gap:6,marginBottom:2}}>
            <span className="out" style={{fontWeight:800,fontSize:15,color:dd?"var(--green)":"var(--t1)"}}>Daily Quest</span>
            {!dd&&<span style={{fontSize:9,padding:"2px 6px",borderRadius:4,background:"rgba(var(--cx),.15)",color:"var(--cyan)",fontWeight:700}} className="out">+100 XP</span>}
          </div>
          <div style={{fontSize:12,color:dd?"var(--green)":"var(--t2)",lineHeight:1.4}}>
            {dd?"Quest complete! +"+u.daily.xpE+" XP earned":"5 grammar questions \u00B7 30s each"+(remaining?" \u00B7 "+remaining+" sessions to unlock adaptive missions":"")}
          </div>
        </div>
      </div>
      {!dd&&<span style={{fontSize:20,color:"var(--cyan)",marginLeft:8}}>{"\u2192"}</span>}
    </div>
  </div>);
}()}

<div className="rg3" style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:10,marginBottom:16}}>
{[{l:"Total XP",v:u.xp,i:"star-formation",c:"var(--gold)"},{l:"This week",v:u.weeklyXp,i:"progression",c:"var(--cyan)"},{l:"Sessions",v:u.stats.sessions,i:"path-distance",c:"var(--purple)"}].map(function(s){return(
<div key={s.l} className="crd" style={{padding:14,textAlign:"center"}}><svg viewBox="0 0 512 512" width="24" height="24" style={{color:s.c,display:"block",margin:"0 auto 4px"}}><g fill="currentColor" dangerouslySetInnerHTML={{__html:GAME_ICON_PATHS[s.i]||""}}/></svg><div className="out" style={{fontSize:20,fontWeight:800,color:s.c}}>{s.v}</div><div style={{fontSize:10,color:"var(--t2)",textTransform:"uppercase",letterSpacing:.5}}>{s.l}</div></div>);})}</div>

<h2 className="out" style={{fontWeight:700,fontSize:16,marginBottom:12,color:"var(--t2)"}}>Quick Start</h2>
<div className="rg2" style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
<div className="crd" style={{cursor:"pointer",padding:16}} onClick={function(){p.nav("csess");}}><svg viewBox="0 0 512 512" width="32" height="32" style={{color:"var(--cyan)",display:"block",margin:"0 auto 8px"}}><g fill="currentColor" dangerouslySetInnerHTML={{__html:GAME_ICON_PATHS["card-joker"]||""}}/></svg><div className="out" style={{fontWeight:700,fontSize:14,textAlign:"center"}}>Review Cards</div><div style={{fontSize:11,color:"var(--t2)",marginTop:4,textAlign:"center"}}>SRS flashcards</div></div>
<div className="crd" style={{cursor:"pointer",padding:16}} onClick={function(){p.nav("drill");}}><svg viewBox="0 0 512 512" width="32" height="32" style={{color:"var(--cyan)",display:"block",margin:"0 auto 8px"}}><g fill="currentColor" dangerouslySetInnerHTML={{__html:GAME_ICON_PATHS["ink-swirl"]||""}}/></svg><div className="out" style={{fontWeight:700,fontSize:14,textAlign:"center"}}>Grammar Drill</div><div style={{fontSize:11,color:"var(--t2)",marginTop:4,textAlign:"center"}}>Part 5 practice</div></div></div>

{/* Strategy Tip of the Day */}
{function(){
  var allTips=[];STRATEGIES.forEach(function(s){s.tips.forEach(function(t){allTips.push({tip:t,part:s.part,icon:s.icon});});});
  var dayIndex=0;var d=today();for(var i=0;i<d.length;i++)dayIndex+=d.charCodeAt(i);
  var todayTip=allTips[dayIndex%allTips.length];
  return(<div style={{marginTop:20}}>
    <div className="crd" style={{padding:0,overflow:"hidden",border:"1px solid rgba(180,140,80,.12)",background:"linear-gradient(160deg,rgba(180,140,80,.06) 0%,rgba(27,112,207,.04) 100%)"}}>
      <div style={{padding:"16px 18px 14px"}}>
        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:12}}>
          <div style={{display:"flex",alignItems:"center",gap:8}}>
            <span style={{fontSize:16}}>{todayTip.icon}</span>
            <span className="out" style={{fontSize:10,fontWeight:700,color:"var(--cyan)",textTransform:"uppercase",letterSpacing:1}}>Tip of the day — {todayTip.part}</span>
          </div>
          <svg viewBox="0 0 512 512" width="14" height="14" style={{color:"var(--t3)",display:"inline-block",verticalAlign:"middle"}}><g fill="currentColor" dangerouslySetInnerHTML={{__html:GAME_ICON_PATHS["candle-flame"]||""}}/></svg>
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

if(ph==="done"){var fx=30+sc*14+(sc===5?20:0);if(p.gate)fx=p.gate(fx,sc,5);return(<div className="enter" style={{padding:"20px 16px",minHeight:"100vh",display:"flex",flexDirection:"column",justifyContent:"center",textAlign:"center"}}>
<div style={{fontSize:64,marginBottom:16,animation:"countUp .6s"}}>{sc===5?"👑":sc>=3?"⚔️":"🛡️"}</div><h1 className="out" style={{fontWeight:900,fontSize:32,marginBottom:8}}>{sc===5?"FLAWLESS!":sc>=4?"Great fight!":sc>=3?"Not bad!":"Keep training!"}</h1>
<div className="out" style={{fontSize:48,fontWeight:900,color:"var(--cyan)",marginBottom:4,animation:"countUp .8s"}}>{sc}/5</div>
<div className="out" style={{fontSize:22,fontWeight:800,color:"var(--gold)",marginBottom:32}}>+{fx} XP</div>
{sc===5&&<p style={{color:"var(--gold)",marginBottom:16,fontWeight:600}}>Perfect bonus: +20 XP!</p>}<button className="btn1" onClick={p.back}>Back to Home</button></div>);}

var q=qs[ci],tc=tl>15?"var(--cyan)":tl>5?"var(--orange)":"var(--red)";
return(<div className={sk?"sk":""} style={{padding:"20px 16px",minHeight:"100vh"}}>
<div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:24}}>
<button className="back-btn" onClick={p.back}>{"\u2190"} Back</button>
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
{ph==="fb"&&<div style={{marginTop:20,animation:"fadeIn .3s ease-out"}}><div className="crd" style={{background:"rgba(var(--cx),.06)",borderColor:"rgba(var(--cx),.15)",padding:16}}><p style={{fontSize:13,color:"var(--t2)",lineHeight:1.6}}>{q.x}</p></div>
<button className="btn1" onClick={nxt} style={{marginTop:16}}>{ci<qs.length-1?"Next Question":"See Results"}</button></div>}</div>);}

// ─── TRAIN PAGE ───
  function Train(p){
  var[trainView,setTrainView]=useState(p.initialView!=null?p.initialView:null);
  var dd=p.u.daily&&p.u.daily.date===today()&&p.u.daily.done;

  // ── Section data (unchanged) ──
  var sections=[
    {key:"exercises",title:"Exercises",sub:"TOEIC Parts training",icon:"crossed-swords",count:"Parts 1-7",items:[
      {id:"daily",n:"Daily Challenge",d:dd?"Completed today ✓":"5 daily questions, timed",i:"sunrise",bg:dd?"var(--bg3)":"linear-gradient(135deg,var(--cx-hex),#8b5e83)",lock:dd},
      {id:"lis",n:"Listening Practice",d:"Parts 1-4 with audio",i:"ringing-bell",bg:"linear-gradient(135deg,#22c55e,#f59e0b)"},
      {id:"read",n:"Reading Practice",d:"Parts 5-7",i:"bookmarklet",bg:"linear-gradient(135deg,#5a7a9a,#7a5a80)"},
    ]},
    {key:"grammar",title:"Grammar & Vocab",sub:"Build your foundations",icon:"bookshelf",count:"8 modules",items:[
      {id:"csess",n:"Flashcard Review",d:"SRS spaced repetition",i:"card-joker",bg:"linear-gradient(135deg,#ff8c42,#ff6b35)"},
      {id:"gauntlet",n:"Grammar Gauntlet",d:"4 trials · Irregulars, Tenses, Passive, Relatives",i:"gauntlet",bg:"linear-gradient(135deg,#7c3aed,#c026d3)"},
      {id:"wordfam",n:"Word Families",d:"Classify: Noun, Verb, Adj, Adv",i:"family-tree",bg:"linear-gradient(135deg,#f59e0b,#ef4444)"},
      {id:"falsefr",n:"False Friends",d:"FR/EN traps: actually ≠ actuellement",i:"duality-mask",bg:"linear-gradient(135deg,#ec4899,#f59e0b)"},
      {id:"connsort",n:"Connectors Sorting",d:"Clause, Noun, or New sentence?",i:"knot",bg:"linear-gradient(135deg,#8b5e83,#c4587a)"},
      {id:"prepdrill",n:"Preposition Collocations",d:"Study + Drill mode",i:"linked-rings",bg:"linear-gradient(135deg,#06b6d4,#22c55e)"},
      {id:"gerinf",n:"Gerund vs Infinitive",d:"4 patterns · Study + Context Quiz",i:"scales",bg:"linear-gradient(135deg,#e11d48,#f59e0b)"},
      {id:"pvdojo",n:"Phrasal Verb Dojo",d:"55 verbs · Study, Match & Speed",i:"shuriken",bg:"linear-gradient(135deg,#f97316,#dc2626)"},
    ]},
    {key:"mocks",title:"Mock Exams",sub:"Real conditions",icon:"scroll-unfurled",count:"3 tests",items:(function(){
      var items=[];
      var u1=canUnlockMock(p.u,1);
      items.push({id:"mock1",n:"Mock Test 1",d:u1.ok?"Reading Half-Test · 49 Q · 37 min":u1.reasons[0],i:"scroll-quill",bg:u1.ok?"linear-gradient(135deg,#ffd700,#ff8c42)":"var(--bg3)",lock:!u1.ok,mockId:1});
      var u2=canUnlockMock(p.u,2);
      items.push({id:"mock2",n:"Mock Test 2",d:u2.ok?"Reading Half-Test · 49 Q · 37 min":u2.reasons[0],i:"scroll-quill",bg:u2.ok?"linear-gradient(135deg,#8b5e83,#c4587a)":"var(--bg3)",lock:!u2.ok,mockId:2});
      var u3=canUnlockMock(p.u,3);
      items.push({id:"mock3",n:"Mock Test 3",d:u3.ok?"Reading Half-Test · 48 Q · 37 min":u3.reasons[0],i:"scroll-quill",bg:u3.ok?"linear-gradient(135deg,#22c55e,#06b6d4)":"var(--bg3)",lock:!u3.ok,mockId:3});
      if(p.u.mockResults&&p.u.mockResults.mock1){items[0].d="Completed — TOEIC "+p.u.mockResults.mock1.toeicEstimate+"/495";items[0].lock=true;items[0].bg="var(--bg3)";}
      if(p.u.mockResults&&p.u.mockResults.mock2){items[1].d="Completed — TOEIC "+p.u.mockResults.mock2.toeicEstimate+"/495";items[1].lock=true;items[1].bg="var(--bg3)";}
      if(p.u.mockResults&&p.u.mockResults.mock3){items[2].d="Completed — TOEIC "+p.u.mockResults.mock3.toeicEstimate+"/495";items[2].lock=true;items[2].bg="var(--bg3)";}
      return items;
    })()},
    {key:"tips",title:"Tips & Strategy",sub:"Master the exam",icon:"treasure-map",count:"5 tools",items:[
      {id:"abouttoeic",n:"What is the TOEIC?",d:"Format, score, levels — the quick guide",i:"info",bg:"linear-gradient(135deg,#8b5e83,#5a7a9a)"},
      {id:"strats",n:"Strategy Cards",d:"54 expert tips, all Parts",i:"card-pick",bg:"linear-gradient(135deg,#6a8a50,#4a7a5a)"},
      {id:"stratquiz",n:"Strategy Quiz",d:"Test your exam IQ",i:"brain",bg:"linear-gradient(135deg,#8b5e83,#5a5c8a)"},
      {id:"traps",n:"TOEIC Traps Quiz",d:"Spot the 20 classic traps",i:"trap-mask",bg:"linear-gradient(135deg,#ef4444,#f59e0b)"},
      {id:"gramref",n:"Grammar Reference",d:"12 essential grammar sheets",i:"book-aura",bg:"linear-gradient(135deg,#5a7a9a,#7a5a80)"},
    ]},
  ];

  // ── Boss Test status ──
  var uBoss=canUnlockBoss(p.u);
  var bossCompleted=p.u.mockResults&&p.u.mockResults.boss;
  var bossLocked=!uBoss.ok;
  var mocksDone=[p.u.mockResults&&p.u.mockResults.mock1,p.u.mockResults&&p.u.mockResults.mock2,p.u.mockResults&&p.u.mockResults.mock3];

  // ── Endless Arena status ──
  var endlessState=getEndlessState(p.u);
  var endlessData=p.u.mockResults&&p.u.mockResults.endless;
  var endlessCooldownH=endlessData&&endlessData.lastAttempt?Math.max(0,Math.ceil((24*60*60*1000-(Date.now()-endlessData.lastAttempt))/3600000)):0;
  var endlessCooldownM=endlessData&&endlessData.lastAttempt?Math.max(0,Math.ceil(((24*60*60*1000-(Date.now()-endlessData.lastAttempt))%3600000)/60000)):0;

  // ── Grid sections (exercises, grammar, tips — NOT mocks) ──
  var gridSections=[sections[0],sections[1],sections[3]]; // exercises, grammar, tips
  var mocksSection=sections[2]; // mocks kept for sub-view

  // ── Visitor locking ──
  // Phase 4: lock premium modules for any user without full access (free/visitor).
  // Institutional users (school/pro) bypass this.
  if(!hasFullAccess(p.u, p.groupType)){
    sections.forEach(function(sec){sec.items.forEach(function(m){
      if(isModuleLocked(m.id,p.u,p.groupType))m.visitorLocked=true;
    });});
  }

  // ═══ SUB-VIEW — show items of selected section ═══
  if(trainView!==null){
    // trainView "mocks" = special sub-view with Ultimate Trials
    if(trainView==="mocks"){
      var animIdx2=0;
      return(<div className="enter" style={{padding:"20px 16px 100px"}}>
        <button onClick={function(){setTrainView(null);}} style={{background:"none",border:"none",color:"var(--t2)",cursor:"pointer",fontSize:14,marginBottom:16,padding:0}}>{"←"} Training Grounds</button>
        <h2 className="out" style={{fontWeight:800,fontSize:20,marginBottom:4}}>Mock Exams</h2>
        <p style={{color:"var(--t3)",fontSize:12,marginBottom:16}}>Real conditions {"·"} full tests</p>

        {/* Mock Test 1/2/3 cards */}
        <div className="rg-games" style={{display:"flex",flexDirection:"column",gap:8}}>
          {mocksSection.items.map(function(m){
            var ai=animIdx2++;
            return(
              <div key={m.id} className="crd" onClick={function(){if(!m.lock)p.nav(m.id);}}
                style={{display:"flex",alignItems:"center",gap:14,cursor:m.lock?"default":"pointer",opacity:m.lock?.4:1,padding:"14px 16px",animation:"fadeIn .3s ease-out",animationDelay:(ai*.04)+"s",animationFillMode:"both"}}>
                <div style={{width:42,height:42,borderRadius:12,background:"linear-gradient(135deg,rgba(var(--cx),.22),transparent)",border:"1.5px solid var(--cyan)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:20,flexShrink:0}}>{GAME_ICON_PATHS[m.i]?<GIcon name={m.i} size={22} color="var(--cyan)"/>:m.i}</div>
                <div style={{flex:1,minWidth:0}}>
                  <div className="out" style={{fontWeight:700,fontSize:14,marginBottom:1}}>{m.n}</div>
                  <div style={{fontSize:11,color:"var(--t3)"}}>{m.d}</div>
                </div>
                {m.lock?<span style={{fontSize:16}}>{"🔒"}</span>:<span style={{fontSize:16,color:"var(--cyan)"}}>{"→"}</span>}
              </div>);
          })}
        </div>

        {/* ── ULTIMATE TRIALS separator ── */}
        <div style={{display:"flex",alignItems:"center",gap:10,margin:"18px 0 12px"}}>
          <div style={{flex:1,height:1,background:"#3a2a15"}}/>
          <div style={{fontFamily:"'Cinzel','Outfit',serif",fontSize:11,color:"#8a7e6a",letterSpacing:2}}>ULTIMATE TRIALS</div>
          <div style={{flex:1,height:1,background:"#3a2a15"}}/>
        </div>

        {/* ── Hero Final Arena ── */}
        <div onClick={function(){if(!bossLocked)p.nav("boss");}}
          style={{padding:0,overflow:"hidden",cursor:bossLocked?"default":"pointer",opacity:bossLocked?.55:1,borderRadius:16,border:"1px solid "+(bossLocked?"var(--bdr)":"rgba(220,38,38,.5)"),background:"linear-gradient(135deg,#1a0505,#2a0a0a)",marginBottom:10,animation:"fadeIn .4s ease-out",animationDelay:".15s",animationFillMode:"both"}}>
          <div style={{background:"linear-gradient(135deg,#2a0a0a,#3d1a00,#1a0800)",padding:"18px 16px",position:"relative",overflow:"hidden"}}>
            {!bossCompleted&&<div style={{position:"absolute",inset:0,background:"radial-gradient(ellipse at 30% 90%,rgba(255,100,20,0.35),transparent 55%)",animation:"final-ember-glow 3.5s ease-in-out infinite",pointerEvents:"none"}}/>}
            {!bossCompleted&&<div style={{position:"absolute",inset:0,background:"radial-gradient(ellipse at 70% 85%,rgba(220,38,38,0.25),transparent 50%)",animation:"final-ember-glow 4.5s ease-in-out infinite 0.8s",pointerEvents:"none"}}/>}
            {!bossCompleted&&<><div className="fx-ember sm" style={{left:"18%",bottom:10,animationDelay:"0s"}}/><div className="fx-ember" style={{left:"28%",bottom:8,animationDelay:"0.7s"}}/><div className="fx-ember lg" style={{left:"40%",bottom:12,animationDelay:"1.4s"}}/><div className="fx-ember sm" style={{left:"52%",bottom:6,animationDelay:"2.1s"}}/><div className="fx-ember" style={{left:"63%",bottom:10,animationDelay:"0.3s"}}/><div className="fx-ember sm" style={{left:"74%",bottom:8,animationDelay:"1.0s"}}/><div className="fx-ember" style={{left:"85%",bottom:12,animationDelay:"1.7s"}}/><div className="fx-ember lg" style={{left:"22%",bottom:14,animationDelay:"2.8s"}}/><div className="fx-ember sm" style={{left:"58%",bottom:6,animationDelay:"3.2s"}}/></>}
            {!bossLocked&&<div style={{position:"absolute",inset:0,background:"radial-gradient(ellipse at 80% 30%,rgba(245,158,11,.08),transparent 60%),radial-gradient(ellipse at 20% 70%,rgba(220,38,38,.06),transparent 50%)"}}/>}
            {!bossLocked&&<div style={{position:"absolute",top:-8,right:12,opacity:.1,transform:"scaleX(-1)"}}><GIcon name="dragon-spiral" size={54} color="currentColor"/></div>}
            <div style={{position:"relative",display:"flex",alignItems:"center",gap:14}}>
              <div style={{width:50,height:50,borderRadius:14,background:"linear-gradient(135deg,#dc2626,#f59e0b)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:24,flexShrink:0,boxShadow:bossLocked?"none":"0 0 20px rgba(220,38,38,.3)"}}><GIcon name="dragon-spiral" size={28} color="#fff"/></div>
              <div style={{flex:1}}>
                <div style={{marginBottom:2}}>
                  <span className="out" style={{fontWeight:900,fontSize:16,background:"linear-gradient(90deg,#ff4444,#ff8c42,#ffd700)",WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent"}}>THE FINAL ARENA</span>
                </div>
                {bossCompleted&&!bossLocked?<div style={{fontSize:12,color:"var(--gold)"}}>Best: TOEIC {p.u.mockResults.boss.toeicEstimate}/990 {"—"} Retake?</div>
                :bossLocked?<div style={{fontSize:11,color:"var(--t3)"}}>{uBoss.reasons[0]}</div>
                :<div style={{fontSize:12,color:"#cc8844"}}>Full TOEIC {"·"} 202 Q {"·"} 120 min</div>}
                <div style={{display:"flex",gap:4,marginTop:6}}>
                  {["Mock 1","Mock 2","Mock 3"].map(function(label,i){
                    var done=mocksDone[i];
                    return(<span key={i} style={{fontSize:9,padding:"2px 7px",borderRadius:99,fontWeight:600,
                      background:done?"rgba(34,197,94,.15)":"rgba(255,255,255,.06)",
                      color:done?"#22c55e":"var(--t3)"}}>{done?"✓ ":""}{label}</span>);
                  })}
                </div>
              </div>
              {bossLocked?<span style={{fontSize:18}}>{"🔒"}</span>:<span style={{fontSize:18,color:"rgba(220,38,38,.6)"}}>{"➔"}</span>}
            </div>
          </div>
        </div>

        {/* ── Hero Endless Arena (if visible) ── */}
        {endlessState!=="hidden"&&(function(){
          var isLocked=endlessState==="locked";
          var isCooldown=endlessState==="cooldown";
          var isReady=endlessState==="ready";
          var bossScore=bossCompleted?p.u.mockResults.boss.toeicEstimate:0;
          var progressPct=isLocked?Math.max(0,Math.min(100,((bossScore-200)/(650-200))*100)):0;

          return(<div onClick={function(){if(isReady)p.nav("endless");}}
            style={{padding:0,overflow:"hidden",cursor:isReady?"pointer":"default",opacity:isCooldown?.75:isLocked?.55:1,borderRadius:16,border:"1.5px solid rgba(27,112,207,0.4)",background:"linear-gradient(135deg,#081828,#0d2a45)",animation:"fadeIn .4s ease-out",animationDelay:".25s",animationFillMode:"both"}}>
            <div style={{background:"linear-gradient(135deg,#0a1e35,#102844,#081828)",padding:"18px 16px",position:"relative",overflow:"hidden"}}>
              <div style={{position:"absolute",inset:0,background:"radial-gradient(ellipse at 75% 20%,rgba(27,112,207,0.35),transparent 55%)",animation:"endless-halo-breathe 5s ease-in-out infinite",pointerEvents:"none"}}/>
              <div style={{position:"absolute",inset:0,background:"radial-gradient(ellipse at 15% 85%,rgba(74,159,224,0.18),transparent 45%)",animation:"endless-halo-breathe 6s ease-in-out infinite 1.5s",pointerEvents:"none"}}/>
              <div className="fx-star" style={{top:"14%",left:"8%",width:2,height:2,background:"#a8d4ff",animationDelay:"0s"}}/><div className="fx-star" style={{top:"22%",left:"18%",width:1.5,height:1.5,background:"#d4943a",animationDelay:"0.5s"}}/><div className="fx-star" style={{top:"10%",left:"32%",width:2.5,height:2.5,background:"#ffffff",animationDelay:"1.2s"}}/><div className="fx-star" style={{top:"28%",left:"45%",width:1.5,height:1.5,background:"#a8d4ff",animationDelay:"1.8s"}}/><div className="fx-star" style={{top:"18%",left:"58%",width:2,height:2,background:"#a8d4ff",animationDelay:"0.3s"}}/><div className="fx-star" style={{top:"8%",left:"72%",width:2,height:2,background:"#d4943a",animationDelay:"2.2s"}}/><div className="fx-star" style={{top:"24%",left:"85%",width:1.5,height:1.5,background:"#ffffff",animationDelay:"0.9s"}}/><div className="fx-star" style={{top:"35%",left:"28%",width:1.5,height:1.5,background:"#a8d4ff",animationDelay:"2.5s"}}/><div className="fx-star" style={{top:"40%",left:"62%",width:2,height:2,background:"#d4943a",animationDelay:"1.5s"}}/><div className="fx-star" style={{top:"48%",left:"15%",width:1.5,height:1.5,background:"#a8d4ff",animationDelay:"0.7s"}}/><div className="fx-star" style={{top:"55%",left:"78%",width:2,height:2,background:"#ffffff",animationDelay:"2.8s"}}/><div className="fx-star" style={{top:"65%",left:"38%",width:1.5,height:1.5,background:"#a8d4ff",animationDelay:"1.1s"}}/><div className="fx-star" style={{top:"72%",left:"88%",width:2,height:2,background:"#d4943a",animationDelay:"0.4s"}}/><div className="fx-star" style={{top:"80%",left:"22%",width:1.5,height:1.5,background:"#a8d4ff",animationDelay:"2.0s"}}/><div className="fx-star" style={{top:"85%",left:"55%",width:2,height:2,background:"#ffffff",animationDelay:"1.3s"}}/>
              <div style={{position:"absolute",top:-6,right:14,opacity:.08}}><GIcon name="infinity" size={52} color="currentColor"/></div>
              <div style={{position:"relative",display:"flex",alignItems:"center",gap:14}}>
                <div style={{width:50,height:50,borderRadius:14,background:"linear-gradient(135deg,#1B70CF,#0a3a6e)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:24,flexShrink:0,boxShadow:"0 0 20px rgba(27,112,207,0.35)"}}><GIcon name="infinity" size={28} color="#fff"/></div>
                <div style={{flex:1}}>
                  <div style={{marginBottom:2}}>
                    <span className="out" style={{fontWeight:900,fontSize:16,letterSpacing:.5,background:"linear-gradient(90deg,#7fb8e8,#4a9fe0,#d4943a)",WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent"}}>ENDLESS ARENA</span>
                  </div>
                  <div style={{fontFamily:"'Cinzel','Outfit',serif",fontStyle:"italic",fontSize:11,color:"#8a7e6a"}}>the arena never sleeps</div>
                </div>
                {isReady?<span style={{fontSize:18,color:"#7fb8e8"}}>{"→"}</span>:<span style={{fontSize:18}}>{"🔒"}</span>}
              </div>

              {/* Locked: progress bar toward 650 gate */}
              {isLocked&&<div style={{marginTop:14}}>
                <div style={{display:"flex",justifyContent:"space-between",fontSize:11,color:"#8a7e6a",marginBottom:4}}>
                  <span>Your score</span><span>Gate</span>
                </div>
                <div style={{display:"flex",justifyContent:"space-between",marginBottom:6}}>
                  <span style={{fontFamily:"'Cinzel','Outfit',serif",fontSize:14,color:"#7fb8e8"}}>{bossScore}</span>
                  <span style={{fontFamily:"'Cinzel','Outfit',serif",fontSize:14,color:"#d4943a"}}>650</span>
                </div>
                <div style={{height:6,background:"rgba(27,112,207,.18)",borderRadius:99}}>
                  <div style={{width:progressPct+"%",height:"100%",borderRadius:99,background:"linear-gradient(90deg,#0a3a6e,#1B70CF)"}}/>
                </div>
                <div style={{fontFamily:"'Cinzel','Outfit',serif",fontStyle:"italic",fontSize:11,color:"#4a9fe0",textAlign:"center",marginTop:6}}>So close {"·"} {650-bossScore} points from glory</div>
              </div>}

              {/* Ready: stats line */}
              {isReady&&endlessData&&endlessData.attempts>0&&<div style={{borderTop:"1px solid rgba(27,112,207,.3)",marginTop:10,paddingTop:10}}>
                <div style={{fontSize:11,color:"#8a7e6a"}}>Runs: <span style={{color:"#7fb8e8"}}>{endlessData.attempts}</span>  {"·"}  Best: <span style={{color:"#7fb8e8"}}>{endlessData.best}</span>  {"·"}  <span style={{color:"#7fb8e8"}}>Ready to enter</span></div>
              </div>}
              {isReady&&(!endlessData||endlessData.attempts===0)&&<div style={{marginTop:10,textAlign:"center"}}>
                <div style={{fontFamily:"'Cinzel','Outfit',serif",fontStyle:"italic",fontSize:12,color:"#7fb8e8"}}>First run awaits {"·"} enter the sanctuary</div>
              </div>}

              {/* Cooldown: stats with timer */}
              {isCooldown&&endlessData&&<div style={{borderTop:"1px solid rgba(27,112,207,.3)",marginTop:10,paddingTop:10}}>
                <div style={{fontSize:11,color:"#8a7e6a"}}>Runs: <span style={{color:"#7fb8e8"}}>{endlessData.attempts}</span>  {"·"}  Best: <span style={{color:"#7fb8e8"}}>{endlessData.best}</span>  {"·"}  Ready in <span style={{color:"#7fb8e8"}}>{endlessCooldownH}h {endlessCooldownM}m</span></div>
              </div>}
            </div>
          </div>);
        })()}
      </div>);
    }

    // Regular sub-view (exercises, grammar, tips)
    var sec=trainView==="mocks"?mocksSection:gridSections[trainView];
    if(sec){
      var animIdx=0;
      return(<div className="enter" style={{padding:"20px 16px 100px"}}>
        <button onClick={function(){setTrainView(null);}} style={{background:"none",border:"none",color:"var(--t2)",cursor:"pointer",fontSize:14,marginBottom:16,padding:0}}>{"←"} Training Grounds</button>
        <h2 className="out" style={{fontWeight:800,fontSize:20,marginBottom:4}}>{sec.title}</h2>
        <p style={{color:"var(--t3)",fontSize:12,marginBottom:16}}>{sec.sub}</p>
        <div className="rg-games" style={{display:"flex",flexDirection:"column",gap:8}}>
          {sec.items.map(function(m){
            var ai=animIdx++;
            var vl=m.visitorLocked;
            return(
              <div key={m.id} className="crd" onClick={function(){if(vl){p.onPremium(m.n);return;}if(!m.lock)p.nav(m.id);}}
                style={{display:"flex",alignItems:"center",gap:14,cursor:(m.lock||vl)?"default":"pointer",opacity:m.lock?.4:vl?.55:1,padding:"14px 16px",animation:"fadeIn .3s ease-out",animationDelay:(ai*.04)+"s",animationFillMode:"both"}}>
                <div style={{width:42,height:42,borderRadius:12,background:vl?"transparent":"linear-gradient(135deg,rgba(var(--cx),.22),transparent)",border:vl?"1.5px solid var(--bdr)":"1.5px solid var(--cyan)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:20,flexShrink:0}}>{GAME_ICON_PATHS[m.i]?<GIcon name={m.i} size={22} color={vl?"var(--t3)":"var(--cyan)"}/>:m.i}</div>
                <div style={{flex:1,minWidth:0}}>
                  <div className="out" style={{fontWeight:700,fontSize:14,marginBottom:1}}>{m.n}</div>
                  <div style={{fontSize:11,color:vl?"var(--gold)":"var(--t3)"}}>{vl?"Arena Premium":m.d}</div>
                </div>
                {vl?<span style={{fontSize:14,color:"var(--gold)"}}>{"🔒"}</span>:m.lock?<span style={{fontSize:16}}>{"🔒"}</span>:<span style={{fontSize:16,color:"var(--cyan)"}}>{"→"}</span>}
              </div>);
          })}
        </div>
      </div>);
    }
  }

  // ═══ MAIN VIEW — Hero Mock Exams + 3 tiles grid ═══
  return(<div className="enter" style={{padding:"20px 16px 100px"}}>
    <h1 className="out" style={{fontWeight:800,fontSize:24,marginBottom:4}}>Training Grounds</h1>
    <p style={{color:"var(--t2)",fontSize:13,marginBottom:16}}>Choose your battle</p>

    {/* Hero Mock Exams */}
    <div className="crd" onClick={function(){setTrainView("mocks");}}
      style={{padding:16,marginBottom:14,cursor:"pointer",borderColor:"rgba(255,255,255,.06)"}}>
      <div style={{display:"flex",alignItems:"center",gap:14}}>
        <div style={{width:50,height:50,borderRadius:14,background:"linear-gradient(135deg,rgba(var(--cx),.22),transparent)",border:"1.5px solid var(--cyan)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:26,flexShrink:0}}><GIcon name="scroll-unfurled" size={28} color="var(--cyan)"/></div>
        <div style={{flex:1}}>
          <div className="out" style={{fontFamily:"'Cinzel','Outfit',serif",fontWeight:800,fontSize:16,letterSpacing:1.5,color:"#f0c850"}}>MOCK EXAMS</div>
          <div style={{fontSize:12,color:"#8a7e6a"}}>Real conditions {"·"} full tests</div>
        </div>
        <span style={{fontSize:16,color:"#d4943a"}}>{"→"}</span>
      </div>
      {/* Mock pills */}
      <div style={{display:"flex",gap:6,marginTop:14}}>
        {["Mock 1","Mock 2","Mock 3"].map(function(label,i){
          var done=mocksDone[i];
          return(<span key={i} style={{fontSize:11,padding:"3px 9px",borderRadius:99,fontWeight:600,
            background:done?"rgba(74,190,96,0.15)":"rgba(255,255,255,0.05)",
            color:done?"#4abe60":"#5a5040"}}>{done?"\u2713 ":""}{label}</span>);
        })}
      </div>
      {/* Separator */}
      <div style={{height:1,background:"rgba(180,140,80,0.15)",margin:"10px -4px"}}/>
      {/* Event rows: Final Arena + Endless Arena */}
      <div style={{display:"flex",alignItems:"center",gap:11,padding:"7px 4px"}}>
        <span style={{width:22,textAlign:"center",display:"inline-flex",justifyContent:"center"}}><GIcon name="dragon-spiral" size={19} color={bossCompleted?"#4abe60":bossLocked?"#8a7e6a":"#e8c88a"}/></span>
        <span style={{fontFamily:"'Cinzel','Outfit',serif",fontSize:13,fontWeight:700,color:bossCompleted?"#4abe60":bossLocked?"#8a7e6a":"#e8c88a",flex:1}}>Final Arena</span>
        <span style={{fontSize:11,color:bossCompleted?"#4abe60":bossLocked?"#8a7e6a":"#f0c850"}}>{bossCompleted?"conquered \xb7 "+(p.u.mockResults.boss.toeicEstimate||""):bossLocked?"awaiting \xb7 finish mocks":"unlocked \xb7 enter \u2192"}</span>
      </div>
      {endlessState!=="hidden"&&<div style={{display:"flex",alignItems:"center",gap:11,padding:"8px 4px 6px",background:"rgba(27,112,207,0.08)",borderRadius:8,margin:"2px -4px 0"}}>
        <span style={{width:22,textAlign:"center",display:"inline-flex",justifyContent:"center"}}><GIcon name="infinity" size={19} color="#7fb8e8"/></span>
        <span style={{fontFamily:"'Cinzel','Outfit',serif",fontSize:13,fontWeight:700,color:"#7fb8e8",flex:1}}>Endless Arena</span>
        <span style={{fontSize:11,color:endlessState==="ready"?"#4a9fe0":endlessState==="cooldown"?"#8a7e6a":"#8a7e6a"}}>{endlessState==="locked"?"locked \xb7 requires 650+":endlessState==="ready"?"ready to enter":endlessState==="cooldown"?"ready in "+endlessCooldownH+"h":""}</span>
      </div>}
    </div>

    {/* Row 1 (2-col): Exercises + Grammar & Vocab */}
    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
      {[gridSections[0],gridSections[1]].map(function(sec,si){
        return(<div key={sec.key} className="crd" onClick={function(){setTrainView(si);}}
          style={{padding:"18px 14px",cursor:"pointer",borderColor:"rgba(255,255,255,.06)",animation:"fadeIn .4s ease-out",animationDelay:(si*.06)+"s",animationFillMode:"both"}}>
          <div>
            <div style={{fontSize:28,marginBottom:8}}>{GAME_ICON_PATHS[sec.icon]?<GIcon name={sec.icon} size={32} color="var(--cyan)" block={true}/>:sec.icon}</div>
            <div className="out" style={{fontWeight:700,fontSize:14,marginBottom:2}}>{sec.title}</div>
            <div style={{fontSize:11,color:"var(--t3)",marginBottom:8}}>{sec.sub}</div>
            <div style={{display:"flex",alignItems:"center",justifyContent:"space-between"}}>
              <span style={{fontSize:10,color:"var(--cyan)",fontWeight:600}}>{sec.count}</span>
              <span style={{fontSize:14,color:"var(--cyan)"}}>{"→"}</span>
            </div>
          </div>
        </div>);
      })}
    </div>

    {/* Row 2 full-width: Flashcards banner (between Grammar&Vocab and Tips&Strategy) */}
    <div className="crd" onClick={function(){if(p.tabGo)p.tabGo("cards");}}
      style={{marginTop:10,padding:"18px 14px",cursor:"pointer",borderColor:"rgba(255,255,255,.06)",animation:"fadeIn .4s ease-out",animationDelay:".12s",animationFillMode:"both"}}>
      <div style={{display:"flex",alignItems:"center",gap:14}}>
        <div style={{flexShrink:0}}><GIcon name="card-joker" size={34} color="var(--cyan)"/></div>
        <div style={{flex:1}}>
          <div className="out" style={{fontWeight:700,fontSize:14,marginBottom:2}}>Flashcards</div>
          <div style={{fontSize:11,color:"var(--t3)"}}>SRS spaced repetition {"\u00B7"} 18 domains</div>
        </div>
        <div style={{display:"flex",alignItems:"center",gap:6}}>
          <span style={{fontSize:10,color:"var(--cyan)",fontWeight:600}}>Browse</span>
          <span style={{fontSize:14,color:"var(--cyan)"}}>{"\u2192"}</span>
        </div>
      </div>
    </div>

    {/* Row 3 full-width: Tips & Strategy */}
    <div className="crd" onClick={function(){setTrainView(2);}}
      style={{marginTop:10,padding:"18px 14px",cursor:"pointer",borderColor:"rgba(255,255,255,.06)",animation:"fadeIn .4s ease-out",animationDelay:".18s",animationFillMode:"both"}}>
      <div style={{display:"flex",alignItems:"center",gap:14}}>
        <div style={{flexShrink:0}}><GIcon name={gridSections[2].icon} size={34} color="var(--cyan)"/></div>
        <div style={{flex:1}}>
          <div className="out" style={{fontWeight:700,fontSize:14,marginBottom:2}}>{gridSections[2].title}</div>
          <div style={{fontSize:11,color:"var(--t3)"}}>{gridSections[2].sub}</div>
        </div>
        <div style={{display:"flex",alignItems:"center",gap:6}}>
          <span style={{fontSize:10,color:"var(--cyan)",fontWeight:600}}>{gridSections[2].count}</span>
          <span style={{fontSize:14,color:"var(--cyan)"}}>{"\u2192"}</span>
        </div>
      </div>
    </div>
  </div>);
}

// ─── CARDS PAGE ───
function Cards(p){var isFree=!hasFullAccess(p.u, p.groupType);var visibleDomains=VOCAB;
var all=[];visibleDomains.forEach(function(d){d.cards.forEach(function(c){all.push(c);});});var dc=dueCards(p.u.cardStates,all);var mc=0;Object.keys(p.u.cardStates).forEach(function(k){if(p.u.cardStates[k].interval>=7)mc++;});
var[srsHelp,setSrsHelp]=useState(function(){return !localStorage.getItem("srsHelpSeen");});
function closeSrsHelp(){setSrsHelp(false);localStorage.setItem("srsHelpSeen","1");}
return(<div className="enter" style={{padding:"20px 16px 100px"}}>
{srsHelp&&<div style={{position:"fixed",inset:0,background:"rgba(0,0,0,.75)",zIndex:9999,display:"flex",alignItems:"center",justifyContent:"center",padding:20,animation:"fadeIn .2s"}} onClick={closeSrsHelp}>
<div style={{background:"linear-gradient(180deg,#1a1610,#0f0c08)",borderRadius:16,border:"1px solid rgba(180,140,80,.12)",padding:"28px 22px",maxWidth:380,width:"100%",animation:"fadeIn .3s ease-out",boxShadow:"0 12px 40px rgba(0,0,0,.5)"}} onClick={function(e){e.stopPropagation();}}>
<div style={{fontSize:32,textAlign:"center",marginBottom:12}}>{"🧠"}</div>
<h2 className="out" style={{fontWeight:800,fontSize:18,textAlign:"center",marginBottom:16,color:"#ede4d4"}}>How do Flashcards work?</h2>
<p style={{fontSize:13,color:"#b0a890",lineHeight:1.7,marginBottom:14}}>Flashcards use <b style={{color:"#ede4d4"}}>spaced repetition</b>: you rate yourself after seeing each answer, and the app schedules your next review accordingly.</p>
<div style={{display:"flex",flexDirection:"column",gap:8,marginBottom:16}}>
<div style={{display:"flex",alignItems:"center",gap:10,padding:"8px 12px",borderRadius:10,background:"rgba(255,71,87,.08)"}}>
<span style={{fontWeight:700,color:"#e05252",minWidth:52,fontSize:13}}>Again</span>
<span style={{fontSize:12,color:"#b0a890"}}>I had no idea — show me again soon</span></div>
<div style={{display:"flex",alignItems:"center",gap:10,padding:"8px 12px",borderRadius:10,background:"rgba(255,140,66,.08)"}}>
<span style={{fontWeight:700,color:"#c87a35",minWidth:52,fontSize:13}}>Hard</span>
<span style={{fontSize:12,color:"#b0a890"}}>I struggled but eventually remembered</span></div>
<div style={{display:"flex",alignItems:"center",gap:10,padding:"8px 12px",borderRadius:10,background:"rgba(0,230,118,.08)"}}>
<span style={{fontWeight:700,color:"#4abe60",minWidth:52,fontSize:13}}>Good</span>
<span style={{fontSize:12,color:"#b0a890"}}>I remembered after a moment of thought</span></div>
<div style={{display:"flex",alignItems:"center",gap:10,padding:"8px 12px",borderRadius:10,background:"rgba(212,148,58,.08)"}}>
<span style={{fontWeight:700,color:"#d4943a",minWidth:52,fontSize:13}}>Easy</span>
<span style={{fontSize:12,color:"#b0a890"}}>Instant recall — I know this one well</span></div></div>
<p style={{fontSize:12,color:"#8a7e6a",lineHeight:1.6,marginBottom:18}}>Be honest! Cards you mark "Again" come back sooner, while "Easy" cards are spaced further apart. The goal is long-term memorisation, not a high score.</p>
<button className="btn1" onClick={closeSrsHelp} style={{width:"100%"}}>Got it!</button>
</div></div>}
<div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:4}}><h1 className="out" style={{fontWeight:800,fontSize:24,marginBottom:0}}>Flashcards</h1>
<button onClick={function(){setSrsHelp(true);}} style={{background:"var(--bg3)",border:"1px solid var(--bdr)",borderRadius:"50%",width:30,height:30,display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer",color:"var(--t2)",fontSize:14,fontWeight:700}} title="How do flashcards work?">?</button></div>
<p style={{color:"var(--t2)",fontSize:13,marginBottom:20}}>Spaced repetition vocabulary</p>
<div className="crd glo" style={{marginBottom:20,padding:16}}>
<div style={{display:"flex",justifyContent:"space-between",marginBottom:12}}>
<div><div style={{fontSize:11,color:"var(--t2)",textTransform:"uppercase",letterSpacing:.5}}>Mastered</div><div className="out" style={{fontWeight:800,fontSize:22,color:"var(--green)"}}>{mc}/{all.length}</div></div>
<div style={{textAlign:"center"}}><div style={{fontSize:11,color:"var(--t2)",textTransform:"uppercase",letterSpacing:.5}}>Due today</div><div className="out" style={{fontWeight:800,fontSize:22,color:dc.length>0?"var(--orange)":"var(--green)"}}>{dc.length}</div></div>
<div style={{textAlign:"right"}}><div style={{fontSize:11,color:"var(--t2)",textTransform:"uppercase",letterSpacing:.5}}>Reviews</div><div className="out" style={{fontWeight:800,fontSize:22,color:"var(--cyan)"}}>{p.u.stats.cardsRev||0}</div></div></div>
<Bar value={mc} max={all.length} h={6} color="linear-gradient(90deg,#4abe60,#3a9a70)"/></div>
{dc.length>0&&<button className="btn1" onClick={function(){p.nav("csess");}} style={{marginBottom:20}}>Review {dc.length} cards</button>}
<h2 className="out" style={{fontWeight:700,fontSize:15,color:"var(--t2)",marginBottom:12}}>Vocabulary Domains</h2>
<div style={{display:"flex",flexDirection:"column",gap:10}}>{VOCAB.map(function(dom){var vl=isFree&&FREE_FLASHCARD_DOMAINS.indexOf(dom.id)===-1;var ms=0;dom.cards.forEach(function(c){var s=p.u.cardStates[c.id];if(s&&s.interval>=7)ms++;});
return(<div key={dom.id} className="crd" onClick={function(){if(vl){p.onPremium(dom.name+" Flashcards");return;}p.nav("cdom",dom.id);}} style={{display:"flex",alignItems:"center",gap:14,cursor:vl?"default":"pointer",padding:"14px 16px",opacity:vl?.55:1}}>
<div style={{width:42,height:42,borderRadius:12,background:vl?"var(--bg3)":dom.col+"22",display:"flex",alignItems:"center",justifyContent:"center",fontSize:22,flexShrink:0}}>{dom.icon}</div>
<div style={{flex:1,minWidth:0}}><div className="out" style={{fontWeight:600,fontSize:14}}>{dom.name}</div><div style={{fontSize:11,color:vl?"var(--gold)":"var(--t2)"}}>{vl?"Arena Premium":ms+"/"+dom.cards.length+" mastered"}</div></div>
{vl?<span style={{fontSize:14,color:"var(--gold)"}}>{"🔒"}</span>:<div style={{width:48}}><Bar value={ms} max={dom.cards.length} h={4} color={dom.col}/></div>}</div>);})}</div></div>);}

// ─── FLASHCARD SESSION ───
function CardSess(p){var all=[];if(p.domId){var dom=VOCAB.find(function(d){return d.id===p.domId;});if(dom)all=dom.cards;}else{VOCAB.forEach(function(d){d.cards.forEach(function(c){all.push(c);});});}
// Domain-specific = show ALL cards (study mode). Global = SRS due only.
var rev=useMemo(function(){return p.domId?shuffle(all):dueCards(p.u.cardStates,all);},[]);var[ci,sC]=useState(0);var[fl,sF]=useState(false);var[done,sD]=useState(false);var[ok,sO]=useState(0);var[tot,sT]=useState(0);
var lastSpoken=useRef(-1);var isDomainMode=!!p.domId;

if(rev.length===0||done){
  return(<div className="enter" style={{padding:"20px 16px",minHeight:"100vh",display:"flex",flexDirection:"column",justifyContent:"center",textAlign:"center"}}>
<div style={{fontSize:48,marginBottom:16}}>{done?"✨":"🎉"}</div>
<h2 className="out" style={{fontWeight:800,fontSize:24,marginBottom:8}}>{done?"Session Complete!":"All caught up!"}</h2>
{done&&<div>
  <p style={{color:"var(--t2)",marginBottom:8}}>{ok}/{tot} rated Good or Easy</p>
  <p style={{fontSize:12,color:"var(--t3)",marginTop:4}}>Flashcards help you memorize — test your knowledge in Word Tavern to earn XP!</p>
</div>}
{!done&&<p style={{color:"var(--t2)",fontSize:13}}>No cards due for review right now. Tap a specific domain to study anyway.</p>}
<button className="btn1" onClick={function(){if(done)p.done(0,ok,tot);else p.back();}} style={{marginTop:32}}>{done?"Done":"Back"}</button></div>);}

var card=rev[ci];function rate(r){sO(ok+(r>=3?1:0));sT(tot+1);p.rate(card.id,r);if(ci<rev.length-1){sC(ci+1);sF(false);}else sD(true);}

// Auto-pronounce word when new card appears
if(card&&!fl&&lastSpoken.current!==ci){lastSpoken.current=ci;setTimeout(function(){speak(card.w,0.85,"/audio/vocab/"+card.id+".mp3");},400);}

return(<div style={{padding:"20px 16px",minHeight:"100vh"}}>
<div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:20}}>
<button className="back-btn" onClick={p.back}>{"\u2190"} Back</button>
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
  <SpeakBtn text={card.w} size={36} audio={"/audio/vocab/"+card.id+".mp3"}/></div>
<div style={{fontSize:13,color:"var(--t3)"}}>Tap to reveal</div></div>
:<div><div style={{display:"flex",alignItems:"center",justifyContent:"center",gap:10,marginBottom:12}}>
  <div className="out" style={{fontWeight:700,fontSize:20,color:"var(--cyan)"}}>{card.w}</div>
  <SpeakBtn text={card.w} size={30} audio={"/audio/vocab/"+card.id+".mp3"}/></div>
<div style={{fontSize:16,lineHeight:1.6,marginBottom:16}}>{card.d}</div>
<div style={{fontSize:13,color:"var(--t2)",fontStyle:"italic",lineHeight:1.5,padding:"12px 16px",background:"var(--bg3)",borderRadius:10,position:"relative"}}>
  <div style={{display:"flex",alignItems:"flex-start",gap:8}}>
    <span style={{flex:1}}>"{card.e}"</span>
    <SpeakBtn text={card.e} size={28} rate={0.85} audio={"/audio/vocab/"+card.id+"_ex.mp3"}/>
  </div>
</div></div>}</div></div>
{fl&&<div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr 1fr",gap:8,marginTop:24,animation:"fadeIn .3s ease-out"}}>
{[{r:1,l:"Again",c:"var(--red)",b:"rgba(255,71,87,.12)"},{r:2,l:"Hard",c:"var(--orange)",b:"rgba(255,140,66,.12)"},{r:3,l:"Good",c:"var(--green)",b:"rgba(0,230,118,.12)"},{r:4,l:"Easy",c:"var(--cyan)",b:"rgba(var(--cx),.12)"}].map(function(b){
return(<button key={b.r} onClick={function(e){e.stopPropagation();rate(b.r);}} style={{padding:"12px 8px",background:b.b,border:"1px solid "+b.c+"33",borderRadius:12,cursor:"pointer",color:b.c,fontWeight:700,fontSize:13}} className="out">{b.l}</button>);})}</div>}</div>);}

// ─── DRILL SESSION ───
function Drill(p){var qs=useMemo(function(){return shuffle(QUESTIONS).slice(0,10);},[]);var[ci,sC]=useState(0);var[sel,sS]=useState(-1);var[sc,sSc]=useState(0);var[ph,sP]=useState("q");var[sk,sSk]=useState(false);
function doAns(i){sS(i);if(i===qs[ci].c){sSc(sc+1);try{playCorrect();}catch(e){}}else{try{playWrong();}catch(e){}sSk(true);setTimeout(function(){sSk(false);},500);}sP("fb");}
function nxt(){if(ci<qs.length-1){sC(ci+1);sS(-1);sP("q");}else{sP("done");p.done(sc,qs.length,20+sc*7);}}

if(ph==="done"){var fx=20+sc*7;if(p.gate)fx=p.gate(fx,sc,qs.length);return(<div className="enter" style={{padding:"20px 16px",minHeight:"100vh",display:"flex",flexDirection:"column",justifyContent:"center",textAlign:"center"}}>
<div style={{fontSize:48,marginBottom:16,animation:"countUp .6s"}}>{sc>=8?"🏆":sc>=5?"⚔️":"🛡️"}</div><h1 className="out" style={{fontWeight:900,fontSize:28,marginBottom:8}}>Drill Complete</h1>
<div className="out" style={{fontSize:44,fontWeight:900,color:sc>=8?"var(--green)":sc>=5?"var(--cyan)":"var(--orange)",marginBottom:4,animation:"countUp .8s"}}>{sc}/{qs.length}</div>
<div className="out" style={{fontSize:20,fontWeight:800,color:"var(--gold)",marginBottom:32}}>+{fx} XP</div><button className="btn1" onClick={p.back}>Back to Training</button></div>);}

var q=qs[ci];return(<div className={sk?"sk":""} style={{padding:"20px 16px",minHeight:"100vh"}}>
<div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:20}}>
<button className="back-btn" onClick={p.back}>{"\u2190"} Back</button>
<span className="out" style={{fontSize:13,color:"var(--t2)",fontWeight:600}}>{ci+1}/{qs.length}</span></div>
<Bar value={ci} max={qs.length} h={4}/>
<span className="out" style={{fontSize:11,fontWeight:600,color:"var(--purple)",textTransform:"uppercase",letterSpacing:1,marginTop:8,display:"block"}}>{q.cat}</span>
<h2 className="out" style={{fontWeight:700,fontSize:19,lineHeight:1.5,marginBottom:24,marginTop:8}}>{q.s}</h2>
<div style={{display:"flex",flexDirection:"column",gap:10}}>{q.o.map(function(opt,i){var iS=sel===i,iC=i===q.c,sr=ph==="fb",bg="var(--bg2)",bd="var(--bdr)";
if(sr&&iC){bg="rgba(0,230,118,.12)";bd="var(--green)";}else if(sr&&iS&&!iC){bg="rgba(255,71,87,.12)";bd="var(--red)";}
return(<button key={i} onClick={function(){if(ph==="q")doAns(i);}} disabled={ph==="fb"} style={{display:"flex",alignItems:"center",gap:12,padding:"14px 16px",background:bg,border:"1px solid "+bd,borderRadius:12,cursor:ph==="q"?"pointer":"default",fontSize:15,color:"var(--t1)",textAlign:"left",fontFamily:"'DM Sans',sans-serif"}}>
<div style={{width:28,height:28,borderRadius:"50%",border:"2px solid "+(sr&&iC?"var(--green)":sr&&iS?"var(--red)":"var(--t3)"),display:"flex",alignItems:"center",justifyContent:"center",fontSize:12,fontWeight:700,flexShrink:0,background:sr&&iC?"var(--green)":sr&&iS&&!iC?"var(--red)":"transparent",color:sr&&(iC||iS)?"#fff":"var(--t3)"}}>
{sr&&iC?"✓":sr&&iS?"✗":String.fromCharCode(65+i)}</div><span>{opt}</span></button>);})}</div>
{ph==="fb"&&<div style={{marginTop:20,animation:"fadeIn .3s"}}><div className="crd" style={{background:"rgba(var(--cx),.06)",borderColor:"rgba(var(--cx),.15)",padding:16}}><p style={{fontSize:13,color:"var(--t2)",lineHeight:1.6}}>{q.x}</p></div>
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

  if(ph==="done"){var xp=15+sc*5;if(p.gate)xp=p.gate(xp,sc,items.length);return(<div className="enter" style={{padding:"20px 16px",minHeight:"100vh",display:"flex",flexDirection:"column",justifyContent:"center",textAlign:"center"}}>
    <div style={{fontSize:48,marginBottom:16,animation:"countUp .6s"}}>{sc>=12?"🏆":sc>=8?"⚔️":"🛡️"}</div>
    <h1 className="out" style={{fontWeight:900,fontSize:28,marginBottom:8}}>Classifier Complete</h1>
    <div className="out" style={{fontSize:44,fontWeight:900,color:sc>=12?"var(--green)":sc>=8?"var(--cyan)":"var(--orange)",marginBottom:4,animation:"countUp .8s"}}>{sc}/{items.length}</div>
    <div className="out" style={{fontSize:20,fontWeight:800,color:"var(--gold)",marginBottom:32}}>+{xp} XP</div>
    <button className="btn1" onClick={p.back}>Back to Training</button></div>);}

  var it=items[ci];var fam=it.family;var isMulti=it.validAnswers.length>1;
  return(<div className={sk?"sk":""} style={{padding:"20px 16px",minHeight:"100vh"}}>
    <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:20}}>
      <button className="back-btn" onClick={p.back}>{"\u2190"} Back</button>
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
      <div className="crd" style={{background:"rgba(var(--cx),.06)",borderColor:"rgba(var(--cx),.15)",padding:16}}>
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
  var[ci,sC]=useState(0);var[sc,sSc]=useState(0);var[ph,sP]=useState("intro");var[pick,sPk]=useState(null);var[sk,sSk]=useState(false);
  var[openGrim,setOpenGrim]=useState(false);

  function doAns(rule){sPk(rule);if(rule===items[ci].rule){sSc(sc+1);try{playCorrect();}catch(e){}}else{try{playWrong();}catch(e){}sSk(true);setTimeout(function(){sSk(false);},400);}sP("fb");}
  function nxt(){if(ci<items.length-1){sC(ci+1);sPk(null);sP("q");}else{sP("done");p.done(sc,items.length,15+sc*5);}}

  if(ph==="intro")return(<div className="enter" style={{padding:"20px 16px",minHeight:"100vh",display:"flex",flexDirection:"column",justifyContent:"center",textAlign:"center",position:"relative"}}>
    <button className="back-btn" onClick={p.back} style={{position:"absolute",top:16,left:16,marginBottom:0}}>{"\u2190"} Back</button>
    <div style={{marginBottom:16,display:"flex",justifyContent:"center"}}><GIcon name="knot" size={60} color="var(--cyan)"/></div>
    <h1 className="out" style={{fontWeight:900,fontSize:26,marginBottom:8}}>Connectors Sorting</h1>
    <p style={{color:"var(--t2)",fontSize:13,marginBottom:8,lineHeight:1.6,maxWidth:360,marginLeft:"auto",marginRight:"auto"}}>For each connector, pick the structure that must follow it: clause, noun/-ing, or new sentence.</p>
    <p style={{color:"var(--gold)",fontWeight:600,fontSize:14,marginBottom:32}}>12 items · 3 categories</p>
    <button className="btn1" onClick={function(){sP("q");}} style={{marginBottom:12}}>Start Sorting</button>
    <button className="btn2" onClick={function(){setOpenGrim(true);}} style={{width:"100%",display:"flex",alignItems:"center",justifyContent:"center",gap:8}}><GIcon name="bookmarklet" size={18} color="currentColor"/>Grimoire</button>
    {openGrim&&<GrimoireReader grimoire={GRIMOIRE_CONNECTORS} back={function(){setOpenGrim(false);}}/>}
  </div>);

  if(ph==="done"){var xp=15+sc*5;if(p.gate)xp=p.gate(xp,sc,items.length);return(<div className="enter" style={{padding:"20px 16px",minHeight:"100vh",display:"flex",flexDirection:"column",justifyContent:"center",textAlign:"center"}}>
    <div style={{fontSize:48,marginBottom:16,animation:"countUp .6s"}}>{sc>=10?"🏆":sc>=7?"⚔️":"🛡️"}</div>
    <h1 className="out" style={{fontWeight:900,fontSize:28,marginBottom:8}}>Sorting Complete</h1>
    <div className="out" style={{fontSize:44,fontWeight:900,color:sc>=10?"var(--green)":sc>=7?"var(--cyan)":"var(--orange)",marginBottom:4,animation:"countUp .8s"}}>{sc}/{items.length}</div>
    <div className="out" style={{fontSize:20,fontWeight:800,color:"var(--gold)",marginBottom:32}}>+{xp} XP</div>
    <button className="btn1" onClick={p.back}>Back to Training</button></div>);}

  var it=items[ci];
  return(<div className={sk?"sk":""} style={{padding:"20px 16px",minHeight:"100vh"}}>
    <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:20}}>
      <button className="back-btn" onClick={p.back}>{"\u2190"} Back</button>
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
      <div className="crd" style={{background:"rgba(var(--cx),.06)",borderColor:"rgba(var(--cx),.15)",padding:16}}>
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

  if(ph==="menu")return(<div className="enter" style={{padding:"20px 16px",minHeight:"100vh",display:"flex",flexDirection:"column",justifyContent:"center",textAlign:"center",position:"relative"}}>
    <button className="back-btn" onClick={p.back} style={{position:"absolute",top:16,left:16,marginBottom:0}}>{"\u2190"} Back</button>
    <div style={{marginBottom:16,display:"flex",justifyContent:"center"}}><GIcon name="linked-rings" size={54} color="var(--cyan)"/></div>
    <h1 className="out" style={{fontWeight:900,fontSize:26,marginBottom:8}}>Preposition Collocations</h1>
    <p style={{color:"var(--t2)",fontSize:13,marginBottom:32,lineHeight:1.5}}>Master the prepositions that go with common business words</p>
    <button className="btn1" onClick={function(){sP("q");}} style={{marginBottom:12}}>Start Drill (12 Qs)</button>
    <button className="btn2" onClick={function(){sP("study");}} style={{width:"100%",display:"flex",alignItems:"center",justifyContent:"center",gap:8}}><GIcon name="bookmarklet" size={18} color="currentColor"/>Study Mode</button></div>);

  if(ph==="study")return(<div className="enter" style={{padding:"20px 16px 100px"}}>
    <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:20}}>
      <button className="back-btn" onClick={function(){sP("menu");}}>{"\u2190"} Back</button>
      <span className="out" style={{fontWeight:700,fontSize:15}}>Study Mode</span>
      <div style={{width:40}}/></div>
    <p style={{color:"var(--t2)",fontSize:13,marginBottom:20,lineHeight:1.5}}>Collocations grouped by preposition. Tap a group to expand.</p>
    <div style={{display:"flex",flexDirection:"column",gap:12}}>
      {groups.map(function(g){
        return(<StudyGroup key={g.prep} prep={g.prep} items={g.items} hint={prepLabels[g.prep]||""}/>);
      })}
    </div>
    <button className="btn1" onClick={function(){sP("q");}} style={{marginTop:24}}>Ready! Start Drill</button></div>);

  if(ph==="done"){var xp=15+sc*5;if(p.gate)xp=p.gate(xp,sc,items.length);return(<div className="enter" style={{padding:"20px 16px",minHeight:"100vh",display:"flex",flexDirection:"column",justifyContent:"center",textAlign:"center"}}>
    <div style={{fontSize:48,marginBottom:16,animation:"countUp .6s"}}>{sc>=10?"🏆":sc>=7?"⚔️":"🛡️"}</div>
    <h1 className="out" style={{fontWeight:900,fontSize:28,marginBottom:8}}>Prep Drill Complete</h1>
    <div className="out" style={{fontSize:44,fontWeight:900,color:sc>=10?"var(--green)":sc>=7?"var(--cyan)":"var(--orange)",marginBottom:4,animation:"countUp .8s"}}>{sc}/{items.length}</div>
    <div className="out" style={{fontSize:20,fontWeight:800,color:"var(--gold)",marginBottom:32}}>+{xp} XP</div>
    <button className="btn1" onClick={p.back}>Back to Training</button></div>);}

  var it=items[ci];
  return(<div className={sk?"sk":""} style={{padding:"20px 16px",minHeight:"100vh"}}>
    <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:20}}>
      <button className="back-btn" onClick={p.back}>{"\u2190"} Back</button>
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
      <div className="crd" style={{background:"rgba(var(--cx),.06)",borderColor:"rgba(var(--cx),.15)",padding:16}}>
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
// Study Mode has been replaced by the Gerund Grimoire (see data/gerundGrimoire.js).
// Same pattern as the Gauntlet grimoires — same reader, same look.
function GerInf(p){
  var[mode,setMode]=useState("hub"); // hub | quiz
  var[ci,sC]=useState(0);var[sc,sSc]=useState(0);var[ph,sP]=useState("q");var[pick,sPk]=useState(-1);var[sk,sSk]=useState(false);
  var[openGrim,setOpenGrim]=useState(false);

  // Quiz items — context sentences, shuffled
  var quizItems=useMemo(function(){return shuffle(GERUND_INF.slice());},[]);

  function resetQuiz(){sC(0);sSc(0);sPk(-1);sP("q");}

  // ═══ HUB ═══
  if(mode==="hub")return(<div className="enter" style={{padding:"20px 16px 100px"}}>
    <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16}}>
      <button className="back-btn" onClick={p.back}>{"\u2190"} Back</button>
      <span className="out" style={{fontWeight:700,fontSize:15}}>Gerund vs Infinitive</span>
      <div style={{width:40}}/>
    </div>
    <div style={{textAlign:"center",marginBottom:24}}>
      <div style={{marginBottom:8,display:"flex",justifyContent:"center"}}><GIcon name="scales" size={54} color="var(--cyan)"/></div>
      <p style={{color:"var(--t2)",fontSize:13,lineHeight:1.6}}>{GERUND_INF.length} verbs · 4 patterns to master</p>
    </div>
    <div style={{display:"flex",flexDirection:"column",gap:10}}>
      <div className="crd" onClick={function(){setOpenGrim(true);}} style={{cursor:"pointer",display:"flex",alignItems:"center",gap:14,padding:"16px"}}>
        <div style={{width:48,height:48,borderRadius:14,background:"transparent",border:"1.5px solid var(--cyan)",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}><GIcon name="bookmarklet" size={28} color="var(--cyan)"/></div>
        <div style={{flex:1}}><div className="out" style={{fontWeight:700,fontSize:15}}>Grimoire</div>
          <div style={{fontSize:11,color:"var(--t3)"}}>Learn WHY before you guess</div></div>
        <span style={{fontSize:16,color:"var(--cyan)"}}>{"→"}</span></div>
      <div className="crd" onClick={function(){resetQuiz();setMode("quiz");}} style={{cursor:"pointer",display:"flex",alignItems:"center",gap:14,padding:"16px"}}>
        <div style={{width:48,height:48,borderRadius:14,background:"transparent",border:"1.5px solid var(--cyan)",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}><GIcon name="quill-ink" size={28} color="var(--cyan)"/></div>
        <div style={{flex:1}}><div className="out" style={{fontWeight:700,fontSize:15}}>Context Quiz</div>
          <div style={{fontSize:11,color:"var(--t3)"}}>TOEIC-style sentences — no more guessing</div></div>
        <span style={{fontSize:16,color:"var(--cyan)"}}>{"→"}</span></div>
    </div>
    {openGrim&&<GrimoireReader grimoire={GRIMOIRE_GERUND} back={function(){setOpenGrim(false);}}/>}
  </div>);

  // ═══ CONTEXT QUIZ ═══
  if(mode==="quiz"){
    var q=quizItems[ci];

    if(ph==="done"){var xp=20+sc*4;if(p.gate)xp=p.gate(xp,sc,quizItems.length);return(<div className="enter" style={{padding:"20px 16px",minHeight:"100vh",display:"flex",flexDirection:"column",justifyContent:"center",textAlign:"center"}}>
      <div style={{fontSize:48,marginBottom:16,animation:"countUp .6s"}}>{sc>=25?"🏆":sc>=18?"⚔️":"🛡️"}</div>
      <h1 className="out" style={{fontWeight:900,fontSize:28,marginBottom:8}}>Quiz Complete</h1>
      <div className="out" style={{fontSize:44,fontWeight:900,color:sc>=25?"var(--green)":sc>=18?"var(--cyan)":"var(--orange)",marginBottom:4}}>{sc}/{quizItems.length}</div>
      <div className="out" style={{fontSize:20,fontWeight:800,color:"var(--gold)",marginBottom:32}}>+{xp} XP</div>
      <button className="btn1" onClick={function(){resetQuiz();sP("q");}}>Play Again</button>
      <button className="btn2" onClick={function(){setMode("hub");setOpenGrim(true);}} style={{marginTop:10,width:"100%",display:"flex",alignItems:"center",justifyContent:"center",gap:8}}><GIcon name="bookmarklet" size={18} color="currentColor"/>Open Grimoire</button>
      <button className="btn2" onClick={function(){setMode("hub");}} style={{marginTop:10,width:"100%"}}>Back</button>
    </div>);}

    return(<div className={sk?"sk":""} style={{padding:"20px 16px",minHeight:"100vh"}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12}}>
        <button className="back-btn" onClick={function(){setMode("hub");}}>{"\u2190"} Back</button>
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
        <div className="crd" style={{padding:14,background:"rgba(var(--cx),.06)",borderColor:"rgba(var(--cx),.15)"}}>
          <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:6,flexWrap:"wrap"}}>
            <span className="out" style={{fontWeight:700,fontSize:15,color:"var(--cyan)"}}>{q.verb}</span>
            <span style={{fontSize:11,fontWeight:600,padding:"2px 8px",borderRadius:99,
              background:q.pattern==="ing"?"rgba(255,140,66,.1)":q.pattern==="to"?"rgba(var(--cx),.1)":q.pattern==="both"?"rgba(255,71,87,.1)":"rgba(27,112,207,.1)",
              color:q.pattern==="ing"?"var(--orange)":q.pattern==="to"?"var(--cyan)":q.pattern==="both"?"var(--red)":"var(--purple)"}}>{q.pattern==="ing"?"always -ING":q.pattern==="to"?"always TO":q.pattern==="both"?"depends on meaning":"preposition → -ING"}</span>
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

  if(ph==="done"){var xp=25+sc*6;if(p.gate)xp=p.gate(xp,sc,quizItems.length);return(<div className="enter" style={{padding:"20px 16px",minHeight:"100vh",display:"flex",flexDirection:"column",justifyContent:"center",textAlign:"center"}}>
    <div style={{fontSize:48,marginBottom:16,animation:"countUp .6s"}}>{sc>=8?"🏆":sc>=5?"⚔️":"🛡️"}</div>
    <h1 className="out" style={{fontWeight:900,fontSize:28,marginBottom:8}}>Traps Mastered!</h1>
    <div className="out" style={{fontSize:44,fontWeight:900,color:sc>=8?"var(--green)":sc>=5?"var(--cyan)":"var(--orange)",marginBottom:4,animation:"countUp .8s"}}>{sc}/{traps.length}</div>
    <div className="out" style={{fontSize:20,fontWeight:800,color:"var(--gold)",marginBottom:32}}>+{xp} XP</div>
    <button className="btn1" onClick={p.back}>Back to Training</button></div>);}

  var t=traps[ci];
  return(<div className={sk?"sk":""} style={{padding:"20px 16px",minHeight:"100vh"}}>
    <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:20}}>
      <button className="back-btn" onClick={p.back}>{"\u2190"} Back</button>
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
      <div className="crd" style={{background:"rgba(var(--cx),.06)",borderColor:"rgba(var(--cx),.15)",padding:16}}>
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
      <button className="back-btn" onClick={p.back}>{"\u2190"} Back</button>
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
            <div style={{padding:"10px 14px",background:"rgba(var(--cx),.06)",border:"1px solid rgba(var(--cx),.12)",borderRadius:10,marginBottom:12}}>
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


// ─── PHRASAL VERB DOJO (2 modes + Grimoire) ───
// Study Mode has been replaced by the Phrasal Grimoire (data/phrasalGrimoire.js).
function PhrasalDojo(p){
  var[mode,setMode]=useState("hub");
  var[ci,sC]=useState(0);var[sc,sSc]=useState(0);var[pick,sPk]=useState(-1);var[ph,sP]=useState("q");
  var[timer,setTimer]=useState(0);var[streak,setStreak]=useState(0);var[bestStreak,setBest]=useState(0);
  var[openGrim,setOpenGrim]=useState(false);
  var timerRef=useRef(null);

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
      <button className="back-btn" onClick={p.back}>{"\u2190"} Back</button>
      <span className="out" style={{fontWeight:700,fontSize:15}}>Phrasal Verb Dojo</span>
      <div style={{width:40}}/>
    </div>
    <div style={{textAlign:"center",marginBottom:24}}>
      <div style={{marginBottom:8,display:"flex",justifyContent:"center"}}><GIcon name="shuriken" size={54} color="var(--cyan)"/></div>
      <p style={{color:"var(--t2)",fontSize:13,lineHeight:1.6}}>{PHRASAL_VERBS.length} essential business phrasal verbs<br/>3 training modes</p>
    </div>
    <div style={{display:"flex",flexDirection:"column",gap:10}}>
      <div className="crd" onClick={function(){setOpenGrim(true);}} style={{cursor:"pointer",display:"flex",alignItems:"center",gap:14,padding:"16px"}}>
        <div style={{width:48,height:48,borderRadius:14,background:"transparent",border:"1.5px solid var(--cyan)",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}><GIcon name="bookmarklet" size={28} color="var(--cyan)"/></div>
        <div style={{flex:1}}><div className="out" style={{fontWeight:700,fontSize:15}}>Grimoire</div>
          <div style={{fontSize:11,color:"var(--t3)"}}>Particles, separables, top 20 business</div></div>
        <span style={{fontSize:16,color:"var(--cyan)"}}>{"→"}</span></div>
      <div className="crd" onClick={function(){resetQuiz();setMode("match");}} style={{cursor:"pointer",display:"flex",alignItems:"center",gap:14,padding:"16px"}}>
        <div style={{width:48,height:48,borderRadius:14,background:"transparent",border:"1.5px solid var(--cyan)",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}><GIcon name="puzzle" size={28} color="var(--cyan)"/></div>
        <div style={{flex:1}}><div className="out" style={{fontWeight:700,fontSize:15}}>Meaning Match</div>
          <div style={{fontSize:11,color:"var(--t3)"}}>Phrasal verb → pick the definition</div></div>
        <span style={{fontSize:16,color:"var(--cyan)"}}>{"→"}</span></div>
      <div className="crd" onClick={function(){resetQuiz();setMode("picker");}} style={{cursor:"pointer",display:"flex",alignItems:"center",gap:14,padding:"16px"}}>
        <div style={{width:48,height:48,borderRadius:14,background:"transparent",border:"1.5px solid var(--cyan)",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}><GIcon name="lightning-bow" size={28} color="var(--cyan)"/></div>
        <div style={{flex:1}}><div className="out" style={{fontWeight:700,fontSize:15}}>Particle Picker</div>
          <div style={{fontSize:11,color:"var(--t3)"}}>Speed round — 8s per question!</div></div>
        <span style={{fontSize:16,color:"var(--cyan)"}}>{"→"}</span></div>
    </div>
    {openGrim&&<GrimoireReader grimoire={GRIMOIRE_PHRASAL} back={function(){setOpenGrim(false);}}/>}
  </div>);

  // ═══ MEANING MATCH ═══
  if(mode==="match"){
    var mq=matchQs[ci];var mOpts=matchAllOpts[ci];

    if(ph==="done"){var mxp=20+sc*4;if(p.gate)mxp=p.gate(mxp,sc,matchQs.length);return(<div className="enter" style={{padding:"20px 16px",minHeight:"100vh",display:"flex",flexDirection:"column",justifyContent:"center",textAlign:"center"}}>
      <div style={{fontSize:48,marginBottom:16,animation:"countUp .6s"}}>{sc>=12?"🏆":sc>=8?"⚔️":"🛡️"}</div>
      <h1 className="out" style={{fontWeight:900,fontSize:28,marginBottom:8}}>Meaning Match</h1>
      <div className="out" style={{fontSize:44,fontWeight:900,color:sc>=12?"var(--green)":sc>=8?"var(--cyan)":"var(--orange)",marginBottom:4}}>{sc}/{matchQs.length}</div>
      <div className="out" style={{fontSize:20,fontWeight:800,color:"var(--gold)",marginBottom:32}}>+{mxp} XP</div>
      <button className="btn1" onClick={function(){resetQuiz();sP("q");}}>Play Again</button>
      <button className="btn2" onClick={function(){setMode("hub");}} style={{marginTop:10,width:"100%"}}>Back to Dojo</button>
    </div>);}

    return(<div style={{padding:"20px 16px",minHeight:"100vh"}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12}}>
        <button className="back-btn" onClick={function(){setMode("hub");}}>{"\u2190"} Back</button>
        {streak>=2&&<span className="out" style={{fontSize:12,fontWeight:700,color:"var(--gold)",animation:"pulse .6s infinite"}}>{"🔥"} x{streak}</span>}
        <span className="out" style={{fontSize:13,color:"var(--t2)",fontWeight:600}}>{ci+1}/{matchQs.length}</span></div>
      <Bar value={ci} max={matchQs.length} h={4} color="linear-gradient(90deg,#22c55e,#06b6d4)"/>
      <div style={{textAlign:"center",marginTop:24,marginBottom:24}}>
        <span className="out" style={{fontSize:11,color:"var(--purple)",fontWeight:700,textTransform:"uppercase",letterSpacing:1,display:"block",marginBottom:8}}>What does this mean?</span>
        <div style={{display:"flex",alignItems:"center",justifyContent:"center",gap:10}}>
          <span className="out" style={{fontSize:28,fontWeight:900,color:"var(--cyan)"}}>{mq.pv}</span>
          <SpeakBtn text={mq.pv} size={32} audio={"/audio/phrasal/"+mq.pv.replace(/\s+/g,"_")+".mp3"}/>
        </div>
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
        <div className="crd" style={{padding:14,background:"rgba(var(--cx),.06)",borderColor:"rgba(var(--cx),.15)"}}>
          <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:6,flexWrap:"wrap"}}>
            <span className="out" style={{fontWeight:700,fontSize:14,color:"var(--cyan)"}}>{mq.pv}</span>
            <SpeakBtn text={mq.pv} size={22} audio={"/audio/phrasal/"+mq.pv.replace(/\s+/g,"_")+".mp3"}/>
            <span style={{fontSize:11,color:"var(--purple)",fontWeight:600,padding:"2px 8px",background:"rgba(27,112,207,.1)",borderRadius:99}}>{mq.fr}</span>
          </div>
          <div style={{display:"flex",alignItems:"center",gap:6}}>
            <p style={{fontSize:12,color:"var(--t3)",fontStyle:"italic",lineHeight:1.5,flex:1}}>"{mq.ex}"</p>
            <SpeakBtn text={mq.ex} size={20} rate={0.85} audio={"/audio/phrasal/"+mq.pv.replace(/\s+/g,"_")+"_ex.mp3"}/>
          </div>
        </div>
        <button className="btn1" onClick={function(){sPk(-1);if(ci<matchQs.length-1){sC(ci+1);sP("q");}else{sP("done");p.done(sc,matchQs.length,20+sc*4);}}} style={{marginTop:12}}>{ci<matchQs.length-1?"Next":"See Results"}</button>
      </div>}
    </div>);
  }

  // ═══ PARTICLE PICKER ═══
  if(mode==="picker"){
    var pq=pickerQs[ci];var pOpts=pickerAllOpts[ci];

    if(ph==="done"){var pxp=25+sc*5;if(p.gate)pxp=p.gate(pxp,sc,pickerQs.length);return(<div className="enter" style={{padding:"20px 16px",minHeight:"100vh",display:"flex",flexDirection:"column",justifyContent:"center",textAlign:"center"}}>
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
        <button className="back-btn" onClick={function(){clearInterval(timerRef.current);setMode("hub");}}>{"\u2190"} Back</button>
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
        <div className="crd" style={{padding:14,background:"rgba(var(--cx),.06)",borderColor:"rgba(var(--cx),.15)"}}>
          <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:6,flexWrap:"wrap"}}>
            <span className="out" style={{fontWeight:700,fontSize:15,color:"var(--cyan)"}}>{pq.pv}</span>
            <SpeakBtn text={pq.pv} size={22} audio={"/audio/phrasal/"+pq.pv.replace(/\s+/g,"_")+".mp3"}/>
            <span style={{fontSize:11,color:"var(--purple)",fontWeight:600,padding:"2px 8px",background:"rgba(27,112,207,.1)",borderRadius:99}}>{pq.fr}</span>
          </div>
          <div style={{display:"flex",alignItems:"center",gap:6}}>
            <p style={{fontSize:12,color:"var(--t3)",fontStyle:"italic",flex:1}}>"{pq.ex}"</p>
            <SpeakBtn text={pq.ex} size={20} rate={0.85} audio={"/audio/phrasal/"+pq.pv.replace(/\s+/g,"_")+"_ex.mp3"}/>
          </div>
        </div>
        <button className="btn1" onClick={function(){sPk(-1);if(ci<pickerQs.length-1){sC(ci+1);sP("q");}else{sP("done");p.done(sc,pickerQs.length,25+sc*5);}}} style={{marginTop:12}}>{ci<pickerQs.length-1?"Next":"See Results"}</button>
      </div>}
    </div>);
  }

  return null;
}

// ─── STRATEGY CARDS (enriched) ───
// ─── ABOUT TOEIC (info page for newcomers) ───
function AboutToeic(p){
  var cefrBands=[
    {band:"120-220",cefr:"A1",label:"Basic user",col:"#888"},
    {band:"225-545",cefr:"A2",label:"Elementary",col:"#c87a35"},
    {band:"550-780",cefr:"B1",label:"Intermediate",col:"#d4943a"},
    {band:"785-940",cefr:"B2",label:"Upper-intermediate \u2014 common pro target",col:"#4abe60"},
    {band:"945-990",cefr:"C1",label:"Advanced",col:"#f0c850"},
  ];
  return(<div className="enter" style={{padding:"20px 16px 100px"}}>
    <button className="back-btn" onClick={p.back}>{"\u2190"} Back</button>

    <div style={{textAlign:"center",marginBottom:24}}>
      <div style={{fontSize:56,marginBottom:8}}>{"\uD83C\uDF93"}</div>
      <h1 className="out" style={{fontWeight:800,fontSize:24,marginBottom:4}}>What is the TOEIC?</h1>
      <p style={{color:"var(--t2)",fontSize:13}}>A quick guide to the exam you're training for</p>
    </div>

    {/* What & Who */}
    <div className="crd" style={{marginBottom:14,padding:18}}>
      <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:10}}>
        <span style={{fontSize:26}}>{"\uD83D\uDCDC"}</span>
        <h3 className="out" style={{fontWeight:700,fontSize:16,margin:0}}>The exam</h3>
      </div>
      <p style={{fontSize:13,color:"var(--t1)",lineHeight:1.6,marginBottom:8}}>
        <strong>TOEIC</strong> stands for <em>Test of English for International Communication</em>. Published by <strong>ETS</strong>, it measures your ability to use English in professional and everyday contexts.
      </p>
      <p style={{fontSize:12,color:"var(--t2)",lineHeight:1.5}}>
        It is the most widely recognized English certification in France for universities, recruiters and career moves {"\u2014"} over 7 million tests are taken worldwide each year.
      </p>
    </div>

    {/* Structure */}
    <h3 className="out" style={{fontWeight:700,fontSize:12,color:"var(--t2)",marginBottom:10,marginTop:20,textTransform:"uppercase",letterSpacing:1.5}}>Exam structure</h3>
    <div className="crd" style={{marginBottom:10,padding:16,background:"linear-gradient(135deg,rgba(34,197,94,.06),rgba(245,158,11,.06))",borderColor:"rgba(34,197,94,.18)"}}>
      <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:10}}>
        <span style={{fontSize:26}}>{"\uD83D\uDC42"}</span>
        <div>
          <div className="out" style={{fontWeight:800,fontSize:15,color:"var(--green)"}}>Listening</div>
          <div style={{fontSize:11,color:"var(--t3)"}}>45 minutes {"\u00B7"} 100 questions {"\u00B7"} Score 5-495</div>
        </div>
      </div>
      <div style={{fontSize:12,color:"var(--t2)",lineHeight:1.7,paddingLeft:2}}>
        <div>{"\u00B7"} <strong>Part 1</strong> {"\u2014"} Photographs (6 Q)</div>
        <div>{"\u00B7"} <strong>Part 2</strong> {"\u2014"} Question-Response (25 Q)</div>
        <div>{"\u00B7"} <strong>Part 3</strong> {"\u2014"} Conversations (39 Q)</div>
        <div>{"\u00B7"} <strong>Part 4</strong> {"\u2014"} Short talks (30 Q)</div>
      </div>
    </div>
    <div className="crd" style={{marginBottom:10,padding:16,background:"linear-gradient(135deg,rgba(90,122,154,.08),rgba(122,90,128,.08))",borderColor:"rgba(127,164,212,.25)"}}>
      <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:10}}>
        <span style={{fontSize:26}}>{"\uD83D\uDCD6"}</span>
        <div>
          <div className="out" style={{fontWeight:800,fontSize:15,color:"#7fa4d4"}}>Reading</div>
          <div style={{fontSize:11,color:"var(--t3)"}}>75 minutes {"\u00B7"} 100 questions {"\u00B7"} Score 5-495</div>
        </div>
      </div>
      <div style={{fontSize:12,color:"var(--t2)",lineHeight:1.7,paddingLeft:2}}>
        <div>{"\u00B7"} <strong>Part 5</strong> {"\u2014"} Incomplete Sentences (30 Q)</div>
        <div>{"\u00B7"} <strong>Part 6</strong> {"\u2014"} Text Completion (16 Q)</div>
        <div>{"\u00B7"} <strong>Part 7</strong> {"\u2014"} Reading Passages (54 Q)</div>
      </div>
    </div>
    <div style={{fontSize:11,color:"var(--t3)",textAlign:"center",marginBottom:18,fontStyle:"italic"}}>
      Total: 200 multiple-choice questions {"\u00B7"} 2 hours {"\u00B7"} Final score 10\u2013990
    </div>

    {/* CEFR Scoring */}
    <div className="crd" style={{marginBottom:14,padding:18}}>
      <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:12}}>
        <span style={{fontSize:26}}>{"\uD83C\uDFAF"}</span>
        <h3 className="out" style={{fontWeight:700,fontSize:16,margin:0}}>What your score means</h3>
      </div>
      <div style={{display:"flex",flexDirection:"column",gap:6}}>
        {cefrBands.map(function(r,i){return(<div key={i} style={{display:"flex",alignItems:"center",gap:10,padding:"8px 10px",background:"var(--bg3)",borderRadius:8}}>
          <div className="out" style={{fontWeight:800,fontSize:12,color:r.col,minWidth:62}}>{r.band}</div>
          <div className="out" style={{fontWeight:700,fontSize:11,color:r.col,minWidth:22,padding:"2px 6px",background:"rgba(255,255,255,.04)",borderRadius:4,textAlign:"center"}}>{r.cefr}</div>
          <div style={{fontSize:11,color:"var(--t2)",flex:1,minWidth:0}}>{r.label}</div>
        </div>);})}
      </div>
      <p style={{fontSize:11,color:"var(--t3)",lineHeight:1.5,marginTop:12,fontStyle:"italic"}}>
        Most French business schools target <strong style={{color:"var(--green)"}}>B2 (785+)</strong>. Many companies list "TOEIC 750" as a hiring bar.
      </p>
    </div>

    {/* Why & Validity */}
    <div className="crd" style={{marginBottom:14,padding:18}}>
      <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:12}}>
        <span style={{fontSize:26}}>{"\uD83C\uDF0D"}</span>
        <h3 className="out" style={{fontWeight:700,fontSize:16,margin:0}}>Why people take it</h3>
      </div>
      <div style={{fontSize:12,color:"var(--t2)",lineHeight:1.8}}>
        <div><span style={{fontSize:15}}>{"\uD83C\uDF93"}</span> <strong>Universities</strong> {"\u2014"} graduation requirement in many French business schools and engineering curricula</div>
        <div><span style={{fontSize:15}}>{"\uD83D\uDCBC"}</span> <strong>Employers</strong> {"\u2014"} HR uses it as a quick English-level benchmark for hiring</div>
        <div><span style={{fontSize:15}}>{"\u2708\uFE0F"}</span> <strong>International roles</strong> {"\u2014"} proof of working English for mobility, expat moves, internships abroad</div>
      </div>
      <div style={{borderTop:"1px solid var(--bdr)",marginTop:14,paddingTop:12,fontSize:11,color:"var(--t3)",lineHeight:1.5}}>
        <strong>Validity:</strong> scores are officially valid for 2 years from the test date (ETS recommendation). Some employers accept older scores, most do not.
      </div>
    </div>

    {/* Your roadmap */}
    <div className="crd" style={{padding:18,background:"linear-gradient(135deg,rgba(var(--cx),.08),rgba(139,94,131,.08))",borderColor:"rgba(var(--cx),.25)"}}>
      <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:12}}>
        <span style={{fontSize:26}}>{"\u2694\uFE0F"}</span>
        <h3 className="out" style={{fontWeight:700,fontSize:16,margin:0,color:"var(--cx-hex)"}}>How TOEIC Arena trains you</h3>
      </div>
      <div style={{fontSize:12,color:"var(--t2)",lineHeight:1.9}}>
        <div><span style={{fontSize:15}}>{"\uD83C\uDFA7"}</span> <strong>Listening Practice</strong> {"\u2014"} all 4 parts, real audio, escalating difficulty</div>
        <div><span style={{fontSize:15}}>{"\uD83D\uDCD6"}</span> <strong>Reading Practice</strong> {"\u2014"} Parts 5 to 7, from grammar drills to long passages</div>
        <div><span style={{fontSize:15}}>{"\uD83D\uDCDC"}</span> <strong>3 Mock Tests</strong> {"\u2014"} exam-like half-tests to measure your real level</div>
        <div><span style={{fontSize:15}}>{"\uD83D\uDC09"}</span> <strong>The Final Arena</strong> {"\u2014"} the full 200-question Boss Test</div>
        <div><span style={{fontSize:15}}>{"\u23F3"}</span> <strong>Endless Arena</strong> {"\u2014"} unlimited replay once you hit 650+</div>
        <div><span style={{fontSize:15}}>{"\uD83C\uDF7A"}</span> <strong>Word Tavern</strong> {"\u2014"} 390 business vocab across 18 domains</div>
      </div>
      <div style={{marginTop:14,paddingTop:12,borderTop:"1px solid rgba(var(--cx),.15)",fontSize:11,color:"var(--t3)",textAlign:"center",fontStyle:"italic",lineHeight:1.5}}>
        Every module you play feeds your <strong style={{color:"var(--cx-hex)"}}>TOEIC score estimate</strong>, visible in your Profile.
      </div>
    </div>
  </div>);
}

function StratCards(p){
  var[open,sO]=useState(null);
  var[filter,sF]=useState("all");
  var filtered=STRATEGIES.filter(function(s){return filter==="all"||s.section===filter||s.section==="Both";});
  var totalTips=0;STRATEGIES.forEach(function(s){totalTips+=s.tips.length;});

  return(<div className="enter" style={{padding:"20px 16px 100px"}}>
    <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16}}>
      <button className="back-btn" onClick={p.back}>{"\u2190"} Back</button>
      <span className="out" style={{fontWeight:700,fontSize:15}}>Strategy Cards</span>
      <div style={{width:40}}/></div>

    <div className="crd" style={{padding:14,marginBottom:16,textAlign:"center",background:"rgba(var(--cx),.04)",borderColor:"rgba(var(--cx),.12)"}}>
      <span className="out" style={{fontWeight:800,fontSize:22,color:"var(--cyan)"}}>{totalTips}</span>
      <span style={{fontSize:13,color:"var(--t2)",marginLeft:6}}>expert strategies across all TOEIC Parts</span></div>

    <div style={{display:"flex",gap:8,marginBottom:16}}>
      {[{id:"all",l:"All"},{id:"Listening",l:"👂 Listening"},{id:"Reading",l:"📖 Reading"}].map(function(f){
        var act=filter===f.id;return(
        <button key={f.id} onClick={function(){sF(f.id);sO(null);}}
          style={{flex:1,padding:"8px 4px",borderRadius:10,border:act?"1px solid var(--cyan)":"1px solid var(--bdr)",background:act?"rgba(var(--cx),.1)":"var(--bg2)",cursor:"pointer"}}>
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
                <span style={{fontSize:10,color:"var(--cyan)",background:"rgba(var(--cx),.06)",padding:"2px 6px",borderRadius:4}}>{tipCount} tips</span>
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

  if(ph==="done"){var xp=20+sc*5;if(p.gate)xp=p.gate(xp,sc,qs.length);return(<div className="enter" style={{padding:"20px 16px",minHeight:"100vh",display:"flex",flexDirection:"column",justifyContent:"center",textAlign:"center"}}>
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
      <button className="back-btn" onClick={p.back}>{"\u2190"} Back</button>
      <span className="out" style={{fontSize:13,color:"var(--t2)",fontWeight:600}}>{ci+1}/{qs.length}</span></div>
    <Bar value={ci} max={qs.length} h={4} color="linear-gradient(90deg,#b07830,#8b5e83)"/>

    <div style={{marginTop:16,marginBottom:20}}>
      <span className="out" style={{fontSize:10,fontWeight:700,color:pc,textTransform:"uppercase",letterSpacing:1,padding:"3px 8px",background:pc+"18",borderRadius:6}}>{q.part}</span></div>

    <div className="crd" style={{padding:16,marginBottom:20,background:"rgba(27,112,207,.05)",borderColor:"rgba(27,112,207,.12)"}}>
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
      <div className="crd" style={{background:"rgba(var(--cx),.06)",borderColor:"rgba(var(--cx),.15)",padding:16}}>
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
    <div style={{marginBottom:16,display:"flex",justifyContent:"center"}}><GIcon name="sands-of-time" size={60} color="var(--cyan)"/></div>
    <h1 className="out" style={{fontWeight:900,fontSize:26,marginBottom:8}}>Part 5 Exam Simulation</h1>
    <p style={{color:"var(--t2)",fontSize:13,marginBottom:8,lineHeight:1.6}}>30 questions. 10 minutes. Just like the real TOEIC.</p>
    <div className="crd" style={{padding:16,marginBottom:20,textAlign:"left"}}>
      <p style={{fontSize:13,color:"var(--t2)",lineHeight:1.6,marginBottom:8}}>Target pace: <strong style={{color:"var(--cyan)"}}>{Math.round(perQ)}s per question</strong></p>
      <p style={{fontSize:13,color:"var(--t2)",lineHeight:1.6}}>A pace indicator will show if you're on track, ahead, or behind. No feedback during the exam — just like the real thing.</p></div>
    <button className="btn1" onClick={function(){sP("q");}}>Start Exam</button>
    <button className="btn2" onClick={p.back} style={{marginTop:12,width:"100%"}}>Back</button></div>);

  if(ph==="done"){var xp=30+sc*5;if(p.gate)xp=p.gate(xp,sc,qs.length);var totalTime=elapsed;

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
        var catArr=Object.keys(cats).map(function(k){return{cat:k,ok:cats[k].ok,total:cats[k].total,pct:cats[k].total>0?Math.round(cats[k].ok/cats[k].total*100):0};});
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
          {q.x&&<div style={{marginTop:10,padding:10,background:"rgba(var(--cx),.06)",borderRadius:8,border:"1px solid rgba(var(--cx),.12)"}}>
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
      <button className="back-btn" onClick={function(){clearInterval(timerRef.current);p.back();}}>{"\u2190"} Back</button>
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
    <div style={{marginBottom:16,display:"flex",justifyContent:"center"}}><GIcon name="stone-tablet" size={60} color="var(--cyan)"/></div>
    <h1 className="out" style={{fontWeight:900,fontSize:26,marginBottom:8}}>Part 6 — Text Completion</h1>
    <p style={{color:"var(--t2)",fontSize:13,marginBottom:8,lineHeight:1.6}}>{texts.length} business texts with 4 blanks each.<br/>Read the full text, then complete the blanks.</p>
    <p style={{color:"var(--gold)",fontWeight:600,fontSize:14,marginBottom:32}}>Context is everything here!</p>
    <button className="btn1" onClick={function(){sP("text");}}>Start</button>
    <button className="btn2" onClick={p.back} style={{marginTop:12,width:"100%"}}>Back</button></div>);

  if(ph==="done"){var xp=25+sc*5;if(p.gate)xp=p.gate(xp,sc,totalBlanks);return(<div className="enter" style={{padding:"20px 16px",minHeight:"100vh",display:"flex",flexDirection:"column",justifyContent:"center",textAlign:"center"}}>
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
          background:isCurrent?"rgba(var(--cx),.2)":answered?"rgba(0,230,118,.1)":"var(--bg3)",
          color:isCurrent?"var(--cyan)":answered?"var(--green)":"var(--t3)",
          border:isCurrent?"1px solid var(--cyan)":"1px solid transparent"}}>{label}</span>;
      }
      return <span key={i}>{part.text}</span>;
    });
  }

  if(ph==="text")return(<div className="enter" style={{padding:"20px 16px",minHeight:"100vh"}}>
    <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16}}>
      <button className="back-btn" onClick={p.back}>{"\u2190"} Back</button>
      <span className="out" style={{fontSize:13,color:"var(--t2)",fontWeight:600}}>Text {ti+1}/{texts.length}</span></div>
    <div style={{display:"flex",gap:6,marginBottom:12}}>
      <span style={{fontSize:10,padding:"3px 8px",background:"rgba(27,112,207,.1)",color:"var(--purple)",borderRadius:6,fontWeight:600}} className="out">{curText.type}</span>
      <span style={{fontSize:10,padding:"3px 8px",background:"var(--bg3)",color:"var(--t3)",borderRadius:6}} className="out">From: {curText.from}</span></div>
    <div className="out" style={{fontWeight:700,fontSize:14,marginBottom:12,color:"var(--t1)"}}>Subject: {curText.subject}</div>
    <div className="crd" style={{padding:16,marginBottom:20}}>
      <p className="read-text" style={{fontSize:13,color:"var(--t2)",lineHeight:2,whiteSpace:"pre-line"}}>{renderText()}</p></div>
    <p style={{fontSize:12,color:"var(--t3)",textAlign:"center",marginBottom:16}}>Read the full text, then tap below to fill in the blanks.</p>
    <button className="btn1" onClick={function(){sP("q");}}>Fill in the blanks</button></div>);

  // Question mode
  return(<div className={sk?"sk":""} style={{padding:"20px 16px",minHeight:"100vh"}}>
    <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16}}>
      <button className="back-btn" onClick={p.back}>{"\u2190"} Back</button>
      <span className="out" style={{fontSize:13,color:"var(--t2)",fontWeight:600}}>Blank {totalB+1}/{totalBlanks}</span></div>
    <Bar value={totalB} max={totalBlanks} h={4} color="linear-gradient(90deg,#c4587a,#8b5e83)"/>
    <div style={{marginTop:12,marginBottom:6}}>
      <span style={{fontSize:10,padding:"3px 8px",background:"rgba(27,112,207,.1)",color:"var(--purple)",borderRadius:6,fontWeight:600}} className="out">{curText.type}: {curText.subject}</span></div>
    <div className="crd" style={{padding:14,marginBottom:20,background:"var(--bg3)"}}>
      <p className="read-text" style={{fontSize:12,color:"var(--t2)",lineHeight:1.9,whiteSpace:"pre-line"}}>{renderText()}</p></div>
    <p className="out q-heading" style={{fontWeight:700,fontSize:14,marginBottom:12,color:"var(--cyan)"}}>Fill blank ({bi+1}):</p>
    <div className="read-opts" style={{display:"flex",flexDirection:"column",gap:8}}>
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
      <div className="crd" style={{background:"rgba(var(--cx),.06)",borderColor:"rgba(var(--cx),.15)",padding:14}}>
        <p style={{fontSize:13,color:"var(--t2)",lineHeight:1.6}}>{curBlank.x}</p></div>
      <button className="btn1" onClick={nxt} style={{marginTop:14}}>{bi<blanks.length-1?"Next Blank":(ti<texts.length-1?"Next Text":"See Results")}</button></div>}
  </div>);
}

// ─── PART 7 READING COMPREHENSION ───
function Part7Read(p){
  var passages=useMemo(function(){return shuffle(PART7_PASSAGES).filter(function(p){return p&&p.questions&&p.questions.length>0;}).slice(0,7);},[]);
  var[pi,sPi]=useState(0);var[qi,sQi]=useState(0);var[sc,sSc]=useState(0);var[totalQ,sTQ]=useState(0);
  var[ph,sP]=useState("intro");var[pick,sPk]=useState(-1);var[sk,sSk]=useState(false);
  var[showQPreview,setShowQPreview]=useState(false);var[showText,setShowText]=useState(false);

  var totalQs=useMemo(function(){var c=0;passages.forEach(function(p){if(p&&p.questions)c+=p.questions.length;});return c;},[]);
  var shuffledQMap=useMemo(function(){var m={};passages.forEach(function(ps){if(!ps||!ps.questions)return;m[ps.id]=ps.questions.map(function(q){var idx=[0,1,2,3];for(var i=idx.length-1;i>0;i--){var j=Math.floor(Math.random()*(i+1));var tmp=idx[i];idx[i]=idx[j];idx[j]=tmp;}return{options:idx.map(function(k){return q.options[k];}),correct:idx.indexOf(q.correct),x:q.x,q:q.q};});});return m;},[]);
  var curPass=passages[pi];
  var curQ=curPass&&shuffledQMap[curPass.id]?shuffledQMap[curPass.id][qi]:null;

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
    <div style={{marginBottom:16,display:"flex",justifyContent:"center"}}><GIcon name="bookmark" size={60} color="var(--cyan)"/></div>
    <h1 className="out" style={{fontWeight:900,fontSize:26,marginBottom:8}}>Part 7 — Reading</h1>
    <p style={{color:"var(--t2)",fontSize:13,marginBottom:8,lineHeight:1.6}}>{passages.length} passages with 3-4 questions each.<br/>Read the questions FIRST, then scan for answers!</p>
    <p style={{color:"var(--gold)",fontWeight:600,fontSize:14,marginBottom:32}}>Strategy: Questions first, then scan!</p>
    <button className="btn1" onClick={function(){sP("read");}}>Start</button>
    <button className="btn2" onClick={p.back} style={{marginTop:12,width:"100%"}}>Back</button></div>);

  if(ph==="done"){var xp=30+sc*5;if(p.gate)xp=p.gate(xp,sc,totalQs);return(<div className="enter" style={{padding:"20px 16px",minHeight:"100vh",display:"flex",flexDirection:"column",justifyContent:"center",textAlign:"center"}}>
    <div style={{fontSize:48,marginBottom:16,animation:"countUp .6s"}}>{sc>=totalQs*0.8?"🏆":sc>=totalQs*0.5?"⚔️":"🛡️"}</div>
    <h1 className="out" style={{fontWeight:900,fontSize:28,marginBottom:8}}>Reading Complete</h1>
    <div className="out" style={{fontSize:44,fontWeight:900,color:sc>=totalQs*0.8?"var(--green)":sc>=totalQs*0.5?"var(--cyan)":"var(--orange)",marginBottom:4,animation:"countUp .8s"}}>{sc}/{totalQs}</div>
    <div className="out" style={{fontSize:20,fontWeight:800,color:"var(--gold)",marginBottom:32}}>+{xp} XP</div>
    <button className="btn1" onClick={p.back}>Back to Training</button></div>);}

// Reading view — show passage with question preview toggle
  if(ph==="read")return(<div className="enter" style={{padding:"20px 16px 100px"}}>
    <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16}}>
      <button className="back-btn" onClick={p.back}>{"\u2190"} Back</button>
      <span className="out" style={{fontSize:13,color:"var(--t2)",fontWeight:600}}>Passage {pi+1}/{passages.length}</span></div>
    <Bar value={totalQ} max={totalQs} h={4} color="linear-gradient(90deg,#3b82f6,#06b6d4)"/>
    <div style={{display:"flex",gap:6,marginTop:12,marginBottom:12}}>
      <span style={{fontSize:10,padding:"3px 8px",background:"rgba(59,130,246,.1)",color:"#3b82f6",borderRadius:6,fontWeight:600}} className="out">{curPass.type}</span>
      <button onClick={function(){setShowQPreview(!showQPreview);}} style={{fontSize:10,padding:"3px 8px",background:showQPreview?"rgba(27,112,207,.15)":"var(--bg3)",color:showQPreview?"var(--purple)":"var(--t3)",borderRadius:6,border:"none",cursor:"pointer",fontWeight:600}} className="out">{showQPreview?"Hide questions ▲":"Preview questions ▼"} ({curPass.questions.length})</button></div>
    {showQPreview&&<div className="crd" style={{padding:12,marginBottom:12,borderColor:"rgba(27,112,207,.2)",background:"rgba(27,112,207,.04)"}}>
      <div style={{fontSize:10,color:"var(--purple)",fontWeight:700,textTransform:"uppercase",letterSpacing:1,marginBottom:8}}>Read these first!</div>
      {(shuffledQMap[curPass.id]||curPass.questions).map(function(q,i){return(<div key={i} style={{fontSize:12,color:"var(--t2)",lineHeight:1.6,padding:"4px 0",borderBottom:i<curPass.questions.length-1?"1px solid var(--bdr)":"none"}}><span style={{color:"var(--purple)",fontWeight:700}}>Q{i+1}.</span> {q.q}</div>);})}</div>}
    <div className="crd" style={{padding:16,marginBottom:16}}>
      <p className="read-text" style={{fontSize:13,color:"var(--t2)",lineHeight:1.8,whiteSpace:"pre-line"}}>{curPass.text}</p></div>
    <button className="btn1" onClick={function(){sP("q");setShowQPreview(false);setShowText(false);}}>Answer Questions</button></div>);

// Question mode
  return(<div className={sk?"sk":""} style={{padding:"20px 16px",minHeight:"100vh"}}>
    <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16}}>
      <button className="back-btn" onClick={p.back}>{"\u2190"} Back</button>
      <span className="out" style={{fontSize:13,color:"var(--t2)",fontWeight:600}}>Q {totalQ+1}/{totalQs}</span></div>
    <Bar value={totalQ} max={totalQs} h={4} color="linear-gradient(90deg,#3b82f6,#06b6d4)"/>
    <div style={{display:"flex",gap:6,marginTop:12,marginBottom:6}}>
      <span style={{fontSize:10,padding:"3px 8px",background:"rgba(59,130,246,.1)",color:"#3b82f6",borderRadius:6,fontWeight:600}} className="out">{curPass.type} — Passage {pi+1}</span>
      <button onClick={function(){setShowText(!showText);}} style={{fontSize:10,padding:"3px 8px",background:showText?"rgba(6,182,212,.15)":"var(--bg3)",color:showText?"var(--cyan)":"var(--t3)",borderRadius:6,border:"none",cursor:"pointer",fontWeight:600}} className="out">{showText?"Hide text ▲":"Show text ▼"}</button></div>
    {showText&&<div className="crd" style={{padding:14,marginBottom:12,maxHeight:200,overflowY:"auto",borderColor:"rgba(6,182,212,.2)"}}>
      <p className="read-text" style={{fontSize:12,color:"var(--t2)",lineHeight:1.7,whiteSpace:"pre-line"}}>{curPass.text}</p></div>}

    <h2 className="out q-heading" style={{fontWeight:700,fontSize:17,lineHeight:1.5,marginBottom:20,marginTop:12}}>{curQ.q}</h2>
    <div className="read-opts" style={{display:"flex",flexDirection:"column",gap:8}}>
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
      <div className="crd" style={{background:"rgba(var(--cx),.06)",borderColor:"rgba(var(--cx),.15)",padding:14}}>
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

  if(ph==="intro")return(<div className="enter" style={{padding:"20px 16px",minHeight:"100vh",display:"flex",flexDirection:"column",justifyContent:"center",textAlign:"center",position:"relative"}}>
    <button className="back-btn" onClick={p.back} style={{position:"absolute",top:16,left:16,marginBottom:0}}>{"\u2190"} Back</button>
    <div style={{marginBottom:16,display:"flex",justifyContent:"center"}}><GIcon name="duality-mask" size={60} color="var(--cyan)"/></div>
    <h1 className="out" style={{fontWeight:900,fontSize:26,marginBottom:8}}>False Friends</h1>
    <p style={{color:"var(--t2)",fontSize:13,marginBottom:8,lineHeight:1.6}}>These English words LOOK like French words but mean something completely different!</p>
    <p style={{color:"var(--gold)",fontWeight:600,fontSize:14,marginBottom:32}}>Can you avoid the francophone traps?</p>
    <button className="btn1" onClick={function(){sP("q");}}>Start</button></div>);

  if(ph==="done"){var xp=20+sc*5;if(p.gate)xp=p.gate(xp,sc,items.length);return(<div className="enter" style={{padding:"20px 16px",minHeight:"100vh",display:"flex",flexDirection:"column",justifyContent:"center",textAlign:"center"}}>
    <div style={{fontSize:48,marginBottom:16,animation:"countUp .6s"}}>{sc>=10?"🏆":sc>=7?"⚔️":"🛡️"}</div>
    <h1 className="out" style={{fontWeight:900,fontSize:28,marginBottom:8}}>False Friends Defeated!</h1>
    <div className="out" style={{fontSize:44,fontWeight:900,color:sc>=10?"var(--green)":sc>=7?"var(--cyan)":"var(--orange)",marginBottom:4,animation:"countUp .8s"}}>{sc}/{items.length}</div>
    <div className="out" style={{fontSize:20,fontWeight:800,color:"var(--gold)",marginBottom:32}}>+{xp} XP</div>
    <button className="btn1" onClick={p.back}>Back to Training</button></div>);}

  var it=items[ci];

  return(<div className={sk?"sk":""} style={{padding:"20px 16px",minHeight:"100vh"}}>
    <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:20}}>
      <button className="back-btn" onClick={p.back}>{"\u2190"} Back</button>
      <span className="out" style={{fontSize:13,color:"var(--t2)",fontWeight:600}}>{ci+1}/{items.length}</span></div>
    <Bar value={ci} max={items.length} h={4} color="linear-gradient(90deg,#ec4899,#f59e0b)"/>

    <div style={{marginTop:20,marginBottom:20}}>
      <div className="out" style={{fontSize:11,color:"var(--purple)",textTransform:"uppercase",letterSpacing:1,fontWeight:600,marginBottom:16}}>What does the underlined word mean here?</div>
      <div className="crd" style={{padding:16,background:"rgba(27,112,207,.05)",borderColor:"rgba(27,112,207,.12)"}}>
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
      <div className="crd" style={{background:"rgba(var(--cx),.06)",borderColor:"rgba(var(--cx),.15)",padding:16}}>
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

// ─── BOSS TEST — The Final Arena (Full TOEIC 200Q) ───
function BossTest(p){
  var LP1=BOSS_P1,LP2=BOSS_P2,LP3=BOSS_P3,LP4=BOSS_P4;
  var RP5=BOSS_P5,RP6=BOSS_P6,RP7=BOSS_P7;
  var p3QC=0;LP3.forEach(function(c){p3QC+=c.qs.length;});
  var p4QC=0;LP4.forEach(function(t){p4QC+=t.qs.length;});
  var lisQ=LP1.length+LP2.length+p3QC+p4QC;
  var p6BC=0;RP6.forEach(function(t){t.parts.forEach(function(pt){if(pt.blank)p6BC++;});});
  var p7QC=0;RP7.forEach(function(ps){p7QC+=ps.questions.length;});
  var readQ=RP5.length+p6BC+p7QC;
  var totalQ=lisQ+readQ;
  var TOTAL_TIME=120*60;
  var BOSS_STORAGE_KEY="bossTestSession";

  // ── Restore saved session if any ──
  var saved=useMemo(function(){try{var raw=localStorage.getItem(BOSS_STORAGE_KEY);if(!raw)return null;var d=JSON.parse(raw);if(d.date!==today())return null;if(!d.ans||!d.sec||d.timeLeft==null)return null;return d;}catch(e){return null;}},[]);

  var freshAns=function(){return{
    p1:LP1.map(function(){return -1;}),p2:LP2.map(function(){return -1;}),
    p3:LP3.map(function(c){return c.qs.map(function(){return -1;});}),
    p4:LP4.map(function(t){return t.qs.map(function(){return -1;});}),
    p5:RP5.map(function(){return -1;}),
    p6:RP6.map(function(t){var n=0;t.parts.forEach(function(pt){if(pt.blank)n++;});return Array(n).fill(-1);}),
    p7:RP7.map(function(ps){return ps.questions.map(function(){return -1;});})
  };};

  var[phase,setPhase]=useState(saved?"resume":"intro");
  var[sec,setSec]=useState(saved?saved.sec:"p1");
  var[qi,setQi]=useState(saved?saved.qi:0);
  var[sqi,setSqi]=useState(saved?saved.sqi:0);
  var[ans,setAns]=useState(function(){return saved?saved.ans:freshAns();});
  var[timeLeft,setTimeLeft]=useState(saved?saved.timeLeft:TOTAL_TIME);

  function saveBossSession(a,s,q,sq,tl){try{localStorage.setItem(BOSS_STORAGE_KEY,JSON.stringify({date:today(),ans:a,sec:s,qi:q,sqi:sq,timeLeft:tl}));}catch(e){}}
  function clearBossSession(){try{localStorage.removeItem(BOSS_STORAGE_KEY);}catch(e){}}
  var[result,setResult]=useState(null);
  var[aState,setAState]=useState("ready");
  var[curOpt,setCurOpt]=useState(-1);
  var[revMode,setRevMode]=useState(false);
  var[revSec,setRevSec]=useState("p1");
  var[revIdx,setRevIdx]=useState(0);
  useEffect(function(){resumeAudioSession();return stopListenAudio;},[]);
  var timerRef=useRef(null);

  useEffect(function(){
    if(phase!=="test"||result)return;
    if(timeLeft<=0){doSubmit();return;}
    timerRef.current=setTimeout(function(){setTimeLeft(timeLeft-1);},1000);
    return function(){clearTimeout(timerRef.current);};
  });

  // ── Auto-save session every 5 seconds + on page unload ──
  var bossStateRef=useRef({ans:ans,sec:sec,qi:qi,sqi:sqi,timeLeft:timeLeft,phase:phase});
  bossStateRef.current={ans:ans,sec:sec,qi:qi,sqi:sqi,timeLeft:timeLeft,phase:phase};
  useEffect(function(){
    if(phase!=="test"||result)return;
    var id=setTimeout(function(){saveBossSession(ans,sec,qi,sqi,timeLeft);},5000);
    return function(){clearTimeout(id);};
  });
  useEffect(function(){
    function onUnload(){var s=bossStateRef.current;if(s.phase==="test")saveBossSession(s.ans,s.sec,s.qi,s.sqi,s.timeLeft);}
    window.addEventListener("beforeunload",onUnload);
    return function(){window.removeEventListener("beforeunload",onUnload);};
  },[]);

  function fmtT(s){var m=Math.floor(s/60);var sc2=s%60;return m+":"+(sc2<10?"0":"")+sc2;}
  function pad(n){return String(n).padStart(2,"0");}

  // ── Audio ──
  async function playP1(){if(aState!=="ready")return;setAState("playing");for(var i=0;i<LP1[qi].opts.length;i++){setCurOpt(i);await playAudioFile("/audio/boss/p1_"+pad(qi+1)+"_"+i+".mp3");await new Promise(function(r){setTimeout(r,400);});}setCurOpt(-1);setAState("done");}
  async function playP2(){if(aState!=="ready")return;setAState("playing");var id=pad(qi+1);await playAudioFile("/audio/boss/p2_"+id+"_q.mp3");await new Promise(function(r){setTimeout(r,400);});for(var i=0;i<3;i++){setCurOpt(i);await playAudioFile("/audio/boss/p2_"+id+"_"+i+".mp3");await new Promise(function(r){setTimeout(r,300);});}setCurOpt(-1);setAState("done");}
  async function playP3(){if(aState!=="ready")return;setAState("playing");await playAudioFile("/audio/boss/p3_"+pad(qi+1)+".mp3");setAState("done");}
  async function playP4(){if(aState!=="ready")return;setAState("playing");await playAudioFile("/audio/boss/p4_"+pad(qi+1)+".mp3");setAState("done");}

  // ── Answer & Navigate ──
  function pick(val){
    var a=JSON.parse(JSON.stringify(ans));
    if(sec==="p1")a.p1[qi]=val;
    else if(sec==="p2")a.p2[qi]=val;
    else if(sec==="p3")a.p3[qi][sqi]=val;
    else if(sec==="p4")a.p4[qi][sqi]=val;
    else if(sec==="p5")a.p5[qi]=val;
    else if(sec==="p6")a.p6[qi][sqi]=val;
    else if(sec==="p7")a.p7[qi][sqi]=val;
    setAns(a);setTimeout(nxt,300);
  }
  function nxt(){
    if(sec==="p1"){if(qi<LP1.length-1){setQi(qi+1);setAState("ready");setCurOpt(-1);}else{setSec("p2");setQi(0);setSqi(0);setAState("ready");setCurOpt(-1);}}
    else if(sec==="p2"){if(qi<LP2.length-1){setQi(qi+1);setAState("ready");setCurOpt(-1);}else{setSec("p3");setQi(0);setSqi(0);setAState("ready");}}
    else if(sec==="p3"){if(sqi<LP3[qi].qs.length-1)setSqi(sqi+1);else if(qi<LP3.length-1){setQi(qi+1);setSqi(0);setAState("ready");}else{setSec("p4");setQi(0);setSqi(0);setAState("ready");}}
    else if(sec==="p4"){if(sqi<LP4[qi].qs.length-1)setSqi(sqi+1);else if(qi<LP4.length-1){setQi(qi+1);setSqi(0);setAState("ready");}else{setSec("p5");setQi(0);setSqi(0);}}
    else if(sec==="p5"){if(qi<RP5.length-1)setQi(qi+1);else{setSec("p6");setQi(0);setSqi(0);}}
    else if(sec==="p6"){var bN=ans.p6[qi].length;if(sqi<bN-1)setSqi(sqi+1);else if(qi<RP6.length-1){setQi(qi+1);setSqi(0);}else{setSec("p7");setQi(0);setSqi(0);}}
    else if(sec==="p7"){if(sqi<RP7[qi].questions.length-1)setSqi(sqi+1);else if(qi<RP7.length-1){setQi(qi+1);setSqi(0);}else doSubmit();}
  }

  // ── Scoring ──
  function doSubmit(){
    clearTimeout(timerRef.current);clearBossSession();
    var p1s=0;LP1.forEach(function(q,i){if(ans.p1[i]===q.c)p1s++;});
    var p2s=0;LP2.forEach(function(q,i){if(ans.p2[i]===q.c)p2s++;});
    var p3s=0;LP3.forEach(function(c,i){c.qs.forEach(function(q,j){if(ans.p3[i][j]===q.c)p3s++;});});
    var p4s=0;LP4.forEach(function(t,i){t.qs.forEach(function(q,j){if(ans.p4[i][j]===q.c)p4s++;});});
    var lRaw=p1s+p2s+p3s+p4s;var lT=estimateToeic(lRaw,lisQ);
    var p5s=0;RP5.forEach(function(q,i){if(ans.p5[i]===q.c)p5s++;});
    var p6s=0;RP6.forEach(function(t,ti){var bi=0;t.parts.forEach(function(pt){if(pt.blank){if(ans.p6[ti][bi]===pt.correct)p6s++;bi++;}});});
    var p7s=0;RP7.forEach(function(ps,pi){ps.questions.forEach(function(q,qi2){if(ans.p7[pi][qi2]===q.correct)p7s++;});});
    var rRaw=p5s+p6s+p7s;var rT=estimateToeic(rRaw,readQ);
    var res={date:today(),mockId:"boss",score:lRaw+rRaw,total:totalQ,
      listening:{score:lRaw,total:lisQ,toeic:lT,p1:{score:p1s,total:LP1.length},p2:{score:p2s,total:LP2.length},p3:{score:p3s,total:p3QC},p4:{score:p4s,total:p4QC}},
      reading:{score:rRaw,total:readQ,toeic:rT,p5:{score:p5s,total:RP5.length},p6:{score:p6s,total:p6BC},p7:{score:p7s,total:p7QC}},
      toeicEstimate:lT+rT,timeUsed:TOTAL_TIME-timeLeft};
    setResult(res);setPhase("done");
  }

  // ── Progress ──
  var answered=0;
  ans.p1.forEach(function(a){if(a>=0)answered++;});ans.p2.forEach(function(a){if(a>=0)answered++;});
  ans.p3.forEach(function(c){c.forEach(function(a){if(a>=0)answered++;});});ans.p4.forEach(function(t){t.forEach(function(a){if(a>=0)answered++;});});
  ans.p5.forEach(function(a){if(a>=0)answered++;});ans.p6.forEach(function(t){t.forEach(function(a){if(a>=0)answered++;});});
  ans.p7.forEach(function(ps){ps.forEach(function(a){if(a>=0)answered++;});});

  // ── Section labels ──
  var secLabel=sec==="p1"?"Part 1 — Photos":sec==="p2"?"Part 2 — Q&R":sec==="p3"?"Part 3 — Conversations":sec==="p4"?"Part 4 — Talks":sec==="p5"?"Part 5 — Sentences":sec==="p6"?"Part 6 — Text Completion":"Part 7 — Reading";
  var isListening=sec==="p1"||sec==="p2"||sec==="p3"||sec==="p4";

  // ═══ RESUME ═══
  if(phase==="resume"&&saved){
    var rAnswered=0;
    saved.ans.p1.forEach(function(a){if(a>=0)rAnswered++;});saved.ans.p2.forEach(function(a){if(a>=0)rAnswered++;});
    saved.ans.p3.forEach(function(c){c.forEach(function(a){if(a>=0)rAnswered++;});});saved.ans.p4.forEach(function(t){t.forEach(function(a){if(a>=0)rAnswered++;});});
    saved.ans.p5.forEach(function(a){if(a>=0)rAnswered++;});saved.ans.p6.forEach(function(t){t.forEach(function(a){if(a>=0)rAnswered++;});});
    saved.ans.p7.forEach(function(ps){ps.forEach(function(a){if(a>=0)rAnswered++;});});
    return(<div className="enter" style={{padding:"20px 16px",minHeight:"100vh",display:"flex",flexDirection:"column",justifyContent:"center",textAlign:"center"}}>
      <div style={{fontSize:56,marginBottom:12}}>{"🛡️"}</div>
      <h1 className="out" style={{fontWeight:900,fontSize:24,marginBottom:8}}>Session in progress</h1>
      <p style={{color:"var(--t2)",fontSize:14,marginBottom:24}}>You have an unfinished Final Arena attempt from today.</p>
      <div className="crd" style={{padding:16,marginBottom:24,textAlign:"left"}}>
        <div style={{display:"flex",justifyContent:"space-between",marginBottom:8}}><span style={{color:"var(--t2)",fontSize:13}}>Progress</span><span className="out" style={{fontWeight:700,color:"var(--cyan)",fontSize:14}}>{rAnswered}/{totalQ} answered</span></div>
        <Bar value={rAnswered} max={totalQ} h={6} color="linear-gradient(90deg,#f59e0b,#ef4444)"/>
        <div style={{display:"flex",justifyContent:"space-between",marginTop:10}}><span style={{color:"var(--t2)",fontSize:13}}>Time remaining</span><span className="out" style={{fontWeight:700,color:saved.timeLeft>600?"var(--cyan)":"var(--orange)",fontSize:14}}>{fmtT(saved.timeLeft)}</span></div>
        <div style={{display:"flex",justifyContent:"space-between",marginTop:6}}><span style={{color:"var(--t2)",fontSize:13}}>Current section</span><span className="out" style={{fontWeight:600,fontSize:13}}>{saved.sec==="p1"?"Part 1":saved.sec==="p2"?"Part 2":saved.sec==="p3"?"Part 3":saved.sec==="p4"?"Part 4":saved.sec==="p5"?"Part 5":saved.sec==="p6"?"Part 6":"Part 7"}</span></div>
      </div>
      <button className="btn1" style={{background:"linear-gradient(135deg,#22c55e,#06b6d4)",fontSize:16,padding:"14px 28px",marginBottom:12}} onClick={function(){stopBGM();setPhase("test");}}>Resume session</button>
      <button className="btn2" style={{marginBottom:8}} onClick={function(){clearBossSession();setAns(freshAns());setSec("p1");setQi(0);setSqi(0);setTimeLeft(TOTAL_TIME);setPhase("intro");}}>Start over</button>
      <button className="btn2" onClick={p.back}>Back</button>
    </div>);
  }

  // ═══ INTRO ═══
  if(phase==="intro"){
    return(<div className="enter" style={{padding:"20px 16px",minHeight:"100vh",display:"flex",flexDirection:"column",justifyContent:"center",textAlign:"center"}}>
      <div style={{fontSize:64,marginBottom:12,animation:"pulse 2s infinite"}}>🐉</div>
      <h1 className="out" style={{fontWeight:900,fontSize:28,background:"linear-gradient(135deg,#dc2626,#f59e0b)",WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent",marginBottom:4}}>THE FINAL ARENA</h1>
      <p style={{color:"var(--t2)",fontSize:14,marginBottom:20}}>Full TOEIC Simulation</p>
      <div className="crd" style={{textAlign:"left",padding:16,marginBottom:16}}>
        <div style={{fontSize:11,color:"var(--orange)",fontWeight:700,textTransform:"uppercase",letterSpacing:1,marginBottom:8}}>🔊 Listening Section</div>
        <div style={{fontSize:13,color:"var(--t1)",lineHeight:1.8}}>
          <div style={{display:"flex",justifyContent:"space-between"}}><span>Part 1 — Photographs</span><span className="out" style={{color:"var(--cyan)"}}>{LP1.length} Q</span></div>
          <div style={{display:"flex",justifyContent:"space-between"}}><span>Part 2 — Question-Response</span><span className="out" style={{color:"var(--cyan)"}}>{LP2.length} Q</span></div>
          <div style={{display:"flex",justifyContent:"space-between"}}><span>Part 3 — Conversations</span><span className="out" style={{color:"var(--cyan)"}}>{p3QC} Q</span></div>
          <div style={{display:"flex",justifyContent:"space-between"}}><span>Part 4 — Talks</span><span className="out" style={{color:"var(--cyan)"}}>{p4QC} Q</span></div>
          <div style={{borderTop:"1px solid var(--bdr)",marginTop:6,paddingTop:6,display:"flex",justifyContent:"space-between",fontWeight:700}}><span>Subtotal</span><span style={{color:"var(--gold)"}}>{lisQ} Q</span></div>
        </div>
      </div>
      <div className="crd" style={{textAlign:"left",padding:16,marginBottom:16}}>
        <div style={{fontSize:11,color:"var(--green)",fontWeight:700,textTransform:"uppercase",letterSpacing:1,marginBottom:8}}>📖 Reading Section</div>
        <div style={{fontSize:13,color:"var(--t1)",lineHeight:1.8}}>
          <div style={{display:"flex",justifyContent:"space-between"}}><span>Part 5 — Incomplete Sentences</span><span className="out" style={{color:"var(--cyan)"}}>{RP5.length} Q</span></div>
          <div style={{display:"flex",justifyContent:"space-between"}}><span>Part 6 — Text Completion</span><span className="out" style={{color:"var(--cyan)"}}>{p6BC} Q</span></div>
          <div style={{display:"flex",justifyContent:"space-between"}}><span>Part 7 — Reading Comprehension</span><span className="out" style={{color:"var(--cyan)"}}>{p7QC} Q</span></div>
          <div style={{borderTop:"1px solid var(--bdr)",marginTop:6,paddingTop:6,display:"flex",justifyContent:"space-between",fontWeight:700}}><span>Subtotal</span><span style={{color:"var(--gold)"}}>{readQ} Q</span></div>
        </div>
      </div>
      <div className="crd glo" style={{padding:14,marginBottom:20}}>
        <div style={{display:"flex",justifyContent:"space-between",fontWeight:800,fontSize:15,color:"var(--t1)"}}><span>TOTAL</span><span className="out" style={{color:"var(--gold)"}}>{totalQ} questions · 120 min</span></div>
      </div>
      <div className="crd" style={{padding:14,marginBottom:24,borderColor:"rgba(220,38,38,.3)",background:"rgba(220,38,38,.06)"}}>
        <p style={{fontSize:12,color:"var(--red)",lineHeight:1.6}}>⚠️ Real TOEIC conditions. No feedback. No going back. Audio plays ONCE. Your score is saved. Rejouable after 24h cooldown.</p>
      </div>
      <button className="btn1" style={{background:"linear-gradient(135deg,#dc2626,#f59e0b)",fontSize:18,padding:"16px 32px"}} onClick={function(){stopBGM();setPhase("test");}}>⚔️ Enter the Arena</button>
      <button className="btn2" onClick={p.back} style={{marginTop:12,width:"100%"}}>Not ready yet</button>
    </div>);
  }

  // ═══ TEST PHASE ═══
  if(phase==="test"&&!result){
    var timerCol=timeLeft>600?"var(--cyan)":timeLeft>120?"var(--orange)":"var(--red)";

    // Common header
    var header=(<div style={{marginBottom:16}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:8}}>
        <div style={{fontSize:11,color:isListening?"var(--orange)":"var(--green)",fontWeight:700,textTransform:"uppercase",letterSpacing:1}}>{isListening?"🔊 Listening":"📖 Reading"}</div>
        <div className="out" style={{fontSize:14,fontWeight:800,color:timerCol}}>{fmtT(timeLeft)}</div>
      </div>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:8}}>
        <span className="out" style={{fontSize:13,fontWeight:700}}>{secLabel}</span>
        <span style={{fontSize:11,color:"var(--t3)"}}>{answered}/{totalQ} answered</span>
      </div>
      <Bar value={answered} max={totalQ} h={4} color={isListening?"linear-gradient(90deg,#f59e0b,#ef4444)":"linear-gradient(90deg,#22c55e,#06b6d4)"}/>
    </div>);

    // ── P1: Photos (TOEIC: blind A/B/C/D, answer during audio) ──
    if(sec==="p1"){
      var it=LP1[qi];var selP1=ans.p1[qi];
      return(<div style={{padding:"20px 16px",minHeight:"100vh"}}>
        {header}
        <div style={{marginBottom:12,borderRadius:14,overflow:"hidden",border:"1px solid var(--bdr)"}}>
          <img src={it.img} alt="TOEIC photo" style={{width:"100%",display:"block",maxHeight:240,objectFit:"cover"}}/>
        </div>
        {aState==="ready"&&<div style={{textAlign:"center",marginBottom:16}}>
          <button onClick={playP1} style={{width:70,height:70,borderRadius:"50%",border:"none",background:"linear-gradient(135deg,#f59e0b,#ef4444)",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",margin:"0 auto"}}><span style={{fontSize:28}}>{"▶️"}</span></button>
          <p style={{color:"var(--t2)",fontSize:12,marginTop:8}}>Tap to play — listen and choose</p></div>}
        {(aState==="playing"||aState==="done")&&<div>
          {aState==="playing"&&<div style={{textAlign:"center",marginBottom:12}}>
            <p className="out" style={{color:"var(--orange)",fontSize:13,animation:"pulse 1.5s infinite"}}>🔊 Playing statement {String.fromCharCode(65+(curOpt>=0?curOpt:0))}...</p></div>}
          {aState==="done"&&selP1<0&&<div style={{textAlign:"center",marginBottom:12}}>
            <p className="out" style={{color:"var(--green)",fontSize:13}}>Audio complete — choose your answer</p></div>}
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
            {["A","B","C","D"].map(function(letter,i){var sel=selP1===i;var playing2=aState==="playing"&&curOpt===i;return(<button key={i} onClick={function(){if(selP1<0)pick(i);}} style={{padding:"18px 10px",background:sel?"rgba(var(--cx),.2)":playing2?"rgba(245,158,11,.1)":"var(--bg2)",border:"2px solid "+(sel?"var(--cyan)":playing2?"var(--orange)":"var(--bdr)"),borderRadius:14,cursor:selP1<0?"pointer":"default",textAlign:"center",fontFamily:"'Cinzel','Outfit',serif",transition:"all .15s"}}>
              <div className="out" style={{fontSize:24,fontWeight:900,color:sel?"var(--cyan)":playing2?"var(--orange)":"var(--t2)"}}>{letter}</div>
            </button>);})}
          </div>
        </div>}
      </div>);
    }

    // ── P2: Q&R (TOEIC: blind A/B/C, answer during audio) ──
    if(sec==="p2"){
      var selP2=ans.p2[qi];
      return(<div style={{padding:"20px 16px",minHeight:"100vh"}}>
        {header}
        {aState==="ready"&&<div style={{textAlign:"center",marginTop:40}}>
          <button onClick={playP2} style={{width:70,height:70,borderRadius:"50%",border:"none",background:"linear-gradient(135deg,#f59e0b,#ef4444)",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",margin:"0 auto"}}><span style={{fontSize:28}}>{"▶️"}</span></button>
          <p style={{color:"var(--t2)",fontSize:12,marginTop:8}}>Tap to play — listen and choose</p></div>}
        {(aState==="playing"||aState==="done")&&<div>
          {aState==="playing"&&<div style={{textAlign:"center",marginBottom:16}}>
            <p className="out" style={{color:"var(--orange)",fontSize:13,animation:"pulse 1.5s infinite"}}>🔊 {curOpt>=0?"Response "+String.fromCharCode(65+curOpt)+"...":"Question..."}</p></div>}
          {aState==="done"&&selP2<0&&<div style={{textAlign:"center",marginBottom:16}}>
            <p className="out" style={{color:"var(--green)",fontSize:13}}>Audio complete — choose your answer</p></div>}
          <div style={{display:"flex",flexDirection:"column",gap:12,maxWidth:280,margin:"20px auto 0"}}>
            {["A","B","C"].map(function(letter,i){var sel=selP2===i;var playing2=aState==="playing"&&curOpt===i;return(<button key={i} onClick={function(){if(selP2<0)pick(i);}} style={{padding:"20px",background:sel?"rgba(var(--cx),.2)":playing2?"rgba(245,158,11,.1)":"var(--bg2)",border:"2px solid "+(sel?"var(--cyan)":playing2?"var(--orange)":"var(--bdr)"),borderRadius:14,cursor:selP2<0?"pointer":"default",textAlign:"center",fontFamily:"'Cinzel','Outfit',serif",transition:"all .15s"}}>
              <div className="out" style={{fontSize:28,fontWeight:900,color:sel?"var(--cyan)":playing2?"var(--orange)":"var(--t2)"}}>{letter}</div>
            </button>);})}
          </div>
        </div>}
      </div>);
    }

    // ── P3: Conversations ──
    if(sec==="p3"){
      var c3=LP3[qi];var q3=c3.qs[sqi];
      return(<div style={{padding:"20px 16px",minHeight:"100vh"}}>
        {header}
        <div style={{fontSize:11,color:"var(--t3)",marginBottom:8}}>Conversation {qi+1}/{LP3.length} — Question {sqi+1}/{c3.qs.length}</div>
        {aState==="ready"&&<div style={{textAlign:"center",marginTop:20,marginBottom:20}}>
          <div className="crd" style={{padding:12,marginBottom:16,textAlign:"left"}}>
            <div style={{fontSize:11,color:"var(--t3)",marginBottom:6}}>Preview questions:</div>
            {c3.qs.map(function(qq,i){return(<div key={i} style={{fontSize:12,color:"var(--t2)",lineHeight:1.6}}>{i+1}. {qq.q}</div>);})}
          </div>
          <button onClick={playP3} style={{width:70,height:70,borderRadius:"50%",border:"none",background:"linear-gradient(135deg,#8b5cf6,#ec4899)",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",margin:"0 auto"}}><span style={{fontSize:28}}>▶️</span></button>
          <p style={{color:"var(--t2)",fontSize:12,marginTop:8}}>Play conversation</p></div>}
        {aState==="playing"&&<div style={{textAlign:"center",marginTop:30}}><div style={{fontSize:40,animation:"pulse 1.5s infinite"}}>🗣️</div><p className="out" style={{color:"var(--purple)",fontSize:13,marginTop:8}}>Listening to conversation...</p></div>}
        {aState==="done"&&<div style={{animation:"fadeIn .3s"}}>
          <h3 className="out" style={{fontWeight:700,fontSize:15,lineHeight:1.5,marginBottom:16}}>{q3.q}</h3>
          <div style={{display:"flex",flexDirection:"column",gap:8}}>
            {q3.opts.map(function(opt,i){var sel=ans.p3[qi][sqi]===i;return(<button key={i} onClick={function(){pick(i);}} style={{display:"flex",alignItems:"center",gap:10,padding:"12px 14px",background:sel?"rgba(var(--cx),.15)":"var(--bg2)",border:"1px solid "+(sel?"var(--cyan)":"var(--bdr)"),borderRadius:12,cursor:"pointer",fontSize:13,color:"var(--t1)",textAlign:"left",fontFamily:"'DM Sans',sans-serif"}}>
              <div style={{width:26,height:26,borderRadius:"50%",border:"2px solid "+(sel?"var(--cyan)":"var(--t3)"),display:"flex",alignItems:"center",justifyContent:"center",fontSize:11,fontWeight:700,flexShrink:0,background:sel?"var(--cyan)":"transparent",color:sel?"#fff":"var(--t3)"}}>{String.fromCharCode(65+i)}</div>
              <span>{opt}</span></button>);})}
          </div></div>}
      </div>);
    }

    // ── P4: Talks ──
    if(sec==="p4"){
      var t4=LP4[qi];var q4=t4.qs[sqi];
      return(<div style={{padding:"20px 16px",minHeight:"100vh"}}>
        {header}
        <div style={{fontSize:11,color:"var(--t3)",marginBottom:8}}>Talk {qi+1}/{LP4.length} ({t4.type}) — Question {sqi+1}/{t4.qs.length}</div>
        {aState==="ready"&&<div style={{textAlign:"center",marginTop:20,marginBottom:20}}>
          <div className="crd" style={{padding:12,marginBottom:16,textAlign:"left"}}>
            <div style={{fontSize:11,color:"var(--t3)",marginBottom:6}}>Preview questions:</div>
            {t4.qs.map(function(qq,i){return(<div key={i} style={{fontSize:12,color:"var(--t2)",lineHeight:1.6}}>{i+1}. {qq.q}</div>);})}
          </div>
          <button onClick={playP4} style={{width:70,height:70,borderRadius:"50%",border:"none",background:"linear-gradient(135deg,#06b6d4,#3b82f6)",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",margin:"0 auto"}}><span style={{fontSize:28}}>▶️</span></button>
          <p style={{color:"var(--t2)",fontSize:12,marginTop:8}}>Play talk</p></div>}
        {aState==="playing"&&<div style={{textAlign:"center",marginTop:30}}><div style={{fontSize:40,animation:"pulse 1.5s infinite"}}>🎤</div><p className="out" style={{color:"var(--cyan)",fontSize:13,marginTop:8}}>Listening to talk...</p></div>}
        {aState==="done"&&<div style={{animation:"fadeIn .3s"}}>
          <h3 className="out" style={{fontWeight:700,fontSize:15,lineHeight:1.5,marginBottom:16}}>{q4.q}</h3>
          <div style={{display:"flex",flexDirection:"column",gap:8}}>
            {q4.opts.map(function(opt,i){var sel=ans.p4[qi][sqi]===i;return(<button key={i} onClick={function(){pick(i);}} style={{display:"flex",alignItems:"center",gap:10,padding:"12px 14px",background:sel?"rgba(var(--cx),.15)":"var(--bg2)",border:"1px solid "+(sel?"var(--cyan)":"var(--bdr)"),borderRadius:12,cursor:"pointer",fontSize:13,color:"var(--t1)",textAlign:"left",fontFamily:"'DM Sans',sans-serif"}}>
              <div style={{width:26,height:26,borderRadius:"50%",border:"2px solid "+(sel?"var(--cyan)":"var(--t3)"),display:"flex",alignItems:"center",justifyContent:"center",fontSize:11,fontWeight:700,flexShrink:0,background:sel?"var(--cyan)":"transparent",color:sel?"#fff":"var(--t3)"}}>{String.fromCharCode(65+i)}</div>
              <span>{opt}</span></button>);})}
          </div></div>}
      </div>);
    }

    // ── P5: Incomplete Sentences ──
    if(sec==="p5"){
      var q5=RP5[qi];var sel5=ans.p5[qi];
      return(<div style={{padding:"20px 16px",minHeight:"100vh"}}>
        {header}
        <h3 className="out" style={{fontWeight:700,fontSize:16,lineHeight:1.5,marginBottom:20}}>{q5.s}</h3>
        <div style={{display:"flex",flexDirection:"column",gap:10}}>
          {q5.o.map(function(opt,i){var isSel=sel5===i;return(<button key={i} onClick={function(){pick(i);}} style={{display:"flex",alignItems:"center",gap:12,padding:"14px 16px",background:isSel?"rgba(var(--cx),.15)":"var(--bg2)",border:"1px solid "+(isSel?"var(--cyan)":"var(--bdr)"),borderRadius:12,cursor:"pointer",fontSize:14,color:"var(--t1)",textAlign:"left",fontFamily:"'DM Sans',sans-serif"}}>
            <div style={{width:26,height:26,borderRadius:"50%",border:"2px solid "+(isSel?"var(--cyan)":"var(--t3)"),display:"flex",alignItems:"center",justifyContent:"center",fontSize:11,fontWeight:700,flexShrink:0,background:isSel?"var(--cyan)":"transparent",color:isSel?"#fff":"var(--t3)"}}>{String.fromCharCode(65+i)}</div>
            <span>{opt}</span></button>);})}
        </div>
      </div>);
    }

    // ── P6: Text Completion ──
    if(sec==="p6"){
      var t6=RP6[qi];var blanks6=[];var blankNum=0;
      t6.parts.forEach(function(pt){if(pt.blank){blanks6.push(pt);blankNum++;}});
      var bl6=blanks6[sqi];var sel6=ans.p6[qi][sqi];
      var renderedText=[];t6.parts.forEach(function(pt,pi){
        if(pt.blank){var bIdx=blanks6.indexOf(pt)+1;renderedText.push(<span key={pi} style={{padding:"2px 8px",borderRadius:4,background:bIdx-1===sqi?"rgba(var(--cx),.2)":"rgba(100,100,100,.15)",fontWeight:700,color:bIdx-1===sqi?"var(--cyan)":"var(--t2)"}}>{"["+bIdx+"]"}</span>);}
        else renderedText.push(<span key={pi}>{pt.text}</span>);
      });
      return(<div style={{padding:"20px 16px",minHeight:"100vh"}}>
        {header}
        <div style={{fontSize:11,color:"var(--t3)",marginBottom:8}}>{t6.type} — Blank {sqi+1}/{blankNum}</div>
        <div className="crd" style={{padding:14,marginBottom:16,maxHeight:200,overflowY:"auto",lineHeight:1.7,fontSize:12,whiteSpace:"pre-wrap"}}>{renderedText}</div>
        <div style={{display:"flex",flexDirection:"column",gap:8}}>
          {bl6.options.map(function(opt,i){var isSel=sel6===i;return(<button key={i} onClick={function(){pick(i);}} style={{display:"flex",alignItems:"center",gap:10,padding:"12px 14px",background:isSel?"rgba(var(--cx),.15)":"var(--bg2)",border:"1px solid "+(isSel?"var(--cyan)":"var(--bdr)"),borderRadius:12,cursor:"pointer",fontSize:13,color:"var(--t1)",textAlign:"left",fontFamily:"'DM Sans',sans-serif"}}>
            <div style={{width:26,height:26,borderRadius:"50%",border:"2px solid "+(isSel?"var(--cyan)":"var(--t3)"),display:"flex",alignItems:"center",justifyContent:"center",fontSize:11,fontWeight:700,flexShrink:0,background:isSel?"var(--cyan)":"transparent",color:isSel?"#fff":"var(--t3)"}}>{String.fromCharCode(65+i)}</div>
            <span>{opt}</span></button>);})}
        </div>
      </div>);
    }

    // ── P7: Reading Comprehension ──
    if(sec==="p7"){
      var ps7=RP7[qi];var pq7=ps7.questions[sqi];var sel7=ans.p7[qi][sqi];
      return(<div style={{padding:"20px 16px",minHeight:"100vh"}}>
        {header}
        <div style={{display:"flex",justifyContent:"space-between",marginBottom:8}}>
          <span style={{fontSize:11,color:"var(--t3)"}}>{ps7.type}</span>
          <span style={{fontSize:11,color:"var(--cyan)"}}>Q {sqi+1}/{ps7.questions.length}</span>
        </div>
        <div className="crd" style={{padding:14,marginBottom:16,maxHeight:200,overflowY:"auto",lineHeight:1.7,fontSize:12,whiteSpace:"pre-wrap"}}>{ps7.text}</div>
        <h3 className="out" style={{fontWeight:700,fontSize:15,lineHeight:1.5,marginBottom:16}}>{pq7.q}</h3>
        <div style={{display:"flex",flexDirection:"column",gap:8}}>
          {pq7.options.map(function(opt,i){var isSel=sel7===i;return(<button key={i} onClick={function(){pick(i);}} style={{display:"flex",alignItems:"center",gap:10,padding:"12px 14px",background:isSel?"rgba(var(--cx),.15)":"var(--bg2)",border:"1px solid "+(isSel?"var(--cyan)":"var(--bdr)"),borderRadius:12,cursor:"pointer",fontSize:13,color:"var(--t1)",textAlign:"left",fontFamily:"'DM Sans',sans-serif"}}>
            <div style={{width:26,height:26,borderRadius:"50%",border:"2px solid "+(isSel?"var(--cyan)":"var(--t3)"),display:"flex",alignItems:"center",justifyContent:"center",fontSize:11,fontWeight:700,flexShrink:0,background:isSel?"var(--cyan)":"transparent",color:isSel?"#fff":"var(--t3)"}}>{String.fromCharCode(65+i)}</div>
            <span>{opt}</span></button>);})}
        </div>
      </div>);
    }
  }

  // ═══ RESULTS ═══
  if(phase==="done"&&result&&!revMode){
    var pct=Math.round(result.score/result.total*100);
    var grade=result.toeicEstimate>=800?"Legendary!":result.toeicEstimate>=600?"Excellent!":result.toeicEstimate>=400?"Good effort!":"Keep training!";
    var gradeIcon=result.toeicEstimate>=800?"👑":result.toeicEstimate>=600?"⚔️":result.toeicEstimate>=400?"🛡️":"📖";
    var gradeCol=result.toeicEstimate>=800?"var(--gold)":result.toeicEstimate>=600?"var(--green)":result.toeicEstimate>=400?"var(--orange)":"var(--red)";
    var xp=Math.round(result.toeicEstimate*1.5)+(result.toeicEstimate>=800?200:result.toeicEstimate>=600?100:0);

    return(<div className="enter" style={{padding:"20px 16px 100px",minHeight:"100vh",textAlign:"center"}}>
      <div style={{fontSize:64,marginBottom:12,animation:"countUp .6s"}}>{gradeIcon}</div>
      <h1 className="out" style={{fontWeight:900,fontSize:26,background:"linear-gradient(135deg,#dc2626,#f59e0b)",WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent",marginBottom:4}}>THE FINAL ARENA</h1>
      <p style={{color:gradeCol,fontWeight:700,fontSize:16,marginBottom:20}}>{grade}</p>

      <div className="crd glo" style={{padding:20,marginBottom:16,textAlign:"center"}}>
        <div style={{fontSize:11,color:"var(--t3)",textTransform:"uppercase",letterSpacing:1,marginBottom:4}}>Estimated TOEIC Score</div>
        <div className="out" style={{fontSize:52,fontWeight:900,color:"var(--gold)",lineHeight:1}}>{result.toeicEstimate}</div>
        <div style={{fontSize:13,color:"var(--t2)",marginTop:4}}>/ 990</div>
      </div>

      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginBottom:16}}>
        <div className="crd" style={{padding:14,textAlign:"center"}}>
          <div style={{fontSize:11,color:"var(--orange)",fontWeight:600,marginBottom:4}}>Listening</div>
          <div className="out" style={{fontSize:28,fontWeight:900,color:"var(--orange)"}}>{result.listening.toeic}</div>
          <div style={{fontSize:10,color:"var(--t3)"}}>{result.listening.score}/{result.listening.total} ({Math.round(result.listening.score/result.listening.total*100)}%)</div>
        </div>
        <div className="crd" style={{padding:14,textAlign:"center"}}>
          <div style={{fontSize:11,color:"var(--green)",fontWeight:600,marginBottom:4}}>Reading</div>
          <div className="out" style={{fontSize:28,fontWeight:900,color:"var(--green)"}}>{result.reading.toeic}</div>
          <div style={{fontSize:10,color:"var(--t3)"}}>{result.reading.score}/{result.reading.total} ({Math.round(result.reading.score/result.reading.total*100)}%)</div>
        </div>
      </div>

      <div className="crd" style={{padding:14,marginBottom:16,textAlign:"left"}}>
        <div style={{fontSize:12,fontWeight:700,color:"var(--t2)",marginBottom:8}}>Breakdown</div>
        {[{l:"P1 Photos",d:result.listening.p1},{l:"P2 Q&R",d:result.listening.p2},{l:"P3 Convos",d:result.listening.p3},{l:"P4 Talks",d:result.listening.p4},{l:"P5 Sentences",d:result.reading.p5},{l:"P6 Text",d:result.reading.p6},{l:"P7 Reading",d:result.reading.p7}].map(function(s){
          var sp=s.d.total>0?Math.round(s.d.score/s.d.total*100):0;
          var sc=sp>=70?"var(--green)":sp>=50?"var(--orange)":"var(--red)";
          return(<div key={s.l} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"5px 0",borderBottom:"1px solid var(--bdr)"}}>
            <span style={{fontSize:12,color:"var(--t1)"}}>{s.l}</span>
            <div style={{display:"flex",alignItems:"center",gap:8}}>
              <span style={{fontSize:11,color:"var(--t3)"}}>{s.d.score}/{s.d.total}</span>
              <span className="out" style={{fontWeight:800,fontSize:13,color:sc}}>{sp}%</span>
            </div></div>);
        })}
      </div>

      <div style={{display:"flex",gap:8,marginBottom:16}}>
        <div className="crd" style={{flex:1,padding:12,textAlign:"center"}}><div className="out" style={{fontSize:18,fontWeight:800,color:"var(--purple)"}}>{fmtT(result.timeUsed)}</div><div style={{fontSize:10,color:"var(--t3)"}}>Time used</div></div>
        <div className="crd" style={{flex:1,padding:12,textAlign:"center"}}><div className="out" style={{fontSize:18,fontWeight:800,color:"var(--cyan)"}}>{pct}%</div><div style={{fontSize:10,color:"var(--t3)"}}>Overall</div></div>
      </div>

      <div className="out" style={{fontSize:22,fontWeight:800,color:"var(--gold)",marginBottom:20}}>+{xp} XP</div>

      <button className="btn1" onClick={function(){setRevMode(true);setRevSec("p1");setRevIdx(0);}}>📖 Review Answers</button>
      <button className="btn2" onClick={function(){result.mockId="boss";p.done(result,xp);}} style={{marginTop:10,width:"100%",fontSize:16,padding:"14px 24px"}}>Save & Exit</button>
    </div>);
  }


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
            <span style={{fontWeight:700,color:isC?"var(--green)":isP?"var(--red)":"var(--t3)",fontSize:12}}>{isC?"✓":isP?"✗":String.fromCharCode(65+i)}</span>
            <span style={{color:"var(--t1)"}}>{typeof opt==="string"&&opt.length>80?opt.substring(0,77)+"…":opt}</span></div>);
        })}
      </div>);
    }

    // ── P1: Photos ──
    if(revSec==="p1"){
      var it=LP1[revIdx];rAnswer=ans.p1[revIdx];rCorrect=it.c;rExpl=it.x;
      rLabel="Part 1 — Photo "+(revIdx+1);
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
      rLabel="Part 2 — Q"+(revIdx+1);
      rItem=(<div>
        <div className="crd" style={{padding:12,marginBottom:12,background:"rgba(var(--cx),.06)",borderColor:"rgba(var(--cx),.15)"}}>
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
      rLabel="Part 3 — Convo "+(ci3+1)+", Q"+(qi3+1);
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
      rLabel="Part 4 — Talk "+(ti4+1)+" ("+talk.type+"), Q"+(qi4+1);
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
      rLabel="Part 5 — Q"+(revIdx+1);
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
      rLabel="Part 6 — Text "+(tIdx6+1)+", Blank "+(bIdx6+1);
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
      rLabel="Part 7 — Passage "+(pi7+1)+", Q"+(qi7+1);
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
        <button onClick={function(){setRevMode(false);}} style={{background:"none",border:"none",color:"var(--t2)",cursor:"pointer",fontSize:14}}>{"←"} Results</button>
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
        {!isFirst&&<button className="btn2" onClick={revPrev} style={{flex:1}}>{"←"} Prev</button>}
        <button className="btn1" onClick={revNext} style={{flex:1}}>{isLast?"Back to Results":"Next →"}</button>
      </div>
    </div>);
  }

  return null;
}

// ─── ENDLESS ARENA ───
function EndlessArena(p){
  var test=useMemo(function(){return generateEndlessTest();},[]);
  var LP1=test.p1,LP2=test.p2,LP3=test.p3,LP4=test.p4;
  var RP5=test.p5,RP6=test.p6,RP7=test.p7;
  var p3QC=0;LP3.forEach(function(c){p3QC+=c.qs.length;});
  var p4QC=0;LP4.forEach(function(t){p4QC+=t.qs.length;});
  var lisQ=LP1.length+LP2.length+p3QC+p4QC;
  var p6BC=0;RP6.forEach(function(t){t.parts.forEach(function(pt){if(pt.blank)p6BC++;});});
  var p7QC=0;RP7.forEach(function(ps){p7QC+=ps.questions.length;});
  var readQ=RP5.length+p6BC+p7QC;
  var totalQ=lisQ+readQ;
  var TOTAL_TIME=120*60;
  var ENDLESS_STORAGE_KEY="endlessArenaSession";

  // ── Audio path builder — detect training vs boss items ──
  function isBoss(id){return id&&id.charAt(0)==="b";}
  function bossIdx(id){return parseInt(id.replace(/^bp\d_/,""),10);}

  // ── Restore saved session ──
  var saved=useMemo(function(){try{var raw=localStorage.getItem(ENDLESS_STORAGE_KEY);if(!raw)return null;var d=JSON.parse(raw);if(d.date!==today())return null;if(!d.ans||!d.sec||d.timeLeft==null)return null;return d;}catch(e){return null;}},[]);

  var freshAns=function(){return{
    p1:LP1.map(function(){return -1;}),p2:LP2.map(function(){return -1;}),
    p3:LP3.map(function(c){return c.qs.map(function(){return -1;});}),
    p4:LP4.map(function(t){return t.qs.map(function(){return -1;});}),
    p5:RP5.map(function(){return -1;}),
    p6:RP6.map(function(t){var n=0;t.parts.forEach(function(pt){if(pt.blank)n++;});return Array(n).fill(-1);}),
    p7:RP7.map(function(ps){return ps.questions.map(function(){return -1;});})
  };};

  var[phase,setPhase]=useState(saved?"resume":"intro");
  var[sec,setSec]=useState(saved?saved.sec:"p1");
  var[qi,setQi]=useState(saved?saved.qi:0);
  var[sqi,setSqi]=useState(saved?saved.sqi:0);
  var[ans,setAns]=useState(function(){return saved?saved.ans:freshAns();});
  var[timeLeft,setTimeLeft]=useState(saved?saved.timeLeft:TOTAL_TIME);

  function saveSession(a,s,q,sq,tl){try{localStorage.setItem(ENDLESS_STORAGE_KEY,JSON.stringify({date:today(),ans:a,sec:s,qi:q,sqi:sq,timeLeft:tl}));}catch(e){}}
  function clearSession(){try{localStorage.removeItem(ENDLESS_STORAGE_KEY);}catch(e){}}
  useEffect(function(){resumeAudioSession();return stopListenAudio;},[]);
  var[result,setResult]=useState(null);
  var[aState,setAState]=useState("ready");
  var[curOpt,setCurOpt]=useState(-1);
  var timerRef=useRef(null);

  useEffect(function(){
    if(phase!=="test"||result)return;
    if(timeLeft<=0){doSubmit();return;}
    timerRef.current=setTimeout(function(){setTimeLeft(timeLeft-1);},1000);
    return function(){clearTimeout(timerRef.current);};
  });

  // ── Auto-save session ──
  var stateRef=useRef({ans:ans,sec:sec,qi:qi,sqi:sqi,timeLeft:timeLeft,phase:phase});
  stateRef.current={ans:ans,sec:sec,qi:qi,sqi:sqi,timeLeft:timeLeft,phase:phase};
  useEffect(function(){
    if(phase!=="test"||result)return;
    var id=setTimeout(function(){saveSession(ans,sec,qi,sqi,timeLeft);},5000);
    return function(){clearTimeout(id);};
  });
  useEffect(function(){
    function onUnload(){var s=stateRef.current;if(s.phase==="test")saveSession(s.ans,s.sec,s.qi,s.sqi,s.timeLeft);}
    window.addEventListener("beforeunload",onUnload);
    return function(){window.removeEventListener("beforeunload",onUnload);};
  },[]);

  function fmtT(s){var m=Math.floor(s/60);var sc2=s%60;return m+":"+(sc2<10?"0":"")+sc2;}

  // ── Audio — dynamic paths based on item origin ──
  async function playP1(){if(aState!=="ready")return;setAState("playing");var it=LP1[qi];for(var i=0;i<it.opts.length;i++){setCurOpt(i);if(isBoss(it.id)){await playAudioFile("/audio/boss/p1_"+String(bossIdx(it.id)).padStart(2,"0")+"_"+i+".mp3");}else{await playAudioFile("/audio/p1/"+it.id+"_"+i+".mp3");}await new Promise(function(r){setTimeout(r,400);});}setCurOpt(-1);setAState("done");}
  async function playP2(){if(aState!=="ready")return;setAState("playing");var it=LP2[qi];if(isBoss(it.id)){var bid=String(bossIdx(it.id)).padStart(2,"0");await playAudioFile("/audio/boss/p2_"+bid+"_q.mp3");await new Promise(function(r){setTimeout(r,400);});for(var i=0;i<3;i++){setCurOpt(i);await playAudioFile("/audio/boss/p2_"+bid+"_"+i+".mp3");await new Promise(function(r){setTimeout(r,300);});};}else{await playAudioFile("/audio/p2/"+it.id+"_q.mp3");await new Promise(function(r){setTimeout(r,400);});for(var i2=0;i2<3;i2++){setCurOpt(i2);await playAudioFile("/audio/p2/"+it.id+"_"+i2+".mp3");await new Promise(function(r){setTimeout(r,300);});}}setCurOpt(-1);setAState("done");}
  async function playP3(){if(aState!=="ready")return;setAState("playing");var it=LP3[qi];if(isBoss(it.id)){await playAudioFile("/audio/boss/p3_"+String(bossIdx(it.id)).padStart(2,"0")+".mp3");}else{await playAudioFile("/audio/p3/"+it.id+".mp3");}setAState("done");}
  async function playP4(){if(aState!=="ready")return;setAState("playing");var it=LP4[qi];if(isBoss(it.id)){await playAudioFile("/audio/boss/p4_"+String(bossIdx(it.id)).padStart(2,"0")+".mp3");}else{await playAudioFile("/audio/p4/"+it.id+".mp3");}setAState("done");}

  // ── Answer & Navigate ──
  function pick(val){
    var a=JSON.parse(JSON.stringify(ans));
    if(sec==="p1")a.p1[qi]=val;
    else if(sec==="p2")a.p2[qi]=val;
    else if(sec==="p3")a.p3[qi][sqi]=val;
    else if(sec==="p4")a.p4[qi][sqi]=val;
    else if(sec==="p5")a.p5[qi]=val;
    else if(sec==="p6")a.p6[qi][sqi]=val;
    else if(sec==="p7")a.p7[qi][sqi]=val;
    setAns(a);setTimeout(nxt,300);
  }
  function nxt(){
    if(sec==="p1"){if(qi<LP1.length-1){setQi(qi+1);setAState("ready");setCurOpt(-1);}else{setSec("p2");setQi(0);setSqi(0);setAState("ready");setCurOpt(-1);}}
    else if(sec==="p2"){if(qi<LP2.length-1){setQi(qi+1);setAState("ready");setCurOpt(-1);}else{setSec("p3");setQi(0);setSqi(0);setAState("ready");}}
    else if(sec==="p3"){if(sqi<LP3[qi].qs.length-1)setSqi(sqi+1);else if(qi<LP3.length-1){setQi(qi+1);setSqi(0);setAState("ready");}else{setSec("p4");setQi(0);setSqi(0);setAState("ready");}}
    else if(sec==="p4"){if(sqi<LP4[qi].qs.length-1)setSqi(sqi+1);else if(qi<LP4.length-1){setQi(qi+1);setSqi(0);setAState("ready");}else{setSec("p5");setQi(0);setSqi(0);}}
    else if(sec==="p5"){if(qi<RP5.length-1)setQi(qi+1);else{setSec("p6");setQi(0);setSqi(0);}}
    else if(sec==="p6"){var bN=ans.p6[qi].length;if(sqi<bN-1)setSqi(sqi+1);else if(qi<RP6.length-1){setQi(qi+1);setSqi(0);}else{setSec("p7");setQi(0);setSqi(0);}}
    else if(sec==="p7"){if(sqi<RP7[qi].questions.length-1)setSqi(sqi+1);else if(qi<RP7.length-1){setQi(qi+1);setSqi(0);}else doSubmit();}
  }

  // ── Scoring ──
  function doSubmit(){
    clearTimeout(timerRef.current);clearSession();
    var p1s=0;LP1.forEach(function(q,i){if(ans.p1[i]===q.c)p1s++;});
    var p2s=0;LP2.forEach(function(q,i){if(ans.p2[i]===q.c)p2s++;});
    var p3s=0;LP3.forEach(function(c,i){c.qs.forEach(function(q,j){if(ans.p3[i][j]===q.c)p3s++;});});
    var p4s=0;LP4.forEach(function(t,i){t.qs.forEach(function(q,j){if(ans.p4[i][j]===q.c)p4s++;});});
    var lRaw=p1s+p2s+p3s+p4s;var lT=estimateToeic(lRaw,lisQ);
    var p5s=0;RP5.forEach(function(q,i){if(ans.p5[i]===q.c)p5s++;});
    var p6s=0;RP6.forEach(function(t,ti){var bi=0;t.parts.forEach(function(pt){if(pt.blank){if(ans.p6[ti][bi]===pt.correct)p6s++;bi++;}});});
    var p7s=0;RP7.forEach(function(ps,pi){ps.questions.forEach(function(q,qi2){if(ans.p7[pi][qi2]===q.correct)p7s++;});});
    var rRaw=p5s+p6s+p7s;var rT=estimateToeic(rRaw,readQ);

    // Per-part accuracy for weakest detection
    var partAcc={1:LP1.length>0?p1s/LP1.length:1,2:LP2.length>0?p2s/LP2.length:1,3:p3QC>0?p3s/p3QC:1,4:p4QC>0?p4s/p4QC:1,5:RP5.length>0?p5s/RP5.length:1,6:p6BC>0?p6s/p6BC:1,7:p7QC>0?p7s/p7QC:1};
    var weakestPart=1;var weakestAcc=partAcc[1];
    for(var pp=2;pp<=7;pp++){
      if(partAcc[pp]<weakestAcc||(partAcc[pp]===weakestAcc&&pp<=4&&weakestPart>4)){weakestPart=pp;weakestAcc=partAcc[pp];}
    }

    var toeicEst=lT+rT;
    var res={date:today(),score:lRaw+rRaw,total:totalQ,toeicEstimate:toeicEst,
      listening:{score:lRaw,total:lisQ,toeic:lT,p1:{score:p1s,total:LP1.length},p2:{score:p2s,total:LP2.length},p3:{score:p3s,total:p3QC},p4:{score:p4s,total:p4QC}},
      reading:{score:rRaw,total:readQ,toeic:rT,p5:{score:p5s,total:RP5.length},p6:{score:p6s,total:p6BC},p7:{score:p7s,total:p7QC}},
      weakestPart:weakestPart,weakestAccuracy:weakestAcc,timeUsed:TOTAL_TIME-timeLeft};
    setResult(res);setPhase("done");
  }

  // ── Progress ──
  var answered=0;
  ans.p1.forEach(function(a){if(a>=0)answered++;});ans.p2.forEach(function(a){if(a>=0)answered++;});
  ans.p3.forEach(function(c){c.forEach(function(a){if(a>=0)answered++;});});ans.p4.forEach(function(t){t.forEach(function(a){if(a>=0)answered++;});});
  ans.p5.forEach(function(a){if(a>=0)answered++;});ans.p6.forEach(function(t){t.forEach(function(a){if(a>=0)answered++;});});
  ans.p7.forEach(function(ps){ps.forEach(function(a){if(a>=0)answered++;});});

  var secLabel=sec==="p1"?"Part 1 — Photos":sec==="p2"?"Part 2 — Q&R":sec==="p3"?"Part 3 — Conversations":sec==="p4"?"Part 4 — Talks":sec==="p5"?"Part 5 — Sentences":sec==="p6"?"Part 6 — Text Completion":"Part 7 — Reading";
  var isListening=sec==="p1"||sec==="p2"||sec==="p3"||sec==="p4";

  // ═══ RESUME ═══
  if(phase==="resume"&&saved){
    var rAnswered=0;
    saved.ans.p1.forEach(function(a){if(a>=0)rAnswered++;});saved.ans.p2.forEach(function(a){if(a>=0)rAnswered++;});
    saved.ans.p3.forEach(function(c){c.forEach(function(a){if(a>=0)rAnswered++;});});saved.ans.p4.forEach(function(t){t.forEach(function(a){if(a>=0)rAnswered++;});});
    saved.ans.p5.forEach(function(a){if(a>=0)rAnswered++;});saved.ans.p6.forEach(function(t){t.forEach(function(a){if(a>=0)rAnswered++;});});
    saved.ans.p7.forEach(function(ps){ps.forEach(function(a){if(a>=0)rAnswered++;});});
    return(<div className="enter" style={{padding:"20px 16px",minHeight:"100vh",display:"flex",flexDirection:"column",justifyContent:"center",textAlign:"center"}}>
      <div style={{fontSize:56,marginBottom:12}}>{"⏳"}</div>
      <h1 className="out" style={{fontWeight:900,fontSize:24,marginBottom:8}}>Session in progress</h1>
      <p style={{color:"var(--t2)",fontSize:14,marginBottom:24}}>You have an unfinished Endless Arena attempt from today.</p>
      <div className="crd" style={{padding:16,marginBottom:24,textAlign:"left"}}>
        <div style={{display:"flex",justifyContent:"space-between",marginBottom:8}}><span style={{color:"var(--t2)",fontSize:13}}>Progress</span><span className="out" style={{fontWeight:700,color:"var(--endless)",fontSize:14}}>{rAnswered}/{totalQ} answered</span></div>
        <Bar value={rAnswered} max={totalQ} h={6} color="linear-gradient(90deg,#0a3a6e,#1B70CF)"/>
        <div style={{display:"flex",justifyContent:"space-between",marginTop:10}}><span style={{color:"var(--t2)",fontSize:13}}>Time remaining</span><span className="out" style={{fontWeight:700,color:saved.timeLeft>600?"var(--endless)":"var(--orange)",fontSize:14}}>{fmtT(saved.timeLeft)}</span></div>
      </div>
      <button className="btn1" style={{background:"linear-gradient(135deg,#1B70CF,#4a9fe0)",fontSize:16,padding:"14px 28px",marginBottom:12}} onClick={function(){stopBGM();setPhase("test");}}>Resume session</button>
      <button className="btn2" style={{marginBottom:8}} onClick={function(){clearSession();setAns(freshAns());setSec("p1");setQi(0);setSqi(0);setTimeLeft(TOTAL_TIME);setPhase("intro");}}>Start over</button>
      <button className="btn2" onClick={p.back}>Back</button>
    </div>);
  }

  // ═══ INTRO ═══
  if(phase==="intro"){
    return(<div className="enter" style={{padding:"20px 16px",minHeight:"100vh",display:"flex",flexDirection:"column",justifyContent:"center",textAlign:"center"}}>
      <div style={{fontSize:64,marginBottom:12,animation:"pulse 2s infinite"}}>{"⏳"}</div>
      <h1 className="out" style={{fontWeight:900,fontSize:28,background:"linear-gradient(90deg,#7fb8e8,#4a9fe0,#d4943a)",WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent",marginBottom:4}}>ENDLESS ARENA</h1>
      <p style={{color:"var(--t2)",fontSize:14,fontStyle:"italic",marginBottom:20}}>the arena never sleeps</p>
      <div className="crd" style={{textAlign:"left",padding:16,marginBottom:16}}>
        <div style={{fontSize:11,color:"var(--orange)",fontWeight:700,textTransform:"uppercase",letterSpacing:1,marginBottom:8}}>{"🔊"} Listening Section</div>
        <div style={{fontSize:13,color:"var(--t1)",lineHeight:1.8}}>
          <div style={{display:"flex",justifyContent:"space-between"}}><span>Part 1 — Photographs</span><span className="out" style={{color:"var(--endless)"}}>{LP1.length} Q</span></div>
          <div style={{display:"flex",justifyContent:"space-between"}}><span>Part 2 — Question-Response</span><span className="out" style={{color:"var(--endless)"}}>{LP2.length} Q</span></div>
          <div style={{display:"flex",justifyContent:"space-between"}}><span>Part 3 — Conversations</span><span className="out" style={{color:"var(--endless)"}}>{p3QC} Q</span></div>
          <div style={{display:"flex",justifyContent:"space-between"}}><span>Part 4 — Talks</span><span className="out" style={{color:"var(--endless)"}}>{p4QC} Q</span></div>
          <div style={{borderTop:"1px solid var(--bdr)",marginTop:6,paddingTop:6,display:"flex",justifyContent:"space-between",fontWeight:700}}><span>Subtotal</span><span style={{color:"var(--gold)"}}>{lisQ} Q</span></div>
        </div>
      </div>
      <div className="crd" style={{textAlign:"left",padding:16,marginBottom:16}}>
        <div style={{fontSize:11,color:"var(--green)",fontWeight:700,textTransform:"uppercase",letterSpacing:1,marginBottom:8}}>{"📖"} Reading Section</div>
        <div style={{fontSize:13,color:"var(--t1)",lineHeight:1.8}}>
          <div style={{display:"flex",justifyContent:"space-between"}}><span>Part 5 — Incomplete Sentences</span><span className="out" style={{color:"var(--endless)"}}>{RP5.length} Q</span></div>
          <div style={{display:"flex",justifyContent:"space-between"}}><span>Part 6 — Text Completion</span><span className="out" style={{color:"var(--endless)"}}>{p6BC} Q</span></div>
          <div style={{display:"flex",justifyContent:"space-between"}}><span>Part 7 — Reading Comprehension</span><span className="out" style={{color:"var(--endless)"}}>{p7QC} Q</span></div>
          <div style={{borderTop:"1px solid var(--bdr)",marginTop:6,paddingTop:6,display:"flex",justifyContent:"space-between",fontWeight:700}}><span>Subtotal</span><span style={{color:"var(--gold)"}}>{readQ} Q</span></div>
        </div>
      </div>
      <div className="crd glo" style={{padding:14,marginBottom:20}}>
        <div style={{display:"flex",justifyContent:"space-between",fontWeight:800,fontSize:15,color:"var(--t1)"}}><span>TOTAL</span><span className="out" style={{color:"var(--gold)"}}>{totalQ} questions {"·"} 120 min</span></div>
      </div>
      <div className="crd" style={{padding:14,marginBottom:24,borderColor:"rgba(27,112,207,.3)",background:"rgba(27,112,207,.06)"}}>
        <p style={{fontSize:12,color:"var(--endless)",lineHeight:1.6}}>{"⏳"} Randomly generated from the full content pool. No feedback during test. Your score and weakest part will be analyzed.</p>
      </div>
      <button className="btn1" style={{background:"linear-gradient(135deg,#1B70CF,#4a9fe0)",fontSize:18,padding:"16px 32px"}} onClick={function(){stopBGM();setPhase("test");}}>{"⏳"} Enter the Sanctuary</button>
      <button className="btn2" onClick={p.back} style={{marginTop:12,width:"100%"}}>Not ready yet</button>
    </div>);
  }

  // ═══ TEST PHASE ═══
  if(phase==="test"&&!result){
    var timerCol=timeLeft>600?"var(--endless)":timeLeft>120?"var(--orange)":"var(--red)";
    var header=(<div style={{marginBottom:16}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:8}}>
        <div style={{fontSize:11,color:isListening?"var(--orange)":"var(--green)",fontWeight:700,textTransform:"uppercase",letterSpacing:1}}>{isListening?"🔊 Listening":"📖 Reading"}</div>
        <div className="out" style={{fontSize:14,fontWeight:800,color:timerCol}}>{fmtT(timeLeft)}</div>
      </div>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:8}}>
        <span className="out" style={{fontSize:13,fontWeight:700}}>{secLabel}</span>
        <span style={{fontSize:11,color:"var(--t3)"}}>{answered}/{totalQ} answered</span>
      </div>
      <Bar value={answered} max={totalQ} h={4} color={isListening?"linear-gradient(90deg,#f59e0b,#1B70CF)":"linear-gradient(90deg,#22c55e,#1B70CF)"}/>
    </div>);

    // ── P1 ──
    if(sec==="p1"){
      var it=LP1[qi];var selP1=ans.p1[qi];
      return(<div style={{padding:"20px 16px",minHeight:"100vh"}}>
        {header}
        <div style={{marginBottom:12,borderRadius:14,overflow:"hidden",border:"1px solid var(--bdr)"}}>
          <img src={it.img} alt="TOEIC photo" style={{width:"100%",display:"block",maxHeight:240,objectFit:"cover"}}/>
        </div>
        {aState==="ready"&&<div style={{textAlign:"center",marginBottom:16}}>
          <button onClick={playP1} style={{width:70,height:70,borderRadius:"50%",border:"none",background:"linear-gradient(135deg,#1B70CF,#4a9fe0)",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",margin:"0 auto"}}><span style={{fontSize:28}}>{"▶️"}</span></button>
          <p style={{color:"var(--t2)",fontSize:12,marginTop:8}}>Tap to play — listen and choose</p></div>}
        {(aState==="playing"||aState==="done")&&<div>
          {aState==="playing"&&<div style={{textAlign:"center",marginBottom:12}}>
            <p className="out" style={{color:"var(--orange)",fontSize:13,animation:"pulse 1.5s infinite"}}>{"🔊"} Playing statement {String.fromCharCode(65+(curOpt>=0?curOpt:0))}...</p></div>}
          {aState==="done"&&selP1<0&&<div style={{textAlign:"center",marginBottom:12}}>
            <p className="out" style={{color:"var(--green)",fontSize:13}}>Audio complete — choose your answer</p></div>}
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
            {["A","B","C","D"].map(function(lbl,i){var isCur=curOpt===i;var isSel=selP1===i;return(<button key={i} onClick={function(){if(aState==="done"||aState==="playing")pick(i);}} style={{padding:"14px 8px",borderRadius:12,border:"2px solid "+(isSel?"var(--endless)":isCur?"var(--orange)":"var(--bdr)"),background:isSel?"rgba(27,112,207,.15)":isCur?"rgba(245,158,11,.1)":"var(--bg2)",cursor:"pointer",fontSize:16,fontWeight:800,color:isSel?"var(--endless)":isCur?"var(--orange)":"var(--t1)",fontFamily:"'Cinzel','Outfit',serif",animation:isCur?"pulse 1s infinite":"none"}}>{lbl}</button>);})}
          </div>
        </div>}
      </div>);
    }

    // ── P2 ──
    if(sec==="p2"){
      var selP2=ans.p2[qi];
      return(<div style={{padding:"20px 16px",minHeight:"100vh"}}>
        {header}
        <div style={{fontSize:12,color:"var(--t2)",marginBottom:16}}>Question {qi+1}/{LP2.length}</div>
        {aState==="ready"&&<div style={{textAlign:"center",marginBottom:16}}>
          <button onClick={playP2} style={{width:70,height:70,borderRadius:"50%",border:"none",background:"linear-gradient(135deg,#1B70CF,#4a9fe0)",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",margin:"0 auto"}}><span style={{fontSize:28}}>{"▶️"}</span></button>
          <p style={{color:"var(--t2)",fontSize:12,marginTop:8}}>Tap to play</p></div>}
        {(aState==="playing"||aState==="done")&&<div>
          {aState==="playing"&&<div style={{textAlign:"center",marginBottom:16}}>
            <p className="out" style={{color:"var(--orange)",fontSize:13,animation:"pulse 1.5s infinite"}}>{"🔊"} Playing{curOpt>=0?" response "+String.fromCharCode(65+curOpt):""}...</p></div>}
          {aState==="done"&&selP2<0&&<p className="out" style={{color:"var(--green)",fontSize:13,textAlign:"center",marginBottom:12}}>Choose your answer</p>}
          <div style={{display:"flex",flexDirection:"column",gap:8}}>
            {["A","B","C"].map(function(lbl,i){var isCur=curOpt===i;var isSel=selP2===i;return(<button key={i} onClick={function(){if(aState==="done"||aState==="playing")pick(i);}} style={{display:"flex",alignItems:"center",gap:10,padding:"14px",borderRadius:12,border:"2px solid "+(isSel?"var(--endless)":isCur?"var(--orange)":"var(--bdr)"),background:isSel?"rgba(27,112,207,.15)":isCur?"rgba(245,158,11,.1)":"var(--bg2)",cursor:"pointer",fontSize:16,fontWeight:800,color:isSel?"var(--endless)":isCur?"var(--orange)":"var(--t1)",fontFamily:"'Cinzel','Outfit',serif",animation:isCur?"pulse 1s infinite":"none"}}>{lbl}</button>);})}
          </div>
        </div>}
      </div>);
    }

    // ── P3 ──
    if(sec==="p3"){
      var conv=LP3[qi];var q3=conv.qs[sqi];var sel3=ans.p3[qi][sqi];
      return(<div style={{padding:"20px 16px",minHeight:"100vh"}}>
        {header}
        {sqi===0&&aState==="ready"&&<div style={{textAlign:"center",marginBottom:16}}>
          <button onClick={playP3} style={{width:70,height:70,borderRadius:"50%",border:"none",background:"linear-gradient(135deg,#1B70CF,#4a9fe0)",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",margin:"0 auto"}}><span style={{fontSize:28}}>{"▶️"}</span></button>
          <p style={{color:"var(--t2)",fontSize:12,marginTop:8}}>Listen to the conversation</p></div>}
        {sqi===0&&aState==="playing"&&<p className="out" style={{color:"var(--orange)",fontSize:13,textAlign:"center",marginBottom:12,animation:"pulse 1.5s infinite"}}>{"🔊"} Playing conversation...</p>}
        {(aState==="done"||sqi>0)&&<div>
          <h3 className="out" style={{fontWeight:700,fontSize:15,lineHeight:1.5,marginBottom:16}}>Q{sqi+1}. {q3.q}</h3>
          <div style={{display:"flex",flexDirection:"column",gap:8}}>
            {q3.opts.map(function(opt,i){var isSel=sel3===i;return(<button key={i} onClick={function(){pick(i);}} style={{display:"flex",alignItems:"center",gap:10,padding:"12px 14px",background:isSel?"rgba(27,112,207,.15)":"var(--bg2)",border:"1px solid "+(isSel?"var(--endless)":"var(--bdr)"),borderRadius:12,cursor:"pointer",fontSize:13,color:"var(--t1)",textAlign:"left",fontFamily:"'DM Sans',sans-serif"}}>
              <div style={{width:26,height:26,borderRadius:"50%",border:"2px solid "+(isSel?"var(--endless)":"var(--t3)"),display:"flex",alignItems:"center",justifyContent:"center",fontSize:11,fontWeight:700,flexShrink:0,background:isSel?"var(--endless)":"transparent",color:isSel?"#fff":"var(--t3)"}}>{String.fromCharCode(65+i)}</div>
              <span>{opt}</span></button>);})}
          </div>
        </div>}
      </div>);
    }

    // ── P4 ──
    if(sec==="p4"){
      var talk=LP4[qi];var q4=talk.qs[sqi];var sel4=ans.p4[qi][sqi];
      return(<div style={{padding:"20px 16px",minHeight:"100vh"}}>
        {header}
        {sqi===0&&aState==="ready"&&<div style={{textAlign:"center",marginBottom:16}}>
          <button onClick={playP4} style={{width:70,height:70,borderRadius:"50%",border:"none",background:"linear-gradient(135deg,#1B70CF,#4a9fe0)",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",margin:"0 auto"}}><span style={{fontSize:28}}>{"▶️"}</span></button>
          <p style={{color:"var(--t2)",fontSize:12,marginTop:8}}>Listen to the {talk.type||"talk"}</p></div>}
        {sqi===0&&aState==="playing"&&<p className="out" style={{color:"var(--orange)",fontSize:13,textAlign:"center",marginBottom:12,animation:"pulse 1.5s infinite"}}>{"🔊"} Playing...</p>}
        {(aState==="done"||sqi>0)&&<div>
          <h3 className="out" style={{fontWeight:700,fontSize:15,lineHeight:1.5,marginBottom:16}}>Q{sqi+1}. {q4.q}</h3>
          <div style={{display:"flex",flexDirection:"column",gap:8}}>
            {q4.opts.map(function(opt,i){var isSel=sel4===i;return(<button key={i} onClick={function(){pick(i);}} style={{display:"flex",alignItems:"center",gap:10,padding:"12px 14px",background:isSel?"rgba(27,112,207,.15)":"var(--bg2)",border:"1px solid "+(isSel?"var(--endless)":"var(--bdr)"),borderRadius:12,cursor:"pointer",fontSize:13,color:"var(--t1)",textAlign:"left",fontFamily:"'DM Sans',sans-serif"}}>
              <div style={{width:26,height:26,borderRadius:"50%",border:"2px solid "+(isSel?"var(--endless)":"var(--t3)"),display:"flex",alignItems:"center",justifyContent:"center",fontSize:11,fontWeight:700,flexShrink:0,background:isSel?"var(--endless)":"transparent",color:isSel?"#fff":"var(--t3)"}}>{String.fromCharCode(65+i)}</div>
              <span>{opt}</span></button>);})}
          </div>
        </div>}
      </div>);
    }

    // ── P5 ──
    if(sec==="p5"){
      var q5=RP5[qi];var sel5=ans.p5[qi];
      return(<div style={{padding:"20px 16px",minHeight:"100vh"}}>
        {header}
        <h3 className="out" style={{fontWeight:700,fontSize:15,lineHeight:1.5,marginBottom:20}}>{q5.s}</h3>
        <div style={{display:"flex",flexDirection:"column",gap:8}}>
          {q5.o.map(function(opt,i){var isSel=sel5===i;return(<button key={i} onClick={function(){pick(i);}} style={{display:"flex",alignItems:"center",gap:10,padding:"12px 14px",background:isSel?"rgba(27,112,207,.15)":"var(--bg2)",border:"1px solid "+(isSel?"var(--endless)":"var(--bdr)"),borderRadius:12,cursor:"pointer",fontSize:13,color:"var(--t1)",textAlign:"left",fontFamily:"'DM Sans',sans-serif"}}>
            <div style={{width:26,height:26,borderRadius:"50%",border:"2px solid "+(isSel?"var(--endless)":"var(--t3)"),display:"flex",alignItems:"center",justifyContent:"center",fontSize:11,fontWeight:700,flexShrink:0,background:isSel?"var(--endless)":"transparent",color:isSel?"#fff":"var(--t3)"}}>{String.fromCharCode(65+i)}</div>
            <span>{opt}</span></button>);})}
        </div>
      </div>);
    }

    // ── P6 ──
    if(sec==="p6"){
      var t6=RP6[qi];var blanks6=[];var blankNum=0;
      t6.parts.forEach(function(pt){if(pt.blank){blanks6.push(pt);blankNum++;}});
      var bl6=blanks6[sqi];var sel6=ans.p6[qi][sqi];
      var renderedText=[];
      t6.parts.forEach(function(pt,pi){
        if(pt.blank){var bIdx=0;for(var bb=0;bb<pi;bb++)if(t6.parts[bb].blank)bIdx++;renderedText.push(<span key={pi} style={{background:bIdx===sqi?"rgba(27,112,207,.25)":"rgba(27,112,207,.1)",padding:"2px 8px",borderRadius:4,fontWeight:bIdx===sqi?700:400,color:bIdx===sqi?"var(--endless)":"var(--t2)"}}>{"[___]"}</span>);}
        else renderedText.push(<span key={pi}>{pt.text}</span>);
      });
      return(<div style={{padding:"20px 16px",minHeight:"100vh"}}>
        {header}
        <div style={{fontSize:11,color:"var(--t3)",marginBottom:8}}>{t6.type} — Blank {sqi+1}/{blankNum}</div>
        <div className="crd" style={{padding:14,marginBottom:16,maxHeight:200,overflowY:"auto",lineHeight:1.7,fontSize:12,whiteSpace:"pre-wrap"}}>{renderedText}</div>
        <div style={{display:"flex",flexDirection:"column",gap:8}}>
          {bl6.options.map(function(opt,i){var isSel=sel6===i;return(<button key={i} onClick={function(){pick(i);}} style={{display:"flex",alignItems:"center",gap:10,padding:"12px 14px",background:isSel?"rgba(27,112,207,.15)":"var(--bg2)",border:"1px solid "+(isSel?"var(--endless)":"var(--bdr)"),borderRadius:12,cursor:"pointer",fontSize:13,color:"var(--t1)",textAlign:"left",fontFamily:"'DM Sans',sans-serif"}}>
            <div style={{width:26,height:26,borderRadius:"50%",border:"2px solid "+(isSel?"var(--endless)":"var(--t3)"),display:"flex",alignItems:"center",justifyContent:"center",fontSize:11,fontWeight:700,flexShrink:0,background:isSel?"var(--endless)":"transparent",color:isSel?"#fff":"var(--t3)"}}>{String.fromCharCode(65+i)}</div>
            <span>{opt}</span></button>);})}
        </div>
      </div>);
    }

    // ── P7 ──
    if(sec==="p7"){
      var ps7=RP7[qi];var pq7=ps7.questions[sqi];var sel7=ans.p7[qi][sqi];
      return(<div style={{padding:"20px 16px",minHeight:"100vh"}}>
        {header}
        <div style={{display:"flex",justifyContent:"space-between",marginBottom:8}}>
          <span style={{fontSize:11,color:"var(--t3)"}}>{ps7.type}</span>
          <span style={{fontSize:11,color:"var(--endless)"}}>Q {sqi+1}/{ps7.questions.length}</span>
        </div>
        <div className="crd" style={{padding:14,marginBottom:16,maxHeight:200,overflowY:"auto",lineHeight:1.7,fontSize:12,whiteSpace:"pre-wrap"}}>{ps7.text}</div>
        <h3 className="out" style={{fontWeight:700,fontSize:15,lineHeight:1.5,marginBottom:16}}>{pq7.q}</h3>
        <div style={{display:"flex",flexDirection:"column",gap:8}}>
          {pq7.options.map(function(opt,i){var isSel=sel7===i;return(<button key={i} onClick={function(){pick(i);}} style={{display:"flex",alignItems:"center",gap:10,padding:"12px 14px",background:isSel?"rgba(27,112,207,.15)":"var(--bg2)",border:"1px solid "+(isSel?"var(--endless)":"var(--bdr)"),borderRadius:12,cursor:"pointer",fontSize:13,color:"var(--t1)",textAlign:"left",fontFamily:"'DM Sans',sans-serif"}}>
            <div style={{width:26,height:26,borderRadius:"50%",border:"2px solid "+(isSel?"var(--endless)":"var(--t3)"),display:"flex",alignItems:"center",justifyContent:"center",fontSize:11,fontWeight:700,flexShrink:0,background:isSel?"var(--endless)":"transparent",color:isSel?"#fff":"var(--t3)"}}>{String.fromCharCode(65+i)}</div>
            <span>{opt}</span></button>);})}
        </div>
      </div>);
    }
  }

  // ═══ RESULTS ═══
  if(phase==="done"&&result){
    // Compute XP and PB
    var prevEndless=p.u.mockResults&&p.u.mockResults.endless;
    var prevBest=prevEndless&&prevEndless.best?prevEndless.best:0;
    var attempts=(prevEndless&&prevEndless.attempts?prevEndless.attempts:0)+1;
    var isNewPB=result.toeicEstimate>prevBest;
    if(isNewPB&&attempts>1)haptic("pb");
    var baseXp=Math.round(result.toeicEstimate*1.5*0.7);
    var pbBonus=isNewPB&&attempts>1?500:0;
    var totalXp=baseXp+pbBonus;

    // Part labels & icons for weakest recommendation
    var PART_MAP={1:{label:"Part 1 \xb7 Photos",icon:"\ud83d\uddbc\ufe0f",nav:"lisP1"},2:{label:"Part 2 \xb7 Q&R",icon:"\ud83c\udfa7",nav:"lisP2"},3:{label:"Part 3 \xb7 Conversations",icon:"\ud83d\udcac",nav:"lisP3"},4:{label:"Part 4 \xb7 Talks",icon:"\ud83d\udce2",nav:"lisP4"},5:{label:"Part 5 \xb7 Grammar",icon:"\ud83d\udcdd",nav:"drill"},6:{label:"Part 6 \xb7 Text completion",icon:"\ud83d\udcc4",nav:"p6"},7:{label:"Part 7 \xb7 Reading",icon:"\ud83d\udcd6",nav:"p7"}};
    var wp=PART_MAP[result.weakestPart]||PART_MAP[5];
    var wAcc=Math.round(result.weakestAccuracy*100);

    // History for progression chart
    var history=prevEndless&&prevEndless.history?prevEndless.history.slice(-6):[];
    history.push({date:Date.now(),toeicEstimate:result.toeicEstimate,listening:result.listening.toeic,reading:result.reading.toeic,weakestPart:result.weakestPart,weakestAccuracy:result.weakestAccuracy});

    return(<div className="enter" style={{padding:"20px 16px 100px",minHeight:"100vh"}}>
      {/* Breadcrumb */}
      <div style={{fontSize:13,color:"#8a7e6a",marginBottom:14,cursor:"pointer"}} onClick={function(){p.done(result,totalXp,{history:history,attempts:attempts,isNewPB:isNewPB});}}>{"← ⏳ Endless Arena"}</div>

      {/* PB Banner or First Run */}
      {attempts===1?(<div style={{background:"linear-gradient(135deg,#3a2810 0%,#0a1e35 50%,#3a2810 100%)",border:"1.5px solid #f0c850",borderRadius:12,padding:"11px 14px",marginBottom:14,textAlign:"center"}}>
        <div style={{fontFamily:"'Cinzel','Outfit',serif",fontWeight:900,fontSize:13,color:"#f0c850",letterSpacing:2}}>{"⭐"} FIRST RUN COMPLETE {"⭐"}</div>
        <div style={{fontSize:11,color:"#7fb8e8",marginTop:3}}>Welcome to the Endless Arena</div>
      </div>)
      :isNewPB?(<div style={{background:"linear-gradient(135deg,#3a2810 0%,#0a1e35 50%,#3a2810 100%)",border:"1.5px solid #f0c850",borderRadius:12,padding:"11px 14px",marginBottom:14,textAlign:"center"}}>
        <div style={{fontFamily:"'Cinzel','Outfit',serif",fontWeight:900,fontSize:13,color:"#f0c850",letterSpacing:2}}>{"⭐"} NEW PERSONAL BEST {"⭐"}</div>
        <div style={{fontSize:11,color:"#7fb8e8",marginTop:3}}>+{result.toeicEstimate-prevBest} vs previous best</div>
      </div>)
      :null}

      {/* Score Hero Card */}
      <div style={{background:"linear-gradient(135deg,#1a1610,#0f1a2a)",border:"1px solid rgba(27,112,207,0.25)",borderRadius:16,padding:"22px 16px 18px",textAlign:"center",position:"relative",overflow:"hidden",marginBottom:14}}>
        <div style={{position:"absolute",top:-4,right:10,fontSize:46,opacity:.06}}>{"⏳"}</div>
        <div style={{fontFamily:"'Cinzel','Outfit',serif",fontSize:11,color:"#8a7e6a",letterSpacing:2,marginBottom:6}}>RUN #{attempts} {"·"} COMPLETE</div>
        <div style={{position:"relative"}}>
          <span className="out" style={{fontWeight:900,fontSize:56,lineHeight:1,background:"linear-gradient(180deg,#f0c850,#d4943a)",WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent"}}>{result.toeicEstimate}</span>
          <span style={{fontFamily:"'Cinzel','Outfit',serif",fontSize:16,color:"#8a7e6a",marginLeft:4}}>/ 990</span>
        </div>
        <div style={{display:"flex",gap:8,marginTop:16}}>
          <div style={{flex:1,background:"rgba(180,140,80,.08)",borderRadius:10,padding:"10px 8px",textAlign:"center"}}>
            <div style={{fontSize:11,color:"#8a7e6a",letterSpacing:.5}}>LISTENING</div>
            <div style={{fontFamily:"'Cinzel','Outfit',serif",fontWeight:800,fontSize:18,color:"#ede4d4"}}>{result.listening.toeic}<span style={{fontSize:11,color:"#5a5040"}}> / 495</span></div>
          </div>
          <div style={{flex:1,background:"rgba(180,140,80,.08)",borderRadius:10,padding:"10px 8px",textAlign:"center"}}>
            <div style={{fontSize:11,color:"#8a7e6a",letterSpacing:.5}}>READING</div>
            <div style={{fontFamily:"'Cinzel','Outfit',serif",fontWeight:800,fontSize:18,color:"#ede4d4"}}>{result.reading.toeic}<span style={{fontSize:11,color:"#5a5040"}}> / 495</span></div>
          </div>
        </div>
      </div>

      {/* XP Earned */}
      <div style={{background:"var(--bg2)",border:"1px solid rgba(180,140,80,.12)",borderRadius:12,padding:"12px 16px",marginBottom:14,display:"flex",justifyContent:"space-between",alignItems:"center"}}>
        <div>
          <div style={{fontSize:11,color:"#8a7e6a"}}>XP EARNED</div>
          <div style={{fontSize:11,color:"#5a5040"}}>{pbBonus>0?"base "+baseXp+" + PB bonus "+pbBonus:"base "+baseXp}</div>
        </div>
        <div style={{fontFamily:"'Cinzel','Outfit',serif",fontWeight:900,fontSize:22,color:"#f0c850"}}>+{totalXp}</div>
      </div>

      {/* Progression History */}
      <div style={{background:"var(--bg2)",border:"1px solid rgba(180,140,80,.12)",borderRadius:12,padding:"14px 16px",marginBottom:14}}>
        {history.length<=1?(<div>
          <div style={{fontFamily:"'Cinzel','Outfit',serif",fontSize:11,color:"#8a7e6a",letterSpacing:2,marginBottom:8}}>PROGRESSION</div>
          <div style={{fontSize:12,color:"#7fb8e8",fontStyle:"italic"}}>Your first Endless run {"·"} come back tomorrow to see your progress</div>
        </div>):(<div>
          <div style={{fontFamily:"'Cinzel','Outfit',serif",fontSize:11,color:"#8a7e6a",letterSpacing:2,marginBottom:12}}>PROGRESSION {"·"} LAST {history.length} RUNS</div>
          {history.map(function(run,ri){
            var isLast=ri===history.length-1;
            var barW=Math.max(5,Math.min(100,((run.toeicEstimate-500)/(990-500))*100));
            var barCol=isLast?"linear-gradient(90deg,#0a3a6e,#1B70CF)":run.toeicEstimate>=750?"#a07028":run.toeicEstimate>=700?"#8b6020":"#5a4225";
            return(<div key={ri} style={{display:"flex",gap:10,alignItems:"center",marginBottom:4}}>
              <span style={{fontFamily:"'Cinzel','Outfit',serif",fontSize:11,width:38,color:isLast?"#7fb8e8":"#5a5040",fontWeight:isLast?700:400}}>Run {ri+1}</span>
              <div style={{flex:1,height:8,borderRadius:99,background:isLast?"rgba(27,112,207,.15)":"rgba(180,140,80,.08)"}}>
                <div style={{width:barW+"%",height:"100%",borderRadius:99,background:barCol}}/>
              </div>
              <span style={{width:32,textAlign:"right",fontSize:11,fontWeight:isLast?700:600,color:isLast?"#7fb8e8":"#8a7e6a"}}>{run.toeicEstimate}</span>
            </div>);
          })}
        </div>)}
      </div>

      {/* Weakest Recommendation */}
      <div style={{background:"linear-gradient(135deg,#0a1828,#0f2038)",border:"1.5px solid rgba(27,112,207,.35)",borderRadius:12,padding:"14px 16px",marginBottom:16}}>
        <div style={{fontFamily:"'Cinzel','Outfit',serif",fontSize:11,color:"#4a9fe0",letterSpacing:2,marginBottom:10}}>WEAKEST THIS RUN</div>
        <div style={{display:"flex",gap:12,alignItems:"center"}}>
          <div style={{width:42,height:42,borderRadius:12,background:"rgba(27,112,207,.2)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:22}}>{wp.icon}</div>
          <div>
            <div style={{fontFamily:"'Cinzel','Outfit',serif",fontWeight:700,fontSize:14,color:"#ede4d4"}}>{wp.label}</div>
            <div style={{fontSize:11,color:"var(--red)",fontWeight:600}}>{wAcc}% accuracy — train this next</div>
          </div>
        </div>
      </div>

      {/* Primary Button — Train weakest */}
      <button onClick={function(){p.done(result,totalXp,{history:history,attempts:attempts,isNewPB:isNewPB});setTimeout(function(){p.nav(wp.nav);},100);}}
        style={{width:"100%",padding:14,background:"linear-gradient(135deg,#d4943a,#8b6020)",border:"none",borderRadius:12,fontFamily:"'Cinzel','Outfit',serif",fontWeight:800,fontSize:13,color:"#0f0c08",letterSpacing:1,cursor:"pointer",marginBottom:10}}>
        {wp.icon} TRAIN PART {result.weakestPart} NOW {"→"}
      </button>

      {/* Secondary Button */}
      <button onClick={function(){p.done(result,totalXp,{history:history,attempts:attempts,isNewPB:isNewPB});}}
        style={{width:"100%",padding:12,background:"transparent",border:"1px solid rgba(180,140,80,.25)",borderRadius:12,fontFamily:"'DM Sans',sans-serif",fontWeight:600,fontSize:13,color:"#8a7e6a",cursor:"pointer",marginBottom:16}}>
        Back to the training grounds
      </button>

      {/* Cooldown hint */}
      <div style={{textAlign:"center",fontSize:11,color:"#5a5040",marginBottom:16}}>{"⏳"} Next Endless run available in 24h</div>
    </div>);
  }

  return null;
}

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
        <div style={{height:"100%",width:progressPct+"%",background:"linear-gradient(90deg,var(--cx-hex),#8b5e83)",borderRadius:2,transition:"width .3s"}}/>
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
              var bg=selected===i?"rgba(var(--cx),.15)":"var(--bg2)";
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
              return(<span key={i} className="out" style={{display:"inline",padding:"2px 8px",borderRadius:6,fontWeight:700,background:isCurrent?"rgba(var(--cx),.2)":hasAnswer?"rgba(0,230,118,.12)":"var(--bg3)",color:isCurrent?"var(--cyan)":hasAnswer?"var(--green)":"var(--t3)",border:"1px solid "+(isCurrent?"var(--cyan)":hasAnswer?"var(--green)":"var(--bdr)"),fontSize:12}}>{("["+String.fromCharCode(65+dp.index)+"]")}{hasAnswer&&!isCurrent?" ✓":""}</span>);
            })}
          </div>
          <div style={{display:"flex",flexDirection:"column",gap:10}}>
            {currentBlank.options.map(function(opt,i){
              var bg=selected6===i?"rgba(var(--cx),.15)":"var(--bg2)";
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
              var bg=selected7===i?"rgba(var(--cx),.15)":"var(--bg2)";
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

      {(function(){
        var timeGateOk=(result.timeUsed||0)>=300;
        var modId2="mock"+mockId;
        var dms=p.u.dailyModSessions||{};
        var sessCount=dms[modId2+"_"+today()]||0;
        var mult=sessCount===0?1:sessCount===1?0.40:0;
        var gxp=timeGateOk?Math.round(xp*mult):0;
        if(!timeGateOk)return(<div style={{marginBottom:20}}>
          <div className="out" style={{fontSize:16,fontWeight:700,color:"var(--t3)"}}>+0 XP</div>
          <div style={{fontSize:11,color:"var(--red)",marginTop:2}}>Completed in under 5 min — XP not counted</div>
          <div style={{fontSize:10,color:"var(--t3)",marginTop:2}}>Your TOEIC results are saved</div>
        </div>);
        if(mult===1)return(<div className="out" style={{fontSize:20,fontWeight:800,color:"var(--gold)",marginBottom:20}}>+{gxp} XP</div>);
        if(mult>0)return(<div style={{marginBottom:20}}>
          <div className="out" style={{fontSize:18,fontWeight:800,color:"var(--orange)"}}>+{gxp} XP</div>
          <div style={{fontSize:11,color:"var(--t3)",marginTop:2}}>Reduced XP — 2nd attempt today</div>
        </div>);
        return(<div style={{marginBottom:20}}>
          <div className="out" style={{fontSize:16,fontWeight:700,color:"var(--t3)"}}>+0 XP</div>
          <div style={{fontSize:11,color:"var(--red)",marginTop:2}}>Daily limit reached — come back tomorrow!</div>
          <div style={{fontSize:10,color:"var(--t3)",marginTop:2}}>Your TOEIC results are saved</div>
        </div>);
      })()}

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
  var bestF=p.u.gameScores&&p.u.gameScores.wordFall?p.u.gameScores.wordFall:null;
  var bestT=p.u.moduleScores&&p.u.moduleScores.tavern?p.u.moduleScores.tavern:null;
  var games=[
    {id:"tavern",n:"Word Tavern",d:"Prove your vocabulary!",i:"beer-stein",bg:"linear-gradient(135deg,#c87a35,#8b5e83)",tag:"NEW",extra:bestT?"Best: "+bestT.correct+"/"+bestT.total:null},
    {id:"matchE",n:"Speed Match",d:"Match words with definitions!",i:"chained-arrow-heads",bg:"linear-gradient(135deg,var(--cx-hex),#8b5e83)",extra:bestM?"Best: "+bestM.time+"s · "+bestM.moves+" moves":null},
    {id:"wfall",n:"Word Fall",d:"Catch the falling sentences!",i:"meteor-impact",bg:"linear-gradient(135deg,#ef4444,#f59e0b)",extra:bestF?"Best: "+bestF.score+" pts · x"+bestF.maxCombo+" combo":null},
    {id:"sbuild",n:"Sentence Builder",d:"Tap blocks in the right order!",i:"brick-pile",bg:"linear-gradient(135deg,#5a7a9a,#7a5a80)"},
    {id:"ablitz",n:"Audio Blitz",d:"Listen once, answer fast!",i:"lyre",bg:"linear-gradient(135deg,#f59e0b,#ef4444)"},
    {id:"clue",n:"Clue Hunter",d:"Find the clue, fill the blank!",i:"spyglass",bg:"linear-gradient(135deg,var(--cx-hex),#4abe60)"},
    {id:"duel",n:"Vocabulary Arena",d:"Real-time 1v1 — challenge a classmate!",i:"swords-emblem",bg:"linear-gradient(135deg,#c84040,#8b5e83)",tag:"NEW"},
  ];
  return(<div className="enter" style={{padding:"20px 16px 100px"}}>
    <h1 className="out" style={{fontWeight:800,fontSize:24,marginBottom:4}}>Arena Games</h1>
    <p style={{color:"var(--t2)",fontSize:13,marginBottom:20}}>Train your reflexes, earn XP</p>
    <div className="rg-games" style={{display:"flex",flexDirection:"column",gap:12}}>
      {games.map(function(m){var vl=isModuleLocked(m.id,p.u,p.groupType);return(
        <div key={m.id} className="crd" onClick={function(){if(vl){p.onPremium(m.n);return;}p.nav(m.id);}} style={{cursor:vl?"default":"pointer",display:"flex",alignItems:"center",gap:14,padding:"16px",opacity:vl?.55:1}}>
          <div style={{width:48,height:48,borderRadius:14,background:vl?"transparent":"linear-gradient(135deg,rgba(var(--cx),.22),transparent)",border:vl?"1.5px solid var(--bdr)":"1.5px solid var(--cyan)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:24,flexShrink:0}}>{GAME_ICON_PATHS[m.i]?<GIcon name={m.i} size={28} color={vl?"var(--t3)":"var(--cyan)"}/>:m.i}</div>
          <div style={{flex:1}}><div className="out" style={{fontWeight:700,fontSize:15}}>{m.n}</div>
            <div style={{fontSize:11,color:vl?"var(--gold)":"var(--t3)"}}>{vl?"Arena Premium":m.d}</div>
            {!vl&&m.extra&&<div style={{fontSize:10,color:"var(--gold)",marginTop:2}}>{m.extra}</div>}
            {!vl&&m.tag&&<div style={{fontSize:10,color:"var(--gold)",marginTop:2}}>{m.tag}</div>}</div>
          {vl?<span style={{fontSize:14,color:"var(--gold)"}}>{"🔒"}</span>:<span style={{fontSize:16,color:"var(--cyan)"}}>{"→"}</span>}
        </div>);})}
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
      <div style={{padding:"20px 20px 12px",background:"linear-gradient(135deg,rgba(var(--cx),.08),rgba(27,112,207,.08))"}}>
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
      setRemaining(shuffle(it.chunks.map(function(c,i){
        var t=c;
        if(i===0)t=t.charAt(0).toLowerCase()+t.slice(1);
        if(i===it.chunks.length-1)t=t.replace(/\.$/,"");
        return{text:t,idx:i};
      })));
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
    <div style={{marginBottom:16,display:"flex",justifyContent:"center"}}><GIcon name="brick-pile" size={60} color="var(--cyan)"/></div>
    <h1 className="out" style={{fontWeight:900,fontSize:26,marginBottom:8}}>Sentence Builder</h1>
    <p style={{color:"var(--t2)",fontSize:13,marginBottom:8,lineHeight:1.6}}>The sentence is scrambled — tap the blocks in the right order!</p>
    <p style={{color:"var(--gold)",fontWeight:600,fontSize:14,marginBottom:32}}>{TOTAL} sentences · {TIMER_SEC}s each</p>
    <button className="btn1" onClick={function(){sP("q");}}>Start</button>
    <button className="btn2" onClick={p.back} style={{marginTop:12,width:"100%"}}>Back</button>
  </div>);

  // ═══ DONE ═══
  if(ph==="done"){var xp=20+sc*5;if(p.gate)xp=p.gate(xp,sc,TOTAL);return(<div className="enter" style={{padding:"20px 16px",minHeight:"100vh",display:"flex",flexDirection:"column",justifyContent:"center",textAlign:"center"}}>
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
          background:showResult?(posCorrect?"rgba(0,230,118,.15)":"rgba(255,71,87,.15)"):"rgba(var(--cx),.1)",
          color:showResult?(posCorrect?"var(--green)":"var(--red)"):"var(--cyan)",
          border:"1px solid "+(showResult?(posCorrect?"var(--green)":"var(--red)"):"rgba(var(--cx),.2)"),
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
        <div style={{display:"flex",alignItems:"center",gap:8}}>
          <p style={{fontSize:14,color:"var(--t1)",lineHeight:1.6,fontWeight:500,flex:1}}>{it.s}</p>
          <SpeakBtn text={it.s} size={26} rate={0.85} audio={"/audio/sentences/sb_"+String(SENTENCES.indexOf(it)+1).padStart(2,"0")+".mp3"}/>
        </div>
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
      if(_listenAudio){try{_listenAudio.pause();_listenAudio.src="";}catch(e){}}
      var audio=new Audio(it.audio);
      _listenAudio=audio;
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

    return function(){clearInterval(timerRef.current);clearTimeout(bufferRef.current);clearTimeout(playTimeout);stopListenAudio();};
  },[ci,ph]);

  function replay(){
    if(replays>=1||played<2)return;
    setReplays(1);
    var it=items[ci];
    if(_listenAudio){try{_listenAudio.pause();_listenAudio.src="";}catch(e){}}
    var audio=new Audio(it.audio);
    _listenAudio=audio;
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
    <div style={{marginBottom:16,display:"flex",justifyContent:"center"}}><GIcon name="lyre" size={60} color="var(--cyan)"/></div>
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
  if(ph==="done"){var xp=25+sc*6;if(p.gate)xp=p.gate(xp,sc,TOTAL);return(<div className="enter" style={{padding:"20px 16px",minHeight:"100vh",display:"flex",flexDirection:"column",justifyContent:"center",textAlign:"center"}}>
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
        {replays===0&&<button onClick={replay} style={{background:"rgba(27,112,207,.1)",border:"1px solid rgba(27,112,207,.2)",
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
        else if(ph==="q"&&isPick){bg="rgba(var(--cx),.1)";bd="var(--cyan)";}
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
      <div className="crd" style={{padding:14,background:"rgba(var(--cx),.06)",borderColor:"rgba(var(--cx),.15)"}}>
        <p className="out" style={{fontWeight:700,fontSize:13,color:"var(--cyan)",marginBottom:6}}>Transcript:</p>
        <p style={{fontSize:13,color:"var(--t1)",lineHeight:1.6,fontStyle:"italic"}}>"{it.text}"</p>
      </div>
      <button className="btn1" onClick={next} style={{marginTop:12}}>{ci<items.length-1?"Next":"See Results"}</button>
    </div>}
	<button className="btn2" onClick={function(){clearInterval(timerRef.current);p.back();}} style={{marginTop:12,width:"100%"}}>Back</button>
  </div>);
}

// ─── VOCABULARY ARENA — Real-time multiplayer vocabulary game ───
function DuelArena(p){
  var ROUNDS=10;var TIMER_SEC=12;
  var RANK_PTS=[100,80,60,50];var RANK_MIN=40;
  var MEDALS=["🥇","🥈","🥉"];

  var[phase,setPhase]=useState("hub"); // hub|pickAction|create|join|lobby|countdown|play|feedback|done
  var[roomCode,setRoomCode]=useState("");
  var[inputCode,setInputCode]=useState("");
  var[isHost,setIsHost]=useState(false);
  var[myName]=useState(p.u.name);
  var[questions,setQuestions]=useState([]);
  var[qi,setQi]=useState(0);
  var[myPick,setMyPick]=useState(-1);
  var[myScore,setMyScore]=useState(0);
  var[timer,setTimer]=useState(TIMER_SEC);
  var[countdown,setCountdown]=useState(3);
  var[error,setError]=useState(null);
  var[roundResults,setRoundResults]=useState([]); // [{qi, ranking:[{pid,name,pick,time,pts}], correct, myPts}]
  var[wager,setWager]=useState(0);
  var[customWager,setCustomWager]=useState("");
  var[wagerPopup,setWagerPopup]=useState(null);
  var[playerCount,setPlayerCount]=useState(1); // includes self
  var[answeredCount,setAnsweredCount]=useState(0); // how many answered this round
  var[roundRanking,setRoundRanking]=useState([]); // current round ranking for feedback
  var[finalRanking,setFinalRanking]=useState([]); // [{pid,name,score}]
  var[expectedPlayers,setExpectedPlayers]=useState(2);

  var channelRef=useRef(null);
  var timerRef=useRef(null);
  var countdownRef=useRef(null);
  var fallbackRef=useRef(null);
  var answeredRef=useRef(false);
  var myIdRef=useRef("p_"+Math.random().toString(36).substring(2,8));
  var hostRef=useRef(false);
  var myScoreRef=useRef(0);

  // Refs immune to stale closures
  var allAnswersRef=useRef({}); // {pid: {pick, time, name}}
  var playersRef=useRef({}); // {pid: {name}} — all players including self
  var questionsRef=useRef([]);
  var qiRef=useRef(0);
  var phaseRef=useRef("hub");
  var expectedRef=useRef(2);
  var scoresRef=useRef({}); // {pid: totalScore}

  // Keep refs in sync
  questionsRef.current=questions;
  qiRef.current=qi;
  phaseRef.current=phase;
  myScoreRef.current=myScore;
  hostRef.current=isHost;
  expectedRef.current=expectedPlayers;

  // Build question pool from VOCAB
  var allCards=useMemo(function(){
    var cards=[];
    VOCAB.forEach(function(dom){dom.cards.forEach(function(c){cards.push(c);});});
    return cards;
  },[]);

  function generateQuestions(){
    var picked=shuffle(allCards.slice()).slice(0,ROUNDS);
    return picked.map(function(card){
      var pool=allCards.filter(function(c){return c.id!==card.id;});
      var dists=shuffle(pool).slice(0,3).map(function(c){return c.d;});
      var opts=shuffle(dists.concat([card.d]));
      return{word:card.w,opts:opts,c:opts.indexOf(card.d),ex:card.e};
    });
  }

  function genCode(){return String(Math.floor(100000+Math.random()*900000));}

  // ── Compute ranking from all answers ──
  function computeRanking(answers,question){
    var correct=[];var wrong=[];
    var pids=Object.keys(answers);
    for(var i=0;i<pids.length;i++){
      var pid=pids[i];var a=answers[pid];
      if(a.pick===question.c)correct.push({pid:pid,name:a.name,pick:a.pick,time:a.time});
      else wrong.push({pid:pid,name:a.name,pick:a.pick,time:a.time,pts:0});
    }
    // Sort correct by time descending (more time remaining = faster)
    correct.sort(function(a,b){return b.time-a.time;});
    for(var j=0;j<correct.length;j++){
      correct[j].pts=j<RANK_PTS.length?RANK_PTS[j]:RANK_MIN;
    }
    return correct.concat(wrong);
  }

  // ── Check if all players answered → transition to feedback (host only) ──
  function checkAllDone(){
    if(phaseRef.current!=="play")return;
    var answers=allAnswersRef.current;
    var count=Object.keys(answers).length;
    if(count<expectedRef.current)return;
    clearTimeout(fallbackRef.current);

    var qs2=questionsRef.current;var qi2=qiRef.current;
    if(!qs2[qi2])return;
    var ranking=computeRanking(answers,qs2[qi2]);

    // Update scores
    for(var i=0;i<ranking.length;i++){
      var r=ranking[i];
      if(!scoresRef.current[r.pid])scoresRef.current[r.pid]=0;
      scoresRef.current[r.pid]+=r.pts;
    }

    // Find my points
    var myEntry=ranking.find(function(r){return r.pid===myIdRef.current;});
    var myPts=myEntry?myEntry.pts:0;
    var myCorrect=myEntry&&myEntry.pick===qs2[qi2].c;
    setMyScore(function(s){return s+myPts;});
    try{if(myCorrect)playCorrect();else playWrong();}catch(e){}

    setRoundRanking(ranking);
    setRoundResults(function(prev){return prev.concat([{qi:qi2,ranking:ranking,correct:qs2[qi2].c,myPts:myPts}]);});
    setPhase("feedback");

    // Host broadcasts authoritative result
    if(channelRef.current){
      channelRef.current.send({type:"broadcast",event:"round_result",payload:{
        ranking:ranking,scores:scoresRef.current,correct:qs2[qi2].c,qi:qi2,pid:myIdRef.current
      }});
    }
  }

  // ── Channel cleanup ──
  useEffect(function(){
    return function(){
      if(channelRef.current){supabase.removeChannel(channelRef.current);channelRef.current=null;}
      clearInterval(timerRef.current);clearInterval(countdownRef.current);clearTimeout(fallbackRef.current);
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
            answeredRef.current=true;
            var ans={pick:-1,time:0};
            allAnswersRef.current[myIdRef.current]={pick:-1,time:0,name:myName};
            setMyPick(-1);
            if(channelRef.current)channelRef.current.send({type:"broadcast",event:"answer",payload:{pick:-1,time:0,pid:myIdRef.current,name:myName}});
            if(hostRef.current)checkAllDone();
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
        if(c<=1){clearInterval(countdownRef.current);setPhase("play");return 0;}
        return c-1;
      });
    },1000);
    return function(){clearInterval(countdownRef.current);};
  },[phase]);

  // ── Subscribe to channel ──
  function joinChannel(code,hosting){
    var myId=myIdRef.current;
    var ch=supabase.channel("arena-"+code);

    ch.on("broadcast",{event:"player_join"},function(msg){
      if(msg.payload.pid===myId)return;
      playersRef.current[msg.payload.pid]={name:msg.payload.name};
      // If we're the joiner, adopt the host's wager
      if(msg.payload.host&&msg.payload.wager!==undefined)setWager(msg.payload.wager);
      // Host re-broadcasts updated count
      if(hostRef.current){
        var cnt=Object.keys(playersRef.current).length;
        setPlayerCount(cnt);
        if(channelRef.current)channelRef.current.send({type:"broadcast",event:"player_count",payload:{count:cnt,pid:myId}});
      }
    });

    ch.on("broadcast",{event:"player_count"},function(msg){
      if(msg.payload.pid===myId)return;
      setPlayerCount(msg.payload.count);
    });

    ch.on("broadcast",{event:"game_start"},function(msg){
      if(msg.payload.pid===myId)return;
      if(msg.payload.wager!==undefined)setWager(msg.payload.wager);
      questionsRef.current=msg.payload.questions;
      allAnswersRef.current={};scoresRef.current={};
      setQuestions(msg.payload.questions);
      setExpectedPlayers(msg.payload.playerCount);expectedRef.current=msg.payload.playerCount;
      setQi(0);setMyScore(0);setRoundResults([]);setAnsweredCount(0);
      setPhase("countdown");
    });

    ch.on("broadcast",{event:"answer"},function(msg){
      if(msg.payload.pid===myId)return;
      allAnswersRef.current[msg.payload.pid]={pick:msg.payload.pick,time:msg.payload.time,name:msg.payload.name};
      setAnsweredCount(Object.keys(allAnswersRef.current).length);
      if(hostRef.current)checkAllDone();
    });

    ch.on("broadcast",{event:"round_result"},function(msg){
      if(msg.payload.pid===myId)return;
      // Non-host receives authoritative ranking
      var ranking=msg.payload.ranking;
      scoresRef.current=msg.payload.scores;
      // Find my score from authoritative scores
      var myNewScore=scoresRef.current[myId]||0;
      setMyScore(myNewScore);
      var myEntry=ranking.find(function(r){return r.pid===myId;});
      var myPts=myEntry?myEntry.pts:0;
      var myCorrect2=myEntry&&myEntry.pick===msg.payload.correct;
      try{if(myCorrect2)playCorrect();else playWrong();}catch(e){}
      setRoundRanking(ranking);
      setRoundResults(function(prev){return prev.concat([{qi:msg.payload.qi,ranking:ranking,correct:msg.payload.correct,myPts:myPts}]);});
      setPhase("feedback");
    });

    ch.on("broadcast",{event:"next_round"},function(msg){
      if(msg.payload.pid===myId)return;
      answeredRef.current=false;
      allAnswersRef.current={};
      setMyPick(-1);setAnsweredCount(0);
      setQi(msg.payload.qi);qiRef.current=msg.payload.qi;
      setPhase("play");
    });

    ch.on("broadcast",{event:"game_done"},function(msg){
      if(msg.payload.pid===myId)return;
      setFinalRanking(msg.payload.finalRanking||[]);
      setPhase("done");
    });

    ch.subscribe(function(status){
      if(status==="SUBSCRIBED"){
        ch.send({type:"broadcast",event:"player_join",payload:{name:myName,host:hosting,pid:myId,wager:wager}});
      }
    });

    // Register self
    playersRef.current[myId]={name:myName};
    channelRef.current=ch;
  }

  // ── Answer handler ──
  function doAnswer(i){
    if(answeredRef.current)return;
    answeredRef.current=true;
    clearInterval(timerRef.current);clearTimeout(fallbackRef.current);
    var timeLeft=timer;
    allAnswersRef.current[myIdRef.current]={pick:i,time:timeLeft,name:myName};
    setMyPick(i);
    setAnsweredCount(Object.keys(allAnswersRef.current).length);
    if(channelRef.current){
      channelRef.current.send({type:"broadcast",event:"answer",payload:{pick:i,time:timeLeft,pid:myIdRef.current,name:myName}});
    }
    if(hostRef.current){
      checkAllDone();
      // Fallback: after 10s, fill missing players as timeout
      fallbackRef.current=setTimeout(function(){
        if(phaseRef.current!=="play")return;
        var pids=Object.keys(playersRef.current);
        for(var k=0;k<pids.length;k++){
          if(!allAnswersRef.current[pids[k]]){
            allAnswersRef.current[pids[k]]={pick:-1,time:0,name:playersRef.current[pids[k]].name};
          }
        }
        setAnsweredCount(Object.keys(allAnswersRef.current).length);
        checkAllDone();
      },10000);
    }
  }

  // ── Next round (host drives) ──
  function nextRound(){
    if(qi+1>=ROUNDS){
      // Build final ranking
      var pids=Object.keys(scoresRef.current);
      var fr=pids.map(function(pid){
        var pl=playersRef.current[pid];
        return{pid:pid,name:pl?pl.name:pid,score:scoresRef.current[pid]||0};
      }).sort(function(a,b){return b.score-a.score;});
      setFinalRanking(fr);
      if(channelRef.current)channelRef.current.send({type:"broadcast",event:"game_done",payload:{finalRanking:fr,pid:myIdRef.current}});
      setPhase("done");
    } else {
      answeredRef.current=false;
      allAnswersRef.current={};
      var next=qi+1;
      if(channelRef.current)channelRef.current.send({type:"broadcast",event:"next_round",payload:{qi:next,pid:myIdRef.current}});
      setMyPick(-1);setAnsweredCount(0);
      setQi(next);qiRef.current=next;
      setPhase("play");
    }
  }

  var WAGER_TIERS=[10,20,50,100];

  // ═══ HUB ═══
  if(phase==="hub")return(<div className="enter" style={{padding:"20px 16px 100px"}}>
    <div style={{textAlign:"center",marginBottom:16}}>
      <span className="out" style={{fontWeight:700,fontSize:15}}>Vocabulary Arena</span>
    </div>
    <div style={{textAlign:"center",marginBottom:20}}>
      <div style={{marginBottom:8,display:"flex",justifyContent:"center"}}><GIcon name="swords-emblem" size={60} color="var(--cyan)"/></div>
      <h1 className="out" style={{fontWeight:800,fontSize:24,marginBottom:4}}>Vocabulary Arena</h1>
      <p style={{color:"var(--t2)",fontSize:13,lineHeight:1.6}}>{ROUNDS} rounds, {TIMER_SEC}s per question. Fastest wins!</p>
      <div style={{marginTop:8,padding:"6px 16px",display:"inline-block",background:"rgba(var(--cx),.08)",borderRadius:20}}>
        <span style={{fontSize:13,color:"var(--cyan)",fontWeight:700}}>Weekly XP: {p.u.weeklyXp}</span>
      </div>
    </div>
    {error&&<div style={{padding:12,background:"rgba(255,71,87,.1)",border:"1px solid rgba(255,71,87,.2)",borderRadius:10,marginBottom:16,textAlign:"center"}}>
      <p style={{fontSize:12,color:"var(--red)"}}>{error}</p></div>}

    {wagerPopup&&<div style={{position:"fixed",top:0,left:0,right:0,bottom:0,background:"rgba(0,0,0,.75)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:9999,padding:20,animation:"fadeIn .2s"}} onClick={function(){setWagerPopup(null);}}>
      <div style={{background:"linear-gradient(180deg,#1a1610,#0f0c08)",border:"1px solid rgba(180,140,80,.12)",borderRadius:16,padding:24,maxWidth:340,width:"100%",textAlign:"center",boxShadow:"0 12px 40px rgba(0,0,0,.5)"}} onClick={function(e){e.stopPropagation();}}>
        <div style={{fontSize:36,marginBottom:12}}>{"⚠️"}</div>
        <div className="out" style={{fontWeight:700,fontSize:15,marginBottom:8,color:"#e05252"}}>Wager denied</div>
        <p style={{fontSize:13,color:"#b0a890",lineHeight:1.6,marginBottom:4}}>{wagerPopup}</p>
        <p style={{fontSize:11,color:"#8a7e6a",lineHeight:1.5,marginBottom:16}}>You can only bet XP you have earned this week. Keep training to increase your weekly XP!</p>
        <button className="btn1" onClick={function(){setWagerPopup(null);}} style={{width:"100%"}}>Got it</button>
      </div>
    </div>}

    <div className="crd" style={{padding:16,marginBottom:10,cursor:"pointer",borderColor:"rgba(var(--cx),.15)"}} onClick={function(){
      setWager(0);setError(null);setPhase("pickAction");
    }}>
      <div style={{display:"flex",alignItems:"center",gap:14}}>
        <div style={{width:48,height:48,borderRadius:14,background:"linear-gradient(135deg,#22c55e,#06b6d4)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:22,flexShrink:0}}>{"🤝"}</div>
        <div style={{flex:1}}>
          <div className="out" style={{fontWeight:700,fontSize:15}}>Friendly Arena</div>
          <div style={{fontSize:11,color:"var(--t3)"}}>Play for fun — earn XP based on performance</div>
        </div>
        <span style={{fontSize:16,color:"var(--cyan)"}}>{"→"}</span>
      </div>
    </div>

    <div className="crd" style={{padding:16,marginBottom:10,background:"linear-gradient(135deg,rgba(255,71,87,.05),rgba(27,112,207,.05))",borderColor:"rgba(255,71,87,.15)"}}>
      <div style={{display:"flex",alignItems:"center",gap:14,marginBottom:12}}>
        <div style={{width:48,height:48,borderRadius:14,background:"linear-gradient(135deg,#c84040,#8b5e83)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:22,flexShrink:0}}>{"🔥"}</div>
        <div style={{flex:1}}>
          <div className="out" style={{fontWeight:700,fontSize:15}}>Ranked Arena</div>
          <div style={{fontSize:11,color:"var(--t3)"}}>Wager XP — winner takes all!</div>
        </div>
      </div>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
        {WAGER_TIERS.map(function(w){
          var canAfford=p.u.weeklyXp>=w;
          return(<button key={w} onClick={function(){
            if(!canAfford){setWagerPopup("You only have "+p.u.weeklyXp+" XP this week. You need at least "+w+" weekly XP to wager this amount!");return;}
            setWager(w);setError(null);setCustomWager("");setPhase("pickAction");
          }} disabled={!canAfford}
            style={{padding:"12px 8px",background:canAfford?"rgba(255,71,87,.08)":"var(--bg3)",border:"1px solid "+(canAfford?"rgba(255,71,87,.2)":"var(--bg3)"),
              borderRadius:12,cursor:canAfford?"pointer":"not-allowed",opacity:canAfford?1:0.4,transition:"all .2s"}}>
            <div className="out" style={{fontWeight:800,fontSize:18,color:canAfford?"var(--red)":"var(--t3)"}}>{w} XP</div>
          </button>);
        })}
      </div>
      <div style={{marginTop:10,display:"flex",gap:8,alignItems:"center"}}>
        <input type="number" min="1" placeholder="Custom XP" value={customWager} onChange={function(e){setCustomWager(e.target.value);}}
          style={{flex:1,padding:"10px 12px",borderRadius:10,border:"1px solid rgba(255,71,87,.2)",background:"var(--bg3)",color:"var(--t1)",fontFamily:"'DM Sans',sans-serif",fontSize:15,fontWeight:700,outline:"none"}}/>
        <button onClick={function(){
          var v=parseInt(customWager,10);
          if(!v||v<1){setWagerPopup("Enter a valid amount (minimum 1 XP).");return;}
          if(v>p.u.weeklyXp){setWagerPopup("You only earned "+p.u.weeklyXp+" XP this week. Your wager cannot exceed your weekly XP!");return;}
          setWager(v);setError(null);setWagerPopup(null);setCustomWager("");setPhase("pickAction");
        }} style={{padding:"10px 18px",borderRadius:10,border:"none",background:"linear-gradient(135deg,#c84040,#8b5e83)",color:"#fff",fontWeight:800,fontSize:14,cursor:"pointer",whiteSpace:"nowrap"}}>Bet!</button>
      </div>
    </div>

    <div className="crd" style={{marginTop:16,padding:16}}>
      <p className="out" style={{fontWeight:700,fontSize:13,marginBottom:8}}>How it works</p>
      <div style={{fontSize:12,color:"var(--t2)",lineHeight:1.8}}>
        <div>{"🏠"} Host creates a room, others join with the code</div>
        <div>{"⚡"} Fastest correct answer = 100 pts, 2nd = 80, 3rd = 60...</div>
        <div>{"🔥"} Ranked: everyone wagers. Winner takes all!</div>
        <div>{"🤝"} Tie at 1st = pot split equally</div>
      </div>
    </div>
    <button className="btn2" onClick={p.back} style={{marginTop:16,width:"100%"}}>Back</button>
  </div>);

  // ═══ PICK ACTION ═══
  if(phase==="pickAction")return(<div className="enter" style={{padding:"20px 16px",minHeight:"100vh",display:"flex",flexDirection:"column",justifyContent:"center",textAlign:"center"}}>
    <div style={{fontSize:48,marginBottom:12}}>{wager>0?"🔥":"🤝"}</div>
    <h2 className="out" style={{fontWeight:800,fontSize:22,marginBottom:4}}>{wager>0?"Ranked Arena":"Friendly Arena"}</h2>
    {wager>0&&<div style={{marginBottom:16}}>
      <span style={{fontSize:28,fontWeight:900,color:"var(--red)"}}>{wager} XP</span>
      <span style={{fontSize:13,color:"var(--t3)",display:"block",marginTop:4}}>at stake per player</span>
    </div>}
    {!wager&&<p style={{color:"var(--t3)",fontSize:13,marginBottom:16}}>No XP at risk — play for fun!</p>}
    <div style={{display:"flex",flexDirection:"column",gap:12}}>
      <button className="btn1" onClick={function(){
        var code=genCode();setRoomCode(code);setIsHost(true);hostRef.current=true;setError(null);
        joinChannel(code,true);setPhase("create");
      }} style={{fontSize:16,padding:"18px 16px"}}>{"🏠"} Create a Room</button>
      <button className="btn2" onClick={function(){setError(null);setPhase("join");}} style={{fontSize:16,padding:"18px 16px"}}>{"🚪"} Join a Room</button>
    </div>
    <button className="btn2" onClick={function(){setPhase("hub");}} style={{marginTop:16,width:"100%"}}>Back</button>
  </div>);

  // ═══ CREATE ROOM ═══
  if(phase==="create")return(<div className="enter" style={{padding:"20px 16px",minHeight:"100vh",display:"flex",flexDirection:"column",justifyContent:"center",textAlign:"center"}}>
    <div style={{fontSize:48,marginBottom:16}}>{wager>0?"🔥":"🏠"}</div>
    <h2 className="out" style={{fontWeight:800,fontSize:22,marginBottom:8}}>{wager>0?"Ranked Arena":"Friendly Arena"}</h2>
    {wager>0&&<div style={{padding:"8px 20px",background:"rgba(255,71,87,.1)",borderRadius:20,display:"inline-block",marginBottom:12}}>
      <span style={{fontSize:16,fontWeight:800,color:"var(--red)"}}>Wager: {wager} XP</span></div>}
    <div style={{marginBottom:24}}>
      <div style={{fontSize:14,color:"var(--t2)",marginBottom:12}}>Share this code with your class:</div>
      <div className="out" style={{fontSize:44,fontWeight:900,letterSpacing:8,color:"var(--cyan)",animation:"pulse 2s infinite"}}>{roomCode}</div>
    </div>
    <div style={{padding:"12px 20px",background:"rgba(var(--cx),.08)",borderRadius:16,marginBottom:20}}>
      <span style={{fontSize:36,fontWeight:900,color:"var(--cyan)"}}>{playerCount}</span>
      <span style={{fontSize:14,color:"var(--t2)",marginLeft:8}}>{playerCount===1?"player (you)":"players"}</span>
    </div>
    {playerCount>=2?(<div style={{animation:"fadeIn .3s"}}>
      <button className="btn1" onClick={function(){
        var qs=generateQuestions();setQuestions(qs);questionsRef.current=qs;
        var pc=Object.keys(playersRef.current).length;
        setExpectedPlayers(pc);expectedRef.current=pc;
        scoresRef.current={};
        channelRef.current.send({type:"broadcast",event:"game_start",payload:{questions:qs,wager:wager,playerCount:pc,pid:myIdRef.current}});
        setQi(0);setMyScore(0);setRoundResults([]);setAnsweredCount(0);
        allAnswersRef.current={};
        setPhase("countdown");
      }}>{"⚔️"} Start Arena! ({playerCount} players)</button>
    </div>):(<div>
      <div style={{animation:"pulse 2s infinite",fontSize:14,color:"var(--t3)"}}>Waiting for players to join...</div>
    </div>)}
    <button className="btn2" onClick={function(){if(channelRef.current)supabase.removeChannel(channelRef.current);channelRef.current=null;setPhase("hub");}} style={{marginTop:24,width:"100%"}}>Cancel</button>
  </div>);

  // ═══ JOIN ROOM ═══
  if(phase==="join")return(<div className="enter" style={{padding:"20px 16px",minHeight:"100vh",display:"flex",flexDirection:"column",justifyContent:"center",textAlign:"center"}}>
    <div style={{fontSize:48,marginBottom:16}}>{"🚪"}</div>
    <h2 className="out" style={{fontWeight:800,fontSize:22,marginBottom:20}}>Enter Room Code</h2>
    <input type="text" inputMode="numeric" maxLength={6} value={inputCode}
      onChange={function(e){setInputCode(e.target.value.replace(/\D/g,""));}}
      placeholder="000000"
      style={{textAlign:"center",fontSize:40,fontWeight:900,letterSpacing:8,width:"100%",padding:"16px",
        background:"var(--bg2)",border:"2px solid var(--bdr)",borderRadius:16,color:"var(--cyan)",
        fontFamily:"'DM Sans',sans-serif",outline:"none",boxSizing:"border-box"}}/>
    <button className="btn1" onClick={function(){
      if(inputCode.length!==6){setError("Enter a 6-digit code");return;}
      setRoomCode(inputCode);setIsHost(false);hostRef.current=false;setError(null);
      joinChannel(inputCode,false);setPhase("lobby");
    }} style={{marginTop:20}} disabled={inputCode.length!==6}>Join Arena</button>
    <button className="btn2" onClick={function(){setPhase("hub");setInputCode("");}} style={{marginTop:12,width:"100%"}}>Back</button>
  </div>);

  // ═══ LOBBY ═══
  if(phase==="lobby")return(<div className="enter" style={{padding:"20px 16px",minHeight:"100vh",display:"flex",flexDirection:"column",justifyContent:"center",textAlign:"center"}}>
    <div style={{fontSize:48,marginBottom:16}}>{wager>0?"🔥":"⏳"}</div>
    <h2 className="out" style={{fontWeight:800,fontSize:22,marginBottom:8}}>Room {roomCode}</h2>
    {wager>0&&<div style={{padding:"8px 20px",background:"rgba(255,71,87,.1)",borderRadius:20,display:"inline-block",marginBottom:12}}>
      <span style={{fontSize:16,fontWeight:800,color:"var(--red)"}}>Wager: {wager} XP</span></div>}
    <div style={{padding:"12px 20px",background:"rgba(var(--cx),.08)",borderRadius:16,marginBottom:16}}>
      <span style={{fontSize:36,fontWeight:900,color:"var(--cyan)"}}>{playerCount}</span>
      <span style={{fontSize:14,color:"var(--t2)",marginLeft:8}}>players in room</span>
    </div>
    <p style={{color:"var(--t2)",fontSize:14,marginBottom:8}}>You joined as <strong style={{color:"var(--cyan)"}}>{myName}</strong></p>
    <div style={{animation:"pulse 2s infinite",fontSize:14,color:"var(--t3)"}}>Waiting for host to start...</div>
    <button className="btn2" onClick={function(){if(channelRef.current)supabase.removeChannel(channelRef.current);channelRef.current=null;setPhase("hub");}} style={{marginTop:32,width:"100%"}}>Leave</button>
  </div>);

  // ═══ COUNTDOWN ═══
  if(phase==="countdown")return(<div style={{minHeight:"100vh",display:"flex",flexDirection:"column",justifyContent:"center",alignItems:"center",textAlign:"center"}}>
    <div className="out" style={{fontSize:80,fontWeight:900,color:"var(--cyan)",animation:"countUp .5s"}}>{countdown}</div>
    <p style={{color:"var(--t2)",fontSize:16,marginTop:16}}>{expectedPlayers} players — Get ready!</p>
  </div>);

  // ═══ PLAY ═══
  if(phase==="play"&&questions[qi]){
    var q=questions[qi];
    var timerPct=timer/TIMER_SEC*100;
    var timerCol=timer<=3?"var(--red)":timer<=6?"var(--orange)":"var(--cyan)";

    return(<div style={{padding:"20px 16px",minHeight:"100vh"}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:8}}>
        <div style={{textAlign:"left"}}>
          <div style={{fontSize:11,color:"var(--cyan)",fontWeight:600}}>{myName}</div>
          <div className="out" style={{fontSize:20,fontWeight:900,color:"var(--cyan)"}}>{myScore}</div>
        </div>
        <div style={{textAlign:"center",padding:"0 12px"}}>
          <div style={{fontSize:11,color:"var(--t3)"}}>Round</div>
          <div className="out" style={{fontSize:18,fontWeight:800,color:"var(--t1)"}}>{qi+1}/{ROUNDS}</div>
          {wager>0&&<div style={{fontSize:9,color:"var(--red)",fontWeight:700,marginTop:2}}>{wager} XP</div>}
        </div>
        <div style={{textAlign:"right"}}>
          <div style={{fontSize:11,color:"var(--orange)",fontWeight:600}}>{answeredCount}/{expectedPlayers}</div>
          <div style={{fontSize:10,color:"var(--t3)"}}>answered</div>
        </div>
      </div>

      <div style={{height:5,background:"var(--bg3)",borderRadius:3,marginBottom:16,overflow:"hidden"}}>
        <div style={{height:"100%",width:timerPct+"%",background:timerCol,borderRadius:3,transition:"width 1s linear"}}/></div>

      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:20}}>
        <span className="out" style={{fontSize:24,fontWeight:900,color:timerCol}}>{timer}s</span>
        {answeredCount>0&&myPick!==-1&&<span style={{fontSize:12,color:"var(--orange)",fontWeight:600,animation:"fadeIn .3s"}}>{"⚡"} {answeredCount} answered</span>}
      </div>

      <div style={{textAlign:"center",marginBottom:24}}>
        <span className="out" style={{fontSize:11,color:"var(--purple)",fontWeight:700,textTransform:"uppercase",letterSpacing:1,display:"block",marginBottom:8}}>What does this word mean?</span>
        <span className="out" style={{fontSize:32,fontWeight:900,color:"var(--t1)"}}>{q.word}</span>
      </div>

      <div style={{display:"flex",flexDirection:"column",gap:8}}>
        {q.opts.map(function(opt,i){
          var picked=myPick===i;
          return(<button key={i} onClick={function(){doAnswer(i);}} disabled={myPick!==-1}
            style={{padding:"14px 16px",background:picked?"rgba(var(--cx),.1)":"var(--bg2)",
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

  // ═══ FEEDBACK ═══
  if(phase==="feedback"&&questions[qi]){
    var q2=questions[qi];
    var myEntry2=roundRanking.find(function(r){return r.pid===myIdRef.current;});
    var myRank=roundRanking.indexOf(myEntry2)+1;
    // Show top 5 + my position if lower
    var top5=roundRanking.slice(0,5);
    var showMe=myRank>5;

    return(<div style={{padding:"20px 16px",minHeight:"100vh"}}>
      <div style={{textAlign:"center",marginBottom:12}}>
        <span className="out" style={{fontSize:14,fontWeight:800,color:"var(--t1)"}}>Round {qi+1} Results</span>
      </div>

      <div className="crd" style={{padding:16,marginBottom:16,borderColor:"rgba(0,230,118,.2)",background:"rgba(0,230,118,.06)"}}>
        <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:8}}>
          <span className="out" style={{fontWeight:800,fontSize:18,color:"var(--cyan)"}}>{q2.word}</span>
          <span style={{fontSize:13,color:"var(--green)",fontWeight:600}}>= {q2.opts[q2.c]}</span>
        </div>
        <p style={{fontSize:12,color:"var(--t3)",fontStyle:"italic"}}>"{q2.ex}"</p>
      </div>

      <div className="crd" style={{padding:14,marginBottom:16}}>
        <div style={{display:"flex",flexDirection:"column",gap:6}}>
          {top5.map(function(r,i){
            var isMe=r.pid===myIdRef.current;
            var correct3=r.pick===q2.c;
            return(<div key={r.pid} style={{display:"flex",alignItems:"center",gap:8,padding:"6px 8px",borderRadius:10,background:isMe?"rgba(var(--cx),.08)":"transparent"}}>
              <span style={{width:24,fontSize:14,textAlign:"center"}}>{i<3?MEDALS[i]:(i+1)}</span>
              <span style={{flex:1,fontSize:13,fontWeight:isMe?700:400,color:isMe?"var(--cyan)":"var(--t1)"}}>{r.name}{isMe?" (you)":""}</span>
              <span style={{fontSize:11,color:correct3?"var(--green)":"var(--red)",fontWeight:600}}>{correct3?"✓":"✗"}</span>
              <span style={{width:40,textAlign:"right",fontSize:13,fontWeight:700,color:r.pts>0?"var(--green)":"var(--red)"}}>+{r.pts}</span>
            </div>);
          })}
          {showMe&&myEntry2&&<div>
            <div style={{textAlign:"center",color:"var(--t3)",fontSize:11,padding:"4px 0"}}>···</div>
            <div style={{display:"flex",alignItems:"center",gap:8,padding:"6px 8px",borderRadius:10,background:"rgba(var(--cx),.08)"}}>
              <span style={{width:24,fontSize:12,textAlign:"center",color:"var(--t3)"}}>{myRank}</span>
              <span style={{flex:1,fontSize:13,fontWeight:700,color:"var(--cyan)"}}>{myEntry2.name} (you)</span>
              <span style={{fontSize:11,color:myEntry2.pick===q2.c?"var(--green)":"var(--red)",fontWeight:600}}>{myEntry2.pick===q2.c?"✓":"✗"}</span>
              <span style={{width:40,textAlign:"right",fontSize:13,fontWeight:700,color:myEntry2.pts>0?"var(--green)":"var(--red)"}}>+{myEntry2.pts}</span>
            </div>
          </div>}
        </div>
      </div>

      {isHost?<button className="btn1" onClick={nextRound}>{qi+1<ROUNDS?"Next Round ("+(qi+2)+"/"+ROUNDS+")":"See Final Results"}</button>
      :<div style={{textAlign:"center",color:"var(--t3)",fontSize:13,animation:"pulse 2s infinite"}}>Waiting for next round...</div>}
    </div>);
  }

  // ═══ DONE ═══
  if(phase==="done"){
    var myFinal=finalRanking.find(function(r){return r.pid===myIdRef.current;});
    var myFinalRank=myFinal?finalRanking.indexOf(myFinal)+1:finalRanking.length;
    var iWon=myFinalRank===1;
    var pc=expectedPlayers;

    // Check for tie at 1st place
    var topScore=finalRanking.length>0?finalRanking[0].score:0;
    var tiedFirst=finalRanking.filter(function(r){return r.score===topScore;}).length;
    var tied=iWon&&tiedFirst>1;

    // XP
    var baseXp=Math.round((myScore/100)*3)+(myFinalRank===1?20:myFinalRank===2?15:myFinalRank===3?10:5);
    var wagerNet=0;
    if(wager>0){
      var pot=wager*pc;
      if(iWon&&!tied)wagerNet=pot-wager; // net gain = pot minus own wager
      else if(iWon&&tied)wagerNet=Math.floor(pot/tiedFirst)-wager;
      else wagerNet=-wager;
    }
    var totalXp=baseXp+wagerNet;
    if(p.u.xp+totalXp<0)totalXp=-p.u.xp;

    // Podium (top 3)
    var podium=finalRanking.slice(0,3);

    return(<div className="enter" style={{padding:"20px 16px 100px"}}>
      <div style={{textAlign:"center",marginBottom:24}}>
        <div style={{fontSize:56,marginBottom:12,animation:"countUp .6s"}}>{iWon?"🏆":myFinalRank<=3?"🎉":"😤"}</div>
        <h1 className="out" style={{fontWeight:900,fontSize:28,marginBottom:4}}>{iWon?(tied?"Tied for 1st!":"Victory!"):myFinalRank<=3?"Podium!":"#{"+myFinalRank+"}"}</h1>
        <p style={{color:"var(--t2)",fontSize:14}}>Room {roomCode} · {pc} players{wager>0?" · Ranked":""}</p>
      </div>

      {/* Podium */}
      <div style={{display:"flex",justifyContent:"center",gap:8,marginBottom:20,alignItems:"flex-end"}}>
        {podium.length>=2&&<div style={{textAlign:"center",flex:1}}>
          <div style={{fontSize:28,marginBottom:4}}>{"🥈"}</div>
          <div className="out" style={{fontSize:12,fontWeight:700,color:"var(--t2)"}}>{podium[1].name}</div>
          <div className="out" style={{fontSize:18,fontWeight:900,color:"var(--t2)"}}>{podium[1].score}</div>
        </div>}
        {podium.length>=1&&<div style={{textAlign:"center",flex:1}}>
          <div style={{fontSize:36,marginBottom:4,animation:"pulse 1.5s infinite"}}>{"🥇"}</div>
          <div className="out" style={{fontSize:14,fontWeight:800,color:"var(--gold)"}}>{podium[0].name}</div>
          <div className="out" style={{fontSize:24,fontWeight:900,color:"var(--gold)"}}>{podium[0].score}</div>
        </div>}
        {podium.length>=3&&<div style={{textAlign:"center",flex:1}}>
          <div style={{fontSize:24,marginBottom:4}}>{"🥉"}</div>
          <div className="out" style={{fontSize:12,fontWeight:700,color:"var(--t2)"}}>{podium[2].name}</div>
          <div className="out" style={{fontSize:18,fontWeight:900,color:"var(--t2)"}}>{podium[2].score}</div>
        </div>}
      </div>

      {/* My position if not podium */}
      {myFinalRank>3&&myFinal&&<div className="crd" style={{padding:14,marginBottom:16,textAlign:"center",borderColor:"rgba(var(--cx),.2)"}}>
        <div style={{fontSize:11,color:"var(--t3)",marginBottom:4}}>Your position</div>
        <div className="out" style={{fontSize:20,fontWeight:900,color:"var(--cyan)"}}>#{myFinalRank} — {myFinal.score} pts</div>
      </div>}

      {/* Wager result */}
      {wager>0&&<div className="crd" style={{padding:14,marginBottom:16,textAlign:"center",
        background:wagerNet>0?"rgba(0,230,118,.06)":wagerNet===0?"rgba(var(--cx),.06)":"rgba(255,71,87,.06)",
        borderColor:wagerNet>0?"rgba(0,230,118,.2)":wagerNet===0?"rgba(var(--cx),.2)":"rgba(255,71,87,.2)"}}>
        <div style={{fontSize:13,color:"var(--t2)",marginBottom:4}}>Pot: {wager*pc} XP ({pc} players × {wager})</div>
        <div className="out" style={{fontSize:24,fontWeight:900,color:wagerNet>0?"var(--green)":wagerNet===0?"var(--cyan)":"var(--red)"}}>
          {wagerNet>0?"+"+wagerNet+" XP won!":wagerNet===0?"XP returned":wagerNet+" XP lost"}
        </div>
      </div>}

      {/* Round breakdown (my points only) */}
      <div className="crd" style={{padding:14,marginBottom:20}}>
        <p className="out" style={{fontWeight:700,fontSize:13,color:"var(--t2)",marginBottom:10}}>Your Rounds</p>
        <div style={{display:"flex",flexDirection:"column",gap:4}}>
          {roundResults.map(function(r,i){
            var q3=questions[r.qi];
            return(<div key={i} style={{display:"flex",alignItems:"center",gap:8,padding:"6px 0",borderBottom:i<roundResults.length-1?"1px solid var(--bg3)":"none"}}>
              <span style={{width:20,fontSize:11,color:"var(--t3)",fontWeight:700}}>{i+1}</span>
              <span style={{flex:1,fontSize:12,color:"var(--t1)"}}>{q3?q3.word:""}</span>
              <span style={{fontSize:11,fontWeight:700,color:r.myPts>=100?"var(--green)":r.myPts>0?"var(--cyan)":"var(--red)",width:35,textAlign:"right"}}>+{r.myPts}</span>
            </div>);
          })}
        </div>
      </div>

      <div style={{textAlign:"center",marginBottom:20}}>
        <div style={{fontSize:12,color:"var(--t3)",marginBottom:4}}>Performance: +{baseXp} XP{wager>0?(wagerNet>=0?" · Wager: +"+wagerNet:" · Wager: "+wagerNet):""}</div>
        <div className="out" style={{fontSize:24,fontWeight:900,color:totalXp>=0?"var(--gold)":"var(--red)"}}>{totalXp>=0?"+":""}{totalXp} XP</div>
      </div>

      <button className="btn1" onClick={function(){
        if(channelRef.current){supabase.removeChannel(channelRef.current);channelRef.current=null;}
        var result={score:myScore,won:iWon,tied:tied,wager:wager,wagerWon:iWon?(wagerNet+wager):0};
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
      <div className="crd" style={{padding:"28px 24px",marginBottom:24,background:"rgba(var(--cx),.04)",borderColor:"rgba(var(--cx),.12)"}}>
        <p style={{fontSize:20,lineHeight:1.8,color:"var(--t1)",fontFamily:"'DM Sans',sans-serif"}}>
          {parts.map(function(part,i){return(<span key={i}>{part}
            {i<parts.length-1&&(answerWord
              ?<span style={{color:isCorrect?"var(--green)":"var(--red)",fontWeight:700,borderBottom:"3px solid "+(isCorrect?"var(--green)":"var(--red)"),padding:"0 4px"}}>{answerWord}</span>
              :<span style={{display:"inline-block",minWidth:88,borderBottom:"3px solid var(--cyan)",margin:"0 6px",verticalAlign:"bottom",opacity:.6}}>{"        "}</span>)}
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
      <Bar value={phase==="ans_fb"?ci+1:ci} max={TOTAL} h={4} color="linear-gradient(90deg,var(--cx-hex),#8b5e83)"/>
      <div style={{marginTop:20,marginBottom:12}}>
        <span className="out" style={{fontSize:11,fontWeight:700,color:"var(--cyan)",textTransform:"uppercase",letterSpacing:1}}>{"🧭"} {phase==="clue_fb"||phase==="ans_fb"?items[ci].cat:"Find the clue..."}</span>
      </div>
    </>);
  }
 
  // ── INTRO ──
  if(phase==="intro")return(
    <div className="enter" style={{padding:"32px 24px",minHeight:"100vh",display:"flex",flexDirection:"column",justifyContent:"center"}}>
      <div style={{textAlign:"center",marginBottom:36}}>
        <div style={{marginBottom:16,display:"flex",justifyContent:"center"}}><GIcon name="spyglass" size={76} color="var(--cyan)"/></div>
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
              <div style={{width:30,height:30,borderRadius:"50%",background:"linear-gradient(135deg,var(--cx-hex),#8b5e83)",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
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
    var correct=scores.filter(function(s){return s.clue||s.ans;}).length;
    if(p.gate)xp=p.gate(xp,correct,TOTAL);
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
        <button className="btn1" onClick={function(){var correct=scores.filter(function(s){return s.clue||s.ans;}).length;p.done(correct,TOTAL,xp);}}>Collect XP</button>
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
              style={{padding:"11px 20px",borderRadius:28,border:"2px solid "+(isSel?"var(--cyan)":"var(--bdr)"),background:isSel?"rgba(var(--cx),.12)":"var(--bg2)",color:isSel?"var(--cyan)":"var(--t1)",fontSize:15,fontFamily:"'DM Sans',sans-serif",fontWeight:isSel?700:500,cursor:"pointer",transition:"all .15s",transform:isSel?"scale(1.05)":"scale(1)"}}>
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
      <div className="crd" style={{padding:20,background:"rgba(var(--cx),.06)",borderColor:"rgba(var(--cx),.15)",marginBottom:28}}>
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
        <div className="crd" style={{padding:18,background:"rgba(var(--cx),.06)",borderColor:"rgba(var(--cx),.15)",marginBottom:24}}>
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

// ─── WORD TAVERN ───
function WordTavern(p){
  var TOTAL=15;
  var qs=useMemo(function(){
    // Build flat list of all cards with their domain
    var all=[];
    VOCAB.forEach(function(dom){dom.cards.forEach(function(c){all.push({card:c,domId:dom.id,domCards:dom.cards});});});
    var pool=shuffle(all.slice()).slice(0,TOTAL);
    var questions=[];
    for(var i=0;i<pool.length;i++){
      var item=pool[i];var card=item.card;var domCards=item.domCards;
      // Pick 3 distractors from same domain (excluding correct card)
      var others=domCards.filter(function(c){return c.id!==card.id;});
      others=shuffle(others).slice(0,3);
      // If domain has < 4 cards, pad from other domains
      if(others.length<3){var extra=all.filter(function(a){return a.card.id!==card.id&&others.every(function(o){return o.id!==a.card.id;});});extra=shuffle(extra);while(others.length<3&&extra.length>0)others.push(extra.pop().card);}
      // Determine question type: 0-4=A (def→word), 5-9=B (word→def), 10-14=C (fill-blank)
      var qtype=i<5?"defToWord":i<10?"wordToDef":"fillBlank";
      var q=null;
      if(qtype==="defToWord"){
        var opts=shuffle([{text:card.w,correct:true}].concat(others.map(function(o){return{text:o.w,correct:false};})));
        q={type:"defToWord",prompt:card.d,opts:opts,card:card,example:card.e};
      } else if(qtype==="wordToDef"){
        var opts2=shuffle([{text:card.d,correct:true}].concat(others.map(function(o){return{text:o.d,correct:false};})));
        q={type:"wordToDef",prompt:card.w,opts:opts2,card:card,example:card.e};
      } else {
        // Fill-in-the-blank: replace word in example sentence
        var sentence=card.e;var regex=new RegExp("\\b"+card.w.replace(/[.*+?^${}()|[\]\\]/g,"\\$&")+"\\b","i");
        if(regex.test(sentence)){
          var blanked=sentence.replace(regex,"_____");
          var opts3=shuffle([{text:card.w,correct:true}].concat(others.map(function(o){return{text:o.w,correct:false};})));
          q={type:"fillBlank",prompt:blanked,opts:opts3,card:card,example:card.e};
        } else {
          // Fallback to defToWord if word not found in example
          var opts4=shuffle([{text:card.w,correct:true}].concat(others.map(function(o){return{text:o.w,correct:false};})));
          q={type:"defToWord",prompt:card.d,opts:opts4,card:card,example:card.e};
        }
      }
      questions.push(q);
    }
    return shuffle(questions);
  },[]);

  var[ci,sC]=useState(0);
  var[sc,sSc]=useState(0);
  var[phase,sP]=useState("intro");
  var[sel,sSel]=useState(-1);
  var[missed,setMissed]=useState([]);

  function answer(idx){
    if(sel!==-1)return;
    sSel(idx);
    var correct=qs[ci].opts[idx].correct;
    if(correct){sSc(sc+1);try{playCorrect();}catch(e){}}
    else{
      try{playWrong();}catch(e){}
      // SRS reset: send missed word back to review
      var cardId=qs[ci].card.id;
      setMissed(function(prev){return prev.concat([cardId]);});
      if(p.u&&p.u.cardStates){
        var c=JSON.parse(JSON.stringify(p.u));
        c.cardStates[cardId]={ease:2.5,interval:0,nextReview:today(),correct:(c.cardStates[cardId]?c.cardStates[cardId].correct:0)||0,total:(c.cardStates[cardId]?c.cardStates[cardId].total:0)||0};
        p.resetCard(c);
      }
    }
    setTimeout(function(){
      if(ci<qs.length-1){sC(ci+1);sSel(-1);}
      else{
        var finalSc=sc+(correct?1:0);
        var baseXp=20+finalSc*6;
        var gxp=p.gate?p.gate(baseXp,finalSc,TOTAL):baseXp;
        sP("done");
        p.done(finalSc,TOTAL,gxp);
      }
    },1200);
  }

  // ── INTRO ──
  if(phase==="intro")return(<div className="enter" style={{padding:"20px 16px",minHeight:"100vh",display:"flex",flexDirection:"column",justifyContent:"center",textAlign:"center"}}>
    <div style={{marginBottom:16,display:"flex",justifyContent:"center"}}><GIcon name="beer-stein" size={60} color="var(--cyan)"/></div>
    <h1 className="out" style={{fontWeight:900,fontSize:26,marginBottom:8}}>Word Tavern</h1>
    <p style={{color:"var(--t2)",fontSize:13,marginBottom:8,lineHeight:1.6}}>15 questions to test your vocabulary.<br/>Words you miss go back to flashcard review.</p>
    <p style={{color:"var(--t3)",fontSize:11,marginBottom:32}}>Definitions, meanings, and fill-in-the-blank</p>
    <button className="btn1" onClick={function(){sP("q");}}>Enter the Tavern</button>
    <button className="btn2" onClick={p.back} style={{marginTop:12,width:"100%"}}>Back</button></div>);

  // ── DONE ──
  if(phase==="done"){
    var pct=TOTAL>0?sc/TOTAL:0;
    var emoji=pct>=0.8?"\uD83C\uDFC6":pct>=0.5?"\u2694\uFE0F":"\uD83D\uDEE1\uFE0F";
    var title=pct>=0.8?"Excellent!":pct>=0.5?"Well done!":"Keep studying!";
    var baseXp=20+sc*6;
    var gxp=p.gate?p.gate(baseXp,sc,TOTAL):baseXp;
    var missedCount=missed.length;
    return(<div className="enter" style={{padding:"20px 16px",minHeight:"100vh",display:"flex",flexDirection:"column",justifyContent:"center",textAlign:"center"}}>
      <div style={{fontSize:56,marginBottom:16,animation:"countUp .6s"}}>{emoji}</div>
      <h1 className="out" style={{fontWeight:900,fontSize:28,marginBottom:8}}>{title}</h1>
      <p style={{color:"var(--t2)",fontSize:16,marginBottom:4}}>{sc} / {TOTAL}</p>
      <p className="out" style={{color:"var(--gold)",fontWeight:700,fontSize:20,marginBottom:16}}>+{gxp} XP</p>
      {missedCount>0&&<p style={{fontSize:12,color:"var(--red)",marginBottom:16}}>{missedCount} word{missedCount>1?"s":""} sent back to flashcard review</p>}
      <button className="btn1" onClick={p.back} style={{marginTop:8}}>Back to Games</button>
    </div>);
  }

  // ── QUESTION ──
  var q=qs[ci];
  var qLabel=q.type==="defToWord"?"Which word matches this definition?":q.type==="wordToDef"?"What does this word mean?":"Fill in the blank:";
  return(<div style={{padding:"20px 16px",minHeight:"100vh"}}>
    <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16}}>
      <button className="back-btn" onClick={p.back}>{"\u2190"} Back</button>
      <span className="out" style={{fontSize:13,color:"var(--t2)",fontWeight:600}}>{ci+1}/{TOTAL}</span>
      <div style={{width:40}}/>
    </div>
    <Bar value={ci} max={TOTAL} h={4} color="linear-gradient(90deg,#c87a35,#8b5e83)"/>
    <div style={{marginTop:32,marginBottom:24}}>
      <div className="out" style={{fontSize:11,color:"var(--cx-hex)",textTransform:"uppercase",letterSpacing:1,fontWeight:600,marginBottom:12}}>{qLabel}</div>
      <div className="crd" style={{padding:20,textAlign:"center",minHeight:80,display:"flex",alignItems:"center",justifyContent:"center"}}>
        <div style={{fontSize:q.type==="fillBlank"?15:q.type==="wordToDef"?24:15,fontWeight:q.type==="wordToDef"?800:400,lineHeight:1.5}}>{q.prompt}</div>
      </div>
    </div>
    <div style={{display:"flex",flexDirection:"column",gap:10}}>
      {q.opts.map(function(opt,oi){
        var isSelected=sel===oi;
        var isCorrect=opt.correct;
        var showResult=sel!==-1;
        var bg="var(--bg2)";var bdr="var(--bdr)";var col="var(--t1)";
        if(showResult&&isCorrect){bg="rgba(74,190,96,.15)";bdr="rgba(74,190,96,.5)";col="var(--green)";}
        else if(showResult&&isSelected&&!isCorrect){bg="rgba(224,82,82,.15)";bdr="rgba(224,82,82,.5)";col="var(--red)";}
        return(<button key={oi} onClick={function(){answer(oi);}} disabled={sel!==-1} style={{padding:"14px 16px",background:bg,border:"1.5px solid "+bdr,borderRadius:12,cursor:sel===-1?"pointer":"default",textAlign:"left",fontSize:14,color:col,lineHeight:1.4,fontFamily:"'DM Sans',sans-serif"}}>{opt.text}</button>);
      })}
    </div>
    {sel!==-1&&<div style={{marginTop:16,padding:"12px 16px",background:"var(--bg3)",borderRadius:10}}>
      <div style={{fontSize:12,color:"var(--t2)",fontStyle:"italic",lineHeight:1.5}}>{"\u201C"}{q.example}{"\u201D"}</div>
    </div>}
  </div>);
}

// ─── SPEED MATCH ───

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
    <div style={{marginBottom:16,display:"flex",justifyContent:"center"}}><GIcon name="chained-arrow-heads" size={60} color="var(--cyan)"/></div>
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
  return(<div style={{padding:"12px",height:"calc(100dvh - 64px - env(safe-area-inset-bottom, 0px))",display:"flex",flexDirection:"column"}}>
    <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12}}>
      <div/>
      <div style={{display:"flex",gap:16,alignItems:"center"}}>
        <span className="out" style={{fontSize:16,fontWeight:800,color:"var(--cyan)",fontVariantNumeric:"tabular-nums"}}>{elapsed}s</span>
        <span style={{fontSize:12,color:"var(--t3)"}}>{moves} moves</span>
      </div>
      <span style={{fontSize:12,color:"var(--t2)"}}>{matched.length}/{pairCount}</span>
    </div>
    <div style={{width:"100%",height:4,background:"var(--bg3)",borderRadius:2,marginBottom:20,overflow:"hidden"}}>
      <div style={{height:"100%",width:Math.round(matched.length/pairCount*100)+"%",background:"linear-gradient(90deg,var(--cx-hex),#8b5e83)",borderRadius:2,transition:"width .3s"}}/></div>

    <div style={{display:"grid",gridTemplateColumns:"repeat("+cols+",1fr)",gridTemplateRows:"repeat("+rows+",1fr)",gap:6,flex:1}}>
      {pairs.map(function(tile){
        var isRevealed=revealed.indexOf(tile.id)!==-1;
        var isMatched=matched.indexOf(tile.pairId)!==-1;
        var bgColor=isMatched?"rgba(0,230,118,.18)":isRevealed?(tile.type==="word"?"rgba(var(--cx),.2)":"rgba(27,112,207,.2)"):"var(--bg3)";
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
      setFeedback({type:"ok",text:newCombo>=3?newCombo+"-combo! x"+mult:"Correct!"});
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
    <div style={{marginBottom:16,display:"flex",justifyContent:"center"}}><GIcon name="meteor-impact" size={60} color="var(--cyan)"/></div>
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

  return(<div className={shake?"sk":""} style={{height:"calc(100dvh - 64px - env(safe-area-inset-bottom, 0px))",display:"flex",flexDirection:"column",background:"var(--bg)",overflow:"hidden"}}>
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
// AVATAR MEDAL — SVG shield + Game Icons icon
// ═══════════════════════════════════════════════════════════════
var RARITY_STYLES={
  common:{bg:"#1a1a1a",stroke:"#808080",icon:"#d0d0d0",glow:null,anim:null},
  uncommon:{bg:"#0b1e10",stroke:"#3ecc78",icon:"#80f0a0",glow:null,anim:null},
  rare:{bg:"#091628",stroke:"#3a8ee0",icon:"#80c0f8",glow:"drop-shadow(0 0 4px #3a8ee066) drop-shadow(0 0 8px #3a8ee033)",anim:"rareGlow 3s ease-in-out infinite"},
  epic:{bg:"#160824",stroke:"#c060f0",icon:"#e090ff",glow:"drop-shadow(0 0 5px #c060f088) drop-shadow(0 0 10px #c060f044)",anim:"epicGlow 2.5s ease-in-out infinite"},
  legend:{bg:"#0a0608",stroke:"#ffc020",icon:"#ffe080",glow:"drop-shadow(0 0 6px #ffc020aa) drop-shadow(0 0 14px #ffc02055)",anim:"legendGlow 2s ease-in-out infinite"},
};
function AvatarMedal(p){
  var avatarId=p.avatarId;var size=p.size||48;
  var av=AVATARS[avatarId];
  if(!av)return(<div style={{width:size,height:size,borderRadius:size*.35,background:"var(--bg3)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:size*.5}}>{"?"}</div>);
  var rs=RARITY_STYLES[av.rarity]||RARITY_STYLES.common;
  var iconPath=GAME_ICON_PATHS[av.icon]||"";
  var svgStyle={overflow:"visible",flexShrink:0,display:"inline-block",verticalAlign:"middle"};
  if(rs.anim)svgStyle.animation=rs.anim;
  else if(rs.glow)svgStyle.filter=rs.glow;
  return(<svg viewBox="0 0 100 100" width={size} height={size} style={svgStyle}>
    <path d="M 50,7 L 90,20 L 90,56 C 90,76 72,88 50,96 C 28,88 10,76 10,56 L 10,20 Z" fill={rs.bg} stroke={rs.stroke} strokeWidth="1.5"/>
    <path d="M 50,13 L 84,24 L 84,54 C 84,72 67,83 50,90 C 33,83 16,72 16,54 L 16,24 Z" fill="none" stroke={rs.stroke} strokeWidth="0.7" opacity="0.35"/>
    <svg x="16" y="18" width="68" height="65" viewBox="0 0 512 512" style={{color:rs.icon}}>
      <g fill={rs.icon} dangerouslySetInnerHTML={{__html:iconPath}}/>
    </svg>
  </svg>);
}

// ═══════════════════════════════════════════════════════════════
// TREASURE CHEST SVG — reusable wooden chest (scales to any size)
// Used in both ChestEarnedToast (small, wiggling) and ChestOpenModal (large, exploding)
// ═══════════════════════════════════════════════════════════════
function TreasureChestSvg(p){
  var size=p.size||180;
  var animationClass=p.animationClass||"";
  return(
  <svg viewBox="0 0 180 150" width={size} height={size*150/180} style={{overflow:"visible"}} aria-hidden="true">
    <defs>
      <linearGradient id={"woodLid_"+(p.idSuffix||"def")} x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stopColor="#8b5a2b"/><stop offset="60%" stopColor="#6b3f1a"/><stop offset="100%" stopColor="#4a2a10"/>
      </linearGradient>
      <linearGradient id={"woodBody_"+(p.idSuffix||"def")} x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stopColor="#6b3f1a"/><stop offset="100%" stopColor="#3a1f0a"/>
      </linearGradient>
      <linearGradient id={"metalBand_"+(p.idSuffix||"def")} x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stopColor="#6a4e20"/><stop offset="50%" stopColor="#4a3614"/><stop offset="100%" stopColor="#2e2008"/>
      </linearGradient>
      <linearGradient id={"goldLock_"+(p.idSuffix||"def")} x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stopColor="#f0c850"/><stop offset="50%" stopColor="#d4943a"/><stop offset="100%" stopColor="#8b5e20"/>
      </linearGradient>
    </defs>
    {/* Body (bottom half) */}
    <g className={"chest-body-group "+(animationClass==="explode"?"chest-v2-body-explode":"")}>
      <rect x="10" y="65" width="160" height="80" rx="3" fill={"url(#woodBody_"+(p.idSuffix||"def")+")"} stroke="#2a1509" strokeWidth="1.5"/>
      <line x1="50" y1="68" x2="50" y2="142" stroke="#2a1509" strokeWidth="1" opacity="0.7"/>
      <line x1="90" y1="68" x2="90" y2="142" stroke="#2a1509" strokeWidth="1" opacity="0.7"/>
      <line x1="130" y1="68" x2="130" y2="142" stroke="#2a1509" strokeWidth="1" opacity="0.7"/>
      <rect x="8" y="63" width="164" height="6" fill={"url(#metalBand_"+(p.idSuffix||"def")+")"} stroke="#1a1005" strokeWidth="0.5"/>
      <rect x="8" y="100" width="164" height="4" fill={"url(#metalBand_"+(p.idSuffix||"def")+")"} stroke="#1a1005" strokeWidth="0.5"/>
      <rect x="8" y="138" width="164" height="5" fill={"url(#metalBand_"+(p.idSuffix||"def")+")"} stroke="#1a1005" strokeWidth="0.5"/>
      <circle cx="14" cy="66" r="1.8" fill="#8b6a30"/><circle cx="166" cy="66" r="1.8" fill="#8b6a30"/>
      <circle cx="14" cy="141" r="1.8" fill="#8b6a30"/><circle cx="166" cy="141" r="1.8" fill="#8b6a30"/>
      <rect x="12" y="138" width="18" height="8" rx="1" fill={"url(#metalBand_"+(p.idSuffix||"def")+")"}/>
      <rect x="150" y="138" width="18" height="8" rx="1" fill={"url(#metalBand_"+(p.idSuffix||"def")+")"}/>
      <rect x="78" y="78" width="24" height="22" rx="2" fill={"url(#goldLock_"+(p.idSuffix||"def")+")"} stroke="#5a3c10" strokeWidth="1"/>
      <circle cx="90" cy="86" r="3" fill="#1a1005"/>
      <path d="M 88.5 86 L 91.5 86 L 91 94 L 89 94 Z" fill="#1a1005"/>
      <rect x="80" y="79" width="20" height="3" rx="1" fill="rgba(255,240,180,0.5)"/>
    </g>
    {/* Lid (top half) */}
    <g className={"chest-lid-group "+(animationClass==="explode"?"chest-v2-lid-fly":"")}>
      <path d="M 10 65 Q 10 15 90 15 Q 170 15 170 65 Z" fill={"url(#woodLid_"+(p.idSuffix||"def")+")"} stroke="#2a1509" strokeWidth="1.5"/>
      <path d="M 10 65 Q 10 15 90 15 Q 170 15 170 65" fill="none" stroke="rgba(0,0,0,0.3)" strokeWidth="1"/>
      <path d="M 50 65 Q 55 25 65 20" fill="none" stroke="#2a1509" strokeWidth="1" opacity="0.6"/>
      <path d="M 90 65 L 90 15" stroke="#2a1509" strokeWidth="1" opacity="0.6"/>
      <path d="M 130 65 Q 125 25 115 20" fill="none" stroke="#2a1509" strokeWidth="1" opacity="0.6"/>
      <path d="M 10 65 Q 10 15 90 15 Q 170 15 170 65" fill="none" stroke={"url(#metalBand_"+(p.idSuffix||"def")+")"} strokeWidth="5"/>
      <rect x="87" y="16" width="6" height="49" fill={"url(#metalBand_"+(p.idSuffix||"def")+")"}/>
      <circle cx="90" cy="19" r="2" fill="#d4943a" stroke="#5a3c10" strokeWidth="0.5"/>
      <rect x="85" y="60" width="10" height="10" fill={"url(#goldLock_"+(p.idSuffix||"def")+")"} stroke="#5a3c10" strokeWidth="1"/>
    </g>
  </svg>);
}

// ═══════════════════════════════════════════════════════════════
// TRIGGER LABEL — human-friendly description of why a chest was granted
// ═══════════════════════════════════════════════════════════════
function getTriggerLabel(trigger){
  if(!trigger)return"Milestone reached";
  if(trigger==="apology_crisis_2026-04-21")return"A gift from your teacher — thanks for your patience";
  if(trigger==="mock_1")return"Mock Test 1 completed";
  if(trigger==="mock_2")return"Mock Test 2 completed";
  if(trigger==="mock_3")return"Mock Test 3 completed";
  if(trigger==="boss_test")return"The Final Arena conquered";
  if(trigger==="streak_7")return"7-day streak";
  if(trigger==="streak_30")return"30-day streak";
  if(trigger==="streak_100")return"100-day streak";
  if(trigger==="xp_1k")return"1,000 XP milestone";
  if(trigger==="xp_3k")return"3,000 XP milestone";
  if(trigger==="xp_5k")return"5,000 XP milestone";
  if(trigger==="xp_10k")return"10,000 XP milestone";
  if(trigger==="xp_20k")return"20,000 XP milestone";
  if(trigger==="xp_30k")return"30,000 XP milestone";
  if(trigger==="xp_50k")return"50,000 XP milestone";
  if(trigger==="duel_win")return"Duel victory";
  if(trigger==="duel_win3")return"3 duel wins in a row";
  if(trigger==="wfall_combo10")return"Word Fall combo x10";
  if(trigger==="wfall_combo20")return"Word Fall combo x20";
  if(trigger==="wfall_combo30")return"Word Fall combo x30";
  if(trigger==="smatch_easy_good")return"Speed Match mastered";
  if(trigger==="smatch_easy_80")return"Speed Match 80%+";
  if(trigger==="smatch_hard_80")return"Speed Match Hard 80%+";
  if(trigger==="clue_perfect")return"Clue Hunter perfect run";
  if(trigger==="ablitz_70")return"Audio Blitz 70%+";
  if(trigger==="ablitz_90")return"Audio Blitz 90%+";
  if(trigger==="sbuild_90")return"Sentence Builder 90%+";
  if(trigger==="gauntlet_irregular_perfect")return"Irregular Crypt perfect raid";
  if(trigger==="gauntlet_tense_perfect")return"Chronomancer mastered";
  if(trigger==="gauntlet_passive_perfect")return"Passive Forge mastered";
  if(trigger==="gauntlet_relative_perfect")return"Relative Weaver mastered";
  if(trigger.indexOf("league_up_")===0){
    var lg=trigger.substring(10);
    return"Promoted to "+lg.charAt(0).toUpperCase()+lg.slice(1)+" League";
  }
  if(trigger.indexOf("ach_legendary_")===0){
    var achId=trigger.substring(14);
    var ach=ACHIEVEMENTS.find(function(a){return a.id===achId;});
    return(ach?ach.name:"Legendary achievement")+" unlocked";
  }
  if(trigger.indexOf("ach_epic_")===0){
    var achIdE=trigger.substring(9);
    var achE=ACHIEVEMENTS.find(function(a){return a.id===achIdE;});
    return(achE?achE.name:"Epic achievement")+" unlocked";
  }
  if(trigger.indexOf("ach_novice_")===0){
    var achIdN=trigger.substring(11);
    var achN=ACHIEVEMENTS.find(function(a){return a.id===achIdN;});
    return(achN?achN.name:"Achievement")+" unlocked";
  }
  return"Milestone reached";
}

// ═══════════════════════════════════════════════════════════════
// CHEST EARNED TOAST — appears at the moment a chest is granted
// ═══════════════════════════════════════════════════════════════
function ChestEarnedToast(p){
  var ct=CHEST_TYPES[p.chestType]||CHEST_TYPES.novice;
  var isLegend=p.chestType==="legendaire";
  // Rarity color for border/glow — use ct label or default gold
  var rarityColor=isLegend?"#ffc020":p.chestType==="champion"?"#d4943a":p.chestType==="guerrier"?"#3a8ee0":"#909090";
  var [closing,setClosing]=useState(false);
  var [showFlash,setShowFlash]=useState(isLegend);
  var duration=isLegend?12000:p.chestType==="champion"?8000:5000;

  useEffect(function(){
    if(showFlash){
      var tf=setTimeout(function(){setShowFlash(false);},400);
      return function(){clearTimeout(tf);};
    }
  },[showFlash]);

  useEffect(function(){
    var t=setTimeout(function(){setClosing(true);setTimeout(p.onDismiss,300);},duration);
    return function(){clearTimeout(t);};
  },[]);

  function doDismiss(){setClosing(true);setTimeout(p.onDismiss,300);}
  function doOpenNow(){setClosing(true);setTimeout(p.onOpenNow,200);}

  return(<>
    {/* Legendary full-screen gold flash (only once, 400ms) */}
    {showFlash&&<div style={{position:"fixed",inset:0,background:"radial-gradient(ellipse at center, rgba(255,200,50,.6), rgba(255,192,32,.3) 40%, transparent 80%)",pointerEvents:"none",zIndex:199,animation:"legendGoldFlash .4s ease-out forwards"}}/>}

    <div style={{position:"fixed",bottom:86,left:"50%",transform:"translateX(-50%)",width:"calc(100% - 24px)",maxWidth:380,zIndex:200,animation:closing?"toastFadeOut .3s ease-out forwards":"toastSlideUp .4s cubic-bezier(.2,.8,.3,1.2)",pointerEvents:"auto"}}>
      <div style={{background:"linear-gradient(180deg,#1f1610,#120a04)",border:"1.5px solid "+rarityColor,borderRadius:16,padding:"12px 14px",boxShadow:"0 -6px 30px rgba(0,0,0,.6), 0 0 40px "+rarityColor+"55",display:"flex",gap:12,alignItems:"center",position:"relative",overflow:"hidden"}}>
        {/* Legendary shimmer sweep */}
        {isLegend&&<div style={{position:"absolute",inset:0,background:"linear-gradient(110deg,transparent 30%,rgba(255,220,120,.18) 50%,transparent 70%)",backgroundSize:"300%",animation:"legendShimmer 3s ease-in-out infinite",pointerEvents:"none",borderRadius:16}}/>}

        {/* Mini chest with halo */}
        <div style={{position:"relative",flexShrink:0,width:54,height:54,display:"flex",alignItems:"center",justifyContent:"center"}}>
          <div style={{position:"absolute",inset:-4,borderRadius:"50%",background:"radial-gradient(circle,"+rarityColor+"55,transparent 70%)",filter:"blur(4px)"}}/>
          <div style={{animation:"chestWiggle 1.4s ease-in-out infinite"}}>
            <TreasureChestSvg size={54} idSuffix={"toast_"+p.toastId}/>
          </div>
        </div>

        {/* Text */}
        <div style={{flex:1,minWidth:0,position:"relative",zIndex:2}}>
          <div className="out" style={{fontSize:10,fontWeight:700,color:rarityColor,letterSpacing:1.5,textTransform:"uppercase"}}>Treasure earned</div>
          <div style={{fontSize:14,fontWeight:700,color:"var(--t1)",marginTop:2}}>{ct.label} Chest</div>
          <div style={{fontSize:11,color:"var(--t2)",marginTop:1,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{p.reason}</div>
        </div>

        {/* Close X */}
        <button onClick={doDismiss} aria-label="Dismiss" style={{background:"none",border:"none",color:"var(--t3)",fontSize:18,cursor:"pointer",padding:0,lineHeight:1,flexShrink:0,marginTop:-22,alignSelf:"flex-start",position:"relative",zIndex:2}}>{String.fromCharCode(215)}</button>
      </div>

      {/* Actions */}
      <div style={{display:"flex",gap:6,marginTop:6}}>
        <button onClick={doOpenNow} style={{flex:"1 1 auto",padding:"8px 12px",background:"linear-gradient(135deg,"+rarityColor+","+rarityColor+"bb)",border:"none",borderRadius:10,color:"#0f0c08",fontSize:13,fontWeight:700,cursor:"pointer",fontFamily:"'Cinzel','Outfit',serif",letterSpacing:.5}}>Open now {"\u2694\uFE0F"}</button>
        <button onClick={doDismiss} style={{padding:"8px 14px",background:"rgba(0,0,0,.3)",border:"1px solid var(--bdr)",borderRadius:10,color:"var(--t2)",fontSize:12,fontWeight:600,cursor:"pointer",fontFamily:"'DM Sans',sans-serif"}}>Later</button>
      </div>
    </div>
  </>);
}

// ═══════════════════════════════════════════════════════════════
// CHEST OPEN MODAL V2 — Boss Loot cinematic animation
// Phases: zoom (0.6s) → trembor (1s) → explode/beam (0.6s) → reveal
// ═══════════════════════════════════════════════════════════════
function ChestOpenModal(p){
  var[phase,setPhase]=useState("build"); // build → explode → reveal
  var chest=p.chest;var result=p.result;
  var ct=CHEST_TYPES[chest.chest_type]||CHEST_TYPES.novice;
  // Rarity color derived from chest type (fallback until result arrives)
  var defaultColor=chest.chest_type==="legendaire"?"#ffc020":chest.chest_type==="champion"?"#d4943a":chest.chest_type==="guerrier"?"#3a8ee0":"#909090";
  var rarityColor=(result&&result.rarityColor)||defaultColor;
  var rarityLabel=(result&&result.rarityLabel)||ct.label;

  useEffect(function(){
    if(phase==="build"){
      // Build-up (zoom + trembor): 2.0s → trigger open + explode
      var t=setTimeout(function(){p.onOpen();setPhase("explode");},2000);
      return function(){clearTimeout(t);};
    }
    if(phase==="explode"){
      var t2=setTimeout(function(){setPhase("reveal");},1400);
      return function(){clearTimeout(t2);};
    }
  },[phase]);

  // Build shard angles once
  var woodShards=[];for(var i=0;i<8;i++){var a=(i/8)*360+22;woodShards.push({angle:a,dist:120+Math.random()*60});}
  var metalShards=[];for(var j=0;j<5;j++){var a2=(j/5)*360+45;metalShards.push({angle:a2,dist:100+Math.random()*80});}
  var magicShards=[];for(var k=0;k<6;k++){var a3=-70+(k/5)*140;magicShards.push({angle:a3,dist:150+Math.random()*80});}
  var speedLines=[];for(var m=0;m<6;m++){speedLines.push({left:(20+m*12)+"%",delay:(Math.random()*0.3)+"s"});}

  return(<div style={{position:"fixed",inset:0,background:"radial-gradient(ellipse at center,#1a0a00 0%,#080402 100%)",zIndex:10000,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:20,overflow:"hidden"}}>
    <div style={{position:"fixed",inset:0,background:"radial-gradient(ellipse at center,transparent 20%,rgba(0,0,0,.6) 80%)",pointerEvents:"none",zIndex:1}}/>

    {/* Stage */}
    <div style={{position:"relative",width:360,maxWidth:"100%",height:480,display:"flex",alignItems:"center",justifyContent:"center",zIndex:5,overflow:"hidden"}}>

      {/* Phase 1-2: Chest (visible during build + explode phases) */}
      {(phase==="build"||phase==="explode")&&<div style={{position:"absolute",width:180,height:150,opacity:0,transform:"scale(.3)",animation:"chestV2Zoom .6s cubic-bezier(.2,.8,.4,1.3) 0s forwards, chestV2Trembor .5s ease-in-out 1s 2"+(phase==="explode"?", none":""),filter:"drop-shadow(0 12px 20px rgba(0,0,0,.8))",zIndex:3}}>
        <style>{"@keyframes v2LidFlyLocal { 0%{transform:translateY(0) rotate(0);opacity:1} 40%{transform:translateY(-80px) rotate(-30deg);opacity:1} 100%{transform:translateY(-200px) rotate(-80deg);opacity:0} } @keyframes v2BodyCollapseLocal { 0%{transform:scale(1,1) translateY(0);opacity:1;filter:brightness(1)} 40%{transform:scale(1.1,.85) translateY(8px);filter:brightness(2)} 100%{transform:scale(.4,.2) translateY(30px);opacity:0;filter:brightness(4)} } .cov2-exploding .chest-lid-group{transform-origin:50% 100%;animation:v2LidFlyLocal .6s ease-out forwards} .cov2-exploding .chest-body-group{transform-origin:50% 50%;animation:v2BodyCollapseLocal .5s ease-in .1s forwards}"}</style>
        <div className={phase==="explode"?"cov2-exploding":""}>
          <TreasureChestSvg size={180} idSuffix="modal"/>
        </div>
      </div>}

      {/* Explode phase FX */}
      {phase==="explode"&&<>
        {/* Dust cloud */}
        <div style={{position:"absolute",top:"50%",left:"50%",width:80,height:80,borderRadius:"50%",background:"radial-gradient(circle,rgba(120,90,60,.4),transparent 70%)",transform:"translate(-50%,-50%) scale(0)",opacity:0,animation:"chestV2DustExpand 1s ease-out .1s forwards",zIndex:2,filter:"blur(3px)"}}/>
        {/* Explosion burst */}
        <div style={{position:"absolute",width:10,height:10,borderRadius:"50%",background:"radial-gradient(circle,white 0%,"+rarityColor+" 30%,transparent 70%)",opacity:0,animation:"chestV2BurstExpand .6s ease-out 0s forwards",zIndex:4}}/>
        {/* Screen flash */}
        <div style={{position:"fixed",inset:0,background:"white",opacity:0,animation:"chestV2ScreenFlash .4s ease-out 0s",zIndex:10,pointerEvents:"none"}}/>
        {/* Wood shards */}
        {woodShards.map(function(s,i){return(<div key={"w"+i} style={{position:"absolute",width:10,height:16,background:"linear-gradient(180deg,#6b3f1a,#4a2a10)",top:"50%",left:"50%",borderRadius:2,opacity:0,boxShadow:"inset 0 -2px 3px rgba(0,0,0,.5)",animation:"chestV2ShardFly .9s ease-out .1s forwards","--angle":s.angle+"deg","--dist":s.dist+"px",zIndex:6}}/>);})}
        {/* Metal shards */}
        {metalShards.map(function(s,i){return(<div key={"m"+i} style={{position:"absolute",width:6,height:10,background:"linear-gradient(180deg,#8b6a30,#5a4418)",top:"50%",left:"50%",borderRadius:1,opacity:0,boxShadow:"0 0 4px rgba(212,148,58,.6)",animation:"chestV2ShardFly .9s ease-out .2s forwards","--angle":s.angle+"deg","--dist":s.dist+"px",zIndex:6}}/>);})}
        {/* Magic shards */}
        {magicShards.map(function(s,i){return(<div key={"mg"+i} style={{position:"absolute",width:5,height:12,background:rarityColor,top:"50%",left:"50%",borderRadius:2,opacity:0,filter:"drop-shadow(0 0 6px "+rarityColor+")",animation:"chestV2ShardFly 1s ease-out .2s forwards","--angle":s.angle+"deg","--dist":s.dist+"px",zIndex:6}}/>);})}
        {/* Vertical beam — fixed to viewport so it spans the full screen height */}
        <div style={{position:"fixed",top:"50%",left:"50%",width:80,height:0,background:"linear-gradient(to top,transparent 0%,"+rarityColor+" 30%,rgba(255,255,255,.9) 70%,transparent 100%)",transform:"translate(-50%,-50%)",opacity:0,animation:"chestV2BeamGrow .5s ease-out .2s forwards, chestV2BeamShrink .5s ease-in 1.2s forwards",zIndex:2,filter:"blur(1px)",pointerEvents:"none"}}/>
      </>}

      {/* Reveal phase */}
      {phase==="reveal"&&result&&<>
        {/* Speed lines during fall */}
        {speedLines.map(function(sl,i){return(<div key={i} style={{position:"absolute",width:2,height:80,background:"linear-gradient(to bottom,transparent,"+rarityColor+",transparent)",left:sl.left,top:"15%",opacity:0,animation:"chestV2SpeedLine .8s ease-out "+sl.delay}}/>);})}
        {/* Impact ring */}
        <div style={{position:"absolute",top:"65%",left:"50%",width:200,height:40,borderRadius:"50%",border:"2px solid "+rarityColor,transform:"translate(-50%,-50%) scaleY(.4)",opacity:0,animation:"chestV2ImpactRing .8s ease-out .8s forwards",filter:"blur(1px)",zIndex:4}}/>
        {/* Reward card */}
        <div style={{position:"absolute",width:220,padding:"22px 18px",borderRadius:14,background:"linear-gradient(180deg,#2a1e14 0%,#1a1208 100%)",border:"2px solid "+rarityColor,boxShadow:"0 0 60px "+rarityColor+", 0 0 120px "+rarityColor+"66, inset 0 0 30px rgba(0,0,0,.6)",textAlign:"center",opacity:0,transform:"translateY(-220px) scale(.6) rotate(-8deg)",animation:"chestV2RewardFall .8s cubic-bezier(.3,.1,.4,1.4) 0s forwards, chestV2RewardSettle .4s ease-out .8s forwards",zIndex:5}}>
          <div className="out" style={{fontSize:11,fontWeight:900,color:rarityColor,letterSpacing:3,textTransform:"uppercase",marginBottom:10,padding:"4px 10px",display:"inline-block",border:"1px solid "+rarityColor,borderRadius:4}}>{rarityLabel}</div>
          <div style={{margin:"10px 0",filter:"drop-shadow(0 0 18px "+rarityColor+")",animation:"chestV2IconFloat 2s ease-in-out 1.5s infinite",display:"flex",justifyContent:"center"}}>
            {result.reward.type==="xp"?<span style={{fontSize:72}}>{"\uD83D\uDC8E"}</span>:
             result.reward.type==="avatar"?<AvatarMedal avatarId={result.reward.id} size={96}/>:
             result.reward.type==="skin"&&SKINS[result.reward.id]?<div style={{width:96,height:96,borderRadius:20,background:"linear-gradient(135deg,"+SKINS[result.reward.id].hex+","+SKINS[result.reward.id].dark+")",border:"2px solid "+rarityColor,boxShadow:"0 0 24px "+SKINS[result.reward.id].hex+"88"}}/>:
             <span style={{fontSize:72}}>{"\uD83C\uDFA8"}</span>}
          </div>
          <div className="out" style={{fontSize:22,fontWeight:900,color:"#ede4d4",marginBottom:4,letterSpacing:1}}>
            {result.reward.type==="xp"?"+"+result.xpAmount+" XP":
             result.reward.type==="avatar"?(AVATARS[result.reward.id]?AVATARS[result.reward.id].name:result.reward.id):
             result.reward.type==="skin"?(SKINS[result.reward.id]?SKINS[result.reward.id].name:result.reward.id):"???"}
          </div>
          <div style={{fontSize:11,color:"#8a7e6a",letterSpacing:1}}>
            {result.reward.type==="xp"?"XP Gem — bonus added!":
             result.reward.type==="avatar"?"New avatar unlocked":
             "New skin unlocked"}
          </div>
        </div>
      </>}

      {/* Reveal but no result (loading) */}
      {phase==="reveal"&&!result&&<div style={{position:"absolute",textAlign:"center"}}>
        <div style={{fontSize:48,animation:"pulse 1s infinite"}}>{"\u231B"}</div>
        <p style={{color:"#8a7e6a",fontSize:13,marginTop:12}}>Rolling...</p>
      </div>}
    </div>

    {/* Collect button (only in reveal phase) */}
    {phase==="reveal"&&result&&<button className="btn1" onClick={p.onClose} style={{marginTop:20,width:240,maxWidth:"100%",fontSize:15,zIndex:20,background:"linear-gradient(135deg,"+rarityColor+","+rarityColor+"99)"}}>Collect</button>}
  </div>);
}

// ═══════════════════════════════════════════════════════════════
// ═══════════════════════════════════════════════════════════════
// WEEKLY REPORT — Rapport pédagogique hebdomadaire (FR)
// Génère un rapport print-friendly pour le directeur pédagogique
// ═══════════════════════════════════════════════════════════════

function WeeklyReport(p){
  // p.classCode, p.students (current), p.onBack
  var [snaps,setSnaps]=useState(null);
  var [loading,setLoading]=useState(true);

  // Compute week boundaries: last completed week (Monday-Sunday)
  var now=new Date();
  var dow=now.getDay()||7; // 1=Mon..7=Sun
  var lastMonday=new Date(now);lastMonday.setDate(now.getDate()-dow+1-7);lastMonday.setHours(0,0,0,0);
  var lastSunday=new Date(lastMonday);lastSunday.setDate(lastMonday.getDate()+6);
  var prevMonday=new Date(lastMonday);prevMonday.setDate(lastMonday.getDate()-7);
  var lastMondayStr=lastMonday.toISOString().split("T")[0];
  var prevMondayStr=prevMonday.toISOString().split("T")[0];

  useEffect(function(){
    supabase.from("weekly_snapshots")
      .select("*")
      .eq("class_code",p.classCode)
      .in("week_start",[lastMondayStr,prevMondayStr])
      .then(function(res){setSnaps(res.data||[]);setLoading(false);});
  },[]);

  function fmtDate(d){var dd=String(d.getDate()).padStart(2,"0");var mm=String(d.getMonth()+1).padStart(2,"0");return dd+"/"+mm;}
  function fmtDelta(n,unit){if(n===null||n===undefined||isNaN(n))return"—";var sign=n>0?"+":"";return sign+Math.round(n)+(unit||"");}
  function fmtPct(n){if(n===null||n===undefined||isNaN(n))return"—";return(n>=0?"+":"")+Math.round(n)+"%";}

  if(loading)return(<div style={{padding:40,textAlign:"center"}}><p style={{color:"var(--t2)"}}>Chargement du rapport...</p></div>);

  // Filter Teacher out
  var thisWeek=(snaps||[]).filter(function(s){return s.week_start===lastMondayStr&&s.student_name!=="Teacher";});
  var prevWeek=(snaps||[]).filter(function(s){return s.week_start===prevMondayStr&&s.student_name!=="Teacher";});

  // Map previous week by name for delta computation
  var prevByName={};prevWeek.forEach(function(s){prevByName[s.student_name]=s;});
  var studentsByName={};(p.students||[]).forEach(function(s){if(s.name!=="Teacher")studentsByName[s.name]=s;});

  // ──── KPIs ────
  var activeThis=thisWeek.filter(function(s){return(s.xp_this_week||0)>0||(s.daily_completions||0)>0;}).length;
  var activePrev=prevWeek.filter(function(s){return(s.xp_this_week||0)>0||(s.daily_completions||0)>0;}).length;
  var classXP=thisWeek.reduce(function(a,s){return a+(s.xp_this_week||0);},0);
  var classXPPrev=prevWeek.reduce(function(a,s){return a+(s.xp_this_week||0);},0);

  // Sessions this week = delta of cumulative
  var sessionsThis=0,sessionsPrev=0,qThis=0,qPrev=0,correctThis=0,correctPrev=0;
  thisWeek.forEach(function(s){
    var p=prevByName[s.student_name];
    var ts=(s.stats_snapshot&&s.stats_snapshot.sessions)||0;var ps=(p&&p.stats_snapshot&&p.stats_snapshot.sessions)||0;
    sessionsThis+=Math.max(0,ts-ps);
    var tq=(s.stats_snapshot&&s.stats_snapshot.totalQ)||0;var pq=(p&&p.stats_snapshot&&p.stats_snapshot.totalQ)||0;
    qThis+=Math.max(0,tq-pq);
    var tc=(s.stats_snapshot&&s.stats_snapshot.correct)||0;var pc=(p&&p.stats_snapshot&&p.stats_snapshot.correct)||0;
    correctThis+=Math.max(0,tc-pc);
  });
  prevWeek.forEach(function(s){
    // For prev week session/accuracy, we'd need week-2 snapshot — skip for simplicity
    sessionsPrev+=0;qPrev+=0;correctPrev+=0;
  });
  var accThis=qThis>0?Math.round(correctThis/qThis*100):0;

  // Top 3 performers (by weekly XP)
  var topPerf=thisWeek.slice().sort(function(a,b){return(b.xp_this_week||0)-(a.xp_this_week||0);}).slice(0,3);

  // Engagement: active vs moderate vs absent
  var allKnown=Object.keys(studentsByName);
  var engagement={active:0,moderate:0,absent:0};
  allKnown.forEach(function(n){
    var s=thisWeek.find(function(x){return x.student_name===n;});
    var dc=(s&&s.daily_completions)||0;
    if(dc>=3)engagement.active++;
    else if(dc>=1)engagement.moderate++;
    else engagement.absent++;
  });

  // Ghost students (persistent low engagement)
  var ghosts=(p.students||[]).filter(isGhost);

  // Module engagement this week (based on module_scores delta)
  var MODULE_LABELS={drill:"Part 5 Drill",csess:"Flashcards",tavern:"Word Tavern",lisP1:"Listening P1",lisP2:"Listening P2",lisP3:"Listening P3",lisP4:"Listening P4",p6:"Part 6",p7:"Part 7",ablitz:"Audio Blitz",clue:"Clue Hunter",sbuild:"Sentence Builder",wfall:"Word Fall",matchEasy:"Speed Match",pvdojo:"Phrasal Verbs",stratquiz:"Strategy Quiz",timesim:"Time Sim",mock1:"Mock Test 1",mock2:"Mock Test 2",mock3:"Mock Test 3"};
  var modEngagement={}; // modId → count of students who practiced
  thisWeek.forEach(function(s){
    var p=prevByName[s.student_name];
    var cms=s.module_scores_snapshot||{};var pms=(p&&p.module_scores_snapshot)||{};
    Object.keys(cms).forEach(function(k){
      var ct=(cms[k]&&cms[k].total)||0;var pt=(pms[k]&&pms[k].total)||0;
      if(ct>pt){modEngagement[k]=(modEngagement[k]||0)+1;}
    });
  });
  var totalStudentsWithSnap=Math.max(1,thisWeek.length);
  var modEngagementSorted=Object.keys(modEngagement).map(function(k){return{id:k,label:MODULE_LABELS[k]||k,count:modEngagement[k],pct:Math.round(modEngagement[k]/totalStudentsWithSnap*100)};}).sort(function(a,b){return b.pct-a.pct;});

  // Per-module accuracy this week with delta vs prev
  var modAccThis={},modAccPrev={};
  thisWeek.forEach(function(s){
    var p=prevByName[s.student_name];
    var cms=s.module_scores_snapshot||{};var pms=(p&&p.module_scores_snapshot)||{};
    Object.keys(cms).forEach(function(k){
      var ct=(cms[k]&&cms[k].total)||0;var cc=(cms[k]&&cms[k].correct)||0;
      var pt=(pms[k]&&pms[k].total)||0;var pc=(pms[k]&&pms[k].correct)||0;
      var dt=ct-pt;var dc=cc-pc;
      if(dt>0){
        if(!modAccThis[k])modAccThis[k]={c:0,t:0};
        modAccThis[k].c+=dc;modAccThis[k].t+=dt;
      }
    });
  });
  // For prev week accuracy, need week-2 snapshots — omit for MVP
  var modAccSorted=Object.keys(modAccThis).filter(function(k){return modAccThis[k].t>=5;}).map(function(k){return{id:k,label:MODULE_LABELS[k]||k,acc:Math.round(modAccThis[k].c/modAccThis[k].t*100),vol:modAccThis[k].t};}).sort(function(a,b){return a.acc-b.acc;});

  // Mock Tests this week (new completions)
  var mocksThisWeek=[];
  thisWeek.forEach(function(s){
    var cmr=s.mock_results_snapshot||{};var pmr=(prevByName[s.student_name]&&prevByName[s.student_name].mock_results_snapshot)||{};
    ["mock1","mock2","mock3","boss"].forEach(function(k){
      if(cmr[k]&&!pmr[k])mocksThisWeek.push({name:s.student_name,mock:k,score:cmr[k].toeicEstimate||cmr[k].score||0});
    });
  });

  // TOEIC distribution
  var buckets={s0:0,s400:0,s500:0,s600:0,s700:0,s800:0};
  (p.students||[]).forEach(function(s){
    if(s.name==="Teacher")return;
    var t=estimateTOEICScore(s.module_scores||{}).total;
    if(t<400)buckets.s0++;
    else if(t<500)buckets.s400++;
    else if(t<600)buckets.s500++;
    else if(t<700)buckets.s600++;
    else if(t<800)buckets.s700++;
    else buckets.s800++;
  });

  // Top 5 XP progressers (already sorted by topPerf above, extend to 5)
  var top5XP=thisWeek.slice().sort(function(a,b){return(b.xp_this_week||0)-(a.xp_this_week||0);}).slice(0,5);

  // Alertes
  var dropouts=[];
  allKnown.forEach(function(n){
    var t=thisWeek.find(function(x){return x.student_name===n;});
    var pv=prevByName[n];
    var tActive=(t&&((t.xp_this_week||0)>0||(t.daily_completions||0)>0));
    var pActive=(pv&&((pv.xp_this_week||0)>0||(pv.daily_completions||0)>0));
    if(!tActive&&pActive)dropouts.push(n);
  });
  var nearMilestone=(p.students||[]).filter(function(s){
    if(s.name==="Teacher")return false;
    var t=estimateTOEICScore(s.module_scores||{}).total;
    return(t>=620&&t<650)||(t>=670&&t<700);
  }).map(function(s){var t=estimateTOEICScore(s.module_scores||{}).total;return{name:s.name,toeic:t,near:t<650?650:700};});

  // Recommandations pédagogiques auto
  var recos=[];
  // Modules under-practiced (< 20% engagement)
  var underPracticed=Object.keys(MODULE_LABELS).filter(function(k){
    var eng=modEngagement[k]||0;
    return eng/totalStudentsWithSnap<0.2&&["lisP1","lisP2","lisP3","lisP4","p6","p7"].indexOf(k)!==-1;
  });
  if(underPracticed.length>0){
    recos.push("Modules peu travaillés cette semaine : "+underPracticed.map(function(k){return MODULE_LABELS[k];}).join(", ")+". Envisager une session dédiée en cours.");
  }
  // Very low engagement
  if(engagement.absent>engagement.active+engagement.moderate){
    recos.push("Plus de la moitié de la classe est absente cette semaine ("+engagement.absent+" étudiants sans activité). Signal fort de désengagement à adresser.");
  }
  // Mock-ready students
  var mockReady=(p.students||[]).filter(function(s){return s.name!=="Teacher"&&(!s.mock_results||(!s.mock_results.mock1&&!s.mock_results.mock2&&!s.mock_results.mock3))&&(s.stats&&s.stats.totalQ>=50);}).length;
  if(mockReady>=3){
    recos.push(mockReady+" étudiants ont suffisamment pratiqué (50+ questions) mais n'ont pas encore fait de Mock Test. Envisager une session Mock collective.");
  }
  // Dropouts
  if(dropouts.length>=3){
    recos.push(dropouts.length+" étudiants actifs la semaine précédente n'ont rien fait cette semaine. Relance humaine recommandée.");
  }
  if(recos.length===0)recos.push("Dynamique de classe saine cette semaine. Poursuivre sur cette lancée.");

  // ──── RENDER ────
  var leagueName=p.classCode||"visitor";
  return(
  <div style={{minHeight:"100vh",background:"#fff",color:"#222",padding:"24px 20px"}} className="weekly-report">
    <style>{"@media print{.no-print{display:none!important}.weekly-report{padding:0!important}body{background:#fff!important}.wr-card{page-break-inside:avoid}.wr-section{page-break-inside:avoid}}.weekly-report h1,.weekly-report h2,.weekly-report h3{font-family:'Cinzel','Outfit',serif;color:#1a1a1a}.weekly-report p,.weekly-report div,.weekly-report span{font-family:'DM Sans',Arial,sans-serif}"}</style>

    {/* Top nav (hidden on print) */}
    <div className="no-print" style={{display:"flex",gap:10,marginBottom:24,justifyContent:"space-between",maxWidth:820,margin:"0 auto 24px"}}>
      <button onClick={p.onBack} style={{padding:"8px 16px",background:"#f0f0f0",border:"1px solid #ddd",borderRadius:8,cursor:"pointer",fontSize:13}}>{"← Retour"}</button>
      <button onClick={function(){window.print();}} style={{padding:"8px 16px",background:"#1a1a1a",color:"#fff",border:"none",borderRadius:8,cursor:"pointer",fontSize:13,fontWeight:600}}>{"🖨️ Imprimer / Enregistrer en PDF"}</button>
    </div>

    <div style={{maxWidth:820,margin:"0 auto"}}>
      {/* ──── HEADER ──── */}
      <div style={{borderBottom:"3px solid #1a1a1a",paddingBottom:16,marginBottom:24}}>
        <p style={{fontSize:11,textTransform:"uppercase",letterSpacing:2,color:"#666",margin:0}}>TOEIC Arena · Rapport hebdomadaire</p>
        <h1 style={{fontSize:28,fontWeight:900,margin:"6px 0 4px"}}>Bilan pédagogique — {leagueName}</h1>
        <p style={{fontSize:14,color:"#555",margin:0}}>Semaine du {fmtDate(lastMonday)} au {fmtDate(lastSunday)} · {p.students.length} étudiants inscrits</p>
      </div>

      {/* ──── SECTION 1 : EXECUTIVE SUMMARY ──── */}
      <div className="wr-section" style={{marginBottom:28}}>
        <h2 style={{fontSize:18,borderLeft:"4px solid #d4943a",paddingLeft:10,margin:"0 0 14px"}}>1. Synthèse de la semaine</h2>

        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr 1fr",gap:10,marginBottom:16}}>
          <div className="wr-card" style={{border:"1px solid #ddd",borderRadius:8,padding:"10px 12px"}}>
            <div style={{fontSize:10,color:"#888",textTransform:"uppercase",letterSpacing:1}}>Actifs</div>
            <div style={{fontSize:24,fontWeight:800}}>{activeThis}<span style={{fontSize:12,color:"#888",fontWeight:400}}>/{p.students.length}</span></div>
            <div style={{fontSize:11,color:activeThis>=activePrev?"#22803d":"#b82020"}}>{activePrev>0?fmtPct((activeThis-activePrev)/activePrev*100)+" vs S-1":"—"}</div>
          </div>
          <div className="wr-card" style={{border:"1px solid #ddd",borderRadius:8,padding:"10px 12px"}}>
            <div style={{fontSize:10,color:"#888",textTransform:"uppercase",letterSpacing:1}}>XP classe</div>
            <div style={{fontSize:24,fontWeight:800}}>{classXP.toLocaleString()}</div>
            <div style={{fontSize:11,color:classXP>=classXPPrev?"#22803d":"#b82020"}}>{classXPPrev>0?fmtPct((classXP-classXPPrev)/classXPPrev*100)+" vs S-1":"—"}</div>
          </div>
          <div className="wr-card" style={{border:"1px solid #ddd",borderRadius:8,padding:"10px 12px"}}>
            <div style={{fontSize:10,color:"#888",textTransform:"uppercase",letterSpacing:1}}>Sessions</div>
            <div style={{fontSize:24,fontWeight:800}}>{sessionsThis}</div>
            <div style={{fontSize:11,color:"#888"}}>{qThis} questions répondues</div>
          </div>
          <div className="wr-card" style={{border:"1px solid #ddd",borderRadius:8,padding:"10px 12px"}}>
            <div style={{fontSize:10,color:"#888",textTransform:"uppercase",letterSpacing:1}}>Précision</div>
            <div style={{fontSize:24,fontWeight:800,color:accThis>=60?"#22803d":accThis>=40?"#c87a35":"#b82020"}}>{accThis}%</div>
            <div style={{fontSize:11,color:"#888"}}>sur {qThis} questions</div>
          </div>
        </div>

        <h3 style={{fontSize:13,fontWeight:700,margin:"12px 0 8px"}}>🏆 Top 3 performeurs de la semaine</h3>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:10}}>
          {topPerf.map(function(s,i){var medal=["🥇","🥈","🥉"][i];return(
            <div key={i} className="wr-card" style={{border:"1px solid #ddd",borderRadius:8,padding:"10px 12px",background:i===0?"#fff9e6":"#fafafa"}}>
              <div style={{fontSize:20}}>{medal}</div>
              <div style={{fontSize:13,fontWeight:700}}>{s.student_name}</div>
              <div style={{fontSize:11,color:"#666"}}>{(s.xp_this_week||0).toLocaleString()} XP · {s.daily_completions||0} jours actifs</div>
            </div>);
          })}
          {topPerf.length===0&&<div style={{gridColumn:"1/-1",fontSize:12,color:"#888",fontStyle:"italic"}}>Aucune activité enregistrée cette semaine.</div>}
        </div>
      </div>

      {/* ──── SECTION 2 : ENGAGEMENT ──── */}
      <div className="wr-section" style={{marginBottom:28}}>
        <h2 style={{fontSize:18,borderLeft:"4px solid #d4943a",paddingLeft:10,margin:"0 0 14px"}}>2. Engagement des étudiants</h2>

        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:10,marginBottom:16}}>
          <div className="wr-card" style={{border:"1px solid #c6e9d0",borderRadius:8,padding:"10px 12px",background:"#f3fbf6"}}>
            <div style={{fontSize:10,color:"#22803d",textTransform:"uppercase",letterSpacing:1,fontWeight:700}}>Actifs (3j+)</div>
            <div style={{fontSize:22,fontWeight:800,color:"#22803d"}}>{engagement.active}</div>
          </div>
          <div className="wr-card" style={{border:"1px solid #f0d8b0",borderRadius:8,padding:"10px 12px",background:"#fff8ed"}}>
            <div style={{fontSize:10,color:"#c87a35",textTransform:"uppercase",letterSpacing:1,fontWeight:700}}>Modérés (1-2j)</div>
            <div style={{fontSize:22,fontWeight:800,color:"#c87a35"}}>{engagement.moderate}</div>
          </div>
          <div className="wr-card" style={{border:"1px solid #f0c2c2",borderRadius:8,padding:"10px 12px",background:"#fdeeee"}}>
            <div style={{fontSize:10,color:"#b82020",textTransform:"uppercase",letterSpacing:1,fontWeight:700}}>Absents (0j)</div>
            <div style={{fontSize:22,fontWeight:800,color:"#b82020"}}>{engagement.absent}</div>
          </div>
        </div>

        <h3 style={{fontSize:13,fontWeight:700,margin:"12px 0 8px"}}>📊 Engagement par module (% étudiants l'ayant pratiqué cette semaine)</h3>
        <div className="wr-card" style={{border:"1px solid #ddd",borderRadius:8,padding:"10px 14px"}}>
          {modEngagementSorted.slice(0,10).map(function(m,i){return(
            <div key={i} style={{display:"flex",alignItems:"center",gap:10,marginBottom:6}}>
              <div style={{width:140,fontSize:11,color:"#333"}}>{m.label}</div>
              <div style={{flex:1,height:12,background:"#f0f0f0",borderRadius:6,overflow:"hidden"}}>
                <div style={{width:m.pct+"%",height:"100%",background:m.pct>=50?"#22803d":m.pct>=25?"#c87a35":"#b82020"}}/>
              </div>
              <div style={{width:50,fontSize:11,fontWeight:700,textAlign:"right"}}>{m.pct}% ({m.count})</div>
            </div>);
          })}
          {modEngagementSorted.length===0&&<p style={{fontSize:11,color:"#888",margin:0,fontStyle:"italic"}}>Aucune activité de module enregistrée.</p>}
        </div>

        {ghosts.length>0&&<div className="wr-card" style={{marginTop:12,border:"1px solid #f0c2c2",borderRadius:8,padding:"10px 14px",background:"#fdeeee"}}>
          <div style={{fontSize:12,fontWeight:700,color:"#b82020",marginBottom:4}}>👻 Étudiants fantômes persistants ({ghosts.length})</div>
          <div style={{fontSize:11,color:"#555",lineHeight:1.6}}>{ghosts.map(function(g){return g.name;}).join(" · ")}</div>
          <div style={{fontSize:10,color:"#888",marginTop:4,fontStyle:"italic"}}>Critère : ≤15 questions ET ≤10 cartes depuis l'inscription.</div>
        </div>}
      </div>

      {/* ──── SECTION 3 : PROGRESSION ──── */}
      <div className="wr-section" style={{marginBottom:28}}>
        <h2 style={{fontSize:18,borderLeft:"4px solid #d4943a",paddingLeft:10,margin:"0 0 14px"}}>3. Progression pédagogique</h2>

        <h3 style={{fontSize:13,fontWeight:700,margin:"8px 0 8px"}}>🎯 Précision par module cette semaine (10 modules les plus fragiles)</h3>
        <div className="wr-card" style={{border:"1px solid #ddd",borderRadius:8,padding:"10px 14px",marginBottom:14}}>
          {modAccSorted.slice(0,10).map(function(m,i){return(
            <div key={i} style={{display:"flex",alignItems:"center",gap:10,marginBottom:6}}>
              <div style={{width:140,fontSize:11,color:"#333"}}>{m.label}</div>
              <div style={{flex:1,height:12,background:"#f0f0f0",borderRadius:6,overflow:"hidden"}}>
                <div style={{width:m.acc+"%",height:"100%",background:m.acc>=70?"#22803d":m.acc>=50?"#c87a35":"#b82020"}}/>
              </div>
              <div style={{width:80,fontSize:11,fontWeight:700,textAlign:"right",color:m.acc>=70?"#22803d":m.acc>=50?"#c87a35":"#b82020"}}>{m.acc}% <span style={{color:"#888",fontWeight:400}}>({m.vol}Q)</span></div>
            </div>);
          })}
          {modAccSorted.length===0&&<p style={{fontSize:11,color:"#888",margin:0,fontStyle:"italic"}}>Pas assez de données de module cette semaine.</p>}
        </div>

        <h3 style={{fontSize:13,fontWeight:700,margin:"12px 0 8px"}}>📜 Mock Tests complétés cette semaine</h3>
        <div className="wr-card" style={{border:"1px solid #ddd",borderRadius:8,padding:"10px 14px",marginBottom:14}}>
          {mocksThisWeek.length>0?mocksThisWeek.map(function(m,i){var label=m.mock==="boss"?"Final Arena":"Mock "+m.mock.replace("mock","");return(
            <div key={i} style={{display:"flex",justifyContent:"space-between",fontSize:12,padding:"3px 0"}}>
              <span><strong>{m.name}</strong> — {label}</span>
              <span style={{fontWeight:700,color:m.score>=700?"#22803d":m.score>=500?"#c87a35":"#b82020"}}>{m.score}</span>
            </div>);
          }):<p style={{fontSize:11,color:"#888",margin:0,fontStyle:"italic"}}>Aucun Mock Test complété cette semaine.</p>}
        </div>

        <h3 style={{fontSize:13,fontWeight:700,margin:"12px 0 8px"}}>📈 Distribution TOEIC estimé de la classe</h3>
        <div className="wr-card" style={{border:"1px solid #ddd",borderRadius:8,padding:"10px 14px"}}>
          {[{k:"s0",l:"< 400",c:"#b82020"},{k:"s400",l:"400–499",c:"#c87a35"},{k:"s500",l:"500–599",c:"#d4943a"},{k:"s600",l:"600–699",c:"#b0a030"},{k:"s700",l:"700–799",c:"#22803d"},{k:"s800",l:"800+",c:"#0f6020"}].map(function(b,i){
            var tot=Object.keys(buckets).reduce(function(a,k){return a+buckets[k];},0);var pct=tot>0?Math.round(buckets[b.k]/tot*100):0;
            return(<div key={i} style={{display:"flex",alignItems:"center",gap:10,marginBottom:4}}>
              <div style={{width:90,fontSize:11,color:"#333"}}>{b.l}</div>
              <div style={{flex:1,height:10,background:"#f0f0f0",borderRadius:6,overflow:"hidden"}}>
                <div style={{width:pct+"%",height:"100%",background:b.c}}/>
              </div>
              <div style={{width:60,fontSize:11,fontWeight:700,textAlign:"right"}}>{buckets[b.k]} ({pct}%)</div>
            </div>);
          })}
        </div>
      </div>

      {/* ──── SECTION 4 : ALERTES & RECOMMANDATIONS ──── */}
      <div className="wr-section" style={{marginBottom:28}}>
        <h2 style={{fontSize:18,borderLeft:"4px solid #d4943a",paddingLeft:10,margin:"0 0 14px"}}>4. Alertes &amp; recommandations</h2>

        {dropouts.length>0&&<div className="wr-card" style={{border:"1px solid #f0c2c2",borderRadius:8,padding:"10px 14px",background:"#fdeeee",marginBottom:10}}>
          <div style={{fontSize:12,fontWeight:700,color:"#b82020",marginBottom:4}}>⚠️ Décrochages récents ({dropouts.length})</div>
          <div style={{fontSize:11,color:"#555",lineHeight:1.6}}>{dropouts.join(" · ")}</div>
          <div style={{fontSize:10,color:"#888",marginTop:4,fontStyle:"italic"}}>Étudiants actifs la semaine précédente, inactifs cette semaine.</div>
        </div>}

        {nearMilestone.length>0&&<div className="wr-card" style={{border:"1px solid #c8deeb",borderRadius:8,padding:"10px 14px",background:"#f2f8fc",marginBottom:10}}>
          <div style={{fontSize:12,fontWeight:700,color:"#1e6dac",marginBottom:4}}>🎯 Étudiants proches d'un palier</div>
          {nearMilestone.map(function(s,i){return(
            <div key={i} style={{fontSize:11,color:"#333"}}><strong>{s.name}</strong> : TOEIC {s.toeic} → {s.toeic<650?"Endless Arena (650)":"certification TOEIC (700)"}</div>);
          })}
        </div>}

        <div className="wr-card" style={{border:"1px solid #d4c090",borderRadius:8,padding:"10px 14px",background:"#fdf9ed"}}>
          <div style={{fontSize:12,fontWeight:700,color:"#8b6a15",marginBottom:6}}>💡 Recommandations pédagogiques</div>
          <ul style={{margin:"0 0 0 18px",padding:0,fontSize:11,lineHeight:1.6,color:"#333"}}>
            {recos.map(function(r,i){return(<li key={i} style={{marginBottom:4}}>{r}</li>);})}
          </ul>
        </div>
      </div>

      {/* ──── FOOTER ──── */}
      <div style={{borderTop:"1px solid #ddd",paddingTop:12,marginTop:24,textAlign:"center"}}>
        <p style={{fontSize:10,color:"#888",margin:0}}>TOEIC Arena · Rapport généré le {fmtDate(now)} · Jérémy Leixa · IDRAC Business School</p>
      </div>
    </div>
  </div>);
}

// TeacherDash v2.0 — Stats avancées + Export CSV
// REPLACES the existing TeacherDash function (lines 3124-3250)
// ═══════════════════════════════════════════════════════════════

function TeacherDash(p){
  var[tdBioAvail,setTdBioAvail]=useState(false);var[tdBioReg,setTdBioReg]=useState(!!getBioCredId());
  useEffect(function(){biometricAvailable().then(function(v){setTdBioAvail(v);});},[]);
  function fmtTime(sec){
    if(!sec||sec<60)return"<1m";
    var h=Math.floor(sec/3600);var m=Math.floor((sec%3600)/60);
    return h>0?h+"h"+String(m).padStart(2,"0"):m+"m";
  }
  var[students,setStudents]=useState([]);var[loading,setLoad]=useState(true);
  var[detail,setDetail]=useState(null);var[classCode,setClassCode]=useState(function(){try{return localStorage.getItem('toeic-dash-group')||"idrac2026";}catch(e){return"idrac2026";}});
  var[dashTab,setDashTab]=useState("overview"); // "overview" | "analytics"
  var[sortBy,setSortBy]=useState("toeic"); // "toeic"|"xp"|"accuracy"|"time"|"last_active"
  var[showGhostsOnly,setShowGhostsOnly]=useState(false);
  var[showReport,setShowReport]=useState(false);
  var[chartMod,setChartMod]=useState("all"); // for student detail time chart
  var[groups,setGroups]=useState([]);
  var[dashPhase,setDashPhase]=useState("picker"); // "picker" | "dashboard" | "create-group"
  var[cgForm,setCgForm]=useState({name:"",code:"",teacherCode:"",type:"school",startDate:"",endDate:""});
  var[cgCodeErr,setCgCodeErr]=useState("");var[cgSaving,setCgSaving]=useState(false);
  var[dashEvents,setDashEvents]=useState([]);var[evForm,setEvForm]=useState({type:"spotlight",title:"",desc:"",module:"drill",multiplier:2,hours:24,classTarget:"all"});var[evSaving,setEvSaving]=useState(false);var[evPushResult,setEvPushResult]=useState(null);

  function loadEvents(){
    supabase.from('events').select('*').order('start_at',{ascending:false}).limit(20)
      .then(function(res){if(res.data)setDashEvents(res.data);});
  }
  async function sendEventPush(title,body,targetClass){
    try{
      var res=await fetch('/api/push-send',{
        method:'POST',
        headers:{'Content-Type':'application/json','x-push-secret':PUSH_SECRET},
        body:JSON.stringify({class_code:targetClass||'all',title:title,body:body,tag:'toeic-event'})
      });
      var data=await res.json();
      if(data.total===0){setEvPushResult({error:"No push subscribers found",total:0});setTimeout(function(){setEvPushResult(null);},5000);return;}
      var staleCount=(data.errors||[]).filter(function(e){return e.expired;}).length;
      setEvPushResult({sent:data.sent||0,total:data.total||0,staleCount:staleCount});
      setTimeout(function(){setEvPushResult(null);},5000);
    }catch(e){console.log('Push failed:',e);setEvPushResult({error:"Push send failed"});setTimeout(function(){setEvPushResult(null);},5000);}
  }
  var[dashEvents,setDashEvents]=useState([]);var[evForm,setEvForm]=useState({type:"spotlight",title:"",desc:"",module:"drill",multiplier:2,hours:24,classTarget:"all"});var[evSaving,setEvSaving]=useState(false);var[evPushResult,setEvPushResult]=useState(null);

  function loadEvents(){
    supabase.from('events').select('*').order('start_at',{ascending:false}).limit(20)
      .then(function(res){if(res.data)setDashEvents(res.data);});
  }

  function loadGroups(){
    supabase.from('groups').select('*').neq('code','teacher-internal').order('type',{ascending:true}).order('name',{ascending:true})
      .then(function(res){if(res.data)setGroups(res.data);});
  }
  useEffect(function(){loadGroups();loadEvents();},[]);

  function loadStudents(){
    supabase.from('students').select('*').eq('class_code',classCode).order('xp',{ascending:false}).limit(200)
      .then(function(res){setStudents((res.data||[]).filter(function(r){return r.name!==GHOST_NAME;}));setLoad(false);})
      .catch(function(){setLoad(false);});
  }
  useEffect(function(){loadStudents();},[classCode])

  // ── Chart colors matching app theme ──
  var CHART_COLORS=["var(--cx-hex)","#8b5e83","#c87a35","#f0c850","#4abe60","#e05252","#c4587a","#5a7a9a","#2a9a8a","var(--cx-hex)","#7a5a80","#3a9080"];

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

  // ── TOEIC Score Estimator (délègue à la fonction globale) ──
  function estimateTOEIC(s){
    return estimateTOEICScore(s.module_scores||s.moduleScores||{});
  }

  // ── CSV Export exhaustif v2 ──
  function exportCSV(){
    var DQ=String.fromCharCode(34);
    function qa(v){return DQ+(v===null||v===undefined?"":String(v).replace(/"/g,DQ+DQ))+DQ;}
    function na(v){return(v===null||v===undefined||v===""||v!==v)?"":v;}
    function pcta(correct,total){return total>0?Math.round(correct/total*100):"";}
    function fdatea(d){return d||"";}
    function ftimea(sec){return sec?Math.round(sec/60):"";}
    var headers=[
      "Nom","Classe","XP Total","XP Semaine","Niveau","Ligue","Streak","Derniere activite",
      "Sessions totales","Temps total (min)",
      "Questions totales","Bonnes reponses","Precision globale %","Precision hors Flashcards %",
      "Cartes revisees","Exercices drill","Defis parfaits","Daily completions semaine",
      "TOEIC estime total","TOEIC Listening","TOEIC Reading",
      "Mock1 TOEIC estime","Mock1 Score %","Mock1 Questions","Mock1 Date","Mock1 Temps (min)",
      "Mock2 TOEIC estime","Mock2 Score %","Mock2 Questions","Mock2 Date","Mock2 Temps (min)",
      "SpeedEasy score","SpeedEasy temps (s)","SpeedHard score","SpeedHard temps (s)",
      "WordFall score","WordFall combo max",
      "Duel parties","Duel victoires","Duel XP vole",
      "Achievements debloques","Achievements total",
    ];
    MISSION_MODULES.forEach(function(m){
      headers.push(m.name+" Precision%");
      headers.push(m.name+" Sessions");
      headers.push(m.name+" Questions");
    });
    var rows=students.map(function(s){
      var stats=s.stats||{totalQ:0,correct:0,sessions:0,cardsRev:0,drills:0,perfects:0};
      var ms=s.module_scores||s.moduleScores||{};
      var gs=s.game_scores||s.gameScores||{};
      var mr=s.mock_results||s.mockResults||{};
      var lvl=getLevel(s.xp||0);
      var lg=LEAGUES.slice().reverse().find(function(l){return(s.xp||0)>=l.min;})||LEAGUES[0];
      var toeic=estimateTOEIC(s);
      var noFlashQ=0,noFlashC=0;
      Object.keys(ms).forEach(function(k){
        if(k!=="csess"&&ms[k]&&ms[k].total>0){noFlashQ+=ms[k].total;noFlashC+=ms[k].correct;}
      });
      function mockC(mk){var r=mr[mk];if(!r)return["","","","",""];return[na(r.toeicEstimate),r.total>0?Math.round(r.score/r.total*100):"",na(r.total),fdatea(r.date),ftimea(r.timeUsed)];}
      var ach=s.unlocked_ach||s.unlockedAch||[];
      var row=[
        qa(s.name),qa(s.class_code||s.classCode||""),
        na(s.xp||0),na(s.weekly_xp||s.weeklyXp||0),
        na(lvl.level),qa(lg.name),na(s.streak||0),fdatea(s.last_active||s.lastActive),
        na(stats.sessions),na(Math.round((s.total_time||0)/60)),
        na(stats.totalQ||0),na(stats.correct||0),
        pcta(stats.correct||0,stats.totalQ||0),pcta(noFlashC,noFlashQ),
        na(stats.cardsRev||0),na(stats.drills||0),na(stats.perfects||0),
        na(s.weekly_daily_count||s.weeklyDailyCount||0),
        na(toeic.total),na(toeic.listening),na(toeic.reading),
      ].concat(mockC("mock1")).concat(mockC("mock2")).concat([
        na(gs.matchEasy?gs.matchEasy.score:""),na(gs.matchEasy?gs.matchEasy.time:""),
        na(gs.matchHard?gs.matchHard.score:""),na(gs.matchHard?gs.matchHard.time:""),
        na(gs.wordFall?gs.wordFall.score:""),na(gs.wordFall?(gs.wordFall.maxCombo||0):""),
        na(gs.duel?gs.duel.played:0),na(gs.duel?gs.duel.wins:0),na(gs.duel?(gs.duel.wagerWon||0):0),
        na(ach.length),na(ACHIEVEMENTS.length),
      ]);
      MISSION_MODULES.forEach(function(m){
        var d=ms[m.id];
        row.push(d&&d.total>0?Math.round(d.correct/d.total*100):"");
        row.push(d?na(d.sessions):"");
        row.push(d?na(d.total):"");
      });
      return row.join(",");
    });
    var csv=headers.join(",")+"\n"+rows.join("\n");
    var blob=new Blob(["﻿"+csv],{type:"text/csv;charset=utf-8;"});
    var url=URL.createObjectURL(blob);
    var a=document.createElement("a");
    a.href=url;a.download="toeic_arena_export_"+classCode+"_"+today()+".csv";
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
  if(showReport)return(<WeeklyReport classCode={classCode} students={students} onBack={function(){setShowReport(false);}}/>);

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
      return{name:m.name.length>12?m.name.substring(0,11)+"…":m.name,fullName:m.name,accuracy:modAcc,sessions:ms?ms.sessions:0,questions:ms?ms.total:0,color:CHART_COLORS[i%CHART_COLORS.length],id:m.id,hasData:!!(ms&&ms.total>0)};
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
        <div style={{width:56,height:56,borderRadius:"50%",background:"linear-gradient(135deg,var(--cx-hex),#8b5e83)",display:"flex",alignItems:"center",justifyContent:"center",margin:"0 auto 10px",fontSize:24,fontWeight:900}} className="out">{s.name.charAt(0).toUpperCase()}</div>
        <h2 className="out" style={{fontWeight:800,fontSize:20}}>{s.name}</h2>
        <div style={{display:"flex",justifyContent:"center",gap:12,marginTop:6}}>
          <span style={{fontSize:12,color:"var(--t2)"}}>Level {getLevel(s.xp||0).level}</span>
          <span style={{fontSize:12,color:"var(--gold)"}}>{(LEAGUES.slice().reverse().find(function(l){return(s.xp||0)>=l.min;})||{name:"Bronze"}).name}</span>
          <span style={{fontSize:12,color:"var(--orange)"}}>{s.streak||0} streak</span>
        </div>
      </div>

      {/* KPI cards */}
      {(function(){
        var toeic=estimateTOEIC(s);
        var toeicCol=toeic.total>=750?"var(--green)":toeic.total>=500?"var(--orange)":"var(--red)";
        return(<div style={{marginBottom:20}}>
          {/* TOEIC Score — full width banner */}
          <div className="crd" style={{padding:"12px 16px",marginBottom:8,background:"linear-gradient(135deg,rgba(var(--cx),.06),rgba(27,112,207,.06))",borderColor:"rgba(var(--cx),.15)",display:"flex",alignItems:"center",justifyContent:"space-between"}}>
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
      })()}

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
            <Line type="monotone" dataKey="accuracy" stroke="var(--cx-hex)" strokeWidth={2} dot={{fill:"var(--cx-hex)",r:4}} activeDot={{r:6,fill:"#8b5e83"}}/>
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
      {tdBioAvail&&!tdBioReg&&<button onClick={async function(ev){
        var btn=ev.currentTarget;btn.textContent="Registering...";
        try{await bioRegister();setTdBioReg(true);}catch(e){alert("Biometric setup failed: "+(e.message||e));btn.textContent="Retry";}
      }}
        style={{width:"100%",padding:"12px 16px",marginBottom:16,background:"rgba(var(--cx),.08)",border:"1px solid rgba(var(--cx),.25)",borderRadius:12,cursor:"pointer",display:"flex",alignItems:"center",gap:10,fontFamily:"'DM Sans',sans-serif"}}>
        <span style={{fontSize:22}}>{"🔒"}</span>
        <div style={{textAlign:"left",flex:1}}><div className="out" style={{fontWeight:700,fontSize:13,color:"var(--cyan)"}}>Enable biometric unlock</div>
        <div style={{fontSize:11,color:"var(--t3)"}}>Use fingerprint or Face ID for quick access</div></div>
      </button>}
      {tdBioAvail&&tdBioReg&&<div style={{width:"100%",padding:"10px 16px",marginBottom:16,background:"rgba(0,230,118,.06)",border:"1px solid rgba(0,230,118,.2)",borderRadius:12,display:"flex",alignItems:"center",gap:10}}>
        <span style={{fontSize:16}}>{"✓"}</span>
        <span style={{fontSize:12,color:"var(--green)"}}>Biometric unlock enabled</span>
        <button onClick={function(){try{localStorage.removeItem(BIOMETRIC_KEY);setTdBioReg(false);}catch(e){}}} style={{marginLeft:"auto",background:"none",border:"none",color:"var(--t3)",fontSize:11,cursor:"pointer",textDecoration:"underline"}}>Disable</button>
      </div>}
      {groups.length===0&&<div style={{textAlign:"center",padding:20}}><p style={{color:"var(--t3)",fontSize:13}}>Loading groups...</p></div>}
      <div style={{display:"flex",flexDirection:"column",gap:10}}>
        {groups.map(function(g){
          var typeIcon=g.type==="school"?"\uD83C\uDFEB":g.type==="pro"?"\uD83D\uDCBC":"\uD83C\uDF0D";
          var typeLabel=g.type==="school"?"School":g.type==="pro"?"Professional":"Visitor";
          var isExpired=g.end_date&&new Date(g.end_date+"T23:59:59")<new Date();
          return(<button key={g.code} onClick={function(){
            setClassCode(g.code);
            try{localStorage.setItem('toeic-dash-group',g.code);}catch(e){}
            setLoad(true);setDetail(null);setDashPhase("dashboard");
            supabase.from('students').select('*').eq('class_code',g.code).order('xp',{ascending:false}).limit(200)
              .then(function(res){setStudents((res.data||[]).filter(function(r){return r.name!==GHOST_NAME;}));setLoad(false);})
              .catch(function(){setLoad(false);});
          }} className="crd" style={{display:"flex",alignItems:"center",gap:16,padding:"18px 20px",cursor:"pointer",
            border:"1px solid "+(isExpired?"rgba(255,71,87,.25)":"var(--bdr)"),background:"var(--bg2)",borderRadius:16,textAlign:"left",
            transition:"all .2s",fontFamily:"'DM Sans',sans-serif"}}>
            <div style={{width:48,height:48,borderRadius:14,
              background:g.type==="school"?"rgba(var(--cx),.1)":g.type==="pro"?"rgba(255,140,66,.1)":"rgba(27,112,207,.1)",
              display:"flex",alignItems:"center",justifyContent:"center",fontSize:24,flexShrink:0}}>{typeIcon}</div>
            <div style={{flex:1,minWidth:0}}>
              <div className="out" style={{fontWeight:700,fontSize:15,color:"var(--t1)",marginBottom:2}}>{g.name}{isExpired&&<span style={{marginLeft:8,fontSize:10,padding:"2px 8px",borderRadius:99,background:"rgba(255,71,87,.12)",color:"var(--red)",fontWeight:600}}>{"Expir\u00e9"}</span>}</div>
              <div style={{fontSize:11,color:"var(--t3)"}}>{typeLabel} · {g.code}</div>
            </div>
            <div style={{color:"var(--t3)",fontSize:16}}>{"\u2192"}</div>
          </button>);
        })}
      </div>
      <button onClick={function(){var code=prompt("Code administrateur :");if(!code)return;supabase.from('groups').select('code').eq('teacher_code',code).limit(1).then(function(res){if(res.data&&res.data.length>0){setCgForm({name:"",code:"",teacherCode:"",type:"school",startDate:"",endDate:""});setCgCodeErr("");setDashPhase("create-group");}else{alert("Code invalide");}});}} className="btn2" style={{width:"100%",marginTop:16,padding:"14px 24px",fontSize:14,borderColor:"rgba(0,224,255,.2)",color:"var(--cyan)"}}>
        {"\u2795 Cr\u00e9er un groupe"}
      </button>
      <button onClick={p.back} style={{display:"block",margin:"16px auto 0",background:"none",border:"none",color:"var(--t3)",fontSize:13,cursor:"pointer"}}>{"\u2190"} Exit</button>
    </div>
  </div>);

  // ─── CREATE GROUP PHASE ───
  if(dashPhase==="create-group"){
    var cgSeasons=cgForm.type==="visitor"?[]:generateSeasons(cgForm.startDate,cgForm.endDate);
    var cgValid=cgForm.name.trim()&&cgForm.code.trim()&&cgForm.teacherCode.trim()&&!cgCodeErr
      &&cgForm.startDate&&cgForm.endDate&&new Date(cgForm.endDate)>new Date(cgForm.startDate)
      &&((new Date(cgForm.endDate)-new Date(cgForm.startDate))/(864e5)>=7)
      &&(cgForm.type==="visitor"||cgSeasons.length>0);
    return(<div className="app enter" style={{display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"flex-start",minHeight:"100vh",padding:"32px 16px"}}>
      <div style={{width:"100%",maxWidth:420,animation:"fadeIn .5s"}}>
        <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:24}}>
          <button onClick={function(){setDashPhase("picker");}} style={{background:"none",border:"none",color:"var(--t2)",cursor:"pointer",fontSize:14}}>{"\u2190"}</button>
          <h1 className="out" style={{fontWeight:800,fontSize:22}}>{"Cr\u00e9er un groupe"}</h1>
        </div>

        {/* Group Name */}
        <label className="out" style={{fontSize:11,fontWeight:600,color:"var(--t2)",textTransform:"uppercase",letterSpacing:1,display:"block",marginBottom:6}}>Nom du groupe</label>
        <input value={cgForm.name} onChange={function(e){setCgForm(Object.assign({},cgForm,{name:e.target.value}));}}
          placeholder="ex: IDRAC Lyon B3 2027" style={{width:"100%",padding:"12px 16px",background:"var(--bg2)",border:"1px solid var(--bdr)",borderRadius:12,color:"var(--t1)",fontSize:14,fontFamily:"'DM Sans',sans-serif",outline:"none",marginBottom:16,boxSizing:"border-box"}}/>

        {/* Student Code */}
        <label className="out" style={{fontSize:11,fontWeight:600,color:"var(--t2)",textTransform:"uppercase",letterSpacing:1,display:"block",marginBottom:6}}>{"Code d\u0027acc\u00e8s \u00e9tudiant"}</label>
        <input value={cgForm.code} onChange={function(e){
          var v=e.target.value.toLowerCase().replace(/\s/g,"");
          setCgForm(Object.assign({},cgForm,{code:v}));
          if(v.length>=3){supabase.from('groups').select('code').eq('code',v).maybeSingle().then(function(res){setCgCodeErr(res.data?"Ce code existe d\u00e9j\u00e0":"");});}else{setCgCodeErr("");}

        }} placeholder="ex: idrac2027" style={{width:"100%",padding:"12px 16px",background:"var(--bg2)",border:"1px solid "+(cgCodeErr?"var(--red)":"var(--bdr)"),borderRadius:12,color:"var(--t1)",fontSize:14,fontFamily:"'DM Sans',sans-serif",outline:"none",marginBottom:4,boxSizing:"border-box"}}/>
        {cgCodeErr&&<p style={{fontSize:11,color:"var(--red)",margin:"0 0 12px"}}>{cgCodeErr}</p>}
        {!cgCodeErr&&<div style={{height:12}}/>}

        {/* Teacher Code */}
        <label className="out" style={{fontSize:11,fontWeight:600,color:"var(--t2)",textTransform:"uppercase",letterSpacing:1,display:"block",marginBottom:6}}>{"Code d\u0027acc\u00e8s enseignant"}</label>
        <input value={cgForm.teacherCode} onChange={function(e){setCgForm(Object.assign({},cgForm,{teacherCode:e.target.value}));}}
          placeholder="ex: arena-idrac2027" style={{width:"100%",padding:"12px 16px",background:"var(--bg2)",border:"1px solid var(--bdr)",borderRadius:12,color:"var(--t1)",fontSize:14,fontFamily:"'DM Sans',sans-serif",outline:"none",marginBottom:16,boxSizing:"border-box"}}/>

        {/* Type */}
        <label className="out" style={{fontSize:11,fontWeight:600,color:"var(--t2)",textTransform:"uppercase",letterSpacing:1,display:"block",marginBottom:8}}>Type</label>
        <div style={{display:"flex",gap:8,marginBottom:16}}>
          {[{k:"school",l:"\uD83C\uDFEB School"},{k:"pro",l:"\uD83D\uDCBC Professional"},{k:"visitor",l:"\uD83C\uDF0D Visitor"}].map(function(t){
            var sel=cgForm.type===t.k;
            return(<button key={t.k} onClick={function(){setCgForm(Object.assign({},cgForm,{type:t.k}));}}
              style={{flex:1,padding:"10px 8px",borderRadius:10,border:sel?"1.5px solid var(--cyan)":"1px solid var(--bdr)",background:sel?"rgba(0,224,255,.06)":"var(--bg2)",
              color:sel?"var(--cyan)":"var(--t2)",fontSize:13,fontWeight:sel?700:500,cursor:"pointer",fontFamily:"'DM Sans',sans-serif"}}>{t.l}</button>);
          })}
        </div>

        {/* Dates */}
        <div style={{display:"flex",gap:12,marginBottom:16}}>
          <div style={{flex:1}}>
            <label className="out" style={{fontSize:11,fontWeight:600,color:"var(--t2)",textTransform:"uppercase",letterSpacing:1,display:"block",marginBottom:6}}>{"D\u00e9but"}</label>
            <input type="date" value={cgForm.startDate} onChange={function(e){setCgForm(Object.assign({},cgForm,{startDate:e.target.value}));}}
              style={{width:"100%",padding:"10px 12px",background:"var(--bg2)",border:"1px solid var(--bdr)",borderRadius:10,color:"var(--t1)",fontSize:13,fontFamily:"'DM Sans',sans-serif",outline:"none",boxSizing:"border-box"}}/>
          </div>
          <div style={{flex:1}}>
            <label className="out" style={{fontSize:11,fontWeight:600,color:"var(--t2)",textTransform:"uppercase",letterSpacing:1,display:"block",marginBottom:6}}>Fin</label>
            <input type="date" value={cgForm.endDate} onChange={function(e){setCgForm(Object.assign({},cgForm,{endDate:e.target.value}));}}
              style={{width:"100%",padding:"10px 12px",background:"var(--bg2)",border:"1px solid var(--bdr)",borderRadius:10,color:"var(--t1)",fontSize:13,fontFamily:"'DM Sans',sans-serif",outline:"none",boxSizing:"border-box"}}/>
          </div>
        </div>

        {/* Season Preview */}
        {cgForm.type==="visitor"?
          <div style={{padding:"16px 20px",background:"rgba(27,112,207,.06)",border:"1px solid rgba(27,112,207,.15)",borderRadius:12,marginBottom:20,textAlign:"center"}}>
            <p style={{fontSize:13,color:"var(--t2)",margin:0}}>{"\uD83C\uDF0D Les visiteurs n\u0027ont pas de syst\u00e8me de saisons."}</p>
          </div>
        :cgForm.startDate&&cgForm.endDate&&new Date(cgForm.endDate)>new Date(cgForm.startDate)?
          <div style={{marginBottom:20}}>
            <label className="out" style={{fontSize:11,fontWeight:600,color:"var(--t2)",textTransform:"uppercase",letterSpacing:1,display:"block",marginBottom:8}}>{"Aper\u00e7u des saisons ("+cgSeasons.length+")"}</label>
            {cgSeasons.length>0?
              <div style={{display:"flex",gap:6,overflowX:"auto",paddingBottom:4}}>
                {cgSeasons.map(function(s){
                  return(<div key={s.id} style={{flex:"1 0 0",minWidth:70,padding:"10px 8px",background:"rgba(var(--cx),.04)",border:"1px solid rgba(var(--cx),.12)",borderRadius:10,textAlign:"center"}}>
                    <div style={{fontSize:20,marginBottom:4}}>{s.icon}</div>
                    <div className="out" style={{fontWeight:700,fontSize:12,color:s.color,marginBottom:2}}>S{s.id}</div>
                    <div style={{fontSize:10,color:"var(--t2)",fontWeight:600}}>{s.name}</div>
                    <div style={{fontSize:9,color:"var(--t3)",marginTop:4}}>{s.weeks.length} sem.</div>
                    <div style={{fontSize:9,color:"var(--t3)"}}>{s.start}</div>
                    <div style={{fontSize:9,color:"var(--t3)"}}>{s.end}</div>
                  </div>);
                })}
              </div>
            :<div style={{padding:12,background:"var(--bg2)",border:"1px solid var(--bdr)",borderRadius:10,textAlign:"center"}}><p style={{fontSize:12,color:"var(--t3)",margin:0}}>{"Dates trop proches pour g\u00e9n\u00e9rer des saisons"}</p></div>}
          </div>
        :null}

        {/* Create Button */}
        <button className="btn1" onClick={function(){
          if(!cgValid||cgSaving)return;
          setCgSaving(true);
          supabase.from('groups').upsert({
            code:cgForm.code,name:cgForm.name.trim(),type:cgForm.type,
            start_date:cgForm.startDate,end_date:cgForm.endDate,
            seasons:cgSeasons,teacher_code:cgForm.teacherCode.trim()
          },{onConflict:'code'}).then(function(res){
            setCgSaving(false);
            if(res.error){alert("Erreur: "+res.error.message);return;}
            loadGroups();setDashPhase("picker");
          });
        }} style={{width:"100%",padding:"14px 24px",fontSize:15,opacity:cgValid&&!cgSaving?1:.4,pointerEvents:cgValid&&!cgSaving?"auto":"none"}}>
          {cgSaving?"Cr\u00e9ation...":"Cr\u00e9er le groupe"}

        </button>
      </div>
    </div>);
  }

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
      return(<div style={{display:"flex",alignItems:"center",gap:8,marginBottom:12,padding:"8px 14px",background:"rgba(var(--cx),.06)",borderRadius:12,border:"1px solid rgba(var(--cx),.12)"}}>
        <span style={{fontSize:16}}>{typeIcon}</span>
        <span className="out" style={{fontWeight:700,fontSize:13,color:"var(--cyan)",flex:1}}>{g?g.name:classCode}</span>
        <button onClick={function(){setDashPhase("picker");}} style={{background:"none",border:"none",color:"var(--t3)",fontSize:11,cursor:"pointer",fontFamily:"'DM Sans',sans-serif"}} className="out">Change ›</button>
      </div>);
    }()}

    {/* Class KPI cards */}
    {(function(){var ghostCount=students.filter(isGhost).length;return(
    <div style={{display:"grid",gridTemplateColumns:"repeat(5,1fr)",gap:6,marginBottom:16}}>
      <div className="crd" style={{padding:10,textAlign:"center"}}><div className="out" style={{fontSize:18,fontWeight:800,color:"var(--cyan)"}}>{students.length}</div><div style={{fontSize:10,color:"var(--t3)"}}>Students</div></div>
      <div className="crd" style={{padding:10,textAlign:"center"}}><div className="out" style={{fontSize:18,fontWeight:800,color:classAcc>=60?"var(--green)":"var(--orange)"}}>{classAcc}%</div><div style={{fontSize:10,color:"var(--t3)"}}>Accuracy</div></div>
      <div className="crd" style={{padding:10,textAlign:"center"}}><div className="out" style={{fontSize:18,fontWeight:800,color:"var(--purple)"}}>{totalSess}</div><div style={{fontSize:10,color:"var(--t3)"}}>Sessions</div></div>
      <div className="crd" style={{padding:10,textAlign:"center"}}><div className="out" style={{fontSize:18,fontWeight:800,color:"var(--orange)"}}>{fmtTime(totalClassTime)}</div><div style={{fontSize:10,color:"var(--t3)"}}>Time</div></div>
      <div className="crd" onClick={function(){if(ghostCount>0){setShowGhostsOnly(!showGhostsOnly);setDashTab("overview");}}} style={{padding:10,textAlign:"center",cursor:ghostCount>0?"pointer":"default",background:showGhostsOnly?"rgba(224,82,82,.12)":"var(--bg2)",borderColor:showGhostsOnly?"rgba(224,82,82,.4)":"var(--bdr)"}}><div className="out" style={{fontSize:18,fontWeight:800,color:ghostCount>0?"var(--red)":"var(--t3)"}}>{ghostCount}</div><div style={{fontSize:10,color:"var(--t3)"}}>{"\uD83D\uDC7B"} Ghosts</div></div>
    </div>);})()}

    {/* ═══ OVERVIEW TAB ═══ */}
    {dashTab==="overview"&&(<div>
      {/* Action buttons */}
      <div style={{display:"flex",gap:8,marginBottom:16,flexWrap:"wrap"}}>
        <button className="btn1" onClick={function(){setLoad(true);loadStudents();}} style={{flex:"1 1 30%",fontSize:13}}>🔄 Refresh</button>
        <button className="btn2" onClick={exportCSV} style={{flex:"1 1 30%",fontSize:13,borderColor:"rgba(var(--cx),.3)",color:"var(--cyan)"}}>📥 Export CSV</button>
        <button className="btn2" onClick={function(){setShowReport(true);}} style={{flex:"1 1 30%",fontSize:13,borderColor:"rgba(240,200,80,.4)",color:"var(--gold)"}}>📄 Rapport hebdo</button>
      </div>

      {/* Student list */}
      <h3 className="out" style={{fontWeight:700,fontSize:14,marginBottom:10,color:"var(--t2)"}}>{showGhostsOnly?"\uD83D\uDC7B Ghost students":"Students"} ({showGhostsOnly?students.filter(isGhost).length:students.length})</h3>
      {students.length===0&&<div className="crd" style={{padding:20,textAlign:"center"}}>
        <p style={{color:"var(--t3)",fontSize:13}}>No students yet. Students appear automatically after onboarding.</p>
      </div>}
      <div style={{display:"flex",flexDirection:"column",gap:6}}>
        {(function(){
          // ── Sort controls ──
          var SORT_OPTS=[
            {id:"toeic",label:"TOEIC Score"},
            {id:"xp",label:"XP Total"},
            {id:"accuracy",label:"Accuracy"},
            {id:"time",label:"Time"},
            {id:"last_active",label:"Last Active"},
          ];
          var pool=showGhostsOnly?students.filter(isGhost):students;
          var sorted=pool.slice().sort(function(a,b){
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
            {/* Sort pills + Ghost filter toggle */}
            <div style={{display:"flex",gap:4,marginBottom:12,flexWrap:"wrap",alignItems:"center"}}>
              {SORT_OPTS.map(function(o){
                var active=sortBy===o.id;
                return(<button key={o.id} onClick={function(){setSortBy(o.id);}}
                  style={{padding:"5px 10px",borderRadius:99,border:"1px solid "+(active?"var(--cyan)":"var(--bdr)"),
                    background:active?"rgba(0,212,255,.1)":"transparent",color:active?"var(--cyan)":"var(--t3)",
                    fontSize:11,fontWeight:active?700:400,cursor:"pointer",fontFamily:"'DM Sans',sans-serif"}} className="out">{o.label}</button>);
              })}
              <button onClick={function(){setShowGhostsOnly(!showGhostsOnly);}}
                style={{padding:"5px 10px",borderRadius:99,border:"1px solid "+(showGhostsOnly?"rgba(224,82,82,.6)":"var(--bdr)"),
                  background:showGhostsOnly?"rgba(224,82,82,.15)":"transparent",color:showGhostsOnly?"var(--red)":"var(--t3)",
                  fontSize:11,fontWeight:showGhostsOnly?700:400,cursor:"pointer",fontFamily:"'DM Sans',sans-serif",marginLeft:"auto"}} className="out">{"\uD83D\uDC7B"} Ghosts only</button>
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
                <div style={{width:32,height:32,borderRadius:"50%",background:"linear-gradient(135deg,var(--cx-hex),#8b5e83)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:13,fontWeight:800,flexShrink:0}} className="out">{s.name.charAt(0).toUpperCase()}</div>
                <div style={{flex:1,minWidth:0}}>
                  <div className="out" style={{fontWeight:700,fontSize:13,display:"flex",alignItems:"center",gap:6}}>{s.name}{isGhost(s)&&<span title="Ghost student: ≤15 questions and ≤10 cards" style={{fontSize:11,opacity:.7}}>{"\uD83D\uDC7B"}</span>}</div>
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
                <div style={{height:"100%",width:pct+"%",background:"linear-gradient(90deg,var(--cx-hex),#8b5e83)",borderRadius:7,transition:"width .4s ease"}}/>
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

              return(<div key={wk} className="crd" style={{padding:14,borderColor:isCurrentWeek?"rgba(var(--cx),.2)":"var(--bdr)"}}>
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
      <button className="btn2" onClick={exportCSV} style={{width:"100%",fontSize:13,borderColor:"rgba(var(--cx),.3)",color:"var(--cyan)",marginBottom:16}}>📥 Export class data (CSV)</button>
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
                  background:evForm.type===t.id?"rgba(var(--cx),.08)":"var(--bg3)",color:evForm.type===t.id?t.c:"var(--t3)",
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
          return(<div key={ev.id} className="crd" style={{padding:14,opacity:isPast?.5:1,borderColor:isActive?"rgba(var(--cx),.3)":"var(--bdr)"}}>
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
  var parts=[
    {id:"lisP1",n:"Part 1 — Photographs",d:"10 random / "+LISTENING_P1.length,i:"eye-target",bg:"linear-gradient(135deg,#22c55e,#06b6d4)"},
    {id:"lisP2",n:"Part 2 — Question-Response",d:"10 random / "+LISTENING_P2.length,i:"chat-bubble",bg:"linear-gradient(135deg,#f59e0b,#ef4444)"},
    {id:"lisP3",n:"Part 3 — Conversations",d:"10 random / "+LISTENING_P3.length,i:"conversation",bg:"linear-gradient(135deg,#8b5cf6,#ec4899)"},
    {id:"lisP4",n:"Part 4 — Talks",d:"10 random / "+LISTENING_P4.length,i:"public-speaker",bg:"linear-gradient(135deg,#06b6d4,#3b82f6)"},
  ];
  return(<div className="enter" style={{padding:"20px 16px",minHeight:"100vh",display:"flex",flexDirection:"column",justifyContent:"center",textAlign:"center"}}>
    <div style={{marginBottom:16,display:"flex",justifyContent:"center"}}><GIcon name="ringing-bell" size={60} color="var(--cyan)"/></div>
    <h1 className="out" style={{fontWeight:900,fontSize:26,marginBottom:8}}>Listening Practice</h1>
    <p style={{color:"var(--t2)",fontSize:13,marginBottom:32,lineHeight:1.6}}>Train your ear for the TOEIC Listening section</p>
    <div style={{display:"flex",flexDirection:"column",gap:12,textAlign:"left"}}>
      {parts.map(function(m){var vl=isModuleLocked(m.id,p.u,p.groupType);return(
        <div key={m.id} className="crd" onClick={function(){if(vl){p.onPremium(m.n);return;}p.nav(m.id);}} style={{cursor:vl?"default":"pointer",display:"flex",alignItems:"center",gap:14,padding:"14px 16px",opacity:vl?.55:1}}>
          <div style={{width:42,height:42,borderRadius:12,background:vl?"transparent":"linear-gradient(135deg,rgba(var(--cx),.22),transparent)",border:vl?"1.5px solid var(--bdr)":"1.5px solid var(--cyan)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:20,flexShrink:0}}>{GAME_ICON_PATHS[m.i]?<GIcon name={m.i} size={22} color={vl?"var(--t3)":"var(--cyan)"}/>:m.i}</div>
          <div style={{flex:1}}><div className="out" style={{fontWeight:700,fontSize:14}}>{m.n}</div><div style={{fontSize:11,color:vl?"var(--gold)":"var(--t3)"}}>{vl?"Arena Premium":m.d}</div></div>
          {vl?<span style={{fontSize:14,color:"var(--gold)"}}>{"🔒"}</span>:<span style={{fontSize:16,color:"var(--cyan)"}}>{"→"}</span>}
        </div>);})}
    </div>
    <button className="btn2" onClick={p.back} style={{marginTop:24,width:"100%"}}>Back</button>
  </div>);
}

// ─── PART 2 LISTENING ───
function ListenP2(p){
  var items=useMemo(function(){return shuffle(LISTENING_P2).slice(0,10);},[]);
  var[ci,sC]=useState(0);var[sc,sSc]=useState(0);var[ph,sP]=useState("intro");var[pick,sPk]=useState(-1);
  var[playing,setPlaying]=useState(false);var[played,setPlayed]=useState(false);
  useEffect(function(){resumeAudioSession();return stopListenAudio;},[]);

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
    <div style={{marginBottom:16,display:"flex",justifyContent:"center"}}><GIcon name="chat-bubble" size={60} color="var(--cyan)"/></div>
    <h1 className="out" style={{fontWeight:900,fontSize:26,marginBottom:8}}>Part 2 — Question-Response</h1>
    <p style={{color:"var(--t2)",fontSize:13,marginBottom:8,lineHeight:1.6}}>You will hear a question followed by 3 responses.<br/>Choose the best response.</p>
    <p style={{color:"var(--gold)",fontWeight:600,fontSize:14,marginBottom:32}}>Listen carefully — audio plays once!</p>
    <button className="btn1" onClick={function(){sP("listen");}}>Start Listening</button>
    <button className="btn2" onClick={p.back} style={{marginTop:12,width:"100%"}}>Back</button></div>);

  if(ph==="done"){var xp=25+sc*6;if(p.gate)xp=p.gate(xp,sc,items.length);return(<div className="enter" style={{padding:"20px 16px",minHeight:"100vh",display:"flex",flexDirection:"column",justifyContent:"center",textAlign:"center"}}>
    <div style={{fontSize:48,marginBottom:16,animation:"countUp .6s"}}>{sc>=8?"🏆":sc>=5?"⚔️":"🛡️"}</div>
    <h1 className="out" style={{fontWeight:900,fontSize:28,marginBottom:8}}>Listening Complete</h1>
    <div className="out" style={{fontSize:44,fontWeight:900,color:sc>=8?"var(--green)":sc>=5?"var(--cyan)":"var(--orange)",marginBottom:4,animation:"countUp .8s"}}>{sc}/{items.length}</div>
    <div className="out" style={{fontSize:20,fontWeight:800,color:"var(--gold)",marginBottom:32}}>+{xp} XP</div>
    <button className="btn1" onClick={p.back}>Back</button></div>);}

  var it=items[ci];

  if(ph==="listen")return(<div style={{padding:"20px 16px",minHeight:"100vh"}}>
    <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:20}}>
      <button className="back-btn" onClick={p.back}>{"\u2190"} Back</button>
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
      <button className="back-btn" onClick={p.back}>{"\u2190"} Back</button>
      <span className="out" style={{fontSize:13,color:"var(--t2)",fontWeight:600}}>{ci+1}/{items.length}</span></div>
    <Bar value={ci} max={items.length} h={4} color="linear-gradient(90deg,#f59e0b,#ef4444)"/>
    <div className="crd" style={{marginTop:16,padding:14,background:"rgba(27,112,207,.05)",borderColor:"rgba(27,112,207,.12)"}}>
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
    <div className="crd" style={{marginTop:16,background:"rgba(var(--cx),.06)",borderColor:"rgba(var(--cx),.15)",padding:14,animation:"fadeIn .3s"}}>
      <p style={{fontSize:13,color:"var(--t2)",lineHeight:1.6}}>{it.x}</p></div>
    <button className="btn1" onClick={nxt} style={{marginTop:16}}>{ci<items.length-1?"Next":"See Results"}</button>
  </div>);
}

// ─── PART 1 LISTENING ───
function ListenP1(p){
  var items=useMemo(function(){return shuffle(LISTENING_P1).slice(0,10);},[]);
  var[ci,sC]=useState(0);var[sc,sSc]=useState(0);var[ph,sP]=useState("intro");var[pick,sPk]=useState(-1);
  var[playing,setPlaying]=useState(false);var[played,setPlayed]=useState(false);var[curOpt,setCurOpt]=useState(-1);
  useEffect(function(){resumeAudioSession();return stopListenAudio;},[]);

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
    <div style={{marginBottom:16,display:"flex",justifyContent:"center"}}><GIcon name="eye-target" size={60} color="var(--cyan)"/></div>
    <h1 className="out" style={{fontWeight:900,fontSize:26,marginBottom:8}}>Part 1 — Photographs</h1>
    <p style={{color:"var(--t2)",fontSize:13,marginBottom:8,lineHeight:1.6}}>Look at the photograph, then listen to 4 statements.<br/>Choose the one that best describes the image.</p>
    <p style={{color:"var(--gold)",fontWeight:600,fontSize:14,marginBottom:32}}>Listen carefully to each statement!</p>
    <button className="btn1" onClick={function(){sP("listen");}}>Start Listening</button>
    <button className="btn2" onClick={p.back} style={{marginTop:12,width:"100%"}}>Back</button></div>);

  if(ph==="done"){var xp=20+sc*5;if(p.gate)xp=p.gate(xp,sc,items.length);return(<div className="enter" style={{padding:"20px 16px",minHeight:"100vh",display:"flex",flexDirection:"column",justifyContent:"center",textAlign:"center"}}>
    <div style={{fontSize:48,marginBottom:16,animation:"countUp .6s"}}>{sc>=8?"🏆":sc>=5?"⚔️":"🛡️"}</div>
    <h1 className="out" style={{fontWeight:900,fontSize:28,marginBottom:8}}>Part 1 Complete</h1>
    <div className="out" style={{fontSize:44,fontWeight:900,color:sc>=8?"var(--green)":sc>=5?"var(--cyan)":"var(--orange)",marginBottom:4,animation:"countUp .8s"}}>{sc}/{items.length}</div>
    <div className="out" style={{fontSize:20,fontWeight:800,color:"var(--gold)",marginBottom:32}}>+{xp} XP</div>
    <button className="btn1" onClick={p.back}>Back</button></div>);}

  var it=items[ci];

  if(ph==="listen")return(<div style={{padding:"20px 16px",minHeight:"100vh"}}>
    <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16}}>
      <button className="back-btn" onClick={p.back}>{"\u2190"} Back</button>
      <span className="out" style={{fontSize:13,color:"var(--t2)",fontWeight:600}}>{ci+1}/{items.length}</span></div>
    <Bar value={ci} max={items.length} h={4} color="linear-gradient(90deg,#22c55e,#06b6d4)"/>

    <div style={{marginTop:12,marginBottom:16,borderRadius:14,overflow:"hidden",border:"1px solid var(--bdr)"}}>
      <img className="p1-photo" src={it.img} alt="TOEIC photograph" style={{width:"100%",display:"block",objectFit:"contain"}}/>
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
      <button className="back-btn" onClick={p.back}>{"\u2190"} Back</button>
      <span className="out" style={{fontSize:13,color:"var(--t2)",fontWeight:600}}>{ci+1}/{items.length}</span></div>
    <Bar value={ci} max={items.length} h={4} color="linear-gradient(90deg,#22c55e,#06b6d4)"/>

    <div style={{marginTop:8,marginBottom:12,borderRadius:12,overflow:"hidden",border:"1px solid var(--bdr)"}}>
      <img className="p1-photo-sm" src={it.img} alt="TOEIC photograph" style={{width:"100%",display:"block",objectFit:"contain"}}/>
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

    <div className="crd" style={{marginTop:12,background:"rgba(var(--cx),.06)",borderColor:"rgba(var(--cx),.15)",padding:12,animation:"fadeIn .3s"}}>
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
  useEffect(function(){resumeAudioSession();return stopListenAudio;},[]);

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
    <div style={{marginBottom:16,display:"flex",justifyContent:"center"}}><GIcon name="conversation" size={60} color="var(--cyan)"/></div>
    <h1 className="out" style={{fontWeight:900,fontSize:26,marginBottom:8}}>Part 3 — Conversations</h1>
    <p style={{color:"var(--t2)",fontSize:13,marginBottom:8,lineHeight:1.6}}>Listen to short conversations between 2 people.<br/>Answer 3 questions about each conversation.</p>
    <p style={{color:"var(--gold)",fontWeight:600,fontSize:14,marginBottom:32}}>Read the questions BEFORE listening!</p>
    <button className="btn1" onClick={function(){sP("listen");}}>Start Listening</button>
    <button className="btn2" onClick={p.back} style={{marginTop:12,width:"100%"}}>Back</button></div>);

  if(ph==="done"){var xp=30+sc*5;if(p.gate)xp=p.gate(xp,sc,totalQ+1);return(<div className="enter" style={{padding:"20px 16px",minHeight:"100vh",display:"flex",flexDirection:"column",justifyContent:"center",textAlign:"center"}}>
    <div style={{fontSize:48,marginBottom:16,animation:"countUp .6s"}}>{sc>=totalQs*0.8?"🏆":sc>=totalQs*0.5?"⚔️":"🛡️"}</div>
    <h1 className="out" style={{fontWeight:900,fontSize:28,marginBottom:8}}>Part 3 Complete</h1>
    <div className="out" style={{fontSize:44,fontWeight:900,color:sc>=totalQs*0.8?"var(--green)":sc>=totalQs*0.5?"var(--cyan)":"var(--orange)",marginBottom:4,animation:"countUp .8s"}}>{sc}/{totalQs}</div>
    <div className="out" style={{fontSize:20,fontWeight:800,color:"var(--gold)",marginBottom:32}}>+{xp} XP</div>
    <button className="btn1" onClick={p.back}>Back</button></div>);}

  var it=items[ci];

  // Listen phase — show questions preview + play button
  if(ph==="listen")return(<div style={{padding:"20px 16px",minHeight:"100vh"}}>
    <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16}}>
      <button className="back-btn" onClick={p.back}>{"\u2190"} Back</button>
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
      <button className="back-btn" onClick={p.back}>{"\u2190"} Back</button>
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
  useEffect(function(){resumeAudioSession();return stopListenAudio;},[]);

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
    <div style={{marginBottom:16,display:"flex",justifyContent:"center"}}><GIcon name="public-speaker" size={60} color="var(--cyan)"/></div>
    <h1 className="out" style={{fontWeight:900,fontSize:26,marginBottom:8}}>Part 4 — Talks</h1>
    <p style={{color:"var(--t2)",fontSize:13,marginBottom:8,lineHeight:1.6}}>Listen to short talks: announcements, voicemails, reports.<br/>Answer 3 questions about each talk.</p>
    <p style={{color:"var(--gold)",fontWeight:600,fontSize:14,marginBottom:32}}>Read the questions BEFORE listening!</p>
    <button className="btn1" onClick={function(){sP("listen");}}>Start Listening</button>
    <button className="btn2" onClick={p.back} style={{marginTop:12,width:"100%"}}>Back</button></div>);

  if(ph==="done"){var xp=30+sc*5;if(p.gate)xp=p.gate(xp,sc,totalQ+1);return(<div className="enter" style={{padding:"20px 16px",minHeight:"100vh",display:"flex",flexDirection:"column",justifyContent:"center",textAlign:"center"}}>
    <div style={{fontSize:48,marginBottom:16,animation:"countUp .6s"}}>{sc>=totalQs*0.8?"🏆":sc>=totalQs*0.5?"⚔️":"🛡️"}</div>
    <h1 className="out" style={{fontWeight:900,fontSize:28,marginBottom:8}}>Part 4 Complete</h1>
    <div className="out" style={{fontSize:44,fontWeight:900,color:sc>=totalQs*0.8?"var(--green)":sc>=totalQs*0.5?"var(--cyan)":"var(--orange)",marginBottom:4,animation:"countUp .8s"}}>{sc}/{totalQs}</div>
    <div className="out" style={{fontSize:20,fontWeight:800,color:"var(--gold)",marginBottom:32}}>+{xp} XP</div>
    <button className="btn1" onClick={p.back}>Back</button></div>);}

  var it=items[ci];

  if(ph==="listen")return(<div style={{padding:"20px 16px",minHeight:"100vh"}}>
    <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16}}>
      <button className="back-btn" onClick={p.back}>{"\u2190"} Back</button>
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
      <button className="back-btn" onClick={p.back}>{"\u2190"} Back</button>
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
  var parts=[
    {id:"drill",n:"Part 5 — Sentence Completion",d:"10 random questions from 100",i:"quill-ink",bg:"linear-gradient(135deg,#00e676,#00bfa5)"},
    {id:"timesim",n:"Part 5 — Exam Simulation",d:"30 Qs in 10 min, real pace",i:"sands-of-time",bg:"linear-gradient(135deg,#8b5cf6,#6366f1)"},
    {id:"p6",n:"Part 6 — Text Completion",d:"Business texts with blanks",i:"stone-tablet",bg:"linear-gradient(135deg,#c4587a,#8b5e83)"},
    {id:"p7",n:"Part 7 — Reading Comprehension",d:"Passages + questions",i:"bookmark",bg:"linear-gradient(135deg,#3b82f6,#06b6d4)"},
  ];
  return(<div className="enter" style={{padding:"20px 16px",minHeight:"100vh",display:"flex",flexDirection:"column",justifyContent:"center",textAlign:"center"}}>
    <div style={{marginBottom:16,display:"flex",justifyContent:"center"}}><GIcon name="bookmarklet" size={60} color="var(--cyan)"/></div>
    <h1 className="out" style={{fontWeight:900,fontSize:26,marginBottom:8}}>Reading Practice</h1>
    <p style={{color:"var(--t2)",fontSize:13,marginBottom:32,lineHeight:1.6}}>Train for the TOEIC Reading section</p>
    <div style={{display:"flex",flexDirection:"column",gap:12,textAlign:"left"}}>
      {parts.map(function(m){var vl=isModuleLocked(m.id,p.u,p.groupType);return(
        <div key={m.id} className="crd" onClick={function(){if(vl){p.onPremium(m.n);return;}p.nav(m.id);}} style={{cursor:vl?"default":"pointer",display:"flex",alignItems:"center",gap:14,padding:"14px 16px",opacity:vl?.55:1}}>
          <div style={{width:42,height:42,borderRadius:12,background:vl?"transparent":"linear-gradient(135deg,rgba(var(--cx),.22),transparent)",border:vl?"1.5px solid var(--bdr)":"1.5px solid var(--cyan)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:20,flexShrink:0}}>{GAME_ICON_PATHS[m.i]?<GIcon name={m.i} size={22} color={vl?"var(--t3)":"var(--cyan)"}/>:m.i}</div>
          <div style={{flex:1}}><div className="out" style={{fontWeight:700,fontSize:14}}>{m.n}</div><div style={{fontSize:11,color:vl?"var(--gold)":"var(--t3)"}}>{vl?"Arena Premium":m.d}</div></div>
          {vl?<span style={{fontSize:14,color:"var(--gold)"}}>{"🔒"}</span>:<span style={{fontSize:16,color:"var(--cyan)"}}>{"→"}</span>}
        </div>);})}
    </div>
    <button className="btn2" onClick={p.back} style={{marginTop:24,width:"100%"}}>Back</button>
  </div>);
}
// ─── LEAGUE ───
function generateSeasons(startDate,endDate){
  if(!startDate||!endDate)return[];
  // Get ISO week ID for a date
  function isoWeek(d){var tmp=new Date(d.getTime());tmp.setHours(0,0,0,0);tmp.setDate(tmp.getDate()+3-(tmp.getDay()+6)%7);var jan4=new Date(tmp.getFullYear(),0,4);var wk=1+Math.round(((tmp-jan4)/864e5-3+(jan4.getDay()+6)%7)/7);return tmp.getFullYear()+"-W"+wk;}
  // Parse dates
  var sd=new Date(startDate+"T00:00:00");var ed=new Date(endDate+"T00:00:00");
  if(isNaN(sd)||isNaN(ed)||ed<=sd)return[];
  // Collect all ISO weeks between start and end
  var weeks=[];var cur=new Date(sd.getTime());
  // Move to Monday of start week
  var dayOff=(cur.getDay()+6)%7;cur.setDate(cur.getDate()-dayOff);
  var seen={};
  while(cur<=ed){
    var wid=isoWeek(cur);
    if(!seen[wid]){seen[wid]=true;weeks.push(wid);}
    cur.setDate(cur.getDate()+7);
  }
  if(weeks.length===0)return[];
  // Decide number of seasons
  var tw=weeks.length;var ns;
  if(tw<=3)ns=1;else if(tw<=6)ns=2;else if(tw<=10)ns=3;else if(tw<=14)ns=4;else ns=5;
  // Season pool
  var pool=[
    {name:"Awakening",icon:"\uD83C\uDF31",color:"var(--green)"},
    {name:"Rising",icon:"\uD83D\uDD25",color:"var(--orange)"},
    {name:"Clash",icon:"\u2694\uFE0F",color:"var(--red)"},
    {name:"Final Push",icon:"\uD83C\uDFC6",color:"var(--gold)"},
    {name:"Legends",icon:"\uD83D\uDC51",color:"var(--purple)"}
  ];
  // Distribute weeks
  var base=Math.floor(tw/ns);var rem=tw%ns;var seasons=[];var idx=0;
  for(var i=0;i<ns;i++){
    var count=base+(i<ns-1?(i<rem?1:0):tw-idx); // last season gets remainder
    if(i===ns-1)count=tw-idx;
    var sw=weeks.slice(idx,idx+count);idx+=count;
    // Compute start/end labels from week IDs
    function weekToDate(wid){var pts=wid.split("-W");var yr=parseInt(pts[0]),wn=parseInt(pts[1]);var jan1=new Date(yr,0,1);var d=jan1.getDay();var mon=new Date(jan1);mon.setDate(jan1.getDate()+(d<=4?1-d:8-d)+(wn-1)*7);return mon;}
    var months=["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
    var sDate=weekToDate(sw[0]);
    var eDate=weekToDate(sw[sw.length-1]);eDate.setDate(eDate.getDate()+6); // Sunday
    var endDateStr=eDate.getFullYear()+"-"+String(eDate.getMonth()+1).padStart(2,"0")+"-"+String(eDate.getDate()).padStart(2,"0");
    var p=pool[i]||pool[pool.length-1];
    seasons.push({id:i+1,name:p.name,icon:p.icon,color:p.color,weeks:sw,
      start:months[sDate.getMonth()]+" "+sDate.getDate(),
      end:months[eDate.getMonth()]+" "+eDate.getDate(),
      endDate:endDateStr});
  }
  return seasons;
}

var SEASONS=[
  {id:1,name:"Awakening",icon:"🌱",color:"var(--green)",weeks:["2026-W12","2026-W13","2026-W14"],start:"Mar 23",end:"Apr 12",endDate:"2026-04-12"},
  {id:2,name:"Rising",icon:"🔥",color:"var(--orange)",weeks:["2026-W15","2026-W16","2026-W17"],start:"Apr 13",end:"May 3",endDate:"2026-05-03"},
  {id:3,name:"Clash",icon:"⚔️",color:"var(--red)",weeks:["2026-W18","2026-W19","2026-W20"],start:"May 4",end:"May 24",endDate:"2026-05-24"},
  {id:4,name:"Final Push",icon:"🏆",color:"var(--gold)",weeks:["2026-W21","2026-W22","2026-W23","2026-W24","2026-W25"],start:"May 25",end:"Jun 28",endDate:"2026-06-28"},
];
function getCurrentSeason(ss){var arr=ss||SEASONS;if(!arr||arr.length===0)return null;var cw=weekId();for(var i=0;i<arr.length;i++){if(arr[i].weeks.indexOf(cw)!==-1)return arr[i];}return arr[arr.length-1];}
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

function League(p){var u=p.u,lg=getEffectiveLeague(u.weeklyXp,u.moduleScores);
var[rivals,setRivals]=useState([]);
var[tab,setTab]=useState("week"); // week | season | overall
var cw=weekId();

var viewGroup=u.classCode||'visitor';
// toeic-dash-group is a Teacher Dashboard preference; it must NOT leak to regular
// users on multi-profile devices (e.g. after switching from Teacher to a test visitor
// profile, toeic-dash-group='idrac2026' would otherwise make jay_test appear in IDRAC
// Bronze league instead of visitor league).
if(u.classCode==="teacher-internal"||u.name==="Teacher"){
  try{var dg=localStorage.getItem('toeic-dash-group');if(dg)viewGroup=dg;}catch(e){console.warn("[league] toeic-dash-group read failed:",e&&e.message);}
}
var[leagueGroup,setLeagueGroup]=useState(viewGroup);
var[showAllLeagues,setShowAllLeagues]=useState(false);
var[progressionData,setProgressionData]=useState([]);
var[progLoading,setProgLoading]=useState(false);
var[groupData,setGroupData]=useState(null);

// Fetch group seasons
useEffect(function(){
  supabase.from('groups').select('seasons,type,start_date,end_date,grade_bonus_enabled').eq('code',leagueGroup).maybeSingle()
    .then(function(res){if(res.data)setGroupData(res.data);else setGroupData(null);});
},[leagueGroup]);

// Resolve seasons: dynamic from group, fallback to SEASONS for idrac2026
var dynSeasons=useMemo(function(){
  if(groupData&&groupData.seasons&&groupData.seasons.length>0)return groupData.seasons;
  if(!groupData&&leagueGroup==='idrac2026')return SEASONS; // fallback
  if(leagueGroup==='idrac2026')return SEASONS; // fallback even if groupData exists but seasons empty
  return[];
},[groupData,leagueGroup]);
var isVisitor=groupData&&groupData.type==="visitor";
var hasSeasons=dynSeasons.length>0&&!isVisitor;
// Grade bonus display: hidden if group explicitly opts out (Famille, Teacher, Visitor).
// Defaults to true (e.g. IDRAC, CESI, ESGI) if the column is missing or group not loaded yet.
var showGradeBonus=groupData?(groupData.grade_bonus_enabled!==false):true;
var curSeason=hasSeasons?getCurrentSeason(dynSeasons):null;

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
}

useEffect(function(){
  supabase.from('students').select('name,weekly_xp,week_id,avatar,weekly_history,module_scores').eq('class_code',leagueGroup).order('weekly_xp',{ascending:false}).limit(150)
    .then(function(res){if(res.data){setRivals(res.data.filter(function(r){return r.name!=="Teacher";}));setProgressionData([]);}});
},[u.weeklyXp,leagueGroup]);

// Auto-refresh leaderboard every 30s when on League tab
useEffect(function(){
  var iv=setInterval(function(){
    supabase.from('students').select('name,weekly_xp,week_id,avatar,weekly_history').eq('class_code',leagueGroup).limit(50)
      .then(function(res){if(res.data)setRivals(res.data.filter(function(r){return r.name!=="Teacher";}));});
  },180000);
  return function(){clearInterval(iv);};
},[leagueGroup]);

// ── WEEK VIEW data ──
var weekAll=rivals.map(function(r){var xp=r.week_id===cw?(r.weekly_xp||0):0;return{name:r.name,avatar:r.avatar||"⚔️",xp:(r.weekly_xp||0),inactive:r.week_id!==cw,me:r.name===u.name};});
if(u.name!=="Teacher"&&!weekAll.find(function(a){return a.me;}))weekAll.push({name:u.name,avatar:u.avatar||"⚔️",xp:u.weeklyXp,me:true});

weekAll.sort(function(a,b){
  if(a.inactive!==b.inactive)return a.inactive?1:-1; // actifs d'abord
  return b.xp-a.xp;
});

// ── SEASON VIEW data ──
var seasonRanking=useMemo(function(){
  if(rivals.length===0||!curSeason)return[];
  return computeRankings(rivals,cw,curSeason.weeks);
},[rivals,cw,curSeason]);

// ── OVERALL VIEW data ──
var allSeasonWeeks=useMemo(function(){var w=[];dynSeasons.forEach(function(s){s.weeks.forEach(function(wk){w.push(wk);});});return w;},[dynSeasons]);
var overallRanking=useMemo(function(){
  if(rivals.length===0||!hasSeasons)return[];
  return computeRankings(rivals,cw,allSeasonWeeks);
},[rivals,cw,allSeasonWeeks,hasSeasons]);

var nx=LEAGUES.find(function(l){return l.min>u.weeklyXp;});
var weekActive=weekAll.filter(function(pl){return !pl.inactive;});
var weekFiltered=weekActive.filter(function(pl){return getLeague(pl.xp).id===lg.id;});
var weekRank=weekFiltered.findIndex(function(pl){return pl.me;})+1;
var seasonRank=hasSeasons?(seasonRanking.findIndex(function(pl){return pl.name===u.name;})+1)||"-":"-";
var overallRank=hasSeasons?(overallRanking.findIndex(function(pl){return pl.name===u.name;})+1)||"-":"-";
var countdown=curSeason?getSeasonEndCountdown(curSeason):"";

// ── Render helpers ──
function RankRow(props){var pl=props.pl,rank=props.rank,isMe=props.isMe,unit=props.unit||"XP",bonus=props.bonus||null,bonusColor=props.bonusColor||"var(--gold)";
  return(<div style={{display:"flex",alignItems:"center",gap:12,padding:"12px 14px",background:isMe?"rgba(var(--cx),.08)":"var(--bg2)",border:isMe?"1.5px solid rgba(var(--cx),.25)":"1px solid var(--bdr)",borderRadius:12}}>
    <div className="out" style={{width:28,textAlign:"center",fontWeight:800,fontSize:14,color:rank<=3?"var(--gold)":"var(--t3)"}}>{rank<=3?(rank===1?"🥇":rank===2?"🥈":"🥉"):rank}</div>
    <div style={{width:28,display:"flex",justifyContent:"center"}}>{renderAv(pl.avatar,28)}</div>
    <div style={{flex:1}}>
      <div className="out" style={{fontWeight:isMe?700:500,fontSize:14,color:isMe?"var(--cyan)":"var(--t1)"}}>{isMe?pl.name+" (Toi)":pl.name}</div>
      {bonus&&<div style={{fontSize:10,color:bonusColor,fontWeight:700,marginTop:2}}>{bonus}</div>}
    </div>
    <div className="out" style={{fontWeight:700,fontSize:14,color:isMe?"var(--cyan)":"var(--t2)"}}>{pl.pts!==undefined?pl.pts:pl.xp} {unit}</div>
  </div>);
}

return(<div className="enter" style={{padding:"20px 16px 100px"}}>
<h1 className="out" style={{fontWeight:800,fontSize:24,marginBottom:4}}>League</h1>
{leagueGroup!==u.classCode&&<div style={{textAlign:"center",marginBottom:8}}>
  <span style={{fontSize:11,padding:"4px 12px",borderRadius:99,background:"rgba(27,112,207,.12)",border:"1px solid rgba(27,112,207,.25)",color:"var(--purple)"}} className="out">👁️ Viewing: {leagueGroup}</span>
</div>}

{/* Season banner */}
{curSeason&&<div className="crd" style={{padding:"14px 18px",marginBottom:16,background:"linear-gradient(135deg,rgba(var(--cx),.06),rgba(27,112,207,.06))",borderColor:"rgba(var(--cx),.15)"}}>
  <div style={{display:"flex",alignItems:"center",justifyContent:"space-between"}}>
    <div style={{display:"flex",alignItems:"center",gap:8}}>
      <span style={{fontSize:22}}>{curSeason.icon}</span>
      <div>
        <div className="out" style={{fontWeight:800,fontSize:15,color:curSeason.color}}>Saison {curSeason.id} : {curSeason.name}</div>
        <div style={{fontSize:11,color:"var(--t3)"}}>{curSeason.start} {"\u2192"} {curSeason.end}</div>
      </div>
    </div>
    <div style={{textAlign:"right"}}>
      <div style={{fontSize:12,fontWeight:700,color:countdown==="Ended"?"var(--red)":"var(--cyan)"}}>{ countdown==="Ended"?"Termin\u00e9e":countdown}</div>
    </div>
  </div>
</div>}

{/* Tab bar */}
<div style={{display:"flex",gap:4,marginBottom:16,background:"var(--bg2)",borderRadius:10,padding:3}}>
  {(hasSeasons?[{k:"week",l:"Semaine"},{k:"season",l:"Saison "+(curSeason?curSeason.id:"")},{k:"overall",l:"G\u00e9n\u00e9ral"},{k:"progress",l:"\uD83D\uDCC8 Progr\u00e8s"}]:[{k:"week",l:"Semaine"}]).map(function(t){
    var active=tab===t.k;
    return(<button key={t.k} onClick={function(){setTab(t.k);if(t.k==="progress")loadProgressionData();}} style={{flex:1,padding:"8px 0",borderRadius:8,border:"none",cursor:"pointer",fontFamily:"'DM Sans',sans-serif",fontSize:13,fontWeight:active?700:500,background:active?"var(--cyan)":"transparent",color:active?"#000":"var(--t3)",transition:"all .2s"}}>{t.l}</button>);
  })}
</div>

{/* Stats summary */}
{u.name==="Teacher"?
<div className="crd" style={{padding:"12px 16px",marginBottom:16,display:"flex",alignItems:"center",gap:10,background:"linear-gradient(135deg,rgba(245,158,11,.06),rgba(27,112,207,.06))",borderColor:"rgba(245,158,11,.15)"}}>
  <span style={{fontSize:18}}>{"\uD83D\uDC41\uFE0F"}</span>
  <div><div className="out" style={{fontWeight:700,fontSize:13,color:"var(--gold)"}}>Mode observateur</div>
  <div style={{fontSize:11,color:"var(--t3)"}}>{"Tes stats sont masqu\u00e9es du classement"}</div></div>
</div>
:
<div style={{display:"flex",gap:8,marginBottom:16}}>
  <div className="crd" style={{flex:1,padding:12,textAlign:"center"}}><div className="out" style={{fontSize:20,fontWeight:800,color:"var(--cyan)"}}>{u.weeklyXp}</div><div style={{fontSize:10,color:"var(--t3)"}}>XP semaine</div></div>
  {hasSeasons&&<div className="crd" style={{flex:1,padding:12,textAlign:"center"}}><div className="out" style={{fontSize:20,fontWeight:800,color:curSeason?curSeason.color:"var(--gold)"}}>#{seasonRank}</div><div style={{fontSize:10,color:"var(--t3)"}}>Saison</div></div>}
  {hasSeasons&&<div className="crd" style={{flex:1,padding:12,textAlign:"center"}}><div className="out" style={{fontSize:20,fontWeight:800,color:"var(--gold)"}}>#{overallRank}</div><div style={{fontSize:10,color:"var(--t3)"}}>{"G\u00e9n\u00e9ral"}</div></div>}
</div>}

{/* ── WEEK TAB ── */}
{tab==="week"&&(<div>
  {u.name!=="Teacher"&&<div className="crd glo" style={{textAlign:"center",marginBottom:16,padding:20}}>
    <div style={{fontSize:40,marginBottom:6,animation:"glow 3s infinite"}}>{lg.icon}</div>
    <div className="out" style={{fontWeight:800,fontSize:20,color:lg.color}}>Ligue {lg.name}</div>
    <div style={{fontSize:12,color:"var(--t2)",marginTop:4}}>Rang #{weekRank} cette semaine</div>
    {nx&&<div style={{marginTop:10}}><div style={{fontSize:10,color:"var(--t3)",marginBottom:4}}>{nx.min-u.weeklyXp} XP pour atteindre {nx.name}</div><Bar value={u.weeklyXp-lg.min} max={nx.min-lg.min} h={4} color={nx.color}/></div>}
  </div>}
  {(function(){
    var isTeacher=u.name==="Teacher";
    // Pour Teacher : tous les étudiants actifs, triés par XP, avec badge ligue
    // Pour étudiant : filtrés par sa propre ligue
    var active=weekAll;
    var displayed=isTeacher?active:(showAllLeagues?active:active.filter(function(pl){return pl.inactive||getLeague(pl.xp).id===lg.id;}));
    var hidden=isTeacher?[]:(active.filter(function(pl){return !pl.inactive&&getLeague(pl.xp).id!==lg.id;}));
    return(<div>
      <div style={{display:"flex",flexDirection:"column",gap:6}}>
        {displayed.map(function(pl,i){
          var plLg=getLeague(pl.xp);
          return(<div key={pl.name} style={{display:"flex",alignItems:"center",gap:12,padding:"12px 14px",background:pl.me?"rgba(var(--cx),.08)":pl.inactive?"var(--bg1)":"var(--bg2)",border:pl.me?"1.5px solid rgba(var(--cx),.25)":"1px solid var(--bdr)",borderRadius:12,opacity:pl.inactive?0.55:1}}>
            <div className="out" style={{width:28,textAlign:"center",fontWeight:800,fontSize:14,color:(!pl.inactive&&i<3)?"var(--gold)":"var(--t3)"}}>{pl.inactive?"—":i===0?"🥇":i===1?"🥈":i===2?"🥉":i+1}</div>
            <div style={{width:28,display:"flex",justifyContent:"center"}}>{renderAv(pl.avatar,28)}</div>
            <div style={{flex:1}}>
              <div className="out" style={{fontWeight:pl.me?700:500,fontSize:14,color:pl.me?"var(--cyan)":pl.inactive?"var(--t3)":"var(--t1)"}}>{pl.me?pl.name+" (Toi)":pl.name}</div>
              {pl.inactive&&<div style={{fontSize:10,color:"var(--t3)",fontWeight:500}}>{"⏸ Inactif(ve) cette semaine"}</div>}
              {!pl.inactive&&isTeacher&&<div style={{fontSize:10,color:plLg.color,fontWeight:600}}>{plLg.icon} {plLg.name}</div>}
            </div>
            <div className="out" style={{fontWeight:700,fontSize:14,color:pl.me?"var(--cyan)":pl.inactive?"var(--t3)":"var(--t2)"}}>{pl.inactive?"—":pl.xp+" XP"}</div>
          </div>);
        })}
        {displayed.length===0&&<div className="crd" style={{padding:20,textAlign:"center"}}><p style={{fontSize:13,color:"var(--t3)"}}>Personne en ligue {lg.name} pour l'instant 🚀</p></div>}
      </div>
      {!isTeacher&&hidden.length>0&&<div style={{textAlign:"center",marginTop:12}}>
        <button onClick={function(){setShowAllLeagues(function(v){return !v;});}} style={{background:"none",border:"1px solid var(--bdr)",borderRadius:8,padding:"6px 14px",fontSize:11,color:"var(--t3)",cursor:"pointer",fontFamily:"inherit"}}>
          {showAllLeagues?"Ma ligue uniquement ←":"👁 Voir les "+active.length+" participants actifs"}
        </button>
      </div>}
    </div>);
  })()}
  <p style={{textAlign:"center",fontSize:11,color:"var(--t3)",marginTop:16}}>Réinitialisé chaque lundi · Le classement détermine les points de saison</p>
</div>)}

{/* ── SEASON TAB ── */}
{tab==="season"&&curSeason&&(<div>
  <div className="crd" style={{textAlign:"center",marginBottom:16,padding:20,background:"linear-gradient(135deg,rgba(var(--cx),.04),rgba(27,112,207,.04))"}}>
    <div style={{fontSize:36,marginBottom:6}}>{curSeason.icon}</div>
    <div className="out" style={{fontWeight:800,fontSize:20,color:curSeason.color}}>Saison {curSeason.id} : {curSeason.name}</div>
    <div style={{fontSize:12,color:"var(--t2)",marginTop:4}}>{curSeason.weeks.length} semaines {"\u00B7"} {countdown}</div>
    <div style={{fontSize:11,color:"var(--t3)",marginTop:8,lineHeight:1.5}}>Chaque semaine, le 1er gagne N pts, le 2ème N-1...<br/>La régularité prime sur les coups d'éclat !</div>
  </div>
  <div style={{display:"flex",flexDirection:"column",gap:6}}>
    {seasonRanking.filter(function(pl){return pl.pts>0;}).map(function(pl,i){return(<RankRow key={i} pl={pl} rank={i+1} isMe={pl.name===u.name} unit="pts"/>);})}
    {seasonRanking.filter(function(pl){return pl.pts>0;}).length===0&&<div className="crd" style={{padding:20,textAlign:"center"}}><p style={{fontSize:13,color:"var(--t3)"}}>Pas encore de données — entraîne-toi !</p></div>}
  </div>
</div>)}

{/* ── OVERALL TAB ── */}
{tab==="overall"&&(<div>
  <div className="crd" style={{textAlign:"center",marginBottom:16,padding:20,background:"linear-gradient(135deg,rgba(245,158,11,.04),rgba(27,112,207,.04))"}}>
    <div style={{fontSize:36,marginBottom:6}}>{"🏆"}</div>
    <div className="out" style={{fontWeight:800,fontSize:20,color:"var(--gold)"}}>Classement Général</div>
    <div style={{fontSize:12,color:"var(--t2)",marginTop:4}}>Points de classement cumulés sur toutes les saisons</div>
    {showGradeBonus&&<div style={{fontSize:11,color:"var(--gold)",marginTop:8,fontWeight:600}}>{"🏆"} Top 3 {"→"} +2 pts {"·"} Top 10 {"→"} +1 pt sur la note finale</div>}
    {showGradeBonus&&<div style={{fontSize:10,color:"var(--t3)",marginTop:4}}>Cumulable avec le bonus Progression (max +4 pts au total)</div>}
  </div>
  {/* Season breakdown mini-bar */}
  <div style={{display:"flex",gap:6,marginBottom:16}}>
    {dynSeasons.map(function(s){
      var isCurrent=s.id===curSeason.id;var isPast=s.weeks[s.weeks.length-1]<cw;
      return(<div key={s.id} className="crd" style={{flex:1,padding:"8px 4px",textAlign:"center",borderColor:isCurrent?"rgba(var(--cx),.3)":"var(--bdr)",opacity:(!isCurrent&&!isPast)?0.4:1}}>
        <div style={{fontSize:16}}>{s.icon}</div>
        <div style={{fontSize:9,color:isCurrent?"var(--cyan)":"var(--t3)",fontWeight:isCurrent?700:400}}>S{s.id}</div>
        <div style={{fontSize:8,color:"var(--t3)"}}>{isPast?"Terminé":isCurrent?"En cours":"Bientôt"}</div>
      </div>);
    })}
  </div>
  <div style={{display:"flex",flexDirection:"column",gap:6}}>
    {overallRanking.filter(function(pl){return pl.pts>0;}).map(function(pl,i){
      var rank=i+1;
      var bonusLabel=showGradeBonus?(rank<=3?"\uD83C\uDFC6 +2pts note finale":rank<=10?"\u2B50 +1pt note finale":null):null;
      var bColor=rank<=3?"var(--gold)":"var(--cyan)";
      return(<RankRow key={i} pl={pl} rank={rank} isMe={pl.name===u.name} unit="pts" bonus={bonusLabel} bonusColor={bColor}/>);
    })}
    {overallRanking.filter(function(pl){return pl.pts>0;}).length===0&&<div className="crd" style={{padding:20,textAlign:"center"}}><p style={{fontSize:13,color:"var(--t3)"}}>Pas encore de données — la Saison 1 a commencé le 24 mars !</p></div>}
  </div>
</div>)}

{/* ── PROGRESSION TAB ── */}
{tab==="progress"&&(<div>
  <div className="crd" style={{textAlign:"center",marginBottom:16,padding:20,
    background:"linear-gradient(135deg,rgba(74,190,96,.04),rgba(27,112,207,.04))",
    borderColor:"rgba(74,190,96,.15)"}}>
    <div style={{fontSize:36,marginBottom:6}}>📈</div>
    <div className="out" style={{fontWeight:800,fontSize:20,color:"var(--green)"}}>Classement Progression</div>
    <div style={{fontSize:12,color:"var(--t2)",marginTop:4}}>Gain de score TOEIC estimé depuis la première semaine de données</div>
    {showGradeBonus&&<div style={{fontSize:11,color:"var(--gold)",marginTop:8,fontWeight:600}}>🏆 Top 3 → +2 pts · Top 10 → +1 pt sur la note finale</div>}
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
            var bonusLabel=(showGradeBonus&&pl.gain>0)?(isTop3?"🏆 +2pts":isTop10?"⭐ +1pt":""):"";
            return(<div key={pl.name} style={{
              display:"flex",alignItems:"center",gap:12,padding:"12px 14px",
              background:pl.me?"rgba(var(--cx),.08)":"var(--bg2)",
              border:pl.me?"1.5px solid rgba(var(--cx),.25)":isTop3?"1px solid rgba(74,190,96,.25)":"1px solid var(--bdr)",
              borderRadius:12}}>
              <div className="out" style={{width:28,textAlign:"center",fontWeight:800,fontSize:14,
                color:rank===1?"var(--gold)":rank===2?"#c0c0c0":rank===3?"#cd7f32":"var(--t3)"}}>
                {rank===1?"🥇":rank===2?"🥈":rank===3?"🥉":rank}
              </div>
              <div style={{width:28,display:"flex",justifyContent:"center"}}>{renderAv(pl.avatar,28)}</div>
              <div style={{flex:1}}>
                <div className="out" style={{fontWeight:pl.me?700:500,fontSize:14,
                  color:pl.me?"var(--cyan)":"var(--t1)"}}>
                  {pl.me?pl.name+" (Toi)":pl.name}
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
              ?("Modules évalués : "+pl.assessedQ+" / 50 questions minimum")
              :"Pas encore de référence (reviens la semaine prochaine)";
            return(<div key={pl.name} style={{
              display:"flex",alignItems:"center",gap:12,padding:"12px 14px",
              background:"var(--bg2)",border:"1px solid var(--bdr)",
              borderRadius:12,opacity:0.5}}>
              <div style={{width:28,textAlign:"center",fontSize:14,color:"var(--t3)"}}>—</div>
              <div style={{width:28,display:"flex",justifyContent:"center"}}>{renderAv(pl.avatar,28)}</div>
              <div style={{flex:1}}>
                <div className="out" style={{fontWeight:pl.me?700:500,fontSize:14,
                  color:pl.me?"var(--cyan)":"var(--t1)"}}>
                  {pl.me?pl.name+" (Toi)":pl.name}
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

// ─── PROFILE ───
// ── TOEIC Score Estimator (global — used by Profile + TeacherDash) ──
function estimateTOEICScore(ms){
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
}

// ─── UPGRADE SCREEN (Phase 3 Session 2) ───
// Full-page screen presenting Monthly vs Pass 3m and launching Stripe Checkout.
function UpgradeScreen(p){
  var u=p.u;
  var[busy,setBusy]=useState(null); // null | "monthly" | "pass3m"
  var[err,setErr]=useState("");

  async function go(plan){
    if(busy)return;
    setBusy(plan);setErr("");
    try{
      if(!u.email){setErr("Ajoute d'abord un email \u00e0 ton compte (Profil \u2192 S\u00e9curiser).");setBusy(null);return;}
      await createCheckout(plan); // redirects window.location to Stripe
    }catch(e){
      var msg=(e&&e.message)||"Erreur";
      if(msg==="email_required"){setErr("Ajoute d'abord un email \u00e0 ton compte (Profil \u2192 S\u00e9curiser).");}
      else setErr(msg);
      setBusy(null);
    }
  }

  return(<div className="enter" style={{padding:"20px 16px 100px"}}>
    <button className="back-btn" onClick={p.back}>{"\u2190"} Back</button>

    <div style={{textAlign:"center",marginBottom:24}}>
      <div style={{fontSize:56,marginBottom:8}}>{"\uD83C\uDFF0"}</div>
      <h1 className="out" style={{fontWeight:800,fontSize:24,marginBottom:4}}>Arena Premium</h1>
      <p style={{color:"var(--t2)",fontSize:13,lineHeight:1.5}}>Unlock the full arsenal {"\u00B7"} all modules, all tests, all rewards</p>
    </div>

    {/* TOEIC Pass 3 mois — Best value card (highlighted) */}
    <div className="crd" style={{marginBottom:14,padding:0,overflow:"hidden",border:"1.5px solid rgba(255,215,0,.4)",background:"linear-gradient(135deg,rgba(255,215,0,.06),rgba(var(--cx),.08))",position:"relative"}}>
      <div style={{position:"absolute",top:-1,right:12,background:"linear-gradient(135deg,#f0c850,#d4943a)",color:"#1a1610",fontWeight:800,fontSize:10,padding:"4px 10px",borderRadius:"0 0 8px 8px",letterSpacing:.5}} className="out">{"\uD83C\uDFC6 BEST VALUE"}</div>
      <div style={{padding:"22px 18px 18px"}}>
        <div style={{display:"flex",alignItems:"baseline",gap:10,marginBottom:6}}>
          <span className="out" style={{fontWeight:800,fontSize:18,color:"var(--gold)"}}>TOEIC Pass</span>
          <span style={{fontSize:12,color:"var(--t2)"}}>{"\u00B7 3 mois"}</span>
        </div>
        <div style={{display:"flex",alignItems:"baseline",gap:8,marginBottom:12}}>
          <span className="out" style={{fontWeight:900,fontSize:32,color:"var(--t1)"}}>22,99{"\u00A0\u20AC"}</span>
          <span style={{fontSize:12,color:"var(--t3)"}}>paiement unique</span>
        </div>
        <div style={{fontSize:12,color:"var(--t2)",lineHeight:1.7,marginBottom:16}}>
          <div>{"\u2713 Tout l'acc\u00e8s Premium pendant 3 mois"}</div>
          <div>{"\u2713 Paiement unique, aucune reconduction"}</div>
          <div>{"\u2713 \u00C9conomise ~23% vs mensuel"}</div>
          <div>{"\u2713 Parfait avant un examen programm\u00e9"}</div>
        </div>
        <button className="btn1" disabled={busy==="pass3m"} onClick={function(){go("pass3m");}}
          style={{width:"100%",fontSize:14,padding:"13px 20px",opacity:busy==="pass3m"?0.6:1,background:"linear-gradient(135deg,#f0c850,#d4943a)",color:"#1a1610"}}>
          {busy==="pass3m"?"\u2026":"Choose Pass 3 mois \u2192"}
        </button>
      </div>
    </div>

    {/* Monthly — standard card */}
    <div className="crd" style={{marginBottom:14,padding:"18px",border:"1px solid var(--bdr)"}}>
      <div style={{display:"flex",alignItems:"baseline",gap:10,marginBottom:6}}>
        <span className="out" style={{fontWeight:700,fontSize:16,color:"var(--t1)"}}>Premium Mensuel</span>
        <span style={{fontSize:12,color:"var(--t3)"}}>{"\u00B7 sans engagement"}</span>
      </div>
      <div style={{display:"flex",alignItems:"baseline",gap:8,marginBottom:12}}>
        <span className="out" style={{fontWeight:800,fontSize:26,color:"var(--t1)"}}>9,99{"\u00A0\u20AC"}</span>
        <span style={{fontSize:12,color:"var(--t3)"}}>{"/mois"}</span>
      </div>
      <div style={{fontSize:12,color:"var(--t2)",lineHeight:1.7,marginBottom:14}}>
        <div>{"\u2713 Tout l'acc\u00e8s Premium mois par mois"}</div>
        <div>{"\u2713 R\u00e9siliable \u00e0 tout moment"}</div>
        <div>{"\u2713 Flexible pour une pr\u00e9pa longue"}</div>
      </div>
      <button className="btn2" disabled={busy==="monthly"} onClick={function(){go("monthly");}}
        style={{width:"100%",fontSize:14,padding:"12px 20px",opacity:busy==="monthly"?0.6:1}}>
        {busy==="monthly"?"\u2026":"Choose Monthly \u2192"}
      </button>
    </div>

    {err&&<div className="crd" style={{marginBottom:14,padding:"10px 14px",background:"rgba(255,71,87,.08)",border:"1px solid rgba(255,71,87,.25)",fontSize:12,color:"var(--red)"}}>{err}</div>}

    {/* Fine print */}
    <div style={{fontSize:10,color:"var(--t3)",lineHeight:1.6,textAlign:"center",marginTop:20}}>
      {"Paiement s\u00e9curis\u00e9 par Stripe \u00B7 TVA non applicable, art. 293 B du CGI"}<br/>
      {"En souscrivant, tu acceptes les "}<a href="/cgv.md" target="_blank" rel="noopener" style={{color:"var(--cyan)"}}>CGV</a>{" et renonces \u00e0 ton droit de r\u00e9tractation (acc\u00e8s imm\u00e9diat au service)."}
    </div>
  </div>);
}

function Profile(p){
  var u=p.u;
  var[view,setView]=useState(null);
  var[pushOn,setPushOn]=useState(false);
  var[soundOn,setSoundOn]=useState(isSoundEnabled());
  var[tipOff,setTipOff]=useState(false);
  var[showPrivacy,setShowPrivacy]=useState(false);
  var fileRef=useRef(null);
  var[bioAvail,setBioAvail]=useState(false);var[bioRegistered,setBioRegistered]=useState(!!getBioCredId());
  var[invData,setInvData]=useState(null);var[invLoading,setInvLoading]=useState(true);

  useEffect(function(){isPushSubscribed().then(function(v){setPushOn(v);});biometricAvailable().then(function(v){setBioAvail(v);});},[]);
  useEffect(function(){if(view==="inventory"||view==="avatar"){setInvLoading(true);getOwnedRewards(u.name,u.classCode||"visitor").then(function(rewards){setInvData(rewards);setInvLoading(false);});}},[view]);
  useEffect(function(){try{setTipOff(localStorage.getItem("toeic-tip-disabled")==="1");}catch(e){}},[]);

  var lv=getLevel(u.xp),lg=getEffectiveLeague(u.weeklyXp,u.moduleScores);
  var acc=u.stats.totalQ>0?Math.round(u.stats.correct/u.stats.totalQ*100):0;
  var toeic=estimateTOEICScore(u.moduleScores||{});
  var uC=Object.assign({},u);
  var ea=ACHIEVEMENTS.filter(function(a){return a.check(uC);});
  var la=ACHIEVEMENTS.filter(function(a){return!a.check(uC);});
  var isPhoto=!!(u.avatar&&u.avatar.startsWith("data:"));
  var toeicCol=toeic.total>=750?"var(--green)":toeic.total>=500?"var(--orange)":toeic.total>200?"var(--red)":"var(--t3)";

  function renderAvatar(size,fs){
    if(isPhoto)return(<img src={u.avatar} style={{width:size,height:size,borderRadius:"50%",objectFit:"cover",display:"block"}}/>);
    if(u.avatar&&AVATARS[u.avatar])return(<AvatarMedal avatarId={u.avatar} size={size}/>);
    return(<div style={{width:size,height:size,borderRadius:"50%",background:"linear-gradient(135deg,var(--cx-hex),#8b5e83)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:fs||(size*0.5)}}>{u.avatar||"⚔️"}</div>);
  }

  function handlePhotoUpload(e){
    var file=e.target.files[0];if(!file)return;
    var reader=new FileReader();
    reader.onload=function(ev){
      var img=new Image();
      img.onload=function(){
        var canvas=document.createElement("canvas");canvas.width=160;canvas.height=160;
        var ctx=canvas.getContext("2d");
        var s=Math.min(img.width,img.height);
        var sx=(img.width-s)/2,sy=(img.height-s)/2;
        ctx.drawImage(img,sx,sy,s,s,0,0,160,160);
        var b64=canvas.toDataURL("image/jpeg",0.75);
        var c=JSON.parse(JSON.stringify(u));c.avatar=b64;p.setAvatar(c);
      };
      img.src=ev.target.result;
    };
    reader.readAsDataURL(file);
  }

  function Toggle(on,fn){
    return(<button onClick={fn} style={{width:52,height:28,borderRadius:14,border:"none",cursor:"pointer",
      position:"relative",background:on?"var(--cyan)":"var(--t3)",transition:"background .3s",flexShrink:0}}>
      <div style={{width:22,height:22,borderRadius:11,background:"#fff",position:"absolute",top:3,
        left:on?27:3,transition:"left .3s",boxShadow:"0 1px 3px rgba(0,0,0,.2)"}}/>
    </button>);
  }

  // ── SUB-VIEW : STATS ────────────────────────────────────────────────────
  if(view==="stats")return(
    <div className="enter" style={{padding:"20px 16px 100px"}}>
      <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:24}}>
        <button onClick={function(){setView(null);}} style={{background:"none",border:"none",color:"var(--cyan)",fontSize:22,cursor:"pointer",padding:0,lineHeight:1}}>←</button>
        <h1 className="out" style={{fontWeight:800,fontSize:20,margin:0}}>Mes Stats</h1>
      </div>
      <div className="crd" style={{padding:"14px 18px",marginBottom:16,
        background:"linear-gradient(135deg,rgba(var(--cx),.06),rgba(27,112,207,.06))",
        borderColor:"rgba(var(--cx),.15)"}}>
        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between"}}>
          <div>
            <div style={{fontSize:10,color:"var(--t3)",fontWeight:600,letterSpacing:1,textTransform:"uppercase",marginBottom:4}}>Estimated TOEIC Score</div>
            <div className="out" style={{fontWeight:900,fontSize:36,color:toeicCol,lineHeight:1}}>
              {toeic.total}<span style={{fontSize:14,color:"var(--t3)",fontWeight:400}}>/990</span>
            </div>
            {toeic.total<=200&&<div style={{fontSize:10,color:"var(--t3)",marginTop:4}}>{"Complete more modules to refine your score"}</div>}
          </div>
          <div style={{textAlign:"right"}}>
            <div style={{display:"flex",gap:16,marginBottom:4}}>
              <div style={{textAlign:"center"}}><div className="out" style={{fontWeight:700,fontSize:18,color:"var(--cyan)"}}>{toeic.listening}</div><div style={{fontSize:9,color:"var(--t3)"}}>Listening</div></div>
              <div style={{textAlign:"center"}}><div className="out" style={{fontWeight:700,fontSize:18,color:"var(--purple)"}}>{toeic.reading}</div><div style={{fontSize:9,color:"var(--t3)"}}>Reading</div></div>
            </div>
            <div style={{fontSize:9,color:"var(--t3)"}}>Based on your training</div>
          </div>
        </div>
      </div>
      <div className="rg2" style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
        {[
          {l:"XP Total",v:u.xp,i:"⭐"},
          {l:"XP cette semaine",v:u.weeklyXp,i:"⚡"},
          {l:"Accuracy",v:acc+"%",i:"🎯"},
          {l:"Sessions",v:u.stats.sessions,i:"📊"},
          {l:"Cards reviewed",v:u.stats.cardsRev||0,i:"🃏"},
          {l:"Exercices faits",v:u.stats.drills||0,i:"📝"},
          {l:"Perfect runs",v:u.stats.perfects||0,i:"✨"},
          {l:"Questions totales",v:u.stats.totalQ||0,i:"❓"}
        ].map(function(s){return(
          <div key={s.l} className="crd" style={{padding:14,textAlign:"center"}}>
            <div style={{fontSize:18,marginBottom:4}}>{s.i}</div>
            <div className="out" style={{fontSize:20,fontWeight:800}}>{s.v}</div>
            <div style={{fontSize:10,color:"var(--t2)",textTransform:"uppercase",letterSpacing:.5}}>{s.l}</div>
          </div>
        );})}
      </div>

      {/* ── BATTLE SCAN RESULTS ── */}
      {u.battleScan&&u.battleScan.scores&&function(){
        var bs=u.battleScan,sc=bs.scores;
        var axes=[{id:"grammar",label:"Grammar",arena:"Blade Precision",icon:"\u2694\uFE0F",color:"var(--cx-hex)"},{id:"vocab",label:"Vocabulary",arena:"Arcane Lore",icon:"\uD83D\uDCDA",color:"#8b5cf6"},{id:"reading",label:"Reading",arena:"Tactical Sight",icon:"\uD83D\uDD0D",color:"#22c55e"},{id:"listening",label:"Listening",arena:"Battle Sense",icon:"\uD83D\uDC42",color:"#3b82f6"}];
        var cx=90,cy=90,rad=70;
        var dxA=[0,1,0,-1],dyA=[-1,0,1,0];
        var pts=axes.map(function(a,i){var v=Math.max(sc[a.id]||0,0.15)/5;return(cx+dxA[i]*rad*v)+","+(cy+dyA[i]*rad*v);}).join(" ");
        var gridD=function(s){return cx+","+(cy-rad*s)+" "+(cx+rad*s)+","+cy+" "+cx+","+(cy+rad*s)+" "+(cx-rad*s)+","+cy;};
        return(
        <div className="crd" style={{marginTop:16,padding:"16px 14px"}}>
          <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:12}}>
            <div>
              <div style={{fontSize:10,color:"var(--t3)",fontWeight:600,letterSpacing:1,textTransform:"uppercase",marginBottom:2}}>Battle Scan</div>
              <div className="out" style={{fontFamily:"'Cinzel',serif",fontWeight:800,fontSize:14,color:"var(--cyan)"}}>{bs.tier}</div>
            </div>
            <div style={{textAlign:"right"}}>
              <div className="out" style={{fontWeight:800,fontSize:22,color:"var(--cyan)"}}>{bs.total}<span style={{fontSize:12,color:"var(--t3)"}}>/20</span></div>
              <div style={{fontSize:9,color:"var(--t3)"}}>{bs.date||"Day 1"}</div>
            </div>
          </div>
          <div style={{display:"flex",alignItems:"center",gap:12}}>
            <svg viewBox="0 0 180 180" width="140" height="140" style={{flexShrink:0}}>
              {[0.2,0.4,0.6,0.8,1.0].map(function(s,i){return(<polygon key={i} points={gridD(s)} fill="none" stroke={"rgba(180,140,80,"+(s===1?0.25:0.1)+")"} strokeWidth={s===1?"1":"0.5"}/>);})}
              {axes.map(function(a,i){return(<line key={a.id} x1={cx} y1={cy} x2={cx+dxA[i]*rad} y2={cy+dyA[i]*rad} stroke="rgba(180,140,80,0.12)" strokeWidth="0.5"/>);})}
              <polygon points={pts} fill="rgba(var(--cx),0.18)" stroke="var(--cx-hex)" strokeWidth="2" strokeLinejoin="round"/>
              {axes.map(function(a,i){var v=Math.max(sc[a.id]||0,0.15)/5;return(<circle key={a.id} cx={cx+dxA[i]*rad*v} cy={cy+dyA[i]*rad*v} r="3.5" fill={a.color} stroke="var(--bg)" strokeWidth="1.5"/>);})}
            </svg>
            <div style={{display:"flex",flexDirection:"column",gap:6,flex:1}}>
              {axes.map(function(a){var v=sc[a.id]||0;return(
                <div key={a.id} style={{display:"flex",alignItems:"center",gap:6}}>
                  <span style={{fontSize:14,width:20,textAlign:"center"}}>{a.icon}</span>
                  <div style={{flex:1}}>
                    <div style={{height:5,background:"var(--bg3)",borderRadius:99,overflow:"hidden"}}>
                      <div style={{width:(v/5*100)+"%",height:"100%",background:a.color,borderRadius:99}}/>
                    </div>
                  </div>
                  <span className="out" style={{fontSize:10,fontWeight:700,color:a.color,minWidth:22,textAlign:"right"}}>{v}/5</span>
                </div>);})}
            </div>
          </div>
        </div>);
      }()}

      {/* ── ACCURACY BY MODULE ── */}
      {function(){
        var modData=MISSION_MODULES.map(function(m){
          var ms=u.moduleScores&&u.moduleScores[m.id];
          var acc=ms&&ms.total>0?Math.round(ms.correct/ms.total*100):null;
          return{id:m.id,name:m.name,icon:m.icon,accuracy:acc,sessions:ms?ms.sessions:0,total:ms?ms.total:0,hasData:acc!==null};
        });
        var active=modData.filter(function(d){return d.hasData;});
        var notStarted=modData.filter(function(d){return!d.hasData;});
        if(active.length===0)return null;
        return(
        <div className="crd" style={{marginTop:16,padding:"16px 8px 8px"}}>
          <h3 className="out" style={{fontWeight:700,fontSize:13,marginBottom:12,color:"var(--t2)",paddingLeft:8}}>📊 Accuracy by module</h3>
          <ResponsiveContainer width="100%" height={Math.max(160,active.length*32)}>
            <BarChart data={active} layout="vertical" margin={{top:0,right:16,left:4,bottom:0}}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--bdr)" horizontal={false}/>
              <XAxis type="number" domain={[0,100]} tick={{fill:"var(--t3)",fontSize:10}} axisLine={{stroke:"var(--bdr)"}} tickLine={false} unit="%"/>
              <YAxis type="category" dataKey="name" width={100} tick={{fill:"var(--t2)",fontSize:10}} axisLine={false} tickLine={false}/>
              <Tooltip formatter={function(v){return v+"%";}} contentStyle={{background:"var(--bg2)",border:"1px solid var(--bdr)",borderRadius:8,fontSize:12}} labelStyle={{color:"var(--t1)",fontWeight:700}} itemStyle={{color:"var(--t1)"}} cursor={{fill:"rgba(180,140,80,0.06)"}}/>
              <RBar dataKey="accuracy" radius={[0,6,6,0]} barSize={18}>
                {active.map(function(entry,i){
                  var col=entry.accuracy>=70?"#4abe60":entry.accuracy>=50?"#ff8c42":"#e05252";
                  return(<Cell key={i} fill={col}/>);
                })}
              </RBar>
            </BarChart>
          </ResponsiveContainer>
          {notStarted.length>0&&<div style={{paddingLeft:8,paddingRight:8,paddingTop:8,paddingBottom:4}}>
            <p style={{fontSize:11,color:"var(--t3)",margin:0}}>{notStarted.length} module{notStarted.length>1?"s":""} not yet started: {notStarted.map(function(d){return d.icon;}).join(" ")}</p>
          </div>}
        </div>);
      }()}
    </div>
  );

  // ── SUB-VIEW : TROPHÉES ─────────────────────────────────────────────────
  if(view==="trophees")return(
    <div className="enter" style={{padding:"20px 16px 100px"}}>
      <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:16}}>
        <button onClick={function(){setView(null);}} style={{background:"none",border:"none",color:"var(--cyan)",fontSize:22,cursor:"pointer",padding:0,lineHeight:1}}>←</button>
        <h1 className="out" style={{fontWeight:800,fontSize:20,margin:0,flex:1}}>Achievements</h1>
        <span style={{fontSize:12,background:"rgba(255,215,0,.1)",color:"var(--gold)",padding:"3px 10px",borderRadius:20,border:"1px solid rgba(255,215,0,.2)"}}>{ea.length} / {ACHIEVEMENTS.length}</span>
      </div>
      <div className="crd" style={{padding:"12px 16px",marginBottom:20}}>
        <div style={{display:"flex",justifyContent:"space-between",fontSize:11,color:"var(--t2)",marginBottom:8}}>
          <span>Progression</span>
          <span style={{fontWeight:700,color:"var(--gold)"}}>{Math.round(ea.length/ACHIEVEMENTS.length*100)}%</span>
        </div>
        <div style={{height:6,background:"var(--bg3)",borderRadius:3,overflow:"hidden"}}>
          <div style={{height:6,borderRadius:3,background:"linear-gradient(90deg,var(--cx-hex),#8b5e83)",
            width:(ea.length/ACHIEVEMENTS.length*100)+"%",transition:"width .6s"}}/>
        </div>
      </div>
      {ea.length>0&&<>
        <div style={{fontSize:10,color:"var(--t3)",fontWeight:600,letterSpacing:1,textTransform:"uppercase",marginBottom:10}}>Unlocked ({ea.length})</div>
        <div className="rg2" style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginBottom:20}}>
          {ea.map(function(a){return(
            <div key={a.id} className="crd" style={{padding:14,background:"rgba(255,215,0,.05)",borderColor:"rgba(255,215,0,.15)"}}>
              <div style={{fontSize:22,marginBottom:6}}>{a.icon}</div>
              <div className="out" style={{fontWeight:700,fontSize:12,color:"var(--gold)",marginBottom:3}}>{a.name}</div>
              <div style={{fontSize:10,color:"var(--t2)",lineHeight:1.4}}>{a.desc}</div>
            </div>
          );})}
        </div>
      </>}
      {la.length>0&&<>
        <div style={{fontSize:10,color:"var(--t3)",fontWeight:600,letterSpacing:1,textTransform:"uppercase",marginBottom:10}}>Locked ({la.length})</div>
        <div className="rg2" style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
          {la.map(function(a){return(
            <div key={a.id} className="crd" style={{padding:14,opacity:.4}}>
              <div style={{fontSize:22,marginBottom:6,filter:"grayscale(1)"}}>🔒</div>
              <div className="out" style={{fontWeight:700,fontSize:12,marginBottom:3}}>{a.name}</div>
              <div style={{fontSize:10,color:"var(--t2)",lineHeight:1.4}}>{a.desc}</div>
            </div>
          );})}
        </div>
      </>}
    </div>
  );

  // ── SUB-VIEW : AVATAR ───────────────────────────────────────────────────
  // ═══ INVENTORY VIEW ═══
  if(view==="inventory"){
    var ownedAvatars=invData?invData.filter(function(r){return r.reward_type==="avatar";}):[];
    var ownedSkins=invData?invData.filter(function(r){return r.reward_type==="skin";}):[];
    return(<div className="enter" style={{padding:"20px 16px 100px"}}>
      <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:24}}>
        <button onClick={function(){setView(null);}} style={{background:"none",border:"none",color:"var(--cyan)",fontSize:22,cursor:"pointer",padding:0,lineHeight:1}}>{"\u2190"}</button>
        <h1 className="out" style={{fontWeight:800,fontSize:20,margin:0}}>Collection</h1>
      </div>

      {invLoading&&<p style={{color:"var(--t3)",textAlign:"center",padding:40}}>Loading...</p>}

      {!invLoading&&<>
        {/* All avatars (locked ones grayed out) */}
        <div style={{marginBottom:28}}>
          <div style={{fontSize:11,color:"var(--t2)",fontWeight:700,textTransform:"uppercase",letterSpacing:1,marginBottom:12}}>Avatars ({ownedAvatars.length}/{Object.keys(AVATARS).length})</div>
          <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(60px,1fr))",gap:6}}>
            {Object.keys(AVATARS).map(function(aid){
              var av=AVATARS[aid];var owned=ownedAvatars.some(function(r){return r.reward_id===aid;});
              var rarity=RARITIES.find(function(rt){return rt.id===av.rarity;})||RARITIES[0];
              return(<div key={aid} style={{display:"flex",flexDirection:"column",alignItems:"center",padding:6,borderRadius:10,
                opacity:owned?1:0.25,background:owned?"rgba(var(--cx),.04)":"var(--bg3)"}}>
                <AvatarMedal avatarId={aid} size={36}/>
                <div style={{fontSize:8,marginTop:2,color:owned?rarity.color:"var(--t3)",fontWeight:600}}>{av.name}</div>
              </div>);
            })}
          </div>
        </div>

        {/* All skins (locked ones grayed out) */}
        <div>
          <div style={{fontSize:11,color:"var(--t2)",fontWeight:700,textTransform:"uppercase",letterSpacing:1,marginBottom:12}}>Skins ({ownedSkins.length}/{Object.keys(SKINS).length})</div>
          <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(80px,1fr))",gap:8}}>
            {Object.keys(SKINS).map(function(sid){
              var sk=SKINS[sid];var owned=ownedSkins.some(function(r){return r.reward_id===sid;});
              var rarity=RARITIES.find(function(rt){return rt.id===sk.rarity;})||RARITIES[0];
              return(<div key={sid} style={{display:"flex",flexDirection:"column",alignItems:"center",gap:4,padding:8,borderRadius:12,
                opacity:owned?1:0.25,background:owned?"rgba(var(--cx),.04)":"var(--bg3)"}}>
                <div style={{width:40,height:40,borderRadius:10,background:"linear-gradient(135deg,"+sk.hex+","+sk.dark+")",border:"2px solid "+(owned?rarity.color:"var(--bg3)")}}/>
                <div style={{fontSize:9,fontWeight:600,color:owned?rarity.color:"var(--t3)"}}>{sk.name}</div>
              </div>);
            })}
          </div>
        </div>
      </>}
    </div>);
  }

  if(view==="avatar"){
    var styleAvatars=invData?invData.filter(function(r){return r.reward_type==="avatar";}):[];
    var styleSkins=invData?invData.filter(function(r){return r.reward_type==="skin";}):[];
    return(
    <div className="enter" style={{padding:"20px 16px 100px"}}>
      <input ref={fileRef} type="file" accept="image/*" style={{display:"none"}} onChange={handlePhotoUpload}/>
      <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:24}}>
        <button onClick={function(){setView(null);}} style={{background:"none",border:"none",color:"var(--cyan)",fontSize:22,cursor:"pointer",padding:0,lineHeight:1}}>←</button>
        <h1 className="out" style={{fontWeight:800,fontSize:20,margin:0}}>Style</h1>
      </div>
      <div style={{textAlign:"center",marginBottom:28}}>
        <div style={{position:"relative",display:"inline-block",marginBottom:16}}>
          {renderAvatar(96,48)}
          <button onClick={function(){fileRef.current.click();}}
            style={{position:"absolute",bottom:0,right:0,width:30,height:30,borderRadius:"50%",
              background:"var(--cyan)",border:"2px solid var(--bg)",cursor:"pointer",fontSize:14,
              display:"flex",alignItems:"center",justifyContent:"center"}}>📷</button>
        </div>
        <div style={{display:"flex",justifyContent:"center",gap:10,marginBottom:8}}>
          <button onClick={function(){fileRef.current.click();}} className="btn1"
            style={{fontSize:12,padding:"8px 18px"}}>📷 Importer une photo</button>
          {isPhoto&&<button onClick={function(){var c=JSON.parse(JSON.stringify(u));c.avatar="⚔️";p.setAvatar(c);}}
            className="btn2" style={{fontSize:12,padding:"8px 18px",color:"var(--red)",borderColor:"rgba(255,71,87,.2)"}}>✕ Supprimer</button>}
        </div>
        <div style={{fontSize:11,color:"var(--t3)"}}>Photo resized · stored locally</div>
      </div>
      <div style={{fontSize:10,color:"var(--t3)",fontWeight:600,letterSpacing:1,textTransform:"uppercase",marginBottom:12}}>ou choisis un emoji</div>
      <div style={{display:"flex",gap:8,flexWrap:"wrap",marginBottom:16}}>
        {["⚔️","🧙","🦊","🐉","🎯","🏆","🦅","💎","🔥","🌟","🎭","🐺","🦁","🎪","👤","🧠","🎲","🦉","🐲","🗡️","🏴‍☠️","⚡","🦈","🌀","🎸"].map(function(av){
          var sel=!isPhoto&&av===(u.avatar||"⚔️");
          return(<button key={av} onClick={function(){var c=JSON.parse(JSON.stringify(u));c.avatar=av;p.setAvatar(c);}}
            style={{width:48,height:48,borderRadius:14,border:sel?"2px solid var(--cyan)":"2px solid var(--bdr)",
              background:sel?"rgba(var(--cx),.1)":"var(--bg2)",cursor:"pointer",fontSize:24,
              display:"flex",alignItems:"center",justifyContent:"center",transition:"all .2s"}}>
            {av}</button>);
        })}
        {u.name==="Teacher"&&(function(){
          var sel=!isPhoto&&u.avatar==="🗝️";
          return(<button onClick={function(){var c=JSON.parse(JSON.stringify(u));c.avatar="🗝️";p.setAvatar(c);}}
            style={{width:48,height:48,borderRadius:14,
              border:sel?"2px solid var(--gold)":"2px solid rgba(255,215,0,.3)",
              background:sel?"rgba(255,215,0,.15)":"rgba(255,215,0,.05)",cursor:"pointer",fontSize:24,
              display:"flex",alignItems:"center",justifyContent:"center",transition:"all .2s",
              boxShadow:sel?"0 0 12px rgba(255,215,0,.3)":"none"}}>
            {"🗝️"}</button>);
        })()}
      </div>
      {u.name==="Teacher"&&<div style={{fontSize:11,color:"var(--gold)",marginBottom:16,fontStyle:"italic"}}>🗝️ Game Master — avatar exclusif</div>}

      {/* Chest avatars */}
      {!invLoading&&styleAvatars.length>0&&<>
        <div style={{fontSize:10,color:"var(--t3)",fontWeight:600,letterSpacing:1,textTransform:"uppercase",marginBottom:8}}>Avatars coffres</div>
        <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(72px,1fr))",gap:8,marginBottom:20}}>
          {styleAvatars.map(function(r){
            var av=AVATARS[r.reward_id];if(!av)return null;
            var rarity=RARITIES.find(function(rt){return rt.id===r.rarity;})||RARITIES[0];
            var isEquipped=u.avatar===r.reward_id;
            return(<button key={r.id} onClick={function(){
              var c=JSON.parse(JSON.stringify(u));c.avatar=r.reward_id;p.setAvatar(c);
            }} style={{display:"flex",flexDirection:"column",alignItems:"center",gap:4,padding:8,borderRadius:12,cursor:"pointer",
              background:isEquipped?"rgba(var(--cx),.1)":"var(--bg2)",
              border:isEquipped?"2px solid var(--cx-hex)":"1px solid var(--bdr)",
              fontFamily:"'DM Sans',sans-serif"}}>
              <AvatarMedal avatarId={r.reward_id} size={40}/>
              <div style={{fontSize:9,fontWeight:700,color:rarity.color,textAlign:"center"}}>{av.name}</div>
              {isEquipped&&<div style={{fontSize:7,color:"var(--cyan)",fontWeight:700,textTransform:"uppercase"}}>Equipped</div>}
            </button>);
          })}
        </div>
      </>}

      {/* ── SKINS ── */}
      <div style={{fontSize:10,color:"var(--t3)",fontWeight:600,letterSpacing:1,textTransform:"uppercase",marginBottom:8}}>Skin</div>
      {invLoading&&<p style={{color:"var(--t3)",fontSize:12,padding:12}}>Loading...</p>}
      {!invLoading&&styleSkins.length===0&&<div className="crd" style={{padding:16,textAlign:"center",marginBottom:20}}><p style={{color:"var(--t3)",fontSize:12}}>Aucun skin. Ouvre des coffres Rare+ pour en trouver !</p></div>}
      {!invLoading&&styleSkins.length>0&&<div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(90px,1fr))",gap:8,marginBottom:12}}>
        {styleSkins.map(function(r){
          var sk=SKINS[r.reward_id];if(!sk)return null;
          var rarity=RARITIES.find(function(rt){return rt.id===sk.rarity;})||RARITIES[0];
          var isEquipped=u.equippedSkin===r.reward_id;
          return(<button key={r.id} onClick={function(){
            var c=JSON.parse(JSON.stringify(u));c.equippedSkin=isEquipped?null:r.reward_id;p.setAvatar(c);
          }} style={{display:"flex",flexDirection:"column",alignItems:"center",gap:6,padding:10,borderRadius:14,cursor:"pointer",
            background:isEquipped?"rgba(var(--cx),.1)":"var(--bg2)",
            border:isEquipped?"2px solid "+sk.hex:"1px solid var(--bdr)",
            fontFamily:"'DM Sans',sans-serif"}}>
            <div style={{width:44,height:44,borderRadius:10,background:"linear-gradient(135deg,"+sk.hex+","+sk.dark+")",border:"2px solid "+rarity.color}}/>
            <div style={{fontSize:10,fontWeight:700,color:rarity.color}}>{sk.name}</div>
            {isEquipped&&<div style={{fontSize:7,color:"var(--cyan)",fontWeight:700,textTransform:"uppercase"}}>Equipped</div>}
          </button>);
        })}
      </div>}
      {u.equippedSkin&&<button className="btn2" onClick={function(){var c=JSON.parse(JSON.stringify(u));c.equippedSkin=null;p.setAvatar(c);}}
        style={{width:"100%",marginBottom:20,fontSize:12}}>Retirer le skin actuel</button>}

      {/* ── THEME ── */}
      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"12px 0"}}>
        <div>
          <div className="out" style={{fontWeight:700,fontSize:13}}>Mode</div>
          <div style={{fontSize:11,color:"var(--t2)"}}>{u.theme==="light"?"Clair":"Sombre"}</div>
        </div>
        {Toggle(u.theme==="light",function(){var c=JSON.parse(JSON.stringify(u));c.theme=c.theme==="light"?"dark":"light";p.setAvatar(c);})}
      </div>
    </div>);
  }

  // ── SOUS-PAGE GESTION DU COMPTE ─────────────────────────────────────────
  if(view==="account"){
    return(<div className="enter" style={{padding:"20px 16px 100px"}}>
      <button onClick={function(){setView("home");}} style={{background:"none",border:"none",color:"var(--t2)",cursor:"pointer",fontSize:14,marginBottom:16,padding:0}}>{"\u2190 Back"}</button>
      <h1 className="out" style={{fontWeight:800,fontSize:22,marginBottom:4}}>{"Gestion du compte"}</h1>
      <p style={{color:"var(--t3)",fontSize:12,marginBottom:24}}>{"S\u00e9curit\u00e9, donn\u00e9es, actions critiques"}</p>

      {/* ─── SECTION SÉCURITÉ ─── */}
      <div style={{fontSize:10,color:"var(--t3)",fontWeight:600,letterSpacing:1,textTransform:"uppercase",marginBottom:10}}>{"\uD83D\uDD12 S\u00e9curit\u00e9"}</div>
      <button className="btn2" onClick={async function(){
        if(u.email){
          alert("Votre compte est d\u00e9j\u00e0 s\u00e9curis\u00e9 avec l'email :\n"+u.email+"\n\nVous recevrez les notifications importantes \u00e0 cette adresse.");
          return;
        }
        var email=prompt("Entrez votre email pour s\u00e9curiser votre compte.\n\nVous recevrez un lien de confirmation par email.\nUne fois confirm\u00e9, votre progression sera li\u00e9e \u00e0 cet email et retrouvable depuis n'importe quel appareil.");
        if(email===null)return;
        email=email.trim().toLowerCase();
        if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)){alert("Adresse email invalide. Format attendu : nom@domaine.tld");return;}
        try{
          await linkEmailToAnonymous(email);
          try{sessionStorage.setItem("awaitingEmailConfirm","1");}catch(e){}
          alert("\u2709\ufe0f Email de confirmation envoy\u00e9 \u00e0 :\n"+email+"\n\n\uD83D\uDCF1 Sur mobile : ouvre le lien depuis CE m\u00eame navigateur (pas depuis l'app Gmail). Si le lien s'ouvre ailleurs, la confirmation ne remontera pas ici.\n\nL'app d\u00e9tectera automatiquement la confirmation d\u00e8s que tu reviens.");
        }catch(e){alert("Erreur : "+((e&&e.message)||"impossible d'envoyer l'email."));}
      }} style={{fontSize:13,width:"100%",marginBottom:8,borderColor:u.email?"rgba(74,190,96,.3)":"rgba(var(--cx),.2)",color:u.email?"var(--green)":"var(--cyan)"}}>
        {u.email?("\u2705 Compte s\u00e9curis\u00e9 \u2014 "+u.email):"\uD83D\uDD12 S\u00e9curiser avec un email"}
      </button>
      {/* (PIN button removed 2026-04-20 — replaced by email-based auth) */}
      <div style={{marginBottom:20}}/>

      {/* ─── SECTION MES DONNÉES ─── */}
      <div style={{fontSize:10,color:"var(--t3)",fontWeight:600,letterSpacing:1,textTransform:"uppercase",marginBottom:10}}>{"\uD83D\uDCC2 Mes donn\u00e9es"}</div>
      <button className="btn2" onClick={function(){
        var data={nom:u.name,classe:u.classCode,xp:u.xp,xpHebdo:u.weeklyXp,serie:u.streak,derniereActivite:u.lastActive,
          stats:u.stats,scoresModules:u.moduleScores,resultatsTests:u.mockResults,scoresJeux:u.gameScores,
          succes:u.unlockedAch,avatar:u.avatar,theme:u.theme,tempsTotal:u.totalTime,
          consentementRGPD:u.gdprConsent,exportDate:new Date().toISOString()};
        var blob=new Blob([JSON.stringify(data,null,2)],{type:"application/json"});
        var a=document.createElement("a");a.href=URL.createObjectURL(blob);
        a.download="toeic_arena_mes_donnees_"+u.name.replace(/\s+/g,"_")+"_"+today()+".json";
        a.click();URL.revokeObjectURL(a.href);
      }} style={{fontSize:13,width:"100%",marginBottom:20,borderColor:"rgba(var(--cx),.2)",color:"var(--cyan)"}}>
        {"\uD83D\uDCE5 Exporter mes donn\u00e9es (JSON)"}
      </button>

      {/* ─── SECTION ACTIONS CRITIQUES ─── */}
      <div style={{fontSize:10,color:"var(--red)",fontWeight:600,letterSpacing:1,textTransform:"uppercase",marginBottom:10}}>{"\u26A0\uFE0F Actions critiques"}</div>
      <div className="crd" style={{padding:14,background:"rgba(255,71,87,.04)",border:"1px solid rgba(255,71,87,.15)",marginBottom:16}}>
        <p style={{fontSize:11,color:"var(--t3)",lineHeight:1.5,marginBottom:12}}>{"Les actions ci-dessous sont irr\u00e9versibles. Assure-toi de bien comprendre avant de confirmer."}</p>
        <button className="btn2" onClick={function(){
          if(!confirm("Supprimer d\u00e9finitivement votre compte et toutes vos donn\u00e9es ?\n\nCette action est irr\u00e9versible."))return;
          if(!confirm("Derni\u00e8re confirmation : toutes vos donn\u00e9es (scores, progression, achievements) seront perdues."))return;
          p.deleteAccount();
        }} style={{fontSize:12,color:"var(--red)",borderColor:"rgba(255,71,87,.3)",width:"100%",marginBottom:8}}>
          {"\uD83D\uDDD1\uFE0F Supprimer mon compte et mes donn\u00e9es"}
        </button>
        <button className="btn2" onClick={function(){var code=prompt("Code formateur pour r\u00e9initialiser :");if(!code)return;supabase.from('groups').select('code').eq('teacher_code',code).limit(1).then(function(res){if(res.data&&res.data.length>0)p.reset();else alert("Code invalide");});}}
          style={{fontSize:11,color:"var(--t3)",borderColor:"rgba(255,71,87,.15)",width:"100%"}}>
          {"\uD83D\uDD04 R\u00e9initialiser (formateur)"}
        </button>
      </div>
    </div>);
  }

  // ── VUE PRINCIPALE ──────────────────────────────────────────────────────
  return(
    <div className="enter" style={{padding:"20px 16px 100px"}}>

      {/* Hero */}
      <div style={{textAlign:"center",marginBottom:24}}>
        <button onClick={function(){setView("avatar");}}
          style={{background:"none",border:"none",cursor:"pointer",padding:0,marginBottom:12,display:"inline-block",position:"relative"}}>
          {renderAvatar(88,44)}
          <div style={{position:"absolute",bottom:0,right:0,width:26,height:26,borderRadius:"50%",
            background:"var(--cyan)",border:"2px solid var(--bg)",display:"flex",alignItems:"center",
            justifyContent:"center",fontSize:12}}>✎</div>
        </button>
        <h1 className="out" style={{fontWeight:800,fontSize:22,marginBottom:8}}>{u.name}</h1>
        <div style={{display:"flex",justifyContent:"center",gap:10,flexWrap:"wrap"}}>
          <span style={{fontSize:12,background:"rgba(var(--cx),.1)",color:"var(--orange)",padding:"3px 10px",borderRadius:20,border:"1px solid rgba(var(--cx),.2)"}}>Lv. {lv.level}</span>
          <span style={{fontSize:12,padding:"3px 10px",borderRadius:20,border:"1px solid rgba(27,112,207,.2)",background:"rgba(27,112,207,.1)",color:lg.color}}>
  {lg.icon} {lg.name}
  {lg.locked&&<span style={{fontSize:10,color:"var(--t3)",marginLeft:4}}>🔒</span>}
</span>
{lg.locked&&<span style={{fontSize:11,color:"var(--t3)",padding:"3px 10px",borderRadius:20,background:"rgba(255,71,87,.06)",border:"1px solid rgba(255,71,87,.15)"}}>Legend tier: reach TOEIC {lg.lockedScore}</span>}
          <span style={{fontSize:12,background:"rgba(255,100,0,.1)",color:"#ff6428",padding:"3px 10px",borderRadius:20,border:"1px solid rgba(255,100,0,.2)"}}>🔥 {u.streak}</span>
        </div>
      </div>

      {/* 4 tuiles de navigation */}
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:20}}>
        <button onClick={function(){setView("stats");}} className="crd"
          style={{padding:"14px 8px",textAlign:"center",cursor:"pointer",background:"rgba(var(--cx),.03)",border:"1px solid rgba(var(--cx),.2)",width:"100%"}}>
          <div style={{marginBottom:4,display:"flex",justifyContent:"center"}}><GIcon name="rune-stone" size={26} color="var(--cyan)"/></div>
          <div style={{fontWeight:800,fontSize:16,color:"var(--t1)"}}>{u.xp}</div>
          <div style={{fontSize:10,color:"var(--t2)",textTransform:"uppercase",letterSpacing:.5}}>Stats</div>
        </button>
        <button onClick={function(){setView("trophees");}} className="crd"
          style={{padding:"14px 8px",textAlign:"center",cursor:"pointer",background:"rgba(255,215,0,.03)",border:"1px solid rgba(255,215,0,.15)",width:"100%"}}>
          <div style={{marginBottom:4,display:"flex",justifyContent:"center"}}><GIcon name="trophy-cup" size={26} color="var(--gold)"/></div>
          <div className="out" style={{fontWeight:800,fontSize:16,color:"var(--gold)"}}>{ea.length}<span style={{fontSize:11,color:"var(--t3)",fontWeight:400}}>/{ACHIEVEMENTS.length}</span></div>
          <div style={{fontSize:10,color:"var(--t2)",textTransform:"uppercase",letterSpacing:.5}}>Achievements</div>
        </button>
        <button onClick={function(){setView("avatar");}} className="crd"
          style={{padding:"14px 8px",textAlign:"center",cursor:"pointer",background:"rgba(var(--cx),.03)",border:"1px solid rgba(var(--cx),.2)",width:"100%"}}>
          <div style={{height:28,display:"flex",alignItems:"center",justifyContent:"center",marginBottom:4}}>
            {renderAvatar(28,18)}
          </div>
          <div style={{fontWeight:800,fontSize:16,color:"var(--t1)"}}>Style</div>
          <div style={{fontSize:10,color:"var(--t2)",textTransform:"uppercase",letterSpacing:.5}}>Apparence</div>
        </button>
        <button onClick={function(){setView("inventory");}} className="crd"
          style={{padding:"14px 8px",textAlign:"center",cursor:"pointer",background:"rgba(192,96,240,.03)",border:"1px solid rgba(192,96,240,.15)",width:"100%"}}>
          <div style={{marginBottom:4,display:"flex",justifyContent:"center"}}><GIcon name="gem-necklace" size={26} color="#c060f0"/></div>
          <div style={{fontWeight:800,fontSize:16,color:"#c060f0"}}>Collection</div>
          <div style={{fontSize:10,color:"var(--t2)",textTransform:"uppercase",letterSpacing:.5}}>Catalogue</div>
        </button>
      </div>

      {/* Teacher dashboard — only shown for users in a teacher-dedicated class.
          When the app is deployed on multiple campuses, each teacher gets their own
          synthetic class (like 'teacher-internal') so the button stays out of view
          for students/visitors. Access via the onboarding "Teacher access" link is
          still possible with a valid teacher_code. */}
      {u.classCode==="teacher-internal"&&<button className="btn2" onClick={async function(){
        // Try biometric first if registered
        if(bioAvail&&bioRegistered){try{var ok=await bioAuthenticate();if(ok){p.goTeacher();return;}}catch(e){console.warn("[teacher] biometric auth failed:",e&&e.message);}}
        // Fall back to password prompt
        var code=prompt("Code formateur :");if(!code)return;supabase.from('groups').select('code').eq('teacher_code',code).limit(1).then(function(res){if(res.data&&res.data.length>0){try{localStorage.setItem('toeic-dash-group',res.data[0].code);}catch(e){}p.goTeacher();}else{alert("Code invalide");}});}}
        style={{fontSize:13,width:"100%",marginBottom:20,padding:"14px 24px",borderColor:"rgba(var(--cx),.2)",color:"var(--cyan)"}}>
        👨‍🏫 Teacher Dashboard
      </button>}

      {/* Settings */}
      <div style={{fontSize:10,color:"var(--t3)",fontWeight:600,letterSpacing:1,textTransform:"uppercase",marginBottom:10}}>Settings</div>
      <div className="crd" style={{padding:0,overflow:"hidden",marginBottom:20}}>
        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"14px 16px",borderBottom:"1px solid var(--bdr)"}}>
          <div>
            <div className="out" style={{fontWeight:700,fontSize:14}}>Apparence</div>
            <div style={{fontSize:12,color:"var(--t2)"}}>{u.theme==="light"?"Mode clair":"Mode sombre"}</div>
          </div>
          {Toggle(u.theme==="light",function(){var c=JSON.parse(JSON.stringify(u));c.theme=c.theme==="light"?"dark":"light";p.setAvatar(c);})}
        </div>
        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"14px 16px",borderBottom:"1px solid var(--bdr)"}}>
          <div>
            <div className="out" style={{fontWeight:700,fontSize:14}}>Effets sonores</div>
            <div style={{fontSize:12,color:"var(--t2)"}}>{soundOn?"Enabled":"Disabled"}</div>
          </div>
          {Toggle(soundOn,function(){var cur=isSoundEnabled();setSoundEnabled(!cur);setSoundOn(!cur);if(!cur)try{playCorrect();}catch(e){}if(cur)stopBGM();})}
        </div>
        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"14px 16px",borderBottom:("PushManager" in window)?"1px solid var(--bdr)":"none"}}>
          <div>
            <div className="out" style={{fontWeight:700,fontSize:14}}>Conseils TOEIC</div>
            <div style={{fontSize:12,color:"var(--t2)"}}>Shown on launch</div>
          </div>
          {Toggle(!tipOff,function(){try{var cur=localStorage.getItem("toeic-tip-disabled")==="1";if(cur){localStorage.removeItem("toeic-tip-disabled");localStorage.removeItem("toeic-tip-date");setTipOff(false);}else{localStorage.setItem("toeic-tip-disabled","1");setTipOff(true);}}catch(e){}})}
        </div>
        {("PushManager" in window)&&
          <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"14px 16px"}}>
            <div>
              <div className="out" style={{fontWeight:700,fontSize:14}}>Notifications</div>
              <div style={{fontSize:12,color:"var(--t2)"}}>{pushOn?"Streak reminders ON":"Disabled"}</div>
            </div>
            {Toggle(pushOn,function(){if(pushOn){unsubscribePush(u.name,u.classCode).then(function(){setPushOn(false);});}else{subscribePush(u.name,u.classCode).then(function(sub){if(sub)setPushOn(true);});}})}
          </div>
        }
      </div>

      {/* (GDPR Export moved to Gestion du compte sub-page) */}

      {/* Subscription section — Phase 3 Session 2 */}
      {(function(){
        var lvl=u.accessLevel||"free";
        var isPremium=lvl==="premium_monthly"||lvl==="premium_pass";
        var expiresAt=u.accessExpiresAt?new Date(u.accessExpiresAt):null;
        var expStr=expiresAt?expiresAt.toLocaleDateString("fr-FR",{day:"2-digit",month:"short",year:"numeric"}):null;
        if(isPremium){
          var label=lvl==="premium_monthly"?"Premium Mensuel":"TOEIC Pass 3 mois";
          var icon=lvl==="premium_monthly"?"\uD83D\uDD01":"\uD83C\uDF9F\uFE0F";
          var tagline=lvl==="premium_monthly"
            ?(expStr?"Prochain pr\u00e9l\u00e8vement le "+expStr:"Actif")
            :(expStr?"Expire le "+expStr:"Actif");
          return(<div className="crd" style={{marginBottom:12,padding:"12px 14px",background:"linear-gradient(135deg,rgba(255,215,0,.08),rgba(var(--cx),.06))",border:"1px solid rgba(255,215,0,.2)",display:"flex",alignItems:"center",gap:12}}>
            <span style={{fontSize:22,flexShrink:0}}>{icon}</span>
            <div style={{flex:1,minWidth:0}}>
              <div className="out" style={{fontWeight:800,fontSize:13,color:"var(--gold)",whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{label}</div>
              <div style={{fontSize:10,color:"var(--t2)",marginTop:1,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{tagline}</div>
            </div>
            <button className="btn2" onClick={async function(){
              try{await openCustomerPortal();}catch(e){alert("Erreur : "+((e&&e.message)||"impossible d'ouvrir le portail."));}
            }} style={{flexShrink:0,fontSize:12,padding:"8px 12px",borderColor:"rgba(var(--cx),.25)",color:"var(--cyan)"}}>
              {"\uD83D\uDD27 G\u00e9rer"}
            </button>
          </div>);
        }
        return(<button className="btn1" onClick={function(){p.goUpgrade&&p.goUpgrade();}}
          style={{width:"100%",fontSize:14,padding:"13px 20px",marginBottom:12,background:"linear-gradient(135deg,#f0c850,#d4943a)",color:"#1a1610",fontWeight:700}}>
          {"\uD83C\uDFF0 Passer \u00e0 Arena Premium"}
        </button>);
      })()}

      {/* Privacy policy — placed after subscription block per UX request */}
      <button className="btn2" onClick={function(){setShowPrivacy(true);}}
        style={{fontSize:13,width:"100%",marginBottom:8,borderColor:"var(--bdr)",color:"var(--t2)"}}>
        {"🛡️ Politique de confidentialit\u00e9"}
      </button>

      {/* Gestion du compte — groups Email, Export, Delete, Reset into a sub-page */}
      <button className="btn2" onClick={function(){setView("account");}}
        style={{fontSize:13,width:"100%",marginBottom:8,borderColor:"rgba(var(--cx),.2)",color:"var(--cyan)",padding:"12px 16px"}}>
        {"\u2699\uFE0F Gestion du compte"}
      </button>

      {/* Logout — kept on main for quick access */}
      <button className="btn2" onClick={function(){if(confirm("Changer de profil ? Vos donn\u00e9es restent sauvegard\u00e9es. Tapez votre nom au prochain \u00e9cran pour vous reconnecter."))p.logout();}}
        style={{fontSize:13,width:"100%",marginBottom:8,borderColor:"rgba(var(--cx),.2)",color:"var(--cyan)"}}>
        {"\uD83D\uDD04 Changer de profil"}
      </button>

      {showPrivacy&&<div style={{position:"fixed",top:0,left:0,right:0,bottom:0,background:"var(--bg)",zIndex:9999,overflow:"auto"}}>
        <PrivacyPolicy onClose={function(){setShowPrivacy(false);}}/>
      </div>}
    </div>
  );
}

// ═══════════════════════════════════════════

// ═══════════════════════════════════════════
// MAIN APP
// ═══════════════════════════════════════════
export default function App(){
  var[u,sU]=useState(null);var[ld,sL]=useState(true);var[tab,sT]=useState("home");var[sp,sSP]=useState(null);var[spA,sSPA]=useState(null);var[xpt,sXpt]=useState(null);var[teacherMode,setTeacher]=useState(false);var[achToast,setAchToast]=useState(null);
  var[pendingChestCount,setPendingChestCount]=useState(0);var[chestModal,setChestModal]=useState(null);var[chestResult,setChestResult]=useState(null);var[chestPending,setChestPending]=useState([]);
  var[chestToastQueue,setChestToastQueue]=useState([]);var[activeChestToast,setActiveChestToast]=useState(null);var chestToastIdRef=useRef(0);
  var[showTip,setShowTip]=useState(false);
  useEffect(function(){
    if(!xpt||sp)return;
    var t=setTimeout(function(){sXpt(null);},4000);
    return function(){clearTimeout(t);};
  },[xpt,sp]);
  // ── Chest toast dispatcher: show next queued toast when conditions allow ──
  useEffect(function(){
    if(activeChestToast)return; // one toast at a time
    if(chestToastQueue.length===0)return;
    // Don't interrupt students mid-test
    var TEST_ROUTES=["boss","endless","mock1","mock2","mock3"];
    if(sp&&TEST_ROUTES.indexOf(sp)!==-1)return;
    // Don't stack on top of the chest opening modal
    if(chestModal)return;
    // Pop next from queue
    var next=chestToastQueue[0];
    setChestToastQueue(function(q){return q.slice(1);});
    setActiveChestToast(next);
  },[chestToastQueue,activeChestToast,sp,chestModal]);
  var[activeEvents,setActiveEvents]=useState([]);
  var[classMedianXp,setClassMedianXp]=useState(0);
  var[groupAccess,setGroupAccess]=useState(null); // null | {status:"ok"} | {status:"expired",name,endDate} | {status:"not_started",name,startDate}
  var[groupType,setGroupType]=useState("school"); // "school"|"pro"|"visitor" — default school = full access
  var[premiumPrompt,setPremiumPrompt]=useState(null);

useEffect(function(){
    var loaded=false;
    var sub=supabase.auth.onAuthStateChange(function(event,session){
      if(event==="TOKEN_REFRESHED"){return;} // Skip token refresh — state is already in memory
      if(session&&!loaded){
        loaded=true; // Prevent re-entry on rapid auth events (INITIAL_SESSION + SIGNED_IN + USER_UPDATED firing in sequence caused [LOAD] spam)
        load(session.user.id).then(function(d){
          if(d){
            var td=today(),yd=new Date();yd.setDate(yd.getDate()-1);var ys=yd.toISOString().split("T")[0];
            if(d.lastActive!==td&&d.lastActive!==ys)d.streak=0;
            // Week transition (load-time). Same logic as mid-session — delegates to
            // applyWeekTransition which also pushes the weekly_snapshots row.
            if(applyWeekTransition(d)){
              _syncDirty=true;
              saveLocal(d); // ensure localStorage reflects the transition so keepalive onUnload doesn't push stale data
            }
            if(!d.moduleScores)d.moduleScores={};
            if(!d.mission)d.mission={date:null,actId:null,done:false};
            if(!d.dailyModSessions)d.dailyModSessions={};
			if(!d.unlockedAch)d.unlockedAch=[];
			if(!d.avatar)d.avatar="⚔️";
			if(!d.theme)d.theme="dark";
            sU(d);
            // Load pending chests
            if(d.name)refreshPendingChests(d.name,d.classCode||"visitor");
            // Show daily tip if not disabled and not already shown today
            try{
              var tipDisabled=localStorage.getItem("toeic-tip-disabled")==="1";
              var tipDate=localStorage.getItem("toeic-tip-date");
              if(!tipDisabled&&tipDate!==today())setShowTip(true);
            }catch(e){}
          }
          sL(false);
        });
      }else if(!session){
        sL(false);
      }
    });
// Fallback: if no auth event fires within 3s, stop loading
    var fallback=setTimeout(function(){sL(false);},3000);
    return function(){sub.data.subscription.unsubscribe();clearTimeout(fallback);};
  },[]);

  // ── Phase 3 — Stripe checkout return handling ──
  // Catches ?checkout=success / ?checkout=cancel / ?portal=return URL params
  // when the user returns from Stripe. Shows a toast + cleans the URL.
  // The actual DB update happens via the webhook, so we just trigger a refetch
  // to pick up the new access_level from Supabase.
  useEffect(function(){
    try{
      var params=new URLSearchParams(window.location.search);
      var checkout=params.get("checkout");
      var portal=params.get("portal");
      var plan=params.get("plan");
      if(checkout==="success"){
        var label=plan==="pass3m"?"TOEIC Pass 3 mois":plan==="monthly"?"Premium Mensuel":"Premium";
        alert("\uD83C\uDF89 Bienvenue dans Arena "+label+" !\n\nTon acc\u00e8s Premium est en cours d'activation. Si tu ne le vois pas encore, reload l'app dans 10 secondes.");
        // Force refetch from Supabase to pick up new access_level
        if(_cachedUserId)setTimeout(function(){load(_cachedUserId).then(function(d){if(d)sU(d);});},1500);
      }else if(checkout==="cancel"){
        alert("Paiement annul\u00e9. Aucun pr\u00e9l\u00e8vement n'a \u00e9t\u00e9 effectu\u00e9.");
      }else if(portal==="return"){
        // Refresh state in case user changed subscription status in Stripe portal
        if(_cachedUserId)setTimeout(function(){load(_cachedUserId).then(function(d){if(d)sU(d);});},500);
      }
      // Clean up URL params so they don't retrigger on reload
      if(checkout||portal){
        var url=new URL(window.location.href);
        ["checkout","plan","portal"].forEach(function(k){url.searchParams.delete(k);});
        window.history.replaceState({},"",url.toString());
      }
    }catch(e){console.warn("[stripe] return handling error:",e);}
  },[]);

  // ── Phase 1 Magic Link — email sync on USER_UPDATED confirmation ──
  // Syncs students.email when Supabase confirms the email (email_confirmed_at set).
  // Runs on mount AND on future auth events to handle the magic link callback timing:
  // the callback event often fires BEFORE this useEffect mounts (during initial page
  // load after the redirect), so we also proactively read the current session on mount.
  useEffect(function(){
    if(!u)return;

    function syncEmailFromSession(session){
      if(!session||!session.user)return;
      if(!session.user.email)return;
      if(!session.user.email_confirmed_at)return;
      if(u.email===session.user.email)return; // already synced
      var newEmail=session.user.email;
      supabase.from('students')
        .update({email:newEmail})
        .ilike('name',u.name)
        .eq('class_code',u.classCode||'visitor')
        .select('id') // return affected rows so we can check the actual count
        .then(function(res){
          if(res.error){console.error('[auth] email sync failed:',res.error.message);return;}
          if(!res.data||res.data.length===0){
            // No students row matched — probably not yet written to DB (onboarding still in progress).
            // Don't claim "email linked" in local state, otherwise the Profile UI would show
            // "Compte sécurisé" while the DB has no record of it.
            console.warn('[auth] email confirmed but no students row to update yet for',u.name,'— waiting for next save');
            return;
          }
          var c=JSON.parse(JSON.stringify(u));c.email=newEmail;sU(c);
          console.log('[auth] email linked:',newEmail);
        });
    }

    // 1. Immediate check — catches the case where auth event fired before this mount
    //    (typical after magic link redirect: hash processed → event fires → u loads → this mounts)
    supabase.auth.getSession().then(function(res){
      if(res.data&&res.data.session)syncEmailFromSession(res.data.session);
    });

    // 2. Listen for future auth changes (re-confirmations, email updates, etc.)
    var sub=supabase.auth.onAuthStateChange(function(event,session){
      if(event==="TOKEN_REFRESHED"||event==="PASSWORD_RECOVERY")return;
      syncEmailFromSession(session);
    });
    return function(){try{sub.data.subscription.unsubscribe();}catch(e){}};
  },[u]);

  // ── Phase 1 Magic Link — background poll for mobile magic link confirmation ──
  // On mobile, clicking the link in Gmail often opens an external browser, not the PWA.
  // The server confirms the email but this session doesn't know — so we poll refreshSession()
  // which pulls fresh user data (incl. email_confirmed_at). syncEmailFromSession (above)
  // then fires via USER_UPDATED and writes students.email. Flag set by the 3 places that
  // trigger linkEmailToAnonymous: Onboard emailPrompt, Home banner, Profile security button.
  useEffect(function(){
    if(!u||u.email)return; // already secured
    var awaiting=false;
    try{awaiting=sessionStorage.getItem("awaitingEmailConfirm")==="1";}catch(e){}
    if(!awaiting)return;
    var cancel=pollEmailConfirmation(function(){
      try{sessionStorage.removeItem("awaitingEmailConfirm");}catch(e){}
      // syncEmailFromSession in the hook above will fire automatically via USER_UPDATED
    });
    return cancel;
  },[u]);
  
  // ── Load active events from Supabase (once + every 5 min) ──
  useEffect(function(){
    if(!u)return;
    function loadEvents(){
      var now=new Date().toISOString();
      supabase.from('events').select('*').eq('active',true).lte('start_at',now).gte('end_at',now)
        .then(function(res){
          var evts=(res.data||[]).filter(function(e){
            return e.class_code==='all'||e.class_code===(u.classCode||'visitor');
          });
          setActiveEvents(evts);
        });
      supabase.from('students').select('xp').eq('class_code',u.classCode||'visitor')
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

  // ── Check group access (start/end date) ──
  useEffect(function(){
    if(!u)return;
    // Teacher: synthetic class 'teacher-internal' not in groups table. Force school access
    // explicitly so groupType doesn't stay stuck on a previous profile's value (e.g. "visitor"
    // when switching from a visitor test profile back to Teacher).
    if(u.name==="Teacher"){setGroupType("school");setGroupAccess({status:"ok"});return;}
    var cc=u.classCode||'visitor';
    if(cc==="visitor"){setGroupType("visitor");setGroupAccess({status:"ok"});return;}
    supabase.from('groups').select('start_date,end_date,name,type').eq('code',cc).maybeSingle()
      .then(function(res){
        if(!res.data){setGroupType("school");setGroupAccess({status:"ok"});return;}
        var g=res.data;
        setGroupType(g.type||"school");
        var now=new Date();now.setHours(0,0,0,0);
        if(g.end_date){var ed=new Date(g.end_date+"T23:59:59");if(ed<now){setGroupAccess({status:"expired",name:g.name||cc,endDate:g.end_date});return;}}
        if(g.start_date){var sd=new Date(g.start_date+"T00:00:00");if(sd>now){setGroupAccess({status:"not_started",name:g.name||cc,startDate:g.start_date});return;}}
        setGroupAccess({status:"ok"});
      });
  },[u&&u.classCode]);

  // ── Auto-start Home BGM on first user interaction ──
  var bgmStarted=useRef(false);
  useEffect(function(){
    if(ld||!u||bgmStarted.current)return;
    function startBGM(){bgmStarted.current=true;if(tab==="home"&&!sp)playBGM("bgm_home");document.removeEventListener("click",startBGM);document.removeEventListener("touchstart",startBGM);}
    document.addEventListener("click",startBGM,{once:true});
    document.addEventListener("touchstart",startBGM,{once:true});
    return function(){document.removeEventListener("click",startBGM);document.removeEventListener("touchstart",startBGM);};
  },[ld]);

  // ── Centralized BGM control: silence audio routes, restore home BGM on return ──
  useEffect(function(){
    if(ld||!u||!bgmStarted.current)return;
    var AUDIO_ROUTES=["lis","lisP1","lisP2","lisP3","lisP4","ablitz"];
    // Routes that manage their own BGM (do not interfere):
    var SELF_MANAGED=["boss","endless","matchE","wfall","duel","sbuild","clue","tavern","gauntlet"];
    if(sp&&AUDIO_ROUTES.indexOf(sp)!==-1){stopBGM();return;}
    if(sp&&SELF_MANAGED.indexOf(sp)!==-1)return;
    // No subpage active and on a home-BGM tab → ensure bgm_home is playing
    if(!sp&&(tab==="home"||tab==="league"||tab==="profile"))playBGM("bgm_home");
  },[sp,tab]);

  // ── Time tracking (60s) + Cloud sync (every 2 min) + beforeunload ──
  var timeRef=useRef({ticks:0});
  useEffect(function(){
    if(!u)return;
    var iv=setInterval(function(){
      sU(function(prev){
        if(!prev)return prev;
        var c=JSON.parse(JSON.stringify(prev));
        c.totalTime=(c.totalTime||0)+60;
        // Intra-session week transition: handles tabs kept open across week boundaries
        // (common on mobile PWAs). Without this, weekly_xp would accumulate across weeks
        // and week_id would stay stale until next full page load.
        var weekChanged=applyWeekTransition(c);
        if(weekChanged){console.warn("[WEEK] transition detected mid-session —",c.weekId);_syncDirty=true;}
        saveLocal(c);
        timeRef.current.ticks+=1;
        // Sync to cloud every 2 min — ONLY if tab is visible (prevents overwriting other devices)
        // Also sync immediately if the week just changed (so leaderboard reflects it ASAP)
        if((weekChanged||(timeRef.current.ticks%2===0))&&document.visibilityState==="visible")syncToCloud(c);
        return c;
      });
    },60000);
    // Sync on tab hide (mobile: switching apps) + reload from cloud on tab show
    function onVis(){
      if(document.visibilityState==="hidden"){
        sU(function(prev){
          if(!prev)return prev;
          var c=JSON.parse(JSON.stringify(prev));
          if(applyWeekTransition(c))_syncDirty=true;
          saveLocal(c);
          syncToCloud(c);
          return c;
        });
      }else if(document.visibilityState==="visible"){
        // Tab became visible — reload from Supabase in case another device updated
        if(_cachedUserId){
          load(_cachedUserId).then(function(d){
            if(d){sU(d);console.warn("[SYNC] Reloaded from Supabase on tab focus");}
          });
        }
      }
    }
    // Last-chance sync on page close — UPDATE by (name, class_code), no PK mutation
    function onUnload(){
      try{
        var raw=localStorage.getItem("toeic-arena-profile");
        if(raw&&_syncDirty){
          var d=JSON.parse(raw);
          // Apply week transition in case the tab stayed open past a week boundary and
          // the 60s loop didn't fire before close. Mutates d in place.
          applyWeekTransition(d);
          var cc=d.classCode||"visitor";
          var payload={
            xp:d.xp,weekly_xp:d.weeklyXp,week_id:d.weekId,
            streak:d.streak,last_active:d.lastActive,
            card_states:d.cardStates,daily_challenge:d.daily,
            stats:d.stats,module_scores:d.moduleScores,
            mock_results:d.mockResults,game_scores:d.gameScores,
            mission:d.mission,avatar:d.avatar||"⚔️",theme:d.theme||"dark",
            skin_id:d.equippedSkin||null,
            unlocked_ach:d.unlockedAch||[],total_time:d.totalTime||0,
            weekly_history:d.weeklyHistory||[],
            daily_mod_sessions:d.dailyModSessions||{},
            weekly_daily_count:d.weeklyDailyCount||0,
            battle_scan:d.battleScan||null,
            tips_shown:d.tipsShown||[],
            daily_seen:d.dailySeen||[],
            gdpr_consent:d.gdprConsent||null,
          };
          // fetch keepalive with PATCH (=UPDATE) — survives tab close, sends auth headers
          try{var _anonKey=import.meta.env.VITE_SUPABASE_ANON_KEY;fetch(import.meta.env.VITE_SUPABASE_URL+"/rest/v1/students?name=ilike."+encodeURIComponent(d.name)+"&class_code=eq."+encodeURIComponent(cc),{
            method:"PATCH",keepalive:true,
            headers:{
              "Content-Type":"application/json",
              "Prefer":"return=minimal",
              "apikey":_anonKey,
              "Authorization":"Bearer "+_anonKey
            },
            body:JSON.stringify(payload)
          });}catch(e){}
        }
      }catch(e){}
    }
    document.addEventListener("visibilitychange",onVis);
    window.addEventListener("beforeunload",onUnload);
    return function(){clearInterval(iv);document.removeEventListener("visibilitychange",onVis);window.removeEventListener("beforeunload",onUnload);};
  },[!!u]);

// ─── CHEST SYSTEM ───
  // Fire-and-forget: grant a unique chest (checks Supabase for duplicates)
  function enqueueChestToast(trigger,chestType){
    var id=++chestToastIdRef.current;
    setChestToastQueue(function(q){return q.concat([{id:id,trigger:trigger,chestType:chestType}]);});
  }
  function grantChestLocal(trigger,chestType){
    if(!u||!u.name)return;
    var un=u.name,cc=u.classCode||"visitor";
    hasUniqueTrigger(un,cc,trigger).then(function(done){
      if(!done){grantChest(un,cc,chestType,trigger).then(function(){refreshPendingChests(un,cc);enqueueChestToast(trigger,chestType);}).catch(function(e){console.error("[CHEST] grant error:",e);});}
    }).catch(function(e){console.error("[CHEST] uniqueTrigger check error:",e);});
  }
  // Fire-and-forget: grant a weekly chest (7-day cooldown per trigger)
  function grantWeeklyChest(trigger,chestType){
    if(!u||!u.name)return;
    var un=u.name,cc=u.classCode||"visitor";
    isWeeklyCooldown(un,cc,trigger).then(function(onCd){
      if(!onCd){grantChest(un,cc,chestType,trigger).then(function(){refreshPendingChests(un,cc);enqueueChestToast(trigger,chestType);}).catch(function(e){console.error("[CHEST] grant error:",e);});}
    }).catch(function(e){console.error("[CHEST] cooldown check error:",e);});
  }
  async function refreshPendingChests(un,cc){
    var list=await getPendingChests(un,cc);
    setChestPending(list);setPendingChestCount(list.length);
  }
  async function doOpenChest(){
    if(chestPending.length===0)return;
    var chest=chestPending[0];
    var rewards=await getOwnedRewards(chest.user_name,chest.class_code);
    var ownA=rewards.filter(function(r){return r.reward_type==="avatar";}).map(function(r){return r.reward_id;});
    var ownS=rewards.filter(function(r){return r.reward_type==="skin";}).map(function(r){return r.reward_id;});
    var pity=(u&&u.gameScores?u.gameScores.pityCount:0)||0;
    var result=await openChestFromPending(chest,pity,ownA,ownS);
    // Update pity in user profile
    var c=JSON.parse(JSON.stringify(u));
    if(!c.gameScores)c.gameScores={};
    c.gameScores.pityCount=result.newPityCount;
    // If XP reward, add it (bypasses gates — it's a reward, not a module)
    if(result.reward.type==="xp"&&result.xpAmount>0){
      c.xp+=result.xpAmount;c.weeklyXp+=result.xpAmount;
    }
    sv(c);
    setChestResult(result);haptic("chestOpen");
    // Refresh pending list
    var remaining=chestPending.slice(1);
    setChestPending(remaining);setPendingChestCount(remaining.length);
  }

function sv(d){
    // Check for new achievements
    if(d&&d.unlockedAch){
      ACHIEVEMENTS.forEach(function(a){
        if(a.check(d)&&d.unlockedAch.indexOf(a.id)===-1){
          d.unlockedAch.push(a.id);
          try{playJingleAchieve();}catch(e){}haptic("achieve");
          setAchToast({name:a.name,icon:a.icon,desc:a.desc});
          setTimeout(function(){setAchToast(null);},3500);
          // Coffre légendaire pour les achievements rares
          if(LEGENDARY_ACHIEVEMENTS.indexOf(a.id)!==-1){
            grantChestLocal("ach_legendary_"+a.id,"legendaire");
          } else if(EPIC_ACHIEVEMENTS.indexOf(a.id)!==-1){
            // Coffre guerrier pour les perfect runs du Gauntlet (ceremonial, one-time)
            grantChestLocal("ach_epic_"+a.id,"guerrier");
          } else if(NOVICE_ACHIEVEMENTS.indexOf(a.id)!==-1){
            // Coffre novice pour les découvertes (première session d'un sous-module)
            grantChestLocal("ach_novice_"+a.id,"novice");
          }
        }
      });
    }
    sU(d);
    saveLocal(d);
    save(d);
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
      // Flashcards : 100% / 60% / 30% / 0%
      // Mock Tests  : 100% / 40% / 0%
      // Autres      : 100% / 50% / 15% / 0%
      var farmMult;
      if(modId==="csess"){
        farmMult=sessionCount===0?1:sessionCount===1?0.60:sessionCount===2?0.30:0;
      } else if(modId==="mock1"||modId==="mock2"||modId==="mock3"){
        farmMult=sessionCount===0?1:sessionCount===1?0.40:0;
      } else {
        farmMult=sessionCount===0?1:sessionCount===1?0.5:sessionCount===2?0.15:0;
      }
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

      // Event multipliers
      if(activeEvents&&activeEvents.length>0){
        activeEvents.forEach(function(ev){
          var cfg=ev.config||{};var m=cfg.multiplier||2;
          if(ev.type==="flash_hour"){mult*=m;bonuses.push({label:"⚡ Flash Hour x"+m,color:"#f0c850"});}
          if(ev.type==="underdog"&&c.xp<classMedianXp){mult*=m;bonuses.push({label:"💪 Underdog x"+m,color:"#4abe60"});}
        });
      }


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
    if(newLeague.id!==prevLeague.id&&c.weeklyXp>prevLeague.min){try{playJingleLeague();}catch(e){}haptic("league");}
    // ── Level up detection ──
    if(amt>0){var _pl=getLevel(c.xp-amt).level,_nl=getLevel(c.xp).level;if(_nl>_pl){try{playLevelUp();}catch(e){}haptic("levelUp");}}
    var toastInfo={total:amt,base:baseAmt,bonuses:bonuses};
    sXpt(toastInfo);

    // ── Coffres : paliers XP ──
    if(amt>0){
      var prevXp=c.xp-amt;
      var xpMilestones=[[1000,"novice"],[3000,"novice"],[5000,"novice"],[10000,"guerrier"],[20000,"guerrier"],[30000,"champion"],[50000,"champion"]];
      xpMilestones.forEach(function(m){
        if(prevXp<m[0]&&c.xp>=m[0])grantChestLocal("xp_"+(m[0]>=1000?(m[0]/1000)+"k":m[0]),m[1]);
      });
    }
    // ── Coffres : streaks ──
    if(isFirstToday){
      if(c.streak===7){grantChestLocal("streak_7","novice");haptic("streak");}
      if(c.streak===30){grantChestLocal("streak_30","guerrier");haptic("streak");}
      if(c.streak===100){grantChestLocal("streak_100","champion");haptic("streak");}
    }
    // ── Coffres : passage de league ──
    if(newLeague.id!==prevLeague.id&&c.weeklyXp>prevLeague.min){
      grantChestLocal("league_up_"+newLeague.id,"guerrier");
    }

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
  function nav(pg,arg){stopBGM();sSP(pg);sSPA(arg||null);}
  async function onboard(name,classCode,bsScores,bsCorrect,firstNav){
    classCode=classCode||'visitor';
    // Check if student already exists (use limit(1) — safe even with duplicates)
    // Check for existing student (accent + case insensitive)
    var norm=normalizeName(name);
    var allInClass=await supabase.from('students').select('*').eq('class_code',classCode);
    var existingMatch=(allInClass.data||[]).filter(function(s){return normalizeName(s.name)===norm;});
    existingMatch.sort(function(a,b){return(b.xp||0)-(a.xp||0);});
    var existing={data:existingMatch.length>0?existingMatch:null};
    if(existing.data&&existing.data.length>0){
      // Student exists — recover using the DB-stored name (preserves original casing)
      var recovered=await recover(existing.data[0].name,classCode);
      if(recovered)return;
    }

    // Get or create auth session
    try{
        var sess=await supabase.auth.getSession();
        if(!sess.data.session){
          await supabase.auth.signInAnonymously();
        }
      }catch(authErr){/* ignore lock errors — session may already exist */}

    var u=fresh(name,classCode);
    u.gdprConsent=today();
    if(bsScores){
      // Battle Scan is a diagnostic placement test — results live in u.battleScan only.
      // Do NOT populate u.moduleScores with scan answers (would falsely trigger "Explorer"
      // achievement and inflate module stats before any real training).
      var totalSc=bsScores.grammar+bsScores.vocab+bsScores.reading+bsScores.listening;
      var tierLabel=totalSc>=16?"Battle-Ready":totalSc>=12?"Skilled Fighter":totalSc>=8?"Apprentice":"Recruit";
      u.battleScan={date:today(),scores:bsScores,total:totalSc,tier:tierLabel};
    }
    sU(u);
    saveLocal(u);
    // Initial sync to create the row in Supabase
    _syncDirty=true;
    syncToCloud(u);
    if(firstNav){setTimeout(function(){sSP(firstNav);},300);}
  }
  async function recover(name,classCode){
    // Find the best row (highest XP) for this student
    // Accent + case insensitive lookup
    var rnorm=normalizeName(name);
    var rAll=await supabase.from('students').select('*').eq('class_code',classCode);
    var rMatches=(rAll.data||[]).filter(function(s){return normalizeName(s.name)===rnorm;});
    rMatches.sort(function(a,b){return(b.xp||0)-(a.xp||0);});
    if(rMatches.length===0)return false;
    var res={data:rMatches};
    var d=res.data[0];

    // Get or create auth session
    var sess=await supabase.auth.getSession();
    var userId=sess.data.session?sess.data.session.user.id:null;
    if(!userId){
      var authRes=await supabase.auth.signInAnonymously();
      if(!authRes.data.user)return false;
      userId=authRes.data.user.id;
    }

    // id rebinding removed: previously we tried to UPDATE students.id = currentAuthUid so
    // load()'s fallback-by-id would find the row. This caused 409 conflicts on multi-profile
    // devices (same auth user recovering different students — each UPDATE hit the PK unique
    // constraint). Since the INSERT policy was relaxed (no more id = auth.uid() requirement)
    // and primary lookup uses (name, class_code) from localStorage, id rebinding is obsolete.
    _cachedUserId=userId;

    try { localStorage.setItem('toeic-arena-name', name); } catch(e) {}
    try { localStorage.setItem('toeic-arena-class', classCode); } catch(e) {}
    var u=supaToLocal(d);
    sU(u);
    saveLocal(u);
    return true;
  }
 
  function goTeacher(){setTeacher(true);}

  function bossDone(result,xp){var gxp=applyXpGates(xp,result.score,result.total,"boss");var c=addXp(gxp);c.stats.totalQ+=result.total;c.stats.correct+=result.score;c.stats.sessions+=1;if(!c.mockResults)c.mockResults={};var prev=c.mockResults.boss;if(!prev||result.toeicEstimate>=prev.toeicEstimate){c.mockResults.boss=result;}else{c.mockResults.boss=Object.assign({},prev,{date:result.date});}trackModSession(c,"boss");recordModule(c,"boss",result.score,result.total);try{if(result.total>0&&result.score/result.total>=0.7)playJingleMock();else playJingleMockOk();}catch(e){}sv(c);sSP(null);sT("train");}
  function endlessDone(result,xp,meta){
    var c=addXp(xp);
    c.stats.totalQ+=result.total;c.stats.correct+=result.score;c.stats.sessions+=1;
    if(!c.mockResults)c.mockResults={};
    var prev=c.mockResults.endless||{attempts:0,best:0,bestDate:null,lastAttempt:null,history:[]};
    var newBest=result.toeicEstimate>prev.best?result.toeicEstimate:prev.best;
    var newBestDate=result.toeicEstimate>prev.best?Date.now():prev.bestDate;
    c.mockResults.endless={
      attempts:meta.attempts,
      best:newBest,
      bestDate:newBestDate,
      lastAttempt:Date.now(),
      history:meta.history.slice(-50)
    };
    trackModSession(c,"endless");recordModule(c,"endless",result.score,result.total);
    try{if(result.toeicEstimate>=800)playJingleMock();else playJingleMockOk();}catch(e){}haptic("complete");
    sv(c);sSP(null);sT("train");
  }
  function mockDone(result,xp){
    var modId="mock"+result.mockId;
    var timeGateOk=(result.timeUsed||0)>=300;
    var gxp=timeGateOk?applyXpGates(xp,result.score,result.total,modId):0;
    var c=addXp(gxp);
    c.stats.totalQ+=result.total;c.stats.correct+=result.score;c.stats.sessions+=1;
    if(!c.mockResults)c.mockResults={};
    c.mockResults["mock"+result.mockId]=result;
    trackModSession(c,modId);
    recordModule(c,modId,result.score,result.total);
    try{if(result.total>0&&result.score/result.total>=0.7)playJingleMock();else playJingleMockOk();}catch(e){}haptic("complete");
    // Coffres : Mock Tests + Boss Test
    if(result.mockId==="1"||result.mockId===1)grantChestLocal("mock_1","champion");
    if(result.mockId==="2"||result.mockId===2)grantChestLocal("mock_2","champion");
    if(result.mockId==="3"||result.mockId===3)grantChestLocal("mock_3","champion");
    if(result.mockId==="boss")grantChestLocal("boss_test","legendaire");
    sv(c);sSP(null);sT("train");
  }
  function gameDone(modeKey,result,xp){
    // Score-based games (WordFall, SpeedMatch, Duel) have no meaningful accuracy
    // Pass sc=tot=1 to skip accuracy gate; only diminishing returns apply
    var hasAccuracy=result.correct!==undefined&&result.total!==undefined;
    var sc=hasAccuracy?result.correct:1;var tot=hasAccuracy?result.total:1;
    var gxp=applyXpGates(xp,sc,tot,"game_"+modeKey);var c=addXp(gxp);if(!c.gameScores)c.gameScores={};
    if(modeKey==="duel"){
      // Accumulate duel stats instead of overwriting
      var prev=c.gameScores.duel||{wins:0,played:0,wagerWon:0};
      c.gameScores.duel={wins:prev.wins+(result.won?1:0),played:prev.played+1,wagerWon:(prev.wagerWon||0)+(result.wagerWon||0)};
      // Chest triggers: duel win + 3 consecutive wins
      if(result.won){grantWeeklyChest("duel_win","guerrier");
        if(result.winStreak>=3)grantWeeklyChest("duel_win3","champion");}
    } else {
      var prev2=c.gameScores[modeKey];var dominated=!prev2||(result.time!==undefined?result.time<prev2.time:(result.score>prev2.score||(result.score===prev2.score&&result.maxCombo>(prev2.maxCombo||0))));if(dominated){c.gameScores[modeKey]=result;}else if(prev2&&result.maxCombo!==undefined&&result.maxCombo>(prev2.maxCombo||0)){c.gameScores[modeKey]=Object.assign({},prev2,{maxCombo:result.maxCombo});}
      // Chest triggers: WordFall combos
      if(modeKey==="wordFall"&&result.maxCombo){
        if(result.maxCombo>=30)grantWeeklyChest("wfall_combo30","champion");
        else if(result.maxCombo>=20)grantWeeklyChest("wfall_combo20","guerrier");
        else if(result.maxCombo>=10)grantWeeklyChest("wfall_combo10","novice");
      }
      // SpeedMatch
      if(modeKey==="matchEasy"&&result.time){var starsE=result.time<24?3:result.time<42?2:1;if(starsE>=2)grantWeeklyChest("smatch_easy_good","novice");}
    }
    c.stats.sessions+=1;trackModSession(c,"game_"+modeKey);sv(c);sSP(null);sT("games");}
  function trackModSession(c,modId){if(!c.dailyModSessions)c.dailyModSessions={};var key=modId+"_"+today();c.dailyModSessions[key]=(c.dailyModSessions[key]||0)+1;}
  function dailyDone(sc,xp){var gxp=applyXpGates(xp,sc,5,"daily");var c=addXp(gxp);c.daily={date:today(),done:true,score:sc,xpE:gxp};c.weeklyDailyCount=(c.weeklyDailyCount||0)+1;c.stats.totalQ+=5;c.stats.correct+=sc;c.stats.sessions+=1;if(sc===5)c.stats.perfects=(c.stats.perfects||0)+1;trackModSession(c,"daily");recordModule(c,"daily",sc,5);checkMission(c,"daily");try{playJingleDaily();}catch(e){}
    // Track seen questions for anti-repetition
    if(!c.dailySeen)c.dailySeen=[];
    var todayQsArr=dailyQs(today(),c);
    todayQsArr.forEach(function(q){c.dailySeen.push({id:q.id,date:today()});});
    // Prune entries older than 45 days
    var pruneDate=new Date();pruneDate.setDate(pruneDate.getDate()-45);var pruneStr=pruneDate.toISOString().slice(0,10);
    c.dailySeen=c.dailySeen.filter(function(entry){return entry.date>=pruneStr;});
    sv(c);}
  function drillDone(sc,tot,xp){var gxp=applyXpGates(xp,sc,tot,"drill");var c=addXp(gxp);c.stats.totalQ+=tot;c.stats.correct+=sc;c.stats.sessions+=1;c.stats.drills=(c.stats.drills||0)+1;trackModSession(c,"drill");recordModule(c,"drill",sc,tot);checkMission(c,"drill");sv(c);}
  function miniDone(sc,tot,xp){var modId=sp||"unknown";var gxp=applyXpGates(xp,sc,tot,modId);gxp=Math.round(gxp*getSpotlightMult(modId));var c=addXp(gxp);c.stats.totalQ+=tot;c.stats.correct+=sc;c.stats.sessions+=1;trackModSession(c,modId);recordModule(c,modId,sc,tot);checkMission(c,modId);sv(c);}
  function rateCard(id,r){var c=JSON.parse(JSON.stringify(u));var ex=c.cardStates[id]||{ease:2.5,interval:0,nextReview:today(),correct:0,total:0};c.cardStates[id]=srsUp(ex,r);c.stats.cardsRev=(c.stats.cardsRev||0)+1;sv(c);}
  function cardsDone(xp,ok,tot){
    // XP arrives already gated (CardSession applies diminishing returns locally)
    // Flashcard accuracy is SRS self-eval, not performance — no accuracy gate needed
    var c=addXp(xp);
    c.stats.sessions+=1;
    trackModSession(c,"csess");
    recordModule(c,"csess",ok||0,tot||1);
    checkMission(c,"csess");
    sv(c);sSP(null);
  }
  async function logout(){
    // Soft logout: clears local profile identity but KEEPS the Supabase session alive.
    // Rationale: the anon auth session is what grants RLS access to students lookup;
    // signing out forces a fresh anon user on next login, which breaks the "Welcome back"
    // path (lookupName returns empty → user re-goes through full onboarding incl. Battle Scan).
    // To fully destroy the session use deleteAccount instead.
    try{localStorage.removeItem("toeic-arena-profile");localStorage.removeItem("toeic-arena-name");localStorage.removeItem("toeic-arena-class");}catch(e){}
    _cachedUserId=null;_syncDirty=false;
    sU(null);sSP(null);sT("home");
  }

  async function deleteAccount(){
    var sess=await supabase.auth.getSession();
    var uid=sess.data.session?sess.data.session.user.id:null;
    if(uid){
      // Delete all user data across all tables
      await supabase.from('weekly_snapshots').delete().eq('user_id',uid);
      await supabase.from('push_subscriptions').delete().eq('student_name',u.name).eq('class_code',u.classCode);
      await supabase.from('students').delete().eq('id',uid);
      try{await supabase.auth.signOut();}catch(e){}
    }
    try{localStorage.removeItem("toeic-arena-profile");localStorage.removeItem("toeic-arena-name");localStorage.removeItem("toeic-arena-class");}catch(e){}
    _cachedUserId=null;_syncDirty=false;
    sU(null);sSP(null);sT("home");
  }
  async function reset(){
    var sess=await supabase.auth.getSession();
    var uid=sess.data.session?sess.data.session.user.id:null;
    if(uid){
      await supabase.from('weekly_snapshots').delete().eq('user_id',uid);
      await supabase.from('push_subscriptions').delete().eq('student_name',u.name).eq('class_code',u.classCode);
      await supabase.from('students').delete().eq('id',uid);
      try{await supabase.auth.signOut();}catch(e){}
    }
    try{localStorage.removeItem("toeic-arena-profile");localStorage.removeItem("toeic-arena-name");localStorage.removeItem("toeic-arena-class");}catch(e){}
    _cachedUserId=null;_syncDirty=false;
    sU(null);sSP(null);sT("home");
  }

  var lc="app"+(u&&u.theme==="light"?" light":"")+(u&&u.equippedSkin?" skin-"+u.equippedSkin:"");
  var isExpiredGroup=groupAccess&&groupAccess.status==="expired";
  var expBlocked=isExpiredGroup?["home","train","cards","games"]:[];
  var tabGo=function(t){if(expBlocked.indexOf(t)!==-1)return;if(teacherMode)setTeacher(false);if(t==="home"||t==="league"||t==="profile")playBGM("bgm_home");else stopBGM();sT(t);sSP(null);sSPA(null);};
  // Premium prompt overlay — rendered by both pg() sub-pages AND the main tab render path,
  // otherwise clicking a locked module inside a sub-page (Listen/Read hub, etc.) would set
  // the state but the popup wouldn't appear until the user navigated away.
  var premiumOverlay=premiumPrompt&&<div style={{position:"fixed",inset:0,background:"rgba(0,0,0,.75)",zIndex:9999,display:"flex",alignItems:"center",justifyContent:"center",padding:24}} onClick={function(){setPremiumPrompt(null);}}>
    <div style={{background:"var(--bg2)",borderRadius:20,padding:28,maxWidth:360,textAlign:"center",animation:"fadeIn .3s",border:"1px solid rgba(255,215,0,.25)",boxShadow:"0 0 40px rgba(255,215,0,.15)"}} onClick={function(e){e.stopPropagation();}}>
      <div style={{fontSize:56,marginBottom:12}}>{"\uD83C\uDFF0"}</div>
      <h3 className="out" style={{fontWeight:800,fontSize:22,marginBottom:6,color:"var(--gold)"}}>Arena Premium</h3>
      <p style={{color:"var(--t2)",fontSize:13,lineHeight:1.6,marginBottom:18}}>
        <strong style={{color:"var(--t1)"}}>{premiumPrompt}</strong>{" fait partie des modules Premium."}
      </p>
      <div style={{fontSize:12,color:"var(--t2)",lineHeight:1.7,marginBottom:20,textAlign:"left",background:"rgba(255,215,0,.04)",border:"1px solid rgba(255,215,0,.12)",borderRadius:10,padding:"12px 14px"}}>
        <div>{"\u2713 Tous les modules Premium d\u00e9bloqu\u00e9s"}</div>
        <div>{"\u2713 Boss Test + Endless Arena"}</div>
        <div>{"\u2713 Tests blancs 1, 2, 3"}</div>
        <div>{"\u2713 390 flashcards m\u00e9tiers"}</div>
      </div>
      <button className="btn1" onClick={function(){setPremiumPrompt(null);sSP("upgrade");}}
        style={{width:"100%",fontSize:14,padding:"13px 20px",marginBottom:8,background:"linear-gradient(135deg,#f0c850,#d4943a)",color:"#1a1610",fontWeight:700}}>
        {"\uD83C\uDFAF Voir les offres"}
      </button>
      <button className="btn2" onClick={function(){setPremiumPrompt(null);}}
        style={{width:"100%",fontSize:12,padding:"10px 16px",borderColor:"var(--bdr)",color:"var(--t3)"}}>
        {"Plus tard"}
      </button>
    </div>
  </div>;
  function pg(content){return(<div className={lc}><style>{CSS}</style>{xpt&&<XpToast v={xpt}/>}{achToast&&<AchToast v={achToast}/>}<div className="pg-wrap">{content}</div><Tabs cur={tab} go={tabGo} blocked={expBlocked}/>{premiumOverlay}</div>);}

  if(ld)return(<div className={lc+" onboard-shell"}><style>{CSS}</style><div style={{display:"flex",alignItems:"center",justifyContent:"center",minHeight:"100vh"}}><div style={{textAlign:"center"}}><div style={{fontSize:48,animation:"pulse 1.5s infinite"}}>⚔️</div><p className="out" style={{color:"var(--t2)",marginTop:12}}>Loading Arena...</p></div></div></div>);
  if(teacherMode)return pg(<TeacherDash back={function(){setTeacher(false);}}/>);
  if(!u)return(<div className={lc+" onboard-shell"}><style>{CSS}</style><Onboard go={onboard} goTeacher={goTeacher} recover={recover}/></div>);

  // ── Group access control ──
  if(groupAccess&&groupAccess.status==="not_started")return(<div className={lc}><style>{CSS}</style>
    <div style={{display:"flex",alignItems:"center",justifyContent:"center",minHeight:"100vh",padding:32,textAlign:"center"}}>
      <div style={{animation:"fadeIn .5s",maxWidth:360}}>
        <div style={{fontSize:56,marginBottom:16}}>{"\uD83D\uDD12"}</div>
        <h2 className="out" style={{fontWeight:800,fontSize:22,marginBottom:12}}>{"Ar\u00e8ne ferm\u00e9e"}</h2>
        <p style={{color:"var(--t2)",fontSize:14,lineHeight:1.6}}>{"L\u0027Ar\u00e8ne n\u0027est pas encore ouverte pour "}<strong style={{color:"var(--t1)"}}>{groupAccess.name}</strong>{"."}</p>
        <p style={{color:"var(--cyan)",fontSize:15,fontWeight:700,marginTop:12}}>{"Ouverture le "}{groupAccess.startDate}</p>
      </div>
    </div>
  </div>);
  // If expired and on a blocked tab, force to league or profile
  if(isExpiredGroup&&(tab==="home"||tab==="train"||tab==="cards"||tab==="games")){sT("league");}
  // If expired, block module navigation
  if(isExpiredGroup&&sp)return(<div className={lc}><style>{CSS}</style>
    <div style={{display:"flex",alignItems:"center",justifyContent:"center",minHeight:"100vh",padding:32,textAlign:"center"}}>
      <div style={{animation:"fadeIn .5s",maxWidth:360}}>
        <div style={{fontSize:56,marginBottom:16}}>{"\u23F0"}</div>
        <h2 className="out" style={{fontWeight:800,fontSize:22,marginBottom:12}}>{"Acc\u00e8s expir\u00e9"}</h2>
        <p style={{color:"var(--t2)",fontSize:14,lineHeight:1.6}}>{"L\u0027acc\u00e8s \u00e0 l\u0027Ar\u00e8ne pour "}<strong style={{color:"var(--t1)"}}>{groupAccess.name}</strong>{" a expir\u00e9 le "}{groupAccess.endDate}{"."}</p>
        <button className="btn2" onClick={function(){sSP(null);sT("league");}} style={{marginTop:20}}>{"\u2190"} Retour</button>
      </div>
    </div>
  </div>);

  if(sp==="daily")return pg(<Daily u={u} done={dailyDone} gate={function(xp,sc,tot){return applyXpGates(xp,sc,tot,"daily");}} back={function(){sSP(null);}}/>);
  if(sp==="csess")return pg(<CardSess u={u} domId={spA} rate={rateCard} done={cardsDone} back={function(){sSP(null);sSPA(1);sT("train");}}/>);
  if(sp==="cdom")return pg(<CardSess u={u} domId={spA} rate={rateCard} done={cardsDone} back={function(){sSP(null);}}/>);
  if(sp==="drill")return pg(<Drill u={u} done={drillDone} gate={function(xp,sc,tot){return applyXpGates(xp,sc,tot,"drill");}} back={function(){sSP(null);sSPA(0);sT("train");}}/>);
  if(sp==="wordfam")return pg(<WordFam u={u} done={miniDone} gate={function(xp,sc,tot){return applyXpGates(xp,sc,tot,"wordfam");}} back={function(){sSP(null);sSPA(1);sT("train");}}/>);
  if(sp==="connsort")return pg(<ConnSort u={u} done={miniDone} gate={function(xp,sc,tot){return applyXpGates(xp,sc,tot,"connsort");}} back={function(){sSP(null);sSPA(1);sT("train");}}/>);
  if(sp==="prepdrill")return pg(<PrepDrill u={u} done={miniDone} gate={function(xp,sc,tot){return applyXpGates(xp,sc,tot,"prepdrill");}} back={function(){sSP(null);sSPA(1);sT("train");}}/>);
  if(sp==="gerinf")return pg(<GerInf u={u} done={miniDone} gate={function(xp,sc,tot){return applyXpGates(xp,sc,tot,"gerinf");}} back={function(){sSP(null);sSPA(1);sT("train");}}/>);
  if(sp==="traps")return pg(<TrapsQuiz u={u} done={miniDone} gate={function(xp,sc,tot){return applyXpGates(xp,sc,tot,"traps");}} back={function(){sSP(null);sSPA(3);sT("train");}}/>);
  if(sp==="falsefr")return pg(<FalseFriends u={u} done={miniDone} gate={function(xp,sc,tot){return applyXpGates(xp,sc,tot,"falsefr");}} back={function(){sSP(null);sSPA(1);sT("train");}}/>);
  if(sp==="pvdojo")return pg(<PhrasalDojo u={u} done={miniDone} gate={function(xp,sc,tot){return applyXpGates(xp,sc,tot,"pvdojo");}} back={function(){sSP(null);sSPA(1);sT("train");}}/>);
  if(sp==="gauntlet")return pg(<GauntletHub u={u} nav={nav} onModuleDone={function(subId,sc,tot,xp){var fullModId="gauntlet_"+subId;var gxp=applyXpGates(xp,sc,tot,fullModId);gxp=Math.round(gxp*getSpotlightMult(fullModId));var c=addXp(gxp);c.stats.totalQ+=tot;c.stats.correct+=sc;c.stats.sessions+=1;trackModSession(c,fullModId);recordModule(c,fullModId,sc,tot);checkMission(c,fullModId);if(sc===tot&&tot>0)grantWeeklyChest(fullModId+"_perfect","guerrier");sv(c);}} back={function(){stopBGM();sSP(null);sSPA(1);sT("train");}}/>);
  if(sp==="mock1")return pg(<MockTest mockId={1} u={u} done={mockDone} back={function(){sSP(null);sSPA("mocks");sT("train");}}/>);
  if(sp==="mock2")return pg(<MockTest mockId={2} u={u} done={mockDone} back={function(){sSP(null);sSPA("mocks");sT("train");}}/>);

  if(sp==="boss"){playBGM("bgm_final");return pg(<BossTest u={u} done={function(r,xp){stopBGM();bossDone(r,xp);}} back={function(){stopBGM();sSP(null);sSPA("mocks");sT("train");}}/>);}
  if(sp==="endless"){playBGM("bgm_endless");return pg(<EndlessArena u={u} nav={nav} done={function(r,xp,meta){stopBGM();endlessDone(r,xp,meta);}} back={function(){stopBGM();sSP(null);sSPA("mocks");sT("train");}}/>);}
  if(sp==="mock3")return pg(<MockTest mockId={3} u={u} done={mockDone} back={function(){sSP(null);sSPA("mocks");sT("train");}}/>);
  if(sp==="tavern"){playBGM("bgm_tavern");return pg(<WordTavern u={u} done={function(sc,tot,xp){stopBGM();miniDone(sc,tot,xp);}} gate={function(xp,sc,tot){return applyXpGates(xp,sc,tot,"tavern");}} resetCard={function(c){sv(c);}} back={function(){stopBGM();sSP(null);sT("games");}}/>);}
  if(sp==="matchE"){playBGM("bgm_speed");return pg(<SpeedMatch mode="easy" u={u} done={function(mk,res,xp){stopBGM();gameDone(mk,res,xp);}} back={function(){stopBGM();sSP(null);sT("games");}}/>);}
  if(sp==="wfall"){playBGM("bgm_wfall");return pg(<WordFall u={u} done={function(mk,res,xp){stopBGM();gameDone(mk,res,xp);}} back={function(){stopBGM();sSP(null);sT("games");}}/>);}
  if(sp==="duel"){playBGM("bgm_duel");return pg(<DuelArena u={u} done={function(mk,res,xp){stopBGM();gameDone(mk,res,xp);}} back={function(){stopBGM();sSP(null);sT("games");}}/>);}
  if(sp==="sbuild"){playBGM("bgm_build");return pg(<SentenceBuilder u={u} gate={function(xp,sc,tot){return applyXpGates(xp,sc,tot,"sbuild");}} done={function(sc,tot,xp){stopBGM();var gxp=applyXpGates(xp,sc,tot,"sbuild");var c=addXp(gxp);c.stats.totalQ+=tot;c.stats.correct+=sc;c.stats.sessions+=1;trackModSession(c,"sbuild");recordModule(c,"sbuild",sc,tot);if(tot>0&&sc/tot>=0.9)grantWeeklyChest("sbuild_90","novice");sv(c);sSP(null);sT("games");}} back={function(){stopBGM();sSP(null);sT("games");}}/>);}
  if(sp==="clue"){playBGM("bgm_clue");return pg(<ClueHunter u={u} gate={function(xp,sc,tot){return applyXpGates(xp,sc,tot,"clue");}} done={function(sc,tot,xp){stopBGM();var gxp=applyXpGates(xp,sc,tot,"clue");var c=addXp(gxp);c.stats.totalQ+=tot;c.stats.correct+=sc;c.stats.sessions+=1;trackModSession(c,"clue");recordModule(c,"clue",sc,tot);checkMission(c,"clue");if(sc===tot&&tot>0)grantWeeklyChest("clue_perfect","guerrier");sv(c);sSP(null);sT("games");}} back={function(){stopBGM();sSP(null);sT("games");}}/>);}
  if(sp==="ablitz")return pg(<AudioBlitz u={u} gate={function(xp,sc,tot){return applyXpGates(xp,sc,tot,"ablitz");}} done={function(sc,tot,xp){var gxp=applyXpGates(xp,sc,tot,"ablitz");var c=addXp(gxp);c.stats.totalQ+=tot;c.stats.correct+=sc;c.stats.sessions+=1;trackModSession(c,"ablitz");recordModule(c,"ablitz",sc,tot);if(tot>0){var abPct=sc/tot;if(abPct>=0.9)grantWeeklyChest("ablitz_90","guerrier");else if(abPct>=0.7)grantWeeklyChest("ablitz_70","novice");}sv(c);sSP(null);sT("games");}} back={function(){sSP(null);sT("games");}}/>);
  if(sp==="upgrade")return pg(<UpgradeScreen u={u} back={function(){sSP(null);sT("profile");}}/>);
  if(sp==="abouttoeic")return pg(<AboutToeic back={function(){sSP(null);sSPA(3);sT("train");}}/>);
  if(sp==="strats")return pg(<StratCards back={function(){sSP(null);sSPA(3);sT("train");}}/>);
  if(sp==="gramref")return pg(<GrammarRef initial={spA} back={function(){sSP(null);sSPA(3);sT("train");}}/>);
  if(sp==="stratquiz")return pg(<StratQuizPage u={u} done={miniDone} gate={function(xp,sc,tot){return applyXpGates(xp,sc,tot,"stratquiz");}} back={function(){sSP(null);sSPA(3);sT("train");}}/>);
  if(sp==="timesim")return pg(<TimeSim u={u} done={miniDone} gate={function(xp,sc,tot){return applyXpGates(xp,sc,tot,"timesim");}} nav={nav} back={function(){sSP(null);sSPA(0);sT("train");}}/>);
  if(sp==="p6")return pg(<Part6Drill u={u} done={miniDone} gate={function(xp,sc,tot){return applyXpGates(xp,sc,tot,"p6");}} back={function(){sSP(null);sSPA(0);sT("train");}}/>);
  if(sp==="p7")return pg(<Part7Read u={u} done={miniDone} gate={function(xp,sc,tot){return applyXpGates(xp,sc,tot,"p7");}} back={function(){sSP(null);sSPA(0);sT("train");}}/>);
  if(sp==="lis")return pg(<ListenHub u={u} nav={nav} groupType={groupType} onPremium={function(n){setPremiumPrompt(n);}} back={function(){sSP(null);sSPA(0);sT("train");}}/>);
  if(sp==="lisP1")return pg(<ListenP1 u={u} done={miniDone} gate={function(xp,sc,tot){return applyXpGates(xp,sc,tot,"lisP1");}} back={function(){sSP("lis");}}/>);
  if(sp==="read")return pg(<ReadingHub u={u} nav={nav} groupType={groupType} onPremium={function(n){setPremiumPrompt(n);}} back={function(){sSP(null);sSPA(0);sT("train");}}/>);
  if(sp==="lisP2")return pg(<ListenP2 u={u} done={miniDone} gate={function(xp,sc,tot){return applyXpGates(xp,sc,tot,"lisP2");}} back={function(){sSP("lis");}}/>);
  if(sp==="lisP3")return pg(<ListenP3 u={u} done={miniDone} gate={function(xp,sc,tot){return applyXpGates(xp,sc,tot,"lisP3");}} back={function(){sSP("lis");}}/>);
  if(sp==="lisP4")return pg(<ListenP4 u={u} done={miniDone} gate={function(xp,sc,tot){return applyXpGates(xp,sc,tot,"lisP4");}} back={function(){sSP("lis");}}/>);

  return(<div className={lc}><style>{CSS}</style>{xpt&&<XpToast v={xpt}/>}{achToast&&<AchToast v={achToast}/>}
    {showTip&&u&&<DailyTip u={u} close={function(){setShowTip(false);}}/>}
    {isExpiredGroup&&<div style={{padding:"10px 16px",background:"rgba(255,71,87,.08)",border:"1px solid rgba(255,71,87,.2)",borderRadius:12,margin:"12px 16px 0",textAlign:"center"}}>
      <p style={{fontSize:12,color:"var(--red)",margin:0,fontWeight:600}}>{"\u23F0"} Acc\u00e8s expir\u00e9 le {groupAccess.endDate} — consultation uniquement</p>
    </div>}
    {tab==="home"&&!isExpiredGroup&&<Home u={u} nav={nav} events={activeEvents} medianXp={classMedianXp} pendingChests={pendingChestCount} onOpenChest={function(){if(chestPending.length>0)setChestModal(chestPending[0]);}} onMount={function(){playBGM("bgm_home");}} onLeave={function(){stopBGM();}}/>}{tab==="train"&&!isExpiredGroup&&<Train u={u} nav={nav} tabGo={tabGo} initialView={spA} groupType={groupType} onPremium={function(n){setPremiumPrompt(n);}}/>}{tab==="cards"&&!isExpiredGroup&&<Cards u={u} nav={nav} groupType={groupType} onPremium={function(n){setPremiumPrompt(n);}}/>}{tab==="games"&&!isExpiredGroup&&<GamesHub u={u} nav={nav} groupType={groupType} onPremium={function(n){setPremiumPrompt(n);}}/>}{tab==="league"&&<League u={u}/>}{tab==="profile"&&<Profile u={u} reset={reset} logout={logout} deleteAccount={deleteAccount} setAvatar={function(c){sv(c);}} goTeacher={function(){setTeacher(true);}} goUpgrade={function(){sSP("upgrade");}}/>}
    {u&&u.tutorialPending===true&&tab==="home"&&!sp&&!isExpiredGroup&&<TutorialTour onDone={function(){var c=JSON.parse(JSON.stringify(u));c.tutorialPending=false;sv(c);}}/>}
    {/* ═══ CHEST OPEN MODAL ═══ */}
    {chestModal&&<ChestOpenModal chest={chestModal} result={chestResult} onOpen={doOpenChest} onClose={function(){setChestModal(null);setChestResult(null);}}/>}

    {/* ═══ CHEST EARNED TOAST ═══ */}
    {activeChestToast&&!chestModal&&<ChestEarnedToast
      toastId={activeChestToast.id}
      chestType={activeChestToast.chestType}
      reason={getTriggerLabel(activeChestToast.trigger)}
      onDismiss={function(){setActiveChestToast(null);}}
      onOpenNow={function(){setActiveChestToast(null);if(chestPending.length>0)setChestModal(chestPending[0]);}}/>}

    {premiumOverlay}
    <Tabs cur={tab} go={tabGo} blocked={expBlocked}/></div>);
}