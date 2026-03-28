// patch-fr-profile-league.cjs
// Traduit en français l'écran Profil et l'écran Ligue.
// Conservé en anglais : noms et descriptions des achievements,
//   terminologie TOEIC (Listening/Reading), noms des ligues (Bronze…Légende),
//   noms des saisons, abréviations gaming (XP, Lv.).
// Usage : node patch-fr-profile-league.cjs

const fs = require("fs");
const path = require("path");

const FILE   = path.join(__dirname, "App.jsx");
const BACKUP = FILE + ".bak-fr-profile-league";

if (!fs.existsSync(FILE)) { console.error("❌ App.jsx introuvable."); process.exit(1); }

let src = fs.readFileSync(FILE, "utf8");
const original = src;
let ok = 0, ko = 0;

function p(label, from, to) {
  if (!src.includes(from)) { console.error(`❌  [${label}]`); ko++; return; }
  src = src.replace(from, to);
  console.log(`✅  [${label}]`);
  ok++;
}

// ══════════════════════════════════════════════════════════════
// LEAGUE — tab bar
// ══════════════════════════════════════════════════════════════
p("League tabs",
  `{[{k:"week",l:"Week"},{k:"season",l:"Season "+curSeason.id},{k:"overall",l:"Overall"},{k:"progress",l:"📈 Progress"}].map(function(t){`,
  `{[{k:"week",l:"Semaine"},{k:"season",l:"Saison "+curSeason.id},{k:"overall",l:"Général"},{k:"progress",l:"📈 Progrès"}].map(function(t){`
);

// ══════════════════════════════════════════════════════════════
// LEAGUE — season banner
// ══════════════════════════════════════════════════════════════
p("Season banner title",
  `<div className="out" style={{fontWeight:800,fontSize:15,color:curSeason.color}}>Season {curSeason.id}: {curSeason.name}</div>`,
  `<div className="out" style={{fontWeight:800,fontSize:15,color:curSeason.color}}>Saison {curSeason.id} : {curSeason.name}</div>`
);

// ══════════════════════════════════════════════════════════════
// LEAGUE — observer mode (Teacher)
// ══════════════════════════════════════════════════════════════
p("Observer mode",
  `<div className="out" style={{fontWeight:700,fontSize:13,color:"var(--gold)"}}>Observer mode</div>
  <div style={{fontSize:11,color:"var(--t3)"}}>Your stats are hidden from the leaderboard</div>`,
  `<div className="out" style={{fontWeight:700,fontSize:13,color:"var(--gold)"}}>Mode observateur</div>
  <div style={{fontSize:11,color:"var(--t3)"}}>Tes stats sont masquées du classement</div>`
);

// ══════════════════════════════════════════════════════════════
// LEAGUE — mini stat cards (Week XP / Season / Overall)
// ══════════════════════════════════════════════════════════════
p("Stat card Week XP",
  `<div style={{fontSize:10,color:"var(--t3)"}}>Week XP</div>`,
  `<div style={{fontSize:10,color:"var(--t3)"}}>XP semaine</div>`
);
p("Stat card Season",
  `<div style={{fontSize:10,color:"var(--t3)"}}>Season</div>`,
  `<div style={{fontSize:10,color:"var(--t3)"}}>Saison</div>`
);
p("Stat card Overall",
  `<div style={{fontSize:10,color:"var(--t3)"}}>Overall</div>`,
  `<div style={{fontSize:10,color:"var(--t3)"}}>Général</div>`
);

// ══════════════════════════════════════════════════════════════
// LEAGUE — week tab : league card
// ══════════════════════════════════════════════════════════════
p("League card name",
  `<div className="out" style={{fontWeight:800,fontSize:20,color:lg.color}}>{lg.name} League</div>
    <div style={{fontSize:12,color:"var(--t2)",marginTop:4}}>Rank #{weekRank} this week</div>
    {nx&&<div style={{marginTop:10}}><div style={{fontSize:10,color:"var(--t3)",marginBottom:4}}>{nx.min-u.weeklyXp} XP to {nx.name}</div>`,
  `<div className="out" style={{fontWeight:800,fontSize:20,color:lg.color}}>Ligue {lg.name}</div>
    <div style={{fontSize:12,color:"var(--t2)",marginTop:4}}>Rang #{weekRank} cette semaine</div>
    {nx&&<div style={{marginTop:10}}><div style={{fontSize:10,color:"var(--t3)",marginBottom:4}}>{nx.min-u.weeklyXp} XP pour atteindre {nx.name}</div>`
);

