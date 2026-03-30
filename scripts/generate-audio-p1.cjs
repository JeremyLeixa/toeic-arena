// ═══════════════════════════════════════════════════════════
// generate-audio-p1.cjs
// Generates Part 1 audio files via ElevenLabs API
// Resume-safe: skips files that already exist (>1KB)
//
// Usage (PowerShell):
//   $env:ELEVENLABS_API_KEY="sk_xxxxxxx"
//   node scripts/generate-audio-p1.cjs
//
// Usage (bash):
//   ELEVENLABS_API_KEY=sk_xxxxxxx node scripts/generate-audio-p1.cjs
//
// Output: public/audio/p1/{id}_{0-3}.mp3
// ═══════════════════════════════════════════════════════════

const fs = require("fs");
const path = require("path");

const API_KEY = process.env.ELEVENLABS_API_KEY;
if (!API_KEY) {
  console.error("\u274C Missing ELEVENLABS_API_KEY environment variable.");
  process.exit(1);
}

// ── Voice: Sarah (US female) — same as previous P1 generation ──
const VOICE_ID = "EXAVITQu4vr4xnSDxMaL";
const MODEL_ID = "eleven_multilingual_v2";
const VOICE_SETTINGS = { stability: 0.5, similarity_boost: 0.75, speed: 0.92 };
const DELAY_MS = 600;

const OUT_DIR = path.join(__dirname, "..", "public", "audio", "p1");

// ═══════════════════════════════════════════════════════════
// ALL 43 Part 1 items — 4 options each = 172 files total
// Script will skip any file that already exists
// ═══════════════════════════════════════════════════════════

