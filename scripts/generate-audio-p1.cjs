// ═══════════════════════════════════════════════════════════
// generate-audio-p1.cjs
// Generates all Part 1 audio files via ElevenLabs API
// 
// Usage:
//   ELEVENLABS_API_KEY=sk_xxxxxxx node scripts/generate-audio-p1.cjs
//
// Or set the env var in your shell first:
//   $env:ELEVENLABS_API_KEY="sk_xxxxxxx"   (PowerShell)
//   export ELEVENLABS_API_KEY=sk_xxxxxxx    (bash)
//   node scripts/generate-audio-p1.cjs
//
// Output: public/audio/p1/p1_XX_Y.mp3
// ═══════════════════════════════════════════════════════════

const fs = require("fs");
const path = require("path");

const API_KEY = process.env.ELEVENLABS_API_KEY;
if (!API_KEY) {
  console.error("❌ Missing ELEVENLABS_API_KEY environment variable.");
  console.error("   Usage: ELEVENLABS_API_KEY=sk_xxx node scripts/generate-audio-p1.cjs");
  process.exit(1);
}

// ── Voice config ──
// Change voice ID here if you want a different speaker
// See https://api.elevenlabs.io/v1/voices for your available voices
const VOICE_ID = "EXAVITQu4vr4xnSDxMaL"; // Sarah (US female, clear & neutral)
const MODEL_ID = "eleven_multilingual_v2";
const VOICE_SETTINGS = {
  stability: 0.55,
  similarity_boost: 0.75,
  speed: 0.85, // Slightly slow — TOEIC pace
};

// ── Output directory ──
const OUT_DIR = path.join(__dirname, "..", "public", "audio", "p1");