// ══════════════════════════════════════════════════════════════
// LEAGUE — week tab : player rows
// ══════════════════════════════════════════════════════════════
p("Player You label",
  `{pl.me?pl.name+" (You)":pl.name}</div>
              {pl.inactive&&<div style={{fontSize:10,color:"var(--t3)",fontWeight:500}}>{"⏸ Inactive this week"}</div>}`,
  `{pl.me?pl.name+" (Toi)":pl.name}</div>
              {pl.inactive&&<div style={{fontSize:10,color:"var(--t3)",fontWeight:500}}>{"⏸ Inactif(ve) cette semaine"}</div>}`
);

p("No one in league",
  `<p style={{fontSize:13,color:"var(--t3)"}}>No one in {lg.name} League yet 🚀</p>`,
  `<p style={{fontSize:13,color:"var(--t3)"}}>Personne en ligue {lg.name} pour l'instant 🚀</p>`
);

p("Show all / my league toggle",
  `{showAllLeagues?"Show my league only ←":"👁 View all "+active.length+" active students"}`,
  `{showAllLeagues?"Ma ligue uniquement ←":"👁 Voir les "+active.length+" participants actifs"}`
);

p("Resets every Monday",
  `<p style={{textAlign:"center",fontSize:11,color:"var(--t3)",marginTop:16}}>Resets every Monday · Ranking determines Season points</p>`,
  `<p style={{textAlign:"center",fontSize:11,color:"var(--t3)",marginTop:16}}>Réinitialisé chaque lundi · Le classement détermine les points de saison</p>`
);

// ══════════════════════════════════════════════════════════════
// LEAGUE — season tab
// ══════════════════════════════════════════════════════════════
p("Season tab title",
  `<div className="out" style={{fontWeight:800,fontSize:20,color:curSeason.color}}>Season {curSeason.id}: {curSeason.name}</div>
    <div style={{fontSize:12,color:"var(--t2)",marginTop:4}}>{curSeason.weeks.length} weeks · {countdown}</div>
    <div style={{fontSize:11,color:"var(--t3)",marginTop:8,lineHeight:1.5}}>Each week, 1st place gets N pts, 2nd gets N-1, ...<br/>Consistency wins over one big week!</div>`,
  `<div className="out" style={{fontWeight:800,fontSize:20,color:curSeason.color}}>Saison {curSeason.id} : {curSeason.name}</div>
    <div style={{fontSize:12,color:"var(--t2)",marginTop:4}}>{curSeason.weeks.length} semaines · {countdown}</div>
    <div style={{fontSize:11,color:"var(--t3)",marginTop:8,lineHeight:1.5}}>Chaque semaine, le 1er gagne N pts, le 2ème N-1...<br/>La régularité prime sur les coups d'éclat !</div>`
);

p("No season data",
  `<p style={{fontSize:13,color:"var(--t3)"}}>No season data yet — start training!</p>`,
  `<p style={{fontSize:13,color:"var(--t3)"}}>Pas encore de données — entraîne-toi !</p>`
);

// ══════════════════════════════════════════════════════════════
// LEAGUE — overall tab
// ══════════════════════════════════════════════════════════════
p("Overall ranking title",
  `<div className="out" style={{fontWeight:800,fontSize:20,color:"var(--gold)"}}>Overall Ranking</div>
    <div style={{fontSize:12,color:"var(--t2)",marginTop:4}}>Cumulative ranking points across all seasons</div>
    <div style={{fontSize:11,color:"var(--t3)",marginTop:8}}>Top 3 + Top 10 = bonus points on your final grade</div>`,
  `<div className="out" style={{fontWeight:800,fontSize:20,color:"var(--gold)"}}>Classement Général</div>
    <div style={{fontSize:12,color:"var(--t2)",marginTop:4}}>Points cumulés sur toutes les saisons</div>
    <div style={{fontSize:11,color:"var(--t3)",marginTop:8}}>Top 3 + Top 10 = points bonus sur ta note finale</div>`
);

p("Done/Active/Soon",
  `{isPast?"Done":isCurrent?"Active":"Soon"}`,
  `{isPast?"Terminé":isCurrent?"En cours":"Bientôt"}`
);

p("No overall data",
  `<p style={{fontSize:13,color:"var(--t3)"}}>No data yet — Season 1 starts March 24!</p>`,
  `<p style={{fontSize:13,color:"var(--t3)"}}>Pas encore de données — la Saison 1 a commencé le 24 mars !</p>`
);

// ══════════════════════════════════════════════════════════════
// LEAGUE — RankRow You label (season + overall tabs)
// ══════════════════════════════════════════════════════════════
p("RankRow You label",
  `{isMe?pl.name+" (You)":pl.name}</div></div>`,
  `{isMe?pl.name+" (Toi)":pl.name}</div></div>`
);

