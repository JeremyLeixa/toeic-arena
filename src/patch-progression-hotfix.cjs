// patch-progression-hotfix.cjs
// Supprime le </div>)} orphelin introduit par patch-progression-tab.cjs
// Usage : node patch-progression-hotfix.cjs

const fs = require("fs");
const path = require("path");

const FILE   = path.join(__dirname, "App.jsx");
const BACKUP = FILE + ".bak-progression-hotfix";

if (!fs.existsSync(FILE)) {
  console.error("❌ App.jsx introuvable."); process.exit(1);
}

let src = fs.readFileSync(FILE, "utf8");
const original = src;

const OLD = `</div>)}

</div>)}

{/* ── PROGRESSION TAB ── */}`;

const NEW = `</div>)}

{/* ── PROGRESSION TAB ── */}`;

if (!src.includes(OLD)) {
  console.error("❌ Cible introuvable — le doublon n'est peut-être pas là.");
  process.exit(1);
}

src = src.replace(OLD, NEW);

fs.writeFileSync(BACKUP, original, "utf8");
console.log("📦 Backup : App.jsx.bak-progression-hotfix");
fs.writeFileSync(FILE, src, "utf8");
console.log("✅ Doublon </div>)} supprimé — parse error corrigé.");