// ── All statements to generate ──
const STATEMENTS = [
  // p1_25: Laundromat
  { file: "p1_25_0", text: "A. A woman is folding clothes on a table." },
  { file: "p1_25_1", text: "B. A customer is watching the machines operate." },
  { file: "p1_25_2", text: "C. A person is reaching into a washing machine." },
  { file: "p1_25_3", text: "D. Someone is pushing a cart through the laundry." },

  // p1_26: Welder
  { file: "p1_26_0", text: "A. A construction worker is putting on a hard hat." },
  { file: "p1_26_1", text: "B. A worker is welding a piece of metal." },
  { file: "p1_26_2", text: "C. A man is inspecting equipment in a warehouse." },
  { file: "p1_26_3", text: "D. A mechanic is repairing a vehicle." },

  // p1_27: Sandwiches & fries
  { file: "p1_27_0", text: "A. Sandwiches and fries have been arranged on a tray." },
  { file: "p1_27_1", text: "B. A customer is eating a meal at a restaurant." },
  { file: "p1_27_2", text: "C. Beverages are being poured into glasses." },
  { file: "p1_27_3", text: "D. A chef is preparing food in the kitchen." },

  // p1_28: Woman taking photo
  { file: "p1_28_0", text: "A. A woman is being photographed on a rooftop." },
  { file: "p1_28_1", text: "B. A tourist is sitting at an outdoor café." },
  { file: "p1_28_2", text: "C. A woman is putting on a hat." },
  { file: "p1_28_3", text: "D. A woman is taking a photograph from a balcony." },

  // p1_29: Penguins
  { file: "p1_29_0", text: "A. Some penguins are swimming in the ocean." },
  { file: "p1_29_1", text: "B. A woman is sitting on rocks near some penguins." },
  { file: "p1_29_2", text: "C. A woman is walking along a sandy beach." },
  { file: "p1_29_3", text: "D. A visitor is feeding birds at a wildlife park." },

  // p1_30: Eggs on boards
  { file: "p1_30_0", text: "A. A cook is preparing breakfast in a kitchen." },
  { file: "p1_30_1", text: "B. Vegetables are being chopped on a cutting board." },
  { file: "p1_30_2", text: "C. A meal has been laid out on wooden boards." },
  { file: "p1_30_3", text: "D. Eggs are being fried in a pan." },

  // p1_31: Worker cleaning car
  { file: "p1_31_0", text: "A. A worker is cleaning the interior of a car." },
  { file: "p1_31_1", text: "B. A mechanic is repairing an engine." },
  { file: "p1_31_2", text: "C. A man is driving a car out of a garage." },
  { file: "p1_31_3", text: "D. Someone is closing a car door." },

  // p1_32: Boy washing car
  { file: "p1_32_0", text: "A. A boy is looking through a car window." },
  { file: "p1_32_1", text: "B. A child is playing with water in a garden." },
  { file: "p1_32_2", text: "C. A boy is washing a car with a sponge." },
  { file: "p1_32_3", text: "D. A man is getting out of a parked car." },

  // p1_33: Lecture hall
  { file: "p1_33_0", text: "A. A small group of people is having a discussion." },
  { file: "p1_33_1", text: "B. An empty auditorium is being prepared for an event." },
  { file: "p1_33_2", text: "C. Students are lining up outside a building." },
  { file: "p1_33_3", text: "D. A lecture is being given in a large auditorium." },

  // p1_34: Scaffolding
  { file: "p1_34_0", text: "A. Workers are climbing on scaffolding at a construction site." },
  { file: "p1_34_1", text: "B. People are standing on a rooftop." },
  { file: "p1_34_2", text: "C. Metal scaffolding is being assembled by workers." },
  { file: "p1_34_3", text: "D. A group of workers is digging at ground level." },

  // p1_35: Painting wall
  { file: "p1_35_0", text: "A. A woman is using a roller to paint a ceiling." },
  { file: "p1_35_1", text: "B. A woman is painting a wall next to a ladder." },
  { file: "p1_35_2", text: "C. A person is climbing a ladder to reach a shelf." },
  { file: "p1_35_3", text: "D. Someone is hanging a picture on a wall." },

  // p1_36: Two women with laptops
  { file: "p1_36_0", text: "A. A woman is working alone at her desk." },
  { file: "p1_36_1", text: "B. Two colleagues are standing near a window." },
  { file: "p1_36_2", text: "C. Two women are having a meeting with their laptops." },
  { file: "p1_36_3", text: "D. A group is writing on a whiteboard." },

  // p1_37: Marina
  { file: "p1_37_0", text: "A. Several boats are sailing across the water." },
  { file: "p1_37_1", text: "B. People are fishing from a wooden pier." },
  { file: "p1_37_2", text: "C. A dock is being constructed near the shore." },
  { file: "p1_37_3", text: "D. Boats are tied up along a pier in a marina." },

  // p1_38: Cashier
  { file: "p1_38_0", text: "A. A cashier is bagging items for a customer." },
  { file: "p1_38_1", text: "B. A shopper is browsing products on a shelf." },
  { file: "p1_38_2", text: "C. A store employee is stocking shelves." },
  { file: "p1_38_3", text: "D. A customer is paying with cash at the register." },

  // p1_39: Crossing street
  { file: "p1_39_0", text: "A. A woman is waiting for the traffic light to change." },
  { file: "p1_39_1", text: "B. A pedestrian is crossing the street while looking at her phone." },
  { file: "p1_39_2", text: "C. A woman is talking on the phone next to her car." },
  { file: "p1_39_3", text: "D. People are waiting at a bus stop." },

  // p1_40: Disembarking plane
  { file: "p1_40_0", text: "A. Passengers are boarding an aircraft." },
  { file: "p1_40_1", text: "B. People are walking through a jet bridge." },
  { file: "p1_40_2", text: "C. Passengers are getting off a plane using stairs." },
  { file: "p1_40_3", text: "D. Travelers are waiting inside a terminal." },

  // p1_41: Plane at gate
  { file: "p1_41_0", text: "A. An airplane is parked at the gate." },
  { file: "p1_41_1", text: "B. A plane is taking off from the runway." },
  { file: "p1_41_2", text: "C. An aircraft is taxiing on the runway." },
  { file: "p1_41_3", text: "D. A jet bridge is being connected to the aircraft." },

  // p1_42: Woman in terminal
  { file: "p1_42_0", text: "A. A woman is standing in a queue at the airport." },
  { file: "p1_42_1", text: "B. A traveler is checking in at the counter." },
  { file: "p1_42_2", text: "C. A passenger is reading a book in a waiting area." },
  { file: "p1_42_3", text: "D. A woman is sitting in an airport terminal holding her passport." },

  // p1_43: Baggage carousel
  { file: "p1_43_0", text: "A. A traveler is picking up luggage from the carousel." },
  { file: "p1_43_1", text: "B. A suitcase is moving along a baggage carousel." },
  { file: "p1_43_2", text: "C. Luggage is being loaded onto an airplane." },
  { file: "p1_43_3", text: "D. Rows of suitcases are lined up in a storage area." },
];

