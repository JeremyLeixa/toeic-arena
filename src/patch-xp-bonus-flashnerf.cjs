// patch-xp-bonus-flashnerf.cjs
// Base : version App.jsx avec patches fr + progression déjà appliqués
//
// PATCH 1 — Flashcards : 100% / 60% / 30% / 0%  (au lieu de 100/30/0)
// PATCH 2 — RankRow : prop bonus optionnelle
// PATCH 3 — Overall tab : nouveau texte bonif XP + badges ⭐ inline Top 3
//
// Récap bonifications finales :
//   📈 Progression TOEIC  → Top 3 : +2 pts  |  Top 10 : +1 pt
//   ⭐ XP Général total   → Top 3 : +1 pt
//   Cumul possible        → max +3 pts
//
// Usage : node patch-xp-bonus-flashnerf.cjs

const fs = require("fs");
const path = require("path");

const FILE   = path.join(__dirname, "App.jsx");
const BACKUP = FILE + ".bak-xpbonus-flashnerf";

if (!fs.existsSync(FILE)) { console.error("❌ App.jsx introuvable."); process.exit(1); }

let src = fs.readFileSync(FILE, "utf8");
const original = src;
let ok = 0;

function patch(label, from, to) {
  if (!src.includes(from)) { console.error(`❌ [${label}] cible introuvable`); process.exit(1); }
  src = src.replace(from, to);
  console.log(`✅ [${label}]`);
  ok++;
}

// ══════════════════════════════════════════════════════════════
// PATCH 1 — Flashcards 100% / 60% / 30% / 0%
// ══════════════════════════════════════════════════════════════
patch("1 — Flashcard 100/60/30/0",
`      // Flashcards : cap agressif 100%/30%/0% — autres : 100%/50%/15%/0%
      var farmMult;
      if(modId==="csess"){
        farmMult=sessionCount===0?1:sessionCount===1?0.30:0;
      } else {
        farmMult=sessionCount===0?1:sessionCount===1?0.5:sessionCount===2?0.15:0;
      }`,
`      // Flashcards : 100% / 60% / 30% / 0% — autres : 100% / 50% / 15% / 0%
      var farmMult;
      if(modId==="csess"){
        farmMult=sessionCount===0?1:sessionCount===1?0.60:sessionCount===2?0.30:0;
      } else {
        farmMult=sessionCount===0?1:sessionCount===1?0.5:sessionCount===2?0.15:0;
      }`
);

// ══════════════════════════════════════════════════════════════
// PATCH 2 — RankRow : ajout prop bonus
// ══════════════════════════════════════════════════════════════
patch("2 — RankRow bonus prop",
`function RankRow(props){var pl=props.pl,rank=props.rank,isMe=props.isMe,unit=props.unit||"XP";
  return(<div style={{display:"flex",alignItems:"center",gap:12,padding:"12px 14px",background:isMe?"rgba(212,148,58,.08)":"var(--bg2)",border:isMe?"1.5px solid rgba(212,148,58,.25)":"1px solid var(--bdr)",borderRadius:12}}>
    <div className="out" style={{width:28,textAlign:"center",fontWeight:800,fontSize:14,color:rank<=3?"var(--gold)":"var(--t3)"}}>{rank<=3?(rank===1?"🥇":rank===2?"🥈":"🥉"):rank}</div>
    <div style={{width:28,display:"flex",justifyContent:"center"}}>{renderAv(pl.avatar,28)}</div>
    <div style={{flex:1}}><div className="out" style={{fontWeight:isMe?700:500,fontSize:14,color:isMe?"var(--cyan)":"var(--t1)"}}>{isMe?pl.name+" (Toi)":pl.name}</div></div>
    <div className="out" style={{fontWeight:700,fontSize:14,color:isMe?"var(--cyan)":"var(--t2)"}}>{pl.pts!==undefined?pl.pts:pl.xp} {unit}</div>
  </div>);
}`,
`function RankRow(props){var pl=props.pl,rank=props.rank,isMe=props.isMe,unit=props.unit||"XP",bonus=props.bonus||null;
  return(<div style={{display:"flex",alignItems:"center",gap:12,padding:"12px 14px",background:isMe?"rgba(212,148,58,.08)":"var(--bg2)",border:isMe?"1.5px solid rgba(212,148,58,.25)":"1px solid var(--bdr)",borderRadius:12}}>
    <div className="out" style={{width:28,textAlign:"center",fontWeight:800,fontSize:14,color:rank<=3?"var(--gold)":"var(--t3)"}}>{rank<=3?(rank===1?"🥇":rank===2?"🥈":"🥉"):rank}</div>
    <div style={{width:28,display:"flex",justifyContent:"center"}}>{renderAv(pl.avatar,28)}</div>
    <div style={{flex:1}}>
      <div className="out" style={{fontWeight:isMe?700:500,fontSize:14,color:isMe?"var(--cyan)":"var(--t1)"}}>{isMe?pl.name+" (Toi)":pl.name}</div>
      {bonus&&<div style={{fontSize:10,color:"var(--gold)",fontWeight:700,marginTop:1}}>{bonus}</div>}
    </div>
    <div className="out" style={{fontWeight:700,fontSize:14,color:isMe?"var(--cyan)":"var(--t2)"}}>{pl.pts!==undefined?pl.pts:pl.xp} {unit}</div>
  </div>);
}`
);