// ══════════════════════════════════════════════════════════════
// LEAGUE — countdown "Ended"
// ══════════════════════════════════════════════════════════════
p("Countdown Ended",
  `color:countdown==="Ended"?"var(--red)":"var(--cyan)"}}>{countdown}`,
  `color:countdown==="Ended"?"var(--red)":"var(--cyan)"}}>{ countdown==="Ended"?"Terminée":countdown}`
);

// ══════════════════════════════════════════════════════════════
// PROFILE — Stats sub-view
// ══════════════════════════════════════════════════════════════
p("Stats subview title",
  `<h1 className="out" style={{fontWeight:800,fontSize:20,margin:0}}>My Stats</h1>`,
  `<h1 className="out" style={{fontWeight:800,fontSize:20,margin:0}}>Mes Stats</h1>`
);

p("Est TOEIC label",
  `<div style={{fontSize:10,color:"var(--t3)",fontWeight:600,letterSpacing:1,textTransform:"uppercase",marginBottom:4}}>Est. TOEIC Score</div>`,
  `<div style={{fontSize:10,color:"var(--t3)",fontWeight:600,letterSpacing:1,textTransform:"uppercase",marginBottom:4}}>Score TOEIC estimé</div>`
);

p("Complete more modules",
  `{toeic.total<=200&&<div style={{fontSize:10,color:"var(--t3)",marginTop:4}}>Complete more modules to refine</div>}`,
  `{toeic.total<=200&&<div style={{fontSize:10,color:"var(--t3)",marginTop:4}}>Complète d'autres modules pour affiner</div>}`
);

p("Based on your training",
  `<div style={{fontSize:9,color:"var(--t3)"}}>Based on your training</div>`,
  `<div style={{fontSize:9,color:"var(--t3)"}}>Basé sur ton entraînement</div>`
);

p("Stats grid labels",
  `{l:"Total XP",v:u.xp,i:"⭐"},
          {l:"Weekly XP",v:u.weeklyXp,i:"⚡"},
          {l:"Accuracy",v:acc+"%",i:"🎯"},
          {l:"Sessions",v:u.stats.sessions,i:"📊"},
          {l:"Cards Reviewed",v:u.stats.cardsRev||0,i:"🃏"},
          {l:"Drills Done",v:u.stats.drills||0,i:"📝"},
          {l:"Perfect Dailies",v:u.stats.perfects||0,i:"✨"},
          {l:"Questions Total",v:u.stats.totalQ||0,i:"❓"}`,
  `{l:"XP Total",v:u.xp,i:"⭐"},
          {l:"XP cette semaine",v:u.weeklyXp,i:"⚡"},
          {l:"Précision",v:acc+"%",i:"🎯"},
          {l:"Sessions",v:u.stats.sessions,i:"📊"},
          {l:"Cartes révisées",v:u.stats.cardsRev||0,i:"🃏"},
          {l:"Exercices faits",v:u.stats.drills||0,i:"📝"},
          {l:"Défis parfaits",v:u.stats.perfects||0,i:"✨"},
          {l:"Questions totales",v:u.stats.totalQ||0,i:"❓"}`
);

// ══════════════════════════════════════════════════════════════
// PROFILE — Avatar sub-view
// ══════════════════════════════════════════════════════════════
p("Upload photo button",
  `style={{fontSize:12,padding:"8px 18px"}}>📷 Upload photo</button>`,
  `style={{fontSize:12,padding:"8px 18px"}}>📷 Importer une photo</button>`
);

p("Remove photo button",
  `style={{fontSize:12,padding:"8px 18px",color:"var(--red)",borderColor:"rgba(255,71,87,.2)"}}>✕ Remove</button>`,
  `style={{fontSize:12,padding:"8px 18px",color:"var(--red)",borderColor:"rgba(255,71,87,.2)"}}>✕ Supprimer</button>`
);

p("Game Master exclusive",
  `>🗝️ Game Master — exclusive avatar</div>`,
  `>🗝️ Game Master — avatar exclusif</div>`
);

// ══════════════════════════════════════════════════════════════
// PROFILE — Main view : settings section
// ══════════════════════════════════════════════════════════════
p("Settings label",
  `<div style={{fontSize:10,color:"var(--t3)",fontWeight:600,letterSpacing:1,textTransform:"uppercase",marginBottom:10}}>Settings</div>`,
  `<div style={{fontSize:10,color:"var(--t3)",fontWeight:600,letterSpacing:1,textTransform:"uppercase",marginBottom:10}}>Paramètres</div>`
);

p("Appearance setting",
  `<div className="out" style={{fontWeight:700,fontSize:14}}>Appearance</div>
            <div style={{fontSize:12,color:"var(--t2)"}}>{u.theme==="light"?"Light mode":"Dark mode"}</div>`,
  `<div className="out" style={{fontWeight:700,fontSize:14}}>Apparence</div>
            <div style={{fontSize:12,color:"var(--t2)"}}>{u.theme==="light"?"Mode clair":"Mode sombre"}</div>`
);

