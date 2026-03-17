// ═══════════════════════════════════════════
// generate-audio-p3p4.cjs
// ═══════════════════════════════════════════
// Usage: node scripts/generate-audio-p3p4.cjs
//
// Generates:
// - Part 3: one MP3 per conversation line (different voices M/W)
//   Files: public/audio/p3/l3_01_line0.mp3, l3_01_line1.mp3, etc.
// - Part 4: one MP3 per talk (full monologue)
//   Files: public/audio/p4/l4_01.mp3, etc.
//

const fs = require('fs');
const path = require('path');
require('dotenv').config();

const API_KEY = process.env.ELEVENLABS_API_KEY;
if (!API_KEY) {
  console.error('Missing ELEVENLABS_API_KEY in .env');
  process.exit(1);
}

const VOICES = {
  M: 'pqHfZKP75CvOlQylNhV4',       // Bill (male US)
  W: 'EXAVITQu4vr4xnSDxMaL',       // Sarah (female US)
  uk_M: 'bIHbv24MWmeRgasZH58o',     // Will (male UK) - for variety
};
const DELAY_MS = 600;

// ─── Part 3 conversations ───
const P3 = [
  {id:"l3_01",lines:[{s:"W",t:"Have you seen the updated schedule for the trade show next month?"},{s:"M",t:"Yes, our booth has been moved to Hall B. It's actually a better location than last year."},{s:"W",t:"That's great. Should I order new banners for the booth?"},{s:"M",t:"Let's check the budget with finance first. The old ones might still work."}]},
  {id:"l3_02",lines:[{s:"M",t:"Excuse me, I have a reservation for two under the name Patterson."},{s:"W",t:"Yes, Mr. Patterson. Your table is ready. Would you prefer the terrace or inside?"},{s:"M",t:"The terrace sounds nice, but it looks like it might rain."},{s:"W",t:"In that case, I can seat you by the window. You'll still have a lovely view."}]},
  {id:"l3_03",lines:[{s:"W",t:"The quarterly sales figures just came in, and they're above our target by 12 percent."},{s:"M",t:"That's excellent news. Which region performed the best?"},{s:"W",t:"The Asian market, especially Japan and South Korea. Europe was slightly below target."},{s:"M",t:"We should present these results at Friday's board meeting."}]},
  {id:"l3_04",lines:[{s:"M",t:"I'm calling about the laptop I ordered two weeks ago. It still hasn't arrived."},{s:"W",t:"I'm sorry to hear that. Can I have your order number, please?"},{s:"M",t:"It's TK-4578. I was told it would arrive within five business days."},{s:"W",t:"Let me check that for you. I see there was a delay at our warehouse. I can offer you express shipping at no extra cost."}]},
  {id:"l3_05",lines:[{s:"W",t:"I just got an email from the building manager. The elevators will be out of service this weekend."},{s:"M",t:"Both of them? That's going to be a problem for anyone working on the upper floors."},{s:"W",t:"I know. They're doing maintenance that was postponed from last month."},{s:"M",t:"I'll send a notice to all departments so people can plan ahead."}]},
  {id:"l3_06",lines:[{s:"M",t:"Have you had a chance to interview any candidates for the marketing position?"},{s:"W",t:"I've seen three so far. Two had strong experience, but one really stood out."},{s:"M",t:"What made them special?"},{s:"W",t:"She has ten years in digital marketing and previously managed a team of fifteen."}]},
  {id:"l3_07",lines:[{s:"W",t:"The client wants the website redesign completed by March first."},{s:"M",t:"That's only six weeks away. We haven't even finalized the design concept."},{s:"W",t:"I know it's tight. Can we bring in a freelance designer to help?"},{s:"M",t:"Good idea. I'll reach out to the agency we used last time."}]},
  {id:"l3_08",lines:[{s:"M",t:"I'm heading to the airport now. My flight to Chicago leaves at 3:30."},{s:"W",t:"Don't forget you have a dinner with the client at seven. The restaurant is near your hotel."},{s:"M",t:"Right. And the meeting with their team is tomorrow morning at nine?"},{s:"W",t:"Yes, in their downtown office. I've emailed you the address and parking details."}]},
  {id:"l3_09",lines:[{s:"W",t:"The new employee orientation is scheduled for Monday. Are the training materials ready?"},{s:"M",t:"Almost. I still need to update the section on company policies. There were some changes last quarter."},{s:"W",t:"Make sure you include the updated remote work guidelines. That's what new hires always ask about."},{s:"M",t:"Good point. I'll have everything printed by Friday afternoon."}]},
  {id:"l3_10",lines:[{s:"M",t:"I noticed the supply room is almost empty. We're low on paper, toner, and pens."},{s:"W",t:"I placed an order last Tuesday, but the supplier said there's a two-week backlog."},{s:"M",t:"Two weeks? That's too long. Can we find another supplier?"},{s:"W",t:"I'll look into it this afternoon and get quotes from at least two other companies."}]},
  {id:"l3_11",lines:[{s:"W",t:"I see you applied for the project manager position in the Singapore office."},{s:"M",t:"Yes, I've always wanted to work abroad. And I have experience with the Asian market."},{s:"W",t:"The position requires fluency in Mandarin. Do you speak it?"},{s:"M",t:"I've been taking classes for the past year. I'd say I'm at an intermediate level now."}]},
  {id:"l3_12",lines:[{s:"M",t:"The parking garage will be closed for repairs starting next Monday."},{s:"W",t:"For how long? I drive to work every day."},{s:"M",t:"About three weeks. But the company has arranged a temporary lot two blocks away."},{s:"W",t:"That's not ideal, but at least there's an alternative. Is there a shuttle?"},{s:"M",t:"Yes, it runs every ten minutes from the temporary lot to the main entrance."}]},
  {id:"l3_13",lines:[{s:"W",t:"Our customer satisfaction scores dropped five percent this quarter."},{s:"M",t:"That's concerning. Do we know which area was affected the most?"},{s:"W",t:"Response time. Customers are waiting too long for support."},{s:"M",t:"We should consider hiring additional support staff or implementing a chatbot."}]},
  {id:"l3_14",lines:[{s:"M",t:"Excuse me, I'd like to return this printer. It stopped working after two days."},{s:"W",t:"I'm sorry about that. Do you have your receipt?"},{s:"M",t:"Yes, here it is. I bought it last Thursday."},{s:"W",t:"Since it's within our 30-day return policy, I can offer you a full refund or an exchange."}]},
  {id:"l3_15",lines:[{s:"W",t:"The conference call with the London team is in 15 minutes. Is the equipment set up?"},{s:"M",t:"The video is working, but I'm having trouble with the audio. There's an echo."},{s:"W",t:"Try using the external microphone instead. It usually works better."},{s:"M",t:"Good idea. I'll switch it now."}]},
  {id:"l3_16",lines:[{s:"M",t:"The architect sent over the revised floor plans for the new office."},{s:"W",t:"Did they include the extra meeting rooms we requested?"},{s:"M",t:"Yes, two small ones and one large conference room. But they removed the break room on the second floor."},{s:"W",t:"That's a dealbreaker. Everyone uses that break room. Ask them to revise it again."}]},
  {id:"l3_17",lines:[{s:"W",t:"Our flight has been delayed by two hours. We won't land until 9 PM."},{s:"M",t:"That means we'll miss the welcome reception at the conference."},{s:"W",t:"I know. But at least we'll make it in time for tomorrow's keynote at 8 AM."},{s:"M",t:"I'll text the organizer and let them know we're arriving late."}]},
  {id:"l3_18",lines:[{s:"M",t:"I think we should switch to a new accounting software. The current one is too slow."},{s:"W",t:"I agree, but migration is risky. What about the data from the last five years?"},{s:"M",t:"The new system can import our existing data automatically. I've already tested it."},{s:"W",t:"That's reassuring. Let's schedule a demo for the whole finance team next week."}]},
  {id:"l3_19",lines:[{s:"W",t:"The health inspector is coming next Tuesday for our annual review."},{s:"M",t:"Already? I need to make sure the kitchen passes the cleanliness check."},{s:"W",t:"Last year we got a warning about the storage area. Let's not repeat that."},{s:"M",t:"I'll have the team do a deep clean this weekend."}]},
  {id:"l3_20",lines:[{s:"M",t:"I'd like to open a business checking account, please."},{s:"W",t:"Of course. Do you have your company registration documents with you?"},{s:"M",t:"Yes, I have everything here. I also need to set up online banking."},{s:"W",t:"We can do both today. The online access will be active within 24 hours."}]},
];

