// ═══════════════════════════════════════════════════════════
// generate-audio-boss.cjs
// Generates ALL Boss Test audio files via ElevenLabs API
//
// Usage:
//   $env:ELEVENLABS_API_KEY="sk_xxxxxxx"   (PowerShell)
//   node scripts/generate-audio-boss.cjs
//
// Output: public/audio/boss/
// Estimated characters: ~16,000 (well within budget)
// ═══════════════════════════════════════════════════════════

const fs = require("fs");
const path = require("path");

const API_KEY = process.env.ELEVENLABS_API_KEY;
if (!API_KEY) {
  console.error("❌ Missing ELEVENLABS_API_KEY environment variable.");
  process.exit(1);
}

// ── Voice config ──
const VOICE_W = "EXAVITQu4vr4xnSDxMaL"; // Sarah (US female)
const VOICE_M = "pNInz6obpgDQGcFmaJgB"; // Adam (US male)
const MODEL_ID = "eleven_multilingual_v2";
const SETTINGS = { stability: 0.55, similarity_boost: 0.75, speed: 0.85 };

const OUT_DIR = path.join(__dirname, "..", "public", "audio", "boss");

// ── Delay between requests (ms) — respect rate limits ──
const DELAY = 1200;
function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

async function generate(filename, text, voiceId) {
  const outPath = path.join(OUT_DIR, filename);
  if (fs.existsSync(outPath)) {
    console.log(`  ⏭ SKIP (exists): ${filename}`);
    return;
  }
  const res = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "xi-api-key": API_KEY },
    body: JSON.stringify({ text, model_id: MODEL_ID, voice_settings: SETTINGS }),
  });
  if (!res.ok) {
    console.error(`  ❌ FAIL ${filename}: ${res.status} ${res.statusText}`);
    return;
  }
  const buf = Buffer.from(await res.arrayBuffer());
  fs.writeFileSync(outPath, buf);
  console.log(`  ✅ ${filename} (${buf.length} bytes)`);
}

