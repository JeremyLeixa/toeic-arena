// Extrait de src/App.jsx le 2026-09-15 (refactor split-app, REFACTOR_PLAN.md). Code déplacé tel quel.
import { renderAv, TreasureChestSvg } from "../../components/avatar.jsx";
import { Bar } from "../../components/Bar.jsx";
import { GIcon, ResultIcon, LeagueIcon } from "../../components/icons.jsx";
import { GAME_ICON_PATHS } from "../../data/avatarIcons.js";
import { TITLES } from "../../data/chests.js";
import { getLevel } from "../../data/helpers.js";
import { STRATEGIES } from "../../data/miniGames.js";
import { festivalById, festivalOccurrence, festivalDaysLeft, formatFestivalDate } from "../../lib/festivals.js";
import { getEffectiveLeague } from "../../lib/league.js";
import { getDailyMission, needsMockNudge } from "../../lib/progress.js";
import { tone } from "../../lib/tone.js";
import { today } from "../../lib/util.js";

export function Home(p){
var u=p.u,lv=getLevel(u.xp),lg=getEffectiveLeague(u.weeklyXp,u.moduleScores),dd=u.daily&&u.daily.date===today()&&u.daily.done;
// ── Single-pulse priority (UX focus): chest > mock > daily > event ──
// Only ONE CTA animates at a time so the eye isn't pulled in multiple directions.
var _missionHome=getDailyMission(u);
var _missionReady=_missionHome&&_missionHome.status!=="calibrating"&&_missionHome.mod;
var _isMissionDoneHome=_missionReady&&(_missionHome.status==="completed"||_missionHome.done);
// Smart Daily Quest: active if Mission pending, OR if Challenge still pending (sequential reveal)
var _dailyQuestActive=(_missionReady&&!_isMissionDoneHome)||!dd;
var chestTier=Math.max(0,Math.min(3,p.pendingChestTier||0));
var pulseSlot=p.pendingChests>0?"chest":needsMockNudge(u)?"mock":_dailyQuestActive?"daily":(p.events&&p.events.length>0)?"event":null;
// Festival theme appliqué par App (p.festId, déjà filtré par l'opt-out). Hors fenêtre mais forcé
// (?fest=), l'occurrence est la prochaine : dates et jours restants restent vrais.
var fest=p.festId?festivalById(p.festId):null;
var festOcc=fest?festivalOccurrence(fest,new Date()):null;
var festLeft=fest?festivalDaysLeft(fest,new Date()):0;
return(
<div className="enter" style={{padding:"20px 16px 100px"}}>
<div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:24}}>
<div><p style={{color:"var(--t2)",fontSize:13,marginBottom:2}}>{fest?fest.greeting:"Welcome back"}</p><h1 className="out" style={{fontWeight:800,fontSize:24,display:"flex",alignItems:"center",gap:8}}>{u.name} {renderAv(u.avatar,28,u.equippedFrame)}</h1>{u.equippedTitle&&TITLES[u.equippedTitle]&&<div className="out" style={{fontSize:10,fontWeight:800,color:tone(TITLES[u.equippedTitle].color),letterSpacing:2,textTransform:"uppercase",marginTop:2}}>{TITLES[u.equippedTitle].name}</div>}</div>
<div style={{textAlign:"center"}}><span className="fl" style={{fontSize:28,display:"inline-flex"}}>{u.streak>0?<GIcon name="flame" size={28} color="var(--orange)"/>:<span>{"❄️"}</span>}</span><div className="out" style={{fontSize:13,fontWeight:700,color:u.streak>0?"var(--orange)":"var(--t3)"}}>{u.streak}</div></div></div>

{/* Active bonus indicators */}
{function(){
  var pills=[];var dow=new Date().getDay();
  if(dow===0||dow===6)pills.push({label:"x2 Weekend",col:"#ff6bff",icon:"🎉"});
  if(u.streak>=7)pills.push({label:"x1.5 Streak",col:"#ff8c42",icon:"🔥",gi:"flame"});
  else if(u.streak>=3)pills.push({label:"x1.2 Streak",col:"#ff8c42",icon:"🔥",gi:"flame"});
  if(u.lastActive!==today())pills.push({label:"+10 Login bonus",col:"#00e676",icon:"🎁"});
  // Event pills removed — each event has its own banner below, no need to duplicate
  if(pills.length===0)return null;
  return(<div style={{display:"flex",gap:6,marginBottom:14,flexWrap:"wrap"}}>
    {pills.map(function(p,i){return (<div key={i} style={{display:"flex",alignItems:"center",gap:4,padding:"4px 10px",borderRadius:99,background:p.col+"15",border:"1px solid "+p.col+"30",fontSize:11,fontWeight:600,color:tone(p.col)}} className="out">{GAME_ICON_PATHS[p.gi]?<GIcon name={p.gi} size={12} color={tone(p.col)}/>:<span style={{fontSize:12}}>{p.icon}</span>}{p.label}</div>);})}
  </div>);
}()}

