// ═══════════════════════════════════════════════════════════
// generate-audio-p3-batch2.cjs
// Generates Part 3 conversations p3_21 → p3_30 (40 lines)
// Resume-safe: skips files that already exist (>1KB)
//
// Usage (PowerShell):
//   $env:ELEVENLABS_API_KEY="sk_xxxxxxx"
//   node scripts/generate-audio-p3-batch2.cjs
//
// Output: public/audio/p3/{id}_line{i}.mp3
// ═══════════════════════════════════════════════════════════

const fs = require("fs");
const path = require("path");

const API_KEY = process.env.ELEVENLABS_API_KEY;
if (!API_KEY) {
  console.error("\u274C Missing ELEVENLABS_API_KEY environment variable.");
  process.exit(1);
}

// ── Voices — same as original P3 generation ──
const VOICES = {
  W: "EXAVITQu4vr4xnSDxMaL",  // Sarah (US female)
  M: "pqHfZKP75CvOlQylNhV4",  // Bill (US male)
};

const MODEL_ID = "eleven_multilingual_v2";
const VOICE_SETTINGS = { stability: 0.5, similarity_boost: 0.75, speed: 0.92 };
const DELAY_MS = 600;

const OUT_DIR = path.join(__dirname, "..", "public", "audio", "p3");

// ═══════════════════════════════════════════════════════════
// 10 NEW Part 3 conversations (p3_21 → p3_30)
// 4 lines each = 40 audio files
// ═══════════════════════════════════════════════════════════

