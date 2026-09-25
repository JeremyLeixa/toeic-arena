import { getLevel } from "./helpers.js";

// Mimic Hunt se joue en lecture (mimic) ou à l'oreille (mimic_listen, 2026-09-19) : ses trophées comptent les deux.
function mimicModes(s){var ms=s.moduleScores||{};return [ms.mimic,ms.mimic_listen].filter(Boolean);}
function mimicRuns(s){return mimicModes(s).reduce(function(a,m){return a.concat(m.history||[]);},[]);}
// Nine to Five (The Waygates, 2026-09-24) : réputation et journées dans gameScores.officeDay (officeDone, App.jsx),
// tâches rendues à l'heure dans l'entrée d'history du module "office" (onTime / tasks, posés par recordModule).
function officeDay(s){return (s.gameScores&&s.gameScores.officeDay)||{};}
// Jet Lag (2026-09-25) : réputation et journées dans gameScores.travelDay ; `prepared` (bulletin compris, perturbation
// absorbée) dans l'entrée d'history du module "travel", posé par worldDone (App.jsx).
function travelDay(s){return (s.gameScores&&s.gameScores.travelDay)||{};}
function travelRuns(s){var m=(s.moduleScores||{}).travel;return (m&&m.history)||[];}
// Grammar Gauntlet : ses 7 épreuves (2026-09-25 : Knotbinder, Anchor Hall et Twin Paths y entrent SOUS LEURS IDS
// D'ORIGINE, connsort / prepdrill / gerinf, pour garder l'historique, l'estimateur et les échelons). Les trophées de
// tout le hub (Champion, Explorer, Grinder, Scholar) les comptent toutes ; ceux déjà obtenus restent acquis.
var GAUNTLET_KEYS=["gauntlet_irregular","gauntlet_tense","gauntlet_passive","gauntlet_relative","connsort","prepdrill","gerinf"];
// Trophées des 3 nouvelles épreuves, sur le patron des 4 premières : découverte, sans faute 15/15, maîtrise 30 Q à 80 %.
function gMod(s,id){return (s.moduleScores||{})[id];}
function gFirst(id){return function(s){var m=gMod(s,id);return !!m&&m.sessions>=1;};}
function gPerfect(id){return function(s){var m=gMod(s,id);return !!m&&(m.history||[]).some(function(h){return h.correct===h.total&&h.total>=15;});};}
function gMaster(id){return function(s){var m=gMod(s,id);return !!m&&m.total>=30&&m.correct/m.total>=0.8;};}

