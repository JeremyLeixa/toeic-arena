// patch-ab-league-gate-flashcard-xp.cjs
//
// PATCH A — Ligue Légende conditionnelle
//   • Ajoute getEffectiveLeague(wxp, ms) : retourne Champion si TOEIC estimé < 400
//   • Appliqué dans Home, League, Profile (affichage ligue de l'utilisateur courant)
//   • Affichage : badge "Légende (locked)" + explication si en cours de déverrouillage
//
// PATCH B — Flashcard XP : suppression du bypass
//   • cardsDone() passait directement à addXp() sans passer par applyXpGates()
//     → les diminishing returns n'ont JAMAIS fonctionné pour les Flashcards
//   • Fix : routing via applyXpGates() + trackModSession()
//   • Cap Flashcards : 1ère session 100%, 2ème 30%, 3ème+ 0 XP (plus agressif)
//   • recordModule() reçoit désormais le vrai ok/tot au lieu de 1/1 fictif
//   • CardSess transmet ok et tot à done() pour que la gate puisse les lire
//
// Usage : node patch-ab-league-gate-flashcard-xp.cjs

const fs = require("fs");
const path = require("path");

const FILE   = path.join(__dirname, "App.jsx");
const BACKUP = FILE + ".bak-ab-league-flashcard";

if (!fs.existsSync(FILE)) {
  console.error("❌ App.jsx introuvable dans le dossier courant.");
  process.exit(1);
}

let src = fs.readFileSync(FILE, "utf8");
const original = src;
let patchCount = 0;

function patch(label, oldStr, newStr) {
  if (!src.includes(oldStr)) {
    console.error(`❌ PATCH ${label} : cible introuvable.`);
    process.exit(1);
  }
  src = src.replace(oldStr, newStr);
  console.log(`✅ PATCH ${label} OK`);
  patchCount++;
}

// ════════════════════════════════════════════════════════════════
// PATCH A-1 — Ajoute getEffectiveLeague() juste après getLeague()
// ════════════════════════════════════════════════════════════════
patch(
  "A-1 — getEffectiveLeague helper",
  `function getLeague(wxp){var l=LEAGUES[0];for(var i=0;i<LEAGUES.length;i++)if(wxp>=LEAGUES[i].min)l=LEAGUES[i];return l;}`,
  `function getLeague(wxp){var l=LEAGUES[0];for(var i=0;i<LEAGUES.length;i++)if(wxp>=LEAGUES[i].min)l=LEAGUES[i];return l;}
// Légende est conditionnelle : TOEIC estimé >= 400 requis
// Si non atteint, on affiche Champion avec un badge "locked"
function getEffectiveLeague(wxp,ms){
  var l=getLeague(wxp);
  if(l.id==="legend"){
    var toeic=estimateTOEICScore(ms||{});
    if(toeic.total<400){
      var champ=LEAGUES.find(function(lg){return lg.id==="champion";});
      return Object.assign({},champ||l,{locked:true,lockedScore:toeic.total});
    }
  }
  return l;
}`
);

// ════════════════════════════════════════════════════════════════
// PATCH A-2 — Home : getLeague → getEffectiveLeague
// ════════════════════════════════════════════════════════════════
patch(
  "A-2 — Home getEffectiveLeague",
  `function Home(p){var u=p.u,lv=getLevel(u.xp),lg=getLeague(u.weeklyXp),dd=u.daily.date===today()&&u.daily.done;`,
  `function Home(p){var u=p.u,lv=getLevel(u.xp),lg=getEffectiveLeague(u.weeklyXp,u.moduleScores),dd=u.daily.date===today()&&u.daily.done;`
);

// ════════════════════════════════════════════════════════════════
// PATCH A-3 — League component : getLeague → getEffectiveLeague
// ════════════════════════════════════════════════════════════════
patch(
  "A-3 — League component getEffectiveLeague",
  `function League(p){var u=p.u,lg=getLeague(u.weeklyXp);`,
  `function League(p){var u=p.u,lg=getEffectiveLeague(u.weeklyXp,u.moduleScores);`
);

// ════════════════════════════════════════════════════════════════
// PATCH A-4 — Profile : getLeague → getEffectiveLeague
// ════════════════════════════════════════════════════════════════
patch(
  "A-4 — Profile getEffectiveLeague",
  `var lv=getLevel(u.xp),lg=getLeague(u.weeklyXp);`,
  `var lv=getLevel(u.xp),lg=getEffectiveLeague(u.weeklyXp,u.moduleScores);`
);

