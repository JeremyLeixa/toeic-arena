// Extrait de src/App.jsx le 2026-09-15 (refactor split-app, REFACTOR_PLAN.md). Code déplacé tel quel.
import { openCustomerPortal, updatePassword, signOutCompletely } from "../../auth.js";
import { AvatarMedal } from "../../components/avatar.jsx";
import { GrimoireReader } from "../../components/GrimoireReader.jsx";
import { GIcon, LeagueIcon, ResultIcon } from "../../components/icons.jsx";
import { PrivacyPolicy, MediationInfo } from "../../components/legal.jsx";
import { DaricPill } from "../../components/toasts.jsx";
import { ACHIEVEMENTS } from "../../data/achievements.js";
import { GAME_ICON_PATHS } from "../../data/avatarIcons.js";
import { getOwnedRewards, getOwnedTokens, AVATARS, FRAMES, CHEAT_SHEETS, RARITIES, SKINS, TITLES, TOKEN_TYPES, consumeToken } from "../../data/chests.js";
import { getLevel } from "../../data/helpers.js";
import { MISSION_MODULES } from "../../data/placement.js";
import { PREMIUM_UPGRADE_ENABLED } from "../../lib/access.js";
import { haptic } from "../../lib/device.js";
import { findModuleLabel, FEEDBACK_MODULES } from "../../lib/feedbackModules.js";
import { festivalById, festivalOccurrence, formatFestivalDate, windowFestivalId } from "../../lib/festivals.js";
import { getEffectiveLeague } from "../../lib/league.js";
import { isPushSubscribed, unsubscribePush, subscribePush } from "../../lib/push.js";
import { getBioCredId, biometricAvailable, teacherAuth, bioAuthenticate, setDashSession } from "../../lib/teacherSession.js";
import { estimateTOEICScore, generateInsight } from "../../lib/toeic.js";
import { tone } from "../../lib/tone.js";
import { today } from "../../lib/util.js";
import { NARRATOR_ORDER, NARRATOR_MOMENTS } from "../../narrator.js";
import { isSoundEnabled, setSoundEnabled, playCorrect, stopBGM } from "../../sounds.js";
import { useState, useRef, useEffect, Suspense } from "react";
import { PasswordInput } from "../../components/PasswordInput.jsx";
import { lazyNamed } from "../../components/lazyNamed.js";

// Le graphique recharts (« Accuracy by module ») est chargé à la demande (Phase 5, C9) : c'est
// lui, avec TeacherDash, qui fait sortir recharts du bundle principal. L'onglet reste eager.
var ProfileChartsLazy=lazyNamed(function(){return import("./ProfileCharts.jsx");},"ProfileCharts");

