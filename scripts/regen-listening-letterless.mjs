// ═══════════════════════════════════════════════════════════════════════════
// regen-listening-letterless.mjs — clips P1/P2 SANS lettre + clips de lettres à part
// (2026-09-16). Voir src/lib/listeningVoices.js pour le pourquoi et les règles de voix.
//
// Ce que ça produit :
//   --letters   public/audio/letters/<voix>_<A|B|C|D>.mp3   (6 voix × 4 lettres = 24 clips)
//   --p2        public/audio/p2/<id>_q.mp3 (voix question) + <id>_0/1/2.mp3 (voix réponses,
//               SANS lettre) pour les 230 items de LISTENING_P2   (920 clips)
//   --p1        public/audio/p1/<id>_0..3.mp3 (SANS lettre, une voix par item)   (232 clips)
//   --sample    2 items P2 + 1 item P1 dans un dossier à part (écoute avant le lot complet)
//   --all       letters + p2 + p1
//   --force     régénère même si le fichier existe (sinon : skip, donc REPRENABLE)
//   --out=DIR   dossier de sortie de --sample (défaut : ./_samples)
//   --voices=a,b  avec --letters : seulement ces voix (clés de LISTENING_VOICES)
//
// Coût (multilingual_v2 = 1 crédit/caractère) : P2 ≈ 205 chars/item × 230 ≈ 47 000 ;
// P1 ≈ 120 chars/item × 58 ≈ 7 000 ; lettres ≈ 50. Total ≈ 55 000 crédits.
//
// ⚠️ Les clips d'options P1/P2 existants sont ÉCRASÉS par --p1/--p2 : ils contenaient la
// lettre, le code de lecture (Listening.jsx, Endless, Boss) l'annonce désormais à part.
// Déployer clips ET code dans le MÊME commit, sinon lettre doublée ou absente.
//
// Usage : node scripts/regen-listening-letterless.mjs --letters --sample
//         node scripts/regen-listening-letterless.mjs --all
// ═══════════════════════════════════════════════════════════════════════════
import "dotenv/config";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { LISTENING_P1, LISTENING_P2 } from "../src/data/listening.js";
import { LISTENING_VOICES, LETTERS, p1Voice, p2QuestionVoice, p2ResponseVoice } from "../src/lib/listeningVoices.js";

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const API_KEY = process.env.ELEVENLABS_API_KEY;
if (!API_KEY) { console.error("ELEVENLABS_API_KEY manquante (.env)"); process.exit(1); }

const args = new Set(process.argv.slice(2));
const FORCE = args.has("--force");
const outArg = [...args].find((a) => a.startsWith("--out="));
const SAMPLE_DIR = outArg ? outArg.slice(6) : path.join(ROOT, "_samples");
const DO = {
  letters: args.has("--letters") || args.has("--all"),
  p2: args.has("--p2") || args.has("--all"),
  p1: args.has("--p1") || args.has("--all"),
  sample: args.has("--sample"),
};
if (!DO.letters && !DO.p2 && !DO.p1 && !DO.sample) { console.log("Rien à faire : --letters | --p2 | --p1 | --sample | --all [--force]"); process.exit(0); }

// Réglages maison (mémoire reference_audio_voices) — identiques aux lots précédents.
const MODEL_ID = "eleven_multilingual_v2";
const VOICE_SETTINGS = { stability: 0.5, similarity_boost: 0.75, speed: 0.92 };
// Lettres : un seul caractère, le multilingue devine la langue et lit « A » à la française
// (/a/ au lieu de /eɪ/, constaté par Jérémy sur l'échantillon du 2026-09-16). Le modèle
// anglais seul ne peut pas se tromper de langue. Pas de `speed` : non supporté par turbo v2.
const LETTER_MODEL_ID = "eleven_turbo_v2";
// Stabilité haute : sur un clip d'une syllabe, une stabilité basse produit des souffles et
// des attaques mangées (Voice B, échantillon du 2026-09-16).
const LETTER_SETTINGS = { stability: 0.75, similarity_boost: 0.75 };
// --voices=voice_a,voice_b : ne (re)générer les lettres que de ces voix.
const voicesArg = [...args].find((a) => a.startsWith("--voices="));
const ONLY_VOICES = voicesArg ? new Set(voicesArg.slice(9).split(",")) : null;
const DELAY_MS = 600;
const wait = (ms) => new Promise((r) => setTimeout(r, ms));

