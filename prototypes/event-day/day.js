// Proto « monde événements » (2026-09-25) — le script d'une journée à l'agence Lumen Events : plusieurs clients en
// parallèle (le vivier mêle un gala, un départ à la retraite, un sommet : on ne prétend jamais que c'est le même), et
// l'événement du soir à 16:00.
// Même principe que prototypes/office-day/, travel-day/ et service-day/ : aucun contenu neuf, chaque tâche pointe un
// item existant (P3, P4, P7) et ne fait que l'habiller. Les questions restent celles du TOEIC.
//   at / due / ringFor / afterDone : voir prototypes/office-day/day.js
//   check      une ligne de la checklist (variante E1) : cochée si la tâche est rendue sans faute
//   finale     l'événement lui-même, en fin de journée (E1 : la checklist décide du bonus)
//   prep       le déroulé de la soirée à lire le matin (E2 : sa compréhension décide de la suite)
//   prepHit    le pépin de dernière minute (E2 : lu en entier = réglé en quelques minutes, +15 rep ; sinon +45 min)
// Habillage GÉNÉRIQUE : jamais la nature de l'événement (p3_58 : « What kind of event is being planned? », p4_20 :
// « What event is taking place? »). On dit « the event », « tonight », jamais « gala » ou « awards ».
import { LISTENING_P3, LISTENING_P4 } from "../../src/data/listening.js";
import { PART7_PASSAGES } from "../../src/data/part7.js";

export var COMPANY = "Lumen Events";
export var DAY_START = 9 * 60, DAY_LEN = 8 * 60;

export var PEOPLE = {
  dana: { name: "Theo Marchetti", role: "Senior event planner", initials: "TM", hue: 40 },
};

export var GRADES = [
  { id: "intern", name: "Intern", rep: 0 },
  { id: "junior", name: "Junior Associate", rep: 100, unlock: "Your own suppliers to call" },
  { id: "associate", name: "Associate", rep: 250, unlock: "Double-document files (program + venue)" },
  { id: "senior", name: "Senior Associate", rep: 500, unlock: "Trade shows" },
  { id: "lead", name: "Team Lead", rep: 900, unlock: "Triple-document files" },
  { id: "manager", name: "Manager", rep: 1400, unlock: "Run the evening yourself" },
  { id: "director", name: "Director", rep: 2200, unlock: "Your name on the invitation" },
];
export var REP_PER_CORRECT = 4, REP_PER_TASK = 6;
export var CHECK_BONUS = 5;                   // E1 : par ligne cochée quand l'événement commence
export var PREP_BONUS = 15, PREP_DELAY = 45;  // E2 : la règle de Jet Lag et Front Desk, telle quelle

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
function live(id, t) {
  var it = p4(id);
  return Object.assign({ kind: t.kind || "announce", part: "p4", talkType: it.type, text: it.text, qs: it.qs.map(norm),
    audio: ["/audio/p4/" + id + ".mp3"] }, t);
}

export var DAY = {
  weekday: "Thursday",
  brief: "Morning! Busy day: three clients on the go, and tonight's event opens its doors at 16:00. " +
    "The run of show is in your inbox, read it first. Then venue, catering, decor, guest list: clear your list before the doors open.",
  checklist: [
    { id: "venue", label: "Venue" }, { id: "catering", label: "Catering" }, { id: "decor", label: "Decor" }, { id: "guests", label: "Guest list" },
  ],
  tasks: [
    doc("p7p8", { id: "t1", from: "Conference coordinator", subject: "The run of show",
      ask: { who: "dana", text: "Read this first: the whole evening depends on it." }, at: 0, due: 150, afterDone: 0, prep: true }),
    call("p3_58", { id: "t2", from: "Venue · On the phone", subject: "A call about a venue",
      ask: { who: "dana", text: "The venue is calling back. Listen in." }, at: 60, ringFor: 30, afterDone: 1, check: "venue" }),
    call("p3_77", { id: "t3", kind: "chat", from: "Two colleagues", subject: "A chat about the food",
      ask: { who: "dana", text: "The team is talking catering. Catch the details." }, at: 100, ringFor: 30, afterDone: 1, check: "catering" }),
    call("p3_39", { id: "t4", kind: "chat", from: "Setup crew", subject: "A problem on site",
      ask: { who: "dana", text: "Something's wrong on site. Go and see." }, at: 150, ringFor: 30, afterDone: 2, check: "decor", prepHit: true }),
    doc("p7p69", { id: "t5", from: "Team chat", subject: "Messages about tonight's numbers",
      ask: { who: "dana", text: "The guest count moved again. Check the thread." }, at: 210, due: 360, afterDone: 3, check: "guests" }),
    live("p4_20", { id: "t6", kind: "finale", from: "Main hall · Tonight", subject: "The event is starting",
      ask: { who: "dana", text: "Doors are open. Go and listen to the opening." }, at: 420, ringFor: 45, afterDone: 4, finale: true }),
  ],
};
