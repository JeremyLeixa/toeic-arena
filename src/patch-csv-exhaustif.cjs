// patch-csv-exhaustif.cjs
// Export CSV exhaustif — remplace exportCSV() par une version complète (~100 colonnes)
// Usage : node patch-csv-exhaustif.cjs

const fs = require("fs");
const path = require("path");
const FILE = path.join(__dirname, "App.jsx");
const BACKUP = FILE + ".bak-csv-exhaustif";

if (!fs.existsSync(FILE)) { console.error("❌ App.jsx introuvable."); process.exit(1); }

let src = fs.readFileSync(FILE, "utf8");
const original = src;

// Appliqué directement par remplacement de la fonction exportCSV existante
const OLD_COMMENT = "  // ── CSV Export ──\n  function exportCSV(){";
const END_ANCHOR  = "\n\n  // ── Custom Recharts Tooltip ──";

const startIdx = src.indexOf(OLD_COMMENT);
const endIdx   = src.indexOf(END_ANCHOR, startIdx);

if (startIdx === -1) { console.error("❌ Bloc exportCSV introuvable."); process.exit(1); }
if (endIdx   === -1) { console.error("❌ Ancre de fin introuvable."); process.exit(1); }


const NEW_BLOCK = `  // ── CSV Export exhaustif v2 ──
  function exportCSV(){
    function qa(v){return'"'+(v===null||v===undefined?"":String(v).replace(/"/g,'""'))+'"';}
    function na(v){return(v===null||v===undefined||v===""||v!==v)?"":v;}
    function pcta(correct,total){return total>0?Math.round(correct/total*100):"";}
    function fdatea(d){return d||"";}
    function ftimea(sec){return sec?Math.round(sec/60):"";}
    var headers=[
      "Nom","Classe","XP Total","XP Semaine","Niveau","Ligue","Streak","Derniere activite",
      "Sessions totales","Temps total (min)",
      "Questions totales","Bonnes reponses","Precision globale %","Precision hors Flashcards %",
      "Cartes revisees","Exercices drill","Defis parfaits","Daily completions semaine",
      "TOEIC estime total","TOEIC Listening","TOEIC Reading",
      "Mock1 TOEIC estime","Mock1 Score %","Mock1 Questions","Mock1 Date","Mock1 Temps (min)",
      "Mock2 TOEIC estime","Mock2 Score %","Mock2 Questions","Mock2 Date","Mock2 Temps (min)",
      "SpeedEasy score","SpeedEasy temps (s)","SpeedHard score","SpeedHard temps (s)",
      "WordFall score","WordFall combo max",
      "Duel parties","Duel victoires","Duel XP vole",
      "Achievements debloques","Achievements total",
    ];
    MISSION_MODULES.forEach(function(m){
      headers.push(m.name+" Precision%");
      headers.push(m.name+" Sessions");
      headers.push(m.name+" Questions");
    });
    var rows=students.map(function(s){
      var stats=s.stats||{totalQ:0,correct:0,sessions:0,cardsRev:0,drills:0,perfects:0};
      var ms=s.module_scores||s.moduleScores||{};
      var gs=s.game_scores||s.gameScores||{};
      var mr=s.mock_results||s.mockResults||{};
      var lvl=getLevel(s.xp||0);
      var lg=LEAGUES.slice().reverse().find(function(l){return(s.xp||0)>=l.min;})||LEAGUES[0];
      var toeic=estimateTOEIC(s);
      var noFlashQ=0,noFlashC=0;
      Object.keys(ms).forEach(function(k){
        if(k!=="csess"&&ms[k]&&ms[k].total>0){noFlashQ+=ms[k].total;noFlashC+=ms[k].correct;}
      });
      function mockC(mk){var r=mr[mk];if(!r)return["","","","",""];return[na(r.toeicEstimate),r.total>0?Math.round(r.score/r.total*100):"",na(r.total),fdatea(r.date),ftimea(r.timeUsed)];}
      var ach=s.unlocked_ach||s.unlockedAch||[];
      var row=[
        qa(s.name),qa(s.class_code||s.classCode||""),
        na(s.xp||0),na(s.weekly_xp||s.weeklyXp||0),
        na(lvl.level),qa(lg.name),na(s.streak||0),fdatea(s.last_active||s.lastActive),
        na(stats.sessions),na(Math.round((s.total_time||0)/60)),
        na(stats.totalQ||0),na(stats.correct||0),
        pcta(stats.correct||0,stats.totalQ||0),pcta(noFlashC,noFlashQ),
        na(stats.cardsRev||0),na(stats.drills||0),na(stats.perfects||0),
        na(s.weekly_daily_count||s.weeklyDailyCount||0),
        na(toeic.total),na(toeic.listening),na(toeic.reading),
      ].concat(mockC("mock1")).concat(mockC("mock2")).concat([
        na(gs.matchEasy?gs.matchEasy.score:""),na(gs.matchEasy?gs.matchEasy.time:""),
        na(gs.matchHard?gs.matchHard.score:""),na(gs.matchHard?gs.matchHard.time:""),
        na(gs.wordFall?gs.wordFall.score:""),na(gs.wordFall?(gs.wordFall.maxCombo||0):""),
        na(gs.duel?gs.duel.played:0),na(gs.duel?gs.duel.wins:0),na(gs.duel?(gs.duel.wagerWon||0):0),
        na(ach.length),na(ACHIEVEMENTS.length),
      ]);
      MISSION_MODULES.forEach(function(m){
        var d=ms[m.id];
        row.push(d&&d.total>0?Math.round(d.correct/d.total*100):"");
        row.push(d?na(d.sessions):"");
        row.push(d?na(d.total):"");
      });
      return row.join(",");
    });
    var csv=headers.join(",")+"\n"+rows.join("\n");
    var blob=new Blob(["\ufeff"+csv],{type:"text/csv;charset=utf-8;"});
    var url=URL.createObjectURL(blob);
    var a=document.createElement("a");
    a.href=url;a.download="toeic_arena_export_"+classCode+"_"+today()+".csv";
    document.body.appendChild(a);a.click();document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }`;

src = src.slice(0, startIdx) + NEW_BLOCK + src.slice(endIdx);

if (src === original) { console.warn("⚠️ Aucun changement."); process.exit(0); }

fs.writeFileSync(BACKUP, original, "utf8");
console.log("📦 Backup : App.jsx.bak-csv-exhaustif");
fs.writeFileSync(FILE, src, "utf8");
console.log("✅ exportCSV() remplacé — export exhaustif v2");
console.log("");
console.log("Colonnes exportées (~" + (41 + 22*3) + " colonnes) :");
console.log("  Identité & global   : Nom, Classe, XP, XP semaine, Niveau, Ligue, Streak, Dernière activité");
console.log("  Stats               : Sessions, Temps, Questions, Précision, Précision HORS Flashcards");
console.log("                        Cartes, Drills, Défis parfaits, Daily count");
console.log("  TOEIC estimé        : Total / Listening / Reading");
console.log("  Mock 1 & 2          : TOEIC estimé, Score%, Questions, Date, Temps (min)");
console.log("  Jeux                : SpeedMatch Easy/Hard, WordFall, Duel");
console.log("  Achievements        : Débloqués / Total");
console.log("  Par module (×22)    : Précision% + Sessions + Questions");
