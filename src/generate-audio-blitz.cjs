// ═══════════════════════════════════════════════════════════
// generate-audio-blitz.cjs
// Generates all 30 Audio Blitz audio files via ElevenLabs API
// Resume-safe: skips files that already exist (>1KB)
//
// Usage (PowerShell):
//   $env:ELEVENLABS_API_KEY="sk_xxxxxxx"
//   node scripts/generate-audio-blitz.cjs
//
// Usage (bash):
//   ELEVENLABS_API_KEY=sk_xxxxxxx node scripts/generate-audio-blitz.cjs
//
// Output: public/audio/blitz/{id}.mp3
// ═══════════════════════════════════════════════════════════

const fs = require("fs");
const path = require("path");

const API_KEY = process.env.ELEVENLABS_API_KEY;
if (!API_KEY) {
  console.error("\u274C Missing ELEVENLABS_API_KEY environment variable.");
  process.exit(1);
}

// ── Voices ──
// Alternating M/W for TOEIC realism
const VOICES = {
  W: "EXAVITQu4vr4xnSDxMaL",  // Sarah (US female)
  M: "pqHfZKP75CvOlQylNhV4",  // Bill (US male)
};

const MODEL_ID = "eleven_multilingual_v2";
const VOICE_SETTINGS = { stability: 0.5, similarity_boost: 0.75, speed: 0.92 };
const DELAY_MS = 600;

const OUT_DIR = path.join(__dirname, "..", "public", "audio", "blitz");

// ═══════════════════════════════════════════════════════════
// All 30 Audio Blitz items with voice assignments
// Voice chosen based on content context for natural variety
// ═══════════════════════════════════════════════════════════

const ITEMS = [
  // ── Announcements / Instructions ──
  {id:"ab_01", voice:"M", text:"The meeting has been moved from Conference Room A to Room 312 on the third floor."},
  {id:"ab_02", voice:"W", text:"Please note that the parking garage will be closed for maintenance this weekend."},
  {id:"ab_03", voice:"M", text:"All expense reports for the month of October must be submitted by Friday at 5 PM."},
  {id:"ab_04", voice:"W", text:"Due to the weather forecast, tomorrow's outdoor team-building event has been postponed until further notice."},
  {id:"ab_05", voice:"M", text:"The new employee orientation will take place in the main auditorium at nine thirty."},

  // ── Phone / Voicemail ──
  {id:"ab_06", voice:"W", text:"Hi, this is Karen from accounting. I'm calling about the invoice you sent last Tuesday. Could you call me back?"},
  {id:"ab_07", voice:"M", text:"I'm afraid Mr. Tanaka is not available at the moment. Would you like to leave a message?"},
  {id:"ab_08", voice:"W", text:"Good morning. I'm calling to confirm your reservation for twelve guests on Saturday evening at seven."},

  // ── Short dialogues ──
  {id:"ab_09", voice:"M", text:"Could you send me the updated price list? I need it before the client meeting at two."},
  {id:"ab_10", voice:"W", text:"The shipment was supposed to arrive yesterday, but it's been delayed by two days."},
  {id:"ab_11", voice:"M", text:"I've reviewed the proposal and I think we should increase the marketing budget by fifteen percent."},
  {id:"ab_12", voice:"W", text:"The printer on the second floor is out of order again. Please use the one near reception instead."},

  // ── Numbers & Details (listening traps) ──
  {id:"ab_13", voice:"M", text:"We sold fourteen hundred units last month, which is a twenty percent increase from August."},
  {id:"ab_14", voice:"W", text:"The flight to Singapore departs at ten fifteen, not ten fifty as originally scheduled."},
  {id:"ab_15", voice:"M", text:"The total cost of the project came to forty-seven thousand, three hundred and twenty dollars."},
  {id:"ab_16", voice:"W", text:"Our new office is located at 280 Park Avenue, between Third and Lexington."},

  // ── Inference / Tone ──
  {id:"ab_17", voice:"M", text:"I appreciate the effort, but I think we need to go in a completely different direction with this design."},
  {id:"ab_18", voice:"W", text:"If we don't hear back from the supplier by Thursday, we should start looking at alternatives."},
  {id:"ab_19", voice:"M", text:"The quarterly results were better than expected, especially in the Asia-Pacific region."},
  {id:"ab_20", voice:"W", text:"I'm not sure we can meet the original deadline, but we could deliver a preliminary version by next Wednesday."},

  // ── Similar-sounding traps ──
  {id:"ab_21", voice:"M", text:"Please make thirty copies of the report and leave them on my desk."},
  {id:"ab_22", voice:"W", text:"The manager is currently working on the annual budget, not the audit."},
  {id:"ab_23", voice:"M", text:"We need to hire a technician, not a teacher, for the IT department."},
  {id:"ab_24", voice:"W", text:"The client wants to buy the property, not rent it."},

  // ── Workplace situations ──
  {id:"ab_25", voice:"M", text:"Attention please. The fire drill will begin in approximately five minutes. Please proceed to the nearest exit."},
  {id:"ab_26", voice:"W", text:"The cafeteria will be offering a new menu starting next Monday, with more vegetarian options."},
  {id:"ab_27", voice:"M", text:"Your hotel reservation has been confirmed for three nights, checking in on the fourteenth."},
  {id:"ab_28", voice:"W", text:"The warranty on this product covers repairs for up to two years from the date of purchase."},
  {id:"ab_29", voice:"M", text:"I'd recommend taking the express train rather than driving. It's much faster during rush hour."},
  {id:"ab_30", voice:"W", text:"The contract states that payment is due within thirty days of receiving the invoice."},
];

// ═══════════════════════════════════════════════════════════

async function generateAudio(text, voiceId, outputPath) {
  const dir = path.dirname(outputPath);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

  // Resume support: skip existing files > 1KB
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
  console.log("\n\u2550\u2550\u2550 TOEIC Arena \u2014 Audio Blitz Generation \u2550\u2550\u2550\n");
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
    console.log("\uD83D\uDCA1 Re-run the script to retry failed files (existing files are auto-skipped).\n");
  }
}

main().catch(console.error);
