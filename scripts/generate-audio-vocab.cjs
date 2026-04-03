// ═══════════════════════════════════════════════════════════
// generate-audio-vocab.cjs
// ═══════════════════════════════════════════════════════════
//
// Génère les MP3 ElevenLabs pour :
//   - Vocab Flashcards (390 mots + 390 exemples)
//   - Phrasal Verbs (112 verbes + 112 exemples)
//   - Sentence Builder (50 phrases)
//
// Voix : Adam (homme) pour les mots/verbes seuls
//        Sarah (femme) pour les exemples/phrases en contexte
//
// Usage :
//   node scripts/generate-audio-vocab.cjs [--module vocab|phrasal|sentences] [--dry-run] [--resume]
//
// Options :
//   --module vocab      Seulement les flashcards vocab
//   --module phrasal    Seulement les phrasal verbs
//   --module sentences  Seulement le sentence builder
//   --dry-run           Affiche le plan sans appeler l'API
//   --resume            Saute les fichiers déjà existants
//
// Estimation : ~31,200 caractères (~1,054 fichiers)

const fs = require('fs');
const path = require('path');
require('dotenv').config();

// ─── Config ───────────────────────────────────────────────

const API_KEY = process.env.ELEVENLABS_API_KEY;
if (!API_KEY && !process.argv.includes('--dry-run')) {
  console.error('Missing ELEVENLABS_API_KEY in .env');
  process.exit(1);
}

const VOICE_ADAM  = 'pNInz6obpgDQGcFmaJgB';  // Adam (male) — mots seuls
const VOICE_SARAH = 'EXAVITQu4vr4xnSDxMaL';  // Sarah (female) — exemples

const MODEL = 'eleven_multilingual_v2';
const VOICE_SETTINGS = {
  stability: 0.55,
  similarity_boost: 0.75,
  speed: 0.85
};

const RATE_LIMIT_MS = 500;  // pause entre chaque requête

// ─── Parse args ───────────────────────────────────────────

const args = process.argv.slice(2);
const dryRun = args.includes('--dry-run');
const resume = args.includes('--resume');
const moduleIdx = args.indexOf('--module');
const onlyModule = moduleIdx !== -1 ? args[moduleIdx + 1] : null;

// ─── Load data from JS source files ──────────────────────

function extractVocab() {
  const src = fs.readFileSync(path.join(__dirname, '..', 'src', 'data', 'vocab.js'), 'utf8');
  const items = [];
  // Match each card: {id:"f1",w:"revenue",d:"...",e:"..."}
  const re = /\{id:"([^"]+)",w:"([^"]+)",d:"[^"]*",e:"([^"]+)"\}/g;
  let m;
  while ((m = re.exec(src)) !== null) {
    items.push({ id: m[1], word: m[2], example: m[3] });
  }
  return items;
}

function extractPhrasalVerbs() {
  const src = fs.readFileSync(path.join(__dirname, '..', 'src', 'data', 'phrasalVerbs.js'), 'utf8');
  const items = [];
  const re = /pv:"([^"]+)"[^}]*ex:"([^"]+)"/g;
  let m;
  while ((m = re.exec(src)) !== null) {
    // Build id from pv: "carry out" → "carry_out"
    const id = m[1].replace(/\s+/g, '_');
    items.push({ id, word: m[1], example: m[2] });
  }
  return items;
}

function extractSentences() {
  const src = fs.readFileSync(path.join(__dirname, '..', 'src', 'data', 'sentences.js'), 'utf8');
  const items = [];
  const re = /\{s:"([^"]+)"/g;
  let m;
  let idx = 1;
  while ((m = re.exec(src)) !== null) {
    items.push({ id: 'sb_' + String(idx).padStart(2, '0'), sentence: m[1] });
    idx++;
  }
  return items;
}

// ─── Build generation plan ───────────────────────────────

