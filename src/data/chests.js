// ─── CHEST SYSTEM — Data & Logic ───
import { supabase } from "../supabase.js";

// ═══ RARITY TIERS ═══
export var RARITIES = [
  {id:"common",    label:"Commun",      color:"#909090", tier:0},
  {id:"uncommon",  label:"Peu Commun",  color:"#3ecc78", tier:1},
  {id:"rare",      label:"Rare",        color:"#3a8ee0", tier:2},
  {id:"epic",      label:"\u00c9pique", color:"#c060f0", tier:3},
  {id:"legend", label:"L\u00e9gendaire", color:"#ffc020", tier:4},
];

// ═══ CHEST TYPES ═══
export var CHEST_TYPES = {
  novice:     {label:"Novice",     icon:"\uD83D\uDCE6", drop:[60,25,12,3,0]},
  guerrier:   {label:"Guerrier",   icon:"\u2694\uFE0F", drop:[35,35,20,8,2]},
  champion:   {label:"Champion",   icon:"\uD83C\uDFC6", drop:[15,30,35,15,5]},
  legendaire: {label:"L\u00e9gendaire", icon:"\uD83D\uDC8E", drop:[0,10,25,40,25]},
};

// ═══ AVATARS ═══
export var AVATARS = {
  // Communs (10)
  paysan:{name:"Paysan",rarity:"common",icon:"chess-pawn"},
  ecuyer:{name:"\u00c9cuyer",rarity:"common",icon:"sword-brandish"},
  apprenti:{name:"Apprenti",rarity:"common",icon:"spell-book"},
  archer:{name:"Archer",rarity:"common",icon:"pocket-bow"},
  forgeron:{name:"Forgeron",rarity:"common",icon:"anvil"},
  aubergiste:{name:"Aubergiste",rarity:"common",icon:"beer-stein"},
  herboriste:{name:"Herboriste",rarity:"common",icon:"herbs-bundle"},
  barde:{name:"Barde",rarity:"common",icon:"lyre"},
  sentinelle:{name:"Sentinelle",rarity:"common",icon:"guards"},
  marchand:{name:"Marchand",rarity:"common",icon:"trade"},
  // Peu Communs (8)
  chevalier:{name:"Chevalier",rarity:"uncommon",icon:"mounted-knight"},
  roublard:{name:"Roublard",rarity:"uncommon",icon:"hooded-assassin"},
  sorcier:{name:"Sorcier",rarity:"uncommon",icon:"wizard-staff"},
  rodeuse:{name:"R\u00f4deuse",rarity:"uncommon",icon:"crossbow"},
  clerc:{name:"Clerc",rarity:"uncommon",icon:"winged-scepter"},
  alchimiste:{name:"Alchimiste",rarity:"uncommon",icon:"round-bottom-flask"},
  mercenaire:{name:"Mercenaire",rarity:"uncommon",icon:"battle-axe"},
  erudit:{name:"\u00c9rudit",rarity:"uncommon",icon:"bookmarklet"},
  // Rares (7)
  paladin:{name:"Paladin",rarity:"rare",icon:"templar-shield"},
  archimage:{name:"Archimage",rarity:"rare",icon:"crystal-wand"},
  assassin:{name:"Assassin",rarity:"rare",icon:"daggers"},
  druide:{name:"Druide",rarity:"rare",icon:"oak-leaf"},
  mage_guerre:{name:"Mage de Guerre",rarity:"rare",icon:"flaming-trident"},
  seigneur:{name:"Seigneur",rarity:"rare",icon:"throne-king"},
  valkyrie:{name:"Valkyrie",rarity:"rare",icon:"winged-sword"},
  // Épiques (5)
  ch_dragon:{name:"Chasseur de Dragon",rarity:"epic",icon:"dragon-head"},
  necro:{name:"N\u00e9cromancien",rarity:"epic",icon:"skull-staff"},
  archere:{name:"Arch\u00e8re Sacr\u00e9e",rarity:"epic",icon:"archer"},
  st_tempete:{name:"Seigneur Temp\u00eate",rarity:"epic",icon:"lightning-storm"},
  inquisiteur:{name:"Inquisiteur",rarity:"epic",icon:"crossed-swords"},
  // Légendaires (2)
  pourfendeur:{name:"Pourfendeur",rarity:"legend",icon:"broadsword"},
  champion:{name:"Champion",rarity:"legend",icon:"laurel-crown"},
};