async function main() {
  fs.mkdirSync(OUT_DIR, { recursive: true });
  let totalChars = 0;

  // ════════════════════════════════════════════
  // PART 1 — 6 photos × 4 statements = 24 files
  // ════════════════════════════════════════════
  console.log("\n📸 PART 1 — Photo Descriptions");
  const P1 = [
    { id: "01", opts: [
      "Boxes are being loaded onto a delivery truck.",
      "A worker is scanning a package in a warehouse.",
      "The shelves are being assembled by a team.",
      "A forklift is transporting containers outside."
    ]},
    { id: "02", opts: [
      "The audience is leaving the conference room.",
      "A man is adjusting the projector screen.",
      "A woman is presenting data on a screen.",
      "The whiteboard is being cleaned."
    ]},
    { id: "03", opts: [
      "A vendor is handing a bag to a customer.",
      "Produce is being unloaded from a truck.",
      "A woman is setting up an empty market stall.",
      "Shoppers are sitting at outdoor tables."
    ]},
    { id: "04", opts: [
      "A guest is signing a document at the front desk.",
      "A receptionist is handing a key card to a guest.",
      "The lobby is empty except for the staff.",
      "Luggage is being carried to a room."
    ]},
    { id: "05", opts: [
      "A jogger is stretching on a park bench.",
      "A gardener is mowing the lawn.",
      "A woman is planting flowers in a park.",
      "The wheelbarrow is being pushed along a path."
    ]},
    { id: "06", opts: [
      "A technician is examining a test tube.",
      "Laboratory equipment is being packed into boxes.",
      "Two scientists are discussing results on a monitor.",
      "The researcher is pouring liquid into a beaker."
    ]},
  ];
  for (const item of P1) {
    for (let i = 0; i < 4; i++) {
      const text = item.opts[i];
      totalChars += text.length;
      await generate(`p1_${item.id}_${i}.mp3`, text, VOICE_W);
      await sleep(DELAY);
    }
  }

  // ════════════════════════════════════════════
  // PART 2 — 25 questions × (1Q + 3 responses) = 100 files
  // ════════════════════════════════════════════
  console.log("\n❓ PART 2 — Question-Response");
  const P2 = [
    { id: "01", q: "When will the new branch office open?", opts: ["Sometime in early March.", "Yes, it's a very modern building.", "The office is on the fifth floor."] },
    { id: "02", q: "Who approved the revised budget?", opts: ["It was revised last week.", "The finance director did.", "About fifteen thousand dollars."] },
    { id: "03", q: "Shouldn't we confirm the hotel reservation?", opts: ["The hotel is fully booked.", "I thought Karen already did.", "Yes, I enjoyed the hotel."] },
    { id: "04", q: "Where can I find the safety data sheets?", opts: ["They were updated last month.", "In the cabinet next to the lab entrance.", "The safety officer is on leave."] },
    { id: "05", q: "Would you rather present first or second?", opts: ["The presentation is about sales.", "I'd prefer to go second, if that's okay.", "Yes, I would."] },
    { id: "06", q: "How long did the training session last?", opts: ["There were about thirty participants.", "It went from 9 to noon.", "The trainer was excellent."] },
    { id: "07", q: "Why hasn't the client signed the contract yet?", opts: ["They're reviewing it with their legal team.", "The contract expires next month.", "I'll sign it right away."] },
    { id: "08", q: "The conference starts at nine, doesn't it?", opts: ["Actually, they pushed it back to ten.", "The conference was very informative.", "Yes, I have nine copies."] },
    { id: "09", q: "Could you let me know when the shipment arrives?", opts: ["It was shipped on Monday.", "Of course, I'll call you right away.", "The shipping cost is $200."] },
    { id: "10", q: "What's the best way to reach the airport from here?", opts: ["The airport has three terminals.", "My flight is at seven.", "Taking the express train is the fastest."] },
    { id: "11", q: "Have you met the new operations manager?", opts: ["She starts officially on Monday.", "Operations are running smoothly.", "I manage the sales department."] },
    { id: "12", q: "Do you know if the parking garage is open on weekends?", opts: ["I usually park on the street.", "Yes, but it closes at 6 PM on Saturdays.", "The garage was renovated recently."] },
    { id: "13", q: "Weren't the budget figures supposed to be submitted yesterday?", opts: ["The budget increased by 10%.", "I thought the deadline was extended to Friday.", "Yes, the figures look accurate."] },
    { id: "14", q: "Who's in charge of organizing the farewell party?", opts: ["It's Rachel from HR.", "The party is next Thursday.", "Everyone enjoyed the last one."] },
    { id: "15", q: "Should I include the quarterly data in the presentation?", opts: ["The quarter ends in June.", "I think that would strengthen your argument.", "The data was collected last year."] },
    { id: "16", q: "How often are performance reviews conducted?", opts: ["The review was very positive.", "Twice a year, in June and December.", "She performed exceptionally well."] },
    { id: "17", q: "Which vendor did we choose for the catering?", opts: ["I chose the vegetarian option.", "We went with Riverside Catering.", "The event is in two weeks."] },
    { id: "18", q: "The marketing report is due on Friday, right?", opts: ["The marketing team has twelve members.", "I believe it was pushed to Monday.", "Yes, I'll read it over the weekend."] },
    { id: "19", q: "Would you mind forwarding me the meeting minutes?", opts: ["The meeting lasted about an hour.", "Not at all — I'll send them now.", "I don't mind attending meetings."] },
    { id: "20", q: "Where should I park when I visit the factory?", opts: ["There's a visitor lot near the main entrance.", "The factory tour starts at two.", "It was built in 2015."] },
    { id: "21", q: "Has the software update been installed on all computers?", opts: ["The IT team is finishing the last few today.", "I updated my resume last week.", "The computers are new."] },
    { id: "22", q: "Why don't we schedule the next review for Thursday?", opts: ["I have a client meeting that day.", "The review was very thorough.", "Thursday is the fourth day of the week."] },
    { id: "23", q: "Can you tell me which floor the legal department is on?", opts: ["They're on the ninth floor.", "The legal team is very experienced.", "I can't tell the difference."] },
    { id: "24", q: "Didn't the supplier promise delivery by Wednesday?", opts: ["They called to say it'll be a day late.", "The supplies are in the storage room.", "Yes, I promised to attend."] },
    { id: "25", q: "How would you rate the quality of the new supplier's materials?", opts: ["The rate is $15 per unit.", "I'd say they're comparable to what we had before.", "We supply materials to three factories."] },
  ];
  for (const item of P2) {
    // Question — use female voice (like TOEIC narrator)
    totalChars += item.q.length;
    await generate(`p2_${item.id}_q.mp3`, item.q, VOICE_W);
    await sleep(DELAY);
    // Responses — alternate voices for variety
    const voices = [VOICE_M, VOICE_W, VOICE_M];
    for (let i = 0; i < 3; i++) {
      totalChars += item.opts[i].length;
      await generate(`p2_${item.id}_${i}.mp3`, item.opts[i], voices[i]);
      await sleep(DELAY);
    }
  }

  // ════════════════════════════════════════════
  // PART 3 — 13 conversations = 13 files
  // Each file = full conversation stitched as one text
  // ════════════════════════════════════════════
  console.log("\n💬 PART 3 — Conversations");
  const P3 = [
    { id: "01", lines: [
      { s: "M", t: "I noticed the copier on the third floor is broken again. Should I call the repair service?" },
      { s: "W", t: "Actually, I already submitted a request online this morning. They said someone would come by tomorrow." },
      { s: "M", t: "That's fast. Last time it took them almost a week." },
      { s: "W", t: "I used the priority service option. It costs a bit more but it's worth it when half the office can't print." }
    ]},
    { id: "02", lines: [
      { s: "W", t: "Good morning. I'd like to exchange this jacket. I bought it last week but the zipper is defective." },
      { s: "M", t: "I'm sorry about that. Do you have the receipt?" },
      { s: "W", t: "Yes, here it is. I'd prefer the same jacket in a different color if you have it." },
      { s: "M", t: "Let me check our inventory. We have it in navy blue and dark green. The gray one is out of stock." }
    ]},
    { id: "03", lines: [
      { s: "M", t: "Have you had a chance to look at the proposal from Meridian Consulting?" },
      { s: "W", t: "I skimmed through it. Their approach is interesting but the timeline seems aggressive." },
      { s: "M", t: "That's what I thought too. They're proposing to finish the entire project in just four months." },
      { s: "W", t: "Let's schedule a call with them to discuss whether a six-month timeline would be feasible without increasing the budget." }
    ]},
    { id: "04", lines: [
      { s: "W", t: "Excuse me, I'm looking for the international departures terminal. I think I'm in the wrong building." },
      { s: "M", t: "You're in Terminal 1, which is domestic. International is Terminal 3. You can take the shuttle." },
      { s: "W", t: "How often does the shuttle run?" },
      { s: "M", t: "Every ten minutes. The stop is just outside those doors to the left. It's about a five-minute ride." }
    ]},
    { id: "05", lines: [
      { s: "M", t: "I've been looking at our employee satisfaction survey results. Morale has dropped since last year." },
      { s: "W", t: "That's concerning. Do we know which areas scored the lowest?" },
      { s: "M", t: "Work-life balance and career development opportunities. Compensation actually scored well." },
      { s: "W", t: "Maybe we should introduce flexible hours and expand the mentoring program." }
    ]},
    { id: "06", lines: [
      { s: "W", t: "I just got off the phone with the event venue. They've double-booked us for October 15." },
      { s: "M", t: "You're kidding. We've been planning this for months. Can they offer an alternative date?" },
      { s: "W", t: "They suggested October 22, same time, same room. Or they can give us a different room on the 15th." },
      { s: "M", t: "The date is more important than the room. Let me check with the keynote speaker's availability." }
    ]},
    { id: "07", lines: [
      { s: "M", t: "I just finished reading the annual report. The board is recommending a merger with a European firm." },
      { s: "W", t: "Really? Which one?" },
      { s: "M", t: "Nordström Industries, based in Stockholm. They specialize in renewable energy components." },
      { s: "W", t: "That could be a strategic move. Our green energy division has been growing rapidly." }
    ]},
    { id: "08", lines: [
      { s: "W", t: "Thank you for calling Apex Insurance. How can I help you today?" },
      { s: "M", t: "I'd like to add my daughter to my health insurance plan. She just turned 18." },
      { s: "W", t: "Certainly. Dependents can be added up to age 26. I'll need her full name and date of birth." },
      { s: "M", t: "Great. It's Emily Parker, born January 15, 2008." }
    ]},
    { id: "09", lines: [
      { s: "M", t: "I'm thinking of enrolling in the advanced Excel course the company is offering next month." },
      { s: "W", t: "I took it last quarter. It's really useful — especially the sections on pivot tables and macros." },
      { s: "M", t: "Good to know. Is there a prerequisite?" },
      { s: "W", t: "You need to have completed the intermediate course, or pass a skills assessment. HR can set that up for you." }
    ]},
    { id: "10", lines: [
      { s: "W", t: "I've drafted the press release about our new product launch. Could you review it before I send it out?" },
      { s: "M", t: "Sure. When does it need to go out?" },
      { s: "W", t: "The embargo lifts at midnight tonight, so ideally I'd like your feedback by 5 PM." },
      { s: "M", t: "That's tight, but I'll make it work. Send it to me now and I'll prioritize it." }
    ]},
    { id: "11", lines: [
      { s: "M", t: "The architect just sent the revised floor plans for the new office. Want to take a look?" },
      { s: "W", t: "Definitely. Did they include the open workspace we asked for?" },
      { s: "M", t: "Yes, and they also added two more meeting rooms. But they had to remove the game room to make space." },
      { s: "W", t: "That's a shame, but meeting rooms are a higher priority. Let's present this to the team on Thursday." }
    ]},
    { id: "12", lines: [
      { s: "W", t: "We need to finalize the seating chart for the awards banquet. We're expecting 180 guests." },
      { s: "M", t: "That's twenty more than last year. Are we using the same venue?" },
      { s: "W", t: "Yes, but we'll need to add two more tables. Each table seats ten." },
      { s: "M", t: "I'll contact the venue to confirm they can accommodate the extra tables by next Wednesday." }
    ]},
    { id: "13", lines: [
      { s: "M", t: "I heard the board approved the opening of a new distribution center in Southeast Asia." },
      { s: "W", t: "Yes, they chose a location near Ho Chi Minh City. Construction starts in January." },
      { s: "M", t: "That should cut delivery times to our Asian customers significantly." },
      { s: "W", t: "By about 40%, according to the logistics team. And it'll create around 200 local jobs." }
    ]},
  ];

  // For P3, we generate one file per conversation with all lines
  // We generate per-line then you can stitch, OR we generate as one block per speaker
  // Strategy: generate each line separately, then stitch with ffmpeg (or generate full convo as one)
  // Simpler: generate line by line → p3_01_0.mp3, p3_01_1.mp3, etc.
  for (const convo of P3) {
    for (let i = 0; i < convo.lines.length; i++) {
      const line = convo.lines[i];
      const voice = line.s === "M" ? VOICE_M : VOICE_W;
      totalChars += line.t.length;
      await generate(`p3_${convo.id}_${i}.mp3`, line.t, voice);
      await sleep(DELAY);
    }
  }

  // ════════════════════════════════════════════
  // PART 4 — 10 talks = 10 files
  // ════════════════════════════════════════════
  console.log("\n🎤 PART 4 — Talks");
  const P4 = [
    { id: "01", voice: "W", text: "Hello, Mr. Tanaka. This is Dr. Catherine Wells from the Eastside Dental Clinic. I'm calling to remind you that you have an appointment scheduled for this Thursday at 3:30 PM for your routine cleaning and check-up. Please arrive about ten minutes early to fill out the updated health questionnaire. If you need to reschedule, please call us at 555-0147 before the end of business tomorrow. We look forward to seeing you." },
    { id: "02", voice: "M", text: "Good afternoon, shoppers. Thank you for visiting Greenfield Mall today. We'd like to remind you that our Spring Clearance Sale begins tomorrow and runs through Sunday. All participating stores are offering discounts of 30 to 70 percent on select merchandise. Additionally, the first 100 customers through the doors tomorrow morning will receive a free gift bag. The mall will open at 8 AM instead of our usual 10 AM for the sale. See the directory near the main entrance for a list of participating stores." },
    { id: "03", voice: "W", text: "Alright, let's move on to the next agenda item — the customer feedback from our latest product launch. Overall, the response has been positive, with 82% of survey respondents rating the product as good or excellent. However, we've received consistent complaints about the packaging — specifically, that it's difficult to open. The design team is already working on a revised version with a pull-tab. We expect the updated packaging to be in stores by mid-April. In the meantime, I've asked customer service to include opening instructions on our website." },
    { id: "04", voice: "M", text: "Welcome aboard the Harbor City Sightseeing Cruise. Our tour today will last approximately two hours as we circle the harbor and pass some of the city's most iconic landmarks. On your left, you'll soon see the Maritime Museum, which was built in 1897 and recently underwent a 15 million dollar renovation. On your right in about ten minutes, we'll pass the Lighthouse Point restaurant, famous for its seafood. Refreshments are available on the lower deck, and restrooms are at the rear of the boat. Please remain seated while the vessel is in motion. I'll point out each landmark as we approach it." },
    { id: "05", voice: "W", text: "Before we start today's session on conflict resolution in the workplace, I want to share some data. According to our internal survey, 65% of managers said that handling team conflict is the most challenging part of their job. That's actually higher than budget management and performance reviews. Today, we'll focus on three techniques: active listening, reframing statements, and mediation basics. I'll demonstrate each one, and then each of you will practice in small groups. By the end of the session, you should feel more confident addressing disagreements before they escalate. Let's begin with active listening." },
    { id: "06", voice: "M", text: "Hi, this is Marcus from the IT department. I'm calling about the laptop you reported as malfunctioning yesterday. We've run a diagnostic and it looks like the hard drive is failing. Unfortunately, it can't be repaired. The good news is that your files are backed up on the cloud, so nothing should be lost. I've ordered a replacement laptop, which should arrive by Wednesday. In the meantime, there's a loaner available at the help desk — just bring your employee badge. Give me a call if you have any questions. My extension is 4455." },
    { id: "07", voice: "W", text: "Attention all staff. This is a reminder that the annual fire drill will take place this Friday at 11 AM. When you hear the alarm, please stop what you are doing, close any open windows, and proceed calmly to your designated assembly point. Do not use the elevators. Floor wardens will guide you to the exits. The drill should take approximately 20 minutes. Please do not re-enter the building until the all-clear signal is given. Visitors and contractors should be escorted by their host employee. Thank you for your cooperation." },
    { id: "08", voice: "M", text: "So to summarize our findings: customer acquisition costs have risen by 18% year over year, which is above the industry average of 12%. The main driver is increased competition for digital advertising space, particularly on social media platforms. Our recommendation is twofold. First, we should shift 30% of our paid advertising budget to content marketing, which has a lower cost per lead. Second, we should invest in our referral program — our data shows that referred customers have a 37% higher retention rate and cost almost nothing to acquire. I'll open the floor for questions now." },
    { id: "09", voice: "W", text: "Good morning. You're listening to Metro Business Update. In local news, Hartfield Industries announced yesterday that it will close its downtown manufacturing plant by the end of the year, affecting approximately 350 workers. The company cited rising operational costs and plans to consolidate production at its facility in Henderson, about 60 miles north. Mayor Diaz has scheduled a press conference for this afternoon to discuss the city's response, including potential retraining programs for affected employees. Hartfield has been operating in the downtown area for over 40 years." },
    { id: "10", voice: "M", text: "Welcome to your first day at Pinnacle Financial Services. I'm Robert Cheng, your onboarding coordinator. Over the next three days, we'll cover everything you need to know to get started. Today's schedule includes a company overview, a tour of the building, and setting up your workstation and IT credentials. Tomorrow, you'll attend sessions on compliance and data security — these are mandatory and there will be a short quiz at the end. On day three, you'll meet your team leads and begin department-specific training. Lunch today is provided in the second-floor lounge, courtesy of your new employer. Any questions before we begin?" },
  ];
  for (const talk of P4) {
    const voice = talk.voice === "M" ? VOICE_M : VOICE_W;
    totalChars += talk.text.length;
    await generate(`p4_${talk.id}.mp3`, talk.text, voice);
    await sleep(DELAY);
  }

  // ════════════════════════════════════════════
  // SUMMARY
  // ════════════════════════════════════════════
  console.log("\n══════════════════════════════════");
  console.log("✅ BOSS TEST AUDIO GENERATION COMPLETE");
  console.log(`📊 Total characters sent: ~${totalChars}`);
  console.log("══════════════════════════════════");
}

main().catch(console.error);