function buildPlan() {
  const plan = [];

  if (!onlyModule || onlyModule === 'vocab') {
    const vocab = extractVocab();
    const dir = path.join(__dirname, '..', 'public', 'audio', 'vocab');
    for (const item of vocab) {
      plan.push({
        file: path.join(dir, item.id + '.mp3'),
        text: item.word,
        voice: VOICE_ADAM,
        label: `vocab word: ${item.word}`
      });
      plan.push({
        file: path.join(dir, item.id + '_ex.mp3'),
        text: item.example,
        voice: VOICE_SARAH,
        label: `vocab example: ${item.word}`
      });
    }
  }

  if (!onlyModule || onlyModule === 'phrasal') {
    const phrasal = extractPhrasalVerbs();
    const dir = path.join(__dirname, '..', 'public', 'audio', 'phrasal');
    for (const item of phrasal) {
      plan.push({
        file: path.join(dir, item.id + '.mp3'),
        text: item.word,
        voice: VOICE_ADAM,
        label: `phrasal verb: ${item.word}`
      });
      plan.push({
        file: path.join(dir, item.id + '_ex.mp3'),
        text: item.example,
        voice: VOICE_SARAH,
        label: `phrasal example: ${item.word}`
      });
    }
  }

  if (!onlyModule || onlyModule === 'sentences') {
    const sentences = extractSentences();
    const dir = path.join(__dirname, '..', 'public', 'audio', 'sentences');
    for (const item of sentences) {
      plan.push({
        file: path.join(dir, item.id + '.mp3'),
        text: item.sentence,
        voice: VOICE_SARAH,
        label: `sentence: ${item.sentence.slice(0, 50)}...`
      });
    }
  }

  return plan;
}

// ─── ElevenLabs TTS call ─────────────────────────────────

async function generateMP3(text, voiceId, outPath) {
  const url = `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`;

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'xi-api-key': API_KEY,
      'Content-Type': 'application/json',
      'Accept': 'audio/mpeg'
    },
    body: JSON.stringify({
      text,
      model_id: MODEL,
      voice_settings: VOICE_SETTINGS
    })
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`ElevenLabs ${res.status}: ${body}`);
  }

  const buffer = Buffer.from(await res.arrayBuffer());
  fs.writeFileSync(outPath, buffer);
  return buffer.length;
}

// ─── Sleep utility ───────────────────────────────────────

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

// ─── Main ────────────────────────────────────────────────

async function main() {
  const plan = buildPlan();

  // Ensure output directories exist
  const dirs = new Set(plan.map(p => path.dirname(p.file)));
  for (const dir of dirs) {
    fs.mkdirSync(dir, { recursive: true });
  }

  // Count characters
  const totalChars = plan.reduce((s, p) => s + p.text.length, 0);
  const totalFiles = plan.length;

  console.log('='.repeat(60));
  console.log('  TOEIC Arena — Audio Generation (Vocab / Phrasal / Sentences)');
  console.log('='.repeat(60));
  console.log(`  Files to generate : ${totalFiles}`);
  console.log(`  Total characters  : ${totalChars.toLocaleString()}`);
  console.log(`  Voices            : Adam (words) + Sarah (examples)`);
  console.log(`  Mode              : ${dryRun ? 'DRY RUN' : 'LIVE'}`);
  console.log(`  Resume            : ${resume ? 'YES (skip existing)' : 'NO (overwrite)'}`);
  if (onlyModule) console.log(`  Module filter     : ${onlyModule}`);
  console.log('='.repeat(60));

  if (dryRun) {
    // Show breakdown
    const byDir = {};
    for (const p of plan) {
      const d = path.basename(path.dirname(p.file));
      byDir[d] = byDir[d] || { count: 0, chars: 0 };
      byDir[d].count++;
      byDir[d].chars += p.text.length;
    }
    console.log('\nBreakdown:');
    for (const [dir, info] of Object.entries(byDir)) {
      console.log(`  ${dir}: ${info.count} files, ${info.chars.toLocaleString()} chars`);
    }
    console.log('\nFirst 10 items:');
    for (const p of plan.slice(0, 10)) {
      console.log(`  ${path.basename(p.file).padEnd(20)} | ${p.label}`);
    }
    console.log('\n(dry run — no API calls made)');
    return;
  }

  // Live generation
  let done = 0;
  let skipped = 0;
  let errors = 0;
  let charsUsed = 0;

  for (const p of plan) {
    // Resume mode: skip if file already exists
    if (resume && fs.existsSync(p.file)) {
      skipped++;
      done++;
      continue;
    }

    try {
      const size = await generateMP3(p.text, p.voice, p.file);
      charsUsed += p.text.length;
      done++;
      const pct = ((done / totalFiles) * 100).toFixed(1);
      console.log(`[${done}/${totalFiles}] ${pct}% | ${path.basename(p.file).padEnd(20)} | ${(size/1024).toFixed(1)} KB | ${p.label}`);
    } catch (err) {
      errors++;
      done++;
      console.error(`[ERROR] ${path.basename(p.file)}: ${err.message}`);
    }

    await sleep(RATE_LIMIT_MS);
  }

  console.log('\n' + '='.repeat(60));
  console.log(`  Done! ${done - errors - skipped} generated, ${skipped} skipped, ${errors} errors`);
  console.log(`  Characters used: ${charsUsed.toLocaleString()}`);
  console.log('='.repeat(60));
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
