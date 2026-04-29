// ═══════════════════════════════════════════════════════════
// generate-audio-p2-batch3.cjs
// Generates Part 2 items p2_76 → p2_125 (50 items × 4 = 200 files)
// Each item: {id}_q.mp3 (question) + {id}_0.mp3, {id}_1.mp3, {id}_2.mp3
// Resume-safe: skips files that already exist (>1KB)
//
// Voice rotation:
//   - Even-indexed items (p2_76, p2_78, ...) → VOICE_A
//   - Odd-indexed items  (p2_77, p2_79, ...) → VOICE_B
//
// Usage (PowerShell):
//   $env:ELEVENLABS_API_KEY="sk_xxxxxxx"
//   node scripts/generate-audio-p2-batch3.cjs
//
// Output: public/audio/p2/{id}_{q|0|1|2}.mp3
// Estimated cost: ~10,500 credits (Multilingual v2, 1 credit/char).
// ═══════════════════════════════════════════════════════════

const fs = require("fs");
const path = require("path");

const API_KEY = process.env.ELEVENLABS_API_KEY;
if (!API_KEY) {
  console.error("❌ Missing ELEVENLABS_API_KEY environment variable.");
  process.exit(1);
}

// ── Two new voices for accent diversity (per TOEIC: 4 accents × 2 sexes) ──
const VOICE_A = "4yye0QE5YPsKbMOCGGlj";
const VOICE_B = "rfkTsdZrVWEVhDycUYn9";
const MODEL_ID = "eleven_multilingual_v2";
const VOICE_SETTINGS = { stability: 0.5, similarity_boost: 0.75, speed: 0.92 };
const DELAY_MS = 600;

const OUT_DIR = path.join(__dirname, "..", "public", "audio", "p2");

// ═══════════════════════════════════════════════════════════
// 50 NEW Part 2 items (p2_76 → p2_125)
// Mix of: Wh- / yes-no / tag / negative / choice / indirect / statement / request
// ═══════════════════════════════════════════════════════════