async function tts(text, voiceId, outPath, modelId, settings) {
  fs.mkdirSync(path.dirname(outPath), { recursive: true });
  const res = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "xi-api-key": API_KEY },
    body: JSON.stringify({ text, model_id: modelId || MODEL_ID, voice_settings: settings || VOICE_SETTINGS }),
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}: ${(await res.text()).slice(0, 200)}`);
  const buf = Buffer.from(await res.arrayBuffer());
  fs.writeFileSync(outPath, buf);
  return buf.length;
}
let done = 0, skipped = 0, errors = 0, chars = 0;
async function gen(text, voiceId, outPath, label, modelId, settings) {
  if (!FORCE && fs.existsSync(outPath) && fs.statSync(outPath).size > 1000) { skipped++; return; }
  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      const size = await tts(text, voiceId, outPath, modelId, settings);
      done++; chars += text.length;
      console.log(`   ✅ ${label} — ${(size / 1024).toFixed(1)} KB`);
      await wait(DELAY_MS);
      return;
    } catch (e) {
      if (/429/.test(e.message) && attempt < 3) { console.log("   ⏳ 429, pause 15 s"); await wait(15000); continue; }
      errors++; console.error(`   ❌ ${label} — ${e.message}`); return;
    }
  }
}

// ── Lettres : « A. » … dans chacune des 6 voix ──────────────────────────────
async function genLetters(dir) {
  console.log(`\n── Lettres → ${dir}`);
  for (const v of LISTENING_VOICES) {
    if (ONLY_VOICES && !ONLY_VOICES.has(v.key)) continue;
    for (const L of LETTERS) await gen(`${L}.`, v.id, path.join(dir, `${v.key}_${L}.mp3`), `${v.key}_${L}`, LETTER_MODEL_ID, LETTER_SETTINGS);
  }
}
// ── P2 : question (voix Q) + 3 réponses SANS lettre (voix R ≠ Q) ───────────
async function genP2(items, dir) {
  console.log(`\n── P2 : ${items.length} item(s) → ${dir}`);
  for (let i = 0; i < items.length; i++) {
    const it = items[i]; const vq = p2QuestionVoice(it.id); const vr = p2ResponseVoice(it.id);
    console.log(`[${i + 1}/${items.length}] ${it.id}  Q=${vq.key}  R=${vr.key}`);
    await gen(it.q, vq.id, path.join(dir, `${it.id}_q.mp3`), `${it.id}_q`);
    for (let j = 0; j < it.opts.length; j++) await gen(it.opts[j], vr.id, path.join(dir, `${it.id}_${j}.mp3`), `${it.id}_${j}`);
  }
}
// ── P1 : 4 énoncés SANS lettre, une voix par item ───────────────────────────
async function genP1(items, dir) {
  console.log(`\n── P1 : ${items.length} item(s) → ${dir}`);
  for (let i = 0; i < items.length; i++) {
    const it = items[i]; const v = p1Voice(it.id);
    console.log(`[${i + 1}/${items.length}] ${it.id}  voix=${v.key}`);
    for (let j = 0; j < it.opts.length; j++) await gen(it.opts[j], v.id, path.join(dir, `${it.id}_${j}.mp3`), `${it.id}_${j}`);
  }
}

const t0 = Date.now();
if (DO.letters) await genLetters(path.join(ROOT, "public", "audio", "letters"));
if (DO.sample) {
  // Deux items P2 à voix différentes + un item P1, dans un dossier à part : à écouter.
  await genP2([LISTENING_P2[0], LISTENING_P2[1]], path.join(SAMPLE_DIR, "p2"));
  await genP1([LISTENING_P1[0]], path.join(SAMPLE_DIR, "p1"));
}
if (DO.p2) await genP2(LISTENING_P2, path.join(ROOT, "public", "audio", "p2"));
if (DO.p1) await genP1(LISTENING_P1, path.join(ROOT, "public", "audio", "p1"));

console.log(`\n────────────────────────────────────`);
console.log(`   ✅ générés : ${done}   ⏭ existants : ${skipped}   ❌ erreurs : ${errors}`);
console.log(`   crédits consommés ≈ ${chars}   durée ${Math.round((Date.now() - t0) / 1000)} s`);
console.log(`────────────────────────────────────`);
if (errors) { console.log("Relancer la même commande : les fichiers déjà produits sont sautés."); process.exit(1); }
