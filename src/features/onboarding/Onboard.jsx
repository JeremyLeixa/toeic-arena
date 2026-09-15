// Extrait de src/App.jsx le 2026-09-15 (refactor split-app, REFACTOR_PLAN.md). Code déplacé tel quel.
import { signUpWithPassword, signInStudent, bindStudentUserId, signUpStudent, signInWithPassword, requestPasswordReset } from "../../auth.js";
import { Bar } from "../../components/Bar.jsx";
import { BrandMark, GIcon } from "../../components/icons.jsx";
import { PrivacyPolicy } from "../../components/legal.jsx";
import { PassageDocs } from "../../components/PassageDocs.jsx";
import { SCAN_SECTION_ORDER, BATTLE_SCAN_V2 } from "../../data/placement.js";
import { resumeAudioSession, stopListenAudio, getEnVoice, playAudioFile, isAudioAborted } from "../../lib/audio.js";
import { isStandalonePWA, isIOSDevice } from "../../lib/device.js";
import { getBioCredId, biometricAvailable, bioAuthenticate, teacherAuth, setDashSession } from "../../lib/teacherSession.js";
import { normalizeName } from "../../lib/util.js";
import { createCatController, computeScanResult } from "../../scanEngine.js";
import { playCorrect, playWrong, playArenaCall } from "../../sounds.js";
import { supabase } from "../../supabase.js";
import { useState, useRef, useEffect } from "react";

// ─── ONBOARDING ───
export function Onboard(p){
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