const ITEMS = [
  {id:"p2_76", q:"How long has the marketing team been preparing this campaign?",
    opts:["The campaign targets young professionals.","For about three months now.","The team has fifteen members."]},

  {id:"p2_77", q:"You haven't sent the contract to the legal department yet, have you?",
    opts:["The contract is forty pages long.","No, but I'll do it before lunch.","The legal department is on the fourth floor."]},

  {id:"p2_78", q:"Would you rather take the morning flight or the afternoon one?",
    opts:["I usually fly with the same airline.","The flight was delayed by an hour.","The afternoon would give me more time to prepare."]},

  {id:"p2_79", q:"Did the new intern start this Monday or last Monday?",
    opts:["She started just this past Monday.","The internship lasts six months.","Yes, she's very enthusiastic."]},

  {id:"p2_80", q:"Why was the staff meeting moved to Friday?",
    opts:["Because the director is traveling on Wednesday.","The meeting room has fifty seats.","Yes, it's been confirmed."]},

  {id:"p2_81", q:"Where can I find the latest sales figures?",
    opts:["The sales were higher than expected.","I sold the car last week.","They're on the shared drive under Q1 reports."]},

  {id:"p2_82", q:"When are we expecting the audit team to arrive?",
    opts:["Yes, the team is very experienced.","The audit will cover three departments.","Their plane lands at 8 AM on Tuesday."]},

  {id:"p2_83", q:"This printer keeps jamming every time I use it.",
    opts:["I can call IT support for you.","I printed fifty copies yesterday.","The printer was installed last year."]},

  {id:"p2_84", q:"Do you know if the exhibition is still open this Saturday?",
    opts:["I went to the exhibition last week.","Yes, until 6 PM I believe.","The exhibition features modern art."]},

  {id:"p2_85", q:"Who's responsible for ordering the office supplies?",
    opts:["We need more printer paper.","The supplies arrived this morning.","That would be Marcus in admin."]},

  {id:"p2_86", q:"What kind of training does the new software require?",
    opts:["I trained at the head office.","The software cost ten thousand dollars.","Just a two-hour online tutorial."]},

  {id:"p2_87", q:"The board approved our proposal, didn't they?",
    opts:["Yes, but with some minor revisions.","The board has twelve members.","I'll prepare another proposal."]},

  {id:"p2_88", q:"How often does the cleaning crew come to our floor?",
    opts:["The crew has six people.","Cleaning supplies are in the closet.","Twice a week, on Tuesdays and Fridays."]},

  {id:"p2_89", q:"Aren't you supposed to be at the client lunch right now?",
    opts:["The client rescheduled for tomorrow.","I had a sandwich at my desk.","Yes, our biggest client."]},

  {id:"p2_90", q:"Why don't we discuss this over coffee tomorrow morning?",
    opts:["The coffee shop opens at seven.","I prefer tea, actually.","Sounds good — let's say nine o'clock."]},

  {id:"p2_91", q:"Should I send the invoice by email or by mail?",
    opts:["The invoice was paid yesterday.","Send it to the accounting office.","Email is faster, so let's go with that."]},

  {id:"p2_92", q:"Whose laptop is sitting in the conference room?",
    opts:["I think it belongs to the consultant.","The conference is on innovation.","It's a brand new model."]},

  {id:"p2_93", q:"How much was the catering bill for the launch event?",
    opts:["The food was excellent.","Just over two thousand dollars.","About sixty guests attended."]},

  {id:"p2_94", q:"Where did you put the keys to the storage room?",
    opts:["I locked the door before leaving.","The storage room is full.","I left them on your desk this morning."]},

  {id:"p2_95", q:"Could you forward me the agenda before the call?",
    opts:["The call lasted forty minutes.","Sure, I'll send it right after this meeting.","I forwarded the email yesterday."]},

  {id:"p2_96", q:"Did anyone follow up with the supplier about the late shipment?",
    opts:["The shipment was supposed to arrive Monday.","Yes, Priya called them this morning.","We have several reliable suppliers."]},

  {id:"p2_97", q:"I thought the office was closing early today for the holiday.",
    opts:["You're right — we close at three this afternoon.","The holiday is on Monday.","The office has been redecorated."]},

  {id:"p2_98", q:"How many candidates are we interviewing tomorrow?",
    opts:["Five, all shortlisted from over a hundred applications.","The interviews start at nine.","The position requires a master's degree."]},

  {id:"p2_99", q:"Could you tell me where the nearest bank branch is located?",
    opts:["The bank charges low fees.","I opened my account last year.","There's one just two blocks east of here."]},

  {id:"p2_100", q:"You'll be presenting at the conference, won't you?",
    opts:["The conference is in Singapore.","Yes, on Thursday afternoon.","The presentation went well."]},

  {id:"p2_101", q:"Why don't you take the company car for your client visit?",
    opts:["The client is thirty miles away.","That's a great idea — I'll book it now.","I drive a Honda."]},

  {id:"p2_102", q:"When is the deadline for the budget submission?",
    opts:["The budget covers next quarter.","Friday at end of business.","The submission was approved."]},

  {id:"p2_103", q:"The catering for tomorrow's lunch hasn't been confirmed yet.",
    opts:["The lunch is for twenty people.","I'll call the restaurant right now.","The food yesterday was great."]},

  {id:"p2_104", q:"What time does the express train to Boston leave?",
    opts:["The train was crowded.","I bought my ticket online.","Every hour on the half hour."]},

  {id:"p2_105", q:"Wasn't the network supposed to be back online by noon?",
    opts:["The IT team is still working on it.","Yes, the new network is faster.","Online sales increased this quarter."]},

  {id:"p2_106", q:"Do you want to drive separately or carpool with the team?",
    opts:["I'd prefer to carpool to save on gas.","The drive takes about two hours.","The team is meeting at three."]},

  {id:"p2_107", q:"How is the renovation of the lobby progressing?",
    opts:["The lobby is on the ground floor.","The renovation cost a lot.","It should be finished by next Wednesday."]},

  {id:"p2_108", q:"Has the maintenance crew finished servicing the elevators?",
    opts:["The elevators are very fast.","Yes, both are running normally now.","Maintenance comes every month."]},

  {id:"p2_109", q:"Which department handles employee benefits inquiries?",
    opts:["I joined the company last year.","The benefits package is very generous.","Human Resources — extension 240."]},

  {id:"p2_110", q:"Mr. Tanaka is joining our weekly meetings now, isn't he?",
    opts:["Mr. Tanaka transferred from Tokyo.","Yes, starting from next Monday.","The meetings are held in conference room A."]},

  {id:"p2_111", q:"I can't seem to log into the new accounting system.",
    opts:["Did you receive your reset password yet?","The system is very user-friendly.","Accounting is on the third floor."]},

  {id:"p2_112", q:"How long will the keynote speech last?",
    opts:["The speaker is from Berlin.","Around forty-five minutes including Q and A.","The keynote was inspiring."]},

  {id:"p2_113", q:"Where should we hold the year-end celebration?",
    opts:["The celebration is on December 18th.","Around eighty people will attend.","Maybe the rooftop venue we used last year."]},

  {id:"p2_114", q:"Why is the parking garage closed today?",
    opts:["I usually park on Level 2.","They're repainting the lines.","The garage has three hundred spaces."]},

  {id:"p2_115", q:"Could you let me know who's covering Anna's shift this week?",
    opts:["Anna is on maternity leave.","Yusuf agreed to cover Tuesday and Thursday.","Her shifts are usually quiet."]},

  {id:"p2_116", q:"The translators are coming in at nine, aren't they?",
    opts:["Actually, they arrive at ten now.","The translation was excellent.","We hired three translators."]},

  {id:"p2_117", q:"Should we wait for Mei before starting the presentation?",
    opts:["Mei is our project manager.","The presentation has thirty slides.","She just texted that she's two minutes away."]},

  {id:"p2_118", q:"This new procedure seems much more efficient than the old one.",
    opts:["I agree — it's saved us at least two hours per week.","The procedure manual is online.","Efficiency is one of our core values."]},

  {id:"p2_119", q:"What's holding up the approval for the new hire?",
    opts:["Legal is still reviewing the contract.","She has five years of experience.","The approval was unanimous."]},

  {id:"p2_120", q:"Would you prefer the slides in color or in black and white?",
    opts:["The slides are very informative.","There are forty slides total.","Color would look more professional."]},

  {id:"p2_121", q:"You wouldn't happen to have a spare charger, would you?",
    opts:["The charger broke last week.","Sorry, I left mine at home today.","My phone has a long battery life."]},

  {id:"p2_122", q:"How did the negotiations with the vendor go this morning?",
    opts:["Better than expected — we got a ten percent discount.","The vendor is based in Munich.","I'll meet them at noon."]},

  {id:"p2_123", q:"Are we still planning to launch the product next month?",
    opts:["The product has many new features.","Yes, on the fifteenth as scheduled.","The launch event was successful."]},

  {id:"p2_124", q:"I noticed the order from Tomas Industries hasn't shipped yet.",
    opts:["Their warehouse is having a system issue — it ships tomorrow.","Tomas Industries is a longtime client.","The order was for fifty units."]},

  {id:"p2_125", q:"Which conference room has the video equipment set up?",
    opts:["The equipment was upgraded last year.","The video lasted ten minutes.","Room C on the second floor."]},
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

async function tryGenerate(text, voiceId, outPath) {
  try {
    const result = await generateAudio(text, voiceId, outPath);
    if (result === "skip") return "skip";
    await wait(DELAY_MS);
    return result;
  } catch (e) {
    if (e.message.includes("429")) {
      console.log("   ⏳ Rate limited, waiting 15s...");
      await wait(15000);
      const result = await generateAudio(text, voiceId, outPath);
      if (result === "skip") return "skip";
      return result;
    }
    throw e;
  }
}

async function main() {
  console.log("\n═══ TOEIC Arena — Part 2 Batch 3 (p2_76→p2_125) ═══\n");
  console.log(`Voice A (even ids): ${VOICE_A}`);
  console.log(`Voice B (odd ids):  ${VOICE_B}`);
  console.log(`Model: ${MODEL_ID}`);
  console.log(`Output: ${OUT_DIR}\n`);

  let done = 0, skipped = 0, errors = 0;
  const totalFiles = ITEMS.length * 4;

  for (let i = 0; i < ITEMS.length; i++) {
    const item = ITEMS[i];
    // Item index = numeric suffix of id (76, 77, ...)
    const idNum = parseInt(item.id.split("_")[1], 10);
    const voiceId = (idNum % 2 === 0) ? VOICE_A : VOICE_B;
    const voiceLabel = (idNum % 2 === 0) ? "A" : "B";

    console.log(`[${i + 1}/${ITEMS.length}] ${item.id} (voice ${voiceLabel})`);

    // Question
    const qFile = `${item.id}_q.mp3`;
    const qPath = path.join(OUT_DIR, qFile);
    try {
      const result = await tryGenerate(item.q, voiceId, qPath);
      if (result === "skip") { skipped++; console.log(`   ⏭️  ${qFile} (exists)`); }
      else { done++; console.log(`   ✅ ${qFile} — ${(result / 1024).toFixed(1)}KB`); }
    } catch (e) {
      errors++;
      console.error(`   ❌ ${qFile} — ${e.message}`);
    }

    // 3 option audios
    for (let j = 0; j < item.opts.length; j++) {
      const oFile = `${item.id}_${j}.mp3`;
      const oPath = path.join(OUT_DIR, oFile);
      try {
        const result = await tryGenerate(item.opts[j], voiceId, oPath);
        if (result === "skip") { skipped++; console.log(`   ⏭️  ${oFile} (exists)`); }
        else { done++; console.log(`   ✅ ${oFile} — ${(result / 1024).toFixed(1)}KB`); }
      } catch (e) {
        errors++;
        console.error(`   ❌ ${oFile} — ${e.message}`);
      }
    }
  }

  console.log(`\n────────────────────────────────────`);
  console.log(`   ✅ Generated: ${done}`);
  console.log(`   ⏭️  Skipped:   ${skipped}`);
  console.log(`   ❌ Errors:    ${errors}`);
  console.log(`   Total:      ${done + skipped + errors}/${totalFiles} files`);
  console.log(`   📁 Output:    ${OUT_DIR}`);
  console.log(`────────────────────────────────────\n`);

  if (errors > 0) {
    console.log("💡 Re-run to retry failed files (existing files are auto-skipped).\n");
  }
}

main().catch(console.error);
