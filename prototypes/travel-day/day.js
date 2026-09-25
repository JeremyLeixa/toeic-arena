// Proto « monde voyage » (2026-09-25) — le script d'une journée : un déplacement d'affaires à Chicago.
// Même principe que prototypes/office-day/ : aucun contenu neuf, chaque tâche pointe un item existant (P3, P4, P7)
// et ne fait que l'habiller. Les questions restent celles du TOEIC.
//   at / due / ringFor / afterDone : voir prototypes/office-day/day.js
//   forecast   le bulletin météo du matin (sa compréhension décide de la suite en variante V2)
//   weatherHit l'annonce de retard causée par le mauvais temps (V2 : paré = bonus, pas paré = coincé 45 min)
import { LISTENING_P3, LISTENING_P4 } from "../../src/data/listening.js";
import { PART7_PASSAGES } from "../../src/data/part7.js";

export var COMPANY = "Business trip · Chicago";
export var DAY_START = 9 * 60, DAY_LEN = 8 * 60;

export var PEOPLE = {
  dana: { name: "Maya Ortiz", role: "Travel coordinator", initials: "MO", hue: 170 },
  marcus: { name: "Maya Ortiz", role: "Travel coordinator", initials: "MO", hue: 170 },
};

export var GRADES = [
  { id: "intern", name: "Intern", rep: 0 },
  { id: "junior", name: "Junior Associate", rep: 100, unlock: "Longer trips, connecting flights" },
  { id: "associate", name: "Associate", rep: 250, unlock: "Double-document files (itinerary + hotel)" },
  { id: "senior", name: "Senior Associate", rep: 500, unlock: "International trips" },
  { id: "lead", name: "Team Lead", rep: 900, unlock: "Triple-document files" },
  { id: "manager", name: "Manager", rep: 1400, unlock: "Organise the team's trips" },
  { id: "director", name: "Director", rep: 2200, unlock: "First class" },
];
export var REP_PER_CORRECT = 4, REP_PER_TASK = 6;
export var WEATHER_BONUS = 15, WEATHER_DELAY = 45;

function p3(id) { return LISTENING_P3.find(function (x) { return x.id === id; }); }
function p4(id) { return LISTENING_P4.find(function (x) { return x.id === id; }); }
function p7(id) { return PART7_PASSAGES.find(function (x) { return x.id === id; }); }
function norm(q) { return { q: q.q, opts: q.opts || q.options, c: q.c != null ? q.c : q.correct, x: q.x || "" }; }

function doc(id, t) {
  var it = p7(id);
  return Object.assign({ kind: "doc", part: "p7", docType: it.type, text: it.text, qs: it.questions.map(norm) }, t);
}
function call(id, t) {
  var it = p3(id);
  return Object.assign({ kind: t.kind || "call", part: "p3", lines: it.lines, qs: it.qs.map(norm),
    audio: it.lines.map(function (_, i) { return "/audio/p3/" + id + "_line" + i + ".mp3"; }) }, t);
}
// Parts 4 en direct (annonce en aérogare, bulletin à la radio) : ça sonne, puis c'est manqué.
function live(id, t) {
  var it = p4(id);
  return Object.assign({ kind: t.kind || "announce", part: "p4", talkType: it.type, text: it.text, qs: it.qs.map(norm),
    audio: ["/audio/p4/" + id + ".mp3"] }, t);
}

export var DAY = {
  weekday: "Tuesday",
  brief: "Morning! Big day: your flight to Chicago leaves this afternoon. The itinerary is in your inbox, check the times before you head out. " +
    "And listen to the forecast on the radio: they're talking about heavy rain.",
  forecastLabel: "Heavy rain",
  tasks: [
    live("p4_74", { id: "t1", kind: "forecast", from: "Radio · Morning forecast", subject: "Today's weather",
      ask: { who: "dana", text: "Catch the forecast before you leave." }, at: 0, ringFor: 45, afterDone: 0, forecast: true }),
    doc("p7p59", { id: "t2", from: "Horizon Travel", subject: "Your business trip itinerary",
      ask: { who: "dana", text: "Check your flight times before you head out." }, at: 0, due: 150, afterDone: 0 }),
    call("p3_40", { id: "t3", from: "Taxi desk", subject: "Booking a ride to the airport",
      ask: { who: "dana", text: "The taxi desk is on the phone. Listen in." }, at: 60, ringFor: 30, afterDone: 1 }),
    live("p4_02", { id: "t4", from: "Terminal 2 · Announcement", subject: "Your flight",
      ask: { who: "dana", text: "An announcement about the flights. Listen!" }, at: 150, ringFor: 30, afterDone: 2, weatherHit: true }),
    call("p3_72", { id: "t5", kind: "chat", from: "Two travellers", subject: "At the departures board",
      ask: { who: "dana", text: "Other passengers are talking about the delays." }, at: 210, ringFor: 30, afterDone: 3 }),
    doc("p7p46", { id: "t6", from: "TravelWithLena", subject: "Reviews of your hotel",
      ask: { who: "dana", text: "Have a look at your hotel before you land." }, at: 240, due: 420, afterDone: 4 }),
  ],
};
