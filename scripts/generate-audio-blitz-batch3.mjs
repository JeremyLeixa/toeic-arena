// ═══════════════════════════════════════════════════════════
// generate-audio-blitz-batch3.mjs
// Génère les MP3 pour ab_61 → ab_90 (30 items).
// Lit le transcript directement depuis src/data/audioBlitz.js (source unique
// — pas de duplication de texte, donc pas de dérive texte/audio).
//
// Voix : rotation 4 voix par id mod 4 (variété d'accents) :
//   id%4==0 → Sarah (US-F)  |  ==1 → Adam (US-M)
//   id%4==2 → Canadian (CA-F)|  ==3 → British (UK-M)
//
// Coût estimé : ~4 000 credits (30 items × ~110 chars).
//
// Usage (PowerShell) :
//   $env:ELEVENLABS_API_KEY="sk_xxx"
//   node scripts/generate-audio-blitz-batch3.mjs
//
// Resume-safe : skip les fichiers déjà présents (> 1KB).
// Output : public/audio/blitz/{id}.mp3
// ═══════════════════════════════════════════════════════════

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { AUDIO_BLITZ } from "../src/data/audioBlitz.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const API_KEY = process.env.ELEVENLABS_API_KEY;
if (!API_KEY) {
  console.error("❌ Missing ELEVENLABS_API_KEY environment variable.");
  process.exit(1);
}

const VOICE_SARAH    = "EXAVITQu4vr4xnSDxMaL"; // US female
const VOICE_ADAM     = "pNInz6obpgDQGcFmaJgB"; // US male
const VOICE_CANADIAN = "XJVfsOvSwUXluggMM5Jj"; // CA female
const VOICE_BRITISH  = "fATgBRI8wg5KkDFg8vBd"; // UK male

const MODEL_ID = "eleven_multilingual_v2";
const VOICE_SETTINGS = { stability: 0.5, similarity_boost: 0.75, speed: 0.92 };
const DELAY_MS = 600;

const ID_MIN = 61, ID_MAX = 90;
const OUT_DIR = path.join(__dirname, "..", "public", "audio", "blitz");

function voiceForId(idStr) {
  const n = parseInt(idStr.split("_")[1], 10);
  if (n < ID_MIN || n > ID_MAX) return null;
  switch (n % 4) {
    case 0: return { id: VOICE_SARAH,    label: "Sarah US-F" };
    case 1: return { id: VOICE_ADAM,     label: "Adam US-M" };
    case 2: return { id: VOICE_CANADIAN, label: "Canadian F" };
    case 3: return { id: VOICE_BRITISH,  label: "British M" };
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
  console.log("\n═══ TOEIC Arena — Audio Blitz Batch 3 (ab_61 → ab_90) ═══\n");
  console.log(`Output: ${OUT_DIR}`);

  const targets = AUDIO_BLITZ.filter((it) => voiceForId(it.id) !== null);
  console.log(`Items: ${targets.length} (expected 30)\n`);

  let done = 0, skipped = 0, errors = 0;

  for (let i = 0; i < targets.length; i++) {
    const item = targets[i];
    const v = voiceForId(item.id);
    const oFile = `${item.id}.mp3`;
    const oPath = path.join(OUT_DIR, oFile);

    console.log(`[${i + 1}/${targets.length}] ${item.id} (${v.label})`);
    try {
      const result = await tryGenerate(item.text, v.id, oPath);
      if (result === "skip") { skipped++; console.log(`   ⏭️  ${oFile} (exists)`); }
      else { done++; console.log(`   ✅ ${oFile} — ${(result / 1024).toFixed(1)}KB`); }
    } catch (e) { errors++; console.error(`   ❌ ${oFile} — ${e.message}`); }
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
}

main().catch((err) => { console.error(err); process.exit(1); });
