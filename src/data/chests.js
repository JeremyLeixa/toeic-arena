// ─── CHEST SYSTEM — Data & Logic ───
import { supabase } from "../supabase.js";
// Données pures (catalogues, tables de tirage) : src/data/chestCatalog.js, ré-exportées ici.
export { RARITIES, CHEST_TYPES, AVATARS, SKINS, FRAMES, TITLES, TOKEN_TYPES, CHEAT_SHEETS, SHOP_CATALOG, DROP_TABLES, pickRewards, UNIQUE_TRIGGERS, NOVICE_ACHIEVEMENTS, EPIC_ACHIEVEMENTS, LEGENDARY_ACHIEVEMENTS, rollRarity, pickReward } from "./chestCatalog.js";
import { RARITIES } from "./chestCatalog.js";

// ═══ SUPABASE HELPERS ═══
// Lot 4 du verrou des tables satellites (2026-09-15) : plus aucun accès direct
// à pending_chests / chest_log / player_rewards / player_tokens depuis le
// navigateur. Les quatre tables étaient lisibles ET écrivables avec la clé
// publique — inventaire de n'importe quel élève lisible, coffres d'autrui
// supprimables. Tout passe désormais par des RPC SECURITY DEFINER gardées par
// student_guard.

// Grant a pending chest. `cooldownDays` = null → one-shot trigger (xp_10k,
// mock_1, ach_*…) ; 7 → re-grantable after a week (perfect module runs).
//
// ⚠️ CHANGEMENT DE COMPORTEMENT ASSUMÉ : cette fonction remplace le couple
// hasUniqueTrigger()/isWeeklyCooldown() PUIS grantChest(), qui était un TOCTOU.
// Entre le check et l'INSERT, rien n'empêchait un second appel de passer —
// c'est exactement ce qui a produit les pending_chests en double et les +37k XP
// fantômes du 2026-04-27 (watcher de maîtrise re-déclenché sur chaque sv()).
// Le check et l'insert sont maintenant dans la même transaction SQL.
// Retourne {ok, granted} ; `granted` vaut false si le trigger est déjà servi.
export async function grantChest(userName, classCode, chestType, triggerSource, cooldownDays){
  try{
    var res=await supabase.rpc("grant_pending_chest",{
      p_name:userName, p_class_code:classCode,
      p_chest_type:chestType, p_trigger:triggerSource,
      p_cooldown_days:(cooldownDays===undefined?null:cooldownDays),
    });
    if(res.error){console.error("[CHEST] grantChest RPC error:",res.error.message);return{ok:false,granted:false};}
    if(res.data&&res.data.ok===false){console.warn("[CHEST] grantChest refused:",res.data.error);return{ok:false,granted:false};}
    return{ok:true,granted:!!(res.data&&res.data.granted)};
  }catch(e){console.error("[CHEST] grantChest exception:",e&&e.message);return{ok:false,granted:false};}
}

// Get pending chests for a user
export async function getPendingChests(userName, classCode){
  try{
    var res=await supabase.rpc("my_pending_chests",{p_name:userName,p_class_code:classCode});
    if(res.error){console.error("[CHEST] getPendingChests error:",res.error.message);return[];}
    if(res.data&&res.data.ok===false){console.warn("[CHEST] getPendingChests refused:",res.data.error);return[];}
    return(res.data&&res.data.chests)||[];
  }catch(e){console.error("[CHEST] getPendingChests exception:",e&&e.message);return[];}
}

// Get owned rewards (avatars + skins + frames + titles + cheat_sheets — all stored in player_rewards)
export async function getOwnedRewards(userName, classCode){
  try{
    var res=await supabase.rpc("my_rewards",{p_name:userName,p_class_code:classCode});
    if(res.error){console.error("[CHEST] getOwnedRewards error:",res.error.message);return[];}
    if(res.data&&res.data.ok===false){console.warn("[CHEST] getOwnedRewards refused:",res.data.error);return[];}
    return(res.data&&res.data.rewards)||[];
  }catch(e){console.error("[CHEST] getOwnedRewards exception:",e&&e.message);return[];}
}

// V2 — get owned tokens, returns {token_type: quantity, ...}
export async function getOwnedTokens(userName, classCode){
  try{
    var res=await supabase.rpc("my_tokens",{p_name:userName,p_class_code:classCode});
    if(res.error){console.warn("[CHEST] getOwnedTokens error:",res.error.message);return{};}
    if(res.data&&res.data.ok===false){console.warn("[CHEST] getOwnedTokens refused:",res.data.error);return{};}
    var map={};
    ((res.data&&res.data.tokens)||[]).forEach(function(r){map[r.token_type]=r.quantity||0;});
    return map;
  }catch(e){console.warn("[CHEST] getOwnedTokens exception:",e&&e.message);return{};}
}

// V2 — consume a token via the SQL helper. Returns {ok, error?}.
// Used by Streak Shield (passive), Daily Reroll, Mock/Boss Reset, Endless Resurrect, etc.
export async function consumeToken(userName, classCode, tokenType, amount){
  try{
    var res=await supabase.rpc("consume_token",{
      p_user_name:userName, p_class_code:classCode,
      p_token_type:tokenType, p_amount:amount||1,
    });
    if(res.error)return{ok:false,error:res.error.message};
    if(res.data===false)return{ok:false,error:"insufficient_quantity"};
    return{ok:true};
  }catch(e){return{ok:false,error:e&&e.message};}
}

