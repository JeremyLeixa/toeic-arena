import { useState, useEffect, useRef, Suspense } from "react";
import { playXP, playLevelUp, playCombo, playStreak, playTimer, playClick, playJingleEnter, playJingleAchieve, playJingleLeague, playJingleMock, playJingleMockOk, playJingleDaily, playBGM, stopBGM } from "./sounds.js";
import { today, weekId, normalizeName } from "./lib/util.js";
import { fresh, supaToLocal, buildSavePayload } from "./lib/profileSchema.js";
import { haptic } from "./lib/device.js";
import { supabase } from './supabase.js'
import { getAuthUser, onAuthChange } from './auth.js';

/* ═══════════════════════════════════════════
   VERSE ARENA — MVP v2.0
   Mobile-first TOEIC training platform
   ═══════════════════════════════════════════ */


// ─── DATA IMPORTS ───
import { ACHIEVEMENTS } from "./data/achievements.js";
import { UNIQUE_TRIGGERS, LEGENDARY_ACHIEVEMENTS, EPIC_ACHIEVEMENTS, NOVICE_ACHIEVEMENTS, rollRarity, grantChest, getPendingChests, getOwnedRewards, getOwnedTokens, openChestFromPending, consumeToken, spendMarks } from "./data/chests.js";
import { GAME_ICON_VIEWBOX } from "./data/avatarIcons.js";
import { NARRATOR_MOMENTS, hasHeardMoment, markMomentHeard } from "./narrator.js";
import { estimateTOEICScore } from "./lib/toeic.js";
import { getLeague, applyWeekTransition } from "./lib/league.js";
import { _cachedUserId, _syncDirty, saveLocal, loadLocal, getAccessTokenSync, load, save, syncToCloud, setCachedUserId, setSyncDirty, onAuthLost, notifyAuthLost } from "./lib/persistence.js";
import { fresherLocalFor } from "./lib/staleRemote.js";
import { recordModule, checkMission, dailyQs, srsUp } from "./lib/progress.js";
import { boundReview, recordMisses } from "./lib/review.js";
import { dayMission, stakePart } from "./lib/planner.js";
import { gateXp, gateSteps, settleXp } from "./lib/xp.js";
import { MASTERY_BLACKLIST, isMastered } from "./lib/hubStatus.js";
import { marksLabel } from "./lib/sessionText.js";
import { clearDashSession } from "./lib/teacherSession.js";
import { getTriggerLabel } from "./lib/chestLabels.js";
import { appliedFestivalId, setFestivalsEnabled, applyThemeColor } from "./lib/festivals.js";
import { CSS } from "./styles/appCss.js";
import { LoadingMark, LoadBoundary } from "./components/LoadingMark.jsx";












import { getLevel } from "./data/helpers.js";
import { AchToast, MarksToast, XpToast } from "./components/toasts.jsx";
import { ExamCeremonies } from "./components/Ceremonies.jsx";
import { Tabs } from "./components/Tabs.jsx";
import { Cards } from "./features/home/Cards.jsx";
import { DailyTip } from "./features/home/DailyTip.jsx";
import { GamesHub } from "./features/games/GamesHub.jsx";
import { Mentor } from "./features/mentor/Mentor.jsx";
import { Home } from "./features/home/Home.jsx";
import { Train } from "./features/home/Train.jsx";
import { ChestEarnedToast, ChestOpenModal } from "./features/chests/Chests.jsx";
import { CHEST_TIER } from "./features/chests/chestTheme.js";
import { Profile } from "./features/profile/Profile.jsx";
import { ResetPasswordView } from "./features/profile/ResetPasswordView.jsx";
import { NarratorOverlay } from "./features/narrator/NarratorOverlay.jsx";
import { League } from "./features/league/League.jsx";
import { renderRoute } from "./routes.jsx";
import { lazyNamed, preloadLazyScreens } from "./components/lazyNamed.js";

// ── Écrans chargés à la demande (Phase 5, code-splitting) ──
// Alias `…Lazy` obligatoires ici : le recensement (tests/check_symbol_census.cjs) compte les
// déclarations top-level d'App.jsx, et TeacherDash / Onboard existent déjà comme exports de
// leurs modules. Chemin, nom exporté et absence d'import statique résiduel sont vérifiés par
// tests/check_import_graph.cjs. Fallbacks : LoadingMark via pg() et le shell Onboard.
var TeacherDashLazy=lazyNamed(function(){return import("./features/teacher/TeacherDash.jsx");},"TeacherDash");
var OnboardLazy=lazyNamed(function(){return import("./features/onboarding/Onboard.jsx");},"Onboard");





var BUILD_ID="2026-09-18-mentor-memory-lot4";

console.warn("[VERSE ARENA] Build:",BUILD_ID);

// ═══════════════════════════════════════════
// MAIN APP
// ═══════════════════════════════════════════
export default function App(){
  // Reset password : si l'URL contient ?reset=<token>, on bypass tout le flow
  // normal et on affiche directement l'écran de saisie nouveau mot de passe.
  // Lu UNE FOIS au mount via useState initializer (pas de re-render boucle).
  var[resetToken]=useState(function(){
    try{
      var p=new URLSearchParams(window.location.search);
      var t=p.get("reset");
      return t&&t.length>=32?t:null;
    }catch(e){return null;}
  });
  var[u,sU]=useState(null);var[ld,sL]=useState(true);var[tab,sT]=useState("home");var[sp,sSP]=useState(null);var[spA,sSPA]=useState(null);var[xpt,sXpt]=useState(null);var[teacherMode,setTeacher]=useState(false);var[achToast,setAchToast]=useState(null);var[marksToast,setMarksToast]=useState(null);
  var[pendingChestCount,setPendingChestCount]=useState(0);var[chestModal,setChestModal]=useState(null);var[chestResult,setChestResult]=useState(null);var[chestPending,setChestPending]=useState([]);
  var[chestToastQueue,setChestToastQueue]=useState([]);var[activeChestToast,setActiveChestToast]=useState(null);var chestToastIdRef=useRef(0);
  // ─── Session de fin (écran « Verdict d'Aldric », 2026-09-17, components/SessionResult.jsx) ───
  // lastSession : ce qui vient d'être réellement versé (étapes XP, niveau, ligue, coffres, trophées,
  // Darics), construit par settleSession. openSessionRef : id de la session affichée (0 = aucune),
  // lu par les octrois ASYNCHRONES (coffres, Darics) et par sv() (trophées) pour les verser dans
  // l'écran au lieu des toasts. Une ref et jamais un effet sur l'objet : `u` et lastSession sont
  // reclonés à chaque sauvegarde (boucles vécues, voir feedback_useeffect_dep_by_ref).
  // runKey : « Play again » remonte la route (clé du LoadBoundary de pg()).
  var[lastSession,setLastSession]=useState(null);var[runKey,setRunKey]=useState(0);
  var sessionSeqRef=useRef(0);var openSessionRef=useRef(0);var openSessionSpRef=useRef(null);
  // Examens (Mock, Boss, Endless) : ils gardent leur écran de résultats ; niveau et ligue gagnés
  // passent en cérémonie plein écran par-dessus ({id, items}, id = clé de remontage).
  var[examCeremony,setExamCeremony]=useState(null);var ceremonySeqRef=useRef(0);
  var[showTip,setShowTip]=useState(false);
  // ─── Festival themes (2026-09-16) ─── id de la fête appliquée à .app, ou null (lib/festivals.js :
  // fenêtre de dates, forçage ?fest=, opt-out). Primitive : relue toutes les heures par un tick.
  var[festId,setFestId]=useState(function(){return appliedFestivalId(new Date());});
  // ─── Session perdue (F1/F2, 2026-09-16) ─── {name, classCode} de la ligne que Supabase refuse à
  // la session courante (signalé par load()/save() via onAuthLost), ou null.
  var[authLost,setAuthLost]=useState(null);
  // ─── Narrator queue (Aldric narrative moments) ───
  var[narratorQueue,setNarratorQueue]=useState([]);
  var currentNarratorMoment=narratorQueue.length>0?NARRATOR_MOMENTS[narratorQueue[0]]:null;
  // Idempotent push: no-op if unknown id, already-heard, or already queued
  function pushNarratorMoment(uu,momentId){
    if(!NARRATOR_MOMENTS[momentId])return;
    if(hasHeardMoment(uu,momentId))return;
    setNarratorQueue(function(q){if(q.indexOf(momentId)!==-1)return q;return q.concat([momentId]);});
  }
  function dismissNarratorMoment(){
    setNarratorQueue(function(q){
      if(q.length===0)return q;
      var momentId=q[0];
      // Mutate+save the user profile so Supabase persists the "heard" record.
      // Use functional setter on u via sU to stay consistent with other mutations.
      if(u){
        var u2=JSON.parse(JSON.stringify(u));
        markMomentHeard(u2,momentId);
        sU(u2);save(u2);
      }
      return q.slice(1);
    });
  }
  // Arena Shop P4 — Aldric's chronicle plays once on the first Shop visit.
  // pushNarratorMoment is idempotent (hasHeardMoment guard) → fires only the first time.
  useEffect(function(){
    if(sp==="shop"&&u&&u.classCode!=="visitor")pushNarratorMoment(u,"shop_intro");
  },[sp]);
  // ─── NARRATOR BGM DUCKING ───
  // When a chronicle becomes active : fade out the current BGM (stopBGM has
  // a 600ms built-in fade). When it dismisses : restore bgm_home if we're on
  // a tab that plays it. Combined with the 2s autoplay delay inside
  // NarratorOverlay, this gives "click → fade out → silence → voice" flow.
  useEffect(function(){
    // Guard ajouté 2026-06-26 : cet effet n'avait pas le check !u (contrairement aux
    // deux autres effets BGM). Pendant l'onboarding (u null, tab="home" par défaut, sp
    // null), le else-if déclenchait playBGM("bgm_home") → le BGM fuyait sur l'onboarding
    // dès le 1er clic (l'autoplay débloqué). On ne touche au BGM qu'une fois connecté.
    if(ld||!u)return;
    if(currentNarratorMoment){
      try{stopBGM();}catch(e){console.warn("[narrator-bgm] stop:",e&&e.message);}
    }else if(!sp&&(tab==="home"||tab==="mentor"||tab==="league"||tab==="profile")){
      try{playBGM("bgm_home");}catch(e){console.warn("[narrator-bgm] resume:",e&&e.message);}
    }
  },[currentNarratorMoment,tab,sp]);

  // ─── NARRATOR STATE OBSERVERS ───
  // Single effect watching state-derived triggers. pushNarratorMoment is
  // idempotent (checks hasHeardMoment), so re-firing on every state change
  // is safe — first time the condition is met is the only time the push lands.
  // Do NOT add event-only triggers (verdict, first_chest, legacy) here —
  // those are invoked imperatively at the event site.
  useEffect(function(){
    if(!u)return;
    // rising_rank — first time out of Bronze (weeklyXp >= 200)
    if(getLeague(u.weeklyXp||0).id!=="bronze")pushNarratorMoment(u,"rising_rank");
    // oath_of_fire — streak reaches 7
    if((u.streak||0)>=7)pushNarratorMoment(u,"oath_of_fire");
    // first_combat — any of the 3 regular mock tests completed
    var mr=u.mockResults||{};
    if(mr.mock1||mr.mock2||mr.mock3)pushNarratorMoment(u,"first_combat");
    // dawn_rank — reach level 10
    if(getLevel(u.xp||0).level>=10)pushNarratorMoment(u,"dawn_rank");
    // dragon — Boss Test (Final Arena) completed
    if(mr.boss)pushNarratorMoment(u,"dragon");
  },[u&&u.weeklyXp,u&&u.streak,u&&u.xp,u&&u.mockResults&&u.mockResults.mock1,u&&u.mockResults&&u.mockResults.mock2,u&&u.mockResults&&u.mockResults.mock3,u&&u.mockResults&&u.mockResults.boss]);
  useEffect(function(){
    if(!xpt||sp)return;
    var t=setTimeout(function(){sXpt(null);},4000);
    return function(){clearTimeout(t);};
  },[xpt,sp]);
  // Garde-fou des sessions de fin : une session n'appartient qu'à sa route. Quitter la route par un
  // autre chemin que « Continue » (tab bar, bandeau de session perdue…) la ferme ; un coffre ou des
  // Darics confirmés ensuite repartent en toast. Dépendance primitive (sp) uniquement.
  useEffect(function(){
    if(openSessionRef.current&&openSessionSpRef.current!==sp){openSessionRef.current=0;openSessionSpRef.current=null;setLastSession(null);}
    setExamCeremony(null); // une cérémonie d'examen n'appartient qu'à l'écran de résultats qui l'a déclenchée
  },[sp]);
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
            // V2 — track if streak would reset, so we can offer the Streak Shield post-load
            var streakAboutToBreak=(d.lastActive!==td&&d.lastActive!==ys&&(d.streak||0)>0);
            var dayBeforeYd=new Date();dayBeforeYd.setDate(dayBeforeYd.getDate()-2);
            var dbStr=dayBeforeYd.toISOString().split("T")[0];
            // Shield only protects a 1-day gap (lastActive===day-before-yesterday) ; longer gaps reset.
            var shieldEligible=streakAboutToBreak&&d.lastActive===dbStr;
            if(streakAboutToBreak&&!shieldEligible){d.streak=0;}
            // If shield-eligible, defer reset — the post-load effect will try to consume a Streak Shield.
            // Stash a flag so the effect knows what to do.
            if(shieldEligible){d._shieldPending=true;}
            // Week transition (load-time). Same logic as mid-session — delegates to
            // applyWeekTransition which also pushes the weekly_snapshots row.
            if(applyWeekTransition(d)){
              setSyncDirty(true);
              saveLocal(d); // ensure localStorage reflects the transition so keepalive onUnload doesn't push stale data
            }
            if(!d.moduleScores)d.moduleScores={};
            if(!d.mission)d.mission={date:null,actId:null,done:false,streak:0,lastDoneDate:null};
            // V2 chest redesign — reset mission streak if user missed a day
            // (lastDoneDate strictly before yesterday means the chain is broken).
            if(d.mission.lastDoneDate&&d.mission.lastDoneDate<ys)d.mission.streak=0;
            if(!d.dailyModSessions)d.dailyModSessions={};
			if(!d.unlockedAch)d.unlockedAch=[];
			if(!d.avatar)d.avatar="⚔️";
			if(!d.theme)d.theme="dark";
            // ─── NARRATOR BOOTSTRAP (one-time, existing students only) ───
            // Pre-narrator students shouldn't get 5 popups queued on first load.
            // If they already satisfy trigger conditions, silently mark those
            // moments as heard so they're accessible via Chronicles without
            // playing live. Conditions: narrator.heard empty + xp>0 (i.e. the
            // profile pre-existed this feature). Brand-new users after this
            // deploy have xp=0 at first load → bootstrap skipped → normal flow.
            //
            // For event-driven moments without a state proxy (verdict, first_chest,
            // legacy) we use best-effort heuristics:
            //   verdict      → any existing user has already onboarded
            //   first_chest  → proxy: stats.sessions>0 (played at least one session,
            //                  very likely opened their first novice chest from
            //                  achievements like first_blood)
            //   legacy       → proxy: any mock done OR any LEGENDARY_ACHIEVEMENT
            //                  unlocked, since both grant champion/legendaire chests
            if(!d.narrator)d.narrator={heard:[],muted:false};
            if(!d.narrator.heard)d.narrator.heard=[];
            if(d.narrator.heard.length===0&&(d.xp||0)>0){
              var bMr=d.mockResults||{};
              var bAch=d.unlockedAch||[];
              var hasLegendaryAch=LEGENDARY_ACHIEVEMENTS.some(function(id){return bAch.indexOf(id)!==-1;});
              markMomentHeard(d,"verdict");
              if((d.stats&&d.stats.sessions||0)>0)markMomentHeard(d,"first_chest");
              if(getLeague(d.weeklyXp||0).id!=="bronze")markMomentHeard(d,"rising_rank");
              if((d.streak||0)>=7)markMomentHeard(d,"oath_of_fire");
              if(bMr.mock1||bMr.mock2||bMr.mock3)markMomentHeard(d,"first_combat");
              if(getLevel(d.xp||0).level>=10)markMomentHeard(d,"dawn_rank");
              if(bMr.mock1||bMr.mock2||bMr.mock3||hasLegendaryAch)markMomentHeard(d,"legacy");
              if(bMr.boss)markMomentHeard(d,"dragon");
              if(d.narrator.heard.length>0){saveLocal(d);save(d);}
            }
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
        // Pas de session au démarrage : l'onboarding prend la main, et c'est LUI qui fait entrer
        // (recover / recoverByEmail / onboard). Sans ce `loaded=true`, la session anonyme que
        // lookupName ouvre pour sa recherche arrivait ici comme « première session » et lançait
        // load() en plein onboarding, sur le profil local qui traînait : avant F1 l'app entrait
        // d'un coup sur ce profil, depuis F1 elle sautait vers « Bon retour, <ce profil> ». Sur
        // un appareil partagé, l'élève B tapant son prénom était détourné vers le compte de A
        // (constaté le 2026-09-16 en vérifiant F3). Un rafraîchissement de jeton qui rétablirait
        // la session arrive en TOKEN_REFRESHED, ignoré plus haut : aucun chargement perdu.
        loaded=true;
        sL(false);
      }
    });
