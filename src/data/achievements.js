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
  {id:"legend_league",name:"Légende",desc:"Reach the Légende league (30,000 XP)",icon:"⚡",check:function(s){return(s.xp||0)>=30000;}},
  // ─── MOCK TEST ───
  {id:"mock_complete",name:"Trial by Fire",desc:"Complete a Mock Test",icon:"📝",check:function(s){return s.mockResults&&(s.mockResults.mock1||s.mockResults.mock2);}},
  {id:"toeic_master",name:"TOEIC Master",desc:"Score 400+ on a Mock Test",icon:"🏆",check:function(s){if(!s.mockResults)return false;var m1=s.mockResults.mock1;var m2=s.mockResults.mock2;return(m1&&m1.toeicEstimate>=400)||(m2&&m2.toeicEstimate>=400);}},
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
  {id:"all_games",name:"Game Master",desc:"Play 6 different arena games",icon:"🎮",check:function(s){var count=0;if(s.gameScores){if(s.gameScores.matchEasy)count++;if(s.gameScores.wordFall)count++;if(s.gameScores.duel&&s.gameScores.duel.played>=1)count++;}if(s.moduleScores){if(s.moduleScores.tavern&&s.moduleScores.tavern.sessions>=1)count++;if(s.moduleScores.sbuild&&s.moduleScores.sbuild.sessions>=1)count++;if(s.moduleScores.ablitz&&s.moduleScores.ablitz.sessions>=1)count++;if(s.moduleScores.clue&&s.moduleScores.clue.sessions>=1)count++;}return count>=6;}},
  // ─── GRAMMAR GAUNTLET ───
  {id:"irregular_master",name:"Irregular Master",desc:"Complete 10 Irregular Crypt sessions",icon:"🪦",check:function(s){return s.moduleScores&&s.moduleScores["gauntlet_irregular"]&&s.moduleScores["gauntlet_irregular"].sessions>=10;}},
  {id:"tense_sage",name:"Tense Sage",desc:"Chronomancer: 80%+ accuracy (min 30 Q)",icon:"🔮",check:function(s){if(!s.moduleScores||!s.moduleScores["gauntlet_tense"])return false;var m=s.moduleScores["gauntlet_tense"];return m.total>=30&&m.correct/m.total>=0.8;}},
  {id:"passive_alchemist",name:"Passive Alchemist",desc:"30 correct answers in Passive Forge",icon:"⚗️",check:function(s){return s.moduleScores&&s.moduleScores["gauntlet_passive"]&&s.moduleScores["gauntlet_passive"].correct>=30;}},
  {id:"relative_weaver",name:"Relative Weaver",desc:"Relative Weaver: 80%+ accuracy (min 30 Q)",icon:"🕸️",check:function(s){if(!s.moduleScores||!s.moduleScores["gauntlet_relative"])return false;var m=s.moduleScores["gauntlet_relative"];return m.total>=30&&m.correct/m.total>=0.8;}},
  {id:"gauntlet_champion",name:"Gauntlet Champion",desc:"75%+ in all 4 Gauntlet trials (min 15 Q each)",icon:"🛡️",check:function(s){if(!s.moduleScores)return false;var keys=["gauntlet_irregular","gauntlet_tense","gauntlet_passive","gauntlet_relative"];for(var i=0;i<keys.length;i++){var m=s.moduleScores[keys[i]];if(!m||m.total<15||m.correct/m.total<0.75)return false;}return true;}},
];
