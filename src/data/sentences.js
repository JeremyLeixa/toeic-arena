// ─── SENTENCE BUILDER DATA (50 TOEIC-style sentences) ───
// Each sentence is split into logical chunks for tap-to-order
// cat: grammar category targeted

export var SENTENCES = [
  // ── Tenses ──
  {s:"The company has expanded into three new markets since January.",chunks:["The company","has expanded","into three new markets","since January."],cat:"Tenses"},
  {s:"Sales figures will be released at the end of the quarter.",chunks:["Sales figures","will be released","at the end","of the quarter."],cat:"Tenses"},
  {s:"The manager had already left when the client called.",chunks:["The manager","had already left","when the client","called."],cat:"Tenses"},
  {s:"We have been negotiating the contract for several weeks.",chunks:["We have been","negotiating the contract","for several","weeks."],cat:"Tenses"},
  {s:"By next month, the team will have completed the audit.",chunks:["By next month,","the team","will have completed","the audit."],cat:"Tenses"},

  // ── Passive Voice ──
  {s:"The proposal was approved by the board of directors.",chunks:["The proposal","was approved","by the board","of directors."],cat:"Passive Voice"},
  {s:"All employees are required to attend the safety training.",chunks:["All employees","are required","to attend","the safety training."],cat:"Passive Voice"},
  {s:"The new policy will be implemented starting next Monday.",chunks:["The new policy","will be implemented","starting","next Monday."],cat:"Passive Voice"},
  {s:"The results were announced during the annual conference.",chunks:["The results","were announced","during the annual","conference."],cat:"Passive Voice"},
  {s:"Applications must be submitted before the deadline.",chunks:["Applications","must be submitted","before","the deadline."],cat:"Passive Voice"},

  // ── Subject-Verb Agreement ──
  {s:"The number of complaints has decreased significantly this year.",chunks:["The number of complaints","has decreased","significantly","this year."],cat:"Subject-Verb Agreement"},
  {s:"Each of the managers is responsible for their department.",chunks:["Each of the managers","is responsible","for their","department."],cat:"Subject-Verb Agreement"},
  {s:"The staff in both offices have received the new guidelines.",chunks:["The staff","in both offices","have received","the new guidelines."],cat:"Subject-Verb Agreement"},

  // ── Word Order (adjectives, adverbs) ──
  {s:"The recently hired marketing director presented a detailed report.",chunks:["The recently hired","marketing director","presented","a detailed report."],cat:"Word Order"},
  {s:"We urgently need to find a more cost-effective solution.",chunks:["We urgently need","to find","a more cost-effective","solution."],cat:"Word Order"},
  {s:"The highly anticipated product launch was postponed indefinitely.",chunks:["The highly anticipated","product launch","was postponed","indefinitely."],cat:"Word Order"},
  {s:"She carefully reviewed all the financial documents before signing.",chunks:["She carefully reviewed","all the financial documents","before","signing."],cat:"Word Order"},
  {s:"An extremely competitive salary package is being offered to candidates.",chunks:["An extremely competitive","salary package","is being offered","to candidates."],cat:"Word Order"},

  // ── Connectors ──
  {s:"Although the project was delayed, the team delivered excellent results.",chunks:["Although","the project was delayed,","the team delivered","excellent results."],cat:"Connectors"},
  {s:"Due to the increase in demand, we need to hire additional staff.",chunks:["Due to","the increase in demand,","we need to hire","additional staff."],cat:"Connectors"},
  {s:"The budget was reduced; however, productivity remained high.",chunks:["The budget was reduced;","however,","productivity","remained high."],cat:"Connectors"},
  {s:"In addition to the base salary, employees receive annual bonuses.",chunks:["In addition to","the base salary,","employees receive","annual bonuses."],cat:"Connectors"},
  {s:"Unless the client confirms by Friday, we will cancel the order.",chunks:["Unless the client","confirms by Friday,","we will cancel","the order."],cat:"Connectors"},

  // ── Prepositions ──
  {s:"The manager is responsible for overseeing the entire department.",chunks:["The manager","is responsible for","overseeing","the entire department."],cat:"Prepositions"},
  {s:"Please respond to this email prior to the end of the week.",chunks:["Please respond","to this email","prior to","the end of the week."],cat:"Prepositions"},
  {s:"The company specializes in providing customized software solutions.",chunks:["The company","specializes in","providing customized","software solutions."],cat:"Prepositions"},
  {s:"All participants must comply with the safety regulations at all times.",chunks:["All participants","must comply with","the safety regulations","at all times."],cat:"Prepositions"},

  // ── Relative Clauses ──
  {s:"The consultant who was hired last month has already resigned.",chunks:["The consultant","who was hired last month","has already","resigned."],cat:"Relative Clauses"},
  {s:"The building where the conference will be held is near the station.",chunks:["The building","where the conference","will be held","is near the station."],cat:"Relative Clauses"},
  {s:"Employees whose contracts expire in June must reapply immediately.",chunks:["Employees whose contracts","expire in June","must reapply","immediately."],cat:"Relative Clauses"},

  // ── Conditionals ──
  {s:"If the shipment arrives on time, we can begin production next week.",chunks:["If the shipment","arrives on time,","we can begin production","next week."],cat:"Conditionals"},
  {s:"Had we known about the issue earlier, we would have fixed it.",chunks:["Had we known","about the issue earlier,","we would have","fixed it."],cat:"Conditionals"},
  {s:"Should you have any questions, please do not hesitate to contact us.",chunks:["Should you have","any questions,","please do not hesitate","to contact us."],cat:"Conditionals"},

  // ── Gerund / Infinitive ──
  {s:"The board decided to postpone approving the new budget proposal.",chunks:["The board decided","to postpone","approving","the new budget proposal."],cat:"Gerund/Infinitive"},
  {s:"We look forward to receiving your feedback on the proposal.",chunks:["We look forward to","receiving your feedback","on the","proposal."],cat:"Gerund/Infinitive"},
  {s:"The company avoided losing market share by investing in innovation.",chunks:["The company avoided","losing market share","by investing","in innovation."],cat:"Gerund/Infinitive"},

  // ── Comparatives / Superlatives ──
  {s:"This year's revenue is significantly higher than last year's.",chunks:["This year's revenue","is significantly higher","than","last year's."],cat:"Comparatives"},
  {s:"The new model is the most energy-efficient product in our range.",chunks:["The new model","is the most energy-efficient","product","in our range."],cat:"Comparatives"},
  {s:"The earlier you submit the application, the sooner it will be processed.",chunks:["The earlier you submit","the application,","the sooner it will","be processed."],cat:"Comparatives"},

  // ── Articles / Determiners ──
  {s:"An announcement regarding the merger will be made on Monday.",chunks:["An announcement","regarding the merger","will be made","on Monday."],cat:"Articles"},
  {s:"The information provided in the brochure is no longer accurate.",chunks:["The information","provided in the brochure","is no longer","accurate."],cat:"Articles"},

  // ── Complex Business Sentences ──
  {s:"Following a thorough review, the committee approved the revised proposal.",chunks:["Following","a thorough review,","the committee approved","the revised proposal."],cat:"Complex"},
  {s:"Applicants with at least five years of experience are encouraged to apply.",chunks:["Applicants","with at least five years","of experience","are encouraged to apply."],cat:"Complex"},
  {s:"The workshop scheduled for next Tuesday has been relocated to Room 305.",chunks:["The workshop","scheduled for next Tuesday","has been relocated","to Room 305."],cat:"Complex"},
  {s:"In order to reduce costs, the company decided to outsource production.",chunks:["In order to reduce costs,","the company decided","to outsource","production."],cat:"Complex"},
  {s:"Customers who purchased the item before March are eligible for a refund.",chunks:["Customers who purchased","the item before March","are eligible","for a refund."],cat:"Complex"},
  {s:"The report submitted by the finance team contained several inaccuracies.",chunks:["The report","submitted by the finance team","contained","several inaccuracies."],cat:"Complex"},
  {s:"Despite the challenging market conditions, profits exceeded expectations.",chunks:["Despite","the challenging market conditions,","profits exceeded","expectations."],cat:"Complex"},
  {s:"Ms. Chen was appointed as the new regional director effective immediately.",chunks:["Ms. Chen was appointed","as the new","regional director","effective immediately."],cat:"Complex"},
  {s:"All attendees are kindly requested to switch off their mobile devices.",chunks:["All attendees","are kindly requested","to switch off","their mobile devices."],cat:"Complex"},
];
