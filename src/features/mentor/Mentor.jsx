// Extrait de src/App.jsx le 2026-09-15 (refactor split-app, REFACTOR_PLAN.md). Code déplacé tel quel.
import { Bar } from "../../components/Bar.jsx";
import { GIcon } from "../../components/icons.jsx";
import { GAME_ICON_PATHS } from "../../data/avatarIcons.js";
import { save } from "../../lib/persistence.js";
import { getDailyMission } from "../../lib/progress.js";
import { estimateTOEICScore, computeTodayFocus, partAccuracies, bsScanParts } from "../../lib/toeic.js";
import { today } from "../../lib/util.js";
import { hasHeardMoment } from "../../narrator.js";
import { supabase } from "../../supabase.js";
import { useState, useEffect } from "react";

// ═══════════════════════════════════════════════════════════════════════
// MentorGoalCard — Personalization Phase 1 (refactored 2026-05-05 PM)
// Single component handling all 3 goal states inline on the Mentor tab :
//   1. No goal set → editor card with slider + date picker (CTA)
//   2. Goal set, view mode → progress + pace + ETA, the WHOLE card
//      is clickable to enter edit mode (per Jérémy's UX feedback)
//   3. Goal set, edit mode → editor card with Update / Cancel / Supprimer
// Replaces both the old <GoalProgressCard/> (Home view-only) and the
// goal section in Profile (now removed). Mentor becomes the single home
// for goal management.
// Iconography : path-distance instead of 🎯 emoji to match the GIcon DA.
// ═══════════════════════════════════════════════════════════════════════
export function MentorGoalCard(p){
  var u=p.u;
  var hasGoal=!!u.targetToeic&&!!u.targetDate;
  var[snaps,setSnaps]=useState(null);
  var[editing,setEditing]=useState(!hasGoal);
  var[score,setScore]=useState(u.targetToeic||700);
  var[date,setDate]=useState(u.targetDate||(function(){var d=new Date();d.setDate(d.getDate()+90);return d.toISOString().split("T")[0];})());
  useEffect(function(){
    if(!hasGoal){setSnaps([]);return;}
    var cn=u.name,cc=u.classCode||"visitor";
    supabase.rpc("my_weekly_snapshots",{p_name:cn,p_class_code:cc,p_limit:6,p_exclude_week_id:null})
      .then(function(r){
        if(r.error){console.warn("[MentorGoalCard] snaps fetch failed:",r.error.message);setSnaps([]);return;}
        if(r.data&&r.data.ok===false){console.warn("[MentorGoalCard] snaps refused:",r.data.error);setSnaps([]);return;}
        setSnaps((r.data&&r.data.snapshots)||[]);
      });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  },[hasGoal,u.name,u.classCode,u.targetToeic,u.targetDate]);

  var minDateStr=(function(){var d=new Date();d.setDate(d.getDate()+30);return d.toISOString().split("T")[0];})();
  function saveGoal(){
    if(!score||score<200||score>990)return;
    if(!date||date<minDateStr)return;
    var c=JSON.parse(JSON.stringify(u));
    c.targetToeic=Math.round(score/10)*10;
    c.targetDate=date;
    if(p.setUser)p.setUser(c);
    setEditing(false);
  }
  function clearGoal(){
    var c=JSON.parse(JSON.stringify(u));
    c.targetToeic=null;c.targetDate=null;
    if(p.setUser)p.setUser(c);
    setScore(700);
    var d=new Date();d.setDate(d.getDate()+90);setDate(d.toISOString().split("T")[0]);
    setEditing(true);
  }
  function cancelEdit(){
    setScore(u.targetToeic||700);
    setDate(u.targetDate||(function(){var d=new Date();d.setDate(d.getDate()+90);return d.toISOString().split("T")[0];})());
    setEditing(false);
  }

  // ── Edit mode (also covers "no goal yet" state) ──
  if(editing){
    return(<div className="crd" style={{marginBottom:16,padding:"14px 16px",background:"rgba(139,92,246,.06)",border:"1px solid rgba(139,92,246,.25)"}}>
      <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:10}}>
        <GIcon name="path-distance" size={20} color="var(--purple)"/>
        <div className="out" style={{fontWeight:800,fontSize:13,color:"var(--purple)"}}>{hasGoal?"Adjust your goal":"Set your TOEIC goal"}</div>
      </div>
      <div style={{fontSize:12,color:"var(--t2)",marginBottom:12,lineHeight:1.5}}>{"A target score + date = a clear cap for your training. Your progress bar and ETA will appear on this hub once it's set."}</div>
      <label style={{display:"block",marginBottom:10}}>
        <div style={{display:"flex",justifyContent:"space-between",fontSize:11,color:"var(--t2)",marginBottom:4}}>
          <span>{"Target score"}</span>
          <span className="out" style={{color:"var(--purple)",fontWeight:700}}>{score+" / 990"}</span>
        </div>
        <input type="range" min="200" max="990" step="10" value={score} onChange={function(e){setScore(parseInt(e.target.value,10));}}
          style={{width:"100%",accentColor:"#8b5cf6"}}/>
      </label>
      <label style={{display:"block",marginBottom:12}}>
        <div style={{fontSize:11,color:"var(--t2)",marginBottom:4}}>{"Target date (min. 30 days)"}</div>
        <input type="date" min={minDateStr} value={date} onChange={function(e){setDate(e.target.value);}}
          style={{width:"100%",padding:"8px 10px",background:"var(--bg2)",border:"1px solid var(--bdr)",borderRadius:8,color:"var(--t1)",fontFamily:"'DM Sans',sans-serif",fontSize:13}}/>
      </label>
      <div style={{display:"flex",gap:8}}>
        <button onClick={saveGoal} className="btn1" style={{flex:1,fontSize:13,padding:"10px 14px",background:"linear-gradient(135deg,#8b5cf6,#7c3aed)"}}>{hasGoal?"Update":"Define"}</button>
        {hasGoal&&<button onClick={cancelEdit} className="btn2" style={{fontSize:12,padding:"10px 12px"}}>{"Cancel"}</button>}
        {hasGoal&&<button onClick={clearGoal} className="btn2" style={{fontSize:12,padding:"10px 12px",borderColor:"rgba(224,82,82,.25)",color:"var(--red)"}}>{"Remove"}</button>}
      </div>
    </div>);
  }

  // ── View mode : progress + ETA. Whole card is clickable → enter edit. ──
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
  }
  var series=(snaps||[]).slice().reverse().map(function(s){return{toeic:estimateTOEICScore(s.module_scores_snapshot||{}).total};}).filter(function(x){return x.toeic!==null;});
  var avgDeltaPerWeek=null;
  if(series.length>=2){
    var first=series[0].toeic,last=series[series.length-1].toeic;
    avgDeltaPerWeek=(last-first)/(series.length-1);
  }
  var baseline=series.length>0?series[0].toeic:Math.min(current,200);
  if(baseline>current)baseline=Math.min(current,200);
  var pct=target>baseline?Math.max(0,Math.min(100,(current-baseline)/(target-baseline)*100)):100;
  var done=current>=target;

  var todayD=new Date();var targetD=new Date(u.targetDate);
  var daysLeft=Math.round((targetD.getTime()-todayD.getTime())/86400000);
  var etaText,etaColor;
  if(done){etaText="Goal reached";etaColor="var(--green)";}
  else if(snaps===null){etaText="Loading pace…";etaColor="var(--t2)";}
  else if(series.length<2||avgDeltaPerWeek===null){etaText="ETA available after 2 weeks of training";etaColor="var(--t2)";}
  else if(avgDeltaPerWeek<=0){etaText="Pace stalled — push training to make progress";etaColor="var(--orange)";}
  else{
    var weeksNeeded=(target-current)/avgDeltaPerWeek;
    var etaDate=new Date(todayD.getTime()+weeksNeeded*7*86400000);
    var fmtFR=etaDate.toLocaleDateString("fr-FR",{day:"numeric",month:"short",year:"numeric"});
    if(etaDate<=targetD){etaText="ETA "+fmtFR+" · on track";etaColor="var(--green)";}
    else{var daysLate=Math.round((etaDate.getTime()-targetD.getTime())/86400000);etaText="ETA "+fmtFR+" · "+daysLate+"d behind";etaColor="var(--orange)";}
  }
  var paceText=avgDeltaPerWeek!==null?((avgDeltaPerWeek>=0?"+":"")+Math.round(avgDeltaPerWeek)+" pts/week"):null;
  var paceColor=avgDeltaPerWeek===null?"var(--t2)":(avgDeltaPerWeek>=5?"var(--green)":avgDeltaPerWeek>=0?"var(--cyan)":"var(--orange)");
  var daysLabel=daysLeft>0?daysLeft+"d left":daysLeft===0?"target day":Math.abs(daysLeft)+"d past";
  var daysCol=daysLeft>=14?"var(--t2)":daysLeft>=0?"var(--orange)":"var(--red)";

  return(<div className="crd" onClick={function(){setEditing(true);}}
    style={{marginBottom:16,padding:"14px 16px",background:"linear-gradient(135deg,rgba(139,92,246,.08),rgba(var(--cx),.04))",border:"1px solid rgba(139,92,246,.25)",cursor:"pointer"}}>
    <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:8}}>
      <div style={{display:"flex",alignItems:"center",gap:8}}>
        <GIcon name="path-distance" size={18} color="var(--purple)"/>
        <div className="out" style={{fontWeight:800,fontSize:13,color:"var(--purple)"}}>{"Goal: "+target+" TOEIC"}</div>
      </div>
      <div className="out" style={{fontSize:11,fontWeight:700,color:daysCol}}>{daysLabel}</div>
    </div>
    <div style={{display:"flex",alignItems:"baseline",gap:8,marginBottom:6}}>
      <div className="out" style={{fontSize:24,fontWeight:900,color:done?"var(--green)":"var(--cyan)"}}>{current}</div>
      <div style={{fontSize:11,color:"var(--t2)"}}>{"/ "+target}</div>
      {paceText&&<div className="out" style={{marginLeft:"auto",fontSize:11,fontWeight:700,color:paceColor}}>{paceText}</div>}
    </div>
    <Bar value={Math.round(pct)} max={100} h={6} color={done?"linear-gradient(90deg,#0e8e57,#1ed27a)":"linear-gradient(90deg,#8b5cf6,#06b6d4)"}/>
    <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginTop:8}}>
      <div style={{fontSize:11,color:etaColor,fontWeight:600}}>{etaText}</div>
      <div style={{fontSize:10,color:"var(--t3)",fontStyle:"italic"}}>{"tap to edit"}</div>
    </div>
  </div>);
}
// ═══════════════════════════════════════════════════════════════════════
// MentorMap — illustrated map UX for the Mentor tab (2026-05-05 PM).
// Replaces the vertical tile stack with an immersive Doré-style B&W map.
// 4 hotspots overlay the image at fixed %-coords :
//   - Peak  → Your Goal
//   - Trail → Today's Daily Mission
//   - Stone → Today's Focus
//   - Camp  → Where You Stand
// Tap → bottom sheet (~70vh) slides up while the map stays visible above.
// Each sheet renders the existing component (MentorGoalCard, MentorDailyMission,
// TodayFocusBanner, the per-part list) so logic stays single-sourced.
// Cold states : faded sigil + "?" / "Train more" hint when data is absent.
// ═══════════════════════════════════════════════════════════════════════
export function MentorMap(p){
  var u=p.u;
  var hasGoal=!!u.targetToeic&&!!u.targetDate;
  var current=estimateTOEICScore(u.moduleScores||{}).total;
  var totalQ=(u.stats&&u.stats.totalQ)||0;
  var calibrated=totalQ>=20;
  var focus=calibrated?computeTodayFocus(u):null;
  var mission=getDailyMission(u);
  var missionReady=mission&&mission.status!=="calibrating"&&mission.mod;
  var missionDone=missionReady&&(mission.status==="completed"||mission.done);
  var daysLeft=hasGoal?Math.round((new Date(u.targetDate).getTime()-Date.now())/86400000):null;

  // Desktop / mobile swap : different illustration, different hotspot coords.
  // Listens to viewport width (matchMedia 768px breakpoint, same as the
  // existing .tab-bar sidebar trigger). Re-renders on resize.
  var[isDesktop,setIsDesktop]=useState(typeof window!=="undefined"&&window.matchMedia&&window.matchMedia("(min-width:768px)").matches);
  useEffect(function(){
    if(typeof window==="undefined"||!window.matchMedia)return;
    var mq=window.matchMedia("(min-width:768px)");
    function onChange(e){setIsDesktop(e.matches);}
    if(mq.addEventListener)mq.addEventListener("change",onChange);
    else mq.addListener(onChange); // legacy Safari
    return function(){
      if(mq.removeEventListener)mq.removeEventListener("change",onChange);
      else mq.removeListener(onChange);
    };
  },[]);

  // Hotspots — coords aligned to the 2026-05-06 PM "arena-at-peak" map regen.
  // Mobile (portrait 2:3) : peak top-center, arena carved into mountain side mid,
  // standing stone left, camp right, Aldric center foreground.
  // Desktop (landscape 3:2) : peak top-left, arena left, mid-trail center, standing
  // stone right, camp center-right, Aldric center foreground.
  var hotspots=isDesktop?[
    {id:"goal", x:30, y:30, side:"left",
     label:hasGoal?"The Distant Peak":"Set destination",
     value:hasGoal?(u.targetToeic+" · "+(daysLeft>=0?daysLeft+"d":"past")):"?",
     tone:hasGoal?"active":"muted"},
    {id:"mission", x:43, y:55, side:"right",
     label:"Today's Path",
     value:!missionReady?"Train more":missionDone?"Complete ✓":"+15 XP",
     tone:!missionReady?"muted":missionDone?"done":"active"},
    {id:"focus", x:84, y:60, side:"right",
     label:"The Crossroads",
     value:focus?focus.label.replace(/ — .*/,"")+" · +25%":calibrated?"All steady":"Train more",
     tone:focus?"active":"muted"},
    {id:"camp", x:67, y:75, side:"right",
     label:"Your Camp",
     value:(current!==null?current+" TOEIC":"\u2014 TOEIC"),
     tone:"active"}
  ]:[
    {id:"goal", x:48, y:22, side:"left",
     label:hasGoal?"The Distant Peak":"Set destination",
     value:hasGoal?(u.targetToeic+" · "+(daysLeft>=0?daysLeft+"d":"past")):"?",
     tone:hasGoal?"active":"muted"},
    {id:"mission", x:50, y:50, side:"right",
     label:"Today's Path",
     value:!missionReady?"Train more":missionDone?"Complete ✓":"+15 XP",
     tone:!missionReady?"muted":missionDone?"done":"active"},
    {id:"focus", x:14, y:60, side:"left",
     label:"The Crossroads",
     value:focus?focus.label.replace(/ — .*/,"")+" · +25%":calibrated?"All steady":"Train more",
     tone:focus?"active":"muted"},
    {id:"camp", x:83, y:68, side:"right",
     label:"Your Camp",
     value:(current!==null?current+" TOEIC":"\u2014 TOEIC"),
     tone:"active"}
  ];

  // Aldric position differs per layout — both new images put him center-foreground.
  var aldricCoords=isDesktop?{x:48,y:85,w:48,h:120,side:"left"}:{x:52,y:88,w:64,h:120,side:"left"};
  var imgSrc=isDesktop?"/images/mentor/map_desktop.jpg":"/images/mentor/map.jpg";
  var aspectRatio=isDesktop?"1338/860":"2/3";

  var aldricBadgePos=aldricCoords.side==="left"?{left:"calc(100% + 8px)"}:{right:"calc(100% + 8px)"};
  return(<div className="mentor-map-wrap" style={{position:"relative",width:"100%",aspectRatio:aspectRatio,marginBottom:14}}>
    <img src={imgSrc} alt="The Mentor's Map"
      style={{width:"100%",height:"100%",objectFit:"cover",display:"block",filter:"contrast(1.05)"}}
      onError={function(e){e.target.style.display="none";}}/>
    {/* Soft 4-edge fade to the page bg — blends the map seamlessly into the
        Mentor screen without a hard rectangular border. Stronger on edges,
        clear in the center where the hotspots live. */}
    <div style={{position:"absolute",inset:0,background:"linear-gradient(to right, var(--bg) 0%, transparent 8%, transparent 92%, var(--bg) 100%), linear-gradient(to bottom, var(--bg) 0%, transparent 8%, transparent 92%, var(--bg) 100%)",pointerEvents:"none"}}/>
    {/* Aldric figure — clickable to replay his Side Chronicle. Position + badge
        side adapt to the active map layout. */}
    {p.onAldricTap&&hasHeardMoment(u,"mentor_intro")&&<button onClick={p.onAldricTap}
      style={{position:"absolute",left:aldricCoords.x+"%",top:aldricCoords.y+"%",transform:"translate(-50%,-50%)",
        width:aldricCoords.w,height:aldricCoords.h,background:"transparent",border:"none",cursor:"pointer",padding:0,
        borderRadius:8}} aria-label="Replay Aldric's introduction">
      <span style={Object.assign({position:"absolute",top:"50%",transform:"translateY(-50%)",
        background:"linear-gradient(135deg,rgba(245,235,205,.92),rgba(228,212,170,.88))",
        color:"#3d2814",border:"1px solid rgba(90,58,20,.35)",borderRadius:6,
        padding:"4px 8px",whiteSpace:"nowrap",
        fontFamily:"'Cinzel',serif",fontSize:9,letterSpacing:.5,fontWeight:700,textTransform:"uppercase",
        boxShadow:"0 2px 8px rgba(0,0,0,.4)"},aldricBadgePos)}>
        {"Aldric speaks"}
      </span>
    </button>}
    {hotspots.map(function(h){
      var sigilColor=h.tone==="active"?"#f0c850":h.tone==="done"?"#4abe60":"#8a7e6a";
      var sigilBg=h.tone==="active"?"rgba(240,200,80,.18)":h.tone==="done"?"rgba(74,190,96,.18)":"rgba(138,126,106,.15)";
      var badgeStyle={position:"absolute",top:"50%",transform:"translateY(-50%)",
        background:"linear-gradient(135deg,rgba(245,235,205,.95),rgba(228,212,170,.92))",
        color:"#3d2814",border:"1px solid rgba(90,58,20,.4)",borderRadius:6,
        padding:"4px 8px",minWidth:80,maxWidth:140,whiteSpace:"nowrap",
        fontFamily:"'DM Sans',sans-serif",fontSize:10,fontWeight:600,lineHeight:1.3,
        boxShadow:"0 2px 8px rgba(0,0,0,.4)",textAlign:"left"};
      if(h.side==="left")badgeStyle.left="calc(100% + 10px)";
      else badgeStyle.right="calc(100% + 10px)";
      return(<button key={h.id} onClick={function(){p.onHotspotTap&&p.onHotspotTap(h.id);}}
        style={{position:"absolute",left:h.x+"%",top:h.y+"%",transform:"translate(-50%,-50%)",
          width:36,height:36,borderRadius:"50%",border:"2px solid "+sigilColor,
          background:sigilBg,cursor:"pointer",
          display:"flex",alignItems:"center",justifyContent:"center",
          padding:0,boxShadow:"0 0 14px "+sigilColor+"66",
          animation:h.tone==="active"?"pulse 2.4s infinite":"none"}}>
        <span style={{width:8,height:8,borderRadius:"50%",background:sigilColor,boxShadow:"0 0 4px "+sigilColor}}/>
        <span style={badgeStyle}>
          <span style={{display:"block",fontFamily:"'Cinzel',serif",fontSize:9,letterSpacing:.5,color:"#5a3a1a",fontWeight:700,textTransform:"uppercase",overflow:"hidden",textOverflow:"ellipsis"}}>{h.label}</span>
          <span style={{display:"block",fontWeight:700,marginTop:1,overflow:"hidden",textOverflow:"ellipsis"}}>{h.value}</span>
        </span>
      </button>);
    })}
  </div>);
}
// Generic bottom sheet — slides up, backdrop dim, dismiss on backdrop tap.
export function MentorSheet(p){
  if(!p.open)return null;
  return(<div onClick={p.onClose} style={{position:"fixed",inset:0,background:"rgba(10,8,5,.62)",zIndex:9000,display:"flex",alignItems:"flex-end",animation:"fadeIn .25s"}}>
    <div onClick={function(e){e.stopPropagation();}} style={{position:"relative",width:"100%",maxWidth:430,margin:"0 auto",background:"var(--bg)",borderRadius:"18px 18px 0 0",borderTop:"1px solid rgba(var(--cx),.18)",padding:"22px 16px 26px",maxHeight:"82vh",overflowY:"auto",animation:"slideUp .3s cubic-bezier(.2,.7,.3,1)"}}>
      <span style={{position:"absolute",top:8,left:"50%",transform:"translateX(-50%)",width:36,height:4,borderRadius:2,background:"var(--bdr)"}}/>
      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:14}}>
        <h2 className="out" style={{fontWeight:800,fontSize:16,color:"var(--t1)"}}>{p.title}</h2>
        <button onClick={p.onClose} style={{background:"none",border:"none",color:"var(--t2)",fontSize:22,cursor:"pointer",padding:4,lineHeight:1}}>{"×"}</button>
      </div>
      {p.children}
    </div>
  </div>);
}
// ═══════════════════════════════════════════════════════════════════════
// MentorDailyMission — adaptive daily mission relocated from Home (2026-05-05 PM).
// Daily Challenge (5 random Q) stays on Home as a generic "warm-up reflex" ;
// the personalized adaptive Mission lives here in Mentor where the
// "where I'm headed" mode lives. No bonus link to Daily Challenge anymore —
// the two are now autonomous.
// ═══════════════════════════════════════════════════════════════════════
export function MentorDailyMission(p){
  var u=p.u;
  var mission=getDailyMission(u);
  var ready=mission&&mission.status!=="calibrating"&&mission.mod;
  var done=ready&&(mission.status==="completed"||mission.done);

  // Initialize mission record on first display so the rest of the app sees it
  if(ready&&mission.status==="new"&&(!u.mission||u.mission.date!==today())){
    u.mission={date:today(),actId:mission.actId,done:false};
    save(u);
  }

  // Calibrating user : friendly hint, no CTA
  if(mission&&mission.status==="calibrating"){
    return(<div className="crd" style={{marginBottom:14,padding:"12px 14px",background:"var(--bg2)",border:"1px solid var(--bdr)"}}>
      <div style={{display:"flex",alignItems:"center",gap:10}}>
        <GIcon name="sands-of-time" size={20} color="var(--t2)"/>
        <div style={{flex:1}}>
          <div className="out" style={{fontWeight:800,fontSize:13,color:"var(--t2)"}}>{"Daily Mission"}</div>
          <div style={{fontSize:11,color:"var(--t3)",marginTop:2,lineHeight:1.4}}>{"Train "+(mission.remaining||"a few")+" more sessions to unlock adaptive missions."}</div>
        </div>
      </div>
    </div>);
  }

  if(!ready)return null;

  if(done){
    return(<div className="crd" style={{marginBottom:14,padding:"12px 14px",background:"var(--bg2)",border:"1px solid var(--bdr)"}}>
      <div style={{display:"flex",alignItems:"center",gap:10}}>
        <GIcon name="trophy-cup" size={20} color="var(--green)"/>
        <div style={{flex:1}}>
          <div className="out" style={{fontWeight:800,fontSize:13,color:"var(--green)"}}>{"Daily Mission complete"}</div>
          <div style={{fontSize:11,color:"var(--green)",marginTop:2,lineHeight:1.4}}>{"See you tomorrow for the next mission."}</div>
        </div>
      </div>
    </div>);
  }

  var m=mission.mod;
  return(<div className="crd" onClick={function(){if(p.nav)p.nav(mission.actId);}}
    style={{marginBottom:14,cursor:"pointer",padding:"14px 16px",
      background:"linear-gradient(135deg,rgba(255,215,0,.10),rgba(139,92,246,.08))",
      border:"1px solid rgba(255,215,0,.25)",
      boxShadow:"0 0 18px rgba(255,215,0,.12)"}}>
    <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
      <div style={{display:"flex",alignItems:"center",gap:10,flex:1,minWidth:0}}>
        <span style={{width:26,display:"inline-flex",alignItems:"center",justifyContent:"center"}}>{GAME_ICON_PATHS[m.icon]?<GIcon name={m.icon} size={22} color="var(--gold)"/>:<span style={{fontSize:22}}>{m.icon}</span>}</span>
        <div style={{minWidth:0,flex:1}}>
          <div style={{display:"flex",alignItems:"center",gap:6,marginBottom:2}}>
            <span className="out" style={{fontWeight:800,fontSize:14,color:"var(--t1)"}}>{"Daily Mission"}</span>
            <span style={{fontSize:9,padding:"2px 6px",borderRadius:4,background:"rgba(255,215,0,.15)",color:"var(--gold)",fontWeight:700}} className="out">{"+15 XP"}</span>
          </div>
          <div style={{fontSize:12,color:"var(--t2)",lineHeight:1.4,overflow:"hidden",textOverflow:"ellipsis"}}>
            {m.name+" — "+mission.reason}
          </div>
        </div>
      </div>
      <span style={{fontSize:18,color:"var(--gold)",marginLeft:8}}>{"›"}</span>
    </div>
  </div>);
}
// ═══════════════════════════════════════════════════════════════════════
// Mentor tab — Personalization Phase 1 hub (2026-05-05)
// Dedicated space for everything personalized : goal progress, today's
// focus, weakness next-step. Removes the "headed-where" cards from Home so
// Home stays focused on "playing-now". Phase 2 will add a per-topic radar
// chart, smart review module, and weekly insight history into this hub.
// First-open trigger fires the Aldric "mentor_intro" narrator moment via
// the parent App's narratorQueue (passed as prop).
// ═══════════════════════════════════════════════════════════════════════
export function Mentor(p){
  var u=p.u;
  var[sheet,setSheet]=useState(null); // null | "goal" | "mission" | "focus" | "camp"
  // Per-part data — used for the Camp sheet ("Where you stand" breakdown).
  var focus=computeTodayFocus(u);
  var pa=partAccuracies(u.moduleScores||{},bsScanParts(u));
  var labels={p1:"Part 1 — Photographs",p2:"Part 2 — Q&R",p3:"Part 3 — Conversations",p4:"Part 4 — Talks",p5:"Part 5 — Grammar & Vocab",p6:"Part 6 — Text Completion",p7:"Part 7 — Reading",vocab:"Vocabulary"};
  var reco={p1:"lisP1",p2:"lisP2",p3:"lisP3",p4:"lisP4",p5:"drill",p6:"p6",p7:"p7",vocab:"tavern"};
  var measured=[],unmeasured=[];
  Object.keys(pa).forEach(function(k){
    var d=pa[k];
    if(d&&d.n>=10)measured.push({k:k,acc:d.acc,n:d.n});
    else unmeasured.push({k:k,n:(d&&d.n)||0});
  });
  measured.sort(function(a,b){return a.acc-b.acc;});

  return(<div className="enter" style={{padding:"20px 16px 100px"}}>
    <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:6}}>
      <GIcon name="wizard-staff" size={28} color="var(--cyan)"/>
      <h1 className="out" style={{fontWeight:900,fontSize:24}}>Mentor</h1>
    </div>
    <p style={{color:"var(--t2)",fontSize:12,marginBottom:14,lineHeight:1.5,fontStyle:"italic"}}>{"Tap a sigil on the map to act on it."}</p>

    {/* The illustrated map with 4 hotspots + Aldric (clickable replay).
        The bottom replay button was dropped : Aldric on the map IS the replay
        affordance, no need for a duplicate CTA below the tab bar. */}
    <MentorMap u={u}
      onHotspotTap={function(id){setSheet(id);}}
      onAldricTap={p.replayNarrator?function(){p.replayNarrator("mentor_intro");}:null}/>

    {/* ── Bottom sheets per hotspot ─────────────────────────────────────── */}
    <MentorSheet open={sheet==="goal"} onClose={function(){setSheet(null);}} title="The Distant Peak — your goal">
      <MentorGoalCard u={u} setUser={p.setUser}/>
    </MentorSheet>

    <MentorSheet open={sheet==="mission"} onClose={function(){setSheet(null);}} title="Today's Path — your daily mission">
      <MentorDailyMission u={u} nav={function(modId){setSheet(null);if(p.nav)p.nav(modId);}}/>
    </MentorSheet>

    <MentorSheet open={sheet==="focus"} onClose={function(){setSheet(null);}} title="The Crossroads — today's focus">
      {focus
        ?<TodayFocusBanner u={u} nav={function(modId){setSheet(null);if(p.nav)p.nav(modId);}}/>
        :<p style={{color:"var(--t2)",fontSize:13,lineHeight:1.5,padding:"4px 2px"}}>{measured.length===0?"Train at least 20 questions to unlock today's focus.":"All your areas look steady — no clear weak spot to surface today. Keep training !"}</p>}
    </MentorSheet>

    <MentorSheet open={sheet==="camp"} onClose={function(){setSheet(null);}} title="Your Camp — where you stand">
      <div style={{display:"flex",alignItems:"baseline",gap:8,marginBottom:14}}>
        <div className="out" style={{fontSize:30,fontWeight:900,color:"var(--cyan)"}}>{(function(){var tt=estimateTOEICScore(u.moduleScores||{}).total;return tt!==null?tt:"\u2014";})()}</div>
        <div style={{fontSize:11,color:"var(--t2)"}}>{"estimated TOEIC"}</div>
      </div>
      {measured.length===0
        ?<p style={{color:"var(--t2)",fontSize:12,lineHeight:1.5}}>{"Train a few sessions to unlock the Mentor's diagnosis. We need at least 10 questions per area."}</p>
        :measured.map(function(it){
          var pct=Math.round(it.acc*100);
          var col=pct>=85?"var(--green)":pct>=70?"var(--cyan)":pct>=50?"var(--orange)":"var(--red)";
          var isFocus=focus&&focus.partId===it.k;
          return(<button key={it.k} onClick={function(){setSheet(null);if(p.nav)p.nav(reco[it.k]);}}
            style={{display:"flex",alignItems:"center",gap:10,padding:"10px 12px",marginBottom:6,width:"100%",background:isFocus?"rgba(245,158,11,.08)":"var(--bg2)",border:"1px solid "+(isFocus?"rgba(245,158,11,.35)":"var(--bdr)"),borderRadius:10,cursor:"pointer",textAlign:"left",fontFamily:"'DM Sans',sans-serif"}}>
            <div style={{flex:1,minWidth:0}}>
              <div className="out" style={{fontSize:12,fontWeight:700,color:"var(--t1)"}}>{labels[it.k]}{isFocus&&<span style={{marginLeft:6,fontSize:10,color:"var(--orange)"}}>{"· focus"}</span>}</div>
              <div style={{display:"flex",alignItems:"center",gap:6,marginTop:4}}>
                <div style={{flex:1,height:4,borderRadius:2,background:"rgba(0,0,0,.15)",overflow:"hidden"}}>
                  <div style={{width:Math.min(100,pct)+"%",height:"100%",background:col,transition:"width .3s"}}/>
                </div>
                <span className="out" style={{fontSize:11,fontWeight:700,color:col,minWidth:30,textAlign:"right"}}>{pct+"%"}</span>
              </div>
            </div>
            <span style={{fontSize:14,color:"var(--t3)"}}>{"›"}</span>
          </button>);
        })
      }
      {unmeasured.length>0&&measured.length>0&&<div style={{fontSize:11,color:"var(--t3)",marginTop:8,fontStyle:"italic"}}>{unmeasured.length+" area"+(unmeasured.length>1?"s":"")+" not yet measured — train them to unlock their score."}</div>}

      {/* ─── Grammar deep dive — Personalization Phase 2 (2026-05-06) ───
         Aggregates the 12 P5 sub-cats into 4 macros (Verbs / Linking / Forms /
         Reference). Sorted weakest-first. Each row taps to launch Drill where
         pickAdaptive will weight the question selection toward that macro. */}
      {(function(){
        var ds=u.moduleScores&&u.moduleScores.drill;
        var cs=(ds&&ds.catStats)||{};
        var hasGrammar=Object.keys(cs).some(function(k){return cs[k]&&cs[k].total>=5;});
        // Phase D (scan-v2): fall back to Battle Scan grammar macros when no drill data exists.
        // Maps macro key (capitalized) to scan macroId (lowercase), populated from u.battleScan.subScores.grammarMacros.
        var scanMacros=u.battleScan&&u.battleScan.subScores&&u.battleScan.subScores.grammarMacros;
        if(!hasGrammar&&!scanMacros)return null;
        var macros=[
          {key:"Verbs",icon:"crossed-swords",scanId:"verbs",subcats:["Tenses","Gerunds vs Infinitives","Passive Voice","Conditionals","Subject-Verb Agreement"]},
          {key:"Linking",icon:"linked-rings",scanId:"linking",subcats:["Connectors","Prepositions","Collocations"]},
          {key:"Forms",icon:"quill-ink",scanId:"forms",subcats:["Word Families","Comparatives","Articles"]},
          {key:"Reference",icon:"family-tree",scanId:"reference",subcats:["Relative Pronouns"]}
        ];
        var macroData=macros.map(function(m){
          var sumC=0,sumT=0;
          var subs=m.subcats.map(function(c){var s=cs[c];if(!s||s.total<1)return{cat:c,acc:null,n:0};sumC+=s.correct;sumT+=s.total;return{cat:c,acc:s.correct/s.total,n:s.total};});
          if(sumT===0){
            // Trained data missing for this macro — fall back to scan baseline if present.
            if(scanMacros&&typeof scanMacros[m.scanId]==="number"){
              return{key:m.key,icon:m.icon,acc:scanMacros[m.scanId],n:2,weakest:null,source:"scan"};
            }
            return null;
          }
          var weakest=subs.filter(function(s){return s.acc!==null&&s.n>=3;}).sort(function(a,b){return a.acc-b.acc;})[0];
          return{key:m.key,icon:m.icon,acc:sumC/sumT,n:sumT,weakest:weakest,source:"trained"};
        }).filter(Boolean).sort(function(a,b){return a.acc-b.acc;});
        if(macroData.length===0)return null;
        return(<div style={{marginTop:16,paddingTop:14,borderTop:"1px solid var(--bdr)"}}>
          <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:8}}>
            <GIcon name="scroll-quill" size={16} color="var(--purple)"/>
            <div className="out" style={{fontSize:11,fontWeight:700,color:"var(--purple)",textTransform:"uppercase",letterSpacing:1}}>{"Grammar deep dive"}</div>
          </div>
          <div style={{fontSize:11,color:"var(--t3)",marginBottom:10,lineHeight:1.5}}>{"Tap a topic to drill it. The picker weights toward your weaknesses."}</div>
          {macroData.map(function(m){
            var pct=Math.round(m.acc*100);
            var col=pct>=85?"var(--green)":pct>=70?"var(--cyan)":pct>=50?"var(--orange)":"var(--red)";
            return(<button key={m.key} onClick={function(){setSheet(null);if(p.nav)p.nav("drill");}}
              style={{display:"flex",alignItems:"center",gap:10,padding:"10px 12px",marginBottom:6,width:"100%",background:"var(--bg2)",border:"1px solid var(--bdr)",borderRadius:10,cursor:"pointer",textAlign:"left",fontFamily:"'DM Sans',sans-serif"}}>
              <GIcon name={m.icon} size={18} color={col}/>
              <div style={{flex:1,minWidth:0}}>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                  <span className="out" style={{fontSize:12,fontWeight:700,color:"var(--t1)"}}>{m.key}</span>
                  <span className="out" style={{fontSize:11,fontWeight:700,color:col}}>{pct+"%"}</span>
                </div>
                <div style={{display:"flex",alignItems:"center",gap:6,marginTop:4}}>
                  <div style={{flex:1,height:4,borderRadius:2,background:"rgba(0,0,0,.15)",overflow:"hidden"}}>
                    <div style={{width:Math.min(100,pct)+"%",height:"100%",background:col,transition:"width .3s"}}/>
                  </div>
                </div>
                {m.weakest&&<div style={{fontSize:10,color:"var(--t3)",marginTop:3}}>{"weakest : "+m.weakest.cat+" ("+Math.round(m.weakest.acc*100)+"%)"}</div>}
                {m.source==="scan"&&<div style={{fontSize:10,color:"var(--t3)",marginTop:3,fontStyle:"italic"}}>{"from your Battle Scan — train Drill to refine"}</div>}
              </div>
            </button>);
          })}
        </div>);
      })()}
    </MentorSheet>
  </div>);
}
// ═══════════════════════════════════════════════════════════════════════
// TodayFocusBanner — Mentor banner that surfaces the user's weakest part with
// a CTA + a +25% XP today badge. Hidden if no focus available (cold start
// or already strong everywhere).
// ═══════════════════════════════════════════════════════════════════════
export function TodayFocusBanner(p){
  var u=p.u;
  var focus=computeTodayFocus(u);
  if(!focus)return null;
  var accPct=Math.round(focus.acc*100);
  return(<button onClick={function(){p.nav&&p.nav(focus.recoModId);}}
    style={{width:"100%",marginBottom:14,padding:"12px 16px",background:"linear-gradient(135deg,rgba(245,158,11,.12),rgba(139,92,246,.08))",border:"1px solid rgba(245,158,11,.3)",borderRadius:14,cursor:"pointer",display:"flex",alignItems:"center",gap:12,fontFamily:"'DM Sans',sans-serif",textAlign:"left"}}>
    <GIcon name="eye-target" size={24} color="var(--orange)"/>
    <div style={{flex:1,minWidth:0}}>
      <div className="out" style={{fontWeight:800,fontSize:13,color:"var(--orange)"}}>{"Today's focus: "+focus.label}</div>
      <div style={{fontSize:11,color:"var(--t2)",marginTop:2}}>{"Your weakest area ("+accPct+"%) — train it now for "}<span className="out" style={{color:"var(--gold)",fontWeight:700}}>{"+25% XP"}</span></div>
    </div>
    <span style={{fontSize:18,color:"var(--orange)"}}>{"›"}</span>
  </button>);
}
