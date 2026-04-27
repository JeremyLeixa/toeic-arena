// ─── CHEST SYSTEM — Data & Logic ───
import { supabase } from "../supabase.js";

// ═══ RARITY TIERS ═══
export var RARITIES = [
  {id:"common",    label:"Common",      color:"#909090", tier:0},
  {id:"uncommon",  label:"Uncommon",    color:"#3ecc78", tier:1},
  {id:"rare",      label:"Rare",        color:"#3a8ee0", tier:2},
  {id:"epic",      label:"Epic",        color:"#c060f0", tier:3},
  {id:"legend",    label:"Legendary",   color:"#ffc020", tier:4},
];

// ═══ CHEST TYPES ═══
export var CHEST_TYPES = {
  novice:     {label:"Novice",     icon:"\uD83D\uDCE6", drop:[60,25,12,3,0]},
  guerrier:   {label:"Warrior",    icon:"\u2694\uFE0F", drop:[35,35,20,8,2]},
  champion:   {label:"Champion",   icon:"\uD83C\uDFC6", drop:[15,30,35,15,5]},
  legendaire: {label:"Legendary",  icon:"\uD83D\uDC8E", drop:[0,10,25,40,25]},
};

// ═══ AVATARS ═══
export var AVATARS = {
  // Common (10)
  paysan:{name:"Peasant",rarity:"common",icon:"chess-pawn"},
  ecuyer:{name:"Squire",rarity:"common",icon:"sword-brandish"},
  apprenti:{name:"Apprentice",rarity:"common",icon:"spell-book"},
  archer:{name:"Archer",rarity:"common",icon:"pocket-bow"},
  forgeron:{name:"Blacksmith",rarity:"common",icon:"anvil"},
  aubergiste:{name:"Innkeeper",rarity:"common",icon:"beer-stein"},
  herboriste:{name:"Herbalist",rarity:"common",icon:"herbs-bundle"},
  barde:{name:"Bard",rarity:"common",icon:"lyre"},
  sentinelle:{name:"Sentinel",rarity:"common",icon:"guards"},
  marchand:{name:"Merchant",rarity:"common",icon:"trade"},
  // Uncommon (8)
  chevalier:{name:"Knight",rarity:"uncommon",icon:"mounted-knight"},
  roublard:{name:"Rogue",rarity:"uncommon",icon:"hooded-assassin"},
  sorcier:{name:"Warlock",rarity:"uncommon",icon:"wizard-staff"},
  rodeuse:{name:"Ranger",rarity:"uncommon",icon:"crossbow"},
  clerc:{name:"Cleric",rarity:"uncommon",icon:"winged-scepter"},
  alchimiste:{name:"Alchemist",rarity:"uncommon",icon:"round-bottom-flask"},
  mercenaire:{name:"Mercenary",rarity:"uncommon",icon:"battle-axe"},
  erudit:{name:"Scholar",rarity:"uncommon",icon:"bookmarklet"},
  // Rare (7)
  paladin:{name:"Paladin",rarity:"rare",icon:"templar-shield"},
  archimage:{name:"Archmage",rarity:"rare",icon:"crystal-wand"},
  assassin:{name:"Assassin",rarity:"rare",icon:"daggers"},
  druide:{name:"Druid",rarity:"rare",icon:"oak-leaf"},
  mage_guerre:{name:"War Mage",rarity:"rare",icon:"flaming-trident"},
  seigneur:{name:"Lord",rarity:"rare",icon:"throne-king"},
  valkyrie:{name:"Valkyrie",rarity:"rare",icon:"winged-sword"},
  // Epic (5)
  ch_dragon:{name:"Dragon Hunter",rarity:"epic",icon:"dragon-head"},
  necro:{name:"Necromancer",rarity:"epic",icon:"skull-staff"},
  archere:{name:"Sacred Archer",rarity:"epic",icon:"archer"},
  st_tempete:{name:"Storm Lord",rarity:"epic",icon:"lightning-storm"},
  inquisiteur:{name:"Inquisitor",rarity:"epic",icon:"crossed-swords"},
  // Legendary (2)
  pourfendeur:{name:"Slayer",rarity:"legend",icon:"broadsword"},
  champion:{name:"Champion",rarity:"legend",icon:"laurel-crown"},
};

