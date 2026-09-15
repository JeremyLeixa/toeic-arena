import { useState, useEffect, useRef, useMemo } from "react";
import { playCorrect, playWrong, playXP, playLevelUp, playCombo, playStreak, playTimer, playClick, playArenaCall, playJingleEnter, playJingleAchieve, playJingleLeague, playJingleMock, playJingleMockOk, playJingleDaily, playBGM, stopBGM } from "./sounds.js";
import { BarChart, Bar as RBar, LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Cell } from "recharts";
import { today, weekId, normalizeName } from "./lib/util.js";
import { fresh, supaToLocal, buildSavePayload } from "./lib/profileSchema.js";
import { haptic, isStandalonePWA, isIOSDevice } from "./lib/device.js";
import { getEnVoice, isAudioAborted, playAudioFile, stopListenAudio, resumeAudioSession } from "./lib/audio.js";

/* ═══════════════════════════════════════════
   VERSE ARENA — MVP v2.0
   Mobile-first TOEIC training platform
   ═══════════════════════════════════════════ */


// ─── DATA IMPORTS ───
import { LEAGUES } from "./data/leagues.js";
import { ACHIEVEMENTS } from "./data/achievements.js";
import { MISSION_MODULES, BATTLE_SCAN_V2, SCAN_SECTION_ORDER } from "./data/placement.js";
import { createCatController, computeScanResult } from "./scanEngine.js";
import { TITLES, UNIQUE_TRIGGERS, LEGENDARY_ACHIEVEMENTS, EPIC_ACHIEVEMENTS, NOVICE_ACHIEVEMENTS, rollRarity, grantChest, getPendingChests, getOwnedRewards, getOwnedTokens, openChestFromPending, consumeToken, spendMarks } from "./data/chests.js";
import { GAME_ICON_PATHS, GAME_ICON_VIEWBOX } from "./data/avatarIcons.js";
import { NARRATOR_MOMENTS, hasHeardMoment, markMomentHeard } from "./narrator.js";
import { isGhost } from "./lib/access.js";
import { partOfModule, computeTodayFocus, battleScanToToeic, estimateTOEICScore } from "./lib/toeic.js";
import { getLeague, getEffectiveLeague, applyWeekTransition, generateSeasons, SEASONS, getCurrentSeason, getSeasonEndCountdown, computeRankings } from "./lib/league.js";
import { _cachedUserId, _syncDirty, saveLocal, getAccessTokenSync, load, save, syncToCloud, setCachedUserId, setSyncDirty } from "./lib/persistence.js";
import { recordModule, checkMission, dailyQs, srsUp } from "./lib/progress.js";
import { getDashTeacher, setDashSession, clearDashSession, isDashAdmin, teacherAuth, BIOMETRIC_KEY, biometricAvailable, getBioCredId, bioRegister, bioAuthenticate, optIcon } from "./lib/teacherSession.js";
import { getTriggerLabel } from "./lib/chestLabels.js";
import { CSS } from "./styles/appCss.js";
import { GIcon, LeagueIcon, SeasonIcon, BrandMark } from "./components/icons.jsx";












import { getLevel } from "./data/helpers.js";
import { Bar } from "./components/Bar.jsx";
import { PassageDocs } from "./components/PassageDocs.jsx";
import { renderAv } from "./components/avatar.jsx";
import { AchToast, MarksToast, XpToast } from "./components/toasts.jsx";
import { Tabs } from "./components/Tabs.jsx";
import { PrivacyPolicy } from "./components/legal.jsx";
import { Drill, WordFam, ConnSort, LinkingBridge, PrepDrill, GerInf, TrapsQuiz, FalseFriends, PhrasalDojo, GrammarRef } from "./features/train/grammar.jsx";
import { TimeSim, Part6Drill, Part7Read } from "./features/train/reading.jsx";
import { AboutToeic, StratCards, StratQuizPage } from "./features/train/strategy.jsx";
import { Cards, CardSess } from "./features/home/Cards.jsx";
import { Daily } from "./features/home/Daily.jsx";
import { DailyTip } from "./features/home/DailyTip.jsx";
import { GauntletHub } from "./features/gauntlet/Gauntlet.jsx";
import { ModalCouncilHub } from "./features/modals/ModalCouncil.jsx";
import { GamesHub } from "./features/games/GamesHub.jsx";
import { SentenceBuilder } from "./features/games/SentenceBuilder.jsx";
import { AudioBlitz } from "./features/games/AudioBlitz.jsx";
import { DuelArena } from "./features/games/DuelArena.jsx";
import { ClueHunter } from "./features/games/ClueHunter.jsx";
import { WordTavern } from "./features/games/WordTavern.jsx";
import { SpeedMatch } from "./features/games/SpeedMatch.jsx";
import { WordFall } from "./features/games/WordFall.jsx";
import { ListenHub, ListenP2, ListenP1, ListenP3, ListenP4, ReadingHub } from "./features/listening/Listening.jsx";
import { BossTest } from "./features/exams/BossTest.jsx";
import { EndlessArena } from "./features/exams/EndlessArena.jsx";
import { MockTest } from "./features/exams/MockTest.jsx";
import { Mentor } from "./features/mentor/Mentor.jsx";
import { Home } from "./features/home/Home.jsx";
import { Train } from "./features/home/Train.jsx";
import { ChestEarnedToast, ChestOpenModal } from "./features/chests/Chests.jsx";
import { Shop } from "./features/shop/Shop.jsx";
import { UpgradeScreen } from "./features/shop/UpgradeScreen.jsx";
import { Profile } from "./features/profile/Profile.jsx";
import { ResetPasswordView } from "./features/profile/ResetPasswordView.jsx";





var BUILD_ID="2026-09-15-split-phase1";



import { supabase } from './supabase.js'
import { getAuthUser, onAuthChange, signUpWithPassword, signInWithPassword, requestPasswordReset, signUpStudent, signInStudent, bindStudentUserId } from './auth.js';
console.warn("[VERSE ARENA] Build:",BUILD_ID);




























// ─── TEACHER DASHBOARD CONFIG ───
// H1 (2026-09-14) : VITE_PUSH_SECRET a disparu d'ici. C'etait un "secret" partage inline
// en clair dans le bundle : n'importe qui pouvait le lire et appeler /api/push-send pour
// notifier une promo entiere, voire class_code:"all". L'endpoint authentifie desormais le
// navigateur par le code formateur (valide cote serveur), et garde x-push-secret pour les
// seules Edge Functions cron. NE PAS reintroduire de secret cote client.
















// ═══════════════════════════════════════════════════════════
// MODAL COUNCIL — global module mirroring Grammar Gauntlet
// ═══════════════════════════════════════════════════════════
// Two sub-modules (Modal Match + Modal Sort) + complete grimoire.
// Module score keys: modals_match, modals_sort.
// Tier B XP (15 + 5×correct + 35 perfect = 125 max), aligned with Gauntlet.
// Tap-to-pair / tap-to-bucket UX (mobile-first, no native HTML5 drag).






// ─── NARRATOR OVERLAY — Aldric's 8 narrative moments ───
// Full-screen parchment popup with voice-over + subtitles + illustration.
// Triggered via app-level narratorQueue. Dismissable at any time via Continue/Skip.
//
// Playback flow:
//   1. On mount, a black layer fades out over ~800ms (cinematic "fade from black").
//   2. 1s after mount, we attempt audio.play() automatically. On mobile Safari
//      without a recent user gesture (parcours triggers), the browser may block
//      playback — the catch() logs a warning and the user can click Play
//      manually. On desktop/Android/iOS-with-gesture the autoplay succeeds.
//   3. Muted mode simulates subtitle timing via setInterval so visuals still play.
function NarratorOverlay(props) {
  var moment = props.moment;
  var onClose = props.onClose;
  // textOnly moments (no audio/image generated yet) reuse the muted timer path :
  // synthetic currentTime advance drives the subtitle reveal without any <audio>.
  var muted = props.muted || (moment && moment.textOnly) || false;

  var audioRef = useRef(null);
  var autoplayTimerRef = useRef(null);
  var closeTimerRef = useRef(null);
  var [playing, setPlaying] = useState(false);
  var [currentTime, setCurrentTime] = useState(0);
  var [duration, setDuration] = useState(moment ? moment.durationSec : 0);
  var [closing, setClosing] = useState(false);

  // Reset internal timer state whenever the moment changes (replay from Chronicles).
  // Also schedules the 1s autoplay attempt.
  useEffect(function(){
    setPlaying(false);
    setCurrentTime(0);
    setDuration(moment ? moment.durationSec : 0);
    setClosing(false);
    if(autoplayTimerRef.current){clearTimeout(autoplayTimerRef.current);autoplayTimerRef.current=null;}
    if(closeTimerRef.current){clearTimeout(closeTimerRef.current);closeTimerRef.current=null;}
    if(!moment || muted) return;
    // 2s delay lets the parchment fade-in AND the BGM fade-out complete
    // before the voice kicks in. The narrator-bgm useEffect in main App
    // calls stopBGM() (~600ms fade) the moment this overlay mounts, so by
    // T+2s we have full silence under the voice. (was 1s pre-2026-05-05
    // when BGM ducking wasn't wired — bumped for cleaner audio mix.)
    autoplayTimerRef.current = setTimeout(function(){
      var audio = audioRef.current;
      if(!audio) return;
      audio.play().then(function(){setPlaying(true);})
        .catch(function(err){console.warn("[narrator] autoplay blocked:", err&&err.message);});
    }, 2000);
    return function(){
      if(autoplayTimerRef.current){clearTimeout(autoplayTimerRef.current);autoplayTimerRef.current=null;}
    };
  },[moment && moment.id, muted]);

  // Find the active subtitle based on currentTime
  var activeSub = null;
  if (moment && moment.subtitles) {
    for (var i = 0; i < moment.subtitles.length; i++) {
      var s = moment.subtitles[i];
      if (currentTime >= s.from && currentTime < s.to) { activeSub = s; break; }
    }
    if (!activeSub && currentTime >= moment.subtitles[moment.subtitles.length - 1].from) {
      activeSub = moment.subtitles[moment.subtitles.length - 1];
    }
    if (!activeSub) activeSub = moment.subtitles[0];
  }

  // Audio event handlers
  useEffect(function() {
    var audio = audioRef.current;
    if (!audio) return;
    function onTime() { setCurrentTime(audio.currentTime); }
    function onLoaded() { if (audio.duration && !isNaN(audio.duration)) setDuration(audio.duration); }
    function onEnd() { setPlaying(false); }
    audio.addEventListener("timeupdate", onTime);
    audio.addEventListener("loadedmetadata", onLoaded);
    audio.addEventListener("ended", onEnd);
    return function() {
      audio.removeEventListener("timeupdate", onTime);
      audio.removeEventListener("loadedmetadata", onLoaded);
      audio.removeEventListener("ended", onEnd);
    };
  }, [moment && moment.id]);

  // Muted auto-mode: simulate subtitle advance so visuals still play in silent mode
  useEffect(function() {
    if (!muted || !moment) return;
    var startTime = Date.now();
    var iv = setInterval(function() {
      var elapsed = (Date.now() - startTime) / 1000;
      setCurrentTime(elapsed);
      if (elapsed >= moment.durationSec) clearInterval(iv);
    }, 100);
    return function() { clearInterval(iv); };
  }, [muted, moment && moment.id]);

  function togglePlay() {
    var audio = audioRef.current;
    if (!audio || muted) return;
    if (playing) { audio.pause(); setPlaying(false); }
    else {
      audio.play().then(function() { setPlaying(true); })
        .catch(function(err) { console.warn("[narrator] play failed:", err && err.message); });
    }
  }

  function handleClose() {
    if (closing) return; // already in progress — ignore double-click
    var audio = audioRef.current;
    if (audio) { try{audio.pause(); audio.currentTime = 0;}catch(e){console.warn("[narrator] close pause caught:", e&&e.message);} }
    // Stop the pending autoplay if the user closes before it fires
    if(autoplayTimerRef.current){clearTimeout(autoplayTimerRef.current);autoplayTimerRef.current=null;}
    setClosing(true);
    // Keep animation in sync with the narratorFadeToBlack keyframe duration
    closeTimerRef.current = setTimeout(function(){ onClose(); }, 500);
  }

  if (!moment) return null;

  var progressPct = duration > 0 ? Math.min(100, (currentTime / duration) * 100) : 0;
  var mmss = function(t) {
    var m = Math.floor(t / 60);
    var s = Math.floor(t % 60);
    return m + ":" + (s < 10 ? "0" + s : s);
  };

  return (
    <div style={{
      position: "fixed", top: 0, left: 0, right: 0, bottom: 0,
      background: "rgba(10,8,5,0.92)",
      zIndex: 9999,
      display: "flex", alignItems: "center", justifyContent: "center",
      padding: "20px 12px",
      animation: "fadeIn 0.4s ease-out"
    }} onClick={function(e) { if (e.target === e.currentTarget) handleClose(); }}>

      {/* Parchment popup */}
      <div style={{
        width: "100%", maxWidth: 380,
        background: "radial-gradient(ellipse at 30% 20%, #e8d4a8 0%, #d4bc85 40%, #b89965 80%, #8a7040 100%)",
        borderRadius: 6,
        padding: "20px 22px 24px",
        position: "relative",
        boxShadow: "0 0 0 1px #6a5230, 0 10px 40px rgba(0,0,0,0.6), inset 0 0 60px rgba(139,94,40,0.2), inset 0 0 120px rgba(90,58,20,0.25)",
        maxHeight: "92vh",
        overflowY: "auto"
      }}>

        <button onClick={handleClose} style={{
          position: "absolute", top: 10, right: 10,
          width: 28, height: 28, borderRadius: "50%",
          background: "rgba(90,58,20,0.2)", color: "#5a3a1a",
          border: "1px solid rgba(90,58,20,0.35)",
          fontSize: 14, cursor: "pointer", zIndex: 10,
          display: "flex", alignItems: "center", justifyContent: "center"
        }}>{"\u00d7"}</button>

        <div className="out" style={{
          textAlign: "center", fontSize: 9, letterSpacing: 3.5,
          color: "#6a4520", textTransform: "uppercase",
          margin: "4px 0 4px", fontWeight: 700
        }}>{moment.chapter + " \u00b7 " + moment.chapterTitle}</div>

        <div style={{display: "flex", alignItems: "center", justifyContent: "center", gap: 10, marginBottom: 14}}>
          <div style={{ flex: 1, maxWidth: 80, height: 1, background: "linear-gradient(90deg,transparent,#8a6530 50%,transparent)" }}/>
          <span style={{ color: "#8a6530", fontSize: 10 }}>{"\u2756"}</span>
          <div style={{ flex: 1, maxWidth: 80, height: 1, background: "linear-gradient(90deg,transparent,#8a6530 50%,transparent)" }}/>
        </div>

        {/* Illustration — rectangular frame fade via dual linear-gradient mask
            composited with intersect. Each gradient fades one axis, intersected
            they form a vignette that hugs the 4 rectangular edges instead of
            the old oval ellipse.
            For textOnly moments (no Leonardo image generated yet) we fall back
            to a centred wizard-staff SVG sigil — preserves the parchment frame. */}
        {moment.image
          ?<div style={{
              position: "relative", margin: "0 auto 10px",
              width: "100%", maxWidth: 280, aspectRatio: "1/1",
              WebkitMaskImage: "linear-gradient(to right, transparent 0%, black 22%, black 78%, transparent 100%), linear-gradient(to bottom, transparent 0%, black 22%, black 78%, transparent 100%)",
              maskImage: "linear-gradient(to right, transparent 0%, black 22%, black 78%, transparent 100%), linear-gradient(to bottom, transparent 0%, black 22%, black 78%, transparent 100%)",
              WebkitMaskComposite: "source-in",
              maskComposite: "intersect",
              overflow: "hidden"
            }}>
              <img src={moment.image} alt={moment.title} style={{
                width: "100%", height: "100%", objectFit: "cover",
                mixBlendMode: "multiply",
                filter: "contrast(1.1) brightness(1.02)",
                display: "block"
              }}/>
            </div>
          :<div style={{margin:"0 auto 10px",width:"100%",maxWidth:280,aspectRatio:"1/1",display:"flex",alignItems:"center",justifyContent:"center"}}>
              <GIcon name="wizard-staff" size={120} color="#5a3a1a"/>
            </div>}

        <h2 className="out" style={{
          fontFamily: "'Cinzel',serif", fontWeight: 700, fontSize: 22,
          textAlign: "center", color: "#4a2e14",
          letterSpacing: 3, margin: "6px 0 2px"
        }}>{moment.title.toUpperCase()}</h2>
        <div style={{
          textAlign: "center", fontSize: 11, color: "#8a6530",
          fontStyle: "italic", letterSpacing: 1.5, marginBottom: 14
        }}>{"\u2014 " + moment.subtitle + " \u2014"}</div>

        {/* "His words" box — fixed height sized for 3 lines of subtitle at
            fontSize 14 × lineHeight 1.65 (~69px) + header + padding. Keeps
            the parchment layout stable across subtitles of varying length.
            Text is vertically centered via flex so 1-line and 3-line subtitles
            both sit cleanly in the middle. */}
        <div style={{
          padding: "12px 18px", margin: "0 4px 14px",
          height: 118,
          display: "flex", flexDirection: "column",
          borderTop: "1px solid rgba(90,58,20,0.25)",
          borderBottom: "1px solid rgba(90,58,20,0.25)"
        }}>
          <div className="out" style={{
            fontSize: 8, letterSpacing: 2.5, color: "#8a6530",
            textTransform: "uppercase", marginBottom: 6, textAlign: "center", fontWeight: 700,
            flexShrink: 0
          }}>{"\u25c6 His words \u25c6"}</div>
          <div style={{
            flex: 1, display: "flex", alignItems: "center", justifyContent: "center",
            fontFamily: "Georgia,serif", fontSize: 14, color: "#3a2410",
            lineHeight: 1.65, fontStyle: "italic", textAlign: "center",
            overflow: "hidden"
          }} key={activeSub ? activeSub.from : "init"}>
            <span>{activeSub ? activeSub.text : ""}</span>
          </div>
        </div>

        {!muted && <div style={{display: "flex", alignItems: "center", gap: 10, margin: "0 4px 12px"}}>
          <button onClick={togglePlay} style={{
            width: 34, height: 34, borderRadius: "50%",
            background: "radial-gradient(circle at 30% 30%, #d4943a, #8a5e28)",
            border: "1px solid #5a3a1a",
            display: "flex", alignItems: "center", justifyContent: "center",
            flexShrink: 0, cursor: "pointer",
            boxShadow: "0 2px 4px rgba(0,0,0,0.3)",
            padding: 0
          }}>
            {playing ? (
              <div style={{ display: "flex", gap: 2 }}>
                <div style={{ width: 3, height: 10, background: "#fff" }}/>
                <div style={{ width: 3, height: 10, background: "#fff" }}/>
              </div>
            ) : (
              <div style={{
                width: 0, height: 0,
                borderStyle: "solid", borderWidth: "5px 0 5px 8px",
                borderColor: "transparent transparent transparent #fff",
                marginLeft: 2
              }}/>
            )}
          </button>
          <div style={{ flex: 1, height: 3, background: "rgba(90,58,20,0.3)", borderRadius: 2, overflow: "hidden" }}>
            <div style={{
              height: "100%", width: progressPct + "%",
              background: "linear-gradient(90deg,#8a5e28,#d4943a)", borderRadius: 2
            }}/>
          </div>
          <span className="out" style={{
            fontSize: 10, color: "#6a4520",
            letterSpacing: 1, minWidth: 42, textAlign: "right", fontWeight: 600
          }}>{mmss(currentTime) + " / " + mmss(duration)}</span>
        </div>}

        <div style={{ display: "flex", justifyContent: "space-between", gap: 10, margin: "0 4px" }}>
          <button onClick={handleClose} style={{
            flex: 1, padding: "9px 12px",
            background: "rgba(232,212,168,0.4)",
            border: "1px solid rgba(90,58,20,0.35)",
            borderRadius: 6, color: "#5a3a1a",
            fontFamily: "'Cinzel',serif", fontSize: 10,
            letterSpacing: 2, textTransform: "uppercase",
            cursor: "pointer", fontWeight: 600
          }}>Skip</button>
          <button onClick={handleClose} style={{
            flex: 1, padding: "9px 12px",
            background: "linear-gradient(135deg,#d4943a,#a87028)",
            border: "1px solid #5a3a1a",
            borderRadius: 6, color: "#1a0f04",
            fontFamily: "'Cinzel',serif", fontSize: 10,
            letterSpacing: 2, textTransform: "uppercase",
            cursor: "pointer", fontWeight: 700,
            boxShadow: "inset 0 1px 0 rgba(255,220,150,0.4), 0 2px 0 rgba(90,58,20,0.3)"
          }}>{"Continue \u2192"}</button>
        </div>

        {!muted && <audio ref={audioRef} src={moment.audio} preload="auto"/>}

      </div>

      {/* Fade layer — fades FROM black on mount (key={moment.id} replays the
          animation on every chapter change), and fades TO black when the
          user dismisses (closing=true). pointerEvents remain none so the
          black layer never swallows clicks during its ~500-800ms animation. */}
      {closing ? (
        <div style={{
          position: "absolute", inset: 0,
          background: "#000",
          animation: "narratorFadeToBlack 0.5s ease-in forwards",
          pointerEvents: "none",
          zIndex: 10000
        }}/>
      ) : (
        <div key={"fade-"+(moment.id||"")} style={{
          position: "absolute", inset: 0,
          background: "#000",
          animation: "narratorFadeFromBlack 0.8s ease-out forwards",
          pointerEvents: "none",
          zIndex: 10000
        }}/>
      )}

    </div>
  );
}