{/* Festival theme banner (2026-09-16) — calqué sur l'Active Events Banner, validé dans
    prototypes/festival-themes/. Pas de pulse : le thème se voit déjà partout. « Turn off » =
    opt-out localStorage via App, réactivable dans Profile → Style. */}
{fest&&festOcc&&<div className="crd" style={{marginBottom:12,padding:14,background:"rgba(var(--cx),.1)",border:"1px solid rgba(var(--cx),.25)"}}>
  <div style={{display:"flex",alignItems:"center",gap:10}}>
    <span style={{display:"flex",flexShrink:0}}><GIcon name={fest.icon} size={24} color="var(--cyan)"/></span>
    <div style={{flex:1,minWidth:0}}>
      <div className="out" style={{fontWeight:700,fontSize:14,color:"var(--cyan)"}}>{fest.name}</div>
      <div style={{fontSize:11,color:"var(--t2)",marginTop:2}}>{"Seasonal theme · ends "+formatFestivalDate(festOcc.end)}</div>
    </div>
    <div style={{textAlign:"right",display:"flex",flexDirection:"column",alignItems:"flex-end",gap:2}}>
      <div className="out" style={{fontSize:12,fontWeight:700,color:"var(--cyan)"}}>{festLeft===0?"Last day":festLeft+"d left"}</div>
      <button onClick={function(){p.onFestivalsOff();}} style={{background:"none",border:"none",padding:"6px 0 6px 12px",margin:"-6px 0",cursor:"pointer",fontSize:10,color:"var(--t3)",textDecoration:"underline",fontFamily:"inherit"}}>Turn off</button>
    </div>
  </div>
</div>}

{/* Pending Chests \u2014 m\u00EAme coffre SVG que le toast et le modal (palier le plus \u00E9lev\u00E9 de la file,
    pendingChestTier calcul\u00E9 par App), couleurs du palier dans .home-chest.tN (appCss.js). */}
{p.pendingChests>0&&<button className={"home-chest t"+chestTier} onClick={function(){p.onOpenChest();}} style={{animation:pulseSlot==="chest"?"pulse 2s infinite":"none"}}>
  <span className="home-chest-art"><TreasureChestSvg size={60} tier={chestTier} idSuffix="home"/></span>
  {p.pendingChests>1&&<b className="home-chest-count">{"\u00D7"+p.pendingChests}</b>}
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
  // Clickable shortcut: Spotlight events target a specific module → tap the banner to jump
  // straight there (validated 2026-05-12). Flash Hour and Underdog are global, no obvious
  // single target, so they stay non-clickable.
  var targetModule=ev.type==="spotlight"&&cfg.module?cfg.module:null;
  var clickable=!!targetModule&&!!p.nav;
  return(<div key={ei} className="crd" onClick={clickable?function(){p.nav(targetModule);}:undefined} style={{marginBottom:12,padding:14,background:bg,border:"1px solid "+bd,cursor:clickable?"pointer":"default",animation:(pulseSlot==="event"&&ei===0)?"pulse 3s infinite":"none"}}>
    <div style={{display:"flex",alignItems:"center",gap:10}}>
      <span style={{display:"flex",flexShrink:0}}><ResultIcon e={icon} size={24} color={col}/></span>
      <div style={{flex:1}}>
        <div className="out" style={{fontWeight:700,fontSize:14,color:col}}>{ev.title}</div>
        <div style={{fontSize:11,color:"var(--t2)",marginTop:2}}>{ev.description||(ev.type==="spotlight"?"x"+m+" XP on "+cfg.module:ev.type==="flash_hour"?"x"+m+" XP on everything":"x"+m+" XP if below class median")}</div>
        {isUnderdog&&!qualifies&&<div style={{fontSize:10,color:"var(--t3)",marginTop:2}}>You are above the median</div>}
      </div>
      <div style={{textAlign:"right",display:"flex",flexDirection:"column",alignItems:"flex-end",gap:2}}>
        <div className="out" style={{fontSize:12,fontWeight:700,color:col}}>{timeLabel}</div>
        {clickable&&<div style={{fontSize:14,color:col,fontWeight:700,opacity:.75,lineHeight:1}}>{"→"}</div>}
      </div>
    </div>
  </div>);
})}


