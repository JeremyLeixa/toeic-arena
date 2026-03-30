// ═══════════════════════════════════════════════════════════
// generate-audio-blitz-batch2.cjs
// Generates NEW Audio Blitz files ab_31 → ab_60 (30 items)
// Resume-safe: skips files that already exist (>1KB)
//
// Usage (PowerShell):
//   $env:ELEVENLABS_API_KEY="sk_xxxxxxx"
//   node scripts/generate-audio-blitz-batch2.cjs
//
// Output: public/audio/blitz/ab_31.mp3 → ab_60.mp3
// ═══════════════════════════════════════════════════════════

const fs = require("fs");
const path = require("path");

const API_KEY = process.env.ELEVENLABS_API_KEY;
if (!API_KEY) {
  console.error("\u274C Missing ELEVENLABS_API_KEY environment variable.");
  process.exit(1);
}

// ── Voices ──
const VOICES = {
  W: "EXAVITQu4vr4xnSDxMaL",  // Sarah (US female)
  M: "pqHfZKP75CvOlQylNhV4",  // Bill (US male)
};

const MODEL_ID = "eleven_multilingual_v2";
const VOICE_SETTINGS = { stability: 0.5, similarity_boost: 0.75, speed: 0.92 };
const DELAY_MS = 600;

const OUT_DIR = path.join(__dirname, "..", "public", "audio", "blitz");

// ═══════════════════════════════════════════════════════════
// 30 NEW Audio Blitz items (ab_31 → ab_60)
// ═══════════════════════════════════════════════════════════

const ITEMS = [
  // ── Announcements / Instructions ──
  {id:"ab_31", voice:"M", text:"The staff meeting originally scheduled for Tuesday has been moved to Thursday at the same time."},
  {id:"ab_32", voice:"W", text:"Please remember to badge in and out every day. The security team will be checking records starting next week."},
  {id:"ab_33", voice:"M", text:"All visitors must sign in at the front desk and wear a visitor badge at all times while in the building."},
  {id:"ab_34", voice:"W", text:"Recycling bins have been placed on every floor. Please separate paper from plastic and glass."},
  {id:"ab_35", voice:"M", text:"The company gym will be closed for renovations from March first through March fifteenth."},

  // ── Phone / Voicemail ──
  {id:"ab_36", voice:"M", text:"Hi, this is David from the IT help desk. Your laptop has been repaired and is ready for pickup."},
  {id:"ab_37", voice:"W", text:"Good afternoon, this is Dr. Morgan's office. We need to reschedule your appointment from the tenth to the twelfth."},
  {id:"ab_38", voice:"W", text:"Hello, I'm calling from Greenfield Catering. The order for sixty sandwiches will be delivered by noon tomorrow."},
  {id:"ab_39", voice:"M", text:"This is a reminder that your subscription expires on April thirtieth. Please renew online to avoid service interruption."},

  // ── Short dialogues / Workplace ──
  {id:"ab_40", voice:"W", text:"I've just spoken to the client, and they've agreed to extend the deadline by one week."},
  {id:"ab_41", voice:"M", text:"The conference room on the fourth floor has a projector, but the one on the sixth floor does not."},
  {id:"ab_42", voice:"W", text:"Could you forward me the email from the supplier? I need the tracking number for the shipment."},
  {id:"ab_43", voice:"M", text:"We've decided to go with the second vendor because their quote was fifteen percent lower."},
  {id:"ab_44", voice:"W", text:"The air conditioning in the east wing is being repaired today, so please use the west wing meeting rooms."},

  // ── Numbers & Details (listening traps) ──
  {id:"ab_45", voice:"M", text:"Last quarter, our team processed eighteen hundred customer requests, up from fifteen hundred the quarter before."},
  {id:"ab_46", voice:"W", text:"The seminar starts at two forty-five, not two fifteen as printed in the original schedule."},
  {id:"ab_47", voice:"M", text:"We need to order three hundred and fifty chairs for the event, plus forty tables."},
  {id:"ab_48", voice:"W", text:"The storage unit costs ninety-five dollars a month, with a minimum rental period of six months."},
  {id:"ab_49", voice:"M", text:"Our office has expanded from seventy employees to over a hundred and thirty in just two years."},

  // ── Inference / Tone ──
  {id:"ab_50", voice:"W", text:"The report is mostly fine, but I'd like you to double-check the figures in section three before we send it out."},
  {id:"ab_51", voice:"M", text:"I was hoping to take Friday off, but it looks like we'll need all hands on deck for the product launch."},
  {id:"ab_52", voice:"W", text:"While the new software is more expensive, it should save us a significant amount of time in the long run."},
  {id:"ab_53", voice:"M", text:"I wouldn't say the presentation was bad, but there's definitely room for improvement."},
  {id:"ab_54", voice:"W", text:"We could either hire a full-time employee or outsource the work. Personally, I'd lean towards outsourcing."},

  // ── Similar-sounding / Negation traps ──
  {id:"ab_55", voice:"M", text:"The package should be sent to the Berlin office, not the Dublin office."},
  {id:"ab_56", voice:"W", text:"Ms. Park asked for fifty binders, not fifteen, for the training session."},
  {id:"ab_57", voice:"M", text:"The report should be sent to the director, not the editor, for final approval."},
  {id:"ab_58", voice:"W", text:"We're looking for a consultant, not a permanent employee, to help with the transition."},
  {id:"ab_59", voice:"M", text:"Please note that the presentation is on the third floor, not the first floor as previously announced."},
  {id:"ab_60", voice:"W", text:"The workshop will last two and a half hours, including a fifteen-minute break in the middle."},
];

