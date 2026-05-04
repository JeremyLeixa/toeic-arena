// ═══════════════════════════════════════════════════════════
// regen-audio-p2-options.mjs
// Régénère TOUS les fichiers _0/_1/_2.mp3 de p2_51 → p2_125 avec préfixe
// "A./B./C." parlé. Bug racine : les scripts batch2/batch3 avaient oublié
// le `${letter}. ${opts[j]}` du script original (generate-audio.cjs L180).
//
// Les *_q.mp3 (questions) ne sont PAS régénérés — non affectés par le bug.
//
// Voix réutilisées par range pour matcher les *_q.mp3 existants :
//   p2_51 → p2_75  : Sarah US female (EXAVITQu4vr4xnSDxMaL)  — batch 2
//   p2_76 → p2_125 : VOICE_A (pair) / VOICE_B (impair)       — batch 3
//
// Coût estimé : 225 fichiers × ~53 chars (≈ "A. " + option) ≈ 12 000 credits.
//
// Usage (PowerShell) :
//   $env:ELEVENLABS_API_KEY="sk_xxxxxxx"
//   node scripts/regen-audio-p2-options.mjs
//
// Output : public/audio/p2/{id}_{0|1|2}.mp3 (ÉCRASE les fichiers existants)
// ═══════════════════════════════════════════════════════════

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { LISTENING_P2 } from "../src/data/listening.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const API_KEY = process.env.ELEVENLABS_API_KEY;
if (!API_KEY) {
  console.error("❌ Missing ELEVENLABS_API_KEY environment variable.");
  process.exit(1);
}

const VOICE_SARAH = "EXAVITQu4vr4xnSDxMaL";
const VOICE_A = "4yye0QE5YPsKbMOCGGlj";
const VOICE_B = "rfkTsdZrVWEVhDycUYn9";
const MODEL_ID = "eleven_multilingual_v2";
const VOICE_SETTINGS = { stability: 0.5, similarity_boost: 0.75, speed: 0.92 };
const DELAY_MS = 600;

const OUT_DIR = path.join(__dirname, "..", "public", "audio", "p2");

// Renvoie {id, label} ou null si l'item n'est pas dans la zone à régénérer.
// p2_1 → p2_50 : exclus (script original generate-audio.cjs avait bien le préfixe).
function voiceForId(idStr) {
  const n = parseInt(idStr.split("_")[1], 10);
  if (n >= 51 && n <= 75) return { id: VOICE_SARAH, label: "Sarah" };
  if (n >= 76 && n <= 125) {
    return n % 2 === 0
      ? { id: VOICE_A, label: "VoiceA" }
      : { id: VOICE_B, label: "VoiceB" };
  }
  return null;
}

async function generateAudio(text, voiceId, outputPath) {
  const dir = path.dirname(outputPath);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

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
    const size = await generateAudio(text, voiceId, outPath);
    await wait(DELAY_MS);
    return size;
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
  console.log("\n═══ TOEIC Arena — P2 Options Regen (A./B./C. fix) ═══\n");
  console.log(`Output: ${OUT_DIR}`);
  console.log(`Targets: p2_51 → p2_125 (overwrite mode)\n`);

  const targets = LISTENING_P2.filter((it) => voiceForId(it.id) !== null);
  console.log(`Found ${targets.length} target items in LISTENING_P2.`);
  console.log(`Total option files to regenerate: ${targets.length * 3}\n`);

  let done = 0, errors = 0;

  for (let i = 0; i < targets.length; i++) {
    const item = targets[i];
    const v = voiceForId(item.id);
    console.log(`[${i + 1}/${targets.length}] ${item.id} (${v.label})`);

    for (let j = 0; j < item.opts.length; j++) {
      const letter = String.fromCharCode(65 + j); // A, B, C
      const text = `${letter}. ${item.opts[j]}`;
      const oFile = `${item.id}_${j}.mp3`;
      const oPath = path.join(OUT_DIR, oFile);
      try {
        const size = await tryGenerate(text, v.id, oPath);
        done++;
        console.log(`   ✅ ${oFile} (${letter}.) — ${(size / 1024).toFixed(1)}KB`);
      } catch (e) {
        errors++;
        console.error(`   ❌ ${oFile} — ${e.message}`);
      }
    }
  }

  console.log(`\n────────────────────────────────────`);
  console.log(`   ✅ Generated: ${done}`);
  console.log(`   ❌ Errors:    ${errors}`);
  console.log(`   📁 Output:    ${OUT_DIR}`);
  console.log(`────────────────────────────────────\n`);

  if (errors > 0) {
    console.log("💡 Re-run pour réessayer les fichiers en erreur (overwrite mode).\n");
    process.exit(1);
  }
}

main().catch((err) => { console.error(err); process.exit(1); });
