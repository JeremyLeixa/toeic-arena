// ═══════════════════════════════════════════════════════════
// generate-audio-graphic-pilot.mjs — "Look at the graphic" pilot (2026-06-22)
// Generates the LINE/TALK audio for the 6 graphic-pilot items:
//   P3 conversations p3_71, p3_72, p3_73  → public/audio/p3/{id}_line0..3.mp3 + {id}.mp3 (stitched)
//   P4 talks          p4_61, p4_62, p4_63 → public/audio/p4/{id}.mp3
//
// Imports the line/talk text straight from src/data/listening.js (NO data
// duplication — single source of truth). Resume-safe: skips files that exist.
// Outputs to the REAL public/audio dirs (matching the runtime + the question
// generator), NOT scripts/public.
//
// AFTER this, run the question generator for the spoken question stems
// (it auto-detects the new items, resume-safe):
//   node scripts/generate-questions-p3p4.mjs
//
// Requires: ELEVENLABS_API_KEY env var + ffmpeg on PATH (for P3 stitching).
//
// Usage (PowerShell):
//   $env:ELEVENLABS_API_KEY="sk_xxx"
//   node scripts/generate-audio-graphic-pilot.mjs
// ═══════════════════════════════════════════════════════════

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";
import { LISTENING_P3, LISTENING_P4 } from "../src/data/listening.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const API_KEY = process.env.ELEVENLABS_API_KEY;
if (!API_KEY) {
  console.error("❌ Missing ELEVENLABS_API_KEY environment variable.");
  process.exit(1);
}

const P3_IDS = ["p3_71", "p3_72", "p3_73"];
const P4_IDS = ["p4_61", "p4_62", "p4_63"];

const VOICES = { W: "EXAVITQu4vr4xnSDxMaL", M: "pNInz6obpgDQGcFmaJgB" }; // Sarah / Adam
const MODEL_ID = "eleven_multilingual_v2";
const VOICE_SETTINGS = { stability: 0.55, similarity_boost: 0.75, speed: 0.85 };
const RATE_LIMIT_MS = 1200;
const INTER_LINE_SILENCE = 0.6;

const P3_DIR = path.join(__dirname, "..", "public", "audio", "p3");
const P4_DIR = path.join(__dirname, "..", "public", "audio", "p4");

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function tts(text, voiceId, outPath) {
  if (fs.existsSync(outPath) && fs.statSync(outPath).size > 1000) return "skip";
  const res = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`, {
    method: "POST",
    headers: { "xi-api-key": API_KEY, "Content-Type": "application/json", Accept: "audio/mpeg" },
    body: JSON.stringify({ text, model_id: MODEL_ID, voice_settings: VOICE_SETTINGS }),
  });
  if (!res.ok) throw new Error(`API ${res.status}: ${(await res.text()).slice(0, 200)}`);
  fs.writeFileSync(outPath, Buffer.from(await res.arrayBuffer()));
  return "ok";
}

function ensureSilenceFile(dir) {
  const p = path.join(dir, "_silence.mp3");
  if (fs.existsSync(p)) return p;
  const r = spawnSync("ffmpeg", ["-y", "-f", "lavfi", "-i", "anullsrc=r=44100:cl=mono",
    "-t", String(INTER_LINE_SILENCE), "-q:a", "9", "-acodec", "libmp3lame", p], { stdio: "pipe" });
  if (r.status !== 0) throw new Error(`ffmpeg silence gen failed: ${r.stderr.toString().slice(0, 200)}`);
  return p;
}

function stitch(lineFiles, outPath) {
  const silence = ensureSilenceFile(path.dirname(outPath));
  const listPath = outPath.replace(/\.mp3$/, ".txt");
  const lines = [];
  lineFiles.forEach((lf, i) => {
    lines.push(`file '${lf.replace(/\\/g, "/")}'`);
    if (i < lineFiles.length - 1) lines.push(`file '${silence.replace(/\\/g, "/")}'`);
  });
  fs.writeFileSync(listPath, lines.join("\n"), "utf-8");
  const r = spawnSync("ffmpeg", ["-y", "-f", "concat", "-safe", "0", "-i", listPath, "-c", "copy", outPath], { stdio: "pipe" });
  fs.unlinkSync(listPath);
  if (r.status !== 0) throw new Error(`ffmpeg stitch failed: ${r.stderr.toString().slice(0, 300)}`);
}

async function main() {
  fs.mkdirSync(P3_DIR, { recursive: true });
  fs.mkdirSync(P4_DIR, { recursive: true });

  const p3 = LISTENING_P3.filter((c) => P3_IDS.includes(c.id));
  const p4 = LISTENING_P4.filter((t) => P4_IDS.includes(t.id));
  console.log(`\n═══ Graphic pilot audio — ${p3.length} P3 convos + ${p4.length} P4 talks ═══\n`);

  // ── P3: per-line + stitch ──
  for (const convo of p3) {
    console.log(`P3 ${convo.id}`);
    const stitched = path.join(P3_DIR, `${convo.id}.mp3`);
    if (fs.existsSync(stitched) && fs.statSync(stitched).size > 1000) { console.log("   ✓ stitched exists, skip"); continue; }
    const lineFiles = [];
    let ok = true;
    for (let i = 0; i < convo.lines.length; i++) {
      const line = convo.lines[i];
      const lp = path.join(P3_DIR, `${convo.id}_line${i}.mp3`);
      try {
        const r = await tts(line.t, VOICES[line.s], lp);
        console.log(`   ${r === "skip" ? "⏭️ " : "✅"} line${i} [${line.s}]`);
        lineFiles.push(lp);
        if (r === "ok") await sleep(RATE_LIMIT_MS);
      } catch (e) { console.error(`   ❌ line${i}: ${e.message}`); ok = false; break; }
    }
    if (ok && lineFiles.length === convo.lines.length) {
      try { stitch(lineFiles, stitched); console.log("   🔗 stitched"); }
      catch (e) { console.error(`   ❌ stitch: ${e.message}`); }
    }
  }

  // ── P4: single talk file ──
  for (const talk of p4) {
    console.log(`P4 ${talk.id}`);
    const out = path.join(P4_DIR, `${talk.id}.mp3`);
    try {
      const r = await tts(talk.text, VOICES[talk.voice], out);
      console.log(`   ${r === "skip" ? "⏭️  exists" : "✅ generated"}`);
      if (r === "ok") await sleep(RATE_LIMIT_MS);
    } catch (e) { console.error(`   ❌ ${e.message}`); }
  }

  console.log("\n🎉 Pilot line/talk audio done.");
  console.log("👉 Next: node scripts/generate-questions-p3p4.mjs  (spoken question stems, resume-safe)\n");
}

main().catch((e) => { console.error(e); process.exit(1); });