// ═══ SKINS ═══
export var SKINS = {
  argent:    {name:"Silver",          rarity:"rare",      cx:"180,180,200", hex:"#b4b4c8", dark:"#888898"},
  emeraude:  {name:"Emerald",         rarity:"rare",      cx:"46,180,100",  hex:"#2eb464", dark:"#1a8a46"},
  saphir:    {name:"Sapphire",        rarity:"rare",      cx:"58,148,220",  hex:"#3a94dc", dark:"#1a6aaa"},
  rubis:     {name:"Ruby",            rarity:"epic",      cx:"220,58,80",   hex:"#dc3a50", dark:"#c01830"},
  amethyste: {name:"Amethyst",        rarity:"epic",      cx:"160,90,220",  hex:"#a05adc", dark:"#7030aa"},
  corail:    {name:"Coral",           rarity:"epic",      cx:"220,100,50",  hex:"#dc6432", dark:"#c03018"},
  jade:      {name:"Jade",            rarity:"epic",      cx:"20,180,170",  hex:"#14b4aa", dark:"#0a8880"},
  obsidienne:{name:"Obsidian",        rarity:"legend",    cx:"176,144,240", hex:"#b090f0", dark:"#8060c0"},
  aurore:    {name:"Aurora Borealis", rarity:"legend",    cx:"64,208,192",  hex:"#40d0c0", dark:"#3a9870"},
};

// ═══ FRAMES (V2 — cosmétique non-stackable, glow autour de l'avatar) ═══
// style = CSS appliqué sur le wrapper de l'avatar (Profile + classements + tab bar)
export var FRAMES = {
  // Rare (3)
  gold_neon: {name:"Gold Neon",   rarity:"rare",  style:"border:3px solid #ffc020;box-shadow:0 0 16px #ffc020,inset 0 0 12px rgba(255,192,32,.5)"},
  emerald_glow:{name:"Emerald Glow",rarity:"rare",style:"border:3px solid #2eb464;box-shadow:0 0 16px #2eb464,inset 0 0 12px rgba(46,180,100,.5)"},
  ice_crystal:{name:"Ice Crystal",rarity:"rare",  style:"border:3px solid #58a8e8;box-shadow:0 0 16px #58a8e8,inset 0 0 12px rgba(88,168,232,.5)"},
  // Epic (3)
  fire_forged:{name:"Fire Forged",rarity:"epic",  style:"border:3px solid #ff6020;box-shadow:0 0 18px #ff6020,inset 0 0 14px rgba(255,96,32,.6)"},
  ruby_aura: {name:"Ruby Aura",   rarity:"epic",  style:"border:3px solid #dc3a50;box-shadow:0 0 20px #dc3a50,inset 0 0 14px rgba(220,58,80,.6)"},
  amethyst_veil:{name:"Amethyst Veil",rarity:"epic",style:"border:3px solid #a05adc;box-shadow:0 0 20px #a05adc,inset 0 0 14px rgba(160,90,220,.6)"},
  // Legendary (2)
  cosmic:    {name:"Cosmic",      rarity:"legend",style:"border:3px solid transparent;background-image:linear-gradient(var(--bg2),var(--bg2)),linear-gradient(135deg,#ff40c0,#40c0ff,#ffc040);background-origin:border-box;background-clip:padding-box,border-box;box-shadow:0 0 24px rgba(160,90,220,.7)"},
  dragonbone:{name:"Dragonbone",  rarity:"legend",style:"border:3px solid #ffd060;box-shadow:0 0 28px #ff4020,inset 0 0 16px rgba(255,64,32,.7)"},
};

