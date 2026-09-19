// ═══════════════════════════════════════════════════════════════════════════
// gen-mimic-audio.mjs — les sources PARLÉES de Mimic Hunt lues à voix haute (lot audio, 2026-09-19).
//
// Pourquoi : le piège du Mimic est d'abord un piège d'écoute. En Parts 3 et 4, le distracteur
// classique REPREND un mot entendu dans l'enregistrement ; entendre la source au lieu de la lire,
// c'est l'entraînement direct de ces deux parties. Seuls les items dont la source se DIT sont lus
// (conversation, messagerie, annonce, publicité, flash d'info) : un e-mail lu à voix haute ne
// ressemble à rien du TOEIC.
//
// Voix : celles de src/lib/listeningVoices.js (6 voix, accents US / UK / CA / autres), choisies
// par le genre du locuteur — `speaker` (Man / Woman) ou `voice` ("m" / "f", pour une messagerie qui
// se présente : « Hi, it's Dana… ») — sinon parmi les six ; l'index vient du numéro de l'item, donc
// un item se régénère à l'identique.
//
//   --sample        4 items dans prototypes/mimic-hunt/audio/ (proto listen.html)
//   --ids=a,b       avec --sample : ces items-là
//   --force         régénère même si le fichier existe (sinon : skip, donc REPRENABLE)
//
// Coût (multilingual_v2 = 1 crédit/caractère) : ~100 caractères par item.
// Usage : node scripts/gen-mimic-audio.mjs --sample
// ═══════════════════════════════════════════════════════════════════════════
import "dotenv/config";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { MIMIC_ITEMS } from "../src/data/mimicHunt.js";
import { LISTENING_VOICES, itemNumber } from "../src/lib/listeningVoices.js";

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const API_KEY = process.env.ELEVENLABS_API_KEY;
if (!API_KEY) { console.error("ELEVENLABS_API_KEY manquante (.env)"); process.exit(1); }

const args = process.argv.slice(2);
const FORCE = args.includes("--force");
const SAMPLE = args.includes("--sample");
const idsArg = args.find((a) => a.startsWith("--ids="));
if (!SAMPLE) { console.log("Rien à faire : --sample [--ids=mh23,mh16] [--force]"); process.exit(0); }

// Réglages maison (mémoire reference_audio_voices), identiques aux lots P1/P2.
const MODEL_ID = "eleven_multilingual_v2";
const VOICE_SETTINGS = { stability: 0.5, similarity_boost: 0.75, speed: 0.92 };
const MALE = ["adam", "uk_m", "voice_a"], FEMALE = ["sarah", "ca_f", "voice_b"];

function mimicVoice(it) {
  const g = it.voice || (it.speaker === "Man" ? "m" : it.speaker === "Woman" ? "f" : null);
  const pool = g === "m" ? MALE : g === "f" ? FEMALE : LISTENING_VOICES.map((v) => v.key);
  const key = pool[itemNumber(it.id) % pool.length];
  return LISTENING_VOICES.find((v) => v.key === key);
}

async function tts(text, voiceId, outPath) {
  fs.mkdirSync(path.dirname(outPath), { recursive: true });
  const res = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "xi-api-key": API_KEY },
    body: JSON.stringify({ text, model_id: MODEL_ID, voice_settings: VOICE_SETTINGS }),
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}: ${(await res.text()).slice(0, 200)}`);
  const buf = Buffer.from(await res.arrayBuffer());
  fs.writeFileSync(outPath, buf);
  return buf.length;
}

const ids = idsArg ? idsArg.slice(6).split(",") : ["mh23", "mh16", "mh46", "mh57"];
const outDir = path.join(ROOT, "prototypes", "mimic-hunt", "audio");
let chars = 0, errors = 0;
for (const id of ids) {
  const it = MIMIC_ITEMS.find((x) => x.id === id);
  if (!it) { console.error("item inconnu :", id); errors++; continue; }
  const out = path.join(outDir, id + ".mp3");
  if (!FORCE && fs.existsSync(out) && fs.statSync(out).size > 1000) { console.log("skip", id); continue; }
  const v = mimicVoice(it);
  try {
    const n = await tts(it.src, v.id, out);
    chars += it.src.length;
    console.log(id, "→", v.label, (n / 1024).toFixed(0) + " Ko");
  } catch (e) { errors++; console.error(id, "ÉCHEC", e.message); }
  await new Promise((r) => setTimeout(r, 600));
}
console.log("caractères :", chars, "· erreurs :", errors);
process.exit(errors ? 1 : 0);