// ════════════════════════════════════════════════════════════════
// PATCH A-5 — Affichage badge ligue dans Profile hero
//   Si locked : badge "🏆 Champion" + tooltip "Légende locked (score actuel XX)"
//   Remplace le span de ligue dans le hero principal du profil
// ════════════════════════════════════════════════════════════════
patch(
  "A-5 — Profile hero badge ligue locked",
  `<span style={{fontSize:12,padding:"3px 10px",borderRadius:20,border:"1px solid rgba(139,94,131,.2)",background:"rgba(139,94,131,.1)",color:lg.color}}>{lg.icon} {lg.name}</span>`,
  `<span style={{fontSize:12,padding:"3px 10px",borderRadius:20,border:"1px solid rgba(139,94,131,.2)",background:"rgba(139,94,131,.1)",color:lg.color}}>
  {lg.icon} {lg.name}
  {lg.locked&&<span style={{fontSize:10,color:"var(--t3)",marginLeft:4}}>🔒</span>}
</span>
{lg.locked&&<span style={{fontSize:11,color:"var(--t3)",padding:"3px 10px",borderRadius:20,background:"rgba(255,71,87,.06)",border:"1px solid rgba(255,71,87,.15)"}}>Légende: TOEIC {lg.lockedScore}/400</span>}`
);

// ════════════════════════════════════════════════════════════════
// PATCH B-1 — applyXpGates : cap Flashcards plus agressif
//   Flashcards (csess) : 1ère=100%, 2ème=30%, 3ème+=0%
//   Autres modules : comportement inchangé (1,0.5,0.15,0)
// ════════════════════════════════════════════════════════════════
patch(
  "B-1 — applyXpGates cap Flashcards",
  `      // 1ère session : 100% — 2ème : 50% — 3ème : 15% — 4ème+ : 0 XP
      var farmMult=sessionCount===0?1:sessionCount===1?0.5:sessionCount===2?0.15:0;`,
  `      // Flashcards : cap agressif 100%/30%/0% — autres : 100%/50%/15%/0%
      var farmMult;
      if(modId==="csess"){
        farmMult=sessionCount===0?1:sessionCount===1?0.30:0;
      } else {
        farmMult=sessionCount===0?1:sessionCount===1?0.5:sessionCount===2?0.15:0;
      }`
);

// ════════════════════════════════════════════════════════════════
// PATCH B-2 — CardSess : transmet ok et tot à p.done()
// ════════════════════════════════════════════════════════════════
patch(
  "B-2 — CardSess done(xp,ok,tot)",
  `<button className="btn1" onClick={function(){if(done)p.done(xp,tot);else p.back();}} style={{marginTop:32}}>{done?"Collect XP":"Back"}</button>`,
  `<button className="btn1" onClick={function(){if(done)p.done(xp,ok,tot);else p.back();}} style={{marginTop:32}}>{done?"Collect XP":"Back"}</button>`
);

// ════════════════════════════════════════════════════════════════
// PATCH B-3 — cardsDone : routing via applyXpGates + trackModSession
//   Avant : addXp(xp) direct — bypass total
//   Après : applyXpGates → addXp → trackModSession → recordModule(ok réel)
// ════════════════════════════════════════════════════════════════
patch(
  "B-3 — cardsDone via applyXpGates",
  `function cardsDone(xp){var modId=sp==="cdom"?"csess":sp;var c=addXp(xp);c.stats.sessions+=1;recordModule(c,"csess",1,1);checkMission(c,"csess");sv(c);sSP(null);}`,
  `function cardsDone(xp,ok,tot){
    var gxp=applyXpGates(xp,ok||0,tot||1,"csess");
    var c=addXp(gxp);
    c.stats.sessions+=1;
    trackModSession(c,"csess");
    recordModule(c,"csess",ok||0,tot||1);
    checkMission(c,"csess");
    sv(c);sSP(null);
  }`
);

// ════════════════════════════════════════════════════════════════
// WRITE
// ════════════════════════════════════════════════════════════════
if (src === original) {
  console.warn("⚠️  Aucun changement détecté — le patch a peut-être déjà été appliqué.");
  process.exit(0);
}

fs.writeFileSync(BACKUP, original, "utf8");
console.log(`\n📦 Backup : App.jsx.bak-ab-league-flashcard`);
fs.writeFileSync(FILE, src, "utf8");
console.log(`🎉 ${patchCount}/7 patches appliqués.\n`);
console.log("PATCH A — Ligue Légende conditionnelle :");
console.log("  • getEffectiveLeague(wxp, ms) : Légende bloquée si TOEIC estimé < 400");
console.log("  • Affiché : 🏆 Champion 🔒 + badge 'Légende: TOEIC XX/400'");
console.log("  • Appliqué dans Home, League, Profile");
console.log("");
console.log("PATCH B — Flashcard XP fix :");
console.log("  • Suppression du bypass addXp() direct → routing via applyXpGates()");
console.log("  • Cap Flashcards : 1ère session 100%, 2ème 30%, 3ème+ 0 XP");
console.log("  • recordModule() reçoit ok/tot réels (fin du 1/1 fictif)");
console.log("  • trackModSession() appelé (compteur journalier désormais actif)");
