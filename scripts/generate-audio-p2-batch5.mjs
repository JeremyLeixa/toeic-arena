// ═══════════════════════════════════════════════════════════
// generate-audio-p2-batch5.mjs
// Génère TOUS les fichiers audio pour p2_176 → p2_190 (15 items × 4 = 60 files).
// Nouveau lot ciblé : questions tag / négatives / alternatives "or" / indirectes.
//
// CRITIQUE — le préfixe "A. ", "B. ", "C. " est inclus dès la génération via
// `${letter}. ${item.opts[j]}` (bug batch2/batch3 : préfixe oublié → l'étudiant
// ne distingue pas A/B/C à l'oral ; ne peut plus se reproduire ici).
//
// Voix : rotation 6 voix (id mod 6), identique à batch4 pour la continuité.
//
// Coût estimé : ~4 000 credits (60 fichiers × ~55 chars moyenne).
//
// Usage (PowerShell) :
//   $env:ELEVENLABS_API_KEY="sk_xxx"
//   node scripts/generate-audio-p2-batch5.mjs
//
// Resume-safe : skip les fichiers déjà présents (> 1KB).
// Output : public/audio/p2/{id}_{q|0|1|2}.mp3
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

// Voix — voir memory/reference_audio_voices.md
const VOICE_SARAH    = "EXAVITQu4vr4xnSDxMaL"; // US female
const VOICE_ADAM     = "pNInz6obpgDQGcFmaJgB"; // US male
const VOICE_CANADIAN = "XJVfsOvSwUXluggMM5Jj"; // CA female
const VOICE_BRITISH  = "fATgBRI8wg5KkDFg8vBd"; // UK male
const VOICE_A        = "4yye0QE5YPsKbMOCGGlj"; // non-US (sex unconfirmed)
const VOICE_B        = "rfkTsdZrVWEVhDycUYn9"; // non-US (sex unconfirmed)

const VOICE_CYCLE = [
  { id: VOICE_SARAH,    label: "Sarah US-F" },
  { id: VOICE_ADAM,     label: "Adam US-M" },
  { id: VOICE_CANADIAN, label: "Canadian F" },
  { id: VOICE_BRITISH,  label: "British M" },
  { id: VOICE_A,        label: "Voice A" },
  { id: VOICE_B,        label: "Voice B" }
];

const MODEL_ID = "eleven_multilingual_v2";
const VOICE_SETTINGS = { stability: 0.5, similarity_boost: 0.75, speed: 0.92 };
const DELAY_MS = 600;

const ID_MIN = 176, ID_MAX = 190;
const OUT_DIR = path.join(__dirname, "..", "public", "audio", "p2");

// Renvoie la voix pour un id donné. Null si hors range (176..190).
function voiceForId(idStr) {
  const n = parseInt(idStr.split("_")[1], 10);
  if (n < ID_MIN || n > ID_MAX) return null;
  return VOICE_CYCLE[n % 6];
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
  console.log("\n═══ TOEIC Arena — P2 Batch 5 (p2_176 → p2_190) ═══\n");
  console.log(`Output: ${OUT_DIR}`);

  const targets = LISTENING_P2.filter((it) => voiceForId(it.id) !== null);
  console.log(`Items: ${targets.length} (expected 15)`);
  console.log(`Total files: ${targets.length * 4} (1 question + 3 options each)\n`);

  let done = 0, skipped = 0, errors = 0;

  for (let i = 0; i < targets.length; i++) {
    const item = targets[i];
    const voice = voiceForId(item.id);
    console.log(`[${i + 1}/${targets.length}] ${item.id} (${voice.label})`);

    // ── Question (no prefix) ──
    const qFile = `${item.id}_q.mp3`;
    const qPath = path.join(OUT_DIR, qFile);
    try {
      const result = await tryGenerate(item.q, voice.id, qPath);
      if (result === "skip") { skipped++; console.log(`   ⏭️  ${qFile} (exists)`); }
      else { done++; console.log(`   ✅ ${qFile} — ${(result / 1024).toFixed(1)}KB`); }
    } catch (e) { errors++; console.error(`   ❌ ${qFile} — ${e.message}`); }

    // ── 3 options WITH SPOKEN A./B./C. PREFIX ──
    for (let j = 0; j < item.opts.length; j++) {
      const letter = String.fromCharCode(65 + j); // A, B, C
      const text = `${letter}. ${item.opts[j]}`;
      const oFile = `${item.id}_${j}.mp3`;
      const oPath = path.join(OUT_DIR, oFile);
      try {
        const result = await tryGenerate(text, voice.id, oPath);
        if (result === "skip") { skipped++; console.log(`   ⏭️  ${oFile} (exists)`); }
        else { done++; console.log(`   ✅ ${oFile} (${letter}.) — ${(result / 1024).toFixed(1)}KB`); }
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
}

main().catch((err) => { console.error(err); process.exit(1); });
