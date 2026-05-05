// ═══════════════════════════════════════════════════════════
// generate-questions-p3p4.mjs (V2 — per-question files, 2026-05-05)
// Génère 3 fichiers par item P3 + P4 : {id}_q1.mp3, {id}_q2.mp3, {id}_q3.mp3.
// Format par fichier : "Question N. [text]." (préfixe court TOEIC-faithful).
// Voix narrateur unique : Sarah US-F (la plus neutre, déjà familière).
//
// Permet la lecture per-question en Train mode (1 clic = 1 question lue) et
// le chaînage avec pauses en Endless / Boss mode (à câbler séparément).
//
// Modes :
//   --mockup : génère uniquement p3_01_q{1,2,3}.mp3 et p4_01_q{1,2,3}.mp3 (~6 fichiers, ~600 credits)
//   (sans flag) : génère TOUS les fichiers manquants P3 (70×3=210) + P4 (60×3=180), resume-safe
//
// Coût bulk estimé : ~25 000 credits (390 fichiers × ~70 chars).
//
// Output :
//   public/audio/p3/{id}_q{1,2,3}.mp3
//   public/audio/p4/{id}_q{1,2,3}.mp3
//
// Les anciens fichiers stitchés {id}_questions.mp3 deviennent obsolètes
// (Train mode ne les utilise plus). À supprimer manuellement après validation.
//
// Usage (PowerShell) :
//   $env:ELEVENLABS_API_KEY="sk_xxx"
//   node scripts/generate-questions-p3p4.mjs --mockup    (test)
//   node scripts/generate-questions-p3p4.mjs             (full bulk)
// ═══════════════════════════════════════════════════════════

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { LISTENING_P3, LISTENING_P4 } from "../src/data/listening.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const API_KEY = process.env.ELEVENLABS_API_KEY;
if (!API_KEY) {
  console.error("❌ Missing ELEVENLABS_API_KEY environment variable.");
  process.exit(1);
}

const MOCKUP = process.argv.includes("--mockup");

const VOICE_SARAH = "EXAVITQu4vr4xnSDxMaL"; // US female, narrator standard
const MODEL_ID = "eleven_multilingual_v2";
const VOICE_SETTINGS = { stability: 0.55, similarity_boost: 0.75, speed: 0.9 };
const DELAY_MS = 600;

const P3_DIR = path.join(__dirname, "..", "public", "audio", "p3");
const P4_DIR = path.join(__dirname, "..", "public", "audio", "p4");

// Format per-question : "Question N. [text]."
function buildQuestionText(q, idx) {
  return `Question ${idx + 1}. ${q.q}`;
}

async function generateAudio(text, outputPath) {
  const dir = path.dirname(outputPath);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

  if (fs.existsSync(outputPath)) {
    const size = fs.statSync(outputPath).size;
    if (size > 1000) return "skip";
  }

  const response = await fetch(
    `https://api.elevenlabs.io/v1/text-to-speech/${VOICE_SARAH}`,
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

async function tryGenerate(text, outPath) {
  try {
    const result = await generateAudio(text, outPath);
    if (result !== "skip") await wait(DELAY_MS);
    return result;
  } catch (e) {
    if (e.message.includes("429")) {
      console.log("   ⏳ Rate limited, waiting 15s...");
      await wait(15000);
      return await generateAudio(text, outPath);
    }
    throw e;
  }
}

async function processItems(items, outDir, label) {
  let done = 0, skipped = 0, errors = 0;

  for (let i = 0; i < items.length; i++) {
    const item = items[i];
    console.log(`[${label} ${i + 1}/${items.length}] ${item.id}`);

    for (let qIdx = 0; qIdx < item.qs.length; qIdx++) {
      const text = buildQuestionText(item.qs[qIdx], qIdx);
      const oFile = `${item.id}_q${qIdx + 1}.mp3`;
      const oPath = path.join(outDir, oFile);

      try {
        const result = await tryGenerate(text, oPath);
        if (result === "skip") {
          skipped++;
          console.log(`   ⏭️  ${oFile} (exists)`);
        } else {
          done++;
          console.log(`   ✅ ${oFile} — ${(result / 1024).toFixed(1)}KB`);
        }
      } catch (e) {
        errors++;
        console.error(`   ❌ ${oFile} — ${e.message}`);
      }
    }
  }

  return { done, skipped, errors };
}

async function main() {
  console.log("\n═══ TOEIC Arena — P3/P4 Spoken Questions Generator ═══\n");
  console.log(`Voice: Sarah US-F (narrator)`);
  console.log(`Mode: ${MOCKUP ? "MOCKUP (p3_01 + p4_01 only)" : "FULL BULK"}\n`);

  const p3Targets = MOCKUP
    ? LISTENING_P3.filter(it => it.id === "p3_01")
    : LISTENING_P3;
  const p4Targets = MOCKUP
    ? LISTENING_P4.filter(it => it.id === "p4_01")
    : LISTENING_P4;

  const p3Files = p3Targets.reduce((s, it) => s + it.qs.length, 0);
  const p4Files = p4Targets.reduce((s, it) => s + it.qs.length, 0);
  console.log(`P3 targets: ${p3Targets.length} items (${p3Files} files) | P4 targets: ${p4Targets.length} items (${p4Files} files)`);
  console.log(`Total files: ${p3Files + p4Files}\n`);

  const p3Stats = await processItems(p3Targets, P3_DIR, "P3");
  console.log("");
  const p4Stats = await processItems(p4Targets, P4_DIR, "P4");

  console.log(`\n────────────────────────────────────`);
  console.log(`P3 → Generated: ${p3Stats.done}, Skipped: ${p3Stats.skipped}, Errors: ${p3Stats.errors}`);
  console.log(`P4 → Generated: ${p4Stats.done}, Skipped: ${p4Stats.skipped}, Errors: ${p4Stats.errors}`);
  console.log(`────────────────────────────────────\n`);

  const totalErrors = p3Stats.errors + p4Stats.errors;
  if (totalErrors > 0) {
    console.log("💡 Re-run pour réessayer les fichiers en erreur (resume-safe).\n");
    process.exit(1);
  }

  if (MOCKUP) {
    console.log("👉 Mockup OK. Test the playback in dev mode, then re-run without --mockup for the full batch.\n");
  }
}

main().catch((err) => { console.error(err); process.exit(1); });
