// Extrait de src/App.jsx le 2026-09-15 (refactor split-app, REFACTOR_PLAN.md). Code déplacé tel quel.
import { LEAGUES } from "../data/leagues.js";
import { supabase } from "../supabase.js";
import { estimateTOEICScore } from "./toeic.js";
import { weekId } from "./util.js";

// Push a weekly_snapshots row for the week that just ended. Fire-and-forget.
// Called from both load-time and mid-session week transitions so that snapshots
// are never missed regardless of when the transition is detected.
export function pushWeeklySnapshot(snap){
  try{
    supabase.auth.getUser().then(function(r){
      if(!r.data||!r.data.user)return;
      var parts=(snap.weekId||"").split('-W');
      if(parts.length!==2)return;
      var yr=parseInt(parts[0]),wk=parseInt(parts[1]);
      var jan1=new Date(yr,0,1);
      var ws=new Date(jan1.getTime()+(wk-1)*7*86400000);
      var dy=ws.getDay();ws.setDate(ws.getDate()+(dy===0?-6:1-dy));
      // Securite (lot 3 du verrou satellites) : plus d'ecriture directe.
      // user_id n'est plus envoye — la RPC le prend dans le JWT. Sinon
      // n'importe qui pouvait s'attribuer les snapshots d'un autre, et donc
      // les faire effacer par sa propre purge RGPD (qui efface par user_id).
      supabase.rpc('save_weekly_snapshot',{
        p_name:snap.name,
        p_class_code:snap.classCode||'visitor',
        p_payload:{
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
        }
      })
      .then(function(res){
        if(res.error){console.error('Snapshot error:',res.error.message);return;}
        if(res.data&&res.data.ok===false)console.error('Snapshot refused:',res.data.error);
      });
    });
  }catch(e){console.warn("[snapshot] caught:",e&&e.message);}
}
// Applies a week transition if the stored weekId is outdated. Mutates `d` in place
// and returns true if a transition occurred. Used both at load time and periodically
// during a session (in case the tab stays open across a week boundary — common on
// mobile PWAs). Snapshots the weekly_xp to weeklyHistory + Supabase before reset.
export function applyWeekTransition(d){
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
export function getLeague(wxp){var l=LEAGUES[0];for(var i=0;i<LEAGUES.length;i++)if(wxp>=LEAGUES[i].min)l=LEAGUES[i];return l;}
// Légende est conditionnelle : TOEIC estimé >= 400 requis
// Si non atteint, on affiche Champion avec un badge "locked"
export function getEffectiveLeague(wxp,ms){
  var l=getLeague(wxp);
  if(l.id==="legend"){
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
  }
  return l;
}
// ─── LEAGUE ───
export function generateSeasons(startDate,endDate){
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
export var SEASONS=[
  {id:1,name:"Awakening",icon:"🌱",color:"var(--green)",weeks:["2026-W12","2026-W13","2026-W14"],start:"Mar 23",end:"Apr 12",endDate:"2026-04-12"},
  {id:2,name:"Rising",icon:"🔥",color:"var(--orange)",weeks:["2026-W15","2026-W16","2026-W17"],start:"Apr 13",end:"May 3",endDate:"2026-05-03"},
  {id:3,name:"Clash",icon:"⚔️",color:"var(--red)",weeks:["2026-W18","2026-W19","2026-W20"],start:"May 4",end:"May 24",endDate:"2026-05-24"},
  {id:4,name:"Final Push",icon:"🏆",color:"var(--gold)",weeks:["2026-W21","2026-W22","2026-W23","2026-W24","2026-W25"],start:"May 25",end:"Jun 28",endDate:"2026-06-28"},
];
export function getCurrentSeason(ss){var arr=ss||SEASONS;if(!arr||arr.length===0)return null;for(var e=0;e<arr.length;e++){if(arr[e].eternal)return arr[e];}var cw=weekId();for(var i=0;i<arr.length;i++){if((arr[i].weeks||[]).indexOf(cw)!==-1)return arr[i];}return arr[arr.length-1];}
export function getSeasonEndCountdown(season){
  if(!season||season.eternal||!season.endDate)return "∞"; // Ligue éternelle : pas de fin
  var parts=season.endDate.split("-");
  var endSunday=new Date(parseInt(parts[0]),parseInt(parts[1])-1,parseInt(parts[2]),23,59,59);
  var now=new Date();
  var diff=Math.ceil((endSunday-now)/(864e5));
  return diff>0?diff+" days left":"Ended";
}
export function computeRankings(students,cw,weeks){
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

  // Convert to sorted array — preserve frame_id / title_id so the League rows can
  // render the rival's equipped cosmetics (V2.4 chest redesign).
  var result=Object.keys(pointsMap).map(function(name){
    var s=students.find(function(st){return st.name===name;});
    return{name:name,pts:pointsMap[name],avatar:s?s.avatar||"⚔️":"⚔️",frameId:s?s.frame_id||null:null,titleId:s?s.title_id||null:null};
  });
  result.sort(function(a,b){return b.pts-a.pts;});
  return result;
}
