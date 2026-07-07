// ═══════════════════════════════════════════════════════════
// generate-audio-p3-batch5.mjs
// Génère les fichiers _line[N].mp3 pour p3_74 → p3_88 (15 conversations
// À 3 LOCUTEURS — nouveauté). 5 lignes × 15 = 75 fichiers.
//
// Speaker labels dans la data : "W", "M", "M2", "W2" (le 1er caractère
// = genre, consommé par App.jsx pour l'indicateur "Man/Woman speaking").
// Chaque convo mappe ses 3 labels à 3 VOIX DISTINCTES via un combo tournant
// (id mod 4), pour un vrai rendu 3-locuteurs + variété d'accents.
//
// COMBO (chaque combo = 4 voix distinctes, donc tout sous-ensemble de 3
// utilisé par une convo est garanti distinct) :
//   id%4==2 → W:Sarah  M:Adam    M2:British W2:Canadian
//   id%4==3 → W:Canadian M:British M2:Adam   W2:Sarah
//   id%4==0 → W:Sarah  M:British M2:Adam   W2:Canadian
//   id%4==1 → W:Canadian M:Adam   M2:British W2:Sarah
//
// Coût estimé : ~7 000 credits (~75 fichiers × ~85 chars/ligne).
//
// Usage (PowerShell) :
//   $env:ELEVENLABS_API_KEY="sk_xxx"
//   node scripts/generate-audio-p3-batch5.mjs
//
// Resume-safe : skip les fichiers déjà présents (> 1KB).
// Après génération : node scripts/stitch-p3.cjs (0 crédit) pour les {id}.mp3.
// ═══════════════════════════════════════════════════════════

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { LISTENING_P3 } from "../src/data/listening.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const API_KEY = process.env.ELEVENLABS_API_KEY;
if (!API_KEY) {
  console.error("❌ Missing ELEVENLABS_API_KEY environment variable.");
  process.exit(1);
}

const VOICE_SARAH    = "EXAVITQu4vr4xnSDxMaL"; // US female
const VOICE_ADAM     = "pNInz6obpgDQGcFmaJgB"; // US male
const VOICE_BRITISH  = "fATgBRI8wg5KkDFg8vBd"; // UK male
const VOICE_CANADIAN = "XJVfsOvSwUXluggMM5Jj"; // CA female

const MODEL_ID = "eleven_multilingual_v2";
const VOICE_SETTINGS = { stability: 0.5, similarity_boost: 0.75, speed: 0.92 };
const DELAY_MS = 600;

const ID_MIN = 74, ID_MAX = 88;
const OUT_DIR = path.join(__dirname, "..", "public", "audio", "p3");

// Renvoie le mapping label→voix pour un id. Null si hors-range.
function comboForId(idStr) {
  const n = parseInt(idStr.split("_")[1], 10);
  if (n < ID_MIN || n > ID_MAX) return null;
  switch (n % 4) {
    case 2: return { label: "S/A/Br/Ca", W: VOICE_SARAH,    M: VOICE_ADAM,    M2: VOICE_BRITISH, W2: VOICE_CANADIAN };
    case 3: return { label: "Ca/Br/A/S", W: VOICE_CANADIAN, M: VOICE_BRITISH, M2: VOICE_ADAM,    W2: VOICE_SARAH };
    case 0: return { label: "S/Br/A/Ca", W: VOICE_SARAH,    M: VOICE_BRITISH, M2: VOICE_ADAM,    W2: VOICE_CANADIAN };
    case 1: return { label: "Ca/A/Br/S", W: VOICE_CANADIAN, M: VOICE_ADAM,    M2: VOICE_BRITISH, W2: VOICE_SARAH };
  }
}

async function generateAudio(text, voiceId, outputPath) {
  const dir = path.dirname(outputPath);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

  if (fs.existsSync(outputPath)) {
    const size = fs.statSync(outputPath).size;
    if (size > 1000) return "skip";
  }

  const response = await fetch(
    `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json", "xi-api-key": API_KEY },
      body: JSON.stringify({ text, model_id: MODEL_ID, voice_settings: VOICE_SETTINGS }),
    }
  );

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`HTTP ${response.status}: ${errText}`);
  }

  const buffer = Buffer.from(await response.arrayBuffer());
  fs.writeFileSync(outputPath, buffer);
  return buffer.length;
}

const wait = (ms) => new Promise((r) => setTimeout(r, ms));

async function tryGenerate(text, voiceId, outPath) {
  try {
    const result = await generateAudio(text, voiceId, outPath);
    if (result !== "skip") await wait(DELAY_MS);
    return result;
  } catch (e) {
    if (e.message.includes("429")) {
      console.log("   ⏳ Rate limited, waiting 15s...");
      await wait(15000);
      return await generateAudio(text, voiceId, outPath);
    }
    throw e;
  }
}

async function main() {
  console.log("\n═══ TOEIC Arena — P3 Batch 5 (p3_74 → p3_88, 3-speaker) ═══\n");
  console.log(`Output: ${OUT_DIR}`);

  const targets = LISTENING_P3.filter((it) => comboForId(it.id) !== null);
  console.log(`Items: ${targets.length} (expected 15)`);
  const totalLines = targets.reduce((sum, it) => sum + it.lines.length, 0);
  console.log(`Total line files: ${totalLines}\n`);

  // Sanity: every line label must exist in the combo mapping.
  let badLabels = 0;
  targets.forEach(it => {
    const c = comboForId(it.id);
    it.lines.forEach((ln, j) => {
      if (!c[ln.s]) { console.warn(`  ⚠️  ${it.id} line${j}: unknown speaker label "${ln.s}"`); badLabels++; }
    });
  });
  if (badLabels > 0) { console.error(`  ❌ ${badLabels} unknown labels — aborting.`); process.exit(1); }
  console.log("  ✓ All speaker labels map to a voice.\n");

  let done = 0, skipped = 0, errors = 0;

  for (let i = 0; i < targets.length; i++) {
    const item = targets[i];
    const c = comboForId(item.id);
    console.log(`[${i + 1}/${targets.length}] ${item.id} (${c.label})`);

    for (let j = 0; j < item.lines.length; j++) {
      const line = item.lines[j];
      const voiceId = c[line.s];
      const oFile = `${item.id}_line${j}.mp3`;
      const oPath = path.join(OUT_DIR, oFile);
      try {
        const result = await tryGenerate(line.t, voiceId, oPath);
        if (result === "skip") { skipped++; console.log(`   ⏭️  ${oFile} (exists)`); }
        else { done++; console.log(`   ✅ ${oFile} (${line.s}) — ${(result / 1024).toFixed(1)}KB`); }
      } catch (e) { errors++; console.error(`   ❌ ${oFile} — ${e.message}`); }
    }
  }

  console.log(`\n────────────────────────────────────`);
  console.log(`   ✅ Generated: ${done}`);
  console.log(`   ⏭️  Skipped:   ${skipped}`);
  console.log(`   ❌ Errors:    ${errors}`);
  console.log(`   📁 Output:    ${OUT_DIR}`);
  console.log(`────────────────────────────────────\n`);

  if (errors > 0) {
    console.log("💡 Re-run pour réessayer les fichiers en erreur (resume-safe).\n");
    process.exit(1);
  }

  console.log("👉 Étape suivante : node scripts/stitch-p3.cjs (0 crédit) pour produire les {id}.mp3.\n");
}

main().catch((err) => { console.error(err); process.exit(1); });