// Fallback: if no auth event fires within 3s, stop loading
    var fallback=setTimeout(function(){sL(false);},3000);
    return function(){sub.data.subscription.unsubscribe();clearTimeout(fallback);};
  },[]);

  // ═══ V2 chest redesign — 5 recurring sources (step 2) ═══
  // Fires on first u-load + weekId change + when streak crosses a threshold.
  // Uses unique trigger IDs that include date/weekId/module → la deduplication
  // dans grant_pending_chest est le garde-fou anti-double-attribution, aucune
  // colonne Supabase supplementaire n'est necessaire.
  // Visitor accounts are skipped (no progression context, no class peers).
  var v2ChestRef=useRef({lastDate:null,lastWeekChecked:null});
  useEffect(function(){
    if(!u||!u.name)return;
    if(u.classCode==="visitor")return;
    var td=today(),wkId=weekId();
    var ref=v2ChestRef.current;
    // 3-day streak Login (palier tous les 3 jours, reset si streak break).
    // Trigger ID inclut today() → si l'user atteint à nouveau un palier multiple de 3
    // après un break, c'est un nouveau row chest_log (date différente, donc unique).
    // Le palier classique streak_7 / streak_30 / streak_100 reste séparé.
    if(ref.lastDate!==td){
      ref.lastDate=td;
      var s=u.streak||0;
      // Arena Shop P1 — 5 Darics per day, streak >= 1. Server-idempotent per
      // calendar day via source_detail="login_"+td. Reload on the same day
      // hits the dedup in grant_marks and is a silent no-op.
      if(s>=1)grantMarks(5,"login","login_"+td,true);
      if(s>=3&&s%3===0){
        grantChestLocal("streak_login_"+td,"novice");
      }
    }
    // Weekly TOEIC Progression + League Podium (1×/week, both check previous week)
    if(ref.lastWeekChecked!==wkId){
      ref.lastWeekChecked=wkId;
      checkWeeklyToeicChest(u,wkId);
      checkLeaguePodiumChest(u);
    }
  },[u&&u.name,u&&u.weekId,u&&u.streak]);

  // Mission Streak 7 watcher — fires whenever mission.streak crosses a multiple of 7.
  // Trigger includes the streak count → unique per milestone (mission_streak_7,
  // mission_streak_14, ...), grant happens once per palier even if streak retreats.
  useEffect(function(){
    if(!u||!u.mission)return;
    if(u.classCode==="visitor")return;
    var s=u.mission.streak||0;
    if(s>0&&s%7===0){
      grantChestLocal("mission_streak_"+s,"guerrier");
    }
  },[u&&u.mission&&u.mission.streak]);

  // Mission du jour = 1re quête du plan (lot 4 du Mentor, 2026-09-18). Le plan est calculé puis FIGÉ une
  // fois par jour dans u.mission (lib/planner.js dayMission) : Mentor, Home, onglets, NextStepReco et
  // portes XP lisent cette copie. Remplace l'écriture PENDANT LE RENDU de l'ancien MentorDailyMission (un
  // save(u) dans le render, qui perdait au passage streak et lastDoneDate). Deps primitives : u est
  // recloné à chaque sv(). Rien pendant le chargement : une copie locale périmée écraserait la mission
  // déjà posée sur un autre appareil. missionDay relu à chaque rendu : minuit passe sans rechargement.
  var missionDay=today();
  useEffect(function(){
    if(ld||!u||!u.name)return;
    if(u.mission&&u.mission.date===missionDay&&u.mission.quests)return;
    var c=JSON.parse(JSON.stringify(u));
    c.mission=dayMission(c,new Date());
    sv(c);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  },[ld,u&&u.name,u&&u.mission&&u.mission.date,u&&u.mission&&!!u.mission.quests,missionDay]);

  // Module Mastery watcher — fires when any tracked module crosses 80% accuracy on 50+ Q.
  // Trigger per module → unique per module, granted once across the whole DB.
  //
  // CRITICAL : `u && u.moduleScores` changes its identity on every sv() (because the
  // user object is JSON-cloned). Without an in-memory dedup ref, this useEffect re-fires
  // on every chest opening / xp update. C'est ce qui, le 2026-04-27, lancait N
  // attributions en parallele qui couraient toutes contre un chest_log pas encore
  // ecrit -> pending_chests en double et +37k XP fantomes.
  // Depuis le lot 4 du verrou satellites, la course est fermee cote SQL :
  // grant_pending_chest verifie et insere dans la MEME transaction. Ce ref reste
  // utile pour ne pas emettre N appels reseau inutiles par session ; ce n'est
  // plus lui qui garantit l'unicite.
  //
  // Modules excluded from Mastery : mock1/2/3/boss already have dedicated Champion triggers
  // (mock_1, etc.), and "daily" / "csess" are not real practice modules.
  var masteryRef=useRef({});
  // Seuils (50 Q, 80 %) et liste noire : lib/hubStatus.js, lus aussi par les tuiles des hubs.
  useEffect(function(){
    if(!u||!u.moduleScores)return;
    if(u.classCode==="visitor")return;
    Object.keys(u.moduleScores).forEach(function(modId){
      if(MASTERY_BLACKLIST[modId])return;
      if(masteryRef.current[modId])return; // session dedup — anti boucle
      var m=u.moduleScores[modId];
      if(!m||!m.total)return;
      if(isMastered(m)){
        masteryRef.current[modId]=true;
        grantChestLocal("mastery_"+modId,"champion");
        // Arena Shop P1 — 50 Darics, one-shot per module ever.
        grantMarks(50,"mastery","mastery_marks_"+modId,true);
      }
    });
  },[u&&u.moduleScores]);

  // V2 helper — Weekly TOEIC Progression (+25 pts vs last weekly_snapshot)
  async function checkWeeklyToeicChest(uu,wkId){
    try{
      var res=await supabase.rpc("my_weekly_snapshots",{
        p_name:uu.name,p_class_code:uu.classCode||"visitor",
        p_limit:1,p_exclude_week_id:wkId
      });
      if(res.error){console.warn("[CHEST V2] weekly TOEIC snaps error:",res.error.message);return;}
      if(res.data&&res.data.ok===false){console.warn("[CHEST V2] weekly TOEIC snaps refused:",res.data.error);return;}
      var prevRows=(res.data&&res.data.snapshots)||[];
      if(prevRows.length===0)return; // no baseline yet
      var prevMs=prevRows[0].module_scores_snapshot||{};
      var prevToeic=estimateTOEICScore(prevMs).total;
      var currentToeic=estimateTOEICScore(uu.moduleScores||{}).total;
      if(currentToeic!==null&&prevToeic!==null&&currentToeic-prevToeic>=25){
        grantChestLocal("weekly_toeic_"+wkId,"guerrier");
        // Arena Shop P1 — 50 Darics on +25 TOEIC week-over-week, 1×/week.
        grantMarks(50,"toeic_weekly","weekly_toeic_marks_"+wkId,true);
      }
    }catch(e){console.warn("[CHEST V2] weekly TOEIC check error:",e&&e.message);}
  }

  // V2 helper — League Podium (top 3 of class_code on the just-finished week)
  async function checkLeaguePodiumChest(uu){
    try{
      // Use the most recent entry in weeklyHistory as the "last finished week".
      // This is reliable: applyWeekTransition pushes to it before resetting weeklyXp.
      var prevWk=uu.weeklyHistory&&uu.weeklyHistory.length>0
        ?uu.weeklyHistory[uu.weeklyHistory.length-1].week:null;
      if(!prevWk)return;
      var res=await supabase.rpc("class_week_podium",{
        p_class_code:uu.classCode||"visitor",p_week_id:prevWk
      });
      if(res.error){console.warn("[CHEST V2] podium rpc error:",res.error.message);return;}
      if(res.data&&res.data.ok===false){console.warn("[CHEST V2] podium refused:",res.data.error);return;}
      var podRows=(res.data&&res.data.podium)||[];
      if(podRows.length===0)return;
      // Arena Shop P1 — find exact rank (0/1/2) to graduate Daric reward 150/100/60.
      // The existing chest grant stays unchanged (any top-3 position triggers it).
      var rank=-1;
      podRows.forEach(function(s,i){
        if(s.student_name&&s.student_name.toLowerCase()===uu.name.toLowerCase())rank=i;
      });
      if(rank>=0){
        grantChestLocal("podium_"+prevWk,"guerrier");
        var podMarks=rank===0?150:rank===1?100:60;
        grantMarks(podMarks,"podium","podium_marks_"+prevWk,true);
      }
    }catch(e){console.warn("[CHEST V2] podium check error:",e&&e.message);}
  }

  // V2 — Streak Shield passive consume.
  // Triggered when the load hook flagged d._shieldPending (1-day gap, streak>0).
  // Tries to consume 1 Streak Shield ; if successful, restores lastActive to yesterday
  // and shows a toast. If not (no shield), resets the streak as the V1 logic did.
  var shieldRanRef=useRef(false);
  useEffect(function(){
    if(!u||!u._shieldPending)return;
    if(shieldRanRef.current)return;
    shieldRanRef.current=true;
    var un=u.name, cc=u.classCode||"visitor";
    consumeToken(un,cc,"streak_shield",1).then(function(res){
      var c=JSON.parse(JSON.stringify(u));delete c._shieldPending;
      if(res.ok){
        // Shield consumed — pretend the user was active yesterday so the streak survives
        var ydDate=new Date();ydDate.setDate(ydDate.getDate()-1);
        c.lastActive=ydDate.toISOString().split("T")[0];
        sv(c);
        haptic("streak");
        sXpt({total:0,base:0,bonuses:[{label:"🛡️ Streak Shield consumed — streak preserved",val:0}]});
      }else{
        // No shield — apply the deferred reset
        c.streak=0;
        sv(c);
      }
    });
  },[u&&u._shieldPending]);

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

  // ── Landing CTA deep link → in-app upgrade flow ──
  // Le landing Hostinger envoie les CTAs "Acheter le Pass" / "S'abonner" vers
  // ?upgrade=pass3m ou ?upgrade=monthly. On stocke l'intention en sessionStorage
  // (survit a l'onboarding) puis on route vers UpgradeScreen des que u est pret.
  // Pourquoi pas Stripe Payment Link direct : webhook ne recoit pas de
  // supabase_user_id donc l'access_level ne se propage pas. Le deep link
  // reutilise le flow checkout in-app valide 2026-05-13 (natural-key match).
  useEffect(function(){
    try{
      var params=new URLSearchParams(window.location.search);
      var upgrade=params.get("upgrade");
      if(upgrade==="monthly"||upgrade==="pass3m"){
        sessionStorage.setItem("toeic-arena-pending-upgrade",upgrade);
        var url=new URL(window.location.href);
        url.searchParams.delete("upgrade");
        window.history.replaceState({},"",url.toString());
      }
    }catch(e){console.warn("[upgrade-deeplink] caught:",e&&e.message);}
  },[]);

  // Watch u being ready + pending upgrade intent -> navigate to UpgradeScreen.
  // Si user deja premium, on route vers Profile (pas re-paiement). Fire 1x via
  // sessionStorage clear avant navigation. Note : on n'auto-selectionne pas le
  // plan dans UpgradeScreen V1 (les 2 cards sont visibles, l'user re-clique).
  useEffect(function(){
    if(!u)return;
    try{
      var pending=sessionStorage.getItem("toeic-arena-pending-upgrade");
      if(!pending)return;
      sessionStorage.removeItem("toeic-arena-pending-upgrade");
      var alreadyPremium=u.accessLevel==="premium_monthly"||(u.accessLevel==="premium_pass"&&u.accessExpiresAt&&new Date(u.accessExpiresAt)>new Date());
      if(alreadyPremium){
        sT("profile");
        return;
      }
      sT("profile");
      sSP("upgrade");
    }catch(e){console.warn("[upgrade-deeplink] u-watch caught:",e&&e.message);}
  },[u]);

  // Verdict chronicle deferred trigger : fire à la 1ère arrivée sur Home si
  // pas encore entendu. Couvre les users arrivés via deep link landing
  // (?upgrade=...) où le push direct dans finish() est skip pour ne pas
  // recouvrir l'UpgradeScreen avec l'overlay narrator.
  useEffect(function(){
    if(!u||tab!=="home"||sp)return;
    try{
      if(hasHeardMoment(u,"verdict"))return;
      pushNarratorMoment(u,"verdict");
    }catch(e){console.warn("[verdict-defer] caught:",e&&e.message);}
  },[u,tab,sp]);

  // ── Phase 1 Magic Link — email sync on USER_UPDATED confirmation ──
  // Syncs students.email when Supabase confirms the email (email_confirmed_at set).
  // Runs on mount AND on future auth events to handle the magic link callback timing:
  // the callback event often fires BEFORE this useEffect mounts (during initial page
  // load after the redirect), so we also proactively read the current session on mount.
  // F5 (2026-09-16) : deps PRIMITIVES — nom, promo, email, c'est tout ce que l'effet lit. Avec
  // [u], recloné à chaque sv(), il relançait getSession() et se réabonnait à l'auth à CHAQUE
  // sauvegarde (mesuré : 4 getSession + 2 abonnements par sv). Chaque appel prend le verrou d'auth
  // de supabase-js ; les « Lock … Forcefully acquiring » vus en console sont soupçonnés de
  // provoquer des rafraîchissements parallèles et des pertes de session (voir « Session perdue »,
  // CLAUDE.md). Ne pas revenir à [u].
  var emailSyncName=u?u.name:null;
  var emailSyncClass=u?(u.classCode||'visitor'):null;
  var emailSyncEmail=u?(u.email||null):null;
  useEffect(function(){
    if(!emailSyncName)return;

    function syncEmailFromSession(session){
      if(!session||!session.user)return;
      if(!session.user.email)return;
      if(!session.user.email_confirmed_at)return;
      if(emailSyncEmail===session.user.email)return; // already synced
      var newEmail=session.user.email;
      // Phase C-lite : l'email n'est plus fourni par le client. La RPC le lit dans le
      // JWT de la session, donc on ne peut coller sur son profil que l'adresse de SA
      // propre session — et plus celle qu'on veut.
      supabase.rpc('sync_my_student_email',{p_name:emailSyncName,p_class_code:emailSyncClass})
        .then(function(res){
          if(res.error){console.error('[auth] email sync failed:',res.error.message);return;}
          if(!res.data||!res.data.ok||!res.data.rows){
            // No students row matched — probably not yet written to DB (onboarding still in progress).
            // Don't claim "email linked" in local state, otherwise the Profile UI would show
            // "Compte sécurisé" while the DB has no record of it.
            console.warn('[auth] email confirmed but no students row to update yet for',emailSyncName,'— waiting for next save');
            return;
          }
          // Mise à jour FONCTIONNELLE : la réponse arrive après d'éventuels autres sv(). Recopier
          // le u capturé (l'ancien `JSON.parse(JSON.stringify(u))`) écrasait ces changements.
          sU(function(prev){if(!prev)return prev;var c=JSON.parse(JSON.stringify(prev));c.email=newEmail;return c;});
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
    return function(){try{sub.data.subscription.unsubscribe();}catch(e){console.warn("[auth] email sync unsubscribe caught:",e&&e.message);}};
  },[emailSyncName,emailSyncClass,emailSyncEmail]);

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
      // B3 : la médiane rapatriait l'XP de toute la promo toutes les 5 minutes sur
      // chaque appareil, pour n'en tirer qu'un entier. Calcul déplacé côté serveur.
      // Elle exclut désormais la ligne Teacher, que le calcul client incluait et qui
      // tirait la médiane vers le haut (son XP n'a rien à voir avec celui des élèves).
      // Seuil conservé : moins de 3 élèves → 0.
      supabase.rpc('class_median_xp',{p_class_code:u.classCode||'visitor'})
        .then(function(res){
          if(res.error){console.warn("[median] rpc failed:",res.error.message);setClassMedianXp(0);return;}
          setClassMedianXp(res.data||0);
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
    // `groups` n'est plus lisible en direct (verrou P2-D5, 2026-09-16) : fiche publique
    // bornée par RPC. null si le code est inconnu → mêmes replis qu'avant (school / ok).
    supabase.rpc('group_public',{p_code:cc})
      .then(function(res){
        if(res.error)console.warn("[groups] group_public failed:",res.error.message);
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

  // ── Préchauffage des écrans chargés à la demande (Phase 5, C10) ── une fois le profil
  // chargé, recharger à l'idle, l'un après l'autre, tous les chunks déclarés via lazyNamed :
  // parité hors-ligne d'avant le découpage (le SW met en cache chaque chunk servi), mêmes
  // octets qu'avant, mais APRÈS le premier affichage. Deps primitives (u est recloné à chaque
  // sv) ; preloadLazyScreens porte sa propre garde « une seule fois ».
  var hasUser=!!u;
  useEffect(function(){if(!ld&&hasUser)preloadLazyScreens();},[ld,hasUser]);

  // ── Session perdue (F1/F2, 2026-09-16) ── load()/save() signalent une ligne que la session ne
  // peut ni lire ni écrire. Sans profil (démarrage) → Onboard reprend au mot de passe (prop
  // reauth) ; en cours de session → bandeau. Mise à jour par fonction : même cible → même
  // référence → pas de re-rendu à chaque sauvegarde refusée (save() est appelé à chaque sv()).
  // Abonnement monté avant tout load() : les notifications arrivent après des allers-retours RPC.
  useEffect(function(){
    return onAuthLost(function(t){
      // Plus aucun profil local (« Changer de profil » vient de le vider) : c'est un refus arrivé
      // en retard (sauvegarde partie avant la déconnexion). L'ignorer, sinon l'élève suivant
      // serait renvoyé vers « Bon retour, <ancien compte> ». La petite clé toeic-arena-name est
      // présente dans tous les vrais cas : démarrage piégé (F1) comme session en cours (F2).
      try{if(!localStorage.getItem("toeic-arena-name")){console.warn("[authLost] ignored: no local profile (after logout) —",t.name);return;}}catch(e){console.warn("[authLost] storage read caught:",e&&e.message);}
      setAuthLost(function(prev){return prev&&prev.name===t.name&&prev.classCode===t.classCode?prev:t;});
    });
  },[]);
  // Un profil entre (reconnexion réussie, ou un autre compte) : la cible est périmée.
  useEffect(function(){if(hasUser)setAuthLost(null);},[hasUser]);

  // ── Festival themes : tick horaire ── une PWA reste ouverte des jours : la fête doit arriver
  // (24/10 à minuit) et repartir sans rechargement, au plus une heure après la borne. Même id
  // → React ne re-rend pas, le tick ne coûte rien.
  useEffect(function(){
    var iv=setInterval(function(){setFestId(appliedFestivalId(new Date()));},3600000);
    return function(){clearInterval(iv);};
  },[]);
  // ── Festival themes : barre d'état (meta theme-color) ── suit la fête appliquée et le mode
  // clair/sombre. Hors fête : #0f0c08 en sombre, --bg de .light en clair. Deps primitives (u est
  // recloné à chaque sv). Sans profil (onboarding), couleur canonique comme la classe .app.
  var isLight=!!(u&&u.theme==="light");
  useEffect(function(){applyThemeColor(hasUser?festId:null,isLight);},[festId,isLight,hasUser]);

  // ── Centralized BGM control: silence on ANY sub-page (exercise/content), restore home BGM on return ──
  // Defensive rule (post-feedback 2026-05-11): any sp ≠ null with no self-managed BGM = exercise → stopBGM.
  // Previously only lis/lisP1-P4/ablitz were silenced, leaving Mock Tests (Listening sections), Flashcards,
  // Phrasal Dojo, Daily, etc. relying solely on nav() calling stopBGM — a single missed path left BGM running
  // over the listening audio.
  useEffect(function(){
    if(ld||!u||!bgmStarted.current)return;
    // Routes that manage their own BGM (do not interfere):
    var SELF_MANAGED=["boss","endless","matchE","wfall","duel","sbuild","clue","tavern","gauntlet","modals","bforge","shop"];
    if(sp&&SELF_MANAGED.indexOf(sp)!==-1)return;
    if(sp){stopBGM();return;}
    // No subpage active and on a home-BGM tab → ensure bgm_home is playing
    if(tab==="home"||tab==="mentor"||tab==="league"||tab==="profile")playBGM("bgm_home");
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
        if(weekChanged){console.warn("[WEEK] transition detected mid-session —",c.weekId);setSyncDirty(true);}
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
          if(applyWeekTransition(c))setSyncDirty(true);
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
          // Phase C-lite : ce bloc construisait SA PROPRE liste de colonnes, un
          // sous-ensemble de 21 clés contre 36 dans save(). Conséquence silencieuse :
          // fermer l'onglet sans save prealable perdait le cadre, le titre et les boosts
          // equipes. On envoie desormais le meme payload que save(), et la RPC fusionne
          // (seules les cles presentes sont ecrites), donc il n'y a plus deux listes a
          // garder synchronisees.
          var payload=buildSavePayload(d);
          // POST keepalive sur la RPC (=UPDATE cote serveur) — survit a la fermeture
          // d'onglet. B2 : Bearer = JWT user (getAccessTokenSync), fallback cle anon ;
          // apikey reste la cle anon, requise par Supabase. Le JWT donne auth.uid(), dont
          // la RPC a besoin pour la garde de propriete.
          // NB : beforeunload ne se declenche pas de facon fiable sur iOS Safari — ce
          // chemin est un best-effort, la sauvegarde reelle vient de sv() et du sync 60s.
          try{var _anonKey=import.meta.env.VITE_SUPABASE_ANON_KEY;var _bearer=getAccessTokenSync()||_anonKey;fetch(import.meta.env.VITE_SUPABASE_URL+"/rest/v1/rpc/save_student",{
            method:"POST",keepalive:true,
            headers:{
              "Content-Type":"application/json",
              "apikey":_anonKey,
              "Authorization":"Bearer "+_bearer
            },
            body:JSON.stringify({p_name:d.name,p_class_code:cc,p_payload:payload,p_allow_insert:false,p_bind_auth:false})
          });}catch(e){console.warn("[UNLOAD] keepalive failed:",e&&e.message);}
        }
      // Loggé (règle n°1) : JSON.parse, applyWeekTransition ou buildSavePayload qui lève ici
      // perdait la sauvegarde de dernière chance sans trace (seul le fetch ci-dessus loggait).
      }catch(e){console.warn("[UNLOAD] caught:",e&&e.message);}
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
  // Arena Shop P1 (2026-05-29) — Daric currency grant wrapper.
  // Server-authoritative via grant_marks RPC. Returns the delta actually applied
  // (0 on idempotent no-op when p_unique=true and source_detail already exists).
  // - unique=true for one-shot sources (mastery, achievement, weekly_toeic,
  //   podium, focus, daily, login). source_detail must include the time window
  //   (today() / weekId() / modId / a.id) so dedup is anchored to the right scope.
  // - silent=true skips the toast (used by chest drops where the reveal modal
  //   already shows the Daric card — avoids double-feedback).
  // The functional sU update protects against stale-closure when grantMarks
  // fires inside async callbacks that resolve after subsequent sv() calls.
  function grantMarks(delta,source,sourceDetail,unique,silent){
    if(!u||!u.name)return;
    if(u.classCode==="visitor")return; // visitors are shop-blocked, no marks accrual
    if(!delta||delta<=0)return;
    var un=u.name,cc=u.classCode||"visitor";
    // Session de fin ouverte au moment de l'octroi : les Darics s'affichent dans le parchemin
    // (réponse encore attendue sur CETTE session) au lieu du toast.
    var sid=openSessionRef.current;
    supabase.rpc("grant_marks",{
      p_user_name:un,p_class_code:cc,p_delta:delta,
      p_source:source,p_source_detail:sourceDetail,p_unique:!!unique,
    }).then(function(res){
      if(res.error){console.warn("[MARKS] grant_marks RPC error:",res.error.message);return;}
      var applied=(typeof res.data==="number")?res.data:0;
      if(applied<=0)return; // server returned 0 → idempotent no-op, no toast
      sU(function(prev){
        if(!prev)return prev;
        var c=JSON.parse(JSON.stringify(prev));
        c.arenaMarks=(c.arenaMarks||0)+applied;
        saveLocal(c);
        return c;
      });
      if(sid&&openSessionRef.current===sid){
        var mk={amount:applied,label:marksLabel(source)};
        setLastSession(function(s){return s&&s.id===sid?Object.assign({},s,{marks:s.marks.concat([mk])}):s;});
      }else if(!silent){
        setMarksToast(applied);
        setTimeout(function(){setMarksToast(null);},3500);
      }
    }).catch(function(e){console.warn("[MARKS] grant_marks exception:",e&&e.message);});
  }

  // Arena Shop P2a (2026-06-01) — buy a catalog item. Atomic via spend_marks RPC.
  // On success, align the local wallet mirror to the server-returned balance
  // (authoritative — no optimistic guess). arena_marks stays out of save() (guarded).
  // Arena Shop P2.5 — Bourse Inépuisable : grant the milestone title once cumulative
  // Darics spent crosses 10k. Guarded insert (mirrors openChestFromPending's reward insert).
  function maybeGrantBourse(c){
    if(!c||(c.boosts&&c.boosts.spent<10000))return;
    var un=c.name,cc=c.classCode||"visitor";
    // Lot 4 : le couple SELECT-puis-INSERT etait le meme TOCTOU que les coffres
    // (deux appels rapproches pouvaient inserer le titre deux fois). grant_reward_once
    // fait les deux en une transaction et dit s'il a reellement accorde.
    supabase.rpc("grant_reward_once",{
      p_name:un,p_class_code:cc,
      p_reward_type:"title",p_reward_id:"bourse_inepuisable",p_rarity:"legend"
    }).then(function(r){
      if(r.error){console.warn("[BOURSE] grant error:",r.error.message);return;}
      if(r.data&&r.data.ok===false){console.warn("[BOURSE] grant refused:",r.data.error);return;}
      if(!(r.data&&r.data.granted))return; // already owned
      try{playJingleAchieve();}catch(e){console.warn("[BOURSE] jingle caught:",e&&e.message);}
      haptic("achieve");
      setAchToast({name:"Bottomless Purse",icon:"💰",desc:"10,000 Darics spent — title unlocked"});
      setTimeout(function(){setAchToast(null);},3500);
    }).catch(function(e){console.warn("[BOURSE] exception:",e&&e.message);});
  }
  function shopBuy(item){
    if(!u||u.classCode==="visitor")return Promise.resolve({ok:false,error:"visitor"});
    // Daily Doubler — weekly purchase cap (2/week), enforced client-side
    if(item.ref==="daily_doubler"){
      var b0=u.boosts||{};var wk0=weekId();
      var cnt0=(b0.ddWeekId===wk0)?(b0.ddWeekCount||0):0;
      if(cnt0>=2)return Promise.resolve({ok:false,error:"weekly_cap"});
    }
    return spendMarks(u.name,u.classCode||"visitor",item).then(function(res){
      if(res&&res.ok){
        var c=JSON.parse(JSON.stringify(u));
        c.arenaMarks=res.balance; // local mirror (server-authoritative source = res.balance)
        if(!c.boosts)c.boosts={};
        c.boosts.spent=(c.boosts.spent||0)+(item.price||0); // Bourse Inépuisable tracker
        if(item.ref==="daily_doubler"){
          var wk1=weekId();
          if(c.boosts.ddWeekId!==wk1){c.boosts.ddWeekId=wk1;c.boosts.ddWeekCount=0;}
          c.boosts.ddWeekCount=(c.boosts.ddWeekCount||0)+1;
        }
        sv(c); // persists boosts (arena_marks excluded from save payload by design)
        haptic("chest");
        maybeGrantBourse(c);
      }
      return res;
    });
  }

  // Lot 4 du verrou satellites : le "est-ce deja attribue ?" et l'INSERT sont
  // maintenant une seule transaction SQL (grant_pending_chest). L'ancien couple
  // check-puis-insert cote client etait un TOCTOU — c'est lui qui a produit les
  // pending_chests en double et les +37k XP fantomes du 2026-04-27. On ne montre
  // le toast que si le serveur dit avoir reellement cree le coffre.
  function grantChestLocal(trigger,chestType){
    if(!u||!u.name)return;
    var un=u.name,cc=u.classCode||"visitor";
    var sid=openSessionRef.current;
    grantChest(un,cc,chestType,trigger,null).then(function(r){
      if(r&&r.granted){refreshPendingChests(un,cc);deliverChest(sid,trigger,chestType);}
    }).catch(function(e){console.error("[CHEST] grant error:",e&&e.message);});
  }
  // Fire-and-forget: grant a weekly chest (7-day cooldown per trigger)
  function grantWeeklyChest(trigger,chestType){
    if(!u||!u.name)return;
    var un=u.name,cc=u.classCode||"visitor";
    var sid=openSessionRef.current;
    grantChest(un,cc,chestType,trigger,7).then(function(r){
      if(r&&r.granted){refreshPendingChests(un,cc);deliverChest(sid,trigger,chestType);}
    }).catch(function(e){console.error("[CHEST] grant error:",e&&e.message);});
  }
  // Coffre CONFIRMÉ par le serveur. Si la session de fin qui l'a gagné est toujours à l'écran, il
  // s'affiche dedans (le toast n'est rendu que sur les onglets : dans un module, il restait
  // invisible) ; sinon toast, avec sa file et son anti-interruption habituelles. `sid` est capturé à
  // l'appel : une réponse arrivée après « Continue » ne peut pas atterrir dans une autre session.
  function deliverChest(sid,trigger,chestType){
    if(sid&&openSessionRef.current===sid){
      var item={trigger:trigger,type:chestType,tier:CHEST_TIER[chestType]||0,label:getTriggerLabel(trigger)};
      setLastSession(function(s){return s&&s.id===sid?Object.assign({},s,{chests:s.chests.concat([item])}):s;});
    }else enqueueChestToast(trigger,chestType);
  }
  async function refreshPendingChests(un,cc){
    var list=await getPendingChests(un,cc);
    setChestPending(list);setPendingChestCount(list.length);
  }
  async function doOpenChest(){
    if(chestPending.length===0)return;
    var chest=chestPending[0];
    // V2 — fetch all owned reward types + tokens in parallel
    var rewardsRows=await getOwnedRewards(chest.user_name,chest.class_code);
    var tokensMap=await getOwnedTokens(chest.user_name,chest.class_code);
    var owned={
      avatars:rewardsRows.filter(function(r){return r.reward_type==="avatar";}).map(function(r){return r.reward_id;}),
      skins:rewardsRows.filter(function(r){return r.reward_type==="skin";}).map(function(r){return r.reward_id;}),
      frames:rewardsRows.filter(function(r){return r.reward_type==="frame";}).map(function(r){return r.reward_id;}),
      titles:rewardsRows.filter(function(r){return r.reward_type==="title";}).map(function(r){return r.reward_id;}),
      cheatSheets:rewardsRows.filter(function(r){return r.reward_type==="cheat_sheet";}).map(function(r){return r.reward_id;}),
      tokens:tokensMap,
    };
    var pity=(u&&u.gameScores?u.gameScores.pityCount:0)||0;
    var result;
    try{result=await openChestFromPending(chest,pity,owned);}
    catch(e){console.warn("[CHEST] doOpenChest exception (nothing credited):",e&&e.message);result={ok:false,error:(e&&e.message)||"exception"};}
    // Garde anti-farm (2026-09-16) : tant que le serveur n'a pas consommé le pending
    // (ok:true), on ne crédite RIEN — ni XP, ni Darics, ni pity, ni narrateur. Avant,
    // un refus d'open_pending_chest rendait quand même le butin, créditait tout, et
    // laissait le coffre dans la file : rouvrable, donc re-créditable à volonté.
    // Le modal affiche sa phase "error" ; le coffre reste en attente. Seul
    // already_opened (ligne déjà consommée, autre appareil ou double appel) resynchronise
    // la file : getPendingChests rend [] sur erreur réseau, on ne l'appelle donc pas
    // pour les autres échecs, sinon le coffre disparaîtrait de la file sans avoir été ouvert.
    if(!result||result.ok!==true){
      setChestResult(result||{ok:false,error:"empty_result"});
      if(result&&result.error==="already_opened")refreshPendingChests(chest.user_name,chest.class_code);
      // not_owner = session qui n'est pas celle du compte (F1/F2) : réessayer ne sert à rien.
      // Sans ce signal, rien ne le disait à l'élève tant qu'aucune sauvegarde n'était refusée,
      // puisqu'un échec d'ouverture n'appelle pas sv(). Même cible que save() → même
      // référence dans setAuthLost, pas de re-rendu si le bandeau est déjà là. Le bandeau
      // passe sous le modal (z-index 9000 < 10000) et apparaît à la fermeture.
      if(result&&result.error==="not_owner")notifyAuthLost({name:u.name,classCode:u.classCode||"visitor"});
      return;
    }
    // Update pity + aggregate XP from all reward slots
    var c=JSON.parse(JSON.stringify(u));
    if(!c.gameScores)c.gameScores={};
    c.gameScores.pityCount=result.newPityCount;
    if(result.totalXp>0){c.xp+=result.totalXp;c.weeklyXp+=result.totalXp;}
    sv(c);
    // Arena Shop P1 — grant Darics via RPC after sv(). silent=true because the
    // reveal modal already shows the Daric card ; no double-feedback toast.
    // unique=false because each chest opening is a distinct grant event (the
    // chest_log + pending_chests delete pair already guarantees no double-open —
    // which only holds because we returned above when open_pending_chest failed).
    if(result.totalDarics>0){
      grantMarks(result.totalDarics,"chest",chest.trigger_source,false,true);
    }
    // Pas de haptic ici : le résultat arrive pendant la chute du coffre (onOpen part au
    // montage du modal v3), c'est chestSequence.js qui vibre au moment de l'ouverture.
    setChestResult(result);
    // Narrator triggers on chest open. Both push to the queue but DON'T render
    // immediately — the overlay is gated on !chestModal (see main return +
    // pg()), so it only appears after the student closes the chest reveal.
    // Push-order matters: first_chest must come before legacy if both fire on
    // the same chest (unlikely: first chest is rarely champion/legendaire).
    pushNarratorMoment(c,"first_chest");
    if(chest.chest_type==="champion"||chest.chest_type==="legendaire"){
      pushNarratorMoment(c,"legacy");
    }
    // Refresh pending list
    var remaining=chestPending.slice(1);
    setChestPending(remaining);setPendingChestCount(remaining.length);
  }

function sv(d){
    // Session de fin à l'écran : les trophées débloqués par cette sauvegarde s'affichent dans le
    // parchemin (jingle joué par l'écran) au lieu du toast. Coffres et Darics toujours accordés.
    // Le handler de session appelle settleSession (ref posée, setLastSession mis en file) AVANT
    // sv : l'updater ci-dessous passe donc après la création de la session.
    var sessionSid=openSessionRef.current;var honors=[];
    // Check for new achievements
    if(d&&d.unlockedAch){
      ACHIEVEMENTS.forEach(function(a){
        if(a.check(d)&&d.unlockedAch.indexOf(a.id)===-1){
          d.unlockedAch.push(a.id);
          if(sessionSid){honors.push({name:a.name,desc:a.desc});}
          else{
            try{playJingleAchieve();}catch(e){console.warn("[ACH] jingle caught:",e&&e.message);}haptic("achieve");
            setAchToast({name:a.name,icon:a.icon,desc:a.desc});
            setTimeout(function(){setAchToast(null);},3500);
          }
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
          // Arena Shop P1 — 30 Darics per newly unlocked achievement, in addition
          // to any tier-specific chest. One-shot via source_detail="ach_marks_"+a.id.
          grantMarks(30,"achievement","ach_marks_"+a.id,true);
        }
      });
    }
    if(honors.length){
      setLastSession(function(s){return s&&s.id===sessionSid?Object.assign({},s,{achievements:s.achievements.concat(honors)}):s;});
    }
    sU(d);
    saveLocal(d);
    save(d);
  }
  // ── Portes XP ── Le CALCUL vit dans lib/xp.js (pur, testé par tests/check_xp_gates.cjs :
  // seuil d'accuracy, courbes anti-farming, bypass, événements, Focus, boosts Daric, streak,
  // week-end, +10, planchers, ligue, niveau, coffres). Ici on ne fait que deux choses :
  // injecter l'état d'App() (u, activeEvents, classMedianXp, l'instant) et exécuter les
  // EFFETS que le module rend (Darics, sons, haptique, toast, coffres). Équivalence avec
  // l'ancien code prouvée par scripts/refactor/xp_equivalence.cjs (Phase 5, 2026-09-16).
  // (isModuleBoosted, qui vivait ici, est devenue isBoostedByEvents dans lib/xp.js.)
  function applyXpGates(baseXp,sc,tot,modId){
    var r=gateXp(baseXp,sc,tot,modId,{u:u,now:new Date(),events:activeEvents,focusPart:stakePart(u,new Date())});
    // Arena Shop P1 — 30 Darics pour avoir suivi la reco du Mentor, 1×/jour : le
    // source_detail "focus_<date>" est dédupliqué côté serveur (re-tir le même jour = no-op).
    if(r.focusHit)grantMarks(30,"focus","focus_"+today(),true);
    return r.xp;
  }
  // opts.ceremony (examens) : niveau et ligue en cérémonie plein écran, qui joue elle-même son jingle
  // et son haptique ; sans, les sons partent ici comme avant.
  function addXp(baseAmt,opts){if(baseAmt>0)try{playXP();}catch(e){}
    var r=settleXp(u,baseAmt,{now:new Date(),events:activeEvents,classMedianXp:classMedianXp,leagueOf:getLeague});
    // Ordre des effets = celui d'avant l'extraction : jingle de ligue, level-up, toast, puis
    // les coffres (paliers XP, streak avec haptique, passage de ligue).
    if(opts&&opts.ceremony&&(r.levelUp||r.leagueUp)){
      var items=[];
      if(r.levelUp)items.push({kind:"level",level:r.levelUp.to,toXp:r.c.xp});
      if(r.leagueUp){var lgChest=r.chests.find(function(ch){return /^league_up_/.test(ch.trigger);});
        items.push({kind:"league",fromId:r.leagueUp.from,toId:r.leagueUp.to,weekly:r.c.weeklyXp||0,chestTier:lgChest?(CHEST_TIER[lgChest.type]||0):null});}
      setExamCeremony({id:++ceremonySeqRef.current,items:items});
    }else{
      if(r.leagueUp){try{playJingleLeague();}catch(e){}haptic("league");}
      if(r.levelUp){try{playLevelUp();}catch(e){}haptic("levelUp");}
    }
    sXpt(r.toast);
    r.chests.forEach(function(ch){grantChestLocal(ch.trigger,ch.type);if(ch.haptic)haptic(ch.haptic);});
    return r.c;
  }
  // ── Sessions de fin (2026-09-17) ── remplace applyXpGates + addXp pour les modules qui rendent
  // SessionResult. Même calcul (gateSteps ≡ gateXp, testé) et mêmes octrois (Darics du Focus,
  // coffres de settleXp), mais : le détail des étapes est gardé pour l'écran, et ni toast d'XP ni
  // son ici (l'écran joue le compteur, le niveau et la ligue au bon moment). La ref est posée AVANT
  // les octrois pour qu'ils sachent vers quelle session aller. opts.spotlight : comme l'ancien miniDone et
  // les hubs (drill, daily et jeux ne l'appliquaient pas). Rend {c, sid} : le module garde le sid et
  // n'affiche QUE cette session.
  function settleSession(modId,sc,tot,baseXp,opts){
    opts=opts||{};
    var sid=++sessionSeqRef.current;
    openSessionRef.current=sid;openSessionSpRef.current=sp;
    var now=new Date();
    var g=gateSteps(baseXp,sc,tot,modId,{u:u,now:now,events:activeEvents,spotlight:!!opts.spotlight,focusPart:stakePart(u,now)});
    if(g.focusHit)grantMarks(30,"focus","focus_"+today(),true);
    var r=settleXp(u,g.xp,{now:now,events:activeEvents,classMedianXp:classMedianXp,leagueOf:getLeague});
    // opts.extra : ce que le module ajoute à la session pour que l'écran de fin le dise juste
    // (la chasse y met `slain` : sa base d'XP paie les créatures vaincues, pas les bonnes réponses).
    setLastSession(Object.assign({id:sid,sp:sp,modId:modId,sc:sc,tot:tot,userName:u.name,steps:g.steps.concat(r.steps),total:r.amt,
      fromXp:u.xp,toXp:r.c.xp,levelUp:r.levelUp,leagueUp:r.leagueUp,weekly:{from:u.weeklyXp||0,to:r.c.weeklyXp},
      streak:r.c.streak,chests:[],achievements:[],marks:[]},opts.extra||{}));
    r.chests.forEach(function(ch){grantChestLocal(ch.trigger,ch.type);if(ch.haptic)haptic(ch.haptic);});
    return{c:r.c,sid:sid,total:r.amt};
  }
  // À appeler juste avant sv(c) : checkMission crédite ses +15 XP directement dans c (hors
  // settleXp). On les ajoute comme étape et on recalcule niveau et ligue, qu'ils peuvent franchir.
  function sealSession(c,sid){
    var toXp=c.xp,weeklyTo=c.weeklyXp||0;
    setLastSession(function(s){
      if(!s||s.id!==sid)return s;
      var extra=toXp-s.toXp;
      if(extra<=0)return s;
      var L0=getLevel(s.fromXp).level,L1=getLevel(toXp).level;
      var lg0=getLeague(s.weekly.from),lg1=getLeague(weeklyTo);
      return Object.assign({},s,{
        steps:s.steps.concat([{id:"mission",kind:"bonus",add:extra,value:s.total+extra}]),
        total:s.total+extra,toXp:toXp,weekly:{from:s.weekly.from,to:weeklyTo},
        levelUp:L1>L0?{from:L0,to:L1}:null,
        leagueUp:(lg1.id!==lg0.id&&weeklyTo>lg0.min)?{from:lg0.id,to:lg1.id}:null});
    });
  }
  // « Continue » : ferme l'écran (les octrois encore en vol repartiront en toast). « Play again » :
  // ferme et remonte la route (nouvelles questions : les modules les tirent au montage).
  function closeSession(){openSessionRef.current=0;openSessionSpRef.current=null;setLastSession(null);}
  function replaySession(){closeSession();setRunKey(function(k){return k+1;});}
  function nav(pg,arg){stopBGM();sSP(pg);sSPA(arg||null);}
  async function onboard(name,classCode,bsScores,firstNav,bsV2Results,authBind){
    classCode=classCode||'visitor';
    // Check if student already exists (use limit(1) — safe even with duplicates)
    // Check for existing student (accent + case insensitive)
    var norm=normalizeName(name);
    // B3 : c'était un `select('*')` sur TOUTE la cohorte — ~156 lignes complètes (email,
    // access_level, gdpr_consent, password_set_at…) envoyées au navigateur de quiconque
    // saisit un class code, pour répondre à « ce nom existe-t-il déjà ? ». La RPC fait la
    // comparaison normalisée côté serveur et ne renvoie que les correspondances, en
    // colonnes minimales. On n'a besoin que du nom canonique (casing DB) pour recover().
    var lookup=await supabase.rpc('find_students_by_name',{p_name:name,p_class_code:classCode});
    if(lookup.error)console.warn("[onboard] find_students_by_name failed:",lookup.error.message);
    var existingMatch=(lookup.data||[]).filter(function(s){return normalizeName(s.name)===norm;});
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
      // V2 enrichment: macro-grammar + per-part scan accuracies for Mentor radar / TodayFocus / NextStepReco
      // bootstrap. The scan thus becomes the cold-start signal for personalization, instead of dead-ending.
      // u.battleScan.subScores.grammarMacros: {verbs:0..1, linking:0..1, forms:0..1, reference:0..1}
      // u.battleScan.subScores.parts: {p1, p2, p3, p4, p6, p7} accuracies 0..1 (only those probed)
      if(bsV2Results){
        var sub={grammarMacros:{},parts:{}};
        if(bsV2Results.grammar&&bsV2Results.grammar.byMacro)sub.grammarMacros=bsV2Results.grammar.byMacro;
        if(bsV2Results.reading&&bsV2Results.reading.byPart){
          if(typeof bsV2Results.reading.byPart.p6==="number")sub.parts.p6=bsV2Results.reading.byPart.p6;
          if(typeof bsV2Results.reading.byPart.p7==="number")sub.parts.p7=bsV2Results.reading.byPart.p7;
        }
        if(bsV2Results.listening&&bsV2Results.listening.byPart){
          ["p1","p2","p3","p4"].forEach(function(p){if(typeof bsV2Results.listening.byPart[p]==="number")sub.parts[p]=bsV2Results.listening.byPart[p];});
        }
        u.battleScan.subScores=sub;
        u.battleScan.sectionAcc={
          grammar:bsV2Results.grammar?bsV2Results.grammar.acc:null,
          vocab:bsV2Results.vocab?bsV2Results.vocab.acc:null,
          reading:bsV2Results.reading?bsV2Results.reading.acc:null,
          listening:bsV2Results.listening?bsV2Results.listening.acc:null
        };
      }
    }
    sU(u);
    saveLocal(u);
    // Initial sync to create the row in Supabase.
    // allowInsert: onboard() est le SEUL appelant autorisé à créer une ligne pour un
    // prénom déjà présent dans une autre promo (homonyme). Cf. garde anti-phantom
    // dans save() — ne pas propager ce flag aux syncs de routine.
    setSyncDirty(true);
    // authBind (P2 Phase A) : signup PASSWORD → la ligne créée ici reçoit user_id +
    // password_set_at (via save/bindAuth). Absent pour visitor/legacy (session anonyme).
    syncToCloud(u,{allowInsert:true,bindAuth:!!authBind});
    // Narrator: "The Verdict" fires once, right after the student clicks
    // "Enter the Arena" (langBridge). Depuis 2026-05-03, ce moment intègre
    // aussi la présentation des 3 piliers de l'app (Daily Quest, Salle
    // d'Entraînement, Ligue) — le TutorialTour séparé a été supprimé.
    // Do NOT move this push earlier in the onboarding (e.g. to Battle Report)
    // or the narrator would fire mid-flow and confuse the consent/scan sequence.
    //
    // Si l'user arrive via deep link landing (?upgrade=...), on diffère le
    // verdict : il jouerait par-dessus l'UpgradeScreen, ce qui casse le flow.
    // Un useEffect watch tab==="home" et déclenche le verdict à la 1ère
    // arrivée Home (post-paiement, ou si l'user navigue manuellement).
    var pendingUpgrade=null;
    try{pendingUpgrade=sessionStorage.getItem("toeic-arena-pending-upgrade");}catch(e){}
    if(!pendingUpgrade){
      pushNarratorMoment(u,"verdict");
    }
    if(firstNav){setTimeout(function(){
      // firstNav may be a tab id ("home"|"games"|"train"|"league"|"profile"|"mentor")
      // or a sub-page id ("drill"|"tavern"|"lisP1"...). Phase E (scan-v2) added tab routing
      // so the Battle Report can hand off to the Mentor tab directly.
      var KNOWN_TABS=["home","games","train","league","profile","mentor"];
      if(KNOWN_TABS.indexOf(firstNav)>=0){sT(firstNav);}else{sSP(firstNav);}
    },300);}
  }
  async function recover(name,classCode){
    // Find the best row (highest XP) for this student
    // Accent + case insensitive lookup
    var rnorm=normalizeName(name);
    // Session D'ABORD : la lecture ci-dessous est gardée par auth.uid().
    var sess=await supabase.auth.getSession();
    var userId=sess.data.session?sess.data.session.user.id:null;
    if(!userId){
      var authRes=await supabase.auth.signInAnonymously();
      if(!authRes.data.user)return false;
      userId=authRes.data.user.id;
    }

    // F3 (2026-09-16) : lecture par load_student, la RPC GARDÉE (student_guard), comme load().
    // Ligne sécurisée → seul son propriétaire la lit : doStudentSignIn et le claim lient la
    // session (bind_student_user_id) AVANT d'appeler recover(). Ligne legacy (visitor, non
    // migrée) → tolérance, comme partout. Avant, recover_student_row rendait la ligne COMPLÈTE
    // (email, access_level, progression) sur un simple prénom + code promo (finding C4, côté
    // lecture), et « Continuer sans pour l'instant » faisait entrer sur un compte sécurisé avec
    // une session qui ne pouvait rien sauvegarder. Ne pas revenir à une lecture sans garde.
    var rr=await supabase.rpc('load_student',{p_name:name,p_class_code:classCode});
    if(rr.error)console.warn("[recover] rpc failed:",rr.error.message);
    var d=rr.data||null;
    if(!d||normalizeName(d.name||"")!==rnorm){console.warn("[recover] no readable row for",name,classCode,"(absent, or secured and not owned by this session)");return false;}

    // id rebinding removed: previously we tried to UPDATE students.id = currentAuthUid so
    // load()'s fallback-by-id would find the row. This caused 409 conflicts on multi-profile
    // devices (same auth user recovering different students — each UPDATE hit the PK unique
    // constraint). Since the INSERT policy was relaxed (no more id = auth.uid() requirement)
    // and primary lookup uses (name, class_code) from localStorage, id rebinding is obsolete.
    setCachedUserId(userId);

    try { localStorage.setItem('toeic-arena-name', name); } catch(e) {}
    try { localStorage.setItem('toeic-arena-class', classCode); } catch(e) {}
    // Reconnexion après une session perdue (2026-09-16) : ce qui a été joué pendant la panne
    // n'existe QUE dans la copie locale (chaque save était refusé). Écraser le local par la ligne
    // distante le perdait. Si le local est celui de CET élève et plus frais, on le garde (fusionné
    // avec les champs serveur) et on le repousse maintenant que la session est la bonne.
    // Même règle que load() : lib/staleRemote.js, tests/check_fresher_local.cjs.
    var fresher=fresherLocalFor(d,loadLocal());
    var u=fresher||supaToLocal(d);
    sU(u);
    saveLocal(u);
    if(fresher){console.warn("[recover] local is fresher (xp "+(fresher.xp||0)+">"+(d.xp||0)+") — keeping it and pushing");setSyncDirty(true);save(fresher);}
    return true;
  }

  // Welcome back via email+password (Phase 2 — refonte 2026-04-27).
  // Pré-condition : signInWithPassword(email, password) déjà appelé avec succès,
  // donc la session Supabase est active sur le bon auth user.
  // Lookup students par email — pattern aligné avec recover() mais sur la clé email.
  async function recoverByEmail(email){
    var e=(email||"").trim().toLowerCase();
    if(!e)return false;
    // B3 : c'était `select('*').ilike('email', e)` — une lecture GLOBALE, sans filtre de
    // cohorte, avec un `ilike` non échappé : un email contenant `%` aurait ramené la
    // table entière. La RPC ne prend AUCUN paramètre, elle lit l'email dans le JWT de la
    // session — on ne peut donc viser que son propre compte. C'est la seule des RPC de ce
    // lot qui soit déjà sûre sous la Phase C.
    // La pré-condition ne change pas : signInWithPassword() a réussi juste avant, donc la
    // session porte bien l'email demandé. Le garde-fou ci-dessous le revérifie.
    var rr=await supabase.rpc('my_student_by_email');
    if(rr.error)console.warn("[recoverByEmail] rpc failed:",rr.error.message);
    var d=rr.data||null;
    if(!d){console.warn("[recoverByEmail] no students row for",e);return false;}
    if((d.email||"").toLowerCase()!==e){console.warn("[recoverByEmail] session email mismatch for",e);return false;}
    // La session est censée être active grâce à signInWithPassword
    var sess=await supabase.auth.getSession();
    var userId=sess.data.session?sess.data.session.user.id:null;
    if(!userId){console.warn("[recoverByEmail] no session post signin");return false;}
    setCachedUserId(userId);
    try{localStorage.setItem('toeic-arena-name',d.name);}catch(e){}
    try{localStorage.setItem('toeic-arena-class',d.class_code);}catch(e){}
    // Même garde que recover() ci-dessus : ne pas écraser une progression locale plus fraîche.
    var fresher=fresherLocalFor(d,loadLocal());
    var u=fresher||supaToLocal(d);
    sU(u);
    saveLocal(u);
    if(fresher){console.warn("[recoverByEmail] local is fresher (xp "+(fresher.xp||0)+">"+(d.xp||0)+") — keeping it and pushing");setSyncDirty(true);save(fresher);}
    return true;
  }

  function goTeacher(){setTeacher(true);}

  function bossDone(result,xp){var gxp=applyXpGates(xp,result.score,result.total,"boss");var c=addXp(gxp,{ceremony:true});c.stats.totalQ+=result.total;c.stats.correct+=result.score;c.stats.sessions+=1;if(!c.mockResults)c.mockResults={};var prev=c.mockResults.boss;if(!prev||result.toeicEstimate>=prev.toeicEstimate){c.mockResults.boss=result;}else{c.mockResults.boss=Object.assign({},prev,{date:result.date});}trackModSession(c,"boss");recordModule(c,"boss",result.score,result.total);if(c.bossResetArmed)c.bossResetArmed=false;if(c.boosts&&c.boosts.mockMultArmed)c.boosts.mockMultArmed=false;try{if(result.total>0&&result.score/result.total>=0.7)playJingleMock();else playJingleMockOk();}catch(e){}sv(c);
    // Pas de navigation ici : bossDone est appelé depuis doSubmit() pendant que
    // l'écran de résultats reste affiché (même GARDE que mockDone / bug Yannou).
  }
  function endlessDone(result,xp,meta){
    var c=addXp(xp,{ceremony:true});
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
    if(c.endlessResetArmed)c.endlessResetArmed=false; // V2 — consume after the run
    try{if(result.toeicEstimate>=800)playJingleMock();else playJingleMockOk();}catch(e){}haptic("complete");
    sv(c);
    // Pas de navigation ici : endlessDone est appelé depuis doSubmit() pendant
    // que l'écran de résultats reste affiché (même GARDE que mockDone/bossDone).
  }
  function mockDone(result,xp){
    var modId="mock"+result.mockId;
    var timeGateOk=(result.timeUsed||0)>=300;
    var gxp=timeGateOk?applyXpGates(xp,result.score,result.total,modId):0;
    var c=addXp(gxp,{ceremony:true});
    c.stats.totalQ+=result.total;c.stats.correct+=result.score;c.stats.sessions+=1;
    if(!c.mockResults)c.mockResults={};
    c.mockResults["mock"+result.mockId]=result;
    trackModSession(c,modId);
    recordModule(c,modId,result.score,result.total);
    if(c.mockResetArmed)c.mockResetArmed=false; // V2 — consume Mock Reset flag after run
    if(c.boosts&&c.boosts.mockMultArmed)c.boosts.mockMultArmed=false; // P2.5 — consume Mock Multiplier
    try{if(result.total>0&&result.score/result.total>=0.7)playJingleMock();else playJingleMockOk();}catch(e){}haptic("complete");
    // Coffres : Mock Tests + Boss Test
    if(result.mockId==="1"||result.mockId===1)grantChestLocal("mock_1","champion");
    if(result.mockId==="2"||result.mockId===2)grantChestLocal("mock_2","champion");
    if(result.mockId==="3"||result.mockId===3)grantChestLocal("mock_3","champion");
    if(result.mockId==="boss")grantChestLocal("boss_test","legendaire");
    // Pas de navigation ici : mockDone est appelé depuis submitTest() pendant
    // que l'écran de résultats reste affiché. La navigation se fait via le
    // bouton "Exit" / la révision (voir GARDE dans MockTest.submitTest).
    sv(c);
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
    } else recordGame(c,modeKey,result);
    c.stats.sessions+=1;trackModSession(c,"game_"+modeKey);sv(c);sSP(null);sT("games");}
  // Record et coffres des jeux au score ou au temps (partagé par gameDone et gameSession).
  function recordGame(c,modeKey,result){
    // Defensive: if prev2 exists but the relevant field is missing/null (corrupted
    // record after a partial save or tab-race overwrite), treat as no record and
    // accept the new result. Without this, a malformed prev2 traps the student
    // forever in a non-recordable state (Baptiste C / Speed Match incident 2026-05-26).
    var prev2=c.gameScores[modeKey];
    var prev2Stale=prev2&&(result.time!==undefined?(prev2.time==null):(prev2.score==null));
    var dominated=!prev2||prev2Stale||(result.time!==undefined?result.time<prev2.time:(result.score>prev2.score||(result.score===prev2.score&&result.maxCombo>(prev2.maxCombo||0))));
    if(dominated){c.gameScores[modeKey]=result;}else if(prev2&&result.maxCombo!==undefined&&result.maxCombo>(prev2.maxCombo||0)){c.gameScores[modeKey]=Object.assign({},prev2,{maxCombo:result.maxCombo});}
    // Chest triggers: WordFall combos
    if(modeKey==="wordFall"&&result.maxCombo){
      if(result.maxCombo>=30)grantWeeklyChest("wfall_combo30","champion");
      else if(result.maxCombo>=20)grantWeeklyChest("wfall_combo20","guerrier");
      else if(result.maxCombo>=10)grantWeeklyChest("wfall_combo10","novice");
    }
    // SpeedMatch
    if(modeKey==="matchEasy"&&result.time){var starsE=result.time<24?3:result.time<42?2:1;if(starsE>=2)grantWeeklyChest("smatch_easy_good","novice");}
  }
  // Speed Match et Word Fall sur l'écran de fin commun : même chaîne que gameDone (pas d'accuracy
  // sans correct/total, pas de Spotlight), sans navigation. Rend le sid. Le Duel reste sur gameDone.
  function gameSession(modeKey,result,xp){
    var hasAccuracy=result.correct!==undefined&&result.total!==undefined;
    var s=settleSession("game_"+modeKey,hasAccuracy?result.correct:1,hasAccuracy?result.total:1,xp);
    var c=s.c;if(!c.gameScores)c.gameScores={};
    recordGame(c,modeKey,result);
    c.stats.sessions+=1;trackModSession(c,"game_"+modeKey);sealSession(c,s.sid);sv(c);return s.sid;}
  function trackModSession(c,modId){if(!c.dailyModSessions)c.dailyModSessions={};var key=modId+"_"+today();c.dailyModSessions[key]=(c.dailyModSessions[key]||0)+1;}
  // Daily sur l'écran de fin commun : xpE garde désormais l'XP réellement versée (bonus du jour compris),
  // affichée ensuite par « Already completed » et sur Home. Pas de Spotlight (comme avant).
  function dailyDone(sc,xp,mistakes){var ss=settleSession("daily",sc,5,xp);var c=ss.c;c.daily={date:today(),done:true,score:sc,xpE:ss.total};c.weeklyDailyCount=(c.weeklyDailyCount||0)+1;c.stats.totalQ+=5;c.stats.correct+=sc;c.stats.sessions+=1;if(sc===5)c.stats.perfects=(c.stats.perfects||0)+1;trackModSession(c,"daily");recordModule(c,"daily",sc,5);c.review=recordMisses(c.review,mistakes,new Date());checkMission(c,"daily");grantMarks(10,"daily","daily_marks_"+today(),true);try{playJingleDaily();}catch(e){}
    // Track seen questions for anti-repetition
    if(!c.dailySeen)c.dailySeen=[];
    var todayQsArr=dailyQs(today(),c);
    todayQsArr.forEach(function(q){c.dailySeen.push({id:q.id,date:today()});});
    // Prune entries older than 45 days
    var pruneDate=new Date();pruneDate.setDate(pruneDate.getDate()-45);var pruneStr=pruneDate.toISOString().slice(0,10);
    c.dailySeen=c.dailySeen.filter(function(entry){return entry.date>=pruneStr;});
    sealSession(c,ss.sid);sv(c);return ss.sid;}
  // Drill : premier module sur l'écran de fin commun (pilote, 2026-09-17). Rend le sid de la session.
  function drillDone(sc,tot,xp,catStats,mistakes){var s=settleSession("drill",sc,tot,xp);var c=s.c;c.stats.totalQ+=tot;c.stats.correct+=sc;c.stats.sessions+=1;c.stats.drills=(c.stats.drills||0)+1;trackModSession(c,"drill");recordModule(c,"drill",sc,tot,catStats);c.review=recordMisses(c.review,mistakes,new Date());checkMission(c,"drill");sealSession(c,s.sid);sv(c);return s.sid;}
  // Mini-modules sur l'écran de fin commun (Spotlight compris), avec la session. Rend le sid.
  // `mistakes` (facultatif, aussi dans drillDone et dailyDone) : la liste mistakesRef du module. Ses
  // entrées qui portent `ref` entrent au bestiaire (lib/review.js recordMisses), file bornée ICI, à
  // l'écriture, jamais dans supaToLocal (une troncature à la lecture ferait échouer le round-trip).
  function miniSession(sc,tot,xp,mistakes){var modId=sp||"unknown";var s=settleSession(modId,sc,tot,xp,{spotlight:true});var c=s.c;c.stats.totalQ+=tot;c.stats.correct+=sc;c.stats.sessions+=1;trackModSession(c,modId);recordModule(c,modId,sc,tot);c.review=recordMisses(c.review,mistakes,new Date());checkMission(c,modId);sealSession(c,s.sid);sv(c);return s.sid;}
  // Chasse aux erreurs (2026-09-17, lot 3). La base d'XP vient du module (5 + 5 par créature vaincue,
  // lib/review.js huntReward) : on ne paie QUE les créatures vaincues, jamais une simple réussite —
  // rater exprès une question de Drill coûte 7 XP tout de suite contre 5 XP onze jours plus tard.
  // Le bestiaire mis à jour arrive dans payload.review (le module a travaillé sur une copie).
  function huntDone(sc,tot,xp,payload){
    var s=settleSession("hunt",sc,tot,xp,{extra:{slain:(payload&&payload.slain)||0}});var c=s.c;
    c.stats.totalQ+=tot;c.stats.correct+=sc;c.stats.sessions+=1;
    if(payload&&payload.review)c.review=boundReview(payload.review);
    trackModSession(c,"hunt");recordModule(c,"hunt",sc,tot);checkMission(c,"hunt");
    sealSession(c,s.sid);sv(c);
    // Darics hors XP, donc hors classement de ligue. Unique par jour : une 2e chasse ne les redonne pas.
    if(payload&&payload.darics>0)grantMarks(payload.darics,"hunt","hunt_"+today(),false);
    return s.sid;
  }
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
    // « Changer de profil » (2026-09-16) : vide le profil local et l'état React, et FERME la session
    // Supabase de cet appareil (portée locale). Avant, la session était gardée : pour un compte
    // SÉCURISÉ, un simple rechargement ré-entrait sur ce compte sans onboarding (démarrage → load()
    // → load_student_by_uid), et sur un appareil partagé l'élève suivant retombait sur le compte du
    // précédent. La raison historique de la garder (« la session anonyme donne l'accès RLS au
    // lookup ») est caduque : le lookup est une RPC publique et lookupName ouvre sa propre session
    // anonyme. Différence avec la « Déconnexion complète » du Profil : préférences locales (son,
    // conseils, fêtes) conservées, pas de rechargement.
    try{localStorage.removeItem("toeic-arena-profile");localStorage.removeItem("toeic-arena-name");localStorage.removeItem("toeic-arena-class");}catch(e){console.warn("[logout] storage caught:",e&&e.message);}
    clearDashSession(); // B4 : ne pas laisser une session formateur derrière soi
    setCachedUserId(null);setSyncDirty(false);
    sU(null);sSP(null);sT("home");
    // Après le changement d'écran : l'attente réseau (et le verrou d'auth) ne fige pas l'interface.
    try{await supabase.auth.signOut({scope:'local'});}catch(e){console.warn("[logout] signOut caught:",e&&e.message);}
  }

  // RGPD erasure (P2 Phase B, B6). L'ancien delete `.eq('id',uid)` ne matchait JAMAIS
  // la ligne students (id = PK aléatoire auto-généré, PAS l'auth uid) → le compte
  // survivait à la "suppression". Fait vérifié 2026-09-13 : le rôle authenticated N'A PAS
  // le privilège DELETE sur students (donc, au passage, un élève ne PEUT PAS supprimer un
  // autre — pas de vecteur cross-user). La seule voie d'effacement du profil est donc une
  // RPC SECURITY DEFINER (delete_my_account), appelée depuis purgeUserRows.
  // (Le delete du dashboard prof, App.jsx:12818, souffre du même manque de privilège →
  // il ne supprime probablement rien ; à router via une RPC teacher en B5.)
  async function purgeUserRows(uid,name,cc){
    try{
      // La ligne students ne peut PAS être supprimée par le client : le rôle authenticated
      // n'a pas le privilège DELETE dessus (vérifié 2026-09-13). Seul chemin = RPC
      // delete_my_account (SECURITY DEFINER, ownership stricte auth.uid()=user_id). Elle
      // supprime la ligne profil + toutes les tables satellites côté serveur.
      // Comptes legacy non migrés (user_id NULL) : la RPC refuse (not_secured) — il faut
      // sécuriser le compte (mot de passe) avant de pouvoir l'effacer. Dégrade proprement
      // si la RPC n'est pas encore déployée (function not found → warn, pas de crash).
      var r=await supabase.rpc('delete_my_account',{p_name:name,p_class_code:cc});
      if(r.error)console.warn("[purge] rpc error:",r.error.message);
      else if(r.data&&r.data.ok===false)console.warn("[purge] rpc refused:",r.data.error);
      // Best-effort satellites côté client (couvre les legacy que la RPC n'a pas touchés ;
      // no-op idempotent sinon). Ces tables SONT supprimables par authenticated.
      // weekly_snapshots : plus d'acces direct (lot 3). delete_my_account purge
      // deja la table cote serveur, par user_id, dans la meme transaction.
      // push_subscriptions : plus d'acces direct depuis le client (lot 2 du verrou
      // satellites). delete_my_account purge deja cette table cote serveur ; pour un
      // compte legacy que la RPC refuse, il n'y a plus de rattrapage best-effort ici
      // — c'est assume, voir le message affiche a l'utilisateur.
      // Les 4 tables de coffres non plus (lot 4). delete_my_account les purge
      // toutes cote serveur, dans la meme transaction que la ligne students.
    }catch(e){console.warn("[purge] caught:",e&&e.message);}
  }
  async function deleteAccount(){
    var sess=await supabase.auth.getSession();
    var uid=sess.data.session?sess.data.session.user.id:null;
    await purgeUserRows(uid,u.name,u.classCode);
    // signOut GLOBAL voulu ici (F4) : le compte est supprimé, aucun appareil ne doit garder de session.
    // La « Déconnexion complète » du Profil, elle, est en portée locale (auth.js signOutCompletely).
    try{await supabase.auth.signOut();}catch(e){console.warn("[deleteAccount] signOut caught:",e&&e.message);}
    try{localStorage.removeItem("toeic-arena-profile");localStorage.removeItem("toeic-arena-name");localStorage.removeItem("toeic-arena-class");}catch(e){}
    clearDashSession(); // B4 : ne pas laisser une session formateur derrière soi
    setCachedUserId(null);setSyncDirty(false);
    sU(null);sSP(null);sT("home");
  }
  async function reset(){
    var sess=await supabase.auth.getSession();
    var uid=sess.data.session?sess.data.session.user.id:null;
    await purgeUserRows(uid,u.name,u.classCode);
    // signOut GLOBAL voulu ici (F4) : les lignes du compte viennent d'être purgées, aucune session
    // ne doit survivre ailleurs sur un compte vidé.
    try{await supabase.auth.signOut();}catch(e){console.warn("[reset] signOut caught:",e&&e.message);}
    try{localStorage.removeItem("toeic-arena-profile");localStorage.removeItem("toeic-arena-name");localStorage.removeItem("toeic-arena-class");}catch(e){}
    clearDashSession(); // B4 : ne pas laisser une session formateur derrière soi
    setCachedUserId(null);setSyncDirty(false);
    sU(null);sSP(null);sT("home");
  }

  // Opt-out des fêtes (Home « Turn off », Profil → Style) : écrit en localStorage, puis relu tout de
  // suite pour ne pas attendre le tick horaire.
  function setFestivals(on){setFestivalsEnabled(on);setFestId(appliedFestivalId(new Date()));}
  // Festival themes : la fête REMPLACE la classe du skin, elle ne s'y superpose pas. 13 skins sur 16
  // tiennent .crd::before/::after en !important : un paquet .fest-* posé en plus se battrait avec
  // eux. u.equippedSkin n'est jamais modifié, le skin revient seul à la fin de la fenêtre. Gardé par
  // `u` exactement comme le skin : l'onboarding (!u) reste sur l'identité canonique.
  var lc="app"+(u&&u.theme==="light"?" light":"")+(u&&festId?" fest-"+festId:(u&&u.equippedSkin?" skin-"+u.equippedSkin:""));
  var isExpiredGroup=groupAccess&&groupAccess.status==="expired";
  // Palier le plus élevé de la file : le bouton de Home montre ce coffre-là (novice 0 → legendaire 3).
  // L'ouverture reste dans l'ordre de la file (chestPending[0]), la pastille ×N dit qu'il y en a d'autres.
  var pendingChestTier=chestPending.reduce(function(m,c){return Math.max(m,(c&&CHEST_TIER[c.chest_type])||0);},0);
  var expBlocked=isExpiredGroup?["home","train","cards","games"]:[];
  var tabGo=function(t){if(expBlocked.indexOf(t)!==-1)return;if(teacherMode)setTeacher(false);
    // Mentor shares bgm_home with Home/League/Profile. The narrator-watcher
    // useEffect below will fade it out automatically when Aldric speaks
    // (first-open or replay) and restore it when the chronicle closes.
    if(t==="home"||t==="mentor"||t==="league"||t==="profile")playBGM("bgm_home");else stopBGM();
    sT(t);sSP(null);sSPA(null);
    // First-time Mentor open : fire Aldric's "Compass" Side Chronicle. Idempotent
    // (pushNarratorMoment checks hasHeardMoment), so navigating back doesn't replay.
    if(t==="mentor"&&u)pushNarratorMoment(u,"mentor_intro");};
  // Premium prompt overlay — rendered by both pg() sub-pages AND the main tab render path,
  // otherwise clicking a locked module inside a sub-page (Listen/Read hub, etc.) would set
  // the state but the popup wouldn't appear until the user navigated away.
  var premiumOverlay=premiumPrompt&&<div style={{position:"fixed",inset:0,background:"rgba(0,0,0,.75)",zIndex:9999,display:"flex",alignItems:"center",justifyContent:"center",padding:24}} onClick={function(){setPremiumPrompt(null);}}>
    <div style={{background:"var(--bg2)",borderRadius:20,padding:28,maxWidth:360,textAlign:"center",animation:"fadeIn .3s",border:"1px solid rgba(255,215,0,.25)",boxShadow:"0 0 40px rgba(255,215,0,.15)"}} onClick={function(e){e.stopPropagation();}}>
      <div style={{fontSize:56,marginBottom:12}}>{"\uD83C\uDFF0"}</div>
      <h3 className="out" style={{fontWeight:800,fontSize:22,marginBottom:6,color:"var(--gold)"}}>{"Accès réservé"}</h3>
      <p style={{color:"var(--t2)",fontSize:13,lineHeight:1.6,marginBottom:18}}>
        {"Réservé aux abonnés Premium."}<br/>
        <span style={{color:"var(--t3)",fontSize:12}}>{"Fonctionnalité à venir."}</span>
      </p>
      <button className="btn2" onClick={function(){setPremiumPrompt(null);}}
        style={{width:"100%",fontSize:13,padding:"11px 16px",borderColor:"rgba(var(--cx),.25)",color:"var(--cyan)"}}>
        OK
      </button>
    </div>
  </div>;
  // Session perdue en cours de session (F2, 2026-09-16) : Supabase refuse les sauvegardes de ce
  // compte à la session courante. Rendu dans pg() ET dans le retour principal (même patron que
  // premiumOverlay), sans éjecter l'élève d'un exercice en cours. « Log in again » → sU(null) :
  // Onboard reprend au mot de passe (prop reauth, F1) ; la copie locale n'est PAS effacée, elle est
  // récupérée à la reconnexion (recover → fresherLocalFor). Bouton sans .btn2 : skins et fêtes
  // forcent sa couleur en !important, le rouge du signal serait perdu.
  var authBanner=u&&authLost&&<div role="alert" style={{position:"fixed",top:0,left:0,right:0,zIndex:9000,padding:"calc(env(safe-area-inset-top, 0px) + 10px) 16px 10px",background:"var(--bg2)",borderBottom:"1px solid rgba(255,71,87,.35)",boxShadow:"0 4px 18px rgba(0,0,0,.25)",display:"flex",alignItems:"center",justifyContent:"center",gap:12,flexWrap:"wrap"}}>
    <span style={{fontSize:13,fontWeight:600,color:"var(--red)"}}>{"Session expired — your progress isn't being saved."}</span>
    <button onClick={function(){sSP(null);sT("home");sU(null);}} style={{background:"transparent",border:"1px solid rgba(255,71,87,.45)",borderRadius:10,padding:"7px 14px",color:"var(--red)",fontFamily:"'Cinzel','Outfit',serif",fontWeight:600,fontSize:12,cursor:"pointer"}}>{"Log in again"}</button>
  </div>;
  function pg(content){return(<div className={lc}><style>{CSS}</style>{authBanner}{xpt&&<XpToast v={xpt}/>}{achToast&&<AchToast v={achToast}/>}{marksToast&&<MarksToast v={marksToast}/>}{!chestModal&&!lastSession&&!examCeremony&&<NarratorOverlay moment={currentNarratorMoment} muted={u&&u.narrator&&u.narrator.muted} onClose={dismissNarratorMoment}/>}<div className="pg-wrap"><LoadBoundary key={(sp||"root")+":"+runKey}><Suspense fallback={<LoadingMark inline/>}>{content}</Suspense></LoadBoundary></div><Tabs cur={tab} go={tabGo} blocked={expBlocked}/>{premiumOverlay}{examCeremony&&<ExamCeremonies key={examCeremony.id} items={examCeremony.items} onDone={function(){setExamCeremony(null);}}/>}</div>);}
  // ↑ Frontière des écrans chargés à la demande (Phase 5) : le fallback et le filet d'erreur
  // n'enveloppent QUE le contenu de la sous-page — toasts, Narrator, Tabs et overlay premium
  // sont frères, jamais cachés ni remontés. La key sur la route remet le filet à zéro quand
  // l'élève change d'écran, et runKey la change aussi pour « Play again » (remontage du module).
  // Aldric est retenu tant qu'un écran de fin est ouvert (sa file est gardée : il parle après
  // « Continue », au lieu de recouvrir le parchemin).

  // Reset password : bypass complet du flow normal si l'URL a ?reset=<token>.
  // Doit être AVANT loading/teacher/onboard parce que le user peut être complètement
  // déconnecté quand il clique le lien depuis son mail.
  if(resetToken)return(<div className={lc+" onboard-shell"}><style>{CSS}</style><ResetPasswordView token={resetToken}/></div>);
  // Écran de chargement : le bloc vit dans components/LoadingMark.jsx, qui sert aussi de
  // fallback aux écrans chargés à la demande (même rendu, plein écran ou sous-page).
  if(ld)return(<div className={lc+" onboard-shell"}><style>{CSS}</style><LoadingMark/></div>);
  if(teacherMode)return pg(<TeacherDashLazy back={function(){setTeacher(false);}}/>);
  // Le fallback plein écran est pixel-identique à l'écran `ld` : pour un nouvel élève, le
  // chargement dure simplement un peu plus (le temps du chunk Onboard, une fois par build).
  if(!u)return(<div className={lc+" onboard-shell"}><style>{CSS}</style><LoadBoundary><Suspense fallback={<LoadingMark/>}><OnboardLazy go={onboard} goTeacher={goTeacher} recover={recover} recoverByEmail={recoverByEmail} reauth={authLost}/></Suspense></LoadBoundary></div>);

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

  var routed=renderRoute({activeEvents, bossDone, cardsDone, closeSession, dailyDone, drillDone, endlessDone, gameDone, gameSession, grantWeeklyChest, groupType, huntDone, lastSession, miniSession, mockDone, nav, pg, rateCard, replaySession, sSP, sSPA, sT, sealSession, setPremiumPrompt, settleSession, shopBuy, sp, spA, sv, trackModSession, u});
  if(routed)return routed;

  return(<div className={lc}><style>{CSS}</style>{authBanner}{xpt&&<XpToast v={xpt}/>}{achToast&&<AchToast v={achToast}/>}{marksToast&&<MarksToast v={marksToast}/>}
    {!chestModal&&<NarratorOverlay moment={currentNarratorMoment} muted={u&&u.narrator&&u.narrator.muted} onClose={dismissNarratorMoment}/>}
    {showTip&&u&&<DailyTip u={u} close={function(){setShowTip(false);}}/>}
    {isExpiredGroup&&<div style={{padding:"10px 16px",background:"rgba(255,71,87,.08)",border:"1px solid rgba(255,71,87,.2)",borderRadius:12,margin:"12px 16px 0",textAlign:"center"}}>
      <p style={{fontSize:12,color:"var(--red)",margin:0,fontWeight:600}}>{"\u23F0 Acc\u00e8s expir\u00e9 le "}{groupAccess.endDate}{" — consultation uniquement"}</p>
    </div>}
    {tab==="home"&&!isExpiredGroup&&<Home u={u} nav={nav} tabGo={tabGo} festId={festId} onFestivalsOff={function(){setFestivals(false);}} events={activeEvents} medianXp={classMedianXp} pendingChests={pendingChestCount} pendingChestTier={pendingChestTier} onOpenChest={function(){if(chestPending.length>0)setChestModal(chestPending[0]);}} onMount={function(){playBGM("bgm_home");}} onLeave={function(){stopBGM();}}/>}{tab==="train"&&!isExpiredGroup&&<Train u={u} nav={nav} tabGo={tabGo} initialView={spA} groupType={groupType} events={activeEvents} onPremium={function(n){setPremiumPrompt(n);}} setUser={function(c){sv(c);}}/>}{tab==="cards"&&!isExpiredGroup&&<Cards u={u} nav={nav} groupType={groupType} onPremium={function(n){setPremiumPrompt(n);}}/>}{tab==="games"&&!isExpiredGroup&&<GamesHub u={u} nav={nav} groupType={groupType} events={activeEvents} onPremium={function(n){setPremiumPrompt(n);}}/>}{tab==="mentor"&&!isExpiredGroup&&<Mentor u={u} nav={nav} tabGo={tabGo} setUser={function(c){sv(c);}} replayNarrator={function(id){setNarratorQueue([id]);}}/>}{tab==="league"&&<League u={u}/>}{tab==="profile"&&<Profile u={u} festId={festId} setFestivals={setFestivals} reset={reset} logout={logout} deleteAccount={deleteAccount} setAvatar={function(c){sv(c);}} goTeacher={function(){setTeacher(true);}} goUpgrade={function(){sSP("upgrade");}} goShop={function(){sSP("shop");}} replayNarrator={function(id){setNarratorQueue([id]);}}/>}
    {/* TutorialTour supprimé 2026-05-03 — absorbé dans le Verdict d'Aldric (cf. narrator.js). */}
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