export function Profile(p){
  var u=p.u;
  var[view,setView]=useState(null);
  var[pushOn,setPushOn]=useState(false);
  var[soundOn,setSoundOn]=useState(isSoundEnabled());
  var[tipOff,setTipOff]=useState(false);
  var[showPrivacy,setShowPrivacy]=useState(false);
  var[showMediation,setShowMediation]=useState(false);
  var fileRef=useRef(null);
  var[bioAvail,setBioAvail]=useState(false);var[bioRegistered,setBioRegistered]=useState(!!getBioCredId());
  var[invData,setInvData]=useState(null);var[invLoading,setInvLoading]=useState(true);
  var[invTokens,setInvTokens]=useState({}); // V2 — owned token quantities for the Consommables section
  var[csOpen,setCsOpen]=useState(null); // V2 — currently open cheat sheet id (renders GrimoireReader overlay)
  var[useTokenAsk,setUseTokenAsk]=useState(null); // V2 — token type the user is about to consume (confirm modal)
  var[tokenToast,setTokenToast]=useState(null); // V2 — feedback after consume
  var[bypassPick,setBypassPick]=useState(null); // V2 — selected module to arm Bypass on (string modId)
  var[insightResult,setInsightResult]=useState(null); // V2 — generated weakness insight text to display
  // V2 — Collection sections collapsed state. Avatars open by default (most visual),
  // everything else collapsed so the Collection feels lighter as content grows.
  var[collOpen,setCollOpen]=useState({avatars:true,skins:false,frames:false,titles:false,tokens:false,cheatSheets:false});
  // Phase 2 commit 4 (2026-04-27) : change password sub-form dans la section Sécurité
  var[pwdChangeShow,setPwdChangeShow]=useState(false);
  var[pwdChange1,setPwdChange1]=useState("");var[pwdChange2,setPwdChange2]=useState("");
  var[pwdChangeBusy,setPwdChangeBusy]=useState(false);var[pwdChangeErr,setPwdChangeErr]=useState("");
  var[pwdChangeOK,setPwdChangeOK]=useState(false);
  // Note (2026-05-05 PM) : goal-setting moved out of Profile — it now lives
  // as <MentorGoalCard/> inside the dedicated Mentor tab. Single source of
  // truth for goal management.

  useEffect(function(){isPushSubscribed().then(function(v){setPushOn(v);});biometricAvailable().then(function(v){setBioAvail(v);});},[]);
  useEffect(function(){if(view==="style"){setInvLoading(true);Promise.all([getOwnedRewards(u.name,u.classCode||"visitor"),getOwnedTokens(u.name,u.classCode||"visitor")]).then(function(arr){setInvData(arr[0]);setInvTokens(arr[1]||{});setInvLoading(false);});}},[view]);
  useEffect(function(){try{setTipOff(localStorage.getItem("toeic-tip-disabled")==="1");}catch(e){}},[]);

  var lv=getLevel(u.xp),lg=getEffectiveLeague(u.weeklyXp,u.moduleScores);
  // Festival theme (vue Style) : la fête de la fenêtre, MÊME désactivée par l'élève (c'est ici qu'il
  // la réactive) ; p.festId = celle réellement appliquée par App, null si opt-out.
  var festWin=festivalById(windowFestivalId(new Date()));
  var festOn=!!p.festId;
  var festEnd=festWin?formatFestivalDate(festivalOccurrence(festWin,new Date()).end):"";
  var acc=u.stats.totalQ>0?Math.round(u.stats.correct/u.stats.totalQ*100):0;
  var toeic=estimateTOEICScore(u.moduleScores||{});
  var uC=Object.assign({},u);
  var ea=ACHIEVEMENTS.filter(function(a){return a.check(uC);});
  var la=ACHIEVEMENTS.filter(function(a){return!a.check(uC);});
  var isPhoto=!!(u.avatar&&u.avatar.startsWith("data:"));
  var toeicCol=toeic.total>=750?"var(--green)":toeic.total>=500?"var(--orange)":toeic.total>200?"var(--red)":"var(--t3)";
  // CHANTIER-A : etat non estimable / partiel pour la carte score.
  var toeicNA=toeic.total===null;
  var toeicRemain=null;
  if(toeic.estimable===false&&toeic.evidence){
    var gapR=80-(toeic.evidence.readingQ||0),gapL=40-(toeic.evidence.listeningQ||0);
    var gaps=[gapR,gapL].filter(function(g){return g>0;});
    toeicRemain=gaps.length?Math.min.apply(null,gaps):null;
  }

  function renderAvatar(size,fs){
    // V2 — for chest avatars (shield SVG), the frame is rendered inside AvatarMedal as
    // an outer shield outline. For photo / emoji avatars, fall back to a CSS circle wrap.
    if(u.avatar&&AVATARS[u.avatar]){
      return(<AvatarMedal avatarId={u.avatar} size={size} frameId={u.equippedFrame||null}/>);
    }
    var inner;
    if(isPhoto)inner=(<img src={u.avatar} style={{width:size,height:size,borderRadius:"50%",objectFit:"cover",display:"block"}}/>);
    else inner=(<div style={{width:size,height:size,borderRadius:"50%",background:"linear-gradient(135deg,var(--cx-hex),#8b5e83)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:fs||(size*0.5)}}>{u.avatar||"⚔️"}</div>);
    // V2 fallback for non-shield avatars : CSS circle glow proportional to the equipped frame.
    if(u.equippedFrame&&FRAMES[u.equippedFrame]){
      var fr=FRAMES[u.equippedFrame];
      var glowColor=fr.gradient?fr.gradient[0]:fr.color;
      var pad=Math.max(3,Math.round(size*0.06));
      var bgGrad=fr.gradient?"linear-gradient(var(--bg2),var(--bg2)),linear-gradient(135deg,"+fr.gradient.join(",")+")":null;
      var wrapStyle={display:"inline-block",borderRadius:"50%",padding:pad,boxSizing:"content-box",border:(fr.strokeWidth||3)+"px solid "+(fr.gradient?"transparent":fr.color),boxShadow:"0 0 "+(fr.glow||12)+"px "+glowColor};
      if(bgGrad){wrapStyle.backgroundImage=bgGrad;wrapStyle.backgroundOrigin="border-box";wrapStyle.backgroundClip="padding-box,border-box";}
      if(fr.anim)wrapStyle.animation="frame-"+fr.anim+" 2.5s ease-in-out infinite";
      return(<div style={wrapStyle}>{inner}</div>);
    }
    return inner;
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

  // ── SUB-VIEW : CHRONICLES — replay unlocked narrator moments ────────────
  if(view==="chronicles"){
    var heard=(u.narrator&&u.narrator.heard)||[];
    var unlockedOrdered=NARRATOR_ORDER.filter(function(id){return heard.indexOf(id)!==-1;});
    var romanForOrder=function(n){return["I","II","III","IV","V","VI","VII","VIII"][n-1]||String(n);};
    return(
    <div className="enter" style={{padding:"20px 16px 100px"}}>
      <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:20}}>
        <button onClick={function(){setView(null);}} style={{background:"none",border:"none",color:"var(--cyan)",fontSize:22,cursor:"pointer",padding:0,lineHeight:1}}>{"\u2190"}</button>
        <h1 className="out" style={{fontFamily:"'Cinzel',serif",fontWeight:800,fontSize:20,margin:0}}>Chronicles</h1>
      </div>
      <p style={{fontSize:12,color:"var(--t2)",marginTop:0,marginBottom:20,lineHeight:1.5}}>
        {"Revivez les moments-cl\u00e9s narr\u00e9s par Aldric. "+unlockedOrdered.length+"/"+NARRATOR_ORDER.length+" d\u00e9bloqu\u00e9s."}
      </p>
      {unlockedOrdered.length===0?(
        <div className="crd" style={{padding:"24px 18px",textAlign:"center"}}>
          <div style={{fontSize:32,marginBottom:10,opacity:.5}}>{"\uD83D\uDCDC"}</div>
          <div className="out" style={{fontWeight:700,fontSize:14,color:"var(--t1)",marginBottom:6}}>No chapters yet</div>
          <div style={{fontSize:12,color:"var(--t2)",lineHeight:1.5}}>
            {"Entra\u00eenez-vous, ouvrez des coffres, gravissez les ligues — Aldric interviendra aux moments-cl\u00e9s."}
          </div>
        </div>
      ):(
        <div style={{display:"flex",flexDirection:"column",gap:10}}>
          {unlockedOrdered.map(function(id){
            var m=NARRATOR_MOMENTS[id];
            return(
              <button key={id} onClick={function(){if(p.replayNarrator)p.replayNarrator(id);}} style={{
                display:"flex",alignItems:"center",gap:12,
                padding:"12px 14px",
                background:"linear-gradient(135deg,rgba(232,212,168,0.06),rgba(138,112,64,0.04))",
                border:"1px solid rgba(180,150,100,0.25)",
                borderRadius:10,cursor:"pointer",textAlign:"left",width:"100%"
              }}>
                <span className="out" style={{fontSize:11,color:"var(--gold)",fontFamily:"'Cinzel',serif",letterSpacing:1.5,fontWeight:800,minWidth:36,textAlign:"center"}}>
                  {romanForOrder(m.order)}
                </span>
                <div style={{flex:1,minWidth:0}}>
                  <div className="out" style={{fontSize:14,fontWeight:700,color:"var(--t1)",fontFamily:"'Cinzel',serif",letterSpacing:.5}}>{m.title}</div>
                  <div style={{fontSize:11,color:"var(--t2)",marginTop:2}}>{m.chapterTitle}</div>
                </div>
                <span style={{fontSize:14,color:"var(--gold)",flexShrink:0}}>{"\u25b6"}</span>
              </button>
            );
          })}
        </div>
      )}
    </div>);
  }

  // ── SUB-VIEW : FEEDBACK ────────────────────────────────────────────────
  // POSTs to /api/feedback-send which inserts in feedback_reports + emails
  // leixa.formation@gmail.com (Resend). The form is intentionally minimal:
  // type / module / message. Pseudo is auto-filled from u.name (editable).
  if(view==="feedback"){
    return(<FeedbackForm u={u} back={function(){setView(null);}}/>);
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
              {toeicNA?<span style={{color:"var(--t3)"}}>{"\u2014"}</span>:<span>{toeic.total}<span style={{fontSize:14,color:"var(--t3)",fontWeight:400}}>/990</span></span>}
            </div>
            {toeic.estimable===false&&<div style={{fontSize:10,color:"var(--t3)",marginTop:4}}>{toeicRemain!==null?("Estimation available after ~"+toeicRemain+" more questions or a Mock test."):"Estimation available after a Mock test or more training."}</div>}
            {toeic.estimable==="partial"&&<div style={{fontSize:10,color:"var(--t3)",marginTop:4}}>{"Total score available after activity in the other section."}</div>}
            {toeic.estimable===true&&toeic.total<=200&&<div style={{fontSize:10,color:"var(--t3)",marginTop:4}}>{"Complete more modules to refine your score"}</div>}
          </div>
          <div style={{textAlign:"right"}}>
            <div style={{display:"flex",gap:16,marginBottom:4}}>
              <div style={{textAlign:"center"}}><div className="out" style={{fontWeight:700,fontSize:18,color:"var(--cyan)"}}>{toeic.listening!==null?toeic.listening:"\u2014"}</div><div style={{fontSize:9,color:"var(--t3)"}}>Listening</div></div>
              <div style={{textAlign:"center"}}><div className="out" style={{fontWeight:700,fontSize:18,color:"var(--purple)"}}>{toeic.reading!==null?toeic.reading:"\u2014"}</div><div style={{fontSize:9,color:"var(--t3)"}}>Reading</div></div>
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
          {/* Re-scan CTA — Phase F (scan-v2). Unlocked at J+30 from u.battleScan.date.
              The actual re-scan UI ships in a follow-up iteration; for now the button
              acknowledges the gate and explains what's coming. */}
          {(function(){
            var scanDate=bs.date;
            if(!scanDate)return null;
            // Compute days since (cheap; today() is "YYYY-MM-DD")
            var d1=new Date(scanDate),d2=new Date(today());
            var daysSince=Math.floor((d2-d1)/(86400000));
            var unlocked=daysSince>=30;
            var daysLeft=Math.max(0,30-daysSince);
            var hist=bs.history&&bs.history.length?bs.history.length:0;
            return(<div style={{marginTop:12,paddingTop:12,borderTop:"1px solid var(--bdr)"}}>
              {hist>0&&<div style={{fontSize:10,color:"var(--t3)",marginBottom:8}}>{hist+" previous scan"+(hist>1?"s":"")+" in history"}</div>}
              <button disabled={!unlocked}
                onClick={function(){if(unlocked){alert("Re-scan flow ships in the next iteration. Your data model is ready (u.battleScan.history will hold previous scans).");}}}
                style={{width:"100%",padding:"10px 14px",background:unlocked?"rgba(var(--cx),.10)":"var(--bg3)",border:"1px solid "+(unlocked?"rgba(var(--cx),.30)":"var(--bdr)"),borderRadius:10,cursor:unlocked?"pointer":"not-allowed",fontSize:12,fontWeight:700,color:unlocked?"var(--cyan)":"var(--t3)",fontFamily:"'DM Sans',sans-serif"}}>
                {unlocked?"Re-scan now (coming soon)":"Re-scan available in "+daysLeft+" day"+(daysLeft>1?"s":"")}
              </button>
              <p style={{fontSize:10,color:"var(--t3)",margin:"8px 0 0",lineHeight:1.5,fontStyle:"italic"}}>{"A re-scan saves your current radar to history so you can see your progression over time."}</p>
            </div>);
          })()}
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
          {/* Hauteur réservée pendant le chargement du chunk : aucun saut de layout. */}
          <Suspense fallback={<div style={{height:Math.max(160,active.length*32)}}/>}><ProfileChartsLazy active={active}/></Suspense>
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
  if(view==="style"){
    var ownedAvatars=invData?invData.filter(function(r){return r.reward_type==="avatar";}):[];
    var ownedSkins=invData?invData.filter(function(r){return r.reward_type==="skin";}):[];
    // V2 — overlay : tap a cheat sheet card → open as a single-chapter grimoire
    var csNow=csOpen&&CHEAT_SHEETS[csOpen];
    // V2 — collapsible banner helper : each Collection section is a tappable header
    // ("Avatars 8/32  ▾") that reveals its content on toggle. Lighter UI as content grows.
    function secBanner(key,title,count,total,content){
      var open=collOpen[key];
      return(<div key={key} style={{marginBottom:10,borderRadius:12,border:"1px solid var(--bdr)",overflow:"hidden",background:"var(--bg2)"}}>
        <button onClick={function(){var nv={};nv[key]=!open;setCollOpen(Object.assign({},collOpen,nv));}}
          style={{width:"100%",display:"flex",alignItems:"center",justifyContent:"space-between",padding:"14px 16px",background:"transparent",border:"none",cursor:"pointer",color:"var(--t1)",fontFamily:"inherit"}}>
          <span style={{fontSize:11,fontWeight:700,textTransform:"uppercase",letterSpacing:1.5,color:"var(--t2)"}}>
            {title} <span style={{color:"var(--t3)",marginLeft:4,fontWeight:600}}>{count}/{total}</span>
          </span>
          <span style={{fontSize:14,color:"var(--cyan)",display:"inline-block",transform:open?"rotate(0deg)":"rotate(-90deg)",transition:"transform .2s"}}>{"▾"}</span>
        </button>
        {open&&<div style={{padding:"4px 14px 16px",borderTop:"1px solid var(--bdr)"}}>{content}</div>}
      </div>);
    }
    return(<>
    {csNow&&<GrimoireReader grimoire={{title:csNow.name,subtitle:"Cheat Sheet",icon:csNow.icon||"📜",chapters:[{id:"main",title:csNow.name,intro:"",blocks:csNow.blocks||[]}]}} back={function(){setCsOpen(null);}}/>}
    <div className="enter" style={{padding:"20px 16px 100px"}}>
      <input ref={fileRef} type="file" accept="image/*" style={{display:"none"}} onChange={handlePhotoUpload}/>
      <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:24}}>
        <button onClick={function(){setView(null);}} style={{background:"none",border:"none",color:"var(--cyan)",fontSize:22,cursor:"pointer",padding:0,lineHeight:1}}>{"\u2190"}</button>
        <h1 className="out" style={{fontWeight:800,fontSize:20,margin:0}}>Style</h1>
      </div>
      <div style={{textAlign:"center",marginBottom:28}}>
        <div style={{position:"relative",display:"inline-block",marginBottom:16}}>
          {renderAvatar(96,48)}
          <button onClick={function(){fileRef.current.click();}}
            style={{position:"absolute",bottom:0,right:0,width:30,height:30,borderRadius:"50%",
              background:"var(--cyan)",border:"2px solid var(--bg)",cursor:"pointer",fontSize:14,
              display:"flex",alignItems:"center",justifyContent:"center"}}>{"\ud83d\udcf7"}</button>
        </div>
        <div style={{display:"flex",justifyContent:"center",gap:10,marginBottom:8}}>
          <button onClick={function(){fileRef.current.click();}} className="btn1"
            style={{fontSize:12,padding:"8px 18px"}}>{"\ud83d\udcf7"} Import a photo</button>
          {isPhoto&&<button onClick={function(){var c=JSON.parse(JSON.stringify(u));c.avatar="\u2694\ufe0f";p.setAvatar(c);}}
            className="btn2" style={{fontSize:12,padding:"8px 18px",color:"var(--red)",borderColor:"rgba(255,71,87,.2)"}}>{"\u2715"} Remove</button>}
        </div>
        <div style={{fontSize:11,color:"var(--t3)"}}>Photo resized {"\u00b7"} stored locally</div>
      </div>
      <div style={{fontSize:10,color:"var(--t3)",fontWeight:600,letterSpacing:1,textTransform:"uppercase",marginBottom:12}}>or pick an emoji</div>
      <div style={{display:"flex",gap:8,flexWrap:"wrap",marginBottom:16}}>
        {["\u2694\ufe0f","\ud83e\uddd9","\ud83e\udd8a","\ud83d\udc09","\ud83c\udfaf","\ud83c\udfc6","\ud83e\udd85","\ud83d\udc8e","\ud83d\udd25","\ud83c\udf1f","\ud83c\udfad","\ud83d\udc3a","\ud83e\udd81","\ud83c\udfaa","\ud83d\udc64","\ud83e\udde0","\ud83c\udfb2","\ud83e\udd89","\ud83d\udc32","\ud83d\udde1\ufe0f","\ud83c\udff4\u200d\u2620\ufe0f","\u26a1","\ud83e\udd88","\ud83c\udf00","\ud83c\udfb8"].map(function(av){
          var sel=!isPhoto&&av===(u.avatar||"\u2694\ufe0f");
          return(<button key={av} onClick={function(){var c=JSON.parse(JSON.stringify(u));c.avatar=av;p.setAvatar(c);}}
            style={{width:48,height:48,borderRadius:14,border:sel?"2px solid var(--cyan)":"2px solid var(--bdr)",
              background:sel?"rgba(var(--cx),.1)":"var(--bg2)",cursor:"pointer",fontSize:24,
              display:"flex",alignItems:"center",justifyContent:"center",transition:"all .2s"}}>
            {av}</button>);
        })}
        {u.name==="Teacher"&&(function(){
          var sel=!isPhoto&&u.avatar==="\ud83d\udddd\ufe0f";
          return(<button onClick={function(){var c=JSON.parse(JSON.stringify(u));c.avatar="\ud83d\udddd\ufe0f";p.setAvatar(c);}}
            style={{width:48,height:48,borderRadius:14,
              border:sel?"2px solid var(--gold)":"2px solid rgba(255,215,0,.3)",
              background:sel?"rgba(255,215,0,.15)":"rgba(255,215,0,.05)",cursor:"pointer",fontSize:24,
              display:"flex",alignItems:"center",justifyContent:"center",transition:"all .2s",
              boxShadow:sel?"0 0 12px rgba(255,215,0,.3)":"none"}}>
            {"\ud83d\udddd\ufe0f"}</button>);
        })()}
      </div>
      {u.name==="Teacher"&&<div style={{fontSize:11,color:"var(--gold)",marginBottom:16,fontStyle:"italic"}}>{"\ud83d\udddd\ufe0f Game Master \u2014 exclusive avatar"}</div>}

      {invLoading&&<p style={{color:"var(--t3)",textAlign:"center",padding:40}}>Loading...</p>}

      {!invLoading&&<>
        {/* Owned avatars — equip + ×N dup badge */}
        {ownedAvatars.length>0&&<>
          <div style={{fontSize:10,color:"var(--t3)",fontWeight:600,letterSpacing:1,textTransform:"uppercase",marginBottom:8}}>Chest avatars</div>
          <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(72px,1fr))",gap:8,marginBottom:20}}>
            {(function(){var d={};ownedAvatars.forEach(function(r){if(!d[r.reward_id])d[r.reward_id]={row:r,count:0};d[r.reward_id].count++;});return Object.values(d);})().map(function(grp){
              var r=grp.row;var av=AVATARS[r.reward_id];if(!av)return null;
              var rarity=RARITIES.find(function(rt){return rt.id===r.rarity;})||RARITIES[0];
              var isEquipped=u.avatar===r.reward_id;
              return(<button key={r.reward_id} onClick={function(){var c=JSON.parse(JSON.stringify(u));c.avatar=r.reward_id;p.setAvatar(c);}}
                style={{position:"relative",display:"flex",flexDirection:"column",alignItems:"center",gap:4,padding:8,borderRadius:12,cursor:"pointer",background:isEquipped?"rgba(var(--cx),.1)":"var(--bg2)",border:isEquipped?"2px solid var(--cx-hex)":"1px solid var(--bdr)",fontFamily:"'DM Sans',sans-serif"}}>
                <AvatarMedal avatarId={r.reward_id} size={40}/>
                <div style={{fontSize:9,fontWeight:700,color:rarity.color,textAlign:"center"}}>{av.name}</div>
                {isEquipped&&<div style={{fontSize:7,color:"var(--cyan)",fontWeight:700,textTransform:"uppercase"}}>Equipped</div>}
                {grp.count>1&&<span style={{position:"absolute",top:4,right:4,fontSize:9,fontWeight:800,color:"#ffc020",background:"rgba(0,0,0,.75)",padding:"2px 5px",borderRadius:8,letterSpacing:.5}}>{"×"+grp.count}</span>}
              </button>);
            })}
          </div>
        </>}

        {/* ── FESTIVAL THEME (2026-09-16) ── visible pendant une fenêtre (ou un forçage ?fest=), hors
            fenêtre rien. La fête masque le skin équipé sans le modifier : la tuile garde « Equipped ». */}
        {festWin&&<div className="crd" style={{padding:14,marginBottom:16,background:"rgba(var(--cx),.08)",border:"1px solid rgba(var(--cx),.22)"}}>
          <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:12}}>
            <span style={{display:"flex",flexShrink:0}}><GIcon name={festWin.icon} size={22} color="var(--cyan)"/></span>
            <div style={{fontSize:12,color:"var(--t2)",lineHeight:1.5,flex:1,minWidth:0}}>
              <span className="out" style={{fontWeight:700,color:"var(--cyan)"}}>{festWin.name}</span>
              {festOn
                ?" is on until "+festEnd+". "+(u.equippedSkin&&SKINS[u.equippedSkin]?"Your "+SKINS[u.equippedSkin].name+" skin is kept and comes back after.":"Your usual theme comes back after.")
                :" runs until "+festEnd+". Seasonal themes are off."}
            </div>
          </div>
          <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",paddingTop:10,borderTop:"1px solid var(--bdr)"}}>
            <div className="out" style={{fontWeight:700,fontSize:13}}>Seasonal themes</div>
            {Toggle(festOn,function(){p.setFestivals(!festOn);})}
          </div>
        </div>}

        {/* ── SKINS (equip) ── */}
        <div style={{fontSize:10,color:"var(--t3)",fontWeight:600,letterSpacing:1,textTransform:"uppercase",marginBottom:8}}>Skin</div>
        {ownedSkins.length===0&&<div className="crd" style={{padding:16,textAlign:"center",marginBottom:20}}><p style={{color:"var(--t3)",fontSize:12}}>No skin yet. Buy one in the Shop or open Rare+ chests.</p></div>}
        {ownedSkins.length>0&&<div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(90px,1fr))",gap:8,marginBottom:12}}>
          {(function(){var d={};ownedSkins.forEach(function(r){if(!d[r.reward_id])d[r.reward_id]={row:r,count:0};d[r.reward_id].count++;});return Object.values(d);})().map(function(grp){
            var r=grp.row;var sk=SKINS[r.reward_id];if(!sk)return null;
            var rarity=RARITIES.find(function(rt){return rt.id===sk.rarity;})||RARITIES[0];
            var isEquipped=u.equippedSkin===r.reward_id;
            return(<button key={r.reward_id} onClick={function(){var c=JSON.parse(JSON.stringify(u));c.equippedSkin=isEquipped?null:r.reward_id;p.setAvatar(c);}}
              style={{position:"relative",display:"flex",flexDirection:"column",alignItems:"center",gap:6,padding:10,borderRadius:14,cursor:"pointer",background:isEquipped?"rgba(var(--cx),.1)":"var(--bg2)",border:isEquipped?"2px solid "+sk.hex:"1px solid var(--bdr)",fontFamily:"'DM Sans',sans-serif"}}>
              <div style={{width:44,height:44,borderRadius:10,background:"linear-gradient(135deg,"+sk.hex+","+sk.dark+")",border:"2px solid "+rarity.color}}/>
              <div style={{fontSize:10,fontWeight:700,color:rarity.color}}>{sk.name}</div>
              {isEquipped&&<div style={{fontSize:7,color:"var(--cyan)",fontWeight:700,textTransform:"uppercase"}}>Equipped</div>}
              {grp.count>1&&<span style={{position:"absolute",top:4,right:4,fontSize:9,fontWeight:800,color:"#ffc020",background:"rgba(0,0,0,.75)",padding:"2px 5px",borderRadius:8,letterSpacing:.5}}>{"×"+grp.count}</span>}
            </button>);
          })}
        </div>}
        {u.equippedSkin&&<button className="btn2" onClick={function(){var c=JSON.parse(JSON.stringify(u));c.equippedSkin=null;p.setAvatar(c);}} style={{width:"100%",marginBottom:20,fontSize:12}}>Remove current skin</button>}

        {/* ── FRAME (equip) ── */}
        <div style={{fontSize:10,color:"var(--t3)",fontWeight:600,letterSpacing:1,textTransform:"uppercase",marginBottom:8}}>Frame</div>
        {(function(){
          var ownedFrames=invData?invData.filter(function(r){return r.reward_type==="frame";}):[];
          if(ownedFrames.length===0)return(<div className="crd" style={{padding:16,textAlign:"center",marginBottom:20}}><p style={{color:"var(--t3)",fontSize:12}}>No frame yet. Buy one in the Shop or open Warrior+ chests.</p></div>);
          return(<>
            <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(110px,1fr))",gap:10,marginBottom:12}}>
              {(function(){var d={};ownedFrames.forEach(function(r){if(!d[r.reward_id])d[r.reward_id]={row:r,count:0};d[r.reward_id].count++;});return Object.values(d);})().map(function(grp){
                var r=grp.row;var fr=FRAMES[r.reward_id];if(!fr)return null;
                var rarity=RARITIES.find(function(rt){return rt.id===fr.rarity;})||RARITIES[0];
                var isEquipped=u.equippedFrame===r.reward_id;
                return(<button key={r.reward_id} onClick={function(){var c=JSON.parse(JSON.stringify(u));c.equippedFrame=isEquipped?null:r.reward_id;p.setAvatar(c);}}
                  style={{position:"relative",display:"flex",flexDirection:"column",alignItems:"center",gap:8,padding:10,borderRadius:14,cursor:"pointer",background:isEquipped?"rgba(var(--cx),.1)":"var(--bg2)",border:isEquipped?"2px solid var(--cyan)":"1px solid var(--bdr)",fontFamily:"'DM Sans',sans-serif"}}>
                  <AvatarMedal avatarId="champion" size={48} frameId={r.reward_id}/>
                  <div style={{fontSize:10,fontWeight:700,color:rarity.color,textAlign:"center"}}>{fr.name}</div>
                  {isEquipped&&<div style={{fontSize:7,color:"var(--cyan)",fontWeight:700,textTransform:"uppercase"}}>Equipped</div>}
                  {grp.count>1&&<span style={{position:"absolute",top:4,right:4,fontSize:9,fontWeight:800,color:"#ffc020",background:"rgba(0,0,0,.75)",padding:"2px 5px",borderRadius:8,letterSpacing:.5}}>{"×"+grp.count}</span>}
                </button>);
              })}
            </div>
            {u.equippedFrame&&<button className="btn2" onClick={function(){var c=JSON.parse(JSON.stringify(u));c.equippedFrame=null;p.setAvatar(c);}} style={{width:"100%",marginBottom:20,fontSize:12}}>Remove current frame</button>}
          </>);
        })()}

        {/* ── TITLE (equip) ── */}
        <div style={{fontSize:10,color:"var(--t3)",fontWeight:600,letterSpacing:1,textTransform:"uppercase",marginBottom:8}}>Title</div>
        {(function(){
          var ownedTitles=invData?invData.filter(function(r){return r.reward_type==="title";}):[];
          if(ownedTitles.length===0)return(<div className="crd" style={{padding:16,textAlign:"center",marginBottom:20}}><p style={{color:"var(--t3)",fontSize:12}}>No title yet. Buy one in the Shop or open Warrior+ chests.</p></div>);
          return(<>
            <div style={{display:"flex",flexDirection:"column",gap:6,marginBottom:12}}>
              {(function(){var d={};ownedTitles.forEach(function(r){if(!d[r.reward_id])d[r.reward_id]={row:r,count:0};d[r.reward_id].count++;});return Object.values(d);})().map(function(grp){
                var r=grp.row;var ti=TITLES[r.reward_id];if(!ti)return null;
                var isEquipped=u.equippedTitle===r.reward_id;
                return(<button key={r.reward_id} onClick={function(){var c=JSON.parse(JSON.stringify(u));c.equippedTitle=isEquipped?null:r.reward_id;p.setAvatar(c);}}
                  style={{padding:"10px 14px",borderRadius:10,cursor:"pointer",textAlign:"left",background:isEquipped?"rgba(var(--cx),.1)":"var(--bg2)",border:isEquipped?"2px solid "+tone(ti.color):"1px solid var(--bdr)",fontFamily:"'DM Sans',sans-serif",display:"flex",alignItems:"center",justifyContent:"space-between",gap:8}}>
                  <span style={{fontSize:14,fontWeight:800,color:tone(ti.color),letterSpacing:1,textTransform:"uppercase",flex:1,minWidth:0}}>{ti.name}</span>
                  <div style={{display:"flex",alignItems:"center",gap:8,flexShrink:0}}>
                    {grp.count>1&&<span style={{fontSize:10,fontWeight:800,color:"#ffc020",background:"rgba(0,0,0,.5)",padding:"2px 6px",borderRadius:8}}>{"×"+grp.count}</span>}
                    {isEquipped&&<span style={{fontSize:8,color:"var(--cyan)",fontWeight:700,letterSpacing:1,textTransform:"uppercase"}}>Equipped</span>}
                  </div>
                </button>);
              })}
            </div>
            {u.equippedTitle&&<button className="btn2" onClick={function(){var c=JSON.parse(JSON.stringify(u));c.equippedTitle=null;p.setAvatar(c);}} style={{width:"100%",marginBottom:20,fontSize:12}}>Remove current title</button>}
          </>);
        })()}

        {/* V2 — Consommables (tokens stackables, fetched from player_tokens) */}
        {(function(){
          var totalCap=Object.keys(TOKEN_TYPES).reduce(function(s,tt){return s+(TOKEN_TYPES[tt].cap||0);},0);
          var totalOwned=Object.keys(TOKEN_TYPES).reduce(function(s,tt){return s+(invTokens[tt]||0);},0);
          var nonPremium=Object.keys(TOKEN_TYPES).filter(function(tt){return!TOKEN_TYPES[tt].premium;});
          var premium=Object.keys(TOKEN_TYPES).filter(function(tt){return TOKEN_TYPES[tt].premium;});
          // V2 — which tokens are usable from the Collection (others are in-context or passive)
          var COLLECTION_ACTIONABLE={daily_reroll:true,diminishing_bypass:true,insight_token:true,module_booster:true,mock_multiplier:true,daily_doubler:true};
          var IN_CONTEXT_HINT={
            mock_reset:"Used on the locked Mock Test screen",
            boss_reset:"Used on the locked Boss Test screen",
            endless_resurrect:"Used during the Endless Arena",
            streak_shield:"Automatic — protects your streak on a 1-day miss",
          };
          function tokenCard(tt,isPremium){
            var info=TOKEN_TYPES[tt];var qty=invTokens[tt]||0;var cap=info.cap||1;var pct=Math.min(100,Math.round(qty/cap*100));
            var owned=qty>0;
            var clickable=owned&&COLLECTION_ACTIONABLE[tt];
            var hint=IN_CONTEXT_HINT[tt]||info.desc;
            // V2 — surface armed flags on each token's card so the user remembers what's queued
            if(tt==="diminishing_bypass"&&u.bypassArmedModule){
              var armedMod=MISSION_MODULES.find(function(m){return m.id===u.bypassArmedModule;});
              hint="🔓 Armed on "+(armedMod?armedMod.name:u.bypassArmedModule)+" — burns next round";
            }
            else if(tt==="mock_reset"&&u.mockResetArmed){hint="🎟️ Armed — bypass on next Mock played";}
            else if(tt==="boss_reset"&&u.bossResetArmed){hint="🐲 Armed — enter the Boss arena";}
            else if(tt==="endless_resurrect"&&u.endlessResetArmed){hint="💎 Armed — replay Endless";}
            else if(tt==="module_booster"&&u.boosts&&u.boosts.moduleBoostArmed){var mbm=MISSION_MODULES.find(function(m){return m.id===u.boosts.moduleBoostArmed;});hint="🚀 Armed on "+(mbm?mbm.name:u.boosts.moduleBoostArmed)+" — +50% next session";}
            else if(tt==="mock_multiplier"&&u.boosts&&u.boosts.mockMultArmed){hint="📈 Armed — ×1.5 on next Mock or Boss";}
            else if(tt==="daily_doubler"&&u.boosts&&u.boosts.dailyDoublerUntil&&Date.now()<u.boosts.dailyDoublerUntil){var ddm=Math.max(0,Math.round((u.boosts.dailyDoublerUntil-Date.now())/60000));hint="⏫ Active — ×2 XP ("+(ddm>=60?Math.round(ddm/60)+"h":ddm+"m")+" left)";}
            var bg=owned?(isPremium?"rgba(255,192,32,.05)":"rgba(var(--cx),.04)"):(isPremium?"rgba(255,192,32,.02)":"var(--bg3)");
            var bdr=owned?(isPremium?"rgba(255,192,32,.25)":"var(--bdr)"):(isPremium?"rgba(255,192,32,.1)":"var(--bdr)");
            var fill=isPremium?"#ffc020":"var(--cyan)";
            var qtyCol=!owned?"var(--t3)":(isPremium?"#ffc020":"var(--cyan)");
            return(<div key={tt} onClick={clickable?function(){setUseTokenAsk(tt);}:undefined} style={{position:"relative",display:"flex",alignItems:"center",gap:10,padding:"10px 12px",borderRadius:12,border:"1px solid "+bdr,background:bg,opacity:owned?1:0.45,cursor:clickable?"pointer":"default"}}>
              <div style={{fontSize:24,flexShrink:0,width:32,textAlign:"center"}}>{info.icon}</div>
              <div style={{flex:1,minWidth:0}}>
                <div style={{fontSize:12,fontWeight:700,color:owned?"var(--t1)":"var(--t3)",marginBottom:4,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{info.name}</div>
                <div style={{height:4,background:"var(--bg3)",borderRadius:2,overflow:"hidden",marginBottom:4}}>
                  <div style={{height:"100%",background:fill,borderRadius:2,width:pct+"%"}}/>
                </div>
                <div style={{fontSize:10,fontWeight:700,color:"var(--t2)",display:"flex",justifyContent:"space-between"}}>
                  <span>Stack</span>
                  <span><span style={{color:qtyCol}}>{qty}</span> / {cap}</span>
                </div>
                <div style={{fontSize:10,color:"var(--t3)",marginTop:6,lineHeight:1.4,borderTop:"1px dashed var(--bdr)",paddingTop:6}}>{hint}</div>
                {clickable&&<div style={{fontSize:9,fontWeight:700,color:fill,marginTop:6,letterSpacing:1,textTransform:"uppercase"}}>Tap to use →</div>}
              </div>
            </div>);
          }
          return secBanner("tokens","Consumables",totalOwned,totalCap,
            <>
              <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:10}}>
                <span style={{fontSize:10,color:"var(--t3)",fontWeight:700,textTransform:"uppercase",letterSpacing:1.5}}>Tactical</span>
                <span style={{flex:1,height:1,background:"var(--bdr)"}}/>
              </div>
              <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(160px,1fr))",gap:10,marginBottom:18}}>
                {nonPremium.map(function(tt){return tokenCard(tt,false);})}
              </div>
              <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:10}}>
                <span style={{fontSize:10,color:"#ffc020",fontWeight:700,textTransform:"uppercase",letterSpacing:1.5}}>Premium</span>
                <span style={{flex:1,height:1,background:"var(--bdr)"}}/>
              </div>
              <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(160px,1fr))",gap:10}}>
                {premium.map(function(tt){return tokenCard(tt,true);})}
              </div>
            </>
          );
        })()}

        {/* V2 — Cheat Sheets (collapsible banner, clickable card opens GrimoireReader) */}
        {(function(){
          var ownedCS=invData?invData.filter(function(r){return r.reward_type==="cheat_sheet";}):[];
          return secBanner("cheatSheets","Cheat Sheets",ownedCS.length,Object.keys(CHEAT_SHEETS).length,
            <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(140px,1fr))",gap:10}}>
              {Object.keys(CHEAT_SHEETS).map(function(csid){
                var cs=CHEAT_SHEETS[csid];var owned=ownedCS.some(function(r){return r.reward_id===csid;});
                var rarity=RARITIES.find(function(rt){return rt.id===cs.rarity;})||RARITIES[0];
                return(<button key={csid} disabled={!owned} onClick={function(){if(owned)setCsOpen(csid);}} style={{display:"flex",flexDirection:"column",alignItems:"center",gap:6,padding:14,borderRadius:12,cursor:owned?"pointer":"default",opacity:owned?1:0.3,background:owned?"rgba(var(--cx),.04)":"var(--bg3)",border:"1px solid "+(owned?rarity.color:"var(--bdr)")}}>
                  <div style={{fontSize:32}}>{cs.icon||"📜"}</div>
                  <div style={{fontSize:11,fontWeight:700,color:owned?"var(--t1)":"var(--t3)",textAlign:"center",lineHeight:1.3}}>{cs.name}</div>
                  {owned&&<div style={{fontSize:8,color:rarity.color,fontWeight:700,letterSpacing:1,textTransform:"uppercase"}}>Tap to read</div>}
                </button>);
              })}
            </div>
          );
        })()}

        {/* V2 step 5 — Conversions entry, moved into the Collection (was on Profile home).
            Placed after all banners so it sits "at the end of the catalog" — natural
            destination once the user has spotted dups via the ×N badges above. */}
        {/* Convert duplicates — the conversions UI now lives in the Shop */}
        <button onClick={function(){p.goShop&&p.goShop();}} className="crd"
          style={{width:"100%",padding:"12px 16px",marginTop:14,textAlign:"left",cursor:"pointer",
            background:"linear-gradient(135deg,rgba(255,192,32,.08),rgba(220,58,80,.05))",
            border:"1px solid rgba(255,192,32,.25)",display:"flex",alignItems:"center",gap:12}}>
          <span style={{fontSize:24,flexShrink:0}}>{"⚖️"}</span>
          <div style={{flex:1,minWidth:0}}>
            <div className="out" style={{fontWeight:800,fontSize:14,color:"#ffc020"}}>Convert duplicates</div>
            <div style={{fontSize:11,color:"var(--t2)",marginTop:1}}>Dups → tokens · 5 tokens → premium · in the Shop</div>
          </div>
          <span style={{fontSize:18,color:"var(--t3)"}}>{"›"}</span>
        </button>

        {/* ── THEME ── */}
        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"12px 0",marginTop:8}}>
          <div>
            <div className="out" style={{fontWeight:700,fontSize:13}}>Mode</div>
            <div style={{fontSize:11,color:"var(--t2)"}}>{u.theme==="light"?"Light":"Dark"}</div>
          </div>
          {Toggle(u.theme==="light",function(){var c=JSON.parse(JSON.stringify(u));c.theme=c.theme==="light"?"dark":"light";p.setAvatar(c);})}
        </div>
      </>}
    </div>
    {/* V2 — Multi-flow confirm modal for actionable tokens (Daily Reroll / Bypass / Insight) */}
    {useTokenAsk&&TOKEN_TYPES[useTokenAsk]&&(function(){
      var info=TOKEN_TYPES[useTokenAsk];var qty=invTokens[useTokenAsk]||0;
      function closeAll(){setUseTokenAsk(null);setBypassPick(null);setInsightResult(null);}
      function applyConsume(tt,onSuccess){
        consumeToken(u.name,u.classCode||"visitor",tt,1).then(function(res){
          if(!res.ok){
            setTokenToast({err:true,msg:"Failed: "+(res.error||"unknown")});
            setTimeout(function(){setTokenToast(null);},2400);
            closeAll();return;
          }
          setInvTokens(Object.assign({},invTokens,{[tt]:Math.max(0,(invTokens[tt]||0)-1)}));
          onSuccess();
        });
      }
      // ── Flow 1 : Daily Reroll ──
      if(useTokenAsk==="daily_reroll"){
        function doDailyReroll(){
          applyConsume("daily_reroll",function(){
            var c=JSON.parse(JSON.stringify(u));
            var prevMission=c.mission||{};
            c.mission=Object.assign({},prevMission,{date:null,actId:null,done:false,rerollCount:((prevMission.rerollCount)||0)+1});
            p.setAvatar(c);
            setTokenToast({err:false,msg:"🎲 Mission rerolled!"});setTimeout(function(){setTokenToast(null);},2400);
            closeAll();
          });
        }
        return(<div style={{position:"fixed",inset:0,background:"rgba(0,0,0,.7)",backdropFilter:"blur(4px)",zIndex:9999,display:"flex",alignItems:"center",justifyContent:"center",padding:20}} onClick={function(e){if(e.target===e.currentTarget)closeAll();}}>
          <div className="crd" style={{maxWidth:340,padding:20,textAlign:"center",border:"1px solid var(--bdr)"}}>
            <div style={{fontSize:48,marginBottom:12}}>{info.icon}</div>
            <h2 className="out" style={{fontSize:18,fontWeight:800,marginBottom:8}}>Use {info.name}?</h2>
            <p style={{fontSize:13,color:"var(--t2)",marginBottom:6,lineHeight:1.5}}>{info.desc}</p>
            <p style={{fontSize:12,color:"var(--t3)",marginBottom:18}}><strong style={{color:"var(--cyan)"}}>{Math.max(0,qty-1)} / {info.cap}</strong> will remain after use.</p>
            <div style={{display:"flex",gap:10,justifyContent:"center"}}>
              <button onClick={closeAll} className="btn2" style={{flex:1,fontSize:13,padding:"10px 16px"}}>Cancel</button>
              <button onClick={doDailyReroll} className="btn1" style={{flex:1,fontSize:13,padding:"10px 16px"}}>Use</button>
            </div>
          </div>
        </div>);
      }
      // ── Flow 2 : Bypass Token ──
      if(useTokenAsk==="diminishing_bypass"){
        var dms=u.dailyModSessions||{};var td=today();
        // Step 1 : module selector. List MISSION_MODULES, sorted by today's session count (most farmed first).
        var modList=MISSION_MODULES.slice().map(function(m){
          var key=m.id+"_"+td;var cnt=dms[key]||0;
          var nextMult=cnt===0?1:cnt===1?0.5:cnt===2?0.15:0;
          return{m:m,cnt:cnt,nextMult:nextMult};
        }).sort(function(a,b){return b.cnt-a.cnt;});
        if(!bypassPick){
          return(<div style={{position:"fixed",inset:0,background:"rgba(0,0,0,.7)",backdropFilter:"blur(4px)",zIndex:9999,display:"flex",alignItems:"center",justifyContent:"center",padding:20}} onClick={function(e){if(e.target===e.currentTarget)closeAll();}}>
            <div className="crd" style={{maxWidth:380,maxHeight:"80vh",overflowY:"auto",padding:20,border:"1px solid var(--bdr)"}}>
              <div style={{textAlign:"center",marginBottom:12}}>
                <div style={{fontSize:48,marginBottom:8}}>{info.icon}</div>
                <h2 className="out" style={{fontSize:18,fontWeight:800,marginBottom:6}}>Bypass Token — pick a module</h2>
                <p style={{fontSize:12,color:"var(--t2)",lineHeight:1.5}}>The chosen module will earn <strong style={{color:"var(--cyan)"}}>100% XP</strong> on its next session, ignoring diminishing returns.</p>
              </div>
              <div style={{display:"flex",flexDirection:"column",gap:6,marginBottom:14}}>
                {modList.map(function(item){
                  var mult=Math.round(item.nextMult*100);
                  var hot=item.cnt>=1;
                  var ico=item.m.icon;
                  return(<button key={item.m.id} onClick={function(){setBypassPick(item.m.id);}}
                    style={{padding:"10px 12px",borderRadius:10,cursor:"pointer",textAlign:"left",border:"1px solid "+(hot?"rgba(255,158,61,.3)":"var(--bdr)"),background:hot?"rgba(255,158,61,.06)":"var(--bg2)",display:"flex",alignItems:"center",gap:10}}>
                    <span style={{width:22,display:"inline-flex",alignItems:"center",justifyContent:"center",fontSize:18}}>{GAME_ICON_PATHS[ico]?<GIcon name={ico} size={20} color="var(--cyan)"/>:ico}</span>
                    <span style={{flex:1,fontSize:13,fontWeight:700,color:"var(--t1)"}}>{item.m.name}</span>
                    <span style={{fontSize:10,color:hot?"var(--orange)":"var(--t3)",fontWeight:700}}>{item.cnt} today · next {mult}%</span>
                  </button>);
                })}
              </div>
              <button onClick={closeAll} className="btn2" style={{width:"100%",fontSize:13,padding:"10px 16px"}}>Cancel</button>
            </div>
          </div>);
        }
        // Step 2 : confirm
        var pickedMod=MISSION_MODULES.find(function(m){return m.id===bypassPick;})||{name:bypassPick,icon:"🎯"};
        function doBypassArm(){
          applyConsume("diminishing_bypass",function(){
            var c=JSON.parse(JSON.stringify(u));c.bypassArmedModule=bypassPick;
            p.setAvatar(c);
            setTokenToast({err:false,msg:"🔓 Bypass armed on "+pickedMod.name});setTimeout(function(){setTokenToast(null);},2800);
            closeAll();
          });
        }
        return(<div style={{position:"fixed",inset:0,background:"rgba(0,0,0,.7)",backdropFilter:"blur(4px)",zIndex:9999,display:"flex",alignItems:"center",justifyContent:"center",padding:20}} onClick={function(e){if(e.target===e.currentTarget)closeAll();}}>
          <div className="crd" style={{maxWidth:340,padding:20,textAlign:"center",border:"1px solid var(--bdr)"}}>
            <div style={{marginBottom:8,height:48,display:"flex",alignItems:"center",justifyContent:"center",fontSize:40}}>{GAME_ICON_PATHS[pickedMod.icon]?<GIcon name={pickedMod.icon} size={44} color="var(--cyan)"/>:pickedMod.icon}</div>
            <h2 className="out" style={{fontSize:18,fontWeight:800,marginBottom:8}}>Arm Bypass on <span style={{color:"var(--cyan)"}}>{pickedMod.name}</span>?</h2>
            <p style={{fontSize:13,color:"var(--t2)",marginBottom:6,lineHeight:1.5}}>Your next {pickedMod.name} session will ignore diminishing returns. Burns automatically at the end of the round.</p>
            <p style={{fontSize:12,color:"var(--t3)",marginBottom:18}}><strong style={{color:"var(--cyan)"}}>{Math.max(0,qty-1)} / {info.cap}</strong> Bypass tokens will remain after use.</p>
            <div style={{display:"flex",gap:10,justifyContent:"center"}}>
              <button onClick={function(){setBypassPick(null);}} className="btn2" style={{flex:1,fontSize:13,padding:"10px 16px"}}>{"← Module"}</button>
              <button onClick={doBypassArm} className="btn1" style={{flex:1,fontSize:13,padding:"10px 16px"}}>Arm</button>
            </div>
          </div>
        </div>);
      }
      // ── Flow 3 : Insight Token ──
      if(useTokenAsk==="insight_token"){
        if(insightResult){
          // Display the generated insight
          return(<div style={{position:"fixed",inset:0,background:"rgba(0,0,0,.7)",backdropFilter:"blur(4px)",zIndex:9999,display:"flex",alignItems:"center",justifyContent:"center",padding:20}} onClick={function(e){if(e.target===e.currentTarget)closeAll();}}>
            <div className="crd" style={{maxWidth:380,padding:24,border:"1px solid rgba(255,192,32,.3)",background:"linear-gradient(135deg,rgba(255,192,32,.06),rgba(160,90,220,.04))"}}>
              <div style={{fontSize:48,marginBottom:12,textAlign:"center"}}>{"🔮"}</div>
              <h2 className="out" style={{fontSize:18,fontWeight:800,marginBottom:14,textAlign:"center",color:"var(--gold)"}}>Personal Insight</h2>
              <p style={{fontSize:13,color:"var(--t1)",marginBottom:20,lineHeight:1.7}}>{insightResult}</p>
              <button onClick={closeAll} className="btn1" style={{width:"100%",fontSize:13,padding:"10px 16px"}}>Got it</button>
            </div>
          </div>);
        }
        // Step 1 : confirm consume
        function doInsight(){
          applyConsume("insight_token",function(){
            // Generate the insight (heuristic on moduleScores)
            var insight=generateInsight(u);
            // Persist insight history on the profile so the user can reread later (V2.1 viewer)
            var c=JSON.parse(JSON.stringify(u));
            c.insights=(c.insights||[]).concat([{date:today(),text:insight}]);
            if(c.insights.length>20)c.insights=c.insights.slice(-20);
            p.setAvatar(c);
            setInsightResult(insight);
          });
        }
        return(<div style={{position:"fixed",inset:0,background:"rgba(0,0,0,.7)",backdropFilter:"blur(4px)",zIndex:9999,display:"flex",alignItems:"center",justifyContent:"center",padding:20}} onClick={function(e){if(e.target===e.currentTarget)closeAll();}}>
          <div className="crd" style={{maxWidth:340,padding:20,textAlign:"center",border:"1px solid var(--bdr)"}}>
            <div style={{fontSize:48,marginBottom:12}}>{info.icon}</div>
            <h2 className="out" style={{fontSize:18,fontWeight:800,marginBottom:8}}>Use {info.name}?</h2>
            <p style={{fontSize:13,color:"var(--t2)",marginBottom:6,lineHeight:1.5}}>{info.desc}</p>
            <p style={{fontSize:12,color:"var(--t3)",marginBottom:18}}><strong style={{color:"var(--gold)"}}>{Math.max(0,qty-1)} / {info.cap}</strong> will remain after use.</p>
            <div style={{display:"flex",gap:10,justifyContent:"center"}}>
              <button onClick={closeAll} className="btn2" style={{flex:1,fontSize:13,padding:"10px 16px"}}>Cancel</button>
              <button onClick={doInsight} className="btn1" style={{flex:1,fontSize:13,padding:"10px 16px"}}>Reveal</button>
            </div>
          </div>
        </div>);
      }
      // ── XP Boost flow A : Module Booster (pick a module, +50% next session) ──
      if(useTokenAsk==="module_booster"){
        var bModList=MISSION_MODULES.slice();
        if(!bypassPick){
          return(<div style={{position:"fixed",inset:0,background:"rgba(0,0,0,.7)",backdropFilter:"blur(4px)",zIndex:9999,display:"flex",alignItems:"center",justifyContent:"center",padding:20}} onClick={function(e){if(e.target===e.currentTarget)closeAll();}}>
            <div className="crd" style={{maxWidth:380,maxHeight:"80vh",overflowY:"auto",padding:20,border:"1px solid var(--bdr)"}}>
              <div style={{textAlign:"center",marginBottom:12}}>
                <div style={{fontSize:48,marginBottom:8}}>{info.icon}</div>
                <h2 className="out" style={{fontSize:18,fontWeight:800,marginBottom:6}}>Module Booster — pick a module</h2>
                <p style={{fontSize:12,color:"var(--t2)",lineHeight:1.5}}>The chosen module earns <strong style={{color:"var(--cyan)"}}>+50% XP</strong> on its next session.</p>
              </div>
              <div style={{display:"flex",flexDirection:"column",gap:6,marginBottom:14}}>
                {bModList.map(function(m){return(<button key={m.id} onClick={function(){setBypassPick(m.id);}} style={{padding:"10px 12px",borderRadius:10,cursor:"pointer",textAlign:"left",border:"1px solid var(--bdr)",background:"var(--bg2)",display:"flex",alignItems:"center",gap:10}}>
                  <span style={{width:22,display:"inline-flex",alignItems:"center",justifyContent:"center",fontSize:18}}>{GAME_ICON_PATHS[m.icon]?<GIcon name={m.icon} size={20} color="var(--cyan)"/>:m.icon}</span>
                  <span style={{flex:1,fontSize:13,fontWeight:700,color:"var(--t1)"}}>{m.name}</span>
                </button>);})}
              </div>
              <button onClick={closeAll} className="btn2" style={{width:"100%",fontSize:13,padding:"10px 16px"}}>Cancel</button>
            </div>
          </div>);
        }
        var bPicked=MISSION_MODULES.find(function(m){return m.id===bypassPick;})||{name:bypassPick,icon:"🎯"};
        function doModuleBoost(){
          applyConsume("module_booster",function(){
            var c=JSON.parse(JSON.stringify(u));if(!c.boosts)c.boosts={};c.boosts.moduleBoostArmed=bypassPick;p.setAvatar(c);
            setTokenToast({err:false,msg:"🚀 Booster armed on "+bPicked.name});setTimeout(function(){setTokenToast(null);},2800);closeAll();
          });
        }
        return(<div style={{position:"fixed",inset:0,background:"rgba(0,0,0,.7)",backdropFilter:"blur(4px)",zIndex:9999,display:"flex",alignItems:"center",justifyContent:"center",padding:20}} onClick={function(e){if(e.target===e.currentTarget)closeAll();}}>
          <div className="crd" style={{maxWidth:340,padding:20,textAlign:"center",border:"1px solid var(--bdr)"}}>
            <div style={{marginBottom:8,height:48,display:"flex",alignItems:"center",justifyContent:"center",fontSize:40}}>{GAME_ICON_PATHS[bPicked.icon]?<GIcon name={bPicked.icon} size={44} color="var(--cyan)"/>:bPicked.icon}</div>
            <h2 className="out" style={{fontSize:18,fontWeight:800,marginBottom:8}}>Boost <span style={{color:"var(--cyan)"}}>{bPicked.name}</span>?</h2>
            <p style={{fontSize:13,color:"var(--t2)",marginBottom:6,lineHeight:1.5}}>Your next {bPicked.name} session earns +50% XP. Burns automatically at the end of the round.</p>
            <p style={{fontSize:12,color:"var(--t3)",marginBottom:18}}><strong style={{color:"var(--cyan)"}}>{Math.max(0,qty-1)} / {info.cap}</strong> Boosters will remain.</p>
            <div style={{display:"flex",gap:10,justifyContent:"center"}}>
              <button onClick={function(){setBypassPick(null);}} className="btn2" style={{flex:1,fontSize:13,padding:"10px 16px"}}>{"← Module"}</button>
              <button onClick={doModuleBoost} className="btn1" style={{flex:1,fontSize:13,padding:"10px 16px"}}>Arm</button>
            </div>
          </div>
        </div>);
      }
      // ── XP Boost flow B : Mock Multiplier (×1.5 next mock) ──
      if(useTokenAsk==="mock_multiplier"){
        function doMockMult(){
          applyConsume("mock_multiplier",function(){
            var c=JSON.parse(JSON.stringify(u));if(!c.boosts)c.boosts={};c.boosts.mockMultArmed=true;p.setAvatar(c);
            setTokenToast({err:false,msg:"📈 Mock Multiplier armed"});setTimeout(function(){setTokenToast(null);},2400);closeAll();
          });
        }
        return(<div style={{position:"fixed",inset:0,background:"rgba(0,0,0,.7)",backdropFilter:"blur(4px)",zIndex:9999,display:"flex",alignItems:"center",justifyContent:"center",padding:20}} onClick={function(e){if(e.target===e.currentTarget)closeAll();}}>
          <div className="crd" style={{maxWidth:340,padding:20,textAlign:"center",border:"1px solid var(--bdr)"}}>
            <div style={{fontSize:48,marginBottom:12}}>{info.icon}</div>
            <h2 className="out" style={{fontSize:18,fontWeight:800,marginBottom:8}}>Arm {info.name}?</h2>
            <p style={{fontSize:13,color:"var(--t2)",marginBottom:6,lineHeight:1.5}}>Your next Mock Test or Final Arena earns ×1.5 XP. Burns after that battle.</p>
            <p style={{fontSize:12,color:"var(--t3)",marginBottom:18}}><strong style={{color:"var(--cyan)"}}>{Math.max(0,qty-1)} / {info.cap}</strong> will remain after use.</p>
            <div style={{display:"flex",gap:10,justifyContent:"center"}}>
              <button onClick={closeAll} className="btn2" style={{flex:1,fontSize:13,padding:"10px 16px"}}>Cancel</button>
              <button onClick={doMockMult} className="btn1" style={{flex:1,fontSize:13,padding:"10px 16px"}}>Arm</button>
            </div>
          </div>
        </div>);
      }
      // ── XP Boost flow C : Daily Doubler (×2 all modules 24h) ──
      if(useTokenAsk==="daily_doubler"){
        function doDailyDoubler(){
          applyConsume("daily_doubler",function(){
            var c=JSON.parse(JSON.stringify(u));if(!c.boosts)c.boosts={};c.boosts.dailyDoublerUntil=Date.now()+24*60*60*1000;p.setAvatar(c);
            setTokenToast({err:false,msg:"⏫ Daily Doubler active for 24h!"});setTimeout(function(){setTokenToast(null);},2800);closeAll();
          });
        }
        return(<div style={{position:"fixed",inset:0,background:"rgba(0,0,0,.7)",backdropFilter:"blur(4px)",zIndex:9999,display:"flex",alignItems:"center",justifyContent:"center",padding:20}} onClick={function(e){if(e.target===e.currentTarget)closeAll();}}>
          <div className="crd" style={{maxWidth:340,padding:20,textAlign:"center",border:"1px solid var(--bdr)"}}>
            <div style={{fontSize:48,marginBottom:12}}>{info.icon}</div>
            <h2 className="out" style={{fontSize:18,fontWeight:800,marginBottom:8}}>Activate {info.name}?</h2>
            <p style={{fontSize:13,color:"var(--t2)",marginBottom:6,lineHeight:1.5}}>×2 XP on all modules for the next 24 hours. Starts immediately.</p>
            <p style={{fontSize:12,color:"var(--t3)",marginBottom:18}}><strong style={{color:"var(--cyan)"}}>{Math.max(0,qty-1)} / {info.cap}</strong> will remain after use.</p>
            <div style={{display:"flex",gap:10,justifyContent:"center"}}>
              <button onClick={closeAll} className="btn2" style={{flex:1,fontSize:13,padding:"10px 16px"}}>Cancel</button>
              <button onClick={doDailyDoubler} className="btn1" style={{flex:1,fontSize:13,padding:"10px 16px"}}>Activate</button>
            </div>
          </div>
        </div>);
      }
      return null;
    })()}
    {tokenToast&&<div style={{position:"fixed",bottom:80,left:"50%",transform:"translateX(-50%)",padding:"12px 18px",borderRadius:10,background:tokenToast.err?"rgba(220,58,80,.15)":"rgba(46,180,100,.15)",border:"1px solid "+(tokenToast.err?"var(--red)":"var(--green)"),color:tokenToast.err?"var(--red)":"var(--green)",fontSize:13,fontWeight:700,zIndex:1000}}>{tokenToast.msg}</div>}
    </>);
  }

  // Legacy "avatar" Style view removed (P2b) — merged into view==="style" above
  // (equip + duplicate counters + consumables + cheat sheets in one tab).

  // Conversions now live in the Shop (P2b) — the old in-Profile sub-view was removed.

  // ── SOUS-PAGE COMPTE & PARAMÈTRES ───────────────────────────────────────
  // Consolide 5 anciens CTAs du Profile principal (abonnement, confidentialité,
  // médiation, gestion du compte, changer de profil) en une seule entrée
  // "⚙️ Compte & paramètres" pour alléger la page d'accueil du Profile.
  // Les sous-blocs juridiques (Privacy, Mediation) restent en overlay
  // plein-écran, "Gestion du compte" pointe vers le sous-view "account"
  // existant (sécurité, exports, suppression).
  if(view==="settings"){
    return(<div className="enter" style={{padding:"20px 16px 100px"}}>
      <button onClick={function(){setView("home");}} style={{background:"none",border:"none",color:"var(--t2)",cursor:"pointer",fontSize:14,marginBottom:16,padding:0}}>{"← Back"}</button>
      <h1 className="out" style={{fontWeight:800,fontSize:22,marginBottom:4}}>{"Compte & paramètres"}</h1>
      <p style={{color:"var(--t3)",fontSize:12,marginBottom:20}}>{"Abonnement, mentions légales, gestion du compte"}</p>

      {/* ─── ABONNEMENT ─── */}
      <div style={{fontSize:10,color:"var(--t3)",fontWeight:600,letterSpacing:1,textTransform:"uppercase",marginBottom:10}}>{"Abonnement"}</div>
      {(function(){
        var lvl=u.accessLevel||"free";
        var isPremium=lvl==="premium_monthly"||lvl==="premium_pass";
        var expiresAt=u.accessExpiresAt?new Date(u.accessExpiresAt):null;
        var expStr=expiresAt?expiresAt.toLocaleDateString("fr-FR",{day:"2-digit",month:"short",year:"numeric"}):null;
        if(isPremium){
          var label=lvl==="premium_monthly"?"Premium Mensuel":"TOEIC Pass 3 mois";
          var icon=lvl==="premium_monthly"?"🔁":"🎟️";
          var tagline=lvl==="premium_monthly"
            ?(expStr?"Prochain prélèvement le "+expStr:"Actif")
            :(expStr?"Expire le "+expStr:"Actif");
          var isMonthly=lvl==="premium_monthly";
          async function openPortal(){
            try{await openCustomerPortal();}catch(e){alert("Erreur : "+((e&&e.message)||"impossible d'ouvrir le portail."));}
          }
          return(<div className="crd" style={{marginBottom:16,padding:"12px 14px",background:"linear-gradient(135deg,rgba(255,215,0,.08),rgba(var(--cx),.06))",border:"1px solid rgba(255,215,0,.2)"}}>
            <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:isMonthly?10:0}}>
              <span style={{fontSize:22,flexShrink:0}}>{icon}</span>
              <div style={{flex:1,minWidth:0}}>
                <div className="out" style={{fontWeight:800,fontSize:13,color:"var(--gold)",whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{label}</div>
                <div style={{fontSize:10,color:"var(--t2)",marginTop:1,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{tagline}</div>
              </div>
              {!isMonthly&&<button className="btn2" onClick={openPortal} style={{flexShrink:0,fontSize:12,padding:"8px 12px",borderColor:"rgba(var(--cx),.25)",color:"var(--cyan)"}}>
                {"🔧 Gérer"}
              </button>}
            </div>
            {isMonthly&&<div style={{display:"flex",gap:8}}>
              <button onClick={openPortal} style={{flex:1,fontSize:12,padding:"10px 12px",background:"rgba(224,82,82,.08)",border:"1px solid rgba(224,82,82,.3)",borderRadius:10,color:"var(--red)",fontFamily:"'DM Sans',sans-serif",fontWeight:600,cursor:"pointer"}}>
                {"✕ Résilier"}
              </button>
              <button className="btn2" onClick={openPortal} style={{flex:1,fontSize:12,padding:"10px 12px",borderColor:"rgba(var(--cx),.25)",color:"var(--cyan)"}}>
                {"🔧 Gérer"}
              </button>
            </div>}
          </div>);
        }
        if(!PREMIUM_UPGRADE_ENABLED){
          return(<div className="crd" style={{marginBottom:16,padding:"14px 16px",background:"rgba(var(--cx),.04)",border:"1px dashed var(--bdr)",display:"flex",alignItems:"center",gap:12}}>
            <span style={{fontSize:22,flexShrink:0,opacity:.6}}>{"🏰"}</span>
            <div style={{flex:1}}>
              <div className="out" style={{fontWeight:700,fontSize:13,color:"var(--t2)"}}>{"Arena Premium"}</div>
              <div style={{fontSize:11,color:"var(--t3)",marginTop:2,lineHeight:1.4}}>{"Fonctionnalité à venir."}</div>
            </div>
          </div>);
        }
        return(<button className="btn1" onClick={function(){p.goUpgrade&&p.goUpgrade();}}
          style={{width:"100%",fontSize:14,padding:"13px 20px",marginBottom:16,background:"linear-gradient(135deg,#f0c850,#d4943a)",color:"#1a1610",fontWeight:700}}>
          {"🏰 Passer à Arena Premium"}
        </button>);
      })()}

      {/* ─── INFOS LÉGALES ─── */}
      <div style={{fontSize:10,color:"var(--t3)",fontWeight:600,letterSpacing:1,textTransform:"uppercase",marginBottom:10}}>{"Mentions légales"}</div>
      <button className="btn2" onClick={function(){setShowPrivacy(true);}}
        style={{fontSize:13,width:"100%",marginBottom:8,borderColor:"var(--bdr)",color:"var(--t2)"}}>
        {"🛡️ Politique de confidentialité"}
      </button>
      <button className="btn2" onClick={function(){setShowMediation(true);}}
        style={{fontSize:13,width:"100%",marginBottom:16,borderColor:"var(--bdr)",color:"var(--t2)"}}>
        {"⚖️ Médiation de la consommation"}
      </button>

      {/* ─── COMPTE ─── */}
      <div style={{fontSize:10,color:"var(--t3)",fontWeight:600,letterSpacing:1,textTransform:"uppercase",marginBottom:10}}>{"Compte"}</div>
      <button className="btn2" onClick={function(){setView("account");}}
        style={{fontSize:13,width:"100%",marginBottom:8,borderColor:"rgba(var(--cx),.2)",color:"var(--cyan)",padding:"12px 16px"}}>
        {"⚙️ Gestion du compte"}
      </button>
      <button className="btn2" onClick={function(){if(confirm("Changer de profil ? Vos données restent sauvegardées. Tapez votre nom au prochain écran pour vous reconnecter."))p.logout();}}
        style={{fontSize:13,width:"100%",marginBottom:8,borderColor:"rgba(var(--cx),.2)",color:"var(--cyan)"}}>
        {"🔄 Changer de profil"}
      </button>

      {showPrivacy&&<div style={{position:"fixed",top:0,left:0,right:0,bottom:0,background:"var(--bg)",zIndex:9999,overflow:"auto"}}>
        <PrivacyPolicy onClose={function(){setShowPrivacy(false);}}/>
      </div>}
      {showMediation&&<div style={{position:"fixed",top:0,left:0,right:0,bottom:0,background:"var(--bg)",zIndex:9999,overflow:"auto"}}>
        <MediationInfo onClose={function(){setShowMediation(false);}}/>
      </div>}

      {/* ─── DISCLAIMER MARQUE ETS (obligatoire — usage informatif TOEIC) ─── */}
      <p style={{fontSize:10,color:"var(--t3)",lineHeight:1.5,textAlign:"center",marginTop:24,marginBottom:0}}>
        {"TOEIC® is a registered trademark of ETS. Verse Arena is not endorsed or approved by ETS."}
      </p>
    </div>);
  }

  // ── SOUS-PAGE GESTION DU COMPTE ─────────────────────────────────────────
  if(view==="account"){
    return(<div className="enter" style={{padding:"20px 16px 100px"}}>
      <button onClick={function(){setView("home");}} style={{background:"none",border:"none",color:"var(--t2)",cursor:"pointer",fontSize:14,marginBottom:16,padding:0}}>{"\u2190 Back"}</button>
      <h1 className="out" style={{fontWeight:800,fontSize:22,marginBottom:4}}>{"Gestion du compte"}</h1>
      <p style={{color:"var(--t3)",fontSize:12,marginBottom:24}}>{"S\u00e9curit\u00e9, donn\u00e9es, actions critiques"}</p>

      {/* ─── SECTION SÉCURITÉ (Phase 2 commit 4 — refonte 2026-04-27) ─── */}
      <div style={{fontSize:10,color:"var(--t3)",fontWeight:600,letterSpacing:1,textTransform:"uppercase",marginBottom:10}}>{"🔒 Sécurité"}</div>
      {u.email
        ?<div className="crd" style={{padding:"12px 14px",marginBottom:8,background:"rgba(var(--cx),.04)",border:"1px solid rgba(var(--cx),.15)"}}>
          <div style={{color:"var(--t3)",fontSize:10,marginBottom:3,textTransform:"uppercase",letterSpacing:1}}>{"Email"}</div>
          <div style={{color:"var(--t1)",fontSize:13,wordBreak:"break-all"}}>{u.email}</div>
        </div>
        :<div className="crd" style={{padding:"12px 14px",marginBottom:8,background:"transparent",border:"1px dashed var(--bdr)",fontSize:12,color:"var(--t3)",lineHeight:1.5}}>
          {"Aucun email lié à ton compte. Ta progression ne peut pas être récupérée si tu changes d'appareil."}
        </div>}
      {u.email&&!pwdChangeShow&&<button className="btn2" onClick={function(){setPwdChangeShow(true);setPwdChangeErr("");setPwdChangeOK(false);}}
        style={{fontSize:13,width:"100%",marginBottom:8,borderColor:"rgba(var(--cx),.2)",color:"var(--cyan)"}}>
        {"🔑 Changer mon mot de passe"}
      </button>}
      {u.email&&pwdChangeShow&&<div className="crd" style={{padding:14,marginBottom:8,border:"1px solid rgba(var(--cx),.2)",background:"var(--bg2)"}}>
        {pwdChangeOK
          ?<>
            <div style={{color:"var(--green)",fontSize:13,marginBottom:10,textAlign:"center"}}>{"✅ Mot de passe mis à jour"}</div>
            <button className="btn2" onClick={function(){setPwdChangeShow(false);setPwdChange1("");setPwdChange2("");setPwdChangeOK(false);}}
              style={{fontSize:12,padding:"8px 14px",width:"100%"}}>{"Fermer"}</button>
          </>
          :<>
            <PasswordInput value={pwdChange1} onChange={function(ev){setPwdChange1(ev.target.value);setPwdChangeErr("");}}
              placeholder="Nouveau mot de passe (8 car. min.)" autoComplete="new-password" disabled={pwdChangeBusy}
              style={{width:"100%",padding:"10px 12px",fontSize:13,marginBottom:8,background:"var(--bg)",border:"1px solid var(--bdr)",borderRadius:8,color:"var(--t1)",fontFamily:"'DM Sans',sans-serif",boxSizing:"border-box"}}/>
            <PasswordInput value={pwdChange2} onChange={function(ev){setPwdChange2(ev.target.value);setPwdChangeErr("");}}
              placeholder="Confirme le mot de passe" autoComplete="new-password" disabled={pwdChangeBusy}
              style={{width:"100%",padding:"10px 12px",fontSize:13,marginBottom:10,background:"var(--bg)",border:"1px solid var(--bdr)",borderRadius:8,color:"var(--t1)",fontFamily:"'DM Sans',sans-serif",boxSizing:"border-box"}}/>
            {pwdChangeErr&&<div style={{color:"var(--red)",fontSize:12,marginBottom:8}}>{pwdChangeErr}</div>}
            <div style={{display:"flex",gap:8}}>
              <button className="btn2" onClick={function(){setPwdChangeShow(false);setPwdChange1("");setPwdChange2("");setPwdChangeErr("");}} disabled={pwdChangeBusy}
                style={{flex:1,fontSize:12,padding:"9px 12px"}}>{"Annuler"}</button>
              <button className="btn1" onClick={async function(){
                setPwdChangeErr("");
                if((pwdChange1||"").length<8){setPwdChangeErr("Mot de passe trop court (8 caractères minimum)");return;}
                if(pwdChange1!==pwdChange2){setPwdChangeErr("Les deux mots de passe ne correspondent pas");return;}
                setPwdChangeBusy(true);
                try{
                  await updatePassword(pwdChange1);
                  setPwdChangeOK(true);
                  setPwdChange1("");setPwdChange2("");
                }catch(err){
                  setPwdChangeErr((err&&err.message)||"Erreur");
                }finally{setPwdChangeBusy(false);}
              }} disabled={pwdChangeBusy}
                style={{flex:1,fontSize:12,padding:"9px 12px",background:"linear-gradient(135deg,#f0c850,#d4943a)",color:"#1a1610",fontWeight:700,opacity:pwdChangeBusy?.6:1}}>
                {pwdChangeBusy?"...":"Enregistrer"}
              </button>
            </div>
          </>}
      </div>}
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
        <button className="btn2" onClick={async function(){var code=prompt("Code formateur pour r\u00e9initialiser :");if(!code)return;var r=await teacherAuth(code);if(!r.ok){alert("Code invalide");return;}
          // Un code valide d\u00e9clenchait la purge compl\u00e8te du compte sans la moindre
          // confirmation \u2014 alors que son voisin "Supprimer mon compte" en demande deux.
          if(!confirm("R\u00e9initialiser ce compte ? Toute la progression sera effac\u00e9e, sans retour possible."))return;
          p.reset();}}
          style={{fontSize:11,color:"var(--t3)",borderColor:"rgba(255,71,87,.15)",width:"100%",marginBottom:8}}>
          {"\uD83D\uDD04 R\u00e9initialiser (formateur)"}
        </button>
        {/* Hard logout — invalide la session Supabase + purge localStorage.
            Utile pour : créer un profil distinct avec un autre email, tester en
            sandbox avec plusieurs alias, se débarrasser d'une session cachée
            qui auto-relogue involontairement. Différent de "Changer de profil"
            sur l'écran principal qui garde la session Supabase pour le Welcome
            back. Les données côté Supabase ne sont PAS supprimées. */}
        <button className="btn2" onClick={async function(){
          if(!confirm("D\u00e9connexion compl\u00e8te ?\n\nCa vide la session d'authentification (tu devras retaper ton email et cliquer le lien magique pour revenir). Tes donn\u00e9es en base ne sont pas touch\u00e9es.\n\n\u00c0 utiliser si tu veux cr\u00e9er un profil distinct avec un autre email, ou si tu es auto-relogu\u00e9 sur une session pr\u00e9c\u00e9dente sans le vouloir."))return;
          try{await signOutCompletely();}catch(e){console.warn("[logout] signOut failed:",e&&e.message);}
          try{
            // Nettoyage exhaustif des clés app ET Supabase auth côté localStorage.
            // signOutCompletely() supprime déjà les clés app (toeic-arena-*) + appelle
            // supabase.auth.signOut qui purge les tokens. Belt-and-suspenders : on
            // scan tout localStorage pour toute clé contenant "toeic", "supabase",
            // ou "sb-" (pattern des tokens Supabase auth).
            for(var i=localStorage.length-1;i>=0;i--){
              var k=localStorage.key(i);
              if(k&&(/(toeic|supabase|^sb-)/i).test(k))localStorage.removeItem(k);
            }
          }catch(e){console.warn("[logout] storage cleanup failed:",e&&e.message);}
          // Reload pour forcer un remount propre sans aucun cache React
          window.location.href="/";
        }}
          style={{fontSize:11,color:"var(--t3)",borderColor:"rgba(255,71,87,.15)",width:"100%"}}>
          {"\uD83D\uDEAA D\u00e9connexion compl\u00e8te (vide la session)"}
        </button>
      </div>
    </div>);
  }

  // ── VUE PRINCIPALE ──────────────────────────────────────────────────────
  return(
    <div className="enter" style={{padding:"20px 16px 100px"}}>

      {/* Hero */}
      <div style={{textAlign:"center",marginBottom:24}}>
        <button onClick={function(){setView("style");}}
          style={{background:"none",border:"none",cursor:"pointer",padding:0,marginBottom:12,display:"inline-block",position:"relative"}}>
          {renderAvatar(88,44)}
          <div style={{position:"absolute",bottom:0,right:0,width:26,height:26,borderRadius:"50%",
            background:"var(--cyan)",border:"2px solid var(--bg)",display:"flex",alignItems:"center",
            justifyContent:"center",fontSize:12}}>✎</div>
        </button>
        <h1 className="out" style={{fontWeight:800,fontSize:22,marginBottom:4}}>{u.name}</h1>
        {u.equippedTitle&&TITLES[u.equippedTitle]&&<div className="out" style={{fontSize:11,fontWeight:800,color:tone(TITLES[u.equippedTitle].color),letterSpacing:2,textTransform:"uppercase",marginBottom:8}}>{TITLES[u.equippedTitle].name}</div>}
        <div style={{display:"flex",justifyContent:"center",gap:10,flexWrap:"wrap",marginTop:4}}>
          <span style={{fontSize:12,background:"rgba(var(--cx),.1)",color:"var(--orange)",padding:"3px 10px",borderRadius:20,border:"1px solid rgba(var(--cx),.2)"}}>Lv. {lv.level}</span>
          <span style={{fontSize:12,padding:"3px 10px",borderRadius:20,border:"1px solid rgba(27,112,207,.2)",background:"rgba(27,112,207,.1)",color:tone(lg.color)}}>
  <LeagueIcon lg={lg} size={13} style={{marginRight:4,verticalAlign:"-2px"}}/>{lg.name}
  {lg.locked&&<span style={{marginLeft:4,display:"inline-flex"}}><ResultIcon e={"🔒"} size={11} color="var(--t3)"/></span>}
</span>
{lg.locked&&<span style={{fontSize:11,color:"var(--t3)",padding:"3px 10px",borderRadius:20,background:"rgba(255,71,87,.06)",border:"1px solid rgba(255,71,87,.15)"}}>{lg.lockReason==="need_estimation"?"Legend tier: complete more modules or a Mock test":("Legend tier: reach TOEIC "+lg.lockedScore)}</span>}
          <span style={{fontSize:12,background:"rgba(255,100,0,.1)",color:"#ff6428",padding:"3px 10px",borderRadius:20,border:"1px solid rgba(255,100,0,.2)",display:"inline-flex",alignItems:"center",gap:4}}><GIcon name="flame" size={12} color="#ff6428"/>{u.streak}</span>
          <DaricPill marks={u.arenaMarks}/>
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
        <button onClick={function(){setView("style");}} className="crd"
          style={{padding:"14px 8px",textAlign:"center",cursor:"pointer",background:"rgba(var(--cx),.03)",border:"1px solid rgba(var(--cx),.2)",width:"100%"}}>
          <div style={{height:28,display:"flex",alignItems:"center",justifyContent:"center",marginBottom:4}}>
            {renderAvatar(28,18)}
          </div>
          <div style={{fontWeight:800,fontSize:16,color:"var(--t1)"}}>Style</div>
          <div style={{fontSize:10,color:"var(--t2)",textTransform:"uppercase",letterSpacing:.5}}>Apparence</div>
        </button>
        <button onClick={function(){p.goShop&&p.goShop();}} className="crd"
          style={{padding:"14px 8px",textAlign:"center",cursor:"pointer",background:"rgba(232,196,90,.04)",border:"1px solid rgba(232,196,90,.25)",width:"100%"}}>
          <div style={{marginBottom:4,display:"flex",justifyContent:"center"}}><GIcon name="daric" size={26} color="var(--gold)"/></div>
          <div style={{fontWeight:800,fontSize:16,color:"var(--gold)"}}>Shop</div>
          <div style={{fontSize:10,color:"var(--t2)",textTransform:"uppercase",letterSpacing:.5}}>Darics</div>
        </button>
      </div>

      {/* Chronicles — entry card (parchment themed) */}
      {(function(){
        var heard=(u.narrator&&u.narrator.heard)||[];
        // Count only heard moments that belong to the canon (heard can hold replays
        // or the off-canon side chronicle → raw length showed "10/8"). (audit 2026-06-25)
        var cnt=NARRATOR_ORDER.filter(function(id){return heard.indexOf(id)!==-1;}).length;
        return(<button onClick={function(){setView("chronicles");}} className="crd"
          style={{width:"100%",padding:"14px 16px",marginBottom:14,textAlign:"left",cursor:"pointer",
            background:"linear-gradient(135deg,rgba(232,212,168,0.08),rgba(138,112,64,0.05))",
            border:"1px solid rgba(180,150,100,0.3)",display:"flex",alignItems:"center",gap:12}}>
          <span style={{flexShrink:0,display:"flex"}}><GIcon name="scroll-unfurled" size={26} color="var(--gold)"/></span>
          <div style={{flex:1,minWidth:0}}>
            <div className="out" style={{fontFamily:"'Cinzel',serif",fontWeight:800,fontSize:15,color:"var(--t1)",letterSpacing:.5}}>Chronicles</div>
            <div style={{fontSize:11,color:"var(--t2)",marginTop:2}}>
              {cnt===0?"Aucun chapitre d\u00e9bloqu\u00e9 pour l'instant":"Revoir la chronique d'Aldric \u00b7 "+cnt+"/"+NARRATOR_ORDER.length+" chapitres"}
            </div>
          </div>
          <span style={{fontSize:18,color:"var(--gold)",flexShrink:0}}>{"\u203A"}</span>
        </button>);
      })()}

      {/* Send feedback — bug / suggestion / question pédagogique.
          Visible to all signed-in users (not visitors — class_code is required).
          Routes to the FeedbackForm sub-view. */}
      {u.classCode&&u.classCode!=="visitor"&&<button onClick={function(){setView("feedback");}} className="crd"
        style={{width:"100%",padding:"14px 16px",marginBottom:14,textAlign:"left",cursor:"pointer",
          background:"linear-gradient(135deg,rgba(8,145,178,0.06),rgba(124,58,237,0.04))",
          border:"1px solid rgba(8,145,178,0.25)",display:"flex",alignItems:"center",gap:12}}>
        <span style={{flexShrink:0,display:"flex"}}><GIcon name="chat-bubble" size={24} color="var(--cyan)"/></span>
        <div style={{flex:1,minWidth:0}}>
          <div className="out" style={{fontWeight:800,fontSize:15,color:"var(--t1)",letterSpacing:.3}}>Send feedback</div>
          <div style={{fontSize:11,color:"var(--t2)",marginTop:2}}>Bug, suggestion ou question pédagogique → Jérémy</div>
        </div>
        <span style={{fontSize:18,color:"var(--cyan)",flexShrink:0}}>{"›"}</span>
      </button>}

      {/* Teacher dashboard — only shown for users in a teacher-dedicated class.
          When the app is deployed on multiple campuses, each teacher gets their own
          synthetic class (like 'teacher-internal') so the button stays out of view
          for students/visitors. Access via the onboarding "Teacher access" link is
          still possible with a valid teacher_code. */}
      {u.classCode==="teacher-internal"&&<button className="btn2" onClick={async function(){
        // Try biometric first if registered
        if(bioAvail&&bioRegistered){try{var ok=await bioAuthenticate();if(ok){p.goTeacher();return;}}catch(e){console.warn("[teacher] biometric auth failed:",e&&e.message);}}
        // Fall back to password prompt
        var code=prompt("Code formateur :");if(!code)return;
        var r=await teacherAuth(code);
        if(!r.ok){alert("Code invalide");return;}
        setDashSession(code,r.role);
        if(r.groups.length){try{localStorage.setItem('toeic-dash-group',r.groups[0].code);}catch(e){console.warn("[teacher] group store failed:",e&&e.message);}}
        p.goTeacher();}}
        style={{fontSize:13,width:"100%",marginBottom:20,padding:"14px 24px",borderColor:"rgba(var(--cx),.2)",color:"var(--cyan)"}}>
        <GIcon name="public-speaker" size={16} color="var(--cyan)" style={{marginRight:6}}/>Teacher Dashboard
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
        {(function(){
          var narratorMuted=!!(u.narrator&&u.narrator.muted);
          return(<div style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"14px 16px",borderBottom:"1px solid var(--bdr)"}}>
            <div>
              <div className="out" style={{fontWeight:700,fontSize:14}}>Narrator voice</div>
              <div style={{fontSize:12,color:"var(--t2)"}}>{narratorMuted?"Sous-titres uniquement":"Voix d'Aldric activ\u00e9e"}</div>
            </div>
            {Toggle(!narratorMuted,function(){
              var c=JSON.parse(JSON.stringify(u));
              if(!c.narrator)c.narrator={heard:[],muted:false};
              c.narrator.muted=!c.narrator.muted;
              p.setAvatar(c);
            })}
          </div>);
        })()}
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

      {/* Compte & paramètres — single CTA replacing the old stack of 5 buttons
         (Subscription / Privacy / Mediation / Gestion / Logout). The full bloc
         lives in setView("settings") sub-page (2026-05-05 PM consolidation). */}
      <button className="btn2" onClick={function(){setView("settings");}}
        style={{fontSize:13,width:"100%",marginTop:16,marginBottom:8,borderColor:"rgba(var(--cx),.2)",color:"var(--cyan)",padding:"12px 16px",display:"flex",alignItems:"center",justifyContent:"space-between"}}>
        <span>{"⚙️ Compte & paramètres"}</span>
        <span style={{color:"var(--t3)"}}>{"›"}</span>
      </button>
    </div>
  );
}
// ═══════════════════════════════════════════
// FEEDBACK FORM — student bug/suggestion/question form
// Lives in Profile (view==="feedback"). Submits via /api/feedback-send
// which inserts in feedback_reports + emails leixa.formation@gmail.com.
// ═══════════════════════════════════════════
export function FeedbackForm(p){
  var u=p.u;
  var [name,setName]=useState(u.name||"");
  var [type,setType]=useState("bug");
  var [moduleId,setModuleId]=useState("");
  var [message,setMessage]=useState("");
  var [busy,setBusy]=useState(false);
  var [done,setDone]=useState(false);
  var [err,setErr]=useState("");

  function submit(){
    setErr("");
    if(!name.trim()){setErr("Pseudo requis.");return;}
    if(!moduleId){setErr("Sélectionne un module.");return;}
    if(message.trim().length<10){setErr("Message trop court (10 caractères minimum).");return;}
    setBusy(true);
    var label=findModuleLabel(moduleId);
    fetch("/api/feedback-send",{
      method:"POST",
      headers:{"Content-Type":"application/json"},
      body:JSON.stringify({
        user_name:name.trim(),
        class_code:u.classCode||"visitor",
        feedback_type:type,
        module_id:moduleId,
        module_label:label,
        message:message.trim()
      })
    }).then(function(r){return r.json().then(function(j){return{ok:r.ok,j:j};});})
      .then(function(res){
        if(!res.ok){setErr((res.j&&res.j.error)||"Erreur inconnue.");setBusy(false);return;}
        setDone(true);setBusy(false);
        try{haptic("complete");}catch(e){console.warn("[feedback] haptic:",e&&e.message);}
      })
      .catch(function(e){setErr("Connexion impossible. Réessaie dans un instant.");setBusy(false);console.warn("[feedback] fetch:",e&&e.message);});
  }

  if(done){
    return(<div className="enter" style={{padding:"20px 16px 100px",maxWidth:480,margin:"0 auto"}}>
      <div style={{textAlign:"center",padding:"40px 16px"}}>
        <div style={{marginBottom:18,display:"flex",justifyContent:"center"}}><GIcon name="chat-bubble" size={60} color="var(--cyan)"/></div>
        <h2 className="out" style={{fontSize:22,fontWeight:800,marginBottom:10}}>Message envoyé !</h2>
        <p style={{color:"var(--t2)",fontSize:14,lineHeight:1.6,marginBottom:24}}>Merci pour ton retour. Jérémy a été notifié et reviendra vers toi si nécessaire.</p>
        <button className="btn1" style={{fontSize:15,padding:"13px 28px"}} onClick={p.back}>Retour au profil</button>
      </div>
    </div>);
  }

  return(<div className="enter" style={{padding:"20px 16px 100px",maxWidth:480,margin:"0 auto"}}>
    <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:18}}>
      <button onClick={p.back} style={{background:"none",border:"none",color:"var(--cyan)",fontSize:22,cursor:"pointer",padding:0,lineHeight:1}}>{"←"}</button>
      <h1 className="out" style={{fontWeight:800,fontSize:20,margin:0}}>Send feedback</h1>
    </div>
    <p style={{fontSize:13,color:"var(--t2)",marginBottom:18,lineHeight:1.5}}>Bug, suggestion ou question pédagogique ? Décris ce que tu as constaté, ça arrive directement chez Jérémy.</p>

    <div style={{marginBottom:14}}>
      <label style={{display:"block",fontSize:11,color:"var(--t3)",marginBottom:6,fontWeight:700,letterSpacing:1,textTransform:"uppercase"}}>Pseudo</label>
      <input type="text" value={name} onChange={function(e){setName(e.target.value);}} maxLength={60} style={{width:"100%",padding:"11px 13px",fontSize:14,background:"var(--bg2)",border:"1.5px solid var(--bdr)",borderRadius:10,color:"var(--t1)",fontFamily:"'DM Sans',sans-serif",boxSizing:"border-box",outline:"none"}}/>
    </div>

    <div style={{marginBottom:14}}>
      <label style={{display:"block",fontSize:11,color:"var(--t3)",marginBottom:6,fontWeight:700,letterSpacing:1,textTransform:"uppercase"}}>Type</label>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:6}}>
        {[{id:"bug",label:"🐞 Bug",col:"#dc2626"},{id:"suggestion",label:"💡 Suggestion",col:"#0891b2"},{id:"question",label:"❓ Question",col:"#7c3aed"}].map(function(t){
          var active=type===t.id;
          return(<button key={t.id} onClick={function(){setType(t.id);}} style={{padding:"10px 6px",background:active?"rgba(0,0,0,.18)":"var(--bg2)",border:"1.5px solid "+(active?t.col:"var(--bdr)"),borderRadius:10,color:active?t.col:"var(--t2)",fontSize:13,fontWeight:active?800:600,cursor:"pointer",fontFamily:"'DM Sans',sans-serif",transition:"all .15s"}}>{t.label}</button>);
        })}
      </div>
    </div>

    <div style={{marginBottom:14}}>
      <label style={{display:"block",fontSize:11,color:"var(--t3)",marginBottom:6,fontWeight:700,letterSpacing:1,textTransform:"uppercase"}}>Module concerné</label>
      <select value={moduleId} onChange={function(e){setModuleId(e.target.value);}} style={{width:"100%",padding:"11px 13px",fontSize:14,background:"var(--bg2)",border:"1.5px solid var(--bdr)",borderRadius:10,color:"var(--t1)",fontFamily:"'DM Sans',sans-serif",boxSizing:"border-box",outline:"none",appearance:"none",cursor:"pointer"}}>
        <option value="">— Sélectionner un module —</option>
        {FEEDBACK_MODULES.map(function(g){
          return(<optgroup key={g.group} label={g.group}>
            {g.items.map(function(it){return(<option key={it.id} value={it.id}>{it.label}</option>);})}
          </optgroup>);
        })}
      </select>
    </div>

    <div style={{marginBottom:18}}>
      <label style={{display:"block",fontSize:11,color:"var(--t3)",marginBottom:6,fontWeight:700,letterSpacing:1,textTransform:"uppercase"}}>Message <span style={{color:"var(--t3)",fontWeight:400,textTransform:"none",letterSpacing:0}}>· {message.length}/4000</span></label>
      <textarea value={message} onChange={function(e){setMessage(e.target.value.slice(0,4000));}} rows={6} placeholder="Décris ce que tu as constaté : ce que tu faisais, ce qui devait se passer, ce qui s'est passé. Plus c'est précis, plus c'est facile à corriger." style={{width:"100%",padding:"12px 13px",fontSize:14,background:"var(--bg2)",border:"1.5px solid var(--bdr)",borderRadius:10,color:"var(--t1)",fontFamily:"'DM Sans',sans-serif",boxSizing:"border-box",outline:"none",lineHeight:1.5,resize:"vertical",minHeight:120}}/>
    </div>

    {err&&<div style={{padding:"10px 12px",background:"rgba(239,68,68,.1)",border:"1px solid rgba(239,68,68,.3)",borderRadius:10,color:"#ef4444",fontSize:13,marginBottom:14}}>{err}</div>}

    <button className="btn1" disabled={busy} style={{width:"100%",fontSize:15,padding:"14px",fontWeight:800,opacity:busy?.65:1}} onClick={submit}>{busy?"Envoi…":"Envoyer le feedback"}</button>
  </div>);
}