// ══════════════════════════════════════════════════════════════
// PATCH 3 — Overall tab : texte bonif + badges Top 3
// ══════════════════════════════════════════════════════════════
patch("3 — Overall tab banner bonif",
`    <div className="out" style={{fontWeight:800,fontSize:20,color:"var(--gold)"}}>Classement Général</div>
    <div style={{fontSize:12,color:"var(--t2)",marginTop:4}}>Points cumulés sur toutes les saisons</div>
    <div style={{fontSize:11,color:"var(--t3)",marginTop:8}}>Top 3 + Top 10 = points bonus sur ta note finale</div>`,
`    <div className="out" style={{fontWeight:800,fontSize:20,color:"var(--gold)"}}>Classement Général</div>
    <div style={{fontSize:12,color:"var(--t2)",marginTop:4}}>Points de classement cumulés sur toutes les saisons</div>
    <div style={{fontSize:11,color:"var(--gold)",marginTop:8,fontWeight:600}}>⭐ Top 3 XP → +1 pt sur la note finale</div>
    <div style={{fontSize:10,color:"var(--t3)",marginTop:4}}>Cumulable avec le bonus Progression (max +3 pts au total)</div>`
);

patch("3b — Overall rows badges Top 3",
`overallRanking.filter(function(pl){return pl.pts>0;}).map(function(pl,i){return(<RankRow key={i} pl={pl} rank={i+1} isMe={pl.name===u.name} unit="pts"/>);})}`,
`overallRanking.filter(function(pl){return pl.pts>0;}).map(function(pl,i){
      var bonusLabel=i<3?"⭐ +1 pt note finale":null;
      return(<RankRow key={i} pl={pl} rank={i+1} isMe={pl.name===u.name} unit="pts" bonus={bonusLabel}/>);
    })}`
);

// ══════════════════════════════════════════════════════════════
// WRITE
// ══════════════════════════════════════════════════════════════
if (src === original) { console.warn("⚠️ Aucun changement."); process.exit(0); }

fs.writeFileSync(BACKUP, original, "utf8");
console.log(`\n📦 Backup : App.jsx.bak-xpbonus-flashnerf`);
fs.writeFileSync(FILE, src, "utf8");
console.log(`🎉 ${ok}/4 patches appliqués.\n`);
console.log("PATCH 1 — Flashcards : 100% / 60% / 30% / 0% (3 sessions productives)");
console.log("PATCH 2 — RankRow : prop bonus optionnelle (badge sous le nom)");
console.log("PATCH 3 — Classement Général : ⭐ Top 3 XP → +1 pt, badge inline");
console.log("");
console.log("Bonifications finales :");
console.log("  📈 Progression TOEIC → Top 3 : +2 pts | Top 10 : +1 pt");
console.log("  ⭐ XP Général        → Top 3 : +1 pt");
console.log("  Cumul max            → +3 pts");
