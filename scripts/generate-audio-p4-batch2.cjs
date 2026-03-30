// ═══════════════════════════════════════════════════════════
// generate-audio-p4-batch2.cjs
// Generates Part 4 talks p4_21 → p4_30 (10 monologues)
// Resume-safe: skips files that already exist (>1KB)
//
// Usage (PowerShell):
//   $env:ELEVENLABS_API_KEY="sk_xxxxxxx"
//   node scripts/generate-audio-p4-batch2.cjs
//
// Output: public/audio/p4/{id}.mp3
// ═══════════════════════════════════════════════════════════

const fs = require("fs");
const path = require("path");

const API_KEY = process.env.ELEVENLABS_API_KEY;
if (!API_KEY) {
  console.error("\u274C Missing ELEVENLABS_API_KEY environment variable.");
  process.exit(1);
}

// ── Voices — same as original P4 generation ──
const VOICES = {
  W: "EXAVITQu4vr4xnSDxMaL",  // Sarah (US female)
  M: "pqHfZKP75CvOlQylNhV4",  // Bill (US male)
};

const MODEL_ID = "eleven_multilingual_v2";
const VOICE_SETTINGS = { stability: 0.5, similarity_boost: 0.75, speed: 0.92 };
const DELAY_MS = 800; // Slightly longer delay — longer texts = more processing

const OUT_DIR = path.join(__dirname, "..", "public", "audio", "p4");

// ═══════════════════════════════════════════════════════════
// 10 NEW Part 4 talks (p4_21 → p4_30)
// ═══════════════════════════════════════════════════════════

