// ═══════════════════════════════════════════
// generate-audio.js
// ═══════════════════════════════════════════
// 
// Usage:
//   1. Ajoute ELEVENLABS_API_KEY dans ton .env
//   2. node scripts/generate-audio.js
//   3. Les MP3 sont créés dans public/audio/p1/ et public/audio/p2/
//
// Temps estimé: ~10 min pour tout générer (296 fichiers)
// Coût estimé: ~15,000 caractères ≈ faible sur le quota Starter
//

const fs = require('fs');
const path = require('path');
require('dotenv').config();

const API_KEY = process.env.ELEVENLABS_API_KEY;
if (!API_KEY) {
  console.error('❌ Missing ELEVENLABS_API_KEY in .env');
  process.exit(1);
}

// Voice IDs — change these if you prefer different voices
const VOICES = {
  us_female: 'EXAVITQu4vr4xnSDxMaL',   // Sarah
  us_male: 'pqHfZKP75CvOlQylNhV4',      // Bill
  uk_female: 'Xb7hH8MSUJpSbSDYk0k2',    // Charlotte
};

// ─── PART 2 DATA (50 questions) ───
const P2_DATA = [
  {id:"l2a",q:"When is the budget meeting scheduled?",opts:["It's on Thursday at 2 PM.","Yes, I like the schedule.","The budget was approved."]},
  {id:"l2b",q:"Who's responsible for the marketing campaign?",opts:["It was very successful.","Ms. Rivera is leading it.","We launched it last month."]},
  {id:"l2c",q:"Where did you put the quarterly report?",opts:["It's due next Friday.","About 30 pages long.","On your desk, next to the laptop."]},
  {id:"l2d",q:"Why was the delivery delayed?",opts:["It arrived this morning.","Because of a supplier issue.","Three boxes were missing."]},
  {id:"l2e",q:"How many copies do we need for the presentation?",opts:["The presentation went well.","About twenty-five should be enough.","It starts at 10 AM."]},
  {id:"l2f",q:"Would you like to join us for lunch?",opts:["The restaurant is nearby.","I already ate, but thanks.","Lunch is at noon."]},
  {id:"l2g",q:"Hasn't the new software been installed yet?",opts:["Yes, it's a new version.","The IT team is working on it now.","I prefer the old software."]},
  {id:"l2h",q:"Do you want the report in PDF or printed?",opts:["Yes, the report is ready.","PDF would be easier to share.","I wrote it yesterday."]},
  {id:"l2i",q:"The conference room is on the third floor, isn't it?",opts:["Actually, it was moved to the second floor.","The conference starts at 3.","Yes, I have the room key."]},
  {id:"l2j",q:"How should I send the contract to the client?",opts:["The client signed it already.","Email would be the fastest option.","It's a three-year contract."]},
  {id:"l2k",q:"Could you review this proposal before Friday?",opts:["The proposal was rejected.","Sure, I'll look at it tomorrow.","Friday is a holiday."]},
  {id:"l2l",q:"What time does the train to Manchester leave?",opts:["The platform number is 7.","Manchester is about two hours away.","The next one departs at 4:15."]},
  {id:"l2m",q:"Who should I contact about the office renovation?",opts:["The renovation will take three weeks.","Try the facilities manager, Mr. Chen.","The office looks much better now."]},
  {id:"l2n",q:"Why don't we postpone the meeting until next week?",opts:["That works better for everyone.","The meeting room is available.","We postponed it already."]},
  {id:"l2o",q:"Have you finished reviewing the applications?",opts:["There were over 50 applicants.","I still have a few more to go through.","The application deadline was Monday."]},
  {id:"l2p",q:"Where can I find the employee handbook?",opts:["It was updated last year.","Check the HR section of the intranet.","About 200 pages long."]},
  {id:"l2q",q:"When did the shipment arrive?",opts:["By express delivery.","It came in early this morning.","About 500 units."]},
  {id:"l2r",q:"How often do you meet with your supervisor?",opts:["In the meeting room upstairs.","She's been very helpful.","Every other Wednesday."]},
  {id:"l2s",q:"Don't you think we should hire more staff?",opts:["The staff meeting is at 3.","I've been thinking the same thing.","We hired someone last week."]},
  {id:"l2t",q:"Shall I book the restaurant for the team dinner?",opts:["The food was excellent.","That would be great, thanks.","We had dinner last Friday."]},
  {id:"l2u",q:"How about moving the deadline to next month?",opts:["The project is almost done.","I think that's a reasonable idea.","The deadline was yesterday."]},
  {id:"l2v",q:"Who approved the travel budget?",opts:["It was a business trip to Tokyo.","The finance director signed off on it.","The budget is quite generous."]},
  {id:"l2w",q:"Would you mind closing the window?",opts:["The window faces the parking lot.","Not at all, it is quite cold.","The office has six windows."]},
  {id:"l2x",q:"The new printer is much faster, isn't it?",opts:["It prints in color too.","Yes, it saves us a lot of time.","The printer is on the second floor."]},
  {id:"l2y",q:"Why hasn't the invoice been sent yet?",opts:["The invoice is for $3,500.","We're still waiting for final approval.","I'll send you a copy."]},
  {id:"l2z",q:"Should we take the elevator or the stairs?",opts:["Yes, the elevator is fast.","The stairs are good exercise.","It's on the fifth floor."]},
  {id:"l2aa",q:"What's the best way to get to the airport from here?",opts:["My flight leaves at 6 PM.","The express train takes about 30 minutes.","The airport was renovated recently."]},
  {id:"l2ab",q:"Could you forward me the meeting notes?",opts:["The meeting lasted two hours.","I'll email them to you right away.","There were 12 people at the meeting."]},
  {id:"l2ac",q:"Has the client confirmed the order yet?",opts:["It's a large order.","I'm still waiting to hear back.","The order shipped yesterday."]},
  {id:"l2ad",q:"Why don't we schedule the training for next Tuesday?",opts:["The training was very informative.","That works, I'll book the room.","It takes about three hours."]},
  {id:"l2ae",q:"Which department handles customer complaints?",opts:["We received five complaints this week.","Customer service on the fourth floor.","The complaint was resolved quickly."]},
  {id:"l2af",q:"You've already submitted the report, haven't you?",opts:["The report is 15 pages.","Actually, I still need to add the charts.","It's due by end of day."]},
  {id:"l2ag",q:"Where should I park when I visit the main office?",opts:["The office opens at 8 AM.","There's a visitor lot behind the building.","It's a 20-minute drive from here."]},
  {id:"l2ah",q:"Do you prefer the morning or afternoon session?",opts:["Yes, I've already registered.","The morning one fits my schedule better.","Each session is 90 minutes."]},
  {id:"l2ai",q:"I thought the deadline was extended.",opts:["No, it's still due this Friday.","The project is going well.","I'll meet the deadline."]},
  {id:"l2aj",q:"What did the director say about the proposal?",opts:["She wants us to revise the budget section.","The proposal was submitted online.","The director is traveling this week."]},
  {id:"l2ak",q:"Isn't the workshop supposed to start at 9?",opts:["It's been pushed back to 10.","The workshop covers project management.","I attended it last year."]},
  {id:"l2al",q:"How long will the renovation take?",opts:["The contractor said about six weeks.","The lobby looks much better now.","They're renovating the third floor."]},
  {id:"l2am",q:"Who's giving the keynote speech at the conference?",opts:["The conference is in Berlin this year.","A professor from Oxford University.","The speech was very inspiring."]},
  {id:"l2an",q:"Can I borrow your laptop charger?",opts:["Sure, it's in my bag.","The laptop is brand new.","I charged it this morning."]},
  {id:"l2ao",q:"We're running low on printer paper, aren't we?",opts:["I'll order more this afternoon.","The printer is working fine.","We switched to a new brand."]},
  {id:"l2ap",q:"What's the Wi-Fi password for the guest network?",opts:["The network is very fast.","It's 'welcome2025', all lowercase.","We upgraded the system last month."]},
  {id:"l2aq",q:"Should I contact the supplier directly?",opts:["The supplier is based in Germany.","It might be faster to go through our procurement team.","We've used them for three years."]},
  {id:"l2ar",q:"How was your business trip to Singapore?",opts:["I'm flying out on Monday.","Very productive — we signed two new contracts.","Singapore is about 12 hours by plane."]},
  {id:"l2as",q:"The quarterly figures look promising, don't they?",opts:["Revenue is up 15% from last quarter.","The report will be published next week.","I haven't had a chance to review them yet."]},
  {id:"l2at",q:"Where are the samples we ordered for the trade show?",opts:["The trade show starts next Thursday.","They should be in the storage room.","We ordered 200 samples."]},
  {id:"l2au",q:"Would you rather present first or second?",opts:["The presentation is ready.","I'd prefer to go second if that's OK.","It will take about 15 minutes."]},
  {id:"l2av",q:"Didn't the maintenance team fix the air conditioning?",opts:["They came yesterday but need a replacement part.","The air conditioning is on the roof.","It's much cooler today."]},
  {id:"l2aw",q:"What's on the agenda for this afternoon's meeting?",opts:["The budget review and the hiring plan.","The meeting room has been changed.","It should last about an hour."]},
  {id:"l2ax",q:"I don't think we have enough chairs for the workshop.",opts:["The workshop is about leadership skills.","I can bring a few more from the next room.","It starts at 2 PM."]},
];