// ─── TUTORIAL TOUR — supprimé 2026-05-03 (absorbé par Verdict d'Aldric) ───
// Le tour 3 popups (Daily / Progress & League / Train) a été absorbé dans le
// Verdict d'Aldric (cf. NARRATOR_MOMENTS.verdict dans src/narrator.js, qui
// présente désormais "cinq lames rapides" → "Salle d'Entraînement" → "Ligue").
// Le booléen u.tutorialPending et la colonne Supabase students.tutorial_pending
// restent en place, lecture/écriture inertes dans supaToLocal/save/fresh, pour
// éviter une migration BDD destructive. Nettoyage différé si le concept ne ressort pas.





// ─── ONBOARDING ───
function Onboard(p){
var[step,sSt]=useState("name");
  var[name,sN]=useState("");
  var[ci,sC]=useState(0);var[sel,sS]=useState(-1);var[sc,sSc]=useState(0);var[ph,sP]=useState("q");
  var[scanSec,setScanSec]=useState(0);var[scanScores,setScanScores]=useState({grammar:0,vocab:0,reading:0,listening:0});var[scanPhase,setScanPhase]=useState("intro");
  // ─── Battle Scan V2 — CAT-light state ───
  var[currentQ,setCurrentQ]=useState(null);            // {item, lvl, sectionId, ...sectionMeta} from controller.next()
  var[sectionResults,setSectionResults]=useState({}); // {grammar:{acc, byMacro,...}, vocab:{...}, ...} from .score()
  var[audioBusy,setAudioBusy]=useState(false);        // listening play button enable/disable
  var[audioStep,setAudioStep]=useState(-1);            // P1 statement index currently playing (0-3) or -1
  var ctrlRef=useRef(null);                            // active section controller (mutable, no rerenders)
  // Mount listening audio session lifecycle
  useEffect(function(){resumeAudioSession();return function(){stopListenAudio();};},[]);
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
  // SECURITY (2026-09-11) — confinement cross-promo : detectMode=true quand on arrive
  // sur l'écran classcode depuis l'écran name (détection "welcome back"). Il déclenche
  // la recherche de compte SCOPÉE au class_code saisi (lookupName(name,cc)). false =
  // chemin d'inscription (choix de cohorte après emailPassword) → va direct à consent.
  // Sans ce scope, lookupName remontait tous les homonymes TOUTES promos et le picker
  // affichait même leur class_code (incident Hugo : accès à une promo CESI non sienne).
  var[detectMode,setDetectMode]=useState(false);
  // P2 Phase A (2026-09-11) — flux mot de passe (email synthétique).
  // pwdMode : "new" (nouvel élève) | "claim" (compte legacy à sécuriser). pwdTarget : la
  // ligne visée au retour {name, class_code, password_set_at}. studentPwdSet : vrai quand le
  // nouvel élève a posé son mot de passe → enterArena passe authBind à onboard().
  var[pwdMode,setPwdMode]=useState("new");
  var[pwdTarget,setPwdTarget]=useState(null);
  var[studentPwdSet,setStudentPwdSet]=useState(false);
  // Filet auto-réparateur : si signUpStudent échoue "compte déjà existant" (ex. binding
  // password_set_at raté à la création, ou pré-claim par un tiers), on propose "me connecter"
  // → enterPassword, au lieu de laisser l'user coincé sur l'écran claim.
  var[pwdExistsDup,setPwdExistsDup]=useState(false);
  // typedName — ce que l'user a RÉELLEMENT tapé, avant que lookupName n'écrase `name`
  // avec la casse stockée en base (nécessaire pour recover, cf. commentaire dans
  // lookupName). Sert à restaurer sa saisie s'il repart en création de compte : sans
  // ça, un nouveau "Romain" s'inscrirait sous la casse du "romain" existant.
  var[typedName,setTypedName]=useState("");
  // PIN state removed 2026-04-20 — auth is now handled via Supabase magic link
  var[pendingNav,setPendingNav]=useState(null);
  var[emailInput,setEmailInput]=useState("");var[emailBusy,setEmailBusy]=useState(false);var[emailErr,setEmailErr]=useState("");var[emailSent,setEmailSent]=useState(false);
  // ── Phase 2 — email+password signup state (cohabite avec emailLogin/emailPrompt magic link) ──
  // pwd1/pwd2 : nouveau mot de passe + confirmation
  // pwdBusy/pwdErr : état appel signUpWithPassword
  // pwdSetupDone : true après signup OK → finishOnb() skip l'écran emailPrompt magic link
  // pwdEmailDup : true si Supabase refuse l'email (déjà pris) → affiche bouton "Me connecter"
  var[pwd1,setPwd1]=useState("");var[pwd2,setPwd2]=useState("");var[pwdBusy,setPwdBusy]=useState(false);var[pwdErr,setPwdErr]=useState("");
  var[pwdSetupDone,setPwdSetupDone]=useState(false);var[pwdEmailDup,setPwdEmailDup]=useState(false);
  // Phase 2 commit 3 (2026-04-27) : useEffect pollEmailConfirmation supprimé avec
  // le step emailPrompt. Plus de magic link post-onboarding → plus de poll nécessaire.
  function goToInstallStep(firstNav){
    // 2026-06-30: the former push opt-in screen is now a home-screen INSTALL prompt.
    // Push opt-in moved out of onboarding (better triggered live at launch, or from
    // Profile). No longer gated on the Push API — installing matters for fullscreen
    // too, and on iOS it's the prerequisite for push. Skip only when already running
    // as an installed PWA (nothing to install), going straight to the langBridge.
    // Reverting this to an auto Notification.requestPermission() risks a premature
    // hard-deny that's hard to recover from on iOS/Android.
    setPendingNav(firstNav||null);
    if(isStandalonePWA()){sSt("langBridge");return;}
    sSt("install");
  }

  async function lookupName(n,cc){
    setLookingUp(true);
    setTypedName((n||"").trim());
    try{
      // Ensure anon auth exists before querying
      var sess=await supabase.auth.getSession();
      if(!sess.data.session){
        var authRes=await supabase.auth.signInAnonymously();
        if(!authRes.data.user){setLookingUp(false);sSt("classcode");return;}
      }
      // Fetch students and filter by normalized name (accent + case insensitive).
      // SECURITY (2026-09-11) — la requête est SCOPÉE au class_code (cc) : on ne remonte
      // que les comptes de la promo dont l'user a fourni le code. Sans ce .eq, le picker
      // exposait les homonymes de toutes les promos + leur class_code (incident Hugo).
      // B3 (2026-09-14) — la RPC fait la comparaison de nom normalisé CÔTÉ SERVEUR et ne
      // renvoie que les lignes correspondantes, avec les seules colonnes du routage.
      // Elle remplace DEUX requêtes : le `ilike` scopé, et surtout son fallback qui
      // rapatriait la cohorte entière — donc le `password_set_at` de tous les camarades,
      // soit « qui n'a pas encore sécurisé son compte ». Le scoping class_code de
      // l'Étape 0 est conservé (la RPC prend cc en paramètre et filtre dessus) : ne
      // jamais l'enlever, c'est ce qui a fermé la fuite cross-promo (incident Hugo).
      // norm_name() en SQL est au moins aussi permissif que normalizeName() en JS, et on
      // re-filtre ici : la RPC ne peut donc ramener que trop de lignes, jamais trop peu.
      var norm=normalizeName(n);
      var res=await supabase.rpc('find_students_by_name',{p_name:n,p_class_code:cc});
      console.warn("[LOOKUP]",n,"→ rows:",(res.data||[]).length,"error:",res.error?res.error.message:"none");
      var matches=(res.data||[]).filter(function(s){return normalizeName(s.name)===norm;});
      console.warn("[LOOKUP] matches filtered:",matches.length);
      // P2 Phase A (2026-09-11) — routing par mot de passe (email synthétique).
      // 0 match → nouvel élève (poser un mot de passe). 1 match → password_set_at ? "entre ton
      // mot de passe" : "sécurise ton compte" (claim). >1 (ne devrait plus arriver : 0 collision
      // + index unique) → picker legacy de désambiguïsation.
      setPwd1("");setPwd2("");setPwdErr("");setPwdExistsDup(false);
      if(matches.length===0){
        console.warn("[LOOKUP] no match in cohort → setPassword (new)");
        setFoundAccounts([]);
        setDetectMode(false); // nouvel inscrit : quitte le mode détection
        setPwdMode("new");
        sSt("setPassword");
      } else if(matches.length===1){
        // Cas normal. Casing DB nécessaire pour synthEmail + recover.
        var m=matches[0];
        sN(m.name);
        setPwdTarget({name:m.name,class_code:m.class_code,password_set_at:m.password_set_at||null});
        if(m.password_set_at){
          console.warn("[LOOKUP] 1 match, secured → enterPassword");
          sSt("enterPassword");
        }else{
          console.warn("[LOOKUP] 1 match, legacy (no pwd) → claim");
          setPwdMode("claim");
          sSt("setPassword");
        }
      } else {
        // >1 homonyme même promo — filet : picker de désambiguïsation (legacy recover()).
        sN(matches[0].name);
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
            lastActive:s.last_active||null,joinedAt:s.joined_at||null,
            groupName:g?g.name:(s.class_code==="visitor"?"Visitor / Free Access":s.class_code),
            groupType:g?g.type:"visitor",
            typeIcon:g?(g.type==="school"?"🏫":g.type==="pro"?"💼":"🌍"):"🌍"};
        });
        console.warn("[LOOKUP] >1 → recognize picker, accounts:",accounts.length);
        setFoundAccounts(accounts);
        sSt("recognize");
      }
    }catch(e){
      console.warn("[LOOKUP] outer catch → setPassword (new), err:",e&&e.message);
      setDetectMode(false);
      setPwdMode("new");
      sSt("setPassword");
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

  // ─── Battle Scan V2 helpers (CAT-light) ───
  function startTestV2(){
    sSt("scan");
    setScanSec(0);
    setScanScores({grammar:0,vocab:0,reading:0,listening:0});
    setSectionResults({});
    // One-time narrative gate before the per-section intros. Sections 2-4 still
    // land on "intro" (see nextSectionV2), so this welcome screen never repeats.
    setScanPhase("welcome");
    setCurrentQ(null);
    sS(-1);
    ctrlRef.current=createCatController(SCAN_SECTION_ORDER[0]);
  }
  // Listening audio dispatcher — called from "Listen" button or auto on phase enter.
  // P1: plays 4 statements sequentially. P2: plays only the question audio.
  // P3/P4: plays the full conversation/talk in one file.
  async function playListeningClip(curQ){
    if(!curQ||curQ.sectionId!=="listening")return;
    setAudioBusy(true);
    try{
      var part=curQ.part;var refId=curQ.refId;
      if(part==="p1"){
        for(var i=0;i<4;i++){
          setAudioStep(i);
          await playAudioFile("/audio/p1/"+refId+"_"+i+".mp3");
          if(isAudioAborted())break;
        }
        setAudioStep(-1);
      }else if(part==="p2"){
        await playAudioFile("/audio/p2/"+refId+"_q.mp3");
      }else if(part==="p3"){
        await playAudioFile("/audio/p3/"+refId+".mp3");
      }else if(part==="p4"){
        await playAudioFile("/audio/p4/"+refId+".mp3");
      }
    }catch(e){console.warn("[scan-v2] audio:",e&&e.message);}
    setAudioBusy(false);
  }
  function beginSectionV2(){
    var ctrl=ctrlRef.current;if(!ctrl)return;
    var q=ctrl.next();
    setCurrentQ(q);
    setScanPhase("q");
    sS(-1);
    if(q&&q.sectionId==="listening"){setTimeout(function(){playListeningClip(q);},400);}
  }
  // Resolve: did the user pick the correct answer for the current Q?
  function isCorrectFor(curQ,pickIdx){
    if(!curQ)return false;
    if(curQ.sectionId==="listening"){
      var src=curQ.item;
      if(curQ.part==="p1"||curQ.part==="p2"){return pickIdx===src.c;}
      if(curQ.part==="p3"||curQ.part==="p4"){return pickIdx===src.qs[curQ.qIdx].c;}
      return false;
    }
    return pickIdx===curQ.item.c;
  }
  function answerScanQ(pickIdx){
    var curQ=currentQ;if(!curQ)return;
    sS(pickIdx);
    var correct=isCorrectFor(curQ,pickIdx);
    if(correct){try{playCorrect();}catch(e){}}else{try{playWrong();}catch(e){}}
    var ctrl=ctrlRef.current;if(ctrl)ctrl.record(correct);
    setScanPhase("fb");
  }
  function advanceScanV2(){
    stopListenAudio();stopTts();
    var ctrl=ctrlRef.current;if(!ctrl)return;
    var nq=ctrl.next();
    if(nq){
      setCurrentQ(nq);
      sS(-1);
      setScanPhase("q");
      if(nq.sectionId==="listening"){setTimeout(function(){resumeAudioSession();playListeningClip(nq);},400);}
      return;
    }
    // Section finished — collect score, fold into legacy scanScores, advance.
    var secId=SCAN_SECTION_ORDER[scanSec];
    var res=ctrl.score();
    var nextResults=Object.assign({},sectionResults);nextResults[secId]=res;
    setSectionResults(nextResults);
    var nextScores=Object.assign({},scanScores);nextScores[secId]=Math.round(res.acc*5);setScanScores(nextScores);
    setScanPhase("done");
  }
  function nextSectionV2(){
    stopListenAudio();stopTts();
    var nextIdx=scanSec+1;
    if(nextIdx>=SCAN_SECTION_ORDER.length){
      // All sections done — switch to results.
      sSt("results");
      return;
    }
    setScanSec(nextIdx);
    ctrlRef.current=createCatController(SCAN_SECTION_ORDER[nextIdx]);
    setCurrentQ(null);
    sS(-1);
    setScanPhase("intro");
    resumeAudioSession();
  }

  // ─ Name entry ─
  if(step==="name")return(
    <div className="app onboard-shell" style={{display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",minHeight:"100vh",padding:32,textAlign:"center"}}>
      <div style={{animation:"fadeIn .8s ease-out"}}>
        <div style={{marginBottom:16,display:"flex",justifyContent:"center"}}><BrandMark size={72}/></div>
        <h1 className="out" style={{fontWeight:900,fontSize:36,background:"linear-gradient(135deg,var(--cx-hex),#8b5e83)",WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent",marginBottom:8}}>VERSE ARENA</h1>
        <p style={{color:"var(--t2)",fontSize:15,marginBottom:40,lineHeight:1.5}}>Train smarter. Climb the ranks.<br/>Conquer the TOEIC.</p>
        <div style={{marginBottom:20,textAlign:"left"}}>
          <label className="out" style={{fontSize:12,fontWeight:600,color:"var(--t2)",textTransform:"uppercase",letterSpacing:1,marginBottom:8,display:"block"}}>Your arena name</label>
          <input type="text" value={name} onChange={function(e){sN(e.target.value);}} placeholder="Enter your name..."
            style={{width:"100%",padding:"14px 18px",background:"var(--bg2)",border:"1px solid var(--bdr)",borderRadius:12,color:"var(--t1)",fontSize:16,fontFamily:"'DM Sans',sans-serif",outline:"none"}}/>
        </div>
        <button className="btn1" onClick={function(){if(name.trim()&&!lookingUp){setDetectMode(true);setTypedName(name.trim());sSt("classcode");}}} disabled={lookingUp}
          style={{opacity:name.trim()&&!lookingUp?1:.4,pointerEvents:name.trim()&&!lookingUp?"auto":"none",fontSize:18,padding:"16px 32px"}}>{lookingUp?"Checking...":"Next"}</button>
        <div style={{display:"flex",justifyContent:"center",gap:16,marginTop:20}}>
          <button onClick={function(){sSt("emailLogin");setEmailInput("");setEmailErr("");setEmailSent(false);}} style={{background:"none",border:"none",color:"var(--cyan)",fontSize:12,cursor:"pointer",fontFamily:"'DM Sans',sans-serif",textDecoration:"underline"}}>{"D\u00e9j\u00e0 un compte ? Me connecter"}</button>
          <button onClick={function(){sSt("teacher");}} style={{background:"none",border:"none",color:"var(--t3)",fontSize:12,cursor:"pointer",fontFamily:"'DM Sans',sans-serif"}}>Teacher access</button>
        </div>
      </div>
    </div>);

  // ─ Email + Password signup (Phase 2 — refonte 2026-04-27) ─
  // Vient APRÈS l'écran name pour les users non reconnus (lookupName → 0 match).
  // Propose 2 chemins : signup avec email+password, ou "Continuer sans compte" (visitor).
  // Cohabite avec emailLogin/emailPrompt pendant la transition (Phase 4 cleanup).
  if(step==="emailPassword"){
    async function doSignUp(){
      if(pwdBusy)return;
      var e=(emailInput||"").trim().toLowerCase();
      if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e)){setPwdErr("Adresse email invalide");return;}
      if((pwd1||"").length<8){setPwdErr("Mot de passe trop court (8 caractères minimum)");return;}
      if(pwd1!==pwd2){setPwdErr("Les deux mots de passe ne correspondent pas");return;}
      setPwdErr("");setPwdEmailDup(false);setPwdBusy(true);
      try{
        await signUpWithPassword(e,pwd1,{name:name.trim()});
        setPwdSetupDone(true);
        // Email saisi reste dans emailInput au cas où d'autres branches le lisent.
        // Le class_code a déjà été saisi et validé AVANT la détection (écran classcode
        // en amont) → on va direct à consent, on ne le redemande pas. Fallback classcode
        // si jamais il est vide (chemin inattendu).
        sSt(classCode?"consent":"classcode");
      }catch(err){
        var msg=((err&&err.message)||"").toLowerCase();
        if(msg.includes("already")||msg.includes("registered")||msg.includes("exists")||msg.includes("duplicate")){
          setPwdErr("Cet email est déjà utilisé.");
          setPwdEmailDup(true);
        }else{
          setPwdErr((err&&err.message)||"Erreur");
        }
      }finally{setPwdBusy(false);}
    }
    function continueAsVisitor(){
      // Skip email+password : mode visitor pur, pas de compte cross-device.
      // Va direct à consent (pas classcode) puisque le choix est déjà fait.
      setClassCode("visitor");
      setPwdErr("");setPwdEmailDup(false);
      sSt("consent");
    }
    return(
    <div className="app onboard-shell" style={{minHeight:"100vh",padding:"24px 16px",position:"relative"}}>
      <button className="back-btn" onClick={function(){sSt("name");setPwdErr("");setPwdEmailDup(false);}} style={{position:"absolute",top:16,left:16,marginBottom:0}}>{"←"} Back</button>
      <div style={{maxWidth:420,margin:"60px auto 0"}}>
        <div style={{textAlign:"center",marginBottom:24}}>
          <div style={{marginBottom:12,display:"flex",justifyContent:"center"}}><GIcon name="castle" size={48} color="var(--cyan)"/></div>
          <h1 className="out" style={{fontWeight:800,fontSize:24,marginBottom:8,color:"var(--gold)"}}>{"Crée ton compte"}</h1>
          <p style={{color:"var(--t2)",fontSize:13,lineHeight:1.5}}>{"Email et mot de passe pour sauvegarder ton avancée et te reconnecter sur tous tes appareils."}</p>
        </div>
        <input type="email" value={emailInput} onChange={function(e){setEmailInput(e.target.value);setPwdEmailDup(false);setPwdErr("");}}
          placeholder="ton@email.com" autoComplete="email" autoCapitalize="off" autoCorrect="off"
          style={{width:"100%",padding:"14px 16px",fontSize:14,marginBottom:10,background:"var(--bg2)",border:"1px solid var(--bdr)",borderRadius:10,color:"var(--t1)",fontFamily:"'DM Sans',sans-serif",boxSizing:"border-box",outline:"none"}}/>
        <input type="password" value={pwd1} onChange={function(e){setPwd1(e.target.value);}}
          placeholder="Mot de passe (8 caractères min.)" autoComplete="new-password"
          style={{width:"100%",padding:"14px 16px",fontSize:14,marginBottom:10,background:"var(--bg2)",border:"1px solid var(--bdr)",borderRadius:10,color:"var(--t1)",fontFamily:"'DM Sans',sans-serif",boxSizing:"border-box",outline:"none"}}/>
        <input type="password" value={pwd2} onChange={function(e){setPwd2(e.target.value);}}
          placeholder="Confirme le mot de passe" autoComplete="new-password"
          style={{width:"100%",padding:"14px 16px",fontSize:14,marginBottom:14,background:"var(--bg2)",border:"1px solid var(--bdr)",borderRadius:10,color:"var(--t1)",fontFamily:"'DM Sans',sans-serif",boxSizing:"border-box",outline:"none"}}/>
        {pwdErr&&<div style={{color:"var(--red)",fontSize:13,marginBottom:12,textAlign:"center"}}>{pwdErr}</div>}
        {pwdEmailDup&&<button className="btn2" onClick={function(){sSt("emailLogin");setEmailErr("");setEmailSent(false);setPwdErr("");setPwdEmailDup(false);}}
          style={{width:"100%",fontSize:13,padding:"11px 16px",marginBottom:10,borderColor:"rgba(var(--cx),.25)",color:"var(--cyan)"}}>
          {"Me connecter avec cet email"}
        </button>}
        <button className="btn1" onClick={doSignUp} disabled={pwdBusy}
          style={{width:"100%",fontSize:14,padding:"13px 20px",background:"linear-gradient(135deg,#f0c850,#d4943a)",color:"#1a1610",fontWeight:700,opacity:pwdBusy?.6:1}}>
          {pwdBusy?"Création...":"Continuer"}
        </button>
        <div style={{marginTop:24,paddingTop:16,borderTop:"1px solid var(--bdr)",textAlign:"center"}}>
          <p style={{color:"var(--t3)",fontSize:11,marginBottom:10,lineHeight:1.4}}>{"Tu veux juste essayer ? Tes stats resteront sur cet appareil."}</p>
          <button className="btn2" onClick={continueAsVisitor}
            style={{width:"100%",fontSize:13,padding:"11px 16px",borderColor:"var(--bdr)",color:"var(--t3)"}}>
            {"Continuer sans compte"}
          </button>
        </div>
      </div>
    </div>);
  }

  // ─ P2 Phase A (2026-09-11) : entre ton mot de passe (retour, compte sécurisé) ─
  // Atteint depuis lookupName quand la ligne a password_set_at. Login via compte synthétique
  // (signInStudent) puis hydratation via recover(). Filet soft : "continuer sans" → recover legacy.
  if(step==="enterPassword"){
    var epName=(pwdTarget&&pwdTarget.name)||name.trim();
    var epCc=(pwdTarget&&pwdTarget.class_code)||classCode;
    async function doStudentSignIn(){
      if(pwdBusy)return;
      if(!pwd1){setPwdErr("Entre ton mot de passe");return;}
      setPwdErr("");setPwdBusy(true);
      try{
        await signInStudent(epName,epCc,pwd1);
        try{await bindStudentUserId(epName,epCc);}catch(e){console.warn("[pwd] bind caught:",e&&e.message);}
        var ok=await p.recover(epName,epCc);
        if(!ok)setPwdErr("Compte introuvable. Réessaie.");
      }catch(err){
        console.warn("[pwd] signIn failed:",err&&err.message);
        setPwdErr("Mot de passe incorrect.");
      }finally{setPwdBusy(false);}
    }
    async function signInLater(){
      if(pwdBusy)return;setPwdBusy(true);setPwdErr("");
      try{var ok=await p.recover(epName,epCc);if(!ok)setPwdErr("Compte introuvable.");}
      catch(e){setPwdErr("Erreur");}finally{setPwdBusy(false);}
    }
    return(
    <div className="app onboard-shell" style={{minHeight:"100vh",padding:"24px 16px",position:"relative"}}>
      <button className="back-btn" onClick={function(){setPwdErr("");sSt("classcode");}} style={{position:"absolute",top:16,left:16,marginBottom:0}}>{"←"} Back</button>
      <div style={{maxWidth:420,margin:"60px auto 0"}}>
        <div style={{textAlign:"center",marginBottom:24}}>
          <div style={{fontSize:44,marginBottom:10}}>{"👋"}</div>
          <h1 className="out" style={{fontWeight:800,fontSize:24,marginBottom:6,color:"var(--gold)"}}>{"Bon retour, "+epName+" !"}</h1>
          <p style={{color:"var(--t2)",fontSize:13,lineHeight:1.5}}>{"Entre ton mot de passe pour retrouver ta progression"+(classGroupName?" ("+classGroupName+")":"")+"."}</p>
        </div>
        <input type="password" value={pwd1} onChange={function(e){setPwd1(e.target.value);setPwdErr("");}}
          placeholder={"Mot de passe"} autoComplete="current-password"
          onKeyDown={function(e){if(e.key==="Enter")doStudentSignIn();}}
          style={{width:"100%",padding:"14px 16px",fontSize:14,marginBottom:14,background:"var(--bg2)",border:"1px solid var(--bdr)",borderRadius:10,color:"var(--t1)",fontFamily:"'DM Sans',sans-serif",boxSizing:"border-box",outline:"none"}}/>
        {pwdErr&&<div style={{color:"var(--red)",fontSize:13,marginBottom:12,textAlign:"center"}}>{pwdErr}</div>}
        <button className="btn1" onClick={doStudentSignIn} disabled={pwdBusy}
          style={{width:"100%",fontSize:15,padding:"13px 20px",opacity:pwdBusy?.6:1}}>
          {pwdBusy?"Connexion...":"Se connecter"}
        </button>
        <div style={{marginTop:20,textAlign:"center"}}>
          <button onClick={signInLater} disabled={pwdBusy} style={{background:"none",border:"none",color:"var(--t3)",fontSize:12,cursor:"pointer",fontFamily:"'DM Sans',sans-serif",textDecoration:"underline"}}>{"Mot de passe oublié ? Continuer sans pour l'instant"}</button>
        </div>
      </div>
    </div>);
  }

  // ─ P2 Phase A (2026-09-11) : pose un mot de passe (nouvel élève OU claim d'un compte legacy) ─
  // pwdMode="new" → signUpStudent puis onboarding normal (ligne créée avec authBind).
  // pwdMode="claim" → signUpStudent puis bind user_id + password_set_at + recover(). "Plus tard"
  // → recover legacy (migration soft, jusqu'à la date butoir).
  if(step==="setPassword"){
    var spClaim=(pwdMode==="claim");
    async function doStudentSignUp(){
      if(pwdBusy)return;
      if((pwd1||"").length<8){setPwdErr("Mot de passe trop court (8 caractères minimum)");return;}
      if(pwd1!==pwd2){setPwdErr("Les deux mots de passe ne correspondent pas");return;}
      setPwdErr("");setPwdBusy(true);
      var tName=name.trim(),tCc=classCode;
      try{
        await signUpStudent(tName,tCc,pwd1);
        if(spClaim){
          try{await bindStudentUserId(tName,tCc,true);}catch(e){console.warn("[pwd] claim bind caught:",e&&e.message);}
          var ok=await p.recover(tName,tCc);
          if(!ok)setPwdErr("Compte introuvable.");
        }else{
          // Nouvel élève : la ligne naîtra en fin d'onboarding avec user_id + password_set_at.
          setStudentPwdSet(true);
          sSt(classCode?"consent":"classcode");
        }
      }catch(err){
        var msg=((err&&err.message)||"").toLowerCase();
        if(msg.includes("already")||msg.includes("registered")||msg.includes("exists")||msg.includes("duplicate")){
          setPwdErr("Un compte existe déjà pour ce nom dans cette promo — connecte-toi avec ton mot de passe.");
          setPwdExistsDup(true);
        }else{
          setPwdErr((err&&err.message)||"Erreur");
        }
      }finally{setPwdBusy(false);}
    }
    async function claimLater(){
      if(pwdBusy)return;setPwdBusy(true);setPwdErr("");
      try{var ok=await p.recover(name.trim(),classCode);if(!ok)setPwdErr("Compte introuvable.");}
      catch(e){setPwdErr("Erreur");}finally{setPwdBusy(false);}
    }
    return(
    <div className="app onboard-shell" style={{minHeight:"100vh",padding:"24px 16px",position:"relative"}}>
      <button className="back-btn" onClick={function(){setPwdErr("");sSt("classcode");}} style={{position:"absolute",top:16,left:16,marginBottom:0}}>{"←"} Back</button>
      <div style={{maxWidth:420,margin:"60px auto 0"}}>
        <div style={{textAlign:"center",marginBottom:24}}>
          <div style={{marginBottom:12,display:"flex",justifyContent:"center"}}><GIcon name="castle" size={48} color="var(--cyan)"/></div>
          <h1 className="out" style={{fontWeight:800,fontSize:24,marginBottom:8,color:"var(--gold)"}}>{spClaim?("Sécurise ton compte, "+name.trim()):"Choisis ton mot de passe"}</h1>
          <p style={{color:"var(--t2)",fontSize:13,lineHeight:1.5}}>{spClaim?"Choisis un mot de passe pour protéger ta progression et te reconnecter partout.":("Ce mot de passe protège ton compte"+(classGroupName?" ("+classGroupName+")":"")+" et te reconnecte sur tous tes appareils.")}</p>
        </div>
        <input type="password" value={pwd1} onChange={function(e){setPwd1(e.target.value);setPwdErr("");}}
          placeholder="Mot de passe (8 caractères min.)" autoComplete="new-password"
          style={{width:"100%",padding:"14px 16px",fontSize:14,marginBottom:10,background:"var(--bg2)",border:"1px solid var(--bdr)",borderRadius:10,color:"var(--t1)",fontFamily:"'DM Sans',sans-serif",boxSizing:"border-box",outline:"none"}}/>
        <input type="password" value={pwd2} onChange={function(e){setPwd2(e.target.value);setPwdErr("");}}
          placeholder="Confirme le mot de passe" autoComplete="new-password"
          onKeyDown={function(e){if(e.key==="Enter")doStudentSignUp();}}
          style={{width:"100%",padding:"14px 16px",fontSize:14,marginBottom:14,background:"var(--bg2)",border:"1px solid var(--bdr)",borderRadius:10,color:"var(--t1)",fontFamily:"'DM Sans',sans-serif",boxSizing:"border-box",outline:"none"}}/>
        {pwdErr&&<div style={{color:"var(--red)",fontSize:13,marginBottom:12,textAlign:"center"}}>{pwdErr}</div>}
        {pwdExistsDup&&<button className="btn2" onClick={function(){setPwdErr("");setPwdExistsDup(false);setPwd1("");setPwdTarget({name:name.trim(),class_code:classCode,password_set_at:true});sSt("enterPassword");}}
          style={{width:"100%",fontSize:13,padding:"11px 16px",marginBottom:10,borderColor:"rgba(var(--cx),.25)",color:"var(--cyan)"}}>
          {"Me connecter avec mon mot de passe"}
        </button>}
        <button className="btn1" onClick={doStudentSignUp} disabled={pwdBusy}
          style={{width:"100%",fontSize:14,padding:"13px 20px",background:"linear-gradient(135deg,#f0c850,#d4943a)",color:"#1a1610",fontWeight:700,opacity:pwdBusy?.6:1}}>
          {pwdBusy?"...":(spClaim?"Sécuriser mon compte":"Créer mon compte")}
        </button>
        <div style={{marginTop:20,textAlign:"center"}}>
          {/* DATE BUTOIR (2026-09-14) — le lien "Plus tard - continuer sans mot de passe"
              a ete retire : c'etait le filet de la migration souple, et il faisait que
              personne ne migrait (1 compte sur 160 au moment du retrait). Un eleve legacy
              qui revient DOIT desormais choisir un mot de passe ; le claim est de toute
              facon le chemin, sa progression est conservee et il n'est bloque nulle part.
              S'il oublie ensuite ce mot de passe : bouton "Reinitialiser l'acces" cote
              formateur (fiche eleve du dashboard). La fonction claimLater() et recover()
              restent en place le temps de verifier que la migration se passe bien — c'est
              ce qui rend ce retrait revertable d'un seul commit. Elles disparaissent avec
              l'activation de la RLS, en meme temps que recover_student_row. */}
          {spClaim
            ?null
            :<button onClick={function(){setPwdErr("");setPwdTarget({name:name.trim(),class_code:classCode,password_set_at:true});sSt("enterPassword");}} style={{background:"none",border:"none",color:"var(--cyan)",fontSize:12,cursor:"pointer",fontFamily:"'DM Sans',sans-serif",textDecoration:"underline"}}>{"J'ai déjà un mot de passe — me connecter"}</button>}
        </div>
      </div>
    </div>);
  }

  // ─ Email login (cross-device) ─ Phase 1 Session 3 ─
  if(step==="emailLogin"){
    // Phase 2 commit 2 (2026-04-27) : refonte magic link → email + password.
    // Le bouton "Déjà un compte ? Me connecter" du step name envoie ici.
    // 2 actions : (1) login email+password → recoverByEmail → Home, (2) reset mdp.
    // emailSent réutilisé pour signaler "mail de reset envoyé" (pas magic link).
    async function doLogin(){
      if(emailBusy)return;
      var e=(emailInput||"").trim().toLowerCase();
      if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e)){setEmailErr("Adresse email invalide");return;}
      if((pwd1||"").length<1){setEmailErr("Mot de passe requis");return;}
      setEmailErr("");setEmailBusy(true);
      try{
        await signInWithPassword(e,pwd1);
        var ok=await p.recoverByEmail(e);
        if(!ok){
          setEmailErr("Connexion OK mais aucun profil trouvé pour cet email. Contacte ton enseignant.");
          return;
        }
      }catch(err){
        setEmailErr((err&&err.message)||"Erreur");
      }finally{setEmailBusy(false);}
    }
    async function doForgotPassword(){
      if(emailBusy)return;
      var e=(emailInput||"").trim().toLowerCase();
      if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e)){setEmailErr("Saisis d'abord ton email ci-dessus");return;}
      setEmailErr("");setEmailBusy(true);
      try{
        await requestPasswordReset(e);
        setEmailSent(true);
      }catch(err){
        setEmailErr((err&&err.message)||"Erreur");
      }finally{setEmailBusy(false);}
    }
    return(
    <div className="app onboard-shell" style={{display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",minHeight:"100vh",padding:"24px 16px",textAlign:"center"}}>
      <div style={{animation:"fadeIn .6s",width:"100%",maxWidth:380}}>
        <div style={{marginBottom:16,display:"flex",justifyContent:"center"}}>{emailSent?<span style={{fontSize:56,lineHeight:1}}>{"✉️"}</span>:<GIcon name="castle" size={56} color="var(--cyan)"/>}</div>
        <h2 className="out" style={{fontFamily:"'Cinzel',serif",fontWeight:900,fontSize:24,color:"var(--t1)",marginBottom:10}}>
          {emailSent?"Mail envoyé":"Bon retour !"}
        </h2>
        {emailSent?<>
          <p style={{color:"var(--green)",fontSize:14,lineHeight:1.6,marginBottom:20}}>
            {"Lien de réinitialisation envoyé à "+emailInput+". Vérifie ta boîte (et le spam) puis clique le lien pour choisir un nouveau mot de passe."}
          </p>
          <button className="btn2" onClick={function(){setEmailSent(false);setEmailErr("");}}
            style={{fontSize:13,padding:"12px 28px",width:"100%"}}>{"Réessayer la connexion"}</button>
          <button onClick={function(){sSt("name");}} style={{marginTop:16,background:"none",border:"none",color:"var(--t3)",fontSize:12,cursor:"pointer"}}>{"← Retour"}</button>
        </>:<>
          <p style={{color:"var(--t2)",fontSize:14,lineHeight:1.6,marginBottom:20}}>
            {"Saisis ton email et ton mot de passe pour retrouver ton profil."}
          </p>
          <input type="email" value={emailInput} onChange={function(ev){setEmailInput(ev.target.value);setEmailErr("");}} placeholder="ton@email.com" autoComplete="email" disabled={emailBusy}
            style={{width:"100%",padding:"12px 14px",fontSize:14,borderRadius:10,border:"1.5px solid "+(emailErr?"var(--red)":"rgba(var(--cx),.25)"),background:"var(--bg2)",color:"var(--t1)",marginBottom:10,textAlign:"left",fontFamily:"'DM Sans',sans-serif",boxSizing:"border-box"}}/>
          <input type="password" value={pwd1} onChange={function(ev){setPwd1(ev.target.value);setEmailErr("");}} placeholder="Mot de passe" autoComplete="current-password" disabled={emailBusy}
            style={{width:"100%",padding:"12px 14px",fontSize:14,borderRadius:10,border:"1.5px solid "+(emailErr?"var(--red)":"rgba(var(--cx),.25)"),background:"var(--bg2)",color:"var(--t1)",marginBottom:emailErr?4:14,textAlign:"left",fontFamily:"'DM Sans',sans-serif",boxSizing:"border-box"}}/>
          {emailErr&&<div style={{fontSize:11,color:"var(--red)",marginBottom:10,textAlign:"left"}}>{emailErr}</div>}
          <button className="btn1" onClick={doLogin} disabled={emailBusy||!emailInput||!pwd1}
            style={{fontSize:15,padding:"14px 28px",width:"100%",marginBottom:10,opacity:(emailBusy||!emailInput||!pwd1)?0.5:1}}>
            {emailBusy?"…":"Se connecter"}</button>
          <button onClick={doForgotPassword} disabled={emailBusy}
            style={{background:"none",border:"none",color:"var(--cyan)",fontSize:12,cursor:"pointer",fontFamily:"'DM Sans',sans-serif",textDecoration:"underline",marginBottom:14}}>{"Mot de passe oublié ?"}</button>
          <button className="btn2" onClick={function(){sSt("name");setEmailErr("");}} disabled={emailBusy}
            style={{fontSize:13,padding:"12px 28px",width:"100%"}}>{"← Retour"}</button>
        </>}
      </div>
    </div>);
    }

  // ─ Account recognition ─
  if(step==="recognize"){
    // Un prénom trouvé en base ne veut PAS dire "c'est la même personne" : deux promos
    // successives peuvent avoir chacune leur Romain. D'où la formulation neutre — l'ancien
    // "Welcome back, Romain!" poussait l'homonyme à cliquer sur la carte de l'autre, et
    // son premier save() écrasait alors les données de l'étudiant existant.
    function fmtWhen(s){
      if(!s)return null;
      var dt=new Date(s);
      if(isNaN(dt.getTime()))return null;
      return dt.toLocaleDateString("en-GB",{day:"numeric",month:"short",year:"numeric"});
    }
    var multi=foundAccounts.length>1;
    return(
    <div className="app onboard-shell" style={{display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",minHeight:"100vh",padding:32,textAlign:"center"}}>
      <div style={{animation:"fadeIn .5s",width:"100%",maxWidth:380}}>
        <div style={{fontSize:48,marginBottom:12}}>👋</div>
        <h2 className="out" style={{fontWeight:800,fontSize:24,marginBottom:6}}>{multi?"Which account is yours?":"Is this you?"}</h2>
        <p style={{color:"var(--t2)",fontSize:13,marginBottom:24,lineHeight:1.5}}>
          {(multi?"Several accounts already use the name ":"An account already uses the name ")+"“"+name.trim()+"”. Pick your group to continue — or create your own account below."}
        </p>
        <div style={{display:"flex",flexDirection:"column",gap:10,marginBottom:24}}>
          {foundAccounts.map(function(acc){
            var when=fmtWhen(acc.lastActive)||fmtWhen(acc.joinedAt);
            var whenLabel=when?((acc.lastActive?"Last active ":"Joined ")+when):null;
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
                {whenLabel&&<div style={{fontSize:10,color:"var(--t3)",marginTop:2}}>{whenLabel}</div>}
              </div>
              <div style={{color:"var(--cyan)",fontSize:16}}>→</div>
            </button>);
          })}
        </div>
        <div style={{position:"relative",margin:"16px 0",display:"flex",alignItems:"center",gap:12}}>
          <div style={{flex:1,height:1,background:"var(--bdr)"}}/>
          <span style={{fontSize:11,color:"var(--t3)",textTransform:"uppercase",letterSpacing:1}} className="out">none of these?</span>
          <div style={{flex:1,height:1,background:"var(--bdr)"}}/>
        </div>
        {/* Route vers emailPassword (et non classcode) : l'homonyme est un nouvel user
            comme les autres, il doit se voir proposer email+mot de passe pour le
            cross-device. sN(typedName) restaure SA casse, écrasée par lookupName. */}
        <button className="btn2" onClick={function(){setFoundAccounts([]);setDetectMode(false);if(typedName)sN(typedName);sSt("emailPassword");}}
          style={{width:"100%",fontSize:14,padding:"12px 24px",borderColor:"rgba(var(--cx),.35)",color:"var(--cyan)"}}>Not me — create my own account</button>
        <button onClick={function(){sSt("name");}} style={{marginTop:16,background:"none",border:"none",color:"var(--t3)",fontSize:13,cursor:"pointer"}}>← Back</button>
      </div>
    </div>);
  }

  // ─ Class code selection ─
  if(step==="classcode")return(
    <div className="app onboard-shell" style={{display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",minHeight:"100vh",padding:32,textAlign:"center"}}>
      <div style={{animation:"fadeIn .5s"}}>
        <div style={{fontSize:48,marginBottom:16}}>🏫</div>
        <h2 className="out" style={{fontWeight:800,fontSize:24,marginBottom:8}}>Join a Group</h2>
        <p style={{color:"var(--t2)",fontSize:13,marginBottom:24,lineHeight:1.5}}>Enter the class code given by your teacher to unlock all modules, or discover Verse Arena for free.</p>
        <div style={{marginBottom:16,textAlign:"left"}}>
          <label className="out" style={{fontSize:12,fontWeight:600,color:"var(--t2)",textTransform:"uppercase",letterSpacing:1,marginBottom:8,display:"block"}}>Class code</label>
          <input type="text" value={classCode} onChange={function(e){var v=e.target.value.toLowerCase().replace(/\s/g,'');setClassCode(v);setClassValid(null);setClassGroupName("");}} onBlur={function(){checkGroupCode(classCode);}} placeholder="Code from your teacher"
            style={{width:"100%",padding:"14px 18px",background:"var(--bg2)",border:"1px solid "+(classValid===true?"var(--green)":classValid===false?"var(--red)":"var(--bdr)"),borderRadius:12,color:"var(--t1)",fontSize:16,fontFamily:"'DM Sans',sans-serif",outline:"none",transition:"border .2s"}}/>
          {classChecking&&<p style={{fontSize:11,color:"var(--t3)",marginTop:6}}>Checking...</p>}
          {classValid===true&&<p style={{fontSize:12,color:"var(--green)",marginTop:6,fontWeight:600}}>✓ {classGroupName}</p>}
          {classValid===false&&<p style={{fontSize:12,color:"var(--red)",marginTop:6}}>Code not found. Check with your teacher.</p>}
        </div>
        <button className="btn1" onClick={function(){if(!classValid)return;if(detectMode){lookupName(name.trim(),classCode);}else{sSt("consent");}}}
          style={{opacity:classValid?1:.4,pointerEvents:classValid?"auto":"none",fontSize:16,padding:"14px 28px",marginBottom:12}}>{lookingUp?"Checking...":"Next"}</button>
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
        <div style={{marginBottom:16,display:"flex",justifyContent:"center"}}><GIcon name="templar-shield" size={48} color="var(--cyan)"/></div>
        <h2 className="out" style={{fontWeight:800,fontSize:22,marginBottom:8}}>{"Protection de vos donn\u00e9es"}</h2>
        <p style={{color:"var(--t2)",fontSize:13,marginBottom:20,lineHeight:1.6}}>{"Avant de commencer, voici comment Verse Arena utilise vos donn\u00e9es :"}</p>
        <div style={{textAlign:"left",padding:"16px 18px",background:"var(--bg2)",border:"1px solid var(--bdr)",borderRadius:14,marginBottom:20}}>
          <div style={{display:"flex",flexDirection:"column",gap:12}}>
            <div style={{display:"flex",gap:10,alignItems:"flex-start"}}>
              <span style={{flexShrink:0,marginTop:1}}><GIcon name="stone-tablet" size={20} color="var(--cyan)"/></span>
              <div><div className="out" style={{fontWeight:700,fontSize:13,color:"var(--t1)",marginBottom:2}}>{"Donn\u00e9es collect\u00e9es"}</div>
              {/* La mention "Aucun e-mail, aucun mot de passe" datait d'avant la Phase A
                  (identit\u00e9 par mot de passe, 2026-09-11). Elle est rest\u00e9e affich\u00e9e sur
                  l'\u00e9cran QUI SUIT la saisie du mot de passe. Cet \u00e9cran est un consentement
                  RGPD : toute \u00e9volution du mod\u00e8le d'identit\u00e9 doit \u00eatre r\u00e9percut\u00e9e ICI,
                  sinon on collecte une donn\u00e9e en affirmant le contraire. */}
              <p style={{fontSize:12,color:"var(--t2)",margin:0,lineHeight:1.5}}>{"Votre pr\u00e9nom, code classe, scores, progression, temps d\u2019entra\u00eenement, et le mot de passe que vous choisissez \u2014 stock\u00e9 chiffr\u00e9, jamais lisible, ni par nous ni par votre formateur. Aucune adresse e-mail n\u2019est requise."}</p></div>
            </div>
            <div style={{display:"flex",gap:10,alignItems:"flex-start"}}>
              <span style={{flexShrink:0,marginTop:1}}><GIcon name="bullseye" size={20} color="var(--cyan)"/></span>
              <div><div className="out" style={{fontWeight:700,fontSize:13,color:"var(--t1)",marginBottom:2}}>{"Finalit\u00e9"}</div>
              <p style={{fontSize:12,color:"var(--t2)",margin:0,lineHeight:1.5}}>{"Suivi p\u00e9dagogique, classements, et personnalisation de l\u2019entra\u00eenement. Donn\u00e9es accessibles \u00e0 votre formateur."}</p></div>
            </div>
            <div style={{display:"flex",gap:10,alignItems:"flex-start"}}>
              <span style={{flexShrink:0,marginTop:1}}><GIcon name="scales" size={20} color="var(--cyan)"/></span>
              <div><div className="out" style={{fontWeight:700,fontSize:13,color:"var(--t1)",marginBottom:2}}>{"Vos droits"}</div>
              <p style={{fontSize:12,color:"var(--t2)",margin:0,lineHeight:1.5}}>{"Vous pouvez \u00e0 tout moment exporter, modifier ou supprimer vos donn\u00e9es depuis votre profil."}</p></div>
            </div>
            <div style={{display:"flex",gap:10,alignItems:"flex-start"}}>
              <span style={{flexShrink:0,marginTop:1}}><GIcon name="world" size={20} color="var(--cyan)"/></span>
              <div><div className="out" style={{fontWeight:700,fontSize:13,color:"var(--t1)",marginBottom:2}}>{"H\u00e9bergement"}</div>
              <p style={{fontSize:12,color:"var(--t2)",margin:0,lineHeight:1.5}}>{"Donn\u00e9es stock\u00e9es chez Supabase (UE/US) et Vercel. Aucune revente \u00e0 des tiers."}</p></div>
            </div>
          </div>
        </div>
        <button className="btn1" onClick={function(){startTestV2();}}
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
        }}><GIcon name="padlock" size={14} color="var(--cyan)" style={{marginRight:6,verticalAlign:"-2px"}}/>Unlock with biometrics</button>}
        {bioAvail&&bioRegistered&&<div style={{fontSize:12,color:"var(--t3)",marginBottom:16}}>or enter code manually</div>}
        <div style={{marginBottom:20,textAlign:"left"}}>
          <label className="out" style={{fontSize:12,fontWeight:600,color:"var(--t2)",textTransform:"uppercase",letterSpacing:1,marginBottom:8,display:"block"}}>Access code</label>
          <input type="password" value={teacherCode} onChange={function(e){sTC(e.target.value);}} placeholder="Enter teacher code..."
            style={{width:"100%",padding:"14px 18px",background:"var(--bg2)",border:"1px solid var(--bdr)",borderRadius:12,color:"var(--t1)",fontSize:16,fontFamily:"'DM Sans',sans-serif",outline:"none"}}/>
        </div>
        <button className="btn1" onClick={async function(){
          if(!teacherCode||teacherChecking)return;
          setTeacherChecking(true);setTeacherErr(false);
          // B4 : la validation se fait côté serveur (teacherAuth → RPC teacher_groups).
          var r=await teacherAuth(teacherCode);
          setTeacherChecking(false);
          if(!r.ok){setTeacherErr(true);return;}
          setDashSession(teacherCode,r.role);
          if(r.groups.length){try{localStorage.setItem('toeic-dash-group',r.groups[0].code);}catch(e){console.warn("[teacher] group store failed:",e&&e.message);}}
          p.goTeacher();
        }} style={{opacity:teacherCode&&!teacherChecking?1:.4,pointerEvents:teacherCode&&!teacherChecking?"auto":"none"}}>
          {teacherChecking?"V\u00e9rification...":"Access Dashboard"}
        </button>
        {teacherErr&&<p style={{color:"var(--red)",fontSize:12,marginTop:8}}>Invalid code</p>}
        <button onClick={function(){sSt("name");}} style={{marginTop:16,background:"none",border:"none",color:"var(--t3)",fontSize:13,cursor:"pointer"}}>Back to student login</button>
      </div>
    </div>);

  // (PIN steps removed 2026-04-20 — replaced by magic link auth. See auth.js.)

  // ─ Battle Report (V2 — scan-v2 phase E) ─
  if(step==="results"){
    // Build the V2 result from sectionResults via scanEngine.computeScanResult().
    // Falls back to V1 scanScores integers if sectionResults is empty (defensive).
    var hasV2=sectionResults&&sectionResults.grammar&&sectionResults.vocab&&sectionResults.reading&&sectionResults.listening;
    var rep=hasV2?computeScanResult(sectionResults):null;
    var toeicEst=rep?rep.toeic:Math.round((200+((scanScores.grammar+scanScores.vocab+scanScores.reading+scanScores.listening)/20)*790)/5)*5;
    var tierLabel=rep?rep.tier:"Recruit";
    var sec={grammar:rep?rep.sections.grammar:scanScores.grammar*20,vocab:rep?rep.sections.vocab:scanScores.vocab*20,reading:rep?rep.sections.reading:scanScores.reading*20,listening:rep?rep.sections.listening:scanScores.listening*20};
    var grammarMacros=(rep&&rep.grammarMacros)||{};
    var listeningByPart=(rep&&rep.listeningByPart)||{};
    var readingByPart=(rep&&rep.readingByPart)||{};

    // Pick weakest section
    var statOrder=["grammar","vocab","reading","listening"];
    var statMeta={
      grammar:{icon:"crossed-swords",arena:"Blade Precision",color:"#d4943a"},
      vocab:{icon:"spell-book",arena:"Arcane Lore",color:"#8b5cf6"},
      reading:{icon:"eye-target",arena:"Tactical Sight",color:"#22c55e"},
      listening:{icon:"public-speaker",arena:"Battle Sense",color:"#3b82f6"}
    };
    var weakestSec=statOrder.reduce(function(a,b){return sec[a]<=sec[b]?a:b;});

    // First Quest: pick a sensible module from the weakest section.
    // For grammar, pick the weakest macro and aim Drill (which uses pickAdaptive on macros).
    // For listening, pick the weakest part. For reading, prefer P7 (broader). For vocab, tavern.
    function pickFirstQuest(){
      if(weakestSec==="grammar"){
        var macroLabel={verbs:"Verbs",linking:"Linking",forms:"Word Forms",reference:"References"};
        var weakMacro=null,minAcc=2;
        Object.keys(grammarMacros).forEach(function(k){if(grammarMacros[k]<minAcc){minAcc=grammarMacros[k];weakMacro=k;}});
        // Linking macro has a dedicated module (Bridge Forge) — route there specifically.
        if(weakMacro==="linking")return{mod:"bforge",icon:"stone-bridge",label:"Linking Bridge",msg:"Your logical links need sharpening. Bridge Forge tests connector choice in real TOEIC contexts."};
        return{mod:"drill",icon:"crossed-swords",label:"Part 5 Drill"+(weakMacro?" — "+macroLabel[weakMacro]:""),msg:"Your grammar foundations need sharpening. Drill weights toward your weakest macro automatically."};
      }
      if(weakestSec==="vocab"){
        return{mod:"tavern",icon:"spell-book",label:"Word Tavern",msg:"Your business lexicon needs expansion. Word Tavern teaches and tests new vocabulary in context."};
      }
      if(weakestSec==="reading"){
        var pickP=(typeof readingByPart.p6==="number"&&typeof readingByPart.p7==="number"&&readingByPart.p6<readingByPart.p7)?"p6":"p7";
        return{mod:pickP,icon:pickP==="p6"?"scroll-quill":"eye-target",label:pickP==="p6"?"Part 6 — Cloze":"Part 7 — Reading",msg:"Reading comprehension is your weak spot. "+(pickP==="p6"?"Part 6 trains contextual cloze.":"Part 7 trains inference and detail.")};
      }
      // listening
      var weakPart=null,minPa=2;
      ["p1","p2","p3","p4"].forEach(function(p){if(typeof listeningByPart[p]==="number"&&listeningByPart[p]<minPa){minPa=listeningByPart[p];weakPart=p;}});
      var modMap={p1:"lisP1",p2:"lisP2",p3:"lisP3",p4:"lisP4"};
      var labelMap={p1:"Listening Part 1 — Photos",p2:"Listening Part 2 — Q&R",p3:"Listening Part 3 — Conversations",p4:"Listening Part 4 — Talks"};
      var icoMap={p1:"public-speaker",p2:"public-speaker",p3:"public-speaker",p4:"public-speaker"};
      if(!weakPart)weakPart="p2";
      return{mod:modMap[weakPart],icon:icoMap[weakPart],label:labelMap[weakPart],msg:"Your ear needs training. "+labelMap[weakPart]+" exercises real TOEIC audio."};
    }
    var quest=pickFirstQuest();

    // Main radar geometry (4-axis diamond, % values)
    var cx=150,cy=150,rad=110;
    var dxArr=[0,1,0,-1],dyArr=[-1,0,1,0];
    function gridDiam(s){return cx+","+(cy-rad*s)+" "+(cx+rad*s)+","+cy+" "+cx+","+(cy+rad*s)+" "+(cx-rad*s)+","+cy;}
    var playerPts=statOrder.map(function(st,i){var v=Math.max(sec[st]/100,0.10);return(cx+dxArr[i]*rad*v)+","+(cy+dyArr[i]*rad*v);}).join(" ");

    // Mini grammar radar geometry (smaller diamond, 4 macros)
    var macroOrder=["verbs","linking","forms","reference"];
    var macroLabels={verbs:"Verbs",linking:"Linking",forms:"Forms",reference:"Refs"};
    var mcx=80,mcy=80,mrad=60;
    var mdx=[0,1,0,-1],mdy=[-1,0,1,0];
    function mGrid(s){return mcx+","+(mcy-mrad*s)+" "+(mcx+mrad*s)+","+mcy+" "+mcx+","+(mcy+mrad*s)+" "+(mcx-mrad*s)+","+mcy;}
    var hasGrammarMacros=macroOrder.some(function(k){return typeof grammarMacros[k]==="number";});
    var macroPts=macroOrder.map(function(k,i){var v=Math.max(grammarMacros[k]||0,0.10);return(mcx+mdx[i]*mrad*v)+","+(mcy+mdy[i]*mrad*v);}).join(" ");

    var toeicColor=toeicEst>=750?"var(--green)":toeicEst>=600?"var(--gold)":toeicEst>=450?"var(--orange)":"var(--red)";

    return(
    <div className="app onboard-shell" style={{display:"flex",flexDirection:"column",alignItems:"center",minHeight:"100vh",padding:"24px 16px",textAlign:"center",overflow:"auto"}}>
      <div style={{animation:"fadeIn .6s",width:"100%",maxWidth:380}}>
        <div className="out" style={{fontSize:10,fontWeight:700,color:"var(--t3)",textTransform:"uppercase",letterSpacing:3,marginBottom:8}}>Battle Report</div>
        <h2 className="out" style={{fontFamily:"'Cinzel',serif",fontWeight:900,fontSize:26,background:"linear-gradient(135deg,var(--cx-hex),#8b5e83)",WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent",marginBottom:4}}>Warrior Assessment</h2>
        <div style={{display:"inline-flex",alignItems:"center",gap:8,padding:"5px 14px",borderRadius:99,background:"rgba(var(--cx),.1)",border:"1px solid rgba(var(--cx),.2)",marginBottom:20}}>
          <GIcon name="laurel-crown" size={14} color="var(--cyan)"/>
          <span className="out" style={{fontWeight:700,fontSize:14,color:"var(--cyan)"}}>{tierLabel}</span>
        </div>

        {/* TOEIC ESTIMATE */}
        <div className="crd" style={{padding:"14px 16px",marginBottom:20,background:"linear-gradient(135deg,rgba(var(--cx),.08),rgba(240,200,80,.06))",border:"1px solid rgba(240,200,80,.2)"}}>
          <div className="out" style={{fontSize:10,fontWeight:700,color:"var(--t3)",textTransform:"uppercase",letterSpacing:1.5,marginBottom:6,display:"flex",alignItems:"center",justifyContent:"center",gap:6}}><GIcon name="bullseye" size={12} color="var(--t3)"/> Estimated TOEIC</div>
          <div className="out" style={{fontFamily:"'Cinzel',serif",fontSize:32,fontWeight:900,color:toeicColor,lineHeight:1}}>{toeicEst}<span style={{fontSize:14,color:"var(--t3)",fontWeight:400,marginLeft:6}}>{"/ 990"}</span></div>
          <p style={{fontSize:11,color:"var(--t2)",lineHeight:1.5,margin:"8px 0 0",textAlign:"left"}}>Adaptive baseline — refines as you train. Real TOEIC = 50% <b style={{color:"#3b82f6"}}>Listening</b> + 50% <b style={{color:"#22c55e"}}>Reading</b>.</p>
        </div>

        {/* MAIN RADAR — 4 sections */}
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
            {statOrder.map(function(st,i){var v=Math.max(sec[st]/100,0.10);return(<circle key={st} cx={cx+dxArr[i]*rad*v} cy={cy+dyArr[i]*rad*v} r="5" fill={statMeta[st].color} stroke="var(--bg)" strokeWidth="2" style={{animation:"fadeIn 1s"}}/>);})}
          </svg>
          <div style={{position:"absolute",top:0,left:"50%",transform:"translateX(-50%) translateY(-4px)",textAlign:"center"}}>
            <GIcon name={statMeta.grammar.icon} size={16} color={statMeta.grammar.color}/>
            <div className="out" style={{fontSize:10,fontWeight:700,color:statMeta.grammar.color}}>{sec.grammar+"%"}</div>
          </div>
          <div style={{position:"absolute",top:"50%",right:0,transform:"translateY(-50%) translateX(4px)",textAlign:"center"}}>
            <GIcon name={statMeta.vocab.icon} size={16} color={statMeta.vocab.color}/>
            <div className="out" style={{fontSize:10,fontWeight:700,color:statMeta.vocab.color}}>{sec.vocab+"%"}</div>
          </div>
          <div style={{position:"absolute",bottom:0,left:"50%",transform:"translateX(-50%) translateY(4px)",textAlign:"center"}}>
            <GIcon name={statMeta.reading.icon} size={16} color={statMeta.reading.color}/>
            <div className="out" style={{fontSize:10,fontWeight:700,color:statMeta.reading.color}}>{sec.reading+"%"}</div>
          </div>
          <div style={{position:"absolute",top:"50%",left:0,transform:"translateY(-50%) translateX(-4px)",textAlign:"center"}}>
            <GIcon name={statMeta.listening.icon} size={16} color={statMeta.listening.color}/>
            <div className="out" style={{fontSize:10,fontWeight:700,color:statMeta.listening.color}}>{sec.listening+"%"}</div>
          </div>
        </div>

        {/* STAT BARS */}
        <div style={{display:"flex",flexDirection:"column",gap:8,marginBottom:20,textAlign:"left"}}>
          {statOrder.map(function(st){var m=statMeta[st];var pct=sec[st];return(
            <div key={st} style={{display:"flex",alignItems:"center",gap:10}}>
              <span style={{width:28,textAlign:"center"}}><GIcon name={m.icon} size={18} color={m.color}/></span>
              <div style={{flex:1}}>
                <div style={{display:"flex",justifyContent:"space-between",marginBottom:3}}>
                  <span className="out" style={{fontSize:11,fontWeight:700,color:"var(--t1)"}}>{m.arena}</span>
                  <span className="out" style={{fontSize:11,fontWeight:700,color:m.color}}>{pct+"%"}</span>
                </div>
                <div style={{height:6,background:"var(--bg3)",borderRadius:99,overflow:"hidden"}}>
                  <div style={{width:pct+"%",height:"100%",background:m.color,borderRadius:99,transition:"width 1s cubic-bezier(.4,0,.2,1)"}}/>
                </div>
              </div>
            </div>);
          })}
        </div>

        {/* MINI GRAMMAR RADAR — 4 macros */}
        {hasGrammarMacros&&<div className="crd" style={{padding:"14px 16px",marginBottom:20,background:"rgba(212,148,58,.05)",border:"1px solid rgba(212,148,58,.2)",textAlign:"left"}}>
          <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:10}}>
            <GIcon name="scroll-quill" size={14} color="#d4943a"/>
            <span className="out" style={{fontSize:11,fontWeight:700,color:"#d4943a",textTransform:"uppercase",letterSpacing:1}}>Grammar — 4 macros</span>
          </div>
          <div style={{display:"flex",alignItems:"center",gap:14}}>
            <div style={{position:"relative",width:160,height:160,flexShrink:0}}>
              <svg viewBox="0 0 160 160" width="160" height="160">
                {[0.25,0.5,0.75,1.0].map(function(s,i){return(<polygon key={i} points={mGrid(s)} fill="none" stroke={"rgba(180,140,80,"+(s===1?0.25:0.08)+")"} strokeWidth={s===1?"1":"0.6"}/>);})}
                {macroOrder.map(function(k,i){return(<line key={k} x1={mcx} y1={mcy} x2={mcx+mdx[i]*mrad} y2={mcy+mdy[i]*mrad} stroke="rgba(180,140,80,0.15)" strokeWidth="0.7"/>);})}
                <polygon points={macroPts} fill="rgba(212,148,58,0.20)" stroke="#d4943a" strokeWidth="1.8" strokeLinejoin="round"/>
                {macroOrder.map(function(k,i){var v=Math.max(grammarMacros[k]||0,0.10);return(<circle key={k} cx={mcx+mdx[i]*mrad*v} cy={mcy+mdy[i]*mrad*v} r="3" fill="#d4943a"/>);})}
              </svg>
            </div>
            <div style={{flex:1,fontSize:11,lineHeight:1.6,color:"var(--t2)"}}>
              {macroOrder.map(function(k){
                var v=grammarMacros[k];
                if(typeof v!=="number")return null;
                var pct=Math.round(v*100);
                var col=pct>=75?"var(--green)":pct>=50?"var(--cyan)":"var(--orange)";
                return(<div key={k} style={{display:"flex",justifyContent:"space-between",gap:8}}>
                  <span style={{color:"var(--t2)"}}>{macroLabels[k]}</span>
                  <span className="out" style={{fontWeight:700,color:col}}>{pct+"%"}</span>
                </div>);
              })}
            </div>
          </div>
          <p style={{fontSize:10,color:"var(--t3)",margin:"10px 0 0",lineHeight:1.5,fontStyle:"italic"}}>Your Mentor uses these 4 axes to weight your Drill picks. Train Drill to refine each.</p>
        </div>}

        {/* FIRST QUEST */}
        <div className="crd"
          style={{background:"rgba(var(--cx),.06)",borderColor:"rgba(var(--cx),.15)",padding:16,marginBottom:14,textAlign:"left"}}>
          <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:8}}>
            <GIcon name="rolled-cloth" size={16} color="var(--cyan)"/>
            <span className="out" style={{fontFamily:"'Cinzel',serif",fontWeight:800,fontSize:14,color:"var(--cyan)"}}>First Quest</span>
          </div>
          <div style={{display:"flex",alignItems:"center",gap:10}}>
            <span style={{flexShrink:0}}><GIcon name={quest.icon} size={28} color="var(--cyan)"/></span>
            <div>
              <div className="out" style={{fontWeight:700,fontSize:14,color:"var(--t1)",marginBottom:2}}>{quest.label}</div>
              <p style={{fontSize:12,color:"var(--t2)",lineHeight:1.5,margin:0}}>{quest.msg}</p>
            </div>
          </div>
        </div>

        {/* Forward action only. "Enter the Arena" (+ its arena-call jingle) is
            reserved for the real threshold (langBridge), so here the label is
            "Continue" — avoids a duplicate "Enter the Arena" two screens apart. */}
        <button className="btn1" onClick={function(){stopTts();stopListenAudio();goToInstallStep(null);}}
          style={{fontSize:16,padding:"14px 32px",width:"100%",marginBottom:10,background:"linear-gradient(135deg,var(--cx-hex),#8b5e83)"}}>
          Continue {"→"}
        </button>
        <p style={{color:"var(--t3)",fontSize:11,marginTop:12,lineHeight:1.5}}>Your radar refines as you train. Aldric will greet you inside, and your Mentor is one tap away whenever you want a personalized path.</p>
      </div>
    </div>);}

  // ─ Install on home screen (replaces the former push opt-in — 2026-06-30) ─
  // Why install-first: on iOS, push & fullscreen only work once the PWA is on the
  // home screen, and a teacher-led launch walks students through it live. The push
  // opt-in itself now lives in Profile (toggle), not here. The browser-control glyph
  // in the mock is kept REALISTIC on purpose (it's the button students must find);
  // only the decorative icons are med-fan game-icons.
  if(step==="install"){
    function finishOnb(){sSt("langBridge");}
    var ios=isIOSDevice();
    var ctrl=ios
      ?(<svg viewBox="0 0 24 24" width={17} height={17} fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" style={{display:"block"}}><path d="M12 16V4"/><path d="M8 8l4-4 4 4"/><path d="M5 12v6a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-6"/></svg>)
      :(<svg viewBox="0 0 24 24" width={17} height={17} fill="currentColor" style={{display:"block"}}><circle cx="12" cy="5" r="1.6"/><circle cx="12" cy="12" r="1.6"/><circle cx="12" cy="19" r="1.6"/></svg>);
    var steps=ios?[
      {n:1,ic:"compass",tx:(<span>{"Ouvre cette page dans "}<b style={{color:"var(--cx-hex)"}}>Safari</b></span>)},
      {n:2,ic:"pointing",tx:(<span>{"Touche le bouton "}<b style={{color:"var(--cx-hex)"}}>Partager</b>{" en bas de l'écran"}</span>)},
      {n:3,ic:"tower-flag",tx:(<span>{"Choisis "}<b style={{color:"var(--cx-hex)"}}>{"« Sur l'écran d'accueil »"}</b></span>)}
    ]:[
      {n:1,ic:"pointing",tx:(<span>{"Touche le menu "}<b style={{color:"var(--cx-hex)"}}>{"⋮"}</b>{" de ton navigateur"}</span>)},
      {n:2,ic:"tower-flag",tx:(<span>{"Choisis "}<b style={{color:"var(--cx-hex)"}}>{"« Installer l'application »"}</b></span>)},
      {n:3,ic:"castle",tx:(<span>{"L'icône apparaît avec tes autres apps"}</span>)}
    ];
    return(
    <div className="app onboard-shell" style={{display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",minHeight:"100vh",padding:"24px 16px",textAlign:"center"}}>
      <div style={{animation:"fadeIn .6s",width:"100%",maxWidth:360}}>
        <div style={{marginBottom:14,display:"flex",justifyContent:"center",filter:"drop-shadow(0 4px 10px rgba(var(--cx),.35))"}}><GIcon name="castle" size={56} color="var(--cx-hex)"/></div>
        <h2 className="out" style={{fontFamily:"'Cinzel',serif",fontWeight:900,fontSize:22,color:"var(--t1)",lineHeight:1.25,marginBottom:18}}>{"Installe Verse Arena sur ton écran d'accueil"}</h2>

        {/* Browser mock: highlights the real control to look for (kept realistic). */}
        <div style={{padding:14,marginBottom:18,background:"rgba(var(--bg3-rgb),.5)",border:"1px solid var(--bdr)",borderRadius:16}}>
          <div style={{display:"flex",alignItems:"center",gap:8,background:"rgba(var(--bg-rgb),.6)",borderRadius:10,padding:"8px 10px"}}>
            <span style={{flex:1,textAlign:"left",fontSize:12,color:"var(--t2)",overflow:"hidden",whiteSpace:"nowrap",textOverflow:"ellipsis"}}>app.verse-arena.fr</span>
            <span style={{width:30,height:30,borderRadius:8,display:"flex",alignItems:"center",justifyContent:"center",color:"var(--cx-hex)",background:"rgba(var(--cx),.16)",border:"2px solid var(--cx-hex)",animation:"pulse 1.6s ease-in-out infinite"}}>{ctrl}</span>
          </div>
          <div style={{marginTop:10,fontSize:11,fontWeight:700,color:"var(--cx-hex)",display:"flex",alignItems:"center",gap:6,justifyContent:"center"}}><GIcon name="pointing" size={13} color="var(--cx-hex)"/>{ios?"Touche ce bouton dans Safari":"Touche le menu de ton navigateur"}</div>
        </div>

        {/* Steps */}
        <div style={{display:"flex",flexDirection:"column",gap:9,marginBottom:18,textAlign:"left"}}>
          {steps.map(function(s){return(
            <div key={s.n} style={{display:"flex",gap:11,alignItems:"center",background:"rgba(var(--cx),.06)",border:"1px solid rgba(var(--cx),.15)",borderRadius:12,padding:"11px 13px"}}>
              <span style={{width:24,height:24,flexShrink:0,borderRadius:"50%",background:"var(--cx-hex)",color:"#0f0c08",fontWeight:800,fontSize:12,display:"flex",alignItems:"center",justifyContent:"center"}}>{s.n}</span>
              <span style={{flex:1,fontSize:13,color:"var(--t1)",lineHeight:1.45}}>{s.tx}</span>
              <GIcon name={s.ic} size={17} color="var(--cx-hex)"/>
            </div>);})}
        </div>

        <p style={{fontSize:11,color:"var(--t3)",marginBottom:18}}>{"Plein écran · rappels de série · tes acquis te suivent"}</p>

        <button className="btn1" onClick={finishOnb}
          style={{fontSize:15,padding:"14px 28px",width:"100%",marginBottom:9,background:"linear-gradient(135deg,var(--cx-hex),#8b5e83)"}}>{"C'est fait, continuer →"}</button>
        <button className="btn2" onClick={finishOnb}
          style={{fontSize:13,padding:"11px 28px",width:"100%"}}>Plus tard</button>
        <p style={{color:"var(--t3)",fontSize:10,marginTop:11,lineHeight:1.5}}>{"Tu pourras activer les rappels à tout moment depuis ton Profil."}</p>
      </div>
    </div>);}

  // ─ Language bridge: transition to English ─
  if(step==="langBridge"){
    function enterArena(){p.go(name.trim(),classCode||"visitor",scanScores,pendingNav||undefined,sectionResults,studentPwdSet);}
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
        <button className="btn1" onClick={function(){playArenaCall();enterArena();}}
          style={{fontSize:16,padding:"14px 32px",width:"100%",background:"linear-gradient(135deg,var(--cx-hex),#8b5e83)"}}>
          Enter the Arena {"\u2192"}</button>
      </div>
    </div>);}

  // ═══════════════════════════════════════════════════════════════════════
  // Battle Scan V2 — CAT-light render
  // ═══════════════════════════════════════════════════════════════════════
  var secId=SCAN_SECTION_ORDER[scanSec]||SCAN_SECTION_ORDER[0];
  var secMeta=BATTLE_SCAN_V2[secId];

  function getOpts(curQ){
    if(!curQ)return[];
    if(curQ.sectionId==="listening"){
      if(curQ.part==="p1"||curQ.part==="p2")return curQ.item.opts||[];
      if(curQ.part==="p3"||curQ.part==="p4"){var sub=curQ.item.qs&&curQ.item.qs[curQ.qIdx];return sub?(sub.opts||[]):[];}
      return[];
    }
    return curQ.item.o||[];
  }
  function getCorrect(curQ){
    if(!curQ)return-1;
    if(curQ.sectionId==="listening"){
      if(curQ.part==="p1"||curQ.part==="p2")return curQ.item.c;
      if(curQ.part==="p3"||curQ.part==="p4"){var sub=curQ.item.qs&&curQ.item.qs[curQ.qIdx];return sub?sub.c:-1;}
      return-1;
    }
    return curQ.item.c;
  }
  function getExplain(curQ){
    if(!curQ)return"";
    if(curQ.sectionId==="listening"){
      if(curQ.part==="p1"||curQ.part==="p2")return curQ.item.x||"";
      if(curQ.part==="p3"||curQ.part==="p4"){var sub=curQ.item.qs&&curQ.item.qs[curQ.qIdx];return(sub&&sub.x)||"Listen again to catch the relevant detail.";}
      return"";
    }
    return curQ.item.x||"";
  }
  function lvlBadgeColors(l){
    if(l==="hard")return{bg:"rgba(239,68,68,.15)",fg:"#ef4444"};
    if(l==="easy")return{bg:"rgba(34,197,94,.15)",fg:"#22c55e"};
    return{bg:"rgba(245,158,11,.15)",fg:"#f59e0b"};
  }
  function partLabelV2(p){return{p1:"Part 1 — Photo",p2:"Part 2 — Q&R",p3:"Part 3 — Conversation",p4:"Part 4 — Talk"}[p]||p;}

  // Battle Scan Welcome (V2) — one-time narrative gate after consent, before section 1.
  // Set only by startTestV2(); nextSectionV2() uses "intro", so this never repeats.
  if(scanPhase==="welcome")return(
    <div className="app onboard-shell" style={{display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",minHeight:"100vh",padding:32,textAlign:"center"}}>
      <div style={{animation:"fadeIn .5s",width:"100%",maxWidth:360}}>
        <div className="out" style={{fontSize:11,fontWeight:700,color:"var(--t3)",textTransform:"uppercase",letterSpacing:2,marginBottom:14}}>Battle Scan</div>
        <div style={{marginBottom:18,animation:"countUp .6s"}}><GIcon name="coliseum" size={64} color="var(--cyan)"/></div>
        <h2 className="out" style={{fontFamily:"'Cinzel',serif",fontWeight:900,fontSize:26,color:"var(--cyan)",marginBottom:12}}>{"Votre première épreuve"}</h2>
        <p style={{color:"var(--t2)",fontSize:14,lineHeight:1.65,marginBottom:16,maxWidth:330,margin:"0 auto 16px"}}>{"Avant de bâtir votre légende, l’arène doit jauger votre niveau. Cette épreuve adaptative déterminera le point de départ de votre quête."}</p>
        <div className="crd" style={{padding:"12px 16px",marginBottom:22,background:"rgba(var(--cx),.06)",borderColor:"rgba(var(--cx),.15)",fontSize:12,color:"var(--t2)",lineHeight:1.55,textAlign:"left"}}>
          {"Quatre sections — grammaire, vocabulaire, lecture et écoute. Les questions s’ajustent à vos réponses. Pas de chrono, aucun piège : répondez du mieux que vous pouvez."}
        </div>
        <button className="btn1" onClick={function(){setScanPhase("intro");}} style={{fontSize:16,padding:"14px 32px",width:"100%"}}>{"Commencer l’épreuve"}</button>
      </div>
    </div>);

  // Section Intro (V2)
  if(scanPhase==="intro")return(
    <div className="app onboard-shell" style={{display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",minHeight:"100vh",padding:32,textAlign:"center"}}>
      <div style={{animation:"fadeIn .5s",width:"100%",maxWidth:360}}>
        <div style={{display:"flex",gap:6,justifyContent:"center",marginBottom:24}}>
          {SCAN_SECTION_ORDER.map(function(sid,i){var sm=BATTLE_SCAN_V2[sid];return(
            <div key={i} style={{display:"flex",alignItems:"center",gap:4}}>
              <div style={{width:i===scanSec?32:10,height:10,borderRadius:5,background:i<=scanSec?sm.color:"var(--bg3)",opacity:i<=scanSec?1:.4,transition:"all .4s"}}/>
            </div>);})}
        </div>
        <div className="out" style={{fontSize:11,fontWeight:700,color:"var(--t3)",textTransform:"uppercase",letterSpacing:2,marginBottom:16}}>Section {scanSec+1} of {SCAN_SECTION_ORDER.length}</div>
        <div style={{marginBottom:16,animation:"countUp .6s"}}><GIcon name={secMeta.icon} size={64} color={secMeta.color}/></div>
        <h2 className="out" style={{fontFamily:"'Cinzel',serif",fontWeight:900,fontSize:28,color:secMeta.color,marginBottom:4}}>{secMeta.name}</h2>
        <p className="out" style={{color:"var(--t2)",fontSize:14,fontWeight:500,marginBottom:8}}>{secMeta.subtitle}</p>
        <p style={{color:"var(--t3)",fontSize:13,lineHeight:1.6,marginBottom:8,maxWidth:320,margin:"0 auto 16px"}}>{secMeta.desc}</p>
        <div className="crd" style={{padding:"10px 14px",marginBottom:20,background:"rgba(var(--cx),.06)",borderColor:"rgba(var(--cx),.15)",fontSize:11,color:"var(--t2)",lineHeight:1.5}}>
          {"Adaptive — questions get harder if you nail them, easier if you struggle. No timer, no pressure."}
        </div>
        <div style={{display:"flex",alignItems:"center",justifyContent:"center",gap:6,marginBottom:24}}>
          <span style={{fontSize:13,color:"var(--t2)"}}>{secMeta.targetCount} questions</span>
        </div>
        <button className="btn1" onClick={beginSectionV2} style={{fontSize:16,padding:"14px 32px"}}>Begin</button>
      </div>
    </div>);

  // Section Done (V2)
  if(scanPhase==="done"){
    var doneRes=sectionResults[secId];
    var donePct=doneRes?Math.round(doneRes.acc*100):0;
    return(
    <div className="app onboard-shell" style={{display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",minHeight:"100vh",padding:32,textAlign:"center"}}>
      <div style={{animation:"fadeIn .5s",width:"100%",maxWidth:360}}>
        <div style={{marginBottom:12,animation:"countUp .5s"}}><GIcon name={secMeta.icon} size={56} color={secMeta.color}/></div>
        <h3 className="out" style={{fontFamily:"'Cinzel',serif",fontWeight:800,fontSize:22,color:secMeta.color,marginBottom:4}}>{secMeta.name}</h3>
        <p style={{color:"var(--t2)",fontSize:13,marginBottom:16}}>{secMeta.subtitle+" — Complete"}</p>
        <div style={{display:"inline-block",padding:"12px 28px",borderRadius:16,background:"rgba(var(--cx),.08)",border:"1px solid rgba(var(--cx),.15)",marginBottom:24}}>
          <div className="out" style={{fontSize:42,fontWeight:900,color:secMeta.color,animation:"countUp .6s"}}>{donePct}<span style={{fontSize:20,color:"var(--t3)"}}>%</span></div>
        </div>
        {doneRes&&<div style={{fontSize:11,color:"var(--t3)",marginBottom:24}}>{doneRes.raw+" / "+doneRes.total+" correct (weighted by difficulty)"}</div>}
        {scanSec<SCAN_SECTION_ORDER.length-1?
          <button className="btn1" onClick={nextSectionV2} style={{fontSize:16,padding:"14px 32px"}}>Next Section</button>
          :<button className="btn1" onClick={function(){stopListenAudio();stopTts();sSt("results");}} style={{fontSize:16,padding:"14px 32px",background:"linear-gradient(135deg,var(--cx-hex),#8b5e83)"}}>See Your Battle Report</button>}
      </div>
    </div>);
  }

  // Question phase (V2)
  if(!currentQ){
    return(<div className="app onboard-shell" style={{padding:"20px 16px",minHeight:"100vh"}}>
      <p style={{color:"var(--t2)",textAlign:"center",marginTop:40}}>Loading next question...</p>
    </div>);
  }

  var ctrl=ctrlRef.current;
  var qNum=ctrl?(ctrl.score().total+(scanPhase==="q"?1:0)):1;
  var qTotal=secMeta.targetCount;
  var lvlCols=lvlBadgeColors(currentQ.lvl);
  var opts=getOpts(currentQ);
  var corrIdx=getCorrect(currentQ);

  return(
    <div className="app onboard-shell" style={{padding:"20px 16px",minHeight:"100vh"}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12}}>
        <div>
          <div style={{display:"flex",alignItems:"center",gap:8,flexWrap:"wrap"}}>
            <GIcon name={secMeta.icon} size={18} color={secMeta.color}/>
            <p className="out" style={{fontWeight:700,fontSize:14,color:secMeta.color,margin:0}}>{secMeta.name}</p>
            {currentQ.lvl&&<span className="out" style={{fontSize:9,padding:"2px 6px",borderRadius:4,background:lvlCols.bg,color:lvlCols.fg,fontWeight:800,textTransform:"uppercase",letterSpacing:1}}>{currentQ.lvl}</span>}
            {currentQ.sectionId==="listening"&&<span className="out" style={{fontSize:9,padding:"2px 6px",borderRadius:4,background:"rgba(59,130,246,.12)",color:"#3b82f6",fontWeight:700,letterSpacing:0.5}}>{partLabelV2(currentQ.part)}</span>}
            {currentQ.sectionId==="grammar"&&currentQ.macroId&&<span className="out" style={{fontSize:9,padding:"2px 6px",borderRadius:4,background:"rgba(212,148,58,.12)",color:secMeta.color,fontWeight:700,letterSpacing:0.5,textTransform:"capitalize"}}>{currentQ.macroId}</span>}
            {currentQ.sectionId==="reading"&&<span className="out" style={{fontSize:9,padding:"2px 6px",borderRadius:4,background:"rgba(34,197,94,.12)",color:"#22c55e",fontWeight:700,letterSpacing:0.5}}>{currentQ.format==="p6"?"Part 6 — Cloze":"Part 7 — Reading"}</span>}
          </div>
          <p style={{fontSize:11,color:"var(--t3)",marginTop:2}}>Question {qNum} of {qTotal}</p>
        </div>
      </div>
      <Bar value={qNum} max={qTotal} h={4} color={secMeta.color}/>

      {(currentQ.sectionId==="grammar"||currentQ.sectionId==="vocab")&&(
        <h2 className="out" style={{fontWeight:700,fontSize:18,lineHeight:1.5,marginBottom:20,marginTop:18}}>{currentQ.item.s}</h2>
      )}

      {currentQ.sectionId==="reading"&&currentQ.format==="p6"&&(function(){
        var passage=currentQ.passage;
        var blankCount=0;
        return(
        <div className="crd" style={{marginTop:14,padding:14,fontSize:14,lineHeight:1.8,color:"var(--t2)",borderColor:"rgba(34,197,94,.15)",background:"rgba(34,197,94,.04)"}}>
          {passage.title&&<div className="out" style={{fontWeight:700,fontSize:11,color:"#22c55e",marginBottom:10,textTransform:"uppercase",letterSpacing:1}}>{passage.title+" · "+passage.type}</div>}
          {passage.intro&&<div style={{fontSize:11,color:"var(--t3)",marginBottom:10,whiteSpace:"pre-line",fontStyle:"italic"}}>{passage.intro}</div>}
          <div>
            {passage.parts.map(function(p,i){
              if(p.blank){
                var thisIdx=blankCount;blankCount++;
                var isCurrent=thisIdx===currentQ.blankIndex;
                return(<span key={i} style={{display:"inline-block",margin:"0 2px",padding:"2px 10px",borderRadius:6,background:isCurrent?"rgba(34,197,94,.18)":"transparent",border:"1.5px solid "+(isCurrent?"#22c55e":"var(--bdr)"),color:isCurrent?"#22c55e":"var(--t3)",fontWeight:isCurrent?800:600,fontSize:13,letterSpacing:1}}>{isCurrent?"███":"___"}</span>);
              }
              return(<span key={i}>{p.text}</span>);
            })}
          </div>
        </div>);
      })()}

      {currentQ.sectionId==="reading"&&currentQ.format==="p7"&&currentQ.isFirstQ&&(
        <div className="crd" style={{marginTop:14,padding:14,maxHeight:240,overflowY:"auto",fontSize:13,lineHeight:1.7,color:"var(--t2)",borderColor:"rgba(34,197,94,.15)",background:"rgba(34,197,94,.04)"}}>
          <div className="out" style={{fontWeight:700,fontSize:11,color:"#22c55e",marginBottom:8,textTransform:"uppercase",letterSpacing:1}}>{currentQ.passage.title+" · "+currentQ.passage.type}</div>
          <PassageDocs key={currentQ.passage.id} text={currentQ.passage.text} fontSize={13} lineHeight={1.7}/>
        </div>
      )}
      {currentQ.sectionId==="reading"&&currentQ.format==="p7"&&!currentQ.isFirstQ&&(
        <details style={{marginTop:12,marginBottom:4}}>
          <summary style={{fontSize:12,color:"var(--t3)",cursor:"pointer",marginBottom:4}}>Show passage</summary>
          <div className="crd" style={{padding:12,maxHeight:200,overflowY:"auto",fontSize:12,lineHeight:1.6,color:"var(--t2)",borderColor:"rgba(34,197,94,.15)",background:"rgba(34,197,94,.04)"}}>
            <PassageDocs key={currentQ.passage.id+"-d"} text={currentQ.passage.text} fontSize={12} lineHeight={1.6}/>
          </div>
        </details>
      )}

      {currentQ.sectionId==="reading"&&currentQ.format==="p7"&&(
        <h2 className="out" style={{fontWeight:700,fontSize:17,lineHeight:1.5,marginBottom:20,marginTop:16}}>{currentQ.item.q}</h2>
      )}

      {currentQ.sectionId==="listening"&&currentQ.part==="p1"&&currentQ.item.img&&(
        <div style={{marginTop:14,marginBottom:14,borderRadius:12,overflow:"hidden",border:"1px solid var(--bdr)",background:"#000"}}>
          <img src={currentQ.item.img} alt="" style={{width:"100%",display:"block",maxHeight:280,objectFit:"contain"}}/>
        </div>
      )}

      {currentQ.sectionId==="listening"&&(
        <div style={{display:"flex",alignItems:"center",gap:8,marginTop:12,marginBottom:12}}>
          <button onClick={function(){resumeAudioSession();playListeningClip(currentQ);}} disabled={audioBusy}
            style={{display:"flex",alignItems:"center",gap:8,padding:"10px 18px",background:audioBusy?"rgba(59,130,246,.15)":"var(--bg2)",border:"1px solid "+(audioBusy?"rgba(59,130,246,.3)":"var(--bdr)"),borderRadius:10,cursor:audioBusy?"default":"pointer",fontSize:13,fontWeight:600,color:audioBusy?"#3b82f6":"var(--t2)",fontFamily:"'DM Sans',sans-serif",transition:"all .3s"}}>
            <GIcon name="public-speaker" size={16} color={audioBusy?"#3b82f6":"var(--t2)"}/>
            {audioBusy?(currentQ.part==="p1"&&audioStep>=0?"Statement "+(audioStep+1)+" / 4":"Playing..."):(scanPhase==="fb"?"Listen again":"Listen")}
          </button>
          {scanPhase==="q"&&!audioBusy&&<span style={{fontSize:11,color:"var(--t3)",fontStyle:"italic"}}>Tap when ready</span>}
        </div>
      )}

      {currentQ.sectionId==="listening"&&(currentQ.part==="p3"||currentQ.part==="p4")&&currentQ.item.qs&&currentQ.item.qs[currentQ.qIdx]&&(
        <h2 className="out" style={{fontWeight:700,fontSize:17,lineHeight:1.5,marginBottom:16,marginTop:8}}>{currentQ.item.qs[currentQ.qIdx].q}</h2>
      )}

      {currentQ.sectionId==="listening"&&(currentQ.part==="p1"||currentQ.part==="p2")&&(
        <p style={{fontSize:12,color:"var(--t3)",fontStyle:"italic",marginTop:8,marginBottom:12}}>
          {currentQ.part==="p1"?"Pick the statement that best describes the photo.":"Pick the best response to the question you heard."}
        </p>
      )}

      <div style={{display:"flex",flexDirection:"column",gap:8}}>
        {opts.map(function(opt,i){
          var isCor=i===corrIdx;var isPick=sel===i;var show=scanPhase==="fb";
          var bg="var(--bg2)";var bd="var(--bdr)";
          if(show&&isCor){bg="rgba(0,230,118,.12)";bd="var(--green)";}
          else if(show&&isPick&&!isCor){bg="rgba(255,71,87,.12)";bd="var(--red)";}
          return(<button key={i} onClick={function(){if(scanPhase==="q")answerScanQ(i);}} disabled={show||scanPhase!=="q"}
            style={{display:"flex",alignItems:"center",gap:12,padding:"14px 16px",background:bg,border:"1px solid "+bd,borderRadius:12,cursor:scanPhase==="q"?"pointer":"default",fontSize:15,color:"var(--t1)",textAlign:"left",fontFamily:"'DM Sans',sans-serif",transition:"all .2s"}}>
            <div style={{width:28,height:28,borderRadius:"50%",border:"2px solid "+(show&&isCor?"var(--green)":show&&isPick?"var(--red)":"var(--t3)"),display:"flex",alignItems:"center",justifyContent:"center",fontSize:12,fontWeight:700,flexShrink:0,background:show&&isCor?"var(--green)":show&&isPick&&!isCor?"var(--red)":"transparent",color:show&&(isCor||isPick)?"#fff":"var(--t3)"}}>
              {show&&isCor?"✓":show&&isPick?"✗":String.fromCharCode(65+i)}</div>
            <span>{opt}</span></button>);})}
      </div>

      {scanPhase==="fb"&&<div style={{marginTop:16,animation:"fadeIn .3s"}}>
        {getExplain(currentQ)&&<div className="crd" style={{background:"rgba(var(--cx),.06)",borderColor:"rgba(var(--cx),.15)",padding:14}}>
          <p style={{fontSize:13,color:"var(--t2)",lineHeight:1.6,margin:0}}>{getExplain(currentQ)}</p>
        </div>}
        <button className="btn1" onClick={advanceScanV2} style={{marginTop:14}}>Next</button>
      </div>}
    </div>);

}

































// ─── MOCK TEST ───
















// ─── SPEED MATCH ───










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
  var MODULE_LABELS={drill:"Part 5 Drill",csess:"Flashcards",tavern:"Word Tavern",lisP1:"Listening P1",lisP2:"Listening P2",lisP3:"Listening P3",lisP4:"Listening P4",p6:"Part 6",p7:"Part 7",ablitz:"Audio Blitz",clue:"Clue Hunter",sbuild:"Sentence Builder",wfall:"Word Fall",matchEasy:"Speed Match",pvdojo:"Phrasal Verbs",stratquiz:"Strategy Quiz",timesim:"Time Sim",mock1:"Mock Test 1",mock2:"Mock Test 2",mock3:"Mock Test 3",bforge:"Linking Bridge"};
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
      if(!r.ok){console.warn("[teacher] loadGroups refused:",r.error);setGroups([]);return;}
      try{localStorage.setItem('toeic-dash-role',r.role);}catch(e){console.warn("[teacher] role store failed:",e&&e.message);}
      setGroups(r.groups);
    });
  }
  useEffect(function(){loadGroups();loadEvents();},[]);
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
      {id:"endless",name:"Endless Arena"}
    ]);
    var headers=[
      "Nom","Classe","XP Total","XP Semaine","Niveau","Ligue","Streak","Derniere activite",
      "Sessions totales","Temps total (min)",
      "Questions totales","Bonnes reponses","Precision globale %","Precision hors Flashcards %",
      "Cartes revisees","Exercices drill","Defis parfaits","Daily completions semaine",
      "TOEIC estime total","TOEIC Listening","TOEIC Reading",
      "Mock1 TOEIC estime /495","Mock1 Score %","Mock1 Questions","Mock1 Date","Mock1 Temps (min)",
      "Mock2 TOEIC estime /495","Mock2 Score %","Mock2 Questions","Mock2 Date","Mock2 Temps (min)",
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
      ].concat(mockC("mock1")).concat(mockC("mock2")).concat([
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
          if(v.length>=3){supabase.from('groups').select('code').eq('code',v).maybeSingle().then(function(res){setCgCodeErr(res.data?"Ce code existe d\u00e9j\u00e0":"");});}else{setCgCodeErr("");}

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
      {[{id:"overview",label:"👥 Students"},{id:"analytics",label:"📊 Analytics"},{id:"events",label:"🎪 Events"},{id:"feedback",label:"📬 Feedback"}].map(function(t){
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



// ═══════════════════════════════════════════
// COMPOSANTS Part 3 & Part 4
// ═══════════════════════════════════════════
// À coller AVANT "// ─── LEAGUE ───"







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








// ═══════════════════════════════════════════



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
  var[showTip,setShowTip]=useState(false);
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
  var MASTERY_BLACKLIST={mock1:1,mock2:1,mock3:1,boss:1,daily:1,csess:1};
  useEffect(function(){
    if(!u||!u.moduleScores)return;
    if(u.classCode==="visitor")return;
    Object.keys(u.moduleScores).forEach(function(modId){
      if(MASTERY_BLACKLIST[modId])return;
      if(masteryRef.current[modId])return; // session dedup — anti boucle
      var m=u.moduleScores[modId];
      if(!m||!m.total)return;
      if(m.total>=50&&(m.correct/m.total)>=0.8){
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
  useEffect(function(){
    if(!u)return;

    function syncEmailFromSession(session){
      if(!session||!session.user)return;
      if(!session.user.email)return;
      if(!session.user.email_confirmed_at)return;
      if(u.email===session.user.email)return; // already synced
      var newEmail=session.user.email;
      // Phase C-lite : l'email n'est plus fourni par le client. La RPC le lit dans le
      // JWT de la session, donc on ne peut coller sur son profil que l'adresse de SA
      // propre session — et plus celle qu'on veut.
      supabase.rpc('sync_my_student_email',{p_name:u.name,p_class_code:u.classCode||'visitor'})
        .then(function(res){
          if(res.error){console.error('[auth] email sync failed:',res.error.message);return;}
          if(!res.data||!res.data.ok||!res.data.rows){
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
      if(!silent){
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
    grantChest(un,cc,chestType,trigger,null).then(function(r){
      if(r&&r.granted){refreshPendingChests(un,cc);enqueueChestToast(trigger,chestType);}
    }).catch(function(e){console.error("[CHEST] grant error:",e&&e.message);});
  }
  // Fire-and-forget: grant a weekly chest (7-day cooldown per trigger)
  function grantWeeklyChest(trigger,chestType){
    if(!u||!u.name)return;
    var un=u.name,cc=u.classCode||"visitor";
    grantChest(un,cc,chestType,trigger,7).then(function(r){
      if(r&&r.granted){refreshPendingChests(un,cc);enqueueChestToast(trigger,chestType);}
    }).catch(function(e){console.error("[CHEST] grant error:",e&&e.message);});
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
    var result=await openChestFromPending(chest,pity,owned);
    // Update pity + aggregate XP from all reward slots
    var c=JSON.parse(JSON.stringify(u));
    if(!c.gameScores)c.gameScores={};
    c.gameScores.pityCount=result.newPityCount;
    if(result.totalXp>0){c.xp+=result.totalXp;c.weeklyXp+=result.totalXp;}
    sv(c);
    // Arena Shop P1 — grant Darics via RPC after sv(). silent=true because the
    // reveal modal already shows the Daric card ; no double-feedback toast.
    // unique=false because each chest opening is a distinct grant event (the
    // chest_log + pending_chests delete pair already guarantees no double-open).
    if(result.totalDarics>0){
      grantMarks(result.totalDarics,"chest",chest.trigger_source,false,true);
    }
    setChestResult(result);haptic("chestOpen");
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
          // Arena Shop P1 — 30 Darics per newly unlocked achievement, in addition
          // to any tier-specific chest. One-shot via source_detail="ach_marks_"+a.id.
          grantMarks(30,"achievement","ach_marks_"+a.id,true);
        }
      });
    }
    sU(d);
    saveLocal(d);
    save(d);
  }
  // Phase 2 brainstorm 2026-04-27 — Diminishing returns × event multipliers fix.
  // Sans ce relèvement de cap, un event "XP×3 sur drill 2 jours" devient inutile dès la
  // 4e session du jour (gate = 0% → 0×3 = 0 XP). Quand un event boost le module :
  //  - sessionCount est divisé par 2 (Math.floor) pour le calcul du diminishing
  //  - effet : chaque palier dure 2 sessions au lieu d'1, donc cap effectif × 2
  // L'event multiplier (×2/×3) reste appliqué après, comme avant. Pas de bypass de
  // l'accuracy gate (anti-farm de mauvaises sessions toujours actif).
  function isModuleBoosted(modId){
    if(!activeEvents||!activeEvents.length)return false;
    return activeEvents.some(function(ev){
      if(ev.type==="spotlight"&&ev.config&&ev.config.module===modId)return true;
      if(ev.type==="flash_hour")return true; // boost global
      if(ev.type==="underdog")return true;   // boost conditionnel — on relève le cap pour tous, le multiplier reste sélectif
      return false;
    });
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
    // Skipped entirely when (a) the user has armed a Bypass Token for THIS module,
    // OR (b) an active event boosts this module — events are explicit invitations
    // to farm, students should never hit the ceiling during a Spotlight / Flash Hour
    // / Underdog window. Changed 2026-05-12 after student feedback (previous behavior
    // doubled the cap via floor(sessionCount/2) — not full disable as intended).
    if(modId){
      // V2 — Bypass Token : if armed for THIS module, skip the diminishing curve entirely.
      // The flag is cleared in recordModule(u, modId) after the round so consumption is
      // tied to module completion (not just XP application).
      if(u&&u.bypassArmedModule===modId){
        return Math.max(0,gatedXp);
      }
      var boosted=isModuleBoosted(modId);
      if(!boosted){
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
    }
    // ── PILIER 3 : Today's Focus boost (Personalization Phase 1, 2026-05-05) ──
    // +25% XP when the module the user just finished maps to their weakest part
    // (computed live via computeTodayFocus). Soft incentive to follow the daily
    // recommendation. Anti-farming layered ON TOP : if the user grinds the focus
    // module 4× in a day, the diminishing returns above already cap their gain.
    if(modId&&u){
      try{
        var focus=computeTodayFocus(u);
        if(focus&&partOfModule(modId)===focus.partId){
          gatedXp=Math.round(gatedXp*1.25);
          // Arena Shop P1 — 30 Darics for following the Mentor reco, 1×/day.
          // source_detail="focus_"+today() → applyXpGates re-firing the same
          // day on another focus module hits the server dedup, silent no-op.
          grantMarks(30,"focus","focus_"+today(),true);
        }
      }catch(e){console.warn("[focus-boost] computation failed:",e&&e.message);}
    }
    // ── Arena Shop P2.5 — XP Boosts (purchased with Darics, armed by the player) ──
    // Primary ranking metric (TOEIC Progression) is accuracy-based → immune. These
    // only scale XP (level + XP Overall + League weeklyXp), per design decision.
    if(modId&&u&&u.boosts){
      var bst=u.boosts;
      // Module Booster : +50% on the armed module (flag cleared in recordModule)
      if(bst.moduleBoostArmed===modId){gatedXp=Math.round(gatedXp*1.5);}
      // Mock Multiplier : ×1.5 on any mock (flag cleared in mockDone)
      if(bst.mockMultArmed&&(modId==="mock1"||modId==="mock2"||modId==="mock3"||modId==="boss")){gatedXp=Math.round(gatedXp*1.5);}
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

      // Arena Shop P2.5 — Daily Doubler (×2 on all modules for 24h, purchased with Darics)
      if(c.boosts&&c.boosts.dailyDoublerUntil&&Date.now()<c.boosts.dailyDoublerUntil){
        mult*=2;bonuses.push({label:"⏫ Daily Doubler x2",color:"#f0c850"});
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
    // B3 : idem onboard() — la cohorte entière partait en select('*') pour retrouver UNE
    // ligne. La RPC renvoie directement la meilleure correspondance (XP décroissant), en
    // ligne complète car supaToLocal() hydrate tout le profil avec.
    // ⚠️ recover_student_row rend un profil complet à partir d'un simple prénom, sans
    // secret : c'est le finding C4. Elle n'ajoute rien (le client pouvait déjà faire pire)
    // mais elle DOIT être supprimée en même temps que ce chemin recover() legacy, à la
    // date butoir de la migration soft — sinon elle devient le trou de la Phase C.
    var rr=await supabase.rpc('recover_student_row',{p_name:name,p_class_code:classCode});
    if(rr.error)console.warn("[recover] rpc failed:",rr.error.message);
    var d=rr.data||null;
    if(!d||normalizeName(d.name||"")!==rnorm){console.warn("[recover] no row for",name,classCode);return false;}

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
    setCachedUserId(userId);

    try { localStorage.setItem('toeic-arena-name', name); } catch(e) {}
    try { localStorage.setItem('toeic-arena-class', classCode); } catch(e) {}
    var u=supaToLocal(d);
    sU(u);
    saveLocal(u);
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
    var u=supaToLocal(d);
    sU(u);
    saveLocal(u);
    return true;
  }

  function goTeacher(){setTeacher(true);}

  function bossDone(result,xp){var gxp=applyXpGates(xp,result.score,result.total,"boss");var c=addXp(gxp);c.stats.totalQ+=result.total;c.stats.correct+=result.score;c.stats.sessions+=1;if(!c.mockResults)c.mockResults={};var prev=c.mockResults.boss;if(!prev||result.toeicEstimate>=prev.toeicEstimate){c.mockResults.boss=result;}else{c.mockResults.boss=Object.assign({},prev,{date:result.date});}trackModSession(c,"boss");recordModule(c,"boss",result.score,result.total);if(c.bossResetArmed)c.bossResetArmed=false;if(c.boosts&&c.boosts.mockMultArmed)c.boosts.mockMultArmed=false;try{if(result.total>0&&result.score/result.total>=0.7)playJingleMock();else playJingleMockOk();}catch(e){}sv(c);
    // Pas de navigation ici : bossDone est appelé depuis doSubmit() pendant que
    // l'écran de résultats reste affiché (même GARDE que mockDone / bug Yannou).
  }
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
    var c=addXp(gxp);
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
    } else {
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
    c.stats.sessions+=1;trackModSession(c,"game_"+modeKey);sv(c);sSP(null);sT("games");}
  function trackModSession(c,modId){if(!c.dailyModSessions)c.dailyModSessions={};var key=modId+"_"+today();c.dailyModSessions[key]=(c.dailyModSessions[key]||0)+1;}
  function dailyDone(sc,xp){var gxp=applyXpGates(xp,sc,5,"daily");var c=addXp(gxp);c.daily={date:today(),done:true,score:sc,xpE:gxp};c.weeklyDailyCount=(c.weeklyDailyCount||0)+1;c.stats.totalQ+=5;c.stats.correct+=sc;c.stats.sessions+=1;if(sc===5)c.stats.perfects=(c.stats.perfects||0)+1;trackModSession(c,"daily");recordModule(c,"daily",sc,5);checkMission(c,"daily");grantMarks(10,"daily","daily_marks_"+today(),true);try{playJingleDaily();}catch(e){}
    // Track seen questions for anti-repetition
    if(!c.dailySeen)c.dailySeen=[];
    var todayQsArr=dailyQs(today(),c);
    todayQsArr.forEach(function(q){c.dailySeen.push({id:q.id,date:today()});});
    // Prune entries older than 45 days
    var pruneDate=new Date();pruneDate.setDate(pruneDate.getDate()-45);var pruneStr=pruneDate.toISOString().slice(0,10);
    c.dailySeen=c.dailySeen.filter(function(entry){return entry.date>=pruneStr;});
    sv(c);}
  function drillDone(sc,tot,xp,catStats){var gxp=applyXpGates(xp,sc,tot,"drill");var c=addXp(gxp);c.stats.totalQ+=tot;c.stats.correct+=sc;c.stats.sessions+=1;c.stats.drills=(c.stats.drills||0)+1;trackModSession(c,"drill");recordModule(c,"drill",sc,tot,catStats);checkMission(c,"drill");sv(c);}
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
    clearDashSession(); // B4 : ne pas laisser une session formateur derrière soi
    setCachedUserId(null);setSyncDirty(false);
    sU(null);sSP(null);sT("home");
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
    try{await supabase.auth.signOut();}catch(e){console.warn("[reset] signOut caught:",e&&e.message);}
    try{localStorage.removeItem("toeic-arena-profile");localStorage.removeItem("toeic-arena-name");localStorage.removeItem("toeic-arena-class");}catch(e){}
    clearDashSession(); // B4 : ne pas laisser une session formateur derrière soi
    setCachedUserId(null);setSyncDirty(false);
    sU(null);sSP(null);sT("home");
  }

  var lc="app"+(u&&u.theme==="light"?" light":"")+(u&&u.equippedSkin?" skin-"+u.equippedSkin:"");
  var isExpiredGroup=groupAccess&&groupAccess.status==="expired";
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
  function pg(content){return(<div className={lc}><style>{CSS}</style>{xpt&&<XpToast v={xpt}/>}{achToast&&<AchToast v={achToast}/>}{marksToast&&<MarksToast v={marksToast}/>}{!chestModal&&<NarratorOverlay moment={currentNarratorMoment} muted={u&&u.narrator&&u.narrator.muted} onClose={dismissNarratorMoment}/>}<div className="pg-wrap">{content}</div><Tabs cur={tab} go={tabGo} blocked={expBlocked}/>{premiumOverlay}</div>);}

  // Reset password : bypass complet du flow normal si l'URL a ?reset=<token>.
  // Doit être AVANT loading/teacher/onboard parce que le user peut être complètement
  // déconnecté quand il clique le lien depuis son mail.
  if(resetToken)return(<div className={lc+" onboard-shell"}><style>{CSS}</style><ResetPasswordView token={resetToken}/></div>);
  if(ld)return(<div className={lc+" onboard-shell"}><style>{CSS}</style><div style={{display:"flex",alignItems:"center",justifyContent:"center",minHeight:"100vh"}}><div style={{textAlign:"center"}}>
    <div style={{animation:"pulse 1.6s ease-in-out infinite"}}>
      <BrandMark size={94} style={{margin:"0 auto"}}/>
    </div>
    <p className="out" style={{color:"var(--t1)",marginTop:16,letterSpacing:"0.24em",textTransform:"uppercase",fontSize:15}}>Verse Arena</p>
    <p style={{color:"var(--t3)",marginTop:5,letterSpacing:"0.3em",textTransform:"uppercase",fontSize:9}}>loading…</p>
  </div></div></div>);
  if(teacherMode)return pg(<TeacherDash back={function(){setTeacher(false);}}/>);
  if(!u)return(<div className={lc+" onboard-shell"}><style>{CSS}</style><Onboard go={onboard} goTeacher={goTeacher} recover={recover} recoverByEmail={recoverByEmail}/></div>);

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
  if(sp==="drill")return pg(<Drill u={u} nav={nav} done={drillDone} gate={function(xp,sc,tot){return applyXpGates(xp,sc,tot,"drill");}} back={function(){sSP(null);sSPA(0);sT("train");}}/>);
  if(sp==="wordfam")return pg(<WordFam u={u} done={miniDone} gate={function(xp,sc,tot){return applyXpGates(xp,sc,tot,"wordfam");}} back={function(){sSP(null);sSPA(1);sT("train");}}/>);
  if(sp==="connsort")return pg(<ConnSort u={u} done={miniDone} gate={function(xp,sc,tot){return applyXpGates(xp,sc,tot,"connsort");}} back={function(){sSP(null);sSPA(1);sT("train");}}/>);
  if(sp==="bforge"){playBGM("bgm_bridge");return pg(<LinkingBridge u={u} done={function(sc,tot,xp){stopBGM();miniDone(sc,tot,xp);}} gate={function(xp,sc,tot){return applyXpGates(xp,sc,tot,"bforge");}} back={function(){stopBGM();sSP(null);sSPA(1);sT("train");}}/>);}
  if(sp==="prepdrill")return pg(<PrepDrill u={u} done={miniDone} gate={function(xp,sc,tot){return applyXpGates(xp,sc,tot,"prepdrill");}} back={function(){sSP(null);sSPA(1);sT("train");}}/>);
  if(sp==="gerinf")return pg(<GerInf u={u} done={miniDone} gate={function(xp,sc,tot){return applyXpGates(xp,sc,tot,"gerinf");}} back={function(){sSP(null);sSPA(1);sT("train");}}/>);
  if(sp==="traps")return pg(<TrapsQuiz u={u} done={miniDone} gate={function(xp,sc,tot){return applyXpGates(xp,sc,tot,"traps");}} back={function(){sSP(null);sSPA(3);sT("train");}}/>);
  if(sp==="falsefr")return pg(<FalseFriends u={u} done={miniDone} gate={function(xp,sc,tot){return applyXpGates(xp,sc,tot,"falsefr");}} back={function(){sSP(null);sSPA(1);sT("train");}}/>);
  if(sp==="pvdojo")return pg(<PhrasalDojo u={u} done={miniDone} gate={function(xp,sc,tot){return applyXpGates(xp,sc,tot,"pvdojo");}} back={function(){sSP(null);sSPA(1);sT("train");}}/>);
  if(sp==="gauntlet")return pg(<GauntletHub u={u} nav={nav} onModuleDone={function(subId,sc,tot,xp){var fullModId="gauntlet_"+subId;var gxp=applyXpGates(xp,sc,tot,fullModId);gxp=Math.round(gxp*getSpotlightMult(fullModId));var c=addXp(gxp);c.stats.totalQ+=tot;c.stats.correct+=sc;c.stats.sessions+=1;trackModSession(c,fullModId);recordModule(c,fullModId,sc,tot);checkMission(c,fullModId);if(sc===tot&&tot>0)grantWeeklyChest(fullModId+"_perfect","guerrier");sv(c);}} back={function(){stopBGM();sSP(null);sSPA(1);sT("train");}}/>);
  if(sp==="modals")return pg(<ModalCouncilHub u={u} nav={nav} onModuleDone={function(subId,sc,tot,xp){var fullModId="modals_"+subId;var gxp=applyXpGates(xp,sc,tot,fullModId);gxp=Math.round(gxp*getSpotlightMult(fullModId));var c=addXp(gxp);c.stats.totalQ+=tot;c.stats.correct+=sc;c.stats.sessions+=1;trackModSession(c,fullModId);recordModule(c,fullModId,sc,tot);checkMission(c,fullModId);if(sc===tot&&tot>0)grantWeeklyChest(fullModId+"_perfect","guerrier");sv(c);}} back={function(){stopBGM();sSP(null);sSPA(1);sT("train");}}/>);
  if(sp==="mock1")return pg(<MockTest mockId={1} u={u} done={mockDone} back={function(){sSP(null);sSPA("mocks");sT("train");}}/>);
  if(sp==="mock2")return pg(<MockTest mockId={2} u={u} done={mockDone} back={function(){sSP(null);sSPA("mocks");sT("train");}}/>);

  if(sp==="boss"){playBGM("bgm_final");return pg(<BossTest u={u} done={function(r,xp){stopBGM();bossDone(r,xp);}} back={function(){stopBGM();sSP(null);sSPA("mocks");sT("train");}}/>);}
  if(sp==="endless"){playBGM("bgm_endless");return pg(<EndlessArena u={u} nav={nav} done={function(r,xp,meta){stopBGM();endlessDone(r,xp,meta);}} back={function(){stopBGM();sSP(null);sSPA("mocks");sT("train");}}/>);}
  if(sp==="mock3")return pg(<MockTest mockId={3} u={u} done={mockDone} back={function(){sSP(null);sSPA("mocks");sT("train");}}/>);
  if(sp==="tavern"){playBGM("bgm_tavern");return pg(<WordTavern u={u} nav={nav} done={function(sc,tot,xp){stopBGM();miniDone(sc,tot,xp);}} gate={function(xp,sc,tot){return applyXpGates(xp,sc,tot,"tavern");}} resetCard={function(c){sv(c);}} back={function(){stopBGM();sSP(null);sT("games");}}/>);}
  if(sp==="matchE"){playBGM("bgm_speed");return pg(<SpeedMatch mode="easy" u={u} done={function(mk,res,xp){stopBGM();gameDone(mk,res,xp);}} back={function(){stopBGM();sSP(null);sT("games");}}/>);}
  if(sp==="wfall"){playBGM("bgm_wfall");return pg(<WordFall u={u} done={function(mk,res,xp){stopBGM();gameDone(mk,res,xp);}} back={function(){stopBGM();sSP(null);sT("games");}}/>);}
  if(sp==="duel"){playBGM("bgm_duel");return pg(<DuelArena u={u} done={function(mk,res,xp){stopBGM();gameDone(mk,res,xp);}} back={function(){stopBGM();sSP(null);sT("games");}}/>);}
  if(sp==="sbuild"){playBGM("bgm_build");return pg(<SentenceBuilder u={u} gate={function(xp,sc,tot){return applyXpGates(xp,sc,tot,"sbuild");}} done={function(sc,tot,xp){stopBGM();var gxp=applyXpGates(xp,sc,tot,"sbuild");var c=addXp(gxp);c.stats.totalQ+=tot;c.stats.correct+=sc;c.stats.sessions+=1;trackModSession(c,"sbuild");recordModule(c,"sbuild",sc,tot);if(tot>0&&sc/tot>=0.9)grantWeeklyChest("sbuild_90","novice");sv(c);sSP(null);sT("games");}} back={function(){stopBGM();sSP(null);sT("games");}}/>);}
  if(sp==="clue"){playBGM("bgm_clue");return pg(<ClueHunter u={u} gate={function(xp,sc,tot){return applyXpGates(xp,sc,tot,"clue");}} done={function(sc,tot,xp){stopBGM();var gxp=applyXpGates(xp,sc,tot,"clue");var c=addXp(gxp);c.stats.totalQ+=tot;c.stats.correct+=sc;c.stats.sessions+=1;trackModSession(c,"clue");recordModule(c,"clue",sc,tot);checkMission(c,"clue");if(sc===tot&&tot>0)grantWeeklyChest("clue_perfect","guerrier");sv(c);sSP(null);sT("games");}} back={function(){stopBGM();sSP(null);sT("games");}}/>);}
  if(sp==="ablitz")return pg(<AudioBlitz u={u} gate={function(xp,sc,tot){return applyXpGates(xp,sc,tot,"ablitz");}} done={function(sc,tot,xp){var gxp=applyXpGates(xp,sc,tot,"ablitz");var c=addXp(gxp);c.stats.totalQ+=tot;c.stats.correct+=sc;c.stats.sessions+=1;trackModSession(c,"ablitz");recordModule(c,"ablitz",sc,tot);if(tot>0){var abPct=sc/tot;if(abPct>=0.9)grantWeeklyChest("ablitz_90","guerrier");else if(abPct>=0.7)grantWeeklyChest("ablitz_70","novice");}sv(c);sSP(null);sT("games");}} back={function(){sSP(null);sT("games");}}/>);
  if(sp==="upgrade")return pg(<UpgradeScreen u={u} back={function(){sSP(null);sT("profile");}}/>);
  if(sp==="shop"){playBGM("bgm_shop");return pg(<Shop u={u} buy={shopBuy} setAvatar={function(c){sv(c);}} back={function(){stopBGM();sSP(null);sT("profile");}}/>);}
  if(sp==="abouttoeic")return pg(<AboutToeic back={function(){sSP(null);sSPA(3);sT("train");}}/>);
  if(sp==="strats")return pg(<StratCards back={function(){sSP(null);sSPA(3);sT("train");}}/>);
  if(sp==="gramref")return pg(<GrammarRef initial={spA} back={function(){sSP(null);sSPA(3);sT("train");}}/>);
  if(sp==="stratquiz")return pg(<StratQuizPage u={u} done={miniDone} gate={function(xp,sc,tot){return applyXpGates(xp,sc,tot,"stratquiz");}} back={function(){sSP(null);sSPA(3);sT("train");}}/>);
  if(sp==="timesim")return pg(<TimeSim u={u} done={miniDone} gate={function(xp,sc,tot){return applyXpGates(xp,sc,tot,"timesim");}} nav={nav} back={function(){sSP(null);sSPA(0);sT("train");}}/>);
  if(sp==="p6")return pg(<Part6Drill u={u} nav={nav} done={miniDone} gate={function(xp,sc,tot){return applyXpGates(xp,sc,tot,"p6");}} back={function(){sSP(null);sSPA(0);sT("train");}}/>);
  if(sp==="p7")return pg(<Part7Read u={u} nav={nav} done={miniDone} gate={function(xp,sc,tot){return applyXpGates(xp,sc,tot,"p7");}} back={function(){sSP(null);sSPA(0);sT("train");}}/>);
  if(sp==="lis")return pg(<ListenHub u={u} nav={nav} groupType={groupType} onPremium={function(n){setPremiumPrompt(n);}} back={function(){sSP(null);sSPA(0);sT("train");}}/>);
  if(sp==="lisP1")return pg(<ListenP1 u={u} done={miniDone} gate={function(xp,sc,tot){return applyXpGates(xp,sc,tot,"lisP1");}} back={function(){sSP("lis");}}/>);
  if(sp==="read")return pg(<ReadingHub u={u} nav={nav} groupType={groupType} onPremium={function(n){setPremiumPrompt(n);}} back={function(){sSP(null);sSPA(0);sT("train");}}/>);
  if(sp==="lisP2")return pg(<ListenP2 u={u} done={miniDone} gate={function(xp,sc,tot){return applyXpGates(xp,sc,tot,"lisP2");}} back={function(){sSP("lis");}}/>);
  if(sp==="lisP3")return pg(<ListenP3 u={u} nav={nav} done={miniDone} gate={function(xp,sc,tot){return applyXpGates(xp,sc,tot,"lisP3");}} back={function(){sSP("lis");}}/>);
  if(sp==="lisP4")return pg(<ListenP4 u={u} nav={nav} done={miniDone} gate={function(xp,sc,tot){return applyXpGates(xp,sc,tot,"lisP4");}} back={function(){sSP("lis");}}/>);

  return(<div className={lc}><style>{CSS}</style>{xpt&&<XpToast v={xpt}/>}{achToast&&<AchToast v={achToast}/>}{marksToast&&<MarksToast v={marksToast}/>}
    {!chestModal&&<NarratorOverlay moment={currentNarratorMoment} muted={u&&u.narrator&&u.narrator.muted} onClose={dismissNarratorMoment}/>}
    {showTip&&u&&<DailyTip u={u} close={function(){setShowTip(false);}}/>}
    {isExpiredGroup&&<div style={{padding:"10px 16px",background:"rgba(255,71,87,.08)",border:"1px solid rgba(255,71,87,.2)",borderRadius:12,margin:"12px 16px 0",textAlign:"center"}}>
      <p style={{fontSize:12,color:"var(--red)",margin:0,fontWeight:600}}>{"\u23F0"} Acc\u00e8s expir\u00e9 le {groupAccess.endDate} — consultation uniquement</p>
    </div>}
    {tab==="home"&&!isExpiredGroup&&<Home u={u} nav={nav} tabGo={tabGo} events={activeEvents} medianXp={classMedianXp} pendingChests={pendingChestCount} onOpenChest={function(){if(chestPending.length>0)setChestModal(chestPending[0]);}} onMount={function(){playBGM("bgm_home");}} onLeave={function(){stopBGM();}}/>}{tab==="train"&&!isExpiredGroup&&<Train u={u} nav={nav} tabGo={tabGo} initialView={spA} groupType={groupType} onPremium={function(n){setPremiumPrompt(n);}} setUser={function(c){sv(c);}}/>}{tab==="cards"&&!isExpiredGroup&&<Cards u={u} nav={nav} groupType={groupType} onPremium={function(n){setPremiumPrompt(n);}}/>}{tab==="games"&&!isExpiredGroup&&<GamesHub u={u} nav={nav} groupType={groupType} onPremium={function(n){setPremiumPrompt(n);}}/>}{tab==="mentor"&&!isExpiredGroup&&<Mentor u={u} nav={nav} tabGo={tabGo} setUser={function(c){sv(c);}} replayNarrator={function(id){setNarratorQueue([id]);}}/>}{tab==="league"&&<League u={u}/>}{tab==="profile"&&<Profile u={u} reset={reset} logout={logout} deleteAccount={deleteAccount} setAvatar={function(c){sv(c);}} goTeacher={function(){setTeacher(true);}} goUpgrade={function(){sSP("upgrade");}} goShop={function(){sSP("shop");}} replayNarrator={function(id){setNarratorQueue([id]);}}/>}
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