// ═══════════════════════════════════════════════════════════

async function generateAudio(text, voiceId, outputPath) {
  const dir = path.dirname(outputPath);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

  if (fs.existsSync(outputPath)) {
    const size = fs.statSync(outputPath).size;
    if (size > 1000) return "skip";
  }

  const response = await fetch(
    `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "xi-api-key": API_KEY,
      },
      body: JSON.stringify({
        text,
        model_id: MODEL_ID,
        voice_settings: VOICE_SETTINGS,
      }),
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
  console.log("\n\u2550\u2550\u2550 TOEIC Arena \u2014 Audio Blitz Batch 2 (ab_31\u2192ab_60) \u2550\u2550\u2550\n");
  console.log(`Voices: Sarah (W) + Bill (M)`);
  console.log(`Model: ${MODEL_ID}`);
  console.log(`Output: ${OUT_DIR}\n`);

  let done = 0, skipped = 0, errors = 0;

  for (let i = 0; i < ITEMS.length; i++) {
    const item = ITEMS[i];
    const filename = `${item.id}.mp3`;
    const outPath = path.join(OUT_DIR, filename);
    const voiceId = VOICES[item.voice];

    try {
      const result = await generateAudio(item.text, voiceId, outPath);
      if (result === "skip") {
        skipped++;
        console.log(`[${i + 1}/${ITEMS.length}] \u23ED\uFE0F  ${item.id} (exists)`);
      } else {
        done++;
        console.log(`[${i + 1}/${ITEMS.length}] \u2705 ${item.id} (${item.voice}) \u2014 ${(result / 1024).toFixed(1)}KB`);
        await wait(DELAY_MS);
      }
    } catch (e) {
      errors++;
      console.error(`[${i + 1}/${ITEMS.length}] \u274C ${item.id} \u2014 ${e.message}`);
      if (e.message.includes("429")) {
        console.log("   \u23F3 Rate limited, waiting 15s...");
        await wait(15000);
        try {
          const result = await generateAudio(item.text, voiceId, outPath);
          if (result !== "skip") {
            done++; errors--;
            console.log(`   \u2705 ${item.id} (retry OK)`);
          }
        } catch (e2) {
          console.error(`   \u274C ${item.id} \u2014 retry failed: ${e2.message}`);
        }
      }
    }
  }

  console.log(`\n\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500`);
  console.log(`   \u2705 Generated: ${done}`);
  console.log(`   \u23ED\uFE0F  Skipped:   ${skipped}`);
  console.log(`   \u274C Errors:    ${errors}`);
  console.log(`   Total:      ${done + skipped + errors}/${ITEMS.length}`);
  console.log(`   \uD83D\uDCC1 Output:    ${OUT_DIR}`);
  console.log(`\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\n`);

  if (errors > 0) {
    console.log("\uD83D\uDCA1 Re-run to retry failed files (existing files are auto-skipped).\n");
  }
}

main().catch(console.error);
