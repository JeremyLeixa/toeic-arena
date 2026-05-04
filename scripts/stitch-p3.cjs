// ═══════════════════════════════════════════════════════════
// stitch-p3.cjs
// Concatène les fichiers _line[N].mp3 de chaque conversation P3 en un seul
// fichier {id}.mp3, requis par le Train mode (App.jsx ligne ~6685 :
// `/audio/p3/${it.id}.mp3`). Les *_line.mp3 individuels restent utilisés par
// le Boss / Endless mode (App.jsx ligne ~11453).
//
// Coût : 0 credit ElevenLabs — concat ffmpeg local (-c copy, pas de réencode).
//
// Détecte automatiquement le nombre de lignes par ID (gère l'anomalie p3_12
// qui a 5 lignes au lieu de 4). Skip les {id}.mp3 déjà présents.
//
// Usage : node scripts/stitch-p3.cjs
// Prérequis : ffmpeg dans le PATH (winget install ffmpeg si manquant).
// ═══════════════════════════════════════════════════════════

const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");

const P3_DIR = path.join(__dirname, "..", "public", "audio", "p3");

if (!fs.existsSync(P3_DIR)) {
  console.error(`❌ Directory not found: ${P3_DIR}`);
  process.exit(1);
}

// Vérifie que ffmpeg est dispo
try {
  execSync("ffmpeg -version", { stdio: "ignore" });
} catch (e) {
  console.error("❌ ffmpeg introuvable dans le PATH. Installe-le via : winget install ffmpeg");
  process.exit(1);
}

// Détecte tous les IDs avec au moins _line0
const allFiles = fs.readdirSync(P3_DIR);
const ids = [...new Set(
  allFiles
    .filter((f) => /^p3_\d+_line0\.mp3$/.test(f))
    .map((f) => f.replace(/_line0\.mp3$/, ""))
)].sort();

console.log(`\n═══ P3 Stitcher — ${ids.length} IDs détectés ═══\n`);
console.log(`Output dir: ${P3_DIR}\n`);

function getLineCount(id) {
  let n = 0;
  while (fs.existsSync(path.join(P3_DIR, `${id}_line${n}.mp3`))) n++;
  return n;
}

let done = 0, skipped = 0, errors = 0;

for (const id of ids) {
  const outPath = path.join(P3_DIR, `${id}.mp3`);

  if (fs.existsSync(outPath) && fs.statSync(outPath).size > 1000) {
    skipped++;
    console.log(`⏭️  ${id}.mp3 (existe déjà)`);
    continue;
  }

  const lineCount = getLineCount(id);
  if (lineCount === 0) {
    errors++;
    console.error(`❌ ${id}: aucun fichier _line trouvé`);
    continue;
  }

  // Construit la liste pour ffmpeg concat demuxer
  const lineFiles = [];
  for (let i = 0; i < lineCount; i++) {
    lineFiles.push(path.join(P3_DIR, `${id}_line${i}.mp3`));
  }

  const listPath = path.join(P3_DIR, `_${id}_concat.txt`);
  // Format : `file 'absolute/path/to/file.mp3'` (escape simple quotes)
  const listContent = lineFiles
    .map((f) => `file '${f.replace(/'/g, "'\\''")}'`)
    .join("\n");
  fs.writeFileSync(listPath, listContent, "utf8");

  try {
    execSync(
      `ffmpeg -f concat -safe 0 -i "${listPath}" -c copy "${outPath}" -y -loglevel error`,
      { stdio: "pipe" }
    );
    const sz = fs.statSync(outPath).size;
    done++;
    console.log(`✅ ${id}.mp3 (${lineCount} lignes → ${(sz / 1024).toFixed(1)}KB)`);
  } catch (e) {
    errors++;
    console.error(`❌ ${id}: ${e.message.split("\n")[0]}`);
  } finally {
    if (fs.existsSync(listPath)) fs.unlinkSync(listPath);
  }
}

console.log(`\n────────────────────────────────────`);
console.log(`   ✅ Stitched: ${done}`);
console.log(`   ⏭️  Skipped:  ${skipped}`);
console.log(`   ❌ Errors:   ${errors}`);
console.log(`────────────────────────────────────\n`);

if (errors > 0) process.exit(1);
