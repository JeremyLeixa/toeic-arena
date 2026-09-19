// ═══════════════════════════════════════════════════════════════════════════
// gen-mimic-audio.mjs — les sources PARLÉES de Mimic Hunt lues à voix haute (mode écoute, 2026-09-19).
//
// Pourquoi : le piège du Mimic est d'abord un piège d'écoute. En Parts 3 et 4, le distracteur
// classique REPREND un mot entendu dans l'enregistrement ; entendre la source au lieu de la lire,
// c'est l'entraînement direct de ces deux parties. Seuls les items `spoken` sont lus (conversation,
// messagerie, annonce…) : un e-mail lu à voix haute ne ressemble à rien du TOEIC.
//
// Voix et chemin : src/lib/listeningVoices.js (mimicVoice, mimicClipUrl), la règle que lit aussi
// scripts/check-audio-assets.mjs. Un item se régénère donc à l'identique.
//
//   --all           tous les items `spoken` de src/data/mimicHunt.js → public/audio/mimic/<id>.mp3
//   --sample        4 items dans prototypes/mimic-hunt/audio/ (proto listen.html)
//   --ids=a,b       avec --sample ou --all : ces items-là seulement
//   --force         régénère même si le fichier existe (sinon : skip, donc REPRENABLE)
//
// Coût (multilingual_v2 = 1 crédit/caractère) : ~100 caractères par item.
// Après --all : git add public/audio/mimic, puis npm run check:assets.
// ═══════════════════════════════════════════════════════════════════════════
import "dotenv/config";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { MIMIC_ITEMS } from "../src/data/mimicHunt.js";
import { mimicVoice, mimicClipUrl } from "../src/lib/listeningVoices.js";

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const API_KEY = process.env.ELEVENLABS_API_KEY;
if (!API_KEY) { console.error("ELEVENLABS_API_KEY manquante (.env)"); process.exit(1); }

const args = process.argv.slice(2);
const FORCE = args.includes("--force");
const SAMPLE = args.includes("--sample"), ALL = args.includes("--all");
const idsArg = args.find((a) => a.startsWith("--ids="));
if (!SAMPLE && !ALL) { console.log("Rien à faire : --all | --sample [--ids=mh23,mh16] [--force]"); process.exit(0); }

// Réglages maison (mémoire reference_audio_voices), identiques aux lots P1/P2.
const MODEL_ID = "eleven_multilingual_v2";
const VOICE_SETTINGS = { stability: 0.5, similarity_boost: 0.75, speed: 0.92 };

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

const pickIds = idsArg ? idsArg.slice(6).split(",") : null;
const items = ALL
  ? MIMIC_ITEMS.filter((it) => it.spoken && (!pickIds || pickIds.includes(it.id)))
  : (pickIds || ["mh23", "mh16", "mh46", "mh57"]).map((id) => MIMIC_ITEMS.find((x) => x.id === id));
const outOf = (id) => ALL
  ? path.join(ROOT, "public", mimicClipUrl(id).replace(/^\//, ""))
  : path.join(ROOT, "prototypes", "mimic-hunt", "audio", id + ".mp3");

let chars = 0, errors = 0, skipped = 0;
for (const it of items) {
  if (!it) { console.error("item inconnu"); errors++; continue; }
  if (ALL && !it.spoken) { console.error(it.id, "n'est pas `spoken`"); errors++; continue; }
  const out = outOf(it.id);
  if (!FORCE && fs.existsSync(out) && fs.statSync(out).size > 1000) { skipped++; continue; }
  const v = mimicVoice(it);
  try {
    const n = await tts(it.src, v.id, out);
    chars += it.src.length;
    console.log(it.id, "→", v.label, (n / 1024).toFixed(0) + " Ko");
  } catch (e) { errors++; console.error(it.id, "ÉCHEC", e.message); }
  await new Promise((r) => setTimeout(r, 600));
}
console.log("caractères :", chars, "· déjà là :", skipped, "· erreurs :", errors);
process.exit(errors ? 1 : 0);
