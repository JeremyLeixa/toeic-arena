// Extrait de src/App.jsx le 2026-09-15 (refactor split-app, REFACTOR_PLAN.md). Code déplacé tel quel.
import { supabase } from "../supabase.js";
import { supaToLocal, buildSavePayload } from "./profileSchema.js";
import { pickFresherLocal } from "./staleRemote.js";

// ─── localStorage-first persistence layer ───
// Clés réelles : "toeic-arena-profile" / "toeic-arena-name" / "toeic-arena-class" (loadLocal,
// saveLocal). L'ancienne clé SK="toeic-arena-v2" (schéma mono-clé pré-v2) a été supprimée le
// 2026-09-16 : plus aucun lecteur.
export var _cachedUserId=null;
export var _syncDirty=false;
// Clean up dirty flag — no longer used, was causing cross-device overwrites
try{localStorage.removeItem("toeic-arena-dirty");}catch(e){}
export function loadLocal(){
  try{
    var raw=localStorage.getItem("toeic-arena-profile");
    if(raw){var d=JSON.parse(raw);if(d&&d.name)return d;}
  }catch(e){}
  return null;
}
export function saveLocal(d){
  try{
    localStorage.setItem("toeic-arena-profile",JSON.stringify(d));
    localStorage.setItem("toeic-arena-name",d.name);
    localStorage.setItem("toeic-arena-class",d.classCode||"visitor");
    _syncDirty=true;
  // Loggé (règle n°1) : quota plein (photo d'avatar en data URL, navigation privée iOS) → la
  // copie locale n'est pas écrite ET _syncDirty reste false, donc onUnload saute la sauvegarde
  // de dernière chance. save() vers Supabase n'en dépend pas.
  }catch(e){console.warn("[saveLocal] caught:",e&&e.message);}
}
// Lecture SYNCHRONE du JWT user depuis le storage supabase-js (clé sb-<ref>-auth-token).
// P2 Phase B (B2) : le keepalive beforeunload ne peut pas await getSession(), donc il lit
// le token ici pour l'envoyer en Bearer au lieu de la clé anon → sous RLS (Phase C),
// auth.uid() est renseigné et l'UPDATE de sa PROPRE ligne passe (la clé anon donnerait
// auth.uid()=NULL → refus). Retourne null si absent/illisible (fallback anon côté appelant).
export function getAccessTokenSync(){
  try{
    for(var i=0;i<localStorage.length;i++){
      var k=localStorage.key(i);
      if(k&&k.slice(0,3)==="sb-"&&k.indexOf("-auth-token")>0){
        var raw=localStorage.getItem(k); if(!raw)continue;
        var o=JSON.parse(raw);
        var tok=o&&(o.access_token||(o.currentSession&&o.currentSession.access_token));
        if(tok)return tok;
      }
    }
  }catch(e){console.warn("[auth] getAccessTokenSync caught:",e&&e.message);}
  return null;
}
// ── Session perdue : canal vers App (F1/F2, 2026-09-16) ──
// load() et save() découvrent qu'une ligne existe mais que la session courante ne peut ni la lire
// ni l'écrire (not_owner). Ce module n'a pas accès à l'état React : il notifie, App décide
// (reconnexion au démarrage, bandeau en cours de session). Cible = {name, classCode}.
var _authLostListeners=[];
export function onAuthLost(fn){
  _authLostListeners.push(fn);
  return function(){_authLostListeners=_authLostListeners.filter(function(f){return f!==fn;});};
}
function notifyAuthLost(target){
  _authLostListeners.slice().forEach(function(fn){
    try{fn(target);}catch(e){console.warn("[authLost] listener caught:",e&&e.message);}
  });
}
// load() — always fetch from Supabase when online, use localStorage as fallback
export async function load(userId){
  var local=loadLocal();
  console.warn("[LOAD] start — userId:",userId?"yes":"no","local:",local?local.name:"null");
  if(userId)_cachedUserId=userId;
  // Try to fetch the freshest data from Supabase
  if(userId){
    try{
      var cn=local?local.name:null;
      if(!cn)try{cn=localStorage.getItem("toeic-arena-name");}catch(e){}
      var cc=local?local.classCode:null;
      if(!cc)try{cc=localStorage.getItem("toeic-arena-class");}catch(e){}
      console.warn("[LOAD] querying Supabase for:",cn,cc);
      var remote=null;
      // Phase C-lite : plus de SELECT direct sur `students` (le rôle anon n'y a plus
      // aucun privilège). La RPC renvoie la ligne COMPLÈTE, non aliasée — le garde
      // stale-remote plus bas lit des clés DB brutes (remote.class_code, access_level…)
      // avant que supaToLocal ne tourne, donc surtout pas de projection camelCase ici.
      // La RPC applique la garde conditionnelle : ligne migrée → il faut être le
      // propriétaire ; ligne legacy → tolérance. Un refus renvoie null SANS erreur, comme
      // une ligne inexistante : c'est le bloc « no remote » plus bas qui les distingue.
      var rpcFailed=false; // une RPC en erreur (hors ligne…) → on ne conclut rien, copie locale
      if(cn){
        var res=await supabase.rpc("load_student",{p_name:cn,p_class_code:cc||"visitor"});
        if(res.error){console.error("[LOAD] load_student error:",res.error.message);rpcFailed=true;}
        if(res.data)remote=res.data;
      }
      // Chemin de secours : la ligne liée à la session courante (binding Phase A).
      if(!remote){
        console.warn("[LOAD] primary miss, trying fallback by user_id");
        var res2=await supabase.rpc("load_student_by_uid");
        // Cette erreur était totalement avalée : sous verrou de privilèges, l'app
        // paraissait « hors ligne » au lieu de cassée, ce qui rend un incident
        // indétectable. On la logge maintenant.
        if(res2.error){console.error("[LOAD] load_student_by_uid error:",res2.error.message);rpcFailed=true;}
        if(res2.data)remote=res2.data;
      }
      if(remote){
        console.warn("[LOAD] got remote — xp:",remote.xp,"weekly_xp:",remote.weekly_xp,"streak:",remote.streak);
        // ── Stale-remote guard ── (lib/staleRemote.js : règle, champs serveur et raisons)
        // Local plus frais que le distant → on garde le local fusionné avec les champs serveur
        // et on le repousse tout de suite.
        var fresher=pickFresherLocal(remote,local);
        if(fresher){
          console.warn("[LOAD] local is fresher (xp "+(local.xp||0)+">"+(remote.xp||0)+", lastActive "+(local.lastActive||"")+">="+(remote.last_active||"")+") — merging with remote server-side fields");
          _syncDirty=true;
          saveLocal(fresher); // persist the merged classCode/accessLevel so subsequent saves don't regress
          // Fire-and-forget: push local to Supabase immediately so device-switching works.
          save(fresher);
          return fresher;
        }
        var d=supaToLocal(remote);
        saveLocal(d);
        _syncDirty=false;
        return d;
      }else{
        console.warn("[LOAD] no remote data found");
        // ── Session perdue (F1, 2026-09-16) ── Les deux lectures ont RÉPONDU mais rien rendu.
        // Si la ligne existe pourtant (lookup public de l'onboarding), c'est que CETTE session ne
        // peut pas la lire : compte sécurisé, session révoquée (signOut global sur un autre
        // appareil → ensureAuthSession a recréé une session anonyme) ou entrée sans mot de passe.
        // Rendre la copie locale ici faisait jouer l'élève sans qu'aucune sauvegarde ne passe,
        // sans rien lui dire (vécu le 2026-09-16). On rend null et on signale : App renvoie vers
        // « entre ton mot de passe », et la copie locale, laissée intacte, est récupérée à la
        // reconnexion (recover → fresherLocalFor). Ligne inexistante (0 résultat) ou RPC en
        // erreur : comportement d'avant, copie locale.
        if(cn&&!rpcFailed){
          var fr=await supabase.rpc("find_students_by_name",{p_name:cn,p_class_code:cc||"visitor"});
          if(fr.error)console.warn("[LOAD] find_students_by_name error:",fr.error.message);
          else if((fr.data||[]).length>0){
            console.error("[LOAD] refused: row exists but this session cannot read it (not_owner) —",cn,cc||"visitor","→ re-authentication");
            notifyAuthLost({name:cn,classCode:cc||"visitor"});
            return null;
          }
        }
      }
    }catch(e){
      // Regle #1 (post-crise) : plus de catch muet sur un chemin critique. Sous le
      // verrou de privileges, une erreur ici est indiscernable d'une panne reseau
      // si on ne la logge pas.
      console.warn("[LOAD] caught:",e&&e.message);
    }
  }
  // Offline or no userId: use localStorage
  return local||null;
}
// Recover an auth session if the current one has been lost (refresh token expired,
// tab backgrounded too long, etc). Returns a user object or null if recovery failed.
export async function ensureAuthSession(){
  try{
    var sess=await supabase.auth.getUser();
    if(sess.data&&sess.data.user)return sess.data.user;
  }catch(e){/* session missing — fall through to recovery */}
  // Try to refresh first (session may exist in storage but JWT expired)
  try{
    var refreshed=await supabase.auth.refreshSession();
    if(refreshed.data&&refreshed.data.user){console.warn("[AUTH] recovered via refreshSession");return refreshed.data.user;}
  }catch(e){/* refresh failed — need a new session */}
  // Last resort: new anonymous session. save()'s UPDATE matches by (name, class_code)
  // not id, so the row stays reachable even though the user_id changed.
  try{
    var anon=await supabase.auth.signInAnonymously();
    if(anon.data&&anon.data.user){console.warn("[AUTH] recovered via new anon session");return anon.data.user;}
  }catch(e){/* fully stuck */}
  return null;
}
// opts.allowInsert — autorise la création d'une ligne pour un prénom déjà présent
// dans une AUTRE promo (homonyme légitime). Seul onboard() le passe. Voir le garde
// anti-phantom plus bas.
export async function save(d,opts){
  saveLocal(d);
  if(!d||!d.name){console.warn("[SAVE] skip: no data or name");return;}
  // Safety rail: never let a missing classCode fall through to the "visitor" fallback
  // during an UPDATE — this could match (name, visitor) and either overwrite another
  // student's row or create a phantom. Refuse to save instead; local keeps the state.
  if(!d.classCode){console.error("[SAVE] BLOCKED: missing classCode for",d.name,"— refusing to sync to avoid corruption");return;}
  // Teacher now syncs to Supabase (hidden from leaderboards via League/TeacherDash filters)
  var user=await ensureAuthSession();
  if(!user){console.error("[SAVE] BLOCKED: could not establish auth session");return;}
  _cachedUserId=user.id;
  var payload=buildSavePayload(d);
  // Phase C-lite : le binding d'identité n'est plus injecté dans le payload. La RPC
  // pose user_id AVEC auth.uid(), jamais avec une valeur fournie par le client — on ne
  // fait plus confiance à l'appelant sur cette colonne. opts.bindAuth devient un simple
  // drapeau (passé par onboard() lors d'un signup PASSWORD).
  var cc=d.classCode||"visitor";
  try{
    // Phase C-lite : UPDATE, garde anti-phantom et INSERT sont désormais UNE seule
    // transaction côté serveur. Trois gains :
    //  · le rôle anon n'a plus aucun privilège sur `students` (fichier SQL 2) ;
    //  · la liste blanche de colonnes est appliquée par le serveur, donc access_level,
    //    access_expires_at et arena_marks deviennent inécrivables quoi qu'on envoie —
    //    jusqu'ici ils n'étaient exclus que par ce fichier JS, un PATCH REST direct
    //    passait outre (finding C3, à moitié fermé) ;
    //  · la garde anti-phantom n'est plus contournable en sautant le client.
    // La RPC fusionne : seules les clés présentes dans le payload sont écrites, ce qui
    // rend le payload réduit du keepalive sans danger.
    var r=await supabase.rpc("save_student",{
      p_name:d.name,p_class_code:cc,p_payload:payload,
      p_allow_insert:!!(opts&&opts.allowInsert),
      p_bind_auth:!!(opts&&opts.bindAuth)
    });
    if(r.error){console.error("[SAVE] rpc error:",r.error.message);return;}
    var dd=r.data||{};
    if(!dd.ok){
      // blocked_phantom : le prénom existe dans une AUTRE promo et l'appel ne vient pas
      // d'onboard(). C'est le cas qui fabriquait les lignes fantômes quand le classCode
      // local dérivait vers "visitor". not_owner : la ligne appartient à un compte migré
      // qui n'est pas celui de la session.
      console.error("[SAVE] refused:",dd.error,dd.codes?("| aussi dans: "+JSON.stringify(dd.codes)):"");
      return;
    }
    console.warn("[SAVE] OK —",d.name,cc,dd.action);
    _syncDirty=false;
  }catch(e){console.warn("[SAVE] Exception:",e);}
}
// syncToCloud() — replaced by save(), kept as no-op for existing call sites
export async function syncToCloud(d,opts){
  if(!d||!d.name||!_syncDirty)return;
  return save(d,opts);
}

// Accesseurs ajoutés au découpage (2026-09-15). Une `var` exportée est une liaison en
// lecture seule pour ses importateurs : App() assignait _cachedUserId et _syncDirty
// directement dans le monolithe. Les lectures continuent de passer par la liaison vivante.
export function setCachedUserId(v){_cachedUserId=v;}
export function setSyncDirty(v){_syncDirty=v;}
