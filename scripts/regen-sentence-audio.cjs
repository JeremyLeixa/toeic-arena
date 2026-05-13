// ═══════════════════════════════════════════
// regen-sentence-audio.cjs
// ═══════════════════════════════════════════
//
// Scans public/audio/sentences/ for sb_NN.mp3 files missing relative to
// the SENTENCES array in src/data/sentences.js, then regenerates the
// missing ones via ElevenLabs (Sarah voice).
//
// Use case: after rewriting / replacing sentences, delete the affected
// MP3s so this script picks them up on the next run.
//
// Usage:
//   1. ELEVENLABS_API_KEY must be in .env
//   2. node scripts/regen-sentence-audio.cjs
//
// Voice: Sarah (EXAVITQu4vr4xnSDxMaL, us_female)
// Model: eleven_multilingual_v2
// Settings: stability 0.55 / similarity_boost 0.75 / speed 0.85
//           (matches CLAUDE.md canonical for sentences)
//
// Cost: ~30 chars/sentence × N missing ≈ negligible on Starter plan.

const fs = require('fs');
const path = require('path');
const { pathToFileURL } = require('node:url');
require('dotenv').config();

const API_KEY = process.env.ELEVENLABS_API_KEY;
if (!API_KEY) {
  console.error('❌ Missing ELEVENLABS_API_KEY in .env');
  process.exit(1);
}

const VOICE_ID = 'EXAVITQu4vr4xnSDxMaL'; // Sarah
const MODEL = 'eleven_multilingual_v2';
const SETTINGS = { stability: 0.55, similarity_boost: 0.75, speed: 0.85 };
const DELAY_MS = 500; // be polite to the API

const OUT_DIR = path.join(__dirname, '..', 'public', 'audio', 'sentences');
const SENTENCES_FILE = path.join(__dirname, '..', 'src', 'data', 'sentences.js');

async function generateOne(text, outPath) {
  const res = await fetch(
    `https://api.elevenlabs.io/v1/text-to-speech/${VOICE_ID}`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'xi-api-key': API_KEY,
      },
      body: JSON.stringify({
        text,
        model_id: MODEL,
        voice_settings: SETTINGS,
      }),
    }
  );
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`HTTP ${res.status}: ${err.substring(0, 200)}`);
  }
  const buf = Buffer.from(await res.arrayBuffer());
  fs.writeFileSync(outPath, buf);
  return buf.length;
}

async function main() {
  console.log('═══════════════════════════════════════');
  console.log('  Sentence Builder — Audio Regen');
  console.log('═══════════════════════════════════════\n');

  if (!fs.existsSync(OUT_DIR)) fs.mkdirSync(OUT_DIR, { recursive: true });

  // sentences.js is an ESM module (export var SENTENCES = [...]).
  // Dynamic import works from CJS in modern Node.
  const { SENTENCES } = await import(pathToFileURL(SENTENCES_FILE).href);
  console.log(`Loaded ${SENTENCES.length} sentences from src/data/sentences.js`);

  const missing = [];
  for (let i = 0; i < SENTENCES.length; i++) {
    const fname = `sb_${String(i + 1).padStart(2, '0')}.mp3`;
    const fpath = path.join(OUT_DIR, fname);
    if (!fs.existsSync(fpath)) {
      missing.push({ idx: i, fname, fpath, text: SENTENCES[i].s });
    }
  }

  console.log(`${missing.length} missing files to regenerate.\n`);
  if (missing.length === 0) {
    console.log('Nothing to do.');
    return;
  }

  let okCount = 0, failCount = 0;
  for (let k = 0; k < missing.length; k++) {
    const m = missing[k];
    const preview = m.text.length > 60 ? m.text.substring(0, 57) + '...' : m.text;
    process.stdout.write(`[${k + 1}/${missing.length}] ${m.fname}: "${preview}" `);
    try {
      const size = await generateOne(m.text, m.fpath);
      console.log(`✅ ${(size / 1024).toFixed(1)} KB`);
      okCount++;
    } catch (e) {
      console.log(`❌ ${e.message}`);
      failCount++;
    }
    if (k < missing.length - 1) {
      await new Promise(r => setTimeout(r, DELAY_MS));
    }
  }

  console.log('\n═══════════════════════════════════════');
  console.log(`  Done: ${okCount} ok, ${failCount} failed`);
  console.log('═══════════════════════════════════════');
  if (okCount > 0) {
    console.log('\nReview the audio, then:');
    console.log('  git add public/audio/sentences/');
    console.log('  git commit -m "audio(sbuild): regen sb_NN sentences"');
    console.log('  git push');
  }
}

main().catch(err => {
  console.error('Fatal:', err);
  process.exit(1);
});
