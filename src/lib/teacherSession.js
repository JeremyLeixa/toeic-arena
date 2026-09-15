// Extrait de src/App.jsx le 2026-09-15 (refactor split-app, REFACTOR_PLAN.md). Code déplacé tel quel.
import { supabase } from "../supabase.js";

// ─── MULTI-CAMPUS TEACHER SCOPING (soft, UI-level — 2026-07-02) ───
// Each teacher logs in with their own teacher_code and sees ONLY the groups
// stamped with that code (groups.teacher_code). The ADMIN master code bypasses
// the filter and sees every group (Jérémy's super-admin role).
// IMPORTANT: this is a CLIENT-side guard, not a security boundary — RLS is OFF
// on students. Fine for good-faith partner teachers; a real data-isolation
// boundary requires Supabase Auth + RLS (deferred "hard" version).
// The logged-in code is stored at login in localStorage['toeic-dash-teacher'].
// SECURITY (2026-09-11, finding H2) — deux trous fermés à l'époque : plus de code
// admin en dur dans le bundle (il venait de VITE_ADMIN_TEACHER_CODE, fail-closed
// si absent), et un code vide n'était plus admin (avant, vider localStorage
// suffisait à devenir super-admin). Conséquence assumée, toujours valable : les
// sessions "code vide" (dont le déverrouillage biométrique) doivent se reconnecter
// une fois avec leur code pour retrouver leur scope.
// Depuis B4 (2026-09-13) le rôle admin ne vient plus du bundle du tout : il est
// décidé par le serveur (table privée `teacher_codes`) — voir ci-dessous.
// SECURITY (2026-09-13, finding H3 — B4) : la validation du code et le listing
// des cohortes passent maintenant par la RPC `teacher_groups` (SECURITY DEFINER).
// POURQUOI. Avant, le login était `groups.select('code').eq('teacher_code',code)`
// exécuté avec la clé anon. Comme `groups` est lisible par anon, n'importe qui
// faisait `select('teacher_code')` dans la console, récupérait TOUS les codes
// formateur et ouvrait le dashboard → PII de tous les élèves. La migration
// 2026-09-13_p2b4_lock_groups.sql retire la colonne `teacher_code` de la portée
// du rôle anon (lecture ET écriture) : ce chemin client n'est donc plus possible,
// et ne doit plus être utilisé. NE PAS réintroduire de `.eq('teacher_code',…)`
// ni de `select('*')` sur `groups` côté client — les deux échouent désormais.
// Le rôle (teacher/admin) est décidé par le serveur et mémorisé dans
// localStorage['toeic-dash-role'] : c'est un confort d'affichage, PAS la
// frontière de sécurité (celle-ci est le scoping SQL des RPC).
// ⚠️ Rappel : tant que la RLS est OFF sur `students` (Phase C), un attaquant peut
// encore lire la table en direct via curl. B4 ferme l'usurpation d'identité
// enseignante, pas l'exposition de `students`.
export function getDashTeacher(){try{return localStorage.getItem('toeic-dash-teacher')||"";}catch(e){console.warn("[teacher-scope] read failed:",e&&e.message);return"";}}
export function getDashRole(){try{return localStorage.getItem('toeic-dash-role')||"";}catch(e){console.warn("[teacher-scope] role read failed:",e&&e.message);return"";}}
export function setDashSession(code,role){try{localStorage.setItem('toeic-dash-teacher',code);localStorage.setItem('toeic-dash-role',role||"teacher");}catch(e){console.warn("[teacher] session store failed:",e&&e.message);}}
// Avant B4, AUCUN chemin de déconnexion (logout, deleteAccount, reset,
// signOutCompletely) n'effaçait le code formateur : une session enseignante
// survivait indéfiniment sur un poste partagé. Appelée depuis les 3 chemins de
// App.jsx + signOutCompletely (auth.js) + le bouton de déconnexion du dashboard.
export function clearDashSession(){try{localStorage.removeItem('toeic-dash-teacher');localStorage.removeItem('toeic-dash-role');localStorage.removeItem('toeic-dash-group');}catch(e){console.warn("[teacher] session clear failed:",e&&e.message);}}
export function isDashAdmin(){return getDashRole()==="admin";}
// Valide un code formateur ET renvoie ses cohortes, côté serveur.
// → {ok:true, role:"teacher"|"admin", groups:[…sans teacher_code…]}
// → {ok:false, error:"invalid_code"|"rpc_error"}
// SEUL chemin de validation possible depuis le client : depuis la migration
// 2026-09-13_p2b4_lock_groups.sql, anon/authenticated n'ont plus aucun droit sur
// `groups` au niveau table (SELECT accordé colonne par colonne, teacher_code et
// teacher_email exclus). Un `.eq('teacher_code',…)` ou un `select('*')` échouerait.
// Il n'y a plus de fallback : si la RPC répond mal, on refuse, bruyamment.
export async function teacherAuth(code){
  if(!code)return{ok:false,error:"invalid_code"};
  try{
    var r=await supabase.rpc('teacher_groups',{p_code:code});
    if(r.error){console.warn("[teacher] teacher_groups failed:",r.error.message);return{ok:false,error:"rpc_error"};}
    var d=r.data||{};
    if(d.ok)return{ok:true,role:d.role||"teacher",groups:d.groups||[]};
    return{ok:false,error:d.error||"invalid_code"};
  }catch(e){console.warn("[teacher] teacher_groups caught:",e&&e.message);return{ok:false,error:"rpc_error"};}
}
// B3 (2026-09-14) — colonnes lues par le Teacher Dashboard.
// Avant, les 3 chargements de roster faisaient `select('*')` : 200 lignes COMPLETES,
// email / access_level / access_expires_at / user_id / password_set_at / gdpr_consent /
// arena_marks compris, alors que ni l'UI ni l'export CSV n'en utilisent une seule
// (verifie ligne par ligne sur tout le composant). Pur sur-fetch de PII.
// Cette liste est l'union EXACTE de ce que le dashboard consomme. Si une colonne
// manque, c'est un rendu vide silencieux : reverifier l'export CSV en priorite, c'est
// le plus large consommateur.
// MISSION_MODULES melange des emoji et des cles d'icone SVG : la migration
// emoji->SVG n'a converti que lisP4 ("public-speaker"), ses 19 voisines sont restees
// en emoji. Les rendus doivent donc gerer LES DEUX (pattern de repli documente :
// GAME_ICON_PATHS[x] ? <GIcon/> : x). Dans un <option>, une SVG est impossible :
// on n'affiche l'icone que si c'en est une, sinon la cle s'afficherait en toutes
// lettres — c'est ce qui donnait "public-speaker Listening Part 4" dans le dashboard.
export function optIcon(ic){if(!ic)return"";for(var k=0;k<ic.length;k++){if(ic.charCodeAt(k)>127)return ic;}return"";}
// ─── BIOMETRIC AUTH (WebAuthn) for Teacher Dashboard ───
export var BIOMETRIC_KEY="toeic-teacher-bio";
export async function biometricAvailable(){try{if(!window.PublicKeyCredential)return false;return await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();}catch(e){return false;}}
export function getBioCredId(){try{var v=localStorage.getItem(BIOMETRIC_KEY);return v?Uint8Array.from(atob(v),function(c){return c.charCodeAt(0);}):null;}catch(e){return null;}}
export function storeBioCredId(rawId){try{var b=btoa(String.fromCharCode.apply(null,new Uint8Array(rawId)));localStorage.setItem(BIOMETRIC_KEY,b);}catch(e){}}
export async function bioRegister(){
  var challenge=crypto.getRandomValues(new Uint8Array(32));
  var userId=crypto.getRandomValues(new Uint8Array(16));
  var opts={publicKey:{
    challenge:challenge,rp:{name:"Verse Arena"},
    user:{id:userId,name:"teacher",displayName:"Teacher"},
    pubKeyCredParams:[{alg:-7,type:"public-key"},{alg:-257,type:"public-key"}],
    authenticatorSelection:{authenticatorAttachment:"platform",userVerification:"required"},
    timeout:120000
  }};
  var cred=await navigator.credentials.create(opts);
  storeBioCredId(cred.rawId);return true;
}
export async function bioAuthenticate(){
  var credId=getBioCredId();if(!credId)return false;
  var challenge=crypto.getRandomValues(new Uint8Array(32));
  await navigator.credentials.get({publicKey:{
    challenge:challenge,allowCredentials:[{id:credId,type:"public-key",transports:["internal"]}],
    userVerification:"required",timeout:120000
  }});
  return true;
}
