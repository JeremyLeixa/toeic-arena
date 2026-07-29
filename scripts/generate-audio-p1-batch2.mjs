// ═══════════════════════════════════════════════════════════
// generate-audio-p1-batch2.mjs
// Génère les MP3 manquants de Part 1.
//
// CONTEXTE — le commit a7e335c a ajouté 15 items (p1_44 → p1_58) avec leurs
// images mais SANS audio. En prod, ListenP1 tire 10 items au hasard dans les
// 58 → ~26% des questions étaient totalement muettes (playAudioFile résout
// silencieusement sur onerror). Ce script comble le trou.
//
// Le script ne hardcode PAS la liste des ids : il scanne LISTENING_P1 et
// génère uniquement ce qui manque sur disque. Donc il reste correct si
// d'autres items sont ajoutés plus tard — relancer suffit.
//
// Voix : rotation 6 voix par item (pas par statement) — en Part 1 réelle,
// un seul narrateur lit les 4 propositions. Les items 01-43 sont tous en
// Sarah ; la rotation ne s'applique qu'aux nouveaux.
//
// Coût estimé : ~60 fichiers × ~55 chars ≈ 3 500 credits.
//
// Usage (PowerShell) :
//   $env:ELEVENLABS_API_KEY="sk_xxx"
//   node scripts/generate-audio-p1-batch2.mjs
//
// Resume-safe : skip les fichiers déjà présents (> 1KB).
// Output : public/audio/p1/{id}_{0-3}.mp3
// ═══════════════════════════════════════════════════════════

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { LISTENING_P1 } from "../src/data/listening.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const API_KEY = process.env.ELEVENLABS_API_KEY;
if (!API_KEY) {
  console.error("Missing ELEVENLABS_API_KEY environment variable.");
  process.exit(1);
}

// Voix — voir memory/reference_audio_voices.md
const VOICE_CYCLE = [
  { id: "EXAVITQu4vr4xnSDxMaL", label: "Sarah US-F" },
  { id: "pNInz6obpgDQGcFmaJgB", label: "Adam US-M" },
  { id: "XJVfsOvSwUXluggMM5Jj", label: "Canadian F" },
  { id: "fATgBRI8wg5KkDFg8vBd", label: "British M" },
  { id: "4yye0QE5YPsKbMOCGGlj", label: "Voice A" },
  { id: "rfkTsdZrVWEVhDycUYn9", label: "Voice B" }
];

const MODEL_ID = "eleven_multilingual_v2";
const VOICE_SETTINGS = { stability: 0.5, similarity_boost: 0.75, speed: 0.92 };
const DELAY_MS = 600;

const OUT_DIR = path.join(__dirname, "..", "public", "audio", "p1");

function voiceForId(idStr) {
  const n = parseInt(idStr.split("_")[1], 10);
  return VOICE_CYCLE[n % VOICE_CYCLE.length];
}

function exists(p) {
  try { return fs.statSync(p).size > 1000; } catch (e) { return false; }
}

async function generateAudio(text, voiceId, outputPath) {
  const dir = path.dirname(outputPath);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  if (exists(outputPath)) return "skip";

  const response = await fetch(
    `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json", "xi-api-key": API_KEY },
      body: JSON.stringify({ text, model_id: MODEL_ID, voice_settings: VOICE_SETTINGS })
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

function wait(ms) { return new Promise(r => setTimeout(r, ms)); }

async function main() {
  // Scan : quels items ont au moins un fichier manquant ?
  const todo = [];
  for (const item of LISTENING_P1) {
    const missing = [];
    for (let j = 0; j < item.opts.length; j++) {
      if (!exists(path.join(OUT_DIR, `${item.id}_${j}.mp3`))) missing.push(j);
    }
    if (missing.length) todo.push({ item, missing });
  }

  const totalFiles = todo.reduce((n, t) => n + t.missing.length, 0);
  console.log(`\nPart 1 audio — ${LISTENING_P1.length} items scannés`);
  console.log(`${todo.length} items incomplets, ${totalFiles} fichiers à générer`);
  console.log(`Output: ${OUT_DIR}\n`);
  if (!totalFiles) { console.log("Rien à faire — tous les MP3 sont présents.\n"); return; }

  let done = 0, errors = 0;

  for (let i = 0; i < todo.length; i++) {
    const { item, missing } = todo[i];
    const voice = voiceForId(item.id);
    console.log(`[${i + 1}/${todo.length}] ${item.id} — ${voice.label} (${missing.length} manquants)`);

    for (const j of missing) {
      const filename = `${item.id}_${j}.mp3`;
      const outPath = path.join(OUT_DIR, filename);
      try {
        const result = await generateAudio(item.opts[j], voice.id, outPath);
        if (result === "skip") { console.log(`   skip ${filename}`); continue; }
        done++;
        console.log(`   ok   ${filename} (${(result / 1024).toFixed(1)}KB)`);
        await wait(DELAY_MS);
      } catch (e) {
        errors++;
        console.error(`   FAIL ${filename} — ${e.message}`);
        if (e.message.includes("429")) {
          console.log("   rate limited, pause 15s...");
          await wait(15000);
          try {
            const result = await generateAudio(item.opts[j], voice.id, outPath);
            if (result !== "skip") { done++; errors--; console.log(`   ok   ${filename} (retry)`); }
          } catch (e2) {
            console.error(`   FAIL ${filename} — retry: ${e2.message}`);
          }
        }
      }
    }
  }

  console.log(`\nGénérés: ${done} / Erreurs: ${errors} / Total attendu: ${totalFiles}`);
  if (errors > 0) console.log("Relancer le script pour retenter (les fichiers OK sont skippés).\n");
  else console.log("Penser à `git add public/audio/p1` — sans ça Vercel 404 en silence.\n");
}

main().catch(console.error);