export var ACHIEVEMENTS = [
  {id:"first_blood",name:"First Blood",desc:"Complete your first exercise",icon:"⚔️",check:function(s){return s.stats.sessions>=1;}},
  {id:"streak_3",name:"On Fire",desc:"3-day streak",icon:"🔥",check:function(s){return s.streak>=3;}},
  {id:"streak_7",name:"Unstoppable",desc:"7-day streak",icon:"💥",check:function(s){return s.streak>=7;}},
  {id:"streak_30",name:"Legendary",desc:"30-day streak",icon:"🏆",check:function(s){return s.streak>=30;}},
  {id:"vocab_50",name:"Word Collector",desc:"Review 50 flashcards",icon:"📚",check:function(s){return (s.stats.cardsRev||0)>=50;}},
  {id:"perfect_daily",name:"Flawless Victory",desc:"Perfect daily challenge",icon:"✨",check:function(s){return (s.stats.perfects||0)>=1;}},
  {id:"level_5",name:"Rising Star",desc:"Reach level 5",icon:"⭐",check:function(s){return getLevel(s.xp).level>=5;}},
  {id:"level_10",name:"Arena Champion",desc:"Reach level 10",icon:"👑",check:function(s){return getLevel(s.xp).level>=10;}},
  // ─── VOLUME / ENDURANCE ───
  {id:"q_100",name:"Centurion",desc:"Answer 100 questions",icon:"🗡️",check:function(s){return(s.stats.totalQ||0)>=100;}},
  {id:"q_500",name:"Gladiator",desc:"Answer 500 questions",icon:"⚔️",check:function(s){return(s.stats.totalQ||0)>=500;}},
  {id:"q_1000",name:"War Machine",desc:"Answer 1000 questions",icon:"🤖",check:function(s){return(s.stats.totalQ||0)>=1000;}},
  {id:"sessions_25",name:"Regular",desc:"Complete 25 training sessions",icon:"🎖️",check:function(s){return(s.stats.sessions||0)>=25;}},
  {id:"sessions_100",name:"Iron Will",desc:"Complete 100 training sessions",icon:"🛡️",check:function(s){return(s.stats.sessions||0)>=100;}},
  // ─── QUALITY / ACCURACY ───
  {id:"acc_70",name:"Sharpshooter",desc:"70%+ accuracy (min 50 questions)",icon:"🎯",check:function(s){return(s.stats.totalQ||0)>=50&&s.stats.correct/s.stats.totalQ>=0.7;}},
  {id:"acc_85",name:"Sniper",desc:"85%+ accuracy (min 100 questions)",icon:"🔫",check:function(s){return(s.stats.totalQ||0)>=100&&s.stats.correct/s.stats.totalQ>=0.85;}},
  {id:"perfects_5",name:"Perfectionist",desc:"5 perfect daily challenges",icon:"💎",check:function(s){return(s.stats.perfects||0)>=5;}},
  {id:"perfects_10",name:"Untouchable",desc:"10 perfect daily challenges",icon:"🌟",check:function(s){return(s.stats.perfects||0)>=10;}},
  // ─── DIVERSITY / EXPLORATION ───
  {id:"explore_5",name:"Explorer",desc:"Try 5 different modules",icon:"🧭",check:function(s){return s.moduleScores?Object.keys(s.moduleScores).length>=5:false;}},
  {id:"explore_10",name:"Cartographer",desc:"Try 10 different modules",icon:"🗺️",check:function(s){return s.moduleScores?Object.keys(s.moduleScores).length>=10:false;}},
  {id:"mod_master",name:"Specialist",desc:"80%+ on any module (min 20 Q)",icon:"🏅",check:function(s){if(!s.moduleScores)return false;var keys=Object.keys(s.moduleScores);for(var i=0;i<keys.length;i++){var m=s.moduleScores[keys[i]];if(m.total>=20&&m.correct/m.total>=0.8)return true;}return false;}},
  // ─── FLASHCARDS / VOCABULARY ───
  {id:"vocab_200",name:"Lexicon",desc:"Review 200 flashcards",icon:"📖",check:function(s){return(s.stats.cardsRev||0)>=200;}},
  {id:"mastered_25",name:"Memory Palace",desc:"Master 25 vocabulary cards",icon:"🏛️",check:function(s){if(!s.cardStates)return false;var mc=0;Object.keys(s.cardStates).forEach(function(k){if(s.cardStates[k].interval>=7)mc++;});return mc>=25;}},
  {id:"mastered_75",name:"Walking Dictionary",desc:"Master 75 vocabulary cards",icon:"📕",check:function(s){if(!s.cardStates)return false;var mc=0;Object.keys(s.cardStates).forEach(function(k){if(s.cardStates[k].interval>=7)mc++;});return mc>=75;}},
  // ─── LEVELS / XP ───
  {id:"level_20",name:"Warlord",desc:"Reach level 20",icon:"🔱",check:function(s){return getLevel(s.xp).level>=20;}},
    {id:"weekly_500",name:"Weekly Warrior",desc:"Earn 500 XP in one week",icon:"⚡",check:function(s){return(s.weeklyXp||0)>=500;}},
  {id:"legend_league",name:"Légende",desc:"Reach the Légende league (30,000 XP)",icon:"⚡",check:function(s){return(s.xp||0)>=30000;}},
  // ─── MOCK TEST ───
  {id:"mock_complete",name:"Trial by Fire",desc:"Complete a Mock Test",icon:"📝",check:function(s){return s.mockResults&&(s.mockResults.mock1||s.mockResults.mock2||s.mockResults.mock3);}},
  {id:"toeic_master",name:"TOEIC Master",desc:"Score 400+ on a Mock Test",icon:"🏆",check:function(s){if(!s.mockResults)return false;return["mock1","mock2","mock3"].some(function(k){var m=s.mockResults[k];return m&&m.toeicEstimate>=400;});}},
  // ─── WORD TAVERN ───
  {id:"tavern_first",name:"Tavern Visitor",desc:"Complete your first Word Tavern",icon:"🍺",check:function(s){return s.moduleScores&&s.moduleScores.tavern&&s.moduleScores.tavern.sessions>=1;}},
  {id:"tavern_silver",name:"Silver Tongue",desc:"Score 13+/15 in one Word Tavern",icon:"🗣️",check:function(s){if(!s.moduleScores||!s.moduleScores.tavern||!s.moduleScores.tavern.history)return false;for(var i=0;i<s.moduleScores.tavern.history.length;i++){if(s.moduleScores.tavern.history[i].correct>=13)return true;}return false;}},
  {id:"tavern_perfect",name:"Wordsmith",desc:"Perfect 15/15 in one Word Tavern",icon:"⚒️",check:function(s){if(!s.moduleScores||!s.moduleScores.tavern||!s.moduleScores.tavern.history)return false;for(var i=0;i<s.moduleScores.tavern.history.length;i++){var h=s.moduleScores.tavern.history[i];if(h.correct===15&&h.total===15)return true;}return false;}},
  {id:"tavern_regular",name:"Tavern Regular",desc:"Complete 10 Word Tavern sessions",icon:"🍻",check:function(s){return s.moduleScores&&s.moduleScores.tavern&&s.moduleScores.tavern.sessions>=10;}},
  // ─── ARENA GAMES ───
  {id:"arena_explorer",name:"Arena Explorer",desc:"Play 3 different arena games",icon:"🗺️",check:function(s){if(!s.gameScores)return false;var count=0;if(s.gameScores.matchEasy)count++;if(s.gameScores.wordFall)count++;if(s.gameScores.duel&&s.gameScores.duel.played>=1)count++;return count>=3;}},
  {id:"combo_king",name:"Combo King",desc:"Reach a x6 combo in Word Fall",icon:"👑",check:function(s){return s.gameScores&&s.gameScores.wordFall&&s.gameScores.wordFall.maxCombo>=6;}},
  // ─── DUEL ARENA ───
  {id:"duel_first",name:"First Duel",desc:"Complete your first vocabulary duel",icon:"⚔️",check:function(s){return s.gameScores&&s.gameScores.duel&&s.gameScores.duel.played>=1;}},
  {id:"duel_5",name:"Duelist",desc:"Win 5 duels",icon:"🏟️",check:function(s){return s.gameScores&&s.gameScores.duel&&s.gameScores.duel.wins>=5;}},
  {id:"duel_15",name:"Undefeated",desc:"Win 15 duels",icon:"👊",check:function(s){return s.gameScores&&s.gameScores.duel&&s.gameScores.duel.wins>=15;}},
  {id:"xp_thief",name:"XP Thief",desc:"Win a ranked duel (steal your opponent's XP!)",icon:"🦹",check:function(s){return s.gameScores&&s.gameScores.duel&&s.gameScores.duel.wagerWon>0;}},
  {id:"high_roller",name:"High Roller",desc:"Win 200+ XP in ranked duels",icon:"🎰",check:function(s){return s.gameScores&&s.gameScores.duel&&s.gameScores.duel.wagerWon>=200;}},

  // ─── BOSS TEST ───
  {id:"boss_complete",name:"Arena Conqueror",desc:"Complete The Final Arena",icon:"\ud83d\udc09",check:function(s){return s.mockResults&&s.mockResults.boss;}},
  {id:"boss_800",name:"Dragon Slayer",desc:"Score 800+ on The Final Arena",icon:"\ud83d\udd25",check:function(s){return s.mockResults&&s.mockResults.boss&&s.mockResults.boss.toeicEstimate>=800;}},
  // ─── GAME DIVERSITY ───
  {id:"all_games",name:"Game Master",desc:"Play 6 different arena games",icon:"🎮",check:function(s){var count=0;if(s.gameScores){if(s.gameScores.matchEasy)count++;if(s.gameScores.wordFall)count++;if(s.gameScores.duel&&s.gameScores.duel.played>=1)count++;}if(s.moduleScores){if(s.moduleScores.tavern&&s.moduleScores.tavern.sessions>=1)count++;if(s.moduleScores.sbuild&&s.moduleScores.sbuild.sessions>=1)count++;if(s.moduleScores.ablitz&&s.moduleScores.ablitz.sessions>=1)count++;if(s.moduleScores.clue&&s.moduleScores.clue.sessions>=1)count++;if(mimicModes(s).some(function(m){return m.sessions>=1;}))count++;}return count>=6;}},
  // ─── GRAMMAR GAUNTLET ───
  {id:"irregular_master",name:"Irregular Master",desc:"Complete 10 Irregular Crypt sessions",icon:"🪦",check:function(s){return s.moduleScores&&s.moduleScores["gauntlet_irregular"]&&s.moduleScores["gauntlet_irregular"].sessions>=10;}},
  {id:"tense_sage",name:"Tense Sage",desc:"Chronomancer: 80%+ accuracy (min 30 Q)",icon:"🔮",check:function(s){if(!s.moduleScores||!s.moduleScores["gauntlet_tense"])return false;var m=s.moduleScores["gauntlet_tense"];return m.total>=30&&m.correct/m.total>=0.8;}},
  {id:"passive_alchemist",name:"Passive Alchemist",desc:"30 correct answers in Passive Forge",icon:"⚗️",check:function(s){return s.moduleScores&&s.moduleScores["gauntlet_passive"]&&s.moduleScores["gauntlet_passive"].correct>=30;}},
  {id:"relative_weaver",name:"Relative Weaver",desc:"Relative Weaver: 80%+ accuracy (min 30 Q)",icon:"🕸️",check:function(s){if(!s.moduleScores||!s.moduleScores["gauntlet_relative"])return false;var m=s.moduleScores["gauntlet_relative"];return m.total>=30&&m.correct/m.total>=0.8;}},
  {id:"gauntlet_champion",name:"Gauntlet Champion",desc:"75%+ in all 7 Gauntlet trials (min 15 Q each)",icon:"🛡️",check:function(s){if(!s.moduleScores)return false;var keys=GAUNTLET_KEYS;for(var i=0;i<keys.length;i++){var m=s.moduleScores[keys[i]];if(!m||m.total<15||m.correct/m.total<0.75)return false;}return true;}},
  // ─── GAUNTLET — Tier 1 Discovery (badges only) ───
  {id:"crypt_first",name:"Crypt Entered",desc:"Complete your first Irregular Crypt session",icon:"🪦",check:function(s){return s.moduleScores&&s.moduleScores["gauntlet_irregular"]&&s.moduleScores["gauntlet_irregular"].sessions>=1;}},
  {id:"chrono_first",name:"Time Bender",desc:"Complete your first Chronomancer session",icon:"⏳",check:function(s){return s.moduleScores&&s.moduleScores["gauntlet_tense"]&&s.moduleScores["gauntlet_tense"].sessions>=1;}},
  {id:"forge_first",name:"Apprentice Smith",desc:"Complete your first Passive Forge session",icon:"⚒️",check:function(s){return s.moduleScores&&s.moduleScores["gauntlet_passive"]&&s.moduleScores["gauntlet_passive"].sessions>=1;}},
  {id:"weaver_first",name:"First Thread",desc:"Complete your first Relative Weaver session",icon:"🕸️",check:function(s){return s.moduleScores&&s.moduleScores["gauntlet_relative"]&&s.moduleScores["gauntlet_relative"].sessions>=1;}},
  {id:"gauntlet_explorer",name:"Gauntlet Explorer",desc:"Try all 7 Gauntlet trials",icon:"🗝️",check:function(s){if(!s.moduleScores)return false;var keys=GAUNTLET_KEYS;for(var i=0;i<keys.length;i++){var m=s.moduleScores[keys[i]];if(!m||m.sessions<1)return false;}return true;}},
  // ─── GAUNTLET — Tier 2 Perfect Runs (EPIC — grants Guerrier chest) ───
  {id:"crypt_perfect",name:"Flawless Raid",desc:"Perfect 15/15 in Irregular Crypt",icon:"👑",check:function(s){if(!s.moduleScores||!s.moduleScores["gauntlet_irregular"]||!s.moduleScores["gauntlet_irregular"].history)return false;var h=s.moduleScores["gauntlet_irregular"].history;for(var i=0;i<h.length;i++){if(h[i].correct===h[i].total&&h[i].total>=15)return true;}return false;}},
  {id:"chrono_perfect",name:"Time Master",desc:"Perfect 15/15 in Chronomancer",icon:"👑",check:function(s){if(!s.moduleScores||!s.moduleScores["gauntlet_tense"]||!s.moduleScores["gauntlet_tense"].history)return false;var h=s.moduleScores["gauntlet_tense"].history;for(var i=0;i<h.length;i++){if(h[i].correct===h[i].total&&h[i].total>=15)return true;}return false;}},
  {id:"forge_perfect",name:"Forge Master",desc:"Perfect 15/15 in Passive Forge",icon:"👑",check:function(s){if(!s.moduleScores||!s.moduleScores["gauntlet_passive"]||!s.moduleScores["gauntlet_passive"].history)return false;var h=s.moduleScores["gauntlet_passive"].history;for(var i=0;i<h.length;i++){if(h[i].correct===h[i].total&&h[i].total>=15)return true;}return false;}},
  {id:"weaver_perfect",name:"Perfect Weave",desc:"Perfect 15/15 in Relative Weaver",icon:"👑",check:function(s){if(!s.moduleScores||!s.moduleScores["gauntlet_relative"]||!s.moduleScores["gauntlet_relative"].history)return false;var h=s.moduleScores["gauntlet_relative"].history;for(var i=0;i<h.length;i++){if(h[i].correct===h[i].total&&h[i].total>=15)return true;}return false;}},
  // ─── GAUNTLET — Tier 3 Consistency (LEGENDARY — grants Légendaire chest) ───
  {id:"gauntlet_grinder",name:"Gauntlet Grinder",desc:"50 Gauntlet sessions (all sub-modules combined)",icon:"⚙️",check:function(s){if(!s.moduleScores)return false;var keys=GAUNTLET_KEYS;var total=0;for(var i=0;i<keys.length;i++){var m=s.moduleScores[keys[i]];if(m)total+=m.sessions||0;}return total>=50;}},
  {id:"gauntlet_scholar",name:"Gauntlet Scholar",desc:"500 correct answers across all Gauntlet trials",icon:"📚",check:function(s){if(!s.moduleScores)return false;var keys=GAUNTLET_KEYS;var total=0;for(var i=0;i<keys.length;i++){var m=s.moduleScores[keys[i]];if(m)total+=m.correct||0;}return total>=500;}},
  // ─── GAUNTLET — les 3 épreuves du 2026-09-25 (rangs de coffre : chestCatalog.js, NOVICE / EPIC) ───
  {id:"knot_first",name:"First Knot",desc:"Complete your first Knotbinder trial",icon:"🪢",check:gFirst("connsort")},
  {id:"anchor_first",name:"Anchor Dropped",desc:"Complete your first Anchor Hall trial",icon:"⚓",check:gFirst("prepdrill")},
  {id:"twin_first",name:"Fork in the Road",desc:"Complete your first Twin Paths trial",icon:"🔀",check:gFirst("gerinf")},
  {id:"knot_perfect",name:"Unbreakable Knot",desc:"Perfect 15/15 in Knotbinder",icon:"👑",check:gPerfect("connsort")},
  {id:"anchor_perfect",name:"Steady Anchor",desc:"Perfect 15/15 in Anchor Hall",icon:"👑",check:gPerfect("prepdrill")},
  {id:"twin_perfect",name:"Pathfinder",desc:"Perfect 15/15 in Twin Paths",icon:"👑",check:gPerfect("gerinf")},
  {id:"knot_master",name:"Knot Master",desc:"Knotbinder: 80%+ accuracy (min 30 Q)",icon:"🪢",check:gMaster("connsort")},
  {id:"anchor_master",name:"Harbour Master",desc:"Anchor Hall: 80%+ accuracy (min 30 Q)",icon:"⚓",check:gMaster("prepdrill")},
  {id:"twin_master",name:"Path Master",desc:"Twin Paths: 80%+ accuracy (min 30 Q)",icon:"🧭",check:gMaster("gerinf")},
  // ─── MODAL COUNCIL ───
  {id:"council_initiate",name:"Council Initiate",desc:"Complete your first Modal Council session",icon:"⚖️",check:function(s){if(!s.moduleScores)return false;var m=s.moduleScores["modals_match"]||s.moduleScores["modals_sort"];return!!(m&&m.sessions>=1);}},
  {id:"oracle_voice",name:"Oracle's Voice",desc:"Perfect 15/15 in Modal Match",icon:"🔮",check:function(s){if(!s.moduleScores||!s.moduleScores["modals_match"]||!s.moduleScores["modals_match"].history)return false;var h=s.moduleScores["modals_match"].history;for(var i=0;i<h.length;i++){if(h[i].correct===h[i].total&&h[i].total>=15)return true;}return false;}},
  {id:"verdict_sworn",name:"Verdict Sworn",desc:"Perfect 15/15 in Modal Sort",icon:"📜",check:function(s){if(!s.moduleScores||!s.moduleScores["modals_sort"]||!s.moduleScores["modals_sort"].history)return false;var h=s.moduleScores["modals_sort"].history;for(var i=0;i<h.length;i++){if(h[i].correct===h[i].total&&h[i].total>=15)return true;}return false;}},
  {id:"council_crowned",name:"Council Crowned",desc:"80%+ accuracy on both Modal sub-modules (min 30 Q each)",icon:"👑",check:function(s){if(!s.moduleScores)return false;var keys=["modals_match","modals_sort"];for(var i=0;i<keys.length;i++){var m=s.moduleScores[keys[i]];if(!m||m.total<30||m.correct/m.total<0.8)return false;}return true;}},
  // ─── MIMIC HUNT ─── (2026-09-19) La reformulation : lire le sens, pas les mots recopiés. « Unbitten »
  // récompense LA compétence du module (se tromper sur un distracteur neutre est permis, jamais mordre) :
  // il lit `bites` dans l'entrée d'history (posé par recordModule), absent des parties d'avant. Les deux modes comptent.
  {id:"mimic_first",name:"Mimic Spotter",desc:"Complete your first Mimic Hunt",icon:"🪤",check:function(s){return mimicModes(s).some(function(m){return m.sessions>=1;});}},
  {id:"mimic_unbitten",name:"Unbitten",desc:"Finish a Mimic Hunt without a single bite",icon:"🛡️",check:function(s){return mimicRuns(s).some(function(h){return h.bites===0&&h.total>=15;});}},
  {id:"mimic_perfect",name:"Paraphrase Master",desc:"Perfect 15/15 in one Mimic Hunt",icon:"🎭",check:function(s){return mimicRuns(s).some(function(h){return h.correct===h.total&&h.total>=15;});}},
  {id:"mimic_slayer",name:"Mimic Slayer",desc:"Mimic Hunt: 80%+ accuracy (min 60 Q)",icon:"🗡️",check:function(s){var t=0,c=0;mimicModes(s).forEach(function(m){t+=m.total||0;c+=m.correct||0;});return t>=60&&c/t>=0.8;}},
  {id:"office_first",name:"First Day",desc:"Work your first day in Nine to Five",icon:"💼",check:function(s){var m=(s.moduleScores||{}).office;return !!m&&m.sessions>=1;}},
  {id:"office_clean",name:"Clean Desk",desc:"Nine to Five: 5+ tasks in a day, all on time",icon:"🗂️",check:function(s){var m=(s.moduleScores||{}).office;return !!m&&(m.history||[]).some(function(h){return h.tasks>=5&&h.onTime===h.tasks;});}},
  {id:"office_promoted",name:"Promoted",desc:"Reach Associate in Nine to Five",icon:"📈",check:function(s){return (+officeDay(s).rep||0)>=250;}},
  {id:"office_veteran",name:"Ten Days on the Job",desc:"Work 10 days in Nine to Five",icon:"📅",check:function(s){return (+officeDay(s).days||0)>=10;}},
  {id:"travel_first",name:"First Flight",desc:"Complete your first day in Jet Lag",icon:"✈️",check:function(s){var m=(s.moduleScores||{}).travel;return !!m&&m.sessions>=1;}},
  {id:"travel_veteran",name:"Frequent Flyer",desc:"Travel 10 days in Jet Lag",icon:"🧳",check:function(s){return (+travelDay(s).days||0)>=10;}},
  {id:"travel_promoted",name:"Upgraded",desc:"Reach Associate in Jet Lag",icon:"🎫",check:function(s){return (+travelDay(s).rep||0)>=250;}},
  {id:"travel_weatherwise",name:"Weather-wise",desc:"Jet Lag: plan ahead with the forecast on 3 different days",icon:"☂️",check:function(s){return travelRuns(s).filter(function(h){return h.prepared===true;}).length>=3;}},
];
