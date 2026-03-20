// ─── generate-audio-blitz.cjs ───
// Run: node generate-audio-blitz.cjs
// Generates MP3 files for Audio Blitz game via ElevenLabs API
// Resume-safe: skips files that already exist

const fs = require('fs');
const path = require('path');
const https = require('https');

// ═══ CONFIG ═══
const API_KEY = process.env.ELEVENLABS_API_KEY || '0fa826d5e32fd675d13b87b9afd73044b3737ae4f5b0bfa4a97172266c866e3e';
const VOICE_ID = '21m00Tcm4TlvDq8ikWAM'; // Rachel (US female)
const OUTPUT_DIR = path.join(__dirname, 'public', 'audio', 'blitz');
const DELAY_MS = 1500; // Rate limit safety

// ═══ AUDIO BLITZ TEXTS ═══
const items = [
  {id:"ab_01",text:"The meeting has been moved from Conference Room A to Room 312 on the third floor."},
  {id:"ab_02",text:"Please note that the parking garage will be closed for maintenance this weekend."},
  {id:"ab_03",text:"All expense reports for the month of October must be submitted by Friday at 5 PM."},
  {id:"ab_04",text:"Due to the weather forecast, tomorrow's outdoor team-building event has been postponed until further notice."},
  {id:"ab_05",text:"The new employee orientation will take place in the main auditorium at nine thirty."},
  {id:"ab_06",text:"Hi, this is Karen from accounting. I'm calling about the invoice you sent last Tuesday. Could you call me back?"},
  {id:"ab_07",text:"I'm afraid Mr. Tanaka is not available at the moment. Would you like to leave a message?"},
  {id:"ab_08",text:"Good morning. I'm calling to confirm your reservation for twelve guests on Saturday evening at seven."},
  {id:"ab_09",text:"Could you send me the updated price list? I need it before the client meeting at two."},
  {id:"ab_10",text:"The shipment was supposed to arrive yesterday, but it's been delayed by two days."},
  {id:"ab_11",text:"I've reviewed the proposal and I think we should increase the marketing budget by fifteen percent."},
  {id:"ab_12",text:"The printer on the second floor is out of order again. Please use the one near reception instead."},
  {id:"ab_13",text:"We sold fourteen hundred units last month, which is a twenty percent increase from August."},
  {id:"ab_14",text:"The flight to Singapore departs at ten fifteen, not ten fifty as originally scheduled."},
  {id:"ab_15",text:"The total cost of the project came to forty-seven thousand, three hundred and twenty dollars."},
  {id:"ab_16",text:"Our new office is located at 280 Park Avenue, between Third and Lexington."},
  {id:"ab_17",text:"I appreciate the effort, but I think we need to go in a completely different direction with this design."},
  {id:"ab_18",text:"If we don't hear back from the supplier by Thursday, we should start looking at alternatives."},
  {id:"ab_19",text:"The quarterly results were better than expected, especially in the Asia-Pacific region."},
  {id:"ab_20",text:"I'm not sure we can meet the original deadline, but we could deliver a preliminary version by next Wednesday."},
  {id:"ab_21",text:"Please make thirty copies of the report and leave them on my desk."},
  {id:"ab_22",text:"The manager is currently working on the annual budget, not the audit."},
  {id:"ab_23",text:"We need to hire a technician, not a teacher, for the IT department."},
  {id:"ab_24",text:"The client wants to buy the property, not rent it."},
  {id:"ab_25",text:"Attention please. The fire drill will begin in approximately five minutes. Please proceed to the nearest exit."},
  {id:"ab_26",text:"The cafeteria will be offering a new menu starting next Monday, with more vegetarian options."},
  {id:"ab_27",text:"Your hotel reservation has been confirmed for three nights, checking in on the fourteenth."},
  {id:"ab_28",text:"The warranty on this product covers repairs for up to two years from the date of purchase."},
  {id:"ab_29",text:"I'd recommend taking the express train rather than driving. It's much faster during rush hour."},
  {id:"ab_30",text:"The contract states that payment is due within thirty days of receiving the invoice."},
];

// ═══ GENERATE ═══
if (!fs.existsSync(OUTPUT_DIR)) fs.mkdirSync(OUTPUT_DIR, { recursive: true });

async function generateOne(item) {
  const outPath = path.join(OUTPUT_DIR, item.id + '.mp3');
  if (fs.existsSync(outPath)) {
    console.log(`⏭️  ${item.id} — already exists, skipping`);
    return;
  }
  console.log(`🔊 ${item.id} — generating...`);

  const body = JSON.stringify({
    text: item.text,
    model_id: 'eleven_monolingual_v1',
    voice_settings: { stability: 0.5, similarity_boost: 0.75, speed: 0.9 }
  });

  return new Promise((resolve, reject) => {
    const req = https.request({
      hostname: 'api.elevenlabs.io',
      path: `/v1/text-to-speech/${VOICE_ID}`,
      method: 'POST',
      headers: {
        'Accept': 'audio/mpeg',
        'Content-Type': 'application/json',
        'xi-api-key': API_KEY,
        'Content-Length': Buffer.byteLength(body)
      }
    }, (res) => {
      if (res.statusCode === 429) {
        console.log('⚠️  Rate limited, waiting 10s...');
        setTimeout(() => resolve(generateOne(item)), 10000);
        return;
      }
      if (res.statusCode !== 200) {
        let data = '';
        res.on('data', c => data += c);
        res.on('end', () => { console.log(`❌ ${item.id} — HTTP ${res.statusCode}: ${data}`); resolve(); });
        return;
      }
      const stream = fs.createWriteStream(outPath);
      res.pipe(stream);
      stream.on('finish', () => { console.log(`✅ ${item.id} — saved`); resolve(); });
    });
    req.on('error', (e) => { console.log(`❌ ${item.id} — ${e.message}`); resolve(); });
    req.write(body);
    req.end();
  });
}

async function run() {
  for (let i = 0; i < items.length; i++) {
    await generateOne(items[i]);
    if (i < items.length - 1) await new Promise(r => setTimeout(r, DELAY_MS));
  }
  console.log('\n🎉 Done! Generated audio in', OUTPUT_DIR);
}

run();
