// Extrait de src/App.jsx le 2026-09-15 (refactor split-app, REFACTOR_PLAN.md). Code déplacé tel quel.
import { normNameForEmail, signInStudent, bindStudentUserId, signUpStudent, signInWithPassword, requestPasswordReset } from "../../auth.js";
import { BrandMark, GIcon } from "../../components/icons.jsx";
import { PrivacyPolicy } from "../../components/legal.jsx";
import { PassageDocs } from "../../components/PassageDocs.jsx";
import { SCAN_SECTION_ORDER, BATTLE_SCAN_V2 } from "../../data/placement.js";
import { resumeAudioSession, stopListenAudio, getEnVoice, playAudioFile, playLetteredOption, isAudioAborted } from "../../lib/audio.js";
import { isModuleLocked } from "../../lib/access.js";
import { getBioCredId, biometricAvailable, bioAuthenticate, teacherAuth, setDashSession, hasDashSession } from "../../lib/teacherSession.js";
import { normalizeName } from "../../lib/util.js";
import { createCatController, replayCatController, computeScanResult } from "../../scanEngine.js";
import { playCorrect, playWrong, playArenaCall } from "../../sounds.js";
import { supabase } from "../../supabase.js";
import { useState, useRef, useEffect } from "react";
import { PasswordInput } from "../../components/PasswordInput.jsx";

