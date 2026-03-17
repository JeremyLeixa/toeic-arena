import { getLevel } from "./helpers.js";

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
  // ─── MOCK TEST ───
  {id:"mock_complete",name:"Trial by Fire",desc:"Complete a Mock Test",icon:"📝",check:function(s){return s.mockResults&&(s.mockResults.mock1||s.mockResults.mock2);}},
  {id:"toeic_master",name:"TOEIC Master",desc:"Score 400+ on a Mock Test",icon:"🏆",check:function(s){if(!s.mockResults)return false;var m1=s.mockResults.mock1;var m2=s.mockResults.mock2;return(m1&&m1.toeicEstimate>=400)||(m2&&m2.toeicEstimate>=400);}},
  // ─── ARENA GAMES ───
  {id:"arena_explorer",name:"Arena Explorer",desc:"Play all 3 arena games",icon:"🗺️",check:function(s){return s.gameScores&&s.gameScores.matchEasy&&s.gameScores.matchHard&&s.gameScores.wordFall;}},
  {id:"combo_king",name:"Combo King",desc:"Reach a x6 combo in Word Fall",icon:"👑",check:function(s){return s.gameScores&&s.gameScores.wordFall&&s.gameScores.wordFall.maxCombo>=6;}},
];
