// ─── PART 6 DATA ───
export var PART6_TEXTS = [
  { id:"p6t1", type:"Email", from:"HR Department", to:"All Staff", subject:"Annual Performance Reviews",
    parts:[
      {text:"Dear colleagues,\n\nWe are writing to inform you that the annual performance review process will begin on March 1st. All employees "},
      {blank:true,options:["who","which","whose","whom"],correct:0,x:"'Who' = relative pronoun for people as subject of the clause."},
      {text:" have completed at least six months of service are required to participate.\n\nYour direct supervisor will schedule a one-on-one meeting with you during the month of March. Please "},
      {blank:true,options:["prepare","preparation","prepared","preparatory"],correct:0,x:"'Please' + base verb (imperative). 'Please prepare'."},
      {text:" a brief summary of your key accomplishments from the past year. "},
      {blank:true,options:["In addition","However","Despite","Although"],correct:0,x:"'In addition' adds information. The next sentence adds another requirement."},
      {text:", you should identify two or three professional development goals for the coming year.\n\nIf you have any questions about the process, please contact the HR department. "},
      {blank:true,options:[
        "We look forward to a productive review season.",
        "The cafeteria will be closed for renovation.",
        "New parking regulations will take effect in April.",
        "The company was founded in 1987."
      ],correct:0,x:"Sentence insertion: must logically conclude an email about performance reviews."},
    ]},
  { id:"p6t2", type:"Memo", from:"Operations Manager", to:"Warehouse Staff", subject:"Updated Safety Procedures",
    parts:[
      {text:"To all warehouse personnel,\n\nEffective immediately, several changes to our safety procedures will be "},
      {blank:true,options:["implemented","implementing","implementation","implement"],correct:0,x:"Future passive: 'will be implemented'. Past participle needed after 'be'."},
      {text:". These updates are the result of the recent safety audit conducted last month.\n\nFirst, all employees must wear protective eyewear in Zones B and C at all times. Second, forklift operators are "},
      {blank:true,options:["required","requiring","requirement","require"],correct:0,x:"Passive: 'operators are required' (adjective/past participle after 'are')."},
      {text:" to complete a refresher course by March 15th. "},
      {blank:true,options:["Furthermore","Nevertheless","Although","Because"],correct:0,x:"'Furthermore' adds another requirement. The text lists additional safety measures."},
      {text:", emergency exit routes have been updated, and new signs will be installed this week.\n\n"},
      {blank:true,options:[
        "Compliance with these procedures is mandatory for all staff.",
        "The annual holiday party will be held on December 20th.",
        "We recommend trying the new restaurant across the street.",
        "Applications for the internship program are now open."
      ],correct:0,x:"Sentence insertion: must conclude a memo about mandatory safety procedures."},
    ]},
  { id:"p6t3", type:"Notice", from:"Building Management", to:"Tenants", subject:"Elevator Maintenance",
    parts:[
      {text:"Dear building tenants,\n\nPlease be advised that the elevators in Tower A will undergo scheduled maintenance from April 5th to April 8th. "},
      {blank:true,options:["During","While","Since","For"],correct:0,x:"'During' + noun phrase (this period). 'While' would need a clause."},
      {text:" this period, only the service elevator will be operational.\n\nWe "},
      {blank:true,options:["sincerely","sincere","sincerity","sincerer"],correct:0,x:"'We sincerely apologize' — adverb modifies the verb 'apologize'."},
      {text:" apologize for any inconvenience this may cause. Tenants on floors 15 and above are "},
      {blank:true,options:["encouraged","encouraging","encouragement","encourage"],correct:0,x:"Passive: 'are encouraged' to use the stairs or plan accordingly."},
      {text:" to allow extra time for their commute during the maintenance window.\n\n"},
      {blank:true,options:[
        "We appreciate your patience and understanding.",
        "The building was constructed in 2015.",
        "Several new restaurants have opened in the area.",
        "The company's stock price rose by 3% yesterday."
      ],correct:0,x:"Sentence insertion: polite closing for a building notice about inconvenience."},
    ]},
  { id:"p6t4", type:"Email", from:"Marketing Director", to:"Sales Team", subject:"Q3 Campaign Launch",
    parts:[
      {text:"Hello team,\n\nI am pleased to announce that our Q3 marketing campaign will officially launch on July 1st. After months of "},
      {blank:true,options:["carefully","careful","care","caring"],correct:1,x:"'Months of ___ planning' — adjective needed before noun 'planning'. 'Careful planning'."},
      {text:" planning, we are confident that this campaign will significantly boost brand awareness in the European market.\n\nEach regional manager is responsible "},
      {blank:true,options:["for","of","to","with"],correct:0,x:"'Responsible for' = fixed collocation with 'for'."},
      {text:" coordinating local promotional events. "},
      {blank:true,options:["Therefore","Despite","However","In spite of"],correct:0,x:"'Therefore' = consequence. Because managers are responsible, they need to submit plans."},
      {text:", please submit your event proposals to me by June 15th.\n\n"},
      {blank:true,options:[
        "Let's make Q3 our best quarter yet!",
        "The office will be closed on national holidays.",
        "Please remember to update your email signatures.",
        "Parking spaces are assigned on a first-come basis."
      ],correct:0,x:"Sentence insertion: motivational closing for a campaign launch email."},
    ]},
  { id:"p6t5", type:"Letter", from:"Customer Service", to:"Mr. Harrison", subject:"Regarding Your Recent Order",
    parts:[
      {text:"Dear Mr. Harrison,\n\nThank you for contacting us regarding your recent order (#45892). We have "},
      {blank:true,options:["looked into","looked up","looked over","looked after"],correct:0,x:"'Looked into' = investigated. They investigated the issue he raised."},
      {text:" the matter and would like to offer our sincere apologies for the inconvenience.\n\nUnfortunately, the item you ordered is currently out of stock. "},
      {blank:true,options:["However","Although","Despite","Because"],correct:0,x:"'However' introduces a contrast/solution. The item is unavailable BUT we offer alternatives."},
      {text:", we would be happy to offer you a full refund or a replacement with a "},
      {blank:true,options:["comparable","comparably","comparison","compare"],correct:0,x:"Adjective before noun: 'a comparable product'. 'Comparable' = adjective."},
      {text:" product at no additional cost.\n\n"},
      {blank:true,options:[
        "Please let us know which option you prefer, and we will process it immediately.",
        "Our company was established in 1995 by two college friends.",
        "We are currently hiring for several positions in our London office.",
        "The weather forecast predicts rain for the rest of the week."
      ],correct:0,x:"Sentence insertion: must ask the customer to choose and promise action."},
    ]},
  { id:"p6t6", type:"Memo", from:"IT Department", to:"All Departments", subject:"System Migration",
    parts:[
      {text:"Attention all staff,\n\nThe IT department will be migrating our email servers to a new platform this weekend. The migration is scheduled to "},
      {blank:true,options:["take","bring","make","hold"],correct:0,x:"'Take place' = happen/occur. Fixed collocation."},
      {text:" place between Saturday 8:00 AM and Sunday 6:00 PM. During this time, email services will be "},
      {blank:true,options:["temporarily","temporary","temporal","temp"],correct:0,x:"Adverb modifies adjective/state: 'temporarily unavailable'. Adverb needed."},
      {text:" unavailable.\n\nWe strongly recommend that all employees save any important emails "},
      {blank:true,options:["prior to","despite","although","while"],correct:0,x:"'Prior to' + noun = before. 'Prior to the migration' = before the migration happens."},
      {text:" the migration. "},
      {blank:true,options:[
        "We will send a confirmation email once the migration is complete.",
        "The company picnic has been moved to September.",
        "New business cards can be ordered through the online portal.",
        "The CEO will be traveling to Asia next month."
      ],correct:0,x:"Sentence insertion: logical follow-up promising communication after IT maintenance."},
    ]},
  { id:"p6t7", type:"Email", from:"Training Coordinator", to:"New Hires", subject:"Welcome to Pinnacle Corp",
    parts:[
      {text:"Dear new team members,\n\nWelcome to Pinnacle Corporation! We are delighted to have you join us. Your first week will "},
      {blank:true,options:["consist","consist of","consisting","consisted"],correct:1,x:"'Consist of' = be made up of. Fixed verb + preposition."},
      {text:" orientation sessions, department introductions, and IT setup.\n\nPlease arrive at the main reception by 8:30 AM on Monday. A member of HR will be there to "},
      {blank:true,options:["greet","greeting","greeted","greets"],correct:0,x:"'To greet' — infinitive after 'to'. Purpose construction."},
      {text:" you and escort you to the training room. "},
      {blank:true,options:["Meanwhile","Nevertheless","For example","In addition"],correct:3,x:"'In addition' adds more information. The next sentence adds another requirement."},
      {text:", please bring a valid photo ID and your signed employment contract.\n\n"},
      {blank:true,options:[
        "We look forward to working with you!",
        "The parking garage is being repainted this week.",
        "Last quarter's revenue exceeded expectations.",
        "The cafeteria menu changes daily."
      ],correct:0,x:"Sentence insertion: warm closing for a welcome email."},
    ]},
  { id:"p6t8", type:"Notice", from:"Facilities Management", to:"All Staff", subject:"Office Relocation",
    parts:[
      {text:"Please be informed that the Marketing and Sales departments will be "},
      {blank:true,options:["relocating","relocated","relocation","relocate"],correct:1,x:"Passive: departments will be 'relocated'. Past participle after 'will be'."},
      {text:""},
      {blank:true,options:["necessary","necessarily","necessity","necessitate"],correct:0,x:"'The move is necessary' — adjective after 'is'."},
      {text:" to accommodate the expansion of the R&D team on the second floor. "},
      {blank:true,options:["As a result","Although","Despite","While"],correct:0,x:"'As a result' = consequence. Because of the expansion, the move happens."},
      {text:", some temporary disruption is expected during the transition.\n\n"},
      {blank:true,options:[
        "Packing supplies will be distributed to affected departments next week.",
        "The company picnic is planned for June.",
        "New printers have been ordered for the copy room.",
        "Employee birthdays are celebrated on the last Friday of each month."
      ],correct:0,x:"Sentence insertion: practical next step related to the office move."},
    ]},
  { id:"p6t9", type:"Email", from:"James Morton, CFO", to:"Department Heads", subject:"Budget Freeze",
    parts:[
      {text:"Dear colleagues,\n\nDue to "},
      {blank:true,options:["uncertainty","uncertain","uncertainly","uncertainties"],correct:1,x:"'Due to uncertain market conditions' — adjective modifying 'market conditions'."},
      {text:" market conditions, the executive committee has decided to implement a temporary budget freeze across all departments.\n\nThis means that all non-essential expenditures must be "},
      {blank:true,options:["approved","approving","approval","approve"],correct:0,x:"Passive: expenditures must be 'approved'. Past participle after modal passive."},
      {text:" by the CFO's office before processing. Essential operating costs, including salaries and contractual obligations, will not be "},
      {blank:true,options:["affected","affecting","effect","affection"],correct:0,x:"Passive: 'will not be affected'. Past participle."},
      {text:". "},
      {blank:true,options:[
        "I understand this may cause some inconvenience, and I appreciate your cooperation.",
        "Our new logo was designed by an external agency.",
        "The holiday schedule has been posted in the break room.",
        "Please welcome our new intern, Sarah."
      ],correct:0,x:"Sentence insertion: empathetic closing acknowledging the difficulty of budget cuts."},
    ]},
  { id:"p6t10", type:"Letter", from:"Event Planning Co.", to:"Ms. Nakamura", subject:"Corporate Event Confirmation",
    parts:[
      {text:"Dear Ms. Nakamura,\n\nThank you for choosing GrandView Events for your upcoming corporate retreat. This letter "},
      {blank:true,options:["confirms","confirming","confirmation","confirmed"],correct:0,x:"Present simple: 'This letter confirms' = formal statement of fact."},
      {text:" your reservation for September 12-14 at the Lakeside Conference Center.\n\nAs discussed, the package includes accommodation for 45 guests, three meeting rooms, and full catering. "},
      {blank:true,options:["However","Therefore","In addition","Despite"],correct:0,x:"'However' introduces a contrast or caveat. Next sentence has a condition."},
      {text:", please note that the outdoor terrace is subject to "},
      {blank:true,options:["available","availability","avail","availably"],correct:1,x:"'Subject to availability' — noun after 'to'. Fixed expression."},
      {text:" and weather conditions.\n\n"},
      {blank:true,options:[
        "Please find the detailed invoice attached for your review.",
        "We recently renovated our swimming pool.",
        "Our restaurant received a five-star rating last year.",
        "The nearest airport is approximately 20 km away."
      ],correct:0,x:"Sentence insertion: business-like next step for a booking confirmation."},
    ]},
  { id:"p6t11", type:"Memo", from:"Quality Assurance", to:"Production Team", subject:"Product Recall",
    parts:[
      {text:"A quality issue has been identified in Batch #4872 of the ProMax 500 series. "},
      {blank:true,options:["Following","Followed","Follow","Follows"],correct:0,x:"'Following' = after/as a result of. Preposition + noun phrase."},
      {text:" an internal investigation, it was determined that a faulty component from a third-party supplier caused the defect.\n\nAll units from this batch must be "},
      {blank:true,options:["withdrawal","withdrawing","withdrawn","withdrew"],correct:2,x:"Passive: 'must be withdrawn'. Past participle of 'withdraw'."},
      {text:" from sale immediately. The supplier has been notified and has agreed to cover all "},
      {blank:true,options:["associated","associating","association","associate"],correct:0,x:"'Associated costs' — adjective modifying 'costs'. Past participle as adjective."},
      {text:" costs.\n\n"},
      {blank:true,options:[
        "Please begin the recall process today and report progress by Friday.",
        "The company holiday party was a great success.",
        "New vending machines have been installed in the break room.",
        "Our CEO will be featured in next month's business magazine."
      ],correct:0,x:"Sentence insertion: action-oriented closing for an urgent recall memo."},
    ]},
  { id:"p6t12", type:"Email", from:"Customer Relations", to:"Valued Customers", subject:"Service Update",
    parts:[
      {text:"Dear valued customers,\n\nWe are writing to inform you of an important update to our service terms, "},
      {blank:true,options:["effective","effectively","effectiveness","effect"],correct:0,x:"'Effective June 1' — adjective meaning 'coming into force'."},
      {text:" June 1, 2026.\n\nTo enhance your experience, we will be introducing a new tiered pricing model. Customers who "},
      {blank:true,options:["currently","current","currency","occurring"],correct:0,x:"'Customers who currently subscribe' — adverb modifying the verb 'subscribe'."},
      {text:" subscribe to our Premium plan will be automatically upgraded to Premium Plus at no additional charge. "},
      {blank:true,options:["Nevertheless","Furthermore","Because","Although"],correct:0,x:"'Nevertheless' = despite that. Next sentence introduces a less positive point after the good news."},
      {text:", Basic plan subscribers will see a modest rate adjustment of $2.99 per month.\n\n"},
      {blank:true,options:[
        "For a full comparison of the new plans, please visit our website.",
        "Our office is located at 123 Commerce Street.",
        "We are proud to sponsor the local football team.",
        "The company was named 'Best Employer' in 2024."
      ],correct:0,x:"Sentence insertion: directs customers to find more details about the change."},
    ]},
  // ─── BATCH 2 (p6t13–p6t16) ───
  { id:"p6t13", type:"Email", from:"Logistics Director", to:"Regional Managers", subject:"Updated Shipping Policy",
    parts:[
      {text:"Dear regional managers,\n\nI am writing to inform you of changes to our shipping policy that will take effect on May 1st. After reviewing our logistics costs over the past two quarters, we have decided to consolidate our carrier partnerships to improve "},
      {blank:true,options:["efficiency","efficient","efficiently","efficiencies"],correct:0,x:"Noun needed after 'improve'. 'Improve efficiency' = verb + noun collocation."},
      {text:" and reduce delivery times.\n\nEffective immediately, all domestic shipments under 20 kg will be handled exclusively by SwiftLine Logistics. International orders will continue to be processed through GlobalFreight, "},
      {blank:true,options:["which","who","whose","whom"],correct:0,x:"'Which' for things (GlobalFreight is a company). Non-defining relative clause with comma."},
      {text:" has offered us a 12% volume discount for the coming year. "},
      {blank:true,options:["As a result","On the other hand","Although","In spite of"],correct:0,x:"'As a result' = consequence. The discount leads to the next point about savings."},
      {text:", we expect to save approximately $180,000 annually on shipping costs.\n\n"},
      {blank:true,options:[
        "Please update your teams and ensure all pending orders are routed through the new system by April 28.",
        "Our company picnic has been rescheduled to the last Saturday of June.",
        "The new employee parking policy will be announced separately.",
        "Quarterly earnings exceeded analyst expectations this year."
      ],correct:0,x:"Sentence insertion: must give a practical next step related to the shipping policy change."},
    ]},
  { id:"p6t14", type:"Letter", from:"Grand Meridian Hotel", to:"Ms. Takahashi, Brightwell Corp.", subject:"Annual Gala Booking Confirmation",
    parts:[
      {text:"Dear Ms. Takahashi,\n\nThank you for choosing the Grand Meridian Hotel for your company's annual gala dinner on Saturday, December 13. We are pleased to confirm your reservation for the Crystal Ballroom, which can "},
      {blank:true,options:["accommodate","accommodation","accommodating","accommodated"],correct:0,x:"Modal 'can' + base verb. 'Can accommodate' = verb form needed."},
      {text:" up to 250 guests.\n\nAs discussed, the event will begin with a cocktail reception at 6:30 PM, followed by a three-course dinner at 7:30 PM. Our executive chef will prepare a customized menu based on the preferences you "},
      {blank:true,options:["submitted","submitting","submit","have submitting"],correct:0,x:"Past simple: 'the preferences you submitted' — completed past action. The preferences were sent earlier."},
      {text:" last week. Vegetarian, vegan, and gluten-free options will be available for guests with dietary restrictions.\n\n"},
      {blank:true,options:["Additionally","However","Therefore","Despite"],correct:0,x:"'Additionally' adds another service. The hotel is listing extra offerings."},
      {text:", complimentary valet parking will be provided for all attendees, and a dedicated event coordinator will be on site throughout the evening.\n\n"},
      {blank:true,options:[
        "Please confirm the final guest count by December 1 so that we can finalize seating arrangements.",
        "The hotel was originally built in 1928 and has 340 rooms.",
        "Our spa offers a wide range of treatments for hotel guests.",
        "Checkout time for overnight guests is 11 AM."
      ],correct:0,x:"Sentence insertion: must request practical information (guest count) to finalize the event."},
    ]},
  { id:"p6t15", type:"Memo", from:"Chief Operating Officer", to:"All Staff", subject:"Revised Remote Work Policy",
    parts:[
      {text:"To all employees,\n\nFollowing the results of our recent employee satisfaction survey, we are pleased to announce a revised remote work policy, effective January 15.\n\nEmployees in eligible roles may now work from home up to three days per week, an increase from the "},
      {blank:true,options:["previous","previously","preceding","prevail"],correct:0,x:"Adjective before noun: 'the previous limit'. 'Previously' is an adverb and doesn't fit before a noun."},
      {text:" limit of one day. To qualify, employees must have completed their probationary period and received a satisfactory rating on their most recent performance review.\n\nManagers are responsible for "},
      {blank:true,options:["ensuring","ensure","ensured","to ensure"],correct:0,x:"'Responsible for' + gerund (-ing). 'Responsible for ensuring' = preposition + gerund."},
      {text:" that team schedules are coordinated so that adequate office coverage is maintained on all business days. "},
      {blank:true,options:["Nevertheless","Furthermore","Because","Although"],correct:1,x:"'Furthermore' adds another point. The memo continues listing requirements."},
      {text:", all remote employees must be available via email and messaging platforms during core business hours (9 AM – 4 PM).\n\n"},
      {blank:true,options:[
        "Detailed guidelines and a remote work agreement form are available on the HR portal.",
        "The company cafeteria now offers a new breakfast menu starting at 7:30 AM.",
        "Parking permits for the new garage must be renewed by March 1.",
        "Our annual charity fundraiser raised over $25,000 last year."
      ],correct:0,x:"Sentence insertion: must direct employees to practical resources about the remote work policy."},
    ]},
  { id:"p6t16", type:"Notice", from:"Professional Development Board", to:"All Certified Members", subject:"Certification Renewal Requirements",
    parts:[
      {text:"Dear certified members,\n\nThis is a reminder that your professional certification must be renewed every three years. Members whose certifications expire in 2026 must complete the renewal process by December 31.\n\nTo renew, you are required to "},
      {blank:true,options:["demonstrate","demonstration","demonstrative","demonstrably"],correct:0,x:"'Required to' + base verb (infinitive). 'Required to demonstrate'."},
      {text:" a minimum of 40 hours of continuing education. Approved activities include workshops, online courses, and industry conferences. A full list of accredited providers is available on our website.\n\nThe renewal fee is $175 for standard members and $95 for "},
      {blank:true,options:["those","them","their","they"],correct:0,x:"'Those' = demonstrative pronoun replacing 'members'. 'Those who qualify' is formal register."},
      {text:" who qualify for the reduced rate based on years of membership. "},
      {blank:true,options:["In contrast","For instance","Consequently","In other words"],correct:2,x:"'Consequently' = as a result. Failure to renew has a consequence explained in the next sentence."},
      {text:", members who do not complete the renewal process by the deadline will have their certification status changed to 'inactive' and will need to retake the qualifying examination.\n\n"},
      {blank:true,options:[
        "For questions about the renewal process, please contact the certification office at certify@pdboard.org.",
        "Our annual awards ceremony will take place in March at the Riverside Convention Center.",
        "The board was founded in 1992 by a group of industry professionals.",
        "Office supplies can be ordered through the new procurement system."
      ],correct:0,x:"Sentence insertion: must provide a contact for questions about the certification renewal."},
    ]},
	// ─── NEW PART 6 TEXTS (p6t17–p6t20) — paste after last entry in PART6_TEXTS ───
// Types: Advertisement, Article, Report, Instructions

  { id:"p6t17", type:"Advertisement", from:"GreenTech Solutions", to:"", subject:"Smart Energy for Modern Businesses",
    parts:[
      {text:"Are you looking for ways to reduce your company's energy costs? GreenTech Solutions offers cutting-edge solar panel systems "},
      {blank:true,options:["designed","designing","design","designer"],correct:0,x:"Past participle as adjective: 'systems designed for...' (= which were designed)."},
      {text:" specifically for commercial buildings.\n\nOur systems are easy to install and require minimal maintenance. Businesses that have switched to GreenTech "},
      {blank:true,options:["have reported","reporting","reports","are reporting"],correct:0,x:"Present perfect: 'Businesses that have switched... HAVE REPORTED'. Result visible now."},
      {text:" energy savings of up to 40% within the first year. "},
      {blank:true,options:["Moreover","Although","Despite","Unless"],correct:0,x:"'Moreover' adds a benefit. The ad lists advantages one after another."},
      {text:", all installations come with a 10-year warranty and free annual inspections.\n\n"},
      {blank:true,options:[
        "Contact us today for a free consultation and site assessment.",
        "Our CEO will retire at the end of the fiscal year.",
        "The company's main warehouse is located in New Jersey.",
        "Employees must complete their timesheets by Friday."
      ],correct:0,x:"Sentence insertion: a call to action is the natural ending for an advertisement."},
    ]},

  { id:"p6t18", type:"Article", from:"Business Weekly", to:"", subject:"Remote Work: The New Standard?",
    parts:[
      {text:"A recent survey conducted by the Global Workforce Institute reveals that more than 60% of companies plan to offer permanent remote work options. The shift, which "},
      {blank:true,options:["accelerated","was accelerated","accelerating","has accelerating"],correct:1,x:"Passive: 'which WAS ACCELERATED by the pandemic'. The pandemic accelerated the shift."},
      {text:" by the global pandemic, has fundamentally changed how organizations think about office space.\n\nMany employees have expressed a strong "},
      {blank:true,options:["prefer","preference","preferably","preferred"],correct:1,x:"Article + adjective + NOUN: 'a strong preference'. Noun needed after 'a strong'."},
      {text:" for hybrid work arrangements. Productivity data from several major firms supports this trend. "},
      {blank:true,options:["Nevertheless","Because of","In addition","So that"],correct:0,x:"'Nevertheless' introduces a counterpoint: despite positive data, there are also concerns."},
      {text:", some managers remain concerned about team cohesion and the difficulty of maintaining company culture remotely.\n\n"},
      {blank:true,options:[
        "The debate over remote work policies is likely to continue for years to come.",
        "The company picnic will be held in Central Park this Saturday.",
        "Flights to Tokyo are currently available at discounted rates.",
        "The new cafeteria menu features several vegetarian options."
      ],correct:0,x:"Sentence insertion: a forward-looking conclusion fits an article discussing an ongoing trend."},
    ]},

  { id:"p6t19", type:"Report", from:"Quality Assurance Department", to:"Senior Management", subject:"Annual Product Quality Report",
    parts:[
      {text:"This report summarizes the findings of the quality audits conducted across all manufacturing facilities during the last fiscal year.\n\nOverall, product defect rates have decreased "},
      {blank:true,options:["significantly","significant","significance","signify"],correct:0,x:"Adverb modifying the verb 'have decreased'. 'Decreased significantly'."},
      {text:" compared to the previous year, dropping from 3.2% to 1.8%. This improvement is largely "},
      {blank:true,options:["attributed","attributing","attributable","attribution"],correct:2,x:"'Attributable to' = adjective + preposition. 'This improvement is attributable to...'"},
      {text:" to the new automated inspection systems installed in Q2. "},
      {blank:true,options:["However","Furthermore","As a result","In addition to"],correct:0,x:"'However' introduces a concern despite the good news. Contrast connector."},
      {text:", two facilities — Plant C in Mexico and Plant F in Vietnam — continue to show defect rates above the acceptable threshold.\n\n"},
      {blank:true,options:[
        "We recommend targeted audits and additional staff training at these locations.",
        "The holiday schedule has been posted on the company intranet.",
        "Several employees will attend the trade fair in Berlin next month.",
        "The parking lot will be resurfaced during the first week of August."
      ],correct:0,x:"Sentence insertion: a recommendation logically concludes a quality report highlighting issues."},
    ]},

  { id:"p6t20", type:"Instructions", from:"IT Department", to:"All Employees", subject:"Setting Up Two-Factor Authentication",
    parts:[
      {text:"As part of our ongoing efforts to strengthen data security, all employees are now required to enable two-factor authentication (2FA) on their company accounts.\n\nTo set up 2FA, first log in to your account and navigate to the Security Settings page. Then, click on 'Enable Two-Factor Authentication' and follow the "},
      {blank:true,options:["on-screen","on-screening","on-screened","on-screens"],correct:0,x:"Compound adjective: 'on-screen prompts'. Adjective modifying 'prompts'."},
      {text:" prompts to link your mobile device. You will need to download an authenticator app "},
      {blank:true,options:["prior to","while","during","until"],correct:0,x:"'Prior to' + noun/-ing = before. 'Prior to completing the setup.'"},
      {text:" completing the setup process. "},
      {blank:true,options:["Once","Despite","Unless","Although"],correct:0,x:"'Once' = when/after. 'Once 2FA is enabled, you will need...' Time clause."},
      {text:" 2FA is enabled, you will be asked to enter a verification code each time you log in from an unrecognized device.\n\n"},
      {blank:true,options:[
        "If you experience any difficulties, please contact the IT helpdesk at extension 500.",
        "The company holiday party will be held on December 15th.",
        "Our stock price has increased by 12% this quarter.",
        "New office chairs will be delivered to all departments next week."
      ],correct:0,x:"Sentence insertion: a support/contact line naturally concludes setup instructions."},
    ]},
	
	{ id:"p6t21", type:"Email", from:"Project Manager", to:"Development Team", subject:"Sprint Planning Update",
  parts:[
    {text:"Hi team,\n\nI hope this email finds you well. I'm writing to confirm the details for next week's sprint planning session, "},
    {blank:true,options:["what","where","which","who"],correct:2,x:"'Which' = relative pronoun for things. Refers back to 'session'."},
    {text:" will take place on Monday at ten in the morning. As usual, we'll be meeting in the Blue Room on the third floor.\n\nBefore the meeting, please "},
    {blank:true,options:["reviewing","review","reviewed","reviews"],correct:1,x:"'Please' + base verb (imperative form). 'Please review'."},
    {text:" the backlog items assigned to you and come prepared with effort estimates. "},
    {blank:true,options:["Moreover","However","Nevertheless","Because"],correct:0,x:"'Moreover' adds information. The next sentence adds another piece of preparation."},
    {text:", please flag any blockers or dependencies you've identified so we can address them early.\n\n"},
    {blank:true,options:[
      "The vending machine is currently out of order.",
      "Our new logo was unveiled last Friday.",
      "Looking forward to a productive session.",
      "The quarterly financials will be audited soon."
    ],correct:2,x:"Sentence insertion: logical closing for an email about an upcoming meeting."}]},
{ id:"p6t22", type:"Memo", from:"Facilities Manager", to:"All Employees", subject:"Parking Lot Repainting",
  parts:[
    {text:"To all employees,\n\nPlease be aware that the north parking lot will be closed from Saturday morning "},
    {blank:true,options:["from","to","until","since"],correct:2,x:"'From Saturday morning until Sunday evening' = duration with a clear endpoint."},
    {text:" Sunday evening for repainting of the parking lines and handicap spaces. During this period, all vehicles "},
    {blank:true,options:["must be moved","must moving","must to move","must moves"],correct:0,x:"Modal 'must' + passive infinitive 'be moved'. Subject 'vehicles' receives the action."},
    {text:" to the south lot or the visitor area on Grove Street.\n\nAny vehicles remaining in the north lot after Friday at six in the evening will be towed at the owner's expense. "},
    {blank:true,options:["Regardless","Unfortunately","Consequently","Despite"],correct:2,x:"'Consequently' = as a result. The towing is the direct consequence of the previous warning."},
    {text:", we strongly recommend moving your car before leaving on Friday.\n\n"},
    {blank:true,options:[
      "The company picnic has been rescheduled to July.",
      "We appreciate your cooperation during this brief inconvenience.",
      "Overtime pay rules have changed this month.",
      "New desk chairs will arrive by the end of the quarter."
    ],correct:1,x:"Sentence insertion: polite closing for a notice about facilities work."}]},
{ id:"p6t23", type:"Notice", from:"Library Administration", to:"All Members", subject:"Extended Opening Hours",
  parts:[
    {text:"Dear library members,\n\nWe are delighted to announce that, "},
    {blank:true,options:["because of","in spite of","instead of","due to"],correct:3,x:"'Due to' = because of (formal). Introduces the reason for the positive change."},
    {text:" popular demand, the Central Library will be extending its opening hours starting next month. The library "},
    {blank:true,options:["will open","will be opened","opens","has opened"],correct:0,x:"Future simple active: 'The library will open' (habitual future state). 'Will be opened' is passive and awkward here."},
    {text:" one hour earlier on weekdays and will remain open until ten in the evening on Thursdays and Fridays.\n\nThese new hours are designed to better accommodate students and working professionals "},
    {blank:true,options:["whose","who","which","whom"],correct:1,x:"'Who' = relative pronoun for people as subject of the clause ('who cannot visit')."},
    {text:" cannot visit during traditional daytime hours.\n\n"},
    {blank:true,options:[
      "The annual fundraising gala will take place in November.",
      "Please note that late returns incur a small fee.",
      "We hope these changes make our services more accessible to you.",
      "Our membership fees will increase starting next year."
    ],correct:2,x:"Sentence insertion: matches the positive, accommodating tone of the announcement."}]},
{ id:"p6t24", type:"Letter", from:"Ashford Insurance", to:"Ms. Delacroix", subject:"Policy Renewal Notice",
  parts:[
    {text:"Dear Ms. Delacroix,\n\nWe are writing to remind you that your home insurance policy "},
    {blank:true,options:["expiring","expires","expired","expiration"],correct:1,x:"Simple present for scheduled future events: 'your policy expires on June 30'."},
    {text:" on June 30. To ensure continuous coverage, please renew before this date.\n\nYour renewal premium for the coming year is four hundred and twenty dollars, which represents a "},
    {blank:true,options:["slight","slightly","slighted","slightness"],correct:0,x:"Adjective modifying the noun 'increase'. 'A slight increase' (not the adverb 'slightly')."},
    {text:" increase of two percent compared to last year. This small adjustment reflects rising repair costs in your region.\n\n"},
    {blank:true,options:["Enclosed","Enclosing","To enclose","Enclose"],correct:0,x:"Past participle as adjective/adverbial: 'Enclosed you will find' = 'Attached is'. Common formal opener."},
    {text:" you will find the full policy document and a prepaid return envelope for your convenience.\n\n"},
    {blank:true,options:[
      "Our office will close for renovations in August.",
      "We have recently launched a new mobile app.",
      "A customer survey will be emailed to you separately.",
      "Thank you for your continued trust in Ashford Insurance."
    ],correct:3,x:"Sentence insertion: standard polite closing for a formal business letter."}]},
{ id:"p6t25", type:"Instructions", from:"Building Security", to:"All Personnel", subject:"New Access Card System",
  parts:[
    {text:"Please read these instructions carefully before using the new access card system, "},
    {blank:true,options:["which","when","where","what"],correct:0,x:"'Which' = relative pronoun introducing a non-defining clause about 'system'."},
    {text:" was installed last weekend. To enter the building, simply hold your card within three centimeters of the reader.\n\nThe green light confirms access; a red light "},
    {blank:true,options:["indicating","indicated","indicates","indication"],correct:2,x:"Simple present, third person singular: 'a red light indicates' (the system's behavior)."},
    {text:" that your card is either inactive or not registered for that door. "},
    {blank:true,options:["If","Unless","Whenever","Although"],correct:0,x:"'If' introduces a conditional. 'If this happens, contact security' — standard conditional instruction."},
    {text:" this happens, please contact the security desk on the ground floor.\n\n"},
    {blank:true,options:[
      "The holiday schedule has been posted on the intranet.",
      "Lost or stolen cards must be reported immediately.",
      "Coffee machines on each floor have been replaced.",
      "Annual fire drill practice will resume in September."
    ],correct:1,x:"Sentence insertion: logically extends security instructions about access cards."}]},
{ id:"p6t26", type:"Email", from:"Travel Coordinator", to:"Sales Team", subject:"Conference Travel Arrangements",
  parts:[
    {text:"Dear team,\n\nI'm writing with details about the upcoming sales conference in Barcelona. All flights and hotel reservations "},
    {blank:true,options:["has been booked","have been booked","are booking","being booked"],correct:1,x:"Present perfect passive, plural subject: 'flights and hotels have been booked'."},
    {text:" through the company's travel portal. You should have received your individual confirmation emails by now.\n\nThe conference hotel is located "},
    {blank:true,options:["at","in","within","on"],correct:3,x:"'On' + street name: 'located on Rambla Avenue' (standard English preposition for street addresses)."},
    {text:" Rambla Avenue, approximately fifteen minutes from the venue by metro. "},
    {blank:true,options:["Although","Since","Despite","Yet"],correct:1,x:"'Since' = because. Gives the reason the shuttle won't be provided."},
    {text:" the metro is convenient and reliable, no shuttle service will be provided.\n\n"},
    {blank:true,options:[
      "Please retain all receipts for expense reimbursement.",
      "The office will be closed for the entire week.",
      "Remember to update your LinkedIn profile.",
      "Parking permits are available at reception."
    ],correct:0,x:"Sentence insertion: practical closing advice for business travelers attending a conference."}]},
{ id:"p6t27", type:"Memo", from:"Human Resources", to:"All Managers", subject:"New Onboarding Process",
  parts:[
    {text:"Dear managers,\n\nStarting next month, we will be rolling out a revised onboarding process for new hires. The updated program "},
    {blank:true,options:["designed","designing","was designed","has been designed"],correct:3,x:"Present perfect passive expressing recent completion: 'has been designed' (and the result is now available)."},
    {text:" to make the first week more structured and welcoming for new employees.\n\nUnder the new system, each new hire will be assigned a peer mentor for their first thirty days. "},
    {blank:true,options:["This","That","These","Those"],correct:0,x:"'This' = demonstrative pronoun referring to the singular concept just mentioned (the mentorship arrangement)."},
    {text:" is intended to provide immediate support and accelerate integration into the team. Managers "},
    {blank:true,options:["should","must","may","might"],correct:0,x:"'Should' = strong recommendation. Fits the advisory tone about scheduling check-ins."},
    {text:" also schedule weekly check-ins during the first month.\n\n"},
    {blank:true,options:[
      "The cafeteria menu will rotate on a biweekly basis.",
      "Full details will be shared during next week's management briefing.",
      "Dress code policies are currently under review.",
      "Please submit holiday requests by the end of the month."
    ],correct:1,x:"Sentence insertion: naturally closes a memo previewing a process change that requires more details."}]},
{ id:"p6t28", type:"Notice", from:"Municipal Services", to:"Local Businesses", subject:"Street Cleaning Schedule",
  parts:[
    {text:"Attention business owners,\n\nPlease be advised that Elm Street will undergo deep cleaning on the first Tuesday of every month, "},
    {blank:true,options:["start","started","starting","to start"],correct:2,x:"Present participle introducing a temporal adverbial phrase: 'starting next month'."},
    {text:" next month. Cleaning will take place between five and eight in the morning.\n\nDuring these hours, no parking "},
    {blank:true,options:["allowed","is allowed","allowing","allows"],correct:1,x:"Present passive: 'no parking is allowed'. The subject 'parking' receives the action."},
    {text:" along the entire length of the street. Vehicles found in violation will be ticketed and may be towed.\n\n"},
    {blank:true,options:["Furthermore","Although","Instead","Because"],correct:0,x:"'Furthermore' adds another piece of information. Introduces an additional request after the parking restriction."},
    {text:", we ask businesses to ensure their outdoor displays and signage are temporarily removed during cleaning hours.\n\n"},
    {blank:true,options:[
      "Your cooperation helps keep our community clean and attractive.",
      "Summer festival dates will be announced shortly.",
      "Business licenses must be renewed every two years.",
      "The town hall is hosting an open house this weekend."
    ],correct:0,x:"Sentence insertion: closes a municipal notice by appealing to civic cooperation."}]},
{ id:"p6t29", type:"Letter", from:"Bennington Publishing", to:"Mr. Callahan", subject:"Manuscript Acceptance",
  parts:[
    {text:"Dear Mr. Callahan,\n\nWe are delighted to inform you that your manuscript, 'Echoes of the Highlands,' "},
    {blank:true,options:["accepting","has been accepted","accepts","is accepting"],correct:1,x:"Present perfect passive: 'has been accepted' (the action is complete and relevant now)."},
    {text:" for publication by Bennington Press. Our editorial board was particularly impressed by your vivid descriptions and compelling characters.\n\nThe next steps involve working "},
    {blank:true,options:["closely","close","closing","closeness"],correct:0,x:"Adverb modifying the verb 'working': 'working closely'. 'Close' is an adjective."},
    {text:" with our senior editor, Margaret Holloway, who will guide you through the revision process. "},
    {blank:true,options:["During","While","Throughout","Between"],correct:2,x:"'Throughout' = from start to finish. 'Throughout this period' = over the entire duration of the editing."},
    {text:" this period, you may be asked to make adjustments to pacing, dialogue, and certain plot elements.\n\n"},
    {blank:true,options:[
      "Please note that our office hours have changed.",
      "All authors receive a complimentary tote bag.",
      "The bookstore across the street is closing permanently.",
      "Congratulations, and welcome to the Bennington family."
    ],correct:3,x:"Sentence insertion: warm closing matching the celebratory tone of an acceptance letter."}]},
{ id:"p6t30", type:"Instructions", from:"Laboratory Director", to:"Research Assistants", subject:"New Equipment Protocol",
  parts:[
    {text:"Research assistants,\n\nThe new spectrometer has arrived and is now operational. Before using it, all assistants "},
    {blank:true,options:["must complete","completing","must to complete","are completed"],correct:0,x:"Modal 'must' + base verb: 'must complete'. Expresses obligation."},
    {text:" the online certification course available on the lab portal.\n\nWhen operating the equipment, always wear the provided safety goggles and gloves, "},
    {blank:true,options:["despite","regardless","regardless of","in spite"],correct:2,x:"'Regardless of' = not taking into account. Complete prepositional phrase required before a noun."},
    {text:" the duration of your session. Even short measurements require full protective gear.\n\n"},
    {blank:true,options:["Before","After","While","Since"],correct:1,x:"'After' each use — chronological instruction for post-use procedure."},
    {text:" each use, please log your session in the shared tracking sheet and report any irregularities to the senior technician.\n\n"},
    {blank:true,options:[
      "Lab coats are available in the supply closet.",
      "Several new interns will join the team in June.",
      "Failure to follow these protocols may result in equipment damage or injury.",
      "The cafeteria now offers vegetarian options daily."
    ],correct:2,x:"Sentence insertion: reinforces safety instructions with a clear warning about consequences."}]}
];