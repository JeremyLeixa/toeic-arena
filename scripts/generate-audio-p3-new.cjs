// generate-audio-p3-new.cjs
// TOEIC Arena — Génère les audios P3 (p3_31 → p3_50)
// Pour chaque conversation : 4 lignes individuelles + 1 fichier stitché
// Usage: node generate-audio-p3-new.cjs

const fs = require('fs');
const path = require('path');
const { execSync, spawnSync } = require('child_process');

// ---------- Load .env if present ----------
try {
  const envPath = path.join(__dirname, '.env');
  if (fs.existsSync(envPath)) {
    fs.readFileSync(envPath, 'utf-8').split('\n').forEach(line => {
      const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
      if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, '');
    });
  }
} catch (e) { /* ignore */ }

// ---------- Config ----------
const API_KEY = process.env.ELEVENLABS_API_KEY;
if (!API_KEY) {
  console.error('❌ ELEVENLABS_API_KEY not set. Add it to .env or export it.');
  process.exit(1);
}

const VOICES = {
  W: 'EXAVITQu4vr4xnSDxMaL', // Sarah
  M: 'pNInz6obpgDQGcFmaJgB', // Adam
};

const VOICE_SETTINGS = {
  stability: 0.55,
  similarity_boost: 0.75,
  speed: 0.85,
};

const MODEL_ID = 'eleven_multilingual_v2';
const OUTPUT_DIR = path.join(__dirname, 'public', 'audio', 'p3');
const API_URL = voiceId => `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`;
const RATE_LIMIT_MS = 1200;
const INTER_LINE_SILENCE = 0.6; // seconds

