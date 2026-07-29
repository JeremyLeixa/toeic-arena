// ═══════════════════════════════════════════════════════════
// check-audio-assets.mjs
// Vérifie que tout asset audio/image référencé par le contenu existe
// réellement sur disque ET est tracké par git.
//
// POURQUOI — le commit a7e335c a ajouté 15 items Part 1 (p1_44 → p1_58)
// avec leurs images mais sans les MP3. En prod, playAudioFile() résout
// silencieusement sur onerror : l'exercice enchaînait 4 propositions muettes
// sans la moindre erreur visible. Bug détecté seulement par un étudiant,
// 3 semaines plus tard. Même classe de bug que bgm_tavern.mp3 (fichier
// présent en local, jamais `git add`-é → 404 silencieux sur Vercel).
//
// DEUX VECTEURS COUVERTS :
//   1. Chemins littéraux dans src/data/*.js (img:"/images/..", audio:"/audio/..")
//   2. Chemins DÉRIVÉS dans App.jsx à partir des ids (le vecteur qui a
//      laissé passer a7e335c — rien dans la data ne mentionne le MP3).
//
// Usage :
//   node scripts/check-audio-assets.mjs
//
// Exit code 1 si un asset manque ou n'est pas tracké → utilisable en CI
// ou en pre-commit hook.
// ═══════════════════════════════════════════════════════════

import fs from "node:fs";
import path from "node:path";
import { execSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { LISTENING_P1, LISTENING_P2, LISTENING_P3, LISTENING_P4 } from "../src/data/listening.js";
import { BOSS_P1, BOSS_P2, BOSS_P3, BOSS_P4 } from "../src/data/bossTestFull.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, "..");
const PUB = path.join(ROOT, "public");

const missing = [];   // référencé mais absent du disque
const untracked = []; // présent sur disque mais invisible de git (→ 404 Vercel)

// ── Index des fichiers trackés par git (une seule invocation) ──
let gitFiles = null;
try {
  gitFiles = new Set(
    execSync("git ls-files public", { cwd: ROOT, encoding: "utf8" })
      .split("\n").filter(Boolean).map(s => s.replace(/\\/g, "/"))
  );
} catch (e) {
  console.warn("git ls-files indisponible, check de tracking ignoré:", e && e.message);
}

function check(webPath, origin) {
  const rel = webPath.replace(/^\//, "");
  const abs = path.join(PUB, rel);
  let ok = false;
  try { ok = fs.statSync(abs).size > 1000; } catch (e) { ok = false; }
  if (!ok) { missing.push(`${webPath}  (${origin})`); return; }
  if (gitFiles && !gitFiles.has("public/" + rel)) untracked.push(`${webPath}  (${origin})`);
}

const pad2 = n => String(n).padStart(2, "0");

// ═══ 1. Chemins littéraux dans src/data/*.js ═══
// Attrape img:"/images/p1/..", audio:"/audio/blitz/.." etc. sans avoir à
// connaître le nom du champ.
const dataDir = path.join(ROOT, "src", "data");
for (const f of fs.readdirSync(dataDir).filter(n => n.endsWith(".js"))) {
  const src = fs.readFileSync(path.join(dataDir, f), "utf8");
  for (const m of src.matchAll(/"(\/(?:audio|images)\/[^"]+)"/g)) {
    check(m[1], `data/${f}`);
  }
}

// ═══ 2. Chemins dérivés dans App.jsx ═══
// Ces fichiers ne sont mentionnés NULLE PART dans la data : App.jsx les
// reconstruit depuis l'id. C'est le trou par lequel a7e335c est passé.
// Toute nouvelle convention de nommage audio doit être ajoutée ici.

// Part 1 training — App.jsx:13479 → /audio/p1/{id}_{0-3}.mp3
for (const it of LISTENING_P1)
  it.opts.forEach((_, j) => check(`/audio/p1/${it.id}_${j}.mp3`, "ListenP1"));

// Part 2 training — /audio/p2/{id}_q.mp3 + {id}_{0-2}.mp3
for (const it of LISTENING_P2) {
  check(`/audio/p2/${it.id}_q.mp3`, "ListenP2");
  it.opts.forEach((_, j) => check(`/audio/p2/${it.id}_${j}.mp3`, "ListenP2"));
}

// Part 3 / Part 4 training — /audio/p{3,4}/{id}.mp3 (clip stitché)
for (const it of LISTENING_P3) check(`/audio/p3/${it.id}.mp3`, "ListenP3");
for (const it of LISTENING_P4) check(`/audio/p4/${it.id}.mp3`, "ListenP4");

// Boss Test — /audio/boss/, indexé par position (App.jsx:7727-7730)
BOSS_P1.forEach((it, i) =>
  it.opts.forEach((_, j) => check(`/audio/boss/p1_${pad2(i + 1)}_${j}.mp3`, "BossP1")));
BOSS_P2.forEach((it, i) => {
  check(`/audio/boss/p2_${pad2(i + 1)}_q.mp3`, "BossP2");
  it.opts.forEach((_, j) => check(`/audio/boss/p2_${pad2(i + 1)}_${j}.mp3`, "BossP2"));
});
BOSS_P3.forEach((_, i) => check(`/audio/boss/p3_${pad2(i + 1)}.mp3`, "BossP3"));
BOSS_P4.forEach((_, i) => check(`/audio/boss/p4_${pad2(i + 1)}.mp3`, "BossP4"));

// ═══ Rapport ═══
const counts = [LISTENING_P1, LISTENING_P2, LISTENING_P3, LISTENING_P4].map(a => a.length);
console.log(`\nPools listening: P1=${counts[0]} P2=${counts[1]} P3=${counts[2]} P4=${counts[3]}`);
console.log(`Boss: P1=${BOSS_P1.length} P2=${BOSS_P2.length} P3=${BOSS_P3.length} P4=${BOSS_P4.length}`);

if (missing.length) {
  console.error(`\n${missing.length} ASSET(S) MANQUANT(S) — 404 silencieux en prod :`);
  missing.forEach(m => console.error("  " + m));
}
if (untracked.length) {
  console.error(`\n${untracked.length} ASSET(S) NON TRACKÉ(S) PAR GIT — présents en local, 404 sur Vercel :`);
  untracked.forEach(m => console.error("  " + m));
  console.error("  → git add public/audio public/images");
}

if (!missing.length && !untracked.length) {
  console.log("\nOK — tous les assets référencés existent et sont trackés.\n");
  process.exit(0);
}
console.error("");
process.exit(1);