// ═══ TITLES (V2 — texte affiché sous le nom partout dans l'app) ═══
export var TITLES = {
  // Rare (4)
  apprentice:    {name:"The Apprentice",     rarity:"rare",  color:"#3a8ee0"},
  tavern_regular:{name:"Tavern Regular",     rarity:"rare",  color:"#3a8ee0"},
  squire:        {name:"The Squire",         rarity:"rare",  color:"#3a8ee0"},
  scribe:        {name:"The Scribe",         rarity:"rare",  color:"#3a8ee0"},
  // Epic (5)
  wordsmith:     {name:"The Wordsmith",      rarity:"epic",  color:"#c060f0"},
  tense_sage:    {name:"Tense Sage",         rarity:"epic",  color:"#c060f0"},
  drillmaster:   {name:"Drillmaster",        rarity:"epic",  color:"#c060f0"},
  word_forger:   {name:"Word Forger",        rarity:"epic",  color:"#c060f0"},
  arena_veteran: {name:"Arena Veteran",      rarity:"epic",  color:"#c060f0"},
  // Legendary (3)
  dragon_slayer: {name:"Dragon Slayer",      rarity:"legend",color:"#ffc020"},
  arena_conqueror:{name:"Arena Conqueror",   rarity:"legend",color:"#ffc020"},
  legend:        {name:"Legend",             rarity:"legend",color:"#ffc020"},
};

// ═══ TOKENS (V2 — tactiques stackables, nouvelle table player_tokens) ═══
// premium = drop seulement sur coffre Légendaire (et conversions)
export var TOKEN_TYPES = {
  diminishing_bypass:{name:"Bypass Token",      icon:"🔓", cap:5, premium:false, desc:"Skip diminishing returns on next session"},
  streak_shield:     {name:"Streak Shield",     icon:"🛡️",  cap:3, premium:false, desc:"Auto-protects streak on missed day"},
  daily_reroll:      {name:"Daily Reroll",      icon:"🎲", cap:1, premium:false, desc:"Re-roll today's mission"},
  mock_reset:        {name:"Mock Reset",        icon:"📜", cap:2, premium:true,  desc:"Bypass 24h cooldown on Mock Test"},
  boss_reset:        {name:"Boss Reset",        icon:"🐲", cap:1, premium:true,  desc:"Bypass 24h cooldown on Boss Test"},
  endless_resurrect: {name:"Endless Resurrect", icon:"💎", cap:2, premium:true,  desc:"Continue Endless after 1 fatal mistake"},
};

// ═══ CHEAT SHEETS (V2 — méta codex, garantie sur Légendaire) ═══
// V1 stub : 3 fiches drafts, à étoffer plus tard. Render = parchemin lisible Profile→Collection.
// blocks = même format que les grimoires (paragraph/heading/rule/example/trap/table/list)
export var CHEAT_SHEETS = {
  part5_conjunctions:{
    name:"Part 5 — Conjunction Traps",
    rarity:"epic",
    icon:"📜",
    blocks:[
      {type:"paragraph",text:"Les Part 5 distinguent 3 familles que les distracteurs confondent volontairement."},
      {type:"heading",text:"3 familles"},
      {type:"rule",label:"Coordinating",formula:"and / but / or / so — relient 2 propositions de même nature"},
      {type:"rule",label:"Subordinating",formula:"because / although / while / since — introduit une subordonnée"},
      {type:"rule",label:"Conjunctive adverb",formula:"however / therefore / moreover — modifie une proposition mais n'est PAS une conjonction (besoin de ; ou .)"},
      {type:"trap",text:"“However it was raining, we went out” → FAUX. Il faut “Although it was raining, we went out”. “However” demande une ponctuation forte."},
    ],
  },
  part3_negation:{
    name:"Part 3 — Negation Patterns",
    rarity:"epic",
    icon:"🎯",
    blocks:[
      {type:"paragraph",text:"40% des erreurs Part 3 viennent de négations mal entendues. Les locuteurs natifs les contractent souvent."},
      {type:"list",items:[
        "“hasn't” / “haven't” → son court [@znt] / [hav@nt]",
        "“won't” / “wouldn't” → [woUnt] / [wUd@nt]",
        "“doesn't” / “didn't” → [d@z@nt] / [did@nt]",
      ]},
      {type:"trap",text:"Si tu n'es pas sûr d'avoir entendu une négation, écoute la 2e fois en focus sur la consonne finale du verbe auxiliaire."},
    ],
  },
  reading_skim_scan:{
    name:"Part 7 — Skim & Scan",
    rarity:"rare",
    icon:"🔍",
    blocks:[
      {type:"paragraph",text:"Tu as ~75 min pour 54 questions Reading. Sur Part 7 ne JAMAIS lire mot à mot."},
      {type:"heading",text:"Méthode 2-passes"},
      {type:"rule",label:"Pass 1 — Skim",formula:"Lis intro + 1ère phrase de chaque paragraphe + conclusion. 30s max par passage."},
      {type:"rule",label:"Pass 2 — Scan",formula:"Lis la question, identifie le mot-clé, scanne le passage pour le trouver, lis 2 lignes autour."},
      {type:"example",en:"Q: According to the email, when will the meeting take place?",fr:"→ mot-clé = “meeting”, scanne pour la date près de ce mot."},
    ],
  },
};