// ── API call ──
async function generateAudio(text, outputPath) {
  const res = await fetch(
    `https://api.elevenlabs.io/v1/text-to-speech/${VOICE_ID}`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "xi-api-key": API_KEY,
      },
      body: JSON.stringify({
        text: text,
        model_id: MODEL_ID,
        voice_settings: VOICE_SETTINGS,
      }),
    }
  );

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`API ${res.status}: ${err}`);
  }

  const buffer = Buffer.from(await res.arrayBuffer());
  fs.writeFileSync(outputPath, buffer);
  return buffer.length;
}

// ── Delay helper (respect rate limits) ──
function wait(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

// ── Main ──
async function main() {
  // Create output directory
  fs.mkdirSync(OUT_DIR, { recursive: true });

  console.log(`\n🎙️  Part 1 Audio Generator — ElevenLabs`);
  console.log(`   Voice: ${VOICE_ID} | Model: ${MODEL_ID}`);
  console.log(`   Output: ${OUT_DIR}`);
  console.log(`   Statements: ${STATEMENTS.length}\n`);

  let done = 0;
  let skipped = 0;
  let errors = 0;

  for (const stmt of STATEMENTS) {
    const outPath = path.join(OUT_DIR, stmt.file + ".mp3");

    // Skip if file already exists (resume support)
    if (fs.existsSync(outPath)) {
      const size = fs.statSync(outPath).size;
      if (size > 1000) {
        // File exists and looks valid (>1KB)
        console.log(`   ⏭️  ${stmt.file}.mp3 (already exists, ${(size / 1024).toFixed(1)}KB)`);
        skipped++;
        continue;
      }
    }

    try {
      const size = await generateAudio(stmt.text, outPath);
      done++;
      console.log(`   ✅ ${stmt.file}.mp3 (${(size / 1024).toFixed(1)}KB) — "${stmt.text.substring(0, 50)}..."`);

      // Rate limiting: wait 500ms between calls to avoid 429s
      await wait(500);
    } catch (e) {
      errors++;
      console.error(`   ❌ ${stmt.file}.mp3 — ${e.message}`);

      // If rate limited, wait longer and retry once
      if (e.message.includes("429")) {
        console.log("   ⏳ Rate limited, waiting 10s...");
        await wait(10000);
        try {
          const size = await generateAudio(stmt.text, outPath);
          done++;
          errors--;
          console.log(`   ✅ ${stmt.file}.mp3 (retry OK, ${(size / 1024).toFixed(1)}KB)`);
        } catch (e2) {
          console.error(`   ❌ ${stmt.file}.mp3 — retry failed: ${e2.message}`);
        }
      }
    }
  }

  console.log(`\n────────────────────────────────────`);
  console.log(`   ✅ Generated: ${done}`);
  console.log(`   ⏭️  Skipped:   ${skipped}`);
  console.log(`   ❌ Errors:    ${errors}`);
  console.log(`   📁 Output:    ${OUT_DIR}`);
  console.log(`────────────────────────────────────\n`);

  if (errors > 0) {
    console.log("💡 Re-run the script to retry failed files (existing files are skipped).\n");
  }
}

main().catch(console.error);