// ---------- Data (embedded) ----------
const CONVERSATIONS = [
  {id:"p3_31",lines:[
    {s:"W",t:"Hi Marcus, I wanted to check in about the Henderson proposal. Are we still on track for the Friday deadline?"},
    {s:"M",t:"Honestly, I'm a bit worried. The finance team hasn't sent me their numbers yet, and I can't finalize the budget section without them."},
    {s:"W",t:"That's frustrating. Do you want me to escalate it to Diane? She can usually get things moving."},
    {s:"M",t:"Yes, please. If we don't have the figures by tomorrow morning, we'll have to push the submission to Monday."}]},
  {id:"p3_32",lines:[
    {s:"M",t:"Good evening, I have a reservation for Petersen, party of four at seven thirty."},
    {s:"W",t:"Let me check... I'm sorry sir, I see your reservation but unfortunately we're running about twenty minutes behind schedule tonight."},
    {s:"M",t:"Oh, that's unfortunate. We actually have theater tickets for nine o'clock."},
    {s:"W",t:"In that case, let me speak to the manager. We may be able to seat you at the bar area immediately and send over complimentary appetizers while you wait."}]},
  {id:"p3_33",lines:[
    {s:"W",t:"Welcome to the Grand Meridian. I have you down for a standard king room for three nights, is that correct?"},
    {s:"M",t:"Yes, but I was wondering if there's any chance of an upgrade. I'm here for our company's annual conference."},
    {s:"W",t:"Let me see what I can do. As a loyalty program member, I can actually offer you a junior suite for an additional thirty dollars per night."},
    {s:"M",t:"That sounds reasonable. I'll take it. Can you also add breakfast to the package?"}]},
  {id:"p3_34",lines:[
    {s:"M",t:"Excuse me, I'm trying to find out what's happening with flight 447 to Frankfurt. The board still shows 'delayed' but no new time."},
    {s:"W",t:"I apologize for the confusion. We just received an update. Unfortunately, the aircraft has a mechanical issue and we're waiting for a replacement plane from Munich."},
    {s:"M",t:"How long are we talking about? I have a connection in Frankfurt at six."},
    {s:"W",t:"Realistically, at least four hours. I'd recommend visiting the rebooking desk at gate B12 to protect your connection."}]},
  {id:"p3_35",lines:[
    {s:"W",t:"Hi, I bought this jacket online last week, but the size doesn't fit. I'd like to exchange it for a medium."},
    {s:"M",t:"Of course. Do you have the original packaging and the receipt with you?"},
    {s:"W",t:"I have the receipt on my phone, but I threw out the box. Is that a problem?"},
    {s:"M",t:"Not at all, as long as the tags are still attached and the item is unworn. Let me just scan your digital receipt and we'll process the exchange."}]},
  {id:"p3_36",lines:[
    {s:"M",t:"Hello, I'd like to schedule a follow-up appointment with Dr. Chen, please. She asked me to come back in two weeks."},
    {s:"W",t:"Certainly. Dr. Chen's next available slot is actually on the twenty-second at ten fifteen. Does that work?"},
    {s:"M",t:"The twenty-second is a Thursday, right? I can't make mornings on Thursdays because of my work schedule."},
    {s:"W",t:"In that case, I can offer you Tuesday the twentieth at four thirty in the afternoon, or Friday the twenty-third at nine."}]},
  {id:"p3_37",lines:[
    {s:"W",t:"Good morning. I'm interested in learning more about your small business loan options. I'm opening a bakery."},
    {s:"M",t:"Congratulations. We have several products designed for new businesses. The key factors will be your credit history, your business plan, and the amount you're looking to borrow."},
    {s:"W",t:"I'm estimating I'll need around sixty thousand dollars for equipment and initial inventory."},
    {s:"M",t:"That's well within our range. I'd suggest scheduling a longer consultation with one of our business advisors. I can book you in for Thursday afternoon if that works."}]},
  {id:"p3_38",lines:[
    {s:"M",t:"Before we start the line, I need everyone to review the updated safety protocols. There have been three near-misses this month."},
    {s:"W",t:"I noticed the new signage near station four. Is that related?"},
    {s:"M",t:"Exactly. Management decided we need clearer visual warnings around the conveyor belt. Also, hard hats are now mandatory in that zone, not just recommended."},
    {s:"W",t:"Got it. Should I brief the temp workers starting today, or will HR handle that?"}]},
  {id:"p3_39",lines:[
    {s:"W",t:"The booth setup is almost done, but we have a problem. The banners we ordered arrived with the wrong logo."},
    {s:"M",t:"You're kidding. The conference opens in less than eighteen hours. Can the printer redo them in time?"},
    {s:"W",t:"I already called. They can rush a new set for an additional four hundred dollars, delivered by seven tomorrow morning."},
    {s:"M",t:"Approve it. We cannot represent the company with the wrong branding. I'll explain the extra cost to finance later."}]},
  {id:"p3_40",lines:[
    {s:"M",t:"Central Cab, how can I help you?"},
    {s:"W",t:"Hi, I need to book a pickup from 442 Oak Street to the airport for tomorrow morning. My flight is at nine fifteen."},
    {s:"M",t:"For a nine fifteen departure, I'd recommend a six thirty pickup. Traffic on the expressway can be unpredictable, especially on weekdays."},
    {s:"W",t:"That's earlier than I thought, but I'll trust your advice. Can I pay by card when the driver arrives?"}]},
  {id:"p3_41",lines:[
    {s:"W",t:"This is the two-bedroom unit I mentioned. As you can see, the living room gets excellent natural light in the afternoon."},
    {s:"M",t:"It's lovely. What about the neighborhood? I work downtown and I'd prefer not to spend an hour commuting each way."},
    {s:"W",t:"The metro station is just a seven-minute walk, and it's about twenty minutes to the business district. There's also a supermarket on the corner."},
    {s:"M",t:"Perfect. And is the rent negotiable, or is the listing price firm?"}]},
  {id:"p3_42",lines:[
    {s:"M",t:"IT Helpdesk, this is Raj. What seems to be the problem?"},
    {s:"W",t:"Hi Raj, it's Linda from accounting. The new expense software keeps freezing every time I try to upload a receipt."},
    {s:"M",t:"That's a known issue with the latest version. Have you tried clearing your browser cache?"},
    {s:"W",t:"I haven't. Honestly, I'm not entirely sure how to do that. Could you walk me through it, or should I bring my laptop to your office?"}]},
  {id:"p3_43",lines:[
    {s:"W",t:"Welcome to Apex Consulting. I'll be walking you through your first-day onboarding this morning."},
    {s:"M",t:"Thanks, I'm really excited to be here. Should I have brought anything specific with me today?"},
    {s:"W",t:"Your HR email mentioned a passport or ID card for the employment verification. Everything else, including your laptop and access badge, we'll provide."},
    {s:"M",t:"Great, I have my passport. What does the rest of the day look like?"}]},
  {id:"p3_44",lines:[
    {s:"M",t:"Let's review the Q3 campaign numbers. Overall engagement was up fifteen percent compared to Q2."},
    {s:"W",t:"That's great news, but I noticed the conversion rate on the email campaigns actually dropped slightly."},
    {s:"M",t:"You're right. The subject line testing we did mid-quarter may have been too aggressive. We lost some subscribers."},
    {s:"W",t:"For Q4, I'd suggest going back to a more conservative approach and focusing on personalization instead."}]},
  {id:"p3_45",lines:[
    {s:"W",t:"Hi, I'd like to place a catering order for a corporate meeting next Wednesday. We'll need coffee and pastries for about twenty people."},
    {s:"M",t:"No problem. Our corporate package includes two large carafes of coffee, plus a selection of pastries and fresh fruit. That runs about one hundred twenty dollars."},
    {s:"W",t:"Could we add some tea options as well? Not everyone drinks coffee."},
    {s:"M",t:"Absolutely. I'll add a selection of black, green, and herbal teas for an extra fifteen dollars. Should I deliver it around eight thirty?"}]},
  {id:"p3_46",lines:[
    {s:"M",t:"I'm interested in signing up for a gym membership, but I wanted to ask about the different plans first."},
    {s:"W",t:"Of course. We have three tiers. The basic plan gives you gym access only, the standard adds group classes, and the premium includes personal training sessions."},
    {s:"M",t:"I'm mostly interested in the yoga and spin classes. Would the standard plan cover those?"},
    {s:"W",t:"Yes, all group classes including yoga and spin are included in the standard tier. It's currently fifty-five dollars a month."}]},
  {id:"p3_47",lines:[
    {s:"W",t:"I need five hundred tri-fold brochures printed for a trade show next Friday. What are my options?"},
    {s:"M",t:"For that quantity, we can do either standard matte paper or a glossy premium finish. Standard is ninety cents per brochure, glossy is one dollar twenty."},
    {s:"W",t:"How long does each option take to produce?"},
    {s:"M",t:"Standard would be ready in two business days, glossy takes three. For a trade show, I'd honestly recommend the glossy. It looks far more professional under booth lighting."}]},
  {id:"p3_48",lines:[
    {s:"M",t:"Hi, I reserved a compact car under the name Walker for a three-day rental."},
    {s:"W",t:"I see your reservation, Mr. Walker. Unfortunately, we're out of compact cars today. I can offer you a free upgrade to a mid-size sedan at no extra cost."},
    {s:"M",t:"That works for me. One question though: does the mid-size have better fuel economy? I'm driving to the coast and back."},
    {s:"W",t:"It's slightly less efficient, but we'll give you a full tank of gas included to compensate. It should be more than enough for a round trip."}]},
  {id:"p3_49",lines:[
    {s:"W",t:"Hi, I'm picking up a prescription for Martinez. I also wanted to ask about a flu shot while I'm here."},
    {s:"M",t:"Let me grab your prescription. For the flu shot, do you have a few minutes to wait? Our pharmacist can do it right now if you're free."},
    {s:"W",t:"Really? I thought I'd need an appointment. How much does it cost?"},
    {s:"M",t:"No appointment needed. With most insurance plans, it's fully covered. If you don't have coverage, it's twenty-five dollars."}]},
  {id:"p3_50",lines:[
    {s:"M",t:"Hi, I'm interested in the day pass for the coworking space. What does it include?"},
    {s:"W",t:"The day pass gives you access to any open desk, unlimited coffee, printing up to twenty pages, and one of our phone booths for private calls."},
    {s:"M",t:"Do I need to reserve a meeting room separately if I have a video call?"},
    {s:"W",t:"Phone booths are first-come-first-served and included. For larger meeting rooms, yes, you'd book those through our app for an additional fee."}]},
];