const CONVERSATIONS = [
  {id:"p3_21", lines:[
    {s:"M", t:"I just got the email — we're officially moving to the new office on the fifteenth."},
    {s:"W", t:"That's only two weeks away. Have the movers been booked?"},
    {s:"M", t:"Yes, but we need everyone to label their boxes by next Wednesday at the latest."},
    {s:"W", t:"I'll send a reminder to all departments this afternoon."},
  ]},
  {id:"p3_22", lines:[
    {s:"W", t:"I've received a complaint from a client about the quality of the latest shipment."},
    {s:"M", t:"What exactly was the issue?"},
    {s:"W", t:"Several items arrived damaged. The packaging didn't have enough protective material."},
    {s:"M", t:"We should send replacements immediately and review our packaging process with the warehouse team."},
  ]},
  {id:"p3_23", lines:[
    {s:"M", t:"I heard the company is introducing a new transport allowance for employees who use public transit."},
    {s:"W", t:"That's right. It's seventy-five dollars a month, starting in January."},
    {s:"M", t:"Does it apply to everyone, or just full-time staff?"},
    {s:"W", t:"Full-time employees only, but part-time staff can apply for a partial subsidy."},
  ]},
  {id:"p3_24", lines:[
    {s:"W", t:"The IT department has scheduled a system upgrade for this Saturday from 6 AM to noon."},
    {s:"M", t:"So the network will be down for six hours? That's going to affect anyone working over the weekend."},
    {s:"W", t:"They've set up a temporary Wi-Fi network for basic email and browsing during the downtime."},
    {s:"M", t:"Good. I'll make sure my team saves everything to their local drives on Friday before they leave."},
  ]},
  {id:"p3_25", lines:[
    {s:"M", t:"Have you signed up for the leadership development program yet? Registration closes tomorrow."},
    {s:"W", t:"I was thinking about it, but isn't it only for senior managers?"},
    {s:"M", t:"No, they opened it up this year. Anyone with at least two years at the company can apply."},
    {s:"W", t:"Oh, that's great. I've been here for three years, so I'll register today."},
  ]},
  {id:"p3_26", lines:[
    {s:"W", t:"We need to finalize the catering for the annual company picnic next Saturday."},
    {s:"M", t:"How many people have confirmed so far?"},
    {s:"W", t:"About a hundred and forty, including employees and their families."},
    {s:"M", t:"Let's order for a hundred and sixty, just to be safe. We always get last-minute sign-ups."},
  ]},
  {id:"p3_27", lines:[
    {s:"M", t:"Welcome aboard! I'm James from HR. I'll be showing you around the office today."},
    {s:"W", t:"Thank you. I'm really excited to start. Where should I set up my workstation?"},
    {s:"M", t:"Your desk is on the third floor, near the marketing team. Your laptop and badge are already there."},
    {s:"W", t:"Perfect. Is there anything I need to complete before the team meeting at eleven?"},
  ]},
  {id:"p3_28", lines:[
    {s:"W", t:"I've just finished the inventory count, and we're short two hundred units of the XT-500 model."},
    {s:"M", t:"Two hundred? That doesn't match the delivery records. The supplier confirmed the full order was shipped."},
    {s:"W", t:"I double-checked. It's possible some boxes were delivered to the wrong warehouse."},
    {s:"M", t:"I'll contact the logistics team right away and ask them to trace the shipment."},
  ]},
  {id:"p3_29", lines:[
    {s:"M", t:"I submitted my travel expenses for the Tokyo trip two weeks ago, but I haven't been reimbursed yet."},
    {s:"W", t:"Let me check the system. It looks like your receipts for the hotel were flagged because the amount exceeded the daily limit."},
    {s:"M", t:"The hotel was more expensive because it was close to the conference venue. My manager approved the exception."},
    {s:"W", t:"In that case, I just need your manager's written approval. Once I have that, I can process it within three business days."},
  ]},
  {id:"p3_30", lines:[
    {s:"W", t:"Our office lease expires in September, and the landlord has offered us a renewal at a ten percent increase."},
    {s:"M", t:"Ten percent is quite steep. Have we looked at other locations?"},
    {s:"W", t:"I've visited two other buildings. One is cheaper but farther from the metro, and the other is similar in price."},
    {s:"M", t:"Let's negotiate with the current landlord first. We've been reliable tenants for five years — that should give us some leverage."},
  ]},
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
  console.log("\n\u2550\u2550\u2550 TOEIC Arena \u2014 Part 3 Batch 2 (p3_21\u2192p3_30) \u2550\u2550\u2550\n");
  console.log(`Voices: Sarah (W) + Bill (M)`);
  console.log(`Model: ${MODEL_ID}`);
  console.log(`Output: ${OUT_DIR}\n`);

  let done = 0, skipped = 0, errors = 0;
  const totalLines = CONVERSATIONS.reduce((sum, c) => sum + c.lines.length, 0);

  for (let i = 0; i < CONVERSATIONS.length; i++) {
    const conv = CONVERSATIONS[i];
    console.log(`[${i + 1}/${CONVERSATIONS.length}] ${conv.id}`);

    for (let j = 0; j < conv.lines.length; j++) {
      const line = conv.lines[j];
      const filename = `${conv.id}_line${j}.mp3`;
      const outPath = path.join(OUT_DIR, filename);
      const voiceId = VOICES[line.s];

      try {
        const result = await generateAudio(line.t, voiceId, outPath);
        if (result === "skip") {
          skipped++;
          console.log(`   \u23ED\uFE0F  ${filename} (exists)`);
        } else {
          done++;
          console.log(`   \u2705 ${filename} (${line.s}) \u2014 ${(result / 1024).toFixed(1)}KB`);
          await wait(DELAY_MS);
        }
      } catch (e) {
        errors++;
        console.error(`   \u274C ${filename} \u2014 ${e.message}`);
        if (e.message.includes("429")) {
          console.log("   \u23F3 Rate limited, waiting 15s...");
          await wait(15000);
          try {
            const result = await generateAudio(line.t, voiceId, outPath);
            if (result !== "skip") {
              done++; errors--;
              console.log(`   \u2705 ${filename} (retry OK)`);
            }
          } catch (e2) {
            console.error(`   \u274C ${filename} \u2014 retry failed: ${e2.message}`);
          }
        }
      }
    }
  }

  console.log(`\n\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500`);
  console.log(`   \u2705 Generated: ${done}`);
  console.log(`   \u23ED\uFE0F  Skipped:   ${skipped}`);
  console.log(`   \u274C Errors:    ${errors}`);
  console.log(`   Total:      ${done + skipped + errors}/${totalLines} lines`);
  console.log(`   \uD83D\uDCC1 Output:    ${OUT_DIR}`);
  console.log(`\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\n`);

  if (errors > 0) {
    console.log("\uD83D\uDCA1 Re-run to retry failed files (existing files are auto-skipped).\n");
  }
}

main().catch(console.error);
