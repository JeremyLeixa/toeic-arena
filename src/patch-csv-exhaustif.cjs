// patch-csv-exhaustif.cjs
// Export CSV exhaustif v2 — 108 colonnes
// Usage : node patch-csv-exhaustif.cjs

const fs   = require("fs");
const path = require("path");

const FILE   = path.join(__dirname, "App.jsx");
const BACKUP = FILE + ".bak-csv-exhaustif";

if (!fs.existsSync(FILE)) { console.error("❌ App.jsx introuvable."); process.exit(1); }

let src = fs.readFileSync(FILE, "utf8");
const original = src;

// ── Locate exportCSV block ──────────────────────────────────────────────────
// Search for the function opening — unique enough
const FUNC_START = "function exportCSV(){";
const FUNC_ANCHOR = "var headers=[\"Name\",\"XP\",\"Level\"";

let funcIdx = src.indexOf(FUNC_START);
if (funcIdx === -1) { console.error("❌ exportCSV() introuvable."); process.exit(1); }

// Verify it's the right one (has the old headers)
let headersIdx = src.indexOf(FUNC_ANCHOR, funcIdx);
if (headersIdx === -1 || headersIdx - funcIdx > 200) {
  console.error("❌ Ancien format exportCSV introuvable — patch déjà appliqué ?");
  process.exit(1);
}

// Walk back to find the comment line start
let blockStart = src.lastIndexOf("\n  //", funcIdx) + 1;
if (blockStart <= 1) blockStart = funcIdx;

// Walk forward to find the closing brace of the function
let depth = 0, i = funcIdx;
while (i < src.length) {
  if (src[i] === "{") depth++;
  else if (src[i] === "}") { depth--; if (depth === 0) { i++; break; } }
  i++;
}
const blockEnd = i;

console.log("Bloc exportCSV trouvé :", blockEnd - blockStart, "chars");

// ── New function ─────────────────────────────────────────────────────────────
const NEW_BLOCK = `  // CSV Export exhaustif v2
  function exportCSV(){
    var DQ=String.fromCharCode(34);
    function qa(v){return DQ+(v===null||v===undefined?"":String(v).replace(/"/g,DQ+DQ))+DQ;}
    function na(v){return(v===null||v===undefined||v===""||v!==v)?"":v;}
    function pcta(c,t){return t>0?Math.round(c/t*100):"";}
    function fdatea(d){return d||"";}
    function ftimea(s){return s?Math.round(s/60):"";}
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
      Object.keys(ms).forEach(function(k){if(k!=="csess"&&ms[k]&&ms[k].total>0){noFlashQ+=ms[k].total;noFlashC+=ms[k].correct;}});
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
    var csv=headers.join(",")+"\\n"+rows.join("\\n");
    var blob=new Blob(["\\ufeff"+csv],{type:"text/csv;charset=utf-8;"});
    var url=URL.createObjectURL(blob);
    var a=document.createElement("a");
    a.href=url;a.download="toeic_arena_export_"+classCode+"_"+today()+".csv";
    document.body.appendChild(a);a.click();document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }`;

src = src.slice(0, blockStart) + NEW_BLOCK + src.slice(blockEnd);

if (src === original) { console.warn("⚠️ Aucun changement."); process.exit(0); }

fs.writeFileSync(BACKUP, original, "utf8");
console.log("📦 Backup : App.jsx.bak-csv-exhaustif");
fs.writeFileSync(FILE, src, "utf8");
console.log("✅ exportCSV() remplacé — export exhaustif v2");
console.log("");
console.log("108 colonnes : Identité · Stats · TOEIC · Mocks · Jeux · Achievements · Par module (×22)");
console.log("Nouveau : Précision hors Flashcards · Temps mock · Sessions+Questions par module");
