// Lot P3/P4 du 2026-09-23 — BROUILLON à relire par Jérémy AVANT toute génération audio (crédits
// ElevenLabs). Hors banque : rien ne le joue tant qu'il n'est pas versé dans src/data/listening.js.
// Cible : les questions d'intention (« What does the man mean when he says, '...' ? », « Why does the
// speaker say, '...' ? »), absentes des 546 questions P3/P4 existantes alors que le TOEIC en pose ~5
// par test ; plus des conversations à trois et un graphique.
// Voix : P3 labels W/M/M2/W2 (1er caractère = genre) ; P4 `voice` suit la parité de l'id (impair M,
// pair W : rotation de generate-audio-p4-batch5.mjs). `x` : explication (pour les leçons de fin).

export var P3_DRAFT = [
  {id:"p3_89",lines:[
    {s:"W",t:"The printer on our floor jammed again this morning. That's the third time this week."},
    {s:"M",t:"I know. I called the service company, and they can't send a technician until next Wednesday."},
    {s:"W",t:"Next Wednesday? We have the annual report to print on Monday."},
    {s:"M",t:"Well, the design team downstairs just got a new printer. I'm sure they wouldn't mind."},
    {s:"W",t:"Good idea. I'll ask their manager if we can use it for a few hours on Monday."}],
    qs:[
      {q:"What problem are the speakers discussing?",opts:["A delivery is late","A machine keeps breaking down","A report contains errors","A meeting was canceled"],c:1,x:"'The printer on our floor jammed again... the third time this week.'"},
      {q:"What does the woman mean when she says, 'We have the annual report to print on Monday'?",opts:["She has already finished the report","The repair will come too late","She wants to reschedule a meeting","The report is not ready yet"],c:1,x:"The technician comes on Wednesday, after Monday: the repair is too late for the report."},
      {q:"What will the woman most likely do next?",opts:["Call the service company","Buy a new printer","Speak with another team's manager","Print the report at home"],c:2,x:"'I'll ask their manager if we can use it for a few hours on Monday.'"}]},
  {id:"p3_90",lines:[
    {s:"M",t:"Hi, this is Daniel from Brookside Consulting. I'd like to order lunch for twelve people for a meeting tomorrow at noon."},
    {s:"W",t:"Certainly. Our catering orders usually need forty-eight hours' notice, though."},
    {s:"M",t:"Oh. Our client only confirmed the meeting this morning."},
    {s:"W",t:"Let me check with the kitchen. We can do it if you choose from our sandwich menu. The hot dishes take longer to prepare."},
    {s:"M",t:"Sandwiches are fine. Could you also include one or two vegetarian options?"}],
    qs:[
      {q:"Why is the man calling?",opts:["To place a catering order","To book a table","To complain about a delivery","To change a meeting time"],c:0,x:"He wants 'to order lunch for twelve people for a meeting tomorrow.'"},
      {q:"Why does the man say, 'Our client only confirmed the meeting this morning'?",opts:["To ask for a discount","To cancel an earlier order","To explain why he is ordering late","To request a later delivery"],c:2,x:"He answers the 48-hour rule: he could not order earlier because the meeting was only just confirmed."},
      {q:"What does the woman say about the hot dishes?",opts:["They are more expensive","They take longer to prepare","They are not available tomorrow","They are only for large groups"],c:1,x:"'The hot dishes take longer to prepare.'"}]},
  {id:"p3_91",lines:[
    {s:"W",t:"Has everyone seen the floor plan for the new office? We move in on the fifteenth."},
    {s:"M",t:"I have. I noticed the sales team is on the third floor, but the meeting rooms are all on the fifth."},
    {s:"M2",t:"That's a lot of trips in the elevator. Our team meets clients almost every day."},
    {s:"W",t:"Hmm, you've got a point. The architect is coming in on Thursday, so let's raise it with her."},
    {s:"M",t:"I'll put together a list of how often each team uses the meeting rooms before then."}],
    qs:[
      {q:"What are the speakers mainly discussing?",opts:["A client complaint","A hiring plan","An elevator repair","The layout of a new office"],c:3,x:"They discuss the floor plan: the sales team is on the third floor, the meeting rooms on the fifth."},
      {q:"What does the woman mean when she says, 'you've got a point'?",opts:["She agrees there may be a problem","She wants the man to stop talking","She thinks the plan is final","She will move the sales team herself"],c:0,x:"She accepts the objection about the elevator trips and decides to raise it with the architect."},
      {q:"What will the first man do before Thursday?",opts:["Call the architect","Gather information about room use","Book a meeting room","Visit the new office"],c:1,x:"'I'll put together a list of how often each team uses the meeting rooms before then.'"}]},
  {id:"p3_92",lines:[
    {s:"W",t:"Excuse me, I'm checking out this morning. Does the hotel have a shuttle to the airport?"},
    {s:"M",t:"Yes, it leaves from the main entrance. What time is your flight?"},
    {s:"W",t:"Twelve forty. The airline recommends arriving two hours early."},
    {s:"M",t:"Then I'd take the one that leaves just after ten. It's about a thirty-minute drive at this time of day."},
    {s:"W",t:"Perfect. Could you keep my suitcase here until then?"}],
    qs:[
      {q:"Where does the conversation most likely take place?",opts:["At an airport","At a car rental office","At a hotel","At a train station"],c:2,x:"She is 'checking out this morning' and asks whether 'the hotel' has a shuttle."},
      {q:"Look at the graphic. Which shuttle will the woman most likely take?",opts:["9:15 A.M.","10:05 A.M.","10:50 A.M.","11:30 A.M."],c:1,
        graphic:{type:"table",title:"Airport Shuttle — Departures",headers:["Shuttle","Leaves hotel"],rows:[["1","9:15 A.M."],["2","10:05 A.M."],["3","10:50 A.M."],["4","11:30 A.M."]]},
        x:"'The one that leaves just after ten' is 10:05: with a 30-minute drive she arrives around 10:35, two hours before her 12:40 flight."},
      {q:"What does the woman ask the man to do?",opts:["Call a taxi","Change her flight","Keep her luggage","Print a receipt"],c:2,x:"'Could you keep my suitcase here until then?'"}]},
  {id:"p3_93",lines:[
    {s:"M",t:"Have you tried the new expense software yet? I submitted my travel receipts yesterday."},
    {s:"W",t:"I did. It's much faster than filling in the old spreadsheet. You just take a photo of each receipt."},
    {s:"M",t:"So you'd say it's perfect?"},
    {s:"W",t:"I wouldn't go that far. It still can't read handwritten receipts, so taxi receipts have to be typed in."},
    {s:"M",t:"Good to know. I have a few of those from my trip to Madrid."}],
    qs:[
      {q:"What are the speakers talking about?",opts:["A new expense system","A business trip schedule","A taxi company","A camera"],c:0,x:"They discuss 'the new expense software.'"},
      {q:"What does the woman imply when she says, 'I wouldn't go that far'?",opts:["She did not travel to Madrid","The old spreadsheet was better","She has not used the software","The software has a limitation"],c:3,x:"She will not call it perfect: 'It still can't read handwritten receipts.'"},
      {q:"What does the man say he has?",opts:["A new phone","Some handwritten receipts","A broken camera","A copy of the old spreadsheet"],c:1,x:"'I have a few of those': taxi receipts, which are handwritten."}]},
  {id:"p3_94",lines:[
    {s:"W",t:"The trade fair starts in two weeks. Where are we with the booth?"},
    {s:"W2",t:"The display panels arrived yesterday, but the banner still has last year's logo on it."},
    {s:"M",t:"I can have a new one printed by Friday if I send the file today."},
    {s:"W",t:"Then please send it. Also, who's staffing the booth on Saturday? That's usually our busiest day."},
    {s:"W2",t:"Leave that to me. I'll ask for volunteers at the team meeting this afternoon."}],
    qs:[
      {q:"What problem does the second woman mention?",opts:["Some panels are damaged","A banner is out of date","The booth is too small","The fair has been postponed"],c:1,x:"'The banner still has last year's logo on it.'"},
      {q:"What does the man offer to do?",opts:["Book a larger space","Design a new logo","Have a new banner printed","Work at the booth on Saturday"],c:2,x:"'I can have a new one printed by Friday.'"},
      {q:"What does the second woman mean when she says, 'Leave that to me'?",opts:["She will take care of finding staff","She wants to work alone","She will not attend on Saturday","She disagrees with the plan"],c:0,x:"She answers the question about staffing: she will find volunteers herself."}]},
  {id:"p3_95",lines:[
    {s:"W",t:"Hi, I'm calling about the lease for our shop on Elm Street. It ends next month, and we'd like to renew it."},
    {s:"M",t:"Of course. The new rate would be two thousand four hundred dollars a month, starting in March."},
    {s:"W",t:"That's not what I was told. Your colleague mentioned a price of two thousand two hundred."},
    {s:"M",t:"I'm sorry about the confusion. Let me look at the notes on your account, and I'll call you back within the hour."}],
    qs:[
      {q:"Why is the woman calling?",opts:["To report a repair","To open a new shop","To make a payment","To renew a lease"],c:3,x:"'It ends next month, and we'd like to renew it.'"},
      {q:"Why does the woman say, 'That's not what I was told'?",opts:["She wants to cancel the lease","She was given a lower price earlier","She did not receive a letter","She was told the shop was for sale"],c:1,x:"'Your colleague mentioned a price of two thousand two hundred', lower than the rate she just heard."},
      {q:"What will the man do next?",opts:["Visit the shop","Send a contract","Check the account notes","Lower the price immediately"],c:2,x:"'Let me look at the notes on your account.'"}]},
  {id:"p3_96",lines:[
    {s:"M",t:"Rachel, the Tokyo client just emailed. Their order still hasn't arrived, and they need it for a launch on Monday."},
    {s:"W",t:"The tracking shows it's stuck in customs. Kenji, you handled a customs delay last spring, didn't you?"},
    {s:"M2",t:"I did. Usually a missing invoice is the problem. I can call our agent in Osaka right now."},
    {s:"W",t:"Please do. And Tom, let the client know we're working on it, but don't promise a delivery date yet."},
    {s:"M",t:"Understood. I'll just say we'll update them by the end of the day."}],
    qs:[
      {q:"What is the problem?",opts:["A shipment has been delayed","A client canceled an order","An invoice was paid twice","A product launch was moved"],c:0,x:"The order 'still hasn't arrived' and is 'stuck in customs.'"},
      {q:"Why does the woman speak to Kenji?",opts:["He speaks with the client every day","He works in Osaka","He has dealt with a similar situation","He prepared the invoice"],c:2,x:"'You handled a customs delay last spring, didn't you?'"},
      {q:"What does the woman tell Tom not to do?",opts:["Contact the customs agent","Give the client a delivery date","Send another invoice","Email the client"],c:1,x:"'Don't promise a delivery date yet.'"}]},
];