// ═══ DROP TABLES SEGMENTÉES (V2 — 1 coffre = N items) ═══
// Format slot : {kind, ...params}
//   kind="xp"        : {min, max} → roll XP dans la fourchette
//   kind="cosmetic"  : {oneOf:["frame","title"|"avatar"|"skin"], minRarity?} → pick UN slot cosmetic random non-owned
//   kind="token"     : {pool, count} → tire `count` tokens du pool, respecte cap (skip si plein)
//   kind="cheat_sheet":{chance} → 0..1, pick un sheet non-owned
//   kind="duo"       : {types:[...]} → ouvre N slots cosmetic en série (utilisé Légendaire : skin + frame/title)
export var DROP_TABLES = {
  novice:[
    {kind:"xp",min:50,max:150},
    {kind:"token",pool:["diminishing_bypass","streak_shield","daily_reroll"],count:1},
  ],
  guerrier:[
    {kind:"xp",min:200,max:400},
    {kind:"cosmetic",oneOf:["frame","title"]},
    {kind:"token",pool:["diminishing_bypass","streak_shield","daily_reroll"],count:2},
  ],
  champion:[
    {kind:"xp",min:500,max:800},
    {kind:"cosmetic",oneOf:["avatar","skin"],minRarity:"rare"},
    {kind:"token",pool:["diminishing_bypass","streak_shield","daily_reroll","mock_reset","endless_resurrect"],count:3},
    {kind:"cheat_sheet",chance:0.25},
  ],
  legendaire:[
    {kind:"xp",min:1000,max:1500},
    {kind:"cosmetic",oneOf:["skin"],minRarity:"legend"},
    {kind:"cosmetic",oneOf:["frame","title"],minRarity:"epic"},
    {kind:"token",pool:["mock_reset","boss_reset","endless_resurrect"],count:3},
    {kind:"cheat_sheet",chance:1.0},
  ],
};

// Helpers internes pour pickRewards
function _rarityTier(rid){var i=0;for(;i<RARITIES.length;i++){if(RARITIES[i].id===rid)return i;}return 0;}
function _filterByMinRarity(map,minRarity){
  if(!minRarity)return Object.keys(map);
  var minTier=_rarityTier(minRarity);
  return Object.keys(map).filter(function(k){return _rarityTier(map[k].rarity)>=minTier;});
}
function _pickFromPool(map,owned,minRarity){
  var keys=_filterByMinRarity(map,minRarity).filter(function(k){return owned.indexOf(k)===-1;});
  if(keys.length===0)return null;
  return keys[Math.floor(Math.random()*keys.length)];
}