// ─── Part 4 talks ───
const P4 = [
  {id:"l4_01",voice:"W",text:"Hi, this is Karen from Summit Consulting. I'm calling to confirm our meeting on Wednesday at 10 AM. I've reserved conference room B at your office. Could you let me know if you need us to bring any presentation materials? Also, I'd like to add one more item to the agenda — we need to discuss the revised timeline. Please call me back at 555-0172. Thank you."},
  {id:"l4_02",voice:"M",text:"Attention all passengers. Flight BA-247 to London Heathrow, originally scheduled for departure at 3:15 PM, has been delayed due to severe weather conditions. The new estimated departure time is 5:45 PM. We apologize for the inconvenience. Passengers are invited to visit the airline lounge on the second floor, where complimentary refreshments will be available. Please listen for further announcements."},
  {id:"l4_03",voice:"W",text:"Good morning, everyone. Thank you for coming to this month's all-hands meeting. Before we begin, I'd like to welcome two new team members who joined us last week: David Chen in engineering and Priya Sharma in product design. Please make them feel welcome. Now, the main topic today is our Q2 goals. As you know, we exceeded our Q1 targets, and I'd like to keep that momentum going."},
  {id:"l4_04",voice:"M",text:"Welcome to the National Museum of Modern Art. Today's guided tour will last approximately 90 minutes and will cover the three main galleries on this floor. Photography is permitted, but please do not use flash, as it can damage the artwork. The gift shop and café are located on the ground floor and will remain open until 6 PM. Please stay with the group, and feel free to ask questions at any time."},
  {id:"l4_05",voice:"W",text:"Alright, let's get started with today's safety training. As warehouse employees, it's critical that you follow proper lifting techniques to avoid injury. Always bend at the knees, not at the waist. For items over 25 kilograms, use the mechanical lift or ask a colleague for help. I'll demonstrate the correct technique now, and then each of you will practice. Hard hats must be worn at all times in zones C and D."},
  {id:"l4_06",voice:"M",text:"Hello, this is James Walker from Greenfield Property Management. I'm calling about the office space you inquired about on Park Avenue. The unit is 200 square meters with an open floor plan, and it's available from the first of next month. The monthly rent is $4,500, which includes utilities and one parking space. I'd love to schedule a viewing at your convenience. My number is 555-0398."},
  {id:"l4_07",voice:"W",text:"In business news, TechVision Inc. announced today that it will open a new research center in Austin, Texas. The facility, which will employ over 300 engineers and scientists, is expected to be operational by next spring. The company's CEO stated that the Austin location was chosen for its strong talent pool and proximity to major universities. The investment is estimated at 150 million dollars."},
  {id:"l4_08",voice:"M",text:"Are you looking for a reliable delivery service for your business? FastTrack Logistics offers same-day delivery in the metropolitan area and next-day delivery nationwide. With real-time tracking and a 99.5 percent on-time rate, you can trust us with your most important shipments. New customers get 20 percent off their first month. Visit fasttracklogistics.com or call 1-800-555-FAST to get started today."},
  {id:"l4_09",voice:"W",text:"Attention shoppers. Riverside Mall will be closing in 30 minutes, at 9 PM. Please make your final purchases and proceed to the exits. The parking garage will remain accessible for one hour after closing. We'd like to remind you that our annual summer sale starts this Saturday, with discounts of up to 50 percent at participating stores. Thank you for visiting Riverside Mall."},
  {id:"l4_10",voice:"M",text:"Thank you for calling Greenwood Medical Center. Our office hours are Monday through Friday, 8 AM to 6 PM, and Saturday from 9 AM to 1 PM. If this is a medical emergency, please hang up and dial 911. To schedule an appointment, press 1. For billing inquiries, press 2. For prescription refills, press 3. To speak with a receptionist, please hold and your call will be answered in the order it was received."},
  {id:"l4_11",voice:"W",text:"I'm pleased to announce that starting next month, all full-time employees will be eligible for our new professional development program. The company will cover up to $2,000 per year for approved courses, certifications, or conferences. To apply, submit a request through the HR portal at least two weeks before the start date. Managers must approve all requests. This is a great opportunity to invest in your career growth."},
  {id:"l4_12",voice:"M",text:"We're now approaching the financial district, which is the heart of the city's business community. The tall glass building on your left is the headquarters of National Bank, one of the oldest financial institutions in the country, founded in 1852. Directly ahead is City Hall, built in the neoclassical style. We'll stop here for 15 minutes so you can take photos. Please be back on the bus by 2:30."},
  {id:"l4_13",voice:"W",text:"Hi Mark, it's Lisa from the marketing team. I wanted to let you know that the print shop called about our brochures. They found a color mismatch on page three, so they've paused the job until we approve the correction. Could you take a look at the proof they emailed and give them the go-ahead? We need 5,000 copies by Thursday for the expo. Thanks."},
  {id:"l4_14",voice:"M",text:"Before we begin today's workshop, let me go over a few logistics. Restrooms are down the hall to the left. We'll take a 15-minute break at 10:30 and a one-hour lunch break at noon. The cafeteria on the second floor serves hot meals until 1:30. All workshop materials are in the folders on your desks. Please make sure you have a name tag — if not, see me after this introduction."},
  {id:"l4_15",voice:"W",text:"Introducing CloudDesk Pro, the all-in-one workspace solution for modern teams. With CloudDesk, your team can collaborate on documents, manage projects, and hold video meetings — all from a single platform. No more switching between five different apps. Start your free 30-day trial today at clouddesk.com. Plans start at just $8 per user per month. CloudDesk Pro — work smarter, together."},
  {id:"l4_16",voice:"M",text:"Good afternoon, everyone. I'd like to update you on the office renovation project. Phase one, which includes the reception area and the ground floor meeting rooms, has been completed ahead of schedule. Phase two — the open-plan workspace on the third floor — will begin next Monday and should take approximately four weeks. During this time, third-floor employees will be temporarily relocated to the fifth floor."},
  {id:"l4_17",voice:"W",text:"Good morning. Here's your Tuesday weather forecast. We're looking at cloudy skies this morning with temperatures around 12 degrees Celsius. Rain is expected to move in by early afternoon, with heavier showers between 3 and 6 PM. Winds will pick up to 40 kilometers per hour by evening. Wednesday should be drier, with partly sunny skies returning. Don't forget your umbrella today!"},
  {id:"l4_18",voice:"M",text:"Welcome to the Springfield Public Library automated system. The library is currently open. Today's hours are 9 AM to 8 PM. The book return drop box is available 24 hours a day at the main entrance. Please note that all overdue items must be returned by the end of this week to avoid additional fines. To renew a book, press 1 and enter your library card number. For event information, press 2."},
  {id:"l4_19",voice:"W",text:"As many of you are aware, we've been reviewing our environmental policy over the past few months. I'm happy to announce three new initiatives starting in January. First, we're eliminating single-use plastics from all office kitchens. Second, we'll be installing electric vehicle charging stations in the parking garage. And third, employees who cycle to work will receive a monthly wellness bonus of $50. More details will follow by email."},
  {id:"l4_20",voice:"M",text:"Ladies and gentlemen, thank you for joining us for the tenth annual Innovation Awards ceremony. Tonight we celebrate the most creative ideas and solutions from teams across the company. We received over 120 nominations this year, which is a new record. Before we announce the winners, I'd like to thank our sponsors, Meridian Technologies and GlobalBank, for making this event possible. Now, let's begin with the award for Best New Product."},
];