// ─── ONBOARDING ───
var AUTO_ADVANCE_MS=1000; // Battle Scan : délai avant la question suivante après une bonne réponse
// Reprise du Battle Scan après une interruption (2026-10-22). Un appel, un changement d'appli sur iPhone (qui
// recharge souvent la PWA) ou un rechargement renvoyait à l'écran du prénom, 20 questions perdues. On garde dans
// sessionStorage (l'onglet seulement : rien ne reste après sa fermeture, appareil partagé compris) l'identité
// saisie, la graine de chaque section et les réponses ; au retour, scanEngine rejoue les sections à
// l'identique (tests/check_scan_replay.cjs) et l'élève retrouve la question qui était à l'écran.
var SCAN_SAVE_KEY="toeic-onb-scan";
var SCAN_SAVE_TTL=6*36e5;
function readScanSave(){
  try{
    var d=JSON.parse(sessionStorage.getItem(SCAN_SAVE_KEY)||"null");
    if(!d||d.v!==1||!d.name||!d.seeds||Date.now()-(d.at||0)>SCAN_SAVE_TTL)return null;
    return d;
  }catch(e){console.warn("[scan-save] read caught:",e&&e.message);return null;}
}
function clearScanSave(){try{sessionStorage.removeItem(SCAN_SAVE_KEY);}catch(e){console.warn("[scan-save] clear caught:",e&&e.message);}}
function newSeed(){return Math.floor(Math.random()*2147483647);}
export function Onboard(p){
var[step,sSt]=useState("name");
  var[name,sN]=useState("");
  var[ci,sC]=useState(0);var[sel,sS]=useState(-1);var[sc,sSc]=useState(0);var[ph,sP]=useState("q");
  var[scanSec,setScanSec]=useState(0);var[scanScores,setScanScores]=useState({grammar:0,vocab:0,reading:0,listening:0});var[scanPhase,setScanPhase]=useState("welcome");
  // ─── Battle Scan V2 — CAT-light state ───
  var[currentQ,setCurrentQ]=useState(null);            // {item, lvl, sectionId, ...sectionMeta} from controller.next()
  var[sectionResults,setSectionResults]=useState({}); // {grammar:{acc, byMacro,...}, vocab:{...}, ...} from .score()
  var[audioBusy,setAudioBusy]=useState(false);        // listening play button enable/disable
  var[audioStep,setAudioStep]=useState(-1);            // P1 statement index currently playing (0-3) or -1
  var ctrlRef=useRef(null);                            // active section controller (mutable, no rerenders)
  var seedsRef=useRef(null);var answersRef=useRef(null);  // reprise : graine par section, réponses (justes/fausses)
  var autoRef=useRef(null);var advanceRef=useRef(null); // passage automatique après une bonne réponse
  useEffect(function(){return function(){if(autoRef.current)clearTimeout(autoRef.current);};},[]);
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
  var[classGroupType,setClassGroupType]=useState(null);var lastCodeRef=useRef("");
  // Session perdue (F1, 2026-09-16) : App passe p.reauth={name,classCode} quand Supabase refuse la
  // ligne locale à la session courante. On rejoue le routage normal du lookup (compte sécurisé →
  // « entre ton mot de passe », legacy → claim) au lieu de l'écran « Ton prénom », qui
  // laissait l'élève se croire déconnecté sans raison. Clé primitive : l'effet ne rejoue que si la
  // cible change (pas au retour « ← Back »).
  var reauthKey=p.reauth?(p.reauth.name+"|"+p.reauth.classCode):"";
  useEffect(function(){
    if(!p.reauth)return;
    sN(p.reauth.name);setClassCode(p.reauth.classCode);
    lookupName(p.reauth.name,p.reauth.classCode);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  },[reauthKey]);
  // Reprise du scan (voir SCAN_SAVE_KEY). Jamais pendant une reconnexion (p.reauth : pas de scan en jeu).
  // Un nouvel élève qui avait posé son mot de passe (studentPwdSet) ne reprend que si la session est bien
  // celle de son compte : sans elle, onboard() lierait la ligne à une session anonyme et le mot de passe ne
  // rouvrirait plus le compte. Il repart alors du prénom, et « entre ton mot de passe » le remet sur ses rails
  // (reprise du compte Auth sans ligne, 0cd3a9c).
  useEffect(function(){
    if(p.reauth)return;
    var d=readScanSave();if(!d)return;
    var alive=true;
    (d.studentPwdSet?supabase.auth.getSession().then(function(r){var s=r&&r.data&&r.data.session;return !!(s&&!s.user.is_anonymous);}):Promise.resolve(true)).then(function(ok){
      if(!alive)return;
      if(!ok){console.warn("[scan-save] password session gone, restart from name");clearScanSave();return;}
      restoreScan(d);
    }).catch(function(e){console.warn("[scan-save] restore caught:",e&&e.message);clearScanSave();});
    return function(){alive=false;};
  // eslint-disable-next-line react-hooks/exhaustive-deps
  },[]);
  var[lookingUp,setLookingUp]=useState(false);var[returnHint,setReturnHint]=useState(false);var[visitorConfirm,setVisitorConfirm]=useState(false);
  // SECURITY (2026-09-11) — confinement cross-promo : detectMode=true quand on arrive
  // sur l'écran classcode depuis l'écran name (détection "welcome back"). Il déclenche
  // la recherche de compte SCOPÉE au class_code saisi (lookupName(name,cc)). false =
  // chemin d'inscription (choix de cohorte après emailPassword) → va direct à consent.
  // Sans ce scope, lookupName remontait tous les homonymes TOUTES promos et le picker
  // affichait même leur class_code (incident Hugo : accès à une promo CESI non sienne).
  var[detectMode,setDetectMode]=useState(false);
  // P2 Phase A (2026-09-11) — flux mot de passe (email synthétique).
  // setPassword ne sert plus qu’au claim d’un compte legacy (le nouvel élève passe par account). pwdTarget : la
  // ligne visée au retour {name, class_code, password_set_at}. studentPwdSet : vrai quand le
  // nouvel élève a posé son mot de passe → enterArena passe authBind à onboard().
  var[pwdTarget,setPwdTarget]=useState(null);
  var[studentPwdSet,setStudentPwdSet]=useState(false);
  // Miroir synchrone de studentPwdSet (2026-10-22) : l'étape account pose le mot de passe et enchaîne dans le
  // même clic (sauvegarde du scan, puis entrée dans l'arène au lot 3). L'état React n'y est pas encore à jour :
  // lu tel quel, onboard() recevrait authBind=false et la ligne naîtrait sans user_id ni password_set_at.
  var pwdSetRef=useRef(false);
  var[pendingNav,setPendingNav]=useState(null); // choix du rapport (module de la First Quest ou null), exécuté après account
  function markPwdSet(v){pwdSetRef.current=!!v;setStudentPwdSet(!!v);}
  // Filet auto-réparateur : si signUpStudent échoue "compte déjà existant" (ex. binding
  // password_set_at raté à la création, ou pré-claim par un tiers), on propose "me connecter"
  // → enterPassword, au lieu de laisser l'user coincé sur l'écran claim.
  var[pwdExistsDup,setPwdExistsDup]=useState(false);
  // PIN state removed 2026-04-20 — auth is now handled via Supabase magic link
  var[emailInput,setEmailInput]=useState("");var[emailBusy,setEmailBusy]=useState(false);var[emailErr,setEmailErr]=useState("");var[emailSent,setEmailSent]=useState(false);
  // pwd1/pwd2 : mot de passe + confirmation (setPassword, enterPassword, emailLogin) ; pwdBusy/pwdErr : appel en cours, erreur.
  // L'étape emailPassword (inscription email + mot de passe, 2026-04-27) a été supprimée le 2026-10-22 :
  // plus aucun chemin n'y menait depuis l'identité par prénom + code + mot de passe (P2 Phase A).
  var[pwd1,setPwd1]=useState("");var[pwd2,setPwd2]=useState("");var[pwdBusy,setPwdBusy]=useState(false);var[pwdErr,setPwdErr]=useState("");
  // Phase 2 commit 3 (2026-04-27) : useEffect pollEmailConfirmation supprimé avec
  // le step emailPrompt. Plus de magic link post-onboarding → plus de poll nécessaire.
  // Entrée dans l'arène, directement depuis le Battle Report (2026-10-22). L'écran d'installation et le
  // langBridge (« From here, English ») sont sortis du flow : l'installation est proposée sur la Home après la
  // première manche (lib/device.js, iPhone : feuille de notifications), et le passage à l'anglais est annoncé
  // à l'accueil du Battle Scan, là où l'anglais commence vraiment. firstNav = module de la First Quest, ou null.
  // Ne pas remettre ici une demande automatique de notifications (refus définitif difficile à rattraper).
  function enterArena(firstNav){clearScanSave();stopTts();stopListenAudio();try{playArenaCall();}catch(e){console.warn("[onboard] arena call:",e&&e.message);}p.go(name.trim(),classCode||"visitor",scanScores,firstNav||undefined,sectionResults,pwdSetRef.current);}

  async function lookupName(n,cc){
    setLookingUp(true);
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
      // 0 match → nouvel élève (poser un mot de passe). Sinon → password_set_at ? « entre ton mot
      // de passe » : « sécurise ton compte » (claim).
      // >1 (F3, 2026-09-16) : plus de sélecteur. Le lookup est scopé à la promo, et deux lignes
      // d'une même promo au nom normalisé identique partagent le même email synthétique
      // (normNameForEmail) : le modèle d'identité ne sait pas les distinguer. Même règle que
      // student_guard, bind_student_user_id et load_student : l'XP la plus haute (ordre de la RPC).
      // L'ancien sélecteur ouvrait le profil choisi SANS mot de passe (recover legacy).
      setPwd1("");setPwd2("");setPwdErr("");setPwdExistsDup(false);
      if(matches.length===0){
        console.warn("[LOOKUP] no match in cohort → scan (new)");
        setDetectMode(false); // nouvel inscrit : quitte le mode détection
        startTestV2();
      } else {
        if(matches.length>1)console.warn("[LOOKUP] "+matches.length+" rows share this normalized name in",cc,"→ highest XP (same rule as the server)");
        // Casing DB nécessaire pour synthEmail + recover.
        var m=matches[0];
        sN(m.name);
        setPwdTarget({name:m.name,class_code:m.class_code,password_set_at:m.password_set_at||null});
        if(m.password_set_at){
          console.warn("[LOOKUP] match, secured → enterPassword");
          sSt("enterPassword");
        }else{
          console.warn("[LOOKUP] match, legacy (no pwd) → claim");
          sSt("setPassword");
        }
      }
    }catch(e){
      console.warn("[LOOKUP] outer catch → scan (new), err:",e&&e.message);
      setDetectMode(false);
      startTestV2();
    }
    setLookingUp(false);
  }

  // Rend true/false (code connu ou non), null si le code a changé pendant l'appel : seule la réponse au
  // DERNIER code tapé s'affiche (la validation part pendant la frappe, deux réponses peuvent se croiser).
  async function checkGroupCode(code){
    var c=code.trim().toLowerCase();
    if(!c){setClassValid(null);setClassGroupName("");setClassGroupType(null);return false;}
    setClassChecking(true);
    // Fiche publique par RPC (`groups` n'est plus lisible en direct, verrou P2-D5 du
    // 2026-09-16). null = code inconnu → « Code not found », comme avant.
    var res=await supabase.rpc('group_public',{p_code:c});
    if(res.error)console.warn("[onboard] group_public failed:",res.error.message);
    if(lastCodeRef.current!==c)return null;
    setClassChecking(false);
    if(res.data){setClassValid(true);setClassGroupName(res.data.name);setClassGroupType(res.data.type||null);return true;}
    setClassValid(false);setClassGroupName("");setClassGroupType(null);return false;
  }
  // Validation pendant la frappe (2026-10-22). Avant : au onBlur seulement, et Next restait inerte tant que
  // le code n'était pas validé. Sur mobile, le premier tap sur Next ne faisait que fermer le clavier.
  useEffect(function(){
    if(step!=="classcode")return;
    lastCodeRef.current=classCode.trim().toLowerCase();
    if(!classCode.trim()){setClassChecking(false);return;}
    var t=setTimeout(function(){checkGroupCode(classCode);},350);
    return function(){clearTimeout(t);};
  },[classCode,step]);
  async function submitClassCode(){
    if(lookingUp||!classCode.trim())return;
    var ok=classValid;
    if(ok!==true){lastCodeRef.current=classCode.trim().toLowerCase();ok=await checkGroupCode(classCode);}
    if(!ok)return;
    if(detectMode){lookupName(name.trim(),classCode);}else{startTestV2();}
  }

  // ─── Battle Scan V2 helpers (CAT-light) ───
  function startTestV2(){
    sSt("scan");
    setScanSec(0);
    setScanScores({grammar:0,vocab:0,reading:0,listening:0});
    setSectionResults({});
    // One-time narrative gate, then straight into the questions (no per-section intro since 2026-10-22).
    setScanPhase("welcome");
    setCurrentQ(null);
    sS(-1);
    seedsRef.current=SCAN_SECTION_ORDER.map(newSeed);
    answersRef.current={grammar:[],vocab:[],reading:[],listening:[]};
    ctrlRef.current=createCatController(SCAN_SECTION_ORDER[0],seedsRef.current[0]);
    // Pas de saveScan ici : appelé dans le même clic qu'un setClassCode (visiteur), il sauverait l'ancien code.
    // La première réponse sauvegarde tout, graines comprises.
  }
  function saveScan(sec){
    try{sessionStorage.setItem(SCAN_SAVE_KEY,JSON.stringify({v:1,at:Date.now(),name:name.trim(),classCode:classCode,
      classGroupName:classGroupName,classGroupType:classGroupType,studentPwdSet:pwdSetRef.current,
      seeds:seedsRef.current,answers:answersRef.current,scanSec:sec}));}
    catch(e){console.warn("[scan-save] write caught:",e&&e.message);}
  }
  // Rejoue chaque section depuis sa graine. Une section dont toutes les réponses sont données (interruption
  // sur l'écran de correction de sa dernière question) est close et la suivante démarre.
  function restoreScan(d){
    sN(d.name);setClassCode(d.classCode||"visitor");setClassGroupName(d.classGroupName||"");setClassGroupType(d.classGroupType||null);
    markPwdSet(!!d.studentPwdSet);
    seedsRef.current=d.seeds;
    answersRef.current=Object.assign({grammar:[],vocab:[],reading:[],listening:[]},d.answers||{});
    var res={},scores={grammar:0,vocab:0,reading:0,listening:0},idx=d.scanSec||0,c=null,q=null,given=0;
    SCAN_SECTION_ORDER.forEach(function(sid){given+=answersRef.current[sid].length;});
    for(var i=0;i<idx;i++){var sid0=SCAN_SECTION_ORDER[i];var r0=replayCatController(sid0,d.seeds[i],answersRef.current[sid0]).score();res[sid0]=r0;scores[sid0]=Math.round(r0.acc*5);}
    while(idx<SCAN_SECTION_ORDER.length){
      var sid=SCAN_SECTION_ORDER[idx];
      c=replayCatController(sid,d.seeds[idx],answersRef.current[sid]);
      // Avant toute réponse, on rend l'accueil du scan (contrôleur prêt, rien de tiré).
      if(given===0)break;
      q=c.next();
      if(q)break;
      var r=c.score();res[sid]=r;scores[sid]=Math.round(r.acc*5);idx++;
    }
    setSectionResults(res);setScanScores(scores);
    if(idx>=SCAN_SECTION_ORDER.length){sSt("results");return;}
    ctrlRef.current=c;setScanSec(idx);sSt("scan");
    if(given===0){setScanPhase("welcome");setCurrentQ(null);return;}
    serveQ(q);
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
          // Lettre a part puis enonce : les clips P1 n'ont plus la lettre dedans (2026-09-16).
          // Le scan ne permute pas les options : position i = clip i.
          await playLetteredOption("p1",refId,i,"/audio/p1/"+refId+"_"+i+".mp3");
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
  // Une seule traversée (2026-10-22) : plus d'écran d'intro ni de « section terminée » entre les sections (8
  // écrans et autant de taps). La section suivante démarre sur sa première question, annoncée par un bandeau ;
  // les scores par section sont dans le Battle Report.
  function serveQ(q){
    setCurrentQ(q);sS(-1);setScanPhase("q");
    if(q&&q.sectionId==="listening"){setTimeout(function(){resumeAudioSession();playListeningClip(q);},400);}
  }
  function beginSectionV2(){
    var ctrl=ctrlRef.current;if(!ctrl)return;
    serveQ(ctrl.next());
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
    if(answersRef.current){answersRef.current[SCAN_SECTION_ORDER[scanSec]].push(!!correct);saveScan(scanSec);}
    setScanPhase("fb");
    // Passage automatique après une bonne réponse (2026-10-22) : le vert suffit, inutile de taper Next 26 fois.
    // Une erreur garde Next, pour laisser lire l'explication. advanceRef : la version de advanceScanV2 du
    // dernier rendu (celle de ce rendu-ci verrait un état périmé si un rendu passe entre-temps).
    if(correct)autoRef.current=setTimeout(function(){autoRef.current=null;advanceRef.current();},AUTO_ADVANCE_MS);
  }
  function advanceScanV2(){
    if(autoRef.current){clearTimeout(autoRef.current);autoRef.current=null;}
    stopListenAudio();stopTts();
    var ctrl=ctrlRef.current;if(!ctrl)return;
    var nq=ctrl.next();
    if(nq){serveQ(nq);return;}
    // Section finished — collect score, fold into legacy scanScores, chain the next section.
    var secId=SCAN_SECTION_ORDER[scanSec];
    var res=ctrl.score();
    var nextResults=Object.assign({},sectionResults);nextResults[secId]=res;
    setSectionResults(nextResults);
    var nextScores=Object.assign({},scanScores);nextScores[secId]=Math.round(res.acc*5);setScanScores(nextScores);
    var nextIdx=scanSec+1;
    if(nextIdx>=SCAN_SECTION_ORDER.length){sSt("results");return;}
    setScanSec(nextIdx);
    ctrlRef.current=createCatController(SCAN_SECTION_ORDER[nextIdx],seedsRef.current&&seedsRef.current[nextIdx]);
    serveQ(ctrlRef.current.next());
  }
  advanceRef.current=advanceScanV2;

  // Un prénom qui se normalise à vide (caractères non latins) ne donne pas d'e-mail synthétique : synthEmail
  // lèverait une erreur à la création du compte, qui vient après le scan (lot 3, 2026-10-22). Refusé ici.
  var nameUnusable=!!name.trim()&&!normNameForEmail(name);
  var nameReady=!!name.trim()&&!nameUnusable&&!lookingUp;
  function submitName(){if(nameReady){setDetectMode(true);sSt("classcode");}}
  // ─ Name entry ─
  if(step==="name")return(
    <div className="app onboard-shell" style={{display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",minHeight:"100vh",padding:32,textAlign:"center"}}>
      <div style={{animation:"fadeIn .8s ease-out"}}>
        <div style={{marginBottom:16,display:"flex",justifyContent:"center"}}><BrandMark size={72}/></div>
        <h1 className="out" style={{fontWeight:900,fontSize:36,background:"linear-gradient(135deg,var(--cx-hex),#8b5e83)",WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent",marginBottom:8}}>VERSE ARENA</h1>
        <p style={{color:"var(--t2)",fontSize:15,marginBottom:40,lineHeight:1.5}}>{"Entraîne-toi. Grimpe au classement."}<br/>{"Décroche ton TOEIC."}</p>
        <div style={{marginBottom:20,textAlign:"left"}}>
          <label className="out" style={{fontSize:12,fontWeight:600,color:"var(--t2)",textTransform:"uppercase",letterSpacing:1,marginBottom:8,display:"block"}}>{"Ton prénom"}</label>
          <input type="text" value={name} onChange={function(e){sN(e.target.value);}} onKeyDown={function(e){if(e.key==="Enter")submitName();}} autoFocus autoComplete="given-name" autoCapitalize="words" placeholder={"Ex. : Camille"}
            style={{width:"100%",padding:"14px 18px",background:"var(--bg2)",border:"1px solid var(--bdr)",borderRadius:12,color:"var(--t1)",fontSize:16,fontFamily:"'DM Sans',sans-serif",outline:"none"}}/>
          {nameUnusable&&<p style={{fontSize:12,color:"var(--red)",marginTop:6}}>{"Écris ton prénom en lettres latines (a-z), accents permis."}</p>}
        </div>
        <button className="btn1" onClick={submitName} disabled={!nameReady}
          style={{opacity:nameReady?1:.4,pointerEvents:nameReady?"auto":"none",fontSize:18,padding:"16px 32px"}}>{lookingUp?"Vérification…":"Suivant"}</button>
        {/* « Déjà inscrit » (2026-10-22) : le lien menait à la connexion par e-mail, alors que les élèves ont un
            compte prénom + code classe + mot de passe (e-mail synthétique qu'ils ne connaissent pas). Le retour
            passe par le même chemin que l'inscription : lookupName reconnaît le compte et demande le mot de passe. */}
        {returnHint&&<p style={{fontSize:13,color:"var(--t2)",lineHeight:1.5,marginTop:18,maxWidth:300,marginLeft:"auto",marginRight:"auto"}}>{"Même chemin : ton prénom, puis ton code classe. On te reconnaît et on te demande ton mot de passe."}</p>}
        <div style={{display:"flex",justifyContent:"center",gap:16,marginTop:20,flexWrap:"wrap"}}>
          {!returnHint&&<button onClick={function(){setReturnHint(true);}} style={{background:"none",border:"none",color:"var(--cyan)",fontSize:12,cursor:"pointer",fontFamily:"'DM Sans',sans-serif",textDecoration:"underline"}}>{"Déjà inscrit ?"}</button>}
          {returnHint&&<button onClick={function(){sSt("emailLogin");setEmailInput("");setEmailErr("");setEmailSent(false);}} style={{background:"none",border:"none",color:"var(--cyan)",fontSize:12,cursor:"pointer",fontFamily:"'DM Sans',sans-serif",textDecoration:"underline"}}>{"Connexion par e-mail"}</button>}
          <button onClick={function(){sSt("teacher");}} style={{background:"none",border:"none",color:"var(--t3)",fontSize:12,cursor:"pointer",fontFamily:"'DM Sans',sans-serif"}}>{"Accès formateur"}</button>
        </div>
      </div>
    </div>);

  // ─ P2 Phase A (2026-09-11) : entre ton mot de passe (retour, compte sécurisé) ─
  // Atteint depuis lookupName quand la ligne a password_set_at. Login via compte synthétique
  // (signInStudent), liaison, puis hydratation via recover() (lecture gardée, F3). Aucune
  // entrée sans mot de passe : le « Continuer sans pour l'instant » a été retiré le 2026-09-16.
  if(step==="enterPassword"){
    var epName=(pwdTarget&&pwdTarget.name)||name.trim();
    var epCc=(pwdTarget&&pwdTarget.class_code)||classCode;
    async function doStudentSignIn(){
      if(pwdBusy)return;
      if(!pwd1){setPwdErr("Entre ton mot de passe");return;}
      setPwdErr("");setPwdBusy(true);
      try{
        await signInStudent(epName,epCc,pwd1);
        // P2-D4 (2026-09-15) : une connexion réussie sur le compte synthétique prouve que le
        // mot de passe existe → on le MARQUE (true). Sans ça, une ligne liée ici restait
        // « legacy » (password_set_at NULL) et revoyait l'écran claim à chaque login.
        // Un refus de liaison (ligne sécurisée liée à une autre identité) ne laisse pas
        // entrer : student_guard refuserait ensuite chaque sauvegarde en silence.
        var bound=false;
        try{bound=await bindStudentUserId(epName,epCc,true);}catch(e){console.warn("[pwd] bind caught:",e&&e.message);}
        if(!bound){
          // Compte Auth sans ligne students (2026-10-09, mpii2627) : l'élève a posé son mot de
          // passe puis quitté (bouton retour) avant la fin de l'onboarding, là où la ligne naît.
          // « Liaison refusée » serait faux et sans issue : la connexion vient de réussir, on
          // reprend l'onboarding avec la session password, comme après un setPassword « new ».
          // Seulement si la promo ne connaît vraiment aucune ligne à ce nom (erreur RPC = on
          // garde le refus, jamais de reprise sur une lecture qui a échoué).
          var chk=await supabase.rpc('find_students_by_name',{p_name:epName,p_class_code:epCc});
          var noRow=!chk.error&&!(chk.data||[]).some(function(s){return normalizeName(s.name)===normalizeName(epName);});
          console.warn("[pwd] bind refused, orphan auth account:",noRow);
          if(noRow){
            sN(epName);setDetectMode(false);markPwdSet(true);setPwd1("");
            if(epCc)startTestV2();else sSt("classcode");
            return;
          }
          setPwdErr("Ce compte est lié à une autre identité. Préviens ton formateur (liaison refusée).");return;
        }
        var ok=await p.recover(epName,epCc);
        if(!ok)setPwdErr("Compte introuvable. Réessaie.");
      }catch(err){
        console.warn("[pwd] signIn failed:",err&&err.message);
        setPwdErr("Mot de passe incorrect.");
      }finally{setPwdBusy(false);}
    }
    return(
    <div className="app onboard-shell" style={{minHeight:"100vh",padding:"24px 16px",position:"relative"}}>
      <button className="back-btn" onClick={function(){setPwdErr("");sSt("classcode");}} style={{position:"absolute",top:16,left:16,marginBottom:0}}>{"←"} Back</button>
      <div style={{maxWidth:420,margin:"60px auto 0"}}>
        <div style={{textAlign:"center",marginBottom:24}}>
          <div style={{fontSize:44,marginBottom:10}}>{"👋"}</div>
          <h1 className="out" style={{fontWeight:800,fontSize:24,marginBottom:6,color:"var(--gold)"}}>{"Bon retour, "+epName+" !"}</h1>
          <p style={{color:"var(--t2)",fontSize:13,lineHeight:1.5}}>{"Entre ton mot de passe pour retrouver ta progression"+(classGroupName?" ("+classGroupName+")":"")+"."}</p>
          {p.reauth&&<div style={{marginTop:14,padding:"10px 12px",borderRadius:10,background:"rgba(255,71,87,.08)",border:"1px solid rgba(255,71,87,.25)",color:"var(--t1)",fontSize:12,lineHeight:1.5,textAlign:"left"}}>{"Ta session a expiré. Entre ton mot de passe pour reprendre : ta progression récente sur cet appareil sera récupérée."}</div>}
        </div>
        <PasswordInput value={pwd1} onChange={function(e){setPwd1(e.target.value);setPwdErr("");}}
          placeholder={"Mot de passe"} autoComplete="current-password"
          onKeyDown={function(e){if(e.key==="Enter")doStudentSignIn();}}
          style={{width:"100%",padding:"14px 16px",fontSize:14,marginBottom:14,background:"var(--bg2)",border:"1px solid var(--bdr)",borderRadius:10,color:"var(--t1)",fontFamily:"'DM Sans',sans-serif",boxSizing:"border-box",outline:"none"}}/>
        {pwdErr&&<div style={{color:"var(--red)",fontSize:13,marginBottom:12,textAlign:"center"}}>{pwdErr}</div>}
        <button className="btn1" onClick={doStudentSignIn} disabled={pwdBusy}
          style={{width:"100%",fontSize:15,padding:"13px 20px",opacity:pwdBusy?.6:1}}>
          {pwdBusy?"Connexion...":"Se connecter"}
        </button>
        {/* F3 (2026-09-16) : l'ancien lien « Mot de passe oublié ? Continuer sans pour l'instant »
            ouvrait le compte SANS mot de passe (recover legacy) : lecture de la ligne complète
            par n'importe qui connaissant prénom + code promo, puis une session incapable de
            sauvegarder (le piège de F1/F2). Le mot de passe oublié passe par le formateur :
            « Réinitialiser l'accès » (api/teacher-reset-student.js) remet le compte à sécuriser. */}
        <p style={{marginTop:20,textAlign:"center",color:"var(--t3)",fontSize:12,lineHeight:1.5}}>{"Mot de passe oublié ? Demande à ton formateur de réinitialiser ton accès : tu en choisiras un nouveau à ta prochaine connexion."}</p>
      </div>
    </div>);
  }

  // ─ P2 Phase A (2026-09-11) : sécurise un compte legacy (claim) ─
  // Le nouvel élève passe par l'étape account depuis le 2026-10-22 ; il ne reste ici que le claim :
  // signUpStudent puis bind user_id + password_set_at + recover(). Pas de
  // « plus tard » (retiré le 2026-09-14, voir DATE BUTOIR plus bas).
  if(step==="setPassword"){
    async function doStudentSignUp(){
      if(pwdBusy)return;
      if((pwd1||"").length<8){setPwdErr("Mot de passe trop court (8 caractères minimum)");return;}
      if(pwd1!==pwd2){setPwdErr("Les deux mots de passe ne correspondent pas");return;}
      setPwdErr("");setPwdBusy(true);
      var tName=name.trim(),tCc=classCode;
      try{
        await signUpStudent(tName,tCc,pwd1);
        {
          var bound=false;
          try{bound=await bindStudentUserId(tName,tCc,true);}catch(e){console.warn("[pwd] claim bind caught:",e&&e.message);}
          // P2-D4 : un refus ici = ligne déjà sécurisée par quelqu'un d'autre (le routage
          // l'aurait envoyée vers « entre ton mot de passe ») ou session absente. Ne pas
          // laisser entrer : student_guard refuserait ensuite chaque sauvegarde. Le compte
          // synthétique vient d'être créé : au prochain essai, « me connecter » relie.
          if(!bound){setPwdErr("Impossible de lier ce compte. Préviens ton formateur (liaison refusée).");return;}
          var ok=await p.recover(tName,tCc);
          if(!ok)setPwdErr("Compte introuvable.");
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
    return(
    <div className="app onboard-shell" style={{minHeight:"100vh",padding:"24px 16px",position:"relative"}}>
      <button className="back-btn" onClick={function(){setPwdErr("");sSt("classcode");}} style={{position:"absolute",top:16,left:16,marginBottom:0}}>{"←"} Back</button>
      <div style={{maxWidth:420,margin:"60px auto 0"}}>
        <div style={{textAlign:"center",marginBottom:24}}>
          <div style={{marginBottom:12,display:"flex",justifyContent:"center"}}><GIcon name="castle" size={48} color="var(--cyan)"/></div>
          <h1 className="out" style={{fontWeight:800,fontSize:24,marginBottom:8,color:"var(--gold)"}}>{"Sécurise ton compte, "+name.trim()}</h1>
          <p style={{color:"var(--t2)",fontSize:13,lineHeight:1.5}}>{"Choisis un mot de passe pour protéger ta progression et te reconnecter partout."}</p>
          {/* Phase C (2026-09-24) : un compte sans mot de passe d'une promo passée en mode strict arrive ici
              depuis l'appli (load refusé → reauth → lookup → claim). Sans ce mot, il croirait à une panne. */}
          {p.reauth&&<div style={{marginTop:14,padding:"10px 12px",borderRadius:10,background:"rgba(var(--cx),.08)",border:"1px solid rgba(var(--cx),.25)",color:"var(--t1)",fontSize:12,lineHeight:1.5,textAlign:"left"}}>{"Nouveau : ton compte doit maintenant être protégé par un mot de passe. Ta progression est conservée, y compris ce que tu as joué sur cet appareil."}</div>}
        </div>
        <PasswordInput value={pwd1} onChange={function(e){setPwd1(e.target.value);setPwdErr("");}}
          placeholder="Mot de passe (8 caractères min.)" autoComplete="new-password"
          style={{width:"100%",padding:"14px 16px",fontSize:14,marginBottom:10,background:"var(--bg2)",border:"1px solid var(--bdr)",borderRadius:10,color:"var(--t1)",fontFamily:"'DM Sans',sans-serif",boxSizing:"border-box",outline:"none"}}/>
        <PasswordInput value={pwd2} onChange={function(e){setPwd2(e.target.value);setPwdErr("");}}
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
          {pwdBusy?"...":"Sécuriser mon compte"}
        </button>
        <div style={{marginTop:20,textAlign:"center"}}>
          {/* DATE BUTOIR (2026-09-14) — le lien "Plus tard - continuer sans mot de passe"
              a ete retire : c'etait le filet de la migration souple, et il faisait que
              personne ne migrait (1 compte sur 160 au moment du retrait). Un eleve legacy
              qui revient DOIT desormais choisir un mot de passe ; le claim est de toute
              facon le chemin, sa progression est conservee et il n'est bloque nulle part.
              S'il oublie ensuite ce mot de passe : bouton "Reinitialiser l'acces" cote
              formateur (fiche eleve du dashboard). F3 (2026-09-16) : claimLater(), le
              « Continuer sans » de l'ecran mot de passe et le selecteur d'homonymes sont
              retires ; recover() ne lit plus que par load_student (gardee), et
              recover_student_row est supprimee cote SQL. */}
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
          <PasswordInput value={pwd1} onChange={function(ev){setPwd1(ev.target.value);setEmailErr("");}} placeholder="Mot de passe" autoComplete="current-password" disabled={emailBusy}
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

  // ─ Class code selection ─
  if(step==="classcode")return(
    <div className="app onboard-shell" style={{display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",minHeight:"100vh",padding:32,textAlign:"center"}}>
      <div style={{animation:"fadeIn .5s"}}>
        <div style={{fontSize:48,marginBottom:16}}>🏫</div>
        <h2 className="out" style={{fontWeight:800,fontSize:24,marginBottom:8}}>{"Rejoins ta classe"}</h2>
        <p style={{color:"var(--t2)",fontSize:13,marginBottom:24,lineHeight:1.5}}>{"Entre le code classe donné par ton formateur pour débloquer tous les modules, ou découvre Verse Arena gratuitement."}</p>
        <div style={{marginBottom:16,textAlign:"left"}}>
          <label className="out" style={{fontSize:12,fontWeight:600,color:"var(--t2)",textTransform:"uppercase",letterSpacing:1,marginBottom:8,display:"block"}}>{"Code classe"}</label>
          <input type="text" value={classCode} onChange={function(e){var v=e.target.value.toLowerCase().replace(/\s/g,'');setClassCode(v);setClassValid(null);setClassGroupName("");}} onKeyDown={function(e){if(e.key==="Enter")submitClassCode();}} autoFocus autoCapitalize="off" autoCorrect="off" spellCheck={false} placeholder={"Code de ton formateur"}
            style={{width:"100%",padding:"14px 18px",background:"var(--bg2)",border:"1px solid "+(classValid===true?"var(--green)":classValid===false?"var(--red)":"var(--bdr)"),borderRadius:12,color:"var(--t1)",fontSize:16,fontFamily:"'DM Sans',sans-serif",outline:"none",transition:"border .2s"}}/>
          {classChecking&&<p style={{fontSize:11,color:"var(--t3)",marginTop:6}}>{"Vérification…"}</p>}
          {classValid===true&&<p style={{fontSize:12,color:"var(--green)",marginTop:6,fontWeight:600}}>✓ {classGroupName}</p>}
          {classValid===false&&<p style={{fontSize:12,color:"var(--red)",marginTop:6}}>{"Code introuvable. Vérifie-le avec ton formateur."}</p>}
        </div>
        <button className="btn1" onClick={submitClassCode}
          style={{opacity:classCode.trim()&&classValid!==false&&!lookingUp?1:.4,pointerEvents:classCode.trim()&&!lookingUp?"auto":"none",fontSize:16,padding:"14px 28px",marginBottom:12}}>{lookingUp?"Vérification…":"Suivant"}</button>
        <div style={{position:"relative",margin:"16px 0",display:"flex",alignItems:"center",gap:12}}>
          <div style={{flex:1,height:1,background:"var(--bdr)"}}/>
          <span style={{fontSize:11,color:"var(--t3)",textTransform:"uppercase",letterSpacing:1}} className="out">{"ou"}</span>
          <div style={{flex:1,height:1,background:"var(--bdr)"}}/>
        </div>
        {!visitorConfirm?<button className="btn2" onClick={function(){setVisitorConfirm(true);}}
          style={{width:"100%",fontSize:14,padding:"12px 24px",borderColor:"rgba(27,112,207,.3)",color:"var(--purple)"}}>{"🌍 Découvrir gratuitement"}</button>
        :<div style={{animation:"fadeIn .3s",padding:16,background:"rgba(27,112,207,.08)",border:"1px solid rgba(27,112,207,.2)",borderRadius:14}}>
          <p style={{fontSize:13,color:"var(--t1)",lineHeight:1.6,marginBottom:12}}>{"⚠️ L'accès gratuit ouvre une sélection de modules. Tout se débloque avec un code classe de ton formateur, ou avec Arena Premium (9,99 €/mois ou Pass 3 mois à 22,99 €)."}</p>
          <div style={{display:"flex",gap:8}}>
            <button className="btn2" onClick={function(){setVisitorConfirm(false);}} style={{flex:1,fontSize:12,padding:"10px 8px"}}>{"Annuler"}</button>
            <button className="btn2" onClick={function(){setClassCode("visitor");setClassValid(true);setClassGroupName("Visitor / Free Access");setVisitorConfirm(false);startTestV2();}}
              style={{flex:1,fontSize:12,padding:"10px 8px",borderColor:"rgba(27,112,207,.3)",color:"var(--purple)"}}>{"C'est parti"}</button>
          </div>
        </div>}
        <button onClick={function(){sSt("name");}} style={{marginTop:16,background:"none",border:"none",color:"var(--t3)",fontSize:13,cursor:"pointer"}}>{"← Retour"}</button>
      </div>
    </div>);

  // ─ Compte + consentement (2026-10-22), APRÈS le Battle Report ─
  // Une seule étape pour le mot de passe d'un nouvel élève ET le consentement RGPD (ex-étapes setPassword "new"
  // et consent). Placée après le rapport (choix de Jérémy, lot 3) : la valeur d'abord, l'engagement ensuite.
  // RGPD : rien n'est enregistré côté serveur avant ce clic (le scan vit dans l'état React et le sessionStorage
  // de l'onglet ; seule la recherche prénom + code part avant, comme avant le lot 3). Ne JAMAIS appeler save,
  // syncToCloud ou une RPC d'écriture avant account : on traiterait des données sans consentement. Champs mot de passe seulement pour un nouvel élève d'une promo : le visiteur n'a pas de compte,
  // l'orphelin (compte Auth sans ligne, reprise 0cd3a9c) a déjà le sien (studentPwdSet). Cet écran est un
  // consentement RGPD : toute évolution du modèle d'identité doit être répercutée dans « Données collectées ».
  if(step==="account"){
    var needPwd=classCode!=="visitor"&&!studentPwdSet;
    var accountDone=function(){enterArena(pendingNav);};
    async function doAccount(){
      if(pwdBusy)return;
      if(!needPwd){accountDone();return;}
      if((pwd1||"").length<8){setPwdErr("Mot de passe trop court (8 caractères minimum)");return;}
      if(pwd1!==pwd2){setPwdErr("Les deux mots de passe ne correspondent pas");return;}
      setPwdErr("");setPwdBusy(true);
      try{
        await signUpStudent(name.trim(),classCode,pwd1);
        // La ligne naîtra dans onboard() avec user_id + password_set_at (authBind = pwdSetRef).
        markPwdSet(true);
        accountDone();
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
    function goSignIn(){setPwdErr("");setPwdExistsDup(false);setPwd1("");setPwdTarget({name:name.trim(),class_code:classCode,password_set_at:true});sSt("enterPassword");}
    var inputSt={width:"100%",padding:"14px 16px",fontSize:14,marginBottom:10,background:"var(--bg2)",border:"1px solid var(--bdr)",borderRadius:10,color:"var(--t1)",fontFamily:"'DM Sans',sans-serif",boxSizing:"border-box",outline:"none"};
    var gdprRows=[
      {ic:"stone-tablet",h:"Données collectées",tx:"Ton prénom, ton code classe, tes scores, ta progression, ton temps d’entraînement"+(classCode==="visitor"?".":", et le mot de passe que tu choisis — stocké chiffré, jamais lisible, ni par nous ni par ton formateur.")+" Aucune adresse e-mail n’est requise."},
      {ic:"bullseye",h:"Finalité",tx:"Suivi pédagogique, classements, et personnalisation de l’entraînement. Données accessibles à ton formateur."},
      {ic:"scales",h:"Tes droits",tx:"Tu peux à tout moment exporter, modifier ou supprimer tes données depuis ton profil."},
      {ic:"world",h:"Hébergement",tx:"Données stockées chez Supabase (UE/US) et Vercel. Aucune revente à des tiers."}
    ];
    return(
    <div className="app onboard-shell" style={{minHeight:"100vh",padding:"24px 16px",position:"relative"}}>
      {showPrivacy?<PrivacyPolicy onClose={function(){setShowPrivacy(false);}}/>:<>
      <button className="back-btn" onClick={function(){setPwdErr("");setPwdExistsDup(false);sSt("results");}} style={{position:"absolute",top:16,left:16,marginBottom:0}}>{"← Retour"}</button>
      <div style={{maxWidth:420,margin:"56px auto 0",animation:"fadeIn .5s"}}>
        <div style={{textAlign:"center",marginBottom:18}}>
          <div style={{marginBottom:10,display:"flex",justifyContent:"center"}}><GIcon name="castle" size={44} color="var(--cyan)"/></div>
          <h1 className="out" style={{fontWeight:800,fontSize:24,marginBottom:6,color:"var(--gold)"}}>{needPwd?"Garde ton résultat":"Avant d’entrer"}</h1>
          {needPwd&&<p style={{color:"var(--t2)",fontSize:13,lineHeight:1.5}}>{"Choisis un mot de passe : ton résultat et ta progression"+(classGroupName?" ("+classGroupName+")":"")+" te suivent sur tous tes appareils."}</p>}
        </div>
        {needPwd&&<>
          <PasswordInput value={pwd1} onChange={function(e){setPwd1(e.target.value);setPwdErr("");}} placeholder="Mot de passe (8 caractères min.)" autoComplete="new-password" style={inputSt}/>
          <PasswordInput value={pwd2} onChange={function(e){setPwd2(e.target.value);setPwdErr("");}} placeholder="Confirme le mot de passe" autoComplete="new-password"
            onKeyDown={function(e){if(e.key==="Enter")doAccount();}} style={Object.assign({},inputSt,{marginBottom:14})}/>
        </>}
        <div style={{textAlign:"left",padding:"12px 14px",background:"var(--bg2)",border:"1px solid var(--bdr)",borderRadius:12,marginBottom:14}}>
          <div className="out" style={{fontSize:11,fontWeight:700,color:"var(--t2)",textTransform:"uppercase",letterSpacing:1,marginBottom:8}}>{"Protection de tes données"}</div>
          <div style={{display:"flex",flexDirection:"column",gap:8}}>
            {gdprRows.map(function(r){return(
              <div key={r.h} style={{display:"flex",gap:9,alignItems:"flex-start"}}>
                <span style={{flexShrink:0,marginTop:1}}><GIcon name={r.ic} size={16} color="var(--cyan)"/></span>
                <p style={{fontSize:12,color:"var(--t2)",margin:0,lineHeight:1.45}}><b style={{color:"var(--t1)"}}>{r.h+" · "}</b>{r.tx}</p>
              </div>);})}
          </div>
          <button onClick={function(){setShowPrivacy(true);}} style={{background:"none",border:"none",padding:"8px 0 0",color:"var(--cyan)",fontSize:12,cursor:"pointer",fontFamily:"'DM Sans',sans-serif",textDecoration:"underline"}}>{"Lire la politique de confidentialité complète"}</button>
        </div>
        {pwdErr&&<div style={{color:"var(--red)",fontSize:13,marginBottom:12,textAlign:"center"}}>{pwdErr}</div>}
        {pwdExistsDup&&<button className="btn2" onClick={goSignIn}
          style={{width:"100%",fontSize:13,padding:"11px 16px",marginBottom:10,borderColor:"rgba(var(--cx),.25)",color:"var(--cyan)"}}>{"Me connecter avec mon mot de passe"}</button>}
        <button className="btn1" onClick={doAccount} disabled={pwdBusy}
          style={{width:"100%",fontSize:15,padding:"14px 20px",opacity:pwdBusy?.6:1}}>
          {pwdBusy?"Création…":(needPwd?"J’accepte et je crée mon compte":"J’accepte — continuer")}
        </button>
        {needPwd&&<div style={{marginTop:16,textAlign:"center"}}>
          <button onClick={goSignIn} style={{background:"none",border:"none",color:"var(--cyan)",fontSize:12,cursor:"pointer",fontFamily:"'DM Sans',sans-serif",textDecoration:"underline"}}>{"J'ai déjà un mot de passe — me connecter"}</button>
        </div>}
      </div></>}
    </div>);
  }

  // ─ Teacher login ─
  if(step==="teacher")return(
    <div className="app onboard-shell" style={{display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",minHeight:"100vh",padding:32,textAlign:"center"}}>
      <div style={{animation:"fadeIn .5s"}}>
        <div style={{fontSize:48,marginBottom:16}}>👨‍🏫</div>
        <h2 className="out" style={{fontWeight:800,fontSize:24,marginBottom:20}}>Teacher Dashboard</h2>
        {/* Biométrie proposée seulement si un code formateur est mémorisé (hasDashSession) : elle
            rouvre la session, elle n'en crée pas. Après un logout, le code a été purgé. */}
        {bioAvail&&bioRegistered&&hasDashSession()&&<button className="btn1" style={{marginBottom:20,display:"flex",alignItems:"center",justifyContent:"center",gap:10,width:"100%"}} onClick={async function(){
          try{var ok=await bioAuthenticate();if(ok)p.goTeacher();}catch(e){console.warn("[teacher] biometric auth failed:",e&&e.message);setTeacherErr(true);}
        }}><GIcon name="padlock" size={14} color="var(--cyan)" style={{marginRight:6,verticalAlign:"-2px"}}/>Unlock with biometrics</button>}
        {bioAvail&&bioRegistered&&hasDashSession()&&<div style={{fontSize:12,color:"var(--t3)",marginBottom:16}}>or enter code manually</div>}
        {bioAvail&&bioRegistered&&!hasDashSession()&&<div style={{fontSize:12,color:"var(--t3)",marginBottom:16}}>Enter your code once: biometric unlock will work again afterwards.</div>}
        <div style={{marginBottom:20,textAlign:"left"}}>
          <label className="out" style={{fontSize:12,fontWeight:600,color:"var(--t2)",textTransform:"uppercase",letterSpacing:1,marginBottom:8,display:"block"}}>Access code</label>
          <PasswordInput labelShow="Show code" labelHide="Hide code" value={teacherCode} onChange={function(e){sTC(e.target.value);}} placeholder="Enter teacher code..."
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
    // La First Quest ouvre le module (2026-10-22) : un visiteur (ou une promo hors école/pro) n'a pas accès
    // aux modules premium, on l'envoie sur le module gratuit de la même compétence plutôt que sur un verrou.
    // `{}` et non null : hasFullAccess(null) répond false avant de lire le type de promo.
    if(isModuleLocked(quest.mod,{},classGroupType)){
      var FREE_QUEST={grammar:"drill",vocab:"tavern",reading:"drill",listening:"lisP2"};
      var LABEL={drill:"Part 5 Drill",tavern:"Word Tavern",lisP2:"Listening Part 2 — Q&R"};
      var fm=FREE_QUEST[weakestSec];
      quest=Object.assign({},quest,{mod:fm,label:LABEL[fm],icon:fm==="lisP2"?"public-speaker":fm==="tavern"?"spell-book":"crossed-swords"});
    }

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

        {/* First Quest = l'action principale (2026-10-22). Avant, la carte n'était pas cliquable et la Home
            proposait ensuite un Mock : le rapport recommandait un module que rien ne permettait d'ouvrir. */}
        <button className="btn1" onClick={function(){stopTts();stopListenAudio();setPendingNav(quest.mod);sSt("account");}}
          style={{fontSize:16,padding:"14px 32px",width:"100%",marginBottom:10,background:"linear-gradient(135deg,var(--cx-hex),#8b5e83)"}}>
          {"Start my First Quest →"}
        </button>
        <button className="btn2" onClick={function(){stopTts();stopListenAudio();setPendingNav(null);sSt("account");}}
          style={{fontSize:13,padding:"11px 28px",width:"100%"}}>
          {"Go to the Arena"}
        </button>
        <p style={{color:"var(--t3)",fontSize:11,marginTop:12,lineHeight:1.5}}>Your radar refines as you train. Aldric will greet you inside, and your Mentor is one tap away whenever you want a personalized path.</p>
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
  // Set only by startTestV2(); the sections then chain with no intermediate screen (2026-10-22).
  if(scanPhase==="welcome")return(
    <div className="app onboard-shell" style={{display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",minHeight:"100vh",padding:32,textAlign:"center"}}>
      <div style={{animation:"fadeIn .5s",width:"100%",maxWidth:360}}>
        <div className="out" style={{fontSize:11,fontWeight:700,color:"var(--t3)",textTransform:"uppercase",letterSpacing:2,marginBottom:14}}>Battle Scan</div>
        <div style={{marginBottom:18,animation:"countUp .6s"}}><GIcon name="coliseum" size={64} color="var(--cyan)"/></div>
        <h2 className="out" style={{fontFamily:"'Cinzel',serif",fontWeight:900,fontSize:26,color:"var(--cyan)",marginBottom:12}}>{"Ta première épreuve"}</h2>
        <p style={{color:"var(--t2)",fontSize:14,lineHeight:1.65,marginBottom:16,maxWidth:330,margin:"0 auto 16px"}}>{"Avant de bâtir ta légende, l’arène doit jauger ton niveau. Cette épreuve adaptative fixera le point de départ de ta quête."}</p>
        <div className="crd" style={{padding:"12px 16px",marginBottom:22,background:"rgba(var(--cx),.06)",borderColor:"rgba(var(--cx),.15)",fontSize:12,color:"var(--t2)",lineHeight:1.55,textAlign:"left"}}>
          {"Quatre sections — grammaire, vocabulaire, lecture et écoute. Les questions s’ajustent à tes réponses. Pas de chrono, aucun piège : réponds du mieux que tu peux."}
        </div>
        {/* Annonce du passage à l'anglais (ex-écran langBridge, fusionné ici le 2026-10-22) : c'est à la
            section suivante que l'anglais commence, pas après le Battle Report. */}
        <p style={{color:"var(--t1)",fontSize:13,fontWeight:600,lineHeight:1.55,margin:"0 auto 22px",maxWidth:330}}>{"À partir d’ici, tout se passe en anglais : questions, consignes, explications. C’est l’immersion qui fait progresser."}</p>
        <p style={{color:"var(--t3)",fontSize:11,lineHeight:1.5,margin:"-10px auto 18px",maxWidth:330}}>{"Rien n’est enregistré avant la fin : tes réponses restent sur cet appareil jusqu’à ce que tu valides ton entrée."}</p>
        <button className="btn1" onClick={beginSectionV2} style={{fontSize:16,padding:"14px 32px",width:"100%"}}>{"Commencer l’épreuve"}</button>
      </div>
    </div>);

  // Question phase (V2)
  if(!currentQ){
    return(<div className="app onboard-shell" style={{padding:"20px 16px",minHeight:"100vh"}}>
      <p style={{color:"var(--t2)",textAlign:"center",marginTop:40}}>Loading next question...</p>
    </div>);
  }

  var ctrl=ctrlRef.current;
  var qNum=ctrl?(ctrl.score().total+(scanPhase==="q"?1:0)):1;
  // Numérotation sur tout le scan : sections finies (leur vrai total) + section en cours.
  var doneBefore=SCAN_SECTION_ORDER.slice(0,scanSec).reduce(function(a,sid){var r=sectionResults[sid];return a+(r?r.total:BATTLE_SCAN_V2[sid].targetCount);},0);
  var scanTotal=doneBefore+SCAN_SECTION_ORDER.slice(scanSec).reduce(function(a,sid){return a+BATTLE_SCAN_V2[sid].targetCount;},0);
  var gNum=doneBefore+qNum;
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
          <p style={{fontSize:11,color:"var(--t3)",marginTop:2}}>{"Question "+gNum+" of "+scanTotal}</p>
        </div>
      </div>
      {/* Une barre pour tout le scan, un segment par section (largeur = nombre de questions). */}
      <div style={{display:"flex",gap:4}}>
        {SCAN_SECTION_ORDER.map(function(sid,i){var sm=BATTLE_SCAN_V2[sid];var fill=i<scanSec?1:i>scanSec?0:Math.min(1,qNum/sm.targetCount);return(
          <div key={sid} style={{flex:sm.targetCount,height:5,borderRadius:99,background:"var(--bg3)",overflow:"hidden"}}>
            <div style={{width:(fill*100)+"%",height:"100%",background:sm.color,transition:"width .4s"}}/>
          </div>);})}
      </div>
      {/* Bandeau de section sur sa première question : remplace l'ancien écran d'intro. */}
      {qNum===1&&<div key={secId} className="crd" style={{marginTop:12,padding:"10px 14px",display:"flex",gap:12,alignItems:"center",animation:"fadeIn .5s"}}>
        <GIcon name={secMeta.icon} size={30} color={secMeta.color}/>
        <div style={{minWidth:0}}>
          <div className="out" style={{fontSize:10,fontWeight:700,color:"var(--t3)",textTransform:"uppercase",letterSpacing:1.5}}>{"Section "+(scanSec+1)+" of "+SCAN_SECTION_ORDER.length}</div>
          <div className="out" style={{fontWeight:800,fontSize:15,color:secMeta.color}}>{secMeta.name}</div>
          <div style={{fontSize:12,color:"var(--t2)",lineHeight:1.4}}>{secMeta.subtitle+(secId==="listening"?" · Turn your sound on":"")}</div>
        </div>
      </div>}

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
