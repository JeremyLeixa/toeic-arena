// Extrait de src/App.jsx le 2026-09-15 (refactor split-app, REFACTOR_PLAN.md). Code déplacé tel quel.
import { GIcon } from "../../components/icons.jsx";
import { ACHIEVEMENTS } from "../../data/achievements.js";
import { GAME_ICON_PATHS } from "../../data/avatarIcons.js";
import { getLevel } from "../../data/helpers.js";
import { LEAGUES } from "../../data/leagues.js";
import { MISSION_MODULES } from "../../data/placement.js";
import { isGhost } from "../../lib/access.js";
import { generateSeasons } from "../../lib/league.js";
import { getDashTeacher, getBioCredId, biometricAvailable, isDashAdmin, teacherAuth, optIcon, bioRegister, BIOMETRIC_KEY, clearDashSession, setDashSession } from "../../lib/teacherSession.js";
import { estimateTOEICScore } from "../../lib/toeic.js";
import { tone } from "../../lib/tone.js";
import { usageStats } from "../../lib/usageStats.js";
import { today, weekId, localYmd } from "../../lib/util.js";
import { supabase } from "../../supabase.js";
import { useState, useEffect } from "react";
import { ResponsiveContainer, BarChart, CartesianGrid, XAxis, YAxis, Tooltip, Bar as RBar, Cell, LineChart, Line } from "recharts";

// ─── TEACHER DASHBOARD CONFIG ───
// H1 (2026-09-14) : VITE_PUSH_SECRET a disparu d'ici. C'etait un "secret" partage inline
// en clair dans le bundle : n'importe qui pouvait le lire et appeler /api/push-send pour
// notifier une promo entiere, voire class_code:"all". L'endpoint authentifie desormais le
// navigateur par le code formateur (valide cote serveur), et garde x-push-secret pour les
// seules Edge Functions cron. NE PAS reintroduire de secret cote client.