// ─── PART 1 DATA (24 photos) ───
const P1_DATA = [
  {id:"l1_01",opts:["The woman is typing an email on her laptop.","The woman is talking on the phone at her desk.","The woman is reading a document next to her computer.","The woman is turning off her laptop."]},
  {id:"l1_02",opts:["The passenger is handing a ticket to the agent.","The agent is handing a document to the passenger.","The passenger is picking up his luggage.","The departures board is being updated."]},
  {id:"l1_03",opts:["The workers are eating lunch at a table.","A safety helmet has been placed on the table.","The men are constructing a building.","The blueprints are being rolled up."]},
  {id:"l1_04",opts:["The students are leaving the classroom.","The teacher is writing on the chalkboard.","Several students are raising their hands.","The desks are being arranged in a circle."]},
  {id:"l1_05",opts:["A small boat is passing near a cargo ship.","The containers are being unloaded onto trucks.","The ship is sailing in open water.","Workers are standing on top of the containers."]},
  {id:"l1_06",opts:["The patient is standing up from the wheelchair.","The doctor is writing a prescription.","A healthcare worker is speaking with a patient in a wheelchair.","The patient is being examined on a bed."]},
  {id:"l1_07",opts:["The man is repairing the vehicle's engine.","The man is seated in the cab of a large vehicle.","The man is loading cargo onto a truck.","The vehicle is parked inside a garage."]},
  {id:"l1_08",opts:["Workers are packing ice cream cones into boxes.","Machines are dispensing ice cream into cones on a production line.","The cones are being arranged by hand on a tray.","The factory equipment is being cleaned."]},
  {id:"l1_09",opts:["The woman is cleaning laboratory equipment.","A researcher is using a pipette in a laboratory.","The scientists are having a discussion.","The woman is looking through a microscope."]},
  {id:"l1_10",opts:["The woman is reading a book on a bench.","The woman is having a video call on her laptop.","The woman is typing on a laptop while sitting on a bench.","The laptop screen is turned off."]},
  {id:"l1_11",opts:["The mechanic is washing the car.","A man is using a laptop next to a vehicle with its hood open.","The car is being loaded onto a truck.","The man is closing the hood of the car."]},
  {id:"l1_12",opts:["The workers are climbing down a ladder.","Two workers are assembling a steel structure.","The men are painting a metal beam.","Construction equipment is being unloaded."]},
  {id:"l1_13",opts:["A man is playing a guitar on stage.","Several guitars are displayed in a shop window.","A craftsman is building a guitar in his workshop.","The instruments are being packed into cases."]},
  {id:"l1_14",opts:["The colleagues appear exhausted at their desks.","The team is celebrating a successful project.","The workers are arriving at the office.","Documents are being filed into cabinets."]},
  {id:"l1_15",opts:["The woman is boarding an airplane.","A traveler is checking her phone at the gate.","A woman is reading a book in an airport terminal.","The passenger is collecting her luggage."]},
  {id:"l1_16",opts:["The officer is checking the man's passport.","A security officer is screening a passenger.","The man is putting on his jacket.","The officer is handing a boarding pass to the traveler."]},
  {id:"l1_17",opts:["A person is signing a document with a pen.","The papers are being placed into an envelope.","A woman is reading a newspaper.","The document is being printed."]},
  {id:"l1_18",opts:["The workers are removing solar panels from a roof.","Two technicians are installing solar panels.","A man is repairing the roof tiles.","The ladder is being carried to the building."]},
  {id:"l1_19",opts:["The shelves in the warehouse are empty.","A worker is stacking boxes on a high shelf.","A man is holding a package in a storage area.","The boxes are being loaded onto a delivery truck."]},
  {id:"l1_20",opts:["The employee is stocking shelves with fruit.","A customer is selecting produce at a market.","A store worker is carrying a box in the grocery section.","The man is cleaning the floor of the shop."]},
  {id:"l1_21",opts:["The group is posing for a photograph.","Several people are gathered around a laptop screen.","The team is having lunch together.","A woman is giving a presentation to her colleagues."]},
  {id:"l1_22",opts:["People are swimming in a canal.","Boats are moored along a waterway between buildings.","A bridge is being constructed over the water.","Cars are parked along the street next to the canal."]},
  {id:"l1_23",opts:["People are sitting on the benches in the park.","The snow is being cleared from the pathway.","Benches are covered with snow in a park.","Children are playing in the snow."]},
  {id:"l1_24",opts:["A person is writing in a planner next to a mobile phone.","The woman is sending a text message on her phone.","A notebook is being closed and put away.","The person is drawing a picture in a sketchbook."]},
];

