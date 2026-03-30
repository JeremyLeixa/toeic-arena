// ═══════════════════════════════════════════════════════════
// generate-audio-p2-batch2.cjs
// Generates Part 2 items p2_51 → p2_75 (25 items × 4 = 100 files)
// Each item: {id}_q.mp3 (question) + {id}_0.mp3, {id}_1.mp3, {id}_2.mp3
// Resume-safe: skips files that already exist (>1KB)
//
// Usage (PowerShell):
//   $env:ELEVENLABS_API_KEY="sk_xxxxxxx"
//   node scripts/generate-audio-p2-batch2.cjs
//
// Output: public/audio/p2/{id}_{q|0|1|2}.mp3
// ═══════════════════════════════════════════════════════════

const fs = require("fs");
const path = require("path");

const API_KEY = process.env.ELEVENLABS_API_KEY;
if (!API_KEY) {
  console.error("\u274C Missing ELEVENLABS_API_KEY environment variable.");
  process.exit(1);
}

// ── Voice: Sarah (US female) — consistent with existing P2 audio ──
const VOICE_ID = "EXAVITQu4vr4xnSDxMaL";
const MODEL_ID = "eleven_multilingual_v2";
const VOICE_SETTINGS = { stability: 0.5, similarity_boost: 0.75, speed: 0.92 };
const DELAY_MS = 600;

const OUT_DIR = path.join(__dirname, "..", "public", "audio", "p2");

// ═══════════════════════════════════════════════════════════
// 25 NEW Part 2 items (p2_51 → p2_75)
// ═══════════════════════════════════════════════════════════

const ITEMS = [
  {id:"p2_51", q:"What floor is the human resources department on?",
    opts:["They handle recruitment and benefits.","It's on the seventh floor, next to legal.","The department has fifteen employees."]},

  {id:"p2_52", q:"I don't think the projector is working properly.",
    opts:["The presentation was very clear.","Have you tried restarting it?","The projector was expensive."]},

  {id:"p2_53", q:"How far is the nearest post office from here?",
    opts:["It closes at 5 PM.","About a ten-minute walk down Main Street.","I need to mail a package."]},

  {id:"p2_54", q:"Weren't we supposed to receive the samples today?",
    opts:["The samples look great.","The supplier said they'll arrive by Thursday.","We ordered fifty samples."]},

  {id:"p2_55", q:"Would you like me to arrange a taxi for you?",
    opts:["The taxi fare is about fifteen dollars.","That would be very helpful, thank you.","I took a taxi yesterday."]},

  {id:"p2_56", q:"What did the technician say about the server?",
    opts:["He said it needs a new hard drive.","The server room is on the basement level.","The technician arrived at noon."]},

  {id:"p2_57", q:"Should we order lunch for the workshop participants or let them go out?",
    opts:["Yes, the workshop starts at one.","Ordering in would save time.","About twenty people signed up."]},

  {id:"p2_58", q:"How much did the office furniture cost?",
    opts:["It was delivered on Monday.","Around twelve thousand dollars for everything.","The furniture looks very modern."]},

  {id:"p2_59", q:"You haven't met the new regional manager yet, have you?",
    opts:["No, but I've heard great things about her.","The regional office is in Boston.","We had a manager's meeting last week."]},

  {id:"p2_60", q:"Let's take a short break before we continue.",
    opts:["The break room has coffee and snacks.","Good idea — I could use some fresh air.","We started at nine this morning."]},

  {id:"p2_61", q:"Whose turn is it to chair the meeting this week?",
    opts:["The meeting was rescheduled.","I believe it's Sarah's turn.","The chair in the conference room is broken."]},

  {id:"p2_62", q:"How long have you been working on the Henderson account?",
    opts:["Mr. Henderson called this morning.","Since the beginning of March.","It's one of our biggest accounts."]},

  {id:"p2_63", q:"Do you know if the copy machine has been fixed?",
    opts:["I made twenty copies for the meeting.","The repair technician is coming tomorrow.","The copy machine is near the elevator."]},

  {id:"p2_64", q:"I'm not sure how to use this new expense tracking software.",
    opts:["The expenses were approved last month.","There's a tutorial video on the company intranet.","The software costs fifty dollars per license."]},

  {id:"p2_65", q:"What time should we arrive at the client's office?",
    opts:["The office is on Maple Street.","The client seemed pleased with our work.","The meeting is at 10, so let's get there by 9:45."]},

  {id:"p2_66", q:"Would it be possible to extend the warranty by one year?",
    opts:["The warranty covers parts and labor.","Yes, for an additional seventy-five dollars.","We bought it two years ago."]},

  {id:"p2_67", q:"Who else is attending the product launch event?",
    opts:["The product launches next Friday.","Most of the sales and marketing teams.","The event was a big success."]},

  {id:"p2_68", q:"This isn't the right form for a refund request, is it?",
    opts:["You're right — you need form 7B from the finance office.","The refund was processed yesterday.","I'll fill out the form this afternoon."]},

  {id:"p2_69", q:"Why is the lobby so crowded this morning?",
    opts:["There's a job fair on the ground floor today.","The lobby was redecorated last month.","I arrived early to avoid the traffic."]},

  {id:"p2_70", q:"Have the clients from Tokyo confirmed their arrival date?",
    opts:["Tokyo is nine hours ahead of London.","They'll be here on the twenty-third.","The clients were very impressed with our facility."]},

  {id:"p2_71", q:"Would you prefer the corner office or the one near the kitchen?",
    opts:["Yes, I'd like an office with a window.","The corner office is quieter, so I'll take that one.","Both offices have been recently painted."]},

  {id:"p2_72", q:"Hasn't anyone responded to the job posting yet?",
    opts:["The posting was put up on the company website.","We've received about forty applications so far.","The position requires five years of experience."]},

  {id:"p2_73", q:"I left my umbrella in the meeting room, I think.",
    opts:["It's supposed to rain all afternoon.","Let me check — yes, it's on the table by the window.","The meeting went very well today."]},

  {id:"p2_74", q:"How many people can the conference hall hold?",
    opts:["The conference is about digital marketing.","Up to three hundred, with extra seating available.","We reserved it for next Thursday."]},

  {id:"p2_75", q:"You're going to the industry expo next week, aren't you?",
    opts:["Actually, I've decided to send my assistant instead.","The expo features over two hundred exhibitors.","I went to the expo last year in Chicago."]},
];

