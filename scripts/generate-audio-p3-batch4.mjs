// ═══════════════════════════════════════════════════════════
// generate-audio-p3-batch4.mjs
// Génère les fichiers _line[N].mp3 pour p3_51 → p3_70 (20 nouvelles convos).
// 4 lignes × 20 convos = 80 fichiers à générer.
//
// Voix (mix d'accents balanced, 5 convos par combo) :
//   id mod 4 == 3 (51, 55, 59, 63, 67) → US/US : W=Sarah,    M=Adam
//   id mod 4 == 0 (52, 56, 60, 64, 68) → US/UK : W=Sarah,    M=British
//   id mod 4 == 1 (53, 57, 61, 65, 69) → CA/US : W=Canadian, M=Adam
//   id mod 4 == 2 (54, 58, 62, 66, 70) → CA/UK : W=Canadian, M=British
//
// Coût estimé : ~6 400 credits (~80 fichiers × ~80 chars/ligne).
//
// Usage (PowerShell) :
//   $env:ELEVENLABS_API_KEY="sk_xxx"
//   node scripts/generate-audio-p3-batch4.mjs
//
// Resume-safe : skip les fichiers déjà présents (> 1KB).
// Après génération, lancer scripts/stitch-p3.cjs pour produire les
// {id}.mp3 stitched (Train mode).
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

// Voice IDs — voir memory/reference_audio_voices.md
const VOICE_SARAH    = "EXAVITQu4vr4xnSDxMaL"; // US female
const VOICE_ADAM     = "pNInz6obpgDQGcFmaJgB"; // US male
const VOICE_BRITISH  = "fATgBRI8wg5KkDFg8vBd"; // UK male (ajouté 2026-05-04)
const VOICE_CANADIAN = "XJVfsOvSwUXluggMM5Jj"; // CA female (ajouté 2026-05-04)

const MODEL_ID = "eleven_multilingual_v2";
const VOICE_SETTINGS = { stability: 0.5, similarity_boost: 0.75, speed: 0.92 };
const DELAY_MS = 600;

const OUT_DIR = path.join(__dirname, "..", "public", "audio", "p3");

// Renvoie {wId, mId, label} pour un id p3_XX. Null si hors-range (51..70).
function voicesForId(idStr) {
  const n = parseInt(idStr.split("_")[1], 10);
  if (n < 51 || n > 70) return null;
  const mod = n % 4;
  switch (mod) {
    case 3: return { wId: VOICE_SARAH,    mId: VOICE_ADAM,    label: "US/US" };
    case 0: return { wId: VOICE_SARAH,    mId: VOICE_BRITISH, label: "US/UK" };
    case 1: return { wId: VOICE_CANADIAN, mId: VOICE_ADAM,    label: "CA/US" };
    case 2: return { wId: VOICE_CANADIAN, mId: VOICE_BRITISH, label: "CA/UK" };
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
  console.log("\n═══ TOEIC Arena — P3 Batch 4 (p3_51 → p3_70) ═══\n");
  console.log(`Output: ${OUT_DIR}`);

  const targets = LISTENING_P3.filter((it) => voicesForId(it.id) !== null);
  console.log(`Items: ${targets.length} (expected 20)`);
  const totalLines = targets.reduce((sum, it) => sum + it.lines.length, 0);
  console.log(`Total line files: ${totalLines}\n`);

  let done = 0, skipped = 0, errors = 0;

  for (let i = 0; i < targets.length; i++) {
    const item = targets[i];
    const v = voicesForId(item.id);
    console.log(`[${i + 1}/${targets.length}] ${item.id} (${v.label})`);

    for (let j = 0; j < item.lines.length; j++) {
      const line = item.lines[j];
      const voiceId = line.s === "W" ? v.wId : v.mId;
      const oFile = `${item.id}_line${j}.mp3`;
      const oPath = path.join(OUT_DIR, oFile);
      try {
        const result = await tryGenerate(line.t, voiceId, oPath);
        if (result === "skip") {
          skipped++;
          console.log(`   ⏭️  ${oFile} (exists)`);
        } else {
          done++;
          console.log(`   ✅ ${oFile} (${line.s}) — ${(result / 1024).toFixed(1)}KB`);
        }
      } catch (e) {
        errors++;
        console.error(`   ❌ ${oFile} — ${e.message}`);
      }
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

  console.log("👉 Étape suivante : node scripts/stitch-p3.cjs (zéro coût) pour produire les {id}.mp3.\n");
}

main().catch((err) => { console.error(err); process.exit(1); });
