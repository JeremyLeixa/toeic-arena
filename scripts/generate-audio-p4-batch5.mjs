// ═══════════════════════════════════════════════════════════
// generate-audio-p4-batch5.mjs
// Génère les fichiers audio pour p4_65 → p4_94 (30 talks).
// Types ciblés (manquants/fins) : menu vocal automatisé, radio/trafic,
// météo, remise de prix / intro d'orateur, PSA, extrait de réunion,
// intro d'événement, atelier.
// Pour P4, un seul fichier par item: {id}.mp3 (le monologue complet).
//
// Voix rotation 4 voix par id mod 4 (VOICE_A/B exclues — sex unconfirmed,
// et P4 doit matcher le champ `voice` "W"/"M" de la data) :
//   id mod 4 == 2 → Sarah (W)     |  == 3 → Adam (M)
//   id mod 4 == 0 → Canadian (W)  |  == 1 → British (M)
// → id pair = W, id impair = M.
//
// Coût estimé : ~12 000 credits (30 talks × ~430 chars).
//
// Usage (PowerShell) :
//   $env:ELEVENLABS_API_KEY="sk_xxx"
//   node scripts/generate-audio-p4-batch5.mjs
//
// Resume-safe : skip les fichiers déjà présents (> 1KB).
// Output : public/audio/p4/{id}.mp3
// ═══════════════════════════════════════════════════════════

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { LISTENING_P4 } from "../src/data/listening.js";

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

const ID_MIN = 65, ID_MAX = 94;
const OUT_DIR = path.join(__dirname, "..", "public", "audio", "p4");

function voiceForId(idStr) {
  const n = parseInt(idStr.split("_")[1], 10);
  if (n < ID_MIN || n > ID_MAX) return null;
  switch (n % 4) {
    case 2: return { id: VOICE_SARAH,    label: "Sarah US-F", sex: "W" };
    case 3: return { id: VOICE_ADAM,     label: "Adam US-M",  sex: "M" };
    case 0: return { id: VOICE_CANADIAN, label: "Canadian F", sex: "W" };
    case 1: return { id: VOICE_BRITISH,  label: "British M",  sex: "M" };
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
  console.log("\n═══ TOEIC Arena — P4 Batch 5 (p4_65 → p4_94) ═══\n");
  console.log(`Output: ${OUT_DIR}`);

  const targets = LISTENING_P4.filter((it) => voiceForId(it.id) !== null);
  console.log(`Items: ${targets.length} (expected 30)\n`);

  // Sanity check: data voice field matches script-assigned voice sex
  let mismatch = 0;
  targets.forEach(it => {
    const v = voiceForId(it.id);
    if (it.voice !== v.sex) {
      console.warn(`  ⚠️  ${it.id}: data voice="${it.voice}" but script picked ${v.label} (sex=${v.sex})`);
      mismatch++;
    }
  });
  if (mismatch > 0) {
    console.warn(`  ⚠️  ${mismatch} mismatches. Audio will use the script's voice anyway.\n`);
  } else {
    console.log("  ✓ Data voice fields match script voice rotation.\n");
  }

  let done = 0, skipped = 0, errors = 0;

  for (let i = 0; i < targets.length; i++) {
    const item = targets[i];
    const v = voiceForId(item.id);
    const oFile = `${item.id}.mp3`;
    const oPath = path.join(OUT_DIR, oFile);

    console.log(`[${i + 1}/${targets.length}] ${item.id} (${v.label}, ${item.type})`);

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