// ---------- Helpers ----------
const sleep = ms => new Promise(r => setTimeout(r, ms));

async function tts(text, voiceId, outPath) {
  const res = await fetch(API_URL(voiceId), {
    method: 'POST',
    headers: {
      'xi-api-key': API_KEY,
      'Content-Type': 'application/json',
      'Accept': 'audio/mpeg',
    },
    body: JSON.stringify({
      text,
      model_id: MODEL_ID,
      voice_settings: VOICE_SETTINGS,
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`API ${res.status}: ${err.slice(0, 200)}`);
  }

  const buf = Buffer.from(await res.arrayBuffer());
  fs.writeFileSync(outPath, buf);
}

function ensureSilenceFile() {
  const silencePath = path.join(OUTPUT_DIR, '_silence.mp3');
  if (fs.existsSync(silencePath)) return silencePath;

  const r = spawnSync('ffmpeg', [
    '-y', '-f', 'lavfi',
    '-i', 'anullsrc=r=44100:cl=mono',
    '-t', String(INTER_LINE_SILENCE),
    '-q:a', '9', '-acodec', 'libmp3lame',
    silencePath,
  ], { stdio: 'pipe' });

  if (r.status !== 0) {
    throw new Error(`ffmpeg silence gen failed: ${r.stderr.toString().slice(0, 200)}`);
  }
  return silencePath;
}

function stitchConversation(lineFiles, outPath) {
  const silencePath = ensureSilenceFile();
  const concatListPath = outPath.replace(/\.mp3$/, '.txt');

  const lines = [];
  lineFiles.forEach((lf, i) => {
    lines.push(`file '${lf.replace(/\\/g, '/')}'`);
    if (i < lineFiles.length - 1) {
      lines.push(`file '${silencePath.replace(/\\/g, '/')}'`);
    }
  });
  fs.writeFileSync(concatListPath, lines.join('\n'), 'utf-8');

  const r = spawnSync('ffmpeg', [
    '-y', '-f', 'concat', '-safe', '0',
    '-i', concatListPath,
    '-c', 'copy',
    outPath,
  ], { stdio: 'pipe' });

  fs.unlinkSync(concatListPath);

  if (r.status !== 0) {
    throw new Error(`ffmpeg stitch failed: ${r.stderr.toString().slice(0, 300)}`);
  }
}

// ---------- Main ----------
(async () => {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  console.log(`📢 Processing ${CONVERSATIONS.length} conversations\n`);

  let totalLines = CONVERSATIONS.reduce((s, c) => s + c.lines.length, 0);
  let doneLines = 0;

  for (let idx = 0; idx < CONVERSATIONS.length; idx++) {
    const convo = CONVERSATIONS[idx];
    const cid = convo.id;
    const stitchedPath = path.join(OUTPUT_DIR, `${cid}.mp3`);

    console.log(`[${idx + 1}/${CONVERSATIONS.length}] ${cid}`);

    if (fs.existsSync(stitchedPath)) {
      console.log(`   ✓ Already stitched, skipping`);
      doneLines += convo.lines.length;
      continue;
    }

    const lineFiles = [];
    let allOk = true;

    for (let i = 0; i < convo.lines.length; i++) {
      doneLines++;
      const line = convo.lines[i];
      const linePath = path.join(OUTPUT_DIR, `${cid}_line${i}.mp3`);

      if (fs.existsSync(linePath)) {
        console.log(`   ✓ line${i} exists`);
        lineFiles.push(linePath);
        continue;
      }

      console.log(`   → line${i} [${line.s}] (${doneLines}/${totalLines})`);
      try {
        await tts(line.t, VOICES[line.s], linePath);
        lineFiles.push(linePath);
      } catch (e) {
        console.error(`   ⚠️  ${e.message}`);
        allOk = false;
        break;
      }
      await sleep(RATE_LIMIT_MS);
    }

    if (allOk && lineFiles.length === convo.lines.length) {
      try {
        console.log(`   🔗 Stitching ${cid}.mp3`);
        stitchConversation(lineFiles, stitchedPath);
        console.log(`   ✅ Done`);
      } catch (e) {
        console.error(`   ❌ ${e.message}`);
      }
    } else {
      console.log(`   ❌ Skipped stitch (missing lines)`);
    }
  }

  console.log('\n🎉 P3 audio generation complete.');
})();