// ─── GENERATION ENGINE ───
const DELAY_MS = 500; // Delay between API calls to avoid rate limiting

async function generateAudio(text, voiceId, outputPath) {
  const dir = path.dirname(outputPath);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  
  // Skip if already generated
  if (fs.existsSync(outputPath)) {
    console.log(`  ⏭️  Already exists: ${path.basename(outputPath)}`);
    return;
  }

  const response = await fetch(
    `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'xi-api-key': API_KEY,
      },
      body: JSON.stringify({
        text: text,
        model_id: 'eleven_multilingual_v2',
        voice_settings: {
          stability: 0.5,
          similarity_boost: 0.75,
          speed: 0.92,
        },
      }),
    }
  );

  if (!response.ok) {
    const err = await response.text();
    console.error(`  ❌ Error for "${text.substring(0, 40)}...": ${err}`);
    return;
  }

  const buffer = Buffer.from(await response.arrayBuffer());
  fs.writeFileSync(outputPath, buffer);
  console.log(`  ✅ ${path.basename(outputPath)} (${(buffer.length / 1024).toFixed(1)} KB)`);
  
  // Rate limit delay
  await new Promise(r => setTimeout(r, DELAY_MS));
}

async function main() {
  console.log('═══════════════════════════════════════');
  console.log('  TOEIC Arena — Audio Generation');
  console.log('═══════════════════════════════════════\n');

  const baseDir = path.join(__dirname, '..', 'public', 'audio');

  // ─── Part 2: Question-Response ───
  console.log('📢 Part 2 — Question-Response');
  console.log(`   ${P2_DATA.length} questions × 4 audio files = ${P2_DATA.length * 4} files\n`);

  for (let i = 0; i < P2_DATA.length; i++) {
    const q = P2_DATA[i];
    console.log(`\n[${i + 1}/${P2_DATA.length}] ${q.id}: "${q.q.substring(0, 50)}..."`);

    // Question — use female voice
    await generateAudio(q.q, VOICES.us_female, path.join(baseDir, 'p2', `${q.id}_q.mp3`));

    // Options A, B, C — use male voice for variety
    for (let j = 0; j < q.opts.length; j++) {
      const letter = String.fromCharCode(65 + j);
      await generateAudio(
        `${letter}. ${q.opts[j]}`,
        VOICES.us_male,
        path.join(baseDir, 'p2', `${q.id}_${j}.mp3`)
      );
    }
  }

  // ─── Part 1: Photographs ───
  console.log('\n\n📷 Part 1 — Photographs');
  console.log(`   ${P1_DATA.length} photos × 4 audio files = ${P1_DATA.length * 4} files\n`);

  for (let i = 0; i < P1_DATA.length; i++) {
    const p = P1_DATA[i];
    console.log(`\n[${i + 1}/${P1_DATA.length}] ${p.id}`);

    // 4 statements — alternate voices for variety
    for (let j = 0; j < p.opts.length; j++) {
      const letter = String.fromCharCode(65 + j);
      const voice = j % 2 === 0 ? VOICES.us_female : VOICES.us_male;
      await generateAudio(
        `${letter}. ${p.opts[j]}`,
        voice,
        path.join(baseDir, 'p1', `${p.id}_${j}.mp3`)
      );
    }
  }

  // ─── Summary ───
  const p2Count = fs.readdirSync(path.join(baseDir, 'p2')).filter(f => f.endsWith('.mp3')).length;
  const p1Count = fs.readdirSync(path.join(baseDir, 'p1')).filter(f => f.endsWith('.mp3')).length;

  console.log('\n\n═══════════════════════════════════════');
  console.log('  ✅ Generation complete!');
  console.log(`  Part 2: ${p2Count} files`);
  console.log(`  Part 1: ${p1Count} files`);
  console.log('═══════════════════════════════════════');
  console.log('\nFiles saved in public/audio/');
  console.log('Run "git add . && git commit -m \\"add audio\\" && git push" to deploy.');
}

main().catch(console.error);