// ═══ pickRewards (V2 parallèle — utilisé par étape 3 quand ChestOpenModal sera refait) ═══
// owned = {avatars:[], skins:[], frames:[], titles:[], cheatSheets:[], tokens:{type:qty,...}}
// returns: array of {type, id?, xp?, rarity?, tokenType?} — UN item par slot du DROP_TABLE
// Si un slot ne peut pas drop (tout owned, cap atteint, etc.) → fallback XP gem proportionnel.
export function pickRewards(chestType, owned){
  var table=DROP_TABLES[chestType];
  if(!table){console.warn("[CHEST] pickRewards: unknown chestType",chestType);return[];}
  var rewards=[];
  var ownedAvatars=owned.avatars||[], ownedSkins=owned.skins||[];
  var ownedFrames=owned.frames||[], ownedTitles=owned.titles||[];
  var ownedSheets=owned.cheatSheets||[], tokens=owned.tokens||{};

  table.forEach(function(slot){
    if(slot.kind==="xp"){
      var xp=slot.min+Math.floor(Math.random()*(slot.max-slot.min+1));
      rewards.push({type:"xp",id:null,xp:xp});
      return;
    }
    if(slot.kind==="cosmetic"){
      // pick random sub-type from oneOf, then random non-owned item from that map
      var subType=slot.oneOf[Math.floor(Math.random()*slot.oneOf.length)];
      var map=null, ownedList=null;
      if(subType==="avatar"){map=AVATARS;ownedList=ownedAvatars;}
      else if(subType==="skin"){map=SKINS;ownedList=ownedSkins;}
      else if(subType==="frame"){map=FRAMES;ownedList=ownedFrames;}
      else if(subType==="title"){map=TITLES;ownedList=ownedTitles;}
      if(!map){console.warn("[CHEST] unknown cosmetic subType",subType);return;}
      var picked=_pickFromPool(map,ownedList,slot.minRarity);
      if(picked){
        rewards.push({type:subType,id:picked,rarity:map[picked].rarity});
      }else{
        // V2 step 5 — all owned : drop a duplicate (convertible later in Profile→Conversions)
        // instead of XP fallback. Anti-frustration : the user advanced enough to complete the
        // collection gets a usable currency rather than dead XP.
        var allKeys=_filterByMinRarity(map,slot.minRarity);
        if(allKeys.length>0){
          var dupId=allKeys[Math.floor(Math.random()*allKeys.length)];
          rewards.push({type:subType,id:dupId,rarity:map[dupId].rarity,duplicate:true});
        }else{
          // pool empty (shouldn't happen with current constants) — fallback XP
          var fbXp=slot.minRarity==="legend"?500:slot.minRarity==="epic"?250:100;
          rewards.push({type:"xp",id:null,xp:fbXp,fallback:"empty_pool"});
        }
      }
      return;
    }
    if(slot.kind==="token"){
      // tire `count` tokens du pool, respecte cap. Si tout cap atteint → fallback XP.
      var pool=slot.pool.filter(function(tt){
        var qty=tokens[tt]||0;
        var cap=TOKEN_TYPES[tt]&&TOKEN_TYPES[tt].cap||1;
        return qty<cap;
      });
      var picks=Math.min(slot.count,pool.length);
      // simulate qty growth as we pick to avoid same-token over-cap in same chest
      var simQty=Object.assign({},tokens);
      for(var k=0;k<picks;k++){
        var available=pool.filter(function(tt){
          var q=simQty[tt]||0;
          var cap=TOKEN_TYPES[tt]&&TOKEN_TYPES[tt].cap||1;
          return q<cap;
        });
        if(available.length===0)break;
        var t=available[Math.floor(Math.random()*available.length)];
        rewards.push({type:"token",id:t,tokenType:t});
        simQty[t]=(simQty[t]||0)+1;
      }
      // si on n'a pas pu tirer assez de tokens → completer en XP
      var missing=slot.count-Math.min(picks,slot.count);
      if(missing>0){
        rewards.push({type:"xp",id:null,xp:50*missing,fallback:"tokens_capped"});
      }
      return;
    }
    if(slot.kind==="cheat_sheet"){
      var chance=slot.chance||0;
      if(Math.random()>chance)return; // skip si raté
      var picked2=_pickFromPool(CHEAT_SHEETS,ownedSheets,null);
      if(picked2){
        rewards.push({type:"cheat_sheet",id:picked2,rarity:CHEAT_SHEETS[picked2].rarity});
      }else if(slot.chance>=1){
        // garantie + tout owned → fallback XP premium
        rewards.push({type:"xp",id:null,xp:300,fallback:"sheets_owned"});
      }
      return;
    }
    console.warn("[CHEST] unknown slot kind",slot.kind);
  });

  return rewards;
}

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