const ITEMS = [
  {id:"p1_01", opts:[
    "The woman is typing an email on her laptop.",
    "The woman is talking on the phone at her desk.",
    "The woman is reading a document next to her computer.",
    "The woman is turning off her laptop."]},
  {id:"p1_02", opts:[
    "The passenger is handing a ticket to the agent.",
    "The agent is handing a document to the passenger.",
    "The passenger is picking up his luggage.",
    "The departures board is being updated."]},
  {id:"p1_03", opts:[
    "The workers are eating lunch at a table.",
    "A safety helmet has been placed on the table.",
    "The men are constructing a building.",
    "The blueprints are being rolled up."]},
  {id:"p1_04", opts:[
    "The students are leaving the classroom.",
    "The teacher is writing on the chalkboard.",
    "Several students are raising their hands.",
    "The desks are being arranged in a circle."]},
  {id:"p1_05", opts:[
    "A small boat is passing near a cargo ship.",
    "The containers are being unloaded onto trucks.",
    "The ship is sailing in open water.",
    "Workers are standing on top of the containers."]},
  {id:"p1_06", opts:[
    "The patient is standing up from the wheelchair.",
    "The doctor is writing a prescription.",
    "A healthcare worker is speaking with a patient in a wheelchair.",
    "The patient is being examined on a bed."]},
  {id:"p1_07", opts:[
    "The man is repairing the vehicle's engine.",
    "The man is seated in the cab of a large vehicle.",
    "The man is loading cargo onto a truck.",
    "The vehicle is parked inside a garage."]},
  {id:"p1_08", opts:[
    "Workers are packing ice cream cones into boxes.",
    "Machines are dispensing ice cream into cones on a production line.",
    "The cones are being arranged by hand on a tray.",
    "The factory equipment is being cleaned."]},
  {id:"p1_09", opts:[
    "The woman is cleaning laboratory equipment.",
    "A researcher is using a pipette in a laboratory.",
    "The scientists are having a discussion.",
    "The woman is looking through a microscope."]},
  {id:"p1_10", opts:[
    "The woman is reading a book on a bench.",
    "The woman is having a video call on her laptop.",
    "The woman is typing on a laptop while sitting on a bench.",
    "The laptop screen is turned off."]},
  {id:"p1_11", opts:[
    "The mechanic is washing the car.",
    "A man is using a laptop next to a vehicle with its hood open.",
    "The car is being loaded onto a truck.",
    "The man is closing the hood of the car."]},
  {id:"p1_12", opts:[
    "The workers are climbing down a ladder.",
    "Two workers are assembling a steel structure.",
    "The men are painting a metal beam.",
    "Construction equipment is being unloaded."]},
  {id:"p1_13", opts:[
    "A man is playing a guitar on stage.",
    "Several guitars are displayed in a shop window.",
    "A craftsman is building a guitar in his workshop.",
    "The instruments are being packed into cases."]},
  {id:"p1_14", opts:[
    "The colleagues appear exhausted at their desks.",
    "The team is celebrating a successful project.",
    "The workers are arriving at the office.",
    "Documents are being filed into cabinets."]},
  {id:"p1_15", opts:[
    "The woman is boarding an airplane.",
    "A traveler is checking her phone at the gate.",
    "A woman is reading a book in an airport terminal.",
    "The passenger is collecting her luggage."]},
  {id:"p1_16", opts:[
    "The officer is checking the man's passport.",
    "A security officer is screening a passenger.",
    "The man is putting on his jacket.",
    "The officer is handing a boarding pass to the traveler."]},
  {id:"p1_17", opts:[
    "A person is signing a document with a pen.",
    "The papers are being placed into an envelope.",
    "A woman is reading a newspaper.",
    "The document is being printed."]},
  {id:"p1_18", opts:[
    "The workers are removing solar panels from a roof.",
    "Two technicians are installing solar panels.",
    "A man is repairing the roof tiles.",
    "The ladder is being carried to the building."]},
  {id:"p1_19", opts:[
    "The shelves in the warehouse are empty.",
    "A worker is stacking boxes on a high shelf.",
    "A man is holding a package in a storage area.",
    "The boxes are being loaded onto a delivery truck."]},
  {id:"p1_20", opts:[
    "The employee is stocking shelves with fruit.",
    "A customer is selecting produce at a market.",
    "A store worker is carrying a box in the grocery section.",
    "The man is cleaning the floor of the shop."]},
  {id:"p1_21", opts:[
    "The group is posing for a photograph.",
    "Several people are gathered around a laptop screen.",
    "The team is having lunch together.",
    "A woman is giving a presentation to her colleagues."]},
  {id:"p1_22", opts:[
    "People are swimming in a canal.",
    "Boats are moored along a waterway between buildings.",
    "A bridge is being constructed over the water.",
    "Cars are parked along the street next to the canal."]},
  {id:"p1_23", opts:[
    "People are sitting on the benches in the park.",
    "The snow is being cleared from the pathway.",
    "Benches are covered with snow in a park.",
    "Children are playing in the snow."]},
  {id:"p1_24", opts:[
    "A person is writing in a planner next to a mobile phone.",
    "The woman is sending a text message on her phone.",
    "A notebook is being closed and put away.",
    "The person is drawing a picture in a sketchbook."]},
  {id:"p1_25", opts:[
    "A woman is folding clothes on a table.",
    "A customer is watching the machines operate.",
    "A person is reaching into a washing machine.",
    "Someone is pushing a cart through the laundry."]},
  {id:"p1_26", opts:[
    "A construction worker is putting on a hard hat.",
    "A worker is welding a piece of metal.",
    "A man is inspecting equipment in a warehouse.",
    "A mechanic is repairing a vehicle."]},
  {id:"p1_27", opts:[
    "Sandwiches and fries have been arranged on a tray.",
    "A customer is eating a meal at a restaurant.",
    "Beverages are being poured into glasses.",
    "A chef is preparing food in the kitchen."]},
  {id:"p1_28", opts:[
    "A woman is being photographed on a rooftop.",
    "A tourist is sitting at an outdoor caf\u00e9.",
    "A woman is putting on a hat.",
    "A woman is taking a photograph from a balcony."]},
  {id:"p1_29", opts:[
    "Some penguins are swimming in the ocean.",
    "A woman is sitting on rocks near some penguins.",
    "A woman is walking along a sandy beach.",
    "A visitor is feeding birds at a wildlife park."]},
  {id:"p1_30", opts:[
    "A cook is preparing breakfast in a kitchen.",
    "Vegetables are being chopped on a cutting board.",
    "A meal has been laid out on wooden boards.",
    "Eggs are being fried in a pan."]},
  {id:"p1_31", opts:[
    "A worker is cleaning the interior of a car.",
    "A mechanic is repairing an engine.",
    "A man is driving a car out of a garage.",
    "Someone is closing a car door."]},
  {id:"p1_32", opts:[
    "A boy is looking through a car window.",
    "A child is playing with water in a garden.",
    "A boy is washing a car with a sponge.",
    "A man is getting out of a parked car."]},
  {id:"p1_33", opts:[
    "A small group of people is having a discussion.",
    "An empty auditorium is being prepared for an event.",
    "Students are lining up outside a building.",
    "A lecture is being given in a large auditorium."]},
  {id:"p1_34", opts:[
    "Workers are climbing on scaffolding at a construction site.",
    "People are standing on a rooftop.",
    "Metal scaffolding is being assembled by workers.",
    "A group of workers is digging at ground level."]},
  {id:"p1_35", opts:[
    "A woman is using a roller to paint a ceiling.",
    "A woman is painting a wall next to a ladder.",
    "A person is climbing a ladder to reach a shelf.",
    "Someone is hanging a picture on a wall."]},
  {id:"p1_36", opts:[
    "A woman is working alone at her desk.",
    "Two colleagues are standing near a window.",
    "Two women are having a meeting with their laptops.",
    "A group is writing on a whiteboard."]},
  {id:"p1_37", opts:[
    "Several boats are sailing across the water.",
    "People are fishing from a wooden pier.",
    "A dock is being constructed near the shore.",
    "Boats are tied up along a pier in a marina."]},
  {id:"p1_38", opts:[
    "A cashier is bagging items for a customer.",
    "A shopper is browsing products on a shelf.",
    "A store employee is stocking shelves.",
    "A customer is paying with cash at the register."]},
  {id:"p1_39", opts:[
    "A woman is waiting for the traffic light to change.",
    "A pedestrian is crossing the street while looking at her phone.",
    "A woman is talking on the phone next to her car.",
    "People are waiting at a bus stop."]},
  {id:"p1_40", opts:[
    "Passengers are boarding an aircraft.",
    "People are walking through a jet bridge.",
    "Passengers are getting off a plane using stairs.",
    "Travelers are waiting inside a terminal."]},
  {id:"p1_41", opts:[
    "An airplane is parked at the gate.",
    "A plane is taking off from the runway.",
    "An aircraft is taxiing on the runway.",
    "A jet bridge is being connected to the aircraft."]},
  {id:"p1_42", opts:[
    "A woman is standing in a queue at the airport.",
    "A traveler is checking in at the counter.",
    "A passenger is reading a book in a waiting area.",
    "A woman is sitting in an airport terminal holding her passport."]},
  {id:"p1_43", opts:[
    "A traveler is picking up luggage from the carousel.",
    "A suitcase is moving along a baggage carousel.",
    "Luggage is being loaded onto an airplane.",
    "Rows of suitcases are lined up in a storage area."]},
];

