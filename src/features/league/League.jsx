// Extrait de src/App.jsx le 2026-09-15 (refactor split-app, REFACTOR_PLAN.md). Code déplacé tel quel.
import { renderAv } from "../../components/avatar.jsx";
import { Bar } from "../../components/Bar.jsx";
import { GIcon, SeasonIcon, LeagueIcon } from "../../components/icons.jsx";
import { TITLES } from "../../data/chests.js";
import { LEAGUES } from "../../data/leagues.js";
import { getEffectiveLeague, SEASONS, getCurrentSeason, computeRankings, getLeague, getSeasonEndCountdown } from "../../lib/league.js";
import { estimateTOEICScore, battleScanToToeic } from "../../lib/toeic.js";
import { weekId } from "../../lib/util.js";
import { supabase } from "../../supabase.js";
import { useState, useEffect, useMemo } from "react";

export function League(p){var u=p.u,lg=getEffectiveLeague(u.weeklyXp,u.moduleScores);
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

// Fetch group seasons — fiche publique par RPC (`groups` n'est plus lisible en direct,
// verrou P2-D5 du 2026-09-16). null si le code est inconnu → repli SEASONS ci-dessous.
useEffect(function(){
  supabase.rpc('group_public',{p_code:leagueGroup})
    .then(function(res){
      if(res.error)console.warn("[league] group_public failed:",res.error.message);
      if(res.data)setGroupData(res.data);else setGroupData(null);
    });
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
// Grade-bonus display (Top 3 → +2 / Top 10 → +1 « sur la note finale », cumul max +4)
// RETIRÉ le 2026-06-26 (décision produit Jérémy : plus de bonification de note dans les ligues).
// On force false ici — source unique qui éteint les 5 affichages (en-têtes + badges, onglets
// Général & Progression) d'un coup. Le flag groups.grade_bonus_enabled n'est donc plus consulté ;
// la colonne reste en base, inerte. Remettre l'ancienne ligne ci-dessous pour réactiver.
var showGradeBonus=false;
var curSeason=hasSeasons?getCurrentSeason(dynSeasons):null;

// Calcule le tab Progression.
// Hiérarchie baseline (du plus précis au plus grossier) :
//   1. battle_scan diagnostique  → point de départ individuel fiable
//                                   (onboarding post-scan, cycles futurs)
//   2. premier weekly_snapshot avec TOEIC > 200 → V1, imparfait (cf. cas
//                                   Anaïs : snapshot posé après quelques
//                                   jours d'activité, gomme le vrai départ)
//                                   mais préserve les stats historiques
//                                   du cohort Idrac sans battle_scan.
//   3. 200 → fallback absolu (visiteur, profil orphelin).
// Garde conservée : si assessedQ < 50 questions hors flashcards, gain=null
// (on ne classe pas un étudiant dont le currentToeic n'est pas fiable).
function loadProgressionData(){
  if(progressionData.length>0)return;
  setProgLoading(true);
  var EXCLUDED=["csess"];
  // Fetch les snapshots pour le fallback — utile tant qu'une partie du
  // cohort a battle_scan=null (Idrac 2026). Supprimable quand tous les
  // étudiants auront un scan.
  // Securite (lot 3) : RPC bornee (3 colonnes, limite 500, Teacher exclu en SQL)
  // plutot qu'un select sur la table. Meme donnee, mais plus de dump possible.
  supabase.rpc('class_weekly_progress',{p_class_code:leagueGroup})
    .then(function(res){
      if(res.error)console.warn("[progress] class_weekly_progress failed:",res.error.message);
      else if(res.data&&res.data.ok===false)console.warn("[progress] refused:",res.data.error);
      var byStudent={};
      var rows=(res.data&&res.data.snapshots)||[];
      rows.forEach(function(snap){
        var n=snap.student_name;
        if(n==="Teacher")return;
        if(!byStudent[n])byStudent[n]=[];
        byStudent[n].push(snap);
      });
      function firstSnapshotToeic(name){
        var snaps=byStudent[name]||[];
        for(var i=0;i<snaps.length;i++){
          var t=estimateTOEICScore(snaps[i].module_scores_snapshot||{}).total;
          if(t>200)return t;
        }
        return null;
      }
      function computeRow(src,name,avatar,me,frameId,titleId){
        var currentMs=src.module_scores||src.moduleScores||{};
        var currentToeic=estimateTOEICScore(currentMs).total;
        var assessedQ=0;
        Object.keys(currentMs).forEach(function(k){
          if(EXCLUDED.indexOf(k)===-1)assessedQ+=(currentMs[k].total||0);
        });
        // Priorité 1 : Battle Scan (trust it if present, même s'il donne 200
        // pour un scan total=0 légitime — c'est un vrai signal de beginner).
        var bs=src.battle_scan||src.battleScan;
        var baseline;
        if(bs){
          baseline=battleScanToToeic(bs);
        } else {
          // Priorité 2 : premier snapshot > 200 (fallback V1, cohort Idrac)
          var snapToeic=firstSnapshotToeic(name);
          baseline=snapToeic!==null?snapToeic:200;
        }
        var gain=(assessedQ>=50&&currentToeic!==null)?(currentToeic-baseline):null;
        return{name:name,avatar:avatar||"⚔️",frameId:frameId||null,titleId:titleId||null,currentToeic:currentToeic,baseline:baseline,gain:gain,assessedQ:assessedQ,me:!!me};
      }
      var rows=[];
      rivals.forEach(function(r){
        if(r.name==="Teacher")return;
        rows.push(computeRow(r,r.name,r.avatar,r.name===u.name,r.frame_id,r.title_id));
      });
      // Filet de sécurité : le user courant peut être absent de rivals
      // (teacher-internal, class_code désaligné, etc.)
      if(u.name!=="Teacher"&&!rows.find(function(r){return r.me;})){
        rows.push(computeRow(u,u.name,u.avatar,true,u.equippedFrame,u.equippedTitle));
      }
      rows.sort(function(a,b){
        if(a.gain!==null&&b.gain!==null)return b.gain-a.gain;
        if(a.gain!==null)return -1;
        if(b.gain!==null)return 1;
        return (b.currentToeic||0)-(a.currentToeic||0);
      });
      setProgressionData(rows);
      setProgLoading(false);
    });
}

// B3 : classement = lignes des camarades → vue restreinte `students_public`.
// Elle n'expose que les colonnes du classement et exclut déjà Teacher côté serveur
// (le filtre client est conservé par ceinture-bretelles). Ne pas repasser sur
// `students` : la Phase C y posera une policy auth.uid()=user_id.
useEffect(function(){
  supabase.from('students_public').select('name,weekly_xp,week_id,avatar,weekly_history,module_scores,battle_scan,frame_id,title_id').eq('class_code',leagueGroup).order('weekly_xp',{ascending:false}).limit(150)
    .then(function(res){if(res.data){setRivals(res.data.filter(function(r){return r.name!=="Teacher";}));setProgressionData([]);}});
},[u.weeklyXp,leagueGroup]);

// Auto-refresh leaderboard every 3 min when on League tab
useEffect(function(){
  var iv=setInterval(function(){
    // IMPORTANT : garder le même SELECT que la fetch initiale (ligne ~11028)
    // Sinon chaque tick écrase `rivals` SANS module_scores ni battle_scan, ce qui
    // fait retomber tout le monde à baseline 200 / currentToeic 200 dans l'onglet
    // Progrès. Régression du 2026-04-23. frame_id/title_id ajoutés 2026-04-28.
    supabase.from('students_public').select('name,weekly_xp,week_id,avatar,weekly_history,module_scores,battle_scan,frame_id,title_id').eq('class_code',leagueGroup).limit(150)
      .then(function(res){if(res.data)setRivals(res.data.filter(function(r){return r.name!=="Teacher";}));});
  },180000);
  return function(){clearInterval(iv);};
},[leagueGroup]);

// ── WEEK VIEW data ──
var weekAll=rivals.map(function(r){var xp=r.week_id===cw?(r.weekly_xp||0):0;return{name:r.name,avatar:r.avatar||"⚔️",xp:(r.weekly_xp||0),inactive:r.week_id!==cw,me:r.name===u.name,frameId:r.frame_id||null,titleId:r.title_id||null};});
if(u.name!=="Teacher"&&!weekAll.find(function(a){return a.me;}))weekAll.push({name:u.name,avatar:u.avatar||"⚔️",xp:u.weeklyXp,me:true,frameId:u.equippedFrame||null,titleId:u.equippedTitle||null});

weekAll.sort(function(a,b){
  if(a.inactive!==b.inactive)return a.inactive?1:-1; // actifs d'abord
  return b.xp-a.xp;
});

// ── SEASON VIEW data ──
var seasonRanking=useMemo(function(){
  if(rivals.length===0||!curSeason)return[];
  // Ligue éternelle : weeks=null → computeRankings somme TOUT l'historique (cumul depuis le début)
  return computeRankings(rivals,cw,curSeason.eternal?null:curSeason.weeks);
},[rivals,cw,curSeason]);

// ── OVERALL VIEW data ──
var allSeasonWeeks=useMemo(function(){var w=[];dynSeasons.forEach(function(s){(s.weeks||[]).forEach(function(wk){w.push(wk);});});return w;},[dynSeasons]);
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
  // V2.4 — render rival's equipped frame around the avatar + title under the name.
  // Bots (LEAGUES competitors) and pre-V2 students simply lack frameId/titleId so
  // renderAv falls back to plain avatar and the title line is skipped.
  // Tile size bumped 2026-05-12 (avatar 28→34, vertical padding 12→16) for breathing
  // room and to let titles + frames have visual room on every tab.
  var titleData=pl.titleId&&TITLES[pl.titleId];
  return(<div style={{display:"flex",alignItems:"center",gap:14,padding:"16px 14px",background:isMe?"rgba(var(--cx),.08)":"var(--bg2)",border:isMe?"1.5px solid rgba(var(--cx),.25)":"1px solid var(--bdr)",borderRadius:12}}>
    <div className="out" style={{width:28,display:"flex",alignItems:"center",justifyContent:"center",fontWeight:800,fontSize:14,color:rank<=3?"var(--gold)":"var(--t3)"}}>{rank<=3?<GIcon name="medal" size={20} color={rank===1?"#ffd700":rank===2?"#c0c0c0":"#cd7f32"}/>:rank}</div>
    <div style={{width:40,display:"flex",justifyContent:"center",flexShrink:0}}>{renderAv(pl.avatar,34,pl.frameId)}</div>
    <div style={{flex:1,minWidth:0}}>
      <div className="out" style={{fontWeight:isMe?700:500,fontSize:14,color:isMe?"var(--cyan)":"var(--t1)",whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{isMe?pl.name+" (Toi)":pl.name}</div>
      {titleData&&<div className="out" style={{fontSize:9,fontWeight:800,letterSpacing:1.2,textTransform:"uppercase",color:titleData.color,marginTop:2,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{titleData.name}</div>}
      {bonus&&<div style={{fontSize:10,color:bonusColor,fontWeight:700,marginTop:2}}>{bonus}</div>}
    </div>
    <div className="out" style={{fontWeight:700,fontSize:14,color:isMe?"var(--cyan)":"var(--t2)",flexShrink:0}}>{pl.pts!==undefined?pl.pts:pl.xp} {unit}</div>
  </div>);
}

return(<div className="enter" style={{padding:"20px 16px 100px"}}>
<h1 className="out" style={{fontWeight:800,fontSize:24,marginBottom:4}}>League</h1>
{leagueGroup!==u.classCode&&<div style={{textAlign:"center",marginBottom:8}}>
  <span style={{fontSize:11,padding:"4px 12px",borderRadius:99,background:"rgba(27,112,207,.12)",border:"1px solid rgba(27,112,207,.25)",color:"var(--purple)",display:"inline-flex",alignItems:"center",gap:5}} className="out"><GIcon name="eye-target" size={12} color="var(--purple)"/>Viewing: {leagueGroup}</span>
</div>}

{/* Season banner */}
{curSeason&&<div className="crd" style={{padding:"14px 18px",marginBottom:16,background:"linear-gradient(135deg,rgba(var(--cx),.06),rgba(27,112,207,.06))",borderColor:"rgba(var(--cx),.15)"}}>
  <div style={{display:"flex",alignItems:"center",justifyContent:"space-between"}}>
    <div style={{display:"flex",alignItems:"center",gap:8}}>
      <SeasonIcon icon={curSeason.icon} size={22} color={curSeason.color}/>
      <div>
        <div className="out" style={{fontWeight:800,fontSize:15,color:curSeason.color}}>{curSeason.eternal?("Saison "+curSeason.name):("Saison "+curSeason.id+" : "+curSeason.name)}</div>
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
  {(hasSeasons?[{k:"week",l:"Semaine"},{k:"season",l:curSeason&&curSeason.eternal?"\u00c9ternelle":("Saison "+(curSeason?curSeason.id:""))},{k:"overall",l:"G\u00e9n\u00e9ral"},{k:"progress",l:"Progr\u00e8s"}]:[{k:"week",l:"Semaine"}]).map(function(t){
    var active=tab===t.k;
    return(<button key={t.k} onClick={function(){setTab(t.k);if(t.k==="progress")loadProgressionData();}} style={{flex:1,padding:"8px 0",borderRadius:8,border:"none",cursor:"pointer",fontFamily:"'DM Sans',sans-serif",fontSize:13,fontWeight:active?700:500,background:active?"var(--cyan)":"transparent",color:active?"#000":"var(--t3)",transition:"all .2s"}}>{t.l}</button>);
  })}
</div>

{/* Stats summary */}
{u.name==="Teacher"?
<div className="crd" style={{padding:"12px 16px",marginBottom:16,display:"flex",alignItems:"center",gap:10,background:"linear-gradient(135deg,rgba(245,158,11,.06),rgba(27,112,207,.06))",borderColor:"rgba(245,158,11,.15)"}}>
  <span style={{display:"flex",flexShrink:0}}><GIcon name="eye-target" size={18} color="var(--gold)"/></span>
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
    <div style={{marginBottom:6,animation:"glow 3s infinite",display:"flex",justifyContent:"center"}}><LeagueIcon lg={lg} size={40}/></div>
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
          var titleData=pl.titleId&&TITLES[pl.titleId];
          return(<div key={pl.name} style={{display:"flex",alignItems:"center",gap:14,padding:"16px 14px",background:pl.me?"rgba(var(--cx),.08)":pl.inactive?"var(--bg1)":"var(--bg2)",border:pl.me?"1.5px solid rgba(var(--cx),.25)":"1px solid var(--bdr)",borderRadius:12,opacity:pl.inactive?0.55:1}}>
            <div className="out" style={{width:28,display:"flex",alignItems:"center",justifyContent:"center",fontWeight:800,fontSize:14,color:(!pl.inactive&&i<3)?"var(--gold)":"var(--t3)"}}>{pl.inactive?"—":i<3?<GIcon name="medal" size={20} color={i===0?"#ffd700":i===1?"#c0c0c0":"#cd7f32"}/>:i+1}</div>
            <div style={{width:40,display:"flex",justifyContent:"center",flexShrink:0}}>{renderAv(pl.avatar,34,pl.frameId)}</div>
            <div style={{flex:1,minWidth:0}}>
              <div className="out" style={{fontWeight:pl.me?700:500,fontSize:14,color:pl.me?"var(--cyan)":pl.inactive?"var(--t3)":"var(--t1)",whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{pl.me?pl.name+" (Toi)":pl.name}</div>
              {titleData&&<div className="out" style={{fontSize:9,fontWeight:800,letterSpacing:1.2,textTransform:"uppercase",color:titleData.color,marginTop:2,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{titleData.name}</div>}
              {pl.inactive&&<div style={{fontSize:10,color:"var(--t3)",fontWeight:500,marginTop:2}}>{"⏸ Inactif(ve) cette semaine"}</div>}
              {!pl.inactive&&isTeacher&&<div style={{fontSize:10,color:plLg.color,fontWeight:600,marginTop:2,display:"flex",alignItems:"center",gap:3}}><LeagueIcon lg={plLg} size={11}/>{plLg.name}</div>}
            </div>
            <div className="out" style={{fontWeight:700,fontSize:14,color:pl.me?"var(--cyan)":pl.inactive?"var(--t3)":"var(--t2)",flexShrink:0}}>{pl.inactive?"—":pl.xp+" XP"}</div>
          </div>);
        })}
        {displayed.length===0&&<div className="crd" style={{padding:20,textAlign:"center"}}><p style={{fontSize:13,color:"var(--t3)"}}>Personne en ligue {lg.name} pour l'instant <GIcon name="rocket" size={13} color="var(--t3)" style={{verticalAlign:"-1px"}}/></p></div>}
      </div>
      {!isTeacher&&hidden.length>0&&<div style={{textAlign:"center",marginTop:12}}>
        <button onClick={function(){setShowAllLeagues(function(v){return !v;});}} style={{background:"none",border:"1px solid var(--bdr)",borderRadius:8,padding:"6px 14px",fontSize:11,color:"var(--t3)",cursor:"pointer",fontFamily:"inherit"}}>
          {showAllLeagues?"Ma ligue uniquement ←":<span style={{display:"inline-flex",alignItems:"center",gap:5}}><GIcon name="eye-target" size={12} color="var(--t3)"/>{"Voir les "+active.length+" participants actifs"}</span>}
        </button>
      </div>}
    </div>);
  })()}
  <p style={{textAlign:"center",fontSize:11,color:"var(--t3)",marginTop:16}}>Réinitialisé chaque lundi · Le classement détermine les points de saison</p>
</div>)}

{/* ── SEASON TAB ── */}
{tab==="season"&&curSeason&&(<div>
  <div className="crd" style={{textAlign:"center",marginBottom:16,padding:20,background:"linear-gradient(135deg,rgba(var(--cx),.04),rgba(27,112,207,.04))"}}>
    <div style={{marginBottom:6,display:"flex",justifyContent:"center"}}><SeasonIcon icon={curSeason.icon} size={42} color={curSeason.color}/></div>
    <div className="out" style={{fontWeight:800,fontSize:20,color:curSeason.color}}>Saison {curSeason.id} : {curSeason.name}</div>
    <div style={{fontSize:12,color:"var(--t2)",marginTop:4}}>{curSeason.eternal?"Ligue permanente \u00B7 \u221E":(curSeason.weeks.length+" semaines \u00B7 "+countdown)}</div>
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
    <div style={{marginBottom:6,display:"flex",justifyContent:"center"}}><GIcon name="trophy-cup" size={42} color="var(--gold)"/></div>
    <div className="out" style={{fontWeight:800,fontSize:20,color:"var(--gold)"}}>Classement Général</div>
    <div style={{fontSize:12,color:"var(--t2)",marginTop:4}}>Points de classement cumulés sur toutes les saisons</div>
    {showGradeBonus&&<div style={{fontSize:11,color:"var(--gold)",marginTop:8,fontWeight:600,display:"flex",alignItems:"center",justifyContent:"center",gap:4,flexWrap:"wrap"}}><GIcon name="trophy-cup" size={12} color="var(--gold)"/>Top 3 {"→"} +2 pts {"·"} Top 10 {"→"} +1 pt sur la note finale</div>}
    {showGradeBonus&&<div style={{fontSize:10,color:"var(--t3)",marginTop:4}}>Cumulable avec le bonus Progression (max +4 pts au total)</div>}
  </div>
  {/* Season breakdown mini-bar */}
  <div style={{display:"flex",gap:6,marginBottom:16}}>
    {dynSeasons.map(function(s){
      var isCurrent=s.id===curSeason.id;var isPast=(s.weeks&&s.weeks.length)?s.weeks[s.weeks.length-1]<cw:false;
      return(<div key={s.id} className="crd" style={{flex:1,padding:"8px 4px",textAlign:"center",borderColor:isCurrent?"rgba(var(--cx),.3)":"var(--bdr)",opacity:(!isCurrent&&!isPast)?0.4:1}}>
        <div style={{display:"flex",justifyContent:"center",marginBottom:2}}><SeasonIcon icon={s.icon} size={18} color={isCurrent?"var(--cyan)":"var(--t3)"}/></div>
        <div style={{fontSize:9,color:isCurrent?"var(--cyan)":"var(--t3)",fontWeight:isCurrent?700:400}}>S{s.id}</div>
        <div style={{fontSize:8,color:"var(--t3)"}}>{isPast?"Terminé":isCurrent?"En cours":"Bientôt"}</div>
      </div>);
    })}
  </div>
  <div style={{display:"flex",flexDirection:"column",gap:6}}>
    {overallRanking.filter(function(pl){return pl.pts>0;}).map(function(pl,i){
      var rank=i+1;
      var bonusLabel=showGradeBonus?(rank<=3?<span style={{display:"inline-flex",alignItems:"center",gap:3}}><GIcon name="trophy-cup" size={11} color="var(--gold)"/>+2pts note finale</span>:rank<=10?<span style={{display:"inline-flex",alignItems:"center",gap:3}}><GIcon name="star-formation" size={11} color="var(--cyan)"/>+1pt note finale</span>:null):null;
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
    <div style={{marginBottom:6,display:"flex",justifyContent:"center"}}><GIcon name="progression" size={42} color="var(--green)"/></div>
    <div className="out" style={{fontWeight:800,fontSize:20,color:"var(--green)"}}>Classement Progression</div>
    <div style={{fontSize:12,color:"var(--t2)",marginTop:4}}>Gain de score TOEIC estimé depuis la première semaine de données</div>
    {showGradeBonus&&<div style={{fontSize:11,color:"var(--gold)",marginTop:8,fontWeight:600,display:"flex",alignItems:"center",justifyContent:"center",gap:4,flexWrap:"wrap"}}><GIcon name="trophy-cup" size={12} color="var(--gold)"/>Top 3 → +2 pts · Top 10 → +1 pt sur la note finale</div>}
  </div>

  {progLoading&&<div style={{textAlign:"center",padding:40}}>
    <div style={{marginBottom:8,display:"flex",justifyContent:"center"}}><GIcon name="sands-of-time" size={26} color="var(--t3)"/></div>
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
            var titleData=pl.titleId&&TITLES[pl.titleId];
            return(<div key={pl.name} style={{
              display:"flex",alignItems:"center",gap:14,padding:"16px 14px",
              background:pl.me?"rgba(var(--cx),.08)":"var(--bg2)",
              border:pl.me?"1.5px solid rgba(var(--cx),.25)":isTop3?"1px solid rgba(74,190,96,.25)":"1px solid var(--bdr)",
              borderRadius:12}}>
              <div className="out" style={{width:28,textAlign:"center",fontWeight:800,fontSize:14,
                color:rank===1?"var(--gold)":rank===2?"#c0c0c0":rank===3?"#cd7f32":"var(--t3)"}}>
                {rank===1?"🥇":rank===2?"🥈":rank===3?"🥉":rank}
              </div>
              <div style={{width:40,display:"flex",justifyContent:"center",flexShrink:0}}>{renderAv(pl.avatar,34,pl.frameId)}</div>
              <div style={{flex:1,minWidth:0}}>
                <div className="out" style={{fontWeight:pl.me?700:500,fontSize:14,
                  color:pl.me?"var(--cyan)":"var(--t1)",whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>
                  {pl.me?pl.name+" (Toi)":pl.name}
                </div>
                {titleData&&<div className="out" style={{fontSize:9,fontWeight:800,letterSpacing:1.2,textTransform:"uppercase",color:titleData.color,marginTop:2,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{titleData.name}</div>}
                <div style={{fontSize:10,color:"var(--t3)",marginTop:2}}>
                  {pl.baseline} → {pl.currentToeic!==null?pl.currentToeic:"\u2014"} pts TOEIC
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
            // Avec la nouvelle baseline (Battle Scan), le seul cas pending est assessedQ<50.
            var reason="Modules évalués : "+pl.assessedQ+" / 50 questions minimum";
            var titleData=pl.titleId&&TITLES[pl.titleId];
            return(<div key={pl.name} style={{
              display:"flex",alignItems:"center",gap:14,padding:"16px 14px",
              background:"var(--bg2)",border:"1px solid var(--bdr)",
              borderRadius:12,opacity:0.5}}>
              <div style={{width:28,textAlign:"center",fontSize:14,color:"var(--t3)"}}>—</div>
              <div style={{width:40,display:"flex",justifyContent:"center",flexShrink:0}}>{renderAv(pl.avatar,34,pl.frameId)}</div>
              <div style={{flex:1,minWidth:0}}>
                <div className="out" style={{fontWeight:pl.me?700:500,fontSize:14,
                  color:pl.me?"var(--cyan)":"var(--t1)",whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>
                  {pl.me?pl.name+" (Toi)":pl.name}
                </div>
                {titleData&&<div className="out" style={{fontSize:9,fontWeight:800,letterSpacing:1.2,textTransform:"uppercase",color:titleData.color,marginTop:2,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{titleData.name}</div>}
                <div style={{fontSize:10,color:"var(--t3)",marginTop:2}}>{reason}</div>
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