// ═══ SKINS ═══
export var SKINS = {
  argent:    {name:"Argent",          rarity:"rare",      cx:"180,180,200", hex:"#b4b4c8", dark:"#888898"},
  emeraude:  {name:"\u00c9meraude",   rarity:"rare",      cx:"46,180,100",  hex:"#2eb464", dark:"#1a8a46"},
  saphir:    {name:"Saphir",          rarity:"rare",      cx:"58,148,220",  hex:"#3a94dc", dark:"#1a6aaa"},
  rubis:     {name:"Rubis",           rarity:"epic",      cx:"220,58,80",   hex:"#dc3a50", dark:"#c01830"},
  amethyste: {name:"Am\u00e9thyste",  rarity:"epic",      cx:"160,90,220",  hex:"#a05adc", dark:"#7030aa"},
  corail:    {name:"Corail",          rarity:"epic",      cx:"220,100,50",  hex:"#dc6432", dark:"#c03018"},
  jade:      {name:"Jade",            rarity:"epic",      cx:"20,180,170",  hex:"#14b4aa", dark:"#0a8880"},
  obsidienne:{name:"Obsidienne",      rarity:"legend", cx:"176,144,240", hex:"#b090f0", dark:"#8060c0"},
  aurore:    {name:"Aurore Bor\u00e9ale", rarity:"legend", cx:"64,208,192", hex:"#40d0c0", dark:"#3a9870"},
};

// ═══ REWARD POOLS (by rarity tier) ═══
var REWARD_POOL = [
  {xp:50,  avatars:["paysan","ecuyer","apprenti","archer","forgeron","aubergiste","herboriste","barde","sentinelle","marchand"], skins:[]},
  {xp:75,  avatars:["chevalier","roublard","sorcier","rodeuse","clerc","alchimiste","mercenaire","erudit"], skins:[]},
  {xp:125, avatars:["paladin","archimage","assassin","druide","mage_guerre","seigneur","valkyrie"], skins:["argent","emeraude","saphir"]},
  {xp:150, avatars:["ch_dragon","necro","archere","st_tempete","inquisiteur"], skins:["rubis","amethyste","corail","jade"]},
  {xp:200, avatars:["pourfendeur","champion"], skins:["obsidienne","aurore"]},
];

// ═══ TRIGGERS ═══
export var UNIQUE_TRIGGERS = {
  xp_1k:    {chest:"novice",    check:function(u){return u.xp>=1000;}},
  xp_3k:    {chest:"novice",    check:function(u){return u.xp>=3000;}},
  xp_5k:    {chest:"novice",    check:function(u){return u.xp>=5000;}},
  xp_10k:   {chest:"guerrier",  check:function(u){return u.xp>=10000;}},
  xp_20k:   {chest:"guerrier",  check:function(u){return u.xp>=20000;}},
  xp_30k:   {chest:"champion",  check:function(u){return u.xp>=30000;}},
  xp_50k:   {chest:"champion",  check:function(u){return u.xp>=50000;}},
  streak_7:  {chest:"novice",   check:function(u){return u.streak>=7;}},
  streak_30: {chest:"guerrier",  check:function(u){return u.streak>=30;}},
  streak_100:{chest:"champion",  check:function(u){return u.streak>=100;}},
  mock_1:   {chest:"champion",  check:function(u){return u.mockResults&&u.mockResults.mock1;}},
  mock_2:   {chest:"champion",  check:function(u){return u.mockResults&&u.mockResults.mock2;}},
  mock_3:   {chest:"champion",  check:function(u){return u.mockResults&&u.mockResults.mock3;}},
  boss_test:{chest:"legendaire", check:function(u){return u.mockResults&&u.mockResults.boss;}},
};
// league_up_{id} and ach_legendary_{id} are dynamic — handled separately

// Achievements that grant a Légendaire chest when unlocked
export var LEGENDARY_ACHIEVEMENTS = ["boss_complete","boss_800","legend_league","toeic_master"];

// ═══ ROLL LOGIC ═══
export function rollRarity(chestType, pityCount){
  var rates=CHEST_TYPES[chestType].drop;
  // Pity: ≥10 chests without Rare+ → force Rare minimum
  if(pityCount>=10){
    var rareRates=[0,0,rates[2]||1,rates[3]||1,rates[4]||1];
    var total=rareRates.reduce(function(a,b){return a+b;},0);
    if(total===0)return 2; // fallback rare
    var roll=Math.random()*total;
    var cum=0;
    for(var i=0;i<rareRates.length;i++){cum+=rareRates[i];if(roll<cum)return i;}
    return 2;
  }
  var roll2=Math.random()*100;
  var cum2=0;
  for(var j=0;j<rates.length;j++){cum2+=rates[j];if(roll2<cum2)return j;}
  return 0;
}

