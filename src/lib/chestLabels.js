// Extrait de src/App.jsx le 2026-09-15 (refactor split-app, REFACTOR_PLAN.md). Code déplacé tel quel.
import { ACHIEVEMENTS } from "../data/achievements.js";

// ═══════════════════════════════════════════════════════════════
// TRIGGER LABEL — human-friendly description of why a chest was granted
// ═══════════════════════════════════════════════════════════════
export function getTriggerLabel(trigger){
  if(!trigger)return"Milestone reached";
  if(trigger==="apology_crisis_2026-04-21")return"A gift from your teacher — thanks for your patience";
  if(trigger==="mock_1")return"Mock Test 1 completed";
  if(trigger==="mock_2")return"Mock Test 2 completed";
  if(trigger==="mock_3")return"Mock Test 3 completed";
  if(trigger==="boss_test")return"The Final Arena conquered";
  if(trigger==="streak_7")return"7-day streak";
  if(trigger==="streak_30")return"30-day streak";
  if(trigger==="streak_100")return"100-day streak";
  if(trigger==="xp_1k")return"1,000 XP milestone";
  if(trigger==="xp_3k")return"3,000 XP milestone";
  if(trigger==="xp_5k")return"5,000 XP milestone";
  if(trigger==="xp_10k")return"10,000 XP milestone";
  if(trigger==="xp_20k")return"20,000 XP milestone";
  if(trigger==="xp_30k")return"30,000 XP milestone";
  if(trigger==="xp_50k")return"50,000 XP milestone";
  if(trigger==="duel_win")return"Duel victory";
  if(trigger==="duel_win3")return"3 duel wins in a row";
  if(trigger==="wfall_combo10")return"Word Fall combo x10";
  if(trigger==="wfall_combo20")return"Word Fall combo x20";
  if(trigger==="wfall_combo30")return"Word Fall combo x30";
  if(trigger==="smatch_easy_good")return"Speed Match mastered";
  if(trigger==="smatch_easy_80")return"Speed Match 80%+";
  if(trigger==="smatch_hard_80")return"Speed Match Hard 80%+";
  if(trigger==="clue_perfect")return"Clue Hunter perfect run";
  if(trigger==="ablitz_70")return"Audio Blitz 70%+";
  if(trigger==="ablitz_90")return"Audio Blitz 90%+";
  if(trigger==="sbuild_90")return"Sentence Builder 90%+";
  if(trigger==="gauntlet_irregular_perfect")return"Irregular Crypt perfect raid";
  if(trigger==="gauntlet_tense_perfect")return"Chronomancer mastered";
  if(trigger==="gauntlet_passive_perfect")return"Passive Forge mastered";
  if(trigger==="gauntlet_relative_perfect")return"Relative Weaver mastered";
  if(trigger.indexOf("league_up_")===0){
    var lg=trigger.substring(10);
    return"Promoted to "+lg.charAt(0).toUpperCase()+lg.slice(1)+" League";
  }
  // V2 chest redesign — 5 recurring sources
  if(trigger.indexOf("daily_login_")===0)return"Daily login reward"; // legacy V2 step 2, kept for old chest_log rows
  if(trigger.indexOf("streak_login_")===0)return"3-day streak login";
  if(trigger.indexOf("weekly_toeic_")===0)return"+25 TOEIC pts this week";
  if(trigger.indexOf("podium_")===0)return"League podium — top 3";
  if(trigger.indexOf("mission_streak_")===0){
    var ms=trigger.substring(15);
    return ms+"-day mission streak";
  }
  if(trigger.indexOf("mastery_")===0){
    var modIdT=trigger.substring(8);
    return"Module mastery: "+modIdT;
  }
  if(trigger.indexOf("ach_legendary_")===0){
    var achId=trigger.substring(14);
    var ach=ACHIEVEMENTS.find(function(a){return a.id===achId;});
    return(ach?ach.name:"Legendary achievement")+" unlocked";
  }
  if(trigger.indexOf("ach_epic_")===0){
    var achIdE=trigger.substring(9);
    var achE=ACHIEVEMENTS.find(function(a){return a.id===achIdE;});
    return(achE?achE.name:"Epic achievement")+" unlocked";
  }
  if(trigger.indexOf("ach_novice_")===0){
    var achIdN=trigger.substring(11);
    var achN=ACHIEVEMENTS.find(function(a){return a.id===achIdN;});
    return(achN?achN.name:"Achievement")+" unlocked";
  }
  return"Milestone reached";
}
// Convert "k:v;k:v" inline CSS string to a React style object
export function parseInlineStyle(s){
  var out={};if(!s)return out;
  s.split(";").forEach(function(part){
    var ix=part.indexOf(":");if(ix<0)return;
    var k=part.slice(0,ix).trim(), v=part.slice(ix+1).trim();
    if(!k)return;
    var jsKey=k.replace(/-([a-z])/g,function(_,c){return c.toUpperCase();});
    out[jsKey]=v;
  });
  return out;
}
