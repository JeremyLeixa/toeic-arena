// patch-mock-diminishing.cjs
//
// Protection complète sur les Mock Tests :
//
// PATCH 1 — Gate temporel : minimum 5 minutes (300s) pour valider un XP
//   En dessous : score/résultat sauvegardé (utile pour la progression TOEIC)
//   mais XP = 0. Message explicite affiché.
//
// PATCH 2 — Diminishing returns journaliers :
//   1ère tentative/jour : 100% XP
//   2ème tentative/jour : 40% XP
//   3ème+ tentative/jour : 0 XP
//
// PATCH 3 — mockDone() : routing via applyXpGates() + trackModSession()
//
// PATCH 4 — applyXpGates : cap spécifique mock1/mock2/mock3
//
// PATCH 5 — Affichage résultats avec message gate
//
// Usage : node patch-mock-diminishing.cjs

const fs = require("fs");
const path = require("path");

const FILE   = path.join(__dirname, "App.jsx");
const BACKUP = FILE + ".bak-mock-diminishing";
const MIN_TIME_SEC = 300; // 5 minutes

if (!fs.existsSync(FILE)) { console.error("❌ App.jsx introuvable."); process.exit(1); }

let src = fs.readFileSync(FILE, "utf8");
const original = src;
let ok = 0;

function patch(label, from, to) {
  if (!src.includes(from)) { console.error("❌ ["+label+"] cible introuvable"); process.exit(1); }
  src = src.replace(from, to);
  console.log("✅ ["+label+"]");
  ok++;
}

// ══════════════════════════════════════════════════════════════
// PATCH 1 — mockDone() : gate temporel + applyXpGates + trackModSession
// ══════════════════════════════════════════════════════════════
patch("1 — mockDone gate + applyXpGates",
`function mockDone(result,xp){var c=addXp(xp);c.stats.totalQ+=result.total;c.stats.correct+=result.score;c.stats.sessions+=1;if(!c.mockResults)c.mockResults={};c.mockResults["mock"+result.mockId]=result;recordModule(c,"mock"+result.mockId,result.score,result.total);try{if(result.total>0&&result.score/result.total>=0.7)playJingleMock();else playJingleMockOk();}catch(e){}sv(c);}`,
`function mockDone(result,xp){
    var modId="mock"+result.mockId;
    var timeGateOk=(result.timeUsed||0)>=`+MIN_TIME_SEC+`;
    var gxp=timeGateOk?applyXpGates(xp,result.score,result.total,modId):0;
    var c=addXp(gxp);
    c.stats.totalQ+=result.total;c.stats.correct+=result.score;c.stats.sessions+=1;
    if(!c.mockResults)c.mockResults={};
    c.mockResults["mock"+result.mockId]=result;
    trackModSession(c,modId);
    recordModule(c,modId,result.score,result.total);
    try{if(result.total>0&&result.score/result.total>=0.7)playJingleMock();else playJingleMockOk();}catch(e){}
    sv(c);
  }`
);

// ══════════════════════════════════════════════════════════════
// PATCH 2 — applyXpGates : cap spécifique mock tests (100/40/0)
// ══════════════════════════════════════════════════════════════
patch("2 — applyXpGates cap mock",
`      // Flashcards : 100% / 60% / 30% / 0% — autres : 100% / 50% / 15% / 0%
      var farmMult;
      if(modId==="csess"){
        farmMult=sessionCount===0?1:sessionCount===1?0.60:sessionCount===2?0.30:0;
      } else {
        farmMult=sessionCount===0?1:sessionCount===1?0.5:sessionCount===2?0.15:0;
      }`,
`      // Flashcards : 100% / 60% / 30% / 0%
      // Mock Tests  : 100% / 40% / 0%
      // Autres      : 100% / 50% / 15% / 0%
      var farmMult;
      if(modId==="csess"){
        farmMult=sessionCount===0?1:sessionCount===1?0.60:sessionCount===2?0.30:0;
      } else if(modId==="mock1"||modId==="mock2"||modId==="mock3"){
        farmMult=sessionCount===0?1:sessionCount===1?0.40:0;
      } else {
        farmMult=sessionCount===0?1:sessionCount===1?0.5:sessionCount===2?0.15:0;
      }`
);

