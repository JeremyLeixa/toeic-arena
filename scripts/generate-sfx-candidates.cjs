// ═══════════════════════════════════════════
// generate-sfx-candidates.cjs
// ═══════════════════════════════════════════
//
// Generates candidate SFX (correct / wrong / fanfare) via the ElevenLabs
// Sound Generation API (NOT text-to-speech — a separate endpoint).
// 2 variants per sound are produced so Jérémy can A/B pick before wiring
// them into src/sounds.js.
//
// Usage:
//   node scripts/generate-sfx-candidates.cjs
//
// Output: public/audio/sfx/candidates/{name}_v{1,2}.mp3

const fs = require('fs');
const path = require('path');
require('dotenv').config();

const API_KEY = process.env.ELEVENLABS_API_KEY;
if (!API_KEY) {
  console.error('Missing ELEVENLABS_API_KEY in .env');
  process.exit(1);
}

const OUT_DIR = path.join(__dirname, '..', 'public', 'audio', 'sfx', 'candidates');

// ─── Candidate definitions — ROUND 3 (correct only) ───
// Round 2's correct_v1 (bell chime) sounded great in isolation but fatiguing
// on repetition across a 15-50 question quiz session. Round 3 goes shorter,
// drier, quieter — minimal shimmer/decay so it disappears into the background
// on the 30th repeat instead of ringing out each time.
const SOUNDS = [
  {
    name: 'correct',
    variants: [
      { text: 'A very short soft notification tick, subtle gentle pop with a faint pleasant pitch, minimal decay, almost no reverb, unobtrusive positive feedback sound meant to be heard dozens of times in a row without fatigue', duration_seconds: 0.5, prompt_influence: 0.6 },
      { text: 'A tiny soft muted marimba tap, single short note, warm but very quiet and brief, clean with no ringing tail, gentle repeatable UI confirmation sound', duration_seconds: 0.5, prompt_influence: 0.6 },
      { text: 'A short breathy soft chime, low volume, quick attack and very fast fade, delicate and understated, non-fatiguing positive feedback for frequent repetition', duration_seconds: 0.5, prompt_influence: 0.55 },
    ],
  },
];

async function generateSound(text, durationSeconds, promptInfluence, outputPath) {
  if (fs.existsSync(outputPath)) {
    console.log(`  Skipped (exists): ${path.basename(outputPath)}`);
    return;
  }

  const response = await fetch('https://api.elevenlabs.io/v1/sound-generation', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'xi-api-key': API_KEY,
    },
    body: JSON.stringify({
      text,
      duration_seconds: durationSeconds,
      prompt_influence: promptInfluence,
    }),
  });

  if (!response.ok) {
    const err = await response.text();
    console.error(`  Error for "${text.substring(0, 50)}...": ${err}`);
    return;
  }

  const buffer = Buffer.from(await response.arrayBuffer());
  fs.writeFileSync(outputPath, buffer);
  console.log(`  Saved: ${path.basename(outputPath)} (${(buffer.length / 1024).toFixed(1)} KB)`);

  await new Promise((r) => setTimeout(r, 500));
}

async function main() {
  console.log('=== Verse Arena — SFX candidate generation ===\n');
  if (!fs.existsSync(OUT_DIR)) fs.mkdirSync(OUT_DIR, { recursive: true });

  for (const sound of SOUNDS) {
    console.log(`\n${sound.name}:`);
    for (let i = 0; i < sound.variants.length; i++) {
      const v = sound.variants[i];
      const outPath = path.join(OUT_DIR, `${sound.name}_v${i + 5}.mp3`);
      await generateSound(v.text, v.duration_seconds, v.prompt_influence, outPath);
    }
  }

  console.log('\nDone. Listen to the candidates in public/audio/sfx/candidates/ and tell me which variant to keep for each sound.');
}

main().catch(console.error);
