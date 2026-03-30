// patch-mock-label-fix.cjs
// Corrige la troncature des labels dans le bar chart Student Detail :
// "Mock Test 1" et "Mock Test 2" étaient tronqués à "Mock Test…"
// — impossible de distinguer les deux barres.
// Fix : limite portée de 10 à 12 chars (comme le chart global classe).
//
// Usage : node patch-mock-label-fix.cjs

const fs = require("fs");
const path = require("path");

const FILE   = path.join(__dirname, "App.jsx");
const BACKUP = FILE + ".bak-mock-label-fix";

if (!fs.existsSync(FILE)) { console.error("❌ App.jsx introuvable."); process.exit(1); }

let src = fs.readFileSync(FILE, "utf8");
const original = src;

const OLD = `return{name:m.name.length>10?m.name.substring(0,9)+"…":m.name,fullName:m.name,accuracy:modAcc,sessions:ms?ms.sessions:0,questions:ms?ms.total:0,color:CHART_COLORS[i%CHART_COLORS.length],id:m.id,hasData:!!(ms&&ms.total>0)};`;
const NEW = `return{name:m.name.length>12?m.name.substring(0,11)+"…":m.name,fullName:m.name,accuracy:modAcc,sessions:ms?ms.sessions:0,questions:ms?ms.total:0,color:CHART_COLORS[i%CHART_COLORS.length],id:m.id,hasData:!!(ms&&ms.total>0)};`;

if (!src.includes(OLD)) {
  console.error("❌ Cible introuvable — vérifie que le fichier est à jour.");
  process.exit(1);
}

src = src.replace(OLD, NEW);

fs.writeFileSync(BACKUP, original, "utf8");
console.log("📦 Backup : App.jsx.bak-mock-label-fix");
fs.writeFileSync(FILE, src, "utf8");
console.log("✅ Troncature corrigée : limite 10→12 chars dans Student Detail bar chart");
console.log('   "Mock Test 1" et "Mock Test 2" s\'affichent maintenant correctement');