// Achievements that grant a Novice chest when unlocked (Discovery tier — first-time exploration)
export var NOVICE_ACHIEVEMENTS = ["crypt_first","chrono_first","forge_first","weaver_first","gauntlet_explorer"];

// Achievements that grant a Guerrier chest when unlocked
// (Epic tier — perfect runs + sustained mastery proof)
export var EPIC_ACHIEVEMENTS = ["crypt_perfect","chrono_perfect","forge_perfect","weaver_perfect","irregular_master","tense_sage","passive_alchemist","relative_weaver"];

// Achievements that grant a Légendaire chest when unlocked
export var LEGENDARY_ACHIEVEMENTS = ["boss_complete","boss_800","legend_league","toeic_master","gauntlet_champion","gauntlet_grinder","gauntlet_scholar"];

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

// Check if a unique trigger has already been granted (log OR pending)
export async function hasUniqueTrigger(userName, classCode, triggerSource){
  try{
    var res=await supabase.from("chest_log").select("id").ilike("user_name",userName).eq("class_code",classCode).eq("trigger_source",triggerSource).limit(1);
    if(res.data&&res.data.length>0)return true;
    // Also check pending (not yet opened) to prevent double-grant
    var pen=await supabase.from("pending_chests").select("id").ilike("user_name",userName).eq("class_code",classCode).eq("trigger_source",triggerSource).limit(1);
    return pen.data&&pen.data.length>0;
  }catch(e){console.error("[CHEST] hasUniqueTrigger error:",e);return true;} // fail-safe: assume granted
}

// Check if a weekly trigger is on cooldown (7 days) — checks log AND pending
export async function isWeeklyCooldown(userName, classCode, triggerSource){
  try{
    var cutoff=new Date();cutoff.setDate(cutoff.getDate()-7);
    var res=await supabase.from("chest_log").select("id").ilike("user_name",userName).eq("class_code",classCode).eq("trigger_source",triggerSource).gte("opened_at",cutoff.toISOString()).limit(1);
    if(res.data&&res.data.length>0)return true;
    // Also check pending to prevent double-grant within the same week
    var pen=await supabase.from("pending_chests").select("id").ilike("user_name",userName).eq("class_code",classCode).eq("trigger_source",triggerSource).limit(1);
    return pen.data&&pen.data.length>0;
  }catch(e){console.error("[CHEST] isWeeklyCooldown error:",e);return true;} // fail-safe: assume on cooldown
}

// Add a pending chest
export async function grantChest(userName, classCode, chestType, triggerSource){
  try{
    var res=await supabase.from("pending_chests").insert({user_name:userName,class_code:classCode,chest_type:chestType,trigger_source:triggerSource});
    if(res.error)console.error("[CHEST] grantChest error:",res.error.message);
  }catch(e){console.error("[CHEST] grantChest exception:",e);}
}

// Get pending chests for a user
export async function getPendingChests(userName, classCode){
  try{
    var res=await supabase.from("pending_chests").select("*").ilike("user_name",userName).eq("class_code",classCode).order("earned_at",{ascending:true});
    return res.data||[];
  }catch(e){console.error("[CHEST] getPendingChests error:",e);return[];}
}

// Get owned rewards (avatars + skins + frames + titles + cheat_sheets — all stored in player_rewards)
export async function getOwnedRewards(userName, classCode){
  try{
    var res=await supabase.from("player_rewards").select("*").ilike("user_name",userName).eq("class_code",classCode);
    return res.data||[];
  }catch(e){console.error("[CHEST] getOwnedRewards error:",e);return[];}
}

// V2 — get owned tokens, returns {token_type: quantity, ...}
export async function getOwnedTokens(userName, classCode){
  try{
    var res=await supabase.from("player_tokens").select("token_type,quantity").ilike("user_name",userName).eq("class_code",classCode);
    var map={};
    if(res.data)res.data.forEach(function(r){map[r.token_type]=r.quantity||0;});
    return map;
  }catch(e){console.warn("[CHEST] getOwnedTokens error (table may not exist yet):",e&&e.message);return{};}
}

