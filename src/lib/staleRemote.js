// Garde « stale-remote » — pure, requérable en Node (tests/check_fresher_local.cjs).
//
// POURQUOI (extrait de load() le 2026-09-16). Quand les sauvegardes échouent (schéma cassé,
// session qui n'est pas la bonne…), la progression s'accumule dans la copie LOCALE pendant que
// Supabase reste en arrière. L'XP étant cumulative (elle ne baisse jamais), « local.xp > distant »
// ET « local actif au moins aussi récemment » est un signal fiable que le local détient une
// progression jamais remontée. Utilisée par load() depuis toujours, et par recover() /
// recoverByEmail() depuis le 2026-09-16 : sans elle, une reconnexion après une session perdue
// écrasait ce qui avait été joué pendant la panne.
//
// Les champs SERVEUR (class_code, access_level, access_expires_at, email) viennent toujours du
// distant : ils changent par webhook Stripe, SQL admin ou migration de promo, jamais par
// l'activité de l'élève. Sans cette fusion, un élève payant ou scolarisé repasserait en
// visitor/free simplement parce que son local avait plus d'XP.
import { normalizeName } from "./util.js";

// remote = ligne `students` brute (clés DB : xp, last_active, class_code…), local = profil client.
// Renvoie une COPIE du local fusionnée avec les champs serveur si le local est plus frais, sinon null.
export function pickFresherLocal(remote,local){
  if(!remote||!local)return null;
  var localXp=local.xp||0;
  var remoteXp=remote.xp||0;
  var localLA=local.lastActive||"";
  var remoteLA=remote.last_active||"";
  if(!(localXp>remoteXp&&localLA>=remoteLA))return null;
  var m=Object.assign({},local);
  if(remote.class_code)m.classCode=remote.class_code;
  if(remote.access_level)m.accessLevel=remote.access_level;
  if(remote.access_expires_at!==undefined)m.accessExpiresAt=remote.access_expires_at;
  if(remote.email)m.email=remote.email;
  return m;
}

// Le profil local est-il celui de cette ligne ? Même règle de nom que le lookup de l'onboarding
// (casse et accents ignorés), class_code exact. Garde-fou des appareils partagés : la progression
// d'un élève ne doit jamais être fusionnée dans la ligne d'un autre.
export function isSameStudent(local,remote){
  if(!local||!remote)return false;
  return normalizeName(local.name||"")===normalizeName(remote.name||"")
    &&(local.classCode||"visitor")===(remote.class_code||"visitor");
}