export function pickReward(rarityTier, ownedAvatars, ownedSkins){
  var pool=REWARD_POOL[rarityTier];
  var available=[];
  pool.avatars.forEach(function(a){if(ownedAvatars.indexOf(a)===-1)available.push({type:"avatar",id:a});});
  pool.skins.forEach(function(s){if(ownedSkins.indexOf(s)===-1)available.push({type:"skin",id:s});});

  // All owned → XP gem
  if(available.length===0)return{type:"xp",id:null,xp:pool.xp};

  // 1/3 chance XP, 2/3 cosmetic (spec: XP less frequent)
  var withXp=[{type:"xp",id:null,xp:pool.xp}];
  available.forEach(function(a){withXp.push(a);withXp.push(a);}); // cosmetics appear twice
  var pick=withXp[Math.floor(Math.random()*withXp.length)];
  if(!pick.xp)pick.xp=0;
  return pick;
}

// ═══ SUPABASE HELPERS ═══

// Check if a unique trigger has already been granted
export async function hasUniqueTrigger(userName, classCode, triggerSource){
  var res=await supabase.from("chest_log").select("id").eq("user_name",userName).eq("class_code",classCode).eq("trigger_source",triggerSource).limit(1);
  return res.data&&res.data.length>0;
}

// Check if a weekly trigger is on cooldown (7 days)
export async function isWeeklyCooldown(userName, classCode, triggerSource){
  var cutoff=new Date();cutoff.setDate(cutoff.getDate()-7);
  var res=await supabase.from("chest_log").select("id").eq("user_name",userName).eq("class_code",classCode).eq("trigger_source",triggerSource).gte("opened_at",cutoff.toISOString()).limit(1);
  return res.data&&res.data.length>0;
}

// Add a pending chest
export async function grantChest(userName, classCode, chestType, triggerSource){
  await supabase.from("pending_chests").insert({user_name:userName,class_code:classCode,chest_type:chestType,trigger_source:triggerSource});
}

// Get pending chests for a user
export async function getPendingChests(userName, classCode){
  var res=await supabase.from("pending_chests").select("*").eq("user_name",userName).eq("class_code",classCode).order("earned_at",{ascending:true});
  return res.data||[];
}

// Get owned rewards
export async function getOwnedRewards(userName, classCode){
  var res=await supabase.from("player_rewards").select("*").eq("user_name",userName).eq("class_code",classCode);
  return res.data||[];
}

// Open a chest: roll, pick, log, delete pending, return result
export async function openChestFromPending(pendingChest, pityCount, ownedAvatars, ownedSkins){
  var tier=rollRarity(pendingChest.chest_type, pityCount);
  var reward=pickReward(tier, ownedAvatars, ownedSkins);
  var rarityId=RARITIES[tier].id;
  var newPity=(tier<2)?(pityCount+1):0;

  // Insert into player_rewards (skip for XP — no inventory entry needed)
  if(reward.type!=="xp"){
    await supabase.from("player_rewards").insert({
      user_name:pendingChest.user_name, class_code:pendingChest.class_code,
      reward_type:reward.type, reward_id:reward.id, rarity:rarityId,
    });
  }

  // Log
  await supabase.from("chest_log").insert({
    user_name:pendingChest.user_name, class_code:pendingChest.class_code,
    chest_type:pendingChest.chest_type, trigger_source:pendingChest.trigger_source,
    rarity_obtained:rarityId, reward_type:reward.type, reward_id:reward.id,
    xp_amount:reward.type==="xp"?REWARD_POOL[tier].xp:null,
  });

  // Remove from pending
  await supabase.from("pending_chests").delete().eq("id",pendingChest.id);

  return{
    chestType:pendingChest.chest_type,
    triggerSource:pendingChest.trigger_source,
    rarityTier:tier,
    rarityId:rarityId,
    rarityColor:RARITIES[tier].color,
    rarityLabel:RARITIES[tier].label,
    reward:reward,
    xpAmount:reward.type==="xp"?REWARD_POOL[tier].xp:0,
    newPityCount:newPity,
  };
}