export var P4_DRAFT = [
  {id:"p4_95",type:"Voicemail",voice:"M",text:"Hi, this is Marco Ricci from Ricci Home Renovations, returning your call about the kitchen project. I've looked at the photos you sent, and I can give you an estimate once I've measured the space. I'm free on Thursday morning or on Friday after three. Just so you know, the tiles you mentioned are very popular right now, so they may take a few weeks to arrive. If the timing matters, I can suggest a couple of alternatives that are in stock. Give me a call back at 555-0198 and let me know which day works.",
    qs:[
      {q:"Why is the speaker calling?",opts:["To return a customer's call","To cancel an appointment","To confirm a delivery","To request a payment"],c:0,x:"'Returning your call about the kitchen project.'"},
      {q:"Why does the speaker say, 'the tiles you mentioned are very popular right now'?",opts:["To recommend a different color","To warn that they could take time to arrive","To explain a price increase","To say they are no longer sold"],c:1,x:"He adds 'so they may take a few weeks to arrive' and offers alternatives in stock."},
      {q:"What does the speaker ask the listener to do?",opts:["Send more photos","Pay a deposit","Choose a day for a visit","Order the tiles online"],c:2,x:"'Let me know which day works': Thursday morning or Friday after three, to measure the space."}]},
  {id:"p4_96",type:"Tour",voice:"W",text:"Welcome to the Harlow Textile Mill. Before we begin, a quick note: the machines on the ground floor are still in use, so please stay behind the yellow lines. This mill opened in 1874 and at one time employed over two thousand workers. Today it produces fabric for a handful of fashion designers, using some of the original looms. Our tour lasts about an hour, and it ends in the gift shop, and yes, everything in it was made right here. Photography is welcome everywhere except the dyeing room, where the chemicals are sensitive to light. All right, follow me.",
    qs:[
      {q:"Where most likely are the listeners?",opts:["At a fashion show","At a museum of photography","At a clothing store","At a historic factory"],c:3,x:"A textile mill opened in 1874 that still produces fabric on its original looms."},
      {q:"Why are listeners asked to stay behind the yellow lines?",opts:["The floor is being cleaned","Machines are operating","Another group is ahead of them","The area is being repaired"],c:1,x:"'The machines on the ground floor are still in use.'"},
      {q:"What does the speaker imply when she says, 'everything in it was made right here'?",opts:["The products in the shop come from the mill","The gift shop is new","The fabric is expensive","Visitors can make their own fabric"],c:0,x:"'It' is the gift shop: its products were made in the mill the listeners are visiting."}]},
  {id:"p4_97",type:"Announcement",voice:"M",text:"Attention, passengers on Northline flight 318 to Lisbon. The aircraft has arrived, but the cleaning crew needs a little more time than usual, so boarding will begin about twenty minutes late, at eleven fifteen. We still expect to depart on time. Passengers traveling with small children or needing assistance are invited to board first. And please note: the overhead bins on this aircraft are smaller than usual. If you have a large carry-on bag, we can check it at the gate free of charge. Just see an agent at the desk.",
    qs:[
      {q:"Why will boarding begin late?",opts:["The flight crew is late","The weather is bad","The cabin is being cleaned","The gate has changed"],c:2,x:"'The cleaning crew needs a little more time than usual.'"},
      {q:"What does the speaker imply when he says, 'We still expect to depart on time'?",opts:["The flight may be canceled","The late boarding will not delay the flight","Passengers must hurry to the gate","A new departure time will be announced"],c:1,x:"Boarding starts twenty minutes late, but the departure itself should not change."},
      {q:"What are passengers with large bags encouraged to do?",opts:["Pay an extra fee","Put them under the seat","Board last","Have them checked at the gate"],c:3,x:"'We can check it at the gate free of charge.'"}]},
  {id:"p4_98",type:"Meeting excerpt",voice:"W",text:"Before we finish, I want to share the results of last month's customer survey. Overall satisfaction went up to eighty-six percent, which is our best result in three years. The one area that didn't improve was delivery times. Customers want their orders faster, and I can't say I blame them. So starting next month, we're partnering with a second courier in the northern region. I'd like each team leader to review the survey comments for their area and send me three suggestions by Friday. We'll discuss them at next week's meeting.",
    qs:[
      {q:"What is the speaker mainly discussing?",opts:["Survey results","A new product","A hiring plan","An office move"],c:0,x:"'I want to share the results of last month's customer survey.'"},
      {q:"What does the speaker mean when she says, 'I can't say I blame them'?",opts:["She thinks the customers are mistaken","She blames the courier company","She understands why customers want this","She cannot share the details"],c:2,x:"She finds the customers' wish for faster delivery reasonable, and announces a second courier."},
      {q:"What are team leaders asked to do by Friday?",opts:["Call some customers","Hire a courier","Prepare a presentation","Send three suggestions"],c:3,x:"'Send me three suggestions by Friday.'"}]},
  {id:"p4_99",type:"Advertisement",voice:"M",text:"Is your office chair giving you a sore back by lunchtime? At Ergoline, we design seating for people who work long hours. Our chairs adjust in five different ways, and every model comes with a ten-year guarantee. But don't take our word for it. Come and try them. This month, our showroom on Kingsway is open late on Thursdays, until nine, and businesses ordering ten chairs or more get free delivery and assembly. Visit ergoline.com to book a fitting with one of our specialists.",
    qs:[
      {q:"What is being advertised?",opts:["A medical clinic","Office chairs","A delivery service","A fitness program"],c:1,x:"Ergoline designs 'seating for people who work long hours.'"},
      {q:"Why does the speaker say, 'don't take our word for it'?",opts:["To invite listeners to test the product","To admit a mistake","To quote a customer","To criticize competitors"],c:0,x:"He follows it with 'Come and try them': listeners should judge for themselves in the showroom."},
      {q:"What is offered to businesses that order ten chairs or more?",opts:["A longer guarantee","A discount on desks","Free delivery and assembly","A private showroom visit"],c:2,x:"'Businesses ordering ten chairs or more get free delivery and assembly.' The ten-year guarantee comes with every chair."}]},
  {id:"p4_100",type:"News report",voice:"W",text:"In business news, the Carden Street Market will reopen on Saturday after a six-month renovation. The market, which dates back to the 1920s, now has a glass roof, heating, and space for forty additional stalls. City officials say the project came in under budget, which, frankly, doesn't happen very often. Market manager Laura Chen says most of the new stalls have already been rented to local food producers. To celebrate the reopening, there will be live music all weekend, and the first two hundred visitors on Saturday will receive a free shopping bag.",
    qs:[
      {q:"What is the report mainly about?",opts:["A new concert hall","A food festival","A city election","The reopening of a market"],c:3,x:"'The Carden Street Market will reopen on Saturday after a six-month renovation.'"},
      {q:"What does the speaker imply when she says, 'which, frankly, doesn't happen very often'?",opts:["Most public projects cost more than planned","The market rarely opens on Saturdays","City officials seldom speak to reporters","Few markets have a glass roof"],c:0,x:"The remark follows 'came in under budget': public projects usually go over budget."},
      {q:"What will some visitors receive on Saturday?",opts:["A concert ticket","A free shopping bag","A discount voucher","A food sample"],c:1,x:"'The first two hundred visitors on Saturday will receive a free shopping bag.'"}]},
  {id:"p4_101",type:"Orientation",voice:"M",text:"Good morning, and welcome to your first day at Bexley Pharmaceuticals. I'll walk you through our security procedures. Your badge opens the main doors and the floors your team works on. It does not open the laboratories. For those, you'll need to complete a safety course, which is scheduled for next Tuesday. If you lose your badge, report it at the front desk right away, and it can be deactivated in minutes. One more thing: visitors must be signed in at reception, even if they're just picking something up. I know it sounds strict, but it's what keeps our research safe. Now, let's get your photos taken.",
    qs:[
      {q:"Who most likely are the listeners?",opts:["Visitors to the company","Security guards","New employees","Delivery drivers"],c:2,x:"'Welcome to your first day at Bexley Pharmaceuticals.'"},
      {q:"What must listeners do before entering the laboratories?",opts:["Complete a safety course","Get a visitor pass","Have their photo taken","Sign in at reception"],c:0,x:"'For those, you'll need to complete a safety course.' The photos are for the badges."},
      {q:"Why does the speaker say, 'I know it sounds strict'?",opts:["To apologize for a delay","To announce a new policy","To warn about a penalty","To admit that a rule may seem excessive"],c:3,x:"He admits that signing in every visitor may seem too much, then gives the reason: it keeps the research safe."}]},
  {id:"p4_102",type:"Radio program",voice:"W",text:"Thanks for tuning in to Small Business Hour. My guest today is Omar Haddad, who turned a single food truck into a chain of twelve restaurants in under five years. When I asked him how he did it, he said, by listening to the people in the line. Omar will tell us how customer feedback shaped his menu, and why he still spends one day a month working in the kitchen. Later in the show, we'll take your questions, so send them in through our website. But first, a quick word from our sponsor.",
    qs:[
      {q:"Who is Omar Haddad?",opts:["A food critic","A restaurant owner","A radio host","A cooking teacher"],c:1,x:"He 'turned a single food truck into a chain of twelve restaurants.'"},
      {q:"According to the speaker, how did Mr. Haddad explain his success?",opts:["By opening in busy areas","By hiring experienced chefs","By paying attention to his customers","By lowering his prices"],c:2,x:"'By listening to the people in the line': the people waiting in line are his customers, and their feedback shaped his menu."},
      {q:"What will listeners hear next?",opts:["Questions from listeners","Mr. Haddad cooking a dish","A menu being read","An advertisement"],c:3,x:"'But first, a quick word from our sponsor.' Questions come 'later in the show.'"}]},
];