<div className="crd glo" onClick={function(){p.tabGo("league");}} style={{marginBottom:16,cursor:"pointer"}}>
<div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10}}>
<div style={{display:"flex",alignItems:"center",gap:10}}>
<div style={{width:40,height:40,borderRadius:"50%",background:"linear-gradient(135deg,var(--cx-hex),var(--cx-dark))",color:"var(--on-cx)",display:"flex",alignItems:"center",justifyContent:"center",fontWeight:900,fontSize:16}} className="out">{lv.level}</div>
<div><div className="out" style={{fontSize:13,fontWeight:700}}>Level {lv.level}</div><div style={{fontSize:11,color:"var(--t2)"}}>{lv.cur} / {lv.next} XP{u.weeklyXp>0?" · "+u.weeklyXp+" this week":""}</div></div></div>
<div style={{display:"flex",alignItems:"center",gap:8}}>
<div style={{display:"flex",alignItems:"center",gap:6,padding:"4px 12px",background:"var(--bg3)",borderRadius:99}}>
<LeagueIcon lg={lg} size={16} style={{marginRight:4,verticalAlign:"-2px"}}/><span className="out" style={{fontSize:12,fontWeight:600,color:tone(lg.color)}}>{lg.name}</span></div>
<span style={{fontSize:18,color:"var(--t3)",lineHeight:1}}>{"›"}</span></div></div>
<Bar value={lv.cur} max={lv.next} h={6}/></div>

{/* Personalization moved to its own Mentor tab (2026-05-05). Home stays
    focused on "playing-now" : daily quest, chests, events. The Mentor hub
    hosts goal progress + Today's Focus + per-part weakness list. */}

{/* ═══ Daily Challenge — generic 5-question warm-up. Adaptive Daily Mission
     was relocated to the Mentor tab (2026-05-05 PM). The two are now
     autonomous : Challenge = playing-now reflex, Mission = personalized
     where-I'm-headed (lives on Mentor). No bonus link between them. ═══ */}
<div className="crd" onClick={function(){if(!dd)p.nav("daily");}}
  style={{marginBottom:16,cursor:dd?"default":"pointer",padding:"14px 16px",
    background:dd?"var(--bg2)":"linear-gradient(135deg,rgba(var(--cx),.12),rgba(27,112,207,.12))",
    border:dd?"1px solid var(--bdr)":"1px solid rgba(var(--cx),.2)",
    boxShadow:dd?"none":"0 0 20px rgba(var(--cx),.18)"}}>
  <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
    <div style={{display:"flex",alignItems:"center",gap:10,flex:1,minWidth:0}}>
      {dd
        ?<GIcon name="trophy-cup" size={22} color="var(--green)"/>
        :<GIcon name="lightning-bow" size={22} color="var(--cyan)"/>}
      <div style={{minWidth:0,flex:1}}>
        <div style={{display:"flex",alignItems:"center",gap:6,marginBottom:2}}>
          <span className="out" style={{fontWeight:800,fontSize:15,color:dd?"var(--green)":"var(--t1)"}}>{"Daily Challenge"}</span>
          {!dd&&<span style={{fontSize:9,padding:"2px 6px",borderRadius:4,background:"rgba(var(--cx),.15)",color:"var(--cyan)",fontWeight:700}} className="out">{"+100 XP"}</span>}
        </div>
        <div style={{fontSize:12,color:dd?"var(--green)":"var(--t2)",lineHeight:1.4}}>
          {dd?"Challenge complete! +"+u.daily.xpE+" XP earned":"5 grammar questions · 30s each"}
        </div>
      </div>
    </div>
    {!dd&&<span style={{fontSize:18,color:"var(--cyan)",marginLeft:8}}>{"›"}</span>}
  </div>
</div>

{/* Stats trio (Total XP / This Week / Sessions) supprimé 2026-05-04 — duplicaté par Profile + League. */}
{/* "This week" plié en ligne secondaire dans la carte Level+League ci-dessus pour conserver le signal hebdo. */}

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
            <span style={{fontSize:16,display:"inline-flex",alignItems:"center"}}>{GAME_ICON_PATHS[todayTip.icon]?<GIcon name={todayTip.icon} size={18} color="var(--cyan)"/>:todayTip.icon}</span>
            <span className="out" style={{fontSize:10,fontWeight:700,color:"var(--cyan)",textTransform:"uppercase",letterSpacing:1}}>Tip of the day — {todayTip.part}</span>
          </div>
          <svg viewBox="0 0 512 512" width="14" height="14" style={{color:"var(--t3)",display:"inline-block",verticalAlign:"middle"}}><g fill="currentColor" dangerouslySetInnerHTML={{__html:GAME_ICON_PATHS["candle-flame"]||""}}/></svg>
        </div>
        <p className="out" style={{fontWeight:700,fontSize:14,color:"var(--t1)",lineHeight:1.5,marginBottom:6}}>{todayTip.tip.t}</p>
        <p style={{fontSize:12,color:"var(--t2)",lineHeight:1.5}}>{todayTip.tip.d}</p>
      </div>
      <button onClick={function(){p.nav("strats");}}
        style={{width:"100%",padding:"10px 18px",background:"rgba(180,140,80,.06)",borderTop:"1px solid rgba(180,140,80,.08)",border:"none",borderTop:"1px solid rgba(180,140,80,.08)",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",gap:6}}>
        <span style={{fontSize:12,color:"var(--cyan)",fontWeight:600}} className="out">All 63 strategies</span>
        <span style={{fontSize:12,color:"var(--cyan)"}}>{"→"}</span>
      </button>
    </div>
  </div>);
}()}

</div>);}