// Arena Shop P2 (2026-06-01) — spend Darics on a catalog item via the atomic
// spend_marks RPC. Mirror of consumeToken. `item` = a SHOP_CATALOG entry.
// Returns {ok, balance?, error?}. The RPC handles balance check, ownership/cap
// check, decrement, grant (player_rewards or grant_token), and ledger — all in
// one transaction. Error codes: no_student / already_owned / at_cap / insufficient_marks.
export async function spendMarks(userName, classCode, item){
  try{
    // Économie côté serveur, lot 1 (2026-09-24) : seul l'identifiant part. Prix, catégorie, rareté, plafond et
    // « déjà possédé » sont lus par le serveur dans shop_catalog (buy_item) — le client ne peut plus les choisir.
    var res=await supabase.rpc("buy_item",{p_name:userName, p_class_code:classCode, p_item_id:item.item_id});
    if(res.error){console.warn("[SHOP] buy_item RPC error:",res.error.message);return{ok:false,error:res.error.message};}
    return res.data||{ok:false,error:"empty_response"}; // {ok, balance?, error?}
  }catch(e){console.warn("[SHOP] spendMarks exception:",e&&e.message);return{ok:false,error:e&&e.message};}
}

// Économie côté serveur, lot 2c (2026-09-24) : les conversions sont décidées par le SERVEUR, en une
// transaction (convert_dups_to_token, convert_tokens_premium). Le client ne choisit plus le jeton rendu et ne
// s'accorde plus rien lui-même. Jetons rendus : non premium = ni premium ni boost dans TOKEN_TYPES ; premium = premium
// sauf insight_token (réservé au Légendaire). tests/check_economy_parity.cjs compare avec le SQL.

// 3 doublons d'un cosmétique (4 exemplaires au moins, le plus ancien gardé) → 1 jeton non premium, ou 100 XP
// si tous sont au plafond. Returns {ok, token?, xpFallback?, error?}.
export async function convertCosmeticDups(userName, classCode, rewardType, rewardId){
  try{
    var res=await supabase.rpc("convert_dups_to_token",{
      p_name:userName,p_class_code:classCode,p_reward_type:rewardType,p_reward_id:rewardId,
    });
    if(res.error)return{ok:false,error:res.error.message};
    if(!res.data||res.data.ok===false)return{ok:false,error:(res.data&&res.data.error)||"convert_failed"};
    if(res.data.xp_fallback)return{ok:true,xpFallback:res.data.xp_fallback};
    return{ok:true,token:res.data.token};
  }catch(e){return{ok:false,error:e&&e.message};}
}

// 5 jetons non premium d'un même type → 1 jeton premium. Returns {ok, token?, error?}.
export async function convertTokensToPremium(userName, classCode, sourceType){
  try{
    var res=await supabase.rpc("convert_tokens_premium",{p_name:userName,p_class_code:classCode,p_source:sourceType});
    if(res.error)return{ok:false,error:res.error.message};
    if(!res.data||res.data.ok===false)return{ok:false,error:(res.data&&res.data.error)||"convert_failed"};
    return{ok:true,token:res.data.token};
  }catch(e){return{ok:false,error:e&&e.message};}
}

// Returns {ok:true, rewards, totalXp, totalDarics, balance, newPityCount, …} once the server has consumed the
// pending row, or {ok:false, error, chestType, triggerSource} otherwise.
// Économie côté serveur, lot 2a (2026-09-24) : le SERVEUR tire le butin (open_chest → _roll_chest, port de
// pickRewards sur les tables générées depuis chestCatalog.js) et crédite lui-même cosmétiques, jetons et Darics
// dans la même transaction que la consommation du coffre. Le client ne choisit plus rien : il affiche le butin
// renvoyé (même forme que pickRewards, l'écran d'ouverture ne change pas) et crédite seulement l'XP.
// ⚠️ On ok:false the caller must credit NOTHING : the pending row still exists (the whole transaction rolled back).
export async function openChestFromPending(pendingChest, pityCount){
  var ct=pendingChest.chest_type;
  // Couleur et libellé du coffre (affichage), même correspondance que le serveur pour chest_log.
  var tierByChest={novice:0,guerrier:2,champion:3,legendaire:4};
  var tier=tierByChest[ct]!==undefined?tierByChest[ct]:0;
  // Pitié : compteur inerte depuis la V2 (aucun tirage ne le lit), gardé pour la forme du profil.
  var newPity=(ct==="novice"||ct==="guerrier")?((pityCount||0)+1):0;
  var un=pendingChest.user_name, cc=pendingChest.class_code;
  var data=null, openError=null;
  try{
    var op=await supabase.rpc("open_chest",{p_pending_id:pendingChest.id, p_name:un, p_class_code:cc});
    if(op.error){openError=op.error.message||"rpc_error";console.warn("[CHEST] open_chest error (nothing credited):",openError);}
    else if(!(op.data&&op.data.ok===true)){openError=(op.data&&op.data.error)||"empty_response";console.warn("[CHEST] open_chest refused (nothing credited):",openError);}
    else data=op.data;
  }catch(e){openError=(e&&e.message)||"exception";console.warn("[CHEST] openChest exception (nothing credited):",openError);}
  if(!data)return{ok:false,error:openError,chestType:ct,triggerSource:pendingChest.trigger_source};
  return{
    ok:true,
    chestType:ct,
    triggerSource:pendingChest.trigger_source,
    rarityTier:tier,
    rarityId:RARITIES[tier].id,
    rarityColor:RARITIES[tier].color,
    rarityLabel:RARITIES[tier].label,
    rewards:Array.isArray(data.rewards)?data.rewards:[],
    totalXp:data.total_xp||0,
    totalDarics:data.total_darics||0,
    balance:typeof data.balance==="number"?data.balance:null,
    newPityCount:newPity,
  };
}