// ══════════════════════════════════════════════════════════════
// PATCH 3 — Écran résultats : XP display avec gate info
// ══════════════════════════════════════════════════════════════
patch("3 — results XP display",
`      <div className="out" style={{fontSize:20,fontWeight:800,color:"var(--gold)",marginBottom:20}}>+{xp} XP</div>

      <button className="btn1" onClick={function(){setReviewMode(true);setReviewSection("p5");setReviewIdx(0);}}>📖 Review Answers</button>
      <button className="btn2" onClick={function(){result.mockId=mockId;p.done(result,xp);}} style={{marginTop:10,width:"100%"}}>Save & Exit</button>`,
`      {(function(){
        var timeGateOk=(result.timeUsed||0)>=`+MIN_TIME_SEC+`;
        var modId2="mock"+mockId;
        var dms=p.u.dailyModSessions||{};
        var sessCount=dms[modId2+"_"+today()]||0;
        var mult=sessCount===0?1:sessCount===1?0.40:0;
        var gxp=timeGateOk?Math.round(xp*mult):0;
        if(!timeGateOk)return(<div style={{marginBottom:20}}>
          <div className="out" style={{fontSize:16,fontWeight:700,color:"var(--t3)"}}>+0 XP</div>
          <div style={{fontSize:11,color:"var(--red)",marginTop:2}}>Test complété en moins de 5 min — XP non comptabilisé</div>
          <div style={{fontSize:10,color:"var(--t3)",marginTop:2}}>Tes résultats TOEIC sont sauvegardés</div>
        </div>);
        if(mult===1)return(<div className="out" style={{fontSize:20,fontWeight:800,color:"var(--gold)",marginBottom:20}}>+{gxp} XP</div>);
        if(mult>0)return(<div style={{marginBottom:20}}>
          <div className="out" style={{fontSize:18,fontWeight:800,color:"var(--orange)"}}>+{gxp} XP</div>
          <div style={{fontSize:11,color:"var(--t3)",marginTop:2}}>XP réduit — 2ème tentative aujourd'hui</div>
        </div>);
        return(<div style={{marginBottom:20}}>
          <div className="out" style={{fontSize:16,fontWeight:700,color:"var(--t3)"}}>+0 XP</div>
          <div style={{fontSize:11,color:"var(--red)",marginTop:2}}>Limite journalière atteinte — reviens demain !</div>
          <div style={{fontSize:10,color:"var(--t3)",marginTop:2}}>Tes résultats TOEIC sont sauvegardés</div>
        </div>);
      })()}

      <button className="btn1" onClick={function(){setReviewMode(true);setReviewSection("p5");setReviewIdx(0);}}>📖 Review Answers</button>
      <button className="btn2" onClick={function(){result.mockId=mockId;p.done(result,xp);}} style={{marginTop:10,width:"100%"}}>Save & Exit</button>`
);

// ══════════════════════════════════════════════════════════════
// WRITE
// ══════════════════════════════════════════════════════════════
if (src === original) { console.warn("⚠️ Aucun changement."); process.exit(0); }

fs.writeFileSync(BACKUP, original, "utf8");
console.log("\n📦 Backup : App.jsx.bak-mock-diminishing");
fs.writeFileSync(FILE, src, "utf8");
console.log("🎉 "+ok+"/3 patches appliqués.\n");
console.log("Gate temporel  : < 5 min → 0 XP (résultats TOEIC conservés)");
console.log("1ère tentative : 100% XP");
console.log("2ème tentative : 40% XP + message");
console.log("3ème+          : 0 XP + message 'reviens demain'");