// ═══════════════════════════════════════════════════════════

async function generateAudio(text, outputPath) {
  const dir = path.dirname(outputPath);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

  if (fs.existsSync(outputPath)) {
    const size = fs.statSync(outputPath).size;
    if (size > 1000) return "skip";
  }

  const response = await fetch(
    `https://api.elevenlabs.io/v1/text-to-speech/${VOICE_ID}`,
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

async function tryGenerate(text, outPath, label) {
  try {
    const result = await generateAudio(text, outPath);
    if (result === "skip") {
      return "skip";
    } else {
      await wait(DELAY_MS);
      return result;
    }
  } catch (e) {
    if (e.message.includes("429")) {
      console.log("   \u23F3 Rate limited, waiting 15s...");
      await wait(15000);
      try {
        const result = await generateAudio(text, outPath);
        if (result !== "skip") {
          return result;
        }
        return "skip";
      } catch (e2) {
        throw e2;
      }
    }
    throw e;
  }
}

async function main() {
  console.log("\n\u2550\u2550\u2550 TOEIC Arena \u2014 Part 2 Batch 2 (p2_51\u2192p2_75) \u2550\u2550\u2550\n");
  console.log(`Voice: Sarah (${VOICE_ID})`);
  console.log(`Model: ${MODEL_ID}`);
  console.log(`Output: ${OUT_DIR}\n`);

  let done = 0, skipped = 0, errors = 0;
  const totalFiles = ITEMS.length * 4;

  for (let i = 0; i < ITEMS.length; i++) {
    const item = ITEMS[i];
    console.log(`[${i + 1}/${ITEMS.length}] ${item.id}`);

    // Generate question audio
    const qFile = `${item.id}_q.mp3`;
    const qPath = path.join(OUT_DIR, qFile);
    try {
      const result = await tryGenerate(item.q, qPath, qFile);
      if (result === "skip") {
        skipped++;
        console.log(`   \u23ED\uFE0F  ${qFile} (exists)`);
      } else {
        done++;
        console.log(`   \u2705 ${qFile} (Q) \u2014 ${(result / 1024).toFixed(1)}KB`);
      }
    } catch (e) {
      errors++;
      console.error(`   \u274C ${qFile} \u2014 ${e.message}`);
    }

    // Generate 3 option audios
    for (let j = 0; j < item.opts.length; j++) {
      const oFile = `${item.id}_${j}.mp3`;
      const oPath = path.join(OUT_DIR, oFile);
      try {
        const result = await tryGenerate(item.opts[j], oPath, oFile);
        if (result === "skip") {
          skipped++;
          console.log(`   \u23ED\uFE0F  ${oFile} (exists)`);
        } else {
          done++;
          console.log(`   \u2705 ${oFile} \u2014 ${(result / 1024).toFixed(1)}KB`);
        }
      } catch (e) {
        errors++;
        console.error(`   \u274C ${oFile} \u2014 ${e.message}`);
      }
    }
  }

  console.log(`\n\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500`);
  console.log(`   \u2705 Generated: ${done}`);
  console.log(`   \u23ED\uFE0F  Skipped:   ${skipped}`);
  console.log(`   \u274C Errors:    ${errors}`);
  console.log(`   Total:      ${done + skipped + errors}/${totalFiles} files`);
  console.log(`   \uD83D\uDCC1 Output:    ${OUT_DIR}`);
  console.log(`\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\n`);

  if (errors > 0) {
    console.log("\uD83D\uDCA1 Re-run to retry failed files (existing files are auto-skipped).\n");
  }
}

main().catch(console.error);
