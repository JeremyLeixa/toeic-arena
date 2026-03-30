// patch-avatar-fix.cjs
// Corrige l'affichage des avatars photo (base64) partout dans l'app :
//   1. Ajoute un helper global renderAv()
//   2. Home  — {u.avatar} dans le titre h1
//   3. League RankRow — {pl.avatar}
//   4. League Week tab — {pl.avatar}
//   5. Profile hero — div emoji → renderAv()
// Usage : node patch-avatar-fix.cjs

const fs = require("fs");
const path = require("path");

const FILE   = path.join(__dirname, "App.jsx");
const BACKUP = FILE + ".bak-avatar-fix";

if (!fs.existsSync(FILE)) {
  console.error("❌ App.jsx introuvable dans le dossier courant.");
  process.exit(1);
}

let src = fs.readFileSync(FILE, "utf8");
const original = src;
let ok = 0;

function patch(label, oldStr, newStr) {
  if (!src.includes(oldStr)) {
    console.error(`❌ PATCH ${label} : cible introuvable.`);
    process.exit(1);
  }
  src = src.replace(oldStr, newStr);
  console.log(`✅ PATCH ${label} OK`);
  ok++;
}

// ─── PATCH 0 — Helper global renderAv() ────────────────────────────────────
// Inséré juste après la fonction Bar (qui est courte et bien identifiable)
patch(
  "0 — helper renderAv()",
  `function Bar(p){var pct=p.max>0?Math.min(100,p.value/p.max*100):0;return(<div style={{width:"100%",height:p.h||8,background:"var(--bg3)",borderRadius:99,overflow:"hidden"}}><div style={{width:pct+"%",height:"100%",background:p.color||"linear-gradient(90deg,#d4943a,#c87a35)",borderRadius:99,transition:"width .8s cubic-bezier(.4,0,.2,1)"}}/></div>);}`,
  `function Bar(p){var pct=p.max>0?Math.min(100,p.value/p.max*100):0;return(<div style={{width:"100%",height:p.h||8,background:"var(--bg3)",borderRadius:99,overflow:"hidden"}}><div style={{width:pct+"%",height:"100%",background:p.color||"linear-gradient(90deg,#d4943a,#c87a35)",borderRadius:99,transition:"width .8s cubic-bezier(.4,0,.2,1)"}}/></div>);}
// ─── Avatar renderer — handles both emoji and base64 photo ───
function renderAv(avatar,size){
  var s=size||32;
  if(avatar&&avatar.startsWith("data:")){
    return(<img src={avatar} style={{width:s,height:s,borderRadius:"50%",objectFit:"cover",display:"inline-block",verticalAlign:"middle",flexShrink:0}}/>);
  }
  return(<span style={{fontSize:s*0.6,lineHeight:1,display:"inline-flex",alignItems:"center",justifyContent:"center",width:s,height:s,flexShrink:0}}>{avatar||"⚔️"}</span>);
}`
);

// ─── PATCH 1 — Home : avatar dans le titre h1 ──────────────────────────────
// Pour une photo, afficher un mini cercle à côté du nom plutôt que la string base64
patch(
  "1 — Home hero avatar",
  `<div><p style={{color:"var(--t2)",fontSize:13,marginBottom:2}}>Welcome back</p><h1 className="out" style={{fontWeight:800,fontSize:24}}>{u.name} {u.avatar||"⚔️"}</h1></div>`,
  `<div><p style={{color:"var(--t2)",fontSize:13,marginBottom:2}}>Welcome back</p><h1 className="out" style={{fontWeight:800,fontSize:24,display:"flex",alignItems:"center",gap:8}}>{u.name} {renderAv(u.avatar,28)}</h1></div>`
);

// ─── PATCH 2 — League RankRow : {pl.avatar} ────────────────────────────────
patch(
  "2 — League RankRow",
  `<div style={{fontSize:20,width:28,textAlign:"center"}}>{pl.avatar}</div>
    <div style={{flex:1}}><div className="out" style={{fontWeight:isMe?700:500,fontSize:14,color:isMe?"var(--cyan)":"var(--t1)"}}>{isMe?pl.name+" (You)":pl.name}</div></div>`,
  `<div style={{width:28,display:"flex",justifyContent:"center"}}>{renderAv(pl.avatar,28)}</div>
    <div style={{flex:1}}><div className="out" style={{fontWeight:isMe?700:500,fontSize:14,color:isMe?"var(--cyan)":"var(--t1)"}}>{isMe?pl.name+" (You)":pl.name}</div></div>`
);

// ─── PATCH 3 — League Week tab : {pl.avatar} ───────────────────────────────
patch(
  "3 — League Week tab",
  `<div style={{fontSize:20,width:28,textAlign:"center"}}>{pl.avatar}</div>
            <div style={{flex:1}}>
              <div className="out" style={{fontWeight:pl.me?700:500,fontSize:14,color:pl.me?"var(--cyan)":pl.inactive?"var(--t3)":"var(--t1)"}}>{pl.me?pl.name+" (You)":pl.name}</div>`,
  `<div style={{width:28,display:"flex",justifyContent:"center"}}>{renderAv(pl.avatar,28)}</div>
            <div style={{flex:1}}>
              <div className="out" style={{fontWeight:pl.me?700:500,fontSize:14,color:pl.me?"var(--cyan)":pl.inactive?"var(--t3)":"var(--t1)"}}>{pl.me?pl.name+" (You)":pl.name}</div>`
);

// ─── PATCH 4 — Profile hero (ancienne version sans patch-profile-redesign) ─
// Garde-fou : si le patch profile-redesign n'a pas encore été appliqué,
// on corrige l'ancienne hero div aussi. Si elle n'est plus là, on skip.
const OLD_PROFILE_HERO = `<div style={{width:72,height:72,borderRadius:"50%",background:"linear-gradient(135deg,#d4943a,#8b5e83)",display:"flex",alignItems:"center",justifyContent:"center",margin:"0 auto 12px",fontSize:38}}>{u.avatar||"⚔️"}</div>`;
if (src.includes(OLD_PROFILE_HERO)) {
  src = src.replace(
    OLD_PROFILE_HERO,
    `<div style={{width:72,height:72,borderRadius:"50%",background:"linear-gradient(135deg,#d4943a,#8b5e83)",display:"flex",alignItems:"center",justifyContent:"center",margin:"0 auto 12px"}}>{renderAv(u.avatar,72)}</div>`
  );
  console.log("✅ PATCH 4 — Profile hero ancien OK");
  ok++;
} else {
  console.log("⏭  PATCH 4 — Profile hero ancien absent (patch-profile-redesign déjà appliqué) — skipped");
}

// ─── Write ──────────────────────────────────────────────────────────────────
if (src === original) {
  console.warn("⚠️  Aucun changement détecté.");
  process.exit(0);
}

fs.writeFileSync(BACKUP, original, "utf8");
console.log(`\n📦 Backup : App.jsx.bak-avatar-fix`);
fs.writeFileSync(FILE, src, "utf8");
console.log(`🎉 ${ok} patches appliqués — avatars photo fixés partout.\n`);
console.log("Résumé :");
console.log("  • renderAv() helper global : gère emoji ET base64 de façon transparente");
console.log("  • Home, League (RankRow + Week tab), Profile hero : tous corrigés");
console.log("  • Rétrocompatible : les emojis existants continuent de fonctionner");
