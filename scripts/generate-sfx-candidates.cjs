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

// ─── Candidate definitions — ROUND 2 (refined after Jérémy's feedback) ───
// correct: v1 bell-chime direction confirmed, sharpen it further.
// wrong: round 1 was too soft/unclear — needs to read unmistakably as an error.
// fanfare: round 1 was too generic-orchestral — wants a medieval horn/lute feel, not a symphony sting.
const SOUNDS = [
  {
    name: 'correct',
    variants: [
      { text: 'A single clear bright bell chime, like a small temple bell struck once, warm metallic shimmer, fantasy RPG correct-answer sound, pure tone, short decay', duration_seconds: 0.8, prompt_influence: 0.7 },
      { text: 'A crystal-clear magic bell chime with a quick sparkling harmonic overtone, warm and satisfying, fantasy game success sound, bright and pure, no vocal or noise elements', duration_seconds: 0.8, prompt_influence: 0.75 },
    ],
  },
  {
    name: 'wrong',
    variants: [
      { text: 'A short sharp error buzz, unmistakably a mistake sound, low dissonant double note clashing together, dry and immediate, fantasy game UI negative feedback, no long tail', duration_seconds: 0.6, prompt_influence: 0.7 },
      { text: 'A dull metallic clang like a sword hitting a shield and failing, low pitched, single hit, clearly negative feedback tone, fantasy game wrong-answer sound, dry and short', duration_seconds: 0.6, prompt_influence: 0.7 },
    ],
  },
  {
    name: 'fanfare',
    variants: [
      { text: 'A short medieval horn fanfare, natural brass hunting horn playing two to three ascending heroic notes, no strings, no modern orchestra, tavern and battlefield feel, triumphant and brief', duration_seconds: 2.2, prompt_influence: 0.75 },
      { text: 'A quick medieval lute and horn victory flourish, acoustic instruments only, heroic ascending melody resolving brightly, folk fantasy tavern celebration sound, short and warm', duration_seconds: 2.2, prompt_influence: 0.7 },
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
      const outPath = path.join(OUT_DIR, `${sound.name}_v${i + 3}.mp3`);
      await generateSound(v.text, v.duration_seconds, v.prompt_influence, outPath);
    }
  }

  console.log('\nDone. Listen to the candidates in public/audio/sfx/candidates/ and tell me which variant to keep for each sound.');
}

main().catch(console.error);
