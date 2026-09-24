// Proto « journée au bureau » — le script d'une journée.
// Aucun contenu neuf : chaque tâche pointe un item existant (P3, P4, P7) et ne fait que l'habiller
// (qui l'envoie, pourquoi, pour quand). Questions, options et explications restent celles du TOEIC.
//   at        minute de jeu où la tâche arrive (0 = 9:00) — variantes à horloge
//   due       échéance (minute de jeu) des documents et du vocal ; null = pas d'échéance
//   ringFor   minutes pendant lesquelles un appel ou une conversation attend avant d'être manqué
//   afterDone variante sans horloge : la tâche arrive quand ce nombre de tâches est traité
import { LISTENING_P3, LISTENING_P4 } from "../../src/data/listening.js";
import { PART7_PASSAGES } from "../../src/data/part7.js";

export var COMPANY = "Meridian Harbor Group";
export var DAY_START = 9 * 60, DAY_LEN = 8 * 60; // 9:00 → 17:00

export var PEOPLE = {
  dana: { name: "Dana Whitfield", role: "Your manager", initials: "DW", hue: 214 },
  marcus: { name: "Marcus Bell", role: "Support desk", initials: "MB", hue: 28 },
};

// Grades de la variante carrière. La réputation ne baisse jamais (leçon de Mimic Hunt : un compteur
// qui recule fait lâcher le module) ; une tâche manquée ne rapporte simplement rien.
export var GRADES = [
  { id: "intern", name: "Intern", rep: 0 },
  { id: "junior", name: "Junior Associate", rep: 100, unlock: "Two-speaker calls on speaker" },
  { id: "associate", name: "Associate", rep: 250, unlock: "Double-document tasks (email + schedule)" },
  { id: "senior", name: "Senior Associate", rep: 500, unlock: "Three-speaker meetings" },
  { id: "lead", name: "Team Lead", rep: 900, unlock: "Triple-document cases" },
  { id: "manager", name: "Manager", rep: 1400, unlock: "Your own team's inbox" },
  { id: "director", name: "Director", rep: 2200, unlock: "Board meetings" },
];
export var REP_PER_CORRECT = 4, REP_PER_TASK = 6;

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
function voicemail(id, t) {
  var it = p4(id);
  return Object.assign({ kind: "voicemail", part: "p4", talkType: it.type, text: it.text, qs: it.qs.map(norm),
    audio: ["/audio/p4/" + id + ".mp3"] }, t);
}

export var DAY = {
  weekday: "Tuesday",
  brief: "Morning! Busy one today. HR sent a memo about the new hiring process: I need the key dates before lunch. " +
    "The events team will be around the coffee machine at some point, they're sorting out the trade show. " +
    "And Karen from Summit Consulting may leave you a message about Wednesday.",
  tasks: [
    doc("p7p1", { id: "t1", from: "Sarah Chen · HR Director", subject: "New Hiring Procedures",
      ask: { who: "dana", text: "Key dates before lunch, please." }, at: 0, due: 180, afterDone: 0 }),
    doc("p7p4", { id: "t2", from: "Facilities", subject: "Annual Company Picnic",
      ask: { who: "dana", text: "Can you check the RSVP details? No rush." }, at: 0, due: 480, afterDone: 0 }),
    call("p3_01", { id: "t3", kind: "chat", from: "Two colleagues · Events team", subject: "Trade show booth",
      ask: { who: "dana", text: "The events team is at the coffee machine. Go and catch what's changed." },
      at: 60, ringFor: 30, afterDone: 1 }),
    voicemail("p4_01", { id: "t4", from: "Karen · Summit Consulting", subject: "Wednesday meeting",
      ask: { who: "dana", text: "Karen left you a message. What does she need from us?" },
      at: 210, due: 360, afterDone: 2 }),
    call("p3_04", { id: "t5", from: "Marcus Bell · Support desk", subject: "Customer on the line, late order",
      ask: { who: "marcus", text: "Customer on speaker, can you listen in with me?" },
      at: 300, ringFor: 20, afterDone: 3 }),
  ],
};