// V2 — grant a token via the SQL helper (cap-aware UPSERT)
async function grantTokenRPC(userName, classCode, tokenType, amount, cap){
  try{
    var res=await supabase.rpc("grant_token",{
      p_user_name:userName, p_class_code:classCode,
      p_token_type:tokenType, p_amount:amount, p_cap:cap,
    });
    if(res.error)console.warn("[CHEST] grant_token RPC error:",res.error.message);
    return res.data;
  }catch(e){console.warn("[CHEST] grant_token exception:",e&&e.message);return null;}
}

// V2 step 5 — pool of token types eligible as conversion outputs
var NON_PREMIUM_TOKENS=["diminishing_bypass","streak_shield","daily_reroll"];
var PREMIUM_TOKENS=["mock_reset","boss_reset","endless_resurrect"];

// Convert 3 duplicate cosmetics → 1 random non-premium token.
// Returns {ok, token?, error?}. Atomic enough for V1 : DELETE 3 rows then grant 1 token.
// Failure modes : <3 dups (ok:false), all token types capped (returns XP gem instead).
export async function convertCosmeticDups(userName, classCode, rewardType, rewardId, ownedTokens){
  try{
    // Fetch up to 4 rows so we can verify count >= 4 (3 duplicates + 1 original kept).
    // The plan's "3 duplicates" wording implies 3 EXTRAS beyond the original copy ;
    // converting at count=3 would erase the user's only instance of that cosmetic.
    var sel=await supabase.from("player_rewards").select("id")
      .ilike("user_name",userName).eq("class_code",classCode)
      .eq("reward_type",rewardType).eq("reward_id",rewardId)
      .limit(4);
    if(sel.error)return{ok:false,error:sel.error.message};
    if(!sel.data||sel.data.length<4)return{ok:false,error:"not_enough_duplicates"};

    // Pick a non-capped non-premium token to grant
    var owned=ownedTokens||{};
    var candidates=NON_PREMIUM_TOKENS.filter(function(tt){
      var qty=owned[tt]||0;
      var cap=(TOKEN_TYPES[tt]&&TOKEN_TYPES[tt].cap)||1;
      return qty<cap;
    });
    if(candidates.length===0){
      // All non-premium tokens capped → DELETE 3 dups + grant a 100 XP fallback (caller handles).
      // Same "keep the 4th" invariant as the happy path.
      var ids=sel.data.slice(0,3).map(function(r){return r.id;});
      var del0=await supabase.from("player_rewards").delete().in("id",ids);
      if(del0.error)return{ok:false,error:del0.error.message};
      return{ok:true,xpFallback:100};
    }
    var pick=candidates[Math.floor(Math.random()*candidates.length)];
    var cap=TOKEN_TYPES[pick].cap||1;

    // DELETE only 3 rows (the duplicates) — keep the 4th as the user's original copy.
    var ids2=sel.data.slice(0,3).map(function(r){return r.id;});
    var del=await supabase.from("player_rewards").delete().in("id",ids2);
    if(del.error)return{ok:false,error:del.error.message};

    // Grant the token (cap-aware via SQL helper)
    await grantTokenRPC(userName,classCode,pick,1,cap);
    return{ok:true,token:pick};
  }catch(e){return{ok:false,error:e&&e.message};}
}

// Convert 5 of a non-premium token → 1 random premium token.
// Returns {ok, token?, error?}. Uses consume_token RPC × 5 (atomic per call).
export async function convertTokensToPremium(userName, classCode, sourceType, ownedTokens){
  try{
    if(NON_PREMIUM_TOKENS.indexOf(sourceType)===-1)return{ok:false,error:"source_not_non_premium"};
    var owned=ownedTokens||{};
    if((owned[sourceType]||0)<5)return{ok:false,error:"not_enough_tokens"};

    // Pick a non-capped premium token target
    var candidates=PREMIUM_TOKENS.filter(function(tt){
      var qty=owned[tt]||0;
      var cap=(TOKEN_TYPES[tt]&&TOKEN_TYPES[tt].cap)||1;
      return qty<cap;
    });
    if(candidates.length===0)return{ok:false,error:"all_premium_capped"};
    var pick=candidates[Math.floor(Math.random()*candidates.length)];
    var cap=TOKEN_TYPES[pick].cap||1;

    // Consume 5 source tokens via the SQL helper
    var consumeRes=await supabase.rpc("consume_token",{
      p_user_name:userName, p_class_code:classCode,
      p_token_type:sourceType, p_amount:5,
    });
    if(consumeRes.error)return{ok:false,error:consumeRes.error.message};
    if(consumeRes.data===false)return{ok:false,error:"consume_returned_false"};

    // Grant the premium token
    await grantTokenRPC(userName,classCode,pick,1,cap);
    return{ok:true,token:pick};
  }catch(e){return{ok:false,error:e&&e.message};}
}

