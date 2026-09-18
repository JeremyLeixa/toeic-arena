// Extrait de src/App.jsx le 2026-09-15 (refactor split-app, REFACTOR_PLAN.md). Code déplacé tel quel.
// Lot 4 du Mentor qui se souvient (2026-09-18, proto prototypes/mentor-memory/) : la carte porte cinq
// repères, le plan du jour figé vit dans la feuille « Today's Path », le bestiaire dans « The Lair ».
import { Bar } from "../../components/Bar.jsx";
import { GIcon } from "../../components/icons.jsx";
import { estimateTOEICScore } from "../../lib/toeic.js";
import { MACROS, PART_LABEL, PART_MOD, stakes, fmtDay } from "../../lib/learnerModel.js";
import { todayMission, thawQuest, questDone, stakePart, chronicle, letterWeek } from "../../lib/planner.js";
import { bestiary, TIERS, tierOf, HUNT_CAP } from "../../lib/review.js";
import { mapBadges, planIntro, planWhy, questView, creatureMeta, chronicleEntry, nextPageLine, BESTIARY_INTRO, BESTIARY_RULES } from "../../lib/mentorVoice.js";
import { today } from "../../lib/util.js";
import { MondayLetter } from "./MondayLetter.jsx";
import { useWeeklySnaps } from "./useWeeklySnaps.js";
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
// Cinq repères depuis le lot 4 du Mentor qui se souvient (2026-09-18) :
//   - Peak  → l'objectif (MentorGoalCard)
//   - Path  → le plan du jour FIGÉ (u.mission, lib/planner.js) ; sa mission porte « +15 XP »
//   - Lair  → le bestiaire des erreurs. Remplace « The Crossroads » : le Today's Focus est devenu la
//             quête « enjeu » du plan, où son +25 % est enfin expliqué
//   - Camp  → où j'en suis, partie par partie
//   - Aldric → rediffusion de son chapitre (la Chronique viendra au lot 6)
// Badges : lib/mentorVoice.js mapBadges. Mêmes images et coordonnées qu'avant ; « lair » reprend la
// place de « focus ». Tap → bottom sheet (~70vh), sauf le Lair qui ouvre une vue pleine page.
// ═══════════════════════════════════════════════════════════════════════
export function MentorMap(p){
  var u=p.u;
  var badges=mapBadges(u,new Date(),estimateTOEICScore(u.moduleScores||{}).total);

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
  // Mobile (portrait 2:3) : peak top-center, path mid, lair left (the old standing stone), camp right,
  // Aldric center foreground. Desktop (landscape 3:2) : peak top-left, path center, lair right.
  var coords=isDesktop
    ?{goal:{x:30,y:30,side:"left"},path:{x:43,y:55,side:"right"},lair:{x:84,y:60,side:"right"},camp:{x:67,y:75,side:"right"}}
    :{goal:{x:48,y:22,side:"left"},path:{x:50,y:50,side:"right"},lair:{x:14,y:60,side:"left"},camp:{x:83,y:68,side:"right"}};
  var hotspots=["goal","path","lair","camp"].map(function(id){return Object.assign({id:id},coords[id],badges[id]);});

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
    {/* Aldric figure — opens the Chronicle of the student's journey (lot 6, 2026-09-18) ; the replay of
        his Side Chronicle moved to the foot of that sheet. Position + badge side adapt to the layout. */}
    {p.onAldricTap&&<button onClick={p.onAldricTap}
      style={{position:"absolute",left:aldricCoords.x+"%",top:aldricCoords.y+"%",transform:"translate(-50%,-50%)",
        width:aldricCoords.w,height:aldricCoords.h,background:"transparent",border:"none",cursor:"pointer",padding:0,
        borderRadius:8}} aria-label="Open your chronicle">
      <span style={Object.assign({position:"absolute",top:"50%",transform:"translateY(-50%)",
        background:"linear-gradient(135deg,rgba(245,235,205,.92),rgba(228,212,170,.88))",
        color:"#3d2814",border:"1px solid rgba(90,58,20,.35)",borderRadius:6,
        padding:"4px 8px",whiteSpace:"nowrap",
        fontFamily:"'Cinzel',serif",fontSize:9,letterSpacing:.5,fontWeight:700,textTransform:"uppercase",
        boxShadow:"0 2px 8px rgba(0,0,0,.4)"},aldricBadgePos)}>
        {"Your chronicle"}
      </span>
    </button>}
    {hotspots.map(function(h){
      var sigilColor=h.tone==="active"?"#f0c850":h.tone==="done"?"#4abe60":"#8a7e6a";
      var sigilBg=h.tone==="active"?"rgba(240,200,80,.18)":h.tone==="done"?"rgba(74,190,96,.18)":"rgba(138,126,106,.15)";
      var badgeStyle={position:"absolute",top:"50%",transform:"translateY(-50%)",
        background:"linear-gradient(135deg,rgba(245,235,205,.95),rgba(228,212,170,.92))",
        color:"#3d2814",border:"1px solid rgba(90,58,20,.4)",borderRadius:6,
        padding:"4px 8px",minWidth:80,maxWidth:150,whiteSpace:"nowrap",
        fontFamily:"'DM Sans',sans-serif",fontSize:10,fontWeight:600,lineHeight:1.3,
        boxShadow:"0 2px 8px rgba(0,0,0,.4)",textAlign:"left"};
      if(h.side==="left")badgeStyle.left="calc(100% + 10px)";
      else badgeStyle.right="calc(100% + 10px)";
      return(<button key={h.id} onClick={function(){p.onHotspotTap&&p.onHotspotTap(h.id);}} aria-label={h.label+": "+h.value}
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
// TodayPath — la feuille du repère « Path » (lot 4, 2026-09-18). Rend la journée FIGÉE (u.mission,
// posée par App() une fois par jour depuis lib/planner.js) : les quêtes se cochent au lieu de
// disparaître. La mémoire de la veille est dite en tête (décision de Jérémy : pas au-dessus du pseudo).
// Remplace MentorDailyMission (qui écrivait u.mission pendant le rendu) et TodayFocusBanner.
// ═══════════════════════════════════════════════════════════════════════
function TodayPath(p){
  var u=p.u,now=new Date(),m=todayMission(u,now);
  var[why,setWhy]=useState(false);
  if(!m)return(<p style={{color:"var(--t2)",fontSize:13,lineHeight:1.5,padding:"4px 2px"}}>{"Aldric is drawing today's path…"}</p>);
  var n=m.quests.length;
  return(<div>
    <p className="mm-intro">{planIntro(u,m,now)+(!n?"":m.done?" Today's mission is done"+(n>1?": the rest is a bonus.":"."):n>1?" The quest marked +15 XP is today's mission.":" It's today's mission.")}</p>
    {n===0&&<p className="mm-why" style={{fontStyle:"normal"}}>{"Nothing pressing: every part you've trained is on target. Train what you like, or visit the Lair."}</p>}
    {m.quests.map(function(fq,i){
      var q=thawQuest(fq,u,now),v=questView(q,u,i===m.pick),done=questDone(u,m,i,now);
      return(<button key={i} className={"mm-quest"+(i===m.pick?" first":"")+(done?" done":"")} onClick={function(){p.go(q.mod);}}>
        <span className="mm-q-ic"><GIcon name={done?"check-mark":v.icon} size={18} color={done?"var(--green)":i===m.pick?"var(--cyan)":"var(--t2)"}/></span>
        <span className="mm-q-body"><span className="mm-q-title out">{v.title}</span><span className="mm-q-why">{v.why}</span></span>
        <span className="mm-q-tag out">{done?"Done":v.tag}</span>
      </button>);
    })}
    {n>0&&<button className="mm-why-btn" onClick={function(){setWhy(!why);}}>{why?"Hide":"Why this order?"}</button>}
    {why&&<p className="mm-why">{planWhy(m,u)}</p>}
  </div>);
}
// ═══════════════════════════════════════════════════════════════════════
// Lair — le bestiaire des erreurs, vue pleine page du Mentor (pas de route). Les énoncés viennent de
// lib/reviewLookup.js, chargé À LA DEMANDE : il tire les banques d'écoute et de lecture, qui n'ont rien
// à faire dans le bundle principal (check_import_graph refuse tout import statique résiduel).
// ═══════════════════════════════════════════════════════════════════════
function Lair(p){
  var u=p.u,now=new Date(),b=bestiary(u,now);
  var[lk,setLk]=useState(null);
  var[open,setOpen]=useState({});
  useEffect(function(){
    var sc=document.querySelector(".app");if(sc)sc.scrollTop=0;
    var live=true;
    import("../../lib/reviewLookup.js").then(function(mod){if(live)setLk(mod);})
      .catch(function(e){console.warn("[mentor] bestiary lookup:",e&&e.message);});
    return function(){live=false;};
  },[]);
  function title(k){var q=lk&&lk.lookupRef(k);return q?(q.title||q.prompt):lk?"(no longer in the question bank)":"…";}
  var hunt=Math.min(HUNT_CAP,b.due);
  return(<div className="enter" style={{padding:"20px 16px 100px"}}>
    <button className="back-btn" onClick={p.back}>{"← Mentor"}</button>
    <div style={{display:"flex",alignItems:"center",gap:10,marginTop:10}}>
      <GIcon name="dragon-head" size={28} color="var(--cyan)"/>
      <h1 className="out" style={{fontWeight:900,fontSize:24}}>{"The Lair"}</h1>
    </div>
    <p style={{color:"var(--t2)",fontSize:12,marginTop:4,lineHeight:1.5}}>{BESTIARY_INTRO}</p>
    <div className="mm-best-stats">
      <div className="crd mm-stat"><b className="out" style={{color:"var(--t1)"}}>{b.lurking}</b><small>{"Lurking"}</small></div>
      <div className="crd mm-stat"><b className="out" style={{color:"var(--orange)"}}>{b.due}</b><small>{"Due today"}</small></div>
      <div className="crd mm-stat"><b className="out" style={{color:"var(--green)"}}>{b.slain}</b><small>{"Slain"}</small>{b.slainWeek>0&&<em>{"+"+b.slainWeek+" this week"}</em>}</div>
    </div>
    {b.due>0&&<button className="btn1 out" style={{marginBottom:14}} onClick={function(){p.go("hunt");}}>{"Hunt "+hunt+" due creature"+(hunt>1?"s":"")}</button>}
    {b.slain===0&&<div className="crd mm-rules">
      <div className="out" style={{fontWeight:800,fontSize:13}}>{"How the hunt works"}</div>
      <ol>{BESTIARY_RULES.map(function(r,i){return <li key={i}>{r}</li>;})}</ol>
    </div>}
    {b.lurking===0&&<p style={{color:"var(--t3)",fontSize:12,lineHeight:1.6,fontStyle:"italic",textAlign:"center",margin:"18px 8px"}}>{"No creature yet. Your mistakes land here: in the drills, the Gauntlet, the Modal Council, the games, Listening and Reading."}</p>}
    {b.groups.map(function(g){
      var all=!!open[g.key],shown=all?g.items:g.items.slice(0,3),more=g.items.length-shown.length;
      return(<div key={g.key} className="crd mm-group">
        <div className="mm-group-head"><b className="out">{lk?lk.groupLabel(g):(g.cat||"…")}</b><small>{g.items.length}</small>{g.due>0&&<span className="mm-due out">{g.due+" due"}</span>}</div>
        {shown.map(function(it){
          var tier=tierOf(it);
          return(<div key={it.k} className="mm-crea">
            <span className="mm-crea-ic"><GIcon name={TIERS[tier].icon} size={17} color={tier==="wyrm"?"var(--red)":tier==="stalker"?"var(--orange)":"var(--t2)"}/></span>
            <div className="mm-crea-body"><div className="mm-crea-q">{title(it.k)}</div><div className="mm-crea-meta">{creatureMeta(it,now)}</div></div>
            <span className="mm-pips" title="Spaced hits">{[0,1,2].map(function(i){return <i key={i} className={i<it.box?"on":""}/>;})}</span>
          </div>);
        })}
        {more>0&&<button className="mm-more" onClick={function(){setOpen(Object.assign({},open,{[g.key]:true}));}}>{"and "+more+" more"}</button>}
      </div>);
    })}
  </div>);
}
// ═══════════════════════════════════════════════════════════════════════
// Camp — où j'en suis (lot 4) : la maîtrise RÉCENTE par partie (lib/learnerModel.js, demi-vie 14 j),
// triée par points en jeu, comme le plan. Avant, la précision cumulée à vie : un élève passé de 45 à
// 80 % lisait 68 % ici pendant que sa quête lui disait autre chose.
// ═══════════════════════════════════════════════════════════════════════
function Camp(p){
  var u=p.u,now=new Date(),focusPart=stakePart(u,now);
  var st=stakes(u,now),measured=st.filter(function(s){return s.acc!=null;}),unmeasured=st.length-measured.length;
  var est=estimateTOEICScore(u.moduleScores||{}).total;
  return(<div>
    <div style={{display:"flex",alignItems:"baseline",gap:8,marginBottom:14}}>
      <div className="out" style={{fontSize:30,fontWeight:900,color:"var(--cyan)"}}>{est!==null?est:"—"}</div>
      <div style={{fontSize:11,color:"var(--t2)"}}>{"estimated TOEIC"}</div>
    </div>
    {measured.length===0
      ?<p style={{color:"var(--t2)",fontSize:12,lineHeight:1.5}}>{"Train a few sessions to unlock the Mentor's diagnosis."}</p>
      :measured.map(function(s){
        var pct=Math.round(s.acc*100);
        var col=pct>=85?"var(--green)":pct>=70?"var(--cyan)":pct>=50?"var(--orange)":"var(--red)";
        var isFocus=focusPart===s.part;
        var sub=s.source==="scan"?"From your Battle Scan: train it to measure it."
          :s.pts>0?"About "+s.pts+" points to gain"+(u.targetToeic?" toward "+u.targetToeic:"")+"."
          :"On target.";
        return(<button key={s.part} onClick={function(){p.go(PART_MOD[s.part]);}}
          style={{display:"flex",alignItems:"center",gap:10,padding:"10px 12px",marginBottom:6,width:"100%",background:isFocus?"rgba(245,158,11,.08)":"var(--bg2)",border:"1px solid "+(isFocus?"rgba(245,158,11,.35)":"var(--bdr)"),borderRadius:10,cursor:"pointer",textAlign:"left",fontFamily:"'DM Sans',sans-serif"}}>
          <div style={{flex:1,minWidth:0}}>
            <div className="out" style={{fontSize:12,fontWeight:700,color:"var(--t1)"}}>{PART_LABEL[s.part]}{isFocus&&<span style={{marginLeft:6,fontSize:10,color:"var(--orange)"}}>{"· +25% today"}</span>}</div>
            <div style={{display:"flex",alignItems:"center",gap:6,marginTop:4}}>
              <div style={{flex:1,height:4,borderRadius:2,background:"rgba(0,0,0,.15)",overflow:"hidden"}}>
                <div style={{width:Math.min(100,pct)+"%",height:"100%",background:col,transition:"width .3s"}}/>
              </div>
              <span className="out" style={{fontSize:11,fontWeight:700,color:col,minWidth:30,textAlign:"right"}}>{pct+"%"}</span>
            </div>
            <div style={{fontSize:10,color:"var(--t3)",marginTop:3}}>{sub}</div>
          </div>
          <span style={{fontSize:14,color:"var(--t3)"}}>{"›"}</span>
        </button>);
      })
    }
    {unmeasured>0&&measured.length>0&&<div style={{fontSize:11,color:"var(--t3)",marginTop:8,fontStyle:"italic"}}>{unmeasured+" part"+(unmeasured>1?"s":"")+" not yet measured — train them to unlock their score."}</div>}

    {/* ─── Grammar deep dive — Personalization Phase 2 (2026-05-06) ───
       Les 4 macros de data/placement.js (source unique depuis le lot 1, avec Pronouns, Quantifiers &
       Determiners et Parallel Structure qui manquaient ici). Chiffres cumulés (catStats du Drill) : la
       série par catégorie (`cs`) n'existe que depuis le 2026-09-17, elle laisserait la liste vide. */}
    {(function(){
      var ds=u.moduleScores&&u.moduleScores.drill;
      var cs=(ds&&ds.catStats)||{};
      var hasGrammar=Object.keys(cs).some(function(k){return cs[k]&&cs[k].total>=5;});
      // Phase D (scan-v2): fall back to Battle Scan grammar macros when no drill data exists.
      var scanMacros=u.battleScan&&u.battleScan.subScores&&u.battleScan.subScores.grammarMacros;
      if(!hasGrammar&&!scanMacros)return null;
      var macroData=MACROS.map(function(m){
        var sumC=0,sumT=0;
        var subs=m.subcats.map(function(c){var s=cs[c];if(!s||s.total<1)return{cat:c,acc:null,n:0};sumC+=s.correct;sumT+=s.total;return{cat:c,acc:s.correct/s.total,n:s.total};});
        if(sumT===0){
          if(scanMacros&&typeof scanMacros[m.id]==="number")return{key:m.label,icon:m.icon,acc:scanMacros[m.id],n:2,weakest:null,source:"scan"};
          return null;
        }
        var weakest=subs.filter(function(s){return s.acc!==null&&s.n>=3;}).sort(function(a,b){return a.acc-b.acc;})[0];
        return{key:m.label,icon:m.icon,acc:sumC/sumT,n:sumT,weakest:weakest,source:"trained"};
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
          return(<button key={m.key} onClick={function(){p.go("drill");}}
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
  </div>);
}
// ═══════════════════════════════════════════════════════════════════════
// Chronicle — la feuille du repère Aldric (lot 6, 2026-09-18 ; proto moment 9). Les jalons DATÉS du
// parcours : rangés dans le bestiaire par sealSession (review.chronicle, history étant bornée) et fusionnés
// avec ceux qu'on recalcule (lib/planner.js chronicle), les insights du jeton, puis « The next page » : la
// prochaine quête non faite du plan figé. En pied : la lettre de la semaine et la rediffusion d'Aldric.
// ═══════════════════════════════════════════════════════════════════════
function Chronicle(p){
  var u=p.u,now=new Date(),d=today(now),snaps=useWeeklySnaps(u);
  var entries=chronicle(u,now,snaps||[]).map(chronicleEntry);
  var m=todayMission(u,now),ni=m?m.quests.findIndex(function(q,k){return !questDone(u,m,k,now);}):-1;
  var next=nextPageLine(ni>=0?thawQuest(m.quests[ni],u,now):null,u);
  return(<div>
    {entries.length===0&&<p className="mm-intro">{"Your chronicle starts with your first session. I write down what matters, with the date."}</p>}
    <div className="mm-chron">
      {entries.map(function(e,i){
        return(<div key={i} className={"mm-ch"+(e.kind==="turn"?" turn":"")+(e.d===d?" now":"")}>
          <span className="mm-ch-dot"><GIcon name={e.icon} size={16} color={e.kind==="turn"?"var(--gold)":e.d===d?"var(--cyan)":"var(--t2)"}/></span>
          <div className="mm-ch-body">
            <div className="mm-ch-date out">{fmtDay(e.d)}</div>
            <div className="mm-ch-title out">{e.title}</div>
            {e.text&&<div className="mm-ch-text">{e.text}</div>}
          </div>
        </div>);
      })}
      <div className="mm-ch now">
        <span className="mm-ch-dot"><GIcon name="quill-ink" size={16} color="var(--cyan)"/></span>
        <div className="mm-ch-body">
          <div className="mm-ch-date out">{"Today"}</div>
          <div className="mm-ch-title out">{"The next page"}</div>
          <div className="mm-ch-text">{next}</div>
        </div>
      </div>
    </div>
    <div style={{display:"flex",gap:8,marginTop:14}}>
      <button className="btn2 out" style={{flex:1,fontSize:12}} onClick={p.onLetter}>{"This week's letter"}</button>
      {p.onReplay&&<button className="btn2 out" style={{flex:1,fontSize:12}} onClick={p.onReplay}>{"Hear Aldric again"}</button>}
    </div>
  </div>);
}
// ═══════════════════════════════════════════════════════════════════════
// Mentor tab — Personalization Phase 1 hub (2026-05-05), la mémoire depuis le 2026-09-18.
// First-open trigger fires the Aldric "mentor_intro" narrator moment via the parent App's
// narratorQueue (passed as prop). `initialSheet` : "path" quand on arrive du bandeau de Home.
// ═══════════════════════════════════════════════════════════════════════
export function Mentor(p){
  var u=p.u;
  var[sheet,setSheet]=useState(p.initialSheet==="path"||p.initialSheet==="chronicle"?p.initialSheet:null); // null | "goal" | "path" | "camp" | "chronicle"
  var[lair,setLair]=useState(false);
  var[letter,setLetter]=useState(false);
  function go(modId){setSheet(null);if(p.nav)p.nav(modId);}
  // Relire la lettre depuis la Chronique la marque lue pour la semaine (App ne la montrera plus sur Home).
  function closeLetter(action){
    setLetter(false);
    if(u.letterSeen!==letterWeek(new Date())&&p.setUser){var c=JSON.parse(JSON.stringify(u));c.letterSeen=letterWeek(new Date());p.setUser(c);}
    if(action==="plan")setSheet("path");
  }
  if(lair)return <Lair u={u} go={go} back={function(){setLair(false);}}/>;
  return(<div className="enter" style={{padding:"20px 16px 100px"}}>
    <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:6}}>
      <GIcon name="wizard-staff" size={28} color="var(--cyan)"/>
      <h1 className="out" style={{fontWeight:900,fontSize:24}}>Mentor</h1>
    </div>
    <p style={{color:"var(--t2)",fontSize:12,marginBottom:14,lineHeight:1.5,fontStyle:"italic"}}>{"Tap a sigil on the map to act on it."}</p>

    {/* The illustrated map with 4 sigils + Aldric (clickable replay). */}
    <MentorMap u={u}
      onHotspotTap={function(id){if(id==="lair")setLair(true);else setSheet(id);}}
      onAldricTap={function(){setSheet("chronicle");}}/>

    {/* ── Bottom sheets per sigil ─────────────────────────────────────── */}
    <MentorSheet open={sheet==="goal"} onClose={function(){setSheet(null);}} title="The Distant Peak — your goal">
      <MentorGoalCard u={u} setUser={p.setUser}/>
    </MentorSheet>

    <MentorSheet open={sheet==="path"} onClose={function(){setSheet(null);}} title="Today's Path">
      <TodayPath u={u} go={go}/>
    </MentorSheet>

    <MentorSheet open={sheet==="camp"} onClose={function(){setSheet(null);}} title="Your Camp — where you stand">
      <Camp u={u} go={go}/>
    </MentorSheet>

    <MentorSheet open={sheet==="chronicle"} onClose={function(){setSheet(null);}} title="The Chronicle of your journey">
      <Chronicle u={u} onLetter={function(){setSheet(null);setLetter(true);}}
        onReplay={p.replayNarrator&&hasHeardMoment(u,"mentor_intro")?function(){setSheet(null);p.replayNarrator("mentor_intro");}:null}/>
    </MentorSheet>

    {letter&&<MondayLetter u={u} reread onClose={closeLetter}/>}
  </div>);
}