export function WeeklyReport(p){
  // p.classCode, p.students (current), p.onBack
  var [snaps,setSnaps]=useState(null);
  var [loading,setLoading]=useState(true);

  // Compute week boundaries: last completed week (Monday-Sunday)
  var now=new Date();
  var dow=now.getDay()||7; // 1=Mon..7=Sun
  var lastMonday=new Date(now);lastMonday.setDate(now.getDate()-dow+1-7);lastMonday.setHours(0,0,0,0);
  var lastSunday=new Date(lastMonday);lastSunday.setDate(lastMonday.getDate()+6);
  var prevMonday=new Date(lastMonday);prevMonday.setDate(lastMonday.getDate()-7);
  // Lundis LOCAUX (localYmd), comme week_start depuis le 2026-09-24 : toISOString donnait le dimanche en France.
  var lastMondayStr=localYmd(lastMonday);
  var prevMondayStr=localYmd(prevMonday);

  useEffect(function(){
    // Securite (lot 3) : ce select('*') tirait toute la cohorte sur deux semaines.
    // La RPC applique le meme scoping formateur que teacher_students (B4/B5) et
    // ne renvoie ni id, ni user_id, ni created_at.
    supabase.rpc("teacher_weekly_snapshots",{
      p_code:getDashTeacher(),p_class_code:p.classCode,
      p_week_starts:[lastMondayStr,prevMondayStr]
    })
      .then(function(res){
        setLoading(false);
        if(res.error){console.warn("[report] teacher_weekly_snapshots failed:",res.error.message);setSnaps([]);return;}
        if(res.data&&res.data.ok===false){console.warn("[report] refused:",res.data.error);setSnaps([]);return;}
        setSnaps((res.data&&res.data.snapshots)||[]);
      })
      .catch(function(e){setLoading(false);console.warn("[report] caught:",e&&e.message);});
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
  var MODULE_LABELS={drill:"Part 5 Drill",csess:"Flashcards",tavern:"Word Tavern",lisP1:"Listening P1",lisP2:"Listening P2",lisP3:"Listening P3",lisP4:"Listening P4",p6:"Part 6",p7:"Part 7",ablitz:"Audio Blitz",clue:"Clue Hunter",sbuild:"Sentence Builder",wfall:"Word Fall",matchEasy:"Speed Match",pvdojo:"Phrasal Verbs",stratquiz:"Strategy Quiz",timesim:"Time Sim",mock1:"Mock Test 1",mock2:"Mock Test 2",mock3:"Mock Test 3",bforge:"Linking Bridge",mimic:"Mimic Hunt",mimic_listen:"Mimic Hunt (écoute)"};
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
  var buckets={s0:0,s400:0,s500:0,s600:0,s700:0,s800:0,sNA:0}; // CHANTIER-A : sNA = non estimables
  (p.students||[]).forEach(function(s){
    if(s.name==="Teacher")return;
    var t=estimateTOEICScore(s.module_scores||{}).total;
    if(t===null){buckets.sNA++;}
    else if(t<400)buckets.s0++;
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
        <p style={{fontSize:11,textTransform:"uppercase",letterSpacing:2,color:"#666",margin:0}}>Verse Arena · Rapport hebdomadaire</p>
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
            var tot=Object.keys(buckets).reduce(function(a,k){return k==="sNA"?a:a+buckets[k];},0);var pct=tot>0?Math.round(buckets[b.k]/tot*100):0;
            return(<div key={i} style={{display:"flex",alignItems:"center",gap:10,marginBottom:4}}>
              <div style={{width:90,fontSize:11,color:"#333"}}>{b.l}</div>
              <div style={{flex:1,height:10,background:"#f0f0f0",borderRadius:6,overflow:"hidden"}}>
                <div style={{width:pct+"%",height:"100%",background:b.c}}/>
              </div>
              <div style={{width:60,fontSize:11,fontWeight:700,textAlign:"right"}}>{buckets[b.k]} ({pct}%)</div>
            </div>);
          })}
          {buckets.sNA>0&&<div style={{marginTop:8,paddingTop:8,borderTop:"1px dashed #ddd",fontSize:11,color:"#888",fontStyle:"italic"}}>{"Non estim\u00e9 (donn\u00e9es insuffisantes) : "+buckets.sNA+" \u00e9l\u00e8ve"+(buckets.sNA>1?"s":"")}</div>}
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
        <p style={{fontSize:10,color:"#888",margin:0}}>Verse Arena · Rapport généré le {fmtDate(now)} · Jérémy Leixa · IDRAC Business School</p>
      </div>
    </div>
  </div>);
}
export function TeacherDash(p){
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
  var[campusData,setCampusData]=useState(null); // null=loading, {rows,totals} once loaded (cross-campus admin view)
  var[campusSort,setCampusSort]=useState("toeic"); // "toeic"|"active"|"students"
  var[sortBy,setSortBy]=useState("toeic"); // "toeic"|"xp"|"accuracy"|"time"|"last_active"
  var[showGhostsOnly,setShowGhostsOnly]=useState(false);
  var[showReport,setShowReport]=useState(false);
  var[showReportCfg,setShowReportCfg]=useState(false);
  var[rcEmail,setRcEmail]=useState("");var[rcOptin,setRcOptin]=useState(true);
  var[rcBusy,setRcBusy]=useState(false);var[rcMsg,setRcMsg]=useState(null);
  var[chartMod,setChartMod]=useState("all"); // for student detail time chart
  var[groups,setGroups]=useState([]);
  // "loading" | "ok" | "invalid_code" | "rpc_error". Avant, le sélecteur affichait « Loading
  // groups... » dès que la liste était vide : un code refusé ou une panne restaient invisibles.
  var[groupsStatus,setGroupsStatus]=useState("loading");var[groupsSlow,setGroupsSlow]=useState(false);
  var[dashPhase,setDashPhase]=useState("picker"); // "picker" | "dashboard" | "create-group"
  var[cgForm,setCgForm]=useState({name:"",code:"",teacherCode:isDashAdmin()?"":getDashTeacher(),type:"school",startDate:"",endDate:"",teacherEmail:"",reportOptin:true});
  var[cgCodeErr,setCgCodeErr]=useState("");var[cgSaving,setCgSaving]=useState(false);
  var[dashEvents,setDashEvents]=useState([]);var[evForm,setEvForm]=useState({type:"spotlight",title:"",desc:"",module:"drill",multiplier:2,hours:24,classTarget:"all"});var[evSaving,setEvSaving]=useState(false);var[evPushResult,setEvPushResult]=useState(null);
  // ── Feedback tab state ──
  var[fbList,setFbList]=useState([]);var[fbLoading,setFbLoading]=useState(false);
  var[fbFilter,setFbFilter]=useState("open"); // "all" | "open" | "resolved"
  var[fbDetailId,setFbDetailId]=useState(null);
  var[fbResNote,setFbResNote]=useState("");var[fbResBusy,setFbResBusy]=useState(false);
  var[fbToast,setFbToast]=useState(null);

  // B5 (2026-09-14) — l'onglet Feedback lisait `feedback_reports` SANS AUCUN filtre :
  // chaque formateur partenaire voyait les retours nominatifs (nom, promo, message
  // libre) de toutes les promos de la plateforme, soit une fuite de PII entre
  // établissements clients. Le scoping est désormais fait EN SQL par la RPC
  // (admin = tout, formateur = ses cohortes) et la table est fermée au client.
  // NE PAS réintroduire de `supabase.from('feedback_reports')` ici : depuis
  // 2026-09-14_p2b5_lock_feedback_events.sql, anon/authenticated n'y ont plus accès.
  function loadFeedback(){
    setFbLoading(true);
    supabase.rpc('teacher_feedback',{p_code:getDashTeacher()}).then(function(res){
      setFbLoading(false);
      if(res.error){console.warn("[fb] teacher_feedback failed:",res.error.message);setFbList([]);return;}
      if(!res.data||!res.data.ok){console.warn("[fb] refused:",res.data&&res.data.error);setFbList([]);return;}
      setFbList(res.data.reports||[]);
    }).catch(function(e){setFbLoading(false);console.warn("[fb] teacher_feedback caught:",e&&e.message);});
  }
  async function resolveFeedback(report){
    if(fbResBusy)return;
    var note=fbResNote.trim();
    setFbResBusy(true);
    var res=await supabase.rpc('teacher_resolve_feedback',{p_code:getDashTeacher(),p_id:String(report.id),p_note:note||null});
    if(res.error||!res.data||!res.data.ok){
      var why=res.error?res.error.message:(res.data&&res.data.error);
      console.warn("[fb] resolve refused:",why);
      setFbResBusy(false);
      setFbToast({err:why==="not_owner"?"Ce report n'est pas dans une de tes cohortes.":"Échec de la mise à jour."});
      setTimeout(function(){setFbToast(null);},3500);
      return;
    }
    // Best-effort push notif to the student (existing /api/push-send pipeline)
    var pushBody=note?("Ton report sur "+report.module_label+" a été traité : "+note):("Ton report sur "+report.module_label+" a été traité.");
    // H1 : le client lisait push_subscriptions lui-meme puis postait les endpoints bruts.
    // Desormais il envoie juste la cible (eleve + cohorte) et son code formateur ; c'est le
    // serveur qui resout les abonnements, apres avoir verifie que la cohorte est bien la
    // sienne. Un endpoint push ne transite plus par le navigateur.
    fetch('/api/push-send',{method:'POST',headers:{'Content-Type':'application/json'},
      body:JSON.stringify({teacherCode:getDashTeacher(),class_code:report.class_code,student_name:report.user_name,
        title:"📬 Feedback traité",body:pushBody,tag:'fb-'+report.id,url:"/"})})
      .then(function(r2){return r2.json();})
      .then(function(dd){
        if(dd&&dd.total===0)setFbToast({ok:"Marqué résolu (pas de push subscriber pour cet élève)."});
        else if(dd&&dd.error)setFbToast({err:"Marqué résolu, mais push refusé ("+dd.error+")."});
        else setFbToast({ok:"Marqué résolu + push envoyé."});
        setTimeout(function(){setFbToast(null);},3500);
      })
      .catch(function(e){console.warn("[fb] push failed:",e&&e.message);setFbToast({ok:"Marqué résolu (push indisponible)."});setTimeout(function(){setFbToast(null);},3500);});
    setFbDetailId(null);setFbResNote("");setFbResBusy(false);loadFeedback();
  }

  function loadEvents(){
    supabase.from('events').select('*').order('start_at',{ascending:false}).limit(50)
      .then(function(res){
        if(!res.data)return;
        // Filtrage d'AFFICHAGE, pas une frontière de sécurité : `events` reste
        // lisible par tous (le client élève en a besoin pour les bannières) et
        // n'y stocke aucune donnée personnelle. On scope pour la cohérence — sans
        // ça un formateur partenaire voyait l'historique des autres établissements
        // et se voyait proposer un bouton "Stop" que la RPC lui refuserait.
        if(isDashAdmin()){setDashEvents(res.data.slice(0,20));return;}
        var mine=groups.map(function(g){return g.code;});
        setDashEvents(res.data.filter(function(e){return mine.indexOf(e.class_code)>=0;}).slice(0,20));
      });
  }
  async function sendEventPush(title,body,targetClass){
    try{
      var res=await fetch('/api/push-send',{
        method:'POST',
        headers:{'Content-Type':'application/json'},
        body:JSON.stringify({teacherCode:getDashTeacher(),class_code:targetClass||'all',title:title,body:body,tag:'toeic-event'})
      });
      var data=await res.json();
      if(data.total===0){setEvPushResult({error:"No push subscribers found",total:0});setTimeout(function(){setEvPushResult(null);},5000);return;}
      var staleCount=(data.errors||[]).filter(function(e){return e.expired;}).length;
      setEvPushResult({sent:data.sent||0,total:data.total||0,staleCount:staleCount});
      setTimeout(function(){setEvPushResult(null);},5000);
    }catch(e){console.log('Push failed:',e);setEvPushResult({error:"Push send failed"});setTimeout(function(){setEvPushResult(null);},5000);}
  }
  // (Ces 4 useState et loadEvents étaient déclarés une SECONDE fois ici — 8 slots
  //  d'état inutiles à chaque render, et la 2e loadEvents masquait la 1re par
  //  hoisting. Doublon supprimé en B5 ; les originaux sont plus haut.)

  function loadGroups(){
    // B4 : le scoping multi-campus est fait EN SQL par la RPC teacher_groups.
    // On ne fait plus `select('*')` (le `*` inclurait teacher_code, dont la lecture
    // est révoquée) ni de filtre client sur teacher_code. La RPC renvoie déjà la
    // liste scopée, teacher_code retiré, et le rôle qui fait autorité.
    teacherAuth(getDashTeacher()).then(function(r){
      if(!r.ok){console.warn("[teacher] loadGroups refused:",r.error);setGroups([]);setGroupsStatus(r.error==="rpc_error"?"rpc_error":"invalid_code");return;}
      try{localStorage.setItem('toeic-dash-role',r.role);}catch(e){console.warn("[teacher] role store failed:",e&&e.message);}
      setGroups(r.groups);setGroupsStatus("ok");
    });
  }
  function retryGroups(){setGroupsStatus("loading");loadGroups();}
  // Code absent (purgé par un logout) ou refusé : on le redemande sur place plutôt que de
  // renvoyer l'enseignant à l'onboarding. Même validation serveur que les écrans d'entrée.
  async function reenterTeacherCode(){
    var code=prompt("Code formateur :");if(!code)return;
    setGroupsStatus("loading");
    var r=await teacherAuth(code);
    if(!r.ok){setGroupsStatus(r.error==="rpc_error"?"rpc_error":"invalid_code");if(r.error!=="rpc_error")alert("Code invalide");return;}
    setDashSession(code,r.role);
    setGroups(r.groups);setGroupsStatus("ok");
    // L'effet [groups] recharge les événements d'un formateur, pas ceux de l'admin (non filtrés).
    if(r.role==="admin")loadEvents();
  }
  useEffect(function(){loadGroups();loadEvents();},[]);
  // Une RPC qui ne répond jamais (réseau mobile, verrou d'auth) laissait le même « Loading » muet.
  useEffect(function(){
    if(groupsStatus!=="loading"){setGroupsSlow(false);return;}
    var t=setTimeout(function(){setGroupsSlow(true);},12000);
    return function(){clearTimeout(t);};
  },[groupsStatus]);
  // Guard-rail: if the remembered group isn't in the scoped set (stale localStorage
  // or a group belonging to another teacher), snap to the teacher's first group.
  useEffect(function(){
    if(!groups.length)return;
    var codes=groups.map(function(g){return g.code;});
    if(codes.indexOf(classCode)<0)setClassCode(groups[0].code);
  },[groups]);
  // B5 : la cible par défaut d'un événement est "all" (toute la plateforme), mais
  // cette option n'existe plus que pour l'admin. Sans ça, un formateur partenaire
  // verrait la 1re cohorte affichée dans le <select> alors que l'état vaut encore
  // "all" — et la RPC refuserait au moment de créer, sans explication visible.
  function defaultEventTarget(){return isDashAdmin()?"all":((groups[0]&&groups[0].code)||classCode);}
  useEffect(function(){
    if(isDashAdmin()||!groups.length)return;
    if(evForm.classTarget==="all")setEvForm(function(f){return Object.assign({},f,{classTarget:groups[0].code});});
    // loadEvents() filtre sur `groups`, qui est encore vide au montage → on
    // recharge l'historique une fois les cohortes connues.
    loadEvents();
  },[groups]);

  // ── Rapport hebdo : configuration email (popup) ──
  // Le cron (job pg_cron global) ramasse tout groupe ayant un teacher_email.
  // "Activer son rapport" = juste écrire l'email sur les groupes du formateur.
  // B4 : `currentTeacherCode()` a disparu — les groupes renvoyés par la RPC ne
  // portent plus `teacher_code`. Le serveur retrouve lui-même le code cible à
  // partir du code de cohorte sélectionné, et vérifie qu'il nous appartient.
  function openReportCfg(){
    var g=groups.find(function(x){return x.teacher_email;});
    setRcEmail((g&&g.teacher_email)||"");
    setRcOptin(g?g.weekly_report_optin!==false:true);
    setRcMsg(null);setShowReportCfg(true);
  }
  async function saveReportCfg(){
    var email=rcEmail.trim();
    if(email&&!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)){setRcMsg({err:true,text:"Email invalide."});return;}
    setRcBusy(true);
    // Portée "toutes mes cohortes" = tous les groupes partageant le teacher_code
    // de la cohorte sélectionnée. C'est le serveur qui le résout (le client ne
    // connaît plus les teacher_code) et qui vérifie qu'elle nous appartient.
    var r=await supabase.rpc('teacher_set_report_email',{p_code:getDashTeacher(),p_group_code:classCode,p_email:email||null,p_optin:rcOptin});
    setRcBusy(false);
    if(r.error){console.warn("[reportcfg] rpc failed:",r.error.message);setRcMsg({err:true,text:"Échec : "+r.error.message});return;}
    if(!r.data||!r.data.ok){
      var why=r.data&&r.data.error;
      console.warn("[reportcfg] refused:",why);
      setRcMsg({err:true,text:why==="no_teacher_code"?"Aucun code formateur rattaché à cette cohorte.":why==="not_owner"?"Cette cohorte n'est pas la tienne.":"Code formateur invalide — reconnecte-toi."});
      return;
    }
    setRcMsg({ok:true,text:email?"Enregistré — rapport hebdo activé pour toutes tes cohortes ✓":"Email retiré — plus de rapport hebdo."});
    loadGroups();
  }
  function sendReportPreview(){
    var email=rcEmail.trim();
    if(!email){setRcMsg({err:true,text:"Renseigne un email d'abord."});return;}
    setRcBusy(true);
    // B5 : la fonction exige désormais un code formateur valide (elle envoyait
    // l'agrégat de n'importe quelle cohorte à n'importe quelle adresse).
    supabase.functions.invoke('weekly-teacher-report',{body:{test:true,email:email,classCode:classCode,teacherCode:getDashTeacher()}})
      .then(function(res){
        setRcBusy(false);
        if(res.error){console.warn("[reportcfg] preview failed:",res.error&&res.error.message);setRcMsg({err:true,text:"Échec de l'aperçu : "+(res.error&&res.error.message)});return;}
        setRcMsg({ok:true,text:"Aperçu envoyé à "+email+" ✓ (vérifie ta boîte)"});
      })
      .catch(function(e){setRcBusy(false);console.warn("[reportcfg] preview caught:",e&&e.message);setRcMsg({err:true,text:"Échec : "+(e&&e.message)});});
  }

  // ── Cross-campus aggregation (admin-only super-admin view) ──
  function medianOf(arr){if(!arr.length)return null;var a=arr.slice().sort(function(x,y){return x-y;});var m=Math.floor(a.length/2);return a.length%2?a[m]:Math.round((a[m-1]+a[m])/2);}
  function loadCampusData(){
    var codes=groups.map(function(g){return g.code;});
    if(!codes.length){setCampusData({rows:[],totals:{campuses:0,students:0,active:0,median:null}});return;}
    setCampusData(null); // loading
    // Active = last_active within 7 days (last_active is a "YYYY-MM-DD" string → lexical compare works).
    var cutoff=new Date(Date.now()-7*864e5).toISOString().slice(0,10);
    // Phase C-lite : meme raison, via la RPC admin (scoping par teacher_role_of).
    supabase.rpc('teacher_campus_rows',{p_code:getDashTeacher()})
      .then(function(res){
        if(res.error){console.warn("[campus] teacher_campus_rows failed:",res.error.message);setCampusData({rows:[],totals:{campuses:0,students:0,active:0,median:null}});return;}
        if(!res.data||!res.data.ok){console.warn("[campus] refused:",res.data&&res.data.error);setCampusData({rows:[],totals:{campuses:0,students:0,active:0,median:null}});return;}
        var rows=(res.data.students||[]).filter(function(r){return !isGhost(r);});
        var byCode={};
        groups.forEach(function(g){byCode[g.code]={code:g.code,name:g.name,type:g.type,students:0,active:0,toeics:[],accSum:0,accCnt:0};});
        var allToeics=[],totActive=0;
        rows.forEach(function(s){
          var c=byCode[s.class_code];if(!c)return;
          c.students++;
          if((s.last_active||"")>=cutoff){c.active++;totActive++;}
          var t=estimateTOEICScore(s.module_scores||{}).total;
          if(t!==null&&t!==undefined){c.toeics.push(t);allToeics.push(t);}
          if(s.stats&&s.stats.totalQ>0){c.accSum+=s.stats.correct/s.stats.totalQ;c.accCnt++;}
        });
        var out=groups.map(function(g){var c=byCode[g.code];
          return{code:c.code,name:c.name,type:c.type,students:c.students,active:c.active,
            median:medianOf(c.toeics),acc:c.accCnt>0?Math.round(c.accSum/c.accCnt*100):null};});
        setCampusData({rows:out,totals:{campuses:out.length,students:rows.length,active:totActive,median:medianOf(allToeics)}});
      })
      .catch(function(e){console.warn("[campus] load failed:",e&&e.message);setCampusData({rows:[],totals:{campuses:0,students:0,active:0,median:null}});});
  }
  useEffect(function(){if(dashPhase==="campus"&&isDashAdmin())loadCampusData();},[dashPhase]);
  useEffect(function(){if(dashTab==="feedback")loadFeedback();},[dashTab]);
  // Onglet Usage (2026-09-23) : RPC anonyme teacher_usage, agrégée par lib/usageStats.js.
  var[usage,setUsage]=useState(null); // null = chargement, {error} ou le résultat de usageStats
  var[xpClamps,setXpClamps]=useState(null); // plafonnements XP nommés (teacher_xp_clamps)
  function loadUsage(){
    setUsage(null);
    supabase.rpc('teacher_usage',{p_code:getDashTeacher(),p_class_code:classCode}).then(function(res){
      if(res.error){console.warn("[usage] teacher_usage failed:",res.error.message);setUsage({error:res.error.message});return;}
      if(!res.data||!res.data.ok){console.warn("[usage] refused:",res.data&&res.data.error);setUsage({error:(res.data&&res.data.error)||"refused"});return;}
      setUsage(Object.assign(usageStats(res.data.students||[],new Date()),{strictSince:res.data.strict_since||null}));
    }).catch(function(e){console.warn("[usage] teacher_usage caught:",e&&e.message);setUsage({error:e&&e.message});});
    // Garde-fou XP (2026-09-24) : journées notées au-delà de +20 000 XP, plafonnées au-delà de +40 000 par save_student, NOMMÉES (RPC à part,
    // teacher_usage reste anonyme). Échec → section absente, l'onglet reste utilisable.
    setXpClamps(null);
    supabase.rpc('teacher_xp_clamps',{p_code:getDashTeacher(),p_class_code:classCode}).then(function(res){
      if(res.error||!res.data||!res.data.ok){console.warn("[usage] teacher_xp_clamps failed:",(res.error&&res.error.message)||(res.data&&res.data.error));setXpClamps([]);return;}
      setXpClamps(res.data.clamps||[]);
    }).catch(function(e){console.warn("[usage] teacher_xp_clamps caught:",e&&e.message);setXpClamps([]);});
  }
  useEffect(function(){if(dashTab==="usage")loadUsage();},[dashTab,classCode]);

  function loadStudents(){
    fetchRoster(classCode);
  }
  // Phase C-lite : les 3 chargements de roster lisaient `students` en direct, ce que le
  // verrou de privileges refuse. La RPC teacher_students applique le scoping formateur
  // (cohorte possedee, admin = toutes) et exclut Teacher cote serveur. Colonnes
  // identiques a DASH_STUDENT_COLS. Factorise au passage : c'etait copie-colle 3 fois.
  function fetchRoster(code){
    setLoad(true);
    supabase.rpc('teacher_students',{p_code:getDashTeacher(),p_class_code:code})
      .then(function(res){
        setLoad(false);
        if(res.error){console.warn("[dash] teacher_students failed:",res.error.message);setStudents([]);return;}
        if(!res.data||!res.data.ok){console.warn("[dash] roster refused:",res.data&&res.data.error);setStudents([]);return;}
        setStudents(res.data.students||[]);
      })
      .catch(function(e){setLoad(false);console.warn("[dash] teacher_students caught:",e&&e.message);});
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
    // Chantier B Phase 0 : superset complet pour l'export. On NE touche PAS
    // MISSION_MODULES (missions/tokens/dashboard en dépendent) — on étend
    // seulement la portée de l'export aux modules trackés mais sans colonne
    // jusqu'ici (Word Tavern, Linking Bridge, Gauntlet, Modal Council, Daily, Endless).
    var EXPORT_MODULES=MISSION_MODULES.concat([
      {id:"tavern",name:"Word Tavern"},
      {id:"bforge",name:"Linking Bridge"},
      {id:"gauntlet_irregular",name:"Gauntlet Irregular Crypt"},
      {id:"gauntlet_tense",name:"Gauntlet Chronomancer"},
      {id:"gauntlet_passive",name:"Gauntlet Passive Forge"},
      {id:"gauntlet_relative",name:"Gauntlet Relative Weaver"},
      {id:"modals_match",name:"Modal Council Oracle"},
      {id:"modals_sort",name:"Modal Council Verdict"},
      {id:"daily",name:"Daily Challenge"},
      {id:"endless",name:"Endless Arena"},
      {id:"hunt",name:"Mistake Hunt"},
      {id:"mimic",name:"Mimic Hunt"},
      {id:"mimic_listen",name:"Mimic Hunt Ecoute"}
    ]);
    var headers=[
      "Nom","Classe","XP Total","XP Semaine","Niveau","Ligue","Streak","Derniere activite",
      "Sessions totales","Temps total (min)",
      "Questions totales","Bonnes reponses","Precision globale %","Precision hors Flashcards %",
      "Cartes revisees","Exercices drill","Defis parfaits","Daily completions semaine",
      "TOEIC estime total","TOEIC Listening","TOEIC Reading",
      "Mock1 TOEIC estime /495","Mock1 Score %","Mock1 Questions","Mock1 Date","Mock1 Temps (min)",
      "Mock2 TOEIC estime /495","Mock2 Score %","Mock2 Questions","Mock2 Date","Mock2 Temps (min)",
      "Mock3 TOEIC estime /495","Mock3 Score %","Mock3 Questions","Mock3 Date","Mock3 Temps (min)",
      "Boss TOEIC estime /990","Boss Score %","Boss Questions","Boss Date","Boss Temps (min)",
      "SpeedEasy score","SpeedEasy temps (s)","SpeedHard score","SpeedHard temps (s)",
      "WordFall score","WordFall combo max",
      "Duel parties","Duel victoires","Duel XP vole",
      "Achievements debloques","Achievements total",
    ];
    EXPORT_MODULES.forEach(function(m){
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
        toeic.total===null?"non estim\u00e9":na(toeic.total),toeic.listening===null?"non estim\u00e9":na(toeic.listening),toeic.reading===null?"non estim\u00e9":na(toeic.reading),
      ].concat(mockC("mock1")).concat(mockC("mock2")).concat(mockC("mock3")).concat(mockC("boss")).concat([
        na(gs.matchEasy?gs.matchEasy.score:""),na(gs.matchEasy?gs.matchEasy.time:""),
        na(gs.matchHard?gs.matchHard.score:""),na(gs.matchHard?gs.matchHard.time:""),
        na(gs.wordFall?gs.wordFall.score:""),na(gs.wordFall?(gs.wordFall.maxCombo||0):""),
        na(gs.duel?gs.duel.played:0),na(gs.duel?gs.duel.wins:0),na(gs.duel?(gs.duel.wagerWon||0):0),
        na(ach.length),na(ACHIEVEMENTS.length),
      ]);
      EXPORT_MODULES.forEach(function(m){
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
        var toeicCol=toeic.total===null?"var(--t3)":toeic.total>=750?"var(--green)":toeic.total>=500?"var(--orange)":"var(--red)";
        return(<div style={{marginBottom:20}}>
          {/* TOEIC Score — full width banner */}
          <div className="crd" style={{padding:"12px 16px",marginBottom:8,background:"linear-gradient(135deg,rgba(var(--cx),.06),rgba(27,112,207,.06))",borderColor:"rgba(var(--cx),.15)",display:"flex",alignItems:"center",justifyContent:"space-between"}}>
            <div>
              <div className="out" style={{fontWeight:800,fontSize:11,color:"var(--t3)",letterSpacing:1,textTransform:"uppercase",marginBottom:2}}>Est. TOEIC Score</div>
              <div className="out" style={{fontWeight:900,fontSize:28,color:toeicCol,lineHeight:1}}>{toeic.total!==null?toeic.total:"\u2014"}<span style={{fontSize:13,color:"var(--t3)",fontWeight:400}}>/990</span></div>
            </div>
            <div style={{textAlign:"right"}}>
              <div style={{display:"flex",gap:12}}>
                <div style={{textAlign:"center"}}>
                  <div className="out" style={{fontWeight:700,fontSize:14,color:"var(--cyan)"}}>{toeic.listening!==null?toeic.listening:"\u2014"}</div>
                  <div style={{fontSize:9,color:"var(--t3)"}}>Listening</div>
                </div>
                <div style={{textAlign:"center"}}>
                  <div className="out" style={{fontWeight:700,fontSize:14,color:"var(--purple)"}}>{toeic.reading!==null?toeic.reading:"\u2014"}</div>
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
            {modsWithHistory.map(function(m){return(<option key={m.id} value={m.id}>{optIcon(m.icon)} {m.name}</option>);})}
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
            <span style={{width:20,display:"inline-flex",justifyContent:"center",fontSize:16}}>{GAME_ICON_PATHS[m.icon]?<GIcon name={m.icon} size={16} color="var(--t3)"/>:m.icon}</span><span style={{fontSize:13,color:"var(--t3)"}}>{m.name}</span>
            <span style={{marginLeft:"auto",fontSize:11,color:"var(--t3)"}}>Not started</span></div>);
          var modAcc=ms.total>0?Math.round(ms.correct/ms.total*100):0;
          var col=modAcc>=70?"var(--green)":modAcc>=50?"var(--orange)":"var(--red)";
          var histLen=(ms.history||[]).length;
          return(<div key={m.id} className="crd" style={{padding:"10px 14px",display:"flex",alignItems:"center",gap:10}}>
            <span style={{width:20,display:"inline-flex",justifyContent:"center",fontSize:16}}>{GAME_ICON_PATHS[m.icon]?<GIcon name={m.icon} size={16} color="var(--cyan)"/>:m.icon}</span>
            <div style={{flex:1,minWidth:0}}><div style={{fontSize:13,color:"var(--t1)"}} className="out">{m.name}</div>
              <div style={{fontSize:10,color:"var(--t3)"}}>{ms.sessions} sessions · Last: {ms.lastDate||"?"}{histLen>0?" · "+histLen+" data pts":""}</div></div>
            <div style={{textAlign:"right"}}><div className="out" style={{fontWeight:800,fontSize:15,color:col}}>{modAcc}%</div>
              <div style={{fontSize:10,color:"var(--t3)"}}>{ms.correct}/{ms.total}</div></div>
          </div>);
        })}
      </div>
      
      {/* Reinitialiser l'acces — Phase C : les comptes eleves ont un email synthetique,
          donc aucun "mot de passe oublie" par mail n'est possible. Ce bouton ne fabrique
          et ne transmet AUCUN mot de passe : il remet le compte a l'etat "a securiser",
          l'eleve en choisit un nouveau lui-meme a sa prochaine connexion. Sa progression
          n'est pas touchee. Cliquer pendant que l'eleve est present : entre le reset et
          sa reconnexion, le compte est reclamable par quelqu'un qui connait son prenom. */}
      <button className="btn2" onClick={async function(){
        var NL2=String.fromCharCode(10,10);
        if(!confirm("Réinitialiser l’accès de "+s.name+" ?"+NL2+"Il devra choisir un nouveau mot de passe à sa prochaine connexion. Sa progression est conservée."+NL2+"À faire pendant qu’il est avec toi : d’ici sa reconnexion, son compte est réclamable."))return;
        try{
          var rr=await fetch('/api/teacher-reset-student',{method:'POST',headers:{'Content-Type':'application/json'},
            body:JSON.stringify({teacherCode:getDashTeacher(),name:s.name,class_code:s.class_code})});
          var dd=await rr.json().catch(function(){return{};});
          if(!rr.ok||!dd.ok){
            console.warn("[teacher-reset] refused:",rr.status,dd&&dd.error);
            alert(rr.status===403?"Cet élève n'est pas dans une de tes cohortes."
                 :rr.status===404?"Élève introuvable."
                 :rr.status===401?"Code formateur invalide — reconnecte-toi."
                 :"Échec de la réinitialisation.");
            return;
          }
          alert("Accès réinitialisé. "+s.name+" choisira un nouveau mot de passe à sa prochaine connexion.");
          loadStudents();
        }catch(e){console.warn("[teacher-reset] caught:",e&&e.message);alert("Échec de la réinitialisation.");}
      }} style={{fontSize:12,color:"var(--cyan)",borderColor:"rgba(0,224,255,.2)",width:"100%",marginBottom:10}}>{"↻ Réinitialiser l'accès"}</button>

      {/* Delete student */}
      {/* B5 (2026-09-13) — ce bouton ne supprimait RIEN. Le filtre `.eq('id',s.id)`
          était bon (s.id EST la PK) mais ni anon ni authenticated n'ont le privilège
          DELETE sur students : 0 ligne affectée, erreur avalée, et l'UI affichait
          quand même un succès. Et aucune table satellite n'était purgée.
          Passe donc par teacher_delete_student (SECURITY DEFINER) : portée limitée
          aux cohortes du formateur, purge des satellites, trace dans
          teacher_audit_log. On identifie l'élève par (name, class_code) — la clé
          naturelle de toutes les tables satellites. */}
      <button className="btn2" onClick={async function(){
        if(prompt("Type DELETE to confirm removing "+s.name)!=="DELETE")return;
        var r=await supabase.rpc('teacher_delete_student',{p_code:getDashTeacher(),p_name:s.name,p_class_code:s.class_code});
        if(r.error){console.warn("[teacher-delete] rpc failed:",r.error.message);alert("Échec de la suppression : "+r.error.message);return;}
        if(!r.data||!r.data.ok){
          var why=r.data&&r.data.error;
          console.warn("[teacher-delete] refused:",why);
          alert(why==="not_owner"?"Cet élève n'est pas dans une de tes cohortes."
               :why==="no_student"?"Élève introuvable."
               :"Code formateur invalide — reconnecte-toi.");
          return;
        }
        setDetail(null);loadStudents();
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
      {groupsStatus==="loading"&&<div style={{textAlign:"center",padding:20}}>
        <p style={{color:"var(--t3)",fontSize:13}}>Loading groups...</p>
        {groupsSlow&&<button onClick={retryGroups} className="btn2" style={{marginTop:10,padding:"10px 20px",fontSize:13}}>{"Toujours en cours : réessayer"}</button>}
      </div>}
      {groupsStatus==="ok"&&groups.length===0&&<div style={{textAlign:"center",padding:20}}><p style={{color:"var(--t3)",fontSize:13}}>{"Aucun groupe rattaché à ce code formateur."}</p></div>}
      {(groupsStatus==="invalid_code"||groupsStatus==="rpc_error")&&<div className="crd" style={{textAlign:"center",padding:20,marginBottom:10}}>
        <p style={{color:"var(--t2)",fontSize:13,marginBottom:12}}>{groupsStatus==="invalid_code"?"Code formateur absent ou refusé : saisis-le à nouveau.":"Impossible de charger les groupes (réseau ?)."}</p>
        <button onClick={groupsStatus==="invalid_code"?reenterTeacherCode:retryGroups} className="btn1" style={{padding:"12px 24px",fontSize:14}}>{groupsStatus==="invalid_code"?"Saisir le code formateur":"Réessayer"}</button>
      </div>}
      <div style={{display:"flex",flexDirection:"column",gap:10}}>
        {groups.map(function(g){
          var typeIcon=g.type==="school"?"\uD83C\uDFEB":g.type==="pro"?"\uD83D\uDCBC":"\uD83C\uDF0D";
          var typeLabel=g.type==="school"?"School":g.type==="pro"?"Professional":"Visitor";
          var isExpired=g.end_date&&new Date(g.end_date+"T23:59:59")<new Date();
          return(<button key={g.code} onClick={function(){
            setClassCode(g.code);
            try{localStorage.setItem('toeic-dash-group',g.code);}catch(e){}
            setLoad(true);setDetail(null);setDashPhase("dashboard");
            fetchRoster(g.code);
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
      {isDashAdmin()&&groups.length>0&&<button onClick={function(){setDashPhase("campus");}} className="crd" style={{display:"flex",alignItems:"center",gap:16,padding:"16px 20px",cursor:"pointer",border:"1px solid rgba(var(--cx),.25)",background:"rgba(var(--cx),.06)",borderRadius:16,textAlign:"left",fontFamily:"'DM Sans',sans-serif",width:"100%",marginTop:14}}>
        <div style={{width:48,height:48,borderRadius:14,background:"rgba(var(--cx),.12)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:24,flexShrink:0}}>{"\ud83c\udfeb"}</div>
        <div style={{flex:1,minWidth:0}}>
          <div className="out" style={{fontWeight:700,fontSize:15,color:"var(--cyan)",marginBottom:2}}>{"Vue tous campus"}</div>
          <div style={{fontSize:11,color:"var(--t3)"}}>{"Comparer l'engagement et le niveau par campus"}</div>
        </div>
        <div style={{color:"var(--cyan)",fontSize:16}}>{"\u2192"}</div>
      </button>}
      <button onClick={async function(){var code=prompt("Code administrateur :");if(!code)return;var r=await teacherAuth(code);if(!r.ok){alert("Code invalide");return;}setCgForm({name:"",code:"",teacherCode:r.role==="admin"?"":getDashTeacher(),type:"school",startDate:"",endDate:"",teacherEmail:"",reportOptin:true});setCgCodeErr("");setDashPhase("create-group");}} className="btn2" style={{width:"100%",marginTop:16,padding:"14px 24px",fontSize:14,borderColor:"rgba(0,224,255,.2)",color:"var(--cyan)"}}>
        {"\u2795 Cr\u00e9er un groupe"}
      </button>
      <button onClick={p.back} style={{display:"block",margin:"16px auto 0",background:"none",border:"none",color:"var(--t3)",fontSize:13,cursor:"pointer"}}>{"\u2190"} Exit</button>
      {/* "Exit" ne fait que quitter la vue \u2014 le code formateur restait stock\u00e9.
          Vraie d\u00e9connexion (B4) : purge le code, le r\u00f4le et la cohorte m\u00e9moris\u00e9e. */}
      <button onClick={function(){if(!confirm("Se d\u00e9connecter du dashboard formateur ? Il faudra ressaisir ton code."))return;clearDashSession();p.back();}}
        style={{display:"block",margin:"8px auto 0",background:"none",border:"none",color:"var(--t3)",fontSize:12,cursor:"pointer",textDecoration:"underline"}}>{"Se d\u00e9connecter (formateur)"}</button>
    </div>
  </div>);

  // CROSS-CAMPUS PHASE (admin-only super-admin overview)
  if(dashPhase==="campus"){
    var cSorted=campusData?campusData.rows.slice().sort(function(a,b){
      if(campusSort==="active")return b.active-a.active;
      if(campusSort==="students")return b.students-a.students;
      var am=a.median===null?-1:a.median,bm=b.median===null?-1:b.median;return bm-am; // toeic median desc, nulls last
    }):[];
    var cTot=campusData?campusData.totals:{campuses:0,students:0,active:0,median:null};
    return(<div className="app enter" style={{padding:"20px 16px 40px"}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:20}}>
        <button onClick={function(){setDashPhase("picker");}} style={{background:"none",border:"none",color:"var(--t2)",cursor:"pointer",fontSize:14}}>{"\u2190"} Groups</button>
        <span className="out" style={{fontWeight:700,fontSize:15}}>{"\ud83c\udfeb Tous campus"}</span>
        <div style={{width:60}}/>
      </div>
      {campusData===null?
        <div style={{textAlign:"center",padding:40,color:"var(--t3)",fontSize:13}}>{"Chargement des campus\u2026"}</div>
      :<div>
        <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:6,marginBottom:16}}>
          <div className="crd" style={{padding:10,textAlign:"center"}}><div className="out" style={{fontSize:18,fontWeight:800,color:"var(--cyan)"}}>{cTot.campuses}</div><div style={{fontSize:10,color:"var(--t3)"}}>Campus</div></div>
          <div className="crd" style={{padding:10,textAlign:"center"}}><div className="out" style={{fontSize:18,fontWeight:800,color:"var(--purple)"}}>{cTot.students}</div><div style={{fontSize:10,color:"var(--t3)"}}>{"\u00c9l\u00e8ves"}</div></div>
          <div className="crd" style={{padding:10,textAlign:"center"}}><div className="out" style={{fontSize:18,fontWeight:800,color:"var(--green)"}}>{cTot.active}</div><div style={{fontSize:10,color:"var(--t3)"}}>{"Actifs 7j"}</div></div>
          <div className="crd" style={{padding:10,textAlign:"center"}}><div className="out" style={{fontSize:18,fontWeight:800,color:"var(--orange)"}}>{cTot.median!==null?cTot.median:"\u2014"}</div><div style={{fontSize:10,color:"var(--t3)"}}>{"TOEIC m\u00e9d."}</div></div>
        </div>
        <div style={{display:"flex",gap:6,marginBottom:14}}>
          {[{k:"toeic",l:"TOEIC m\u00e9dian"},{k:"active",l:"Actifs 7j"},{k:"students",l:"\u00c9l\u00e8ves"}].map(function(o){
            var sel=campusSort===o.k;
            return(<button key={o.k} onClick={function(){setCampusSort(o.k);}} className="out" style={{flex:1,padding:"8px 6px",borderRadius:10,border:sel?"1.5px solid var(--cyan)":"1px solid var(--bdr)",background:sel?"rgba(var(--cx),.08)":"var(--bg2)",color:sel?"var(--cyan)":"var(--t3)",fontSize:12,fontWeight:sel?700:500,cursor:"pointer",fontFamily:"'DM Sans',sans-serif"}}>{o.l}</button>);
          })}
        </div>
        <div style={{display:"flex",flexDirection:"column",gap:8}}>
          {cSorted.map(function(c){
            var typeIcon=c.type==="school"?"\ud83c\udfeb":c.type==="pro"?"\ud83d\udcbc":"\ud83c\udf0d";
            var actPct=c.students>0?Math.round(c.active/c.students*100):0;
            return(<button key={c.code} onClick={function(){
              setClassCode(c.code);try{localStorage.setItem('toeic-dash-group',c.code);}catch(e){console.warn("[campus] set group failed:",e&&e.message);}
              setLoad(true);setDetail(null);setDashTab("overview");setDashPhase("dashboard");
              fetchRoster(c.code);
            }} className="crd" style={{display:"flex",alignItems:"center",gap:12,padding:"14px 16px",cursor:"pointer",border:"1px solid var(--bdr)",background:"var(--bg2)",borderRadius:14,textAlign:"left",fontFamily:"'DM Sans',sans-serif",width:"100%"}}>
              <div style={{fontSize:20,flexShrink:0}}>{typeIcon}</div>
              <div style={{flex:1,minWidth:0}}>
                <div className="out" style={{fontWeight:700,fontSize:14,color:"var(--t1)",marginBottom:4,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{c.name}</div>
                <div style={{display:"flex",gap:10,fontSize:11,color:"var(--t3)",flexWrap:"wrap"}}>
                  <span>{"\ud83d\udc65 "}{c.students}</span>
                  <span style={{color:actPct>=50?"var(--green)":actPct>=25?"var(--orange)":"var(--red)"}}>{"\u25cf "}{c.active} ({actPct}%)</span>
                  <span>{"\ud83c\udfaf "}{c.median!==null?c.median:"\u2014"}</span>
                  <span>{c.acc!==null?c.acc+"% acc":"\u2014"}</span>
                </div>
              </div>
              <div style={{color:"var(--t3)",fontSize:15}}>{"\u2192"}</div>
            </button>);
          })}
        </div>
        <div style={{fontSize:11,color:"var(--t3)",textAlign:"center",marginTop:16}}>{"\u25cf Actifs = derni\u00e8re activit\u00e9 dans les 7 jours. Ghosts exclus. TOEIC estim\u00e9 (m\u00e9diane, profils non estimables exclus)."}</div>
      </div>}
    </div>);
  }

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
          // Existence du code par RPC (`groups` n'est plus lisible en direct, verrou P2-D5).
          if(v.length>=3){supabase.rpc('group_public',{p_code:v}).then(function(res){if(res.error)console.warn("[dash] group_public failed:",res.error.message);setCgCodeErr(res.data?"Ce code existe d\u00e9j\u00e0":"");});}else{setCgCodeErr("");}

        }} placeholder="ex: idrac2027" style={{width:"100%",padding:"12px 16px",background:"var(--bg2)",border:"1px solid "+(cgCodeErr?"var(--red)":"var(--bdr)"),borderRadius:12,color:"var(--t1)",fontSize:14,fontFamily:"'DM Sans',sans-serif",outline:"none",marginBottom:4,boxSizing:"border-box"}}/>
        {cgCodeErr&&<p style={{fontSize:11,color:"var(--red)",margin:"0 0 12px"}}>{cgCodeErr}</p>}
        {!cgCodeErr&&<div style={{height:12}}/>}

        {/* Teacher Code */}
        <label className="out" style={{fontSize:11,fontWeight:600,color:"var(--t2)",textTransform:"uppercase",letterSpacing:1,display:"block",marginBottom:6}}>{"Code d\u0027acc\u00e8s enseignant"}</label>
        <input value={cgForm.teacherCode} readOnly={!isDashAdmin()} onChange={function(e){if(!isDashAdmin())return;setCgForm(Object.assign({},cgForm,{teacherCode:e.target.value}));}}
          placeholder="ex: arena-idrac2027" title={isDashAdmin()?"":"Verrouillé sur votre code formateur"} style={{width:"100%",padding:"12px 16px",background:"var(--bg2)",border:"1px solid var(--bdr)",borderRadius:12,color:isDashAdmin()?"var(--t1)":"var(--t3)",fontSize:14,fontFamily:"'DM Sans',sans-serif",outline:"none",marginBottom:16,boxSizing:"border-box",cursor:isDashAdmin()?"text":"not-allowed"}}/>
        {!isDashAdmin()&&<div style={{fontSize:11,color:"var(--t3)",marginTop:-10,marginBottom:14}}>{"Les groupes que vous créez sont rattachés à votre code formateur."}</div>}

        {/* Teacher Email — rapport pédagogique hebdo automatique */}
        <label className="out" style={{fontSize:11,fontWeight:600,color:"var(--t2)",textTransform:"uppercase",letterSpacing:1,display:"block",marginBottom:6}}>{"Email rapport hebdo (optionnel)"}</label>
        <input type="email" value={cgForm.teacherEmail} onChange={function(e){setCgForm(Object.assign({},cgForm,{teacherEmail:e.target.value}));}}
          placeholder="prenom.nom@ecole.fr" style={{width:"100%",padding:"12px 16px",background:"var(--bg2)",border:"1px solid var(--bdr)",borderRadius:12,color:"var(--t1)",fontSize:14,fontFamily:"'DM Sans',sans-serif",outline:"none",marginBottom:8,boxSizing:"border-box"}}/>
        <div onClick={function(){if(!cgForm.teacherEmail.trim())return;setCgForm(Object.assign({},cgForm,{reportOptin:!cgForm.reportOptin}));}}
          style={{display:"flex",alignItems:"center",gap:8,cursor:cgForm.teacherEmail.trim()?"pointer":"not-allowed",opacity:cgForm.teacherEmail.trim()?1:.5,marginBottom:16}}>
          <div style={{width:38,height:22,borderRadius:11,background:cgForm.reportOptin?"var(--cyan)":"var(--bdr)",position:"relative",transition:"background .2s",flexShrink:0}}>
            <div style={{width:16,height:16,borderRadius:8,background:"#fff",position:"absolute",top:3,left:cgForm.reportOptin?19:3,transition:"left .2s"}}/>
          </div>
          <span style={{fontSize:12,color:"var(--t2)"}}>{"Recevoir le rapport pédagogique chaque lundi"}</span>
        </div>

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
        <button className="btn1" onClick={async function(){
          if(!cgValid||cgSaving)return;
          setCgSaving(true);
          // B4 : l'upsert direct permettait de réutiliser le `code` d'une cohorte
          // existante et d'en écraser la ligne, teacher_code compris — soit une
          // prise de contrôle de la cohorte d'un autre formateur. La RPC refuse
          // (not_owner) et ignore p_teacher_code sauf pour l'admin.
          var r=await supabase.rpc('teacher_upsert_group',{
            p_code:getDashTeacher(),p_group_code:cgForm.code,p_name:cgForm.name.trim(),p_type:cgForm.type,
            p_start:cgForm.startDate,p_end:cgForm.endDate,p_seasons:cgSeasons,
            p_teacher_code:cgForm.teacherCode.trim()||null,
            p_teacher_email:cgForm.teacherEmail.trim()||null,p_optin:cgForm.reportOptin
          });
          setCgSaving(false);
          if(r.error){alert("Erreur: "+r.error.message);return;}
          if(!r.data||!r.data.ok){
            var why=r.data&&r.data.error;
            console.warn("[create-group] refused:",why);
            alert(why==="not_owner"?"Ce code de cohorte appartient déjà à un autre formateur."
                 :why==="reserved_code"?"Ce code est réservé."
                 :why==="bad_group_code"?"Code de cohorte trop court."
                 :"Code formateur invalide — reconnecte-toi.");
            return;
          }
          loadGroups();setDashPhase("picker");
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
      {[{id:"overview",label:"👥 Students"},{id:"analytics",label:"📊 Analytics"},{id:"events",label:"🎪 Events"},{id:"feedback",label:"📬 Feedback"},{id:"usage",label:"📈 Usage"}].map(function(t){
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
        <button className="btn2" onClick={openReportCfg} style={{flex:"1 1 30%",fontSize:13,borderColor:"rgba(240,200,80,.4)",color:"var(--gold)"}}>📧 Rapport hebdo</button>
      </div>

      {/* ── Popup config rapport hebdo (email + aperçu + accès doc imprimable) ── */}
      {showReportCfg&&(<div onClick={function(){if(!rcBusy)setShowReportCfg(false);}} style={{position:"fixed",inset:0,background:"rgba(0,0,0,.6)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:200,padding:16}}>
        <div onClick={function(e){e.stopPropagation();}} className="crd" style={{width:"100%",maxWidth:440,padding:24,borderRadius:16,maxHeight:"90vh",overflowY:"auto"}}>
          <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:4}}>
            <h2 className="out" style={{fontWeight:800,fontSize:18,color:"var(--gold)",margin:0}}>{"📧 Rapport hebdo"}</h2>
            <button onClick={function(){if(!rcBusy)setShowReportCfg(false);}} style={{background:"none",border:"none",color:"var(--t3)",fontSize:22,cursor:"pointer",lineHeight:1}}>{"×"}</button>
          </div>
          <p style={{fontSize:12,color:"var(--t3)",margin:"0 0 18px"}}>{"Reçois chaque lundi un rapport pédagogique de tes cohortes : ce qui coince, ce qui est peu travaillé, et 3 activités à proposer."}</p>

          <label className="out" style={{fontSize:11,fontWeight:600,color:"var(--t2)",textTransform:"uppercase",letterSpacing:1,display:"block",marginBottom:6}}>{"Ton email"}</label>
          <input type="email" value={rcEmail} onChange={function(e){setRcEmail(e.target.value);}} placeholder="prenom.nom@ecole.fr"
            style={{width:"100%",padding:"12px 16px",background:"var(--bg2)",border:"1px solid var(--bdr)",borderRadius:12,color:"var(--t1)",fontSize:14,fontFamily:"'DM Sans',sans-serif",outline:"none",marginBottom:14,boxSizing:"border-box"}}/>

          <div onClick={function(){setRcOptin(!rcOptin);}} style={{display:"flex",alignItems:"center",gap:8,cursor:"pointer",marginBottom:18}}>
            <div style={{width:38,height:22,borderRadius:11,background:rcOptin?"var(--cyan)":"var(--bdr)",position:"relative",transition:"background .2s",flexShrink:0}}>
              <div style={{width:16,height:16,borderRadius:8,background:"#fff",position:"absolute",top:3,left:rcOptin?19:3,transition:"left .2s"}}/>
            </div>
            <span style={{fontSize:12,color:"var(--t2)"}}>{"Recevoir le rapport chaque lundi"}</span>
          </div>

          {rcMsg&&<div style={{padding:"10px 12px",borderRadius:10,marginBottom:14,fontSize:12,background:rcMsg.err?"rgba(224,82,82,.1)":"rgba(74,190,96,.1)",color:rcMsg.err?"var(--red)":"var(--green)"}}>{rcMsg.text}</div>}

          <div style={{display:"flex",gap:8,marginBottom:10}}>
            <button className="btn1" onClick={saveReportCfg} disabled={rcBusy} style={{flex:1,fontSize:13,opacity:rcBusy?.5:1}}>{rcBusy?"…":"Enregistrer"}</button>
            <button className="btn2" onClick={sendReportPreview} disabled={rcBusy} style={{flex:1,fontSize:13,borderColor:"rgba(var(--cx),.3)",color:"var(--cyan)",opacity:rcBusy?.5:1}}>{"M'envoyer un aperçu"}</button>
          </div>

          <button onClick={function(){setShowReportCfg(false);setShowReport(true);}} style={{background:"none",border:"none",color:"var(--t3)",fontSize:12,cursor:"pointer",textDecoration:"underline",padding:"8px 0 0",width:"100%"}}>{"Voir / imprimer le rapport complet (direction)"}</button>
        </div>
      </div>)}

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
            if(sortBy==="toeic"){return (estimateTOEIC(b).total||-1)-(estimateTOEIC(a).total||-1);}
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
              var toeicCol=toeic.total===null?"var(--t3)":toeic.total>=750?"var(--green)":toeic.total>=500?"var(--orange)":"var(--red)";
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
                  <div className="out" style={{fontWeight:800,fontSize:15,color:toeicCol}}>{toeic.total!==null?toeic.total:"\u2014"}</div>
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
              {(function(){var mm=MISSION_MODULES.find(function(x){return x.id===m.id;});var ic=mm&&mm.icon;return(<span style={{fontSize:12,color:"var(--t2)",display:"inline-flex",alignItems:"center",gap:6}}>{ic?(GAME_ICON_PATHS[ic]?<GIcon name={ic} size={14} color="var(--t2)"/>:<span>{ic}</span>):null}{m.fullName}</span>);})()}
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
                      <span style={{fontSize:10,color:tone(lg.color),fontWeight:600}}>{lg.icon}</span>
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
            {MISSION_MODULES.map(function(m){return(<option key={m.id} value={m.id}>{optIcon(m.icon)} {m.name}</option>);})}
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
            {/* B5 : « All groups » = toute la plateforme, tous établissements
                confondus (événement + push). Réservé à l'admin — un formateur
                partenaire ne doit pas pouvoir arroser les cohortes des autres.
                La RPC refuse aussi côté serveur (not_owner), ceci n'est que l'UI. */}
            {isDashAdmin()&&<option value="all">All groups</option>}
            {groups.map(function(g){return(<option key={g.code} value={g.code}>{g.name} ({g.code})</option>);})}
          </select>
        </div>
        <button className="btn1" disabled={evSaving||!evForm.title.trim()} onClick={async function(){
          setEvSaving(true);setEvPushResult(null);
          // B5 : l'insert direct n'était gardé que par le flag localStorage du
          // dashboard. La RPC vérifie la propriété de la cohorte, calcule elle-même
          // start_at/end_at (on ne fait plus confiance aux timestamps du client) et
          // borne multiplicateur et durée.
          var config={multiplier:evForm.multiplier};
          if(evForm.type==="spotlight")config.module=evForm.module;
          var res=await supabase.rpc('teacher_create_event',{
            p_code:getDashTeacher(),p_type:evForm.type,p_title:evForm.title.trim(),
            p_desc:evForm.desc.trim()||null,p_class_code:evForm.classTarget,
            p_hours:evForm.hours,p_config:config
          });
          if(res.error||!res.data||!res.data.ok){
            var why=res.error?res.error.message:(res.data&&res.data.error);
            console.warn("[event] create refused:",why);
            setEvPushResult({error:why==="not_owner"?"Cette cohorte n'est pas la tienne":why==="bad_type"?"Type d'événement invalide":"Création refusée — reconnecte-toi"});
            setTimeout(function(){setEvPushResult(null);},5000);
            setEvSaving(false);return;
          }
          var icon=evForm.type==="spotlight"?"🎯":evForm.type==="flash_hour"?"⚡":"💪";
          var pushTitle=icon+" "+evForm.title.trim();
          var pushBody=evForm.desc.trim()||(evForm.type==="spotlight"?"x"+evForm.multiplier+" XP on "+evForm.module+" — go train!":evForm.type==="flash_hour"?"x"+evForm.multiplier+" XP on everything for "+evForm.hours+"h!":"x"+evForm.multiplier+" XP boost for those catching up!");
          sendEventPush(pushTitle,pushBody,evForm.classTarget);
          setEvForm({type:"spotlight",title:"",desc:"",module:"drill",multiplier:2,hours:24,classTarget:defaultEventTarget()});
          loadEvents();
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
                  // B5 : l'erreur était totalement avalée ici — un refus passait
                  // pour un succès (le bouton disparaissait au rechargement… ou pas).
                  var r=await supabase.rpc('teacher_stop_event',{p_code:getDashTeacher(),p_id:String(ev.id)});
                  if(r.error||!r.data||!r.data.ok){
                    var why=r.error?r.error.message:(r.data&&r.data.error);
                    console.warn("[event] stop refused:",why);
                    setEvPushResult({error:why==="not_owner"?"Cet événement n'est pas le tien":"Arrêt refusé"});
                    setTimeout(function(){setEvPushResult(null);},5000);
                    return;
                  }
                  loadEvents();
                }} style={{background:"none",border:"1px solid var(--red)",borderRadius:8,padding:"4px 8px",fontSize:10,color:"var(--red)",cursor:"pointer",fontFamily:"'DM Sans',sans-serif"}}>Stop</button>}
              </div>
            </div>
          </div>);
        })}
      </div>
    </div>)}

    {/* ═══ USAGE TAB (2026-09-23) : parties, portée, abandons, missions, bestiaire ═══ */}
    {dashTab==="usage"&&(function(){
      var pct=function(x){return x==null?"—":Math.round(x*100)+" %";};
      var capDate=usage&&usage.captureStart?usage.captureStart.split("-").reverse().slice(0,2).join("/"):"";
      if(!usage)return(<div className="out" style={{color:"var(--t3)",fontSize:13,padding:20,textAlign:"center"}}>{"Chargement…"}</div>);
      if(usage.error)return(<div className="out" style={{color:"var(--t3)",fontSize:13,padding:20,textAlign:"center"}}>{"Usage indisponible ("+usage.error+")."}<br/><button onClick={loadUsage} className="btn2" style={{marginTop:10}}>{"Réessayer"}</button></div>);
      var kpi=[
        {v:usage.active7+" / "+usage.students,l:"actifs 7 j"},
        {v:usage.active30+" / "+usage.students,l:"actifs 30 j"},
        {v:pct(usage.mission.rate),l:"missions faites (jours actifs, depuis le "+capDate+")"},
        {v:usage.bestiary.slain+" / "+usage.bestiary.caught,l:"créatures vaincues / créées (5 sem.)"},
      ];
      var th={textAlign:"right",padding:"6px 4px",fontWeight:600,color:"var(--t3)",fontSize:11};
      var td={textAlign:"right",padding:"6px 4px",fontSize:12,color:"var(--t2)"};
      return(<div>
        <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(140px,1fr))",gap:8,marginBottom:14}}>
          {kpi.map(function(k){return(<div key={k.l} className="crd" style={{padding:12}}><div className="out" style={{fontSize:20,fontWeight:700,color:"var(--t1)"}}>{k.v}</div><div style={{fontSize:11,color:"var(--t3)",marginTop:4}}>{k.l}</div></div>);})}
        </div>
        {/* Phase C (2026-09-24) : avancement de la sécurisation des comptes de la promo (visiteurs exclus : toujours tolérés). */}
        {classCode!=="visitor"&&usage.security&&(function(){
          var sec=usage.security,n=sec.activeUnsecured30,pl=n>1;
          var line=usage.strictSince
            ?"Mode strict depuis le "+String(usage.strictSince).slice(0,10).split("-").reverse().join("/")+" : un élève sans mot de passe passe par l'écran « Sécurise ton compte » à sa prochaine ouverture (progression conservée)."
            :(n>0
              ?n+" élève"+(pl?"s":"")+" actif"+(pl?"s":"")+" sur 30 j sans mot de passe : "+(pl?"ils verront":"il verra")+" l'écran de sécurisation quand la promo passera en mode strict."
              :"Aucun élève actif sur 30 j sans mot de passe : la promo peut passer en mode strict sans gêner personne.");
          return(<div className="crd" style={{padding:12,marginBottom:14}}>
            <div className="out" style={{fontSize:13,fontWeight:700,color:"var(--t1)"}}>{"🔒 Comptes sécurisés : "+sec.secured+" / "+sec.total}</div>
            <div style={{fontSize:12,color:"var(--t2)",marginTop:6,lineHeight:1.5}}>{line}</div>
          </div>);
        })()}
        <div className="crd" style={{padding:12,overflowX:"auto"}}>
          <table style={{width:"100%",borderCollapse:"collapse",fontFamily:"'DM Sans',sans-serif"}}>
            <thead><tr><th style={Object.assign({},th,{textAlign:"left"})}>{"Module"}</th><th style={th}>{"Parties 7 j"}</th><th style={th}>{"Parties 30 j"}</th><th style={th}>{"Élèves 30 j"}</th><th style={th}>{"Abandons"}</th><th style={th}>{"Taux d'abandon"}</th></tr></thead>
            <tbody>{usage.modules.map(function(m){return(<tr key={m.id} style={{borderTop:"1px solid var(--bdr)"}}>
              <td style={Object.assign({},td,{textAlign:"left",color:"var(--t1)"})}>{m.label}</td>
              <td style={td}>{m.plays7}</td><td style={td}>{m.plays30}</td>
              <td style={td}>{m.reach30+" ("+Math.round(m.reach30/Math.max(1,usage.students)*100)+" %)"}</td>
              <td style={td}>{m.quits30}</td>
              <td style={td}>{m.attempts>=5?pct(m.quitRate):"—"}</td>
            </tr>);})}</tbody>
          </table>
          {!usage.modules.length&&<div style={{fontSize:12,color:"var(--t3)",padding:12,textAlign:"center"}}>{"Aucune partie sur 30 jours."}</div>}
          <div style={{fontSize:11,color:"var(--t3)",marginTop:10,lineHeight:1.5}}>{"Abandon = « Leave this round » confirmé après au moins une réponse (Boss et Endless exclus, ils reprennent). Compté depuis le "+capDate+" ; taux affiché à partir de 5 tentatives. Les épreuves du Gauntlet et du Modal Council comptent au hub."}</div>
        </div>
        {xpClamps&&xpClamps.length>0&&<div className="crd" style={{padding:12,marginTop:14,overflowX:"auto"}}>
          <div className="out" style={{fontSize:13,fontWeight:700,color:"var(--t1)",marginBottom:8}}>{"⚠️ Activité anormale (30 j)"}</div>
          <table style={{width:"100%",borderCollapse:"collapse",fontFamily:"'DM Sans',sans-serif"}}>
            <thead><tr><th style={Object.assign({},th,{textAlign:"left"})}>{"Élève"}</th><th style={th}>{"Jour"}</th><th style={th}>{"XP demandée"}</th><th style={th}>{"XP gardée"}</th><th style={th}>{"Tentatives"}</th></tr></thead>
            <tbody>{xpClamps.map(function(c){return(<tr key={c.name+c.day} style={{borderTop:"1px solid var(--bdr)"}}>
              <td style={Object.assign({},td,{textAlign:"left",color:"var(--t1)"})}>{c.name}</td>
              <td style={td}>{String(c.day).split("-").reverse().slice(0,2).join("/")}</td>
              <td style={td}>{"+"+(c.claimed_xp-c.base_xp).toLocaleString("fr-FR")}</td>
              <td style={td}>{c.clamped?"+"+(c.accepted_xp-c.base_xp).toLocaleString("fr-FR"):"tout"}</td>
              <td style={td}>{c.hits}</td>
            </tr>);})}</tbody>
          </table>
          <div style={{fontSize:11,color:"var(--t3)",marginTop:10,lineHeight:1.5}}>{"Journée notée ici dès que l'XP d'un élève monte de plus de 20 000 (les plus grosses semaines réelles en font 30 000 à 44 000) : très gros joueur, longue partie hors ligne, ou XP écrite à la main. Au-delà de 40 000 dans la journée, l'XP est plafonnée (« XP gardée ») ; en dessous, rien n'est retiré (« tout »). Le reste du profil est toujours sauvegardé."}</div>
        </div>}
      </div>);
    })()}

    {/* ═══ FEEDBACK TAB ═══ */}
    {dashTab==="feedback"&&(<div>
      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:14,gap:8}}>
        <h3 className="out" style={{fontWeight:700,fontSize:14,margin:0,color:"var(--t2)"}}>{"📬 Student feedback"}</h3>
        <button onClick={loadFeedback} style={{background:"none",border:"1px solid var(--bdr)",color:"var(--t3)",fontSize:11,padding:"6px 10px",borderRadius:8,cursor:"pointer",fontFamily:"'DM Sans',sans-serif"}}>{fbLoading?"…":"Refresh"}</button>
      </div>

      {/* Filter pills */}
      <div style={{display:"flex",gap:6,marginBottom:14}}>
        {[{id:"open",l:"Open"},{id:"resolved",l:"Resolved"},{id:"all",l:"All"}].map(function(f){
          var active=fbFilter===f.id;
          var count=fbList.filter(function(r){return f.id==="all"?true:r.status===f.id;}).length;
          return(<button key={f.id} onClick={function(){setFbFilter(f.id);}} style={{flex:1,padding:"8px 6px",background:active?"var(--bg3)":"var(--bg2)",border:"1px solid "+(active?"var(--cyan)":"var(--bdr)"),borderRadius:10,color:active?"var(--cyan)":"var(--t3)",fontSize:12,fontWeight:active?700:500,cursor:"pointer",fontFamily:"'DM Sans',sans-serif"}}>{f.l} ({count})</button>);
        })}
      </div>

      {fbToast&&<div style={{padding:"10px 12px",marginBottom:12,background:fbToast.err?"rgba(239,68,68,.1)":"rgba(34,197,94,.1)",border:"1px solid "+(fbToast.err?"rgba(239,68,68,.3)":"rgba(34,197,94,.3)"),borderRadius:10,color:fbToast.err?"#ef4444":"#22c55e",fontSize:12.5}}>{fbToast.err||fbToast.ok}</div>}

      {fbLoading?(<div style={{textAlign:"center",padding:30,color:"var(--t3)",fontSize:13}}>Chargement…</div>):(
        function(){
          var filtered=fbList.filter(function(r){return fbFilter==="all"?true:r.status===fbFilter;});
          if(filtered.length===0)return(<div className="crd" style={{padding:24,textAlign:"center",color:"var(--t3)",fontSize:13}}>{fbFilter==="open"?"Aucun feedback ouvert pour le moment. 🎉":fbFilter==="resolved"?"Aucun feedback résolu encore.":"Aucun feedback dans la base."}</div>);
          var TYPE_META={bug:{l:"🐞 Bug",c:"#dc2626"},suggestion:{l:"💡 Suggestion",c:"#0891b2"},question:{l:"❓ Question",c:"#7c3aed"}};
          return(<div style={{display:"flex",flexDirection:"column",gap:8}}>
            {filtered.map(function(r){
              var open=fbDetailId===r.id;
              var meta=TYPE_META[r.feedback_type]||{l:r.feedback_type,c:"var(--t3)"};
              var d=new Date(r.created_at);var when=d.toLocaleDateString("fr-FR",{day:"2-digit",month:"short"})+" "+d.toLocaleTimeString("fr-FR",{hour:"2-digit",minute:"2-digit"});
              return(<div key={r.id} className="crd" style={{padding:0,overflow:"hidden",borderColor:r.status==="resolved"?"rgba(34,197,94,.2)":"var(--bdr)"}}>
                <button onClick={function(){if(open){setFbDetailId(null);setFbResNote("");}else{setFbDetailId(r.id);setFbResNote(r.resolution_note||"");}}} style={{display:"flex",alignItems:"center",gap:10,padding:"12px 14px",background:"none",border:"none",width:"100%",textAlign:"left",cursor:"pointer",fontFamily:"'DM Sans',sans-serif"}}>
                  <span style={{fontSize:11,fontWeight:700,color:meta.c,padding:"3px 8px",background:"rgba(0,0,0,.18)",border:"1px solid "+meta.c,borderRadius:99,whiteSpace:"nowrap",flexShrink:0}}>{meta.l}</span>
                  <div style={{flex:1,minWidth:0}}>
                    <div style={{fontSize:13,fontWeight:700,color:"var(--t1)",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{r.user_name} <span style={{color:"var(--t3)",fontWeight:400,fontSize:11}}>· {r.module_label}</span></div>
                    <div style={{fontSize:11,color:"var(--t3)",marginTop:1}}>{when} · {r.class_code}{r.status==="resolved"?" · ✓ résolu":""}</div>
                  </div>
                  <span style={{color:"var(--t3)",fontSize:14,flexShrink:0}}>{open?"▾":"▸"}</span>
                </button>
                {open&&<div style={{padding:"12px 14px 14px",borderTop:"1px solid var(--bdr)",background:"var(--bg2)"}}>
                  <div style={{fontSize:10,color:"var(--t3)",marginBottom:6,fontWeight:700,letterSpacing:1,textTransform:"uppercase"}}>Message</div>
                  <div style={{fontSize:13.5,color:"var(--t1)",lineHeight:1.6,whiteSpace:"pre-wrap",marginBottom:14}}>{r.message}</div>
                  {r.status==="resolved"?(<div>
                    <div style={{fontSize:10,color:"var(--t3)",marginBottom:6,fontWeight:700,letterSpacing:1,textTransform:"uppercase"}}>Note de résolution</div>
                    <div style={{fontSize:13,color:"var(--t2)",fontStyle:r.resolution_note?"normal":"italic"}}>{r.resolution_note||"(aucune note)"}</div>
                    <div style={{fontSize:11,color:"var(--t3)",marginTop:8}}>Résolu le {new Date(r.resolved_at).toLocaleString("fr-FR")}</div>
                  </div>):(<div>
                    <div style={{fontSize:10,color:"var(--t3)",marginBottom:6,fontWeight:700,letterSpacing:1,textTransform:"uppercase"}}>Note de résolution (optionnelle, envoyée à l'élève)</div>
                    <textarea value={fbResNote} onChange={function(e){setFbResNote(e.target.value.slice(0,500));}} rows={3} placeholder="Ex: Bug confirmé et corrigé en v2026-04-30. Merci pour le report !" style={{width:"100%",padding:"10px 12px",fontSize:13,background:"var(--bg)",border:"1.5px solid var(--bdr)",borderRadius:8,color:"var(--t1)",fontFamily:"'DM Sans',sans-serif",boxSizing:"border-box",outline:"none",lineHeight:1.5,resize:"vertical",marginBottom:10}}/>
                    <button className="btn1" disabled={fbResBusy} style={{width:"100%",fontSize:13,padding:"10px",fontWeight:800,opacity:fbResBusy?.6:1}} onClick={function(){resolveFeedback(r);}}>{fbResBusy?"Envoi…":"✓ Marquer résolu + push à l'élève"}</button>
                  </div>)}
                </div>}
              </div>);
            })}
          </div>);
        }()
      )}
    </div>)}

  </div>);
}
