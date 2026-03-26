// patch-ghost-teacher.cjs
// Ghost mode : le compte "Teacher" ne sync pas vers Supabase
// et est filtré dans le Teacher Dashboard.
// Usage : node patch-ghost-teacher.cjs

const fs = require("fs");
const path = require("path");

const FILE = path.join(__dirname, "App.jsx");
const BACKUP = FILE + ".bak-ghostteacher";

if (!fs.existsSync(FILE)) {
  console.error("❌ App.jsx introuvable dans le dossier courant.");
  process.exit(1);
}

let src = fs.readFileSync(FILE, "utf8");
const original = src;

// ─────────────────────────────────────────────────────────
// PATCH 1 — syncToCloud() : ne pas syncer si name === "Teacher"
// ─────────────────────────────────────────────────────────
const SYNC_OLD = `// syncToCloud() — background push to Supabase (called every 2 min)
async function syncToCloud(d){
  if(!d||!d.name||!_syncDirty)return;`;

const SYNC_NEW = `// syncToCloud() — background push to Supabase (called every 2 min)
var GHOST_NAME="Teacher"; // ghost mode — this account never syncs to Supabase
async function syncToCloud(d){
  if(!d||!d.name||!_syncDirty)return;
  if(d.name===GHOST_NAME){_syncDirty=false;return;} // ghost mode`;

if (!src.includes(SYNC_OLD)) {
  console.error("❌ PATCH 1 : cible introuvable dans syncToCloud(). Vérifie que le fichier est à jour.");
  process.exit(1);
}
src = src.replace(SYNC_OLD, SYNC_NEW);
console.log("✅ PATCH 1 appliqué — syncToCloud() ghost guard OK");

// ─────────────────────────────────────────────────────────
// PATCH 2 — loadStudents() : filtrer "Teacher" à l'affichage
// ─────────────────────────────────────────────────────────
const LOAD_OLD = `      .then(function(res){setStudents(res.data||[]);setLoad(false);})
      .catch(function(){setLoad(false);});
  }
  useEffect(function(){loadStudents();},[classCode])`;

const LOAD_NEW = `      .then(function(res){setStudents((res.data||[]).filter(function(r){return r.name!==GHOST_NAME;}));setLoad(false);})
      .catch(function(){setLoad(false);});
  }
  useEffect(function(){loadStudents();},[classCode])`;

if (!src.includes(LOAD_OLD)) {
  console.error("❌ PATCH 2 : cible introuvable dans loadStudents(). Vérifie le fichier.");
  process.exit(1);
}
src = src.replace(LOAD_OLD, LOAD_NEW);
console.log("✅ PATCH 2 appliqué — loadStudents() filtre Teacher OK");

// ─────────────────────────────────────────────────────────
// PATCH 3 — fetch dans le sélecteur de groupe : filtrer "Teacher"
// ─────────────────────────────────────────────────────────
const GROUP_OLD = `            supabase.from('students').select('*').eq('class_code',g.code).order('xp',{ascending:false}).limit(200)
              .then(function(res){setStudents(res.data||[]);setLoad(false);})
              .catch(function(){setLoad(false);});`;

const GROUP_NEW = `            supabase.from('students').select('*').eq('class_code',g.code).order('xp',{ascending:false}).limit(200)
              .then(function(res){setStudents((res.data||[]).filter(function(r){return r.name!==GHOST_NAME;}));setLoad(false);})
              .catch(function(){setLoad(false);});`;

if (!src.includes(GROUP_OLD)) {
  console.error("❌ PATCH 3 : cible introuvable dans le sélecteur de groupe. Vérifie le fichier.");
  process.exit(1);
}
src = src.replace(GROUP_OLD, GROUP_NEW);
console.log("✅ PATCH 3 appliqué — sélecteur de groupe filtre Teacher OK");

// ─────────────────────────────────────────────────────────
// WRITE
// ─────────────────────────────────────────────────────────
if (src === original) {
  console.warn("⚠️  Aucun changement détecté — le patch a peut-être déjà été appliqué.");
  process.exit(0);
}

fs.writeFileSync(BACKUP, original, "utf8");
console.log(`📦 Backup sauvegardé : App.jsx.bak-ghostteacher`);

fs.writeFileSync(FILE, src, "utf8");
console.log("🎉 App.jsx patché avec succès !\n");
console.log("Résumé :");
console.log("  • Le compte 'Teacher' ne sync plus jamais vers Supabase");
console.log("  • 'Teacher' est filtré du Teacher Dashboard (les deux fetches)");
console.log("  • Pour changer le pseudo ghost, éditer GHOST_NAME dans App.jsx");