// ═══════════════════════════════════════════════════════════

async function generateAudio(text, outputPath) {
  const dir = path.dirname(outputPath);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

  // Resume support: skip existing files > 1KB
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

async function main() {
  console.log("\n\u2550\u2550\u2550 TOEIC Arena \u2014 Part 1 Audio Generation \u2550\u2550\u2550\n");
  console.log(`Voice: Sarah (${VOICE_ID})`);
  console.log(`Model: ${MODEL_ID}`);
  console.log(`Output: ${OUT_DIR}\n`);

  let done = 0, skipped = 0, errors = 0;
  const totalFiles = ITEMS.length * 4;

  for (let i = 0; i < ITEMS.length; i++) {
    const item = ITEMS[i];
    console.log(`[${i + 1}/${ITEMS.length}] ${item.id}`);

    for (let j = 0; j < item.opts.length; j++) {
      const filename = `${item.id}_${j}.mp3`;
      const outPath = path.join(OUT_DIR, filename);

      try {
        const result = await generateAudio(item.opts[j], outPath);
        if (result === "skip") {
          skipped++;
          console.log(`   \u23ED\uFE0F  ${filename} (exists)`);
        } else {
          done++;
          console.log(`   \u2705 ${filename} (${(result / 1024).toFixed(1)}KB)`);
          await wait(DELAY_MS);
        }
      } catch (e) {
        errors++;
        console.error(`   \u274C ${filename} \u2014 ${e.message}`);
        if (e.message.includes("429")) {
          console.log("   \u23F3 Rate limited, waiting 15s...");
          await wait(15000);
          // Retry once
          try {
            const result = await generateAudio(item.opts[j], outPath);
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
  console.log(`   Total:      ${done + skipped + errors}/${totalFiles}`);
  console.log(`   \uD83D\uDCC1 Output:    ${OUT_DIR}`);
  console.log(`\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\n`);

  if (errors > 0) {
    console.log("\uD83D\uDCA1 Re-run the script to retry failed files (existing files are auto-skipped).\n");
  }
}

main().catch(console.error);