const TALKS = [
  {id:"p4_21", voice:"W",
    text:"Hi, this is Angela from Westfield Insurance. I'm calling regarding your claim for the water damage in your office. I've reviewed the assessment report, and we can cover the repairs up to eighteen thousand dollars. However, the replacement of electronic equipment will require separate authorization. Could you send me a list of the damaged devices along with their purchase receipts? You can email them to claims@westfieldinsurance.com or fax them to 555-0241. I'll need those by next Friday to process the claim before the end of the quarter."},

  {id:"p4_22", voice:"M",
    text:"In local business news, the city council has approved a twenty-five-million-dollar plan to redevelop the waterfront district. The project, which is expected to take three years to complete, will include a new conference center, a public park, and a mixed-use commercial space with shops and restaurants. Construction is set to begin in September. Mayor Reeves said the redevelopment will create an estimated 800 permanent jobs and attract over a million visitors per year to the area."},

  {id:"p4_23", voice:"W",
    text:"Now that everyone has logged in to the new customer management system, let me walk you through the main features. On the left side of your screen, you'll see the client directory. You can search by name, company, or account number. When you open a client profile, their entire history — including calls, emails, and past orders — appears in the center panel. To add a note after a phone call, click the blue plus icon at the top right. It's important that every interaction is logged within 24 hours. Any questions so far?"},

  {id:"p4_24", voice:"M",
    text:"Attention all employees. Due to essential maintenance work on the building's electrical system, there will be a planned power outage this Sunday from 8 AM to 2 PM. All computers and sensitive equipment should be shut down and unplugged before leaving on Friday evening. The backup generators will provide emergency lighting during the outage, but elevators will not be operational. If you need to access the building on Sunday, please use the stairwells and bring a flashlight. Normal operations will resume on Monday morning."},

  {id:"p4_25", voice:"W",
    text:"As we enter the east wing, you'll notice this gallery is devoted entirely to Impressionist paintings from the late nineteenth century. The collection was donated by the Harrison family in 1987 and includes works by several well-known French artists. The highlight of this room is the large landscape on the far wall, which was painted in 1893. Please note that this wing will close thirty minutes before the rest of the museum. Audio guides are available for rent at the information desk near the entrance for five dollars each."},

  {id:"p4_26", voice:"M",
    text:"Tired of spending hours on payroll every month? Let SmartPay handle it for you. SmartPay is an automated payroll service designed for small and medium-sized businesses. We calculate taxes, process direct deposits, and generate year-end reports — all for a flat fee of $99 per month for up to fifty employees. Setup takes less than ten minutes, and our support team is available seven days a week. Visit smartpay.com and use the code SAVE20 to get your first three months at half price."},

  {id:"p4_27", voice:"W",
    text:"Thank you for calling Clearview Medical Center. Our office hours are Monday through Friday, 8 AM to 6 PM, and Saturday from 9 AM to 1 PM. We are closed on Sundays and public holidays. If this is a medical emergency, please hang up and dial 911. To make or change an appointment, press 1. To request a prescription refill, press 2. To speak to the billing department, press 3. To hear these options again, press the star key. Please note that wait times may be longer than usual due to high call volume."},

  {id:"p4_28", voice:"M",
    text:"I'm pleased to report that our customer retention rate has risen to 92 percent this year, up from 87 percent last year. This is largely thanks to the new loyalty program we launched in March, which now has over ten thousand active members. Our survey data shows that response time and product quality are the two factors customers value most. Looking ahead, we plan to introduce a premium membership tier in January that will include priority support and exclusive discounts. I'd like to thank the entire customer service team for their outstanding work this year."},

  {id:"p4_29", voice:"W",
    text:"Before we start the test, let me go over the examination rules. You have exactly 90 minutes to complete all sections. Please write your answers on the answer sheet using a number 2 pencil only. Pens and mechanical pencils are not accepted. Electronic devices, including phones and smartwatches, must be turned off and placed in the bag at the front of the room. You may not leave the room during the first 30 minutes. If you finish early, you may review your answers but please remain seated until the proctor collects your materials."},

  {id:"p4_30", voice:"M",
    text:"Good evening, and welcome to the twenty-third annual Hospitality Excellence Awards. We have over 400 guests here tonight, representing the finest hotels, restaurants, and travel companies in the region. This year, we received a record-breaking 250 nominations across 12 categories. I'd like to begin by recognizing our platinum sponsor, Pacific Coast Hotels, for their generous support. Before we present the awards, please enjoy a short video highlighting the achievements of this year's finalists. The first award tonight is for Outstanding Customer Experience."},
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
  console.log("\n\u2550\u2550\u2550 TOEIC Arena \u2014 Part 4 Batch 2 (p4_21\u2192p4_30) \u2550\u2550\u2550\n");
  console.log(`Voices: Sarah (W) + Bill (M)`);
  console.log(`Model: ${MODEL_ID}`);
  console.log(`Output: ${OUT_DIR}\n`);

  let done = 0, skipped = 0, errors = 0;

  for (let i = 0; i < TALKS.length; i++) {
    const talk = TALKS[i];
    const filename = `${talk.id}.mp3`;
    const outPath = path.join(OUT_DIR, filename);
    const voiceId = VOICES[talk.voice];

    try {
      const result = await generateAudio(talk.text, voiceId, outPath);
      if (result === "skip") {
        skipped++;
        console.log(`[${i + 1}/${TALKS.length}] \u23ED\uFE0F  ${talk.id} (exists)`);
      } else {
        done++;
        console.log(`[${i + 1}/${TALKS.length}] \u2705 ${talk.id} (${talk.voice}) \u2014 ${(result / 1024).toFixed(1)}KB`);
        await wait(DELAY_MS);
      }
    } catch (e) {
      errors++;
      console.error(`[${i + 1}/${TALKS.length}] \u274C ${talk.id} \u2014 ${e.message}`);
      if (e.message.includes("429")) {
        console.log("   \u23F3 Rate limited, waiting 15s...");
        await wait(15000);
        try {
          const result = await generateAudio(talk.text, voiceId, outPath);
          if (result !== "skip") {
            done++; errors--;
            console.log(`   \u2705 ${talk.id} (retry OK)`);
          }
        } catch (e2) {
          console.error(`   \u274C ${talk.id} \u2014 retry failed: ${e2.message}`);
        }
      }
    }
  }

  console.log(`\n\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500`);
  console.log(`   \u2705 Generated: ${done}`);
  console.log(`   \u23ED\uFE0F  Skipped:   ${skipped}`);
  console.log(`   \u274C Errors:    ${errors}`);
  console.log(`   Total:      ${done + skipped + errors}/${TALKS.length} talks`);
  console.log(`   \uD83D\uDCC1 Output:    ${OUT_DIR}`);
  console.log(`\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\n`);

  if (errors > 0) {
    console.log("\uD83D\uDCA1 Re-run to retry failed files (existing files are auto-skipped).\n");
  }
}

main().catch(console.error);