// V2 — Open a chest: roll multi-rewards, persist them, log, delete pending, return aggregate.
// `owned` = {avatars, skins, frames, titles, cheatSheets, tokens:{type:qty}}
export async function openChestFromPending(pendingChest, pityCount, owned){
  // Rarity is now derived from chest_type itself (drop tables segmented per chest tier).
  // pityCount kept for backward signature compat — no longer used to roll rarity, but
  // forwarded back to the caller to preserve the reset-on-rare invariant.
  var rewards=pickRewards(pendingChest.chest_type, owned||{});
  var ct=pendingChest.chest_type;
  // Map chest type to a representative rarity tier for UI color/label fallback
  var tierByChest={novice:0,guerrier:2,champion:3,legendaire:4};
  var tier=tierByChest[ct]!==undefined?tierByChest[ct]:0;
  var rarityId=RARITIES[tier].id;
  // Pity reset on Champion/Légendaire chests (any non-novice/guerrier roll)
  var newPity=(ct==="novice"||ct==="guerrier")?(pityCount+1):0;
  var totalXp=0;
  var un=pendingChest.user_name, cc=pendingChest.class_code;

  try{
    // Persist each reward to the right table
    for(var i=0;i<rewards.length;i++){
      var r=rewards[i];
      if(r.type==="xp"){
        totalXp+=r.xp||0;
        continue;
      }
      if(r.type==="token"){
        var tt=TOKEN_TYPES[r.id];
        if(tt){
          await grantTokenRPC(un,cc,r.id,1,tt.cap||1);
        }
        continue;
      }
      // avatar / skin / frame / title / cheat_sheet → player_rewards
      var rRarity=r.rarity||rarityId;
      var rw=await supabase.from("player_rewards").insert({
        user_name:un, class_code:cc,
        reward_type:r.type, reward_id:r.id, rarity:rRarity,
      });
      if(rw.error)console.warn("[CHEST] player_rewards insert error:",rw.error.message);
    }

    // Single chest_log row per chest (multi-reward summary). Per-item history lives in
    // player_rewards / player_tokens. Keeps log compact and avoids a schema migration.
    var lg=await supabase.from("chest_log").insert({
      user_name:un, class_code:cc,
      chest_type:ct, trigger_source:pendingChest.trigger_source,
      rarity_obtained:rarityId, reward_type:"multi", reward_id:"v2",
      xp_amount:totalXp||null,
    });
    if(lg.error){
      // CRITICAL : if the audit log INSERT fails, do NOT delete the pending row.
      // hasUniqueTrigger relies on chest_log to dedupe future grants — losing the
      // log entry while consuming the pending leaves the trigger source untraceable
      // and re-grantable. Better to let the user see a stuck pending until the
      // schema is fixed than silently corrupt the audit trail.
      console.warn("[CHEST] chest_log insert error (pending kept):",lg.error.message);
    }else{
      var dl=await supabase.from("pending_chests").delete().eq("id",pendingChest.id);
      if(dl.error)console.warn("[CHEST] pending delete error:",dl.error.message);
    }
  }catch(e){console.warn("[CHEST] openChest exception:",e&&e.message);}

  return{
    chestType:ct,
    triggerSource:pendingChest.trigger_source,
    rarityTier:tier,
    rarityId:rarityId,
    rarityColor:RARITIES[tier].color,
    rarityLabel:RARITIES[tier].label,
    rewards:rewards,
    totalXp:totalXp,
    newPityCount:newPity,
  };
}