p("Sound effects setting",
  `<div className="out" style={{fontWeight:700,fontSize:14}}>Sound Effects</div>
            <div style={{fontSize:12,color:"var(--t2)"}}>{soundOn?"On":"Off"}</div>`,
  `<div className="out" style={{fontWeight:700,fontSize:14}}>Effets sonores</div>
            <div style={{fontSize:12,color:"var(--t2)"}}>{soundOn?"Activés":"Désactivés"}</div>`
);

p("Daily tips setting",
  `<div className="out" style={{fontWeight:700,fontSize:14}}>Daily Tips</div>
            <div style={{fontSize:12,color:"var(--t2)"}}>Show at startup</div>`,
  `<div className="out" style={{fontWeight:700,fontSize:14}}>Conseils TOEIC</div>
            <div style={{fontSize:12,color:"var(--t2)"}}>Affichés au démarrage</div>`
);

p("Notifications setting",
  `<div className="out" style={{fontWeight:700,fontSize:14}}>Notifications</div>
              <div style={{fontSize:12,color:"var(--t2)"}}>{pushOn?"Streak reminders":"Disabled"}</div>`,
  `<div className="out" style={{fontWeight:700,fontSize:14}}>Notifications</div>
              <div style={{fontSize:12,color:"var(--t2)"}}>{pushOn?"Rappels de série":"Désactivées"}</div>`
);

// ══════════════════════════════════════════════════════════════
// PROFILE — Main view : nav tiles + reset + prompts
// ══════════════════════════════════════════════════════════════
p("Style tile label",
  `<div className="out" style={{fontWeight:800,fontSize:16}}>Style</div>
          <div style={{fontSize:10,color:"var(--t2)",textTransform:"uppercase",letterSpacing:.5,marginBottom:4}}>Avatar</div>`,
  `<div className="out" style={{fontWeight:800,fontSize:16}}>Style</div>
          <div style={{fontSize:10,color:"var(--t2)",textTransform:"uppercase",letterSpacing:.5,marginBottom:4}}>Apparence</div>`
);

p("Reset button",
  `        Reset all data`,
  `        Réinitialiser mes données`
);

p("Prompt teacher code",
  `var code=prompt("Teacher code:");if(code===TEACHER_CODE)p.goTeacher();`,
  `var code=prompt("Code formateur :");if(code===TEACHER_CODE)p.goTeacher();`
);

p("Prompt reset code",
  `var code=prompt("Enter teacher code to reset:");if(code===TEACHER_CODE)p.reset();`,
  `var code=prompt("Code formateur pour réinitialiser :");if(code===TEACHER_CODE)p.reset();`
);

// ══════════════════════════════════════════════════════════════
// LEAGUE — progress tab : You label in progression rows
// ══════════════════════════════════════════════════════════════
p("Progress tab You label",
  `{pl.me?pl.name+" (You)":pl.name}
                </div>
                <div style={{fontSize:10,color:"var(--t3)",marginTop:1}}>
                  {pl.baseline}`,
  `{pl.me?pl.name+" (Toi)":pl.name}
                </div>
                <div style={{fontSize:10,color:"var(--t3)",marginTop:1}}>
                  {pl.baseline}`
);

p("Progress tab You label pending",
  `{pl.me?pl.name+" (You)":pl.name}
                </div>
                <div style={{fontSize:10,color:"var(--t3)",marginTop:1}}>{reason}</div>`,
  `{pl.me?pl.name+" (Toi)":pl.name}
                </div>
                <div style={{fontSize:10,color:"var(--t3)",marginTop:1}}>{reason}</div>`
);

p("Progress reason assessed",
  `var reason=pl.assessedQ<50
              ?("Modules évalués : "+pl.assessedQ+"/50 questions min")
              :"Pas encore de baseline (semaine de référence manquante)";`,
  `var reason=pl.assessedQ<50
              ?("Modules évalués : "+pl.assessedQ+" / 50 questions minimum")
              :"Pas encore de référence (reviens la semaine prochaine)";`
);

// ══════════════════════════════════════════════════════════════
// WRITE
// ══════════════════════════════════════════════════════════════
if (src === original) {
  console.warn("\n⚠️  Aucun changement — patch déjà appliqué ?");
  process.exit(0);
}

fs.writeFileSync(BACKUP, original, "utf8");
console.log(`\n📦 Backup : App.jsx.bak-fr-profile-league`);
fs.writeFileSync(FILE, src, "utf8");
console.log(`🎉 ${ok} traductions appliquées${ko>0?" · "+ko+" introuvables":""}.`);
console.log("\nConservé en anglais : noms achievements, Listening/Reading, noms ligues & saisons, XP, Lv.");
