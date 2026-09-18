// Résolution d'une référence du bestiaire vers sa question (2026-09-17). PUR, mais LOURD : il importe
// les banques de questions (grammar, listening, part6, part7). À charger À LA DEMANDE — `lib/review.js`
// reste sans données pour que le Mentor et App() ne tirent pas listening.js dans le bundle principal.
//
// Ce que ça garantit : la référence désigne l'ITEM, jamais une option. Les questions d'écoute sont
// REPERMUTÉES à chaque résolution (shufListeningItem) — l'élève ne réapprend pas « c'était B », et
// l'explication suit la permutation. La lettre entendue reste celle de la position affichée (`aud`).
import { QUESTIONS } from "../data/grammar.js";
import { LISTENING_P1, LISTENING_P2, LISTENING_P3, LISTENING_P4 } from "../data/listening.js";
import { PART6_TEXTS } from "../data/part6.js";
import { PART7_PASSAGES } from "../data/part7.js";
import { shufListeningItem } from "./listeningShuffle.js";
import { refParts } from "./review.js";

// Modules qui puisent dans la banque de grammaire : une erreur de Drill peut revenir par la chasse,
// même si elle a été commise dans le Daily Challenge ou l'Exam Simulation.
var GRAMMAR_MODS = { drill: 1, daily: 1, timesim: 1, game_wordFall: 1 };
var byId = function (arr, id) { return arr.find(function (x) { return x.id === id; }); };

// Rend null si la référence ne peut pas être reposée (module pas encore couvert, contenu supprimé) :
// l'appelant saute la créature, il ne plante pas.
export function lookupRef(k) {
  var r = refParts(k), qi = r.sub === null ? null : parseInt(r.sub, 10);
  if (GRAMMAR_MODS[r.mod]) {
    var q = byId(QUESTIONS, r.id);
    if (!q) return null;
    return { k: k, mod: r.mod, kind: "text", part: "p5", cat: q.cat, label: q.cat,
      prompt: q.s, options: q.o, c: q.c, why: q.x };
  }
  if (r.mod === "lisP1") {
    var p1 = byId(LISTENING_P1, r.id);
    if (!p1) return null;
    var s1 = shufListeningItem(p1);
    // `title` : la ligne du bestiaire (Mentor, « The Lair »). Jamais la bonne phrase : elle gâcherait la chasse.
    return { k: k, mod: r.mod, kind: "photo", part: "p1", label: "Part 1 — Photographs",
      title: "Photograph no. " + p1.id.replace(/^p1_/, ""),
      prompt: "Which statement describes the photo?", img: p1.img, blind: true,
      options: s1.opts, c: s1.c, why: s1.x, audio: { kind: "p1", id: p1.id, aud: s1.aud } };
  }
  if (r.mod === "lisP2") {
    var p2 = byId(LISTENING_P2, r.id);
    if (!p2) return null;
    var s2 = shufListeningItem(p2);
    // `title` : la question entendue (elle ne dit pas la réponse), pour reconnaître la créature.
    return { k: k, mod: r.mod, kind: "audio", part: "p2", label: "Part 2 — Question-Response",
      title: p2.q ? "“" + p2.q + "”" : "A Part 2 question",
      prompt: "Choose the best response.", blind: true,
      options: s2.opts, c: s2.c, why: s2.x, audio: { kind: "p2", id: p2.id, aud: s2.aud } };
  }
  if (r.mod === "lisP3" || r.mod === "lisP4") {
    var pool = r.mod === "lisP3" ? LISTENING_P3 : LISTENING_P4;
    var it = byId(pool, r.id), sub = it && it.qs[qi];
    if (!sub) return null;
    var s34 = shufListeningItem(sub);
    return { k: k, mod: r.mod, kind: "audio", part: r.mod === "lisP3" ? "p3" : "p4",
      label: r.mod === "lisP3" ? "Part 3 — Conversations" : "Part 4 — Talks",
      prompt: sub.q, options: s34.opts, c: s34.c, why: s34.x || "",
      graphic: sub.graphic || null,
      audio: { kind: r.mod === "lisP3" ? "p3" : "p4", id: it.id, lines: (it.lines || []).length, qi: qi } };
  }
  if (r.mod === "p6") {
    var t6 = byId(PART6_TEXTS, r.id);
    if (!t6) return null;
    // qi = index du TROU dans le texte (les trous gardent leur ordre dans `parts`).
    var blanks = t6.parts.filter(function (x) { return x.blank; });
    var b = blanks[qi];
    if (!b) return null;
    var txt = p6Text(t6, qi), at = txt.indexOf("_____");
    return { k: k, mod: r.mod, kind: "passage", part: "p6", label: "Part 6 — " + t6.type,
      // `title` : l'extrait autour du trou, pour reconnaître la créature dans le bestiaire.
      title: "…" + txt.slice(Math.max(0, at - 50), at).replace(/\s+/g, " ").trimStart() + "_____" + txt.slice(at + 5, at + 35).replace(/\s+/g, " ") + "…",
      // Pas de « blank 3 » : les autres trous sont rendus remplis, il n'en reste qu'un à l'écran.
      prompt: "Choose the best option to fill the blank.", options: b.options, c: b.correct, why: b.x,
      passage: { id: t6.id, type: t6.type, text: txt } };
  }
  if (r.mod === "p7") {
    var ps = byId(PART7_PASSAGES, r.id), pq = ps && ps.questions[qi];
    if (!pq) return null;
    return { k: k, mod: r.mod, kind: "passage", part: "p7", label: "Part 7 — " + ps.type,
      prompt: pq.q, options: pq.options, c: pq.correct, why: pq.x,
      passage: { id: ps.id, type: ps.type, text: ps.text } };
  }
  return null;
}
// Le texte d'un Part 6 avec ses trous, celui qu'on repose marqué.
function p6Text(t6, target) {
  var n = -1;
  return t6.parts.map(function (p) {
    if (!p.blank) return p.text;
    n++;
    return n === target ? " _____ " : " " + (p.options ? p.options[p.correct] : "_____") + " ";
  }).join("");
}
// Libellé court d'un groupe du bestiaire (catégorie, support, ou partie).
export function groupLabel(g) {
  if (g.cat) return g.cat;
  if (g.key.indexOf("doc:") === 0) {
    var r = refParts(g.items[0].k);
    var doc = r.mod === "p7" ? byId(PART7_PASSAGES, r.id) : r.mod === "p6" ? byId(PART6_TEXTS, r.id)
      : r.mod === "lisP3" ? byId(LISTENING_P3, r.id) : r.mod === "lisP4" ? byId(LISTENING_P4, r.id) : null;
    var part = r.mod === "p7" ? "Part 7" : r.mod === "p6" ? "Part 6" : r.mod === "lisP3" ? "Part 3" : "Part 4";
    return part + (doc && doc.type ? " · " + doc.type : "");
  }
  var p = g.part || "";
  return { p1: "Part 1", p2: "Part 2", p3: "Part 3", p4: "Part 4", p5: "Grammar", p6: "Part 6", p7: "Part 7" }[p] || "Other";
}
