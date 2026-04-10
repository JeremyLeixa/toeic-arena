// generate-audio-p4-new.cjs
// TOEIC Arena — Génère les audios P4 (p4_31 → p4_45)
// Un seul fichier .mp3 par talk
// Usage: node generate-audio-p4-new.cjs

const fs = require('fs');
const path = require('path');

// ---------- Load .env ----------
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
  console.error('❌ ELEVENLABS_API_KEY not set.');
  process.exit(1);
}

const VOICES = {
  W: 'EXAVITQu4vr4xnSDxMaL',
  M: 'pNInz6obpgDQGcFmaJgB',
};

const VOICE_SETTINGS = {
  stability: 0.55,
  similarity_boost: 0.75,
  speed: 0.85,
};

const MODEL_ID = 'eleven_multilingual_v2';
const OUTPUT_DIR = path.join(__dirname, 'public', 'audio', 'p4');
const API_URL = voiceId => `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`;
const RATE_LIMIT_MS = 1200;

// ---------- Data (embedded) ----------
const TALKS = [
  {id:"p4_31",type:"Voicemail",voice:"W",
    text:"Hi David, it's Monica from Riverside Construction. I'm calling about the proposal you submitted last week for the Lakewood project. Our team reviewed it on Tuesday and we're very interested in moving forward, but we have a few questions about the timeline. Specifically, the six-week framing phase seems a bit optimistic given the current lumber supply situation. Could you give me a call back when you get a chance? I'll be in meetings most of tomorrow morning, but I'm free after two in the afternoon. My number is 555-0142. Thanks."},
  {id:"p4_32",type:"Announcement",voice:"M",
    text:"Attention all passengers on platform four. The eight forty-seven express service to Manchester Piccadilly has been delayed by approximately twenty minutes due to a signalling issue near Milton Keynes. Customers with onward connections from Manchester are advised to speak to a member of our customer service team, located near the main entrance, who can assist with rebooking. We apologize for the inconvenience and thank you for your patience. A further announcement will be made once we have an updated departure time."},
  {id:"p4_33",type:"Meeting introduction",voice:"W",
    text:"Good morning everyone, and thank you for joining today's quarterly review. Before we dive into the financial results, I want to acknowledge the marketing team for their outstanding work on the product launch last month. Sales exceeded our projections by eighteen percent. Today's agenda has three main items: we'll start with the Q3 financial overview, then move on to the new customer retention strategy, and finally we'll discuss the budget allocation for next quarter. I've asked Thomas to present the financial section, so I'll hand it over to him in just a moment."},
  {id:"p4_34",type:"Tour guide",voice:"M",
    text:"Welcome everyone to the Riverside Historic Brewery, one of the oldest operating breweries in the region. My name is James and I'll be your guide for the next forty-five minutes. Before we begin, a few safety notes: please stay with the group at all times, the floors can be slippery in the production areas, and flash photography is prohibited inside the fermentation hall. At the end of the tour, you'll have the opportunity to sample four of our seasonal beers in the tasting room. If anyone needs to use the restrooms, now would be a good time, as we won't have another break for about thirty minutes."},
  {id:"p4_35",type:"Training session",voice:"W",
    text:"Alright team, let's get started with today's customer service refresher. The main topic is handling difficult conversations, specifically complaint calls. Research shows that most escalated complaints could have been resolved in the first sixty seconds if the agent had used three key techniques: active listening, acknowledgment, and offering a clear next step. We'll be doing role-play exercises in pairs this afternoon, so please pay attention during the theory portion. There's a handout being passed around right now with the script templates we'll reference. Any questions before we start?"},
  {id:"p4_36",type:"News report",voice:"M",
    text:"In local business news, tech startup Brightwave Solutions announced yesterday that it will be opening a second office in downtown Austin, creating an estimated two hundred new jobs over the next eighteen months. The expansion comes after the company secured forty million dollars in Series B funding last quarter. CEO Rachel Kim stated that the Austin location will focus primarily on their enterprise software division. Hiring is expected to begin in early November, with positions available in engineering, sales, and customer support. Interested candidates can apply through the company website."},
  {id:"p4_37",type:"Advertisement",voice:"W",
    text:"Tired of losing track of your business expenses? Say hello to Ledgerly, the expense management app designed for freelancers and small business owners. With Ledgerly, you can snap a photo of any receipt and our smart technology automatically categorizes it for tax season. No more shoeboxes full of crumpled papers. Our users save an average of six hours per month on bookkeeping. Sign up today and get your first three months completely free, with no credit card required. Visit ledgerly dot com slash free to start. Offer ends this Sunday."},
  {id:"p4_38",type:"Instructions",voice:"M",
    text:"Okay everyone, gather around. Before we start the hands-on portion of the safety workshop, I need to walk you through the proper use of the harness system. First, always inspect the harness for any visible damage before putting it on. Second, the leg straps should be snug but not tight. Third, and most importantly, the chest strap must sit at sternum level, not on the stomach or on the neck. Finally, before climbing, always clip your lanyard to the designated anchor point and give it a firm tug to make sure it's locked. If you're unsure about any step, raise your hand and I'll come check."},
  {id:"p4_39",type:"Recorded message",voice:"W",
    text:"Thank you for calling Brighton Bank customer service. Please listen carefully as our menu options have recently changed. For account balances and recent transactions, press one. For transferring funds or making a payment, press two. To report a lost or stolen card, press three, or stay on the line and you will be connected to the next available representative. For online banking support, please visit our website at Brighton Bank dot com slash help. Our current estimated wait time is approximately fifteen minutes. Please note that for faster service, most common requests can be handled through our mobile app."},
  {id:"p4_40",type:"Voicemail",voice:"M",
    text:"Hi Sarah, this is Michael from the design agency. I'm calling about the logo revisions we discussed on Monday. The team has finalized three new concepts based on your feedback, and I've just emailed them over to you. I'd really appreciate it if you could take a look before our Thursday meeting, since we want to lock in the direction before moving to the branding guide phase. Oh, and one more thing: we found a small typo in the tagline on the original version. It's already been fixed in the new concepts. Talk to you Thursday."},
  {id:"p4_41",type:"Announcement",voice:"W",
    text:"Good afternoon shoppers, and welcome to Greenwood Market. As a friendly reminder, our store will be closing thirty minutes earlier than usual this evening, at eight o'clock, due to staff training. Please make your way to the checkout counters by seven forty-five to allow our team enough time to process your purchases. Additionally, our bakery section is currently offering all items at fifty percent off to reduce end-of-day waste. Take advantage of this offer before it's gone. Thank you for shopping with us, and we hope to see you again soon."},
  {id:"p4_42",type:"News report",voice:"M",
    text:"In transportation news, the city council voted last night to approve funding for the long-awaited metro line extension. The new line will add six stations and connect the western suburbs to downtown, reducing average commute times by an estimated twenty minutes. Construction is scheduled to begin next spring and is expected to take approximately four years to complete. The total project cost is estimated at one point two billion dollars, funded through a combination of federal grants and a modest increase in local property taxes. Commuter advocacy groups have welcomed the decision."},
  {id:"p4_43",type:"Tour guide",voice:"W",
    text:"As we enter the main gallery, please take a moment to look up at the ceiling. Those frescoes were painted between 1612 and 1618 by the Italian master Giovanni Albertelli, and they depict scenes from classical mythology. The gallery itself houses over four hundred paintings from the Baroque period, and we're standing in front of one of the most famous pieces in the entire collection. Notice the dramatic use of light and shadow, a technique known as chiaroscuro. I'll give you a few minutes to explore on your own before we move to the sculpture wing."},
  {id:"p4_44",type:"Training session",voice:"M",
    text:"Welcome to the second module of our new hire orientation. This session focuses on our company's data security policies, which all employees must follow regardless of role. The three core principles are: never share your login credentials with anyone including colleagues, always lock your computer when you step away from your desk, and report any suspicious emails to the IT department immediately. Violations of these policies can result in disciplinary action, and in serious cases, termination. At the end of this session, you'll need to complete a short quiz to confirm your understanding."},
  {id:"p4_45",type:"Advertisement",voice:"M",
    text:"Looking to transform your backyard into the entertaining space of your dreams? GreenScape Landscaping has been designing and building custom outdoor environments for over twenty-five years. From simple patio installations to full outdoor kitchens with pergolas and lighting, our award-winning team handles every project from concept to completion. Right now, we're offering free design consultations for all new customers, plus ten percent off any project booked before the end of October. Call us today at 555-0178 or visit greenscape landscaping dot com to schedule your consultation."},
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

// ---------- Main ----------
(async () => {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  console.log(`📢 Processing ${TALKS.length} talks\n`);

  for (let idx = 0; idx < TALKS.length; idx++) {
    const talk = TALKS[idx];
    const outPath = path.join(OUTPUT_DIR, `${talk.id}.mp3`);

    console.log(`[${idx + 1}/${TALKS.length}] ${talk.id} [${talk.voice}] — ${talk.type}`);

    if (fs.existsSync(outPath)) {
      console.log(`   ✓ Exists, skipping`);
      continue;
    }

    try {
      await tts(talk.text, VOICES[talk.voice], outPath);
      console.log(`   ✅ Saved`);
    } catch (e) {
      console.error(`   ❌ ${e.message}`);
    }

    await sleep(RATE_LIMIT_MS);
  }

  console.log('\n🎉 P4 audio generation complete.');
})();