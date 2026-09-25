// Proto « monde service client » (2026-09-25) — le script d'une journée au service client d'un grand magasin.
// Même principe que prototypes/office-day/ et travel-day/ : aucun contenu neuf, chaque tâche pointe un item existant
// (P3, P4, P7) et ne fait que l'habiller. Les questions restent celles du TOEIC.
//   at / due / ringFor / afterDone : voir prototypes/office-day/day.js
//   customer   un contact client (variante S1 : le client laisse une note, de 1 à 5 étoiles)
//   briefing   le point du matin sur les clients difficiles (variante S2 : sa compréhension décide de la suite)
//   angryHit   le client mécontent (S2 : briefé = il repart calmé, +15 rep ; sinon on appelle la responsable, +45 min)
// Habillage des P3 GÉNÉRIQUE (« A customer at the counter », « On the support line ») : un sujet tiré du contenu
// trahirait la Q1 (« Why is the man calling? »).
import { LISTENING_P3, LISTENING_P4 } from "../../src/data/listening.js";
import { PART7_PASSAGES } from "../../src/data/part7.js";

export var COMPANY = "Halden & Co.";
export var DAY_START = 9 * 60, DAY_LEN = 8 * 60;

export var PEOPLE = {
  dana: { name: "Priya Shah", role: "Customer care manager", initials: "PS", hue: 330 },
};

export var GRADES = [
  { id: "intern", name: "Intern", rep: 0 },
  { id: "junior", name: "Junior Associate", rep: 100, unlock: "The phone line, not just the counter" },
  { id: "associate", name: "Associate", rep: 250, unlock: "Double-document files (order + invoice)" },
  { id: "senior", name: "Senior Associate", rep: 500, unlock: "Business clients" },
  { id: "lead", name: "Team Lead", rep: 900, unlock: "Triple-document files" },
  { id: "manager", name: "Manager", rep: 1400, unlock: "Handle the escalations" },
  { id: "director", name: "Director", rep: 2200, unlock: "Your name on the store" },
];
export var REP_PER_CORRECT = 4, REP_PER_TASK = 6;
export var CALM_BONUS = 15, CALM_DELAY = 45;

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
// Parts 4 en direct (annonce au micro du magasin, point du matin) : ça commence, puis c'est manqué.
function live(id, t) {
  var it = p4(id);
  return Object.assign({ kind: t.kind || "announce", part: "p4", talkType: it.type, text: it.text, qs: it.qs.map(norm),
    audio: ["/audio/p4/" + id + ".mp3"] }, t);
}

export var DAY = {
  weekday: "Saturday",
  brief: "Morning! Saturday, so the store will be packed. Join the huddle at nine: I'm going over difficult customers, " +
    "and believe me, we'll get one today. There's also a complaint letter on your desk from yesterday.",
  tasks: [
    live("p4_94", { id: "t1", kind: "briefing", from: "Morning huddle · Priya", subject: "Handling difficult customers",
      ask: { who: "dana", text: "The huddle is starting. Come and listen." }, at: 0, ringFor: 45, afterDone: 0, briefing: true }),
    doc("p7p53", { id: "t2", from: "Customer letter", subject: "A complaint about an order",
      ask: { who: "dana", text: "Read it before the customer calls back." }, at: 0, due: 150, afterDone: 0, customer: true }),
    call("p3_35", { id: "t3", kind: "counter", from: "At the counter", subject: "A customer at the counter",
      ask: { who: "dana", text: "A customer is waiting at the counter." }, at: 60, ringFor: 30, afterDone: 1, customer: true }),
    call("p3_57", { id: "t4", from: "Support line", subject: "An unhappy customer on the line",
      ask: { who: "dana", text: "This one sounds upset. Pick up." }, at: 150, ringFor: 30, afterDone: 2, customer: true, angryHit: true }),
    live("p4_56", { id: "t5", from: "Store PA · Announcement", subject: "An announcement to shoppers",
      ask: { who: "dana", text: "Listen: customers will ask you about this." }, at: 210, ringFor: 30, afterDone: 3 }),
    doc("p7p15", { id: "t6", from: "Apex Home Electronics", subject: "A reply about a warranty",
      ask: { who: "dana", text: "The manufacturer answered. Check what they cover." }, at: 240, due: 420, afterDone: 4 }),
  ],
};