async function generateAudio(text, voiceId, outputPath) {
  const dir = path.dirname(outputPath);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  if (fs.existsSync(outputPath)) {
    console.log('  skip ' + path.basename(outputPath));
    return;
  }
  const response = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'xi-api-key': API_KEY },
    body: JSON.stringify({ text, model_id: 'eleven_multilingual_v2', voice_settings: { stability: 0.5, similarity_boost: 0.75, speed: 0.92 } }),
  });
  if (!response.ok) { console.error('  ERR ' + path.basename(outputPath) + ': ' + await response.text()); return; }
  const buffer = Buffer.from(await response.arrayBuffer());
  fs.writeFileSync(outputPath, buffer);
  console.log('  OK  ' + path.basename(outputPath) + ' (' + (buffer.length / 1024).toFixed(1) + ' KB)');
  await new Promise(r => setTimeout(r, DELAY_MS));
}

async function main() {
  console.log('\n=== Part 3 — Conversations ===\n');
  const base = path.join(__dirname, '..', 'public', 'audio');
  for (let i = 0; i < P3.length; i++) {
    const c = P3[i];
    console.log('[' + (i+1) + '/' + P3.length + '] ' + c.id);
    for (let j = 0; j < c.lines.length; j++) {
      const line = c.lines[j];
      const voice = VOICES[line.s];
      await generateAudio(line.t, voice, path.join(base, 'p3', c.id + '_line' + j + '.mp3'));
    }
  }
  console.log('\n=== Part 4 — Talks ===\n');
  for (let i = 0; i < P4.length; i++) {
    const t = P4[i];
    console.log('[' + (i+1) + '/' + P4.length + '] ' + t.id + ' (' + t.type + ')');
    await generateAudio(t.text, VOICES[t.voice], path.join(base, 'p4', t.id + '.mp3'));
  }
  console.log('\n=== Done! ===');
}

main().catch(console.error);
